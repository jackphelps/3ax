//socket connection, look for data
(function() {
  console.log('looking for device inputs')

  $('.accel').html('no readings');

  //establish socket connection
  var socket = io.connect('');
  var input_id = $(location).attr('pathname').replace('/','');
  var data = {input_id: 'abcd1234'};
  socket.emit('register_watcher', data);

  socket.on('data', function (data) {
    $('.accel').html('current values: ' + data.ax + ', ' + data.ay + ', ' + data.az);
  });
})();

