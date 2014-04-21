//inputs from phones
(function() {
  console.log('listening for device inputs')

  //establish socket connection
  var socket = io.connect('');
  var inputId = $(location).attr('pathname').replace('/','');
  var data = {inputId: inputId};
  socket.emit('registerInput', data);

  //start looking for device inputs
  $('.accel').html('no readings');
  window.ondeviceorientation = function(event) {
    var data = {};
    data.inputId = inputId;
    var roundDecimals = 0;
    data.gamma = Math.round(event.gamma);
    data.alpha = Math.round(event.alpha);
    data.beta = Math.round(event.beta);
    $('.accel').html('current values: ' + data.gamma + ', ' + data.alpha + ', ' + data.beta);

    // send an absurd number of updates
    socket.emit('data', data);
  }
})();

///not working right, see gh issues
// keep the phone from going to sleep
(function() {
  // for ios safari, we copy a clever hack from google -- try to open a window, then promptly stop it
  setInterval(function () {
    window.location.href = "http://www.google.com";
    window.setTimeout(function () {
        window.stop()
    }, 1);
  }, 5000);
})();
