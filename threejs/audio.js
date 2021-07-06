// Inicializacion de libreria

var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#D2EDD4',
    progressColor: '#46B54D'
});

var img = new Image();

// Cuando img cambia, se ejecuta la funcion. Se sabe que va a cambiar unicamente cuando el espectrograma este cargado
img.onload = function () {
  let resizedCanvas = document.createElement('canvas');
  let ctx = resizedCanvas.getContext('2d'); // Permite dibujar dentro del canvas y acceder a la informacion

  resizedCanvas.width = 1001;
  resizedCanvas.height = 101;
  // se dibuja la imagen escalada en un canvas a raiz del contexto
  // todos los canvas tienen un contexto y a partir de el se dibuja
  ctx.drawImage(img, 0, 0, resizedCanvas.width, resizedCanvas.height);

  //window.open(resizedCanvas.toDataURL(), '_blank');

  //[((y * (w * 4)) + (x * 4)) + 2]
  let data = ctx.getImageData(0, 0, resizedCanvas.width, resizedCanvas.height);

  init("scene", 1000, 1000, 0.2, data);  
}

// Cuando se inicializa wavesurfer, se ejecuta la funcion
wavesurfer.on('ready', function () {
  let spectrogram = Object.create(WaveSurfer.Spectrogram);
  spectrogram.init({
    wavesurfer: wavesurfer,
    container: "#wave-spectrogram",
    fftSamples: 1024
  });

  let canvas = $("#wave-spectrogram canvas")[0]; //Toma el elemento "canvas" dentro del elemento con id "wave-spectrogram"

  img.src = canvas.toDataURL();

  $("#waveform").remove();
  $("#wave-spectrogram").remove();
  $("#fileinput").remove();
});

$("#fileinput")[0].onchange = function () {
  let file = this.files[0];

  if (file) {
      let reader = new FileReader();
      
      reader.onload = function (evt) {
          let blob = new window.Blob([new Uint8Array(evt.target.result)]);
          wavesurfer.loadBlob(blob);
      };

      reader.readAsArrayBuffer(file);
  }
}

//wavesurfer.load('https://wavesurfer-js.org/example/media/demo.wav');