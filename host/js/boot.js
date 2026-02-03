// =============================
// BlessingCards128 Boot Loader
// Production Locked Build
// =============================

// 只負責載入模組（順序很重要）
import "./state.js";
import "./ui.js";
import "./wheel.js";
import "./main.js";

console.log("🚀 BlessingCards128 BOOT OK");
