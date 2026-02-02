"use strict";
const lockBtn=document.getElementById("lockBtn");
const spinBtn=document.getElementById("spinBtn");
const resetBtn=document.getElementById("resetBtn");
const secondBtn=document.getElementById("secondBtn");
const viewBtn=document.getElementById("viewBtn");
const pdfBtn=document.getElementById("pdfBtn");
const nameInput=document.getElementById("nameInput");
const statusDiv=document.getElementById("status");
const resultDiv=document.getElementById("result");
const summaryBox=document.getElementById("summaryBox");
const statusBar=document.getElementById("masterStatus");

const SYS_STATE={INIT:"INIT",READY:"READY",ROUND1:"ROUND1",ROUND2:"ROUND2",VIEWER:"VIEWER",FINISHED:"FINISHED"};
const state={systemState:SYS_STATE.INIT,names:[],usedName:new Set(),verseUsed:new Set(),round2Started:false,rotation:0,rotating:false,lastWinnerIndex:-1,currentVerse:null,animId:null,spinToken:0};

let lastActionAt=0;
function canAct(){const now=Date.now();if(now-lastActionAt<300)return false;lastActionAt=now;return true;}

function setStatusClass(kind){
  if(!statusBar)return;
  statusBar.classList.remove("status-ok","status-warn","status-error");
  statusBar.classList.add(kind);
}

function applyUIState(){
  lockBtn.disabled=true;spinBtn.disabled=true;secondBtn.disabled=true;viewBtn.disabled=true;pdfBtn.disabled=true;resetBtn.disabled=true;
  spinBtn.classList.remove("blink-btn");secondBtn.classList.remove("blink-btn");viewBtn.classList.remove("blink-btn");
  pdfBtn.classList.remove("btn-pdf-ready");resetBtn.classList.remove("btn-reset-danger");
  drawWheel(state.rotation,state.names);

  switch(state.systemState){
    case SYS_STATE.INIT:
      setStatusClass("status-warn");
      statusDiv.textContent="請輸入姓名並鎖定名單";
      lockBtn.disabled=false;
      break;
    case SYS_STATE.READY:
      setStatusClass("status-ok");
      statusDiv.textContent="名單已鎖定，準備抽籤";
      spinBtn.disabled=false;
      spinBtn.classList.add("blink-btn");
      resetBtn.disabled=false;
      break;
    case SYS_STATE.ROUND1:
      setStatusClass("status-warn");
      statusDiv.textContent="旋轉中...";
      resetBtn.disabled=false;
      break;
    case SYS_STATE.ROUND2:
      setStatusClass("status-warn");
      statusDiv.textContent="第二輪抽紅包中";
      resetBtn.disabled=false;
      break;
    case SYS_STATE.VIEWER:
      setStatusClass("status-ok");
      statusDiv.textContent="查看紅包中";
      resetBtn.disabled=false;
      break;
    case SYS_STATE.FINISHED:
      setStatusClass("status-ok");
      statusDiv.textContent="";
      summaryBox.textContent=
        `🎉 此輪轉盤已完成 ${state.names.length} 位的紅包抽籤\n`+
        `📄 請按「抽籤紀錄 PDF」下載紀錄，或\n`+
        `🔁 輸入新姓名 → 按「鎖定名單」開始下一輪；也可按「全部歸零」`;
      pdfBtn.disabled=false;
      pdfBtn.classList.add("btn-pdf-ready");
      resetBtn.disabled=false;
      resetBtn.classList.add("btn-reset-danger");
      break;
  }
}

function parseNames(raw){
  return String(raw||"").split(/[\s,]+/g).map(s=>s.trim()).filter(Boolean);
}
function pickNextName(){
  const remain=state.names.filter(n=>!state.usedName.has(n));
  if(!remain.length)return null;
  return remain[Math.floor(Math.random()*remain.length)];
}
function pickVerse(){
  const MAX=128;
  if(state.verseUsed.size>=MAX)return null;
  for(let tries=0;tries<500;tries++){
    const n=String(1+Math.floor(Math.random()*MAX)).padStart(3,"0");
    if(!state.verseUsed.has(n))return n;
  }
  for(let i=1;i<=MAX;i++){
    const n=String(i).padStart(3,"0");
    if(!state.verseUsed.has(n))return n;
  }
  return null;
}

const DURATION=2600;
function spin(list,clockwise,onDone){
  if(!list||!list.length)return;
  const myToken=++state.spinToken;
  if(state.rotating){state.spinToken++;}
  if(state.animId){cancelAnimationFrame(state.animId);state.animId=null;}
  state.rotating=true;
  applyUIState();
  playDrumSafe();

  const target=list[Math.floor(Math.random()*list.length)];
  const idx=list.indexOf(target);

  const base=state.rotation;
  const delta=(clockwise?1:-1)*(6*Math.PI+idx*(2*Math.PI/list.length));
  const end=base+delta;

  const start=performance.now();
  const hardStopAt=start+DURATION+300;
  let finished=false;

  const failSafeId=setTimeout(()=>{
    if(myToken!==state.spinToken)return;
    if(finished)return;
    finish();
  },DURATION+1200);

  function finish(){
    if(myToken!==state.spinToken)return;
    if(finished)return;
    finished=true;
    clearTimeout(failSafeId);
    if(state.animId){cancelAnimationFrame(state.animId);state.animId=null;}
    state.rotation=end;
    drawWheel(state.rotation,state.names);
    try{onDone(target,idx);}catch(e){console.error(e);}
    state.rotating=false;
    applyUIState();
  }

  function frame(now){
    if(myToken!==state.spinToken)return;
    if(finished)return;
    if(now>=hardStopAt){finish();return;}
    let t=(now-start)/DURATION;t=clamp(t,0,1);
    if(t>=1){finish();return;}
    state.rotation=base+delta*ease(t);
    drawWheel(state.rotation,state.names);
    state.animId=requestAnimationFrame(frame);
  }

  state.animId=requestAnimationFrame(frame);
}

lockBtn.onclick=()=>{
  if(!canAct())return;
  const list=parseNames(nameInput.value);
  if(!list.length){alert("請先輸入姓名（可用空白或逗號分隔）");return;}
  unlockAudio();
  state.names=list;state.usedName=new Set();state.verseUsed=new Set();
  state.currentVerse=null;state.lastWinnerIndex=-1;state.round2Started=false;
  clearHL();state.rotation=0;
  localStorage.removeItem("drawLogs");
  hideViewerLink();
  resultDiv.textContent="";summaryBox.textContent="";
  try{document.getElementById("centerText").textContent="";}catch(e){}
  state.systemState=SYS_STATE.READY;
  applyUIState();
};

spinBtn.onclick=()=>{
  if(!canAct())return;
  if(state.systemState!==SYS_STATE.READY)return;
  const picked=pickNextName();
  if(!picked){state.systemState=SYS_STATE.FINISHED;applyUIState();return;}
  state.systemState=SYS_STATE.ROUND1;applyUIState();
  spin(state.names,true,(name,idx)=>{
    state.usedName.add(name);
    state.lastWinnerIndex=idx;
    clearHL();showHL(idx,state.names,state.rotation);
    resultDiv.textContent=`🎉 抽中：「${name}」`;
    try{document.getElementById("centerText").textContent=name;}catch(e){}
    secondBtn.disabled=false;secondBtn.classList.add("blink-btn");
    viewBtn.disabled=true;viewBtn.classList.remove("blink-btn");
    hideViewerLink();
    state.systemState=SYS_STATE.ROUND1;
    setStatusClass("status-ok");
    statusDiv.textContent="請按「抽紅包（第二輪）」";
  });
};

secondBtn.onclick=()=>{
  if(!canAct())return;
  if(state.systemState!==SYS_STATE.ROUND1)return;
  if(state.lastWinnerIndex<0)return;
  state.systemState=SYS_STATE.ROUND2;applyUIState();
  const verse=pickVerse();
  if(!verse){alert("經句已抽完（001-128）");state.systemState=SYS_STATE.FINISHED;applyUIState();return;}
  state.currentVerse=verse;state.verseUsed.add(verse);
  spin(state.names,false,()=>{
    playWinSafe();launchConfetti();
    const winnerName=state.names[state.lastWinnerIndex]||"";
    const ref=`#${verse}`;
    summaryBox.textContent=`📜 抽中經句紅包：${ref}`;
    try{document.getElementById("centerText").textContent=`🎁\n${ref}`;}catch(e){}
    try{const logs=JSON.parse(localStorage.getItem("drawLogs")||"[]");logs.push({time:nowHHMMSS(),name:winnerName,ref:ref});localStorage.setItem("drawLogs",JSON.stringify(logs));}catch(e){}
    viewBtn.disabled=false;viewBtn.classList.add("blink-btn");
    secondBtn.disabled=true;secondBtn.classList.remove("blink-btn");
    renderViewerLink(verse,winnerName);
    state.systemState=SYS_STATE.ROUND2;
    setStatusClass("status-ok");
    statusDiv.textContent="可按「看紅包」或讓參與者掃描 QR";
  });
};

viewBtn.onclick=()=>{
  if(!canAct())return;
  if(!state.currentVerse)return;
  const winnerName=state.names[state.lastWinnerIndex]||"";
  const url=buildViewerUrl(state.currentVerse,winnerName);
  window.open(url,"_blank","noopener,noreferrer");
  const total=state.names.length;
  const drawn=state.usedName.size;
  if(drawn<total){
    statusDiv.textContent="請繼續下一位抽經句紅包";
    spinBtn.disabled=false;spinBtn.classList.add("blink-btn");
    secondBtn.disabled=true;secondBtn.classList.remove("blink-btn");
    viewBtn.disabled=true;viewBtn.classList.remove("blink-btn");
    lockBtn.disabled=true;
    pdfBtn.disabled=true;pdfBtn.classList.remove("btn-pdf-ready");
    state.systemState=SYS_STATE.READY;
    setStatusClass("status-ok");
  }else{
    state.systemState=SYS_STATE.FINISHED;
    applyUIState();
  }
};

pdfBtn.onclick=async()=>{
  if(!canAct())return;
  await downloadPdfStableA();
  state.systemState=SYS_STATE.FINISHED;
  applyUIState();
};

resetBtn.onclick=()=>{
  if(!canAct())return;
  const ok=resetAllCore(state);
  if(ok)applyUIState();
};

function initStateMachine(){state.systemState=SYS_STATE.INIT;applyUIState();}
window.__BC_STATE__=state;
window.initStateMachine=initStateMachine;
window.applyUIState=applyUIState;
window.canAct=canAct;
