//make a global to store controller state
globalDeviceState = {};

//socket connection, look for data
(function() {
  console.log('looking for device inputs')

  $('.accel').html('no readings');

  //establish socket connection
  var socket = io.connect('');
  var inputId = $(location).attr('pathname').replace('/','');
  var data = {
    inputId: 'abcd1234'
  };
  socket.emit('registerWatcher', data);

  socket.on('data', function (data) {
    globalDeviceState = data;
  });
})();

