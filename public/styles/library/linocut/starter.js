/* Linocut — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   A moving linocut print: cream paper, carbon-black key plate, ONE misregistered pumpkin-orange spot plate
   and a sparing teal second spot. No gradients – tone only through carved lines (white gouges in black,
   black lens marks on paper), stipple and hatched shadows. */
(function (root) {
  'use strict';
  const PALETTE = { paper: '#f0e7d2', ink: '#1b1715', orange: '#ea6820', teal: '#2e7674', paperDark: '#e2d6ba', inkDeep: '#0d0b0a' };
  const TAU = Math.PI * 2;
  const PAPER = [240, 231, 210], INK = [27, 23, 21];
  const cP = PALETTE.paper, cI = PALETTE.ink, cO = PALETTE.orange, cT = PALETTE.teal;
  const MX = 0.8, MY = 0.55, TX = -0.55, TY = 0.45; // misregistration of orange / teal plates (world units), identical everywhere

  /* ---------- seeded helpers (RNG, hash, sprite blit) ---------- */
  function rng(seed) { let a = seed >>> 0; return { next() { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }; }
  function hashInt(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; }
  const hash2 = (x, y, s) => hashInt(x, y, s) / 4294967296;
  function perlin(x, y, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, f = (t) => t * t * t * (t * (t * 6 - 15) + 10), u = f(fx), v = f(fy);
    const g = (ix, iy, dx, dy) => { const a = hash2(ix, iy, s) * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
    const a = g(x0, y0, fx, fy) + u * (g(x0 + 1, y0, fx - 1, fy) - g(x0, y0, fx, fy)), b = g(x0, y0 + 1, fx, fy - 1) + u * (g(x0 + 1, y0 + 1, fx - 1, fy - 1) - g(x0, y0 + 1, fx, fy - 1));
    return (a + v * (b - a)) * 1.414;
  }
  function fbm(x, y, s, oct) { let a = 1, f = 1, t = 0, n = 0; for (let i = 0; i < oct; i++) { t += a * perlin(x * f, y * f, s + i * 101); n += a; a *= 0.5; f *= 2; } return t / n * 0.5 + 0.5; }
  const R = (a, b, r) => a + (b - a) * r.next();
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const sm = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return { c, ctx: c.getContext('2d', { willReadFrequently: true }) }; };

  /* ---------- carving toolkit (ported from the reference module) ---------- */
  /** Lens / gouge mark: pointed at both ends, half-width w in the middle, centre line bent by `bend`. Fills with current fillStyle. */
  function lens(ctx, x0, y0, x1, y1, w, bend) {
    bend = bend || 0;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, u = 2 * (bend + w), l = 2 * (bend - w);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx + nx * u, my + ny * u, x1, y1); ctx.quadraticCurveTo(mx + nx * l, my + ny * l, x0, y0); ctx.fill();
  }
  /** Tapered stroke: round blunt start (half-width w), sharp point at the end – grass blades, toes, root hairs. */
  function taper(ctx, x0, y0, x1, y1, w, bend) {
    bend = bend || 0;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L, mx = (x0 + x1) / 2 + nx * bend * 2, my = (y0 + y1) / 2 + ny * bend * 2, th = Math.atan2(dy, dx);
    ctx.beginPath(); ctx.moveTo(x0 + nx * w, y0 + ny * w); ctx.quadraticCurveTo(mx + nx * w * 0.6, my + ny * w * 0.6, x1, y1);
    ctx.quadraticCurveTo(mx - nx * w * 0.6, my - ny * w * 0.6, x0 - nx * w, y0 - ny * w); ctx.arc(x0, y0, w, th - Math.PI / 2, th + Math.PI / 2, true); ctx.closePath(); ctx.fill();
  }
  function spline(pts, sub) {
    const out = [], n = pts.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      for (let s = 0; s < sub; s++) { const t = s / sub, t2 = t * t, t3 = t2 * t, c = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3); out.push([c(0), c(1)]); }
    }
    out.push(pts[n - 1]); return out;
  }
  /** Tapered limb along a smooth path, half-width w0 -> w1 (legs, arms, branches, roots). */
  function limb(ctx, pts, w0, w1) {
    const P = spline(pts, 5), n = P.length, Lf = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l, w = w0 + (w1 - w0) * i / (n - 1);
      Lf.push([P[i][0] - ty * w, P[i][1] + tx * w]); Rt.push([P[i][0] + ty * w, P[i][1] - tx * w]);
    }
    ctx.beginPath(); ctx.moveTo(Lf[0][0], Lf[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(Lf[i][0], Lf[i][1]); for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rt[i][0], Rt[i][1]); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(P[0][0], P[0][1], w0, 0, TAU); ctx.fill();
    if (w1 > 0.12) { ctx.beginPath(); ctx.arc(P[n - 1][0], P[n - 1][1], w1, 0, TAU); ctx.fill(); }
  }
  function smoothPath(ctx, p) { const n = p.length; ctx.moveTo((p[n - 1][0] + p[0][0]) / 2, (p[n - 1][1] + p[0][1]) / 2); for (let i = 0; i < n; i++) { const a = p[i], b = p[(i + 1) % n]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } ctx.closePath(); }
  function polyPath(ctx, p) { ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
  function fillPath(ctx, fn, col) { ctx.beginPath(); fn(ctx); ctx.fillStyle = col; ctx.fill(); }
  function strokePath(ctx, fn, col, lw) { ctx.beginPath(); fn(ctx); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); }
  function clipDo(ctx, fn, body) { ctx.save(); ctx.beginPath(); fn(ctx); ctx.clip(); body(); ctx.restore(); }
  /** Heavy woodcut contour on the shadow side: shape minus a shrunken copy shifted toward the light (upper left). */
  function crescent(ctx, fn, cx, cy, dx, dy, s, col) {
    ctx.save(); ctx.beginPath(); fn(ctx); ctx.clip(); ctx.beginPath(); fn(ctx);
    ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(ctx); ctx.restore();
    ctx.fillStyle = col || cI; ctx.fill('evenodd'); ctx.restore();
  }
  /** A hole cut in the key plate showing a misregistered spot plate: paper first, colour shifted by (dx,dy) and clipped. */
  function holeSpot(ctx, fn, col, dx, dy) { fillPath(ctx, fn, cP); ctx.save(); ctx.beginPath(); fn(ctx); ctx.clip(); ctx.translate(dx, dy); fillPath(ctx, fn, col); ctx.restore(); }
  function star(ctx, x, y, n, r0, r1, rot) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU - Math.PI / 2, r = i & 1 ? r1 : r0; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
  function leaf(ctx, x0, y0, x1, y1, w, bend) { ctx.fillStyle = cI; lens(ctx, x0, y0, x1, y1, w, bend); ctx.fillStyle = cP; lens(ctx, x0 + (x1 - x0) * 0.12, y0 + (y1 - y0) * 0.12, x0 + (x1 - x0) * 0.78, y0 + (y1 - y0) * 0.78, Math.max(0.14, w * 0.14), bend * 0.6); ctx.fillStyle = cI; }

  /* ---------- paper fibres + ink voids (baked once) ---------- */
  let FIB = null, VOID = null;
  function buildTextures() {
    const N = 512, { c, ctx } = canvas(N, N), r = rng(4242);
    ctx.fillStyle = 'rgb(128,128,128)'; ctx.fillRect(0, 0, N, N); ctx.lineCap = 'round';
    for (let i = 0; i < 1300; i++) { // 1300 short curved fibres, dark or light, drawn 9x so they tile
      const x = r.next() * N, y = r.next() * N, a = r.next() * Math.PI, L = R(4, 18, r), b = R(-3, 3, r), ca = Math.cos(a), sa = Math.sin(a);
      ctx.strokeStyle = r.next() < 0.55 ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.12)'; ctx.lineWidth = R(0.6, 1.4, r);
      for (let oy = -N; oy <= N; oy += N) for (let ox = -N; ox <= N; ox += N) { ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.quadraticCurveTo(x + ox + ca * L / 2 - sa * b, y + oy + sa * L / 2 + ca * b, x + ox + ca * L, y + oy + sa * L); ctx.stroke(); }
    }
    const d = ctx.getImageData(0, 0, N, N).data;
    FIB = new Int8Array(N * N);
    for (let i = 0; i < N * N; i++) FIB[i] = Math.max(-22, Math.min(14, Math.round((d[i * 4] - 128) * 0.85 + (fbm((i & 511) / 64, (i >> 9) / 64, 31, 3) - 0.5) * 9 + (hash2(i & 511, i >> 9, 9) - 0.5) * 6)));
    VOID = new Uint8Array(256 * 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) VOID[y * 256 + x] = Math.max(0, Math.min(255, Math.round((0.5 * hash2(x, y, 5) + 0.5 * fbm(x / 8, y / 8, 77, 2)) * 300 - 40)));
  }

  /* ---------- sprite pipeline: draw at K px/unit -> paper halo behind -> uneven ink ---------- */
  let K = 2;
  function mk(x0, y0, x1, y1, draw, opt) {
    opt = opt || {};
    const pad = 1.6, ax = Math.round((pad - x0) * K), ay = Math.round((pad - y0) * K), { c, ctx } = canvas((x1 - x0 + pad * 2) * K, (y1 - y0 + pad * 2) * K);
    ctx.setTransform(K, 0, 0, K, ax, ay); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.fillStyle = cI; draw(ctx); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (opt.halo) { // paper knock-out: 12 offset paper silhouettes drawn destination-over
      const s = canvas(c.width, c.height); s.ctx.drawImage(c, 0, 0); s.ctx.globalCompositeOperation = 'source-atop'; s.ctx.fillStyle = cP; s.ctx.fillRect(0, 0, c.width, c.height);
      ctx.globalCompositeOperation = 'destination-over';
      for (let i = 0; i < 12; i++) ctx.drawImage(s.c, Math.cos(i / 12 * TAU) * opt.halo * K, Math.sin(i / 12 * TAU) * opt.halo * K);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (opt.ink !== false) inkify(c, opt.seed || 7);
    return { c, ax, ay };
  }
  /** Uneven ink: black pixels where VOID > 238 lighten 72% toward paper (pinholes); orange gets ±6% grain. */
  function inkify(c, seed) {
    const ctx = c.getContext('2d'), w = c.width, h = c.height, im = ctx.getImageData(0, 0, w, h), d = im.data, sx = (seed * 37) & 255, sy = (seed * 91) & 255;
    for (let y = 0, i = 0; y < h; y++) {
      const row = ((y + sy) & 255) * 256;
      for (let x = 0; x < w; x++, i += 4) {
        if (d[i + 3] < 100) continue;
        const r = d[i], g = d[i + 1], b = d[i + 2], v = VOID[row + ((x + sx) & 255)];
        if (r < 80 && g < 80 && b < 80) { if (v > 238) for (let k = 0; k < 3; k++) d[i + k] += (PAPER[k] - d[i + k]) * 0.72; }
        else if (r > 160 && g < 150 && b < 110 && r - b > 100) { const f = 0.93 + v / 255 * 0.12; d[i] = r * f; d[i + 1] = g * f; d[i + 2] = b * f; }
      }
    }
    ctx.putImageData(im, 0, 0);
  }
  function blit(ctx, s, x, y, sc) { const k = (sc || 1) / K; ctx.drawImage(s.c, x - s.ax * k, y - s.ay * k, s.c.width * k, s.c.height * k); }

  /* ---------- main character (feet at 0,0, facing f) ---------- */
  const WALK = [{ fa: [3.3, 0], fb: [-3, 0], bob: 0, hem: 0.8, st: 0.5, arm: 0.4 }, { fa: [1, 0], fb: [-0.4, -1.5], bob: -0.8, hem: 0.2, st: -0.6, arm: 0 }, { fa: [-2.7, 0], fb: [3, 0], bob: 0, hem: 0.9, st: 0.6, arm: -0.4 }, { fa: [0.6, -1.5], fb: [-0.2, 0], bob: -0.8, hem: 0.1, st: -0.5, arm: 0 }];
  function drawJack(ctx, f, fr, r) {
    const J = (s) => (r.next() - 0.5) * s, b = fr.bob;
    ctx.save(); ctx.scale(f, 1);
    const leg = (hx, hy, fx, fy) => { ctx.fillStyle = cI; limb(ctx, [[hx, hy], [(hx + fx) / 2 + 0.2, (hy + fy) / 2], [fx, fy - 0.9]], 1.15, 0.9); ctx.beginPath(); ctx.ellipse(fx + 0.55, fy - 0.85, 1.8, 1.05, 0, 0, TAU); ctx.fill(); ctx.fillStyle = cP; lens(ctx, fx - 0.4, fy - 1.45, fx + 1.2, fy - 1.5, 0.18, -0.1); };
    leg(-1.6, -6 + b, fr.fb[0], fr.fb[1]); leg(1.8, -6 + b, fr.fa[0], fr.fa[1]);
    const st = fr.st, scarf = (c) => { c.moveTo(-2, -16.2 + b); c.quadraticCurveTo(-5.6, -16.4 + b + st * 0.4, -9.4, -14.6 + b + st); c.lineTo(-9, -12.9 + b + st); c.quadraticCurveTo(-5.4, -14.4 + b + st * 0.3, -2.4, -14.4 + b); c.closePath(); };
    fillPath(ctx, scarf, cP); strokePath(ctx, scarf, cI, 0.5); ctx.fillStyle = cI; lens(ctx, -5.2, -16 + b + st * 0.25, -5, -14 + b + st * 0.2, 0.42); lens(ctx, -7.4, -15.6 + b + st * 0.6, -7.2, -13.6 + b + st * 0.55, 0.38);
    const hem = fr.hem, cl = [[-3.5, -15.8], [3.8, -15.8], [5.9, -11.2], [7.3, -5.4], [5.5, -4.8], [4.4, -3.6], [2.8, -4.6], [1.1, -3.4], [-0.9, -4.4], [-2.9, -3.3 + hem * 0.3], [-4.9, -4.2 + hem * 0.5], [-7 + hem, -3.2 + hem * 0.5], [-6.4 + hem * 0.6, -8.8], [-4.9, -13.4]].map((p) => [p[0] + J(0.25), p[1] + b + J(0.25)]);
    fillPath(ctx, (c) => polyPath(c, cl), cI);
    ctx.fillStyle = cP; // carved folds on the lit (left) side
    lens(ctx, -4.6 + J(0.3), -4.6 + b, -3, -12.4 + b, 0.44, -0.35); lens(ctx, -2.2 + J(0.3), -4.2 + b, -1.4, -10.6 + b, 0.34, -0.2); lens(ctx, 0.6, -4 + b, 0.8, -8.4 + b, 0.26, -0.1); lens(ctx, 2.9, -13.4 + b, 4.4, -9.6 + b, 0.2, 0.2);
    const hx = 5.6 + fr.arm, hy = -8.8 + b;
    fillPath(ctx, (c) => c.arc(hx, hy, 1.25, 0, TAU), cP); strokePath(ctx, (c) => c.arc(hx, hy, 1.25, 0, TAU), cI, 0.45);
    const wrap = (c) => { c.moveTo(-4.6, -16.6 + b); c.quadraticCurveTo(0.4, -15.2 + b, 4.9, -16.6 + b); c.lineTo(4.6, -14.6 + b); c.quadraticCurveTo(0.4, -13 + b, -4.3, -14.6 + b); c.closePath(); };
    fillPath(ctx, wrap, cP); strokePath(ctx, wrap, cI, 0.45); ctx.fillStyle = cI; for (const x of [-2.6, 0.2, 3]) lens(ctx, x - 0.2, -16.2 + b, x + 0.3, -14 + b, 0.38);
    // round lobed head: paper, orange plate offset by (MX,MY), carved ribs + shading lenses, crescent shadow, carved face
    const h0 = 0.7 + J(0.15), v0 = -21.6 + b, rx = 7.3, ry = 6.2, pts = [];
    for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU, lobe = 1 - 0.05 * Math.abs(Math.sin(a * 2.5 + 0.4)) + J(0.035), x = Math.cos(a) * rx * lobe; let y = Math.sin(a) * ry * lobe; if (y < 0) y *= 1 - 0.13 * Math.exp(-(x * x) / 5); pts.push([h0 + x, v0 + y]); }
    const head = (c) => smoothPath(c, pts);
    fillPath(ctx, head, cP); ctx.save(); ctx.translate(MX * f, MY); fillPath(ctx, head, cO); ctx.restore();
    clipDo(ctx, head, () => {
      ctx.fillStyle = cI;
      for (const xr of [-0.62, -0.24, 0.24, 0.62]) lens(ctx, h0 + xr * rx * 0.8, v0 - ry * 0.98, h0 + xr * rx * 0.86 + J(0.2), v0 + ry * 0.98, xr > 0 ? 0.34 : 0.26, xr * 1.6);
      for (let i = 0; i < 6; i++) { const x = h0 + rx * (0.36 + i * 0.105); lens(ctx, x - 0.5, v0 - ry * 0.75 + i * 0.35, x + 0.1, v0 + ry * 1.05, 0.16 + i * 0.055, 0.45); }
      for (let i = 0; i < 4; i++) { const y = v0 + ry * (0.55 + i * 0.13); lens(ctx, h0 - rx * 0.55 + i * 0.4, y, h0 + rx * 0.75, y + 0.2, 0.12 + i * 0.05, 0.5); }
    });
    crescent(ctx, head, h0, v0, -1, -0.85, 0.93, cI); strokePath(ctx, head, cI, 0.75);
    const fx = h0 + 0.95;
    fillPath(ctx, (c) => { polyPath(c, [[fx - 4, v0 - 0.2], [fx - 0.9, v0 - 0.45], [fx - 2.6, v0 - 3.4]]); polyPath(c, [[fx + 0.8, v0 - 0.45], [fx + 3.9, v0 - 0.2], [fx + 2.2, v0 - 3.4]]); polyPath(c, [[fx - 0.65, v0 + 1], [fx + 0.65, v0 + 1], [fx, v0 - 0.1]]); }, cI);
    fillPath(ctx, (c) => { polyPath(c, [[-4.7, 1.5], [-3.6, 2.3], [-2.6, 2], [-2.4, 2.9], [-1, 3.1], [-0.8, 2.4], [0.9, 2.5], [1.1, 3.2], [2.5, 2.8], [2.7, 2], [3.7, 2.2], [4.7, 1.4], [3.4, 4.6], [0.1, 5.2], [-3.4, 4.6]].map((p) => [fx + p[0], v0 + p[1]])); }, cI);
    ctx.fillStyle = cP; lens(ctx, h0 - 6, v0 - 0.4, h0 - 4.5, v0 - 4.3, 0.42, -0.4); lens(ctx, h0 - 3.7, v0 - 4.5, h0 - 1.5, v0 - 5.5, 0.3, -0.25);
    ctx.fillStyle = cI; taper(ctx, h0 + 0.2, v0 - ry + 1, h0 + 1.9 + J(0.3), v0 - ry - 2.9, 1.1, -0.5); leaf(ctx, h0 + 0.6, v0 - ry - 0.3, h0 - 3.6, v0 - ry - 1.6, 0.85, -0.5);
    ctx.restore();
  }
  /* ---------- small creature: root bulb with a solid-ink crown, comb transition, carved eyes + teeth ---------- */
  function drawCreeper(ctx, f, i, r) {
    const J = (s) => (r.next() - 0.5) * s, ph = (i / 4) * TAU, bob = -0.75 * Math.abs(Math.sin(ph));
    ctx.save(); ctx.scale(f, 1); ctx.fillStyle = cI;
    const fa = [2.7 + 1.5 * Math.cos(ph), -Math.max(0, Math.sin(ph)) * 1.4], fb = [-2.2 - 1.5 * Math.cos(ph), -Math.max(0, -Math.sin(ph)) * 1.4];
    for (const [hx, ft] of [[-2, fb], [2.2, fa]]) { limb(ctx, [[hx, -5.4 + bob], [(hx + ft[0]) / 2, -2.8 + bob * 0.5 + ft[1] * 0.5], [ft[0], ft[1] - 0.4]], 0.85, 0.55); taper(ctx, ft[0], ft[1] - 0.4, ft[0] + 1.9, ft[1] + 0.1, 0.42, 0.1); taper(ctx, ft[0], ft[1] - 0.4, ft[0] - 1.1, ft[1] + 0.2, 0.36, -0.1); }
    ctx.translate(0, -4.5 + bob); ctx.rotate(0.075 * Math.cos(ph)); ctx.translate(0, 4.5);
    const sw = Math.sin(ph) * 0.7;
    leaf(ctx, -0.4, -18.2, -6 + sw, -24.6, 1.45, -0.7); leaf(ctx, 0.6, -18.6, 1.6 + sw * 0.6, -26.4, 1.5, 0.5); leaf(ctx, 1.2, -18.2, 6.8 + sw * 0.4, -23.4, 1.35, 0.8);
    const pts = [[0, -19.6], [3.7, -19], [6.5, -16.6], [7.7, -12.8], [7.2, -9], [5.2, -6.1], [2.4, -4.6], [0.5, -3.3], [-1.9, -4.6], [-4.9, -6.3], [-7.1, -9.2], [-7.6, -13], [-6.3, -16.7], [-3.5, -19]].map((p) => [p[0] + J(0.3), p[1] + J(0.3)]);
    const body = (c) => smoothPath(c, pts);
    fillPath(ctx, body, cP);
    clipDo(ctx, body, () => {
      const wy = (x) => -12.4 + 0.45 * Math.sin(x * 0.95 + 0.6);
      ctx.beginPath(); ctx.moveTo(-9, -25); ctx.lineTo(9, -25); for (let x = 9; x >= -9; x -= 0.5) ctx.lineTo(x, wy(x)); ctx.closePath(); ctx.fillStyle = cI; ctx.fill();
      for (let x = -6.8; x <= 6.9; x += 1.1) taper(ctx, x, wy(x) - 0.2, x + 0.25, wy(x) + 1 + 2.6 * ((x + 7) / 14) + J(0.8), 0.4); // engraved comb into the light underside
      ctx.fillStyle = cP; lens(ctx, -6.6, -13.6, -3.6, -18, 0.34, -0.6); lens(ctx, -4.6, -16.8, -0.6, -19.1, 0.26, -0.45);
      ctx.fillStyle = cI; lens(ctx, 3.4, -6.6, 6.7, -10.2, 0.24, 0.45); lens(ctx, 1.4, -5, 5, -7.2, 0.2, 0.3);
    });
    const e1 = -0.5, e2 = 3.6, ey = -14.3;
    ctx.fillStyle = cP; lens(ctx, e1 - 1.45, ey - 0.75, e1 + 1.25, ey + 0.45, 0.78, 0.18); lens(ctx, e2 - 1.25, ey + 0.45, e2 + 1.45, ey - 0.75, 0.78, 0.18);
    ctx.fillStyle = cI; for (const ex of [e1, e2]) { ctx.beginPath(); ctx.arc(ex + 0.35, ey + 0.05, 0.5, 0, TAU); ctx.fill(); }
    lens(ctx, -1, -9.2, 4.4, -9.45, 0.85, -0.35);
    ctx.fillStyle = cP; for (const tx of [0.5, 2.6]) { ctx.beginPath(); ctx.moveTo(tx - 0.42, -10.15); ctx.lineTo(tx + 0.42, -10.15); ctx.lineTo(tx, -9.3); ctx.fill(); }
    crescent(ctx, body, 0, -12, -0.9, -0.8, 0.94, cI); strokePath(ctx, body, cI, 0.7);
    ctx.fillStyle = cI; taper(ctx, -6.9, -8.6, -8.6, -8, 0.24); taper(ctx, 6.9, -8, 8.6, -7.2, 0.24);
    ctx.restore();
  }
  /* ---------- floating creature: paper spirit with a teal stipple plate on the shadow side ---------- */
  function drawGhost(ctx, f, i) {
    const ph = (i / 4) * TAU, tipX = -9.2 + Math.cos(ph) * 0.8, tipY = -8.4 + Math.sin(ph) * 1.4, reach = Math.sin(ph) * 0.6;
    ctx.save(); ctx.scale(f, 1); ctx.fillStyle = cI;
    const body = (c) => { c.moveTo(0.4, -24); c.quadraticCurveTo(6.6, -23.6, 6.3, -16.6); c.quadraticCurveTo(6, -10.6, 2.6, -7.6); c.quadraticCurveTo(-1.6, -5, tipX, tipY); c.quadraticCurveTo(-4.4, -8.4, -5.2, -12); c.quadraticCurveTo(-6.2, -15.6, -5.6, -18.6); c.quadraticCurveTo(-4.4, -24.2, 0.4, -24); c.closePath(); };
    fillPath(ctx, body, cP);
    clipDo(ctx, body, () => {
      ctx.save(); ctx.translate(TX * f, TY); ctx.fillStyle = cT; const r2 = rng(9001 + i);
      for (let k = 0; k < 230; k++) { const x = R(-7, 7, r2), y = R(-24, -5, r2), sh = clamp01((x + 0.5) / 6.5) * 0.85 + clamp01((y + 11) / 6) * 0.5; if (r2.next() < sh * 0.75) { ctx.beginPath(); ctx.arc(x, y, R(0.26, 0.42, r2), 0, TAU); ctx.fill(); } }
      ctx.restore(); ctx.fillStyle = cI; for (let k = 0; k < 4; k++) lens(ctx, 4.4 + k * 0.5, -20.5 + k * 0.6, 3.6 + k * 0.6, -9 + k * 0.3, 0.14 + k * 0.03, 1.1);
    });
    crescent(ctx, body, 0.5, -15, -0.7, -0.6, 0.95, cI); strokePath(ctx, body, cI, 0.62);
    ctx.fillStyle = cI; ctx.beginPath(); ctx.ellipse(0.3, -17.6, 1.25, 1.95, 0.22, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(4.05, -17.5, 1.15, 1.8, -0.18, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(2.3, -12.6, 1.05, 1.9, 0.05, 0, TAU); ctx.fill();
    limb(ctx, [[5.2, -13.6], [8, -13.6 - reach * 0.3], [10.4 + reach, -13]], 0.46, 0.3); for (let k = 0; k < 3; k++) taper(ctx, 10.4 + reach, -13, 12 + reach, -13.8 + k * 0.75, 0.21);
    for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(tipX - k * 1.25, tipY + k * 0.4 * Math.sin(ph + k), 0.5 - k * 0.11, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  /** Hatched cast shadow: horizontal gouge lines filling an ellipse (never a soft blur). */
  function drawShadowArt(ctx, rx, ry) { const n = Math.max(3, Math.round(ry / 0.75)); ctx.fillStyle = cI; for (let k = 0; k < n; k++) { const t = (k + 0.5) / n * 2 - 1, hw = rx * Math.sqrt(1 - t * t) * 1.02; lens(ctx, -hw + rx * 0.12, t * ry, hw + rx * 0.12, t * ry, 0.33 + (1 - Math.abs(t)) * 0.12); } }
  function drawGem(ctx, fr) {
    ctx.fillStyle = cI; for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + Math.PI / 4, L = fr ? 4.6 : 3.8; lens(ctx, Math.cos(a) * 3.1, Math.sin(a) * 3.1 - 3, Math.cos(a) * L, Math.sin(a) * L - 3, 0.22); }
    ctx.save(); ctx.translate(MX, MY); star(ctx, 0, -3, 4, 3, 1.05, 0); ctx.fillStyle = cO; ctx.fill(); ctx.restore();
    star(ctx, 0, -3, 4, 3, 1.05, 0); ctx.strokeStyle = cI; ctx.lineWidth = 0.55; ctx.stroke();
  }
  function branch(ctx, x, y, a, len, w, d, r) { // bare tree: recursive tapered limbs bending upward
    const pts = [[x, y]]; for (let i = 0; i < 3; i++) { a = Math.max(-Math.PI + 0.12, Math.min(-0.12, a + R(-0.34, 0.34, r))); x += Math.cos(a) * len / 3; y += Math.sin(a) * len / 3; pts.push([x, y]); }
    ctx.fillStyle = cI; limb(ctx, pts, w, w * 0.58);
    if (d > 0) for (let i = 0, k = d >= 2 && r.next() < 0.45 ? 3 : 2; i < k; i++) branch(ctx, x, y, a + R(-0.85, 0.85, r), len * R(0.55, 0.76, r), w * 0.6, d - 1, r);
  }
  function drawOak(ctx, r) {
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) limb(ctx, [[s * R(0.5, 2.5, r), -3.5], [s * R(3.6, 5.4, r), -0.8], [s * R(6.6, 12, r), R(-0.4, 1, r)]], 1.5, 0.12);
    const tr = [[0, 0.5], [R(-1.4, 1.4, r), -9], [R(-2.2, 2.2, r), -18], [R(-1.2, 1.2, r), -27]];
    limb(ctx, tr, 4.4, 3);
    for (let i = 0; i < 3; i++) branch(ctx, tr[3][0], tr[3][1], -Math.PI / 2 + (i - 1) * R(0.55, 0.85, r), R(15, 21, r), 2.6, 3, r);
    ctx.fillStyle = cP; for (let i = 0; i < 6; i++) { const y = R(-24, -3, r), x = R(-3, -0.5, r); lens(ctx, x, y, x + R(-0.5, 0.5, r), y - R(4, 8, r), R(0.22, 0.4, r), R(-0.3, 0.3, r)); } // bark gouges on the lit side
  }

  /* ---------- sprite bank: 4 frames x 2 carving variants (boil at 6 fps), facing baked separately ---------- */
  let SPR = null;
  function buildSprites() {
    buildTextures();
    const fr4 = (fn) => [1, -1].map((f) => [0, 1, 2, 3].map((i) => [0, 1].map((v) => fn(f, i, v))));
    SPR = {
      jack: fr4((f, i, v) => mk(-11.5, -32, 11.5, 1.5, (c) => drawJack(c, f, WALK[i], rng(100 + v * 7 + i)), { halo: 0.9, seed: 3 + v * 5 + i })),
      creeper: fr4((f, i, v) => mk(-10, -28.5, 10, 1.5, (c) => drawCreeper(c, f, i, rng(300 + v * 11 + i * 3)), { halo: 0.9, seed: 21 + v * 9 + i })),
      ghost: [1, -1].map((f) => [0, 1, 2, 3].map((i) => mk(-11, -26, 13.5, 1, (c) => drawGhost(c, f, i), { halo: 0.9, seed: 30 + i }))),
      oak: mk(-44, -86, 44, 4, (c) => drawOak(c, rng(800)), { halo: 0.8, seed: 80 }),
      gem: [0, 1].map((fr) => mk(-5, -8, 5, 2, (c) => drawGem(c, fr), { halo: 0.5, seed: 60 + fr })),
      seed: mk(-14, -3, 4, 3, (c) => { c.fillStyle = cI; lens(c, -13.5, 0, -4.2, 0, 0.42); lens(c, -10.5, -1.5, -4.6, -1.2, 0.3, 0.2); lens(c, -10, 1.5, -4.6, 1.2, 0.3, -0.2);
        const sd = (p) => { p.moveTo(-3, 0); p.quadraticCurveTo(-0.6, -2.9, 3.4, 0); p.quadraticCurveTo(-0.6, 2.9, -3, 0); p.closePath(); };
        c.save(); c.translate(MX, MY); fillPath(c, sd, cO); c.restore(); strokePath(c, sd, cI, 0.62); c.fillStyle = cI; lens(c, -2.2, 0.4, 2.6, 0.5, 0.42, 0.55); }, { seed: 40 }),
      sh: [[6.4, 2], [7.4, 2.2], [4.6, 1.4], [19, 4.6]].map(([rx, ry]) => mk(-rx - 1, -ry - 1, rx * 1.3 + 1, ry + 1, (c) => drawShadowArt(c, rx, ry), { ink: false })),
    };
  }

  /** Draws the main character with feet at (x, y). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) {
    if (!SPR) buildSprites();
    blit(ctx, SPR.sh[0], x, y + 0.5);
    blit(ctx, SPR.jack[facing < 0 ? 1 : 0][Math.floor(t * 5) & 3][Math.floor(t * 6) & 1], x, y);
  }
  /** Draws a typical creature with feet at (x, y). type: 'creeper' (small root creature) | 'ghost' (floating spirit). */
  function drawEnemy(ctx, x, y, t, type, seed, facing) {
    if (!SPR) buildSprites();
    seed = seed || 0; const fi = facing < 0 ? 1 : 0;
    if (type === 'ghost') { blit(ctx, SPR.sh[2], x, y + 0.5); blit(ctx, SPR.ghost[fi][Math.floor(t * 5 + seed * 9) & 3], x, y - 2.2 - Math.round(Math.sin(t * 3.1 + seed * 20) * 2.5) * 0.4); return; }
    blit(ctx, SPR.sh[1], x, y + 0.5);
    blit(ctx, SPR.creeper[fi][Math.floor(t * 4 + seed * 4) & 3][Math.floor(t * 6 + seed * 10) & 1], x, y);
  }

  /* ---------- ground: per-pixel ink coverage on fibrous paper ---------- */
  /** One grass tick = up to 3 tapered blades, analytic coverage for world point (dx,dy) relative to its base. */
  function blade(dx, dy, ang, L, res) { const ux = Math.sin(ang), uy = -Math.cos(ang); let t = (dx * ux + dy * uy) / L; if (t > 1) return 0; if (t < 0) t = 0; const qx = dx - ux * t * L, qy = dy - uy * t * L; return clamp01((0.46 * (1 - t) - Math.hypot(qx, qy)) * res + 0.5); }
  function grass(X, Y, dens, res) {
    const GC = 9, fx = X / GC, fy = Y / GC, ix = Math.floor(fx), iy = Math.floor(fy), sx = fx - ix < 0.5 ? ix - 1 : ix, sy = fy - iy < 0.5 ? iy - 1 : iy; let a = 0;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const h = hashInt(sx + i, sy + j, 4141); if ((h & 1023) > dens * 1024) continue;
      const dx = X - (sx + i + 0.15 + ((h >>> 10) & 255) / 255 * 0.7) * GC, dy = Y - (sy + j + 0.35 + ((h >>> 18) & 255) / 255 * 0.55) * GC;
      if (dx < -3.3 || dx > 3.3 || dy > 0.7 || dy < -4.6) continue;
      const type = (h >>> 26) & 3, L = 2.2 + ((h >>> 28) & 3) * 0.45;
      let v = blade(dx, dy, 0.16, L, res); if (type >= 1) v = Math.max(v, blade(dx + 0.55, dy, -0.5, L * 0.72, res)); if (type >= 2) v = Math.max(v, blade(dx - 0.55, dy, 0.75, L * 0.66, res));
      if (v > a) a = v;
    }
    return a;
  }
  function bakeGround(w, h, s) {
    const G = 4, gw = Math.ceil(w / G) + 2, gh = Math.ceil(h / G) + 2, D = new Float32Array(gw * gh), B = new Float32Array(gw * gh), T = new Float32Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const X = (i * G - w / 2) / s, Y = (j * G - h / 2) / s, q = j * gw + i;
      D[q] = fbm(X / 300, Y / 300, 202, 2) + 0.4 * Math.exp(-((X + 150) ** 2 + (Y + 95) ** 2) / 4200) + 0.45 * sm(140, 300, Math.hypot(X - 330, Y - 190)) * -1 + 0.35; // dark soil blobs
      B[q] = fbm(X / 400 + 2, Y / 400, 101, 3) + sm(120, 300, X) * 0.3; // forest stipple to the right
      T[q] = fbm(X / 140, Y / 140, 606, 2);
    }
    const img = new ImageData(w, h), d = img.data, res = s, DTH = 0.74, B2 = 0.62, GUT = 1.5;
    for (let py = 0; py < h; py++) {
      const gy = py / G, j0 = gy | 0, fy = gy - j0;
      for (let px = 0; px < w; px++) {
        const gx = px / G, i0 = gx | 0, fx = gx - i0, q = j0 * gw + i0;
        const L = (A) => (A[q] * (1 - fx) + A[q + 1] * fx) * (1 - fy) + (A[q + gw] * (1 - fx) + A[q + gw + 1] * fx) * fy;
        const gD = Math.hypot(D[q + 1] - D[q], D[q + gw] - D[q]) * s / G + 1e-6, gB = Math.hypot(B[q + 1] - B[q], B[q + gw] - B[q]) * s / G + 1e-6;
        const dS = (L(D) - DTH) / gD, dB = (L(B) - B2) / gB, tt = L(T), X = (px - w / 2) / s, Y = (py - h / 2) / s;
        let a = 0;
        if (dS > 0) { // solid ink soil + two carved echo contours inside the edge + white gouge flecks deep inside
          a = clamp01(dS * res + 0.5);
          let k = clamp01(Math.max((0.3 - Math.abs(dS - 1.8)) * res + 0.5, (0.22 - Math.abs(dS - 3.4)) * res + 0.5));
          if (dS > 4.3) { const cx = Math.floor(X / 4.3), cy = Math.floor(Y / 4.3), hh = hashInt(cx, cy, 6161); if ((hh & 1023) < 640) { const u = X - (cx + 0.5) * 4.3, v = Y - (cy + 0.5) * 4.3, uu = (u * 0.9 + v * 0.43) / 1.6; if (Math.abs(uu) < 1) k = Math.max(k, clamp01(((0.3 * (1 - uu * uu)) - Math.abs(-u * 0.43 + v * 0.9)) * res + 0.5)); } }
          a *= 1 - k;
        } else if (dS < -GUT) {
          const fade = clamp01((-dS - GUT) * res + 0.5);
          if (dB > 0) { // forest floor: hashed stipple, density from T, with a carved edge line
            const ix = Math.floor(X / 2.5), iy = Math.floor(Y / 2.5), hh = hashInt(ix, iy, 919);
            if ((hh & 1023) < (0.14 + 0.52 * sm(0.3, 0.72, tt)) * 1024) { const r0 = 0.3 + ((hh >>> 10) & 63) / 63 * 0.24; a = clamp01((r0 - Math.hypot(X - (ix + 0.22 + ((hh >>> 16) & 255) / 255 * 0.56) * 2.5, Y - (iy + 0.22 + ((hh >>> 24) & 255) / 255 * 0.56) * 2.5)) * res + 0.5); }
            a = Math.max(a, clamp01((0.42 - Math.abs(dB - 0.5)) * res + 0.5));
            if (dB > 0.92 && dB < 1.92 && a < 1) a *= clamp01((dB - 1) * res + 0.5);
          } else if (dB < -GUT) a = grass(X, Y, 0.1 + 0.5 * sm(0.32, 0.72, tt), res) * clamp01((-dB - GUT) * res + 0.5);
          a *= fade;
        }
        const fo = FIB[((py & 511) << 9) + (px & 511)];
        let r = PAPER[0] + fo, g = PAPER[1] + fo, b = PAPER[2] + fo;
        if (a > 0.003) { // ink with paper fibres showing through + pinhole voids
          const vv = VOID[((py & 255) << 8) + (px & 255)];
          let ir = INK[0] + fo * 0.4, ig = INK[1] + fo * 0.4, ib = INK[2] + fo * 0.4;
          if (vv > 220) { ir += (r - ir) * 0.7; ig += (g - ig) * 0.7; ib += (b - ib) * 0.7; }
          r += (ir - r) * a; g += (ig - g) * a; b += (ib - b) * a;
        }
        const o = (py * w + px) * 4; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
      }
    }
    const C = canvas(w, h); C.ctx.putImageData(img, 0, 0);
    const c = C.ctx, r = rng(3101); c.setTransform(s, 0, 0, s, w / 2, h / 2); // decals: carved flowers knocked out of the grass
    for (let i = 0; i < 26; i++) { const x = R(-300, 120, r), y = R(-160, 160, r); c.fillStyle = cP; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); c.fillStyle = cI; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; lens(c, x + Math.cos(a) * 0.75, y + Math.sin(a) * 0.75, x + Math.cos(a) * 2.4, y + Math.sin(a) * 2.4, 0.62); } }
    return C.c;
  }
  /** Ragged ink frame (torn print edge) + inner rule. */
  function bakeFrame(w, h) {
    const { c, ctx } = canvas(w, h), t = Math.max(6, Math.round(h * 0.011)), r = rng(31337); ctx.fillStyle = cI;
    const edge = (len, f) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); for (let x = len; x >= 0; x -= R(6, 18, r)) ctx.lineTo(x, t * R(0.55, 1, r)); ctx.lineTo(0, t * 0.8); ctx.fill(); ctx.fillRect(0, t * 1.35, len, Math.max(1, t * 0.18)); void f; };
    for (const [tx, ty, rot, len] of [[0, 0, 0, w], [w, h, Math.PI, w], [0, h, -Math.PI / 2, h], [w, 0, Math.PI / 2, h]]) { ctx.save(); ctx.translate(tx, ty); ctx.rotate(rot); edge(len); ctx.restore(); }
    return c;
  }
  /** Woodcut HUD bar: paper box, 3 px ink border, 4 px hard offset shadow, diagonal striped fill. */
  function hudBar(ctx, x, y, w, h, frac, cA, cB, wa, wb) {
    ctx.fillStyle = cI; ctx.fillRect(x + 4, y + 4, w, h); ctx.fillStyle = cP; ctx.fillRect(x, y, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w * frac, h); ctx.clip(); ctx.fillStyle = cA; ctx.fillRect(x, y, w * frac, h); ctx.strokeStyle = cB; ctx.lineWidth = wb;
    for (let k = -h; k < w * frac + h; k += wa + wb) { ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h * 0.53, y); ctx.stroke(); }
    ctx.restore(); ctx.strokeStyle = cI; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, main character, creatures, effects. */
  let CACHE = null;
  function draw(ctx, w, h, t) {
    const s = h / 360;
    if (!CACHE || CACHE.w !== w || CACHE.h !== h) { K = Math.max(1.5, Math.round(s * 4) / 4); SPR = null; buildSprites(); CACHE = { w, h, ground: bakeGround(w, h, s), frame: bakeFrame(w, h) }; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(CACHE.ground, 0, 0);
    ctx.setTransform(s, 0, 0, s, w / 2, h / 2);
    const list = [{ y: -30, f: () => { blit(ctx, SPR.sh[3], -95, -30); blit(ctx, SPR.oak, -95, -30); } }, { y: 60, f: () => { blit(ctx, SPR.sh[3], 210, 60); blit(ctx, SPR.oak, 210, 60); } }, { y: 8, f: () => drawHero(ctx, -20, 8, t, 1) }];
    [[45, 2, 0.1, -1], [90, -40, 0.5, -1], [120, 45, 0.8, -1], [-200, 70, 0.3, 1], [30, 110, 0.6, -1], [160, -10, 0.9, -1]].forEach(([x, y, sd, f]) => list.push({ y, f: () => drawEnemy(ctx, x, y, t, 'creeper', sd, f) }));
    [[-150, 120, 0.2, 1], [70, 70, 0.7, -1]].forEach(([x, y, sd, f]) => list.push({ y, f: () => drawEnemy(ctx, x, y, t, 'ghost', sd, f) }));
    list.sort((a, b) => a.y - b.y).forEach((o) => o.f());
    for (const [x, y, v] of [[15, 30, 0], [25, 24, 1], [0, 44, 0], [62, 50, 1]]) { blit(ctx, SPR.gem[(Math.floor(t * 4) + v) & 1], x, y - 1 + Math.sin(t * 3 + x) * 0.7); }
    blit(ctx, SPR.seed, -6 + (t * 110) % 45, -6);
    // floating numbers: Alfa Slab One; small = ink with a fat paper outline; large = orange over an ink copy offset by the misregistration
    ctx.font = '11.5px "Alfa Slab One", Georgia, serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    const ny = -38 - (t % 1) * 5;
    ctx.lineWidth = 4.1; ctx.strokeStyle = cP; ctx.strokeText('34', 45, ny); ctx.fillStyle = cI; ctx.fillText('34', 45 + MX * 0.6, ny + MY * 0.6); ctx.lineWidth = 1; ctx.strokeStyle = cI; ctx.strokeText('34', 45, ny); ctx.fillStyle = cO; ctx.fillText('34', 45, ny);
    ctx.font = '8.5px "Alfa Slab One", Georgia, serif'; ctx.lineWidth = 2.6; ctx.strokeStyle = cP; ctx.strokeText('17', 95, -62); ctx.fillStyle = cI; ctx.fillText('17', 95, -62);
    // frame + HUD
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(CACHE.frame, 0, 0);
    const m = Math.round(h * 0.03);
    hudBar(ctx, m, m * 0.7, w - m * 2 - 4, h * 0.022, 0.78, cO, cI, 7, 1.5);
    hudBar(ctx, m * 2.2, m * 2.1, w * 0.14, h * 0.024, 1, cI, cP, 9, 1.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = Math.round(h * 0.03) + 'px "Alfa Slab One", Georgia, serif'; ctx.fillStyle = cI; ctx.fillText('100/100', m * 2.2 + w * 0.14 + 12, m * 2.1 + h * 0.012);
    const bw = w * 0.13, bh = h * 0.085, bx = w / 2 - bw / 2, by = m * 1.6;
    ctx.fillStyle = cI; ctx.fillRect(bx - 6 + 7, by - 6 + 7, bw + 12, bh + 12); ctx.fillRect(bx - 6, by - 6, bw + 12, bh + 12); ctx.fillStyle = cP; ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6); ctx.fillStyle = cI; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = cP; ctx.fillRect(bx + 3, by + 3, bw - 6, bh - 6);
    ctx.textAlign = 'center'; ctx.font = Math.round(h * 0.05) + 'px "Rye", Georgia, serif'; ctx.fillStyle = cO; ctx.fillText('22:09', w / 2 + 2, by + bh * 0.42 + 2); ctx.fillStyle = cI; ctx.fillText('22:09', w / 2, by + bh * 0.42);
    ctx.font = Math.round(h * 0.015) + 'px "Special Elite", monospace'; ctx.fillText('TITLE TEXT', w / 2, by + bh * 0.82); ctx.fillRect(bx + bw * 0.12, by + bh * 0.68, bw * 0.76, 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  const Starter = { id: 'linocut', name: 'Linocut', palette: PALETTE, fonts: ['Rye', 'Alfa Slab One', 'Special Elite'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['linocut'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
