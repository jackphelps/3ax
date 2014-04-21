

exports.handler = function(socket) {
  console.log('new socket connection');
  socket.on('data', function(data) {
    /* example:
      {
        'input_id': 'abcd1234',
        'x': 1.0,
        'y': 1.0,
        'z': 1.0,
        'btn_a': 'down'
      }
    */
    //pass the data on to the client listening for that input_id
    if (liveListeners[data.input_id]) {
        var listener = liveListeners[data.input_id];
        io.sockets.socket(listener).emit('data', data);
    };
  });
  socket.on('registerInput', function(data) {
    /* example:
      { input_id: 'abcd1234' }
    */
    console.log('registerInput: ' + data.input_id)
    console.log(socket.id);
  });
  socket.on('registerWatcher', function(data) {
    /* example:
      { input_id: 'abcd1234' }
    */
    console.log('registerWatcher: ' + data.input_id)
    //we want one only listener for each input, so we'll set the keys equal to the input and the value equal to the socket's session id
    console.log(socket.id);
    liveListeners[data.input_id] = socket.id;
  });
};