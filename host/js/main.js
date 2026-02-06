// host/js/main.js
(() => {
  const $ = (id) => document.getElementById(id);

  // ----------------------------
  // helpers
  // ----------------------------
  function pad3(n){
    const x = String(n);
    return x.length >= 3 ? x : ("000" + x).slice(-3);
  }
  function nowHHMMSS(){
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,"0");
    const mm = String(d.getMinutes()).padStart(2,"0");
    const ss = String(d.getSeconds()).padStart(2,"0");
    return `${hh}:${mm}:${ss}`;
  }
  function parseNames(raw){
    return Array.from(
      new Set(
        String(raw || "")
          .split(/[\n,，\s]+/g)
          .map(s => s.trim())
          .filter(Boolean)
      )
    );
  }
  function getRef(code3){
    const m = window.verseRefMap || {};
    return m[code3] || "";
  }

  function setStatus(text){
    const el = $("statusLine");
    if (el) el.textContent = text;
  }

  // ----------------------------
  // blink control (避免亂閃)
  // ----------------------------
  function clearBlink(){
    ["btnRound1","btnRound2","btnView","btnNext"].forEach(id=>{
      const b = $(id);
      if (b) b.classList.remove("blink-btn");
    });
  }
  function blink(id){
    const b = $(id);
    if (b) b.classList.add("blink-btn");
  }

  // ----------------------------
  // 防止 Chrome/LINE 回填舊名單（你截圖的 1 2 3）
  // ----------------------------
  function antiAutofill(){
    const ni = $("nameInput");
    if (!ni) return;
    ni.setAttribute("autocomplete","off");
    ni.setAttribute("autocorrect","off");
    ni.setAttribute("autocapitalize","off");
    ni.setAttribute("spellcheck","false");
    // 只要未鎖定，就強制清空，避免回填 1 2 3
    if (window.state && !window.state.locked) ni.value = "";
  }

  // ----------------------------
  // remaining lists (usedName 存 index)
  // ----------------------------
  function remainingNames(){
    const used = new Set(window.state.usedName || []);
    return (window.state.names || []).filter((_, i) => !used.has(i));
  }
  function remainingVerses(){
    const used = new Set(window.state.verseUsed || []);
    const all = [];
    for (let i=1;i<=128;i++) all.push(pad3(i));
    return all.filter(v => !used.has(v));
  }

  // ----------------------------
  // audio
  // ----------------------------
  function stopAudio(){
    const drum = $("drum");
    const win = $("winSound");
    try { if (drum){ drum.pause(); drum.currentTime = 0; } } catch {}
    try { if (win){ win.pause(); win.currentTime = 0; } } catch {}
  }

  // 第一輪：只要鼓聲立即播放
  function playRound1Drum(){
    const drum = $("drum");
    if (!drum) return;
    try{
      drum.pause();
      drum.currentTime = 0;
      drum.play().catch(()=>{});
    }catch{}
  }

  // 第二輪：鼓聲開始後第7秒 -> win + 金雨3秒（10秒左右收）
  function playRound2WinAt7(){
    const drum = $("drum");
    const win  = $("winSound");
    if (!drum || !win) return;

    try{
      win.pause(); win.currentTime = 0;
      drum.pause(); drum.currentTime = 0;
    }catch{}

    let fired = false;
    drum.play().catch(()=>{});

    function loop(){
      if (!fired && drum.currentTime >= 7){
        fired = true;
        try{
          win.volume = 1;
          win.play().catch(()=>{});
        }catch{}
        if (typeof window.launchConfetti === "function"){
          window.launchConfetti(3000);
        }
      }
      if (drum.currentTime < 11){
        requestAnimationFrame(loop);
      }
    }
    requestAnimationFrame(loop);
  }

  // ----------------------------
  // wire UI
  // ----------------------------
  function wire(){
    const btnLock  = $("btnLock");
    const btnR1    = $("btnRound1");
    const btnR2    = $("btnRound2");
    const btnView  = $("btnView");
    const btnNext  = $("btnNext");
    const btnReset = $("btnReset");

    // 鎖定名單（回到你原本順序：INIT -> LOCK -> ROUND1）
    if (btnLock){
      btnLock.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;

        stopAudio();
        clearBlink();
        antiAutofill();

        const raw = $("nameInput")?.value || "";
        const list = parseNames(raw);

        if (!list.length){
          alert("請先輸入至少 1 個姓名");
          return;
        }

        window.state.names = list;
        window.state.usedName = [];   // 存 index
        window.state.verseUsed = [];  // 存 "001".."128"
        window.state.lastWinnerIndex = -1;
        window.state.currentVerse = null;
        window.state.logs = [];

        window.state.locked = true;
        window.state.system = SYS.ROUND1;

        window.saveState();

        // ROUND1：輪盤 = 剩餘姓名
        window.initWheel(remainingNames());
        setStatus("準備抽姓名（第一輪）");

        // 第一輪按鈕閃（提示可抽）
        blink("btnRound1");

        window.applyUIState?.();
      };
    }

    // 第一輪：抽姓名（抽完 -> ROUND2 & 第二輪按鈕閃）
    if (btnR1){
      btnR1.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;
        if (!window.state.locked) return;

        stopAudio();
        clearBlink();

        const remain = remainingNames();
        if (!remain.length){
          window.state.system = SYS.FINISHED;
          window.saveState();
          window.initWheel([]);
          setStatus("本輪已完成");
          window.applyUIState?.();
          return;
        }

        // ✅ 第一輪鼓聲要有
        playRound1Drum();

        // 輪盤顯示剩餘姓名
        window.initWheel(remain);

        window.spinWheel(+1, { pickFrom: remain }, (winnerName) => {
          const idx = (window.state.names || []).indexOf(winnerName);
          window.state.lastWinnerIndex = idx;

          // ✅ usedName 存 index
          const used = new Set(window.state.usedName || []);
          used.add(idx);
          window.state.usedName = Array.from(used);

          // 進入第二輪
          window.state.system = SYS.ROUND2;
          window.state.currentVerse = null;
          window.saveState();

          // 第二輪輪盤顯示經句（128 - 已抽）
          window.initWheel(remainingVerses());

          setStatus(`第一輪完成：抽中「${winnerName}」，請抽紅包（第二輪）`);

          // ✅ 第二輪按鈕閃（第一輪不閃）
          clearBlink();
          blink("btnRound2");

          window.applyUIState?.();
        });
      };
    }

    // 第二輪：抽紅包（抽完 -> VIEWER & 看紅包閃）
    if (btnR2){
      btnR2.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;

        stopAudio();
        clearBlink();

        const verses = remainingVerses();
        if (!verses.length){
          window.state.system = SYS.FINISHED;
          window.saveState();
          window.initWheel([]);
          setStatus("本輪已完成");
          window.applyUIState?.();
          return;
        }

        // ✅ 第二輪爆點節奏
        playRound2WinAt7();

        window.initWheel(verses);

        window.spinWheel(-1, { pickFrom: verses }, (picked) => {
          const code = pad3(picked);
          const ref  = getRef(code);

          const used = new Set(window.state.verseUsed || []);
          used.add(code);
          window.state.verseUsed = Array.from(used);

          window.state.currentVerse = { code, ref };
          window.state.system = SYS.VIEWER;

          // ✅ 讓 viewer 讀得到（你截圖的 000 就是這個沒寫）
          try{ localStorage.setItem("LAST_VERSE", code); }catch{}

          // ✅ log
          const name =
            (window.state.lastWinnerIndex >= 0 && window.state.names?.[window.state.lastWinnerIndex])
              ? window.state.names[window.state.lastWinnerIndex]
              : "-";
          window.state.logs = window.state.logs || [];
          window.state.logs.push({ t: nowHHMMSS(), name, code, ref });

          window.saveState();

          setStatus(`第二輪完成：抽中經句「${code}」`);

          // ✅ 看紅包要閃（第一輪不閃）
          clearBlink();
          blink("btnView");

          // 先把輪盤切回姓名（下一位更順）
          window.initWheel(remainingNames());

          window.applyUIState?.();
        });
      };
    }

    // 看紅包（開 Viewer）
    if (btnView){
      btnView.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;
        if (window.state.system !== SYS.VIEWER) return;
        if (!window.state.currentVerse) return;

        // viewer.html
        const url = location.origin + location.pathname.replace(/\/index\.html$/,"/viewer.html");
        window.open(url, "_blank", "noopener,noreferrer");
      };
    }

    // 下一位（回第一輪）
    if (btnNext){
      btnNext.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;
        if (!window.state.locked) return;

        stopAudio();
        clearBlink();

        window.state.currentVerse = null;

        const usedCount = new Set(window.state.usedName || []).size;
        const total = (window.state.names || []).length;

        if (usedCount >= total){
          window.state.system = SYS.FINISHED;
          window.saveState();
          window.initWheel([]);
          setStatus("本輪已完成");
          window.applyUIState?.();
          return;
        }

        window.state.system = SYS.ROUND1;
        window.saveState();

        window.initWheel(remainingNames());
        setStatus("準備抽姓名（第一輪）");

        // ✅ 第一輪按鈕閃
        blink("btnRound1");

        window.applyUIState?.();
      };
    }

    // 全部歸零
    if (btnReset){
      btnReset.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;

        stopAudio();
        clearBlink();

        window.resetState();

        window.initWheel([]);
        const ni = $("nameInput");
        if (ni) ni.value = "";

        try{ localStorage.removeItem("LAST_VERSE"); }catch{}

        setStatus("系統已歸零（INIT）");
        window.applyUIState?.();
        antiAutofill();
      };
    }
  }

  // ----------------------------
  // boot
  // ----------------------------
  function boot(){
    if (typeof window.loadState === "function") window.loadState();

    antiAutofill();

    if (!window.state.locked){
      window.initWheel([]);
      setStatus("請輸入姓名並鎖定名單");
      clearBlink();
    } else {
      // 按你原本流程恢復狀態與閃爍
      if (window.state.system === SYS.ROUND2){
        window.initWheel(remainingVerses());
        setStatus("請抽紅包（第二輪）");
        clearBlink(); blink("btnRound2");
      } else if (window.state.system === SYS.VIEWER && window.state.currentVerse){
        window.initWheel(remainingNames());
        setStatus(`第二輪完成：抽中經句「${window.state.currentVerse.code}」`);
        clearBlink(); blink("btnView");
      } else if (window.state.system === SYS.FINISHED){
        window.initWheel([]);
        setStatus("本輪已完成");
        clearBlink();
      } else {
        window.state.system = SYS.ROUND1;
        window.saveState();
        window.initWheel(remainingNames());
        setStatus("準備抽姓名（第一輪）");
        clearBlink(); blink("btnRound1");
      }
    }

    wire();
    window.applyUIState?.();
  }

  window.addEventListener("load", boot);
})();