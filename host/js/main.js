// host/js/main.js
(() => {
  const $ = (id) => document.getElementById(id);

  const VIEWER_FLAG = "BC_VIEWER_OPEN";
  const VIEWER_AT = "BC_VIEWER_OPEN_AT";

  function pad3(n){
    const x = String(n);
    return x.length>=3 ? x : ("000"+x).slice(-3);
  }

  function parseNames(raw){
    return Array.from(
      new Set(
        String(raw||"")
          .split(/[\n,，\s]+/g)
          .map(s=>s.trim())
          .filter(Boolean)
      )
    );
  }

  function getRef(code3){
    const m = window.verseRefMap || {};
    return m[code3] || "";
  }

  // 🔥 修正：正確回傳剩餘名字（用 index 判斷）
  function remainingNames(){
    const used = new Set(window.state.usedName || []);
    return (window.state.names || [])
      .filter((_, i) => !used.has(i));
  }

  function remainingVerses(){
    const used = new Set(window.state.verseUsed||[]);
    const all = [];
    for (let i=1;i<=128;i++) all.push(pad3(i));
    return all.filter(v => !used.has(v));
  }

  // =============================
  // 🎵 音效節奏控制
  // =============================
function playWinSequence(){

  const drum = document.getElementById("drum");
  const win = document.getElementById("winSound");

  if (!drum || !win) return;

  drum.currentTime = 0;
  win.currentTime = 0;

  let exploded = false;

  drum.play().catch(()=>{});

  function loop(){

    if (!exploded && drum.currentTime >= 7){
      exploded = true;

      // 🔥 音量爆點
      win.volume = 1;
      win.play().catch(()=>{});

      // 🔥 爆點金雨
      launchConfetti(3000);
    }

    if (drum.currentTime < 11){
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
}

  function setStatus(text){
    const el = $("statusLine");
    if (el) el.textContent = text;
  }

  function clearBlink(){
    ["btnRound1","btnRound2","btnView","btnNext"].forEach(id=>{
      const b=$(id); if (b) b.classList.remove("blink-btn");
    });
  }

  function applyBlinkRound1(){
    const b = $("btnRound1");
    if (b) b.classList.add("blink-btn");
  }

  // =============================
  // Viewer return
  // =============================
  function markViewerOpen(){
    sessionStorage.setItem(VIEWER_FLAG, "1");
    sessionStorage.setItem(VIEWER_AT, String(Date.now()));
  }

  function handleViewerReturn(){
    if (!window.__BC_MASTER__?.canAct?.()) return;
    if (!window.state) return;

    const flag = sessionStorage.getItem(VIEWER_FLAG);
    if (flag !== "1") return;

    const t0 = Number(sessionStorage.getItem(VIEWER_AT) || "0");
    if (Date.now() - t0 < 500) return;

    sessionStorage.removeItem(VIEWER_FLAG);
    sessionStorage.removeItem(VIEWER_AT);

    window.state.currentVerse = null;

    const usedCount = new Set(window.state.usedName || []).size;

    if (usedCount >= (window.state.names||[]).length){
      window.state.system = SYS.FINISHED;
      setStatus("本輪已完成");
    } else {
      window.state.system = SYS.ROUND1;
      window.initWheel(remainingNames());
      setStatus("準備抽姓名（第一輪）");
      applyBlinkRound1();
    }

    window.saveState();
    window.applyUIState?.();
  }

  window.addEventListener("focus", handleViewerReturn);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") handleViewerReturn();
  });

  // =============================
  // 按鈕
  // =============================
  function wire(){

    const btnLock = $("btnLock");
    const btnR1 = $("btnRound1");
    const btnR2 = $("btnRound2");
    const btnView = $("btnView");
    const btnNext = $("btnNext");
    const btnReset = $("btnReset");

    if (btnLock){
      btnLock.onclick = () => {

        const raw = $("nameInput")?.value || "";
        const list = parseNames(raw);
        if (!list.length){
          alert("請先輸入至少 1 個姓名");
          return;
        }

        window.state.names = list;
        window.state.usedName = [];
        window.state.verseUsed = [];
        window.state.logs = [];
        window.state.lastWinnerIndex = -1;
        window.state.currentVerse = null;
        window.state.locked = true;
        window.state.system = SYS.ROUND1;
        window.saveState();

        window.initWheel(remainingNames());
        setStatus("準備抽姓名（第一輪）");
        applyBlinkRound1();
        window.applyUIState?.();
      };
    }

    if (btnR1){
      btnR1.onclick = () => {

        const remain = remainingNames();

        if (!remain.length){
          window.state.system = SYS.FINISHED;
          window.saveState();
          setStatus("本輪已完成");
          return;
        }

        window.spinWheel(+1, { pickFrom: remain }, (winnerName) => {

          const idx = window.state.names.indexOf(winnerName);
          window.state.lastWinnerIndex = idx;

          const used = new Set(window.state.usedName || []);
          used.add(idx);   // 🔥 修正：存 index
          window.state.usedName = Array.from(used);

          window.state.system = SYS.ROUND2;
          window.saveState();
          setStatus(`第一輪完成：抽中「${winnerName}」，請抽紅包`);
          window.applyUIState?.();
        });
      };
    }

    if (btnR2){
      btnR2.onclick = () => {

        const remain = remainingVerses();
        if (!remain.length){
          window.state.system = SYS.FINISHED;
          window.saveState();
          return;
        }

        window.spinWheel(-1, { pickFrom: remain }, (code) => {

          const c = pad3(code);
          const ref = getRef(c);

          const used = new Set(window.state.verseUsed || []);
          used.add(c);
          window.state.verseUsed = Array.from(used);

          window.state.currentVerse = { code:c, ref };
          window.state.system = SYS.VIEWER;
          window.saveState();

          playWinSequence();   // 🎵 新節奏

          setStatus(`第二輪完成：抽中經句「${c}」`);
          window.applyUIState?.();
        });
      };
    }

    if (btnNext){
      btnNext.onclick = () => {

        window.state.currentVerse = null;

        const usedCount = new Set(window.state.usedName||[]).size;
        window.state.system = (usedCount >= window.state.names.length)
          ? SYS.FINISHED
          : SYS.ROUND1;

        window.saveState();
        window.initWheel(remainingNames());
        window.applyUIState?.();

        if (window.state.system === SYS.ROUND1){
          setStatus("準備抽姓名（第一輪）");
        } else {
          setStatus("本輪已完成");
        }
      };
    }

    if (btnReset){
      btnReset.onclick = () => {

        window.resetState();
        window.initWheel([]);   // 🔥 不再用 ["1","2"]
        const ni = $("nameInput"); 
        if (ni) ni.value = "";
        setStatus("系統已歸零（INIT）");
        clearBlink();
        window.applyUIState?.();
      };
    }
  }

  function boot(){
    if (typeof window.loadState === "function") window.loadState();

    if (!window.state.locked){
      window.initWheel([]);
      setStatus("請輸入姓名並鎖定名單");
    } else {
      window.initWheel(remainingNames());
    }

    wire();
    window.applyUIState?.();
    handleViewerReturn();
  }

  window.addEventListener("load", boot);

})();