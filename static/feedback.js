var Feedback = function (id, from_id, to_id, active_id, databin) {
  this.div = d3.select(id);
  this.from = d3.select(from_id);
  this.to = d3.select(to_id)
  this.active_div = d3.select(active_id);
  this.databin = databin;
  this.current_regex = {};
  this.current_train = false;
  this.current_example = '';
  this.saved_regex = [];
}
Feedback.prototype.ChangeDataset = function(current_train) {
  this.current_train = current_train;
}
Feedback.prototype.GetSavedRegex = function() {
  return this.saved_regex;
}
Feedback.prototype.SaveRegex = function() {
  var regex_from = d3.select("#feedback_from").node().value;
  var regex_to = d3.select("#feedback_to").node().value;
  this.saved_regex.push('s/' + regex_from + '/'+ regex_to + '/g')
  //d3.select("#feedback_active_div").html("Saved regexes :<br />" + saved_regex.join("   &#10799;<br />"))
  this.UpdateSavedRegex();
}

Feedback.prototype.UpdateSavedRegex = function() {
  var this_object = this;
  this.active_div.selectAll(".active_regexes").remove();
  var saved = this.active_div.selectAll(".active_regexes").data(this.saved_regex)
  var zs = saved.enter().append("span")
  zs.classed("active_regexes", true);
  var ps = zs.append("span");
  ps.classed('active_text', true)
    .html(function(d,i) { return '&nbsp;&nbsp;' +  d + '&nbsp;&nbsp;'})
    .on("click", function(d, i) {
      temp = d.split('/');
      this_object.from.node().value = temp[1] ;
      this_object.to.node().value = temp[2] ;
      });

  var xs = zs
       .append("span")
       .html("&#10799;<br />")
       .on("click", function(d,i) {
          this_object.saved_regex.splice(i, 1);
          this_object.UpdateSavedRegex();
        });
  xs.style("color", "red");
  saved.exit().remove();
}
Feedback.prototype.GetRegexResults = function() {
  var this_object = this;
  var regex = this.from.node().value;
  if (regex === '') {
    this.current_regex['train'] = []
    this.current_regex['test'] = []
  }
  else {
    StartLoading(500);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8870/regex');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            this_object.current_regex = JSON.parse(xhr.responseText);
            this_object.ShowExample(this_object.current_example);
            this_object.Brush(false);
            StopLoading();
        }
    };
    xhr.send(JSON.stringify({
        regex: regex
    }));
  }
}

Feedback.prototype.Brush = function(instant) {
  var reg = this.current_train ? this.current_regex.train : this.current_regex.test;
  exs = new Set(_.map(_.keys(reg), Number));
  this.databin.BrushExamples(exs, instant);
}
Feedback.prototype.ShowExample = function(example) {
  this.current_example = example;
  var from_regex = this.from.node().value;
  var text = example.features.join(" ");
  text = text.replace(/ \n /g, "\n")
  var id = example.doc_id;
  var to_insert_before = '<span class="regex_apply">'
  var to_insert_after = '</span>'
  var len_insertion = to_insert_before.length + to_insert_after.length
  var regex = this.current_train ? this.current_regex['train'] : this.current_regex['test'];
  if (_.has(regex, id)) {
    for (i = 0; i < regex[id].length; ++i) {
      start = regex[id][i][0] + i * len_insertion;
      end = regex[id][i][1] + i * len_insertion;
      text = text.slice(0,start) + to_insert_before + text.slice(start, end) + to_insert_after + text.slice(end);
    }
  }
  text = text.replace(/\n/g, "<br />")
  this.div.html(text);
}

