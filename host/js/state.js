// host/js/state.js
(() => {
  const KEY = "BC_STATE_V2";

  const SYS = {
    INIT: "INIT",
    ROUND1: "ROUND1",
    ROUND2: "ROUND2",
    VIEWER: "VIEWER",
    FINISHED: "FINISHED"
  };
  window.SYS = SYS;

  const defaultState = () => ({
    system: SYS.INIT,
    locked: false,
    names: [],
    usedName: [],   // array for storage
    verseUsed: [],  // array for storage (e.g. ["001","002"])
    lastWinnerIndex: -1,
    currentVerse: null, // {code:"068", ref:"詩篇 121:5-8"}
    logs: [] // {t,name,code,ref}
  });

  window.state = defaultState();

  const clone = (x) => JSON.parse(JSON.stringify(x));

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if (!raw) return;

    const s = JSON.parse(raw);
    const d = defaultState();

    // 補齊缺欄位
    for (const k of Object.keys(d)){
      if (!(k in s)) s[k] = d[k];
    }

    // sanitize arrays
    if (!Array.isArray(s.names)) s.names = [];
    if (!Array.isArray(s.usedName)) s.usedName = [];
    if (!Array.isArray(s.verseUsed)) s.verseUsed = [];
    if (!Array.isArray(s.logs)) s.logs = [];

    // ⭐ 去重（非常重要）
    s.usedName = [...new Set(s.usedName)];
    s.verseUsed = [...new Set(s.verseUsed)];

    // sanitize currentVerse
    if (s.currentVerse && typeof s.currentVerse !== "object") {
      s.currentVerse = null;
    }

    // sanitize system
    if (!s.system || !Object.values(SYS).includes(s.system)) {
      s.system = s.locked ? SYS.ROUND1 : SYS.INIT;
    }

    // ⭐ locked 與 names 同步校驗
    if (s.locked && (!Array.isArray(s.names) || s.names.length === 0)) {
      s.locked = false;
      s.system = SYS.INIT;
    }

    window.state = s;

  }catch(e){
    console.warn("loadState failed", e);
  }
}

  function saveState(){
    try{ localStorage.setItem(KEY, JSON.stringify(window.state)); }catch{}
  }

  function resetState(){
    window.state = defaultState();
    saveState();
  }

  window.loadState = loadState;
  window.saveState = saveState;
  window.resetState = resetState;
})();
