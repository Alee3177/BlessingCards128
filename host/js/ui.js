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
const statusBar  = document.getElementById("statusBar");

// ===== 狀態燈 =====
function setLamp(type) {
  if (!statusBar) return;
  statusBar.classList.remove("status-ok", "status-warn", "status-error");
  statusBar.classList.add(type);
}

// ===== 小工具 =====
function blink(el, on) {
  if (!el) return;
  el.classList.toggle("blink-btn", on);
}

// ================================
// UI 只負責「畫面同步」
// 不推狀態、不算人數
// ================================
export function applyUIState() {

  [
    lockBtn, spinBtn, secondBtn,
    viewBtn, pdfBtn, resetBtn
  ].forEach(b => {
    if (!b) return;
    b.disabled = true;
    blink(b, false);
  });

  switch (state.system) {

    case SYS_STATE.INIT:
      setLamp("status-ok");
      statusDiv.textContent = "請輸入姓名並鎖定名單";
      summaryBox.textContent = "";
      centerText.textContent = "";
      lockBtn.disabled = false;
      resetBtn.disabled = false;
      break;

    case SYS_STATE.READY:
      setLamp("status-ok");
      statusDiv.textContent = "名單已鎖定，請開始抽第一位";
      spinBtn.disabled = false;
      blink(spinBtn, true);
      resetBtn.disabled = false;
      break;

    case SYS_STATE.ROUND1:
      setLamp("status-warn");
      statusDiv.textContent = "已抽出中獎者，請抽紅包";
      secondBtn.disabled = false;
      blink(secondBtn, true);
      resetBtn.disabled = false;
      break;

    case SYS_STATE.ROUND2:
      setLamp("status-warn");
      statusDiv.textContent = "已抽出經句紅包，請查看紅包";
      viewBtn.disabled = false;
      blink(viewBtn, true);
      resetBtn.disabled = false;
      break;

    case SYS_STATE.VIEWER:
      setLamp("status-warn");
      statusDiv.textContent = "紅包顯示中…請關閉視窗返回主持畫面";
      resetBtn.disabled = false;
      break;

    case SYS_STATE.FINISHED:
      setLamp("status-ok");
      statusDiv.textContent = "";
      summaryBox.textContent =
        `🎉 本輪完成\n📄 請下載 PDF\n🔁 或全部歸零重新開始`;
      pdfBtn.disabled = false;
      pdfBtn.classList.add("btn-pdf-ready");
      resetBtn.disabled = false;
      resetBtn.classList.add("btn-reset-danger");
      break;

    default:
      setLamp("status-error");
      statusDiv.textContent = "系統狀態錯誤，請全部歸零";
      resetBtn.disabled = false;
  }

  saveState();
}