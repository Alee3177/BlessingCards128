// host/js/wheel.js
(() => {

let canvas, ctx;
let segments = [];   // 🔥 不再預設 ["1","2"]
let rotation = 0;

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
    : [];
  drawWheel();
}

// =================
// 畫輪盤
// =================
function drawWheel(){

  if (!canvas || !ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0,0,W,H);

  // 🔥 若沒有資料，直接清空
  if (!segments.length) return;

  const cx = W/2;
  const cy = H/2;
  const R = Math.min(W,H) * 0.46;

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
// 轉動
// =================
function spinWheel(direction, options = {}, onDone){

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
    ((finalRotation - startRotation) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);

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
    } else {
      if (onDone) onDone(selectedValue);
    }
  }

  requestAnimationFrame(frame);
}

// =================
// 爆點版 Confetti
// =================
function launchConfetti(duration = 3000){

  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const particles = [];
  const colors = ["#f4b63a","#ffd86b","#ffb347","#fff3b0","#ffffff"];

  const end = Date.now() + duration;

  for (let i=0;i<140;i++){
    const angle = Math.random()*Math.PI*2;
    const speed = 4 + Math.random()*6;

    particles.push({
      x: W/2,
      y: H/2,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      size: 6 + Math.random()*6,
      gravity: 0.15 + Math.random()*0.2,
      color: colors[Math.floor(Math.random()*colors.length)]
    });
  }

  function frame(){

    ctx.clearRect(0,0,W,H);

    particles.forEach(p=>{
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x,p.y,p.size,p.size);
    });

    if (Date.now() < end){
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0,0,W,H);
    }
  }

  frame();
}

// =================
// 對外掛載
// =================
window.initWheel = initWheel;
window.drawWheel = drawWheel;
window.spinWheel = spinWheel;
window.__wheelSetSegments = setSegments;
window.launchConfetti = launchConfetti;

})();