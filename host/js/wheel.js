// =======================================
// BlessingCards128 — Wheel Engine
// Production Locked Build
// =======================================


// ================================
// Canvas & SVG
// ================================
const wheel = document.getElementById("wheel");
const ctx = wheel ? wheel.getContext("2d") : null;
const hlSVG = document.getElementById("hl-svg");

const confettiCanvas = document.getElementById("confettiCanvas");
const confCtx = confettiCanvas
  ? confettiCanvas.getContext("2d")
  : null;

// ================================
// 幾何常數
// ================================
export const SIZE = 360;
export const CENTER = SIZE / 2;
export const R = CENTER - 10;

// ================================
// 動畫保命層
// ================================
let animId = null;
let spinToken = 0;
let rotating = false;
let rotation = 0;

// ================================
// 初始化
// ================================
export function initWheel() {
  if (!ctx) return;
  drawInitialWheel();
}

// ================================
// 初始樣式：單圓＋半徑線（你鎖死的版本）
// ================================
export function drawInitialWheel() {
  if (!ctx) return;

  ctx.clearRect(0, 0, SIZE, SIZE);

  ctx.beginPath();
  ctx.arc(CENTER, CENTER, R, 0, Math.PI * 2);
  ctx.fillStyle = "#fcdca0";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(CENTER, CENTER, R, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(CENTER, CENTER);
  ctx.lineTo(CENTER, CENTER - (R - 2));
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
}

// ================================
// 畫姓名輪盤（你鎖死的版本）
// ================================
export function drawWheel(angle = rotation) {
  if (!ctx) return;

  ctx.clearRect(0, 0, SIZE, SIZE);

  const names = state.names;
  if (!names.length) {
    drawInitialWheel();
    return;
  }

  const n = names.length;
  const arc = (2 * Math.PI) / n;

  ctx.save();
  ctx.translate(CENTER, CENTER);
  ctx.rotate(angle);
  ctx.translate(-CENTER, -CENTER);

  for (let i = 0; i < n; i++) {
    const s = i * arc - Math.PI / 2 - arc / 2;
    const e = s + arc;

    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, R, s, e);
    ctx.closePath();

    ctx.fillStyle = i % 2 ? "#fde6b4" : "#fcdca0";
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(s + arc / 2);
    ctx.textAlign = "right";
    ctx.font = "18px Noto Sans TC";
    ctx.fillStyle = "#5b3a00";
    ctx.fillText(names[i], R - 14, 6);
    ctx.restore();
  }

  ctx.restore();
}

// ================================
// 高亮
// ================================
export function clearHL() {
  if (hlSVG) hlSVG.innerHTML = "";
}

export function showHL(i) {
  if (i == null || !state.names.length || !hlSVG) return;

  const n = state.names.length;
  const arc = (2 * Math.PI) / n;

  const s = i * arc - Math.PI / 2 + rotation - arc / 2;
  const e = s + arc;

  const x1 = CENTER + R * Math.cos(s);
  const y1 = CENTER + R * Math.sin(s);
  const x2 = CENTER + R * Math.cos(e);
  const y2 = CENTER + R * Math.sin(e);

  const p = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  p.setAttribute(
    "d",
    `M${CENTER} ${CENTER} L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`
  );
  p.setAttribute("fill", "rgba(255,210,50,0.55)");
  p.setAttribute("class", "blink");

  hlSVG.appendChild(p);
}

// ================================
// Ease
// ================================
function ease(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ================================
// 彩帶 FX
// ================================
export function launchConfetti() {
  if (!confCtx) return;

  const pieces = [];
  const colors = ["#ffd54f", "#ffb300", "#ffca28", "#ffe082"];

  for (let i = 0; i < 100; i++) {
    pieces.push({
      x: Math.random() * SIZE,
      y: Math.random() * -80,
      w: 4 + Math.random() * 5,
      h: 8 + Math.random() * 10,
      vx: -1 + Math.random() * 2,
      vy: 2 + Math.random() * 3,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  const start = performance.now();
  const duration = 1800;

  function frame(now) {
    const t = now - start;
    confCtx.clearRect(0, 0, SIZE, SIZE);

    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;

      confCtx.save();
      confCtx.translate(p.x, p.y);
      confCtx.rotate(p.r);
      confCtx.fillStyle = p.color;
      confCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      confCtx.restore();
    });

    if (t < duration) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

// ================================
// 核心：Spin 引擎（防死機）
// ================================
export function spin(list, clockwise, callback, options = {}) {
  if (!list.length) return;

  const DURATION = options.duration || 2800;

  // 🔐 世代鎖
  const myToken = ++spinToken;

  // 🛑 作廢舊動畫
  if (rotating) {
    spinToken++;
  }

  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }

  rotating = true;
  // applyUIState() moved to main.js

  const target = list[Math.floor(Math.random() * list.length)];
  const idx = list.indexOf(target);

  const base = rotation;
  const delta =
    (clockwise ? 1 : -1) *
    (6 * Math.PI + idx * ((2 * Math.PI) / list.length));

  const end = base + delta;
  const start = performance.now();
  const hardStopAt = start + DURATION + 300;

  let finished = false;

  // 🧯 最終保險
  const failSafe = setTimeout(() => {
    if (myToken !== spinToken) return;
    if (!finished) finish();
  }, DURATION + 1200);

  function finish() {
    if (myToken !== spinToken) return;
    if (finished) return;

    finished = true;
    clearTimeout(failSafe);

    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }

    rotation = end;
    drawWheel(rotation);

    rotating = false;

    try {
      callback(target, idx);
    } catch (e) {
      console.error("❌ spin callback crashed:", e);
    }

    saveState();
    // applyUIState() moved to main.js
  }

  function frame(now) {
    if (myToken !== spinToken) return;
    if (finished) return;

    if (now >= hardStopAt) {
      finish();
      return;
    }

    let t = (now - start) / DURATION;
    if (t < 0) t = 0;

    if (t >= 1) {
      finish();
      return;
    }

    rotation = base + delta * ease(t);
    drawWheel(rotation);

    animId = requestAnimationFrame(frame);
  }

  animId = requestAnimationFrame(frame);
}

// ================================
// 外部控制
// ================================
export function forceStop() {
  spinToken++;
  rotating = false;

  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }

  clearHL();
  drawInitialWheel();
}