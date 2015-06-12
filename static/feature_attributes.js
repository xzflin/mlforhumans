var FeatureAttributes = function (feature_attributes) {
  this.feature_attributes = feature_attributes;
}
FeatureAttributes.prototype.InTrain = function(feature) {
  return typeof this.feature_attributes[feature] !== 'undefined';
}
FeatureAttributes.prototype.FeatureColor = function(feature) {
  return this.InTrain(feature) ?  "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.35)";
}
