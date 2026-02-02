"use strict";
function launchViewerFX(){
  const canvas=document.getElementById("fxCanvas");if(!canvas)return;
  const ctx=canvas.getContext("2d");const DPR=window.devicePixelRatio||1;
  function resize(){canvas.width=Math.floor(window.innerWidth*DPR);canvas.height=Math.floor(window.innerHeight*DPR);canvas.style.width="100%";canvas.style.height="100%";ctx.setTransform(DPR,0,0,DPR,0,0);}
  resize();window.addEventListener("resize",resize);
  const pieces=[],dots=[],colors=["#ffd54f","#ffb300","#ffca28","#ffe082","#fff8e1"];
  for(let i=0;i<120;i++){pieces.push({x:Math.random()*window.innerWidth,y:Math.random()*-120,w:4+Math.random()*5,h:8+Math.random()*10,vx:-1+Math.random()*2,vy:2+Math.random()*3,r:Math.random()*Math.PI,vr:(Math.random()-0.5)*0.2,color:colors[Math.floor(Math.random()*colors.length)]});}
  for(let i=0;i<80;i++){dots.push({x:window.innerWidth/2+(Math.random()-0.5)*320,y:window.innerHeight/2+(Math.random()-0.5)*140,r:1+Math.random()*2.5,vy:-0.2-Math.random()*0.5,alpha:0.9,va:-0.01-Math.random()*0.02});}
  const start=performance.now(),duration=1800;
  function frame(now){
    const t=now-start;ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    pieces.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});
    dots.forEach(d=>{d.y+=d.vy;d.alpha+=d.va;ctx.save();ctx.globalAlpha=Math.max(0,d.alpha);ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fillStyle="#fff8d6";ctx.fill();ctx.restore();});
    if(t<duration){requestAnimationFrame(frame);}else{ctx.clearRect(0,0,window.innerWidth,window.innerHeight);}
  }
  requestAnimationFrame(frame);
}
