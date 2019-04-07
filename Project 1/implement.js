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
  for (var i = 0; i < points.length - 1; ++i) {
    lines.push(new Line(points[i], points[i + 1]));
  }
  // polygon is closed
  lines.push(new Line(points[points.length - 1], points[0]));
  return lines;
}

function getIntersections(row, points, lines, lastCount) {
  var intersections = [];
  var waitList = [];  // vertices that on the scanning line
  for (var point of points) {
    if (row == point[1]) {
      waitList.push(point[0]);
    }
  }

  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i];
    if ('undefined' == typeof(line.k)) {
      // if intersect with vertical line segment
      if (row > line.min && row < line.max){
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
    if (x > line.min && x < line.max) {
      intersections.push(x);
    }
  }
  
  // if the two edges locate on different sides of the scanning line, add the vertex into list
  if (waitList.length && (intersections.length + waitList.length) == lastCount.n) {
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

/* Draw functions */
function drawQuadrilateral(cxt, points, color) {
  // fill the given quadrilateral with given color
  var lines = getLines(points);
  var range = findRange(points);
  var lastCounter = new LastCounter();
  for (var row = range[0]; row <= range[1]; ++row) {
    // draw quadrilaterals
    var intersactions = getIntersections(row, points, lines, lastCounter);
    for (var i = 0; i < intersactions.length - 1; i += 2) {
      // draw lines between each pair of intersection points
      drawLine(cxt, intersactions[i], row, intersactions[i + 1], row, color);
    }

    
  }
}

function drawHandles() {
  for (var row = 0; row <= canvasSize.maxY; ++row) {
    for (var col = 0; col <= canvasSize.maxX; ++col) {
      for (var point of vertex_pos) {
        var dist = getQuadDistance([col, row], point);
        if (dist < RADIUSQUAD){
          drawPoint(cxt, col, row, HANDLEFILLCOLOR);
        } else if (dist < RADIUSQUAD + OUTLINEOFFSET){
          drawPoint(cxt, col, row, HANDLEOUTLINECOLOR);
        }
      }
    }
  }
}

/* initialization */
function init() {
  cxt.clearRect(0, 0, canvasSize['maxX'], canvasSize['maxY']);  
  for (var i = 0; i < polygon.length; ++i) {
    var vertices = [];
    for (var idx of polygon[i]) {
        vertices.push(vertex_pos[idx]);
    }
    var color = vertex_color[polygon[i][0]];
    drawQuadrilateral(cxt, vertices, color);
  }
  drawHandles();
}