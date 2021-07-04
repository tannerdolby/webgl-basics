const canvas = document.getElementById("scene");

// Get the WebGLRenderingContext interface which gives
// access to the OpenGL ES 2.0 API
var gl = canvas.getContext("webgl");

if (!gl) {
    console.error("WebGL is not supported! :-(");
}

// create shader program, upload GLSL source to GPU, 
// and compile the shader
/**
 * 
 * @param {WebGLRenderingContext} gl The WebGL context, ie the WebGLRenderingContext interface.
 * @param {gl.SHADER_TYPE} type The type of shader.
 * @param {string} source The GLSL strings representing the shader source.
 */
function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    // supply GLSL source
    gl.shaderSource(shader, source);
    // Compile GLSL
    gl.compileShader(shader);
    var isComplete = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (isComplete) {
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    // if shader wasn't successfully compiled, delete it
    gl.deleteShader(shader);
}

// get source from "nojs" GLSL strings in DOM
var vertexSrc = document.getElementById("vertex-shader-2d").textContent;
var fragmentSrc = document.getElementById("fragment-shader-2d").textContent;

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

// link two shaders into a program
function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    // link the two shaders into newly created program
    gl.linkProgram(program);
    var isComplete = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (isComplete) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    // otherwise delete program if link is unsuccessful
    gl.deleteProgram(program);
}

// create the program
var program = createProgram(gl, vertexShader, fragmentShader);

// GLSL program now created on GPU (state setup), 
// time to supply it data!
// note: the majority of the WebGL API is about
// setting up state (created GLSL programs 
// ie (vertex shader, fragment shader linked in a program) 
// on GPU) and then supplying it data 

// In this example the only input in the GLSL program
// is the attribute a_position 
// note: (Attributes are used to specify how to pull 
// data out of your buffers and provide them to your vertex shader.)
// buffers are binary data usually containing positions, 
// normals, texture coords, vertex colors, etc

// IMPORTANT 
// Looking up attribute locations (and uniform locations)
// should be done during initialization, not in the render loop

// ok, first things first, look up location of created attribute
var posAttrLocation = gl.getAttribLocation(program, "a_position");

// since attributes get their data from buffers 
// we need to create a buffer for the attr to pull data out of 
// to then provide to the vertex shader
var posBuffer = gl.createBuffer();

// WebGL lets us manipulate WebGL resources on global bind points
// these 'global bind points' are internal global variables in
// WebGL (essentially)
// We bind a resource to a bind point, then all the other functions
// in the program can refer to the resource within the same bind point
// sort of like environment variables in a javascript setting

// put data into newly created buffer by referencing it
// through a bind point, where gl.ARRAY_BUFFER is the target
// and posBuffer is the buffer to put data into from bind point
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

// put data into buffer by referencing the bind point created above
// WebGL needs strongly typed position data, so create a new array
// of 32bit floating point numbers [-1, 1] in clip space
var positions = new Float32Array([
    0, 1,
    -1, 0,
    0, 0
]);

// good ole right triangle

// put data into buffer (array of binary data 32bit floating point) 
// through referencing of bind point
// this step copies the data in `positions` to the 
// position buffer `posBuffer` on the GPU 
// the GPU is using the position buffer because we bound 
// it to the ARRAY_BUFFER bind point above with bindBuffer
// the final argument specifies how we will use the data,
// STATIC_DRAW tells WebGL we wont change the data much
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);


// EVERYTHING UP TO HERE IS CONSIDERED
// INITIALIZATION CODE , IE code that gets
// run once we load the webpage

// THE CODE BELOW THIS POINT IS CONSIDERED
// RENDERING code , or code that should get
// executed each time we want to render/draw


// BEGIN RENDERING CODE

// tell WebGL how to convert from the clip space
// values by setting gl_Position back into pixels
// (often called screen space), to do this
// call gl.viewport and pass it the current origin (position)
// and size of the canvas

// this tells WebGl the -1 to 1 plane representing the 
// clip-space maps to 0 to gl.canvas.width [0, gl.cvs.width)
// for x direction and 0 to gl.canvas.height [0, gl.cvs.height)
// for the y-direction
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// on a side note, this is actually really cool, it
// reminds me of a matrix undergoing a transformation
// matrix and having its inputs mapped to different
// inputs in another space (linear algebra class was worth it)
// ie transform points on one plane by 
// defining the position matrix and using a transformation
// matrix to map them to different inputs

// also reminds me a bit of cryptography in linear algebra
// using a transformation matrix to decode/encode strings 
// or messages

// clear the canvas (make it transparent)
gl.clearColor(0, 0, 0, 0); // rgba and colors go from 0-1 in WebGL
gl.clear(gl.COLOR_BUFFER_BIT);

// tell WebGL which shader program to execute
// tell it to run our two shader programs linked in the `program` var
gl.useProgram(program);

// Next we need to tell WebGL how to take data
// from the buffer we setup in initalization code above
// and then supply the attribute data in the shader

// TURN ON attribute so WebGL understands were pulling data out
gl.enableVertexAttribArray(posAttrLocation);

// Specify how exactly to pull the data out now that were 'ready'

// bind the position buffer to a bind point (ARRAY_BUFFER)
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

// Tell the attribute how to get data out of the 
// position buffer `posBuffer` which is a array of binary 
// data specifically an array of 32bit floating point values
var size = 2; // 2 components per iteration
var type = gl.FLOAT; // data in posBuffer is 32bit floats
var normalize = false; // dont normalize the data
var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get next position (iterating positions)
var offset = 0; // position to offset in buffer, start at begininning
// bind the current `ARRAY_BUFFER` to the attribute
// so we can reference data, moreover the attribute
// is now bound to `posBuffer`, which means were free
// to bind something to ARRAY_BUFFER bind point once again
// and the attribute will continue to use `posBuffer` bind 
// note: attributes default to (0,0,0,1) ie (x,y,z,w)
gl.vertexAttribPointer(
    posAttrLocation,
    size,
    type,
    normalize,
    stride,
    offset
);

// since size=2, the attribute will get its first two values
// from our buffer `posBuffer` or `ARRAY_BUFFER` if used,
// the z and w fields will be the default 0 and 1 values respectively

// We have appeased WebGL and may submit GLSL program for execution
var primitiveType = gl.TRIANGLES;
var offset = 0; // start at first position values in buffer
var count = 3; // execute vertex shader 3 times
gl.drawArrays(primitiveType, offset, count);

// the first time a_position.x and a_position.y in our 
// vertex shader attribute will be set to the first
// two values from posBuffer our buffer of 32bit floats
// the second time, (ie next iteration) a_position.x and
// a_position.y will be set to the next 2 values in posBuffer
// the last time they will be set to the last two values in our
// buffer

// Because we set primititveType to `gl.TRIANGLES`, each time
// our vertex shader is run 3 times, WebGL will draw the triangle
// based on the three values we set `gl_Position`.

// No matter what size the canvas is, the position values
// are in the clip space and coordinates range from -1 to 1
// in each direction

// because our vertex shader is simply copying
// the position buffer values in posBuffer
// to gl_Position, the triangle will be drawn
// at the clip space coordinates
// 0, 0,
// 0, 0.5,
// 0.7, 0,

// Converting from clip space to screen space, if the
// canvas size happened to be 400x300, we would get
// transformed values like this:

/*
clip space  --> screen space (viewport)
0, 0            200, 125
0, 0.5,         200, 225
0.7, 0          340, 150
*/

// Now WebGL is ready to render the triangle! :D

// And for every pixel its about to draw, WebGL
// will call the fragment shader. This examples fragment shader
// currently just sets `gl_FragColor` to 1, 0, 0.5, 1. 
// note: Colors go from 0-1 in WebGL

// Since the canvas is an 8bit per channel canvas, that means
// WebGL is going to write the values [255, 0, 127, 255] (rgba) into
// the canvas 
