'use strict';

// Wrap everything in an anonymous function to avoid polluting the global namespace
(function () {

  $(document).ready(function () {
    tableau.extensions.initializeAsync().then(function () {
      speak("Welcome to your dashboard");
      var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
      var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
      var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

      var commands = [ 'reset filters' , 'filter by &lt;filter name&lt; &lt;filter item&lt;' , 'go to <sheet name>', 'show caption', 'view data'];
      var grammar = '#JSGF V1.0; grammar commands; public <command> = ' + commands.join(' | ') + ' ;'
      var listening = false;

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

      recognition.start();
      console.log('Ready to receive a command.');



      document.body.onclick = function() {

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

        if (listening == false) {
          if(command.includes("stuff")) {
            listening = true;
            diagnostic.textContent = "Recording";
            diagnostic.style.color = "red";
            speak("Listening");
          }
          else {
            diagnostic.textContent = 'Result received: ' + command+ '.';
          }
          recognition.start();
        }
        else {
          diagnostic.textContent = 'Result received: ' + command+ '.';
          //bg.style.backgroundcommand = command;

          if (command.includes("reset") && command.includes("filter")) {
            resetFilters();
          }
          else if ((command.includes("select") || command.includes("remove")) && command.includes("from")) {
            filterBy(command);
          }
          else if(command.includes("list worksheet")) {
            listWorksheets();
          }
          else if (command.includes("summary table")) {
            toggleSummaryTable(command);
          }
          else {
            speak("Command not understood");
          }
          listening = false;
          recognition.start();
        }
      }

      recognition.onspeechend = function() {
        recognition.stop();
        diagnostic.textContent = "<em>...click to activate listening...</em>";
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
      speak("filters have been reset");
  }

  function filterBy(command) {
    //select VALUE from FILTER
    //remove VALUE from FILTER
    var commandArray = command.split(" ");
    var updateTypeInput = commandArray[0];
    var fromIndex = commandArray.indexOf("from");
    var fieldName = commandArray.slice(fromIndex + 1);
    var filterItems = commandArray.slice(1, fromIndex);
    if (updateTypeInput == "remove") {
      var updateType = "remove";
    } 
    else if (updateTypeInput == "select") {
      var updateType = "add";
    }

    var finalFieldName = [];
    fieldName.forEach(
      function(name){
        finalFieldName.push(jsUcfirst(name))
      });
    finalFieldName = finalFieldName.join(" ");

    var finalValues = [];
    filterItems.forEach(
      function(value){
        finalValues.push(jsUcfirst(value));
      }
    );

    let promises = [];
      // To get dataSource info, first get the dashboard.
    const dashboard = tableau.extensions.dashboardContent.dashboard;

    dashboard.worksheets.forEach(function(worksheet) {
    promises.push(worksheet.applyFilterAsync(finalFieldName,finalValues,updateType,false));

    })

    Promise.all(promises).then(function(results){});
    if (updateTypeInput == "remove") {
        speak("removed " + finalValues + " from " + finalFieldName);
    }
    if (updateTypeInput == "select") {
        speak("selected " + finalValues + " from " + finalFieldName);
    }
    

  }

  function listWorksheets() {
      let promises = [];
      // To get dataSource info, first get the dashboard.
      const dashboard = tableau.extensions.dashboardContent.dashboard;
      speak("Your worksheets are ");
      dashboard.worksheets.forEach(function(worksheet) {
        speak(worksheet.name);
      })
      Promise.all(promises).then(function(results){});
  }

   function summaryTable() {
    console.log("Trying to log the summaryTable");

      let summaryPromises = [];
      // To get dataSource info, first get the dashboard.
      const dashboard = tableau.extensions.dashboardContent.dashboard;
      dashboard.worksheets.forEach(function(worksheet) {
        summaryPromises.push(worksheet.getSummaryDataAsync());
      });

       Promise.all(summaryPromises).then(function (fetchResults) {
        fetchResults.forEach(function (dataTable) {

          console.log(dataTable.name);
          $("#summary-table").append("Table name: ", dataTable.name); 
          $("#summary-table").append('<br> <table class="table"> <thead>');    
          console.log(dataTable.data); 
          for (var i = 0; i < dataTable.columns.length; i++) {
              $("#summary-table").append('<th> ' + dataTable.columns[i]._fieldName + '</th>');     
          }

          $("#summary-table").append("</thead>   <tbody>"); 

          console.log(dataTable.data[0][0]);
           for (var i = 0; i < dataTable.data.length; i++) {
              $("#summary-table").append("<tr>"); 

              for (var j = 0; j < 7; j++) {
                $("#summary-table").append('<td>'+  dataTable.data[i][j]._formattedValue + '</td>');     
              $("#summary-table").append("</tr>"); 


            }
          $("#summary-table").append('</thead>');    

          }
          });
        });
      Promise.all(summaryPromises).then(function(results){});



  }

  function toggleSummaryTable(string) {
    var commandArray = string.split(" ");
    if (commandArray[0] == "show") {
        summaryTable();
        speak("showing table");
    }
    else {
      $("#summary-table").hide();
      speak("hiding table");

    }
  }

  function jsUcfirst(string) 
  {
      return string.charAt(0).toUpperCase() + string.slice(1);
  }
})();
