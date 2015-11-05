/** Create the canvas for rendering
 *    Build PNG pixel array
 *    Create DOM element to hold it
 */
var getCanvas = function(wd,ht) {
    var p = new PNGlib(wd, ht, 256);      // constructor takes height, weight and colour-depth
    var background = p.color(40, 40, 40, 0); // set the background transparent
    $('#theimage').append('<img id="img_canvas" src="data:image/png;base64,'+p.getBase64()+'">');
    return p;
}

/* Perform gamma correction and impose maximum colour value of 255 */
GAMMA_CORRECTION = 1.0/3.2 // was 2.2
max = 255;
var processPixel = function(color) {
    if (color > max) {
      max = color;
      console.log(max);
    }
    if (color < 0) console.log(color);
    var col = Math.floor( Math.pow( color/255.0 , GAMMA_CORRECTION) * 255);
    // console.log(color+'->'+col);
    return col>255?255:col;
}

/* Processes new data, updating the image canvas */
var pixelss = []; // used for debugging
var drawPixels = function(canvas, pixels) {
    pixelss.push(JSON.stringify(pixels)+'\n');
    for (var i = 0; i < pixels.length; i++) {
        var pix = pixels[i]
        canvas.buffer[canvas.index(pix.x, pix.y)] = canvas.color(
            processPixel(pix.col[0]),
            processPixel(pix.col[1]), 
            processPixel(pix.col[2]));
    }
    $('#img_canvas').remove();
    $('#theimage').append('<img id="img_canvas" src="data:image/png;base64,'+canvas.getBase64()+'">');
}

var renderData = {
  'section':[], 
  'scale': 50.0,
  'lightSource': {'x':-5,'y':0,'z':0},
  'cameraPos': {'x':0,'y':0,'z':40},
  'objects': [
    { 'type':'sphere',
      'center': {'x':0,'y':0,'z':0},
      'radius': 5.0,
      'colour': {'x':0,'y':255,'z':0}
    },
    { 'type':'plane',
      'point': {'x':0,'y':0,'z':-100},
      'normal': {'x':0,'y':0,'z':1},
      'colour': {'x':255,'y':255,'z':255}
    }
  ],
}

/* Dimensions of the render's canvas */
DIMENSIONS = {
  width: 400,
  height: 400,
  div_x: 30,
  div_y: 30
}

/* Initialise the display */
$(document).ready(function() {
  init_panel();
  canvas = getCanvas(DIMENSIONS.width, DIMENSIONS.height);
});

/** Starts the rendering
 *    Divides canvas into sections
 *    Initiates sending the sections
 */
function startCanvasRender() {
  // canvas = getCanvas(width,height);
  // testFullCanvas(canvas, width, height);
  
  var s = getSections(DIMENSIONS.width, DIMENSIONS.height, DIMENSIONS.div_x, DIMENSIONS.div_y);
  
  /* remove some sections, used for testing */
  if (limitRenderSections) {
    var limit = Math.floor(s.length * 0.4);
    for (var i = 0; i < limit; i++) s.shift(); // from front
    for (var i = 0; i < limit; i++) s.pop();   // from back
  }
  
  sendingSections.sendSections(renderData,s);
}

/* Update the image with new data from the server */
var numDraws = 0;
function updateImage(data) {
  numDraws++;
  drawPixels(canvas, data);
}

/** Divides the image up into sections to be rendered
 *    Dimensions of the final image
 *    Max dimensions of the sections to be sent
 */
function getSections(wd,ht,size_x,size_y) {
  var sections = [];
  for (var i = 0; i<=wd-size_x; i+=size_x) {
    for (var j = 0; j<=ht-size_y; j+=size_y) {
      sections.push([i,j,size_x,size_y]);
    }
  }
  
  var extra_wd = (wd % size_x);
  var extra_ht = (ht % size_y);
  
  // any overhang/remaining image, draw that too:
  if (extra_wd) {
    var done = Math.floor(wd / size_x) * size_x;
    for (var j = 0; j<=ht-size_y; j += size_y) {
      sections.push([done,j,extra_wd,size_y]);
    }
  }
  if (extra_ht) {
    var done = Math.floor(ht / size_y) * size_y;
    for (var i = 0; i<=wd-size_x; i += size_x) {
      sections.push([i,done,size_x,extra_ht]);
    }
  }
  if (extra_ht && extra_wd) {
    var done_x = Math.floor(wd / size_x) * size_x;
    var done_y = Math.floor(ht / size_y) * size_y;
    sections.push([done_x,done_y,extra_wd,extra_ht]);
  }
  
  shuffle(sections);
  return sections;
}

/** Shuffle the elements of an array
 *    http://stackoverflow.com/a/6274398
 *    Fisher-Yates shuffle apparently
 */
function shuffle(array) {
    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

/** Controls sending of the parallel sections of the image
 *    Initial number to send
 *    Sending the initial load
 *    Sending another section when one is received
 */
var sendingSections = {
  maxAtOnce: 20,
  currentNum: 0,
  missed: [],
  sections: [],
  data: '',
  sendSections: function(data, sections) {
    // measure_latency.event_occured(this.maxAtOnce, 'numAtOnce');
    // measure_latency.event_occured(sections.length, 'numSegments');
    // measure_latency.event_occured(0, 'render_start');
    this.numErrors = 0;
    this.data = jQuery.extend(true,{}, data);
    this.sections = sections;
    
    // send the first batch of sections
    while (this.currentNum<this.maxAtOnce && this.sections.length > 0) {
      send(this.data, this.sections.shift());
      this.currentNum++;
    }
  },
  responseReceived: function() {
    if (this.sections.length>0) { // get next section, if it exists
      send(this.data, this.sections.shift());
    }
    else if (this.missed.length>0) { // redo any error/timeout segments
      send(this.data, this.missed.shift());
    }
    else { // drop window
      this.currentNum--;
    }
    if (this.currentNum == 0) { // all sent, so clean up
      // measure_latency.event_occured(0, 'render_end');
      // measure_latency.event_occured(this.numErrors, 'error_count');
      // start_next_render();
      console.log('complete');
    }
  },
  addSectionMissed: function(section) {
    this.numErrors++;
    this.missed.push(section);
  }
}
  
var sendCount = 1;
/** AJAX request for sending a section to be processed
 *    Configures CORS to allow this to be done
 *    Address of Lambda functions is hard-coded here
 *    Upon reply, updates the image displayed -- updateImage()
 */
function send(data, section) {
    var id = sendCount++;
    var path = 'https://a98j1w4jae.execute-api.us-west-2.amazonaws.com/prod/q40iln';
    var toSend = {
      'section':     section,
      'lightSource': data.lightSource,
      'cameraPos':   data.cameraPos,
      'objects':     data.objects,
    }
    // measure_latency.event_occured(id, 'seg_start');
    $.ajax({
        type: 'POST',
        url: path,
        data: JSON.stringify(toSend),
        success: function(res) {
            if (!res.error) {
              // measure_latency.event_occured(id, 'seg_end');
              console.log('POST success');
              updateImage(res);
            }
            else {
              // measure_latency.event_occured(data.id, 'seg_end');
              console.log('POST error');
            }
        },
        error: function() {
          sendingSections.addSectionMissed(section);
        },
        complete: function() {
          sendingSections.responseReceived();
        },
        dataType: 'json', 
        timeout: 120000,
        contentType: 'application/json; charset=UTF-8',
        crossDomain: true,  // Needed for CORS
    });
}


/* Below are functions used for testing */
 
/* Saves the pixels received in a text file */
function savePixelsReceived(filename) {
  var blob = new Blob(pixelss, {type: "text/plain;charset=utf-8"});
  saveAs(blob, filename)
}

/* Saves the current render data as a JSON file */
function saveScene() {
  var out = JSON.stringify(renderData,null,2);
  var blob = new Blob([out], {type: "text/plain;charset=utf-8"});
  saveAs(blob, 'scene.json')
}

/* Initiates a test of drawing squares to full the canvas */
var offlineLoop = '';
var testFullCanvas = function(canvas, wd, ht) {
  var i = 0; 
  offlineLoop = setInterval(function(s) {
    if (i>=wd) {
      console.log('clearing interval '+i);
      clearInterval(offlineLoop);
      return;
    }
    for (var j = 0; j < ht; j+=10) {
      var col = [Math.floor(255*j/ht),100,200];
      drawSquare(canvas, i,j,i+10,j+10,col);
    }
    
    i+=10;
  }, 250);
}

/* Used by canvas draw test to fill a segment of the canvas */
function drawSquare(canvas,beg_x,beg_y,end_x,end_y,col) {
  for (var i = beg_x; i<end_x; i++) {
    for (var j = beg_y; j<end_y; j++) {
      canvas.buffer[canvas.index(i, j)] = canvas.color(col[0], col[1], col[2]);
    }
  }
  $('#img_canvas').remove();
  $('#theimage').append('<img id="img_canvas" src="data:image/png;base64,'+canvas.getBase64()+'">');
  console.log('drew square '+beg_x+' '+beg_y+' '+end_x+' '+end_y);
}

/* A populated rendering data object */
var testImage = {
  'section':[],
  'lightSource': {'x':-10,'y':0,'z':0},
  'cameraPos': {'x':0,'y':0,'z':40},
  'objects': [
    { 'type':'sphere',
      'center': {'x':-2,'y':0,'z':-10},
      'radius': 2.0,
      'colour': {'x':0,'y':255,'z':0}
    },
    { 'type':'sphere',
      'center': {'x':2,'y':4,'z':-10},
      'radius': 2.0,
      'colour': {'x':150,'y':255,'z':150}
    },
    { 'type':'sphere',
      'center': {'x':0,'y':0,'z':0},
      'radius': 1.0,
      'colour': {'x':150,'y':150,'z':150}
    },
    { 'type':'sphere',
      'center': {'x':2,'y':0,'z':-10},
      'radius': 2.5,
      'colour': {'x':255,'y':0,'z':0}
    },
    { 'type':'sphere',
      'center': {'x':0,'y':-4,'z':-10},
      'radius': 3.0,
      'colour': {'x':0,'y':0,'z':255}
    },
    { 'type':'plane',
      'point': {'x':0,'y':0,'z':-12},
      'normal': {'x':0,'y':0,'z':1},
      'colour': {'x':255,'y':255,'z':255}
    }
  ],
}

limitRenderSections = false;