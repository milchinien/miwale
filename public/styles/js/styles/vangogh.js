/* Style "Sternennacht" – a living post-impressionist oil painting at night (Van Gogh: The Starry Night,
   Café Terrace at Night, Wheat Field with Cypresses). Everything is built from short, thick, directional
   impasto brush strokes, with a stroke-size hierarchy:
   - ground: three passes of pre-rendered atlas strokes over a dark under-painting – big calm "coat" strokes
     everywhere, medium "body" strokes, and small bright "focal" strokes only along designed edges (field
     hedges, forest rims and cast shadows, pond shores, path borders and ruts). Every stroke follows the form
     of its region (furrows parallel to the field edge, ripples parallel to the shore, grass in the wind).
   - characters / props: painted stroke by stroke into offscreen canvases at init, 6–8 poses per cycle
     ("on twos"), plus runtime secondary motion (scarf, lean, squash, smear-death, painted-in spawn)
   - light: swirling halos of strokes only around real light sources (face, lanterns, windows, lamps)
   - HUD: museum look – gilded frames, painted brush-stroke bars, framed little paintings as cards. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const K = 3;                  // character / prop sprite resolution (px per world unit)
  const KG = 3;                 // ground stroke atlas resolution (px per world unit)
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const clamp = U.clamp;
  const H = U.hex;
  const rgb = U.rgb;
  const hexes = (a) => a.map(H);
  const LIGHT = [255, 246, 220];
  const lit = (c, t) => U.mix(c, LIGHT, t);
  const hyp = (a, b) => Math.sqrt(a * a + b * b);

  /* ======================================================================
     1. The brush stroke – one impasto dab: blunt start, tapered end, light ridge, dark edge, bristle groove
     ====================================================================== */
  const NO = {};
  function stroke(ctx, x, y, ang, len, wid, col, r, o) {
    o = o || NO;
    const hl = len * 0.5, hw = wid * 0.5;
    const b = (o.bend !== undefined ? o.bend : (r.next() - 0.5) * 0.36) * len;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    if (o.a !== undefined) ctx.globalAlpha = o.a;
    ctx.beginPath();
    ctx.moveTo(-hl, -hw * 0.85);
    ctx.quadraticCurveTo(0, -hw * 1.25 + b, hl, b * 0.12 - hw * 0.14);
    ctx.lineTo(hl + hw * 0.35, b * 0.12);
    ctx.lineTo(hl, b * 0.12 + hw * 0.14);
    ctx.quadraticCurveTo(0, hw * 1.25 + b, -hl, hw * 0.85);
    ctx.quadraticCurveTo(-hl - hw * 1.15, 0, -hl, -hw * 0.85);
    ctx.fillStyle = rgb(col);
    ctx.fill();
    ctx.lineCap = 'round';
    // light ridge of the paint body
    ctx.beginPath();
    ctx.moveTo(-hl * 0.88, -hw * 0.32);
    ctx.quadraticCurveTo(0, -hw * 0.5 + b, hl * 0.72, b * 0.12 - hw * 0.08);
    ctx.lineWidth = hw * 0.48;
    ctx.strokeStyle = rgb(lit(col, o.hi !== undefined ? o.hi : 0.3), 0.8);
    ctx.stroke();
    // shadowed edge
    ctx.beginPath();
    ctx.moveTo(-hl * 0.95, hw * 0.6);
    ctx.quadraticCurveTo(0, hw * 0.86 + b, hl * 0.85, b * 0.12 + hw * 0.1);
    ctx.lineWidth = hw * 0.32;
    ctx.strokeStyle = rgb(U.mul(col, o.lo !== undefined ? o.lo : 0.58), 0.75);
    ctx.stroke();
    // bristle groove
    const v1 = (r.next() - 0.5) * hw * 0.9;
    ctx.beginPath();
    ctx.moveTo(-hl * 0.55, v1);
    ctx.quadraticCurveTo(hl * 0.2, v1 * 0.8 + b * 0.9, hl * 0.95, b * 0.12 + v1 * 0.3);
    ctx.lineWidth = Math.max(0.05, wid * 0.08);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = rgb(U.mul(col, o.lo !== undefined ? 0.5 + o.lo * 0.35 : 0.7), 0.55);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- polygons & painted regions ---------- */
  function blob(cx, cy, rx, ry, n, rough, r) {
    const P = [];
    const p1 = r.next() * TAU, p2 = r.next() * TAU;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + rough * (0.6 * Math.sin(a * 3 + p1) + 0.4 * Math.sin(a * 5 + p2));
      P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return P;
  }
  function spline(P, steps) {
    const out = [], n = P.length;
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    return out;
  }
  function pathOf(P) {
    const p = new Path2D();
    p.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < P.length; i++) p.lineTo(P[i][0], P[i][1]);
    p.closePath();
    return p;
  }
  function inPoly(P, x, y) {
    let ins = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const xi = P[i][0], yi = P[i][1], xj = P[j][0], yj = P[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  }
  function bbox(P) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of P) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    return { x0, y0, x1, y1 };
  }
  /** Paint a polygon with strokes: o = { base, col(x,y,r), ang(x,y,r), sp, len, wid, jit, edge, so } */
  function paint(ctx, P, r, o) {
    const path = pathOf(P), bb = bbox(P);
    if (o.base) { ctx.fillStyle = rgb(o.base); ctx.fill(path); }
    ctx.save();
    ctx.clip(path);
    const sp = o.sp, jit = o.jit === undefined ? 0.25 : o.jit, sy = sp * 0.75;
    for (let y = bb.y0; y <= bb.y1 + sy * 0.5; y += sy) {
      for (let x = bb.x0; x <= bb.x1 + sp * 0.5; x += sp) {
        const px = x + (r.next() - 0.5) * sp, py = y + (r.next() - 0.5) * sy;
        if (!inPoly(P, px, py)) continue;
        const col = o.col(px, py, r);
        if (!col) continue;
        stroke(ctx, px, py, o.ang(px, py, r) + (r.next() - 0.5) * jit * 2, o.len * (0.75 + r.next() * 0.5), o.wid * (0.8 + r.next() * 0.4), col, r, o.so);
      }
    }
    ctx.restore();
    if (o.edge) contour(ctx, P, r, o.edge);
  }
  const CONT_O = { hi: 0.16 };
  /** Painted dark contour (Van Gogh's prussian-blue outlines): strokes laid along the polygon edge. */
  function contour(ctx, P, r, e) {
    const n = P.length;
    let cx = 0, cy = 0;
    for (const p of P) { cx += p[0]; cy += p[1]; }
    cx /= n; cy /= n;
    const step = e.l * 0.6;
    let carry = r.next() * step;
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = hyp(dx, dy);
      if (L < 1e-6) continue;
      const ang = Math.atan2(dy, dx);
      let d = carry;
      while (d < L) {
        const t = d / L, x = a[0] + dx * t, y = a[1] + dy * t;
        const ox = x - cx, oy = y - cy, ol = hyp(ox, oy) || 1;
        const sh = (ox / ol) * 0.55 + (oy / ol) * 0.83;
        if (!e.skip || !e.skip(x, y, sh)) {
          const w = e.w * (0.7 + 0.55 * clamp01(sh * 0.5 + 0.5));
          stroke(ctx, x, y, ang + (r.next() - 0.5) * 0.2, e.l * (0.8 + r.next() * 0.4), w, e.col, r, CONT_O);
        }
        d += step;
      }
      carry = d - L;
    }
  }
  /** a single straight-ish stroke between two points */
  function seg(ctx, x0, y0, x1, y1, wid, col, r, o) {
    const L = hyp(x1 - x0, y1 - y0);
    stroke(ctx, (x0 + x1) / 2, (y0 + y1) / 2, Math.atan2(y1 - y0, x1 - x0), L + wid * 0.4, wid, col, r, o);
  }
  /** strokes following a polyline */
  function polyStroke(ctx, pts, wid, l, col, r, o) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const L = hyp(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.round(L / l));
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        seg(ctx, a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, wid, Array.isArray(col[0]) ? col[(r.next() * col.length) | 0] : col, r, o);
      }
    }
  }
  const rampPick = (pal, v) => pal[clamp(Math.round(v), 0, pal.length - 1)];

  /* ---------- sprites ---------- */
  // Offscreen painting canvases are CPU (software) canvases: thousands of small anti-aliased paths
  // rasterise much faster there than on an accelerated canvas.
  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return { c, ctx: c.getContext('2d', { willReadFrequently: true }) };
  }
  /** copy a finished CPU painting into a regular (accelerated) canvas – fast to blit every frame */
  function gpuc(src) {
    const o = U.canvas(src.width, src.height);
    o.ctx.drawImage(src, 0, 0);
    return o.c;
  }
  function mk(wu, hu, ax, ay, fn, k = K) {
    const { c, ctx } = cv(wu * k, hu * k);
    ctx.scale(k, k);
    ctx.translate(ax, ay);
    fn(ctx);
    // trim to the painted pixels (+1 px): transparent margins still cost fill rate on every blit
    const W = c.width, Hh = c.height, d = ctx.getImageData(0, 0, W, Hh).data;
    let x0 = W, y0 = Hh, x1 = -1, y1 = -1;
    for (let y = 0; y < Hh; y++) {
      const row = y * W * 4;
      for (let x = 0; x < W; x++) {
        if (d[row + x * 4 + 3] > 3) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 < 0) return { c: gpuc(c), f: null, w: wu, h: hu, ax, ay };
    x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(W - 1, x1 + 1); y1 = Math.min(Hh - 1, y1 + 1);
    const tw = x1 - x0 + 1, th = y1 - y0 + 1, o = U.canvas(tw, th);
    o.ctx.drawImage(c, x0, y0, tw, th, 0, 0, tw, th);
    return { c: o.c, f: null, w: tw / k, h: th / k, ax: ax - x0 / k, ay: ay - y0 / k };
  }
  function withFlip(s) { s.f = U.flipX(s.c); return s; }
  function blit(ctx, s, x, y, flip, sc, img) {
    sc = sc || 1;
    const im = img || (flip ? s.f || s.c : s.c);
    const ax = flip ? s.w - s.ax : s.ax;
    ctx.drawImage(im, x - ax * sc, y - s.ay * sc, s.w * sc, s.h * sc);
  }

  /* ======================================================================
     2. Ground – regions with designed edges, form-following flow, a 3-scale stroke atlas
     ====================================================================== */
  const LDX = -0.6, LDY = -0.8;            // direction towards the light (upper left) – one light for the whole world
  const MATS = [
    { L: 9, W: 2.5, bend: 0.35, pal: ['#3c2e18', '#54421e', '#6c5624', '#866c2a', '#a08232', '#bc9a3e'], acc: ['#2e3e70', '#4e5a28', '#a65e28'], under: [46, 34, 20] },   // wheat
    { L: 10, W: 2.6, bend: 0.5, pal: ['#1a3430', '#23463c', '#2e5944', '#3c6a48', '#527e4a', '#70944e'], acc: ['#2e4a86', '#8a8a3a', '#3a6a7a'], under: [17, 32, 28] },   // meadow
    { L: 10, W: 2.5, bend: 0.18, pal: ['#1c1e44', '#262a5a', '#31356c', '#3d4180', '#4c4f94', '#6264a8'], acc: ['#8e7c6c', '#2c4f72', '#6a4f8e'], under: [17, 17, 40] },   // path
    { L: 6, W: 2.7, bend: 0.5, pal: ['#0a1612', '#10221a', '#173024', '#1f3e2c', '#2a4c34', '#3a5c3e'], acc: ['#1a2650', '#3a4a24', '#0e2a36'], under: [7, 13, 12] },   // forest floor
    { L: 10, W: 2.4, bend: 0.3, pal: ['#10244e', '#163268', '#1d4384', '#26579c', '#3270ae', '#4a8fbc'], acc: ['#78c0c0', '#c6d2a0', '#e8c850'], under: [10, 21, 50] },   // pond
  ];
  const GOLD_STROKES = ['#d08a26', '#eeb63a', '#ffd862', '#fff0a8'];
  const CALM = { hi: 0.12, lo: 0.82 };      // low-contrast strokes for the big calm "coat" pass
  // all ground strokes live on one CPU sprite sheet (the chunk is painted into a CPU pixel buffer too)
  const ATLAS = { mats: [], sets: {}, sheet: null };
  let SHX = 0, SHY = 0, SHROW = 0;
  function atlasSprite(L, W, bend, col, seed, so) {
    const r = U.rng(seed);
    const w = Math.ceil((L + W * 2) * KG), h = Math.ceil((W * 2.2 + L * Math.abs(bend) * 0.5 + 1) * KG);
    if (SHX + w > 1024) { SHX = 0; SHY += SHROW + 1; SHROW = 0; }
    const ctx = ATLAS.sheet.ctx;
    ctx.save();
    ctx.translate(SHX + w / 2, SHY + h / 2);
    ctx.scale(KG, KG);
    stroke(ctx, 0, 0, 0, L, W, col, r, { bend: (r.next() - 0.5) * bend, hi: so && so.hi, lo: so && so.lo });
    ctx.restore();
    const spr = { sx: SHX, sy: SHY, w, h, cx: w / 2, cy: h / 2 };
    SHX += w + 1;
    SHROW = Math.max(SHROW, h);
    return spr;
  }
  function buildAtlas() {
    let sd = 100;
    ATLAS.sheet = cv(1024, 560);
    SHX = SHY = SHROW = 0;
    for (const m of MATS) {
      const set = { coat: [], pal: [], acc: [] };
      for (const h of m.pal) set.coat.push([0, 1].map(() => atlasSprite(m.L * 1.55, m.W * 1.45, m.bend * 0.7, H(h), sd++, CALM)));
      for (const h of m.pal) set.pal.push([0, 1, 2].map(() => atlasSprite(m.L, m.W, m.bend, H(h), sd++)));
      for (const h of m.acc) set.acc.push([0, 1].map(() => atlasSprite(m.L * 0.8, m.W * 0.9, m.bend, H(h), sd++)));
      ATLAS.mats.push(set);
    }
    const mkSet = (cols, L, W, bend, n, so) => cols.map((h) => Array.from({ length: n }, () => atlasSprite(L, W, bend, H(h), sd++, so)));
    const S = ATLAS.sets;
    S.ink = mkSet(['#0c1228', '#111733', '#18202e'], 5.6, 1.7, 0.2, 2, { hi: 0.08 });         // broken dark contour of regions
    S.rim = mkSet(['#6f8e3c', '#9aae4c', '#c4c062'], 6.5, 2.0, 0.3, 2);                         // moonlit forest rim
    S.shade = mkSet(['#0b1330', '#111b3e', '#0d1a28'], 10, 2.8, 0.25, 2, CALM);                 // cast shadow of the forest
    S.shore = mkSet(['#4f94aa', '#86c8c8', '#bfe4d4'], 7, 1.9, 0.25, 2);                        // ripples along the shore
    S.rut = mkSet(['#5e5a86', '#7a6e8e', '#8e7c6c'], 8, 1.9, 0.12, 2);                           // worn ruts on the paths
    S.gold = mkSet(GOLD_STROKES, 6, 2.2, 0.3, 2);
    S.flower = mkSet(['#f4efd8', '#ffd84a', '#7aa8e8', '#c8a0e0'], 3, 2, 0.5, 2);
    S.poppy = mkSet(['#b02a1a', '#d8452a', '#ec6a32'], 3.2, 2.2, 0.5, 2);
    S.eddy = mkSet(['#5e8a4c', '#86a656', '#2e4a86', '#a4b450'], 9, 2.3, 0.45, 2);
    ATLAS.sw = ATLAS.sheet.c.width;
    const A = (ATLAS.data = ATLAS.sheet.ctx.getImageData(0, 0, ATLAS.sheet.c.width, ATLAS.sheet.c.height).data);
    // trim every sprite rect to its painted pixels (smaller splat spans)
    const trim = (sp) => {
      let x0 = sp.w, y0 = sp.h, x1 = -1, y1 = -1;
      for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
        if (A[((sp.sy + y) * ATLAS.sw + sp.sx + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 < 0) return;
      sp.sx += x0; sp.sy += y0; sp.cx -= x0; sp.cy -= y0; sp.w = x1 - x0 + 1; sp.h = y1 - y0 + 1;
    };
    const all = [];
    const add = (g) => { for (const v of g) all.push(...v); };
    for (const m of ATLAS.mats) { add(m.coat); add(m.pal); add(m.acc); }
    for (const k in S) add(S[k]);
    all.forEach(trim);
  }

  /* ---------- regions ---------- */
  const PI_ = { d: 0, tx: 0, ty: 0 };
  function pathInfo(x, y, out) {
    const s = 1 / 980, e = 2;
    const p = U.fbm(x * s, y * s, 41, 3);
    const px = U.fbm((x + e) * s, y * s, 41, 3);
    const py = U.fbm(x * s, (y + e) * s, 41, 3);
    const gx = (px - p) / e, gy = (py - p) / e;
    const gm = hyp(gx, gy) + 1e-9;
    out.d = Math.abs(p - 0.5) / Math.max(gm, 0.0006);
    out.tx = -gy / gm; out.ty = gx / gm;
  }
  const forestN = (x, y) => U.warped(x / 760, y / 760, 11, 1.0, 3);
  // ponds fade out around the start point (raised noise -> the shore shrinks smoothly, no hard circle)
  const pondN = (x, y) => U.warped(x / 640 + 31.7, y / 640 - 12.3, 23, 0.55, 3) + (1 - U.smoothstep(150 * 150, 320 * 320, x * x + y * y)) * 0.1;
  const wheatN = (x, y) => U.fbm(x / 470 - 7.1, y / 470 + 3.9, 31, 3);
  /** material weights w = [wheat, meadow, path, forest, pond] from the raw fields + distance to the path centre */
  function weightsOf(F, P, Wn, pd, w) {
    const pond = U.smoothstep(0.322, 0.306, P);
    const forest = U.smoothstep(0.59, 0.61, F) * (1 - pond);
    const wheat = U.smoothstep(0.482, 0.518, Wn) * Math.max(0, 1 - forest - pond);
    const meadow = Math.max(0, 1 - forest - pond - wheat);
    const path = (1 - U.smoothstep(9, 15, pd)) * (1 - pond);
    const k = 1 - path;
    w[0] = wheat * k; w[1] = meadow * k; w[2] = path; w[3] = forest * k; w[4] = pond;
  }
  function fieldAt(x, y, w) {
    pathInfo(x, y, PI_);
    weightsOf(forestN(x, y), pondN(x, y), wheatN(x, y), PI_.d, w);
    return w;
  }
  const WT = new Float32Array(5);
  function matAt(x, y) {
    fieldAt(x, y, WT);
    let best = 0;
    for (let i = 1; i < 5; i++) if (WT[i] > WT[best]) best = i;
    return best;
  }

  const GS = 5, GMARGIN = 24, NR = 8, NC = 22;
  // node channels: 0-4 weights | 5 dF 6-7 nF (forest: signed distance to the edge, + inside, unit normal into it)
  // 8 dW 9-10 nW (wheat) | 11 dP 12-13 nP (pond) | 14 pd 15-16 path tangent | 17 wind angle | 18 macro | 19 curl | 20 cluster | 21 detail
  /** allocation-free re-seedable PRNG (mulberry32) for the hot ground loops */
  const RR = {
    a: 0,
    seed(h) { this.a = h | 0; return this; },
    next() {
      let a = (this.a = (this.a + 0x6d2b79f5) | 0);
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); },
  };
  /**
   * Splat one atlas stroke into an RGBA buffer (pure JS, no canvas): rotated + scaled, nearest sampling,
   * alpha-over compositing. X, Y = centre in chunk pixels, k = chunk px per sheet px.
   */
  function splat(D, W, spr, X, Y, ang, k) {
    const A = ATLAS.data, SW = ATLAS.sw;
    const c = Math.cos(ang), s = Math.sin(ang);
    const sw = spr.w, sh = spr.h;
    const ex = (Math.abs(c) * sw + Math.abs(s) * sh) * 0.5 * k, ey = (Math.abs(s) * sw + Math.abs(c) * sh) * 0.5 * k;
    const x0 = Math.max(0, Math.floor(X - ex)), x1 = Math.min(W - 1, Math.ceil(X + ex));
    const y0 = Math.max(0, Math.floor(Y - ey)), y1 = Math.min(W - 1, Math.ceil(Y + ey));
    if (x0 > x1 || y0 > y1) return;
    const ik = 1 / k, du = c * ik, dv = -s * ik;
    const sx = spr.sx, sy = spr.sy, scx = spr.cx, scy = spr.cy;
    const EPS = 1e-6;
    for (let py = y0; py <= y1; py++) {
      const dy = py + 0.5 - Y;
      // solve 0 <= u(dx) < sw and 0 <= v(dx) < sh for dx -> exact span, no per-pixel bounds tests
      let lo = x0 + 0.5 - X, hi = x1 + 0.5 - X;
      const u0 = s * dy * ik + scx, v0 = c * dy * ik + scy;
      if (Math.abs(du) > EPS) {
        let a = (0 - u0) / du, b = (sw - 1e-3 - u0) / du;
        if (a > b) { const t = a; a = b; b = t; }
        if (a > lo) lo = a; if (b < hi) hi = b;
      } else if (u0 < 0 || u0 >= sw) continue;
      if (Math.abs(dv) > EPS) {
        let a = (0 - v0) / dv, b = (sh - 1e-3 - v0) / dv;
        if (a > b) { const t = a; a = b; b = t; }
        if (a > lo) lo = a; if (b < hi) hi = b;
      } else if (v0 < 0 || v0 >= sh) continue;
      const pa = Math.ceil(lo + X - 0.5), pb = Math.floor(hi + X - 0.5);
      if (pa > pb) continue;
      const dx = pa + 0.5 - X;
      let u = u0 + du * dx, v = v0 + dv * dx;
      let o = (py * W + pa) * 4;
      for (let px = pa; px <= pb; px++, u += du, v += dv, o += 4) {
        const so = ((sy + (v < 0 ? 0 : v | 0)) * SW + sx + (u < 0 ? 0 : u | 0)) * 4;
        const al = A[so + 3];
        if (al === 0) continue;
        if (al === 255) { D[o] = A[so]; D[o + 1] = A[so + 1]; D[o + 2] = A[so + 2]; }
        else {
          const ia = 255 - al;
          D[o] = (A[so] * al + D[o] * ia) * 0.003921569;
          D[o + 1] = (A[so + 1] * al + D[o + 1] * ia) * 0.003921569;
          D[o + 2] = (A[so + 2] * al + D[o + 2] * ia) * 0.003921569;
        }
      }
    }
  }
  const prox = (d, R) => { const a = d < 0 ? -d : d; return a >= R ? 0 : 1 - a / R; };
  let BANDC = null;
  const POOL = [];
  function* groundGen(ctx, info) {
    if (!BANDC || BANDC.c.width !== info.px) BANDC = U.canvas(info.px, 160);
    const { wx, wy, size, res } = info;
    const PX = info.px;
    const gx0 = Math.floor((wx - GMARGIN) / GS), gy0 = Math.floor((wy - GMARGIN) / GS);
    const gx1 = Math.ceil((wx + size + GMARGIN) / GS), gy1 = Math.ceil((wy + size + GMARGIN) / GS);
    const nx = gx1 - gx0 + 1, ny = gy1 - gy0 + 1;
    // buffers come from a small pool (no 1.6 MB allocation per chunk -> no GC pauses while walking)
    const key = PX + ':' + nx + 'x' + ny;
    const now = performance.now();
    // a job dropped by the chunk cache never finishes -> treat buffers busy for > 4 s as free again
    let buf = POOL.find((b) => b.key === key && (!b.busy || now - b.t0 > 4000));
    if (!buf) {
      buf = { key, busy: false, img: ctx.createImageData(PX, PX), Rg: new Float32Array(nx * ny * NR), Ng: new Float32Array(nx * ny * NC), Cg: new Float32Array(nx * ny * 3) };
      if (POOL.length < 4) POOL.push(buf);
    }
    buf.busy = true;
    buf.t0 = now;
    const { Rg, Ng, Cg } = buf;
    // 1. raw noise fields on a 5-unit grid
    for (let j = 0; j < ny; j++) {
      if ((j & 1) === 1) yield;
      for (let i = 0; i < nx; i++) {
        const x = (gx0 + i) * GS, y = (gy0 + j) * GS, o = (j * nx + i) * NR;
        Rg[o] = forestN(x, y);
        Rg[o + 1] = pondN(x, y);
        Rg[o + 2] = wheatN(x, y);
        Rg[o + 3] = U.fbm(x / 980, y / 980, 41, 3);
        Rg[o + 4] = U.fbm(x / 380 + 3.3, y / 380 - 8.1, 53, 2);
        Rg[o + 5] = U.fbm(x / 250, y / 250, 61, 2);
        Rg[o + 6] = U.perlin(x / 46, y / 46, 71);
        Rg[o + 7] = U.fbm(x / 70 + 1.7, y / 70 + 9.1, 81, 2);
      }
    }
    // 2. derived: edge distances + normals from grid gradients, weights, flow, detail, under-painting colour
    const w = new Float32Array(5);
    let gx = 0, gy = 0;
    const grad = (i, j, k) => {
      const iL = i > 0 ? i - 1 : i, iR = i < nx - 1 ? i + 1 : i, jU = j > 0 ? j - 1 : j, jD = j < ny - 1 ? j + 1 : j;
      gx = (Rg[(j * nx + iR) * NR + k] - Rg[(j * nx + iL) * NR + k]) / ((iR - iL) * GS);
      gy = (Rg[(jD * nx + i) * NR + k] - Rg[(jU * nx + i) * NR + k]) / ((jD - jU) * GS);
    };
    for (let j = 0; j < ny; j++) {
      if ((j & 7) === 7) yield;
      for (let i = 0; i < nx; i++) {
        const ro = (j * nx + i) * NR, o = (j * nx + i) * NC;
        let gm;
        grad(i, j, 0); gm = hyp(gx, gy) + 1e-7;
        const dF = clamp((Rg[ro] - 0.6) / gm, -80, 80);
        Ng[o + 5] = dF; Ng[o + 6] = gx / gm; Ng[o + 7] = gy / gm;
        grad(i, j, 2); gm = hyp(gx, gy) + 1e-7;
        const dW = clamp((Rg[ro + 2] - 0.5) / gm, -80, 80);
        Ng[o + 8] = dW; Ng[o + 9] = gx / gm; Ng[o + 10] = gy / gm;
        grad(i, j, 1); gm = hyp(gx, gy) + 1e-7;
        const dP = clamp((0.314 - Rg[ro + 1]) / gm, -80, 80);
        Ng[o + 11] = dP; Ng[o + 12] = -gx / gm; Ng[o + 13] = -gy / gm;
        grad(i, j, 3); gm = hyp(gx, gy) + 1e-9;
        const pd = Math.abs(Rg[ro + 3] - 0.5) / Math.max(gm, 0.0006);
        Ng[o + 14] = pd; Ng[o + 15] = -gy / gm; Ng[o + 16] = gx / gm;
        weightsOf(Rg[ro], Rg[ro + 1], Rg[ro + 2], pd, w);
        for (let k = 0; k < 5; k++) Ng[o + k] = w[k];
        Ng[o + 17] = -0.45 + (Rg[ro + 4] - 0.5) * 3.0;
        Ng[o + 18] = Rg[ro + 5];
        Ng[o + 19] = Rg[ro + 6] * 3.2;
        Ng[o + 20] = Rg[ro + 7];
        const hid = w[2] + w[3] + w[4];
        Ng[o + 21] = Math.max(prox(dF, 16), prox(dW, 11) * Math.max(0, 1 - hid * 1.5), prox(dP, 14), prox(pd - 12, 9) * (1 - w[4]), (Rg[ro + 7] - 0.58) * 1.4);
        let R = 0, Gc = 0, B = 0;
        for (let k = 0; k < 5; k++) { const u = MATS[k].under; R += u[0] * w[k]; Gc += u[1] * w[k]; B += u[2] * w[k]; }
        const m = 0.8 + Rg[ro + 5] * 0.45;
        Cg[(j * nx + i) * 3] = R * m; Cg[(j * nx + i) * 3 + 1] = Gc * m; Cg[(j * nx + i) * 3 + 2] = B * m;
      }
    }
    // 3. dark under-painting with canvas weave
    const img = buf.img;
    const D = img.data;
    const gpx0 = Math.round(wx * res), gpy0 = Math.round(wy * res);
    const rowC = new Float32Array(nx * 3);
    const colI = new Int32Array(PX), colT = new Float32Array(PX);
    for (let px = 0; px < PX; px++) {
      const fx = (wx + (px + 0.5) / res) / GS - gx0;
      colI[px] = (fx | 0) * 3; colT[px] = fx - (fx | 0);
    }
    for (let py = 0; py < PX; py++) {
      if ((py & 15) === 15) yield;
      const fy = (wy + (py + 0.5) / res) / GS - gy0, j0 = fy | 0, ty = fy - j0;
      const r0 = j0 * nx * 3, r1 = r0 + nx * 3;
      for (let i = 0; i < nx * 3; i++) rowC[i] = Cg[r0 + i] + (Cg[r1 + i] - Cg[r0 + i]) * ty;
      const gyp = gpy0 + py, rowEdge = (gyp & 3) === 0 || (gyp & 3) === 3;
      let o = py * PX * 4;
      for (let px = 0; px < PX; px++, o += 4) {
        const i = colI[px], t = colT[px];
        const gxp = gpx0 + px;
        const wv = ((gxp >> 2) + (gyp >> 2)) & 1 ? ((gxp & 3) === 0 || (gxp & 3) === 3 ? 0.87 : 1) : (rowEdge ? 0.87 : 1);
        D[o] = (rowC[i] + (rowC[i + 3] - rowC[i]) * t) * wv;
        D[o + 1] = (rowC[i + 1] + (rowC[i + 4] - rowC[i + 1]) * t) * wv;
        D[o + 2] = (rowC[i + 2] + (rowC[i + 5] - rowC[i + 2]) * t) * wv;
        D[o + 3] = 255;
      }
    }

    // 4. strokes
    const S = new Float32Array(NC);
    const sample = (x, y) => {
      const fx = x / GS - gx0, fy = y / GS - gy0;
      const i0 = Math.min(nx - 2, Math.max(0, fx | 0)), j0 = Math.min(ny - 2, Math.max(0, fy | 0));
      const tx = clamp01(fx - i0), ty = clamp01(fy - j0);
      const o00 = (j0 * nx + i0) * NC, o10 = o00 + NC, o01 = o00 + nx * NC, o11 = o01 + NC;
      const a = (1 - tx) * (1 - ty), b = tx * (1 - ty), c = (1 - tx) * ty, d = tx * ty;
      for (let k = 0; k < NC; k++) S[k] = Ng[o00 + k] * a + Ng[o10 + k] * b + Ng[o01 + k] * c + Ng[o11 + k] * d;
    };
    const detAt = (x, y) => {
      const i = Math.min(nx - 1, Math.max(0, Math.round(x / GS - gx0))), j = Math.min(ny - 1, Math.max(0, Math.round(y / GS - gy0)));
      return Ng[(j * nx + i) * NC + 21];
    };
    const kRes = res / KG;
    const draw = (spr, x, y, ang, sc) => splat(D, PX, spr, (x - wx) * res, (y - wy) * res, ang, kRes * sc);
    const tangAng = (nxv, nyv) => Math.atan2(nxv, -nyv);   // angle of the tangent (-ny, nx)
    const flowAngle = (mat, x, y, r, jit) => {
      let vx, vy;
      switch (mat) {
        case 0: vx = -S[10]; vy = S[9]; break;                       // furrows parallel to the field edge
        case 1: {                                                      // grass in the wind, bending around forests and ponds
          vx = Math.cos(S[17]); vy = Math.sin(S[17]);
          const bF = Math.exp(-Math.abs(S[5]) / 12) * 1.6, bP = Math.exp(-Math.abs(S[11]) / 12) * 1.6;
          let tx = -S[7], ty = S[6];
          if (tx * vx + ty * vy < 0) { tx = -tx; ty = -ty; }
          vx += tx * bF; vy += ty * bF;
          tx = -S[13]; ty = S[12];
          if (tx * vx + ty * vy < 0) { tx = -tx; ty = -ty; }
          vx += tx * bP; vy += ty * bP;
          break;
        }
        case 2: vx = S[15]; vy = S[16]; break;                         // along the path
        case 3: return S[19] + (r.next() - 0.5) * 0.6;                 // curly foliage dabs
        default: vx = -S[13]; vy = S[12];                              // ripples parallel to the shore
      }
      return Math.atan2(vy, vx) + (r.next() - 0.5) * jit;
    };
    const lightTerm = (mat, x, y) => {
      let l = (S[18] - 0.5) * 2.4;
      if (mat === 0 && S[8] > 0) l += 0.75 * Math.sin(S[8] * 0.95);                                  // furrow bands
      else if (mat === 1) { const a = S[17] + 1.5708; l += 0.42 * Math.sin((x * Math.cos(a) + y * Math.sin(a)) / 7 + S[18] * 8); }   // wind waves
      else if (mat === 4) l += 1.3 * (1 - U.smoothstep(0, 14, S[11])) - 0.4;                        // lighter shallows
      const lit = -(S[6] * LDX + S[7] * LDY);
      if (mat !== 3 && lit < -0.15 && S[5] < 0 && S[5] > -(4 - lit * 12)) l -= 1.3;                   // in the forest's cast shadow
      if (mat === 3 && lit > 0.15 && S[5] < 6) l += 1.1;                                              // moonlit forest edge
      return l;
    };
    const pickMat = (u) => {
      let acc = 0;
      for (let k = 0; k < 5; k++) { acc += S[k]; if (u < acc) return k; }
      return 1;
    };
    const SETS = ATLAS.sets;
    let EA = 0, ESC = 1;
    /** designed edge bands – returns a sprite (and sets EA/ESC) or null */
    const edgeStroke = (x, y, r, pass) => {
      const u = r.next();
      if (S[4] < 0.3) {                                                // path borders + ruts
        const e = S[14] - 12;
        if (e > -1.3 && e < 1.3 && u < 0.85) { EA = Math.atan2(S[16], S[15]); ESC = 0.85; return SETS.ink[r.int(0, 1)][r.int(0, 1)]; }
        if (pass === 2 && Math.abs(S[14] - 4.6) < 1.0 && S[2] > 0.6) { EA = Math.atan2(S[16], S[15]) + (r.next() - 0.5) * 0.15; ESC = 0.85; return SETS.rut[r.int(0, 2)][r.int(0, 1)]; }
      }
      const dP = S[11];
      if (dP > -1.4 && dP < 0.9 && u < 0.8) { EA = tangAng(S[12], S[13]); ESC = 0.85; return SETS.ink[r.int(0, 2)][r.int(0, 1)]; }
      if (dP > 0.9 && dP < 6 && u < 1 - dP / 6) { EA = tangAng(S[12], S[13]) + (r.next() - 0.5) * 0.2; ESC = 0.8 + r.next() * 0.3; return SETS.shore[r.int(0, 2)][r.int(0, 1)]; }
      const dF = S[5], lit = -(S[6] * LDX + S[7] * LDY);
      if (dF > -1.2 && dF < 1.0 && u < 0.7) { EA = tangAng(S[6], S[7]); ESC = 0.9; return SETS.ink[r.int(0, 1)][r.int(0, 1)]; }
      if (lit > 0.15 && dF > 0.6 && dF < 3 + lit * 5 && u < lit * 1.2) { EA = tangAng(S[6], S[7]) + (r.next() - 0.5) * 0.3; ESC = 0.75 + r.next() * 0.3; return SETS.rim[r.int(0, 2)][r.int(0, 1)]; }
      if (lit < -0.15 && dF < -0.6 && dF > -(3 - lit * 11) && S[4] < 0.3 && u < 0.85) { EA = tangAng(S[6], S[7]) + (r.next() - 0.5) * 0.2; ESC = 0.8 + r.next() * 0.35; return SETS.shade[r.int(0, 2)][r.int(0, 1)]; }
      if (S[2] + S[3] + S[4] < 0.35) {                                // wheat field hedge line + poppy drifts
        const dW = S[8];
        if (dW > -1.1 && dW < 1.1 && u < 0.75) { EA = tangAng(S[9], S[10]); ESC = 0.85; return SETS.ink[r.int(0, 2)][r.int(0, 1)]; }
        if (pass === 2 && dW > 0.8 && dW < 7 && S[20] > 0.6) { EA = r.next() * TAU; ESC = 0.55 + r.next() * 0.3; return SETS.poppy[r.int(0, 2)][r.int(0, 1)]; }
      }
      return null;
    };
    let n = 0;
    const M = 12;
    const PASS = [[6.6, 7001, 1.5], [4.5, 7002, 2.4], [2.9, 7003, 3.1]];
    for (let pass = 0; pass < 3; pass++) {
      const cell = PASS[pass][0], seed = PASS[pass][1], base = PASS[pass][2];
      const cx0 = Math.floor((wx - M) / cell), cx1 = Math.floor((wx + size + M) / cell);
      const cy0 = Math.floor((wy - M) / cell), cy1 = Math.floor((wy + size + M) / cell);
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
          const r = RR.seed(U.hashInt(cx, cy, seed));
          const x = (cx + r.next()) * cell, y = (cy + r.next()) * cell;
          if (x < wx - M || x > wx + size + M || y < wy - M || y > wy + size + M) continue;
          if (pass > 0) {
            const det = detAt(x, y), u = r.next();
            if (pass === 1 ? u > 0.3 + 0.62 * det : (det < 0.12 || u > det * det * 1.15)) continue;
          }
          sample(x, y);
          let spr = pass > 0 ? edgeStroke(x, y, r, pass) : null, ang, sc;
          if (spr) { ang = EA; sc = ESC; }
          else {
            const mat = pickMat(r.next());
            const set = ATLAS.mats[mat];
            ang = flowAngle(mat, x, y, r, pass === 0 ? 0.18 : 0.3);
            const accP = pass === 0 ? 0 : 0.03 + 0.22 * U.smoothstep(0.55, 0.75, S[20]);
            if (r.next() < accP) { spr = set.acc[(r.next() * set.acc.length) | 0][r.int(0, 1)]; sc = pass === 2 ? 0.7 : 0.95; }
            else {
              const idx = clamp(Math.round(base + lightTerm(mat, x, y) + (r.next() - 0.5) * (pass === 0 ? 0.9 : 1.2)), 0, 5);
              if (pass === 0) { spr = set.coat[idx][r.int(0, 1)]; sc = 0.85 + r.next() * 0.3; }
              else { spr = set.pal[idx][r.int(0, 2)]; sc = pass === 1 ? 0.8 + r.next() * 0.4 : 0.55 + r.next() * 0.25; }
            }
          }
          draw(spr, x, y, ang, sc);
          if (++n % 40 === 0) yield;
        }
      }
    }
    // 5. decals with intent: wind eddies in open meadows, star whorls mirrored in deep water, flower drifts at edges
    const scat = function* (cell, seed, margin, fn) {
      const x0 = Math.floor((wx - margin) / cell), x1 = Math.floor((wx + size + margin) / cell);
      const y0 = Math.floor((wy - margin) / cell), y1 = Math.floor((wy + size + margin) / cell);
      let k = 0;
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const r = RR.seed(U.hashInt(cx, cy, seed));
          const x = (cx + r.next()) * cell, y = (cy + r.next()) * cell;
          if (x < wx - margin || x > wx + size + margin || y < wy - margin || y > wy + size + margin) continue;
          sample(x, y);
          fn(x, y, r);
          if (++k % 24 === 0) yield;
        }
      }
    };
    const spiral = (x, y, r, R, cnt, turns, flat, pick, sc0) => {
      const dir = r.next() < 0.5 ? 1 : -1, ph = r.next() * TAU;
      for (let i = 0; i < cnt; i++) {
        const t = i / cnt;
        const a = ph + dir * t * turns * TAU, rr = 1.5 + t * R;
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * flat;
        const tang = Math.atan2(Math.cos(a) * flat * dir, -Math.sin(a) * dir);
        draw(pick(t, r), px, py, tang, sc0 + t * 0.35 + r.next() * 0.15);
      }
    };
    yield* scat(330, 891, 40, (x, y, r) => {
      if (S[1] < 0.92 || S[21] > 0.3 || r.next() > 0.5) return;
      spiral(x, y, r, 18 + r.next() * 12, 22 + r.int(0, 8), 1.4 + r.next() * 0.5, 0.72, (t, rr) => SETS.eddy[t < 0.25 ? 3 : rr.int(0, 2)][rr.int(0, 1)], 0.6);
    });
    yield* scat(80, 855, 30, (x, y, r) => {
      if (S[4] < 0.95 || S[11] < 14 || r.next() > 0.6) return;
      const set = ATLAS.mats[4];
      spiral(x, y, r, 12 + r.next() * 8, 18 + r.int(0, 8), 1.6 + r.next() * 0.8, 0.62, (t, rr) => (t < 0.3 ? SETS.gold[rr.int(1, 3)][rr.int(0, 1)] : set.acc[rr.next() < 0.7 ? 0 : 1][rr.int(0, 1)]), 0.5);
    });
    yield* scat(46, 866, 8, (x, y, r) => {
      if (S[4] < 0.9 || S[11] < 8 || r.next() > 0.3) return;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + r.next();
        draw(SETS.gold[i === 0 ? 3 : r.int(1, 2)][r.int(0, 1)], x + Math.cos(a) * 2.6, y + Math.sin(a) * 1.6, a + Math.PI / 2, 0.45);
      }
    });
    yield* scat(8, 822, 4, (x, y, r) => {
      if (S[1] < 0.7 || S[20] < 0.64 || S[21] < 0.15 || r.next() > 0.5) return;
      const f = SETS.flower[r.next() < 0.55 ? 0 : r.next() < 0.7 ? 1 : r.next() < 0.6 ? 2 : 3];
      const cnt = 2 + r.int(0, 1);
      for (let i = 0; i < cnt; i++) draw(f[r.int(0, 1)], x + (r.next() - 0.5) * 2.4, y + (r.next() - 0.5) * 1.8, r.next() * TAU, 0.5 + r.next() * 0.3);
    });
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let band = 0; band < PX; band += 160) {
      const h = Math.min(160, PX - band);
      BANDC.ctx.putImageData(img, 0, -band, 0, band, PX, h);
      ctx.drawImage(BANDC.c, 0, 0, PX, h, 0, band, PX, h);
      yield;
    }
    ctx.restore();
    buf.busy = false;
  }

  /* ======================================================================
     3. Characters – every body part has its own seeded RNG, so the strokes stay put from pose to pose
        (the motion reads as one painted figure moving, not as noise)
     ====================================================================== */
  const PRUSSIAN = H('#111733');
  const ORANGE = hexes(['#8e3a12', '#b8521a', '#d86c1e', '#ec8a28', '#f6aa3c', '#fcd06a']);
  const COAT = hexes(['#141d52', '#1d2c78', '#26409a', '#3157b4', '#4a76cc', '#7aa0e0']);
  const LEAF = hexes(['#163a2a', '#1f5a3a', '#2f7a4a', '#4a9a52', '#80bc5c']);
  const GLOWC = hexes(['#4a1206', '#ffb52e', '#ffe070', '#fff6c8']);
  const SCARF = hexes(['#8a1a10', '#c8341e', '#e8502a', '#f6883a']);
  const RNG = (seed, part) => U.rng(seed * 31 + part * 977);

  function carved(ctx, P) {
    let cx = 0, cy = 0;
    for (const p of P) { cx += p[0]; cy += p[1]; }
    cx /= P.length; cy /= P.length;
    ctx.fillStyle = rgb(GLOWC[0]);
    ctx.fill(pathOf(P.map((p) => [p[0] + 0.35, p[1] + 0.4])));
    ctx.fillStyle = rgb(GLOWC[1]);
    ctx.fill(pathOf(P));
    ctx.fillStyle = rgb(GLOWC[2]);
    ctx.fill(pathOf(P.map((p) => [cx + (p[0] - cx) * 0.62, cy + (p[1] - cy) * 0.62 + 0.15])));
    ctx.fillStyle = rgb(GLOWC[3]);
    ctx.fill(pathOf(P.map((p) => [cx + (p[0] - cx) * 0.3, cy + (p[1] - cy) * 0.3 + 0.2])));
  }
  const tri = (cx, cy, s, tall) => [[cx - s, cy + s * 0.6 * tall], [cx + s, cy + s * 0.6 * tall], [cx + s * 0.15, cy - s * 1.0 * tall]];

  /* ---------- main character: carved gourd head, ultramarine coat, red scarf ---------- */
  function jackLeg(ctx, r, k, swing, lift, bob) {
    const hipX = k * 1.6, hipY = -5.8 + bob * 0.6;
    const fx = k * 0.7 + swing * 4.0, fy = -0.4 - lift;
    const kx = (hipX + fx) / 2 + 0.5 + lift * 0.55, ky = (hipY + fy) / 2 - lift * 0.2;
    const col = k < 0 ? H('#1f192c') : H('#30273f');
    seg(ctx, hipX, hipY, kx, ky, 2.7, col, r);
    seg(ctx, kx, ky, fx, fy - 0.9, 2.4, col, r);
    stroke(ctx, fx + 1.1, fy - 0.35, 0.05 - lift * 0.18, 3.9, 2.15, H(k < 0 ? '#140c08' : '#24170f'), r, { hi: 0.28 });
  }
  function jackArm(ctx, r, sx, sy, swing, raise, col, colHi) {
    const hx = sx + swing * 3.2 + 0.7, hy = sy + 5.5 - raise * 5.4 - Math.abs(swing) * 0.5;
    const ex = (sx + hx) / 2 + 0.6 - raise * 0.6, ey = (sy + hy) / 2 + 0.3;
    seg(ctx, sx, sy, ex, ey, 2.7, col, r);
    seg(ctx, ex, ey, hx, hy, 2.4, col, r);
    seg(ctx, sx + 0.3, sy + 0.4, ex, ey - 0.3, 0.9, colHi, r, { a: 0.75 });
    stroke(ctx, hx + 0.25, hy + 0.55, 0.6 + swing * 0.25, 1.9, 1.75, H('#e8cf9c'), r, { hi: 0.4 });
  }
  function drawJack(ctx, seed, q) {
    ctx.scale(1 + (q.sq || 0) * 0.6, 1 - (q.sq || 0));
    ctx.rotate(q.lean || 0);
    const bob = q.bob || 0;
    // legs behind the coat
    jackLeg(ctx, RNG(seed, 1), -1, q.legB, q.liftB, bob);
    jackLeg(ctx, RNG(seed, 2), 1, q.legF, q.liftF, bob);
    ctx.save();
    ctx.translate(0, bob);
    // far arm
    jackArm(ctx, RNG(seed, 3), -3.7, -14.1, q.armB, q.raiseB || 0, COAT[1], COAT[3]);
    // coat – flared hem swings against the step, breathing lifts the shoulders
    const br = (q.breath || 0) * 0.35, hm = q.hem || 0;
    const coat = spline([[-4.4, -15.6 - br], [0, -16 - br], [4.4, -15.6 - br], [5.7, -10.5], [6.9 + hm * 0.5, -4.4], [3.2 + hm * 0.3, -3.3], [0, -3.9], [-3.2 + hm * 0.4, -3.3], [-7.1 + hm, -4.4 - Math.max(0, hm) * 0.4], [-5.6, -10.5]], 3);
    paint(ctx, coat, RNG(seed, 4), {
      base: COAT[1], sp: 1.55, len: 4.2, wid: 1.5, jit: 0.15,
      col: (x, y, rr) => rampPick(COAT, 2.3 - x * 0.3 - (y + 10) * 0.05 + (rr.next() - 0.5) * 1.3),
      ang: (x) => -Math.PI / 2 + x * 0.07,
      edge: { col: PRUSSIAN, w: 1.05, l: 3 },
    });
    const rb = RNG(seed, 5);
    stroke(ctx, 1.1, -11.2, 0.3, 1.3, 1.1, H('#f0c040'), rb, { hi: 0.5 });
    stroke(ctx, 1.3, -7.8, 0.3, 1.3, 1.1, H('#f0c040'), rb, { hi: 0.5 });
    // belt of rope
    seg(ctx, -5.3, -6.9, 5.9, -6.6, 1.1, H('#7a5a2a'), rb);
    seg(ctx, -5.0, -7.1, 5.6, -6.9, 0.45, H('#c8a050'), rb, { a: 0.8 });
    // scarf knot (the tail is drawn at runtime with lag)
    for (let i = 0; i < 4; i++) stroke(ctx, -3.8 + i * 2.5, -15.5 - br + Math.sin(i * 1.7) * 0.3, (rb.next() - 0.5) * 0.4, 3.4, 2.2, i & 1 ? SCARF[2] : SCARF[1], rb);
    stroke(ctx, 0.5, -15.9 - br, 0.1, 4, 1.0, SCARF[3], rb, { hi: 0.4 });
    stroke(ctx, -3.6, -14.6 - br, 1.9, 2.6, 1.8, SCARF[1], rb);
    // near arm
    jackArm(ctx, RNG(seed, 6), 4.1, -14.1, q.armF, q.raiseF || 0, COAT[3], COAT[5]);
    // head – carved gourd, ribs follow the meridians; lags the body a little (head bob + tilt)
    ctx.translate(0.6, -22.6 - br * 0.6 + (q.hb || 0));
    ctx.rotate(q.ht || 0);
    const rh = RNG(seed, 7);
    const cx = 0, cy = 0, rx = 8.8, ry = 7.4;
    const head = [];
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * TAU;
      const k = 1 + 0.035 * Math.abs(Math.sin(a * 3.5)) + (rh.next() - 0.5) * 0.02;
      head.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k * (Math.sin(a) > 0 ? 0.97 : 1)]);
    }
    const merid = (x, y) => {
      const dx = x - cx, dy = y - cy;
      const qq = Math.sqrt(Math.max(0.06, 1 - (dy / ry) * (dy / ry)));
      const kk = dx / (rx * qq);
      const slope = (-kk * rx * dy) / (ry * ry * qq);
      return Math.atan2(1, slope);
    };
    paint(ctx, head, rh, {
      base: ORANGE[2], sp: 1.3, len: 3.6, wid: 1.45, jit: 0.12,
      col: (x, y, rr) => {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        const l = -dx * 1.5 - dy * 1.3;
        // cool reflected light in the core shadow (hue shift, not just darker)
        if (l < -1.2 && rr.next() < 0.3) return H('#7a3a4a');
        return rampPick(ORANGE, 2.6 + l + (rr.next() - 0.5) * 1.2);
      },
      ang: merid,
    });
    for (const kx of [-0.66, -0.24, 0.24, 0.66]) {
      const pts = [];
      for (let t = -0.82; t <= 0.83; t += 0.33) pts.push([cx + kx * rx * Math.sqrt(1 - t * t), cy + t * ry]);
      polyStroke(ctx, pts, 0.75, 2.4, U.mul(ORANGE[1], 0.85), rh, { a: 0.85 });
    }
    contour(ctx, head, rh, { col: PRUSSIAN, w: 1.1, l: 3.2 });
    // stem, leaf and a curling vine tendril – the characterful top of the silhouette
    seg(ctx, cx + 0.3, cy - ry + 0.8, cx + 1.6, cy - ry - 2.9, 1.9, H('#4f6a26'), rh);
    seg(ctx, cx + 0.6, cy - ry + 0.2, cx + 1.4, cy - ry - 2.3, 0.7, H('#9ab048'), rh);
    stroke(ctx, cx - 1.9, cy - ry - 0.6, -0.55, 3.6, 1.6, H('#3f7a3a'), rh);
    stroke(ctx, cx - 2.0, cy - ry - 0.8, -0.55, 2.2, 0.5, H('#80bc5c'), rh, { a: 0.8 });
    const tend = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6, a = -0.6 + t * 4.6; tend.push([cx + 1.9 + Math.cos(a) * (2.2 - t * 1.4) + t * 1.6, cy - ry - 3.2 + Math.sin(a) * (2.2 - t * 1.4)]); }
    polyStroke(ctx, tend, 0.55, 1.2, H('#6a8a30'), rh);
    // face (looking to +x)
    const fx = cx + 1.9;
    carved(ctx, tri(fx - 2.9, cy - 1.6, 1.7, 1.25));
    carved(ctx, tri(fx + 2.9, cy - 1.6, 1.7, 1.25));
    carved(ctx, tri(fx, cy + 0.4, 0.65, 1));
    const m = [[-4.7, -0.2], [-3.4, 0.6], [-2.4, -0.2], [-1.2, 0.7], [0, -0.1], [1.2, 0.7], [2.4, -0.2], [3.4, 0.6], [4.7, -0.2], [3.8, 1.9], [1.6, 2.9], [-1.6, 2.9], [-3.8, 1.9]];
    carved(ctx, m.map((p) => [fx + p[0], cy + 2.4 + p[1]]));
    ctx.restore();
  }

  /* ---------- small creature: three root-bulb designs (turnip, radish, beet) ---------- */
  const VIO = [hexes(['#34124c', '#55206f', '#763896', '#985ab6', '#c28cd8']), hexes(['#3e1040', '#661c5e', '#8a2e7c', '#ae5296', '#d488b8']), hexes(['#2a0c2a', '#46143e', '#62204e', '#82325e', '#a85478'])];
  const CREAM = [hexes(['#9c8656', '#c4ad78', '#e2d09a', '#f4e9c2', '#fffbe8']), hexes(['#a07a2a', '#c89e3e', '#e6c25a', '#f4dc8a', '#fff2c0'])];
  const CREEP = [
    { cy: -12.6, rx: 8.6, ry: 8.2, pinch: 0.38, drop: 0.3, band: 0.5, V: 0, C: 0, leaves: 4, leafL: 6.4, leafW: 2.5, legs: 3, tail: 2.2 },     // turnip
    { cy: -14.4, rx: 6.4, ry: 9.6, pinch: 0.5, drop: 0.55, band: 0.42, V: 1, C: 0, leaves: 2, leafL: 9.5, leafW: 2.2, legs: 2.4, tail: 4.2 },   // radish
    { cy: -11.0, rx: 9.8, ry: 7.0, pinch: 0.25, drop: 0.18, band: 0.82, V: 2, C: 1, leaves: 3, leafL: 5.4, leafW: 3.0, legs: 3.6, tail: 1.6 },  // beet
  ];
  function drawCreeper(ctx, seed, q, v) {
    const D = CREEP[v], V = VIO[D.V], C = CREAM[D.C];
    // legs
    const rl = RNG(seed, 1);
    for (const s of [-1, 1]) {
      const sw = s < 0 ? q.legL : q.legR, lift = s < 0 ? q.liftL : q.liftR;
      const hx = s * 2.2, hy = -4.4 + q.bob * 0.5;
      const fx = s * 1.4 + sw * 2.2 + 0.4, fy = -0.4 - lift;
      seg(ctx, hx, hy, fx, fy, 1.8, H(s < 0 ? '#8a6a48' : '#a8865a'), rl);
      stroke(ctx, fx + 0.9, fy, 0.1, 2.4, 1.3, H('#5a4028'), rl);
    }
    ctx.save();
    ctx.translate(0, q.bob);
    ctx.scale(1 + q.sq * 0.6, 1 - q.sq);
    ctx.translate(0, D.cy);
    ctx.rotate(q.tilt);
    ctx.translate(0, -D.cy);
    const cx = 0, cy = D.cy, rx = D.rx, ry = D.ry;
    // far root arm
    const ra = RNG(seed, 2);
    const arm = (s, sw, col) => {
      const sx = cx + s * rx * 0.55 - 0.6, sy = cy + ry * 0.15;
      const hx = sx + 2.4 + sw * 1.6, hy = sy + 3.6 - Math.abs(sw) * 0.6;
      seg(ctx, sx, sy, hx, hy, 1.15, col, ra);
      seg(ctx, hx, hy, hx + 1.3, hy + 0.9, 0.6, col, ra);
      seg(ctx, hx, hy, hx + 0.5, hy + 1.6, 0.6, col, ra);
    };
    arm(-1, q.arm, H('#7a5a38'));
    // leaves behind the bulb – they lag the body (overlapping action)
    const rv = RNG(seed, 3);
    const lf = D.leaves;
    for (let i = 0; i < lf; i++) {
      const spread = lf === 2 ? [-0.55, 0.15][i] : (-0.8 + (i / (lf - 1)) * 1.4);
      const a = -Math.PI / 2 + spread - 0.25 + q.leaf * (1 + i * 0.25);
      const bx = cx + 0.3, by = cy - ry + 1.3;
      const L = D.leafL * (1 - Math.abs(spread) * 0.2);
      const mx = bx + Math.cos(a) * L * 0.55, my = by + Math.sin(a) * L * 0.55;
      stroke(ctx, mx, my, a, L, D.leafW, LEAF[1 + (i & 1)], rv, { hi: 0.22, bend: v === 2 ? 0.6 : 0.25 });
      stroke(ctx, mx, my, a, L * 0.7, 0.75, LEAF[4], rv, { a: 0.85, bend: v === 2 ? 0.5 : 0.2 });
      if (v === 1) stroke(ctx, bx + Math.cos(a) * L * 0.95, by + Math.sin(a) * L * 0.95, a - 0.6, 2.6, 1.6, LEAF[3], rv);   // radish leaf tips curl back
    }
    if (v === 2) {   // beet: one curly leaf rolled over the top
      const curl = [];
      for (let i = 0; i <= 7; i++) { const t = i / 7, a = -2.2 + t * 3.6; curl.push([cx + 1 + Math.cos(a) * (3.6 - t * 1.6), cy - ry - 2.8 + Math.sin(a) * (3.0 - t * 1.4)]); }
      polyStroke(ctx, curl, 1.5, 1.6, [LEAF[2], LEAF[3]], rv);
    }
    // bulb
    const body = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU, s = Math.sin(a);
      const kx = s > 0 ? 1 - D.pinch * s * s : 1, ky = s > 0 ? 1 + D.drop * s * s * s : 1;
      body.push([cx + Math.cos(a) * rx * kx, cy + s * ry * ky]);
    }
    const rb = RNG(seed, 4);
    paint(ctx, body, rb, {
      base: V[1], sp: 1.2, len: 3.3, wid: 1.4, jit: 0.15,
      col: (x, y, rr) => {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        const t = (dy + 1) / 2, b = D.band + 0.08 * Math.sin(x * 0.9 + v * 2);
        const l = -dx * 1.4 - dy * 0.6;
        if (v === 2 && rr.next() < 0.18) return rampPick(V, 3.4 + l);          // beet rings
        return t + (rr.next() - 0.5) * 0.2 < b ? rampPick(V, 2.1 + l + (rr.next() - 0.5) * 1.1) : rampPick(C, 2.3 + l + (rr.next() - 0.5) * 1.1);
      },
      ang: (x, y) => (v === 2 ? Math.atan2(y - cy, x - cx) + Math.PI / 2 : Math.atan2((x - cx) / (rx * rx), -(y - cy) / (ry * ry)) * 0.7),
      edge: { col: H('#1d1036'), w: 1.0, l: 2.8 },
    });
    // root tail
    seg(ctx, cx - 0.2, cy + ry * (1 + D.drop) - 0.4, cx - 1.2, cy + ry * (1 + D.drop) + D.tail, 0.8, H('#8a6a48'), rb);
    // near arm
    arm(1, -q.arm, H('#a8865a'));
    // face – big readable cadmium eyes, heavy brows
    const rf = RNG(seed, 5);
    const ex = cx + 1.4, ey = cy - (v === 1 ? 1.6 : 0.7);
    const es = v === 2 ? 2.9 : v === 1 ? 2.1 : 2.6;
    for (const s of [-1, 1]) {
      const x = ex + s * es, y = ey;
      stroke(ctx, x, y, s * 0.35, 2.5, 1.7, H('#ffcf40'), rf, { hi: 0.55, bend: 0 });
      stroke(ctx, x + 0.35, y + 0.15, 0, 0.85, 0.85, H('#3a0a10'), rf, { bend: 0 });
      stroke(ctx, x - s * 0.1, y - 1.55, s * (v === 2 ? 0.6 : 0.45), 2.9, v === 2 ? 1.2 : 0.9, H('#1d0f2a'), rf, { bend: 0, hi: 0.1 });
    }
    stroke(ctx, ex + 0.3, ey + 3.4, 0, v === 1 ? 2.2 : 3.0, 0.8, H('#2a0c22'), rf, { bend: v === 2 ? -0.3 : 0.25, hi: 0.1 });
    ctx.restore();
  }

  /* ---------- fast creature: a hooded night wisp with a Starry-Night swirl for a tail ---------- */
  const GHO = hexes(['#3d64a6', '#6e9ec8', '#a2d0d2', '#cbece4', '#f2fbf4']);
  function drawGhost(ctx, seed, ph) {
    const cx = 0, cy = -17.6;
    const w1 = Math.sin(ph) * 0.7, w2 = Math.sin(ph + 1.6) * 0.7, w3 = Math.sin(ph + 3.1) * 0.6;
    // swirl tail (behind) – dark under-stroke then light stroke = a painted contour on an open line
    const rt = RNG(seed, 1);
    const tail = [];
    for (let i = 0; i <= 9; i++) {
      const t = i / 9;
      const a = 1.9 + t * 3.6 + Math.sin(ph + t * 2) * 0.25;
      const R = 5.2 * (1 - t * 0.55);
      tail.push([-2.6 - t * 5.2 + Math.cos(a) * R * t, -8.2 + t * 2.5 + Math.sin(a) * R * t * 0.8]);
    }
    for (let i = 0; i < tail.length - 1; i++) {
      const t = i / (tail.length - 1), a = tail[i], b = tail[i + 1];
      seg(ctx, a[0], a[1], b[0], b[1], 3.4 * (1 - t * 0.7) + 0.9, H('#1f3a78'), rt, { hi: 0.05 });
    }
    for (let i = 0; i < tail.length - 1; i++) {
      const t = i / (tail.length - 1), a = tail[i], b = tail[i + 1];
      seg(ctx, a[0], a[1], b[0], b[1], 3.0 * (1 - t * 0.7), GHO[t < 0.5 ? 3 : 2], rt, { hi: 0.35 });
    }
    // reaching arms (behind the body)
    const rr0 = RNG(seed, 2);
    const reach = Math.sin(ph + 0.8) * 0.8;
    seg(ctx, 4.6, -13.4, 10.2, -12.0 + reach, 1.7, GHO[2], rr0, { a: 0.95 });
    seg(ctx, 9.6, -12.0 + reach, 11.7, -13.0 + reach, 0.7, GHO[3], rr0);
    seg(ctx, 9.6, -11.6 + reach, 11.6, -10.7 + reach, 0.7, GHO[3], rr0);
    // hooded sheet
    const ctrl = [
      [-6.8, -16.6], [-6.4, -21.4], [-3.8, -24.6], [0.4, -25.6], [3.8, -24.4], [6.2, -21.2], [7.0, -16.8],
      [6.4, -12.4], [5.0, -9.2 + w1], [2.6, -7.2 + w2], [0, -7.8 + w3], [-2.6, -7.4 + w2], [-5.0, -9.4], [-6.6, -12.8],
    ];
    const body = spline(ctrl, 3);
    paint(ctx, body, RNG(seed, 3), {
      base: GHO[2], sp: 1.2, len: 3.7, wid: 1.35, jit: 0.15,
      col: (x, y, rr) => {
        const d = hyp(x - cx + 1.5, y - cy + 2) / 7.5;
        const l = 4.0 - d * 1.2 - Math.max(0, (y - cy) / 6) - Math.max(0, x - cx - 2) * 0.12;
        if (l < 2.2 && rr.next() < 0.25) return H('#4a5ab0');                 // cobalt in the cool shadow
        return rampPick(GHO, l + (rr.next() - 0.5) * 1.1);
      },
      ang: (x, y) => Math.atan2(y - cy - 2, x - cx) + Math.PI / 2 + 0.35,
      edge: { col: H('#1f3a78'), w: 0.85, l: 2.5 },
    });
    // hood tip curls back and flutters
    const rh = RNG(seed, 4);
    const tipF = Math.sin(ph + 2.2) * 0.9;
    polyStroke(ctx, [[-3.4, -24.4], [-6.4, -25.8 + tipF * 0.3], [-8.8, -25.0 + tipF], [-9.6, -23.0 + tipF]], 1.5, 2.2, [GHO[3], GHO[2]], rh);
    seg(ctx, -9.6, -23.0 + tipF, -8.6, -21.8 + tipF, 0.9, GHO[1], rh);
    // face: deep painted eye hollows with a faint cadmium glint, round open mouth
    const rf = RNG(seed, 5);
    const ex = cx + 1.5;
    for (const s of [-1, 1]) {
      stroke(ctx, ex + s * 2.4, cy - 0.9, Math.PI / 2 + s * 0.12, 3.4, 2.3, H('#0d1430'), rf, { bend: 0, hi: 0.06 });
      stroke(ctx, ex + s * 2.4 + 0.35, cy - 1.5, 0, 0.7, 0.7, H('#ffd040'), rf, { bend: 0, hi: 0.6 });
    }
    stroke(ctx, ex + 0.3, cy + 3.6, Math.PI / 2, 3.6, 2.4, H('#0d1430'), rf, { bend: 0, hi: 0.06 });
    stroke(ctx, ex + 0.45, cy + 4.1, Math.PI / 2, 1.8, 1.0, H('#26407e'), rf, { bend: 0 });
  }

  /* ---------- large creature: a hunched root colossus with glowing cracks and a leaf crown ---------- */
  const COLV = hexes(['#1c1220', '#2e1c30', '#46284a', '#603a62', '#7e5480', '#a27aa4']);
  const COLU = hexes(['#22160e', '#35231a', '#4c3322', '#664630', '#82603e', '#a07c52']);
  const DARKC = H('#0c0812');
  function rootArm(ctx, r, x0, y0, x1, y1, w, pal) {
    seg(ctx, x0, y0, (x0 + x1) / 2 + 0.8, (y0 + y1) / 2, w, pal[2], r);
    seg(ctx, (x0 + x1) / 2 + 0.8, (y0 + y1) / 2, x1, y1, w * 0.85, pal[2], r);
    seg(ctx, x0 - 0.6, y0 + 0.4, (x0 + x1) / 2, (y0 + y1) / 2, w * 0.35, pal[4], r, { a: 0.9 });
    for (let i = -1; i <= 1; i++) seg(ctx, x1, y1, x1 + i * 1.9 + 0.6, y1 + 3.2 - Math.abs(i) * 0.6, 1.25, pal[1], r);
    contour(ctx, [[x0 - w / 2, y0], [x1 - w / 2, y1], [x1 + w / 2, y1], [x0 + w / 2, y0]], r, { col: DARKC, w: 0.9, l: 3, skip: (x, y, sh) => sh < -0.3 });
  }
  function drawColossus(ctx, seed, q) {
    // legs (stomping)
    const rl = RNG(seed, 1);
    for (const s of [-1, 1]) {
      const lift = s < 0 ? q.liftL : q.liftR, sw = s < 0 ? q.legL : q.legR;
      const fx = s * 6.6 + sw * 3.0, fy = -0.8 - lift * 2.6;
      seg(ctx, s * 6.8, -14 + q.bob * 0.6, fx, fy - 1.5, 6.6, COLU[s < 0 ? 0 : 1], rl);
      seg(ctx, s * 6.8 - 1.4, -13.5 + q.bob * 0.6, fx - 1.2, fy - 2, 1.8, COLU[3], rl, { a: 0.9 });
      stroke(ctx, fx + 1.3, fy - 0.4, 0.04, 8.6, 3.3, COLU[0], rl, { hi: 0.22 });
      for (let i = 0; i < 3; i++) seg(ctx, fx + 3.5 + i * 0.4, fy - 0.2, fx + 5.6 + i * 0.7, fy + 0.4 - i * 0.3, 0.9, COLU[2], rl);
    }
    ctx.save();
    ctx.translate(0, q.bob);
    ctx.scale(1 + q.sq * 0.5, 1 - q.sq);
    ctx.translate(0, -28);
    ctx.rotate(q.tilt);
    ctx.translate(0, 28);
    // back arm – hangs low, swings with lag
    rootArm(ctx, RNG(seed, 2), -14.5, -32, -19 - q.armB * 2.2, -13.5 + Math.abs(q.armB) * 0.8, 4.6, COLU.map((c) => U.mul(c, 0.8)));
    // crown of big leaves – bounces late after each stomp
    const rc = RNG(seed, 3);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (-0.95 + i * 0.47) + q.leaf * (0.6 + Math.abs(i - 2) * 0.25);
      const bx = 3, by = -43.5;
      const L = 12 - Math.abs(i - 2) * 1.5;
      stroke(ctx, bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5, a, L, 4.0, LEAF[i & 1], rc, { hi: 0.2 });
      stroke(ctx, bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5, a, L * 0.75, 1.0, LEAF[3], rc, { a: 0.85 });
    }
    // hunched body: high heavy shoulders, the head mass pushed forward
    const cx = 0, cy = -28.5, rx = 17.5, ry = 16.5;
    const rb = RNG(seed, 4);
    const body = blob(cx, cy, rx, ry, 44, 0.07, rb).map((p) => {
      const t = (p[1] - cy) / ry;
      return [p[0] + Math.max(0, -t) * 2.6 + (p[0] > 0 ? Math.max(0, -t) * 1.2 : 0), p[1] - Math.max(0, -t) * Math.abs(p[0] / rx) * 2.2];
    });
    paint(ctx, body, rb, {
      base: COLV[1], sp: 2.0, len: 5.4, wid: 2.05, jit: 0.25,
      col: (x, y, rr) => {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        const l = -dx * 1.5 - dy * 1.2;
        if (dx * 0.7 + dy * 0.7 < -0.75 && rr.next() < 0.55) return rr.next() < 0.6 ? H('#6fa4b0') : H('#b4d0c4');   // moss on the lit back
        const t = (dy + 1) / 2 + (rr.next() - 0.5) * 0.25;
        return t < 0.58 ? rampPick(COLV, 2.4 + l + (rr.next() - 0.5) * 1.3) : rampPick(COLU, 2 + l + (rr.next() - 0.5) * 1.3);
      },
      ang: (x, y) => {
        const dx = x - cx, dy = y - cy;
        const tx = -dy / (ry * ry), ty = dx / (rx * rx);
        const m = hyp(tx, ty) + 1e-6;
        return Math.atan2(ty / m * 0.6 + 0.55, tx / m * 0.6 + Math.sin(y * 0.4) * 0.2);
      },
      edge: { col: DARKC, w: 1.7, l: 4.4 },
    });
    // glowing cracks (pulse is added at runtime)
    const rk = RNG(seed, 5);
    const cracks = [
      [[-1, -40], [1.4, -35], [0, -31], [3, -27.5], [1.2, -23], [4, -17.5]],
      [[0, -31], [-5, -28.5], [-8.5, -24], [-11.5, -22.5]],
      [[3, -27.5], [8, -29.5], [11.5, -26.5]],
      [[1.2, -23], [-2.5, -19], [-3.5, -15.5]],
    ];
    for (const c of cracks) polyStroke(ctx, c, 2.0, 3, H('#1a0c08'), rk, { hi: 0.05 });
    for (const c of cracks) polyStroke(ctx, c, 1.15, 2.6, [H('#ffb030'), H('#ff9a20'), H('#ffc84a')], rk, { hi: 0.45 });
    for (const c of cracks) polyStroke(ctx, c, 0.45, 2.2, H('#fff2b0'), rk, { hi: 0.6 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      stroke(ctx, 2.2 + Math.cos(a) * 1.4, -28 + Math.sin(a) * 1.4, a + Math.PI / 2, 2.2, 1.1, i & 1 ? H('#ffe070') : H('#fff6c8'), rk, { hi: 0.6 });
    }
    // deep-set eyes under a heavy brow ridge, a grim mouth
    const rf = RNG(seed, 6);
    seg(ctx, -2, -38.6, 11.5, -38.2, 2.6, COLV[0], rf, { hi: 0.12 });
    for (const s of [-1, 1]) {
      const x = 5 + s * 4.6, y = -36.4;
      stroke(ctx, x, y, s * 0.3, 3.4, 1.6, H('#ffd040'), rf, { hi: 0.6, bend: 0 });
      stroke(ctx, x - s * 0.2, y - 1.9, s * 0.42, 5.2, 1.9, DARKC, rf, { bend: 0, hi: 0.1 });
    }
    stroke(ctx, 8, -31.5, -0.1, 5.2, 1.6, H('#140a10'), rf, { bend: 0.2, hi: 0.05 });
    stroke(ctx, 8, -31.3, -0.1, 3.4, 0.5, H('#ffb030'), rf, { bend: 0.2, hi: 0.4 });
    // front arm
    rootArm(ctx, RNG(seed, 7), 15, -31.5, 19.5 + q.armF * 2.2, -14 + Math.abs(q.armF) * 0.8, 5, COLU);
    ctx.restore();
  }

  /* ---------- small sprites ---------- */
  function drawSeedSprite(ctx, r, big) {
    const s = big ? 1.5 : 1;
    const P = blob(0, 0, 2.3 * s, 1.45 * s, 18, 0.03, r).map((p) => [p[0] * (p[0] > 0 ? 1 - 0.18 * (p[0] / (2.3 * s)) : 1), p[1]]);
    ctx.fillStyle = '#f4e6c0';
    ctx.fill(pathOf(P));
    stroke(ctx, -0.3 * s, -0.25 * s, 0, 3.0 * s, 1.5 * s, H('#fff6dc'), r, { bend: 0 });
    stroke(ctx, 0.2 * s, 0.5 * s, 0.05, 3.2 * s, 0.7 * s, H('#c89a52'), r, { bend: 0 });
    contour(ctx, P, r, { col: H('#3a2410'), w: 0.55 * s, l: 1.4 * s });
  }
  /** collectible: small = a golden painted star, big = a turquoise night crystal */
  function drawGemSprite(ctx, r, big) {
    if (!big) {
      const rays = [[0, 3.4, 1.5], [Math.PI / 2, 3.0, 1.4], [Math.PI, 3.4, 1.5], [-Math.PI / 2, 3.6, 1.5]];
      for (const [a, L, w] of rays) stroke(ctx, Math.cos(a) * L * 0.42, -2.6 + Math.sin(a) * L * 0.42, a, L, w + 0.5, H('#7a3a10'), r, { bend: 0, hi: 0.1 });
      for (const [a, L, w] of rays) stroke(ctx, Math.cos(a) * L * 0.42, -2.6 + Math.sin(a) * L * 0.42, a, L * 0.9, w, H('#f0a020'), r, { bend: 0, hi: 0.45 });
      for (let k = 0; k < 4; k++) stroke(ctx, 0, -2.6, k * Math.PI / 2 + Math.PI / 4, 2.2, 0.8, H('#ffd84a'), r, { bend: 0, hi: 0.5 });
      stroke(ctx, -0.2, -2.8, 0.4, 1.6, 1.5, H('#fff6c8'), r, { bend: 0, hi: 0.6 });
      return;
    }
    const s = 1.6;
    const P = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU;
      const k = 1 + 0.5 * Math.max(0, -Math.sin(a)) ** 3;
      P.push([Math.cos(a) * 1.8 * s * (1 - 0.3 * Math.max(0, -Math.sin(a))), -2.2 * s + Math.sin(a) * 1.9 * s * k]);
    }
    const pal = hexes(['#2a8a9a', '#5cc4c8', '#a8ecdc', '#f4fff0']);
    ctx.fillStyle = rgb(pal[1]);
    ctx.fill(pathOf(P));
    stroke(ctx, 0.5 * s, -1.6 * s, -1.4, 2.8 * s, 1.4 * s, H('#2f56b0'), r, { hi: 0.3 });
    stroke(ctx, -0.3 * s, -1.9 * s, -1.4, 2.8 * s, 1.4 * s, pal[1], r, { hi: 0.4 });
    stroke(ctx, -0.5 * s, -2.6 * s, -1.6, 2.2 * s, 1.1 * s, pal[2], r, { hi: 0.5 });
    stroke(ctx, -0.6 * s, -2.8 * s, -1.2, 0.9 * s, 0.7 * s, pal[3], r, { hi: 0.6 });
    contour(ctx, P, r, { col: H('#0e2a40'), w: 0.5 * s, l: 1.3 * s });
  }
  function drawTurnipLantern(ctx, r, f) {
    seg(ctx, -2.2, -11.8, 0, -13.6, 0.6, H('#1a1422'), r);
    seg(ctx, 0, -13.6, 2.2, -11.8, 0.6, H('#1a1422'), r);
    const P = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * TAU, s = Math.sin(a);
      P.push([Math.cos(a) * 4.6 * (s > 0 ? 1 - 0.3 * s * s : 1), -6.4 + s * 4.6 * (s > 0 ? 1 + 0.25 * s * s * s : 1)]);
    }
    paint(ctx, P, r, {
      base: VIO[0][2], sp: 1.0, len: 2.4, wid: 1.0,
      col: (x, y, rr) => (y + (rr.next() - 0.5) * 1.5 < -7 ? rampPick(VIO[0], 2.5 - x * 0.3 + (rr.next() - 0.5)) : rampPick(CREAM[0], 2.5 - x * 0.3 + (rr.next() - 0.5))),
      ang: (x, y) => Math.atan2(x / 21, -(y + 6.4) / 21) * 0.7,
      edge: { col: H('#1d1036'), w: 0.65, l: 1.8 },
    });
    for (let i = 0; i < 3; i++) stroke(ctx, (i - 1) * 1.3, -12, -Math.PI / 2 + (i - 1) * 0.5, 2.6, 0.9, LEAF[2 + (i & 1)], r);
    const g = f * 0.15;
    carved(ctx, tri(-1.4, -7.2, 0.85 + g, 1));
    carved(ctx, tri(1.4, -7.2, 0.85 + g, 1));
    carved(ctx, [[-2.2, -4.9], [-1.1, -4.4], [0, -4.9], [1.1, -4.4], [2.2, -4.9], [1.2, -3.4], [-1.2, -3.4]]);
  }

  /* ---------- character frames ---------- */
  const SPR = {};
  function buildCharacters() {
    const SEED = 1000;
    // a point of the figure after drawJack's own transforms (squash, lean, bob) – anchors for the runtime scarf + glow
    const xf = (q, X, Y) => {
      const sq = q.sq || 0, l = q.lean || 0, yy = Y + (q.bob || 0);
      return [(X * Math.cos(l) - yy * Math.sin(l)) * (1 + sq * 0.6), (X * Math.sin(l) + yy * Math.cos(l)) * (1 - sq)];
    };
    const jk = (q) => {
      const s = withFlip(mk(40, 44, 19, 39, (ctx) => drawJack(ctx, SEED, q)));
      s.neck = xf(q, -3.2, -15.0 - (q.breath || 0) * 0.35);
      s.face = xf(q, 2.7, -21.6 + (q.hb || 0));
      return s;
    };
    const jack = { idle: [], walk: [], dash: [], hurt: [] };
    // idle: breathing loop, 4 poses (neutral – inhale – hold – exhale)
    [0, 0.6, 1, 0.45].forEach((b, i) => jack.idle.push(jk({ legF: 0.06, legB: -0.06, liftF: 0, liftB: 0, armF: -0.05, armB: 0.08, breath: b, hb: -b * 0.3, ht: [0, 0.02, 0.035, 0.012][i], hem: -b * 0.15 })));
    // walk: 8 poses – contact, down, passing, up for each foot; arms counter-swing, head lags the body
    for (let i = 0; i < 8; i++) {
      const ph = (i / 8) * TAU, s = Math.sin(ph), c = Math.cos(ph), sb = Math.sin(ph - 0.4), sh = Math.sin(ph - 1.0);
      jack.walk.push(jk({ legF: s, legB: -s, liftF: Math.max(0, c) * 2.1, liftB: Math.max(0, -c) * 2.1, bob: (sb * sb - 0.5) * 1.7, armF: -s, armB: s, hem: -c * 0.8, hb: (sh * sh - 0.5) * 0.8, ht: 0.06 * Math.sin(2 * ph - 1.2), lean: 0.075 }));
    }
    // dash: anticipation crouch, then the stretched lunge
    jack.dash.push(jk({ legF: 0.3, legB: -0.3, liftF: 0.4, liftB: 0, armF: -0.9, armB: -0.6, bob: 1.2, sq: 0.12, lean: -0.06, hem: 0.3, hb: 0.6 }));
    jack.dash.push(jk({ legF: 1.25, legB: -1.35, liftF: 0.6, liftB: 0.9, armF: -1.4, armB: -1.2, bob: -0.6, sq: -0.07, lean: 0.3, hem: 1.0, hb: 0.4, ht: 0.08 }));
    // hurt: recoil – leaning back, arms up, head tossed back
    jack.hurt.push(jk({ legF: 0.5, legB: -0.4, liftF: 0.5, liftB: 0, armF: 0.4, armB: 0.6, raiseF: 1, raiseB: 0.8, bob: 0.4, sq: 0.06, lean: -0.2, hem: -0.6, hb: 0.5, ht: -0.16 }));
    SPR.jack = jack;
    // small creature: 3 designs x 6-pose waddle (contact squash, hop up, leaves lag behind)
    SPR.creeper = [0, 1, 2].map((v) => {
      const fr = [];
      for (let p = 0; p < 6; p++) {
        const ph = (p / 6) * TAU, s = Math.sin(ph), c = Math.cos(ph), as = Math.abs(s);
        fr.push(withFlip(mk(30, 40, 15, 35, (ctx) => drawCreeper(ctx, 2000 + v * 10, {
          legL: s, legR: -s, liftL: Math.max(0, c) * 1.3, liftR: Math.max(0, -c) * 1.3, bob: -(1 - as) * 1.2,
          sq: as * as * as * 0.08 - (1 - as) * 0.03, tilt: 0.09 * s, leaf: -0.2 * Math.cos(ph - 0.9), arm: -s,
        }, v))));
      }
      return fr;
    });
    // fast creature: 6 poses of the swirling tail and fluttering hood
    // (the forward lean into the flight is baked in – a wisp is always on the move – so it blits without a rotation)
    SPR.ghost = [[0, 1, 2, 3, 4, 5].map((i) => withFlip(mk(34, 34, 17, 31, (ctx) => { ctx.rotate(0.16); drawGhost(ctx, 3000, (i / 6) * TAU); })))];
    // large creature: 6-pose heavy stomp
    SPR.colossus = [(() => {
      const fr = [];
      for (let p = 0; p < 6; p++) {
        const ph = (p / 6) * TAU, s = Math.sin(ph), c = Math.cos(ph), as = Math.abs(s);
        fr.push(withFlip(mk(70, 66, 35, 60, (ctx) => drawColossus(ctx, 4000, {
          legL: s * 0.8, legR: -s * 0.8, liftL: Math.max(0, c), liftR: Math.max(0, -c), bob: as * as * 1.4 - 0.4,
          sq: Math.pow(as, 6) * 0.07, tilt: 0.05 * s, leaf: 0.12 * Math.sin(ph * 2 - 2.0), armF: -Math.sin(ph - 0.7), armB: Math.sin(ph - 0.7),
        }))));
      }
      return fr;
    })()];
    let sd = 4500;
    SPR.gem = [0, 1].map((i) => mk(8, 8, 4, 6, (ctx) => drawGemSprite(ctx, U.rng(sd++ + i), false), 6));
    SPR.gemBig = [0, 1].map((i) => mk(12, 12, 6, 9.5, (ctx) => drawGemSprite(ctx, U.rng(sd++ + i), true), 6));
    SPR.seed = [0, 1].map(() => mk(7, 5, 3.5, 2.5, (ctx) => drawSeedSprite(ctx, U.rng(sd++), false), 6));
    SPR.lantern = [0, 1, 2].map((f) => mk(12, 16, 6, 14.5, (ctx) => drawTurnipLantern(ctx, U.rng(sd++), f)));
    // scarf tail segments (drawn at runtime with spring lag)
    SPR.scarf = [SCARF[1], SCARF[2], SCARF[1]].map((c, i) => mk(7, 4, 0.6, 2, (ctx) => stroke(ctx, 2.9, 0, 0, 5.4 - i * 0.6, 2.2 - i * 0.35, c, U.rng(sd++), { bend: 0.15, hi: 0.35 })));
    // paint puddles left by dissolving creatures
    const puddle = (cols, rx, seed) => mk(rx * 2 + 6, rx + 4, rx + 3, (rx + 4) / 2, (ctx) => {
      const r = U.rng(seed);
      for (let i = 0; i < 14; i++) {
        const a = r.next() * TAU, d = Math.sqrt(r.next());
        stroke(ctx, Math.cos(a) * d * rx * 0.75, Math.sin(a) * d * rx * 0.32, (r.next() - 0.5) * 0.5, rx * (0.7 - d * 0.3), 2.2 + (1 - d) * 1.4, H(cols[i % cols.length]), r, { hi: 0.3 });
      }
    });
    SPR.puddle = {
      creeper: [puddle(['#55206f', '#e2d09a', '#763896', '#c4ad78'], 9, 61), puddle(['#661c5e', '#f4e9c2', '#8a2e7c'], 8, 62), puddle(['#46143e', '#82325e', '#c89e3e'], 10, 63)],
      ghost: [puddle(['#6e9ec8', '#cbece4', '#a2d0d2'], 7, 64)],
      colossus: [puddle(['#46284a', '#4c3322', '#ffb030', '#603a62', '#664630'], 18, 65)],
    };
  }

  /* ======================================================================
     4. Props
     ====================================================================== */
  const PROPS = {};
  /** cypress: a twisting dark flame – lobed tongues, moonlit olive on the left, ultramarine in the shadow */
  function drawCypress(ctx, r, Ht) {
    const ph = r.next() * 6;
    const wAt = (t) => 7.2 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.14 + t * 0.88)), 0.8) * (1 - 0.3 * t);
    const cAt = (t) => 2.3 * Math.sin(t * 4.2 + ph) * t;
    const lobe = (t, side) => 1 + 0.22 * Math.pow(Math.max(0, Math.sin(t * 19 + ph + (side > 0 ? 0 : 1.9))), 2);
    const L = [], R = [];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const t = i / N, y = -2 - t * Ht;
      R.push([cAt(t) + wAt(t) * lobe(t, 1), y]);
      L.push([cAt(t) - wAt(t) * lobe(t, -1), y]);
    }
    L.reverse();
    const P = R.concat([[cAt(1) + 1.6, -Ht - 4.5], [cAt(1) + 0.4, -Ht - 6]]).concat(L);
    seg(ctx, 0, 0, 0.3, -6, 2.8, H('#2a1a14'), r);
    const pal = hexes(['#081210', '#0e2018', '#153222', '#1e442c', '#2c5838', '#3f6e40']);
    paint(ctx, P, r, {
      base: pal[1], sp: 1.8, len: 7.5, wid: 2.0, jit: 0.2,
      col: (x, y, rr) => {
        const t = (-y - 2) / Ht, l = -(x - cAt(t)) / Math.max(1, wAt(t));
        const u = rr.next();
        if (l < -0.35 && u < 0.16) return H('#22355f');                   // cool shadow side
        if (l > 0.35 && u < 0.2) return rr.next() < 0.6 ? H('#6f7c34') : H('#9aa850');   // moonlit tongues
        return rampPick(pal, 2.0 + l * 2.0 + (rr.next() - 0.5) * 1.2);
      },
      ang: (x, y) => {
        const t = (-y - 2) / Ht;
        return -Math.PI / 2 + 0.55 * Math.sin(t * 11 + x * 0.35 + ph);
      },
      edge: { col: H('#04080a'), w: 1.3, l: 4.5 },
    });
    // dark grooves between the flame tongues
    for (let k = 0; k < 4; k++) {
      const pts = [];
      const t0 = 0.1 + k * 0.2;
      for (let i = 0; i <= 5; i++) { const t = t0 + i * 0.035; pts.push([cAt(t) + Math.sin(t * 19 + ph + k) * wAt(t) * 0.5, -2 - t * Ht]); }
      polyStroke(ctx, pts, 0.8, 3, H('#050c0a'), r, { a: 0.8 });
    }
  }
  function drawOlive(ctx, r) {
    const tr = hexes(['#3a2c2a', '#5a4636', '#7a5e44']);
    seg(ctx, 0, 0, -1.5, -10, 3.4, tr[1], r);
    seg(ctx, -1.5, -10, 2.5, -19, 2.8, tr[1], r);
    seg(ctx, -1.5, -10, -6, -18, 2.2, tr[0], r);
    seg(ctx, -0.6, -1, -2, -9.5, 1.0, tr[2], r);
    seg(ctx, -3, 0.2, 3, 0.4, 2, tr[0], r);
    const pal = hexes(['#1e2e2c', '#2c403a', '#3e5648', '#566c56', '#728668', '#94a482']);
    const parts = [[0, -27, 17, 10.5], [-8, -23, 9, 6.5], [8, -24, 9, 6.5]];
    for (const p of parts) {
      const P = blob(p[0], p[1], p[2], p[3], 30, 0.13, r);
      paint(ctx, P, r, {
        base: pal[1], sp: 1.9, len: 4.4, wid: 1.9, jit: 0.4,
        col: (x, y, rr) => {
          if (rr.next() < 0.1) return H('#4a6a8c');
          return rampPick(pal, 2.4 - (x - p[0]) / p[2] * 1.6 - (y - p[1]) / p[3] * 1.4 + (rr.next() - 0.5) * 1.6);
        },
        ang: (x, y) => Math.atan2(y - p[1], x - p[0]) + Math.PI / 2 + Math.sin(x * 0.5) * 0.4,
        edge: { col: H('#142028'), w: 1.1, l: 3.6, skip: (x, y, sh) => sh < -0.2 },
      });
    }
  }
  function drawHay(ctx, r, s) {
    const P = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI + (i / 24) * Math.PI;
      P.push([Math.cos(a) * 14 * s, -Math.pow(-Math.sin(a), 0.75) * 22 * s - 1]);
    }
    P.push([10 * s, 1], [-10 * s, 1]);
    const pal = hexes(['#5a3e16', '#7a581e', '#9c7826', '#bc9632', '#d8b444', '#f0d062']);
    paint(ctx, P, r, {
      base: pal[1], sp: 1.8, len: 5.6, wid: 1.8, jit: 0.2,
      col: (x, y, rr) => {
        if (x > 3 * s && rr.next() < 0.3) return H('#3a4a7a');
        return rampPick(pal, 2.6 - x / (14 * s) * 2.2 - (y / (22 * s)) * -0.6 + (rr.next() - 0.5) * 1.5);
      },
      ang: (x, y) => Math.atan2(y + 25 * s, x) + (x > 0 ? -0.2 : 0.2),
      edge: { col: H('#2a1a0a'), w: 1.2, l: 3.6 },
    });
    for (let i = 0; i < 6; i++) stroke(ctx, (r.next() - 0.5) * 22 * s, -1 + r.next() * 1.5, (r.next() - 0.5) * 0.5, 4, 1, H('#f0d062'), r);
  }
  const WALL = hexes(['#a88a5a', '#c8ac76', '#dcc490', '#ecdcae', '#f6ecc8']);
  function litWindow(ctx, r, x, y, w, h, lights) {
    const P = [[x - w, y - h], [x + w, y - h], [x + w, y + h], [x - w, y + h]];
    ctx.fillStyle = '#ffc93a';
    ctx.fill(pathOf(P));
    stroke(ctx, x - 0.3, y - 0.4, -Math.PI / 2, h * 1.5, w * 1.1, H('#fff0a0'), r, { hi: 0.5 });
    contour(ctx, P, r, { col: H('#1a1430'), w: 0.8, l: 2 });
    seg(ctx, x, y - h + 0.2, x, y + h - 0.2, 0.5, H('#3a2a20'), r);
    seg(ctx, x - w + 0.1, y, x + w - 0.1, y, 0.5, H('#3a2a20'), r);
    lights.push([x, y, 0.8]);
  }
  function drawHouse(ctx, r, v) {
    const lights = [];
    if (v === 2) {   // village church: tall nave and a pointed steeple (Starry Night village)
      const nave = [[-11, -0.5], [7, -0.5], [7.2, -15], [-11.2, -15]];
      const roof = [[-12.6, -14.4], [8.4, -14.6], [5.6, -21], [-10, -21.4]];
      const tower = [[6.8, -0.5], [13.4, -0.5], [13.4, -24], [6.8, -24]];
      const spire = [[6, -23.6], [14.2, -23.6], [10.4, -40]];
      const paintWall = (Pp, shade) => paint(ctx, Pp, r, {
        base: WALL[1], sp: 1.5, len: 4.4, wid: 1.5, jit: 0.2,
        col: (x, y, rr) => (rr.next() < 0.1 ? H('#6a7aa8') : rampPick(WALL, 2.4 - shade - x * 0.05 + (y + 8) * 0.05 + (rr.next() - 0.5) * 1.6)),
        ang: (x, y, rr) => (rr.next() < 0.55 ? -Math.PI / 2 : 0), edge: { col: PRUSSIAN, w: 1.0, l: 3.2 },
      });
      paintWall(nave, 0);
      paint(ctx, roof, r, {
        base: H('#2a3a70'), sp: 1.5, len: 4.4, wid: 1.5,
        col: (x, y, rr) => rampPick(hexes(['#1c2650', '#26346a', '#31458a', '#4a5ea8']), 2 - (y + 18) * 0.18 + (rr.next() - 0.5) * 1.6),
        ang: () => -0.05, edge: { col: H('#0c1030'), w: 1.0, l: 3.2 },
      });
      paintWall(tower, 0.9);
      paint(ctx, spire, r, {
        base: H('#26346a'), sp: 1.3, len: 4.6, wid: 1.4,
        col: (x, y, rr) => rampPick(hexes(['#1c2650', '#26346a', '#31458a', '#4a5ea8', '#6a7ac0']), 2.2 - (x - 10) * 0.25 + (rr.next() - 0.5) * 1.4),
        ang: (x) => (x < 10 ? -1.25 : -1.9), edge: { col: H('#0c1030'), w: 1.0, l: 3.2 },
      });
      seg(ctx, 10.4, -40, 10.4, -44, 0.6, H('#1a1420'), r);
      seg(ctx, 9.2, -42.6, 11.6, -42.6, 0.6, H('#1a1420'), r);
      for (const wx of [-7.5, -2.6, 2.3]) litWindow(ctx, r, wx, -9, 1.3, 2.8, lights);
      litWindow(ctx, r, 10.1, -17, 1.2, 2.4, lights);
      const D = [[8.8, -0.6], [11.4, -0.6], [11.4, -6.8], [8.8, -6.8]];
      ctx.fillStyle = '#1a2450';
      ctx.fill(pathOf(D));
      contour(ctx, D, r, { col: H('#0c1030'), w: 0.8, l: 2.2 });
      return lights;
    }
    const front = [[-12, -0.5], [10, -0.5], [10.3, -17], [-12.2, -16.8]];
    const side = [[10, -0.5], [16.6, -3.4], [16.6, -17.6], [13.2, -24.2], [10.3, -17]];
    const roof = [[-14, -16.2], [10.8, -16.4], [13.4, -24.6], [-9.6, -25.2]];
    paint(ctx, side, r, {
      base: H('#3a4a7a'), sp: 1.6, len: 4.2, wid: 1.6,
      col: (x, y, rr) => rampPick(hexes(['#2e3c6a', '#3a4a7a', '#4a5a8a', '#5e6c9a']), 1.5 + (rr.next() - 0.5) * 2),
      ang: () => -Math.PI / 2, edge: { col: PRUSSIAN, w: 1.0, l: 3.2 },
    });
    paint(ctx, front, r, {
      base: WALL[1], sp: 1.6, len: 4.6, wid: 1.6, jit: 0.2,
      col: (x, y, rr) => (rr.next() < 0.08 ? H('#6a7aa8') : rampPick(WALL, 2.4 - x * 0.06 + (y + 8) * 0.06 + (rr.next() - 0.5) * 1.8)),
      ang: (x, y, rr) => (rr.next() < 0.5 ? 0 : -Math.PI / 2), edge: { col: PRUSSIAN, w: 1.0, l: 3.2 },
    });
    const rp = hexes(['#7a2e1e', '#a8442a', '#c85a30', '#e07a40', '#f09a58']);
    paint(ctx, roof, r, {
      base: rp[1], sp: 1.6, len: 4.6, wid: 1.6,
      col: (x, y, rr) => rampPick(rp, 2.2 - x * 0.06 - (y + 20) * 0.15 + (rr.next() - 0.5) * 1.6),
      ang: () => -0.05, edge: { col: H('#1a1020'), w: 1.0, l: 3.2 },
    });
    // chimney
    paint(ctx, [[4.5, -23], [7.4, -23], [7.4, -28.5], [4.5, -28.5]], r, {
      base: WALL[2], sp: 1.2, len: 2.4, wid: 1.2, col: (x, y, rr) => rampPick(WALL, 2 + (rr.next() - 0.5) * 2), ang: () => -Math.PI / 2,
      edge: { col: PRUSSIAN, w: 0.8, l: 2.4 },
    });
    const wins = v === 0 ? [[-8, -11.5], [4.6, -11.5]] : [[-7.5, -11.5], [-1, -11.5], [5.2, -11.5]];
    for (const w of wins) litWindow(ctx, r, w[0], w[1], 2, 2.6, lights);
    if (v === 0) {
      const D = [[-2.4, -0.6], [1.2, -0.6], [1.2, -8.6], [-2.4, -8.6]];
      ctx.fillStyle = '#1a2450';
      ctx.fill(pathOf(D));
      stroke(ctx, -0.6, -4.6, -Math.PI / 2, 7, 1.6, H('#26346a'), r);
      seg(ctx, 1.0, -1, 1.0, -8.2, 0.5, H('#ffc84a'), r);
      contour(ctx, D, r, { col: H('#0c1030'), w: 0.8, l: 2.2 });
    }
    return lights;
  }
  function drawLamp(ctx, r) {
    seg(ctx, 0, 0, 0, -27, 1.6, H('#141a2a'), r);
    seg(ctx, -0.4, -1, -0.4, -26, 0.5, H('#3a4a6a'), r);
    stroke(ctx, 0, -0.4, 0, 4.4, 1.6, H('#0e1220'), r);
    const P = [[-2.8, -33.5], [2.8, -33.5], [2.1, -28], [-2.1, -28]];
    ctx.fillStyle = '#ffd24a';
    ctx.fill(pathOf(P));
    stroke(ctx, 0, -30.8, -Math.PI / 2, 4.6, 2.6, H('#fff4c0'), r, { hi: 0.6 });
    contour(ctx, P, r, { col: H('#141a2a'), w: 0.8, l: 2 });
    seg(ctx, 0, -33.5, 0, -28, 0.4, H('#3a2a20'), r);
    seg(ctx, -3.6, -33.6, 3.6, -33.6, 1.3, H('#141a2a'), r);
    seg(ctx, -1.5, -35.2, 1.5, -35.2, 1.2, H('#141a2a'), r);
    return [[0, -30.8, 1.4]];
  }
  function drawSunflowers(ctx, r, n) {
    for (let i = 0; i < n; i++) {
      const sx = (i - (n - 1) / 2) * 5.5 + (r.next() - 0.5) * 1.5, h = 20 + r.next() * 10;
      const lean = (r.next() - 0.5) * 4;
      seg(ctx, sx, 0, sx + lean * 0.5, -h * 0.5, 1.2, LEAF[1], r);
      seg(ctx, sx + lean * 0.5, -h * 0.5, sx + lean, -h, 1.1, LEAF[2], r);
      for (let k = 0; k < 2; k++) {
        const s = k ? 1 : -1, ly = -h * (0.3 + k * 0.2);
        stroke(ctx, sx + lean * 0.4 + s * 2.4, ly, s * 0.5 + (s < 0 ? Math.PI : 0), 4.4, 2.2, LEAF[1 + k], r);
      }
      const hx = sx + lean, hy = -h;
      const petals = 13;
      for (let k = 0; k < petals; k++) {
        const a = (k / petals) * TAU + r.next() * 0.2;
        stroke(ctx, hx + Math.cos(a) * 3.1, hy + Math.sin(a) * 2.7, a, 3.0, 1.3, H(['#e8a020', '#f6c030', '#ffd84a'][k % 3]), r);
      }
      ctx.fillStyle = '#4a2e14';
      ctx.beginPath(); ctx.ellipse(hx, hy, 2.0, 1.75, 0, 0, TAU); ctx.fill();
      for (let k = 0; k < 4; k++) stroke(ctx, hx + (r.next() - 0.5) * 1.6, hy + (r.next() - 0.5) * 1.4, r.next() * TAU, 1.3, 0.8, H(k & 1 ? '#7a5020' : '#2a1a0a'), r);
      contour(ctx, blob(hx, hy, 5.2, 4.6, 20, 0.05, r), r, { col: H('#5a3a10'), w: 0.5, l: 1.4, skip: (x, y, sh) => sh < 0.2 });
    }
  }
  /** irises (Saint-Rémy): a fan of blue-green sword leaves with ultramarine blooms and a cadmium beard */
  function drawIris(ctx, r, n) {
    const lv = hexes(['#1d4a40', '#2f6a5a', '#3f8a6a', '#5aa078']);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.2 + (r.next() - 0.5) * 0.12, L = 9 + r.next() * 6 - Math.abs(i - 4) * 0.8;
      const bx = (i - 4) * 0.9;
      stroke(ctx, bx + Math.cos(a) * L * 0.5, Math.sin(a) * L * 0.5, a, L, 1.6, lv[(i + 1) % 4], r, { bend: (r.next() - 0.5) * 0.4, hi: 0.25 });
    }
    const pet = hexes(['#1e2470', '#2f3a9a', '#4a56c0', '#6a5ab8', '#8a7ad0']);
    for (let k = 0; k < n; k++) {
      const fx = (k - (n - 1) / 2) * 3.6 + (r.next() - 0.5) * 1.4, fy = -11 - r.next() * 6 - (k & 1) * 2.4;
      seg(ctx, fx * 0.4, -2, fx, fy, 0.7, lv[1], r);
      for (let p = 0; p < 3; p++) { const a = -Math.PI / 2 + (p - 1) * 1.05; stroke(ctx, fx + Math.cos(a) * 1.4, fy + Math.sin(a) * 1.4, a, 2.8, 1.7, pet[2 + (p & 1)], r, { hi: 0.4 }); }
      for (let p = 0; p < 2; p++) { const a = Math.PI / 2 + (p ? 0.7 : -0.7); stroke(ctx, fx + Math.cos(a) * 1.5, fy + Math.sin(a) * 1.4, a, 2.8, 1.8, pet[1], r, { hi: 0.3 }); }
      stroke(ctx, fx, fy + 0.6, Math.PI / 2, 1.2, 0.8, H('#f0c040'), r, { bend: 0, hi: 0.5 });
      contour(ctx, blob(fx, fy, 2.8, 2.6, 14, 0.12, r), r, { col: H('#10143a'), w: 0.45, l: 1.3, skip: (x, y, sh) => sh < 0 });
    }
  }
  /** stones by the paths: rounded forms, stroke direction wraps the form, warm moonlit top, cool shadow */
  function drawStones(ctx, r, v) {
    const pal = hexes(['#262a40', '#3a405a', '#545a74', '#6e7490', '#8e92a8', '#b0a888']);
    const list = v === 0 ? [[0, -3.4, 6.4, 4.2]] : v === 1 ? [[-3.2, -2.8, 4.6, 3.4], [3.6, -2.0, 3.2, 2.4]] : [[0, -1.8, 8, 2.4], [5.4, -1.6, 2.4, 1.8]];
    for (const [cx, cy, rx, ry] of list) {
      const P = blob(cx, cy, rx, ry, 22, 0.08, r);
      paint(ctx, P, r, {
        base: pal[2], sp: 1.15, len: 2.8, wid: 1.25, jit: 0.2,
        col: (x, y, rr) => {
          const l = -(x - cx) / rx * 1.2 - (y - cy) / ry * 1.6;
          if (l > 1.4 && rr.next() < 0.35) return pal[5];
          return rampPick(pal, 2.4 + l + (rr.next() - 0.5) * 1.1);
        },
        ang: (x, y) => Math.atan2(y - cy, x - cx) + Math.PI / 2,
        edge: { col: H('#10122a'), w: 0.85, l: 2.4, skip: (x, y, sh) => sh < -0.45 },
      });
    }
    for (let i = 0; i < 4; i++) stroke(ctx, (r.next() - 0.5) * 12, 0.3, (r.next() - 0.5) * 0.4, 3, 1.2, LEAF[1 + (i & 1)], r, { a: 0.9 });
  }
  /**
   * Wind poses baked at init: 5 skews of the sprite about its base (lean -1 … +1 × sway). The gust picks one
   * per frame, so the plants move "on twos" in held poses and every blit stays axis-aligned (cheap).
   */
  function swayFrames(s) {
    const A = s.sway, src = s.c, k = src.width / s.w, ayp = s.ay * k, extra = Math.ceil(A * ayp) + 2;
    s.pose = [-1, -0.5, 0, 0.5, 1].map((q) => {
      const kk = A * q, o = U.canvas(src.width + extra * 2, src.height);
      o.ctx.setTransform(1, 0, kk, 1, extra - kk * ayp, 0);
      o.ctx.drawImage(src, 0, 0);
      return { c: o.c, f: s.f ? U.flipX(o.c) : null, w: o.c.width / k, h: s.h, ax: s.ax + extra / k, ay: s.ay };
    });
    return s;
  }
  function buildProps() {
    let sd = 5000;
    PROPS.cypress = [70, 84, 58].map((h) => { const s = withFlip(mk(30, h + 14, 15, h + 7, (ctx) => drawCypress(ctx, U.rng(sd++), h))); s.fade = [12, h]; s.sway = 0.03; return s; });
    PROPS.olive = [0, 1].map(() => { const s = withFlip(mk(48, 44, 24, 40, (ctx) => drawOlive(ctx, U.rng(sd++)))); s.sway = 0.025; return s; });
    PROPS.hay = [1, 0.8].map((s) => withFlip(mk(36, 30, 18, 26, (ctx) => drawHay(ctx, U.rng(sd++), s))));
    PROPS.house = [0, 1, 2].map((v) => {
      let lights;
      const s = withFlip(v === 2 ? mk(34, 50, 14, 46, (ctx) => { lights = drawHouse(ctx, U.rng(sd++), v); }) : mk(40, 36, 18, 32, (ctx) => { lights = drawHouse(ctx, U.rng(sd++), v); }));
      s.lights = lights;
      return s;
    });
    PROPS.lamp = [0].map(() => {
      let lights;
      const s = mk(12, 40, 6, 37, (ctx) => { lights = drawLamp(ctx, U.rng(sd++)); });
      s.lights = lights;
      return s;
    });
    PROPS.sun = [3, 2].map((n) => { const s = withFlip(mk(26, 38, 13, 35, (ctx) => drawSunflowers(ctx, U.rng(sd++), n))); s.sway = 0.05; return s; });
    PROPS.iris = [3, 5].map((n) => { const s = withFlip(mk(24, 26, 12, 23, (ctx) => drawIris(ctx, U.rng(sd++), n))); s.sway = 0.06; return s; });
    PROPS.stone = [0, 1, 2].map((v) => withFlip(mk(22, 12, 11, 9, (ctx) => drawStones(ctx, U.rng(sd++), v))));
    for (const t in PROPS) for (const s of PROPS[t]) if (s.sway) swayFrames(s);
  }

  /* ======================================================================
     5. Icons (HUD + cards) – painted in a 100x100 space
     ====================================================================== */
  function iconHalo(ctx, r) {
    const cols = hexes(['#ffe070', '#f0a030', '#fff6c8']);
    for (const [R, a] of [[30, 0.45], [40, 0.3], [47, 0.18]]) {
      const n = Math.round((TAU * R) / 9);
      for (let k = 0; k < n; k++) {
        const t = (k / n) * TAU;
        stroke(ctx, 50 + Math.cos(t) * R, 50 + Math.sin(t) * R, t + Math.PI / 2 + 0.15, 9, 3.2, cols[k % 3], r, { a });
      }
    }
  }
  function iconTurnip(ctx, r, cx, cy, s) {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.55;
      stroke(ctx, cx + Math.cos(a) * 12 * s, cy - 18 * s + Math.sin(a) * 12 * s, a, 18 * s, 6 * s, LEAF[1 + (i & 1)], r);
    }
    const P = [];
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * TAU, sn = Math.sin(a);
      P.push([cx + Math.cos(a) * 20 * s * (sn > 0 ? 1 - 0.35 * sn * sn : 1), cy + sn * 19 * s * (sn > 0 ? 1 + 0.3 * sn * sn * sn : 1)]);
    }
    paint(ctx, P, r, {
      base: VIO[0][2], sp: 4.2 * s, len: 9 * s, wid: 3.8 * s,
      col: (x, y, rr) => (y + (rr.next() - 0.5) * 6 * s < cy + 1 ? rampPick(VIO[0], 2.5 - (x - cx) / (12 * s) + (rr.next() - 0.5)) : rampPick(CREAM[0], 2.5 - (x - cx) / (12 * s) + (rr.next() - 0.5))),
      ang: (x, y) => Math.atan2(x - cx, -(y - cy)) * 0.6,
      edge: { col: H('#1d1036'), w: 3.2 * s, l: 9 * s },
    });
    for (const sd of [-1, 1]) stroke(ctx, cx + sd * 6 * s, cy - 2 * s, sd * 0.35, 6 * s, 3.4 * s, H('#ffcf40'), r, { bend: 0, hi: 0.5 });
  }
  function iconSeed(ctx, r, cx, cy, s, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s);
    const P = blob(0, 0, 15, 9.5, 24, 0.02, r).map((p) => [p[0], p[1] * (p[0] > 0 ? 1 - 0.4 * (p[0] / 15) : 1)]);
    paint(ctx, P, r, {
      base: H('#e8d4a0'), sp: 3.6, len: 9, wid: 3.6,
      col: (x, y, rr) => rampPick(hexes(['#b0884a', '#d8bc84', '#f0e0b4', '#fff6dc']), 2 - y * 0.15 + (rr.next() - 0.5)),
      ang: () => 0, edge: { col: H('#3a2410'), w: 3, l: 8 },
    });
    ctx.restore();
  }
  function paintIcon(ctx, id, big) {
    const r = U.rng(id.length * 131 + id.charCodeAt(0) * 7 + (big ? 3 : 0));
    if (big) iconHalo(ctx, r);
    switch (id) {
      case 'hp-heart': {
        const P = [];
        for (let i = 0; i < 40; i++) {
          const t = (i / 40) * TAU, sn = Math.sin(t);
          P.push([50 + 16 * sn * sn * sn * 2.3, 50 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 2.3]);
        }
        paint(ctx, P, r, {
          base: H('#a8201a'), sp: 5, len: 12, wid: 5,
          col: (x, y, rr) => rampPick(hexes(['#7a1410', '#a8201a', '#d0341e', '#ea5a2a', '#f68a4a', '#ffc070']), 2.6 - (x - 50) / 18 - (y - 45) / 22 + (rr.next() - 0.5) * 1.2),
          ang: (x, y) => Math.atan2(y - 50, x - 50) + Math.PI / 2, edge: { col: H('#1a1030'), w: 4.6, l: 11 },
        });
        break;
      }
      case 'kills': iconTurnip(ctx, r, 50, 56, 1.25); break;
      case 'dmg': {
        iconSeed(ctx, r, 46, 54, 1.9, -0.7);
        for (let i = 0; i < 4; i++) stroke(ctx, 74, 26, (i * Math.PI) / 4, i & 1 ? 14 : 24, i & 1 ? 3 : 4.5, H(i & 1 ? '#ffe070' : '#fff6c8'), r, { bend: 0 });
        break;
      }
      case 'rate': {
        const P3 = [[34, 76], [46, 40], [76, 58]];
        for (let i = 0; i < 3; i++) {
          const x = P3[i][0], y = P3[i][1];
          for (let k = 0; k < 3; k++) stroke(ctx, x - 17 - k * 2, y + 17 - k * 2 + (k - 1) * 5, -0.78, 20 - k * 4, 4.2 - k * 0.8, H(['#f0a030', '#ffd84a', '#fff0a8'][k]), r, { a: 0.95 });
          iconSeed(ctx, r, x, y, 1.05, -0.78);
        }
        break;
      }
      case 'multi': {
        const P = spline([[30, 40], [50, 36], [70, 40], [80, 66], [72, 86], [50, 90], [28, 86], [20, 66]], 4);
        paint(ctx, P, r, {
          base: H('#7a581e'), sp: 4.5, len: 11, wid: 4.4,
          col: (x, y, rr) => rampPick(hexes(['#5a3e16', '#7a581e', '#9c7826', '#bc9632', '#d8b444']), 2.5 - (x - 50) / 18 + (rr.next() - 0.5) * 1.4),
          ang: (x) => -Math.PI / 2 + (x - 50) * 0.02, edge: { col: H('#2a1a0a'), w: 3.6, l: 9 },
        });
        seg(ctx, 34, 40, 66, 40, 4, H('#c8341e'), r);
        for (let i = 0; i < 4; i++) iconSeed(ctx, r, 36 + i * 9, 28 + (i & 1) * 4, 0.55, -1.2 + i * 0.6);
        break;
      }
      case 'bounce': {
        for (let k = 0; k < 8; k++) { const t = (k / 8) * TAU; stroke(ctx, 20 + Math.cos(t) * 12, 84 + Math.sin(t) * 5, t + 1.57, 9, 3.4, H(k & 1 ? '#a2d0d2' : '#6e9ec8'), r); }
        for (let i = 0; i < 8; i++) {
          const t = 0.06 + (i / 7) * 0.8, x = 20 + t * 64, y = 80 - Math.sin(t * Math.PI) * 58;
          stroke(ctx, x, y, -Math.cos(t * Math.PI) * 1.15, 9, 4.4, H(i & 1 ? '#ffe070' : '#f0a030'), r, { a: 0.95 });
        }
        iconSeed(ctx, r, 76, 66, 1.5, 0.9);
        break;
      }
      case 'lantern': {
        ctx.save(); ctx.translate(50, 92); ctx.scale(5.2, 5.2);
        drawTurnipLantern(ctx, r, 1);
        ctx.restore();
        break;
      }
      case 'speed': {
        const P = spline([[18, 70], [30, 64], [52, 66], [70, 52], [82, 40], [86, 50], [80, 72], [74, 82], [62, 76], [40, 80], [22, 80]], 4);
        paint(ctx, P, r, {
          base: H('#8fd0cc'), sp: 4, len: 10, wid: 3.8,
          col: (x, y, rr) => rampPick(GHO, 3 - (y - 60) / 14 + (rr.next() - 0.5) * 1.5),
          ang: (x, y) => Math.atan2(y - 66, x - 50) * 0.3, edge: { col: H('#1f3a78'), w: 3, l: 8 },
        });
        seg(ctx, 80, 72, 82, 90, 4, H('#cbece4'), r);
        for (const [x, y, s] of [[30, 34, 1], [52, 22, 0.7], [70, 26, 0.5]]) for (let i = 0; i < 4; i++) stroke(ctx, x, y, (i * Math.PI) / 4, (i & 1 ? 10 : 18) * s, (i & 1 ? 2.4 : 3.6) * s, H(i & 1 ? '#ffe070' : '#fff6c8'), r, { bend: 0 });
        break;
      }
      case 'magnet': {
        ctx.lineWidth = 6; ctx.strokeStyle = '#7a581e';
        ctx.beginPath(); ctx.arc(50, 52, 26, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        for (let i = 0; i < 4; i++) { const a = Math.PI * (1.12 + i * 0.25); stroke(ctx, 50 + Math.cos(a) * 26, 52 + Math.sin(a) * 26, a + 1.57, 10, 4.5, H(i & 1 ? '#bc9632' : '#9c7826'), r); }
        for (let i = 0; i < 4; i++) stroke(ctx, 36 + i * 9, 50 - (i & 1) * 3, 0, 8, 6, H(i & 1 ? '#ffd84a' : '#f0a030'), r, { hi: 0.5 });
        const P = [[20, 52], [80, 52], [72, 86], [28, 86]];
        paint(ctx, P, r, {
          base: H('#7a581e'), sp: 4.5, len: 11, wid: 4,
          col: (x, y, rr) => rampPick(hexes(['#5a3e16', '#7a581e', '#9c7826', '#bc9632', '#d8b444']), (Math.floor(y / 8) & 1 ? 3 : 1.5) - (x - 50) / 30 + (rr.next() - 0.5)),
          ang: (x, y) => (Math.floor(y / 8) & 1 ? 0.35 : -0.35), edge: { col: H('#2a1a0a'), w: 3.4, l: 9 },
        });
        break;
      }
      case 'hp': {
        for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) stroke(ctx, 38 + i * 12 + Math.sin(k * 1.4 + i) * 4, 30 - k * 9, -Math.PI / 2 + Math.sin(k + i) * 0.6, 9, 3, H('#e8eef4'), r, { a: 0.75 - k * 0.15 });
        const P = spline([[18, 48], [50, 44], [82, 48], [78, 74], [64, 86], [36, 86], [22, 74]], 4);
        paint(ctx, P, r, {
          base: COAT[1], sp: 4.5, len: 11, wid: 4.4,
          col: (x, y, rr) => rampPick(COAT, 2.6 - (x - 50) / 16 + (rr.next() - 0.5) * 1.4),
          ang: (x, y) => Math.atan2(y - 40, x - 50) + Math.PI / 2, edge: { col: PRUSSIAN, w: 3.6, l: 9 },
        });
        const T = blob(50, 48, 30, 6, 24, 0.03, r);
        paint(ctx, T, r, {
          base: H('#d86c1e'), sp: 3.6, len: 8, wid: 3.4,
          col: (x, y, rr) => (rr.next() < 0.25 ? VIO[0][3] : rampPick(ORANGE, 3 + (rr.next() - 0.5) * 2.5)), ang: () => 0,
          edge: { col: H('#3a1a08'), w: 2.6, l: 7 },
        });
        for (const s of [-1, 1]) seg(ctx, 50 + s * 30, 56, 50 + s * 38, 54, 4, H('#141d52'), r);
        break;
      }
      default:
        iconSeed(ctx, r, 50, 50, 1.6, -0.5);
    }
  }

  /* ======================================================================
     6. HUD textures + CSS
     ====================================================================== */
  function goldFrame(ctx, x, y, w, h, t) {
    const bands = [['#2a1c06', 0.08], ['#7a5414', 0.12], ['#d8aa48', 0.14], ['#fbe7a0', 0.06], ['#b8862c', 0.16], ['#6a4610', 0.08], ['#e6c068', 0.14], ['#8a6018', 0.12], ['#3a2808', 0.1]];
    let ins = 0;
    for (const [c, f] of bands) {
      const bw = f * t;
      ctx.lineWidth = bw;
      ctx.strokeStyle = c;
      ctx.strokeRect(x + ins + bw / 2, y + ins + bw / 2, w - 2 * ins - bw, h - 2 * ins - bw);
      ins += bw;
    }
    // beads along the middle band
    const bi = t * 0.5;
    const bead = (bx, by) => {
      const g = ctx.createRadialGradient(bx - t * 0.03, by - t * 0.03, 0, bx, by, t * 0.07);
      g.addColorStop(0, '#fff4c0'); g.addColorStop(0.5, '#d8aa48'); g.addColorStop(1, '#5a3a0c');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(bx, by, t * 0.065, 0, TAU); ctx.fill();
    };
    const st = t * 0.22;
    for (let bx = x + t; bx < x + w - t; bx += st) { bead(bx, y + bi); bead(bx, y + h - bi); }
    for (let by = y + t; by < y + h - t; by += st) { bead(x + bi, by); bead(x + w - bi, by); }
    // corner rosettes
    for (const [cx, cy] of [[x + bi, y + bi], [x + w - bi, y + bi], [x + bi, y + h - bi], [x + w - bi, y + h - bi]]) {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, t * 0.62);
        g.addColorStop(0, '#fff0b0'); g.addColorStop(0.6, '#c89a38'); g.addColorStop(1, '#4a3008');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * t * 0.3, cy + Math.sin(a) * t * 0.3, t * 0.26, t * 0.13, a, 0, TAU);
        ctx.fill();
      }
      const g = ctx.createRadialGradient(cx - t * 0.08, cy - t * 0.08, 0, cx, cy, t * 0.25);
      g.addColorStop(0, '#fffbe0'); g.addColorStop(0.5, '#e8c060'); g.addColorStop(1, '#6a4610');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, t * 0.22, 0, TAU); ctx.fill();
    }
  }
  function nightPaint(ctx, x, y, w, h, r, opts = {}) {
    ctx.fillStyle = opts.bg || '#121a44';
    ctx.fillRect(x, y, w, h);
    const pal = hexes(opts.pal || ['#16224e', '#1d2c6a', '#26408a', '#2f56a8', '#3a6ab8']);
    const sz = opts.sz || 10;
    const n = Math.round((w * h) / (sz * sz * 0.9));
    const cx = opts.cx !== undefined ? opts.cx : x + w / 2, cy = opts.cy !== undefined ? opts.cy : y + h / 2;
    for (let i = 0; i < n; i++) {
      const px = x + r.next() * w, py = y + r.next() * h;
      const a = Math.atan2(py - cy, (px - cx) * (h / w)) + Math.PI / 2 + Math.sin(px * 0.02 + py * 0.03) * 0.5;
      stroke(ctx, px, py, opts.flat ? (r.next() - 0.5) * 0.3 : a, sz * (1.6 + r.next()), sz * 0.55, pal[(r.next() * pal.length) | 0], r);
    }
    if (opts.stars) {
      for (let i = 0; i < opts.stars; i++) {
        const sx = x + (0.1 + r.next() * 0.8) * w, sy = y + (0.1 + r.next() * 0.8) * h, R = sz * (0.8 + r.next() * 0.9);
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * TAU;
          stroke(ctx, sx + Math.cos(a) * R, sy + Math.sin(a) * R, a + 1.7, sz * 1.2, sz * 0.4, H(k & 1 ? '#ffe070' : '#f0c040'), r, { a: 0.85 });
        }
        stroke(ctx, sx, sy, 0, sz * 0.9, sz * 0.8, H('#fff6c8'), r);
      }
    }
  }
  function strokeBar(w, h, cols, seed) {
    const { c, ctx } = cv(w, h);
    const r = U.rng(seed);
    const pal = hexes(cols);
    ctx.fillStyle = rgb(pal[1]);
    ctx.fillRect(0, 0, w, h);
    const n = Math.round((w * h) / 60);
    for (let i = 0; i < n; i++) stroke(ctx, r.next() * w, r.next() * h, (r.next() - 0.5) * 0.25, 16 + r.next() * 14, 5 + r.next() * 3, pal[(r.next() * pal.length) | 0], r, { bend: (r.next() - 0.5) * 0.15 });
    return c;
  }
  function hudTexturesAsync(done) {
    const T = {};
    const r = U.rng(4242);
    const jobs = [
      () => {
        const { c, ctx } = cv(120, 120);
        goldFrame(ctx, 0, 0, 120, 120, 30);
        T.frame = c.toDataURL();
        const m = cv(28, 64);
        const rr = U.rng(14);
        for (let i = 0; i < 9; i++) {
          const y = 2 + i * 7.2, L = 8 + rr.next() * 18;
          stroke(m.ctx, L / 2 - 4, y, 0, L + 8, 9, [0, 0, 0], rr, { bend: 0 });
        }
        T.rag = m.c.toDataURL();
      },
      () => {
        T.track = strokeBar(300, 40, ['#0e1638', '#16224e', '#1d2c6a', '#26408a'], 11).toDataURL('image/jpeg', 0.9);
        T.xp = strokeBar(900, 32, ['#c88a1c', '#e8b030', '#f6cc48', '#ffe27a', '#fff0a8'], 12).toDataURL('image/jpeg', 0.9);
        T.hp = strokeBar(300, 32, ['#a8281a', '#d0401e', '#ea6028', '#f6883a', '#ffb060'], 13).toDataURL('image/jpeg', 0.9);
      },
      () => {
        const { c, ctx } = cv(360, 140);
        nightPaint(ctx, 0, 0, 360, 140, r, { sz: 11, stars: 2 });
        ctx.fillStyle = 'rgba(8,10,30,0.35)';
        ctx.fillRect(0, 0, 360, 140);
        goldFrame(ctx, 0, 0, 360, 140, 22);
        T.clock = c.toDataURL('image/jpeg', 0.9);
        const p = cv(600, 60);
        nightPaint(p.ctx, 0, 0, 600, 60, r, { sz: 9, flat: true });
        T.plaque = p.c.toDataURL('image/jpeg', 0.88);
      },
      () => {
        const { c, ctx } = cv(460, 600);
        nightPaint(ctx, 0, 0, 460, 600, r, { sz: 17, cx: 230, cy: 200, stars: 0 });
        const g = ctx.createLinearGradient(0, 260, 0, 600);
        g.addColorStop(0, 'rgba(6,8,26,0)'); g.addColorStop(0.35, 'rgba(6,8,26,0.55)'); g.addColorStop(1, 'rgba(6,8,26,0.7)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 460, 600);
        for (let i = 0; i < 26; i++) stroke(ctx, 40 + r.next() * 380, 590 - r.next() * 20, (r.next() - 0.5) * 0.3, 26, 8, H(['#0e1d18', '#142a20', '#1d2c6a'][i % 3]), r);
        goldFrame(ctx, 0, 0, 460, 600, 34);
        T.card = c.toDataURL('image/jpeg', 0.88);
      },
      () => {
        const { c, ctx } = cv(800, 130);
        nightPaint(ctx, 0, 0, 800, 130, r, { sz: 13, flat: true, stars: 3 });
        ctx.fillStyle = 'rgba(8,10,30,0.3)';
        ctx.fillRect(0, 0, 800, 130);
        goldFrame(ctx, 0, 0, 800, 130, 24);
        T.banner = c.toDataURL('image/jpeg', 0.9);
      },
    ];
    let i = 0;
    const step = () => {
      try { jobs[i++](); } catch (e) { console.error(e); window.__reportError && window.__reportError(e); }
      if (i < jobs.length) setTimeout(step, 0);
      else done(T);
    };
    setTimeout(step, 0);
  }
  function makeCss(T) {
    const S = 'body.style-vangogh';
    const cin = "'Cinzel', 'Trajan Pro', Georgia, serif";
    const brush = "'Caveat Brush', 'Segoe Print', cursive";
    const ale = "'Alegreya', Georgia, serif";
    const sh = '0 2px 0 #0a0e24, 0 0 6px rgba(6,8,26,.9)';
    const mask = `-webkit-mask: url(${T.rag}) right center / 14px 100% no-repeat, linear-gradient(#000,#000) left center / calc(100% - 13px) 100% no-repeat; mask: url(${T.rag}) right center / 14px 100% no-repeat, linear-gradient(#000,#000) left center / calc(100% - 13px) 100% no-repeat;`;
    const frame = (w) => `border: ${w}px solid transparent; border-image: url(${T.frame}) 30 / ${w}px stretch;`;
    return `
${S} { font-family: ${cin}; color: #f6e6b0; }
${S} #hud { padding: 14px 26px; }
${S} #hud .xp { height: 16px; background: url(${T.track}) center / cover; border: 0; border-radius: 0; overflow: visible; box-shadow: 0 3px 10px rgba(0,0,0,.55); }
${S} #hud .xp::after { content: ''; position: absolute; inset: -8px; ${frame(9)} pointer-events: none; }
${S} #hud .xp-fill { inset: 0 auto 0 0; background: url(${T.xp}) left center / calc(100vw - 52px) 100% no-repeat; transition: width .3s; ${mask} }
${S} #hud .lvl { font: 400 21px ${brush}; color: #fff0b0; right: 14px; text-shadow: ${sh}; z-index: 2; letter-spacing: .5px; }
${S} #hud .topline { margin-top: 16px; }
${S} #hud .hp { gap: 10px; }
${S} #hud .hp-icon, ${S} #hud .kills-icon { width: 42px; height: 42px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.6)); }
${S} #hud .hp-bar { width: 232px; height: 20px; background: url(${T.track}) center / cover; border: 0; border-radius: 0; overflow: visible; box-shadow: 0 3px 10px rgba(0,0,0,.55); }
${S} #hud .hp-bar::after { content: ''; position: absolute; inset: -8px; ${frame(9)} pointer-events: none; }
${S} #hud .hp-fill { inset: 0 auto 0 0; background: url(${T.hp}) left center / 232px 100% no-repeat; transition: width .15s; ${mask} }
${S} #hud .hp-text { font: 400 23px ${brush}; color: #fff0c8; text-shadow: ${sh}; margin-left: 8px; }
${S} #hud .clock { padding: 12px 40px 14px; margin-top: -6px; background: url(${T.clock}) center / 100% 100% no-repeat; box-shadow: 0 6px 16px rgba(0,0,0,.5); }
${S} #hud .clock-time { font: 800 36px ${cin}; color: #ffe27a; letter-spacing: 2px; line-height: 1; text-shadow: 0 2px 0 #3a2408, 0 0 14px rgba(255,200,80,.45); }
${S} #hud .clock-label { font: 400 18px ${brush}; color: #cfe4ff; text-transform: none; letter-spacing: .5px; opacity: 1; margin-top: 3px; text-shadow: ${sh}; }
${S} #hud .kills { font: 400 34px ${brush}; color: #fff0c8; text-shadow: ${sh}; gap: 8px; }
${S}.hurt #hud .hp-bar { filter: drop-shadow(0 0 8px rgba(255,90,40,.9)); }
${S} #stylebar { background: url(${T.plaque}) center / cover; color: #f6e6b0; ${frame(8)} border-radius: 0; padding: 4px 22px; gap: 14px; box-shadow: 0 4px 14px rgba(0,0,0,.6); }
${S} #stylebar .style-family { font: 400 17px ${brush}; color: #9fd0f0; text-transform: none; letter-spacing: .3px; opacity: 1; }
${S} #stylebar .style-name { font: 800 16px ${cin}; color: #ffe27a; letter-spacing: 1.5px; text-shadow: 0 1px 0 #3a2408; }
${S} #stylebar .style-hint { font: italic 500 15px ${ale}; opacity: .85; }
${S} #stylebar .auto.on { color: #ffd84a; }
${S} #stylemenu { background: url(${T.plaque}) center / cover; ${frame(10)} border-radius: 0; }
${S} #stylemenu .sm-item { color: #f6e6b0; background: rgba(6,8,26,.45); font-family: ${cin}; }
${S} #stylemenu .sm-item:hover { background: rgba(255,210,90,.18); }
${S} #stylemenu .sm-item.active { border-color: #ffd84a; }
${S} #stylemenu .sm-fam { font: 400 15px ${brush}; color: #9fd0f0; opacity: 1; }
${S} #levelup { background: radial-gradient(ellipse at 50% 45%, rgba(20,28,70,.35), rgba(6,6,20,.82) 75%); gap: 26px; }
${S} #levelup .lu-title { font-size: 0; text-shadow: none; padding: 20px 70px 24px; background: url(${T.banner}) center / 100% 100% no-repeat; box-shadow: 0 10px 24px rgba(0,0,0,.6); }
${S} #levelup .lu-title::after { content: 'A new masterpiece!'; font: 800 44px ${cin}; color: #ffe27a; letter-spacing: 2px; text-shadow: 0 3px 0 #3a2408, 0 0 18px rgba(255,200,80,.5); }
${S} #levelup .lu-cards { gap: 30px; }
${S} #levelup .card { width: 232px; min-height: 304px; padding: 36px 26px 30px; gap: 8px; background: url(${T.card}) center / 100% 100% no-repeat; border: 0; border-radius: 0; color: #f6e6b0; box-shadow: 0 12px 26px rgba(0,0,0,.65); transition: transform .15s; }
${S} #levelup .card:hover { transform: translateY(-8px) scale(1.02); }
${S} #levelup .card-icon { width: 112px; height: 112px; filter: drop-shadow(0 3px 4px rgba(0,0,0,.6)); }
${S} #levelup .card-name { font: 800 19px ${cin}; color: #ffe27a; letter-spacing: 1px; line-height: 1.15; text-shadow: 0 2px 0 #1a1004, 0 0 8px rgba(0,0,0,.8); margin-top: 4px; }
${S} #levelup .card-desc { font: italic 500 18px ${ale}; color: #e6eefa; opacity: 1; line-height: 1.25; text-shadow: 0 1px 3px #000; }
${S} #levelup .card-key { font: 400 24px ${brush}; color: #ffd84a; opacity: 1; top: 18px; left: 26px; text-shadow: 0 1px 2px #000; }
${S} #levelup .lu-hint { font: 400 22px ${brush}; color: #cfe4ff; opacity: .95; text-shadow: ${sh}; }
${S} #gameover { background: radial-gradient(ellipse at 50% 45%, rgba(20,28,70,.35), rgba(6,6,20,.86) 75%); }
${S} #gameover .go-title { font: 800 54px ${cin}; color: #ffe27a; padding: 18px 80px 22px; background: url(${T.banner}) center / 100% 100% no-repeat; text-shadow: 0 3px 0 #3a2408; }
${S} #gameover .go-stats { font: italic 500 22px ${ale}; color: #e6eefa; text-shadow: 0 1px 4px #000; }
${S} #gameover .go-hint { font: 400 24px ${brush}; color: #ffd84a; }
${S} #pausebox { font: 800 56px ${cin}; color: #ffe27a; text-shadow: 0 3px 0 #3a2408, 0 0 20px rgba(0,0,0,.9); }
`;
  }


  /* ======================================================================
     7. FX sprites – everything is paint: dabs, comma flicks, rings of strokes, swirls, puddles
     ====================================================================== */
  const FX = {};
  const FXCOL = {
    yellow: '#ffd040', orange: '#f08a2a', white: '#f6f0dc', violet: '#8a4aac', cream: '#eadcae', turq: '#8fd0cc',
    blue: '#2f56b0', umber: '#5a3a24', red: '#d8452a', green: '#3f8a4a', gold: '#ffe27a', ghost: '#cdeee6', plum: '#4a2a5a',
  };
  function haloSprite(px, cols, rings) {
    const { c, ctx } = cv(px, px);
    const R = px / 2, r = U.rng(px * 7 + cols.length);
    const g = ctx.createRadialGradient(R, R, 0, R, R, R * 0.5);
    g.addColorStop(0, rgb(H(cols[0]), 0.55));
    g.addColorStop(0.5, rgb(H(cols[1]), 0.18));
    g.addColorStop(1, rgb(H(cols[1]), 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, px, px);
    rings.forEach((rg, i) => {
      const rr = rg[0] * R, n = Math.max(6, Math.round((TAU * rr) / (rg[2] * R * 0.85)));
      const off = r.next() * TAU;
      // hand-painted bands, not a target: the radius wobbles, strokes vary in length and overlap like commas
      const wob = r.next() * TAU;
      for (let k = 0; k < n; k++) {
        const a = off + (k / n) * TAU + (r.next() - 0.5) * 0.16;
        const rk = rr * (1 + 0.05 * Math.sin(a * 3 + wob) + (r.next() - 0.5) * 0.05);
        const col = H(cols[Math.min(cols.length - 1, i + (r.next() < 0.3 ? 1 : 0))]);
        stroke(ctx, R + Math.cos(a) * rk, R + Math.sin(a) * rk, a + Math.PI / 2 + 0.08 + (r.next() - 0.5) * 0.12, rg[2] * R * (0.75 + r.next() * 0.6), rg[3] * R * (0.8 + r.next() * 0.4), col, r, { a: rg[1] * (0.7 + r.next() * 0.3), bend: 0.22 });
      }
    });
    return gpuc(c);
  }
  function radial(px, stops) {
    const { c, ctx } = cv(px, px);
    const g = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, px, px);
    return gpuc(c);
  }
  function swirlSprite(px, cols, seed) {
    const { c, ctx } = cv(px, px);
    const R = px / 2, r = U.rng(seed);
    for (let arm = 0; arm < 3; arm++) {
      for (let i = 0; i < 16; i++) {
        const t = i / 16, a = arm * (TAU / 3) + t * 4.2, rr = R * (0.18 + t * 0.74);
        stroke(ctx, R + Math.cos(a) * rr, R + Math.sin(a) * rr, a + Math.PI / 2 + 0.25, R * (0.22 + t * 0.1), R * 0.09, H(cols[(i + arm) % cols.length]), r, { a: 0.55 + t * 0.45, bend: 0.15 });
      }
    }
    return gpuc(c);
  }
  /** a ring of tangential strokes (no glow) – paint shock rings */
  function ringSprite(px, cols, seed) {
    const { c, ctx } = cv(px, px);
    const R = px / 2, r = U.rng(seed), n = 18;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + (r.next() - 0.5) * 0.15, rr = R * (0.8 + (r.next() - 0.5) * 0.08);
      stroke(ctx, R + Math.cos(a) * rr, R + Math.sin(a) * rr, a + Math.PI / 2 + 0.2, R * 0.36, R * 0.12, H(cols[k % cols.length]), r, { bend: 0.2 });
    }
    return gpuc(c);
  }
  function buildFx() {
    FX.halo = {
      gold: haloSprite(160, ['#fff6c8', '#ffe070', '#ffd040', '#9fd4dc', '#d6e6b0'], [[0.22, 0.95, 0.22, 0.085], [0.4, 0.72, 0.25, 0.075], [0.6, 0.45, 0.27, 0.065], [0.82, 0.22, 0.28, 0.055]]),
      cool: haloSprite(128, ['#f4fff0', '#c8f0e4', '#8fd0cc', '#5aa8c0', '#3a7aa8'], [[0.24, 0.85, 0.24, 0.09], [0.46, 0.58, 0.26, 0.075], [0.72, 0.3, 0.28, 0.065]]),
      small: haloSprite(64, ['#fff6c8', '#ffe070', '#f0a030'], [[0.3, 0.8, 0.22, 0.1], [0.56, 0.5, 0.2, 0.09], [0.82, 0.25, 0.18, 0.08]]),
    };
    FX.glow = radial(64, [[0, 'rgba(255,236,150,0.95)'], [0.35, 'rgba(255,190,70,0.45)'], [1, 'rgba(255,150,40,0)']]);
    FX.pool = radial(64, [[0, 'rgba(255,200,90,0.5)'], [0.5, 'rgba(240,160,60,0.2)'], [1, 'rgba(240,140,40,0)']]);
    FX.swirl = {
      creeper: swirlSprite(96, ['#985ab6', '#e2d09a', '#55206f'], 11),
      ghost: swirlSprite(96, ['#cbece4', '#6e9ec8', '#f2fbf4'], 12),
      colossus: swirlSprite(96, ['#ffd040', '#603a62', '#a07c52'], 13),
      gold: swirlSprite(128, ['#ffe070', '#fff6c8', '#f0a030'], 14),
      blue: swirlSprite(96, ['#4a76cc', '#a2d0d2', '#26409a'], 15),
    };
    FX.ring = {
      gold: ringSprite(96, ['#ffe070', '#fff6c8', '#f0a030'], 21),
      red: ringSprite(96, ['#e8502a', '#f6883a', '#c8341e'], 22),
      cool: ringSprite(96, ['#cbece4', '#8fd0cc', '#4a76cc'], 23),
      violet: ringSprite(96, ['#985ab6', '#e2d09a', '#763896'], 24),
    };
    FX.dab = {};
    FX.flick = {};
    let sd = 300;
    for (const k in FXCOL) {
      FX.dab[k] = [0, 1, 2].map(() => {
        const r = U.rng(sd++);
        const { c, ctx } = cv(28, 12);
        ctx.scale(4, 4);
        stroke(ctx, 3.5, 1.5, 0, 4.6, 1.9, H(FXCOL[k]), r, { bend: (r.next() - 0.5) * 0.5 });
        return gpuc(c);
      });
      // comma flick: a loaded blob that drags out into a thin tail (points along +x)
      const r = U.rng(sd++);
      const { c, ctx } = cv(48, 16);
      ctx.scale(4, 4);
      stroke(ctx, 6.5, 2, 0, 9, 1.3, H(FXCOL[k]), r, { bend: 0.25 });
      stroke(ctx, 9.6, 2, 0, 3.4, 2.6, H(FXCOL[k]), r, { bend: 0, hi: 0.45 });
      FX.flick[k] = gpuc(c);
    }
    // painted shadow: dark ultramarine horizontal strokes
    {
      const { c, ctx } = cv(80, 32);
      const r = U.rng(77);
      ctx.scale(4, 4);
      for (let i = 0; i < 16; i++) {
        const a = r.next() * TAU, d = Math.sqrt(r.next());
        stroke(ctx, 10 + Math.cos(a) * d * 6, 4 + Math.sin(a) * d * 2, (r.next() - 0.5) * 0.3, 7 - d * 3, 2.6 - d, H(i & 1 ? '#0c1030' : '#141a44'), r, { hi: 0.08, a: 0.75 });
      }
      FX.shadow = gpuc(c);
    }
    // star flash: 8 rays (long/short), hot core
    {
      const { c, ctx } = cv(48, 48);
      const r = U.rng(78);
      for (let i = 0; i < 8; i++) stroke(ctx, 24 + Math.cos(i * Math.PI / 4) * (i & 1 ? 6 : 9), 24 + Math.sin(i * Math.PI / 4) * (i & 1 ? 6 : 9), (i * Math.PI) / 4, i & 1 ? 12 : 20, i & 1 ? 3.5 : 5.5, H(i & 1 ? '#ffd040' : '#ffe070'), r, { bend: 0 });
      stroke(ctx, 24, 24, 0.4, 10, 9, H('#fff6c8'), r, { bend: 0, hi: 0.6 });
      FX.star = gpuc(c);
    }
    // dash smear
    {
      const { c, ctx } = cv(120, 48);
      const r = U.rng(79);
      ctx.scale(4, 4);
      for (let i = 0; i < 6; i++) stroke(ctx, 15, 4 + i * 0.9 + (r.next() - 0.5) * 0.4, 0, 22 - Math.abs(i - 2.5) * 3, 1.2, H(['#4a76cc', '#a2d0d2', '#f6aa3c', '#26409a'][i % 4]), r, { a: 0.8, bend: 0.06 });
      FX.smear = gpuc(c);
    }
    // comet trail of the projectile: orange body, chrome-yellow core, fading tail
    {
      const { c, ctx } = cv(80, 16);
      const r = U.rng(80);
      ctx.scale(4, 4);
      stroke(ctx, 10, 2, 0, 18, 2.4, H('#d86c1e'), r, { bend: 0.05 });
      stroke(ctx, 11.5, 1.8, 0, 14, 1.2, H('#ffd040'), r, { bend: 0.05, hi: 0.5 });
      stroke(ctx, 15.5, 1.9, 0, 6, 0.6, H('#fff6c8'), r, { bend: 0 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      const g = ctx.createLinearGradient(0, 0, 80, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, 'rgba(0,0,0,0.55)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 80, 16);
      FX.trail = gpuc(c);
    }
    // a long translucent wind stroke for the atmosphere
    {
      const { c, ctx } = cv(240, 40);
      const r = U.rng(81);
      ctx.scale(4, 4);
      for (let i = 0; i < 5; i++) stroke(ctx, 30 + (r.next() - 0.5) * 6, 5 + (i - 2) * 1.1, (r.next() - 0.5) * 0.05, 48 - Math.abs(i - 2) * 9, 1.3, H(['#a2c4e0', '#e8e0b8', '#7aa0d0'][i % 3]), r, { bend: 0.12, hi: 0.2 });
      FX.wind = gpuc(c);
    }
  }

  /* ======================================================================
     8. Runtime helpers
     ====================================================================== */
  let BM = { a: 1, d: 1, e: 0, f: 0 };
  function rotDraw(ctx, img, x, y, ang, w, h, sq) {
    const S = BM.a, c = Math.cos(ang) * S, s = Math.sin(ang) * S, q = sq || 1;
    ctx.setTransform(c, s * q, -s, c * q, BM.e + x * S, BM.f + y * S);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }
  /** like rotDraw, but the image's anchor (ax, ay in drawn units) sits at (x, y) */
  function rotDrawA(ctx, img, x, y, ang, w, h, ax, ay) {
    const S = BM.a, c = Math.cos(ang) * S, s = Math.sin(ang) * S;
    ctx.setTransform(c, s, -s, c, BM.e + x * S, BM.f + y * S);
    ctx.drawImage(img, -ax, -ay, w, h);
  }
  const resetT = (ctx) => ctx.setTransform(BM.a, 0, 0, BM.d, BM.e, BM.f);
  /** sprite anchored at its feet, with squash/stretch (sx, sy) and a lean (rotation about the feet) */
  function blitX(ctx, s, x, y, flip, sc, sx, sy, rot, img) {
    const im = img || (flip ? s.f || s.c : s.c);
    const ax = flip ? s.w - s.ax : s.ax;
    const W = s.w * sc * sx, Hh = s.h * sc * sy;
    if (!rot) { ctx.drawImage(im, x - ax * sc * sx, y - s.ay * sc * sy, W, Hh); return; }
    const S = BM.a, c = Math.cos(rot) * S, sn = Math.sin(rot) * S;
    ctx.setTransform(c, sn, -sn, c, BM.e + x * S, BM.f + y * S);
    ctx.drawImage(im, -ax * sc * sx, -s.ay * sc * sy, W, Hh);
    resetT(ctx);
  }
  function tintOf(s, flip, key, col) {
    if (!s[key]) { s[key] = U.tint(s.c, col, 1); s[key + 'f'] = U.flipX(s[key]); }
    return flip ? s[key + 'f'] : s[key];
  }
  const flashOf = (s, flip) => tintOf(s, flip, 'fl', '#fff0c8');
  let LIGHTS = [], LIGHTS_NEXT = [];
  let OVL = null;
  function buildOverlay(W, Hh) {
    const band = Math.ceil(Hh * 0.13);
    const page = cv(W, Hh), hurt = cv(W, Hh);
    const pctx = page.ctx, hctx = hurt.ctx;
    const pi = pctx.createImageData(W, Hh), hi = hctx.createImageData(W, Hh);
    const pd = pi.data, hd = hi.data;
    const rad = Hh * 0.12;
    for (let y = 0; y < Hh; y++) {
      const inY = y < band || y >= Hh - band;
      for (let x = 0; x < W; x++) {
        if (!inY && x >= band && x < W - band) continue;
        const qx = Math.abs(x - W / 2) - (W / 2 - rad), qy = Math.abs(y - Hh / 2) - (Hh / 2 - rad);
        const d = rad - (hyp(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0));
        const t = clamp01(1 - d / band);
        const a = t * t * 0.62;
        const o = (y * W + x) * 4;
        pd[o] = 12; pd[o + 1] = 10; pd[o + 2] = 30; pd[o + 3] = a * 255;
        const ha = t * t * 0.55;
        hd[o] = 200; hd[o + 1] = 52; hd[o + 2] = 24; hd[o + 3] = ha * 255;
      }
    }
    pctx.putImageData(pi, 0, 0);
    hctx.putImageData(hi, 0, 0);
    // varnish brush strokes along the border
    const r = U.rng(99);
    const sc = Hh / 360;
    const edgeStrokes = (ctx, pal, alpha) => {
      const n = Math.round((W + Hh) / (14 * sc));
      for (let i = 0; i < n * 2; i++) {
        const side = i % 4;
        const u = r.next(), dd = Math.pow(r.next(), 1.6) * band * 0.75;
        let x, y, ang;
        if (side === 0) { x = u * W; y = dd; ang = 0; } else if (side === 1) { x = u * W; y = Hh - dd; ang = 0; } else if (side === 2) { x = dd; y = u * Hh; ang = Math.PI / 2; } else { x = W - dd; y = u * Hh; ang = Math.PI / 2; }
        stroke(ctx, x, y, ang + (r.next() - 0.5) * 0.5, 22 * sc * (0.7 + r.next() * 0.6), 6 * sc, H(pal[(r.next() * pal.length) | 0]), r, { a: alpha * (1 - dd / band) });
      }
    };
    edgeStrokes(pctx, ['#0a0c24', '#141a44', '#1d2c6a', '#0e1d18'], 0.5);
    edgeStrokes(hctx, ['#c8341e', '#e8502a', '#f6883a', '#8a1a10'], 0.7);
    OVL = { W, H: Hh, band, page: gpuc(page.c), hurt: gpuc(hurt.c) };
  }
  function drawStrips(ctx, img, W, Hh, b) {
    ctx.drawImage(img, 0, 0, W, b, 0, 0, W, b);
    ctx.drawImage(img, 0, Hh - b, W, b, 0, Hh - b, W, b);
    ctx.drawImage(img, 0, b, b, Hh - 2 * b, 0, b, b, Hh - 2 * b);
    ctx.drawImage(img, W - b, b, b, Hh - 2 * b, W - b, b, b, Hh - 2 * b);
  }
  const COLS = {
    creeper: ['violet', 'cream', 'violet', 'green', 'plum'],
    ghost: ['ghost', 'turq', 'white', 'blue'],
    colossus: ['umber', 'plum', 'yellow', 'orange', 'umber'],
  };
  const MAINC = { creeper: 'violet', ghost: 'ghost', colossus: 'plum' };
  const HEIGHT = { creeper: 22, ghost: 22, colossus: 46 };
  function dabBurst(game, x, y, z, n, cols, sp, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.35 + Math.random() * 0.8);
      game.addParticle({
        x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.65, vz: 30 + Math.random() * 80, grav: 260,
        life: 0.8 + Math.random() * 0.7, size: size * (0.6 + Math.random() * 0.8), kind: 'dab',
        col: cols[(Math.random() * cols.length) | 0], drag: 1.6, rot: a, vr: (Math.random() - 0.5) * 14, v: (Math.random() * 3) | 0,
      });
    }
  }
  const easeOut = (t) => 1 - (1 - t) * (1 - t);
  const easeInOut = (t) => t * t * (3 - 2 * t);
  /**
   * A swirl painted on stroke by stroke: each arm grows from the centre outwards (opaque loaded strokes, no
   * alpha ghosting), the whole whorl turns slowly, then the outer strokes thin out and dry first.
   */
  const SWIRLC = {
    creeper: ['violet', 'cream', 'plum'], ghost: ['ghost', 'turq', 'white', 'blue'], colossus: ['yellow', 'plum', 'umber', 'orange'],
    gold: ['gold', 'yellow', 'white', 'orange', 'yellow'], blue: ['blue', 'turq', 'white'],
  };
  function paintSwirl(ctx, x, y, R, age, rot, key, arms, per, flat, hole) {
    const cols = SWIRLC[key] || SWIRLC.gold;
    const grow = 0.55 + 0.45 * easeOut(Math.min(1, age * 1.8));
    for (let k = 0; k < arms; k++) {
      for (let j = 0; j < per; j++) {
        const t = j / (per - 1);
        const rev = clamp01((age * 2.6 - t * 0.9) / 0.22);
        if (rev <= 0) break;
        const dry = 1 - U.smoothstep(0.5, 1, age + t * 0.14);
        if (dry <= 0) continue;
        const a = rot + k * (TAU / arms) + t * 4.0 + age * 1.4;
        const rr = R * (0.14 + t * 0.82) * grow;
        const sx = x + Math.cos(a) * rr, sy = y + Math.sin(a) * rr * flat;
        // a swirl around a standing figure passes behind it: strokes in the figure's column above the feet are skipped
        if (hole && sy < y + 2 && Math.abs(sx - x) < hole) continue;
        const L = R * (0.42 + t * 0.18) * (0.4 + 0.6 * rev);
        ctx.globalAlpha = dry > 0.35 ? 1 : dry / 0.35;
        rotDraw(ctx, FX.dab[cols[(j + k) % cols.length]][(j + k * 2) % 3], sx, sy, a + 1.5708 + 0.14, L, L * 0.43 * (0.25 + 0.75 * dry));
      }
    }
    resetT(ctx);
    ctx.globalAlpha = 1;
  }
  /** the main character's scarf tail: a damped spring that lags behind the motion (follow-through) */
  function scarfAngle(p, rt) {
    let st = p.__vgScarf;
    if (!st || rt < st.rt - 0.5) st = p.__vgScarf = { a: 2.0, va: 0, rt };
    const dt = Math.min(0.05, Math.max(0, rt - st.rt));
    st.rt = rt;
    const dash = p.dashT > 0, mv = p.moving || dash;
    const target = dash ? Math.PI + 0.22 : mv ? Math.PI + 0.06 + Math.sin(rt * 7.3) * 0.12 : 2.05 + Math.sin(rt * 1.7) * 0.12;
    st.va += ((target - st.a) * 70 - st.va * 8) * dt;
    st.a += st.va * dt;
    return st;
  }

  /* ---------- creature states: painted-in spawn, smear-and-melt death ---------- */
  function enemySpawn(ctx, e, fr, x, y, flip, sc, rt) {
    const st = e.spawnT;
    // a paint vortex spins up on the ground ...
    const sw = FX.swirl[e.type] || FX.swirl.creeper;
    const vr = e.r * (1.0 + 1.5 * easeOut(Math.min(1, st * 1.5)));
    ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, st * 1.15)) * 0.85;
    rotDraw(ctx, sw, x, e.y - 1, -rt * 5 - st * 5 + e.seed * 6, vr * 2, vr * 2, 0.55);
    resetT(ctx);
    // ... and the creature is painted in from the ground up, the loaded brush riding on the edge,
    // crouched while it appears, then a stretch overshoot that settles
    const f = easeOut(clamp01((st - 0.12) / 0.6));
    if (f <= 0) { ctx.globalAlpha = 1; return; }
    let sx, sy;
    if (st > 0.72) { const k = Math.sin((Math.PI * (st - 0.72)) / 0.28); sy = 1 + 0.12 * k; sx = 1 - 0.07 * k; }
    else { sy = 0.88 + 0.12 * f; sx = 1.08 - 0.08 * f; }
    const im = flip ? fr.f || fr.c : fr.c, ax = flip ? fr.w - fr.ax : fr.ax;
    const iw = im.width, ih = im.height, cut = Math.floor(ih * (1 - f) * 0.92);
    const top = y - fr.ay * sc * sy, Hd = fr.h * sc * sy;
    ctx.globalAlpha = e.type === 'ghost' ? 0.9 : 1;
    if (ih - cut > 0) ctx.drawImage(im, 0, cut, iw, ih - cut, x - ax * sc * sx, top + (cut / ih) * Hd, fr.w * sc * sx, ((ih - cut) / ih) * Hd);
    if (f < 0.98) {
      const ly = top + (cut / ih) * Hd, set = FX.dab[MAINC[e.type]] || FX.dab.violet;
      const wid = e.r * 1.5 * sc;
      for (let i = 0; i < 3; i++) rotDraw(ctx, set[i], x + (i - 1) * wid * 0.55 + Math.sin(rt * 21 + i * 2) * 1.2, ly + (i & 1) * 0.8, (i - 1) * 0.18, 7, 3);
      resetT(ctx);
    }
    ctx.globalAlpha = 1;
  }
  /**
   * Death: the figure "unpaints". A squash + warm flash as the blow lands (15 %), then the body slumps into its
   * puddle (the wisp stretches up into its swirl) while its own strokes peel off the silhouette one after another
   * and ride a spiral up into the wind – each chip stretches as it is pulled, then thins out.
   */
  const CHIPS = { creeper: 9, ghost: 8, colossus: 14 };
  function enemyDeath(ctx, e, fr, vi, x, y, flip, sc) {
    const d = clamp01(e.deathT);
    const ghost = e.type === 'ghost', big = e.type === 'colossus';
    const dir = Math.abs(e.kx || 0) > 2 ? Math.sign(e.kx) : flip ? 1 : -1;
    const h = (HEIGHT[e.type] || 22) * sc;
    if (!ghost) {
      const pud = SPR.puddle[e.type][e.type === 'creeper' ? vi : 0];
      const pa = easeOut(Math.min(1, d * 1.6));
      ctx.globalAlpha = 0.85 * (d < 0.75 ? 1 : (1 - d) / 0.25);
      blit(ctx, pud, x + dir * pa * 2, y + 1, false, sc * (0.4 + 0.7 * pa));
    }
    if (d < 0.15) {
      const a = d / 0.15;
      ctx.globalAlpha = 1;
      blitX(ctx, fr, x, y, flip, sc, 1 + 0.24 * a, 1 - 0.2 * a, 0);
      ctx.globalAlpha = 0.95 - a * 0.4;
      blitX(ctx, fr, x, y, flip, sc, 1 + 0.24 * a, 1 - 0.2 * a, 0, flashOf(fr, flip));
      ctx.globalAlpha = 1;
      return;
    }
    const b = (d - 0.15) / 0.85, eb = easeInOut(b), eo = easeOut(b);
    if (ghost) {
      ctx.globalAlpha = (1 - b) * 0.7;
      rotDraw(ctx, FX.swirl.ghost, x, y - 15 - eb * 6, -b * 4 + e.seed * 6, 16 + eo * 20, 16 + eo * 20, 0.75);
      resetT(ctx);
    }
    // the body: solid creatures slump and spread into the puddle, the wisp is drawn up and thinned
    ctx.globalAlpha = Math.pow(1 - b, 1.5) * (ghost ? 0.9 : 1);
    const ssx = ghost ? 1 - 0.4 * eb : 1 + 0.2 * eb, ssy = ghost ? 1 + 0.25 * eb : 1 - 0.62 * eb;
    blitX(ctx, fr, x + (ghost ? 0 : dir * eb * 1.5), y - (ghost ? eb * 8 : 0), flip, sc, ssx, ssy, dir * eb * (ghost ? 0.25 : 0.1));
    // its strokes peel off one after another and spiral away (staggered release, stretch, then thin out)
    const n = CHIPS[e.type] || 9, cols = COLS[e.type] || COLS.creeper;
    const cy = y - h * 0.52, R0 = h * (big ? 0.36 : 0.42), spin = ghost ? -dir : dir;
    const s0 = (e.seed || 0) * 97.3;
    for (let i = 0; i < n; i++) {
      const u = U.fract(Math.sin(s0 + i * 12.9898) * 43758.5453), v = U.fract(u * 7.31 + i * 0.618);
      const dl = v * 0.32;
      const t = clamp01((b - dl) / (1 - dl));
      if (t <= 0) continue;
      const et = easeOut(t);
      const ang = (i / n) * TAU + u * 0.8 + spin * et * (2.0 + v * 1.2);
      const rr = R0 * (0.5 + 0.5 * u) * (1 + et * (big ? 1.2 : 1.6));
      const px = x + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr * 0.62 - et * (big ? 12 : 15) * (0.6 + 0.6 * v);
      const L = (big ? 6.8 : 4.8) * (0.7 + 0.5 * u) * (1 + 0.8 * Math.sin(Math.PI * Math.min(1, t * 1.5))) * (1 - t * t * 0.6);
      ctx.globalAlpha = 1 - t * t;
      rotDraw(ctx, FX.dab[cols[i % cols.length]][i % 3], px, py, ang + spin * 1.5708 + 0.25, L, L * 0.42);
    }
    resetT(ctx);
    ctx.globalAlpha = 1;
  }
  function drawScarf(ctx, fr, x, y, fs, st, rt, moving) {
    let px = x + fr.neck[0] * fs, py = y + fr.neck[1];
    let a = st.a;
    const curl = clamp(-st.va * 0.05, -0.45, 0.45);
    for (let i = 0; i < 3; i++) {
      const ang = a + curl * (i + 1) * 0.5 + Math.sin(rt * (moving ? 11 : 3) + i * 1.3) * (moving ? 0.1 : 0.05) * i;
      const wa = fs > 0 ? ang : Math.PI - ang;
      const s = SPR.scarf[i];
      rotDrawA(ctx, s.c, px, py, wa, s.w, s.h, s.ax, s.ay);
      const L = 4.6 - i * 0.6;
      px += Math.cos(wa) * L; py += Math.sin(wa) * L;
      a = ang;
    }
    resetT(ctx);
  }

  /* ======================================================================
     9. Registration
     ====================================================================== */
  Styles.register({
    id: 'vangogh',
    name: 'Sternennacht',
    family: 'Ölgemälde',
    description: 'A living Van Gogh night painting: thick, directional impasto strokes in ultramarine, viridian and cadmium yellow that follow every form.',
    groundColor: '#141c30',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Cinzel:wght@600;800', 'Caveat+Brush', 'Alegreya:ital,wght@1,500'],
    css: '',

    init() {
      const t0 = performance.now();
      buildAtlas();
      const t1 = performance.now();
      buildCharacters();
      const t2 = performance.now();
      buildProps();
      const t3 = performance.now();
      buildFx();
      // HUD textures (gilded frames, painted bars, framed card paintings) are built right after the switch,
      // one texture per task, so the synchronous init stays short
      const self = this;
      hudTexturesAsync((T) => {
        self.css = makeCss(T);
        const tag = document.getElementById('style-css');
        if (tag) { if (document.body.classList.contains('style-vangogh')) tag.textContent = self.css; return; }
        // pages that copied the (then still empty) css string at init get the finished sheet as its own
        // <style> – it is scoped to body.style-vangogh like every style sheet, so it is inert elsewhere
        let own = document.getElementById('vg-style-css');
        if (!own) { own = document.createElement('style'); own.id = 'vg-style-css'; document.head.appendChild(own); }
        own.textContent = self.css;
      });
      window.__vgInit = { atlas: Math.round(t1 - t0), chars: Math.round(t2 - t1), props: Math.round(t3 - t2), rest: Math.round(performance.now() - t3) };
    },

    renderGroundChunk(ctx, info) { return groundGen(ctx, info); },

    propsForChunk(info) {
      const out = [];
      const w = new Float32Array(5);
      const ok = (x, y) => !G.nearSpawn(x, y, 95);
      const at = (x, y) => fieldAt(x, y, w);
      const clus = (x, y) => U.fbm(x / 70 + 1.7, y / 70 + 9.1, 81, 2);
      // cypresses: a dense wall along the forest edge, thinning out towards the dark heart of the wood ...
      G.scatterOwned(info, 46, 9101, (x, y, r) => {
        if (!ok(x, y)) return;
        const F = forestN(x, y);
        if (F < 0.6 || !r.chance(F < 0.635 ? 0.55 : 0.22)) return;
        const f = at(x, y);
        if (f[2] > 0.05 || f[4] > 0.05 || f[3] < 0.6) return;
        out.push({ x, y, t: 'cypress', v: r.int(0, 2), flip: r.chance(0.5), sh: [8, 2.6], pad: 110 });
      });
      // ... and designed groups of 2–3 standing together in open meadows
      G.scatterOwned(info, 160, 9107, (x, y, r) => {
        if (!ok(x, y) || !r.chance(0.42)) return;
        if (at(x, y)[1] < 0.85) return;
        const n = r.int(2, 3);
        for (let i = 0; i < n; i++) {
          const px = x + (i - (n - 1) / 2) * 9 + (r.next() - 0.5) * 3, py = y + (i & 1) * 4 + (r.next() - 0.5) * 3;
          if (!ok(px, py) || at(px, py)[1] < 0.7) continue;
          out.push({ x: px, y: py, t: 'cypress', v: i === 0 ? 1 : r.chance(0.5) ? 0 : 2, flip: r.chance(0.5), sh: [8, 2.6], pad: 110 });
        }
      });
      // olive groves where the cluster field is high
      G.scatterOwned(info, 62, 9102, (x, y, r) => {
        if (!ok(x, y) || clus(x, y) < 0.6 || !r.chance(0.55)) return;
        if (at(x, y)[1] < 0.8) return;
        out.push({ x, y, t: 'olive', v: r.int(0, 1), flip: r.chance(0.5), sh: [16, 4.5], pad: 70 });
      });
      // haystacks in the wheat, often in pairs
      G.scatterOwned(info, 120, 9103, (x, y, r) => {
        if (!ok(x, y) || !r.chance(0.36)) return;
        if (at(x, y)[0] < 0.7) return;
        const v = r.int(0, 1);
        out.push({ x, y, t: 'hay', v, flip: r.chance(0.5), sh: [v ? 11 : 14, v ? 3.2 : 4] });
        if (r.chance(0.5) && ok(x + 26, y + 8) && at(x + 26, y + 8)[0] > 0.7) out.push({ x: x + 26, y: y + 8, t: 'hay', v: 1 - v, flip: r.chance(0.5), sh: [v ? 14 : 11, v ? 4 : 3.2] });
      });
      // sunflowers along the inner edge of the wheat fields
      G.scatterOwned(info, 64, 9104, (x, y, r) => {
        if (!ok(x, y)) return;
        const Wn = wheatN(x, y);
        if (Wn < 0.5 || Wn > 0.535 || !r.chance(0.45)) return;
        const f = at(x, y);
        if (f[0] < 0.4) return;
        out.push({ x, y, t: 'sun', v: r.int(0, 1), flip: r.chance(0.5), sh: [8, 2.2] });
      });
      // houses and a village church near the paths – each with a garden of sunflowers
      G.scatterOwned(info, 330, 9105, (x, y, r) => {
        if (!r.chance(0.5) || G.nearSpawn(x, y, 130)) return;
        const f = at(x, y);
        if (f[2] > 0.01 || f[4] > 0.01 || f[3] > 0.2) return;
        pathInfo(x, y, PI_);
        if (PI_.d > 70) return;
        const v = r.chance(0.22) ? 2 : r.int(0, 1);
        out.push({ x, y, t: 'house', v, flip: r.chance(0.5), sh: v === 2 ? [15, 4] : [17, 4], pad: 80 });
        if (r.chance(0.7)) out.push({ x: x - 22 + r.next() * 4, y: y + 6, t: 'sun', v: r.int(0, 1), flip: r.chance(0.5), sh: [8, 2.2] });
      });
      // lamps along the paths
      G.scatterOwned(info, 120, 9106, (x, y, r) => {
        if (!ok(x, y) || !r.chance(0.65)) return;
        if (at(x, y)[4] > 0.05) return;
        pathInfo(x, y, PI_);
        if (PI_.d < 15 || PI_.d > 22) return;
        out.push({ x, y, t: 'lamp', v: 0, flip: false, sh: [4, 1.5], pad: 90 });
      });
      // irises in clumps on the pond shores
      G.scatterOwned(info, 20, 9108, (x, y, r) => {
        if (!ok(x, y)) return;
        const P = pondN(x, y);
        if (P < 0.31 || P > 0.33 || clus(x, y) < 0.47 || !r.chance(0.6)) return;   // in clumps, with open shore between
        if (forestN(x, y) > 0.59) return;
        out.push({ x, y, t: 'iris', v: r.int(0, 1), flip: r.chance(0.5), sh: [7, 2] });
      });
      // stones by the paths
      G.scatterOwned(info, 58, 9109, (x, y, r) => {
        if (!ok(x, y) || !r.chance(0.4)) return;
        pathInfo(x, y, PI_);
        if (PI_.d < 13 || PI_.d > 19) return;
        if (at(x, y)[4] > 0.05) return;
        out.push({ x, y, t: 'stone', v: r.int(0, 2), flip: r.chance(0.5), sh: [8, 2.2] });
      });
      // the renderer already keeps 120 units below the view for tall props (the tallest cypress is ~98), so no
      // extra cull margin is needed – fewer off-screen props and shadows per frame
      for (const o of out) o.pad = 1;
      return out;
    },

    drawProp(ctx, p, view) {
      const s = PROPS[p.t] && PROPS[p.t][p.v];
      if (!s) return;
      let a = 1;
      if (s.fade) {
        const pl = view.game.player;
        if (pl.y < p.y - 1 && pl.y > p.y - s.fade[1] && Math.abs(pl.x - p.x) < s.fade[0]) a = 0.45;
      }
      ctx.globalAlpha = a;
      if (s.pose) {
        // wind: a gust wave travels across the world, slower than the actors; the base stays planted
        const ph = view.rt * 1.25 - p.x * 0.0085 - p.y * 0.004;
        const q = 0.65 * Math.sin(ph) + 0.35 * Math.sin(ph * 2.3 + p.x * 0.1);
        let idx = Math.round(q * 2 + 2);
        idx = idx < 0 ? 0 : idx > 4 ? 4 : idx;
        blit(ctx, s.pose[p.flip ? 4 - idx : idx], p.x, p.y, p.flip);
      } else blit(ctx, s, p.x, p.y, p.flip);
      ctx.globalAlpha = 1;
      if (s.lights) {
        const rt = view.rt;
        ctx.globalCompositeOperation = 'lighter';
        for (const L of s.lights) {
          const lx = p.x + (p.flip ? -L[0] : L[0]), ly = p.y + L[1];
          const fl = 0.85 + 0.1 * Math.sin(rt * 7 + p.x) + 0.05 * Math.sin(rt * 17 + p.y);
          const R = 13 * L[2] * fl;
          ctx.globalAlpha = 0.55 * fl;
          rotDraw(ctx, FX.halo.gold, lx, ly, rt * 0.35 + p.x, R * 2, R * 2);
          resetT(ctx);
          ctx.globalAlpha = 0.5;
          ctx.drawImage(FX.glow, lx - R * 0.45, ly - R * 0.45, R * 0.9, R * 0.9);
          LIGHTS_NEXT.push(lx, p.y + 2, L[2]);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    },

    drawGroundOverlay(ctx, view, game) {
      const m = ctx.getTransform();
      BM = { a: m.a, d: m.d, e: m.e, f: m.f };
      LIGHTS = LIGHTS_NEXT;
      LIGHTS_NEXT = [];
      ctx.globalCompositeOperation = 'lighter';
      // warm light pools of lanterns + windows on the ground
      for (let i = 0; i < LIGHTS.length; i += 3) {
        const R = 30 * LIGHTS[i + 2];
        ctx.globalAlpha = 0.45;
        ctx.drawImage(FX.pool, LIGHTS[i] - R, LIGHTS[i + 1] - R * 0.5, R * 2, R);
      }
      // the main character's glow on the ground
      const p = game.player;
      ctx.globalAlpha = 0.32;
      ctx.drawImage(FX.pool, p.x - 20, p.y - 8, 40, 16);
      for (const o of game.orbitals) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(FX.pool, o.x - 14, o.y + 4 - 6, 28, 12);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o) {
      let rx, ry;
      if (o.kind === 'player') { rx = 8; ry = 2.8; }
      else if (o.kind === 'enemy') {
        if (o.dying) return;
        const sp = o.spawnT < 1 ? U.smoothstep(0.1, 0.8, o.spawnT) : 1;
        if (o.type === 'ghost') { rx = 5 * sp; ry = 1.8 * sp; } else { rx = o.r * 1.0 * sp; ry = rx * 0.34; }
        if (rx < 0.5) return;
      } else if (o.kind === 'prop') {
        if (!o.sh) return;
        rx = o.sh[0]; ry = o.sh[1];
      } else return;
      // one light from the upper left: shadows fall a little to the lower right
      ctx.globalAlpha = o.type === 'ghost' ? 0.35 : 0.62;
      ctx.drawImage(FX.shadow, o.x - rx + rx * 0.12, o.y - ry + ry * 0.25, rx * 2, ry * 2);
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      const big = g.big;
      const pop = g.pop > 0 ? 1 + Math.sin(g.pop * Math.PI) * 0.7 : 1;
      const t = view.rt * (big ? 2.2 : 2.8) + g.seed * 20;
      const bob = (Math.sin(t) + 0.3 * Math.sin(2 * t + 0.8)) * (big ? 0.9 : 0.5) - 0.6;
      const tw = Math.pow(0.5 + 0.5 * Math.sin(view.rt * 4.3 + g.seed * 41), 3);
      const R = (big ? 9 : 5.5) * pop * (0.9 + 0.2 * tw);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45 + 0.25 * tw;
      rotDraw(ctx, big ? FX.halo.cool : FX.halo.small, g.x, g.y - (big ? 4 : 2.6) + bob, view.rt * 1.1 + g.seed * 9, R * 2, R * 2);
      resetT(ctx);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const s = (big ? SPR.gemBig : SPR.gem)[g.seed < 0.5 ? 0 : 1];
      if (big) blit(ctx, s, g.x, g.y + bob, false, pop);
      else {
        const sc = pop * (0.94 + 0.12 * tw);
        rotDraw(ctx, s.c, g.x, g.y + bob - 2.6 * sc, Math.sin(view.rt * 1.3 + g.seed * 7) * 0.25, s.w * sc, s.h * sc);
        resetT(ctx);
      }
    },

    drawEnemy(ctx, e, view) {
      const sets = SPR[e.type];
      if (!sets) return;
      const ghost = e.type === 'ghost', colossus = e.type === 'colossus';
      const vi = e.type === 'creeper' ? Math.min(2, ((e.seed || 0) * 3) | 0) : 0;
      const frames = sets[vi];
      const sc = 0.92 + (e.seed || 0) * 0.16;
      const rt = view.rt, ph = (e.seed || 0) * 17.3;
      const flip = e.facing < 0;
      let y = e.y, rot = 0, sx = 1, sy = 1, fi;
      if (ghost) {
        // eased hover (quick rise, slow sink – not a plain sine); the lean into the flight is baked into the frames
        const t = rt * 2.4 + ph;
        y += -2.6 + (Math.sin(t) + 0.35 * Math.sin(2 * t + 1.1)) * 1.1;
        fi = Math.floor(rt * 9 + ph) % 6;
      } else fi = Math.floor((e.anim || 0) * (colossus ? 3.6 : 3.3)) % 6;
      const fr = frames[fi];
      if (e.dying) { enemyDeath(ctx, e, fr, vi, e.x, y, flip, sc); return; }
      if (e.spawnT < 1) { enemySpawn(ctx, e, fr, e.x, y, flip, sc, rt); return; }
      // hit: a sharp squash and a lean back for ~150 ms, with a pale flash on top
      let k = 0;
      if (e.hitT !== undefined && e.hitT < 0.15) { k = 1 - e.hitT / 0.15; k *= k; }
      sx += 0.17 * k; sy -= 0.15 * k;
      rot += (flip ? 0.2 : -0.2) * k;
      ctx.globalAlpha = ghost ? 0.92 : 1;
      blitX(ctx, fr, e.x, y, flip, sc, sx, sy, rot);
      if (e.flash > 0) {
        ctx.globalAlpha = Math.min(0.9, Math.pow(e.flash, 1.5) * 0.9);
        blitX(ctx, fr, e.x, y, flip, sc, sx, sy, rot, flashOf(fr, flip));
      }
      ctx.globalAlpha = 1;
      if (colossus) {
        // stomp: dust dabs at the feet on the contact poses, pulsing light in the cracks
        if (fi === 1 || fi === 4) {
          const fx = e.x + (fi === 1 ? -1 : 1) * 7 * sc;
          ctx.globalAlpha = 0.7;
          for (let i = 0; i < 3; i++) rotDraw(ctx, FX.dab.umber[i], fx + (i - 1) * 4.5, e.y - 0.5 + (i & 1), (i - 1) * 0.5, 5, 2);
          resetT(ctx);
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.26 + 0.14 * Math.sin(rt * 4 + ph);
        const gx = e.x + (flip ? -2.2 : 2.2) * sc, gy = y - 28 * sc * sy;
        ctx.drawImage(FX.glow, gx - 12, gy - 12, 24, 24);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    },

    drawPlayer(ctx, p, view) {
      const rt = view.rt, J = SPR.jack;
      let fr;
      if (p.dashT > 0) fr = J.dash[p.dashT > 0.165 ? 0 : 1];
      else if (p.hurtT > 0.55) fr = J.hurt[0];
      else if (p.moving) fr = J.walk[Math.floor(p.anim * 1.25) & 7];
      else fr = J.idle[Math.floor(rt * 2.5) & 3];
      const flip = p.facing < 0, fs = flip ? -1 : 1;
      const x = p.x, y = p.y;
      const hx = x + fr.face[0] * fs, hy = y + fr.face[1];
      // one swirling halo of light strokes around the glowing head
      ctx.globalCompositeOperation = 'lighter';
      const hp = 0.85 + 0.15 * Math.sin(rt * 2.2);
      ctx.globalAlpha = 0.42 * hp;
      rotDraw(ctx, FX.halo.gold, hx, hy, rt * 0.5, 40, 40);
      resetT(ctx);
      if (p.levelT > 0) {
        const R = 14 + (1 - p.levelT) * 40;
        ctx.globalAlpha = p.levelT * 0.9;
        rotDraw(ctx, FX.swirl.gold, x, y - 2, rt * 3, R * 2, R * 2, 0.6);
        resetT(ctx);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      // scarf tail behind the body – a spring that lags the motion
      drawScarf(ctx, fr, x, y, fs, scarfAngle(p, rt), rt, p.moving || p.dashT > 0);
      if (p.dashT > 0) {
        for (let i = 2; i >= 1; i--) {
          ctx.globalAlpha = 0.22 / i;
          blit(ctx, fr, x - p.dashX * 7 * i, y - p.dashY * 7 * i, flip);
        }
      }
      let a = 1;
      if (p.iframes > 0 && p.hurtT < 0.7 && Math.floor(rt * 16) % 2 === 0) a = 0.5;
      ctx.globalAlpha = a;
      blit(ctx, fr, x, y, flip);
      if (p.hurtT > 0.4) {
        ctx.globalAlpha = Math.min(0.8, (p.hurtT - 0.4) * 2.2);
        blit(ctx, fr, x, y, flip, 1, tintOf(fr, flip, 'hr', '#ffb070'));
      }
      // candle flicker inside the carved face, on its own uneven clock
      ctx.globalCompositeOperation = 'lighter';
      const fl = 0.3 + 0.08 * Math.sin(rt * 11) + 0.05 * Math.sin(rt * 23 + 1.3) - (U.fract(rt * 0.31) < 0.05 ? 0.12 : 0);
      ctx.globalAlpha = fl * a;
      ctx.drawImage(FX.glow, hx - 8, hy - 7, 16, 14);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const rt = view.rt;
      const bob = Math.sin(rt * 3 + o.idx * 1.7) * 1.1;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.48 + 0.1 * Math.sin(rt * 9 + o.idx * 3);
      rotDraw(ctx, FX.halo.gold, o.x, o.y - 5 + bob, rt * 0.9 + o.idx, 26, 26);
      resetT(ctx);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      // the lantern hangs from its handle and swings behind the orbit (pendulum lag)
      const sw = Math.sin(o.angle + 0.9) * 0.3 + Math.sin(rt * 5.3 + o.idx) * 0.06;
      const s = SPR.lantern[(Math.floor(rt * 5) + o.idx) % 3];
      rotDrawA(ctx, s.c, o.x, o.y + 2 + bob - 13.6, sw, s.w, s.h, s.ax, s.ay - 13.6);
      resetT(ctx);
    },

    drawProjectile(ctx, pr) {
      const fade = Math.min(1, pr.life * 6), grow = Math.min(1, pr.age * 8);
      const ca = Math.cos(pr.angle), sa = Math.sin(pr.angle);
      const L = 8 + 10 * grow;
      ctx.globalAlpha = fade * 0.95;
      rotDraw(ctx, FX.trail, pr.x - ca * L * 0.5, pr.y - sa * L * 0.5, pr.angle, L, 3.6);
      resetT(ctx);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45 * fade;
      ctx.drawImage(FX.glow, pr.x - 4.5, pr.y - 4.5, 9, 9);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = fade;
      const s = SPR.seed[pr.seed < 0.5 ? 0 : 1];
      rotDraw(ctx, s.c, pr.x, pr.y, pr.angle + pr.spin * 0.3, s.w, s.h);
      resetT(ctx);
      ctx.globalAlpha = 1;
    },

    drawParticle(ctx, pt) {
      const life = pt.life / pt.max, age = 1 - life;
      switch (pt.kind) {
        case 'swirl': {
          const big = pt.size > 24;
          paintSwirl(ctx, pt.x, pt.y, pt.size, age, pt.rot, pt.col, big ? 3 : 2, big ? 10 : 7, 0.6, pt.hole);
          break;
        }
        case 'sstar': {
          // a star flung out along a swirl arm: spiral path, staggered release, twinkles out
          const t = clamp01((age - pt.dl) / (1 - pt.dl));
          if (t <= 0) break;
          const et = easeOut(t), a = pt.rot + et * 2.4;
          const rr = 5 + et * pt.size * 4.4;
          const sz = pt.size * (0.45 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.25))) * (1 - t * 0.35);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - t * t;
          rotDraw(ctx, FX.star, pt.x + Math.cos(a) * rr, pt.y - 9 + Math.sin(a) * rr * 0.6 - et * 9, a * 1.5, sz, sz);
          resetT(ctx);
          ctx.globalCompositeOperation = 'source-over';
          break;
        }
        case 'ring': {
          const e = easeOut(Math.min(1, age * 1.2));
          const R = pt.size * (pt.inv ? 1 - 0.75 * e : 0.3 + 0.7 * e);
          ctx.globalAlpha = Math.pow(1 - age, 1.5) * 0.95;
          rotDraw(ctx, FX.ring[pt.col] || FX.ring.gold, pt.x, pt.y - pt.z, pt.rot + age * 1.6, R * 2, R * 2, 0.7);
          resetT(ctx);
          break;
        }
        case 'star': {
          const s = pt.size * (0.6 + 0.4 * Math.sin(life * Math.PI));
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = Math.min(1, life * 2.5);
          rotDraw(ctx, FX.star, pt.x, pt.y - pt.z, pt.rot, s, s);
          resetT(ctx);
          ctx.globalCompositeOperation = 'source-over';
          break;
        }
        case 'flick': {
          const sp = hyp(pt.vx, pt.vy);
          const a = sp > 1 ? Math.atan2(pt.vy, pt.vx) : pt.rot;
          const L = pt.size * (3 + Math.min(4, sp * 0.04)) * (0.5 + 0.5 * life);
          ctx.globalAlpha = Math.min(1, life * 3);
          rotDraw(ctx, FX.flick[pt.col] || FX.flick.yellow, pt.x, pt.y - pt.z, a, L * 2.2, pt.size * 1.5);
          resetT(ctx);
          break;
        }
        case 'smear': {
          ctx.globalAlpha = life * 0.8;
          rotDraw(ctx, FX.smear, pt.x, pt.y - pt.z, pt.rot, 30, 12);
          resetT(ctx);
          break;
        }
        case 'stain': {
          const set = SPR.puddle[pt.ptype];
          if (!set) break;
          const s = set[pt.v || 0] || set[0];
          ctx.globalAlpha = Math.pow(life, 0.7) * 0.7;
          blit(ctx, s, pt.x, pt.y, false, pt.size * (1.05 + 0.1 * Math.min(1, age * 4)));
          break;
        }
        case 'dab': {
          const set = FX.dab[pt.col] || FX.dab.yellow;
          const s = pt.size;
          const onGround = pt.z <= 0.3;
          ctx.globalAlpha = onGround ? Math.min(1, life * 3) * 0.9 : 1;
          rotDraw(ctx, set[pt.v || 0], pt.x, pt.y - pt.z, onGround ? pt.seed * 6 : pt.rot, s * 2.4, s, onGround ? 0.6 : 1);
          resetT(ctx);
          break;
        }
        default: {
          const set = FX.dab[pt.col] || FX.dab.white;
          ctx.globalAlpha = Math.min(1, life * 2);
          rotDraw(ctx, set[0], pt.x, pt.y - pt.z, pt.rot, pt.size * 2.2, pt.size);
          resetT(ctx);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n) {
      const life = n.life / n.max, age = 1 - life;
      const pop = age < 0.12 ? 0.55 + (age / 0.12) * 0.65 : 1.2 - Math.min(0.2, (age - 0.12) * 0.5);
      ctx.save();
      ctx.translate(n.x, n.y - age * 6);
      ctx.rotate((n.seed - 0.5) * 0.3);
      ctx.scale(pop, pop);
      ctx.globalAlpha = Math.min(1, life * 2.6);
      ctx.font = n.crit ? '400 17px "Caveat Brush", "Segoe Print", cursive' : '400 12px "Caveat Brush", "Segoe Print", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const txt = String(n.value);
      ctx.lineJoin = 'round';
      ctx.lineWidth = n.crit ? 3.6 : 2.8;
      ctx.strokeStyle = '#121838';
      ctx.strokeText(txt, 0, 0);
      ctx.fillStyle = n.crit ? '#f6602a' : '#f6c43a';
      ctx.fillText(txt, 0, 0);
      ctx.globalAlpha *= 0.75;
      ctx.fillStyle = n.crit ? '#ffd27a' : '#fff4c0';
      ctx.fillText(txt, -0.35, -0.45);
      ctx.restore();
      ctx.globalAlpha = 1;
    },

    drawWorldOverlay(ctx, view) {
      const rt = view.rt;
      // the wind made visible: a few long translucent strokes drift with it, each on its own slow clock
      const wc = 300, wa = -0.45, wx = Math.cos(wa), wy = Math.sin(wa);
      let x0 = Math.floor(view.x0 / wc) - 1, x1 = Math.floor(view.x1 / wc) + 1, y0 = Math.floor(view.y0 / wc), y1 = Math.floor(view.y1 / wc);
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = U.hashInt(cx, cy, 991);
          if ((h & 3) !== 0) continue;
          const per = 7 + (h & 7) * 0.7, tt = U.fract(rt / per + ((h >>> 8) & 255) / 255);
          const env = Math.sin(Math.PI * tt);
          const bx = (cx + ((h >>> 4) & 255) / 255) * wc, by = (cy + ((h >>> 12) & 255) / 255) * wc;
          const d = (tt - 0.5) * 70;
          ctx.globalAlpha = 0.2 * env * env;
          rotDraw(ctx, FX.wind, bx + wx * d, by + wy * d, wa + Math.sin(rt * 0.4 + (h & 15)) * 0.12, 64, 10);
        }
      }
      resetT(ctx);
      // fireflies – sparse, slow, twinkling on varied timings
      const cell = 170;
      x0 = Math.floor(view.x0 / cell); x1 = Math.floor(view.x1 / cell); y0 = Math.floor(view.y0 / cell); y1 = Math.floor(view.y1 / cell);
      ctx.globalCompositeOperation = 'lighter';
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = U.hashInt(cx, cy, 777);
          if ((h & 1) === 0) continue;
          const fx = (cx + ((h >>> 4) & 255) / 255) * cell + Math.sin(rt * 0.45 + (h & 15)) * 16;
          const fy = (cy + ((h >>> 12) & 255) / 255) * cell + Math.sin(rt * 0.33 + ((h >>> 20) & 15)) * 11;
          const tw = Math.pow(0.5 + 0.5 * Math.sin(rt * (1.7 + (h & 7) * 0.2) + (h & 63)), 2);
          ctx.globalAlpha = 0.15 + 0.5 * tw;
          rotDraw(ctx, FX.halo.small, fx, fy, rt + (h & 7), 6 + tw * 3, 6 + tw * 3);
        }
      }
      resetT(ctx);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view, game) {
      if (!OVL || OVL.W !== view.W || OVL.H !== view.H) buildOverlay(view.W, view.H);
      drawStrips(ctx, OVL.page, OVL.W, OVL.H, OVL.band);
      const ht = game.player.hurtT;
      if (ht > 0) {
        ctx.globalAlpha = Math.min(1, ht * 1.3);
        drawStrips(ctx, OVL.hurt, OVL.W, OVL.H, OVL.band);
        ctx.globalAlpha = 1;
      }
    },

    drawIcon(ctx, id, size) {
      ctx.scale(size / 100, size / 100);
      paintIcon(ctx, id, size >= 90);
    },

    /* ---------- hooks: layered effects – core flash, main shape, debris, lingering residue ---------- */
    onHit(game, e, src) {
      const h = (HEIGHT[e.type] || 22) * 0.5;
      const cols = COLS[e.type] || COLS.creeper;
      let dx = e.kx || 0, dy = e.ky || 0;
      const dl = hyp(dx, dy);
      if (dl > 1) { dx /= dl; dy /= dl; } else { const a = Math.random() * TAU; dx = Math.cos(a); dy = Math.sin(a); }
      const base = Math.atan2(dy, dx);
      game.addParticle({ x: e.x, y: e.y - h, z: 0, kind: 'star', life: 0.12, size: e.type === 'colossus' ? 13 : 9, drag: 0, rot: Math.random() * TAU, vr: 0 });
      for (let i = 0; i < 2; i++) {
        const a = base + (i ? 0.45 : -0.35) + (Math.random() - 0.5) * 0.3, s = 90 + Math.random() * 50;
        game.addParticle({ x: e.x + dx * 3, y: e.y - h + dy * 2, z: 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, kind: 'flick', col: i === 0 ? (src === 'lantern' ? 'orange' : 'yellow') : cols[0], life: 0.22, size: 1.6, drag: 7, rot: a });
      }
      for (let i = 0; i < 3; i++) {
        const a = base + (Math.random() - 0.5) * 1.6, s = 30 + Math.random() * 45;
        game.addParticle({ x: e.x, y: e.y, z: h, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 20 + Math.random() * 40, grav: 240, kind: 'dab', col: cols[(Math.random() * cols.length) | 0], life: 0.6 + Math.random() * 0.4, size: 1.2 + Math.random() * 0.9, drag: 1.5, rot: a, vr: (Math.random() - 0.5) * 12, v: (Math.random() * 3) | 0 });
      }
    },
    onKill(game, e) {
      const h = (HEIGHT[e.type] || 22) * 0.5;
      const big = e.type === 'colossus';
      const cols = COLS[e.type] || COLS.creeper;
      game.addParticle({ x: e.x, y: e.y - h, z: 0, kind: 'star', life: 0.12, size: big ? 18 : 11, drag: 0, rot: Math.random() * TAU });
      game.addParticle({ x: e.x, y: e.y - h * 0.6, z: 0, kind: 'ring', col: e.type === 'ghost' ? 'cool' : big ? 'gold' : 'violet', life: 0.34, size: big ? 30 : 16, drag: 0, rot: Math.random() * TAU });
      game.addParticle({ x: e.x, y: e.y - h * 0.4, kind: 'swirl', col: e.type, life: big ? 0.8 : 0.5, size: big ? 28 : 13, drag: 0, rot: Math.random() * TAU });
      dabBurst(game, e.x, e.y, h, big ? 20 : 9, cols, big ? 110 : 75, big ? 2.6 : 1.8);
      if (e.type !== 'ghost' && SPR.puddle[e.type]) {
        game.addParticle({ x: e.x, y: e.y + 1, z: 0, kind: 'stain', ptype: e.type, v: e.type === 'creeper' ? Math.min(2, ((e.seed || 0) * 3) | 0) : 0, life: big ? 1.8 : 1.3, size: 0.92 + (e.seed || 0.5) * 0.16, drag: 0, rot: 0 });
      }
    },
    onHurt(game, p) {
      dabBurst(game, p.x, p.y, 14, 8, ['red', 'orange', 'yellow', 'blue'], 70, 1.8);
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'star', life: 0.18, size: 16, drag: 0, rot: Math.random() * TAU });
      game.addParticle({ x: p.x, y: p.y - 10, z: 0, kind: 'ring', col: 'red', life: 0.3, size: 18, drag: 0, rot: Math.random() * TAU });
    },
    onPickup(game, g) {
      const n = g.big ? 5 : 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.random() * 0.6;
        game.addParticle({ x: g.x + Math.cos(a) * 3, y: g.y + Math.sin(a) * 2, z: 4 + Math.random() * 4, vx: -Math.sin(a) * 30, vy: Math.cos(a) * 18, vz: 22, kind: 'star', life: 0.32 + Math.random() * 0.2, size: g.big ? 8 : 5.5, drag: 3, rot: Math.random(), vr: 3 });
      }
      game.addParticle({ x: g.x, y: g.y - 3, z: 0, kind: 'ring', col: g.big ? 'cool' : 'gold', inv: true, life: 0.28, size: g.big ? 13 : 9, drag: 0, rot: Math.random() * TAU });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.5) {
        game.addParticle({ x: pr.x, y: pr.y, z: 0, vx: pr.vx * 0.25, vy: pr.vy * 0.25, kind: 'flick', col: 'orange', life: 0.14, size: 1.1, drag: 9, rot: pr.angle });
      }
    },
    onDash(game, p) {
      // a puff of paint at the feet (the push-off), then the smear of the lunge
      for (let i = 0; i < 4; i++) {
        const a = Math.atan2(-p.dashY, -p.dashX) + (Math.random() - 0.5) * 1.6;
        game.addParticle({ x: p.x, y: p.y, z: 1, vx: Math.cos(a) * (25 + Math.random() * 25), vy: Math.sin(a) * 14, vz: 18, grav: 120, kind: 'dab', col: i & 1 ? 'umber' : 'blue', life: 0.5, size: 1.4, drag: 4, rot: a, v: i % 3 });
      }
      game.addParticle({ x: p.x - p.dashX * 4, y: p.y, z: 12, kind: 'smear', life: 0.35, size: 1, drag: 0, rot: Math.atan2(p.dashY, p.dashX), vr: 0 });
      for (let i = 0; i < 3; i++) game.addParticle({ x: p.x, y: p.y, z: 0, vx: -p.dashX * (20 + Math.random() * 30) + (Math.random() - 0.5) * 20, vy: -p.dashY * 20 + (Math.random() - 0.5) * 14, kind: 'dab', col: i & 1 ? 'blue' : 'turq', life: 0.8, size: 1.5, drag: 4, rot: Math.atan2(p.dashY, p.dashX), v: i % 3 });
    },
    onLevelUp(game, p) {
      const a0 = Math.random() * TAU;
      game.addParticle({ x: p.x, y: p.y + 1, kind: 'swirl', col: 'gold', life: 1.0, size: 32, drag: 0, rot: a0, hole: 11 });
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'star', life: 0.16, size: 22, drag: 0, rot: Math.random() * TAU });
      for (let i = 0; i < 9; i++) game.addParticle({ x: p.x, y: p.y, z: 0, kind: 'sstar', life: 1.0, size: 5 + (i % 3) * 1.7, drag: 0, rot: a0 + (i % 3) * (TAU / 3) + Math.floor(i / 3) * 0.55, dl: (i / 9) * 0.36 });
    },
    onDeath(game, p) {
      dabBurst(game, p.x, p.y, 16, 26, ['orange', 'yellow', 'blue', 'red', 'gold'], 110, 2.4);
      game.addParticle({ x: p.x, y: p.y, kind: 'swirl', col: 'gold', life: 1.6, size: 50, drag: 0, rot: 0 });
    },
  });
})();
