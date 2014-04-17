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
    inp.ax = Math.round(event.accelerationIncludingGravity.x * 100, 0);
    inp.ay = Math.round(event.accelerationIncludingGravity.y * 100, 0);
    inp.az = Math.round(event.accelerationIncludingGravity.z * 100, 0);
    $('.accel').html('current values: ' + inp.ax + ', ' + inp.ay + ', ' + inp.az);

    // send an absurd number of updates
    socket.emit('message', inp);
  }
})();