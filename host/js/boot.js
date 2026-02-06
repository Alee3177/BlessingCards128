// host/js/boot.js
(() => {

  const MASTER_KEY = "BC_MASTER_LOCK_SINGLE";
  const TAB_ID = Date.now() + "_" + Math.random();

  function writeLock(){
    localStorage.setItem(MASTER_KEY, JSON.stringify({
      tabId: TAB_ID
    }));
  }

  function canAct(){
    const raw = localStorage.getItem(MASTER_KEY);
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);
      return data.tabId === TAB_ID;
    } catch {
      return false;
    }
  }

  function forceUnlock(){
    localStorage.removeItem(MASTER_KEY);
    writeLock();
  }

  window.__BC_MASTER__ = {
    TAB_ID,
    canAct,
    forceUnlock
  };

  // ⭐ 啟動時直接取得主持權
  writeLock();

})();