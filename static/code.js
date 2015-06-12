var train_docs, test_docs, feature_attributes;
var train_statistics, test_statistics;
var current_object;
var max_docs;
var top_part_height;
var top_divs_width;
var is_loading = true;
var current_docs;
var confusion_matrix;
var current_train = false;
var prediction_bars;
var word_tooltip;
var global_statistics;
var classes;
var explained_text;
var feature_contributions;
var brushed_features;
var databin;
var feedback;

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
        feature_attributes = new FeatureAttributes(json.feature_attributes);
        classes = new Classes(json.class_names, 17);
        // TODO: this only works for at most 20 classes. I don't know if we should
        // worry about this though - if you have more than 20, color is not going to
        // work anyway
        top_part_height = parseInt(d3.select("#explain_text_div").style("height")) + parseInt(d3.select("#top_part_options_div").style("height"));
        top_divs_width = parseInt(d3.select("#explain_text_div").style("width"));
        DrawLegend();

        top_options_height = parseInt(d3.select("#top_part_options_div").style("height"))
        div_height = parseInt(d3.select("body").style("height")) - (top_part_height + legend_height + 5 + 5 + top_options_height);
        prediction_bars = new PredictionProbabilities("#prediction_bar", classes, top_divs_width, 225, 17, 90, 5);
        word_tooltip = new Tooltip("#hovercard", classes, 265, 17, 90, 5, 5, feature_attributes);
        databin = new Databin("#databin_div", div_height, classes);
        databin.NewDataset(train_docs, test_docs, train_statistics, test_statistics);
        global_statistics = new GlobalStatistics("#statistics_div", ".top_statistics", classes, top_part_height, 285, 17, 90, 5, max_docs, databin);
        global_statistics.DrawStatistics("Validation", test_statistics, test_statistics.confusion_matrix);
        brushed_features = new BrushedFeatures("#feature_brush_div", feature_attributes, databin); 
        explained_text = new ExplainedText("#explain_text_div", classes, feature_attributes, brushed_features, word_tooltip);
        feature_contributions = new FeatureContributions("#explain_features_div", top_divs_width, 19, 80, 40, classes, feature_attributes, brushed_features, word_tooltip);
        brushed_features.UpdateObjects(explained_text, feature_contributions);
        feedback = new Feedback("#feedback_text_div", "#feedback_from", "#feedback_to", "#feedback_active_div", databin);
        databin.AddFeedback(feedback);

        ChangeVisibility(d3.selectAll(".top_statistics"), false);
        ChangeVisibility(d3.selectAll(".top_feedback"), false);
        ChangeVisibility(d3.select("#explain_selections"), true);
        change_order(1);
        feedback.ShowExample(current_docs[0]);
        //ShowFeedbackExample(current_docs[0]);
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
  feedback.GetRegexResults();
}
function save_regex() {
  feedback.SaveRegex();
}

// TODO
function RunRegex() {
  StartLoading(200);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:8870/run_regex');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
      if (xhr.status === 200) {
          json = JSON.parse(xhr.responseText);
          train_docs = json.train;
          test_docs = json.test;
          train_statistics = json.statistics.train;
          test_statistics = json.statistics.test;
          if (current_train) {
            global_statistics.DrawStatistics("Train", train_statistics, train_statistics.confusion_matrix)
            current_docs = train;
          }
          else {
            global_statistics.DrawStatistics("Validation", test_statistics, test_statistics.confusion_matrix)
            current_docs = test_docs;
          }
          feature_attributes.SetFeatureAttributes(json.feature_attributes);
          explained_text.SetFeatureAttributes(feature_attributes);
          brushed_features.SetFeatureAttributes(feature_attributes);
          databin.NewDataset(train_docs, test_docs, train_statistics, test_statistics);
          GetPredictionAndShowExample(current_docs[databin.SelectedDocument()].features, current_docs[databin.SelectedDocument()].true_class);
          feedback.ShowExample(current_docs[databin.SelectedDocument()]);
          StopLoading();
      }
  };
//xhr.send();
xhr.send(JSON.stringify({
    regex: feedback.GetSavedRegex()
}));
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
  feedback.ChangeDataset(current_train);
  brushed_features.ChangeDataset(current_train);
  //AssignDots(svg_hist, current_docs);
  GetPredictionAndShowExample(current_docs[0].features, current_docs[0].true_class);
  feedback.ShowExample(current_docs[0]);
  //ShowFeedbackExample(current_docs[0]);
  //ShowDatabinForClass(-1);
  if (tab_mode === 'explain') {
    brushed_features.UpdateBrushes(true);
  }
  else if (tab_mode === 'feedback') {
    feedback.Brush(true);  
  }
}

var tab_mode = "explain";
function tab_change_explain() {
  tab_mode = "explain";

  ChangeVisibility(d3.selectAll(".top_statistics"), false);
  ChangeVisibility(d3.selectAll(".top_feedback"), false);
  ChangeVisibility(d3.select("#explain_selections"), true);
  change_order(1);
  GetPredictionAndShowExample(current_docs[databin.SelectedDocument()].features, current_docs[databin.SelectedDocument()].true_class);
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
  feedback.ShowExample(current_docs[databin.SelectedDocument()]);
}

var legend_height;
function DrawLegend() {
  var n_classes = classes.names.length;
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

  legend = svg_legend.selectAll(".legend_stuff").data(classes.names).enter()
  legend.append("text")
    .attr("x", function(d, i) { return legend_x + 30 + (i % elements_per_line) *140;})
    .attr("y", function(d, i) { return legend_y + 20 + Math.floor(i / elements_per_line) * 15; })
    .style("font-size", "14px")
    .on("click", function(d) { databin.ShowForClass(classes.names.indexOf(d)); })
    .text(function(d) { return d;});
  legend.append("rect")
    .attr("x", function(d, i) { return legend_x + 15 + (i % elements_per_line) *140;})
    .attr("y", function(d, i) { return legend_y + 10 + Math.floor(i / elements_per_line) * 15; })
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", function(d) {return classes.colors(d);})
    .on("click", function(d) { databin.ShowForClass(classes.names.indexOf(d)); });
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

  sel2 = "text";

  prob_switch = document.getElementById("myprobabilities_onoffswitch");

  if (prob_switch.checked) {
    sel3 = "prediction";
  } else {
    sel3 = "feature_contribution";
  }
  visible = new Set([sel1, sel2, sel3])
  ChangeVisibility(d3.selectAll(".top_explain").filter(function(d,i) {return visible.has(d);}), true);
  top_divs.sort(function(a,b) { return top_divs_order[a] > top_divs_order[b];});
}
