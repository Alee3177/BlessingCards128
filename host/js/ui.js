// ================================
// BlessingCards128 — UI Controller
// SOP Locked Build (UI only: no state mutation)
// ================================

import { SYS_STATE, state } from "./state.js";

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

function blink(el, on) {
  if (!el) return;
  if (on) el.classList.add("blink-btn");
  else el.classList.remove("blink-btn");
}

// ================================
// 核心：狀態 → UI 同步（只讀）
// ================================
export function applyUIState() {
  // 全部先鎖
  [lockBtn, spinBtn, secondBtn, viewBtn, pdfBtn, resetBtn].forEach(b => {
    if (!b) return;
    b.disabled = true;
    blink(b, false);
  });

  switch (state.system) {
    case SYS_STATE.INIT:
      setLamp("status-ok");
      if (statusDiv) statusDiv.textContent = "請輸入姓名並鎖定名單";
      if (summaryBox) summaryBox.textContent = "";
      if (centerText) centerText.textContent = "";
      if (lockBtn) lockBtn.disabled = false;
      if (resetBtn) resetBtn.disabled = false;
      break;

    case SYS_STATE.READY:
      setLamp("status-ok");
      if (statusDiv) statusDiv.textContent = "名單已鎖定，請開始抽第一位";
      if (spinBtn) {
        spinBtn.disabled = false;
        blink(spinBtn, true);
      }
      if (resetBtn) resetBtn.disabled = false;
      break;

    case SYS_STATE.ROUND1:
      setLamp("status-warn");
      if (statusDiv) statusDiv.textContent = "已抽出中獎者，請抽紅包";
      if (secondBtn) {
        secondBtn.disabled = false;
        blink(secondBtn, true);
      }
      if (resetBtn) resetBtn.disabled = false;
      break;

    case SYS_STATE.ROUND2:
      setLamp("status-warn");
      if (statusDiv) statusDiv.textContent = "已抽出經句紅包，請查看紅包";
      if (viewBtn) {
        viewBtn.disabled = false;
        blink(viewBtn, true);
      }
      if (resetBtn) resetBtn.disabled = false;
      break;

    case SYS_STATE.VIEWER:
      setLamp("status-warn");
      if (statusDiv) statusDiv.textContent = "紅包顯示中…請關閉視窗返回主持畫面";
      if (resetBtn) resetBtn.disabled = false;
      break;

    case SYS_STATE.FINISHED:
      setLamp("status-ok");
      if (statusDiv) statusDiv.textContent = "";
      if (summaryBox) summaryBox.textContent =
        "🎉 本輪完成\n📄 請下載 PDF\n🔁 或全部歸零重新開始";
      if (pdfBtn) pdfBtn.disabled = false;
      if (resetBtn) resetBtn.disabled = false;
      break;

    default:
      setLamp("status-error");
      if (statusDiv) statusDiv.textContent = "系統狀態錯誤，請全部歸零";
      if (resetBtn) resetBtn.disabled = false;
  }
}
