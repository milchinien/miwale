/* Starry Night (Van Gogh) — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Everything is built from one primitive: the impasto brush stroke (stroke()). Sprites and the ground are
   painted stroke by stroke ONCE into offscreen canvases (every animation pose is its own small painting);
   per frame only drawImage, a few additive halos and short-lived paint effects run. */
(function (root) {
  'use strict';
  const PALETTE = {
    underpaint: '#141c30', prussian: '#111733', ultramarine: '#26409a', cobalt: '#4a76cc',
    meadow: '#2e5944', meadowLight: '#70944e', forest: '#173024', wheat: '#866c2a', wheatLight: '#bc9a3e',
    path: '#3d4180', pond: '#26579c', cadmium: '#ffd040', chrome: '#ffe070', starWhite: '#fff6c8', haloTurquoise: '#9fd4dc',
    orange: '#d86c1e', scarlet: '#c8341e', violet: '#763896', cream: '#e2d09a', ghost: '#a2d0d2', rim: '#9aae4c', gold: '#d8aa48',
  };
  const TAU = Math.PI * 2, K = 3; // K = sprite px per world unit
  /* ---------- tiny helpers (hash, seeded rng, noise, colour) ---------- */
  const hashInt = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; };
  function rng(seed) { let a = seed >>> 0; return { next() { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }; }
  const RNG = (seed, part) => rng(seed * 31 + part * 977);   // one generator per body part: strokes stay put between poses
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
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), clamp01 = (v) => clamp(v, 0, 1);
  const easeOut = (t) => 1 - (1 - t) * (1 - t), easeInOut = (t) => t * t * (3 - 2 * t);
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
    ctx.lineWidth = hw * 0.32; ctx.strokeStyle = rgb(mul(col, o.lo !== undefined ? o.lo : 0.58), 0.75); ctx.stroke();
    const v1 = (r.next() - 0.5) * hw * 0.9;
    ctx.beginPath(); ctx.moveTo(-hl * 0.55, v1); ctx.quadraticCurveTo(hl * 0.2, v1 * 0.8 + b * 0.9, hl * 0.95, b * 0.12 + v1 * 0.3);
    ctx.lineWidth = Math.max(0.05, wid * 0.08); ctx.lineCap = 'butt'; ctx.strokeStyle = rgb(mul(col, 0.7), 0.55); ctx.stroke();
    ctx.restore();
  }
  /* ---------- painted regions ---------- */
  function spline(P, steps) {
    const out = [], n = P.length, f = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    for (let i = 0; i < n; i++) { const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n]; for (let s = 0; s < steps; s++) out.push([f(p0[0], p1[0], p2[0], p3[0], s / steps), f(p0[1], p1[1], p2[1], p3[1], s / steps)]); }
    return out;
  }
  function pathOf(P) { const p = new Path2D(); p.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) p.lineTo(P[i][0], P[i][1]); p.closePath(); return p; }
  function inPoly(P, x, y) { let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; }
  /** Fill a polygon with a jittered grid of strokes oriented by a form function: o = { base, sp, len, wid, jit, col, ang, edge }. */
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
  /** Dark painted contour: strokes laid along the edge, thicker on the shadow side (light from the upper left). */
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
        stroke(ctx, x, y, Math.atan2(dy, dx) + (r.next() - 0.5) * 0.2, e.l * (0.8 + r.next() * 0.4), e.w * (0.7 + 0.55 * clamp01(sh * 0.5 + 0.5)), e.col, r, { hi: 0.16 });
      }
      carry = d - L;
    }
  }
  const seg = (ctx, x0, y0, x1, y1, wid, col, r, o) => stroke(ctx, (x0 + x1) / 2, (y0 + y1) / 2, Math.atan2(y1 - y0, x1 - x0), hyp(x1 - x0, y1 - y0) + wid * 0.4, wid, col, r, o);
  const GLOWC = hexes(['#4a1206', '#ffb52e', '#ffe070', '#fff6c8']);
  /** Carved glowing hole: dark rim offset, orange, yellow core, white-hot centre. */
  function carved(ctx, P) {
    let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= P.length; cy /= P.length;
    const sc = (k, oy) => pathOf(P.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k + oy]));
    ctx.fillStyle = rgb(GLOWC[0]); ctx.fill(pathOf(P.map((p) => [p[0] + 0.35, p[1] + 0.4])));
    ctx.fillStyle = rgb(GLOWC[1]); ctx.fill(pathOf(P));
    ctx.fillStyle = rgb(GLOWC[2]); ctx.fill(sc(0.62, 0.15));
    ctx.fillStyle = rgb(GLOWC[3]); ctx.fill(sc(0.3, 0.2));
  }
  const tri = (cx, cy, s, tall) => [[cx - s, cy + s * 0.6 * tall], [cx + s, cy + s * 0.6 * tall], [cx + s * 0.15, cy - s * tall]];
  /** Paint into an offscreen canvas (K px per unit), trimmed to its painted pixels – margins cost fill rate per blit. */
  function mk(wu, hu, ax, ay, fn) {
    const { c, ctx } = cv(wu * K, hu * K);
    ctx.scale(K, K); ctx.translate(ax, ay); fn(ctx);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 3) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 < 0) return { c, w: wu, h: hu, ax, ay };
    const o = cv(x1 - x0 + 3, y1 - y0 + 3);
    o.ctx.drawImage(c, x0 - 1, y0 - 1, o.c.width, o.c.height, 0, 0, o.c.width, o.c.height);
    return { c: o.c, w: o.c.width / K, h: o.c.height / K, ax: ax - (x0 - 1) / K, ay: ay - (y0 - 1) / K };
  }
  function blit(ctx, s, x, y, facing, sx, sy) {
    sx = sx || 1; sy = sy || 1;
    ctx.save(); ctx.translate(x, y); if (facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(s.c, -s.ax * sx, -s.ay * sy, s.w * sx, s.h * sy); ctx.restore();
  }

  /* ---------- characters: every pose is its own small painting ---------- */
  const PRUSSIAN = H('#111733');
  const ORANGE = hexes(['#8e3a12', '#b8521a', '#d86c1e', '#ec8a28', '#f6aa3c', '#fcd06a']);
  const COAT = hexes(['#141d52', '#1d2c78', '#26409a', '#3157b4', '#4a76cc', '#7aa0e0']);
  const LEAF = hexes(['#163a2a', '#1f5a3a', '#2f7a4a', '#4a9a52', '#80bc5c']);
  const SCARF = hexes(['#8a1a10', '#c8341e', '#e8502a', '#f6883a']);
  const VIO = hexes(['#34124c', '#55206f', '#763896', '#985ab6', '#c28cd8']), CREAM = hexes(['#9c8656', '#c4ad78', '#e2d09a', '#f4e9c2', '#fffbe8']);
  function leg(ctx, r, k, swing, lift, bob) {
    const hipX = k * 1.6, hipY = -5.8 + bob * 0.6, fx = k * 0.7 + swing * 4.0, fy = -0.4 - lift;
    const kx = (hipX + fx) / 2 + 0.5 + lift * 0.55, ky = (hipY + fy) / 2 - lift * 0.2, col = k < 0 ? H('#1f192c') : H('#30273f');
    seg(ctx, hipX, hipY, kx, ky, 2.7, col, r); seg(ctx, kx, ky, fx, fy - 0.9, 2.4, col, r);
    stroke(ctx, fx + 1.1, fy - 0.35, 0.05 - lift * 0.18, 3.9, 2.15, H(k < 0 ? '#140c08' : '#24170f'), r, { hi: 0.28 });
  }
  function arm(ctx, r, sx, sy, swing, col, colHi) {
    const hx = sx + swing * 3.2 + 0.7, hy = sy + 5.5 - Math.abs(swing) * 0.5, ex = (sx + hx) / 2 + 0.6, ey = (sy + hy) / 2 + 0.3;
    seg(ctx, sx, sy, ex, ey, 2.7, col, r); seg(ctx, ex, ey, hx, hy, 2.4, col, r);
    seg(ctx, sx + 0.3, sy + 0.4, ex, ey - 0.3, 0.9, colHi, r, { a: 0.75 });
    stroke(ctx, hx + 0.25, hy + 0.55, 0.6 + swing * 0.25, 1.9, 1.75, H('#e8cf9c'), r, { hi: 0.4 });
  }
  /** Main character, feet at (0,0), looking to +x. q = pose: legF/legB swing, liftF/liftB, bob, armF/armB, breath, hem, hb/ht head lag. */
  function paintHero(ctx, seed, q) {
    ctx.rotate(q.lean || 0);
    const bob = q.bob || 0, br = (q.breath || 0) * 0.35, hm = q.hem || 0;
    leg(ctx, RNG(seed, 1), -1, q.legB, q.liftB, bob); leg(ctx, RNG(seed, 2), 1, q.legF, q.liftF, bob);
    ctx.save(); ctx.translate(0, bob);
    arm(ctx, RNG(seed, 3), -3.7, -14.1, q.armB, COAT[1], COAT[3]);
    const coat = spline([[-4.4, -15.6 - br], [0, -16 - br], [4.4, -15.6 - br], [5.7, -10.5], [6.9 + hm * 0.5, -4.4], [3.2 + hm * 0.3, -3.3], [0, -3.9], [-3.2 + hm * 0.4, -3.3], [-7.1 + hm, -4.4], [-5.6, -10.5]], 3);
    paint(ctx, coat, RNG(seed, 4), { base: COAT[1], sp: 1.55, len: 4.2, wid: 1.5, jit: 0.15, col: (x, y, rr) => rampPick(COAT, 2.3 - x * 0.3 - (y + 10) * 0.05 + (rr.next() - 0.5) * 1.3), ang: (x) => -Math.PI / 2 + x * 0.07, edge: { col: PRUSSIAN, w: 1.05, l: 3 } });
    const rb = RNG(seed, 5);
    stroke(ctx, 1.1, -11.2, 0.3, 1.3, 1.1, H('#f0c040'), rb, { hi: 0.5 }); stroke(ctx, 1.3, -7.8, 0.3, 1.3, 1.1, H('#f0c040'), rb, { hi: 0.5 });
    seg(ctx, -5.3, -6.9, 5.9, -6.6, 1.1, H('#7a5a2a'), rb); seg(ctx, -5.0, -7.1, 5.6, -6.9, 0.45, H('#c8a050'), rb, { a: 0.8 });
    for (let i = 0; i < 4; i++) stroke(ctx, -3.8 + i * 2.5, -15.5 - br, (rb.next() - 0.5) * 0.4, 3.4, 2.2, i & 1 ? SCARF[2] : SCARF[1], rb);
    arm(ctx, RNG(seed, 6), 4.1, -14.1, q.armF, COAT[3], COAT[5]);
    ctx.translate(0.6, -22.6 - br * 0.6 + (q.hb || 0)); ctx.rotate(q.ht || 0);
    const rh = RNG(seed, 7), rx = 8.8, ry = 7.4, head = [];
    for (let i = 0; i < 44; i++) { const a = (i / 44) * TAU, k = 1 + 0.035 * Math.abs(Math.sin(a * 3.5)); head.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]); }
    // strokes follow the meridians of the gourd: the angle of the meridian ellipse through (x, y)
    const merid = (x, y) => { const qq = Math.sqrt(Math.max(0.06, 1 - (y / ry) ** 2)), kk = x / (rx * qq); return Math.atan2(1, (-kk * rx * y) / (ry * ry * qq)); };
    paint(ctx, head, rh, { base: ORANGE[2], sp: 1.3, len: 3.6, wid: 1.45, jit: 0.12, ang: merid,
      col: (x, y, rr) => { const l = -(x / rx) * 1.5 - (y / ry) * 1.3; if (l < -1.2 && rr.next() < 0.3) return H('#7a3a4a'); return rampPick(ORANGE, 2.6 + l + (rr.next() - 0.5) * 1.2); } });
    contour(ctx, head, rh, { col: PRUSSIAN, w: 1.1, l: 3.2 });
    seg(ctx, 0.3, -ry + 0.8, 1.6, -ry - 2.9, 1.9, H('#4f6a26'), rh); stroke(ctx, -1.9, -ry - 0.6, -0.55, 3.6, 1.6, H('#3f7a3a'), rh);
    const fx = 1.9;
    carved(ctx, tri(fx - 2.9, -1.6, 1.7, 1.25)); carved(ctx, tri(fx + 2.9, -1.6, 1.7, 1.25)); carved(ctx, tri(fx, 0.4, 0.65, 1));
    carved(ctx, [[-4.7, -0.2], [-3.4, 0.6], [-2.4, -0.2], [-1.2, 0.7], [0, -0.1], [1.2, 0.7], [2.4, -0.2], [3.4, 0.6], [4.7, -0.2], [3.8, 1.9], [1.6, 2.9], [-1.6, 2.9], [-3.8, 1.9]].map((p) => [fx + p[0], 2.4 + p[1]]));
    ctx.restore();
  }
  /** Small creature: a violet-and-cream root bulb; leaves lag the hop (overlapping action). */
  function paintTurnip(ctx, seed, q) {
    const rl = RNG(seed, 1);
    for (const s of [-1, 1]) { const sw = s < 0 ? q.legL : -q.legL, lift = Math.max(0, s * q.liftL); seg(ctx, s * 2.2, -4.4 + q.bob * 0.5, s * 1.4 + sw * 2.2 + 0.4, -0.4 - lift, 1.8, H(s < 0 ? '#8a6a48' : '#a8865a'), rl); }
    ctx.save(); ctx.translate(0, q.bob); ctx.scale(1 + q.sq * 0.6, 1 - q.sq); ctx.rotate(q.tilt);
    const cy = -12.6, rx = 8.6, ry = 8.2, rv = RNG(seed, 3);
    for (let i = 0; i < 4; i++) { const sp = -0.8 + (i / 3) * 1.4, a = -Math.PI / 2 + sp - 0.25 + q.leaf * (1 + i * 0.25), L = 6.4 * (1 - Math.abs(sp) * 0.2); stroke(ctx, 0.3 + Math.cos(a) * L * 0.55, cy - ry + 1.3 + Math.sin(a) * L * 0.55, a, L, 2.5, LEAF[1 + (i & 1)], rv, { hi: 0.22, bend: 0.25 }); }
    const body = [];
    for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, s = Math.sin(a); body.push([Math.cos(a) * rx * (s > 0 ? 1 - 0.38 * s * s : 1), cy + s * ry * (s > 0 ? 1 + 0.3 * s * s * s : 1)]); }
    paint(ctx, body, RNG(seed, 4), { base: VIO[1], sp: 1.2, len: 3.3, wid: 1.4, jit: 0.15,
      col: (x, y, rr) => { const dx = x / rx, dy = (y - cy) / ry, l = -dx * 1.4 - dy * 0.6; return (dy + 1) / 2 + (rr.next() - 0.5) * 0.2 < 0.5 + 0.08 * Math.sin(x * 0.9) ? rampPick(VIO, 2.1 + l + (rr.next() - 0.5) * 1.1) : rampPick(CREAM, 2.3 + l + (rr.next() - 0.5) * 1.1); },
      ang: (x, y) => Math.atan2(x / (rx * rx), -(y - cy) / (ry * ry)) * 0.7, edge: { col: H('#1d1036'), w: 1.0, l: 2.8 } });
    const rf = RNG(seed, 5);
    for (const s of [-1, 1]) { stroke(ctx, 1.4 + s * 2.6, cy - 0.7, s * 0.35, 2.5, 1.7, H('#ffcf40'), rf, { hi: 0.55, bend: 0 }); stroke(ctx, 1.75 + s * 2.6, cy - 0.55, 0, 0.85, 0.85, H('#3a0a10'), rf, { bend: 0 }); stroke(ctx, 1.3 + s * 2.6, cy - 2.25, s * 0.45, 2.9, 0.9, H('#1d0f2a'), rf, { bend: 0 }); }
    stroke(ctx, 1.7, cy + 2.7, 0, 3.0, 0.8, H('#2a0c22'), rf, { bend: 0.25 });
    ctx.restore();
  }
  let S = null;
  function bake() {
    if (S) return S;
    S = { walk: [], idle: [], turnip: [] };
    // walk: 8 poses – contact, down, passing, up per foot; arms counter-swing; the head lags the body by ~1 rad
    for (let i = 0; i < 8; i++) { const ph = (i / 8) * TAU, s = Math.sin(ph), c = Math.cos(ph), sb = Math.sin(ph - 0.4), sh = Math.sin(ph - 1.0);
      S.walk.push(mk(40, 44, 19, 39, (ctx) => paintHero(ctx, 1000, { legF: s, legB: -s, liftF: Math.max(0, c) * 2.1, liftB: Math.max(0, -c) * 2.1, bob: (sb * sb - 0.5) * 1.7, armF: -s, armB: s, hem: -c * 0.8, hb: (sh * sh - 0.5) * 0.8, ht: 0.06 * Math.sin(2 * ph - 1.2), lean: 0.075 }))); }
    // idle: neutral – inhale – hold – exhale (4 held poses)
    [0, 0.6, 1, 0.45].forEach((b, i) => S.idle.push(mk(40, 44, 19, 39, (ctx) => paintHero(ctx, 1000, { legF: 0.06, legB: -0.06, liftF: 0, liftB: 0, armF: -0.05, armB: 0.08, breath: b, hb: -b * 0.3, ht: [0, 0.02, 0.035, 0.012][i], hem: -b * 0.15 }))));
    // small creature: 6-pose waddle – squash on contact, hop up, leaves lag behind
    for (let p = 0; p < 6; p++) { const ph = (p / 6) * TAU, s = Math.sin(ph), c = Math.cos(ph), as = Math.abs(s);
      S.turnip.push(mk(30, 40, 15, 35, (ctx) => paintTurnip(ctx, 2000, { legL: s, liftL: c * 1.3, bob: -(1 - as) * 1.2, sq: as * as * as * 0.08 - (1 - as) * 0.03, tilt: 0.09 * s, leaf: -0.2 * Math.cos(ph - 0.9) }))); }
    // halo: concentric bands of comma strokes – chrome yellow inside, pale turquoise outside (never a target of rings)
    const hc = cv(160, 160), hr = rng(77), R = 80, cols = ['#fff6c8', '#ffe070', '#ffd040', '#9fd4dc', '#d6e6b0'];
    const g = hc.ctx.createRadialGradient(R, R, 0, R, R, R * 0.5); g.addColorStop(0, 'rgba(255,246,200,0.55)'); g.addColorStop(1, 'rgba(255,224,112,0)');
    hc.ctx.fillStyle = g; hc.ctx.fillRect(0, 0, 160, 160);
    [[0.22, 0.95, 0.22, 0.085], [0.4, 0.72, 0.25, 0.075], [0.6, 0.45, 0.27, 0.065], [0.82, 0.22, 0.28, 0.055]].forEach((rg, i) => {
      const rr = rg[0] * R, n = Math.max(6, Math.round((TAU * rr) / (rg[2] * R * 0.85))), off = hr.next() * TAU, wob = hr.next() * TAU;
      for (let k = 0; k < n; k++) { const a = off + (k / n) * TAU, rk = rr * (1 + 0.05 * Math.sin(a * 3 + wob)); stroke(hc.ctx, R + Math.cos(a) * rk, R + Math.sin(a) * rk, a + Math.PI / 2 + 0.08, rg[2] * R * (0.75 + hr.next() * 0.6), rg[3] * R, H(cols[Math.min(4, i + (hr.next() < 0.3 ? 1 : 0))]), hr, { a: rg[1], bend: 0.22 }); }
    });
    S.halo = hc.c;
    // painted contact shadow: 16 dark ultramarine strokes, drawn offset to the lower right (light from the upper left)
    const sh = cv(80, 32), shr = rng(78); sh.ctx.scale(4, 4);
    for (let i = 0; i < 16; i++) { const a = shr.next() * TAU, d = Math.sqrt(shr.next()); stroke(sh.ctx, 10 + Math.cos(a) * d * 6, 4 + Math.sin(a) * d * 2, (shr.next() - 0.5) * 0.3, 7 - d * 3, 2.6 - d, H(i & 1 ? '#0c1030' : '#141a44'), shr, { hi: 0.08, a: 0.75 }); }
    S.shadow = sh.c;
    // single loaded dabs for effects (paint-on swirls, peeling strokes)
    S.dab = {};
    for (const k of ['#ffe27a', '#ffd040', '#f6f0dc', '#f08a2a', '#8a4aac', '#eadcae', '#4a2a5a']) { const d = cv(28, 12), dr = rng(hashInt(k.length, parseInt(k.slice(1), 16), 5)); d.ctx.scale(4, 4); stroke(d.ctx, 3.5, 1.5, 0, 4.6, 1.9, H(k), dr, { bend: 0.1 }); S.dab[k] = d.c; }
    return S;
  }

  /* ---------- effects: paint, not glowing circles ---------- */
  /** A swirl painted on stroke by stroke from the centre out; strokes behind a standing figure are skipped (hole). */
  function paintSwirl(ctx, x, y, R, age, rot, cols, arms, per, hole) {
    const grow = 0.55 + 0.45 * easeOut(Math.min(1, age * 1.8));
    for (let k = 0; k < arms; k++) for (let j = 0; j < per; j++) {
      const t = j / (per - 1), rev = clamp01((age * 2.6 - t * 0.9) / 0.22);
      if (rev <= 0) break;
      const dry = 1 - Math.min(1, Math.max(0, (age + t * 0.14 - 0.5) / 0.5)); if (dry <= 0) continue;
      const a = rot + k * (TAU / arms) + t * 4.0 + age * 1.4, rr = R * (0.14 + t * 0.82) * grow;
      const sx = x + Math.cos(a) * rr, sy = y + Math.sin(a) * rr * 0.6;
      if (hole && sy < y + 2 && Math.abs(sx - x) < hole) continue;
      const L = R * (0.42 + t * 0.18) * (0.4 + 0.6 * rev);
      ctx.save(); ctx.globalAlpha = dry > 0.35 ? 1 : dry / 0.35; ctx.translate(sx, sy); ctx.rotate(a + 1.71);
      ctx.drawImage(S.dab[cols[(j + k) % cols.length]], -L / 2, -L * 0.21 * (0.25 + 0.75 * dry), L, L * 0.43 * (0.25 + 0.75 * dry)); ctx.restore();
    }
  }
  /** Dissolve: squash + warm flash (15 %), then the body slumps while its strokes peel off and spiral away. */
  function dissolve(ctx, spr, x, y, d, seed) {
    if (d < 0.15) { const a = d / 0.15; blit(ctx, spr, x, y, -1, 1 + 0.24 * a, 1 - 0.2 * a); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * (1 - a); blit(ctx, spr, x, y, -1, 1 + 0.24 * a, 1 - 0.2 * a); ctx.restore(); return; }
    const b = (d - 0.15) / 0.85, eb = easeInOut(b);
    ctx.save(); ctx.globalAlpha = Math.pow(1 - b, 1.5); blit(ctx, spr, x, y, -1, 1 + 0.2 * eb, 1 - 0.62 * eb); ctx.restore();
    const cols = ['#8a4aac', '#eadcae', '#8a4aac', '#4a2a5a'];
    for (let i = 0; i < 9; i++) {
      const u = (Math.sin(seed * 97.3 + i * 12.9898) * 43758.5453) % 1, uu = Math.abs(u), v = (uu * 7.31 + i * 0.618) % 1, dl = v * 0.32;
      const t = clamp01((b - dl) / (1 - dl)); if (t <= 0) continue;
      const et = easeOut(t), ang = (i / 9) * TAU + uu * 0.8 + et * (2 + v * 1.2), rr = 9 * (0.5 + 0.5 * uu) * (1 + et * 1.6);
      const L = 4.8 * (0.7 + 0.5 * uu) * (1 + 0.8 * Math.sin(Math.PI * Math.min(1, t * 1.5))) * (1 - t * t * 0.6);
      ctx.save(); ctx.globalAlpha = 1 - t * t; ctx.translate(x + Math.cos(ang) * rr, y - 11 + Math.sin(ang) * rr * 0.62 - et * 15 * (0.6 + 0.6 * v)); ctx.rotate(ang + 1.82);
      ctx.drawImage(S.dab[cols[i % 4]], -L / 2, -L * 0.21, L, L * 0.42); ctx.restore();
    }
  }

  /* ---------- ground: three stroke scales over a dark under-painting, designed edges ---------- */
  const MATS = [
    { L: 10, W: 2.6, pal: hexes(['#1a3430', '#23463c', '#2e5944', '#3c6a48', '#527e4a', '#70944e']), acc: hexes(['#2e4a86', '#8a8a3a']), under: '#11201c' },   // meadow
    { L: 9, W: 2.5, pal: hexes(['#3c2e18', '#54421e', '#6c5624', '#866c2a', '#a08232', '#bc9a3e']), acc: hexes(['#2e3e70', '#a65e28']), under: '#2e2214' },   // wheat
    { L: 10, W: 2.5, pal: hexes(['#1c1e44', '#262a5a', '#31356c', '#3d4180', '#4c4f94', '#6264a8']), acc: hexes(['#8e7c6c', '#6a4f8e']), under: '#111128' },   // path
  ];
  let GROUND = null;
  function bakeGround(w, h) {
    const key = w + 'x' + h; if (GROUND && GROUND.key === key) return GROUND.c;
    const sc = h / 360, WU = w / sc, { c, ctx } = cv(w, h), r = rng(9);
    ctx.scale(sc, sc);
    // fields: a wheat field (iso-line 0.5 of a noise field), a path (curve), meadow elsewhere
    const wf = (x, y) => fbm(x / 210 + 3.1, y / 210 - 1.7, 31, 3) + (x / WU - 0.55) * 0.5;
    const pathY = (x) => 250 + 38 * Math.sin(x / 95) + 0.12 * x * 0.1;
    const field = (x, y) => {
      const e = 2, f = wf(x, y), gx = (wf(x + e, y) - f) / e, gy = (wf(x, y + e) - f) / e, gm = hyp(gx, gy) + 1e-7;
      const dW = (f - 0.5) / gm, py = pathY(x), slope = (pathY(x + 1) - py), pd = Math.abs(y - py) / Math.sqrt(1 + slope * slope);
      const mat = pd < 11 ? 2 : dW > 0 ? 1 : 0;
      return { mat, dW, nx: gx / gm, ny: gy / gm, pd, tx: 1 / Math.sqrt(1 + slope * slope), ty: slope / Math.sqrt(1 + slope * slope) };
    };
    for (let y = 0; y < 360; y += 6) for (let x = 0; x < WU; x += 6) { ctx.fillStyle = MATS[field(x + 3, y + 3).mat].under; ctx.fillRect(x, y, 6.5, 6.5); }
    const wind = (x, y) => -0.45 + (fbm(x / 380, y / 380, 53, 2) - 0.5) * 3;
    const flow = (F, x, y) => (F.mat === 0 ? wind(x, y) : F.mat === 1 ? Math.atan2(F.nx, -F.ny) : Math.atan2(F.ty, F.tx));   // grass in the wind | furrows along the field edge | along the path
    const det = (F) => Math.max(Math.abs(F.dW) < 11 ? 1 - Math.abs(F.dW) / 11 : 0, Math.abs(F.pd - 11) < 9 ? 1 - Math.abs(F.pd - 11) / 9 : 0);
    const PASS = [[6.6, 1.5, 1.5, 1.45], [4.5, 2.4, 1, 1], [2.9, 3.1, 0.65, 0.65]];   // cell, base ramp index, length and width scale
    PASS.forEach(([cell, base, ls, ws], pass) => {
      for (let cy = -1; cy * cell < 362; cy++) for (let cx = -1; cx * cell < WU + 2; cx++) {
        const rr = rng(hashInt(cx, cy, 7001 + pass)), x = (cx + rr.next()) * cell, y = (cy + rr.next()) * cell, F = field(x, y), dd = det(F), u = rr.next();
        if (pass === 1 && u > 0.3 + 0.62 * dd) continue;                         // body strokes gather near edges
        if (pass === 2 && (dd < 0.12 || u > dd * dd * 1.15)) continue;            // small focal strokes only on the edges
        const m = MATS[F.mat], light = (fbm(x / 250, y / 250, 61, 2) - 0.5) * 2.4 + (F.mat === 1 && F.dW > 0 ? 0.75 * Math.sin(F.dW * 0.95) : 0);
        if (pass > 0 && Math.abs(F.dW) < 1.1 && F.pd > 12 && u < 0.75) { stroke(ctx, x, y, Math.atan2(F.nx, -F.ny), 5.6 * 0.85, 1.7, H('#111733'), rr, { hi: 0.08 }); continue; }   // ink line of the field edge
        if (pass > 0 && Math.abs(F.pd - 12) < 1.3) { stroke(ctx, x, y, Math.atan2(F.ty, F.tx), 5.6 * 0.85, 1.7, H('#0c1228'), rr, { hi: 0.08 }); continue; }             // path border
        if (pass === 2 && F.dW > 0.8 && F.dW < 7 && u < 0.35 && fbm(x / 70 + 1.7, y / 70 + 9.1, 81, 2) > 0.6) { stroke(ctx, x, y, rr.next() * TAU, 2.2, 1.6, H(['#b02a1a', '#d8452a', '#ec6a32'][(u * 10 | 0) % 3]), rr); continue; }   // poppy drift
        const col = pass > 0 && rr.next() < 0.06 ? m.acc[(u * 7 | 0) % 2] : m.pal[clamp(Math.round(base + light + (rr.next() - 0.5) * (pass ? 1.2 : 0.9)), 0, 5)];
        stroke(ctx, x, y, flow(F, x, y) + (rr.next() - 0.5) * 0.3, m.L * ls * (0.8 + rr.next() * 0.4), m.W * ws, col, rr, pass === 0 ? { hi: 0.12, lo: 0.82, bend: (rr.next() - 0.5) * 0.4 } : null);
      }
    });
    // a meadow wind eddy: strokes on a flattened spiral
    for (let i = 0; i < 36; i++) { const t = i / 36, a = t * 2.1 * TAU, rr2 = 1.5 + t * 30; stroke(ctx, WU * 0.2 + Math.cos(a) * rr2, 120 + Math.sin(a) * rr2 * 0.72, a + Math.PI / 2, 9 * (0.6 + t * 0.4), 2.5, H(['#5e8a4c', '#86a656', '#a4b450', '#2e4a86'][i % 4]), r); }
    GROUND = { key, c };
    return c;
  }

  /* ---------- public drawers ---------- */
  /** Main character, feet at (x, y) in world units; walks on twos (12 fps), the scarf tail lags on a spring. */
  function drawHero(ctx, x, y, t, facing, moving) {
    bake();
    const fr = moving === false ? S.idle[Math.floor(t * 2.5) & 3] : S.walk[Math.floor(t * 12) & 7];
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.42 * (0.85 + 0.15 * Math.sin(t * 2.2));
    ctx.translate(x + 3.3 * (facing < 0 ? -1 : 1), y - 22); ctx.rotate(t * 0.5); ctx.drawImage(S.halo, -20, -20, 40, 40); ctx.restore();
    // scarf tail: 3 strokes chained from the neck, the angle trails the motion and flutters (follow-through)
    const fs = facing < 0 ? -1 : 1, base = moving === false ? 2.05 + Math.sin(t * 1.7) * 0.12 : Math.PI + 0.06 + Math.sin(t * 7.3) * 0.12, sr = rng(3);
    let px = x - 3.2 * fs, py = y - 15, a = base;
    for (let i = 0; i < 3; i++) { const ang = a + Math.sin(t * 11 + i * 1.3) * 0.1 * i, wa = fs > 0 ? ang : Math.PI - ang, L = 4.6 - i * 0.6; stroke(ctx, px + Math.cos(wa) * L / 2, py + Math.sin(wa) * L / 2, wa, L + 0.8, 2.2 - i * 0.35, SCARF[1 + (i & 1)], sr, { bend: 0.15, hi: 0.35 }); px += Math.cos(wa) * L; py += Math.sin(wa) * L; a = ang; }
    blit(ctx, fr, x, y, facing);
  }
  /** Small creature, feet at (x, y); `phase` offsets its waddle so a crowd never moves in lock-step. */
  function drawEnemy(ctx, x, y, t, phase) {
    bake();
    blit(ctx, S.turnip[Math.floor(t * 12 + (phase || 0) * 6) % 6], x, y, -1);
  }
  function draw(ctx, w, h, t) {
    bake();
    ctx.drawImage(bakeGround(w, h), 0, 0, w, h);
    const sc = h / 360, WU = w / sc;
    ctx.save(); ctx.scale(sc, sc);
    const shadow = (x, y, rx) => { const ry = rx * 0.34; ctx.globalAlpha = 0.62; ctx.drawImage(S.shadow, x - rx + rx * 0.12, y - ry + ry * 0.25, rx * 2, ry * 2); ctx.globalAlpha = 1; };
    // the main character walks back and forth (eased turn), creatures waddle with their own phase
    const k = (t * 0.09) % 2, dir = k < 1 ? 1 : -1, u = easeInOut(k < 1 ? k : 2 - k), hx = WU * (0.3 + 0.32 * u), hy = 205;
    const crowd = [[WU * 0.72, 170, 0.0], [WU * 0.8, 205, 0.37], [WU * 0.68, 232, 0.71]];
    for (const [cx, cy] of crowd) shadow(cx, cy, 8);
    shadow(hx, hy, 8);
    for (const [cx, cy, ph] of crowd) drawEnemy(ctx, cx, cy, t, ph);
    drawHero(ctx, hx, hy, t, dir, true);
    // every 4 s: a glow-up swirl painted around the walker (passes behind it); a creature unpaints and re-forms
    const lu = (t % 4) / 1.0;
    if (lu < 1) paintSwirl(ctx, hx, hy + 1, 30, lu, 0.7, ['#ffe27a', '#ffd040', '#f6f0dc', '#f08a2a'], 3, 10, 11);
    const dd = ((t + 1.3) % 2.4) / 0.9;
    if (dd < 1) dissolve(ctx, S.turnip[0], WU * 0.86, 140, dd, 0.42); else if (dd > 1.4) drawEnemy(ctx, WU * 0.86, 140, t, 0.2);
    ctx.restore();
    // varnish vignette
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(12,10,30,0)'); g.addColorStop(1, 'rgba(12,10,30,0.62)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  const Starter = { id: 'vangogh', name: 'Starry Night', palette: PALETTE, fonts: ['Cinzel:wght@600;800', 'Caveat Brush', 'Alegreya:ital,wght@1,500'], stroke, paint, contour, paintSwirl, drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['vangogh'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
