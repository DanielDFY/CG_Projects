// object list for scene rendering
var loaders = [];

// print current message of Camera
function printMessage(){
  var message = `
    position: ${Camera.eye.elements[0].toFixed(1)}, ${Camera.eye.elements[1].toFixed(1)}. ${Camera.eye.elements[2].toFixed(1)}
    look at: ${Camera.at.elements[0].toFixed(1)}, ${Camera.at.elements[1].toFixed(1)}, ${Camera.at.elements[2].toFixed(1)}
  `;
	var mb = document.getElementById("messageBox");
	mb.innerHTML = "message:\t"+ message;
}

function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  
  // Get the rendering context for WebGL
	gl = getWebGLContext(canvas);
	if (!gl) {
	  console.log('Failed to get the rendering context for WebGL');
	  return;
  }
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  KeyController.init();

  var floorLoader = new TextureLoader(floorRes, {
    'gl': gl,
    'activeTextureIndex': 0,
    'enableLight': true
  }).init();
  loaders.push(floorLoader);

  var boxLoader = new TextureLoader(boxRes, {
    'gl': gl,
    'activeTextureIndex': 1,
    'enableLight': true
  }).init();
  loaders.push(boxLoader);

  for (var o of ObjectList) {
    let obj = new ObjectLoader(o, gl).init();
    // Bird animation
    if (o.objFilePath.indexOf('bird') > 0) {
      obj.moving = (time)=> {
        var rot = (time / 10) % 360;
        var trans = (time / 1000 * Math.PI) % (2 * Math.PI);
        obj.entity.transform[1].content[0] = rot;
        obj.entity.transform[2].content[1] = Math.sin(trans) * 2;
      }
    }
    loaders.push(obj);
  }

  var render = (time) => {
    updateCamera(time);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    for (var loader of this.loaders) {
      loader.render(time);
    }
    printMessage();
    window.requestAnimationFrame(render);
  };

  render(0);
}

function updateCamera(time) {
  var elapsed = time - KeyController.last;
  KeyController.last = time;

  var posX = (Camera.state.moveForward - Camera.state.moveBack) * MOVE_VELOCITY * elapsed / 1000;
  var posY = (Camera.state.moveRight - Camera.state.moveLeft) * MOVE_VELOCITY * elapsed / 1000;

  var rotX = (Camera.state.rotateUp - Camera.state.rotateDown) * ROT_VELOCITY * elapsed / 1000 / 180 * Math.PI;
  var rotY = (Camera.state.rotateRight - Camera.state.rotateLeft) * ROT_VELOCITY * elapsed / 1000 / 180 * Math.PI;

  if (posX || posY) Camera.move(posX, posY);
  if (rotX || rotY) Camera.rotate(rotX, rotY);
}

class Camera {
  static init() {
    Camera.state = {
      moveForward: false, moveBack: false, moveLeft: false, moveRight: false,
      rotateUp: false, rotateDown: false, rotateLeft: false, rotateRight: false,
      flashLight: false
    };
    Camera.at = new Vector3(CameraPara.at);
    Camera.eye = new Vector3(CameraPara.eye);
    Camera.up = new Vector3(CameraPara.up);
    Camera.fov = CameraPara.fov;
    Camera.near = CameraPara.near;
    Camera.far = CameraPara.far;
    Camera.lightColor = new Vector3(scenePointLightColor);
  }

  // Set the eye point and the viewing volume
  static getVpMatrix() {
    var vpMatrix = new Matrix4();
    vpMatrix.perspective(Camera.fov, canvas.width / canvas.height, Camera.near, Camera.far);
    vpMatrix.lookAt(Camera.eye.elements[0], Camera.eye.elements[1], Camera.eye.elements[2],
      Camera.at.elements[0], Camera.at.elements[1], Camera.at.elements[2],
      Camera.up.elements[0], Camera.up.elements[1], Camera.up.elements[2]);
    return vpMatrix;
  }

  static getViewMatrix() {
    var viewMatrix = new Matrix4();
    viewMatrix.lookAt(Camera.eye.elements[0], Camera.eye.elements[1], Camera.eye.elements[2],
      Camera.at.elements[0], Camera.at.elements[1], Camera.at.elements[2],
      Camera.up.elements[0], Camera.up.elements[1], Camera.up.elements[2]);
    return viewMatrix;
  }

  static move(x, y) {
    // Build up current viewer coordinate system
    var v = VectorMinus(Camera.eye, Camera.at).normalize();
    var w = VectorCross(v, Camera.up);
    // Calculate movement
    var movement = VectorAdd(VectorMultNum(v, x), VectorMultNum(w, y));
    // Do camera movement
    Camera.at = VectorMinus(Camera.at, movement);
    Camera.eye = VectorMinus(Camera.eye, movement);
  }

  static rotate(horizon, vertical) {
    // Build up current viewer coordinate system
    var v = VectorMinus(Camera.at, Camera.eye).normalize();
    var w = VectorCross(v, Camera.up);
    // Calculate rotation
    Camera.at = VectorAdd(VectorAdd(Camera.at, VectorMultNum(Camera.up, horizon)), VectorMultNum(w, vertical));
    var direction = VectorMinus(Camera.at, Camera.eye).normalize();
    // Do camera rotation
    Camera.at = VectorAdd(Camera.eye, direction);
    Camera.up = VectorCross(w, direction);
  }
}

class KeyController {
  static init() {
    KeyController.last = 0;
    KeyController.keyMap = new Map();

    Camera.init();
    var controlMap = new Map();
    controlMap.set('W', 'moveForward');
    controlMap.set('S', 'moveBack');
    controlMap.set('A', 'moveLeft');
    controlMap.set('D', 'moveRight');
    controlMap.set('I', 'rotateUp');
    controlMap.set('K', 'rotateDown');
    controlMap.set('J', 'rotateLeft');
    controlMap.set('L', 'rotateRight');
    controlMap.set('F', 'flashLight');
  
    controlMap.forEach((val, key)=> {
      KeyController.bind(key, {
        on: (()=> {
          Camera.state[val] = true;
        }),
        off: (()=> {
          Camera.state[val] = false;
        })
      });
    });

    document.addEventListener('keydown', (event)=> {
      var key = String.fromCharCode(event.which);
      if (!KeyController.keyMap.get(key)) return;
      KeyController.keyMap.get(key).on();
    });
    document.addEventListener('keyup', (event)=> {
      var key = String.fromCharCode(event.which);
      if (!KeyController.keyMap.get(key)) return;
      KeyController.keyMap.get(key).off();
    })
  }

  static bind(key, callback) {
    KeyController.keyMap.set(key, callback);
  }
}

class TextureLoader {
  constructor(entity, config) {
    this.entity = entity;
    this.gl = config.gl;
    this.enableLight = config.enableLight;
    this.activeTextureIndex = config.activeTextureIndex;
  }

  init() {
    // Vertex shader program
    var VSHADER_SOURCE = `
            attribute vec4 a_Position;
            attribute vec2 a_TexCoord;
            attribute vec4 a_Normal;
            uniform mat4 u_MvpMatrix;
            uniform mat4 u_ModelMatrix;
            uniform mat4 u_NormalMatrix;
            varying vec2 v_TexCoord;
            varying vec4 v_Color;
            uniform vec3 u_PointLightColor;
            uniform vec3 u_PointLightPosition;

            void main() {
              gl_Position = u_MvpMatrix * a_Position;
              v_TexCoord = a_TexCoord;
              vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
              vec3 pointLightDirection = normalize(u_PointLightPosition - vec3(u_ModelMatrix * a_Position));
              float pointLightnDotL = max(dot(pointLightDirection, normal), 0.0);
              vec3 pointLightDiffuse = u_PointLightColor * pointLightnDotL * 0.5;
              v_Color = vec4(pointLightDiffuse, 1.0);
            }`;

    // Fragment shader program
    var FSHADER_SOURCE = `
            #ifdef GL_ES
            precision mediump float;
            #endif
            uniform sampler2D u_Sampler;
            varying vec2 v_TexCoord;
            varying vec4 v_Color;
            void main() {
              gl_FragColor = texture2D(u_Sampler, v_TexCoord) + v_Color;
            }`;

    // Initialize shaders
    this.program = createProgram(this.gl, VSHADER_SOURCE, FSHADER_SOURCE);
    if (!this.program) {
      console.log('Failed to create TextureLoader program');
      return;
    }

    // Vertex coordinates buffer object
    this.vertexBuffer = this.gl.createBuffer();
    // Vertex texture coordinates buffer object
    this.vertexTexCoordBuffer = this.gl.createBuffer();
    // Normal buffer object
    this.vertexNormalBuffer = this.gl.createBuffer();
    // Vertex indices buffer object
    this.vertexIndexBuffer = this.gl.createBuffer();
    
    this.u_MvpMatrix = this.gl.getUniformLocation(this.program, 'u_MvpMatrix');
    if (!this.u_MvpMatrix) {
      console.log('Failed to get the storage location of u_MvpMatrix');
    }

    // Get the storage locations of attribute and uniform variables
    this.a_Position = this.gl.getAttribLocation(this.program, 'a_Position');
    this.a_TexCoord = this.gl.getAttribLocation(this.program, 'a_TexCoord');
    this.a_Normal = this.gl.getAttribLocation(this.program, 'a_Normal');
    this.u_MvpMatrix = this.gl.getUniformLocation(this.program, 'u_MvpMatrix');
    this.u_ModelMatrix = this.gl.getUniformLocation(this.program, 'u_ModelMatrix');
    this.u_NormalMatrix = this.gl.getUniformLocation(this.program, 'u_NormalMatrix');
    this.u_Sampler = this.gl.getUniformLocation(this.program, 'u_Sampler');
    if (this.u_Sampler < 0) {
      console.log('Failed to get the storage location of u_Sampler');
      return;
    }

    // Initialize model and normal matrices
    this.g_modelMatrix = new Matrix4();
    this.g_modelMatrix.translate(this.entity.translate[0], this.entity.translate[1], this.entity.translate[2]);
    this.g_modelMatrix.scale(this.entity.scale[0], this.entity.scale[1], this.entity.scale[2]);
    this.g_normalMatrix = new Matrix4();

    // Initialize texture
    this.texture = this.gl.createTexture();
    if (!this.texture) {
      console.log('Failed to create the texture object');
      return false;
    }
    // Create a 1x1 placeholder to avoid large image loading delay
    this.gl.activeTexture(this.gl[`TEXTURE${this.activeTextureIndex}`]);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,new Uint8Array([0, 0, 0, 255]));

    this.textureImage = new Image();
    if (!this.textureImage) {
      console.log('Failed to create the image object');
      return false;
    }
    this.textureImage.onload = (() => {
      // Flip the image's y axis
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
      this.gl.activeTexture(this.gl[`TEXTURE${this.activeTextureIndex}`]);
      // Bind the texture object to the target
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      // Set the texture parameters
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      // Set the texture image
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, this.textureImage);
    });
    this.textureImage.crossOrigin = "";
    this.textureImage.src = `${this.entity.texImagePath}`;

    return this;
  }

  render(time) {
    this.gl.useProgram(this.program);
    this.gl.program = this.program;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.entity.vertex), this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Position);


    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.entity.texCoord), this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(this.a_TexCoord, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_TexCoord);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.entity.normal), this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(this.a_Normal, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Normal);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.entity.index), this.gl.STATIC_DRAW);

    // Pass matrices to shaders
    var mvpMatrix = Camera.getVpMatrix().multiply(this.g_modelMatrix);
    this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, mvpMatrix.elements);
    this.gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.g_normalMatrix.elements);
    this.gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.g_modelMatrix.elements);

    if (this.enableLight){
      this.u_PointLightColor = this.gl.getUniformLocation(this.gl.program, 'u_PointLightColor');
      this.u_PointLightPosition = this.gl.getUniformLocation(this.gl.program, 'u_PointLightPosition');
    }

    if (Camera.state.flashLight) {
      this.gl.uniform3fv(this.u_PointLightColor, Camera.lightColor.elements);
      this.gl.uniform3fv(this.u_PointLightPosition, Camera.eye.elements);
    } else {
      this.gl.uniform3fv(this.u_PointLightColor, new Vector3([0,0,0]).elements);
      this.gl.uniform3fv(this.u_PointLightPosition, new Vector3([0,0,0]).elements);
    }

    // Set the texture unit n to the sampler
    this.gl.uniform1i(this.u_Sampler, this.activeTextureIndex);

    // Draw
    this.gl.drawElements(this.gl.TRIANGLES, this.entity.index.length, this.gl.UNSIGNED_SHORT, 0);
  }
}


class ObjectLoader {
  constructor(entity, gl) {
    this.gl = gl;
    this.entity = entity;
  }

  init() {
      // Vertex shader program
    var VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        attribute vec4 a_Normal;
        uniform mat4 u_MvpMatrix;
        uniform mat4 u_ModelMatrix;
        uniform mat4 u_NormalMatrix;
        varying vec4 v_Color;
        uniform vec3 u_LightDirection;
        uniform vec3 u_AmbientLight;
        uniform vec3 u_PointLightColor;
        uniform vec3 u_PointLightPosition;
        void main() {
          gl_Position = u_MvpMatrix * a_Position;
          vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
          vec3 pointLightDirection = normalize(u_PointLightPosition - vec3(u_ModelMatrix * a_Position));
          float pointLightnDotL = max(dot(pointLightDirection, normal), 0.0);
          vec3 pointLightDiffuse = u_PointLightColor * a_Color.rgb * pointLightnDotL;
          float nDotL = max(dot(u_LightDirection, normal), 0.0);
          vec3 u_DiffuseLight = vec3(1.0, 1.0, 1.0);
          vec3 diffuse = u_DiffuseLight * a_Color.rgb * nDotL;
          vec3 ambient = u_AmbientLight * a_Color.rgb;
          v_Color = vec4(diffuse + ambient + pointLightDiffuse, a_Color.a);
        }`;

    // Fragment shader program
    var FSHADER_SOURCE = `
        #ifdef GL_ES
        precision mediump float;
        #endif
        varying vec4 v_Color;
        void main() {
          gl_FragColor = v_Color;
        }`;

    // Initialize shaders
    this.program = createProgram(this.gl, VSHADER_SOURCE, FSHADER_SOURCE);
    if (!this.program) {
      console.log('Failed to create ObjectLoader program');
      return;
    }

    // Vertex coordinates buffer object
    this.vertexBuffer = this.gl.createBuffer();
    // Vertex color buffer object
    this.vertexColorBuffer = this.gl.createBuffer();
    // Normal buffer object
    this.vertexNormalBuffer = this.gl.createBuffer();
    // Vertex indices buffer object
    this.vertexIndexBuffer = this.gl.createBuffer();

    // Get the storage locations of attribute and uniform variables
    this.a_Position = this.gl.getAttribLocation(this.program, 'a_Position');
    this.a_Color = this.gl.getAttribLocation(this.program, 'a_Color');
    this.a_Normal = this.gl.getAttribLocation(this.program, 'a_Normal');
    this.u_MvpMatrix = this.gl.getUniformLocation(this.program, 'u_MvpMatrix');
    this.u_ModelMatrix = this.gl.getUniformLocation(this.program, 'u_ModelMatrix');
    this.u_NormalMatrix = this.gl.getUniformLocation(this.program, 'u_NormalMatrix');
    
    this.u_LightDirection = this.gl.getUniformLocation(this.program, 'u_LightDirection');
    this.u_AmbientLight = this.gl.getUniformLocation(this.program, 'u_AmbientLight');
    this.u_PointLightColor = this.gl.getUniformLocation(this.program, 'u_PointLightColor');
    this.u_PointLightPosition = this.gl.getUniformLocation(this.program, 'u_PointLightPosition');

    this.g_modelMatrix = new Matrix4();
    for (var t of this.entity.transform) {
      this.g_modelMatrix[t.type].apply(this.g_modelMatrix, t.content);
    }

    this.g_normalMatrix = new Matrix4();
    this.g_normalMatrix.setInverseOf(this.g_modelMatrix).transpose();

    this.g_objDoc = null;      // The information of OBJ file
    this.g_drawingInfo = null;   // The information for drawing 3D model

    // Start reading the OBJ file
    this.readOBJFile(`${this.entity.objFilePath}`, 1, true);

    return this;
  }

  readOBJFile(fileName, scale, reverse) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      if (request.readyState === 4 && request.status !== 404) {
        this.onReadOBJFile(request.responseText, fileName, scale, reverse);
      }
    };
    request.open('GET', fileName, true);
    request.send();
  }

  onReadOBJFile(fileString, fileName, scale, reverse) {
    var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    if(this.entity.color.length == 3){
			this.entity.color.push(1.0);
		}
    objDoc.defaultColor = this.entity.color;
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
      this.g_objDoc = null;
      this.g_drawingInfo = null;
      console.log("OBJ file parsing error.");
      return;
    }
    this.g_objDoc = objDoc;
  }

  onReadComplete() {
    // Acquire the vertex coordinates and colors from OBJ file
    this.g_drawingInfo = this.g_objDoc.getDrawingInfo();
    
    // Write date into the buffer object
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.g_drawingInfo.vertices, this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Position);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexColorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.g_drawingInfo.colors, this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(this.a_Color, 4, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Color);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.g_drawingInfo.normals, this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(this.a_Normal, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Normal);

    // Write the indices to the buffer object
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.g_drawingInfo.indices, this.gl.STATIC_DRAW);
  }

  render(time) {
    this.gl.useProgram(this.program);
    this.gl.program = this.program;

    if (this.g_objDoc != null && this.g_objDoc.isMTLComplete()) {
      this.onReadComplete();
    }
    if (!this.g_drawingInfo) return;
    
    if (this.hasOwnProperty('moving')) {
      this.moving(time);
      this.g_modelMatrix = new Matrix4();
      for (var t of this.entity.transform) {
        this.g_modelMatrix[t.type].apply(this.g_modelMatrix, t.content);
      }
    }

    var mvpMatrix  = new Matrix4();
    mvpMatrix.multiply(Camera.getVpMatrix()).multiply(this.g_modelMatrix);
    this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, mvpMatrix.elements);
    this.gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.g_normalMatrix.elements);
    this.gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.g_modelMatrix.elements);

    var lightDirection = new Vector3(sceneDirectionLight).normalize();
    this.gl.uniform3fv(this.u_LightDirection, lightDirection.elements);
    this.gl.uniform3fv(this.u_AmbientLight, new Vector3(sceneAmbientLight).elements);

    if (Camera.state.flashLight) {
      this.gl.uniform3fv(this.u_PointLightColor, Camera.lightColor.elements);
      this.gl.uniform3fv(this.u_PointLightPosition, Camera.eye.elements);
    } else {
      this.gl.uniform3fv(this.u_PointLightColor, new Vector3([0,0,0]).elements);
      this.gl.uniform3fv(this.u_PointLightPosition, new Vector3([0,0,0]).elements);
    }

    // Draw
    this.gl.drawElements(this.gl.TRIANGLES, this.g_drawingInfo.indices.length, this.gl.UNSIGNED_SHORT, 0);  
  }
}