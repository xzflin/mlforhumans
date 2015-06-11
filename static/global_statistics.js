var GlobalStatistics = function (id, class_name, classes, height, barchart_width, bar_height, class_name_width, space_between_bars, max_docs) {
  this.class_name = class_name;
  this.stats_svg = d3.select(id).append("svg");
  // 80 is stuff on top, 20 TODO
  this.x_shift = class_name_width + 30;
  this.bar_yshift = 80;
  total_height = (bar_height + space_between_bars) * class_names.length + 80 + 20;
  this.stats_svg.attr("width", barchart_width)
           .attr("height", total_height)
           .attr("id", "stats_svg")
           .style("float", "left")
           .style("padding", "0 px 20 px 0 px 20px");
  this.bars = new HorizontalBarplot(this.stats_svg, classes, barchart_width, total_height, bar_height, this.x_shift, space_between_bars, this.bar_yshift);
  this.bars.SetPrecision(0);
  this.DrawSkeleton();
  cm_svg = d3.select(id).append("svg")
  this.confusion_matrix = new Matrix(cm_svg, height, classes, max_docs);
}

GlobalStatistics.prototype.DrawSkeleton = function() {
  var text = this.stats_svg.append("g");
  text.append("text")
    .attr("x", this.x_shift - 40)
    .attr("id", "statistics_title")
    .attr("y", 30)
    .attr("fill", "black")
    .style("font", "14px tahoma, sans-serif")
  text.append("text").
    attr("x", this.x_shift - 40)
    .attr("y", 50)
    .attr("fill", "black")
    .style("font", "14px tahoma, sans-serif")
    .attr("id", "statistics_total");
  text.append("text")
    .attr("x", this.x_shift - 40)
    .attr("y", 70)
    .attr("fill", "black")
    .style("font", "14px tahoma, sans-serif")
    .text("Class Distribution:");
}

GlobalStatistics.prototype.DrawStatistics = function(title, data, confusion_matrix) {
  visible = d3.selectAll(this.class_name).classed("visible")
  ChangeVisibility(d3.selectAll(".top_statistics"), true);
  total = d3.sum(data.class_distribution)
  this.bars.SetDomainMax(total);
  this.bars.UpdateBars(data.class_distribution, true);
  this.stats_svg.select("#statistics_title")
    .text(title + " accuracy:" + data.accuracy);
  this.stats_svg.select("#statistics_total")
    .text("Number of documents: " + total);
  this.confusion_matrix.populateMatrix(confusion_matrix)
  ChangeVisibility(d3.selectAll(this.class_name), visible);
}
