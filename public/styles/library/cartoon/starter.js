/* Brotato Cartoon — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Core trick: every sprite is a list of "parts" painted TWICE into an offscreen canvas –
   pass 1 strokes+fills every part in one plum colour (= one clean silhouette outline),
   pass 2 paints base fill, a cel crescent (the same shape shifted up-left), details and a white gloss. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2, PI = Math.PI;
  const OUT = '#3a2240', OL = 1.15, IL = 0.55, FLASH_SH = '#efe6f6';
  const PALETTE = {
    outline: OUT, pump: '#ff952b', pumpSh: '#ea681c', pumpRib: '#ec7a22', carve: '#8a3214', glow: '#ffd43f', glowHi: '#fff3b0',
    coat: '#2f9c95', coatSh: '#22736f', scarf: '#8ad04c', scarfSh: '#5ea83a', scarfHi: '#c3ec8c',
    leg: '#41703f', legSh: '#2f5431', shoe: '#6b3d2c', shoeSh: '#4c291f', stem: '#7f9b3b', stemSh: '#5d7a2a',
    leaf: '#86cf4c', leafSh: '#59a33a', ghost: '#f6f8ff', ghostSh: '#c3d0ef', tongue: '#ff7f9e',
    root: '#efd49e', rootSh: '#cfac70', cream: '#fff1c8', creamSh: '#e6c68a',
    creepTop: '#9b5cd0', creepTopSh: '#7241aa', creepBot: '#f8eacb', creepBotSh: '#e0c595',
    grass: '#9ec671', grassDark: '#79ae5a', lilac: '#c8b6da', sand: '#ebd3a0', panel: '#fff4de',
  };
  const C = PALETTE;
  const CREEP = [
    { top: '#9b5cd0', topSh: '#7241aa', bot: '#f8eacb', botSh: '#e0c595' },
    { top: '#bd5aa6', topSh: '#8f3c82', bot: '#f9e7d2', botSh: '#e4c4a0' },
    { top: '#7d66d8', topSh: '#5947ad', bot: '#f3ecc2', botSh: '#dacd92' },
  ];

  /* ---- Painter: part(shape, fill, {shade, sh:[dx,dy], inner, detail, hi:[x,y,rx,ry,rot], hi2:[x,y,r], ol}) */
  function Painter(ctx, mode, ol) { this.ctx = ctx; this.mode = mode; this.ol = ol; }
  Painter.prototype.part = function (shape, fill, o) {
    o = o || {}; const ctx = this.ctx;
    if (this.mode === 'outline') { // fat plum silhouette: stroke at 2×OL then fill
      if (o.noOutline) return;
      ctx.beginPath(); shape(ctx); ctx.lineWidth = (o.ol != null ? o.ol : this.ol) * 2;
      ctx.strokeStyle = OUT; ctx.fillStyle = OUT; ctx.stroke(); ctx.fill(); return;
    }
    const flash = this.mode === 'flash';
    ctx.save(); ctx.beginPath(); shape(ctx);
    if (o.inner) { ctx.lineWidth = o.inner * 2; ctx.strokeStyle = OUT; ctx.stroke(); } // thin separation line (half shows)
    ctx.clip();
    if (o.sh) { // whole part in shade colour, then the lit colour clipped to the shape shifted by sh -> crescent bottom-right
      this.paint(fill, o, true, flash);
      ctx.save(); ctx.save(); ctx.translate(o.sh[0], o.sh[1]); ctx.beginPath(); shape(ctx); ctx.restore(); ctx.clip();
      this.paint(fill, o, false, flash); ctx.restore();
    } else this.paint(fill, o, false, flash);
    if (!flash) {
      if (o.detail) { ctx.save(); o.detail(ctx); ctx.restore(); }
      if (o.hi) gloss(ctx, o.hi, o.hiA);
      if (o.hi2) { ctx.globalAlpha = 0.92; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.hi2[0], o.hi2[1], o.hi2[2], 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  };
  Painter.prototype.paint = function (fill, o, shade, flash) {
    const ctx = this.ctx;
    if (flash) { ctx.fillStyle = shade ? FLASH_SH : '#ffffff'; ctx.fillRect(-500, -500, 1000, 1000); return; }
    if (typeof fill === 'function') { fill(ctx, shade); return; }
    ctx.fillStyle = shade ? o.shade || fill : fill; ctx.fillRect(-500, -500, 1000, 1000);
  };
  Painter.prototype.detail = function (fn, inFlash) {
    if (this.mode === 'outline' || (this.mode === 'flash' && !inFlash)) return;
    this.ctx.save(); fn(this.ctx); this.ctx.restore();
  };
  function gloss(ctx, h, a) { ctx.globalAlpha = a || 0.92; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(h[0], h[1], h[2], h[3], h[4] || 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }

  /* ---- shape helpers (world units) */
  const E = (x, y, rx, ry, rot) => (c) => { rot = rot || 0; c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const CAP = (x1, y1, x2, y2, r) => (c) => { // capsule = limbs
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r);
    c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5); c.arc(x2, y2, r, a - PI / 2, a + PI / 2); c.closePath();
  };
  function blobPath(c, pts, ten) { // closed Catmull-Rom blob through points
    const n = pts.length; c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6 * ten, p1[1] + (p2[1] - p0[1]) / 6 * ten, p2[0] - (p3[0] - p1[0]) / 6 * ten, p2[1] - (p3[1] - p1[1]) / 6 * ten, p2[0], p2[1]);
    }
    c.closePath();
  }
  function roundPoly(c, pts, r) {
    const n = pts.length, a = pts[n - 1], b = pts[0]; c.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.arcTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, r); }
    c.closePath();
  }
  function starPts(n, ro, ri, cx, cy, rot) { const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU, r = i & 1 ? ri : ro; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; }
  function pumpkinPath(c, cx, cy, rx, ry) { // squircle with dents top (stem) and bottom
    for (let i = 0; i <= 64; i++) {
      const th = i / 64 * TAU, co = Math.cos(th), si = Math.sin(th);
      const x = Math.sign(co) * Math.pow(Math.abs(co), 0.85) * rx;
      let y = Math.sign(si) * Math.pow(Math.abs(si), 0.92) * ry;
      y *= 1 - 0.15 * Math.exp(-Math.pow((th - PI * 1.5) / 0.3, 2)) - 0.07 * Math.exp(-Math.pow((th - PI * 0.5) / 0.26, 2));
      if (i) c.lineTo(cx + x, cy + y); else c.moveTo(cx + x, cy + y);
    }
    c.closePath();
  }
  function ribs(c, cx, cy, rx, ry, col, lw) {
    c.strokeStyle = col; c.lineWidth = lw;
    for (const k of [-0.7, -0.3, 0.3, 0.7]) { c.beginPath(); c.moveTo(cx + k * rx * 0.2, cy - ry * 0.9); c.quadraticCurveTo(cx + k * rx * 1.2, cy, cx + k * rx * 0.2, cy + ry * 0.94); c.stroke(); }
  }
  function turnipPath(c, cx, top, bottom, w) {
    const h = bottom - top; c.moveTo(cx, top);
    c.bezierCurveTo(cx + w * 0.42, top + h * 0.02, cx + w, top + h * 0.22, cx + w, top + h * 0.56);
    c.bezierCurveTo(cx + w, top + h * 0.86, cx + w * 0.55, bottom, cx, bottom);
    c.bezierCurveTo(cx - w * 0.55, bottom, cx - w, top + h * 0.86, cx - w, top + h * 0.56);
    c.bezierCurveTo(cx - w, top + h * 0.22, cx - w * 0.42, top + h * 0.02, cx, top); c.closePath();
  }
  function leafPath(c, bx, by, a, len, wid) {
    const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx, tx = bx + dx * len, ty = by + dy * len;
    c.moveTo(bx, by);
    c.bezierCurveTo(bx + dx * len * 0.22 + nx * wid, by + dy * len * 0.22 + ny * wid, tx - dx * len * 0.3 + nx * wid * 0.75, ty - dy * len * 0.3 + ny * wid * 0.75, tx, ty);
    c.bezierCurveTo(tx - dx * len * 0.3 - nx * wid * 0.75, ty - dy * len * 0.3 - ny * wid * 0.75, bx + dx * len * 0.22 - nx * wid, by + dy * len * 0.22 - ny * wid, bx, by); c.closePath();
  }
  const midrib = (bx, by, a, len, col) => (c) => { c.strokeStyle = col; c.lineWidth = 0.45; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.sin(a) * len * 0.78, by - Math.cos(a) * len * 0.78); c.stroke(); };
  const turnipFill = (col, waveY, amp, freq) => (c, sh) => { // two-tone body split by a wavy line
    c.fillStyle = sh ? col.botSh : col.bot; c.fillRect(-500, -500, 1000, 1000);
    c.fillStyle = sh ? col.topSh : col.top; c.beginPath(); c.moveTo(-60, -120); c.lineTo(60, -120); c.lineTo(60, waveY);
    for (let x = 60; x >= -60; x -= 0.5) c.lineTo(x, waveY + amp * Math.sin(x * freq + 0.6));
    c.closePath(); c.fill();
  };
  function carve(c, pathFn, dx, dy) { // dark rim + glowing inside shifted down = carving depth
    c.save(); c.beginPath(); pathFn(c); c.fillStyle = C.carve; c.fill(); c.clip();
    c.translate(dx, dy); c.beginPath(); pathFn(c); c.fillStyle = C.glow; c.fill(); c.restore();
  }

  /* ---- sprite baking: K canvas px per world unit, outline pass then fill/flash pass */
  let K = 3;
  function build(box, fn, mode, post) {
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((box[2] - box[0]) * K); cv.height = Math.ceil((box[3] - box[1]) * K);
    const ctx = cv.getContext('2d'); ctx.scale(K, K); ctx.translate(-box[0], -box[1]);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'outline', OL)); fn(new Painter(ctx, mode || 'fill', OL));
    const s = { c: cv, ox: -box[0] * K, oy: -box[1] * K };
    if (post) post(s, box);
    return s;
  }

  /* ---- hero: pumpkin-head kid, 4 hop frames [backFoot x,y | frontFoot x,y | backArm, frontArm | scarf phase] */
  const JACK_FR = [[-2.3, 0, 2.3, 0, 0.25, -0.25, 0], [-3.7, -0.2, 3.9, -0.5, 0.9, -0.8, 1.6], [-2.0, -1.5, 2.9, -2.1, 0.35, -0.15, 3.2], [2.7, -0.6, -1.3, -0.2, -0.75, 0.85, 4.8]];
  function jackParts(P, fr) {
    const F = JACK_FR[fr], cx = 0.4, cy = -19.6, rx = 11.2, ry = 9.1;
    const ang = [0.55, 1.0, 1.2, 0.9][fr], len = 7.6, ax = -2.4, ay = -11.2, dx = -Math.sin(ang), dy = Math.cos(ang), nx = dy, ny = -dx;
    const wv = Math.sin(F[6] + 0.8) * 0.5, h0 = 1.45, h1 = 1.95;
    const sp = [[ax + nx * h0, ay + ny * h0], [ax + dx * len * 0.5 + nx * (h0 + 0.15 + wv), ay + dy * len * 0.5 + ny * (h0 + 0.15 + wv)], [ax + dx * len + nx * h1, ay + dy * len + ny * h1],
      [ax + dx * len - nx * h1, ay + dy * len - ny * h1], [ax + dx * len * 0.5 - nx * (h0 + 0.15 - wv), ay + dy * len * 0.5 - ny * (h0 + 0.15 - wv)], [ax - nx * h0, ay - ny * h0]];
    P.part((c) => blobPath(c, sp, 0.6), C.scarf, { shade: C.scarfSh, sh: [0.5, -0.7], detail(c) {
      c.strokeStyle = C.scarfHi; c.lineWidth = 1.2; c.lineCap = 'butt'; c.beginPath();
      for (const t of [0.45, 0.72]) { const mx = ax + dx * len * t, my = ay + dy * len * t; c.moveTo(mx + nx * 3, my + ny * 3); c.lineTo(mx - nx * 3, my - ny * 3); }
      c.stroke();
    } });
    const arm = (sx, a) => { const hx = sx + Math.sin(a) * 3.4, hy = -10 + Math.cos(a) * 3.4;
      P.part(CAP(sx, -10, hx, hy, 1.15), C.coat, { shade: C.coatSh, sh: [-0.3, -0.4] });
      P.part(E(hx, hy, 1.5, 1.5), C.cream, { shade: C.creamSh, sh: [-0.45, -0.5] }); };
    const leg = (hx, fx, fy) => { P.part(CAP(hx, -5.6, fx, fy - 1.3, 1.35), C.leg, { shade: C.legSh, sh: [-0.35, -0.3] });
      P.part(E(fx + 0.7, fy - 1.05, 2.1, 1.35), C.shoe, { shade: C.shoeSh, sh: [-0.4, -0.5], hi: [fx, fy - 1.65, 0.75, 0.38, 0] }); };
    arm(-3, F[4]); leg(-1.6, F[0], F[1]); leg(1.6, F[2], F[3]);
    P.part(E(0, -8.3, 4.5, 4.4), C.coat, { shade: C.coatSh, sh: [-1, -0.9], detail(c) { c.fillStyle = C.cream; c.beginPath(); c.arc(1.9, -7.4, 0.55, 0, TAU); c.arc(2, -5.4, 0.55, 0, TAU); c.fill(); } });
    arm(3, F[5]);
    P.part(E(0.3, -11, 5.7, 2.3), C.scarf, { shade: C.scarfSh, sh: [-0.6, -0.8], inner: IL });
    P.part(CAP(0.1, -27, 1.2, -30.9, 1.3), C.stem, { shade: C.stemSh, sh: [-0.45, -0.3] });
    P.part((c) => pumpkinPath(c, cx, cy, rx, ry), C.pump, { shade: C.pumpSh, sh: [-1.9, -1.6], inner: IL,
      detail(c) { ribs(c, cx, cy, rx, ry, C.pumpRib, 0.6); }, hi: [cx - 6.3, cy - 4.3, 2.5, 1.3, -0.6], hi2: [cx - 3.5, cy - 6.5, 0.6] });
    P.detail((c) => { // carved face, offset towards the facing side
      const fx = cx + 2.2;
      carve(c, (k) => roundPoly(k, [[fx - 3.9, cy - 5.9], [fx - 7, cy + 0.2], [fx - 0.9, cy + 0.2]], 0.8), 0.25, 0.85);
      carve(c, (k) => roundPoly(k, [[fx + 3.6, cy - 5.6], [fx + 1, cy + 0.1], [fx + 6.1, cy + 0.1]], 0.75), 0.25, 0.85);
      c.fillStyle = C.glowHi; c.beginPath(); c.ellipse(fx - 3.7, cy - 1, 1.25, 0.8, 0, 0, TAU); c.ellipse(fx + 3.7, cy - 1, 1.05, 0.75, 0, 0, TAU); c.fill();
      const mouth = (k) => { k.moveTo(fx - 7.4, cy + 2.3); k.quadraticCurveTo(fx - 0.6, cy + 12.4, fx + 6.6, cy + 1.9); k.quadraticCurveTo(fx - 0.6, cy + 5.4, fx - 7.4, cy + 2.3); k.closePath(); };
      carve(c, mouth, 0.2, 0.85);
      c.save(); c.beginPath(); mouth(c); c.clip(); c.fillStyle = C.pump; c.beginPath();
      roundPoly(c, [[fx - 3.6, cy + 2], [fx - 1.4, cy + 2], [fx - 1.4, cy + 4.9], [fx - 3.6, cy + 4.9]], 0.4);
      roundPoly(c, [[fx + 1.3, cy + 1.8], [fx + 3.5, cy + 1.8], [fx + 3.5, cy + 4.6], [fx + 1.3, cy + 4.6]], 0.4);
      roundPoly(c, [[fx - 1.2, cy + 5.6], [fx + 0.9, cy + 5.6], [fx + 0.9, cy + 9], [fx - 1.2, cy + 9]], 0.4); c.fill(); c.restore();
    });
    P.part((c) => leafPath(c, -0.4, -28.4, -1.2, 5.4, 2), C.leaf, { shade: C.leafSh, sh: [-0.3, -0.5], detail: midrib(-0.4, -28.4, -1.2, 5.4, C.leafSh) });
    P.detail((c) => { c.strokeStyle = OUT; c.lineWidth = 0.6; c.beginPath(); c.arc(3.3, -29.4, 1.25, PI * 0.9, PI * 2.6); c.stroke(); });
  }

  /* ---- small melee enemy: grumpy turnip, 4 waddle frames */
  function creeperParts(P, fr, v) {
    const col = CREEP[v], st = [0, 1, 0, -1][fr], sw = [0, 0.1, 0, -0.1][fr];
    const leaf = (a, len, wid) => P.part((c) => leafPath(c, 0.3, -19.4, a + sw, len, wid), C.leaf, { shade: C.leafSh, sh: [-0.6, -0.6], detail: midrib(0.3, -19.4, a + sw, len, C.leafSh) });
    leaf(-0.85, 8.2, 2.6); leaf(0.8, 8, 2.6); leaf(-0.02, 10.2, 3);
    const lift = (s) => Math.max(0, s) * 1.5;
    P.part(CAP(-3, -4.8, -3.3 + st * 0.8, -1.1 - lift(st), 1.45), C.root, { shade: C.rootSh, sh: [-0.4, -0.4] });
    P.part(CAP(3, -4.8, 3.3 - st * 0.8, -1.1 - lift(-st), 1.45), C.root, { shade: C.rootSh, sh: [-0.4, -0.4] });
    P.part((c) => turnipPath(c, 0, -21.6, -2.6, 10.4), turnipFill(col, -10.8, 0.8, 0.9), { sh: [-1.8, -1.5], hi: [-5.2, -16.2, 2.2, 1.2, -0.7], hi2: [-2.7, -18.4, 0.55] });
    P.detail((c) => {
      const j = [0, 0.18, 0, -0.12][fr];
      c.lineWidth = IL * 1.3; c.strokeStyle = OUT; c.fillStyle = '#fff';
      c.beginPath(); c.ellipse(1, -13.4, 2.5, 2.8, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(6.4, -13.2, 2.3, 2.7, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = OUT; c.beginPath(); c.arc(1.8 + j, -12.9, 1.25, 0, TAU); c.arc(7.1 + j, -12.7, 1.2, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(1.4 + j, -13.4, 0.38, 0, TAU); c.arc(6.7 + j, -13.2, 0.36, 0, TAU); c.fill();
      c.lineWidth = 1.35; c.beginPath(); c.moveTo(-1.8, -17.6); c.lineTo(3, -15.6); c.moveTo(4.6, -15.5); c.lineTo(9, -17.3); c.stroke();
      c.lineWidth = 0.9; c.beginPath(); c.arc(4, -6.2, 2.1, PI * 1.18, PI * 1.82); c.stroke();
    });
  }

  /* ---- fast floating enemy: ghost with wavy hem, faded bottom */
  function ghostParts(P, fr) {
    const ph = fr / 4 * TAU;
    const body = (c) => {
      c.moveTo(-7.8, -7.4); c.bezierCurveTo(-8.8, -15.5, -6.4, -24.4, 0.6, -24.4); c.bezierCurveTo(7.8, -24.4, 9.3, -15.6, 8.3, -5);
      const xs = [8.3, 4.6, 0.8, -3];
      for (let i = 0; i < 3; i++) c.quadraticCurveTo((xs[i] + xs[i + 1]) / 2, -0.4 + Math.sin(ph + i * 1.9 + 1.2), xs[i + 1], -4.6 + Math.sin(ph + i * 1.9) * 0.6);
      const tw = Math.sin(ph + 2.4);
      c.quadraticCurveTo(-6, 0.4 + tw * 0.6, -11.6 + tw * 0.8, -2.6 + tw * 0.9); c.quadraticCurveTo(-9.4, -4.6, -7.8, -7.4); c.closePath();
    };
    P.part(E(-7.6, -12.4 + Math.sin(ph) * 0.6, 2.3, 1.6, 0.5), C.ghost, { shade: C.ghostSh, sh: [-0.4, -0.4] });
    P.part(body, C.ghost, { shade: C.ghostSh, sh: [-1.7, -1.3], hi: [-3.6, -20, 2.2, 1.2, -0.7], hi2: [-1, -22, 0.5] });
    P.part(E(8.9, -13 + Math.sin(ph + 1.3) * 0.7, 2.9, 1.7, -0.3), C.ghost, { shade: C.ghostSh, sh: [-0.5, -0.5], inner: IL });
    P.detail((c) => {
      c.fillStyle = OUT; c.beginPath(); c.ellipse(1.6, -16.8, 1.55, 2.4, 0.18, 0, TAU); c.fill(); c.beginPath(); c.ellipse(5.9, -16.6, 1.45, 2.3, -0.18, 0, TAU); c.fill();
      c.fillStyle = '#9fd8ff'; c.beginPath(); c.arc(1.3, -17.7, 0.45, 0, TAU); c.arc(5.6, -17.5, 0.42, 0, TAU); c.fill();
      const m = 0.3 * Math.sin(ph * 2);
      c.save(); c.beginPath(); c.ellipse(3.9, -10.4, 2.5, 3.2 + m, 0, 0, TAU); c.fillStyle = OUT; c.fill(); c.clip();
      c.fillStyle = C.tongue; c.beginPath(); c.ellipse(4.2, -7.6 + m, 1.9, 1.3, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(2.4, -13.6); c.lineTo(3.4, -13.6); c.lineTo(2.9, -11.9); c.moveTo(4.5, -13.6); c.lineTo(5.5, -13.6); c.lineTo(5, -11.9); c.fill(); c.restore();
    });
  }
  function ghostFade(s, box) { // bottom 9 units fade to 42 % alpha
    const ctx = s.c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, (-9 - box[1]) * K, 0, -box[1] * K);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = g; ctx.fillRect(0, 0, s.c.width, s.c.height);
  }

  /* ---- props & pickups */
  function bushParts(P, v) {
    const col = [['#73c257', '#4e9a40'], ['#8acb5a', '#61a444']][v];
    P.part((c) => { E(-6.4, -6, 6.4, 6)(c); E(6, -5.8, 6, 5.6)(c); E(0, -9.6, 7.6, 7.2)(c); E(-0.5, -4.6, 7, 4.8)(c); }, col[0], { shade: col[1], sh: [-2.1, -2], detail(c) {
      c.strokeStyle = col[1]; c.lineWidth = 0.7;
      for (const p of [[3.5, -8], [-4, -6], [0.5, -12.5]]) { c.beginPath(); c.arc(p[0], p[1], 1.4, 0.15 * PI, 0.85 * PI); c.stroke(); }
      if (v === 1) for (const p of [[4.6, -10.4], [-2.6, -13.2], [-6.8, -6.8], [7.6, -5], [1, -6.4]]) {
        c.fillStyle = '#ef5a52'; c.strokeStyle = OUT; c.lineWidth = 0.45; c.beginPath(); c.arc(p[0], p[1], 1.15, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(p[0] - 0.35, p[1] - 0.35, 0.32, 0, TAU); c.fill();
      }
    }, hi: [-4.8, -13, 2.2, 1.1, -0.6] });
  }
  function rockParts(P) {
    const pts = [[-8, 0.3], [-9, -3.8], [-6, -8.6], [-0.5, -10.4], [5.6, -9], [8.8, -4.2], [8.2, 0.3]].map((p) => [p[0] * 0.66, p[1] * 0.66]);
    P.part((c) => blobPath(c, pts, 0.8), '#bdb5cd', { shade: '#918aa9', sh: [-1.3, -1.2], hi: [-3, -4.4, 1.3, 0.6, -0.6] });
  }
  function gemParts(P) {
    const pts = [[-3.2, -3.4], [-1.7, -5.3], [1.7, -5.3], [3.2, -3.4], [0, 0.3]];
    P.part((c) => roundPoly(c, pts, 0.55), '#74e690', { ol: 0.85, detail(c) {
      c.fillStyle = '#2fae66'; c.beginPath(); c.moveTo(0.4, -3.4); c.lineTo(3.4, -3.4); c.lineTo(0, 0.6); c.closePath(); c.fill();
      c.strokeStyle = OUT; c.globalAlpha = 0.35; c.lineWidth = 0.35; c.beginPath(); c.moveTo(-3.2, -3.4); c.lineTo(3.2, -3.4); c.stroke(); c.globalAlpha = 1;
    }, hi: [-1.5, -4, 1, 0.5, -0.4], hi2: [-2, -2.5, 0.32] });
  }
  const seedPath = (c) => { c.moveTo(4.4, 0); c.bezierCurveTo(2.6, -2.8, -3.5, -3.1, -3.5, 0); c.bezierCurveTo(-3.5, 3.1, 2.6, 2.8, 4.4, 0); c.closePath(); };
  const seedParts = (P) => P.part(seedPath, C.cream, { ol: 0.85, shade: C.creamSh, sh: [-0.5, -0.8], hi: [-1, -1.35, 1.35, 0.55, -0.12] });
  const hitParts = (P) => P.part((c) => roundPoly(c, starPts(8, 5.6, 2.6, 0, 0, 0.2), 0.4), '#ffffff', { ol: 0.75, shade: '#fff3b5', sh: [-0.7, -0.7] });
  const starParts = (P) => P.part((c) => roundPoly(c, starPts(5, 4.4, 2.1, 0, 0.3, -PI / 2), 0.55), '#ffd43f', { ol: 0.85, shade: '#f39a1e', sh: [-0.8, -0.8], hi2: [-1, -1.4, 0.55] });
  const puffParts = (P) => P.part((c) => { E(0, 0.4, 4.6, 4.3)(c); E(-3.6, 1.4, 3.1, 2.9)(c); E(3.6, 1.2, 3.2, 3)(c); E(-1.6, -2.6, 3, 2.9)(c); E(2.1, -2.3, 2.8, 2.7)(c); }, '#ffffff', { ol: 0.9, shade: '#dcd6ea', sh: [-1.3, -1.3], hi: [-2.4, -3, 1.2, 0.6, -0.6] });

  let SPR = null;
  function sprites(k) {
    if (SPR && SPR.k === k) return SPR;
    K = k; SPR = { k, jack: [], creep: [], ghost: [] };
    for (let f = 0; f < 4; f++) {
      SPR.jack.push(build([-15, -34, 15, 2.5], (P) => jackParts(P, f)));
      SPR.creep.push([0, 1, 2].map((v) => build([-14, -32, 14, 2.5], (P) => creeperParts(P, f, v))));
      SPR.ghost.push(build([-15, -28, 14, 2.5], (P) => ghostParts(P, f), 'fill', ghostFade));
    }
    SPR.creepFlash = build([-14, -32, 14, 2.5], (P) => creeperParts(P, 0, 0), 'flash');
    SPR.bush = [0, 1].map((v) => build([-15, -20, 15, 2], (P) => bushParts(P, v)));
    SPR.rock = build([-9, -10, 9, 2], rockParts); SPR.gem = build([-5, -7.5, 5, 2], gemParts); SPR.seed = build([-5.5, -4.6, 6.2, 4.6], seedParts);
    SPR.hit = build([-7.5, -7.5, 7.5, 7.5], hitParts); SPR.star = build([-6, -6, 6, 6], starParts); SPR.puff = build([-9, -7.5, 9, 7.5], puffParts);
    return SPR;
  }
  /** Blits a baked sprite with feet at (x,y) in world space: flip, squash/stretch, rotation around the feet. */
  function blit(ctx, s, x, y, sx, sy, rot, facing) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx * (facing || 1), sy);
    ctx.drawImage(s.c, -s.ox / K, -s.oy / K, s.c.width / K, s.c.height / K); ctx.restore();
  }

  /* ---- ground: flat play-mat regions with crisp AA edges and an inner rim band (signed distance = value / |gradient|) */
  function hashInt(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
  function perlin(x, y, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, fd = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const g = (ix, iy, dx, dy) => { const a = (hashInt(ix, iy, s) & 15) / 16 * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
    const u = fd(fx), v = fd(fy), a = g(x0, y0, fx, fy) + u * (g(x0 + 1, y0, fx - 1, fy) - g(x0, y0, fx, fy));
    const b = g(x0, y0 + 1, fx, fy - 1) + u * (g(x0 + 1, y0 + 1, fx - 1, fy - 1) - g(x0, y0 + 1, fx, fy - 1));
    return (a + v * (b - a)) * 1.414;
  }
  const fbm2 = (x, y, s) => Math.min(1, Math.max(0, (perlin(x, y, s) + 0.5 * perlin(x * 2, y * 2, s + 101)) / 1.5 * 0.5 + 0.5));
  // layers bottom -> top: fill, rim colour, rim width (world units)
  const BASE = [158, 198, 113];
  const LAY = [{ f: [121, 174, 90], r: [106, 158, 80], w: 1.7 }, { f: [200, 182, 218], r: [180, 160, 204], w: 2.0 }, { f: [235, 211, 160], r: [216, 186, 133], w: 2.5 }];
  function fields(x, y, out) { // > 0 = inside the region
    const wx = perlin(x / 900, y / 900, 701) * 90, wy = perlin(x / 900 + 9.2, y / 900, 702) * 90, X = x + wx, Y = y + wy;
    out[0] = fbm2(X / 320 + 3.3, Y / 320, 101) - 0.6;
    out[1] = fbm2(X / 360 + 13.7, Y / 360, 505) - 0.665;
    const pn = perlin((x + perlin(x / 480, y / 480, 305) * 60) / 900, (y + perlin(x / 480 + 5.1, y / 480, 306) * 60) / 900, 304);
    out[2] = Math.max(fbm2(X / 400 + 31.1, Y / 400, 202) - 0.68, (0.03 - Math.abs(pn)) * 3.0);
  }
  let GROUND = null;
  function ground(w, h, s, camX, camY) {
    const key = w + 'x' + h;
    if (GROUND && GROUND.key === key) return GROUND.c;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    const ST = 4, cpx = ST * s, nx = Math.ceil(w / cpx) + 2, ny = Math.ceil(h / cpx) + 2, F = new Float32Array(nx * ny * 3), tmp = [0, 0, 0];
    const wx0 = camX - w / 2 / s, wy0 = camY - h / 2 / s;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { fields(wx0 + i * ST, wy0 + j * ST, tmp); F.set(tmp, (j * nx + i) * 3); }
    for (let py = 0; py < h; py++) {
      const gv = py / cpx, gy = gv | 0, v = gv - gy;
      for (let px = 0; px < w; px++) {
        const gu = px / cpx, gx = gu | 0, u = gu - gx, o = (gy * nx + gx) * 3, o2 = o + nx * 3;
        let r = BASE[0], gg = BASE[1], b = BASE[2];
        for (let L = 0; L < 3; L++) {
          const A = F[o + L], B = F[o + 3 + L], Cc = F[o2 + L], D = F[o2 + 3 + L];
          const sv = (A + (B - A) * u) * (1 - v) + (Cc + (D - Cc) * u) * v;
          const du = (B - A) * (1 - v) + (D - Cc) * v, dv = (Cc - A) * (1 - u) + (D - B) * u, gl = Math.sqrt(du * du + dv * dv) / cpx;
          const dist = gl > 1e-9 ? sv / gl : sv > 0 ? 99 : -99; // signed distance in pixels
          let cov = dist + 0.5; if (cov <= 0) continue; if (cov > 1) cov = 1;
          const lay = LAY[L]; let rm = lay.w * s - dist + 0.5; rm = rm < 0 ? 0 : rm > 1 ? 1 : rm;
          r += (lay.f[0] + (lay.r[0] - lay.f[0]) * rm - r) * cov; gg += (lay.f[1] + (lay.r[1] - lay.f[1]) * rm - gg) * cov; b += (lay.f[2] + (lay.r[2] - lay.f[2]) * rm - b) * cov;
        }
        const q = (py * w + px) * 4; d[q] = r; d[q + 1] = gg; d[q + 2] = b; d[q + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    // flat vector decals, baked: grass tufts, 5-petal flowers, pebbles; colour depends on the region below
    g.setTransform(s, 0, 0, s, w / 2 - camX * s, h / 2 - camY * s); g.lineCap = 'round';
    for (let cy = Math.floor(wy0 / 12); cy <= (wy0 + h / s) / 12; cy++) for (let cx = Math.floor(wx0 / 12); cx <= (wx0 + w / s) / 12; cx++) {
      const hh = hashInt(cx, cy, 9001), r0 = (hh & 1023) / 1023, r1 = ((hh >>> 10) & 1023) / 1023, r2 = ((hh >>> 20) & 1023) / 1023;
      const x = (cx + r1) * 12, y = (cy + r2) * 12; fields(x, y, tmp);
      const m = tmp[2] > 0 ? 3 : tmp[1] > 0 ? 2 : tmp[0] > 0 ? 1 : 0;
      if (m === 3) { if (r0 < 0.12) { g.fillStyle = '#b9a588'; g.beginPath(); g.ellipse(x, y + 0.35, 2.2, 1.5, 0, 0, TAU); g.fill(); g.fillStyle = '#cdbfae'; g.beginPath(); g.ellipse(x, y, 1.9, 1.2, 0, 0, TAU); g.fill(); } continue; }
      if (r0 < 0.34) { // tuft: 3 curved blades, 0.8 wide
        const k = 0.9 + r1 * 0.4; g.strokeStyle = ['rgb(130,175,94)', 'rgb(98,150,74)', 'rgb(170,150,192)'][m]; g.lineWidth = 0.8; g.beginPath();
        g.moveTo(x - 0.5 * k, y); g.quadraticCurveTo(x - k, y - 1.4 * k, x - 2.1 * k, y - 2.3 * k); g.moveTo(x, y); g.quadraticCurveTo(x + 0.15 * k, y - 1.8 * k, x - 0.2 * k, y - 3.3 * k);
        g.moveTo(x + 0.5 * k, y); g.quadraticCurveTo(x + 1.1 * k, y - 1.3 * k, x + 2.1 * k, y - 2.1 * k); g.stroke();
      } else if (r0 < (m === 2 ? 0.7 : 0.4)) {
        g.fillStyle = (m === 2 ? ['#f3e9fb', '#a98bd4', '#f6bad3', '#a98bd4'] : ['#fbf6e8', '#fbf6e8', '#f8de6c', '#f4b3c8'])[(r2 * 4) | 0]; g.beginPath();
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - PI / 2, fx = x + Math.cos(a) * 0.9, fy = y + Math.sin(a) * 0.9; g.moveTo(fx + 0.68, fy); g.arc(fx, fy, 0.68, 0, TAU); }
        g.fill(); g.fillStyle = m === 2 ? '#f6d36a' : '#f2a23a'; g.beginPath(); g.arc(x, y, 0.52, 0, TAU); g.fill();
      }
    }
    GROUND = { key, c: cv };
    return cv;
  }

  /* ---- public drawers (world units; ctx already scaled so 1 unit = h/360 px) */
  const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
  /** Draws the hero with feet at (x, y). t = seconds, facing = 1 | -1. Hop cycle with squash on contact. */
  function drawHero(ctx, x, y, t, facing) {
    if (!SPR) sprites(3);
    const ph = t * 2.3, f = ph - Math.floor(ph), hop = Math.floor(ph), air = Math.sin(f * PI);
    const contact = Math.max(0, 1 - Math.min(f, 1 - f) * 6);
    const sy = (1 + 0.07 * air - 0.13 * contact) * 1.1, sx = (1 - 0.04 * air + 0.12 * contact) * 1.1;
    const frame = contact > 0.25 ? (hop & 1 ? 1 : 3) : 2;
    blit(ctx, SPR.jack[frame], x, y - air * 3.4 * 1.1, sx, sy, 0.07 * facing * air, facing);
  }
  /** Draws a typical enemy (turnip waddler) with feet at (x, y); flash 0..1 = white hit flash. */
  function drawEnemy(ctx, x, y, t, variant, facing, flash) {
    if (!SPR) sprites(3);
    const ph = t * 1.1 + (variant || 0) * 0.37, fr = Math.floor(ph * 4) & 3, sn = Math.sin(ph * TAU), up = Math.abs(sn);
    let sx = (1 + (1 - up) * 0.05) * 0.9, sy = (1 - (1 - up) * 0.06 + up * 0.03) * 0.9;
    if (flash) { sx *= 1 + 0.22 * flash; sy *= 1 - 0.18 * flash; }
    blit(ctx, SPR.creep[fr][(variant || 0) % 3], x, y - up * 1.3, sx, sy, sn * 0.1, facing || 1);
    if (flash) { ctx.globalAlpha = Math.min(0.85, flash * 1.3); blit(ctx, SPR.creepFlash, x, y - up * 1.3, sx, sy, sn * 0.1, facing || 1); ctx.globalAlpha = 1; }
  }
  function drawGhost(ctx, x, y, t, seed) {
    const b = Math.sin(t * 5.2 + seed * 7);
    blit(ctx, SPR.ghost[Math.floor(t * 7 + seed * 4) & 3], x, y - 4.5 - Math.sin(t * 2.6 + seed * 12) * 1.6, 1 + b * 0.04, 1 - b * 0.04, 0, -1);
  }
  function damageNumber(ctx, x, y, txt, crit) { // plum outline + plum drop, white or yellow→orange gradient fill
    const fs = crit ? 12.5 : 9; ctx.save(); ctx.font = fs + 'px "Lilita One", "Fredoka", "Arial Rounded MT Bold", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = fs * 0.3;
    ctx.strokeText(txt, x, y + fs * 0.09); ctx.fillStyle = OUT; ctx.fillText(txt, x, y + fs * 0.09); ctx.strokeText(txt, x, y);
    if (crit) { const g = ctx.createLinearGradient(0, y - fs * 0.45, 0, y + fs * 0.4); g.addColorStop(0, '#fff27a'); g.addColorStop(0.5, '#ffc93a'); g.addColorStop(1, '#ff8a2a'); ctx.fillStyle = g; } else ctx.fillStyle = '#fff';
    ctx.fillText(txt, x, y); ctx.restore();
  }
  function pill(ctx, x, y, w, h, r, fill) { // HUD panel: 4px plum border + solid 5px plum drop "lip"
    ctx.fillStyle = OUT; ctx.beginPath(); roundPoly(ctx, [[x - 4, y - 4], [x + w + 4, y - 4], [x + w + 4, y + h + 9], [x - 4, y + h + 9]], r + 4); ctx.fill();
    ctx.fillStyle = fill; ctx.beginPath(); roundPoly(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r); ctx.fill();
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, hero, enemies, an effect. */
  function draw(ctx, w, h, t) {
    const s = h / 360, camX = 260, camY = 40;
    sprites(Math.max(3, Math.min(6, Math.round(s * 1.25))));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.grass; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(ground(w, h, s, camX, camY), 0, 0);
    ctx.setTransform(s, 0, 0, s, w / 2, h / 2); // world space, hero at origin
    const hw = w / 2 / s;
    const actors = [
      { k: 'bush', x: -150, y: -110, v: 1 }, { k: 'bush', x: 120, y: 120, v: 0 }, { k: 'rock', x: -hw + 40, y: 70 }, { k: 'bush', x: hw - 50, y: -60, v: 1 },
      { k: 'hero', x: 0, y: 6 }, { k: 'enemy', x: 62, y: -10, v: 0, f: -1, fl: 0.5 }, { k: 'enemy', x: 92, y: 30, v: 1, f: -1 }, { k: 'enemy', x: -80, y: -40, v: 2, f: 1 },
      { k: 'enemy', x: 150, y: 70, v: 0, f: -1 }, { k: 'enemy', x: -120, y: 90, v: 1, f: 1 }, { k: 'ghost', x: -40, y: 85, seed: 0.3 }, { k: 'ghost', x: 170, y: -40, seed: 0.7 },
    ];
    ctx.beginPath(); // all ground shadows as ONE union, one translucent plum fill
    for (const a of actors) {
      const r = a.k === 'bush' ? [12, 3.8] : a.k === 'rock' ? [6.3, 2] : a.k === 'ghost' ? [5.8, 2.1] : a.k === 'hero' ? [9.2, 3.3] : [7.7, 2.8];
      ctx.moveTo(a.x + r[0], a.y); ctx.ellipse(a.x, a.y, r[0], r[1], 0, 0, TAU);
    }
    const gems = [[34, 40], [44, 52], [-30, -60], [24, -70], [-58, 30]];
    for (const g of gems) { ctx.moveTo(g[0] + 3.6, g[1]); ctx.ellipse(g[0], g[1], 3.6, 1.35, 0, 0, TAU); }
    ctx.fillStyle = 'rgba(50,30,72,0.2)'; ctx.fill();
    for (const g of gems) { const b = Math.sin(t * 5 + g[0]); blit(ctx, SPR.gem, g[0], g[1] - 1.6 - b * 1.1, 1 - b * 0.04, 1 + b * 0.05); }
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) {
      if (a.k === 'bush') { ctx.save(); ctx.translate(a.x, a.y); ctx.transform(1, 0, -Math.sin(t * 1.3 + a.x) * 0.035, 1, 0, 0); blit(ctx, SPR.bush[a.v], 0, 0, 1, 1); ctx.restore(); }
      else if (a.k === 'rock') blit(ctx, SPR.rock, a.x, a.y, 1, 1);
      else if (a.k === 'hero') drawHero(ctx, a.x, a.y, t, 1);
      else if (a.k === 'ghost') drawGhost(ctx, a.x, a.y, t, a.seed);
      else drawEnemy(ctx, a.x, a.y, t, a.v, a.f, a.fl ? a.fl * (0.6 + 0.4 * Math.sin(t * 9)) : 0);
    }
    // projectile: seed + white speed streak, flying right
    const px = 18 + ((t * 120) % 40), py = -12;
    const sg = ctx.createLinearGradient(px - 3, 0, px - 17, 0); sg.addColorStop(0, 'rgba(255,255,255,0.95)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = sg; ctx.lineCap = 'round'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px - 3.5, py); ctx.lineTo(px - 16.5, py); ctx.stroke();
    ctx.lineWidth = 0.75; ctx.beginPath(); ctx.moveTo(px - 4.5, py - 2); ctx.lineTo(px - 12.5, py - 2); ctx.moveTo(px - 4.5, py + 2); ctx.lineTo(px - 11.5, py + 2); ctx.stroke();
    blit(ctx, SPR.seed, px, py, 1, 0.55 + 0.45 * Math.abs(Math.cos(t * 14)), 0);
    // hit star + damage numbers on the flashing enemy, death puff burst + stars on the right
    blit(ctx, SPR.hit, 56, -21, 0.72, 0.72, t * 3);
    damageNumber(ctx, 66, -40 - (t % 1) * 4, '34', true); damageNumber(ctx, 104, 2, '17', false);
    const q = (t * 0.8 + 0.3) % 1;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, d = q * 16, sc = (q < 0.2 ? easeOutBack(q / 0.2) : 1 - Math.pow((q - 0.2) / 0.8, 2)) * 0.9;
      if (sc > 0.02) blit(ctx, SPR.puff, 120 + Math.cos(a) * (3 + d), 40 - 10 + Math.sin(a) * (1.2 + d * 0.55) - q * 7, sc, sc, 0); }
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; blit(ctx, SPR.star, 120 + Math.cos(a) * q * 30, 28 + Math.sin(a) * q * 18 - Math.sin(q * PI) * 14, 0.72, 0.72, q * 6); }
    // HUD in screen px: XP bar, clock pill, Lilita One numbers
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const u = h / 540;
    ctx.save(); ctx.scale(u, u); const W = w / u;
    pill(ctx, 18, 12, W - 36, 14, 8, '#563a5e');
    const xg = ctx.createLinearGradient(0, 12, 0, 26); xg.addColorStop(0, '#9af7d8'); xg.addColorStop(0.5, '#45d6ad'); xg.addColorStop(1, '#2cb892');
    ctx.fillStyle = xg; ctx.beginPath(); roundPoly(ctx, [[18, 12], [18 + (W - 36) * 0.62, 12], [18 + (W - 36) * 0.62, 26], [18, 26]], 7); ctx.fill();
    pill(ctx, W / 2 - 52, 40, 104, 44, 14, C.panel);
    ctx.font = '28px "Lilita One", "Fredoka", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.strokeText('22:09', W / 2, 64); ctx.strokeText('22:09', W / 2, 61); ctx.fillStyle = '#ff8a2a'; ctx.fillText('22:09', W / 2, 61);
    ctx.font = '600 8px "Fredoka", sans-serif'; ctx.fillStyle = '#8a6280'; ctx.fillText('UNTIL MIDNIGHT', W / 2, 78);
    ctx.restore();
  }

  const Starter = { id: 'cartoon', name: 'Brotato Cartoon', palette: PALETTE, fonts: ['Lilita One', 'Fredoka:wght@400;500;600;700'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['cartoon'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
