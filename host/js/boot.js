// host/js/boot.js
(() => {
  const MASTER_KEY = "BC_MASTER_LOCK_V1";
  const TTL = 15000; // 15s
  const HEARTBEAT_MS = 5000;

  const TAB_ID = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random();

  function now(){ return Date.now(); }

  function readLock(){
    try { return JSON.parse(localStorage.getItem(MASTER_KEY) || "null"); }
    catch { return null; }
  }

  function writeLock(){
    localStorage.setItem(MASTER_KEY, JSON.stringify({ tabId: TAB_ID, ts: now() }));
  }

  function clearLock(){
    try{
      const cur = readLock();
      if (cur && cur.tabId === TAB_ID) localStorage.removeItem(MASTER_KEY);
    }catch{}
  }

  function isExpired(lock){ return !lock || !lock.ts || (now() - lock.ts > TTL); }

  function tryAcquire(){
    const cur = readLock();
    if (!cur || isExpired(cur) || cur.tabId === TAB_ID){
      writeLock();
      return true;
    }
    return false;
  }

  function heartbeat(){
    const cur = readLock();
    if (cur && cur.tabId === TAB_ID){
      writeLock();
    }
  }

  window.__BC_MASTER__ = {
    TAB_ID,
    canAct: () => {
      const cur = readLock();
      return cur && cur.tabId === TAB_ID && !isExpired(cur);
    },
    forceUnlock: () => {
      localStorage.removeItem(MASTER_KEY);
    }
  };

  tryAcquire();
  setInterval(() => {
    if (tryAcquire()) heartbeat();
  }, HEARTBEAT_MS);

  window.addEventListener("beforeunload", () => clearLock());
})();

// ================================
// 🚀 SYSTEM BOOTSTRAP
// ================================
function bootSystem(){
  try {
    console.log("🚀 BlessingCards128 booting...");

    // 1. 確認主持權限
    if (!window.__BC_MASTER__.canAct()) {
      console.warn("⚠ 非主持機模式（Viewer Only）");
    } else {
      console.log("🎤 主持機模式啟用");
    }

    // 2. 載入狀態
    if (typeof loadState === "function") {
      loadState();
      console.log("💾 State loaded");
    } else {
      console.warn("⚠ loadState not found");
    }

    // 3. 套用 UI
    if (typeof applyUIState === "function") {
      applyUIState();
      console.log("🎛 UI applied");
    } else {
      console.warn("⚠ applyUIState not found");
    }

// 4. 初始化輪盤（關鍵 - 等 DOM 穩定再綁）
if (typeof initWheel === "function") {
  console.log("⏳ Waiting for wheel canvas...");

  const bindWheel = () => {
    const c =
      document.getElementById("wheel") ||
      document.getElementById("wheelCanvas") ||
      document.querySelector("canvas");

    if (c) {
      initWheel(window.state?.names || []);
      console.log("🎡 Wheel initialized:", c.id || "(no id)");
    } else {
      // 每 50ms 重試一次，直到畫布出現
      setTimeout(bindWheel, 50);
    }
  };

  bindWheel();
} else {
  console.error("❌ initWheel not found — 輪盤不會顯示");
}
}

// 等 DOM 與 Script 全部載入再啟動
window.addEventListener("load", bootSystem);