// host/js/main.js
(() => {
  const $ = (id) => document.getElementById(id);
  const SYS = window.SYS;

  // ---- Audio ----
  const drum = new Audio("../audio/drum.mp3");
  const win = new Audio("../audio/win.mp3");
  drum.preload = "auto"; win.preload="auto";
  let audioUnlocked = false;

  async function unlockAudio(){
    if (audioUnlocked) return;
    try{
      drum.muted = true;
      await drum.play();
      drum.pause(); drum.currentTime = 0;
      drum.muted = false;
      audioUnlocked = true;
      console.log("🔓 Audio unlocked");
    }catch(e){
      // will retry on next user gesture
      console.warn("unlockAudio failed", e);
    }
  }

  // attach one-time gesture
  window.addEventListener("pointerdown", unlockAudio, { once:true, passive:true });

  function playDrum(){
    try{ drum.currentTime = 0; drum.play(); }catch{}
  }
  function playWin(){
    try{ win.currentTime = 0; win.play(); }catch{}
  }

  function getRef(code){
    try{ return (window.VERSE_REF_MAP && window.VERSE_REF_MAP[code]) ? window.VERSE_REF_MAP[code] : ""; }
    catch{ return ""; }
  }
  const pad3 = (x) => String(x||"").padStart(3,"0");

  // ---- QR ----
  function updateQR(){
    const url = location.origin + location.pathname.replace(/\/host\/index\.html.*$/,'/host/viewer.html');
    // show as text too
    const qrUrl = $("qrUrl"); if (qrUrl) qrUrl.value = url;
    const qrImg = $("qrImg");
    if (qrImg) qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(url);
  }

  function setMasterHint(){
    const el = $("masterHint");
    if (!el) return;
    if (window.__BC_MASTER__?.canAct?.()){
      el.textContent = "主持機模式：已鎖定";
    } else {
      el.textContent = "目前不是主持機（只讀）";
    }
  }

  // ---- Name parsing ----
  function parseNames(raw){
    return raw
      .split(/[\n,，\s]+/g)
      .map(s => s.trim())
      .filter(Boolean);
  }

  function remainingNames(){
    const used = new Set(window.state.usedName||[]);
    return window.state.names.filter(n => !used.has(n));
  }

  function remainingVerses(){
    const used = new Set(window.state.verseUsed||[]);
    const all = [];
    for (let i=1;i<=128;i++) all.push(pad3(i));
    return all.filter(v => !used.has(v));
  }

  // ---- Buttons ----
  function wire(){
    const btnLock = $("btnLock");
    const btnR1 = $("btnRound1");
    const btnR2 = $("btnRound2");
    const btnView = $("btnView");
    const btnNext = $("btnNext");
    const btnReset = $("btnReset");
    const btnCopy = $("btnCopy");
    const btnUnlock = $("btnUnlock");

    if (btnCopy){
      btnCopy.onclick = async () => {
        const v = $("qrUrl")?.value || "";
        try{ await navigator.clipboard.writeText(v); }catch{}
      };
    }
    if (btnUnlock){
      btnUnlock.onclick = () => {
        window.__BC_MASTER__?.forceUnlock?.();
        setMasterHint();
        window.applyUIState();
      };
    }

    if (btnLock){
      btnLock.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;

        unlockAudio();
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

        // wheel for ROUND1
        window.initWheel(remainingNames());
        window.applyUIState();
        updateQR();
      };
    }

    if (btnR1){
      btnR1.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;
        if (!window.state.locked) return;

        unlockAudio();
        const remain = remainingNames();
        if (!remain.length){
          window.state.system = SYS.FINISHED;
          window.saveState();
          window.applyUIState();
          return;
        }

        // update wheel segments to remaining names
        window.__wheelSetSegments(remain);
        playDrum();

        // ROUND1: clockwise (+1)
        window.spinWheel(+1, (winnerName) => {
          // pick index in original list
          const idx = window.state.names.indexOf(winnerName);
          window.state.lastWinnerIndex = idx;
          // mark used
          const used = new Set(window.state.usedName||[]);
          used.add(winnerName);
          window.state.usedName = Array.from(used);

          window.state.system = SYS.ROUND2;
          window.saveState();

          window.applyUIState();
        });
      };
    }

    if (btnR2){
      btnR2.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;
        if (window.state.system !== SYS.ROUND2) return;

        unlockAudio();
        const remain = remainingVerses();
        if (!remain.length){
          window.state.system = SYS.FINISHED;
          window.saveState();
          window.applyUIState();
          return;
        }

        window.__wheelSetSegments(remain);
        playDrum();

        // ROUND2: counterclockwise (-1)
        window.spinWheel(-1, (code) => {
          const c = pad3(code);
          const ref = getRef(c);
          const used = new Set(window.state.verseUsed||[]);
          used.add(c);
          window.state.verseUsed = Array.from(used);

          window.state.currentVerse = { code: c, ref };
          // log
          const name = window.state.names[window.state.lastWinnerIndex] || "";
          const t = new Date();
          const hh = String(t.getHours()).padStart(2,"0");
          const mm = String(t.getMinutes()).padStart(2,"0");
          const ss = String(t.getSeconds()).padStart(2,"0");
          window.state.logs.push({ t:`${hh}:${mm}:${ss}`, name, code:c, ref });

          // broadcast to viewer (Mode A)
          localStorage.setItem("LAST_VERSE", JSON.stringify({ verse:c, ref, time: Date.now(), name }));

          window.state.system = SYS.VIEWER;
          window.saveState();
          playWin();
          window.applyUIState();
        });
      };
    }

if (btnView){
  btnView.onclick = () => {

    if (!window.__BC_MASTER__?.canAct?.()) return;
    if (window.state.system !== SYS.VIEWER || !window.state.currentVerse) return;

    unlockAudio();

    const code = window.state.currentVerse.code;
    const name = window.state.names[window.state.lastWinnerIndex] || "";

    // ⭐ 記錄主持機已開 Viewer（回來判斷用）
    sessionStorage.setItem("BC_VIEWER_OPEN","1");
    sessionStorage.setItem("BC_VIEWER_OPEN_AT", String(Date.now()));

    const url =
      `viewer.html?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`;

    window.open(url, "_blank");
  };
}

    if (btnNext){
      btnNext.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;
        if (!window.state.locked) return;

        // force next player's ROUND1
        window.state.currentVerse = null;
        window.state.system = (new Set(window.state.usedName||[]).size >= window.state.names.length) ? SYS.FINISHED : SYS.ROUND1;
        window.saveState();

        window.initWheel(remainingNames());
        window.applyUIState();
      };
    }

    if (btnReset){
      btnReset.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;
        const ok = confirm("資料紀錄將被清空 & 歸零\n需重新輸入姓名並開始新一輪\n確定要執行嗎？");
        if (!ok) return;
        window.resetState();
        window.applyUIState();
        window.initWheel(["1","2"]);
        updateQR();
      };
    }
  }

function handleViewerReturn(){

  if (!window.__BC_MASTER__?.canAct?.()) return;
  if (!window.state) return;
  if (window.state.system !== SYS.VIEWER) return;

  // ⭐ 是否真的開過 Viewer
  const flag = sessionStorage.getItem("BC_VIEWER_OPEN");
  if (flag !== "1") return;

  const t0 = Number(sessionStorage.getItem("BC_VIEWER_OPEN_AT") || "0");

  // ⭐ 防止剛開 viewer 就觸發
  if (Date.now() - t0 < 400) return;

  console.log("👁 Viewer returned → resume ROUND1");

  // ⭐ 清旗標
  sessionStorage.removeItem("BC_VIEWER_OPEN");
  sessionStorage.removeItem("BC_VIEWER_OPEN_AT");

  // ⭐ 清本輪 verse
  window.state.currentVerse = null;

  // ❌ 不要清 lastWinnerIndex（非常重要）

  const usedCount = new Set(window.state.usedName || []).size;

  if (usedCount >= window.state.names.length){

    window.state.system = SYS.FINISHED;

  } else {

    window.state.system = SYS.ROUND1;

    if (typeof remainingNames === "function"){
      window.initWheel(remainingNames());
    }
  }

  window.saveState();
  window.applyUIState();

  // ⭐ 第一輪閃爍提示
  setTimeout(() => {
    const btn = document.getElementById("btnRound1");
    if (btn) btn.classList.add("blink-btn");
  }, 120);
}

  // ---- Simple PDF (text-only, avoids garbling by using built-in fonts; Chinese may still fail on some env) ----
  // Keep button disabled until FINISHED in UI.js. User can extend later.

  function boot(){
    console.log("🚀 boot");
    setMasterHint();
    updateQR();

    if (typeof window.loadState === "function") window.loadState();

    // init wheel based on state
    if (!window.state.locked){
      window.initWheel(["1","2"]);
      const ni = $("nameInput"); if (ni) ni.value = "";
      window.state.system = SYS.INIT;
      window.saveState();
    } else {
      // fill textarea with names for reference
      const ni = $("nameInput"); if (ni) ni.value = window.state.names.join("\n");
      if (window.state.system === SYS.ROUND1){
        window.initWheel(remainingNames());
      } else if (window.state.system === SYS.ROUND2){
        window.initWheel(remainingVerses());
      } else {
        // VIEWER / FINISHED
        window.initWheel(remainingNames());
      }
    }

    wire();
    window.applyUIState();
  }

  window.addEventListener("load", boot);
})();
