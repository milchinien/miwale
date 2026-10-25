/* Starry Night (Van Gogh) — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Everything is built from one primitive: the impasto brush stroke (stroke()). Sprites and the ground are
   painted stroke by stroke ONCE into offscreen canvases; per frame only drawImage + additive halos run. */
(function (root) {
  'use strict';
  const PALETTE = {
    underpaint: '#141c30', prussian: '#111733', ultramarine: '#26409a', cobalt: '#4a76cc',
    meadow: '#2e5944', meadowLight: '#70944e', forest: '#142a20', wheat: '#866c2a', wheatLight: '#bc9a3e',
    path: '#3d4180', pond: '#26579c', cadmium: '#ffd040', chrome: '#ffe070', starWhite: '#fff6c8',
    orange: '#d86c1e', scarlet: '#c8341e', violet: '#763896', cream: '#e2d09a', ghost: '#a2d0d2', gold: '#d8aa48',
  };
  const TAU = Math.PI * 2, K = 3; // K = sprite px per world unit
  /* ---------- tiny helpers (hash, seeded rng, noise, colour) ---------- */
  const hashInt = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; };
  function rng(seed) { let a = seed >>> 0; return { next() { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }; }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  function perlin(x, y, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const g = (ix, iy, dx, dy) => { const a = ((hashInt(ix, iy, s) & 15) / 16) * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
    const u = fade(fx), v = fade(fy);
    const a = g(x0, y0, fx, fy) + u * (g(x0 + 1, y0, fx - 1, fy) - g(x0, y0, fx, fy));
    const b = g(x0, y0 + 1, fx, fy - 1) + u * (g(x0 + 1, y0 + 1, fx - 1, fy - 1) - g(x0, y0 + 1, fx, fy - 1));
    return (a + v * (b - a)) * 1.414;
  }
  function fbm(x, y, s, oct) { let a = 1, f = 1, t = 0, n = 0; for (let i = 0; i < oct; i++) { t += a * perlin(x * f, y * f, s + i * 101); n += a; a *= 0.5; f *= 2; } return Math.min(1, Math.max(0, (t / n) * 0.5 + 0.5)); }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const H = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const hexes = (a) => a.map(H);
  const rgb = (c, a) => (a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mul = (c, f) => [Math.min(255, c[0] * f), Math.min(255, c[1] * f), Math.min(255, c[2] * f)];
  const LIGHT = [255, 246, 220], hyp = Math.hypot;
  const rampPick = (pal, v) => pal[clamp(Math.round(v), 0, pal.length - 1)];
  function cv(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return { c, ctx: c.getContext('2d') }; }

  /** THE primitive: one impasto dab — blunt start, tapered tip, light ridge, shadowed edge, bristle groove. */
  function stroke(ctx, x, y, ang, len, wid, col, r, o) {
    o = o || {};
    const hl = len * 0.5, hw = wid * 0.5, b = (o.bend !== undefined ? o.bend : (r.next() - 0.5) * 0.36) * len;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    if (o.a !== undefined) ctx.globalAlpha = o.a;
    ctx.beginPath();
    ctx.moveTo(-hl, -hw * 0.85);
    ctx.quadraticCurveTo(0, -hw * 1.25 + b, hl, b * 0.12 - hw * 0.14);
    ctx.lineTo(hl + hw * 0.35, b * 0.12); ctx.lineTo(hl, b * 0.12 + hw * 0.14);
    ctx.quadraticCurveTo(0, hw * 1.25 + b, -hl, hw * 0.85);
    ctx.quadraticCurveTo(-hl - hw * 1.15, 0, -hl, -hw * 0.85);
    ctx.fillStyle = rgb(col); ctx.fill();
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-hl * 0.88, -hw * 0.32); ctx.quadraticCurveTo(0, -hw * 0.5 + b, hl * 0.72, b * 0.12 - hw * 0.08);
    ctx.lineWidth = hw * 0.48; ctx.strokeStyle = rgb(mix(col, LIGHT, o.hi !== undefined ? o.hi : 0.3), 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-hl * 0.95, hw * 0.6); ctx.quadraticCurveTo(0, hw * 0.86 + b, hl * 0.85, b * 0.12 + hw * 0.1);
    ctx.lineWidth = hw * 0.32; ctx.strokeStyle = rgb(mul(col, 0.58), 0.75); ctx.stroke();
    const v1 = (r.next() - 0.5) * hw * 0.9;
    ctx.beginPath(); ctx.moveTo(-hl * 0.55, v1); ctx.quadraticCurveTo(hl * 0.2, v1 * 0.8 + b * 0.9, hl * 0.95, b * 0.12 + v1 * 0.3);
    ctx.lineWidth = Math.max(0.05, wid * 0.08); ctx.lineCap = 'butt'; ctx.strokeStyle = rgb(mul(col, 0.7), 0.55); ctx.stroke();
    ctx.restore();
  }
  /* ---------- painted regions ---------- */
  function blob(cx, cy, rx, ry, n, rough, r) { const P = [], p1 = r.next() * TAU, p2 = r.next() * TAU; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, k = 1 + rough * (0.6 * Math.sin(a * 3 + p1) + 0.4 * Math.sin(a * 5 + p2)); P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return P; }
  function spline(P, steps) {
    const out = [], n = P.length, f = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    for (let i = 0; i < n; i++) { const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n]; for (let s = 0; s < steps; s++) out.push([f(p0[0], p1[0], p2[0], p3[0], s / steps), f(p0[1], p1[1], p2[1], p3[1], s / steps)]); }
    return out;
  }
  function pathOf(P) { const p = new Path2D(); p.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) p.lineTo(P[i][0], P[i][1]); p.closePath(); return p; }
  function inPoly(P, x, y) { let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; }
  /** Fill a polygon with a jittered grid of strokes: o = { base, sp, len, wid, jit, col(x,y,r), ang(x,y,r), edge }. */
  function paint(ctx, P, r, o) {
    const path = pathOf(P); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    if (o.base) { ctx.fillStyle = rgb(o.base); ctx.fill(path); }
    ctx.save(); ctx.clip(path);
    const sp = o.sp, sy = sp * 0.75, jit = o.jit === undefined ? 0.25 : o.jit;
    for (let y = y0; y <= y1 + sy * 0.5; y += sy) for (let x = x0; x <= x1 + sp * 0.5; x += sp) {
      const px = x + (r.next() - 0.5) * sp, py = y + (r.next() - 0.5) * sy;
      if (!inPoly(P, px, py)) continue;
      stroke(ctx, px, py, o.ang(px, py, r) + (r.next() - 0.5) * jit * 2, o.len * (0.75 + r.next() * 0.5), o.wid * (0.8 + r.next() * 0.4), o.col(px, py, r), r);
    }
    ctx.restore();
    if (o.edge) contour(ctx, P, r, o.edge);
  }
  /** Dark painted contour: strokes laid along the edge, thicker on the shadow side (down-right). */
  function contour(ctx, P, r, e) {
    let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= P.length; cy /= P.length;
    const step = e.l * 0.6; let carry = r.next() * step;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L = hyp(dx, dy);
      if (L < 1e-6) continue;
      let d = carry;
      for (; d < L; d += step) {
        const x = a[0] + dx * d / L, y = a[1] + dy * d / L, ol = hyp(x - cx, y - cy) || 1;
        const sh = ((x - cx) / ol) * 0.55 + ((y - cy) / ol) * 0.83;
        if (e.skip && e.skip(sh)) continue;
        stroke(ctx, x, y, Math.atan2(dy, dx) + (r.next() - 0.5) * 0.2, e.l * (0.8 + r.next() * 0.4), e.w * (0.7 + 0.55 * clamp(sh * 0.5 + 0.5, 0, 1)), e.col, r, { hi: 0.16 });
      }
      carry = d - L;
    }
  }
  const seg = (ctx, x0, y0, x1, y1, wid, col, r, o) => stroke(ctx, (x0 + x1) / 2, (y0 + y1) / 2, Math.atan2(y1 - y0, x1 - x0), hyp(x1 - x0, y1 - y0) + wid * 0.4, wid, col, r, o);
  function polyStroke(ctx, pts, wid, l, col, r, o) { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.round(hyp(b[0] - a[0], b[1] - a[1]) / l)); for (let k = 0; k < n; k++) seg(ctx, a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, a[0] + (b[0] - a[0]) * (k + 1) / n, a[1] + (b[1] - a[1]) * (k + 1) / n, wid, Array.isArray(col[0]) ? col[(r.next() * col.length) | 0] : col, r, o); } }
  /** Carved glowing hole: dark rim offset, orange, yellow core, white-hot centre. */
  const GLOWC = hexes(['#4a1206', '#ffb52e', '#ffe070', '#fff6c8']);
  function carved(ctx, P) {
    let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= P.length; cy /= P.length;
    const sc = (k, oy) => pathOf(P.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k + oy]));
    ctx.fillStyle = rgb(GLOWC[0]); ctx.fill(pathOf(P.map((p) => [p[0] + 0.35, p[1] + 0.4])));
    ctx.fillStyle = rgb(GLOWC[1]); ctx.fill(pathOf(P));
    ctx.fillStyle = rgb(GLOWC[2]); ctx.fill(sc(0.62, 0.15));
    ctx.fillStyle = rgb(GLOWC[3]); ctx.fill(sc(0.3, 0.2));
  }
  const tri = (cx, cy, s, tall) => [[cx - s, cy + s * 0.6 * tall], [cx + s, cy + s * 0.6 * tall], [cx + s * 0.15, cy - s * tall]];

  /* ---------- characters (painted once per animation frame) ---------- */
  const PRUSSIAN = H('#111733');
  const ORANGE = hexes(['#8e3a12', '#b8521a', '#d86c1e', '#ec8a28', '#f6aa3c', '#fcd06a']);
  const COAT = hexes(['#141d52', '#1d2c78', '#26409a', '#3157b4', '#4a76cc', '#7aa0e0']);
  const LEAF = hexes(['#163a2a', '#1f5a3a', '#2f7a4a', '#4a9a52', '#80bc5c']);
  const VIO = hexes(['#34124c', '#55206f', '#763896', '#985ab6', '#c28cd8']), CREAM = hexes(['#9c8656', '#c4ad78', '#e2d09a', '#f4e9c2', '#fffbe8']);
  const GHO = hexes(['#3d64a6', '#6e9ec8', '#a2d0d2', '#cbece4', '#f2fbf4']);
  const COLV = hexes(['#1c1220', '#2e1c30', '#46284a', '#603a62', '#7e5480', '#a27aa4']), COLU = hexes(['#22160e', '#35231a', '#4c3322', '#664630', '#82603e', '#a07c52']);
  const DARKC = H('#0c0812');
  function paintHero(ctx, r, pose) {
    ctx.translate(0, pose.bob);
    for (const s of [-1, 1]) { const fx = s * 2.3 + s * pose.leg * 1.9, fy = -0.6 - Math.max(0, s * pose.leg) * 1.3; seg(ctx, s * 2.2, -5.5, fx, fy - 1, 2.5, H('#2b2238'), r); stroke(ctx, fx + 0.9, fy - 0.2, 0.05, 3.6, 2.0, H('#1e130e'), r, { hi: 0.25 }); }
    seg(ctx, -4.2, -14, -6.2 - pose.arm * 1.5, -8.8, 2.4, COAT[1], r);
    seg(ctx, -3.5, -15.2, -8.4, -12.6 + pose.flut, 2.0, H('#c8341e'), r); seg(ctx, -7.6, -13, -10.4, -11.4 + pose.flut * 1.4, 1.7, H('#e8502a'), r);
    const coat = spline([[-4.4, -15.6], [0, -16], [4.4, -15.6], [5.6, -10.5], [6.9, -4.6], [3.2, -3.5], [0, -4.0], [-3.2, -3.5], [-6.9, -4.6], [-5.6, -10.5]], 3);
    paint(ctx, coat, r, { base: COAT[1], sp: 1.55, len: 4.2, wid: 1.5, jit: 0.15, col: (x, y, q) => rampPick(COAT, 2.2 - x * 0.28 + (q.next() - 0.5) * 1.6), ang: (x) => -Math.PI / 2 + x * 0.07, edge: { col: PRUSSIAN, w: 1.0, l: 3 } });
    stroke(ctx, 1.1, -11.2, 0.3, 1.3, 1.1, H('#f0c040'), r, { hi: 0.5 }); stroke(ctx, 1.3, -7.8, 0.3, 1.3, 1.1, H('#f0c040'), r, { hi: 0.5 });
    for (let i = 0; i < 4; i++) stroke(ctx, -3.8 + i * 2.5, -15.4, (r.next() - 0.5) * 0.4, 3.4, 2.1, i & 1 ? H('#e8502a') : H('#c8341e'), r);
    const hx = 6.6 + pose.arm * 1.6, hy = -8.6;
    seg(ctx, 4.2, -14.2, hx, hy, 2.6, COAT[3], r); stroke(ctx, hx + 0.3, hy + 0.6, 0.6, 1.8, 1.7, H('#e8cf9c'), r);
    const cx = 0.6, cy = -22.6, rx = 8.8, ry = 7.4, head = [];
    for (let i = 0; i < 44; i++) { const a = (i / 44) * TAU, k = 1 + 0.035 * Math.abs(Math.sin(a * 3.5)); head.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    const merid = (x, y) => { const dy = y - cy, q = Math.sqrt(Math.max(0.06, 1 - (dy / ry) ** 2)), kk = (x - cx) / (rx * q); return Math.atan2(1, (-kk * rx * dy) / (ry * ry * q)); };
    paint(ctx, head, r, { base: ORANGE[2], sp: 1.3, len: 3.6, wid: 1.45, jit: 0.12, col: (x, y, q) => rampPick(ORANGE, 2.6 - (x - cx) / rx * 1.5 - (y - cy) / ry * 1.3 + (q.next() - 0.5) * 1.3), ang: merid });
    for (const kx of [-0.66, -0.24, 0.24, 0.66]) { const pts = []; for (let t = -0.82; t <= 0.83; t += 0.33) pts.push([cx + kx * rx * Math.sqrt(1 - t * t), cy + t * ry]); polyStroke(ctx, pts, 0.75, 2.4, mul(ORANGE[1], 0.85), r, { a: 0.85 }); }
    contour(ctx, head, r, { col: PRUSSIAN, w: 1.1, l: 3.2 });
    seg(ctx, cx + 0.3, cy - ry + 0.8, cx + 1.6, cy - ry - 2.8, 1.9, H('#4f6a26'), r); stroke(ctx, cx - 1.6, cy - ry - 0.4, -0.5, 3.2, 1.4, H('#3f7a3a'), r);
    const fx = cx + 1.9;
    carved(ctx, tri(fx - 2.9, cy - 1.6, 1.7, 1.25)); carved(ctx, tri(fx + 2.9, cy - 1.6, 1.7, 1.25)); carved(ctx, tri(fx, cy + 0.4, 0.65, 1));
    carved(ctx, [[-4.7, -0.2], [-3.4, 0.6], [-2.4, -0.2], [-1.2, 0.7], [0, -0.1], [1.2, 0.7], [2.4, -0.2], [3.4, 0.6], [4.7, -0.2], [3.8, 1.9], [1.6, 2.9], [-1.6, 2.9], [-3.8, 1.9]].map((p) => [fx + p[0], cy + 2.4 + p[1]]));
  }
  function paintCreeper(ctx, r, pose) {
    ctx.translate(0, pose.bob);
    for (const s of [-1, 1]) { const fx = s * 3 + s * pose.leg * 1.7, fy = -0.5 - Math.max(0, s * pose.leg) * 1.2; seg(ctx, s * 2.4, -4.6, fx, fy, 1.8, H('#a8865a'), r); stroke(ctx, fx + s * 0.8, fy, s * 0.2, 2.2, 1.2, H('#7a5a38'), r); }
    const cx = 0, cy = -12.6, rx = 8.6, ry = 8.2;
    for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 - 0.75 + i * 0.5 + pose.leaf * (i & 1 ? 1 : -0.6), L = 6.4 - Math.abs(i - 1.5) * 0.6; stroke(ctx, 0.3 + Math.cos(a) * L * 0.55, cy - ry + 1.2 + Math.sin(a) * L * 0.55, a, L, 2.5, LEAF[1 + (i & 1)], r, { hi: 0.22 }); }
    const body = [];
    for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, s = Math.sin(a); body.push([cx + Math.cos(a) * rx * (s > 0 ? 1 - 0.38 * s * s : 1), cy + s * ry * (s > 0 ? 1 + 0.3 * s * s * s : 1)]); }
    paint(ctx, body, r, { base: VIO[1], sp: 1.25, len: 3.4, wid: 1.4, jit: 0.15,
      col: (x, y, q) => { const dx = (x - cx) / rx, dy = (y - cy) / ry, l = -dx * 1.4 - dy * 0.6; return (dy + 1) / 2 + (q.next() - 0.5) * 0.2 < 0.5 + 0.08 * Math.sin(x * 0.9) ? rampPick(VIO, 2.1 + l + (q.next() - 0.5) * 1.2) : rampPick(CREAM, 2.3 + l + (q.next() - 0.5) * 1.2); },
      ang: (x, y) => Math.atan2((x - cx) / (rx * rx), -(y - cy) / (ry * ry)) * 0.7, edge: { col: H('#1d1036'), w: 0.95, l: 2.8 } });
    for (const s of [-1, 1]) { const x = 1.2 + s * 2.6, y = cy - 0.7; stroke(ctx, x, y, s * 0.35, 2.4, 1.6, H('#ffcf40'), r, { hi: 0.55, bend: 0 }); stroke(ctx, x + 0.3, y + 0.15, 0, 0.8, 0.8, H('#3a0a10'), r, { bend: 0 }); stroke(ctx, x - s * 0.1, y - 1.5, s * 0.45, 2.8, 0.9, H('#1d0f2a'), r, { bend: 0, hi: 0.1 }); }
    stroke(ctx, 1.5, cy + 2.8, 0, 3.0, 0.8, H('#2a0c22'), r, { bend: 0.25, hi: 0.1 });
  }
  function paintGhost(ctx, r, ph) {
    const cx = 0, cy = -17.6, tx = -4.5 + Math.sin(ph) * 2.4, ty = -2.4 + Math.cos(ph) * 0.6, reach = Math.sin(ph) * 0.8;
    const body = spline([[-7.2, -17], [-6.4, -21.5], [-3.6, -24.6], [0, -25.4], [3.6, -24.6], [6.4, -21.5], [7.2, -17], [6.6, -12.5], [5.4, -8.6 + Math.sin(ph + 1) * 0.5], [3.4, -6 + Math.sin(ph + 2) * 0.6], [0.6, -4.2], [tx, ty], [tx + 1.6, -6.4], [-3.4, -7.4 + Math.sin(ph) * 0.6], [-5.8, -10.6], [-7, -13.8]], 3);
    seg(ctx, 4.5, -13, 10, -11.5 + reach, 1.6, GHO[2], r, { a: 0.95 });
    paint(ctx, body, r, { base: GHO[2], sp: 1.25, len: 3.8, wid: 1.35, jit: 0.15, col: (x, y, q) => rampPick(GHO, 4.1 - hyp(x - cx, y - cy) / 7.5 * 1.2 - Math.max(0, (y - cy) / 6) + (q.next() - 0.5) * 1.3), ang: (x, y) => Math.atan2(y - cy - 2, x - cx) + Math.PI / 2 + 0.35, edge: { col: H('#1f3a78'), w: 0.8, l: 2.5 } });
    ctx.fillStyle = '#0d1430';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(1.4 + s * 2.4, cy - 0.8, 1.25, 1.75, s * 0.15, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(1.6, cy + 3.6, 1.35, 2.0, 0, 0, TAU); ctx.fill();
  }
  function paintBrute(ctx, r, pose) {
    ctx.translate(0, pose.bob);
    for (const s of [-1, 1]) { const fy = -0.8 - Math.max(0, s * pose.lift) * 2.4; seg(ctx, s * 7, -14, s * 7.5, fy - 1.5, 6.4, COLU[1], r); stroke(ctx, s * 7.5 + 1.2, fy - 0.4, 0.04, 8.4, 3.2, COLU[0], r, { hi: 0.22 }); }
    const arm = (x0, y0, x1, y1, w, pal) => { seg(ctx, x0, y0, (x0 + x1) / 2 + 0.8, (y0 + y1) / 2, w, pal[2], r); seg(ctx, (x0 + x1) / 2 + 0.8, (y0 + y1) / 2, x1, y1, w * 0.85, pal[2], r); for (let i = -1; i <= 1; i++) seg(ctx, x1, y1, x1 + i * 1.8, y1 + 3 - Math.abs(i) * 0.6, 1.2, pal[1], r); };
    arm(-14.5, -32, -18.5 - pose.arm, -15, 4.6, COLU.map((c) => mul(c, 0.8)));
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 - 0.95 + i * 0.47, L = 11 - Math.abs(i - 2) * 1.4; stroke(ctx, 1 + Math.cos(a) * L * 0.5, -42 + Math.sin(a) * L * 0.5, a, L, 3.8, LEAF[i & 1], r, { hi: 0.2 }); }
    const cx = 0, cy = -28.5, rx = 17.5, ry = 16.5;
    paint(ctx, blob(cx, cy, rx, ry, 44, 0.07, r), r, { base: COLV[1], sp: 2.0, len: 5.4, wid: 2.05, jit: 0.25,
      col: (x, y, q) => { const dx = (x - cx) / rx, dy = (y - cy) / ry, l = -dx * 1.5 - dy * 1.2; if (dx * 0.7 + dy * 0.7 < -0.75 && q.next() < 0.55) return H(q.next() < 0.6 ? '#6fa4b0' : '#b4d0c4'); return (dy + 1) / 2 + (q.next() - 0.5) * 0.25 < 0.58 ? rampPick(COLV, 2.4 + l + (q.next() - 0.5) * 1.4) : rampPick(COLU, 2 + l + (q.next() - 0.5) * 1.4); },
      ang: (x, y) => { const tx = -(y - cy) / (ry * ry), ty = (x - cx) / (rx * rx), m = hyp(tx, ty) + 1e-6; return Math.atan2(ty / m * 0.6 + 0.55, tx / m * 0.6 + Math.sin(y * 0.4) * 0.2); },
      edge: { col: DARKC, w: 1.6, l: 4.4 } });
    const cracks = [[[-1, -40], [1.4, -35], [0, -31], [3, -27.5], [1.2, -23], [4, -17.5]], [[0, -31], [-5, -28.5], [-8.5, -24], [-11.5, -22.5]], [[3, -27.5], [8, -29.5], [11.5, -26.5]]];
    for (const c of cracks) polyStroke(ctx, c, 2.0, 3, H('#1a0c08'), r, { hi: 0.05 });
    for (const c of cracks) polyStroke(ctx, c, 1.15, 2.6, [H('#ffb030'), H('#ff9a20'), H('#ffc84a')], r, { hi: 0.45 });
    for (const c of cracks) polyStroke(ctx, c, 0.45, 2.2, H('#fff2b0'), r, { hi: 0.6 });
    for (const s of [-1, 1]) { stroke(ctx, 3 + s * 4.8, -36.4, s * 0.3, 3.4, 1.5, H('#ffd040'), r, { hi: 0.6, bend: 0 }); stroke(ctx, 3 + s * 4.6, -38.3, s * 0.42, 5.2, 1.9, DARKC, r, { bend: 0, hi: 0.1 }); }
    arm(14.5, -31.5, 18.5 + pose.arm, -15.5, 5, COLU);
  }
  function paintCypress(ctx, r, Ht) {
    const ph = r.next() * 6, wAt = (t) => 7.6 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.16 + t * 0.86)), 0.75) * (1 - 0.25 * t) * (1 + 0.12 * Math.sin(t * 17 + ph)), cAt = (t) => 2.4 * Math.sin(t * 4.6 + ph) * t;
    const L = [], R = [];
    for (let i = 0; i <= 30; i++) { const t = i / 30; R.push([cAt(t) + wAt(t), -2 - t * Ht]); L.push([cAt(t) - wAt(t), -2 - t * Ht]); }
    const pal = hexes(['#081210', '#0e2018', '#153222', '#1e442c', '#2c5838', '#3f6e40']);
    seg(ctx, 0, 0, 0.3, -6, 2.6, H('#2a1a14'), r);
    paint(ctx, R.concat([[cAt(1) + 0.6, -Ht - 5]], L.reverse()), r, { base: pal[1], sp: 1.9, len: 7.5, wid: 2.0, jit: 0.2,
      col: (x, y, q) => { const t = (-y - 2) / Ht, l = -(x - cAt(t)) / Math.max(1, wAt(t)), u = q.next(); return u < 0.08 ? H('#22355f') : rampPick(pal, 1.8 + l * 1.9 + (q.next() - 0.5) * 1.6); },
      ang: (x, y) => -Math.PI / 2 + 0.6 * Math.sin(((-y - 2) / Ht) * 11 + x * 0.35 + ph), edge: { col: H('#04080a'), w: 1.3, l: 4.5 } });
  }
  function paintOlive(ctx, r) {
    seg(ctx, 0, 0, -1.5, -10, 3.4, H('#5a4636'), r); seg(ctx, -1.5, -10, 2.5, -19, 2.8, H('#5a4636'), r); seg(ctx, -1.5, -10, -6, -18, 2.2, H('#3a2c2a'), r);
    const pal = hexes(['#1e2e2c', '#2c403a', '#3e5648', '#566c56', '#728668', '#94a482']);
    for (const p of [[0, -27, 17, 10.5], [-8, -23, 9, 6.5], [8, -24, 9, 6.5]]) paint(ctx, blob(p[0], p[1], p[2], p[3], 30, 0.13, r), r, { base: pal[1], sp: 1.9, len: 4.4, wid: 1.9, jit: 0.4,
      col: (x, y, q) => (q.next() < 0.1 ? H('#4a6a8c') : rampPick(pal, 2.4 - (x - p[0]) / p[2] * 1.6 - (y - p[1]) / p[3] * 1.4 + (q.next() - 0.5) * 1.6)),
      ang: (x, y) => Math.atan2(y - p[1], x - p[0]) + Math.PI / 2 + Math.sin(x * 0.5) * 0.4, edge: { col: H('#142028'), w: 1.1, l: 3.6, skip: (sh) => sh < -0.2 } });
  }
  function paintLantern(ctx, r) {
    const P = []; for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU, s = Math.sin(a); P.push([Math.cos(a) * 4.6 * (s > 0 ? 1 - 0.3 * s * s : 1), -6.4 + s * 4.6 * (s > 0 ? 1 + 0.25 * s * s * s : 1)]); }
    paint(ctx, P, r, { base: VIO[2], sp: 1.0, len: 2.4, wid: 1.0, col: (x, y, q) => rampPick(y + (q.next() - 0.5) * 1.5 < -7 ? VIO : CREAM, 2.5 - x * 0.3 + (q.next() - 0.5)), ang: (x, y) => Math.atan2(x / 21, -(y + 6.4) / 21) * 0.7, edge: { col: H('#1d1036'), w: 0.65, l: 1.8 } });
    for (let i = 0; i < 3; i++) stroke(ctx, (i - 1) * 1.3, -12, -Math.PI / 2 + (i - 1) * 0.5, 2.6, 0.9, LEAF[2 + (i & 1)], r);
    carved(ctx, tri(-1.4, -7.2, 0.9, 1)); carved(ctx, tri(1.4, -7.2, 0.9, 1)); carved(ctx, [[-2.2, -4.9], [-1.1, -4.4], [0, -4.9], [1.1, -4.4], [2.2, -4.9], [1.2, -3.4], [-1.2, -3.4]]);
  }
  /* ---------- baked sprites + FX ---------- */
  function mk(wu, hu, ax, ay, fn, k) { k = k || K; const { c, ctx } = cv(wu * k, hu * k); ctx.scale(k, k); ctx.translate(ax, ay); fn(ctx); return { c, w: wu, h: hu, ax, ay }; }
  /** Halo = soft radial core + concentric rings of tangential strokes (rotated slowly at runtime, additive). */
  function haloSprite(px, cols, rings) {
    const { c, ctx } = cv(px, px), R = px / 2, r = rng(px * 7 + cols.length), g = ctx.createRadialGradient(R, R, 0, R, R, R * 0.5);
    g.addColorStop(0, rgb(H(cols[0]), 0.55)); g.addColorStop(0.5, rgb(H(cols[1]), 0.18)); g.addColorStop(1, rgb(H(cols[1]), 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, px, px);
    rings.forEach((rg, i) => { const rr = rg[0] * R, n = Math.max(6, Math.round((TAU * rr) / (rg[2] * R * 0.85))), off = r.next() * TAU; for (let k = 0; k < n; k++) { const a = off + (k / n) * TAU + (r.next() - 0.5) * 0.12; stroke(ctx, R + Math.cos(a) * rr, R + Math.sin(a) * rr, a + Math.PI / 2 + 0.12, rg[2] * R * (0.8 + r.next() * 0.4), rg[3] * R, H(cols[Math.min(cols.length - 1, i + (r.next() < 0.3 ? 1 : 0))]), r, { a: rg[1] * (0.7 + r.next() * 0.3), bend: 0.12 }); } });
    return c;
  }
  function radial(px, stops) { const { c, ctx } = cv(px, px), g = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2); for (const s of stops) g.addColorStop(s[0], s[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, px, px); return c; }
  let S = null;
  function build() {
    let sd = 1000; const R = () => rng(sd++);
    S = { hero: [], creeper: [], ghost: [], brute: [] };
    for (let p = 0; p < 4; p++) { const ph = (p / 4) * TAU; S.hero.push(mk(34, 42, 17, 37, (c) => paintHero(c, R(), { leg: Math.sin(ph), bob: -Math.abs(Math.cos(ph)) * 0.7, arm: -Math.sin(ph), flut: Math.cos(ph) }))); }
    for (let p = 0; p < 4; p++) { const ph = (p / 4) * TAU; S.creeper.push(mk(30, 34, 15, 29, (c) => paintCreeper(c, R(), { leg: Math.sin(ph), bob: -Math.abs(Math.cos(ph)) * 0.8, leaf: Math.cos(ph) * 0.12 }))); }
    for (let p = 0; p < 3; p++) S.ghost.push(mk(30, 32, 15, 29, (c) => paintGhost(c, R(), (p / 3) * TAU)));
    for (let p = 0; p < 4; p++) { const ph = (p / 4) * TAU; S.brute.push(mk(66, 64, 33, 58, (c) => paintBrute(c, R(), { lift: Math.sin(ph), bob: -Math.abs(Math.cos(ph)), arm: Math.sin(ph) * 1.2 }))); }
    S.cypress = [70, 82].map((h) => mk(30, h + 12, 15, h + 7, (c) => paintCypress(c, R(), h)));
    S.olive = mk(48, 44, 24, 40, (c) => paintOlive(c, R()));
    S.lantern = mk(12, 16, 6, 14.5, (c) => paintLantern(c, R()));
    S.halo = haloSprite(160, ['#fff6c8', '#ffe070', '#ffc83a', '#f0a030', '#d08a26'], [[0.2, 0.9, 0.14, 0.07], [0.34, 0.75, 0.15, 0.065], [0.5, 0.55, 0.15, 0.06], [0.66, 0.38, 0.15, 0.055], [0.84, 0.22, 0.14, 0.05]]);
    S.haloSmall = haloSprite(64, ['#fff6c8', '#ffe070', '#f0a030'], [[0.3, 0.8, 0.22, 0.1], [0.56, 0.5, 0.2, 0.09], [0.82, 0.25, 0.18, 0.08]]);
    S.glow = radial(64, [[0, 'rgba(255,236,150,0.95)'], [0.35, 'rgba(255,190,70,0.45)'], [1, 'rgba(255,150,40,0)']]);
    S.pool = radial(64, [[0, 'rgba(255,200,90,0.5)'], [0.5, 'rgba(240,160,60,0.2)'], [1, 'rgba(240,140,40,0)']]);
    S.shadow = mk(20, 8, 0, 0, (c) => { const r = rng(77); for (let i = 0; i < 16; i++) { const a = r.next() * TAU, d = Math.sqrt(r.next()); stroke(c, 10 + Math.cos(a) * d * 6, 4 + Math.sin(a) * d * 2, (r.next() - 0.5) * 0.3, 7 - d * 3, 2.6 - d, H(i & 1 ? '#0c1030' : '#141a44'), r, { hi: 0.08, a: 0.75 }); } }, 4);
    S.star = mk(10, 10, 5, 5, (c) => { const r = rng(78); for (let i = 0; i < 4; i++) stroke(c, 0, 0, (i * Math.PI) / 4, i & 1 ? 5 : 8.5, i & 1 ? 1 : 1.5, H(i & 1 ? '#ffe070' : '#fff6c8'), r, { bend: 0 }); }, 4);
    S.dabs = ['#ffd040', '#f08a2a', '#8a4aac', '#eadcae', '#3f8a4a'].map((h, i) => mk(7, 3, 3.5, 1.5, (c) => stroke(c, 0, 0, 0, 4.6, 1.9, H(h), rng(300 + i)), 4));
    S.seed = mk(7, 5, 3.5, 2.5, (c) => { const r = rng(5), P = blob(0, 0, 2.3, 1.45, 18, 0.03, r); c.fillStyle = '#f4e6c0'; c.fill(pathOf(P)); stroke(c, -0.3, -0.25, 0, 3, 1.5, H('#fff6dc'), r, { bend: 0 }); contour(c, P, r, { col: H('#3a2410'), w: 0.55, l: 1.4 }); }, 6);
    S.trail = mk(16, 4, 8, 2, (c) => { const r = rng(80); stroke(c, 0, 0, 0, 15, 2.2, H('#f0a030'), r, { bend: 0 }); stroke(c, 1, -0.2, 0, 12, 0.9, H('#ffe070'), r, { bend: 0 }); }, 4);
  }

  /* ---------- ground: flow-field strokes over a dark under-painting (baked once per canvas size) ---------- */
  // materials: 0 wheat, 1 meadow, 2 path, 3 forest, 4 pond — L/W = stroke length/width in world units
  const MATS = [
    { L: 9, W: 2.5, bend: 0.55, pal: ['#3c2e18', '#54421e', '#6c5624', '#866c2a', '#a08232', '#bc9a3e'], acc: ['#2e3e70', '#a65e28', '#4e5a28'], under: [46, 34, 20], pB: 0.75, acP: 0.14 },
    { L: 8, W: 2.7, bend: 0.45, pal: ['#1a3430', '#23463c', '#2e5944', '#3c6a48', '#527e4a', '#70944e'], acc: ['#2e4a86', '#8a8a3a', '#3a6a7a'], under: [17, 32, 28], pB: 0.62, acP: 0.12 },
    { L: 11, W: 2.5, bend: 0.22, pal: ['#1c1e44', '#262a5a', '#31356c', '#3d4180', '#4c4f94', '#6264a8'], acc: ['#6a4f8e', '#2c4f72', '#7a6a5a'], under: [17, 17, 40], pB: 0.55, acP: 0.12 },
    { L: 6.5, W: 2.6, bend: 0.45, pal: ['#08120f', '#0e1d18', '#142a20', '#1b3828', '#24462f', '#305639'], acc: ['#1a2650', '#3a4a24', '#0e2a36'], under: [6, 11, 10], pB: 0.4, acP: 0.14 },
    { L: 10, W: 2.5, bend: 0.62, pal: ['#10244e', '#163268', '#1d4384', '#26579c', '#3270ae', '#4a8fbc'], acc: ['#78c0c0', '#c6d2a0', '#e8c850'], under: [10, 21, 50], pB: 0.72, acP: 0.13 },
  ];
  const pathX = (y) => -95 + y * 0.42 + 26 * Math.sin(y / 70), GS = 5;
  /** weights w[5] + flow vectors v = [curl120 x,y, curl52 x,y, pathTangent x,y, macro] for world (x, y) */
  function fieldAt(x, y, w, v) {
    const curl = (s, sd, o) => { const n = fbm(x * s, y * s, sd, 2), gx = fbm((x + 2) * s, y * s, sd, 2) - n, gy = fbm(x * s, (y + 2) * s, sd, 2) - n, m = hyp(gx, gy) + 1e-9; v[o] = -gy / m; v[o + 1] = gx / m; };
    curl(1 / 120, 51, 0); curl(1 / 52, 52, 2);
    const sl = 0.42 + (26 / 70) * Math.cos(y / 70), d = Math.abs(x - pathX(y)) / Math.sqrt(1 + sl * sl);
    v[4] = sl; v[5] = 1; const tm = hyp(sl, 1); v[4] /= tm; v[5] /= tm; v[6] = fbm(x / 250, y / 250, 61, 2);
    const pond = sstep(46, 34, hyp((x + 255) * 0.8, y + 135) + (fbm(x / 40, y / 40, 9, 2) - 0.5) * 30);
    const forest = sstep(0.6, 0.62, fbm(x / 200 + 4, y / 200, 11, 3) + (y - x - 330) / 700) * (1 - pond);
    const wheat = sstep(0.482, 0.518, fbm(x / 300 - 7.1, y / 300 + 3.9, 31, 3) + (x - y * 1.4 - 140) / 800) * Math.max(0, 1 - forest - pond);
    const path = (1 - sstep(9, 15, d)) * (1 - pond), k = 1 - path;
    w[0] = wheat * k; w[1] = Math.max(0, 1 - forest - pond - wheat) * k; w[2] = path; w[3] = forest * k; w[4] = pond;
  }
  let GROUND = null, ATL = null;
  function strokeSprite(L, W, bend, hex, seed) { const r = rng(seed); return mk(L + W * 2, W * 2.2 + L * bend * 0.5 + 1, (L + W * 2) / 2, (W * 2.2 + L * bend * 0.5 + 1) / 2, (c) => stroke(c, 0, 0, 0, L, W, H(hex), r, { bend: (r.next() - 0.5) * bend })); }
  function bakeGround(w, h) {
    if (!ATL) { let sd = 100; ATL = MATS.map((m) => ({ pal: m.pal.map((c) => [0, 1].map(() => strokeSprite(m.L, m.W, m.bend, c, sd++))), acc: m.acc.map((c) => [0, 1].map(() => strokeSprite(m.L, m.W, m.bend, c, sd++))) }));
      ATL.gold = ['#d08a26', '#eeb63a', '#ffd862', '#fff0a8'].map((c) => strokeSprite(6, 2.2, 0.3, c, sd++)); ATL.flower = ['#f4efd8', '#ffd84a', '#7aa8e8', '#e0582a'].map((c) => strokeSprite(3, 2, 0.5, c, sd++)); }
    const s = h / 360, hw = w / 2 / s, hh = h / 2 / s, M = 12;
    const gx0 = Math.floor((-hw - M) / GS), gy0 = Math.floor((-hh - M) / GS), nx = Math.ceil((2 * hw + 2 * M) / GS) + 2, ny = Math.ceil((2 * hh + 2 * M) / GS) + 2;
    const Wg = new Float32Array(nx * ny * 5), Vg = new Float32Array(nx * ny * 7), wv = new Float32Array(5), vv = new Float32Array(7);
    const under = cv(nx, ny), img = under.ctx.createImageData(nx, ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const o = j * nx + i; fieldAt((gx0 + i) * GS, (gy0 + j) * GS, wv, vv); Wg.set(wv, o * 5); Vg.set(vv, o * 7);
      const m = 0.8 + vv[6] * 0.45; for (let c = 0; c < 3; c++) { let u = 0; for (let k = 0; k < 5; k++) u += MATS[k].under[c] * wv[k]; img.data[o * 4 + c] = u * m; } img.data[o * 4 + 3] = 255;
    }
    under.ctx.putImageData(img, 0, 0);
    const G = cv(w, h), g = G.ctx;
    g.imageSmoothingEnabled = true; g.drawImage(under.c, (gx0 * GS + hw - GS / 2) * s, (gy0 * GS + hh - GS / 2) * s, nx * GS * s, ny * GS * s);
    const sw = new Float32Array(5), sv = new Float32Array(7);
    const sample = (x, y) => { const fx = clamp(x / GS - gx0, 0, nx - 1.001), fy = clamp(y / GS - gy0, 0, ny - 1.001), i = fx | 0, j = fy | 0, tx = fx - i, ty = fy - j, o = j * nx + i;
      const c = [(1 - tx) * (1 - ty), tx * (1 - ty), (1 - tx) * ty, tx * ty], os = [o, o + 1, o + nx, o + nx + 1];
      for (let k = 0; k < 5; k++) sw[k] = c[0] * Wg[os[0] * 5 + k] + c[1] * Wg[os[1] * 5 + k] + c[2] * Wg[os[2] * 5 + k] + c[3] * Wg[os[3] * 5 + k];
      for (let k = 0; k < 7; k++) sv[k] = c[0] * Vg[os[0] * 7 + k] + c[1] * Vg[os[1] * 7 + k] + c[2] * Vg[os[2] * 7 + k] + c[3] * Vg[os[3] * 7 + k]; };
    const put = (spr, x, y, ang, sc) => { const k = (s / K) * sc, c = Math.cos(ang) * k, n = Math.sin(ang) * k; g.setTransform(c, n, -n, c, (x + hw) * s, (y + hh) * s); g.drawImage(spr.c, -spr.c.width / 2, -spr.c.height / 2); };
    const flow = (mat, r) => { const a = [[sv[0] * 0.5, -1 + sv[1] * 0.5], [sv[0], sv[1]], [sv[4] + sv[0] * 0.22, sv[5] + sv[1] * 0.22], [sv[2], sv[3]], [sv[2] * 0.85 + sv[0] * 0.3, sv[3] * 0.85 + sv[1] * 0.3]][mat]; return Math.atan2(a[1], a[0]) + (r.next() - 0.5) * 0.3; };
    const scat = (cell, seed, fn) => { for (let cy = Math.floor((-hh - 9) / cell); cy <= Math.floor((hh + 9) / cell); cy++) for (let cx = Math.floor((-hw - 9) / cell); cx <= Math.floor((hw + 9) / cell); cx++) { const r = rng(hashInt(cx, cy, seed)), x = (cx + r.next()) * cell, y = (cy + r.next()) * cell; sample(x, y); fn(x, y, r); } };
    for (let pass = 0; pass < 2; pass++) scat(pass ? 6.2 : 4.3, 7001 + pass, (x, y, r) => {
      let u = r.next(), mat = 1; for (let k = 0, acc = 0; k < 5; k++) { acc += sw[k]; if (u < acc) { mat = k; break; } }
      const m = MATS[mat], set = ATL[mat], bias = (sv[6] - 0.5) * 3.2;
      if (pass === 1 && r.next() > m.pB) return;
      const spr = pass === 1 && r.next() < m.acP ? set.acc[(r.next() * 3) | 0][(r.next() * 2) | 0] : set.pal[pass ? clamp(2 + Math.floor(r.next() * 3 + bias), 0, 5) : clamp(Math.floor(r.next() * 4 + bias - 0.4), 0, 5)][(r.next() * 2) | 0];
      put(spr, x, y, flow(mat, r), (pass ? 1 : 1.12) * (0.8 + r.next() * 0.4));
    });
    scat(26, 811, (x, y, r) => { if (sw[2] < 0.7 || r.next() > 0.32) return; const a = Math.atan2(sv[5], sv[4]); for (let i = 0; i < 3; i++) put(ATL.gold[i ? (r.next() * 3) | 0 : 2], x - Math.sin(a) * (i * 1.7 - 2.4), y + Math.cos(a) * (i * 1.7 - 2.4), a, 0.55 + r.next() * 0.35); });
    scat(12, 822, (x, y, r) => { if (sw[1] < 0.6 || r.next() > 0.2) return; const f = ATL.flower[r.next() < 0.5 ? 0 : r.next() < 0.6 ? 1 : 2]; for (let i = 0; i < 2; i++) put(f, x + (r.next() - 0.5) * 2, y + (r.next() - 0.5) * 1.6, r.next() * TAU, 0.5 + r.next() * 0.3); });
    scat(9, 833, (x, y, r) => { if (sw[0] < 0.65 || r.next() > 0.14) return; put(ATL.gold[(r.next() * 2) | 0], x, y, -Math.PI / 2 + sv[0] * 0.5, 0.6 + r.next() * 0.4); });
    scat(34, 844, (x, y, r) => { if (sw[0] < 0.6 || r.next() > 0.18) return; put(ATL.flower[3], x, y, r.next() * TAU, 0.6); });
    scat(30, 855, (x, y, r) => { if (sw[4] < 0.85) return; const dir = r.next() < 0.5 ? 1 : -1, ph = r.next() * TAU; // Starry-Night whorl in the water
      for (let i = 0; i < 20; i++) { const t = i / 20, a = ph + dir * t * 2 * TAU, rr = 2 + t * 12; put(t < 0.3 ? ATL.gold[1 + (i % 3)] : ATL[4].acc[i % 2][0], x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.62, Math.atan2(Math.cos(a) * 0.62 * dir, -Math.sin(a) * dir), 0.6); } });
    g.setTransform(1, 0, 0, 1, 0, 0);
    // varnish vignette: dark ultramarine rounded-rect band (alpha t²·0.62) + loose border strokes
    const band = Math.ceil(h * 0.13), rad = h * 0.12, vi = g.createImageData(w, h), D = vi.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (y >= band && y < h - band && x >= band && x < w - band) continue;
      const qx = Math.abs(x - w / 2) - (w / 2 - rad), qy = Math.abs(y - h / 2) - (h / 2 - rad), dd = rad - (hyp(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0)), t = clamp(1 - dd / band, 0, 1), o = (y * w + x) * 4;
      D[o] = 12; D[o + 1] = 10; D[o + 2] = 30; D[o + 3] = t * t * 0.62 * 255; }
    const V = cv(w, h); V.ctx.putImageData(vi, 0, 0);
    const r = rng(99);
    for (let i = 0; i < Math.round((w + h) / (14 * s)) * 2; i++) { const side = i % 4, u = r.next(), dd = Math.pow(r.next(), 1.6) * band * 0.75;
      const x = side < 2 ? u * w : side === 2 ? dd : w - dd, y = side === 0 ? dd : side === 1 ? h - dd : u * h;
      stroke(V.ctx, x, y, (side < 2 ? 0 : Math.PI / 2) + (r.next() - 0.5) * 0.5, 22 * s * (0.7 + r.next() * 0.6), 6 * s, H(['#0a0c24', '#141a44', '#1d2c6a', '#0e1d18'][(r.next() * 4) | 0]), r, { a: 0.5 * (1 - dd / band) }); }
    GROUND = { w, h, c: G.c, vig: V.c, hud: bakeHud(w, h) };
  }
  /** Gilded museum frame: 9 concentric bands of golds/browns (fractions of thickness t). */
  function goldFrame(ctx, x, y, w, h, t) { let ins = 0; for (const [c, f] of [['#2a1c06', 0.08], ['#7a5414', 0.12], ['#d8aa48', 0.14], ['#fbe7a0', 0.06], ['#b8862c', 0.16], ['#6a4610', 0.08], ['#e6c068', 0.14], ['#8a6018', 0.12], ['#3a2808', 0.1]]) { const bw = f * t; ctx.lineWidth = bw; ctx.strokeStyle = c; ctx.strokeRect(x + ins + bw / 2, y + ins + bw / 2, w - 2 * ins - bw, h - 2 * ins - bw); ins += bw; } }
  /** Painted bar: base fill + horizontal strokes picked from a colour ramp. */
  function strokeBar(ctx, x, y, w, h, cols, seed, u) { const r = rng(seed), pal = hexes(cols); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = rgb(pal[1]); ctx.fillRect(x, y, w, h); for (let i = 0; i < (w * h) / (60 * u * u * 0.25); i++) stroke(ctx, x + r.next() * w, y + r.next() * h, (r.next() - 0.5) * 0.25, (8 + r.next() * 7) * u, (2.5 + r.next() * 1.5) * u, pal[(r.next() * pal.length) | 0], r, { bend: 0 }); ctx.restore(); }
  function bakeHud(w, h) {
    const u = h / 540, { c, ctx } = cv(w, h), fr = 6 * u;
    strokeBar(ctx, 12 * u, 8 * u, w - 24 * u, 10 * u, ['#0e1638', '#16224e', '#1d2c6a', '#26408a'], 11, u);
    strokeBar(ctx, 12 * u, 8 * u, (w - 24 * u) * 0.77, 10 * u, ['#c88a1c', '#e8b030', '#f6cc48', '#ffe27a', '#fff0a8'], 12, u);
    goldFrame(ctx, 12 * u - fr, 8 * u - fr, w - 24 * u + 2 * fr, 10 * u + 2 * fr, fr);
    strokeBar(ctx, 44 * u, 32 * u, 140 * u, 12 * u, ['#a8281a', '#d0401e', '#ea6028', '#f6883a', '#ffb060'], 13, u);
    goldFrame(ctx, 44 * u - fr, 32 * u - fr, 140 * u + 2 * fr, 12 * u + 2 * fr, fr);
    const cx = w / 2 - 54 * u; strokeBar(ctx, cx, 26 * u, 108 * u, 46 * u, ['#16224e', '#1d2c6a', '#26408a', '#2f56a8', '#3a6ab8'], 14, u);
    ctx.fillStyle = 'rgba(8,10,30,0.35)'; ctx.fillRect(cx, 26 * u, 108 * u, 46 * u); goldFrame(ctx, cx - fr, 26 * u - fr, 108 * u + 2 * fr, 46 * u + 2 * fr, fr * 1.2);
    return c;
  }
  /* ---------- runtime drawing (world units, feet at x, y) ---------- */
  function blit(ctx, s, x, y, flip, sc) { sc = sc || 1; if (!flip) { ctx.drawImage(s.c, x - s.ax * sc, y - s.ay * sc, s.w * sc, s.h * sc); return; } ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(s.c, -s.ax * sc, -s.ay * sc, s.w * sc, s.h * sc); ctx.restore(); }
  function rot(ctx, img, x, y, ang, w, h, q) { ctx.save(); ctx.translate(x, y); ctx.scale(1, q || 1); ctx.rotate(ang); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore(); }
  function shadow(ctx, x, y, rx, ry, a) { ctx.globalAlpha = a || 0.62; ctx.drawImage(S.shadow.c, x - rx + 0.6, y - ry + 0.4, rx * 2, ry * 2); ctx.globalAlpha = 1; }
  /** Draws the main character with feet at (x, y). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) {
    if (!S) build();
    const flip = facing < 0, hx = x + (flip ? -1.2 : 1.2), hy = y - 22, hp = 0.85 + 0.15 * Math.sin(t * 2.2);
    shadow(ctx, x, y, 8, 2.8);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.3; ctx.drawImage(S.pool, x - 18, y - 7, 36, 14);
    ctx.globalAlpha = 0.6 * hp; rot(ctx, S.halo, hx, hy, t * 0.6, 44, 44);
    ctx.globalAlpha = 0.34 * hp; rot(ctx, S.halo, hx, hy, -t * 0.4 + 1, 72, 72);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    blit(ctx, S.hero[Math.floor(t * 8) & 3], x, y, flip);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.32 + 0.08 * Math.sin(t * 11) + 0.05 * Math.sin(t * 23);
    ctx.drawImage(S.glow, x + (flip ? -2.5 : 2.5) - 8, y - 28, 16, 14);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  /** Draws a typical creature with feet at (x, y). kind = 'creeper' (small root creature) | 'ghost' (fast floating creature) | 'brute' (large creature). */
  function drawEnemy(ctx, x, y, t, kind, facing, seed) {
    if (!S) build();
    kind = kind || 'creeper'; seed = seed || 0;
    const flip = facing < 0, sc = 0.92 + seed * 0.16;
    if (kind === 'ghost') { shadow(ctx, x, y, 5, 1.8, 0.35); ctx.globalAlpha = 0.9; blit(ctx, S.ghost[Math.floor(t * 5 + seed * 7) % 3], x, y - 2 + Math.sin(t * 3 + seed * 9) * 1.2, flip, sc); ctx.globalAlpha = 1; return; }
    const big = kind === 'brute', fr = big ? S.brute[Math.floor(t * 3.4 + seed * 4) & 3] : S.creeper[Math.floor(t * 6 + seed * 4) & 3];
    shadow(ctx, x, y, big ? 18 : 8, big ? 6 : 2.7);
    blit(ctx, fr, x, y, flip, sc);
    if (big) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.28 + 0.12 * Math.sin(t * 4); ctx.drawImage(S.glow, x + (flip ? -2.2 : 2.2) - 12, y - 28 * sc - 12, 24, 24); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  }
  /** Paints a complete preview scene into a w×h canvas at time t (seconds). */
  function draw(ctx, w, h, t) {
    if (!S) build();
    if (!GROUND || GROUND.w !== w || GROUND.h !== h) bakeGround(w, h);
    const s = h / 360, hw = w / 2 / s, hh = h / 2 / s;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(GROUND.c, 0, 0);
    ctx.setTransform(s, 0, 0, s, w / 2, h / 2);
    const px = Math.sin(t * 0.6) * 6, py = 18;
    const list = [
      { y: 130, f: () => { shadow(ctx, -hw + 70, 130, 8, 2.6); blit(ctx, S.cypress[1], -hw + 70, 130); } },
      { y: 60, f: () => { shadow(ctx, hw - 60, 60, 8, 2.6); blit(ctx, S.cypress[0], hw - 60, 60, true); } },
      { y: -70, f: () => { shadow(ctx, -150, -70, 16, 4.5); blit(ctx, S.olive, -150, -70); } },
      { y: 150, f: () => { shadow(ctx, 40, 150, 16, 4.5); blit(ctx, S.olive, 40, 150, true); } },
      { y: py, f: () => drawHero(ctx, px, py, t, 1) },
      { y: 10, f: () => drawEnemy(ctx, 78, 10, t, 'brute', -1, 0.4) },
      { y: -120, f: () => drawEnemy(ctx, hw - 120, -120, t, 'brute', -1, 0.8) },
    ];
    [[-80, 70, 0.2], [-40, 110, 0.7], [150, 100, 0.1], [180, 125, 0.5], [210, 95, 0.9], [120, -40, 0.3], [-hw + 40, -60, 0.6]].forEach((e) => list.push({ y: e[1], f: () => drawEnemy(ctx, e[0], e[1], t, 'creeper', e[0] > 0 ? -1 : 1, e[2]) }));
    [[-210, -20, 0.1], [230, -90, 0.6], [140, 140, 0.3], [-120, 150, 0.8]].forEach((e) => list.push({ y: e[1], f: () => drawEnemy(ctx, e[0], e[1], t, 'ghost', e[0] > 0 ? -1 : 1, e[2]) }));
    for (const g of [[30, 60], [52, 72], [-30, -30], [100, 60]]) list.push({ y: g[1], f: () => { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6; rot(ctx, S.haloSmall, g[0], g[1] - 2.5, t * 1.2 + g[0], 10, 10); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#f0a020'; ctx.beginPath(); ctx.ellipse(g[0], g[1] - 2, 1.4, 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff6c8'; ctx.fillRect(g[0] - 0.8, g[1] - 3.2, 0.7, 0.9); } });
    list.sort((a, b) => a.y - b.y).forEach((o) => o.f());
    // orbiting objects: root lanterns with their own rotating halo
    for (let i = 0; i < 2; i++) { const a = t * 2.2 + i * Math.PI, ox = px + Math.cos(a) * 30, oy = py - 6 + Math.sin(a) * 20;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; rot(ctx, S.halo, ox, oy - 5, t * 0.9 + i, 28, 28); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; blit(ctx, S.lantern, ox, oy + 2, Math.cos(a) < 0); }
    // seed-shaped projectile + tapered trail, impact star, paint dabs, floating number
    const k = (t * 1.5) % 1, sx = px + 10 + (62 - px) * k, sy = py - 14 + (-12 - py + 14) * k, ang = Math.atan2(-12 - py + 14, 62 - px);
    ctx.globalAlpha = 0.9; rot(ctx, S.trail.c, sx - Math.cos(ang) * 6, sy - Math.sin(ang) * 6, ang, 16, 4); ctx.globalAlpha = 1; rot(ctx, S.seed.c, sx, sy, ang, 7, 5);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 9); rot(ctx, S.star.c, 74, -16, t, 12, 12); ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 9; i++) { const r = rng(i * 17 + 3), a = r.next() * TAU, d = 8 + r.next() * 18; ctx.globalAlpha = 0.9; rot(ctx, S.dabs[i % 5].c, 78 + Math.cos(a) * d, 12 + Math.sin(a) * d * 0.6, r.next() * 6, 4.2, 1.8, 0.6); }
    ctx.globalAlpha = 1;
    // fireflies: drifting additive mini halos
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const hsh = hashInt(i, 3, 777), tw = 0.5 + 0.5 * Math.sin(t * 2.3 + (hsh & 63)); ctx.globalAlpha = 0.25 + 0.45 * tw; rot(ctx, S.haloSmall, ((hsh & 1023) / 1023 - 0.5) * 2 * hw + Math.sin(t * 0.5 + i) * 14, (((hsh >>> 10) & 1023) / 1023 - 0.5) * 2 * hh + Math.sin(t * 0.37 + i) * 10, t + i, 7 + tw * 3, 7 + tw * 3); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const age = (t * 0.8) % 1, txt = (x, y, str, size, fill, hi) => { ctx.save(); ctx.translate(x, y - age * 6); ctx.rotate(-0.08); ctx.font = `400 ${size}px "Caveat Brush", "Segoe Print", cursive`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.22; ctx.strokeStyle = '#121838'; ctx.strokeText(str, 0, 0); ctx.fillStyle = fill; ctx.fillText(str, 0, 0); ctx.globalAlpha = 0.75; ctx.fillStyle = hi; ctx.fillText(str, -0.35, -0.45); ctx.restore(); };
    txt(80, -52, '34', 17, '#f6602a', '#ffd27a'); txt(118, -20, '17', 12, '#f6c43a', '#fff4c0');
    // screen space: varnish vignette + museum HUD
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(GROUND.vig, 0, 0); ctx.drawImage(GROUND.hud, 0, 0);
    const u = h / 540, sh = (str, x, y, font, col, align) => { ctx.font = font; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#0a0e24'; ctx.fillText(str, x, y + 2 * u); ctx.fillStyle = col; ctx.fillText(str, x, y); };
    sh('No 4', w - 18 * u, 13 * u, `400 ${12 * u}px "Caveat Brush", cursive`, '#fff0b0', 'right');
    sh('100/100', 194 * u, 38 * u, `400 ${14 * u}px "Caveat Brush", cursive`, '#fff0c8');
    sh('22:' + String(9 + (Math.floor(t) % 50)).padStart(2, '0'), w / 2, 42 * u, `800 ${22 * u}px "Cinzel", Georgia, serif`, '#ffe27a', 'center');
    sh('title text', w / 2, 61 * u, `400 ${11 * u}px "Caveat Brush", cursive`, '#cfe4ff', 'center');
    sh('88', w - 18 * u, 40 * u, `400 ${20 * u}px "Caveat Brush", cursive`, '#fff0c8', 'right');
    ctx.fillStyle = '#d0341e'; ctx.beginPath(); ctx.arc(26 * u, 36 * u, 5 * u, Math.PI, 0); ctx.arc(34 * u, 36 * u, 5 * u, Math.PI, 0); ctx.lineTo(30 * u, 46 * u); ctx.fill();
  }

  const Starter = { id: 'vangogh', name: 'Starry Night', palette: PALETTE, fonts: ['Cinzel:wght@600;800', 'Caveat Brush', 'Alegreya:ital,wght@1,500'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['vangogh'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
