/* line structure */
function Line(p1, p2) {
  if (p1[0] == p2[0]) {
    // vertical line segment
    this.k = undefined;
    this.b = p1[0];
    this.max = Math.max(p1[1], p2[1]);  // max y
    this.min = Math.min(p1[1], p2[1]);  // min y
  } else {
    this.k = (p1[1] - p2[1]) / (p1[0] - p2[0]);
    this.b = p1[1] - this.k * p1[0];
    this.max = Math.max(p1[0], p2[0]);  // max x
    this.min = Math.min(p1[0], p2[0]);  // min x
  }
}

function LastCounter() {
  //  record intersections of last scanning
  this.n = 0;
}

/* Tool functions */
function findRange(points) {
  var top = canvasSize.maxY;  // the top of the canvas
  var bottom = 0;             // the bottom of the canvas
  for(var point of points) {
    top = Math.min(point[1], top);
    bottom = Math.max(point[1], bottom);
  }
  return [top, bottom];
}

function getLines(points) {
  var lines = [];
  for (var i = 0; i < points.length; ++i) {
    lines.push(new Line(points[i], points[(i + 1 + points.length) % points.length]));
  }
  return lines;
}

function getIntersections(row, points, edges, lastCount) {
  var lines = edges.slice(0);
  var intersections = [];
  var waitList = [];  // vertices that on the scanning line
  for (var i = 0; i < points.length; ++i) {
    if (row == points[i][1]) {
      if (row == points[(i + 1 + points.length) % points.length][1]) {
        intersections.push(points[i][0]);
      }
      intersections.push(points[i][0]);
      waitList.push(points[i][0]);
      lines[i] = undefined;
      lines[(i + VERTICES - 1) % VERTICES] = undefined;
    }
  }

  for (var i = 0; i < lines.length; ++i) {
    if (lines[i] == undefined) continue;

    var line = lines[i];
    if (typeof(line.k)  == "undefined" ) {
      // if intersect with vertical line segment
      if (row >= line.min && row <= line.max){
        intersections.push(line.b);
      }
      continue;
    }

    if (line.k == 0) {
      // ignore horizontal line
      continue;
    }

    // calculate the x-coordinate of intersection
    var x = (row - line.b) / line.k;
    if (x >= line.min && x <= line.max) {
      intersections.push(x);
    }
  }
  
  // if the two edges locate on different sides of the scanning line, add the vertex into list
  if (waitList.length && intersections.length != lastCount.n) {
    for (var x of waitList) {
      intersections.push(x);
    }
  }

  // record the amount of intersections
  lastCount.n = intersections.length;
  // sort the intersectinos
  intersections.sort((a, b) => {return a - b});
  return intersections;
}

function getQuadDistance(p1, p2) {
  return (p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]);
}

function findPolygon(vertex) {
  for (var i = 0; i < polygon.length; ++i) {
    for (var idx of polygon[i]) {
      if (vertex == idx) {
        return i;
      }
    }
  }
  return null;
}

function idxToPoints(indices) {
  var points = [];
  for (var i of indices) {
    points.push(vertex_pos[i]);
  }
  return points;
}

/* Draw functions */
function drawPolygon(cxt, points, color) {
  // fill the given polygon with given color
  var lines = getLines(points);
  var range = findRange(points);
  var lastCounter = new LastCounter();
  for (var row = range[0]; row <= range[1]; ++row) {
    // draw polygon
    var intersactions = getIntersections(row, points, lines, lastCounter);
    for (var i = 0; i < intersactions.length - 1; i += 2) {
      // draw lines between each pair of intersection points
      drawLine(cxt, intersactions[i], row, intersactions[i + 1], row, color);
    }
  }
}

function drawHandle(centralPoint) {
  // check every pixel, if in any handle, fill it red, else if on any outline, fill it black
  for (var row = centralPoint[1] - HANDLEFIELDHALFEDGE; row < centralPoint[1] + HANDLEFIELDHALFEDGE; ++row) {
    for (var col = centralPoint[0] - HANDLEFIELDHALFEDGE; col < centralPoint[0] + HANDLEFIELDHALFEDGE; ++col) {
      var dist = getQuadDistance([col, row], centralPoint);
      if (dist < RADIUSQUAD){
        drawPoint(cxt, col, row, HANDLEFILLCOLOR);
      } else if (dist < RADIUSQUAD + OUTLINEOFFSET){
        drawPoint(cxt, col, row, HANDLEOUTLINECOLOR);
      }
    }
  }
}

/* initialization */
function init() {
  // clear the canvas
  cxt.clearRect(0, 0, canvasSize.maxX, canvasSize.maxY);  
  // draw polygons
  for (var i = 0; i < polygon.length; ++i) {
    var vertices = [];
    for (var idx of polygon[i]) {
        vertices.push(vertex_pos[idx]);
    }
    var color = vertex_color[polygon[i][0]];
    drawPolygon(cxt, vertices, color);
  }
  // draw handles
  for (var point of vertex_pos) {
    drawHandle(point);
  }
}

function update(handleVtx) {
  // clear the canvas
  cxt.clearRect(0, 0, canvasSize.maxX, canvasSize.maxY); 
  var lastPolyIdx = findPolygon(handleVtx);
  if (lastPolyIdx == null) {
    init();
    return;
  } else {
    for (var i = 0; i < polygon.length; ++i) {
      if (idx == lastPolyIdx) {
        continue;
      }
      var vertices = [];
      for (var idx of polygon[i]) {
          vertices.push(vertex_pos[idx]);
      }
      var color = vertex_color[polygon[i][0]];
      drawPolygon(cxt, vertices, color);
    }
    var color = vertex_color[polygon[lastPolyIdx][0]];
    drawPolygon(cxt, idxToPoints(polygon[lastPolyIdx]), color);
    for (var point of vertex_pos) {
      drawHandle(point);
    }
  }
}