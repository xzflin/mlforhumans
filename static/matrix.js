var LABEL_FONT_SIZE = 13;
var MATRIX_LABEL_FONT_SIZE = 10;
var MATRIX_FONT_SIZE = 10;
var FONT_FAMILY = "Helvetica";
var MOUSEOVER = 'rgb(150, 150, 150)';
var FONT_COLOR = 'rgb(160, 160, 160)';
var FILL = 'rgb(255, 255, 255)';
var STROKE_SIZE = 1;
var BUTTON_Y = 10;
var BUTTON_SIZE = 15;
function Matrix(svg_object, height, classes, max_docs, databin) {
  var defaultMouseover = MOUSEOVER;
  var defaultRegular = FILL;
  this.numClasses = classes.names.length;
  //this.width = 350;
  this.strokeSize = STROKE_SIZE;
  this.tickSize = 10;
  this.width = (height - this.strokeSize * 2) / (1.2 + 2/(3 * this.numClasses));
  temp = svg_object.append("text").classed("matrix-text", true).text(max_docs)
  min_class_width = temp.node().getComputedTextLength() + 5;
  temp.classed("axis_label", true).classed("matrix-text", false).text("Actual label");
  this.axisLabelContainerSize = temp.node().getBBox().height
  this.labelContainerSize = this.tickSize;
  this.width = Math.max(min_class_width * this.numClasses, this.width);
  temp.remove();
  var size = this.width / this.numClasses;
  this.footerContainerSize = this.width / 5;
  this.cellSize = size;
  this.id = "matrix";
  this.classes = classes;
  //this.mouseoverColor = defaultMouseover;
  //this.cellColor = defaultRegular;
  this.svgContainerSize = (this.cellSize * this.numClasses) + this.strokeSize * 2 + this.labelContainerSize + this.axisLabelContainerSize;
  //console.log("Height: " + height + " new: " + (this.svgContainerSize + this.footerContainerSize));
  this.svg = svg_object
        .attr("class", "confusion_matrix")
        .attr("width", this.svgContainerSize)
        .attr("height", this.svgContainerSize + this.footerContainerSize)
        .attr("id", this.id)
        .attr("value", "modelname");

  this.labelNames = classes.names;
  this.cells = new Array();
  this.correspondingModel = "model";
  this.round2 = d3.format(".2f");
  this.bucketLists = [];
  appendAxisLabels(this);
  //  // append the positive, neutral, negative labels to the matrix
  appendLabels(this, classes.names);

  var x = 0;
  var y = 0;
  var matrixPointer = this;
  var count = 0;
  this.ids = [];
  mouseover = false;
  for (var i = 0; i < classes.names.length; i++) {
    var x = 0;
    var y = i * this.cellSize;
    for (var j = 0; j < classes.names.length; j++) {
      var id = this.id + '-' + classes.names[i] + '-' + classes.names[j];
      var z = [i, j];
      this.ids.push(id);
      var g = this.svg.append("g")
            .attr("id", id)
            .attr("width", size)
            .attr("height", size)
            //.attr("style", "stroke-width:" + this.strokeSize + "px")
            .attr("class", "matrix-bucket")
            .datum([i,j])
            .on("click", function(d) {
              databin.BrushOnMatrix(d[0], d[1]);
            })
            .style("fill", FILL);

      if (mouseover) {
        g.on("mouseover", function() {
            d3.select(this)
              .style('fill', defaultMouseover);
              //.style('stroke-width', this.strokeSize + "px");
          })
          .on("mouseout", function() {
            d3.select(this)
              .style('fill', defaultRegular);
              //.style('stroke-width', this.strokeSize + "px");
          })
      }

      var rect = g.append("rect")
            .attr("x", x + this.strokeSize + this.labelContainerSize + this.axisLabelContainerSize)
              .attr("y", y + this.strokeSize + this.labelContainerSize + this.axisLabelContainerSize)
              .attr("id", this.id + '-' + this.classes.names[i] + '-' + this.classes.names[j] + "-cell")
              .attr("class", "matrix-cell")
              .attr("width", size - this.strokeSize)
              .attr("height", size - this.strokeSize);              

      var textElement = g.append("text")
                .attr("id", this.id + '-' + classes.names[i] + '-' + classes.names[j] + "-text")
                .attr("class", "matrix-text")
                .attr("stroke-width", 0)
                .attr("font-family", FONT_FAMILY)
                .attr("font-size", MATRIX_FONT_SIZE + "pt");

      var pixelLength = textElement[0][0].getComputedTextLength();
      textElement.attr("y", this.cellSize / 2 + y)
          .attr("x", x + this.cellSize / 2 - pixelLength / 2)
          .style("fill", "rgb(97,97,97)");

      this.cells[count] = g;
      count++;
      x += this.cellSize;
    }
  }
  
}
function appendAxisLabels(matrix) {
  // predicted label
  var axisLabelSize = matrix.axisLabelContainerSize;
  var labelContainerSize = matrix.labelContainerSize;
  matrix.svg.append("text")
    .text("Predicted Label")
    .attr("x", function () {
      var pixelLength = this.getComputedTextLength()
      // +10 is for the yshift 10.
      return axisLabelSize + labelContainerSize + matrix.width / 2 - pixelLength / 2 + 10;
    })
    .attr("class", "axis_label")
    .attr("y", 10)
    .attr("id", matrix.id + '-' + 'horizontal-title')
    .style("fill", FONT_COLOR)
    .style("font-size", LABEL_FONT_SIZE);

  matrix.svg.append("text")
    .text("Actual Label")
    .attr("x", function() {
      var pixelLength = this.getComputedTextLength();
      return - axisLabelSize - labelContainerSize - matrix.width / 2 - pixelLength / 2 + 10;
    })
    .attr("y", 10)
    .attr("id", matrix.id + '-' + 'vertical-title')
        .attr("class", "axis_label")
    .style("fill", FONT_COLOR)
    .style("font-size", LABEL_FONT_SIZE)
    .attr("transform", "rotate(270)");
}

function appendLabels(matrix, labels) {
  // create labels
  var offset = 0;
  var size = matrix.cellSize;
  var axisLabelSize = matrix.axisLabelContainerSize;
  var labelContainerSize = matrix.labelContainerSize;
  var tickSize = matrix.tickSize;
  for (var i = 0; i < labels.length; i++) {
    matrix.svg.append("rect")
      .attr("x", function () {
        return labelContainerSize + axisLabelSize + (size / 2) + (size * i) - tickSize / 2; 
      })
      .attr("y", offset + axisLabelSize)
      .attr("width", tickSize)
      .attr("height", tickSize)
      .attr("id", matrix.id + '-' + labels[i] + '-predicted-label')
      .style("fill", this.classes.colors_i(i))

    // create labels
    matrix.svg.append("rect")
      .attr("transform", "rotate(270)") 
      .attr("x", function() {
        return -labelContainerSize - axisLabelSize - (size / 2) - (size * i) - tickSize / 2;
      })
      .attr("y", offset + axisLabelSize)
      .attr("id", matrix.id + '-' + labels[i] + "-actual-label")
      .attr("width", tickSize)
      .attr("height", tickSize)
      .style("fill", this.classes.colors_i(i));
  }

}
Matrix.prototype.getMatrixIds = function() {
  return this.ids;
}
Matrix.prototype.setTextForCell = function(text, id) {
  var newText = d3.select("#" + id + "-text").text(text);
  var cell = d3.select("#" + id + "-cell");

  var pixelHeight = newText.node().getBBox().height;
  var pixelLength = newText.node().getBBox().width;

  var currentX = parseInt(cell[0][0].attributes.x.value);
  var currentY = parseInt(cell[0][0].attributes.y.value);
  
  newText.attr("y", this.cellSize / 2  + currentY + pixelHeight / 4)
    .attr("x", currentX + this.cellSize / 2 - pixelLength / 2);
}

Matrix.prototype.setStrokeColor = function(r, g, b) {
  var rgb = "rgb(" + r + ", " + g + ", " + b + ")";

  var cells = this.cells;
  for (var i = 0; i < cells.length; i++) {
    cells[i].style("stroke", rgb);
  }
}

Matrix.prototype.setCellMouseoverColor = function(r, g, b, id) {
  var rgb = "rgb(" + r + ", " + g + ", " + b + ")";
  
  if (typeof(id) === 'undefined') {
    this.mouseoverColor = rgb;
    var cells = this.cells;
    for (var i = 0; i < cells.length; i++) {
      cells[i].on("mouseover", function() {
          d3.select(this)
            .style('fill', rgb)
      });
    }
  } else {
    d3.select("#" + id)
      .on("mouseover", function() {
          d3.select(this)
            .style('fill', rgb)
      });
  }
}

Matrix.prototype.setCellFillColor = function(color, id) {
  var rgb = color;
  
  if (typeof(id) === 'undefined') {
    this.cellColor = rgb;
    var cells = this.cells;
    for (var i = 0; i < cells.length; i++) {
      cells[i].style("fill", rgb)
      .on("mouseout", function() {
          d3.select(this)
            .style('fill', rgb)
      });
    }
  } else {
    if (d3.rgb(color).hsl().l < .58) {
                        //light text
      this.setFontColor(230, 230, 230, id);
    }
                else this.setFontColor(97,97,97,id);
    d3.select("#" + id)
      .style("fill",rgb)
      .on("mouseout", function() {
          d3.select(this)
            .style('fill', rgb)
      });
  }
}

Matrix.prototype.setContainerId = function(id) {
  d3.select(this)
    .attr("id", id);
}
Matrix.prototype.setFontFamily = function(family) {
  d3.selectAll("text").style("font-family", family);
}

Matrix.prototype.setFontColor = function(r, g, b, id) {
  var rgb = "rgb(" + r + ", " + g + ", " + b + ")";
  if (typeof(id) === 'undefined') {
    d3.selectAll("text").style("fill", rgb);
  } else {
    d3.select("#" + id + "-text")
      .style('fill', rgb);
  }
}

Matrix.prototype.setStrokeWidth = function(width) {
  this.strokeSize = width;
  this.svgContainerSize = (this.cellSize * 3) + this.strokeSize * 2;
  this.svg.attr("width", this.svgContainerSize)
      .attr("height", this.svgContainerSize);

  var x = 0;
  var y = 0;
  var strokeSize = this.strokeSize;
  for (var i = 0; i < this.cells.length; i++) {
    var cell = this.cells[i];
    cell.attr("style", "stroke-width:" + width + "px")
      .attr("x", x + strokeSize)
      .attr("y", y + strokeSize)
      .style("stroke-width", strokeSize + "px");

    x += this.cellSize;
      if ((i + 1) % 3 == 0) {
        x = 0;
        y += this.cellSize;
      }
  }
}

Matrix.prototype.setFootnote = function(text) {
  var containerSize, width;
  containerSize = this.labelContainerSize;
  width = this.width;
  d3.select("#" + this.id + '-footnote')
    .text(text)
                .attr("class", ".footnote")
    .attr("x", function() {
      var pixelLength = this.getComputedTextLength();
      return containerSize * 2 +  width / 2 - pixelLength / 2;
    });
}

Matrix.prototype.populateMatrix = function(data) {
    for (var i = 0; i < this.numClasses; i++) {
      var row = data[i]
      var rowsum = d3.sum(row);
      var colorGreen = d3.scale.linear().domain([0, rowsum]).range(["#E3FAEA", "#0B7A52"]);
      var colorRed = d3.scale.linear().domain([0, rowsum]).range(["#FAE3E3", "#7A0B0B"]);
      for (var j = 0; j < this.numClasses; j++) {
        var bucket = this.numClasses * i + j;
                      var color = (i == j) ? colorGreen : colorRed;
        this.setCellFillColor(color(row[j]), this.ids[bucket]); 
        this.setTextForCell(row[j], this.ids[bucket]); 
      }
    }
}


