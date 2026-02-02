"use strict";
function startPreload(){
  try{const logo=document.getElementById("logo");if(logo){logo.decoding="async";logo.loading="eager";logo.src=basePath()+"logo3524.png";logo.onerror=()=>console.warn("⚠ LOGO load failed: logo3524.png");}}catch(e){}
  setAudioSources();
  try{const isMobile=window.innerWidth<768;const MAX_PRELOAD=isMobile?24:128;let loaded=0;
    for(let i=1;i<=MAX_PRELOAD;i++){const img=new Image();img.decoding="async";img.loading="eager";const no=String(i).padStart(3,"0");
      img.onload=()=>{loaded++;if(loaded===MAX_PRELOAD)console.log(`✅ cards warmup done (${MAX_PRELOAD})`);};
      img.src=basePath()+"cards/"+no+".png";
    }
  }catch(e){}
}
