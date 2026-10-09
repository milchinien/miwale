/* ============================================================================
   Pop-Art Comic (id: popart) – a 1960s/70s printed Halloween comic book come alive.
   Print language: thick black brush-ink outlines (heavier on the shadow side), flat
   process colours, Ben-Day dots / halftone shading (dot size = tone), solid spot blacks,
   slightly misregistered colour plates (offset cyan / magenta fringe) on newsprint.
   Sprites are pre-rendered in init() with a part painter (fill -> dots -> halftone shade
   -> spot black -> ink), both facings + a yellow "impact" frame.
   Ground: newsprint paper, every region its own print treatment computed per pixel
   in world space (rotated dot screens with anti-aliased dots), regions separated by
   brush-ink contour lines of varying weight, speed-hatching along the path edges.
   ========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ------------------------------------------------------------------ palette */
  const INK = '#1b1620';
  const INKA = [30, 24, 36];
  const FLASH = '#ffe94a', FLASH_DOT = '#ff7a1a';
  const OL = 1.0;          // outline weight (world units)
  const MR = 0.5;          // colour-plate misregistration (world units)
  const DSP = 1.3;         // sprite dot-screen spacing (world units)
  const C = {
    orange: '#ff8a1c', orangeDot: '#e0301e', rib: '#d8561a', glow: '#ffe23a', glowHi: '#fffbd0',
    cape: '#2c6ad0', capeDot: '#0f2f80', scarf: '#ea2a33', scarfDot: '#8a0c22',
    pants: '#2b2846', pantsSh: '#1f1c36', glove: '#fffaf0', stem: '#4c8a2a',
    leaf: '#3fae49', leafDot: '#1a6a2c', leafDark: '#2b8a3e',
    white: '#fcfbf4', cyan: '#2ec4ef', cyanDot: '#1aa0d8', mag: '#e0338f',
    yellow: '#ffe23a', red: '#e8262c', blue: '#2c6ad0', paper: '#f4ecd4',
    coTop: '#8a3a86', coTopDot: '#e0338f', coBot: '#c98545', coBotDot: '#a33a1c', coSh: '#3a1030', coLeg: '#9a5a30',
    stone: '#bdb8cc', stoneDot: '#5a5272', wood: '#d39a58', woodDot: '#7a4520', bark: '#8a5634', barkDot: '#3a2010',
    hay: '#f2c94c', hayDot: '#d4721c', dead: '#6a4a52', deadDot: '#2a1420',
  };
  const CRV = [
    { top: '#d4308c', dot: '#2ec4ef', sh: '#5a0c48', bot: '#fdeabb', botDot: '#f08a3c', leaf: '#3fae49' },
    { top: '#8a3cc0', dot: '#e0338f', sh: '#2a0a50', bot: '#f8e6a6', botDot: '#e0338f', leaf: '#5bbf3a' },
  ];
  const CREEP_SCALE = 0.92, JACK_SCALE = 1.12;
  let K = 4;
  const SPR = {};

  /* ============================================================ halftone */
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

  /* ================================================================ painter
     part(shape, fill, o): clip -> flat fill -> o.dots overlay -> o.sh halftone shade
     crescent -> o.spot solid black crescent -> o.detail -> o.hi white shine; then the
     brush outline (two strokes, the second shifted -> heavier on the shadow side) + o.ink. */
  function Painter(c, mode, k, ol, dsp) { this.c = c; this.mode = mode; this.k = k; this.ol = ol || OL; this.dsp = dsp || DSP; }
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
    if (flash) { c.fillStyle = o.flashCol || FLASH; c.fillRect(-999, -999, 1999, 1999); }
    else if (typeof fill === 'function') fill(c, this);
    else { c.fillStyle = fill; c.fillRect(-999, -999, 1999, 1999); }
    if (o.dots && !flash) this.dots(o.dots[0], o.dots[1], o.dots[2], o.dots[3]);
    if (o.sh) {
      const s = flash ? [FLASH_DOT, 0.55] : o.shade || [INK, 0.45];
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
  /** free drawing in both modes (faces, carvings) */
  Painter.prototype.detail = function (fn) {
    const c = this.c;
    c.save(); c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = this.ol * 0.55;
    fn(c, this.mode === 'flash', this);
    c.restore();
  };

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
  const POLY = (pts) => (c) => {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  };
  const CIRCLES = (arr) => (c) => { for (const q of arr) { c.moveTo(q[0] + q[2], q[1]); c.arc(q[0], q[1], q[2], 0, TAU); } };
  /** outline of a union of circles as ONE simple polygon (overlapping subpaths break even-odd crescents) */
  const UNION = (arr) => {
    let cx = 0, cy = 0, ws = 0;
    for (const q of arr) { cx += q[0] * q[2]; cy += q[1] * q[2]; ws += q[2]; }
    cx /= ws; cy /= ws;
    const pts = [], N = 144;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU, dx = Math.cos(a), dy = Math.sin(a);
      let best = 0;
      for (const q of arr) {
        const ox = q[0] - cx, oy = q[1] - cy, b = dx * ox + dy * oy;
        const disc = b * b - (ox * ox + oy * oy) + q[2] * q[2];
        if (disc >= 0) { const t = b + Math.sqrt(disc); if (t > best) best = t; }
      }
      pts.push([cx + dx * best, cy + dy * best]);
    }
    return POLY(pts);
  };
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
    const pts = [];
    const r = U.mulberry32(seed || 7);
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
  /** two-tone fill (top colour above a wavy line) with dot overlays */
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
  /** carved hole: black rim + glowing inside shifted down */
  function carve(c, flash, shape, dx, dy) {
    c.beginPath(); shape(c); c.fillStyle = INK; c.fill();
    c.save(); c.beginPath(); shape(c); c.clip();
    c.translate(dx === undefined ? 0.3 : dx, dy === undefined ? 0.55 : dy);
    c.beginPath(); shape(c); c.fillStyle = flash ? '#ffffff' : C.glow; c.fill();
    c.restore();
  }

  /* --------------------------------------------------------- sprite builder */
  function misreg(cv, col, a, off) {
    const tn = U.tint(cv, col);
    const ctx = cv.getContext('2d');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-over'; ctx.globalAlpha = a;
    ctx.drawImage(tn, -off, off * 0.75);
    ctx.restore();
  }
  function build(box, fn, mode, plate, plateA, post) {
    const m = 1.4 + MR;
    const l = box[0] - m, t = box[1] - m, r = box[2] + m, b = box[3] + m;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, mode || 'n', K, OL, DSP));
    if (post) post(cv, ctx);
    if (plate) misreg(cv, plate, plateA || 0.65, MR * K);
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy }; }
  function set4(box, fn, plate, post) {
    const n = build(box, fn, 'n', plate, 0.65, post), f = build(box, fn, 'flash', plate, 0.65, post);
    return { n, f, nl: flipS(n), fl: flipS(f) };
  }
  function withFlip(s) { return { n: s, l: flipS(s) }; }

  /* ============================================================ characters */
  // Jack: idle + 3-frame walk (A, pass, B). back foot x,y | front foot x,y | back arm, front arm | cape flare
  const JACK_FR = [
    [-2.2, 0, 2.3, 0, 0.2, -0.2, 0],
    [-3.4, -0.3, 3.7, -0.9, 0.85, -0.75, 1],
    [-0.5, -1.9, 1.1, 0, 0.12, 0.05, 0.45],
    [3.3, -0.6, -2.9, -0.2, -0.75, 0.85, 1],
  ];
  function jackParts(P, f) {
    const F = JACK_FR[f], fl = F[6];
    const leg = (hx, fx, fy, back) => {
      P.part(CAP(hx, -8.6, fx, fy - 1.5, 1.35), back ? C.pantsSh : C.pants, { ol: 0.85 });
      P.part(E(fx + 0.9, fy - 1.05, 2.25, 1.35), INK, { ol: 0.6, hi: [[fx + 0.4, fy - 1.65, 0.75, 0.32, -0.15]] });
    };
    const arm = (sx, sy, a, back) => {
      const ex = sx + Math.sin(a) * 5.0, ey = sy + Math.cos(a) * 5.0;
      P.part(CAP(sx, sy, ex, ey, 1.25), back ? C.capeDot : C.cape, { ol: 0.85, dots: back ? null : [C.capeDot, 0.35] });
      P.part(E(ex, ey + 0.2, 1.55, 1.5), C.glove, { ol: 0.8, sh: [-0.6, -0.6], shade: [C.cyanDot, 0.5] });
    };
    // scarf tail (behind everything)
    const wv = Math.sin(f * 1.7) * 0.9;
    P.part(POLY([[-1.2, -17.2], [-6.2 - fl * 1.6, -17.6 + wv], [-8.4 - fl * 2.2, -15.6 + wv * 1.4], [-6.6 - fl * 1.2, -14.9 + wv], [-1.6, -15.2]]), C.scarf, {
      ol: 0.8, sh: [0, -0.8], shade: [C.scarfDot, 0.5],
    });
    leg(-1.4, F[0], F[1], true);
    arm(-2.0, -14.0, F[4], true);
    // cape
    const cape = (c) => {
      c.moveTo(-2.7, -16.6); c.lineTo(2.9, -16.6);
      c.quadraticCurveTo(4.8, -12.2, 5.2, -6.9);
      c.quadraticCurveTo(2.2, -5.5, -0.8, -6.3);
      c.quadraticCurveTo(-3.6, -5.1 + fl * 0.5, -6.6 - fl * 1.6, -6.7 - fl * 0.9);
      c.quadraticCurveTo(-5.0, -12.2, -2.7, -16.6);
      c.closePath();
    };
    leg(1.4, F[2], F[3], false);
    P.part(cape, C.cape, {
      sh: [1.7, -1.3], shade: [C.capeDot, 0.55], spot: [0.75, -0.55],
      ink(c) {
        c.lineWidth = 0.5;
        c.beginPath(); c.moveTo(-0.4, -14.2); c.quadraticCurveTo(-1.6, -10.5, -2.4, -7.2);
        c.moveTo(2.0, -13.6); c.quadraticCurveTo(2.6, -10.2, 2.4, -7.0); c.stroke();
      },
    });
    arm(2.5, -13.8, F[5], false);
    // scarf knot
    P.part(E(0.4, -16.4, 3.9, 1.55), C.scarf, { ol: 0.85, sh: [0, -0.7], shade: [C.scarfDot, 0.5] });
    // head
    const hx = 0.4, hy = -22.6, rx = 8.4, ry = 6.9;
    P.part(CAP(0.4, -28.6, 1.5, -31.6, 1.05), C.stem, { ol: 0.8, spot: [-0.6, 0] });
    P.part(PUMPKIN(hx, hy, rx, ry), C.orange, {
      sh: [-2.3, -1.9], shade: [C.orangeDot, 0.55], spot: [-0.85, -0.75], ol: 1.15,
      detail(c) {
        c.strokeStyle = C.rib; c.lineWidth = 0.55;
        for (const k of [-0.62, -0.25, 0.25, 0.62]) {
          c.beginPath(); c.moveTo(hx + k * rx * 0.25, hy - ry * 0.92);
          c.quadraticCurveTo(hx + k * rx * 1.25, hy, hx + k * rx * 0.25, hy + ry * 0.95); c.stroke();
        }
      },
      hi: [[hx - 4.4, hy - 3.6, 2.1, 0.85, -0.6], [hx - 6.3, hy - 1.4, 0.5, 0.5, 0]],
    });
    P.detail((c, flash) => {
      const fx = hx + 1.4, y = hy;
      carve(c, flash, POLY([[fx - 4.5, y - 0.4], [fx - 1.1, y - 0.6], [fx - 2.9, y - 3.9]]));
      carve(c, flash, POLY([[fx + 1.0, y - 0.6], [fx + 4.4, y - 0.3], [fx + 2.5, y - 3.9]]));
      carve(c, flash, POLY([[fx - 5.4, y + 1.6], [fx - 3.4, y + 2.5], [fx - 2.6, y + 1.5], [fx - 1.4, y + 2.8], [fx + 0.6, y + 2.8], [fx + 1.6, y + 1.5],
        [fx + 2.5, y + 2.5], [fx + 4.9, y + 1.4], [fx + 3.6, y + 4.3], [fx + 1.2, y + 5.2], [fx + 0.5, y + 4.2], [fx - 0.6, y + 5.3], [fx - 3.4, y + 4.6]]), 0.25, 0.6);
    });
  }

  // Rüben-Schleicher
  const CR_FR = [[-2.6, 0, 2.6, 0], [-3.4, -1.5, 2.2, 0], [-2.6, 0, 2.6, 0], [-2.2, 0, 3.4, -1.5]];
  function creeperParts(P, f, v) {
    const col = CRV[v], F = CR_FR[f];
    for (const q of [[-0.66, 7.0, 2.3], [0.6, 6.4, 2.2], [0.02, 8.4, 2.5]]) {
      P.part(LEAF(0.2, -19.4, q[0], q[1], q[2]), col.leaf, { ol: 0.8, spot: [-1.0, 0.25], dots: [C.leafDot, 0.3] });
    }
    P.part(CAP(-1.9, -4.5, F[0], F[1] - 0.6, 1.05), col.bot, { ol: 0.8, sh: [-0.5, 0], shade: [col.botDot, 0.5] });
    P.part(CAP(1.9, -4.5, F[2], F[3] - 0.6, 1.05), col.bot, { ol: 0.8, sh: [-0.5, 0], shade: [col.botDot, 0.5] });
    P.part(TURNIP(0, -20.6, -2.6, 8.5), twoTone(col.top, col.dot, 0.42, col.bot, col.botDot, 0.22, -12.2, 0.9, 0.9), {
      sh: [-2.3, -1.5], shade: [col.sh, 0.6], spot: [-0.95, -0.6], ol: 1.1,
      hi: [[-4.4, -16.2, 1.6, 0.7, -0.8]],
      ink(c) {
        c.lineWidth = 0.4;
        c.beginPath(); c.arc(0.4, -21.5, 3.2, 0.5, 1.2); c.moveTo(-5.2, -5.3); c.quadraticCurveTo(-3, -3.7, -0.6, -3.5); c.stroke();
      },
    });
    P.detail((c, flash) => {
      const fx = 1.3;
      for (const ex of [fx - 2.4, fx + 2.4]) {
        c.beginPath(); c.ellipse(ex, -12.0, 1.55, 1.75, 0, 0, TAU);
        c.fillStyle = flash ? '#fff' : C.glow; c.fill(); c.lineWidth = 0.55; c.stroke();
        c.fillStyle = INK; c.beginPath(); c.ellipse(ex + 0.5, -11.7, 0.62, 1.0, 0, 0, TAU); c.fill();
      }
      // angry brows
      c.beginPath();
      c.moveTo(fx - 4.6, -15.6); c.lineTo(fx - 0.7, -13.7); c.lineTo(fx - 0.9, -12.9); c.lineTo(fx - 4.4, -14.4); c.closePath();
      c.moveTo(fx + 4.6, -15.6); c.lineTo(fx + 0.7, -13.7); c.lineTo(fx + 0.9, -12.9); c.lineTo(fx + 4.4, -14.4); c.closePath();
      c.fill();
      // jagged frown
      c.beginPath();
      c.moveTo(fx - 3.3, -6.6); c.quadraticCurveTo(fx, -10.4, fx + 3.3, -6.6); c.lineTo(fx + 2.2, -5.5); c.quadraticCurveTo(fx, -7.4, fx - 2.2, -5.5); c.closePath();
      c.fill();
      c.fillStyle = flash ? '#fff' : '#ff5a6a';
      c.beginPath(); c.ellipse(fx, -6.9, 1.3, 0.5, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(fx - 2.0, -8.0); c.lineTo(fx - 0.9, -8.75); c.lineTo(fx - 1.3, -7.3); c.closePath();
      c.moveTo(fx + 0.9, -8.75); c.lineTo(fx + 2.0, -8.0); c.lineTo(fx + 1.3, -7.3); c.closePath(); c.fill();
    });
  }

  // Hungergeist
  function ghostPath(c, ph) {
    const w = (i) => Math.sin(ph + i * 1.9);
    c.moveTo(-7, -15.5);
    c.arc(0, -15.5, 7, PI, 0);
    c.bezierCurveTo(7.2, -11, 7.4, -7.5, 6.0, -4.2 + w(0) * 0.4);
    c.quadraticCurveTo(4.6, -1.0 + w(1) * 0.8, 3.0, -3.4);
    c.quadraticCurveTo(1.2, -0.6 + w(2) * 0.9, -0.8, -3.2);
    c.quadraticCurveTo(-3.0, -0.2 + w(3) * 1.0, -4.8, -2.8);
    c.quadraticCurveTo(-8.6 + w(4) * 0.8, -0.2 + w(4) * 1.2, -11.2 + w(5) * 0.8, 0.4 + w(5) * 1.2);
    c.quadraticCurveTo(-8.2, -5.2, -7, -9.5);
    c.closePath();
  }
  function ghostParts(P, f) {
    const ph = (f / 4) * TAU;
    const shape = (c) => ghostPath(c, ph);
    const arm = (x0, y0, x1, y1) => P.part(CAP(x0, y0, x1, y1, 0.95), C.white, { ol: 0.75, sh: [0, -0.7], shade: [C.cyanDot, 0.55] });
    arm(3.0, -11.4, 9.0, -9.4 + Math.sin(ph) * 0.8);
    P.part(shape, C.white, {
      sh: [-2.6, -1.6], shade: [C.cyanDot, 0.62], spot: [-0.75, -0.45], ol: 1.0,
      detail(c, P2) {
        c.save(); c.beginPath(); c.rect(-20, -6.5, 30, 12); c.clip(); P2.dots(C.cyan, 0.5); c.restore();
      },
      hi: [[-3.6, -19.8, 1.8, 0.75, -0.7]],
    });
    arm(4.2, -9.2, 10.2, -7.4 + Math.cos(ph) * 0.8);
    P.part(E(10.3, -7.5 + Math.cos(ph) * 0.8, 1.2, 1.1), C.white, { ol: 0.7 });
    P.detail((c, flash) => {
      const fx = 1.3;
      c.fillStyle = INK;
      c.beginPath(); c.ellipse(fx - 2.6, -16.4, 1.75, 2.5, 0.25, 0, TAU); c.ellipse(fx + 2.2, -16.5, 1.6, 2.4, -0.2, 0, TAU); c.fill();
      c.fillStyle = flash ? '#fff' : C.cyan;
      c.beginPath(); c.arc(fx - 2.2, -15.7, 0.5, 0, TAU); c.arc(fx + 2.5, -15.8, 0.48, 0, TAU); c.fill();
      // gaping mouth
      c.fillStyle = INK;
      c.beginPath(); c.ellipse(fx - 0.1, -10.6, 2.0, 3.0 + Math.sin(ph) * 0.3, 0, 0, TAU); c.fill();
      c.fillStyle = flash ? FLASH_DOT : '#3a2c6a';
      c.beginPath(); c.ellipse(fx - 0.1, -9.6, 1.1, 1.4, 0, 0, TAU); c.fill();
      // starving brow wrinkles
      c.lineWidth = 0.35;
      c.beginPath(); c.moveTo(fx - 4.4, -19.6); c.quadraticCurveTo(fx - 2.8, -20.4, fx - 1.2, -19.4);
      c.moveTo(fx + 0.8, -19.5); c.quadraticCurveTo(fx + 2.2, -20.3, fx + 3.8, -19.4);
      c.moveTo(fx - 4.6, -12.8); c.quadraticCurveTo(fx - 3.6, -11.2, fx - 3.9, -9.2); c.stroke();
    });
  }
  function ghostFade(cv, ctx) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const h = cv.height;
    const g = ctx.createLinearGradient(0, h * 0.72, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, h);
    ctx.restore();
  }

  // Steckrüben-Koloss
  const CO_FR = [[-6, 0, 6, 0, 0], [-7.5, -2.8, 5.5, 0, 0.8], [-6, 0, 6, 0, 0], [-5, 0, 7.5, -2.8, -0.8]];
  function colossusParts(P, f) {
    const F = CO_FR[f], sw = F[4];
    const armSh = { ol: 1.2, sh: [1.4, -1.1], shade: [C.coSh, 0.6], spot: [0.8, -0.5] };
    // back arm
    P.part(CAP(-12.6, -33, -15.6 - sw * 2.4, -17.5, 3.0), C.coLeg, armSh);
    P.part(BLOB([[-19.6 - sw * 2.4, -16.4], [-15.8 - sw * 2.4, -19.6], [-11.8 - sw * 2.4, -16.6], [-12.8 - sw * 2.4, -12.4], [-17.6 - sw * 2.4, -12.2]]), C.coLeg, armSh);
    // crown leaves
    for (const q of [[-0.95, 11, 3.2], [0.85, 10.5, 3.0], [-0.42, 13, 3.4], [0.4, 12.6, 3.3], [0.0, 14.6, 3.5]]) {
      P.part(LEAF(0, -50.5, q[0], q[1], q[2]), C.leafDark, { ol: 1.0, spot: [-1.5, 0.4], dots: [C.leafDot, 0.35] });
    }
    // legs
    for (const [hx, fx, fy] of [[-5.5, F[0], F[1]], [5.5, F[2], F[3]]]) {
      P.part(CAP(hx, -11, fx, fy - 2.6, 3.0), C.coLeg, { ol: 1.1, sh: [-1.2, 0], shade: [C.coSh, 0.6] });
      P.part(E(fx + 0.8, fy - 1.7, 4.4, 2.3), C.coSh, { ol: 0.9, hi: [[fx - 0.6, fy - 2.6, 1.4, 0.5, 0]] });
    }
    // body
    P.part(TURNIP(0, -52.5, -7.2, 17.8), twoTone(C.coTop, C.coTopDot, 0.4, C.coBot, C.coBotDot, 0.32, -33, 1.6, 0.55), {
      sh: [-4.4, -3.2], shade: [C.coSh, 0.62], spot: [-2.2, -1.6], ol: 1.45,
      hi: [[-9.2, -42, 2.6, 1.1, -0.9]],
      ink(c) {
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(-11.5, -44); c.lineTo(-9.4, -41.5); c.lineTo(-10.6, -39); c.lineTo(-8.2, -36.4);
        c.moveTo(12.6, -24); c.lineTo(10.4, -21.6); c.lineTo(11.6, -18.8); c.lineTo(9.6, -16.2);
        c.moveTo(-13.2, -22); c.lineTo(-11, -19.6); c.lineTo(-12.2, -17);
        c.moveTo(6, -48.2); c.lineTo(5.2, -45.8); c.lineTo(6.6, -43.6);
        c.stroke();
        c.lineWidth = 0.4;
        c.beginPath(); c.moveTo(-2, -7.6); c.quadraticCurveTo(-1.5, -5, -3, -3.5); c.moveTo(2.4, -7.5); c.quadraticCurveTo(3.4, -5.5, 2.4, -4); c.stroke();
      },
    });
    // face + core
    P.detail((c, flash) => {
      const fx = 2.2;
      c.beginPath();
      c.moveTo(fx - 8.6, -42.8); c.lineTo(fx + 0.2, -38.9); c.lineTo(fx + 8.8, -42.4); c.lineTo(fx + 8.0, -39.4); c.lineTo(fx + 0.4, -36.4); c.lineTo(fx - 7.8, -39.8); c.closePath();
      c.fill();
      const eye = (pts) => { c.beginPath(); POLY(pts)(c); c.fillStyle = flash ? '#fff' : C.glow; c.fill(); c.lineWidth = 0.5; c.stroke(); };
      eye([[fx - 6.6, -38.4], [fx - 1.4, -35.9], [fx - 2.2, -34.0], [fx - 5.8, -35.2]]);
      eye([[fx + 1.8, -35.9], [fx + 7.0, -38.0], [fx + 6.2, -35.0], [fx + 2.6, -33.9]]);
      c.fillStyle = INK;
      c.beginPath(); c.moveTo(fx - 6.6, -31.8); c.lineTo(fx + 7.0, -32.2); c.lineTo(fx + 5.2, -27.4); c.lineTo(fx - 4.8, -27.0); c.closePath(); c.fill();
      c.fillStyle = flash ? '#fff' : C.glow;
      c.beginPath();
      for (let i = 0; i < 5; i++) { const x = fx - 5 + i * 2.6; c.moveTo(x, -31.7); c.lineTo(x + 1.6, -31.75); c.lineTo(x + 0.8, -29.9); c.closePath(); }
      for (let i = 0; i < 4; i++) { const x = fx - 3.6 + i * 2.5; c.moveTo(x, -27.2); c.lineTo(x + 1.5, -27.25); c.lineTo(x + 0.75, -28.8); c.closePath(); }
      c.fill();
      // glowing core in a chest crack
      const cx = fx - 1.5, cy = -18.5;
      const outer = starPts(7, 5.2, 2.6, cx, cy, 0.2, 0.35, 77);
      c.fillStyle = INK; c.beginPath(); POLY(outer)(c); c.fill();
      c.fillStyle = flash ? '#fff' : C.glow; c.beginPath(); POLY(starPts(7, 3.9, 1.9, cx, cy, 0.2, 0.35, 77))(c); c.fill();
      c.fillStyle = flash ? FLASH : C.glowHi; c.beginPath(); c.arc(cx, cy, 1.3, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.55;
      c.beginPath();
      for (let i = 0; i < 6; i++) { const a = -0.3 + i * 1.05; c.moveTo(cx + Math.cos(a) * 6.4, cy + Math.sin(a) * 6.4); c.lineTo(cx + Math.cos(a) * 8.6, cy + Math.sin(a) * 8.6); }
      c.stroke();
    });
    // front arm
    P.part(CAP(12.4, -33, 15.4 + sw * 2.4, -17.5, 3.0), C.coLeg, armSh);
    P.part(BLOB([[11.6 + sw * 2.4, -16.4], [15.4 + sw * 2.4, -19.8], [19.6 + sw * 2.4, -16.8], [18.4 + sw * 2.4, -12.2], [13.4 + sw * 2.4, -12.4]]), C.coLeg, {
      ...armSh, ink(c) { c.lineWidth = 0.45; c.beginPath(); c.moveTo(14.6 + sw * 2.4, -15.8); c.lineTo(15.4 + sw * 2.4, -12.8); c.moveTo(17 + sw * 2.4, -16); c.lineTo(17.4 + sw * 2.4, -13); c.stroke(); },
    });
  }

  /* ============================================================ small sprites */
  function lanternParts(P) {
    for (const q of [[-0.6, 4.8, 1.6], [0.55, 4.4, 1.5], [0, 5.6, 1.7]]) P.part(LEAF(0, -13.2, q[0], q[1], q[2]), C.leaf, { ol: 0.7, spot: [-0.7, 0.2] });
    P.part(TURNIP(0, -13.8, -0.4, 6.4), twoTone('#9a3cc0', C.mag, 0.4, '#fdeabb', null, 0, -8.6, 0.6, 1.1), { sh: [-1.6, -1.1], shade: ['#3a0a50', 0.55], spot: [-0.6, -0.45], ol: 0.95 });
    P.detail((c, flash) => {
      carve(c, flash, POLY([[-3.3, -6.6], [-0.9, -6.7], [-2.1, -9.0]]), 0.2, 0.4);
      carve(c, flash, POLY([[0.9, -6.7], [3.3, -6.6], [2.1, -9.0]]), 0.2, 0.4);
      carve(c, flash, POLY([[-3.4, -4.9], [-1.8, -4.2], [-0.6, -4.9], [0.6, -4.2], [1.8, -4.9], [3.4, -4.2], [1.6, -2.3], [-1.6, -2.3]]), 0.15, 0.4);
    });
  }
  const seedShape = (c) => { c.moveTo(3.7, 0); c.bezierCurveTo(2.4, -2.4, -2.6, -2.6, -3.2, 0); c.bezierCurveTo(-2.6, 2.6, 2.4, 2.4, 3.7, 0); c.closePath(); };
  function seedParts(P) {
    P.part(seedShape, '#fff1c8', { ol: 0.8, sh: [-0.9, -0.9], shade: [C.orange, 0.6], spot: [-0.4, -0.4], hi: [[-0.9, -0.9, 1.3, 0.45, 0.2]] });
  }
  function gemParts(P, big) {
    if (big) {
      P.part(POLY(starPts(5, 5.4, 2.6, 0, -5.2, -PI / 2)), C.mag, { ol: 0.9, sh: [-1.2, -1.2], shade: ['#7a0a50', 0.6], dots: [C.yellow, 0.3], hi: [[-1.4, -7.4, 1.0, 0.5, -0.6]] });
      P.part(E(0, -5.2, 1.5, 1.5), C.yellow, { ol: 0.6 });
    } else {
      const sh = (c) => { c.moveTo(0, -7.2); c.bezierCurveTo(2.6, -5.2, 2.6, -1.8, 0, -0.6); c.bezierCurveTo(-2.6, -1.8, -2.6, -5.2, 0, -7.2); c.closePath(); };
      P.part(sh, C.cyan, { ol: 0.8, sh: [-0.9, -0.9], shade: ['#0a5a9a', 0.6], hi: [[-0.8, -4.8, 0.55, 1.2, 0.2]] });
    }
  }
  const BOOM_COL = [[C.yellow, C.red], [C.white, C.cyan], ['#ff8a1c', '#8a0c22'], [C.yellow, '#9a3cc0']];
  function boomParts(P, t) {
    const col = BOOM_COL[t];
    const outer = starPts(12, 10, 5.6, 0, 0, 0.1, 0.38, 31 + t);
    P.part(POLY(outer), col[0], {
      ol: 0.9,
      detail(c, P2) {
        c.save(); c.beginPath(); c.arc(0, 0, 6.2, 0, TAU); c.clip(); P2.dots(col[1], 0.62, 1.15); c.restore();
        c.save(); c.beginPath(); c.arc(0, 0, 3.6, 0, TAU); c.clip(); P2.dots(col[1], 0.95, 1.15); c.restore();
      },
    });
  }
  function impactParts(P) {
    P.part(POLY(starPts(8, 6.5, 2.4, 0, 0, 0, 0.3, 5)), C.yellow, { ol: 0.75, dots: [C.red, 0.35, 1.0] });
    P.part(POLY(starPts(8, 3.0, 1.2, 0, 0, 0.3, 0.2, 9)), '#ffffff', { noOl: true });
  }
  const CHUNK_COL = [CRV[0].top, CRV[0].bot, C.leaf, C.white, C.coBot, C.coTop, C.orange, C.yellow, CRV[1].top];
  function chunkParts(P, col, i) {
    const r = U.mulberry32(400 + i);
    const pts = [];
    const n = 5;
    for (let k = 0; k < n; k++) { const a = (k / n) * TAU + r() * 0.6; const rr = 2.0 + r() * 1.4; pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.85]); }
    P.part(POLY(pts), col, { ol: 0.6, spot: [-0.8, -0.6] });
  }
  function puffParts(P) {
    P.part(UNION([[0, 0, 4.2], [-4.2, 1.2, 3.0], [4.2, 1.0, 3.2], [-1.6, -2.8, 3.0], [2.2, -2.6, 2.8]]), C.white, { ol: 0.7, sh: [-1.2, -1.2], shade: [C.cyanDot, 0.5] });
  }
  function twinkleParts(P) {
    const sh = (c) => { const r = 4.5; c.moveTo(0, -r); c.quadraticCurveTo(0.6, -0.6, r, 0); c.quadraticCurveTo(0.6, 0.6, 0, r); c.quadraticCurveTo(-0.6, 0.6, -r, 0); c.quadraticCurveTo(-0.6, -0.6, 0, -r); c.closePath(); };
    P.part(sh, C.white, { ol: 0.6, sh: [-0.6, -0.6], shade: [C.cyan, 0.6] });
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

  /* ================================================================ props */
  function treeParts(P, v) {
    const crown = v === 1 ? '#f07a2a' : '#56b04a', crownDot = v === 1 ? C.red : '#1f6e30';
    P.part(POLY([[-3.2, 0.4], [-2.0, -6], [-1.8, -20], [-4.6, -25], [-1.0, -22.6], [0.4, -27], [1.4, -22], [4.8, -24.6], [2.0, -19.4], [2.2, -6], [3.6, 0.4]]), C.bark, {
      ol: 1.0, sh: [1.4, 0], shade: [C.barkDot, 0.55], spot: [0.8, 0],
      ink(c) { c.lineWidth = 0.4; c.beginPath(); c.moveTo(0.2, -4); c.lineTo(-0.2, -10); c.moveTo(0.6, -13); c.lineTo(0.9, -17); c.stroke(); },
    });
    const circ = v === 1
      ? [[0, -36, 11.5], [-8.8, -30.5, 7.6], [8.6, -31, 7.8], [-4.4, -43.5, 7.8], [5.2, -43, 7.4], [0, -48.5, 6]]
      : [[0, -35, 12.8], [-9.6, -29, 8.6], [9.4, -29.5, 8.6], [-5, -42.5, 8.6], [6, -42, 8.2]];
    P.part(UNION(circ), crown, {
      ol: 1.2, sh: [-3.4, -3.6], shade: [crownDot, 0.55], spot: [-0.4, -2.6], dots: [crownDot, 0.18],
      hi: [[-7, -40, 2.4, 1.0, -0.7]],
      ink(c) {
        c.lineWidth = 0.5;
        const r = U.mulberry32(91 + v);
        c.beginPath();
        for (let i = 0; i < 7; i++) {
          const x = -9 + r() * 16, y = -45 + r() * 15;
          c.moveTo(x - 1.2, y); c.quadraticCurveTo(x, y + 1.3, x + 1.2, y);
        }
        c.stroke();
      },
    });
  }
  function deadTreeParts(P) {
    const br = { ol: 0.9, sh: [0.9, 0], shade: [C.deadDot, 0.6], spot: [0.5, 0] };
    P.part(CAP(0, -24, -8.5, -34.5, 1.2), C.dead, br);
    P.part(CAP(-8.5, -34.5, -13, -33, 0.7), C.dead, br);
    P.part(CAP(0.4, -30, 9, -39, 1.1), C.dead, br);
    P.part(CAP(9, -39, 9.6, -45, 0.65), C.dead, br);
    P.part(CAP(5, -35, 13.5, -35.6, 0.7), C.dead, br);
    P.part(CAP(-0.4, -32, -2.4, -44, 0.9), C.dead, br);
    P.part(POLY([[-3.6, 0.4], [-2.2, -8], [-1.6, -26], [-0.6, -33], [1.0, -27], [2.0, -8], [4.0, 0.4]]), C.dead, {
      ol: 1.0, sh: [1.2, 0], shade: [C.deadDot, 0.6], spot: [0.7, 0],
      ink(c) { c.lineWidth = 0.4; c.beginPath(); c.ellipse(0.2, -15, 0.8, 1.4, 0, 0, TAU); c.stroke(); },
    });
  }
  function bushParts(P) {
    P.part(UNION([[0, -6.4, 7], [-6.4, -4.6, 5], [6.4, -4.8, 5.2], [-2.4, -10.4, 5], [3.2, -10, 4.6]]), '#56b04a', {
      ol: 1.0, sh: [-2, -2], shade: ['#1f6e30', 0.55], spot: [0, -2.2], hi: [[-4.4, -11, 1.6, 0.7, -0.6]],
    });
    P.detail((c) => {
      c.fillStyle = C.red; c.lineWidth = 0.4;
      for (const q of [[-3, -7], [2.6, -8.6], [5.2, -5.4], [-6, -5.6], [0.4, -4]]) { c.beginPath(); c.arc(q[0], q[1], 0.9, 0, TAU); c.fill(); c.stroke(); }
    });
  }
  function rockParts(P, v) {
    const pts = v ? [[-7, 0], [-6, -4.5], [-2, -7], [3.5, -6.2], [6.8, -2.6], [7, 0]] : [[-9, 0], [-8, -5.4], [-3.6, -9.4], [2.6, -9.8], [7.8, -6], [9.2, 0]];
    P.part(BLOB(pts), C.stone, {
      ol: 1.0, sh: [-2, -1.6], shade: [C.stoneDot, 0.55], spot: [-1.1, -0.8], hi: [[-3, -6, 1.6, 0.6, -0.4]],
      ink(c) { c.lineWidth = 0.4; c.beginPath(); c.moveTo(1, -6); c.lineTo(2, -4); c.lineTo(1.2, -2.4); c.stroke(); },
    });
  }
  function fenceParts(P) {
    const o = { ol: 0.85, sh: [0, -0.9], shade: [C.woodDot, 0.55], spot: [0, -0.45] };
    P.part(POLY([[-17, -10.6], [17, -12], [17, -9.6], [-17, -8.2]]), C.wood, o);
    P.part(POLY([[-17, -4.6], [17, -5.6], [17, -3.4], [-17, -2.4]]), C.wood, o);
    for (const x of [-14, 0, 14]) {
      P.part(POLY([[x - 1.7, 0.6], [x - 1.7, -13.4], [x, -15.6], [x + 1.7, -13.4], [x + 1.7, 0.6]]), C.wood, {
        ol: 0.9, sh: [1.0, 0], shade: [C.woodDot, 0.55], spot: [0.6, 0],
      });
    }
  }
  function signParts(P) {
    P.part(POLY([[-1.4, 0.6], [-0.9, -24], [1.3, -24], [1.6, 0.6]]), C.wood, { ol: 0.9, sh: [0.9, 0], shade: [C.woodDot, 0.6], spot: [0.5, 0] });
    const board = POLY([[-9, -22.6], [6.5, -23.8], [10.4, -19.4], [6.8, -15.2], [-8.6, -15.8]]);
    P.part(board, '#fbf1d0', {
      ol: 1.0, sh: [0, -1.2], shade: [C.woodDot, 0.35], spot: [0, -0.6],
      detail(c) {
        c.fillStyle = C.red;
        c.beginPath(); c.moveTo(-5.6, -20.4); c.lineTo(1.6, -20.8); c.lineTo(1.6, -22.2); c.lineTo(5.6, -19.5); c.lineTo(1.8, -16.8); c.lineTo(1.8, -18.2); c.lineTo(-5.4, -17.9); c.closePath(); c.fill();
      },
    });
    P.detail((c) => { c.beginPath(); c.arc(-7.2, -19.3, 0.5, 0, TAU); c.arc(8.4, -19.4, 0.5, 0, TAU); c.fill(); });
  }
  function pumpkinUnit(P, cx, cy, rx, ry, lit) {
    P.part(CAP(cx - 0.2, cy - ry + 0.6, cx + 1.0, cy - ry - 2.2, 0.95), C.stem, { ol: 0.75, spot: [-0.5, 0] });
    P.part(PUMPKIN(cx, cy, rx, ry), C.orange, {
      ol: 1.05, sh: [-2.2, -1.8], shade: [C.orangeDot, 0.55], spot: [-0.8, -0.7],
      detail(c) {
        c.strokeStyle = C.rib; c.lineWidth = 0.5;
        for (const k of [-0.6, -0.22, 0.22, 0.6]) { c.beginPath(); c.moveTo(cx + k * rx * 0.25, cy - ry * 0.9); c.quadraticCurveTo(cx + k * rx * 1.25, cy, cx + k * rx * 0.25, cy + ry * 0.94); c.stroke(); }
      },
      hi: [[cx - rx * 0.5, cy - ry * 0.5, rx * 0.24, ry * 0.12, -0.6]],
    });
    if (lit) {
      P.detail((c, flash) => {
        carve(c, flash, POLY([[cx - 3.6, cy - 0.6], [cx - 0.9, cy - 0.7], [cx - 2.3, cy - 3.3]]));
        carve(c, flash, POLY([[cx + 0.9, cy - 0.7], [cx + 3.6, cy - 0.6], [cx + 2.2, cy - 3.3]]));
        carve(c, flash, POLY([[cx - 4.2, cy + 1.2], [cx - 2.2, cy + 2.0], [cx - 0.6, cy + 1.2], [cx + 0.8, cy + 2.0], [cx + 4.2, cy + 1.1], [cx + 2.4, cy + 3.6], [cx - 2.4, cy + 3.6]]));
      });
    }
  }
  function pumpProp(P, v) {
    if (v === 0) { pumpkinUnit(P, -4.6, -5.8, 8.2, 5.8, false); pumpkinUnit(P, 7.4, -3.8, 5.2, 3.8, false); }
    else pumpkinUnit(P, 0, -6.8, 8.8, 6.8, true);
  }
  function crowParts(P) {
    P.part(POLY([[-1.0, 0.6], [-0.8, -34], [1.0, -34], [1.2, 0.6]]), C.wood, { ol: 0.85, sh: [0.8, 0], shade: [C.woodDot, 0.6], spot: [0.4, 0] });
    P.part(POLY([[-13, -24.6], [13, -25.6], [13, -23.6], [-13, -22.6]]), C.wood, { ol: 0.8, sh: [0, -0.8], shade: [C.woodDot, 0.6] });
    // straw hands
    P.detail((c) => {
      c.strokeStyle = '#d49a1c'; c.lineWidth = 0.7;
      c.beginPath();
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { c.moveTo(s * 11, -24.4); c.lineTo(s * (14.5 + i * 0.3), -26.5 + i * 1.4); }
      c.stroke();
    });
    // shirt (red, blue dot plaid)
    P.part(POLY([[-11, -26.6], [-3.6, -28.4], [3.6, -28.4], [11, -26.8], [10.6, -22.6], [4.4, -23.4], [5.4, -12.4], [2.6, -13.6], [0, -11.8], [-2.6, -13.6], [-5.4, -12.4], [-4.4, -23.4], [-10.6, -22.4]]), C.red, {
      ol: 1.0, dots: ['#1f3c9a', 0.42, 1.6], sh: [-1.8, -1.4], shade: ['#5a0a14', 0.6], spot: [-0.7, -0.5],
      ink(c) { c.lineWidth = 0.4; c.beginPath(); c.moveTo(-6, -26); c.lineTo(-5.4, -24); c.moveTo(6, -26.4); c.lineTo(6.6, -24.2); c.stroke(); },
    });
    // sack head
    P.part(BLOB([[0, -39.8], [4.4, -37.8], [4.8, -32.6], [0.4, -29.4], [-4.2, -31.6], [-4.4, -37]]), '#f3dca0', {
      ol: 1.0, sh: [-1.4, -1.2], shade: [C.woodDot, 0.45], spot: [-0.6, -0.5],
      ink(c) {
        c.lineWidth = 0.55;
        c.beginPath();
        for (const ex of [-2, 2]) { c.moveTo(ex - 0.9, -36.4); c.lineTo(ex + 0.9, -34.8); c.moveTo(ex + 0.9, -36.4); c.lineTo(ex - 0.9, -34.8); }
        c.moveTo(-2.6, -32.6); c.quadraticCurveTo(0, -31, 2.8, -32.8);
        for (let i = 0; i < 5; i++) { const x = -2.2 + i * 1.2; c.moveTo(x, -32.6 + (i === 2 ? 0.7 : 0.4)); c.lineTo(x + 0.1, -31.2); }
        c.stroke();
      },
    });
    // hat
    P.part(POLY([[-7.6, -38.4], [7.8, -39.4], [7.8, -37.8], [-7.6, -36.8]]), INK, { ol: 0.6 });
    P.part(POLY([[-3.8, -38.6], [-2.2, -45.6], [1.0, -47.6], [3.4, -44.8], [4.0, -39.0]]), INK, { ol: 0.6, detail(c) { c.fillStyle = C.orange; c.fillRect(-4, -41.2, 8.4, 1.3); } });
  }
  function hayParts(P) {
    P.part((c) => { c.moveTo(-12, 0); c.lineTo(-12, -9); c.quadraticCurveTo(-12, -12, -9, -12); c.lineTo(9, -12); c.quadraticCurveTo(12, -12, 12, -9); c.lineTo(12, 0); c.closePath(); }, C.hay, {
      ol: 1.0, dots: [C.hayDot, 0.25], sh: [-2.2, -1.8], shade: [C.hayDot, 0.6], spot: [-0.9, -0.6],
      ink(c) {
        c.lineWidth = 0.4;
        c.beginPath();
        const r = U.mulberry32(5);
        for (let i = 0; i < 16; i++) { const x = -10.5 + r() * 21, y = -10.5 + r() * 9.5; c.moveTo(x, y); c.lineTo(x + 1.2 + r() * 1.4, y + (r() - 0.5) * 0.8); }
        c.stroke();
        c.lineWidth = 0.7; c.beginPath(); c.moveTo(-12, -5); c.lineTo(12, -5.4); c.stroke();
      },
    });
  }
  function graveParts(P, v) {
    const o = (x) => ({ ol: 1.1, sh: [-2.0, -1.4], shade: [C.stoneDot, 0.55], spot: [-1.0, -0.6], hi: [[x, -18, 1.2, 0.5, -0.5]], ink: null });
    P.part(E(0, -0.4, 10, 2.6), '#7a6a88', { ol: 0.8, dots: [INK, 0.4] });
    if (v === 0) {
      P.part((c) => { c.moveTo(-6.4, 0); c.lineTo(-6.4, -14); c.arc(0, -14, 6.4, PI, 0); c.lineTo(6.4, 0); c.closePath(); }, C.stone, {
        ...o(-3.4),
        ink(c) { c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, -18); c.lineTo(0, -10); c.moveTo(-2.4, -15.6); c.lineTo(2.4, -15.6); c.stroke(); c.lineWidth = 0.4; c.beginPath(); c.moveTo(-3.6, -5.6); c.lineTo(3.6, -5.6); c.moveTo(-2.8, -3.6); c.lineTo(2.8, -3.6); c.stroke(); },
      });
    } else if (v === 1) {
      P.part(POLY([[-1.6, 0], [-1.6, -15], [-5.6, -15], [-5.6, -18.2], [-1.6, -18.2], [-1.6, -22.4], [1.6, -22.4], [1.6, -18.2], [5.6, -18.2], [5.6, -15], [1.6, -15], [1.6, 0]]), C.stone, {
        ...o(-0.6), sh: [-1.4, -1.2],
      });
    } else {
      P.part(POLY([[-5.8, 0.2], [-6.6, -15.4], [-3.4, -18.6], [3.8, -18.4], [6.6, -15], [6.4, 0.2]]), '#a9a4bc', {
        ...o(-3.4),
        ink(c) {
          c.lineWidth = 0.75; c.beginPath(); c.moveTo(-3.4, -13.6); c.lineTo(3.4, -13.6); c.stroke();
          c.lineWidth = 0.4; c.beginPath(); c.moveTo(-3, -10.4); c.lineTo(3, -10.4); c.moveTo(-2.4, -8.4); c.lineTo(2.6, -8.4); c.moveTo(2.4, -17.6); c.lineTo(1.2, -15.6); c.lineTo(2.2, -14.4); c.stroke();
        },
      });
    }
  }
  const PROP_DEF = {
    tree: { n: 2, box: [-23, -58, 23, 2], fn: treeParts, sh: [15, 4.5] },
    dtree: { n: 1, box: [-15, -47, 16, 2], fn: deadTreeParts, sh: [10, 3.2] },
    bush: { n: 1, box: [-12, -16, 12, 2], fn: bushParts, sh: [11, 3.0] },
    rock: { n: 2, box: [-11, -12, 11, 2], fn: rockParts, sh: [9, 2.6] },
    fence: { n: 1, box: [-19, -17, 19, 2], fn: fenceParts, sh: [17, 2.6] },
    sign: { n: 1, box: [-11, -26, 12, 2], fn: signParts, sh: [5, 1.8] },
    pump: { n: 2, box: [-14, -16, 14, 2], fn: pumpProp, sh: [11, 3.0] },
    crow: { n: 1, box: [-16, -49, 16, 2], fn: crowParts, sh: [7, 2.2] },
    hay: { n: 1, box: [-14, -14, 14, 2], fn: hayParts, sh: [13, 3.2] },
    grave: { n: 3, box: [-11, -24, 11, 3], fn: graveParts, sh: [0, 0] },
  };

  /* ================================================================ ground */
  const GSTEP = 4;
  const NF = 8;
  // materials: 0 meadow (base), 1 autumn field, 2 night, 3 graveyard, 4 path
  const MATS = [
    { p: [237, 233, 199], sc: [{ ink: [104, 176, 98], sp: 3.3, a: 0.785, r0: 0.17, r1: 0.33 }] },
    { p: [250, 216, 128], sc: [{ ink: [232, 98, 62], sp: 3.0, a: 0.26, r0: 0.15, r1: 0.31 }] },
    { p: [200, 210, 232], sc: [{ ink: [86, 104, 178], sp: 3.0, a: 0.785, r0: 0.22, r1: 0.36 }] },
    { p: [224, 211, 222], sc: [{ ink: [134, 96, 160], sp: 2.8, a: 1.05, r0: 0.2, r1: 0.36 }] },
    { p: [249, 233, 170], sc: [], hatch: true },
  ];
  for (const m of MATS) for (const s of m.sc) { s.ca = Math.cos(s.a); s.sa = Math.sin(s.a); s.inv = 1 / s.sp; s.f = s.ink.map((v) => 1 - v / 255); }
  function layersAt(x, y, out) {
    const wx = U.perlin(x / 900, y / 900, 711) * 110, wy = U.perlin(x / 900 + 9.2, y / 900, 712) * 110;
    const X = x + wx, Y = y + wy;
    out[0] = U.fbm(X / 1000 + 3.1, Y / 1000, 121, 3) - 0.55;
    out[1] = U.fbm(X / 1250 - 7.7, Y / 1250, 131, 3) - 0.635;
    out[2] = U.fbm(X / 820 + 17.3, Y / 820, 141, 3) - 0.625;
    const qx = U.perlin(x / 420, y / 420, 151) * 55, qy = U.perlin(x / 420 + 5.1, y / 420, 152) * 55;
    const pn = U.perlin((x + qx) / 1500, (y + qy) / 1500, 153);
    out[3] = (0.02 - Math.abs(pn)) * 3.2;
  }
  function fieldsAt(x, y, out) {
    layersAt(x, y, out);
    out[4] = U.clamp(0.5 + U.perlin(x / 240, y / 240, 161) * 0.42 + U.perlin(x / 1300, y / 1300, 162) * 0.3, 0, 1);
    out[5] = U.noise(x / 36, y / 36, 171);
    out[6] = 1 + (U.noise(x / 1700, y / 1700, 181) - 0.5) * 0.08;
    out[7] = U.noise(x / 16, y / 16, 191);
  }
  const FT = new Float32Array(NF);
  function matAt(x, y) {
    layersAt(x, y, FT);
    for (let L = 3; L >= 0; L--) if (FT[L] > 0) return L + 1;
    return 0;
  }
  function matSafe(x, y, r) {
    const m = matAt(x, y);
    if (matAt(x + r, y) !== m || matAt(x - r, y) !== m || matAt(x, y + r) !== m || matAt(x, y - r) !== m) return -1;
    return m;
  }
  const pack = (r, g, b) => (255 << 24) | ((b < 0 ? 0 : b > 255 ? 255 : b | 0) << 16) | ((g < 0 ? 0 : g > 255 ? 255 : g | 0) << 8) | (r < 0 ? 0 : r > 255 ? 255 : r | 0);
  let GRAIN = null;
  function buildGrain() {
    const N = 256;
    GRAIN = new Float32Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const h = U.hash2(x, y, 4242);
        const fib = U.perlin(x / 3, y / 24, 4243, 86, 11) * 0.5 + U.perlin(x / 16, y / 16, 4244, 16, 16) * 0.5;
        GRAIN[y * N + x] = 0.985 + (h - 0.5) * 0.045 + fib * 0.025;
      }
    }
  }

  // decals ------------------------------------------------------------------
  function dTuft(c, x, y, s) {
    c.fillStyle = INK;
    c.beginPath();
    for (const q of [[-1.6, -2.6, -0.9], [0.1, -3.6, 0], [1.7, -2.4, 0.9]]) {
      c.moveTo(x + q[2] * s - 0.45 * s, y);
      c.quadraticCurveTo(x + q[2] * s, y - 1.2 * s, x + q[0] * s, y + q[1] * s);
      c.quadraticCurveTo(x + q[2] * s + 0.3 * s, y - 1.2 * s, x + q[2] * s + 0.45 * s, y);
      c.closePath();
    }
    c.fill();
  }
  function dFlower(c, x, y, s, petal) {
    c.fillStyle = petal; c.strokeStyle = INK; c.lineWidth = 0.35;
    c.beginPath();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - PI / 2; const px = x + Math.cos(a) * 0.95 * s, py = y + Math.sin(a) * 0.95 * s; c.moveTo(px + 0.7 * s, py); c.arc(px, py, 0.7 * s, 0, TAU); }
    c.fill(); c.stroke();
    c.fillStyle = C.yellow; c.beginPath(); c.arc(x, y, 0.55 * s, 0, TAU); c.fill(); c.stroke();
  }
  function dStone(c, x, y, rx, ry, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#d6d0dc'; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill();
    c.save(); c.clip(); c.fillStyle = INK; c.beginPath(); c.ellipse(-rx * 0.35, -ry * 0.4, rx, ry, 0, 0, TAU); c.rect(-rx * 3, -ry * 3, rx * 6, ry * 6); c.fill('evenodd'); c.restore();
    c.strokeStyle = INK; c.lineWidth = 0.4; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.stroke();
    c.restore();
  }
  function dLeaf(c, x, y, s, a, col) {
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 0.35;
    c.beginPath(); leafPath(c, x, y, a, 3.2 * s, 1.3 * s); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * 2.4 * s, y - Math.cos(a) * 2.4 * s); c.stroke();
  }
  function dCrack(c, x, y, rr, len) {
    c.strokeStyle = INK; c.lineWidth = 0.45;
    c.beginPath(); c.moveTo(x, y);
    let px = x, py = y, a = rr() * TAU;
    for (let i = 0; i < 4; i++) {
      a += (rr() - 0.5) * 1.4; px += Math.cos(a) * len; py += Math.sin(a) * len * 0.6; c.lineTo(px, py);
      if (i === 1) { c.moveTo(px, py); c.lineTo(px + Math.cos(a + 1) * len * 0.7, py + Math.sin(a + 1) * len * 0.4); c.moveTo(px, py); }
    }
    c.stroke();
  }
  function dSplat(c, x, y, s, rr) {
    c.fillStyle = INK;
    c.beginPath(); blobPath(c, starPts(6, 1.8 * s, 1.1 * s, x, y, rr() * TAU, 0.4, (rr() * 1e6) | 0).filter((_, i) => i % 1 === 0)); c.fill();
    c.beginPath();
    for (let i = 0; i < 4; i++) { const a = rr() * TAU, d = (2.6 + rr() * 2.4) * s, r = (0.25 + rr() * 0.35) * s; c.moveTo(x + Math.cos(a) * d + r, y + Math.sin(a) * d * 0.7); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, r, 0, TAU); }
    c.fill();
  }
  function dGlint(c, x, y, s) {
    c.fillStyle = '#ffffff'; c.strokeStyle = INK; c.lineWidth = 0.3;
    c.beginPath(); c.moveTo(x, y - 1.6 * s); c.lineTo(x + 0.4 * s, y - 0.4 * s); c.lineTo(x + 1.6 * s, y); c.lineTo(x + 0.4 * s, y + 0.4 * s);
    c.lineTo(x, y + 1.6 * s); c.lineTo(x - 0.4 * s, y + 0.4 * s); c.lineTo(x - 1.6 * s, y); c.lineTo(x - 0.4 * s, y - 0.4 * s); c.closePath(); c.fill(); c.stroke();
  }
  function* decals(ctx, info) {
    const pts = [];
    G.scatter(info, 15, 7001, 8, (x, y, rng) => { pts.push(x, y, rng.next(), rng.next(), rng.next(), rng.next()); });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < pts.length; i += 6) {
      if (i % 120 === 114) yield;
      const x = pts[i], y = pts[i + 1], r0 = pts[i + 2], r1 = pts[i + 3], r2 = pts[i + 4];
      const m = matSafe(x, y, 5);
      if (m < 0) continue;
      const rr = U.mulberry32(((pts[i + 5] * 1e9) | 0) ^ 0x5bd1e995);
      if (r0 > 0.985) { dSplat(ctx, x, y, 0.7 + r1 * 0.5, rr); continue; }
      if (m === 0) {
        if (r0 < 0.3) dTuft(ctx, x, y, 0.8 + r1 * 0.4);
        else if (r0 < 0.36) dFlower(ctx, x, y, 0.85 + r2 * 0.3, r1 < 0.6 ? '#ffffff' : '#ff9ac8');
      } else if (m === 1) {
        if (r0 < 0.24) dLeaf(ctx, x, y, 0.9 + r2 * 0.4, r2 * TAU, r1 < 0.5 ? C.red : C.yellow);
        else if (r0 < 0.4) {
          ctx.strokeStyle = INK; ctx.lineWidth = 0.4; ctx.beginPath();
          for (let k = 0; k < 3; k++) { const a = -0.5 + rr() * 1.0; ctx.moveTo(x + k * 1.1, y); ctx.lineTo(x + k * 1.1 + Math.cos(a) * 2.4, y + Math.sin(a) * 1.2 - 1.2); }
          ctx.stroke();
        }
      } else if (m === 2) {
        if (r0 < 0.12) dGlint(ctx, x, y, 0.8 + r1 * 0.6);
        else if (r0 < 0.3) dTuft(ctx, x, y, 0.75 + r1 * 0.3);
      } else if (m === 3) {
        if (r0 < 0.14) dCrack(ctx, x, y, rr, 2.4 + r1 * 1.6);
        else if (r0 < 0.24) dStone(ctx, x, y, 1.4 + r1, 0.9 + r2 * 0.5, (r1 - 0.5) * 0.6);
        else if (r0 < 0.38) dTuft(ctx, x, y, 0.75 + r1 * 0.3);
      } else {
        if (r0 < 0.14) dStone(ctx, x, y, 1.1 + r1 * 0.9, 0.7 + r2 * 0.4, (r1 - 0.5) * 0.6);
        else if (r0 < 0.24) { ctx.fillStyle = INK; ctx.beginPath(); for (let k = 0; k < 3; k++) { const px = x + rr() * 4 - 2, py = y + rr() * 3 - 1.5; ctx.moveTo(px + 0.35, py); ctx.arc(px, py, 0.35, 0, TAU); } ctx.fill(); }
      }
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

  /* ----------------------------------------------------------- comic text */
  let fontOK = false, fontCheckT = -1;
  const textCache = new Map();
  function fontReady(rt) {
    if (fontOK) return true;
    if (fontCheckT >= 0 && rt - fontCheckT < 0.5) return false;
    fontCheckT = rt;
    if (document.fonts) document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === 'Bangers' && f.status === 'loaded') fontOK = true; });
    if (fontOK) textCache.clear();
    return fontOK;
  }
  const FONT = (px, ok) => (ok ? '' : 'bold ') + px + 'px "Bangers", "Luckiest Guy", Impact, "Arial Black", sans-serif';
  function numSprite(value, crit, rt) {
    const ok = fontReady(rt);
    const key = 'n' + value + (crit ? 'c' : '') + (ok ? 'L' : 'F');
    let s = textCache.get(key);
    if (s) return s;
    if (textCache.size > 600) textCache.clear();
    const fs = (crit ? 13 : 9.5) * K;
    const font = FONT(fs, ok);
    const meas = U.canvas(4, 4).ctx; meas.font = font;
    const txt = String(value);
    const tw = meas.measureText(txt).width;
    const pad = crit ? fs * 0.9 : fs * 0.45;
    const w = Math.ceil(tw + pad * 2), h = Math.ceil(fs * (crit ? 2.1 : 1.5));
    const { c, ctx } = U.canvas(w, h);
    ctx.lineJoin = 'round';
    const cx = w / 2, cy = h / 2 + fs * 0.06;
    if (crit) {
      const pts = starPts(11, 1, 0.74, 0, 0, 0.2, 0.25, value);
      const rx = w / 2 - 3, ry = h / 2 - 3;
      ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, cx + q[0] * rx, h / 2 + q[1] * ry)); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = K * 0.8; ctx.stroke();
    }
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // misregistered plate
    ctx.fillStyle = crit ? C.cyan : C.mag; ctx.globalAlpha = 0.85;
    ctx.fillText(txt, cx - K * 0.7, cy + K * 0.6);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = INK; ctx.lineWidth = fs * 0.22; ctx.strokeText(txt, cx, cy);
    ctx.fillStyle = crit ? C.yellow : '#ffffff'; ctx.fillText(txt, cx, cy);
    if (crit) {
      // red halftone inside the letters
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      const T = Math.max(3, Math.round(K * 1.1));
      ctx.fillStyle = dotPattern(C.red, 0.55, T);
      ctx.beginPath(); ctx.rect(0, cy, w, h); ctx.clip();
      ctx.font = font; ctx.fillText(txt, cx, cy);
      ctx.restore();
    }
    s = { c, ox: w / 2, oy: h / 2 };
    textCache.set(key, s);
    return s;
  }
  const WORDS = ['POW!', 'ZACK!', 'KRACH!', 'PENG!', 'BÄM!', 'ZONK!', 'PLOPP!'];
  const BIG_WORDS = ['WUMMS!', 'KRACH!', 'RUMMS!'];
  const WORD_COL = [[C.yellow, C.red, C.orangeDot], [C.red, C.yellow, '#8a0c22'], [C.cyan, '#ffffff', '#0a5a9a'], ['#ffffff', C.red, C.cyan]];
  function wordSprite(word, v, rt) {
    const ok = fontReady(rt);
    const key = 'w' + word + v + (ok ? 'L' : 'F');
    let s = textCache.get(key);
    if (s) return s;
    const col = WORD_COL[v];
    const fs = 11 * K;
    const font = FONT(fs, ok);
    const meas = U.canvas(4, 4).ctx; meas.font = font;
    const tw = meas.measureText(word).width;
    const rx = tw / 2 + fs * 0.75, ry = fs * 1.0;
    const w = Math.ceil(rx * 2 + K * 4), h = Math.ceil(ry * 2 + K * 4);
    const { c, ctx } = U.canvas(w, h);
    const cx = w / 2, cy = h / 2;
    let seed = 0; for (let i = 0; i < word.length; i++) seed = seed * 31 + word.charCodeAt(i);
    const pts = starPts(13, 1, 0.72, 0, 0, 0.1, 0.3, seed + v);
    const path = () => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, cx + q[0] * rx, cy + q[1] * ry)); ctx.closePath(); };
    ctx.lineJoin = 'round';
    // plate offset
    path(); ctx.save(); ctx.translate(-K * 0.8, K * 0.7); ctx.fillStyle = col[2]; ctx.globalAlpha = 0.7; path(); ctx.fill(); ctx.restore();
    path(); ctx.fillStyle = col[0]; ctx.fill();
    ctx.save(); path(); ctx.clip();
    const T = Math.max(3, Math.round(K * 1.4));
    ctx.fillStyle = dotPattern(col[2], 0.42, T); ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.62, ry * 0.62, 0, 0, TAU); ctx.rect(0, 0, w, h); ctx.fill('evenodd');
    ctx.restore();
    path(); ctx.strokeStyle = INK; ctx.lineWidth = K * 1.0; ctx.stroke();
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ty = cy + fs * 0.06;
    ctx.fillStyle = INK; ctx.fillText(word, cx + K * 0.9, ty + K * 0.9);
    ctx.strokeStyle = INK; ctx.lineWidth = fs * 0.2; ctx.strokeText(word, cx, ty);
    ctx.fillStyle = col[1]; ctx.fillText(word, cx, ty);
    s = { c, ox: w / 2, oy: h / 2 };
    textCache.set(key, s);
    return s;
  }

  /* ----------------------------------------------------------- screen overlay */
  let OV = null;
  function buildOverlay(W, H) {
    const { c, ctx } = U.canvas(W, H);
    const sp = Math.max(7, Math.round(H / 100));
    ctx.fillStyle = 'rgba(27,22,32,0.42)';
    ctx.beginPath();
    for (let j = 0, y = 0; y < H + sp; y += sp, j++) {
      for (let x = j & 1 ? sp / 2 : 0; x < W + sp; x += sp) {
        const nx = (x / W - 0.5) * 2, ny = (y / H - 0.5) * 2;
        const v = U.smoothstep(0.9, 1.42, Math.hypot(nx, ny * 1.05));
        if (v <= 0.04) continue;
        const r = v * sp * 0.62;
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
      }
    }
    ctx.fill();
    // comic panel: paper gutter + brushy black frame
    const g = Math.max(4, Math.round(H * 0.006));
    const lw = Math.max(4, Math.round(H * 0.006));
    ctx.fillStyle = '#f4ecd4';
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(g, g, W - 2 * g, H - 2 * g); ctx.fill('evenodd');
    ctx.strokeStyle = '#1b1620'; ctx.lineJoin = 'round';
    const rr = U.mulberry32(3);
    const edge = (x0, y0, x1, y1) => {
      const n = 24;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const t = i / n, j = (rr() - 0.5) * lw * 0.35;
        const x = x0 + (x1 - x0) * t + (y0 === y1 ? 0 : j), y = y0 + (y1 - y0) * t + (y0 === y1 ? j : 0);
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.lineWidth = lw * (0.9 + rr() * 0.3); ctx.stroke();
    };
    const o = g + lw / 2;
    edge(o, o, W - o, o); edge(W - o, o, W - o, H - o); edge(W - o, H - o, o, H - o); edge(o, H - o, o, o);
    // tiles that actually contain something
    const nx = 10, ny = 8, tiles = [];
    const data = ctx.getImageData(0, 0, W, H).data;
    for (let ty = 0; ty < ny; ty++) {
      for (let tx = 0; tx < nx; tx++) {
        const x0 = Math.floor((tx * W) / nx), x1 = Math.floor(((tx + 1) * W) / nx);
        const y0 = Math.floor((ty * H) / ny), y1 = Math.floor(((ty + 1) * H) / ny);
        let any = false;
        for (let y = y0; y < y1 && !any; y += 2) for (let x = x0; x < x1; x += 2) if (data[(y * W + x) * 4 + 3] > 0) { any = true; break; }
        if (any) tiles.push([x0, y0, x1 - x0, y1 - y0]);
      }
    }
    return { c, W, H, tiles };
  }

  /* ================================================================== CSS */
  function tso(w, col, drop, dcol) {
    const a = [];
    for (let i = 0; i < 16; i++) { const t = (i / 16) * TAU; a.push((Math.cos(t) * w).toFixed(1) + 'px ' + (Math.sin(t) * w).toFixed(1) + 'px 0 ' + col); }
    if (drop) a.push(drop + 'px ' + drop + 'px 0 ' + (dcol || col));
    return a.join(',');
  }
  function cssStar(n, ri, seed) {
    const r = U.mulberry32(seed);
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = -PI / 2 + (i / (n * 2)) * TAU + (r() - 0.5) * 0.12;
      const rad = i & 1 ? ri * (0.9 + r() * 0.2) : 0.92 + r() * 0.08;
      pts.push((50 + Math.cos(a) * 50 * rad).toFixed(1) + '% ' + (50 + Math.sin(a) * 50 * rad).toFixed(1) + '%');
    }
    return 'polygon(' + pts.join(',') + ')';
  }
  const I_ = '#1b1620';
  const DOTS = (col, r, s) => `radial-gradient(circle, ${col} ${r}px, transparent ${r + 0.5}px) 0 0/${s}px ${s}px`;
  const B = 'body.style-popart';
  const CSS = `
${B} { font-family: 'Comic Neue', 'Comic Sans MS', system-ui, sans-serif; }
${B} #hud { padding: 18px 26px; }
${B} #hud .xp { height: 22px; background: ${DOTS('rgba(27,22,32,.2)', 1.1, 6)}, #f4ecd4; border: 3px solid ${I_}; border-radius: 0; box-shadow: 4px 4px 0 ${I_}; transform: skewX(-10deg); overflow: hidden; }
${B} #hud .xp-fill { background: ${DOTS('#1474b8', 1.7, 6)}, #2ec4ef; border-right: 3px solid ${I_}; }
${B} #hud .lvl { right: 10px; padding: 0 8px; background: #ffe23a; border: 2px solid ${I_}; font-family: 'Bangers', Impact, sans-serif; font-weight: 400; font-size: 17px; line-height: 16px; letter-spacing: 1px; color: ${I_}; text-shadow: none; transform: translateY(-50%) skewX(10deg); }
${B} #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 16px; }
${B} #hud .hp { position: relative; gap: 8px; justify-self: start; }
${B} #hud .hp-icon, ${B} #hud .kills-icon { width: 46px; height: 46px; }
${B} #hud .hp-bar { width: 250px; height: 28px; background: ${DOTS('rgba(27,22,32,.22)', 1.1, 6)}, #f4ecd4; border: 3px solid ${I_}; border-radius: 0; box-shadow: 4px 4px 0 ${I_}; transform: skewX(-10deg); }
${B} #hud .hp-fill { background: ${DOTS('#8a0c22', 1.8, 6)}, #e8262c; border-right: 3px solid ${I_}; }
${B} #hud .hp-text { position: absolute; left: 54px; width: 250px; top: 50%; transform: translateY(-50%); text-align: center; font-family: 'Bangers', Impact, sans-serif; font-weight: 400; font-size: 21px; letter-spacing: 1.5px; color: #fff; text-shadow: ${tso(2, I_)}; }
${B}.hurt #hud .hp { animation: popShake .22s steps(3) 1; }
@keyframes popShake { 0%,100% { transform: none } 33% { transform: translate(-4px,2px) rotate(-1.5deg) } 66% { transform: translate(4px,-2px) rotate(1.5deg) } }
${B} #hud .clock { justify-self: center; flex-direction: row; align-items: baseline; gap: 12px; padding: 4px 18px 5px; background: #ffe23a; border: 3px solid ${I_}; box-shadow: 5px 5px 0 ${I_}; transform: rotate(-1deg); }
${B} #hud .clock-time { font-family: 'Bangers', Impact, sans-serif; font-weight: 400; font-size: 38px; line-height: 1; letter-spacing: 2px; color: ${I_}; text-shadow: 2px 2px 0 #e8262c; }
${B} #hud .clock-label { font-size: 0; opacity: 1; letter-spacing: 0; }
${B} #hud .clock-label::before { content: '\\2013  noch bis Mitternacht \\2026'; font-family: 'Comic Neue', 'Comic Sans MS', sans-serif; font-weight: 700; font-size: 16px; letter-spacing: 1px; text-transform: uppercase; color: ${I_}; }
${B} #hud .kills { justify-self: end; position: relative; min-width: 0; gap: 4px; padding: 4px 26px 4px 12px; background: #fff; border: 3px solid ${I_}; border-radius: 50%; box-shadow: 4px 4px 0 ${I_}; font-family: 'Bangers', Impact, sans-serif; font-weight: 400; font-size: 30px; letter-spacing: 1px; color: ${I_}; text-shadow: none; }
${B} #hud .kills::before { content: ''; position: absolute; left: 22px; bottom: -15px; border: 9px solid transparent; border-top: 15px solid ${I_}; border-left-width: 2px; }
${B} #hud .kills::after { content: ''; position: absolute; left: 25px; bottom: -8px; border: 6px solid transparent; border-top: 10px solid #fff; border-left-width: 1px; }
${B} #hud .kills-icon { width: 40px; height: 40px; }
${B} #stylebar { background: #ffe23a; color: ${I_}; border: 3px solid ${I_}; border-radius: 0; box-shadow: 5px 5px 0 ${I_}; padding: 5px 20px; gap: 14px; bottom: 16px; font-family: 'Comic Neue', 'Comic Sans MS', sans-serif; font-weight: 700; }
${B} #stylebar .style-family { opacity: 1; color: ${I_}; font-weight: 700; }
${B} #stylebar .style-name { font-family: 'Bangers', Impact, sans-serif; font-weight: 400; font-size: 24px; letter-spacing: 1.5px; color: #e8262c; text-shadow: ${tso(1.5, I_)}; }
${B} #stylebar .style-hint { opacity: .85; }
${B} #stylebar .auto.on { color: #1474b8; }
${B} #levelup { gap: 34px; background: radial-gradient(ellipse at 50% 40%, rgba(27,22,32,0) 30%, rgba(27,22,32,.55) 85%), ${DOTS('rgba(232,38,44,.32)', 2.2, 11)}, repeating-conic-gradient(from 0deg at 50% 30%, rgba(255,226,58,.15) 0deg 7deg, rgba(255,226,58,0) 7deg 14deg), rgba(27,22,32,.62); }
${B} #levelup .lu-title { position: relative; z-index: 0; isolation: isolate; padding: 46px 110px 40px; font-family: 'Bangers', Impact, sans-serif; font-weight: 400; font-size: 92px; line-height: 1; letter-spacing: 4px; color: #ffe23a; text-shadow: ${tso(4, I_, 8, I_)}; transform: rotate(-4deg); animation: popIn .45s cubic-bezier(.3,1.8,.5,1) backwards; }
${B} #levelup .lu-title::before { content: ''; position: absolute; inset: -10px -14px; z-index: -2; background: ${I_}; clip-path: ${cssStar(16, 0.72, 11)}; }
${B} #levelup .lu-title::after { content: ''; position: absolute; inset: 0; z-index: -1; background: ${DOTS('#ffe23a', 2.6, 10)}, #e8262c; clip-path: ${cssStar(16, 0.72, 11)}; }
@keyframes popIn { from { transform: scale(.15) rotate(-20deg); } to { transform: scale(1) rotate(-4deg); } }
${B} #levelup .lu-cards { gap: 30px; }
${B} #levelup .card { width: 236px; min-height: 290px; padding: 0 18px 22px; gap: 8px; color: ${I_}; background: #fbf5e2; border: 4px solid ${I_}; border-radius: 0; box-shadow: 8px 8px 0 ${I_}; overflow: hidden; transform: rotate(-1.5deg); transition: transform .14s cubic-bezier(.3,1.6,.5,1); animation: popCard .45s cubic-bezier(.3,1.5,.5,1) backwards; }
${B} #levelup .card::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 132px; z-index: 0; background: ${DOTS('rgba(20,116,184,.55)', 2, 8)}, #2ec4ef; border-bottom: 4px solid ${I_}; }
${B} #levelup .card:nth-child(2) { transform: rotate(1deg); animation-delay: .07s; }
${B} #levelup .card:nth-child(2)::before { background: ${DOTS('rgba(232,38,44,.55)', 2, 8)}, #ffe23a; }
${B} #levelup .card:nth-child(3) { transform: rotate(-0.5deg); animation-delay: .14s; }
${B} #levelup .card:nth-child(3)::before { background: ${DOTS('rgba(138,12,80,.5)', 2, 8)}, #ff7ab8; }
@keyframes popCard { from { transform: translateY(70px) scale(.6) rotate(8deg); opacity: 0; } }
${B} #levelup .card:hover { transform: translateY(-10px) rotate(0deg) scale(1.04); }
${B} #levelup .card > * { position: relative; z-index: 1; }
${B} #levelup .card-icon { width: 112px; height: 112px; margin-top: 12px; margin-bottom: 8px; }
${B} #levelup .card-name { margin-top: 4px; font-family: 'Bangers', Impact, sans-serif; font-weight: 400; font-size: 30px; line-height: 1.05; letter-spacing: 1.5px; color: ${I_}; }
${B} #levelup .card-desc { font-family: 'Comic Neue', 'Comic Sans MS', sans-serif; font-weight: 700; font-size: 18px; line-height: 1.25; opacity: 1; color: ${I_}; }
${B} #levelup .card-key { position: absolute; z-index: 2; top: 10px; left: 10px; padding: 1px 9px; background: #fff; border: 3px solid ${I_}; box-shadow: 3px 3px 0 ${I_}; font-family: 'Bangers', Impact, sans-serif; font-weight: 400; font-size: 20px; opacity: 1; color: ${I_}; }
${B} #levelup .lu-hint { padding: 5px 18px; background: #fff; border: 3px solid ${I_}; box-shadow: 4px 4px 0 ${I_}; font-family: 'Comic Neue', 'Comic Sans MS', sans-serif; font-weight: 700; font-size: 17px; text-transform: uppercase; letter-spacing: 1px; opacity: 1; color: ${I_}; }
${B} #gameover { gap: 20px; background: ${DOTS('rgba(27,22,32,.55)', 2.4, 10)}, rgba(138,12,34,.6); }
${B} #gameover .go-title { font-family: 'Bangers', Impact, sans-serif; font-weight: 400; font-size: 96px; letter-spacing: 4px; color: #e8262c; text-shadow: ${tso(4, I_, 8, I_)}; transform: rotate(-3deg); }
${B} #gameover .go-stats { padding: 8px 22px; background: #ffe23a; border: 3px solid ${I_}; box-shadow: 5px 5px 0 ${I_}; font-family: 'Comic Neue', 'Comic Sans MS', sans-serif; font-weight: 700; font-size: 20px; text-transform: uppercase; opacity: 1; color: ${I_}; }
${B} #gameover .go-hint { padding: 6px 22px; background: #fff; border: 3px solid ${I_}; border-radius: 50%; box-shadow: 4px 4px 0 ${I_}; font-family: 'Bangers', Impact, sans-serif; font-size: 24px; letter-spacing: 1px; opacity: 1; color: ${I_}; }
${B} #pausebox { font-family: 'Bangers', Impact, sans-serif; font-weight: 400; font-size: 84px; letter-spacing: 4px; color: #ffe23a; text-shadow: ${tso(4, I_, 7, I_)}; }
`;

  /* ================================================================ icons */
  function iconPainter(ctx, size) { return new Painter(ctx, 'n', size / 48, 2.4, 3.6); }
  const ICONS = {
    'hp-heart'(P) {
      P.part((c) => {
        c.moveTo(24, 42); c.bezierCurveTo(10, 33, 4.5, 25, 4.5, 17); c.bezierCurveTo(4.5, 10, 9.5, 5.5, 15.5, 5.5);
        c.bezierCurveTo(19.5, 5.5, 22.5, 8, 24, 11.5); c.bezierCurveTo(25.5, 8, 28.5, 5.5, 32.5, 5.5);
        c.bezierCurveTo(38.5, 5.5, 43.5, 10, 43.5, 17); c.bezierCurveTo(43.5, 25, 38, 33, 24, 42); c.closePath();
      }, C.red, { sh: [-4.5, -4.5], shade: ['#8a0c22', 0.6], spot: [-1.8, -1.8], hi: [[13.5, 13, 4.2, 2.2, -0.7], [9, 19, 1.2, 1.2, 0]] });
    },
    kills(P) {
      const col = CRV[0];
      for (const q of [[-0.7, 10, 3.6], [0.7, 10, 3.6], [0, 11.5, 4]]) P.part(LEAF(24, 13, q[0], q[1], q[2]), col.leaf, { spot: [-2, 0.5] });
      P.part(TURNIP(24, 11, 44, 16), twoTone(col.top, col.dot, 0.42, col.bot, null, 0, 26, 1.6, 0.5), { sh: [-4, -3], shade: [col.sh, 0.6], spot: [-1.7, -1.2] });
      P.detail((c) => {
        c.lineWidth = 2.2;
        c.beginPath();
        for (const ex of [18.5, 29.5]) { c.moveTo(ex - 2.6, 26.4); c.lineTo(ex + 2.6, 31.6); c.moveTo(ex + 2.6, 26.4); c.lineTo(ex - 2.6, 31.6); }
        c.stroke();
        c.beginPath(); c.moveTo(19, 38); c.quadraticCurveTo(24, 35, 29, 38); c.stroke();
      });
    },
    dmg(P) {
      P.part(POLY(starPts(9, 21, 10, 24, 24, 0.2, 0.3, 4)), C.yellow, { dots: [C.red, 0.4] });
      P.detail((c) => {
        c.save(); c.translate(24, 24); c.rotate(-0.7); c.scale(3.0, 3.0);
        const P2 = new Painter(c, 'n', P.k * 3, 0.8, 1.2);
        P2.part(seedShape, '#fff1c8', { sh: [-0.9, -0.9], shade: [C.orange, 0.6], spot: [-0.4, -0.4] });
        c.restore();
      });
    },
    rate(P) {
      P.part(POLY([[28, 3], [10, 27], [21, 27], [16, 45], [38, 18], [26, 18], [33, 3]]), C.yellow, { sh: [-3, -3], shade: [C.orangeDot, 0.6], spot: [-1.4, -1.2], hi: [[22, 12, 2.4, 1.0, -1.0]] });
      P.detail((c) => { c.lineWidth = 2; c.beginPath(); c.moveTo(4, 12); c.lineTo(11, 12); c.moveTo(2, 20); c.lineTo(8, 20); c.moveTo(38, 32); c.lineTo(45, 32); c.moveTo(36, 40); c.lineTo(43, 40); c.stroke(); });
    },
    multi(P) {
      P.part(BLOB([[24, 14], [37, 19], [41, 33], [33, 43], [15, 43], [7, 33], [11, 19]]), '#c98545', { sh: [-4, -3], shade: [C.woodDot, 0.6], spot: [-1.6, -1.2], hi: [[14, 26, 2.6, 1.2, -1.0]] });
      P.part(POLY([[13, 17], [35, 17], [32, 12], [16, 12]]), C.red, { dots: ['#8a0c22', 0.4] });
      P.detail((c) => {
        c.save();
        for (const q of [[18, 8, -0.6], [24, 6, 0], [30, 8, 0.6]]) {
          c.save(); c.translate(q[0], q[1]); c.rotate(q[2] - PI / 2); c.scale(1.6, 1.6);
          const P2 = new Painter(c, 'n', P.k * 1.6, 0.9, 1.4);
          P2.part(seedShape, '#fff1c8', { sh: [-0.9, -0.9], shade: [C.orange, 0.6] });
          c.restore();
        }
        c.restore();
      });
    },
    bounce(P) {
      P.detail((c) => {
        c.lineWidth = 2; c.setLineDash([3, 4]);
        c.beginPath(); c.moveTo(4, 38); c.quadraticCurveTo(12, 6, 22, 40); c.quadraticCurveTo(30, 14, 40, 18); c.stroke();
        c.setLineDash([]);
      });
      P.part(POLY(starPts(7, 8, 3.5, 22, 40, 0, 0.2, 3)), C.yellow, { ol: 1.8, dots: [C.red, 0.4] });
      P.detail((c) => {
        c.save(); c.translate(38, 17); c.rotate(-0.3); c.scale(2.2, 2.2);
        const P2 = new Painter(c, 'n', P.k * 2.2, 0.9, 1.3);
        P2.part(seedShape, '#fff1c8', { sh: [-0.9, -0.9], shade: [C.orange, 0.6], spot: [-0.4, -0.4] });
        c.restore();
      });
    },
    lantern(P) {
      P.detail((c) => {
        c.save(); c.translate(24, 44); c.scale(2.6, 2.6);
        const P2 = new Painter(c, 'n', P.k * 2.6, 0.9, 1.3);
        lanternParts(P2);
        c.restore();
      });
    },
    speed(P) {
      P.detail((c) => { c.lineWidth = 2.2; c.beginPath(); c.moveTo(2, 18); c.lineTo(12, 18); c.moveTo(0, 26); c.lineTo(10, 26); c.moveTo(4, 34); c.lineTo(12, 34); c.stroke(); });
      P.part((c) => {
        c.moveTo(14, 34); c.quadraticCurveTo(15, 22, 24, 20); c.quadraticCurveTo(33, 19, 38, 27); c.quadraticCurveTo(46, 31, 44, 36);
        c.lineTo(41, 36); c.lineTo(40, 44); c.lineTo(37, 44); c.lineTo(36, 37); c.quadraticCurveTo(24, 38, 14, 34); c.closePath();
      }, '#9ce8ff', { sh: [-3, -3], shade: [C.cyanDot, 0.65], spot: [-1.2, -1.2], hi: [[22, 25, 4, 1.4, -0.3], [36, 29, 1.4, 1.4, 0]] });
      P.part(POLY(starPts(4, 5, 1.4, 34, 12, 0, 0, 1)), '#ffffff', { ol: 1.6 });
    },
    magnet(P) {
      P.detail((c) => { c.lineWidth = 3.2; c.beginPath(); c.moveTo(10, 24); c.quadraticCurveTo(24, -2, 38, 24); c.stroke(); c.strokeStyle = C.wood; c.lineWidth = 1.6; c.stroke(); });
      P.part(E(17, 20, 5, 4.4), C.cyan, { ol: 1.8, sh: [-1.4, -1.4], shade: ['#0a5a9a', 0.6] });
      P.part(E(29, 19, 5, 4.4), C.cyan, { ol: 1.8, sh: [-1.4, -1.4], shade: ['#0a5a9a', 0.6] });
      P.part(E(23, 16, 5, 4.4), C.mag, { ol: 1.8, sh: [-1.4, -1.4], shade: ['#7a0a50', 0.6] });
      P.part((c) => { c.moveTo(6, 23); c.lineTo(42, 23); c.lineTo(37, 43); c.lineTo(11, 43); c.closePath(); }, C.wood, {
        sh: [-3, -2.5], shade: [C.woodDot, 0.6], spot: [-1.4, -1.0],
        ink(c) { c.lineWidth = 1.4; c.beginPath(); for (const y of [29, 35]) { c.moveTo(8, y); c.lineTo(40, y); } for (const x of [17, 24, 31]) { c.moveTo(x, 23); c.lineTo(x - (x - 24) * 0.2, 43); } c.stroke(); },
      });
    },
    hp(P) {
      P.detail((c) => { c.lineWidth = 2; c.beginPath(); c.moveTo(18, 14); c.bezierCurveTo(14, 10, 22, 7, 18, 2); c.moveTo(28, 14); c.bezierCurveTo(24, 10, 32, 7, 28, 2); c.stroke(); });
      P.part(E(24, 22, 19, 5), '#7a3a2a', { dots: ['#3a1408', 0.4] });
      P.part(E(17, 21, 4, 2.6), '#9a3cc0', { ol: 1.4 });
      P.part(E(29, 22, 4, 2.6), '#fdeabb', { ol: 1.4 });
      P.part((c) => { c.moveTo(4, 22); c.quadraticCurveTo(6, 42, 24, 43); c.quadraticCurveTo(42, 42, 44, 22); c.closePath(); }, C.red, {
        sh: [-4, -3.5], shade: ['#8a0c22', 0.6], spot: [-1.6, -1.4], hi: [[12, 29, 2.4, 1.2, -0.9]],
        ink(c) { c.lineWidth = 1.4; c.beginPath(); c.moveTo(14, 33); c.lineTo(34, 33); c.stroke(); },
      });
    },
  };

  /* ============================================================== particles */
  let lastWordT = -9, lastHurtWordT = -9, lastStep = -1;
  function addWord(game, x, y, z, word, v, big) {
    let n = 0;
    for (const p of game.particles) if (p.kind === 'word') n++;
    if (n >= 3) return;
    game.addParticle({ kind: 'word', word, tint: v, x, y, z, vx: 0, vy: 0, vz: 0, drag: 0, life: big ? 1.0 : 0.85, size: big ? 1.55 : 1.25, rot: (Math.random() - 0.5) * 0.4 });
  }
  function puff(game, x, y, z, size, vx, vy, life) {
    return game.addParticle({ kind: 'puff', x, y, z, vx, vy, drag: 5, life, size, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 2 });
  }

  /* ================================================================ style */
  Styles.register({
    id: 'popart',
    name: 'Pop-Art Comic',
    family: 'Comic',
    description: 'Gedrucktes Horror-Comicheft der 60er: dicke Tuschekonturen, Ben-Day-Punkte, verrutschte Farbplatten und knallende Lautmalereien.',
    groundColor: '#ece6c8',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Bangers', 'Comic+Neue:wght@700'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = Math.max(3, Math.min(5, Math.round(S * 1.4)));
      buildGrain();
      SPR.jack = [0, 1, 2, 3].map((f) => set4([-11, -33, 10, 1.5], (P) => jackParts(P, f), C.cyan));
      SPR.jackPlate = SPR.jack.map((s) => ({ c: [U.tint(s.n.c, C.cyan), U.tint(s.n.c, C.mag)], cl: [U.tint(s.nl.c, C.cyan), U.tint(s.nl.c, C.mag)], ox: s.n.ox, oy: s.n.oy, oxl: s.nl.ox }));
      SPR.creep = [0, 1].map((v) => [0, 1, 2, 3].map((f) => set4([-10, -29, 10, 1.5], (P) => creeperParts(P, f, v), C.cyan)));
      SPR.ghost = [0, 1, 2, 3].map((f) => set4([-13, -24, 12, 2], (P) => ghostParts(P, f), C.mag, ghostFade));
      SPR.colo = [0, 1, 2, 3].map((f) => set4([-24, -66, 24, 1.5], (P) => colossusParts(P, f), C.cyan));
      SPR.lantern = build([-8, -20, 8, 1], lanternParts, 'n', C.cyan, 0.6);
      SPR.seed = build([-4, -3, 4.5, 3], seedParts, 'n', C.mag, 0.6);
      SPR.gemS = build([-3.5, -8, 3.5, 0], (P) => gemParts(P, false), 'n', C.mag, 0.6);
      SPR.gemB = build([-6, -11, 6, 0], (P) => gemParts(P, true), 'n', C.cyan, 0.6);
      SPR.boom = BOOM_COL.map((_, t) => build([-11, -11, 11, 11], (P) => boomParts(P, t), 'n', t === 1 ? C.mag : C.cyan, 0.6));
      SPR.impact = build([-7, -7, 7, 7], impactParts, 'n', C.cyan, 0.6);
      SPR.chunk = CHUNK_COL.map((col, i) => build([-3.6, -3.4, 3.6, 3.4], (P) => chunkParts(P, col, i)));
      SPR.puff = build([-8, -7, 8, 5], puffParts);
      SPR.twinkle = build([-5, -5, 5, 5], twinkleParts, 'n', C.mag, 0.6);
      SPR.streak = plain([-17, -3, -2, 3], (c) => {
        c.fillStyle = INK;
        c.beginPath();
        for (const q of [[0, 1.0, 15], [-2.0, 0.55, 10], [2.0, 0.55, 11]]) { c.moveTo(-3.5, q[0] - q[1] / 2); c.lineTo(-3.5 - q[2], q[0]); c.lineTo(-3.5, q[0] + q[1] / 2); c.closePath(); }
        c.fill();
      });
      SPR.shadow = plain([-10, -4, 10, 4], (c, P) => {
        c.save(); c.beginPath(); c.ellipse(0, 0, 9.6, 3.5, 0, 0, TAU); c.clip(); P.dots(INK, 0.5, 1.15); c.restore();
        c.save(); c.beginPath(); c.ellipse(0, 0, 6.4, 2.3, 0, 0, TAU); c.clip(); P.dots(INK, 0.95, 1.15); c.restore();
      });
      SPR.glow = plain([-16, -16, 16, 16], (c) => {
        c.fillStyle = C.yellow;
        c.beginPath();
        const sp = 1.6;
        for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) {
          const x = i * sp + (j & 1 ? sp / 2 : 0), y = j * sp * 0.866;
          const d = Math.hypot(x, y) / 15;
          if (d >= 1) continue;
          const r = Math.pow(1 - d, 0.7) * sp * 0.55;
          c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
        }
        c.fill();
      });
      SPR.spawn = plain([-15, -15, 15, 15], (c, P) => {
        const pts = starPts(12, 14, 8, 0, 0, 0, 0.35, 21);
        c.beginPath(); POLY(pts)(c); c.fillStyle = C.yellow; c.fill();
        c.save(); c.clip(); c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.clip(); P.dots(C.red, 0.7, 1.3); c.restore();
        c.beginPath(); c.arc(0, 0, 4.6, 0, TAU); c.fillStyle = INK; c.fill();
        c.beginPath(); POLY(pts)(c); c.strokeStyle = INK; c.lineWidth = 1.1; c.lineJoin = 'round'; c.stroke();
      });
      SPR.props = {};
      for (const t in PROP_DEF) {
        const d = PROP_DEF[t];
        SPR.props[t] = [];
        for (let v = 0; v < d.n; v++) SPR.props[t].push(withFlip(build(d.box, (P) => d.fn(P, v), 'n', '#ff3d6e', 0.45)));
      }
      if (document.fonts && document.fonts.load) {
        try { document.fonts.load('20px "Bangers"', 'POW!0123456789ÄÖÜ'); document.fonts.load('700 16px "Comic Neue"'); } catch (e) { /* ignore */ }
      }
    },

    /* ------------------------------------------------------------ ground */
    *renderGroundChunk(ctx, info) {
      const res = info.res, Wp = info.px, wx0 = info.wx, wy0 = info.wy;
      const cpx = GSTEP * res;
      const nc = Math.ceil(Wp / cpx - 1e-6);
      const nn = nc + 1;
      const F = new Float32Array(nn * nn * NF);
      const tmp = new Float32Array(NF);
      for (let j = 0; j < nn; j++) {
        const y = wy0 + j * GSTEP;
        for (let i = 0; i < nn; i++) {
          fieldsAt(wx0 + i * GSTEP, y, tmp);
          const o = (j * nn + i) * NF;
          for (let k = 0; k < NF; k++) F[o + k] = tmp[k];
        }
        if ((j & 3) === 3) yield;
      }
      // per-cell layer state: 0 = clearly outside, 2 = deep inside, 1 = needs per-pixel distance
      const ST = new Int8Array(nc * nc * 4);
      for (let gy = 0; gy < nc; gy++) {
        for (let gx = 0; gx < nc; gx++) {
          const o00 = (gy * nn + gx) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF;
          for (let L = 0; L < 4; L++) {
            const a = F[o00 + L], b = F[o10 + L], c = F[o01 + L], d = F[o11 + L];
            const mn = Math.min(a, b, c, d), mx = Math.max(a, b, c, d);
            const gxm = Math.max(Math.abs(b - a), Math.abs(d - c)), gym = Math.max(Math.abs(c - a), Math.abs(d - b));
            const g = Math.sqrt(gxm * gxm + gym * gym) / GSTEP + 1e-9;
            ST[(gy * nc + gx) * 4 + L] = mx < 0 && mx / g < -2.5 ? 0 : mn > 0 && mn / g > 10 ? 2 : 1;
          }
        }
        if ((gy & 15) === 15) yield;
      }
      const img = ctx.createImageData(Wp, Wp);
      const buf = new Uint32Array(img.data.buffer);
      const inv = 1 / res;
      const gOffX = Math.round(wx0 * res), gOffY = Math.round(wy0 * res);
      const GR = GRAIN;
      for (let py = 0; py < Wp; py++) {
        if ((py & 1) === 1) yield;
        const gyf = (py + 0.5) / cpx;
        let gy = gyf | 0; if (gy >= nc) gy = nc - 1;
        const v = gyf - gy, v1 = 1 - v;
        const y = wy0 + (py + 0.5) * inv;
        const grow = ((py + gOffY) & 255) << 8;
        for (let px = 0; px < Wp; px++) {
          const gxf = (px + 0.5) / cpx;
          let gx = gxf | 0; if (gx >= nc) gx = nc - 1;
          const u = gxf - gx, u1 = 1 - u;
          const x = wx0 + (px + 0.5) * inv;
          const o00 = (gy * nn + gx) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF;
          const w00 = u1 * v1, w10 = u * v1, w01 = u1 * v, w11 = u * v;
          const tone = F[o00 + 4] * w00 + F[o10 + 4] * w10 + F[o01 + 4] * w01 + F[o11 + 4] * w11;
          const lwn = F[o00 + 5] * w00 + F[o10 + 5] * w10 + F[o01 + 5] * w01 + F[o11 + 5] * w11;
          const yel = F[o00 + 6] * w00 + F[o10 + 6] * w10 + F[o01 + 6] * w01 + F[o11 + 6] * w11;
          const hw = 0.42 + 0.62 * lwn;
          const sto = (gy * nc + gx) * 4;
          let m = 0, ink = 0, dEdge = 99;
          for (let L = 3; L >= 0; L--) {
            const s = ST[sto + L];
            if (s === 0) continue;
            if (s === 2) { m = L + 1; break; }
            const A = F[o00 + L], Bv = F[o10 + L], Cc = F[o01 + L], D = F[o11 + L];
            const sv = A * w00 + Bv * w10 + Cc * w01 + D * w11;
            const du = (Bv - A) * v1 + (D - Cc) * v, dv = (Cc - A) * u1 + (D - Bv) * u;
            const gl = Math.sqrt(du * du + dv * dv) / GSTEP;
            const dist = gl > 1e-9 ? sv / gl : sv > 0 ? 99 : -99;
            let ic = (hw - (dist < 0 ? -dist : dist)) * res + 0.5;
            if (ic > 0) { if (ic > 1) ic = 1; if (ic > ink) ink = ic; }
            if (dist > 0) { m = L + 1; dEdge = dist; break; }
          }
          const M = MATS[m];
          let r = M.p[0] * yel, g = M.p[1] * yel, b = M.p[2] * yel;
          const sc = M.sc;
          for (let i = 0; i < sc.length; i++) {
            const q = sc[i];
            const su = (x * q.ca + y * q.sa) * q.inv, sv2 = (y * q.ca - x * q.sa) * q.inv;
            const fu = su - Math.floor(su) - 0.5, fv = sv2 - Math.floor(sv2) - 0.5;
            const d = Math.sqrt(fu * fu + fv * fv) * q.sp;
            const rad = q.sp * (q.r0 + (q.r1 - q.r0) * tone);
            let cov = (rad - d) * res + 0.5;
            if (cov > 0) {
              if (cov > 1) cov = 1;
              r *= 1 - cov * q.f[0]; g *= 1 - cov * q.f[1]; b *= 1 - cov * q.f[2];
            }
          }
          if (M.hatch && dEdge < 14) {
            const hn = F[o00 + 7] * w00 + F[o10 + 7] * w10 + F[o01 + 7] * w01 + F[o11 + 7] * w11;
            const hl = 1.5 + 9 * hn * hn;
            const e = dEdge - hw;
            if (e < hl) {
              const taper = 1 - (e > 0 ? e : 0) / hl;
              const f = (x - y) * 0.7071 / 1.7;
              const dd = Math.abs(f - Math.floor(f) - 0.5) * 1.7;
              let hc = (0.34 * taper - dd) * res + 0.5;
              if (hc > 0) { if (hc > 1) hc = 1; if (hc > ink) ink = hc; }
            }
          }
          const gr = GR[grow | ((px + gOffX) & 255)];
          r *= gr; g *= gr; b *= gr;
          if (ink > 0) { r += (INKA[0] - r) * ink; g += (INKA[1] - g) * ink; b += (INKA[2] - b) * ink; }
          buf[py * Wp + px] = pack(r, g, b);
        }
      }
      for (let y0 = 0; y0 < Wp; y0 += 128) { ctx.putImageData(img, 0, 0, 0, y0, Wp, Math.min(128, Wp - y0)); yield; }
      yield* decals(ctx, info);
    },

    propsForChunk(info) {
      const out = [];
      G.scatterOwned(info, 88, 5151, (x, y, rng) => {
        if (G.nearSpawn(x, y, 95)) return;
        const r = rng.next(), vr = rng.next();
        const m = matSafe(x, y, 10);
        if (m < 0) return;
        let t = null, v = 0;
        if (m === 0) {
          if (r < 0.12) t = 'tree';
          else if (r < 0.22) t = 'bush';
          else if (r < 0.27) { t = 'rock'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.31) t = 'fence';
          else if (r < 0.33) t = 'sign';
        } else if (m === 1) {
          if (r < 0.12) { t = 'pump'; v = vr < 0.6 ? 0 : 1; }
          else if (r < 0.17) t = 'crow';
          else if (r < 0.24) t = 'hay';
          else if (r < 0.3) { t = 'tree'; v = 1; }
          else if (r < 0.33) t = 'fence';
        } else if (m === 2) {
          if (r < 0.1) t = 'dtree';
          else if (r < 0.16) { t = 'rock'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.2) { t = 'grave'; v = 2; }
          else if (r < 0.23) { t = 'pump'; v = 1; }
        } else if (m === 3) {
          if (r < 0.26) { t = 'grave'; v = (vr * 3) | 0; }
          else if (r < 0.34) t = 'dtree';
          else if (r < 0.38) t = 'fence';
        } else {
          if (r < 0.05) t = 'sign';
          else if (r < 0.08) { t = 'rock'; v = 1; }
        }
        if (!t) return;
        out.push({ x, y, t, v, f: rng.chance(0.5), sw: rng.next() * TAU, pad: t === 'tree' || t === 'dtree' || t === 'crow' ? 70 : 30 });
      });
      return out;
    },

    drawProp(ctx, p, view) {
      const s = SPR.props[p.t][p.v];
      const spr = p.f ? s.l : s.n;
      if (p.t === 'tree') {
        const V = tf(view);
        const k = Math.sin(view.rt * 1.2 + p.sw) * 0.02;
        const S = V.S;
        ctx.setTransform(S, 0, -k * S, S, V.ox + p.x * S, V.oy + p.y * S);
        const q = 1 / K;
        ctx.drawImage(spr.c, -spr.ox * q, -spr.oy * q, spr.c.width * q, spr.c.height * q);
        ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
      } else blit(ctx, spr, p.x, p.y, 1, 1);
    },

    drawShadow(ctx, o, view) {
      let rx, x = o.x, y = o.y, a = 0.55;
      if (o.kind === 'prop') { rx = PROP_DEF[o.t].sh[0]; if (!rx) return; }
      else if (o.kind === 'enemy') {
        let k = 1;
        if (o.dying) { if (o.deathT > 0.4) return; k = 1 - o.deathT / 0.4; }
        if (o.spawnT < 1) k *= U.clamp(o.spawnT * 2.5 - 0.3, 0, 1);
        if (k <= 0.02) return;
        rx = (o.type === 'ghost' ? 6 : o.type === 'colossus' ? 19 : 8.4) * k;
        if (o.type === 'ghost') a = 0.35;
      } else {
        rx = 9.4; a = 0.65;
      }
      const sc = rx / 9.6;
      ctx.globalAlpha = a;
      blit(ctx, SPR.shadow, x, y + 0.4, sc, sc);
      ctx.globalAlpha = 1;
    },

    drawGroundOverlay(ctx, view, game) {
      // action-burst "panels" where enemies burst out of the ground
      for (const e of game.enemies) {
        if (e.dying || e.spawnT >= 1) { e._popd = false; continue; }
        if (e.x < view.x0 - 40 || e.x > view.x1 + 40 || e.y < view.y0 - 20 || e.y > view.y1 + 60) continue;
        const ghost = e.type === 'ghost';
        if (!e._popd && game.state === 'play') {
          e._popd = true;
          if (!ghost) {
            const n = e.type === 'colossus' ? 6 : 3;
            for (let i = 0; i < n; i++) {
              const a = Math.random() * TAU;
              game.addParticle({ kind: 'ink', x: e.x, y: e.y, z: 1, vx: Math.cos(a) * 34, vy: Math.sin(a) * 16, vz: 50 + Math.random() * 50, grav: 260, drag: 1, life: 0.5, size: 0.5 + Math.random() * 0.4 });
            }
          }
        }
        const t = e.spawnT;
        const a = t < 0.2 ? U.ease.outBack(t / 0.2) : t > 0.65 ? Math.max(0, 1 - (t - 0.65) / 0.35) : 1;
        if (a <= 0.01) continue;
        const s = (e.type === 'colossus' ? 1.5 : ghost ? 0.6 : 0.85) * a;
        ctx.globalAlpha = ghost ? 0.5 : 1;
        blit(ctx, SPR.spawn, e.x, e.y + 0.5, s, s * 0.45);
        ctx.globalAlpha = 1;
      }
      // Jack's lantern light: a halo of yellow halftone dots on the paper
      const p = game.player;
      ctx.globalAlpha = 0.8;
      blit(ctx, SPR.glow, p.x, p.y + 1, 1.5, 0.62);
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      const s = g.big ? SPR.gemB : SPR.gemS;
      let h = 1.4 + Math.sin(view.rt * 5 + g.seed * 20) * 1.0;
      let sc = 1;
      if (g.pop > 0) { const q = 1 - g.pop; h += Math.sin(q * PI) * 10; sc = 0.4 + 0.6 * U.ease.outBack(Math.min(1, q * 1.4)); }
      ctx.globalAlpha = 0.5;
      blit(ctx, SPR.shadow, g.x, g.y, g.big ? 0.42 : 0.28, g.big ? 0.42 : 0.28);
      ctx.globalAlpha = 1;
      blit(ctx, s, g.x, g.y - h, sc, sc);
    },

    drawEnemy(ctx, e, view) {
      const V = tf(view);
      let set, rot = 0, sx = 1, sy = 1, y = e.y, alpha = 1;
      let scl = 0.94 + e.seed * 0.12;
      let cap = 0.9;
      if (e.type === 'creeper') {
        const ph = e.anim * 0.85 + e.seed;
        const f = Math.floor(ph * 4) & 3;
        set = SPR.creep[e.seed < 0.55 ? 0 : 1][f];
        scl *= CREEP_SCALE;
        const sn = Math.sin(ph * TAU);
        rot = sn * 0.09;
        const up = Math.abs(sn);
        y -= up * 1.2;
        sx = 1 + (1 - up) * 0.05; sy = 1 - (1 - up) * 0.05 + up * 0.03;
      } else if (e.type === 'ghost') {
        const f = Math.floor(view.rt * 7 + e.seed * 4) & 3;
        set = SPR.ghost[f];
        y -= 4.5 + Math.sin(view.rt * 2.6 + e.seed * 12) * 1.6;
        rot = U.clamp(e.vx / 64, -1, 1) * 0.14;
        alpha = 0.94;
      } else {
        const ph = e.anim * 0.32 + e.seed;
        const f = Math.floor(ph * 4) & 3;
        set = SPR.colo[f];
        const sn = Math.sin(ph * TAU), up = Math.abs(sn), contact = Math.pow(1 - up, 3);
        y -= up * 2.0;
        sx = 1 + contact * 0.07; sy = 1 - contact * 0.07;
        rot = sn * 0.03;
        cap = 0.6;
      }
      sx *= scl; sy *= scl;
      const left = e.facing < 0;
      if (e.spawnT < 1) {
        if (e.type === 'ghost') {
          const q = U.clamp(e.spawnT / 0.8, 0, 1);
          alpha *= q;
          const p = U.ease.outBack(q); sx *= p; sy *= p;
        } else {
          const q = U.clamp((e.spawnT - 0.12) / 0.88, 0, 1);
          if (q <= 0) return;
          const p = U.ease.outElastic(q);
          sy *= p; sx *= p > 0.05 ? U.clamp(1 / Math.sqrt(p), 0.75, 1.5) : 1.5;
          rot *= q;
        }
      }
      if (e.dying) {
        // impact frame: inflate in yellow, then gone (the explosion burst takes over)
        const q = e.deathT;
        if (q >= 0.42) return;
        const k = q < 0.2 ? 1 + U.ease.outQuad(q / 0.2) * 0.25 : 1.25 * (1 - U.ease.inQuad((q - 0.2) / 0.22));
        ctx.globalAlpha = alpha;
        const s = left ? set.fl : set.f;
        blitRot(ctx, V, s, e.x, y, sx * k, sy * k, rot + (q - 0.2) * 0.6);
        ctx.globalAlpha = 1;
        return;
      }
      const fl = e.flash;
      if (fl > 0) { sx *= 1 + 0.18 * fl; sy *= 1 - 0.14 * fl; }
      ctx.globalAlpha = alpha;
      const s = left ? set.nl : set.n;
      if (rot) blitRot(ctx, V, s, e.x, y, sx, sy, rot); else blit(ctx, s, e.x, y, sx, sy);
      if (fl > 0.02) {
        ctx.globalAlpha = Math.min(cap, fl * 1.4) * alpha;
        const f2 = left ? set.fl : set.f;
        if (rot) blitRot(ctx, V, f2, e.x, y, sx, sy, rot); else blit(ctx, f2, e.x, y, sx, sy);
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      const V = tf(view), game = view.game;
      let frame = 0, sx = 1, sy = 1, lift = 0, rot = 0;
      if (p.moving) {
        const ph = p.anim * 0.4;
        const step = Math.floor(ph * 4);
        const seq = [1, 2, 3, 2];
        frame = seq[step & 3];
        const f = ph * 2 - Math.floor(ph * 2);
        lift = Math.sin(f * PI) * 1.8;
        rot = 0.05 * p.facing * Math.sin(f * PI);
        if ((step & 1) === 0 && step !== lastStep) {
          lastStep = step;
          if (game && game.state === 'play' && p.dashT <= 0 && Math.random() < 0.5) puff(game, p.x - p.facing * 4, p.y + 0.5, 1, 0.3, -p.vx * 0.12, -p.vy * 0.12, 0.3);
        }
      } else {
        const b = Math.sin(view.rt * 3.2);
        sy = 1 + 0.025 * b; sx = 1 - 0.018 * b;
      }
      if (p.shootT > 0) { sy *= 1 - 0.05 * p.shootT; sx *= 1 + 0.04 * p.shootT; }
      if (p.levelT > 0) { const w = Math.sin(p.levelT * PI * 4) * p.levelT; sy *= 1 + 0.16 * w; sx *= 1 - 0.1 * w; }
      const hurt = p.hurtT > 0;
      if (hurt) { sx *= 1 + 0.14 * p.hurtT; sy *= 1 - 0.12 * p.hurtT; }
      sx *= JACK_SCALE; sy *= JACK_SCALE; lift *= JACK_SCALE;
      const left = p.facing < 0;
      const set = SPR.jack[frame];
      if (p.dashT > 0) {
        // dash smear: misregistered cyan / magenta colour-plate copies + speed lines
        const k = U.clamp(p.dashT / 0.2, 0, 1);
        const pl = SPR.jackPlate[frame];
        const kk = 1 / K;
        for (let i = 2; i >= 1; i--) {
          const img = (left ? pl.cl : pl.c)[i - 1];
          const ox = left ? pl.oxl : pl.ox;
          ctx.globalAlpha = 0.6 * k;
          const x = p.x - p.dashX * i * 6, y = p.y - p.dashY * i * 6 - lift;
          ctx.drawImage(img, x - ox * kk * sx, y - pl.oy * kk * sy, img.width * kk * sx, img.height * kk * sy);
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = INK; ctx.lineWidth = 0.7; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const off = (i - 1.5) * 4.5, nx = -p.dashY, ny = p.dashX;
          const x0 = p.x + nx * off - p.dashX * 6, y0 = p.y - 12 + ny * off - p.dashY * 6;
          const len = (16 + (i % 2) * 8) * k;
          ctx.moveTo(x0, y0); ctx.lineTo(x0 - p.dashX * len, y0 - p.dashY * len);
        }
        ctx.stroke();
      }
      let a = 1;
      if (p.iframes > 0 && !hurt && p.dashT <= 0 && (Math.floor(view.rt * 16) & 1)) a = 0.45;
      ctx.globalAlpha = a;
      blitRot(ctx, V, left ? set.nl : set.n, p.x, p.y - lift, sx, sy, rot);
      if (hurt) {
        ctx.globalAlpha = Math.min(0.9, p.hurtT * 1.4);
        blitRot(ctx, V, left ? set.fl : set.f, p.x, p.y - lift, sx, sy, rot);
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view);
      const bob = Math.sin(view.rt * 4 + o.idx * 1.7) * 1.4;
      ctx.globalAlpha = 0.45;
      blit(ctx, SPR.shadow, o.x, o.y + 4, 0.55, 0.55);
      const y = o.y - 3 + bob;
      ctx.globalAlpha = 0.75 + 0.15 * Math.sin(view.rt * 9 + o.idx * 2.1);
      blit(ctx, SPR.glow, o.x, y - 7, 0.8, 0.8);
      ctx.globalAlpha = 1;
      blitRot(ctx, V, SPR.lantern, o.x, y, 1, 1, Math.sin(view.rt * 3 + o.idx) * 0.14);
    },

    drawProjectile(ctx, pr, view) {
      const V = tf(view);
      ctx.globalAlpha = 0.4;
      blit(ctx, SPR.shadow, pr.x, pr.y + 6, 0.25, 0.25);
      ctx.globalAlpha = Math.min(1, pr.age * 14) * 0.85;
      blitRot(ctx, V, SPR.streak, pr.x, pr.y, 1, 1, pr.angle);
      ctx.globalAlpha = 1;
      const sq = 0.6 + 0.4 * Math.abs(Math.cos(pr.spin));
      blitRot(ctx, V, SPR.seed, pr.x, pr.y, 1, sq, pr.angle);
    },

    drawParticle(ctx, pt, view) {
      const V = tf(view);
      const t = 1 - pt.life / pt.max;
      const z = pt.z;
      switch (pt.kind) {
        case 'boom': {
          const sc = (t < 0.16 ? U.ease.outBack(t / 0.16) : 1 + (t - 0.16) * 0.35) * pt.size;
          ctx.globalAlpha = t > 0.6 ? Math.max(0, 1 - (t - 0.6) / 0.4) : 1;
          blitRot(ctx, V, SPR.boom[pt.tint || 0], pt.x, pt.y - z, sc, sc, pt.rot + t * 0.5);
          ctx.globalAlpha = 1;
          return;
        }
        case 'impact': {
          const sc = (t < 0.3 ? 0.5 + (t / 0.3) * 0.7 : 1.2 - ((t - 0.3) / 0.7) * 0.9) * pt.size;
          blitRot(ctx, V, SPR.impact, pt.x, pt.y - z, sc, sc, pt.rot);
          return;
        }
        case 'lines':
        case 'ring': {
          const ring = pt.kind === 'ring';
          const n = ring ? 16 : 7;
          const r0 = pt.size * ((ring ? 8 : 4.5) + (ring ? 30 : 9) * U.ease.outQuad(t));
          const len = pt.size * (ring ? 10 : 5.5) * (1 - t);
          if (len <= 0.2) return;
          const w = pt.size * (ring ? 1.3 : 0.75) * (1 - t * 0.5);
          ctx.fillStyle = ring && pt.color ? pt.color : INK;
          ctx.beginPath();
          const cy = pt.y - z;
          for (let i = 0; i < n; i++) {
            const a = pt.rot + (i / n) * TAU + (((i * 7) % 5) - 2) * 0.05;
            const co = Math.cos(a), si = Math.sin(a) * (ring ? 0.55 : 1);
            const l = len * (0.7 + ((i * 13) % 7) / 14);
            const x0 = pt.x + co * r0, y0 = cy + si * r0, x1 = pt.x + co * (r0 + l), y1 = cy + si * (r0 + l);
            const nx = -si * w * 0.5, ny = co * w * 0.5;
            ctx.moveTo(x0, y0); ctx.lineTo(x1 + nx, y1 + ny); ctx.lineTo(x1 - nx, y1 - ny); ctx.closePath();
          }
          ctx.fill();
          if (ring) { ctx.strokeStyle = INK; ctx.lineWidth = 0.35; ctx.stroke(); }
          return;
        }
        case 'chunk': {
          const sc = pt.size * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1);
          if (sc <= 0.01) return;
          blitRot(ctx, V, SPR.chunk[pt.spr || 0], pt.x, pt.y - z, sc, sc, pt.rot);
          return;
        }
        case 'ink': {
          const r = pt.size * 1.2 * (t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1);
          if (r <= 0.05) return;
          ctx.fillStyle = pt.color || INK;
          ctx.beginPath(); ctx.arc(pt.x, pt.y - z, r, 0, TAU); ctx.fill();
          return;
        }
        case 'word': {
          const spr = wordSprite(pt.word, pt.tint || 0, view.rt);
          let sc = t < 0.14 ? U.ease.outBack(t / 0.14) : 1 + (t - 0.14) * 0.12;
          if (t > 0.78) sc *= 1 - ((t - 0.78) / 0.22) * 0.5;
          ctx.globalAlpha = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.2) : 1;
          sc *= pt.size;
          blitRot(ctx, V, spr, pt.x, pt.y - z - t * 6, sc, sc, pt.rot);
          ctx.globalAlpha = 1;
          return;
        }
        case 'puff': {
          const sc = pt.size * (t < 0.2 ? U.ease.outBack(t / 0.2) : 1 - Math.pow((t - 0.2) / 0.8, 2));
          if (sc <= 0.01) return;
          blitRot(ctx, V, SPR.puff, pt.x, pt.y - z - t * 3, sc, sc, pt.rot * 0.3);
          return;
        }
        case 'twinkle': {
          const sc = pt.size * (t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7);
          if (sc <= 0.01) return;
          blitRot(ctx, V, SPR.twinkle, pt.x, pt.y - z, sc, sc, t * 2);
          return;
        }
        default: {
          const a = U.clamp(pt.life / pt.max, 0, 1);
          ctx.globalAlpha = a; ctx.fillStyle = pt.color || '#fff';
          ctx.beginPath(); ctx.arc(pt.x, pt.y - z, (pt.size || 2) * 0.5, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
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

    drawScreenOverlay(ctx, view) {
      if (!OV || OV.W !== view.W || OV.H !== view.H) OV = buildOverlay(view.W, view.H);
      for (const t of OV.tiles) ctx.drawImage(OV.c, t[0], t[1], t[2], t[3], t[0], t[1], t[2], t[3]);
    },

    drawIcon(ctx, id, size) {
      const fn = ICONS[id] || ICONS.dmg;
      const { c, ctx: tc } = U.canvas(size, size);
      tc.scale(size / 48, size / 48);
      tc.lineJoin = 'round'; tc.lineCap = 'round';
      fn(iconPainter(tc, size));
      misreg(c, id === 'hp-heart' || id === 'hp' ? C.cyan : C.mag, 0.7, size / 48 * 1.4);
      ctx.drawImage(c, 0, 0);
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e) {
      const h = e.type === 'colossus' ? 24 : e.type === 'ghost' ? 14 : 11;
      const x = e.x + (Math.random() - 0.5) * 5, z = h + (Math.random() - 0.5) * 5;
      game.addParticle({ kind: 'impact', x, y: e.y + 0.5, z, life: 0.16, size: e.type === 'colossus' ? 1.0 : 0.7, rot: Math.random() * TAU, drag: 0 });
      if (Math.random() < 0.45) game.addParticle({ kind: 'lines', x, y: e.y + 0.5, z, life: 0.2, size: e.type === 'colossus' ? 1.4 : 1, rot: Math.random() * TAU, drag: 0 });
    },
    onKill(game, e) {
      const x = e.x, y = e.y + 0.6, T = e.type;
      const big = T === 'colossus', ghost = T === 'ghost';
      const h = big ? 24 : ghost ? 13 : 11;
      const tint = ghost ? 1 : big ? 3 : 0;
      game.addParticle({ kind: 'boom', tint, x, y, z: h, life: big ? 0.5 : 0.34, size: big ? 1.9 : ghost ? 0.8 : 0.95, rot: Math.random() * TAU, drag: 0 });
      let cols;
      if (big) cols = [4, 5, 2, 7, 4, 5];
      else if (ghost) cols = [3, 3];
      else cols = e.seed < 0.55 ? [0, 1, 2, 0] : [8, 1, 2, 8];
      const nC = big ? 9 : ghost ? 2 : 4;
      for (let i = 0; i < nC; i++) {
        const a = Math.random() * TAU, sp = 35 + Math.random() * 45;
        game.addParticle({ kind: 'chunk', spr: cols[i % cols.length], x, y, z: h * 0.7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 60, grav: 280, drag: 1.2, life: 0.75 + Math.random() * 0.3, size: (big ? 1.3 : 0.95) * (0.8 + Math.random() * 0.5), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14 });
      }
      const nI = big ? 6 : 2;
      for (let i = 0; i < nI; i++) {
        const a = Math.random() * TAU, sp = 40 + Math.random() * 50;
        game.addParticle({ kind: 'ink', color: ghost ? C.cyan : undefined, x, y, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 40 + Math.random() * 40, grav: 240, drag: 1.5, life: 0.5, size: 0.5 + Math.random() * 0.4 });
      }
      if (game.time < lastWordT) lastWordT = -9;
      if (big) {
        game.addParticle({ kind: 'ring', x, y, z: 0, life: 0.4, size: 1.0, rot: Math.random(), drag: 0 });
        addWord(game, x, y, h + 30, BIG_WORDS[(Math.random() * BIG_WORDS.length) | 0], 1, true);
        lastWordT = game.time;
      } else if (game.time - lastWordT > 1.3 && Math.random() < 0.3) {
        lastWordT = game.time;
        addWord(game, x + (Math.random() - 0.5) * 10, y, h + 24, WORDS[(Math.random() * WORDS.length) | 0], ghost ? 2 : Math.random() < 0.75 ? 0 : 3, false);
      }
    },
    onHurt(game, p) {
      game.addParticle({ kind: 'impact', x: p.x, y: p.y + 0.5, z: 16, life: 0.2, size: 1.2, rot: Math.random() * TAU, drag: 0 });
      game.addParticle({ kind: 'lines', x: p.x, y: p.y + 0.5, z: 16, life: 0.25, size: 1.6, rot: Math.random() * TAU, drag: 0 });
      if (game.time < lastHurtWordT) lastHurtWordT = -9;
      if (game.time - lastHurtWordT > 2.2) { lastHurtWordT = game.time; addWord(game, p.x + 8, p.y, 38, 'AUTSCH!', 3, false); }
    },
    onPickup(game, g) {
      const p = game.player;
      if (Math.random() < (g.big ? 1 : 0.4)) game.addParticle({ kind: 'twinkle', x: p.x + (Math.random() - 0.5) * 12, y: p.y + 0.5, z: 8 + Math.random() * 16, life: 0.3, size: g.big ? 1.0 : 0.6, drag: 0 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.25) puff(game, pr.x, pr.y + 4, 3, 0.22, pr.vx * 0.05, pr.vy * 0.05, 0.18);
    },
    onDash(game, p) {
      for (let i = 0; i < 3; i++) puff(game, p.x - p.dashX * i * 4 + (Math.random() - 0.5) * 4, p.y + 0.5 - p.dashY * i * 4, 1.5, 0.45 + Math.random() * 0.2, -p.dashX * 20, -p.dashY * 20, 0.35);
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'ring', x: p.x, y: p.y, z: 0, life: 0.6, size: 1.4, rot: 0.1, drag: 0, color: C.yellow });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU, sp = 60 + Math.random() * 30;
        game.addParticle({ kind: 'twinkle', x: p.x, y: p.y + 0.5, z: 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 60, grav: 140, drag: 2.0, life: 0.8, size: 1.0 });
      }
    },
    onDeath(game, p) {
      game.addParticle({ kind: 'boom', tint: 2, x: p.x, y: p.y + 0.5, z: 14, life: 0.7, size: 2.2, rot: 0, drag: 0 });
      addWord(game, p.x, p.y, 44, 'AUWEIA!', 1, true);
    },
  });
})();
