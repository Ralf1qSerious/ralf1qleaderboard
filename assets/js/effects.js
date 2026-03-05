// assets/js/effects.js
// One canvas for all FX: snow (winter), fireworks (summer), leaves (autumn), petals (spring), gold sparks (podium)

export function setupFxCanvas() {
  const c = document.getElementById("fxCanvas");
  if (!c) {
    return {
      setMode() {},
      burstGoldAtElement() {},
    };
  }

  const ctx = c.getContext("2d");
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  function resize() {
    c.width = Math.floor(innerWidth * DPR);
    c.height = Math.floor(innerHeight * DPR);
    c.style.width = innerWidth + "px";
    c.style.height = innerHeight + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  const state = {
    mode: "winter",
    t: 0,

    snow: [],
    fireworks: [],
    leaves: [],
    petals: [],
    sparks: [],
  };

  // ---------- Snow ----------
  function initSnow(count = 95) {
    state.snow = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: 1 + Math.random() * 2.6,
      v: 0.6 + Math.random() * 1.9,
      w: (Math.random() - 0.5) * 0.7,
      a: 0.22 + Math.random() * 0.65,
    }));
  }

  // ---------- Fireworks ----------
  function spawnFirework() {
    const x = innerWidth * (0.2 + Math.random() * 0.6);
    const y = innerHeight * (0.15 + Math.random() * 0.35);
    const n = 70 + Math.floor(Math.random() * 70);

    for (let i = 0; i < n; i++) {
      const ang = (Math.PI * 2 * i) / n;
      const sp = 1.6 + Math.random() * 4.2;

      state.fireworks.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 60 + Math.random() * 45,
        a: 0.95,
      });
    }
  }

  // ---------- Leaves (Autumn) ----------
  function initLeaves(count = 46) {
    state.leaves = Array.from({ length: count }, () => makeLeaf(true));
  }

  function makeLeaf(randomY = false) {
    const size = 8 + Math.random() * 16;
    return {
      x: Math.random() * innerWidth,
      y: randomY ? Math.random() * innerHeight : -30 - Math.random() * 120,
      vy: 0.8 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.8,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.02,
      a: 0.35 + Math.random() * 0.35,
      size,
      hue: 22 + Math.random() * 35, // orange → gold
    };
  }

  // ---------- Petals (Spring) ----------
  function initPetals(count = 60) {
    state.petals = Array.from({ length: count }, () => makePetal(true));
  }

  function makePetal(randomY = false) {
    const size = 6 + Math.random() * 12;
    return {
      x: Math.random() * innerWidth,
      y: randomY ? Math.random() * innerHeight : -30 - Math.random() * 120,
      vy: 0.55 + Math.random() * 1.1,
      vx: (Math.random() - 0.5) * 0.7,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.03,
      a: 0.28 + Math.random() * 0.38,
      size,
      tint: Math.random() < 0.5 ? "#ffd1e6" : "#ffe6f4",
    };
  }

  // ---------- Gold Sparks ----------
  function burstGold(x, y) {
    const n = 44;
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 1.3 + Math.random() * 4.6;
      state.sparks.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 45 + Math.random() * 35,
        a: 0.95,
        r: 1 + Math.random() * 2.2,
      });
    }
  }

  // ---------- Render Loop ----------
  function tick() {
    state.t++;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // faint drifting dots
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 35; i++) {
      const x = (state.t * 0.25 + i * 97) % innerWidth;
      const y =
        (i * 131 + Math.sin((state.t + i) * 0.01) * 30 + innerHeight * 0.55) %
        innerHeight;

      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // WINTER: snow
    if (state.mode === "winter") {
      if (!state.snow.length) initSnow();
      ctx.globalAlpha = 1;

      for (const p of state.snow) {
        p.y += p.v;
        p.x += p.w + Math.sin((state.t + p.y) * 0.01) * 0.25;

        if (p.y > innerHeight + 10) {
          p.y = -10;
          p.x = Math.random() * innerWidth;
        }
        if (p.x < -10) p.x = innerWidth + 10;
        if (p.x > innerWidth + 10) p.x = -10;

        ctx.globalAlpha = p.a;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // SUMMER: fireworks
    if (state.mode === "summer") {
      if (state.t % 90 === 0) spawnFirework();

      for (let i = state.fireworks.length - 1; i >= 0; i--) {
        const f = state.fireworks[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.02;
        f.life -= 1;
        f.a *= 0.985;

        ctx.globalAlpha = Math.max(0, f.a);
        ctx.fillStyle = "#ffd25a";
        ctx.beginPath();
        ctx.arc(f.x, f.y, 1.8, 0, Math.PI * 2);
        ctx.fill();

        if (f.life <= 0 || f.a < 0.03) state.fireworks.splice(i, 1);
      }
    }

    // AUTUMN: leaves
    if (state.mode === "autumn") {
      if (!state.leaves.length) initLeaves();

      for (let i = state.leaves.length - 1; i >= 0; i--) {
        const L = state.leaves[i];
        L.y += L.vy;
        L.x += L.vx + Math.sin((state.t + L.y) * 0.01) * 0.8;
        L.rot += L.vr;

        if (L.y > innerHeight + 50) state.leaves[i] = makeLeaf(false);
        if (L.x < -60) L.x = innerWidth + 60;
        if (L.x > innerWidth + 60) L.x = -60;

        ctx.save();
        ctx.globalAlpha = L.a;
        ctx.translate(L.x, L.y);
        ctx.rotate(L.rot);

        // leaf shape
        ctx.fillStyle = `hsl(${L.hue} 85% 55%)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, L.size * 0.55, L.size, 0, 0, Math.PI * 2);
        ctx.fill();

        // little vein
        ctx.globalAlpha = L.a * 0.35;
        ctx.strokeStyle = "#2b1b06";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -L.size * 0.8);
        ctx.lineTo(0, L.size * 0.8);
        ctx.stroke();

        ctx.restore();
      }
    }

    // SPRING: petals
    if (state.mode === "spring") {
      if (!state.petals.length) initPetals();

      for (let i = state.petals.length - 1; i >= 0; i--) {
        const P = state.petals[i];
        P.y += P.vy;
        P.x += P.vx + Math.sin((state.t + P.y) * 0.01) * 0.6;
        P.rot += P.vr;

        if (P.y > innerHeight + 50) state.petals[i] = makePetal(false);
        if (P.x < -60) P.x = innerWidth + 60;
        if (P.x > innerWidth + 60) P.x = -60;

        ctx.save();
        ctx.globalAlpha = P.a;
        ctx.translate(P.x, P.y);
        ctx.rotate(P.rot);

        // petal shape
        ctx.fillStyle = P.tint;
        ctx.beginPath();
        ctx.ellipse(0, 0, P.size * 0.45, P.size * 0.9, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // soft highlight
        ctx.globalAlpha = P.a * 0.25;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(-P.size * 0.12, -P.size * 0.18, P.size * 0.18, P.size * 0.35, 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // gold sparks (always ok)
    for (let i = state.sparks.length - 1; i >= 0; i--) {
      const s = state.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.03;
      s.life -= 1;
      s.a *= 0.97;

      ctx.globalAlpha = Math.max(0, s.a);
      ctx.fillStyle = "#ffd25a";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      if (s.life <= 0 || s.a < 0.03) state.sparks.splice(i, 1);
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // public API
  return {
    setMode(mode) {
      const m = (mode || "").toLowerCase();
      state.mode = ["winter", "summer", "autumn", "spring"].includes(m) ? m : "winter";

      // reset arrays for cleanliness
      if (state.mode !== "winter") state.snow = [];
      if (state.mode !== "summer") state.fireworks = [];
      if (state.mode !== "autumn") state.leaves = [];
      if (state.mode !== "spring") state.petals = [];

      if (state.mode === "winter") initSnow();
      if (state.mode === "autumn") initLeaves();
      if (state.mode === "spring") initPetals();
    },

    burstGoldAtElement(el) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      burstGold(r.left + r.width * 0.5, r.top + r.height * 0.35);
    },
  };
}