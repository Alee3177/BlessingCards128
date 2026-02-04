// host/js/ui.js
function $(id){ return document.getElementById(id); }

function setText(el, txt){ if(el) el.textContent = txt; }

function setBlink(el, on){
  if(!el) return;
  el.classList.toggle("blink", !!on);
}

function applyUIState(){
  const pill = $("sysPill");
  const idxPill = $("idxPill");
  const curPill = $("curPill");

  setText(pill, "狀態：" + state.system);

  const total = state.names.length;
  const done = state.usedName.length;
  setText(idxPill, `${done}/${total}`);

  const curName = (state.lastWinnerIndex != null && state.names[state.lastWinnerIndex]) ? state.names[state.lastWinnerIndex] : "-";
  const curVerse = (state.currentVerse && state.currentVerse.code) ? state.currentVerse.code : "-";
  setText(curPill, curName === "-" ? "-" : `${curName} / ${curVerse}`);

  const can = (window.__BC_MASTER__ && window.__BC_MASTER__.canAct && window.__BC_MASTER__.canAct());

  const btnLock = $("btnLock");
  const btnR1 = $("btnRound1");
  const btnR2 = $("btnRound2");
  const btnView = $("btnView");
  const btnNext = $("btnNext");
  const btnPdf = $("btnPdf");
  const btnReset = $("btnReset");
  const nameInput = $("nameInput");

  [btnLock, btnR1, btnR2, btnView, btnNext, btnPdf, btnReset].forEach(el=>{
    if(!el) return;
    el.disabled = !can ? true : el.disabled;
  });
  if (nameInput) nameInput.readOnly = !can;

  if (!can){
    setText($("masterHint"), "⚠ 目前不是主持機（被其他分頁/裝置佔用）");
  } else {
    setText($("masterHint"), "✅ 主持機在線");
  }

  if (state.system === SYS_STATE.INIT){
    btnLock.disabled = !can ? true : false;
    btnR1.disabled = true;
    btnR2.disabled = true;
    btnView.disabled = true;
    btnNext.disabled = true;
    btnPdf.disabled = true;
    setBlink(btnR1,false); setBlink(btnR2,false); setBlink(btnView,false); setBlink(btnNext,false); setBlink(btnPdf,false);
  }

  if (state.system === SYS_STATE.READY){
    btnLock.disabled = true;
    btnR1.disabled = !can ? true : false;
    btnR2.disabled = true;
    btnView.disabled = true;
    btnNext.disabled = true;
    btnPdf.disabled = true;
    setBlink(btnR1,true);
    setBlink(btnR2,false); setBlink(btnView,false); setBlink(btnNext,false); setBlink(btnPdf,false);
  }

  if (state.system === SYS_STATE.ROUND1){
    btnLock.disabled = true;
    btnR1.disabled = true;
    btnR2.disabled = !can ? true : false;
    btnView.disabled = true;
    btnNext.disabled = true;
    btnPdf.disabled = true;
    setBlink(btnR1,false);
    setBlink(btnR2,true);
    setBlink(btnView,false); setBlink(btnNext,false); setBlink(btnPdf,false);
  }

  if (state.system === SYS_STATE.ROUND2){
    btnLock.disabled = true;
    btnR1.disabled = true;
    btnR2.disabled = true;
    btnView.disabled = !can ? true : false;
    btnNext.disabled = true;
    btnPdf.disabled = true;
    setBlink(btnR1,false); setBlink(btnR2,false);
    setBlink(btnView,true);
    setBlink(btnNext,false); setBlink(btnPdf,false);
  }

  if (state.system === SYS_STATE.VIEWER){
    btnLock.disabled = true;
    btnR1.disabled = true;
    btnR2.disabled = true;
    btnView.disabled = true;
    btnNext.disabled = !can ? true : false;
    btnPdf.disabled = true;
    setBlink(btnView,false);
    setBlink(btnNext,true);
    setBlink(btnPdf,false);
  }

  if (state.system === SYS_STATE.FINISHED){
    btnLock.disabled = !can ? true : false;
    btnR1.disabled = true;
    btnR2.disabled = true;
    btnView.disabled = true;
    btnNext.disabled = true;
    btnPdf.disabled = !can ? true : false;
    setBlink(btnPdf,true);
    setBlink(btnR1,false); setBlink(btnR2,false); setBlink(btnView,false); setBlink(btnNext,false);
  }
}
