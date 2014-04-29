var redis = require('redis');
var url = require('url');
var redisURL = url.parse(process.env.REDISCLOUD_URL);
var redisClient = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
redisClient.auth(redisURL.auth.split(":")[1]);
redisClient.on("error", function (e) {
  console.log("Error " + e);
});

function Watcher(streamID,socketID,cookie,apiKey) {

  this.id = streamID;
  this.socketID = socketID;
  this.cookie = cookie;
  this.apiKey = apiKey;
  // label it active
  this.active = true;
  // created at
  this.createdAt = new Date();

}

function Device(streamID,socketID) {

  this.id = streamID;
  this.socketID = socketID;
  // label it active
  this.active = true;
  // created at
  this.createdAt = new Date();

}

function ApiKey(key) {
  this.key = key
  this.id = this.key;
  this.limit = 10;
  this.inUse = 0;

  //if we later deactivate a key we can drop in a message/reason and deactivated will eval to true
  this.deactivated = false;
  // created at
  this.createdAt = new Date();

  this.valid = function() {
    // return true if valid
    return (!this.deactivated && this.limit >= this.inUse);
  }

  this.addClient = function(id) {
    this.clients.push(id);
    this.inUse += 1;
  }

  this.removeClient = function(id) {
    this.clients.delete(id);
    this.inUse -= 1;
  }

  this.deactivate = function(msg) {
    this.deactivated = msg;
  }

}

function Stream() {
  this.id = generateUniqueString( 4, {} );
  this.cookie = generateRandomString(26);
  this.createdAt = new Date();
}

// saves obj to hash named for its prototype (e.g. 'Watcher') with key set to its ID
// auto error logging
// OPTIONAL callback
function asyncSave(obj, optionalCallback) {
  redisClient.hset(obj.constructor.name, obj.id, JSON.stringify(obj), function(e,r) {
    if (e) {
      console.log('Error saving to database: ');
      console.log(e);
      if (optionalCallback) {optionalCallback(e,r)};
    } else {
      if (optionalCallback) {optionalCallback(e,r)};
    };
  });
}

// retrieval wrapper including auto-parsing and error logging, much more DRY
// still lets us handle errors cleanly
// null result falls into error handler -> very nice
function asyncLoad(className, id, callback) {
  redisClient.hget(className, id, function(e,r) {
    if (e || !r) { 
      console.log('Error retrieving from database: ');
      console.log(e);
      callback(e,r);
    } else {
      var parsed = JSON.parse(r);
      // we've gotten back a hash with the right properties, but it has no prototype or class methods
      // so we'll use a reconstructing function to get an object that's like what we saved in the first place
      var obj = reconstructObj(className,parsed);
      callback(e,obj);
    }
  });
}

// returns first object found with a specific attribute value, else FALSE
function asyncFindBy(className, property, value, callback) {
  redisClient.hgetall(className, function(e,r) {
    if (e) {
      console.log('Error retrieving from database: ');
      console.log(e);
      callback(e,r);
    } else {
      var obj = false;
      for (hash in r) {
        var parsed = JSON.parse(r[hash]);
        if (parsed[property] === value) {
          obj = reconstructObj(className,parsed);
          break;
        }
      }
      callback(e,obj);
    }
  });
}

function asyncKeys(className, callback) {
  redisClient.hkeys(className, function(e,r) {
    if (e || !r) {
      console.log('Error retrieving from database');
      console.log(e);
      callback(e,r);
    } else {
      callback(e,r);
    }
  });
}


function reconstructObj(className,hash) {
  //instantiate a new object of the correct class
  var obj = eval('new ' + className + '()');
  //overwrite the properties from the hash values
  for (prop in hash) {
    obj[prop] = hash[prop];
  }
  return obj;
}

function registerWatcher(socket,req) {
  // authenticate valid API key
  asyncLoad('ApiKey', req.apiKey, function(e,apiKeyObj) {
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
    asyncLoad('Stream', req.stream, function(e,stream) {
      if (e || !validStreamRequest(req,stream)) {  
        var stream = new Stream();
        asyncSave(stream);
      }
      callback(socket,stream.id,stream.cookie,apiKey);
    });
  } else {
    var stream = new Stream();
    asyncSave(stream);
    callback(socket,stream.id,stream.cookie,apiKey);
  }
};

function makeWatcherResponse(socket, streamID, cookie, apiKey) {
  var watcher = new Watcher(streamID,socket.id,cookie,apiKey);
  asyncSave(watcher);
  socket.emit('res', {
    stream: watcher.id,
    cookie: watcher.cookie
  });
}

function registerDevice(socket,req) {
  //SECURITY PROBLEM: we need to check to make sure device registrations come from the right domain -- not doing this yet
  // otherwise we'll just be shuttling arbitrary stuff from potentially anywhere through to watching clients
  asyncLoad('Watcher', req.stream, function(e,partnerObj) {
    if (e) {
      socket.emit('data', 'Error finding this stream in the database');
    } else {
      var device = new Device(req.stream,socket.id);
      asyncSave(device);
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

function validStreamRequest(reqStream,savedStream) {
  // true if match
  return (reqStream.stream === savedStream.id && reqStream.cookie === savedStream.cookie);
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

// set up sample API key
asyncSave(new ApiKey('exampleAPIKey'));

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