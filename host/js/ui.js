// host/js/ui.js
(() => {
  const $ = (id) => document.getElementById(id);

  function setBlink(el, on){
    if (!el) return;
    if (on) el.classList.add("blink");
    else el.classList.remove("blink");
  }

  function renderLog(){
    const box = $("logBox");
    if (!box) return;
    const logs = (window.state && Array.isArray(window.state.logs)) ? window.state.logs : [];
    if (!logs.length){ box.textContent = "（尚無）"; return; }
    box.textContent = logs.map(x => `[${x.t}] ${x.name} -> ${x.code}` + (x.ref?` | ${x.ref}`:"")).join("\n");
  }

  function applyUIState(){
    const s = window.state;
    const SYS = window.SYS;
    const canAct = window.__BC_MASTER__?.canAct?.() ?? true;

    const btnLock = $("btnLock");
    const btnR1 = $("btnRound1");
    const btnR2 = $("btnRound2");
    const btnView = $("btnView");
    const btnNext = $("btnNext");
    const btnPdf = $("btnPdf");
    const btnReset = $("btnReset");

    const sysPill = $("sysPill");
    const idxPill = $("idxPill");
    const curPill = $("curPill");
    const statusLine = $("statusLine");
    const centerLine = $("centerLine");

    if (sysPill) sysPill.textContent = "狀態：" + (s.system || SYS.INIT);

    const total = s.names.length;
    const used = new Set(s.usedName || []);
    if (idxPill) idxPill.textContent = `${used.size}/${total}`;
    if (curPill){
      curPill.textContent = (s.lastWinnerIndex >= 0 && s.names[s.lastWinnerIndex]) ? s.names[s.lastWinnerIndex] : "-";
    }

    // lock input in non-master
    if (!canAct){
      [btnLock, btnR1, btnR2, btnView, btnNext, btnPdf, btnReset].forEach(b => { if (b) b.disabled = true; });
      if (statusLine) statusLine.textContent = "目前不是主持機（只讀）。";
      renderLog();
      return;
    }

    // clear all blinks
    [btnLock, btnR1, btnR2, btnView, btnNext, btnPdf, btnReset].forEach(b => setBlink(b,false));

    // default disable all, then enable by state
    [btnR1, btnR2, btnView, btnNext, btnPdf].forEach(b => { if (b) b.disabled = true; });

    if (btnLock) btnLock.disabled = false;
    if (btnReset) btnReset.disabled = false;

    if (!s.locked || s.system === SYS.INIT){
      if (statusLine) statusLine.textContent = "請輸入姓名並鎖定名單";
      if (centerLine) centerLine.textContent = "";
      if (btnR1) btnR1.disabled = true;
      if (btnR2) btnR2.disabled = true;
      if (btnView) btnView.disabled = true;
      if (btnNext) btnNext.disabled = true;
      if (btnPdf) btnPdf.disabled = true;
      setBlink(btnLock, true);
    } else if (s.system === SYS.ROUND1){
      if (statusLine) statusLine.textContent = "請開始抽姓名（第一輪）";
      if (centerLine) centerLine.textContent = "";
      if (btnR1){ btnR1.disabled = false; setBlink(btnR1,true); }
      if (btnNext){ btnNext.disabled = false; }
    } else if (s.system === SYS.ROUND2){
      if (statusLine) statusLine.textContent = "請抽紅包（第二輪）";
      if (centerLine) centerLine.textContent = "";
      if (btnR2){ btnR2.disabled = false; setBlink(btnR2,true); }
    } else if (s.system === SYS.VIEWER){
      if (statusLine) statusLine.textContent = "已抽出紅包，可開啟 Viewer";
      if (centerLine) centerLine.textContent = s.currentVerse ? `抽中經句：${s.currentVerse.code} ${s.currentVerse.ref||""}` : "";
      if (btnView){ btnView.disabled = false; setBlink(btnView,true); }
    } else if (s.system === SYS.FINISHED){
      if (statusLine) statusLine.textContent = "本輪已完成，可下載 PDF 或歸零";
      if (centerLine) centerLine.textContent = "";
      if (btnPdf){ btnPdf.disabled = false; setBlink(btnPdf,true); }
      if (btnReset){ setBlink(btnReset,true); }
    }

    renderLog();
  }

  window.applyUIState = applyUIState;
  window.__uiRenderLog = renderLog;
})();
