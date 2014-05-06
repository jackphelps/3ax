// jasmine-node --verbose --color spec --autotest --watch ./lib 

var redisClient = require('../lib/redisclient');
var helpers = require('../lib/helpers');
var models = require('../lib/models');

describe("generateRandomString", function() {

  it("returns a random string of specified length", function() {
    var res = helpers.generateRandomString(7);
    expect(res.length).toBe(7);
  });

});

//test with apiKey class because it includes functions in the constructor
describe("asyncSave", function() {

  it("saves an object to redis WITH optional callback", function(done) {
    var key = new models.ApiKey('thisKeyIsForTestsOnly');
    helpers.asyncSave(key, function(e,r) {
      expect(e).toBe(null);
      //returns 1 if new insertion 0 if overwrite, so can't expect either
      //expect(r).toBe(1);
      done();
    });
  });

});

describe("asyncLoad", function() {

  it("loads an object from redis", function(done) {
    var key = new models.ApiKey('thisKeyIsForTestsOnly3');
    helpers.asyncSave(key, function(e,r) {
      helpers.asyncLoad('ApiKey', key.id, function(e,r) {
        expect(e).toBe(null);
        expect(r.id).toBe(key.id);
        done();
      });
    });
  });

});

