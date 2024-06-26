// Vertex shader program  
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() { 
      gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
      v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2){
      gl_FragColor = u_FragColor;
    } else if(u_whichTexture == -1){
      gl_FragColor = vec4(v_UV,1.0,1.0);
    } else if (u_whichTexture == 0){
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else {
      gl_FragColor = vec4(1,.2,.2,1);
    }
  }`
// global variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_whichTexture;
let currentSkyTextureIndex;
let currentFloorTextureIndex = 2;
let worldBlocks = Array.from({ length: 32 }, () => Array.from({ length: 32 }, () => []));

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  g_globalRotateMatrix.setIdentity();
}
function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Get the storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return false;
  }

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return false;
  }

  // Get the storage location of u_Sampler
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }

  // Get the storage location of u_Sampler1
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return false;
  }

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if (!u_Sampler3) {
    console.log('Failed to get the storage location of u_Sampler3');
    return false;
  }

  // Get the storage location of u_whichTexture
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedSegments = 10;
let g_rainbowMode = false;
let rainbowIndex = 0;
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_tail1Animation = false;
let g_tail2Animation = false;
let g_tail3Animation = false;
let g_tail4Animation = false;
let g_frontLeg1Animation = false;
let g_frontLeg2Animation = false;
let g_backLeg1Animation = false;
let g_backLeg12nimation = false;
let isDragging = false;
let lastMouseX = -1;
let lastMouseY = -1;
let g_tail1 = 0;
let g_tail2 = 0;
let g_tail3 = 0;
let g_tail4 = 0;
let g_frontLeg1 = 0;
let g_frontKnee1 = 0;
let g_frontLeg2 = 0;
let g_frontKnee2 = 0;
let g_backLeg1 = 0;
let g_backKnee1 = 0;
let g_backLeg2 = 0;
let g_backKnee2 = 0;
let pokeAnimationActive = false;
let pokeAnimationStartTime = 0;
let g_globalRotateMatrix = new Matrix4();
let g_camera;
let blocksRemovedCount = 0;
let spawnBlocks = 0;
let spawnIntervalID;
function startPokeAnimation() {
  if (!pokeAnimationActive) {
    pokeAnimationActive = true;
    pokeAnimationStartTime = g_seconds;
    requestAnimationFrame(tick);
  }
}
function addActionsForHtmlUI() {
  // Slider events
  document.getElementById('animationYellowOffButton').onclick = function () {
    g_tail1Animation = false;
    g_tail2Animation = false;
    g_tail3Animation = false;
    g_tail4Animation = false;
    g_frontLeg1Animation = false;
    g_frontLeg2Animation = false;
    g_backLeg1Animation = false;
    g_backLeg12nimation = false;
  };
  document.getElementById('animationYellowOnButton').onclick = function () {
    g_tail1Animation = true;
    g_tail2Animation = true;
    g_tail3Animation = true;
    g_tail4Animation = true;
    g_frontLeg1Animation = true;
    g_frontLeg2Animation = true;
    g_backLeg1Animation = true;
    g_backLeg12nimation = true;
  };
  document.getElementById('tail1').addEventListener('mousemove', function () {
    g_tail1 = this.value;
    renderScene();
  });
  document.getElementById('tail2').addEventListener('mousemove', function () {
    g_tail2 = this.value;
    renderScene();
  });
  document.getElementById('tail3').addEventListener('mousemove', function () {
    g_tail3 = this.value;
    renderScene();
  });

  document.getElementById('tail4').addEventListener('mousemove', function () {
    g_tail4 = this.value;
    renderScene();
  });
  document.getElementById('frontLeg1').addEventListener('mousemove', function () {
    g_frontLeg1 = this.value;
    renderScene();
  });
  document.getElementById('frontKnee1').addEventListener('mousemove', function () {
    g_frontKnee1 = this.value;
    renderScene();
  });
  document.getElementById('frontLeg2').addEventListener('mousemove', function () {
    g_frontLeg2 = this.value;
    renderScene();
  });
  document.getElementById('frontKnee2').addEventListener('mousemove', function () {
    g_frontKnee2 = this.value;
    renderScene();
  });
  document.getElementById('backLeg1').addEventListener('mousemove', function () {
    g_backLeg1 = this.value;
    renderScene();
  });
  document.getElementById('backKnee1').addEventListener('mousemove', function () {
    g_backKnee1 = this.value;
    renderScene();
  });
  document.getElementById('backLeg2').addEventListener('mousemove', function () {
    g_backLeg2 = this.value;
    renderScene();
  });
  document.getElementById('backKnee2').addEventListener('mousemove', function () {
    g_backKnee2 = this.value;
    renderScene();
  });
  document.getElementById('angleSlideX').addEventListener('input', function () {
    g_globalAngleX = this.value;
    renderScene();
  });
  document.getElementById('angleSlideY').addEventListener('input', function () {
    g_globalAngleY = this.value;
    renderScene();
  });

}

function initTextures() {
  var skyImage = new Image();
  if (!skyImage) {
    console.log('Failed to create the image object');
    return false;
  }

  skyImage.onload = function () { sendImageToTexture0(skyImage); };

  skyImage.src = 'sky.jpg';

  var lavaImage = new Image();
  if (!lavaImage) {
    console.log('Failed to create the image object');
    return false;
  }

  lavaImage.onload = function () { sendImageToTexture1(lavaImage); };

  lavaImage.src = 'lava.jpg';

  var dirtImage = new Image();
  if (!dirtImage) {
    console.log('Failed to create the image object');
    return false;
  }

  dirtImage.onload = function () { sendImageToTexture2(dirtImage); };

  dirtImage.src = 'dirt.jpg';

  var bonesImage = new Image();
  if (!bonesImage) {
    console.log('Failed to create the image object');
    return false;
  }

  bonesImage.onload = function () { sendImageToTexture3(bonesImage); };

  bonesImage.src = 'bones.jpg';

  return true;
}

function sendImageToTexture0(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(u_Sampler0, 0);
  console.log('Texture 0 loaded and set.');
}

function sendImageToTexture1(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(u_Sampler1, 1);
  console.log('Texture 1 loaded and set.');
}

function sendImageToTexture2(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(u_Sampler2, 2);
  console.log('Texture 2 loaded and set.');
}

function sendImageToTexture3(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(u_Sampler3, 3);
  console.log('Texture 3 loaded and set.');
}
function main() {
  // Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  g_camera = new Camera();
  console.log("Initial Position:", g_camera.getPosition());
  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();
  spawnInitialBlocks();
  document.onkeydown = keydown;

  canvas.onmousedown = function (ev) {
    var [x, y] = convertCoordinatesEventToGL(ev);
    if (ev.shiftKey) {
      startPokeAnimation();
      currentSkyTextureIndex = (currentSkyTextureIndex === 0) ? 1 : 0;
    } else {
      isDragging = true;
      lastMouseX = x;
      lastMouseY = y;
    }
  };

  canvas.onmouseup = function (ev) {
    if (isDragging) {
      g_camera.setMovementScale(.25);
      isDragging = false;
    }
  };

  canvas.onmousemove = function (ev) {
    if (isDragging) {
      g_camera.setMovementScale(2);
      var [newX, newY] = convertCoordinatesEventToGL(ev);
      let deltaX = newX - lastMouseX;

      if (deltaX > 0) {
        g_camera.panRight();
      } else {
        g_camera.panLeft();
      }

      lastMouseX = newX;
      lastMouseY = newY;

      renderScene();
    }
  };


  initTextures();
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  requestAnimationFrame(tick);
}
var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  //console.log(g_seconds);
  if (pokeAnimationActive) {
    updatePokeAnimation();
  }
  renderScene();

  requestAnimationFrame(tick);

}

function updatePokeAnimation() {
  const duration = 1.0;
  let timeElapsed = g_seconds - pokeAnimationStartTime;

  if (timeElapsed < duration) {
    let angle = 360 * (1 - Math.cos(Math.PI * timeElapsed / duration));
    g_globalRotateMatrix.setRotate(angle, 1, 0, 1);
  } else {
    pokeAnimationActive = false;
    g_globalRotateMatrix.setIdentity();
  }
}

function click(ev) {

  let [x, y] = convertCoordinatesEventToGL(ev);

  let newAngleX = (x + 1) / 2 * 360;
  g_globalAngleX = newAngleX;
  document.getElementById('angleSlideX').value = newAngleX;

  let newAngleY = (y + 1) / 2 * 360;
  g_globalAngleY = newAngleY;
  document.getElementById('angleSlideY').value = newAngleY;

  renderScene();
}

// Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return ([x, y]);
}

function keydown(ev) {
  if (ev.keyCode === 68) { // D key
    g_camera.right();
    console.log("after moving right Position:", g_camera.getPosition());
    console.log("after moving right Position:", getGridPosition());
  } else if (ev.keyCode === 65) { // A key
    g_camera.left();
    console.log("after moving left Position:", g_camera.getPosition());
  } else if (ev.keyCode === 87) { // W key
    g_camera.forward();
    console.log("after moving forward Position:", g_camera.getPosition());
  } else if (ev.keyCode === 83) { // S key
    g_camera.back();
    console.log("after moving backward Position:", g_camera.getPosition());
  } else if (ev.keyCode === 81) { // Q key
    g_camera.panLeft();
  } else if (ev.keyCode === 69) { // E key
    g_camera.panRight();
  } else if (ev.keyCode === 66) { // B key for placing a block
    placeBlock();
  } else if (ev.keyCode === 82) { // R key for removing a block
    removeBlock();
  }
  renderScene();
}


function spawnInitialBlocks() {
  let count = 0;
  const maxBlocks = 10; // max blocks to spawn initially
  spawnIntervalID = setInterval(() => {
    if (count >= maxBlocks) {
      clearInterval(spawnIntervalID); // clear interval after spawning 10 blocks
    } else {
      spawnRandomBlock();
      count++;
    }
  }, 2000);
}

function spawnRandomBlock() {
  const spawnAreaWidth = 10;
  const offset = (32 - spawnAreaWidth) / 2;
  const x = Math.floor(Math.random() * spawnAreaWidth + offset);
  const z = Math.floor(Math.random() * spawnAreaWidth + offset);
  const color = [Math.random(), Math.random(), Math.random(), 1.0];

  if (worldBlocks[x][z].length < 10) {
    worldBlocks[x][z].push({ color: color });
  }
}

function drawMap() {
  var body = new Cube();
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      if (x == 0 || x == 31 || y == 0 || y == 31) {
        body.color = [1, 1, 1, 1];
        body.textureNum = 2;
        body.matrix.setIdentity();
        body.matrix.translate(0, -.73, 0);
        body.matrix.scale(0.6, .6, 0.6);
        body.matrix.translate(x - 16, 0, y - 16);
        body.renderFaster();
      }
      // draw blocks stacked at this position
      worldBlocks[x][y].forEach((block, index) => {
        body.color = block.color;
        body.textureNum = 3;
        body.matrix.setIdentity();
        body.matrix.translate(0, index - .74, 0); // stack blocks on top of each other
        body.matrix.translate(x - 16, 0, y - 16); // centering and setting position
        body.renderFaster();
      });
    }
  }
}
function placeBlock() {
  const pos = getGridPosition();
  if (worldBlocks[pos.x][pos.z].length < 10) {  // height of stack
    worldBlocks[pos.x][pos.z].push({ color: [1.0, 0.5, 0.0, 1.0] }); // orange block
    console.log("Block placed at", pos);
  }
}

function removeBlock() {
  const pos = getGridPosition();
  if (worldBlocks[pos.x][pos.z].length > 0) {
    worldBlocks[pos.x][pos.z].pop();
    console.log("Block removed from", pos);
    blocksRemovedCount++;
    if (blocksRemovedCount >= 10) {
      playSuccessSound();
      currentSkyTextureIndex = 3;// reset counter after changing the texture
      currentFloorTextureIndex = -1;
    }
  }
}
function playSuccessSound() {
  var audio = document.getElementById('successSound');
  audio.play();
}
function getGridPosition() {
  const forward = g_camera.getForwardVector();
  let gridX = Math.floor(g_camera.eye.elements[0] + forward.elements[0] * 3 + 16); // adjust multiplier for reach
  let gridZ = Math.floor(g_camera.eye.elements[2] + forward.elements[2] * 3 + 16); // adjust multiplier for reach
  return {
    x: Math.max(0, Math.min(31, gridX)), // ensure position stays within bounds
    z: Math.max(0, Math.min(31, gridZ))
  };
}



// Draw every shape that is supposed to be in the canvas
function renderScene() {
  // Check the time at the start of this function
  var startTime = performance.now();

  var projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width / canvas.height, .1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
    g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
    g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]
  );

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // pass matrix to u_ModelMatrix attribute
  var globalRotMatX = new Matrix4().rotate(-g_globalAngleX, 0, 1, 0); // Rotating around y-axis
  var globalRotMatY = new Matrix4().rotate(-g_globalAngleY, 1, 0, 0); // Rotating around x-axis
  var combinedRotationMatrix = globalRotMatX.multiply(globalRotMatY); // You can reverse the order depending on desired effect

  if (pokeAnimationActive) {
    // During poke animation, use the animation matrix
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_globalRotateMatrix.elements);
  } else {
    // When not animating, use the matrix from sliders
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, combinedRotationMatrix.elements);
  }

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  //draw map
  drawMap();

  // Reusable objects
  var cube = new Cube();
  var cylinder = new Cylinder();

  //draw body floor
  cube.color = [.4, .4, .4, 1.0];
  cube.textureNum = currentFloorTextureIndex;
  cube.matrix.translate(0, -.75, 0);
  cube.matrix.scale(20, 0, 20);
  cube.matrix.translate(-.5, 0, -.5);
  cube.renderFaster();

  // draw sky
  cube.color = [1.0, 0.0, 0.0, 1.0];
  cube.textureNum = 0;
  cube.textureNum = currentSkyTextureIndex;
  cube.matrix.setIdentity();
  cube.matrix.scale(50, 50, 50);
  cube.matrix.translate(-.5, -.5, -.5);
  cube.render();

  //draw body cube
  cube.color = [.4, .4, .4, 1.0];
  cube.textureNum = -2;
  cube.matrix.setIdentity();
  cube.matrix.translate(-.2, 0, -.1);
  //cube.matrix.rotate(-5, 1, 0, 0);
  cube.matrix.scale(.4, .4, .75);
  cube.renderFaster();

  //draw additional body cube
  cube.color = [.3, .3, .3, 1.0];
  cube.textureNum = -2;
  cube.matrix.setIdentity();
  cube.matrix.translate(-.25, -.02, -.45);
  //body.matrix.rotate(-5, 1, 0, 0);
  cube.matrix.scale(0.5, .5, .35);
  cube.renderFaster();

  //face
  cube.color = [.4, .4, .4, 1.0];
  cube.textureNum = -2;
  cube.matrix.setIdentity();
  cube.matrix.translate(-.2, 0, -.6);
  //body.matrix.rotate(-5, 1, 0, 0);
  cube.matrix.scale(.4, .4, .15);
  cube.renderFaster();

  // tail1
  cylinder.color = [.3, .3, .3, 1.0];
  cylinder.matrix.setIdentity();
  cylinder.matrix.translate(0, .23, .6);
  if (g_tail1Animation) {
    cylinder.matrix.rotate(25 * Math.sin(g_seconds), 0, 1, 0);
  } else {
    cylinder.matrix.rotate(g_tail1, 0, 1, 0);
  }
  cylinder.matrix.rotate(45, 1, 0, 0);
  var tail1Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.5, 2.5, .15);
  cylinder.render();

  //tail2
  cylinder.color = [.4, .4, .4, 1.0];
  cylinder.matrix = tail1Coordinates;
  cylinder.matrix.translate(0, 0, .15);
  if (g_tail2Animation) {
    cylinder.matrix.rotate(25 * Math.sin(g_seconds), 0, 1, 0);
  } else {
    cylinder.matrix.rotate(g_tail2, 0, 1, 0);
  }
  var tail2Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.4, 2.4, .15);
  cylinder.render();

  // tail3
  cylinder.color = [.3, .3, .3, 1.0];
  cylinder.matrix = tail2Coordinates;
  cylinder.matrix.translate(0, 0, .15);
  if (g_tail3Animation) {
    cylinder.matrix.rotate(25 * Math.sin(g_seconds), 0, 1, 0);
  } else {
    cylinder.matrix.rotate(g_tail3, 0, 1, 0);
  }
  var tail3Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.4, 2.4, .15);
  cylinder.render();

  //tail4
  cylinder.color = [.4, .4, .4, 1.0];
  cylinder.matrix = tail3Coordinates;
  cylinder.matrix.translate(0, 0, .15);
  if (g_tail4Animation) {
    cylinder.matrix.rotate(25 * Math.sin(g_seconds), 0, 1, 0);
  } else {
    cylinder.matrix.rotate(g_tail4, 0, 1, 0);
  }
  cylinder.matrix.scale(2.4, 2.4, .15);
  cylinder.render();

  // nose 
  cube.color = [.3, .3, .3, 1.0];
  cube.matrix.setIdentity();
  cube.matrix.translate(-.1, 0, -.75);
  //body.matrix.rotate(-5, 1, 0, 0);
  cube.matrix.scale(.2, .2, .15);
  cube.renderFaster();

  // ear1
  cube.color = [.2, .2, .2, 1.0];
  cube.matrix.setIdentity();
  cube.matrix.translate(-.2, .4, -.5);
  //body.matrix.rotate(-5, 1, 0, 0);
  cube.matrix.scale(.125, .125, .05);
  cube.renderFaster();

  // ear2
  cube.color = [.2, .2, .2, 1.0];
  cube.matrix.setIdentity();
  cube.matrix.translate(.075, .4, -.5);
  //body.matrix.rotate(-5, 1, 0, 0);
  cube.matrix.scale(.125, .125, .05);
  cube.renderFaster();

  //draw leg1
  cylinder.color = [.4, .4, .4, 1.0];
  cylinder.matrix.setIdentity();
  cylinder.matrix.translate(-.14, -.02, -.35);
  cylinder.matrix.rotate(90, 1, 0, 0);
  if (g_frontLeg1Animation) {
    cylinder.matrix.rotate(25 * Math.sin(g_seconds), 1, 0, 0);
  } else {
    cylinder.matrix.rotate(g_frontLeg1, 0, 1, 0);
  }
  var frontLeg1Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.5, 2.5, .25);
  cylinder.render();

  // knee1
  cylinder.color = [.3, .3, .3, 1.0];
  cylinder.matrix = frontLeg1Coordinates;
  cylinder.matrix.translate(0, 0, .25);
  //cylinder.matrix.rotate(g_frontKnee1, 1, 0, 0);
  var frontKnee1Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.4, 2.4, .25);
  cylinder.render();

  // back leg1
  cylinder.color = [.4, .4, .4, 1.0];
  cylinder.matrix.setIdentity();
  cylinder.matrix.translate(-.14, 0, .59);
  cylinder.matrix.rotate(90, 1, 0, 0);
  if (g_backLeg1Animation) {
    cylinder.matrix.rotate(-25 * Math.sin(g_seconds), 1, 0, 0);
  } else {
    cylinder.matrix.rotate(g_backLeg1, 0, 1, 0);
  }
  var backLeg1Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.5, 2.5, .27);
  cylinder.render();

  // back knee1
  cylinder.color = [.3, .3, .3, 1.0];
  cylinder.matrix = backLeg1Coordinates;
  cylinder.matrix.translate(0, 0, .27);
  cylinder.matrix.rotate(g_backKnee1, 1, 0, 0);
  var backKnee1Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.4, 2.4, .25);
  cylinder.render();

  //front leg2
  cylinder.color = [.4, .4, .4, 1.0];
  cylinder.matrix.setIdentity();
  cylinder.matrix.translate(.14, -.02, -.35);
  cylinder.matrix.rotate(90, 1, 0, 0);
  if (g_frontLeg2Animation) {
    cylinder.matrix.rotate(-25 * Math.sin(g_seconds), 1, 0, 0);
  } else {
    cylinder.matrix.rotate(g_frontLeg2, 0, 1, 0);
  }
  var frontLeg2Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.5, 2.5, .25);
  cylinder.render();

  // front knee2
  cylinder.color = [.3, .3, .3, 1.0];
  cylinder.matrix = frontLeg2Coordinates;
  cylinder.matrix.translate(0, 0, .25);
  cylinder.matrix.rotate(g_frontKnee2, 1, 0, 0);
  var frontKnee2Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.4, 2.4, .25);
  cylinder.render();

  //back leg2
  cylinder.color = [.4, .4, .4, 1.0];
  cylinder.matrix.setIdentity();
  cylinder.matrix.translate(.14, 0, .59);
  cylinder.matrix.rotate(90, 1, 0, 0);
  if (g_backLeg1Animation) {
    cylinder.matrix.rotate(25 * Math.sin(g_seconds), 1, 0, 0);
  } else {
    cylinder.matrix.rotate(g_backLeg2, 0, 1, 0);
  }
  var backLeg2Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.5, 2.5, .27);
  cylinder.render();

  // backKnee2
  cylinder.color = [.3, .3, .3, 1.0];
  cylinder.matrix = backLeg2Coordinates;
  cylinder.matrix.translate(0, 0, .27);
  cylinder.matrix.rotate(g_backKnee2, 1, 0, 0);
  var backKnee2Coordinates = new Matrix4(cylinder.matrix);
  cylinder.matrix.scale(2.4, 2.4, .25);
  cylinder.render();

  // paw1
  cube.color = [.2, .2, .2, 1.0];
  cube.matrix = frontKnee1Coordinates;
  cube.matrix.translate(-.075, .07, .35);
  cube.matrix.rotate(180, 1, 0, 0);
  cube.matrix.scale(.15, .16, .1);
  cube.renderFaster();

  //paw2
  cube.color = [.2, .2, .2, 1.0];
  cube.matrix = backKnee1Coordinates;
  cube.matrix.translate(-.075, .07, .35);
  cube.matrix.rotate(180, 1, 0, 0);
  cube.matrix.scale(.15, .16, .1);
  cube.renderFaster();

  //paw3
  cube.color = [.2, .2, .2, 1.0];
  cube.matrix = frontKnee2Coordinates;
  cube.matrix.translate(-.075, .07, .35);
  cube.matrix.rotate(180, 1, 0, 0);
  cube.matrix.scale(.15, .16, .1);
  cube.renderFaster();

  //paw4
  cube.color = [.2, .2, .2, 1.0];
  cube.matrix = backKnee2Coordinates;
  cube.matrix.translate(-.075, .07, .35);
  cube.matrix.rotate(180, 1, 0, 0);
  cube.matrix.scale(.15, .16, .1);
  cube.renderFaster();
  // Check the time at the end of the function and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
}
// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
  var htmlE1m = document.getElementById(htmlID);
  if (!htmlE1m) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlE1m.innerHTML = text;
}
function updateRainbowColor() {
  g_selectedColor = rainbowColors[rainbowIndex];
  rainbowIndex = (rainbowIndex + 1) % rainbowColors.length;
}