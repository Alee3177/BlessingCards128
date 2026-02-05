// host/js/wheel.js
(() => {
  let canvas, ctx;
  let segments = ["1","2"];
  let rotation = 0; // radians

  function bindCanvas(){
    canvas = document.getElementById("wheelCanvas");
    if (!canvas) return false;
    ctx = canvas.getContext("2d");
    return true;
  }

  function setSegments(list){
    segments = (Array.isArray(list) && list.length) ? list.slice() : ["1","2"];
  }

  function drawWheel(){
    if (!canvas || !ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2;
    const R = Math.min(W,H)*0.46;

    ctx.clearRect(0,0,W,H);

    // outer ring
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
      ctx.fillStyle = (i%2===0) ? "#f5c64d" : "#f7dea2";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.18)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // label
      ctx.save();
      ctx.rotate(a0 + step/2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#1f2937";
      ctx.font = "26px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC";
      const label = String(segments[i]);
      ctx.fillText(label, R-16, 10);
      ctx.restore();
    }

    // center disc
    ctx.beginPath();
    ctx.arc(0,0,R*0.22,0,Math.PI*2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.1)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.font = "20px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC";
    ctx.textAlign = "center";
    ctx.fillText("BlessingCards128", 0, 8);

    ctx.restore();
  }

  function initWheel(list){
    if (!bindCanvas()) return;
    setSegments(list);
    rotation = 0;
    drawWheel();
  }

  // Easing
  function easeOutCubic(t){ return 1 - Math.pow(1-t,3); }

  // Spin and return selected value
  function spinWheel(direction, onDone){
    if (!canvas || !ctx) bindCanvas();
    const N = segments.length;
    if (N <= 0) return;

    // choose target index randomly (selection independent of pointer)
    const targetIndex = Math.floor(Math.random()*N);

    // land so that target label is near top (12 o'clock). We define top angle = -PI/2 in wheel coords
    const step = (Math.PI*2)/N;
    const targetAngle = (targetIndex*step + step/2); // center angle of segment
    const desired = -Math.PI/2 - targetAngle; // rotation so that segment center goes to top

    const spins = 6 + Math.floor(Math.random()*3); // 6-8 turns
    const start = rotation;
    const end = desired + direction*(Math.PI*2)*spins;

    const dur = 1600;
    const t0 = performance.now();

    function frame(now){
      const t = Math.min(1, (now - t0)/dur);
      const k = easeOutCubic(t);
      rotation = start + (end-start)*k;
      drawWheel();
      if (t < 1){
        requestAnimationFrame(frame);
      } else {
        // normalize
        rotation = ((rotation % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
        drawWheel();
        const val = segments[targetIndex];
        if (onDone) onDone(val);
      }
    }
    requestAnimationFrame(frame);
  }

  window.initWheel = initWheel;
  window.drawWheel = drawWheel;
  window.spinWheel = spinWheel;
  window.__wheelSetSegments = setSegments;
})();
