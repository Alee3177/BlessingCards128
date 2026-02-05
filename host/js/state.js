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
      for (const k of Object.keys(d)){
        if (!(k in s)) s[k] = d[k];
      }
      // sanitize
      if (!Array.isArray(s.names)) s.names = [];
      if (!Array.isArray(s.usedName)) s.usedName = [];
      if (!Array.isArray(s.verseUsed)) s.verseUsed = [];
      if (!Array.isArray(s.logs)) s.logs = [];
      if (!Object.values(SYS).includes(s.system)) s.system = s.locked ? SYS.ROUND1 : SYS.INIT;

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
