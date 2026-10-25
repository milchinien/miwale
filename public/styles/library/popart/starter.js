/* Pop-Art Comic — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Technique: every sprite is baked once by a "part painter" (clip -> flat process colour -> Ben-Day dots ->
   halftone shade crescent -> solid spot-black crescent -> brush ink outline, heavier on the shadow side),
   then a misregistered cyan/magenta colour plate is slipped behind it. Ground = newsprint with rotated,
   anti-aliased dot screens per region, separated by brush-ink contours of varying weight. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2, PI = Math.PI;
  const PALETTE = {
    ink: '#1b1620', paper: '#f4ecd4', flash: '#ffe94a', flashDot: '#ff7a1a',
    orange: '#ff8a1c', orangeDot: '#e0301e', rib: '#d8561a', glow: '#ffe23a', glowHi: '#fffbd0',
    cape: '#2c6ad0', capeDot: '#0f2f80', scarf: '#ea2a33', scarfDot: '#8a0c22', pants: '#2b2846', pantsSh: '#1f1c36',
    glove: '#fffaf0', stem: '#4c8a2a', leaf: '#3fae49', leafDot: '#1a6a2c', white: '#fcfbf4',
    cyan: '#2ec4ef', cyanDot: '#1aa0d8', mag: '#e0338f', yellow: '#ffe23a', red: '#e8262c',
  };
  const C = PALETTE, INK = C.ink, INKA = [30, 24, 36];
  const OL = 1.0, MR = 0.5, DSP = 1.3; // outline weight, plate misregistration, sprite dot spacing (world units)
  const CRV = [
    { top: '#d4308c', dot: '#2ec4ef', sh: '#5a0c48', bot: '#fdeabb', botDot: '#f08a3c', leaf: '#3fae49' },
    { top: '#8a3cc0', dot: '#e0338f', sh: '#2a0a50', bot: '#f8e6a6', botDot: '#e0338f', leaf: '#5bbf3a' },
  ];

  /* ---------- tiny deterministic helpers (replace U.* of the reference module) ---------- */
  function mulberry32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hashInt(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  /** Perlin gradient noise ~[-1,1]. */
  function perlin(x, y, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, u = fade(fx), v = fade(fy);
    const g = (ix, iy, dx, dy) => { const a = ((hashInt(ix, iy, s) & 15) / 16) * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
    const a = g(x0, y0, fx, fy) + u * (g(x0 + 1, y0, fx - 1, fy) - g(x0, y0, fx, fy));
    const b = g(x0, y0 + 1, fx, fy - 1) + u * (g(x0 + 1, y0 + 1, fx - 1, fy - 1) - g(x0, y0 + 1, fx, fy - 1));
    return (a + v * (b - a)) * 1.414;
  }
  function fbm(x, y, s, oct) { let sum = 0, amp = 0.5, n = 0; for (let i = 0; i < oct; i++) { sum += (perlin(x, y, s + i * 17) * 0.5 + 0.5) * amp; n += amp; amp *= 0.5; x *= 2; y *= 2; } return sum / n; }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }
  function tint(src, col) { const c = canvas(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }

  /* ---------- halftone: cached diamond dot tile (corners + centre), radius rf × tile/2 ---------- */
  const PAT = new Map();
  function dotPattern(ctx, col, rf, T) {
    const key = col + '|' + rf + '|' + T;
    if (PAT.has(key)) return PAT.get(key);
    const cv = canvas(T, T), c = cv.getContext('2d'), r = rf * T * 0.5;
    c.fillStyle = col; c.beginPath();
    for (const q of [[0, 0], [T, 0], [0, T], [T, T], [T / 2, T / 2]]) { c.moveTo(q[0] + r, q[1]); c.arc(q[0], q[1], r, 0, TAU); }
    c.fill();
    const p = ctx.createPattern(cv, 'repeat'); PAT.set(key, p); return p;
  }

  /* ---------- the part painter (ported 1:1 from the reference module) ---------- */
  function Painter(c, mode, k) { this.c = c; this.mode = mode; this.k = k; this.ol = OL; this.dsp = DSP; }
  /** fills the current clip with a dot screen: col, radius factor, spacing (units), rotation (deg) */
  Painter.prototype.dots = function (col, rf, sp, rot) {
    const T = Math.max(3, Math.round((sp || this.dsp) * this.k)), p = dotPattern(this.c, col, rf, T);
    let m = new DOMMatrix(); if (rot) m = m.rotate(rot);
    p.setTransform(m.scale(1 / this.k)); this.c.fillStyle = p; this.c.fillRect(-999, -999, 1999, 1999);
  };
  /** clips to "shape minus shape shifted by sh" = a crescent on the side opposite the shift */
  Painter.prototype.crescent = function (shape, sh, fn) {
    const c = this.c; c.save(); c.beginPath(); c.rect(-999, -999, 1999, 1999);
    c.translate(sh[0], sh[1]); shape(c); c.translate(-sh[0], -sh[1]); c.clip('evenodd'); fn(); c.restore();
  };
  Painter.prototype.part = function (shape, fill, o) {
    o = o || {}; const c = this.c, flash = this.mode === 'flash';
    c.save(); c.beginPath(); shape(c); c.clip();
    if (flash) { c.fillStyle = C.flash; c.fillRect(-999, -999, 1999, 1999); }
    else if (typeof fill === 'function') fill(c, this);
    else { c.fillStyle = fill; c.fillRect(-999, -999, 1999, 1999); }
    if (o.dots && !flash) this.dots(o.dots[0], o.dots[1], o.dots[2], o.dots[3]);
    if (o.sh) { const s = flash ? [C.flashDot, 0.55] : o.shade || [INK, 0.45]; this.crescent(shape, o.sh, () => this.dots(s[0], s[1], s[2], s[3])); }
    if (o.spot) this.crescent(shape, o.spot, () => { c.fillStyle = INK; c.fillRect(-999, -999, 1999, 1999); });
    if (o.detail && !flash) { c.save(); o.detail(c, this); c.restore(); }
    if (o.hi && !flash) { c.fillStyle = '#ffffff'; for (const h of o.hi) { c.beginPath(); c.ellipse(h[0], h[1], h[2], h[3], h[4] || 0, 0, TAU); c.fill(); } }
    c.restore();
    if (!o.noOl) { // brush outline: second, thinner stroke shifted down-right -> heavier on the shadow side
      const w = o.ol != null ? o.ol : this.ol; c.lineWidth = w; c.strokeStyle = INK;
      c.beginPath(); shape(c); c.stroke();
      c.save(); c.translate(w * 0.3, w * 0.36); c.lineWidth = w * 0.85; c.beginPath(); shape(c); c.stroke(); c.restore();
    }
    if (o.ink) { c.save(); c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = this.ol * 0.55; o.ink(c, flash); c.restore(); }
  };
  Painter.prototype.detail = function (fn) { const c = this.c; c.save(); c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = this.ol * 0.55; fn(c, this.mode === 'flash'); c.restore(); };

  /* ---------- shape helpers ---------- */
  const E = (x, y, rx, ry) => (c) => { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const CAP = (x1, y1, x2, y2, r) => (c) => { const a = Math.atan2(y2 - y1, x2 - x1); c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r); c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5); c.arc(x2, y2, r, a - PI / 2, a + PI / 2); c.closePath(); };
  const POLY = (pts) => (c) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
  function starPts(n, ro, ri, cx, cy, rot, jit, seed) {
    const pts = [], r = mulberry32(seed || 7);
    for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU + (jit ? (r() - 0.5) * jit * 0.5 / n : 0); const rr = (i & 1 ? ri : ro) * (jit ? 1 - r() * jit : 1); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return pts;
  }
  const PUMPKIN = (cx, cy, rx, ry) => (c) => {
    for (let i = 0; i <= 56; i++) {
      const th = (i / 56) * TAU, co = Math.cos(th), si = Math.sin(th);
      const x = Math.sign(co) * Math.pow(Math.abs(co), 0.85) * rx;
      const y = Math.sign(si) * Math.pow(Math.abs(si), 0.92) * ry * (1 - 0.15 * Math.exp(-Math.pow((th - PI * 1.5) / 0.3, 2)) - 0.07 * Math.exp(-Math.pow((th - PI * 0.5) / 0.26, 2)));
      if (i) c.lineTo(cx + x, cy + y); else c.moveTo(cx + x, cy + y);
    }
    c.closePath();
  };
  const TURNIP = (cx, top, bottom, w) => (c) => { const h = bottom - top; c.moveTo(cx, top); c.bezierCurveTo(cx + w * 0.42, top + h * 0.02, cx + w, top + h * 0.22, cx + w, top + h * 0.56); c.bezierCurveTo(cx + w, top + h * 0.86, cx + w * 0.55, bottom, cx, bottom); c.bezierCurveTo(cx - w * 0.55, bottom, cx - w, top + h * 0.86, cx - w, top + h * 0.56); c.bezierCurveTo(cx - w, top + h * 0.22, cx - w * 0.42, top + h * 0.02, cx, top); c.closePath(); };
  const LEAF = (bx, by, a, len, wid) => (c) => { const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx, tx = bx + dx * len, ty = by + dy * len; c.moveTo(bx, by); c.bezierCurveTo(bx + dx * len * 0.22 + nx * wid, by + dy * len * 0.22 + ny * wid, tx - dx * len * 0.3 + nx * wid * 0.75, ty - dy * len * 0.3 + ny * wid * 0.75, tx, ty); c.bezierCurveTo(tx - dx * len * 0.3 - nx * wid * 0.75, ty - dy * len * 0.3 - ny * wid * 0.75, bx + dx * len * 0.22 - nx * wid, by + dy * len * 0.22 - ny * wid, bx, by); c.closePath(); };
  /** two-tone fill: top colour above a wavy ink line, each with its own dot screen */
  const twoTone = (top, topDot, topRf, bot, botDot, botRf, waveY, amp, freq) => (c, P) => {
    c.fillStyle = bot; c.fillRect(-999, -999, 1999, 1999); if (botDot) P.dots(botDot, botRf, null, 30);
    const wave = (x) => waveY + amp * Math.sin(x * freq + 0.6);
    c.save(); c.beginPath(); c.moveTo(-90, -200); c.lineTo(90, -200); for (let x = 90; x >= -90; x -= 0.5) c.lineTo(x, wave(x)); c.closePath(); c.clip();
    c.fillStyle = top; c.fillRect(-999, -999, 1999, 1999); if (topDot) P.dots(topDot, topRf); c.restore();
    c.strokeStyle = INK; c.lineWidth = 0.45; c.beginPath(); for (let x = -90; x <= 90; x += 0.5) (x === -90 ? c.moveTo : c.lineTo).call(c, x, wave(x)); c.stroke();
  };
  /** carved hole: black rim + glowing inside shifted down-right */
  function carve(c, flash, shape, dx, dy) { c.beginPath(); shape(c); c.fillStyle = INK; c.fill(); c.save(); c.beginPath(); shape(c); c.clip(); c.translate(dx, dy); c.beginPath(); shape(c); c.fillStyle = flash ? '#fff' : C.glow; c.fill(); c.restore(); }

  /* ---------- sprite baking: K px per world unit, misregistered plate behind ---------- */
  let K = 4;
  function build(box, fn, mode, plate) {
    const m = 1.4 + MR, l = box[0] - m, t = box[1] - m, r = box[2] + m, b = box[3] + m;
    const cv = canvas(Math.ceil((r - l) * K), Math.ceil((b - t) * K)), ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, mode || 'n', K));
    if (plate) { const tn = tint(cv, plate); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'destination-over'; ctx.globalAlpha = 0.65; ctx.drawImage(tn, -MR * K, MR * K * 0.75); }
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function blit(ctx, s, x, y, sx, sy, rot) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx / K, sy / K);
    ctx.drawImage(s.c, -s.ox, -s.oy); ctx.restore();
  }

  /* ---------- main character: round pumpkin head with cape + scarf. Frames: idle, step A, pass, step B ---------- */
  const JACK_FR = [[-2.2, 0, 2.3, 0, 0.2, -0.2, 0], [-3.4, -0.3, 3.7, -0.9, 0.85, -0.75, 1], [-0.5, -1.9, 1.1, 0, 0.12, 0.05, 0.45], [3.3, -0.6, -2.9, -0.2, -0.75, 0.85, 1]];
  function heroParts(P, f) {
    const F = JACK_FR[f], fl = F[6];
    const leg = (hx, fx, fy, back) => { P.part(CAP(hx, -8.6, fx, fy - 1.5, 1.35), back ? C.pantsSh : C.pants, { ol: 0.85 }); P.part(E(fx + 0.9, fy - 1.05, 2.25, 1.35), INK, { ol: 0.6, hi: [[fx + 0.4, fy - 1.65, 0.75, 0.32, -0.15]] }); };
    const arm = (sx, sy, a, back) => { const ex = sx + Math.sin(a) * 5, ey = sy + Math.cos(a) * 5; P.part(CAP(sx, sy, ex, ey, 1.25), back ? C.capeDot : C.cape, { ol: 0.85, dots: back ? null : [C.capeDot, 0.35] }); P.part(E(ex, ey + 0.2, 1.55, 1.5), C.glove, { ol: 0.8, sh: [-0.6, -0.6], shade: [C.cyanDot, 0.5] }); };
    const wv = Math.sin(f * 1.7) * 0.9;
    P.part(POLY([[-1.2, -17.2], [-6.2 - fl * 1.6, -17.6 + wv], [-8.4 - fl * 2.2, -15.6 + wv * 1.4], [-6.6 - fl * 1.2, -14.9 + wv], [-1.6, -15.2]]), C.scarf, { ol: 0.8, sh: [0, -0.8], shade: [C.scarfDot, 0.5] });
    leg(-1.4, F[0], F[1], true); arm(-2.0, -14.0, F[4], true);
    const cape = (c) => { c.moveTo(-2.7, -16.6); c.lineTo(2.9, -16.6); c.quadraticCurveTo(4.8, -12.2, 5.2, -6.9); c.quadraticCurveTo(2.2, -5.5, -0.8, -6.3); c.quadraticCurveTo(-3.6, -5.1 + fl * 0.5, -6.6 - fl * 1.6, -6.7 - fl * 0.9); c.quadraticCurveTo(-5.0, -12.2, -2.7, -16.6); c.closePath(); };
    leg(1.4, F[2], F[3], false);
    P.part(cape, C.cape, { sh: [1.7, -1.3], shade: [C.capeDot, 0.55], spot: [0.75, -0.55], ink(c) { c.lineWidth = 0.5; c.beginPath(); c.moveTo(-0.4, -14.2); c.quadraticCurveTo(-1.6, -10.5, -2.4, -7.2); c.moveTo(2.0, -13.6); c.quadraticCurveTo(2.6, -10.2, 2.4, -7.0); c.stroke(); } });
    arm(2.5, -13.8, F[5], false);
    P.part(E(0.4, -16.4, 3.9, 1.55), C.scarf, { ol: 0.85, sh: [0, -0.7], shade: [C.scarfDot, 0.5] });
    const hx = 0.4, hy = -22.6, rx = 8.4, ry = 6.9;
    P.part(CAP(0.4, -28.6, 1.5, -31.6, 1.05), C.stem, { ol: 0.8, spot: [-0.6, 0] });
    P.part(PUMPKIN(hx, hy, rx, ry), C.orange, {
      sh: [-2.3, -1.9], shade: [C.orangeDot, 0.55], spot: [-0.85, -0.75], ol: 1.15,
      detail(c) { c.strokeStyle = C.rib; c.lineWidth = 0.55; for (const k of [-0.62, -0.25, 0.25, 0.62]) { c.beginPath(); c.moveTo(hx + k * rx * 0.25, hy - ry * 0.92); c.quadraticCurveTo(hx + k * rx * 1.25, hy, hx + k * rx * 0.25, hy + ry * 0.95); c.stroke(); } },
      hi: [[hx - 4.4, hy - 3.6, 2.1, 0.85, -0.6], [hx - 6.3, hy - 1.4, 0.5, 0.5, 0]],
    });
    P.detail((c, flash) => {
      const fx = hx + 1.4, y = hy;
      carve(c, flash, POLY([[fx - 4.5, y - 0.4], [fx - 1.1, y - 0.6], [fx - 2.9, y - 3.9]]), 0.3, 0.55);
      carve(c, flash, POLY([[fx + 1.0, y - 0.6], [fx + 4.4, y - 0.3], [fx + 2.5, y - 3.9]]), 0.3, 0.55);
      carve(c, flash, POLY([[fx - 5.4, y + 1.6], [fx - 3.4, y + 2.5], [fx - 2.6, y + 1.5], [fx - 1.4, y + 2.8], [fx + 0.6, y + 2.8], [fx + 1.6, y + 1.5], [fx + 2.5, y + 2.5], [fx + 4.9, y + 1.4], [fx + 3.6, y + 4.3], [fx + 1.2, y + 5.2], [fx + 0.5, y + 4.2], [fx - 0.6, y + 5.3], [fx - 3.4, y + 4.6]]), 0.25, 0.6);
    });
  }

  /* ---------- small creature: two-tone root body with leaf crown, angry face ---------- */
  const CR_FR = [[-2.6, 0, 2.6, 0], [-3.4, -1.5, 2.2, 0], [-2.6, 0, 2.6, 0], [-2.2, 0, 3.4, -1.5]];
  function enemyParts(P, f, v) {
    const col = CRV[v], F = CR_FR[f];
    for (const q of [[-0.66, 7.0, 2.3], [0.6, 6.4, 2.2], [0.02, 8.4, 2.5]]) P.part(LEAF(0.2, -19.4, q[0], q[1], q[2]), col.leaf, { ol: 0.8, spot: [-1.0, 0.25], dots: [C.leafDot, 0.3] });
    P.part(CAP(-1.9, -4.5, F[0], F[1] - 0.6, 1.05), col.bot, { ol: 0.8, sh: [-0.5, 0], shade: [col.botDot, 0.5] });
    P.part(CAP(1.9, -4.5, F[2], F[3] - 0.6, 1.05), col.bot, { ol: 0.8, sh: [-0.5, 0], shade: [col.botDot, 0.5] });
    P.part(TURNIP(0, -20.6, -2.6, 8.5), twoTone(col.top, col.dot, 0.42, col.bot, col.botDot, 0.22, -12.2, 0.9, 0.9), { sh: [-2.3, -1.5], shade: [col.sh, 0.6], spot: [-0.95, -0.6], ol: 1.1, hi: [[-4.4, -16.2, 1.6, 0.7, -0.8]] });
    P.detail((c, flash) => {
      const fx = 1.3;
      for (const ex of [fx - 2.4, fx + 2.4]) { c.beginPath(); c.ellipse(ex, -12.0, 1.55, 1.75, 0, 0, TAU); c.fillStyle = flash ? '#fff' : C.glow; c.fill(); c.lineWidth = 0.55; c.stroke(); c.fillStyle = INK; c.beginPath(); c.ellipse(ex + 0.5, -11.7, 0.62, 1.0, 0, 0, TAU); c.fill(); }
      c.beginPath(); c.moveTo(fx - 4.6, -15.6); c.lineTo(fx - 0.7, -13.7); c.lineTo(fx - 0.9, -12.9); c.lineTo(fx - 4.4, -14.4); c.closePath(); c.moveTo(fx + 4.6, -15.6); c.lineTo(fx + 0.7, -13.7); c.lineTo(fx + 0.9, -12.9); c.lineTo(fx + 4.4, -14.4); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(fx - 3.3, -6.6); c.quadraticCurveTo(fx, -10.4, fx + 3.3, -6.6); c.lineTo(fx + 2.2, -5.5); c.quadraticCurveTo(fx, -7.4, fx - 2.2, -5.5); c.closePath(); c.fill();
      c.fillStyle = flash ? '#fff' : '#ff5a6a'; c.beginPath(); c.ellipse(fx, -6.9, 1.3, 0.5, 0, 0, TAU); c.fill();
    });
  }

  /* ---------- cached sprite sets ---------- */
  let SPR = null;
  function bake(s) {
    K = Math.max(3, Math.min(5, Math.round(s * 1.4)));
    SPR = { K, hero: [], heroF: [], enemy: [[], []] };
    for (let f = 0; f < 4; f++) {
      SPR.hero.push(build([-11, -33, 10, 1.5], (P) => heroParts(P, f), 'n', C.cyan));
      for (let v = 0; v < 2; v++) SPR.enemy[v].push(build([-10, -29, 10, 1.5], (P) => enemyParts(P, f, v), 'n', C.cyan));
    }
    SPR.flash = build([-10, -29, 10, 1.5], (P) => enemyParts(P, 0, 0), 'flash', C.cyan); // yellow "impact" frame
    // contact shadow: two concentric rings of ink dots (outer rf .5, inner rf .95), never a blurred blob
    SPR.shadow = build([-10, -4, 10, 4], (P) => { const c = P.c; c.save(); c.beginPath(); c.ellipse(0, 0, 9.6, 3.5, 0, 0, TAU); c.clip(); P.dots(INK, 0.5, 1.15); c.restore(); c.save(); c.beginPath(); c.ellipse(0, 0, 6.4, 2.3, 0, 0, TAU); c.clip(); P.dots(INK, 0.95, 1.15); c.restore(); });
    // lantern light: hex grid of yellow dots, radius ∝ (1-d)^0.7
    SPR.glow = build([-16, -16, 16, 16], (P) => { const c = P.c, sp = 1.6; c.fillStyle = C.yellow; c.beginPath(); for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) { const x = i * sp + (j & 1 ? sp / 2 : 0), y = j * sp * 0.866, d = Math.hypot(x, y) / 15; if (d >= 1) continue; const r = Math.pow(1 - d, 0.7) * sp * 0.55; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.fill(); });
    SPR.boom = build([-11, -11, 11, 11], (P) => P.part(POLY(starPts(12, 10, 5.6, 0, 0, 0.1, 0.38, 31)), C.yellow, { ol: 0.9, detail(c, P2) { c.save(); c.beginPath(); c.arc(0, 0, 6.2, 0, TAU); c.clip(); P2.dots(C.red, 0.62, 1.15); c.restore(); c.save(); c.beginPath(); c.arc(0, 0, 3.6, 0, TAU); c.clip(); P2.dots(C.red, 0.95, 1.15); c.restore(); } }), 'n', C.cyan);
    SPR.seed = build([-4, -3, 4.5, 3], (P) => P.part((c) => { c.moveTo(3.7, 0); c.bezierCurveTo(2.4, -2.4, -2.6, -2.6, -3.2, 0); c.bezierCurveTo(-2.6, 2.6, 2.4, 2.4, 3.7, 0); c.closePath(); }, '#fff1c8', { ol: 0.8, sh: [-0.9, -0.9], shade: [C.orange, 0.6], spot: [-0.4, -0.4] }), 'n', C.mag);
    SPR.gem = build([-3.5, -8, 3.5, 0], (P) => P.part((c) => { c.moveTo(0, -7.2); c.bezierCurveTo(2.6, -5.2, 2.6, -1.8, 0, -0.6); c.bezierCurveTo(-2.6, -1.8, -2.6, -5.2, 0, -7.2); c.closePath(); }, C.cyan, { ol: 0.8, sh: [-0.9, -0.9], shade: ['#0a5a9a', 0.6], hi: [[-0.8, -4.8, 0.55, 1.2, 0.2]] }), 'n', C.mag);
  }

  /* ---------- ground: per-pixel newsprint with rotated AA dot screens + ink contours ---------- */
  // materials: 0 meadow, 1 autumn field, 2 night, 3 graveyard, 4 path (paper rgb + one dot screen)
  const MATS = [
    { p: [237, 233, 199], sc: { ink: [104, 176, 98], sp: 3.3, a: 0.785, r0: 0.17, r1: 0.33 } },
    { p: [250, 216, 128], sc: { ink: [232, 98, 62], sp: 3.0, a: 0.26, r0: 0.15, r1: 0.31 } },
    { p: [200, 210, 232], sc: { ink: [86, 104, 178], sp: 3.0, a: 0.785, r0: 0.22, r1: 0.36 } },
    { p: [224, 211, 222], sc: { ink: [134, 96, 160], sp: 2.8, a: 1.05, r0: 0.2, r1: 0.36 } },
    { p: [249, 233, 170], sc: null, hatch: true },
  ];
  const GSTEP = 4, NF = 6;
  /** region fields (>0 = inside), tone, line-weight noise, paper yellowing. Scales shrunk ~3x vs. the reference module so a preview shows several regions. */
  function fieldsAt(x, y, o) {
    const wx = perlin(x / 300, y / 300, 711) * 40, wy = perlin(x / 300 + 9.2, y / 300, 712) * 40, X = x + wx, Y = y + wy;
    o[0] = fbm(X / 330 + 3.1, Y / 330, 121, 3) - 0.56;
    o[1] = fbm(X / 300 - 7.7, Y / 300, 131, 3) - 0.66;
    o[2] = fbm(X / 260 + 17.3, Y / 260, 141, 3) - 0.61;
    o[3] = (0.022 - Math.abs(perlin((x + perlin(x / 140, y / 140, 151) * 20) / 520, y / 520, 153))) * 3.2;
    o[4] = Math.min(1, Math.max(0, 0.5 + perlin(x / 80, y / 80, 161) * 0.42 + perlin(x / 430, y / 430, 162) * 0.3));
    o[5] = perlin(x / 36, y / 36, 171) * 0.5 + 0.5;
  }
  function bakeGround(W, H, s) {
    const cv = canvas(W, H), ctx = cv.getContext('2d'), ww = W / s, wh = H / s;
    const nx = Math.ceil(ww / GSTEP) + 2, ny = Math.ceil(wh / GSTEP) + 2, F = new Float32Array(nx * ny * NF), tmp = new Float32Array(NF);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { fieldsAt(i * GSTEP, j * GSTEP, tmp); F.set(tmp, (j * nx + i) * NF); }
    const img = ctx.createImageData(W, H), buf = new Uint32Array(img.data.buffer), res = s, MAT = new Uint8Array(W * H);
    for (let py = 0; py < H; py++) {
      const y = (py + 0.5) / s, gy = Math.min(ny - 2, (y / GSTEP) | 0), v = y / GSTEP - gy, v1 = 1 - v;
      for (let px = 0; px < W; px++) {
        const x = (px + 0.5) / s, gx = Math.min(nx - 2, (x / GSTEP) | 0), u = x / GSTEP - gx, u1 = 1 - u;
        const o00 = (gy * nx + gx) * NF, o10 = o00 + NF, o01 = o00 + nx * NF, o11 = o01 + NF;
        const L_ = (k) => F[o00 + k] * u1 * v1 + F[o10 + k] * u * v1 + F[o01 + k] * u1 * v + F[o11 + k] * u * v;
        const tone = L_(4), hw = 0.42 + 0.62 * L_(5); // contour half-width varies 0.42..1.04 units = brush feel
        let m = 0, ink = 0, dEdge = 99;
        for (let L = 3; L >= 0; L--) { // topmost layer wins; ink where |signed distance| < hw
          const A = F[o00 + L], B = F[o10 + L], Cc = F[o01 + L], D = F[o11 + L], sv = L_(L);
          const du = (B - A) * v1 + (D - Cc) * v, dv = (Cc - A) * u1 + (D - B) * u, gl = Math.sqrt(du * du + dv * dv) / GSTEP;
          const dist = gl > 1e-9 ? sv / gl : sv > 0 ? 99 : -99;
          const ic = Math.min(1, (hw - Math.abs(dist)) * res + 0.5); if (ic > ink) ink = ic;
          if (dist > 0) { m = L + 1; dEdge = dist; break; }
        }
        MAT[py * W + px] = m; const M = MATS[m]; let r = M.p[0], g = M.p[1], b = M.p[2];
        const q = M.sc;
        if (q) { // rotated dot screen, dot radius follows the tone field, anti-aliased coverage, multiply blend
          const ca = Math.cos(q.a), sa = Math.sin(q.a), su = (x * ca + y * sa) / q.sp, s2 = (y * ca - x * sa) / q.sp;
          const fu = su - Math.floor(su) - 0.5, fv = s2 - Math.floor(s2) - 0.5, d = Math.sqrt(fu * fu + fv * fv) * q.sp;
          const cov = Math.min(1, (q.sp * (q.r0 + (q.r1 - q.r0) * tone) - d) * res + 0.5);
          if (cov > 0) { r *= 1 - cov * (1 - q.ink[0] / 255); g *= 1 - cov * (1 - q.ink[1] / 255); b *= 1 - cov * (1 - q.ink[2] / 255); }
        }
        if (M.hatch && dEdge < 14) { // diagonal speed-hatching hugging the path edges, tapering inward
          const hl = 1.5 + 9 * tone * tone, e = dEdge - hw;
          if (e < hl) { const f = (x - y) * 0.7071 / 1.7, dd = Math.abs(f - Math.floor(f) - 0.5) * 1.7, hc = Math.min(1, (0.34 * (1 - Math.max(0, e) / hl) - dd) * res + 0.5); if (hc > ink) ink = hc; }
        }
        const gr = 0.985 + ((hashInt(px, py, 4242) / 4294967296) - 0.5) * 0.045; // paper grain
        r *= gr; g *= gr; b *= gr;
        if (ink > 0) { r += (INKA[0] - r) * ink; g += (INKA[1] - g) * ink; b += (INKA[2] - b) * ink; }
        buf[py * W + px] = (255 << 24) | (Math.min(255, b) << 16) | (Math.min(255, g) << 8) | Math.min(255, r);
      }
    }
    ctx.putImageData(img, 0, 0);
    // decals: ink grass tufts + tiny 5-petal flowers
    ctx.setTransform(s, 0, 0, s, 0, 0); const rr = mulberry32(7001);
    for (let i = 0; i < ww * wh / 420; i++) {
      const x = rr() * ww, y = rr() * wh, k = rr(), z = 0.8 + rr() * 0.4, mm = MAT[Math.min(H - 1, (y * s) | 0) * W + Math.min(W - 1, (x * s) | 0)];
      if (mm === 4 || (mm !== 0 && k > 0.4)) continue; // flowers only on the meadow, nothing on the path
      if (k < 0.75) { ctx.fillStyle = INK; ctx.beginPath(); for (const q of [[-1.6, -2.6, -0.9], [0.1, -3.6, 0], [1.7, -2.4, 0.9]]) { ctx.moveTo(x + q[2] * z - 0.45 * z, y); ctx.quadraticCurveTo(x + q[2] * z, y - 1.2 * z, x + q[0] * z, y + q[1] * z); ctx.quadraticCurveTo(x + q[2] * z + 0.3 * z, y - 1.2 * z, x + q[2] * z + 0.45 * z, y); ctx.closePath(); } ctx.fill(); }
      else { ctx.fillStyle = k < 0.88 ? '#ffffff' : '#ff9ac8'; ctx.strokeStyle = INK; ctx.lineWidth = 0.35; ctx.beginPath(); for (let p = 0; p < 5; p++) { const a = (p / 5) * TAU - PI / 2, fx = x + Math.cos(a) * 0.95 * z, fy = y + Math.sin(a) * 0.95 * z; ctx.moveTo(fx + 0.7 * z, fy); ctx.arc(fx, fy, 0.7 * z, 0, TAU); } ctx.fill(); ctx.stroke(); ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(x, y, 0.55 * z, 0, TAU); ctx.fill(); ctx.stroke(); }
    }
    return cv;
  }

  /* ---------- screen overlay: ink-dot vignette, paper gutter, brushy panel frame ---------- */
  function bakeOverlay(W, H) {
    const cv = canvas(W, H), ctx = cv.getContext('2d'), sp = Math.max(7, Math.round(H / 100));
    ctx.fillStyle = 'rgba(27,22,32,0.42)'; ctx.beginPath();
    for (let j = 0, y = 0; y < H + sp; y += sp, j++) for (let x = j & 1 ? sp / 2 : 0; x < W + sp; x += sp) {
      const d = Math.hypot((x / W - 0.5) * 2, (y / H - 0.5) * 2 * 1.05), t = Math.min(1, Math.max(0, (d - 0.9) / 0.52)), v = t * t * (3 - 2 * t);
      if (v > 0.04) { const r = v * sp * 0.62; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
    }
    ctx.fill();
    const g = Math.max(4, Math.round(H * 0.006)), lw = g, rr = mulberry32(3);
    ctx.fillStyle = C.paper; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(g, g, W - 2 * g, H - 2 * g); ctx.fill('evenodd');
    ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    const edge = (x0, y0, x1, y1) => { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const t = i / 24, jj = (rr() - 0.5) * lw * 0.35; const x = x0 + (x1 - x0) * t + (y0 === y1 ? 0 : jj), y = y0 + (y1 - y0) * t + (y0 === y1 ? jj : 0); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.lineWidth = lw * (0.9 + rr() * 0.3); ctx.stroke(); };
    const o = g + lw / 2; edge(o, o, W - o, o); edge(W - o, o, W - o, H - o); edge(W - o, H - o, o, H - o); edge(o, H - o, o, o);
    return cv;
  }

  /* ---------- onomatopoeia burst: jagged star balloon, plate offset, dotted rim, outlined Bangers text ---------- */
  function wordBurst(ctx, word, x, y, sc, rot, col) {
    const fs = 11; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.font = fs + 'px "Bangers", Impact, "Arial Black", sans-serif';
    const rx = ctx.measureText(word).width / 2 + fs * 0.75, ry = fs;
    const pts = starPts(13, 1, 0.72, 0, 0, 0.1, 0.3, word.length * 31);
    const path = () => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, q[0] * rx, q[1] * ry)); ctx.closePath(); };
    ctx.lineJoin = 'round';
    ctx.save(); ctx.translate(-0.8, 0.7); ctx.globalAlpha = 0.7; ctx.fillStyle = col[2]; path(); ctx.fill(); ctx.restore();
    path(); ctx.fillStyle = col[0]; ctx.fill();
    ctx.save(); path(); ctx.clip(); ctx.globalAlpha = 0.55; ctx.fillStyle = col[2]; ctx.beginPath();
    for (let gy = -ry; gy < ry; gy += 1.4) for (let gx = -rx; gx < rx; gx += 1.4) { if ((gx * gx) / (rx * rx * 0.38) + (gy * gy) / (ry * ry * 0.38) < 1) continue; ctx.moveTo(gx + 0.3, gy); ctx.arc(gx, gy, 0.3, 0, TAU); }
    ctx.fill(); ctx.restore();
    path(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = INK; ctx.fillText(word, 0.9, 1.6); ctx.lineWidth = fs * 0.2; ctx.strokeText(word, 0, 0.7);
    ctx.fillStyle = col[1]; ctx.fillText(word, 0, 0.7); ctx.restore();
  }
  function damageNumber(ctx, txt, x, y, sc) { // emphasised number: white star balloon, cyan plate, yellow digits
    const fs = 13; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.font = fs + 'px "Bangers", Impact, sans-serif';
    const rx = ctx.measureText(txt).width / 2 + fs * 0.9 - 1, ry = fs * 1.05 - 1;
    ctx.beginPath(); starPts(11, 1, 0.74, 0, 0, 0.2, 0.25, +txt).forEach((q, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, q[0] * rx, q[1] * ry)); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.85; ctx.fillStyle = C.cyan; ctx.fillText(txt, -0.7, 1.4); ctx.globalAlpha = 1;
    ctx.lineWidth = fs * 0.22; ctx.strokeText(txt, 0, 0.8); ctx.fillStyle = C.yellow; ctx.fillText(txt, 0, 0.8); ctx.restore();
  }

  /** Draws the main character with feet at (x, y). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) {
    if (!SPR) bake(4);
    const ph = t * 1.6, step = Math.floor(ph * 4), frame = [1, 2, 3, 2][step & 3], f = ph * 2 - Math.floor(ph * 2);
    const lift = Math.sin(f * PI) * 1.8 * 1.12;
    blit(ctx, SPR.hero[frame], x, y - lift, 1.12 * facing, 1.12, 0.05 * facing * Math.sin(f * PI));
  }
  /** Draws a typical creature with feet at (x, y). variant 0|1, flash 0..1 = impact flash strength. */
  function drawEnemy(ctx, x, y, t, variant, facing, flash) {
    if (!SPR) bake(4);
    const ph = t * 1.5, f = Math.floor(ph * 4) & 3, sn = Math.sin(ph * TAU), up = Math.abs(sn);
    const sx = 0.92 * (1 + (1 - up) * 0.05) * (facing || 1), sy = 0.92 * (1 - (1 - up) * 0.05 + up * 0.03);
    blit(ctx, SPR.enemy[variant || 0][f], x, y - up * 1.2, sx, sy, sn * 0.09);
    if (flash) { ctx.globalAlpha = Math.min(0.9, flash); blit(ctx, SPR.flash, x, y - up * 1.2, sx, sy, sn * 0.09); ctx.globalAlpha = 1; }
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds). */
  let GC = null, OC = null;
  function draw(ctx, w, h, t) {
    const s = h / 360, ww = w / s;
    const k = Math.max(3, Math.min(5, Math.round(s * 1.4)));
    if (!SPR || SPR.K !== k) bake(s);
    if (!GC || GC.width !== w || GC.height !== h) { GC = bakeGround(w, h, s); OC = bakeOverlay(w, h); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(GC, 0, 0);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const cx = ww / 2, cy = 196;
    const foes = [[cx + 70, cy - 10, 0, -1], [cx + 110, cy + 40, 1, -1], [cx - 90, cy + 30, 1, 1], [cx + 150, cy - 50, 0, -1], [cx - 140, cy - 60, 0, 1], [cx + 40, cy + 90, 1, -1], [cx - 40, cy - 100, 1, 1], [cx + 200, cy + 70, 0, -1]];
    ctx.globalAlpha = 0.8; blit(ctx, SPR.glow, cx, cy + 1, 1.5, 0.62); ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const gx = cx + 30 + i * 9, gy = cy + 22 + (i & 1) * 6; ctx.globalAlpha = 0.5; blit(ctx, SPR.shadow, gx, gy, 0.28, 0.28); ctx.globalAlpha = 1; blit(ctx, SPR.gem, gx, gy - 1.4 - Math.sin(t * 5 + i * 2) * 1.0, 1, 1); }
    const actors = foes.map((e, i) => ({ y: e[1], d: () => drawEnemy(ctx, e[0], e[1], t + i * 0.37, e[2], e[3], i === 0 ? 0.55 : 0) }));
    actors.push({ y: cy, d: () => drawHero(ctx, cx, cy, t, 1) });
    ctx.globalAlpha = 0.65; blit(ctx, SPR.shadow, cx, cy + 0.4, 0.98, 0.98); ctx.globalAlpha = 0.55;
    for (const e of foes) blit(ctx, SPR.shadow, e[0], e[1] + 0.4, 0.875, 0.875);
    ctx.globalAlpha = 1;
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.d());
    // seed projectile with black speed streak
    const px = cx + 22 + ((t * 120) % 40), py = cy - 14 - ((t * 120) % 40) * 0.25, ang = -0.24;
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.fillStyle = INK; ctx.beginPath();
    for (const q of [[0, 1.0, 15], [-2.0, 0.55, 10], [2.0, 0.55, 11]]) { ctx.moveTo(-3.5, q[0] - q[1] / 2); ctx.lineTo(-3.5 - q[2], q[0]); ctx.lineTo(-3.5, q[0] + q[1] / 2); ctx.closePath(); }
    ctx.globalAlpha = 0.85; ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
    blit(ctx, SPR.seed, px, py, 1, 0.6 + 0.4 * Math.abs(Math.cos(t * 12)), ang);
    // big burst + sound-word balloon + pop-up number
    const bt = 0.3 + ((t * 1.2) % 1) * 0.4, bsc = (1 + (bt - 0.16) * 0.35) * 1.2;
    blit(ctx, SPR.boom, cx - 70, cy - 70, bsc, bsc, bt * 0.5);
    wordBurst(ctx, 'POW!', cx - 66, cy - 98, 1.3, -0.12, [C.yellow, C.red, C.orangeDot]);
    wordBurst(ctx, 'ZONK!', cx + 150, cy + 110, 1.15, 0.1, [C.cyan, '#ffffff', '#0a5a9a']);
    damageNumber(ctx, '34', foes[0][0] + 4, foes[0][1] - 36, 0.95);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(OC, 0, 0);
  }

  const Starter = { id: 'popart', name: 'Pop-Art Comic', palette: PALETTE, fonts: ['Bangers', 'Comic Neue:wght@700'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['popart'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
