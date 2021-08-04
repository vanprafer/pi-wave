// Inicializacion de libreria

var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#D2EDD4',
    progressColor: '#46B54D'
});

var img = new Image();
img.crossOrigin = "anonymous";

var duration = 0;

var audio;

var songName;

// -----------------------------------------------------------------------------------------------------------
// REDIMENSION DE IMAGEN
// -----------------------------------------------------------------------------------------------------------

// Cuando img cambia, se ejecuta la funcion. Se sabe que va a cambiar unicamente cuando el espectrograma este cargado
img.onload = function () {
  let resizedCanvas = document.createElement('canvas');
  let ctx = resizedCanvas.getContext('2d'); // Permite dibujar dentro del canvas y acceder a la informacion

  resizedCanvas.width = duration * 10 + 1;
  resizedCanvas.height = 51;
  
  // se dibuja la imagen escalada en un canvas a raiz del contexto
  // todos los canvas tienen un contexto y a partir de el se dibuja
  ctx.drawImage(img, 0, 0, resizedCanvas.width, resizedCanvas.height);

  $("#imgSpect")[0].src = resizedCanvas.toDataURL(); //Todas las img tienen un src, yo tomo la primera img de jquery con ese id (en este caso, la única) y modifico su src

  //window.open(resizedCanvas.toDataURL(), '_blank');

  //[((y * (w * 4)) + (x * 4)) + 2]
  let data = ctx.getImageData(0, 0, resizedCanvas.width, resizedCanvas.height);

  //Iniciacion de escena
  init("scene", Math.floor(0.4 * duration * 10), Math.floor(duration * 10), 0.05, data);  
}

// Cuando se inicializa wavesurfer, se ejecuta la funcion
var body = $("body")[0];

// -----------------------------------------------------------------------------------------------------------
// CALCULO DE ESPECTROGRAMA
// -----------------------------------------------------------------------------------------------------------

wavesurfer.on('ready', function () {  
  let spectrogram = Object.create(WaveSurfer.Spectrogram);
  spectrogram.init({
    wavesurfer: wavesurfer,
    container: "#wave-spectrogram",
    fftSamples: 1024
  });

  let canvas = $("#wave-spectrogram canvas")[0]; //Toma el elemento "canvas" dentro del elemento con id "wave-spectrogram"

  body.style.width = "";

  img.src = canvas.toDataURL(); //Cambiar por otra equivalente

//  window.open(canvas.toDataURL(), '_blank');

  $("#waveform").remove();
  $("#wave-spectrogram").remove();
  $("#fileinput").remove();
  $("#song-name")[0].innerHTML = songName + " · ";
  $("title")[0].innerHTML += " · " + songName + " · ";

  // setInterval ejecuta un trozo de código (función) cada x milisegundos (segundo parámetro)
  setInterval(function () {
    let elem = $("#song-name")[0]; // Coges el elemento
    let text = elem.innerHTML; // Cogemos el texto de dentro

    text = text.substr(1) + text[0]; // Ponemos el primer caracter al final

    elem.innerHTML = text; //Volvemos a asignárselo al div 
  }, 200);

  setInterval(function () {
    let elem = $("title")[0];
    let text = elem.innerHTML; 

    text = text.substr(1) + text[0]; 

    elem.innerHTML = text; 
  }, 200);
});

// -----------------------------------------------------------------------------------------------------------
// CARGA DE ARCHIVOS
// -----------------------------------------------------------------------------------------------------------

$("#fileinput")[0].onchange = function () {

  let file = this.files[0];

  songName = file.name;

  if (file) {
      let reader = new FileReader();
      // Cojo lo primero y si no esta disponible, cojo lo segundo. Despues llamo al resultado
      let audioContext = new (window.AudioContext || window.webkitAudioContext)() 
      
      reader.onload = function (audioData) {
        let audioDataCopy = new Uint8Array(audioData.target.result);
        let blob = new window.Blob([audioDataCopy]);
        
        //Se carga el audio
        let blobUrl = URL.createObjectURL(blob);
        audio = new Audio(blobUrl);

        // Promesa -> Cuando tenga lugar, se ejecuta lo de dentro del then
        blob.arrayBuffer().then(function(array) {
          audioContext.decodeAudioData(array, function(data) {
            duration = data.duration;
            // El espectrograma se crea a 1.25 * nPixeles del body (no se por que) TODO
            let nPix = duration * 10 / 1.25;
            body.style.width = nPix + "px";
            
            // Blob son datos, en este caso del audio
            wavesurfer.loadBlob(blob);
          })
        })
      };

      reader.readAsArrayBuffer(file);
  }
}

//wavesurfer.load('https://wavesurfer-js.org/example/media/demo.wav');

// -----------------------------------------------------------------------------------------------------------
// CONTROLES DE AUDIO
// -----------------------------------------------------------------------------------------------------------

function playAudio() {
  audio.play();
} 

function stopAudio() {
  audio.pause();
}

function restartAudio() {
  audio.currentTime = 0;
  audio.playbackRate = 1;
  stopAudio();
}

function songProgress() {
  return Math.min(audio.currentTime/duration, 1);
}

function fasterAudio() {
  audio.playbackRate = Math.min(audio.playbackRate + 0.25, 4);
}

function slowerAudio() {
  audio.playbackRate = Math.max(audio.playbackRate - 0.25, 0.25);
}
