//inputs from phones
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
    //$('.accel').html('current values: ' + data.orientation.gamma + ', ' + data.orientation.alpha + ', ' + data.orientation.beta);

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

///not fully working right, see gh issues
// keep the phone from going to sleep
(function() {
  // for ios safari, we copy a clever hack from google -- try to open a window, then promptly stop it
  setInterval(function () {
    window.location.href = "/";
    window.setTimeout(function () {
        window.stop()
    }, 1);
  }, 5000);
})();

// scroll to 1px to auto hide navbars
// note relies on controller body height being set to greater than 100%
(function() {
  $(document).ready( function() {

    console.log($('.ctrl-spacer').height());
    $('.ctrl-spacer').height($(window).height() + 2);
    console.log($('.ctrl-spacer').height());
    window.scrollTo(0,2)
    console.log($(window).scrollTop());
  });
})();
