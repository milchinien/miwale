/* ============================================================================
   Brotato-Cartoon (id: cartoon) – bold, clean HD vector cartoon.
   Everything is drawn with ONE outline language: thick deep-plum outer outline,
   flat fill + exactly one cel-shade step (shifted-silhouette crescent) + one glossy
   highlight. Sprites are pre-rendered in init() (several frames, both facings,
   white-flash copies) and squashed/stretched at draw time.
   Ground: flat-colour play-mat – smooth noise fields evaluated on a coarse grid,
   per-pixel signed distance (value / gradient) gives crisp anti-aliased region
   edges with an inner rim band; flat vector decals on top.
   ========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ------------------------------------------------------------------ palette */
  const OUT = '#3a2240';          // the one outline colour (deep plum)
  const OL = 1.15;                // outer outline weight (world units)
  const IL = 0.55;                // inner separation lines
  const FLASH_SH = '#efe6f6';
  const C = {
    pump: '#ff952b', pumpSh: '#ea681c', pumpRib: '#ec7a22', carve: '#8a3214', glow: '#ffd43f', glowHi: '#fff3b0',
    propPump: '#f59a3a', propPumpSh: '#d96f26',
    coat: '#2f9c95', coatSh: '#22736f', scarf: '#8ad04c', scarfSh: '#5ea83a', scarfHi: '#c3ec8c',
    leg: '#41703f', legSh: '#2f5431', shoe: '#6b3d2c', shoeSh: '#4c291f',
    stem: '#7f9b3b', stemSh: '#5d7a2a', leaf: '#86cf4c', leafSh: '#59a33a',
    ghost: '#f6f8ff', ghostSh: '#c3d0ef', tongue: '#ff7f9e',
    root: '#efd49e', rootSh: '#cfac70',
    cream: '#fff1c8', creamSh: '#e6c68a',
    wood: '#d4a066', woodSh: '#a9743f', bark: '#a56f48', barkSh: '#7c4e33',
    band: '#f6e6c4', bandSh: '#d8bf8d',
    ochre: '#efc96f', ochreSh: '#cf9f4c', cTop: '#7b3f99', cTopSh: '#58297a',
  };
  const JACK_SCALE = 1.1, CREEP_SCALE = 0.9;
  let K = 3; // sprite resolution: canvas px per world unit (set in init from display size)
  const SPR = {};

  /* ================================================================ painter
     A sprite is a function fn(P) that declares parts back-to-front. It is run twice:
     'outline' pass (every part stroked + filled in OUT -> one clean silhouette outline),
     then 'fill' (or 'flash') pass: base fill, cel crescent, details, gloss.            */
  function Painter(ctx, mode, ol) { this.ctx = ctx; this.mode = mode; this.ol = ol; }
  Painter.prototype.part = function (shape, fill, o) {
    o = o || {};
    const ctx = this.ctx;
    if (this.mode === 'outline') {
      if (o.noOutline) return;
      ctx.beginPath(); shape(ctx);
      ctx.lineWidth = (o.ol != null ? o.ol : this.ol) * 2;
      ctx.strokeStyle = OUT; ctx.fillStyle = OUT;
      ctx.stroke(); ctx.fill();
      return;
    }
    const flash = this.mode === 'flash';
    ctx.save();
    ctx.beginPath(); shape(ctx);
    if (o.inner) { ctx.lineWidth = o.inner * 2; ctx.strokeStyle = OUT; ctx.stroke(); }
    ctx.clip();
    if (o.sh) {
      this.paint(fill, o, true, flash);
      ctx.save();
      ctx.save(); ctx.translate(o.sh[0], o.sh[1]); ctx.beginPath(); shape(ctx); ctx.restore();
      ctx.clip();
      this.paint(fill, o, false, flash);
      ctx.restore();
    } else this.paint(fill, o, false, flash);
    if (!flash) {
      if (o.detail) { ctx.save(); o.detail(ctx); ctx.restore(); }
      if (o.hi) gloss(ctx, o.hi, o.hiA);
      if (o.hi2) { ctx.globalAlpha = o.hiA || 0.92; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.hi2[0], o.hi2[1], o.hi2[2], 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  };
  Painter.prototype.paint = function (fill, o, shade, flash) {
    const ctx = this.ctx;
    if (flash) { ctx.fillStyle = shade ? FLASH_SH : '#ffffff'; ctx.fillRect(-500, -500, 1000, 1000); return; }
    if (typeof fill === 'function') { fill(ctx, shade); return; }
    ctx.fillStyle = shade ? o.shade || fill : fill;
    ctx.fillRect(-500, -500, 1000, 1000);
  };
  Painter.prototype.detail = function (fn, inFlash) {
    if (this.mode === 'outline') return;
    if (this.mode === 'flash' && !inFlash) return;
    const c = this.ctx;
    c.save(); fn(c, this.mode === 'flash'); c.restore();
  };
  function gloss(ctx, h, a) {
    ctx.globalAlpha = a || 0.92;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(h[0], h[1], h[2], h[3], h[4] || 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* ----------------------------------------------------------- shape helpers */
  const E = (x, y, rx, ry, rot) => (c) => {
    rot = rot || 0;
    c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
    c.ellipse(x, y, rx, ry, rot, 0, TAU);
  };
  const CAP = (x1, y1, x2, y2, r) => (c) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r);
    c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5);
    c.arc(x2, y2, r, a - PI / 2, a + PI / 2);
    c.closePath();
  };
  function blobPath(c, pts, ten) {
    ten = ten === undefined ? 1 : ten;
    const n = pts.length;
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      c.bezierCurveTo(
        p1[0] + ((p2[0] - p0[0]) / 6) * ten, p1[1] + ((p2[1] - p0[1]) / 6) * ten,
        p2[0] - ((p3[0] - p1[0]) / 6) * ten, p2[1] - ((p3[1] - p1[1]) / 6) * ten, p2[0], p2[1]);
    }
    c.closePath();
  }
  function roundPoly(c, pts, r) {
    const n = pts.length;
    const a = pts[n - 1], b = pts[0];
    c.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      c.arcTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, r);
    }
    c.closePath();
  }
  function rrect(c, x, y, w, h, r) { roundPoly(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r); }
  function rrectRot(c, cx, cy, w, h, ang, r) {
    const co = Math.cos(ang), si = Math.sin(ang);
    const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map((p) => [cx + p[0] * co - p[1] * si, cy + p[0] * si + p[1] * co]);
    roundPoly(c, pts, r);
  }
  function starPts(n, ro, ri, cx, cy, rot) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * TAU, r = i & 1 ? ri : ro;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
  }
  function pumpkinPath(c, cx, cy, rx, ry) {
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * TAU;
      const co = Math.cos(th), si = Math.sin(th);
      const x = Math.sign(co) * Math.pow(Math.abs(co), 0.85) * rx;
      let y = Math.sign(si) * Math.pow(Math.abs(si), 0.92) * ry;
      const top = Math.exp(-Math.pow((th - PI * 1.5) / 0.3, 2));
      const bot = Math.exp(-Math.pow((th - PI * 0.5) / 0.26, 2));
      y *= 1 - 0.15 * top - 0.07 * bot;
      if (i) c.lineTo(cx + x, cy + y); else c.moveTo(cx + x, cy + y);
    }
    c.closePath();
  }
  function ribs(c, cx, cy, rx, ry, col, lw) {
    c.strokeStyle = col; c.lineWidth = lw;
    for (const k of [-0.7, -0.3, 0.3, 0.7]) {
      c.beginPath();
      c.moveTo(cx + k * rx * 0.2, cy - ry * 0.9);
      c.quadraticCurveTo(cx + k * rx * 1.2, cy, cx + k * rx * 0.2, cy + ry * 0.94);
      c.stroke();
    }
  }
  function turnipPath(c, cx, top, bottom, w) {
    const h = bottom - top;
    c.moveTo(cx, top);
    c.bezierCurveTo(cx + w * 0.42, top + h * 0.02, cx + w, top + h * 0.22, cx + w, top + h * 0.56);
    c.bezierCurveTo(cx + w, top + h * 0.86, cx + w * 0.55, bottom, cx, bottom);
    c.bezierCurveTo(cx - w * 0.55, bottom, cx - w, top + h * 0.86, cx - w, top + h * 0.56);
    c.bezierCurveTo(cx - w, top + h * 0.22, cx - w * 0.42, top + h * 0.02, cx, top);
    c.closePath();
  }
  function leafPath(c, bx, by, a, len, wid) {
    const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
    const tx = bx + dx * len, ty = by + dy * len;
    c.moveTo(bx, by);
    c.bezierCurveTo(bx + dx * len * 0.22 + nx * wid, by + dy * len * 0.22 + ny * wid, tx - dx * len * 0.3 + nx * wid * 0.75, ty - dy * len * 0.3 + ny * wid * 0.75, tx, ty);
    c.bezierCurveTo(tx - dx * len * 0.3 - nx * wid * 0.75, ty - dy * len * 0.3 - ny * wid * 0.75, bx + dx * len * 0.22 - nx * wid, by + dy * len * 0.22 - ny * wid, bx, by);
    c.closePath();
  }
  const midrib = (bx, by, a, len, col, lw) => (c) => {
    c.strokeStyle = col; c.lineWidth = lw || 0.45;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.sin(a) * len * 0.78, by - Math.cos(a) * len * 0.78); c.stroke();
  };
  /** Two-tone turnip colouring with a wavy boundary (used as a part fill function). */
  const turnipFill = (col, waveY, amp, freq) => (c, sh) => {
    c.fillStyle = sh ? col.botSh : col.bot; c.fillRect(-500, -500, 1000, 1000);
    c.fillStyle = sh ? col.topSh : col.top;
    c.beginPath(); c.moveTo(-60, -120); c.lineTo(60, -120); c.lineTo(60, waveY);
    for (let x = 60; x >= -60; x -= 0.5) c.lineTo(x, waveY + amp * Math.sin(x * freq + 0.6));
    c.closePath(); c.fill();
  };
  /** Carved hole: dark rim + glowing inside shifted down (shows carving thickness). */
  function carve(c, pathFn, dx, dy) {
    c.save();
    c.beginPath(); pathFn(c); c.fillStyle = C.carve; c.fill();
    c.clip();
    c.translate(dx === undefined ? 0.2 : dx, dy === undefined ? 0.7 : dy);
    c.beginPath(); pathFn(c); c.fillStyle = C.glow; c.fill();
    c.restore();
  }

  /* --------------------------------------------------------- sprite builder */
  function build(box, fn, mode, ol) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'outline', ol || OL));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, mode || 'fill', ol || OL));
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy }; }
  function set4(box, fn, post) {
    const n = build(box, fn, 'fill'), f = build(box, fn, 'flash');
    if (post) { post(n, box); post(f, box); }
    return { n, f, nl: flipS(n), fl: flipS(f) };
  }
  function withFlip(s) { return { n: s, l: flipS(s) }; }

  /* ============================================================ characters */
  const sstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  /** One foot over a gait cycle u: stance (planted, slides back) then swing (lifted, eases forward).
      Returns [x in -1..1 (+1 = forward), lift 0..1, toe pitch in rad]. */
  function footCycle(u) {
    u -= Math.floor(u);
    if (u < 0.5) return [1 - u * 4, 0, 0];
    const w = (u - 0.5) * 2;
    return [-1 + 2 * sstep(w), Math.sin(PI * Math.pow(w, 0.8)), w < 0.5 ? -0.4 * Math.sin(w * TAU) : 0.22 * Math.sin((w - 0.5) * TAU)];
  }
  /** Body height over one step s: contact 0 -> down +1 -> up -1.6 (passing / up) -> contact. + = lower. */
  function stepBob(s) {
    s -= Math.floor(s);
    if (s < 0.14) return sstep(s / 0.14);
    if (s < 0.62) return 1 - 2.6 * sstep((s - 0.14) / 0.48);
    return -1.6 + 1.6 * sstep((s - 0.62) / 0.38);
  }
  /** Per-actor blink: ~110 ms every 2.7–5 s, some actors double-blink. */
  function blinking(rt, seed) {
    const per = 2.7 + seed * 2.3, l = (rt + seed * 17.3) % per;
    return l < 0.11 || (seed > 0.55 && l > 0.24 && l < 0.34);
  }

  /* ---- face kit (drawn inside the fill pass) ---- */
  function eyeBall(c, x, y, rx, ry, px, py, pr) {
    c.lineWidth = IL * 1.3; c.strokeStyle = OUT; c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = OUT; c.beginPath(); c.arc(x + px, y + py, pr, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x + px - pr * 0.35, y + py - pr * 0.4, pr * 0.32, 0, TAU); c.fill();
  }
  function eyeShut(c, x, y, r) { // closed lid: a soft downward arc
    c.strokeStyle = OUT; c.lineWidth = 1.0; c.lineCap = 'round';
    c.beginPath(); c.arc(x, y - r * 0.55, r, PI * 0.18, PI * 0.82); c.stroke();
  }
  function eyeHappy(c, x, y, r) { // closed happy eye: an upward arc
    c.strokeStyle = OUT; c.lineWidth = 1.0; c.lineCap = 'round';
    c.beginPath(); c.arc(x, y + r * 0.6, r, PI * 1.18, PI * 1.82); c.stroke();
  }
  function eyeSquint(c, x, y, r, dir) { // '>' (dir 1) or '<' (dir -1): squeezed shut
    c.strokeStyle = OUT; c.lineWidth = 1.05; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - r * dir, y - r * 0.8); c.lineTo(x + r * 0.7 * dir, y); c.lineTo(x - r * dir, y + r * 0.8); c.stroke();
  }
  function eyeX(c, x, y, r) {
    c.strokeStyle = OUT; c.lineWidth = 1.0; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r, y + r); c.moveTo(x + r, y - r); c.lineTo(x - r, y + r); c.stroke();
  }
  function mouthO(c, x, y, rx, ry) {
    c.save(); c.fillStyle = OUT; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); c.clip();
    c.fillStyle = C.tongue; c.beginPath(); c.ellipse(x + 0.3, y + ry * 0.8, rx * 0.85, ry * 0.55, 0, 0, TAU); c.fill(); c.restore();
  }
  function mouthDead(c, x, y, w) { // wobbly line with the tongue lolling out
    c.fillStyle = C.tongue; c.strokeStyle = OUT; c.lineWidth = 0.55;
    c.beginPath(); c.ellipse(x + w * 0.25, y + 1.1, 1.15, 1.45, 0.25, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(58,34,64,.45)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x + w * 0.25, y + 0.4); c.lineTo(x + w * 0.3, y + 1.9); c.stroke();
    c.strokeStyle = OUT; c.lineWidth = 0.95; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.5, y - 1.0, x, y); c.quadraticCurveTo(x + w * 0.5, y + 1.0, x + w, y); c.stroke();
  }
  function tooth(c, x, y, w, h, up) {
    c.fillStyle = '#fff8ea'; c.strokeStyle = OUT; c.lineWidth = 0.45;
    c.beginPath(); rrect(c, x - w / 2, up ? y - h : y, w, h, 0.35); c.fill(); c.stroke();
  }
  /** Thick stroke part (roots, tails): OUT in the outline pass, fill + lit core in the fill pass. */
  Painter.prototype.line = function (path, w, col, sh) {
    const c = this.ctx;
    if (this.mode === 'outline') { c.beginPath(); path(c); c.lineWidth = w + this.ol * 2; c.strokeStyle = OUT; c.stroke(); return; }
    const flash = this.mode === 'flash';
    c.beginPath(); path(c); c.lineWidth = w; c.strokeStyle = flash ? FLASH_SH : sh || col; c.stroke();
    if (!sh) return;
    c.save(); c.translate(-w * 0.16, -w * 0.2); c.beginPath(); path(c); c.lineWidth = w * 0.55; c.strokeStyle = flash ? '#fff' : col; c.stroke(); c.restore();
  };

  /* ---- main character: pre-rendered head parts, live-drawn body (see drawHero) ---- */
  const HC = [0.1, -8.6, 11.2, 9.1]; // pumpkin centre relative to the neck pivot + radii
  function heroHeadParts(P, ex) {
    const cx = HC[0], cy = HC[1], rx = HC[2], ry = HC[3];
    P.part((c) => pumpkinPath(c, cx, cy, rx, ry), C.pump, {
      shade: C.pumpSh, sh: [-1.9, -1.6],
      detail(c) { ribs(c, cx, cy, rx, ry, C.pumpRib, 0.6); },
      hi: [cx - 6.3, cy - 4.3, 2.5, 1.3, -0.6], hi2: [cx - 3.5, cy - 6.5, 0.6],
    });
    P.detail((c) => heroFace(c, cx + 2.2, cy, ex));
  }
  function heroFace(c, fx, cy, ex) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    const grin = (k) => { k.moveTo(fx - 7.4, cy + 2.3); k.quadraticCurveTo(fx - 0.6, cy + 12.4, fx + 6.6, cy + 1.9); k.quadraticCurveTo(fx - 0.6, cy + 5.4, fx - 7.4, cy + 2.3); k.closePath(); };
    const wide = (k) => { k.moveTo(fx - 7.8, cy + 1.6); k.quadraticCurveTo(fx - 0.6, cy + 14.2, fx + 7.0, cy + 1.2); k.quadraticCurveTo(fx - 0.6, cy + 3.6, fx - 7.8, cy + 1.6); k.closePath(); };
    const teeth = (path) => {
      c.save(); c.beginPath(); path(c); c.clip(); c.fillStyle = C.pump;
      c.beginPath(); rrect(c, fx - 3.6, cy + 2.0, 2.2, 2.9, 0.4); rrect(c, fx + 1.3, cy + 1.8, 2.2, 2.8, 0.4); rrect(c, fx - 1.2, cy + 5.6, 2.1, 3.4, 0.4); c.fill();
      c.restore();
    };
    const arch = (x, y, w, h) => (k) => { k.moveTo(x - w, y); k.quadraticCurveTo(x, y - h * 2, x + w, y); k.quadraticCurveTo(x, y - h * 0.8, x - w, y); k.closePath(); };
    const core = () => { c.fillStyle = C.glowHi; c.beginPath(); c.ellipse(fx - 3.7, cy - 1.0, 1.25, 0.8, 0, 0, TAU); c.ellipse(fx + 3.7, cy - 1.0, 1.05, 0.75, 0, 0, TAU); c.fill(); };
    if (ex === 'n') {
      carve(c, (k) => roundPoly(k, [[fx - 3.9, cy - 5.9], [fx - 7.0, cy + 0.2], [fx - 0.9, cy + 0.2]], 0.8), 0.25, 0.85);
      carve(c, (k) => roundPoly(k, [[fx + 3.6, cy - 5.6], [fx + 1.0, cy + 0.1], [fx + 6.1, cy + 0.1]], 0.75), 0.25, 0.85);
      core();
      carve(c, grin, 0.2, 0.85); teeth(grin);
    } else if (ex === 'b' || ex === 'j') { // blink / joy: carved eyes squeezed into happy arches
      carve(c, arch(fx - 3.8, cy - 0.6, 3.1, 1.7), 0.15, 0.6);
      carve(c, arch(fx + 3.5, cy - 0.5, 2.7, 1.55), 0.15, 0.6);
      if (ex === 'j') carve(c, wide, 0.2, 0.9);
      else { carve(c, grin, 0.2, 0.85); teeth(grin); }
    } else if (ex === 'e') { // dash effort: narrowed, slanted eyes + gritted grin
      carve(c, (k) => roundPoly(k, [[fx - 6.9, cy - 3.8], [fx - 1.1, cy - 1.3], [fx - 1.3, cy + 0.5], [fx - 6.5, cy + 0.5]], 0.6), 0.2, 0.7);
      carve(c, (k) => roundPoly(k, [[fx + 6.0, cy - 3.6], [fx + 0.9, cy - 1.2], [fx + 1.1, cy + 0.4], [fx + 5.7, cy + 0.4]], 0.6), 0.2, 0.7);
      c.fillStyle = C.glowHi; c.beginPath(); c.ellipse(fx - 3.8, cy - 0.3, 1.2, 0.5, 0, 0, TAU); c.ellipse(fx + 3.4, cy - 0.3, 1.0, 0.45, 0, 0, TAU); c.fill();
      carve(c, wide, 0.2, 0.85); teeth(wide);
    } else { // hurt
      const chev = (pts) => {
        c.strokeStyle = C.carve; c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke();
        c.strokeStyle = C.glow; c.lineWidth = 0.75;
        c.beginPath(); c.moveTo(pts[0][0] + 0.1, pts[0][1] + 0.3); c.lineTo(pts[1][0] + 0.1, pts[1][1] + 0.3); c.lineTo(pts[2][0] + 0.1, pts[2][1] + 0.3); c.stroke();
      };
      chev([[fx - 5.8, cy - 4.0], [fx - 2.4, cy - 2.1], [fx - 5.8, cy - 0.2]]);
      chev([[fx + 5.3, cy - 4.0], [fx + 2.0, cy - 2.1], [fx + 5.3, cy - 0.2]]);
      carve(c, (k) => { k.ellipse(fx - 0.3, cy + 4.6, 2.4, 2.8, 0, 0, TAU); }, 0.15, 0.7);
    }
  }
  // stem + leaf sit on a spring pivot at the top of the pumpkin (relative to the neck: -0.2, -16.2)
  function heroStemParts(P) { P.part(CAP(0, 0.8, 1.1, -3.4, 1.3), C.stem, { shade: C.stemSh, sh: [-0.45, -0.3] }); }
  function heroLeafParts(P) {
    P.part((c) => leafPath(c, -0.4, -1.0, -1.2, 5.6, 2.1), C.leaf, { shade: C.leafSh, sh: [-0.3, -0.5], detail: midrib(-0.4, -1.0, -1.2, 5.6, C.leafSh) });
    P.detail((c) => { c.strokeStyle = OUT; c.lineWidth = 0.6; c.beginPath(); c.arc(3.0, -2.2, 1.25, PI * 0.9, PI * 2.6); c.stroke(); });
  }

  /* ---- small creature: three designed root variants (turnip, radish, beet) ---- */
  const CREEP = [
    { top: '#9b5cd0', topSh: '#7241aa', bot: '#f8eacb', botSh: '#e0c595', chunk: 0 }, // turnip grump
    { top: '#e0567c', topSh: '#b03a63', bot: '#fdf1e6', botSh: '#e9c8bb', chunk: 8 }, // radish sneak
    { top: '#6f5bd0', topSh: '#4d3ea6', bot: '#f3ecc2', botSh: '#dacd92', chunk: 9 }, // beet brute
  ];
  const CV = [{ hx: 3.0, fr: 1.45, stride: 2.2, lift: 1.8 }, { hx: 2.5, fr: 1.15, stride: 2.4, lift: 2.0 }, { hx: 4.3, fr: 1.75, stride: 1.8, lift: 1.4 }];
  const walkPose = (pose) => pose === 'walk' || pose === 'blink';
  function creeperFeet(P, v, fr, pose) {
    const d = CV[v];
    let a, b;
    if (pose === 'hurt') { a = [d.hx + 1.4, -1.7]; b = [-d.hx - 1.6, -2.9]; }
    else if (pose === 'dead') { a = [d.hx + 2.0, -3.4]; b = [-d.hx - 2.0, -3.4]; }
    else {
      const A = footCycle(fr / 8), B = footCycle(fr / 8 + 0.5);
      a = [d.hx + A[0] * d.stride, -1.1 - A[1] * d.lift]; b = [-d.hx + B[0] * d.stride, -1.1 - B[1] * d.lift];
    }
    P.part(CAP(-d.hx, -4.8, b[0], b[1], d.fr), C.rootSh, { shade: '#b69457', sh: [-0.4, -0.4] }); // far foot, one shade darker
    P.part(CAP(d.hx, -4.8, a[0], a[1], d.fr), C.root, { shade: C.rootSh, sh: [-0.4, -0.4] });
  }
  /** Leaf sway: lags the gait (overlapping action); flung back on a hit. */
  function leafSway(fr, pose, i) {
    if (pose === 'hurt') return -0.35 - 0.08 * i;
    if (!walkPose(pose)) return 0;
    return 0.13 * Math.sin(TAU * (fr / 8 - 0.18 - 0.07 * i));
  }
  const leafBounce = (fr, pose) => (walkPose(pose) ? 1 + 0.06 * Math.sin(TAU * (fr / 4 - 0.25)) : pose === 'hurt' ? 1.12 : 0.92);
  function sproutLeaf(P, bx, by, a, len, wid, fc, sc) {
    P.part((c) => leafPath(c, bx, by, a, len, wid), fc || C.leaf, { shade: sc || C.leafSh, sh: [-0.6, -0.6], detail: midrib(bx, by, a, len, sc || C.leafSh) });
  }
  const radishPath = (c) => {
    c.moveTo(0, -23.4);
    c.bezierCurveTo(5.6, -23.4, 9.2, -19.6, 9.2, -14.6);
    c.bezierCurveTo(9.2, -8.4, 5.0, -3.8, 0.6, -2.7);
    c.bezierCurveTo(-4.6, -3.6, -9.0, -8.2, -9.0, -14.4);
    c.bezierCurveTo(-9.0, -19.6, -5.4, -23.4, 0, -23.4);
    c.closePath();
  };
  function creeperParts(P, v, fr, pose) {
    const col = CREEP[v], lb = leafBounce(fr, pose), hurt = pose === 'hurt';
    const j = walkPose(pose) ? [0, 0.15, 0.25, 0.15, 0, -0.1, -0.16, -0.1][fr] : 0;
    if (v === 0) { // turnip grump: round body, three-leaf crown, angry brows
      const L = pose === 'dead' ? [[-1.7, 7.4, 2.5], [1.6, 7.2, 2.5], [-0.5, 8.8, 2.9]] : [[-0.85, 8.2, 2.6], [0.8, 8.0, 2.6], [-0.02, 10.2, 3.0]];
      L.forEach((l, i) => sproutLeaf(P, 0.3, -19.4, l[0] * (hurt ? 1.35 : 1) + leafSway(fr, pose, i), l[1] * lb, l[2]));
      creeperFeet(P, 0, fr, pose);
      P.part((c) => turnipPath(c, 0, -21.6, -2.6, 10.4), turnipFill(col, -10.8, 0.8, 0.9), { sh: [-1.8, -1.5], hi: [-5.2, -16.2, 2.2, 1.2, -0.7], hi2: [-2.7, -18.4, 0.55] });
      P.detail((c) => {
        const brows = (worry) => {
          c.strokeStyle = OUT; c.lineWidth = 1.35; c.lineCap = 'round'; c.beginPath();
          if (worry) { c.moveTo(-1.6, -16.6); c.lineTo(2.8, -18.0); c.moveTo(4.8, -18.0); c.lineTo(8.8, -16.6); }
          else { c.moveTo(-1.8, -17.6); c.lineTo(3.0, -15.6); c.moveTo(4.6, -15.5); c.lineTo(9.0, -17.3); }
          c.stroke();
        };
        if (pose === 'walk') { eyeBall(c, 1.0, -13.4, 2.5, 2.8, 0.8 + j, 0.5, 1.25); eyeBall(c, 6.4, -13.2, 2.3, 2.7, 0.7 + j, 0.5, 1.2); }
        else if (pose === 'blink') { eyeShut(c, 1.0, -13.0, 2.2); eyeShut(c, 6.4, -12.8, 2.0); }
        else if (hurt) { eyeSquint(c, 1.2, -13.2, 1.9, 1); eyeSquint(c, 6.2, -13.0, 1.8, -1); }
        else { eyeX(c, 1.2, -13.2, 1.7); eyeX(c, 6.3, -13.0, 1.6); }
        brows(hurt || pose === 'dead');
        if (hurt) mouthO(c, 4.0, -6.9, 1.9, 2.3);
        else if (pose === 'dead') mouthDead(c, 4.0, -6.8, 2.3);
        else { c.lineWidth = 0.9; c.beginPath(); c.arc(4.0, -6.2, 2.1, PI * 1.18, PI * 1.82); c.stroke(); }
      });
    } else if (v === 1) { // radish sneak: tall teardrop, one big curly sprout, rat-tail root, sly lidded eyes
      const sw = walkPose(pose) ? Math.sin(TAU * (fr / 8 - 0.3)) : 0;
      const big = pose === 'dead' ? 1.5 : 0.35 + leafSway(fr, pose, 0) * 1.3 - (hurt ? 0.25 : 0);
      const sml = pose === 'dead' ? -1.6 : -0.75 + leafSway(fr, pose, 2) * 1.2 - (hurt ? 0.4 : 0);
      sproutLeaf(P, -0.4, -22.6, sml, 6.6 * lb, 2.3);
      sproutLeaf(P, 0.4, -22.6, big, 11.6 * lb, 3.8);
      P.line((c) => { c.moveTo(-5.0, -5.4); c.quadraticCurveTo(-9.4, -6.2 + sw * 0.6, -10.6, -3.4 + sw * 0.5); c.quadraticCurveTo(-10.9, -1.2, -9.0, -1.5 + sw * 0.3); }, 1.5, col.bot, col.botSh);
      creeperFeet(P, 1, fr, pose);
      P.part(radishPath, turnipFill(col, -8.6, 0.7, 1.1), { sh: [-1.7, -1.5], hi: [-4.8, -18.2, 2.0, 1.1, -0.7], hi2: [-2.4, -20.4, 0.5] });
      P.detail((c) => {
        const lidded = (x, y, rx, ry) => {
          c.save(); c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.clip();
          c.fillStyle = OUT; c.beginPath(); c.arc(x + 0.9, y + 0.7, 1.1, 0, TAU); c.fill();
          c.fillStyle = col.top; c.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry + 0.6);
          c.strokeStyle = OUT; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - rx, y - 0.4); c.lineTo(x + rx, y - 0.4 + 0.5); c.stroke();
          c.restore();
          c.strokeStyle = OUT; c.lineWidth = IL * 1.3; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.stroke();
        };
        if (pose === 'walk') { lidded(1.4, -14.6, 2.3, 2.5); lidded(6.3, -14.4, 2.1, 2.4); }
        else if (pose === 'blink') { eyeShut(c, 1.4, -14.2, 2.0); eyeShut(c, 6.3, -14.0, 1.9); }
        else if (hurt) { eyeBall(c, 1.4, -14.8, 2.4, 2.7, 0.2, 0, 0.7); eyeBall(c, 6.3, -14.6, 2.2, 2.6, 0.2, 0, 0.65); }
        else { eyeX(c, 1.4, -14.4, 1.6); eyeX(c, 6.3, -14.2, 1.5); }
        c.strokeStyle = OUT; c.lineCap = 'round';
        if (hurt) mouthO(c, 4.6, -8.4, 1.7, 2.0);
        else if (pose === 'dead') mouthDead(c, 4.6, -8.6, 2.2);
        else {
          tooth(c, 5.4, -8.65, 1.2, 1.3, false);
          c.lineWidth = 0.95; c.beginPath(); c.moveTo(2.3, -8.8); c.quadraticCurveTo(5.0, -7.9 + j, 7.6, -10.0); c.stroke();
        }
      });
    } else { // beet brute: squat and wide, two floppy ear-leaves, unibrow, underbite
      const ear = (i) => (pose === 'dead' ? (i ? 1.7 : -1.7) : (i ? 0.55 : -0.5) * (hurt ? 1.5 : 1) + (walkPose(pose) ? 0.18 * Math.sin(TAU * (fr / 8 - 0.2) + i * PI) : hurt ? -0.3 : 0));
      sproutLeaf(P, -0.2, -17.6, ear(0), 10.5 * lb, 2.5);
      sproutLeaf(P, 0.9, -17.6, ear(1), 9.8 * lb, 2.4);
      creeperFeet(P, 2, fr, pose);
      P.part((c) => turnipPath(c, 0, -18.4, -2.6, 12.2), turnipFill(col, -8.8, 0.9, 0.7), { sh: [-2.0, -1.4], hi: [-6.6, -14.0, 2.4, 1.1, -0.6], hi2: [-3.6, -15.8, 0.55] });
      P.detail((c) => {
        if (pose === 'walk') { eyeBall(c, 2.4, -11.8, 1.8, 2.0, 0.6 + j, 0.3, 0.95); eyeBall(c, 6.2, -11.7, 1.7, 1.9, 0.55 + j, 0.3, 0.9); }
        else if (pose === 'blink') { eyeShut(c, 2.4, -11.5, 1.6); eyeShut(c, 6.2, -11.4, 1.5); }
        else if (hurt) { eyeSquint(c, 2.6, -11.6, 1.5, 1); eyeSquint(c, 6.0, -11.5, 1.4, -1); }
        else { eyeX(c, 2.5, -11.6, 1.3); eyeX(c, 6.1, -11.5, 1.2); }
        c.strokeStyle = OUT; c.lineCap = 'round'; c.lineWidth = 1.55;
        c.beginPath(); c.moveTo(0.2, -14.6 - (hurt ? 0.8 : 0)); c.quadraticCurveTo(4.3, hurt ? -15.6 : -13.0, 8.4, -14.4 - (hurt ? 0.8 : 0)); c.stroke();
        if (hurt) mouthO(c, 4.4, -6.4, 2.0, 2.0);
        else if (pose === 'dead') mouthDead(c, 4.4, -6.6, 2.6);
        else {
          c.lineWidth = 0.95; c.beginPath(); c.moveTo(1.8, -6.5); c.quadraticCurveTo(4.4, -7.6 - j, 7.4, -6.7); c.stroke();
          tooth(c, 3.4, -6.95, 1.1, 1.4, true); tooth(c, 5.6, -6.95, 1.1, 1.3, true);
        }
      });
    }
  }

  /* ---- fast creature: two designed ghost variants ---- */
  function ghostPath(c, ph) { // classic: dome, three-scallop hem, curling tail
    c.moveTo(-7.8, -7.4);
    c.bezierCurveTo(-8.8, -15.5, -6.4, -24.4, 0.6, -24.4);
    c.bezierCurveTo(7.8, -24.4, 9.3, -15.6, 8.3, -5.0);
    const xs = [8.3, 4.6, 0.8, -3.0];
    for (let i = 0; i < 3; i++) {
      const x0 = xs[i], x1 = xs[i + 1];
      const yEnd = -4.6 + Math.sin(ph + i * 1.9) * 0.6;
      const yLow = -0.4 + Math.sin(ph + i * 1.9 + 1.2) * 1.0;
      c.quadraticCurveTo((x0 + x1) / 2, yLow, x1, yEnd);
    }
    const tw = Math.sin(ph + 2.4);
    c.quadraticCurveTo(-6.0, 0.4 + tw * 0.6, -11.6 + tw * 0.9, -2.6 + tw * 1.0);
    c.quadraticCurveTo(-9.4, -4.6, -7.8, -7.4);
    c.closePath();
  }
  function ghostPath1(c, ph) { // soft-serve swirl tip leaning back, four-scallop hem
    const sw = Math.sin(ph - 0.9) * 0.9;
    c.moveTo(-7.8, -6.6);
    c.bezierCurveTo(-9.0, -14.0, -7.4, -20.6, -2.8, -22.6);
    c.quadraticCurveTo(-3.6 + sw * 0.3, -25.8, -6.2 + sw, -27.0);
    c.quadraticCurveTo(-0.6 + sw * 0.5, -27.8, 1.4, -24.0);
    c.bezierCurveTo(7.8, -23.0, 9.4, -15.0, 8.4, -5.2);
    const xs = [8.4, 4.4, 0.4, -3.6, -7.8];
    for (let i = 0; i < 4; i++) {
      const yEnd = (i === 3 ? -6.6 : -4.4) + Math.sin(ph + i * 1.6) * 0.6;
      const yLow = -0.2 + Math.sin(ph + i * 1.6 + 1.3) * 1.1;
      c.quadraticCurveTo((xs[i] + xs[i + 1]) / 2, yLow, xs[i + 1], yEnd);
    }
    c.closePath();
  }
  function ghostParts(P, v, fr, pose) {
    const ph = (fr / 8) * TAU, hurt = pose === 'hurt', dead = pose === 'dead';
    let ab, af;
    if (hurt) { ab = [-8.6, -17.2]; af = [9.8, -18.6]; }
    else if (dead) { ab = [-7.4, -9.6]; af = [8.6, -9.2]; }
    else { ab = [-7.6, -12.4 + Math.sin(ph - 0.8) * 0.9]; af = [8.9, -13.0 + Math.sin(ph - 1.6) * 1.0]; }
    P.part(E(ab[0], ab[1], 2.3, 1.6, hurt ? -0.6 : 0.5), C.ghost, { shade: C.ghostSh, sh: [-0.4, -0.4] });
    P.part((c) => (v ? ghostPath1 : ghostPath)(c, ph), C.ghost, { shade: C.ghostSh, sh: [-1.7, -1.3], hi: [-3.6, v ? -19.0 : -20.0, 2.2, 1.2, -0.7], hi2: [-1.0, v ? -21.2 : -22.0, 0.5] });
    P.part(E(af[0], af[1], 2.9, 1.7, hurt ? -0.9 : -0.3), C.ghost, { shade: C.ghostSh, sh: [-0.5, -0.5], inner: IL });
    P.detail((c) => {
      const ex = v ? [[1.6, -15.6, 1.45, 2.5], [6.0, -15.4, 1.35, 2.4]] : [[1.6, -16.8, 1.55, 2.4], [5.9, -16.6, 1.45, 2.3]];
      if (pose === 'walk') {
        c.fillStyle = OUT;
        for (const e of ex) { c.beginPath(); c.ellipse(e[0], e[1], e[2], e[3], 0, 0, TAU); c.fill(); }
        c.fillStyle = v ? '#ffffff' : '#9fd8ff';
        c.beginPath(); for (const e of ex) { c.moveTo(e[0] - 0.3 + 0.45, e[1] - 0.9); c.arc(e[0] - 0.3, e[1] - 0.9, 0.45, 0, TAU); } c.fill();
      } else if (pose === 'blink') { for (const e of ex) (v ? eyeHappy : eyeShut)(c, e[0], e[1] + 0.4, 1.4); }
      else if (hurt) { eyeSquint(c, ex[0][0] + 0.2, ex[0][1], 1.5, 1); eyeSquint(c, ex[1][0] - 0.1, ex[1][1], 1.4, -1); }
      else { eyeX(c, ex[0][0] + 0.2, ex[0][1], 1.3); eyeX(c, ex[1][0], ex[1][1], 1.2); }
      if (hurt) {
        c.strokeStyle = OUT; c.lineWidth = 0.9; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(1.6, -10.4); c.lineTo(2.7, -11.3); c.lineTo(3.8, -10.4); c.lineTo(4.9, -11.3); c.lineTo(6.0, -10.4); c.stroke();
      } else if (dead) mouthO(c, 3.9, -10.4, 1.6, 1.9);
      else if (v) { // cheeky grin, tongue out
        c.save(); c.beginPath(); c.moveTo(0.8, -11.4); c.quadraticCurveTo(4.2, -6.0, 7.8, -11.6); c.quadraticCurveTo(4.3, -10.0, 0.8, -11.4); c.closePath();
        c.fillStyle = OUT; c.fill(); c.clip(); c.fillStyle = C.tongue; c.beginPath(); c.ellipse(5.4, -8.3, 1.7, 1.4, 0, 0, TAU); c.fill(); c.restore();
        c.fillStyle = C.tongue; c.strokeStyle = OUT; c.lineWidth = 0.5;
        c.beginPath(); c.ellipse(6.3, -7.6 + Math.sin(ph * 2) * 0.25, 1.2, 1.4, 0.3, 0, PI); c.fill(); c.stroke();
      } else { // gaping hungry mouth
        const m = 0.3 * Math.sin(ph * 2);
        c.save(); c.beginPath(); c.ellipse(3.9, -10.4, 2.5, 3.2 + m, 0, 0, TAU);
        c.fillStyle = OUT; c.fill(); c.clip();
        c.fillStyle = C.tongue; c.beginPath(); c.ellipse(4.2, -7.6 + m, 1.9, 1.3, 0, 0, TAU); c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath(); c.moveTo(2.4, -13.6); c.lineTo(3.4, -13.6); c.lineTo(2.9, -11.9); c.closePath();
        c.moveTo(4.5, -13.6); c.lineTo(5.5, -13.6); c.lineTo(5.0, -11.9); c.closePath(); c.fill();
        c.restore();
      }
    });
  }
  function ghostFade(s, box) {
    const ctx = s.c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const y0 = (-9 - box[1]) * K, y1 = (0 - box[1]) * K;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = g; ctx.fillRect(0, 0, s.c.width, s.c.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---- large creature: heavy stomp, leaf crown that lags each step ---- */
  function colossusParts(P, fr, pose) {
    const ph = fr / 8, walk = walkPose(pose), hurt = pose === 'hurt', dead = pose === 'dead';
    const col = { top: C.cTop, topSh: C.cTopSh, bot: C.ochre, botSh: C.ochreSh };
    const top = -46.5, bot = -5.2, hw = 19.5;
    const lb = (i) => (walk ? 0.07 * Math.sin(TAU * (2 * ph - 0.3 - 0.06 * i)) : hurt ? -0.22 + 0.04 * i : 0);
    const ls = walk ? 1 + 0.04 * Math.sin(TAU * (2 * ph - 0.35)) : 1;
    const L = (a, len, wid, fc, sc, i) => {
      const aa = (dead ? a * 1.6 : hurt ? a * 1.25 : a) + lb(i);
      P.part((c) => leafPath(c, 0.5, top + 2.6, aa, len * ls, wid), fc, { shade: sc, sh: [-0.9, -0.9], detail: midrib(0.5, top + 2.6, aa, len * ls, sc, 0.6) });
    };
    L(-1.1, 12.5, 4.0, '#a29a46', '#7d7530', 0);
    L(1.05, 13.5, 4.3, '#6dbb4c', '#4d9338', 1);
    L(-0.48, 16.5, 5.0, '#6dbb4c', '#4d9338', 2);
    L(0.5, 15.5, 4.8, '#79c652', '#55a03c', 3);
    L(0.0, 18.5, 5.4, '#79c652', '#55a03c', 4);
    const legP = (hx, fx, fy, back) => {
      P.part(CAP(hx, -9.5, fx, fy - 2.4, 3.5), back ? C.rootSh : C.root, { shade: back ? '#b69457' : C.rootSh, sh: [-0.8, -0.6] });
      P.part(E(fx + 0.8, fy - 1.4, 4.4, 2.0), back ? C.rootSh : C.root, { shade: back ? '#b69457' : C.rootSh, sh: [-0.8, -0.7], inner: IL });
    };
    let fb, ff;
    if (walk) { const A = footCycle(ph), B = footCycle(ph + 0.5); fb = [-8.0 + B[0] * 3.4, -B[1] * 3.6]; ff = [8.0 + A[0] * 3.4, -A[1] * 3.6]; }
    else if (hurt) { fb = [-10.5, -1.4]; ff = [10.2, 0]; }
    else { fb = [-11.5, -3.2]; ff = [11.5, -3.2]; }
    legP(-7.5, fb[0], fb[1], true);
    legP(7.5, ff[0], ff[1], false);
    const sw = walk ? Math.sin(TAU * (ph - 0.1)) * 1.8 : 0;
    const bA = walk ? [-21.4 - sw * 0.6, -18.2 + sw] : hurt ? [-24.0, -31.0] : [-21.6, -12.4];
    const fA = walk ? [22.6 + sw * 0.6, -17.2 - sw] : hurt ? [24.6, -32.0] : [22.4, -11.4];
    P.part(CAP(-16.0, -27.0, bA[0], bA[1], 3.1), C.root, { shade: C.rootSh, sh: [-0.6, -0.6] });
    P.part((c) => turnipPath(c, 0, top, bot, hw), turnipFill(col, -26.5, 1.5, 0.38), {
      sh: [-2.8, -2.3], hi: [-10.4, -37.5, 3.6, 1.9, -0.7], hi2: [-6.6, -41.0, 0.9],
      detail(c) {
        c.strokeStyle = OUT; c.lineWidth = 0.75; c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(-14.2, -31.5); c.lineTo(-11.6, -29.6); c.lineTo(-13.0, -27.0); c.lineTo(-10.2, -24.6);
        c.moveTo(13.6, -12.0); c.lineTo(15.6, -14.6); c.lineTo(14.0, -16.8); c.lineTo(16.2, -19.0);
        c.moveTo(-6.5, -9.0); c.lineTo(-4.6, -11.4); c.lineTo(-6.0, -13.4);
        c.moveTo(4.0, -42.0); c.lineTo(5.6, -39.6); c.lineTo(4.4, -37.6);
        c.stroke();
      },
    });
    const bandDots = (c) => { c.fillStyle = C.bandSh; for (const p of [[-10.6, -36.6], [-9.0, -35.4], [-10.8, -34.6], [-8.6, -37.2]]) { c.beginPath(); c.arc(p[0], p[1], 0.35, 0, TAU); c.fill(); } };
    P.part((c) => rrectRot(c, -9.6, -35.8, 11.5, 3.4, 0.68, 1.3), C.band, { shade: C.bandSh, sh: [-0.3, -0.4], inner: IL });
    P.part((c) => rrectRot(c, -9.6, -35.8, 11.5, 3.4, -0.68, 1.3), C.band, { shade: C.bandSh, sh: [-0.3, -0.4], inner: IL, detail: bandDots });
    const mx = (16.2 + fA[0]) / 2, my = (-25.6 + fA[1]) / 2, ang = Math.atan2(fA[1] + 25.6, fA[0] - 16.2) - PI / 2;
    P.part(CAP(16.2, -25.6, fA[0], fA[1], 3.2), C.root, {
      shade: C.rootSh, sh: [-0.6, -0.6], inner: IL,
      detail(c) { // bandage wrap around the forearm
        c.save(); c.translate(mx, my); c.rotate(ang + PI / 2);
        c.fillStyle = C.band; c.strokeStyle = OUT; c.lineWidth = 0.4;
        c.fillRect(-1.4, -5, 1.2, 10); c.fillRect(0.6, -5, 1.2, 10); c.strokeRect(-1.4, -5, 1.2, 10); c.strokeRect(0.6, -5, 1.2, 10);
        c.restore();
      },
    });
    P.part(E(fA[0] + 0.8, fA[1] + 1.2, 2.6, 2.4), C.root, { shade: C.rootSh, sh: [-0.5, -0.5], inner: IL });
    P.detail((c) => {
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (pose === 'walk' || pose === 'blink') {
        const ry = pose === 'blink' ? 0.55 : 1;
        c.lineWidth = 0.8; c.strokeStyle = OUT; c.fillStyle = C.glow;
        c.beginPath(); c.ellipse(2.0, -29.0, 3.0, 2.2 * ry, 0.1, 0, TAU); c.fill(); c.stroke();
        c.beginPath(); c.ellipse(11.6, -29.0, 2.6, 2.1 * ry, -0.1, 0, TAU); c.fill(); c.stroke();
        if (ry === 1) { c.fillStyle = C.glowHi; c.beginPath(); c.ellipse(2.5, -28.7, 1.2, 0.9, 0, 0, TAU); c.ellipse(12.0, -28.7, 1.05, 0.85, 0, 0, TAU); c.fill(); }
      } else if (hurt) { eyeSquint(c, 2.4, -29.4, 2.6, 1); eyeSquint(c, 11.2, -29.4, 2.4, -1); }
      else { c.lineWidth = 1.4; eyeX(c, 2.2, -29.2, 2.2); eyeX(c, 11.6, -29.2, 2.0); }
      c.fillStyle = OUT;
      const bu = hurt || dead ? 1.6 : 0;
      c.beginPath(); roundPoly(c, [[-3.8, -35.6 - bu], [5.4, -31.6 - bu * 0.3], [5.2, -29.6 - bu * 0.3], [-3.6, -32.9 - bu]], 0.6); c.fill();
      c.beginPath(); roundPoly(c, [[8.0, -31.6 - bu * 0.3], [16.0, -35.2 - bu], [16.1, -32.6 - bu], [8.2, -29.6 - bu * 0.3]], 0.6); c.fill();
      if (dead) mouthDead(c, 7.4, -20.6, 5.0);
      else {
        const open = hurt ? 3.4 : 0;
        c.save();
        c.beginPath(); roundPoly(c, [[0.2, -23.0 - open * 0.3], [14.2, -24.0 - open * 0.3], [13.2, -17.6 + open], [1.4, -17.4 + open]], 1.8);
        c.fillStyle = OUT; c.fill(); c.clip();
        if (hurt) { c.fillStyle = C.tongue; c.beginPath(); c.ellipse(7.6, -15.6, 4.6, 2.6, 0, 0, TAU); c.fill(); }
        c.fillStyle = '#fff6e2';
        c.beginPath();
        for (let i = 0; i < 6; i++) { const x = 1.0 + i * 2.3, y = -24.5 - open * 0.3; c.moveTo(x, y); c.lineTo(x + 2.3, y); c.lineTo(x + 1.15, y + 3.1); c.closePath(); }
        if (!hurt) for (let i = 0; i < 5; i++) { const x = 2.2 + i * 2.3; c.moveTo(x, -16.5); c.lineTo(x + 2.3, -16.5); c.lineTo(x + 1.15, -19.2); c.closePath(); }
        c.fill();
        c.restore();
      }
      c.strokeStyle = OUT; c.lineWidth = 0.7;
      c.beginPath();
      c.moveTo(-12.5, -8.6); c.quadraticCurveTo(-15.0, -7.4, -16.4, -5.0);
      c.moveTo(13.5, -9.0); c.quadraticCurveTo(16.0, -7.8, 17.0, -5.6);
      c.stroke();
    });
  }

  /* ---------------------------------------------------------- small sprites */
  function lanternParts(P) {
    const col = { top: '#a462d6', topSh: '#7a45ad', bot: '#fff0c4', botSh: '#ecc98a' };
    P.part((c) => leafPath(c, 0, -13.6, -0.6, 5.2, 1.8), C.leaf, { shade: C.leafSh, sh: [-0.4, -0.4] });
    P.part((c) => leafPath(c, 0, -13.6, 0.55, 5.6, 1.9), C.leaf, { shade: C.leafSh, sh: [-0.4, -0.4] });
    P.part((c) => turnipPath(c, 0, -14.4, -0.6, 7.4), turnipFill(col, -9.6, 0.6, 1.2), {
      sh: [-1.2, -1.0], hi: [-4.0, -10.6, 1.5, 0.8, -0.7],
    });
    P.detail((c) => {
      carve(c, (k) => roundPoly(k, [[-2.4, -9.4], [-4.2, -6.5], [-0.8, -6.5]], 0.45), 0.1, 0.5);
      carve(c, (k) => roundPoly(k, [[2.4, -9.4], [0.8, -6.5], [4.2, -6.5]], 0.45), 0.1, 0.5);
      carve(c, (k) => { k.moveTo(-3.8, -5.0); k.quadraticCurveTo(0, 0.4, 3.8, -5.0); k.quadraticCurveTo(0, -3.0, -3.8, -5.0); k.closePath(); }, 0.1, 0.5);
    });
  }
  function gemParts(P, big) {
    const k = big ? 1.55 : 1;
    const col = big ? ['#62c8ff', '#2f83e0'] : ['#74e690', '#2fae66'];
    const pts = [[-3.2, -3.4], [-1.7, -5.3], [1.7, -5.3], [3.2, -3.4], [0, 0.3]].map((p) => [p[0] * k, p[1] * k]);
    P.part((c) => roundPoly(c, pts, 0.55 * k), col[0], {
      ol: big ? 1.0 : 0.85,
      detail(c) {
        c.fillStyle = col[1];
        c.beginPath(); c.moveTo(0.4 * k, -3.4 * k); c.lineTo(3.4 * k, -3.4 * k); c.lineTo(0, 0.6 * k); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(1.7 * k, -5.4 * k); c.lineTo(3.4 * k, -3.4 * k); c.lineTo(0.4 * k, -3.4 * k); c.closePath(); c.globalAlpha = 0.45; c.fill(); c.globalAlpha = 1;
        c.strokeStyle = OUT; c.globalAlpha = 0.35; c.lineWidth = 0.35 * k;
        c.beginPath(); c.moveTo(-3.2 * k, -3.4 * k); c.lineTo(3.2 * k, -3.4 * k); c.stroke(); c.globalAlpha = 1;
      },
      hi: [-1.5 * k, -4.0 * k, 1.0 * k, 0.5 * k, -0.4], hi2: [-2.0 * k, -2.5 * k, 0.32 * k],
    });
  }
  const seedPath = (c) => { c.moveTo(4.4, 0); c.bezierCurveTo(2.6, -2.8, -3.5, -3.1, -3.5, 0); c.bezierCurveTo(-3.5, 3.1, 2.6, 2.8, 4.4, 0); c.closePath(); };
  function seedParts(P) {
    P.part(seedPath, C.cream, {
      ol: 0.85, shade: C.creamSh, sh: [-0.5, -0.8],
      detail(c) { c.save(); c.translate(-0.2, 0); c.scale(0.66, 0.58); c.beginPath(); seedPath(c); c.restore(); c.strokeStyle = 'rgba(205,160,92,.75)'; c.lineWidth = 0.5; c.stroke(); },
      hi: [-1.0, -1.35, 1.35, 0.55, -0.12],
    });
  }
  const PUFF_COL = [['#ffffff', '#dcd6ea'], ['#f6e6c2', '#d9bf8a'], ['#eef4ff', '#b9c9ea'], ['#f1e3fb', '#c9b0e2'], ['#ffd59a', '#ef9f52']];
  function puffParts(P, t) {
    const col = PUFF_COL[t];
    P.part((c) => { E(0, 0.4, 4.6, 4.3)(c); E(-3.6, 1.4, 3.1, 2.9)(c); E(3.6, 1.2, 3.2, 3.0)(c); E(-1.6, -2.6, 3.0, 2.9)(c); E(2.1, -2.3, 2.8, 2.7)(c); },
      col[0], { ol: 0.9, shade: col[1], sh: [-1.3, -1.3], hi: [-2.4, -3.0, 1.2, 0.6, -0.6] });
  }
  const STAR_COL = [['#ffd43f', '#f39a1e'], ['#ffffff', '#d9e1f4'], ['#ff9e3d', '#e2641f']];
  function starParts(P, t) {
    const col = STAR_COL[t];
    P.part((c) => roundPoly(c, starPts(5, 4.4, 2.1, 0, 0.3, -PI / 2), 0.55), col[0], { ol: 0.85, shade: col[1], sh: [-0.8, -0.8], hi2: [-1.0, -1.4, 0.55] });
  }
  const CHUNK_COL = [
    ['#9b5cd0', '#7241aa'], ['#f8eacb', '#e0c595'], [C.leaf, C.leafSh], [C.pump, C.pumpSh], [C.ochre, C.ochreSh],
    [C.cTop, C.cTopSh], [C.ghost, C.ghostSh], [C.band, C.bandSh], ['#e0567c', '#b03a63'], ['#6f5bd0', '#4d3ea6'],
  ];
  function chunkParts(P, col, i) {
    const r = U.rng(31 + i * 7);
    const pts = [];
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + r.range(-0.2, 0.2); const rr = r.range(1.5, 2.4); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.85]); }
    P.part((c) => blobPath(c, pts, 0.9), col[0], { ol: 0.75, shade: col[1], sh: [-0.6, -0.6] });
  }
  function hitParts(P) {
    P.part((c) => roundPoly(c, starPts(8, 5.6, 2.6, 0, 0, 0.2), 0.4), '#ffffff', { ol: 0.75, shade: '#fff3b5', sh: [-0.7, -0.7] });
  }
  function sparkParts(P) {
    P.part((c) => {
      c.moveTo(0, -3.8); c.quadraticCurveTo(0.45, -0.45, 3.8, 0); c.quadraticCurveTo(0.45, 0.45, 0, 3.8);
      c.quadraticCurveTo(-0.45, 0.45, -3.8, 0); c.quadraticCurveTo(-0.45, -0.45, 0, -3.8); c.closePath();
    }, '#ffffff', { ol: 0.6, shade: '#fff0a0', sh: [-0.4, -0.4] });
  }
  const BFLY_COL = [['#fff6d0', '#f2d77a'], ['#ffd1e4', '#f39cbf'], ['#d4ecff', '#9cc9f2'], ['#fff1a8', '#f5c542']];
  function butterflyParts(P, t) {
    const col = BFLY_COL[t];
    P.part((c) => { E(-2.3, -1.3, 2.4, 1.9, -0.5)(c); E(2.3, -1.3, 2.4, 1.9, 0.5)(c); E(-1.7, 1.2, 1.6, 1.3, 0.4)(c); E(1.7, 1.2, 1.6, 1.3, -0.4)(c); }, col[0], {
      ol: 0.55, shade: col[1], sh: [0, -0.7],
      detail(c) { c.fillStyle = col[1]; c.beginPath(); c.arc(-2.6, -1.5, 0.6, 0, TAU); c.arc(2.6, -1.5, 0.6, 0, TAU); c.fill(); },
    });
    P.part(CAP(0, -2.2, 0, 2.2, 0.55), OUT, { ol: 0.3 });
    P.detail((c) => { c.strokeStyle = OUT; c.lineWidth = 0.35; c.beginPath(); c.moveTo(-0.2, -2.5); c.quadraticCurveTo(-0.8, -3.8, -1.6, -4.0); c.moveTo(0.2, -2.5); c.quadraticCurveTo(0.8, -3.8, 1.6, -4.0); c.stroke(); }, true);
  }
  const CONF_COL = ['#ff6b6b', '#ffd43f', '#62c8ff', '#74e690', '#c38bff', '#ff9e3d'];
  function plainSprite(box, fn) {
    const l = box[0], t = box[1];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((box[2] - l) * K); cv.height = Math.ceil((box[3] - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    fn(ctx);
    return { c: cv, ox: -l * K, oy: -t * K };
  }

  /* ================================================================== props */
  const TREE_COL = [['#7fca5c', '#57a243'], ['#f2a64c', '#d57c36'], ['#a9d65a', '#7fb343'], ['#efc54e', '#d09d36']];
  function treeParts(P, v) {
    if (v === 4) { // round-tier pine
      P.part((c) => roundPoly(c, [[-2.3, 0.5], [-1.8, -14], [1.8, -14], [2.3, 0.5]], 0.9), C.bark, { shade: C.barkSh, sh: [-0.9, 0] });
      const tier = (y, w, h) => P.part((c) => roundPoly(c, [[0, y - h], [w, y], [-w, y]], 2.6), '#4fa564', { shade: '#36804b', sh: [-2.0, -1.4], inner: IL });
      tier(-10, 14, 18); tier(-22, 11.5, 16); tier(-33, 9, 14);
      P.detail((c) => gloss(c, [-4.0, -40.0, 1.6, 0.8, -0.9]));
      return;
    }
    const col = TREE_COL[v];
    P.part((c) => roundPoly(c, [[-3.6, 0.6], [-2.0, -6], [-1.9, -24], [1.9, -24], [2.0, -6], [3.6, 0.6]], 1.0), C.bark, {
      shade: C.barkSh, sh: [-1.1, 0],
      detail(c) { c.strokeStyle = C.barkSh; c.lineWidth = 0.5; c.beginPath(); c.arc(0.4, -10, 0.9, 0, TAU); c.stroke(); },
    });
    const can = [[0, -36.5, 11.5], [-8.8, -33.6, 7.2], [8.8, -34.0, 7.3], [-5.6, -43.4, 7.4], [5.8, -43.8, 7.0], [0.4, -29.8, 7.6]];
    P.part((c) => { for (const q of can) E(q[0], q[1], q[2], q[2])(c); }, col[0], {
      shade: col[1], sh: [-2.8, -2.6],
      detail(c) {
        c.strokeStyle = col[1]; c.lineWidth = 0.75;
        for (const p of [[4.5, -31], [-5.5, -30], [7.5, -40], [-1.0, -36.5], [2.5, -44], [-8, -38.5]]) { c.beginPath(); c.arc(p[0], p[1], 1.6, 0.15 * PI, 0.85 * PI); c.stroke(); }
        if (v === 0) {
          for (const p of [[5.5, -35.5], [-3.5, -42.5], [-7.5, -32.5]]) {
            c.fillStyle = '#ef5a52'; c.strokeStyle = OUT; c.lineWidth = 0.5;
            c.beginPath(); c.arc(p[0], p[1], 1.4, 0, TAU); c.fill(); c.stroke();
            c.fillStyle = '#fff'; c.beginPath(); c.arc(p[0] - 0.45, p[1] - 0.45, 0.4, 0, TAU); c.fill();
          }
        }
      },
      hi: [-6.8, -43.5, 3.3, 1.7, -0.6], hi2: [-3.0, -47.0, 0.8],
    });
  }
  function bushParts(P, v) {
    const cols = [['#73c257', '#4e9a40'], ['#8acb5a', '#61a444'], ['#9ad16a', '#6daa4c']];
    const col = cols[v];
    P.part((c) => { E(-6.4, -6.0, 6.4, 6.0)(c); E(6.0, -5.8, 6.0, 5.6)(c); E(0, -9.6, 7.6, 7.2)(c); E(-0.5, -4.6, 7.0, 4.8)(c); }, col[0], {
      shade: col[1], sh: [-2.1, -2.0],
      detail(c) {
        c.strokeStyle = col[1]; c.lineWidth = 0.7;
        for (const p of [[3.5, -8.0], [-4.0, -6.0], [0.5, -12.5]]) { c.beginPath(); c.arc(p[0], p[1], 1.4, 0.15 * PI, 0.85 * PI); c.stroke(); }
        if (v === 1) {
          for (const p of [[4.6, -10.4], [-2.6, -13.2], [-6.8, -6.8], [7.6, -5.0], [1.0, -6.4]]) {
            c.fillStyle = '#ef5a52'; c.strokeStyle = OUT; c.lineWidth = 0.45;
            c.beginPath(); c.arc(p[0], p[1], 1.15, 0, TAU); c.fill(); c.stroke();
            c.fillStyle = '#fff'; c.beginPath(); c.arc(p[0] - 0.35, p[1] - 0.35, 0.32, 0, TAU); c.fill();
          }
        }
        if (v === 2) {
          for (const p of [[4.2, -10.6], [-3.2, -13.4], [-7.0, -7.0], [7.4, -4.6], [0.6, -6.0]]) {
            c.fillStyle = '#f7b5d0';
            for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; c.beginPath(); c.arc(p[0] + Math.cos(a) * 0.9, p[1] + Math.sin(a) * 0.9, 0.7, 0, TAU); c.fill(); }
            c.fillStyle = '#ffd43f'; c.beginPath(); c.arc(p[0], p[1], 0.5, 0, TAU); c.fill();
          }
        }
      },
      hi: [-4.8, -13.0, 2.2, 1.1, -0.6],
    });
  }
  function rockParts(P, v) {
    const s = [1, 0.66, 1.2][v];
    const pts = [[-8, 0.3], [-9, -3.8], [-6, -8.6], [-0.5, -10.4], [5.6, -9], [8.8, -4.2], [8.2, 0.3]].map((p) => [p[0] * s, p[1] * s]);
    P.part((c) => blobPath(c, pts, 0.8), '#bdb5cd', {
      shade: '#918aa9', sh: [-2.0 * s, -1.8 * s],
      detail(c) { c.strokeStyle = '#918aa9'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(3.0 * s, -8.6 * s); c.lineTo(1.8 * s, -6.4 * s); c.lineTo(3.0 * s, -4.8 * s); c.stroke(); },
      hi: [-4.6 * s, -6.6 * s, 2.0 * s, 0.9 * s, -0.6],
    });
    if (v === 2) {
      P.part((c) => blobPath(c, [[-7.6, -8.4], [-2, -12.6], [5, -11.4], [7.6, -8.4], [3.6, -9.0], [0, -7.6], [-4.0, -8.6]].map((p) => [p[0] * 1.02, p[1] * 1.02]), 0.9), '#8cc65a', {
        shade: '#66a443', sh: [-0.8, -0.8], inner: IL,
      });
    }
  }
  function pumpkinUnit(P, cx, cy, rx, ry) {
    P.part(CAP(cx + 0.1, cy - ry + 1.0, cx + 1.0, cy - ry - 2.4, 1.1), C.stem, { shade: C.stemSh, sh: [-0.4, -0.3] });
    P.part((c) => pumpkinPath(c, cx, cy, rx, ry), C.propPump, {
      shade: C.propPumpSh, sh: [-1.6, -1.4], inner: IL,
      detail(c) { ribs(c, cx, cy, rx, ry, C.propPumpSh, 0.6); },
      hi: [cx - rx * 0.55, cy - ry * 0.45, rx * 0.22, ry * 0.14, -0.6],
    });
  }
  function pumpkinProp(P, v) {
    if (v === 1) pumpkinUnit(P, 8.0, -5.0, 6.0, 4.6);
    P.part((c) => leafPath(c, -3.0, -1.0, -1.6, 7.0, 2.6), C.leaf, { shade: C.leafSh, sh: [-0.5, -0.5], detail: midrib(-3.0, -1.0, -1.6, 7.0, C.leafSh) });
    pumpkinUnit(P, 0, -6.8, 8.8, 6.6);
    P.detail((c) => { c.strokeStyle = C.stemSh; c.lineWidth = 0.6; c.beginPath(); c.arc(2.6, -14.6, 1.2, PI, PI * 2.7); c.stroke(); });
  }
  function mushParts(P, v) {
    const capC = v ? ['#c98a52', '#a4683a'] : ['#ec5b52', '#c03f45'];
    const one = (x, s) => {
      P.part((c) => roundPoly(c, [[x - 1.7 * s, 0.3], [x - 1.3 * s, -6.6 * s], [x + 1.3 * s, -6.6 * s], [x + 1.7 * s, 0.3]], 0.8 * s), '#f6ead2', { shade: '#d9c6a4', sh: [-0.7 * s, 0] });
      P.part((c) => {
        c.moveTo(x - 5.4 * s, -5.8 * s);
        c.bezierCurveTo(x - 5.6 * s, -10.6 * s, x - 2.4 * s, -12.2 * s, x, -12.2 * s);
        c.bezierCurveTo(x + 2.4 * s, -12.2 * s, x + 5.6 * s, -10.6 * s, x + 5.4 * s, -5.8 * s);
        c.quadraticCurveTo(x, -4.2 * s, x - 5.4 * s, -5.8 * s); c.closePath();
      }, capC[0], {
        shade: capC[1], sh: [-1.2 * s, -1.0 * s], inner: IL,
        detail(c) {
          c.fillStyle = '#fff6e6';
          for (const p of [[-2.4, -9.6, 1.0], [1.6, -10.4, 0.8], [3.4, -7.6, 0.7], [-0.4, -7.2, 0.6]]) { c.beginPath(); c.arc(x + p[0] * s, p[1] * s, p[2] * s, 0, TAU); c.fill(); }
        },
        hi: [x - 2.8 * s, -10.6 * s, 1.0 * s, 0.5 * s, -0.7],
      });
    };
    one(-4.0, 0.72); one(2.0, 1.0);
  }
  function fenceParts(P) {
    P.part((c) => rrect(c, -17.5, -11.0, 35, 2.7, 1.0), C.wood, { shade: C.woodSh, sh: [0, -0.8] });
    P.part((c) => rrect(c, -17.5, -6.0, 35, 2.7, 1.0), C.wood, { shade: C.woodSh, sh: [0, -0.8] });
    for (const x of [-14, 0, 14]) {
      P.part((c) => roundPoly(c, [[x - 1.8, 0.4], [x - 1.8, -12.8], [x, -15.0], [x + 1.8, -12.8], [x + 1.8, 0.4]], 0.6), C.wood, {
        shade: C.woodSh, sh: [-1.0, 0], inner: IL,
        detail(c) { c.fillStyle = C.woodSh; c.beginPath(); c.arc(x, -9.6, 0.4, 0, TAU); c.arc(x, -4.6, 0.4, 0, TAU); c.fill(); },
      });
    }
  }
  function signParts(P) {
    P.part((c) => rrect(c, -1.6, -21.5, 3.2, 22.0, 1.0), C.wood, { shade: C.woodSh, sh: [-1.0, 0] });
    P.part((c) => roundPoly(c, [[-9.5, -26.4], [6.0, -26.4], [10.6, -21.8], [6.0, -17.2], [-9.5, -17.2]], 1.2), '#e4b77b', {
      shade: '#c38f56', sh: [-0.9, -1.0], inner: IL,
      detail(c) {
        c.strokeStyle = OUT; c.lineWidth = 0.5;
        c.fillStyle = C.propPump; c.beginPath(); c.ellipse(-3.6, -21.6, 2.6, 2.1, 0, 0, TAU); c.fill(); c.stroke();
        c.strokeStyle = C.stemSh; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3.6, -23.6); c.lineTo(-3.2, -24.8); c.stroke();
        c.strokeStyle = '#9a6a3c'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0.6, -21.8); c.lineTo(6.2, -21.8); c.moveTo(4.4, -23.6); c.lineTo(6.4, -21.8); c.lineTo(4.4, -20.0); c.stroke();
      },
      hi: [-6.0, -24.6, 1.6, 0.6, 0],
    });
  }
  function hayParts(P) {
    const path = (c) => { c.moveTo(-13, 0.3); c.bezierCurveTo(-13.6, -10, -7, -17.4, 0, -17.4); c.bezierCurveTo(7, -17.4, 13.6, -10, 13, 0.3); c.quadraticCurveTo(0, 1.8, -13, 0.3); c.closePath(); };
    P.part(path, '#f3cf62', {
      shade: '#d6a33c', sh: [-2.4, -2.0],
      detail(c) {
        c.strokeStyle = '#c99434'; c.lineWidth = 0.6;
        const r = U.rng(77);
        for (let i = 0; i < 16; i++) {
          const x = r.range(-10, 10), y = r.range(-14, -2), a = r.range(-0.5, 0.5) + (x > 0 ? 0.35 : -0.35);
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * 2.8, y + Math.cos(a) * 2.8); c.stroke();
        }
        c.strokeStyle = '#fbe9a4';
        for (let i = 0; i < 6; i++) { const x = r.range(-8, 4), y = r.range(-14, -6); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1.2, y + 2.4); c.stroke(); }
      },
      hi: [-6.0, -11.5, 2.4, 1.2, -0.7],
    });
    P.detail((c) => {
      c.strokeStyle = '#d6a33c'; c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(-1, -17); c.lineTo(-2.6, -20.4); c.moveTo(1, -17.2); c.lineTo(1.8, -20.8); c.moveTo(2.6, -16.8); c.lineTo(4.8, -19.4); c.stroke();
    });
  }
  function reedParts(P, v) {
    const blade = (x, a, len, wid, col) => P.part((c) => leafPath(c, x, 0.3, a, len, wid), col[0], { shade: col[1], sh: [-0.5, -0.4], detail: midrib(x, 0.3, a, len, col[1], 0.4) });
    const G1 = ['#7cc35e', '#55a043'], G2 = ['#5fae55', '#428a3e'];
    if (v === 0) { // cattails: two velvet heads on thin stems among the blades
      blade(-3.2, -0.42, 12, 1.5, G2); blade(3.0, 0.5, 11, 1.4, G2);
      for (const [x, h, a] of [[-0.8, 20, -0.08], [1.6, 16.5, 0.12]]) {
        const sa = Math.sin(a), ca = Math.cos(a);
        P.part(CAP(x, 0.3, x + sa * h, -ca * h, 0.45), '#8fb35a', { ol: 0.8 });
        const hx = x + sa * (h - 3.0), hy = -ca * (h - 3.0);
        P.part(CAP(x + sa * (h - 6.6), -ca * (h - 6.6), hx, hy, 1.45), '#8a5a3a', { shade: '#6b4129', sh: [-0.5, -0.3], hi: [hx - 0.6, hy + 0.9, 0.35, 1.1, a] });
      }
      blade(0.6, -0.12, 14.5, 1.7, G1); blade(-1.8, 0.25, 10, 1.6, G1);
    } else { // flowering rush: a fan of blades with two small iris blooms
      blade(-3.6, -0.55, 11, 1.6, G2); blade(3.4, 0.6, 10.5, 1.6, G2); blade(-1.2, -0.2, 15, 1.8, G1); blade(1.4, 0.22, 13, 1.7, G1);
      for (const [x, y] of [[-4.6, -11.0], [4.6, -9.4]]) {
        P.part((c) => { for (let i = 0; i < 3; i++) { const a = -PI / 2 + (i - 1) * 1.05; E(x + Math.cos(a) * 1.3, y + Math.sin(a) * 1.3, 1.5, 1.0, a)(c); } }, '#b08ee0', {
          ol: 0.8, shade: '#8a68c4', sh: [-0.4, -0.4], detail(c) { c.fillStyle = '#ffd43f'; c.beginPath(); c.arc(x, y, 0.6, 0, TAU); c.fill(); },
        });
      }
    }
  }
  function stumpParts(P) {
    P.part(CAP(5.6, -1.4, 10.2, 0.2, 1.4), C.bark, { shade: C.barkSh, sh: [-0.6, -0.4] }); // roots
    P.part(CAP(-5.6, -1.2, -9.8, 0.4, 1.3), C.bark, { shade: C.barkSh, sh: [-0.6, -0.4] });
    P.part((c) => roundPoly(c, [[-7.6, 0.6], [-6.4, -9.0], [6.4, -9.0], [7.6, 0.6]], 1.4), C.bark, {
      shade: C.barkSh, sh: [-2.0, 0],
      detail(c) { c.strokeStyle = C.barkSh; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-3.2, -7.4); c.lineTo(-3.6, -1.2); c.moveTo(2.4, -6.8); c.lineTo(2.9, -0.6); c.stroke(); },
    });
    P.part(E(0, -9.0, 6.6, 2.5), C.wood, {
      shade: C.woodSh, sh: [0, 0.7], inner: IL,
      detail(c) { c.strokeStyle = C.woodSh; c.lineWidth = 0.5; for (const r of [1.5, 3.2, 4.8]) { c.beginPath(); c.ellipse(0.3, -9.1, r, r * 0.38, 0, 0, TAU); c.stroke(); } },
      hi: [-3.6, -9.8, 1.4, 0.4, 0],
    });
    P.part((c) => leafPath(c, -2.4, -10.2, -0.55, 4.8, 1.7), C.leaf, { shade: C.leafSh, sh: [-0.3, -0.4], detail: midrib(-2.4, -10.2, -0.55, 4.8, C.leafSh) }); // a new shoot
    P.part((c) => leafPath(c, -2.2, -10.2, 0.45, 3.6, 1.4), C.leaf, { shade: C.leafSh, sh: [-0.3, -0.4] });
  }
  const PROP_DEF = {
    tree: { n: 5, box: [-20, -64, 20, 2], fn: treeParts, sh: [15, 5] },
    bush: { n: 3, box: [-15, -20, 15, 2], fn: bushParts, sh: [12, 3.8] },
    rock: { n: 3, box: [-13, -16, 13, 2], fn: rockParts, sh: [9.5, 3.0] },
    pump: { n: 2, box: [-12, -20, 16, 2], fn: pumpkinProp, sh: [10, 3.2] },
    mush: { n: 2, box: [-10, -15, 9, 2], fn: mushParts, sh: [7, 2.3] },
    fence: { n: 1, box: [-20, -18, 20, 2], fn: fenceParts, sh: [18, 2.6] },
    sign: { n: 1, box: [-12, -29, 13, 2], fn: signParts, sh: [6, 2.0] },
    hay: { n: 1, box: [-16, -23, 16, 3], fn: hayParts, sh: [14, 4.0] },
    reed: { n: 2, box: [-10, -24, 10, 2], fn: reedParts, sh: [7.5, 2.4] },
    stump: { n: 1, box: [-12, -16, 12, 2], fn: stumpParts, sh: [9.5, 3.0] },
  };

  /* ================================================================ ground */
  const GSTEP = 4;  // world units between field samples
  const BASE = [158, 198, 113];
  const LAY = [ // bottom -> top; material id = index + 1 (0 = base meadow grass)
    { fill: [121, 174, 90], rim: [106, 158, 80], rw: 1.7 },   // 1 dark grass
    { fill: [200, 182, 218], rim: [180, 160, 204], rw: 2.0 }, // 2 lilac flower meadow
    { fill: [218, 160, 112], rim: [199, 138, 96], rw: 2.3 },  // 3 clay / autumn field
    { fill: [235, 211, 160], rim: [216, 186, 133], rw: 2.5 }, // 4 sand clearings + paths
    { fill: [224, 203, 150], rim: [205, 179, 122], rw: 1.6 }, // 5 pond shore (damp sand)
    { fill: [128, 205, 226], rim: [226, 247, 245], rw: 1.4 }, // 6 pond water, foam line along its rim
    { fill: [96, 178, 215], rim: [111, 190, 222], rw: 3.0 },  // 7 deep water
  ];
  const NL = LAY.length, NF = NL + 1; // + macro tint
  function fieldsAt(x, y, out) {
    // large, round, calm regions: low-octave noise, gentle warp only
    const wx = U.perlin(x / 900, y / 900, 701) * 90, wy = U.perlin(x / 900 + 9.2, y / 900, 702) * 90;
    const X = x + wx, Y = y + wy;
    out[0] = U.fbm(X / 520 + 3.3, Y / 520, 101, 2) - 0.6;          // dark grass patches
    out[1] = U.fbm(X / 800 + 13.7, Y / 800, 505, 2) - 0.635;       // lilac flower meadows
    out[2] = U.fbm(X / 1150 - 7.1, Y / 1150, 404, 2) - 0.615;      // autumn clay fields
    const clear = U.fbm(X / 700 + 31.1, Y / 700, 202, 2) - 0.66;   // sandy clearings
    // winding sand paths of even width (zero-contours of low-frequency noise)
    const qx = U.perlin(x / 480, y / 480, 305) * 60, qy = U.perlin(x / 480 + 5.1, y / 480, 306) * 60;
    const pn = U.perlin((x + qx) / 1700, (y + qy) / 1700, 304);
    out[3] = Math.max(clear, (0.0175 - Math.abs(pn)) * 3.0);
    // ponds: rare and round, kept away from the spawn point; shore ring -> water -> deep centre
    const pd = U.fbm(X / 560 + 51.7, Y / 560 - 3.1, 808, 2) - 0.675 - Math.max(0, 1 - Math.hypot(x, y) / 320) * 0.3;
    out[4] = pd + 0.014; out[5] = pd; out[6] = pd - 0.03;
    out[7] = 1 + (U.noise(x / 1500, y / 1500, 606) - 0.5) * 0.07;
  }
  const FT = new Float32Array(NF);
  function matAt(x, y) {
    fieldsAt(x, y, FT);
    for (let L = NL - 1; L >= 0; L--) if (FT[L] > 0) return L + 1;
    return 0;
  }
  /** Material lookup on a chunk's field grid (bilinear); exact near the chunk border so neighbours agree. */
  function makeSampler(F, nn, x0, y0, info) {
    const B = 14;
    const ix0 = info.wx + B, ix1 = info.wx + info.size - B, iy0 = info.wy + B, iy1 = info.wy + info.size - B;
    return function (x, y) {
      if (x < ix0 || x > ix1 || y < iy0 || y > iy1) return matAt(x, y);
      const gx = (x - x0) / GSTEP, gy = (y - y0) / GSTEP, ix = gx | 0, iy = gy | 0, fx = gx - ix, fy = gy - iy;
      const o00 = (iy * nn + ix) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF;
      for (let L = NL - 1; L >= 0; L--) {
        const a = F[o00 + L] + (F[o10 + L] - F[o00 + L]) * fx, b = F[o01 + L] + (F[o11 + L] - F[o01 + L]) * fx;
        if (a + (b - a) * fy > 0) return L + 1;
      }
      return 0;
    };
  }
  const pack = (r, g, b) => (255 << 24) | ((b < 0 ? 0 : b > 255 ? 255 : b | 0) << 16) | ((g < 0 ? 0 : g > 255 ? 255 : g | 0) << 8) | (r < 0 ? 0 : r > 255 ? 255 : r | 0);

  /* ---------------------------------------------------- prop placement
     Props are composed, not sprinkled: groves (trees inside, bushes on the rim, stumps and
     mushrooms underneath), rocks and signs along paths, reed beds on pond shores, pumpkin
     patches and fences in the autumn fields, open calm meadows in between.                  */
  const PCELL = 30;
  const woodAt = (x, y) => U.fbm(x / 430 + 77.1, y / 430 - 12.4, 909, 2);
  function propAt(x, y, rng) {
    const r = rng.next(), vr = rng.next(), f = rng.next() < 0.5, sw = rng.next() * TAU;
    if (G.nearSpawn(x, y, 95)) return null;
    const m = matAt(x, y);
    let t = null, v = 0;
    if (m >= 6) return null; // open water: lily pads are ground decals
    if (m === 5) { if (r < 0.55) { t = 'reed'; v = vr < 0.6 ? 0 : 1; } else if (r < 0.63) { t = 'rock'; v = 1; } }
    else if (m <= 1) {
      const wd = woodAt(x, y);
      if (wd > 0.615) { // grove interior
        if (r < 0.5) { t = 'tree'; v = m === 1 ? (vr < 0.55 ? 4 : 0) : (vr < 0.5 ? 0 : vr < 0.8 ? 2 : 4); }
        else if (r < 0.57) t = 'stump';
        else if (r < 0.69) { t = 'mush'; v = vr < 0.65 ? 0 : 1; }
      } else if (wd > 0.565) { // grove rim
        if (r < 0.34) { t = 'bush'; v = vr < 0.55 ? 0 : 1; }
        else if (r < 0.42) { t = 'tree'; v = vr < 0.5 ? 0 : 2; }
      } else { // open meadow
        const nearPath = matAt(x + 13, y) === 4 || matAt(x - 13, y) === 4 || matAt(x, y + 13) === 4 || matAt(x, y - 13) === 4;
        if (nearPath) { if (r < 0.12) { t = 'rock'; v = (vr * 3) | 0; } else if (r < 0.15) t = 'sign'; else if (r < 0.2) { t = 'bush'; v = 0; } }
        else if (r < 0.016) { t = 'tree'; v = vr < 0.5 ? 0 : 2; }
        else if (r < 0.03) { t = 'rock'; v = (vr * 3) | 0; }
        else if (r < 0.045) { t = 'bush'; v = vr < 0.6 ? 0 : 1; }
      }
    } else if (m === 2) { // lilac meadow: mostly open, flowering bushes
      if (woodAt(x, y) > 0.6 && r < 0.3) { t = 'tree'; v = 2; }
      else if (r < 0.06) { t = 'bush'; v = 2; }
    } else if (m === 3) { // autumn field
      if (U.noise(x / 110 + 3.3, y / 110, 515) > 0.56 && r < 0.42) { t = 'pump'; v = vr < 0.6 ? 0 : 1; }
      else if (r < 0.03) t = 'hay';
      else if (r < 0.055) { t = 'tree'; v = vr < 0.5 ? 1 : 3; }
      else if (r < 0.1 && (matAt(x, y - 12) !== 3 || matAt(x, y + 12) !== 3)) t = 'fence';
    } else if (m === 4) {
      if (r < 0.025) { t = 'rock'; v = (vr * 2) | 0; } else if (r < 0.035) t = 'hay';
    }
    if (!t) return null;
    // tight cull pad: the renderer adds 60 units around the view, a prop only needs its own half-width (+ sway)
    const bx = PROP_DEF[t].box;
    return { x, y, t, v, f, sw, pad: Math.max(-bx[0], bx[2]) + 8 - 60 };
  }

  // decals ------------------------------------------------------------------
  const rgbS = (a) => 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')';
  const DEC = {
    tuft0: rgbS([126, 172, 90]), tuft1: rgbS([96, 148, 72]), tuft2: rgbS([170, 150, 192]),
    furrow: rgbS([196, 136, 94]), furrowHi: rgbS([230, 180, 132]),
  };
  function dTuft(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x - 0.5 * s, y); c.quadraticCurveTo(x - 1.0 * s, y - 1.4 * s, x - 2.1 * s, y - 2.3 * s);
    c.moveTo(x, y); c.quadraticCurveTo(x + 0.15 * s, y - 1.8 * s, x - 0.2 * s, y - 3.3 * s);
    c.moveTo(x + 0.5 * s, y); c.quadraticCurveTo(x + 1.1 * s, y - 1.3 * s, x + 2.1 * s, y - 2.1 * s);
    c.stroke();
  }
  function dFlower(c, x, y, s, petal, center) {
    c.fillStyle = petal;
    c.beginPath();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - PI / 2; const px = x + Math.cos(a) * 0.95 * s, py = y + Math.sin(a) * 0.95 * s; c.moveTo(px + 0.72 * s, py); c.arc(px, py, 0.72 * s, 0, TAU); }
    c.fill();
    c.fillStyle = center; c.beginPath(); c.arc(x, y, 0.55 * s, 0, TAU); c.fill();
  }
  function dPebble(c, x, y, rx, ry, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#b9a588'; c.beginPath(); c.ellipse(0, 0.35, rx + 0.35, ry + 0.35, 0, 0, TAU); c.fill();
    c.fillStyle = '#cdbfae'; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill();
    c.fillStyle = '#ddd2c4'; c.beginPath(); c.ellipse(-rx * 0.2, -ry * 0.25, rx * 0.7, ry * 0.6, 0, 0, TAU); c.fill();
    c.restore();
  }
  function dLeaf(c, x, y, s, a, col, vein) {
    c.fillStyle = col; c.beginPath(); leafPath(c, x, y, a, 3.2 * s, 1.3 * s); c.fill();
    c.strokeStyle = vein; c.lineWidth = 0.35; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * 2.4 * s, y - Math.cos(a) * 2.4 * s); c.stroke();
  }
  /** A clump: one big tuft and a few smaller ones around it (grass grows in tufts, not in dots). */
  function tuftClump(c, x, y, rng, col, n, s) {
    for (let i = 0; i < n; i++) {
      const a = rng() * TAU, d = i ? 1.6 + rng() * 2.6 : 0;
      dTuft(c, x + Math.cos(a) * d * 1.3, y + Math.sin(a) * d * 0.7, s * (i ? 0.65 + rng() * 0.35 : 1.25), col);
    }
  }
  function posy(c, x, y, rng, cols, center, n, s) {
    for (let i = 0; i < n; i++) {
      const a = rng() * TAU, d = Math.sqrt(rng()) * 4.4;
      dFlower(c, x + Math.cos(a) * d * 1.35, y + Math.sin(a) * d * 0.75, s * (0.75 + rng() * 0.45), cols[(rng() * cols.length) | 0], center);
    }
  }
  function lilyPad(c, x, y, r, a, flower) {
    c.save(); c.translate(x, y); c.scale(1, 0.6);
    c.fillStyle = 'rgba(40,96,130,0.28)'; c.beginPath(); c.ellipse(0.4, 1.6, r * 1.02, r, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, a + 0.32, a + TAU - 0.32); c.closePath();
    c.fillStyle = '#86c95a'; c.fill(); c.lineWidth = 0.75; c.strokeStyle = OUT; c.stroke();
    c.strokeStyle = '#a9dc7a'; c.lineWidth = 0.55; c.beginPath();
    for (const k of [1.2, 2.4, 3.6, 4.8]) { const b = a + 0.32 + k; c.moveTo(0, 0); c.lineTo(Math.cos(b) * r * 0.78, Math.sin(b) * r * 0.78); }
    c.stroke();
    c.restore();
    if (flower) dFlower(c, x + r * 0.3, y - 0.8, 0.9, '#f6bad3', '#ffd43f');
  }
  function glint(c, x, y, s) { // a resting highlight on open water
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.8;
    c.beginPath(); c.ellipse(x, y, 3.2 * s, 1.1 * s, 0, PI * 1.1, PI * 1.6); c.stroke();
    c.beginPath(); c.ellipse(x + 2.6 * s, y + 1.4 * s, 1.8 * s, 0.7 * s, 0, PI * 1.15, PI * 1.7); c.stroke();
  }
  const LEAF_COL = [['#c9773f', '#a65a2c'], ['#e3ad5c', '#bf863a'], ['#bf5f3e', '#9a4630']];
  const FLOWER_MEADOW = ['#fbf6e8', '#fbf6e8', '#f8de6c', '#f4b3c8'];
  const FLOWER_LILAC = ['#f3e9fb', '#a98bd4', '#f6bad3', '#a98bd4'];

  function* decals(ctx, info, mat) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    let n = 0;
    // A) furrow rows across the autumn fields (world-aligned, so they continue across chunks)
    const rowH = 8.5;
    for (let r = Math.floor((info.wy - 10) / rowH); r <= Math.floor((info.wy + info.size + 10) / rowH); r++) {
      if ((r & 7) === 0) yield;
      for (let x = Math.floor((info.wx - 8) / 6) * 6; x < info.wx + info.size + 8; x += 6) {
        const yy = r * rowH + Math.sin(x / 70 + r * 0.31) * 3.2;
        if (U.hash2(x, r, 77) < 0.22 || mat(x, yy) !== 3 || mat(x + 7, yy) !== 3 || mat(x, yy - 5) !== 3 || mat(x, yy + 5) !== 3) continue;
        const y2 = r * rowH + Math.sin((x + 4.6) / 70 + r * 0.31) * 3.2;
        ctx.strokeStyle = DEC.furrow; ctx.lineWidth = 1.15;
        ctx.beginPath(); ctx.moveTo(x + 0.7, yy); ctx.lineTo(x + 4.9, y2); ctx.stroke();
        ctx.strokeStyle = DEC.furrowHi; ctx.lineWidth = 0.55;
        ctx.beginPath(); ctx.moveTo(x + 0.9, yy - 0.9); ctx.lineTo(x + 4.7, y2 - 0.9); ctx.stroke();
      }
    }
    // B) the ground around props: tufts at trunks and rocks, leaf litter under autumn trees, shore pebbles at reeds
    const props = [];
    G.scatter(info, PCELL, 4242, 16, (x, y, rng) => { const p = propAt(x, y, rng); if (p) props.push(p); });
    yield;
    for (const p of props) {
      const rr = U.mulberry32(U.hashInt(p.x * 10 | 0, p.y * 10 | 0, 31));
      const g = mat(p.x, p.y), tcol = g === 1 ? DEC.tuft1 : DEC.tuft0;
      if (p.t === 'tree' && (p.v === 1 || p.v === 3)) {
        for (let i = 0; i < 7; i++) { const a = rr() * TAU, d = 5 + rr() * 9, lc = LEAF_COL[(rr() * 3) | 0]; dLeaf(ctx, p.x + Math.cos(a) * d * 1.3, p.y + Math.sin(a) * d * 0.55, 0.9 + rr() * 0.3, rr() * TAU, lc[0], lc[1]); }
      } else if ((p.t === 'tree' || p.t === 'stump' || p.t === 'fence' || p.t === 'sign') && g <= 1) {
        const k = p.t === 'tree' ? 3 : 2;
        for (let i = 0; i < k; i++) { const sd = i & 1 ? 1 : -1; tuftClump(ctx, p.x + sd * (p.t === 'fence' ? 12 + rr() * 6 : 7 + rr() * 5), p.y + 0.6 + rr() * 1.6, rr, tcol, 2 + (rr() * 2 | 0), 0.95); }
      } else if (p.t === 'rock') {
        dPebble(ctx, p.x + 9 + rr() * 3, p.y + 1.2, 1.2, 0.8, 0.3); dPebble(ctx, p.x - 10 - rr() * 2, p.y + 0.6, 0.9, 0.65, -0.2);
        if (g <= 1) tuftClump(ctx, p.x - 6, p.y + 1.4, rr, tcol, 2, 0.9);
      } else if (p.t === 'reed') {
        for (let i = 0; i < 3; i++) dPebble(ctx, p.x + (rr() - 0.5) * 16, p.y + rr() * 3, 0.8 + rr() * 0.6, 0.55 + rr() * 0.3, rr());
      }
    }
    // C) designed clumps on a coarse jittered grid: tuft clumps, flower posies, lily pads – with calm space between
    const pts = [];
    G.scatter(info, 23, 9001, 10, (x, y, rng) => pts.push(x, y, rng.next(), rng.next()));
    for (let i = 0; i < pts.length; i += 4) {
      if (++n % 30 === 0) yield;
      const x = pts[i], y = pts[i + 1], r0 = pts[i + 2], r1 = pts[i + 3];
      const m = mat(x, y);
      const rr = U.mulberry32(((r1 * 1e9) | 0) ^ 0x5bd1e995);
      const fit = (r, want) => mat(x + r, y) === want && mat(x - r, y) === want && mat(x, y + r * 0.6) === want && mat(x, y - r * 0.6) === want;
      if (m === 0) {
        const cl = U.noise(x / 80, y / 80, 611);
        const k = U.smoothstep(0.55, 0.76, cl); // drifts: dense in the heart of a patch, thinning out to calm meadow
        if (r0 < k * 0.72 && fit(6, 0)) tuftClump(ctx, x, y, rr, DEC.tuft0, 2 + (k * 3 | 0) + (r1 * 2 | 0), 0.85 + k * 0.3);
        else if (cl < 0.34 && r0 < 0.3 && fit(6, 0)) posy(ctx, x, y, rr, FLOWER_MEADOW, '#f2a23a', 3 + (r1 * 3 | 0), 0.9);
      } else if (m === 1) {
        const k = U.smoothstep(0.48, 0.7, U.noise(x / 70, y / 70, 612));
        if (r0 < k * 0.7 && fit(6, 1)) tuftClump(ctx, x, y, rr, DEC.tuft1, 2 + (k * 3 | 0) + (r1 * 2 | 0), 0.9 + k * 0.25);
      } else if (m === 2) {
        if (r0 < 0.75 && fit(5, 2)) posy(ctx, x, y, rr, FLOWER_LILAC, '#f6d36a', 4 + (r1 * 5 | 0), 0.9);
        else if (r0 > 0.9) tuftClump(ctx, x, y, rr, DEC.tuft2, 2, 0.9);
      } else if (m === 4) {
        if (r0 < 0.16 && fit(4, 4)) { dPebble(ctx, x, y, 1.5 + r1, 1.0 + r1 * 0.5, r1 - 0.5); dPebble(ctx, x + 3.2, y + 1.2, 0.9, 0.6, 0.4); }
      } else if (m === 6 || m === 7) {
        if (r0 < 0.55 && fit(8, m)) {
          const k = 1 + (r1 * 3 | 0);
          for (let j = 0; j < k; j++) lilyPad(ctx, x + (rr() - 0.5) * 9, y + (rr() - 0.5) * 5, 2.4 + rr() * 1.4, rr() * TAU, j === 0 && r1 > 0.6);
        } else if (r0 > 0.62 && fit(5, m)) glint(ctx, x, y, 0.8 + r1 * 0.4);
      }
    }
    // D) fringes along region edges: grass lips along paths, the meadow spilling over its rim, pebbles lining the sand
    const ep = [];
    G.scatter(info, 7, 9002, 4, (x, y, rng) => ep.push(x, y, rng.next(), rng.next()));
    for (let i = 0; i < ep.length; i += 4) {
      if (++n % 120 === 0) yield;
      const x = ep[i], y = ep[i + 1], r0 = ep[i + 2], r1 = ep[i + 3];
      if (r0 > 0.6) continue;
      const m = mat(x, y);
      let o = mat(x + 4.5, y);
      if (o === m) o = mat(x - 4.5, y);
      if (o === m) o = mat(x, y + 4.5);
      if (o === m) o = mat(x, y - 4.5);
      if (o === m) continue;
      if (m === 1 && o === 0 && r0 < 0.5) dTuft(ctx, x, y, 0.9 + r1 * 0.4, DEC.tuft1);
      else if (m === 0 && o === 2 && r0 < 0.4) dFlower(ctx, x, y, 0.75 + r1 * 0.3, FLOWER_LILAC[(r1 * 4) | 0], '#f6d36a');
      else if (m <= 1 && o === 4 && r0 < 0.42) dTuft(ctx, x, y, 0.8 + r1 * 0.3, m ? DEC.tuft1 : DEC.tuft0);
      else if (m <= 1 && o === 5 && r0 < 0.5) dTuft(ctx, x, y, 0.9 + r1 * 0.4, DEC.tuft1);
      else if (m === 4 && o <= 3 && r0 < 0.16) dPebble(ctx, x, y, 0.9 + r1 * 0.7, 0.6 + r1 * 0.3, r1 * 2);
      else if (m === 5 && r0 < 0.22) dPebble(ctx, x, y, 0.8 + r1 * 0.6, 0.55 + r1 * 0.3, r1 * 3);
      else if (m === 3 && o !== 3 && r0 < 0.2) { const lc = LEAF_COL[(r1 * 3) | 0]; dLeaf(ctx, x, y, 0.9, r1 * TAU, lc[0], lc[1]); }
    }
  }

  /* ========================================================== draw helpers */
  let TV = null;
  const TF = { S: 1, ox: 0, oy: 0 };
  function tf(view) {
    if (TV !== view) { TV = view; TF.S = view.S; TF.ox = view.W / 2 - view.x * view.S; TF.oy = view.H / 2 - view.y * view.S; }
    return TF;
  }
  function blit(ctx, s, x, y, sx, sy) {
    const k = 1 / K;
    ctx.drawImage(s.c, x - s.ox * k * sx, y - s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
  }
  function blitRot(ctx, V, s, x, y, sx, sy, rot) {
    const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
    ctx.setTransform(co, si, -si, co, V.ox + x * S, V.oy + y * S);
    const k = 1 / K;
    ctx.drawImage(s.c, -s.ox * k * sx, -s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }

  // batched flat shadows (one translucent union per frame)
  let shView = null, shPending = false;
  function flushShadows(ctx) {
    if (!shPending) return;
    shPending = false;
    ctx.fillStyle = 'rgba(50,30,72,0.2)';
    ctx.fill();
  }

  // damage-number sprites (cached per value; Lilita One once loaded)
  const numCache = new Map();
  let fontOK = false, fontCheckT = -1;
  function fontReady(rt) {
    if (fontOK) return true;
    if (rt - fontCheckT < 0.5 && fontCheckT >= 0) return false;
    fontCheckT = rt;
    if (document.fonts) {
      document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === 'Lilita One' && f.status === 'loaded') fontOK = true; });
    }
    if (fontOK) numCache.clear();
    return fontOK;
  }
  function numSprite(value, crit, rt) {
    const ok = fontReady(rt);
    const key = value + (crit ? 'c' : 'n') + (ok ? 'L' : 'F');
    let s = numCache.get(key);
    if (s) return s;
    if (numCache.size > 500) numCache.clear();
    const fs = (crit ? 12.5 : 9) * K;
    const font = (ok ? '' : 'bold ') + fs + 'px "Lilita One", "Fredoka", "Arial Rounded MT Bold", sans-serif';
    const meas = U.canvas(4, 4).ctx;
    meas.font = font;
    const txt = String(value);
    const w = Math.ceil(meas.measureText(txt).width + fs * 0.7), h = Math.ceil(fs * 1.55);
    const { c, ctx } = U.canvas(w, h);
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const cx = w / 2, cy = h / 2 - fs * 0.04;
    ctx.strokeStyle = OUT; ctx.lineWidth = fs * 0.3;
    ctx.strokeText(txt, cx, cy + fs * 0.09);
    ctx.fillStyle = OUT; ctx.fillText(txt, cx, cy + fs * 0.09);
    ctx.strokeText(txt, cx, cy);
    if (crit) {
      const g = ctx.createLinearGradient(0, cy - fs * 0.45, 0, cy + fs * 0.4);
      g.addColorStop(0, '#fff27a'); g.addColorStop(0.5, '#ffc93a'); g.addColorStop(1, '#ff8a2a');
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#ffffff';
    ctx.fillText(txt, cx, cy);
    s = { c, ox: w / 2, oy: h / 2 };
    numCache.set(key, s);
    return s;
  }

  /* ================================================================ icons */
  function iconPaint(ctx, fn) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'outline', 2.6));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'fill', 2.6));
  }
  const seedIcon = (P, x, y, a, s) => P.part((c) => { c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s); seedPath(c); c.restore(); }, C.cream, {
    shade: C.creamSh, sh: [-1.2, -1.2],
    detail(c) { c.save(); c.translate(x, y); c.rotate(a); c.scale(s * 0.62, s * 0.55); c.beginPath(); seedPath(c); c.restore(); c.strokeStyle = 'rgba(205,160,92,.85)'; c.lineWidth = 1.2; c.stroke(); },
    hi: [x - Math.cos(a) * s * 1.2 + Math.sin(a) * s * 1.2, y - Math.sin(a) * s * 1.2 - Math.cos(a) * s * 1.2, s * 1.3, s * 0.55, a],
  });
  const sparkIcon = (P, x, y, r) => P.part((c) => {
    c.moveTo(x, y - r); c.quadraticCurveTo(x + r * 0.14, y - r * 0.14, x + r, y); c.quadraticCurveTo(x + r * 0.14, y + r * 0.14, x, y + r);
    c.quadraticCurveTo(x - r * 0.14, y + r * 0.14, x - r, y); c.quadraticCurveTo(x - r * 0.14, y - r * 0.14, x, y - r); c.closePath();
  }, '#ffd43f', { ol: 1.6, shade: '#f39a1e', sh: [-1, -1] });
  const ICONS = {
    'hp-heart'(P) {
      P.part((c) => {
        c.moveTo(24, 42); c.bezierCurveTo(10, 33, 4.5, 25, 4.5, 17); c.bezierCurveTo(4.5, 10, 9.5, 5.5, 15.5, 5.5);
        c.bezierCurveTo(19.5, 5.5, 22.5, 8, 24, 11.5); c.bezierCurveTo(25.5, 8, 28.5, 5.5, 32.5, 5.5);
        c.bezierCurveTo(38.5, 5.5, 43.5, 10, 43.5, 17); c.bezierCurveTo(43.5, 25, 38, 33, 24, 42); c.closePath();
      }, '#ff5d6c', { shade: '#d73a55', sh: [-3, -3], hi: [13.5, 13, 4.2, 2.4, -0.7], hi2: [19.5, 9.5, 1.2] });
    },
    kills(P) {
      const col = { top: '#9b5cd0', topSh: '#7241aa', bot: '#f8eacb', botSh: '#e0c595' };
      P.part((c) => leafPath(c, 24, 13, -0.7, 10, 3.6), C.leaf, { shade: C.leafSh, sh: [-1, -1] });
      P.part((c) => leafPath(c, 24, 13, 0.7, 10, 3.6), C.leaf, { shade: C.leafSh, sh: [-1, -1] });
      P.part((c) => leafPath(c, 24, 13, 0, 11.5, 4), C.leaf, { shade: C.leafSh, sh: [-1, -1] });
      P.part((c) => turnipPath(c, 24, 11, 44, 16), (c, sh) => {
        c.fillStyle = sh ? col.botSh : col.bot; c.fillRect(-99, -99, 300, 300);
        c.fillStyle = sh ? col.topSh : col.top; c.beginPath(); c.moveTo(-10, -10); c.lineTo(60, -10); c.lineTo(60, 28);
        for (let x = 60; x >= -10; x -= 1) c.lineTo(x, 28 + 1.6 * Math.sin(x * 0.5)); c.closePath(); c.fill();
      }, { sh: [-3, -2.6], hi: [15, 20, 3.4, 1.8, -0.7] });
      P.detail((c) => {
        c.strokeStyle = OUT; c.lineWidth = 2.6; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(15.5, 22); c.lineTo(20.5, 27); c.moveTo(20.5, 22); c.lineTo(15.5, 27);
        c.moveTo(27.5, 22); c.lineTo(32.5, 27); c.moveTo(32.5, 22); c.lineTo(27.5, 27);
        c.stroke();
        c.lineWidth = 2.2; c.beginPath(); c.moveTo(19, 35); c.quadraticCurveTo(21.5, 32.5, 24, 35); c.quadraticCurveTo(26.5, 37.5, 29, 35); c.stroke();
      });
    },
    dmg(P) {
      sparkIcon(P, 36, 11, 7.5);
      seedIcon(P, 21, 27, -0.75, 3.6);
      sparkIcon(P, 40, 26, 4.2);
      P.detail((c) => { c.strokeStyle = '#ff5d6c'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(8, 9); c.lineTo(12, 13); c.moveTo(6, 17); c.lineTo(11, 17.5); c.moveTo(14, 6); c.lineTo(15, 11); c.stroke(); });
    },
    rate(P) {
      P.part((c) => roundPoly(c, [[27, 3], [11, 26], [22, 26], [17, 45], [37, 19], [26, 19], [32, 3]], 1.4), '#ffd43f', { shade: '#f39a1e', sh: [-2.4, -2.4], hi: [24, 9, 2.4, 1.1, -1.0] });
      P.detail((c) => { c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.globalAlpha = 0.95; c.beginPath(); c.moveTo(4, 34); c.lineTo(11, 34); c.moveTo(6, 40); c.lineTo(13, 40); c.moveTo(39, 30); c.lineTo(45, 30); c.stroke(); });
    },
    multi(P) {
      seedIcon(P, 17, 12, -1.9, 2.6);
      seedIcon(P, 31, 11, -1.2, 2.6);
      seedIcon(P, 24, 9, -1.55, 2.8);
      P.part((c) => { c.moveTo(12, 17); c.bezierCurveTo(3, 24, 4, 44, 24, 44); c.bezierCurveTo(44, 44, 45, 24, 36, 17); c.closePath(); }, '#ff952b', {
        shade: '#ea681c', sh: [-3, -2.6],
        detail(c) { c.strokeStyle = '#ea681c'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(17, 22); c.quadraticCurveTo(13, 32, 17, 42); c.moveTo(31, 22); c.quadraticCurveTo(35, 32, 31, 42); c.stroke(); },
        hi: [13.5, 27, 2.2, 3.4, 0.2],
      });
      P.part((c) => rrect(c, 9.5, 14.5, 29, 6.5, 3), '#8ad04c', { shade: '#5ea83a', sh: [-1, -1.4], inner: 1.2 });
      P.part(E(24, 17.8, 3.2, 3.0), '#ffd43f', { shade: '#f39a1e', sh: [-0.8, -0.8], inner: 1.2 });
    },
    bounce(P) {
      P.detail((c) => { c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.setLineDash([3.5, 4.5]); c.beginPath(); c.moveTo(5, 40); c.quadraticCurveTo(12, 6, 24, 15); c.stroke(); c.setLineDash([]); });
      P.part((c) => rrect(c, 10, 39, 28, 6, 3), '#5f6f94', { shade: '#45527a', sh: [0, -1.4] });
      P.part((c) => {
        for (let i = 0; i < 4; i++) { const y = 37 - i * 4.6; c.moveTo(13, y); c.ellipse(24, y, 11, 2.2, 0, PI, TAU); c.ellipse(24, y, 11, 2.2, 0, 0, PI); }
      }, '#46c4b4', { ol: 2.0, shade: '#2c9688', sh: [-1, -1] });
      seedIcon(P, 26, 15, -1.25, 3.0);
      sparkIcon(P, 39, 8, 4.8);
    },
    lantern(P) {
      const c = P.ctx;
      c.save(); c.translate(24, 44); c.scale(2.35, 2.35);
      const sub = new Painter(c, P.mode, 2.6 / 2.35);
      lanternParts(sub);
      c.restore();
      if (P.mode === 'fill') { c.save(); c.globalCompositeOperation = 'destination-over'; const g = c.createRadialGradient(24, 26, 2, 24, 26, 24); g.addColorStop(0, 'rgba(255,214,90,0.85)'); g.addColorStop(1, 'rgba(255,214,90,0)'); c.fillStyle = g; c.fillRect(0, 0, 48, 48); c.restore(); }
    },
    speed(P) {
      P.detail((c) => { c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(2, 22); c.lineTo(9, 22); c.moveTo(3, 29); c.lineTo(8, 29); c.stroke(); });
      P.part((c) => { c.moveTo(11, 33); c.bezierCurveTo(10, 24, 20, 21, 26, 24); c.bezierCurveTo(31, 26, 34, 29, 42, 30); c.bezierCurveTo(46, 31, 46, 37, 42, 37); c.lineTo(15, 37); c.lineTo(15, 42); c.lineTo(11, 42); c.closePath(); }, '#8fe3f2', {
        shade: '#4fb6d6', sh: [-2, -2],
        detail(c) { c.fillStyle = '#5ac1dc'; c.beginPath(); c.ellipse(21, 27, 5.5, 2.2, 0.15, 0, TAU); c.fill(); },
        hi: [16, 28, 2.2, 1.0, -0.8], hi2: [36, 31.5, 1.0],
      });
      P.part(E(26, 23.5, 3.2, 2.4), '#ff8fb4', { shade: '#e4628f', sh: [-0.8, -0.8], inner: 1.2 });
      sparkIcon(P, 37, 12, 6);
      sparkIcon(P, 13, 11, 3.4);
    },
    magnet(P) {
      P.detail((c) => { c.strokeStyle = OUT; c.lineWidth = 6.6; c.beginPath(); c.arc(24, 24, 14, PI * 1.08, PI * 1.92); c.stroke(); c.strokeStyle = '#c98a4e'; c.lineWidth = 3.2; c.beginPath(); c.arc(24, 24, 14, PI * 1.08, PI * 1.92); c.stroke(); }, true);
      P.part(E(17, 22, 5.5, 5), '#74e690', { shade: '#2fae66', sh: [-1, -1], hi: [15, 20, 1.6, 0.9, -0.6] });
      pumpkinIcon(P, 29, 21, 7, 5.6);
      P.part((c) => { c.moveTo(5, 24); c.lineTo(43, 24); c.lineTo(38, 43); c.lineTo(10, 43); c.closePath(); }, '#d69a5a', {
        shade: '#ad7038', sh: [-2.4, -2.2],
        detail(c) {
          c.strokeStyle = '#ad7038'; c.lineWidth = 1.4;
          c.beginPath(); for (let y = 29; y < 43; y += 5) { c.moveTo(4, y); c.lineTo(44, y); } c.stroke();
          c.beginPath(); for (let x = 9; x < 42; x += 6) { c.moveTo(x, 24); c.lineTo(x + (24 - x) * 0.15, 44); } c.stroke();
        },
      });
      P.part((c) => rrect(c, 3, 21.5, 42, 5, 2.5), '#e8b072', { shade: '#c38450', sh: [0, -1.2], inner: 1.2 });
    },
    hp(P) {
      P.detail((c) => {
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.globalAlpha = 0.95;
        c.beginPath(); c.moveTo(17, 14); c.bezierCurveTo(13, 10, 21, 7, 17, 2); c.moveTo(28, 14); c.bezierCurveTo(24, 10, 32, 7, 28, 2); c.stroke();
      });
      P.part((c) => rrect(c, 3, 18, 6, 5, 2), '#5f6f94', { shade: '#45527a', sh: [0, -1] });
      P.part((c) => rrect(c, 39, 18, 6, 5, 2), '#5f6f94', { shade: '#45527a', sh: [0, -1] });
      P.part((c) => { c.moveTo(6, 17); c.lineTo(42, 17); c.bezierCurveTo(43, 38, 38, 44, 24, 44); c.bezierCurveTo(10, 44, 5, 38, 6, 17); c.closePath(); }, '#6f80a8', {
        shade: '#4c5a82', sh: [-3, -2.4], hi: [12, 25, 1.8, 4, 0.1],
      });
      P.part(E(24, 17.5, 18, 4.2), '#ff9a3c', {
        shade: '#e8742a', sh: [0, 1.2], inner: 1.2,
        detail(c) { c.fillStyle = '#9b5cd0'; c.beginPath(); c.arc(17, 17, 2.6, 0, TAU); c.fill(); c.fillStyle = '#f8eacb'; c.beginPath(); c.arc(29, 18, 2.3, 0, TAU); c.fill(); c.fillStyle = '#8ad04c'; c.beginPath(); c.arc(23.5, 16, 1.6, 0, TAU); c.fill(); },
      });
    },
  };
  function pumpkinIcon(P, cx, cy, rx, ry) {
    P.part(CAP(cx, cy - ry + 1, cx + 1.2, cy - ry - 3, 1.5), C.stem, { shade: C.stemSh, sh: [-0.6, -0.4] });
    P.part((c) => pumpkinPath(c, cx, cy, rx, ry), C.pump, { shade: C.pumpSh, sh: [-1.6, -1.4], detail(c) { ribs(c, cx, cy, rx, ry, C.pumpSh, 1.0); }, hi: [cx - rx * 0.5, cy - ry * 0.4, 1.6, 0.9, -0.6] });
  }

  /* ================================================================== CSS */
  function tso(w, col, drop) {
    const a = [];
    for (let i = 0; i < 16; i++) { const t = (i / 16) * TAU; a.push((Math.cos(t) * w).toFixed(1) + 'px ' + (Math.sin(t) * w).toFixed(1) + 'px 0 ' + col); }
    if (drop) { a.push('0 ' + (w + drop) + 'px 0 ' + col); a.push(w * 0.7 + 'px ' + (w * 0.7 + drop) + 'px 0 ' + col); a.push(-w * 0.7 + 'px ' + (w * 0.7 + drop) + 'px 0 ' + col); }
    return a.join(',');
  }
  const P_ = '#3a2240';
  const CSS = `
body.style-cartoon { font-family: 'Fredoka', 'Baloo 2', system-ui, sans-serif; }
body.style-cartoon #hud { padding: 14px 22px; }
body.style-cartoon #hud .xp { height: 26px; background: #563a5e; border: 4px solid ${P_}; border-radius: 15px; box-shadow: 0 4px 0 ${P_}, inset 0 4px 0 rgba(0,0,0,.22); overflow: hidden; }
body.style-cartoon #hud .xp-fill { background: linear-gradient(180deg, #9af7d8 0%, #45d6ad 50%, #2cb892 100%); border-radius: 0 11px 11px 0; box-shadow: inset 0 -3px 0 rgba(0,0,0,.12); }
body.style-cartoon #hud .xp-fill::after { content: ''; position: absolute; left: 8px; right: 10px; top: 3px; height: 4px; border-radius: 3px; background: rgba(255,255,255,.62); }
body.style-cartoon #hud .lvl { right: 12px; font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 18px; letter-spacing: .5px; color: #fff; text-shadow: ${tso(2, P_)}; }
body.style-cartoon #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 14px; }
body.style-cartoon #hud .hp { position: relative; gap: 6px; justify-self: start; }
body.style-cartoon #hud .hp-icon, body.style-cartoon #hud .kills-icon { width: 46px; height: 46px; filter: drop-shadow(0 3px 0 rgba(58,34,64,.35)); }
body.style-cartoon #hud .hp-bar { width: 260px; height: 32px; background: #563a5e; border: 4px solid ${P_}; border-radius: 17px; box-shadow: 0 4px 0 ${P_}, inset 0 4px 0 rgba(0,0,0,.25); }
body.style-cartoon #hud .hp-fill { background: linear-gradient(180deg, #ff9a9a 0%, #ff5466 48%, #df3550 100%); border-radius: 0 13px 13px 0; box-shadow: inset 0 -3px 0 rgba(0,0,0,.12); }
body.style-cartoon #hud .hp-fill::after { content: ''; position: absolute; left: 9px; right: 12px; top: 4px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.55); }
body.style-cartoon #hud .hp-text { position: absolute; left: 52px; width: 260px; top: 50%; transform: translateY(-50%); text-align: center; font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 18px; letter-spacing: .5px; color: #fff; text-shadow: ${tso(2, P_)}; }
body.style-cartoon.hurt #hud .hp { animation: cartoonShake .22s linear; }
@keyframes cartoonShake { 0%,100% { transform: none } 25% { transform: translate(-3px,1px) rotate(-1deg) } 75% { transform: translate(3px,-1px) rotate(1deg) } }
body.style-cartoon #hud .clock { justify-self: center; background: #fff4de; border: 4px solid ${P_}; border-radius: 20px; padding: 2px 24px 7px; box-shadow: 0 5px 0 ${P_}; margin-top: -4px; }
body.style-cartoon #hud .clock-time { font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 36px; line-height: 1.1; letter-spacing: 1.5px; color: #ff8a2a; text-shadow: ${tso(2.5, P_, 2)}; }
body.style-cartoon #hud .clock-label { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 12px; letter-spacing: 1.6px; opacity: 1; color: #8a6280; }
body.style-cartoon #hud .kills { justify-self: end; min-width: 0; gap: 4px; padding: 2px 18px 2px 6px; background: #fff4de; border: 4px solid ${P_}; border-radius: 20px; box-shadow: 0 5px 0 ${P_}; font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 26px; color: ${P_}; text-shadow: none; }
body.style-cartoon #hud .kills-icon { width: 42px; height: 42px; filter: none; }
body.style-cartoon #stylebar { background: #fff4de; color: ${P_}; border: 4px solid ${P_}; box-shadow: 0 4px 0 ${P_}; padding: 5px 20px; font-family: 'Fredoka', sans-serif; font-weight: 600; gap: 14px; bottom: 14px; }
body.style-cartoon #stylebar .style-family { color: #9a7090; opacity: 1; font-weight: 700; }
body.style-cartoon #stylebar .style-name { font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 20px; letter-spacing: .5px; color: #ff8a2a; text-shadow: ${tso(2, P_)}; }
body.style-cartoon #stylebar .style-hint { opacity: .8; }
body.style-cartoon #stylebar .auto.on { color: #24a882; }
body.style-cartoon #levelup { gap: 30px; background:
  radial-gradient(ellipse at 50% 42%, rgba(255,214,120,.28), rgba(255,214,120,0) 60%),
  repeating-conic-gradient(from 0deg at 50% 40%, rgba(255,238,200,.09) 0deg 9deg, rgba(255,238,200,0) 9deg 18deg),
  rgba(72,36,104,.6); -webkit-backdrop-filter: saturate(.2) brightness(.78); backdrop-filter: saturate(.2) brightness(.78); }
body.style-cartoon #levelup .lu-title { font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 78px; letter-spacing: 3px; color: #ffd43f; text-shadow: ${tso(5, P_, 5)}; transform: rotate(-3deg); animation: cartoonPop .55s cubic-bezier(.3,1.7,.5,1) backwards; }
@keyframes cartoonPop { from { transform: scale(.2) rotate(-14deg); } to { transform: scale(1) rotate(-3deg); } }
body.style-cartoon #levelup .lu-cards { gap: 26px; }
body.style-cartoon #levelup .card { width: 236px; min-height: 304px; padding: 0 18px 24px; gap: 8px; color: ${P_};
  background: linear-gradient(180deg, #ffd27f 0, #ffb24c 92px, #fff6e4 92px); border: 5px solid ${P_}; border-radius: 28px;
  box-shadow: 0 9px 0 ${P_}, 0 18px 30px rgba(20,8,30,.35); transition: transform .14s cubic-bezier(.3,1.6,.5,1); animation: cartoonCard .5s cubic-bezier(.3,1.5,.5,1) backwards; }
body.style-cartoon #levelup .card:nth-child(2) { animation-delay: .07s; background: linear-gradient(180deg, #9af0d6 0, #45d0aa 92px, #fff6e4 92px); }
body.style-cartoon #levelup .card:nth-child(3) { animation-delay: .14s; background: linear-gradient(180deg, #d4b6ff 0, #a982ea 92px, #fff6e4 92px); }
@keyframes cartoonCard { from { transform: translateY(60px) scale(.7); opacity: 0; } to { transform: none; opacity: 1; } }
body.style-cartoon #levelup .card:hover { transform: translateY(-10px) rotate(-1.5deg) scale(1.03); }
body.style-cartoon #levelup .card-icon { width: 124px; height: 124px; margin-top: 26px; padding: 9px; background: radial-gradient(circle at 38% 32%, #ffffff, #fff1d2 65%, #ffe2a8); border: 5px solid ${P_}; border-radius: 50%; box-shadow: 0 5px 0 ${P_}; }
body.style-cartoon #levelup .card-name { margin-top: 6px; font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 25px; letter-spacing: .5px; line-height: 1.1; color: ${P_}; }
body.style-cartoon #levelup .card-desc { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 17px; line-height: 1.25; opacity: 1; color: #7d5975; }
body.style-cartoon #levelup .card-key { top: 12px; left: 14px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #fff6e4; border: 4px solid ${P_}; font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 17px; opacity: 1; color: ${P_}; }
body.style-cartoon #levelup .lu-hint { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 17px; opacity: 1; color: #fff4de; text-shadow: ${tso(2, P_)}; }
body.style-cartoon #gameover { background: radial-gradient(ellipse at 50% 46%, rgba(120,70,170,.0) 0%, rgba(40,18,58,.55) 75%), rgba(70,40,105,.5); -webkit-backdrop-filter: grayscale(1) brightness(.62) blur(2px); backdrop-filter: grayscale(1) brightness(.62) blur(2px); gap: 18px; }
body.style-cartoon #gameover .go-title { font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 80px; color: #ff8a2a; letter-spacing: 2px; text-shadow: ${tso(5, P_, 5)}; transform: rotate(-2deg); }
body.style-cartoon #gameover .go-stats { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 20px; opacity: 1; color: ${P_}; background: #fff4de; border: 4px solid ${P_}; border-radius: 20px; padding: 10px 24px; box-shadow: 0 5px 0 ${P_}; }
body.style-cartoon #gameover .go-hint { font-family: 'Lilita One', 'Fredoka', sans-serif; font-size: 22px; opacity: 1; color: #fff4de; background: #ff8a2a; border: 4px solid ${P_}; border-radius: 999px; padding: 6px 22px; box-shadow: 0 5px 0 ${P_}; text-shadow: ${tso(2, P_)}; }
body.style-cartoon #pausebox { font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 72px; color: #ffd43f; text-shadow: ${tso(4, P_, 4)}; }
`;

  /* ============================================================== particles */
  function puff(game, x, y, z, tint, size, vx, vy, life, rise) {
    return game.addParticle({ kind: 'puff', x, y, z, vx, vy, drag: 5, life, size, tint, rise: rise || 6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 2 });
  }

  /* ================================================================ style */
  /** Sprite at world (x, y) = its anchor; mirrored with flip = -1, squashed sx/sy, rotated about the anchor. */
  function blitM(ctx, V, s, x, y, sx, sy, rot, flip) {
    const S = V.S, co = Math.cos(rot), si = Math.sin(rot);
    ctx.setTransform(co * sx * flip * S, si * sx * flip * S, -si * sy * S, co * sy * S, V.ox + x * S, V.oy + y * S);
    const k = 1 / K;
    ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }
  const spr = (c, s) => c.drawImage(s.c, -s.ox / K, -s.oy / K, s.c.width / K, s.c.height / K);

  /* ---- main character rig: body drawn live each frame in the same outline language
          (OUT stroke pass, then shade + offset lit fill), head / stem / leaf are baked sprites ---- */
  function hLimb(c, x1, y1, x2, y2, r, col, sh, fl, back, pass) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
    if (pass === 0) { c.strokeStyle = OUT; c.lineWidth = 2 * (r + OL); c.stroke(); return; }
    c.strokeStyle = fl ? FLASH_SH : sh; c.lineWidth = 2 * r; c.stroke();
    if (back) return;
    const o = 0.25 * r;
    c.beginPath(); c.moveTo(x1 - o, y1 - o); c.lineTo(x2 - o, y2 - o);
    c.strokeStyle = fl ? '#fff' : col; c.lineWidth = 1.2 * r; c.stroke();
  }
  function hBlob(c, x, y, rx, ry, rot, col, sh, fl, pass, back) {
    c.beginPath();
    if (pass === 0) { c.ellipse(x, y, rx + OL, ry + OL, rot, 0, TAU); c.fillStyle = OUT; c.fill(); return; }
    c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fillStyle = fl ? FLASH_SH : sh; c.fill();
    if (back) return;
    c.beginPath(); c.ellipse(x - rx * 0.17, y - ry * 0.17, rx * 0.8, ry * 0.8, rot, 0, TAU); c.fillStyle = fl ? '#fff' : col; c.fill();
  }
  function hArm(c, x, y, a, fl, back) {
    const hx = x + Math.sin(a) * 3.4, hy = y + Math.cos(a) * 3.4;
    for (let pass = 0; pass < 2; pass++) { hLimb(c, x, y, hx, hy, 1.15, C.coat, C.coatSh, fl, back, pass); hBlob(c, hx, hy, 1.5, 1.5, 0, C.cream, C.creamSh, fl, pass, back); }
  }
  function hLeg(c, hx, hy, f, fl, back) {
    const ax = f[0], ay = f[1] - 1.3;
    for (let pass = 0; pass < 2; pass++) { hLimb(c, hx, hy, ax, ay, 1.35, C.leg, C.legSh, fl, back, pass); hBlob(c, ax + 0.7, ay + 0.25, 2.1, 1.35, f[2], C.shoe, C.shoeSh, fl, pass, back); }
    if (!fl && !back) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(ax + 0.1, ay - 0.35, 0.75, 0.36, f[2], 0, TAU); c.fill(); }
  }
  function hTorso(c, by, fl) {
    const y = -8.3 + by;
    c.fillStyle = OUT; c.beginPath(); c.ellipse(0, y, 4.5 + OL, 4.4 + OL, 0, 0, TAU); c.fill();
    c.fillStyle = fl ? FLASH_SH : C.coatSh; c.beginPath(); c.ellipse(0, y, 4.5, 4.4, 0, 0, TAU); c.fill();
    c.fillStyle = fl ? '#fff' : C.coat; c.beginPath(); c.ellipse(-0.75, y - 0.65, 3.65, 3.55, 0, 0, TAU); c.fill();
    if (fl) return;
    c.fillStyle = C.cream; c.beginPath(); c.arc(1.9, y + 0.9, 0.55, 0, TAU); c.arc(2.0, y + 2.9, 0.55, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-2.0, y - 1.9, 1.1, 0.55, -0.6, 0, TAU); c.fill();
  }
  function hCollar(c, by, fl) {
    const y = -11.0 + by;
    for (let pass = 0; pass < 2; pass++) { hBlob(c, -2.6, y - 0.1, 1.6, 1.5, 0, C.scarf, C.scarfSh, fl, pass); hBlob(c, 0.3, y, 5.7, 2.3, 0, C.scarf, C.scarfSh, fl, pass); }
    if (fl) return;
    c.strokeStyle = C.scarfHi; c.lineWidth = 1.0; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(1.6, y - 1.6); c.lineTo(1.9, y + 1.5); c.moveTo(3.8, y - 1.3); c.lineTo(4.1, y + 1.3); c.stroke();
    c.lineCap = 'round';
  }
  function hScarf(c, by, a1, a2, fl) {
    const kx = -2.6, ky = -11.0 + by;
    const x1 = kx - Math.sin(a1) * 3.9, y1 = ky + Math.cos(a1) * 3.9;
    const x2 = x1 - Math.sin(a2) * 4.1, y2 = y1 + Math.cos(a2) * 4.1;
    const path = () => { c.beginPath(); c.moveTo(kx, ky); c.quadraticCurveTo(x1, y1, x2, y2); };
    c.lineCap = 'butt';
    path(); c.strokeStyle = OUT; c.lineWidth = 2.9 + 2 * OL; c.stroke();
    path(); c.strokeStyle = fl ? FLASH_SH : C.scarfSh; c.lineWidth = 2.9; c.stroke();
    if (!fl) {
      c.save(); c.translate(-0.3, -0.35); path(); c.strokeStyle = C.scarf; c.lineWidth = 1.8; c.stroke(); c.restore();
      // knitted stripes: three short bands across the tail (point on the quadratic curve, normal to it)
      c.strokeStyle = C.scarfHi; c.lineWidth = 0.95; c.beginPath();
      for (const t of [0.3, 0.58, 0.86]) {
        const u = 1 - t, px = u * u * kx + 2 * u * t * x1 + t * t * x2, py = u * u * ky + 2 * u * t * y1 + t * t * y2;
        let tx = 2 * u * (x1 - kx) + 2 * t * (x2 - x1), ty = 2 * u * (y1 - ky) + 2 * t * (y2 - y1);
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        c.moveTo(px - ty * 1.35, py + tx * 1.35); c.lineTo(px + ty * 1.35, py - tx * 1.35);
      }
      c.stroke();
    }
    c.lineCap = 'round';
    const dx = -Math.sin(a2), dy = Math.cos(a2), nx = dy, ny = -dx;
    c.strokeStyle = OUT; c.lineWidth = 0.8;
    c.beginPath(); for (const t of [-0.9, 0, 0.9]) { const ex = x2 + nx * t * 1.1, ey = y2 + ny * t * 1.1; c.moveTo(ex, ey); c.lineTo(ex + dx * 1.6, ey + dy * 1.6); } c.stroke();
  }
  function heroState(p, rt) {
    let s = p._cs;
    if (!s) {
      s = p._cs = { t: rt, face: p.facing, turn: 9, sa: 0.4, sv: 0, sb: 0.5, sbv: 0, la: 0, lv: 0, pb: 0, ph: 0, hop: -1, up: 0,
        seed: U.fract(Math.sin(p.x * 12.9898 + p.y * 78.233 + 1.7) * 43758.5453) };
    }
    return s;
  }
  /** White silhouette left behind by the dash (head flash sprite + body blob). */
  function heroGhost(ctx, x, y, fx, sx, sy, lean, alpha) {
    ctx.globalAlpha = alpha;
    ctx.save(); ctx.translate(x, y); ctx.rotate(lean * fx); ctx.scale(fx * sx * JACK_SCALE, sy * JACK_SCALE);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, -7.4, 4.9, 5.2, 0, 0, TAU); ctx.fill();
    ctx.translate(0.3, -11.0); spr(ctx, SPR.hero.f);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  function drawHero(ctx, V, p, rt, game) {
    const s = heroState(p, rt);
    const dt = U.clamp(rt - s.t, 0, 0.05); s.t = rt;
    if (p.facing !== s.face) { s.face = p.facing; s.turn = 0; } else s.turn += dt;
    let by = 0, lean = 0, sx = 1, sy = 1, lift = 0, hdy = 0, hrot = 0, face = 'n', scarfT = 0.4, fl = false, wheel = 0;
    let fF = [2.3, 0, 0], fB = [-2.3, 0, 0], aF = 0.14, aB = -0.12;
    const br = Math.sin(rt * TAU / 2.6 + s.seed * 6.3);
    const bodyBob = (b) => (b > 0 ? b * 0.75 : b * 1.35);
    const dash = p.dashT > 0 ? U.clamp(1 - p.dashT / 0.2, 0, 1) : -1;
    let go = 0;
    if (dash >= 0) {
      // anticipation squash -> long stretch + lean with a leg wheel -> landing squash
      const sq = dash < 0.15 ? Math.sin(PI * dash / 0.15) : 0;
      go = dash < 0.1 ? 0 : dash < 0.8 ? sstep((dash - 0.1) / 0.12) : 1 - sstep((dash - 0.8) / 0.2);
      const land = dash > 0.8 ? Math.sin(PI * (dash - 0.8) / 0.2) : 0;
      sx = 1 + 0.12 * sq + 0.22 * go + 0.1 * land; sy = 1 - 0.14 * sq - 0.1 * go - 0.1 * land;
      lean = -0.08 * sq + 0.32 * go; by = 0.9 * sq + 0.6 * land;
      const w = rt * 38;
      const wf = [1.0 + Math.cos(w) * 3.0, -1.6 - Math.sin(w) * 1.5, -0.3], wb = [-1.0 + Math.cos(w + PI) * 3.0, -1.6 - Math.sin(w + PI) * 1.5, -0.3];
      fF = [U.lerp(2.3, wf[0], go), U.lerp(0, wf[1], go), wf[2] * go]; fB = [U.lerp(-2.3, wb[0], go), U.lerp(0, wb[1], go), wb[2] * go];
      aF = U.lerp(0.5 * sq + 0.14, -1.45, go); aB = U.lerp(-0.12, -1.75, go);
      face = 'e'; scarfT = 1.75; hrot = 0.07 * go; wheel = go;
      s.hop = -1;
    } else if (p.moving) {
      // trot: contact -> down -> passing -> up, counter-swinging arms, head lags the body
      const ph = p.anim * 0.21 + s.seed, step = ph * 2;
      const b = stepBob(step);
      by = bodyBob(b);
      sx = b > 0 ? 1 + 0.075 * b : 1 + 0.02 * b; sy = b > 0 ? 1 - 0.085 * b : 1 - 0.03 * b;
      lean = 0.075;
      const A = footCycle(ph), B = footCycle(ph + 0.5);
      fF = [1.6 + A[0] * 3.1, -A[1] * 2.5, A[2]]; fB = [-1.6 + B[0] * 3.1, -B[1] * 2.5, B[2]];
      const sw = Math.cos(TAU * (ph - 0.07));
      aF = -0.9 * sw + 0.15; aB = 0.9 * sw + 0.1;
      hdy = bodyBob(stepBob(step - 0.14)) - by;
      hrot = 0.045 * Math.sin(TAU * (step - 0.2));
      scarfT = 1.2 + 0.09 * Math.sin(rt * 12 + s.seed * 5);
      const hop = Math.floor(step);
      if (hop !== s.hop) {
        if (s.hop >= 0 && game && game.state === 'play') puff(game, p.x - p.facing * 4, p.y + 0.5, 1.2, 1, 0.38, -p.vx * 0.15, -p.vy * 0.15, 0.32, 2.5);
        s.hop = hop;
      }
    } else {
      // idle: breathing, a delayed head bob, and a glance over the shoulder every ~6.5 s
      s.hop = -1;
      sy = 1 + 0.03 * br; sx = 1 - 0.022 * br;
      by = -0.25 * br;
      hdy = -0.4 * Math.sin(rt * TAU / 2.6 + s.seed * 6.3 - 0.7) - by;
      aF = 0.14 + 0.06 * br; aB = -0.12 - 0.06 * br;
      const fid = (rt + s.seed * 9.1) % 6.5;
      if (fid < 1.4) {
        const w = sstep(Math.sin(PI * fid / 1.4));
        hrot = -0.15 * w; lean = -0.035 * w; fB = [-2.3 - 0.6 * w, 0, 0]; aB -= 0.3 * w;
      }
      scarfT = 0.3 + 0.06 * br;
    }
    if (p.shootT > 0 && dash < 0) { // throw: the front arm whips forward, then eases back
      const t = 1 - p.shootT, k = t < 0.3 ? U.ease.outQuad(t / 0.3) : 1 - sstep((t - 0.3) / 0.7);
      aF = U.lerp(aF, 2.3, k); sx *= 1 + 0.035 * k; sy *= 1 - 0.03 * k; lean += 0.05 * k;
    }
    if (p.levelT > 0) { // crouch, jump with both arms up, land
      const t = 1 - p.levelT;
      const up = t > 0.12 && t < 0.7 ? Math.sin(PI * (t - 0.12) / 0.58) : 0;
      const cr = t < 0.12 ? Math.sin(PI * 0.5 * t / 0.12) : t > 0.7 && t < 0.88 ? Math.sin(PI * (t - 0.7) / 0.18) : 0;
      lift = 9 * up; sx *= 1 + 0.16 * cr - 0.06 * up; sy *= 1 - 0.16 * cr + 0.08 * up;
      aF = U.lerp(aF, 2.75, up); aB = U.lerp(aB, -2.75, up);
      face = 'j';
    }
    if (p.hurtT > 0) { // knocked back: flash white (~120 ms), lean away, arms flung up
      const h = p.hurtT;
      face = 'h'; fl = h > 0.62;
      lean = U.lerp(lean, -0.24, h); sx *= 1 + 0.16 * h; sy *= 1 - 0.13 * h;
      aF = U.lerp(aF, 2.5, h); aB = U.lerp(aB, -2.3, h); scarfT = U.lerp(scarfT, 2.0, h);
    }
    if (face === 'n' && blinking(rt, s.seed)) face = 'b';
    if (s.turn < 0.14) sx *= 1 - 0.32 * Math.sin(PI * s.turn / 0.14);
    // springs: scarf tail (two segments) and the leaf react to the body's motion (follow-through)
    if (dt > 0) {
      const vby = (by - s.pb) / dt, vh = (by + hdy - s.ph) / dt;
      s.pb = by; s.ph = by + hdy;
      s.sv += ((scarfT - s.sa) * 75 - s.sv * 10 + U.clamp(vby, -40, 40) * 0.5) * dt;
      s.sa = U.clamp(s.sa + s.sv * dt, -0.4, 2.3);
      s.sbv += ((s.sa + 0.12 - s.sb) * 55 - s.sbv * 8) * dt;
      s.sb = U.clamp(s.sb + s.sbv * dt, -0.6, 2.6);
      s.lv += (-s.la * 110 - s.lv * 8 - U.clamp(vh, -40, 40) * 0.9) * dt;
      s.la = U.clamp(s.la + s.lv * dt, -0.7, 0.7);
    }
    s.up = lift;
    const JS = JACK_SCALE, fx = p.facing < 0 ? -1 : 1, Y = p.y - lift * JS;
    if (go > 0) {
      for (let i = 3; i >= 1; i--) heroGhost(ctx, p.x - p.dashX * i * 6.5, Y - p.dashY * i * 6.5, fx, sx, sy, lean, (0.38 / i) * go);
      ctx.save(); ctx.translate(p.x, Y - 12 * JS); ctx.rotate(Math.atan2(p.dashY, p.dashX));
      ctx.lineCap = 'round'; ctx.globalAlpha = go;
      ctx.beginPath();
      for (const o of [-9, 0, 8]) { const x0 = -13 - (o ? 0 : 4), l = 9 + 6 * Math.sin(rt * 31 + o); ctx.moveTo(x0, o); ctx.lineTo(x0 - l, o); }
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.85; ctx.stroke();
      ctx.restore(); ctx.globalAlpha = 1;
    }
    let a = 1;
    if (p.iframes > 0 && p.hurtT <= 0 && dash < 0 && (Math.floor(rt * 16) & 1)) a = 0.5;
    ctx.globalAlpha = a;
    ctx.save();
    ctx.translate(p.x, Y); ctx.rotate(lean * fx); ctx.scale(fx * sx * JS, sy * JS);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (wheel > 0.3) { // cartoon leg-wheel smear
      ctx.globalAlpha = a * 0.55 * wheel; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(0, -1.8, 4.2, 2.2, 0, rt * 38, rt * 38 + PI * 1.3); ctx.stroke();
      ctx.globalAlpha = a;
    }
    hScarf(ctx, by, s.sa, s.sb, fl);
    hArm(ctx, -3.0, -10.0 + by, aB, fl, true);
    hLeg(ctx, -1.6, -5.6 + by, fB, fl, true);
    hLeg(ctx, 1.6, -5.6 + by, fF, fl, false);
    hTorso(ctx, by, fl);
    hArm(ctx, 3.0, -10.0 + by, aF, fl, false);
    hCollar(ctx, by, fl);
    ctx.translate(0.3, -11.0 + by + hdy); ctx.rotate(hrot);
    ctx.save(); ctx.translate(-0.2, -16.2); ctx.rotate(s.la * 0.5); spr(ctx, fl ? SPR.heroStemF : SPR.heroStem); ctx.restore();
    spr(ctx, fl ? SPR.hero.f : SPR.hero[face]);
    ctx.translate(-0.2, -16.2); ctx.rotate(s.la); spr(ctx, fl ? SPR.heroLeafF : SPR.heroLeaf);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* ---- creature death residue ---- */
  /** Outlined cel cloud that pops up (outBack) and shrinks away; three sparkles fly out of it. */
  function poofCloud(ctx, V, x, y, R, t, seed) {
    if (t >= 1) return;
    const sc = t < 0.22 ? U.ease.outBack(t / 0.22) : 1 - sstep((t - 0.22) / 0.78);
    if (sc <= 0.02) return;
    const sp = 1 + 0.6 * t, pts = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + seed * 6; pts.push(x + Math.cos(a) * R * 0.55 * sp, y + Math.sin(a) * R * 0.38 * sp, R * (0.4 + 0.07 * (i % 3)) * sc); }
    pts.push(x, y, R * 0.56 * sc);
    const disc = (grow, dx, dy, k) => { ctx.beginPath(); for (let i = 0; i < pts.length; i += 3) { const r = pts[i + 2] * k + grow; ctx.moveTo(pts[i] + dx * pts[i + 2] + r, pts[i + 1] + dy * pts[i + 2]); ctx.arc(pts[i] + dx * pts[i + 2], pts[i + 1] + dy * pts[i + 2], r, 0, TAU); } ctx.fill(); };
    ctx.fillStyle = OUT; disc(OL, 0, 0, 1);
    ctx.fillStyle = '#dcd6ea'; disc(0, 0, 0, 1);
    ctx.fillStyle = '#ffffff'; disc(0, -0.17, -0.2, 0.78);
    for (let i = 0; i < 3; i++) {
      const a = seed * 9 + i * 2.1, d = R * (0.75 + t * 1.1);
      blitRot(ctx, V, SPR.star[1], x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6 - t * 6, 0.62 * sc, 0.62 * sc, a + t * 5);
    }
  }
  /** Ghost death tail: a little soul curl that rises and thins out. */
  function drawWisp(ctx, V, x, y, t) {
    if (t >= 1) return;
    const k = 1 - t, yy = y - t * 14, w = 2.6 * k + 0.3;
    const path = () => { ctx.beginPath(); ctx.moveTo(x, yy + 6); ctx.bezierCurveTo(x + 4, yy + 3, x - 4, yy - 1, x, yy - 4); ctx.arc(x + 1.5, yy - 4, 1.5, PI, PI * 2.4); };
    ctx.lineCap = 'round';
    ctx.globalAlpha = Math.min(1, k * 1.6);
    path(); ctx.strokeStyle = OUT; ctx.lineWidth = w + 2 * OL * k; ctx.stroke();
    path(); ctx.strokeStyle = C.ghost; ctx.lineWidth = w; ctx.stroke();
    ctx.globalAlpha = 1;
    blitRot(ctx, V, SPR.spark, x + 5, yy - 2 - t * 4, 0.75 * k, 0.75 * k, 0);
  }
  /* ---- pond ripples (ambient): cached water test per 40-unit cell ---- */
  const WATER = new Map();
  const RING_MAX = 160, RINGS = new Float32Array(RING_MAX * 3), WR = { key: '', n: 0, c: new Float32Array(RING_MAX * 3) };
  function waterCell(cx, cy) {
    const key = cx + ',' + cy;
    let v = WATER.get(key);
    if (v === undefined) {
      if (WATER.size > 6000) WATER.clear();
      const x = (cx + 0.5) * 40, y = (cy + 0.5) * 40;
      v = matAt(x, y) >= 6 && matAt(x + 8, y) >= 6 && matAt(x - 8, y) >= 6 && matAt(x, y + 5) >= 6 && matAt(x, y - 5) >= 6;
      WATER.set(key, v);
    }
    return v;
  }

  Styles.register({
    id: 'cartoon',
    name: 'Brotato-Cartoon',
    family: 'Vektor · Cartoon',
    description: 'Candy-bright HD vector cartoon: thick deep-plum outlines, one cel-shade crescent, one white gloss and bouncy squash & stretch.',
    groundColor: '#9ec671',
    groundResMax: 3,
    chunkSize: 256,
    fonts: ['Lilita+One', 'Fredoka:wght@400;500;600;700'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = Math.max(3, Math.min(6, Math.round(S * 1.25)));
      const R8 = [0, 1, 2, 3, 4, 5, 6, 7];
      const HB = [-13.5, -20, 14, 2.5];
      SPR.hero = {};
      for (const ex of ['n', 'b', 'h', 'e', 'j']) SPR.hero[ex] = build(HB, (P) => heroHeadParts(P, ex));
      SPR.hero.f = build(HB, (P) => heroHeadParts(P, 'h'), 'flash');
      SPR.heroStem = build([-2.6, -6, 3.8, 3.2], heroStemParts); SPR.heroStemF = build([-2.6, -6, 3.8, 3.2], heroStemParts, 'flash');
      SPR.heroLeaf = build([-7.5, -6.5, 5, 1.5], heroLeafParts); SPR.heroLeafF = build([-7.5, -6.5, 5, 1.5], heroLeafParts, 'flash');
      // creatures: 8 walk frames + 8 blink frames + a hit pose and a death pose (each with a white flash copy)
      const actorSet = (box, fn, post) => {
        const one = (fr, pose, mode) => { const s = build(box, (P) => fn(P, fr, pose), mode); if (post) post(s, box); return s; };
        return { walk: R8.map((f) => one(f, 'walk')), blink: R8.map((f) => one(f, 'blink')), hurt: one(0, 'hurt'), hurtF: one(0, 'hurt', 'flash'), dead: one(0, 'dead'), deadF: one(0, 'dead', 'flash') };
      };
      SPR.creep = [0, 1, 2].map((v) => actorSet([-14, -37, 14, 2.5], (P, f, pose) => creeperParts(P, v, f, pose)));
      SPR.ghost = [0, 1].map((v) => actorSet([-15, -30, 14, 2.5], (P, f, pose) => ghostParts(P, v, f, pose), ghostFade));
      SPR.colo = actorSet([-28, -68, 29, 3], colossusParts);
      SPR.lantern = build([-9.5, -22, 9.5, 3], lanternParts);
      SPR.gemS = build([-5, -7.5, 5, 2], (P) => gemParts(P, false));
      SPR.gemB = build([-7, -10.5, 7, 2.5], (P) => gemParts(P, true));
      SPR.seed = build([-5.5, -4.6, 6.2, 4.6], seedParts);
      SPR.streak = plainSprite([-18, -3.2, -2, 3.2], (c) => {
        const g = c.createLinearGradient(-3, 0, -17, 0);
        g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.strokeStyle = g; c.lineCap = 'round';
        c.lineWidth = 1.0; c.beginPath(); c.moveTo(-3.5, 0); c.lineTo(-16.5, 0); c.stroke();
        c.lineWidth = 0.75; c.beginPath(); c.moveTo(-4.5, -2.0); c.lineTo(-12.5, -2.0); c.moveTo(-4.5, 2.0); c.lineTo(-11.5, 2.0); c.stroke();
      });
      SPR.puff = PUFF_COL.map((_, t) => build([-9, -7.5, 9, 7.5], (P) => puffParts(P, t)));
      SPR.star = STAR_COL.map((_, t) => build([-6, -6, 6, 6], (P) => starParts(P, t)));
      SPR.chunk = CHUNK_COL.map((cc, i) => build([-4, -4, 4, 4], (P) => chunkParts(P, cc, i)));
      SPR.hit = build([-7.5, -7.5, 7.5, 7.5], hitParts);
      SPR.spark = build([-5, -5, 5, 5], sparkParts);
      SPR.conf = CONF_COL.map((col) => build([-2.6, -2, 2.6, 2], (P) => P.part((c) => rrect(c, -1.6, -0.85, 3.2, 1.7, 0.5), col, { ol: 0.45 })));
      SPR.bfly = BFLY_COL.map((_, t) => build([-5.5, -5, 5.5, 4], (P) => butterflyParts(P, t)));
      SPR.shadow = plainSprite([-4, -1.6, 4, 1.6], (c) => { c.fillStyle = 'rgba(50,30,72,0.22)'; c.beginPath(); c.ellipse(0, 0, 3.6, 1.35, 0, 0, TAU); c.fill(); });
      SPR.glow = plainSprite([-18, -18, 18, 18], (c) => {
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 18);
        g.addColorStop(0, 'rgba(255,226,120,0.75)'); g.addColorStop(0.35, 'rgba(255,196,80,0.32)'); g.addColorStop(1, 'rgba(255,170,60,0)');
        c.fillStyle = g; c.fillRect(-18, -18, 36, 36);
      });
      SPR.props = {};
      for (const t in PROP_DEF) {
        const d = PROP_DEF[t];
        SPR.props[t] = [];
        for (let v = 0; v < d.n; v++) SPR.props[t].push(withFlip(build(d.box, (P) => d.fn(P, v))));
      }
      if (document.fonts && document.fonts.load) { try { document.fonts.load('20px "Lilita One"', '0123456789'); } catch (e) { /* ignore */ } }
    },

    /* ------------------------------------------------------------ ground */
    *renderGroundChunk(ctx, info) {
      const res = info.res, Wp = info.px;
      const cpx = GSTEP * res;
      const nc = Math.ceil(Wp / cpx - 1e-6);
      const MG = 3, nn = nc + 1 + MG * 2, x0 = info.wx - MG * GSTEP, y0 = info.wy - MG * GSTEP;
      const F = new Float32Array(nn * nn * NF);
      const tmp = new Float32Array(NF);
      for (let j = 0; j < nn; j++) {
        const y = y0 + j * GSTEP;
        for (let i = 0; i < nn; i++) {
          fieldsAt(x0 + i * GSTEP, y, tmp);
          const o = (j * nn + i) * NF;
          for (let k = 0; k < NF; k++) F[o + k] = tmp[k];
        }
        if ((j & 7) === 7) yield;
      }
      const cs = new Int32Array(nc + 1);
      for (let i = 0; i <= nc; i++) cs[i] = Math.max(0, Math.min(Wp, Math.ceil(i * cpx - 0.5)));
      const img = ctx.createImageData(Wp, Wp);
      const buf = new Uint32Array(img.data.buffer);
      const rimPx = LAY.map((l) => l.rw * res);
      const st = new Int8Array(NL);
      for (let gy = 0; gy < nc; gy++) {
        for (let gx = 0; gx < nc; gx++) {
          const o00 = ((gy + MG) * nn + gx + MG) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF;
          const tint = (F[o00 + NL] + F[o10 + NL] + F[o01 + NL] + F[o11 + NL]) * 0.25;
          for (let L = 0; L < NL; L++) {
            const a = F[o00 + L], b = F[o10 + L], c = F[o01 + L], d = F[o11 + L];
            const mn = Math.min(a, b, c, d), mx = Math.max(a, b, c, d);
            const gxm = Math.max(Math.abs(b - a), Math.abs(d - c)), gym = Math.max(Math.abs(c - a), Math.abs(d - b));
            const g = Math.sqrt(gxm * gxm + gym * gym) / cpx + 1e-9;
            st[L] = mx < 0 && mx / g < -1.5 ? 0 : mn > 0 && mn / g > rimPx[L] + 1.5 ? 2 : 1;
          }
          let start = -1;
          for (let L = NL - 1; L >= 0; L--) if (st[L] === 2) { start = L; break; }
          let needPix = false;
          for (let L = start + 1; L < NL; L++) if (st[L] === 1) { needPix = true; break; }
          const xa = cs[gx], xb = cs[gx + 1], ya = cs[gy], yb = cs[gy + 1];
          const base = start < 0 ? BASE : LAY[start].fill;
          if (!needPix) {
            const px = pack(base[0] * tint, base[1] * tint, base[2] * tint);
            for (let py = ya; py < yb; py++) buf.fill(px, py * Wp + xa, py * Wp + xb);
            continue;
          }
          for (let py = ya; py < yb; py++) {
            const v = (py + 0.5) / cpx - gy;
            for (let px = xa; px < xb; px++) {
              const u = (px + 0.5) / cpx - gx;
              let r = base[0], g = base[1], b = base[2];
              for (let L = start + 1; L < NL; L++) {
                if (st[L] === 0) continue;
                const A = F[o00 + L], B = F[o10 + L], Cc = F[o01 + L], D = F[o11 + L];
                const s0 = A + (B - A) * u, s1 = Cc + (D - Cc) * u;
                const s = s0 + (s1 - s0) * v;
                const du = (B - A) * (1 - v) + (D - Cc) * v, dv = (Cc - A) * (1 - u) + (D - B) * u;
                const gl = Math.sqrt(du * du + dv * dv) / cpx;
                const dist = gl > 1e-9 ? s / gl : s > 0 ? 99 : -99;
                let cov = dist + 0.5;
                if (cov <= 0) continue;
                if (cov > 1) cov = 1;
                const lay = LAY[L];
                let rm = rimPx[L] - dist + 0.5;
                rm = rm < 0 ? 0 : rm > 1 ? 1 : rm;
                const lr = lay.fill[0] + (lay.rim[0] - lay.fill[0]) * rm;
                const lg = lay.fill[1] + (lay.rim[1] - lay.fill[1]) * rm;
                const lb = lay.fill[2] + (lay.rim[2] - lay.fill[2]) * rm;
                r += (lr - r) * cov; g += (lg - g) * cov; b += (lb - b) * cov;
              }
              buf[py * Wp + px] = pack(r * tint, g * tint, b * tint);
            }
          }
        }
        if ((gy & 3) === 3) yield;
      }
      ctx.putImageData(img, 0, 0);
      yield;
      yield* decals(ctx, info, makeSampler(F, nn, x0, y0, info));
    },

    propsForChunk(info) {
      const out = [];
      G.scatterOwned(info, PCELL, 4242, (x, y, rng) => { const p = propAt(x, y, rng); if (p) out.push(p); });
      return out;
    },

    drawProp(ctx, p, view) {
      if (shPending) flushShadows(ctx);
      const s = SPR.props[p.t][p.v];
      const sp = p.f ? s.l : s.n;
      if (p.t === 'tree' || p.t === 'bush' || p.t === 'reed') {
        // breeze: two slow sways per prop + a gust band that rolls across the world (always the same way)
        const V = tf(view), rt = view.rt;
        const g = Math.sin(p.x * 0.0045 + p.y * 0.002 - rt * 0.8);
        const gust = g > 0.6 ? (g - 0.6) * 2.5 : 0;
        const amp = p.t === 'tree' ? 0.025 : p.t === 'bush' ? 0.035 : 0.075;
        const k = (Math.sin(rt * 1.3 + p.sw) * 0.55 + Math.sin(rt * 2.9 + p.sw * 1.7) * 0.18 + gust * gust * 1.3) * amp;
        const S = V.S;
        ctx.setTransform(S, 0, -k * S, S, V.ox + p.x * S, V.oy + p.y * S);
        const q = 1 / K;
        ctx.drawImage(sp.c, -sp.ox * q, -sp.oy * q, sp.c.width * q, sp.c.height * q);
        ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
      } else blit(ctx, sp, p.x, p.y, 1, 1);
    },

    drawShadow(ctx, o, view) {
      if (shView !== view) { shView = view; ctx.beginPath(); shPending = false; }
      let rx, ry, x = o.x, y = o.y;
      if (o.kind === 'prop') { const d = PROP_DEF[o.t]; if (!d) return; rx = d.sh[0]; ry = d.sh[1]; if (o.t === 'tree' && o.v !== 4) { rx = 16; ry = 5.2; } }
      else if (o.kind === 'enemy') {
        let k = 1;
        if (o.dying) { if (o.deathT > 0.55) return; k = 1 - (o.deathT / 0.55) * 0.5; }
        if (o.spawnT < 1) k *= U.clamp(o.spawnT * 2.5 - 0.4, 0, 1);
        if (k <= 0.02) return;
        if (o.type === 'ghost') { rx = 5.8 * k; ry = 2.1 * k; }
        else if (o.type === 'colossus') { rx = 18.5 * k; ry = 5.8 * k; }
        else { rx = 8.6 * k * CREEP_SCALE; ry = 3.1 * k * CREEP_SCALE; }
      } else {
        const k = 1 / (1 + (o._cs ? o._cs.up : 0) * 0.07);
        rx = 8.6 * JACK_SCALE * k; ry = 3.0 * JACK_SCALE * k;
      }
      ctx.moveTo(x + rx, y); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
      shPending = true;
    },

    drawGroundOverlay(ctx, view, game) {
      // spawn: a dirt hole opens (root creatures) or a cold swirl turns (ghosts)
      for (const e of game.enemies) {
        if (e.dying || e.spawnT >= 1) { e._popd = false; continue; }
        if (e.x < view.x0 - 40 || e.x > view.x1 + 40 || e.y < view.y0 - 20 || e.y > view.y1 + 60) continue;
        const ghost = e.type === 'ghost', t = e.spawnT, big = e.type === 'colossus';
        if (!e._popd && t > (ghost ? 0 : 0.22) && game.state === 'play') {
          e._popd = true;
          const n = ghost ? 2 : big ? 7 : 4;
          for (let i = 0; i < n; i++) {
            const a = Math.random() * TAU;
            if (ghost) puff(game, e.x + Math.cos(a) * 4, e.y, 6 + Math.random() * 6, 2, 0.5 + Math.random() * 0.3, Math.cos(a) * 14, Math.sin(a) * 6, 0.5, 4);
            else game.addParticle({ kind: 'chunk', dirt: true, x: e.x, y: e.y, z: 1, vx: Math.cos(a) * 32, vy: Math.sin(a) * 14, vz: 60 + Math.random() * 45, grav: 260, drag: 1, life: 0.55, size: (big ? 0.9 : 0.6) + Math.random() * 0.3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 });
          }
        }
        if (ghost) {
          const a = t < 0.2 ? sstep(t / 0.2) : 1 - sstep((t - 0.4) / 0.5);
          if (a > 0.02) {
            const r = 7 * a + 2;
            ctx.strokeStyle = 'rgba(214,204,240,' + (0.85 * a).toFixed(3) + ')'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.ellipse(e.x, e.y + 0.5, r, r * 0.4, 0, t * 9, t * 9 + PI * 1.5); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(e.x, e.y + 0.5, r * 0.55, r * 0.22, 0, t * 9 + PI, t * 9 + PI * 2.2); ctx.stroke();
          }
          continue;
        }
        const a = t < 0.15 ? U.ease.outBack(t / 0.15) : t > 0.62 ? Math.max(0, 1 - (t - 0.62) / 0.28) : 1;
        if (a <= 0.01) continue;
        const rx = (big ? 19 : 10) * a, ry = rx * 0.42;
        ctx.fillStyle = '#b07a4c';
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 0.3, rx + 1.6, ry + 1.0, 0, 0, TAU); ctx.fill();
        ctx.lineWidth = 0.8; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.fillStyle = '#43283f';
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 0.5, rx, ry * 0.8, 0, 0, TAU); ctx.fill();
        if (big) {
          ctx.beginPath();
          for (let i = 0; i < 5; i++) { const b = i * 1.3 + e.seed * 6, c = Math.cos(b), s = Math.sin(b); ctx.moveTo(e.x + c * (rx + 1.8), e.y + s * (ry + 1.2)); ctx.lineTo(e.x + c * (rx + 6), e.y + s * (ry + 3)); }
          ctx.lineWidth = 0.9; ctx.stroke();
        }
      }
      // ambient: slow rings spreading on open pond water
      const rt = view.rt;
      const cx0 = Math.floor(view.x0 / 40), cx1 = Math.floor(view.x1 / 40), cy0 = Math.floor(view.y0 / 40), cy1 = Math.floor(view.y1 / 40);
      // collect the rings, then stroke them in 4 fade buckets (4 strokes per frame instead of one per ring)
      // the water cells of the visible range only change when the camera crosses a 40-unit cell
      const rk = cx0 + ',' + cy0 + ',' + cx1 + ',' + cy1;
      if (WR.key !== rk) {
        WR.key = rk; WR.n = 0;
        for (let cy = cy0; cy <= cy1; cy++) {
          for (let cx = cx0; cx <= cx1 && WR.n < RING_MAX; cx++) {
            const h = U.hash2(cx, cy, 515);
            if (h > 0.38 || !waterCell(cx, cy)) continue;
            const o = WR.n++ * 3;
            WR.c[o] = (cx + 0.25 + h * 1.3) * 40; WR.c[o + 1] = (cy + 0.3 + U.hash2(cx, cy, 516) * 0.4) * 40; WR.c[o + 2] = h * 7;
          }
        }
      }
      let n = 0;
      for (let i = 0; i < WR.n; i++) {
        for (let j = 0; j < 2 && n < RING_MAX; j++) { RINGS[n * 3] = WR.c[i * 3]; RINGS[n * 3 + 1] = WR.c[i * 3 + 1]; RINGS[n * 3 + 2] = U.fract(rt / 3.2 + WR.c[i * 3 + 2] + j * 0.42); n++; }
      }
      if (n) {
        ctx.strokeStyle = '#ffffff';
        for (let bk = 0; bk < 4; bk++) {
          const tm = (bk + 0.5) / 4;
          ctx.globalAlpha = (1 - tm) * 0.55;
          ctx.lineWidth = 0.35 + 0.6 * (1 - tm);
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const t = RINGS[i * 3 + 2];
            if ((t * 4 | 0) !== bk) continue;
            const r = 1.5 + 8 * t, x = RINGS[i * 3], y = RINGS[i * 3 + 1];
            ctx.moveTo(x + r, y); ctx.ellipse(x, y, r, r * 0.42, 0, 0, TAU);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    },

    drawWorldOverlay(ctx, view) {
      // a few butterflies drifting over the meadow (pure decoration)
      const V = tf(view), cell = 210, rt = view.rt;
      const x0 = Math.floor((view.x0 - 60) / cell), x1 = Math.floor((view.x1 + 60) / cell);
      const y0 = Math.floor((view.y0 - 60) / cell), y1 = Math.floor((view.y1 + 60) / cell);
      const k = 1 / K, ss = SPR.shadow;
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = U.hash2(cx, cy, 991);
          if (h > 0.55) continue;
          const ph = h * 40, ph2 = U.hash2(cx, cy, 992) * 40;
          const hx = (cx + 0.5) * cell + Math.sin(ph2) * 60, hy = (cy + 0.5) * cell + Math.cos(ph2) * 60;
          const x = hx + Math.sin(rt * 0.37 + ph) * 46 + Math.sin(rt * 0.93 + ph2) * 14;
          const y = hy + Math.cos(rt * 0.29 + ph) * 30 + Math.sin(rt * 1.31 + ph) * 9;
          if (x < view.x0 - 10 || x > view.x1 + 10 || y < view.y0 - 10 || y > view.y1 + 30) continue;
          const z = 16 + Math.sin(rt * 2.1 + ph) * 4;
          ctx.globalAlpha = 0.7;
          ctx.drawImage(ss.c, x - ss.ox * k * 0.75, y - ss.oy * k * 0.75, ss.c.width * k * 0.75, ss.c.height * k * 0.75);
          ctx.globalAlpha = 1;
          const flap = Math.abs(Math.sin(rt * 13 + ph * 3));
          const dir = Math.cos(rt * 0.37 + ph) * 0.35;
          blitRot(ctx, V, SPR.bfly[(h * 100 | 0) % BFLY_COL.length], x, y - z, 1.45 * (0.2 + 0.8 * flap), 1.45, dir);
        }
      }
    },

    drawGem(ctx, g, view) {
      const s = g.big ? SPR.gemB : SPR.gemS;
      let h = 1.6 + Math.sin(view.rt * 5 + g.seed * 20) * 1.1;
      let sx = 1, sy = 1;
      if (g.pop > 0) {
        const q = 1 - g.pop;
        h += Math.sin(q * PI) * 10;
        const p = U.ease.outBack(Math.min(1, q * 1.4));
        sx = 0.4 + 0.6 * p; sy = sx;
      } else if (!g.fly) {
        const b = Math.sin(view.rt * 5 + g.seed * 20);
        sy = 1 + b * 0.05; sx = 1 - b * 0.04;
      }
      const sk = g.big ? 1.45 : 1;
      const k = 1 / K, ss = SPR.shadow, sc = sk * (1 - h * 0.025);
      ctx.drawImage(ss.c, g.x - ss.ox * k * sc, g.y - ss.oy * k * sc, ss.c.width * k * sc, ss.c.height * k * sc);
      blit(ctx, s, g.x, g.y - h, sx, sy);
      if (g.big) {
        const tw = Math.sin(view.rt * 3 + g.seed * 9);
        if (tw > 0.6) { const V = tf(view); const q = (tw - 0.6) / 0.4; blitRot(ctx, V, SPR.spark, g.x + 3.5, g.y - h - 9, q * 0.7, q * 0.7, view.rt); }
      }
    },

    drawEnemy(ctx, e, view) {
      if (shPending) flushShadows(ctx);
      const V = tf(view), rt = view.rt, T = e.type, seed = e.seed;
      const flip = e.facing < 0 ? -1 : 1;
      let set, H, y = e.y, sx = 1, sy = 1, rot = 0, s, scl = 0.94 + seed * 0.12;
      if (T === 'ghost') {
        // hover: two summed sines (slow rise, quicker dip), stretch with vertical speed, lean into travel
        set = SPR.ghost[(seed * 7 | 0) & 1];
        const ph = rt * 0.95 + seed * 5, f = Math.floor((ph - Math.floor(ph)) * 8);
        const th = rt * 2.5 + seed * 12;
        y -= 4.8 + (Math.sin(th) + 0.28 * Math.sin(2 * th + 0.7)) * 1.5;
        const vel = Math.cos(th) + 0.56 * Math.cos(2 * th + 0.7);
        sy = 1 + 0.035 * vel; sx = 1 - 0.03 * vel;
        rot = U.clamp(e.vx / 64, -1, 1) * 0.18;
        s = blinking(rt, seed) ? set.blink[f] : set.walk[f];
        H = 26;
      } else if (T === 'colossus') {
        set = SPR.colo;
        const ph = e.anim * 0.32 + seed * 3, f = Math.floor((ph - Math.floor(ph)) * 8);
        const b = stepBob(ph * 2);
        y += b > 0 ? b * 0.9 : b * 1.3;
        sx = 1 + (b > 0 ? 0.085 * b : 0.012 * b); sy = 1 - (b > 0 ? 0.09 * b : 0.022 * b);
        rot = 0.04 * Math.sin(ph * TAU);
        s = blinking(rt, seed) ? set.blink[f] : set.walk[f];
        H = 64;
      } else {
        set = SPR.creep[Math.floor(seed * 3) % 3];
        scl *= CREEP_SCALE;
        const ph = e.anim * 0.85 + seed * 7, f = Math.floor((ph - Math.floor(ph)) * 8);
        const b = stepBob(ph * 2);
        y += b > 0 ? b * 0.6 : b * 1.1;
        sx = 1 + (b > 0 ? 0.08 * b : 0.02 * b); sy = 1 - (b > 0 ? 0.09 * b : 0.035 * b);
        rot = 0.08 * Math.sin(ph * TAU);
        s = blinking(rt, seed) ? set.blink[f] : set.walk[f];
        H = 28;
      }
      // death: designed sequence over deathT 0..1 (0.35 s in play)
      if (e.dying) {
        const q = e.deathT, dir = e.kx > 2 ? 1 : e.kx < -2 ? -1 : -flip;
        if (T === 'ghost') { // squash -> stretched upward, twisting, thinning -> a soul curl rises
          if (q < 0.6) {
            let a = 1, fa = 0, dsx, dsy, dy = 0, r = 0;
            if (q < 0.12) { const k = sstep(q / 0.12); dsx = 1 + 0.25 * k; dsy = 1 - 0.25 * k; fa = 1; }
            else { const k = (q - 0.12) / 0.48; dsx = 1.25 - 1.0 * k * k; dsy = 0.75 + 0.95 * sstep(k); dy = -12 * sstep(k); r = 0.5 * k * dir; a = 1 - 0.55 * k; fa = 1 - sstep(k * 2); }
            ctx.globalAlpha = a;
            blitM(ctx, V, set.dead, e.x, y + dy, dsx * scl, dsy * scl, r, flip);
            if (fa > 0.02) { ctx.globalAlpha = a * fa; blitM(ctx, V, set.deadF, e.x, y + dy, dsx * scl, dsy * scl, r, flip); }
            ctx.globalAlpha = 1;
          } else drawWisp(ctx, V, e.x, y - 16, (q - 0.6) / 0.4);
          return;
        }
        // root creatures: white squash -> spring up with X-eyes and a twist -> inflate -> pop into a cloud
        const big = T === 'colossus', Hs = big ? 1.8 : 1;
        if (q < 0.55) {
          let dsx, dsy, dy = 0, r = 0, fa = 0;
          if (q < 0.12) { const k = sstep(q / 0.12); dsx = 1 + 0.32 * k; dsy = 1 - 0.28 * k; fa = 1; }
          else if (q < 0.42) { const k = (q - 0.12) / 0.3, o = U.ease.outBack(k); dsx = 1.32 - 0.46 * o; dsy = 0.72 + 0.5 * o; dy = -6 * Hs * sstep(k); r = 0.35 * sstep(k) * dir; fa = 1 - sstep(k * 1.6); }
          else { const k = sstep((q - 0.42) / 0.13), w = Math.sin(q * 90) * 0.04; dsx = 0.86 + 0.44 * k + w; dsy = 1.22 + 0.08 * k - w; dy = -6 * Hs; r = 0.35 * dir; fa = 0.75 * k; }
          blitM(ctx, V, set.dead, e.x, y + dy, dsx * scl, dsy * scl, r, flip);
          if (fa > 0.02) { ctx.globalAlpha = fa; blitM(ctx, V, set.deadF, e.x, y + dy, dsx * scl, dsy * scl, r, flip); ctx.globalAlpha = 1; }
        } else poofCloud(ctx, V, e.x, y - (big ? 28 : 12) * scl - 6 * Hs, (big ? 22 : 11) * scl, (q - 0.55) / 0.45, seed);
        return;
      }
      // spawn: root creatures peek out of the hole (leaf tips shiver), pop out stretched, land squashed, settle;
      // ghosts swirl up out of the ground, untwisting
      let clip = false, alpha = 1, dy = 0;
      if (e.spawnT < 1) {
        const q = e.spawnT;
        if (T === 'ghost') {
          const k = sstep(q / 0.75), o = U.ease.outBack(Math.min(1, q / 0.8));
          alpha = k; sx *= 0.4 + 0.6 * o; sy *= 0.2 + 0.8 * o; dy = (1 - k) * 6; rot += (1 - k) * 0.9 * flip;
        } else {
          const Hd = H * scl;
          if (q < 0.22) { dy = Hd - 4.5 - 2.5 * sstep(q / 0.22); rot = Math.sin(rt * 46 + seed * 9) * 0.06; clip = true; }
          else if (q < 0.48) { const k = (q - 0.22) / 0.26; dy = U.lerp(Hd - 7, -5, U.ease.outQuad(k)); sx *= 0.8 + 0.12 * k; sy *= 1.3 - 0.2 * k; rot = 0; clip = dy > 0; }
          else if (q < 0.62) { const k = (q - 0.48) / 0.14; dy = -5 * (1 - k * k); sx *= 0.92 + 0.08 * k; sy *= 1.1 - 0.1 * k; rot *= k; }
          else if (q < 0.78) { const k = Math.sin(PI * (q - 0.62) / 0.16); sx *= 1 + 0.28 * k; sy *= 1 - 0.25 * k; rot *= 0.5; }
          else { const k = (q - 0.78) / 0.22, w = Math.sin(k * TAU) * (1 - k) * 0.08; sx *= 1 - w; sy *= 1 + w; }
        }
      }
      // hit: hurt pose + white flash, squash and tilt away from the hit; then an elastic wobble
      let fs = null, fa = 0;
      const fl = e.flash;
      if (fl > 0) {
        s = set.hurt; fs = set.hurtF; fa = Math.min(1, fl * 1.7);
        const dir = e.kx > 2 ? 1 : e.kx < -2 ? -1 : -flip;
        rot = 0.26 * fl * dir; sx *= 1 + 0.22 * fl; sy *= 1 - 0.18 * fl;
        e._wob = rt;
      } else if (e._wob !== undefined) {
        const t = rt - e._wob;
        if (t < 0.5) { const w = Math.sin(t * 30) * Math.exp(-t * 8) * 0.12; sx *= 1 - w; sy *= 1 + w; }
      }
      sx *= scl; sy *= scl;
      if (clip) { ctx.save(); ctx.beginPath(); ctx.rect(e.x - 45, e.y - 130, 90, 130.4); ctx.clip(); }
      ctx.globalAlpha = alpha;
      blitM(ctx, V, s, e.x, y + dy, sx, sy, rot, flip);
      if (fs && fa > 0.02) { ctx.globalAlpha = alpha * fa; blitM(ctx, V, fs, e.x, y + dy, sx, sy, rot, flip); }
      ctx.globalAlpha = 1;
      if (clip) ctx.restore();
    },

    drawPlayer(ctx, p, view) {
      if (shPending) flushShadows(ctx);
      drawHero(ctx, tf(view), p, view.rt, view.game);
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view);
      const bob = Math.sin(view.rt * 4 + o.idx * 1.7) * 1.4;
      const gy = o.y + 4;
      const k = 1 / K, ss = SPR.shadow;
      ctx.drawImage(ss.c, o.x - ss.ox * k * 1.5, gy - ss.oy * k * 1.5, ss.c.width * k * 1.5, ss.c.height * k * 1.5);
      const y = o.y - 3 + bob;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + 0.12 * Math.sin(view.rt * 9 + o.idx * 2.1);
      blit(ctx, SPR.glow, o.x, y - 7, 1, 1);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const sq = Math.sin(view.rt * 8 + o.idx);
      blitRot(ctx, V, SPR.lantern, o.x, y, 1 + sq * 0.04, 1 - sq * 0.04, Math.sin(view.rt * 3 + o.idx) * 0.14);
    },

    drawProjectile(ctx, pr, view) {
      const V = tf(view);
      const k = 1 / K, ss = SPR.shadow;
      ctx.globalAlpha = 0.8;
      ctx.drawImage(ss.c, pr.x - ss.ox * k * 0.8, pr.y + 6 - ss.oy * k * 0.8, ss.c.width * k * 0.8, ss.c.height * k * 0.8);
      ctx.globalAlpha = Math.min(1, pr.age * 14) * 0.9;
      blitRot(ctx, V, SPR.streak, pr.x, pr.y, 1, 1, pr.angle);
      ctx.globalAlpha = 1;
      const sq = 0.55 + 0.45 * Math.abs(Math.cos(pr.spin));
      blitRot(ctx, V, SPR.seed, pr.x, pr.y, 1, sq, pr.angle);
    },

    drawParticle(ctx, pt, view) {
      const V = tf(view);
      let age = pt.max - pt.life, dur = pt.max;
      if (pt.delay) { if (age < pt.delay) return; age -= pt.delay; dur -= pt.delay; }
      const t = U.clamp(age / dur, 0, 1);
      let s, sc, spr, rot = pt.rot, z = pt.z;
      switch (pt.kind) {
        case 'puff':
          spr = SPR.puff[pt.tint || 0];
          sc = t < 0.2 ? U.ease.outBack(t / 0.2) : 1 - Math.pow((t - 0.2) / 0.8, 2);
          s = pt.size * Math.max(0, sc);
          z += (pt.rise || 0) * t;
          rot *= 0.3;
          break;
        case 'star':
          spr = SPR.star[pt.tint || 0];
          sc = t < 0.12 ? t / 0.12 : t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
          s = pt.size * sc;
          break;
        case 'chunk':
          spr = pt.dirt ? null : SPR.chunk[pt.spr || 0];
          sc = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
          s = pt.size * sc;
          if (pt.dirt) {
            ctx.fillStyle = '#9c6a42'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.arc(pt.x, pt.y - z, 1.3 * s, 0, TAU); ctx.fill(); ctx.stroke();
            return;
          }
          break;
        case 'hit':
          spr = SPR.hit;
          sc = t < 0.3 ? 0.5 + U.ease.outBack(t / 0.3) * 0.7 : 1.2 - (t - 0.3) / 0.7 * 0.9;
          s = pt.size * sc;
          break;
        case 'spark':
          spr = SPR.spark;
          sc = t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75;
          s = pt.size * sc;
          rot = 0;
          break;
        case 'conf':
          spr = SPR.conf[pt.tint || 0];
          s = pt.size * (t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1);
          {
            const fl = Math.cos(view.rt * 9 + pt.seed * 20);
            if (s <= 0.01) return;
            const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
            ctx.setTransform(co * s, si * s, -si * s * fl, co * s * fl, V.ox + pt.x * S, V.oy + (pt.y - z) * S);
            const k = 1 / K;
            ctx.drawImage(spr.c, -spr.ox * k, -spr.oy * k, spr.c.width * k, spr.c.height * k);
            ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
          }
          return;
        case 'ring': {
          const r = pt.size * (4 + 26 * U.ease.outQuad(t));
          const w = 2.4 * (1 - t);
          if (w <= 0.05) return;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.45, 0, 0, TAU);
          ctx.strokeStyle = OUT; ctx.lineWidth = w + 1.4; ctx.stroke();
          ctx.strokeStyle = pt.color || '#ffffff'; ctx.lineWidth = w; ctx.stroke();
          return;
        }
        case 'lines': { // comic action lines bursting out of an impact
          const n = pt.n || 5, r0 = pt.size * (3 + 9 * U.ease.outQuad(t)), len = pt.size * 6 * (1 - t);
          if (len <= 0.15) return;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const a = pt.rot + (i / n) * TAU + (i & 1) * 0.25, c = Math.cos(a), si = Math.sin(a) * 0.8, l = len * (i & 1 ? 0.7 : 1);
            ctx.moveTo(pt.x + c * r0, pt.y - z + si * r0); ctx.lineTo(pt.x + c * (r0 + l), pt.y - z + si * (r0 + l));
          }
          ctx.lineCap = 'round';
          ctx.strokeStyle = OUT; ctx.lineWidth = 1.5 * pt.size + 0.5; ctx.stroke();
          ctx.strokeStyle = pt.color || '#ffffff'; ctx.lineWidth = 0.75 * pt.size; ctx.stroke();
          return;
        }
        case 'rays': { // soft sunburst behind a glow-up
          const r = pt.size * 30 * U.ease.outQuad(Math.min(1, t * 1.6)), a = 0.45 * (1 - t * t);
          if (a <= 0.01) return;
          ctx.globalAlpha = a; ctx.fillStyle = '#fff3b0'; ctx.beginPath();
          const cy = pt.y - z;
          for (let i = 0; i < 12; i++) {
            const b = pt.rot + view.rt * 0.8 + (i / 12) * TAU;
            ctx.moveTo(pt.x, cy); ctx.lineTo(pt.x + Math.cos(b - 0.11) * r, cy + Math.sin(b - 0.11) * r * 0.8); ctx.lineTo(pt.x + Math.cos(b + 0.11) * r, cy + Math.sin(b + 0.11) * r * 0.8); ctx.closePath();
          }
          ctx.fill(); ctx.globalAlpha = 1;
          return;
        }
        default: {
          const a = U.clamp(pt.life / pt.max, 0, 1);
          ctx.globalAlpha = a; ctx.fillStyle = pt.color || '#fff';
          ctx.beginPath(); ctx.arc(pt.x, pt.y - z, (pt.size || 2) * 0.5, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
          return;
        }
      }
      if (!(s > 0.01)) return;
      blitRot(ctx, V, spr, pt.x, pt.y - z, s, s, rot);
    },

    drawNumber(ctx, n, view) {
      const V = tf(view);
      const spr = numSprite(n.value, n.crit, view.rt);
      const t = 1 - n.life / n.max;
      let sc = t < 0.1 ? 0.3 + (t / 0.1) * 1.05 : t < 0.24 ? 1.35 - ((t - 0.1) / 0.14) * 0.35 : 1;
      if (t > 0.72) sc *= 1 - ((t - 0.72) / 0.28) * 0.7;
      ctx.globalAlpha = t > 0.82 ? Math.max(0, 1 - (t - 0.82) / 0.18) : 1;
      blitRot(ctx, V, spr, n.x, n.y, sc, sc, (n.seed - 0.5) * 0.3);
      ctx.globalAlpha = 1;
    },

    drawIcon(ctx, id, size) {
      const fn = ICONS[id] || ICONS.dmg;
      ctx.save();
      ctx.scale(size / 48, size / 48);
      iconPaint(ctx, fn);
      ctx.restore();
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e) {
      // core star (pops in 50 ms) + comic action lines + a spark + a scuff of dust behind
      const h = e.type === 'colossus' ? 24 : e.type === 'ghost' ? 15 : 11, big = e.type === 'colossus';
      const x = e.x + (Math.random() - 0.5) * 5, z = h + (Math.random() - 0.5) * 5;
      game.addParticle({ kind: 'hit', x, y: e.y + 0.5, z, life: 0.16, size: big ? 1.0 : 0.74, rot: Math.random() * TAU, drag: 0 });
      game.addParticle({ kind: 'lines', x, y: e.y + 0.5, z, life: 0.15, size: big ? 1.3 : 0.9, n: 4, rot: Math.random() * TAU, drag: 0 });
      if (Math.random() < 0.6) {
        const a = Math.random() * TAU;
        game.addParticle({ kind: 'spark', x: e.x, y: e.y + 0.5, z: h, vx: Math.cos(a) * 60, vy: Math.sin(a) * 30, vz: 40, grav: 220, drag: 2, life: 0.3, size: 0.6 });
      }
      if (e.type !== 'ghost' && Math.random() < 0.5) puff(game, e.x - (e.kx > 0 ? 4 : -4), e.y + 0.5, 1, 1, 0.32, -(e.kx || 0) * 0.1, 0, 0.3, 2);
    },
    onKill(game, e) {
      // layered: white core star + action lines at once; the cloud of puffs opens 0.12 s later (after the
      // creature's own squash-and-stretch); stars + chunks fly; a dust ring and a few slow puffs linger
      const x = e.x, y = e.y + 0.6, T = e.type;
      const big = T === 'colossus', ghost = T === 'ghost';
      const h = big ? 22 : ghost ? 13 : 10;
      const tint = ghost ? 2 : big ? 3 : 0;
      game.addParticle({ kind: 'hit', x, y, z: h, life: 0.13, size: big ? 1.8 : 1.2, rot: Math.random() * TAU, drag: 0 });
      game.addParticle({ kind: 'lines', x, y, z: h, life: 0.2, size: big ? 1.8 : 1.15, n: 7, rot: Math.random() * TAU, drag: 0 });
      const nP = big ? 9 : 6, D = 0.12;
      for (let i = 0; i < nP; i++) {
        const a = (i / nP) * TAU + Math.random() * 0.6;
        const sp = (big ? 44 : 28) * (0.6 + Math.random() * 0.6);
        const pp = puff(game, x + Math.cos(a) * 3, y + Math.sin(a) * 1.2, h + Math.sin(a) * 4, tint, (big ? 1.45 : 0.9) * (0.75 + Math.random() * 0.5), Math.cos(a) * sp * 0.6, Math.sin(a) * sp * 0.33, 0.42 + Math.random() * 0.2 + D, 7);
        if (pp) { pp.delay = D; pp.drag = 3.2; }
      }
      const nS = big ? 6 : ghost ? 2 : 3;
      for (let i = 0; i < nS; i++) {
        const a = Math.random() * TAU, sp = 50 + Math.random() * 50;
        game.addParticle({ kind: 'star', tint: ghost ? 1 : 0, x, y, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 50, grav: 180, drag: 2.2, life: 0.55 + Math.random() * 0.15, size: (big ? 1.0 : 0.72) * (0.8 + Math.random() * 0.4), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 });
      }
      let cols;
      if (big) cols = [5, 4, 2, 7, 4, 5];
      else if (ghost) cols = [6, 6];
      else { const v = CREEP[Math.floor(e.seed * 3) % 3]; cols = [v.chunk, 1, 2, v.chunk]; }
      const nC = big ? 10 : ghost ? 2 : 4;
      for (let i = 0; i < nC; i++) {
        const a = Math.random() * TAU, sp = 30 + Math.random() * 45;
        game.addParticle({ kind: 'chunk', spr: cols[i % cols.length], x, y, z: h * 0.7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 60, grav: 280, drag: 1.2, life: 0.8 + Math.random() * 0.35, size: (big ? 1.25 : 1.0) * (0.8 + Math.random() * 0.5), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14 });
      }
      const ring = game.addParticle({ kind: 'ring', x, y, life: big ? 0.5 : 0.34, size: big ? 1.4 : 0.6, drag: 0, color: '#efe4f7' });
      if (ring) ring.delay = 0.06;
    },
    onHurt(game, p) {
      game.addParticle({ kind: 'hit', x: p.x, y: p.y + 0.5, z: 16, life: 0.18, size: 1.1, rot: Math.random() * TAU, drag: 0 });
      game.addParticle({ kind: 'lines', x: p.x, y: p.y + 0.5, z: 16, life: 0.18, size: 1.2, n: 6, rot: Math.random() * TAU, drag: 0, color: '#ffd3d8' });
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * TAU, sp = 50 + Math.random() * 40;
        game.addParticle({ kind: 'star', tint: 2, x: p.x, y: p.y + 0.5, z: 16, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50, grav: 180, drag: 2.2, life: 0.5, size: 0.7, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 });
      }
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * TAU;
        game.addParticle({ kind: 'chunk', spr: 3, x: p.x, y: p.y + 0.5, z: 18, vx: Math.cos(a) * 40, vy: Math.sin(a) * 24, vz: 60, grav: 280, drag: 1.2, life: 0.7, size: 0.6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14 });
      }
    },
    onPickup(game, g) {
      // at the collectible: a coloured ring, a twinkle, two sparks floating up
      const col = g.big ? '#9fdcff' : '#a8f0bb';
      game.addParticle({ kind: 'ring', x: g.x, y: g.y, life: 0.28, size: g.big ? 0.42 : 0.3, drag: 0, color: col });
      game.addParticle({ kind: 'spark', x: g.x, y: g.y + 0.5, z: 7, life: 0.3, size: g.big ? 1.1 : 0.75, drag: 0 });
      for (let i = 0; i < 2; i++) game.addParticle({ kind: 'spark', x: g.x + (i ? 3.5 : -3.5), y: g.y + 0.5, z: 5, vx: i ? 12 : -12, vz: 30 + i * 8, grav: 0.001, drag: 1.5, life: 0.4, size: 0.45 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.5) puff(game, pr.x, pr.y + 4, 4, 0, 0.28, pr.vx * 0.05, pr.vy * 0.05, 0.18, 0);
    },
    onDash(game, p) {
      for (let i = 0; i < 4; i++) puff(game, p.x - p.dashX * i * 3 + (Math.random() - 0.5) * 4, p.y + 0.5 - p.dashY * i * 3, 1.5, 1, 0.5 + Math.random() * 0.2, -p.dashX * 20, -p.dashY * 20, 0.38, 3);
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'rays', x: p.x, y: p.y + 0.5, z: 14, life: 0.7, size: 1.0, drag: 0, rot: Math.random() * TAU });
      game.addParticle({ kind: 'ring', x: p.x, y: p.y, life: 0.6, size: 1.6, drag: 0, color: '#ffd43f' });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU, sp = 70 + Math.random() * 30;
        game.addParticle({ kind: 'star', tint: 0, x: p.x, y: p.y + 0.5, z: 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 70, grav: 160, drag: 2.0, life: 0.9, size: 0.8, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10 });
      }
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * TAU, sp = 30 + Math.random() * 50;
        game.addParticle({ kind: 'conf', tint: i % CONF_COL.length, x: p.x, y: p.y + 0.5, z: 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, vz: 80 + Math.random() * 60, grav: 120, drag: 2.5, life: 1.3 + Math.random() * 0.5, size: 0.9 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10 });
      }
    },
    onDeath(game, p) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        puff(game, p.x, p.y + 0.5, 14, 4, 1.1, Math.cos(a) * 40, Math.sin(a) * 22, 0.7, 8);
      }
    },
  });
})();
