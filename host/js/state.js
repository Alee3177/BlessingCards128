// host/js/state.js
(() => {
  const KEY = "BC_STATE_V1";

  const SYS = {
    INIT: "INIT",
    ROUND1: "ROUND1",
    ROUND2: "ROUND2",
    VIEWER: "VIEWER",
    FINISHED: "FINISHED",
  };

  // serializable state
  const state = {
    system: SYS.INIT,
    names: [],
    usedName: [],     // array of used name strings
    verseUsed: [],    // array of used verse codes "001"
    lastWinnerName: "",
    lastWinnerIndex: -1,
    currentVerse: "", // "001"
    round: 0,
    logs: [],         // {t,name,verse,ref}
    locked: false
  };

  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

  function normalizeAfterLoad(s){
    if (!s || typeof s !== "object") return;
    // Fix missing fields
    for (const k of Object.keys(state)) {
      if (!(k in s)) s[k] = clone(state[k]);
    }
    // Basic sanity
    if (!Array.isArray(s.names)) s.names = [];
    if (!Array.isArray(s.usedName)) s.usedName = [];
    if (!Array.isArray(s.verseUsed)) s.verseUsed = [];
    if (!Array.isArray(s.logs)) s.logs = [];
    if (!s.locked || s.names.length === 0) {
      s.locked = false;
      s.system = SYS.INIT;
    }
    if (!Object.values(SYS).includes(s.system)) s.system = s.locked ? SYS.ROUND1 : SYS.INIT;
  }

  function saveState(){
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  function loadState(){
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s) {
        Object.assign(state, s);
        normalizeAfterLoad(state);
      } else {
        normalizeAfterLoad(state);
      }
    } catch {
      normalizeAfterLoad(state);
    }
    return state;
  }

  function resetState(){
    state.system = SYS.INIT;
    state.names = [];
    state.usedName = [];
    state.verseUsed = [];
    state.lastWinnerName = "";
    state.lastWinnerIndex = -1;
    state.currentVerse = "";
    state.round = 0;
    state.logs = [];
    state.locked = false;
    saveState();
  }

  function usedNameSet(){ return new Set(state.usedName); }
  function verseUsedSet(){ return new Set(state.verseUsed); }

  window.SYS_STATE = SYS;
  window.state = state;
  window.saveState = saveState;
  window.loadState = loadState;
  window.resetState = resetState;
  window.usedNameSet = usedNameSet;
  window.verseUsedSet = verseUsedSet;
})();
