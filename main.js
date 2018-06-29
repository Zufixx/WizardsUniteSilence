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

/*
Chris Wilsons kod är modifierad och används som backend för det system
som Albin Byström, Filip Bergkvist och Marcus Karåker har utvecklat för
användning på Hello World!s sommarläger, Ågesta, 2018.

HUR SYSTEMET FUNGERAR:
volume-meter.js läser av mikrofonens volymnivåer varje uppdatering.
sensitivity är en gräns som sätts med en slider i html dokumentet.
Varje uppdatering så väljs ett element i en array med storleken
BUFFER_SIZE. Om volymen vid den uppdateringen är över sensitivity
så sätts det elementet till 1, annars till 0. 
Varje uppdatering så
beräknas ett medelvärde av arrayen, som om den blir högre än
ANGRY_LIMIT byter bild till en arg bild från arrayen angryImages.
Om medelvärden sedan går ner till hälften av ANGRY_LIMIT så blir
den glad igen, I.E 0.25.
Om medelvärdet skulle gå över VIDEO_LIMIT så byts bilden ut mot ett
youtubeklipp från video arrayen, som då börjar spelas. När klippet
har spelat klart så visas bilderna igen. Korta videor rekommenderas.

Det finns en monitor html och js fil som kan användas på datorn medan
index och main används på projektorn. Då kan man se nivåer och värden
utan att spela upp t.ex videor både på sin egen dator och projektor
samtidigt.
*/

var audioContext = null;
var meter = null;
var canvasContext = null;

// Mätarens dimensioner
var WIDTH=500;
var HEIGHT=50;
var rafID = null;

// Högre buffer_size betyder att det behöver vara för högt en längre tid
// innan bilden blir arg.
var BUFFER_SIZE = 1000;
// När bilden byts till arg, blir glad igen när avg blir lägre än halva detta värde.
var ANGRY_LIMIT = 0.5;
// När bilden byts mot en video, blir glad igen efter videon är slut.
var VIDEO_LIMIT = 0.9;
var bufferArray = new Array(BUFFER_SIZE);
var bufferPointer = 0;
// Sätts i slidern i index.html
var sensitivity;
// Medelvärdet på arrayen
var avg = 0;
var angry = false;

var lastMood = "";

// Skriv ut debug värden i konsolen varje sekund
var t=setInterval(debugPrint,1000);

// Skriv in paths i följande arrayer för att
// lägga till bilder
var happyImages = [
    "Happy/AlbusDumbledore_Happy01.jpg",
    "Happy/Gandalf_Happy_01.gif",
    "Happy/Gandalf_Happy_03.png",
    "Happy/Gandalf_Happy_04.gif"
];

var angryImages = [
    "Angry/Dumbledore_Angry_01.png",
    "Angry/Dumbledore_Angry_04.png",
    "Angry/Gandalf_Angry_01.png",
    "Angry/Gandalf_Angry_03.png",
    "Angry/Saruman_Angry_01.png"
];

// Youtube ID för spelaren
var videos = [
    "3xYXUeSmb-Y",  // You shall not pass
    "-s2rREf2Kj8",  // SILENCE
    "lKaw5SjeHx0"   // Do not take me for some conjurer of cheap tricks
];

var currentImages = happyImages;

// Youtbe spelaren
var tag = document.createElement('script');

var playing = false;
var done = false;

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
// Youtube spelarens dimensioner, standard id spelar ingen roll
// då denna byts direkt ändå.
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

// När videon är slut, gör allt detta
function onPlayerStateChange(event) {        
    if(event.data === 0) {          
        done = true;
        playing = false;
        currentImages = angryImages;
        setMood("Angry");
        angry = true;
        document.getElementById("player").hidden = true;
        document.getElementById("image").hidden = false;
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

    // Ljudmätaren
	canvasContext = document.getElementById( "meter" ).getContext("2d");
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();

    try {
        navigator.getUserMedia = 
        	navigator.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;

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
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);
    drawLoop();
}

// Uppdateringsfunktion
function drawLoop( time ) {
    // Ljudmätaren
    canvasContext.clearRect(0,0,WIDTH,HEIGHT);
    canvasContext.fillRect(0, 0, meter.volume*WIDTH*1.4, HEIGHT);
    rafID = window.requestAnimationFrame( drawLoop );

    // Hämta känslighet från html slider
    sensitivity = document.getElementById("sensSlider").value / 1.4;
    // Avrunda
    sensitivity = Math.round(sensitivity * 100) / 100;
    // Skriv ut i html
    document.getElementById("sensetivity").innerHTML = "Sensitivity: " + sensitivity;

    // Kolla om volymen är över sensitivity, isåfall, sätt elementet till 1, annars 0
    if (meter.volume >= sensitivity){
        bufferArray[bufferPointer] = 1;
    }
    else {
        bufferArray[bufferPointer] = 0;
    }
    bufferPointer %= BUFFER_SIZE;
    bufferPointer++;

    // Ta fram summan av alla element
    var sum = 0;
    for(var i = 0; i < BUFFER_SIZE; i++) {
        sum += bufferArray[i];
    }
    // Ta fram medelvärdet av alla element
    avg = sum / BUFFER_SIZE;
    // Skriv ut summan
    document.getElementById("avg").innerHTML = ("Avg: " + avg);

    // Ändra ljudmätarens färg om den går över sensitivity
    if (meter.volume > sensitivity) {
        canvasContext.fillStyle = "red";
    }
    else {
        canvasContext.fillStyle = "green";
    }

    // Om medelvärdet går över VIDEO_LIMIT, börja videon
    if(avg >= VIDEO_LIMIT && !playing && !done) {
        document.getElementById("image").hidden = true;
        document.getElementById("player").hidden = false;
        // Välj en video på random
        var rand = Math.floor(Math.random() * videos.length); 
        player.loadVideoById(videos[rand]);
        player.playVideo();
        playing = true;
    }
    // Annars om medelvärdet är större än ANGRY_LIMIT, byt till arg
    else if (avg > ANGRY_LIMIT) {
        currentImages = angryImages;
        setMood("Angry");
        angry = true;
    }
    // OM medelvärdet är argt och går under hälften av ANGRY_LIMIT, bli glad
    else if(avg < ANGRY_LIMIT / 2 && angry || !angry) {
        currentImages = happyImages;
        setMood("Happy");
        angry = false;
        done = false;
        playing = false;
    }
}

function setMood(mood) {
    // Om vi ska ändra modd
    if(lastMood != mood) {
        // Välj en random bild
        var rand = Math.floor(Math.random() * currentImages.length); 
        document.getElementById("image").src = currentImages[rand];
        lastMood = mood;
    }
}

// Skriv ut debug värden varje sekund i konsolen
function debugPrint() {
    if(meter!= null && meter.volume != undefined) {
        console.log("Avg: " + avg + ", Sens: " + sensitivity + ", Volume: " + (Math.round(meter.volume * 100) / 100) + " , Mood: " + lastMood);
    }
}