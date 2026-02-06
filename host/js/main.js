// host/js/main.js
(() => {
  const $ = (id) => document.getElementById(id);

  // ---------- Config ----------
  const VIEWER_FLAG = "BC_VIEWER_OPEN";
  const VIEWER_AT = "BC_VIEWER_OPEN_AT";

  // ---------- Helpers ----------
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
    try{
      // verseRefMap.js is at /BlessingCards128/verseRefMap.js and defines window.verseRefMap
      const m = window.verseRefMap || {};
      return m[code3] || "";
    }catch{
      return "";
    }
  }

  function remainingNames(){
    const used = new Set(window.state.usedName||[]);
    return (window.state.names||[]).filter(n => !used.has(n));
  }

  function remainingVerses(){
    const used = new Set(window.state.verseUsed||[]);
    const all = [];
    for (let i=1;i<=128;i++) all.push(pad3(i));
    return all.filter(v => !used.has(v));
  }

  // ---------- Audio ----------
  let audioUnlocked = false;

  function unlockAudio(){
    if (audioUnlocked) return;
    const a1 = $("drum");
    const a2 = $("winSound");
    const tryOne = (a) => {
      if (!a) return;
      a.muted = true;
      const p = a.play();
      if (p && typeof p.then === "function"){
        p.then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
          audioUnlocked = true;
        }).catch(()=>{});
      }
    };
    tryOne(a1);
    tryOne(a2);
  }

  function playDrum(){
    const a = $("drum");
    if (!a) return;
    try{
      a.currentTime = 0;
      a.play().catch(()=>{});
    }catch{}
  }

  function playWin(){
    const a = $("winSound");
    if (!a) return;
    try{
      a.currentTime = 0;
      a.play().catch(()=>{});
    }catch{}
  }

  // ---------- UI status ----------
  function setStatus(text){
    const el = $("statusLine");
    if (el) el.textContent = text;
  }

  function setCenter(text){
    const el = $("centerLine");
    if (el) el.textContent = text || "";
  }

  function applyBlinkRound1(){
    const b = $("btnRound1");
    if (b) b.classList.add("blink-btn");
  }

  function clearBlink(){
    ["btnRound1","btnRound2","btnView","btnNext"].forEach(id=>{
      const b=$(id); if (b) b.classList.remove("blink-btn");
    });
  }

  // ---------- Viewer return (core fix) ----------
  function markViewerOpen(){
    sessionStorage.setItem(VIEWER_FLAG, "1");
    sessionStorage.setItem(VIEWER_AT, String(Date.now()));
  }

  function handleViewerReturn(){
    // Only host can act
    if (!window.__BC_MASTER__?.canAct?.()) return;
    if (!window.state) return;

    // Must be a real return from viewer
    const flag = sessionStorage.getItem(VIEWER_FLAG);
    if (flag !== "1") return;

    const t0 = Number(sessionStorage.getItem(VIEWER_AT) || "0");
    if (Date.now() - t0 < 500) return; // ignore immediate focus bounce

    // Clear flag first to avoid loops
    sessionStorage.removeItem(VIEWER_FLAG);
    sessionStorage.removeItem(VIEWER_AT);

    console.log("👁 Viewer returned → resume ROUND1");

    // Release viewer state
    window.state.currentVerse = null;

    const usedCount = new Set(window.state.usedName || []).size;
    if (usedCount >= (window.state.names||[]).length){
      window.state.system = SYS.FINISHED;
      setStatus("本輪已完成，可下載 PDF 或全部歸零");
      clearBlink();
    } else {
      window.state.system = SYS.ROUND1;
      window.initWheel(remainingNames());
      setStatus("準備抽姓名（第一輪）");
      clearBlink();
      applyBlinkRound1();
    }

    window.saveState();
    window.applyUIState?.();
  }

  // Mobile + desktop robustness
  window.addEventListener("focus", handleViewerReturn);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") handleViewerReturn();
  });

  // ---------- Buttons ----------
  function wire(){
    const btnLock = $("btnLock");
    const btnR1 = $("btnRound1");
    const btnR2 = $("btnRound2");
    const btnView = $("btnView");
    const btnNext = $("btnNext");
    const btnReset = $("btnReset");
    const btnPdf = $("btnPdf");

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

        window.initWheel(remainingNames());
        window.applyUIState?.();

        setStatus("準備抽姓名（第一輪）");
        clearBlink();
        applyBlinkRound1();
      };
    }

if (btnR1){
  btnR1.onclick = () => {

    if (!window.__BC_MASTER__?.canAct?.()) return;
    if (!window.state.locked) return;

    unlockAudio();

    const remain = remainingNames();

    // ⭐ 全部抽完
    if (!remain.length){
      window.state.system = SYS.FINISHED;
      window.saveState();
      window.applyUIState?.();
      setStatus("本輪已完成");
      clearBlink();
      return;
    }

    clearBlink();

    // ⭐ 輪盤固定顯示全部姓名（重點）
    const allSlots = window.state.names.slice();
    window.__wheelSetSegments(allSlots);

    playDrum();

    // ⭐ 只允許從剩餘名單抽
    window.spinWheel(+1, { pickFrom: remain }, (winnerName) => {

      const idx = window.state.names.indexOf(winnerName);
      window.state.lastWinnerIndex = idx;

      const used = new Set(window.state.usedName || []);
      used.add(winnerName);
      window.state.usedName = Array.from(used);

      window.state.system = SYS.ROUND2;
      window.saveState();
      window.applyUIState?.();

      setStatus(`第一輪完成：抽中「${winnerName}」，請抽紅包（第二輪）`);

      const b = $("btnRound2");
      if (b) b.classList.add("blink-btn");

    });
  };
}

if (btnR2){
  btnR2.onclick = () => {

    if (!window.__BC_MASTER__?.canAct?.()) return;
    if (window.state.system !== SYS.ROUND2) return;

    unlockAudio();

    const remain = remainingVerses();

    // ⭐ 若全部抽完
    if (!remain.length){
      window.state.system = SYS.FINISHED;
      window.saveState();
      window.applyUIState?.();
      setStatus("本輪已完成");
      clearBlink();
      return;
    }

    clearBlink();

    // ⭐ 第二輪輪盤格數 = 姓名數量（UI固定）
    const slots = window.state.names.map((_,i)=> String(i+1));
    window.__wheelSetSegments(slots);

    playDrum();

    // ⭐ 抽籤只從剩餘經句
    window.spinWheel(-1, { pickFrom: remain }, (code) => {

      const c = pad3(code);
      const ref = getRef(c);

      const used = new Set(window.state.verseUsed || []);
      used.add(c);
      window.state.verseUsed = Array.from(used);

      window.state.currentVerse = { code:c, ref };

      const name = window.state.names[window.state.lastWinnerIndex] || "";

      const t = new Date();
      const hh = String(t.getHours()).padStart(2,"0");
      const mm = String(t.getMinutes()).padStart(2,"0");
      const ss = String(t.getSeconds()).padStart(2,"0");

      window.state.logs.push({ t:`${hh}:${mm}:${ss}`, name, code:c, ref });

      localStorage.setItem("LAST_VERSE", JSON.stringify({
        verse:c,
        ref,
        time:Date.now(),
        name
      }));

      window.state.system = SYS.VIEWER;
      window.saveState();

      playWin();
      launchConfetti?.();

      window.applyUIState?.();

      setStatus(`第二輪完成：抽中經句「${c}」`);

      const b = $("btnView");
      if (b) b.classList.add("blink-btn");
    });
  };
}

    if (btnView){
      btnView.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;
        if (window.state.system !== SYS.VIEWER || !window.state.currentVerse) return;

        unlockAudio();

        // IMPORTANT: mark viewer opened, so return can resume
        markViewerOpen();

        const code = window.state.currentVerse.code;
        const name = window.state.names[window.state.lastWinnerIndex] || "";
        const url = `viewer.html?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`;
        window.open(url, "_blank");
      };
    }

    if (btnNext){
      btnNext.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;
        if (!window.state.locked) return;

        clearBlink();
        window.state.currentVerse = null;

        const usedCount = new Set(window.state.usedName||[]).size;
        window.state.system = (usedCount >= window.state.names.length) ? SYS.FINISHED : SYS.ROUND1;
        window.saveState();

        window.initWheel(remainingNames());
        window.applyUIState?.();

        if (window.state.system === SYS.ROUND1){
          setStatus("準備抽姓名（第一輪）");
          applyBlinkRound1();
        } else {
          setStatus("本輪已完成");
        }
      };
    }

    if (btnReset){
      btnReset.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;
        const ok = confirm("資料紀錄將被清空 & 歸零\n需重新輸入姓名並開始新一輪\n確定要執行嗎？");
        if (!ok) return;
        window.resetState();
        window.applyUIState?.();
        window.initWheel(["1","2"]);
        const ni = $("nameInput"); if (ni) ni.value = "";
        setStatus("系統已歸零（INIT）");
        clearBlink();
      };
    }

    if (btnPdf){
      btnPdf.onclick = () => {
        // Use browser print (Chinese OK) instead of jsPDF (garble)
        const logs = window.state.logs || [];
        const title = "BlessingCards128 抽籤紀錄";
        const html = `
<!doctype html><html><head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  body{font-family: system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans TC", sans-serif; padding:24px;}
  h1{font-size:22px;margin:0 0 12px;}
  table{border-collapse:collapse;width:100%;}
  th,td{border:1px solid #ccc;padding:8px;font-size:14px;text-align:left;}
  th{background:#f3f4f6;}
</style>
</head><body>
<h1>${title}</h1>
<table>
  <thead><tr><th>時間</th><th>姓名</th><th>經句編號</th><th>章節</th></tr></thead>
  <tbody>
    ${logs.map(r=>`<tr><td>${r.t||""}</td><td>${escapeHtml(r.name||"")}</td><td>${r.code||""}</td><td>${escapeHtml(r.ref||"")}</td></tr>`).join("")}
  </tbody>
</table>
<script>
  window.onload = () => { setTimeout(()=>window.print(), 300); };
</script>
</body></html>`;
        const w = window.open("", "_blank");
        if (!w) { alert("瀏覽器阻擋開新視窗，請允許彈出視窗"); return; }
        w.document.open();
        w.document.write(html);
        w.document.close();
      };
    }
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[c]));
  }

  // ---------- Boot ----------
  function boot(){
    console.log("🚀 boot");
    if (typeof window.loadState === "function") window.loadState();

    // Init wheel based on state
    if (!window.state.locked){
      window.initWheel(["1","2"]);
      const ni = $("nameInput"); if (ni) ni.value = "";
      window.state.system = SYS.INIT;
      window.saveState();
      setStatus("請輸入姓名並鎖定名單");
      clearBlink();
    } else {
      const ni = $("nameInput"); if (ni) ni.value = window.state.names.join("\n");
      if (window.state.system === SYS.ROUND1){
        window.initWheel(remainingNames());
        setStatus("準備抽姓名（第一輪）");
        clearBlink();
        applyBlinkRound1();
      } else if (window.state.system === SYS.ROUND2){
        window.initWheel(remainingVerses());
        setStatus("請抽紅包（第二輪）");
        clearBlink();
        const b = $("btnRound2"); if (b) b.classList.add("blink-btn");
      } else if (window.state.system === SYS.VIEWER){
        // keep name wheel ready
        window.initWheel(remainingNames());
        setStatus("已抽出經句，請按「看紅包」");
        clearBlink();
        const b = $("btnView"); if (b) b.classList.add("blink-btn");
      } else {
        window.initWheel(remainingNames());
        setStatus("本輪已完成");
        clearBlink();
      }
    }

    wire();
    window.applyUIState?.();

    // Boot-time recovery: if host got reloaded while viewer was open, try to resume
    handleViewerReturn();
  }

  window.addEventListener("load", boot);
})();
