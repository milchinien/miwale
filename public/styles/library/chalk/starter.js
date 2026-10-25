/* Chalkboard — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Everything is "drawn live with chalk" on a dark slate-green school board: broken pressure strokes,
   loose hatching, rubbed fills, a grain mask that knocks holes into every stroke, and a board-coloured
   "eraser halo" around each sprite so it reads against the busy hatched ground. */
(function (root) {
  'use strict';
  const PALETTE = {
    board: '#25332d', boardDeep: '#1c2823', white: '#eeeee5', orange: '#f89c52', deepOrange: '#de6c34',
    lavender: '#c2acec', mint: '#98deb2', leaf: '#70bc7e', yellow: '#f9e58c', pink: '#f7a8c6',
    blue: '#9eccf0', cream: '#f4e8ce', wood: '#93663f', woodDark: '#5c3b22',
  };
  const TAU = Math.PI * 2;
  const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const BOARD = hx(PALETTE.board), CW = hx(PALETTE.white), CO = hx(PALETTE.orange), CDO = hx(PALETTE.deepOrange);
  const CL = hx(PALETTE.lavender), CM = hx(PALETTE.mint), CG = hx(PALETTE.leaf), CY = hx(PALETTE.yellow);
  const CP = hx(PALETTE.pink), CB = hx(PALETTE.blue), CC = hx(PALETTE.cream);
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const cBoard = rgba(BOARD, 1);

  /* ---------- deterministic randomness + noise helpers ---------- */
  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { next };
  }
  function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function perlin(x, y, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const f = (t) => t * t * t * (t * (t * 6 - 15) + 10), u = f(fx), v = f(fy);
    const g = (ix, iy, dx, dy) => { const a = hash2(ix, iy, s) * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
    const a = g(x0, y0, fx, fy) + u * (g(x0 + 1, y0, fx - 1, fy) - g(x0, y0, fx, fy));
    const b = g(x0, y0 + 1, fx, fy - 1) + u * (g(x0 + 1, y0 + 1, fx - 1, fy - 1) - g(x0, y0 + 1, fx, fy - 1));
    return (a + v * (b - a)) * 1.414;
  }
  function fbm(x, y, s, oct) { let a = 1, f = 1, t = 0, n = 0; for (let i = 0; i < oct; i++) { t += a * perlin(x * f, y * f, s + i * 101); n += a; a *= 0.5; f *= 2; } return t / n * 0.5 + 0.5; }
  const R = (a, b, r) => a + (b - a) * r.next();
  const J = (s, r) => (r.next() - 0.5) * 2 * s;
  const sm = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  const canvas = (w, h, cpu) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return { c, ctx: c.getContext('2d', cpu ? { willReadFrequently: true } : undefined) }; };

  /* ---------- geometry ---------- */
  function ell(cx, cy, rx, ry, n) { const o = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
  /** Catmull-Rom spline through control points, `sub` samples per segment. */
  function spl(pts, sub, closed) {
    const out = [], n = pts.length, P = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let s = 0; s < sub; s++) {
        const t = s / sub, t2 = t * t, t3 = t2 * t, c = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
        out.push([c(0), c(1)]);
      }
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }
  function poly(ctx, p) { ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
  function resample(pts, closed, step) {
    const src = closed ? pts.concat([pts[0]]) : pts, out = [src[0].slice()];
    let carry = 0;
    for (let i = 1; i < src.length; i++) {
      const a = src[i - 1], b = src[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 1e-6) continue;
      let d = step - carry;
      while (d <= L) { out.push([a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]); d += step; }
      carry = L - (d - step);
    }
    const last = src[src.length - 1], lo = out[out.length - 1];
    if (Math.hypot(last[0] - lo[0], last[1] - lo[1]) > step * 0.3) out.push(last.slice());
    return out;
  }

  /* ---------- chalk toolkit (ported 1:1 from the reference module) ---------- */
  /** Chalk line: resample every 1 unit, jitter ±0.12, runs of 3–7 points with their own pressure, closed shapes overshoot, lighter offset double pass. */
  function stroke(ctx, pts, o) {
    const r = o.rng, w = o.w || 1, a = o.a === undefined ? 1 : o.a, c = o.c || CW, j = o.j === undefined ? 0.12 : o.j;
    const P = resample(pts, !!o.closed, o.step || 1.0);
    if (o.closed && P.length > 5) { const ov = 1 + ((r.next() * 3) | 0); for (let i = 1; i <= ov; i++) P.push(P[i].slice()); }
    for (const p of P) { p[0] += J(j, r); p[1] += J(j, r); }
    if (P.length < 2) return;
    let i = 0;
    while (i < P.length - 1) {
      const e = Math.min(P.length - 1, i + 3 + ((r.next() * 5) | 0));
      ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]);
      for (let k = i + 1; k <= e; k++) ctx.lineTo(P[k][0], P[k][1]);
      ctx.lineWidth = w * (0.78 + r.next() * 0.4); ctx.strokeStyle = rgba(c, a * (0.72 + r.next() * 0.28)); ctx.stroke();
      i = e;
    }
    if (o.dbl !== false && P.length > 2) {
      const ox = J(w * 0.32, r), oy = J(w * 0.32, r);
      ctx.beginPath(); ctx.moveTo(P[0][0] + ox, P[0][1] + oy);
      for (let k = 1; k < P.length; k++) ctx.lineTo(P[k][0] + ox + J(0.08, r), P[k][1] + oy + J(0.08, r));
      ctx.lineWidth = w * 0.45; ctx.strokeStyle = rgba(c, a * 0.4); ctx.stroke();
    }
  }
  /** Loose parallel hatching clipped to a polygon: spacing sp·(0.75–1.25), random line lengths, slight bend. */
  function hatch(ctx, pts, o) {
    const r = o.rng, ang = o.ang === undefined ? 0.9 : o.ang, sp = o.sp || 1.4, w = o.w || 0.45, c = o.c || CW, a = o.a === undefined ? 0.7 : o.a, skip = o.skip || 0;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, Rr = Math.hypot(x1 - x0, y1 - y0) / 2 + 1, ins = o.inset || 1;
    ctx.save(); ctx.beginPath(); poly(ctx, pts.map((p) => [cx + (p[0] - cx) * ins, cy + (p[1] - cy) * ins])); ctx.clip();
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    for (let off = -Rr; off <= Rr; off += sp * (0.75 + r.next() * 0.5)) {
      if (r.next() < skip) continue;
      const s0 = -Rr * (0.55 + r.next() * 0.6), s1 = Rr * (0.55 + r.next() * 0.6), bx = cx + nx * off, by = cy + ny * off, bend = J(0.5, r);
      ctx.beginPath(); ctx.moveTo(bx + dx * s0, by + dy * s0); ctx.quadraticCurveTo(bx + nx * bend, by + ny * bend, bx + dx * s1, by + dy * s1);
      ctx.lineWidth = w * (0.7 + r.next() * 0.6); ctx.strokeStyle = rgba(c, a * (0.55 + r.next() * 0.45)); ctx.stroke();
    }
    ctx.restore();
  }
  const rub = (ctx, p, c, a) => { ctx.beginPath(); poly(ctx, p); ctx.fillStyle = rgba(c, a); ctx.fill(); };
  const dot = (ctx, x, y, rr, c, a) => { ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fillStyle = rgba(c, a); ctx.fill(); };
  const fillBoard = (ctx, p) => { ctx.beginPath(); poly(ctx, p); ctx.fillStyle = cBoard; ctx.fill(); };
  function leaf(ctx, r, bx, by, ang, len, wid, col) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
    const p = spl([[bx, by], [mx + nx * wid, my + ny * wid], [bx + dx * len, by + dy * len], [mx - nx * wid, my - ny * wid]], 4, true);
    rub(ctx, p, col, 0.42); hatch(ctx, p, { rng: r, ang: ang + 1.1, sp: 1.2, w: 0.35, c: col, a: 0.6 });
    stroke(ctx, p, { rng: r, closed: true, w: 0.7, c: col, a: 0.95 });
  }

  /* ---------- grain mask + sprite pipeline ---------- */
  let GRAIN = null;
  function buildGrain() { // 128² alpha mask: 10 % deep pits, 1/4-res blotches, horizontal drags
    const N = 128, { c, ctx } = canvas(N, N), im = ctx.createImageData(N, N), d = im.data;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const h = hash2(x, y, 77), h2 = hash2(x >> 1, y >> 1, 78), h3 = hash2(x >> 2, y, 79);
      d[(y * N + x) * 4 + 3] = Math.min(255, h < 0.1 ? 110 + h * 600 : h2 < 0.1 ? 55 : h3 < 0.05 ? 80 : h * 22);
    }
    ctx.putImageData(im, 0, 0); GRAIN = c;
  }
  function applyGrain(ctx, w, h, k, seed) { // destination-out: punches the board through the chalk
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = k;
    const ox = (seed * 37) & 127, oy = (seed * 91) & 127;
    ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, w + ox, h + oy); ctx.restore();
  }
  let K = 1.5, seedN = 1;
  /** Bakes a sprite for the world box [x0,x1]×[y0,y1] (feet = 0,0) at K px/unit: draw → grain → board halo behind. */
  function mk(x0, y0, x1, y1, draw, opt) {
    opt = opt || {};
    const pad = 2, ax = Math.round((pad - x0) * K), ay = Math.round((pad - y0) * K);
    const w = Math.ceil((x1 - x0 + pad * 2) * K), h = Math.ceil((y1 - y0 + pad * 2) * K), A = canvas(w, h, true), a = A.ctx;
    a.setTransform(K, 0, 0, K, ax, ay); a.lineCap = 'round'; a.lineJoin = 'round';
    draw(a);
    applyGrain(a, w, h, 1, seedN++);
    if (opt.halo === 0) return { c: A.c, ax, ay };
    const d = a.getImageData(0, 0, w, h).data, M = canvas(w, h), mi = M.ctx.createImageData(w, h), md = mi.data;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 26) { md[i] = BOARD[0]; md[i + 1] = BOARD[1]; md[i + 2] = BOARD[2]; md[i + 3] = 255; }
    M.ctx.putImageData(mi, 0, 0);
    const D = canvas(w, h), rr = (opt.halo || 1) * K;
    for (let k = 0; k < 12; k++) { const an = (k / 12) * TAU; D.ctx.drawImage(M.c, Math.cos(an) * rr, Math.sin(an) * rr); if (k & 1) D.ctx.drawImage(M.c, Math.cos(an) * rr * 0.5, Math.sin(an) * rr * 0.5); }
    const O = canvas(w, h);
    O.ctx.globalAlpha = opt.haloA === undefined ? 0.9 : opt.haloA; O.ctx.drawImage(D.c, 0, 0); O.ctx.globalAlpha = 1; O.ctx.drawImage(A.c, 0, 0);
    if (opt.post) { O.ctx.setTransform(K, 0, 0, K, ax, ay); opt.post(O.ctx); }
    return { c: O.c, ax, ay };
  }
  function blit(ctx, s, x, y, sc) { const k = (sc || 1) / K; ctx.drawImage(s.c, x - s.ax * k, y - s.ay * k, s.c.width * k, s.c.height * k); }

  /* ---------- characters (world units, feet at 0,0, facing right) ---------- */
  // main character: stick legs, hatched white cloak, mint scarf, big round orange head with a yellow carved face
  function drawJack(ctx, ph, r) {
    const sw = Math.sin(ph * TAU), by = -Math.abs(Math.cos(ph * TAU));
    for (const s of [-1, 1]) {
      const lift = Math.max(0, -sw * s) * 1.7, fx = s * 1.9 + sw * s * 2.6;
      stroke(ctx, [[s * 1.6, -7.6 + by], [(s * 1.6 + fx) / 2, -4 + by * 0.5 - lift * 0.5], [fx, -lift]], { rng: r, w: 1.35, a: 0.95 });
      stroke(ctx, [[fx - 0.6, -lift + 0.1], [fx + 1.7, -lift - 0.1]], { rng: r, w: 1.4, a: 0.95, dbl: false });
    }
    stroke(ctx, [[-3.2, -14 + by], [-4.4 - sw * 0.6, -11.5 + by], [-4.6 - sw * 1.6, -9.6 + by]], { rng: r, w: 1.1, a: 0.8 });
    const body = spl([[-3.8, -15.6], [3.8, -15.6], [5.4, -11], [6.6, -6.6], [2.2, -6], [-2.2, -6.2], [-6.6, -6.8], [-5.2, -11]].map((p) => [p[0], p[1] + by]), 4, true);
    fillBoard(ctx, body); rub(ctx, body, CW, 0.34);
    hatch(ctx, body, { rng: r, ang: 1.05, sp: 1.25, w: 0.42, a: 0.8, inset: 0.9 });
    stroke(ctx, body, { rng: r, closed: true, w: 0.95 });
    const hx2 = 5 + sw * 1.6, hy = -9.4 + by;
    stroke(ctx, [[3.2, -14 + by], [4.6 + sw * 0.6, -11.8 + by], [hx2, hy]], { rng: r, w: 1.15 }); dot(ctx, hx2, hy, 0.9, CW, 0.9);
    stroke(ctx, [[-4.2, -15.4 + by], [0, -14.6 + by], [4.2, -15.4 + by]], { rng: r, w: 1.9, c: CM, a: 0.95 });
    stroke(ctx, [[-2.2, -15 + by], [-5, -14.2 + by + sw * 0.36], [-7.6, -12.6 + by + sw * 0.9]], { rng: r, w: 1.6, c: CM, a: 0.95 });
    const hcx = 0.3, hcy = -21.6 + by;
    const head = ell(hcx, hcy, 7.9, 6.7, 34).map((p, i) => { const k = 1 + 0.035 * Math.cos(i * (TAU / 34) * 6); return [hcx + (p[0] - hcx) * k, hcy + (p[1] - hcy) * k]; });
    fillBoard(ctx, head); rub(ctx, head, CO, 0.72);
    ctx.save(); ctx.beginPath(); poly(ctx, head); ctx.clip();
    hatch(ctx, ell(hcx - 2.8, hcy + 2.8, 8, 6.4, 20), { rng: r, ang: -0.75, sp: 1.15, w: 0.5, c: CDO, a: 0.85 });
    hatch(ctx, ell(hcx + 3, hcy - 3.2, 3.6, 2.4, 16), { rng: r, ang: -0.75, sp: 1.0, w: 0.4, c: CY, a: 0.6 });
    ctx.restore();
    for (const s of [-1, 1]) stroke(ctx, spl([[hcx + s * 2.4, hcy - 6.2], [hcx + s * 4.3, hcy], [hcx + s * 2.4, hcy + 6.2]], 4), { rng: r, w: 0.6, c: CDO, a: 0.95, dbl: false });
    stroke(ctx, head, { rng: r, closed: true, w: 1.2, c: CO });
    stroke(ctx, [[hcx - 0.2, hcy - 6.4], [hcx - 0.6, hcy - 8.4], [hcx - 1.6, hcy - 9.2]], { rng: r, w: 1.5, c: CG });
    const fx = hcx + 1.4;
    for (const s of [-1, 1]) {
      const ex = fx + s * 2.7, ey = hcy - 1.2, tri = [[ex - 1.75, ey + 1.1], [ex + 1.75, ey + 1.1], [ex + 0.25, ey - 1.7]];
      fillBoard(ctx, tri); rub(ctx, tri, CY, 0.95); dot(ctx, ex + 0.1, ey + 0.2, 0.55, CW, 0.95);
    }
    const grin = [[-4.3, 1.6], [-2.7, 2.5], [-1.7, 1.8], [-0.1, 2.7], [1.5, 1.8], [2.6, 2.5], [4.2, 1.6], [3.3, 3.8], [1.6, 4.7], [0, 4.3], [-1.6, 4.7], [-3.3, 3.8]].map((p) => [fx + p[0], hcy + p[1]]);
    fillBoard(ctx, grin); rub(ctx, grin, CY, 0.95);
  }
  function jackGlow(ctx) { // warm orange rub *behind* the head (destination-over), never an additive glow
    ctx.globalCompositeOperation = 'destination-over';
    const g = ctx.createRadialGradient(0.3, -22, 3, 0.3, -22, 14);
    g.addColorStop(0, rgba(CO, 0.32)); g.addColorStop(0.55, rgba(CO, 0.12)); g.addColorStop(1, rgba(CO, 0));
    ctx.fillStyle = g; ctx.fillRect(-15, -37, 30, 30); ctx.globalCompositeOperation = 'source-over';
  }
  function drawCreeper(ctx, fr, r) { // small creature: cream root bulb, lavender cap hatching, mint leaves, yellow angry eyes
    const ph = fr / 4, sw = Math.sin(ph * TAU), bob = -Math.abs(Math.cos(ph * TAU)) * 0.9;
    for (const s of [-1, 1]) {
      const lift = Math.max(0, -sw * s) * 1.4, fx = s * 2.8 + sw * s * 1.6;
      stroke(ctx, [[s * 2.2, -5 + bob], [s * 2.6 + sw * s * 0.8, -2.4 - lift * 0.5], [fx, -lift]], { rng: r, w: 0.95, c: CC, a: 0.95 });
    }
    ctx.save(); ctx.translate(0, -12.5 + bob); ctx.rotate(sw * 0.09);
    const bulb = spl([[0, -7.4], [5.4, -5.8], [7.9, -1], [6.6, 3.8], [3, 6.8], [0, 8.4], [-3, 6.8], [-6.6, 3.8], [-7.9, -1], [-5.4, -5.8]], 4, true);
    fillBoard(ctx, bulb); rub(ctx, bulb, CC, 0.2);
    ctx.save(); ctx.beginPath(); poly(ctx, bulb); ctx.clip();
    const wave = [[-9, -10], [9, -10], [9, -0.4], [6, 0.4], [3, -0.6], [0, 0.4], [-3, -0.6], [-6, 0.4], [-9, -0.4]];
    rub(ctx, wave, CL, 0.6); hatch(ctx, wave, { rng: r, ang: -0.8, sp: 1.15, w: 0.45, c: CL, a: 0.95 });
    hatch(ctx, [[-9, 0], [9, 0], [9, 10], [-9, 10]], { rng: r, ang: 0.7, sp: 1.7, w: 0.4, a: 0.55, skip: 0.15 });
    ctx.restore();
    stroke(ctx, bulb, { rng: r, closed: true, w: 0.95 });
    leaf(ctx, r, -0.6, -6.6, -Math.PI / 2 - 0.6, 6.6, 1.9, CM); leaf(ctx, r, 0.6, -6.6, -Math.PI / 2 + 0.55, 6.4, 1.8, CG); leaf(ctx, r, 0, -7, -Math.PI / 2 + 0.05, 8.6, 2.1, CM);
    for (const s of [-1, 1]) {
      const ex = 1.4 + s * 2.5, ey = -1.8, e = ell(ex, ey, 1.55, 1.25, 14);
      fillBoard(ctx, e); rub(ctx, e, CY, 0.95); dot(ctx, ex + 0.45, ey + 0.15, 0.62, BOARD, 1);
      stroke(ctx, [[ex + s * 2, ey - 2.6], [ex - s * 1.4, ey - 1.5]], { rng: r, w: 0.75, dbl: false });
    }
    stroke(ctx, [[-0.6, 3.2], [0.4, 2.5], [1.4, 3.2], [2.4, 2.5], [3.2, 3.2]], { rng: r, w: 0.5, a: 0.95, dbl: false, step: 0.5 });
    ctx.restore();
  }
  function drawGhost(ctx, fr, r) { // floating creature: soft white rub, broken outline, blue frosty hem, board-coloured holes for eyes
    const w = Math.sin((fr / 4) * TAU);
    const body = spl([[-6.2, -14], [-5.4, -18.8], [-1.5, -21.4], [2.6, -21.2], [6, -18.2], [6.6, -13.5], [5.6, -8.5], [4.4, -4.2 + w * 0.6], [2.2, -1.4], [0.6, -3.6 - w * 0.4], [-1.6, -0.6 + w * 0.7], [-3.6, -3.2], [-6.8, -1.2 - w * 0.6], [-7.4, -5], [-6.8, -9.5]], 3, true);
    ctx.save(); ctx.beginPath(); poly(ctx, body); ctx.clip();
    const g = ctx.createRadialGradient(0.6, -14, 1.1, 0.6, -14, 11); g.addColorStop(0, rgba(CW, 0.8)); g.addColorStop(1, rgba(CW, 0.34));
    ctx.fillStyle = g; ctx.fillRect(-12, -25, 24, 26); ctx.restore();
    hatch(ctx, body, { rng: r, ang: 1.15, sp: 1.4, w: 0.4, a: 0.5, skip: 0.15 });
    const n = body.length;
    stroke(ctx, body.slice(Math.floor(n * 0.42), Math.floor(n * 0.93)), { rng: r, w: 0.8, c: CB, a: 0.75, dbl: false });
    stroke(ctx, body.slice(Math.floor(n * 0.95)).concat(body.slice(0, Math.floor(n * 0.55))), { rng: r, w: 0.85, a: 0.95 });
    stroke(ctx, spl([[5.4, -11.2], [8, -12.6 + w * 0.4], [10.3, -11.6 + w]], 4), { rng: r, w: 0.85, a: 0.8 });
    for (const s of [-1, 1]) { const e = ell(1.6 + s * 2.2, -15.2, 1.3, 1.9, 14); fillBoard(ctx, e); }
    fillBoard(ctx, ell(1.9, -10.3, 1.35, 2.2 + w * 0.3, 14));
  }
  function drawTree(ctx, r) { // prop: hatched trunk + bumpy crown filled with one long scribble
    const sides = [[[-6, 1], [-2.8, -2], [-2, -14], [-2.4, -27], [-5, -35]], [[6.5, 1], [3, -2], [2.3, -14], [2.6, -27], [5, -35]]];
    const trunk = spl(sides[0], 3).concat(spl(sides[1], 3).reverse());
    fillBoard(ctx, trunk); hatch(ctx, trunk, { rng: r, ang: 1.35, sp: 1.3, w: 0.42, a: 0.55 });
    for (const s of sides) stroke(ctx, spl(s, 4), { rng: r, w: 1.05 });
    const b = [];
    for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU, a2 = ((i + 0.5) / 11) * TAU, rr = 1 + R(-0.06, 0.1, r); b.push([Math.cos(a) * 21 * rr, -50 + Math.sin(a) * 16.5 * rr], [Math.cos(a2) * 18, -50 + Math.sin(a2) * 14.2]); }
    const crown = spl(b, 4, true);
    fillBoard(ctx, crown); rub(ctx, crown, CM, 0.14);
    ctx.save(); ctx.beginPath(); poly(ctx, crown); ctx.clip();
    const sc = []; let a = 0;
    for (let i = 0; i < 120; i++) { a += 0.95 + J(0.3, r); const rr = 0.25 + r.next() * 0.72; sc.push([Math.cos(a) * 21 * rr + J(2, r), -50 + Math.sin(a) * 16.5 * rr + J(2, r) + (i / 120 - 0.5) * 6]); }
    stroke(ctx, spl(sc, 3), { rng: r, w: 0.55, c: CG, a: 0.55, dbl: false, step: 0.9 });
    ctx.restore();
    stroke(ctx, crown, { rng: r, closed: true, w: 1.2, c: CM });
  }
  function drawSeed(ctx, r) { // projectile: cream seed + short broken white speed dashes behind it
    const p = spl([[-3.1, 0], [-0.6, 1.8], [3.1, 0], [-0.6, -1.8]], 5, true);
    fillBoard(ctx, p); rub(ctx, p, CC, 0.85); stroke(ctx, p, { rng: r, closed: true, w: 0.55, dbl: false, step: 0.6 });
    for (let k = -1; k <= 1; k++) for (let x = -4; x > -13; x -= 3) stroke(ctx, [[x, k * 0.9], [x - 1.8, k * (0.9 - x * 0.05)]], { rng: r, w: 0.45, a: 0.7 + x * 0.04, dbl: false, j: 0.05 });
  }
  function drawGem(ctx, r) {
    const p = [[0, -6.4], [2.2, -3.2], [0, 0], [-2.2, -3.2]];
    fillBoard(ctx, p); rub(ctx, p, CB, 0.6); hatch(ctx, p, { rng: r, ang: 0.9, sp: 0.8, w: 0.3, a: 0.7 });
    stroke(ctx, p, { rng: r, closed: true, w: 0.55, c: CB, dbl: false, step: 0.5 });
  }

  /* ---------- sprite bank: 4 walk frames × 3 "line boil" variants, baked once ---------- */
  let SPR = null;
  function buildSprites() {
    buildGrain();
    const v3 = (f) => [0, 1, 2].map(f);
    SPR = {
      jack: [0, 1, 2, 3].map((i) => v3((v) => mk(-12, -33, 12, 2, (c) => drawJack(c, i / 4, rng(100 + i * 7 + v * 31)), { halo: 1, post: jackGlow }))),
      creeper: [0, 1, 2, 3].map((i) => v3((v) => mk(-12, -31, 12, 2, (c) => drawCreeper(c, i, rng(300 + i * 13 + v * 41)), { halo: 0.9 }))),
      ghost: [0, 1, 2, 3].map((i) => [mk(-13, -24, 13, 1.5, (c) => drawGhost(c, i, rng(500 + i)), { halo: 0.8, haloA: 0.6 })]),
      tree: mk(-26, -72, 26, 3, (c) => drawTree(c, rng(800)), { halo: 0.9, haloA: 0.82 }),
      seed: mk(-14, -3, 4, 3, (c) => drawSeed(c, rng(400)), { halo: 0.6 }),
      gem: [0, 1].map((v) => mk(-3, -7, 3, 1, (c) => drawGem(c, rng(430 + v)), { halo: 0.6 })),
    };
  }
  const boil = (t, seed) => Math.floor(t * 7 + seed * 3) % 3; // redraw jitter at 7 fps
  function shadow(ctx, x, y, rx, ry) { ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, 'rgba(10,18,14,0.55)'); g.addColorStop(0.7, 'rgba(10,18,14,0.3)'); g.addColorStop(1, 'rgba(10,18,14,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore(); }

  /** Draws the main character with feet at (x, y). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) {
    if (!SPR) buildSprites();
    shadow(ctx, x, y + 0.5, 7, 2.2);
    const s = SPR.jack[Math.floor(t * 6) & 3][boil(t, 0.3)];
    ctx.save(); ctx.translate(x, y); ctx.scale(facing < 0 ? -1 : 1, 1); blit(ctx, s, 0, 0); ctx.restore();
  }
  /** Draws a typical creature with feet at (x, y). */
  function drawEnemy(ctx, x, y, t, type, seed) {
    if (!SPR) buildSprites();
    seed = seed || 0;
    if (type === 'ghost') { shadow(ctx, x, y, 4.6, 1.4); ctx.globalAlpha = 0.9; blit(ctx, SPR.ghost[Math.floor(t * 5 + seed * 9) & 3][0], x, y - 2.2 - Math.sin(t * 3.1 + seed * 20) * 1.1); ctx.globalAlpha = 1; return; }
    shadow(ctx, x, y + 0.5, 7.5, 2.3);
    blit(ctx, SPR.creeper[Math.floor(t * 5 + seed * 4) & 3][boil(t, seed)], x, y);
  }

  /* ---------- ground: pre-baked chalk textures composited per pixel against signed-distance region edges ---------- */
  /** Tileable n² texture: the same seeded paint() runs at 9 offsets so strokes wrap across the edges. */
  function texture(n, seed, paint) {
    const { c, ctx } = canvas(n, n, true); ctx.lineCap = 'round';
    for (let oy = -n; oy <= n; oy += n) for (let ox = -n; ox <= n; ox += n) { ctx.setTransform(1, 0, 0, 1, ox, oy); paint(ctx, rng(seed)); }
    return ctx.getImageData(0, 0, n, n).data;
  }
  function bakeGround(w, h, s) {
    const TN = 512, u = s, area = (TN / u) * (TN / u);
    const MEADOW = texture(TN, 101, (c, r) => { // short 3–4 stroke grass tufts, mostly mint
      for (let i = 0, n = Math.round(area / 46); i < n; i++) {
        const x = r.next() * TN, y = r.next() * TN, pk = r.next(), col = pk < 0.6 ? CM : pk < 0.86 ? CG : pk < 0.95 ? CY : CW;
        const ang = -Math.PI / 2 + R(-0.45, 0.45, r), dx = Math.cos(ang), dy = Math.sin(ang);
        c.beginPath();
        for (let k = 0, cnt = 3 + ((r.next() * 2) | 0); k < cnt; k++) { const L = R(2.4, 4.4, r) * u, o = k * R(0.95, 1.25, r) * u, sx = x - dy * o, sy = y + dx * o + J(0.5 * u, r); c.moveTo(sx, sy); c.lineTo(sx + dx * L, sy + dy * L); }
        c.lineWidth = 0.55 * u; c.strokeStyle = rgba(col, R(0.5, 0.88, r)); c.stroke();
      }
    });
    const lines = (c, r, m, spU, cols, segA, segB, gapA, gapB, wU) => { // broken parallel chalk lines y = c0 + m·x
      const dd = spU * u * Math.sqrt(1 + m * m), kx = 1 / Math.sqrt(1 + m * m);
      for (let c0 = -TN * Math.abs(m); c0 < TN; c0 += dd) for (let x = -r.next() * segB * u; x < TN; ) {
        const L = R(segA, segB, r) * u * kx, y0 = c0 + m * x + J(0.25 * u, r);
        c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + L / 2, y0 + m * L / 2 + J(0.3 * u, r), x + L, y0 + m * L);
        c.lineWidth = wU * u * R(0.75, 1.2, r); c.strokeStyle = rgba(cols[(r.next() * cols.length) | 0], R(0.45, 0.9, r)); c.stroke();
        x += L + R(gapA, gapB, r) * u * kx;
      }
    };
    const FOREST = texture(TN, 301, (c, r) => { lines(c, r, 1, 3.6, [CL, CL, CL, CP], 2, 9, 1.2, 4.5, 0.55); lines(c, r, -1, 4.2, [CL, CL, CW], 2, 7, 1.6, 5.5, 0.5); });
    const FIELD = texture(TN, 201, (c, r) => lines(c, r, 0.5, 2.6, [CO, CO, CO, CY], 4, 14, 0.6, 2.6, 0.6));
    // macro fields on a coarse grid (every 4 px), signed distances in world units via value / |gradient|
    const G = 4, gw = Math.ceil(w / G) + 2, gh = Math.ceil(h / G) + 2, A = new Float32Array(gw * gh), H = new Float32Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const X = (i * G - w / 2) / s, Y = (j * G - h / 2) / s;
      A[j * gw + i] = fbm(X / 300 + 3.1, Y / 300 + 1.7, 11, 3) + sm(10, 170, Y) * -0.33 + sm(-170, -320, X) * sm(-20, -140, Y) * 0.28 - sm(-150, 0, X) * 0.06;
      H[j * gw + i] = fbm(X / 180, Y / 180, 53, 2);
    }
    const TH1 = 0.40, TH2 = 0.66, LW = 0.5;
    const img = new ImageData(w, h), d = img.data;
    for (let py = 0; py < h; py++) {
      const gy = py / G, j0 = gy | 0, fy = gy - j0;
      for (let px = 0; px < w; px++) {
        const gx = px / G, i0 = gx | 0, fx = gx - i0, q = j0 * gw + i0;
        const a = (A[q] * (1 - fx) + A[q + 1] * fx) * (1 - fy) + (A[q + gw] * (1 - fx) + A[q + gw + 1] * fx) * fy;
        const gA = Math.hypot(A[q + 1] - A[q], A[q + gw] - A[q]) * s / G + 1e-7;
        const hh = (H[q] * (1 - fx) + H[q + 1] * fx) * (1 - fy) + (H[q + gw] * (1 - fx) + H[q + gw + 1] * fx) * fy;
        const gm = 0.86 + 0.14 * hash2(px, py, 5) - (hash2(px >> 1, py >> 1, 6) < 0.13 ? 0.36 : 0);
        const wob = perlin(px / s / 11, py / s / 11, 59) * 0.45;
        const d1 = (a - TH1) / gA + wob, d2 = (a - TH2) / gA + wob, near = Math.min(Math.abs(d1), Math.abs(d2));
        const hz = (hh - 0.5) * 22 + (perlin(px / s / 40, py / s / 40, 7) * 7);
        let br = BOARD[0] + hz * 0.9, bg = BOARD[1] + hz, bb = BOARD[2] + hz * 0.95;
        const tex = d1 < 0 ? FOREST : d2 > 0 ? FIELD : MEADOW, rc = d1 < 0 ? CL : d2 > 0 ? CO : CM, dk = d1 < 0 ? 0.07 : 0.05;
        const fade = Math.max(0, Math.min(1, (near - LW - 0.9) * 0.6));
        br += (rc[0] - br) * dk * fade; bg += (rc[1] - bg) * dk * fade; bb += (rc[2] - bb) * dk * fade;
        const t4 = (((py & 511) << 9) + (px & 511)) * 4, ta = tex[t4 + 3] / 255 * (0.32 + 0.68 * sm(0.28, 0.72, hh)) * fade * gm;
        br += (tex[t4] - br) * ta; bg += (tex[t4 + 1] - bg) * ta; bb += (tex[t4 + 2] - bb) * ta;
        const lv = Math.max(0, Math.min(1, (LW - near) * s + 0.5)) * 0.8 * (0.3 + 0.7 * gm);
        const o = (py * w + px) * 4;
        d[o] = br + (CW[0] - br) * lv; d[o + 1] = bg + (CW[1] - bg) * lv; d[o + 2] = bb + (CW[2] - bb) * lv; d[o + 3] = 255;
      }
    }
    const C = canvas(w, h); C.ctx.putImageData(img, 0, 0);
    const g = C.ctx; g.setTransform(s, 0, 0, s, w / 2, h / 2); g.lineCap = 'round'; g.lineJoin = 'round';
    const r = rng(717); // faint doodles + an old eraser swipe, part of the baked board
    for (const [x, y, k] of [[-150, -95, 0], [170, -120, 1], [-40, -140, 2], [225, 60, 0], [-245, 110, 1]]) {
      g.globalAlpha = 0.6;
      if (k === 0) { const p = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, rr = i & 1 ? 1.35 : 3.2; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } rub(g, p, CY, 0.22); stroke(g, p, { rng: r, closed: true, w: 0.55, c: CY, step: 0.7 }); }
      else if (k === 1) { const p = []; for (let i = 0; i < 40; i++) { const a = i * 0.42, rr = 0.15 + i * 0.09; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } stroke(g, p, { rng: r, w: 0.5, c: CL }); }
      else { const p = []; for (let i = 0; i < 28; i++) { const t = (i / 28) * TAU; p.push([x + 3 * Math.pow(Math.sin(t), 3), y - 0.19 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } stroke(g, p, { rng: r, closed: true, w: 0.55, c: CP }); }
    }
    g.globalAlpha = 1;
    for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(-60, 260, 210 + k * 3, -1.9, -1.1); g.lineWidth = 20 * (0.55 + 0.25 * k); g.strokeStyle = 'rgba(205,222,212,0.026)'; g.stroke(); }
    return C.c;
  }

  /* ---------- screen frame: vignette + wooden board frame + chalk sticks on the ledge ---------- */
  function bakeFrame(w, h) {
    const { c, ctx } = canvas(w, h), r = rng(4711), t = Math.max(8, Math.round(h * 0.013)), tb = Math.round(t * 1.8), vh = h * 0.1, vw = w * 0.07;
    const lin = (x0, y0, x1, y1, rx, ry, rw, rh) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(6,12,9,0.5)'); g.addColorStop(0.45, 'rgba(6,12,9,0.18)'); g.addColorStop(1, 'rgba(6,12,9,0)'); ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh); };
    lin(0, 0, 0, vh, 0, 0, w, vh); lin(0, h, 0, h - vh, 0, h - vh, w, vh); lin(0, 0, vw, 0, 0, 0, vw, h); lin(w, 0, w - vw, 0, w - vw, 0, vw, h);
    for (let i = 0; i < 500; i++) { ctx.fillStyle = 'rgba(230,234,226,' + R(0.05, 0.16, r).toFixed(3) + ')'; ctx.fillRect(r.next() * w, h - tb - Math.pow(r.next(), 2) * vh, 1.6, 1.6); }
    const wood = (x, y, ww, hh, horiz) => {
      const g = horiz ? ctx.createLinearGradient(0, y, 0, y + hh) : ctx.createLinearGradient(x, 0, x + ww, 0);
      g.addColorStop(0, '#7a5232'); g.addColorStop(0.5, PALETTE.wood); g.addColorStop(1, PALETTE.woodDark); ctx.fillStyle = g; ctx.fillRect(x, y, ww, hh);
    };
    wood(0, 0, w, t, true); wood(0, h - tb, w, tb, true); wood(0, 0, t, h, false); wood(w - t, 0, t, h, false);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(t, t, w - 2 * t, 2); ctx.fillRect(t, t, 2, h - t - tb); ctx.fillRect(w - t - 2, t, 2, h - t - tb);
    ctx.fillStyle = 'rgba(255,220,170,0.25)'; ctx.fillRect(0, h - tb, w, 2);
    const u = t / 10;
    [[0, 46, CW], [56, 28, CP], [92, 36, CY]].forEach(([dx, L, col]) => { ctx.fillStyle = rgba(col, 1); ctx.fillRect(w * 0.06 + dx * u, h - tb + 1 - t * 0.55, L * u, t * 0.55); });
    [[0, 22, CM], [30, 30, CO]].forEach(([dx, L, col]) => { ctx.fillStyle = rgba(col, 1); ctx.fillRect(w * 0.84 + dx * u, h - tb + 1 - t * 0.55, L * u, t * 0.55); });
    return c;
  }
  /** Chalk HUD bar: wobbly white outline + diagonal hatched fill (like the CSS repeating-linear-gradient). */
  function hudBar(ctx, x, y, w, h, frac, col, col2, r) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w * frac, h); ctx.clip();
    for (let k = -h; k < w * frac + h; k += 7) { ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h * 0.62, y); ctx.lineWidth = 3.2; ctx.strokeStyle = col; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + k + 3.5, y + h); ctx.lineTo(x + k + 3.5 + h * 0.62, y); ctx.strokeStyle = col2; ctx.stroke(); }
    ctx.restore();
    stroke(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { rng: r, closed: true, w: 2.4, a: 0.92, step: 6, j: 0.6 });
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, main character, creatures, effects. */
  let CACHE = null;
  function draw(ctx, w, h, t) {
    const s = h / 360;
    if (!CACHE || CACHE.w !== w || CACHE.h !== h) {
      K = Math.max(1, Math.round(s * 4) / 4); SPR = null; buildSprites();
      CACHE = { w, h, ground: bakeGround(w, h, s), frame: bakeFrame(w, h) };
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(CACHE.ground, 0, 0);
    ctx.setTransform(s, 0, 0, s, w / 2, h / 2);
    const list = [
      { y: 70, f: () => { shadow(ctx, -215, 70, 16, 4); blit(ctx, SPR.tree, -215, 70); } },
      { y: -40, f: () => { shadow(ctx, 230, -40, 16, 4); blit(ctx, SPR.tree, 230, -40); } },
      { y: 10, f: () => drawHero(ctx, -40, 10, t, 1) },
    ];
    [[60, 2, 0.1], [105, -30, 0.5], [130, 40, 0.8], [-150, -70, 0.3], [40, 105, 0.6]].forEach(([x, y, sd]) => list.push({ y, f: () => drawEnemy(ctx, x + Math.sin(t * 0.8 + sd * 6) * 3, y, t, 'creeper', sd) }));
    [[-110, 80, 0.2], [180, 95, 0.7]].forEach(([x, y, sd]) => list.push({ y, f: () => drawEnemy(ctx, x, y, t, 'ghost', sd) }));
    list.sort((a, b) => a.y - b.y).forEach((o) => o.f());
    for (const [x, y, v] of [[20, 30, 0], [30, 22, 1], [-10, 42, 0], [85, 52, 1]]) blit(ctx, SPR.gem[(Math.floor(t * 5) + v) & 1], x, y - 0.5 + Math.sin(t * 3 + x) * 0.7);
    const px = -20 + ((t * 120) % 60); // seed projectile flying right with its dash trail
    blit(ctx, SPR.seed, px, -2);
    // floating number: Cabin Sketch, yellow + thick dark board-coloured outline, slight tilt
    ctx.save(); ctx.translate(60, -40 - (t % 1) * 6); ctx.rotate(-0.06); ctx.font = '700 13px "Cabin Sketch", "Comic Sans MS", cursive'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.lineWidth = 3.9; ctx.strokeStyle = 'rgba(30,42,37,0.88)'; ctx.strokeText('34', 0, 0); ctx.fillStyle = rgba(CY, 1); ctx.fillText('34', 0, 0);
    ctx.beginPath(); ctx.moveTo(-8, 2.4); ctx.quadraticCurveTo(0, 4.2, 8, 1.6); ctx.lineWidth = 1.3; ctx.strokeStyle = rgba(CO, 1); ctx.stroke(); ctx.restore();
    // HUD + frame (screen space)
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(CACHE.frame, 0, 0);
    const r = rng(900 + boil(t, 0)), m = Math.round(h * 0.035);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    hudBar(ctx, m, m, w - m * 2, h * 0.022, 0.74, 'rgba(152,222,178,.95)', 'rgba(152,222,178,.3)', r);
    hudBar(ctx, m * 1.9, m * 2.2, w * 0.15, h * 0.026, 1, 'rgba(247,168,198,.95)', 'rgba(247,156,82,.45)', r);
    ctx.font = '700 ' + Math.round(h * 0.03) + 'px "Cabin Sketch", "Comic Sans MS", cursive'; ctx.fillStyle = PALETTE.white; ctx.textBaseline = 'middle';
    ctx.fillText('100/100', m * 2.3 + w * 0.15, m * 2.2 + h * 0.013);
    ctx.font = '700 ' + Math.round(h * 0.045) + 'px "Cabin Sketch", "Comic Sans MS", cursive'; ctx.textAlign = 'center'; ctx.fillText('22:09', w / 2, m * 3.2);
    ctx.font = Math.round(h * 0.022) + 'px "Architects Daughter", cursive'; ctx.fillStyle = PALETTE.orange; ctx.fillText('title text', w / 2, m * 4.3);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  const Starter = { id: 'chalk', name: 'Chalkboard', palette: PALETTE, fonts: ['Cabin Sketch:wght@400;700', 'Fredericka the Great', 'Rock Salt', 'Architects Daughter'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['chalk'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
