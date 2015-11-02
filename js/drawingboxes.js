var draw_panel = {
  top: '',
  front: '',
}

/* initialises the drawing panel) */
function init_panel() {
  draw_panel.top = d3.select("#top_view")
      .append("svg")
        .attr('id', 'svg_top')
        .attr("width", 200)
        .attr("height", 200);
        
  draw_panel.top.append("circle")
        .attr('class', 'draggable top_circle')
        .attr('id', 'sphere_top_1')
        .attr('onmousedown',"selectElement(evt)")
        .attr('transform',"matrix(1 0 0 1 0 0)")
        .attr("cx", 50)
        .attr("cy", 50)
        .attr("r", 25)
        .style("fill", "#800080");
        
  draw_panel.front = d3.select("#front_view")
      .append("svg")
        .attr('id', 'svg_front')
        .attr("width", 200)
        .attr("height", 200);
        
  draw_panel.front.append("circle")
        .attr('class', 'draggable front_circle')
        .attr('id', 'sphere_front_1')
        .attr('onmousedown',"selectElement(evt)")
        .attr('transform',"matrix(1 0 0 1 0 0)")
        .attr("cx", 50)
        .attr("cy", 50)
        .attr("r", 25)
        .style("fill", "#800080");
}

/* Adds a sphere to the drawing panel */
var circleCount = 1; // id number of the last circle created (not really a 'count')
function addCircle() {
  circleCount++;
  draw_panel.top.append("circle")
        .attr('class', 'draggable top_circle')
        .attr('id', 'sphere_top_'+circleCount)
        .attr('onmousedown',"selectElement(evt)")
        .attr('transform',"matrix(1 0 0 1 0 0)")
        .attr("cx", 100)
        .attr("cy", 100)
        .attr("r", 25)
        .style("fill", "#800080");
  draw_panel.front.append("circle")
        .attr('class', 'draggable front_circle')
        .attr('id', 'sphere_front_'+circleCount)
        .attr('onmousedown',"selectElement(evt)")
        .attr('transform',"matrix(1 0 0 1 0 0)")
        .attr("cx", 100)
        .attr("cy", 100)
        .attr("r", 25)
        .style("fill", "#800080");
}

/* Removes the last selected circle from the drawing area */
function remCircle() {
  if(selectedElement != 0){
    selectedElement.remove();
    selectedPartner.remove();
    
    selectedElement = 0;
    selectedPartner = 0;
  }
}

/* Sets the colour of the last selected sphere */
function colCircle(col) {
  if(selectedElement != 0){
    selectedElement.style.fill = col;
    selectedPartner.style.fill = col;
  }
}

/* Sets the radius of the last selected sphere */
function setRadius(radius) {
  if(selectedElement != 0){
    selectedElement.setAttribute('r',radius);
    selectedPartner.setAttribute('r',radius);
  }
}

var selectedElement = 0;
var selectedPartner = 0;
var currentX = 0;
var currentY = 0;
var currentMatrix = 0;
var partnerMatrix = 0;

/* Selects the given ID's corresponding circle */
function getPartner(selectedId) {
  var sel_id = selectedElement.getAttribute('id');
  var partner_id = '';
  var id_num = sel_id.match(new RegExp('\\d+'));
  
  if (sel_id.match('top')) {
    partner_id = 'sphere_front_'+id_num;
  }
  else if (sel_id.match('front')) {
    partner_id = 'sphere_top_'+id_num;
  }
  return document.getElementById(partner_id)
}

function selectElement(evt) {
  // select clicked and partner circles
  selectedElement = evt.target;
  selectedPartner = getPartner(selectedElement);
  
  currentX = evt.clientX;
  currentY = evt.clientY;
  currentMatrix = selectedElement.getAttributeNS(null, "transform").slice(7,-1).split(' ');
  partnerMatrix = selectedPartner.getAttributeNS(null, "transform").slice(7,-1).split(' ');
   
  for(var i=0; i<currentMatrix.length; i++) {
    currentMatrix[i] = parseFloat(currentMatrix[i]);
    partnerMatrix[i] = parseFloat(partnerMatrix[i]);
  }

  selectedElement.setAttributeNS(null, "onmousemove", "moveElement(evt)");
  selectedElement.setAttributeNS(null, "onmouseout", "deselectElement(evt)");
  selectedElement.setAttributeNS(null, "onmouseup", "deselectElement(evt)");
}

function moveElement(evt){
  dx = evt.clientX - currentX;
  dy = evt.clientY - currentY;
  currentMatrix[4] += dx;
  currentMatrix[5] += dy;
  partnerMatrix[4] += dx;
  newMatrix = "matrix(" + currentMatrix.join(' ') + ")";
  newPartMatrix = "matrix(" + partnerMatrix.join(' ') + ")";
            
  selectedElement.setAttributeNS(null, "transform", newMatrix);
  selectedPartner.setAttributeNS(null, "transform", newPartMatrix);
  currentX = evt.clientX;
  currentY = evt.clientY;
  
  
  // console.log(currentX+" "+currentY);
}

function deselectElement(evt){
  if(selectedElement != 0){
    selectedElement.removeAttributeNS(null, "onmousemove");
    selectedElement.removeAttributeNS(null, "onmouseout");
    selectedElement.removeAttributeNS(null, "onmouseup");
    // selectedElement = 0;
  }
}

