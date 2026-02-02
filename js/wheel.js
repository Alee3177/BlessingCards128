"use strict";
const wheel=document.getElementById("wheel");
const ctx=wheel?wheel.getContext("2d"):null;
const hlSVG=document.getElementElementById?null:document.getElementById("hl-svg");
const centerText=document.getElementById("centerText");
const CENTER=180;const R=170;
function drawInitialWheel(){if(!ctx)return;ctx.clearRect(0,0,360,360);ctx.beginPath();ctx.arc(CENTER,CENTER,R,0,Math.PI*2);ctx.fillStyle="#fcdca0";ctx.fill();ctx.beginPath();ctx.arc(CENTER,CENTER,R,0,Math.PI*2);ctx.lineWidth=3;ctx.strokeStyle="#ffffff";ctx.stroke();ctx.beginPath();ctx.moveTo(CENTER,CENTER);ctx.lineTo(CENTER,CENTER-(R-2));ctx.lineWidth=3;ctx.strokeStyle="#ffffff";ctx.stroke();}
function drawWheel(angle,names){if(!ctx)return;ctx.clearRect(0,0,360,360);if(!names||!names.length){drawInitialWheel();return;}const n=names.length;const arc=2*Math.PI/n;ctx.save();ctx.translate(CENTER,CENTER);ctx.rotate(angle);ctx.translate(-CENTER,-CENTER);for(let i=0;i<n;i++){const s=i*arc-Math.PI/2-arc/2;const e=s+arc;ctx.beginPath();ctx.moveTo(CENTER,CENTER);ctx.arc(CENTER,CENTER,R,s,e);ctx.closePath();ctx.fillStyle=(i%2?"#fde6b4":"#fcdca0");ctx.fill();ctx.lineWidth=3;ctx.strokeStyle="#ffffff";ctx.stroke();ctx.save();ctx.translate(CENTER,CENTER);ctx.rotate(s+arc/2);ctx.textAlign="right";ctx.font="18px Noto Sans TC";ctx.fillStyle="#5b3a00";ctx.fillText(names[i],R-14,6);ctx.restore();}ctx.restore();}
function clearHL(){if(hlSVG)hlSVG.innerHTML="";}
function showHL(i,names,rotation){if(i==null||!names||!names.length||!hlSVG)return;const n=names.length;const arc=2*Math.PI/n;const s=i*arc-Math.PI/2+rotation-arc/2;const e=s+arc;const x1=CENTER+R*Math.cos(s);const y1=CENTER+R*Math.sin(s);const x2=CENTER+R*Math.cos(e);const y2=CENTER+R*Math.sin(e);const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",`M${CENTER} ${CENTER} L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`);p.setAttribute("fill","rgba(255,210,50,0.55)");p.setAttribute("class","blink");hlSVG.appendChild(p);}
function ease(t){return 1-Math.pow(1-t,3);}
