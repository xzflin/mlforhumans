var PredictionProbabilities = function (id, classes, width, height, bar_height, class_name_width, space_between_bars) {
  this.svg = d3.select(id);
  this.bar_yshift = bar_height + 45;
  this.bars = new HorizontalBarplot(this.svg, classes, width, height, bar_height, class_name_width, space_between_bars, this.bar_yshift);
  this.width = width;
  this.height = height;
  this.svg.attr("width", width).attr("height", height);
  this.classes = classes;
  this.bar_height = bar_height;
  this.space_between_bars = space_between_bars;
  this.bar_x = class_name_width;
  this.DrawSkeleton();
}
// Draws the text and fake bars. If stuff already exists, delete them and redraw
PredictionProbabilities.prototype.DrawSkeleton = function() {
  this.svg.selectAll(".true_class").remove();
  var true_class = this.svg.append("g")
  true_class.classed("true_class", true);
  true_class.append("circle")
       .attr("cx", this.bar_x + this.bar_height / 2)
       .attr("cy", 25)
       .attr("r",  this.bar_height / 2);
  true_class.append("text").attr("x", this.bar_x + this.bar_height / 2 + 20).attr("y", 30).attr("fill", "black").style("font", "14px tahoma, sans-serif");
  true_class.append("text").attr("x", this.bar_x - 10).attr("y", 30).attr("text-anchor", "end").attr("fill", "black").style("font", "14px tahoma, sans-serif").text("True Class:");
  true_class.append("text").attr("x", this.bar_x - 10).attr("y", 50).attr("text-anchor", "end").attr("fill", "black").style("font", "14px tahoma, sans-serif").text("Prediction:");
  this.bars.DrawSkeleton();
}
PredictionProbabilities.prototype.UpdatePredictionBars = function(predict_proba, true_class) {
  this.bars.UpdateBars(predict_proba, false);
  var true_class_circle = this.svg.selectAll(".true_class")
  true_class_circle.select("circle").transition().duration(500)
      .style("fill", this_object.classes.colors_i(true_class));
  true_class_circle.select("text").text(this_object.classes.names[true_class]);
}
