"use strict";
let audioUnlocked=false;
const drum=document.getElementById("drum");
const winSound=document.getElementById("winSound");
function setAudioSources(){try{if(drum)drum.src=basePath()+"audio/drum.mp3";if(winSound)winSound.src=basePath()+"audio/win.mp3";}catch(e){}}
function unlockAudio(){if(audioUnlocked)return;try{[drum,winSound].forEach(a=>{if(!a)return;a.muted=true;const p=a.play();if(p&&typeof p.then==="function"){p.then(()=>{a.pause();a.currentTime=0;a.muted=false;}).catch(()=>{});}});audioUnlocked=true;console.log("🔓 Audio unlocked");}catch(e){}}
function playDrumSafe(){try{unlockAudio();if(!drum)return;drum.currentTime=0;const p=drum.play();if(p&&typeof p.catch==="function")p.catch(()=>{});}catch(e){}}
function playWinSafe(){try{unlockAudio();if(!winSound)return;winSound.currentTime=0;const p=winSound.play();if(p&&typeof p.catch==="function")p.catch(()=>{});}catch(e){}}
