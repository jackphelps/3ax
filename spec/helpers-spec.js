var redisClient = require('../lib/redisclient');
var helpers = require('../lib/helpers');
var models = require('../lib/models');

describe("generateRandomString", function() {

  it("returns a random string of specified length", function() {
    var res = helpers.generateRandomString(4);
    expect(res.length).toBe(4);
  });

});

//use apiKey class because it includes functions in the constructor
describe("asyncSave", function() {

  it("saves an object to redis WITH optional callback", function() {
    var key = new models.ApiKey('thisKeyIsForTestsOnly');
    helpers.asyncSave(key, function(e,r) {
      expect(e).toBe(null);
      expect(r).toBe(1);
    });
  });

  it("sends an object to redis WITHOUT optional callback", function() {
    var watcher = new models.ApiKey('thisKeyIsForTestsOnly2');
    helpers.asyncSave(watcher);
  });

});

describe("asyncLoad", function() {

  it("loads an object from redis", function() {
    var key = new models.ApiKey('thisKeyIsForTestsOnly3');

    helpers.asyncSave(key, function(e,r) {
      helpers.asyncLoad('ApiKey', key.id, function(e,r) {
        expect(e).toBe(null);
        expect(JSON.parse(r).id).toBe(key.id);
      });
    });

  });

});


