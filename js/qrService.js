"use strict";
function buildViewerUrl(no,name){
  const base=location.origin+basePath();
  const url=new URL(base+"viewer.html");
  url.searchParams.set("no",String(no).padStart(3,"0"));
  if(name)url.searchParams.set("name",name);
  return url.toString();
}
function renderViewerLink(no,name){
  const box=document.getElementById("viewerLinkBox");
  const linkEl=document.getElementById("viewerLink");
  const qrImg=document.getElementById("qrImg");
  const copyBtn=document.getElementById("copyLinkBtn");
  const openBtn=document.getElementById("openViewerBtn");
  if(!box||!linkEl)return;
  const url=buildViewerUrl(no,name);
  linkEl.textContent=url;
  box.style.display="block";
  if(copyBtn){copyBtn.onclick=async()=>{try{await navigator.clipboard.writeText(url);copyBtn.textContent="已複製";setTimeout(()=>copyBtn.textContent="複製連結",900);}catch(e){alert("複製失敗，請手動複製連結");}};}
  if(openBtn){openBtn.onclick=()=>window.open(url,"_blank","noopener,noreferrer");}
  try{if(qrImg){const api="https://api.qrserver.com/v1/create-qr-code/?cache=0&size=200x200&margin=8&data="+encodeURIComponent(url);qrImg.style.display="block";qrImg.src=api;qrImg.onerror=()=>{qrImg.style.display="none";console.warn("⚠ QR load failed");};}}catch(e){}
}
function hideViewerLink(){const box=document.getElementById("viewerLinkBox");if(box)box.style.display="none";}
