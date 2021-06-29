// Inicializacion de libreria

var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#D2EDD4',
    progressColor: '#46B54D'
});

var img = new Image();

img.onload = function () {
  let resizedCanvas = document.createElement('canvas'),
  ctx = resizedCanvas.getContext('2d');

  resizedCanvas.width = 1001;
  resizedCanvas.height = 101;
  ctx.drawImage(img, 0, 0, resizedCanvas.width, resizedCanvas.height);

  console.log(resizedCanvas.toDataURL());

  //[((y * (w * 4)) + (x * 4)) + 2]
  let data = ctx.getImageData(0, 0, resizedCanvas.width, resizedCanvas.height);

  init("scene", 1000, 1000, 0.1);
}

wavesurfer.on('ready', function () {
  var spectrogram = Object.create(WaveSurfer.Spectrogram);
  spectrogram.init({
    wavesurfer: wavesurfer,
    container: "#wave-spectrogram",
    fftSamples: 1024
  });

  let canvas = $("#wave-spectrogram canvas")[0]; //Toma el elemento "canvas" dentro del elemento con id "wave-spectrogram"

  img.src = canvas.toDataURL();

  $("#waveform").remove();
  $("#wave-spectrogram").remove();
});

wavesurfer.load('https://wavesurfer-js.org/example/media/demo.wav');