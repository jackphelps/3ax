var express = require('express');
var router = express.Router();

// GET homepage
router.get('/', function(req, res) {
  res.render('index', { title: '3ax Demo' });
});
// GET about page
router.get('/about', function(req, res) {
  res.render('about', { title: 'About'});
});


// !IMPORTANT =========== 
// This route has to go last, else the router will assume /about or whatever are input IDs

// GET device interface page -- for users to access with their devices
router.get('/:input_id', function(req, res) {
  res.render('controller', { title: req.params.input_id});
});


module.exports = router;
