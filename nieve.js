// Nieve de fondo: canvas fijo detras del contenido. Decorativa: si el navegador
// frena los frames (pestaña en segundo plano, visor embebido) no se pierde nada.
(() => {
  "use strict";
  const canvas = document.getElementById("snow");
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { canvas.remove(); return; }

  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, flakes = [], raf = 0, last = 0;

  function flake(anywhere) {
    const depth = Math.random();            // 0 lejos, 1 cerca
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -8,
      r: 0.7 + depth * 2.3,
      vy: 10 + depth * 36,                  // px por segundo
      drift: 6 + Math.random() * 16,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.28 + depth * 0.5
    };
  }

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // densidad por area, con tope: en telefono caen ~20 copos, en escritorio 90
    const target = Math.round(Math.min(90, (w * h) / 16000));
    while (flakes.length < target) flakes.push(flake(true));
    flakes.length = target;
  }

  function frame(t) {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    ctx.clearRect(0, 0, w, h);
    for (const f of flakes) {
      f.phase += dt * 0.8;
      f.y += f.vy * dt;
      f.x += Math.sin(f.phase) * f.drift * dt;
      if (f.y > h + 8) Object.assign(f, flake(false));
      if (f.x < -8) f.x = w + 8; else if (f.x > w + 8) f.x = -8;
      ctx.beginPath();
      ctx.fillStyle = `rgba(226,244,251,${f.alpha})`;
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  });
  window.addEventListener("resize", size, { passive: true });
  size();
  raf = requestAnimationFrame(frame);
})();
