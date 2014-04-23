var express = require('express');
var router = express.Router();

// GET homepage
router.get('/', function(req, res) {
  res.render('index', { title: '3ax' });
});

// GET device interface page -- for users to access with their devices
router.get('/:input_id', function(req, res) {
  res.render('controller', { title: req.params.input_id});
});


module.exports = router;
