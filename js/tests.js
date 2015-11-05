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

function OutputObj() {
  this.data = [];
  this.header = [];
  this.reset = function() {
    this.data = [];
    this.header = [];
  };
  this.set_header = function(header) {
    this.header = header;
  };
  this.add_row = function(row) {
    if (row.length != this.header.length) {
      console.log('row length ('+row.length+') does not match header length('+this.header.length+')');
      return;
    }
    this.data.push(row);
  };
  this.save_file_table = function(filename) {
    var out = [];
    out.push(this.header.join(' ') + '\n');
    for (var i = 0; i<this.data.length; i++) {
      out.push(this.data[i].join(' ')+'\n');
    }
    var blob = new Blob(out,{type: "text/plain;charset=utf-8"});
    saveAs(blob, filename);
  };
}

var measure_latency = {
  start_time: 0,
  segment_start: {},
  latency_testing: false,
  set: function() {
    this.segment_start = {};
    this.own_data = new OutputObj();
    this.own_data.reset();
    var header = ['time','id'];
    this.own_data.set_header(header);
    this.start_time = (window.performance.now()*1000).toFixed(0);
    this.event_occured('-1','test_init');
    this.latency_testing = true;
  },
  event_occured: function(id, name, aux) { 
    if (!this.latency_testing) return; // turning this off for now
    var time = (window.performance.now()*1000).toFixed(0) - this.start_time; // timeStamp
    if (name === 'seg_start') {
      this.segment_start[id] = time;
      this.own_data.add_row([time, 'start_'+id]);
    }
    else if (name === 'seg_end') this.own_data.add_row([time-this.segment_start[id], id]);
    else if (name == 'render_start') this.segment_start['render'] = time;
    else if (name == 'render_end')   this.own_data.add_row([time-this.segment_start['render'], 'render']);
    else if (name == 'error_count') this.own_data.add_row([id,'error_count']);
    else if (name == 'numAtOnce') this.own_data.add_row([id,'numAtOnce']);
    else if (name == 'numAtOnce') this.own_data.add_row([id,'numSegments']);
  },
  save: function(filename) {
    this.own_data.save_file_table(filename);
  }
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

var objnums = [];
var maxIterNum = 1;
/* Starts the latency testing */
$(document).ready(function() {
  var numObj = [10];

  for (var i = 0; i < maxIterNum; i++) {
    for (var j = 0; j < numObj.length; j++) {
      objnums.push(numObj[j]);
    }
  }
  
  measure_latency.set();
  load_and_render();
});

var runNum = 0;
var currentNums = 0;
/* House keeping and performs next render */
function start_next_render() { 
  measure_latency.save('render_'+runNum+'_'+currentNums+'.txt');
  measure_latency.set();
  load_and_render();
  runNum++;
}

/* loads a json of the given size, and initiates it's render */
function load_and_render() { 
  currentNums = objnums[0];
  
  console.log(currentNums+' '+objnums.length);
  
  if (objnums.length > 0) {
    console.log('starting run '+runNum);
    var data = getRenderObjects(objnums.shift()); // the countdown
    renderJSON(data);
  }
}
