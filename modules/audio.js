let unlocked = false;

export function unlockAudioOnce(audioEls){
  if (unlocked) return true;
  try{
    audioEls.forEach(a=>{
      if(!a) return;
      a.muted = true;
      const p = a.play();
      if(p && typeof p.then === "function"){
        p.then(()=>{
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        }).catch(()=>{});
      }
    });
    unlocked = true;
    console.log("🔓 Audio unlocked");
    return true;
  }catch(e){
    return false;
  }
}

export function safePlay(audioEl, ensureUnlockedFn){
  try{
    if (ensureUnlockedFn) ensureUnlockedFn();
    if(!audioEl) return;
    audioEl.currentTime = 0;
    const p = audioEl.play();
    if(p && typeof p.catch === "function"){
      p.catch(()=>{});
    }
  }catch(e){}
}