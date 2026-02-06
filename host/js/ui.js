// host/js/ui.js
(() => {

  const $ = (id) => document.getElementById(id);

  function setText(id, text){
    const el = $(id);
    if (el) el.textContent = text;
  }

  function setDisabled(id, disabled){
    const el = $(id);
    if (el) el.disabled = !!disabled;
  }

  function applyUIState(){

    if (!window.state) return;

    const s = window.state;
    const master = window.__BC_MASTER__?.canAct?.() === true;

    // ========================
    // 主持鎖顯示
    // ========================
    const hint = $("masterHint");
    if (hint){
      if (master){
        hint.textContent = "主持機權限：✅ 已取得";
        hint.className = "muted okhint";
      } else {
        hint.textContent = "目前不是主持機（只讀）";
        hint.className = "muted warnhint";
      }
    }

    // ========================
    // 狀態顯示
    // ========================
    setText("sysPill", `狀態：${s.system}`);
    setText("idxPill",
      `${new Set(s.usedName||[]).size}/${(s.names||[]).length}`
    );

    const cur =
      (s.lastWinnerIndex >= 0 &&
       s.names &&
       s.names[s.lastWinnerIndex])
        ? s.names[s.lastWinnerIndex]
        : "-";

    setText("curPill", cur);

    // ========================
    // 按鈕規則
    // ========================
    setDisabled("btnLock", !master);
    setDisabled("btnReset", !master);
    setDisabled("btnUnlock", false); // 強制解除永遠可按

    setDisabled("btnRound1",
      !master || !s.locked || s.system !== SYS.ROUND1
    );

    setDisabled("btnRound2",
      !master || s.system !== SYS.ROUND2
    );

    setDisabled("btnView",
      !master || s.system !== SYS.VIEWER || !s.currentVerse
    );

    setDisabled("btnNext",
      !master || !s.locked ||
      !(s.system === SYS.VIEWER ||
        s.system === SYS.ROUND1 ||
        s.system === SYS.FINISHED)
    );

    setDisabled("btnPdf",
      !master || (s.logs||[]).length === 0
    );

    // ========================
    // 名單輸入框
    // ========================
    const ni = $("nameInput");
    if (ni){
      ni.disabled = !!s.locked;
    }

  }

  window.applyUIState = applyUIState;

})();