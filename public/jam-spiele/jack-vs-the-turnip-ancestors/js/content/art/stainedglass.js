/* Native art for the new enemies / upgrades in the 'stainedglass' world (Kirchenfenster) – see js/content/ART_API.md.
   Same technique as js/styles/stainedglass.js: figures are pre-rendered leaded-glass mosaics (outline pass in lead,
   then jewel-tone glass pieces with luminous centre, darker rim, streaks + glints, inner lead came), a "lit glass"
   flash copy per frame, shards assembling on spawn and the lit copy bursting on death. */
(function () {
  'use strict';
  const U = window.U, C = window.Content;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ---------- palette (copied from the style + accents) ---------- */
  const LEAD = '#17131c';
  const WARM = [255, 250, 232];
  const PAL = {
    stem: '#4f7c2c', leaf: ['#5fa83c', '#3f8a32', '#78bf4a'],
    cream: ['#f4e2b4', '#e8cc90', '#f8ecc8'], root: ['#e6cf9a', '#cfae72'],
    brown: ['#6b4a32', '#7e5a3c', '#5a3b2a', '#8a6440', '#644530'],
    violet: ['#5e3a7a', '#704690', '#52306a', '#7c5098'],
    purple: ['#7a3fae', '#9351c8', '#6a3298'],
    ruby: ['#e3203c', '#ff4a5a', '#b8142e', '#ff7080'],
    beet: ['#b8142e', '#c4283e', '#8e1030', '#d8304a', '#a51d34'],
    tox: ['#58a83c', '#6cc040', '#3f8a32', '#82cc4a', '#4c9a36'],
    rose: ['#e8668a', '#d8506e', '#f07c9a'],
    scarf: ['#c4283e', '#a51d34', '#d8404e'],
    ivory: ['#fbf0d4', '#ead2a0', '#f6e4b8', '#dcc08a'],
  };
  let K = 4;

  /* ---------- geometry + painter (copied from the style) ---------- */
  function splitPoly(poly, px, py, nx, ny) {
    const a = [], b = [], n = poly.length;
    for (let i = 0; i < n; i++) {
      const p = poly[i], q = poly[(i + 1) % n];
      const dp = (p[0] - px) * nx + (p[1] - py) * ny, dq = (q[0] - px) * nx + (q[1] - py) * ny;
      if (dp >= 0) a.push(p); else b.push(p);
      if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); const m = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; a.push(m); b.push(m); }
    }
    return [a, b];
  }
  function polyArea(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function polyInfo(p) {
    let cx = 0, cy = 0;
    for (const q of p) { cx += q[0]; cy += q[1]; }
    cx /= p.length; cy /= p.length;
    let r = 0;
    for (const q of p) r = Math.max(r, Math.hypot(q[0] - cx, q[1] - cy));
    return { cx, cy, r: r * 0.85 };
  }
  function bsp(poly, maxArea, rnd, out, depth) {
    if (polyArea(poly) <= maxArea || depth > 9) { out.push(poly); return; }
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, cx = 0, cy = 0;
    for (const q of poly) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); cx += q[0]; cy += q[1]; }
    cx /= poly.length; cy /= poly.length;
    const ang = (x1 - x0 > y1 - y0 ? 0 : PI / 2) + (rnd() - 0.5) * 1.2;
    const nx = Math.cos(ang), ny = Math.sin(ang), ext = Math.max(x1 - x0, y1 - y0);
    const [a, b] = splitPoly(poly, cx + nx * (rnd() - 0.5) * 0.35 * ext, cy + ny * (rnd() - 0.5) * 0.35 * ext, nx, ny);
    if (a.length < 3 || b.length < 3) { out.push(poly); return; }
    bsp(a, maxArea, rnd, out, depth + 1); bsp(b, maxArea, rnd, out, depth + 1);
  }
  const MOS = new Map();
  function mosaic(key, poly, maxArea, seed, colFn) {
    let m = MOS.get(key);
    if (m) return m;
    const rnd = U.mulberry32(seed), polys = [];
    bsp(poly, maxArea, rnd, polys, 0);
    m = polys.map((p, i) => { const inf = polyInfo(p); return { poly: p, cx: inf.cx, cy: inf.cy, r: inf.r, col: colFn(inf.cx, inf.cy, i, rnd) }; });
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
  function polyPath(c, p) { c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); }
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
  function leafShape(L) { return (c) => { c.moveTo(L.bx, L.by); c.quadraticCurveTo(L.ax, L.ay, L.tx, L.ty); c.quadraticCurveTo(L.cx2, L.cy2, L.bx, L.by); c.closePath(); }; }
  function leafCells(L, c1, c2) {
    return [
      { path: (c) => { c.moveTo(L.bx, L.by); c.quadraticCurveTo(L.ax, L.ay, L.tx, L.ty); c.closePath(); }, col: c1, cx: (L.mx * 2 + L.ax) / 3, cy: (L.my * 2 + L.ay) / 3, r: Math.hypot(L.tx - L.bx, L.ty - L.by) * 0.45 },
      { path: (c) => { c.moveTo(L.bx, L.by); c.quadraticCurveTo(L.cx2, L.cy2, L.tx, L.ty); c.closePath(); }, col: c2, cx: (L.mx * 2 + L.cx2) / 3, cy: (L.my * 2 + L.cy2) / 3, r: Math.hypot(L.tx - L.bx, L.ty - L.by) * 0.45 },
    ];
  }
  function leafPart(P, bx, by, ang, len, wid, c1, c2) { const L = leafPts(bx, by, ang, len, wid); P.part(leafShape(L), leafCells(L, c1, c2)); }
  function ribCells(cx, cy, rx, ry, fs, cols) {
    const cells = [];
    for (let i = 0; i < fs.length - 1; i++) {
      const a = fs[i], b = fs[i + 1];
      let path;
      if (a < 0 && b > 0) { const o = Math.max(-a, b); path = (c) => { c.moveTo(cx + rx * o, cy); c.ellipse(cx, cy, rx * o, ry, 0, 0, TAU); }; }
      else if (b <= 0) { const o = -a, n = Math.max(0.01, -b); path = (c) => { c.moveTo(cx, cy - ry); c.ellipse(cx, cy, rx * o, ry, 0, -PI / 2, PI / 2, true); c.ellipse(cx, cy, rx * n, ry, 0, PI / 2, -PI / 2, false); c.closePath(); }; }
      else { const n = Math.max(0.01, a), o = b; path = (c) => { c.moveTo(cx, cy - ry); c.ellipse(cx, cy, rx * o, ry, 0, -PI / 2, PI / 2, false); c.ellipse(cx, cy, rx * n, ry, 0, PI / 2, -PI / 2, true); c.closePath(); }; }
      cells.push({ path, col: cols[i % cols.length], cx: cx + rx * (Math.max(-1, a) + Math.min(1, b)) / 2, cy: cy - ry * 0.1, r: Math.max(rx * (b - a) * 0.75, ry * 0.95) });
    }
    return cells;
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
  function starPts(n, ro, ri, cx, cy, rot) {
    const p = [];
    for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU - PI / 2, r = i & 1 ? ri : ro; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return p;
  }
  function Painter(ctx, mode, ol, il, seed) { this.ctx = ctx; this.mode = mode; this.ol = ol; this.il = il; this.rnd = U.mulberry32(seed || 1); }
  Painter.prototype.part = function (shape, cells, o) {
    o = o || {};
    const c = this.ctx;
    if (this.mode === 'outline') {
      if (o.noOutline) return;
      c.beginPath(); shape(c);
      c.lineWidth = (o.ol != null ? o.ol : this.ol) * 2;
      c.strokeStyle = LEAD; c.fillStyle = LEAD; c.stroke(); c.fill();
      return;
    }
    c.save(); c.beginPath(); shape(c); c.clip();
    for (const cell of cells) this.glass(cell, o);
    c.restore();
    if (!o.noBorder) { c.beginPath(); shape(c); c.lineWidth = this.il * 1.2; c.strokeStyle = LEAD; c.stroke(); }
  };
  Painter.prototype.piece = function (shape, col, cx, cy, r, o) {
    o = o || {};
    this.part(shape, [{ path: shape, col, cx, cy, r, glow: o.glow, noGlint: o.noGlint }], o);
  };
  Painter.prototype.glass = function (cell, o) {
    const c = this.ctx, flash = this.mode === 'flash';
    const glow = cell.glow || o.glow;
    let col = U.hex(cell.col);
    col = U.mul(col, 1 + (this.rnd() - 0.5) * (o.jitter != null ? o.jitter : 0.12));
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
  function pair(box, fn, seed) { return { n: build(box, fn, 'fill', seed), f: build(box, fn, 'flash', seed) }; }
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
  const SHARD_SHAPES = [[[-2.6, -1.4], [2.8, -2.2], [0.6, 2.4]], [[-2.2, -2.2], [1.6, -1.8], [2.4, 1.6], [-1.2, 2.2]], [[-3, 0.4], [0.4, -2.4], [3, 0.8], [0.2, 1.4]]];
  const SHARD_COLS = { violet: '#8a4ac0', magenta: '#b8409a', indigo: '#6656c6', cream: '#f2deb0', green: '#58a83c', brown: '#7e5a3c', ruby: '#e3203c', orange: '#ff8a22', gold: '#f2c040', dkviolet: '#5e3a7a' };
  function shardParts(P, shape, col) { const inf = polyInfo(shape); P.part(PP(shape), [{ poly: shape, col, cx: inf.cx, cy: inf.cy, r: inf.r * 1.2 }], { ol: 0.4 }); }

  /* ================= figures (drawn facing right; the style mirrors with sx < 0) ================= */
  const eyePieces = (P, list, col, ol) => { for (const e of list) { const inf = polyInfo(e); P.piece(PP(e), col, inf.cx, inf.cy, inf.r * 1.3, { glow: true, ol: ol || 0.5 }); } };

  /* ---- Rüben-Spucker: mottled green / violet turnip with a cannon snout ---- */
  function spitterParts(P, fr, k) {
    const lo = [-1.6, 0, 1.6, 0][fr], sw = [0, 0.12, 0, -0.12][fr];
    P.piece(CAP(-3.4, -4, -4.4 + lo, 0, 1.3, 0.85), PAL.root[1], -3.8, -2, 2);
    P.piece(CAP(3.0, -4, 4.0 - lo, 0, 1.3, 0.85), PAL.root[0], 3.4, -2, 2);
    const top = -21 - k * 1.4, w = 9.4 + k * 1.7;
    [[-0.6, top + 2, -2.15 + sw, 8.5, 2.3], [0.6, top + 2, -1.0 + sw, 8.5, 2.3], [0, top + 1.5, -1.6 + sw * 0.6, 10, 2.5]].forEach((d, i) =>
      leafPart(P, d[0], d[1], d[2], d[3], d[4], PAL.purple[(i + 1) % 3], PAL.violet[i % 4]));
    const cells = mosaic('sp' + k, ellPoly(0, -12 - k * 0.7, 14 + k * 2, 13 + k, 16, 1.1), 15, 41 + Math.round(k * 10), (x, y, i, r) => {
      if (y < -14.5 - k * 0.8 + (r() - 0.5) * 3) return PAL.purple[Math.floor(r() * 3)];
      return r() < 0.2 ? PAL.violet[Math.floor(r() * 4)] : PAL.tox[Math.floor(r() * 5)];
    });
    P.part((c) => turnipPath(c, 0, top, -2.4, w), cells);
    // swelling cheek behind the snout
    if (k > 0) P.piece(ELL(5.2, -8.6, 2.2 + k * 1.6, 2.0 + k * 1.3), '#9ad85a', 5.2, -8.8, 2.4 + k);
    // snout tube (cannon)
    const mx = 12.6 + k * 0.8, my = -10.2, mr = 3.0 + k * 0.9;
    P.part(CAP(4.8, my, mx, my, 2.9, mr * 0.95), [
      { poly: [[3, -16], [8.6, -16], [8.6, -4], [3, -4]], col: PAL.tox[3], cx: 6.2, cy: my - 1, r: 3.2 },
      { poly: [[8.6, -16], [mx + 4, -16], [mx + 4, -4], [8.6, -4]], col: PAL.tox[1], cx: 10.6, cy: my - 1, r: 3.2 },
    ]);
    // mouth opening: hollow at rest, glowing juice while charging
    P.piece(ELL(mx + 0.4, my, 1.7 + k * 0.5, mr), k > 0 ? (k > 0.8 ? '#e8ff8a' : '#b8ff4a') : '#1e3618', mx, my, mr, { glow: k > 0, noGlint: true, ol: 0.6 });
    // drool drop
    P.piece(ELL(mx - 0.4, my + mr + 1.6, 0.9, 1.3), '#9cff3a', mx - 0.4, my + mr + 1.6, 1.2, { glow: true, ol: 0.4 });
    // angry eyes
    const ey = -14.2 - k * 0.8;
    eyePieces(P, [[[-5.4, ey - 1.6], [-1.2, ey - 0.2], [-1.8, ey + 1.8], [-4.8, ey + 1.2]], [[1.0, ey - 0.2], [5.2, ey - 1.6], [4.6, ey + 1.2], [1.6, ey + 1.8]]], '#d8ff3a');
  }

  /* ---- Zündrübe: round beet bomb with a fuse in its leaf tuft ---- */
  function bomberParts(P, fr) {
    const s = [-1, 0, 1, 0][fr], s2 = [0, 1, 0, -1][fr];
    // four scurrying root legs
    [[-4.6, s], [4.6, -s], [-1.6, s2], [1.6, -s2]].forEach(([hx, ph], i) =>
      P.piece(CAP(hx, -4.2, hx + ph * 1.6 + (hx > 0 ? 0.8 : -0.8), -Math.max(0, ph) * 1.4, 1.05, 0.7), PAL.root[i & 1], hx, -2, 1.6));
    // tap-root tail
    P.piece(CAP(-5.4, -6.2, -9.4, -4.4, 1.2, 0.5), PAL.beet[1], -7.4, -5.4, 1.6);
    // leaves + fuse
    leafPart(P, -0.5, -16.4, -2.1, 5.2, 1.7, PAL.leaf[0], PAL.leaf[1]);
    leafPart(P, 0.5, -16.4, -0.9, 4.8, 1.6, PAL.leaf[2], PAL.leaf[1]);
    const F = [[0, -16.6], [-0.6, -19.2], [1.4, -21.2], [1.8, -23.6]];
    for (let i = 0; i < F.length - 1; i++) P.piece(CAP(F[i][0], F[i][1], F[i + 1][0], F[i + 1][1], 0.75, 0.7), i & 1 ? '#c8a050' : '#e2bc68', (F[i][0] + F[i + 1][0]) / 2, (F[i][1] + F[i + 1][1]) / 2, 1.2, { ol: 0.6 });
    // the bulb: deep beet red, a warm orange belly band
    const cells = mosaic('bomb', ellPoly(0, -10.4, 7.4, 7.2, 14, 1.1), 11, 77, (x, y, i, r) => (y > -6.6 + (r() - 0.5) * 2 ? (r() < 0.5 ? '#e2681a' : '#c85a14') : PAL.beet[Math.floor(r() * 5)]));
    P.part(ELL(0, -10.4, 7.3, 7.0), cells);
    // mean slit eyes
    eyePieces(P, [[[-4.6, -12.6], [-0.9, -11.0], [-1.4, -9.6], [-4.0, -10.4]], [[0.9, -11.0], [4.6, -12.6], [4.0, -10.4], [1.4, -9.6]]], '#ffd23a', 0.45);
    // gritted teeth
    P.piece(RR(-2.6, -7.8, 5.2, 1.9, 0.6), '#f4e2b4', 0, -6.9, 2.4, { noGlint: true, ol: 0.45 });
    P.detail((c) => {
      c.strokeStyle = LEAD; c.lineWidth = 0.45; c.beginPath();
      for (const x of [-1.3, 0, 1.3]) { c.moveTo(x, -7.8); c.lineTo(x, -5.9); }
      c.stroke();
      c.lineWidth = 0.75; c.beginPath(); c.moveTo(-5.0, -14.4); c.lineTo(-1.2, -12.4); c.moveTo(5.0, -14.4); c.lineTo(1.2, -12.4); c.stroke();
    });
  }
  const BOMB_TIP = [1.8, -23.6];

  /* ---- Wurzel-Bock: parsnip ram (side view) with segmented glass horns ---- */
  // mode 0 trot, 1/2 telegraph (reared, scraping), 3 dash (lunging), 4 dizzy
  const CH_PIV = [-8, -6];
  const chAng = (m) => (m === 1 || m === 2 ? -0.24 : m === 3 ? 0.14 : 0);
  const rotP = (x, y, a) => { const cs = Math.cos(a), sn = Math.sin(a); return [CH_PIV[0] + (x - CH_PIV[0]) * cs - (y - CH_PIV[1]) * sn, CH_PIV[1] + (x - CH_PIV[0]) * sn + (y - CH_PIV[1]) * cs]; };
  function hornPieces(P, cx, cy, a0, r0, turns, w0, w1, cols, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = a0 - t * turns * TAU, r = r0 * (1 - 0.62 * t);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, w0 + (w1 - w0) * t]);
    }
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[i + 1];
      P.piece(CAP(p[0], p[1], q[0], q[1], p[2], q[2]), cols[i % cols.length], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) * 0.8, { ol: 0.7 });
    }
  }
  function chargerParts(P, fr, mode) {
    const s = [-1, 0, 1, 0][fr];
    const ang = chAng(mode), red = mode === 1 || mode === 2;
    const bob = mode === 0 ? -Math.abs(s) * 0.9 : 0;
    const R = (x, y) => { const p = rotP(x, y, ang); return [p[0], p[1] + bob]; };
    // legs (far pair first)
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
      P.piece(CAP(h[0], h[1], fx, fy - 0.6, 1.7, 1.2), near ? PAL.root[0] : PAL.brown[3], (h[0] + fx) / 2, (h[1] + fy) / 2, 2.4);
      P.piece(RR(fx - 1.6, fy - 1.2, 3.4, 1.4, 0.5), PAL.brown[2], fx, fy - 0.5, 1.4, { noGlint: true, ol: 0.5 });
    }
    const c = P.ctx;
    c.save(); c.translate(0, bob); c.translate(CH_PIV[0], CH_PIV[1]); c.rotate(ang); c.translate(-CH_PIV[0], -CH_PIV[1]);
    // far horn (darker, behind)
    hornPieces(P, 4.6, -16.6, -0.35, 4.6, 0.82, 1.7, 0.8, [PAL.ivory[3], PAL.brown[3]], 6);
    // tail root
    P.piece(CAP(-14, -12.4, -18.2, -15.6, 1.1, 0.45), PAL.root[1], -16, -14, 1.4);
    // body: parsnip lying, cream with a toasted top
    const body = (k) => {
      k.moveTo(6.0, -18.8);
      k.bezierCurveTo(-1.0, -19.6, -8.0, -17.4, -15.4, -12.4);
      k.bezierCurveTo(-8.0, -7.8, -1.0, -6.0, 6.0, -6.4);
      k.bezierCurveTo(9.6, -6.8, 10.4, -18.2, 6.0, -18.8); k.closePath();
    };
    const cells = mosaic('chBody', rectPoly(-17, -21, 11, -5), 30, 19, (x, y, i, r) => (y < -15.5 + (r() - 0.5) * 3 ? PAL.brown[[3, 1, 4][Math.floor(r() * 3)]] : y > -9.5 ? PAL.root[0] : ['#cfae72', '#d8b67a', '#c49a5c'][Math.floor(r() * 3)]));
    P.part(body, cells);
    // tuft
    leafPart(P, 7.4, -17.4, -1.95, 5.6, 1.6, PAL.leaf[0], PAL.leaf[1]);
    leafPart(P, 8.4, -17.2, -1.25, 4.8, 1.5, PAL.leaf[2], PAL.leaf[1]);
    // head: the thick end, lowered
    const head = (k) => {
      k.moveTo(8.0, -17.4);
      k.bezierCurveTo(12.2, -17.6, 14.6, -13.6, 15.0, -10.0);
      k.bezierCurveTo(15.2, -7.4, 13.2, -5.8, 11.0, -6.4);
      k.bezierCurveTo(8.0, -7.0, 5.2, -9.6, 5.2, -12.8);
      k.bezierCurveTo(5.2, -15.4, 6.4, -17.3, 8.0, -17.4); k.closePath();
    };
    P.part(head, [
      { poly: [[4, -19], [16, -19], [16, -12], [4, -12]], col: PAL.brown[3], cx: 10, cy: -14.5, r: 4.4 },
      { poly: [[4, -12], [16, -12], [16, -4], [4, -4]], col: '#d8b67a', cx: 11.6, cy: -9, r: 4 },
    ]);
    // eye
    if (mode === 4) {
      P.piece(ELL(11.4, -12.6, 1.7, 1.7), '#f8ecc8', 11.4, -12.6, 1.7, { noGlint: true, ol: 0.5 });
      P.detail((k) => { k.strokeStyle = LEAD; k.lineWidth = 0.5; k.beginPath(); k.arc(11.4, -12.6, 1.1, 0, 4.4); k.arc(11.4, -12.6, 0.45, 4.4, 9.5); k.stroke(); });
    } else {
      eyePieces(P, [[[9.6, -14.0], [13.6, -12.8], [13.0, -11.0], [10.0, -11.8]]], red ? '#ff3a3a' : '#ffb21e', 0.5);
    }
    P.detail((k) => { k.strokeStyle = LEAD; k.lineWidth = 0.7; k.beginPath(); k.moveTo(13.4, -8.6); k.lineTo(14.2, -7.6); k.stroke(); });
    // near horn: big ivory curl around the ear
    hornPieces(P, 5.6, -15.4, -0.45, 5.0, 0.86, 2.1, 0.9, [PAL.ivory[0], '#c2a070', PAL.ivory[2], '#b8946a'], 7);
    c.restore();
  }
  const CH_EYE = (m) => rotP(11.6, -12.6, chAng(m));

  /* ---- Rüben-Ahnin: matriarch rutabaga, red headscarf, cane, crown of sprouts ---- */
  function babyParts(P, x, y, s, key, lean) {
    leafPart(P, x, y - 6.0 * s, -1.57 + lean, 6.0 * s, 1.9 * s, PAL.leaf[2], PAL.leaf[0]);
    P.part((c) => turnipPath(c, x, y - 6 * s, y - 1 * s, 3.1 * s), [
      { poly: rectPoly(x - 5, y - 8 * s, x + 5, y - 3.6 * s), col: PAL.rose[0], cx: x, cy: y - 4.6 * s, r: 3 * s },
      { poly: rectPoly(x - 5, y - 3.6 * s, x + 5, y + 2), col: PAL.cream[0], cx: x, cy: y - 2 * s, r: 2.6 * s },
    ], { ol: 0.7 });
    P.detail((c) => { c.fillStyle = LEAD; c.beginPath(); c.arc(x - 0.9 * s, y - 3.9 * s, 0.42, 0, TAU); c.arc(x + 0.9 * s, y - 3.9 * s, 0.42, 0, TAU); c.fill(); });
  }
  function motherParts(P, fr) {
    const lo = [-1.4, 0, 1.4, 0][fr], fl = [0, 0.6, 0, -0.6][fr];
    P.piece(CAP(-5, -6, -5.6 + lo, -0.4, 2.2, 1.6), PAL.root[1], -5.2, -3, 2.6);
    P.piece(CAP(5, -6, 5.6 - lo, -0.4, 2.2, 1.6), PAL.root[0], 5.2, -3, 2.6);
    // back arm
    P.piece(CAP(-11.4, -15, -14.4, -9.4 + fl, 1.6, 1.2), PAL.root[1], -13, -12, 2.2);
    // scarf tails
    P.part(PP([[-11.2, -25.4], [-17.6, -19.6 + fl], [-15.0, -18.4 + fl], [-10.4, -23.6]]), [{ poly: [[-11.2, -25.4], [-17.6, -19.6 + fl], [-15.0, -18.4 + fl], [-10.4, -23.6]], col: PAL.scarf[1], cx: -13.6, cy: -21.6, r: 3 }]);
    P.part(PP([[-11.0, -24.2], [-14.6, -16.0 - fl], [-12.2, -16.2 - fl], [-9.8, -23.0]]), [{ poly: [[-11.0, -24.2], [-14.6, -16.0 - fl], [-12.2, -16.2 - fl], [-9.8, -23.0]], col: PAL.scarf[2], cx: -12, cy: -20, r: 3 }]);
    // body
    const cells = mosaic('moBody', ellPoly(0, -18, 15.5, 16, 18, 1.1), 55, 53, (x, y, i, r) => (y < -13 + (r() - 0.5) * 4 ? PAL.purple[Math.floor(r() * 3)] : PAL.cream[Math.floor(r() * 3)]));
    P.part((c) => turnipPath(c, 0, -32, -4.4, 13.4), cells);
    // headscarf
    const scarf = (c) => {
      c.moveTo(-12.6, -22.4);
      c.bezierCurveTo(-12.2, -30.0, -6.6, -34.0, 0, -34.0);
      c.bezierCurveTo(6.6, -34.0, 12.2, -30.0, 12.8, -22.4);
      c.quadraticCurveTo(6.0, -25.4, 0, -24.8); c.quadraticCurveTo(-6.4, -24.4, -12.6, -22.4); c.closePath();
    };
    P.part(scarf, [
      { poly: [[-14, -36], [-4.4, -36], [-5.4, -22], [-14, -22]], col: PAL.scarf[0], cx: -8, cy: -28, r: 5 },
      { poly: [[-4.4, -36], [4.6, -36], [5.2, -22], [-5.4, -22]], col: PAL.scarf[2], cx: 0, cy: -29.6, r: 5 },
      { poly: [[4.6, -36], [14, -36], [14, -22], [5.2, -22]], col: PAL.scarf[1], cx: 8.4, cy: -28, r: 5 },
    ]);
    // gold polka dots on the scarf
    for (const [dx, dy] of [[-8.2, -26.6], [-2.6, -30.4], [3.4, -30.6], [8.6, -26.8], [0.4, -26.6]]) P.piece(ELL(dx, dy, 0.75, 0.75), '#f8ecc8', dx, dy, 0.8, { ol: 0.3, noGlint: true });
    P.piece(ELL(-11.6, -23.8, 1.9, 1.5, 0.4), PAL.scarf[0], -11.6, -23.8, 1.8);
    // crown of baby sprouts
    babyParts(P, -6.4, -31.4, 0.95, 'a', -0.25);
    babyParts(P, 6.6, -31.4, 0.95, 'b', 0.25);
    babyParts(P, 0.2, -33.4, 1.15, 'c', 0);
    // face: heavy-lidded glowing eyes, bushy brows, nose, stern mouth
    eyePieces(P, [[[1.8, -19.8], [6.0, -19.8], [5.2, -18.4], [2.6, -18.4]], [[7.8, -19.8], [12.0, -19.8], [11.2, -18.4], [8.6, -18.4]]], '#ffb21e', 0.5);
    P.piece(RR(1.2, -22.4, 5.0, 1.4, 0.6), PAL.cream[2], 3.7, -21.7, 2, { noGlint: true, ol: 0.5 });
    P.piece(RR(7.4, -22.4, 5.0, 1.4, 0.6), PAL.cream[2], 9.9, -21.7, 2, { noGlint: true, ol: 0.5 });
    P.piece(ELL(7.4, -15.8, 1.6, 2.2), PAL.root[0], 7.4, -15.8, 2, { noGlint: true, ol: 0.5 });
    P.detail((c) => {
      c.strokeStyle = LEAD; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(3.2, -11.4); c.quadraticCurveTo(6.6, -13.2, 10.0, -11.4); c.stroke();
      c.lineWidth = 0.5; c.beginPath();
      c.moveTo(-9.0, -11.0); c.quadraticCurveTo(-7.0, -10.0, -5.0, -10.6);
      c.moveTo(1.4, -8.6); c.quadraticCurveTo(4.4, -7.6, 7.2, -8.6);
      c.stroke();
    });
    // cane + hand
    P.piece(CAP(14.6, -0.6, 13.6, -16.6, 1.0, 1.0), PAL.brown[3], 14, -8, 2);
    P.piece((c) => { c.moveTo(12.6, -16.2); c.quadraticCurveTo(12.8, -21.6, 16.4, -21.2); c.quadraticCurveTo(19.4, -20.6, 18.6, -17.4); c.lineTo(17.0, -17.8); c.quadraticCurveTo(17.6, -19.6, 16.2, -19.6); c.quadraticCurveTo(14.6, -19.6, 14.6, -16.2); c.closePath(); }, PAL.brown[1], 15.6, -19.4, 2.4);
    P.piece(CAP(10.8, -13.6, 13.4, -15.0, 1.5, 1.3), PAL.root[0], 12, -14.2, 1.8);
  }

  /* ---- Rübchen: tiny angry baby turnip (rose crown) ---- */
  function sproutParts(P, fr) {
    const lo = [-1.2, 0, 1.2, 0][fr];
    P.piece(CAP(-2, -3, -2.8 + lo, 0, 0.9, 0.6), PAL.root[1], -2.4, -1.5, 1.4);
    P.piece(CAP(2, -3, 2.8 - lo, 0, 0.9, 0.6), PAL.root[0], 2.4, -1.5, 1.4);
    leafPart(P, 0.2, -12.6, -1.15 + [0, 0.12, 0, -0.12][fr], 6.4, 2.0, PAL.leaf[0], PAL.leaf[2]);
    P.part((c) => turnipPath(c, 0, -13, -3, 5.6), [
      { poly: [[-8, -15], [0.4, -15], [-0.6, -8.4], [-8, -8.0]], col: PAL.rose[0], cx: -2.6, cy: -10.8, r: 4 },
      { poly: [[0.4, -15], [8, -15], [8, -8.2], [-0.6, -8.4]], col: PAL.rose[2], cx: 2.6, cy: -10.8, r: 4 },
      { poly: [[-8, -8.0], [-0.6, -8.4], [8, -8.2], [8, 2], [-8, 2]], col: PAL.cream[0], cx: 0, cy: -5.6, r: 4 },
    ]);
    eyePieces(P, [[[-3.6, -9.4], [-0.6, -8.4], [-1.0, -6.6], [-3.2, -7.0]], [[0.6, -8.4], [3.6, -9.4], [3.2, -7.0], [1.0, -6.6]]], '#ff5a26', 0.45);
    P.detail((c) => { c.strokeStyle = LEAD; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-1.2, -4.4); c.quadraticCurveTo(0, -5.2, 1.2, -4.4); c.stroke(); });
  }

  /* ---- objects ---- */
  function shotParts(P) {
    P.piece(ELL(-4.6, 0, 1.3, 1.1), '#7ad83a', -4.6, 0, 1.3, { glow: true, ol: 0.5 });
    const sh = (c) => { c.moveTo(3.6, 0); c.bezierCurveTo(3.6, -3.0, 0.4, -3.4, -1.4, -2.6); c.quadraticCurveTo(-3.2, -1.6, -3.4, 0); c.quadraticCurveTo(-3.2, 1.6, -1.4, 2.6); c.bezierCurveTo(0.4, 3.4, 3.6, 3.0, 3.6, 0); c.closePath(); };
    P.part(sh, [
      { poly: [[-4, -4], [4, -4], [4, 0], [-4, 0]], col: '#e2ff6a', cx: 1, cy: -1.2, r: 3.2, glow: true },
      { poly: [[-4, 0], [4, 0], [4, 4], [-4, 4]], col: '#7ad83a', cx: 0.6, cy: 1.2, r: 3, glow: true },
    ], { ol: 0.85 });
  }
  /* ================= caches ================= */
  const SPR = {};
  let G = null;
  const BUILD = {
    spitter: () => ({ walk: [0, 1, 2, 3].map((f) => pair([-14, -35, 19, 4], (P) => spitterParts(P, f, 0), 210 + f)), aim: [0.4, 0.75, 1].map((k, i) => pair([-16, -37, 21, 4], (P) => spitterParts(P, 1, k), 220 + i)) }),
    bomber: () => ({ walk: [0, 1, 2, 3].map((f) => pair([-12, -27, 10, 3], (P) => bomberParts(P, f), 230 + f)) }),
    charger: () => ({
      walk: [0, 1, 2, 3].map((f) => pair([-21, -28, 18, 3], (P) => chargerParts(P, f, 0), 240 + f)),
      tele: [1, 2].map((m) => pair([-21, -32, 19, 3], (P) => chargerParts(P, 0, m), 250 + m)),
      dash: pair([-23, -28, 21, 3], (P) => chargerParts(P, 0, 3), 255),
      rest: pair([-21, -28, 18, 3], (P) => chargerParts(P, 0, 4), 256),
    }),
    mother: () => ({ walk: [0, 1, 2, 3].map((f) => pair([-20, -44, 21, 4], (P) => motherParts(P, f), 260 + f)) }),
    sprout: () => ({ walk: [0, 1, 2, 3].map((f) => pair([-9, -21, 9, 3], (P) => sproutParts(P, f), 270 + f)) }),
  };
  const get = (t) => SPR[t] || (SPR[t] = BUILD[t]());
  const SH = { spitter: ['green', 'violet', 'green', 'cream'], bomber: ['ruby', 'orange', 'ruby', 'green'], charger: ['cream', 'brown', 'cream', 'gold'], mother: ['dkviolet', 'cream', 'ruby', 'violet', 'gold'], sprout: ['magenta', 'cream', 'green'] };
  const HGT = { spitter: 12, bomber: 10, charger: 12, mother: 20, sprout: 7 };
  let shardSpr = null;

  /* ================= drawing ================= */
  function blit(ctx, s, x, y, sx, sy, rot) {
    const k = 1 / K;
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.scale(sx, sy);
    ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
    ctx.restore();
  }
  function glow(ctx, s, x, y, sc, a) {
    if (a <= 0.003) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a);
    blit(ctx, s, x, y, sc, sc, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  /** spawn (shards fly in and assemble) / death (lit glass bursts) exactly like the style; true = handled */
  function lifecycle(ctx, e, set, type, y, sx, sy, rot) {
    if (e.spawnT < 1) {
      const q = e.spawnT, cols = SH[type], big = type === 'mother' ? 1.3 : type === 'sprout' ? 0.7 : 1, h = HGT[type];
      const n = type === 'mother' ? 9 : type === 'sprout' ? 4 : 6;
      const ease = U.ease.outQuad(U.clamp(q / 0.85, 0, 1));
      const sa = U.clamp(q * 4, 0, 1) * (1 - U.smoothstep(0.78, 0.95, q));
      if (sa > 0.01) {
        ctx.globalAlpha = sa;
        for (let i = 0; i < n; i++) {
          const a = e.seed * 40 + (i / n) * TAU, r = (1 - ease) * (type === 'mother' ? 42 : 30) + 2;
          blit(ctx, shardSpr[cols[i % cols.length]][i % 3], e.x + Math.cos(a) * r, e.y - h + Math.sin(a) * r * 0.6 - (1 - ease) * 10, big, big, a + (1 - ease) * 9);
        }
        ctx.globalAlpha = 1;
      }
      const ba = U.smoothstep(0.6, 0.92, q);
      if (ba <= 0.01) return true;
      ctx.globalAlpha = ba;
      blit(ctx, set.n, e.x, y, sx, sy, rot);
      const fa = 1 - U.smoothstep(0.85, 1, q);
      if (fa > 0.01) { ctx.globalAlpha = ba * fa * 0.8; blit(ctx, set.f, e.x, y, sx, sy, rot); }
      ctx.globalAlpha = 1;
      glow(ctx, G.warm, e.x, e.y - h, big * 0.9, Math.sin(U.clamp((q - 0.6) / 0.4, 0, 1) * PI) * 0.6);
      return true;
    }
    if (e.dying) {
      const q = e.deathT;
      if (q >= 0.22) return true;
      const k = 1 + q * 0.8;
      ctx.globalAlpha = 1 - q / 0.22;
      blit(ctx, set.f, e.x, y, sx * k, sy * k, rot);
      ctx.globalAlpha = 1;
      return true;
    }
    return false;
  }
  /** normal draw with the style's squash-on-hit + capped "lit glass" flash */
  function body(ctx, e, set, x, y, sx, sy, rot) {
    const fl = e.flash;
    if (fl > 0) { sx *= 1 + 0.12 * fl; sy *= 1 - 0.08 * fl; }
    blit(ctx, set.n, x, y, sx, sy, rot);
    if (fl > 0.02) { ctx.globalAlpha = Math.min(0.62, fl * 0.9); blit(ctx, set.f, x, y, sx, sy, rot); ctx.globalAlpha = 1; }
  }
  function walkPh(e, rate) { const ph = e.anim * rate + e.seed; return { f: Math.floor(ph * 4) & 3, sn: Math.sin(ph * TAU) }; }
  function shard(game, x, y, z, col, sp, vz, size) {
    const a = Math.random() * TAU, s = sp * (0.5 + Math.random() * 0.7);
    game.addParticle({ kind: 'shard', col, sh: (Math.random() * 3) | 0, x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: vz * (0.6 + Math.random() * 0.6), grav: 300, drag: 1.4, life: 0.9 + Math.random() * 0.5, size: size * (0.75 + Math.random() * 0.5), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16 });
  }

  C.art('stainedglass', {
    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      K = Math.max(3, Math.min(5, Math.round(((cssH * dpr) / 360) * 1.5)));
      G = {
        warm: glowSprite([255, 190, 80], 16), ruby: glowSprite([255, 60, 80], 14), tox: glowSprite([150, 255, 80], 12),
        gold: glowSprite([255, 210, 90], 10), rose: glowSprite([255, 120, 170], 16), ice: glowSprite([150, 210, 255], 14),
        glint: glintSprite([255, 240, 200]), glintG: glintSprite([200, 255, 170]),
      };
      shardSpr = {};
      for (const k in SHARD_COLS) shardSpr[k] = SHARD_SHAPES.map((sh, i) => build([-4, -4, 4, 4], (P) => shardParts(P, sh, SHARD_COLS[k]), 'fill', 90 + i, 0.5, 0.4));
      G.shot = build([-6.5, -4.5, 5, 4.5], shotParts, 'fill', 7, 0.8, 0.5);
    },

    enemies: {
      spitter(ctx, e, view) {
        const S = get('spitter'), fx = e.facing < 0 ? -1 : 1, scl = 0.95 + e.seed * 0.1;
        const aiming = e.mode === 'aim' && e.spawnT >= 1 && !e.dying;
        const k = aiming ? e.charge || 0 : 0;
        const w = walkPh(e, 0.8);
        let set = S.walk[w.f], y = e.y, x = e.x, rot = w.sn * 0.08, sx = scl * 0.92 * fx, sy = scl * 0.92;
        y -= Math.abs(w.sn) * 1.1;
        if (aiming) { set = S.aim[k < 0.45 ? 0 : k < 0.8 ? 1 : 2]; rot = 0; y = e.y; x += Math.sin(view.rt * 55 + e.seed * 9) * 0.5 * k; }
        if (lifecycle(ctx, e, set, 'spitter', y, sx, sy, rot)) return;
        const sp = e.spit || 0;
        if (sp > 0) { const q = sp * sp; sx *= 1 + 0.16 * q; sy *= 1 - 0.16 * q; x -= fx * 2.2 * q; }
        body(ctx, e, set, x, y, sx, sy, rot);
        const mx = x + fx * (13 + 0.8 * k) * scl * 0.92, my = y - (10.2) * scl * 0.92;
        if (aiming) {
          glow(ctx, G.tox, mx, my, 0.4 + 0.6 * k, 0.3 + 0.6 * k);
          if (k > 0.6) glow(ctx, G.glintG, mx, my, 0.3 + 0.5 * (k - 0.6), (k - 0.6) * 2.2);
        }
        if (sp > 0) {
          glow(ctx, G.tox, mx, my, 0.5 + 0.4 * sp, sp * 0.9);
          ctx.fillStyle = '#c6ff4a'; ctx.strokeStyle = '#17131c'; ctx.lineWidth = 0.5; ctx.globalAlpha = sp;
          for (let i = 0; i < 4; i++) {
            const a = (i - 1.5) * 0.4 + e.seed, d = 2.5 + (1 - sp) * (6 + i * 1.5);
            ctx.beginPath(); ctx.arc(mx + fx * Math.cos(a) * d, my + Math.sin(a) * d, 0.9 * sp + 0.3, 0, TAU); ctx.fill(); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      },

      bomber(ctx, e, view) {
        const S = get('bomber'), fx = e.facing < 0 ? -1 : 1, scl = 0.95 + e.seed * 0.1;
        const w = walkPh(e, e.armed ? 1.5 : 1.15);
        const set = S.walk[w.f];
        let y = e.y - Math.abs(w.sn) * 1.0, x = e.x, rot = w.sn * 0.1, sx = scl * 0.92 * fx, sy = scl * 0.92;
        if (lifecycle(ctx, e, set, 'bomber', y, sx, sy, rot)) return;
        const fu = e.armed ? e.fuse || 0 : 0;
        let blink = false;
        if (e.armed) {
          const sw = 1 + 0.12 * fu + 0.04 * Math.sin(view.rt * 40) * fu;
          sx *= sw; sy *= sw; x += Math.sin(view.rt * 70 + e.seed * 7) * 0.5 * fu;
          blink = Math.sin(fu * (5 + 18 * fu) * TAU) > 0;
        }
        body(ctx, e, set, x, y, sx, sy, rot);
        if (e.armed) {
          if (blink) { ctx.globalAlpha = 0.75; blit(ctx, set.f, x, y, sx, sy, rot); ctx.globalAlpha = 1; }
          glow(ctx, G.ruby, x, y - 10, 1.0 + 0.4 * fu, blink ? 0.9 : 0.35 + 0.3 * fu);
        }
        // fuse spark at the tip
        const cs = Math.cos(rot), sn = Math.sin(rot);
        const lx = BOMB_TIP[0] * sx, ly = BOMB_TIP[1] * sy;
        const tx = x + lx * cs - ly * sn, ty = y + lx * sn + ly * cs;
        const fl = 0.75 + 0.25 * Math.sin(view.rt * 31 + e.seed * 20);
        glow(ctx, G.gold, tx, ty, (0.35 + 0.55 * fu) * fl, 1);
        glow(ctx, G.glint, tx, ty, (0.22 + 0.3 * fu) * fl, 1);
      },

      charger(ctx, e, view) {
        const S = get('charger');
        const m = e.spawnT < 1 || e.dying ? 'chase' : e.mode;
        const fx = (m === 'tele' || m === 'dash') && e.dashX ? (e.dashX < 0 ? -1 : 1) : e.facing < 0 ? -1 : 1;
        const scl = 0.95 + e.seed * 0.1;
        let set, mode = 0, x = e.x, y = e.y, rot = 0;
        const sx = scl * 0.92 * fx, sy = scl * 0.92;
        if (m === 'tele') { mode = Math.floor(view.rt * 9) % 2 ? 2 : 1; set = S.tele[mode - 1]; }
        else if (m === 'dash') { mode = 3; set = S.dash; }
        else if (m === 'rest') { mode = 4; set = S.rest; rot = Math.sin(view.rt * 9 + e.seed * 5) * 0.08; }
        else { const w = walkPh(e, 0.9); set = S.walk[w.f]; y -= Math.abs(w.sn) * 0.8; rot = w.sn * 0.03; }
        if (lifecycle(ctx, e, set, 'charger', y, sx, sy, rot)) return;
        const rt = view.rt;
        if (mode === 1 || mode === 2) x += Math.sin(rt * 80 + e.seed * 9) * (0.3 + 0.6 * Math.min(1, (e.modeT || 0) / 0.72));
        if (mode === 3) {
          const dx = e.dashX || fx, dy = e.dashY || 0;
          for (let i = 1; i <= 3; i++) { ctx.globalAlpha = 0.32 / i; blit(ctx, set.f, x - dx * i * 5, y - dy * i * 5, sx, sy, 0); }
          ctx.globalAlpha = 1;
          ctx.strokeStyle = 'rgba(255,248,225,0.8)'; ctx.lineWidth = 0.9;
          ctx.beginPath();
          for (let i = 0; i < 3; i++) {
            const o = (rt * 3 + i * 0.33 + e.seed) % 1, py = y - 7 - i * 4.5;
            ctx.moveTo(x - dx * (14 + o * 8), py - dy * 8); ctx.lineTo(x - dx * (24 + o * 12), py - dy * 14);
          }
          ctx.stroke();
        }
        body(ctx, e, set, x, y, sx, sy, rot);
        if (mode === 1 || mode === 2) {
          const k = Math.min(1, (e.modeT || 0) / 0.72);
          const ep = CH_EYE(mode);
          const ex = x + ep[0] * sx, ey = y + ep[1] * sy;
          ctx.globalAlpha = 0.15 + 0.25 * k * (0.6 + 0.4 * Math.sin(rt * 30)); blit(ctx, set.f, x, y, sx, sy, rot); ctx.globalAlpha = 1;
          glow(ctx, G.ruby, ex, ey, 0.4 + 0.4 * k, 0.8);
          glow(ctx, G.ruby, x, y - 12, 1.5, 0.35 + 0.45 * k);
        } else if (mode === 4) {
          const hx = x + fx * 4, hy = y - 25;
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 3; i++) {
            const a = rt * 5 + (i / 3) * TAU;
            ctx.globalAlpha = 0.6 + 0.4 * Math.sin(a);
            blit(ctx, G.glint, hx + Math.cos(a) * 7, hy + Math.sin(a) * 2.4, 0.4 + 0.12 * Math.sin(a), 0.4 + 0.12 * Math.sin(a), a);
          }
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
      },

      mother(ctx, e, view) {
        const S = get('mother'), fx = e.facing < 0 ? -1 : 1, scl = 0.95 + e.seed * 0.1;
        const ph = e.anim * 0.42 + e.seed, f = Math.floor(ph * 4) & 3, sn = Math.sin(ph * TAU);
        const set = S.walk[f];
        let y = e.y - Math.abs(sn) * 1.2, sx = scl * 0.92 * fx, sy = scl * 0.92;
        const rot = sn * 0.035;
        const contact = Math.pow(1 - Math.abs(sn), 4);
        sx *= 1 + contact * 0.04; sy *= 1 - contact * 0.04;
        if (lifecycle(ctx, e, set, 'mother', y, sx, sy, rot)) return;
        const b = e.birth || 0;
        if (b > 0) {
          const q = Math.sin((1 - b) * PI * 3) * b * 0.13;
          sx *= 1 + q; sy *= 1 - q;
          glow(ctx, G.rose, e.x, e.y - 4, 1.3 + 0.6 * (1 - b), b * 0.7);
        }
        body(ctx, e, set, e.x, y, sx, sy, rot);
        if (b > 0) {
          ctx.globalAlpha = b * 0.45; blit(ctx, set.f, e.x, y, sx, sy, rot); ctx.globalAlpha = 1;
          glow(ctx, G.gold, e.x, y - 34 * sy, 0.9 + 0.5 * b, b);
        }
        if (((view.rt * 0.6 + e.seed * 7) % 4) < 0.12) glow(ctx, G.glint, e.x - 6 * fx, y - 26, 0.35, 0.8);
      },

      sprout(ctx, e, view) {
        const S = get('sprout'), fx = e.facing < 0 ? -1 : 1, scl = 0.95 + e.seed * 0.1;
        const w = walkPh(e, 1.4);
        const set = S.walk[w.f];
        const y = e.y - Math.abs(w.sn) * 1.0, rot = w.sn * 0.12, sx = scl * 0.92 * fx, sy = scl * 0.92;
        if (lifecycle(ctx, e, set, 'sprout', y, sx, sy, rot)) return;
        body(ctx, e, set, e.x, y, sx, sy, rot);
      },
    },

    shadow(ctx, o) {
      let k = 1;
      if (o.dying) { if (o.deathT > 0.3) return true; k = 1 - o.deathT / 0.3; }
      if (o.spawnT < 1) k *= U.clamp((o.spawnT - 0.5) * 2, 0, 1);
      if (k <= 0.02) return true;
      const D = { spitter: [8.4, 2.7], bomber: [7, 2.4], charger: [14, 3], mother: [13, 4], sprout: [5, 1.8] }[o.type] || [8, 2.6];
      if (o.type === 'bomber' && o.armed) {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4 * k;
        blit(ctx, G.ruby, o.x, o.y + 1, 1.0, 0.4, 0);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      ctx.fillStyle = 'rgba(14,10,22,0.42)';
      ctx.beginPath(); ctx.ellipse(o.x, o.y + 0.4, D[0] * k, D[1] * k, 0, 0, TAU); ctx.fill();
      return true;
    },

    onKill(game, e) {
      const cols = SH[e.type];
      if (!cols) return false;
      const big = e.type === 'mother', small = e.type === 'sprout';
      const h = HGT[e.type], n = big ? 14 : small ? 5 : 8;
      for (let i = 0; i < n; i++) shard(game, e.x + (Math.random() - 0.5) * (big ? 16 : 8), e.y + 0.5, h + (Math.random() - 0.5) * (big ? 18 : 10), cols[i % cols.length], big ? 70 : 55, 70, big ? 1.3 : small ? 0.7 : 1);
      for (let i = 0; i < (big ? 4 : 2); i++) game.addParticle({ kind: 'glint', tint: e.type === 'spitter' ? 3 : 0, x: e.x + (Math.random() - 0.5) * 14, y: e.y, z: h + (Math.random() - 0.5) * 12, vx: 0, vy: 0, drag: 3, life: 0.4 + Math.random() * 0.2, size: big ? 1 : 0.75, rot: Math.random() * 0.6, vr: 0 });
      if (big) game.addParticle({ kind: 'ring', x: e.x, y: e.y, life: 0.5, size: 1.3, drag: 0, color: '#ff8ab0' });
      return true;
    },

    shot(ctx, s, view) {
      const y = s.y - s.z, a = s.angle, ca = Math.cos(a), sa = Math.sin(a);
      const pulse = 1 + 0.1 * Math.sin(view.rt * 18 + s.seed * 10);
      glow(ctx, G.tox, s.x, y, 0.85 * pulse, 0.75);
      // trailing drops: small leaded beads
      for (let i = 1; i <= 2; i++) {
        const d = 4.2 * i + 1, r = 1.5 - i * 0.35;
        const px = s.x - ca * d, py = y - sa * d + Math.sin(view.rt * 14 + i * 2 + s.seed * 6) * 0.5;
        ctx.globalAlpha = 1 - i * 0.3;
        ctx.fillStyle = LEAD; ctx.beginPath(); ctx.arc(px, py, r + 0.6, 0, TAU); ctx.fill();
        ctx.fillStyle = '#9cf04a'; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const w = 1 + 0.12 * Math.sin(view.rt * 16 + s.seed * 6);
      blit(ctx, G.shot, s.x, y, 1.2 * pulse * w, 1.2 * pulse / w, a);
      glow(ctx, G.glintG, s.x + 0.6 * ca - 0.8, y + 0.6 * sa - 1, 0.18, 0.7 + 0.3 * Math.sin(view.rt * 9 + s.seed * 5));
    },

    icons: (() => {
      function paint(ctx, size, fn) {
        const k0 = K;
        ctx.save();
        ctx.scale(size / 48, size / 48);
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        fn(new Painter(ctx, 'outline', 2.0, 1.15, 5));
        fn(new Painter(ctx, 'fill', 2.0, 1.15, 5));
        ctx.restore();
        K = k0;
      }
      const iconSeed = (P, x, y, a, s) => {
        const sh = (c) => { c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s); c.moveTo(4.6, 0); c.bezierCurveTo(2.5, -3.1, -3.2, -3, -3.6, 0); c.bezierCurveTo(-3.2, 3, 2.5, 3.1, 4.6, 0); c.closePath(); c.restore(); };
        P.part(sh, [{ path: sh, col: '#f8e8bc', cx: x, cy: y, r: 3.4 * s }], { noGlint: true });
      };
      const pumpkinIcon = (P, cx, cy, rx, ry) => {
        P.piece((c) => { c.moveTo(cx - 1.6, cy - ry + 1); c.quadraticCurveTo(cx - 1, cy - ry - 4, cx + 2, cy - ry - 5); c.lineTo(cx + 3.6, cy - ry - 3.4); c.quadraticCurveTo(cx + 1.6, cy - ry - 1.6, cx + 1.8, cy - ry + 1); c.closePath(); }, PAL.stem, cx, cy - ry - 2, 3);
        P.part(ELL(cx, cy, rx, ry), ribCells(cx, cy, rx, ry, [-1.05, -0.6, -0.2, 0.2, 0.6, 1.05], ['#c85a14', '#e47820', '#f39232', '#e47820', '#c85a14']));
      };
      return {
        leech(ctx, size) {
          paint(ctx, size, (P) => {
            P.detail((c) => { c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2; for (const x of [12, 19]) { c.beginPath(); c.moveTo(x, 17); c.bezierCurveTo(x - 3, 13, x + 3, 10, x, 5); c.stroke(); } });
            const heart = (c) => { c.moveTo(34, 21); c.bezierCurveTo(26, 15, 25, 9, 28, 6.5); c.bezierCurveTo(30.5, 4.5, 33, 5.5, 34, 8); c.bezierCurveTo(35, 5.5, 37.5, 4.5, 40, 6.5); c.bezierCurveTo(43, 9, 42, 15, 34, 21); c.closePath(); };
            P.part(heart, [{ poly: [[24, 0], [34, 0], [34, 22], [24, 22]], col: '#ff4a5a', cx: 31, cy: 10, r: 5, glow: true }, { poly: [[34, 0], [46, 0], [46, 22], [34, 22]], col: '#e3203c', cx: 37, cy: 10, r: 5, glow: true }]);
            P.part(ELL(24, 25, 18, 5), [
              { poly: rectPoly(4, 19, 18, 31), col: '#f39232', cx: 13, cy: 25, r: 7, glow: true },
              { poly: rectPoly(18, 19, 30, 31), col: '#ffa63c', cx: 24, cy: 24, r: 7, glow: true },
              { poly: rectPoly(30, 19, 44, 31), col: '#e2681a', cx: 35, cy: 25, r: 7, glow: true },
            ]);
            const bowl = (c) => { c.moveTo(5, 26); c.lineTo(43, 26); c.quadraticCurveTo(42, 44, 24, 45); c.quadraticCurveTo(6, 44, 5, 26); c.closePath(); };
            P.part(bowl, mosaic('iSoup', rectPoly(3, 25, 45, 47), 70, 15, (x, y, i) => ['#2f8a4f', '#3fa05e', '#267a44'][i % 3]));
          });
        },
        thorns(ctx, size) {
          paint(ctx, size, (P) => {
            const ring = starPts(12, 22, 14, 24, 25, 0);
            P.part(PP(ring), mosaic('iThorn', ring, 40, 21, (x, y, i) => ['#4f7c2c', '#5fa83c', '#3f6a24'][i % 3]));
            P.part((c) => turnipPath(c, 24, 12, 35, 10), [
              { poly: [[0, 0], [48, 0], [48, 24], [0, 24]], col: '#8a4ac0', cx: 21, cy: 18, r: 9 },
              { poly: [[0, 24], [48, 24], [48, 48], [0, 48]], col: '#f2deb0', cx: 24, cy: 29, r: 7 },
            ]);
            for (const e of [[[16, 22], [22, 24], [21, 27], [17, 26]], [[26, 24], [32, 22], [31, 26], [27, 27]]]) { const inf = polyInfo(e); P.piece(PP(e), '#ff5a26', inf.cx, inf.cy, inf.r * 1.3, { glow: true, ol: 1.2 }); }
          });
        },
        dashup(ctx, size) {
          paint(ctx, size, (P) => {
            [[4, 17, 11], [2, 25, 9], [5, 33, 10]].forEach(([x, y, l], i) => P.piece(RR(x, y - 2, l, 4, 2), ['#7ab8f0', '#9fd0ff', '#c4e4ff'][i], x + l / 2, y, 4));
            P.detail((c) => { c.strokeStyle = 'rgba(255,240,200,0.8)'; c.lineWidth = 1.8; c.setLineDash([3, 3]); c.beginPath(); c.arc(28, 26, 19, -1.0, 1.0); c.stroke(); c.setLineDash([]); });
            const c = P.ctx;
            c.save(); c.translate(28, 26); c.rotate(0.55);
            pumpkinIcon(P, 0, 0, 14, 13);
            c.restore();
          });
        },
        range(ctx, size) {
          paint(ctx, size, (P) => {
            P.detail((c) => { c.strokeStyle = '#fff4d0'; c.lineWidth = 2.4; c.setLineDash([0.1, 4.6]); c.beginPath(); c.moveTo(13, 30); c.quadraticCurveTo(18, 7, 34, 13); c.stroke(); c.setLineDash([]); });
            P.piece(ELL(37, 15, 8, 8), '#e3203c', 37, 15, 7);
            P.piece(ELL(37, 15, 5, 5), '#f8ecc8', 37, 15, 4.5, { noGlint: true });
            P.piece(ELL(37, 15, 2.3, 2.3), '#ffd23a', 37, 15, 2.3, { glow: true, ol: 1.0 });
            iconSeed(P, 10, 38, -1.2, 2.6);
          });
        },
      };
    })(),
  });
})();
