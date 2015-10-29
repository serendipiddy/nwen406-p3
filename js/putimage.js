var getCanvas = function(wd,ht) {
    var p = new PNGlib(wd, ht, 256);      // constructor takes height, weight and colour-depth
    var background = p.color(40, 40, 40, 0); // set the background transparent
    // initCanvas(p, wd, ht); // set pixels so can display
    
    // var svg = d3.select("#theimage")
      // .append("svg")
      // .attr("width",wd)
      // .attr("height",ht);
    // var image = svg.selectAll("image");
    // image.append("svg:image")
      // .attr("width",wd)
      // .attr("height",ht)
      // .attr("xlink/href",'<img id="img_canvas" src="data:image/png;base64,'+p.getBase64()+'">');
    $('#theimage').append('<img id="img_canvas" src="data:image/png;base64,'+p.getBase64()+'">');
    return p;
}

var pixelss = []
var drawPixels = function(canvas, pixels) {
    pixelss.push(JSON.stringify(pixels)+'\n');
    for (var i = 0; i < pixels.length; i++) {
        var pix = pixels[i]
        canvas.buffer[canvas.index(pix.x, pix.y)] = canvas.color(
            pix.col[0]>255?255:pix.col[0],
            pix.col[1]>255?255:pix.col[1], 
            pix.col[2]>255?255:pix.col[2]);
    }
    $('#img_canvas').remove();
    $('#theimage').append('<img id="img_canvas" src="data:image/png;base64,'+canvas.getBase64()+'">');
}

function savePixelsReceived(filename) {
  var blob = new Blob(pixelss, {type: "text/plain;charset=utf-8"});
  saveAs(blob, filename)
}

var offlineLoop = '';
var testFullImage = function(canvas, wd, ht) {
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

$(document).ready(function() {
  // var width = 400;
  // var height = 400;
  // var div = 30;
  // canvas = getCanvas(width,height);
  
  // // testFullImage(canvas, width, height);
  
  // var s = getSections(width,height,div,div);
  // for (var i = 0; i< 100; i++) s.shift(); // skipping ahead for now
  // sendingSections.sendSections(testImage,s);
});

function startCanvasRender() {
  var width = 400;
  var height = 400;
  var div = 30;
  canvas = getCanvas(width,height);
  
  // testFullImage(canvas, width, height);
  
  var s = getSections(width,height,div,div);
  // for (var i = 0; i< 100; i++) s.shift(); // skipping ahead for now
  sendingSections.sendSections(testImage,s);
}

var numDraws = 0;
function updateImage(data) {
  numDraws++;
  drawPixels(canvas, data);
}

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
  
  return sections;
}

var sendingSections = {
  maxAtOnce: 10,
  currentNum: 0,
  missed: [],
  sections: [],
  sendSections: function(data, sections) {
    this.sections = sections;
    while (this.currentNum<this.maxAtOnce) {
      data.section = this.sections.shift();
      send(data);
      this.currentNum++;
    }
  },
  responseReceived: function() {
    if (this.sections.length>0) {
      // var idx = Math.floor(Math.random() * this.sections.length);
      // var data = testImage;
      testImage.section = this.sections.shift();
      send(testImage);
    }
    else {
      this.currentNum--;
    }
  },
  addSectionMissed: function(section) {
    this.missed.push(section);
  }
}
  
function send(data) {
    var path = 'https://a98j1w4jae.execute-api.us-west-2.amazonaws.com/prod/q40iln';
    // console.log(JSON.stringify(data));
    $.ajax({
        type: 'POST',
        url: path,
        data: JSON.stringify(data),
        success: function(res) {
            if (!res.error) {
              console.log('POST success');
              // console.log(JSON.stringify(res));
              // var c = getCanvas(9,9);
              // drawPixels(c, res);
              updateImage(res);
            }
            else {
              console.log('POST error');
            }
        },
        error: function() {
          addSectionMissed(section);
        },
        complete: function() {
          sendingSections.responseReceived();
        },
        dataType: 'json', 
        timeout: 120000,
        contentType: 'application/json; charset=UTF-8',
        crossDomain: true,
    });
}