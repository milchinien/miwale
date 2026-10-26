/* Crayon Kids — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   A child's wax-crayon drawing: toothy white paper; every coloured shape is built up in wax layers – a light wash, a
   zigzag scribble printed a little off its outline (colouring that misses the lines), a cooler "shade crayon" hatched
   along the lower contour (light from above) and a wobbly black outline that overshoots its start. Three redrawn
   variants per drawing "boil" at 8 fps with a per-actor phase; poses are held on twos. Everything is baked once. */
(function (root) {
  'use strict';
  const PALETTE = {
    paper: '#fbf8ef', ink: '#2b2a30', red: '#e2362c', orange: '#f78b1f', yellow: '#fdce28', green: '#42ae3a',
    darkGreen: '#217a38', lightGreen: '#9ece3a', sky: '#42a8ea', blue: '#2a5ec8', purple: '#8c4cc4', darkPurple: '#5c2c8c',
    pink: '#f67eb4', brown: '#94582c', tan: '#d8a262', peach: '#fcc698', grey: '#929098', ghostBlue: '#a8d6f6',
    // shade crayons: each colour is shaded with a cooler partner, never with a darker copy of itself
    pine: '#166856', crimson: '#b01c4a', indigo: '#3a3096', sepia: '#68382c', slate: '#606284', salmon: '#ee8070', magenta: '#ce3e94',
  };
  const SHADE = { green: 'pine', lightGreen: 'green', darkGreen: 'pine', red: 'crimson', orange: 'red', yellow: 'orange', blue: 'indigo', sky: 'blue',
    purple: 'indigo', pink: 'magenta', peach: 'salmon', brown: 'sepia', tan: 'brown', grey: 'slate', ghostBlue: 'blue' };
  const TAU = Math.PI * 2;
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const C = {}, SH = new Map();
  for (const k in PALETTE) C[k] = hex(PALETTE[k]);
  for (const k in SHADE) SH.set(C[k], C[SHADE[k]]);
  const WHITE = [255, 254, 250];
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
  const blob = (cx, cy, rx, ry, R, lump) => { const p1 = R() * TAU, p2 = R() * TAU; return Array.from({ length: 40 }, (_, i) => { const a = (i / 40) * TAU, k = 1 + (lump || 0.06) * (Math.sin(a * 3 + p1) + 0.5 * Math.sin(a * 5 + p2)); return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; }); };
  const puff = (cx, cy, rx, ry, bumps) => Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * TAU, k = 0.84 + 0.2 * Math.abs(Math.sin((a * bumps) / 2)); return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
  const star = (x, y, r0, r1) => Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * TAU - Math.PI / 2, r = i & 1 ? r1 : r0; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
  function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); }
  let SKETCH = false; // bake mode for the "being drawn" entrance: only thin slate construction lines, no colour
  function flat(ctx, pts, c, a) { if (SKETCH) return; poly(ctx, pts); ctx.fillStyle = rgba(c, a); ctx.fill(); }

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
    const R = o.R;
    let w = o.w || 1, c = o.c || C.ink, al = o.a === undefined ? 1 : o.a;
    if (SKETCH) { c = C.slate; al *= 0.6; w *= 0.55; }
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
    for (let i = 0; i < Q.length - 1;) { // pressure runs of 4–9 points that taper at both ends of the line
      const e = Math.min(Q.length - 1, i + 4 + ((R() * 6) | 0)), u = (i + e) / 2 / (Q.length - 1);
      ctx.beginPath(); ctx.moveTo(Q[i][0], Q[i][1]);
      for (let k = i + 1; k <= e; k++) ctx.lineTo(Q[k][0], Q[k][1]);
      ctx.lineWidth = w * (0.55 + 0.45 * Math.min(1, Math.sin(Math.PI * u) * 2.2)) * R.r(0.86, 1.08);
      ctx.strokeStyle = rgba(c, al * R.r(0.8, 1)); ctx.stroke();
      i = e;
    }
  }

  /* ---------------- 2. zigzag scribble fill that goes outside the lines ---------------- */
  function spanAt(pts, nx, ny, dx, dy, off) { // extent along (dx,dy) of the polygon on the line {p·n = off}
    let t0 = 1e9, t1 = -1e9;
    for (let i = 0; i < pts.length; i++) {
      const A = pts[i], B = pts[(i + 1) % pts.length], va = A[0] * nx + A[1] * ny - off, vb = B[0] * nx + B[1] * ny - off;
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb), sv = (A[0] + (B[0] - A[0]) * t) * dx + (A[1] + (B[1] - A[1]) * t) * dy;
      t0 = Math.min(t0, sv); t1 = Math.max(t1, sv);
    }
    return t0 > t1 ? null : [t0, t1];
  }
  function strokeZig(ctx, zig, c, a, w, sp, R) {
    if (zig.length < 2) return;
    ctx.lineWidth = w; ctx.strokeStyle = rgba(c, a);
    ctx.beginPath();
    zig.forEach((p, i) => { if (!i) ctx.moveTo(p[0], p[1]); else { const q = zig[i - 1]; ctx.quadraticCurveTo((p[0] + q[0]) / 2 + R.j(sp * 0.5), (p[1] + q[1]) / 2 + R.j(sp * 0.5), p[0], p[1]); } });
    ctx.stroke();
  }
  function scribble(ctx, pts, o) {
    if (SKETCH) return;
    const R = o.R, ang = o.ang === undefined ? -0.55 : o.ang, sp = o.sp || 1, over = o.over === undefined ? 0.6 : o.over;
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    let n0 = 1e9, n1 = -1e9;
    for (const p of pts) { const v = p[0] * nx + p[1] * ny; n0 = Math.min(n0, v); n1 = Math.max(n1, v); }
    const zig = [];
    let side = 0;
    for (let off = n0 + sp * 0.3; off < n1; off += sp * R.r(0.75, 1.25)) {
      const iv = spanAt(pts, nx, ny, dx, dy, off);
      if (!iv) continue;
      const sv = side ? iv[1] + over * R.r(-0.4, 1) : iv[0] - over * R.r(-0.4, 1); // overshoot or stop short
      zig.push([dx * sv + nx * off, dy * sv + ny * off]);
      side ^= 1;
    }
    strokeZig(ctx, zig, o.c, o.a === undefined ? 0.85 : o.a, o.w || sp * 1.05, sp, R);
  }
  /** Shade crayon: the cooler partner hatched up and down in a crescent along the LOWER contour (light from above). */
  function shadeBand(ctx, pts, o) {
    if (SKETCH) return;
    const R = o.R, sp = o.sp || 0.9;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const thick = (y1 - y0) * (o.h === undefined ? 0.34 : o.h), cx = (x0 + x1) / 2, hw = (x1 - x0) / 2, zig = [];
    let side = 0;
    for (let x = x0 + sp * 0.3; x < x1 - sp * 0.2; x += sp * 0.82 * R.r(0.8, 1.2)) {
      const iv = spanAt(pts, 1, 0, 0, 1, x);
      if (!iv) continue;
      const q = (x - cx) / hw, th = Math.min(iv[1] - iv[0], thick * (0.5 + 0.5 * (1 - q * q))) * R.r(0.8, 1.12);
      if (th < sp * 0.45) continue;
      zig.push(side ? [x, iv[1] + R.r(-0.3, 0.4)] : [x + sp * 0.5, iv[1] - th]);
      side ^= 1;
    }
    strokeZig(ctx, zig, o.c, o.a === undefined ? 0.6 : o.a, o.w || sp * 1.05, sp, R);
  }
  /** The coloured-in shape: wash + scribble printed a little off the outline + shade crayon + wobbly outline. */
  const MIS = [0.7, 0.5];
  function shape(ctx, pts, fill, line, R, o) {
    o = o || {};
    if (fill) {
      const m = o.mis === undefined ? 0.35 : o.mis, fp = pts.map((p) => [p[0] + MIS[0] * m, p[1] + MIS[1] * m]);
      flat(ctx, fp, fill, 0.4);
      scribble(ctx, fp, { R, c: fill, sp: o.sp || 0.95, ang: o.ang, over: o.over });
      if (o.sh !== 0) shadeBand(ctx, fp, { R, c: o.sc || SH.get(fill) || C.indigo, h: o.sh === undefined ? 0.34 : o.sh, sp: (o.sp || 0.95) * 0.85 });
    }
    if (line) wax(ctx, pts, { R, closed: true, w: o.lw || 0.9, c: line, wob: o.wob });
  }

  /* ---------------- 3. paper tooth + bake (sprite with a paper-white margin) ---------------- */
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
  let bakes = 0;
  function bake(x0, y0, x1, y1, K, fn, opt) {
    opt = opt || {};
    const pad = 2, ax = (pad - x0) * K, ay = (pad - y0) * K, w = (x1 - x0 + pad * 2) * K, h = (y1 - y0 + pad * 2) * K;
    const A = canvas(w, h), a = A.getContext('2d');
    a.setTransform(K, 0, 0, K, ax, ay); a.lineCap = 'round'; a.lineJoin = 'round';
    const ma = (bakes++ * 2.39996) % TAU; // each drawing misses its lines in its own direction
    MIS[0] = Math.cos(ma); MIS[1] = Math.sin(ma) * 0.7 + 0.25;
    SKETCH = !!opt.sketch;
    try { fn(a); } finally { SKETCH = false; }
    applyTooth(a, A.width, A.height, opt.sketch ? 0.5 : 1);
    if (opt.halo === 0) return { c: A, ax, ay, K };
    const M = canvas(w, h), m = M.getContext('2d');
    m.drawImage(A, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = PALETTE.paper; m.fillRect(0, 0, M.width, M.height);
    const O = canvas(w, h), o = O.getContext('2d');
    for (let i = 0; i < 12; i++) o.drawImage(M, Math.cos((i / 12) * TAU) * 0.9 * K, Math.sin((i / 12) * TAU) * 0.9 * K);
    o.drawImage(M, 0, 0); o.drawImage(A, 0, 0);
    return { c: O, ax, ay, K };
  }

  /* ---------------- characters (drawn facing right, feet at 0,0, ~30 units tall) ---------------- */
  /** Main character, walk drawing f of 8: contact – down – passing – up per side; arms counter-swing, hair lags. */
  function hero(ctx, R, f) {
    const th = (TAU * f) / 8, bob = (p) => 0.35 - 1.35 * (1 - Math.abs(Math.cos(p)));
    const by = bob(th - 0.45), hb = bob(th - 1.2), sw = Math.cos(th), wv = (i) => Math.sin(2 * th - 1.1 - i * 0.8);
    shape(ctx, [[-3.4, -15.6 + by], [2.2, -15.9 + by], [-0.6, -11 + by], [-2.8, -3.6 + wv(0) * 0.4], [-6.2, -2.4 + wv(0.5) * 0.8], [-9.6, -3.6 + wv(1)], [-13.6, -2.8 + wv(1.6) * 1.4], [-11.4, -9.6 + by], [-7.4, -14.6 + by]], C.red, C.ink, R, { ang: 0.9 });
    for (const s of [-1, 1]) { // legs: one plants (contact) while the other lifts and passes
      const t = th + (s > 0 ? 0 : Math.PI), foot = [3.7 * Math.cos(t) + 0.5, -2.5 * Math.max(0, -Math.sin(t))];
      wax(ctx, [[s * 1.4, -7.3 + by], foot], { R, w: 1.25 });
      flat(ctx, ell(foot[0] + 0.9, foot[1] - 0.4, 1.9, 1.15, 14), C.red, 0.95);
      wax(ctx, ell(foot[0] + 0.9, foot[1] - 0.4, 1.9, 1.15, 14), { R, closed: true, w: 0.5, c: C.crimson, wob: 0.05 });
    }
    shape(ctx, [[-3.4, -15.5 + by], [3.4, -15.5 + by], [4.6, -6.4 + by], [-4.6, -6.4 + by]], C.blue, C.ink, R, { sp: 0.85 });
    flat(ctx, star(0.4, -11 + by, 2.4, 1.05), C.yellow, 1);
    for (const [s, hx] of [[-1, -2.2 + 3.3 * sw], [1, 3.4 - 3.5 * sw]]) { // arms swing against the legs
      const hy = -9.4 - 0.8 * Math.abs(sw) + by;
      wax(ctx, [[s * 2.9, -14.2 + by], [hx, hy]], { R, w: 1.1 });
      flat(ctx, ell(hx, hy, 1.2, 1.2, 10), C.peach, 1);
    }
    const hx = 0.6, hy = -22.2 + hb, head = blob(hx, hy, 7.1, 6.8, R, 0.025);
    shape(ctx, head, C.peach, C.ink, R, { sp: 0.85, sh: 0.3 });
    const hair = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI - 0.3 + (i / 16) * (Math.PI - 0.15), r = i & 1 ? 8.5 + R.j(0.7) : 6.9; hair.push([hx + Math.cos(a) * r, hy - 0.6 + Math.sin(a) * r * 0.95]); }
    hair.push([hx + 5.6, hy - 2.6], [hx + 2.8, hy - 3.2], [hx - 3.6, hy - 3], [hx - 6.2, hy + 0.6]);
    shape(ctx, hair, C.brown, C.ink, R, { ang: 0.9, sp: 0.75, lw: 0.75 });
    const tuft = -0.25 + 0.5 * Math.sin(2 * th - 2.0); // the hair curl lags the head: follow-through
    wax(ctx, [[hx, hy - 8], [hx + Math.sin(tuft) * 3, hy - 11], [hx + Math.sin(tuft) * 5 + 1.5, hy - 10.4]], { R, w: 0.8, c: C.brown, wob: 0.05 });
    for (const ex of [hx + 0.3, hx + 4]) { flat(ctx, ell(ex, hy + 0.4, 0.8, 1.1, 10), C.ink, 1); flat(ctx, ell(ex + 0.25, hy, 0.25, 0.3, 6), WHITE, 1); }
    wax(ctx, Array.from({ length: 9 }, (_, i) => { const a = 0.35 + (i / 8) * 2.3; return [hx + 2.2 + Math.cos(a) * 2.5, hy + 2 + Math.sin(a) * 1.8]; }), { R, w: 0.6, wob: 0.06 });
    scribble(ctx, ell(hx + 6.2, hy + 2.6, 1.15, 0.85, 10), { R, c: C.pink, sp: 0.5, w: 0.6, over: 0.2 });
  }
  /** Small creature, waddle drawing f of 6: squash on contact, stretch on the passing pose, arms lag behind. */
  function monster(ctx, R, f) {
    const th = (TAU * f) / 6, c2 = Math.cos(2 * th), by = -1.6 * (1 - Math.abs(Math.cos(th))), sw = Math.sin(th);
    for (const s of [-1, 1]) wax(ctx, [[s * 2.6, -4.5 + by], [s * 3 + sw * s * 1.6, -Math.max(0, sw * s) * 1.4]], { R, w: 1.05 });
    ctx.save(); ctx.translate(0, by - 4); ctx.scale(1 + 0.07 * c2, 1 - 0.08 * c2); ctx.translate(0, -7);
    wax(ctx, [[-6.4, 0], [-9.6, -4.6 + Math.sin(th - 0.8)]], { R, w: 1 });
    wax(ctx, [[6.6, 0], [10.2, -4 - Math.sin(th - 0.8)]], { R, w: 1 });
    for (const s of [-1, 1]) shape(ctx, [[s * 3.4, -6.4], [s * 5.8, -11], [s * 6.2, -5.6]], C.yellow, C.ink, R, { sp: 0.6, lw: 0.6, sh: 0.45 });
    const body = blob(0, 0, 8, 7.7, R, 0.07);
    shape(ctx, body, C.purple, null, R, { sp: 0.9, ang: -0.7, over: 1.2, sh: 0.4 });
    wax(ctx, Array.from({ length: 12 }, () => { const a = R() * TAU, r = 7 * Math.sqrt(R()); return [Math.cos(a) * r, Math.sin(a) * r]; }), { R, w: 0.55, c: C.darkPurple, wob: 0.1 });
    wax(ctx, blob(0, 0, 8.3, 7.9, R, 0.08), { R, closed: true, w: 0.9, wob: 0.35 });
    const lag = Math.sin(th - 1.2) * 0.4; // googly pupils lag the bounce
    for (const [ex, ey, er] of [[1.2, -2.6, 2.4], [5.2, -2, 1.9]]) {
      flat(ctx, ell(ex, ey, er, er, 16), WHITE, 1);
      wax(ctx, ell(ex, ey, er, er, 16), { R, closed: true, w: 0.55, wob: 0.06 });
      flat(ctx, ell(ex + er * 0.35, ey + er * 0.15 + lag, er * 0.45, er * 0.45, 10), C.ink, 1);
    }
    const m = [[0, 2.2], [6.8, 1.8], [6, 4.2], [3.4, 5.4], [0.8, 4.4]];
    flat(ctx, m, [70, 20, 40], 0.95);
    for (let k = 0; k < 3; k++) flat(ctx, [[1 + k * 2, 2.1], [2.6 + k * 2, 2], [1.8 + k * 2, 3.6]], WHITE, 1);
    ctx.restore();
  }
  /** Crossing out: black scribble of growing density (each level redraws the lower ones with the same strokes). */
  function scratch(ctx, lvl) {
    for (let l = 0; l <= lvl; l++) scribble(ctx, ell(0, 0, 9, 9, 20), { R: rng(4000 + l * 11), c: C.ink, a: 0.85, sp: 3.2 - l * 0.8, w: 0.95, ang: -0.6 + l * 1.1, over: 1.3 });
  }

  /* ---------------- background: a composed child's picture (hill, road, stream + bridge, field, house, sun) ---------------- */
  let BG = null;
  function background(w, h) {
    if (BG && BG.w === w && BG.h === h) return BG.c;
    const S = h / 360, c = canvas(w, h), x = c.getContext('2d'), R = rng(7), W = w / S;
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.setTransform(S, 0, 0, S, 0, 0);
    const roadY = (t) => 132 + 16 * Math.sin(t / 130), riverX = (y) => W * 0.62 + 24 * Math.sin(y / 70) + 8 * Math.sin(y / 23);
    // big areas are coloured in short back-and-forth patches, each at its own angle (never one long hatch)
    const patches = (area, col, col2, cell) => {
      x.save(); poly(x, area); x.clip();
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      for (const p of area) { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); }
      for (let py = by0 - 6; py < by1 + 6; py += cell * 0.78) for (let px = bx0 - 6; px < bx1 + 6; px += cell * 0.78) {
        scribble(x, blob(px + R.j(5), py + R.j(5), cell * 0.62, cell * 0.58, R, 0.1), { R, c: R() < 0.22 ? col2 : col, a: 0.72, sp: 2.5, w: 2.6, ang: -0.6 + R.j(0.4), over: 3 });
      }
      x.restore();
    };
    // 1. a grassy hill: patches, a second crayon on top, shade crayon in a band along the LOWER contour,
    //    a "WWW" grass fringe along the upper edge and a firm pine line along the lower edge
    const hill = blob(W * 0.27, 262, Math.min(150, W * 0.2), 72, R, 0.1);
    flat(x, hill, C.green, 0.1);
    patches(hill, C.green, C.lightGreen, 26);
    shadeBand(x, hill, { R, c: C.pine, h: 0.28, sp: 2.4, w: 2.3, a: 0.6 });
    const hc = W * 0.27;
    for (let i = 0; i < hill.length; i++) {
      const p = hill[i], q = hill[(i + 1) % hill.length], up = p[1] < 262 - 18;
      if (up) for (let k = 0; k < 3; k++) { const t = k / 3, bx = p[0] + (q[0] - p[0]) * t, byy = p[1] + (q[1] - p[1]) * t; wax(x, [[bx, byy + 0.6], [bx + R.j(0.6) + (bx - hc) * 0.01, byy - R.r(2.2, 4)], [bx + (q[0] - p[0]) / 3, byy + (q[1] - p[1]) / 3 + 0.6]], { R, w: 0.9, c: C.darkGreen, wob: 0.05 }); }
      else wax(x, [p, q], { R, w: 1.3, c: C.pine, a: 0.75, wob: 0.1 });
    }
    // 2. a striped crop field below the road: yellow base, orange rows, little "v" ears, orange outline
    const fq = [[W * 0.72, 182], [W * 0.96, 186], [W * 0.98, 250], [W * 0.71, 254]];
    const fp = (u, v) => { const a = [fq[0][0] + (fq[1][0] - fq[0][0]) * u, fq[0][1] + (fq[1][1] - fq[0][1]) * u], b = [fq[3][0] + (fq[2][0] - fq[3][0]) * u, fq[3][1] + (fq[2][1] - fq[3][1]) * u]; return [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v]; };
    flat(x, fq, C.yellow, 0.14);
    patches(fq, C.yellow, C.yellow, 28);
    for (let r = 0; r < 10; r++) {
      const v = (r + 0.6) / 10;
      wax(x, Array.from({ length: 11 }, (_, i) => fp(0.03 + (i / 10) * 0.94, v)), { R, w: 1.2, c: C.orange, a: 0.7, wob: 0.3 });
      for (let i = 0; i < 26; i++) { if (R() < 0.3) continue; const p = fp(0.06 + (i / 26) * 0.88, v), hh = R.r(2.2, 3.2); wax(x, [[p[0] - 1.3, p[1] - hh], p, [p[0] + 1.3, p[1] - hh]], { R, w: 0.7, c: i % 4 === 1 ? C.brown : C.orange, a: 0.8, wob: 0 }); }
    }
    shadeBand(x, fq, { R, c: C.orange, h: 0.15, sp: 2.4, w: 2, a: 0.42 });
    wax(x, fq, { R, closed: true, w: 1.25, c: C.orange, a: 0.9, wob: 0.35 });
    // 3. a stream: white margin cut free, pale wash, lengthwise sky strokes, deeper blue middle, shaded east bank, blue banks
    const band = (o) => { const b = []; for (let y = -10; y <= 370; y += 6) b.push([riverX(y) - o, y]); for (let y = 370; y >= -10; y -= 6) b.push([riverX(y) + o, y]); return b; };
    x.save(); x.globalCompositeOperation = 'destination-out'; poly(x, band(12.5)); x.fill(); x.restore();
    flat(x, band(8.6), C.ghostBlue, 0.42);
    for (let o = -7.2; o <= 7.4; o += R.r(2.3, 3)) {
      const deep = Math.abs(o) < 3.6;
      for (let y0 = -10; y0 < 370; y0 += 36) wax(x, [[riverX(y0) + o, y0], [riverX(y0 + 20) + o + R.j(1), y0 + 20], [riverX(y0 + 40) + o, y0 + 40]], { R, w: R.r(2.4, 3), c: deep ? C.blue : C.sky, a: deep ? 0.45 : 0.7, wob: 0.3 });
    }
    for (let y0 = -10; y0 < 370; y0 += 40) wax(x, [[riverX(y0) + 7, y0], [riverX(y0 + 40) + 7, y0 + 40]], { R, w: 1.8, c: C.indigo, a: 0.38, wob: 0.2 });
    for (const s of [-1, 1]) wax(x, Array.from({ length: 64 }, (_, i) => { const y = -10 + i * 6; return [riverX(y) + s * 9, y]; }), { R, w: 1.35, c: C.blue, wob: 0.35 });
    // 4. the dirt road over everything: lengthwise tan strokes, brown ruts along the lower edge, wobbly brown edges
    const road = []; for (let t = -10; t <= W + 10; t += 8) road.push([t, roadY(t) - 10.5]); for (let t = W + 10; t >= -10; t -= 8) road.push([t, roadY(t) + 10.5]);
    x.save(); x.globalCompositeOperation = 'destination-out'; x.lineWidth = 29; x.beginPath(); for (let t = -10; t <= W + 10; t += 8) x.lineTo(t, roadY(t)); x.stroke(); x.restore();
    flat(x, road, C.tan, 0.26);
    for (let o = -8; o <= 8; o += 2.8) wax(x, Array.from({ length: 40 }, (_, i) => { const t = -10 + (i / 39) * (W + 20); return [t, roadY(t) + o]; }), { R, w: 3, c: C.tan, a: 0.7, wob: 0.4 });
    wax(x, Array.from({ length: 40 }, (_, i) => { const t = -10 + (i / 39) * (W + 20); return [t, roadY(t) + 8]; }), { R, w: 1.8, c: C.brown, a: 0.45, wob: 0.3 });
    for (const s of [-1, 1]) wax(x, Array.from({ length: 60 }, (_, i) => { const t = -10 + (i / 59) * (W + 20); return [t, roadY(t) + s * 10.5]; }), { R, w: 1.3, c: C.brown, wob: 0.35 });
    // 5. plank bridge where the road crosses the stream: opaque deck, plank seams across, rails with posts
    let by = 132, bx = 0; for (let i = 0; i < 5; i++) { bx = riverX(by); by = roadY(bx); }
    const deck = [[bx - 16, roadY(bx - 16) - 12], [bx + 16, roadY(bx + 16) - 12], [bx + 16, roadY(bx + 16) + 12], [bx - 16, roadY(bx - 16) + 12]];
    flat(x, deck, [232, 205, 165], 1);
    scribble(x, deck, { R, c: [198, 145, 90], a: 0.85, sp: 1.2, w: 1.3, ang: 1.45, over: 0.3 });
    for (let px = bx - 13.5; px < bx + 15; px += 2.8) wax(x, [[px, roadY(px) - 11.5], [px, roadY(px) + 11.5]], { R, w: 0.7, c: C.sepia, a: 0.8, wob: 0.05 });
    for (const s of [-1, 1]) { wax(x, [[bx - 17, roadY(bx - 17) + s * 12.4], [bx + 17, roadY(bx + 17) + s * 12.4]], { R, w: 1.7, c: C.brown, wob: 0.2 }); for (const px of [bx - 16, bx, bx + 16]) flat(x, ell(px, roadY(px) + s * 12.4, 1.25, 1.25, 10), C.sepia, 1); }
    // 6. a house and a lollipop tree above the road (shade crayon under the eave, warm lit windows)
    const hx = W * 0.22, hy = roadY(W * 0.22) - 24, tx = W * 0.09, ty = roadY(W * 0.09) - 30;
    shape(x, [[tx - 2.6, ty], [tx + 2.6, ty], [tx + 2.1, ty - 22], [tx - 2.1, ty - 22]], C.brown, C.sepia, R, { ang: -1.45, sh: 0 });
    shape(x, puff(tx, ty - 33, 14.2, 12.6, 7), C.green, C.darkGreen, R, { sp: 1.15, lw: 1.15, over: 1.4, sh: 0.36 });
    for (const [ax, ay] of [[-6, -29], [5, -36], [7.5, -28], [-1, -38]]) flat(x, ell(tx + ax, ty + ay, 1.6, 1.6, 10), C.red, 1);
    shape(x, [[hx - 17, hy], [hx + 17, hy], [hx + 17, hy - 25], [hx - 17, hy - 25]], C.yellow, C.ink, R, { sp: 1.1, sh: 0 });
    scribble(x, [[hx - 16.4, hy - 24.6], [hx + 16.4, hy - 24.6], [hx + 16.4, hy - 20.8], [hx - 16.4, hy - 21.6]], { R, c: C.orange, a: 0.55, sp: 0.9, w: 1, ang: 1.1, over: 0.2 });
    shape(x, [[hx - 21.5, hy - 24], [hx + 21.5, hy - 24], [hx + 0.5, hy - 43]], C.red, C.ink, R, { ang: 0.5, sp: 1.1, sh: 0.22 });
    shape(x, [[hx - 3.8, hy], [hx + 3.8, hy], [hx + 3.8, hy - 13.5], [hx - 3.8, hy - 13.5]], C.brown, C.ink, R, { ang: -1.3, sh: 0.25 });
    for (const wx of [hx - 11, hx + 11]) { shape(x, [[wx - 3.8, hy - 20.5], [wx + 3.8, hy - 20.5], [wx + 3.8, hy - 13.5], [wx - 3.8, hy - 13.5]], C.sky, C.ink, R, { ang: 0.8, sc: C.yellow }); wax(x, [[wx, hy - 20.4], [wx, hy - 13.6]], { R, w: 0.6 }); wax(x, [[wx - 3.7, hy - 17], [wx + 3.7, hy - 17]], { R, w: 0.6 }); }
    // 7. the sun with a face in the corner (orange shade crayon along its lower rim)
    const sx = W - 36, sy = 36;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; wax(x, [[sx + Math.cos(a) * 27, sy + Math.sin(a) * 27], [sx + Math.cos(a) * (i & 1 ? 37 : 44), sy + Math.sin(a) * (i & 1 ? 37 : 44)]], { R, w: 2.4, c: i & 1 ? C.orange : C.yellow, wob: 0.4 }); }
    const sun = blob(sx, sy, 23, 23, R, 0.03);
    flat(x, sun, C.yellow, 0.6);
    scribble(x, sun, { R, c: C.yellow, a: 0.95, sp: 2.2, w: 2.5, over: 2.5 });
    shadeBand(x, sun, { R, c: C.orange, h: 0.32, sp: 2.2, w: 2.4, a: 0.55 });
    wax(x, sun, { R, closed: true, w: 2, c: C.orange, wob: 0.5 });
    for (const ex of [-8, 6]) flat(x, ell(sx + ex, sy - 4, 2.2, 3.2, 14), C.ink, 1);
    wax(x, Array.from({ length: 13 }, (_, i) => { const a = 0.35 + (i / 12) * 2.4; return [sx - 1 + Math.cos(a) * 11, sy + 3 + Math.sin(a) * 8]; }), { R, w: 1.8, wob: 0.2 });
    applyTooth(x, w, h, 0.92);
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'destination-over'; // the paper goes underneath everything
    x.fillStyle = PALETTE.paper; x.fillRect(0, 0, w, h);
    BG = { w, h, c, riverX };
    return c;
  }

  /* ---------------- sprites: baked once per scale (8 walk + 6 waddle drawings x 3 boil variants) ---------------- */
  const CACHE = {};
  function sprite(kind, frame, variant, K) {
    const key = kind + frame + '/' + variant + '@' + K;
    if (!CACHE[key]) {
      const R = rng(1000 + frame * 13 + variant * 37 + (kind === 'hero' ? 0 : 500));
      if (kind === 'hero') CACHE[key] = bake(-15, -35, 12, 2, K, (c) => hero(c, R, frame));
      else if (kind === 'scratch') CACHE[key] = bake(-10, -10, 10, 10, K, (c) => scratch(c, frame), { halo: 0 });
      else CACHE[key] = bake(-11, -24, 11, 1, K, (c) => monster(c, R, frame), kind === 'sketch' ? { sketch: true, halo: 0 } : null);
    }
    return CACHE[key];
  }
  function blit(ctx, s, x, y, scale, flip, sx, sy) {
    const k = scale / s.K;
    ctx.save(); ctx.translate(x, y); ctx.scale((flip ? -1 : 1) * (sx || 1), sy || 1);
    ctx.drawImage(s.c, -s.ax * k, -s.ay * k, s.c.width * k, s.c.height * k);
    ctx.restore();
  }
  const boil = (t, ph) => Math.floor(t * 8 + ph * 5.3) % 3; // 3 variants, 8 redraws/s, per-actor phase: no lock-step flicker
  const twos = (t) => Math.floor(t * 12) / 12; // poses are held for two frames, like hand-drawn animation

  /** Main character, feet at (x, y). `scale` = px per world unit. */
  function drawHero(ctx, x, y, t, facing, scale) {
    scale = scale || 2.5;
    blit(ctx, sprite('hero', Math.floor(twos(t) * 10) & 7, boil(t, 0.37), Math.ceil(scale)), x, y, scale, facing < 0);
  }
  /** Small creature, feet at (x, y); ph = per-actor phase (0..1). */
  function drawEnemy(ctx, x, y, t, scale, ph) {
    scale = scale || 2.5; ph = ph || 0;
    blit(ctx, sprite('monster', Math.floor(twos(t) * 7.8 + ph * 6) % 6, boil(t, ph), Math.ceil(scale)), x, y, scale, true);
  }
  /** A creature that is drawn in, lives, and is scribbled out again – the entrance and removal of the style (3 s loop). */
  function drawLifecycle(ctx, x, y, t, scale) {
    const K = Math.ceil(scale), u = (t % 3) / 3, v = boil(t, 0.6), s = sprite('monster', 0, v, K), k = scale / s.K;
    const dx = x - s.ax * k, dy = y - s.ay * k;
    if (u < 0.1) { // a grey construction sketch is drawn left to right, the crayon tip running ahead
      const sk = sprite('sketch', 0, v, K), cols = Math.max(1, Math.round(sk.c.width * (u / 0.1)));
      ctx.drawImage(sk.c, 0, 0, cols, sk.c.height, dx, dy, cols * k, sk.c.height * k);
    } else if (u < 0.3) { // colour is filled in from the top down
      const sk = sprite('sketch', 0, v, K), rows = Math.max(1, Math.round(s.c.height * ((u - 0.1) / 0.2)));
      ctx.drawImage(sk.c, dx, dy, sk.c.width * k, sk.c.height * k);
      ctx.drawImage(s.c, 0, 0, s.c.width, rows, dx, dy, s.c.width * k, rows * k);
    } else if (u < 0.34) blit(ctx, s, x, y, scale, false, 0.94, 1.1); // the finished drawing pops (stretch)
    else if (u < 0.75) blit(ctx, sprite('monster', Math.floor(twos(t) * 7.8 + 3.6) % 6, v, K), x, y, scale, false);
    else if (u < 0.9) { // scribbled out in three steps while it shivers
      const lvl = Math.min(2, Math.floor((u - 0.75) / 0.05)), sh = (Math.floor(t * 24) & 1) ? 0.7 : -0.7;
      blit(ctx, s, x + sh * scale, y, scale, false, 1.06, 0.95);
      blit(ctx, sprite('scratch', lvl, v, K), x + sh * scale, y - 11 * scale, scale, false, 1.1, 1.1);
    } else { // it melts flat into the paper; the scribble knot drops and fades
      const q = (u - 0.9) / 0.1, e = q * q;
      ctx.globalAlpha = Math.max(0, 1 - q * 1.5); blit(ctx, s, x, y, scale, false, 1 + 0.35 * e, Math.max(0.12, 1 - 0.88 * e));
      ctx.globalAlpha = 1 - e; blit(ctx, sprite('scratch', 2, v, K), x, y - 11 * scale * (1 - e * 0.85), scale, false, 1.1 - 0.6 * e, 1.1 - 0.6 * e);
      ctx.globalAlpha = 1;
    }
  }
  function draw(ctx, w, h, t) {
    const S = h / 360;
    ctx.drawImage(background(w, h), 0, 0);
    const W = w / S, hx = W * 0.44 + Math.sin(t * 0.5) * 34;
    const cast = [[W * 0.24, 250, 0.1], [W * 0.34, 286, 0.45], [W * 0.82, 222, 0.8], [W * 0.52, 318, 0.3]];
    // contact shadows: flat slate ellipses, light, never blurred
    ctx.fillStyle = 'rgba(96,98,132,0.16)';
    for (const [ax, ay] of [[hx, 236], ...cast, [W * 0.84, 300]]) { ctx.beginPath(); ctx.ellipse(ax * S, (ay + 0.5) * S, 7 * S, 2.3 * S, 0, 0, TAU); ctx.fill(); }
    cast.forEach(([ax, ay, ph]) => drawEnemy(ctx, (ax + Math.sin(t * 0.7 + ph * 9) * 5) * S, ay * S, t, S, ph));
    drawLifecycle(ctx, W * 0.84 * S, 300 * S, t, S);
    drawHero(ctx, hx * S, 236 * S, t, Math.cos(t * 0.5) >= 0 ? 1 : -1, S);
  }

  const Starter = { id: 'crayon', name: 'Crayon Kids', palette: PALETTE, fonts: ['Gochi Hand', 'Patrick Hand', 'Caveat Brush', 'Schoolbell'], drawHero, drawEnemy, draw, wax, scribble, shadeBand, shape, bake };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['crayon'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
