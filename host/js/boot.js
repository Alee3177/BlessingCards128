// host/js/boot.js
(() => {
  const MASTER_KEY = "BC_MASTER_LOCK_V2";
  const TTL = 120000;       // 120s (background tabs won't expire so easily)
  const HEARTBEAT_MS = 4000;

  const TAB_ID = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random();

  const now = () => Date.now();

  function readLock(){
    try { return JSON.parse(localStorage.getItem(MASTER_KEY) || "null"); }
    catch { return null; }
  }

  function writeLock(){
    localStorage.setItem(MASTER_KEY, JSON.stringify({ tabId: TAB_ID, ts: now() }));
  }

  function isExpired(lock){
    return !lock || !lock.ts || (now() - lock.ts > TTL);
  }

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

  function canAct(){
    const cur = readLock();
    return !!(cur && cur.tabId === TAB_ID && !isExpired(cur));
  }

function forceUnlock(){
  try {
    localStorage.removeItem(MASTER_KEY);
  } catch (e) {}
}

  window.__BC_MASTER__ = { TAB_ID, canAct, forceUnlock };

  // Acquire immediately
  tryAcquire();
  heartbeat();

  // Keep alive (even when throttled, TTL is long)
setInterval(() => {

  const cur = readLock();

  if (!cur || isExpired(cur)) {
    writeLock();
    return;
  }

  if (cur.tabId === TAB_ID) {
    writeLock();
  }

}, HEARTBEAT_MS);

  // Also refresh when returning from background (mobile)
window.addEventListener("focus", () => {

  if (tryAcquire()) {
    heartbeat();
    console.log("🎤 主持鎖重新取得");
  }

});

document.addEventListener("visibilitychange", () => {

  if (document.visibilityState === "visible") {

    if (tryAcquire()) {
      heartbeat();
      console.log("🎤 主持鎖重新取得");
    }

  }

});
})();
