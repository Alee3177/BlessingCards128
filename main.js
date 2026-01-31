import { APP, PHASE } from "./core/constants.js";
import { loadState, saveState, appendLog, readLogs, getReturnFlag, clearReturnFlag } from "./core/storage.js";
import { unlockAudioOnce, safePlay } from "./modules/audio.js";
import { createSpinner } from "./modules/spin.js";
import { warmUp } from "./modules/preload.js";

const baseUrl = new URL(".", location.href); // ends with "/"
console.log("🧩", APP.NAME, APP.VERSION, "base =", baseUrl.href);

// ========== DOM ==========
const logoEl = document.getElementById("logo");
const nameInput = document.getElementById("nameInput");

const lockBtn   = document.getElementById("lockBtn");
const spinBtn   = document.getElementById("spinBtn");
const secondBtn = document.getElementById("secondBtn");
const viewBtn   = document.getElementById("viewBtn");
const resetBtn  = document.getElementById("resetBtn");
const pdfBtn    = document.getElementById("pdfBtn");

const statusDiv  = document.getElementById("status");
const resultDiv  = document.getElementById("result");
const summaryBox = document.getElementById("summaryBox");
const logBox     = document.getElementById("logBox");

const wheel = document.getElementById("wheel");
const ctx = wheel?.getContext("2d");

// audio elements (must exist in DOM)
const drum = document.getElementById("drum");
const winSound = document.getElementById("winSound");

// ========= guard =========
if(!wheel || !ctx){
  alert("Canvas 初始化失敗：wheel/ctx 不存在");
  throw new Error("Missing canvas");
}

// ========= helpers =========
function nowHHMMSS(){
  const d = new Date();
  const pad=n=>String(n).padStart(2,"0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function parseNames(text){
  return text
    .split(/[\n,，、\s]+/g)
    .map(s=>s.trim())
    .filter(Boolean);
}

function pickRandomIndex(n){
  return Math.floor(Math.random()*n);
}

function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

// ========= wheel drawing =========
function drawWheel(rotation, slices){
  const n = Math.max(1, slices || 1);
  const W = wheel.width, H=wheel.height;
  const R = Math.min(W,H)/2 - 6;
  ctx.clearRect(0,0,W,H);
  ctx.save();
  ctx.translate(W/2,H/2);
  ctx.rotate(rotation);
  for(let i=0;i<n;i++){
    const a0 = (i/n)*2*Math.PI;
    const a1 = ((i+1)/n)*2*Math.PI;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,R,a0,a1);
    ctx.closePath();
    ctx.fillStyle = i%2 ? "#F7DDAA" : "#FFE6B8";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();

    // number label
    const mid=(a0+a1)/2;
    ctx.save();
    ctx.rotate(mid);
    ctx.translate(R*0.78,0);
    ctx.rotate(Math.PI/2);
    ctx.fillStyle="#7a5a25";
    ctx.font="20px sans-serif";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(String(i+1),0,0);
    ctx.restore();
  }
  ctx.restore();

  // pointer
  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.beginPath();
  ctx.moveTo(0, -R-6);
  ctx.lineTo(-10, -R+16);
  ctx.lineTo(10, -R+16);
  ctx.closePath();
  ctx.fillStyle="#ffffff";
  ctx.strokeStyle="#d5b37a";
  ctx.lineWidth=2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ========= verses =========
const VERSE_MAX = 128;
function randomVerseNo(used){
  // try random then fallback scan
  for(let k=0;k<400;k++){
    const n = 1 + Math.floor(Math.random()*VERSE_MAX);
    const no = String(n).padStart(3,"0");
    if(!used.has(no)) return no;
  }
  for(let n=1;n<=VERSE_MAX;n++){
    const no = String(n).padStart(3,"0");
    if(!used.has(no)) return no;
  }
  return null;
}

function verseRefFromNo(no){
  // minimal: keep only number. If you have mapping file, plug it here.
  return `經句 ${no}`;
}

// ========= state =========
let st = loadState();

// viewer return handling (MUST be first)
if(getReturnFlag()){
  console.log("🔄 Viewer return → force READY_NAME");
  clearReturnFlag();

  // if currentName exists, mark it as used (one draw cycle complete)
  if(st.currentName && !st.usedNames.includes(st.currentName)){
    st.usedNames.push(st.currentName);
  }
  st.currentName = null;
  st.currentVerseNo = null;
  st.currentVerseRef = null;
  st.round2Started = false;

  // decide next phase
  st.phase = (st.usedNames.length >= st.names.length && st.names.length>0) ? PHASE.FINISHED : (st.names.length>0 ? PHASE.READY_NAME : PHASE.INIT);

  saveState(st);
}

// ========= warmup assets =========
warmUp({ baseUrl: baseUrl.href }).catch(()=>{});

// ========= logo =========
if(logoEl){
  logoEl.src = new URL("./logo3524.png", baseUrl).href;
}

// ========= audio unlock wiring =========
function ensureUnlocked(){
  return unlockAudioOnce([drum, winSound]);
}
// "definitely clicked" buttons
[lockBtn, spinBtn, secondBtn, viewBtn, resetBtn].forEach(btn=>{
  if(!btn) return;
  btn.addEventListener("pointerdown", ensureUnlocked, { once:true });
  btn.addEventListener("click", ensureUnlocked, { once:true });
});
// fallback: any first interaction
document.addEventListener("pointerdown", ensureUnlocked, { once:true });

// ========= spinner =========
let currentSlices = 1;
let rotation = st.rotation || 0;
const spinner = createSpinner({
  durationMs: 2600,
  ease: easeOutCubic,
  draw: (r)=>{
    rotation = r;
    st.rotation = r;
    drawWheel(r, currentSlices);
  }
});

// initial draw
currentSlices = Math.max(1, st.names.length || 1);
drawWheel(rotation, currentSlices);

// ========= UI state mapping =========
function setPhase(next){
  st.phase = next;
  saveState(st);
  applyUI();
  console.log("🔁 PHASE →", next);
}

function applyUI(){
  // reset all
  [lockBtn, spinBtn, secondBtn, viewBtn, resetBtn, pdfBtn].forEach(b=>{
    if(!b) return;
    b.disabled = true;
    b.classList.remove("blink");
  });

  if(statusDiv) statusDiv.textContent = "";
  if(resultDiv) resultDiv.textContent = "";
  if(summaryBox) summaryBox.textContent = "";

  // logs
  if(logBox){
    const logs = readLogs().slice().reverse().slice(0, 60);
    logBox.innerHTML = logs.map(l=>`[${l.time}] 「${l.name}」 → ${l.ref} (#${l.no})`).join("<br>");
  }

  // phase behavior
  switch(st.phase){
    case PHASE.INIT:
      lockBtn.disabled = false;
      resetBtn.disabled = false;
      statusDiv.textContent = "請輸入姓名並鎖定名單";
      break;

    case PHASE.READY_NAME:
      spinBtn.disabled = false;
      spinBtn.classList.add("blink");
      resetBtn.disabled = false;
      statusDiv.textContent = "名單已鎖定，請開始第一輪抽姓名";
      break;

    case PHASE.SPINNING_NAME:
      statusDiv.textContent = "第一輪旋轉中…";
      break;

    case PHASE.READY_VERSE:
      secondBtn.disabled = false;
      secondBtn.classList.add("blink");
      viewBtn.disabled = true;
      resetBtn.disabled = false;
      statusDiv.textContent = `已抽中「${st.currentName}」，請開始第二輪抽經句紅包`;
      resultDiv.textContent = `🎯 姓名：${st.currentName}`;
      break;

    case PHASE.SPINNING_VERSE:
      statusDiv.textContent = "第二輪旋轉中…";
      resultDiv.textContent = `🎯 姓名：${st.currentName || ""}`;
      break;

    case PHASE.VIEWER:
      viewBtn.disabled = false;
      viewBtn.classList.add("blink");
      resetBtn.disabled = false;
      statusDiv.textContent = "第二輪完成，可查看紅包或進入下一位";
      resultDiv.textContent = `🎯 姓名：${st.currentName || ""}`;
      summaryBox.textContent = `📜 ${st.currentVerseRef || ""}（${st.currentVerseNo || ""}）`;
      break;

    case PHASE.FINISHED:
      resetBtn.disabled = false;
      pdfBtn.disabled = false;
      statusDiv.textContent = "🎉 全部完成，可下載 PDF 或重置";
      break;

    default:
      statusDiv.textContent = "⚠ 系統狀態異常，已回復 INIT";
      st = { ...st, phase: PHASE.INIT };
      saveState(st);
      lockBtn.disabled = false;
      resetBtn.disabled = false;
  }

  // lock button always available if no names locked
  if(st.phase !== PHASE.FINISHED && st.phase !== PHASE.SPINNING_NAME && st.phase !== PHASE.SPINNING_VERSE){
    lockBtn.disabled = false;
  }

  // update slices and wheel
  currentSlices = Math.max(1, (st.phase===PHASE.INIT ? Math.max(1, parseNames(nameInput.value||"").length) : (st.names.length || 1)));
  drawWheel(rotation, currentSlices);
}

// ========= actions =========
lockBtn.onclick = ()=>{
  ensureUnlocked();

  const list = parseNames(nameInput.value || "");
  if(!list.length){
    alert("請先輸入至少 1 個姓名");
    return;
  }
  st.names = list;
  st.usedNames = [];
  st.usedVerses = [];
  st.currentName = null;
  st.currentVerseNo = null;
  st.currentVerseRef = null;
  st.round2Started = false;
  rotation = 0;
  st.rotation = 0;

  setPhase(PHASE.READY_NAME);
};

spinBtn.onclick = ()=>{
  ensureUnlocked();
  if(st.phase !== PHASE.READY_NAME) return;

  const remaining = st.names.filter(n=>!st.usedNames.includes(n));
  if(!remaining.length){
    setPhase(PHASE.FINISHED);
    return;
  }

  setPhase(PHASE.SPINNING_NAME);
  safePlay(drum, ensureUnlocked);

  const idx = pickRandomIndex(remaining.length);
  const chosen = remaining[idx];

  // animate by slices = remaining length (visual = participants remaining)
  currentSlices = Math.max(1, remaining.length);
  const targetIndex = idx; // align with chosen index
  spinner.spin({
    baseRotation: rotation,
    slices: currentSlices,
    targetIndex,
    clockwise: true,
    onFinish: ({ endRotation })=>{
      rotation = endRotation;
      st.rotation = endRotation;
      st.currentName = chosen;
      setPhase(PHASE.READY_VERSE);
    }
  });
};

secondBtn.onclick = ()=>{
  ensureUnlocked();
  if(st.phase !== PHASE.READY_VERSE) return;
  if(!st.currentName){
    alert("缺少姓名，請回到第一輪");
    setPhase(PHASE.READY_NAME);
    return;
  }

  const used = new Set(st.usedVerses || []);
  const no = randomVerseNo(used);
  if(!no){
    alert("128 張經句已用完");
    setPhase(PHASE.FINISHED);
    return;
  }

  setPhase(PHASE.SPINNING_VERSE);
  safePlay(drum, ensureUnlocked);

  // animate by slices = 8 for stable visual
  currentSlices = 8;
  const targetIndex = pickRandomIndex(currentSlices);

  spinner.spin({
    baseRotation: rotation,
    slices: currentSlices,
    targetIndex,
    clockwise: true,
    onFinish: ({ endRotation })=>{
      rotation = endRotation;
      st.rotation = endRotation;

      st.currentVerseNo = no;
      st.currentVerseRef = verseRefFromNo(no);

      // mark verse used immediately
      if(!st.usedVerses.includes(no)) st.usedVerses.push(no);

      // log
      appendLog({
        time: nowHHMMSS(),
        name: st.currentName,
        no: st.currentVerseNo,
        ref: st.currentVerseRef
      });

      safePlay(winSound, ensureUnlocked);

      setPhase(PHASE.VIEWER);
    }
  });
};

viewBtn.onclick = ()=>{
  ensureUnlocked();
  if(st.phase !== PHASE.VIEWER) return;
  if(!st.currentVerseNo){
    alert("缺少經句編號");
    return;
  }
  // open viewer with params
  const url = new URL("./viewer.html", baseUrl);
  url.searchParams.set("no", st.currentVerseNo);
  url.searchParams.set("ref", st.currentVerseRef || "");
  url.searchParams.set("name", st.currentName || "");
  // move to viewer
  location.href = url.toString();
};

resetBtn.onclick = ()=>{
  if(!confirm("確定要全部歸零？")) return;
  spinner.cancel();
  st = loadState(); // load then overwrite
  st.phase = PHASE.INIT;
  st.names = [];
  st.usedNames = [];
  st.usedVerses = [];
  st.currentName = null;
  st.currentVerseNo = null;
  st.currentVerseRef = null;
  st.rotation = 0;
  rotation = 0;
  saveState(st);
  applyUI();
};

pdfBtn.onclick = ()=>{
  // minimal safe PDF: open a printable page (no external libs)
  const logs = readLogs();
  const html = `
    <html><head><meta charset="utf-8"><title>抽籤紀錄</title></head>
    <body>
      <h2>BlessingCards128 抽籤紀錄</h2>
      <pre>${logs.map(l=>`[${l.time}] ${l.name} -> ${l.ref} (#${l.no})`).join("\\n")}</pre>
      <script>window.print();<\/script>
    </body></html>`;
  const w = window.open("", "_blank");
  if(!w){ alert("瀏覽器阻擋彈出視窗，請允許後再試"); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
};

applyUI();