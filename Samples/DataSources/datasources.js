'use strict';

// Wrap everything in an anonymous function to avoid polluting the global namespace
(function () {

  $(document).ready(function () {
    tableau.extensions.initializeAsync().then(function () {
      var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
      var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
      var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

      var commands = [ 'reset filters' , 'filter by <filter name> <filter item>' , 'go to <sheet name>', 'show caption', 'view data'];
      var grammar = '#JSGF V1.0; grammar commands; public <command> = ' + commands.join(' | ') + ' ;'

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

      var commandHTML= '';
      commands.forEach(function(v, i, a){
        commandHTML += '<span style="background-command:' + v + ';"> ' + v + ' </span>';
      });
      hints.innerHTML = 'Click, then say a command to affect the dashboard';

      document.body.onclick = function() {
        recognition.start();
        console.log('Ready to receive a command.');
        diagnostic.textContent = "Recording";
        diagnostic.style.color = "red";
        
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
        //bg.style.backgroundcommand = command;

        if (command.includes("reset") && command.includes("filter")) {
          resetFilters();
        }
        else if (command.includes("select") || command.includes("remove")) {
          filterBy(command);
        }
      }

      recognition.onspeechend = function() {
        recognition.stop();
        diagnostic.style.color = "black";
      }

      recognition.onnomatch = function(event) {
        diagnostic.textContent = "I didn't recognise that command.";
      }

      recognition.onerror = function(event) {
        diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
      }
        
    }, function (err) {
      // Something went wrong in initialization.
      console.log('Error while Initializing: ' + err.toString());
    });
  });

  function speak(command) {

        var synth = window.speechSynthesis;
        var utterThis = new SpeechSynthesisUtterance(command);
        utterThis.onend = function (event) {
          console.log('SpeechSynthesisUtterance.onend');
        }
        utterThis.onerror = function (event) {
            console.error('SpeechSynthesisUtterance.onerror');
        }
        utterThis.pitch = 1;
        utterThis.rate = 1;
        synth.speak(utterThis);
  }

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
      speak("filters have been reset")
  }

  function filterBy(command) {
    var commandArray = command.split(" ");
    var updateTypeInput = commandArray[0];
    var fieldName = commandArray[1];
    var values = commandArray.slice(1);

    if (updateTypeInput == "remove") {
      var updateType = "remove";
    } 
    else if (updateTypeInput == "select") {
      var updateType = "add";
    }

    fieldName = jsUcfirst(fieldName);
    var finalValues = [];
    values.forEach(
      function(value){
        finalValues.push(jsUcfirst(value));
      }
    );

    let promises = [];
      // To get dataSource info, first get the dashboard.
    const dashboard = tableau.extensions.dashboardContent.dashboard;

    dashboard.worksheets.forEach(function(worksheet) {
    promises.push(worksheet.applyFilterAsync(fieldName,finalValues,updateType,false));

    })

    Promise.all(promises).then(function(results){});

  }

  function jsUcfirst(string) 
  {
      return string.charAt(0).toUpperCase() + string.slice(1);
  }
})();
