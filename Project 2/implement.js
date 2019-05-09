// programs
var canvas;
var gl;

// control flags
var isEditable;
var showBorder;
var doAnimation;
var showTexture;

// time register
var last;
var current;
var duration;

// vertex variables
var vertices;
var vertexColors;
var handlerIdx;

// renderers
var triRenderer;
var borderRenderer;
var textureRenderer;

// constants
const ANGLE_STEP = 45;
const SCALE_STEP = 0.2;
const SCALE_INTERVAL = {"max": 1, "min": 0.2};
const QDLIMIT = 100;

// initializer
function init() {
    isEditable = true;
    showBorder = true;
    doAnimation = false;
    showTexture = false;
    last = 0;
    current = 0;
    duration = 0;

    vertices = [];
    for (var vertex of vertex_pos) {
        vertices.push(coordinate_canvasToWebGL(vertex));
    }

    vertexColors = [];
    for (var color of vertex_color) {
        vertexColors.push(color_canvasToWebGL(color));
    }

    canvas = document.getElementById('webgl');
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // init interaction functions
    canvas.addEventListener('mousedown', (event) => {
        var pos = coordinate_getOriPos([event.offsetX, event.offsetY]);
        for (var i in vertices) {
            var distance = getQuadDistance(pos, coordinate_WebGLToCanvas(vertices[i]));
            if (distance < QDLIMIT) {
                handlerIdx = i;
                return;
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (isEditable) handlerIdx = undefined;
    });

    canvas.addEventListener('mouseleave', () => {
        if (isEditable) handlerIdx = undefined;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (typeof(handlerIdx) == 'undefined' || !isEditable) return;
        vertices[handlerIdx] = coordinate_canvasToWebGL(coordinate_getOriPos([event.offsetX, event.offsetY]));
        draw();
    });

    document.addEventListener('keydown', (event) => {
        switch(event.keyCode) {
            // press 'B'
            case 66:
                switch_border();
                return;
            // press 'T'
            case 84:
                switch_animation();
                return;
            // press 'E'
            case 69:
                switch_resetAnimation();
                return;
            // press 'I'
            case 73:
                switch_texture();
                return;
        }
    });

    triRenderer = new TriRenderer(gl);
    borderRenderer = new BorderRenderer(gl);
    textureRenderer = new TextureRenderer(gl);
}

// control functions
function switch_resetAnimation() {
    isEditable = true;
    doAnimation = false;
    last = 0;
    current = 0;
    duration = 0;
    draw();
}

function switch_border() {
    showBorder = !showBorder;
    draw();
}

function switch_animation() {
    doAnimation = !doAnimation;
    isEditable = !doAnimation;
    if (doAnimation) {
        last = Date.now();
        tick();
    } else {
        duration += Date.now() - last;
    }
}

function switch_texture() {
    showTexture = !showTexture;
    draw();
}

// animation player
function tick() {
    if(!doAnimation) return;
    current = duration + Date.now() - last;
    draw();
    requestAnimationFrame(tick);
}

// draw function
function draw() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    var angle = getAngle(current);
    var scale = getScale(current);

    var triBuffer = [];
    var borderBuffer = [];
    var textureBuffer = [];
    for (var p of polygon) {
        triBuffer = triBuffer.concat(createTriInput(p, scale));
        borderBuffer = borderBuffer.concat(createBorderInput(p, scale));
        textureBuffer = textureBuffer.concat(createTextrueInput(p, scale));
    }
    
    if (!showTexture) {
        triRenderer.render(triBuffer, angle);
    } else {
        textureRenderer.render(textureBuffer, angle);
    }

    if (showBorder) {
        borderRenderer.render(borderBuffer, angle);   
    }
}

// converter funcitons
function coordinate_canvasToWebGL(pos) {
    return [pos[0] * 2 / canvasSize.maxX - 1, -pos[1] * 2 / canvasSize.maxY + 1];
}

function coordinate_WebGLToCanvas(pos) {
    return [(pos[0] + 1) * canvasSize.maxX / 2, -(pos[1] - 1) * canvasSize.maxY / 2];
}

function coordinate_getOriPos(pos) {
    pos = coordinate_canvasToWebGL(pos);
    var angle = getAngle(duration) * Math.PI / 180;
    var scale = 1 / getScale(duration);
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var result = [(pos[0] * cos + pos[1] * sin) * scale, (pos[1] * cos - pos[0] * sin) * scale];
    return coordinate_WebGLToCanvas(result);
}

function color_canvasToWebGL(color) {
    return [color[0] / 255, color[1] / 255, color[2] / 255];
}

// calculation functions
function getQuadDistance(p1, p2) {
    return (p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]);
}

function getScale(time) {
    return Math.abs((SCALE_INTERVAL.max * 4 - (time / 1000) % 8)* 0.2) + SCALE_INTERVAL.min;
}

function getAngle(time) {
    return ((time * ANGLE_STEP) / 1000) % 360;
}

// array creating functions
function createTriInput(polygon, scale) {
    var order = [0, 1, 2, 2, 3, 0];
    var result = [];
    for (var idx of order) {
        var pos = vertices[polygon[idx]];
        var color = vertexColors[polygon[idx]];
        result = result.concat(pos.map((x) => x * scale)).concat(color);
    }
    return result;
}

function createBorderInput(polygon, scale) {
    var order = [0, 1, 1, 2, 2, 0, 2, 3, 3, 0];
    var result = [];
    for (var idx of order) {
        var pos = vertices[polygon[idx]];
        result = result.concat(pos.map((x) => x * scale));
    }
    return result;
}

function createTextrueInput(polygon, scale) {
    var order = [0, 1, 2, 2, 3, 0];
    var result = [];
    for (var idx of order) {
        var pos = vertices[polygon[idx]];
        result = result.concat(pos.map((x) => x * scale)).concat(pos.map((x) => (x + 1) / 2));
    }
    return result;
}

// renderers
class TriRenderer {
    constructor(gl) {
        this.gl = gl;

        var VSHADER_SOURCE = 
            'attribute vec4 a_Position;\n' +
            'uniform mat4 u_ModelMatrix;\n' +
            'attribute vec4 a_Color;\n' +
            'varying vec4 v_Color;\n' +
            'void main() {\n' +
            '   gl_Position = u_ModelMatrix * a_Position;\n' +
            '   v_Color = a_Color;\n' +
            '}\n';

        var FSHADER_SOURCE = 
            'precision mediump float;\n' +
            'varying vec4 v_Color;\n' +
            'void main() {\n' +
            '   gl_FragColor = v_Color;\n' +
            '}\n';

        this.program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
        if (!this.program) {
            throw "Failed to create program for triangle rendering";
        }

        this.buffer = gl.createBuffer();
        if (!this.buffer) {
            throw "Failed to create buffer for triangle rendering";
        }
    }
    
    render(bufferArray, angle) {
        bufferArray = new Float32Array(bufferArray);

        this.gl.useProgram(this.program);
        this.gl.program = this.program;
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferArray, this.gl.STATIC_DRAW);
        var FSIZE = bufferArray.BYTES_PER_ELEMENT;

        var a_Position = this.gl.getAttribLocation(this.gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get the storage locaiton of a_Position');
            return;
        }

        this.gl.vertexAttribPointer(a_Position, 2, this.gl.FLOAT, false, FSIZE * 5, 0);
        this.gl.enableVertexAttribArray(a_Position);

        var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        if (a_Color < 0) {
            console.log('Failed to get the storage locaiton of a_Color');
            return;
        }

        this.gl.vertexAttribPointer(a_Color, 3, this.gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
        this.gl.enableVertexAttribArray(a_Color);

        this.gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        var u_ModelMatrix = this.gl.getUniformLocation(this.gl.program, 'u_ModelMatrix');
        if (!u_ModelMatrix) {
            console.log('Failed to get the storage location of u_ModelMatrix');
            return;
        }
        
        var modelMatrix = new Matrix4();
        modelMatrix.setRotate(angle, 0, 0, 1);
        this.gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        
        this.gl.drawArrays(gl.TRIANGLES, 0, bufferArray.length / 5);
    }
}

class BorderRenderer {
    constructor(gl) {
        this.gl = gl;

        var VSHADER_SOURCE = 
            'attribute vec4 a_Position;\n' +
            'uniform mat4 u_ModelMatrix;\n' +
            'void main() {\n' +
            '   gl_Position = u_ModelMatrix * a_Position;\n' +
            '}\n';

        var FSHADER_SOURCE = 
            'precision mediump float;\n' +
            'varying vec4 v_Color;\n' +
            'void main() {\n' +
            '   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
            '}\n';

        this.program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
        if (!this.program) {
            throw "Failed to create program for border rendering";
        }

        this.buffer = gl.createBuffer();
        if (!this.buffer) {
            throw "Failed to create buffer for border rendering";
        }
    }

    render(bufferArray, angle) {
        bufferArray = new Float32Array(bufferArray);

        this.gl.useProgram(this.program);
        this.gl.program = this.program;
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferArray, this.gl.STATIC_DRAW);
        var FSIZE = bufferArray.BYTES_PER_ELEMENT;

        var a_Position = this.gl.getAttribLocation(this.gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get the storage locaiton of a_Position');
            return;
        }

        this.gl.vertexAttribPointer(a_Position, 2, this.gl.FLOAT, false, FSIZE * 2, 0);
        this.gl.enableVertexAttribArray(a_Position);

        this.gl.bindBuffer(gl.ARRAY_BUFFER, null);

        var u_ModelMatrix = this.gl.getUniformLocation(this.gl.program, 'u_ModelMatrix');
        if (!u_ModelMatrix) {
            console.log('Failed to get the storage location of u_ModelMatrix');
            return;
        }
        
        var modelMatrix = new Matrix4();
        modelMatrix.setRotate(angle, 0, 0, 1);
        this.gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        
        this.gl.drawArrays(gl.LINES, 0, bufferArray.length / 2);
    }
}

class TextureRenderer {
    constructor(gl) {
        this.gl = gl;

        var VSHADER_SOURCE = 
            'attribute vec4 a_Position;\n' +
            'attribute vec2 a_TexCoord;\n' +
            'varying vec2 v_TexCoord;\n' +
            'uniform mat4 u_ModelMatrix;\n' +
            'void main() {\n' +
            '   gl_Position = u_ModelMatrix * a_Position;\n' +
            '   v_TexCoord = a_TexCoord;\n' +
            '}\n';

        var FSHADER_SOURCE = 
            'precision mediump float;\n' +
            'uniform sampler2D u_Sampler;\n' +
            'varying vec2 v_TexCoord;\n' +
            'void main() {\n' +
            '   gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
            '}\n';

        this.program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
        if (!this.program) {
            throw "Failed to create program for texture rendering";
        }

        this.buffer = gl.createBuffer();
        if (!this.buffer) {
            throw "Failed to create buffer for texture rendering";
        }

        this.texture = gl.createTexture();
        if (!this.texture) {
            throw "Failed to create the texture object.";
        }

        this.image = new Image();
        if (!this.image) {
            throw "Failed to create the image object.";
        }
        this.image.onload = () => {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image's y axis
        
            gl.activeTexture(gl.TEXTURE0);              // Enable the texture unit 0
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            
            // Set the texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.image);
        }
    
        this.image.crossOrigin = "";
        this.image.src = './Resources/girl.jpg';
    }

    render(bufferArray, angle) {
        bufferArray = new Float32Array(bufferArray);

        this.gl.useProgram(this.program);
        this.gl.program = this.program;
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferArray, this.gl.DYNAMIC_DRAW);
        var FSIZE = bufferArray.BYTES_PER_ELEMENT;

        var a_Position = this.gl.getAttribLocation(this.gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get the storage locaiton of a_Position');
            return;
        }

        this.gl.vertexAttribPointer(a_Position, 2, this.gl.FLOAT, false, FSIZE * 4, 0);
        this.gl.enableVertexAttribArray(a_Position);

        var a_TexCoord = this.gl.getAttribLocation(this.gl.program, 'a_TexCoord');
        if (a_TexCoord < 0) {
            console.log('Failed to get the storage locaiton of a_TexCoord');
            return;
        }
    
        this.gl.vertexAttribPointer(a_TexCoord, 2, this.gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
        this.gl.enableVertexAttribArray(a_TexCoord);

        this.gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // texture mapping
        if (!this.initTextures(this.gl)) {
            throw 'Failed to initialize texture';
        }

        var u_ModelMatrix = this.gl.getUniformLocation(this.gl.program, 'u_ModelMatrix');
        if (!u_ModelMatrix) {
            console.log('Failed to get the storage location of u_ModelMatrix');
            return;
        }
        
        var modelMatrix = new Matrix4();
        modelMatrix.setRotate(angle, 0, 0, 1);
        this.gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        
        this.gl.drawArrays(gl.TRIANGLES, 0, bufferArray.length / 4);
    }

    initTextures(gl) {
        var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
        if (u_Sampler < 0) {
            console.log('Failed to get the storage locaiton of u_Sampler');
            return -1;
        }
        gl.uniform1i(u_Sampler, 0);
    
        return true;
    }
}

function main() {
    init();
    draw();
}