// =======================================
// BlessingCards128 — Main Controller
// SOP Locked Build (state machine owner)
// =======================================

import { SYS_STATE, state, saveState, restore, isFinished } from "./state.js";
import { applyUIState } from "./ui.js";
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

const lockBtn   = document.getElementById("lockBtn");
const spinBtn   = document.getElementById("spinBtn");
const secondBtn = document.getElementById("secondBtn");
const viewBtn   = document.getElementById("viewBtn");
const pdfBtn    = document.getElementById("pdfBtn");
const resetBtn  = document.getElementById("resetBtn");

const centerText = document.getElementById("centerText");
const resultDiv  = document.getElementById("result");
const summaryBox = document.getElementById("summaryBox");
const statusDiv  = document.getElementById("status");

// Audio (host 目錄往上一層才是 repo root)
const drum = new Audio("../drum.mp3");
const win  = new Audio("../win.mp3");

function setSystem(next) {
  console.log("🔁 STATE:", state.system, "→", next);
  state.system = next;
}

// ================================
// INIT / BOOT
// ================================
function boot() {
  restore();

  // 防呆：如果停在 VIEWER（但其實沒有開著），回到 ROUND2 讓使用者可按「看紅包」
  if (state.system === SYS_STATE.VIEWER) setSystem(SYS_STATE.ROUND2);

  initWheel();
  drawWheel();

  applyUIState();

  if (statusDiv && state.system === SYS_STATE.INIT) {
    statusDiv.textContent = "請輸入姓名並鎖定名單";
  }

  saveState();
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
}
document.body.addEventListener("click", unlockAudio, { once: true });

// ================================
// 鎖名單 (INIT → READY)
// ================================
lockBtn.onclick = () => {
  const list = parseNames(nameInput?.value || "");
  if (!list.length) {
    alert("請輸入至少一個姓名");
    return;
  }

  state.names = list;
  state.usedName.clear();
  state.verseUsed.clear();
  state.lastWinnerIndex = null;
  state.currentVerse = null;

  setSystem(SYS_STATE.READY);

  saveState();
  drawWheel();
  applyUIState();

  if (statusDiv) statusDiv.textContent = "名單已鎖定，可開始抽籤";
};

// ================================
// 抽人 (READY → ROUND1)
// ================================
spinBtn.onclick = () => {
  if (!state.names.length) return;

  setSystem(SYS_STATE.ROUND1);
  applyUIState();

  drum.currentTime = 0;
  drum.play().catch(() => {});

  const pool = state.names.filter(n => !state.usedName.has(n));
  if (!pool.length) {
    setSystem(SYS_STATE.FINISHED);
    saveState();
    applyUIState();
    return;
  }

  spin(pool, true, (name) => {
    state.lastWinnerIndex = state.names.indexOf(name);
    state.usedName.add(name);

    clearHL();
    showHL(state.lastWinnerIndex);

    if (centerText) centerText.textContent = name;
    if (resultDiv) resultDiv.textContent = `🎯 抽中：${name}`;

    // 抽完人後：仍是 ROUND1（等待按「抽紅包」）
    setSystem(SYS_STATE.ROUND1);

    saveState();
    applyUIState();
  });
};

// ================================
// 抽經句 (ROUND1 → ROUND2)
// ================================
secondBtn.onclick = () => {
  if (state.lastWinnerIndex == null) return;

  setSystem(SYS_STATE.ROUND2);
  applyUIState();

  drum.currentTime = 0;
  drum.play().catch(() => {});

  const verses = window.VERSE_LIST || [];
  const pool = verses.filter(v => !state.verseUsed.has(v.code));
  if (!pool.length) {
    alert("經句已抽完（verseUsed 已滿）");
    return;
  }

  spin(pool, false, (verse) => {
    state.currentVerse = verse;
    state.verseUsed.add(verse.code);

    if (centerText) centerText.textContent = `📜 ${verse.book}\n${verse.chapter}:${verse.verse}`;
    if (resultDiv) resultDiv.textContent = verse.text || "";

    pushLog(state.names[state.lastWinnerIndex], verse.code);

    win.currentTime = 0;
    win.play().catch(() => {});
    try { launchConfetti(); } catch (_) {}

    // 抽完經句後：仍是 ROUND2（等待按「看紅包」）
    setSystem(SYS_STATE.ROUND2);

    saveState();
    applyUIState();
  });
};

// ================================
// 看紅包 (ROUND2 → VIEWER)
// ================================
viewBtn.onclick = () => {
  if (!state.currentVerse) return;

  setSystem(SYS_STATE.VIEWER);
  saveState();
  applyUIState();

  const url = `viewer.html?code=${encodeURIComponent(state.currentVerse.code)}`;
  window.open(url, "_blank");
};

// ================================
// Viewer 關閉回來：VIEWER → READY / FINISHED
// ================================
window.addEventListener("focus", () => {
  if (state.system !== SYS_STATE.VIEWER) return;

  console.log("🔄 Viewer closed → resume SOP");

  if (isFinished()) {
    setSystem(SYS_STATE.FINISHED);
  } else {
    // 清掉本次抽籤暫存，準備下一位
    state.currentVerse = null;
    state.lastWinnerIndex = null;
    setSystem(SYS_STATE.READY);
  }

  saveState();
  applyUIState();
});

// ================================
// PDF（只允許 FINISHED）
// ================================
pdfBtn.onclick = async () => {
  if (state.system !== SYS_STATE.FINISHED) {
    alert("尚未全部抽完，完成後才可下載 PDF");
    return;
  }

  const logs = JSON.parse(localStorage.getItem("drawLogs") || "[]");
  if (!logs.length) {
    alert("沒有可下載的抽籤紀錄");
    return;
  }

  try {
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
  } catch (e) {
    console.error(e);
    alert("PDF 產生失敗");
  }
};

// ================================
// RESET（任意 → INIT）
// ================================
resetBtn.onclick = () => {
  const ok = confirm("資料紀錄將被清空 & 歸零\n需重新輸入姓名並開始新一輪\n確定要執行嗎？");
  if (!ok) return;

  state.names = [];
  state.usedName.clear();
  state.verseUsed.clear();
  state.lastWinnerIndex = null;
  state.currentVerse = null;

  localStorage.removeItem("drawLogs");

  setSystem(SYS_STATE.INIT);

  if (nameInput) nameInput.value = "";
  if (centerText) centerText.textContent = "";
  if (resultDiv) resultDiv.textContent = "";
  if (summaryBox) summaryBox.textContent = "";
  if (statusDiv) statusDiv.textContent = "請輸入姓名並鎖定名單";

  clearHL();
  initWheel();
  drawWheel();

  saveState();
  applyUIState();
};

window.addEventListener("beforeunload", () => saveState());
