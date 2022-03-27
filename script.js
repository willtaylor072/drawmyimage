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
var contrast = 10;
var speed = 2000;
var transparency = 0.05;
var decay = 0.8;

// image processing variables
var imageCanvas = document.querySelector("#image_canvas");
var ctx = imageCanvas.getContext("2d");
var realInput = document.querySelector("#image_input");
realInput.addEventListener("change", handleImage, false);
var img;
var imageData;

function setup() {}

function handleImage(e) {
  var reader = new FileReader();
  reader.onload = function (event) {
    img = new Image();
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
      imageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
      var data = Object.values(imageData.data);

      // set up drawing canvas with correct dimensions
      createCanvas(imageCanvas.width, imageCanvas.height);
      y = floor(width / 2);
      x = floor(height / 2);
      rows = height;
      cols = width;

      process(data);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
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
