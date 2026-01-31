export function preloadImage(src){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=>resolve(true);
    img.onerror = ()=>resolve(false);
    img.src = src;
  });
}

export function preloadAudio(src){
  try{
    const a = new Audio();
    a.preload = "auto";
    a.src = src;
    // don't call play here; just warm connection/cache
    a.load();
    return a;
  }catch(e){
    return null;
  }
}

export async function warmUp({ baseUrl, maxCards=128, mobileCap=24 }){
  console.log("🔥 Warmup...");
  const isMobile = window.innerWidth < 768;
  const cardCount = isMobile ? mobileCap : maxCards;

  const logoOk = await preloadImage(new URL("./logo3524.png", baseUrl).href);
  console.log(logoOk ? "✅ LOGO warmed" : "⚠ LOGO warm failed");

  // cards (best-effort)
  let ok=0;
  for(let i=1;i<=cardCount;i++){
    const no = String(i).padStart(3,"0");
    const u = new URL(`./cards/${no}.png`, baseUrl).href;
    // fire-and-forget to avoid blocking
    preloadImage(u).then(v=>{ if(v) ok++; if(ok===cardCount) console.log(`✅ cards warmed (${cardCount})`); });
  }
}