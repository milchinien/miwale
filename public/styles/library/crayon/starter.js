/* Crayon Kids — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   A child's wax-crayon drawing: toothy white paper, wobbly crayon lines that overshoot their start, zigzag scribble
   fills that go outside the lines, a paper-white margin around every figure, and three redrawn variants per drawing
   that "boil" at 7 fps. Everything is baked once into sprites; a frame is just blits. */
(function (root) {
  'use strict';
  const PALETTE = {
    paper: '#fbf8ef', ink: '#2b2a30', red: '#e2362c', orange: '#f78b1f', yellow: '#fdce28', green: '#42ae3a',
    darkGreen: '#217a38', lightGreen: '#9ece3a', sky: '#42a8ea', blue: '#2a5ec8', purple: '#8c4cc4', darkPurple: '#5c2c8c',
    pink: '#f67eb4', brown: '#94582c', tan: '#d8a262', peach: '#fcc698', grey: '#929098', ghostBlue: '#a8d6f6',
  };
  const TAU = Math.PI * 2;
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const C = {};
  for (const k in PALETTE) C[k] = hex(PALETTE[k]);
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  function rng(seed) {
    let a = seed >>> 0;
    const f = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.r = (lo, hi) => lo + (hi - lo) * f();
    f.j = (s) => (f() - 0.5) * 2 * s;
    return f;
  }
  const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.ceil(w)), height: Math.max(1, Math.ceil(h)) });
  const ell = (cx, cy, rx, ry, n) => Array.from({ length: n || 24 }, (_, i) => { const a = (i / (n || 24)) * TAU; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  const blob = (cx, cy, rx, ry, R, lump) => { const p1 = R() * TAU; return Array.from({ length: 26 }, (_, i) => { const a = (i / 26) * TAU, k = 1 + (lump || 0.06) * Math.sin(a * 3 + p1); return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; }); };
  const puff = (cx, cy, rx, ry, bumps) => Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * TAU, k = 0.84 + 0.2 * Math.abs(Math.sin((a * bumps) / 2)); return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
  const star = (x, y, r0, r1) => Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * TAU - Math.PI / 2, r = i & 1 ? r1 : r0; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
  function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); }
  function flat(ctx, pts, c, a) { poly(ctx, pts); ctx.fillStyle = rgba(c, a); ctx.fill(); }

  /* ---------------- 1. wax line: hand wobble, pressure runs, overshooting closed loops ---------------- */
  function resample(pts, step) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
      for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
    return out;
  }
  function wax(ctx, pts, o) {
    const R = o.R, w = o.w || 1, c = o.c || C.ink;
    let src = pts;
    if (o.closed) { // start anywhere, go round once, then overshoot 7–20 % and drift outwards
      const n = pts.length, i0 = (R() * n) | 0, ov = Math.max(2, Math.round(n * R.r(0.07, 0.2)));
      src = [];
      for (let i = 0; i <= n + ov; i++) src.push(pts[(i0 + i) % n]);
    }
    const P = resample(src, 0.7), amp = o.wob === undefined ? 0.2 : o.wob, f1 = R.r(0.16, 0.3), ph = R() * TAU;
    let s = 0;
    const Q = P.map((p, i) => {
      if (i) s += Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]);
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const off = amp * Math.sin(s * f1 + ph) + R.j(amp * 0.15);
      return [p[0] + ((a[1] - b[1]) / l) * off, p[1] + ((b[0] - a[0]) / l) * off];
    });
    for (let i = 0; i < Q.length - 1;) { // pressure runs of 4–9 points
      const e = Math.min(Q.length - 1, i + 4 + ((R() * 6) | 0));
      ctx.beginPath(); ctx.moveTo(Q[i][0], Q[i][1]);
      for (let k = i + 1; k <= e; k++) ctx.lineTo(Q[k][0], Q[k][1]);
      ctx.lineWidth = w * R.r(0.86, 1.08); ctx.strokeStyle = rgba(c, R.r(0.8, 1)); ctx.stroke();
      i = e;
    }
  }

  /* ---------------- 2. zigzag scribble fill that goes outside the lines ---------------- */
  function scribble(ctx, pts, o) {
    const R = o.R, ang = o.ang === undefined ? -0.55 : o.ang, sp = o.sp || 1, w = o.w || sp * 1.05, over = o.over === undefined ? 0.6 : o.over;
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    let n0 = 1e9, n1 = -1e9;
    for (const p of pts) { const v = p[0] * nx + p[1] * ny; n0 = Math.min(n0, v); n1 = Math.max(n1, v); }
    const zig = [];
    let side = 0;
    for (let off = n0 + sp * 0.3; off < n1; off += sp * R.r(0.75, 1.25)) {
      let t0 = 1e9, t1 = -1e9;
      for (let i = 0; i < pts.length; i++) {
        const A = pts[i], B = pts[(i + 1) % pts.length], va = A[0] * nx + A[1] * ny - off, vb = B[0] * nx + B[1] * ny - off;
        if ((va < 0) === (vb < 0)) continue;
        const t = va / (va - vb), sv = (A[0] + (B[0] - A[0]) * t) * dx + (A[1] + (B[1] - A[1]) * t) * dy;
        t0 = Math.min(t0, sv); t1 = Math.max(t1, sv);
      }
      if (t0 > t1) continue;
      const sv = side ? t1 + over * R.r(-0.4, 1) : t0 - over * R.r(-0.4, 1); // overshoot or stop short
      zig.push([dx * sv + nx * off, dy * sv + ny * off]);
      side ^= 1;
    }
    ctx.lineWidth = w; ctx.strokeStyle = rgba(o.c, o.a === undefined ? 0.85 : o.a);
    ctx.beginPath();
    zig.forEach((p, i) => { if (!i) ctx.moveTo(p[0], p[1]); else { const q = zig[i - 1]; ctx.quadraticCurveTo((p[0] + q[0]) / 2 + R.j(sp * 0.5), (p[1] + q[1]) / 2 + R.j(sp * 0.5), p[0], p[1]); } });
    ctx.stroke();
  }
  /** The standard coloured-in shape: light wax layer + scribble + wobbly outline. */
  function shape(ctx, pts, fill, line, R, o) {
    o = o || {};
    if (fill) { flat(ctx, pts, fill, 0.4); scribble(ctx, pts, { R, c: fill, sp: o.sp || 0.95, ang: o.ang, over: o.over }); }
    if (line) wax(ctx, pts, { R, closed: true, w: o.lw || 0.9, c: line });
  }

  /* ---------------- 3. paper tooth: where the wax skips the valleys of the paper ---------------- */
  let TOOTH = null;
  function tooth() {
    if (TOOTH) return TOOTH;
    const N = 128, c = canvas(N, N), x = c.getContext('2d'), im = x.createImageData(N, N), R = rng(13);
    const v = new Float32Array(N * N);
    for (let i = 0; i < v.length; i++) v[i] = R();
    for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) { // smear the noise sideways a little – paper grain
      const s = v[y * N + xx] * 0.5 + v[y * N + ((xx + 1) % N)] * 0.3 + v[((y + 1) % N) * N + xx] * 0.2;
      im.data[(y * N + xx) * 4 + 3] = Math.max(0, Math.min(1, (s - 0.55) / 0.2)) * 235;
    }
    x.putImageData(im, 0, 0);
    return (TOOTH = c);
  }
  function applyTooth(ctx, w, h, k) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = k;
    ctx.fillStyle = ctx.createPattern(tooth(), 'repeat'); ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  /** Bake a drawing (world units, feet at 0,0) with tooth + a paper-white margin. */
  function bake(x0, y0, x1, y1, K, fn) {
    const pad = 2, ax = (pad - x0) * K, ay = (pad - y0) * K, w = (x1 - x0 + pad * 2) * K, h = (y1 - y0 + pad * 2) * K;
    const A = canvas(w, h), a = A.getContext('2d');
    a.setTransform(K, 0, 0, K, ax, ay); a.lineCap = 'round'; a.lineJoin = 'round';
    fn(a);
    applyTooth(a, A.width, A.height, 1);
    const M = canvas(w, h), m = M.getContext('2d');
    m.drawImage(A, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = PALETTE.paper; m.fillRect(0, 0, M.width, M.height);
    const O = canvas(w, h), o = O.getContext('2d');
    for (let i = 0; i < 12; i++) o.drawImage(M, Math.cos((i / 12) * TAU) * 0.9 * K, Math.sin((i / 12) * TAU) * 0.9 * K);
    o.drawImage(M, 0, 0); o.drawImage(A, 0, 0);
    return { c: O, ax, ay, K };
  }

  /* ---------------- characters (drawn facing right, feet at 0,0, ~30 units tall) ---------------- */
  function hero(ctx, R, ph) {
    const sw = Math.sin(ph * TAU), by = -Math.abs(Math.cos(ph * TAU)) * 1.3;
    shape(ctx, [[-3.4, -15.6 + by], [2.2, -15.9 + by], [-0.6, -11 + by], [-2.2, -3.4], [-5.6, -2.2], [-8.6, -3.6 + sw], [-12.2, -2.8 + sw], [-10.6, -9.6 + by], [-7, -14.8 + by]], C.red, C.ink, R, { ang: -0.9 });
    for (const s of [-1, 1]) {
      const foot = [s * 2 + sw * s * 3, -Math.max(0, -sw * s) * 1.8];
      wax(ctx, [[s * 1.5, -7 + by], foot], { R, w: 1.25 });
      flat(ctx, ell(foot[0] + 0.9, foot[1] - 0.4, 1.9, 1.15, 14), C.red, 0.9);
    }
    shape(ctx, [[-3.4, -15.5 + by], [3.4, -15.5 + by], [4.6, -6.4 + by], [-4.6, -6.4 + by]], C.blue, C.ink, R, { sp: 0.85 });
    flat(ctx, star(0.4, -11 + by, 2.4, 1.05), C.yellow, 1);
    for (const s of [-1, 1]) {
      const hx = s * (5.8 + sw * s * 1.6), hy = -10.2 + by;
      wax(ctx, [[s * 2.9, -14.2 + by], [hx, hy]], { R, w: 1.1 });
      flat(ctx, ell(hx, hy, 1.2, 1.2, 10), C.peach, 1);
    }
    const hx = 0.6, hy = -22.2 + by, head = blob(hx, hy, 7.1, 6.8, R, 0.025);
    shape(ctx, head, C.peach, C.ink, R, { sp: 0.85 });
    const hair = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI - 0.3 + (i / 16) * (Math.PI - 0.15), r = i & 1 ? 8.5 + R.j(0.7) : 6.9; hair.push([hx + Math.cos(a) * r, hy - 0.6 + Math.sin(a) * r * 0.95]); }
    hair.push([hx + 5.6, hy - 2.6], [hx + 2.8, hy - 3.2], [hx - 3.6, hy - 3], [hx - 6.2, hy + 0.6]);
    shape(ctx, hair, C.brown, C.ink, R, { ang: 0.9, sp: 0.75, lw: 0.75 });
    for (const ex of [hx + 0.3, hx + 4]) flat(ctx, ell(ex, hy + 0.4, 0.8, 1.1, 10), C.ink, 1);
    wax(ctx, Array.from({ length: 9 }, (_, i) => { const a = 0.35 + (i / 8) * 2.3; return [hx + 2.2 + Math.cos(a) * 2.5, hy + 2 + Math.sin(a) * 1.8]; }), { R, w: 0.6, wob: 0.06 });
    scribble(ctx, ell(hx + 6.2, hy + 2.6, 1.15, 0.85, 10), { R, c: C.pink, sp: 0.5, w: 0.6, over: 0.2 });
  }
  /** Small creature: a purple scribble monster with googly eyes. */
  function monster(ctx, R, ph) {
    const sw = Math.sin(ph * TAU), by = -Math.abs(Math.cos(ph * TAU)) * 1.4, cy = -11 + by;
    for (const s of [-1, 1]) wax(ctx, [[s * 2.6, -4.5 + by], [s * 3 + sw * s * 1.6, 0]], { R, w: 1.05 });
    wax(ctx, [[-6.4, cy], [-9.6, cy - 4.6 + sw]], { R, w: 1 });
    wax(ctx, [[6.6, cy], [10.2, cy - 4 - sw]], { R, w: 1 });
    const body = blob(0, cy, 8, 7.7, R, 0.07);
    flat(ctx, body, C.purple, 0.5);
    scribble(ctx, body, { R, c: C.purple, a: 0.9, sp: 0.9, ang: -0.7, over: 1.2 });
    wax(ctx, Array.from({ length: 12 }, () => { const a = R() * TAU, r = 7 * Math.sqrt(R()); return [Math.cos(a) * r, cy + Math.sin(a) * r]; }), { R, w: 0.55, c: C.darkPurple, wob: 0.1 });
    wax(ctx, blob(0, cy, 8.3, 7.9, R, 0.08), { R, closed: true, w: 0.9, wob: 0.35 });
    for (const [ex, ey, er] of [[1.2, cy - 2.6, 2.4], [5.2, cy - 2, 1.9]]) {
      flat(ctx, ell(ex, ey, er, er, 16), [255, 254, 250], 1);
      wax(ctx, ell(ex, ey, er, er, 16), { R, closed: true, w: 0.55, wob: 0.06 });
      flat(ctx, ell(ex + er * 0.35, ey + er * 0.15, er * 0.45, er * 0.45, 10), C.ink, 1);
    }
    const m = [[0, cy + 2.2], [6.8, cy + 1.8], [6, cy + 4.2], [3.4, cy + 5.4], [0.8, cy + 4.4]];
    flat(ctx, m, [70, 20, 40], 0.95);
    for (let k = 0; k < 3; k++) flat(ctx, [[1 + k * 2, cy + 2.1], [2.6 + k * 2, cy + 2], [1.8 + k * 2, cy + 3.6]], [255, 254, 250], 1);
  }

  /* ---------------- background: paper, grass patch, pond, dirt path, tree, house, sun ---------------- */
  let BG = null;
  function background(w, h) {
    if (BG && BG.w === w && BG.h === h) return BG.c;
    const S = h / 360, c = canvas(w, h), x = c.getContext('2d'), R = rng(7);
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.setTransform(S, 0, 0, S, 0, 0);
    const W = w / S;
    // big areas are coloured in short back-and-forth patches, each round, jittered and at its own angle
    const patches = (area, cx, cy, rx, ry, col, col2) => {
      x.save(); poly(x, area); x.clip();
      for (let py = cy - ry - 10; py < cy + ry + 10; py += 20) for (let px = cx - rx - 10; px < cx + rx + 10; px += 20) {
        const cell = blob(px + R.j(6), py + R.j(6), R.r(14, 19), R.r(13, 18), R, 0.1);
        scribble(x, cell, { R, c: R() < 0.22 ? col2 : col, a: 0.72, sp: 2.4, w: 2.6, ang: -0.6 + R.j(0.45), over: 3 });
      }
      x.restore();
      // the scribble also runs outside the lines: one more pass of patches along the edge, unclipped
      for (let i = 0; i < area.length; i += 3) scribble(x, blob(area[i][0], area[i][1], 5, 4, R, 0.1), { R, c: col, a: 0.6, sp: 2.4, w: 2.4, ang: -0.6 + R.j(0.4), over: 2 });
    };
    for (const [gx, gy, rx, ry] of [[W * 0.3, 250, 150, 90], [W * 0.85, 110, 120, 70]]) {
      const area = blob(gx, gy, rx, ry, R, 0.12);
      flat(x, area, C.green, 0.12);
      patches(area, gx, gy, rx, ry, C.green, C.lightGreen);
      for (let i = 0; i < 40; i++) { const a = R() * TAU, r = Math.sqrt(R()) * 0.85, tx = gx + Math.cos(a) * rx * r, ty = gy + Math.sin(a) * ry * r; for (let k = -1; k <= 1; k++) wax(x, [[tx + k, ty], [tx + k * 2, ty - 3.4]], { R, w: 0.7, c: C.darkGreen, wob: 0.05 }); }
    }
    // pond: white margin cut into the grass, blue patches, outline, waves
    const pond = blob(W * 0.62, 260, 58, 34, R, 0.1);
    x.save(); x.globalCompositeOperation = 'destination-out'; poly(x, blob(W * 0.62, 260, 63, 39, rng(3), 0.1)); x.fill(); x.restore();
    flat(x, pond, C.ghostBlue, 0.4);
    patches(pond, W * 0.62, 260, 58, 34, C.sky, C.blue);
    wax(x, pond, { R, closed: true, w: 1.5, c: C.blue, wob: 0.5 });
    for (let i = 0; i < 3; i++) wax(x, Array.from({ length: 13 }, (_, k) => [W * 0.62 - 26 + i * 20 + k, 252 + (i & 1) * 12 - Math.abs(Math.sin((k / 12) * Math.PI * 2)) * 1.6]), { R, w: 0.9, c: C.blue, wob: 0.1 });
    // dirt path: tan band + lengthwise strokes + brown edges
    const py = (t) => 330 - 26 * Math.sin(t / 120);
    const band = [];
    for (let t = -10; t <= W + 10; t += 8) band.push([t, py(t) - 10]);
    for (let t = W + 10; t >= -10; t -= 8) band.push([t, py(t) + 10]);
    flat(x, band, C.tan, 0.3);
    for (let o = -8; o <= 8; o += 2.8) wax(x, Array.from({ length: 40 }, (_, i) => { const t = -10 + (i / 39) * (W + 20); return [t, py(t) + o]; }), { R, w: 3, c: C.tan, wob: 0.4 });
    for (const s of [-1, 1]) wax(x, Array.from({ length: 60 }, (_, i) => { const t = -10 + (i / 59) * (W + 20); return [t, py(t) + s * 10.5]; }), { R, w: 1.3, c: C.brown, wob: 0.35 });
    // lollipop tree + house
    const tx = W * 0.14;
    shape(x, [[tx - 2.6, 230], [tx + 2.6, 230], [tx + 2.1, 207], [tx - 2.1, 207]], C.brown, C.brown, R, { ang: -1.45 });
    shape(x, puff(tx, 197, 14.2, 12.6, 7), C.green, C.darkGreen, R, { sp: 1.15, lw: 1.15, over: 1.4 });
    const hx = W * 0.46, hy = 300;
    shape(x, [[hx - 17, hy], [hx + 17, hy], [hx + 17, hy - 25], [hx - 17, hy - 25]], C.yellow, C.ink, R, { sp: 1.1 });
    shape(x, [[hx - 21.5, hy - 24], [hx + 21.5, hy - 24], [hx + 0.5, hy - 43]], C.red, C.ink, R, { ang: 0.5, sp: 1.1 });
    shape(x, [[hx - 3.8, hy], [hx + 3.8, hy], [hx + 3.8, hy - 13.5], [hx - 3.8, hy - 13.5]], C.brown, C.ink, R, { ang: -1.3 });
    for (const wx of [hx - 11, hx + 11]) { shape(x, [[wx - 3.8, hy - 20.5], [wx + 3.8, hy - 20.5], [wx + 3.8, hy - 13.5], [wx - 3.8, hy - 13.5]], C.sky, C.ink, R, { ang: 0.8 }); wax(x, [[wx, hy - 20.4], [wx, hy - 13.6]], { R, w: 0.6 }); }
    // the sun with a face in the corner
    const sx = W - 36, sy = 36;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; wax(x, [[sx + Math.cos(a) * 27, sy + Math.sin(a) * 27], [sx + Math.cos(a) * (i & 1 ? 37 : 44), sy + Math.sin(a) * (i & 1 ? 37 : 44)]], { R, w: 2.4, c: i & 1 ? C.orange : C.yellow, wob: 0.4 }); }
    const sun = blob(sx, sy, 23, 23, R, 0.03);
    flat(x, sun, C.yellow, 0.6);
    scribble(x, sun, { R, c: C.yellow, a: 0.95, sp: 2.2, w: 2.5, over: 2.5 });
    wax(x, sun, { R, closed: true, w: 2, c: C.orange, wob: 0.5 });
    for (const ex of [-8, 6]) flat(x, ell(sx + ex, sy - 4, 2.2, 3.2, 14), C.ink, 1);
    wax(x, Array.from({ length: 13 }, (_, i) => { const a = 0.35 + (i / 12) * 2.4; return [sx - 1 + Math.cos(a) * 11, sy + 3 + Math.sin(a) * 8]; }), { R, w: 1.8, wob: 0.2 });
    applyTooth(x, w, h, 0.92);
    // the paper goes underneath everything
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'destination-over';
    x.fillStyle = PALETTE.paper; x.fillRect(0, 0, w, h);
    BG = { w, h, c };
    return c;
  }

  /* ---------------- sprites: 4 walk frames x 3 boil variants, baked once per scale ---------------- */
  const CACHE = {};
  function sprite(kind, frame, variant, K) {
    const key = kind + frame + variant + '@' + K;
    if (!CACHE[key]) {
      const R = rng(1000 + frame * 13 + variant * 37 + (kind === 'hero' ? 0 : 500));
      CACHE[key] = kind === 'hero' ? bake(-14, -33, 12, 2, K, (c) => hero(c, R, frame / 4)) : bake(-11, -21, 11, 1, K, (c) => monster(c, R, frame / 4));
    }
    return CACHE[key];
  }
  function blit(ctx, s, x, y, scale, flip) {
    const k = scale / s.K;
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(s.c, -s.ax * k, -s.ay * k, s.c.width * k, s.c.height * k);
    ctx.restore();
  }
  const boil = (t) => Math.floor(t * 7) % 3; // every drawing is redrawn 7 times a second from 3 variants

  /** Main character, feet at (x, y). `scale` = px per world unit. */
  function drawHero(ctx, x, y, t, facing, scale) {
    scale = scale || 2.5;
    blit(ctx, sprite('hero', Math.floor(t * 8) & 3, boil(t), Math.ceil(scale)), x, y, scale, facing < 0);
  }
  /** Small creature, feet at (x, y). */
  function drawEnemy(ctx, x, y, t, scale) {
    scale = scale || 2.5;
    blit(ctx, sprite('monster', Math.floor(t * 6) & 3, boil(t), Math.ceil(scale)), x, y, scale, false);
  }
  function draw(ctx, w, h, t) {
    const S = h / 360;
    ctx.drawImage(background(w, h), 0, 0);
    const W = w / S;
    // scribbled shadows, then the cast
    const actors = [[W * 0.5 + Math.sin(t * 0.6) * 40, 238, 'hero'], [W * 0.25, 200, 'm'], [W * 0.75, 190, 'm'], [W * 0.38, 120, 'm'], [W * 0.68, 120, 'm']];
    for (const [ax, ay] of actors) { ctx.fillStyle = 'rgba(146,144,152,0.25)'; ctx.beginPath(); ctx.ellipse(ax * S, (ay + 0.5) * S, 7 * S, 2.4 * S, 0, 0, TAU); ctx.fill(); }
    actors.forEach(([ax, ay, k], i) => {
      if (k === 'hero') drawHero(ctx, ax * S, ay * S, t, Math.cos(t * 0.6) >= 0 ? 1 : -1, S);
      else drawEnemy(ctx, (ax + Math.sin(t * 0.8 + i) * 6) * S, ay * S, t + i * 0.3, S);
    });
  }

  const Starter = { id: 'crayon', name: 'Crayon Kids', palette: PALETTE, fonts: ['Gochi Hand', 'Patrick Hand', 'Caveat Brush', 'Schoolbell'], drawHero, drawEnemy, draw, wax, scribble, bake };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['crayon'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
