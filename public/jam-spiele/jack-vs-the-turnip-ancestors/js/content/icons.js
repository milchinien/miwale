/* Fallback icons for the new passive upgrades (used until a style ships its own in js/content/art/<id>.js).
   Drawn in a 48×48 design space, bold outline so they read on every card skin. */
(function () {
  'use strict';
  const C = window.Content, TAU = Math.PI * 2;
  const INK = '#2a1810';

  function outlined(ctx, path, fill, w = 3) {
    ctx.lineWidth = w; ctx.strokeStyle = INK;
    path(); ctx.stroke();
    ctx.fillStyle = fill; path(); ctx.fill();
  }
  function pumpkin(ctx, x, y, r, face) {
    const body = () => { ctx.beginPath(); ctx.ellipse(x, y, r * 1.12, r, 0, 0, TAU); };
    outlined(ctx, body, '#e8792a', 3);
    ctx.strokeStyle = '#b8521c'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.45, r * 0.95, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.5, y - r * 0.35, r * 0.22, r * 0.36, -0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a7a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(x - 1.6, y - r - 4, 3.2, 5); ctx.stroke(); ctx.fill();
    if (face) {
      ctx.fillStyle = '#ffe680';
      const tri = (cx) => { ctx.beginPath(); ctx.moveTo(cx - 2.6, y - 1); ctx.lineTo(cx + 2.6, y - 1); ctx.lineTo(cx, y - 5); ctx.closePath(); ctx.fill(); };
      tri(x - r * 0.42); tri(x + r * 0.42);
      ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + 2.5); ctx.lineTo(x - r * 0.3, y + 5); ctx.lineTo(x, y + 3); ctx.lineTo(x + r * 0.3, y + 5); ctx.lineTo(x + r * 0.6, y + 2.5); ctx.lineTo(x, y + 7.5); ctx.closePath(); ctx.fill();
    }
  }

  const ICONS = {
    leech(ctx) {
      // soup bowl with steam and a heart
      ctx.strokeStyle = '#e8e2d6'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (const x of [17, 24, 31]) { ctx.beginPath(); ctx.moveTo(x, 20); ctx.bezierCurveTo(x - 4, 15, x + 4, 12, x, 7); ctx.stroke(); }
      const bowl = () => { ctx.beginPath(); ctx.moveTo(6, 24); ctx.lineTo(42, 24); ctx.bezierCurveTo(41, 36, 33, 42, 24, 42); ctx.bezierCurveTo(15, 42, 7, 36, 6, 24); ctx.closePath(); };
      outlined(ctx, bowl, '#c8743a', 3);
      ctx.fillStyle = '#f0a040';
      ctx.beginPath(); ctx.ellipse(24, 24, 17, 3.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.ellipse(14, 31, 2.5, 5, 0.4, 0, TAU); ctx.fill();
      // heart
      const heart = () => { ctx.beginPath(); ctx.moveTo(35, 18); ctx.bezierCurveTo(35, 13, 42, 12, 42, 17); ctx.bezierCurveTo(42, 21, 37, 23, 35, 26); ctx.bezierCurveTo(33, 23, 28, 21, 28, 17); ctx.bezierCurveTo(28, 12, 35, 13, 35, 18); ctx.closePath(); };
      outlined(ctx, heart, '#ff4d5e', 2.4);
    },
    thorns(ctx) {
      // armoured turnip shell with spikes
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        const c = Math.cos(a), s = Math.sin(a);
        const spike = () => { ctx.beginPath(); ctx.moveTo(24 + c * 12 - s * 3.5, 25 + s * 12 + c * 3.5); ctx.lineTo(24 + c * 21, 25 + s * 21); ctx.lineTo(24 + c * 12 + s * 3.5, 25 + s * 12 - c * 3.5); ctx.closePath(); };
        outlined(ctx, spike, '#cfe08a', 2);
      }
      const body = () => { ctx.beginPath(); ctx.arc(24, 25, 13, 0, TAU); };
      outlined(ctx, body, '#7a4a9a', 3);
      ctx.fillStyle = '#efe2c4';
      ctx.beginPath(); ctx.arc(24, 25, 13, 0.15 * Math.PI, 0.85 * Math.PI); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(24, 25, 13, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.moveTo(18, 22); ctx.lineTo(22, 23); ctx.lineTo(18, 25); ctx.fill();
      ctx.beginPath(); ctx.moveTo(30, 22); ctx.lineTo(26, 23); ctx.lineTo(30, 25); ctx.fill();
    },
    dashup(ctx) {
      // rolling pumpkin with speed lines
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (const [y, x0] of [[17, 3], [26, 1], [35, 5]]) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 13, y); ctx.stroke(); }
      ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 2;
      for (const [y, x0] of [[17, 3], [26, 1], [35, 5]]) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 13, y); ctx.stroke(); }
      ctx.save(); ctx.translate(30, 27); ctx.rotate(0.5);
      pumpkin(ctx, 0, 0, 13, true);
      ctx.restore();
      ctx.strokeStyle = '#fff6c0'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(30, 27, 18, -1.9, -0.6); ctx.stroke();
    },
    range(ctx) {
      // a pumpkin seed flying far, with a dotted arc
      ctx.strokeStyle = '#fff6c0'; ctx.lineWidth = 2.4; ctx.setLineDash([3, 4]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(6, 40); ctx.quadraticCurveTo(18, 4, 38, 14); ctx.stroke();
      ctx.setLineDash([]);
      ctx.save(); ctx.translate(36, 15); ctx.rotate(0.55);
      const seed = () => { ctx.beginPath(); ctx.ellipse(0, 0, 9, 5.5, 0, 0, TAU); };
      outlined(ctx, seed, '#f3e3b0', 3);
      ctx.strokeStyle = '#c9a860'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, TAU); ctx.stroke();
      ctx.restore();
      // target ring
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(38, 40, 8, 4, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ff5a3c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(38, 40, 8, 4, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#ff5a3c';
      ctx.beginPath(); ctx.ellipse(38, 40, 2.5, 1.3, 0, 0, TAU); ctx.fill();
    },
  };
  for (const [id, fn] of Object.entries(ICONS)) C.fallbackIcons[id] = (ctx, size) => C.icon48(ctx, size, fn);
})();
