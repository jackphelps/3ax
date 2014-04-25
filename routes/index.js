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
//controller is a confusing word here, sorry -- it is the game controller displayed on the phone/device
router.get('/:stream_id', function(req, res) {
  res.render('controller', { title: req.params.stream_id});
});


module.exports = router;
