// assets/js/tokenParticles.js
export function startTokenParticles(canvasId, tokenImgSrc){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = tokenImgSrc;

  let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let tokens = [];
  let raf;

  function resize(){
    const rect = canvas.getBoundingClientRect();
    w = Math.floor(rect.width);
    h = Math.floor(rect.height);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);

    // rebuild tokens to fit
    tokens = Array.from({length: 18}, () => makeToken(true));
  }

  function makeToken(randomY=false){
    const size = 10 + Math.random()*14;
    return {
      x: Math.random()*w,
      y: randomY ? Math.random()*h : h + Math.random()*60,
      vy: 0.25 + Math.random()*0.65,
      vx: (Math.random()-0.5)*0.35,
      r: (Math.random()-0.5)*0.6,
      rot: Math.random()*Math.PI*2,
      size,
      a: 0.15 + Math.random()*0.35
    };
  }

  function tick(){
    ctx.clearRect(0,0,w,h);

    // subtle glow haze
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#d6a82c";
    ctx.beginPath();
    ctx.arc(w*0.65, h*0.25, Math.min(w,h)*0.35, 0, Math.PI*2);
    ctx.fill();

    for(const t of tokens){
      t.y -= t.vy;
      t.x += t.vx + Math.sin((t.y + t.x)*0.01)*0.2;
      t.rot += t.r*0.02;

      // wrap
      if(t.y < -60) Object.assign(t, makeToken(false));
      if(t.x < -60) t.x = w + 60;
      if(t.x > w + 60) t.x = -60;

      ctx.save();
      ctx.globalAlpha = t.a;
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rot);

      // draw token image if loaded; fallback to circle
      if(img.complete && img.naturalWidth > 0){
        ctx.drawImage(img, -t.size/2, -t.size/2, t.size, t.size);
      }else{
        ctx.fillStyle = "#ffd25a";
        ctx.beginPath();
        ctx.arc(0,0,t.size/2,0,Math.PI*2);
        ctx.fill();
      }

      ctx.restore();
    }

    raf = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();

  img.onload = () => {
    cancelAnimationFrame(raf);
    tick();
  };

  // start even before image loads
  tick();
}