// host/js/wheel.js
(() => {

let canvas, ctx;
let segments = ["1","2"];
let rotation = 0;

function normalizeAngle(a){
    return ((a % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
  }

// ⭐ 轉盤動畫長度 = drum.mp3 秒數
const SPIN_DURATION = 10000;

// =================
// Canvas 綁定
// =================
function bindCanvas(){
  canvas = document.getElementById("wheelCanvas") ||
           document.getElementById("wheel");
  if (!canvas) return false;

  ctx = canvas.getContext("2d");
  return true;
}

// =================
// 設定 UI 格數
// =================
function setSegments(list){
  segments = (Array.isArray(list) && list.length)
    ? list.slice()
    : ["1","2"];

  drawWheel();
}

// =================
// 畫輪盤
// =================
function drawWheel(){

  if (!canvas || !ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W/2;
  const cy = H/2;
  const R = Math.min(W,H) * 0.46;

  ctx.clearRect(0,0,W,H);

  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(rotation);

  const N = segments.length;
  const step = (Math.PI*2)/N;

  for (let i=0;i<N;i++){

    const a0 = i*step;
    const a1 = a0 + step;

    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,R,a0,a1);
    ctx.closePath();

    ctx.fillStyle = i%2 ? "#f7dea2" : "#f5c64d";
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,.2)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // label
    ctx.save();
    ctx.rotate(a0 + step/2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#222";
    ctx.font = "26px Noto Sans TC, system-ui";

    ctx.fillText(String(segments[i]), R-14, 8);

    ctx.restore();
  }

  // 中央圓
  ctx.beginPath();
  ctx.arc(0,0,R*0.2,0,Math.PI*2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.restore();
}

// =================
// 初始化
// =================
function initWheel(list){

  if (!bindCanvas()) return;

  setSegments(list);
  rotation = 0;
  drawWheel();
}

// =================
// easing
// =================
function easeOutCubic(t){
  return 1 - Math.pow(1-t,3);
}

// =================
// 角度正規化
// =================
function spinWheel(direction, options = {}, onDone){

  // 向後相容
  if (typeof options === "function"){
    onDone = options;
    options = {};
  }

  if (!canvas || !ctx) bindCanvas();

  const pickList = options.pickFrom || segments;
  const N = pickList.length;
  if (!N) return;

  const uiSlots = segments.slice();
  const slotCount = uiSlots.length;

  const targetIndex = Math.floor(Math.random()*N);
  const selectedValue = pickList[targetIndex];

  const slotIndex = uiSlots.indexOf(selectedValue);
  const visualIndex =
    slotIndex >= 0
      ? slotIndex
      : targetIndex % slotCount;

  const step = (Math.PI*2)/slotCount;
  const targetAngle = visualIndex*step + step/2;

  const finalRotation = -Math.PI/2 - targetAngle;

  const startRotation = rotation;

  const spins = 6 + Math.random()*2;
  const delta = direction * spins * Math.PI*2;

  const landingAdjust =
    normalizeAngle(finalRotation - startRotation);

  const endRotation =
    startRotation + delta + landingAdjust;

  const startTime = performance.now();

  function frame(now){

    const t = Math.min(1,(now-startTime)/SPIN_DURATION);
    const k = easeOutCubic(t);

    rotation =
      startRotation + (endRotation-startRotation)*k;

    drawWheel();

    if (t < 1){
      requestAnimationFrame(frame);
    }
else{
  // 不再強制重設 rotation
  // 讓最後一幀自然停住

  if (onDone) onDone(selectedValue);
}
  }

  requestAnimationFrame(frame);
}

// =================
// 對外掛載
// =================
window.initWheel = initWheel;
window.drawWheel = drawWheel;
window.spinWheel = spinWheel;
window.__wheelSetSegments = setSegments;


// =================
// Confetti
// =================
function launchConfetti(){

  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const pieces = [];

  for (let i=0;i<80;i++){
    pieces.push({
      x: Math.random()*W,
      y: -20,
      size: 6 + Math.random()*6,
      speed: 2 + Math.random()*3,
      angle: Math.random()*Math.PI*2,
      color: ["#f4b63a","#ffd86b","#ff7f50","#5ad1ff"][Math.floor(Math.random()*4)]
    });
  }

  let frame = 0;

  function draw(){

    ctx.clearRect(0,0,W,H);

    pieces.forEach(p=>{
      p.y += p.speed;
      p.x += Math.sin(p.angle)*1.5;

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x,p.y,p.size,p.size);
    });

    frame++;

    if (frame < 180){
      requestAnimationFrame(draw);
    }else{
      ctx.clearRect(0,0,W,H);
    }
  }

  draw();
}

window.launchConfetti = launchConfetti;

})();