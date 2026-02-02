// =======================================
// BlessingCards128 — Main Controller
// Production Locked Build
// =======================================

import { SYS_STATE, state, saveState, loadState } from "./state.js";
import { applyUIState, audit, canAct, onViewerReturn } from "./ui.js";
import {
  initWheel,
  drawWheel,
  clearHL,
  showHL,
  spin,
  launchConfetti
} from "./wheel.js";

// ================================
// DOM
// ================================
const nameInput = document.getElementById("nameInput");

const lockBtn = document.getElementById("lockBtn");
const spinBtn = document.getElementById("spinBtn");
const secondBtn = document.getElementById("secondBtn");
const viewBtn = document.getElementById("viewBtn");
const pdfBtn = document.getElementById("pdfBtn");
const resetBtn = document.getElementById("resetBtn");

const centerText = document.getElementById("centerText");
const resultDiv = document.getElementById("resultDiv");
const summaryBox = document.getElementById("summaryBox");
const statusDiv = document.getElementById("statusDiv");

// Audio
const drum = new Audio("../drum.mp3");
const win = new Audio("../win.mp3");

// ================================
// INIT
// ================================
function boot() {
  loadState();
  initWheel();
  drawWheel();
  applyUIState();
  statusDiv.textContent = "系統初始化中";
}

window.addEventListener("load", boot);

// ================================
// 工具
// ================================
function parseNames(input) {
  return input
    .split(/[,，\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function allDrawn() {
  return state.usedName.size >= state.names.length;
}

function pushLog(name, ref) {
  const logs = JSON.parse(localStorage.getItem("drawLogs") || "[]");
  const now = new Date();
  const time = now.toTimeString().slice(0, 8);

  logs.push({ name, ref, time });
  localStorage.setItem("drawLogs", JSON.stringify(logs));
}

// ================================
// AUDIO 解鎖
// ================================
function unlockAudio() {
  drum.play().then(() => drum.pause()).catch(() => {});
  win.play().then(() => win.pause()).catch(() => {});
  audit("AUDIO_UNLOCKED");
}
document.body.addEventListener("click", unlockAudio, { once: true });

// ================================
// LOCK NAMES
// ================================
lockBtn.onclick = () => {
  if (!canAct()) return;

  const raw = nameInput.value;
  const list = parseNames(raw);

  if (!list.length) {
    alert("請輸入至少一個姓名");
    return;
  }

  state.names = list;
  state.usedName.clear();
  state.verseUsed.clear();

  state.system = SYS_STATE.READY;

  saveState();
  applyUIState();
  drawWheel();

  audit("LOCK_NAMES", { count: list.length });
  statusDiv.textContent = "名單已鎖定，可開始抽籤";
};

// ================================
// ROUND 1 — 抽姓名
// ================================
spinBtn.onclick = () => {
  if (!canAct()) return;
  if (!state.names.length) return;

  state.system = SYS_STATE.ROUND1;
  applyUIState();

  drum.currentTime = 0;
  drum.play().catch(() => {});

  const pool = state.names.filter(n => !state.usedName.has(n));

  spin(pool, true, (name, idx) => {
    state.lastWinnerIndex = state.names.indexOf(name);
    state.usedName.add(name);

    clearHL();
    showHL(state.lastWinnerIndex);

    centerText.textContent = name;
    resultDiv.textContent = `🎯 抽中：${name}`;

    state.system = SYS_STATE.ROUND2;
    saveState();
    applyUIState();

    audit("ROUND1_WINNER", { name });
  });
};

// ================================
// ROUND 2 — 抽經句
// ================================
secondBtn.onclick = () => {
  if (!canAct()) return;
  if (state.lastWinnerIndex == null) return;

  drum.currentTime = 0;
  drum.play().catch(() => {});

  const verses = window.VERSE_LIST || [];
  const pool = verses.filter(v => !state.verseUsed.has(v.code));

  spin(pool, false, (verse) => {
    state.currentVerse = verse;
    state.verseUsed.add(verse.code);

    centerText.textContent =
      `📜 ${verse.book}\n${verse.chapter}:${verse.verse}`;
    resultDiv.textContent = verse.text;

    pushLog(
      state.names[state.lastWinnerIndex],
      verse.code
    );

    win.currentTime = 0;
    win.play().catch(() => {});
    launchConfetti();

    audit("ROUND2_VERSE", {
      name: state.names[state.lastWinnerIndex],
      verse: verse.code
    });

// ROUND2 結束一定進 VIEWER
state.system = SYS_STATE.VIEWER;

    saveState();
    applyUIState();
  });
};

// ================================
// VIEWER（只讀｜SOP 鎖死版）
// ================================
viewBtn.onclick = () => {
  if (!state.currentVerse) return;

  // 🛡 推進狀態機
  state.system = SYS_STATE.VIEWER;
  saveState();
  applyUIState();

  // 🧭 Viewer 回流旗標
  sessionStorage.setItem("showSummaryOnReturn", "1");

  // 🔗 組 Viewer URL（只帶經句代碼）
  const url = `viewer.html?code=${encodeURIComponent(
    state.currentVerse.code
  )}`;

  window.open(url, "_blank");

  audit("OPEN_VIEWER", {
    code: state.currentVerse.code,
    state: "VIEWER"
  });
};

// ================================
// PDF
// ================================
pdfBtn.onclick = async () => {
  if (!canAct()) return;

  try {
    const logs = JSON.parse(localStorage.getItem("drawLogs") || "[]");
    if (!logs.length) {
      alert("沒有可下載的抽籤紀錄");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    let y = 20;
    pdf.setFontSize(14);
    pdf.text("祝福經句紅包 — 抽籤紀錄", 10, y);
    y += 10;

    logs.slice().reverse().forEach(l => {
      const line = `[${l.time}] ${l.name} → ${l.ref}`;
      pdf.text(line, 10, y);
      y += 8;
    });

    pdf.save("BlessingCards128_Record.pdf");

    state.system = SYS_STATE.FINISHED;
    saveState();
    applyUIState();

    audit("PDF_DOWNLOADED");
  } catch (e) {
    console.error(e);
    alert("PDF 產生失敗");
  }
};

// ================================
// RESET
// ================================
resetBtn.onclick = () => {
  if (!canAct()) return;

  const ok = confirm(
    "資料紀錄將被清空 & 歸零\n需重新輸入姓名並開始新一輪\n確定要執行嗎？"
  );
  if (!ok) return;

  audit("SYSTEM_RESET");

  state.names = [];
  state.usedName.clear();
  state.verseUsed.clear();
  state.lastWinnerIndex = null;
  state.currentVerse = null;

  localStorage.removeItem("drawLogs");

  state.system = SYS_STATE.INIT;

  nameInput.value = "";
  centerText.textContent = "";
  resultDiv.textContent = "";
  summaryBox.textContent = "";
  statusDiv.textContent = "請輸入姓名並鎖定名單";

  clearHL();
  initWheel();

  saveState();
  applyUIState();
};

// ================================
// 防意外離開
// ================================
window.addEventListener("beforeunload", () => {
  saveState();
});

// ================================
// Viewer 關閉 / 回到主持機 → 狀態機續跑
// ================================
window.addEventListener("focus", () => {
  if (state.system !== SYS_STATE.VIEWER) return;

  console.log("🔄 Viewer closed → resume state machine");

  // 🛡 只用狀態機，不用數量猜狀態
  if (state.usedName.size >= state.names.length) {
    state.system = SYS_STATE.FINISHED;
  } else {
    state.system = SYS_STATE.READY;
  }

  saveState();
  applyUIState();
});