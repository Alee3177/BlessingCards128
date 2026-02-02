"use strict";
document.addEventListener("DOMContentLoaded",()=>{
  try{
    console.log("🟢 BOOT: INIT");
    drawInitialWheel();                 // ✅ 永遠先畫 INIT 輪盤（不死）
    if(typeof initStateMachine==="function") initStateMachine();
    setTimeout(()=>{ try{ startPreload(); }catch(e){ console.warn("preload failed",e);} },0);
  }catch(e){
    console.error("BOOT FAILED",e);
    alert("系統初始化失敗，請重新整理");
  }
});
