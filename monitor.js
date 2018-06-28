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
var BUFFER_SIZE = 1000;
var CLIPPING_LIMIT = 0.5;
var bufferArray = new Array(BUFFER_SIZE);
var bufferPointer = 0;
var sensitivity = 0.5;
var avg = 0;
var angry = false;

var lastMood = "";

var t=setInterval(debugPrint,1000);

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

    if (meter.volume > sensitivity) {
        canvasContext.fillStyle = "red";
    }
    else {
        canvasContext.fillStyle = "green";
    }

    if(avg >= 0.9 && !playing && !done) {
        playing = true;
    }
    else if (avg > CLIPPING_LIMIT) {
        setWizardMood("Angry");
        angry = true;
    }
    else if(avg < CLIPPING_LIMIT / 2 && angry || !angry) {
        setWizardMood("Happy");
        angry = false;
        done = false;
        playing = false;
    }

    // draw a bar based on the current volume
    canvasContext.fillRect(0, 0, meter.volume*WIDTH*1.4, HEIGHT);
    // set up the next visual callback
    rafID = window.requestAnimationFrame( drawLoop );
}

function setWizardMood(mood) {
    if(lastMood != mood) {
        document.getElementById("mood").innerHTML = "Mood: " + mood;
        lastMood = mood;
    }
}

function debugPrint() {
    console.log("Avg: " + avg + ", Sens: " + sensitivity + ", Volume: " + (Math.round(meter.volume * 100) / 100) + " , Mood: " + lastMood);
}