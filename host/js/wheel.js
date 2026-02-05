// host/js/wheel.js
(() => {
  let canvas, ctx;
  let segments = ["1","2"];
  let rotation = 0; // radians

  function getCanvas(){
    return document.getElementById("wheelCanvas");
  }

  function setSegments(list){
    segments = (Array.isArray(list) && list.length) ? list.slice() : ["1","2"];
  }

  function drawWheel(){
    if (!canvas) return;
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2;
    const r = Math.min(cx,cy) - 8;

    ctx.clearRect(0,0,w,h);

    // rim
    ctx.save();
    ctx.beginPath(); ctx.arc(cx,cy,r+2,0,Math.PI*2); ctx.strokeStyle="#e7ddcf"; ctx.lineWidth=6; ctx.stroke();
    ctx.restore();

    const n = segments.length;
    const a = (Math.PI*2)/n;

    for (let i=0;i<n;i++){
      const start = rotation + i*a;
      const end = start + a;

      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,start,end);
      ctx.closePath();
      ctx.fillStyle = (i%2===0) ? "#f7d37a" : "#f3c668";
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // label
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(start + a/2);
      ctx.textAlign="right";
      ctx.fillStyle="#4c3b2a";
      ctx.font="16px system-ui, -apple-system, 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
      const label = String(segments[i]);
      ctx.fillText(label.length>18? label.slice(0,18)+"…" : label, r-14, 6);
      ctx.restore();
    }

    // center cap
    ctx.beginPath();
    ctx.arc(cx,cy,52,0,Math.PI*2);
    ctx.fillStyle="#fff";
    ctx.fill();
    ctx.strokeStyle="#e7ddcf";
    ctx.lineWidth=2;
    ctx.stroke();

    ctx.fillStyle="#7a6b5c";
    ctx.font="12px system-ui, -apple-system, 'Noto Sans TC', sans-serif";
    ctx.textAlign="center";
    ctx.fillText("BlessingCards128", cx, cy+4);
  }

  function initWheel(list){
    canvas = getCanvas();
    if (!canvas) {
      console.error("❌ wheel canvas not found");
      return;
    }
    ctx = canvas.getContext("2d");
    setSegments(list);
    rotation = 0;
    drawWheel();
  }

  // Choose index at top (12 o'clock). Rotation increases clockwise? Canvas rotation uses rad clockwise? It's clockwise when positive? actually canvas arc uses standard (clockwise with +?) We'll just compute with rotation.
  function currentIndex(){
    const n = segments.length;
    const a = (Math.PI*2)/n;
    // pointer at -Math.PI/2 (top). compute relative angle
    let ang = (-Math.PI/2 - rotation) % (Math.PI*2);
    if (ang < 0) ang += Math.PI*2;
    const idx = Math.floor(ang / a) % n;
    return idx;
  }

  function easeOutCubic(t){ return 1 - Math.pow(1-t,3); }

  function spinWheel(options){
    const {
      durationMs = 3800,
      minTurns = 6,
      maxTurns = 9,
      onDone
    } = options || {};

    const turns = (Math.random()*(maxTurns-minTurns)+minTurns);
    const extra = Math.random() * Math.PI*2;
    const startRot = rotation;
    const targetRot = startRot + turns*Math.PI*2 + extra;

    const start = performance.now();

    function frame(now){
      const t = Math.min(1, (now-start)/durationMs);
      rotation = startRot + (targetRot-startRot)*easeOutCubic(t);
      drawWheel();
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        // snap
        rotation = targetRot % (Math.PI*2);
        drawWheel();
        const idx = currentIndex();
        const value = segments[idx];
        if (typeof onDone === "function") onDone({index: idx, value});
      }
    }
    requestAnimationFrame(frame);
  }

  window.initWheel = initWheel;
  window.spinWheel = spinWheel;
  window.__wheelSetSegments = setSegments;
})();
