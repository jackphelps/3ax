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

// store in memory for quick proxying to active listening sockets 
// key : value => inputID : socket.id (that's the socket session ID)
var liveListeners = {};
var liveInputs = {};
// ======== put this in redis =======
// keep track of inputIDs assigned --- we can purge them after a certain amount of time
// key : value => inputID : cookie
var inputIDs = {};
// hold valid API keys
var apiKeys = {'exampleAPIKey':'valid'};
// ===================================

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


// add socket listeners
var io = io.listen(server, {log:false});

io.sockets.on('connection', function (socket) {
    console.log('new socket connection');

    socket.on('registerInput', function(data) {
      if (liveListeners.hasOwnProperty(data.inputID)) {
        console.log('input device connected: ' + data);
        var listener = liveListeners[data.inputID];
        liveInputs[data.inputID] = socket.id;
        liveInputs[socket.id] = data.inputID;
        io.sockets.socket(listener).emit('data', {connection:true});
      }
    });

    socket.on('registerWatcher', function(data) {
      // authenticate valid API key
      if ( apiKeys.hasOwnProperty(data.apiKey) && apiKeys[data.apiKey] === 'valid') {
        // we want one only listener for each input, so we'll set the keys equal to the input and the value equal to the socket's session id
        // should require listeners to specify API version
        var res = {}
        if (data.inputID && data.cookie && inputIDs[data.inputID] === data.cookie) {
          // if they requested a specific inputID and gave us a cookie that matches, we'll give them that one; 
          res.inputID = data.inputID;
          res.cookie = data.cookie;
        } else {
          // otherwise, we'll generate a new one and send them a new cookie
          var inputID = generateRandomString(4)
          var cookie = generateRandomString(26);
          res.inputID = inputID;
          res.cookie = cookie;
          // save the inputID and cookie for reconnection later
          inputIDs[inputID] = cookie;
        }
        liveListeners[res.inputID] = socket.id;
        liveListeners[socket.id] = res.inputID;
        socket.emit('inputID', res);
      } else {
        // not valid API key, let's tell them that
        socket.emit('data', 'invalid API key');
      }

    });

    socket.on('data', function(data) {
      // pass the data on to the client listening for that inputID
      if (liveListeners.hasOwnProperty(data.inputID)) {
        var listener = liveListeners[data.inputID];
        io.sockets.socket(listener).emit('data', data);
      };
    });

    socket.on('disconnect', function(data) {
      console.log(data + ' ' + socket);
      if (liveInputs.hasOwnProperty(socket.id)) {
        var listener = liveListeners[liveInputs[socket.id]];
        io.sockets.socket(listener).emit('partnerDisconnect');
      }

    });

});

function generateRandomString(chars) {
  res = '';
  ar = 'abcdefghijklmnopqrstuvwxyz'.split('');
  for (var i = 0; i < chars; i++) {
    res += ar[ Math.floor( Math.random() * ar.length ) ];
  }
  return res;
}
