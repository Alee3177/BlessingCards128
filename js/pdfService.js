"use strict";
let pdfRoundSerial=null;let pdfRepeatCount=0;let pdfDownloadedThisRound=false;
function getNextBlessingPdfSerial(){const k="pdfSerial";const cur=parseInt(localStorage.getItem(k)||"0",10)||0;const next=cur+1;localStorage.setItem(k,String(next));return String(next).padStart(3,"0");}
async function downloadPdfStableA(){
  if(!window.jspdf||!window.jspdf.jsPDF){alert("PDF 模組尚未載入（請確認網路可連 jsPDF CDN）");return;}
  const logs=JSON.parse(localStorage.getItem("drawLogs")||"[]");
  if(!logs.length){alert("沒有可下載的抽籤紀錄");return;}
  if(pdfDownloadedThisRound){const ok=confirm("這一輪您已經下載過PDF了, 是否要再下載一次呢 (Yes or No)?");if(!ok)return;pdfRepeatCount++;}else{pdfDownloadedThisRound=true;pdfRepeatCount=0;}
  audit("PDF_DOWNLOAD_ATTEMPT",{isRepeat:pdfDownloadedThisRound,repeatCount:pdfRepeatCount,serial:pdfRoundSerial});
  if(!pdfRoundSerial){pdfRoundSerial=getNextBlessingPdfSerial();}
  let filename=`Blessing_envelop_${pdfRoundSerial}`;if(pdfRepeatCount>0)filename+=`-${pdfRepeatCount}`;filename+=`.pdf`;
  const {jsPDF}=window.jspdf;const pdf=new jsPDF();
  const canvas=document.createElement("canvas");const ctx=canvas.getContext("2d");
  const MARGIN=60,LINE_H=32,WIDTH=1240;
  canvas.width=WIDTH;canvas.height=MARGIN*2+(logs.length+6)*LINE_H;
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);
  let y=MARGIN;
  ctx.fillStyle="#000000";
  ctx.font="bold 35px 'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,sans-serif";
  ctx.fillText("祝福經句紅包（應許等您拿）",MARGIN,y);y+=LINE_H*2.2;
  ctx.font="bold 26px 'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,sans-serif";
  ctx.fillText("抽籤紀錄",MARGIN,y);y+=LINE_H*1.4;
  ctx.font="22px 'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,sans-serif";
  logs.slice().reverse().forEach(l=>{const line=`[${l.time}] 「${l.name}」 → 抽中經句紅包: ${l.ref}`;y=wrapText(ctx,line,MARGIN,y,WIDTH-MARGIN*2,LINE_H);});
  ctx.font="18px Arial";ctx.textAlign="right";ctx.fillText("Blessing Envelop System © 2026 | Page 1",WIDTH-MARGIN,40);ctx.textAlign="left";
  const imgData=canvas.toDataURL("image/png");
  const pageWidth=pdf.internal.pageSize.getWidth();const imgWidth=pageWidth-20;const imgHeight=(canvas.height/canvas.width)*imgWidth;
  pdf.addImage(imgData,"PNG",10,10,imgWidth,imgHeight);pdf.save(filename);
  audit("ROUND_CLOSED_BY_PDF",{serial:pdfRoundSerial});
}
