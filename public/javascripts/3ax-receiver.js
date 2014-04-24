/* 
------------------------------------------------------------------------------------
  
  This library is an example only. It does not serve advanced uses provided in the 
  documentation, although it may be updated later. 

  USE:
  var threeax = new ThreeAX();
  threeax.requestStream('exampleAPIKey', function(res) {
    receivedstream(res);
  });
  threeax.listen(function(data) {
    handleSocketResponses(data);
  });

  Regarding listeners: Socket.io has no global catch-all for events you aren't 
  explicitly watching for -- be sure to check the docs to ensure you are handling 
  all necessary responses!

------------------------------------------------------------------------------------
*/

function ThreeAX() {

  var socket;

  this.requestStream = function(apiKey, callback) {

    // establish socket connection
    socket = io.connect('');
    var req = {
      apiKey: apiKey
    };
    
    // check local storage for an existing cookie and preferred stream
    // this is so the user doesn't have to reload their phone's browser unnecessarily 
    // cookie prevents duplicate clients claiming the same stream ID
    if (typeof(Storage)!=="undefined") {
      if (localStorage.stream && localStorage.cookie) {
        req.stream = localStorage.stream;
        req.cookie = localStorage.cookie;
      }
    }

    socket.on('res', function (data) {
      // the server returns a stream whether we specified one or not
      // if we specified, it will be the same one unless it was no longer available
      // we also get a cookie so we can keep track of it for later, again, same cookie if we sent one up and it was valid
      localStorage.setItem("stream",data.stream);
      localStorage.setItem("cookie",data.cookie);
      //send 
      console.log(data);
      callback(data.stream);
    });

    console.log(req);
    socket.emit('registerWatcher', req);
  }

  // set up socket listeners
  this.listen = function(callback) {
    // controller state including button presses -- see API doc for formatting
    socket.on('prx', function (data) {
      callback(data);
    });
    socket.on('partnerDisconnect', function() {
      callback({disconnect:true});
    });

  };

};

