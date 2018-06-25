/*
The MIT License (MIT)
Copyright (c) 2014 Chris Wilson
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var audioContext = null;
var meter = null;
var canvasContext = null;
var WIDTH=500;
var HEIGHT=50;
var rafID = null;
var BUFFER_SIZE = 500;
var CLIPPING_LIMIT = 0.5;
var bufferArray = new Array(BUFFER_SIZE);
var bufferPointer = 0;
var sensitivity = 0.5;
var avg = 0;

var lastMood = "";

var t=setInterval(debugPrint,1000);

var happyWizards = [
    "Happy/AlbusDumbledore_Happy01.jpg",
    "Happy/Gandalf_Happy_01.gif",
    "Happy/Gandalf_Happy_02.png",
    "Happy/Gandalf_Happy_03.png",
    "Happy/Gandalf_Happy_04.gif"
];

var neutralWizards = [
    "Neutral/AlbusDumbledore_Neautral_03.png",
    "Neutral/AlbusDumbledore_Neautral_01.png",
    "Neutral/AlbusDumbledore_Neutral_02.png",
    "Neutral/AlbusDumbledore_Neutral_04.png",
    "Neutral/Gandalf_Neutral_01.png",
    "Neutral/Gandalf_Neutral_02.png"
];

var angryWizards = [
    "Angry/Dumbledore_Angry_01.png",
    "Angry/Dumbledore_Angry_04.png",
    "Angry/Gandalf_Angry_01.png",
    "Angry/Gandalf_Angry_02.gif",
    "Angry/Gandalf_Angry_03.png",
    "Angry/Saruman_Angry_01.png"
];

var currentWizards = happyWizards;

window.onload = function() {

    for(var i = 0; i < BUFFER_SIZE; i++) {
        bufferArray[i] = 0;
    }

    // grab our canvas
	canvasContext = document.getElementById( "meter" ).getContext("2d");
	
    // monkeypatch Web Audio
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
	
    // grab an audio context
    audioContext = new AudioContext();

    // Attempt to get audio input
    try {
        // monkeypatch getUserMedia
        navigator.getUserMedia = 
        	navigator.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;

        // ask for an audio input
        navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, didntGetStream);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }

}


function didntGetStream() {
    alert('Stream generation failed.');
}

var mediaStreamSource = null;

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    // Create a new volume meter and connect it.
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);

    // kick off the visual updating
    drawLoop();
}

function drawLoop( time ) {
    CLIPPING_LIMIT = document.getElementById("limitSlider").value;
    document.getElementById("limitText").innerHTML = CLIPPING_LIMIT;

    sensitivity = document.getElementById("sensSlider").value / 1.4;
    sensitivity = Math.round(sensitivity * 100) / 100;
    document.getElementById("sensetivity").innerHTML = "Sensitivity: " + sensitivity;

    // clear the background
    canvasContext.clearRect(0,0,WIDTH,HEIGHT);

    // check if we're currently clipping
    if (meter.volume >= sensitivity){
        bufferArray[bufferPointer] = 1;
    }
    else {
        bufferArray[bufferPointer] = 0;
    }
    bufferPointer %= BUFFER_SIZE;
    //console.log(bufferArray[bufferPointer]);
    bufferPointer++;

    var sum = 0;
    for(var i = 0; i < BUFFER_SIZE; i++) {
        sum += bufferArray[i];
    }
    avg = sum / BUFFER_SIZE;
    document.getElementById("avg").innerHTML = ("Avg: " + avg);
    document.getElementById("volume").innerHTML = ("Volume: " + Math.round(meter.volume * 100) / 100);
    //console.log(avg);

    if (avg > CLIPPING_LIMIT) {
        canvasContext.fillStyle = "red";
        currentWizards = angryWizards;
        setWizardMood("Angry");
    }
    else {
        canvasContext.fillStyle = "green";
        currentWizards = happyWizards;
        setWizardMood("Happy");
    }

    // draw a bar based on the current volume
    canvasContext.fillRect(0, 0, meter.volume*WIDTH*1.4, HEIGHT);
    // set up the next visual callback
    rafID = window.requestAnimationFrame( drawLoop );
}

function setWizardMood(mood) {
    if(lastMood != mood) {
        document.getElementById("mood").innerHTML = "Mood: " + mood;

        var rand = Math.floor(Math.random() * currentWizards.length); 
        document.getElementById("wizard").src = currentWizards[rand];
        console.log(currentWizards[rand]);
        lastMood = mood;
    }
}

function debugPrint() {
    console.log("Avg: " + avg + ", Sens: " + sensitivity + ", Volume: " + (Math.round(meter.volume * 100) / 100) + " , Mood: " + lastMood);
}