var Classes = function(class_names, max_class_name_length) {
  this.names = _.map(class_names, function(i) {
    text = i.replace(".","-");
    return  text.length > max_class_name_length ? text.slice(0,max_class_name_length - 3) + "..." : text;
  });
  if (class_names.length <= 10) {
    this.colors = d3.scale.category10().domain(this.names);
    this.colors_i = d3.scale.category10().domain(_.range(this.names.length));
  }
  else {
    console.log("Error");
    this.colors = d3.scale.category20().domain(this.names);
    this.colors_i = d3.scale.category20().domain(_.range(this.names.length));
  }
}
