// host/js/ui.js
(() => {
  const $ = (id) => document.getElementById(id);

  function setText(id, text){
    const el = $(id);
    if (el) el.textContent = text;
  }

  function setDisabled(id, disabled){
    const b = $(id);
    if (b) b.disabled = !!disabled;
  }

  function applyUIState(){
    const s = window.state;
    const master = window.__BC_MASTER__?.canAct?.() === true;

    // master hint
    const hint = $("masterHint");
    if (hint){
      hint.textContent = master ? "主持機權限：✅ 已取得" : "目前不是主持機（只讀）";
      hint.className = master ? "muted okhint" : "muted warnhint";
    }

    // pills
    setText("sysPill", `狀態：${s.system}`);
    setText("idxPill", `${new Set(s.usedName||[]).size}/${(s.names||[]).length}`);
    const cur = (s.lastWinnerIndex>=0 && s.names && s.names[s.lastWinnerIndex]) ? s.names[s.lastWinnerIndex] : "-";
    setText("curPill", cur);

    // buttons enable rules
    setDisabled("btnLock", !master);
    setDisabled("btnReset", !master);

    setDisabled("btnRound1", !master || !s.locked || s.system !== SYS.ROUND1);
    setDisabled("btnRound2", !master || s.system !== SYS.ROUND2);
    setDisabled("btnView", !master || s.system !== SYS.VIEWER || !s.currentVerse);
    setDisabled("btnNext", !master || !s.locked || (s.system !== SYS.VIEWER && s.system !== SYS.ROUND1 && s.system !== SYS.FINISHED));
    setDisabled("btnPdf", !master || (s.logs||[]).length === 0);

    // textarea: allow edit only before locked
    const ni = $("nameInput");
    if (ni) ni.disabled = !!s.locked;

    // status lines (leave to main.js if present)
  }

  window.applyUIState = applyUIState;
})();
