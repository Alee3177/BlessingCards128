import { setReturnFlag } from "./core/storage.js";
import { unlockAudioOnce, safePlay } from "./modules/audio.js";

const baseUrl = new URL(".", location.href);

const qs = new URLSearchParams(location.search);
const no = qs.get("no");
const ref = qs.get("ref") || "";
const name = qs.get("name") || "";

const img = document.getElementById("imgVerse");
const title = document.getElementById("title");
const meta = document.getElementById("meta");
const loading = document.getElementById("loading");

const btnNext = document.getElementById("btnNext");
const btnDownload = document.getElementById("btnDownload");

const winSound = document.getElementById("winSound");

function ensureUnlocked(){
  return unlockAudioOnce([winSound]);
}

document.addEventListener("pointerdown", ensureUnlocked, { once:true });
btnNext.addEventListener("pointerdown", ensureUnlocked, { once:true });
btnDownload.addEventListener("pointerdown", ensureUnlocked, { once:true });

title.textContent = `「${name || "—"}」｜抽中的經句紅包`;
meta.textContent = `經句編號：${no || "?"}　${ref ? "｜" : ""} ${ref}`.trim();

if(!no){
  loading.textContent = "⚠ 找不到經句編號，請返回重新打開紅包";
} else {
  const src = new URL(`./cards/${no}.png`, baseUrl).href;
  img.src = src;
  img.onload = ()=>{
    loading.textContent = "";
    safePlay(winSound, ensureUnlocked);
  };
  img.onerror = ()=>{
    loading.textContent = "⚠ 圖片載入失敗（請確認 cards 目錄是否存在）";
  };
}

btnNext.onclick = ()=>{
  setReturnFlag();
  location.href = new URL("./index.html", baseUrl).href;
};

btnDownload.onclick = async ()=>{
  if(!no) return;
  ensureUnlocked();

  // download current image (best effort)
  try{
    const response = await fetch(img.src, { cache: "no-store" });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Blessing_${no}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }catch(e){
    alert("圖片下載失敗，請改用截圖或長按另存");
  }
};