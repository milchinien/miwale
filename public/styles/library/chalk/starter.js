/* Chalkboard — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Every form is built like a real chalk drawing: board fill, a side-of-the-chalk fill heavier in the light
   (upper left), cool hatching in the shadow, a warm stroke in the light and a tip outline pressed harder on
   the shadow side. A clustered board-tooth mask is punched out of every sprite and a solid board-coloured
   halo is baked behind it. Figures are posed with parameters (8-pose walk), baked in redrawn variants and
   held for 2–3 ticks of a 12 fps clock per actor; creatures are wiped off by a felt eraser. */
(function (root) {
  'use strict';
  const PALETTE = {
    board: '#25332d', boardDeep: '#1c2823', white: '#eeeee5', orange: '#f89c52', deepOrange: '#de6c34',
    lavender: '#c2acec', violet: '#9680ce', mint: '#98deb2', leaf: '#70bc7e', yellow: '#f9e58c', pink: '#f7a8c6',
    blue: '#9eccf0', cream: '#f4e8ce', eraser: '#b08058', wood: '#93663f', woodDark: '#5c3b22',
  };
  const TAU = Math.PI * 2;
  const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const BOARD = hx(PALETTE.board), CW = hx(PALETTE.white), CO = hx(PALETTE.orange), CDO = hx(PALETTE.deepOrange), CL = hx(PALETTE.lavender);
  const CV = hx(PALETTE.violet), CM = hx(PALETTE.mint), CG = hx(PALETTE.leaf), CY = hx(PALETTE.yellow), CP = hx(PALETTE.pink), CB = hx(PALETTE.blue), CC = hx(PALETTE.cream);
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const cBoard = rgba(BOARD, 1);

  /* ---------- deterministic randomness + noise ---------- */
  function rng(seed) { let a = seed >>> 0; return { next() { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }; }
  function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function perlin(x, y, s, p) { // p > 0: periodic on that lattice period (tileable)
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, f = (t) => t * t * t * (t * (t * 6 - 15) + 10), u = f(fx), v = f(fy);
    const g = (ix, iy, dx, dy) => { if (p) { ix = ((ix % p) + p) % p; iy = ((iy % p) + p) % p; } const a = hash2(ix, iy, s) * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
    const a = g(x0, y0, fx, fy) + u * (g(x0 + 1, y0, fx - 1, fy) - g(x0, y0, fx, fy));
    const b = g(x0, y0 + 1, fx, fy - 1) + u * (g(x0 + 1, y0 + 1, fx - 1, fy - 1) - g(x0, y0 + 1, fx, fy - 1));
    return (a + v * (b - a)) * 1.414;
  }
  function fbm(x, y, s, oct) { let a = 1, f = 1, t = 0, n = 0; for (let i = 0; i < oct; i++) { t += a * perlin(x * f, y * f, s + i * 101); n += a; a *= 0.5; f *= 2; } return t / n * 0.5 + 0.5; }
  const R = (a, b, r) => a + (b - a) * r.next(), J = (s, r) => (r.next() - 0.5) * 2 * s;
  const sm = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  const canvas = (w, h, cpu) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return { c, ctx: c.getContext('2d', cpu ? { willReadFrequently: true } : undefined) }; };

  /* ---------- geometry ---------- */
  function ell(cx, cy, rx, ry, n) { const o = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
  function spl(pts, sub, closed) { // Catmull-Rom
    const out = [], n = pts.length, P = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let s = 0; s < sub; s++) { const t = s / sub, t2 = t * t, t3 = t2 * t, c = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3); out.push([c(0), c(1)]); }
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }
  function poly(ctx, p) { ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
  function bbox(p) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of p) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2 }; }
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
    return out;
  }
  function ik(hx0, hy0, fx, fy, L1, L2, bend) { // two-bone IK: knee for a limb from hip to foot
    let dx = fx - hx0, dy = fy - hy0, d = Math.hypot(dx, dy); const md = L1 + L2 - 0.02;
    if (d > md) { dx *= md / d; dy *= md / d; d = md; }
    const a = Math.atan2(dy, dx), t = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d + 1e-6)))), ka = a - bend * t;
    return { kx: hx0 + Math.cos(ka) * L1, ky: hy0 + Math.sin(ka) * L1, fx: hx0 + dx, fy: hy0 + dy };
  }

  /* ---------- chalk toolkit (ported from the reference module) ---------- */
  /** Tip of the chalk: resample every 1 unit, jitter ±0.12, runs of 3–7 points with their own pressure, overshoot, lighter double pass. */
  function stroke(ctx, pts, o) {
    const r = o.rng, w = o.w || 1, a = o.a === undefined ? 1 : o.a, c = o.c || CW, j = o.j === undefined ? 0.12 : o.j;
    const P = resample(pts, !!o.closed, o.step || 1.0);
    if (o.closed && P.length > 5) { const ov = 1 + ((r.next() * 3) | 0); for (let i = 1; i <= ov; i++) P.push(P[i].slice()); }
    for (const p of P) { p[0] += J(j, r); p[1] += J(j, r); }
    if (P.length < 2) return;
    for (let i = 0; i < P.length - 1;) {
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
  /** Side of the chalk: broken parallel dashes at -0.42 rad, a slow pressure wave, gaps, alpha falling towards the lower right. */
  function side(ctx, pts, o) {
    const r = o.rng, c = o.c || CW, a = o.a === undefined ? 0.6 : o.a, ang = o.ang === undefined ? -0.42 : o.ang, sp = o.sp || 0.46, gap = o.gap === undefined ? 0.3 : o.gap, lit = o.lit === undefined ? 1 : o.lit;
    const b = bbox(pts), Rr = Math.hypot(b.rx, b.ry) + 1, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, ph = r.next() * 6;
    ctx.save(); ctx.beginPath(); poly(ctx, pts); ctx.clip();
    for (let off = -Rr; off <= Rr; off += sp * (0.8 + r.next() * 0.4)) {
      const press = 0.62 + 0.38 * Math.sin(off * 0.85 + ph) * Math.sin(off * 0.31 + ph * 2);
      for (let s = -Rr - r.next() * 2; s < Rr;) {
        const L = R(1.1, 4.6, r);
        if (r.next() > gap) {
          const mx = nx * off + dx * (s + L / 2), my = ny * off + dy * (s + L / 2), l = (-mx * 0.6 - my * 0.8) / (Math.max(b.rx, b.ry) + 0.01);
          const k = Math.max(0, Math.min(1, 0.75 + 0.5 * l * lit));
          ctx.beginPath(); ctx.moveTo(b.cx + nx * off + dx * s, b.cy + ny * off + dy * s); ctx.lineTo(b.cx + nx * off + dx * (s + L), b.cy + ny * off + dy * (s + L));
          ctx.lineWidth = 0.56 * R(0.8, 1.35, r); ctx.strokeStyle = rgba(c, a * press * R(0.55, 1, r) * k); ctx.stroke();
        }
        s += L + R(0.15, 1.3, r);
      }
    }
    ctx.restore();
  }
  /** Loose, slightly bent parallel hatching clipped to a polygon. */
  function hatch(ctx, pts, o) {
    const r = o.rng, ang = o.ang === undefined ? 0.82 : o.ang, sp = o.sp || 1.05, w = o.w || 0.36, c = o.c || CV, a = o.a === undefined ? 0.8 : o.a;
    const b = bbox(pts), Rr = Math.hypot(b.rx, b.ry) + 1, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    ctx.save(); ctx.beginPath(); poly(ctx, pts); ctx.clip();
    for (let off = -Rr; off <= Rr; off += sp * (0.75 + r.next() * 0.5)) {
      const s0 = -Rr * R(0.55, 1.15, r), s1 = Rr * R(0.55, 1.15, r), bx = b.cx + nx * off, by = b.cy + ny * off, bend = J(0.5, r);
      ctx.beginPath(); ctx.moveTo(bx + dx * s0, by + dy * s0); ctx.quadraticCurveTo(bx + nx * bend, by + ny * bend, bx + dx * s1, by + dy * s1);
      ctx.lineWidth = w * R(0.7, 1.3, r); ctx.strokeStyle = rgba(c, a * R(0.55, 1, r)); ctx.stroke();
    }
    ctx.restore();
  }
  const rub = (ctx, p, c, a) => { ctx.beginPath(); poly(ctx, p); ctx.fillStyle = rgba(c, a); ctx.fill(); };
  const dot = (ctx, x, y, rr, c, a) => { ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fillStyle = rgba(c, a); ctx.fill(); };
  const fillBoard = (ctx, p) => { ctx.beginPath(); poly(ctx, p); ctx.fillStyle = cBoard; ctx.fill(); };
  /** Closed outline, with an extra pass where the edge faces the lower right (the shadow side is pressed harder). */
  function outline(ctx, pts, r, c, w) {
    stroke(ctx, pts, { rng: r, closed: true, w, c });
    const b = bbox(pts), run = [];
    for (let i = 0; i <= pts.length; i++) {
      const p = pts[i % pts.length], k = ((p[0] - b.cx) * 0.55 + (p[1] - b.cy) * 0.85) / (Math.max(b.rx, b.ry) + 0.01);
      if (k > 0.28) run.push([p[0] + 0.18, p[1] + 0.22]); else if (run.length) { if (run.length > 2) stroke(ctx, run.slice(), { rng: r, w: w * 0.75, c, a: 0.9, dbl: false }); run.length = 0; }
    }
    if (run.length > 2) stroke(ctx, run, { rng: r, w: w * 0.75, c, a: 0.9, dbl: false });
  }
  /** The recipe for every form: board fill → rub → side fill (lit) → cool hatch on the shadow side → warm light patch → weighted outline. */
  function form(ctx, pts, o) {
    const r = o.rng, b = bbox(pts);
    fillBoard(ctx, pts); rub(ctx, pts, o.c, o.rubA || 0.16);
    side(ctx, pts, { rng: r, c: o.c, a: o.a || 0.64, lit: o.lit === undefined ? 1 : o.lit });
    ctx.save(); ctx.beginPath(); poly(ctx, pts); ctx.clip();
    if (o.sh) hatch(ctx, ell(b.cx + b.rx * 0.62, b.cy + b.ry * 0.7, b.rx * 1.05, b.ry * 0.95, 20), { rng: r, c: o.sh, a: o.shA || 0.8 });
    if (o.hi) side(ctx, ell(b.cx - b.rx * 0.38, b.cy - b.ry * 0.5, b.rx * 0.5, b.ry * 0.34, 16), { rng: r, c: o.hi, a: 0.7, gap: 0.2 });
    ctx.restore();
    if (o.line) outline(ctx, pts, r, o.line, o.lw || 0.9);
  }
  function leaf(ctx, r, bx, by, ang, len, wid, col) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
    const p = spl([[bx, by], [mx + nx * wid, my + ny * wid], [bx + dx * len, by + dy * len], [mx - nx * wid, my - ny * wid]], 4, true);
    fillBoard(ctx, p); rub(ctx, p, col, 0.42); hatch(ctx, p, { rng: r, ang: ang + 1.1, sp: 1.1, c: col, a: 0.6 }); stroke(ctx, p, { rng: r, closed: true, w: 0.7, c: col, a: 0.95 });
  }

  /* ---------- board tooth + sprite bake with a solid board halo ---------- */
  let GRAIN = null, K = 1.5, seedN = 1;
  function buildGrain() { // clustered pores (two octaves of periodic noise), 5% single deep pores, short drag streaks
    const N = 128, G = canvas(N, N), im = G.ctx.createImageData(N, N), d = im.data;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const n = perlin(x / 8, y / 8, 71, 16) * 0.62 + perlin(x / 3.2, y / 3.2, 72, 40) * 0.38, h = hash2(x, y, 77);
      d[(y * N + x) * 4 + 3] = Math.min(255, Math.max(sm(0.18, 0.5, n) * 215, h < 0.05 ? 150 + h * 1800 : h * 26));
    }
    G.ctx.putImageData(im, 0, 0);
    const r = rng(78); G.ctx.lineCap = 'round';
    for (let i = 0; i < 90; i++) { const x = r.next() * N, y = r.next() * N, L = R(2, 6, r), a = -0.38 + J(0.12, r); G.ctx.beginPath(); G.ctx.moveTo(x, y); G.ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); G.ctx.lineWidth = R(0.7, 1.3, r); G.ctx.strokeStyle = 'rgba(0,0,0,' + R(0.35, 0.8, r).toFixed(2) + ')'; G.ctx.stroke(); }
    GRAIN = G.c;
  }
  function applyGrain(ctx, w, h, k, seed) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = k;
    const ox = (seed * 37) & 127, oy = (seed * 91) & 127;
    ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, w + ox, h + oy); ctx.restore();
  }
  /** Bakes world box [x0,x1]×[y0,y1] (feet = 0,0) at K px/unit: draw → tooth → solid halo (faint rubs cast none) → flash copy. */
  function mk(x0, y0, x1, y1, draw, opt) {
    opt = opt || {};
    const pad = 2, ax = Math.round((pad - x0) * K), ay = Math.round((pad - y0) * K), w = Math.ceil((x1 - x0 + pad * 2) * K), h = Math.ceil((y1 - y0 + pad * 2) * K);
    const A = canvas(w, h, true), a = A.ctx;
    a.setTransform(K, 0, 0, K, ax, ay); a.lineCap = 'round'; a.lineJoin = 'round';
    draw(a);
    applyGrain(a, w, h, opt.grain || 0.9, seedN++);
    const out = { c: A.c, ch: A.c, ax, ay, w, h };
    if (opt.halo !== 0) {
      const src = a.getImageData(0, 0, w, h).data, M = canvas(w, h), mi = M.ctx.createImageData(w, h), md = mi.data;
      for (let i = 0; i < src.length; i += 4) { const al = src[i + 3]; md[i] = BOARD[0]; md[i + 1] = BOARD[1]; md[i + 2] = BOARD[2]; md[i + 3] = al > 70 ? 255 : al > 28 ? (al - 28) * 6 : 0; }
      M.ctx.putImageData(mi, 0, 0);
      const D = canvas(w, h), rr = (opt.halo || 1) * K;
      for (let k = 0; k < 10; k++) { const an = (k / 10) * TAU + 0.3; D.ctx.drawImage(M.c, Math.cos(an) * rr, Math.sin(an) * rr); D.ctx.drawImage(M.c, Math.cos(an) * rr * 0.5, Math.sin(an) * rr * 0.5); }
      const O = canvas(w, h);
      O.ctx.globalAlpha = opt.haloA || 0.88; O.ctx.drawImage(D.c, 0, 0); O.ctx.globalAlpha = 1; O.ctx.drawImage(A.c, 0, 0);
      out.c = O.c;
    }
    return out;
  }
  function blit(ctx, s, x, y, img) { const k = 1 / K, c = img || s.c; ctx.drawImage(c, x - s.ax * k, y - s.ay * k, c.width * k, c.height * k); }

  /* ---------- the main character: posed with parameters, drawn facing right, feet at (0,0), ~18 × 31 units ---------- */
  const WALK_FOOT = [[3.0, 0], [1.7, 0], [0.2, 0], [-1.7, 0.1], [-3.0, 0.6], [-1.4, 2.0], [0.7, 2.5], [2.5, 1.2]];
  const WALK_BY = [0.15, 0.95, -0.2, -0.95]; // contact, down, passing, up
  function walkPose(i) {
    const A = WALK_FOOT[i], B = WALK_FOOT[(i + 4) % 8], ph = i / 8;
    return { by: WALK_BY[i % 4], lean: 0.07, near: A, far: B, armN: -A[0] * 0.19, armF: -B[0] * 0.19, hy: WALK_BY[(i + 3) % 4] * 0.85, // head one pose late
      scarf: 0.3 * Math.sin(TAU * ph * 2 - 1.4), hem: 0.8 * Math.sin(TAU * ph * 2 - 1.1), eyes: 1 };
  }
  const idlePose = (k, eyes) => ({ by: [0, -0.32, -0.55][k], lean: 0.02, near: [1.5, 0], far: [-1.3, 0], armN: 0.1 - k * 0.03, armF: -0.08 + k * 0.03, hy: [0.05, -0.2, -0.6][k], scarf: [0, 0.12, 0.07][k], hem: [0, 0.22, 0.1][k], eyes });
  function drawJack(ctx, P, r) {
    const by = P.by, hip = -7.3 + by, hcx = 0.6 + Math.sin(P.lean) * 14, hcy = -22.6 + P.hy;
    for (const [rr, a] of [[12.5, 0.035], [10.5, 0.045], [8.8, 0.05]]) rub(ctx, ell(hcx, hcy, rr, rr * 0.92, 24), CO, a); // lantern-light rub (casts no halo)
    for (const [f, far, x] of [[P.far, true, -0.6], [P.near, false, 0.7]]) {
      const L = ik(x, hip, f[0], -f[1], 4.1, 3.9, 1);
      stroke(ctx, [[x, hip], [L.kx, L.ky], [L.fx, L.fy]], { rng: r, w: far ? 1.25 : 1.45, c: far ? CL : CW, a: far ? 0.8 : 1 });
      form(ctx, spl([[L.fx - 1.1, L.fy + 0.1], [L.fx + 2.3, L.fy + 0.2], [L.fx + 2.5, L.fy - 0.9], [L.fx + 1, L.fy - 1.6], [L.fx - 0.9, L.fy - 1.8]], 3, true), { rng: r, c: far ? CV : CL, a: 0.75, line: far ? CL : CW, lw: 0.7, lit: 0 });
    }
    const arm = (sx, sy, ang, far) => { const L = ik(sx, sy, sx + Math.sin(ang) * 5.6, sy + Math.cos(ang) * 5.6, 3, 3, -1); stroke(ctx, [[sx, sy], [L.kx, L.ky], [L.fx, L.fy]], { rng: r, w: far ? 1.05 : 1.3, c: far ? CL : CW, a: far ? 0.75 : 1 }); dot(ctx, L.fx, L.fy, 1, CC, 0.85); };
    ctx.save(); ctx.translate(0, hip); ctx.rotate(P.lean); ctx.translate(0, -hip);
    arm(-1.3, -14.3 + by, P.armF, true);
    for (const [len, k] of [[7.6, 0], [5.4, 1.7]]) { // scarf tails stream behind and lag
      const pts = [[-2.2, -15 + by]]; let a = Math.PI - 0.6 + P.scarf + k * 0.2;
      for (let j = 1; j <= 4; j++) { a += P.scarf * 0.22 + 0.13 * Math.sin(j * 1.6 + k); const p = pts[j - 1]; pts.push([p[0] + Math.cos(a) * len / 4, p[1] + Math.sin(a) * len / 4]); }
      stroke(ctx, spl(pts, 3), { rng: r, w: 1.9 - k * 0.15, c: CM }); stroke(ctx, [[pts[2][0] - 0.8, pts[2][1] - 0.6], [pts[2][0] + 0.6, pts[2][1] + 0.9]], { rng: r, w: 0.55, c: CP, dbl: false });
    }
    const h = P.hem, cloak = spl([[-3.1, -15.7], [3, -15.7], [4.6, -13.4], [5.8 - h * 0.2, -9.4], [6.6 - h * 0.35, -5.9], [4.6 - h * 0.45, -4.6], [3.2 - h * 0.5, -6], [1 - h * 0.6, -4.5], [-1 - h * 0.7, -5.9], [-3.4 - h * 0.8, -4.4], [-4.8 - h * 0.9, -5.8], [-6.8 - h, -5.1], [-5.6 - h * 0.6, -9.4], [-4.5, -13.2]].map((p) => [p[0], p[1] + by]), 3, true);
    form(ctx, cloak, { rng: r, c: CW, a: 0.64, sh: CL, shA: 0.85, hi: CC, line: CW, lw: 0.95, lit: 0.8 });
    dot(ctx, 1.4, -12.4 + by, 0.55, CY, 0.95); dot(ctx, 1.6, -10 + by, 0.5, CY, 0.9);
    arm(1.9, -14 + by, P.armN, false);
    stroke(ctx, spl([[-3.8, -15.4 + by], [0, -14.4 + by], [3.9, -15.3 + by]], 3), { rng: r, w: 2.3, c: CM });
    ctx.restore();
    ctx.save(); ctx.translate(hcx, hcy);
    const head = ell(0, 0, 7.8, 6.7, 36).map((p, i) => { const k = 1 + 0.045 * Math.cos(i * (TAU / 36) * 6); return [p[0] * k, p[1] * k]; });
    form(ctx, head, { rng: r, c: CO, a: 0.78, rubA: 0.3, sh: CDO, shA: 0.95, hi: CY, line: CO, lw: 1.2 });
    ctx.save(); ctx.beginPath(); poly(ctx, head); ctx.clip(); hatch(ctx, ell(3.6, 5.6, 6, 2.6, 16), { rng: r, ang: -0.6, sp: 1, c: CV, a: 0.75 }); ctx.restore(); // cool shadow
    for (const s of [-1, 1]) stroke(ctx, spl([[s * 2.3, -6.3], [s * 4.4, 0], [s * 2.3, 6.3]], 4), { rng: r, w: 0.6, c: CDO, a: 0.95, dbl: false });
    stroke(ctx, spl([[-0.2, -6.4], [-0.5, -8.4], [-1.6, -9.6]], 3), { rng: r, w: 1.7, c: CG }); // stem + curled tendril = the signature shape
    const cur = []; for (let k = 0; k < 14; k++) { const a = -0.5 + k * 0.48, rr = 2.2 - k * 0.13; cur.push([0.9 + Math.cos(a) * rr, -9.2 + Math.sin(a) * rr]); }
    stroke(ctx, cur, { rng: r, w: 0.45, c: CM, dbl: false }); leaf(ctx, r, -1.2, -8.9, -Math.PI - 0.35, 4.2, 1.25, CM);
    for (const s of [-1, 1]) { const ex = 1.7 + s * 2.7, ey = -1.3, eh = 1.45 * P.eyes + 0.25, tri = [[ex - 1.8, ey + 1], [ex + 1.8, ey + 1], [ex + 0.3 * s, ey + 1 - eh * 1.9]]; fillBoard(ctx, tri); rub(ctx, tri, CY, 0.95); }
    const grin = [[-4.4, 1.8], [-2.8, 2.7], [-1.8, 2.1], [-0.2, 3], [1.4, 2.1], [2.6, 2.8], [4.3, 1.7], [3.4, 4], [1.7, 4.9], [0.9, 4], [0, 4.5], [-1.6, 4.9], [-3.4, 3.9]].map((p) => [1.7 + p[0], p[1]]);
    fillBoard(ctx, grin); rub(ctx, grin, CY, 0.95);
    ctx.restore();
  }

  /* ---------- creatures ---------- */
  function creeperPose(i) { const ph = i / 6, s = Math.sin(TAU * ph), c = Math.cos(TAU * ph), c2 = Math.cos(2 * TAU * ph); return { by: -Math.abs(s) * 1.15, sq: Math.max(0, c2) * 0.07, lean: 0.13 + 0.05 * s, nx: 2.1 * c, nl: Math.max(0, s) * 1.7, fx: -2.1 * c, fl: Math.max(0, -s) * 1.7, leaf: -0.22 * Math.sin(2 * TAU * ph - 1.1), tail: 0.38 * Math.sin(TAU * ph - 1.3) }; }
  function drawCreeper(ctx, P, r) { // small creature: cream root bulb, lavender shoulder, leafy top, taproot tail, heavy brow
    const cy = -13.6 + P.by, rx = 8.2;
    for (const [x, l, far, h0] of [[P.fx, P.fl, true, -1.8], [P.nx, P.nl, false, 2]]) stroke(ctx, spl([[h0, cy + 5.5], [(h0 + x) / 2 + 0.6, cy + 9 - l * 0.6], [x, -l]], 3), { rng: r, w: far ? 1 : 1.2, c: far ? CL : CC, a: far ? 0.8 : 1 });
    ctx.save(); ctx.translate(0, cy + rx); ctx.rotate(P.lean); ctx.scale(1 + P.sq, 1 - P.sq); ctx.translate(0, -rx);
    stroke(ctx, spl([[0.4, rx], [-1.6, rx + 1.8 + P.tail * 0.5], [-4.6, rx + 1.6 + P.tail], [-6.4, rx - 0.2 + P.tail * 1.4], [-5.4, rx - 1.6 + P.tail]], 3), { rng: r, w: 0.7, c: CC, a: 0.9, dbl: false });
    const bulb = spl([[0.4, -rx], [rx * 0.55, -rx * 0.9], [rx * 0.9, -rx * 0.52], [rx, 0], [rx * 0.86, rx * 0.42], [rx * 0.52, rx * 0.76], [rx * 0.14, rx * 1.08], [-rx * 0.18, rx * 0.94], [-rx * 0.6, rx * 0.68], [-rx * 0.94, rx * 0.28], [-rx * 0.98, -rx * 0.22], [-rx * 0.7, -rx * 0.72], [-rx * 0.3, -rx * 0.96]], 3, true);
    form(ctx, bulb, { rng: r, c: CC, a: 0.66, rubA: 0.24, sh: CL, shA: 0.75, lit: 0.5 });
    const wave = [[-rx - 2, -rx - 3], [rx + 2, -rx - 3], [rx + 2, -rx * 0.28]]; for (let k = 6; k >= -6; k--) wave.push([k * rx / 6, -rx * 0.3 + (k & 1 ? 0.7 : -0.5)]); wave.push([-rx - 2, -rx * 0.28]);
    ctx.save(); ctx.beginPath(); poly(ctx, bulb); ctx.clip(); rub(ctx, wave, CL, 0.32); side(ctx, wave, { rng: r, c: CL, a: 0.85, ang: -0.5 }); hatch(ctx, wave, { rng: r, ang: -0.85, sp: 1.15, c: CV, a: 0.6 }); ctx.restore();
    outline(ctx, bulb, r, CW, 0.95);
    for (const [da, len, wid, col] of [[-0.62, 6.8, 2, CM], [0.55, 6.4, 1.9, CG], [0.02, 8.6, 2.1, CM]]) leaf(ctx, r, da * 1.4, -rx + 0.6, -Math.PI / 2 + da + P.leaf, len, wid, col);
    for (const s of [-1, 1]) { const e = ell(2.3 + s * 2.3, -0.4, 1.5, 1.25, 14); fillBoard(ctx, e); dot(ctx, 2.85 + s * 2.3, -0.2, 0.62, CY, 1); }
    stroke(ctx, [[-1.9, -3.3], [1.7, -2], [2.7, -2.3], [6.4, -3.6]], { rng: r, w: 0.95, dbl: false, step: 0.5 }); // one heavy brow
    const m = [[0.5, 2.2], [4.7, 1.9], [4.1, 3.2], [1.1, 3.4]]; fillBoard(ctx, m); stroke(ctx, m, { rng: r, closed: true, w: 0.35, a: 0.85, dbl: false, step: 0.5 });
    ctx.restore();
  }
  function drawGhost(ctx, i, r) { // fast creature: a hooded wisp whose tapering tail carries a travelling wave
    const w = (i / 6) * TAU, C = (t) => [1.2 - 13.5 * t, -7.4 + 4.4 * t + Math.sin(w - t * 4.4) * 1.9 * t], hw = (t) => 3.2 * Math.pow(1 - t, 0.9) + 0.22, lo = [], up = [];
    for (let k = 0; k <= 10; k++) { const t = k / 10, p = C(t), q = C(Math.min(1, t + 0.05)), s = C(Math.max(0, t - 0.05)), l = Math.hypot(q[0] - s[0], q[1] - s[1]) || 1, nx = -(q[1] - s[1]) / l, ny = (q[0] - s[0]) / l; lo.push([p[0] - nx * hw(t), p[1] - ny * hw(t)]); up.push([p[0] + nx * hw(t), p[1] + ny * hw(t)]); }
    const head = []; for (let k = 0; k <= 14; k++) { const a = Math.PI - 0.2 + (k / 14) * (Math.PI + 0.35); head.push([1 + Math.cos(a) * 6.3, -15.4 + Math.sin(a) * 6.6]); }
    const body = spl(head.concat([[6.9, -11.4], [5.8, -8.4], [3.6, -6]], lo, up.reverse().slice(0, 8), [[-4.6, -10.6]]), 2, true);
    fillBoard(ctx, body); rub(ctx, body, CW, 0.3); side(ctx, body, { rng: r, c: CW, a: 0.74, ang: -0.3, lit: 0.6 });
    ctx.save(); ctx.beginPath(); poly(ctx, body); ctx.clip(); hatch(ctx, [[-16, -9], [8, -9], [8, 2], [-16, 2]], { rng: r, ang: 0.95, sp: 1.2, c: CB, a: 0.8 }); ctx.restore();
    stroke(ctx, spl(head, 2), { rng: r, w: 0.9 }); stroke(ctx, lo.slice(1, 9), { rng: r, w: 0.6, c: CB, a: 0.85, dbl: false });
    for (const s of [-1, 1]) fillBoard(ctx, ell(2 + s * 2.2, -15.6, 1.25, 1.9, 14));
    fillBoard(ctx, ell(2.2, -10.6, 1.3, 2 + Math.sin(w) * 0.35, 14));
    const an = Math.sin(w) * 1.3; stroke(ctx, spl([[5.6, -11.2], [8.4, -12.6 + an * 0.4], [11, -11.8 + an]], 3), { rng: r, w: 0.85, a: 0.9 });
    for (let k = -1; k <= 1; k++) stroke(ctx, [[11, -11.8 + an], [12.2, -11.8 + an + k * 0.8]], { rng: r, w: 0.35, dbl: false });
  }
  function drawEraser(ctx, r) { // the felt eraser that wipes figures off the board
    const top = [[-7, -3.4], [7, -3.4], [7, 0.2], [-7, 0.2]], felt = [[-7, 0.2], [7, 0.2], [6.6, 3.2], [-6.6, 3.2]];
    rub(ctx, top, hx(PALETTE.eraser), 1); hatch(ctx, top, { rng: r, ang: 0.05, sp: 0.9, c: [120, 82, 52], a: 0.9 });
    ctx.fillStyle = 'rgb(84,88,86)'; ctx.beginPath(); poly(ctx, felt); ctx.fill(); hatch(ctx, felt, { rng: r, ang: 1.5, sp: 0.6, w: 0.25, c: CW, a: 0.45 });
  }

  /* ---------- sprite bank + hand-drawn timing ---------- */
  let SPR = null;
  function buildSprites() {
    buildGrain();
    const JK = (P, seed) => mk(-15, -37, 17, 2, (c) => drawJack(c, P, rng(seed)), { halo: 0.95 });
    SPR = {
      walk: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [0, 1].map((v) => JK(walkPose(i), 100 + i * 7 + v * 31))),
      idle: [0, 1, 2].map((k) => [0, 1].map((v) => JK(idlePose(k, 1), 200 + k * 7 + v * 31))),
      creeper: [0, 1, 2, 3, 4, 5].map((i) => [0, 1].map((v) => mk(-14, -36, 16, 2, (c) => drawCreeper(c, creeperPose(i), rng(300 + i * 13 + v * 41)), { halo: 0.9 }))),
      ghost: [0, 1, 2, 3, 4, 5].map((i) => [mk(-15, -27, 14, 2, (c) => drawGhost(c, i, rng(500 + i * 13)), { halo: 0.8, haloA: 0.6 })]),
      eraser: mk(-7.5, -3.6, 7.5, 3.6, (c) => drawEraser(c, rng(570)), { halo: 0, grain: 0.2 }),
    };
  }
  const TICK = (t) => Math.floor(t * 12); // the board is redrawn at 12 fps
  /** Which redrawn variant is on the board: each actor holds a drawing for 2 or 3 ticks, offset by its seed. */
  function boilIdx(t, seed, n) { const hold = seed > 0.62 ? 3 : 2; return Math.floor((TICK(t) + ((seed * 997) | 0)) / hold) % n; }
  const easeIO = (t) => t * t * (3 - 2 * t);
  function floatY(t, seed, rate) { const u = (t * rate + seed * 3) % 2; return easeIO(u < 1 ? u : 2 - u); } // hang time, not a plain sine
  function shadow(ctx, x, y, rx, ry) { ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, 'rgba(12,20,16,0.62)'); g.addColorStop(0.62, 'rgba(12,20,16,0.38)'); g.addColorStop(1, 'rgba(12,20,16,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore(); }
  function flipBlit(ctx, s, x, y, facing, img) { ctx.save(); ctx.translate(x, y); ctx.scale(facing < 0 ? -1 : 1, 1); blit(ctx, s, 0, 0, img); ctx.restore(); }

  /** Main character with feet at (x, y). t = seconds, facing = 1 | -1, walking = stride phase drives the 8-pose cycle. */
  function drawHero(ctx, x, y, t, facing, walking) {
    if (!SPR) buildSprites();
    shadow(ctx, x, y + 0.5, 7, 2.2);
    const arr = walking ? SPR.walk[Math.floor(t * 10) % 8] : SPR.idle[[0, 1, 2, 1][Math.floor(t * 2.2) % 4]];
    flipBlit(ctx, arr[boilIdx(t, 0.3, arr.length)], x, y, facing || 1);
  }
  /** A creature with feet at (x, y); wipe in 0..1 runs the eraser sequence (zig-zag bands, smeared haze left behind). */
  function drawEnemy(ctx, x, y, t, type, seed, wipe) {
    if (!SPR) buildSprites();
    seed = seed || 0;
    const ghost = type === 'ghost', poses = ghost ? SPR.ghost : SPR.creeper;
    const arr = poses[ghost ? Math.floor(TICK(t) / 2 + seed * 17) % 6 : Math.floor(t * 6 + seed * 6) % 6], s = arr[boilIdx(t, seed, arr.length)];
    if (ghost) y -= 1.4 + floatY(t, seed, 0.62) * 2.8;
    if (wipe >= 1) return; // wiped clean – redrawn on the next cycle
    shadow(ctx, x, ghost ? y + 4 : y + 0.5, ghost ? 4.8 : 7.5, ghost ? 1.4 : 2.3);
    if (!(wipe > 0)) { ctx.globalAlpha = ghost ? 0.92 : 1; flipBlit(ctx, s, x, y, -1); ctx.globalAlpha = 1; return; }
    const k = 1 / K, left = x - (s.w - s.ax) * k, top = y - s.ay * k, sw = s.w * k, nb = 3, bh = (s.h * k - 2) / nb;
    const kf = Math.min(nb - 1e-6, wipe * nb), band = Math.floor(kf), f = easeIO(kf - band), ltr = (band & 1) === 0;
    const ex = ltr ? left + sw * f : left + sw * (1 - f), yb = top + 1 + band * bh;
    ctx.save(); ctx.beginPath(); ctx.rect(left - 6, yb + bh, sw + 12, 99); if (ltr) ctx.rect(ex, yb, left + sw - ex + 6, bh); else ctx.rect(left - 6, yb, ex - left + 6, bh); ctx.clip();
    flipBlit(ctx, s, x, y, -1); ctx.restore(); // what is still on the board
    ctx.save(); ctx.beginPath(); ctx.rect(left - 6, top, sw + 12, yb - top); if (ltr) ctx.rect(left - 6, yb, ex - left + 6, bh); else ctx.rect(ex, yb, left + sw - ex + 6, bh); ctx.clip();
    ctx.globalAlpha = 0.3; flipBlit(ctx, s, x + (ltr ? 1.4 : -1.4), y + 0.5, -1, s.ch); ctx.globalAlpha = 1; ctx.restore(); // smeared haze
    ctx.save(); ctx.translate(ex, yb + bh * 0.5); ctx.rotate(Math.PI / 2 + (ltr ? -0.22 : 0.22)); blit(ctx, SPR.eraser, 0, 0); ctx.restore();
  }

  /* ---------- ground: regions from a noise field, crisp chalk borders, texture dense at the edges, calm board inside ---------- */
  function bakeGround(w, h, s) {
    const img = new ImageData(w, h), d = img.data, G = 4, gw = Math.ceil(w / G) + 2, gh = Math.ceil(h / G) + 2, A = new Float32Array(gw * gh), H = new Float32Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const X = (i * G - w / 2) / s, Y = (j * G - h / 2) / s; A[j * gw + i] = fbm(X / 300 + 3.1, Y / 300 + 1.7, 11, 3) - sm(-60, 160, Y) * 0.28 + sm(120, 300, X) * 0.3; H[j * gw + i] = fbm(X / 180, Y / 180, 53, 2); }
    const TH1 = 0.40, TH2 = 0.62, LW = 0.5;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const gx = px / G, gy = py / G, i0 = gx | 0, j0 = gy | 0, fx = gx - i0, fy = gy - j0, q = j0 * gw + i0;
      const a = (A[q] * (1 - fx) + A[q + 1] * fx) * (1 - fy) + (A[q + gw] * (1 - fx) + A[q + gw + 1] * fx) * fy, hh = (H[q] * (1 - fx) + H[q + 1] * fx) * (1 - fy) + (H[q + gw] * (1 - fx) + H[q + gw + 1] * fx) * fy;
      const gA = Math.hypot(A[q + 1] - A[q], A[q + gw] - A[q]) * s / G + 1e-7, X = (px - w / 2) / s, Y = (py - h / 2) / s, wob = perlin(X / 11, Y / 11, 59) * 0.45;
      const d1 = (a - TH1) / gA + wob, d2 = (a - TH2) / gA + wob, near = Math.min(Math.abs(d1), Math.abs(d2)), gm = 0.86 + 0.14 * hash2(px, py, 5) - (hash2(px >> 1, py >> 1, 6) < 0.13 ? 0.36 : 0);
      const hz = (hh - 0.5) * 22; let br = BOARD[0] + hz * 0.9, bg = BOARD[1] + hz, bb = BOARD[2] + hz * 0.95;
      const forest = d1 < 0, field = d2 > 0, dE = forest ? -d1 : field ? d2 : near, rc = forest ? CL : field ? CO : CM;
      const band = (forest ? 0.12 : 0.07) * (1 - sm(0.5, 6, dE)) * (0.45 + 0.55 * gm); // side-of-the-chalk band just inside the edge
      br += (rc[0] - br) * band; bg += (rc[1] - bg) * band; bb += (rc[2] - bb) * band;
      let ta = 0, tc = rc;
      if (forest) { const u = (X + Y) * 0.7, v = (X - Y) * 0.7; const l1 = Math.abs(((u % 3.6) + 3.6) % 3.6 - 1.8) < 0.3 && hash2(Math.floor(v / 3), Math.floor(u / 3.6), 3) > 0.3, l2 = Math.abs(((v % 4.2) + 4.2) % 4.2 - 2.1) < 0.28 && hash2(Math.floor(u / 2.5), Math.floor(v / 4.2), 4) > 0.4; ta = (l1 || l2 ? 0.7 : 0) * Math.max(1 - sm(5, 30, dE), sm(0.56, 0.72, hh) * 0.85); }
      else if (field) { const rows = ((Y + X * 0.5) % 2.6 + 2.6) % 2.6; ta = (rows < 0.6 && hash2(Math.floor(X / 6), Math.floor((Y + X * 0.5) / 2.6), 8) > 0.25 ? 0.75 : 0) * (1 - sm(18, 40, dE) * 0.4); tc = hash2(Math.floor(X / 40), Math.floor(Y / 40), 9) < 0.5 ? CO : CY; }
      else { const tuft = hash2(Math.floor(X / 3.2), Math.floor(Y / 3.6), 12) < 0.32 && Math.abs(((X % 3.2) + 3.2) % 3.2 - 1.6) < 0.3; ta = (tuft ? 0.8 : 0) * (1 - sm(2.5, 13, near)); } // grass only in clumps along borders
      ta *= gm * sm(LW + 0.4, LW + 1.6, near);
      br += (tc[0] - br) * ta; bg += (tc[1] - bg) * ta; bb += (tc[2] - bb) * ta;
      const lv = Math.max(0, Math.min(1, (LW - near) * s + 0.5)) * 0.8 * (0.3 + 0.7 * gm), o = (py * w + px) * 4;
      d[o] = br + (CW[0] - br) * lv; d[o + 1] = bg + (CW[1] - bg) * lv; d[o + 2] = bb + (CW[2] - bb) * lv; d[o + 3] = 255;
    }
    const C = canvas(w, h); C.ctx.putImageData(img, 0, 0);
    const g = C.ctx; g.setTransform(s, 0, 0, s, w / 2, h / 2); g.lineCap = 'round';
    for (let k = 0; k < 14; k++) { const y = 150 + k * 0.5, r = rng(60 + k); g.beginPath(); g.moveTo(-260, y + J(3, r)); g.quadraticCurveTo(-120, y - 18, 20, y + J(3, r)); g.lineWidth = R(1, 5, r); g.strokeStyle = 'rgba(205,222,212,' + R(0.02, 0.05, r).toFixed(3) + ')'; g.stroke(); } // an old eraser wipe
    return C.c;
  }

  /* ---------- screen frame + HUD bars ---------- */
  function bakeFrame(w, h) {
    const { c, ctx } = canvas(w, h), r = rng(4711), t = Math.max(8, Math.round(h * 0.013)), tb = Math.round(t * 1.8), vh = h * 0.1, vw = w * 0.07;
    const lin = (x0, y0, x1, y1, rx, ry, rw, rh) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(6,12,9,0.5)'); g.addColorStop(0.45, 'rgba(6,12,9,0.18)'); g.addColorStop(1, 'rgba(6,12,9,0)'); ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh); };
    lin(0, 0, 0, vh, 0, 0, w, vh); lin(0, h, 0, h - vh, 0, h - vh, w, vh); lin(0, 0, vw, 0, 0, 0, vw, h); lin(w, 0, w - vw, 0, w - vw, 0, vw, h);
    for (let i = 0; i < 500; i++) { ctx.fillStyle = 'rgba(230,234,226,' + R(0.05, 0.16, r).toFixed(3) + ')'; ctx.fillRect(r.next() * w, h - tb - Math.pow(r.next(), 2) * vh, 1.6, 1.6); }
    const wood = (x, y, ww, hh, horiz) => { const g = horiz ? ctx.createLinearGradient(0, y, 0, y + hh) : ctx.createLinearGradient(x, 0, x + ww, 0); g.addColorStop(0, '#7a5232'); g.addColorStop(0.5, PALETTE.wood); g.addColorStop(1, PALETTE.woodDark); ctx.fillStyle = g; ctx.fillRect(x, y, ww, hh); };
    wood(0, 0, w, t, true); wood(0, h - tb, w, tb, true); wood(0, 0, t, h, false); wood(w - t, 0, t, h, false);
    const u = t / 10;
    [[0, 46, CW], [56, 28, CP], [92, 36, CY]].forEach(([dx, L, col]) => { ctx.fillStyle = rgba(col, 1); ctx.fillRect(w * 0.06 + dx * u, h - tb + 1 - t * 0.55, L * u, t * 0.55); });
    return c;
  }
  function hudBar(ctx, x, y, w, h, frac, col, col2, r) { // wobbly chalk outline + diagonal hatched fill
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w * frac, h); ctx.clip();
    for (let k = -h; k < w * frac + h; k += 7) { ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h * 0.62, y); ctx.lineWidth = 3.2; ctx.strokeStyle = col; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + k + 3.5, y + h); ctx.lineTo(x + k + 3.5 + h * 0.62, y); ctx.strokeStyle = col2; ctx.stroke(); }
    ctx.restore();
    stroke(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { rng: r, closed: true, w: 2.4, a: 0.92, step: 6, j: 0.6 });
  }

  /** Complete preview scene for a w×h canvas at time t (seconds); deterministic for a given t. */
  let CACHE = null;
  function draw(ctx, w, h, t) {
    const s = h / 360;
    if (!CACHE || CACHE.w !== w || CACHE.h !== h) { K = Math.max(1, Math.round(s * 4) / 4); SPR = null; buildSprites(); CACHE = { w, h, ground: bakeGround(w, h, s), frame: bakeFrame(w, h) }; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(CACHE.ground, 0, 0);
    ctx.setTransform(s, 0, 0, s, w / 2, h / 2);
    const list = [{ y: 10, f: () => drawHero(ctx, -40 + ((t * 30) % 40), 10, t, 1, true) }, { y: -30, f: () => drawHero(ctx, -150, -30, t + 1.3, 1, false) }];
    [[60, 2, 0.1], [105, -30, 0.5], [130, 40, 0.8], [40, 105, 0.66]].forEach(([x, y, sd]) => list.push({ y, f: () => drawEnemy(ctx, x, y, t, 'creeper', sd) }));
    list.push({ y: 70, f: () => drawEnemy(ctx, -80, 70, t, 'creeper', 0.3, (t % 1.6) / 0.9) }); // being wiped away, every 1.6 s
    [[-110, 110, 0.2], [180, 95, 0.7], [200, 20, 0.45]].forEach(([x, y, sd]) => list.push({ y, f: () => drawEnemy(ctx, x, y, t, 'ghost', sd) }));
    list.sort((a, b) => a.y - b.y).forEach((o) => o.f());
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(CACHE.frame, 0, 0);
    const r = rng(900 + boilIdx(t, 0.5, 3)), m = Math.round(h * 0.035);
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
