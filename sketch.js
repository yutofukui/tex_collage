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
let pendingFragments = [];

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

  if (frameCount % 603 === 0) {
    shuffleFragments();
  }

  if (frameCount % 50 === 0 && fragments.length < maxTotalFragments) {
    let img = random(imgs);
    let w = random(minSize, maxSize) * mainCanvasScale;
    let h = random(minSize, maxSize) * mainCanvasScale;
    let sx = floor(random(img.width - w));
    let sy = floor(random(img.height - h));
    let piece = img.get(sx, sy, w, h);
    let x = random(-width * 0.1, width * mainCanvasScale);
    let y = random(-height * 0.0015, height * mainCanvasScale);
    
    pendingFragments.push({
      img: piece,
      x: x,
      y: y,
      w: w,
      h: h,
      fadeInProgress: 0,
      isMoving: false
    });
  }

  for (let i = pendingFragments.length - 1; i >= 0; i--) {
    let pending = pendingFragments[i];
    pending.fadeInProgress += 0.01;
    
    if (pending.fadeInProgress >= 1) {
      let newFrag = new Fragment(pending.x, pending.y, pending.w, pending.h, pending.img);
      newFrag.fadeProgress = 0;
      newFrag.nextImg = newFrag.currentImg;
      fragments.push(newFrag);
      pendingFragments.splice(i, 1);
    }
  }

  for (let pending of pendingFragments) {
    push();
    translate(pending.x + pending.w/2, pending.y + pending.h/2);
    tint(255, 255 * pending.fadeInProgress);
    image(pending.img, -pending.w/2, -pending.h/2, pending.w, pending.h);
    pop();
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

function shuffleFragments() {
  let fragmentsToShuffle = [];
  let availableFragments = fragments.filter(f => !f.isFadingIn && !f.nextImg);
  
  for (let i = 0; i < min(60, availableFragments.length); i++) {
    let randomIndex = floor(random(availableFragments.length));
    fragmentsToShuffle.push(availableFragments[randomIndex]);
    availableFragments.splice(randomIndex, 1);
  }

  let positions = [];
  for (let frag of fragmentsToShuffle) {
    let maxDistance = min(width * 0.4, height * 0.4);
    let angle = random(TWO_PI);
    let distance = random(maxDistance * 0.4, maxDistance);
    
    positions.push({
      x: constrain(frag.x + cos(angle) * distance, -width * 0.1, width * mainCanvasScale),
      y: constrain(frag.y + sin(angle) * distance, -height * 0.0015, height * mainCanvasScale)
    });
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (let i = 0; i < fragmentsToShuffle.length; i++) {
    fragmentsToShuffle[i].targetX = positions[i].x;
    fragmentsToShuffle[i].targetY = positions[i].y;
    fragmentsToShuffle[i].moveDelay = random(0, 100);
    fragmentsToShuffle[i].isMoving = true;
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
    this.moveDelay = 0;
    this.isMoving = false;
    this.moveStartTime = 0;
    this.rotation = 0;
    this.moveProgress = 0;
    this.arcCenter = { x: 0, y: 0 };
    this.startAngle = 0;
    this.arcAngle = 0;
    this.radius = 0;
    this.initialRotation = this.rotation;
    this.initialX = x;
    this.initialY = y;
    this.isFadingIn = true;
    this.fadeInDuration = 1000;
  }

  update() {
    this.timer += deltaTime;

    if (this.isFadingIn) {
      this.fadeProgress += deltaTime / this.fadeInDuration;
      if (this.fadeProgress >= 1) {
        this.isFadingIn = false;
        this.fadeProgress = 0;
      }
      return;
    }

    if (this.isMoving) {
      if (this.moveStartTime === 0) {
        this.moveStartTime = millis();
        this.initialX = this.x;
        this.initialY = this.y;
        
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        let distance = dist(this.x, this.y, this.targetX, this.targetY);
        
        let arcDirection = random() < 0.5 ? 1 : -1;
        this.arcAngle = random(PI/3, PI) * arcDirection;
        
        let midX = (this.x + this.targetX) / 2;
        let midY = (this.y + this.targetY) / 2;
        let angle = atan2(dy, dx);
        let perpendicularAngle = angle + PI/2;
        
        this.radius = distance / (2 * sin(this.arcAngle/2));
        let centerDistance = this.radius * cos(this.arcAngle/2);
        
        this.arcCenter = {
          x: midX + cos(perpendicularAngle) * centerDistance * arcDirection,
          y: midY + sin(perpendicularAngle) * centerDistance * arcDirection
        };
        
        this.startAngle = atan2(this.y - this.arcCenter.y, this.x - this.arcCenter.x);
        this.moveProgress = 0;
      }

      if (millis() - this.moveStartTime > this.moveDelay) {
        let moveSpeed = 0.06;
        this.moveProgress = min(this.moveProgress + moveSpeed, 1);
        
        let t = this.moveProgress;
        t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        
        let currentAngle = this.startAngle + this.arcAngle * t;
        this.x = this.arcCenter.x + cos(currentAngle) * this.radius;
        this.y = this.arcCenter.y + sin(currentAngle) * this.radius;
        
        let targetRotation = currentAngle + PI/2;
        this.rotation = lerp(this.initialRotation, targetRotation, t);

        if (this.moveProgress >= 1) {
          this.isMoving = false;
          this.moveStartTime = 0;
          this.initialRotation = this.rotation;
        }
      }
    }

    if (this.nextImg) {
      this.fadeProgress += deltaTime / this.fadeDuration;
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
      }
    } else {
      this.layerFade = max(this.layerFade - 0.01, 0.3);
    }
  }

  display() {
    push();
    translate(this.x + this.w/2, this.y + this.h/2);
    rotate(this.rotation);
    if (this.isFadingIn) {
      tint(255, 255 * this.fadeProgress);
      image(this.currentImg, -this.w/2, -this.h/2, this.w, this.h);
    } else if (this.nextImg && this.fadeProgress < 1) {
      image(this.currentImg, -this.w/2, -this.h/2, this.w, this.h);
      push();
      tint(255, 255 * this.fadeProgress);
      image(this.nextImg, -this.w/2, -this.h/2, this.w, this.h);
      pop();
    } else {
      image(this.currentImg, -this.w/2, -this.h/2, this.w, this.h);
    }
    pop();
  }

  startFadeToNewImage() {
    if (this.isFadingIn) return;
    
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
