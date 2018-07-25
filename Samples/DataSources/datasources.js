'use strict';

// Wrap everything in an anonymous function to avoid polluting the global namespace
(function () {

  $(document).ready(function () {
    tableau.extensions.initializeAsync().then(function () {
      var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
      var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
      var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

      var colors = [ 'aqua' , 'azure' , 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate', 'coral', 'crimson', 'cyan', 'fuchsia', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'indigo', 'ivory', 'khaki', 'lavender', 'lime', 'linen', 'magenta', 'maroon', 'moccasin', 'navy', 'olive', 'orange', 'orchid', 'peru', 'pink', 'plum', 'purple', 'red', 'salmon', 'sienna', 'silver', 'snow', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'white', 'yellow'];
      var grammar = '#JSGF V1.0; grammar colors; public <color> = ' + colors.join(' | ') + ' ;'

      var recognition = new SpeechRecognition();
      var speechRecognitionList = new SpeechGrammarList();
      speechRecognitionList.addFromString(grammar, 1);
      recognition.grammars = speechRecognitionList;
      //recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      var diagnostic = document.querySelector('.output');
      var bg = document.querySelector('html');
      var hints = document.querySelector('.hints');

      var colorHTML= '';
      colors.forEach(function(v, i, a){
        colorHTML += '<span style="background-color:' + v + ';"> ' + v + ' </span>';
      });
      hints.innerHTML = 'Tap/click then say a command. Try '+ colorHTML + '.';

      document.body.onclick = function() {
        recognition.start();
        console.log('Ready to receive a command.');
        
      } 

      recognition.onresult = function(event) {
        // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
        // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
        // It has a getter so it can be accessed like an array
        // The [last] returns the SpeechRecognitionResult at the last position.
        // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
        // These also have getters so they can be accessed like arrays.
        // The [0] returns the SpeechRecognitionAlternative at position 0.
        // We then return the transcript property of the SpeechRecognitionAlternative object

        var last = event.results.length - 1;
        var command = event.results[last][0].transcript;

        diagnostic.textContent = 'Result received: ' + command+ '.';
        bg.style.backgroundColor = command;

        if (command.includes("reset") && command.includes("filter")) {
          resetFilters();
        }
      }

      recognition.onspeechend = function() {
        recognition.stop();
      }

      recognition.onnomatch = function(event) {
        diagnostic.textContent = "I didn't recognise that color.";
      }

      recognition.onerror = function(event) {
        diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
      }
        
    }, function (err) {
      // Something went wrong in initialization.
      console.log('Error while Initializing: ' + err.toString());
    });
  });

  function resetFilters() {
      let promises = [];
      // To get dataSource info, first get the dashboard.
      const dashboard = tableau.extensions.dashboardContent.dashboard;

      dashboard.worksheets.forEach(function(worksheet) {
        let filters = worksheet.getFiltersAsync().then(function(filters) {
          filters.forEach(function(filter) {
            var field = filter.fieldName;
            promises.push(worksheet.clearFilterAsync(field));
            
        });
        });
      })
      Promise.all(promises).then(function(results){});
  }
})();
