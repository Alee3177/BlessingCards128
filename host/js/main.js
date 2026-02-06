// host/js/main.js
(() => {
  const $ = (id) => document.getElementById(id);

  // =========
  // helpers
  // =========
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

  // ==========================
  // remaining lists (正確版)
  // ==========================
  function remainingNames(){
    const used = new Set(window.state.usedName || []);
    return (window.state.names || []).filter((_, i) => !used.has(i));
  }

  function remainingVerses(){
    const used = new Set(window.state.verseUsed || []);
    const all = [];
    for (let i = 1; i <= 128; i++) all.push(pad3(i));
    return all.filter(v => !used.has(v));
  }

  // ==========================
  // 🎵 Audio control
  // ==========================
  function stopAudio(){
    const drum = $("drum");
    const win = $("winSound");
    try { if (drum) { drum.pause(); drum.currentTime = 0; } } catch {}
    try { if (win)  { win.pause();  win.currentTime  = 0; } } catch {}
  }

  // 第一輪：只有鼓聲（立即播放）
  function playRound1Drum(){
    const drum = $("drum");
    if (!drum) return;
    try {
      drum.pause();
      drum.currentTime = 0;
      drum.play().catch(()=>{});
    } catch {}
  }

  // 第二輪：鼓聲開始後第 7 秒播放 win + 金雨 3 秒（到 10 秒左右結束）
  function playRound2WinAt7s(){
    const drum = $("drum");
    const win  = $("winSound");
    if (!drum || !win) return;

    try {
      // 先停止可能殘留
      win.pause(); win.currentTime = 0;
      drum.pause(); drum.currentTime = 0;
    } catch {}

    let exploded = false;

    drum.play().catch(()=>{});

    function loop(){
      if (!exploded && drum.currentTime >= 7){
        exploded = true;

        try {
          win.volume = 1;
          win.play().catch(()=>{});
        } catch {}

        // 金雨 3 秒
        if (typeof window.launchConfetti === "function"){
          window.launchConfetti(3000);
        }
      }

      // drum 大約 11 秒；用 ended 更穩，但手機有時 ended 觸發慢
      if (drum.currentTime < 11){
        requestAnimationFrame(loop);
      }
    }

    requestAnimationFrame(loop);
  }

  // ==========================
  // UI flow wiring
  // ==========================
  function wire(){
    const btnLock = $("btnLock");
    const btnR1   = $("btnRound1");
    const btnR2   = $("btnRound2");
    const btnView = $("btnView");
    const btnNext = $("btnNext");
    const btnReset= $("btnReset");

    // 鎖定名單
    if (btnLock){
      btnLock.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;

        stopAudio();
        clearBlink();

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

        // 第一輪顯示：剩餘姓名
        window.initWheel(remainingNames());
        setStatus("準備抽姓名（第一輪）");

        // 第一輪按鈕閃（提示可以抽）
        blink("btnRound1");

        window.applyUIState?.();
      };
    }

    // 第一輪：抽姓名
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
          setStatus("本輪已完成");
          window.initWheel([]);
          window.applyUIState?.();
          return;
        }

        // ✅ 第一輪鼓聲
        playRound1Drum();

        // UI slots 就是 remain（確保顯示 A/B 不會變成 1/2）
        window.initWheel(remain);

        window.spinWheel(+1, { pickFrom: remain }, (winnerName) => {

          // winner index
          const idx = window.state.names.indexOf(winnerName);
          window.state.lastWinnerIndex = idx;

          // ✅ usedName 存 index
          const used = new Set(window.state.usedName || []);
          used.add(idx);
          window.state.usedName = Array.from(used);

          // 進入第二輪
          window.state.system = SYS.ROUND2;
          window.state.currentVerse = null;
          window.saveState();

          // 第二輪顯示：剩餘經句（轉盤切分 128 / 128-used）
          const verses = remainingVerses();
          window.initWheel(verses);

          setStatus(`第一輪完成：抽中「${winnerName}」，請抽紅包（第二輪）`);

          // ✅ 第二輪按鈕閃
          clearBlink();
          blink("btnRound2");

          window.applyUIState?.();
        });
      };
    }

    // 第二輪：抽紅包
    if (btnR2){
      btnR2.onclick = () => {
        if (!window.__BC_MASTER__?.canAct?.()) return;

        stopAudio();
        clearBlink();

        const verses = remainingVerses();
        if (!verses.length){
          window.state.system = SYS.FINISHED;
          window.saveState();
          setStatus("本輪已完成");
          window.initWheel([]);
          window.applyUIState?.();
          return;
        }

        // ✅ 第二輪音效節奏：0s drum，7s win+金雨，10s左右收尾
        playRound2WinAt7s();

        // UI slots = verses
        window.initWheel(verses);

        window.spinWheel(-1, { pickFrom: verses }, (picked) => {
          const c = pad3(picked);
          const ref = getRef(c);

          const used = new Set(window.state.verseUsed || []);
          used.add(c);
          window.state.verseUsed = Array.from(used);

          window.state.currentVerse = { code: c, ref };
          window.state.system = SYS.VIEWER;
          window.saveState();

          // ✅ 記錄 log（hh:mm:ss）
          const name =
            (window.state.lastWinnerIndex >= 0 && window.state.names?.[window.state.lastWinnerIndex])
              ? window.state.names[window.state.lastWinnerIndex]
              : "-";
          window.state.logs = window.state.logs || [];
          window.state.logs.push({ t: nowHHMMSS(), name, code: c, ref });
          window.saveState();

          // VIEWER 狀態：把輪盤準備回姓名（下一位更順）
          window.initWheel(remainingNames());

          setStatus(`第二輪完成：抽中經句「${c}」`);

          // ✅ 看紅包要閃、第一輪不要閃
          clearBlink();
          blink("btnView");

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

        // ✅ 讓 UI 保持看紅包提示（閃到你按下一位為止也可）
        clearBlink();
        blink("btnNext");

        // 直接開 viewer
        // viewer.html 是同層：host/viewer.html
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
          setStatus("本輪已完成");
          window.initWheel([]);
          window.applyUIState?.();
          return;
        }

        window.state.system = SYS.ROUND1;
        window.saveState();

        const remain = remainingNames();
        window.initWheel(remain);
        setStatus("準備抽姓名（第一輪）");

        // ✅ 第一輪按鈕閃（提示抽下一位）
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

        setStatus("系統已歸零（INIT）");
        window.applyUIState?.();
      };
    }
  }

  // ==========================
  // boot
  // ==========================
  function boot(){
    if (typeof window.loadState === "function") window.loadState();

    // INIT / locked 決定初始化輪盤
    if (!window.state.locked){
      window.initWheel([]);
      setStatus("請輸入姓名並鎖定名單");
      clearBlink();
    } else {
      // 若鎖定了，依 system 初始化
      if (window.state.system === SYS.ROUND2){
        window.initWheel(remainingVerses());
        setStatus("請抽紅包（第二輪）");
        clearBlink();
        blink("btnRound2");
      } else if (window.state.system === SYS.VIEWER && window.state.currentVerse){
        window.initWheel(remainingNames());
        setStatus(`第二輪完成：抽中經句「${window.state.currentVerse.code}」`);
        clearBlink();
        blink("btnView");
      } else if (window.state.system === SYS.FINISHED){
        window.initWheel([]);
        setStatus("本輪已完成");
        clearBlink();
      } else {
        // 預設 ROUND1
        window.state.system = SYS.ROUND1;
        window.saveState();
        window.initWheel(remainingNames());
        setStatus("準備抽姓名（第一輪）");
        clearBlink();
        blink("btnRound1");
      }
    }

    wire();
    window.applyUIState?.();
  }

  window.addEventListener("load", boot);
})();