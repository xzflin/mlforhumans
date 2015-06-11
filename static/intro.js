function Intro() {
options = {"enableAnimation":false,
"showNavigation": true,
"delay": -1,
"tripIndex": 0,
"showCloseBox": true,
"tripTheme" : 'black'}
var trip = new Trip([
    {
      content: 'Hello! I will walk you through the use of this visualization.',
      position:'screen-center'
    },
    {
      content: 'If you\'ve already seen this, just press ESC.',
      position:'screen-center'
    },
    {
      content: 'Hopefully, this will help you understand your machine learning algorithms better.',
      position:'screen-center'
    },
    {
      sel: $('#legend_div'),
      content: 'I will assume you have some knowledge of Machine Learning.',
      position:'screen-center'
    },
    { 
        sel : $('.onoffswitch')[0],
        content : 'This button lets you switch between the train and validation sets.',
        position: 'w'
    },
    {
        sel : $('#databin_div'),
        content : 'This is what we call the databin. <br />Each square is a data point. ',
        position: 'n',
    },
    {
        sel : $('#databin_div'),
        content : 'Hovering over a datapoint gives you some information about it.',
        position: 'n',
    },
    {
        sel : $('#databin_div'),
        content : 'Clicking on a datapoint makes it visible in the tab above.',
        position: 'n',
    },
    {
        sel : $('#selected_document'),
        content : 'Note that the selected document is highlighted.',
        position: 'e',
    },
    {
        sel : $('#databin-mid'),
        content : 'The documents are sorted by the model\'s prediction probability.',
        position: 'n',
    },
    {
        sel : $('#legend_div').find('svg').find('rect')[2],
        content : 'Clicking on this legend changes this order.',
        position: 'n',
        onTripStart : function(tripIndex) {
          ShowDatabinForClass(1);
        }
    },
    {
        sel : $('#legend_div').find('svg').find('text')[0],
        content : 'You can also group examples by their true class.',
        position: 'e',
        onTripStart : function(tripIndex) {
          ShowDatabinForClass(-1);
        }
    },
    {
        sel : $('#explain_text_div'),
        content : 'Here we show you the current example\'s text',
    },
    {
        sel : $('#explain_text_div'),
        content : 'Colored words are meant to explain why a prediction was made. <br /> If you remove all of the colored words, the prediction will change.',
    },
    {
        sel : $('#explain_text_div'),
        content : 'Grey words are words that are very infrequent in the training set. <br /> You can\'t interact with them (more on this later).',
    },
    {
        sel : $('#explain_text_div'),
        content : 'For now, try hovering on a word to see statistics about it (from the training set).',
    },
    {
        sel : $('#prediction_bar_div'),
        content : 'Here we show the prediction distribution over the classes.',
    },
    {
        sel : $('#textarea_div'),
        content : 'You can edit the current example here and click on the arrow<br /> to see how the prediction changes. <br />Note that this doesn\'t change the underlying data.',
    },
    {
        sel : $(".probabilities_onoffswitch-label")[0],
        content : 'Clicking here shows a plot of the feature contributions to the prediction. <br />For now, we are using bag-of-words. ',
        position:'w',
        onTripStart : function(tripIndex) {
          $("#myprobabilities_onoffswitch")[0].checked = false;
          change_order(3);
        }
    },
    {
        sel : $(".editfeatures_onoffswitch")[0],
        content : 'Clicking here shows you the "active features"',
        position:'e',
        onTripStart : function(tripIndex) {
          $("#myeditfeatures_onoffswitch")[0].checked = false;
          change_order(1);
        }
    },
    {
        sel : $(".editfeatures_onoffswitch")[0],
        content : 'Click on any word in the middle or on the right to make it active.',
        position:'e',
    },
    {
        sel : $(".editfeatures_onoffswitch")[0],
        content : 'Notice how the documents that contain the current selection of words<br /> are highlighted in the databin.',
        position:'e',
    },
    {
      content: 'So far, we have been looking at explanations for individual predictions.',
      position:'screen-center'
    },
    {
      sel: $("#top_part_options_div").find("button")[0],
      content: 'Which correspond to this button',
      position:'e'
    },
    {
      sel: $("#top_part_options_div").find("button")[1],
      content: 'Now this lets us see global statistics for the whole dataset',
      position:'e',
      onTripStart : function(tripIndex) {
        tab_change_statistics();
      }
    },
    {
      sel: $(".confusion_matrix")[0],
      content: 'Note that you can click on the cells of the confusion matrix<br /> to highlight the corresponding documents in the databin.',
      position:'e',
    },
    {
      sel: $("#top_part_options_div").find("button")[2],
      content: 'Finally, let\'s take a look at interacting with the model.',
      position:'e',
      onTripStart : function(tripIndex) {
        tab_change_feedback();
      }
    },
    {
      sel: $("#top_part_options_div").find("button")[2],
      content: 'This tab lets you do search-and-replace on the underlying data.',
      position:'e',
    },
    {
      sel: $("#feedback_from"),
      content: 'Here you type a regular expression to search for. I\'ve added one for you.',
      position:'e',
      onTripStart : function(tripIndex) {
        $("#feedback_from").val("The Internet");
      }
    },
    {
      sel: $("#feedback_textarea_div").find("button")[0],
      content: 'This button applies the search function.<br /> Notice how the examples that match the regex are highlighted in the databin. ',
      position:'s',
      onTripStart : function(tripIndex) {
        apply_regex();
      }
    },
    {
      sel: $("#feedback_textarea_div").find("button")[0],
      content: 'So far, we haven\'t changed the underlying data yet.',
      position:'s',
    },
    {
      sel: $("#feedback_to"),
      content: 'Here you add the replacement text',
      position:'e',
      onTripStart : function(tripIndex) {
        $("#feedback_to").val("The Web");
      }
    },
    {
      sel: $("#feedback_textarea_div").find("button")[1],
      content: 'This saves the regex. We still haven\'t applied it to the data.',
      position:'e',
      onTripStart : function(tripIndex) {
        save_regex()
      }
    },
    {
      sel: $("#feedback_textarea_div").find("button")[1],
      content: 'Since changing the dataset could take time, we let you bundle all of your regexes first.',
      position:'e',
    },
    {
      sel: $("#feedback_active_div").find("button")[0],
      content: 'Clicking here applies the regex. This could take a little while.',
      position:'w',
      onTripStart : function(tripIndex) {
        RunRegex();
      }
    },
    {
      sel: $("#feedback_text_div"),
      content: 'Done! Notice how the underlying data has changed.',
      position:'w',
    },
    {
      content: 'This is it! I hope you have fun =]',
      position:'screen-center',
    },

        // onTripStart : function(tripIndex) {
        //   ShowDatabinForClass(-1);
        // }


], options); // details about options are listed below
trip.start();
}

