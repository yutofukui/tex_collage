let imgs = [];
let fragments = [];
let activeFragments = [];
let numImgs = 63;
let minSize = 20;
let maxSize = 300;
let totalFragments = 30;
let maxTotalFragments = 300;
let rotatingText = "Re:Flyers ";
let angle = 0;
let isMobile = false;
let mainCanvasScale = 0.5;
let textPadding = 40;

let lastActivation = 0;
let activationInterval = 300;
let maxActive = 15;

function preload() {
  for (let i = 1; i <= numImgs; i++) {
    imgs.push(loadImage(`img/img${i}.jpg`));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  isMobile = windowWidth <= 768;
  textFont('Helvetica Neue');
  textSize(24);
  textAlign(LEFT, CENTER);
  
  for (let img of imgs) {
    img.resize(width * mainCanvasScale, height * mainCanvasScale);
  }

  for (let i = 0; i < totalFragments; i++) {
    let img = random(imgs);
    let w = random(minSize, maxSize) * mainCanvasScale;
    let h = random(minSize, maxSize) * mainCanvasScale;
    let sx = floor(random(img.width - w));
    let sy = floor(random(img.height - h));
    let piece = img.get(sx, sy, w, h);
    let x = random(-width * 0.1, width * mainCanvasScale);
    let y = random(-height * 0.0015, height * mainCanvasScale);
    fragments.push(new Fragment(x, y, w, h, piece));
  }

  for (let i = 0; i < 30; i++) {
    fragments[i].timer = fragments[i].nextChange + 1;
  }
}

function draw() {
  background(255);

  if (fragments.length < maxTotalFragments) {
    if (frameCount % 50 === 0) {
      let img = random(imgs);
      let w = random(minSize, maxSize) * mainCanvasScale;
      let h = random(minSize, maxSize) * mainCanvasScale;
      let sx = floor(random(img.width - w));
      let sy = floor(random(img.height - h));
      let piece = img.get(sx, sy, w, h);
      let x = random(-width * 0.1, width * mainCanvasScale);
      let y = random(-height * 0.0015, height * mainCanvasScale);
      let newFrag = new Fragment(x, y, w, h, piece);

      newFrag.fadeProgress = 0;
      newFrag.nextImg = newFrag.currentImg;
      fragments.push(newFrag);
    }
  }

  if (millis() - lastActivation > activationInterval && activeFragments.length < maxActive) {
    let candidates = fragments.filter(f => !f.nextImg && f.timer > f.nextChange);
    if (candidates.length > 0) {
      let chosen = random(candidates);
      chosen.startFadeToNewImage();
      activeFragments.push(chosen);
      lastActivation = millis();
    }
  }

  push();
  translate((width - width * mainCanvasScale) / 2, (height - height * mainCanvasScale) / 2);
  for (let frag of fragments) {
    frag.update();
    frag.display();
  }
  pop();

  push();
  translate(width/2, height/2);
  drawRotatingText();
  pop();

  activeFragments = activeFragments.filter(f => f.nextImg !== null || f.fadeProgress > 0);
}


function drawRotatingText() {
  push();
  let padding = textPadding;
  let repetitions = 20;
  let totalLength = rotatingText.length * repetitions;
  let baseTextSize = 18;
  let maxScale = 1.9;
  let minScale = 0.7;

  for (let i = 0; i < totalLength; i++) {
    let currentChar = rotatingText[i % rotatingText.length];
    let charAngle = (i / totalLength) * TWO_PI + angle;
    let x = (width/2 + padding) * cos(charAngle);
    let y = (height/2 + padding) * sin(charAngle);

    let currentSize, alpha;
    if (isMobile) {
      currentSize = baseTextSize;
      alpha = 200;
    } else {
      let normalizedY = sin(charAngle);
      let sizeScale = map(normalizedY, -1, 1, minScale, maxScale);
      currentSize = baseTextSize * sizeScale;
      alpha = map(sizeScale, minScale, maxScale, 10, 255);
    }

    push();
    translate(x, y);
    rotate(charAngle + PI/2);
    textSize(currentSize);
    fill(0, alpha);
    text(currentChar, 0, 0);
    pop();
  }

  angle += 0.002;
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  isMobile = windowWidth <= 768;
  
  for (let img of imgs) {
    img.resize(width * mainCanvasScale, height * mainCanvasScale);
  }
}

class Fragment {
  constructor(x, y, w, h, img) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.targetX = x;
    this.targetY = y;
    this.targetW = w;
    this.targetH = h;
    this.currentImg = img;
    this.nextImg = null;
    this.timer = 0;
    this.nextChange = random(8000, 16000);
    this.fadeProgress = 0;
    this.fadeDuration = 2000;
    this.layerFade = 0.3;
  }

  display() {
    if (this.nextImg && this.fadeProgress < 1) {
      image(this.currentImg, this.x, this.y, this.w, this.h);
      push();
      tint(255, 255 * this.fadeProgress);
      image(this.nextImg, this.x, this.y, this.w, this.h);
      pop();
    } else {
      image(this.currentImg, this.x, this.y, this.w, this.h);
    }
  }

  update() {
    this.timer += deltaTime;

    if (this.nextImg) {
      this.fadeProgress += deltaTime / this.fadeDuration;
      // this.layerFade = min(this.layerFade + 0.01, 1);
      this.layerFade = min(this.layerFade + 0.01, 1);

      let moveSpeed = 0.00015;
      let amt = constrain(moveSpeed * deltaTime, 0, 1);

      this.x = lerp(this.x, this.targetX, amt);
      this.y = lerp(this.y, this.targetY, amt);
      this.w = lerp(this.w, this.targetW, amt);
      this.h = lerp(this.h, this.targetH, amt);

      if (this.fadeProgress >= 1) {
        this.currentImg = this.nextImg;
        this.nextImg = null;
        this.fadeProgress = 0;
        this.timer = 0;
        this.nextChange = random(8000, 16000);
        // this.nextChange = 80000;
      }
    } else {
      this.layerFade = max(this.layerFade - 0.01, 0.3);
    }
  }

  startFadeToNewImage() {
    let direction = random();
    
    if (direction < 0.5) {
      this.targetX = random(width);
    } else {
      this.targetX = this.x - random(100, 300); 
    }
    
    this.targetY = random(-height * 1.2, height * 1.2);
    
    let baseSize = random(minSize, maxSize);
    let ratio = random(0.3, 2.5);
    if (random() < 0.5) {
      this.targetW = baseSize * ratio;
      this.targetH = baseSize;
    } else {
      this.targetW = baseSize;
      this.targetH = baseSize * ratio;
    }
  
    let img = random(imgs);
    let sx = floor(random(max(1, img.width - this.targetW)));
    let sy = floor(random(max(1, img.height - this.targetH)));
    this.nextImg = img.get(sx, sy, this.targetW, this.targetH);
  
    this.fadeProgress = 0;
  
    let index = fragments.indexOf(this);
    if (index !== -1) {
      fragments.splice(index, 1);
      fragments.push(this);
    }
  }
  
  
  
}
