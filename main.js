let gl;
let program;
let canvas;

let table;
let plate;
let glass;
let fork;

let cube;

let tableCache = { vertices: [], normals: [], texCoords: [] };
let plateCache = { vertices: [], normals: [], texCoords: [] };
let glassCache = { vertices: [], normals: [], texCoords: [] };
let forkCache = { vertices: [], normals: [], texCoords: [] };

let cubeCache = { vertices: [], normals: [], texCoords: [] };

var lightPosition = vec4(5, -2, 5, 1.0);
var lightDiffuse = vec4(0.3, 0.3, 0.3, 1.0);
var lightSpecular = vec4(0.2, 0.2, 0.2, 1.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);

let alpha=0.4;
let beta = 1;
let playing = true;


function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = WebGLUtils.setupWebGL(canvas, undefined);

  //Check that the return value is not null.
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // Set viewport
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Set clear color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Enable depth testing
  gl.enable(gl.DEPTH_TEST);

  // Initialize shaders
  program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  // Initialize projection matrix
  pushMat4Uniform(
    mult(
      perspective(45, canvas.width / canvas.height, 0.1, 500),
      lookAt(vec3(2, 0, 2), vec3(0, 0, 0), vec3(0, 1, 0)),
    ),
    "projMatrix",
  );

  // Load the models
  table = new Model("data2/wooden_table.obj", "data2/wooden_table.mtl");
  plate = new Model("data2/plate.obj", "data2/plate.mtl");
  glass = new Model(
    "data2/tall-drinking-glass.obj",
    "data2/tall-drinking-glass.mtl",
  );
  fork = new Model("data2/lowpoly-fork.obj", "data2/lowpoly-fork.mtl");

  cube = new Model("data2/cube.obj", "data2/cube.mtl");

  // Load textures
  configureDefaultTexture();
  let image = new Image();
  image.crossOrigin = "";
  image.src = "data2/wood.jpg";
  image.onload = () => {
    configureTexture(image);
  };


  // Load Cubemap
  let loadedImages=0
  let cubeImages=[]
  for (let i = 0; i < 6; i++) {
    imagei = new Image();
    srcs = ["+X","-X","+Y","-Y","+Z","-Z"]
    imagei.src = "data2/cubeMap"+srcs[i]+".png";
    imagei.onload = () => {
      loadedImages++;
      if(loadedImages===6) {
        configureCubeMap(cubeImages);
      }
    };
    cubeImages.push(imagei);
  }



  // Add key binding
  document.addEventListener("keydown", (event) => getKeyDown(event));

  // Start render loop
  render();
}

let realtime = 0;
let time = 0;
function render() {
  if (playing) {
    realtime += 0.01;
  }
  realtime = realtime % 8;
  time = Math.min(realtime, 8 - realtime);

  // Clear canvas by clearing the color buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Update camera matrix
  pushMat4Uniform(
    mult(
      perspective(45, canvas.width / canvas.height, 0.1, 500),
      lookAt(
        vec3(2 * Math.sin(alpha), beta, 2 * Math.cos(alpha)),
        vec3(0, 0, 0),
        vec3(0, 1, 0),
      ),
    ),
    "projMatrix",
  );

  // Configure lighting
  pushVec4Uniform(lightPosition, "lightPosition");
  pushVec4Uniform(lightDiffuse, "lightDiffuse");
  pushVec4Uniform(lightSpecular, "lightSpecular");
  pushVec4Uniform(lightAmbient, "lightAmbient");

  gl.uniform1i(gl.getUniformLocation(program, "isSkybox"), 0);

  // Render table
  let tableTransform = translate(0.2, 0.18, 0);
  renderModel(table, tableTransform, 15, null, tableCache);

  // Render glass
  let glassBaseTransform = rotateX(-90);
  renderModel(
    glass,
    mult(translate(0.2, 0, -0.1), glassBaseTransform),
    80,
    vec4(0.5, 0.5, 0.5, 0.2),
    glassCache,
  );

  // Render fork
  let forkAnimateTime1 = Math.min(1.0, Math.max(0.0, time - 1.0));
  let forkAnimateTime2 = Math.min(1.0, Math.max(0.0, time - 2.0));
  let forkAnimateTime3 = Math.min(1.0, Math.max(0.0, time - 3.0));

  let forkRotation = rotateX(90 * forkAnimateTime1);
  let forkUp = translate(0, 0.18 * forkAnimateTime3, 0);
  let forkTranslate = mult(
    forkUp,
    mult(
      translate(
        0.15 * forkAnimateTime2,
        0.12 * forkAnimateTime2,
        -0.02 * forkAnimateTime2,
      ),
      translate(
        0.15 * (forkAnimateTime1 - forkAnimateTime2),
        0.3 * (forkAnimateTime1 - forkAnimateTime2),
        -0.02 * (forkAnimateTime1 - forkAnimateTime2),
      ),
    ),
  );

  // Values for default fork positioning
  let forkBaseTranslate = translate(-0.2, 0.015, -0.3);
  let forkBaseTransform = mult(rotateZ(90), scalem(0.05, 0.05, 0.05));
  renderModel(
    fork,
    mult(
      forkTranslate,
      mult(forkBaseTranslate, mult(forkRotation, forkBaseTransform)),
    ),
    120,
    vec4(0.5, 0.5, 0.5, 1.0),
    forkCache,
  );

  let plateSlideTime = Math.min(time, 1.0);
  let plateGroupTransform = translate(0.8 * (1 - plateSlideTime), 0, 0);

  // Render plate
  let plateBaseTransform = mult(
    translate(0, 0, -0.3),
    mult(scalem(0.5, 1, 0.5), rotateX(-90)),
  );
  renderModel(
    plate,
    mult(plateGroupTransform, plateBaseTransform),
    60,
    vec4(0.5, 0.5, 0.5, 1.0),
    plateCache,
  );

  // Render cubes
  renderModel(
    cube,
    mult(
      plateGroupTransform,
      mult(translate(0.02, 0.02, -0.34), scalem(0.01, 0.01, 0.01)),
    ),
    15,
    vec4(0.0, 0.0, 1.0, 1.0),
    cubeCache,
  );
  renderModel(
    cube,
    mult(
      plateGroupTransform,
      mult(translate(-0.01, 0.02, -0.23), scalem(0.01, 0.01, 0.01)),
    ),
    15,
    vec4(0.0, 1.0, 1.0, 1.0),
    cubeCache,
  );

  renderModel(
    cube,
    mult(
      forkUp,
      mult(
        plateGroupTransform,
        mult(translate(-0.05, 0.02, -0.32), scalem(0.01, 0.01, 0.01)),
      ),
    ),
    15,
    vec4(1.0, 1.0, 0.0, 1.0),
    cubeCache,
  );

  //render skybox
  gl.uniform1i(gl.getUniformLocation(program, "isSkybox"), 1);
  renderModel(
      cube,
      mult(translate(0,1.19,0),scalem(2,2,2)),
      15,
      null,
      cubeCache
  )

  window.requestAnimationFrame(render);
}

function getKeyDown(e) {
  if (e.key === "ArrowLeft") {
    alpha -= 0.1;
  }
  if (e.key === "ArrowRight") {
    alpha += 0.1;
  }
  if (e.key === "ArrowUp") {
    beta += 0.1;
  }
  if (e.key === "ArrowDown") {
    beta -= 0.1;
  }
  beta = Math.min(Math.max(beta,-2),2)
  if (e.key === " ") {
    playing = !playing;
  }
  if (e.key.toUpperCase() === "R") {
    realtime = 0;
  }
}

function renderModel(model, modelMatrix, shininess, color, cache) {
  // Cache vertices and normals
  if (
    cache.vertices.length === 0 &&
    cache.normals.length === 0 &&
    cache.texCoords.length === 0 &&
    model.faces.length > 0
  ) {
    for (let i = 0; i < model.faces.length; i++) {
      let face = model.faces[i];
      cache.vertices = cache.vertices.concat(face.faceVertices);
      cache.normals = cache.normals.concat(face.faceNormals);
      cache.texCoords = cache.texCoords.concat(face.faceTexCoords);
    }
  }

  // Push material data
  if (model.faces.length > 0) {
    let material = model.faces[0].material;
    if (model.diffuseMap.has(material)) {
      let materialDiffuse = model.diffuseMap.get(material);
      let materialSpecular = model.specularMap.get(material);
      let materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);

      pushVec4Uniform(materialDiffuse, "materialDiffuse");
      pushVec4Uniform(materialSpecular, "materialSpecular");
      pushVec4Uniform(materialAmbient, "materialAmbient");
      pushFloatUniform(shininess, "shininess");
    }
  }

  // Push attributes
  pushVec4Attribute(cache.vertices, "vPosition");
  pushVec4Attribute(cache.normals, "vNormal");
  pushVec2Attribute(cache.texCoords, "vTexCoord");
  pushIntUniform(color === null ? 1 : 0, "hasTexture");
  pushVec4Uniform(
    color === null ? vec4(0.0, 0.0, 0.0, 1.0) : color,
    "colorBase",
  );

  // Push model matrix
  pushMat4Uniform(modelMatrix, "modelMatrix");

  // Render
  gl.drawArrays(gl.TRIANGLES, 0, cache.vertices.length);
}

function configureDefaultTexture() {
  let tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    2,
    2,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([
      0, 0, 255, 255, 255, 0, 0, 255, 0, 0, 255, 255, 0, 255, 0, 255,
    ]),
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function configureTexture(image) {
  let tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0);
}

function configureCubeMap(images) {
  let cubeMap = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[0]);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[1]);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[2]);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[3]);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[4]);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[5]);

  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
}

/** Push an attribute of vec4 values. */
function pushVec4Attribute(data, attName) {
  let buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

  let attrib = gl.getAttribLocation(program, attName);
  gl.vertexAttribPointer(attrib, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attrib);
}

/** Push an attribute of vec2 values. */
function pushVec2Attribute(data, attName) {
  let buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

  let attrib = gl.getAttribLocation(program, attName);
  gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attrib);
}

/** Push a uniform with an int value. */
function pushIntUniform(data, uniName) {
  let uniform = gl.getUniformLocation(program, uniName);
  gl.uniform1i(uniform, data);
}

/** Push a uniform with a float value. */
function pushFloatUniform(data, uniName) {
  let uniform = gl.getUniformLocation(program, uniName);
  gl.uniform1f(uniform, data);
}

/** Push a uniform with a vec4 value. */
function pushVec4Uniform(data, uniName) {
  let uniform = gl.getUniformLocation(program, uniName);
  gl.uniform4fv(uniform, data);
}

/** Push a uniform with a mat4 value. */
function pushMat4Uniform(data, uniName) {
  let uniform = gl.getUniformLocation(program, uniName);
  gl.uniformMatrix4fv(uniform, false, flatten(data));
}
