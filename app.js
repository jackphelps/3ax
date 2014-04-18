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

// replace with db, just for testing
live_listeners = {}

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
          'input_id': 'abcd1234',
          'x': 1.0,
          'y': 1.0,
          'z': 1.0,
          'btn_a': 'down'
        }
      */
      console.log(data);
      //pass the data on to the client listening for that input_id
      var listener = live_listeners[data.input_id];
      console.log(listener)
      io.sockets.socket(listener).emit('data', data);
    });
    socket.on('register_input', function(data) {
      /* example:
        { input_id: 'abcd1234' }
      */
      console.log('register_input: ' + data.input_id)
      console.log(socket.id);
    });
    socket.on('register_watcher', function(data) {
      /* example:
        { input_id: 'abcd1234' }
      */
      console.log('register_watcher: ' + data.input_id)
      //we want one only listener for each input, so we'll set the keys equal to the input and the value equal to the socket's session id
      console.log(socket.id);
      live_listeners[data.input_id] = socket.id;

    });
});
