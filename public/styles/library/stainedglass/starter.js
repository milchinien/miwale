/* Cathedral Glass — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2, PI = Math.PI;
  const PALETTE = {
    lead: '#17131c', leadRidge: '#544e60', gold: '#d9ad4e', warmLight: '#fffae8',
    meadow: ['#2a6e48', '#327a4e', '#265f44', '#3a8250', '#2a7058', '#2f6c40'],
    meadowAlt: ['#55702f', '#5f7a33', '#4c652b', '#687f38', '#59702d'],
    leafCarpet: ['#8e2a3c', '#a23a4e', '#7c2234', '#ad4c38', '#963046', '#a35c2c', '#b0405a'],
    nightGlass: ['#28388a', '#304296', '#3a2e86', '#46348e', '#243478', '#2c4e90', '#383a92'],
    pathLane: ['#a8742e', '#b07c33', '#9c6a2a', '#b5813a'], pathMid: ['#c28a38', '#cf9a44', '#b98034', '#d4a24c'],
    pumpkin: ['#e2681a', '#ff8a22', '#ffa63c', '#ff8a22', '#e2681a'], face: '#ffd23a',
    cloak: ['#1f5a34', '#2a6e40', '#184a2c', '#2f7a3c', '#22603e'], scarf: ['#c4283e', '#a51d34', '#d8404e'],
    hem: '#f2c040', boot: ['#4a2f22', '#5d3b29'], stem: '#4f7c2c', leaf: ['#5fa83c', '#3f8a32', '#78bf4a'],
    creepTop: [['#7a3fae', '#9351c8', '#6a3298'], ['#a8378c', '#c24ca2', '#8e2c76'], ['#5a48b8', '#7060d0', '#4a3a9e']],
    cream: ['#f4e2b4', '#e8cc90'], root: ['#e6cf9a', '#cfae72'], ember: '#ff5a26',
    opal: ['#f0f5ff', '#dde8fb', '#f6ecfb', '#e0f3f4', '#e9e9fb', '#fbf6ec'], hollow: '#1e2452',
    brown: ['#6b4a32', '#7e5a3c', '#5a3b2a', '#8a6440', '#644530'], violet: ['#5e3a7a', '#704690', '#52306a', '#7c5098'],
    ruby: ['#e3203c', '#ff4a5a', '#b8142e', '#ff7080'], gem: ['#8ff6ea', '#3ac6c6', '#c4fff6', '#279fb0'],
  };
  const LEAD = PALETTE.lead, WARM = [255, 250, 232];

  // ---------- tiny helpers (seeded random, hashing, colour maths, gradient noise)
  function mulberry32(a) { a >>>= 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hashInt(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; }
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mul = (c, f) => [cl(c[0] * f, 0, 255), cl(c[1] * f, 0, 255), cl(c[2] * f, 0, 255)];
  const rgb = (c, a) => (a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
  const sstep = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function perlin(x, y, seed) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const f = (t) => t * t * t * (t * (t * 6 - 15) + 10), u = f(fx), v = f(fy);
    const g = (ix, iy, dx, dy) => { const a = ((hashInt(ix, iy, seed) & 15) / 16) * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
    const a = g(x0, y0, fx, fy) + u * (g(x0 + 1, y0, fx - 1, fy) - g(x0, y0, fx, fy));
    const b = g(x0, y0 + 1, fx, fy - 1) + u * (g(x0 + 1, y0 + 1, fx - 1, fy - 1) - g(x0, y0 + 1, fx, fy - 1));
    return (a + v * (b - a)) * 1.414;
  }
  function fbm(x, y, seed, oct) { let a = 1, f = 1, s = 0, n = 0; for (let i = 0; i < oct; i++) { s += a * perlin(x * f, y * f, seed + i * 101); n += a; a *= 0.5; f *= 2; } return cl((s / n) * 0.5 + 0.5, 0, 1); }

  // ---------- geometry: BSP mosaic, shapes as path functions
  function splitPoly(poly, px, py, nx, ny) {
    const a = [], b = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const dp = (p[0] - px) * nx + (p[1] - py) * ny, dq = (q[0] - px) * nx + (q[1] - py) * ny;
      (dp >= 0 ? a : b).push(p);
      if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq), m = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; a.push(m); b.push(m); }
    }
    return [a, b];
  }
  const polyArea = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
  function polyInfo(p) { let cx = 0, cy = 0, r = 0; for (const q of p) { cx += q[0]; cy += q[1]; } cx /= p.length; cy /= p.length; for (const q of p) r = Math.max(r, Math.hypot(q[0] - cx, q[1] - cy)); return { cx, cy, r: r * 0.85 }; }
  /** Recursively cut a polygon with jittered lines until every piece is <= maxArea (world units²). */
  function bsp(poly, maxArea, rnd, out, depth) {
    if (polyArea(poly) <= maxArea || depth > 9) { out.push(poly); return; }
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, cx = 0, cy = 0;
    for (const q of poly) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); cx += q[0]; cy += q[1]; }
    cx /= poly.length; cy /= poly.length;
    const ang = (x1 - x0 > y1 - y0 ? 0 : PI / 2) + (rnd() - 0.5) * 1.2, nx = Math.cos(ang), ny = Math.sin(ang), ext = Math.max(x1 - x0, y1 - y0);
    const [a, b] = splitPoly(poly, cx + nx * (rnd() - 0.5) * 0.35 * ext, cy + ny * (rnd() - 0.5) * 0.35 * ext, nx, ny);
    if (a.length < 3 || b.length < 3) { out.push(poly); return; }
    bsp(a, maxArea, rnd, out, depth + 1); bsp(b, maxArea, rnd, out, depth + 1);
  }
  function mosaic(poly, maxArea, seed, colFn) {
    const rnd = mulberry32(seed), out = []; bsp(poly, maxArea, rnd, out, 0);
    return out.map((p, i) => { const f = polyInfo(p); return { poly: p, cx: f.cx, cy: f.cy, r: f.r, col: colFn(f.cx, f.cy, i, rnd) }; });
  }
  const rectPoly = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const ellPoly = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * rx * 1.1, cy + Math.sin(i / n * TAU) * ry * 1.1]);
  function polyPath(c, p) { c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); }
  const PP = (p) => (c) => polyPath(c, p);
  const ELL = (x, y, rx, ry, rot) => (c) => { c.moveTo(x + rx * Math.cos(rot || 0), y + rx * Math.sin(rot || 0)); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };
  const CAP = (x1, y1, x2, y2, r1, r2) => (c) => { const a = Math.atan2(y2 - y1, x2 - x1); c.moveTo(x1 + Math.cos(a + PI / 2) * r1, y1 + Math.sin(a + PI / 2) * r1); c.arc(x1, y1, r1, a + PI / 2, a + PI * 1.5); c.arc(x2, y2, r2, a - PI / 2, a + PI / 2); c.closePath(); };
  function leafPts(bx, by, ang, len, wid) {
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx, mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
    return { bx, by, tx: bx + dx * len, ty: by + dy * len, ax: mx + px * wid * 1.3, ay: my + py * wid * 1.3, cx2: mx - px * wid * 1.3, cy2: my - py * wid * 1.3, mx, my };
  }
  const leafShape = (L) => (c) => { c.moveTo(L.bx, L.by); c.quadraticCurveTo(L.ax, L.ay, L.tx, L.ty); c.quadraticCurveTo(L.cx2, L.cy2, L.bx, L.by); c.closePath(); };
  /** A leaf = two half pieces split along the midrib (the midrib becomes a lead line). */
  function leafCells(L, c1, c2) {
    const r = Math.hypot(L.tx - L.bx, L.ty - L.by) * 0.45;
    return [{ path: (c) => { c.moveTo(L.bx, L.by); c.quadraticCurveTo(L.ax, L.ay, L.tx, L.ty); c.closePath(); }, col: c1, cx: (L.mx * 2 + L.ax) / 3, cy: (L.my * 2 + L.ay) / 3, r },
      { path: (c) => { c.moveTo(L.bx, L.by); c.quadraticCurveTo(L.cx2, L.cy2, L.tx, L.ty); c.closePath(); }, col: c2, cx: (L.mx * 2 + L.cx2) / 3, cy: (L.my * 2 + L.cy2) / 3, r }];
  }
  /** Pumpkin ribs: vertical lens-shaped pieces of an ellipse, boundaries fs in -1..1. */
  function ribCells(cx, cy, rx, ry, fs, cols) {
    const cells = [];
    for (let i = 0; i < fs.length - 1; i++) {
      const a = fs[i], b = fs[i + 1]; let path;
      if (a < 0 && b > 0) { const o = Math.max(-a, b); path = (c) => { c.moveTo(cx + rx * o, cy); c.ellipse(cx, cy, rx * o, ry, 0, 0, TAU); }; }
      else if (b <= 0) { const o = -a, n = Math.max(0.01, -b); path = (c) => { c.moveTo(cx, cy - ry); c.ellipse(cx, cy, rx * o, ry, 0, -PI / 2, PI / 2, true); c.ellipse(cx, cy, rx * n, ry, 0, PI / 2, -PI / 2, false); c.closePath(); }; }
      else { const n = Math.max(0.01, a), o = b; path = (c) => { c.moveTo(cx, cy - ry); c.ellipse(cx, cy, rx * o, ry, 0, -PI / 2, PI / 2, false); c.ellipse(cx, cy, rx * n, ry, 0, PI / 2, -PI / 2, true); c.closePath(); }; }
      cells.push({ path, col: cols[i % cols.length], cx: cx + rx * (Math.max(-1, a) + Math.min(1, b)) / 2, cy: cy - ry * 0.1, r: Math.max(rx * (b - a) * 0.75, ry * 0.95) });
    }
    return cells;
  }

  // ---------- the Painter: every figure is drawn twice. 'outline' = all parts filled+stroked in lead
  // (one fat outer came), then 'fill' or 'flash' = glass pieces clipped into each part + inner lead.
  function Painter(ctx, mode, seed) { this.ctx = ctx; this.mode = mode; this.ol = 0.95; this.il = 0.55; this.rnd = mulberry32(seed); }
  Painter.prototype.part = function (shape, cells, o) {
    o = o || {}; const c = this.ctx;
    if (this.mode === 'outline') { c.beginPath(); shape(c); c.lineWidth = (o.ol != null ? o.ol : this.ol) * 2; c.strokeStyle = c.fillStyle = LEAD; c.stroke(); c.fill(); return; }
    c.save(); c.beginPath(); shape(c); c.clip(); for (const cell of cells) this.glass(cell, o); c.restore();
    c.beginPath(); shape(c); c.lineWidth = this.il * 1.2; c.strokeStyle = LEAD; c.stroke();
  };
  Painter.prototype.piece = function (shape, col, cx, cy, r, o) { o = o || {}; this.part(shape, [{ path: shape, col, cx, cy, r, glow: o.glow }], o); };
  /** One glass piece: off-centre radial gradient (bright core, dark rim), 2 cathedral streaks, a glint, lead edge. */
  Painter.prototype.glass = function (cell, o) {
    const c = this.ctx, flash = this.mode === 'flash', glow = cell.glow || o.glow;
    let col = mul(hex(cell.col), 1 + (this.rnd() - 0.5) * (o.jitter != null ? o.jitter : 0.12));
    if (flash) col = mix(col, WARM, glow ? 0.4 : 0.58);
    const r = Math.max(0.6, cell.r), hi = glow ? mix(col, [255, 255, 236], 0.78) : mix(col, [255, 255, 255], 0.3), lo = mul(col, glow ? 0.9 : 0.64);
    const g = c.createRadialGradient(cell.cx - r * 0.25, cell.cy - r * 0.3, r * 0.05, cell.cx, cell.cy, r * 1.3);
    g.addColorStop(0, rgb(hi)); g.addColorStop(0.48, rgb(col)); g.addColorStop(1, rgb(lo));
    const path = () => { c.beginPath(); if (cell.poly) polyPath(c, cell.poly); else cell.path(c); };
    path(); c.fillStyle = g; c.fill();
    const rr = this.rnd(), ra = this.rnd();
    if (!glow && r > 1.4) {
      c.save(); c.clip();
      const a = ra * PI, dx = Math.cos(a), dy = Math.sin(a);
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = r * 0.16; c.beginPath();
      for (let k = -1; k <= 1; k += 2) { const ox = -dy * k * r * 0.35, oy = dx * k * r * 0.35; c.moveTo(cell.cx + ox - dx * r * 1.4, cell.cy + oy - dy * r * 1.4); c.quadraticCurveTo(cell.cx + ox + dy * r * 0.3, cell.cy + oy - dx * r * 0.3, cell.cx + ox + dx * r * 1.4, cell.cy + oy + dy * r * 1.4); }
      c.stroke();
      if (!o.noGlint && rr < 0.5 && r > 1.6) { c.fillStyle = flash ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(cell.cx - r * 0.38, cell.cy - r * 0.42, r * 0.26, r * 0.1, -0.7, 0, TAU); c.fill(); }
      c.restore(); path();
    }
    c.lineWidth = this.il; c.strokeStyle = LEAD; c.stroke();
  };
  /** Bake a figure into an offscreen canvas at K px per world unit; box = [x0,y0,x1,y1] around the feet (0,0). */
  function build(box, fn, mode, seed, K, post) {
    const c = document.createElement('canvas'); c.width = Math.ceil((box[2] - box[0]) * K); c.height = Math.ceil((box[3] - box[1]) * K);
    const x = c.getContext('2d'); x.lineJoin = x.lineCap = 'round'; x.scale(K, K); x.translate(-box[0], -box[1]);
    fn(new Painter(x, 'outline', seed)); fn(new Painter(x, mode, seed));
    if (post) post(x, box);
    return { c, box };
  }

  // ---------- figures (feet at 0,0, facing right, world units)
  function heroParts(P, fr) {
    const lo = [0, 2.2, 0, -2.2][fr], lift = [0, 0.8, 0, 0.8][fr];
    P.piece(CAP(3.2, -8, 3.4 - lo, -1.2, 2.1, 2.2), PALETTE.boot[1], 3.2 - lo * 0.5, -4.5, 3.2);
    P.piece(CAP(-3.2, -8, -3.4 + lo, -1.2 - lift, 2.1, 2.2), PALETTE.boot[0], -3.2 + lo * 0.5, -4.5, 3.2);
    const cloak = [[-4.6, -17.2], [4.6, -17.2], [8.8, -4.6], [5.4, -2.6], [0.4, -3.6], [-5, -2.6], [-8.8, -4.6]];
    P.part(PP(cloak), mosaic(cloak, 38, 7, (x, y, i) => PALETTE.cloak[i % 5]));
    const hem = [[-8.8, -4.6], [-5, -2.6], [0.4, -3.6], [5.4, -2.6], [8.8, -4.6], [8.2, -6.6], [5, -4.9], [0.4, -5.9], [-5, -4.9], [-8.2, -6.6]];
    P.part(PP(hem), [[-10, -2.2, '#f2c040'], [-2.2, 3, '#e0a830'], [3, 10, '#f2c040']].map(([a, b, col]) => ({ poly: rectPoly(a, -8, b, -1), col, cx: (a + b) / 2, cy: -4, r: 3 })), { ol: 0.5 });
    P.piece(ELL(0, -15.6, 1.5, 1.5), '#f2c040', 0, -15.6, 1.5, { glow: true });
    const tail = [[-6.2, -17.5], [-3.6, -17.8], [-4.4, -11.5], [-7.4, -12.4]];
    P.piece(PP(tail), PALETTE.scarf[1], -5.4, -14.8, 2.6);
    P.part(PP([[-6.4, -19.4], [6.4, -19.4], [6.8, -16.4], [-6.8, -16.4]]), [
      { poly: [[-7, -20], [-1.2, -20], [-0.4, -16], [-7, -16]], cx: -3.6, cy: -18, r: 3, col: PALETTE.scarf[0] },
      { poly: [[-1.2, -20], [7, -20], [7, -16], [-0.4, -16]], cx: 3.2, cy: -18, r: 3.4, col: PALETTE.scarf[2] }]);
    P.piece((c) => { c.moveTo(-1.6, -31.2); c.quadraticCurveTo(-1.2, -34.5, 0.2, -36.2); c.lineTo(2.6, -35.4); c.quadraticCurveTo(1.4, -33.6, 1.7, -31.2); c.closePath(); }, PALETTE.stem, 0.4, -33.5, 2.4);
    const L = leafPts(1.2, -33.4, -0.35, 6, 1.7); P.part(leafShape(L), leafCells(L, PALETTE.leaf[0], PALETTE.leaf[1]));
    P.part(ELL(0, -24.6, 10.6, 8.4), ribCells(0, -24.6, 10.6, 8.4, [-1.05, -0.64, -0.22, 0.22, 0.64, 1.05], PALETTE.pumpkin));
    const f = 1.5, face = [[[-5.9, -24.2], [-1.7, -24.2], [-3.9, -28.4]], [[1.5, -24.2], [5.7, -24.2], [3.5, -28.4]], [[-0.9, -22.2], [0.9, -22.2], [0, -23.9]],
      [[-6.4, -21.2], [-4.6, -20.4], [-3.6, -21.6], [-2.2, -20.4], [-0.6, -21.7], [0.9, -20.4], [2.4, -21.6], [3.6, -20.4], [5.4, -21.2], [4.6, -18.6], [3.2, -17.6], [2.2, -18.8], [0.6, -17.2], [-1, -18.6], [-2.4, -17.4], [-3.6, -18.8], [-5.2, -18.4]]];
    for (const q of face) { const p = q.map(([x, y]) => [x + f, y]), inf = polyInfo(p); P.piece(PP(p), PALETTE.face, inf.cx, inf.cy, inf.r * 1.2, { glow: true, ol: 0.5 }); }
  }
  function turnipPath(c, cx, top, bot, w) {
    const h = bot - top; c.moveTo(cx, top);
    c.bezierCurveTo(cx + w * 1.3, top + h * 0.02, cx + w * 1.18, top + h * 0.72, cx + w * 0.16, bot - 1);
    c.quadraticCurveTo(cx + 0.4, bot + 0.6, cx + 1.4, bot + 2.4); c.quadraticCurveTo(cx - 0.6, bot + 0.6, cx - w * 0.16, bot - 1);
    c.bezierCurveTo(cx - w * 1.18, top + h * 0.72, cx - w * 1.3, top + h * 0.02, cx, top); c.closePath();
  }
  function enemyParts(P, fr, v) {
    const lo = [-1.6, 0, 1.6, 0][fr], sw = [0, 0.12, 0, -0.12][fr];
    P.piece(CAP(-3.2, -4, -4.2 + lo, 0, 1.25, 0.8), PALETTE.root[1], -3.6, -2, 2);
    P.piece(CAP(3.2, -4, 4.2 - lo, 0, 1.25, 0.8), PALETTE.root[0], 3.6, -2, 2);
    [[-0.6, -19, -2.1 + sw, 9, 2.4], [0.6, -19, -1.05 + sw, 9, 2.4], [0, -19.5, -1.6 + sw * 0.6, 11, 2.6]].forEach((d, i) => { const L = leafPts(...d); P.part(leafShape(L), leafCells(L, PALETTE.leaf[(i + 2) % 3], PALETTE.leaf[(i + 1) % 3])); });
    const T = PALETTE.creepTop[v], C = PALETTE.cream;
    const cells = [[[[-13, -25], [-2, -25], [-4, -12.2], [-6, -11.2], [-13, -12.6]], T[0]], [[[-2, -25], [4, -25], [3, -12.4], [0, -13.2], [-4, -12.2]], T[1]], [[[4, -25], [13, -25], [13, -12.6], [6, -11.2], [3, -12.4]], T[2]],
      [[[-13, -12.6], [-6, -11.2], [-4, -12.2], [0, -13.2], [1.2, -7], [-1.5, 3], [-13, 3]], C[0]], [[[0, -13.2], [3, -12.4], [6, -11.2], [13, -12.6], [13, 3], [-1.5, 3], [1.2, -7]], C[1]]]
      .map(([poly, col]) => { const f = polyInfo(poly); return { poly, col, cx: cl(f.cx, -6, 6), cy: cl(f.cy, -18, -5), r: 6.5 }; });
    P.part((c) => turnipPath(c, 0, -21, -2.4, 9), cells);
    for (const e of [[[-6.2, -11], [-1.6, -9.6], [-2.2, -7.6], [-5.6, -8.2]], [[1.6, -9.6], [6.2, -11], [5.6, -8.2], [2.2, -7.6]]]) { const f = polyInfo(e); P.piece(PP(e), PALETTE.ember, f.cx, f.cy, f.r * 1.3, { glow: true, ol: 0.5 }); }
    if (P.mode !== 'outline') { const c = P.ctx; c.strokeStyle = LEAD; c.lineWidth = 0.75; c.beginPath(); c.moveTo(-2, -4.9); c.quadraticCurveTo(0, -6.2, 2, -4.9); c.stroke(); }
  }
  function ghostParts(P, fr) {
    const ph = (fr / 4) * TAU;
    P.piece(CAP(4, -12, 10.5, -13.5 + Math.sin(ph) * 0.8, 1.7, 1.1), PALETTE.opal[1], 7.5, -13, 3);
    P.part((c) => {
      c.moveTo(-7.6, -16.5); c.arc(0, -16.5, 7.6, PI, 0); c.bezierCurveTo(8.2, -11, 7.4, -7, 5.8 + Math.sin(ph) * 0.8, -2.6);
      for (let i = 0; i < 4; i++) { const x0 = 5.8 - (i / 4) * 11.6, x1 = 5.8 - ((i + 1) / 4) * 11.6; c.quadraticCurveTo((x0 + x1) / 2, 1 + Math.sin(ph + i * 1.7) * 1.2, x1, -3.4 + Math.sin(ph + (i + 1) * 1.7) * 0.9); }
      c.bezierCurveTo(-7.4, -7, -8.2, -11, -7.6, -16.5); c.closePath();
    }, mosaic(rectPoly(-9, -25, 9, 1), 70, 31, (x, y, i) => PALETTE.opal[i % 6]), { jitter: 0.06 });
    for (const [x, y, rx, ry, r] of [[-2.6, -17.4, 1.7, 2.3, -0.2], [3.2, -17.4, 1.7, 2.3, 0.2], [0.6, -11.6, 2.1, 3, 0]]) P.piece(ELL(x, y, rx, ry, r), PALETTE.hollow, x, y, 2.4, { ol: 0.5, noGlint: true });
  }
  /** Ghost tail dissolves: destination-out gradient over the lower 9 units of the baked sprite. */
  function ghostFade(x, box) { x.globalCompositeOperation = 'destination-out'; const g = x.createLinearGradient(0, -8, 0, 1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)'); x.fillStyle = g; x.fillRect(box[0], -8, box[2] - box[0], 12); }
  function bruteParts(P, fr) {
    const lift = [[0, 0], [3.2, 0], [0, 0], [0, 3.2]][fr], sw = [0, 2.5, 0, -2.5][fr];
    P.part(CAP(-8, -14, -8.5, -2.6 - lift[0], 4.4, 4), mosaic(rectPoly(-14, -20, -2, 2), 30, 5, (x, y, i) => PALETTE.brown[i % 5]));
    P.part(CAP(8, -14, 8.5, -2.6 - lift[1], 4.4, 4), mosaic(rectPoly(2, -20, 14, 2), 30, 6, (x, y, i) => PALETTE.brown[(i + 2) % 5]));
    P.part(CAP(-15, -34, -22 - sw * 0.4, -17 + sw, 4.6, 4), mosaic(rectPoly(-28, -40, -9, -10), 34, 8, (x, y, i) => PALETTE.violet[i % 4]));
    [[-2, -46, -2.3, 12, 3], [2, -46, -0.85, 12, 3], [0, -47, -1.57, 14, 3.2]].forEach((d) => { const L = leafPts(...d); P.part(leafShape(L), leafCells(L, '#3f7f3a', '#2a5c30')); });
    P.part((c) => { c.moveTo(0, -49); c.bezierCurveTo(16, -48, 23, -38, 21, -26); c.bezierCurveTo(19.5, -14, 10, -9, 0, -9); c.bezierCurveTo(-10, -9, -19.5, -14, -21, -26); c.bezierCurveTo(-23, -38, -16, -48, 0, -49); c.closePath(); },
      mosaic(ellPoly(0, -29, 23, 21, 18), 78, 13, (x, y, i, r) => (y + (r() - 0.5) * 6 < -31 ? PALETTE.violet : PALETTE.brown)[Math.floor(r() * 4)]));
    const cy = -24, q = [[0, cy - 6], [5, cy], [0, cy + 6], [-5, cy]];
    P.part(PP(q), q.map((p, i) => ({ poly: [[0, cy], p, q[(i + 1) % 4]], col: PALETTE.ruby[[1, 0, 2, 3][i]], cx: (p[0] + q[(i + 1) % 4][0]) / 3, cy: cy + (p[1] + q[(i + 1) % 4][1] - 2 * cy) / 3, r: 3, glow: true })));
    for (const e of [[[-9.5, -38.4], [-3.2, -36], [-4, -33.6], [-8.8, -35]], [[3.2, -36], [9.5, -38.4], [8.8, -35], [4, -33.6]]]) { const f = polyInfo(e); P.piece(PP(e), '#ffb21e', f.cx, f.cy, f.r * 1.3, { glow: true, ol: 0.6 }); }
    P.piece(PP([[-7, -16.2], [-5, -15], [-3.6, -16.6], [-1.6, -15], [0, -16.8], [1.6, -15], [3.6, -16.6], [5, -15], [7, -16.2], [5.6, -13.4], [0, -12.4], [-5.6, -13.4]]), '#3a1a2a', 0, -14.6, 5, { ol: 0.5, noGlint: true });
    P.part(CAP(15, -34, 22 + sw * 0.4, -17 - sw, 4.6, 4), mosaic(rectPoly(9, -40, 28, -10), 34, 9, (x, y, i) => PALETTE.violet[(i + 1) % 4]));
  }
  function gemParts(P) {
    const t = [0, -5.4], r = [3.9, -1.4], b = [0, 3.2], l = [-3.9, -1.4], c0 = [0, -1.4], C = PALETTE.gem;
    P.part(PP([t, r, b, l]), [[t, r, C[2], 1.2, -1.4, true], [r, b, C[1], 1.2, 1.2], [b, l, C[3], -1.2, 1.2], [l, t, C[0], -1.2, -1.4, true]]
      .map(([p, q, col, dx, dy, glow]) => ({ poly: [c0, p, q], col, cx: dx, cy: -1.4 + dy, r: 2.4, glow })), { noGlint: true });
  }
  function seedParts(P) { const sh = (c) => { c.moveTo(4.6, 0); c.bezierCurveTo(2.5, -3.1, -3.2, -3, -3.6, 0); c.bezierCurveTo(-3.2, 3, 2.5, 3.1, 4.6, 0); c.closePath(); }; P.part(sh, [{ poly: rectPoly(-5, -4, 6, 0.2), col: '#fff0c4', cx: 0, cy: -1, r: 3 }, { poly: rectPoly(-5, 0.2, 6, 4), col: '#e6c27a', cx: 0, cy: 1.5, r: 3 }], { noGlint: true }); }
  const SHARDS = [[[-2.6, -1.4], [2.8, -2.2], [0.6, 2.4]], [[-2.2, -2.2], [1.6, -1.8], [2.4, 1.6], [-1.2, 2.2]], [[-3, 0.4], [0.4, -2.4], [3, 0.8], [0.2, 1.4]]];

  // ---------- sprite cache (normal + "lit glass" flash copy), glow sprites
  let SPR = null;
  function radial(rgbc, r, K, stops) { const c = document.createElement('canvas'); c.width = c.height = Math.ceil(2 * r * K); const x = c.getContext('2d'), g = x.createRadialGradient(r * K, r * K, 0, r * K, r * K, r * K); stops.forEach(([o, a]) => g.addColorStop(o, rgb(rgbc, a))); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); return { c, box: [-r, -r, r, r] }; }
  function sprites(K) {
    if (SPR && SPR.K === K) return SPR;
    const pair = (box, fn, seed, post) => ({ n: build(box, fn, 'fill', seed, K, post), f: build(box, fn, 'flash', seed, K, post) });
    const G = [[0, 0.9], [0.25, 0.45], [0.6, 0.12], [1, 0]];
    SPR = { K, hero: [0, 1, 2, 3].map((f) => pair([-14, -38, 14, 3], (P) => heroParts(P, f), 11 + f)),
      enemy: [0, 1, 2].map((v) => [0, 1, 2, 3].map((f) => pair([-14, -34, 14, 4], (P) => enemyParts(P, f, v), 30 + v * 7 + f))),
      ghost: [0, 1, 2, 3].map((f) => pair([-11, -27, 14, 3], (P) => ghostParts(P, f), 60 + f, ghostFade)),
      brute: [0, 1, 2, 3].map((f) => pair([-31, -64, 31, 3], (P) => bruteParts(P, f), 80 + f)),
      gem: build([-5.5, -7.5, 5.5, 4.5], gemParts, 'fill', 5, K), seed: build([-5.5, -4.5, 6, 4.5], seedParts, 'fill', 4, K),
      shard: ['#8a4ac0', '#f2deb0', '#58a83c', '#e8f0ff'].map((col) => SHARDS.map((sh, i) => build([-4, -4, 4, 4], (P) => { const f = polyInfo(sh); P.ol = 0.4; P.part(PP(sh), [{ poly: sh, col, cx: f.cx, cy: f.cy, r: f.r * 1.2 }]); }, 'fill', 90 + i, K))),
      warm: radial([255, 190, 80], 16, K, G), gold: radial([255, 210, 90], 10, K, G), aqua: radial([110, 240, 220], 10, K, G), cold: radial([150, 200, 255], 14, K, G), ruby: radial([255, 60, 80], 14, K, G) };
    return SPR;
  }
  /** Draw a baked sprite with its origin at world (x,y); 'lighter' + alpha for glows. */
  function blit(ctx, s, x, y, sx, sy, rot, alpha, add) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy);
    if (alpha !== undefined) ctx.globalAlpha = alpha; if (add) ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(s.c, s.box[0], s.box[1], s.box[2] - s.box[0], s.box[3] - s.box[1]); ctx.restore();
  }
  const kFor = (ctx) => Math.max(3, Math.min(5, Math.round((ctx.getTransform ? ctx.getTransform().a : 1.5) * 1.5)));

  /** Draws the hero with feet at (x, y). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) {
    const S = sprites(kFor(ctx)), ph = t * 1.6, fr = Math.floor(ph * 4) & 3, lift = Math.abs(Math.sin(ph * TAU)) * 2.2, fx = facing < 0 ? -1 : 1, k = 1.15;
    blit(ctx, S.warm, x + fx * 1.2, y - 24 * k - lift, 1.25, 1.25, 0, 0.32 + 0.08 * Math.sin(t * 6.5), true);
    blit(ctx, S.hero[fr].n, x, y - lift, k * fx, k * (1 + 0.02 * Math.sin(ph * TAU * 2)), 0.05 * fx * Math.sin(ph * TAU));
    blit(ctx, S.gold, x + fx * 2, y - 23 * k - lift, 0.55, 0.55, 0, 0.28 + 0.12 * Math.sin(t * 9) * Math.sin(t * 5.3), true);
  }
  /** Draws a typical enemy (small melee turnip) with feet at (x, y). flash 0..1 = hit flash. */
  function drawEnemy(ctx, x, y, t, variant, flash, facing) {
    const S = sprites(kFor(ctx)), ph = t * 0.85 * 1.6 + (variant || 0) * 0.37, set = S.enemy[(variant || 0) % 3][Math.floor(ph * 4) & 3], sn = Math.sin(ph * TAU), fx = facing < 0 ? -1 : 1;
    blit(ctx, set.n, x, y - Math.abs(sn) * 1.2, 0.92 * fx, 0.92, sn * 0.09);
    if (flash > 0.02) blit(ctx, set.f, x, y - Math.abs(sn) * 1.2, 0.92 * fx, 0.92, sn * 0.09, Math.min(0.62, flash * 0.9));
  }

  // ---------- ground: per-pixel world-anchored Voronoi glass with antialiased lead + region lead
  const GSTEP = 4, PATH_HALF = 21, LANE = 7, LW = 0.78, LWR = 1.2;
  const TESS = [{ C: 20, seed: 101, pal: PALETTE.meadow.map(hex), alt: PALETTE.meadowAlt.map(hex) }, { C: 15, seed: 202, pal: PALETTE.leafCarpet.map(hex) }, { C: 30, seed: 404, lanes: [PALETTE.pathLane, PALETTE.pathMid, PALETTE.pathLane].map((p) => p.map(hex)) }];
  function fields(x, y) { return [fbm(x / 640 + 3.1, y / 640 - 7.7, 23, 3) - 0.53, fbm(x / 1150 + 0.37, y / 1150 + 0.11, 11, 2) - 0.5, fbm(x / 1150, y / 1150, 77, 2)]; }
  function site(T, i, j) {
    const h = hashInt(i, j, T.seed), h2 = hashInt(i, j, T.seed + 7), sx = (i + 0.08 + ((h & 1023) / 1023) * 0.84) * T.C, sy = (j + 0.08 + (((h >>> 10) & 1023) / 1023) * 0.84) * T.C;
    const br = 0.93 + ((h2 >>> 16) & 255) / 256 * 0.14, a = ((h2 & 255) / 256) * PI, fr = 0.45 + ((h2 >>> 8) & 255) / 256 * 0.6;
    let cols;
    if (T.lanes) cols = T.lanes.map((p, k) => p[(h2 >>> (k * 5)) % p.length]);
    else cols = [((h2 >>> 24) & 255) / 256 < sstep(0.42, 0.6, fbm(sx / 380, sy / 380, 91, 2)) && T.alt ? T.alt[h2 % T.alt.length] : T.pal[h2 % T.pal.length]];
    return { sx, sy, dc: Math.cos(a), ds: Math.sin(a), fr, ph: h2 & 63, cols: cols.map((c) => mul(c, br)) };
  }
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  function bakeGround(Wp, Hp, s, ox, oy) {
    const cv = document.createElement('canvas'); cv.width = Wp; cv.height = Hp; const cx = cv.getContext('2d');
    const nx = Math.ceil(Wp / s / GSTEP) + 2, ny = Math.ceil(Hp / s / GSTEP) + 2, F = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F.push(fields(ox + i * GSTEP, oy + j * GSTEP));
    const cache = TESS.map(() => new Map()), getSite = (m, i, j) => { const k = i * 100003 + j; let v = cache[m].get(k); if (!v) cache[m].set(k, v = site(TESS[m], i, j)); return v; };
    const img = cx.createImageData(Wp, Hp), buf = new Uint32Array(img.data.buffer);
    for (let py = 0; py < Hp; py++) for (let px = 0; px < Wp; px++) {
      const x = ox + (px + 0.5) / s, y = oy + (py + 0.5) / s, gx = (x - ox) / GSTEP, gy = (y - oy) / GSTEP, i0 = gx | 0, j0 = gy | 0, u = gx - i0, v = gy - j0;
      const A = F[j0 * nx + i0], B = F[j0 * nx + i0 + 1], C = F[(j0 + 1) * nx + i0], D = F[(j0 + 1) * nx + i0 + 1];
      const lay = (L) => { const s0 = A[L] + (B[L] - A[L]) * u, s1 = C[L] + (D[L] - C[L]) * u, sv = s0 + (s1 - s0) * v, du = (B[L] - A[L]) * (1 - v) + (D[L] - C[L]) * v, dv = (C[L] - A[L]) * (1 - u) + (D[L] - B[L]) * u, g = Math.sqrt(du * du + dv * dv) / GSTEP; return g > 1e-9 ? sv / g : sv > 0 ? 99 : -99; };
      const dL = lay(0), across = lay(1), dPa = PATH_HALF - Math.abs(across), mt = (A[2] + B[2] + C[2] + D[2]) / 4;
      let m, re; if (dPa > 0) { m = 2; re = dPa; } else if (dL > 0) { m = 1; re = Math.min(dL, -dPa); } else { m = 0; re = Math.min(-dL, -dPa); }
      const T = TESS[m], ix = Math.floor(x / T.C), iy = Math.floor(y / T.C);
      let b1 = 1e18, b2 = 1e18, b3 = 1e18, k1 = null, k2 = null, k3 = null;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const st = getSite(m, ix + i, iy + j), dx = st.sx - x, dy = st.sy - y, d = dx * dx + dy * dy; if (d < b1) { b3 = b2; k3 = k2; b2 = b1; k2 = k1; b1 = d; k1 = st; } else if (d < b2) { b3 = b2; k3 = k2; b2 = d; k2 = st; } else if (d < b3) { b3 = d; k3 = st; } }
      const e1 = (b2 - b1) / (2 * Math.hypot(k2.sx - k1.sx, k2.sy - k1.sy)), e2 = (b3 - b1) / (2 * Math.hypot(k3.sx - k1.sx, k3.sy - k1.sy));
      let eP = smin(e1, e2, 1.6), col = k1.cols[0];
      if (m === 2) { const lane = across < -LANE ? 0 : across > LANE ? 2 : 1; eP = Math.min(eP, Math.abs(across - LANE), Math.abs(across + LANE)); col = k1.cols[lane]; }
      const streak = 1 + 0.055 * Math.sin((x * k1.dc + y * k1.ds) * k1.fr + k1.ph), e = Math.min(eP, re), tt = cl(e / (T.C * 0.34), 0, 1);
      const lum = (0.6 + 0.38 * tt * tt * (3 - 2 * tt)) * streak * (0.86 + (mt - 0.3) * 0.5);
      let r = col[0] * lum, g = col[1] * lum, b = col[2] * lum;
      const cov = Math.max(LW - eP, LWR - re) * s + 0.5;
      if (cov > 0) { const k = Math.min(1, cov), tl = cl(Math.max(1 - eP / LW, 1 - re / LWR), 0, 1), q = tl * tl * 0.85; r += (28 + 56 * q - r) * k; g += (24 + 54 * q - g) * k; b += (34 + 62 * q - b) * k; }
      buf[py * Wp + px] = 0xff000000 | (Math.min(255, b) << 16) | (Math.min(255, g) << 8) | Math.min(255, r);
    }
    cx.putImageData(img, 0, 0);
    // decals: leaded flowers on meadow, autumn leaves on the carpet, glass glints everywhere (world-anchored seeded scatter)
    cx.setTransform(s, 0, 0, s, -ox * s, -oy * s); cx.lineJoin = 'round';
    const matAt = (x, y) => { const f = fields(x, y); return Math.abs(f[1]) < 0.02 ? 2 : f[0] > 0.01 ? 1 : 0; };
    const blob = (path, col, x, y, r, lw) => { const g = cx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r * 1.25); g.addColorStop(0, rgb(mix(col, [255, 255, 255], 0.35))); g.addColorStop(0.5, rgb(col)); g.addColorStop(1, rgb(mul(col, 0.66))); cx.beginPath(); path(cx); cx.fillStyle = g; cx.fill(); cx.lineWidth = lw; cx.strokeStyle = LEAD; cx.stroke(); };
    for (let gy = Math.floor(oy / 40); gy * 40 < oy + Hp / s; gy++) for (let gx = Math.floor(ox / 40); gx * 40 < ox + Wp / s; gx++) {
      const rnd = mulberry32(hashInt(gx, gy, 9001)), x = (gx + rnd()) * 40, y = (gy + rnd()) * 40, mat = matAt(x, y);
      if (mat === 0 && rnd() < 0.5) {
        const col = ['#e8668a', '#f2c040', '#7ab8f0', '#efe6ff', '#c87ae8'].map(hex)[Math.floor(rnd() * 5)], rot = rnd() * TAU;
        cx.save(); cx.translate(x, y); cx.scale(0.9, 0.72);
        for (let i = 0; i < 5; i++) { const a = rot + (i / 5) * TAU, qx = Math.cos(a) * 2.5, qy = Math.sin(a) * 2.5; blob(ELL(qx, qy, 2.4, 1.5, a), mul(col, 0.92 + (i % 2) * 0.12), qx, qy, 2.2, 0.55); }
        blob(ELL(0, 0, 1.35, 1.35), [240, 150, 40], 0, 0, 1.4, 0.55); cx.restore();
      } else if (mat === 1 && rnd() < 0.7) {
        const L = leafPts(x, y, rnd() * TAU, 7, 2.2); blob(leafShape(L), ['#e09a30', '#d0602a', '#f2c040', '#b8402a', '#e87a3a'].map(hex)[Math.floor(rnd() * 5)], L.mx, L.my, 3.5, 0.6);
        cx.beginPath(); cx.moveTo(L.bx, L.by); cx.lineTo(L.tx, L.ty); cx.lineWidth = 0.5; cx.stroke();
      }
      const l = 1.6 + rnd() * 2.4, x2 = x + 17, y2 = y + 9; cx.strokeStyle = 'rgba(255,255,255,0.2)'; cx.lineWidth = 0.55; cx.beginPath(); cx.moveTo(x2 - l * 0.7, y2 + l * 0.7); cx.lineTo(x2 + l * 0.7, y2 - l * 0.7); cx.stroke();
    }
    return cv;
  }
  // ---------- screen overlay: window-embrasure vignette, lead frame + gold fillet, ripples, coloured light rays
  function bakeOverlay(W, H) {
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
    const [dark, c] = mk(W, H), s = H / 900, rnd = mulberry32(77);
    const g = c.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, Math.hypot(W, H) * 0.56);
    [[0, 0], [0.55, 0.1], [0.85, 0.36]].forEach(([o, a]) => g.addColorStop(o, `rgba(14,8,26,${a})`)); g.addColorStop(1, 'rgba(10,6,20,0.62)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(16,12,22,0.85)'; c.lineWidth = 10 * s; c.strokeRect(5 * s, 5 * s, W - 10 * s, H - 10 * s);
    c.strokeStyle = 'rgba(214,170,80,0.35)'; c.lineWidth = 2 * s; c.strokeRect(11 * s, 11 * s, W - 22 * s, H - 22 * s);
    c.lineWidth = 1.2 * s;
    for (let i = 0; i < 70; i++) { const y = rnd() * H, amp = (6 + rnd() * 14) * s, ph = rnd() * TAU, fq = (0.004 + rnd() * 0.006) / s; c.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,20,0.03)'; c.beginPath(); for (let x = 0; x <= W; x += 24) c.lineTo(x, y + Math.sin(x * fq + ph) * amp); c.stroke(); }
    const lw = Math.ceil(W * 0.55), lh = Math.ceil(H * 0.5), [light, l] = mk(lw, lh);
    const cg = l.createRadialGradient(lw / 2, lh * 0.45, 0, lw / 2, lh * 0.45, lh * 0.75); cg.addColorStop(0, 'rgba(255,226,170,0.16)'); cg.addColorStop(1, 'rgba(255,226,170,0)'); l.fillStyle = cg; l.fillRect(0, 0, lw, lh);
    for (const [fx, col] of [[0.12, [255, 120, 140]], [0.3, [255, 210, 120]], [0.47, [120, 170, 255]], [0.66, [255, 190, 110]], [0.86, [190, 140, 255]]]) {
      const x0 = fx * lw * 1.1 - lw * 0.15, wd = lw * (0.05 + rnd() * 0.05), rg = l.createLinearGradient(0, 0, 0, lh);
      rg.addColorStop(0, rgb(col, 0.075)); rg.addColorStop(0.7, rgb(col, 0.028)); rg.addColorStop(1, rgb(col, 0)); l.fillStyle = rg;
      l.beginPath(); l.moveTo(x0, 0); l.lineTo(x0 + wd, 0); l.lineTo(x0 + wd + lh * 0.45, lh); l.lineTo(x0 + lh * 0.45 - wd * 0.2, lh); l.closePath(); l.fill();
    }
    return { dark, light };
  }
  /** Damage number: Cinzel Decorative 900, double lead stroke, gold gradient, white highlight band. */
  function drawNumber(ctx, txt, x, y, fs, crit) {
    ctx.save(); ctx.font = `900 ${fs}px "Cinzel Decorative", "Cinzel", Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.strokeStyle = LEAD; ctx.lineWidth = fs * 0.26; ctx.strokeText(txt, x, y + fs * 0.06); ctx.strokeText(txt, x, y);
    const g = ctx.createLinearGradient(0, y - fs * 0.45, 0, y + fs * 0.4);
    (crit ? [[0, '#fff6c0'], [0.45, '#ffcf40'], [1, '#ff7a1a']] : [[0, '#ffffff'], [0.5, '#e6eeff'], [1, '#a9c0ee']]).forEach(([o, c]) => g.addColorStop(o, c));
    ctx.fillStyle = g; ctx.fillText(txt, x, y); ctx.restore();
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, hero, enemies, an effect. */
  let BG = null;
  function draw(ctx, w, h, t) {
    const s = h / 360, W = w / s, OX = -1760, OY = 960;
    if (!BG || BG.w !== w || BG.h !== h) BG = { w, h, ground: bakeGround(w, h, s, OX, OY), ov: bakeOverlay(w, h) };
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(BG.ground, 0, 0);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const S = sprites(kFor(ctx)), cx = W / 2, cy = 205;
    const shadow = (x, y, rx, ry, a) => { ctx.fillStyle = `rgba(14,10,22,${a})`; ctx.beginPath(); ctx.ellipse(x, y + 0.4, rx, ry, 0, 0, TAU); ctx.fill(); };
    // candle light pool cast on the floor (additive) + hero's warm floor pool
    ctx.globalCompositeOperation = 'lighter';
    blit(ctx, S.warm, cx, cy + 1, 2.6, 1.0, 0, 0.55 + 0.1 * Math.sin(t * 5));
    ctx.globalCompositeOperation = 'source-over';
    const actors = [];
    const ring = [[-120, -60, 0], [-80, 70, 1], [100, -85, 2], [150, 40, 0], [-170, 10, 2], [60, 110, 1], [195, -20, 1], [-40, -110, 0], [230, 95, 2], [-230, 100, 1]];
    ring.forEach(([dx, dy, v], i) => actors.push({ y: cy + dy, f: () => { shadow(cx + dx, cy + dy, 7.4, 2.4, 0.42); drawEnemy(ctx, cx + dx, cy + dy, t + i * 0.21, v, i === 1 ? 0.5 + 0.5 * Math.sin(t * 9) : 0, dx > 0 ? -1 : 1); } }));
    [[-60, 40], [120, 95], [-200, -70]].forEach(([dx, dy], i) => actors.push({ y: cy + dy, f: () => {
      const x = cx + dx, y = cy + dy - 4 - Math.sin(t * 2.4 + i * 3) * 1.5; shadow(cx + dx, cy + dy, 5, 1.7, 0.25);
      blit(ctx, S.cold, x, y - 16, 0.75, 0.75, 0, 0.22, true); blit(ctx, S.ghost[Math.floor(t * 6 + i) & 3].n, x, y, dx > 0 ? -1 : 1, 1, 0, 0.86); } }));
    actors.push({ y: cy - 30, f: () => {
      const x = cx + 85, y = cy - 30, ph = t * 0.5, up = Math.abs(Math.sin(ph * TAU)); shadow(x, y, 19, 5.5, 0.42);
      blit(ctx, S.ruby, x, y + 2, 1.6, 0.5, 0, 0.35, true); blit(ctx, S.brute[Math.floor(ph * 4) & 3].n, x, y - up * 1.8, -1, 1);
      blit(ctx, S.ruby, x, y - 24 - up * 1.8, 0.8, 0.8, 0, 0.45 + 0.25 * Math.sin(t * 4), true); } });
    actors.push({ y: cy, f: () => { shadow(cx, cy, 7.5, 2.4, 0.45); drawHero(ctx, cx, cy, t, 1); } });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.f());
    // gems with additive aqua halo, bobbing
    for (let i = 0; i < 7; i++) { const x = cx + 30 + i * 13, y = cy + 40 + Math.sin(i * 2.1) * 10 + Math.sin(t * 3.2 + i * 2) * 1.1; blit(ctx, S.aqua, x, y - 4.5, 0.6, 0.6, 0, 0.55 + 0.15 * Math.sin(t * 6 + i), true); blit(ctx, S.gem, x, y, 0.85, 0.85); }
    // seed projectile with warm trail flying toward the brute
    const pq = (t * 1.4) % 1, px = cx + 12 + pq * 60, py = cy - 22 - pq * 18, ang = Math.atan2(-18, 60);
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter'; const tg = ctx.createLinearGradient(0, 0, -16, 0); tg.addColorStop(0, 'rgba(255,214,120,0.75)'); tg.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-1, -1.6); ctx.lineTo(-16, 0); ctx.lineTo(-1, 1.6); ctx.fill(); ctx.restore();
    blit(ctx, S.seed, px, py, 0.85, 0.85 * (0.6 + 0.4 * Math.abs(Math.cos(t * 20))), ang);
    // shatter burst: a killed enemy breaks into tumbling leaded shards (deterministic per t)
    const bq = (t * 0.8) % 1, bx = cx - 95, by = cy + 30, rnd = mulberry32(5);
    for (let i = 0; i < 9; i++) { const a = rnd() * TAU, sp = 30 + rnd() * 35, z = 11 + 60 * bq - 150 * bq * bq * 0.9 + rnd() * 6, tum = Math.cos(t * 10 + i * 3); blit(ctx, S.shard[i % 4][i % 3], bx + Math.cos(a) * sp * bq, by + Math.sin(a) * sp * bq * 0.6 - Math.max(0, z), 1, 0.25 + 0.75 * Math.abs(tum), a + t * 8 * (rnd() - 0.5), bq > 0.75 ? 1 - (bq - 0.75) / 0.25 : 1); }
    drawNumber(ctx, '34', cx + 85, cy - 80 - ((t * 0.7) % 1) * 8, 12.5, true); drawNumber(ctx, '17', cx - 80, cy + 48, 9.2, false);
    // overlay
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(BG.ov.dark, 0, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(BG.ov.light, Math.sin(t * 0.12) * w * 0.025 - w * 0.05, 0, w * 1.1, h); ctx.globalCompositeOperation = 'source-over';
  }

  const Starter = { id: 'stainedglass', name: 'Cathedral Glass', palette: PALETTE, fonts: ['Cinzel Decorative:wght@700;900', 'Cinzel:wght@500;700;900'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['stainedglass'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
