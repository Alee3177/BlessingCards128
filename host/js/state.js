// ===============================
// BlessingCards128 — State Machine Core
// Production Locked Build
// ===============================

// ===== 系統狀態列舉 =====
export const SYS_STATE = Object.freeze({
  INIT: "INIT",
  READY: "READY",
  ROUND1: "ROUND1",
  ROUND2: "ROUND2",
  VIEWER: "VIEWER",
  FINISHED: "FINISHED"
});

// ===== 全域狀態 =====
export const state = {
  system: SYS_STATE.INIT,

  // 名單 / 抽籤
  names: [],
  usedName: new Set(),
  verseUsed: new Set(),

  // 當前輪資訊
  lastWinnerIndex: null,
  currentVerse: null,

  // PDF 防呆
  pdfRoundSerial: null,
  pdfRepeatCount: 0,
  pdfDownloadedThisRound: false
};

// ===============================
// 狀態存取
// ===============================
export function setState(next) {
  console.log("🧠 STATE:", state.system, "→", next);
  state.system = next;
  persist();
}

export function getState() {
  return state.system;
}

// ===============================
// 流程權限檢查
// ===============================
export function canAct(expected = null) {
  if (!expected) return true;
  return state.system === expected;
}

// ===============================
// 名單管理
// ===============================
export function setNames(list) {
  state.names = list;
  state.usedName.clear();
  state.verseUsed.clear();
  state.lastWinnerIndex = null;
  state.currentVerse = null;
  resetPdfFlags();
}

export function markNameUsed(i) {
  state.usedName.add(i);
  state.lastWinnerIndex = i;
}

export function markVerseUsed(v) {
  state.verseUsed.add(v);
  state.currentVerse = v;
}

// ===============================
// PDF 防呆
// ===============================
export function resetPdfFlags() {
  state.pdfRoundSerial = null;
  state.pdfRepeatCount = 0;
  state.pdfDownloadedThisRound = false;
}

// ===============================
// 儲存 / 還原
// ===============================
const KEY = "BLESSING_STATE_V1";

export function persist() {
  try {
    const snapshot = {
      system: state.system,
      names: state.names,
      usedName: [...state.usedName],
      verseUsed: [...state.verseUsed],
      lastWinnerIndex: state.lastWinnerIndex,
      currentVerse: state.currentVerse,
      pdfRoundSerial: state.pdfRoundSerial,
      pdfRepeatCount: state.pdfRepeatCount,
      pdfDownloadedThisRound: state.pdfDownloadedThisRound
    };
    sessionStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn("⚠ state persist failed", e);
  }
}

export function restore() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return false;

    const snap = JSON.parse(raw);

    state.system = snap.system || SYS_STATE.INIT;
    state.names = snap.names || [];
    state.usedName = new Set(snap.usedName || []);
    state.verseUsed = new Set(snap.verseUsed || []);
    state.lastWinnerIndex = snap.lastWinnerIndex || null;
    state.currentVerse = snap.currentVerse || null;

    state.pdfRoundSerial = snap.pdfRoundSerial || null;
    state.pdfRepeatCount = snap.pdfRepeatCount || 0;
    state.pdfDownloadedThisRound = snap.pdfDownloadedThisRound || false;

    console.log("🔄 State restored:", state.system);
    return true;
  } catch (e) {
    console.warn("⚠ state restore failed", e);
    return false;
  }
}

// ===============================
// 工具
// ===============================
export function isFinished() {
  return (
    state.names.length > 0 &&
    state.usedName.size === state.names.length
  );
}
