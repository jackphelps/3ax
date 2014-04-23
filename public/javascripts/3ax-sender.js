/* 
------------------------------------------------------------------------------------
  
  This script is an example only. It's been put together with the goal of creating 
  a great controller experience across supported devices and browsers, but I haven't 
  attempted to support everything. 

------------------------------------------------------------------------------------
*/

// ========== Device Input and socket IO ===========================================
(function() {
  console.log('listening for device inputs')

  //establish socket connection
  var socket = io.connect('');
  var inputID = $(location).attr('pathname').replace('/','');
  socket.emit('registerInput', {inputID: inputID});

  //start looking for device inputs
  $('.accel').html('no readings');
  window.ondeviceorientation = function(event) {
    // some computers without phone-style orientation events will still trigger the ondeviceorientation callback, 
    // so let's check to make sure we have the right type of data
    var data = {
      inputID: inputID,
      orientation: {
        gamma: Math.round(event.gamma),
        alpha: Math.round(event.alpha),
        beta: Math.round(event.beta)
      }
    };

    // send an absurd number of updates
    socket.emit('data', data);
  }

  //set up buttons
  $('#btn-play').click(function() {
    var data = {
      inputID:inputID,
      btn:'play'
    }
    socket.emit('data',data);
    $('#btn-play').addClass('hidden');
    $('#btn-pause').removeClass('hidden');
  });

  $('#btn-pause').click(function() {
    var data = {
      inputID:inputID,
      btn:'pause'
    }
    socket.emit('data',data);
    $('#btn-pause').addClass('hidden');
    $('#btn-play').removeClass('hidden');
  });


})();

// ========== Managing device auto-sleeping ======================================================
///not fully working right, see gh issues
// keep the phone from going to sleep
(function() {
  if (window.DeviceOrientationEvent) {
    // for ios safari, we copy a clever hack from google -- try to open a window, then promptly stop it
    setInterval(function () {
      window.location.href = "/";
      window.setTimeout(function () {
          window.stop()
      }, 1);
    }, 5000);
  };
})();

// ========== Attempting to hide browser nav bars ======================================================
// ios safari uses meta tags for fullscreen
// the rest can use this script
(function() {
  function launchFullscreen(element) {
    if(element.requestFullscreen) {
      element.requestFullscreen();
    } else if(element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if(element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if(element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }
  launchFullScreen(document.documentElement);
})();
