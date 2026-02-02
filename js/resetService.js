"use strict";
function resetAllCore(state){
  const msg=`資料紀錄將被清空(clear) & 歸零(reset)，\n需重新輸入姓名並鎖定名單開始新轉盤遊戲！\n您確定要執行嗎 (Yes or No)?`;
  if(!confirm(msg))return;
  audit("ROUND_CLOSED_BY_RESET",{state:state.systemState});
  audit("SYSTEM_RESET_ATTEMPT",{state:state.systemState});
  state.names=[];state.usedName=new Set();state.verseUsed=new Set();state.currentVerse=null;state.lastWinnerIndex=-1;state.rotation=0;state.rotating=false;state.round2Started=false;
  try{pdfRoundSerial=null;pdfRepeatCount=0;pdfDownloadedThisRound=false;}catch(e){}
  state.systemState="INIT";
  localStorage.removeItem("drawLogs");sessionStorage.removeItem("spinState");
  clearHL();drawInitialWheel();
  const resultDiv=document.getElementById("result");const summaryBox=document.getElementById("summaryBox");const statusDiv=document.getElementById("status");const nameInput=document.getElementById("nameInput");
  if(nameInput)nameInput.value="";if(resultDiv)resultDiv.textContent="";if(summaryBox)summaryBox.textContent="";if(statusDiv)statusDiv.textContent="請輸入姓名並鎖定名單";
  try{document.getElementById("centerText").textContent="";}catch(e){}
  hideViewerLink();
  console.log("🔄 System Reset → INIT");
  return true;
}
