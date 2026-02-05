// host/js/boot.js
(() => {
  // =============================
  // Master lock (single host)
  // =============================
  const MASTER_KEY = "BC_MASTER_LOCK_V1";
  const TTL = 15000;      // 15s
  const HEARTBEAT_MS = 5000;

  const TAB_ID = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (String(Date.now()) + "-" + Math.random());

  function now(){ return Date.now(); }

  function readLock(){
    try { return JSON.parse(localStorage.getItem(MASTER_KEY) || "null"); }
    catch { return null; }
  }

  function writeLock(){
    localStorage.setItem(MASTER_KEY, JSON.stringify({ tabId: TAB_ID, ts: now() }));
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

  function clearLock(){
    try{
      const cur = readLock();
      if (cur && cur.tabId === TAB_ID) localStorage.removeItem(MASTER_KEY);
    }catch{}
  }

  window.__BC_MASTER__ = {
    TAB_ID,
    canAct: () => {
      const cur = readLock();
      return cur && cur.tabId === TAB_ID && !isExpired(cur);
    },
    forceUnlock: () => localStorage.removeItem(MASTER_KEY),
  };

  // Acquire and heartbeat
  tryAcquire();
  setInterval(() => { if (tryAcquire()) writeLock(); }, HEARTBEAT_MS);
  window.addEventListener("beforeunload", () => clearLock());

  // =============================
  // Boot system
  // =============================
  function boot(){
    console.log("🚀 BlessingCards128 booting...");
    loadState();

    // Ensure INIT if not locked
    if (!state.locked) state.system = SYS_STATE.INIT;

    // Init wheel (canvas exists after DOM)
    initWheel(["1","2"]);

    // Bind main handlers
    if (typeof window.__bc_bindMain === "function") window.__bc_bindMain();

    // Apply UI
    applyUIState();

    // Update QR
    if (window.__BC_MAIN__ && typeof window.__BC_MAIN__.updateQR === "function"){
      window.__BC_MAIN__.updateQR();
    }

    // If locked, show wheel for current round
    if (state.locked && window.__BC_MAIN__){
      window.__BC_MAIN__.updateWheelForRound();
      applyUIState();
    }

    console.log("✅ Boot OK");
  }

  window.addEventListener("load", boot);
})();
