/* 
------------------------------------------------------------------------------------
  
  This library is an example only. It does not serve advanced uses provided in the 
  documentation, although it may be updated later. 

  USE:
  var threeax = new ThreeAX();
  threeax.requestInputID('exampleAPIKey', function(res) {
    receivedInputID(res);
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

  this.requestInputID = function(apiKey, callback) {

    // establish socket connection
    socket = io.connect('');
    var req = {
      apiKey: apiKey
    };

    socket.on('inputID', function (data) {
      callback(data);
    });

    socket.emit('registerWatcher', req);
  }

  // set up socket listeners
  this.listen = function(callback) {
    // controller state including button presses -- see API doc for formatting
    socket.on('data', function (data) {
      callback(data);
    });

  };

};

