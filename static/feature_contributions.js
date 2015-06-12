// Selected features is a set passed by reference. It will be modified by other
// stuff. maybe I should change this in the future.
var FeatureContributions = function (id, width, bar_height, x_offset, right_x_offset, classes, feature_attributes, brushed_features, word_tooltip) {
  this.div = d3.select(id);
  this.svg = d3.select(id).append("svg").attr('width','100%');
  this.bars = this.svg.append('g')
                  .attr('transform', "translate(" + x_offset+ ",0)");
  this.line = this.svg.append("line")
                      .attr("x1", x_offset)
                      .attr("x2", x_offset)
                      .attr("y1", bar_height)
                      .style("stroke-width",2)
                      .style("stroke", "black");

  this.classes = classes;
  this.feature_attributes = feature_attributes;
  this.brushed_features = brushed_features;
  this.word_tooltip = word_tooltip;
  this.xscale = d3.scale.linear()
          .domain([0,1])
          .range([0, width - right_x_offset]);
  this.bar_height = bar_height;
  this.x_offset = x_offset;
}
FeatureContributions.prototype.ShowExample = function(example) {
  var data = example.sorted_weights;
  var total_height = (this.bar_height + 10) * data.length;
  var yscale = d3.scale.linear()
          .domain([0, data.length])
          .range([0,total_height]);
  this.svg.attr('height', total_height + 10);
  this.line.transition()
           .duration(1000)
           .attr("y2", Math.max(this.bar_height, total_height - 10 + this.bar_height));

  var this_object = this;
  var labels = this.svg.selectAll(".labels").data(data)
  labels.enter().append('text')
  labels.attr('x', this.x_offset - 2)
        .attr('y', function(d, i) { return yscale(i) + this_object.bar_height + 14})
        .attr('text-anchor', 'end')
        .style("fill", function(d) { return this_object.feature_attributes.FeatureColor(d.feature); })
        .classed("labels", true)
        .on("mouseover", function(d) {this_object.word_tooltip.ShowFeatureTooltip(d);})
        .on("mouseout", function() {this_object.word_tooltip.HideFeatureTooltip();})
        .on("click", function(d) {this_object.brushed_features.ToggleFeatureBrush(d.feature)})
        .text(function(d) {return d.feature;});
  labels.exit().remove();
  var bars = this.bars.selectAll('rect').data(data)
  bars.enter().append('rect')
  bars.on("mouseover", function(d) {this_object.word_tooltip.ShowFeatureTooltip(d);})
      .on("mouseout", function() {this_object.word_tooltip.HideFeatureTooltip();})
      .on("click", function(d) {this_object.brushed_features.ToggleFeatureBrush(d.feature)})
      .attr('height',this.bar_height)
      .attr({'x':0,'y':function(d,i){ return yscale(i)+ this_object.bar_height; }})
      .attr('width', 0)
      .style('fill',function(d,i){ return this_object.classes.colors_i(d.class); });
  bars.transition().duration(1000)
      .attr('width',function(d){ return this_object.xscale(d.weight); })
      .style('fill',function(d,i){ return this_object.classes.colors_i(d.class); })
  bars.exit().transition().duration(1000).attr('width', 0).remove();

  var bartext = this.bars.selectAll("text").data(data)
  bartext.enter()
         .append('text')
         .attr('x', function(d) {return this_object.xscale(d.weight) + 5; })
         .attr('y', function(d,i){ return yscale(i)+35; });
  bartext.transition().duration(1000).
    text(function (d) {return d.weight.toFixed(2);})
    .attr('x', function(d) {return this_object.xscale(d.weight) + 5; })
    .attr('y', function(d,i){ return yscale(i)+35; });
  bartext.exit().transition().remove();
}

FeatureContributions.prototype.UpdateSelectedFeatures = function() {
  var this_object = this;
  this.svg.selectAll(".labels")
    .style("text-decoration", function(d) { return this_object.brushed_features.IsBrushed(d.feature) ? "underline" : "none";});
}

