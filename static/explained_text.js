// Selected features is a set passed by reference. It will be modified by other
// stuff. maybe I should change this in the future.
var ExplainedText = function (id, classes, feature_attributes, brushed_features, word_tooltip) {
  this.div = d3.select(id);
  this.classes = classes;
  this.feature_attributes = feature_attributes;
  this.brushed_features = brushed_features;
  this.word_tooltip = word_tooltip;
}
ExplainedText.prototype.ShowExample = function(example) {
  var text = this.div.selectAll("span").data(example.features);
  text.enter().append("span");
  var this_object = this;
  text.html(function (d,i) {return d.feature != "\n" ? d.feature + " " : "<br />"; })
      .style("color", function(d, i) {
        var w = 20;
        var color_thresh = 0.02;
        if (d.weight > color_thresh) {
          color = classes.colors_i(d.class);
          return color;
        }
        else {
          return this_object.feature_attributes.FeatureColor(d.feature);
        }
      })
      .style("font-size", function(d,i) {return size(Math.abs(d.weight))+"px";})
      .style("text-decoration", function(d,i) { return this_object.brushed_features.IsBrushed(d.feature) ? "underline" : "none";})
      .on("mouseover", function(d) {this_object.word_tooltip.ShowFeatureTooltip(d);})
      .on("mouseout", function() {this_object.word_tooltip.HideFeatureTooltip();})
      .on("click", function(d) {this_object.brushed_features.ToggleFeatureBrush(d.feature)});
      // TODO: Pass a databin instance here for the stuff above
  text.exit().remove();
}

ExplainedText.prototype.UpdateSelectedFeatures = function() {
  var this_object = this;
  this.div.selectAll("span")
      .style("text-decoration", function(d,i) { return this_object.brushed_features.IsBrushed(d.feature) ? "underline" : "none";})
}
