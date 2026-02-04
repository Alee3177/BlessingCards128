// host/js/main.js
(function(){
  loadState();

  const nameInput = document.getElementById("nameInput");
  const statusLine = document.getElementById("statusLine");
  const centerLine = document.getElementById("centerLine");
  const logBox = document.getElementById("logBox");

  const btnLock = document.getElementById("btnLock");
  const btnR1 = document.getElementById("btnRound1");
  const btnR2 = document.getElementById("btnRound2");
  const btnView = document.getElementById("btnView");
  const btnNext = document.getElementById("btnNext");
  const btnPdf = document.getElementById("btnPdf");
  const btnReset = document.getElementById("btnReset");

  const viewerLink = document.getElementById("viewerLink");
  const btnCopy = document.getElementById("btnCopy");
  const btnForceUnlock = document.getElementById("btnForceUnlock");

  const drum = document.getElementById("drum");
  const winSound = document.getElementById("winSound");

  function canAct(){
    return window.__BC_MASTER__ && window.__BC_MASTER__.canAct && window.__BC_MASTER__.canAct();
  }

  function renderQR(url){
    const c = document.getElementById("qrCanvas");
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0,0,c.width,c.height);
      ctx.drawImage(img,0,0,c.width,c.height);
    };
    img.onerror = () => {
      ctx.clearRect(0,0,c.width,c.height);
      ctx.fillStyle = "#000";
      ctx.font = "11px sans-serif";
      ctx.fillText("請複製連結", 10, 60);
    };
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=132x132&data=" + encodeURIComponent(url);
  }

  function setStatus(txt){ statusLine.textContent = txt; }
  function setCenter(txt){ centerLine.textContent = txt; }

  function rebuildLog(){
    if (!state.logs.length){
      logBox.textContent = "（尚無）";
      return;
    }
    const lines = state.logs.map(x => {
      const d = new Date(x.t);
      const hh = String(d.getHours()).padStart(2,"0");
      const mm = String(d.getMinutes()).padStart(2,"0");
      const ss = String(d.getSeconds()).padStart(2,"0");
      return `[${hh}:${mm}:${ss}] 「${x.name}」→ ${x.code}${x.ref ? ("｜" + x.ref) : ""}`;
    });
    logBox.textContent = lines.join("\n");
  }

  function normalizeNames(raw){
    return raw
      .split(/[\n,，\s]+/g)
      .map(s => s.trim())
      .filter(Boolean);
  }

  function pad3(n){ return String(n).padStart(3,"0"); }

  function pickNextNameIndex(){
    const total = state.names.length;
    const used = new Set(state.usedName);
    const remain = [];
    for (let i=0;i<total;i++){
      if (!used.has(i)) remain.push(i);
    }
    if (!remain.length) return null;
    return remain[Math.floor(Math.random()*remain.length)];
  }

  function pickVerseCode(){
    const used = new Set(state.verseUsed);
    const remain = [];
    for (let i=1;i<=128;i++){
      const c = pad3(i);
      if (!used.has(c)) remain.push(c);
    }
    if (!remain.length) return null;
    return remain[Math.floor(Math.random()*remain.length)];
  }

  function updateViewerLink(){
    const base = location.origin + location.pathname.replace(/\/host\/index\.html.*$/,"/host/viewer.html");
    let url = base;
    if (state.currentVerse && state.currentVerse.code){
      const name = (state.lastWinnerIndex!=null && state.names[state.lastWinnerIndex]) ? state.names[state.lastWinnerIndex] : "";
      url += `?code=${encodeURIComponent(state.currentVerse.code)}&name=${encodeURIComponent(name)}`;
    }
    viewerLink.value = url;
    renderQR(url);
  }

  // audio unlock
  let audioUnlocked = false;
  function unlockAudio(){
    if (audioUnlocked) return;
    try{
      [drum, winSound].forEach(a=>{
        if(!a) return;
        a.muted = true;
        const p = a.play();
        if (p && p.then) p.then(()=>{ a.pause(); a.currentTime=0; a.muted=false; });
      });
      audioUnlocked = true;
    }catch(e){}
  }
  document.addEventListener("pointerdown", unlockAudio, {once:true});

  btnForceUnlock.onclick = () => {
    if (window.__BC_MASTER__ && window.__BC_MASTER__.forceUnlock){
      window.__BC_MASTER__.forceUnlock();
      location.reload();
    }
  };

  btnLock.onclick = () => {
    if (!canAct()) return;
    const list = normalizeNames(nameInput.value || "");
    if (!list.length){
      alert("請先輸入姓名");
      return;
    }
    state.names = list;
    state.usedName = [];
    state.verseUsed = [];
    state.logs = [];
    state.lastWinnerIndex = null;
    state.currentVerse = null;
    state.system = SYS_STATE.READY;
    saveState();

    setStatus("名單已鎖定，請開始抽籤（第一輪）");
    setCenter("");
    rebuildLog();
    updateViewerLink();
    applyUIState();
  };

  btnR1.onclick = () => {
    if (!canAct()) return;
    if (!state.names.length){
      alert("請先鎖定名單");
      return;
    }
    const idx = pickNextNameIndex();
    if (idx == null){
      state.system = SYS_STATE.FINISHED;
      saveState();
      applyUIState();
      setStatus("本輪已完成，可下載 PDF 或全部歸零");
      return;
    }

    try{ drum.currentTime=0; drum.play(); }catch(e){}

    state.lastWinnerIndex = idx;
    state.currentVerse = null;
    state.system = SYS_STATE.ROUND1;
    saveState();

    setStatus(`第一輪完成：抽中「${state.names[idx]}」`);
    setCenter("請按「抽紅包（第二輪）」");
    updateViewerLink();
    applyUIState();
  };

  btnR2.onclick = () => {
    if (!canAct()) return;
    if (state.lastWinnerIndex == null){
      alert("請先完成第一輪（抽姓名）");
      return;
    }
    const code = pickVerseCode();
    if (!code){
      alert("紅包已抽完（001–128）");
      return;
    }

    try{ winSound.currentTime=0; winSound.play(); }catch(e){}

    const ref = (window.VERSE_REF_MAP && window.VERSE_REF_MAP[code]) ? window.VERSE_REF_MAP[code] : "";

    state.verseUsed.push(code);
    state.currentVerse = { code, ref };
    state.system = SYS_STATE.ROUND2;

    localStorage.setItem("LAST_VERSE", JSON.stringify({ verse: code, ref, time: Date.now() }));
    state.logs.push({ t: Date.now(), name: state.names[state.lastWinnerIndex], code, ref });

    saveState();

    setStatus(`第二輪完成：抽中經句「${code}」`);
    setCenter(ref ? `📖 ${ref}` : "");
    rebuildLog();
    updateViewerLink();
    applyUIState();
  };

  btnView.onclick = () => {
    if (!canAct()) return;
    if (!state.currentVerse || !state.currentVerse.code){
      alert("請先抽紅包（第二輪）");
      return;
    }
    state.system = SYS_STATE.VIEWER;
    saveState();
    applyUIState();

    const name = state.names[state.lastWinnerIndex] || "";
    const url = `viewer.html?code=${encodeURIComponent(state.currentVerse.code)}&name=${encodeURIComponent(name)}`;
    window.open(url, "_blank");
    setStatus("Viewer 已開啟（請參與者看紅包/下載），看完後按「下一位」");
  };

  btnNext.onclick = () => {
    if (!canAct()) return;

    if (state.lastWinnerIndex != null){
      if (!state.usedName.includes(state.lastWinnerIndex)) state.usedName.push(state.lastWinnerIndex);
    }
    state.lastWinnerIndex = null;
    state.currentVerse = null;

    const idx = pickNextNameIndex();
    if (idx == null){
      state.system = SYS_STATE.FINISHED;
      saveState();
      applyUIState();
      setStatus("本輪已完成，可下載 PDF 或全部歸零");
      setCenter("");
      updateViewerLink();
      return;
    }

    state.system = SYS_STATE.READY;
    saveState();
    applyUIState();
    setStatus("請開始下一位：按「開始抽姓名（第一輪）」");
    setCenter("");
    updateViewerLink();
  };

  window.addEventListener("storage", (e) => {
    if (e.key !== "VIEWER_DONE") return;
    if (state.system === SYS_STATE.VIEWER){
      setStatus("✅ Viewer 已返回/已看完：請按「下一位」");
      applyUIState();
    }
  });

  btnCopy.onclick = async () => {
    try{
      await navigator.clipboard.writeText(viewerLink.value || "");
      btnCopy.textContent = "已複製";
      setTimeout(()=>btnCopy.textContent="複製",800);
    }catch(e){
      alert("複製失敗，請手動長按複製");
    }
  };

  btnPdf.onclick = async () => {
    if (!canAct()) return;
    if (!state.logs.length){
      alert("沒有可下載的抽籤紀錄");
      return;
    }
    try{
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({unit:"pt", format:"a4"});
      const margin = 40;
      let y = 60;

      pdf.setFontSize(16);
      pdf.text("BlessingCards128 抽籤紀錄", margin, y);
      y += 24;

      pdf.setFontSize(11);
      state.logs.forEach((x) => {
        const d = new Date(x.t);
        const hh = String(d.getHours()).padStart(2,"0");
        const mm = String(d.getMinutes()).padStart(2,"0");
        const ss = String(d.getSeconds()).padStart(2,"0");
        const line = `[${hh}:${mm}:${ss}] ${x.name} -> ${x.code}${x.ref ? (" | " + x.ref) : ""}`;

        const lines = pdf.splitTextToSize(line, 520);
        lines.forEach(l=>{
          if (y > 780){ pdf.addPage(); y = 60; }
          pdf.text(l, margin, y);
          y += 16;
        });
        y += 6;
      });

      pdf.save("BlessingCards128_logs.pdf");
    }catch(e){
      alert("PDF 產生失敗：" + (e && e.message ? e.message : e));
    }
  };

  btnReset.onclick = () => {
    if (!canAct()) return;
    const ok = confirm("資料紀錄將被清空 & 歸零\n需重新輸入姓名並開始新一輪\n確定要執行嗎？");
    if (!ok) return;
    resetState();
    state = makeState();
    saveState();
    nameInput.value = "";
    setStatus("系統已歸零，請輸入姓名並鎖定名單");
    setCenter("");
    rebuildLog();
    updateViewerLink();
    applyUIState();
  };

  if (state.names && state.names.length && !nameInput.value){
    nameInput.value = state.names.join("\n");
  }

  if (state.system === SYS_STATE.INIT){
    setStatus("系統初始化完成，請輸入姓名並鎖定名單");
  } else {
    setStatus("系統已載入（可繼續）");
  }

  rebuildLog();
  updateViewerLink();
  applyUIState();
})();
