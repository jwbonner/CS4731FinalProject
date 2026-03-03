let gl;
let program;
let canvas;

let table;
let plate;
let glass;
let fork;

let cube;

let tableCache = { vertices: [] };
let plateCache = { vertices: [] };
let glassCache = { vertices: [] };
let forkCache = { vertices: [] };

let cubeCache = { vertices: [] };

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

  // Initialize shaders
  program = initShaders(gl, "vshader", "fshader");
  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);

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

  // Start render loop
  render();
}
let time = -1;
function render() {
  time += 0.01;
  time = time % 5;

  // Clear canvas by clearing the color buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Update camera matrix
  pushMat4Uniform(
    mult(
      perspective(45, canvas.width / canvas.height, 0.1, 500),
      lookAt(vec3(0, 0, 1), vec3(0, 0, 0), vec3(0, 1, 0)),
    ),
    "projMatrix",
  );

  // Render table
  let tableTransform = translate(0.2, 0.18, 0);
  renderModel(table, tableTransform, tableCache);

  // Render glass
  let glassBaseTransform = rotateX(-90);
  renderModel(
    glass,
    mult(translate(0.2, 0, -0.1), glassBaseTransform),
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
        -0.01 * forkAnimateTime2,
      ),
      translate(
        0.15 * (forkAnimateTime1 - forkAnimateTime2),
        0.3 * (forkAnimateTime1 - forkAnimateTime2),
        -0.01 * (forkAnimateTime1 - forkAnimateTime2),
      ),
    ),
  );

  //Values for default fork positioning
  let forkBaseTranslate = translate(-0.2, 0.015, -0.3);
  let forkBaseTransform = mult(rotateZ(90), scalem(0.05, 0.05, 0.05));
  renderModel(
    fork,
    mult(
      forkTranslate,
      mult(forkBaseTranslate, mult(forkRotation, forkBaseTransform)),
    ),
    forkCache,
  );

  let plateSlideTime = Math.min(time, 1.0);
  let plateGroupTransform = translate(0.8 * (1 - plateSlideTime), 0, 0);

  // Render plate
  let plateBaseTransform = mult(
    translate(0, 0, -0.3),
    mult(scalem(0.5, 0.5, 0.5), rotateX(-90)),
  );
  renderModel(plate, mult(plateGroupTransform, plateBaseTransform), plateCache);

  // Render cubes
  renderModel(
    cube,
    mult(
      plateGroupTransform,
      mult(translate(0.02, 0.02, -0.34), scalem(0.01, 0.01, 0.01)),
    ),
    cubeCache,
  );
  renderModel(
    cube,
    mult(
      plateGroupTransform,
      mult(translate(-0.01, 0.02, -0.23), scalem(0.01, 0.01, 0.01)),
    ),
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
    cubeCache,
  );

  window.requestAnimationFrame(render);
}

function renderModel(model, modelMatrix, cache) {
  if (cache.vertices.length === 0 && model.faces.length > 0) {
    for (let i = 0; i < model.faces.length; i++) {
      let face = model.faces[i];
      cache.vertices = cache.vertices.concat(face.faceVertices);
    }
  }

  pushMat4Uniform(modelMatrix, "modelMatrix");
  pushVec4Attribute(cache.vertices, "vPosition");
  gl.drawArrays(gl.TRIANGLES, 0, cache.vertices.length);
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
