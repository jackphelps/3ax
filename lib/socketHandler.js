var redisClient = require('./redisclient');
var models = require('./models');
var helpers = require('./helpers');

function registerWatcher(socket,req) {
  // authenticate valid API key
  helpers.asyncLoad('ApiKey', req.apiKey, function(e,apiKeyObj) {
    if (e) {
      socket.emit('res', 'Error retrieving the provided API key from the database.');
    } else if (apiKeyObj.valid()) {
      getStreamForReq(socket, req, apiKeyObj.key, makeWatcherResponse);
    } else {
      // not valid API key, let's tell them that
      socket.emit('res', 'The provided API key is either invalid or at its connection limit.');
    }
  });
}

function getStreamForReq(socket, req, apiKey, callback) {
  // if they requested a specific stream and gave us a cookie that matches, we'll give them that one; else we'll make a new stream
  if (req.stream && req.cookie) {
    helpers.asyncLoad('Stream', req.stream, function(e,stream) {
      if (e || !stream || !helpers.validStreamRequest(req,stream)) {
        // if their stream doesn't work, let's make a new one for them
        helpers.asyncMakeStream(function(stream) {
          callback(socket,stream.id,stream.cookie,apiKey);
        });
      } else {
        callback(socket,stream.id,stream.cookie,apiKey);
      }
    });
  } else {
    helpers.asyncMakeStream(function(stream) {
      callback(socket,stream.id,stream.cookie,apiKey);
    });
  }
};

function makeWatcherResponse(socket, streamID, cookie, apiKey) {
  var watcher = new models.Watcher(streamID,socket.id,cookie,apiKey);
  helpers.asyncSave(watcher);
  socket.emit('res', {
    stream: watcher.id,
    cookie: watcher.cookie
  });
}

function registerDevice(socket,req) {
  //SECURITY PROBLEM: we need to check to make sure device registrations come from the right domain -- not doing this yet
  // otherwise we'll just be shuttling arbitrary stuff from potentially anywhere through to watching clients
  helpers.asyncLoad('Watcher', req.stream, function(e,partnerObj) {
    if (e) {
      socket.emit('data', 'Error finding this stream in the database');
    } else {
      var device = new models.Device(req.stream,socket.id);
      helpers.asyncSave(device);
      makePartners(device.socketID,partnerObj.socketID);
      io.sockets.socket(partnerObj.socketID).emit('partnerConnect');
    }
  });
}

function proxy(socket,data) {
  // pass the data on to the client listening for that stream
  if (partners.hasOwnProperty(socket.id)) {
    io.sockets.socket(partners[socket.id]).emit('prx', data);
  }
}

function disconnect(socket) {
  // first, tell a partner they're gone so the app can be paused or whatever
  if (partners.hasOwnProperty(socket.id)) {
    io.sockets.socket(partners[socket.id]).emit('partnerDisconnect');
    // then, clean up after them
    unPartner(socket.id);
  }
  // NEED MORE CLEANUP HERE -- clean up objects and whatnot
}

// store pairs in memory for quick lookup to pass through application data and input to the client's 'partner'
// k : v => socket.id : destination.socket.id
var partners = {};
function makePartners(id1,id2) {
  partners[id1] = id2;
  partners[id2] = id1;
}
function unPartner(id) {
  // don't worry, even if one of these doesn't exist in the dictionary this will work properly
  // delete doesn't care about wrong or undefined keys
  partner = partners[id];
  delete partners[partner];
  delete partners[id];
}


// set up sample API key
helpers.asyncSave(new models.ApiKey('exampleAPIKey'));

// make a buffer to provision the stream IDs if it doesn't already exist:
helpers.provisionStreams();

// start the socket server

var socketio = require('socket.io');

module.exports.listen = function(app) {

  io = socketio.listen(app);

  io.sockets.on('connection', function (socket) {

      socket.on('registerDevice', function(req) {
        console.log('Register device request from ' + socket.id);
        registerDevice(socket,req);
      });

      socket.on('registerWatcher', function(req) {
        console.log('Register watcher request from ' + socket.id);
        registerWatcher(socket,req);
      });

      socket.on('prx', function(data) {
        proxy(socket,data);
      });

      socket.on('disconnect', function() {
        console.log('Disconnect from ' + socket.id);
        disconnect(socket);
      });

  });

  return io;
};