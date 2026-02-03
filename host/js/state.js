// =============================
// BlessingCards128 State Core
// Production Locked Build
// =============================

export const SYS_STATE = Object.freeze({
  INIT: "INIT",
  READY: "READY",
  ROUND1: "ROUND1",
  ROUND2: "ROUND2",
  VIEWER: "VIEWER",
  FINISHED: "FINISHED"
});

export const state = {
  system: SYS_STATE.INIT,

  names: [],
  usedName: new Set(),
  verseUsed: new Set(),

  lastWinnerIndex: null,
  currentVerse: null,

  pdfRoundSerial: null,
  pdfRepeatCount: 0,
  pdfDownloadedThisRound: false
};

const KEY = "BLESSING_STATE_V1";

// ===== 儲存 =====
export function saveState() {
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
    console.warn("⚠ saveState failed", e);
  }
}

// ===== 還原 =====
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
    console.warn("⚠ restore failed", e);
    return false;
  }
}

// ===== 工具 =====
export function isFinished() {
  return (
    state.names.length > 0 &&
    state.usedName.size === state.names.length
  );
}
