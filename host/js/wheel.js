// ================================
// BlessingCards128 - Wheel Engine (Stable Minimal)
// ================================

let canvas, ctx;
let segments = [];
let rotation = 0;
let spinning = false;

// 工具
function pickRandom(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}

// ================================
// 初始化輪盤（保命綁定版）
// ================================
function initWheel(list = []) {
  console.log("🎡 initWheel called");

  canvas =
    document.getElementById("wheel") ||
    document.getElementById("wheelCanvas") ||
    document.querySelector("canvas");

  if (!canvas) {
    console.error("❌ wheel canvas not found (no <canvas> in DOM)");
    return;
  }

  ctx = canvas.getContext("2d");

  segments = Array.isArray(list) && list.length
    ? list.slice()
    : ["1", "2"]; // 保命預設，避免空輪盤

  rotation = 0;
  drawWheel();

  console.log("✅ wheel canvas bound:", canvas.id || "(no id)");
}

// ================================
// 繪製輪盤
// ================================
function drawWheel() {
  if (!ctx || !canvas) return;

  const w = canvas.width;
  const h = canvas.height;
  const r = Math.min(w, h) / 2 - 10;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const step = (Math.PI * 2) / segments.length;

  segments.forEach((label, i) => {
    const start = i * step;
    const end = start + step;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, start, end);
    ctx.fillStyle = i % 2 === 0 ? "#FFE3A3" : "#FFD36E";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    // 文字
    ctx.save();
    ctx.rotate(start + step / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#333";
    ctx.font = "16px sans-serif";
    ctx.fillText(label, r - 10, 6);
    ctx.restore();
  });

  ctx.restore();
}

// ================================
// 轉動輪盤
// ================================
function spinWheel(onFinish) {
  if (spinning) return;
  spinning = true;

  const rounds = 6 + Math.random() * 4;
  const target =
    rounds * Math.PI * 2 +
    Math.random() * Math.PI * 2;

  const start = performance.now();
  const duration = 3000;

  function frame(t) {
    const p = Math.min((t - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);

    rotation = ease * target;
    drawWheel();

    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      spinning = false;

      const step = (Math.PI * 2) / segments.length;
      const index =
        Math.floor(
          (segments.length -
            ((rotation % (Math.PI * 2)) / step)) %
            segments.length
        );

      const value = segments[index];

      console.log("🎯 Wheel result:", value);
      if (typeof onFinish === "function") {
        onFinish(value, index);
      }
    }
  }

  requestAnimationFrame(frame);
}

// ================================
// 對外掛載（生死線）
// ================================
window.initWheel = initWheel;
window.spinWheel = spinWheel;
window.pickRandom = pickRandom;