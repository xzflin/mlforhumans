var BrushedFeatures = function (id, feature_attributes, databin) {
  this.div = d3.select(id);
  this.feature_attributes = feature_attributes;
  this.selected_features = new Set();
  this.databin = databin;
  this.current_feature_list = []
  this.current_train = false;
}
BrushedFeatures.prototype.UpdateObjects = function(explained_text, feature_contributions) {
  this.explained_text = explained_text;
  this.feature_contributions = feature_contributions;
}
BrushedFeatures.prototype.ChangeDataset = function(current_train) {
  this.current_train = current_train;
}

BrushedFeatures.prototype.SetFeatureAttributes = function(feature_attributes) {
  this.feature_attributes = feature_attributes;
}
BrushedFeatures.prototype.ToggleFeatureBrush = function(word) {
  if (!this.feature_attributes.InTrain(word)) {
    return;
  }
  if (this.selected_features.has(word)) {
    this.selected_features.delete(word);
  } 
  else {
    this.selected_features.add(word);
  }
  this.current_feature_list = []
  var this_object = this;
  this.selected_features.forEach(function(d) {this_object.current_feature_list.push(d);})
  this.UpdateBrushes(false);
}

BrushedFeatures.prototype.IsBrushed = function(word) {
  return this.selected_features.has(word);
}

BrushedFeatures.prototype.UpdateBrushes = function(instant) {
  this.UpdateSelectedFeatures();
  this.explained_text.UpdateSelectedFeatures();
  this.feature_contributions.UpdateSelectedFeatures();
  var docs;
  if (this.current_feature_list.length > 1) {
    docs = _.intersection.apply(this, _.map(this.current_feature_list, function (d) {return this.current_train ? this.feature_attributes.Get(d).train_docs : this.feature_attributes.Get(d).test_docs;}));
  } else {
    if (this.current_feature_list.length != 0) {
      docs = this.current_train ? this.feature_attributes.Get(this.current_feature_list[0]).train_docs : this.feature_attributes.Get(this.current_feature_list[0]).test_docs;
    }
  }
  docs = new Set(_.map(docs, function(d) { return +d;}))
  this.databin.BrushExamples(docs, instant);
}


BrushedFeatures.prototype.UpdateSelectedFeatures = function() {
  var this_object = this;
  this.div.selectAll(".active_features").remove();
  saved = this.div.selectAll(".active_features").data(this.current_feature_list)
  zs = saved.enter().append("span")
  zs.classed("active_features", true);
  ps = zs.append("span");
  ps.classed('active_text', true)
    .html(function(d,i) { return '&nbsp;&nbsp;' +  d + '&nbsp;&nbsp;'})
  xs = zs
       .append("span")
       .html("&#10799;<br />")
       .on("click", function(d,i) {
          var feature = this_object.current_feature_list.splice(i, 1)[0];
          this_object.ToggleFeatureBrush(feature);
        });
  xs.style("color", "red");
  saved.exit().remove();
}
