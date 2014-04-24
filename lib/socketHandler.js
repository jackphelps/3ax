Watcher = function(req,id) {

  this.id = id;
  this.apiKey = req.apiKey;
  if (req.stream && req.cookie && validStreamRequest(req.stream,req.cookie)) {
    // if they requested a specific stream and gave us a cookie that matches, we'll give them that one; 
    this.stream = req.stream;
    this.cookie = req.cookie;
  } else {
    // otherwise, we'll generate a new one and send them a new cookie
    this.stream = generateUniqueString( 4, streams );
    this.cookie = generateUniqueString( 26, streams );
    // save the stream and cookie for reconnection later
    streams[this.stream] = this.cookie;
  }
  // label it active
  this.active = true;
  // created at
  this.createdAt = new Date();
  // store it in the list
  watchers[this.id] = this;

}

Device = function(req,id) {

  this.id = id;
  this.stream = req.stream;
  // label it active
  this.active = true;
  // created at
  this.createdAt = new Date();
  // store it in the list
  devices[this.id] = this;

}

ApiKey = function(example) {
  if (example) {
    this.key = 'exampleAPIKey';
  } else {
    this.key = generateUniqueString( 15, apiKeys );
  }
  this.limit = 10;
  this.inUse = 0;

  //store it in the list
  apiKeys[this.key] = this;

  //if we later deactivate a key we can drop in a message/reason and deactivated will eval to true
  this.deactivated = false;
  // created at
  this.createdAt = new Date();
  // store it in the list
  apiKeys[this.key] = this;

  this.valid = function() {
    // return true if valid
    return (!this.deactivated && this.limit >= this.inUse);
  }

  this.addClient = function(id) {
    this.clients.push(id);
    this.inUse += 1;
  }

  this.deactivate = function(msg) {
    this.deactivated = msg;
  }

}

function registerWatcher(socket,req) {
  // authenticate valid API key
  if ( apiKeys.hasOwnProperty(req.apiKey) && apiKeys[req.apiKey].valid() ) {
    // we want one only listener for each stream, so we'll set the keys equal to the stream and the value equal to the socket's session id
    // should require listeners to specify API version
    var watcher = new Watcher(req,socket.id);
    var res = {
      stream: watcher.stream,
      cookie: watcher.cookie
    };
    socket.emit('res', res);
  } else {
    // not valid API key, let's tell them that
    socket.emit('res', 'invalid API key');
  }
}

function registerDevice(socket,req) {
  //SECURITY PROBLEM: we need to check to make sure these come from the right domain -- not doing this yet
  var partnerID = findWatcherByStream(req.stream)
  if (partnerID) {
    console.log('input device connected: ' + req);
    var device = new Device(req,socket.id);
    makePartners(device.id,partnerID);
    io.sockets.socket(partnerID).emit('partnerConnect');
  } else {
    //if a watcher doesn't exist, we should disconnect the client
    socket.emit('data', 'nobody watching this stream, not registered');
  }
}

function findWatcherByStream(stream) {
  for (watcher in watchers) {
    return (watchers[watcher].stream && watchers[watcher].stream === stream) ? watchers[watcher].id : false;
  }
}

function findDeviceByStream(stream) {
  for (device in devices) {
    return (devices[device].stream && devices[device].stream === stream) ? devices[device].id : false;
  }
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
  // NEED MORE CLEANUP HERE -- deactivate objects and whatnot
}

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

function validStreamRequest(id,cookie) {
  // return true if they match
  return (streams[id] === cookie);
}

function generateUniqueString(chars, list) {
  while (true) {
    var str = generateRandomString(chars);
    if (!list[str]) {
      break;
    }
  }
  return str;
}

function generateRandomString(chars) {
  var str = '';
  var ar = 'abcdefghijklmnopqrstuvwxyz'.split('');
  for (var i = 0; i < chars; i++) {
    str += ar[ Math.floor( Math.random() * ar.length ) ];
  }
  return str;
}



// store in memory for quick lookup to pass through application data and input to the client's 'partner'
// k : v => socket.id : destination.socket.id
var partners = {};

// ======== put this in redis =======
// k : v => socket.id : object
var watchers = {};
var devices = {};
// k : v => keystring : KeyObject
var apiKeys = {};
// store cookies by stream addresses so it's easier for clients to connect to the same endpoint
// k : v => stream : cookie
var streams = {}
// ===================================

// set up sample API key
// pass in true to give it the key 'exampleAPIKey'
var exampleKey = new ApiKey(true);


var socketio = require('socket.io');

module.exports.listen = function(app) {

  io = socketio.listen(app);

  io.sockets.on('connection', function (socket) {

      socket.on('registerDevice', function(req) {
        registerDevice(socket,req);
      });

      socket.on('registerWatcher', function(req) {
        registerWatcher(socket,req);
      });

      socket.on('prx', function(data) {
        proxy(socket,data);
      });

      socket.on('disconnect', function() {
        disconnect(socket);
      });

  });

  return io;
};