import { KEYS, PHASE } from "./constants.js";

export function defaultState(){
  return {
    phase: PHASE.INIT,
    names: [],
    usedNames: [],
    usedVerses: [],
    currentName: null,
    currentVerseNo: null,
    currentVerseRef: null,
    round2Started: false,
    rotation: 0
  };
}

export function loadState(){
  try{
    const raw = sessionStorage.getItem(KEYS.STATE);
    if(!raw) return defaultState();
    const st = JSON.parse(raw);
    const d = defaultState();
    // merge with defaults for forward-compat
    return { ...d, ...st };
  }catch(e){
    return defaultState();
  }
}

export function saveState(st){
  try{
    sessionStorage.setItem(KEYS.STATE, JSON.stringify(st));
  }catch(e){}
}

export function clearReturnFlag(){
  try{ sessionStorage.removeItem(KEYS.RETURN_FLAG); }catch(e){}
}

export function getReturnFlag(){
  try{ return sessionStorage.getItem(KEYS.RETURN_FLAG)==="1"; }catch(e){ return false; }
}

export function setReturnFlag(){
  try{ sessionStorage.setItem(KEYS.RETURN_FLAG,"1"); }catch(e){}
}

export function appendLog(entry){
  try{
    const raw = localStorage.getItem(KEYS.LOGS) || "[]";
    const logs = JSON.parse(raw);
    if(Array.isArray(logs)){
      logs.push(entry);
      localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    }
  }catch(e){}
}

export function readLogs(){
  try{
    const raw = localStorage.getItem(KEYS.LOGS) || "[]";
    const logs = JSON.parse(raw);
    return Array.isArray(logs) ? logs : [];
  }catch(e){ return []; }
}