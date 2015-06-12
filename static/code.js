var train_docs, test_docs, size, feature_attributes;
var train_statistics, test_statistics;
var class_names;
// class_colors_i is by index, class_colors is by name
var class_colors, class_colors_i;
var current_object;
var max_docs;
var selected_features = new Set()
var matrix;
var top_part_height;
var top_divs_width;
var is_loading = true;
var current_focus_class = 0;
var current_docs;
var confusion_matrix;
var current_train = false;
var current_feature_brush = [];
var current_regex = {};
var saved_regex = []
var prediction_bars;
var word_tooltip;
var global_statistics;
var classes;
var explained_text;
var feature_contributions;
var brushed_features;
var databin;

function LoadJson() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:8870/get_json');
  xhr.setRequestHeader('Content-Type', 'application/json');
  StartLoading(0);
  xhr.onload = function() {
      if (xhr.status === 200) {
        var json = JSON.parse(xhr.responseText);
        train_docs = json.train;
        test_docs = json.test;
        max_docs = Math.max(train_docs.length, test_docs.length)
        current_docs = test_docs;
        train_statistics = json.statistics.train;
        test_statistics = json.statistics.test;
        feature_attributes = json.feature_attributes;
        f_attributes = new FeatureAttributes(json.feature_attributes);
        class_names = json.class_names;
        classes = new Classes(class_names, 17);
        class_names = _.map(class_names, function(i) {
          text = i.replace(".","-");
          return  text.length > 17 ? text.slice(0,14) + "..." : text;
        });
        // TODO: this only works for at most 20 classes. I don't know if we should
        // worry about this though - if you have more than 20, color is not going to
        // work anyway
        if (class_names.length <= 10) {
          class_colors = d3.scale.category10().domain(class_names);
          class_colors_i = d3.scale.category10().domain(_.range(class_names.length));
        }
        else {
          class_colors = d3.scale.category20().domain(class_names);
          class_colors_i = d3.scale.category20().domain(_.range(class_names.length));
        }
        size = d3.scale.linear().domain([0, 1]).range([15, 40]);
        top_part_height = parseInt(d3.select("#explain_text_div").style("height")) + parseInt(d3.select("#top_part_options_div").style("height"));
        top_divs_width = parseInt(d3.select("#explain_text_div").style("width"));
        DrawLegend();

        top_options_height = parseInt(d3.select("#top_part_options_div").style("height"))
        div_height = parseInt(d3.select("body").style("height")) - (top_part_height + legend_height + 5 + 5 + top_options_height);
        //SetupDatabin();
        prediction_bars = new PredictionProbabilities("#prediction_bar", classes, top_divs_width, 225, 17, 90, 5);
        word_tooltip = new Tooltip("#hovercard", classes, 265, 17, 90, 5, 5, feature_attributes);
        databin = new Databin("#databin_div", div_height, classes);
        databin.NewDataset(train_docs, test_docs, train_statistics, test_statistics);
        global_statistics = new GlobalStatistics("#statistics_div", ".top_statistics", classes, top_part_height, 285, 17, 90, 5, max_docs, databin);
        global_statistics.DrawStatistics("Validation", test_statistics, test_statistics.confusion_matrix);
        brushed_features = new BrushedFeatures("#feature_brush_div", f_attributes, databin); 
        explained_text = new ExplainedText("#explain_text_div", classes, f_attributes, brushed_features, word_tooltip);
        feature_contributions = new FeatureContributions("#explain_features_div", top_divs_width, 19, 80, 40, classes, f_attributes, brushed_features, word_tooltip);
        brushed_features.UpdateObjects(explained_text, feature_contributions);

        //ReSetupDatabin();
        ChangeVisibility(d3.selectAll(".top_statistics"), false);
        ChangeVisibility(d3.selectAll(".top_feedback"), false);
        ChangeVisibility(d3.select("#explain_selections"), true);
        change_order(1);
        ShowFeedbackExample(current_docs[0]);
        GetPredictionAndShowExample(current_docs[0].features, current_docs[0].true_class);
        StopLoading();
        Intro();
      }
  };
xhr.send();
}

LoadJson()

function StartLoading(ms) {
  is_loading = true;
  setTimeout(function() {
    if (is_loading) {
      ChangeVisibility(d3.select("#loading"), true);
    }
  }, ms);
}
function StopLoading() {
  is_loading = false;
  ChangeVisibility(d3.select("#loading"), false)
}
function ChangeVisibility(selection, visible) {
  // visible is true or false
  selection.classed("hidden", !visible).classed("visible", visible);
}

function GetPredictionAndShowExample(example_text_split, true_class) {
  StartLoading(800);
  var xhr = new XMLHttpRequest();
  //ChangeVisibility(d3.select("#loading"), true);
  xhr.open('POST', 'http://localhost:8870/predict');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
      if (xhr.status === 200) {
          var prediction_object = JSON.parse(xhr.responseText);
          current_object = GenerateObject(example_text_split, true_class, prediction_object);
          ShowExample(current_object);
          // ShowWeights(current_object);
          StopLoading();
          //ChangeVisibility(d3.select("#loading"), false);
      }
  };
//xhr.send();
xhr.send(JSON.stringify({
    features: example_text_split,
}));
}

function apply_regex() {
  regex = d3.select("#feedback_from").node().value;
  if (regex !== '') {
    GetRegexResults(regex);
  }
}
function update_saved_regex() {
  d3.select("#feedback_active_div").selectAll(".active_regexes").remove();
  saved = d3.select("#feedback_active_div").selectAll(".active_regexes").data(saved_regex)
  zs = saved.enter().append("span")
  zs.classed("active_regexes", true);
  ps = zs.append("span");
  ps.classed('active_text', true)
    .html(function(d,i) { return '&nbsp;&nbsp;' +  d + '&nbsp;&nbsp;'})
    .on("click", function(d, i) {
      temp = d.split('/');
      d3.select("#feedback_from").node().value = temp[1] ;
      d3.select("#feedback_to").node().value = temp[2] ;
      });

  xs = zs
       .append("span")
       .html("&#10799;<br />")
       .on("click", function(d,i) {
        saved_regex.splice(i, 1);
        update_saved_regex();
        });
        //d3.selectAll(".active_text").filter(function(d,a) { return a === i;}).remove();
        //this.remove()});
  xs.style("color", "red");
  saved.exit().remove();
}
function save_regex() {
  regex_from = d3.select("#feedback_from").node().value;
  regex_to = d3.select("#feedback_to").node().value;
  saved_regex.push('s/' + regex_from + '/'+ regex_to + '/g')
  //d3.select("#feedback_active_div").html("Saved regexes :<br />" + saved_regex.join("   &#10799;<br />"))
  update_saved_regex()
}
// Retorna o resultado da regex:
// dois mapas:
// train[documento] = [(start, end), (start,end)...]
// test[document] = ...
// no final chama ShowFeedbackExample
function GetRegexResults(regex) {
  StartLoading(500);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:8870/regex');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
      if (xhr.status === 200) {
          current_regex = JSON.parse(xhr.responseText);
          BrushRegex();
          ShowFeedbackExample(current_docs[selected_document]);
          StopLoading();
      }
  };
//xhr.send();
xhr.send(JSON.stringify({
    regex: regex
}));
}

function RunRegex() {
  StartLoading(200);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:8870/run_regex');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
      if (xhr.status === 200) {
          json = JSON.parse(xhr.responseText);
          BrushRegex();
          ShowFeedbackExample(current_docs[selected_document]);
          train_docs = json.train;
          test_docs = json.test;
          train_statistics = json.statistics.train;
          test_statistics = json.statistics.test;
          feature_attributes = json.feature_attributes;
          if (current_train) {
            global_statistics.DrawStatistics("Train", train_statistics, train_statistics.confusion_matrix)
            current_docs = train;
          }
          else {
            global_statistics.DrawStatistics("Validation", test_statistics, test_statistics.confusion_matrix)
            current_docs = test_docs;
          }
          current_feature_brush = [];
          current_regex = {};
          // saved_regex = []
          // update_saved_regex()
          current = 0;
          set_doc_ids(train_docs);
          set_doc_ids(test_docs);
          AssignDots(svg_hist, current_docs);
          GetPredictionAndShowExample(current_docs[selected_document].features, current_docs[selected_document].true_class);
          ShowFeedbackExample(current_docs[selected_document]);
          ShowDatabinForClass(-1);
          StopLoading();
      }
  };
//xhr.send();
xhr.send(JSON.stringify({
    regex: saved_regex
}));
}


function BrushRegex(instant) {
  reg = current_train ? current_regex.train : current_regex.test;
  exs = new Set(_.map(_.keys(reg), Number));
  if (instant) {
    InstantBrushExamples(exs);
  }
  else {
    BrushExamples(exs);
  }
}

// Takes in a word array and the object returned by the python server, outputs
// an object that is used by ShowExample
function GenerateObject(feature_array, true_class, prediction_object) {
  ret = Object();
  ret.features = _.map(feature_array, function(w) {
        if (_.has(prediction_object.feature_weights, w)) {
          return {"feature" : w, "weight": prediction_object.feature_weights[w]["weight"], 'class' : prediction_object.feature_weights[w]["class"]};
        }
        else {
          return {"feature" : w, "weight": 0, cl : 0};
        }
      }
  )
  ret.prediction = prediction_object.prediction;
  ret.predict_proba = prediction_object.predict_proba;
  ret.true_class = true_class;
  ret.sorted_weights = prediction_object.sorted_weights;
  return ret;
}

function change(current_text) {
  if (current_text === null) {
    current_text = d3.select("#textarea_explain").node().value;
  }
  //example_text_split = current_text.replace("\n", " \n ").split(" ");
  example_text_split = current_text.replace(/\n/g, " \n ").match(/[^ ]+/g);
  GetPredictionAndShowExample(example_text_split, current_docs[current].true_class);
}
function change_to_selection() {
  text = document.getSelection().toString();
  if (text !== "") {
    change(text.replace(/\n/g, "\n "))
  }
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
}


function ShowFeedbackExample(ex) {
  from_regex = d3.select("#feedback_from").node().value;
  text = ex.features.join(" ");
  text = text.replace(/ \n /g, "\n")
  id = ex.doc_id;
  to_insert_before = '<span class="regex_apply">'
  to_insert_after = '</span>'
  len_insertion = to_insert_before.length + to_insert_after.length
  regex = current_train ? current_regex['train'] : current_regex['test'];
  if (_.has(regex, id)) {
    for (i = 0; i < regex[id].length; ++i) {
      start = regex[id][i][0] + i * len_insertion;
      end = regex[id][i][1] + i * len_insertion;
      text = text.slice(0,start) + to_insert_before + text.slice(start, end) + to_insert_after + text.slice(end);
    }
  }
  text = text.replace(/\n/g, "<br />")
  d3.select("#feedback_text_div").html(text);
}
// Takes in an object that has the following attributes:
// features -> a list of (feature,weight) pairs.
// prediction -> a single integer
// predict_proba -> list of floats, corresponding to the probability of each // class
function ShowExample(ex) {
  explained_text.ShowExample(ex);
  feature_contributions.ShowExample(ex);
  current_text = _.map(ex.features, function(x) {return x.feature;}).join(" ")
  d3.select("#textarea_explain").node().value = current_text;
  prediction_bars.UpdatePredictionBars(ex.predict_proba, ex.true_class);
}
/* --------------------------*/
// Databin

// Function to move stuff to front. This is for the selected document.
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};


function swap_dataset() {
  if(current_train === false) {
    current_train = true;
    current_docs = train_docs;
    global_statistics.DrawStatistics("Train", train_statistics, train_statistics.confusion_matrix)
  }
  else {
    current_train = false;
    current_docs = test_docs;
    global_statistics.DrawStatistics("Validation", test_statistics, test_statistics.confusion_matrix)
  }
  databin.ChangeDataset(current_train);
  //AssignDots(svg_hist, current_docs);
  GetPredictionAndShowExample(current_docs[0].features, current_docs[0].true_class);
  ShowFeedbackExample(current_docs[0]);
  //ShowDatabinForClass(-1);
  if (tab_mode === 'explain') {
    brushed_features.UpdateBrushes(true);
  }
  else if (tab_mode === 'feedback') {
    BrushRegex(true);
  }
}

var tab_mode = "explain";
function tab_change_explain() {
  tab_mode = "explain";

  ChangeVisibility(d3.selectAll(".top_statistics"), false);
  ChangeVisibility(d3.selectAll(".top_feedback"), false);
  ChangeVisibility(d3.select("#explain_selections"), true);
  change_order(1);
  GetPredictionAndShowExample(current_docs[selected_document].features, current_docs[selected_document].true_class);
}

function tab_change_statistics() {
  tab_mode = "statistics";

  ChangeVisibility(d3.selectAll(".top_explain"), false);
  ChangeVisibility(d3.selectAll(".top_feedback"), false);
  ChangeVisibility(d3.selectAll(".top_statistics"), true);
  ChangeVisibility(d3.select("#explain_selections"), false);
}

function tab_change_feedback() {
  tab_mode = "feedback";

  ChangeVisibility(d3.selectAll(".top_explain"), false);
  ChangeVisibility(d3.selectAll(".top_statistics"), false);
  ChangeVisibility(d3.selectAll(".top_feedback"), true);
  ChangeVisibility(d3.select("#explain_selections"), false);
  ShowFeedbackExample(current_docs[selected_document]);
}

var legend_height;
function DrawLegend() {
  var n_classes = class_names.length;
  // draw legend
  var legend_x = 120;
  var legend_y = 0;
  var width = parseInt(d3.select("#legend_div").style("width"))
  var elements_per_line = Math.floor((width - legend_x - 15 - 120) / 140)
  var lines = Math.ceil(n_classes / elements_per_line)
  var svg_legend = d3.select("#legend_div").append("svg")
  legend_height = legend_y + 16 + 15;
  var svg_height = legend_y + 16 + 15 * lines;
  d3.select("#legend_div").style("height", legend_height);
  svg_legend.style("width","100%").style("height", svg_height);
  svg_legend.append("text")
    .attr("x", 15)
    .attr("y", 20)
    .style("font-size", "14px")
    .text("Group by class");
  svg_legend.append("rect")
    .attr("x", 10)
    .attr("y", 0)
    .attr("height", 30)
    .attr("width", legend_x - 25)
    .style("stroke", "#86a36e")
    .style("fill", "rgba(124,240,10,0)")
    .on("click", function() { databin.ShowForClass(-1)});

  legend = svg_legend.selectAll(".legend_stuff").data(class_names).enter()
  legend.append("text")
    .attr("x", function(d, i) { return legend_x + 30 + (i % elements_per_line) *140;})
    .attr("y", function(d, i) { return legend_y + 20 + Math.floor(i / elements_per_line) * 15; })
    .style("font-size", "14px")
    .on("click", function(d) { databin.ShowForClass(class_names.indexOf(d)); })
    .text(function(d) { return d;});
  legend.append("rect")
    .attr("x", function(d, i) { return legend_x + 15 + (i % elements_per_line) *140;})
    .attr("y", function(d, i) { return legend_y + 10 + Math.floor(i / elements_per_line) * 15; })
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", function(d) {return class_colors(d);})
    .on("click", function(d) { databin.ShowForClass(class_names.indexOf(d)); });
  svg_legend.append("rect")
      .attr("x", legend_x)
      .attr("y", legend_y)
      .attr("width", 15 + Math.min(n_classes, elements_per_line) * 140 + 10)
      .attr("height", 15 * lines + 15)
      .style("stroke", "#86a36e")
      .style("fill", "none");
}


var top_divs_order = {"textarea" : 1, "text": 2, "prediction": 3, "feature_contribution": 3, "brushed_features" : 1};
top_divs = d3.selectAll(".top_explain").data(["textarea", "text", "prediction", "feature_contribution", "brushed_features"]);
var visible;
/* Changing order of explain predictions */
function change_order(changed_select) {
  // Hide everything
  ChangeVisibility(d3.selectAll(".top_explain").filter(".visible"), false)

  editfeature_switch = document.getElementById("myeditfeatures_onoffswitch");
  if (editfeature_switch.checked) {
    sel1 = "textarea";
  } else {
    sel1 = "brushed_features";
  }

  //sel1 = d3.select("#explain-1").node().value
  //sel2 = d3.select("#explain-2").node().value
  sel2 = "text";

  prob_switch = document.getElementById("myprobabilities_onoffswitch");

  if (prob_switch.checked) {
    sel3 = "prediction";
  } else {
    sel3 = "feature_contribution";
  }

  //sel3 = d3.select("#explain-3").node().value
  //top_divs_order[sel3] = 3
  //top_divs_order[sel2] = 2
  //top_divs_order[sel1] = 1
  //var missing = []
  //if (sel2 === sel1) {
  //  missing.push(2);
  //}
  //if (sel3 === sel1 || sel3 === sel2) {
  //  missing.push(3);
  //}
  visible = new Set([sel1, sel2, sel3])
  //while (missing.length > 0) {
  //  n = missing.pop();
  //  d = d3.selectAll(".hidden").filter(function(d, i) { return !visible.has(d);}).data()[0];
  //  visible.add(d);
  //  top_divs_order[d] = n;
  //  d3.select("#explain-" + n).node().value = d;
  //}
  ChangeVisibility(d3.selectAll(".top_explain").filter(function(d,i) {return visible.has(d);}), true);
  top_divs.sort(function(a,b) { return top_divs_order[a] > top_divs_order[b];});
  //alert("OI" + changed_select);
}
