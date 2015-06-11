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
        SetupDatabin();
        prediction_bars = new PredictionProbabilities("#prediction_bar", classes, top_divs_width, 225, 17, 90, 5);
        word_tooltip = new Tooltip("#hovercard", classes, 265, 17, 90, 5, 5, feature_attributes);
        global_statistics = new GlobalStatistics("#statistics_div", ".top_statistics", classes, top_part_height, 285, 17, 90, 5, max_docs);
        global_statistics.DrawStatistics("Validation", test_statistics, test_statistics.confusion_matrix);

        ReSetupDatabin();
        GetPredictionAndShowExample(current_docs[selected_document].features, current_docs[selected_document].true_class);
        ShowFeedbackExample(current_docs[0]);
        ChangeVisibility(d3.selectAll(".top_statistics"), false);
        ChangeVisibility(d3.selectAll(".top_feedback"), false);
        ChangeVisibility(d3.select("#explain_selections"), true);
        change_order(1);
        GetPredictionAndShowExample(current_docs[selected_document].features, current_docs[selected_document].true_class);
        StopLoading();
        Intro();
      }
  };
xhr.send();
}

LoadJson()

function NotInTrain(feature) {
  return typeof feature_attributes[feature] == 'undefined';
}
function FeatureColor(feature) {
  if (NotInTrain(feature)) {
    return "rgba(0, 0, 0, 0.35)";
  }
  else {
    return "rgba(0, 0, 0, 0.85)";
  }
}

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
          ShowWeights(current_object);
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
          FeatureBrushing(current_feature_brush, true)
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

var explain_text_div = d3.select("#explain_text_div");
var explain_features_div = d3.select("#explain_features_div");
var height = "50%";

function ToggleFeatureBrush(w) {
  // OOV words are ignored
  if (typeof feature_attributes[w.feature] == 'undefined') {
    return;
  }
  if (selected_features.has(w.feature)) {
    selected_features.delete(w.feature);
  } 
  else {
    selected_features.add(w.feature);
  }
  sel_list = []
  selected_features.forEach(function(d) {sel_list.push(d);})
  FeatureBrushing(sel_list, false);
}
function ToggleFeatureBrushAndRedraw(ex, word) {
  ToggleFeatureBrush(word);
  ShowExample(ex);
  explain_text_div.selectAll("span")
      .style("text-decoration", function(d,i) { return selected_features.has(d.feature) ? "underline" : "none";})
  explain_features_div.select("svg")
    .selectAll(".labels")
    .style("text-decoration", function(d) { return selected_features.has(d.feature) ? "underline" : "none";});
  
}

function ShowWeights(ex) {
  var data = ex.sorted_weights;
  var n_bars = data.length;
  var bar_height = 19;
  var total_height = (bar_height + 10) * n_bars;
  var x_offset = 80;
  var right_x_offset = 40;
  var xscale = d3.scale.linear()
          .domain([0,1])
          .range([0,top_divs_width-x_offset - right_x_offset]);

  var yscale = d3.scale.linear()
          .domain([0, n_bars])
          .range([0,total_height]);

  // TODO make this axis appropriate (stop using axis), make it clickable
  // var yAxis = d3.svg.axis();
  //     yAxis
  //       .orient('left')
  //       .scale(yscale)
  //       .tickSize(2)
  //       .tickFormat(function(d,i){ return i == 0 ? "" :  data[i - 1].feature })
  //       .tickValues(d3.range(0,n_bars + 1));
  var canvas;
  var chart;
  var y_xis;
  var line;
  if (explain_features_div.select("svg").empty()) {
    canvas = explain_features_div.append("svg").attr({'width':'100%','height': (total_height + 10) + "px"});
    chart = canvas.append('g')
              .attr("transform", "translate(" + x_offset+ ",0)")
              .attr('id','bars');
    line = canvas.append("line").attr("x1", x_offset).attr("x2", x_offset).attr("y1", bar_height).style("stroke-width",2).style("stroke", "black");
    // y_xis = canvas.append('g')
    //           .attr("transform", "translate(80, 0)")
    //           .attr('id','yaxis')
    //           .call(yAxis);
  }
  else {
  // This is a transition
    canvas = explain_features_div.select("svg").attr('height', total_height + 10);
    chart = canvas.select('#bars');
    line = canvas.select("line");
    // canvas.select("#yaxis").transition().duration(1000).call(yAxis);
    //canvas.transition().delay(1000).each("end", function (){canvas.select("#yaxis").transition().duration(1000).call(yAxis)});
    //return;
    //y_xis = canvas.select("#yaxis").transition().delay(3000).call(yAxis);
  }
  line.transition().duration(1000).attr("y2", Math.max(bar_height, total_height - 10 + bar_height));
  //line.transition().
  labels = canvas.selectAll(".labels").data(data)
  labels.enter().append('text')
  labels.attr('x', x_offset - 2)
        .attr('y', function(d, i) { return yscale(i) + bar_height + 14})
        .attr('text-anchor', 'end')
        .style("fill", function(d) {return FeatureColor(d.feature);})
        .classed("labels", true)
        .on("mouseover", function(d) { word_tooltip.ShowFeatureTooltip(d);})
        .on("mouseout", function() {word_tooltip.HideFeatureTooltip();})
        .on("click", function(d) {ToggleFeatureBrushAndRedraw(ex, d)})
        .text(function(d) {return d.feature;});
  labels.exit().remove();
  bars = chart.selectAll('rect').data(data)
  bars.enter().append('rect')
  bars.on("mouseover", function(d) { word_tooltip.ShowFeatureTooltip(d);})
      .on("mouseout", function() {word_tooltip.HideFeatureTooltip();})
      .attr('height',bar_height)
      .attr({'x':0,'y':function(d,i){ return yscale(i)+bar_height; }})
      .attr('width', 0)
      .style('fill',function(d,i){ return class_colors_i(d.class); })
      .on("click", function(d) {ToggleFeatureBrushAndRedraw(ex, d)});
  bars.transition().duration(1000)
      .attr('width',function(d){ return xscale(d.weight); })
      .style('fill',function(d,i){ return class_colors_i(d.class); })
  bars.exit().transition().duration(1000).attr('width', 0).remove();
  // TODO: make hover work on this maybe
  var bartext = canvas.select("#bars").selectAll("text").data(data)
  bartext.enter()
         .append('text')
         .attr({'x':function(d) {return xscale(d.weight) + 5; },'y':function(d,i){ return yscale(i)+35; }})
  bartext.transition().duration(1000).
    text(function (d) {return d.weight.toFixed(2);})
    .attr({'x':function(d) {return xscale(d.weight) + 5; },'y':function(d,i){ return yscale(i)+35; }})
  bartext.exit().transition().remove();
  // Updating the textarea
  current_text = _.map(ex.features, function(x) {return x.feature;}).join(" ")
  d3.select("#textarea_explain").node().value = current_text;

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
  var text = explain_text_div.selectAll("span").data(ex.features);
  text.enter().append("span");
  text.html(function (d,i) {return d.feature != "\n" ? d.feature + " " : "<br />"; })
      .style("color", function(d, i) {
        var w = 20;
        var color_thresh = 0.02;
        if (d.weight > color_thresh) {
          color = class_colors_i(d.class);
          return color;
        }
        else {
          return FeatureColor(d.feature);
        }
      })
      .style("font-size", function(d,i) {return size(Math.abs(d.weight))+"px";})
      .style("text-decoration", function(d,i) { return selected_features.has(d.feature) ? "underline" : "none";})
      .on("mouseover", function(d) { word_tooltip.ShowFeatureTooltip(d);})
      .on("mouseout", function() {word_tooltip.HideFeatureTooltip();})
      .on("click", function(d) {ToggleFeatureBrushAndRedraw(ex, d)});

  // TODO:
  // do the remove first, then the add for smoothness
  //text.exit().transition().duration(1000).style("opacity", 0).remove();
  text.exit().remove();
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


var databin_height;
var databin_n_bins;
var square_size;
var initial_square_size = 6;
var real_square_size;
var bin_width;
var selected_document;
var databin_width;
var hist_margin, hist_width, hist_height;
var svg_hist, hist_tooltip;
var hist_data;
var dots;
var xValue, databin_x_scale, xMap, xAxis, yValue, yScale, yMap, yAxis;
var refLineFunction;
var databin_y_divisor;
var max_neg_bin;
var max_pos_bin;
var space_below;
var space_above;
var bin_width_per_nbins = Object();
var max_top_per_nbins = Object();
var max_bottom_per_nbins = Object();
var max_top_with_40;
var max_bottom_with_40;
var bin_width_sort_by_class;
function DatabinMaxMinAndDivisor() {

 max_neg_bin = Math.ceil(Math.max((1 - train_statistics.accuracy) * train_docs.length, (1 - test_statistics.accuracy) * test_docs.length));
 //var max_pos_bin = Math.ceil(Math.max(train_statistics.accuracy * train_docs.length, test_statistics.accuracy * test_docs.length));
 //var max_in_a_bin = max_neg_bin + max_pos_bin;
 var squares_in_height = Math.floor(hist_height / real_square_size);
 // - 2 accounts for incomplete lines
 //var bin_square_width = Math.ceil(max_in_a_bin/ (squares_in_height - 2));
 var space_between_bins = 2;
 var bin_square_width = Math.min(Math.floor((hist_width / class_names.length) / real_square_size) - space_between_bins, 40);
 //bin_width = 20;
 bin_width_sort_by_class = bin_square_width;
 rows_below = Math.max(7, Math.ceil(max_neg_bin / bin_square_width))
 databin_y_divisor = hist_height - rows_below * real_square_size;
 space_below = rows_below * real_square_size;
 space_above = hist_height - space_below - 1;
 for (var i = 1; i <= 12; i++) {
   bin_width_per_nbins[i] = Math.floor((hist_width / i) / real_square_size) - space_between_bins
   max_bottom_per_nbins[i] = (space_below / real_square_size) * bin_width_per_nbins[i];
   max_top_per_nbins[i] = (space_above / real_square_size - 1) * bin_width_per_nbins[i];
 }
 max_top_with_40 = (space_above / real_square_size) * 40;
 max_bottom_with_40 = (space_below / real_square_size) * 40;

 // TODO: think about this a little better
 databin_n_bins = Math.floor(hist_width / ((bin_square_width + space_between_bins) * real_square_size))
 databin_n_bins = databin_n_bins - databin_n_bins % 2;
 if (svg_hist.select("#xaxis").empty()) {
   svg_hist.append("line").attr("id", "xaxis")
 }
 var refLine = svg_hist.select("#xaxis")
     .attr("stroke", "black")
     .attr("stroke-width", 1)
     .attr("x1", 0)
     .attr("x2", hist_width)
     .attr("y1", databin_y_divisor - 0.5)
     .attr("y2", databin_y_divisor - 0.5);

}

function SetupDatabin() {
  top_options_height = parseInt(d3.select("#top_part_options_div").style("height"))
  div_height = parseInt(d3.select("body").style("height")) - (top_part_height + legend_height + 5 + 5 + top_options_height);
  div_width = parseInt(d3.select("#databin_div").style("width"));
  n_bins = 4;
  bin_width = 12;
  square_size = 6;
  real_square_size = square_size + 1;
  selected_document = 0;
  hist_margin = {top: 0, right: 10, bottom: 20, left: 10};
  hist_width = div_width - hist_margin.left - hist_margin.right;
  hist_height = div_height - hist_margin.top - hist_margin.bottom;
  databin_x_scale = d3.scale.linear().range([0, hist_width]); // value -> display
  svg_hist = d3.select("#databin_div").append("svg")
      .attr("width", div_width)
      .attr("height", div_height)
      .append("g")
      .attr("transform", "translate(" + hist_margin.left + "," + hist_margin.top + ")");
  // add the hist_tooltip area to the webpage
  hist_tooltip = d3.select("body").append("div")
      .attr("class", "hist_tooltip")
      .style("opacity", 0);
  // Draw x-axis label
  svg_hist.append("text")
      .text("P(" + class_names[1] + " | example), given by the model")
      .attr("x", function (d) {return hist_width / 2 - this.getComputedTextLength() / 2;})
      .attr("y", div_height -25)
      .attr("id", "hist_xaxis")
      .style("font-size", "14px")
      .style("font-weight", "bold")
  svg_hist.append("text")
      .text("Examples above the horizontal axis are classified correctly.")
      .attr("x", function (d) {return hist_width / 2 - this.getComputedTextLength() / 2;})
      .attr("y", div_height-10)
      .style("font-size", "14px")
      .style("font-weight", "bold")
  svg_hist.append("text")
      .text("0.5")
      .attr("id", "databin-mid")
      .attr("x", function (d) {return hist_width / 2 - this.getComputedTextLength() / 2;})
      .attr("y", div_height-40)
      .style("font-size", "14px")
      .style("opacity", 0.8)
  //svg_hist.append("text")
  //    .attr("x", 0)
  //    .attr("y", hist_height-45)
  //    .style("font-size", "14px")
  //    .text("0.0")
  //svg_hist.append("text")
  //    .text("1.0")
  //    .attr("x", function (d) {return hist_width - this.getComputedTextLength() / 2;})
  //    .attr("y", hist_height-45)
  //    .style("font-size", "14px")
 // add a reference line
 // var refLine = svg_hist.append("path")
 //     .attr("id", "ymiddle")
 //     .attr("stroke", "black")
 //     .attr("stroke-width", 0.8)
 //     .attr("stroke-dasharray", "5,5")
 //     .attr("fill", "none");
 // add a zero line
}


var on_click_document = function(d) {
    selected_document = d.doc_id;
    current = d.doc_id;
    GetPredictionAndShowExample(d.features, d.true_class);
    ShowFeedbackExample(current_docs[selected_document]);
}

function set_doc_ids(docs) {
    for (var i=0; i<docs.length; i++) {
        docs[i].doc_id = i;
    }
}
function binaryIndexOf(searchElement) {
    'use strict';
 
    var minIndex = 0;
    var maxIndex = this.length - 1;
    var currentIndex;
    var currentElement;
    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = this[currentIndex];
 
        if (currentElement < searchElement) {
            minIndex = currentIndex + 1;
        }
        else if (currentElement > searchElement) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }
    return currentIndex;
}

function map_examples_to_bin(docs, focus_class) {
  var n_bins;
  var sorted_correct, sorted_wrong;
  if (focus_class === -1) {
    databin_n_bins = class_names.length;
    n_bins = databin_n_bins;
    bin_width = bin_width_sort_by_class;
    sorted_correct = _.map(_.filter(docs, function(d) {return d.true_class === d.prediction;}), function(d) { return d.true_class / n_bins;}).sort();
    sorted_wrong = _.map(_.filter(docs, function(d) {return d.true_class !== d.prediction;}), function(d) { return d.true_class / n_bins;}).sort();
  }
  else {
    n_bins = 12;
    sorted_correct = _.map(_.filter(docs, function(d) {return d.true_class === d.prediction;}), function(d) { return d.predict_proba[focus_class];}).sort();
    sorted_wrong = _.map(_.filter(docs, function(d) {return d.true_class !== d.prediction;}), function(d) { return d.predict_proba[focus_class];}).sort();
  }
  if (square_size < initial_square_size) {
    square_size = initial_square_size;
    real_square_size = square_size + 1;
    dots.attr("width", square_size).attr("height", square_size);
    DatabinMaxMinAndDivisor();

  }
  reduce_nbins = true;
  bin_size_40 = true;
  while (reduce_nbins) {
    reduce_nbins = false;
    previous_correct_index = 0;
    previous_wrong_index = 0;
    for (var i = 1; i <= n_bins; ++i) {
      correct_in_bin = binaryIndexOf.call(sorted_correct, i / n_bins - 0.000000000001) - previous_correct_index + 1;
      wrong_in_bin = binaryIndexOf.call(sorted_wrong, i / n_bins - 0.000000000001) - previous_wrong_index + 1;
      previous_correct_index += correct_in_bin - 1
      previous_wrong_index += wrong_in_bin - 1
      if (correct_in_bin > max_top_per_nbins[n_bins] || wrong_in_bin > max_bottom_per_nbins[n_bins]) {
        bin_size_40 = true;
        reduce_nbins = true;
        n_bins -= 2;
        if (n_bins === 0 || focus_class === -1) {
          square_size -= 1;
          real_square_size = square_size + 1;
          dots.attr("width", square_size).attr("height", square_size);
          n_bins = focus_class === -1 ? class_names.length : 12;
          DatabinMaxMinAndDivisor();
        }
        break;
      }
      if (correct_in_bin > max_top_with_40|| wrong_in_bin > max_bottom_with_40) {
        bin_size_40 = false;
      }
    }
  }
  bin_width = bin_size_40 ? Math.min(40, bin_width_per_nbins[n_bins]) : bin_width_per_nbins[n_bins];
  databin_n_bins = n_bins;
  var correct_bin_index = [];
  var incorrect_bin_index = [];
  for (var i=0; i<n_bins; i++) {
      correct_bin_index[i] = 0;
      incorrect_bin_index[i] = 0;
  }
  for (var i=0; i<docs.length; i++) {
    var pred = focus_class === -1 ? docs[i].true_class / n_bins : docs[i].predict_proba[focus_class];
    docs[i].pred_bin = Math.floor(pred* n_bins);
    if (docs[i].pred_bin >= n_bins) {
        docs[i].pred_bin -= 1;
    }
    var bin = docs[i].pred_bin;
    var correct = docs[i].prediction === docs[i].true_class;
    if (correct) {
      docs[i].bin_x = correct_bin_index[bin] % bin_width;
      docs[i].bin_y = Math.floor(correct_bin_index[bin] / bin_width);
      correct_bin_index[bin] += 1;
      docs[i].mistake = false;
    }
    else {
      docs[i].mistake = true;
      docs[i].bin_x = incorrect_bin_index[bin] % bin_width;
      docs[i].bin_y = Math.floor(incorrect_bin_index[bin] / bin_width) + 1;
      incorrect_bin_index[bin] += 1;
    }
  }
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
  AssignDots(svg_hist, current_docs);
  GetPredictionAndShowExample(current_docs[0].features, current_docs[0].true_class);
  ShowFeedbackExample(current_docs[selected_document]);
  ShowDatabinForClass(-1);
  if (tab_mode === 'explain') {
    FeatureBrushing(current_feature_brush, true);
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

function AssignDots(svg_obj, docs) {
  dots = svg_obj.selectAll(".hist_dot")
      .data(docs)
  dots.enter().append("rect")
      .attr("class", "hist_dot")
      .attr("width", square_size)
      .attr("height", square_size)
  dots.exit().remove();
  dots.style("stroke", "black")
      .style("stroke-opacity", 1)
      .style("stroke-width", function(d) { return d.doc_id === selected_document ? 2.0 : 0})
      .style("fill", function(d) { return class_colors_i(d.true_class);})
      .style("opacity", 0.4)
      .attr("id", function(d, i) {return d.doc_id === selected_document ? "selected_document" : "";});

  // focus_class = current_focus_class;
  // n_bins = focus_class === -1 ? class_names.length : databin_n_bins;
  // // Figure out which examples go in which bins
  // map_examples_to_bin(docs, focus_class);
}
function ReSetupDatabin() {
  
  // Initialize the document IDs
 set_doc_ids(train_docs);
 set_doc_ids(test_docs);
 DatabinMaxMinAndDivisor();
  // Draw title
  //svg_hist.append("text")
  //    .attr("x", hist_width/2-200)
  //    .attr("y", 50)
  //    .style("font-size", "16px")
  //    .style("font-weight", "bold")
  //    .text("Overall Model Performance. Held-out accuracy: " + test_accuracy)


 AssignDots(svg_hist, current_docs);
 ShowDatabinForClass(current_focus_class);
}



function ShowDatabinForClass(focus_class) {
  // Figure out which examples go in which bins
  if (focus_class === -1) {
    svg_hist.select("#hist_xaxis")
    .text("Documents grouped by true class.")
    svg_hist.select("#databin-mid").style("opacity", 0);
    n_bins = class_names.length;
  }
  else {
    svg_hist.select("#hist_xaxis")
    .text("P(" + class_names[focus_class] + " | example), given by the model")
    svg_hist.select("#databin-mid").style("opacity", 0.8);
    n_bins = databin_n_bins;
  }
  map_examples_to_bin(current_docs, focus_class);
  n_bins = databin_n_bins;
  // Then map them to an actual x/y position within [0, 1]
  databin_x_scale.domain([0, n_bins]);
  var baseline = databin_y_divisor;
  dots.transition().duration(1000)
       .attr("x", function(d) {
         return databin_x_scale(d.pred_bin) + (real_square_size) * d.bin_x;
       })
       .attr("y", function(d) {
         mult = d.mistake ? 1 : -1;
         return baseline + mult * (d.bin_y * real_square_size + 1) - real_square_size;
       })

  svg_hist.select("#xaxis").transition().duration(1000).attr("x2", databin_x_scale(n_bins-1) + bin_width * real_square_size);
  d3.select("#selected_document").moveToFront();

  dots.on("mouseover", function(d) {
          var xPosition = parseFloat(d3.select(this).attr("x"));
          var yPosition = parseFloat(d3.select(this).attr("y"));

          // Change the style of the square
          d3.select(this)
              .attr("height", square_size + 10)
              .attr("width", square_size + 10)
              .attr("x", xPosition-square_size)
              .attr("y", yPosition-square_size)
              //.style("opacity", 1.0)

          hist_tooltip.transition()
              .duration(200)
              .style("opacity", .9)
              .attr("fill", "rgb(255, 255, 255)");

          var s = "Document ID: " + d.doc_id + "<br />True class: ";
          s += class_names[d.true_class];
          s += "<br/>Prediction: ";
          s += class_names[d.prediction];
          if (focus_class !== -1) {
            s += "<br /> P(" + class_names[focus_class] + ") = ";
            s += + d.predict_proba[focus_class].toFixed(2);
          }
          hist_tooltip.html(s)
              //"Document ID: " + d.doc_id + "<br />True class: " + d.true_class + "<br/>Prediction: " + d.prediction)
              .style("left", d3.event.pageX + 205 < d3.select("body").node().getBoundingClientRect().width ? (d3.event.pageX + 5) + "px" : d3.event.pageX - 205)
              .style("top", (d3.event.pageY - 70) + "px");
      })
      .on("mouseout", function(d) {
          var xPosition = parseFloat(d3.select(this).attr("x"));
          var yPosition = parseFloat(d3.select(this).attr("y"));

          d3.select(this)
              .attr("height", square_size)
              .attr("width", square_size)
              .attr("dx", 0.1)
              .attr("x", xPosition+square_size)
              .attr("y", yPosition+square_size)
              //.style("opacity", function(d){return d.doc_id == selected_document ? 1.0 : 0.4});

          hist_tooltip.transition()
              .duration(500)
              .style("opacity", 0);
      })
      .on("click", function(d) {
          dots.style("stroke-width", 0);
          d3.select(this)
              .transition().delay(0.1)
              .style("stroke-width", 2)
              .style("stroke-alignment", "inner")
              .style("stroke-opacity", 1)
              .attr("id", "selected_document");
          d3.select(this).moveToFront();

          on_click_document(d);
      });


  // TODO: This is still weird, I think it's kinda wrong.
  //var refLineData = [ {"bin_x": 0.5, "bin_y":-0.03}, {"bin_x":0.5, "bin_y":0.3}];
  //svg_hist.select("#ymiddle")
  //   .attr("d", refLineFunction(refLineData))
  // var refLineData = [ {"bin_x": 0, "bin_y":-0.005}, {"bin_x":0.988, "bin_y":-0.005}];
  // svg_hist.select("#xaxis")
  //    .attr("d", refLineFunction(refLineData))
}
function BrushExamples(example_set) {
  dots.transition().style("opacity", function(d){
    return example_set.has(d.doc_id) ? 1 : 0.4;});
}
function InstantBrushExamples(example_set) {
  dots.style("opacity", function(d){
    return example_set.has(d.doc_id) ? 1 : 0.4;});
}

function update_brushed_features(feature_list) {
  d3.select("#feature_brush_div").selectAll(".active_features").remove();
  saved = d3.select("#feature_brush_div").selectAll(".active_features").data(feature_list)
  zs = saved.enter().append("span")
  zs.classed("active_features", true);
  ps = zs.append("span");
  ps.classed('active_text', true)
    .html(function(d,i) { return '&nbsp;&nbsp;' +  d + '&nbsp;&nbsp;'})
  xs = zs
       .append("span")
       .html("&#10799;<br />")
       .on("click", function(d,i) {
          var feature = Object()
          feature.feature = current_feature_brush.splice(i, 1)[0];
          ToggleFeatureBrushAndRedraw(current_object, feature);
        });
  xs.style("color", "red");
  saved.exit().remove();
}

function FeatureBrushing(feature_list, instant) {
  current_feature_brush = feature_list;
  docs = [];
  //d3.select("#feature_brush_div").html("Features being brushed: <br />" + feature_list.join("<br />"))
  update_brushed_features(feature_list);
  if (feature_list.length > 1) {
    docs = _.intersection.apply(this, _.map(feature_list, function (d) {return current_train ? feature_attributes[d].train_docs : feature_attributes[d].test_docs;}));
  } else {
    if (feature_list.length != 0) {
      docs = current_train ? feature_attributes[feature_list[0]].train_docs : feature_attributes[feature_list[0]].test_docs;
    }
  }
  docs = new Set(_.map(docs, function(d) { return +d;}))
  if (instant) {
    InstantBrushExamples(docs);
  }
  else {
    BrushExamples(docs);
  }
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
    .on("click", function() { ShowDatabinForClass(-1)});

  legend = svg_legend.selectAll(".legend_stuff").data(class_names).enter()
  legend.append("text")
    .attr("x", function(d, i) { return legend_x + 30 + (i % elements_per_line) *140;})
    .attr("y", function(d, i) { return legend_y + 20 + Math.floor(i / elements_per_line) * 15; })
    .style("font-size", "14px")
    .on("click", function(d) { ShowDatabinForClass(class_names.indexOf(d)); })
    .text(function(d) { return d;});
  legend.append("rect")
    .attr("x", function(d, i) { return legend_x + 15 + (i % elements_per_line) *140;})
    .attr("y", function(d, i) { return legend_y + 10 + Math.floor(i / elements_per_line) * 15; })
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", function(d) {return class_colors(d);})
    .on("click", function(d) { ShowDatabinForClass(class_names.indexOf(d)); });
  svg_legend.append("rect")
      .attr("x", legend_x)
      .attr("y", legend_y)
      .attr("width", 15 + Math.min(n_classes, elements_per_line) * 140 + 10)
      .attr("height", 15 * lines + 15)
      .style("stroke", "#86a36e")
      .style("fill", "none");
}

/* Confusion Matrix brushing */
var current_brush = [-1, -1];
function BrushOnMatrix(true_label, predicted_label) {
  docs = [];
  if (true_label !== current_brush[0] || predicted_label !== current_brush[1]) {
    docs = _.filter(current_docs, function (d) {return d.prediction === predicted_label && d.true_class === true_label; })
    current_brush = [true_label, predicted_label];
  }
  else {
    current_brush = [-1, -1];
  }
  docs = new Set(_.map(docs, function(d) {return d.doc_id;}));
  BrushExamples(docs);
}

/* */

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
