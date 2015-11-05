/* Render data sphere object */
function Sphere(id,x,y,z,r,col) {
  this.id = id;
  this.type = 'sphere';
  this.center = {'x': x, 'y': y, 'z': z};
  this.radius = r;
  this.colour = col; // may need to convert colour to vector format
}

/* Convert SVG colour to vector */
function rgbToVector(col) {
  var m = col.match(new RegExp('\\d+, \\d+, \\d+'));
  
  if (m[0]) {
    var vec = m[0].split(',');
    vec[0] = parseInt(vec[0]);
    vec[1] = parseInt(vec[1]);
    vec[2] = parseInt(vec[2]);
    return {'x':vec[0],'y':vec[1],'z':vec[2]};
  }
  
  // else return black
  return {'x':0,'y':0,'z':0};
}

var SCALE = 18.0;

/* Represents one view of a sphere */
function toSphere(element) {
  var id = parseInt(element.getAttribute('id').match(new RegExp('\\d+')));
  var delta = element.getAttributeNS(null, "transform").slice(7,-1).split(' ');
  var x = parseInt(element.getAttribute('cx')) + parseInt(delta[4]);
  var y = parseInt(element.getAttribute('cy')) + parseInt(delta[5]);
  var r = parseInt(element.getAttribute('r')); 
  var col = rgbToVector(element.style.fill); // TODO: parse this to vector
  
  return new Sphere(id,x/SCALE,y/SCALE,0,r/SCALE,col);
}

/* Pulls only the Z and ID information from the circle 
 *   Used in conjunction with toSphere() to get the 3 coordinates of a sphere
 */
function toZ(element) {
  var id = parseInt(element.getAttribute('id').match(new RegExp('\\d+')));
  var delta = element.getAttributeNS(null, "transform").slice(7,-1).split(' ');
  var y = parseInt(element.getAttribute('cy')) + parseInt(delta[5]);
  return {'id':id,'z': plane.point.z + y/SCALE}; // 
}

/* Background for image */
var plane = { 'type':'plane',
      'point': {'x':0,'y':0,'z':-10},
      'normal': {'x':0,'y':0,'z':1},
      'colour': {'x':255,'y':255,'z':255}
    };

/* Converts the user interface's SVG data into a render-able JSON object */
function svgToJson() {
  renderData.objects = [plane];
  var spheres = {};
  var spheres_front = document.getElementsByClassName('front_circle');
  var spheres_top = document.getElementsByClassName('top_circle');
  
  for (var i = 0; i < spheres_front.length; i++) {
    var front = toSphere(spheres_front[i]);
    spheres[front.id] = front;
  }
  for (var i = 0; i < spheres_top.length; i++) {
    var top = toZ(spheres_top[i]);
    spheres[top.id].center.z = top.z;
    renderData.objects.push(spheres[top.id]);
  }
  
  console.log('Rendering '+renderData.objects.length+' objects');
}

/* Starts render using SVG data from user interface */
function renderImange() {
  svgToJson();
  // console.log(JSON.stringify(renderData.objects,null,2));
  startCanvasRender();
}

function setSegSize() {
  var size = $('#seg_size').val();
  DIMENSIONS.div_x = size;
  DIMENSIONS.div_y = size;
}

/* Starts render using a given JSON object */
function renderJSON(json) {
  renderData = json;
  startCanvasRender();
}

/* sets the gamma correct value, then redraws image render */
function setGamma() {
  GAMMA_CORRECTION = 1.0/parseFloat($('#gammaSlider').val());
  // redraw current image using this value
  $('#gammaTitle').text(' Gamma '+$('#gammaSlider').val())
  console.log(GAMMA_CORRECTION+" "+$('#gammaSlider').val())
}

function resizeCircle() {
  var r = $('#circle_size').val();
  if (r === '') return;
  console.log(r)
  setRadius(r);
}

function colourCircle() {
  var col = $('#circle_colour').val();
  if (col === '') return;
  col = col.match(/^#(?:[0-9a-f]{3}){1,2}$/i);
  if (!col) return;
  colCircle(col[0]);
}

/* loads a json of the given size, and initiates it's render */
function loadAndRender() { 
  var currentNums = $('#rand_num').val();
  console.log('drawing random arrangement of '+currentNums+' spheres');
  var data = getRenderObjects(currentNums); // the countdown
  renderJSON(data);
}

/* returns the given number of objects in a scene json */
function getRenderObjects(num) {
  var data = jQuery.extend(true,{}, emptyObj);
  
  for (var i = 0; i < num; i++) {
    var o = {
      "id": i+1,
      "type": "sphere",
      "center": {
        "x": Math.random()*10,
        "y": Math.random()*10,
        "z": -7.222222222222222
      },
      "radius": 1.3888888888888888,
      "colour": {
        "x": 128,
        "y": 0,
        "z": 128
      }
    };
    
    data.objects.push(o);
  }
  
  return data;
}

var emptyObj = {
  "section": [],
  "scale": 50,
  "lightSource": {
    "x": -5,
    "y": 0,
    "z": 0
  },
  "cameraPos": {
    "x": 0,
    "y": 0,
    "z": 40
  },
  "objects": [
    {
      "type": "plane",
      "point": {
        "x": 0,
        "y": 0,
        "z": -10
      },
      "normal": {
        "x": 0,
        "y": 0,
        "z": 1
      },
      "colour": {
        "x": 255,
        "y": 255,
        "z": 255
      }
    },
  ]
}
