// global variables
// misc
var x;
var y;
var rows, cols;
var ready = false;
var finalData = [];
var isMobile = false;
var points = [];

// customisation
var res = 500; // canvas length or height
var contrast = 80; // weighting of darker areas
var speed = 5; // speed of animation
var decay = 0.9; // how fast new areas are reached 
var weight = 0.5; // line thickness
var light = 0.10; // line alpha
var spacing = 300; // distance between sampled points
var n = 50; // number of sampled points per iteration


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

createCanvas(500, 500);
ctx2 = canvas.getContext('2d');
  // device detection
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    isMobile = true;
    alert("Not optimised for mobile...");
  }
}

// to upload an image
function handleImage(e) {
  var reader = new FileReader();
  reader.onload = function (event) {
    var img = new Image();
    img.onload = function () {
      
      // make canvases the same size
      if (img.width > img.height) {
        imageCanvas.width = res;
        imageCanvas.height = (img.height / img.width) * res;
      } else {
        imageCanvas.height = res;
        imageCanvas.width = (img.width / img.height) * res;
      }

      // get image data for processing
      ctx.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);
      var imageData = ctx.getImageData(
        0,
        0,
        imageCanvas.width,
        imageCanvas.height
      );
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
  if (isMobile) {
    imageCanvas.height = floor(1.33333 * res);
    imageCanvas.width = res;
  } else {
    imageCanvas.width = floor(1.33333 * res);
    imageCanvas.height = res;
  }
  ctx.drawImage(video, 0, 0, imageCanvas.width, imageCanvas.height);

  video.style.display = "none";
  document.getElementById("snap").style.visibility = "visible";
  document.getElementById("snapnow").style.visibility = "hidden";

  imageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
  var data = Object.values(imageData.data);

  resizeCanvas(imageCanvas.width, imageCanvas.height);
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

// lead and chase algorithms
function step() {
  
  // start with lead algorithm to get 'n' new points (1 after every 'spacing' iterations) for the curve generator
  for (let i = 1; i <= n*spacing; i++){
  var total;
  var c1, c2, c3;
  var r;

    total =
      finalData[x + 1][y] +
      finalData[x][y + 1] +
      finalData[x][y - 1] +
      finalData[x - 1][y];

    c1 = finalData[x + 1][y] / total;

    c2 = finalData[x - 1][y] / total + c1;

    c3 = finalData[x][y + 1] / total + c2;

    r = random(0, 1);

    if (r < c1) {
      x++;
    } else if (r < c2) {
      x--;
    } else if (r < c3) {
      y++;
    } else {
      y--;
    }
    
    // sample points every certain number of turns
    if(i % spacing === 0){
    points[i/spacing - 1] = [];
    points[i/spacing - 1][0] = x;
    points[i/spacing - 1][1] = y;
    }
    
    // decay every visited point
    finalData[x][y] = finalData[x][y] * decay; 
  }
  

// draw smooth curves between the sampled control points
beginShape()
  
stroke("rgba(0,0,0," + light + ")")
strokeWeight(weight)
noFill()
  
// starting coordinate
vertex(points[0][1],points[0][0])  
  
var count = 0; 
for (count = 1; count <points.length -2; count ++){
  
var xc = (points[count][1] + points[count + 1][1]) / 2;
var yc = (points[count][0] + points[count + 1][0]) / 2;
  
quadraticVertex(points[count][1], points[count][0], xc, yc);
} 
  
   // curve through the last two points
quadraticVertex(points[count][1], points[count][0], points[count+1][1],points[count+1][0]);
  
endShape()
}


function mousePressed() {
  if (ready == true) {
    ready = false;
  } else if (finalData.length > 1) {
    ready = true;

  }
}
