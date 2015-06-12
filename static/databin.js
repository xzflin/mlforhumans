var Databin = function (id, height, classes) {
  // Constants
  this.square_size = 6;
  this.initial_square_size = 6;
  this.real_square_size = this.square_size + 1;
  var margin = {top: 0, right: 10, bottom: 20, left: 10};
  // Other stuff
  this.current_order = 0;
  this.current_matrix_brush = [-1, -1];
  this.classes = classes
  this.selected_document = 0;
  this.bin_width_sort_by_class = 0;
  this.bin_width_per_nbins = Object();
  this.max_top_per_nbins = Object();
  this.max_bottom_per_nbins = Object();
  var this_object = this;
  var div_width = parseInt(d3.select(id).style("width"));
  this.width = div_width - margin.left - margin.right;
  this.height = div_height - margin.top - margin.bottom;
  this.x_scale = d3.scale.linear().range([0, this.width]);
  this.svg = d3.select(id).append("svg")
               .attr("width", div_width)
               .attr("height", div_height)
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  this.tooltip = d3.select("body").append("div")
      .attr("class", "hist_tooltip")
      .style("opacity", 0);
  // Draw x-axis label
  this.svg.append("text")
      .text("P(" + this.classes.names[1] + " | example), given by the model")
      .attr("x", function (d) {return this_object.width / 2 - this.getComputedTextLength() / 2;})
      .attr("y", height -25)
      .attr("id", "hist_xaxis")
      .style("font-size", "14px")
      .style("font-weight", "bold")
  this.svg.append("text")
      .text("Examples above the horizontal axis are classified correctly.")
      .attr("x", function (d) {return this_object.width / 2 - this.getComputedTextLength() / 2;})
      .attr("y", height-10)
      .style("font-size", "14px")
      .style("font-weight", "bold")
  this.svg.append("text")
      .text("0.5")
      .attr("id", "databin-mid")
      .attr("x", function (d) {return this_object.width / 2 - this.getComputedTextLength() / 2;})
      .attr("y", height-40)
      .style("font-size", "14px")
      .style("opacity", 0.8)
}
Databin.prototype.NewDataset = function(train_docs, test_docs, train_statistics, test_statistics) {
  this.train_docs = train_docs;
  this.test_docs = test_docs;
  this.train_statistics = train_statistics;
  this.test_statistics = test_statistics;
  this.SetDocIds();
  this.ComputeMaxPerBin();
  this.AssignDots(this.test_docs);
  this.ShowForClass(this.current_order);
}
Databin.prototype.ComputeMaxPerBin = function() {
   max_neg_bin = Math.ceil(Math.max((1 - this.train_statistics.accuracy) * this.train_docs.length, (1 - this.test_statistics.accuracy) * this.test_docs.length));
   var squares_in_height = Math.floor(this.height / this.real_square_size);
   var space_between_bins = 2;
   var bin_square_width = Math.min(Math.floor((this.width / this.classes.names.length) / this.real_square_size) - space_between_bins, 40);
   this.bin_width_sort_by_class = bin_square_width;
   var rows_below = Math.max(7, Math.ceil(max_neg_bin / bin_square_width))
   this.y_divisor = this.height - rows_below * this.real_square_size;
   space_below = rows_below * this.real_square_size;
   space_above = this.height - space_below - 1;
   for (var i = 1; i <= 12; i++) {
     this.bin_width_per_nbins[i] = Math.floor((this.width / i) / this.real_square_size) - space_between_bins
     this.max_bottom_per_nbins[i] = (space_below / this.real_square_size) * this.bin_width_per_nbins[i];
     this.max_top_per_nbins[i] = (space_above / this.real_square_size - 1) * this.bin_width_per_nbins[i];
   }
   this.max_top_with_40 = (space_above / this.real_square_size) * 40;
   this.max_bottom_with_40 = (space_below / this.real_square_size) * 40;
  
   // TODO: think about this a little better
   this.n_bins = Math.floor(this.width / ((bin_square_width + space_between_bins) * this.real_square_size))
   this.n_bins = this.n_bins - this.n_bins % 2;
   if (this.svg.select("#xaxis").empty()) {
     this.svg.append("line").attr("id", "xaxis")
   }
   var refLine = this.svg.select("#xaxis")
       .attr("stroke", "black")
       .attr("stroke-width", 1)
       .attr("x1", 0)
       .attr("x2", this.width)
       .attr("y1", this.y_divisor - 0.5)
       .attr("y2", this.y_divisor - 0.5);
}
Databin.prototype.AssignDots = function(docs) {
  this.current_docs = docs;
  this.dots = this.svg.selectAll(".hist_dot")
      .data(docs)
  this.dots.enter().append("rect")
      .attr("class", "hist_dot")
      .attr("width", this.square_size)
      .attr("height", this.square_size)
  this.dots.exit().remove();
  var this_object = this;
  this.dots.style("stroke", "black")
      .style("stroke-opacity", 1)
      .style("stroke-width", function(d) { return d.doc_id === this_object.selected_document ? 2.0 : 0})
      .style("fill", function(d) { return this_object.classes.colors_i(d.true_class);})
      .style("opacity", 0.4)
      .attr("id", function(d, i) {return d.doc_id === this_object.selected_document ? "selected_document" : "";});
}

function binaryIndexOf(searchElement) {
    'use strict';
 
    var minIndex = 0;
    var maxIndex = this.length - 1;
    var currentIndex;
    var currentElement;
    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = this[currentIndex];
 
        if (currentElement < searchElement) {
            minIndex = currentIndex + 1;
        }
        else if (currentElement > searchElement) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }
    return currentIndex;
}

Databin.prototype.MapCurrentExamplesToBin = function (focus_class) {
  var n_bins;
  var sorted_correct, sorted_wrong;
  if (focus_class === -1) {
    this.n_bins = this.classes.names.length;
    n_bins = this.n_bins;
    this.bin_width = this.bin_width_sort_by_class;
    sorted_correct = _.map(_.filter(this.current_docs, function(d) {return d.true_class === d.prediction;}), function(d) { return d.true_class / n_bins;}).sort();
    sorted_wrong = _.map(_.filter(this.current_docs, function(d) {return d.true_class !== d.prediction;}), function(d) { return d.true_class / n_bins;}).sort();
  }
  else {
    n_bins = 12;
    sorted_correct = _.map(_.filter(this.current_docs, function(d) {return d.true_class === d.prediction;}), function(d) { return d.predict_proba[focus_class];}).sort();
    sorted_wrong = _.map(_.filter(this.current_docs, function(d) {return d.true_class !== d.prediction;}), function(d) { return d.predict_proba[focus_class];}).sort();
  }
  if (this.square_size < this.initial_square_size) {
    this.square_size = this.initial_square_size;
    this.real_square_size = this.square_size + 1;
    this.dots.attr("width", this.square_size).attr("height", this.square_size);
    this.ComputeMaxPerBin();
  }
  reduce_nbins = true;
  bin_size_40 = true;
  while (reduce_nbins) {
    reduce_nbins = false;
    previous_correct_index = 0;
    previous_wrong_index = 0;
    for (var i = 1; i <= n_bins; ++i) {
      correct_in_bin = binaryIndexOf.call(sorted_correct, i / n_bins - 0.000000000001) - previous_correct_index + 1;
      wrong_in_bin = binaryIndexOf.call(sorted_wrong, i / n_bins - 0.000000000001) - previous_wrong_index + 1;
      previous_correct_index += correct_in_bin - 1
      previous_wrong_index += wrong_in_bin - 1
      if (correct_in_bin > this.max_top_per_nbins[n_bins] || wrong_in_bin > this.max_bottom_per_nbins[n_bins]) {
        bin_size_40 = true;
        reduce_nbins = true;
        n_bins -= 2;
        if (n_bins === 0 || focus_class === -1) {
          this.square_size -= 1;
          this.real_square_size = this.square_size + 1;
          this.dots.attr("width", this.square_size).attr("height", this.square_size);
          n_bins = focus_class === -1 ? this.classes.names.length : 12;
          this.ComputeMaxPerBin();
        }
        break;
      }
      if (correct_in_bin > this.max_top_with_40|| wrong_in_bin > this.max_bottom_with_40) {
        bin_size_40 = false;
      }
    }
  }
  this.bin_width = bin_size_40 ? Math.min(40, this.bin_width_per_nbins[n_bins]) : this.bin_width_per_nbins[n_bins];
  this.n_bins = n_bins;
  var correct_bin_index = [];
  var incorrect_bin_index = [];
  for (var i=0; i<n_bins; i++) {
      correct_bin_index[i] = 0;
      incorrect_bin_index[i] = 0;
  }
  for (var i=0; i< this.current_docs.length; i++) {
    var pred = focus_class === -1 ? this.current_docs[i].true_class / n_bins : this.current_docs[i].predict_proba[focus_class];
    this.current_docs[i].pred_bin = Math.floor(pred* n_bins);
    if (this.current_docs[i].pred_bin >= n_bins) {
        this.current_docs[i].pred_bin -= 1;
    }
    var bin = this.current_docs[i].pred_bin;
    var correct = this.current_docs[i].prediction === this.current_docs[i].true_class;
    if (correct) {
      this.current_docs[i].bin_x = correct_bin_index[bin] % this.bin_width;
      this.current_docs[i].bin_y = Math.floor(correct_bin_index[bin] / this.bin_width);
      correct_bin_index[bin] += 1;
      this.current_docs[i].mistake = false;
    }
    else {
      this.current_docs[i].mistake = true;
      this.current_docs[i].bin_x = incorrect_bin_index[bin] % this.bin_width;
      this.current_docs[i].bin_y = Math.floor(incorrect_bin_index[bin] / this.bin_width) + 1;
      incorrect_bin_index[bin] += 1;
    }
  }
}


Databin.prototype.ShowForClass = function(focus_class) {
  this.current_order = focus_class;
  // Figure out which examples go in which bins
  if (focus_class === -1) {
    this.svg.select("#hist_xaxis")
    .text("Documents grouped by true class.")
    this.svg.select("#databin-mid").style("opacity", 0);
    n_bins = this.classes.names.length;
  }
  else {
    this.svg.select("#hist_xaxis")
    .text("P(" + this.classes.names[focus_class] + " | example), given by the model")
    this.svg.select("#databin-mid").style("opacity", 0.8);
    n_bins = this.n_bins;
  }
  this.MapCurrentExamplesToBin(focus_class);
  // Then map them to an actual x/y position within [0, 1]
  this.x_scale.domain([0, this.n_bins]);
  var baseline = this.y_divisor;
  var this_object = this;
  this.dots.transition().duration(1000)
       .attr("x", function(d) {
         return this_object.x_scale(d.pred_bin) + (this_object.real_square_size) * d.bin_x;
       })
       .attr("y", function(d) {
         mult = d.mistake ? 1 : -1;
         return baseline + mult * (d.bin_y * this_object.real_square_size + 1) - this_object.real_square_size;
       })

  this.svg.select("#xaxis").transition().duration(1000).attr("x2", this.x_scale(this.n_bins-1) + this.bin_width * this.real_square_size);
  d3.select("#selected_document").moveToFront();

  this.dots.on("mouseover", function(d) {
          var xPosition = parseFloat(d3.select(this).attr("x"));
          var yPosition = parseFloat(d3.select(this).attr("y"));

          // Change the style of the square
          d3.select(this)
              .attr("height", this_object.square_size + 10)
              .attr("width", this_object.square_size + 10)
              .attr("x", xPosition-this_object.square_size)
              .attr("y", yPosition-this_object.square_size)
              //.style("opacity", 1.0)

          this_object.tooltip.transition()
              .duration(200)
              .style("opacity", .9)
              .attr("fill", "rgb(255, 255, 255)");

          var s = "Document ID: " + d.doc_id + "<br />True class: ";
          s += this_object.classes.names[d.true_class];
          s += "<br/>Prediction: ";
          s += this_object.classes.names[d.prediction];
          if (focus_class !== -1) {
            s += "<br /> P(" + this_object.classes.names[focus_class] + ") = ";
            s += + d.predict_proba[focus_class].toFixed(2);
          }
          this_object.tooltip.html(s)
              //"Document ID: " + d.doc_id + "<br />True class: " + d.true_class + "<br/>Prediction: " + d.prediction)
              .style("left", d3.event.pageX + 205 < d3.select("body").node().getBoundingClientRect().width ? (d3.event.pageX + 5) + "px" : d3.event.pageX - 205)
              .style("top", (d3.event.pageY - 70) + "px");
      })
      .on("mouseout", function(d) {
          var xPosition = parseFloat(d3.select(this).attr("x"));
          var yPosition = parseFloat(d3.select(this).attr("y"));

          d3.select(this)
              .attr("height", this_object.square_size)
              .attr("width", this_object.square_size)
              .attr("dx", 0.1)
              .attr("x", xPosition+this_object.square_size)
              .attr("y", yPosition+this_object.square_size)
              //.style("opacity", function(d){return d.doc_id == selected_document ? 1.0 : 0.4});

          this_object.tooltip.transition()
              .duration(500)
              .style("opacity", 0);
      })
      .on("click", function(d) {
          this_object.dots.style("stroke-width", 0);
          d3.select(this)
              .transition().delay(0.1)
              .style("stroke-width", 2)
              .style("stroke-alignment", "inner")
              .style("stroke-opacity", 1)
              .attr("id", "selected_document");
          d3.select(this).moveToFront();
          this_object.selected_document = d.doc_id;
          // TODO
          GetPredictionAndShowExample(d.features, d.true_class);
          ShowFeedbackExample(this_object.current_docs[d.doc_id]);
      });
}


Databin.prototype.SetDocIds = function () {
  for (var i=0; i <this.train_docs.length; i++) {
      this.train_docs[i].doc_id = i;
  }
  for (var i=0; i <this.test_docs.length; i++) {
      this.test_docs[i].doc_id = i;
  }
}
Databin.prototype.BrushExamples = function(example_set, instant) {
  var dots = instant ? this.dots : this.dots.transition()
  dots.style("opacity", function(d){
    return example_set.has(d.doc_id) ? 1 : 0.4;});
}

Databin.prototype.BrushOnMatrix = function(true_label, predicted_label) {
  docs = [];
  if (true_label !== this.current_matrix_brush[0] || predicted_label !== this.current_matrix_brush[1]) {
    docs = _.filter(this.current_docs, function (d) {return d.prediction === predicted_label && d.true_class === true_label; })
    this.current_matrix_brush = [true_label, predicted_label];
  }
  else {
    this.current_matrix_brush = [-1, -1];
  }
  docs = new Set(_.map(docs, function(d) {return d.doc_id;}));
  this.BrushExamples(docs, false);
}
Databin.prototype.ChangeDataset = function(is_train) {
  var docs = is_train ? this.train_docs : this.test_docs;
  this.current_matrix_brush = [-1, -1];
  this.AssignDots(docs);
  this.ShowForClass(this.current_order);
}
