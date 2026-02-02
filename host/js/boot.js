// =============================
// BlessingCards128 Boot Loader
// Production Locked Build
// =============================

import { state, SYS_STATE, restore, saveState } from "./state.js";
import { bindUI, applyUIState, setStatus } from "./ui.js";
import { drawInitialWheel } from "./wheel.js";
import { initMain } from "./main.js";

// =============================
// 啟動流程
// =============================
async function boot() {
  console.log("🚀 Booting BlessingCards128...");

  // 1️⃣ 等 DOM 完全可用
  if (document.readyState === "loading") {
    await new Promise(r =>
      document.addEventListener("DOMContentLoaded", r, { once: true })
    );
  }

  // 2️⃣ 嘗試還原狀態
  const restored = restore();

  // 3️⃣ 若還原失敗，強制 INIT
  if (!restored) {
    state.system = SYS_STATE.INIT;
    saveState();
    console.log("🆕 Fresh INIT state created");
  }

  // 4️⃣ 綁定 UI
  bindUI();

  // 5️⃣ 畫輪盤
  drawInitialWheel();

  // 6️⃣ 同步畫面與狀態機
  applyUIState();

  // 7️⃣ 狀態提示
  setStatus(
    restored
      ? "已恢復上次狀態"
      : "請輸入姓名並鎖定名單"
  );

  console.log("✅ BlessingCards128 READY:", state.system);
}

// =============================
// 啟動
// =============================
boot();
