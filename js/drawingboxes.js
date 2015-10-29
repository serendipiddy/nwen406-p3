var draw_panel = {
  top: '',
  front: '',
}

function init_panel() {
  draw_panel.top = d3.select("#top_view")
      .append("svg")
        .attr('id', 'svg_top')
        .attr("width", 200)
        .attr("height", 200)
      .append("circle")
        .attr('class', 'draggable')
        .attr('onmousedown',"selectElement(evt)")
        .attr('transform',"matrix(1 0 0 1 0 0)")
        .attr("cx", 25)
        .attr("cy", 25)
        .attr("r", 25)
        .style("fill", "purple");
  draw_panel.front = d3.select("#front_view")
      .append("svg")
        .attr('id', 'svg_front')
        .attr("width", 200)
        .attr("height", 200)
      .append("circle")
        .attr('class', 'draggable')
        .attr('onmousedown',"selectElement(evt)")
        .attr('transform',"matrix(1 0 0 1 0 0)")
        .attr("cx", 50)
        .attr("cy", 50)
        .attr("r", 25)
        .style("fill", "purple");
}

var selectedElement = 0;
var currentX = 0;
var currentY = 0;
var currentMatrix = 0;

function selectElement(evt) {
  selectedElement = evt.target;
  currentX = evt.clientX;
  currentY = evt.clientY;
  currentMatrix = selectedElement.getAttributeNS(null, "transform").slice(7,-1).split(' ');
   
    for(var i=0; i<currentMatrix.length; i++) {
      currentMatrix[i] = parseFloat(currentMatrix[i]);
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
  newMatrix = "matrix(" + currentMatrix.join(' ') + ")";
            
  selectedElement.setAttributeNS(null, "transform", newMatrix);
  currentX = evt.clientX;
  currentY = evt.clientY;
  
  console.log(currentX+" "+currentY);
}

function deselectElement(evt){
  if(selectedElement != 0){
    selectedElement.removeAttributeNS(null, "onmousemove");
    selectedElement.removeAttributeNS(null, "onmouseout");
    selectedElement.removeAttributeNS(null, "onmouseup");
    selectedElement = 0;
  }
}

