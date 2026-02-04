// host/js/state.js
const STATE_KEY = "BC_STATE_V1";

const SYS_STATE = {
  INIT: "INIT",
  READY: "READY",
  ROUND1: "ROUND1",
  ROUND2: "ROUND2",
  VIEWER: "VIEWER",
  FINISHED: "FINISHED"
};

function makeState(){
  return {
    system: SYS_STATE.INIT,
    names: [],
    usedName: [],
    verseUsed: [],
    lastWinnerIndex: null,
    currentVerse: null,
    logs: []
  };
}

let state = makeState();

function saveState(){
  const s = {
    ...state,
    usedName: Array.from(new Set(state.usedName)),
    verseUsed: Array.from(new Set(state.verseUsed)),
  };
  localStorage.setItem(STATE_KEY, JSON.stringify(s));
}

function loadState(){
  try{
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") return;
    state = { ...makeState(), ...s };
  }catch{}
}

function resetState(){
  state = makeState();
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem("LAST_VERSE");
  localStorage.removeItem("VIEWER_DONE");
}
