var redis = require('redis');
//remote redis if we're running on heroku
if (process.env.REDISCLOUD_URL) {
  var url = require('url');
  var redisURL = url.parse(process.env.REDISCLOUD_URL);
  var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
  client.auth(redisURL.auth.split(":")[1]);
} else {
  //local
  client = redis.createClient();
}

client.on("error", function (e) {
  console.log("Error " + e);
});

module.exports = client;