// host/js/boot.js
(() => {
  const MASTER_KEY = "BC_MASTER_LOCK_V2";
  const TTL = 999999999;
  const HEARTBEAT_MS = 5000;

  const TAB_ID = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random();
  const now = () => Date.now();

  function readLock(){
    try { return JSON.parse(localStorage.getItem(MASTER_KEY) || "null"); }
    catch { return null; }
  }
  function writeLock(){ localStorage.setItem(MASTER_KEY, JSON.stringify({ tabId: TAB_ID, ts: now() })); }
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
    if (cur && cur.tabId === TAB_ID) writeLock();
  }
  function clearIfMine(){
    try{
      const cur = readLock();
      if (cur && cur.tabId === TAB_ID) localStorage.removeItem(MASTER_KEY);
    }catch{}
  }

  window.__BC_MASTER__ = {
    TAB_ID,
    canAct: () => {
      const cur = readLock();
      return !!(cur && cur.tabId === TAB_ID && !isExpired(cur));
    },
    forceUnlock: () => { localStorage.removeItem(MASTER_KEY); }
  };

  // Acquire once, then keep heartbeat
  tryAcquire();
  setInterval(() => { if (tryAcquire()) heartbeat(); }, HEARTBEAT_MS);
  window.addEventListener("beforeunload", clearIfMine);
})();
