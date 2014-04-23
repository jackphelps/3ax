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
    
    // check local storage for an existing cookie and preferred inputID
    // this is so the user doesn't have to reload their phone's browser unnecessarily 
    // cookie prevents duplicate clients claiming the same input ID
    if (typeof(Storage)!=="undefined") {
      if (localStorage.inputID) {
        req.inputID = localStorage.inputID;
      }
      if (localStorage.cookie) {
        req.cookie = localStorage.cookie;
      }

    }

    socket.on('inputID', function (data) {
      localStorage.setItem("cookie",data.cookie);
      // the server returns an inputID whether we specified one or not
      // if we specified, it will be the same one unless it was no longer available
      localStorage.setItem("inputID",data.inputID);
      callback(data.inputID);
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

