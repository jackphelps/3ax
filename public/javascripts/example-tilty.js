/* Example flight game for 3ax controller API */

//instantiate global for device input from API script -- handle this however you want in production

(function() {

  var container,
      camera,
      scene,
      renderer,
      controls,
      projector,
      player,
      i, j, k;

  var state       = {},
      animations  = [];

  var threeax     = new ThreeAX(),
      clock       = new THREE.Clock();

  function init() {
  console.log('running setup');

    // set up 3ax request and handlers
    threeax.requestStream('exampleAPIKey', function(response) {
      receivedStream(response);
    });

    threeax.listen(function(data) {
      handleSocketResponses(data);
    });

    //make a scene
    container = document.createElement( 'div' );
    container.setAttribute('id','canvas-container');
    document.body.appendChild( container );

    scene = new THREE.Scene();


    // ====== Lights ================

    hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 500, 0 );
    scene.add( hemiLight );

    dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 50 );
    scene.add( dirLight );

    dirLight.castShadow = true;

    dirLight.shadowMapWidth = 2048;
    dirLight.shadowMapHeight = 2048;

    var d = 50;

    dirLight.shadowCameraLeft = -d;
    dirLight.shadowCameraRight = d;
    dirLight.shadowCameraTop = d;
    dirLight.shadowCameraBottom = -d;

    dirLight.shadowCameraFar = 3500;
    dirLight.shadowBias = -0.0001;
    dirLight.shadowDarkness = 0.35;

    // ====== player ================
    player = new THREE.Object3D();

    // MODEL -- the beautiful flamingo was shamelessly cribbed, see flamingo.js for source and attribution (CC license)

    var loader = new THREE.JSONLoader();

    loader.load( "/javascripts/flamingo.js", function( geometry ) {

      morphColorsToFaceColors( geometry );
      geometry.computeMorphNormals();

      var material = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 20, morphTargets: true, morphNormals: true, vertexColors: THREE.FaceColors, shading: THREE.FlatShading } );
      flamingo = new THREE.MorphAnimMesh( geometry, material );

      flamingo.duration = 1000;

      var s = 0.35;
      flamingo.scale.set( s, s, s );
      flamingo.position.y = 0;
      flamingo.rotation.y = 1.57;

      flamingo.castShadow = true;
      flamingo.receiveShadow = true;

      player.add( flamingo );
      animations.push(flamingo);

    } );

    scene.add(player);

    // ====== camera ================

    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 1e5 );

    camera.position.set(player.position.x - 100, player.position.y + 30, player.position.z + 0);
    player.add(camera);
    camera.lookAt( player.position );

    // ====== scenery ================

    // CLOUDS = cube placeholders for more fun things
    var cubesSquared = 10;
    var cubeSize = 10;
    var cubeDist = 100;

    for (i = 0; i < cubesSquared; i++) {
      for (j = 0; j < cubesSquared; j++) {
        for (k = 0; k < cubesSquared; k++) {
          var block = new THREE.Mesh (
            new THREE.CubeGeometry(cubeSize,cubeSize,cubeSize),
            new THREE.MeshLambertMaterial( {color: 0xffcc33})
          );
          block.position = {x: i * cubeDist - (cubesSquared * cubeDist)/2,y: j * cubeDist + 10, z: k * cubeDist - (cubesSquared * cubeDist)/2};
          scene.add(block);
        }
      }
    }

    scene.fog = new THREE.Fog( 0xffffff, 1, 5000 );

    // GROUND

    var groundGeo = new THREE.PlaneGeometry( 10000, 10000 );
    var groundMat = new THREE.MeshPhongMaterial( { ambient: 0xffffff, color: 0xffffff, specular: 0x050505 } );
    groundMat.color.setHSL( 0.095, 1, 0.75 );

    var ground = new THREE.Mesh( groundGeo, groundMat );
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -33;
    scene.add( ground );

    ground.receiveShadow = true;

    // SKYDOME

    var vertexShader = document.getElementById( 'vertexShader' ).textContent;
    var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
    var uniforms = {
      topColor:    { type: "c", value: new THREE.Color( 0x0077ff ) },
      bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
      offset:    { type: "f", value: 33 },
      exponent:  { type: "f", value: 0.6 }
    }
    uniforms.topColor.value.copy( hemiLight.color );

    scene.fog.color.copy( uniforms.bottomColor.value );

    var skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
    var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );

    var sky = new THREE.Mesh( skyGeo, skyMat );
    scene.add( sky );

    // RENDERER

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    renderer.setClearColor( scene.fog.color, 1 );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMapEnabled = true;
    renderer.shadowMapCullFace = THREE.CullFaceBack;


    container.appendChild( renderer.domElement );

    projector = new THREE.Projector();

    window.addEventListener( 'resize', onWindowResize, false );

    // initial player position & orientation now that everything is on screen
    player.position.x = -700;
    player.position.y = 135;
    player.position.z = -50;

    player.rotateOnAxis( 
      (new THREE.Vector3(0,0,1)).normalize(), 
      20 * Math.PI / 180
    );

    // make sure the game is paused to start
    state.pause = true;

  }

  function morphColorsToFaceColors( geometry ) {
    if ( geometry.morphColors && geometry.morphColors.length ) {
      var colorMap = geometry.morphColors[ 0 ];
      for ( var i = 0; i < colorMap.colors.length; i ++ ) {
        geometry.faces[ i ].color = colorMap.colors[ i ];
      }
    }
  }

  function moveWithController(obj, deviceData) {
    if (deviceData.gamma && deviceData.alpha && deviceData.beta) {

      pitchspeed = 1;
      pitchbreak = 45;
      pitchrange = 45;
      obj.rotateOnAxis( 
        (new THREE.Vector3(0,0,1)).normalize(), 
        (Math.abs(deviceData.gamma) - pitchbreak) / pitchrange * pitchspeed * Math.PI / 180
      );

      rollspeed = 3;
      rollbreak = 0;
      rollrange = 90;
      obj.rotateOnAxis( 
        (new THREE.Vector3(1,0,0)).normalize(), 
        Math.min(rollspeed, ((deviceData.beta - rollbreak) / rollrange * rollspeed)) * Math.PI / 180
      );

    };

    var moveSpeed = 2;
    obj.translateX( moveSpeed );
    var floor = 10;
    if (obj.position.y < floor) {
      obj.position.y = floor;
    }

  }

  function onWindowResize() {

    camera.left = window.innerWidth / - 2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = window.innerHeight / - 2;

    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  function receivedStream(stream) {
    state.stream = stream;
    $('#ctrl-url').html('3ax.co/' + stream);
    console.log('received stream ID from socket: ' + stream);

  }

  function handleSocketResponses(data) {
    // handle the controller input
    // we haven't implemented a difference between buttonUp and buttonDown here but it's easy 
    // if you send btnUp and btnDown events instead 
    if (data.partnerConnect) {
      console.log('Input device connected');
      deviceConnected()
    }
    if (data.btn) {
      btnPress(data.btn);
    }
    if (data.orientation) {
      state.gamma = data.orientation.gamma;
      state.alpha = data.orientation.alpha;
      state.beta = data.orientation.beta;
    }
    if (data.partnerDisconnect) {
      console.log('Input device disconnected');
      pause();
    }

  }

  function deviceConnected() {
    $('#canvas-directions').html('Input device connected! Hold your phone in landscape mode like a video game controller and press Play to start.');
  } 

  function btnPress(btn) {
    //only one button here
    if (btn === 'play') {
      unpause();
    } else if (btn === 'pause') {
      pause();
    } 
  }

  function pause() {
    state.pause = true;
    $('#canvas-directions').html('-Paused-');
    $('#canvas-directions').show();
  }

  function unpause() {
    state.pause = false;
    $('#canvas-directions').hide();
  }

  function loop() {
    if (state.gamma && (!state.pause || !state.stream)) {
      moveWithController(player, state);
    }

    var delta = clock.getDelta();

    for (i = 0; i < animations.length; i++) {
      animations[i].updateAnimation( 1000 * delta );
    }

    requestAnimationFrame(loop);

    render();

  }

  function render() {

    renderer.render( scene, camera );

  }

  init();

  loop();

})();
