var helpers = require('./helpers');

exports.Watcher = function Watcher(streamID,socketID,cookie,apiKey) {

  this.id = streamID;
  this.socketID = socketID;
  this.cookie = cookie;
  this.apiKey = apiKey;
  // label it active
  this.active = true;
  // created at
  this.createdAt = new Date();

}

exports.Device = function Device(streamID,socketID) {

  this.id = streamID;
  this.socketID = socketID;
  // label it active
  this.active = true;
  // created at
  this.createdAt = new Date();

}

exports.ApiKey = function ApiKey(key) {
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

exports.Stream = function Stream(id) {
  this.id = id;
  this.cookie = helpers.generateRandomString(26);
  this.createdAt = new Date();
}