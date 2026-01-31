// requestAnimationFrame spinner with "generation token" to kill zombie animations
export function createSpinner({ draw, ease, durationMs=2600 }){
  let animId = null;
  let spinToken = 0;
  let rotating = false;

  function cancel(){
    spinToken++;
    rotating = false;
    if(animId){
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function spin({ baseRotation, slices, targetIndex, clockwise=true, onFinish }){
    if(!slices || slices<=0) return;
    const myToken = ++spinToken;
    // kill any previous spin regardless of "rotating" flag
    cancel();

    rotating = true;

    const base = baseRotation;
    const fullTurns = 6 * Math.PI;
    const step = 2 * Math.PI / slices;
    const delta = (clockwise ? 1 : -1) * (fullTurns + targetIndex * step);
    const end = base + delta;

    const start = performance.now();
    const hardStopAt = start + durationMs + 350;
    let finished = false;

    const failSafeId = setTimeout(()=>{
      if(myToken !== spinToken) return;
      if(finished) return;
      console.warn("🧯 spin failsafe → force finish");
      finish(performance.now(), true);
    }, durationMs + 1400);

    function finish(now, forced=false){
      if(myToken !== spinToken) return;
      if(finished) return;
      finished = true;
      clearTimeout(failSafeId);
      if(animId){ cancelAnimationFrame(animId); animId=null; }
      rotating = false;
      // snap to end
      draw(end);
      try{ onFinish?.({ endRotation: end, forced }); }catch(e){}
    }

    function frame(now){
      if(myToken !== spinToken) return; // zombie self-kill
      if(finished) return;

      if(now >= hardStopAt){ finish(now, true); return; }

      let t = (now - start) / durationMs;
      if(t < 0) t = 0;
      if(t >= 1){ finish(now, false); return; }

      const r = base + delta * ease(t);
      draw(r);
      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);
  }

  return { spin, cancel, get rotating(){ return rotating; } };
}