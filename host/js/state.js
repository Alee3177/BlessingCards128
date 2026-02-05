// host/js/state.js
(() => {
  const KEY = "BC_STATE_V1";

  // System states (single source of truth)
  const SYS = Object.freeze({
    INIT: "INIT",
    ROUND1: "ROUND1",
    ROUND2: "ROUND2",
    VIEWER: "VIEWER",
    FINISHED: "FINISHED",
  });
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

  function clone(x){ return JSON.parse(JSON.stringify(x)); }

  function sanitize(s){
    const d = defaultState();
    if (!s || typeof s !== "object") s = {};
    for (const k of Object.keys(d)){
      if (!(k in s)) s[k] = clone(d[k]);
    }
    if (!Array.isArray(s.names)) s.names = [];
    if (!Array.isArray(s.usedName)) s.usedName = [];
    if (!Array.isArray(s.verseUsed)) s.verseUsed = [];
    if (!Array.isArray(s.logs)) s.logs = [];
    if (!Object.values(SYS).includes(s.system)){
      s.system = s.locked ? SYS.ROUND1 : SYS.INIT;
    }
    if (typeof s.locked !== "boolean") s.locked = false;
    if (typeof s.lastWinnerIndex !== "number") s.lastWinnerIndex = -1;
    if (s.currentVerse && typeof s.currentVerse !== "object") s.currentVerse = null;
    return s;
  }

  // Public state
  window.state = defaultState();

  window.loadState = function loadState(){
    try{
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const s = sanitize(JSON.parse(raw));
      window.state = s;
    }catch(e){
      console.warn("loadState failed", e);
    }
  };

  window.saveState = function saveState(){
    try{
      localStorage.setItem(KEY, JSON.stringify(window.state));
    }catch(e){
      console.warn("saveState failed", e);
    }
  };

  window.resetState = function resetState(){
    window.state = defaultState();
    try{ localStorage.removeItem(KEY); }catch{}
    try{ localStorage.removeItem("LAST_VERSE"); }catch{}
    try{ localStorage.removeItem("drawLogs"); }catch{}
  };
})();
