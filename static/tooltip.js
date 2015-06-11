var Tooltip = function (id, classes, width, bar_height, class_name_width, space_between_bars, n_bars, feature_attributes) {
  this.n_bars = n_bars;
  this.feature_attributes = feature_attributes;
  this.height = 90 + bar_height * n_bars;
  this.svg = d3.select(id)
    .style("opacity", 0)
    .style("position", "absolute")
    .style("left", "10px")
    .style("pointer-events", "none")
    .style("pointer-events", "none")
    .style("width", width)
  this.bar_yshift = bar_height + 45;
  this.bar_x = class_name_width + 10;
  this.bars = new HorizontalBarplot(this.svg, classes, width, this.height, bar_height, this.bar_x, space_between_bars, this.bar_yshift);
  this.DrawSkeleton();
}
Tooltip.prototype.DrawSkeleton = function() {
  this.svg.select(".top_text").remove();
  this.svg.select(".bottom_text").remove();
  var top_text = this.svg.append("g").classed("top_text", true);
  top_text.append("text").attr("id", "focus_feature").attr("x", 10).attr("y",  20).attr("fill", "black").text("Word:");
  top_text.append("text").attr("id", "frequency").attr("x", 10).attr("y",  35).attr("fill", "black").text("Frequency in train:");
  var bottom_text = this.svg.append("g").classed("bottom_text", true);
  bottom_text.append("text").attr("x", 10).attr("y",  50).attr("fill", "black").text("Conditional distribution (train):");
  this.bars.DrawSkeleton();
}

Tooltip.prototype.ShowFeatureTooltip = function(d) {
  // Assumes d has d.feature
  var freq;
  var prob;
  var undef = false;
  if (typeof this.feature_attributes[d.feature] == 'undefined') {
    undef = true;
    ChangeVisibility(this.svg.selectAll(".bars"), false)
    ChangeVisibility(this.svg.select(".bottom_text"), false)
  }
  else {
    ChangeVisibility(this.svg.selectAll(".bars"), true)
    ChangeVisibility(this.svg.select(".bottom_text"), true)

    freq = this.feature_attributes[d.feature]['train_freq'];
    data = this.feature_attributes[d.feature]['train_distribution'];
  }
  this.svg.transition()
      .delay(1000)
      .duration(200)
      .style("opacity", .9);
  this.svg.style("left", (d3.event.pageX ) + "px")
      .style("top", (d3.event.pageY - 28) + "px");
  var word = this.svg.select("#focus_feature")
  word.text("Word: "+ d.feature);
  var word = this.svg.select("#frequency")
  if (undef) {
    word.text("< 1% in train or not a feature");
//     bars.attr("width", 0)
//     bar_text.attr("x", function(d) { return bar_x +  5 + tooltip_xshift;})
//         .attr("fill", "black")
//         .text("0");
//     name_object.data(class_names.slice(0, tooltip_bars));
  }
  else {
    word.text("Frequency in train: "+ freq.toFixed(2));
    this.bars.UpdateBars(data, true);
  }
}
Tooltip.prototype.HideFeatureTooltip = function() {
  this.svg.transition()
      .duration(300)
      .style("opacity", 0);
}

