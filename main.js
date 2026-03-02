let gl;
let program;

let table;
let plate;

let tableCache = { vertices: [] };
let plateCache = { vertices: [] };

function main() {
  // Retrieve <canvas> element
  let canvas = document.getElementById("webgl");

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

  // Initialize projection matrix
  pushMat4Uniform(
    mult(
      perspective(45, canvas.width / canvas.height, 0.1, 500),
      lookAt(vec3(2, 1, 2), vec3(0, 0, 0), vec3(0, 1, 0)),
    ),
    "projMatrix",
  );

  // Load the models
  table = new Model("data2/wooden_table.obj", "data2/wooden_table.mtl");
  plate = new Model("data2/plate.obj", "data2/plate.mtl");

  // Start render loop
  render();
}

function render() {
  // Clear canvas by clearing the color buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Render table
  renderModel(table, translate(0, 80.5, 0), tableCache);

  // Render plate
  renderModel(plate, translate(0, 0, 0), plateCache);

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
