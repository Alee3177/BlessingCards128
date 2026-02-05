// host/js/ui.js
(() => {
  // DOM cache
  const $ = (id)=>document.getElementById(id);

  function setBlink(el, on){
    if (!el) return;
    el.classList.toggle("blink", !!on);
  }

  function renderPills(){
    $("sysPill").textContent = `狀態：${state.system}`;
    $("idxPill").textContent = `${state.usedName.length}/${state.names.length || 0}`;
    $("curPill").textContent = state.lastWinnerName ? state.lastWinnerName : "-";
  }

  function renderLogs(){
    const box = $("logBox");
    if (!box) return;
    if (!state.logs.length) { box.textContent="(尚無)"; return; }
    const lines = state.logs.map(l=>{
      return `[${l.t}] ${l.name} -> ${l.verse}` + (l.ref ? ` | ${l.ref}` : "");
    });
    box.textContent = lines.join("\n");
  }

  function applyUIState(){
    const isMaster = window.__BC_MASTER__ ? window.__BC_MASTER__.canAct() : true;

    const btnLock = $("btnLock");
    const btnR1 = $("btnRound1");
    const btnR2 = $("btnRound2");
    const btnView = $("btnView");
    const btnNext = $("btnNext");
    const btnPdf = $("btnPdf");
    const btnReset = $("btnReset");
    const ta = $("nameInput");

    // Master hint
    const hint = $("masterHint");
    if (hint){
      hint.textContent = isMaster ? "✅ 主持機在線" : "⚠ 目前不是主持機（可觀看但不可操作）";
    }

    // Default disable all actions if not master
    const lockable = isMaster;

    ta.disabled = !lockable || state.locked;

    btnLock.disabled = !lockable || state.locked;
    btnR1.disabled = !lockable || !state.locked || state.system !== SYS_STATE.ROUND1;
    btnR2.disabled = !lockable || !state.locked || state.system !== SYS_STATE.ROUND2;
    btnView.disabled = !lockable || !state.locked || state.system !== SYS_STATE.VIEWER || !state.currentVerse;
    btnNext.disabled = !lockable || !state.locked || (state.system !== SYS_STATE.ROUND1 && state.system !== SYS_STATE.FINISHED);
    btnPdf.disabled = !lockable || !state.logs.length || state.system !== SYS_STATE.FINISHED;
    btnReset.disabled = !lockable;

    // Blink rules
    setBlink(btnR1, state.system === SYS_STATE.ROUND1);
    setBlink(btnR2, state.system === SYS_STATE.ROUND2);
    setBlink(btnView, state.system === SYS_STATE.VIEWER);
    setBlink(btnPdf, state.system === SYS_STATE.FINISHED && state.logs.length);

    // Status line
    const status = $("statusLine");
    const center = $("centerLine");
    if (status){
      if (!state.locked) status.textContent = "請輸入姓名並鎖定名單";
      else if (state.system === SYS_STATE.ROUND1) status.textContent = "請開始第一輪抽姓名";
      else if (state.system === SYS_STATE.ROUND2) status.textContent = "請開始第二輪抽紅包";
      else if (state.system === SYS_STATE.VIEWER) status.textContent = "請按「看紅包」讓參與者看到並下載";
      else if (state.system === SYS_STATE.FINISHED) status.textContent = "本輪已完成，可下載 PDF 或全部歸零開始新一輪";
      else status.textContent = "系統初始化中…";
    }
    if (center){
      if (state.system === SYS_STATE.ROUND2 && state.currentVerse){
        const ref = (window.VERSE_REF_MAP && window.VERSE_REF_MAP[state.currentVerse]) ? window.VERSE_REF_MAP[state.currentVerse] : "";
        center.textContent = `📜 抽中經句「${state.currentVerse}」` + (ref ? `\n📖 ${ref}` : "");
      } else {
        center.textContent = "";
      }
    }

    renderPills();
    renderLogs();
  }

  window.applyUIState = applyUIState;
})();
