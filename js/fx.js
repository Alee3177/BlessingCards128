"use strict";
const confettiCanvas=document.getElementById("confettiCanvas");
const confCtx=confettiCanvas?confettiCanvas.getContext("2d"):null;
function launchConfetti(){if(!confCtx)return;const pieces=[];const dots=[];const colors=["#ffd54f","#ffb300","#ffca28","#ffe082","#fff8e1"];
for(let i=0;i<120;i++){pieces.push({x:Math.random()*360,y:Math.random()*-80,w:4+Math.random()*5,h:8+Math.random()*10,vx:-1+Math.random()*2,vy:2+Math.random()*3,r:Math.random()*Math.PI,vr:(Math.random()-0.5)*0.2,color:colors[Math.floor(Math.random()*colors.length)]});}
for(let i=0;i<80;i++){dots.push({x:180+(Math.random()-0.5)*200,y:140+(Math.random()-0.5)*80,r:1+Math.random()*2.5,vy:-0.2-Math.random()*0.5,alpha:0.9,va:-0.01-Math.random()*0.02});}
const start=performance.now();const duration=1800;
function frame(now){const t=now-start;confCtx.clearRect(0,0,360,360);
pieces.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;confCtx.save();confCtx.translate(p.x,p.y);confCtx.rotate(p.r);confCtx.fillStyle=p.color;confCtx.fillRect(-p.w/2,-p.h/2,p.w,p.h);confCtx.restore();});
dots.forEach(d=>{d.y+=d.vy;d.alpha+=d.va;confCtx.save();confCtx.globalAlpha=Math.max(0,d.alpha);confCtx.beginPath();confCtx.arc(d.x,d.y,d.r,0,Math.PI*2);confCtx.fillStyle="#fff8d6";confCtx.fill();confCtx.restore();});
if(t<duration){requestAnimationFrame(frame);}else{confCtx.clearRect(0,0,360,360);}}
requestAnimationFrame(frame);}
