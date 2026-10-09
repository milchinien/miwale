/* ============================================================================
   Kirchenfenster (id: stainedglass) – the whole world is a living cathedral
   stained-glass window with light shining through.
   ONE language everywhere: jewel-tone glass pieces (luminous centre, darker rim,
   streaks, glints) separated by dark lead came with a soft metallic ridge.
   Ground: per-pixel, world-anchored Voronoi glass per material region
   (meadow / leaf carpet / night glass / amber path lanes / clear diamond quarries),
   region borders are heavier lead lines. Props cast coloured light pools.
   Characters: pre-rendered leaded glass figures (outline pass + piece pass),
   flash copies keep the lead (capped "lit glass" flash), shatter into shards.
   ========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ------------------------------------------------------------------ palette */
  const LEAD = '#17131c';
  const WARM = [255, 250, 232];
  const PAL = {
    jackRib: ['#e2681a', '#ff8a22', '#ffa63c', '#ff8a22', '#e2681a'],
    cloak: ['#1f5a34', '#2a6e40', '#184a2c', '#2f7a3c', '#22603e'],
    scarf: ['#c4283e', '#a51d34', '#d8404e'],
    boot: ['#4a2f22', '#5d3b29'],
    stem: '#4f7c2c', leaf: ['#5fa83c', '#3f8a32', '#78bf4a'],
    face: '#ffd23a',
    creepTop: [
      ['#7a3fae', '#9351c8', '#6a3298'],
      ['#a8378c', '#c24ca2', '#8e2c76'],
      ['#5a48b8', '#7060d0', '#4a3a9e'],
    ],
    cream: ['#f4e2b4', '#e8cc90', '#f8ecc8'],
    root: ['#e6cf9a', '#cfae72'],
    opal: ['#f0f5ff', '#dde8fb', '#f6ecfb', '#e0f3f4', '#e9e9fb', '#fbf6ec'],
    hollow: '#1e2452',
    brown: ['#6b4a32', '#7e5a3c', '#5a3b2a', '#8a6440', '#644530'],
    violet: ['#5e3a7a', '#704690', '#52306a', '#7c5098'],
    ruby: ['#e3203c', '#ff4a5a', '#b8142e', '#ff7080'],
    stone: ['#6f7486', '#7d8294', '#636878', '#868a9a', '#5a5f70'],
    jewel: ['#c4283e', '#2f4fb8', '#e2aa32', '#2f8a4f', '#7a3aa8', '#2f7fb0'],
  };

  const JACK_SCALE = 1.15;
  let K = 4; // sprite px per world unit
  const SPR = {};

  /* ============================================================ geometry */
  function splitPoly(poly, px, py, nx, ny) {
    const a = [], b = [], n = poly.length;
    for (let i = 0; i < n; i++) {
      const p = poly[i], q = poly[(i + 1) % n];
      const dp = (p[0] - px) * nx + (p[1] - py) * ny, dq = (q[0] - px) * nx + (q[1] - py) * ny;
      if (dp >= 0) a.push(p); else b.push(p);
      if ((dp >= 0) !== (dq >= 0)) {
        const t = dp / (dp - dq);
        const m = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
        a.push(m); b.push(m);
      }
    }
    return [a, b];
  }
  function polyArea(p) {
    let s = 0;
    for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; }
    return Math.abs(s) / 2;
  }
  function polyInfo(p) {
    let cx = 0, cy = 0;
    for (const q of p) { cx += q[0]; cy += q[1]; }
    cx /= p.length; cy /= p.length;
    let r = 0;
    for (const q of p) r = Math.max(r, Math.hypot(q[0] - cx, q[1] - cy));
    return { cx, cy, r: r * 0.85 };
  }
  function bsp(poly, maxArea, rnd, out, depth) {
    const A = polyArea(poly);
    if (A <= maxArea || depth > 9) { out.push(poly); return; }
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, cx = 0, cy = 0;
    for (const q of poly) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); cx += q[0]; cy += q[1]; }
    cx /= poly.length; cy /= poly.length;
    const ang = (x1 - x0 > y1 - y0 ? 0 : PI / 2) + (rnd() - 0.5) * 1.2;
    const nx = Math.cos(ang), ny = Math.sin(ang);
    const ext = Math.max(x1 - x0, y1 - y0);
    const px = cx + nx * (rnd() - 0.5) * 0.35 * ext, py = cy + ny * (rnd() - 0.5) * 0.35 * ext;
    const [a, b] = splitPoly(poly, px, py, nx, ny);
    if (a.length < 3 || b.length < 3) { out.push(poly); return; }
    bsp(a, maxArea, rnd, out, depth + 1);
    bsp(b, maxArea, rnd, out, depth + 1);
  }
  const MOS = new Map();
  /** Cached mosaic: BSP partition of `poly` into convex glass pieces; colFn(cx, cy, i, rnd) -> colour. */
  function mosaic(key, poly, maxArea, seed, colFn) {
    let m = MOS.get(key);
    if (m) return m;
    const rnd = U.mulberry32(seed);
    const polys = [];
    bsp(poly, maxArea, rnd, polys, 0);
    m = polys.map((p, i) => {
      const inf = polyInfo(p);
      return { poly: p, cx: inf.cx, cy: inf.cy, r: inf.r, col: colFn(inf.cx, inf.cy, i, rnd) };
    });
    MOS.set(key, m);
    return m;
  }
  function ellPoly(cx, cy, rx, ry, n, k) {
    n = n || 16; k = k || 1.1;
    const p = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return p;
  }
  const rectPoly = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  function polyPath(c, p) {
    c.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
    c.closePath();
  }
  const PP = (p) => (c) => polyPath(c, p);
  const ELL = (x, y, rx, ry, rot) => (c) => { c.moveTo(x + rx * Math.cos(rot || 0), y + rx * Math.sin(rot || 0)); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };
  const CAP = (x1, y1, x2, y2, r1, r2) => (c) => {
    r2 = r2 === undefined ? r1 : r2;
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.moveTo(x1 + Math.cos(a + PI / 2) * r1, y1 + Math.sin(a + PI / 2) * r1);
    c.arc(x1, y1, r1, a + PI / 2, a + PI * 1.5);
    c.arc(x2, y2, r2, a - PI / 2, a + PI / 2);
    c.closePath();
  };
  function rrect(c, x, y, w, h, r) {
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  const RR = (x, y, w, h, r) => (c) => rrect(c, x, y, w, h, r);
  function leafPts(bx, by, ang, len, wid) {
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const tx = bx + dx * len, ty = by + dy * len, mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
    return { bx, by, tx, ty, ax: mx + px * wid * 1.3, ay: my + py * wid * 1.3, cx2: mx - px * wid * 1.3, cy2: my - py * wid * 1.3, mx, my };
  }
  function leafShape(L) {
    return (c) => { c.moveTo(L.bx, L.by); c.quadraticCurveTo(L.ax, L.ay, L.tx, L.ty); c.quadraticCurveTo(L.cx2, L.cy2, L.bx, L.by); c.closePath(); };
  }
  function leafCells(L, c1, c2) {
    return [
      { path: (c) => { c.moveTo(L.bx, L.by); c.quadraticCurveTo(L.ax, L.ay, L.tx, L.ty); c.closePath(); }, col: c1, cx: (L.mx * 2 + L.ax) / 3, cy: (L.my * 2 + L.ay) / 3, r: Math.hypot(L.tx - L.bx, L.ty - L.by) * 0.45 },
      { path: (c) => { c.moveTo(L.bx, L.by); c.quadraticCurveTo(L.cx2, L.cy2, L.tx, L.ty); c.closePath(); }, col: c2, cx: (L.mx * 2 + L.cx2) / 3, cy: (L.my * 2 + L.cy2) / 3, r: Math.hypot(L.tx - L.bx, L.ty - L.by) * 0.45 },
    ];
  }
  /** Pumpkin rib cells (vertical lens segments) for an ellipse. fs = boundaries in -1..1 */
  function ribCells(cx, cy, rx, ry, fs, cols) {
    const cells = [];
    for (let i = 0; i < fs.length - 1; i++) {
      const a = fs[i], b = fs[i + 1];
      let path;
      if (a < 0 && b > 0) {
        const o = Math.max(-a, b);
        path = (c) => { c.moveTo(cx + rx * o, cy); c.ellipse(cx, cy, rx * o, ry, 0, 0, TAU); };
      } else if (b <= 0) {
        const o = -a, n = Math.max(0.01, -b);
        path = (c) => { c.moveTo(cx, cy - ry); c.ellipse(cx, cy, rx * o, ry, 0, -PI / 2, PI / 2, true); c.ellipse(cx, cy, rx * n, ry, 0, PI / 2, -PI / 2, false); c.closePath(); };
      } else {
        const n = Math.max(0.01, a), o = b;
        path = (c) => { c.moveTo(cx, cy - ry); c.ellipse(cx, cy, rx * o, ry, 0, -PI / 2, PI / 2, false); c.ellipse(cx, cy, rx * n, ry, 0, PI / 2, -PI / 2, true); c.closePath(); };
      }
      cells.push({ path, col: cols[i % cols.length], cx: cx + rx * (Math.max(-1, a) + Math.min(1, b)) / 2, cy: cy - ry * 0.1, r: Math.max(rx * (b - a) * 0.75, ry * 0.95) });
    }
    return cells;
  }
  /** Leaf-like wedge pieces fanning out of a focus point (foliage lobes). */
  function wedgeCells(key, cx, cy, r, n, pal, seed) {
    let m = MOS.get(key);
    if (m) return m;
    const rnd = U.mulberry32(seed);
    const fx = cx - r * 0.18, fy = cy + r * 0.3;
    const a0 = rnd() * TAU;
    const angs = [];
    for (let i = 0; i <= n; i++) angs.push(a0 + (i / n) * TAU + (i > 0 && i < n ? (rnd() - 0.5) * (TAU / n) * 0.5 : 0));
    m = [];
    for (let i = 0; i < n; i++) {
      const A = angs[i], B = angs[i + 1], M = (A + B) / 2, R = r * 3;
      const poly = [[fx, fy], [fx + Math.cos(A) * R, fy + Math.sin(A) * R], [fx + Math.cos(M) * R * 1.1, fy + Math.sin(M) * R * 1.1], [fx + Math.cos(B) * R, fy + Math.sin(B) * R]];
      const ccx = fx + Math.cos(M) * r * 0.6, ccy = fy + Math.sin(M) * r * 0.6;
      m.push({ poly, cx: ccx, cy: ccy, r: r * 0.6, col: pal[Math.floor(rnd() * pal.length)] });
    }
    // small round "heart" piece at the focus
    m.push({ path: ELL(fx, fy, r * 0.28, r * 0.28), cx: fx, cy: fy, r: r * 0.28, col: pal[Math.floor(rnd() * pal.length)] });
    MOS.set(key, m);
    return m;
  }
  function archPath(c, cx, yb, a, y0) {
    c.moveTo(cx - a, y0); c.lineTo(cx - a, yb);
    c.arc(cx + a, yb, 2 * a, PI, PI + PI / 3);
    c.arc(cx - a, yb, 2 * a, -PI / 3, 0);
    c.lineTo(cx + a, y0); c.closePath();
  }
  function archPoly(cx, yb, a, y0) {
    const p = [[cx - a, y0], [cx - a, yb]];
    for (let i = 1; i <= 6; i++) { const t = PI + (PI / 3) * (i / 6); p.push([cx + a + Math.cos(t) * 2 * a, yb + Math.sin(t) * 2 * a]); }
    for (let i = 1; i <= 6; i++) { const t = -PI / 3 + (PI / 3) * (i / 6); p.push([cx - a + Math.cos(t) * 2 * a, yb + Math.sin(t) * 2 * a]); }
    p.push([cx + a, y0]);
    return p;
  }
  function starPts(n, ro, ri, cx, cy, rot) {
    const p = [];
    for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU - PI / 2, r = i & 1 ? ri : ro; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return p;
  }

  /* ============================================================== painter
     A figure = fn(P) declaring parts back-to-front. Run twice: 'outline' pass (every part filled +
     stroked in lead -> one clean outer came), then 'fill' / 'flash' pass (glass pieces + inner lead). */
  function Painter(ctx, mode, ol, il, seed) {
    this.ctx = ctx; this.mode = mode; this.ol = ol; this.il = il;
    this.rnd = U.mulberry32(seed || 1);
  }
  Painter.prototype.part = function (shape, cells, o) {
    o = o || {};
    const c = this.ctx;
    if (this.mode === 'outline') {
      if (o.noOutline) return;
      c.beginPath(); shape(c);
      c.lineWidth = (o.ol != null ? o.ol : this.ol) * 2;
      c.strokeStyle = LEAD; c.fillStyle = LEAD;
      c.stroke(); c.fill();
      return;
    }
    c.save();
    c.beginPath(); shape(c); c.clip();
    for (const cell of cells) this.glass(cell, o);
    c.restore();
    if (!o.noBorder) {
      c.beginPath(); shape(c);
      c.lineWidth = this.il * 1.2; c.strokeStyle = LEAD; c.stroke();
    }
  };
  /** Single-colour piece. */
  Painter.prototype.piece = function (shape, col, cx, cy, r, o) {
    o = o || {};
    this.part(shape, [{ path: shape, col, cx, cy, r, glow: o.glow, noGlint: o.noGlint }], o);
  };
  Painter.prototype.glass = function (cell, o) {
    const c = this.ctx, flash = this.mode === 'flash';
    const glow = cell.glow || o.glow;
    let col = U.hex(cell.col);
    const j = 1 + (this.rnd() - 0.5) * (o.jitter != null ? o.jitter : 0.12);
    col = U.mul(col, j);
    if (flash) col = U.mix(col, WARM, glow ? 0.4 : 0.58);
    const r = Math.max(0.6, cell.r);
    const hi = glow ? U.mix(col, [255, 255, 236], 0.78) : U.mix(col, [255, 255, 255], 0.3);
    const lo = U.mul(col, glow ? 0.9 : 0.64);
    const g = c.createRadialGradient(cell.cx - r * 0.25, cell.cy - r * 0.3, r * 0.05, cell.cx, cell.cy, r * 1.3);
    g.addColorStop(0, U.rgb(hi)); g.addColorStop(0.48, U.rgb(col)); g.addColorStop(1, U.rgb(lo));
    c.beginPath();
    if (cell.poly) polyPath(c, cell.poly); else cell.path(c);
    c.fillStyle = g; c.fill();
    const rr = this.rnd(), ra = this.rnd();
    if (!glow && r > 1.4) {
      // cathedral-glass streaks
      c.save(); c.clip();
      const a = ra * PI, dx = Math.cos(a), dy = Math.sin(a);
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = r * 0.16;
      c.beginPath();
      for (let k = -1; k <= 1; k += 2) {
        const ox = -dy * k * r * 0.35, oy = dx * k * r * 0.35;
        c.moveTo(cell.cx + ox - dx * r * 1.4, cell.cy + oy - dy * r * 1.4);
        c.quadraticCurveTo(cell.cx + ox + dy * r * 0.3, cell.cy + oy - dx * r * 0.3, cell.cx + ox + dx * r * 1.4, cell.cy + oy + dy * r * 1.4);
      }
      c.stroke();
      // glint
      if (!cell.noGlint && !o.noGlint && rr < 0.5 && r > 1.6) {
        c.fillStyle = flash ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.55)';
        c.beginPath(); c.ellipse(cell.cx - r * 0.38, cell.cy - r * 0.42, r * 0.26, r * 0.1, -0.7, 0, TAU); c.fill();
      }
      c.restore();
      c.beginPath();
      if (cell.poly) polyPath(c, cell.poly); else cell.path(c);
    }
    c.lineWidth = this.il; c.strokeStyle = LEAD; c.stroke();
  };
  /** Raw detail drawing in the fill/flash pass only. */
  Painter.prototype.detail = function (fn) {
    if (this.mode === 'outline') return;
    const c = this.ctx; c.save(); fn(c, this.mode === 'flash'); c.restore();
  };

  function build(box, fn, mode, seed, ol, il) {
    const [x0, y0, x1, y1] = box;
    const { c, ctx } = U.canvas((x1 - x0) * K, (y1 - y0) * K);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.scale(K, K); ctx.translate(-x0, -y0);
    fn(new Painter(ctx, 'outline', ol || 0.95, il || 0.55, seed));
    fn(new Painter(ctx, mode || 'fill', ol || 0.95, il || 0.55, seed));
    return { c, ox: -x0 * K, oy: -y0 * K };
  }
  function plain(box, fn) {
    const [x0, y0, x1, y1] = box;
    const { c, ctx } = U.canvas((x1 - x0) * K, (y1 - y0) * K);
    ctx.scale(K, K); ctx.translate(-x0, -y0);
    fn(ctx);
    return { c, ox: -x0 * K, oy: -y0 * K };
  }
  /** normal + lit (flash) copy */
  function pair(box, fn, seed) { return { n: build(box, fn, 'fill', seed), f: build(box, fn, 'flash', seed) }; }

  /* ============================================================ characters */
  function jackParts(P, fr) {
    const lo = [0, 2.2, 0, -2.2][fr];
    const lift = [0, 0.8, 0, 0.8][fr];
    // legs / boots (back one first)
    P.piece(CAP(3.2, -8, 3.4 - lo, -1.2, 2.1, 2.2), PAL.boot[1], 3.2 - lo * 0.5, -4.5, 3.2);
    P.piece(CAP(-3.2, -8, -3.4 + lo, -1.2 - lift, 2.1, 2.2), PAL.boot[0], -3.2 + lo * 0.5, -4.5, 3.2);
    // cloak
    const cloak = [[-4.6, -17.2], [4.6, -17.2], [8.8, -4.6], [5.4, -2.6], [0.4, -3.6], [-5, -2.6], [-8.8, -4.6]];
    const cc = mosaic('jackCloak', cloak, 38, 7, (x, y, i) => PAL.cloak[i % PAL.cloak.length]);
    P.part(PP(cloak), cc);
    // golden hem
    const hem = [[-8.8, -4.6], [-5, -2.6], [0.4, -3.6], [5.4, -2.6], [8.8, -4.6], [8.2, -6.6], [5, -4.9], [0.4, -5.9], [-5, -4.9], [-8.2, -6.6]];
    P.part(PP(hem), [
      { poly: [[-10, -8], [-2.2, -8], [-2.2, -1], [-10, -1]], col: '#f2c040', cx: -5, cy: -4, r: 3 },
      { poly: [[-2.2, -8], [3, -8], [3, -1], [-2.2, -1]], col: '#e0a830', cx: 0.4, cy: -4.6, r: 3 },
      { poly: [[3, -8], [10, -8], [10, -1], [3, -1]], col: '#f2c040', cx: 5.5, cy: -4, r: 3 },
    ], { ol: 0.5 });
    // clasp jewel
    P.piece(ELL(0, -15.6, 1.5, 1.5), '#f2c040', 0, -15.6, 1.5, { glow: true });
    // scarf (tail behind, band in front)
    P.part(PP([[-6.2, -17.5], [-3.6, -17.8], [-4.4, -11.5], [-7.4, -12.4]]), [{ poly: [[-6.2, -17.5], [-3.6, -17.8], [-4.4, -11.5], [-7.4, -12.4]], cx: -5.4, cy: -14.8, r: 2.6, col: PAL.scarf[1] }]);
    const band = [[-6.4, -19.4], [6.4, -19.4], [6.8, -16.4], [-6.8, -16.4]];
    P.part(PP(band), [
      { poly: [[-7, -20], [-1.2, -20], [-0.4, -16], [-7, -16]], cx: -3.6, cy: -18, r: 3, col: PAL.scarf[0] },
      { poly: [[-1.2, -20], [7, -20], [7, -16], [-0.4, -16]], cx: 3.2, cy: -18, r: 3.4, col: PAL.scarf[2] },
    ]);
    // stem + leaf
    P.piece((c) => { c.moveTo(-1.6, -31.2); c.quadraticCurveTo(-1.2, -34.5, 0.2, -36.2); c.lineTo(2.6, -35.4); c.quadraticCurveTo(1.4, -33.6, 1.7, -31.2); c.closePath(); }, PAL.stem, 0.4, -33.5, 2.4);
    const L = leafPts(1.2, -33.4, -0.35, 6, 1.7);
    P.part(leafShape(L), leafCells(L, PAL.leaf[0], PAL.leaf[1]));
    // head (pumpkin ribs)
    const hx = 0, hy = -24.6, rx = 10.6, ry = 8.4;
    P.part(ELL(hx, hy, rx, ry), ribCells(hx, hy, rx, ry, [-1.05, -0.64, -0.22, 0.22, 0.64, 1.05], PAL.jackRib));
    // carved glowing face (facing right)
    const fx = 1.5;
    const eyeL = [[-5.9 + fx, -24.2], [-1.7 + fx, -24.2], [-3.9 + fx, -28.4]];
    const eyeR = [[1.5 + fx, -24.2], [5.7 + fx, -24.2], [3.5 + fx, -28.4]];
    const nose = [[-0.9 + fx, -22.2], [0.9 + fx, -22.2], [0 + fx, -23.9]];
    const mouth = [[-6.4 + fx, -21.2], [-4.6 + fx, -20.4], [-3.6 + fx, -21.6], [-2.2 + fx, -20.4], [-0.6 + fx, -21.7], [0.9 + fx, -20.4], [2.4 + fx, -21.6], [3.6 + fx, -20.4], [5.4 + fx, -21.2],
      [4.6 + fx, -18.6], [3.2 + fx, -17.6], [2.2 + fx, -18.8], [0.6 + fx, -17.2], [-1 + fx, -18.6], [-2.4 + fx, -17.4], [-3.6 + fx, -18.8], [-5.2 + fx, -18.4]];
    for (const f of [eyeL, eyeR, nose, mouth]) {
      const inf = polyInfo(f);
      P.piece(PP(f), PAL.face, inf.cx, inf.cy, inf.r * 1.2, { glow: true, ol: 0.5 });
    }
  }

  function turnipPath(c, cx, top, bot, w) {
    const h = bot - top;
    c.moveTo(cx, top);
    c.bezierCurveTo(cx + w * 1.3, top + h * 0.02, cx + w * 1.18, top + h * 0.72, cx + w * 0.16, bot - 1);
    c.quadraticCurveTo(cx + 0.4, bot + 0.6, cx + 1.4, bot + 2.4);
    c.quadraticCurveTo(cx - 0.6, bot + 0.6, cx - w * 0.16, bot - 1);
    c.bezierCurveTo(cx - w * 1.18, top + h * 0.72, cx - w * 1.3, top + h * 0.02, cx, top);
    c.closePath();
  }
  function creeperParts(P, fr, v) {
    const lo = [-1.6, 0, 1.6, 0][fr];
    const sw = [0, 0.12, 0, -0.12][fr];
    // root legs
    P.piece(CAP(-3.2, -4, -4.2 + lo, 0, 1.25, 0.8), PAL.root[1], -3.6, -2, 2);
    P.piece(CAP(3.2, -4, 4.2 - lo, 0, 1.25, 0.8), PAL.root[0], 3.6, -2, 2);
    // leaves (behind bulb top)
    const lv = [[-0.6, -19, -2.1 + sw, 9, 2.4], [0.6, -19, -1.05 + sw, 9, 2.4], [0, -19.5, -1.6 + sw * 0.6, 11, 2.6]];
    lv.forEach((d, i) => {
      const L = leafPts(d[0], d[1], d[2], d[3], d[4]);
      P.part(leafShape(L), leafCells(L, PAL.leaf[(i + 2) % 3], PAL.leaf[(i + 1) % 3]));
    });
    // bulb
    const T = PAL.creepTop[v], C = PAL.cream;
    const cells = [
      { poly: [[-13, -25], [-2, -25], [-4, -12.2], [-6, -11.2], [-13, -12.6]], col: T[0] },
      { poly: [[-2, -25], [4, -25], [3, -12.4], [0, -13.2], [-4, -12.2]], col: T[1] },
      { poly: [[4, -25], [13, -25], [13, -12.6], [6, -11.2], [3, -12.4]], col: T[2] },
      { poly: [[-13, -12.6], [-6, -11.2], [-4, -12.2], [0, -13.2], [1.2, -7], [-1.5, 3], [-13, 3]], col: C[0] },
      { poly: [[0, -13.2], [3, -12.4], [6, -11.2], [13, -12.6], [13, 3], [-1.5, 3], [1.2, -7]], col: C[1] },
    ].map((cl) => {
      const inf = polyInfo(cl.poly);
      // clip info to the bulb
      return { poly: cl.poly, col: cl.col, cx: U.clamp(inf.cx, -6, 6), cy: U.clamp(inf.cy, -18, -5), r: 6.5 };
    });
    P.part((c) => turnipPath(c, 0, -21, -2.4, 9), cells);
    // angry glowing eyes
    const eL = [[-6.2, -11], [-1.6, -9.6], [-2.2, -7.6], [-5.6, -8.2]];
    const eR = [[1.6, -9.6], [6.2, -11], [5.6, -8.2], [2.2, -7.6]];
    for (const e of [eL, eR]) { const inf = polyInfo(e); P.piece(PP(e), '#ff5a26', inf.cx, inf.cy, inf.r * 1.3, { glow: true, ol: 0.5 }); }
    // little frown
    P.detail((c) => { c.strokeStyle = LEAD; c.lineWidth = 0.75; c.beginPath(); c.moveTo(-2, -4.9); c.quadraticCurveTo(0, -6.2, 2, -4.9); c.stroke(); });
  }

  function ghostShape(fr) {
    const ph = (fr / 4) * TAU;
    return (c) => {
      c.moveTo(-7.6, -16.5);
      c.arc(0, -16.5, 7.6, PI, 0);
      c.bezierCurveTo(8.2, -11, 7.4, -7, 5.8 + Math.sin(ph) * 0.8, -2.6);
      const n = 4;
      for (let i = 0; i < n; i++) {
        const x0 = 5.8 - (i / n) * 11.6, x1 = 5.8 - ((i + 1) / n) * 11.6;
        const yy = -1.2 + Math.sin(ph + i * 1.7) * 1.2;
        c.quadraticCurveTo((x0 + x1) / 2, yy + 2.2, x1, -3.4 + Math.sin(ph + (i + 1) * 1.7) * 0.9);
      }
      c.bezierCurveTo(-7.4, -7, -8.2, -11, -7.6, -16.5);
      c.closePath();
    };
  }
  function ghostParts(P, fr) {
    const ph = (fr / 4) * TAU;
    // hungry reaching arm (back)
    P.piece(CAP(4, -12, 10.5, -13.5 + Math.sin(ph) * 0.8, 1.7, 1.1), PAL.opal[1], 7.5, -13, 3);
    const cells = mosaic('ghost', rectPoly(-9, -25, 9, 1), 70, 31, (x, y, i) => PAL.opal[i % PAL.opal.length]);
    P.part(ghostShape(fr), cells, { jitter: 0.06 });
    // hollow eyes + gaping mouth
    P.piece(ELL(-2.6, -17.4, 1.7, 2.3, -0.2), PAL.hollow, -2.6, -17.6, 2.2, { noGlint: true, ol: 0.5 });
    P.piece(ELL(3.2, -17.4, 1.7, 2.3, 0.2), PAL.hollow, 3.2, -17.6, 2.2, { noGlint: true, ol: 0.5 });
    P.piece(ELL(0.6, -11.6, 2.1, 3.0 + Math.sin(ph) * 0.3), PAL.hollow, 0.6, -11.8, 2.6, { noGlint: true, ol: 0.5 });
    P.detail((c) => {
      // cold pupils glimmer
      c.fillStyle = 'rgba(160,220,255,0.9)';
      c.beginPath(); c.arc(-2.3, -16.6, 0.55, 0, TAU); c.arc(3.5, -16.6, 0.55, 0, TAU); c.fill();
    });
  }
  function ghostFade(s, box) {
    const c = s.c.getContext('2d');
    c.save();
    c.globalCompositeOperation = 'destination-out';
    const y0 = (-8 - box[1]) * K, y1 = (1 - box[1]) * K;
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
    c.fillStyle = g; c.fillRect(0, y0, s.c.width, y1 - y0 + 4);
    c.restore();
  }

  function colossusParts(P, fr) {
    const lift = [[0, 0], [3.2, 0], [0, 0], [0, 3.2]][fr];
    const swing = [0, 2.5, 0, -2.5][fr];
    // legs
    P.part(CAP(-8, -14, -8.5, -2.6 - lift[0], 4.4, 4), mosaic('cLegL', rectPoly(-14, -20, -2, 2), 30, 5, (x, y, i) => PAL.brown[i % 5]));
    P.part(CAP(8, -14, 8.5, -2.6 - lift[1], 4.4, 4), mosaic('cLegR', rectPoly(2, -20, 14, 2), 30, 6, (x, y, i) => PAL.brown[(i + 2) % 5]));
    // back arm
    P.part(CAP(-15, -34, -22 - swing * 0.4, -17 + swing, 4.6, 4), mosaic('cArmL', rectPoly(-28, -40, -9, -10), 34, 8, (x, y, i) => PAL.violet[i % 4]));
    // leaf crown
    const lv = [[-2, -46, -2.3, 12, 3], [2, -46, -0.85, 12, 3], [0, -47, -1.57, 14, 3.2], [-4, -45, -2.8, 9, 2.4], [4, -45, -0.35, 9, 2.4]];
    lv.forEach((d, i) => { const L = leafPts(d[0], d[1], d[2], d[3], d[4]); P.part(leafShape(L), leafCells(L, ['#2f6a34', '#3f7f3a', '#275a2c'][i % 3], ['#4a8a3c', '#2a5c30', '#5a9a44'][i % 3])); });
    // body mosaic
    const body = (c) => {
      c.moveTo(0, -49);
      c.bezierCurveTo(16, -48, 23, -38, 21, -26);
      c.bezierCurveTo(19.5, -14, 10, -9, 0, -9);
      c.bezierCurveTo(-10, -9, -19.5, -14, -21, -26);
      c.bezierCurveTo(-23, -38, -16, -48, 0, -49);
      c.closePath();
    };
    const cells = mosaic('cBody', ellPoly(0, -29, 23, 21, 18, 1.08), 78, 13, (x, y, i, r) => (y + (r() - 0.5) * 6 < -31 ? PAL.violet : PAL.brown)[Math.floor(r() * 4)]);
    P.part(body, cells);
    // ruby core (faceted)
    const cx = 0, cy = -24;
    const core = [[cx, cy - 6], [cx + 5, cy], [cx, cy + 6], [cx - 5, cy]];
    P.part(PP(core), [
      { poly: [[cx, cy], [cx, cy - 6], [cx + 5, cy]], col: PAL.ruby[1], cx: cx + 1.6, cy: cy - 2, r: 3, glow: true },
      { poly: [[cx, cy], [cx + 5, cy], [cx, cy + 6]], col: PAL.ruby[0], cx: cx + 1.6, cy: cy + 2, r: 3, glow: true },
      { poly: [[cx, cy], [cx, cy + 6], [cx - 5, cy]], col: PAL.ruby[2], cx: cx - 1.6, cy: cy + 2, r: 3, glow: true },
      { poly: [[cx, cy], [cx - 5, cy], [cx, cy - 6]], col: PAL.ruby[3], cx: cx - 1.6, cy: cy - 2, r: 3, glow: true },
    ]);
    // eyes
    const eL = [[-9.5, -38.4], [-3.2, -36], [-4, -33.6], [-8.8, -35]];
    const eR = [[3.2, -36], [9.5, -38.4], [8.8, -35], [4, -33.6]];
    for (const e of [eL, eR]) { const inf = polyInfo(e); P.piece(PP(e), '#ffb21e', inf.cx, inf.cy, inf.r * 1.3, { glow: true, ol: 0.6 }); }
    // jagged maw
    const m = [[-7, -16.2], [-5, -15], [-3.6, -16.6], [-1.6, -15], [0, -16.8], [1.6, -15], [3.6, -16.6], [5, -15], [7, -16.2], [5.6, -13.4], [0, -12.4], [-5.6, -13.4]];
    P.piece(PP(m), '#3a1a2a', 0, -14.6, 5, { noGlint: true, ol: 0.5 });
    // front arm
    P.part(CAP(15, -34, 22 + swing * 0.4, -17 - swing, 4.6, 4), mosaic('cArmR', rectPoly(9, -40, 28, -10), 34, 9, (x, y, i) => PAL.violet[(i + 1) % 4]));
  }

  function lanternParts(P) {
    const lv = [[-0.5, -12, -2.0, 6, 1.7], [0.5, -12, -1.1, 6, 1.7]];
    lv.forEach((d, i) => { const L = leafPts(d[0], d[1], d[2], d[3], d[4]); P.part(leafShape(L), leafCells(L, PAL.leaf[i], PAL.leaf[(i + 2) % 3])); });
    const cells = [
      { poly: [[-9, -15], [9, -15], [9, -6.6], [-9, -6.6]], col: '#8a4ac0', cx: 0, cy: -10, r: 5 },
      { poly: [[-9, -6.6], [9, -6.6], [9, 3], [-9, 3]], col: '#f2deb0', cx: 0, cy: -3, r: 5 },
    ];
    P.part((c) => turnipPath(c, 0, -13.5, 0, 6), cells);
    const eL = [[-3.6, -7.6], [-0.9, -7.6], [-2.2, -9.8]], eR = [[0.9, -7.6], [3.6, -7.6], [2.2, -9.8]];
    const mo = [[-3.4, -5.4], [3.4, -5.4], [2.2, -3.4], [-2.2, -3.4]];
    for (const f of [eL, eR, mo]) { const inf = polyInfo(f); P.piece(PP(f), '#ffe066', inf.cx, inf.cy, inf.r * 1.4, { glow: true, ol: 0.4 }); }
  }
  function seedParts(P) {
    const sh = (c) => { c.moveTo(4.6, 0); c.bezierCurveTo(2.5, -3.1, -3.2, -3, -3.6, 0); c.bezierCurveTo(-3.2, 3, 2.5, 3.1, 4.6, 0); c.closePath(); };
    P.part(sh, [
      { poly: [[-5, -4], [6, -4], [6, 0.2], [-5, 0.2]], col: '#fff0c4', cx: 0, cy: -1, r: 3 },
      { poly: [[-5, 0.2], [6, 0.2], [6, 4], [-5, 4]], col: '#e6c27a', cx: 0, cy: 1.5, r: 3 },
    ], { noGlint: true });
  }
  function gemParts(P, big) {
    const s = big ? 1.45 : 1;
    const t = [0, -5.4 * s], r = [3.9 * s, -1.4 * s], b = [0, 3.2 * s], l = [-3.9 * s, -1.4 * s], c0 = [0, -1.4 * s];
    const cols = big ? ['#ffe27a', '#f0a82a', '#fff4c0', '#d88a1a'] : ['#8ff6ea', '#3ac6c6', '#c4fff6', '#279fb0'];
    P.part(PP([t, r, b, l]), [
      { poly: [c0, t, r], col: cols[2], cx: c0[0] + 1.2 * s, cy: c0[1] - 1.4 * s, r: 2.4 * s, glow: true },
      { poly: [c0, r, b], col: cols[1], cx: c0[0] + 1.2 * s, cy: c0[1] + 1.2 * s, r: 2.4 * s },
      { poly: [c0, b, l], col: cols[3], cx: c0[0] - 1.2 * s, cy: c0[1] + 1.2 * s, r: 2.4 * s },
      { poly: [c0, l, t], col: cols[0], cx: c0[0] - 1.2 * s, cy: c0[1] - 1.4 * s, r: 2.4 * s, glow: true },
    ], { noGlint: true });
    if (big) P.piece(ELL(0, -1.4 * s, 1.3, 1.3), '#ff3a50', 0, -1.4 * s, 1.3, { glow: true, ol: 0.35 });
  }
  const SHARD_SHAPES = [
    [[-2.6, -1.4], [2.8, -2.2], [0.6, 2.4]],
    [[-2.2, -2.2], [1.6, -1.8], [2.4, 1.6], [-1.2, 2.2]],
    [[-3, 0.4], [0.4, -2.4], [3, 0.8], [0.2, 1.4]],
  ];
  const SHARD_COLS = {
    violet: '#8a4ac0', magenta: '#b8409a', indigo: '#6656c6', cream: '#f2deb0', green: '#58a83c',
    opal: '#e8f0ff', brown: '#7e5a3c', ruby: '#e3203c', orange: '#ff8a22', gold: '#f2c040', aqua: '#6fe8e0', dkviolet: '#5e3a7a',
  };
  function shardParts(P, shape, col) {
    const inf = polyInfo(shape);
    P.part(PP(shape), [{ poly: shape, col, cx: inf.cx, cy: inf.cy, r: inf.r * 1.2 }], { ol: 0.4 });
  }

  /* ================================================================ props */
  const TREE_PAL = [
    ['#d9822b', '#c4601f', '#e8a33a', '#b8452a', '#f0b84a'],   // autumn
    ['#3f8f45', '#55a34c', '#2f7a3f', '#79b04a', '#468a3a'],   // summer
    ['#c2547e', '#d97aa0', '#a8406a', '#e8a0b8', '#b04a8a'],   // blossom
  ];
  /** Foliage cluster: mosaic lobe + a few leaf-shaped pieces with midribs on top. */
  function foliageLobe(P, key, cx, cy, r, pal, seed) {
    const ry = r * 0.9;
    P.part(ELL(cx, cy, r, ry), mosaic(key, ellPoly(cx, cy, r, ry, 12, 1.1), r * r * 0.42, seed, (x, y, i, rnd) => U.mul(U.hex(pal[Math.floor(rnd() * pal.length)]), 0.82 + (cy - y) / r * 0.12)));
    const rnd = U.mulberry32(seed * 7 + 1);
    const n = r > 10 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const a = -PI / 2 + (k - (n - 1) / 2) * 1.15 + (rnd() - 0.5) * 0.5;
      const bx = cx + Math.cos(a + PI) * r * 0.15, by = cy + r * 0.25;
      const L = leafPts(bx, by, a, r * (0.8 + rnd() * 0.2), r * 0.2);
      P.part(leafShape(L), leafCells(L, pal[Math.floor(rnd() * pal.length)], pal[Math.floor(rnd() * pal.length)]), { ol: 0.5 });
    }
  }
  function treeParts(P, v) {
    const trunk = [[-4.8, 0.5], [4.8, 0.5], [3, -14], [6.5, -30], [2, -36], [0.6, -28], [-1.6, -36], [-6, -31], [-3, -14]];
    P.part(PP(trunk), mosaic('trunk', trunk.map((p) => [p[0] * 1.05, p[1] * 1.02]), 16, 3, (x, y, i) => PAL.brown[i % 5]));
    const pal = TREE_PAL[v];
    const lobes = [[0, -64, 15], [-14, -52, 13], [14, -53, 13], [-6, -42, 12], [9, -41, 11.5]];
    lobes.forEach((l, i) => foliageLobe(P, 'lobe' + v + '_' + i, l[0], l[1], l[2], pal, 100 + v * 10 + i));
    // a few fruit jewels
    const fr = [[-8, -50], [6, -60], [12, -44], [-12, -60]];
    fr.forEach((f, i) => { if ((i + v) % 2 === 0) P.piece(ELL(f[0], f[1], 1.6, 1.6), v === 1 ? '#e3203c' : '#f2c040', f[0], f[1], 1.6, { glow: true, ol: 0.5 }); });
  }
  function bushParts(P, v) {
    const pal = v ? TREE_PAL[2] : TREE_PAL[1];
    const lobes = [[0, -12, 7], [-6.5, -7, 6.5], [6.5, -7, 6.5]];
    lobes.forEach((l, i) => foliageLobe(P, 'bush' + v + i, l[0], l[1], l[2], pal, 200 + v * 10 + i));
    [[-3, -9], [3.6, -12.5], [5, -5.5], [-6, -4.5]].forEach((b, i) => P.piece(ELL(b[0], b[1], 1.3, 1.3), v ? '#f2c040' : '#e3203c', b[0], b[1], 1.3, { glow: true, ol: 0.45 }));
  }
  function archParts(P, v) {
    // plinth
    P.part(PP(rectPoly(-19, -6, 19, 0.5)), mosaic('plinth', rectPoly(-19, -6, 19, 0.5), 30, 4, (x, y, i) => PAL.stone[i % 5]));
    // stone frame (pointed arch)
    const outer = archPoly(0, -36, 16, -5.5);
    P.part((c) => archPath(c, 0, -36, 16, -5.5), mosaic('archStone', outer.map((p) => [p[0] * 1.05, p[1] * 1.02]), 30, 5, (x, y, i) => PAL.stone[i % 5]));
    // window (jewel mosaic)
    const win = archPoly(0, -36, 11, -8);
    const jw = v ? ['#2f4fb8', '#7a3aa8', '#2f7fb0', '#e2aa32', '#c4283e'] : PAL.jewel;
    P.part((c) => archPath(c, 0, -36, 11, -8), mosaic('archWin' + v, win.map((p) => [p[0] * 1.03, p[1] * 1.01]), 11, 21 + v, (x, y, i, r) => jw[Math.floor(r() * jw.length)]));
    // mullion
    P.piece(RR(-1.2, -40, 2.4, 32.5, 0.6), PAL.stone[3], 0, -24, 3);
    // rose / quatrefoil
    const qy = -45;
    P.part((c) => { for (const [dx, dy] of [[0, -2.6], [2.6, 0], [0, 2.6], [-2.6, 0]]) { c.moveTo(dx + 2.6, qy + dy); c.arc(dx, qy + dy, 2.6, 0, TAU); } },
      [[0, -2.6], [2.6, 0], [0, 2.6], [-2.6, 0]].map(([dx, dy], i) => ({ path: ELL(dx, qy + dy, 2.6, 2.6), cx: dx, cy: qy + dy, r: 2.6, col: v ? '#e2aa32' : '#2f4fb8' })), { noBorder: false });
    P.piece(ELL(0, qy, 1.5, 1.5), '#e3203c', 0, qy, 1.5, { glow: true, ol: 0.4 });
  }
  const CANDLES = [
    [[-5, 14, 4.4], [2, 10, 4], [7.4, 6.5, 3.6]],
    [[-3, 11, 4.2], [3.6, 7, 3.8]],
  ];
  function candleParts(P, v) {
    P.piece(ELL(0.5, -0.6, 11, 2.8), '#7a5a32', 0, -1, 6, { noGlint: true });
    for (const [x, h, w] of CANDLES[v]) {
      const shape = RR(x - w / 2, -h - 1, w, h + 0.4, w * 0.35);
      P.part(shape, [
        { poly: rectPoly(x - w, -h - 2, x + w, -h + h * 0.4), col: '#fbf0d4', cx: x - 0.5, cy: -h, r: w * 0.8 },
        { poly: rectPoly(x - w, -h + h * 0.4, x + w, 1), col: '#e8d6a8', cx: x - 0.5, cy: -h * 0.4, r: w * 0.9 },
      ], { noGlint: true });
      // flame
      const fy = -h - 1.6;
      P.piece((c) => { c.moveTo(x, fy - 5.6); c.quadraticCurveTo(x + 2.6, fy - 1.4, x, fy + 0.6); c.quadraticCurveTo(x - 2.6, fy - 1.4, x, fy - 5.6); c.closePath(); }, '#ff9a2a', x, fy - 1.8, 2.4, { glow: true, ol: 0.45 });
      P.piece((c) => { c.moveTo(x, fy - 3.4); c.quadraticCurveTo(x + 1.2, fy - 0.9, x, fy); c.quadraticCurveTo(x - 1.2, fy - 0.9, x, fy - 3.4); c.closePath(); }, '#fff2a0', x, fy - 1.2, 1.2, { glow: true, ol: 0.35 });
    }
  }
  function graveParts(P, v) {
    const g = ['#5d6478', '#6b7287', '#525a6c', '#767d92'];
    // moss tufts
    [[-6, -1], [5, -0.6]].forEach(([x, y], i) => { const L = leafPts(x, y, -PI / 2 - 0.5 + i, 4.5, 1.4); P.part(leafShape(L), leafCells(L, '#3f7a3a', '#2f6a34')); });
    if (v === 1) {
      const cross = (c) => { rrect(c, -2.6, -27, 5.2, 27.4, 0.8); rrect(c, -8.5, -21, 17, 5, 0.8); };
      P.part(PP(rectPoly(-2.6, -27, 2.6, 0.4)), mosaic('graveC1', rectPoly(-2.6, -27, 2.6, 0.4), 18, 41, (x, y, i) => g[i % 4]));
      P.part(PP(rectPoly(-8.5, -21, 8.5, -16)), mosaic('graveC2', rectPoly(-8.5, -21, 8.5, -16), 14, 42, (x, y, i) => g[(i + 1) % 4]));
      P.detail((c) => { void cross; });
      P.piece(ELL(0, -18.5, 1.6, 1.6), '#9fd0ff', 0, -18.5, 1.6, { glow: true, ol: 0.4 });
      return;
    }
    const w = v === 2 ? 6 : 7.2, top = v === 2 ? -17 : -15;
    const slab = (c) => { c.moveTo(-w, 0.4); c.lineTo(-w, top); c.arc(0, top, w, PI, 0); c.lineTo(w, 0.4); c.closePath(); };
    P.part(slab, mosaic('grave' + v, rectPoly(-w - 1, top - w - 1, w + 1, 1), 16, 50 + v, (x, y, i) => g[i % 4]));
    // inlaid cross of pale blue glass
    const cy = top + 1;
    P.part((c) => { rrect(c, -1.2, cy - 5, 2.4, 10, 0.4); rrect(c, -3.8, cy - 2.6, 7.6, 2.4, 0.4); }, [
      { poly: rectPoly(-5, cy - 6, 5, cy + 6), col: '#b8d4f4', cx: 0, cy: cy - 1, r: 4, glow: true },
    ], { ol: 0.4 });
  }
  function pumpkinUnit(P, cx, cy, rx, ry, carved, key) {
    P.piece((c) => { c.moveTo(cx - 1.1, cy - ry + 0.8); c.quadraticCurveTo(cx - 0.6, cy - ry - 2.6, cx + 1.2, cy - ry - 3.2); c.lineTo(cx + 2.2, cy - ry - 2.2); c.quadraticCurveTo(cx + 1, cy - ry - 1, cx + 1.2, cy - ry + 0.8); c.closePath(); }, PAL.stem, cx, cy - ry - 1.5, 2);
    P.part(ELL(cx, cy, rx, ry), ribCells(cx, cy, rx, ry, [-1.05, -0.6, -0.2, 0.2, 0.6, 1.05], ['#c85a14', '#e47820', '#f39232', '#e47820', '#c85a14']));
    if (carved) {
      const s = rx / 9;
      const f = [
        [[cx - 4.6 * s, cy - 0.8 * s], [cx - 1.4 * s, cy - 0.8 * s], [cx - 3 * s, cy - 3.6 * s]],
        [[cx + 1.4 * s, cy - 0.8 * s], [cx + 4.6 * s, cy - 0.8 * s], [cx + 3 * s, cy - 3.6 * s]],
        [[cx - 4.6 * s, cy + 1.2 * s], [cx - 2.6 * s, cy + 2 * s], [cx - 1, cy + 1.2 * s], [cx + 1, cy + 2 * s], [cx + 2.8 * s, cy + 1.2 * s], [cx + 4.6 * s, cy + 1.2 * s], [cx + 2.4 * s, cy + 3.6 * s], [cx - 2.4 * s, cy + 3.6 * s]],
      ];
      for (const q of f) { const inf = polyInfo(q); P.piece(PP(q), '#ffd23a', inf.cx, inf.cy, inf.r * 1.3, { glow: true, ol: 0.4 }); }
    }
  }
  function pumpkinParts(P, v) {
    if (v === 2) { pumpkinUnit(P, -5, -5.2, 7, 5.2, false); pumpkinUnit(P, 5.5, -6.6, 9, 6.6, false); return; }
    pumpkinUnit(P, 0, -7, 9.5, 7, v === 1);
  }
  const PROP_DEF = {
    tree: { n: 3, box: [-32, -84, 32, 3], fn: treeParts },
    bush: { n: 2, box: [-16, -22, 16, 3], fn: bushParts },
    arch: { n: 2, box: [-22, -72, 22, 3], fn: archParts },
    candle: { n: 2, box: [-13, -24, 14, 4], fn: candleParts },
    grave: { n: 3, box: [-12, -34, 12, 3], fn: graveParts },
    pump: { n: 3, box: [-15, -20, 16, 3], fn: pumpkinParts },
  };
  // coloured light pools cast on the ground: [dx, dy, rx, ry, rgb, alpha]
  const POOLS = {
    tree: [[[0, 6, 34, 15, [255, 170, 60], 0.2], [-10, 4, 18, 8, [255, 120, 40], 0.12]], [[0, 6, 34, 15, [140, 230, 110], 0.17], [8, 4, 18, 8, [255, 220, 120], 0.1]], [[0, 6, 34, 15, [255, 130, 190], 0.18], [-8, 4, 18, 8, [255, 200, 230], 0.1]]],
    bush: [[[0, 3, 16, 7, [140, 230, 110], 0.12]], [[0, 3, 16, 7, [255, 150, 200], 0.12]]],
    arch: [[[-9, 13, 13, 7, [255, 60, 80], 0.26], [0, 17, 13, 7, [80, 120, 255], 0.26], [9, 13, 13, 7, [255, 200, 70], 0.26], [0, 8, 28, 13, [255, 230, 190], 0.08]],
      [[-9, 13, 13, 7, [80, 120, 255], 0.26], [0, 17, 13, 7, [180, 90, 255], 0.24], [9, 13, 13, 7, [255, 200, 70], 0.26], [0, 8, 28, 13, [220, 230, 255], 0.08]]],
    candle: [[[0, 0, 30, 15, [255, 180, 70], 0.3]], [[0, 0, 26, 13, [255, 180, 70], 0.28]]],
    grave: [[[0, 3, 16, 7, [150, 200, 255], 0.12]], [[0, 3, 16, 7, [150, 200, 255], 0.14]], [[0, 3, 15, 7, [150, 200, 255], 0.12]]],
    pump: [[[0, 3, 15, 7, [255, 150, 50], 0.14]], [[0, 3, 22, 10, [255, 170, 50], 0.28]], [[0, 3, 20, 8, [255, 150, 50], 0.14]]],
  };

  /* ================================================================ ground
     Fields on a 4-unit grid: leaf carpet, night glass, path (across-coordinate), plaza, macro.
     Per pixel: signed distances (value / gradient) -> material by priority + region lead,
     then the material's tessellation (world-anchored Voronoi / path lanes / diamond quarries). */
  const GSTEP = 4, NF = 5;
  const PATH_HALF = 21, LANE = 7;
  const LW = 0.78, LWR = 1.2;           // lead half widths (pieces / region borders)
  const DQ = 17;                         // diamond quarry spacing
  const MAT_MEADOW = 0, MAT_LEAF = 1, MAT_NIGHT = 2, MAT_PATH = 3, MAT_PLAZA = 4;
  function fieldsAt(x, y, out) {
    out[0] = U.warped(x / 640 + 3.1, y / 640 - 7.7, 23, 1.1, 3) - 0.565;
    out[1] = U.warped(x / 860 - 11.3, y / 860 + 4.2, 37, 1.2, 3) - 0.585;
    const w = U.fbm(x / 1000, y / 1000, 61, 2) - 0.5;
    out[2] = U.fbm(x / 1150 + w * 1.1 + 0.37, y / 1150 - w * 0.9 + 0.11, 11, 2) - 0.5;
    out[3] = U.fbm(x / 520 + 21.7, y / 520 + 5.3, 51, 2) - 0.66;
    out[4] = U.fbm(x / 1150, y / 1150, 77, 2);
  }
  // world-anchored field nodes (shared by chunks + decal/prop material lookups -> identical decisions)
  const NODES = new Map();
  function node(i, j) {
    const key = (i + 40000) * 80000 + (j + 40000);
    let f = NODES.get(key);
    if (!f) {
      if (NODES.size > 60000) NODES.clear();
      f = new Float32Array(NF);
      fieldsAt(i * GSTEP, j * GSTEP, f);
      NODES.set(key, f);
    }
    return f;
  }
  function nodeD(a, b, c, d, L, u, v, path) {
    const A = a[L], B = b[L], C = c[L], D = d[L];
    const s0 = A + (B - A) * u, s1 = C + (D - C) * u, s = s0 + (s1 - s0) * v;
    const du = (B - A) * (1 - v) + (D - C) * v, dv = (C - A) * (1 - u) + (D - B) * u;
    const g = Math.sqrt(du * du + dv * dv) / GSTEP;
    if (path) return g > 1e-9 ? PATH_HALF - Math.abs(s) / g : -99;
    return g > 1e-9 ? s / g : s > 0 ? 99 : -99;
  }
  /** Material at a world point – same bilinear field model as the chunk pixels. */
  function matAt(x, y) {
    const fx = x / GSTEP, fy = y / GSTEP, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    const a = node(i, j), b = node(i + 1, j), c = node(i, j + 1), d = node(i + 1, j + 1);
    if (nodeD(a, b, c, d, 3, u, v) > 0) return MAT_PLAZA;
    if (nodeD(a, b, c, d, 2, u, v, true) > 0) return MAT_PATH;
    if (nodeD(a, b, c, d, 1, u, v) > 0) return MAT_NIGHT;
    if (nodeD(a, b, c, d, 0, u, v) > 0) return MAT_LEAF;
    return MAT_MEADOW;
  }
  function matSafe(x, y, r) {
    const m = matAt(x, y);
    if (matAt(x + r, y) !== m || matAt(x - r, y) !== m || matAt(x, y + r) !== m || matAt(x, y - r) !== m) return -1;
    return m;
  }

  const hexs = (arr) => arr.map((h) => U.hex(h));
  const GP = [
    { pal: hexs(['#2a6e48', '#327a4e', '#265f44', '#3a8250', '#2a7058', '#2f6c40']), alt: hexs(['#55702f', '#5f7a33', '#4c652b', '#687f38', '#59702d']) },
    { pal: hexs(['#8e2a3c', '#a23a4e', '#7c2234', '#ad4c38', '#963046', '#a35c2c', '#b0405a']) },
    { pal: hexs(['#28388a', '#304296', '#3a2e86', '#46348e', '#243478', '#2c4e90', '#383a92']) },
    { lanes: [hexs(['#a8742e', '#b07c33', '#9c6a2a', '#b5813a']), hexs(['#c28a38', '#cf9a44', '#b98034', '#d4a24c']), hexs(['#a8742e', '#b07c33', '#9c6a2a', '#b5813a'])] },
    { pal: hexs(['#5c6884', '#646e8a', '#6c7088', '#58647e', '#6a6486', '#62727e']) },
  ];
  const TESS = [
    { C: 20, seed: 101, mat: 0 },
    { C: 15, seed: 202, mat: 1 },
    { C: 23, seed: 303, mat: 2 },
    { C: 30, seed: 404, mat: 3 },
  ];
  function* buildSites(info, T) {
    const C = T.C;
    const gx0 = Math.floor(info.wx / C) - 2, gy0 = Math.floor(info.wy / C) - 2;
    const gw = Math.ceil(info.size / C) + 7;
    const n = gw * gw;
    const col = new Float32Array(n * 9), ph = new Float32Array(n);
    const sx = new Float32Array(n), sy = new Float32Array(n), id = new Uint32Array(n), alt = new Uint8Array(n), dc = new Float32Array(n), ds = new Float32Array(n), fr = new Float32Array(n), br = new Float32Array(n);
    for (let j = 0; j < gw; j++) {
      for (let i = 0; i < gw; i++) {
        const cx = gx0 + i, cy = gy0 + j;
        const h = U.hashInt(cx, cy, T.seed);
        const k = j * gw + i;
        sx[k] = (cx + 0.08 + ((h & 1023) / 1023) * 0.84) * C;
        sy[k] = (cy + 0.08 + (((h >>> 10) & 1023) / 1023) * 0.84) * C;
        const h2 = U.hashInt(cx, cy, T.seed + 7);
        id[k] = h2;
        const a = ((h2 & 255) / 256) * PI;
        dc[k] = Math.cos(a); ds[k] = Math.sin(a);
        fr[k] = 0.45 + ((h2 >>> 8) & 255) / 256 * 0.6;
        br[k] = 0.93 + ((h2 >>> 16) & 255) / 256 * 0.14;
        if (T.seed === 101) alt[k] = ((h2 >>> 24) & 255) / 256 < U.smoothstep(0.42, 0.6, U.fbm(sx[k] / 380, sy[k] / 380, 91, 2)) ? 1 : 0;
        for (let lane = 0; lane < 3; lane++) {
          let c;
          if (T.mat === MAT_PATH) { const pal = GP[3].lanes[lane]; c = pal[(h2 >>> (lane * 5)) % pal.length]; }
          else if (T.mat === MAT_MEADOW && alt[k]) c = GP[0].alt[h2 % GP[0].alt.length];
          else { const pal = GP[T.mat].pal; c = pal[h2 % pal.length]; }
          const o = k * 9 + lane * 3;
          col[o] = c[0] * br[k]; col[o + 1] = c[1] * br[k]; col[o + 2] = c[2] * br[k];
          if (T.mat !== MAT_PATH) break;
        }
        ph[k] = (h2 & 63);
      }
      if ((j & 7) === 7) yield;
    }
    return { C, iC: 1 / C, gx0, gy0, gw, sx, sy, id, alt, dc, ds, fr, br, col, ph };
  }

  function smin(a, b, k) {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  }

  const LD0 = 28, LD1 = 24, LD2 = 34, LL0 = 84, LL1 = 78, LL2 = 96;
  const SIN = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) SIN[i] = Math.sin((i / 1024) * TAU);
  const SINK = 1024 / TAU;
  /** distance (world units) of layer L at a pixel: bilinear value / bilinear gradient */
  function layerD(F, o00, o10, o01, o11, L, u, v) {
    const A = F[o00 + L], B = F[o10 + L], C = F[o01 + L], D = F[o11 + L];
    const s0 = A + (B - A) * u, s1 = C + (D - C) * u, s = s0 + (s1 - s0) * v;
    const du = (B - A) * (1 - v) + (D - C) * v, dv = (C - A) * (1 - u) + (D - B) * u;
    const g = Math.sqrt(du * du + dv * dv) / GSTEP;
    return g > 1e-9 ? s / g : s > 0 ? 99 : -99;
  }
  /** Classify grid cells: 0..4 = whole cell is that material and far from any region border, 255 = per pixel. */
  function classifyCells(F, nn, nc, flags) {
    const M = GSTEP * 1.6 + LWR + 1.5;
    const d = new Float32Array(4);
    const st = new Int8Array(4);
    for (let gy = 0; gy < nc; gy++) {
      for (let gx = 0; gx < nc; gx++) {
        const o00 = (gy * nn + gx) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF;
        for (let L = 0; L < 4; L++) {
          const A = F[o00 + L], B = F[o10 + L], C = F[o01 + L], D = F[o11 + L];
          const gxm = (B - A + D - C) * 0.5, gym = (C - A + D - B) * 0.5;
          const g = Math.sqrt(gxm * gxm + gym * gym) / GSTEP + 1e-9;
          if (L === 2) {
            d[0] = PATH_HALF - Math.abs(A) / g; d[1] = PATH_HALF - Math.abs(B) / g;
            d[2] = PATH_HALF - Math.abs(C) / g; d[3] = PATH_HALF - Math.abs(D) / g;
          } else { d[0] = A / g; d[1] = B / g; d[2] = C / g; d[3] = D / g; }
          const mn = Math.min(d[0], d[1], d[2], d[3]), mx = Math.max(d[0], d[1], d[2], d[3]);
          st[L] = mn > M ? 1 : mx < -M ? -1 : 0;
        }
        let mat = -1;
        if (st[3] === 1) mat = MAT_PLAZA;
        else if (st[3] === -1) {
          if (st[2] === 1) mat = MAT_PATH;
          else if (st[2] === -1) {
            if (st[1] === 1) mat = MAT_NIGHT;
            else if (st[1] === -1) mat = st[0] === 1 ? MAT_LEAF : st[0] === -1 ? MAT_MEADOW : -1;
          }
        }
        flags[gy * nc + gx] = mat < 0 ? 255 : mat;
      }
    }
  }
  /** One chunk row of glass (plain function: generator locals would box every double). */
  function pixelRow(st, py) {
    const res = st.res, Wp = st.Wp, wx = st.wx, wy = st.wy, cpx = st.cpx, nn = st.nn, nc = st.nc, F = st.F, sites = st.sites, buf = st.buf, inv = st.inv, flags = st.flags;
    const y = wy + (py + 0.5) * inv;
    const gyf = (py + 0.5) / cpx, gy0 = gyf | 0, v = gyf - gy0;
    for (let px = 0; px < Wp; px++) {
      const x = wx + (px + 0.5) * inv;
      const gxf = (px + 0.5) / cpx, gx0 = gxf | 0, u = gxf - gx0;
      const o00 = (gy0 * nn + gx0) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF;
      const fl = flags[gy0 * nc + gx0];
      let mat, re = 99, across = 0;
      if (fl !== 255) {
        mat = fl;
        if (mat === MAT_PATH) across = layerD(F, o00, o10, o01, o11, 2, u, v);
      } else {
        const dL = layerD(F, o00, o10, o01, o11, 0, u, v);
        const dN = layerD(F, o00, o10, o01, o11, 1, u, v);
        across = layerD(F, o00, o10, o01, o11, 2, u, v);
        const dPl = layerD(F, o00, o10, o01, o11, 3, u, v);
        const dPa = PATH_HALF - Math.abs(across);
        if (dPl > 0) { mat = MAT_PLAZA; re = dPl; }
        else if (dPa > 0) { mat = MAT_PATH; re = Math.min(dPa, -dPl); }
        else if (dN > 0) { mat = MAT_NIGHT; re = Math.min(dN, -dPa, -dPl); }
        else if (dL > 0) { mat = MAT_LEAF; re = Math.min(dL, -dN, -dPa, -dPl); }
        else { mat = MAT_MEADOW; re = Math.min(-dL, -dN, -dPa, -dPl); }
      }
      const m0 = F[o00 + 4] + (F[o10 + 4] - F[o00 + 4]) * u;
      const m1 = F[o01 + 4] + (F[o11 + 4] - F[o01 + 4]) * u;
      const mt = m0 + (m1 - m0) * v;

      let eP, cr, cg, cb, R, streak;
      if (mat === MAT_PLAZA) {
        const qu = (x + y) / DQ, qv = (x - y) / DQ;
        const iu = Math.floor(qu), iv = Math.floor(qv);
        const fu = qu - iu, fv = qv - iv;
        eP = Math.min(fu, 1 - fu, fv, 1 - fv) * DQ * 0.7071;
        const h = U.hashInt(iu, iv, 505);
        const pal = GP[4].pal, c = pal[h % pal.length];
        const b = 0.94 + ((h >>> 8) & 255) / 256 * 0.12;
        cr = c[0] * b; cg = c[1] * b; cb = c[2] * b;
        const w1 = SIN[((y * 0.9 * SINK) | 0) & 1023], w2 = SIN[((x * 0.7 * SINK) | 0) & 1023];
        streak = 1 + 0.045 * SIN[(((x * 1.3 + w1 * 2) * SINK) | 0) & 1023] * SIN[(((y * 1.1 + w2 * 2) * SINK) | 0) & 1023];
        R = 4.2;
      } else {
        const T = sites[mat], gw = T.gw, sx = T.sx, sy = T.sy;
        const ix = Math.floor(x * T.iC) - T.gx0, iy = Math.floor(y * T.iC) - T.gy0;
        let b1 = 1e18, b2 = 1e18, b3 = 1e18, k1 = 0, k2 = 0, k3 = 0;
        for (let j = -1; j <= 1; j++) {
          const row = (iy + j) * gw + ix;
          for (let i = -1; i <= 1; i++) {
            const k = row + i;
            const dx = sx[k] - x, dy = sy[k] - y, d = dx * dx + dy * dy;
            if (d < b1) { b3 = b2; k3 = k2; b2 = b1; k2 = k1; b1 = d; k1 = k; }
            else if (d < b2) { b3 = b2; k3 = k2; b2 = d; k2 = k; }
            else if (d < b3) { b3 = d; k3 = k; }
          }
        }
        const bx = sx[k1], by = sy[k1];
        let nx = sx[k2] - bx, ny = sy[k2] - by;
        const e1 = (b2 - b1) / (2 * Math.sqrt(nx * nx + ny * ny));
        nx = sx[k3] - bx; ny = sy[k3] - by;
        const e2 = (b3 - b1) / (2 * Math.sqrt(nx * nx + ny * ny));
        eP = smin(e1, e2, 1.6);
        let o = k1 * 9;
        if (mat === MAT_PATH) {
          const lane = across < -LANE ? 0 : across > LANE ? 2 : 1;
          const el = Math.min(Math.abs(across - LANE), Math.abs(across + LANE));
          if (el < eP) eP = el;
          o += lane * 3;
        }
        const col = T.col;
        cr = col[o]; cg = col[o + 1]; cb = col[o + 2];
        streak = 1 + 0.055 * SIN[((((x * T.dc[k1] + y * T.ds[k1]) * T.fr[k1] + T.ph[k1]) * SINK) | 0) & 1023];
        R = T.C * 0.34;
      }
      const e = eP < re ? eP : re;
      let t = e / R; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const lum = (0.6 + 0.38 * t * t * (3 - 2 * t)) * streak * (0.86 + (mt - 0.3) * 0.5);
      let r = cr * lum, g = cg * lum, b = cb * lum;
      const cov = Math.max(LW - eP, LWR - re) * res + 0.5;
      if (cov > 0) {
        const k = cov > 1 ? 1 : cov;
        let tl = Math.max(1 - eP / LW, 1 - re / LWR);
        tl = tl < 0 ? 0 : tl > 1 ? 1 : tl;
        const q = tl * tl * 0.85;
        r += (LD0 + (LL0 - LD0) * q - r) * k; g += (LD1 + (LL1 - LD1) * q - g) * k; b += (LD2 + (LL2 - LD2) * q - b) * k;
      }
      r = r > 255 ? 255 : r; g = g > 255 ? 255 : g; b = b > 255 ? 255 : b;
      buf[py * Wp + px] = 0xff000000 | (b << 16) | (g << 8) | r;
    }
  }

  function* groundPixels(ctx, info) {
    const res = info.res, Wp = info.px, wx = info.wx, wy = info.wy;
    const cpx = GSTEP * res;
    const nc = Math.ceil(Wp / cpx - 1e-6) + 1;
    const nn = nc + 1;
    const F = new Float32Array(nn * nn * NF);
    const ni = Math.round(wx / GSTEP), nj = Math.round(wy / GSTEP);
    for (let j = 0; j < nn; j++) {
      for (let i = 0; i < nn; i++) {
        const f = node(ni + i, nj + j);
        const o = (j * nn + i) * NF;
        for (let k = 0; k < NF; k++) F[o + k] = f[k];
      }
      if ((j & 3) === 3) yield;
    }
    const flags = new Uint8Array(nc * nc);
    classifyCells(F, nn, nc, flags);
    yield;
    const sites = [];
    for (const T of TESS) sites.push(yield* buildSites(info, T));
    const img = ctx.createImageData(Wp, Wp);
    const buf = new Uint32Array(img.data.buffer);
    const st = { res, Wp, wx, wy, cpx, nn, nc, F, sites, buf, inv: 1 / res, flags };
    for (let py = 0; py < Wp; py++) {
      pixelRow(st, py);
      if ((py & 1) === 1) yield;
    }
    for (let b = 0; b < Wp; b += 128) { ctx.putImageData(img, 0, 0, 0, b, Wp, Math.min(128, Wp - b)); yield; }
  }

  /* ----------------------------------------------------------- decals */
  function glassBlob(c, pathFn, col, cx, cy, r, lw) {
    const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r * 1.25);
    g.addColorStop(0, U.rgb(U.mix(col, [255, 255, 255], 0.35))); g.addColorStop(0.5, U.rgb(col)); g.addColorStop(1, U.rgb(U.mul(col, 0.66)));
    c.beginPath(); pathFn(c);
    c.fillStyle = g; c.fill();
    c.lineWidth = lw; c.strokeStyle = LEAD; c.stroke();
  }
  const FLOWER_COLS = hexs(['#e8668a', '#f2c040', '#7ab8f0', '#efe6ff', '#c87ae8']);
  function dFlower(c, x, y, s, rng) {
    const col = FLOWER_COLS[Math.floor(rng.next() * FLOWER_COLS.length)];
    c.save(); c.translate(x, y); c.scale(s, s * 0.8);
    c.lineJoin = 'round';
    // two leaves
    const la = rng.next() * TAU;
    for (let k = 0; k < 2; k++) {
      const L = leafPts(0, 0, la + k * PI + 0.4, 6.5, 1.8);
      glassBlob(c, leafShape(L), [70, 140, 70], L.mx, L.my, 3, 0.55);
      c.beginPath(); c.moveTo(L.bx, L.by); c.lineTo(L.tx, L.ty); c.lineWidth = 0.45; c.strokeStyle = LEAD; c.stroke();
    }
    const n = 5, rot = rng.next() * TAU;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      const px = Math.cos(a) * 2.5, py = Math.sin(a) * 2.5;
      glassBlob(c, ELL(px, py, 2.4, 1.5, a), U.mul(col, 0.92 + (i % 2) * 0.12), px, py, 2.2, 0.55);
    }
    glassBlob(c, ELL(0, 0, 1.35, 1.35), [240, 150, 40], 0, 0, 1.4, 0.55);
    c.restore();
  }
  const LEAFD_COLS = hexs(['#e09a30', '#d0602a', '#f2c040', '#b8402a', '#e87a3a']);
  function dLeaf(c, x, y, s, rng) {
    const col = LEAFD_COLS[Math.floor(rng.next() * LEAFD_COLS.length)];
    const L = leafPts(x, y, rng.next() * TAU, 7 * s, 2.2 * s);
    c.lineJoin = 'round';
    glassBlob(c, leafShape(L), col, L.mx, L.my, 3.5 * s, 0.6);
    c.beginPath(); c.moveTo(L.bx, L.by); c.lineTo(L.tx, L.ty); c.lineWidth = 0.5; c.strokeStyle = LEAD; c.stroke();
  }
  function dStar(c, x, y, s, rng) {
    const p = starPts(5, 3.2 * s, 1.35 * s, x, y, rng.next() * TAU);
    c.lineJoin = 'round';
    glassBlob(c, PP(p), [255, 214, 96], x, y, 3 * s, 0.6);
  }
  function dRoundel(c, x, y, s) {
    c.lineJoin = 'round';
    glassBlob(c, ELL(x, y, 3.4 * s, 3.4 * s * 0.85), [214, 160, 70], x, y, 3.4 * s, 0.65);
    glassBlob(c, ELL(x, y, 1.6 * s, 1.6 * s * 0.85), [250, 214, 120], x, y, 1.6 * s, 0.5);
  }
  function* decals(ctx, info) {
    let n = 0;
    const c = ctx;
    // meadow flowers
    G.scatter(info, 44, 9001, 10, (x, y, rng) => {
      if (rng.next() > 0.42) return;
      if (matSafe(x, y, 8) !== MAT_MEADOW) return;
      dFlower(c, x, y, 0.8 + rng.next() * 0.35, rng);
    });
    yield;
    // leaf carpet leaves
    G.scatter(info, 36, 9002, 8, (x, y, rng) => {
      if (rng.next() > 0.5) return;
      if (matSafe(x, y, 6) !== MAT_LEAF) return;
      dLeaf(c, x, y, 0.8 + rng.next() * 0.4, rng);
    });
    yield;
    // night stars
    G.scatter(info, 40, 9003, 6, (x, y, rng) => {
      if (rng.next() > 0.5) return;
      if (matSafe(x, y, 5) !== MAT_NIGHT) return;
      dStar(c, x, y, 0.7 + rng.next() * 0.45, rng);
    });
    yield;
    // path roundels
    G.scatter(info, 54, 9004, 6, (x, y, rng) => {
      if (rng.next() > 0.35) return;
      if (matSafe(x, y, 5) !== MAT_PATH) return;
      dRoundel(c, x, y, 0.8 + rng.next() * 0.3);
    });
    yield;
    // seedy bubbles in clear glass
    c.lineWidth = 0.28;
    G.scatter(info, 8, 9005, 2, (x, y, rng) => {
      if (rng.next() > 0.45) return;
      n++;
      if (matAt(x, y) !== MAT_PLAZA) return;
      const r = 0.35 + rng.next() * 0.6;
      c.fillStyle = 'rgba(40,40,60,0.18)';
      c.beginPath(); c.arc(x + 0.2, y + 0.2, r, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, TAU); c.fill();
    });
    yield;
    // glints (reflections) everywhere
    c.lineCap = 'round';
    G.scatter(info, 24, 9006, 4, (x, y, rng) => {
      if (rng.next() > 0.32) return;
      const l = 1.6 + rng.next() * 2.4;
      c.strokeStyle = 'rgba(255,255,255,0.2)'; c.lineWidth = 0.55;
      c.beginPath(); c.moveTo(x - l * 0.7, y + l * 0.7); c.lineTo(x + l * 0.7, y - l * 0.7); c.stroke();
      if (rng.next() < 0.4) { c.beginPath(); c.moveTo(x - l * 0.3 + 1.2, y + l * 0.3 + 1.2); c.lineTo(x + l * 0.3 + 1.2, y - l * 0.3 + 1.2); c.stroke(); }
    });
    yield;
    // prop light pools + contact shadows (same placement as propsForChunk)
    G.scatter(info, PROP_CELL, PROP_SEED, 60, (x, y, rng) => {
      const p = propAt(x, y, rng);
      if (!p) return;
      c.fillStyle = 'rgba(16,12,24,0.38)';
      const sh = PROP_SH[p.t];
      c.beginPath(); c.ellipse(x, y + 0.5, sh[0], sh[1], 0, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter';
      for (const pl of POOLS[p.t][p.v]) {
        c.save();
        c.translate(x + pl[0] * (p.f ? -1 : 1), y + pl[1]);
        c.scale(1, pl[3] / pl[2]);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, pl[2]);
        g.addColorStop(0, U.rgb(pl[4], pl[5])); g.addColorStop(0.5, U.rgb(pl[4], pl[5] * 0.45)); g.addColorStop(1, U.rgb(pl[4], 0));
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, pl[2], 0, TAU); c.fill();
        c.restore();
      }
      c.globalCompositeOperation = 'source-over';
    });
    yield;
  }

  /* ----------------------------------------------------------- props */
  const PROP_CELL = 92, PROP_SEED = 4747;
  const PROP_SH = { tree: [10, 3.6], bush: [11, 3], arch: [19, 3.4], candle: [10, 2.6], grave: [8.5, 2.6], pump: [10, 3] };
  function propAt(x, y, rng) {
    if (G.nearSpawn(x, y, 100)) return null;
    const r = rng.next(), vr = rng.next(), f = rng.next() < 0.5;
    const m = matAt(x, y);
    let t = null, v = 0;
    if (m === MAT_MEADOW) {
      if (r < 0.1) { t = 'tree'; v = vr < 0.6 ? 1 : 2; }
      else if (r < 0.2) { t = 'bush'; v = vr < 0.7 ? 0 : 1; }
      else if (r < 0.26) { t = 'pump'; v = vr < 0.4 ? 0 : vr < 0.7 ? 2 : 1; }
      else if (r < 0.28) { t = 'candle'; v = vr < 0.5 ? 0 : 1; }
    } else if (m === MAT_LEAF) {
      if (r < 0.15) { t = 'tree'; v = 0; }
      else if (r < 0.26) { t = 'pump'; v = vr < 0.35 ? 1 : vr < 0.7 ? 2 : 0; }
      else if (r < 0.3) { t = 'bush'; v = 1; }
    } else if (m === MAT_NIGHT) {
      if (r < 0.12) { t = 'grave'; v = (vr * 3) | 0; }
      else if (r < 0.18) { t = 'candle'; v = vr < 0.5 ? 0 : 1; }
      else if (r < 0.22) { t = 'arch'; v = 1; }
      else if (r < 0.25) { t = 'tree'; v = 2; }
    } else if (m === MAT_PLAZA) {
      if (r < 0.16) { t = 'arch'; v = vr < 0.5 ? 0 : 1; }
      else if (r < 0.26) { t = 'candle'; v = vr < 0.5 ? 0 : 1; }
      else if (r < 0.3) { t = 'grave'; v = 1; }
    }
    if (!t) return null;
    return { t, v, f };
  }

  /* ========================================================== draw helpers */
  let TV = null;
  const TF = { S: 1, ox: 0, oy: 0 };
  function tf(view) {
    if (TV !== view) { TV = view; TF.S = view.S; TF.ox = view.W / 2 - view.x * view.S; TF.oy = view.H / 2 - view.y * view.S; }
    return TF;
  }
  function blit(ctx, V, s, x, y, sx, sy, rot) {
    const S = V.S, k = 1 / K;
    if (rot) {
      const co = Math.cos(rot) * S, si = Math.sin(rot) * S;
      ctx.setTransform(co * sx, si * sx, -si * sy, co * sy, V.ox + x * S, V.oy + y * S);
    } else ctx.setTransform(S * sx, 0, 0, S * sy, V.ox + x * S, V.oy + y * S);
    ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }
  function glow(ctx, V, s, x, y, sc, a) {
    if (a <= 0.003) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a);
    blit(ctx, V, s, x, y, sc, sc, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  function glowSprite(rgb, r) {
    return plain([-r, -r, r, r], (c) => {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, U.rgb(rgb, 0.9)); g.addColorStop(0.25, U.rgb(rgb, 0.45)); g.addColorStop(0.6, U.rgb(rgb, 0.12)); g.addColorStop(1, U.rgb(rgb, 0));
      c.fillStyle = g; c.fillRect(-r, -r, 2 * r, 2 * r);
    });
  }
  function glintSprite(rgb) {
    return plain([-8, -8, 8, 8], (c) => {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 3);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, U.rgb(rgb, 0.7)); g.addColorStop(1, U.rgb(rgb, 0));
      c.fillStyle = g; c.fillRect(-3, -3, 6, 6);
      c.fillStyle = U.rgb(U.mix(rgb, [255, 255, 255], 0.6), 0.95);
      c.beginPath();
      c.moveTo(0, -7.5); c.quadraticCurveTo(0.35, -0.35, 7.5, 0); c.quadraticCurveTo(0.35, 0.35, 0, 7.5);
      c.quadraticCurveTo(-0.35, 0.35, -7.5, 0); c.quadraticCurveTo(-0.35, -0.35, 0, -7.5); c.fill();
    });
  }

  /* damage numbers: Cinzel Decorative in leaded glass */
  const numCache = new Map();
  let fontOK = false, fontCheckT = -1;
  const NUM_FONT = 'Cinzel Decorative';
  function fontReady(rt) {
    if (fontOK) return true;
    if (fontCheckT >= 0 && rt - fontCheckT < 0.5) return false;
    fontCheckT = rt;
    if (document.fonts) document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === NUM_FONT && f.status === 'loaded' && (f.weight === '900' || f.weight === '700')) fontOK = true; });
    if (fontOK) numCache.clear();
    return fontOK;
  }
  function numSprite(value, crit, rt) {
    const ok = fontReady(rt);
    const key = value + (crit ? 'c' : 'n') + (ok ? 'L' : 'F');
    let s = numCache.get(key);
    if (s) return s;
    if (numCache.size > 400) numCache.clear();
    const fs = (crit ? 12.5 : 9.2) * K;
    const font = '900 ' + fs + 'px "' + NUM_FONT + '", "Cinzel", Georgia, serif';
    const meas = U.canvas(4, 4).ctx;
    meas.font = font;
    const txt = String(value);
    const w = Math.ceil(meas.measureText(txt).width + fs * 0.8), h = Math.ceil(fs * 1.6);
    const { c, ctx } = U.canvas(w, h);
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = LEAD; ctx.lineWidth = fs * 0.26;
    ctx.strokeText(txt, cx, cy + fs * 0.06);
    ctx.strokeText(txt, cx, cy);
    const g = ctx.createLinearGradient(0, cy - fs * 0.45, 0, cy + fs * 0.4);
    if (crit) { g.addColorStop(0, '#fff6c0'); g.addColorStop(0.45, '#ffcf40'); g.addColorStop(1, '#ff7a1a'); }
    else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#e6eeff'); g.addColorStop(1, '#a9c0ee'); }
    ctx.fillStyle = g; ctx.fillText(txt, cx, cy);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, cy - fs * 0.5, w, fs * 0.22);
    s = { c, ox: w / 2, oy: h / 2 };
    numCache.set(key, s);
    return s;
  }

  /* ============================================================== overlay */
  let OV = null;
  function buildOverlay(W, H) {
    const a = U.canvas(W, H), c = a.ctx;
    // vignette like the deep window embrasure
    const R = Math.hypot(W, H) * 0.56;
    const g = c.createRadialGradient(W / 2, H * 0.5, H * 0.28, W / 2, H * 0.5, R);
    g.addColorStop(0, 'rgba(14,8,26,0)'); g.addColorStop(0.55, 'rgba(14,8,26,0.1)'); g.addColorStop(0.85, 'rgba(14,8,26,0.36)'); g.addColorStop(1, 'rgba(10,6,20,0.62)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // window frame: a thin lead border + gold fillet near the edge
    const s = H / 900;
    c.strokeStyle = 'rgba(16,12,22,0.85)'; c.lineWidth = 10 * s; c.strokeRect(5 * s, 5 * s, W - 10 * s, H - 10 * s);
    c.strokeStyle = 'rgba(214,170,80,0.35)'; c.lineWidth = 2 * s; c.strokeRect(11 * s, 11 * s, W - 22 * s, H - 22 * s);
    // corner rosettes
    for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) {
      const cg = c.createRadialGradient(x, y, 0, x, y, 110 * s);
      cg.addColorStop(0, 'rgba(10,6,20,0.55)'); cg.addColorStop(1, 'rgba(10,6,20,0)');
      c.fillStyle = cg; c.fillRect(x - 110 * s, y - 110 * s, 220 * s, 220 * s);
    }
    // fine glass ripple texture (screen-anchored like the pane itself)
    const rnd = U.mulberry32(77);
    c.lineWidth = 1.2 * s;
    for (let i = 0; i < 70; i++) {
      const y = rnd() * H, amp = (6 + rnd() * 14) * s, ph = rnd() * TAU, fq = (0.004 + rnd() * 0.006) / s;
      c.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,20,0.03)';
      c.beginPath();
      for (let x = 0; x <= W; x += 24) { const yy = y + Math.sin(x * fq + ph) * amp; if (x === 0) c.moveTo(x, yy); else c.lineTo(x, yy); }
      c.stroke();
    }
    // light layer (added): warm centre + coloured diagonal rays, half resolution
    const lw = Math.ceil(W * 0.55), lh = Math.ceil(H * 0.5);
    const l = U.canvas(lw, lh), lc = l.ctx;
    const cg = lc.createRadialGradient(lw / 2, lh * 0.45, 0, lw / 2, lh * 0.45, lh * 0.75);
    cg.addColorStop(0, 'rgba(255,226,170,0.16)'); cg.addColorStop(1, 'rgba(255,226,170,0)');
    lc.fillStyle = cg; lc.fillRect(0, 0, lw, lh);
    const rays = [[0.12, [255, 120, 140]], [0.3, [255, 210, 120]], [0.47, [120, 170, 255]], [0.66, [255, 190, 110]], [0.86, [190, 140, 255]]];
    for (const [fx, col] of rays) {
      const x0 = fx * lw * 1.1 - lw * 0.15, wdt = lw * (0.05 + rnd() * 0.05);
      const rg = lc.createLinearGradient(0, 0, 0, lh);
      rg.addColorStop(0, U.rgb(col, 0.075)); rg.addColorStop(0.7, U.rgb(col, 0.028)); rg.addColorStop(1, U.rgb(col, 0));
      lc.fillStyle = rg;
      lc.beginPath(); lc.moveTo(x0, 0); lc.lineTo(x0 + wdt, 0); lc.lineTo(x0 + wdt + lh * 0.45, lh); lc.lineTo(x0 + lh * 0.45 - wdt * 0.2, lh); lc.closePath(); lc.fill();
    }
    OV = { W, H, dark: a.c, light: l.c };
  }

  /* ================================================================ icons */
  function iconPaint(ctx, fn) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'outline', 2.0, 1.15, 5));
    fn(new Painter(ctx, 'fill', 2.0, 1.15, 5));
  }
  function iconSeed(P, x, y, a, s, key) {
    const sh = (c) => { c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s); c.moveTo(4.6, 0); c.bezierCurveTo(2.5, -3.1, -3.2, -3, -3.6, 0); c.bezierCurveTo(-3.2, 3, 2.5, 3.1, 4.6, 0); c.closePath(); c.restore(); };
    P.part(sh, [{ path: sh, col: '#f8e8bc', cx: x, cy: y, r: 3.4 * s }], { noGlint: true });
  }
  const ICONS = {
    'hp-heart'(P) {
      const sh = (c) => { c.moveTo(24, 41); c.bezierCurveTo(8, 31, 4, 21, 8, 14); c.bezierCurveTo(12, 7, 21, 7, 24, 14); c.bezierCurveTo(27, 7, 36, 7, 40, 14); c.bezierCurveTo(44, 21, 40, 31, 24, 41); c.closePath(); };
      P.part(sh, [
        { poly: [[0, 0], [24, 0], [24, 24], [0, 24]], col: '#ff4a5a', cx: 15, cy: 17, r: 10 },
        { poly: [[24, 0], [48, 0], [48, 24], [24, 24]], col: '#e3203c', cx: 33, cy: 17, r: 10 },
        { poly: [[0, 24], [24, 24], [24, 48]], col: '#c41a34', cx: 17, cy: 30, r: 9 },
        { poly: [[24, 24], [48, 24], [24, 48]], col: '#a8142e', cx: 30, cy: 30, r: 9 },
      ]);
    },
    kills(P) {
      [[22, 14, -2.1, 12, 3.4], [26, 14, -1.05, 12, 3.4]].forEach((d, i) => { const L = leafPts(d[0], d[1], d[2], d[3], d[4]); P.part(leafShape(L), leafCells(L, PAL.leaf[i], PAL.leaf[2])); });
      P.part((c) => turnipPath(c, 24, 13, 40, 14), [
        { poly: [[0, 0], [48, 0], [48, 26], [0, 26]], col: '#8a4ac0', cx: 24, cy: 19, r: 12 },
        { poly: [[0, 26], [48, 26], [48, 48], [0, 48]], col: '#f2deb0', cx: 24, cy: 33, r: 10 },
      ]);
      for (const e of [[[15, 25], [22, 27], [21, 30], [16, 29.5]], [[26, 27], [33, 25], [32, 29.5], [27, 30]]]) { const inf = polyInfo(e); P.piece(PP(e), '#ff5a26', inf.cx, inf.cy, inf.r * 1.3, { glow: true, ol: 1.2 }); }
    },
    dmg(P) {
      P.part(PP(starPts(8, 21, 9, 24, 24, 0.2)), mosaic('iDmg', starPts(8, 23, 9, 24, 24, 0.2), 60, 3, (x, y, i) => ['#f2c040', '#ffdc6a', '#e09a20'][i % 3]), { noGlint: true });
      iconSeed(P, 24, 24, -0.7, 3.4);
    },
    rate(P) {
      [[14, 33, 0], [24, 24, 1], [34, 15, 2]].forEach(([x, y], i) => {
        P.piece(RR(x - 13, y - 2, 9, 4, 2), ['#7ab8f0', '#9fd0ff', '#c4e4ff'][i], x - 8, y, 4);
        iconSeed(P, x + 2, y, -0.75, 2.2);
      });
    },
    multi(P) {
      const bag = (c) => { c.moveTo(14, 18); c.quadraticCurveTo(5, 30, 10, 40); c.quadraticCurveTo(24, 45, 38, 40); c.quadraticCurveTo(43, 30, 34, 18); c.closePath(); };
      P.part(bag, mosaic('iBag', rectPoly(4, 16, 44, 46), 90, 8, (x, y, i) => ['#c06a24', '#a8561c', '#d87e30', '#94481a'][i % 4]));
      P.piece(RR(13, 14, 22, 6, 2.5), '#3f8a32', 24, 17, 9);
      iconSeed(P, 18, 10, -1.2, 1.8); iconSeed(P, 28, 9, -1.9, 1.8); iconSeed(P, 23, 7, -1.5, 1.6);
    },
    bounce(P) {
      P.detail((c) => {
        c.setLineDash([3, 3.5]); c.strokeStyle = '#9fd0ff'; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(6, 38); c.quadraticCurveTo(14, 8, 24, 36); c.quadraticCurveTo(32, 14, 42, 30); c.stroke();
        c.setLineDash([]);
      });
      P.piece(RR(4, 38, 40, 5, 2), '#6f7486', 24, 40, 12);
      iconSeed(P, 24, 33, 0.3, 2.4);
    },
    lantern(P) {
      P.ctx.save(); P.ctx.translate(24, 39); P.ctx.scale(2.3, 2.3);
      lanternParts(P);
      P.ctx.restore();
    },
    speed(P) {
      // the glass slipper
      const sh = (c) => { c.moveTo(6, 34); c.quadraticCurveTo(8, 24, 17, 24); c.quadraticCurveTo(26, 25, 30, 18); c.lineTo(38, 16); c.quadraticCurveTo(43, 22, 42, 33); c.lineTo(38, 33); c.lineTo(37, 40); c.lineTo(33, 40); c.lineTo(33, 34); c.closePath(); };
      P.part(sh, mosaic('iShoe', rectPoly(4, 14, 44, 42), 70, 12, (x, y, i) => ['#c4e4ff', '#9fd0ff', '#e6f4ff', '#7ab8f0'][i % 4]));
      P.piece(ELL(30, 21, 3, 3), '#f2c040', 30, 21, 3, { glow: true });
    },
    magnet(P) {
      P.detail((c) => { c.strokeStyle = LEAD; c.lineWidth = 4; c.beginPath(); c.arc(24, 24, 13, PI, 0); c.stroke(); c.strokeStyle = '#a8561c'; c.lineWidth = 2; c.stroke(); });
      [[17, 18, 0], [24, 15, 1], [31, 18, 0]].forEach(([x, y, b]) => { P.part(PP([[x, y - 5], [x + 4, y], [x, y + 4], [x - 4, y]]), [{ poly: [[x, y - 5], [x + 4, y], [x, y + 4], [x - 4, y]], col: b ? '#f2c040' : '#6fe8e0', cx: x, cy: y - 1, r: 4, glow: true }]); });
      const bk = (c) => { c.moveTo(7, 24); c.lineTo(41, 24); c.lineTo(36, 42); c.lineTo(12, 42); c.closePath(); };
      P.part(bk, [0, 1, 2, 3, 4].map((i) => ({ poly: [[4 + i * 8, 22], [12 + i * 8, 22], [12 + i * 8 - 1, 44], [4 + i * 8 + 1, 44]], col: ['#a8561c', '#c06a24', '#94481a'][i % 3], cx: 8 + i * 8, cy: 31, r: 7 })));
    },
    hp(P) {
      P.detail((c) => { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; for (const x of [17, 24, 31]) { c.beginPath(); c.moveTo(x, 15); c.bezierCurveTo(x - 3, 11, x + 3, 8, x, 4); c.stroke(); } });
      P.part(ELL(24, 22, 17, 5), [
        { poly: rectPoly(5, 16, 24, 28), col: '#f39232', cx: 18, cy: 22, r: 7, glow: true },
        { poly: rectPoly(24, 16, 44, 28), col: '#8a4ac0', cx: 30, cy: 22, r: 7 },
      ]);
      const bowl = (c) => { c.moveTo(6, 23); c.lineTo(42, 23); c.quadraticCurveTo(41, 41, 24, 42); c.quadraticCurveTo(7, 41, 6, 23); c.closePath(); };
      P.part(bowl, mosaic('iBowl', rectPoly(4, 22, 44, 44), 80, 14, (x, y, i) => ['#6b4a32', '#7e5a3c', '#8a6440'][i % 3]));
    },
  };

  /* ============================================================== HUD css */
  function tso(w, col, glowCol) {
    const a = [];
    for (let i = 0; i < 12; i++) { const t = (i / 12) * TAU; a.push((Math.cos(t) * w).toFixed(1) + 'px ' + (Math.sin(t) * w).toFixed(1) + 'px 0 ' + col); }
    if (glowCol) a.push('0 0 14px ' + glowCol);
    return a.join(',');
  }
  const L_ = LEAD, GOLD = '#d9ad4e';
  const glassPanel = (c1, c2, c3) => `radial-gradient(ellipse at 50% 35%, ${c1} 0%, ${c2} 55%, ${c3} 100%)`;
  const quarry = `repeating-linear-gradient(45deg, transparent 0 20px, rgba(23,19,28,.8) 20px 22.5px), repeating-linear-gradient(-45deg, transparent 0 20px, rgba(23,19,28,.8) 20px 22.5px)`;
  const ring = (n) => `0 0 0 2px ${GOLD}, 0 0 0 ${n}px ${L_}`;
  const CSS = `
body.style-stainedglass { font-family: 'Cinzel', Georgia, serif; }
body.style-stainedglass #hud { padding: 16px 24px; }
body.style-stainedglass #hud .xp { height: 22px; border: 3px solid ${L_}; border-radius: 12px; overflow: hidden;
  background: linear-gradient(180deg, #121a44, #24306c 50%, #10173a); box-shadow: ${ring(5)}, 0 5px 12px rgba(0,0,0,.55), inset 0 3px 5px rgba(0,0,0,.6); }
body.style-stainedglass #hud .xp-fill { background: repeating-linear-gradient(90deg, transparent 0 40px, ${L_} 40px 43px), linear-gradient(180deg, #c8fff0 0%, #4fdcbc 42%, #149a80 100%); box-shadow: 0 0 12px rgba(120,255,220,.6); }
body.style-stainedglass #hud .xp-fill::after { content: ''; position: absolute; left: 6px; right: 6px; top: 3px; height: 4px; border-radius: 3px; background: rgba(255,255,255,.55); }
body.style-stainedglass #hud .lvl { right: 14px; font-family: 'Cinzel Decorative', 'Cinzel', serif; font-weight: 900; font-size: 15px; letter-spacing: 1px; color: #ffe7a0; text-shadow: ${tso(2, L_)}; }
body.style-stainedglass #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 16px; }
body.style-stainedglass #hud .hp { position: relative; gap: 8px; justify-self: start; }
body.style-stainedglass #hud .hp-icon, body.style-stainedglass #hud .kills-icon { width: 44px; height: 44px; filter: drop-shadow(0 0 6px rgba(255,120,120,.45)); }
body.style-stainedglass #hud .kills-icon { filter: drop-shadow(0 0 6px rgba(200,150,255,.45)); }
body.style-stainedglass #hud .hp-bar { width: 250px; height: 26px; border: 3px solid ${L_}; border-radius: 14px; background: linear-gradient(180deg, #2a0c16, #4a1626 50%, #22080f);
  box-shadow: ${ring(5)}, 0 5px 12px rgba(0,0,0,.55), inset 0 3px 5px rgba(0,0,0,.6); }
body.style-stainedglass #hud .hp-fill { background: repeating-linear-gradient(90deg, transparent 0 46px, ${L_} 46px 49px), linear-gradient(180deg, #ffc0b4 0%, #ec3c52 44%, #9a1630 100%); box-shadow: 0 0 12px rgba(255,90,110,.6); }
body.style-stainedglass #hud .hp-fill::after { content: ''; position: absolute; left: 7px; right: 7px; top: 3px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.5); }
body.style-stainedglass #hud .hp-text { position: absolute; left: 52px; width: 250px; top: 50%; transform: translateY(-50%); text-align: center; font-family: 'Cinzel', serif; font-weight: 900; font-size: 15px; letter-spacing: 1px; color: #fff4dc; text-shadow: ${tso(2, L_)}; }
body.style-stainedglass.hurt #hud .hp-bar { filter: brightness(1.7) saturate(1.2); }
body.style-stainedglass #hud .clock { justify-self: center; margin-top: -6px; padding: 8px 30px 9px; border: 4px solid ${L_}; border-radius: 70px 70px 16px 16px / 56px 56px 16px 16px;
  background: radial-gradient(ellipse at 50% 30%, rgba(255,230,170,.28), transparent 60%), ${glassPanel('#4a63c8', '#26357e', '#141b48')};
  box-shadow: ${ring(6)}, 0 8px 18px rgba(0,0,0,.55), inset 0 0 18px rgba(0,0,30,.6); }
body.style-stainedglass #hud .clock-time { font-family: 'Cinzel Decorative', 'Cinzel', serif; font-weight: 900; font-size: 34px; line-height: 1.05; letter-spacing: 2px; color: #ffdf7e; text-shadow: ${tso(2.5, L_, 'rgba(255,200,90,.7)')}; }
body.style-stainedglass #hud .clock-label { font-family: 'Cinzel', serif; font-weight: 700; font-size: 11px; letter-spacing: 3px; opacity: 1; color: #cfdaff; text-shadow: 0 1px 2px ${L_}; }
body.style-stainedglass #hud .kills { justify-self: end; min-width: 0; gap: 6px; padding: 3px 20px 3px 8px; border: 4px solid ${L_}; border-radius: 40px 40px 12px 12px / 30px 30px 12px 12px;
  background: ${glassPanel('#a23a8c', '#6a2068', '#34103a')}; box-shadow: ${ring(6)}, 0 6px 14px rgba(0,0,0,.55);
  font-family: 'Cinzel Decorative', 'Cinzel', serif; font-weight: 900; font-size: 25px; color: #ffe7a0; text-shadow: ${tso(2, L_)}; }
body.style-stainedglass #stylebar { background: ${glassPanel('#33307a', '#1e1c4a', '#110f2a')}; color: #e8e0ff; border: 3px solid ${L_}; box-shadow: ${ring(5)}, 0 4px 12px rgba(0,0,0,.6); padding: 6px 22px; font-family: 'Cinzel', serif; font-weight: 700; gap: 14px; bottom: 16px; }
body.style-stainedglass #stylebar .style-family { color: #b8a8e8; opacity: 1; letter-spacing: 2px; }
body.style-stainedglass #stylebar .style-name { font-family: 'Cinzel Decorative', serif; font-weight: 900; font-size: 18px; letter-spacing: 1px; color: #ffd86a; text-shadow: ${tso(1.5, L_, 'rgba(255,200,90,.5)')}; }
body.style-stainedglass #stylebar .style-hint { opacity: .8; }
body.style-stainedglass #stylebar .auto.on { color: #7ff0d8; }
body.style-stainedglass #levelup { gap: 28px; background:
  radial-gradient(ellipse at 50% 38%, rgba(255,214,140,.32), rgba(255,214,140,0) 58%),
  repeating-conic-gradient(from -90deg at 50% -12%, rgba(255,226,170,.075) 0deg 3deg, rgba(255,226,170,0) 3deg 9deg),
  rgba(16,9,32,.72); }
body.style-stainedglass #levelup .lu-title { font-family: 'Cinzel Decorative', 'Cinzel', serif; font-weight: 900; font-size: 66px; letter-spacing: 4px; color: #ffd86a; text-shadow: ${tso(3.5, L_, 'rgba(255,190,80,.85)')}; animation: sgRise .6s ease-out backwards; }
@keyframes sgRise { from { opacity: 0; transform: translateY(-24px) scale(.9); filter: brightness(2.2); } to { opacity: 1; transform: none; filter: none; } }
body.style-stainedglass #levelup .lu-cards { gap: 30px; }
body.style-stainedglass #levelup .card { width: 224px; min-height: 330px; padding: 40px 18px 46px; gap: 12px; color: #fff4dc;
  border: 5px solid ${L_}; border-radius: 112px 112px 14px 14px / 128px 128px 14px 14px;
  background: radial-gradient(ellipse at 50% 26%, rgba(255,236,190,.5), rgba(255,236,190,0) 46%), ${quarry}, linear-gradient(180deg, #3d58c4 0%, #283a96 46%, #5a1f6e 100%);
  box-shadow: inset 0 0 0 3px ${GOLD}, inset 0 0 0 7px ${L_}, inset 0 -30px 40px rgba(20,8,40,.55), 0 0 0 3px ${GOLD}, 0 0 0 7px ${L_}, 0 16px 34px rgba(0,0,0,.65);
  transition: transform .15s ease-out, filter .15s; animation: sgCard .55s ease-out backwards; }
body.style-stainedglass #levelup .card:nth-child(2) { animation-delay: .08s; background: radial-gradient(ellipse at 50% 26%, rgba(255,236,190,.5), rgba(255,236,190,0) 46%), ${quarry}, linear-gradient(180deg, #b0303e 0%, #7e1a36 46%, #3a1a6a 100%); }
body.style-stainedglass #levelup .card:nth-child(3) { animation-delay: .16s; background: radial-gradient(ellipse at 50% 26%, rgba(255,236,190,.5), rgba(255,236,190,0) 46%), ${quarry}, linear-gradient(180deg, #2f8a5a 0%, #1d6448 46%, #1a3a6a 100%); }
@keyframes sgCard { from { opacity: 0; transform: translateY(40px); filter: brightness(2.4) saturate(.4); } to { opacity: 1; transform: none; filter: none; } }
body.style-stainedglass #levelup .card:hover { transform: translateY(-8px); filter: brightness(1.18) saturate(1.1); }
body.style-stainedglass #levelup .card-icon { width: 112px; height: 112px; padding: 8px; border-radius: 50%; border: 4px solid ${L_};
  background: radial-gradient(circle at 45% 40%, #fffbe8 0%, #f6dc96 50%, #c88a34 100%); box-shadow: 0 0 0 3px ${GOLD}, 0 0 0 7px ${L_}, 0 0 30px rgba(255,214,120,.75); }
body.style-stainedglass #levelup .card-name { margin-top: 10px; font-family: 'Cinzel Decorative', 'Cinzel', serif; font-weight: 900; font-size: 21px; line-height: 1.15; letter-spacing: .5px; color: #ffe08a; text-shadow: ${tso(2.2, L_)}; }
body.style-stainedglass #levelup .card-desc { font-family: 'Cinzel', serif; font-weight: 700; font-size: 15px; line-height: 1.3; opacity: 1; color: #2a1a10; padding: 9px 12px; border: 3px solid ${L_}; border-radius: 8px;
  background: linear-gradient(180deg, #fbefcf, #e8cf96); box-shadow: 0 0 0 2px ${GOLD}, 0 0 0 5px ${L_}; }
body.style-stainedglass #levelup .card-key { top: auto; bottom: 10px; left: 50%; transform: translateX(-50%); width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #ff8a8a, #c41a34 60%, #7a0c1e); border: 3px solid ${L_}; box-shadow: 0 0 0 2px ${GOLD}; font-family: 'Cinzel Decorative', serif; font-weight: 900; font-size: 15px; opacity: 1; color: #fff4dc; text-shadow: 0 1px 1px ${L_}; }
body.style-stainedglass #levelup .lu-hint { font-family: 'Cinzel', serif; font-weight: 700; font-size: 16px; letter-spacing: 2px; opacity: 1; color: #f2e4c0; text-shadow: ${tso(1.5, L_)}; }
body.style-stainedglass #gameover { background: radial-gradient(ellipse at 50% 45%, rgba(90,40,120,.2), rgba(10,4,20,.75) 75%), rgba(20,10,36,.55); gap: 18px; }
body.style-stainedglass #gameover .go-title { font-family: 'Cinzel Decorative', 'Cinzel', serif; font-weight: 900; font-size: 68px; letter-spacing: 3px; color: #ff9a3a; text-shadow: ${tso(3.5, L_, 'rgba(255,140,60,.8)')}; }
body.style-stainedglass #gameover .go-stats { font-family: 'Cinzel', serif; font-weight: 700; font-size: 19px; opacity: 1; color: #2a1a10; padding: 10px 26px; border: 3px solid ${L_}; border-radius: 10px; background: linear-gradient(180deg, #fbefcf, #e8cf96); box-shadow: 0 0 0 2px ${GOLD}, 0 0 0 5px ${L_}; }
body.style-stainedglass #gameover .go-hint { font-family: 'Cinzel Decorative', serif; font-weight: 900; font-size: 20px; opacity: 1; color: #ffe08a; text-shadow: ${tso(2, L_)}; }
body.style-stainedglass #pausebox { font-family: 'Cinzel Decorative', serif; font-weight: 900; font-size: 64px; color: #ffd86a; text-shadow: ${tso(3, L_, 'rgba(255,190,80,.8)')}; }
`;

  /* ============================================================== particles */
  const SHARD_PAL = {
    creeper: [null, 'cream', 'green'], ghost: ['opal', 'opal', 'aqua'], colossus: ['brown', 'dkviolet', 'ruby', 'brown', 'gold'],
  };
  const CREEP_SHARD = ['violet', 'magenta', 'indigo'];
  function shardCols(e) {
    if (e.type === 'creeper') { const v = Math.floor(e.seed * 3) % 3; return [CREEP_SHARD[v], 'cream', 'green', CREEP_SHARD[v]]; }
    return SHARD_PAL[e.type];
  }
  function shard(game, x, y, z, col, sp, vz, size) {
    const a = Math.random() * TAU, s = sp * (0.5 + Math.random() * 0.7);
    return game.addParticle({ kind: 'shard', col, sh: (Math.random() * 3) | 0, x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: vz * (0.6 + Math.random() * 0.6), grav: 300, drag: 1.4, life: 0.9 + Math.random() * 0.5, size: size * (0.75 + Math.random() * 0.5), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16 });
  }
  function glint(game, x, y, z, tint, size, life, vx, vy) {
    return game.addParticle({ kind: 'glint', tint, x, y, z, vx: vx || 0, vy: vy || 0, drag: 3, life: life || 0.35, size, rot: Math.random() * 0.6, vr: 0 });
  }

  /* ================================================================ style */
  Styles.register({
    id: 'stainedglass',
    name: 'Kirchenfenster',
    family: 'Bleiglas',
    description: 'Ein lebendiges Kathedralenfenster: Juwelenfarbenes Glas in Bleiruten, durch das warmes Licht fällt.',
    groundColor: '#2a5a3e',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Cinzel+Decorative:wght@700;900', 'Cinzel:wght@500;700;900'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = Math.max(3, Math.min(5, Math.round(S * 1.5)));
      SPR.jack = [0, 1, 2, 3].map((f) => pair([-14, -38, 14, 3], (P) => jackParts(P, f), 11 + f));
      SPR.creep = [0, 1, 2].map((v) => [0, 1, 2, 3].map((f) => pair([-14, -34, 14, 4], (P) => creeperParts(P, f, v), 30 + v * 7 + f)));
      SPR.ghost = [0, 1, 2, 3].map((f) => {
        const box = [-11, -27, 14, 3];
        const p = pair(box, (P) => ghostParts(P, f), 60 + f);
        ghostFade(p.n, box); ghostFade(p.f, box);
        return p;
      });
      SPR.colo = [0, 1, 2, 3].map((f) => pair([-31, -64, 31, 3], (P) => colossusParts(P, f), 80 + f));
      SPR.lantern = build([-9, -21, 9, 4], lanternParts, 'fill', 3);
      SPR.seed = build([-5.5, -4.5, 6, 4.5], seedParts, 'fill', 4);
      SPR.gemS = build([-5.5, -7.5, 5.5, 4.5], (P) => gemParts(P, false), 'fill', 5);
      SPR.gemB = build([-7.5, -10.5, 7.5, 6.5], (P) => gemParts(P, true), 'fill', 6);
      SPR.shard = {};
      for (const k in SHARD_COLS) SPR.shard[k] = SHARD_SHAPES.map((sh, i) => build([-4, -4, 4, 4], (P) => shardParts(P, sh, SHARD_COLS[k]), 'fill', 90 + i, 0.5, 0.4));
      SPR.glowWarm = glowSprite([255, 190, 80], 16);
      SPR.glowCold = glowSprite([150, 200, 255], 14);
      SPR.glowRuby = glowSprite([255, 60, 80], 14);
      SPR.glowAqua = glowSprite([110, 240, 220], 10);
      SPR.glowGold = glowSprite([255, 210, 90], 10);
      SPR.pool = plain([-20, -8, 20, 8], (c) => {
        c.save(); c.scale(1, 0.4);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 20);
        g.addColorStop(0, 'rgba(255,170,60,0.55)'); g.addColorStop(0.5, 'rgba(255,140,40,0.2)'); g.addColorStop(1, 'rgba(255,120,30,0)');
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill(); c.restore();
      });
      SPR.glint = [glintSprite([255, 240, 200]), glintSprite([170, 210, 255]), glintSprite([255, 150, 120]), glintSprite([200, 255, 230])];
      SPR.trail = plain([-16, -2.5, 0, 2.5], (c) => {
        const g = c.createLinearGradient(0, 0, -16, 0);
        g.addColorStop(0, 'rgba(255,214,120,0.75)'); g.addColorStop(1, 'rgba(255,160,60,0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(-1, -1.6); c.lineTo(-16, 0); c.lineTo(-1, 1.6); c.closePath(); c.fill();
      });
      SPR.beam = [[255, 200, 90], [255, 110, 140], [120, 170, 255], [140, 255, 200]].map((col) => plain([-3, -40, 3, 0], (c) => {
        const g = c.createLinearGradient(0, 0, 0, -40);
        g.addColorStop(0, U.rgb(col, 0)); g.addColorStop(0.25, U.rgb(col, 0.7)); g.addColorStop(1, U.rgb(col, 0));
        c.fillStyle = g; c.fillRect(-1.6, -40, 3.2, 40);
        c.fillStyle = U.rgb([255, 255, 255], 0.35); c.fillRect(-0.4, -34, 0.8, 30);
      }));
      SPR.props = {};
      for (const t in PROP_DEF) {
        const d = PROP_DEF[t];
        SPR.props[t] = [];
        for (let v = 0; v < d.n; v++) SPR.props[t].push(build(d.box, (P) => d.fn(P, v), 'fill', 300 + v));
      }
      OV = null;
      if (document.fonts && document.fonts.load) { try { document.fonts.load('900 20px "Cinzel Decorative"', '0123456789'); } catch (e) { /* ignore */ } }
    },

    *renderGroundChunk(ctx, info) {
      yield* groundPixels(ctx, info);
      yield* decals(ctx, info);
    },

    propsForChunk(info) {
      const out = [];
      G.scatterOwned(info, PROP_CELL, PROP_SEED, (x, y, rng) => {
        const p = propAt(x, y, rng);
        if (!p) return;
        p.x = x; p.y = y; p.sw = (x * 0.013 + y * 0.007) % TAU;
        p.pad = p.t === 'tree' || p.t === 'arch' ? 80 : 30;
        out.push(p);
      });
      return out;
    },

    drawProp(ctx, p, view) {
      const V = tf(view);
      const s = SPR.props[p.t][p.v];
      const fx = p.f ? -1 : 1;
      if (p.t === 'tree' || p.t === 'bush') {
        const k = Math.sin(view.rt * 1.1 + p.sw) * (p.t === 'tree' ? 0.02 : 0.03);
        const S = V.S;
        ctx.setTransform(S * fx, 0, -k * S, S, V.ox + p.x * S, V.oy + p.y * S);
        const q = 1 / K;
        ctx.drawImage(s.c, -s.ox * q, -s.oy * q, s.c.width * q, s.c.height * q);
        ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
      } else blit(ctx, V, s, p.x, p.y, fx, 1, 0);
      if (p.t === 'candle') {
        for (const [x, h] of CANDLES[p.v]) {
          const fl = 0.75 + 0.25 * Math.sin(view.rt * 11 + x * 3 + p.sw * 5) * Math.sin(view.rt * 7.3 + x);
          glow(ctx, V, SPR.glowWarm, p.x + x * fx, p.y - h - 3.5, 0.55 * fl, 0.75 * fl);
        }
      } else if (p.t === 'pump' && p.v === 1) {
        glow(ctx, V, SPR.glowWarm, p.x, p.y - 6, 0.7, 0.35 + 0.1 * Math.sin(view.rt * 5 + p.sw));
      } else if (p.t === 'arch') {
        glow(ctx, V, SPR.glowRuby, p.x, p.y - 45, 0.5, 0.25 + 0.08 * Math.sin(view.rt * 1.5 + p.sw));
      }
    },

    drawShadow(ctx, o, view) {
      const V = tf(view);
      if (o.kind === 'prop') return;
      if (o.kind === 'player') {
        const S = V.S;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.85 + 0.15 * Math.sin(view.rt * 5);
        blit(ctx, V, SPR.pool, o.x, o.y + 1, 1.6, 1.6, 0);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        void S;
        ctx.fillStyle = 'rgba(14,10,22,0.45)';
        ctx.beginPath(); ctx.ellipse(o.x, o.y + 0.3, 7.5, 2.4, 0, 0, TAU); ctx.fill();
        return;
      }
      let k = 1;
      if (o.dying) { if (o.deathT > 0.3) return; k = 1 - o.deathT / 0.3; }
      if (o.spawnT < 1) k *= U.clamp((o.spawnT - 0.5) * 2, 0, 1);
      if (k <= 0.02) return;
      let rx, ry;
      if (o.type === 'ghost') { rx = 5; ry = 1.7; }
      else if (o.type === 'colossus') {
        rx = 19; ry = 5.5;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 * k;
        blit(ctx, V, SPR.glowRuby, o.x, o.y + 2, 1.6, 0.5, 0);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      } else { rx = 8; ry = 2.6; }
      ctx.fillStyle = o.type === 'ghost' ? 'rgba(14,10,30,0.25)' : 'rgba(14,10,22,0.42)';
      ctx.beginPath(); ctx.ellipse(o.x, o.y + 0.4, rx * k, ry * k, 0, 0, TAU); ctx.fill();
    },

    drawGem(ctx, g, view) {
      const V = tf(view);
      const bob = Math.sin(view.rt * 3.2 + g.seed * 20) * 1.1;
      let sc = 1;
      if (g.pop > 0) sc = 1 + g.pop * 0.5;
      const y = g.y - 3 + bob;
      glow(ctx, V, g.big ? SPR.glowGold : SPR.glowAqua, g.x, y - 1.5, g.big ? 0.9 : 0.6, 0.55 + 0.15 * Math.sin(view.rt * 6 + g.seed * 9));
      const spr = g.big ? SPR.gemB : SPR.gemS;
      blit(ctx, V, spr, g.x, y + (g.big ? 3 : 2), sc * 0.85, sc * 0.85, 0);
      const tw = Math.sin(view.rt * 2.3 + g.seed * 40);
      if (tw > 0.93) {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (tw - 0.93) / 0.07;
        blit(ctx, V, SPR.glint[0], g.x + 1.4, y - 3, 0.35, 0.35, 0);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    },

    drawEnemy(ctx, e, view) {
      const V = tf(view);
      let set, y = e.y, rot = 0, sx = 1, sy = 1, alpha = 1, h = 12, gl = null;
      const scl = 0.95 + e.seed * 0.1;
      if (e.type === 'creeper') {
        const ph = e.anim * 0.85 + e.seed;
        const f = Math.floor(ph * 4) & 3;
        set = SPR.creep[Math.floor(e.seed * 3) % 3][f];
        const sn = Math.sin(ph * TAU);
        rot = sn * 0.09;
        y -= Math.abs(sn) * 1.2;
        sx = scl * 0.92; sy = scl * 0.92;
      } else if (e.type === 'ghost') {
        const f = Math.floor(view.rt * 6 + e.seed * 4) & 3;
        set = SPR.ghost[f];
        y -= 4 + Math.sin(view.rt * 2.4 + e.seed * 12) * 1.5;
        rot = U.clamp(e.vx / 70, -1, 1) * 0.14;
        alpha = 0.86;
        h = 16; gl = SPR.glowCold;
        sx = scl; sy = scl;
      } else {
        const ph = e.anim * 0.32 + e.seed;
        const f = Math.floor(ph * 4) & 3;
        set = SPR.colo[f];
        const up = Math.abs(Math.sin(ph * TAU));
        y -= up * 1.8;
        const contact = Math.pow(1 - up, 4);
        sx = scl * (1 + contact * 0.05); sy = scl * (1 - contact * 0.05);
        h = 28;
      }
      const fx = e.facing < 0 ? -1 : 1;
      // spawn: shards fly in and assemble
      if (e.spawnT < 1) {
        const q = e.spawnT;
        const cols = shardCols(e);
        const n = e.type === 'colossus' ? 10 : 6;
        const big = e.type === 'colossus' ? 1.6 : 1;
        const ease = U.ease.outQuad(U.clamp(q / 0.85, 0, 1));
        const sa = U.clamp(q * 4, 0, 1) * (1 - U.smoothstep(0.78, 0.95, q));
        if (sa > 0.01) {
          ctx.globalAlpha = sa;
          for (let i = 0; i < n; i++) {
            const a = e.seed * 40 + (i / n) * TAU;
            const r = (1 - ease) * (e.type === 'colossus' ? 50 : 30) + 2;
            const px = e.x + Math.cos(a) * r, py = e.y - h + Math.sin(a) * r * 0.6 - (1 - ease) * 10;
            blit(ctx, V, SPR.shard[cols[i % cols.length]][i % 3], px, py, big, big, a + (1 - ease) * 9);
          }
          ctx.globalAlpha = 1;
        }
        const ba = U.smoothstep(0.6, 0.92, q);
        if (ba <= 0.01) return;
        alpha *= ba;
        ctx.globalAlpha = alpha;
        blit(ctx, V, set.n, e.x, y, sx * fx, sy, rot);
        const fa = 1 - U.smoothstep(0.85, 1, q);
        if (fa > 0.01) { ctx.globalAlpha = alpha * fa * 0.8; blit(ctx, V, set.f, e.x, y, sx * fx, sy, rot); }
        ctx.globalAlpha = 1;
        glow(ctx, V, SPR.glowWarm, e.x, e.y - h, big * 0.9, Math.sin(U.clamp((q - 0.6) / 0.4, 0, 1) * PI) * 0.6);
        return;
      }
      if (e.dying) {
        const q = e.deathT;
        if (q >= 0.22) return;
        const k = 1 + q * 0.8;
        ctx.globalAlpha = 1 - q / 0.22;
        blit(ctx, V, set.f, e.x, y, sx * fx * k, sy * k, rot);
        ctx.globalAlpha = 1;
        return;
      }
      if (gl) glow(ctx, V, gl, e.x, y - h, 0.75, 0.22);
      ctx.globalAlpha = alpha;
      const fl = e.flash;
      if (fl > 0) { sx *= 1 + 0.12 * fl; sy *= 1 - 0.08 * fl; }
      blit(ctx, V, set.n, e.x, y, sx * fx, sy, rot);
      if (fl > 0.02) {
        ctx.globalAlpha = Math.min(0.62, fl * 0.9) * alpha;
        blit(ctx, V, set.f, e.x, y, sx * fx, sy, rot);
      }
      ctx.globalAlpha = 1;
      if (e.type === 'colossus') {
        const pulse = 0.45 + 0.25 * Math.sin(view.rt * 4 + e.seed * 9);
        glow(ctx, V, SPR.glowRuby, e.x, y - 24 * sy, 0.8, pulse);
      } else if (e.type === 'creeper' && ((view.rt * 0.7 + e.seed * 7) % 4) < 0.12) {
        glow(ctx, V, SPR.glint[0], e.x - 4 * fx, y - 17, 0.3, 0.8);
      }
    },

    drawPlayer(ctx, p, view) {
      const V = tf(view);
      let frame = 0, lift = 0, sx = 1, sy = 1, rot = 0;
      if (p.moving) {
        const ph = p.anim * 0.42;
        frame = Math.floor(ph * 4) & 3;
        const s = Math.sin(ph * TAU * 2);
        lift = Math.abs(Math.sin(ph * TAU)) * 2.2;
        rot = 0.05 * p.facing * Math.sin(ph * TAU);
        sy = 1 + 0.02 * s;
      } else {
        const b = Math.sin(view.rt * 3);
        sy = 1 + 0.025 * b; sx = 1 - 0.015 * b;
      }
      if (p.shootT > 0) { sy *= 1 - 0.04 * p.shootT; sx *= 1 + 0.03 * p.shootT; }
      if (p.levelT > 0) { const w = Math.sin(p.levelT * PI * 4) * p.levelT; sy *= 1 + 0.12 * w; sx *= 1 - 0.08 * w; }
      sx *= JACK_SCALE; sy *= JACK_SCALE;
      const fx = p.facing < 0 ? -1 : 1;
      const set = SPR.jack[frame];
      if (p.dashT > 0) {
        const k = U.clamp(p.dashT / 0.2, 0, 1);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = (0.32 / i) * k;
          blit(ctx, V, set.f, p.x - p.dashX * i * 7, p.y - p.dashY * i * 7 - lift, sx * fx, sy, rot);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      let a = 1;
      const hurt = p.hurtT > 0;
      if (p.iframes > 0 && !hurt && p.dashT <= 0 && (Math.floor(view.rt * 14) & 1)) a = 0.55;
      // halo of the glowing face
      glow(ctx, V, SPR.glowWarm, p.x + fx * 1.2, p.y - 24 * sy - lift, 1.25, 0.32 + 0.08 * Math.sin(view.rt * 6.5) + (p.levelT > 0 ? p.levelT * 0.5 : 0));
      ctx.globalAlpha = a;
      blit(ctx, V, set.n, p.x, p.y - lift, sx * fx, sy, rot);
      if (hurt) {
        ctx.globalAlpha = Math.min(0.65, p.hurtT * 0.9) * a;
        blit(ctx, V, set.f, p.x, p.y - lift, sx * fx, sy, rot);
      }
      ctx.globalAlpha = 1;
      // the carved face shines through
      glow(ctx, V, SPR.glowGold, p.x + fx * 2, p.y - 23 * sy - lift, 0.55, 0.28 + 0.12 * Math.sin(view.rt * 9) * Math.sin(view.rt * 5.3));
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view);
      const bob = Math.sin(view.rt * 4 + o.idx * 1.7) * 1.3;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.6;
      blit(ctx, V, SPR.pool, o.x, o.y + 6, 0.8, 0.8, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      const y = o.y - 2 + bob;
      glow(ctx, V, SPR.glowWarm, o.x, y - 6, 0.7, 0.45 + 0.12 * Math.sin(view.rt * 9 + o.idx * 2.1));
      blit(ctx, V, SPR.lantern, o.x, y, 0.9, 0.9, Math.sin(view.rt * 3 + o.idx) * 0.12);
    },

    drawProjectile(ctx, pr, view) {
      const V = tf(view);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, pr.age * 12) * 0.85;
      blit(ctx, V, SPR.trail, pr.x, pr.y, 1, 1, pr.angle);
      ctx.globalAlpha = 0.35;
      blit(ctx, V, SPR.glowGold, pr.x, pr.y, 0.45, 0.45, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      const sq = 0.6 + 0.4 * Math.abs(Math.cos(pr.spin));
      blit(ctx, V, SPR.seed, pr.x, pr.y, 0.85, 0.85 * sq, pr.angle);
    },

    drawParticle(ctx, pt, view) {
      const V = tf(view);
      const t = 1 - pt.life / pt.max;
      switch (pt.kind) {
        case 'shard': {
          const set = SPR.shard[pt.col] || SPR.shard.cream;
          const a = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
          const tum = pt.z > 0.05 ? Math.cos(view.rt * 10 + pt.seed * 30) : 0.55;
          ctx.globalAlpha = a;
          blit(ctx, V, set[pt.sh], pt.x, pt.y - pt.z, pt.size, pt.size * (0.25 + 0.75 * Math.abs(tum)), pt.rot);
          ctx.globalAlpha = 1;
          if (Math.abs(tum) > 0.94 && pt.z > 0.05) glow(ctx, V, SPR.glint[0], pt.x, pt.y - pt.z, 0.28 * pt.size, a * 0.9);
          return;
        }
        case 'glint': {
          const sc = (t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7) * pt.size;
          if (sc <= 0.01) return;
          ctx.globalCompositeOperation = 'lighter';
          blit(ctx, V, SPR.glint[pt.tint || 0], pt.x, pt.y - pt.z, sc, sc, pt.rot + t * 0.8);
          ctx.globalCompositeOperation = 'source-over';
          return;
        }
        case 'beam': {
          const a = Math.sin(t * PI);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = a * 0.9;
          blit(ctx, V, SPR.beam[pt.tint || 0], pt.x, pt.y - pt.z, pt.size, pt.size * (0.6 + t * 0.8), 0);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
          return;
        }
        case 'ring': {
          const r = pt.size * (5 + 30 * U.ease.outQuad(t));
          const w = 2.6 * (1 - t);
          if (w <= 0.05) return;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.45, 0, 0, TAU);
          ctx.strokeStyle = LEAD; ctx.lineWidth = w + 1.4; ctx.stroke();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = pt.color || '#ffd86a'; ctx.lineWidth = w; ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
          return;
        }
        default: {
          const a = U.clamp(pt.life / pt.max, 0, 1);
          ctx.globalAlpha = a; ctx.fillStyle = pt.color || '#fff';
          ctx.beginPath(); ctx.arc(pt.x, pt.y - pt.z, (pt.size || 2) * 0.5, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    },

    drawNumber(ctx, n, view) {
      const V = tf(view);
      const spr = numSprite(n.value, n.crit, view.rt);
      const t = 1 - n.life / n.max;
      let sc = t < 0.12 ? 0.4 + (t / 0.12) * 0.85 : t < 0.26 ? 1.25 - ((t - 0.12) / 0.14) * 0.25 : 1;
      if (t > 0.75) sc *= 1 - ((t - 0.75) / 0.25) * 0.5;
      ctx.globalAlpha = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.2) : 1;
      blit(ctx, V, spr, n.x, n.y, sc, sc, 0);
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      if (!OV || OV.W !== view.W || OV.H !== view.H) buildOverlay(view.W, view.H);
      ctx.drawImage(OV.dark, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      const dx = Math.sin(view.rt * 0.12) * view.W * 0.025;
      ctx.drawImage(OV.light, dx - view.W * 0.05, 0, view.W * 1.1, view.H);
      ctx.globalCompositeOperation = 'source-over';
    },

    drawIcon(ctx, id, size) {
      const fn = ICONS[id] || ICONS.dmg;
      const k0 = K;
      ctx.save();
      ctx.scale(size / 48, size / 48);
      iconPaint(ctx, fn);
      ctx.restore();
      K = k0;
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e, src) {
      const h = e.type === 'colossus' ? 26 : e.type === 'ghost' ? 16 : 12;
      glint(game, e.x + (Math.random() - 0.5) * 6, e.y, h + (Math.random() - 0.5) * 6, e.type === 'ghost' ? 1 : 0, 0.55, 0.22);
      if (Math.random() < 0.45) shard(game, e.x, e.y, h, shardCols(e)[(Math.random() * 3) | 0], 50, 50, 0.6);
    },
    onKill(game, e) {
      const T = e.type, big = T === 'colossus';
      const h = big ? 26 : T === 'ghost' ? 15 : 11;
      const cols = shardCols(e);
      const n = big ? 16 : T === 'ghost' ? 6 : 8;
      for (let i = 0; i < n; i++) shard(game, e.x + (Math.random() - 0.5) * (big ? 20 : 8), e.y + 0.5, h + (Math.random() - 0.5) * (big ? 24 : 10), cols[i % cols.length], big ? 75 : 55, 70, big ? 1.4 : 1);
      const ng = big ? 5 : 2;
      for (let i = 0; i < ng; i++) glint(game, e.x + (Math.random() - 0.5) * 14, e.y, h + (Math.random() - 0.5) * 12, T === 'ghost' ? 1 : big ? 2 : 0, big ? 1.1 : 0.75, 0.4 + Math.random() * 0.2);
      if (big) game.addParticle({ kind: 'ring', x: e.x, y: e.y, life: 0.5, size: 1.5, drag: 0, color: '#ff6a7a' });
    },
    onHurt(game, p) {
      glint(game, p.x, p.y, 18, 2, 1.2, 0.3);
      for (let i = 0; i < 5; i++) shard(game, p.x, p.y + 0.5, 18, i & 1 ? 'orange' : 'gold', 60, 60, 0.8);
    },
    onPickup(game, g) {
      const p = game.player;
      glint(game, p.x + (Math.random() - 0.5) * 10, p.y + 0.5, 8 + Math.random() * 14, g.big ? 0 : 3, g.big ? 0.8 : 0.45, 0.28);
    },
    onShoot(game, pr) {
      if (Math.random() < 0.25) glint(game, pr.x, pr.y + 4, 4, 0, 0.3, 0.15);
    },
    onDash(game, p) {
      for (let i = 0; i < 4; i++) glint(game, p.x - p.dashX * i * 4 + (Math.random() - 0.5) * 6, p.y - p.dashY * i * 4, 6 + Math.random() * 14, 0, 0.5, 0.35);
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'ring', x: p.x, y: p.y, life: 0.7, size: 1.7, drag: 0, color: '#ffd86a' });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU, r = 10 + Math.random() * 16;
        game.addParticle({ kind: 'beam', tint: i % 4, x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r * 0.5, z: 0, vz: 0, drag: 0, life: 0.9 + Math.random() * 0.5, size: 0.8 + Math.random() * 0.5 });
      }
      for (let i = 0; i < 10; i++) glint(game, p.x + (Math.random() - 0.5) * 34, p.y, 6 + Math.random() * 30, i % 4, 0.8, 0.6 + Math.random() * 0.4);
    },
    onDeath(game, p) {
      for (let i = 0; i < 18; i++) shard(game, p.x, p.y + 0.5, 18, ['orange', 'gold', 'green', 'ruby'][i % 4], 80, 80, 1.2);
    },
  });
})();
