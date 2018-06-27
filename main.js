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

var happyWizards = [
    "Happy/AlbusDumbledore_Happy01.jpg",
    "Happy/Gandalf_Happy_01.gif",
    //"Happy/Gandalf_Happy_02.png",
    "Happy/Gandalf_Happy_03.png",
    "Happy/Gandalf_Happy_04.gif"
];

/*
var neutralWizards = [
    "Neutral/AlbusDumbledore_Neautral_03.png",
    "Neutral/AlbusDumbledore_Neautral_01.png",
    "Neutral/AlbusDumbledore_Neutral_02.png",
    "Neutral/AlbusDumbledore_Neutral_04.png",
    "Neutral/Gandalf_Neutral_01.png",
    "Neutral/Gandalf_Neutral_02.png"
];
*/

var angryWizards = [
    "Angry/Dumbledore_Angry_01.png",
    "Angry/Dumbledore_Angry_04.png",
    "Angry/Gandalf_Angry_01.png",
    //"Angry/Gandalf_Angry_02.gif",
    "Angry/Gandalf_Angry_03.png",
    "Angry/Saruman_Angry_01.png"
];

var videos = [
    "3xYXUeSmb-Y", // You shall not pass
    "-s2rREf2Kj8",   // SILENCE
    "lKaw5SjeHx0"   // Do not take me for some conjurer of cheap tricks
];

var currentWizards = happyWizards;

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

var playing = false;
var done = false;

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
player = new YT.Player('player', {
    height: '600',
    width: '1066',
    videoId: '-s2rREf2Kj8',
    events: {
        onStateChange: onPlayerStateChange
      }
});
}

function onPlayerStateChange(event) {        
    if(event.data === 0) {          
        done = true;
        playing = false;
        currentWizards = angryWizards;
        setWizardMood("Angry");
        angry = true;
        document.getElementById("player").hidden = true;
        document.getElementById("wizard").hidden = false;
        for(var i = 0; i < BUFFER_SIZE; i++) {
            bufferArray[i] = 0;
        }
        avg = 0;
    }
}

window.onload = function() {
    document.getElementById("player").hidden = true;
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

    if (meter.volume > sensitivity) {
        canvasContext.fillStyle = "red";
    }
    else {
        canvasContext.fillStyle = "green";
    }

    if(avg >= 0.9 && !playing && !done) {
        document.getElementById("wizard").hidden = true;
        document.getElementById("player").hidden = false;
        var rand = Math.floor(Math.random() * videos.length); 
        player.loadVideoById(videos[rand]);
        console.log(videos[rand]);
        player.playVideo();
        playing = true;
    }
    else if (avg > CLIPPING_LIMIT) {
        currentWizards = angryWizards;
        setWizardMood("Angry");
        angry = true;
    }
    else if(avg < CLIPPING_LIMIT / 2 && angry || !angry) {
        currentWizards = happyWizards;
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

        var rand = Math.floor(Math.random() * currentWizards.length); 
        document.getElementById("wizard").src = currentWizards[rand];
        console.log(currentWizards[rand]);
        lastMood = mood;
    }
}

function debugPrint() {
    console.log("Avg: " + avg + ", Sens: " + sensitivity + ", Volume: " + (Math.round(meter.volume * 100) / 100) + " , Mood: " + lastMood);
}