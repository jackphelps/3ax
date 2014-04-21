var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var api = require('./routes/api');
var users = require('./routes/users');
var debug = require('debug')('my-application');
var io = require('socket.io');

var app = express();
var liveListeners = {};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/api', api);
app.use('/users', users);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});


// add socket listener
var io = io.listen(server);

io.sockets.on('connection', function (socket) {
    console.log('new socket connection');
    socket.on('data', function(data) {
      /* example:
        {
          'inputId': 'abcd1234',
          'x': 1.0,
          'y': 1.0,
          'z': 1.0,
          'btnA': 'down'
        }
      */
      //pass the data on to the client listening for that inputId
      //this implementation permits only one listener at a time, which should be fine but is a known limitation. 
      //figure users of the API can pass data around if they need...
      if (liveListeners[data.inputId]) {
          var listener = liveListeners[data.inputId];
          io.sockets.socket(listener).emit('data', data);
      };
    });
    socket.on('registerInput', function(data) {
      /* example:
        { inputId: 'abcd1234' }
      */
      console.log('registerInput: ' + data.inputId)
      console.log(socket.id);
    });
    socket.on('registerWatcher', function(data) {
      /* example:
        { inputId: 'abcd1234' }
      */
      console.log('registerWatcher: ' + data.inputId)
      //we want one only listener for each input, so we'll set the keys equal to the input and the value equal to the socket's session id
      console.log(socket.id);
      liveListeners[data.inputId] = socket.id;

    });
});
