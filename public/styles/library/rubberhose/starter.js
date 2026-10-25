/* Rubber Hose 1930s — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Ink figures with elbow-less rubber-hose limbs, white gloves, pie-cut eyes and big shoes, painted in two
   passes (merged ink outline, then flat greys), on a flat grey wash with ink contours, seen through a
   projector: vignette, rounded gate, grain, dust and scratches stepped at 24 fps. */
(function (root) {
  'use strict';
  const PALETTE = {
    ink: '#16120e', soot: '#3a342d', slate: '#6d665b', slateShade: '#4f493f', ash: '#a0988a', fog: '#cdc5b5',
    paper: '#efe9dc', white: '#faf7ef', face: '#e6dece', faceShade: '#c9c0ae', shoe: '#d9d1c1', shoeShade: '#a59d8e',
    sheet: '#f4efe4', sheetShade: '#cbc3b3', ground: '#cfc8b9', meadow: '#b2aa9a', meadowRim: '#bfb8a9',
    hummock: '#928a7c', path: '#e4ddcd', gate: '#0c0a08', card: '#17130f',
  };
  const P = PALETTE, INK = P.ink, TAU = Math.PI * 2, PI = Math.PI;
  const OL = 1.0; // outline weight in world units
  const BPS = 2;  // the shared beat: 120 bpm

  function hash(a, b) { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- two-pass painter: outline pass (ink, 2x weight, merged), then fills ---------- */
  function Painter(ctx, mode) { this.c = ctx; this.mode = mode; }
  Painter.prototype.part = function (shape, fill, o) {
    o = o || {};
    const c = this.c;
    c.beginPath(); shape(c);
    if (this.mode === 'outline') { c.lineWidth = OL * 2; c.strokeStyle = INK; c.fillStyle = INK; c.stroke(); c.fill(); return; }
    c.save(); c.clip();
    c.fillStyle = o.shade || fill; c.fillRect(-500, -500, 1000, 1000);
    if (o.shade) { c.beginPath(); c.save(); c.translate(o.sh[0], o.sh[1]); shape(c); c.restore(); c.clip(); c.fillStyle = fill; c.fillRect(-500, -500, 1000, 1000); }
    c.restore();
    if (o.detail) { c.save(); o.detail(c); c.restore(); }
  };
  /** Rubber-hose limb: one quadratic bow from (x1,y1) to (x2,y2); bend moves the middle sideways – no elbow. */
  Painter.prototype.hose = function (x1, y1, x2, y2, bend, w, col) {
    const c = this.c, q = ctrl(x1, y1, x2, y2, bend);
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(q[0], q[1], x2, y2);
    c.lineWidth = this.mode === 'outline' ? w + OL * 2 : w; c.strokeStyle = this.mode === 'outline' ? INK : col; c.stroke();
    return Math.atan2(y2 - q[1], x2 - q[0]);
  };
  Painter.prototype.detail = function (fn) { if (this.mode !== 'outline') { this.c.save(); fn(this.c); this.c.restore(); } };
  function ctrl(x1, y1, x2, y2, bend) { const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1; return [(x1 + x2) / 2 - (dy / l) * bend, (y1 + y2) / 2 + (dx / l) * bend]; }
  const E = (x, y, rx, ry, r) => (c) => { c.moveTo(x + rx * Math.cos(r || 0), y + rx * Math.sin(r || 0)); c.ellipse(x, y, rx, ry, r || 0, 0, TAU); };
  function paint(ctx, x, y, s, flip, fn) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    fn(new Painter(ctx, 'outline')); fn(new Painter(ctx, 'fill'));
    ctx.restore();
  }

  /* ---------- the signature parts ---------- */
  function pieEye(c, x, y, rx, ry, cut) {
    c.save(); c.translate(x, y);
    c.fillStyle = INK; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill(); c.clip();
    c.fillStyle = cut; c.beginPath(); c.moveTo(rx * 0.15, -ry * 0.12); c.lineTo(rx * 1.4, -ry * 1.05); c.lineTo(rx * 1.4, -ry * 0.25); c.closePath(); c.fill();
    c.restore();
  }
  function glove(p, x, y, a, s) {
    const co = Math.cos(a), si = Math.sin(a), cx = x + co * 1.25 * s, cy = y + si * 1.25 * s;
    p.part(E(cx, cy, 2.05 * s, 1.85 * s, a), P.white, { shade: P.fog, sh: [-0.35 * s, -0.45 * s],
      detail(c) { c.strokeStyle = INK; c.lineWidth = 0.32 * s; c.beginPath(); for (const k of [-0.55, 0.55]) { c.moveTo(cx - si * k * s, cy + co * k * s); c.lineTo(cx - si * k * s + co * 1.1 * s, cy + co * k * s + si * 1.1 * s); } c.stroke(); } });
    p.part(E(cx - si * 1.55 * s, cy + co * 1.55 * s, 0.85 * s, 0.68 * s, a + 0.4), P.white, {});
    p.part(E(x - co * 0.35 * s, y - si * 0.35 * s, 0.95 * s, 1.65 * s, a), P.white, { shade: P.fog, sh: [-0.25, -0.3] });
  }
  function shoe(p, fx, fy, ang, s, col) {
    s = s || 1; const cx = fx + 1.45 * s, cy = fy - 1.55 * s; col = col || [P.shoe, P.shoeShade];
    p.part(E(cx, cy, 3.75 * s, 2.1 * s, ang), col[0], { shade: col[1], sh: [-0.7 * s, -0.75 * s],
      detail(c) { c.fillStyle = P.white; c.globalAlpha = 0.9; c.beginPath(); c.ellipse(cx + 0.6 * s, cy - 1.0 * s, 1.3 * s, 0.45 * s, ang - 0.15, 0, TAU); c.fill(); } });
  }

  /* ---------- main character: jaunty ink cat-fellow, feet at (x, y), 8-phase bouncy walk ---------- */
  function heroParts(p, t, walking) {
    const ph = t * TAU * 1.84, s = Math.sin(ph), cc = Math.cos(ph);
    const b = walking ? -1.8 * (1 - Math.abs(s)) : -0.6 * Math.pow(Math.max(0, Math.cos(t * BPS * PI)), 6);
    const up = Math.max(0, cc), upB = Math.max(0, -cc);
    const near = walking ? [1.5 + 4.7 * s, -3 * up, up > 0.05 ? -(1.1 + 2.6 * up) : 1.0] : [3.6, 0, 0.9];
    const far = walking ? [-0.9 - 4.7 * s, -3 * upB, upB > 0.05 ? -(1.1 + 2.6 * upB) : 1.0] : [-3.0, 0, -0.9];
    const c = p.c; c.save(); c.transform(1, 0, -0.05, 1, 0, 0);
    p.hose(-3.2, -9.6 + b, -8.6, -15.8 + b + s * 1.4, 2.4, 1.05, INK);                          // tail
    const arm = (A) => glove(p, A[2], A[3], p.hose(A[0], A[1], A[2], A[3], A[4], 1.45, INK), 1);
    const fArm = walking ? [-1.8, -15.8 + b, -1.6 + 4.4 * s, -9.4 + b, -2.4 * cc] : [-1.8, -15.8 + b, -5.0, -11 + b, 2.8];
    const nArm = walking ? [2.3, -15.4 + b, 2.6 - 4.4 * s, -9.0 + b, 2.4 * cc] : [2.3, -15.4 + b, 5.4, -10.8 + b, -2.8];
    arm(fArm);
    for (const F of [far, near]) { p.hose(F === far ? -0.9 : 1.5, -8.2 + b, F[0] + 0.2, F[1] - 1.6, F[2], 1.75, INK); shoe(p, F[0], F[1], 0); }
    p.part(E(0.3, -13.2 + b, 4.0, 4.7), INK, {});
    p.part((k) => { k.moveTo(-4.3, -11.6 + b); k.lineTo(4.5, -11.6 + b); k.lineTo(5.0, -6.9 + b); k.lineTo(-4.8, -6.9 + b); k.closePath(); }, P.slate, { shade: P.slateShade, sh: [-0.9, -0.7],
      detail(k) { k.fillStyle = P.white; for (const x of [1.0, 3.3]) { k.beginPath(); k.ellipse(x, -9.9 + b, 0.72, 0.92, 0, 0, TAU); k.fill(); } } });
    p.part((k) => { const x = 1.4, y = -17.6 + b; k.moveTo(x, y); k.lineTo(x - 3.2, y - 1.9); k.lineTo(x - 3.2, y + 1.9); k.closePath(); k.moveTo(x, y); k.lineTo(x + 3.2, y - 1.9); k.lineTo(x + 3.2, y + 1.9); k.closePath(); }, P.white, { shade: P.fog, sh: [-0.4, -0.5] });
    const hx = 1.3, hy = -24.4 + b * 1.15;
    p.part((k) => { k.moveTo(hx - 5.9, hy - 2.6); k.lineTo(hx - 6.6, hy - 10.6); k.lineTo(hx - 1.3, hy - 6.0); k.closePath(); }, INK, {});
    p.part(E(hx, hy, 7.1, 6.7), INK, { detail(k) { k.strokeStyle = P.white; k.globalAlpha = 0.85; k.lineWidth = 0.6; k.beginPath(); k.arc(hx - 0.6, hy - 0.4, 5.3, PI * 1.08, PI * 1.38); k.stroke(); } });
    p.part((k) => { k.moveTo(hx + 0.4, hy - 6.4); k.lineTo(hx + 3.4, hy - 11.8); k.lineTo(hx + 5.8, hy - 4.2); k.closePath(); }, INK, {});
    p.part((k) => { k.moveTo(hx - 0.6, hy - 2); k.bezierCurveTo(hx, hy - 6, hx + 3.4, hy - 5, hx + 3.6, hy - 4.2); k.bezierCurveTo(hx + 5, hy - 6, hx + 8.4, hy - 3, hx + 8.2, hy + 1.2); k.bezierCurveTo(hx + 8, hy + 5.4, hx + 3, hy + 7.2, hx - 0.8, hy + 4.4); k.bezierCurveTo(hx - 1.8, hy + 2.6, hx - 1.4, hy, hx - 0.6, hy - 2); k.closePath(); }, P.face, { shade: P.faceShade, sh: [-0.7, -0.8] });
    p.detail((k) => {
      pieEye(k, hx + 2.4, hy - 1.7, 1.05, 1.95, P.face); pieEye(k, hx + 5.1, hy - 1.6, 1.0, 1.9, P.face);
      k.fillStyle = INK; k.beginPath(); k.moveTo(hx + 1.6, hy + 2.3); k.quadraticCurveTo(hx + 4.4, hy + 3.4, hx + 7.4, hy + 2.0); k.quadraticCurveTo(hx + 5.6, hy + 7.0, hx + 2.6, hy + 4.4); k.closePath(); k.fill();
      k.fillStyle = P.slate; k.beginPath(); k.ellipse(hx + 4.4, hy + 4.6, 1.2, 0.7, 0, 0, TAU); k.fill();
      k.fillStyle = INK; k.beginPath(); k.ellipse(hx + 7.5, hy + 0.7, 1.55, 1.15, 0.1, 0, TAU); k.fill();
    });
    arm(nArm);
    c.restore();
  }
  function drawHero(ctx, x, y, t, facing) { paint(ctx, x, y, 1, facing < 0, (p) => heroParts(p, t, true)); }

  /* ---------- small creature: a hopping ink imp ---------- */
  function impParts(p, t) {
    const air = Math.abs(Math.sin(t * PI * 1.8)), by = -7.8 - air * 3.2;
    p.hose(-4.6, by + 2.2, -8.6, by - 5.8, -2.4, 0.85, INK);
    p.part((k) => { k.moveTo(-10.6, by - 5); k.lineTo(-8.4, by - 9.4); k.lineTo(-6.6, by - 5.4); k.closePath(); }, INK, {});
    for (const sx of [-1, 1]) { const fx = sx * 2.7, fy = -air * 2.2; p.hose(sx * 1.9, by + 4.1, fx + 0.3, fy - 1, -sx * 0.9 * (1 - air), 1.25, INK); shoe(p, fx - 0.5, fy + 0.3, 0, 0.58); }
    p.part(E(0, by, 6.5, 5.9), INK, { detail(k) { k.strokeStyle = P.white; k.globalAlpha = 0.8; k.lineWidth = 0.5; k.beginPath(); k.ellipse(0, by, 5.2, 4.6, 0, PI * 1.1, PI * 1.42); k.stroke(); } });
    for (const h of [[-2.6, -0.5], [2.8, 0.45]]) p.part((k) => { const x = h[0], y = by - 5.0; k.moveTo(x - 1.4, y + 0.6); k.quadraticCurveTo(x - 0.8 + h[1] * 2, y - 2.2, x + h[1] * 3.4, y - 4); k.quadraticCurveTo(x + 0.6 + h[1], y - 1.6, x + 1.4, y + 0.6); k.closePath(); }, P.fog, { shade: P.ash, sh: [-0.3, 0] });
    p.part(E(2.2, by + 0.6, 4.0, 3.9), P.face, { shade: P.faceShade, sh: [-0.5, -0.6] });
    p.detail((k) => {
      k.fillStyle = P.white; k.strokeStyle = INK; k.lineWidth = 0.35;
      for (const e of [[1.1, 1.35], [4.1, 1.25]]) { k.beginPath(); k.ellipse(e[0], by - 0.9, e[1], 1.8, 0, 0, TAU); k.fill(); k.stroke(); pieEye(k, e[0] + 0.5, by - 0.5, 0.72, 1.1, P.white); }
      k.fillStyle = INK; k.beginPath(); k.moveTo(-0.2, by + 1.9); k.quadraticCurveTo(2.8, by + 3, 5.8, by + 1.5); k.quadraticCurveTo(3.8, by + 5.6, 0.8, by + 3.8); k.closePath(); k.fill();
      k.fillStyle = P.white; k.beginPath(); k.moveTo(1.2, by + 2.2); k.lineTo(2.2, by + 2.4); k.lineTo(1.7, by + 3.5); k.closePath(); k.fill();
    });
    glove(p, 8.4, by + 3.4 - air * 4, 0.4 - air, 0.62);
    p.hose(5.4, by + 0.6, 8.4, by + 3.4 - air * 4, -1.3, 1.0, INK);
  }
  function drawEnemy(ctx, x, y, t) { paint(ctx, x, y, 1.12, true, (p) => impParts(p, t)); }

  /* ---------- a curly tree and a daisy clump, dancing on the beat ---------- */
  function treeParts(p) {
    p.hose(0, 0, 0.6, -24, 2.6, 3.3, P.soot);
    const can = [[0.4, -32.4, 9.6], [-7.8, -28.8, 6.4], [8.4, -29.4, 6.3], [-4.6, -37.6, 6.2], [5.4, -38, 6], [0.4, -25.6, 6.6]];
    p.part((k) => { for (const q of can) E(q[0], q[1], q[2], q[2] * 0.94)(k); }, P.ash, { shade: P.slate, sh: [-2.6, -2.4],
      detail(k) { k.strokeStyle = INK; k.lineWidth = 0.55; for (const s of [[-4.8, -30.6], [4.6, -33.4], [-0.4, -38.2]]) { k.beginPath(); for (let i = 0; i <= 20; i++) { const a = i * 0.33, r = 0.3 + i * 0.1; k.lineTo(s[0] + Math.cos(a) * r, s[1] + Math.sin(a) * r * 0.9); } k.stroke(); } } });
  }
  function daisyParts(p) {
    for (const h of [[-5, -12], [1, -18], [6.5, -11]]) {
      p.hose(h[0] * 0.3, 0, h[0], h[1], 1.4, 0.75, INK);
      p.part((k) => { for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; E(h[0] + Math.cos(a) * 2.9, h[1] + Math.sin(a) * 2.7, 1.8, 1.1, a)(k); } }, P.white, { shade: P.fog, sh: [-0.5, -0.5] });
      p.part(E(h[0], h[1], 2.0, 1.9), INK, { detail(k) { k.fillStyle = P.white; k.beginPath(); k.ellipse(h[0] - 0.7, h[1] - 0.5, 0.38, 0.6, 0, 0, TAU); k.ellipse(h[0] + 0.7, h[1] - 0.5, 0.38, 0.6, 0, 0, TAU); k.fill(); } });
    }
  }
  function dance(ctx, x, y, t, amp, fn) {
    const b = t * BPS, ph = b - Math.floor(b), q = Math.pow(Math.max(0, Math.cos(ph * PI)), 6) + Math.pow(Math.max(0, -Math.cos(ph * PI)), 6);
    ctx.save(); ctx.translate(x, y); ctx.transform(1 + amp * 0.6 * q, 0, -Math.cos(b * PI) * amp, 1 - amp * q, 0, 0);
    paint(ctx, 0, 0, 1, false, fn); ctx.restore();
  }
  function shadow(ctx, x, y, rx) { ctx.fillStyle = 'rgba(22,18,14,0.36)'; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.32, 0, 0, TAU); ctx.fill(); }

  /* ---------- ground: flat washes, lighter rim, centred ink contour ---------- */
  function wash(ctx, pts, fill, rim) {
    const path = () => { ctx.beginPath(); ctx.moveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2); for (let i = 1; i <= pts.length; i++) { const a = pts[i % pts.length], b = pts[(i + 1) % pts.length]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } ctx.closePath(); };
    path(); ctx.fillStyle = fill; ctx.fill();
    ctx.save(); ctx.clip(); ctx.lineWidth = 5.2; ctx.strokeStyle = rim; ctx.stroke(); ctx.restore();   // lighter inner rim band
    ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(22,18,14,0.92)'; ctx.stroke();                         // centred ink contour
  }

  /* ---------- film layer: grain tile + vignette + gate, scratches and dust at 24 fps ---------- */
  let grain = null;
  function grainTile() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), img = g.createImageData(128, 128), r = rng(1931);
    for (let i = 0; i < 128 * 128; i++) { const v = r(), w = v > 0.5 ? 250 : 16; img.data[i * 4] = w; img.data[i * 4 + 1] = w - 6; img.data[i * 4 + 2] = w - 14; img.data[i * 4 + 3] = Math.pow(Math.abs(v - 0.5) * 2, 1.8) * 54; }
    g.putImageData(img, 0, 0); return c;
  }
  function film(ctx, w, h, t) {
    const tick = Math.floor(t * 24), u = h / 900;
    grain = grain || grainTile();
    ctx.save(); ctx.translate(-(hash(tick, 4) * 128 | 0), -(hash(tick, 5) * 128 | 0));
    ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, w + 128, h + 128); ctx.restore();
    const R = Math.hypot(w, h) / 2, v = ctx.createRadialGradient(w / 2, h * 0.48, R * 0.4, w / 2, h * 0.48, R * 1.02);
    v.addColorStop(0, 'rgba(14,11,8,0)'); v.addColorStop(0.55, 'rgba(14,11,8,0.18)'); v.addColorStop(0.85, 'rgba(14,11,8,0.48)'); v.addColorStop(1, 'rgba(14,11,8,0.76)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    const f = (hash(tick, 2) - 0.5) * 0.07; ctx.globalAlpha = Math.abs(f); ctx.fillStyle = f > 0 ? '#fffaf0' : P.gate; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
    const rr = h * 0.075, m = h * 0.004, dy = Math.round(Math.sin(t * 2.1) + (hash(tick, 1) - 0.5));
    ctx.fillStyle = 'rgba(10,8,6,0.94)'; ctx.beginPath(); ctx.rect(-10, -10, w + 20, h + 20);
    ctx.moveTo(m + rr, m + dy); ctx.arcTo(w - m, m + dy, w - m, h - m + dy, rr); ctx.arcTo(w - m, h - m + dy, m, h - m + dy, rr); ctx.arcTo(m, h - m + dy, m, m + dy, rr); ctx.arcTo(m, m + dy, w - m, m + dy, rr); ctx.closePath(); ctx.fill('evenodd');
    for (let i = 0; i < Math.floor(hash(tick, 6) * 4.2); i++) { ctx.globalAlpha = 0.7; ctx.fillStyle = hash(tick, 50 + i) < 0.35 ? '#f6f1e6' : P.gate; ctx.beginPath(); ctx.arc(hash(tick, 10 + i) * w, hash(tick, 20 + i) * h, (0.6 + hash(tick, 30 + i) * 2) * u * 1.4, 0, TAU); ctx.fill(); }
    for (let s = 0; s < 3; s++) {
      const ep = Math.floor((tick + s * 7) / (14 + s * 11)); if (hash(ep, 100 + s) > 0.42) continue;
      const x = (0.08 + hash(ep, 110 + s) * 0.84) * w + (hash(tick, 120 + s) - 0.5) * 3 * u;
      ctx.globalAlpha = 0.16 + hash(ep, 130 + s) * 0.18; ctx.strokeStyle = s === 1 ? P.gate : '#f8f4ea'; ctx.lineWidth = Math.max(1, u);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (hash(tick, 150 + s) - 0.5) * 2 * u, h); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- preview scene ---------- */
  function draw(ctx, w, h, t) {
    const S = h / 360, W = w / S;
    ctx.save(); ctx.scale(S, S); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = P.ground; ctx.fillRect(0, 0, W, 360);
    wash(ctx, [[-20, 40], [W * 0.3, 10], [W * 0.42, 120], [W * 0.18, 190], [-20, 160]], P.meadow, P.meadowRim);
    wash(ctx, [[W * 0.62, 230], [W * 0.95, 200], [W + 30, 330], [W * 0.7, 380], [W * 0.55, 320]], P.hummock, '#a39b8c');
    ctx.beginPath(); ctx.moveTo(-10, 270); ctx.bezierCurveTo(W * 0.3, 230, W * 0.55, 300, W + 10, 150);
    ctx.lineWidth = 42; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 40.4; ctx.strokeStyle = P.path; ctx.stroke();
    const r = rng(7); ctx.strokeStyle = 'rgba(22,18,14,0.75)'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 160; i++) { const x = r() * W, y = r() * 360; ctx.beginPath(); ctx.moveTo(x - 0.7, y); ctx.lineTo(x - 2, y - 2); ctx.moveTo(x, y); ctx.lineTo(x, y - 3); ctx.moveTo(x + 0.7, y); ctx.lineTo(x + 2, y - 1.9); ctx.stroke(); }
    const items = [[W * 0.16, 120, 'tree'], [W * 0.82, 110, 'tree'], [W * 0.34, 330, 'daisy'], [W * 0.7, 300, 'daisy'], [W * 0.5 + Math.sin(t * 0.5) * 30, 205, 'hero'], [W * 0.28, 210, 'imp'], [W * 0.72, 215, 'imp']].sort((a, b) => a[1] - b[1]);
    for (const it of items) shadow(ctx, it[0], it[1], it[2] === 'tree' ? 14 : 8);
    for (const it of items) {
      const [x, y, k] = it;
      if (k === 'tree') dance(ctx, x, y, t, 0.04, treeParts);
      else if (k === 'daisy') dance(ctx, x, y, t, 0.08, daisyParts);
      else if (k === 'hero') drawHero(ctx, x, y, t, Math.cos(t * 0.5) >= 0 ? 1 : -1);
      else drawEnemy(ctx, x, y, t + x * 0.01);
    }
    ctx.restore();
    film(ctx, w, h, t);
  }

  const Starter = { id: 'rubberhose', name: 'Rubber Hose 1930s', palette: PALETTE, fonts: ['Limelight', 'Rye', 'Special Elite'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['rubberhose'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
