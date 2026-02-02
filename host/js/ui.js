// ================================
// BlessingCards128 — UI Controller
// Production Locked Build
// ================================

import { SYS_STATE, state, saveState } from "./state.js";

// ===== DOM 綁定 =====
const lockBtn   = document.getElementById("lockBtn");
const spinBtn   = document.getElementById("spinBtn");
const secondBtn = document.getElementById("secondBtn");
const viewBtn   = document.getElementById("viewBtn");
const pdfBtn    = document.getElementById("pdfBtn");
const resetBtn  = document.getElementById("resetBtn");

const statusDiv  = document.getElementById("status");
const summaryBox = document.getElementById("summaryBox");
const centerText = document.getElementById("centerText");

const statusBar = document.getElementById("statusBar");

// ===== 狀態燈 =====
function setLamp(type) {
  if (!statusBar) return;
  statusBar.classList.remove("status-ok", "status-warn", "status-error");
  statusBar.classList.add(type);
}

// ===== 小工具 =====
function blink(el, on) {
  if (!el) return;
  if (on) el.classList.add("blink-btn");
  else el.classList.remove("blink-btn");
}

// ================================
// 核心：狀態 → UI 同步
// ================================
export function applyUIState() {

  const total = state.names.length;
  const drawn = state.usedName.size;

  // 全部先鎖
  [
    lockBtn, spinBtn, secondBtn,
    viewBtn, pdfBtn, resetBtn
  ].forEach(b => {
    if (!b) return;
    b.disabled = true;
    blink(b, false);
  });

  // ===== INIT =====
  if (state.system === SYS_STATE.INIT) {
    setLamp("status-ok");

    statusDiv.textContent = "請輸入姓名並鎖定名單";
    summaryBox.textContent = "";
    centerText.textContent = "";

    lockBtn.disabled = false;
    resetBtn.disabled = false;

    return;
  }

  // ===== READY =====
  if (state.system === SYS_STATE.READY) {
    setLamp("status-ok");

    statusDiv.textContent = "名單已鎖定，請開始抽籤";
    summaryBox.textContent = "";

    spinBtn.disabled = false;
    blink(spinBtn, true);

    resetBtn.disabled = false;
    return;
  }

  // ===== ROUND1 =====
  if (state.system === SYS_STATE.ROUND1) {
    setLamp("status-warn");

    statusDiv.textContent = "正在抽出幸運者…";
    return;
  }

  // ===== ROUND2 =====
  if (state.system === SYS_STATE.ROUND2) {
    setLamp("status-warn");

    statusDiv.textContent = "正在抽出經句紅包…";
    return;
  }

  // ===== VIEWER =====
  if (state.system === SYS_STATE.VIEWER) {
    setLamp("status-warn");

    statusDiv.textContent = "查看紅包中…";

    viewBtn.disabled = false;
    blink(viewBtn, true);

    resetBtn.disabled = false;
    return;
  }

  // ===== FINISHED =====
  if (state.system === SYS_STATE.FINISHED) {
    setLamp("status-ok");

    statusDiv.textContent = "";

    summaryBox.textContent =
      `🎉 此輪轉盤已完成 ${total} 位的紅包抽籤\n` +
      `📄 請按「抽籤紀錄 PDF」下載紀錄\n` +
      `🔁 或按「全部歸零」開始新一輪`;

    pdfBtn.disabled = false;
    pdfBtn.classList.add("btn-pdf-ready");

    resetBtn.disabled = false;
    resetBtn.classList.add("btn-reset-danger");

    return;
  }

  // ===== 尚未抽完（從 VIEWER 回來） =====
  if (drawn < total) {
    setLamp("status-ok");

    statusDiv.textContent = "請繼續下一位抽經句紅包";

    spinBtn.disabled = false;
    blink(spinBtn, true);

    resetBtn.disabled = false;
    return;
  }

}

// ================================
// Viewer 回來強制同步
// ================================
export function onViewerReturn() {
  console.log("🔄 Viewer return → sync UI");

  if (state.usedName.size >= state.names.length) {
    state.system = SYS_STATE.FINISHED;
  } else {
    state.system = SYS_STATE.READY;
  }

  saveState();
  applyUIState();
}
