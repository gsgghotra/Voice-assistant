// Check for SpeechRecognition support and create necessary objects

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

// Get the audio element by its ID
var audio = document.getElementById("myAudio");

// Define a grammar for speech recognition
var grammar = "#JSGb F V1.0; grammar task; public <task> =  ...;";
let synth = window.speechSynthesis;

//Regular expressions for the different utternaces
//make the code versetile for user - Gurjeet Singh
let option1=/.*(?:add|set) (?:an|a|new) (?:event|task|reminder)$/i; // Working
let option2=/.*(?:add|set) (?:an|a|new) (?:event|task|reminder) to (.*)$/i; // Working
let option3=/.*(?:add|set) (?:an|a|new) (?:event|task|reminder) on (.*)$/i;
let option4=/.*(?:add|set) (?:an|a|new) (?:event|task|reminder) on (.*) to (.*)$/i; // Working
let option5=/.*(?:add|set) (?:an|a|new) (?:event|task|reminder) to (.*) on (.*)$/i; // Working
let date=/(?:on)?\s*(.*)/i;
let title=/(?:to)?\s*(.*)/i;

// Triggers like what can you do?
// Trigger phrases like "what can you do?"
let help1=/.*(?:what|How) (?:can|do) (?:you|this) (?:do|work)$/i; // Working

let recognition = new SpeechRecognition();

// Parameters of the decognition:
recognition.continuous = false;
recognition.lang = 'en-GB';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

var diagnostic = document.querySelector('.output');
var resp = document.querySelector('.response');


function startRec() {
  resp.textContent="...";
  //Play a tune
  console.log('Ready to receive voice commands.');
  enterState(0);
  diagnostic.textContent = "";
}


function enterState(s){
  console.log("Entering state:", s);
  // set new state
  state=s;
  // say something for this state
  // Note need to pass in the function that does the next thing as a parameter,
  // so that in can be done after the speech.
  sayState(state, function(){
    if(isFinal(state)){
    var msg="You've added an event,"+taskName+ ", on, "+taskDate; // added comma to make the results sound better with pauses
    utterThis = new SpeechSynthesisUtterance(msg);
    synth.speak(utterThis);
  } else if (state == 8){
      recognition.stop();
    }
    else if (state == 7){
      recognition.stop();
    }
    else { recognition.start(); }});
}

// Final states:
function isFinal(s){ return s==5;}

// Things it can say in the different states.
var sayings = {
  0: "Welcome to G calender, How can I help?",
  1:"Whats the title?",
  6:"Whats the title?",
  3:"okay! What is the date?",
  5:"Done!",
  7:"You can ask me to do several things. For example, Set a task, to submit the assignment, on 2nd of June 2021.",
  8: "Sorry, I did not recognise that. Please try that again."
}

function sayState(s, afterSpeechCallback){
  var textOut=sayings[s];
  resp.textContent=" "+ textOut;
  resp.style.color = "#000";
  resp.style.fontSize = "medium";

  var utterThis = new SpeechSynthesisUtterance(textOut);
  utterThis.onend = function (event) {
    console.log('SpeechSynthesisUtterance.onend');
  }
  utterThis.onerror = function (event) {
    console.error('SpeechSynthesisUtterance.onerror');
  }
  utterThis.onend = afterSpeechCallback;

  synth.speak(utterThis);
}

recognition.onresult = function(event) {
  console.log('onresult');
  var text = event.results[0][0].transcript;
  diagnostic.textContent = 'Your input: ' + text + '.';

  // figure out what they've said;
  // record slot fillers
  // what they've said + state -> new state
  // enterState(newState);

  console.log("State:", state);
  // What speech we are expecting depends on the state we're in:
  switch(state){
    case 0:
      if(text.match(help1)){ // "...from ...."
        enterState(7);
      }

      else if(text.match(option1)){ // If say add an event
      console.log("Text matched" + option1);
      enterState(1);
    }

    else if (m=text.match(option2)){ // Only included title
      taskName = m[1];
      enterState(3); // State 3 asks for date
    }

    else if (m=text.match(option3)){ // Only included Date
      taskDate = m[1];
      enterState(6); // State 3 asks for date
    }

    else if (m=text.match(option4)) { // Included date and title
      taskName = m[2];
      taskDate=m[1];
      enterState(5);
    }

    else if (m=text.match(option5)) { // Include title and date (in different speech)
      taskName = m[1];
      taskDate=m[2];
      enterState(5);
    }

    else {
      // re-enter the current state.
      // would be better to give an error message here as well:
        enterState(8); // Error message
        recognition.stop();
    }
    break;


// check if it already has the date
    case 1:
    if(m = text.match(title)){ // "...from ...."
      console.log("Matched - Added Title");
      taskName = m[1]; enterState(3);
    } else {
      // re-enter the current state.
      // would be better to give an error message here as well:

      enterState(state);
    }
    break;

    case 3:
    if(m=text.match(date)){
      console.log("Added Date");
      taskDate = m[1]; enterState(5);
    } else {
      // re-enter the current state.
      // would be better to give an error message here as well:
      enterState(state);
    }
    break;

    case 6:
      if(m = text.match(title)){ // "...from ...."
        console.log("Matched - Added Title");
        taskName = m[1]; enterState(5);
      } else {
        // re-enter the current state.
        // would be better to give an error message here as well:
        enterState(state);
      }
      break;

    case 5:
    break;
  }

  console.log(event.results);
  console.log('Confidence: ' + event.results[0][0].confidence);

}

// Handle audio start
recognition.onaudiostart = function() {
  audio.play();
  resp.textContent="I am listening......";
  resp.style.color = "#008000";
  resp.style.fontSize = "x-large";
}

// Handle speech end
recognition.onspeechend = function() { //console.log("onspeechend");
  recognition.stop();
}

// Handle no match
recognition.onnomatch = function(event) {
  //console.log('onnomatch', event);
  diagnostic.textContent = "I didn't recognise that. Please try again";
}

// Handle recognition errors
recognition.onerror = function(event) {
  //console.log('onerror', event);
  diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
}