/* Native art for the new enemies / upgrades in the 'popart' world (Pop-Art Comic) – see js/content/ART_API.md.
   Same print language as js/styles/popart.js: part painter (flat process colour -> Ben-Day dots -> halftone shade
   crescent -> spot black -> white shine -> brush-ink outline heavier on the shadow side), misregistered colour
   plate, a yellow "impact" frame for hits / death, elastic pop-out spawn. */
(function () {
  'use strict';
  const U = window.U, CT = window.Content;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ---------- palette (copied from the style) ---------- */
  const INK = '#1b1620';
  const FLASH = '#ffe94a', FLASH_DOT = '#ff7a1a';
  const OL = 1.0, MR = 0.5, DSP = 1.3;
  const C = {
    orange: '#ff8a1c', orangeDot: '#e0301e', rib: '#d8561a', glow: '#ffe23a', glowHi: '#fffbd0',
    leaf: '#3fae49', leafDot: '#1a6a2c', leafDark: '#2b8a3e', stem: '#4c8a2a',
    white: '#fcfbf4', cyan: '#2ec4ef', cyanDot: '#1aa0d8', mag: '#e0338f', blue: '#2c6ad0',
    yellow: '#ffe23a', red: '#e8262c', redDot: '#8a0c22',
    coTop: '#8a3a86', coBot: '#c98545', coBotDot: '#a33a1c', coSh: '#3a1030', coLeg: '#9a5a30',
    wood: '#d39a58', woodDot: '#7a4520', cream: '#fdeabb', purple: '#8a3cc0', purpleSh: '#2a0a50', pink: '#d4308c',
    tox: '#7bd63a', toxDot: '#1f7a1a', toxSh: '#0f3a0c', toxHot: '#e2ff5a',
  };
  let K = 4;

  /* ---------- halftone + part painter (copied from the style; flash colour configurable) ---------- */
  const PAT = new Map();
  function dotPattern(col, rf, T) {
    const key = col + '|' + rf + '|' + T;
    let p = PAT.get(key);
    if (p) return p;
    const cv = document.createElement('canvas');
    cv.width = T; cv.height = T;
    const c = cv.getContext('2d');
    c.fillStyle = col;
    const r = rf * T * 0.5;
    c.beginPath();
    for (const q of [[0, 0], [T, 0], [0, T], [T, T], [T / 2, T / 2]]) { c.moveTo(q[0] + r, q[1]); c.arc(q[0], q[1], r, 0, TAU); }
    c.fill();
    p = c.createPattern(cv, 'repeat');
    PAT.set(key, p);
    return p;
  }
  function Painter(c, mode, k, ol, dsp, flashCol) { this.c = c; this.mode = mode; this.k = k; this.ol = ol || OL; this.dsp = dsp || DSP; this.fc = flashCol || FLASH; }
  Painter.prototype.dots = function (col, rf, sp, rot) {
    const k = this.k, T = Math.max(3, Math.round((sp || this.dsp) * k));
    const p = dotPattern(col, rf, T);
    let m = new DOMMatrix();
    if (rot) m = m.rotate(rot);
    p.setTransform(m.scale(1 / k));
    this.c.fillStyle = p;
    this.c.fillRect(-999, -999, 1999, 1999);
  };
  Painter.prototype.crescent = function (shape, sh, fn) {
    const c = this.c;
    c.save();
    c.beginPath(); c.rect(-999, -999, 1999, 1999);
    c.translate(sh[0], sh[1]); shape(c); c.translate(-sh[0], -sh[1]);
    c.clip('evenodd');
    fn();
    c.restore();
  };
  Painter.prototype.part = function (shape, fill, o) {
    o = o || {};
    const c = this.c, flash = this.mode === 'flash';
    c.save();
    c.beginPath(); shape(c); c.clip();
    if (flash) { c.fillStyle = this.fc; c.fillRect(-999, -999, 1999, 1999); }
    else if (typeof fill === 'function') fill(c, this);
    else { c.fillStyle = fill; c.fillRect(-999, -999, 1999, 1999); }
    if (o.dots && !flash) this.dots(o.dots[0], o.dots[1], o.dots[2], o.dots[3]);
    if (o.sh) {
      const s = flash ? [this.fc === FLASH ? FLASH_DOT : '#ffb0b0', 0.55] : o.shade || [INK, 0.45];
      this.crescent(shape, o.sh, () => this.dots(s[0], s[1], s[2], s[3]));
    }
    if (o.spot) this.crescent(shape, o.spot, () => { c.fillStyle = INK; c.fillRect(-999, -999, 1999, 1999); });
    if (o.detail && !flash) { c.save(); o.detail(c, this); c.restore(); }
    if (o.hi && !flash) {
      c.fillStyle = '#ffffff';
      for (const h of o.hi) { c.beginPath(); c.ellipse(h[0], h[1], h[2], h[3], h[4] || 0, 0, TAU); c.fill(); }
    }
    c.restore();
    if (!o.noOl) {
      const w = o.ol != null ? o.ol : this.ol;
      c.lineWidth = w; c.strokeStyle = INK;
      c.beginPath(); shape(c); c.stroke();
      c.save(); c.translate(w * 0.3, w * 0.36); c.lineWidth = w * 0.85; c.beginPath(); shape(c); c.stroke(); c.restore();
    }
    if (o.ink) { c.save(); c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = this.ol * 0.55; o.ink(c, flash); c.restore(); }
  };
  Painter.prototype.detail = function (fn) {
    const c = this.c;
    c.save(); c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = this.ol * 0.55;
    fn(c, this.mode === 'flash', this);
    c.restore();
  };
  const E = (x, y, rx, ry, rot) => (c) => { rot = rot || 0; c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const CAP = (x1, y1, x2, y2, r) => (c) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r);
    c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5);
    c.arc(x2, y2, r, a - PI / 2, a + PI / 2);
    c.closePath();
  };
  const POLY = (pts) => (c) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
  function blobPath(c, pts) {
    const n = pts.length;
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    c.closePath();
  }
  const BLOB = (pts) => (c) => blobPath(c, pts);
  function starPts(n, ro, ri, cx, cy, rot, jit, seed) {
    const pts = [], r = U.mulberry32(seed || 7);
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * TAU + (jit ? (r() - 0.5) * jit * 0.5 / n : 0);
      const rr = (i & 1 ? ri : ro) * (jit ? 1 - r() * jit : 1);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return pts;
  }
  function pumpkinPath(c, cx, cy, rx, ry) {
    const N = 56;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * TAU, co = Math.cos(th), si = Math.sin(th);
      const x = Math.sign(co) * Math.pow(Math.abs(co), 0.85) * rx;
      let y = Math.sign(si) * Math.pow(Math.abs(si), 0.92) * ry;
      y *= 1 - 0.15 * Math.exp(-Math.pow((th - PI * 1.5) / 0.3, 2)) - 0.07 * Math.exp(-Math.pow((th - PI * 0.5) / 0.26, 2));
      if (i) c.lineTo(cx + x, cy + y); else c.moveTo(cx + x, cy + y);
    }
    c.closePath();
  }
  const PUMPKIN = (cx, cy, rx, ry) => (c) => pumpkinPath(c, cx, cy, rx, ry);
  function turnipPath(c, cx, top, bottom, w) {
    const h = bottom - top;
    c.moveTo(cx, top);
    c.bezierCurveTo(cx + w * 0.42, top + h * 0.02, cx + w, top + h * 0.22, cx + w, top + h * 0.56);
    c.bezierCurveTo(cx + w, top + h * 0.86, cx + w * 0.55, bottom, cx, bottom);
    c.bezierCurveTo(cx - w * 0.55, bottom, cx - w, top + h * 0.86, cx - w, top + h * 0.56);
    c.bezierCurveTo(cx - w, top + h * 0.22, cx - w * 0.42, top + h * 0.02, cx, top);
    c.closePath();
  }
  const TURNIP = (cx, top, bottom, w) => (c) => turnipPath(c, cx, top, bottom, w);
  function leafPath(c, bx, by, a, len, wid) {
    const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
    const tx = bx + dx * len, ty = by + dy * len;
    c.moveTo(bx, by);
    c.bezierCurveTo(bx + dx * len * 0.22 + nx * wid, by + dy * len * 0.22 + ny * wid, tx - dx * len * 0.3 + nx * wid * 0.75, ty - dy * len * 0.3 + ny * wid * 0.75, tx, ty);
    c.bezierCurveTo(tx - dx * len * 0.3 - nx * wid * 0.75, ty - dy * len * 0.3 - ny * wid * 0.75, bx + dx * len * 0.22 - nx * wid, by + dy * len * 0.22 - ny * wid, bx, by);
    c.closePath();
  }
  const LEAF = (bx, by, a, len, wid) => (c) => leafPath(c, bx, by, a, len, wid);
  const twoTone = (top, topDot, topRf, bot, botDot, botRf, waveY, amp, freq) => (c, P) => {
    c.fillStyle = bot; c.fillRect(-999, -999, 1999, 1999);
    if (botDot) P.dots(botDot, botRf, null, 30);
    c.save();
    c.beginPath(); c.moveTo(-90, -200); c.lineTo(90, -200); c.lineTo(90, waveY);
    for (let x = 90; x >= -90; x -= 0.5) c.lineTo(x, waveY + amp * Math.sin(x * freq + 0.6));
    c.closePath(); c.clip();
    c.fillStyle = top; c.fillRect(-999, -999, 1999, 1999);
    if (topDot) P.dots(topDot, topRf);
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 0.45;
    c.beginPath();
    for (let x = -90; x <= 90; x += 0.5) { const y = waveY + amp * Math.sin(x * freq + 0.6); if (x === -90) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke();
  };
  function misreg(cv, col, a, off) {
    const tn = U.tint(cv, col);
    const ctx = cv.getContext('2d');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-over'; ctx.globalAlpha = a;
    ctx.drawImage(tn, -off, off * 0.75);
    ctx.restore();
  }
  function build(box, fn, mode, plate, plateA, flashCol) {
    const m = 1.4 + MR;
    const l = box[0] - m, t = box[1] - m, r = box[2] + m, b = box[3] + m;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, mode || 'n', K, OL, DSP, flashCol));
    if (plate) misreg(cv, plate, plateA || 0.65, MR * K);
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy }; }
  /** normal + yellow impact frame, both facings (+ optional extra flash colour) */
  function set4(box, fn, plate, extra) {
    const n = build(box, fn, 'n', plate, 0.65), f = build(box, fn, 'flash', plate, 0.65);
    const o = { n, f, nl: flipS(n), fl: flipS(f) };
    if (extra) { o.x = build(box, fn, 'flash', null, 0, extra); o.xl = flipS(o.x); }
    return o;
  }
  function plain(box, fn) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(ctx, new Painter(ctx, 'n', K, OL, DSP));
    return { c: cv, ox: -l * K, oy: -t * K };
  }

  /* ================= figures (facing right) ================= */
  const CR_FR = [[-2.6, 0, 2.6, 0], [-3.4, -1.5, 2.2, 0], [-2.6, 0, 2.6, 0], [-2.2, 0, 3.4, -1.5]];
  function comicEyes(c, flash, fx, y, col, rx, ry, browK) {
    for (const ex of [fx - 2.4, fx + 2.4]) {
      c.beginPath(); c.ellipse(ex, y, rx, ry, 0, 0, TAU);
      c.fillStyle = flash ? '#fff' : col; c.fill(); c.lineWidth = 0.55; c.stroke();
      c.fillStyle = INK; c.beginPath(); c.ellipse(ex + 0.5, y + 0.3, rx * 0.4, ry * 0.57, 0, 0, TAU); c.fill();
    }
    const b = browK || 1;
    c.beginPath();
    c.moveTo(fx - 4.6, y - 3.6 * b); c.lineTo(fx - 0.7, y - 1.7); c.lineTo(fx - 0.9, y - 0.9); c.lineTo(fx - 4.4, y - 2.4 * b); c.closePath();
    c.moveTo(fx + 4.6, y - 3.6 * b); c.lineTo(fx + 0.7, y - 1.7); c.lineTo(fx + 0.9, y - 0.9); c.lineTo(fx + 4.4, y - 2.4 * b); c.closePath();
    c.fill();
  }

  /* ---- Rüben-Spucker ---- */
  function spitterParts(P, f, k) {
    const F = CR_FR[f];
    const top = -20.6 - k * 1.4, w = 8.6 + k * 1.6;
    for (const q of [[-0.7, 6.6, 2.2], [0.62, 6.2, 2.1], [0.02, 8.0, 2.4]]) P.part(LEAF(0.2, top + 1.2, q[0], q[1], q[2]), '#5bbf3a', { ol: 0.8, spot: [-1.0, 0.25], dots: [C.leafDot, 0.3] });
    P.part(CAP(-1.9, -4.5, F[0], F[1] - 0.6, 1.05), C.cream, { ol: 0.8, sh: [-0.5, 0], shade: ['#f08a3c', 0.5] });
    P.part(CAP(1.9, -4.5, F[2], F[3] - 0.6, 1.05), C.cream, { ol: 0.8, sh: [-0.5, 0], shade: ['#f08a3c', 0.5] });
    P.part(TURNIP(0, top, -2.6, w), twoTone(C.purple, C.mag, 0.42, C.tox, C.toxDot, 0.3, -13.2 - k, 0.9, 0.9), {
      sh: [-2.3, -1.5], shade: [C.toxSh, 0.6], spot: [-0.95, -0.6], ol: 1.1,
      hi: [[-4.4, top + 4.6, 1.6, 0.7, -0.8]],
      detail(c) {
        // mottled skin: purple blotches on the green
        c.fillStyle = C.purple; c.strokeStyle = INK; c.lineWidth = 0.35;
        for (const b of [[-5.4, -9.6, 1.5, 1.1], [-2.0, -5.6, 1.1, 0.8], [3.4, -4.8, 0.9, 0.7], [-6.2, -6.0, 0.7, 0.6]]) { c.beginPath(); c.ellipse(b[0], b[1], b[2], b[3], 0.3, 0, TAU); c.fill(); c.stroke(); }
      },
    });
    if (k > 0) P.part(E(4.6, -8.4, 2.0 + k * 1.6, 1.8 + k * 1.3), '#9ae85a', { ol: 0.7, sh: [-0.8, -0.8], shade: [C.toxSh, 0.5] });
    const mx = 11.6 + k * 0.8, my = -9.6, mr = 2.7 + k * 0.8;
    P.part(CAP(4.4, my, mx, my, 2.5 + k * 0.5), C.tox, { ol: 1.0, dots: [C.toxDot, 0.3], sh: [0, -1.2], shade: [C.toxSh, 0.6], hi: [[7.4, my - 1.4, 1.6, 0.45, 0]] });
    P.part(E(mx + 0.3, my, 1.5 + k * 0.4, mr), k > 0 ? C.toxHot : INK, {
      ol: 0.9,
      detail(c) { if (k > 0) { c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(mx + 0.3, my, 0.6 + k * 0.4, mr * 0.45, 0, 0, TAU); c.fill(); } },
    });
    P.part(E(mx - 0.5, my + mr + 1.8, 0.8, 1.2), '#9cff3a', { ol: 0.6, hi: [[mx - 0.8, my + mr + 1.4, 0.25, 0.4, 0]] });
    P.detail((c, flash) => {
      const ey = -13.4 - k * 0.8;
      comicEyes(c, flash, 0.6, ey, '#d8ff4a', 1.55, 1.75);
      c.lineWidth = 0.6; c.beginPath(); c.moveTo(-1.6, -6.0); c.quadraticCurveTo(0.2, -7.2, 2.4, -6.4); c.stroke();
    });
  }

  /* ---- Zündrübe ---- */
  const BOMB_TIP = [1.9, -23.4];
  function bomberParts(P, f) {
    const s = [-1, 0, 1, 0][f], s2 = [0, 1, 0, -1][f];
    for (const [hx, ph] of [[-4.4, s], [4.4, -s], [-1.5, s2], [1.5, -s2]]) P.part(CAP(hx, -4.4, hx + ph * 1.6 + (hx > 0 ? 0.8 : -0.8), -Math.max(0, ph) * 1.3 - 0.4, 0.8), C.cream, { ol: 0.7 });
    P.part(CAP(-5.2, -6.6, -9.0, -4.6, 0.7), C.red, { ol: 0.7 });
    P.part(LEAF(-0.4, -16.6, -0.6, 5.0, 1.8), C.leaf, { ol: 0.8, spot: [-0.8, 0.2], dots: [C.leafDot, 0.3] });
    P.part(LEAF(0.4, -16.6, 0.7, 4.6, 1.7), '#5bbf3a', { ol: 0.8, spot: [-0.8, 0.2], dots: [C.leafDot, 0.3] });
    P.detail((c, flash) => {
      const fuse = () => { c.beginPath(); c.moveTo(0, -16.8); c.bezierCurveTo(-1.6, -19.4, 2.8, -20.4, 2.2, -22.2); c.quadraticCurveTo(2.0, -23.0, BOMB_TIP[0], BOMB_TIP[1]); };
      fuse(); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke();
      fuse(); c.lineWidth = 0.8; c.strokeStyle = flash ? '#fff' : C.wood; c.stroke();
    });
    P.part(E(0, -10.4, 7.2, 7.0), C.red, {
      ol: 1.1, dots: [C.redDot, 0.3], sh: [-2.0, -1.6], shade: ['#4a0410', 0.62], spot: [-0.8, -0.7], hi: [[-3.4, -13.8, 1.7, 0.8, -0.7], [-5.0, -10.8, 0.5, 0.5, 0]],
      ink(c) { c.lineWidth = 0.4; c.beginPath(); c.moveTo(-6.4, -8.4); c.quadraticCurveTo(-4.4, -6.0, -1.4, -5.0); c.stroke(); },
    });
    P.detail((c, flash) => {
      // mean slit eyes + heavy brows
      c.fillStyle = flash ? '#fff' : C.yellow;
      c.beginPath(); c.moveTo(-3.8, -12.2); c.lineTo(-0.4, -11.0); c.lineTo(-0.9, -9.8); c.lineTo(-3.4, -10.4); c.closePath();
      c.moveTo(4.4, -12.2); c.lineTo(1.0, -11.0); c.lineTo(1.5, -9.8); c.lineTo(4.0, -10.4); c.closePath();
      c.fill(); c.lineWidth = 0.45; c.stroke();
      c.fillStyle = INK;
      c.beginPath(); c.moveTo(-4.6, -14.4); c.lineTo(-0.2, -12.0); c.lineTo(-0.5, -11.3); c.lineTo(-4.4, -13.2); c.closePath();
      c.moveTo(5.2, -14.4); c.lineTo(0.8, -12.0); c.lineTo(1.1, -11.3); c.lineTo(5.0, -13.2); c.closePath(); c.fill();
      // gritted teeth
      c.beginPath(); c.moveTo(-2.6, -7.8); c.lineTo(3.4, -7.8); c.lineTo(3.0, -5.8); c.lineTo(-2.2, -5.8); c.closePath();
      c.fillStyle = '#fff'; c.fill(); c.lineWidth = 0.55; c.stroke();
      c.lineWidth = 0.35; c.beginPath(); c.moveTo(-2.4, -6.8); c.lineTo(3.2, -6.8);
      for (const x of [-1.0, 0.4, 1.8]) { c.moveTo(x, -7.8); c.lineTo(x, -5.8); }
      c.stroke();
    });
  }

  /* ---- Wurzel-Bock (side view) ---- */
  const CH_PIV = [-8, -6];
  const chAng = (m) => (m === 1 || m === 2 ? -0.24 : m === 3 ? 0.14 : 0);
  const rotP = (x, y, a) => { const cs = Math.cos(a), sn = Math.sin(a); return [CH_PIV[0] + (x - CH_PIV[0]) * cs - (y - CH_PIV[1]) * sn, CH_PIV[1] + (x - CH_PIV[0]) * sn + (y - CH_PIV[1]) * cs]; };
  function hornStroke(c, flash, cx, cy, a0, r0, turns, w0, w1, col, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, a = a0 - t * turns * TAU, r = r0 * (1 - 0.62 * t); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, w0 + (w1 - w0) * t]); }
    c.lineCap = 'round';
    for (const pass of [0, 1]) {
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[i + 1];
        c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
        c.strokeStyle = pass ? (flash ? FLASH : col) : INK; c.lineWidth = pass ? p[2] : p[2] + 1.6; c.stroke();
      }
    }
    // ridges + shine
    c.strokeStyle = INK; c.lineWidth = 0.4; c.beginPath();
    for (let i = 1; i < n; i += 1) { const p = pts[i], q = pts[i + 1], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = p[2] * 0.45; c.moveTo(p[0] + nx * w, p[1] + ny * w); c.lineTo(p[0] - nx * w, p[1] - ny * w); }
    c.stroke();
  }
  function chargerParts(P, f, mode) {
    const s = [-1, 0, 1, 0][f];
    const ang = chAng(mode), red = mode === 1 || mode === 2;
    const bob = mode === 0 ? -Math.abs(s) * 0.9 : 0;
    const R = (x, y) => { const p = rotP(x, y, ang); return [p[0], p[1] + bob]; };
    const hips = [[-9.4, -8.4, 1, 0], [3.4, -8.0, -1, 0], [-6.8, -7.8, -1, 1], [6.4, -7.6, 1, 1]];
    for (const [hx, hy, sg, near] of hips) {
      const h = R(hx, hy), front = hx > 0;
      let fx, fy;
      if (mode === 0) { fx = hx + s * sg * 2.0; fy = -Math.max(0, s * sg) * 1.8; }
      else if (mode === 3) { fx = hx + (front ? 5.5 : -5.5) + (near ? 1 : 0); fy = front ? -2.4 : -0.6; }
      else if (red) {
        if (front) { const scr = mode === 1 ? 1 : -1; fx = h[0] + (near ? 2 + scr * 2.2 : 3.2); fy = near ? -1.0 - (scr > 0 ? 1.6 : 0) : -3.8; }
        else { fx = hx - 1; fy = 0; }
      } else { fx = hx + (near ? 0.8 : -0.6); fy = 0; }
      P.part(CAP(h[0], h[1], fx, fy - 1.2, 1.25), near ? C.coLeg : '#6a3a1e', { ol: 0.85, sh: [-0.6, 0], shade: [C.coSh, 0.6] });
      P.part(E(fx + 0.5, fy - 0.7, 1.7, 0.9), INK, { ol: 0.5 });
    }
    const c = P.c;
    c.save(); c.translate(0, bob); c.translate(CH_PIV[0], CH_PIV[1]); c.rotate(ang); c.translate(-CH_PIV[0], -CH_PIV[1]);
    P.detail((d, flash) => hornStroke(d, flash, 4.2, -16.4, -0.35, 4.6, 0.82, 1.9, 0.9, '#c8b48a', 7));
    P.part(CAP(-14, -12.4, -17.8, -15.4, 0.6), C.wood, { ol: 0.7 });
    const body = (k) => {
      k.moveTo(6.0, -18.8);
      k.bezierCurveTo(-1.0, -19.6, -8.0, -17.4, -15.4, -12.4);
      k.bezierCurveTo(-8.0, -7.8, -1.0, -6.0, 6.0, -6.4);
      k.bezierCurveTo(9.6, -6.8, 10.4, -18.2, 6.0, -18.8); k.closePath();
    };
    P.part(body, twoTone(C.coBot, C.coBotDot, 0.3, C.cream, C.orange, 0.18, -13.6, 0.8, 0.8), {
      sh: [-1.2, -1.8], shade: [C.coSh, 0.6], spot: [-0.5, -0.7], ol: 1.1, hi: [[-6, -16.2, 2.2, 0.6, -0.2]],
      ink(k) { k.lineWidth = 0.45; k.beginPath(); k.moveTo(-9.2, -15.6); k.quadraticCurveTo(-8.0, -12.6, -9.0, -9.6); k.moveTo(-4.4, -17.6); k.quadraticCurveTo(-3.0, -13.2, -4.2, -7.8); k.stroke(); },
    });
    P.part(LEAF(7.6, -17.4, -0.5, 5.2, 1.7), C.leaf, { ol: 0.75, spot: [-0.8, 0.2], dots: [C.leafDot, 0.3] });
    P.part(LEAF(8.4, -17.2, 0.3, 4.4, 1.5), '#5bbf3a', { ol: 0.75, spot: [-0.8, 0.2], dots: [C.leafDot, 0.3] });
    const head = (k) => {
      k.moveTo(8.0, -17.4);
      k.bezierCurveTo(12.2, -17.6, 14.6, -13.6, 15.0, -10.0);
      k.bezierCurveTo(15.2, -7.4, 13.2, -5.8, 11.0, -6.4);
      k.bezierCurveTo(8.0, -7.0, 5.2, -9.6, 5.2, -12.8);
      k.bezierCurveTo(5.2, -15.4, 6.4, -17.3, 8.0, -17.4); k.closePath();
    };
    P.part(head, '#f2d29a', { ol: 1.0, dots: [C.orange, 0.16], sh: [-1.2, -1.2], shade: [C.coBotDot, 0.55], spot: [-0.5, -0.5] });
    P.detail((d, flash) => {
      if (mode === 4) {
        d.lineWidth = 0.5; d.beginPath(); d.arc(11.6, -12.4, 1.5, 0, 4.4); d.arc(11.6, -12.4, 0.6, 4.4, 9.6); d.stroke();
      } else {
        d.beginPath(); d.ellipse(11.6, -12.4, 1.4, 1.6, 0, 0, TAU);
        d.fillStyle = flash ? '#fff' : red ? '#ff3a2a' : C.yellow; d.fill(); d.lineWidth = 0.5; d.stroke();
        d.fillStyle = INK; d.beginPath(); d.ellipse(12.1, -12.1, 0.55, 0.9, 0, 0, TAU); d.fill();
        d.beginPath(); d.moveTo(9.2, -15.6); d.lineTo(14.0, -13.6); d.lineTo(13.8, -12.8); d.lineTo(9.4, -14.4); d.closePath(); d.fill();
      }
      d.lineWidth = 0.6; d.beginPath(); d.moveTo(13.6, -8.4); d.lineTo(14.2, -7.6); d.stroke();
    });
    P.detail((d, flash) => hornStroke(d, flash, 5.6, -15.4, -0.45, 5.0, 0.86, 2.4, 1.0, '#fcfbf4', 8));
    c.restore();
  }
  const CH_EYE = (m) => rotP(11.6, -12.4, chAng(m));

  /* ---- Rüben-Ahnin ---- */
  function babyParts(P, x, y, s, lean) {
    P.part(LEAF(x, y - 5.6 * s, lean, 4.4 * s, 1.6 * s), '#5bbf3a', { ol: 0.7, spot: [-0.6, 0.2] });
    P.part(TURNIP(x, y - 6 * s, y, 3.1 * s), twoTone(C.yellow, C.orange, 0.3, C.cream, null, 0, y - 3.2 * s, 0.4, 1.4), { ol: 0.8, sh: [-0.9, -0.6], shade: ['#a33a1c', 0.55] });
    P.detail((c) => { c.beginPath(); c.arc(x - 0.4 * s, y - 2.6 * s, 0.45, 0, TAU); c.arc(x + 1.2 * s, y - 2.6 * s, 0.45, 0, TAU); c.fill(); });
  }
  function motherParts(P, f) {
    const lo = [-1.4, 0, 1.4, 0][f], fl = [0, 0.6, 0, -0.6][f];
    P.part(CAP(-5, -6, -5.6 + lo, -1.4, 1.9), C.coBot, { ol: 0.9, sh: [-0.8, 0], shade: [C.coSh, 0.55] });
    P.part(CAP(5, -6, 5.6 - lo, -1.4, 1.9), C.coBot, { ol: 0.9, sh: [-0.8, 0], shade: [C.coSh, 0.55] });
    P.part(CAP(-11.4, -15, -14.4, -9.4 + fl, 1.3), C.coBot, { ol: 0.85 });
    P.part(POLY([[-11.2, -25.4], [-17.6, -19.6 + fl], [-15.0, -18.4 + fl], [-10.4, -23.6]]), C.red, { ol: 0.85, dots: [C.redDot, 0.3] });
    P.part(POLY([[-11.0, -24.2], [-14.6, -16.0 - fl], [-12.2, -16.2 - fl], [-9.8, -23.0]]), C.red, { ol: 0.85, sh: [0.6, -0.6], shade: [C.redDot, 0.6] });
    P.part(TURNIP(0, -32.5, -4.4, 13.8), twoTone(C.purple, C.mag, 0.42, C.cream, C.orange, 0.18, -14.4, 1.3, 0.6), {
      sh: [-3.4, -2.4], shade: [C.purpleSh, 0.6], spot: [-1.3, -0.9], ol: 1.3, hi: [[-9.0, -18.4, 1.0, 2.4, 0.3]],
      ink(c) { c.lineWidth = 0.4; c.beginPath(); c.moveTo(-9.0, -10.6); c.quadraticCurveTo(-7.0, -9.6, -5.0, -10.2); c.moveTo(-10.2, -16.6); c.quadraticCurveTo(-8.6, -15.6, -7.0, -16.2); c.stroke(); },
    });
    const scarf = (c) => {
      c.moveTo(-12.6, -22.4);
      c.bezierCurveTo(-12.2, -30.0, -6.6, -34.4, 0, -34.4);
      c.bezierCurveTo(6.6, -34.4, 12.2, -30.0, 12.8, -22.4);
      c.quadraticCurveTo(6.0, -25.4, 0, -24.8); c.quadraticCurveTo(-6.4, -24.4, -12.6, -22.4); c.closePath();
    };
    P.part(scarf, C.red, {
      ol: 1.1, sh: [-2.0, -1.6], shade: ['#4a0410', 0.6],
      detail(c) { c.fillStyle = C.white; for (const [dx, dy] of [[-8.6, -26.4], [-4.2, -30.6], [1.0, -32.0], [6.2, -30.6], [9.6, -26.4], [-1.6, -27.4], [4.4, -27.2]]) { c.beginPath(); c.arc(dx, dy, 0.95, 0, TAU); c.fill(); } },
    });
    P.part(E(-11.6, -23.8, 1.9, 1.5, 0.4), C.red, { ol: 0.85 });
    babyParts(P, -6.4, -31.0, 0.95, -0.4);
    babyParts(P, 6.6, -31.0, 0.95, 0.4);
    babyParts(P, 0.2, -33.2, 1.15, 0);
    P.part(E(7.6, -15.8, 1.6, 2.0), '#f2c08a', { ol: 0.7, sh: [-0.5, -0.5], shade: [C.coBotDot, 0.5] });
    P.detail((c, flash) => {
      // grandma spectacles over sleepy glowing eyes
      for (const ex of [4.0, 10.2]) {
        c.beginPath(); c.arc(ex, -19.4, 2.5, 0, TAU); c.fillStyle = flash ? '#fff' : '#dff6ff'; c.fill();
        c.fillStyle = flash ? '#fff' : C.yellow; c.beginPath(); c.ellipse(ex, -18.9, 1.5, 0.9, 0, 0, PI); c.fill();
        c.fillStyle = INK; c.beginPath(); c.ellipse(ex, -18.9, 1.6, 0.35, 0, 0, TAU); c.fill();
        c.lineWidth = 0.7; c.beginPath(); c.arc(ex, -19.4, 2.5, 0, TAU); c.stroke();
        c.strokeStyle = '#fff'; c.lineWidth = 0.45; c.beginPath(); c.arc(ex, -19.4, 1.8, 3.6, 4.3); c.stroke(); c.strokeStyle = INK;
      }
      c.lineWidth = 0.6; c.beginPath(); c.moveTo(6.5, -19.6); c.quadraticCurveTo(7.1, -20.4, 7.7, -19.6); c.moveTo(1.5, -19.6); c.lineTo(-1.0, -20.4); c.stroke();
      // bushy brows
      c.beginPath(); c.moveTo(1.6, -22.6); c.lineTo(6.0, -22.2); c.lineTo(5.8, -21.4); c.lineTo(1.8, -21.8); c.closePath();
      c.moveTo(8.2, -22.2); c.lineTo(12.6, -22.6); c.lineTo(12.4, -21.8); c.lineTo(8.4, -21.4); c.closePath(); c.fill();
      // stern mouth
      c.lineWidth = 0.75; c.beginPath(); c.moveTo(3.4, -11.6); c.quadraticCurveTo(6.8, -13.4, 10.2, -11.6); c.stroke();
      c.lineWidth = 0.4; c.beginPath(); c.moveTo(1.6, -8.6); c.quadraticCurveTo(4.4, -7.6, 7.2, -8.6); c.stroke();
      // cane
      const cane = () => { c.beginPath(); c.moveTo(14.6, -0.6); c.lineTo(13.6, -17.4); c.quadraticCurveTo(13.4, -21.0, 16.2, -20.8); c.quadraticCurveTo(18.8, -20.4, 18.2, -17.8); };
      cane(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
      cane(); c.lineWidth = 1.0; c.strokeStyle = flash ? '#fff' : C.wood; c.stroke();
    });
    P.part(CAP(10.6, -13.4, 13.4, -15.2, 1.2), C.coBot, { ol: 0.8 });
  }

  /* ---- Rübchen ---- */
  function sproutParts(P, f) {
    const F = [[-2.0, 0, 2.0, 0], [-2.6, -1.4, 1.6, 0], [-2.0, 0, 2.0, 0], [-1.6, 0, 2.6, -1.4]][f];
    P.part(LEAF(0.2, -12.4, 0.35 + [0, 0.1, 0, -0.1][f], 6.0, 2.2), '#5bbf3a', { ol: 0.75, spot: [-0.8, 0.25], dots: [C.leafDot, 0.3] });
    P.part(CAP(-1.5, -3.4, F[0], F[1] - 0.5, 0.8), C.cream, { ol: 0.7 });
    P.part(CAP(1.5, -3.4, F[2], F[3] - 0.5, 0.8), C.cream, { ol: 0.7 });
    P.part(TURNIP(0, -13.2, -2.4, 5.4), twoTone(C.yellow, C.orangeDot, 0.32, C.cream, C.orange, 0.18, -8.6, 0.6, 1.2), {
      sh: [-1.4, -1.0], shade: ['#a33a1c', 0.6], spot: [-0.6, -0.4], ol: 0.95, hi: [[-2.8, -10.6, 1.0, 0.45, -0.8]],
    });
    P.detail((c, flash) => {
      for (const ex of [-0.6, 2.6]) {
        c.beginPath(); c.ellipse(ex, -7.0, 1.25, 1.45, 0, 0, TAU); c.fillStyle = flash ? '#fff' : C.yellow; c.fill(); c.lineWidth = 0.45; c.stroke();
        c.fillStyle = INK; c.beginPath(); c.ellipse(ex + 0.4, -6.8, 0.5, 0.8, 0, 0, TAU); c.fill();
      }
      c.beginPath(); c.moveTo(-2.4, -9.6); c.lineTo(0.6, -8.4); c.lineTo(0.4, -7.8); c.lineTo(-2.2, -8.8); c.closePath();
      c.moveTo(4.4, -9.6); c.lineTo(1.6, -8.4); c.lineTo(1.8, -7.8); c.lineTo(4.2, -8.8); c.closePath(); c.fill();
      c.lineWidth = 0.55; c.beginPath(); c.moveTo(0.0, -4.0); c.quadraticCurveTo(1.0, -5.0, 2.0, -4.0); c.stroke();
    });
  }

  /* ---- objects ---- */
  const shotShape = (c) => { c.moveTo(3.4, 0); c.bezierCurveTo(3.4, -2.8, 0.6, -3.2, -1.2, -2.5); c.quadraticCurveTo(-4.4, -1.2, -6.2, 0); c.quadraticCurveTo(-4.4, 1.2, -1.2, 2.5); c.bezierCurveTo(0.6, 3.2, 3.4, 2.8, 3.4, 0); c.closePath(); };
  function shotParts(P) {
    P.part(shotShape, '#8aff3a', { ol: 0.95, dots: ['#2aa01a', 0.28], sh: [-0.9, -1.0], shade: [C.toxSh, 0.6], hi: [[1.0, -1.2, 1.1, 0.55, -0.3]] });
  }

  /* ================= caches ================= */
  const SPR = {};
  let G = null;
  const BUILD = {
    spitter: () => ({ walk: [0, 1, 2, 3].map((f) => set4([-10, -31, 15, 1.5], (P) => spitterParts(P, f, 0), C.cyan)), aim: [0.4, 0.75, 1].map((k) => set4([-12, -33, 17, 1.5], (P) => spitterParts(P, 1, k), C.cyan)) }),
    bomber: () => ({ walk: [0, 1, 2, 3].map((f) => set4([-11, -26, 9, 1.5], (P) => bomberParts(P, f), C.cyan, '#ffffff')) }),
    charger: () => {
      const o = {
        walk: [0, 1, 2, 3].map((f) => set4([-20, -28, 17, 1.5], (P) => chargerParts(P, f, 0), C.cyan)),
        tele: [1, 2].map((m) => set4([-20, -31, 18, 1.5], (P) => chargerParts(P, 0, m), C.cyan, '#ff4a3a')),
        dash: set4([-22, -28, 20, 1.5], (P) => chargerParts(P, 0, 3), C.cyan),
        rest: set4([-20, -28, 17, 1.5], (P) => chargerParts(P, 0, 4), C.cyan),
      };
      const d = o.dash;
      o.plate = { r: [U.tint(d.n.c, C.cyan), U.tint(d.n.c, C.mag)], l: [U.tint(d.nl.c, C.cyan), U.tint(d.nl.c, C.mag)] };
      return o;
    },
    mother: () => ({ walk: [0, 1, 2, 3].map((f) => set4([-19, -42, 20, 1.5], (P) => motherParts(P, f), C.cyan)) }),
    sprout: () => ({ walk: [0, 1, 2, 3].map((f) => set4([-7, -20, 7, 1.5], (P) => sproutParts(P, f), C.cyan)) }),
  };
  const get = (t) => SPR[t] || (SPR[t] = BUILD[t]());

  /* ================= drawing ================= */
  function blit(ctx, s, x, y, sx, sy, rot) {
    const k = 1 / K;
    if (!rot) { ctx.drawImage(s.c, x - s.ox * k * sx, y - s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy); return; }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.drawImage(s.c, -s.ox * k * sx, -s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
    ctx.restore();
  }
  /** the style's lifecycle: elastic pop-out spawn, yellow impact-frame death, squash + capped impact flash */
  function draw(ctx, e, set, x, y, sx, sy, rot, left, cap, after) {
    if (e.spawnT < 1) {
      const q = U.clamp((e.spawnT - 0.12) / 0.88, 0, 1);
      if (q <= 0) return;
      const p = U.ease.outElastic(q);
      sy *= p; sx *= p > 0.05 ? U.clamp(1 / Math.sqrt(p), 0.75, 1.5) : 1.5;
      rot *= q;
    }
    if (e.dying) {
      const q = e.deathT;
      if (q >= 0.42) return;
      const k = q < 0.2 ? 1 + U.ease.outQuad(q / 0.2) * 0.25 : 1.25 * (1 - U.ease.inQuad((q - 0.2) / 0.22));
      blit(ctx, left ? set.fl : set.f, x, y, sx * k, sy * k, rot + (q - 0.2) * 0.6);
      return;
    }
    const fl = e.flash;
    if (fl > 0) { sx *= 1 + 0.18 * fl; sy *= 1 - 0.14 * fl; }
    blit(ctx, left ? set.nl : set.n, x, y, sx, sy, rot);
    if (after) after(sx, sy);
    if (fl > 0.02) {
      ctx.globalAlpha = Math.min(cap, fl * 1.4);
      blit(ctx, left ? set.fl : set.f, x, y, sx, sy, rot);
      ctx.globalAlpha = 1;
    }
  }
  const walk = (e, rate) => { const ph = e.anim * rate + e.seed, sn = Math.sin(ph * TAU); return { f: Math.floor(ph * 4) & 3, sn, up: Math.abs(sn) }; };

  CT.art('popart', {
    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      K = Math.max(3, Math.min(5, Math.round(((cssH * dpr) / 360) * 1.4)));
      G = {};
      G.shadow = plain([-10, -4, 10, 4], (c, P) => {
        c.save(); c.beginPath(); c.ellipse(0, 0, 9.6, 3.5, 0, 0, TAU); c.clip(); P.dots(INK, 0.5, 1.15); c.restore();
        c.save(); c.beginPath(); c.ellipse(0, 0, 6.4, 2.3, 0, 0, TAU); c.clip(); P.dots(INK, 0.95, 1.15); c.restore();
      });
      G.shot = build([-6.5, -3.5, 4, 3.5], shotParts, 'n', C.mag, 0.6);
      G.spark = build([-4.5, -4.5, 4.5, 4.5], (P) => {
        P.part(POLY(starPts(8, 4.2, 1.7, 0, 0, 0, 0.3, 5)), C.yellow, { ol: 0.7, dots: [C.red, 0.35, 1.0] });
        P.part(POLY(starPts(8, 1.9, 0.8, 0, 0, 0.3, 0.2, 9)), '#ffffff', { noOl: true });
      });
      G.star = build([-3, -3, 3, 3], (P) => P.part(POLY(starPts(5, 2.6, 1.1, 0, 0, -PI / 2)), C.yellow, { ol: 0.6, sh: [-0.5, -0.5], shade: [C.orangeDot, 0.5] }), 'n', C.mag, 0.6);
      G.alarm = build([-6.5, -6.5, 6.5, 6.5], (P) => {
        P.part(POLY(starPts(10, 6, 3.6, 0, 0, 0.1, 0.35, 13)), C.yellow, { ol: 0.8, dots: [C.red, 0.3, 1.1] });
        P.part((c) => { c.moveTo(-0.9, -3.6); c.lineTo(1.1, -3.6); c.lineTo(0.6, 0.9); c.lineTo(-0.5, 0.9); c.closePath(); c.moveTo(1.0, 2.4); c.arc(0.05, 2.4, 0.95, 0, TAU); }, C.red, { ol: 0.6 });
      }, 'n', C.cyan, 0.6);
      G.halo = plain([-16, -16, 16, 16], (c) => {
        c.fillStyle = C.mag; c.beginPath();
        const sp = 1.6;
        for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) {
          const x = i * sp + (j & 1 ? sp / 2 : 0), y = j * sp * 0.866, d = Math.hypot(x, y) / 15;
          if (d >= 1) continue;
          const r = Math.pow(1 - d, 0.7) * sp * 0.55;
          c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
        }
        c.fill();
      });
      G.glowG = plain([-8, -8, 8, 8], (c) => {
        c.fillStyle = '#b6ff3a'; c.beginPath();
        const sp = 1.2;
        for (let j = -7; j <= 7; j++) for (let i = -7; i <= 7; i++) {
          const x = i * sp + (j & 1 ? sp / 2 : 0), y = j * sp * 0.866, d = Math.hypot(x, y) / 7.6;
          if (d >= 1) continue;
          const r = Math.pow(1 - d, 0.6) * sp * 0.55;
          c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
        }
        c.fill();
      });
    },

    enemies: {
      spitter(ctx, e, view) {
        const S = get('spitter'), left = e.facing < 0, fx = left ? -1 : 1;
        const aiming = e.mode === 'aim' && e.spawnT >= 1 && !e.dying;
        const k = aiming ? e.charge || 0 : 0;
        const w = walk(e, 0.8), scl = (0.94 + e.seed * 0.12) * 0.92;
        let set = S.walk[w.f], x = e.x, y = e.y - w.up * 1.2, rot = w.sn * 0.08;
        let sx = scl * (1 + (1 - w.up) * 0.05), sy = scl * (1 - (1 - w.up) * 0.05 + w.up * 0.03);
        if (aiming) { set = S.aim[k < 0.45 ? 0 : k < 0.8 ? 1 : 2]; y = e.y; rot = 0; sx = sy = scl; x += Math.sin(view.rt * 55 + e.seed * 9) * 0.5 * k; }
        const sp = e.spit || 0;
        if (sp > 0 && !e.dying) { const q = sp * sp; sx *= 1 + 0.16 * q; sy *= 1 - 0.16 * q; x -= fx * 2.2 * q; }
        const mx = x + fx * (12 + 0.8 * k) * sx, my = y - 9.6 * sy;
        if (aiming && k > 0.2) { ctx.globalAlpha = 0.55 * k; blit(ctx, G.glowG, mx, my, 0.7 + 0.6 * k, 0.7 + 0.6 * k, 0); ctx.globalAlpha = 1; }
        draw(ctx, e, set, x, y, sx, sy, rot, left, 0.75, sp > 0 ? () => {
          // green spray: inked droplets flying out of the snout
          for (let i = 0; i < 4; i++) {
            const a = (i - 1.5) * 0.42 + e.seed, d = 2.5 + (1 - sp) * (6 + i * 1.6), r = 0.95 * sp + 0.35;
            const px = mx + fx * Math.cos(a) * d, py = my + Math.sin(a) * d;
            ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(px, py, r + 0.45, 0, TAU); ctx.fill();
            ctx.fillStyle = '#8aff3a'; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
          }
        } : null);
      },

      bomber(ctx, e, view) {
        const S = get('bomber'), left = e.facing < 0, fx = left ? -1 : 1;
        const w = walk(e, e.armed ? 1.5 : 1.15), scl = (0.94 + e.seed * 0.12) * 0.92;
        const set = S.walk[w.f];
        let x = e.x, y = e.y - w.up * 1.0, rot = w.sn * 0.1, sx = scl, sy = scl;
        const fu = e.armed ? e.fuse || 0 : 0;
        let blink = false;
        if (e.armed && !e.dying) {
          const sw = 1 + 0.12 * fu + 0.04 * Math.sin(view.rt * 40) * fu;
          sx *= sw; sy *= sw; x += Math.sin(view.rt * 70 + e.seed * 7) * 0.5 * fu;
          blink = Math.sin(fu * (5 + 18 * fu) * TAU) > 0;
          ctx.globalAlpha = blink ? 0.9 : 0.5;
          const hs = 0.75 + 0.35 * fu;
          blit(ctx, G.halo, x, y - 9, hs, hs, 0);
          ctx.globalAlpha = 1;
        }
        draw(ctx, e, set, x, y, sx, sy, rot, left, 0.75, (sx2, sy2) => {
          if (blink) { ctx.globalAlpha = 0.85; blit(ctx, left ? set.xl : set.x, x, y, sx2, sy2, rot); ctx.globalAlpha = 1; }
          const cs = Math.cos(rot), sn = Math.sin(rot), lx = BOMB_TIP[0] * sx2 * fx, ly = BOMB_TIP[1] * sy2;
          const tx = x + lx * cs - ly * sn, ty = y + lx * sn + ly * cs;
          const fl = 0.8 + 0.2 * Math.sin(view.rt * 31 + e.seed * 20), ss = (0.45 + 0.6 * fu) * fl;
          blit(ctx, G.spark, tx, ty, ss, ss, view.rt * 6 + e.seed * 5);
        });
      },

      charger(ctx, e, view) {
        const S = get('charger');
        const m = e.spawnT < 1 || e.dying ? 'chase' : e.mode;
        const left = (m === 'tele' || m === 'dash') && e.dashX ? e.dashX < 0 : e.facing < 0;
        const fx = left ? -1 : 1, scl = (0.94 + e.seed * 0.12) * 0.92, rt = view.rt;
        let set, mode = 0, x = e.x, y = e.y, rot = 0, sx = scl, sy = scl;
        if (m === 'tele') { mode = Math.floor(rt * 9) % 2 ? 2 : 1; set = S.tele[mode - 1]; x += Math.sin(rt * 80 + e.seed * 9) * (0.3 + 0.6 * Math.min(1, (e.modeT || 0) / 0.72)); }
        else if (m === 'dash') { mode = 3; set = S.dash; }
        else if (m === 'rest') { mode = 4; set = S.rest; rot = Math.sin(rt * 9 + e.seed * 5) * 0.08; }
        else { const w = walk(e, 0.9); set = S.walk[w.f]; y -= w.up * 0.8; rot = w.sn * 0.03; }
        if (mode === 3) {
          // misregistered colour-plate copies + ink speed lines (like Jack's dash)
          const dx = e.dashX || fx, dy = e.dashY || 0, pl = left ? S.plate.l : S.plate.r, s0 = left ? set.nl : set.n, kk = 1 / K;
          for (let i = 2; i >= 1; i--) {
            const img = pl[i - 1], px = x - dx * i * 6, py = y - dy * i * 6;
            ctx.globalAlpha = 0.6;
            ctx.drawImage(img, px - s0.ox * kk * sx, py - s0.oy * kk * sy, img.width * kk * sx, img.height * kk * sy);
          }
          ctx.globalAlpha = 1;
          ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.lineCap = 'round';
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const off = (i - 1.5) * 4.2, nx = -dy, ny = dx;
            const x0 = x + nx * off - dx * 16, y0 = y - 12 + ny * off - dy * 16, len = 12 + (i % 2) * 8;
            ctx.moveTo(x0, y0); ctx.lineTo(x0 - dx * len, y0 - dy * len);
          }
          ctx.stroke();
        }
        draw(ctx, e, set, x, y, sx, sy, rot, left, 0.75, (sx2, sy2) => {
          if (mode === 1 || mode === 2) {
            const k = Math.min(1, (e.modeT || 0) / 0.72);
            ctx.globalAlpha = 0.18 + 0.3 * k * (0.6 + 0.4 * Math.sin(rt * 30));
            blit(ctx, left ? set.xl : set.x, x, y, sx2, sy2, rot);
            ctx.globalAlpha = 1;
            const sc = 0.7 + 0.25 * k + 0.08 * Math.sin(rt * 25);
            blit(ctx, G.alarm, x + fx * 6, y - 30, sc, sc, Math.sin(rt * 12) * 0.15);
          } else if (mode === 4) {
            const hx = x + fx * 4, hy = y - 25;
            ctx.strokeStyle = INK; ctx.lineWidth = 0.45;
            ctx.beginPath(); ctx.ellipse(hx, hy, 7, 2.4, 0, PI, TAU); ctx.stroke();
            for (let i = 0; i < 3; i++) {
              const a = rt * 5 + (i / 3) * TAU, s = 0.75 + 0.25 * Math.sin(a);
              blit(ctx, G.star, hx + Math.cos(a) * 7, hy + Math.sin(a) * 2.4, s, s, a);
            }
          }
        });
      },

      mother(ctx, e, view) {
        const S = get('mother'), left = e.facing < 0;
        const ph = e.anim * 0.42 + e.seed, f = Math.floor(ph * 4) & 3, sn = Math.sin(ph * TAU), up = Math.abs(sn), contact = Math.pow(1 - up, 3);
        const scl = 0.94 + e.seed * 0.12;
        let sx = scl * (1 + contact * 0.06), sy = scl * (1 - contact * 0.06);
        const y = e.y - up * 1.4, rot = sn * 0.035;
        const b = e.dying ? 0 : e.birth || 0;
        if (b > 0) {
          const q = Math.sin((1 - b) * PI * 3) * b * 0.14;
          sx *= 1 + q; sy *= 1 - q;
          ctx.globalAlpha = b * 0.9;
          blit(ctx, G.halo, e.x, e.y - 18, 1.3 + 0.5 * (1 - b), 1.3 + 0.5 * (1 - b), 0);
          ctx.globalAlpha = 1;
        }
        draw(ctx, e, S.walk[f], e.x, y, sx, sy, rot, left, 0.6, b > 0 ? (sx2, sy2) => {
          ctx.globalAlpha = b * 0.45; blit(ctx, left ? S.walk[f].fl : S.walk[f].f, e.x, y, sx2, sy2, rot); ctx.globalAlpha = 1;
        } : null);
      },

      sprout(ctx, e, view) {
        const S = get('sprout'), left = e.facing < 0;
        const w = walk(e, 1.4), scl = (0.94 + e.seed * 0.12) * 0.95;
        draw(ctx, e, S.walk[w.f], e.x, e.y - w.up * 1.0, scl * (1 + (1 - w.up) * 0.06), scl * (1 - (1 - w.up) * 0.06 + w.up * 0.04), w.sn * 0.12, left, 0.75, null);
      },
    },

    shadow(ctx, o) {
      let k = 1;
      if (o.dying) { if (o.deathT > 0.4) return true; k = 1 - o.deathT / 0.4; }
      if (o.spawnT < 1) k *= U.clamp(o.spawnT * 2.5 - 0.3, 0, 1);
      if (k <= 0.02) return true;
      const rx = ({ spitter: 8.4, bomber: 7.4, charger: 13, mother: 13.5, sprout: 5.2 }[o.type] || 8) * k;
      const sc = rx / 9.6;
      ctx.globalAlpha = 0.55;
      blit(ctx, G.shadow, o.x, o.y + 0.4, sc, sc * (o.type === 'charger' ? 0.85 : 1), 0);
      ctx.globalAlpha = 1;
      return true;
    },

    onKill(game, e) {
      const T = e.type;
      const cfg = { spitter: [0, [2, 8, 2, 1]], bomber: [2, [6, 7, 6, 2]], charger: [0, [4, 1, 4, 3]], mother: [3, [5, 1, 0, 2, 8, 7]], sprout: [0, [0, 1]] }[T];
      if (!cfg) return false;
      const x = e.x, y = e.y + 0.6, big = T === 'mother', small = T === 'sprout';
      const h = big ? 18 : small ? 7 : 11;
      game.addParticle({ kind: 'boom', tint: cfg[0], x, y, z: h, life: big ? 0.45 : 0.34, size: big ? 1.4 : small ? 0.65 : 0.95, rot: Math.random() * TAU, drag: 0 });
      const n = big ? 7 : small ? 2 : 4;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, sp = 35 + Math.random() * 45;
        game.addParticle({ kind: 'chunk', spr: cfg[1][i % cfg[1].length], x, y, z: h * 0.7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 60, grav: 280, drag: 1.2, life: 0.75 + Math.random() * 0.3, size: (big ? 1.2 : small ? 0.7 : 0.95) * (0.8 + Math.random() * 0.5), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14 });
      }
      for (let i = 0; i < (big ? 4 : 2); i++) {
        const a = Math.random() * TAU, sp = 40 + Math.random() * 50;
        game.addParticle({ kind: 'ink', color: T === 'spitter' ? '#5bd02a' : undefined, x, y, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 40 + Math.random() * 40, grav: 240, drag: 1.5, life: 0.5, size: 0.5 + Math.random() * 0.4 });
      }
      if (big) game.addParticle({ kind: 'ring', x, y, z: 0, life: 0.4, size: 0.8, rot: Math.random(), drag: 0 });
      return true;
    },

    shot(ctx, s, view) {
      const y = s.y - s.z, a = s.angle, ca = Math.cos(a), sa = Math.sin(a);
      const pulse = 1 + 0.1 * Math.sin(view.rt * 18 + s.seed * 10);
      ctx.globalAlpha = 0.85;
      blit(ctx, G.glowG, s.x, y, 0.95 * pulse, 0.95 * pulse, 0);
      ctx.globalAlpha = 1;
      // ink speed lines + trailing drops
      ctx.strokeStyle = INK; ctx.lineWidth = 0.55; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const o of [-2.2, 0, 2.2]) { const px = s.x - ca * 6 - sa * o, py = y - sa * 6 + ca * o, L = o ? 5 : 8; ctx.moveTo(px, py); ctx.lineTo(px - ca * L, py - sa * L); }
      ctx.stroke();
      for (let i = 1; i <= 2; i++) {
        const d = 5.5 * i + 2, r = 1.4 - i * 0.35, px = s.x - ca * d, py = y - sa * d + Math.sin(view.rt * 14 + i * 2 + s.seed * 6) * 0.5;
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(px, py, r + 0.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8aff3a'; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
      }
      const w = 1 + 0.12 * Math.sin(view.rt * 16 + s.seed * 6);
      blit(ctx, G.shot, s.x, y, 1.15 * pulse * w, 1.15 * pulse / w, a);
    },

    icons: (() => {
      function paint(ctx, size, fn) {
        const { c, ctx: tc } = U.canvas(size, size);
        tc.scale(size / 48, size / 48);
        tc.lineJoin = 'round'; tc.lineCap = 'round';
        fn(new Painter(tc, 'n', size / 48, 2.4, 3.6));
        misreg(c, C.mag, 0.7, (size / 48) * 1.4);
        ctx.drawImage(c, 0, 0);
      }
      const seedShape = (c) => { c.moveTo(3.7, 0); c.bezierCurveTo(2.4, -2.4, -2.6, -2.6, -3.2, 0); c.bezierCurveTo(-2.6, 2.6, 2.4, 2.4, 3.7, 0); c.closePath(); };
      return {
        leech(ctx, size) {
          paint(ctx, size, (P) => {
            P.detail((c) => { c.lineWidth = 2; c.beginPath(); c.moveTo(12, 15); c.bezierCurveTo(8, 11, 16, 8, 12, 3); c.moveTo(20, 15); c.bezierCurveTo(16, 11, 24, 8, 20, 3); c.stroke(); });
            P.part((c) => { c.moveTo(35, 22); c.bezierCurveTo(27, 16, 25.5, 11, 27.5, 7.5); c.bezierCurveTo(29.5, 4.5, 33.5, 4.8, 35, 8.4); c.bezierCurveTo(36.5, 4.8, 40.5, 4.5, 42.5, 7.5); c.bezierCurveTo(44.5, 11, 43, 16, 35, 22); c.closePath(); }, C.red,
              { ol: 1.8, sh: [-2.2, -2.2], shade: [C.redDot, 0.6], hi: [[30.6, 9.6, 1.6, 0.9, -0.7]] });
            P.part(E(24, 25, 19, 5), C.orange, { ol: 1.8, dots: [C.orangeDot, 0.4] });
            P.part(E(30, 24.4, 3.4, 1.4), '#fffbd0', { ol: 1.2 });
            P.part((c) => { c.moveTo(4, 25); c.quadraticCurveTo(6, 43, 24, 44); c.quadraticCurveTo(42, 43, 44, 25); c.closePath(); }, C.blue, {
              sh: [-4, -3.5], shade: ['#0f2f80', 0.6], spot: [-1.6, -1.4], hi: [[11, 31, 2.4, 1.2, -0.9]],
              detail(c) { c.fillStyle = C.yellow; for (const [x, y] of [[16, 34], [24, 36], [32, 34]]) { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); } },
            });
          });
        },
        thorns(ctx, size) {
          paint(ctx, size, (P) => {
            P.detail((c) => { c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i + 0.5) * PI / 4; c.moveTo(24 + Math.cos(a) * 21, 25 + Math.sin(a) * 21); c.lineTo(24 + Math.cos(a) * 23.5, 25 + Math.sin(a) * 23.5); } c.stroke(); });
            P.part(POLY(starPts(12, 20, 13, 24, 25, 0, 0.15, 3)), C.leaf, { ol: 1.8, dots: [C.leafDot, 0.35], sh: [-2, -2], shade: [C.leafDot, 0.6] });
            P.part(TURNIP(24, 13, 37, 10), twoTone(C.purple, C.mag, 0.42, C.cream, C.orange, 0.18, 26, 1.2, 0.7), { ol: 1.8, sh: [-3, -2.2], shade: [C.purpleSh, 0.6], spot: [-1.2, -0.9], hi: [[18.4, 20, 1.2, 2.4, 0.3]] });
            P.detail((c) => {
              c.fillStyle = C.yellow;
              c.beginPath(); c.moveTo(17.5, 24); c.lineTo(22.5, 26.2); c.lineTo(21.6, 28.2); c.lineTo(18, 27); c.closePath(); c.moveTo(30.5, 24); c.lineTo(25.5, 26.2); c.lineTo(26.4, 28.2); c.lineTo(30, 27); c.closePath();
              c.fill(); c.lineWidth = 1.1; c.stroke();
            });
          });
        },
        dashup(ctx, size) {
          paint(ctx, size, (P) => {
            P.detail((c) => { c.lineWidth = 2.2; c.beginPath(); c.moveTo(2, 18); c.lineTo(11, 18); c.moveTo(0, 26); c.lineTo(9, 26); c.moveTo(3, 34); c.lineTo(11, 34); c.stroke(); c.setLineDash([3, 3]); c.beginPath(); c.arc(27, 26, 19.5, -1.0, 1.0); c.stroke(); c.setLineDash([]); });
            const c = P.c;
            c.save(); c.translate(26, 27); c.rotate(0.55);
            P.part(CAP(-0.3, -11, 1.4, -15.2, 1.6), C.stem, { ol: 1.6, spot: [-0.6, 0] });
            P.part(PUMPKIN(0, 0, 14, 12.5), C.orange, {
              ol: 2, sh: [-3.4, -2.8], shade: [C.orangeDot, 0.55], spot: [-1.3, -1.1], hi: [[-6.4, -6, 2.6, 1.3, -0.6]],
              detail(d) { d.strokeStyle = C.rib; d.lineWidth = 1.1; for (const k of [-0.6, -0.22, 0.22, 0.6]) { d.beginPath(); d.moveTo(k * 3.5, -11.2); d.quadraticCurveTo(k * 17.5, 0, k * 3.5, 11.7); d.stroke(); } },
            });
            c.restore();
            P.part(POLY(starPts(6, 6, 2.4, 43, 40, 0.2, 0.3, 4)), C.yellow, { ol: 1.5, dots: [C.red, 0.35] });
          });
        },
        range(ctx, size) {
          paint(ctx, size, (P) => {
            P.detail((c) => { c.lineWidth = 2.2; c.setLineDash([2.5, 3.5]); c.beginPath(); c.moveTo(12, 33); c.quadraticCurveTo(17, 6, 33, 13); c.stroke(); c.setLineDash([]); });
            P.part(E(37, 15, 9, 9), C.red, { ol: 1.8, sh: [-2, -2], shade: [C.redDot, 0.6] });
            P.part(E(37, 15, 5.8, 5.8), C.white, { ol: 1.4 });
            P.part(E(37, 15, 2.6, 2.6), C.red, { ol: 1.2 });
            P.detail((c) => {
              c.save(); c.translate(11, 38); c.rotate(-1.2); c.scale(2.6, 2.6);
              const P2 = new Painter(c, 'n', P.k * 2.6, 0.9, 1.3);
              P2.part(seedShape, '#fff1c8', { sh: [-0.9, -0.9], shade: [C.orange, 0.6], spot: [-0.4, -0.4] });
              c.restore();
            });
          });
        },
      };
    })(),
  });
})();
