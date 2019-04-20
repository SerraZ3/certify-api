var express = require('express');
var router = express.Router();
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
const certified = require('../public/modules/certified');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/',  upload.single('image'), certified.generate, certified.zip, certified.sendZip);

module.exports = router;
