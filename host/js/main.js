// host/js/main.js
(() => {
  const $ = (id)=>document.getElementById(id);

  function canAct(){
    return window.__BC_MASTER__ ? window.__BC_MASTER__.canAct() : true;
  }

  function hhmmss(ts){
    const d = new Date(ts);
    const pad=(n)=>String(n).padStart(2,"0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function parseNames(raw){
    return raw
      .split(/[\n,，\t ]+/)
      .map(s=>s.trim())
      .filter(Boolean);
  }

  function remainingNames(){
    const used = usedNameSet();
    return state.names.filter(n=>!used.has(n));
  }

  function randomFrom(arr){
    return arr[Math.floor(Math.random()*arr.length)];
  }

  function pickVerse(){
    const used = verseUsedSet();
    const max = 128;
    for (let tries=0; tries<600; tries++){
      const n = Math.floor(Math.random()*max)+1;
      const code = String(n).padStart(3,"0");
      if (!used.has(code)) return code;
    }
    // fallback linear
    for (let i=1;i<=max;i++){
      const code = String(i).padStart(3,"0");
      if (!used.has(code)) return code;
    }
    return "001";
  }

  function updateWheelForRound(){
    if (state.system === SYS_STATE.ROUND1){
      window.__wheelSetSegments(remainingNames().length ? remainingNames() : ["1","2"]);
      window.initWheel(remainingNames().length ? remainingNames() : ["1","2"]);
    } else {
      // Round2: generic segments (not 128 slices)
      const n = Math.max(2, Math.min(8, state.names.length || 2));
      const seg = Array.from({length:n}, (_,i)=> `🎁 ${i+1}`);
      window.__wheelSetSegments(seg);
      window.initWheel(seg);
    }
  }

  function setSystem(sys){
    state.system = sys;
    saveState();
    applyUIState();
    updateWheelForRound();
  }

  function broadcastLastVerse(){
    const ref = (window.VERSE_REF_MAP && window.VERSE_REF_MAP[state.currentVerse]) ? window.VERSE_REF_MAP[state.currentVerse] : "";
    localStorage.setItem("LAST_VERSE", JSON.stringify({ verse: state.currentVerse, ref, time: Date.now() }));
  }

  function buildViewerUrl(){
    const base = `${location.origin}${location.pathname.replace(/\/index\.html.*/,"/viewer.html")}`;
    const name = state.lastWinnerName || "";
    return `${base}?code=${encodeURIComponent(state.currentVerse)}&name=${encodeURIComponent(name)}`;
  }

  function updateQR(){
    const link = buildViewerUrl().replace(/\/viewer\.html\?.*$/,"/viewer.html");
    const el = $("viewerLink");
    const qr = $("qrImg");
    if (el) el.value = link;
    if (qr) qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}`;
  }

  async function downloadPdf(){
    if (!canAct()) return;
    if (!state.logs.length) { alert("沒有可下載的抽籤紀錄"); return; }
    if (typeof window.jspdf === "undefined" || !window.jspdf.jsPDF){
      alert("jsPDF 尚未載入"); return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({orientation:"p", unit:"pt", format:"a4"});

    // Render to canvas as image (avoid font issues)
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const W = 1240;
    const H = 1754;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = "#111";
    ctx.font = "bold 44px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText("BlessingCards128 抽籤紀錄", 60, 90);

    ctx.fillStyle = "#666";
    ctx.font = "28px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    ctx.fillText(`共 ${state.logs.length} 筆`, 60, 140);

    let y = 210;
    const lineH = 44;

    ctx.fillStyle = "#111";
    ctx.font = "30px 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";

    for (const l of state.logs){
      const txt = `[${l.t}] ${l.name} -> ${l.verse}` + (l.ref ? ` | ${l.ref}` : "");
      // wrap
      const maxW = W - 120;
      const words = txt.split("");
      let line="";
      for (const ch of words){
        const test = line + ch;
        if (ctx.measureText(test).width > maxW){
          ctx.fillText(line, 60, y);
          y += lineH;
          line = ch;
        } else line = test;
      }
      if (line){
        ctx.fillText(line, 60, y);
        y += lineH;
      }
      y += 10;
      if (y > H-80) break; // single page for stability
    }

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "JPEG", 0, 0, pageW, pageH);

    pdf.save(`Blessing_envelop_${Date.now()}.pdf`);
  }

  function bind(){
    // Buttons
    $("btnLock").onclick = ()=>{
      if (!canAct()) return;
      const raw = $("nameInput").value || "";
      const list = parseNames(raw);
      if (!list.length){ alert("請輸入至少 1 個姓名"); return; }

      state.names = list;
      state.usedName = [];
      state.verseUsed = [];
      state.logs = [];
      state.lastWinnerName = "";
      state.lastWinnerIndex = -1;
      state.currentVerse = "";
      state.locked = true;
      state.round += 1;

      saveState();
      setSystem(SYS_STATE.ROUND1);
      updateQR();
    };

    $("btnRound1").onclick = ()=>{
      if (!canAct()) return;
      if (state.system !== SYS_STATE.ROUND1) return;
      const remain = remainingNames();
      if (!remain.length){ setSystem(SYS_STATE.FINISHED); return; }

      updateWheelForRound();
      // spin for visual, then commit winner
      spinWheel({
        onDone: ({value})=>{
          const winner = remain.includes(value) ? value : randomFrom(remain);
          state.lastWinnerName = winner;
          state.usedName.push(winner);
          saveState();
          // move to round2
          setSystem(SYS_STATE.ROUND2);
        }
      });
    };

    $("btnRound2").onclick = ()=>{
      if (!canAct()) return;
      if (state.system !== SYS_STATE.ROUND2) return;

      // spin for visual, then assign verse
      spinWheel({
        onDone: ()=>{
          const code = pickVerse();
          state.currentVerse = code;
          state.verseUsed.push(code);
          const ref = (window.VERSE_REF_MAP && window.VERSE_REF_MAP[code]) ? window.VERSE_REF_MAP[code] : "";
          state.logs.push({ t: hhmmss(Date.now()), name: state.lastWinnerName, verse: code, ref });
          saveState();

          broadcastLastVerse();
          updateQR();

          // After round2, ALWAYS go VIEWER (not finished yet). FINISHED only after viewer returned and no one left.
          setSystem(SYS_STATE.VIEWER);
        }
      });
    };

    $("btnView").onclick = ()=>{
      if (!canAct()) return;
      if (state.system !== SYS_STATE.VIEWER || !state.currentVerse) return;

      // open viewer in new tab
      const url = `./viewer.html?code=${encodeURIComponent(state.currentVerse)}&name=${encodeURIComponent(state.lastWinnerName||"")}`;
      window.open(url, "_blank");
    };

    $("btnNext").onclick = ()=>{
      if (!canAct()) return;
      // next player (round1) after viewer was shown, but allow manual
      if (state.usedName.length >= state.names.length){
        setSystem(SYS_STATE.FINISHED);
      } else {
        state.currentVerse = "";
        state.lastWinnerName = "";
        saveState();
        setSystem(SYS_STATE.ROUND1);
      }
    };

    $("btnPdf").onclick = ()=> downloadPdf();

    $("btnReset").onclick = ()=>{
      if (!canAct()) return;
      const ok = confirm("資料紀錄將被清空並歸零，確定要執行嗎？");
      if (!ok) return;
      resetState();
      $("nameInput").value = "";
      updateWheelForRound();
      updateQR();
      applyUIState();
    };

    $("btnCopy").onclick = async ()=>{
      const v = $("viewerLink").value || "";
      try { await navigator.clipboard.writeText(v); alert("已複製"); } catch { prompt("請手動複製：", v); }
    };

    $("btnUnlock").onclick = ()=>{
      if (window.__BC_MASTER__) window.__BC_MASTER__.forceUnlock();
      location.reload();
    };

    // Viewer return handling: when focus returns and we were in VIEWER, proceed to next
    window.addEventListener("focus", ()=>{
      if (!canAct()) return;
      if (state.system !== SYS_STATE.VIEWER) return;

      // release current verse for UI summary already in logs; now decide next
      state.currentVerse = "";
      state.lastWinnerName = ""; // keep wheel clean
      saveState();

      if (state.usedName.length >= state.names.length){
        setSystem(SYS_STATE.FINISHED);
      } else {
        setSystem(SYS_STATE.ROUND1);
      }
    });
  }

  window.__BC_MAIN__ = { updateQR, updateWheelForRound, setSystem };

  window.__bc_bindMain = bind;
})();
