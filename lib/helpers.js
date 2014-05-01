var models = require('./models');
// require our redis setup, hands back set up client
var redisClient = require('./redisclient');

exports.asyncMakeStream = function asyncMakeStream(callback) {
  redisClient.spop('streamBuffer', function(e,r) {
    if (e) {
      console.log('Error retrieving stream from buffer');
      console.log(e);
    } else if (!r) {
      //in redis client we get (nil) back if empty, need to check what's returned...
      console.log('nil received attempting to pop string from buffer -- may be out of values!');
    } else {
      var stream = new models.Stream(r);
      exports.asyncSave(stream);
      callback(stream);
    }
  });
}

exports.provisionStreams = function provisionStreams() {
  var set = 'streamBuffer';
  redisClient.exists(set, function(e,r) {
    if (e) {
      console.log('Error provisioning streams!');
      console.log(e);
    } else if (r === 1) {
      console.log('Streams already provisioned, skipping');
    } else if (r === 0) {
      console.log('provisioning streams...');
      streams = exports.makeStreams(set);
      for (var i = 0; i < streams.length; i++) {
        exports.pushStream(set,streams[i]);
      }
      console.log('finished adding streams to buffer');
    } else {
      console.log('Unexpected response from redis: ');
      console.log(r);
    }
  });
}

exports.makeStreams = function makeStreams(set) {
  var stream = [];
  //assumes 3 characters
  var chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
  //yay nesting
  for (var i=0; i < chars.length; i++) {
    for (var j=0; j < chars.length; j++) {
      for (var k=0; k < chars.length; k++) {
        var str = chars[i] + chars[j] + chars[k];
        streams.push(str);
      }
    }
  }
  return streams;
}

exports.pushStream = function pushStream(set,val) {
  redisClient.sadd(set, val, function(e,r) {
    // should just add, log any unexpected behavior
    if (e) {
      console.log('Error adding value to set');
      console.log(e);
    } else if (r === 0) {
      console.log('Tried adding value to set, already exists!')
      console.log('set: ' + set + ', value: ' + val);
    } else if (r !== 1) {
      console.log('Unexpected response from redis: ');
      console.log(r);
    }
  });
}

// saves obj to hash named for its prototype (e.g. 'Watcher') with key set to its ID
// auto error logging
// OPTIONAL callback
exports.asyncSave = function asyncSave(obj, optionalCallback) {
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

// retrieval wrapper for javascript classes including auto-parsing and error logging, much more DRY
// still lets us handle errors cleanly, while null result gets logged and still returns
exports.asyncLoad = function asyncLoad(className, id, callback) {
  redisClient.hget(className, id, function(e,r) {
    if (e || !r) { 
      console.log('Error retrieving from database: ');
      console.log(e);
      callback(e,r);
    } else {
      var parsed = JSON.parse(r);
      // we've gotten back a hash with the right properties, but it has no prototype or class methods
      // so we'll use a reconstructing function to get an object that's like what we saved in the first place
      var obj = exports.reconstructObj(className,parsed);
      callback(e,obj);
    }
  });
}

// returns first object found with a specific attribute value, else FALSE
exports.asyncFindBy = function asyncFindBy(className, property, value, callback) {
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
          obj = exports.reconstructObj(className,parsed);
          break;
        }
      }
      callback(e,obj);
    }
  });
}

exports.asyncKeys = function asyncKeys(className, callback) {
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

exports.reconstructObj = function reconstructObj(className,hash) {
  //instantiate a new object of the correct class
  var obj = eval('new models.' + className + '()');
  //overwrite the properties from the hash values
  for (prop in hash) {
    obj[prop] = hash[prop];
  }
  return obj;
}

exports.generateRandomString = function generateRandomString(chars) {
  var str = '';
  var ar = 'abcdefghijklmnopqrstuvwxyz'.split('');
  for (var i = 0; i < chars; i++) {
    str += ar[ Math.floor( Math.random() * ar.length ) ];
  }
  return str;
}