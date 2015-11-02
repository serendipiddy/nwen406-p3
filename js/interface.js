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

/* represents one view of a sphere */
function toSphere(element) {
  var id = parseInt(element.getAttribute('id').match(new RegExp('\\d+')));
  var delta = element.getAttributeNS(null, "transform").slice(7,-1).split(' ');
  var x = parseInt(element.getAttribute('cx')) + parseInt(delta[4]);
  var y = parseInt(element.getAttribute('cy')) + parseInt(delta[5]);
  var r = parseInt(element.getAttribute('r')); 
  var col = rgbToVector(element.style.fill); // TODO: parse this to vector
  
  return new Sphere(id,x,y,0,r,col);
}

function toZ(element) {
  var id = parseInt(element.getAttribute('id').match(new RegExp('\\d+')));
  var delta = element.getAttributeNS(null, "transform").slice(7,-1).split(' ');
  var y = parseInt(element.getAttribute('cy')) + parseInt(delta[5]);
  return {'id':id,'z':y};
}

/* background for image */
var plane = { 'type':'plane',
      'point': {'x':0,'y':0,'z':-12},
      'normal': {'x':0,'y':0,'z':1},
      'colour': {'x':255,'y':255,'z':255}
    };

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
  
  console.log(renderData.objects.length);
}


/* sets the gamma correct value, then redraws image render */
function setGamma() {
  GAMMA_CORRECTION = 1/$('#gammaSlider').val();
  // redraw current image using this value
  $('#gammaTitle').text(' Gamma '+GAMMA_CORRECTION.toFixed(2))
  console.log(GAMMA_CORRECTION);
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
