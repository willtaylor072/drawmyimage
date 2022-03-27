// global variables
// misc
var x;
var y;
var rows;
var cols;
var ready = false;
var finalData = [];

// customisation
var res = 500;
var contrast = 30;
var speed = 2000;
var transparency = 0.03;
var decay = 0.8;

// image variables and callbacks
var imageCanvas = document.querySelector("#image_canvas");
var ctx = imageCanvas.getContext("2d");
var realInput = document.querySelector("#image_input");
realInput.addEventListener("change", handleImage, false);
var video = document.querySelector("#video");
var videoInput = document.querySelector("#snap");
videoInput.addEventListener("click", handleVideo);
var pictureCapture = document.querySelector("#snapnow");
pictureCapture.addEventListener("click", takePic);

function setup() {
  document.getElementById("snap").style.visibility = "visible";
  document.getElementById("snapnow").style.visibility = "hidden";
  document.getElementById("drawnow").style.visibility = "hidden";
  
  createCanvas(500,500);
}

// to upload an image
function handleImage(e) {
  var reader = new FileReader();
  reader.onload = function (event) {
    var img = new Image();
    img.onload = function () {
      // scale image portrait or landscape
      if (img.width > img.height) {
        imageCanvas.width = res;
        imageCanvas.height = (img.height / img.width) * res;
      } else {
        imageCanvas.height = res;
        imageCanvas.width = (img.width / img.height) * res;
      }

      // get image data for processing
      ctx.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);
      var imageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
      var data = Object.values(imageData.data);

      // set up drawing canvas with correct dimensions
      resizeCanvas(imageCanvas.width, imageCanvas.height);
      y = floor(imageCanvas.width / 2);
      x = floor(imageCanvas.height / 2);
      rows = imageCanvas.height;
      cols = imageCanvas.width;

      process(data);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
}

// to take a photo
function handleVideo() {
  video.style.display = "block";
  document.getElementById("snap").style.visibility = "hidden";
  document.getElementById("snapnow").style.visibility = "visible";

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
      video.play();
    });
  }
}

function takePic() {
  imageCanvas.width = floor(1.33333 * res);
  imageCanvas.height = res;
  ctx.drawImage(video, 0, 0, imageCanvas.width, imageCanvas.height);

  video.style.display = "none";
  document.getElementById("snap").style.visibility = "visible";
  document.getElementById("snapnow").style.visibility = "hidden";

  imageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
  var data = Object.values(imageData.data);

resizeCanvas(imageCanvas.width,imageCanvas.height);
  y = floor(imageCanvas.width / 2);
  x = floor(imageCanvas.height / 2);
  rows = imageCanvas.height;
  cols = imageCanvas.width;
  
  process(data);
}

// image processing for drawing algorithm
function process(data) {
  // define variables with function scope (ignore alpha)
  var myRed = [];
  var myGreen = [];
  var myBlue = [];
  var greyData = [];
  var zeros = [];

  // get rgb(a) values
  for (let i = 0, n = data.length; i < n; i += 4) {
    myRed[i / 4] = data[i];
    myGreen[i / 4] = data[i + 1];
    myBlue[i / 4] = data[i + 2];
  }

  // convert to greyscale array
  for (let i = 0, n = myRed.length; i < n; i++) {
    greyData[i] = 0.299 * myRed[i] + 0.587 * myGreen[i] + 0.114 * myBlue[i];
  }

  // invert and raise to power, so dark pixels have much larger values
  for (let i = 0, n = greyData.length; i < n; i++) {
    greyData[i] = 255 - greyData[i];
    greyData[i] = Math.pow(greyData[i], contrast);
  }

  // make array 2D
  for (let i = 0; i < rows; i++) {
    finalData[i] = [];
    for (let j = 0; j < cols; j++) {
      finalData[i][j] = greyData[i * cols + j];
    }
  }

  // make borders
  for (let i = 0; i < rows; i++) {
    finalData[i].unshift(0);
    finalData[i].push(0);
  }
  for (let i = 0; i < cols + 2; i++) {
    zeros[i] = 0;
  }
  finalData.unshift(zeros);
  finalData.push(zeros);

  ready = true;
}

function draw() {
  
  if (ready == true) {
    for (let i = 0; i < speed; i++) {
      step();
    }
  }
}

// drawing algorithm
function step() {
  var total =
    finalData[x + 1][y + 1] +
    finalData[x + 1][y] +
    finalData[x + 1][y - 1] +
    finalData[x][y + 1] +
    finalData[x][y - 1] +
    finalData[x - 1][y + 1] +
    finalData[x - 1][y] +
    finalData[x - 1][y - 1];

  var c1 = finalData[x + 1][y] / total;
  var c2 = finalData[x + 1][y + 1] / total + c1;
  var c3 = finalData[x - 1][y] / total + c2;
  var c4 = finalData[x - 1][y - 1] / total + c3;
  var c5 = finalData[x][y + 1] / total + c4;
  var c6 = finalData[x][y - 1] / total + c5;
  var c7 = finalData[x + 1][y - 1] / total + c6;

  stroke("rgba(0,0,0," + transparency + ")");

  var r = random(0, 1);

  if (r < c1) {
    line(y, x, y + 1, x);
    x++;
  } else if (r < c2) {
    line(y, x, y + 1, x + 1);
    x++;
    y++;
  } else if (r < c3) {
    line(y, x, y - 1, x);
    x--;
  } else if (r < c4) {
    line(y, x, y - 1, x - 1);
    x--;
    y--;
  } else if (r < c5) {
    line(y, x, y, x + 1);
    y++;
  } else if (r < c6) {
    line(y, x, y, x - 1);
    y--;
  } else if (r < c7) {
    line(y, x, y + 1, x - 1);
    x++;
    y--;
  } else {
    line(y, x, y - 1, x + 1);
    x--;
    y++;
  }
  finalData[x][y] = finalData[x][y] * decay;
}

function mousePressed() {
  if (ready == true) {
    ready = false;
  } else if (finalData.length > 1) {
    ready = true;
  }
}
