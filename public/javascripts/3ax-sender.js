//inputs from phones
(function() {
  console.log('listening for device inputs')

  //establish socket connection
  var socket = io.connect('');
  var input_id = $(location).attr('pathname').replace('/','');
  var data = {input_id: input_id};
  socket.emit('register_input', data);

  //start looking for device inputs
  $('.accel').html('no readings');
  window.ondevicemotion = function(event) {
    var data = {};
    data.input_id = input_id;
    data.ax = Math.round(event.acceleration.x * 100, 0);
    data.ay = Math.round(event.acceleration.y * 100, 0);
    data.az = Math.round(event.acceleration.z * 100, 0);
    $('.accel').html('current values: ' + data.ax + ', ' + data.ay + ', ' + data.az);

    // send an absurd number of updates
    socket.emit('data', data);
  }
})();

/* not working right, see gh issues
// keep the phone from going to sleep
(function() {
  // for ios safari, we copy a clever hack from google -- try to open a window, then promptly stop it
  setInterval(function () {
    window.location.href = "http://www.google.com";
    window.setTimeout(function () {
        window.stop()
    }, 0);
  }, 5000);
})();
*/
