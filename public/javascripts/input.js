//inputs from phones
(function() {
  console.log('listening for device inputs')

  //establish socket connection
  var socket = io.connect('/');
  socket.emit('message', 'Are you there server? It\'s me, client.');

  //start looking for device inputs
  $('.accel').html('no readings');
  window.ondevicemotion = function(event) {
    var inp = {};
    inp.ax = Math.round(event.acceleration.x * 100, 0);
    inp.ay = Math.round(event.acceleration.y * 100, 0);
    inp.az = Math.round(event.acceleration.z * 100, 0);
    $('.accel').html('current values: ' + inp.ax + ', ' + inp.ay + ', ' + inp.az);

    // send an absurd number of updates
    socket.emit('message', inp);
  }
})();

// need to detect browser/device type for different sleep prevention methods

// keep the phone from going to sleep!
(function() {
  // for ios safari, we copy a clever hack from google -- try to open a window, then promptly stop it
  setInterval(function () {
    $('.log').append('kept alive!');
    window.location.href = "http://www.google.com";
    window.setTimeout(function () {
        window.stop()
    }, 1);
  }, 5000);
})();