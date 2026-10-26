/* ============================================================================
   Risograph Print (id: riso) – a three-ink risograph zine come alive.
   Only three fluorescent soy spot inks – pink #ff48b0, medium blue #0078bf and
   yellow #ffe800 – on off-white recycled paper. NO black key plate, no outlines:
   every shape is a flat ink layer, layers overprint multiplicatively
   (pink over blue = violet, pink over yellow = red-orange, blue over yellow = green),
   and every plate is printed a little out of register.
   Plate engine: each sprite is drawn as three separate ink masks (one canvas,
   R = pink, G = blue, B = yellow, built with 'lighter' / per-channel 'multiply'
   knockouts), every plate with its own misregistration offset. A bake step turns
   the masks into colour per pixel: paper x product of (1 - coverage x absorption),
   with drum grain, missing-ink specks and density mottling.
   Tones are coarse AM halftone dots (each ink its own screen angle) or FM grain
   stipple. Characters are knocked out of the world (printed on their own paper),
   scenery, shadows and effects overprint the ground with 'multiply'.
   ========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ================================================================== inks */
  const PK = 0, BL = 1, YE = 2, ALL = [0, 1, 2];
  const INK_HEX = ['#ff48b0', '#0078bf', '#ffe800'];
  const INK = INK_HEX.map((h) => U.hex(h));
  const DENS = [0.93, 0.8, 0.92];                       // ink density (how much light a solid layer absorbs)
  const AB = INK.map((c) => c.map((v) => 1 - v / 255)); // absorption per ink and channel
  const PAPER = [243, 237, 224], PAPER_HEX = '#f3ede0';
  /* What the print looks like – reference only, never used for drawing. Every value follows from PAPER, INK and DENS:
     paper × (1 − density × absorption) per ink layer, multiplied for overprints (halftone tints: density × tone).
       solid pink #f34f9f · solid blue #3189b3 · solid yellow #f3d912
       pink×blue #312d7f · pink×yellow #f3480d · blue×yellow #317d0e · all three #312a0a
       pink tint 25 % #f3c5d0 · meadow (yellow .27 + blue .11) #dedda5 · path (yellow .46) #f3e481
     These are the swatches of library/riso/spec.json. */
  const ANG = [15, 75, 45].map((d) => (d * PI) / 180);   // halftone screen angles
  const MR = [[0.72, -0.46], [-0.6, 0.48], [0.3, 0.66]];  // misregistration of each plate (world units)
  const CH = ['#ff0000', '#00ff00', '#0000ff'], KILL = ['#00ffff', '#ff00ff', '#ffff00'];
  const Z0 = [0, 0];
  /** colour of inks printed on paper at the given tones (flat fills, CSS) */
  function over(inks, tones) {
    const c = PAPER.slice();
    inks.forEach((i, n) => { const a = DENS[i] * (tones ? tones[n] : 1); for (let k = 0; k < 3; k++) c[k] *= 1 - a * AB[i][k]; });
    return '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  }
  const COL = {
    pink: over([PK]), blue: over([BL]), yellow: over([YE]),
    violet: over([PK, BL]), orange: over([PK, YE]), green: over([BL, YE]), dark: over([PK, BL, YE]),
  };

  /* ============================================================ textures */
  const N = 256;
  let GR = null, PG = null, RND = null;
  function buildTables() {
    if (GR) return;
    GR = new Float32Array(N * N); PG = new Float32Array(N * N); RND = new Float32Array(N * N);
    const r = U.mulberry32(7331);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        const clump = U.perlin(x / 8, y / 8, 501, 32, 32);
        const streak = U.perlin(x / 2, y / 32, 502, 128, 8);
        let g = 0.92 + clump * 0.08 + streak * 0.04 + (r() - 0.5) * 0.14;
        if (r() < 0.028) g *= 0.25;           // ink did not take: paper specks
        GR[i] = g < 0 ? 0 : g > 1 ? 1 : g;
        let p = 1 - r() * 0.022 + U.perlin(x / 4, y / 4, 503, 64, 64) * 0.01;
        if (r() < 0.0035) p -= 0.09 + r() * 0.06; // recycled fibre flecks
        PG[i] = p;
        RND[i] = r();
      }
    }
  }

  /* ========================================================== the press
     Press(box, k): a sprite of `box` (world units) at k px/unit. All drawing goes onto three ink plates. */
  function Press(box, k, o) {
    o = o || {};
    this.k = k;
    const m = o.margin === undefined ? 1.6 : o.margin;
    this.l = box[0] - m; this.t = box[1] - m; this.r = box[2] + m; this.b = box[3] + m;
    this.w = Math.max(1, Math.ceil((this.r - this.l) * k));
    this.h = Math.max(1, Math.ceil((this.b - this.t) * k));
    let q = U.canvas(this.w, this.h);
    this.mx = q.ctx;
    this.mx.fillStyle = '#000'; this.mx.fillRect(0, 0, this.w, this.h);
    this.mx.globalCompositeOperation = 'lighter';
    q = U.canvas(this.w, this.h);
    this.px = q.ctx;
    this.pitch = o.pitch || 1.3;
    const s = o.mr === undefined ? 1 : o.mr;
    this.mr = MR.map((v) => [v[0] * s, v[1] * s]);
    this.grain = o.grain || 4;
    this.xf = null; this.xs = 1;
    this.seed = o.seed || 1;
    for (const c of [this.mx, this.px]) { c.lineJoin = 'round'; c.lineCap = 'round'; }
  }
  const PP = Press.prototype;
  PP.T = function (c, i) {
    const o = i >= 0 ? this.mr[i] : Z0, k = this.k;
    c.setTransform(k, 0, 0, k, (o[0] - this.l) * k, (o[1] - this.t) * k);
    const f = this.xf;
    if (f) c.transform(f[0], f[1], f[2], f[3], f[4], f[5]);
  };
  /** local placement for the following shapes: scale s and rotate rot around (px,py), then move by (dx,dy) */
  PP.at = function (px, py, rot, dx, dy, s) {
    if (px === undefined) { this.xf = null; this.xs = 1; return this; }
    s = s || 1;
    const c = Math.cos(rot || 0) * s, n = Math.sin(rot || 0) * s;
    this.xf = [c, n, -n, c, px - (c * px - n * py) + (dx || 0), py - (n * px + c * py) + (dy || 0)];
    this.xs = s;
    return this;
  };
  PP.box = function () {
    const f = this.xf;
    if (!f) return [this.l, this.t, this.r, this.b];
    const det = f[0] * f[3] - f[1] * f[2];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of [[this.l, this.t], [this.r, this.t], [this.l, this.b], [this.r, this.b]]) {
      const X = p[0] - f[4], Y = p[1] - f[5];
      const x = (f[3] * X - f[2] * Y) / det, y = (-f[1] * X + f[0] * Y) / det;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return [x0, y0, x1, y1];
  };
  PP.paper = function (shape) {
    const c = this.px;
    this.T(c, -1); c.fillStyle = '#000'; c.beginPath(); shape(c); c.fill();
    return this;
  };
  /** knock the shape out of the given plates (each at its own register) */
  PP.knock = function (shape, inks) {
    const c = this.mx;
    c.globalCompositeOperation = 'multiply';
    for (const j of inks || ALL) { this.T(c, j); c.fillStyle = KILL[j]; c.beginPath(); shape(c); c.fill(); }
    c.globalCompositeOperation = 'lighter';
    return this;
  };
  /** paper showing through: knocked out of every plate, but still part of the print */
  PP.hole = function (shape) { this.paper(shape); return this.knock(shape); };
  /** flat ink layer. o.tone: number or fn(x,y) -> AM halftone; o.knock=false overprints whatever is below */
  PP.fill = function (inks, shape, o) {
    o = o || {};
    if (!Array.isArray(inks)) inks = [inks];
    if (!o.noPaper) this.paper(shape);
    const tone = o.tone, solid = tone === undefined || (typeof tone === 'number' && tone >= 1);
    if (o.knock !== false) this.knock(shape, solid ? ALL.filter((j) => !inks.includes(j)) : ALL);
    const c = this.mx;
    for (const i of inks) {
      this.T(c, i); c.fillStyle = CH[i];
      if (solid) { c.beginPath(); shape(c); c.fill(); continue; }
      c.save(); c.beginPath(); shape(c); c.clip();
      this.dots(c, i, tone, (o.pitch || this.pitch) / this.xs);
      c.restore();
    }
    return this;
  };
  PP.dots = function (c, i, tone, p) {
    const b = this.box(), ca = Math.cos(ANG[i]), sa = Math.sin(ANG[i]);
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const q of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) {
      const u = (q[0] * ca + q[1] * sa) / p, v = (-q[0] * sa + q[1] * ca) / p;
      if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v;
    }
    const fn = typeof tone === 'function';
    c.beginPath();
    for (let u = Math.floor(u0); u <= Math.ceil(u1); u++) {
      for (let v = Math.floor(v0); v <= Math.ceil(v1); v++) {
        const x = (u * ca - v * sa) * p, y = (u * sa + v * ca) * p;
        const t = fn ? tone(x, y) : tone;
        if (t <= 0.02) continue;
        const r = p * 0.7071 * Math.sqrt(t > 1 ? 1 : t);
        c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
      }
    }
    c.fill();
  };
  /** FM grain stipple: random dots whose density follows tone (number or fn) */
  PP.stip = function (inks, shape, tone, o) {
    o = o || {};
    if (!Array.isArray(inks)) inks = [inks];
    const cell = (o.cell || 0.5) / this.xs, rr = cell * (o.dot || 0.6);
    const b = this.box(), fn = typeof tone === 'function';
    for (const i of inks) {
      const rnd = U.mulberry32((o.seed || 17) + i * 101);
      const c = this.mx;
      this.T(c, i); c.fillStyle = CH[i];
      c.save(); c.beginPath(); shape(c); c.clip(); c.beginPath();
      for (let y = b[1]; y < b[3]; y += cell) {
        for (let x = b[0]; x < b[2]; x += cell) {
          const t = fn ? tone(x, y) : tone;
          if (rnd() >= t) continue;
          const jx = x + rnd() * cell * 0.6, jy = y + rnd() * cell * 0.6;
          c.moveTo(jx + rr, jy); c.arc(jx, jy, rr, 0, TAU);
        }
      }
      c.fill(); c.restore();
    }
    return this;
  };
  /** ink line (mouths, stems, hatching). Lines are shapes of their own – there are no outlines in this style. */
  PP.line = function (inks, path, w, o) {
    o = o || {};
    if (!Array.isArray(inks)) inks = [inks];
    const c = this.mx;
    for (const i of inks) { this.T(c, i); c.strokeStyle = CH[i]; c.lineWidth = w; c.beginPath(); path(c); c.stroke(); }
    if (!o.noPaper) { const p = this.px; this.T(p, -1); p.strokeStyle = '#000'; p.lineWidth = w; p.beginPath(); path(p); p.stroke(); }
    return this;
  };
  /** hand scribble filling a shape: back-and-forth strokes that turn inside the silhouette */
  PP.scribble = function (ink, shape, o) {
    o = o || {};
    const rnd = U.mulberry32(o.seed || 5);
    const ang = o.ang === undefined ? 0.6 : o.ang, gap = o.gap || 1.2;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const p2 = new Path2D(); shape(p2);
    const tc = this.px; tc.setTransform(1, 0, 0, 1, 0, 0);
    const b = o.box || [this.l, this.t, this.r, this.b];
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const q of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) {
      const u = q[0] * ca + q[1] * sa, v = -q[0] * sa + q[1] * ca;
      if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v;
    }
    const pt = (u, v) => [u * ca - v * sa, u * sa + v * ca];
    const c = this.mx;
    this.T(c, ink); c.strokeStyle = CH[ink]; c.lineWidth = o.w || 0.7;
    c.beginPath();
    let prev = null, dir = 1;
    for (let v = v0; v <= v1; v += gap * (0.75 + rnd() * 0.5)) {
      let a = null, e = null;
      for (let u = u0; u <= u1; u += 0.3) { const q = pt(u, v); if (tc.isPointInPath(p2, q[0], q[1])) { if (a === null) a = u; e = u; } }
      if (a === null || e - a < 0.6) continue;
      const inset = o.inset === undefined ? 0.35 : o.inset;
      const s0 = dir > 0 ? a + inset + rnd() * 0.5 : e - inset - rnd() * 0.5;
      const s1 = dir > 0 ? e - inset - rnd() * 0.5 : a + inset + rnd() * 0.5;
      const P0 = pt(s0, v), P1 = pt(s1, v + (rnd() - 0.5) * gap * 0.5);
      if (!prev) c.moveTo(P0[0], P0[1]);
      else { const cp = pt(s0 - dir * (0.5 + rnd() * 0.6), v - gap * 0.5); c.quadraticCurveTo(cp[0], cp[1], P0[0], P0[1]); }
      const mid = pt((s0 + s1) / 2, v + (rnd() - 0.5) * gap * 0.9);
      c.quadraticCurveTo(mid[0], mid[1], P1[0], P1[1]);
      prev = P1; dir = -dir;
    }
    c.stroke();
    return this;
  };

  /** bake: masks -> paper print (comp), ink-only multiply layer (mult), yellow pop frame (flash), single plates */
  function bake(P, want) {
    want = want || {};
    const w = P.w, h = P.h, k = P.k;
    const md = P.mx.getImageData(0, 0, w, h).data, pd = P.px.getImageData(0, 0, w, h).data;
    const mk = () => new ImageData(w, h);
    const comp = want.comp === false ? null : mk(), mult = want.mult ? mk() : null, flash = want.flash ? mk() : null;
    const pl = want.plates ? [mk(), mk(), mk()] : null;
    const gs = P.grain / k;
    const A0 = AB[0], A1 = AB[1], A2 = AB[2], FY = AB[YE];
    const cd = comp && comp.data, ud = mult && mult.data, fd = flash && flash.data;
    for (let y = 0; y < h; y++) {
      const gy = Math.floor(y * gs);
      const r0 = (gy & 255) << 8, r1 = ((gy + 71) & 255) << 8, r2 = ((gy + 157) & 255) << 8;
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        const m0 = md[o] / 255, m1 = md[o + 1] / 255, m2 = md[o + 2] / 255;
        let A = pd[o + 3] / 255;
        if (m0 > A) A = m0; if (m1 > A) A = m1; if (m2 > A) A = m2;
        if (A < 0.004) continue;
        const gx = Math.floor(x * gs);
        const a0 = m0 * GR[r0 | (gx & 255)] * DENS[0];
        const a1 = m1 * GR[r1 | ((gx + 131) & 255)] * DENS[1];
        const a2 = m2 * GR[r2 | ((gx + 43) & 255)] * DENS[2];
        const fr = (1 - a0 * A0[0]) * (1 - a1 * A1[0]) * (1 - a2 * A2[0]);
        const fg = (1 - a0 * A0[1]) * (1 - a1 * A1[1]) * (1 - a2 * A2[1]);
        const fb = (1 - a0 * A0[2]) * (1 - a1 * A1[2]) * (1 - a2 * A2[2]);
        const al = A * 255;
        if (cd) {
          const pg = PG[r1 | (gx & 255)];
          cd[o] = PAPER[0] * fr * pg; cd[o + 1] = PAPER[1] * fg * pg; cd[o + 2] = PAPER[2] * fb * pg; cd[o + 3] = al;
        }
        if (ud) { ud[o] = 255 * fr; ud[o + 1] = 255 * fg; ud[o + 2] = 255 * fb; ud[o + 3] = al; }
        if (fd) {
          const p = 0.95, q = 0.75;
          fd[o] = PAPER[0] * (1 - p * FY[0]) * (1 - a0 * q * A0[0]);
          fd[o + 1] = PAPER[1] * (1 - p * FY[1]) * (1 - a0 * q * A0[1]);
          fd[o + 2] = PAPER[2] * (1 - p * FY[2]) * (1 - a0 * q * A0[2]);
          fd[o + 3] = al;
        }
        if (pl) {
          const as = [a0, a1, a2];
          for (let i = 0; i < 3; i++) { const d = pl[i].data; d[o] = INK[i][0]; d[o + 1] = INK[i][1]; d[o + 2] = INK[i][2]; d[o + 3] = as[i] * 255; }
        }
      }
    }
    const toC = (img) => { const q = U.canvas(w, h); q.ctx.putImageData(img, 0, 0); return q.c; };
    return { comp: comp && toC(comp), mult: mult && toC(mult), flash: flash && toC(flash), pl: pl && pl.map(toC), ox: -P.l * k, oy: -P.t * k, k, w, h };
  }

  /* ============================================================ shapes */
  const E = (x, y, rx, ry, rot) => (c) => { c.moveTo(x + rx * Math.cos(rot || 0), y + rx * Math.sin(rot || 0)); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };
  const CIRC = (x, y, r) => E(x, y, r, r);
  const CIRCLES = (arr) => (c) => { for (const q of arr) { c.moveTo(q[0] + q[2], q[1]); c.arc(q[0], q[1], q[2], 0, TAU); } };
  const CAP = (x1, y1, x2, y2, r) => (c) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r);
    c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5);
    c.arc(x2, y2, r, a - PI / 2, a + PI / 2);
    c.closePath();
  };
  const POLY = (pts) => (c) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
  const RPOLY = (pts, r) => (c) => {
    const n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s = m(pts[n - 1], pts[0]);
    c.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.arcTo(p[0], p[1], q[0], q[1], r); }
    c.closePath();
  };
  const RRECT = (x, y, w, h, r) => RPOLY([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r);
  function blobPath(c, pts) {
    const n = pts.length;
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    c.closePath();
  }
  const BLOB = (pts) => (c) => blobPath(c, pts);
  function starPts(n, ro, ri, cx, cy, rot, jit, seed) {
    const pts = [], r = U.mulberry32(seed || 7);
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * TAU + (jit ? (r() - 0.5) * jit / n : 0);
      const rr = (i & 1 ? ri : ro) * (jit ? 1 - r() * jit * 0.5 : 1);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return pts;
  }
  const STAR = (cx, cy, ro, ri, n, rot) => POLY(starPts(n, ro, ri, cx, cy, rot === undefined ? -PI / 2 : rot));
  const blobPts = (cx, cy, r, n, jit, seed, sy) => {
    const rnd = U.mulberry32(seed), pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU, rr = r * (1 - jit + rnd() * jit * 2); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * (sy || 1)]); }
    return pts;
  };
  /** tone helpers (local coordinates) */
  const LIN = (x0, y0, x1, y1, t0, t1) => {
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
    return (x, y) => { const s = U.clamp(((x - x0) * dx + (y - y0) * dy) / l2, 0, 1); return t0 + (t1 - t0) * s; };
  };
  const RAD = (cx, cy, r, t0, t1, sy) => (x, y) => { const d = Math.min(1, Math.hypot(x - cx, (y - cy) / (sy || 1)) / r); return t0 + (t1 - t0) * d; };

  /* =============================================================== characters
     MAIN CHARACTER – a kid in a yellow beanie and a blue hoodie; rides a skateboard when dashing.
     Pose table: back / front foot [x, y] (y < 0 = lifted), back / front arm angle (0 = hanging, + = forward),
     body bob (+ = down), head lag, pompom lag, lean (rad, + = forward). */
  function kp(o) { return Object.assign({ bf: [-2.3, 0], ff: [2.5, 0], ba: 0.18, fa: -0.12, b: 0, hd: 0, pom: 0, lean: 0 }, o); }
  /* walk: 8 computed poses – contact, down, passing, up for each leg. The swing foot lifts and its knee bends, the body
     dips after every contact and rises on the passing pose, the arms counter-swing, and head and pompom follow through
     with growing phase delays (overlapping action). */
  const KID_WALK = [];
  for (let i = 0; i < 8; i++) {
    const ph = (i / 8) * TAU, foot = (p) => [0.3 + 4.1 * Math.cos(p), Math.sin(p) < 0 ? Math.sin(p) * 2.4 : 0];
    KID_WALK.push(kp({ ff: foot(ph), bf: foot(ph + PI), fa: -0.95 * Math.cos(ph), ba: 0.95 * Math.cos(ph), b: 0.9 * Math.sin(2 * ph), hd: 0.45 * Math.sin(2 * ph - 0.9), pom: Math.sin(2 * ph - 1.8), lean: 0.06 }));
  }
  /* idle: 3 held breathing poses; crouch = the anticipation before the skateboard dash; recoil = thrown back */
  const KID_IDLE = [kp({}), kp({ b: -0.2, hd: 0.1, pom: 0.4, ba: 0.22, fa: -0.16 }), kp({ b: -0.38, hd: -0.05, pom: 0.8, ba: 0.26, fa: -0.2 })];
  const KID_CROUCH = kp({ b: 2.1, bf: [-3.4, 0], ff: [3.3, 0], ba: -0.8, fa: -1.0, hd: 0.7, pom: 1.3, lean: 0.12 });
  const KID_RECOIL = kp({ b: -0.4, bf: [-3.2, 0], ff: [2.6, -1.8], ba: 2.3, fa: 2.7, hd: -0.7, pom: -1.4, lean: -0.22 });
  const KID_DASH = kp({ bf: [-4.4, -2.7], ff: [3.8, -2.7], ba: 1.9, fa: 1.35 });
  function kidParts(P, F, dash) {
    const hipY = dash ? -9.0 : -8.2 + F.b;
    // everything above the hips bobs and leans around the hip point; the head adds its own lag
    const UP = (extra) => (dash ? P.at(0, hipY, 0.24, 0.6, 1.0) : P.at(0, -8.2, F.lean, 0, F.b + (extra || 0)));
    const shoe = (fx, fy) => P.fill([PK, YE], E(fx + 0.9, fy - 1.15, 2.55, 1.35));
    const leg = (hx, fx, fy, back) => {
      const ink = back ? [PK, BL, YE] : [PK, BL];
      let kx, ky, bend = 0;
      if (dash) { kx = (hx + fx) / 2 + 2.6; ky = (hipY + fy) / 2 - 0.6; bend = 1; }
      else {
        // two-bone leg: the knee bends forward when hip and ankle come closer than the leg length
        const ax = fx, ay = fy - 1.6, dx = ax - hx, dy = ay - hipY, d = Math.hypot(dx, dy) || 1, L = 7.9;
        bend = d < L ? Math.sqrt((L / 2) ** 2 - (d / 2) ** 2) : 0;
        kx = (hx + ax) / 2 + (dy / d) * bend; ky = (hipY + ay) / 2 - (dx / d) * bend;
      }
      if (bend > 0.3) { P.fill(ink, CAP(hx, hipY, kx, ky, 1.45)); P.fill(ink, CAP(kx, ky, fx, fy - 1.6, 1.4)); }
      else P.fill(ink, CAP(hx, hipY, fx, fy - 1.6, 1.45));
    };
    const arm = (sx, sy, a, back) => {
      const ex = sx + Math.sin(a) * 5.4, ey = sy + Math.cos(a) * 5.4;
      P.fill(back ? [BL, PK] : BL, CAP(sx, sy, ex, ey, 1.4));
      P.fill(YE, CIRC(ex, ey + 0.3, 1.6));
      P.fill(PK, CIRC(ex, ey + 0.3, 1.6), { tone: 0.4, knock: false, pitch: 1.0 });
    };
    if (dash) {
      // skateboard: red-orange deck (pink over yellow), blue wheels
      P.fill([PK, YE], (c) => {
        c.moveTo(-9.6, -3.8); c.quadraticCurveTo(-8.6, -2.0, -6.6, -2.0); c.lineTo(6.6, -2.0); c.quadraticCurveTo(8.6, -2.0, 9.6, -3.8);
        c.lineTo(10.2, -3.3); c.quadraticCurveTo(9.4, -0.9, 6.8, -0.9); c.lineTo(-6.8, -0.9); c.quadraticCurveTo(-9.4, -0.9, -10.2, -3.3); c.closePath();
      });
      P.fill(BL, CIRCLES([[-5.6, -0.2, 1.25], [5.6, -0.2, 1.25]]));
      P.hole(CIRCLES([[-5.6, -0.2, 0.4], [5.6, -0.2, 0.4]]));
    }
    leg(-1.5, F.bf[0], F.bf[1], true); shoe(F.bf[0], F.bf[1]);
    UP();
    arm(-2.4, -15.0, F.ba, true);
    P.fill(BL, E(-2.6, -17.3, 4.3, 2.7));                       // hood behind the head
    const body = (c) => {
      c.moveTo(-4.6, -17.2); c.quadraticCurveTo(-6.3, -12.2, -5.7, -7.3); c.quadraticCurveTo(0, -6.3, 5.9, -7.3);
      c.quadraticCurveTo(6.4, -12.2, 4.6, -17.2); c.quadraticCurveTo(0, -18.6, -4.6, -17.2); c.closePath();
    };
    P.fill(BL, body);
    P.fill(PK, body, { tone: LIN(-6, -7, 3, -15, 0.62, 0), knock: false });   // violet halftone shading
    P.fill(PK, RRECT(-1.2, -11.6, 6.4, 3.3, 1.2), { tone: 0.55, knock: false });  // pocket
    P.fill(YE, STAR(2.6, -14.6, 1.9, 0.85, 5));                // chest badge
    P.at();
    leg(1.6, F.ff[0], F.ff[1], false); shoe(F.ff[0], F.ff[1]);
    UP(F.hd);
    // head
    const hx = 0.8, hy = -22.6, hr = 6.5;
    P.fill(PK, CIRC(hx, hy, hr), { tone: 0.34, pitch: 0.78 });
    P.fill(YE, CIRC(hx, hy, hr), { tone: 0.3, knock: false, pitch: 0.78 });
    P.fill([PK, BL], E(hx - 3.7, hy + 1.2, 3.1, 3.9, 0.2));         // hair at the back
    P.fill(PK, CIRC(hx - 1.2, hy + 1.6, 1.3), { tone: 0.75 });      // ear
    P.fill(YE, (c) => { c.moveTo(hx - 7.0, hy - 1.2); c.bezierCurveTo(hx - 7.4, hy - 9.6, hx + 7.6, hy - 9.6, hx + 7.1, hy - 1.2); c.closePath(); });
    P.stip(PK, (c) => { c.moveTo(hx - 7.0, hy - 1.2); c.bezierCurveTo(hx - 7.4, hy - 9.6, hx + 7.6, hy - 9.6, hx + 7.1, hy - 1.2); c.closePath(); },
      LIN(hx + 6, hy - 6, hx - 6, hy - 1, 0, 0.35), { seed: 31 });
    P.fill([PK, YE], RRECT(hx - 7.4, hy - 2.8, 14.8, 2.9, 1.4));   // cuff (red-orange)
    P.fill(PK, CIRC(hx - 1.6 - F.pom * 0.9, hy - 8.4 + Math.abs(F.pom) * 0.35, 2.3));   // pompom, swinging after the head
    // face
    P.fill([BL, PK], E(hx + 2.3, hy + 1.8, 0.85, 1.25)); P.fill([BL, PK], E(hx + 5.0, hy + 1.8, 0.8, 1.2));
    P.fill(PK, CIRC(hx + 5.6, hy + 4.0, 1.05));
    P.line(BL, (c) => { c.moveTo(hx + 2.5, hy + 4.4); c.quadraticCurveTo(hx + 3.5, hy + 5.4, hx + 4.5, hy + 4.5); }, 0.6);
    UP();
    arm(2.6, -14.8, F.fa, false);
    P.at();
  }

  // SMALL CREATURE – blob critters: a pink one with a yellow bobble, a blue one with pink horns. 6 waddle poses: the
  // feet step with a lift, the body squashes at contact and stretches on the passing pose, two stubby arms swing
  // against the feet, the bobble antenna / the horns lag behind the body.
  const CR_N = 6;
  function critterParts(P, f, v) {
    const ph = (f / CR_N) * TAU, sq = 0.6 * (0.5 + 0.5 * Math.cos(2 * ph));
    const foot = (p) => [3.6 * Math.cos(p), Math.sin(p) < 0 ? -Math.sin(p) * 1.5 : 0];
    const fb = foot(ph + PI), ff = foot(ph), sw = Math.cos(ph), lag = Math.sin(2 * ph - 1.5);
    const top = -17.2 + sq * 0.9, wd = 8.8 + sq * 0.35;
    const body = (c) => {
      c.moveTo(0, top); c.bezierCurveTo(5.6, top, wd, -9.5, wd, -4.8); c.bezierCurveTo(wd - 0.2, -1.6, 5, -1.1, 0, -1.1);
      c.bezierCurveTo(-5, -1.1, -wd + 0.2, -1.6, -wd, -4.8); c.bezierCurveTo(-wd, -9.5, -5.6, top, 0, top); c.closePath();
    };
    P.fill([PK, BL], E(fb[0], -1.0 - fb[1], 2.6, 1.6));
    P.fill([PK, BL], E(ff[0], -1.0 - ff[1], 2.6, 1.6));
    const armInk = v === 0 ? PK : BL;
    P.fill(armInk, CAP(-wd + 1.4, -7.6, -wd - 2.0, -5.6 + sw * 1.4, 1.15));
    P.fill(armInk, CAP(wd - 1.4, -7.6, wd + 2.0, -5.6 - sw * 1.4, 1.15));
    if (v === 0) {
      const ax = 3.6 + lag * 1.3, ay = top - 4.8 + Math.abs(lag) * 0.3;
      P.line(PK, (c) => { c.moveTo(0.8, top + 1); c.quadraticCurveTo(1.0 + lag * 0.3, top - 2.6, ax - 0.2, ay + 0.4); }, 1.0);
      P.fill(YE, CIRC(ax, ay, 2.0));
      P.fill(BL, CIRC(ax, ay, 2.0), { tone: LIN(ax - 1.6, ay - 1.7, ax + 1.9, ay + 1.8, 0, 0.5), knock: false, pitch: 1.0 });
      P.fill(PK, body);
      P.fill(BL, body, { tone: LIN(-2, -13, 6, -2, 0, 0.66), knock: false });
    } else {
      const hl = lag * 0.5;
      P.fill(PK, POLY([[-5.6, top + 3.2], [-6.4 - hl, top - 1.6], [-3.0, top + 1.4]]));
      P.fill(PK, POLY([[3.4, top + 1.2], [5.6 - hl, top - 2.6], [6.4, top + 2.6]]));
      P.fill(BL, body);
      P.fill(YE, body, { tone: LIN(-5, top + 1, 3, -6, 0.6, 0), knock: false });
    }
    // eyes: paper showing through, pupils in violet
    P.hole(E(-0.6, -10.6 + sq * 0.4, 2.2, 2.6)); P.hole(E(4.3, -10.6 + sq * 0.4, 2.0, 2.5));
    P.fill([PK, BL], E(0.1, -10.0 + sq * 0.4, 1.0, 1.4)); P.fill([PK, BL], E(4.9, -10.0 + sq * 0.4, 0.95, 1.35));
    // grin (opens on the squash)
    P.hole((c) => { c.moveTo(0.2, -6.4); c.quadraticCurveTo(2.0, -6.0, 3.8, -6.4); c.quadraticCurveTo(2.0, -3.4 + sq * 0.8, 0.2, -6.4); c.closePath(); });
    if (v === 1) P.fill(PK, E(2.0, -4.9 + sq * 0.3, 0.9, 0.45));
  }

  // FAST CREATURE – a scribbled ghost: paper silhouette filled with blue and pink hand scribbles
  function ghostShape(ph) {
    const w = (i) => Math.sin(ph + i * 1.9);
    return (c) => {
      c.moveTo(-6.6, -14.2);
      c.arc(0, -14.2, 6.6, PI, 0);
      c.bezierCurveTo(6.9, -10.2, 6.5, -7.2, 4.8, -5.2 + w(0) * 0.5);
      c.quadraticCurveTo(2.6, -3.0 + w(1) * 0.9, 0.6, -5.0);
      c.quadraticCurveTo(-1.8, -2.6 + w(2) * 1.0, -4.0, -4.8);
      c.quadraticCurveTo(-8.6, -2.8 + w(3) * 1.2, -12.8 + w(4) * 0.6, -1.2 + w(4) * 1.3);
      c.quadraticCurveTo(-8.9, -6.4, -6.6, -10.0);
      c.closePath();
    };
  }
  const GH_N = 6;
  function ghostParts(P, f) {
    const ph = (f / GH_N) * TAU, shape = ghostShape(ph);
    P.fill(PK, shape, { tone: 0.2, pitch: 0.8 });
    P.fill(BL, shape, { tone: LIN(-2, -19, 3, -5, 0, 0.3), knock: false, pitch: 0.8 });
    P.scribble(BL, shape, { seed: 11 + f * 7, ang: 0.55, gap: 1.2, w: 0.75 });
    P.scribble(PK, shape, { seed: 53 + f * 5, ang: -0.95, gap: 2.3, w: 0.6 });
    // speed scribbles trailing behind
    const r = U.mulberry32(90 + f);
    for (let i = 0; i < 3; i++) {
      const y = -15 + i * 3.6 + r() * 1.2, x0 = -9.5 - r() * 2;
      P.line(i & 1 ? PK : BL, (c) => { c.moveTo(x0, y); c.quadraticCurveTo(x0 - 2, y - 1.2, x0 - 4.4 - r() * 2, y + 0.4); }, 0.55);
    }
    P.hole(E(0.6, -14.6, 1.9, 2.5, 0.1)); P.hole(E(4.4, -14.6, 1.75, 2.4, -0.1));
    P.fill([PK, BL], E(1.2, -14.1, 0.95, 1.4)); P.fill([PK, BL], E(4.9, -14.1, 0.9, 1.35));
    P.fill(PK, E(2.7, -9.7, 1.35, 1.75 + Math.sin(ph) * 0.15));
  }

  // LARGE CREATURE – a geometric monster: blue triangle body, an overprinted pink disc belly, one big yellow eye
  const CO_FR = [[-8, 0, 8, 0, 0], [-9.6, 2.6, 7.2, 0, 1], [-8, 0, 8, 0, 0], [-7.2, 0, 9.6, 2.6, -1]];
  function colossusParts(P, f) {
    const F = CO_FR[f], sw = F[4];
    P.fill([PK, BL], RRECT(F[0] - 3.4, -10, 6.8, 10 - F[1], 1.6));     // legs
    P.fill([PK, BL], RRECT(F[2] - 3.4, -10, 6.8, 10 - F[3], 1.6));
    P.fill(YE, RPOLY([[-17.5, -26], [-27 - sw * 1.6, -16 + sw * 0.8], [-20.5 - sw * 1.6, -12.5 + sw * 0.8]], 1.4));   // back arm
    const tri = RPOLY([[-21, -7], [21, -7], [1.5, -54]], 3.2);
    P.fill(BL, tri);
    P.fill(YE, tri, { tone: LIN(-14, -40, 2, -24, 0.55, 0), knock: false, pitch: 1.6 });   // lit side: green dots
    P.fill(PK, CIRC(6.5, -19.5, 12.6), { knock: false });                                    // overprinted belly disc
    P.fill(YE, CIRC(-0.6, -34.5, 7.0));                                                       // the eye
    P.fill([PK, BL], E(0.4, -34.2, 1.9, 4.6));
    P.hole(CIRC(-1.6, -37.0, 1.1));
    P.fill([PK, BL, YE], RRECT(-9.5, -21.5, 21, 6.6, 3.2));                                 // mouth
    for (let i = 0; i < 5; i++) {
      const x = -7.2 + i * 4.1;
      P.hole(POLY([[x, -21.4], [x + 3.0, -21.4], [x + 1.5, -18.6]]));
      if (i < 4) P.hole(POLY([[x + 2.0, -15.0], [x + 5.0, -15.0], [x + 3.5, -17.6]]));
    }
    P.fill(PK, POLY([[-2.0, -47.5], [1.3, -60], [5.0, -47.5]]), { knock: false });                             // horn
    P.fill(PK, RPOLY([[16.5, -27], [27.5 + sw * 1.6, -16 - sw * 0.8], [20 + sw * 1.6, -12 - sw * 0.8]], 1.4), { knock: false }); // front arm
  }

  /* ================================================================ props */
  function treeParts(P, v) {
    if (v === 0) {
      P.fill(BL, RRECT(-1.7, -18, 3.4, 18.4, 1));
      P.fill(YE, CIRC(-1, -29, 11.6));
      P.fill(BL, CIRC(3.6, -25.5, 9.2), { knock: false });                        // overprint lens -> green
      P.fill(BL, CIRC(-1, -29, 11.6), { tone: LIN(-8, -38, 4, -24, 0, 0.35), knock: false, pitch: 1.6 });
      P.fill(PK, CIRCLES([[-6, -31, 1.5], [-1.5, -36, 1.4], [5.5, -31.5, 1.5], [0.5, -26, 1.3], [-6.5, -24.5, 1.2]]));
    } else {
      P.fill([PK, BL], RRECT(-1.5, -17, 3, 17.4, 1));
      P.fill([PK, BL], CAP(0, -15, 5.5, -21, 0.9));
      const crown = BLOB(blobPts(0, -29, 11.2, 9, 0.12, 77));
      P.fill(PK, crown);
      P.stip(YE, crown, LIN(-9, -38, 5, -22, 0.55, 0), { seed: 9 });
      P.fill(BL, crown, { tone: LIN(-4, -32, 8, -20, 0, 0.45), knock: false, pitch: 1.6 });
    }
  }
  function pineParts(P) {
    P.fill([PK, BL], RRECT(-1.4, -9, 2.8, 9.4, 0.8));
    const tiers = [[-8, 13, 11], [-17, 11, 10], [-26, 8.5, 9]];
    for (const [y, w, h] of tiers) {
      const tri = RPOLY([[-w, y], [w, y], [0, y - h - 6]], 1.2);
      P.fill(BL, tri);
      P.fill(YE, tri, { tone: LIN(-w, y - 4, w * 0.4, y - 4, 0.8, 0), knock: false, pitch: 1.5 });
    }
    P.fill(YE, STAR(0, -41.5, 2.6, 1.1, 5));
  }
  function bushParts(P) {
    P.fill(YE, CIRC(-4.2, -6.6, 6.4));
    P.fill(BL, CIRC(3.4, -6.4, 6.2), { knock: false });
    P.fill(YE, CIRC(0, -10.6, 4.6), { knock: false, tone: 0.6 });
    P.fill(PK, CIRCLES([[-5.5, -8, 1.1], [1.2, -12, 1.1], [5.4, -6.4, 1.1], [-1.5, -4.4, 1.0]]));
  }
  function rockParts(P, v) {
    if (v === 0) {
      const sh = BLOB([[-9, 0], [-8, -5.4], [-3.6, -9.4], [2.6, -9.8], [7.8, -6], [9.2, 0]]);
      P.fill(BL, sh, { tone: 0.42, pitch: 1.4 });
      P.fill(BL, sh, { tone: LIN(-4, -8, 6, -1, 0, 1), knock: false, pitch: 1.4 });
      P.stip(PK, sh, LIN(-6, -8, 4, -2, 0.45, 0), { seed: 4 });
    } else {
      const sh = BLOB([[-6.4, 0], [-5.6, -4.6], [-1.4, -7.2], [3.6, -6.4], [6.6, -2.6], [6.8, 0]]);
      P.fill([PK, BL], sh);
      P.hole((c) => { c.moveTo(-3.8, -4.4); c.quadraticCurveTo(-2.4, -6.2, 0.2, -6.2); c.quadraticCurveTo(-2.2, -5.0, -3.0, -3.4); c.closePath(); });
    }
  }
  function houseParts(P, v) {
    const wall = v === 0 ? PK : YE, roof = v === 0 ? BL : PK, win = v === 0 ? YE : BL;
    P.fill(roof === BL ? [PK, BL] : [PK, YE], RRECT(5, -30, 3.6, 9, 0.6));                       // chimney
    P.fill(wall, RRECT(-11, -17.5, 22, 17.8, 0.6));
    if (v === 0) P.fill(BL, RRECT(-11, -17.5, 22, 17.8, 0.6), { tone: LIN(-11, -10, 11, -10, 0, 0.42), knock: false });
    else P.fill(PK, RRECT(-11, -17.5, 22, 17.8, 0.6), { tone: LIN(-11, -10, 11, -10, 0, 0.5), knock: false });
    P.fill(roof, RPOLY([[-14, -16], [14, -16], [0, -30]], 1.2));
    P.fill(roof === BL ? PK : YE, RPOLY([[-14, -16], [14, -16], [0, -30]], 1.2), { tone: LIN(-6, -26, 10, -18, 0, 0.5), knock: false, pitch: 1.4 });
    P.fill(win, RRECT(-8.2, -13.8, 5.4, 5.4, 0.4)); P.fill(win, RRECT(3.0, -13.8, 5.4, 5.4, 0.4));
    P.knock((c) => { c.rect(-5.65, -13.8, 0.5, 5.4); c.rect(-8.2, -11.35, 5.4, 0.5); c.rect(5.45, -13.8, 0.5, 5.4); c.rect(3.0, -11.35, 5.4, 0.5); });
    P.fill([PK, BL], RRECT(-2.4, -8.0, 4.8, 8.3, 1.2));
    P.fill(YE, CIRC(1.2, -4.0, 0.5));
    P.fill(win, CIRC(0, -21.6, 2.0));
  }
  function flowerParts(P) {
    const fl = [[-4.6, 13, PK], [1.2, 18, PK], [5.6, 11, YE]];
    for (const [x, h] of fl) P.line(BL, (c) => { c.moveTo(x * 0.6, 0); c.quadraticCurveTo(x * 0.8 - 1, -h * 0.5, x, -h); }, 0.85);
    P.fill(YE, E(-2.6, -5.4, 2.6, 1.2, -0.6)); P.fill(BL, E(-2.6, -5.4, 2.6, 1.2, -0.6), { knock: false });
    P.fill(YE, E(3.6, -7.2, 2.6, 1.2, 0.6)); P.fill(BL, E(3.6, -7.2, 2.6, 1.2, 0.6), { knock: false });
    for (const [x, h, ink] of fl) {
      const pts = [];
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - PI / 2; pts.push([x + Math.cos(a) * 1.9, -h + Math.sin(a) * 1.9, 1.45]); }
      P.fill(ink, CIRCLES(pts));
      P.fill(ink === PK ? YE : PK, CIRC(x, -h, 1.25), { knock: false });
    }
  }
  function plantParts(P) {
    const leaf = (bx, by, a, len, wid) => (c) => {
      const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx, tx = bx + dx * len, ty = by + dy * len;
      c.moveTo(bx, by);
      c.bezierCurveTo(bx + dx * len * 0.2 + nx * wid, by + dy * len * 0.2 + ny * wid, tx - dx * len * 0.25 + nx * wid * 0.8, ty - dy * len * 0.25 + ny * wid * 0.8, tx, ty);
      c.bezierCurveTo(tx - dx * len * 0.25 - nx * wid * 0.8, ty - dy * len * 0.25 - ny * wid * 0.8, bx + dx * len * 0.2 - nx * wid, by + dy * len * 0.2 - ny * wid, bx, by);
      c.closePath();
    };
    for (const [a, l, w] of [[-1.0, 13, 4.6], [0.95, 12, 4.2], [-0.25, 16, 5.0], [0.4, 14.5, 4.6]]) {
      const s = leaf(0, -9.5, a, l, w);
      P.fill(BL, s);
      P.fill(YE, s, { tone: 0.75, knock: false, pitch: 1.3 });
      const dx = Math.sin(a), dy = -Math.cos(a);
      P.hole((c) => { for (let k = 0.35; k < 0.9; k += 0.22) { const x = dx * l * k, y = -9.5 + dy * l * k; c.moveTo(x - dy * w * 0.2, y + dx * w * 0.2); c.lineTo(x - dy * w * 1.2 + dx * 0.8, y + dx * w * 1.2 + dy * 0.8); c.lineTo(x - dy * w * 1.2 + dx * 1.6, y + dx * w * 1.2 + dy * 1.6); c.closePath(); } });
    }
    const pot = RPOLY([[-6.4, -10.5], [6.4, -10.5], [4.8, 0.2], [-4.8, 0.2]], 0.8);
    P.fill(PK, pot);
    P.fill(BL, RRECT(-6.2, -9.6, 12.4, 2.2, 0.4), { knock: false });
    P.fill(YE, pot, { tone: LIN(-6, -5, 6, -5, 0.5, 0), knock: false });
  }
  function lampParts(P) {
    P.fill(YE, CIRC(0, -31, 10.5), { tone: RAD(0, -31, 10.5, 0.55, 0) });          // light: yellow halftone disc
    P.fill(BL, RRECT(-1.0, -30, 2.0, 30.4, 0.6));
    P.fill(BL, RRECT(-3.4, -1.6, 6.8, 2.0, 0.8));
    P.fill(YE, CIRC(0, -31, 3.2));
    P.fill([PK, BL], RPOLY([[-4.2, -33.2], [4.2, -33.2], [0, -37.4]], 0.6));
    P.fill(PK, CIRC(0, -30.4, 1.6), { knock: false, tone: 0.6 });
  }
  const PROP_DEF = {
    tree: { n: 2, box: [-14, -44, 14, 1], fn: treeParts, sh: 13 },
    pine: { n: 1, box: [-14, -46, 14, 1], fn: pineParts, sh: 12 },
    bush: { n: 1, box: [-11, -17, 11, 1], fn: bushParts, sh: 10 },
    rock: { n: 2, box: [-10, -11, 10, 1], fn: rockParts, sh: 9 },
    house: { n: 2, box: [-15, -31, 15, 1], fn: houseParts, sh: 15 },
    flowers: { n: 1, box: [-8, -22, 8, 1], fn: flowerParts, sh: 6 },
    plant: { n: 1, box: [-14, -27, 14, 1], fn: plantParts, sh: 7 },
    lamp: { n: 1, box: [-11, -42, 11, 1], fn: lampParts, sh: 4 },
  };

  /* ============================================================ effects */
  function pelletParts(P) {
    P.fill(PK, CIRCLES([[-4.8, 0, 1.35], [-7.9, 0, 0.95], [-10.4, 0, 0.6]]), { tone: 0.8 });
    P.fill(PK, CIRC(0, 0, 2.7));
    P.fill(YE, CIRC(0.5, -0.4, 1.6), { knock: false });
  }
  function gemParts(P, big) {
    if (!big) {
      P.fill(YE, POLY([[0, -4.8], [3.4, 0], [0, 4.8], [-3.4, 0]]));
      P.fill(PK, POLY([[0, -2.6], [1.8, 0], [0, 2.6], [-1.8, 0]]), { knock: false });
    } else {
      P.fill(PK, STAR(0, 0, 6, 2.8, 5));
      P.fill(BL, CIRC(0, 0.3, 2.6), { knock: false });
      P.fill(YE, STAR(0, 0, 6, 2.8, 5), { tone: LIN(-5, -5, 4, 4, 0.7, 0), knock: false, pitch: 1.1 });
    }
  }
  function sunRays(P) {
    const pts = [];
    for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU, r = i & 1 ? 6.0 : 8.8; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    P.fill(PK, POLY(pts));
    P.hole(CIRC(0, 0, 5.8));
  }
  function sunFace(P) {
    P.fill(YE, CIRC(0, 0, 5.3));
    P.fill(PK, CIRC(0, 0, 5.3), { tone: LIN(-4, -4, 4, 4, 0, 0.45), knock: false, pitch: 1.0 });
    P.fill(BL, CIRCLES([[-1.8, -0.9, 0.65], [1.8, -0.9, 0.65]]));
    P.line(BL, (c) => { c.moveTo(-1.7, 1.3); c.quadraticCurveTo(0, 2.8, 1.7, 1.3); }, 0.55);
  }
  function splatParts(P, ink, v) {
    const pts = blobPts(0, 0, 4.4, 11, 0.32, 300 + v * 17 + ink * 5);
    P.fill(ink, BLOB(pts));
    const r = U.mulberry32(900 + v * 13 + ink);
    const drops = [];
    for (let i = 0; i < 5; i++) { const a = r() * TAU, d = 5.2 + r() * 2.2; drops.push([Math.cos(a) * d, Math.sin(a) * d, 0.45 + r() * 0.65]); }
    P.fill(ink, CIRCLES(drops));
  }
  const BURST = [[PK, YE], [BL, PK], [YE, BL]];
  function burstParts(P, v) {
    const [a, b] = BURST[v];
    P.fill(a, POLY(starPts(12, 10.5, 5.4, 0, 0, 0.1, 0.5, 31 + v)));
    P.fill(b, CIRC(0, 0, 8.5), { tone: RAD(0, 0, 8.5, 0.95, 0.05), knock: false, pitch: 1.5 });
    P.hole(CIRC(0, 0, 2.2));
  }
  function shadowParts(P) {
    P.fill(BL, E(0, 0, 9.6, 3.6), { tone: (x, y) => 0.6 * (1 - Math.pow(Math.min(1, Math.hypot(x / 9.6, y / 3.6)), 2.2)), pitch: 1.05 });
  }
  function glowParts(P) {
    P.fill(YE, E(0, 0, 15, 7.5), { tone: (x, y) => 0.6 * (1 - Math.min(1, Math.hypot(x / 15, y / 7.5))), pitch: 1.6 });
  }

  /* ================================================================ ground */
  const GS = 4, NF = 9;
  const GPITCH = 2.6, GIP = 1 / GPITCH, FMC = 0.55;
  const GMR = MR.map((v) => [v[0] * 1.35, v[1] * 1.35]);
  const GCA = ANG.map(Math.cos), GSA = ANG.map(Math.sin);
  function fieldsAt(x, y, out) {
    const wx = U.perlin(x / 700, y / 700, 31) * 90, wy = U.perlin(x / 700 + 7.7, y / 700, 32) * 90;
    const X = x + wx, Y = y + wy;
    out[0] = U.fbm(X / 430 + 11.3, Y / 430 - 2.1, 41, 3) - 0.66;              // ponds
    out[1] = U.fbm(X / 560 - 4.2, Y / 560 + 3.3, 51, 3) - 0.6;               // meadow fields
    out[2] = U.fbm(X / 520 - 9.1, Y / 520 + 0.7, 61, 3) - 0.63;               // blossom fields
    const qx = U.perlin(x / 380, y / 380, 71) * 50, qy = U.perlin(x / 380 + 4.4, y / 380, 72) * 50;
    out[3] = (0.021 - Math.abs(U.perlin((x + qx) / 1250, (y + qy) / 1250 + 0.37, 73))) * 3.0;  // path
    out[4] = U.smoothstep(0.42, 0.78, U.fbm(x / 380, y / 380, 81, 2));        // pink grain clouds
    out[5] = U.smoothstep(0.4, 0.78, U.fbm(x / 440 + 5, y / 440, 91, 2));     // yellow grain clouds
    out[6] = U.smoothstep(0.3, 0.75, U.noise(x / 130, y / 130, 101));          // grain shading inside fields
    out[7] = U.perlin(x / 55, y / 55, 111);                                    // ripple warp
    out[8] = U.noise(x / 120, y / 120, 121);                                   // ink density mottling
  }
  const FT = new Float32Array(NF);
  /** 0 paper, 1 meadow, 2 blossom, 3 path, 4 pond */
  function matAt(x, y) {
    fieldsAt(x, y, FT);
    if (FT[0] > 0) return 4;
    if (FT[3] > 0) return 3;
    if (FT[2] > 0) return 2;
    if (FT[1] > 0) return 1;
    return 0;
  }
  function matSafe(x, y, r) {
    const m = matAt(x, y);
    if (matAt(x + r, y) !== m || matAt(x - r, y) !== m || matAt(x, y + r) !== m || matAt(x, y - r) !== m) return -1;
    return m;
  }

  // decals – drawn as ink masks (R pink, G blue, B yellow) and merged into the ground plates
  function D(c, info, i, shape) {
    const res = info.res, o = GMR[i];
    c.setTransform(res, 0, 0, res, (o[0] - info.wx) * res, (o[1] - info.wy) * res);
    c.fillStyle = CH[i]; c.beginPath(); shape(c); c.fill();
  }
  function DL(c, info, i, path, w) {
    const res = info.res, o = GMR[i];
    c.setTransform(res, 0, 0, res, (o[0] - info.wx) * res, (o[1] - info.wy) * res);
    c.strokeStyle = CH[i]; c.lineWidth = w; c.beginPath(); path(c); c.stroke();
  }
  function flowerDecal(c, info, x, y, s, petal, center) {
    const pts = [];
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; pts.push([x + Math.cos(a) * 1.1 * s, y + Math.sin(a) * 1.1 * s, 0.8 * s]); }
    D(c, info, petal, CIRCLES(pts));
    D(c, info, center, CIRC(x, y, 0.6 * s));
  }
  function* decals(c, info) {
    const pts = [];
    G.scatter(info, 13, 7001, 7, (x, y, rng) => pts.push(x, y, rng.next(), rng.next(), rng.next()));
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < pts.length; i += 5) {
      if (i % 100 === 95) yield;
      const x = pts[i], y = pts[i + 1], r0 = pts[i + 2], r1 = pts[i + 3], r2 = pts[i + 4];
      const m = matSafe(x, y, 4);
      const s = 0.8 + r1 * 0.5;
      // along every region edge a drift of blue grass strokes underlines the shape
      if (m < 0) { if (r0 < 0.3 && matAt(x, y) !== 4) DL(c, info, BL, (q) => { for (const k of [-1, 0, 1]) { q.moveTo(x + k * 1.1 * s, y); q.lineTo(x + k * 1.6 * s + (r2 - 0.5), y - (2.2 + Math.abs(k) * -0.6) * s); } }, 0.5); continue; }
      // everything else gathers in clumps (noise field) – calm paper between them, never an even sprinkle
      const keep = U.smoothstep(0.48, 0.7, U.noise(x / 120, y / 120, 7373));
      const rq = r0 / (0.08 + 1.2 * keep);
      if (rq > 0.34) continue;
      if (m === 0) {
        if (rq < 0.07) DL(c, info, BL, (q) => { for (const k of [-1, 0, 1]) { q.moveTo(x + k * 1.1 * s, y); q.lineTo(x + k * 1.6 * s + (r2 - 0.5), y - (2.2 + Math.abs(k) * -0.6) * s); } }, 0.5);
        else if (rq < 0.105) flowerDecal(c, info, x, y, s * 0.9, r2 < 0.5 ? PK : BL, YE);
        else if (rq < 0.13) D(c, info, r2 < 0.5 ? YE : PK, POLY([[x, y - 1.6 * s], [x + 1.5 * s, y + 1 * s], [x - 1.4 * s, y + 0.8 * s]]));
        else if (rq < 0.15) { D(c, info, PK, CIRC(x, y, 0.9 * s)); D(c, info, BL, CIRC(x + 0.6, y + 0.3, 0.9 * s)); }
      } else if (m === 1) {
        if (rq < 0.2) DL(c, info, BL, (q) => { for (const k of [-1, -0.3, 0.4, 1]) { q.moveTo(x + k * 1.2 * s, y); q.quadraticCurveTo(x + k * 1.4 * s, y - 1.4 * s, x + k * 2.2 * s + (r2 - 0.5) * 0.8, y - (2.4 + (1 - Math.abs(k)) * 0.9) * s); } }, 0.6);
        else if (rq < 0.26) flowerDecal(c, info, x, y, s, YE, PK);
        else if (rq < 0.29) flowerDecal(c, info, x, y, s * 0.8, PK, YE);
      } else if (m === 2) {
        if (rq < 0.2) flowerDecal(c, info, x, y, s * 1.1, PK, YE);
        else if (rq < 0.27) { D(c, info, BL, E(x - 1.3 * s, y, 1.6 * s, 0.7 * s, -0.5)); D(c, info, BL, E(x + 1.3 * s, y - 0.2, 1.6 * s, 0.7 * s, 0.5)); }
        else if (rq < 0.3) D(c, info, YE, CIRC(x, y, 0.8 * s));
      } else if (m === 3) {
        if (rq < 0.12) D(c, info, PK, E(x, y, 1.3 * s, 0.85 * s, r2));
        else if (rq < 0.16) D(c, info, BL, CIRCLES([[x, y, 0.55 * s], [x + 1.6 * s, y + 0.5, 0.45 * s], [x + 0.6, y + 1.4 * s, 0.4 * s]]));
      } else {
        if (rq < 0.09) {
          const a = r2 * TAU;
          D(c, info, YE, (q) => { q.moveTo(x, y); q.arc(x, y, 3.0 * s, a + 0.5, a + TAU - 0.1); q.closePath(); });
          if (r1 > 0.55) flowerDecal(c, info, x + 0.8, y - 0.6, 0.7, PK, YE);
        }
      }
    }
  }

  /** shades ground rows py0..py1 of a chunk job J into J.buf – a plain function so the JIT keeps everything in registers */
  function shadeRows(J, py0, py1) {
    const F = J.F, CS = J.CS, CM = J.CM, CNP = J.CNP, dd = J.dd, buf = J.buf, gcol = J.gcol, fcol = J.fcol;
    const Wp = J.Wp, nc = J.nc, nn = J.nn, cpx = J.cpx, res = J.res, inv = 1 / res, wx0 = J.wx0, wy0 = J.wy0;
    const m0x = GMR[0][0], m0y = GMR[0][1], m1x = GMR[1][0], m1y = GMR[1][1], m2x = GMR[2][0], m2y = GMR[2][1];
    const ca0 = GCA[0], sa0 = GSA[0], ca1 = GCA[1], sa1 = GSA[1], ca2 = GCA[2], sa2 = GSA[2];
    const RK = GPITCH * 0.7071, R_PATH = RK * Math.sqrt(0.46), R_BLOS = RK * Math.sqrt(0.25), R_MY = RK * Math.sqrt(0.27);
    const A00 = AB[0][0], A01 = AB[0][1], A02 = AB[0][2], A10 = AB[1][0], A11 = AB[1][1], A12 = AB[1][2], A20 = AB[2][0], A21 = AB[2][1], A22 = AB[2][2];
    const D0 = DENS[0], D1 = DENS[1], D2 = DENS[2], PR = PAPER[0], PGg = PAPER[1], PB = PAPER[2];
    const HP = GPITCH, IP = GIP;
    for (let py = py0; py < py1; py++) {
      const y = wy0 + (py + 0.5) * inv;
      const grow = (Math.floor(y * 2.5) & 255) << 8, frow = (Math.floor(y / FMC) & 255) << 8;
      const band0 = D0 * (0.95 + 0.05 * Math.sin(y * 0.043 + U.perlin(0.5, y / 90, 333) * 3));
      const band1 = D1 * (0.95 + 0.05 * Math.sin(y * 0.037 + 2.1 + U.perlin(0.5, y / 90, 334) * 3));
      const band2 = D2 * (0.95 + 0.05 * Math.sin(y * 0.051 + 4.2 + U.perlin(0.5, y / 90, 335) * 3));
      const gyf = (py + 0.5) / cpx;
      let gy = gyf | 0; if (gy >= nc) gy = nc - 1;
      const v = gyf - gy, v1 = 1 - v;
      const y0 = y - m0y, y1 = y - m1y, y2 = y - m2y;
      for (let px = 0; px < Wp; px++) {
        const gxf = (px + 0.5) / cpx;
        let gx = gxf | 0; if (gx >= nc) gx = nc - 1;
        const u = gxf - gx, u1 = 1 - u;
        const o00 = (gy * nn + gx) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF;
        const w00 = u1 * v1, w10 = u * v1, w01 = u1 * v, w11 = u * v;
        const ci = gy * nc + gx, cs = ci * 16, rc = CM[ci];
        let fP = 0, hp = false, q0 = rc, q1 = rc, q2 = rc;
        if (rc < 0) {
          fP = F[o00] * w00 + F[o10] * w10 + F[o01] * w01 + F[o11] * w11; hp = true;
          const fM = F[o00 + 1] * w00 + F[o10 + 1] * w10 + F[o01 + 1] * w01 + F[o11 + 1] * w11;
          const fB = F[o00 + 2] * w00 + F[o10 + 2] * w10 + F[o01 + 2] * w01 + F[o11 + 2] * w11;
          const fR = F[o00 + 3] * w00 + F[o10 + 3] * w10 + F[o01 + 3] * w01 + F[o11 + 3] * w11;
          q0 = fP + CS[cs] > 0 ? 4 : fR + CS[cs + 12] > 0 ? 3 : fB + CS[cs + 8] > 0 ? 2 : fM + CS[cs + 4] > 0 ? 1 : 0;
          q1 = fP + CS[cs + 1] > 0 ? 4 : fR + CS[cs + 13] > 0 ? 3 : fB + CS[cs + 9] > 0 ? 2 : fM + CS[cs + 5] > 0 ? 1 : 0;
          q2 = fP + CS[cs + 2] > 0 ? 4 : fR + CS[cs + 14] > 0 ? 3 : fB + CS[cs + 10] > 0 ? 2 : fM + CS[cs + 6] > 0 ? 1 : 0;
        } else if (CNP[ci]) { fP = F[o00] * w00 + F[o10] * w10 + F[o01] * w01 + F[o11] * w11; hp = true; }
        const x = wx0 + (px + 0.5) * inv;
        const fi = frow + fcol[px];
        // pink plate
        let c0 = 0;
        if (q0 === 2) {
          const xs = x - m0x, uu = (xs * ca0 + y0 * sa0) * IP, vv = (y0 * ca0 - xs * sa0) * IP;
          const fu = uu - Math.floor(uu) - 0.5, fv = vv - Math.floor(vv) - 0.5;
          c0 = (R_BLOS - Math.sqrt(fu * fu + fv * fv) * HP) * res + 0.5;
          c0 = c0 > 1 ? 1 : c0 < 0 ? 0 : c0;
        } else if (q0 === 3) { if (RND[fi & 65535] < 0.02) c0 = 1; }
        else if (q0 === 0) {
          // pink tint clouds on the open paper: coarse AM dots that grow toward the cloud core (a printed halftone fade)
          const cl = F[o00 + 4] * w00 + F[o10 + 4] * w10 + F[o01 + 4] * w01 + F[o11 + 4] * w11;
          if (cl > 0.3) {
            const t = (cl - 0.3) * 1.43, tone = t * t * 0.3;
            const xs = x - m0x, uu = (xs * ca0 + y0 * sa0) * IP, vv = (y0 * ca0 - xs * sa0) * IP;
            const fu = uu - Math.floor(uu) - 0.5, fv = vv - Math.floor(vv) - 0.5;
            c0 = (RK * Math.sqrt(tone) - Math.sqrt(fu * fu + fv * fv) * HP) * res + 0.5;
            c0 = c0 > 1 ? 1 : c0 < 0 ? 0 : c0;
          }
        }
        // blue plate
        let c1 = 0;
        if (q1 === 4) {
          c1 = 1;
          if (fP + CS[cs + 1] > 0.012) {
            const rw = F[o00 + 7] * w00 + F[o10 + 7] * w10 + F[o01 + 7] * w01 + F[o11 + 7] * w11;
            const qq = (y1 + rw * 13) / 7.5, sx = (x - m1x + rw * 46) / 23;
            if (qq - Math.floor(qq) < 0.13 && sx - Math.floor(sx) < 0.55) c1 = 0;
          }
        } else {
          let am = 0;
          if (hp) { const dP = -(fP + CS[cs + 1]) * CS[cs + 3]; if (dP < 9) am = 0.5 * (1 - dP / 9); }
          if (q1 === 1 && am < 0.11) am = 0.11;
          if (am > 0) {
            const xs = x - m1x, uu = (xs * ca1 + y1 * sa1) * IP, vv = (y1 * ca1 - xs * sa1) * IP;
            const fu = uu - Math.floor(uu) - 0.5, fv = vv - Math.floor(vv) - 0.5;
            c1 = (RK * Math.sqrt(am) - Math.sqrt(fu * fu + fv * fv) * HP) * res + 0.5;
            c1 = c1 > 1 ? 1 : c1 < 0 ? 0 : c1;
          }
          if (q1 === 1 && c1 < 1 && RND[(fi + 21839) & 65535] < (F[o00 + 6] * w00 + F[o10 + 6] * w10 + F[o01 + 6] * w01 + F[o11 + 6] * w11) * 0.035) c1 = 1;
        }
        // yellow plate
        let c2 = 0;
        if (q2 === 3 || q2 === 1) {
          const xs = x - m2x, uu = (xs * ca2 + y2 * sa2) * IP, vv = (y2 * ca2 - xs * sa2) * IP;
          const fu = uu - Math.floor(uu) - 0.5, fv = vv - Math.floor(vv) - 0.5;
          c2 = ((q2 === 3 ? R_PATH : R_MY) - Math.sqrt(fu * fu + fv * fv) * HP) * res + 0.5;
          c2 = c2 > 1 ? 1 : c2 < 0 ? 0 : c2;
        } else if (q2 !== 4) {
          // yellow tint clouds: the same halftone fade on the yellow screen (blossom fields get a light FM grain instead)
          const cl = F[o00 + 5] * w00 + F[o10 + 5] * w10 + F[o01 + 5] * w01 + F[o11 + 5] * w11;
          if (q2 === 2) { if (RND[(fi + 43678) & 65535] < cl * 0.12) c2 = 1; }
          else if (cl > 0.3) {
            const t = (cl - 0.3) * 1.43, tone = t * t * 0.26;
            const xs = x - m2x, uu = (xs * ca2 + y2 * sa2) * IP, vv = (y2 * ca2 - xs * sa2) * IP;
            const fu = uu - Math.floor(uu) - 0.5, fv = vv - Math.floor(vv) - 0.5;
            c2 = (RK * Math.sqrt(tone) - Math.sqrt(fu * fu + fv * fv) * HP) * res + 0.5;
            c2 = c2 > 1 ? 1 : c2 < 0 ? 0 : c2;
          }
        }
        // decals
        const di = (py * Wp + px) << 2;
        let dk = dd[di]; if (dk) { dk /= 255; if (dk > c0) c0 = dk; }
        dk = dd[di + 1]; if (dk) { dk /= 255; if (dk > c1) c1 = dk; }
        dk = dd[di + 2]; if (dk) { dk /= 255; if (dk > c2) c2 = dk; }
        const gc = gcol[px], pg = PG[grow | gc];
        let r = PR * pg, g = PGg * pg, b = PB * pg;
        if (c0 || c1 || c2) {
          const mo = F[o00 + 8] * w00 + F[o10 + 8] * w10 + F[o01 + 8] * w01 + F[o11 + 8] * w11;
          if (c0) { const a = c0 * GR[grow | gc] * band0 * (0.88 + 0.12 * mo); r *= 1 - a * A00; g *= 1 - a * A01; b *= 1 - a * A02; }
          if (c1) { const a = c1 * GR[((grow + 18176) & 65280) | ((gc + 131) & 255)] * band1 * (1 - 0.12 * mo); r *= 1 - a * A10; g *= 1 - a * A11; b *= 1 - a * A12; }
          if (c2) { const a = c2 * GR[((grow + 40192) & 65280) | ((gc + 43) & 255)] * band2 * (0.9 + 0.1 * mo); r *= 1 - a * A20; g *= 1 - a * A21; b *= 1 - a * A22; }
        }
        const ri = r > 255 ? 255 : r | 0, gi = g > 255 ? 255 : g | 0, bi = b > 255 ? 255 : b | 0;
        buf[py * Wp + px] = 0xff000000 | (bi << 16) | (gi << 8) | ri;
      }
    }
  }

  /** overprint onto the world – unless the world under us is dark (mixed with another style): then print opaque */
  let darkKey = null, darkVal = false;
  function OVER() {
    const m = window.__stage && window.__stage.mix, gc = (m && m.groundColor) || PAPER_HEX;
    if (gc !== darkKey) {
      darkKey = gc;
      const c = typeof gc === 'string' && gc[0] === '#' ? U.hex(gc) : PAPER;
      darkVal = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11 < 120;
    }
    return darkVal ? 'source-over' : 'multiply';
  }

  /* ========================================================== draw helpers */
  let TV = null;
  const TF = { S: 1, ox: 0, oy: 0 };
  function tf(view) {
    if (TV !== view) { TV = view; TF.S = view.S; TF.ox = view.W / 2 - view.x * view.S; TF.oy = view.H / 2 - view.y * view.S; }
    return TF;
  }
  function blit(ctx, V, s, img, x, y, sx, sy, rot, flip) {
    const ik = 1 / s.k;
    if (!rot && !flip) { ctx.drawImage(img, x - s.ox * ik * sx, y - s.oy * ik * sy, s.w * ik * sx, s.h * ik * sy); return; }
    const S = V.S, c = Math.cos(rot || 0) * S, n = Math.sin(rot || 0) * S, f = flip ? -1 : 1;
    ctx.setTransform(c * sx * f, n * sx * f, -n * sy, c * sy, V.ox + x * S, V.oy + y * S);
    ctx.drawImage(img, -s.ox * ik, -s.oy * ik, s.w * ik, s.h * ik);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }
  /** the print falling apart into its plates (spawn: d > 0 converging, death: drifting apart) */
  const PLATE_DIR = [[-0.8, -0.75], [0.95, -0.2], [-0.1, 1]];
  function plates(ctx, V, s, x, y, sx, sy, flip, d, alpha) {
    ctx.globalCompositeOperation = OVER();
    for (let i = 0; i < 3; i++) {
      const a = Array.isArray(alpha) ? alpha[i] : alpha;
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      blit(ctx, V, s, s.pl[i], x + PLATE_DIR[i][0] * d, y + PLATE_DIR[i][1] * d, sx, sy, 0, flip);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ------------------------------------------------------------ text */
  let fontOK = false, fontCheckT = -1;
  const textCache = new Map();
  function fontReady(rt) {
    if (fontOK) return true;
    if (fontCheckT >= 0 && rt - fontCheckT < 0.5) return false;
    fontCheckT = rt;
    if (document.fonts) document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === 'Rubik Mono One' && f.status === 'loaded') fontOK = true; });
    if (fontOK) textCache.clear();
    return fontOK;
  }
  let K = 4;
  function numSprite(value, crit, rt) {
    const ok = fontReady(rt);
    const key = value + (crit ? 'c' : '') + (ok ? 'L' : 'F');
    let s = textCache.get(key);
    if (s) return s;
    if (textCache.size > 500) textCache.clear();
    const k = K, fs = (crit ? 10.5 : 7.5) * k;
    const font = '400 ' + fs + 'px "Rubik Mono One", "DM Mono", "Arial Black", monospace';
    const meas = U.canvas(4, 4).ctx; meas.font = font;
    const txt = String(value), tw = meas.measureText(txt).width;
    const w = Math.ceil(tw + fs * (crit ? 1.6 : 0.8)), h = Math.ceil(fs * (crit ? 2.2 : 1.5));
    const { c, ctx } = U.canvas(w, h);
    const cx = w / 2, cy = h / 2 + fs * 0.05;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = font;
    if (crit) {
      const pts = starPts(9, 1, 0.72, 0, 0, 0.3, 0.3, value);
      ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, cx + q[0] * (w / 2 - 2), h / 2 + q[1] * (h / 2 - 2))); ctx.closePath();
      ctx.fillStyle = INK_HEX[BL]; ctx.globalAlpha = DENS[BL]; ctx.fill(); ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillText(txt, cx + k * 0.3, cy - k * 0.2); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = PAPER_HEX; ctx.fillText(txt, cx + k * 0.3, cy - k * 0.2);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = INK_HEX[YE]; ctx.fillText(txt, cx + k * 0.3, cy - k * 0.2);
      ctx.fillStyle = INK_HEX[PK]; ctx.globalAlpha = 0.85; ctx.fillText(txt, cx - k * 0.5, cy + k * 0.45);
    } else {
      ctx.fillStyle = INK_HEX[PK]; ctx.globalAlpha = 0.92; ctx.fillText(txt, cx + k * 0.55, cy + k * 0.35);
      ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 1;
      ctx.fillStyle = INK_HEX[BL]; ctx.fillText(txt, cx - k * 0.2, cy - k * 0.15);
    }
    s = { c, ox: w / 2, oy: h / 2, k, w, h };
    textCache.set(key, s);
    return s;
  }

  /* ---------------------------------------------------------- page frame */
  let OV = null;
  function buildOverlay(W, H) {
    const m = Math.max(8, Math.round(H * 0.024));
    const { c, ctx } = U.canvas(W, H);
    ctx.fillStyle = PAPER_HEX;
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(m, m, W - 2 * m, H - 2 * m); ctx.fill('evenodd');
    // paper flecks in the margin
    const rr = U.mulberry32(77);
    ctx.fillStyle = 'rgba(120,104,84,.25)';
    for (let i = 0; i < (W + H) * 0.25; i++) {
      const side = rr() * 4 | 0;
      const x = side < 2 ? rr() * W : side === 2 ? rr() * m : W - rr() * m, y = side === 0 ? rr() * m : side === 1 ? H - rr() * m : rr() * H;
      ctx.fillRect(x, y, 1 + rr(), 1);
    }
    const lw = Math.max(1, H / 700);
    const mark = (fn) => {
      ctx.globalCompositeOperation = 'multiply';
      for (let i = 0; i < 3; i++) {
        const o = MR[i];
        ctx.save(); ctx.translate(o[0] * lw * 1.2, o[1] * lw * 1.2);
        ctx.strokeStyle = INK_HEX[i]; ctx.fillStyle = INK_HEX[i]; ctx.globalAlpha = DENS[i]; ctx.lineWidth = lw;
        fn(ctx); ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    };
    // crop marks in the corners
    const L = m * 0.62, g = m * 0.25;
    mark((q) => {
      q.beginPath();
      for (const [x, y, sx, sy] of [[m, m, -1, -1], [W - m, m, 1, -1], [m, H - m, -1, 1], [W - m, H - m, 1, 1]]) {
        q.moveTo(x + sx * g, y); q.lineTo(x + sx * (g + L), y);
        q.moveTo(x, y + sy * g); q.lineTo(x, y + sy * (g + L));
      }
      q.stroke();
    });
    // registration targets in the side margins
    const tr = m * 0.3;
    mark((q) => {
      for (const [x, y] of [[m / 2, H / 2], [W - m / 2, H / 2], [W / 2, m / 2]]) {
        q.beginPath(); q.arc(x, y, tr, 0, TAU); q.moveTo(x + tr * 0.45, y); q.arc(x, y, tr * 0.45, 0, TAU);
        q.moveTo(x - tr * 1.6, y); q.lineTo(x + tr * 1.6, y); q.moveTo(x, y - tr * 1.6); q.lineTo(x, y + tr * 1.6); q.stroke();
      }
    });
    // colour bar in the top margin: solids, overprints and tints
    const sw = m * 0.5, sy = m * 0.25, x0 = m * 1.6;
    const bars = [[PK], [BL], [YE], [PK, BL], [PK, YE], [BL, YE], [PK, BL, YE]];
    bars.forEach((inks, i) => { ctx.fillStyle = over(inks); ctx.fillRect(x0 + i * sw * 1.15, sy, sw, sw); });
    [[PK, 0.5], [BL, 0.5], [YE, 0.5], [PK, 0.25], [BL, 0.25]].forEach((q, i) => { ctx.fillStyle = over([q[0]], [q[1]]); ctx.fillRect(x0 + (bars.length + 0.4 + i) * sw * 1.15, sy, sw, sw); });
    // drum banding + ink starvation: a soft low-res veil of paper over the image
    const bw = 48, bh = 27;
    const band = U.canvas(bw, bh);
    const bd = band.ctx.createImageData(bw, bh);
    for (let y = 0; y < bh; y++) {
      const b = Math.max(0, Math.sin(y * 1.31 + 0.7) * 0.5 + Math.sin(y * 0.47) * 0.5) * 0.06;
      for (let x = 0; x < bw; x++) {
        const s = U.smoothstep(0.6, 1, x / bw) * 0.07, o = (y * bw + x) * 4;
        bd.data[o] = PAPER[0]; bd.data[o + 1] = PAPER[1]; bd.data[o + 2] = PAPER[2]; bd.data[o + 3] = (b + s) * 255;
      }
    }
    band.ctx.putImageData(bd, 0, 0);
    return { c, W, H, m, band: band.c };
  }

  /* ================================================================== CSS */
  const BD = 'body.style-riso';
  const P_ = INK_HEX[PK], B_ = INK_HEX[BL], Y_ = INK_HEX[YE], PA = PAPER_HEX;
  const DOT = (col, r, s, x, y) => `radial-gradient(circle, ${col} ${r}px, transparent ${r + 0.7}px) ${x || 0}px ${y || 0}px / ${s}px ${s}px`;
  const CROP = (c, L, l) => [
    `linear-gradient(${c},${c}) 0 ${L}px / ${l}px 1px no-repeat`, `linear-gradient(${c},${c}) ${L}px 0 / 1px ${l}px no-repeat`,
    `linear-gradient(${c},${c}) 100% ${L}px / ${l}px 1px no-repeat`, `linear-gradient(${c},${c}) calc(100% - ${L}px) 0 / 1px ${l}px no-repeat`,
    `linear-gradient(${c},${c}) 0 calc(100% - ${L}px) / ${l}px 1px no-repeat`, `linear-gradient(${c},${c}) ${L}px 100% / 1px ${l}px no-repeat`,
    `linear-gradient(${c},${c}) 100% calc(100% - ${L}px) / ${l}px 1px no-repeat`, `linear-gradient(${c},${c}) calc(100% - ${L}px) 100% / 1px ${l}px no-repeat`,
  ].join(', ');
  const TARGET = (c) => `radial-gradient(circle, transparent 3px, ${c} 3px 4.2px, transparent 4.2px 6.4px, ${c} 6.4px 7.6px, transparent 7.6px) center / 22px 22px no-repeat, linear-gradient(${c},${c}) center / 22px 1.2px no-repeat, linear-gradient(${c},${c}) center / 1.2px 22px no-repeat`;
  const MONO = "'Rubik Mono One', 'Archivo Black', monospace", GROT = "'Space Grotesk', system-ui, sans-serif", DMM = "'DM Mono', ui-monospace, monospace";
  const CSS = `
${BD} { font-family: ${GROT}; }
${BD} #hud { padding: 26px 34px; }
${BD} #hud .xp { height: 16px; border: 0; border-radius: 0; overflow: visible; background: ${DOT('rgba(0,120,191,.6)', 1.15, 5)}, ${PA}; }
${BD} #hud .xp::before { content: ''; position: absolute; inset: -11px; pointer-events: none; background: ${CROP(B_, 11, 7)}; }
${BD} #hud .xp-fill { background: ${P_}; mix-blend-mode: multiply; box-shadow: 3px 2px 0 rgba(255,232,0,.95); }
${BD} #hud .lvl { right: -10px; padding: 4px 9px 3px; background: ${Y_}; color: ${B_}; font: 400 12px/1 ${MONO}; letter-spacing: .04em; text-shadow: 1.5px 1px 0 rgba(255,72,176,.85);
  transform: translateY(-50%) rotate(-4deg); box-shadow: 3px 3px 0 rgba(255,72,176,.9); }
${BD} #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 22px; }
${BD} #hud .hp { position: relative; justify-self: start; gap: 10px; padding: 6px 14px 6px 6px; background: ${PA}; box-shadow: 5px 5px 0 rgba(0,120,191,.92); }
${BD} #hud .hp::before { content: ''; position: absolute; inset: -11px; pointer-events: none; background: ${CROP(P_, 11, 7)}; }
${BD} #hud .hp-icon, ${BD} #hud .kills-icon { width: 46px; height: 46px; mix-blend-mode: multiply; }
${BD} #hud .hp-bar { width: 240px; height: 22px; border: 0; border-radius: 0; background: ${DOT('rgba(255,72,176,.62)', 1.2, 5)}, ${PA}; overflow: visible; }
${BD} #hud .hp-fill { background: ${B_}; mix-blend-mode: multiply; box-shadow: 2px 2px 0 rgba(255,72,176,.85); }
${BD} #hud .hp-text { position: absolute; left: 62px; width: 240px; top: 50%; transform: translateY(-50%); text-align: center; font: 400 13px/1 ${MONO}; letter-spacing: .05em; color: ${PA}; text-shadow: 1.5px 1px 0 rgba(255,72,176,.9); }
${BD}.hurt #hud .hp { animation: risoJolt .26s steps(2) 1; }
@keyframes risoJolt { 50% { transform: translate(4px,-2px); box-shadow: -7px 6px 0 rgba(0,120,191,.92); } }
${BD} #hud .clock { position: relative; justify-self: center; padding: 9px 30px 8px; background: ${PA}; box-shadow: 6px 5px 0 rgba(255,72,176,.92); }
${BD} #hud .clock::before { content: ''; position: absolute; inset: -12px; pointer-events: none; background: ${CROP(B_, 12, 8)}; }
${BD} #hud .clock::after { content: ''; position: absolute; left: -46px; top: 50%; width: 22px; height: 22px; margin-top: -11px; background: ${TARGET(B_)}; opacity: .9; }
${BD} #hud .clock-time { font: 400 34px/1 ${MONO}; letter-spacing: .02em; color: ${B_}; text-shadow: 3px 2px 0 rgba(255,72,176,.88); }
${BD} #hud .clock-label { margin-top: 6px; font: 500 11px/1.2 ${DMM}; letter-spacing: .34em; text-transform: uppercase; opacity: 1; color: ${B_}; }
${BD} #hud .kills { position: relative; justify-self: end; min-width: 0; gap: 8px; padding: 6px 18px 6px 8px; background: ${Y_}; box-shadow: 5px 5px 0 rgba(255,72,176,.92);
  transform: rotate(1.5deg); font: 400 26px/1 ${MONO}; color: ${B_}; text-shadow: 2px 1.5px 0 rgba(255,72,176,.8); }
${BD} #hud .kills::after { content: ''; position: absolute; right: -40px; top: 50%; width: 22px; height: 22px; margin-top: -11px; background: ${TARGET(P_)}; }
${BD} #stylebar { bottom: 18px; gap: 14px; padding: 8px 24px; background: ${PA}; color: ${B_}; border: 0; border-radius: 0; box-shadow: 5px 4px 0 ${Y_}; font: 500 12px/1.2 ${DMM}; }
${BD} #stylebar::before { content: ''; position: absolute; inset: -11px; pointer-events: none; background: ${CROP(B_, 11, 7)}; }
${BD} #stylebar .style-family { font: 500 11px/1 ${DMM}; letter-spacing: .24em; text-transform: uppercase; opacity: 1; color: ${P_}; }
${BD} #stylebar .style-name { font: 400 16px/1 ${MONO}; letter-spacing: .02em; color: ${B_}; text-shadow: 2px 1.5px 0 rgba(255,72,176,.85); }
${BD} #stylebar .style-hint { opacity: .8; }
${BD} #stylebar .auto.on { color: ${P_}; }
${BD} #levelup { gap: 34px; background: ${DOT('rgba(255,72,176,.3)', 1.8, 11)}, ${DOT('rgba(0,120,191,.2)', 1.3, 11, 5.5, 5.5)}, rgba(243,237,224,.32); }
${BD} #levelup .lu-title { position: relative; padding: 16px 44px 12px; background: ${Y_}; font: 400 56px/1 ${MONO}; letter-spacing: .01em; color: ${B_};
  text-shadow: 5px 4px 0 rgba(255,72,176,.9); box-shadow: 9px 8px 0 rgba(255,72,176,.9); transform: rotate(-2deg); animation: risoPull .5s cubic-bezier(.2,1.3,.4,1) backwards; }
${BD} #levelup .lu-title::before { content: ''; position: absolute; inset: -14px; pointer-events: none; background: ${CROP(B_, 14, 9)}; }
@keyframes risoPull { from { opacity: 0; transform: translate(-22px, 14px) rotate(-6deg); text-shadow: 26px 18px 0 rgba(255,72,176,.9); box-shadow: 34px 26px 0 rgba(255,72,176,.9); } }
${BD} #levelup .lu-cards { gap: 34px; }
${BD} #levelup .card { --r: -1.6deg; position: relative; isolation: isolate; width: 232px; min-height: 300px; padding: 0 18px 22px; gap: 8px; color: ${B_}; background: ${PA};
  border: 0; border-radius: 0; box-shadow: 7px 7px 0 rgba(0,120,191,.92); transform: rotate(var(--r)); transition: transform .14s cubic-bezier(.3,1.5,.5,1); animation: risoCard .5s cubic-bezier(.2,1.25,.4,1) backwards; }
${BD} #levelup .card:nth-child(2) { --r: 1.2deg; box-shadow: 7px 7px 0 rgba(255,72,176,.92); animation-delay: .07s; }
${BD} #levelup .card:nth-child(3) { --r: -.5deg; box-shadow: 7px 7px 0 rgba(255,232,0,.95); animation-delay: .14s; }
@keyframes risoCard { from { opacity: 0; transform: translate(-18px, 30px) rotate(6deg); } }
${BD} #levelup .card:hover { transform: translateY(-8px) rotate(0deg); }
${BD} #levelup .card::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 84px; z-index: -1; background: ${DOT(P_, 2.3, 8)}, ${Y_}; background-blend-mode: multiply; }
${BD} #levelup .card:nth-child(2)::before { background: ${DOT(B_, 2.3, 8)}, ${P_}; background-blend-mode: multiply; }
${BD} #levelup .card:nth-child(3)::before { background: ${DOT(Y_, 2.6, 8)}, ${B_}; background-blend-mode: multiply; }
${BD} #levelup .card::after { content: ''; position: absolute; inset: -13px; z-index: -2; pointer-events: none; background: ${CROP(B_, 13, 8)}; }
${BD} #levelup .card-icon { width: 116px; height: 116px; margin-top: 26px; padding: 8px; border-radius: 50%; background: ${PA}; box-shadow: 4px 4px 0 rgba(0,120,191,.92); }
${BD} #levelup .card:nth-child(2) .card-icon { box-shadow: 4px 4px 0 rgba(255,232,0,.95); }
${BD} #levelup .card:nth-child(3) .card-icon { box-shadow: 4px 4px 0 rgba(255,72,176,.92); }
${BD} #levelup .card-name { margin-top: 10px; font: 700 22px/1.12 ${GROT}; letter-spacing: -.01em; color: ${B_}; }
${BD} #levelup .card-desc { font: 400 14px/1.4 ${DMM}; opacity: 1; color: ${COL.violet}; }
${BD} #levelup .card-key { top: 10px; left: 10px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 50%;
  background: ${PA}; box-shadow: inset 0 0 0 2px ${P_}; font: 400 13px/1 ${MONO}; color: ${P_}; opacity: 1; transform: rotate(-12deg); }
${BD} #levelup .lu-hint { padding: 7px 16px; background: ${B_}; box-shadow: 4px 3px 0 ${P_}; font: 500 13px/1 ${DMM}; letter-spacing: .26em; text-transform: uppercase; opacity: 1; color: ${PA}; }
${BD} #gameover { gap: 22px; background: ${DOT('rgba(0,120,191,.45)', 2.2, 10)}, rgba(243,237,224,.8); }
${BD} #gameover .go-title { padding: 14px 40px 10px; background: ${P_}; font: 400 58px/1 ${MONO}; color: ${PA}; text-shadow: 5px 4px 0 rgba(0,120,191,.85); box-shadow: 9px 8px 0 rgba(255,232,0,.95); transform: rotate(-2deg); }
${BD} #gameover .go-stats { padding: 8px 20px; background: ${PA}; box-shadow: 5px 5px 0 ${B_}; font: 500 16px/1.3 ${DMM}; letter-spacing: .08em; opacity: 1; color: ${B_}; }
${BD} #gameover .go-hint { font: 400 18px/1 ${MONO}; opacity: 1; color: ${P_}; }
${BD} #pausebox { padding: 14px 40px 10px; background: ${Y_}; font: 400 58px/1 ${MONO}; color: ${B_}; text-shadow: 5px 4px 0 rgba(255,72,176,.9); box-shadow: 9px 8px 0 rgba(255,72,176,.9); }
`;

  /* ================================================================ icons (48-unit space) */
  const ICONS = {
    'hp-heart'(P) {
      const heart = (c) => {
        c.moveTo(24, 42); c.bezierCurveTo(10, 33, 5, 25, 5, 17.5); c.bezierCurveTo(5, 10.5, 10, 6, 16, 6);
        c.bezierCurveTo(20, 6, 22.6, 8.4, 24, 11.6); c.bezierCurveTo(25.4, 8.4, 28, 6, 32, 6);
        c.bezierCurveTo(38, 6, 43, 10.5, 43, 17.5); c.bezierCurveTo(43, 25, 38, 33, 24, 42); c.closePath();
      };
      P.fill(PK, heart);
      P.fill(BL, heart, { tone: LIN(14, 14, 36, 36, 0, 0.75), knock: false });
      P.hole(E(14.5, 15.5, 4.2, 2.4, -0.7));
    },
    kills(P) { P.at(0, 0, 0, 22.5, 45, 2.3); critterParts(P, 0, 0); P.at(); },
    dmg(P) {
      P.fill(PK, POLY(starPts(10, 21, 9.5, 24, 24, -0.2, 0.25, 4)));
      P.fill(YE, CIRC(24, 24, 11), { knock: false });
      P.fill(BL, CIRC(24, 24, 11), { tone: LIN(14, 14, 34, 34, 0, 0.6), knock: false });
      P.hole(STAR(24, 24, 5, 2.2, 4, 0));
    },
    rate(P) {
      const bolt = POLY([[29, 3], [11, 27], [22, 27], [16, 45], [38, 18], [27, 18], [34, 3]]);
      P.fill(YE, bolt);
      P.fill(PK, bolt, { tone: LIN(20, 10, 30, 40, 0, 0.8), knock: false });
      P.line(BL, (c) => { c.moveTo(3, 13); c.lineTo(11, 13); c.moveTo(2, 21); c.lineTo(8, 21); c.moveTo(38, 33); c.lineTo(46, 33); c.moveTo(36, 41); c.lineTo(43, 41); }, 2.2);
    },
    multi(P) {
      for (const [x, y, a] of [[12, 33, -0.55], [24, 27, 0], [36, 33, 0.55]]) {
        P.at(0, 0, a - PI / 2, x, y, 2.2); pelletParts(P); P.at();
      }
      P.fill(BL, RRECT(8, 40, 32, 4, 2));
    },
    bounce(P) {
      P.fill(BL, CIRCLES([[6, 40, 1.4], [9, 31, 1.4], [13, 23, 1.4], [18, 18, 1.4], [23, 23, 1.4], [26, 31, 1.4], [30, 26, 1.4], [34, 21, 1.4]]));
      P.fill(YE, STAR(27, 38, 6, 2.5, 6, 0));
      P.fill(PK, CIRC(38, 16, 7));
      P.fill(YE, CIRC(39, 15, 4), { knock: false });
      P.hole(E(35.5, 12.5, 1.8, 1.1, -0.6));
    },
    lantern(P) {
      P.fill(YE, CIRC(24, 24, 22), { tone: RAD(24, 24, 22, 0.5, 0), pitch: 3.2 });
      P.at(0, 0, 0.1, 24, 24, 2.3); sunRays(P); sunFace(P); P.at();
    },
    speed(P) {
      P.line(PK, (c) => { c.moveTo(2, 16); c.lineTo(13, 16); c.moveTo(4, 23); c.lineTo(12, 23); c.moveTo(1, 30); c.lineTo(10, 30); }, 2.4);
      P.at(0, 0, -0.12, 27, 36, 1.9);
      P.fill([PK, YE], (c) => {
        c.moveTo(-9.6, -3.8); c.quadraticCurveTo(-8.6, -2.0, -6.6, -2.0); c.lineTo(6.6, -2.0); c.quadraticCurveTo(8.6, -2.0, 9.6, -3.8);
        c.lineTo(10.2, -3.3); c.quadraticCurveTo(9.4, -0.9, 6.8, -0.9); c.lineTo(-6.8, -0.9); c.quadraticCurveTo(-9.4, -0.9, -10.2, -3.3); c.closePath();
      });
      P.fill(BL, CIRCLES([[-5.6, 0.2, 1.7], [5.6, 0.2, 1.7]]));
      P.hole(CIRCLES([[-5.6, 0.2, 0.6], [5.6, 0.2, 0.6]]));
      P.at();
      P.fill(YE, STAR(30, 13, 6, 2.4, 4, 0));
    },
    magnet(P) {
      const arc = (c) => { c.moveTo(9, 26); c.arc(24, 26, 15, PI, 0); c.lineTo(39, 34); c.lineTo(31, 34); c.lineTo(31, 26); c.arc(24, 26, 7, 0, PI, true); c.lineTo(17, 34); c.lineTo(9, 34); c.closePath(); };
      P.fill(PK, arc);
      P.fill(BL, arc, { tone: LIN(14, 12, 34, 30, 0, 0.6), knock: false });
      P.fill(BL, RRECT(9, 34, 8, 8, 0.5)); P.fill(BL, RRECT(31, 34, 8, 8, 0.5));
      P.fill(YE, CIRCLES([[6, 9, 2.2], [42, 9, 2.2], [24, 4.5, 1.8]]));
    },
    hp(P) {
      P.line(PK, (c) => { for (const x of [17, 24, 31]) { c.moveTo(x, 18); c.bezierCurveTo(x - 4, 14, x + 4, 10, x, 5); } }, 2.2);
      P.fill(YE, E(24, 23, 18.5, 4.5));
      P.fill(BL, (c) => { c.moveTo(5, 23); c.quadraticCurveTo(6, 43, 24, 43); c.quadraticCurveTo(42, 43, 43, 23); c.closePath(); });
      P.fill(PK, (c) => { c.moveTo(5, 23); c.quadraticCurveTo(6, 43, 24, 43); c.quadraticCurveTo(42, 43, 43, 23); c.closePath(); }, { tone: LIN(10, 26, 38, 40, 0, 0.6), knock: false });
      P.hole(RRECT(21.5, 27, 5, 13, 1)); P.hole(RRECT(17.5, 31, 13, 5, 1));
    },
  };
  const iconCache = new Map();

  /* ================================================================ particles */
  const inkOf = (e) => (e.type === 'ghost' ? BL : e.type === 'colossus' ? BL : (e.seed || 0) < 0.55 ? PK : BL);
  const heightOf = (e) => (e.type === 'colossus' ? 26 : e.type === 'ghost' ? 15 : 9);
  function dot(game, x, y, z, ink, size, sp, life, o) {
    const a = Math.random() * TAU, s = sp * (0.4 + Math.random() * 0.8);
    return game.addParticle(Object.assign({ kind: 'dot', ink, x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 50, grav: 160, drag: 2.2, life: life * (0.7 + Math.random() * 0.6), size: size * (0.6 + Math.random() * 0.8) }, o || {}));
  }
  function conf(game, x, y, z, ink, size, sp) {
    const a = Math.random() * TAU, s = sp * (0.5 + Math.random() * 0.7);
    return game.addParticle({ kind: 'conf', ink, x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 50 + Math.random() * 60, grav: 200, drag: 1.6, life: 0.7 + Math.random() * 0.4, size: size * (0.7 + Math.random() * 0.6), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14 });
  }
  let lastStep = -1;

  /* ================================================================ style */
  const SPR = {};
  Styles.register({
    id: 'riso',
    name: 'Risograph Print',
    family: 'Print · Risograph',
    description: 'A three-ink risograph zine: fluorescent pink, blue and yellow soy inks overprinting on recycled paper, slightly out of register, with coarse halftones and drum grain.',
    groundColor: PAPER_HEX,
    groundResMax: 2.5,
    groundNearest: true,
    chunkSize: 256,
    fonts: ['Rubik+Mono+One', 'Space+Grotesk:wght@400;500;700', 'DM+Mono:wght@400;500'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = U.clamp(Math.round(S * 1.6), 3, 8);
      buildTables();
      const actor = (box, fn, seed) => { const P = new Press(box, K, { seed }); fn(P); return bake(P, { plates: true, flash: true }); };
      const mult = (box, fn, o) => { const P = new Press(box, K, o); fn(P); return bake(P, { comp: false, mult: true }); };
      // main character: 8 walk + 3 idle + crouch + skateboard + recoil poses; creatures 6 / 6 / 4 poses
      const kid = (F, dash) => actor([-12, -36, 12, 1.5], (P) => kidParts(P, F, dash));
      SPR.kidWalk = KID_WALK.map((F) => kid(F)); SPR.kidIdle = KID_IDLE.map((F) => kid(F));
      SPR.kidCrouch = kid(KID_CROUCH); SPR.kidRecoil = kid(KID_RECOIL); SPR.kidDash = kid(KID_DASH, true);
      SPR.crit = [0, 1].map((v) => Array.from({ length: CR_N }, (_, f) => actor([-13, -25, 13, 1.5], (P) => critterParts(P, f, v))));
      SPR.ghost = Array.from({ length: GH_N }, (_, f) => actor([-19, -22, 8, 1], (P) => ghostParts(P, f)));
      SPR.colo = [0, 1, 2, 3].map((f) => actor([-30, -62, 30, 1.5], (P) => colossusParts(P, f)));
      SPR.props = {};
      for (const t in PROP_DEF) {
        const d = PROP_DEF[t];
        SPR.props[t] = [];
        for (let v = 0; v < d.n; v++) { const P = new Press(d.box, K); d.fn(P, v); SPR.props[t].push(bake(P, { mult: true })); }
      }
      SPR.pellet = mult([-12, -3.5, 3.5, 3.5], pelletParts, { margin: 1.2 });
      SPR.gemS = mult([-4, -5.2, 4, 5.2], (P) => gemParts(P, false), { margin: 1.2 });
      SPR.gemB = mult([-6.5, -6.5, 6.5, 6.5], (P) => gemParts(P, true), { margin: 1.2 });
      SPR.rays = mult([-9, -9, 9, 9], sunRays, { margin: 1.2 });
      SPR.face = mult([-6, -6, 6, 6], sunFace, { margin: 1.2 });
      SPR.splat = ALL.map((ink) => [0, 1, 2].map((v) => mult([-8, -8, 8, 8], (P) => splatParts(P, ink, v), { margin: 1.2 })));
      SPR.burst = [0, 1, 2].map((v) => mult([-11, -11, 11, 11], (P) => burstParts(P, v), { margin: 1.2 }));
      SPR.shadow = mult([-10, -4, 10, 4], shadowParts, { margin: 1 });
      SPR.glow = mult([-15.5, -8, 15.5, 8], glowParts, { margin: 1 });
      if (document.fonts && document.fonts.load) {
        try { document.fonts.load('20px "Rubik Mono One"', '0123456789'); document.fonts.load('500 12px "DM Mono"'); document.fonts.load('700 16px "Space Grotesk"'); } catch (e) { /* ignore */ }
      }
    },

    /* ------------------------------------------------------------ ground */
    *renderGroundChunk(ctx, info) {
      const res = info.res, Wp = info.px, wx0 = info.wx, wy0 = info.wy, inv = 1 / res;
      const cpx = GS * res, nc = Math.ceil(Wp / cpx - 1e-6), nn = nc + 1;
      const F = new Float32Array(nn * nn * NF), tmp = new Float32Array(NF);
      for (let j = 0; j < nn; j++) {
        for (let i = 0; i < nn; i++) { fieldsAt(wx0 + i * GS, wy0 + j * GS, tmp); F.set(tmp, (j * nn + i) * NF); }
        if ((j & 3) === 3) yield;
      }
      // per cell: misregistration shift of the four region fields for every plate, 1/|gradient| (distances),
      // and a fast path: the region code if the whole cell lies inside one region for all three plates
      const CS = new Float32Array(nc * nc * 16), CM = new Int8Array(nc * nc), CNP = new Uint8Array(nc * nc);
      for (let gy = 0; gy < nc; gy++) {
        for (let gx = 0; gx < nc; gx++) {
          const o00 = (gy * nn + gx) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF, ci = gy * nc + gx, o = ci * 16;
          let mixed = false;
          const ins = [false, false, false, false];
          for (let L = 0; L < 4; L++) {
            const a = F[o00 + L], b = F[o10 + L], c = F[o01 + L], d = F[o11 + L];
            const du = ((b - a) + (d - c)) * 0.5 / GS, dv = ((c - a) + (d - b)) * 0.5 / GS;
            let ms = 0;
            for (let i = 0; i < 3; i++) { const sh = -(du * GMR[i][0] + dv * GMR[i][1]); CS[o + L * 4 + i] = sh; if (Math.abs(sh) > ms) ms = Math.abs(sh); }
            CS[o + L * 4 + 3] = 1 / (Math.sqrt(du * du + dv * dv) + 1e-6);
            const mn = Math.min(a, b, c, d) - ms - 0.002, mx = Math.max(a, b, c, d) + ms + 0.002;
            if (mn > 0) ins[L] = true;
            else if (mx >= 0) mixed = true;
          }
          CM[ci] = mixed ? -1 : ins[0] ? 4 : ins[3] ? 3 : ins[2] ? 2 : ins[1] ? 1 : 0;
          const pmx = Math.max(F[o00], F[o10], F[o01], F[o11]);
          CNP[ci] = pmx * CS[o + 3] > -11 ? 1 : 0;
        }
      }
      yield;
      const dm = U.canvas(Wp, Wp).ctx;
      dm.fillStyle = '#000'; dm.fillRect(0, 0, Wp, Wp);
      dm.globalCompositeOperation = 'lighter';
      yield* decals(dm, info);
      const dd = dm.getImageData(0, 0, Wp, Wp).data;
      yield;
      const img = ctx.createImageData(Wp, Wp);
      const gcol = new Int32Array(Wp), fcol = new Int32Array(Wp);
      for (let px = 0; px < Wp; px++) { const x = wx0 + (px + 0.5) * inv; gcol[px] = Math.floor(x * 2.5) & 255; fcol[px] = Math.floor(x / FMC) & 255; }
      const J = { F, CS, CM, CNP, dd, buf: new Uint32Array(img.data.buffer), gcol, fcol, Wp, nc, nn, cpx, res, wx0, wy0 };
      for (let py = 0; py < Wp; py += 6) { shadeRows(J, py, Math.min(Wp, py + 6)); yield; }
      for (let y0 = 0; y0 < Wp; y0 += 128) { ctx.putImageData(img, 0, 0, 0, y0, Wp, Math.min(128, Wp - y0)); yield; }
    },

    propsForChunk(info) {
      const out = [];
      G.scatterOwned(info, 84, 5151, (x, y, rng) => {
        if (G.nearSpawn(x, y, 95)) return;
        // props gather in groves and little villages (a 330-unit noise field), open paper between them
        const cl = U.smoothstep(0.36, 0.66, U.noise(x / 330, y / 330, 5252));
        const r = rng.next() / (0.3 + 1.5 * cl), vr = rng.next();
        const m = matSafe(x, y, 14);
        if (m < 0 || m >= 3) return;
        let t = null, v = 0;
        if (m === 0) {
          if (r < 0.1) t = 'tree';
          else if (r < 0.16) t = 'pine';
          else if (r < 0.22) t = 'bush';
          else if (r < 0.27) { t = 'rock'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.31) t = 'flowers';
          else if (r < 0.335) { t = 'house'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.355) t = 'lamp';
          else if (r < 0.375) t = 'plant';
        } else if (m === 1) {
          if (r < 0.1) t = 'tree';
          else if (r < 0.2) t = 'bush';
          else if (r < 0.28) t = 'pine';
          else if (r < 0.34) t = 'flowers';
          else if (r < 0.37) { t = 'rock'; v = 0; }
        } else {
          if (r < 0.12) { t = 'tree'; v = 1; }
          else if (r < 0.22) t = 'flowers';
          else if (r < 0.26) t = 'bush';
          else if (r < 0.3) t = 'plant';
          else if (r < 0.33) { t = 'house'; v = 1; }
        }
        if (!t) return;
        out.push({ x, y, t, v, f: rng.chance(0.5), sw: rng.next() * TAU, pad: t === 'tree' || t === 'pine' || t === 'lamp' ? 60 : 30 });
      });
      return out;
    },

    drawProp(ctx, p, view) {
      const V = tf(view), s = SPR.props[p.t][p.v];
      ctx.globalCompositeOperation = OVER();
      if (p.t === 'tree' || p.t === 'pine' || p.t === 'flowers' || p.t === 'plant') {
        const k = Math.sin(view.rt * 1.3 + p.sw) * (p.t === 'flowers' ? 0.05 : 0.018), S = V.S, ik = 1 / s.k, f = p.f && p.t !== 'house' ? -1 : 1;
        ctx.setTransform(S * f, 0, -k * S, S, V.ox + p.x * S, V.oy + p.y * S);
        ctx.drawImage(OVER() === 'multiply' ? s.mult : s.comp, -s.ox * ik, -s.oy * ik, s.w * ik, s.h * ik);
        ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
      } else blit(ctx, V, s, OVER() === 'multiply' ? s.mult : s.comp, p.x, p.y, 1, 1, 0, p.f && p.t === 'rock');
      ctx.globalCompositeOperation = 'source-over';
    },

    drawShadow(ctx, o, view) {
      let rx, a = 0.85, x = o.x, y = o.y;
      if (o.kind === 'prop') { rx = PROP_DEF[o.t] ? PROP_DEF[o.t].sh : 0; if (!rx) return; x += rx * 0.18; a = 0.7; }
      else if (o.kind === 'enemy') {
        let k = 1;
        if (o.dying) { if (o.deathT > 0.5) return; k = 1 - o.deathT / 0.5; }
        if (o.spawnT < 1) k *= U.clamp(o.spawnT * 2 - 0.4, 0, 1);
        if (k <= 0.02) return;
        rx = (o.type === 'ghost' ? 5.6 : o.type === 'colossus' ? 21 : 9.4) * k;
        if (o.type === 'ghost') a = 0.55;
      } else rx = 9.2;
      const sc = rx / 9.6;
      ctx.globalCompositeOperation = OVER();
      ctx.globalAlpha = a;
      blit(ctx, tf(view), SPR.shadow, SPR.shadow.mult, x, y + 0.3, sc, sc);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    drawGroundOverlay(ctx, view, game) {
      // registration targets mark where a creature is being printed into the world
      ctx.globalCompositeOperation = OVER();
      ctx.lineWidth = 0.8;
      for (const e of game.enemies) {
        if (e.dying || e.spawnT >= 1) continue;
        if (e.x < view.x0 - 40 || e.x > view.x1 + 40 || e.y < view.y0 - 20 || e.y > view.y1 + 60) continue;
        const q = e.spawnT, base = e.type === 'colossus' ? 15 : e.type === 'ghost' ? 7 : 9;
        const r = base * (1.5 - q * 0.5), a = q > 0.75 ? (1 - q) / 0.25 : Math.min(1, q * 5);
        const spread = (1 - q) * 3.2;
        for (const i of [PK, BL]) {
          const ox = MR[i][0] * spread * 2, oy = MR[i][1] * spread;
          ctx.globalAlpha = a * DENS[i];
          ctx.strokeStyle = INK_HEX[i];
          ctx.beginPath();
          ctx.ellipse(e.x + ox, e.y + oy, r, r * 0.5, 0, 0, TAU);
          ctx.moveTo(e.x + ox + r * 0.42, e.y + oy); ctx.ellipse(e.x + ox, e.y + oy, r * 0.42, r * 0.21, 0, 0, TAU);
          ctx.moveTo(e.x + ox - r * 1.35, e.y + oy); ctx.lineTo(e.x + ox + r * 1.35, e.y + oy);
          ctx.moveTo(e.x + ox, e.y + oy - r * 0.7); ctx.lineTo(e.x + ox, e.y + oy + r * 0.7);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    drawGem(ctx, g, view) {
      const V = tf(view), s = g.big ? SPR.gemB : SPR.gemS;
      let h = 3 + Math.sin(view.rt * 5 + g.seed * 20) * 1.2, sc = 1;
      if (g.pop > 0) { const q = 1 - g.pop; h += Math.sin(q * PI) * 10; sc = 0.4 + 0.6 * U.ease.outBack(Math.min(1, q * 1.4)); }
      ctx.globalCompositeOperation = OVER();
      ctx.globalAlpha = 0.7;
      blit(ctx, V, SPR.shadow, SPR.shadow.mult, g.x, g.y, g.big ? 0.4 : 0.26, g.big ? 0.4 : 0.26);
      ctx.globalAlpha = 1;
      const spin = g.big ? Math.sin(view.rt * 2 + g.seed * 9) * 0.4 : 0;
      blit(ctx, V, s, s.mult, g.x, g.y - h, sc, sc, spin);
      ctx.globalCompositeOperation = 'source-over';
    },

    drawEnemy(ctx, e, view) {
      const V = tf(view);
      let s, sx = 1, sy = 1, y = e.y, rot = 0;
      const scl = 0.95 + (e.seed || 0) * 0.1;
      if (e.type === 'creeper') {
        const ph = e.anim * 0.85 + (e.seed || 0);
        s = SPR.crit[(e.seed || 0) < 0.55 ? 0 : 1][((Math.floor(ph * CR_N) % CR_N) + CR_N) % CR_N];
        const sn = Math.sin(ph * TAU), up = Math.abs(sn);
        y -= up * 1.4; sx = 1 + (1 - up) * 0.05; sy = 1 - (1 - up) * 0.05 + up * 0.03;
        rot = sn * 0.07;
      } else if (e.type === 'ghost') {
        s = SPR.ghost[Math.floor(view.rt * 8 + (e.seed || 0) * 6) % GH_N];
        // eased hover on a triangle wave (lingers at the top and the bottom), every ghost on its own clock
        const u = (view.rt * 0.42 + (e.seed || 0) * 3.1) % 1, tri = u < 0.5 ? u * 2 : 2 - u * 2;
        y -= 2.6 + tri * tri * (3 - 2 * tri) * 3.4;
        rot = U.clamp((e.vx || 0) / 64, -1, 1) * 0.12;
      } else {
        const ph = e.anim * 0.32 + (e.seed || 0);
        s = SPR.colo[Math.floor(ph * 4) & 3];
        const sn = Math.sin(ph * TAU), up = Math.abs(sn), contact = Math.pow(1 - up, 3);
        y -= up * 2.2; sx = 1 + contact * 0.06; sy = 1 - contact * 0.06; rot = sn * 0.025;
      }
      sx *= scl; sy *= scl;
      const flip = e.facing < 0;
      if (e.spawnT < 1) {
        // the three plates slide into register one after another: yellow, pink, blue
        const q = e.spawnT, order = [1, 2, 0];
        const al = [0, 0, 0];
        for (let i = 0; i < 3; i++) al[i] = U.clamp((q - order[i] * 0.16) / 0.4, 0, 1);
        const d = Math.pow(1 - q, 2) * 14;
        const pop = e.type === 'ghost' ? 1 : 0.6 + 0.4 * U.ease.outBack(Math.min(1, q * 1.2));
        if (q < 0.9) plates(ctx, V, s, e.x, y, sx * pop * (flip ? 1 : 1), sy * pop, flip, d, al);
        if (q > 0.72) { ctx.globalAlpha = U.clamp((q - 0.72) / 0.28, 0, 1); blit(ctx, V, s, s.comp, e.x, y, sx, sy, rot, flip); ctx.globalAlpha = 1; }
        return;
      }
      if (e.dying) {
        // the print comes apart: plates drift out of register and fade
        const q = e.deathT;
        if (q >= 1) return;
        const k = 1 + q * 0.25;
        if (q < 0.18) { ctx.globalAlpha = 1 - q / 0.18; blit(ctx, V, s, s.flash, e.x, y, sx * k, sy * k, rot, flip); ctx.globalAlpha = 1; }
        plates(ctx, V, s, e.x, y - q * 4, sx * k, sy * k, flip, U.ease.outQuad(q) * 13, Math.pow(1 - q, 1.2));
        return;
      }
      const fl = e.flash || 0;
      let hx = e.x;
      if (fl > 0) {
        // hit: squash, a knock-back shove and a tilt away from the blow, easing out with flash² (~0.14 s)
        sx *= 1 + 0.14 * fl; sy *= 1 - 0.1 * fl;
        const kl = Math.hypot(e.kx || 0, e.ky || 0) || 1, k2 = fl * fl;
        hx += ((e.kx || 0) / kl) * 2.6 * k2; y += ((e.ky || 0) / kl) * 1.4 * k2; rot += ((e.kx || 0) / kl) * 0.22 * fl;
      }
      blit(ctx, V, s, s.comp, hx, y, sx, sy, rot, flip);
      if (fl > 0.02) {
        ctx.globalAlpha = Math.min(1, fl * 1.5);
        blit(ctx, V, s, s.flash, hx + fl * 1.4, y, sx, sy, rot, flip);
        ctx.globalAlpha = 1;
        plates(ctx, V, s, hx, y, sx, sy, flip, fl * 3.2, [fl * 0.7, fl * 0.5, 0]);
      }
    },

    drawPlayer(ctx, p, view) {
      const V = tf(view), game = view.game;
      let sx = 1, sy = 1, lift = 0, rot = 0, s;
      const dash = p.dashT > 0 && p.dashT <= 0.165, crouch = p.dashT > 0.165;
      if (p.hurtT > 0.45) s = SPR.kidRecoil;
      else if (crouch) s = SPR.kidCrouch;                        // one crouch frame of anticipation
      else if (dash) s = SPR.kidDash;
      else if (p.moving) {
        const i = Math.floor(p.anim * 0.4 * 8) & 7;
        s = SPR.kidWalk[i];
        // an ink fleck kicked up on every contact pose
        if ((i & 3) === 0 && i !== lastStep && game && game.state === 'play' && Math.random() < 0.55) dot(game, p.x - p.facing * 4, p.y + 0.5, 0.5, Math.random() < 0.5 ? YE : PK, 0.9, 14, 0.35, { vz: 10, grav: 60 });
        lastStep = i;
      } else {
        // held breathing: exhale - mid - inhale - mid on an eased 2.6 s clock (lingers at both ends)
        const br = 0.5 - 0.5 * Math.cos(((view.rt / 2.6) % 1) * TAU);
        s = SPR.kidIdle[br < 0.3 ? 0 : br < 0.75 ? 1 : 2];
      }
      if (p.shootT > 0) { sy *= 1 - 0.045 * p.shootT; sx *= 1 + 0.035 * p.shootT; }
      if (p.levelT > 0) { const w = Math.sin(p.levelT * PI * 4) * p.levelT; sy *= 1 + 0.15 * w; sx *= 1 - 0.09 * w; lift += p.levelT * 5 * Math.abs(Math.sin(p.levelT * PI * 2)); }
      const hurt = p.hurtT > 0;
      if (hurt) { sx *= 1 + 0.1 * p.hurtT; sy *= 1 - 0.08 * p.hurtT; }
      const flip = p.facing < 0;
      if (dash) {
        const k = U.clamp(p.dashT / 0.2, 0, 1);
        // speed: a smear of the pink and blue plates left behind + ink streaks
        ctx.globalCompositeOperation = OVER();
        for (let n = 2; n >= 1; n--) {
          ctx.globalAlpha = 0.5 * k / n;
          blit(ctx, V, s, s.pl[n === 2 ? BL : PK], p.x - p.dashX * n * 7, p.y - p.dashY * n * 7, 1, 1, 0, flip);
        }
        ctx.globalAlpha = 0.85 * k;
        ctx.strokeStyle = INK_HEX[PK]; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const off = (i - 1.5) * 5, nx = -p.dashY, ny = p.dashX;
          const x0 = p.x + nx * off - p.dashX * 8, y0 = p.y - 11 + ny * off - p.dashY * 8, len = (12 + (i % 2) * 9) * k;
          ctx.moveTo(x0, y0); ctx.lineTo(x0 - p.dashX * len, y0 - p.dashY * len);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        rot = -0.05 * p.facing;
      }
      // invulnerable blink = the pink and blue plates slip out of register (never a see-through main character)
      if (p.iframes > 0 && !hurt && !dash && (Math.floor(view.rt * 12) & 1)) plates(ctx, V, s, p.x, p.y - lift, sx, sy, flip, 2.4, [0.85, 0.85, 0]);
      blit(ctx, V, s, s.comp, p.x, p.y - lift, sx, sy, rot, flip);
      if (hurt) {
        // misregistration jolt: the plates kick out of register
        ctx.globalAlpha = Math.min(0.9, p.hurtT * 1.3);
        blit(ctx, V, s, s.flash, p.x, p.y - lift, sx, sy, rot, flip);
        ctx.globalAlpha = 1;
        plates(ctx, V, s, p.x, p.y - lift, sx, sy, flip, p.hurtT * 4, [p.hurtT * 0.8, p.hurtT * 0.8, 0]);
      }
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view);
      const bob = Math.sin(view.rt * 4 + o.idx * 1.7) * 1.4, y = o.y - 3 + bob;
      ctx.globalCompositeOperation = OVER();
      ctx.globalAlpha = 0.8;
      blit(ctx, V, SPR.glow, SPR.glow.mult, o.x, o.y + 4, 0.65, 0.65);
      ctx.globalAlpha = 0.55;
      blit(ctx, V, SPR.shadow, SPR.shadow.mult, o.x, o.y + 4, 0.45, 0.45);
      ctx.globalAlpha = 1;
      blit(ctx, V, SPR.rays, SPR.rays.mult, o.x, y - 7, 1, 1, view.rt * 1.6 + o.idx);
      blit(ctx, V, SPR.face, SPR.face.mult, o.x, y - 7, 1, 1, Math.sin(view.rt * 3 + o.idx) * 0.15);
      ctx.globalCompositeOperation = 'source-over';
    },

    drawProjectile(ctx, pr, view) {
      const V = tf(view);
      ctx.globalCompositeOperation = OVER();
      ctx.globalAlpha = 0.5;
      blit(ctx, V, SPR.shadow, SPR.shadow.mult, pr.x, pr.y + 6, 0.24, 0.24);
      ctx.globalAlpha = Math.min(1, pr.age * 12 + 0.3);
      blit(ctx, V, SPR.pellet, SPR.pellet.mult, pr.x, pr.y, 1, 1, pr.angle);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    drawParticle(ctx, pt, view) {
      const V = tf(view), t = 1 - pt.life / pt.max, z = pt.z || 0, y = pt.y - z;
      ctx.globalCompositeOperation = OVER();
      switch (pt.kind) {
        case 'dot': {
          const r = pt.size * (t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1);
          if (r > 0.05) { ctx.globalAlpha = DENS[pt.ink]; ctx.fillStyle = INK_HEX[pt.ink]; ctx.beginPath(); ctx.arc(pt.x, y, r, 0, TAU); ctx.fill(); }
          break;
        }
        case 'conf': {
          const r = pt.size * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1);
          if (r <= 0.05) break;
          const sq = Math.cos(pt.rot * 1.7);
          const c = Math.cos(pt.rot) * r, s = Math.sin(pt.rot) * r;
          ctx.globalAlpha = DENS[pt.ink]; ctx.fillStyle = INK_HEX[pt.ink];
          ctx.beginPath();
          ctx.moveTo(pt.x + c * 1.2, y + s * 1.2 * sq); ctx.lineTo(pt.x - c * 0.6 - s, y + (-s * 0.6 + c) * sq); ctx.lineTo(pt.x - c * 0.6 + s, y + (-s * 0.6 - c) * sq);
          ctx.closePath(); ctx.fill();
          break;
        }
        case 'splat': {
          const sc = pt.size * (t < 0.12 ? U.ease.outBack(t / 0.12) : 1 + (t - 0.12) * 0.15);
          ctx.globalAlpha = t > 0.55 ? Math.max(0, 1 - (t - 0.55) / 0.45) : 1;
          const s = SPR.splat[pt.ink][pt.v || 0];
          blit(ctx, V, s, s.mult, pt.x, y, sc, sc * 0.9, pt.rot);
          break;
        }
        case 'burst': {
          const sc = pt.size * (t < 0.18 ? U.ease.outBack(t / 0.18) : 1 + (t - 0.18) * 0.3);
          ctx.globalAlpha = t > 0.5 ? Math.max(0, 1 - (t - 0.5) / 0.5) : 1;
          const s = SPR.burst[pt.v || 0];
          blit(ctx, V, s, s.mult, pt.x, y, sc, sc, pt.rot + t * 0.6);
          break;
        }
        case 'halo': {
          // a ring of halftone dots that grows and thins out – two plates, out of register
          const n = pt.n || 16, R = pt.size * (3 + 24 * U.ease.outQuad(t)), dr = pt.size * 1.6 * (1 - t);
          if (dr <= 0.05) break;
          const inks = pt.inks || [PK, BL];
          inks.forEach((ink, j) => {
            ctx.globalAlpha = DENS[ink]; ctx.fillStyle = INK_HEX[ink];
            const ox = MR[ink][0] * 1.6, oy = MR[ink][1] * 1.6, rr = R * (j ? 0.78 : 1), sz = dr * (j ? 0.8 : 1);
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
              const a = (i + j * 0.5) / n * TAU + pt.rot;
              const px = pt.x + ox + Math.cos(a) * rr, py = y + oy + Math.sin(a) * rr * (pt.flat ? 0.5 : 1);
              ctx.moveTo(px + sz, py); ctx.arc(px, py, sz, 0, TAU);
            }
            ctx.fill();
          });
          break;
        }
        case 'target': {
          const r = pt.size * (2.5 + 5 * U.ease.outQuad(t));
          ctx.lineWidth = 0.75 * pt.size * (1 - t * 0.5);
          for (const ink of [PK, BL]) {
            const ox = MR[ink][0] * (1 + t * 3), oy = MR[ink][1] * (1 + t * 3);
            ctx.globalAlpha = DENS[ink] * (1 - t);
            ctx.strokeStyle = INK_HEX[ink];
            ctx.beginPath();
            ctx.arc(pt.x + ox, y + oy, r, 0, TAU);
            ctx.moveTo(pt.x + ox - r * 1.5, y + oy); ctx.lineTo(pt.x + ox + r * 1.5, y + oy);
            ctx.moveTo(pt.x + ox, y + oy - r * 1.5); ctx.lineTo(pt.x + ox, y + oy + r * 1.5);
            ctx.stroke();
          }
          break;
        }
        case 'scrib': {
          const a = 1 - t;
          ctx.globalAlpha = DENS[pt.ink] * a; ctx.strokeStyle = INK_HEX[pt.ink]; ctx.lineWidth = 0.65; ctx.lineCap = 'round';
          const r = U.mulberry32(pt.sd || 1), s = pt.size;
          ctx.beginPath(); ctx.moveTo(pt.x, y);
          let x = pt.x, yy = y;
          for (let i = 0; i < 4; i++) { const nx = x + (r() - 0.5) * 5 * s, ny = yy + (r() - 0.5) * 4 * s; ctx.quadraticCurveTo(x + (r() - 0.5) * 6 * s, yy + (r() - 0.5) * 6 * s, nx, ny); x = nx; yy = ny; }
          ctx.stroke();
          break;
        }
        case 'star': {
          const sc = pt.size * (t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7);
          if (sc <= 0.02) break;
          const r = 4 * sc, q = 0.9 * sc;
          for (const ink of [YE, PK]) {
            const ox = ink === PK ? 0.7 * sc : 0, oy = ink === PK ? 0.5 * sc : 0;
            ctx.globalAlpha = DENS[ink] * (ink === PK ? 0.7 : 1); ctx.fillStyle = INK_HEX[ink];
            ctx.beginPath();
            const cx = pt.x + ox, cy = y + oy;
            ctx.moveTo(cx, cy - r); ctx.lineTo(cx + q, cy - q); ctx.lineTo(cx + r, cy); ctx.lineTo(cx + q, cy + q);
            ctx.lineTo(cx, cy + r); ctx.lineTo(cx - q, cy + q); ctx.lineTo(cx - r, cy); ctx.lineTo(cx - q, cy - q); ctx.closePath();
            ctx.fill();
          }
          break;
        }
        default: {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = U.clamp(pt.life / pt.max, 0, 1);
          ctx.fillStyle = pt.color || INK_HEX[PK];
          ctx.beginPath(); ctx.arc(pt.x, y, (pt.size || 2) * 0.5, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    drawNumber(ctx, n, view) {
      const V = tf(view), s = numSprite(n.value, n.crit, view.rt), t = 1 - n.life / n.max;
      let sc = t < 0.1 ? 0.4 + (t / 0.1) * 0.9 : t < 0.22 ? 1.3 - ((t - 0.1) / 0.12) * 0.3 : 1;
      if (t > 0.75) sc *= 1 - ((t - 0.75) / 0.25) * 0.6;
      ctx.globalAlpha = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.2) : 1;
      blit(ctx, V, s, s.c, n.x, n.y, sc, sc, (n.seed - 0.5) * 0.25);
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      if (!OV || OV.W !== view.W || OV.H !== view.H) OV = buildOverlay(view.W, view.H);
      const W = view.W, H = view.H, m = OV.m;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(OV.band, 0, 0, W, H);
      ctx.drawImage(OV.c, 0, 0, W, m, 0, 0, W, m);
      ctx.drawImage(OV.c, 0, H - m, W, m, 0, H - m, W, m);
      ctx.drawImage(OV.c, 0, m, m, H - 2 * m, 0, m, m, H - 2 * m);
      ctx.drawImage(OV.c, W - m, m, m, H - 2 * m, W - m, m, m, H - 2 * m);
    },

    drawIcon(ctx, id, size) {
      const key = id + '|' + size;
      let img = iconCache.get(key);
      if (!img) {
        buildTables();
        const fn = ICONS[id] || ICONS.dmg;
        const P = new Press([0, 0, 48, 48], size / 48, { margin: 0, pitch: 3.4, mr: 2.0, grain: 2.2 });
        fn(P);
        img = bake(P, { comp: false, mult: true }).mult;
        iconCache.set(key, img);
      }
      ctx.drawImage(img, 0, 0, size, size);
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e) {
      const h = heightOf(e), x = e.x + (Math.random() - 0.5) * 5, z = h + (Math.random() - 0.5) * 4;
      game.addParticle({ kind: 'target', x, y: e.y + 0.5, z, life: 0.22, size: e.type === 'colossus' ? 1.3 : 0.9, drag: 0 });
      const ink = inkOf(e);
      for (let i = 0; i < 3; i++) dot(game, x, e.y + 0.5, z, i === 0 ? YE : ink, 0.9, 55, 0.4);
    },
    onKill(game, e) {
      const x = e.x, y = e.y + 0.6, big = e.type === 'colossus', ghost = e.type === 'ghost', h = heightOf(e);
      const ink = inkOf(e);
      game.addParticle({ kind: 'burst', v: ghost ? 1 : big ? 2 : ink === PK ? 0 : 1, x, y, z: h, life: big ? 0.5 : 0.34, size: big ? 1.7 : ghost ? 0.75 : 0.9, rot: Math.random() * TAU, drag: 0 });
      game.addParticle({ kind: 'splat', ink: ghost ? BL : ink, v: (Math.random() * 3) | 0, x, y: y + 0.5, z: 0, life: big ? 1.1 : 0.8, size: big ? 1.8 : 0.9, rot: Math.random() * TAU, drag: 0 });
      game.addParticle({ kind: 'halo', x, y, z: h, life: big ? 0.6 : 0.4, size: big ? 1.6 : 0.8, rot: Math.random(), n: big ? 22 : 14, drag: 0, inks: ghost ? [BL, PK] : big ? [YE, PK] : [ink, YE] });
      const nC = big ? 14 : ghost ? 3 : 6;
      for (let i = 0; i < nC; i++) conf(game, x, y, h * 0.8, i % 3 === 0 ? YE : i % 3 === 1 ? ink : PK, big ? 1.6 : 1.1, big ? 70 : 50);
      if (ghost) for (let i = 0; i < 4; i++) game.addParticle({ kind: 'scrib', ink: i & 1 ? PK : BL, sd: (Math.random() * 1e6) | 0, x: x + (Math.random() - 0.5) * 8, y, z: h + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 30, vz: 20, drag: 3, life: 0.5, size: 0.9 });
      if (big) game.addParticle({ kind: 'halo', x, y, z: 0, flat: true, life: 0.7, size: 2.2, rot: 0, n: 28, drag: 0, inks: [BL, PK] });
    },
    onHurt(game, p) {
      game.addParticle({ kind: 'target', x: p.x, y: p.y + 0.5, z: 15, life: 0.3, size: 1.6, drag: 0 });
      for (let i = 0; i < 6; i++) dot(game, p.x, p.y + 0.5, 14, i & 1 ? PK : YE, 1.1, 70, 0.45);
    },
    onPickup(game, g) {
      const x = g.x, y = g.y;
      if (Math.random() < (g.big ? 1 : 0.45)) game.addParticle({ kind: 'star', x: x + (Math.random() - 0.5) * 10, y: y + 0.5, z: 8 + Math.random() * 12, life: 0.36, size: g.big ? 1.2 : 0.65, drag: 0 });
      if (g.big) {
        game.addParticle({ kind: 'halo', x, y: y + 0.5, z: 10, life: 0.42, size: 0.8, rot: 0, n: 12, drag: 0, inks: [YE, PK] });
        for (let i = 0; i < 4; i++) dot(game, x, y + 0.5, 10, i & 1 ? PK : YE, 0.9, 40, 0.4);
      }
    },
    onShoot(game, pr) {
      if (Math.random() < 0.3) dot(game, pr.x, pr.y + 4, 3, PK, 0.7, 12, 0.22, { vx: pr.vx * 0.04, vy: pr.vy * 0.04, vz: 0, grav: 0 });
    },
    onDash(game, p) {
      for (let i = 0; i < 5; i++) dot(game, p.x - p.dashX * i * 3 + (Math.random() - 0.5) * 4, p.y + 0.5 - p.dashY * i * 3, 1, i & 1 ? YE : PK, 1.0, 22, 0.4, { vx: -p.dashX * 24, vy: -p.dashY * 24, vz: 14, grav: 80 });
      game.addParticle({ kind: 'halo', x: p.x, y: p.y + 0.5, z: 0, flat: true, life: 0.3, size: 0.8, rot: 0, n: 12, drag: 0, inks: [PK, YE] });
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'halo', x: p.x, y: p.y, z: 0, flat: true, life: 0.75, size: 1.8, rot: 0.1, n: 26, drag: 0, inks: [YE, PK] });
      game.addParticle({ kind: 'halo', x: p.x, y: p.y, z: 14, life: 0.55, size: 1.1, rot: 0.3, n: 18, drag: 0, inks: [BL, PK] });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU, sp = 60 + Math.random() * 30;
        game.addParticle({ kind: 'star', x: p.x, y: p.y + 0.5, z: 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 60, grav: 140, drag: 2.0, life: 0.8, size: 1.0 });
      }
    },
    onDeath(game, p) {
      game.addParticle({ kind: 'burst', v: 0, x: p.x, y: p.y + 0.5, z: 14, life: 0.7, size: 2.0, rot: 0, drag: 0 });
      game.addParticle({ kind: 'splat', ink: BL, v: 1, x: p.x, y: p.y + 1, z: 0, life: 1.4, size: 2.2, rot: 0.4, drag: 0 });
      for (let i = 0; i < 14; i++) conf(game, p.x, p.y, 14, i % 3, 1.4, 70);
    },
  });
})();
