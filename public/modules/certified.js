const PDFKit = require('pdfkit');
const fs = require('fs');
const zipFolder = require('zip-folder');
// const path = require('path');
// const mime = require('mime');
// const crypto = require('crypto');

const keys = ["Serra.Henrique", "=Certify@TecnoJr"];
const keysCompany = ["Henrique Serra", "TecnoJr"];
const CompanyAccess = [0, 0];
// Verifica se o diretório existe, se não cria o diretório
checkDirectorySync = (directory) => {
  try {
    fs.statSync(directory);
    return true;
  } catch (e) {
    console.log("Diretório não existe. Tentando criar diretório...");
    try {
      fs.mkdirSync(directory);
      return true
    }
    catch (e1) {
      console.log(e);
      console.log(e1);
      return false;
    }
  }
}
checkDPI = (dpi, layout) => {
  let arrDPI = [72, 96, 150, 300];
  let value;
  arrDPI.map((val, index) => {
    if (parseInt(dpi) === val) {
      value = val
    }
  })
  if (layout === 'portrait') {
    switch (value) {
      case 72:
        return { width: 595, height: 842 }
      case 96:
        return { width: 794, height: 1123 }
      case 150:
        return { width: 1240, height: 1754 }
      case 300:
        return { width: 2480, height: 3508 }
      default:
        return { width: null, height: null }
    }
  } else {

    switch (value) {
      case 72:
        return { width: 842, height: 595 }
      case 96:
        return { width: 1123, height: 794 }
      case 150:
        return { width: 1754, height: 1240 }
      case 300:
        return { width: 3508, height: 2480 }
      default:
        return { width: null, height: null }
    }
  }

}
checkMarginDPI = (dpi, layout) => {
  let arrDPI = [72, 96, 150, 300];
  let value;
  let comp;
  arrDPI.map((val) => {
    if (parseInt(dpi) === val) {
      value = val

    }
  })
  if (layout === 'portrait') {
    switch (value) {
      case 72:
        comp = { width: 595, height: 842, font: 18 }
        break;
      case 96:
        comp = { width: 794, height: 1123, font: 20 }
        break;
      case 150:
        comp = { width: 1240, height: 1754, font: 35 }
        break;
      case 300:
        comp = { width: 2480, height: 3508, font: 60 }
        break;
      default:
        comp = { width: null, height: null, font: null }
        break;
    }
  } else {

    switch (value) {
      case 72:
        comp = { width: 842, height: 595, font: 18 }
        break;
      case 96:
        comp = { width: 1123, height: 794, font: 20 }
        break;
      case 150:
        comp = { width: 1754, height: 1240, font: 35 }
        break;
      case 300:
        comp = { width: 3508, height: 2480, font: 60 }
        break;
      default:
        comp = { width: null, height: null }
        break;

    }
  }
  return { bottomTop: parseInt((comp.height * 3.5) / 10), leftright: parseInt((comp.width) / 10), fontSize: comp.font }
}
const generate = (req, res, next) => {
  var { content, config } = req.body;
  const image = req.file;

  var config_json = JSON.parse(config);
  var content_json = JSON.parse(content);
  let valid = false;
  let chave;
  //Verifica se o User e a senha são compativeis 
  keysCompany.map((value, idx) => {
    if (value == content_json.company) {
      if (keys[idx] == content_json.acessKey) {
        valid = true
        chave = idx
      }
    }
  })
  if (!valid) {
    res.status(406).send('Not Acceptable key or company');
    res.end();
  } else {
    CompanyAccess[chave]++
    console.log(CompanyAccess[chave]);

    let { width, height } = checkDPI(config_json.dpi, config_json.layout)
    let { bottomTop, leftright, fontSize } = checkMarginDPI(config_json.dpi, config_json.layout)

    const pdf_config = {
      size: [
        height,
        width
      ],
      margins: { // by default, all are 72
        top: bottomTop,
        bottom: bottomTop,
        left: leftright,
        right: leftright
      },
      layout: config_json.layout, // can be 'portrait'
      info: {
        Title: 'Api de Certificados',
        Author: 'Henrique A. Serra', // the name of the author
        Keywords: 'pdf;javascript' // keywords associated with the document
      }
    }
    let companyClear = content_json.company.replace(/ /, '')
    // let company = crypto.createHash('sha256').update(content_json.company);
    let checkDiretory = checkDirectorySync(`${__dirname}/../certified/${companyClear}`);
    if (checkDiretory) {
      let checkSubDiretory = checkDirectorySync(`${__dirname}/../certified/${companyClear}/${CompanyAccess[chave]}`);
      if (checkSubDiretory) {
        for (let key = 0; key < content_json.info.length; key++) {
          let pdf = new PDFKit(pdf_config);
          let text = content_json.text
            .replace(/%name/g, JSON.parse(content_json.info[key]).name)
            .replace(/%cpf/g, JSON.parse(content_json.info[key]).cpf)
            .replace(/%team/g, JSON.parse(content_json.info[key]).team)
            .replace(/%time/g, JSON.parse(content_json.info[key]).workload);
          console.log(text);
          // Put image and Text in certified
          pdf.fontSize(fontSize)
            .image(image.buffer, 0, 0, { scale: 1 })
            .fillColor('white')
            .text(text, leftright, bottomTop, { align: 'justify' });
          //.addPage()

          // Remove spacebar in name
          let name_pdf = JSON.parse(content_json.info[key]).name.replace(/\s/g, '');
          console.log(`Criando certificado ${key + 1}...`);

          pdf.pipe(fs.createWriteStream(`${__dirname}/../certified/${companyClear}/${CompanyAccess[chave]}/${key}-${name_pdf}.pdf`));
          console.log(`Gerado certificado ${key + 1}`);
          pdf.end();
        }
        next();
      } else {
        console.log("Erro ao criar Subdiretório\n" + err1);
      }
    } else {
      console.log("Erro ao criar diretório\n" + err1);
    }
  }
}
const zip = (req, res, next) => {
  var key
  var { content } = req.body;
  var content_json = JSON.parse(content);
  keysCompany.map((value, idx) => {
    if (value == content_json.company) {
      key = idx
    }
  })
  let companyClear = content_json.company.replace(/ /, '');
  console.log(`${CompanyAccess[key]}`);
  setTimeout(() => {
    zipFolder(`${__dirname}/../certified/${companyClear}/${CompanyAccess[key]}`, `${__dirname}/../certified/${companyClear}/${CompanyAccess[key]}.zip`, function (err) {
      if (err) {
        console.log('oh no!', err);
        res.sendStatus(500);
      } else {
        console.log('Arquivo Zipado');
        next();
      }
    });
  }, 1000);

}

const sendZip = (req, res, next) => {
  var { content } = req.body;
  var content_json = JSON.parse(content);
  let key
  keysCompany.map((value, idx) => {
    if (value == content_json.company) {
      key = idx
    }
  })
  let companyClear = content_json.company.replace(/ /, '')
  var file = `${__dirname}/../certified/${companyClear}/${CompanyAccess[key]}.zip`;
  // var filename = path.basename(file);
  // var mimetype = mime.getType(file);

  // res.setHeader('Content-disposition', 'attachment; filename=' + filename);
  // res.setHeader('Content-type', mimetype);
  // var filestream = fs.createReadStream(file);
  // filestream.pipe(res);
  res.download(file);
}

module.exports = {
  generate,
  zip,
  sendZip
}
