//inputs from phones
(function() {
  console.log('listening for device inputs')
  $('.accel').html('hello');
  window.ondevicemotion = function(event) {
    var ax = Math.round(event.accelerationIncludingGravity.x * 100, 0);
    var ay = Math.round(event.accelerationIncludingGravity.y * 100, 0);
    $('.accel').html('current vals: ' + ax + ', ' + ay);
    console.log("Accelerometer data - x: " + event.accelerationIncludingGravity.x + " y: " + event.accelerationIncludingGravity.y + " z: " +event.accelerationIncludingGravity.z); 
  }
})();