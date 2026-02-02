"use strict";
function nowHHMMSS(){const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+":"+String(d.getSeconds()).padStart(2,"0");}
function basePath(){return location.pathname.replace(/\/[^\/]*$/,"/");}
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function audit(evt,data={}){try{const k="auditLogs";const logs=JSON.parse(localStorage.getItem(k)||"[]");logs.push({t:Date.now(),time:nowHHMMSS(),evt,data});localStorage.setItem(k,JSON.stringify(logs.slice(-200)));}catch(e){}}
function wrapText(ctx,text,x,y,maxWidth,lineHeight){const chars=String(text).split("");let line="";for(let i=0;i<chars.length;i++){const test=line+chars[i];if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=chars[i];y+=lineHeight;}else{line=test;}}if(line){ctx.fillText(line,x,y);y+=lineHeight;}return y;}
