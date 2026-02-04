// ================================
// 🎡 Wheel Engine (Stable Minimal)
// ================================
let canvas, ctx;
let segments = [];
let rotation = 0;
let rotating = false;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ================================
// 初始化輪盤
// ================================
function initWheel(list = []) {
  console.log("🎡 initWheel called");

  canvas =
    document.getElementById("wheel") ||
    document.getElementById("wheelCanvas") ||
    document.querySelector("canvas");

  if (!canvas) {
    console.error("❌ wheel canvas not found");
    return;
  }

  ctx = canvas.getContext("2d");

  segments = Array.isArray(list) && list.length
    ? list.slice()
    : ["1", "2"]; // 保命預設

  rotation = 0;
  drawWheel();
}

// ================================
// 畫輪盤
// ================================
function drawWheel() {
  if (!ctx || !canvas) return;

  const w = canvas.width;
  const h = canvas.height;
  const r = Math.min(w, h) / 2;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rotation);

  const step = (Math.PI * 2) / segments.length;

  for (let i = 0; i < segments.length; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, i * step, (i + 1) * step);
    ctx.fillStyle = i % 2 === 0 ? "#FFD77A" : "#FFE8A8";
    ctx.fill();
    ctx.stroke();

    // 文字
    ctx.save();
    ctx.rotate(i * step + step / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#333";
    ctx.font = "16px sans-serif";
    ctx.fillText(segments[i], r - 10, 6);
    ctx.restore();
  }

  ctx.restore();
}

// ================================
// 轉動動畫
// ================================
function spin(list, _dummy, cb) {
  if (rotating) return;
  rotating = true;

  if (Array.isArray(list) && list.length) {
    segments = list.slice();
  }

  const result = pickRandom(segments);

  const spins = 5 + Math.random() * 3; // 5~8 圈
  const targetIndex = segments.indexOf(result);
  const step = (Math.PI * 2) / segments.length;
  const targetAngle = spins * Math.PI * 2 - targetIndex * step;

  const start = performance.now();
  const duration = 2500;

  function animate(t) {
    const p = Math.min((t - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);

    rotation = ease * targetAngle;
    drawWheel();

    if (p < 1) {
      requestAnimationFrame(animate);
    } else {
      rotating = false;
      console.log("🎯 Spin result:", result);
      if (typeof cb === "function") cb(result);
    }
  }

  requestAnimationFrame(animate);
}

// ================================
// 對外掛載（生死線）
// ================================
window.initWheel = initWheel;
window.spin = spin;
window.pickRandom = pickRandom;