// =======================================
// BlessingCards128 — Main Controller
// Production Locked Build
// =======================================

import { SYS_STATE, state, saveState, loadState } from "./state.js";
import { applyUIState, audit, canAct } from "./ui.js";
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
const drum = new Audio("../audio/drum.mp3");
const win = new Audio("../audio/win.mp3");

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

    state.system = SYS_STATE.ROUND1;
    saveState();
    applyUIState();

    audit("ROUND1_WINNER", { name });
  });
};

// ================================
// ROUND 2 — 抽經句
// ================================
secondBtn.onclick = () => {
  if (state.lastWinnerIndex == null) return;

  drum.currentTime = 0;
  drum.play().catch(() => {});

  const verses = window.VERSE_LIST || [];
  const pool = verses.filter(v => !state.verseUsed.has(v.code));

  spin(pool, false, (verse) => {
    state.currentVerse = verse;
    state.verseUsed.add(verse.code);

    centerText.textContent = `📜 ${verse.book}\n${verse.chapter}:${verse.verse}`;
    resultDiv.textContent = verse.text;

    pushLog(state.names[state.lastWinnerIndex], verse.code);

    win.currentTime = 0;
    win.play().catch(() => {});
    launchConfetti();

    // ✅ 抽到經句後：進入 ROUND2（UI 會 enable「看紅包」）
    state.system = SYS_STATE.ROUND2;

    saveState();
    applyUIState();
  });
};

// ================================
// VIEWER（只讀）
// ================================
viewBtn.onclick = () => {
  if (!state.currentVerse) return;

  // 🛡 進入 VIEWER 狀態（UI 鎖死在「紅包顯示中…」）
  state.system = SYS_STATE.VIEWER;
  saveState();
  applyUIState();

  // 🧭 Viewer 回流旗標（回到首頁要顯示三行摘要用）
  sessionStorage.setItem("showSummaryOnReturn", "1");

  const url = `viewer.html?code=${encodeURIComponent(state.currentVerse.code)}&name=${encodeURIComponent(state.names[state.lastWinnerIndex] || "")}`;

  window.open(url, "_blank");
  audit("OPEN_VIEWER", { code: state.currentVerse.code });
};

//
// Viewer 關閉後：回到 ROUND1 或 FINISHED（嚴格狀態機）
//
window.addEventListener("focus", () => {
  if (state.system !== SYS_STATE.VIEWER) return;

  console.log("🔄 Viewer closed → resume state machine");

  // 釋放本輪暫存
  state.lastWinnerIndex = null;
  state.currentVerse = null;

  if (state.usedName.size >= state.names.length) {
    // 全部完成 → PDF / 歸零
    state.system = SYS_STATE.FINISHED;
  } else {
    // 還有人 → 下一位抽人
    state.system = SYS_STATE.ROUND1;
  }

  saveState();
  applyUIState();
});

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
