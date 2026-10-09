/* Style "Sternennacht" – a living post-impressionist oil painting at night (Van Gogh: The Starry Night,
   Café Terrace at Night). Everything is built from short, thick, directional impasto brush strokes:
   - ground: thousands of pre-rendered stroke sprites laid along swirling flow fields over a dark under-painting
   - characters / props: painted stroke by stroke into offscreen canvases at init (several "breathing" variants)
   - light: swirling concentric halos of strokes around Jack, lanterns, windows and gems (additive)
   - HUD: museum look – gilded frames, painted brush-stroke bars, framed little paintings as level-up cards. */
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
    ctx.strokeStyle = rgb(U.mul(col, 0.58), 0.75);
    ctx.stroke();
    // bristle groove
    const v1 = (r.next() - 0.5) * hw * 0.9;
    ctx.beginPath();
    ctx.moveTo(-hl * 0.55, v1);
    ctx.quadraticCurveTo(hl * 0.2, v1 * 0.8 + b * 0.9, hl * 0.95, b * 0.12 + v1 * 0.3);
    ctx.lineWidth = Math.max(0.05, wid * 0.08);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = rgb(U.mul(col, 0.7), 0.55);
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
    return { c: gpuc(c), f: null, w: wu, h: hu, ax, ay };
  }
  function withFlip(s) { s.f = U.flipX(s.c); return s; }
  function blit(ctx, s, x, y, flip, sc, img) {
    sc = sc || 1;
    const im = img || (flip ? s.f || s.c : s.c);
    const ax = flip ? s.w - s.ax : s.ax;
    ctx.drawImage(im, x - ax * sc, y - s.ay * sc, s.w * sc, s.h * sc);
  }
  function flashOf(s, flip) {
    if (!s.fl) {
      s.fl = U.tint(s.c, '#ffc84a', 1);
      s.flf = U.flipX(s.fl);
    }
    return flip ? s.flf : s.fl;
  }

  /* ======================================================================
     2. Ground – fields, flow and stroke atlas
     ====================================================================== */
  const MATS = [
    { L: 9, W: 2.5, bend: 0.55, pal: ['#3c2e18', '#54421e', '#6c5624', '#866c2a', '#a08232', '#bc9a3e'], acc: ['#2e3e70', '#a65e28', '#4e5a28'], under: [46, 34, 20], pB: 0.75, acP: 0.14 },
    { L: 8, W: 2.7, bend: 0.45, pal: ['#1a3430', '#23463c', '#2e5944', '#3c6a48', '#527e4a', '#70944e'], acc: ['#2e4a86', '#8a8a3a', '#3a6a7a'], under: [17, 32, 28], pB: 0.62, acP: 0.12 },
    { L: 11, W: 2.5, bend: 0.22, pal: ['#1c1e44', '#262a5a', '#31356c', '#3d4180', '#4c4f94', '#6264a8'], acc: ['#6a4f8e', '#2c4f72', '#7a6a5a'], under: [17, 17, 40], pB: 0.55, acP: 0.12 },
    { L: 6.5, W: 2.6, bend: 0.45, pal: ['#08120f', '#0e1d18', '#142a20', '#1b3828', '#24462f', '#305639'], acc: ['#1a2650', '#3a4a24', '#0e2a36'], under: [6, 11, 10], pB: 0.4, acP: 0.14 },
    { L: 10, W: 2.5, bend: 0.62, pal: ['#10244e', '#163268', '#1d4384', '#26579c', '#3270ae', '#4a8fbc'], acc: ['#78c0c0', '#c6d2a0', '#e8c850'], under: [10, 21, 50], pB: 0.72, acP: 0.13 },
  ];
  const GOLD_STROKES = ['#d08a26', '#eeb63a', '#ffd862', '#fff0a8'];
  // all ground strokes live on one CPU sprite sheet (the chunk is painted on a CPU canvas too)
  const ATLAS = { mats: [], gold: [], flower: [], sheet: null };
  let SHX = 0, SHY = 0, SHROW = 0;
  function atlasSprite(L, W, bend, col, seed) {
    const r = U.rng(seed);
    const w = Math.ceil((L + W * 2) * KG), h = Math.ceil((W * 2.2 + L * Math.abs(bend) * 0.5 + 1) * KG);
    if (SHX + w > 1024) { SHX = 0; SHY += SHROW + 1; SHROW = 0; }
    const ctx = ATLAS.sheet.ctx;
    ctx.save();
    ctx.translate(SHX + w / 2, SHY + h / 2);
    ctx.scale(KG, KG);
    stroke(ctx, 0, 0, 0, L, W, col, r, { bend: (r.next() - 0.5) * bend });
    ctx.restore();
    const spr = { sx: SHX, sy: SHY, w, h, cx: w / 2, cy: h / 2 };
    SHX += w + 1;
    SHROW = Math.max(SHROW, h);
    return spr;
  }
  function buildAtlas() {
    let sd = 100;
    ATLAS.sheet = cv(1024, 320);
    SHX = SHY = SHROW = 0;
    for (const m of MATS) {
      const set = { pal: [], acc: [] };
      for (const h of m.pal) set.pal.push([0, 1, 2].map(() => atlasSprite(m.L, m.W, m.bend, H(h), sd++)));
      for (const h of m.acc) set.acc.push([0, 1, 2].map(() => atlasSprite(m.L, m.W, m.bend, H(h), sd++)));
      ATLAS.mats.push(set);
    }
    ATLAS.gold = GOLD_STROKES.map((h) => [0, 1].map(() => atlasSprite(6, 2.2, 0.3, H(h), sd++)));
    ATLAS.flower = ['#f4efd8', '#ffd84a', '#7aa8e8', '#e0582a', '#c8a0e0'].map((h) => [0, 1].map(() => atlasSprite(3, 2, 0.5, H(h), sd++)));
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
    for (const m of ATLAS.mats) { for (const g of m.pal) all.push(...g); for (const g of m.acc) all.push(...g); }
    for (const g of ATLAS.gold) all.push(...g);
    for (const g of ATLAS.flower) all.push(...g);
    all.forEach(trim);
  }

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
  /** material weights w[0..4] = wheat, meadow, path, forest, pond; v (optional) = flow vectors + macro */
  function fieldAt(x, y, w, v) {
    const F = U.warped(x / 760, y / 760, 11, 1.0, 3);
    const P = U.warped(x / 640 + 31.7, y / 640 - 12.3, 23, 0.55, 3);
    const Wn = U.fbm(x / 470 - 7.1, y / 470 + 3.9, 31, 3);
    const sp = x * x + y * y;
    const pond = U.smoothstep(0.322, 0.306, P) * U.smoothstep(150 * 150, 300 * 300, sp);
    const forest = U.smoothstep(0.59, 0.61, F) * (1 - pond);
    const wheat = U.smoothstep(0.482, 0.518, Wn) * Math.max(0, 1 - forest - pond);
    const meadow = Math.max(0, 1 - forest - pond - wheat);
    pathInfo(x, y, PI_);
    const path = (1 - U.smoothstep(9, 15, PI_.d)) * (1 - pond);
    const k = 1 - path;
    w[0] = wheat * k; w[1] = meadow * k; w[2] = path; w[3] = forest * k; w[4] = pond;
    if (v) {
      const s1 = 1 / 120, e = 2;
      let n = U.fbm(x * s1, y * s1, 51, 2);
      let gx = U.fbm((x + e) * s1, y * s1, 51, 2) - n, gy = U.fbm(x * s1, (y + e) * s1, 51, 2) - n;
      let gm = hyp(gx, gy) + 1e-9;
      v[0] = -gy / gm; v[1] = gx / gm;
      const s2 = 1 / 52;
      n = U.fbm(x * s2, y * s2, 52, 2);
      gx = U.fbm((x + e) * s2, y * s2, 52, 2) - n; gy = U.fbm(x * s2, (y + e) * s2, 52, 2) - n;
      gm = hyp(gx, gy) + 1e-9;
      v[2] = -gy / gm; v[3] = gx / gm;
      v[4] = PI_.tx; v[5] = PI_.ty;
      v[6] = U.fbm(x / 250, y / 250, 61, 2);
    }
  }
  const WT = new Float32Array(5);
  function matAt(x, y) {
    fieldAt(x, y, WT);
    let best = 0;
    for (let i = 1; i < 5; i++) if (WT[i] > WT[best]) best = i;
    return best;
  }

  const GS = 5, GMARGIN = 20, NV = 7;
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
      buf = { key, busy: false, img: ctx.createImageData(PX, PX), Wg: new Float32Array(nx * ny * 5), Vg: new Float32Array(nx * ny * NV), Cg: new Float32Array(nx * ny * 3) };
      if (POOL.length < 4) POOL.push(buf);
    }
    buf.busy = true;
    buf.t0 = now;
    const { Wg, Vg, Cg } = buf;
    const w = new Float32Array(5), v = new Float32Array(NV);
    for (let j = 0; j < ny; j++) {
      if ((j & 1) === 1) yield;
      for (let i = 0; i < nx; i++) {
        const x = (gx0 + i) * GS, y = (gy0 + j) * GS;
        fieldAt(x, y, w, v);
        const o = j * nx + i;
        for (let k = 0; k < 5; k++) Wg[o * 5 + k] = w[k];
        for (let k = 0; k < NV; k++) Vg[o * NV + k] = v[k];
        let R = 0, Gc = 0, B = 0;
        for (let k = 0; k < 5; k++) { const u = MATS[k].under; R += u[0] * w[k]; Gc += u[1] * w[k]; B += u[2] * w[k]; }
        const m = 0.8 + v[6] * 0.45;
        Cg[o * 3] = R * m; Cg[o * 3 + 1] = Gc * m; Cg[o * 3 + 2] = B * m;
      }
    }
    // dark under-painting with canvas weave
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
      const gy = gpy0 + py, rowEdge = (gy & 3) === 0 || (gy & 3) === 3;
      let o = py * PX * 4;
      for (let px = 0; px < PX; px++, o += 4) {
        const i = colI[px], t = colT[px];
        const gx = gpx0 + px;
        const wv = ((gx >> 2) + (gy >> 2)) & 1 ? ((gx & 3) === 0 || (gx & 3) === 3 ? 0.87 : 1) : (rowEdge ? 0.87 : 1);
        D[o] = (rowC[i] + (rowC[i + 3] - rowC[i]) * t) * wv;
        D[o + 1] = (rowC[i + 1] + (rowC[i + 4] - rowC[i + 1]) * t) * wv;
        D[o + 2] = (rowC[i + 2] + (rowC[i + 5] - rowC[i + 2]) * t) * wv;
        D[o + 3] = 255;
      }
    }

    const sw = new Float32Array(5), sv = new Float32Array(NV);
    const sample = (x, y) => {
      const fx = x / GS - gx0, fy = y / GS - gy0;
      const i0 = Math.min(nx - 2, Math.max(0, fx | 0)), j0 = Math.min(ny - 2, Math.max(0, fy | 0));
      const tx = fx - i0, ty = fy - j0;
      const o00 = j0 * nx + i0, o10 = o00 + 1, o01 = o00 + nx, o11 = o01 + 1;
      const a = (1 - tx) * (1 - ty), b = tx * (1 - ty), c = (1 - tx) * ty, d = tx * ty;
      for (let k = 0; k < 5; k++) sw[k] = Wg[o00 * 5 + k] * a + Wg[o10 * 5 + k] * b + Wg[o01 * 5 + k] * c + Wg[o11 * 5 + k] * d;
      for (let k = 0; k < NV; k++) sv[k] = Vg[o00 * NV + k] * a + Vg[o10 * NV + k] * b + Vg[o01 * NV + k] * c + Vg[o11 * NV + k] * d;
    };
    const kRes = res / KG;
    const draw = (spr, x, y, ang, sc) => splat(D, PX, spr, (x - wx) * res, (y - wy) * res, ang, kRes * sc);
    const flowAngle = (mat, r) => {
      let vx, vy;
      switch (mat) {
        case 0: vx = sv[0] * 0.5; vy = -1 + sv[1] * 0.5; break;
        case 1: vx = sv[0]; vy = sv[1]; break;
        case 2: vx = sv[4] + sv[0] * 0.22; vy = sv[5] + sv[1] * 0.22; break;
        case 3: vx = sv[2]; vy = sv[3]; break;
        default: vx = sv[2] * 0.85 + sv[0] * 0.3; vy = sv[3] * 0.85 + sv[1] * 0.3;
      }
      return Math.atan2(vy, vx) + (r.next() - 0.5) * 0.3;
    };
    const pickMat = (u) => {
      let acc = 0;
      for (let k = 0; k < 5; k++) { acc += sw[k]; if (u < acc) return k; }
      return 1;
    };
    let n = 0;
    const M = 9;
    for (let pass = 0; pass < 2; pass++) {
      const cell = pass === 0 ? 4.3 : 6.2, seed = pass === 0 ? 7001 : 7002;
      const cx0 = Math.floor((wx - M) / cell), cx1 = Math.floor((wx + size + M) / cell);
      const cy0 = Math.floor((wy - M) / cell), cy1 = Math.floor((wy + size + M) / cell);
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
          const r = RR.seed(U.hashInt(cx, cy, seed));
          const x = (cx + r.next()) * cell, y = (cy + r.next()) * cell;
          if (x < wx - M || x > wx + size + M || y < wy - M || y > wy + size + M) continue;
          sample(x, y);
          const mat = pickMat(r.next());
          const m = MATS[mat], set = ATLAS.mats[mat];
          if (pass === 1 && r.next() > m.pB) continue;
          const bias = (sv[6] - 0.5) * 3.2;
          let spr;
          if (pass === 1 && r.next() < m.acP) spr = set.acc[(r.next() * set.acc.length) | 0][(r.next() * 3) | 0];
          else {
            const idx = pass === 0 ? clamp(Math.floor(r.next() * 4 + bias - 0.4), 0, 5) : clamp(2 + Math.floor(r.next() * 3 + bias), 0, 5);
            spr = set.pal[idx][(r.next() * 3) | 0];
          }
          draw(spr, x, y, flowAngle(mat, r), (pass === 0 ? 1.12 : 1.0) * (0.8 + r.next() * 0.4));
          if (++n % 30 === 0) yield;
        }
      }
    }
    // decals painted on top: lamp reflections on the paths, wildflowers, wheat ears, starry whorls in the ponds
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
    yield* scat(26, 811, 10, (x, y, r) => {
      if (sw[2] < 0.7 || r.next() > 0.32) return;
      const ang = Math.atan2(sv[5], sv[4]);
      const nxp = -Math.sin(ang), nyp = Math.cos(ang);
      const cnt = 2 + r.int(0, 2);
      for (let i = 0; i < cnt; i++) {
        const t = i * 1.7 - cnt * 0.8;
        const spr = ATLAS.gold[clamp(i === 0 ? 2 : r.int(0, 2), 0, 3)][r.int(0, 1)];
        draw(spr, x + nxp * t + (r.next() - 0.5) * 2, y + nyp * t, ang + (r.next() - 0.5) * 0.2, 0.55 + r.next() * 0.35 - i * 0.06);
      }
    });
    yield* scat(12, 822, 4, (x, y, r) => {
      if (sw[1] < 0.6 || r.next() > 0.2) return;
      const f = ATLAS.flower[r.next() < 0.5 ? 0 : r.next() < 0.6 ? 1 : 2];
      const cnt = 2 + r.int(0, 1);
      for (let i = 0; i < cnt; i++) draw(f[r.int(0, 1)], x + (r.next() - 0.5) * 2, y + (r.next() - 0.5) * 1.6, r.next() * TAU, 0.5 + r.next() * 0.3);
    });
    yield* scat(9, 833, 6, (x, y, r) => {
      if (sw[0] < 0.65 || r.next() > 0.14) return;
      const spr = ATLAS.gold[r.int(0, 1)][r.int(0, 1)];
      draw(spr, x, y, -Math.PI / 2 + sv[0] * 0.5 + (r.next() - 0.5) * 0.4, 0.6 + r.next() * 0.4);
    });
    yield* scat(34, 844, 4, (x, y, r) => {
      if (sw[0] < 0.6 || r.next() > 0.18) return;
      for (let i = 0; i < 2; i++) draw(ATLAS.flower[3][i], x + i * 1.5, y + (r.next() - 0.5), r.next() * TAU, 0.6);
    });
    yield* scat(70, 855, 24, (x, y, r) => {
      if (sw[4] < 0.85 || r.next() > 0.7) return;
      // a Starry-Night whorl mirrored in the water
      const set = ATLAS.mats[4];
      const turns = 1.6 + r.next() * 0.8, cnt = 18 + r.int(0, 8), dir = r.next() < 0.5 ? 1 : -1, ph = r.next() * TAU;
      const R = 12 + r.next() * 8;
      for (let i = 0; i < cnt; i++) {
        const t = i / cnt;
        const a = ph + dir * t * turns * TAU, rr = 2 + t * R;
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.62;
        const tang = Math.atan2(Math.cos(a) * 0.62 * dir, -Math.sin(a) * dir);
        const spr = t < 0.3 ? ATLAS.gold[r.int(1, 3)][r.int(0, 1)] : set.acc[r.next() < 0.7 ? 0 : 1][r.int(0, 2)];
        draw(spr, px, py, tang, (t < 0.3 ? 0.55 : 0.7) + r.next() * 0.2);
      }
    });
    yield* scat(40, 866, 8, (x, y, r) => {
      if (sw[4] < 0.8 || r.next() > 0.35) return;
      // small star reflections
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + r.next();
        draw(ATLAS.gold[i === 0 ? 3 : r.int(1, 2)][r.int(0, 1)], x + Math.cos(a) * 2.6, y + Math.sin(a) * 1.6, a + Math.PI / 2, 0.45);
      }
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
     3. Characters
     ====================================================================== */
  const PRUSSIAN = H('#111733');
  const ORANGE = hexes(['#8e3a12', '#b8521a', '#d86c1e', '#ec8a28', '#f6aa3c', '#fcd06a']);
  const COAT = hexes(['#141d52', '#1d2c78', '#26409a', '#3157b4', '#4a76cc', '#7aa0e0']);
  const LEAF = hexes(['#163a2a', '#1f5a3a', '#2f7a4a', '#4a9a52', '#80bc5c']);
  const GLOWC = hexes(['#4a1206', '#ffb52e', '#ffe070', '#fff6c8']);

  function carved(ctx, P, r) {
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

  function drawJack(ctx, r, pose) {
    ctx.translate(0, pose.bob);
    const lg = pose.leg;
    // legs + boots
    for (const s of [-1, 1]) {
      const fx = s * 2.3 + s * lg * 1.9, fy = -0.6 - Math.max(0, s * lg) * 1.3;
      seg(ctx, s * 2.2, -5.5, fx, fy - 1, 2.5, H('#2b2238'), r);
      stroke(ctx, fx + 0.9, fy - 0.2, 0.05, 3.6, 2.0, H('#1e130e'), r, { hi: 0.25 });
    }
    // back arm
    seg(ctx, -4.2, -14, -6.2 - pose.arm * 1.5, -8.8, 2.4, COAT[1], r);
    // scarf tail (behind)
    seg(ctx, -3.5, -15.2, -8.4, -12.6 + pose.flut, 2.0, H('#c8341e'), r);
    seg(ctx, -7.6, -13, -10.4, -11.4 + pose.flut * 1.4, 1.7, H('#e8502a'), r);
    // coat
    const coat = spline([[-4.4, -15.6], [0, -16], [4.4, -15.6], [5.6, -10.5], [6.9, -4.6], [3.2, -3.5], [0, -4.0], [-3.2, -3.5], [-6.9, -4.6], [-5.6, -10.5]], 3);
    paint(ctx, coat, r, {
      base: COAT[1], sp: 1.55, len: 4.2, wid: 1.5, jit: 0.15,
      col: (x, y, rr) => rampPick(COAT, 2.2 - x * 0.28 + (rr.next() - 0.5) * 1.6),
      ang: (x) => -Math.PI / 2 + x * 0.07,
      edge: { col: PRUSSIAN, w: 1.0, l: 3 },
    });
    stroke(ctx, 1.1, -11.2, 0.3, 1.3, 1.1, H('#f0c040'), r, { hi: 0.5 });
    stroke(ctx, 1.3, -7.8, 0.3, 1.3, 1.1, H('#f0c040'), r, { hi: 0.5 });
    // scarf
    for (let i = 0; i < 4; i++) stroke(ctx, -3.8 + i * 2.5, -15.4 + Math.sin(i * 1.7) * 0.3, (r.next() - 0.5) * 0.4, 3.4, 2.1, i & 1 ? H('#e8502a') : H('#c8341e'), r);
    stroke(ctx, 0.5, -15.8, 0.1, 4, 1.0, H('#f6883a'), r, { hi: 0.4 });
    // front arm + hand
    const hx = 6.6 + pose.arm * 1.6, hy = -8.6;
    seg(ctx, 4.2, -14.2, hx, hy, 2.6, COAT[3], r);
    seg(ctx, 4.6, -13.6, hx - 0.4, hy - 0.4, 1.0, COAT[5], r, { a: 0.8 });
    stroke(ctx, hx + 0.3, hy + 0.6, 0.6, 1.8, 1.7, H('#e8cf9c'), r);
    // head – carved pumpkin, ribs follow the meridians
    const cx = 0.6, cy = -22.6, rx = 8.8, ry = 7.4;
    const head = [];
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * TAU;
      const k = 1 + 0.035 * Math.abs(Math.sin(a * 3.5)) + (r.next() - 0.5) * 0.02;
      head.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k * (Math.sin(a) > 0 ? 0.97 : 1)]);
    }
    const merid = (x, y) => {
      const dx = x - cx, dy = y - cy;
      const q = Math.sqrt(Math.max(0.06, 1 - (dy / ry) * (dy / ry)));
      const kk = dx / (rx * q);
      const slope = (-kk * rx * dy) / (ry * ry * q);
      return Math.atan2(1, slope);
    };
    paint(ctx, head, r, {
      base: ORANGE[2], sp: 1.3, len: 3.6, wid: 1.45, jit: 0.12,
      col: (x, y, rr) => {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        return rampPick(ORANGE, 2.6 - dx * 1.5 - dy * 1.3 + (rr.next() - 0.5) * 1.3);
      },
      ang: merid,
    });
    for (const kx of [-0.66, -0.24, 0.24, 0.66]) {
      const pts = [];
      for (let t = -0.82; t <= 0.83; t += 0.33) pts.push([cx + kx * rx * Math.sqrt(1 - t * t), cy + t * ry]);
      polyStroke(ctx, pts, 0.75, 2.4, U.mul(ORANGE[1], 0.85), r, { a: 0.85 });
    }
    contour(ctx, head, r, { col: PRUSSIAN, w: 1.1, l: 3.2 });
    // stem + leaf
    seg(ctx, cx + 0.3, cy - ry + 0.8, cx + 1.6, cy - ry - 2.8, 1.9, H('#4f6a26'), r);
    seg(ctx, cx + 0.6, cy - ry + 0.2, cx + 1.4, cy - ry - 2.2, 0.7, H('#9ab048'), r);
    stroke(ctx, cx - 1.6, cy - ry - 0.4, -0.5, 3.2, 1.4, H('#3f7a3a'), r);
    // face (looking to +x)
    const fx = cx + 1.9;
    carved(ctx, tri(fx - 2.9, cy - 1.6, 1.7, 1.25), r);
    carved(ctx, tri(fx + 2.9, cy - 1.6, 1.7, 1.25), r);
    carved(ctx, tri(fx, cy + 0.4, 0.65, 1), r);
    const m = [[-4.7, -0.2], [-3.4, 0.6], [-2.4, -0.2], [-1.2, 0.7], [0, -0.1], [1.2, 0.7], [2.4, -0.2], [3.4, 0.6], [4.7, -0.2], [3.8, 1.9], [1.6, 2.9], [-1.6, 2.9], [-3.8, 1.9]];
    carved(ctx, m.map((p) => [fx + p[0], cy + 2.4 + p[1]]), r);
  }

  const VIO = [hexes(['#34124c', '#55206f', '#763896', '#985ab6', '#c28cd8']), hexes(['#3e1040', '#661c5e', '#8a2e7c', '#ae5296', '#d488b8'])];
  const CREAM = [hexes(['#9c8656', '#c4ad78', '#e2d09a', '#f4e9c2', '#fffbe8']), hexes(['#a07a2a', '#c89e3e', '#e6c25a', '#f4dc8a', '#fff2c0'])];
  function drawCreeper(ctx, r, pose, v) {
    ctx.translate(0, pose.bob);
    for (const s of [-1, 1]) {
      const fx = s * 3 + s * pose.leg * 1.7, fy = -0.5 - Math.max(0, s * pose.leg) * 1.2;
      seg(ctx, s * 2.4, -4.6, fx, fy, 1.8, H('#a8865a'), r);
      stroke(ctx, fx + s * 0.8, fy, s * 0.2, 2.2, 1.2, H('#7a5a38'), r);
    }
    ctx.translate(0, -10);
    ctx.rotate(pose.tilt);
    ctx.translate(0, 10);
    const cx = 0, cy = -12.6, rx = 8.6, ry = 8.2;
    // leaves behind the bulb
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (-0.75 + i * 0.5) + pose.leaf * (i & 1 ? 1 : -0.6);
      const bx = cx + 0.3, by = cy - ry + 1.2;
      const L = 6.4 - Math.abs(i - 1.5) * 0.6;
      stroke(ctx, bx + Math.cos(a) * L * 0.55, by + Math.sin(a) * L * 0.55, a, L, 2.5, LEAF[1 + (i & 1)], r, { hi: 0.22 });
      stroke(ctx, bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5, a, L * 0.7, 0.8, LEAF[4], r, { a: 0.85 });
    }
    const body = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU, s = Math.sin(a);
      const kx = s > 0 ? 1 - 0.38 * s * s : 1, ky = s > 0 ? 1 + 0.3 * s * s * s : 1;
      body.push([cx + Math.cos(a) * rx * kx, cy + s * ry * ky]);
    }
    const V = VIO[v], C = CREAM[v];
    paint(ctx, body, r, {
      base: V[1], sp: 1.25, len: 3.4, wid: 1.4, jit: 0.15,
      col: (x, y, rr) => {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        const t = (dy + 1) / 2, b = 0.5 + 0.08 * Math.sin(x * 0.9 + v * 2);
        const l = -dx * 1.4 - dy * 0.6;
        return t + (rr.next() - 0.5) * 0.2 < b ? rampPick(V, 2.1 + l + (rr.next() - 0.5) * 1.2) : rampPick(C, 2.3 + l + (rr.next() - 0.5) * 1.2);
      },
      ang: (x, y) => Math.atan2((x - cx) / (rx * rx), -(y - cy) / (ry * ry)) * 0.7,
      edge: { col: H('#1d1036'), w: 0.95, l: 2.8 },
    });
    // root tail
    seg(ctx, cx + 0.3, cy + ry * 1.18, cx + 1.4, cy + ry * 1.18 + 2.2, 0.8, H('#8a6a48'), r);
    // angry glowing eyes
    const ex = cx + 1.2;
    for (const s of [-1, 1]) {
      const x = ex + s * 2.6, y = cy - 0.7;
      stroke(ctx, x, y, s * 0.35, 2.4, 1.6, H('#ffcf40'), r, { hi: 0.55, bend: 0 });
      stroke(ctx, x + 0.3, y + 0.15, 0, 0.8, 0.8, H('#3a0a10'), r, { bend: 0 });
      stroke(ctx, x - s * 0.1, y - 1.5, s * 0.45, 2.8, 0.9, H('#1d0f2a'), r, { bend: 0, hi: 0.1 });
    }
    stroke(ctx, ex + 0.3, cy + 2.8, 0, 3.0, 0.8, H('#2a0c22'), r, { bend: 0.25, hi: 0.1 });
  }

  const GHO = hexes(['#3d64a6', '#6e9ec8', '#a2d0d2', '#cbece4', '#f2fbf4']);
  function drawGhost(ctx, r, ph) {
    const cx = 0, cy = -17.6;
    const tx = -4.5 + Math.sin(ph) * 2.4, ty = -2.4 + Math.cos(ph) * 0.6;
    const ctrl = [
      [-7.2, -17], [-6.4, -21.5], [-3.6, -24.6], [0, -25.4], [3.6, -24.6], [6.4, -21.5], [7.2, -17],
      [6.6, -12.5], [5.4, -8.6 + Math.sin(ph + 1) * 0.5], [3.4, -6 + Math.sin(ph + 2) * 0.6], [0.6, -4.2], [tx, ty], [tx + 1.6, -6.4], [-3.4, -7.4 + Math.sin(ph) * 0.6], [-5.8, -10.6], [-7, -13.8],
    ];
    const body = spline(ctrl, 3);
    // reaching arms (behind)
    const reach = Math.sin(ph) * 0.8;
    seg(ctx, 4.5, -13, 10, -11.5 + reach, 1.6, GHO[2], r, { a: 0.95 });
    seg(ctx, 9.4, -11.6 + reach, 11.4, -12.6 + reach, 0.7, GHO[3], r);
    seg(ctx, 9.4, -11.2 + reach, 11.4, -10.4 + reach, 0.7, GHO[3], r);
    paint(ctx, body, r, {
      base: GHO[2], sp: 1.25, len: 3.8, wid: 1.35, jit: 0.15,
      col: (x, y, rr) => {
        const d = hyp(x - cx, y - cy) / 7.5;
        return rampPick(GHO, 4.1 - d * 1.2 - Math.max(0, (y - cy) / 6) + (rr.next() - 0.5) * 1.3);
      },
      ang: (x, y) => Math.atan2(y - cy - 2, x - cx) + Math.PI / 2 + 0.35,
      edge: { col: H('#1f3a78'), w: 0.8, l: 2.5 },
    });
    const ex = cx + 1.4;
    ctx.fillStyle = '#0d1430';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(ex + s * 2.4, cy - 0.8, 1.25, 1.75, s * 0.15, 0, TAU); ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(ex + 0.2, cy + 3.6, 1.35, 2.0, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#26407e';
    ctx.beginPath(); ctx.ellipse(ex + 0.4, cy + 4.2, 0.7, 1.0, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(160,220,230,0.8)';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(ex + s * 2.4 + 0.3, cy - 1.4, 0.3, 0, TAU); ctx.fill(); }
  }

  const COLV = hexes(['#1c1220', '#2e1c30', '#46284a', '#603a62', '#7e5480', '#a27aa4']);
  const COLU = hexes(['#22160e', '#35231a', '#4c3322', '#664630', '#82603e', '#a07c52']);
  const DARKC = H('#0c0812');
  function rootArm(ctx, r, x0, y0, x1, y1, w, pal) {
    seg(ctx, x0, y0, (x0 + x1) / 2 + 0.8, (y0 + y1) / 2, w, pal[2], r);
    seg(ctx, (x0 + x1) / 2 + 0.8, (y0 + y1) / 2, x1, y1, w * 0.85, pal[2], r);
    seg(ctx, x0 - 0.6, y0 + 0.4, (x0 + x1) / 2, (y0 + y1) / 2, w * 0.35, pal[4], r, { a: 0.9 });
    for (let i = -1; i <= 1; i++) seg(ctx, x1, y1, x1 + i * 1.8, y1 + 3 - Math.abs(i) * 0.6, 1.2, pal[1], r);
    contour(ctx, [[x0 - w / 2, y0], [x1 - w / 2, y1], [x1 + w / 2, y1], [x0 + w / 2, y0]], r, { col: DARKC, w: 0.9, l: 3, skip: (x, y, sh) => sh < -0.3 });
  }
  function drawColossus(ctx, r, pose) {
    ctx.translate(0, pose.bob);
    // legs
    for (const s of [-1, 1]) {
      const lift = Math.max(0, s * pose.lift) * 2.4;
      const fx = s * 7.5, fy = -0.8 - lift;
      seg(ctx, s * 7, -14, fx, fy - 1.5, 6.4, COLU[1], r);
      seg(ctx, s * 7 - 1.4, -13.5, fx - 1.2, fy - 2, 1.8, COLU[3], r, { a: 0.9 });
      stroke(ctx, fx + 1.2, fy - 0.4, 0.04, 8.4, 3.2, COLU[0], r, { hi: 0.22 });
      for (let i = 0; i < 3; i++) seg(ctx, fx + 3.4 + i * 0.4, fy - 0.2, fx + 5.4 + i * 0.7, fy + 0.4 - i * 0.3, 0.9, COLU[2], r);
    }
    // back arm
    rootArm(ctx, r, -14.5, -32, -18.5 - pose.arm, -15, 4.6, COLU.map((c) => U.mul(c, 0.8)));
    // crown of leaves
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (-0.95 + i * 0.47) + Math.sin(i * 2.1 + pose.lift) * 0.06;
      const bx = 1, by = -42;
      const L = 11 - Math.abs(i - 2) * 1.4;
      stroke(ctx, bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5, a, L, 3.8, LEAF[i & 1], r, { hi: 0.2 });
      stroke(ctx, bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5, a, L * 0.75, 1.0, LEAF[3], r, { a: 0.85 });
    }
    const cx = 0, cy = -28.5, rx = 17.5, ry = 16.5;
    const body = blob(cx, cy, rx, ry, 44, 0.07, r);
    paint(ctx, body, r, {
      base: COLV[1], sp: 2.0, len: 5.4, wid: 2.05, jit: 0.25,
      col: (x, y, rr) => {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        const l = -dx * 1.5 - dy * 1.2;
        if (dx * 0.7 + dy * 0.7 < -0.75 && rr.next() < 0.55) return rr.next() < 0.6 ? H('#6fa4b0') : H('#b4d0c4');
        const t = (dy + 1) / 2 + (rr.next() - 0.5) * 0.25;
        return t < 0.58 ? rampPick(COLV, 2.4 + l + (rr.next() - 0.5) * 1.4) : rampPick(COLU, 2 + l + (rr.next() - 0.5) * 1.4);
      },
      ang: (x, y) => {
        const dx = x - cx, dy = y - cy;
        const tx = -dy / (ry * ry), ty = dx / (rx * rx);
        const m = hyp(tx, ty) + 1e-6;
        return Math.atan2(ty / m * 0.6 + 0.55, tx / m * 0.6 + Math.sin(y * 0.4) * 0.2);
      },
      edge: { col: DARKC, w: 1.6, l: 4.4 },
    });
    // glowing cracks
    const cracks = [
      [[-1, -40], [1.4, -35], [0, -31], [3, -27.5], [1.2, -23], [4, -17.5]],
      [[0, -31], [-5, -28.5], [-8.5, -24], [-11.5, -22.5]],
      [[3, -27.5], [8, -29.5], [11.5, -26.5]],
      [[1.2, -23], [-2.5, -19], [-3.5, -15.5]],
    ];
    for (const c of cracks) polyStroke(ctx, c, 2.0, 3, H('#1a0c08'), r, { hi: 0.05 });
    for (const c of cracks) polyStroke(ctx, c, 1.15, 2.6, [H('#ffb030'), H('#ff9a20'), H('#ffc84a')], r, { hi: 0.45 });
    for (const c of cracks) polyStroke(ctx, c, 0.45, 2.2, H('#fff2b0'), r, { hi: 0.6 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      stroke(ctx, 2.2 + Math.cos(a) * 1.4, -28 + Math.sin(a) * 1.4, a + Math.PI / 2, 2.2, 1.1, i & 1 ? H('#ffe070') : H('#fff6c8'), r, { hi: 0.6 });
    }
    // eyes + brows + mouth
    for (const s of [-1, 1]) {
      const x = 3 + s * 4.8, y = -36.4;
      stroke(ctx, x, y, s * 0.3, 3.4, 1.5, H('#ffd040'), r, { hi: 0.6, bend: 0 });
      stroke(ctx, x - s * 0.2, y - 1.9, s * 0.42, 5.2, 1.9, DARKC, r, { bend: 0, hi: 0.1 });
    }
    stroke(ctx, 6, -31.5, -0.1, 4.8, 1.6, H('#140a10'), r, { bend: 0.2, hi: 0.05 });
    stroke(ctx, 6, -31.3, -0.1, 3.2, 0.5, H('#ffb030'), r, { bend: 0.2, hi: 0.4 });
    // front arm
    rootArm(ctx, r, 14.5, -31.5, 18.5 + pose.arm, -15.5, 5, COLU);
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
  function drawGemSprite(ctx, r, big) {
    const s = big ? 1.6 : 1;
    const P = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU;
      const k = 1 + 0.5 * Math.max(0, -Math.sin(a)) ** 3;
      P.push([Math.cos(a) * 1.8 * s * (1 - 0.3 * Math.max(0, -Math.sin(a))), -2.2 * s + Math.sin(a) * 1.9 * s * k]);
    }
    const pal = big ? hexes(['#2a8a9a', '#5cc4c8', '#a8ecdc', '#f4fff0']) : hexes(['#c8641a', '#f0a020', '#ffd84a', '#fff6c8']);
    ctx.fillStyle = rgb(pal[1]);
    ctx.fill(pathOf(P));
    stroke(ctx, 0.3 * s, -1.6 * s, -1.4, 2.8 * s, 1.6 * s, pal[1], r, { hi: 0.4 });
    stroke(ctx, -0.5 * s, -2.6 * s, -1.6, 2.2 * s, 1.1 * s, pal[2], r, { hi: 0.5 });
    stroke(ctx, -0.6 * s, -2.8 * s, -1.2, 0.9 * s, 0.7 * s, pal[3], r, { hi: 0.6 });
    contour(ctx, P, r, { col: big ? H('#0e2a40') : H('#3a1a08'), w: 0.5 * s, l: 1.3 * s });
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
    carved(ctx, tri(-1.4, -7.2, 0.85 + g, 1), r);
    carved(ctx, tri(1.4, -7.2, 0.85 + g, 1), r);
    carved(ctx, [[-2.2, -4.9], [-1.1, -4.4], [0, -4.9], [1.1, -4.4], [2.2, -4.9], [1.2, -3.4], [-1.2, -3.4]], r);
  }

  /* ---------- FX sprites ---------- */
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
      for (let k = 0; k < n; k++) {
        const a = off + (k / n) * TAU + (r.next() - 0.5) * 0.12;
        const col = H(cols[Math.min(cols.length - 1, i + (r.next() < 0.3 ? 1 : 0))]);
        stroke(ctx, R + Math.cos(a) * rr, R + Math.sin(a) * rr, a + Math.PI / 2 + 0.12, rg[2] * R * (0.8 + r.next() * 0.4), rg[3] * R, col, r, { a: rg[1] * (0.7 + r.next() * 0.3), bend: 0.12 });
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
  function buildFx() {
    FX.halo = {
      gold: haloSprite(160, ['#fff6c8', '#ffe070', '#ffc83a', '#f0a030', '#d08a26'], [[0.2, 0.9, 0.14, 0.07], [0.34, 0.75, 0.15, 0.065], [0.5, 0.55, 0.15, 0.06], [0.66, 0.38, 0.15, 0.055], [0.84, 0.22, 0.14, 0.05]]),
      cool: haloSprite(128, ['#f4fff0', '#c8f0e4', '#8fd0cc', '#5aa8c0', '#3a7aa8'], [[0.22, 0.85, 0.16, 0.08], [0.4, 0.6, 0.16, 0.07], [0.6, 0.38, 0.16, 0.065], [0.8, 0.2, 0.15, 0.06]]),
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
    FX.dab = {};
    let sd = 300;
    for (const k in FXCOL) {
      FX.dab[k] = [0, 1, 2].map(() => {
        const r = U.rng(sd++);
        const { c, ctx } = cv(28, 12);
        ctx.scale(4, 4);
        stroke(ctx, 3.5, 1.5, 0, 4.6, 1.9, H(FXCOL[k]), r, { bend: (r.next() - 0.5) * 0.5 });
        return gpuc(c);
      });
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
    // star sparkle
    {
      const { c, ctx } = cv(40, 40);
      const r = U.rng(78);
      for (let i = 0; i < 4; i++) stroke(ctx, 20, 20, (i * Math.PI) / 4, i & 1 ? 20 : 34, i & 1 ? 4 : 6, H(i & 1 ? '#ffe070' : '#fff6c8'), r, { bend: 0 });
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
    // seed trail
    {
      const { c, ctx } = cv(64, 16);
      const r = U.rng(80);
      ctx.scale(4, 4);
      stroke(ctx, 8, 2, 0, 15, 2.2, H('#f0a030'), r, { bend: 0 });
      stroke(ctx, 9, 1.8, 0, 12, 0.9, H('#ffe070'), r, { bend: 0 });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      const g = ctx.createLinearGradient(0, 0, 64, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 16);
      FX.trail = gpuc(c);
    }
  }

  /* ---------- character frames ---------- */
  const SPR = {};
  function buildCharacters() {
    let sd = 1000;
    const jack = { idle: [], walk: [] };
    for (let b = 0; b < 3; b++) {
      jack.idle.push(withFlip(mk(34, 42, 17, 37, (ctx) => drawJack(ctx, U.rng(sd++), { leg: 0, bob: 0, arm: 0, flut: b * 0.4 }))));
    }
    for (let p = 0; p < 4; p++) {
      const ph = (p / 4) * TAU;
      jack.walk.push(withFlip(mk(34, 42, 17, 37, (ctx) => drawJack(ctx, U.rng(sd++), { leg: Math.sin(ph), bob: -Math.abs(Math.cos(ph)) * 0.7, arm: -Math.sin(ph), flut: Math.cos(ph) }))));
    }
    SPR.jack = jack;
    SPR.creeper = [0, 1].map((v) => {
      const fr = [];
      for (let p = 0; p < 4; p++) {
        const ph = (p / 4) * TAU;
        fr.push(withFlip(mk(30, 34, 15, 29, (ctx) => drawCreeper(ctx, U.rng(sd++), { leg: Math.sin(ph), bob: -Math.abs(Math.cos(ph)) * 0.8, tilt: Math.sin(ph) * 0.07, leaf: Math.cos(ph) * 0.12 }, v))));
      }
      return fr;
    });
    SPR.ghost = [[0, 1, 2].map((i) => withFlip(mk(30, 32, 15, 29, (ctx) => drawGhost(ctx, U.rng(sd++), (i / 3) * TAU))))];
    SPR.colossus = [(() => {
      const fr = [];
      for (let p = 0; p < 4; p++) {
        const ph = (p / 4) * TAU;
        fr.push(withFlip(mk(66, 64, 33, 58, (ctx) => drawColossus(ctx, U.rng(sd++), { lift: Math.sin(ph), bob: -Math.abs(Math.cos(ph)) * 1.0, arm: Math.sin(ph) * 1.2 }))));
      }
      return fr;
    })()];
    SPR.gem = [0, 1].map((i) => mk(8, 8, 4, 6, (ctx) => drawGemSprite(ctx, U.rng(sd++ + i), false), 6));
    SPR.gemBig = [0, 1].map((i) => mk(12, 12, 6, 9.5, (ctx) => drawGemSprite(ctx, U.rng(sd++ + i), true), 6));
    SPR.seed = [0, 1].map(() => mk(7, 5, 3.5, 2.5, (ctx) => drawSeedSprite(ctx, U.rng(sd++), false), 6));
    SPR.lantern = [0, 1, 2].map((f) => mk(12, 16, 6, 14.5, (ctx) => drawTurnipLantern(ctx, U.rng(sd++), f)));
  }

  /* ======================================================================
     4. Props
     ====================================================================== */
  const PROPS = {};
  function drawCypress(ctx, r, Ht) {
    const ph = r.next() * 6;
    const wAt = (t) => 7.6 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.16 + t * 0.86)), 0.75) * (1 - 0.25 * t) * (1 + 0.12 * Math.sin(t * 17 + ph));
    const cAt = (t) => 2.4 * Math.sin(t * 4.6 + ph) * t;
    const L = [], R = [];
    const N = 30;
    for (let i = 0; i <= N; i++) {
      const t = i / N, y = -2 - t * Ht;
      R.push([cAt(t) + wAt(t) * (1 + (r.next() - 0.5) * 0.12), y]);
      L.push([cAt(t) - wAt(t) * (1 + (r.next() - 0.5) * 0.12), y]);
    }
    L.reverse();
    const P = R.concat([[cAt(1) + 0.6, -Ht - 5]]).concat(L);
    seg(ctx, 0, 0, 0.3, -6, 2.6, H('#2a1a14'), r);
    const pal = hexes(['#081210', '#0e2018', '#153222', '#1e442c', '#2c5838', '#3f6e40']);
    paint(ctx, P, r, {
      base: pal[1], sp: 1.9, len: 7.5, wid: 2.0, jit: 0.2,
      col: (x, y, rr) => {
        const t = (-y - 2) / Ht, l = -(x - cAt(t)) / Math.max(1, wAt(t));
        const u = rr.next();
        if (u < 0.08) return H('#22355f');
        if (u < 0.12 && l > 0.2) return H('#6f7c34');
        return rampPick(pal, 1.8 + l * 1.9 + (rr.next() - 0.5) * 1.6);
      },
      ang: (x, y) => {
        const t = (-y - 2) / Ht;
        return -Math.PI / 2 + 0.6 * Math.sin(t * 11 + x * 0.35 + ph);
      },
      edge: { col: H('#04080a'), w: 1.3, l: 4.5 },
    });
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
  function drawHouse(ctx, r, v) {
    const front = [[-12, -0.5], [10, -0.5], [10.3, -17], [-12.2, -16.8]];
    const side = [[10, -0.5], [16.6, -3.4], [16.6, -17.6], [13.2, -24.2], [10.3, -17]];
    const roof = [[-14, -16.2], [10.8, -16.4], [13.4, -24.6], [-9.6, -25.2]];
    paint(ctx, side, r, {
      base: H('#3a4a7a'), sp: 1.6, len: 4.2, wid: 1.6,
      col: (x, y, rr) => rampPick(hexes(['#2e3c6a', '#3a4a7a', '#4a5a8a', '#5e6c9a']), 1.5 + (rr.next() - 0.5) * 2),
      ang: () => -Math.PI / 2, edge: { col: PRUSSIAN, w: 1.0, l: 3.2 },
    });
    const wall = hexes(['#a88a5a', '#c8ac76', '#dcc490', '#ecdcae', '#f6ecc8']);
    paint(ctx, front, r, {
      base: wall[1], sp: 1.6, len: 4.6, wid: 1.6, jit: 0.2,
      col: (x, y, rr) => (rr.next() < 0.08 ? H('#6a7aa8') : rampPick(wall, 2.4 - x * 0.06 + (y + 8) * 0.06 + (rr.next() - 0.5) * 1.8)),
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
      base: wall[2], sp: 1.2, len: 2.4, wid: 1.2, col: (x, y, rr) => rampPick(wall, 2 + (rr.next() - 0.5) * 2), ang: () => -Math.PI / 2,
      edge: { col: PRUSSIAN, w: 0.8, l: 2.4 },
    });
    // windows + door
    const wins = v === 0 ? [[-8, -11.5], [4.6, -11.5]] : [[-7.5, -11.5], [-1, -11.5], [5.2, -11.5]];
    const lights = [];
    for (const w of wins) {
      const P = [[w[0] - 2, w[1] - 2.6], [w[0] + 2, w[1] - 2.6], [w[0] + 2, w[1] + 2.6], [w[0] - 2, w[1] + 2.6]];
      ctx.fillStyle = '#ffc93a';
      ctx.fill(pathOf(P));
      stroke(ctx, w[0] - 0.3, w[1] - 0.4, -Math.PI / 2, 4, 2.2, H('#fff0a0'), r, { hi: 0.5 });
      contour(ctx, P, r, { col: H('#1a1430'), w: 0.8, l: 2 });
      seg(ctx, w[0], w[1] - 2.4, w[0], w[1] + 2.4, 0.5, H('#3a2a20'), r);
      seg(ctx, w[0] - 1.9, w[1], w[0] + 1.9, w[1], 0.5, H('#3a2a20'), r);
      lights.push([w[0], w[1], 0.8]);
    }
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
  function buildProps() {
    let sd = 5000;
    PROPS.cypress = [70, 82, 60].map((h) => { const s = withFlip(mk(30, h + 12, 15, h + 7, (ctx) => drawCypress(ctx, U.rng(sd++), h))); s.fade = [12, h]; return s; });
    PROPS.olive = [0, 1].map(() => withFlip(mk(48, 44, 24, 40, (ctx) => drawOlive(ctx, U.rng(sd++)))));
    PROPS.hay = [1, 0.8].map((s) => withFlip(mk(36, 30, 18, 26, (ctx) => drawHay(ctx, U.rng(sd++), s))));
    PROPS.house = [0, 1].map((v) => {
      let lights;
      const s = withFlip(mk(40, 36, 18, 32, (ctx) => { lights = drawHouse(ctx, U.rng(sd++), v); }));
      s.lights = lights;
      return s;
    });
    PROPS.lamp = [0].map(() => {
      let lights;
      const s = mk(12, 40, 6, 37, (ctx) => { lights = drawLamp(ctx, U.rng(sd++)); });
      s.lights = lights;
      return s;
    });
    PROPS.sun = [3, 2].map((n) => withFlip(mk(26, 38, 13, 35, (ctx) => drawSunflowers(ctx, U.rng(sd++), n))));
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
${S} #levelup .lu-title::after { content: 'Ein neues Meisterwerk!'; font: 800 44px ${cin}; color: #ffe27a; letter-spacing: 2px; text-shadow: 0 3px 0 #3a2408, 0 0 18px rgba(255,200,80,.5); }
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
     7. Runtime helpers
     ====================================================================== */
  let BM = { a: 1, d: 1, e: 0, f: 0 };
  function rotDraw(ctx, img, x, y, ang, w, h, sq) {
    const S = BM.a, c = Math.cos(ang) * S, s = Math.sin(ang) * S, q = sq || 1;
    ctx.setTransform(c, s * q, -s, c * q, BM.e + x * S, BM.f + y * S);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }
  const resetT = (ctx) => ctx.setTransform(BM.a, 0, 0, BM.d, BM.e, BM.f);
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

  /* ======================================================================
     8. Registration
     ====================================================================== */
  Styles.register({
    id: 'vangogh',
    name: 'Sternennacht',
    family: 'Ölgemälde',
    description: 'Ein lebendiges Ölgemälde der Nacht vor Mitternacht – dicke, wirbelnde Pinselstriche in Ultramarin, Kadmiumgelb und Viridian.',
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
        if (tag && document.body.classList.contains('style-vangogh')) tag.textContent = self.css;
      });
      window.__vgInit = { atlas: Math.round(t1 - t0), chars: Math.round(t2 - t1), props: Math.round(t3 - t2), rest: Math.round(performance.now() - t3) };
    },

    renderGroundChunk(ctx, info) { return groundGen(ctx, info); },

    propsForChunk(info) {
      const out = [];
      const w = new Float32Array(5);
      const ok = (x, y) => !G.nearSpawn(x, y, 95);
      const at = (x, y) => { fieldAt(x, y, w); return w; };
      G.scatterOwned(info, 46, 9101, (x, y, r) => {
        if (!ok(x, y)) return;
        const f = at(x, y);
        if (f[2] > 0.05 || f[4] > 0.05) return;
        const pr = f[3] > 0.6 ? 0.5 : f[1] > 0.6 ? 0.025 : 0;
        if (!r.chance(pr)) return;
        const v = r.int(0, 2);
        out.push({ x, y, t: 'cypress', v, flip: r.chance(0.5), sh: [8, 2.6], pad: 110 });
      });
      G.scatterOwned(info, 110, 9102, (x, y, r) => {
        if (!ok(x, y) || !r.chance(0.3)) return;
        const f = at(x, y);
        if (f[1] < 0.7) return;
        out.push({ x, y, t: 'olive', v: r.int(0, 1), flip: r.chance(0.5), sh: [16, 4.5], pad: 70 });
      });
      G.scatterOwned(info, 120, 9103, (x, y, r) => {
        if (!ok(x, y) || !r.chance(0.36)) return;
        const f = at(x, y);
        if (f[0] < 0.7) return;
        const v = r.int(0, 1);
        out.push({ x, y, t: 'hay', v, flip: r.chance(0.5), sh: [v ? 11 : 14, v ? 3.2 : 4] });
      });
      G.scatterOwned(info, 85, 9104, (x, y, r) => {
        if (!ok(x, y)) return;
        const f = at(x, y);
        if (!r.chance(f[0] > 0.6 ? 0.18 : f[1] > 0.6 ? 0.05 : 0)) return;
        out.push({ x, y, t: 'sun', v: r.int(0, 1), flip: r.chance(0.5), sh: [8, 2.2] });
      });
      G.scatterOwned(info, 330, 9105, (x, y, r) => {
        if (!r.chance(0.5) || G.nearSpawn(x, y, 130)) return;
        const f = at(x, y);
        if (f[2] > 0.01 || f[4] > 0.01 || f[3] > 0.2) return;
        pathInfo(x, y, PI_);
        if (PI_.d > 70) return;
        out.push({ x, y, t: 'house', v: r.int(0, 1), flip: r.chance(0.5), sh: [17, 4], pad: 70 });
      });
      G.scatterOwned(info, 120, 9106, (x, y, r) => {
        if (!ok(x, y) || !r.chance(0.65)) return;
        const f = at(x, y);
        if (f[4] > 0.05) return;
        pathInfo(x, y, PI_);
        if (PI_.d < 15 || PI_.d > 22) return;
        out.push({ x, y, t: 'lamp', v: 0, flip: false, sh: [4, 1.5], pad: 90 });
      });
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
      blit(ctx, s, p.x, p.y, p.flip);
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
      // Jack's glow on the ground
      const p = game.player;
      ctx.globalAlpha = 0.3;
      ctx.drawImage(FX.pool, p.x - 18, p.y - 7, 36, 14);
      for (const o of game.orbitals) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(FX.pool, o.x - 14, o.y + 4 - 6, 28, 12);
      }
      ctx.globalCompositeOperation = 'source-over';
      // spawn swirls of paint on the ground
      for (const e of game.enemies) {
        if (e.spawnT >= 1 || e.dying) continue;
        const sw = FX.swirl[e.type] || FX.swirl.creeper;
        const R = e.r * (1.2 + 1.4 * U.ease.outQuad(Math.min(1, e.spawnT * 1.4)));
        ctx.globalAlpha = Math.sin(Math.PI * e.spawnT) * 0.9;
        rotDraw(ctx, sw, e.x, e.y - 1, -view.rt * 5 - e.spawnT * 4 + e.seed * 6, R * 2, R * 2, 0.55);
      }
      resetT(ctx);
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o) {
      let rx, ry;
      if (o.kind === 'player') { rx = 8; ry = 2.8; }
      else if (o.kind === 'enemy') {
        if (o.dying) return;
        const sp = o.spawnT < 1 ? o.spawnT : 1;
        if (o.type === 'ghost') { rx = 5 * sp; ry = 1.8 * sp; } else { rx = o.r * 1.0 * sp; ry = rx * 0.34; }
        if (rx < 0.5) return;
      } else if (o.kind === 'prop') {
        if (!o.sh) return;
        rx = o.sh[0]; ry = o.sh[1];
      } else return;
      ctx.globalAlpha = o.type === 'ghost' ? 0.35 : 0.62;
      ctx.drawImage(FX.shadow, o.x - rx + 0.6, o.y - ry + 0.4, rx * 2, ry * 2);
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      const big = g.big;
      const pop = g.pop > 0 ? 1 + Math.sin(g.pop * Math.PI) * 0.7 : 1;
      const bob = Math.sin(view.rt * 3 + g.seed * 20) * (big ? 1.0 : 0.5) - 0.5;
      const R = (big ? 9 : 5) * pop;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 + 0.15 * Math.sin(view.rt * 5 + g.seed * 30);
      rotDraw(ctx, big ? FX.halo.cool : FX.halo.small, g.x, g.y - (big ? 4 : 2.5) + bob, view.rt * 1.2 + g.seed * 9, R * 2, R * 2);
      resetT(ctx);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const s = (big ? SPR.gemBig : SPR.gem)[g.seed < 0.5 ? 0 : 1];
      blit(ctx, s, g.x, g.y + bob, false, pop);
    },

    drawEnemy(ctx, e, view) {
      const sets = SPR[e.type];
      if (!sets) return;
      const vi = e.type === 'creeper' ? (e.seed < 0.5 ? 0 : 1) : 0;
      const frames = sets[vi];
      const ghost = e.type === 'ghost', colossus = e.type === 'colossus';
      const sc = 0.92 + e.seed * 0.16;
      const rt = view.rt;
      let y = e.y;
      let fr;
      if (ghost) {
        y += -2 + Math.sin(rt * 3 + e.seed * 9) * 1.2;
        fr = frames[Math.floor(rt * 5 + e.seed * 7) % 3];
      } else {
        fr = frames[Math.floor(e.anim * (colossus ? 0.45 : 0.75)) & 3];
      }
      const flip = e.facing < 0;
      const ab = ghost ? 0.9 : 1;
      if (e.dying) {
        const d = e.deathT;
        ctx.globalAlpha = ab * (1 - d) * (1 - d);
        blit(ctx, fr, e.x, y - d * 3, flip, sc * (1 + d * 0.2));
        if (d < 0.4) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (0.4 - d) * 1.2;
          blit(ctx, fr, e.x, y - d * 3, flip, sc * (1 + d * 0.2), flashOf(fr, flip));
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (e.spawnT < 1) {
        const st = e.spawnT;
        const a = U.smoothstep(0.2, 0.9, st);
        if (a <= 0) return;
        ctx.globalAlpha = ab * a;
        const sy = 0.35 + 0.65 * U.ease.outQuad(st), sx = 1.25 - 0.25 * st;
        const im = flip ? fr.f : fr.c;
        const ax = flip ? fr.w - fr.ax : fr.ax;
        ctx.drawImage(im, e.x - ax * sc * sx, y - fr.ay * sc * sy, fr.w * sc * sx, fr.h * sc * sy);
        ctx.globalAlpha = 1;
        return;
      }
      ctx.globalAlpha = ab;
      blit(ctx, fr, e.x, y, flip, sc);
      if (e.flash > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(0.55, e.flash * 0.9) * ab;
        blit(ctx, fr, e.x, y, flip, sc, flashOf(fr, flip));
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
      if (colossus) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.28 + 0.12 * Math.sin(rt * 4 + e.seed * 9);
        const gx = e.x + (flip ? -2.2 : 2.2) * sc, gy = y - 28 * sc;
        ctx.drawImage(FX.glow, gx - 12, gy - 12, 24, 24);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    },

    drawPlayer(ctx, p, view) {
      const rt = view.rt;
      let fr, bob;
      if (p.moving) {
        const ph = p.anim * 0.9;
        fr = SPR.jack.walk[Math.floor(ph) & 3];
        bob = 0;
      } else {
        fr = SPR.jack.idle[Math.floor(rt * 3.5) % 3];
        bob = Math.sin(rt * 2.4) * 0.4;
      }
      const flip = p.facing < 0;
      const hx = p.x + (flip ? -1.2 : 1.2), hy = p.y + bob - 22;
      // swirling halo of light strokes around the glowing face
      ctx.globalCompositeOperation = 'lighter';
      const hp = 0.85 + 0.15 * Math.sin(rt * 2.2);
      ctx.globalAlpha = 0.6 * hp;
      rotDraw(ctx, FX.halo.gold, hx, hy, rt * 0.6, 44, 44);
      ctx.globalAlpha = 0.34 * hp;
      rotDraw(ctx, FX.halo.gold, hx, hy, -rt * 0.4 + 1, 72, 72);
      resetT(ctx);
      if (p.levelT > 0) {
        const R = 14 + (1 - p.levelT) * 40;
        ctx.globalAlpha = p.levelT * 0.9;
        rotDraw(ctx, FX.swirl.gold, p.x, p.y - 2, rt * 3, R * 2, R * 2, 0.6);
        resetT(ctx);
      }
      ctx.globalCompositeOperation = 'source-over';
      if (p.dashT > 0) {
        for (let i = 2; i >= 1; i--) {
          ctx.globalAlpha = 0.25 / i;
          blit(ctx, fr, p.x - p.dashX * 7 * i, p.y - p.dashY * 7 * i + bob, flip);
        }
      }
      let a = 1;
      if (p.iframes > 0 && p.hurtT < 0.7 && Math.floor(rt * 16) % 2 === 0) a = 0.5;
      ctx.globalAlpha = a;
      blit(ctx, fr, p.x, p.y + bob, flip);
      if (p.hurtT > 0.4) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(0.7, (p.hurtT - 0.4) * 2);
        blit(ctx, fr, p.x, p.y + bob, flip, 1, flashOf(fr, flip));
        ctx.globalCompositeOperation = 'source-over';
      }
      // warm glow from inside the carved face
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (0.32 + 0.08 * Math.sin(rt * 11) + 0.05 * Math.sin(rt * 23)) * a;
      const fx = p.x + (flip ? -2.5 : 2.5), fy = p.y + bob - 21;
      ctx.drawImage(FX.glow, fx - 8, fy - 7, 16, 14);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const rt = view.rt;
      const bob = Math.sin(rt * 3 + o.idx * 1.7) * 1.1;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + 0.1 * Math.sin(rt * 9 + o.idx * 3);
      rotDraw(ctx, FX.halo.gold, o.x, o.y - 5 + bob, rt * 0.9 + o.idx, 28, 28);
      resetT(ctx);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      blit(ctx, SPR.lantern[(Math.floor(rt * 5) + o.idx) % 3], o.x, o.y + 2 + bob, Math.cos(o.angle) < 0);
    },

    drawProjectile(ctx, pr) {
      const tr = FX.trail;
      ctx.globalAlpha = Math.min(1, pr.age * 10) * Math.min(1, pr.life * 5) * 0.9;
      rotDraw(ctx, tr, pr.x - Math.cos(pr.angle) * 6, pr.y - Math.sin(pr.angle) * 6, pr.angle, 16, 4);
      ctx.globalAlpha = Math.min(1, pr.life * 6);
      const s = SPR.seed[pr.seed < 0.5 ? 0 : 1];
      rotDraw(ctx, s.c, pr.x, pr.y, pr.angle + pr.spin * 0.3, s.w, s.h);
      resetT(ctx);
      ctx.globalAlpha = 1;
    },

    drawParticle(ctx, pt) {
      const life = pt.life / pt.max;
      switch (pt.kind) {
        case 'swirl': {
          const age = 1 - life, R = pt.size * (0.35 + 0.65 * U.ease.outQuad(Math.min(1, age * 1.5)));
          ctx.globalAlpha = (1 - age) * 0.9;
          rotDraw(ctx, FX.swirl[pt.col] || FX.swirl.gold, pt.x, pt.y, pt.rot + age * 3, R * 2, R * 2, 0.6);
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
        case 'smear': {
          ctx.globalAlpha = life * 0.8;
          rotDraw(ctx, FX.smear, pt.x, pt.y - pt.z, pt.rot, 30, 12);
          resetT(ctx);
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
      // fireflies / drifting star dabs – the painting is alive
      const cell = 130, rt = view.rt;
      const x0 = Math.floor(view.x0 / cell), x1 = Math.floor(view.x1 / cell), y0 = Math.floor(view.y0 / cell), y1 = Math.floor(view.y1 / cell);
      ctx.globalCompositeOperation = 'lighter';
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = U.hashInt(cx, cy, 777);
          if ((h & 3) === 0) continue;
          const fx = (cx + ((h >>> 4) & 255) / 255) * cell + Math.sin(rt * 0.5 + (h & 15)) * 14;
          const fy = (cy + ((h >>> 12) & 255) / 255) * cell + Math.sin(rt * 0.37 + ((h >>> 20) & 15)) * 10;
          const tw = 0.5 + 0.5 * Math.sin(rt * 2.3 + (h & 63));
          ctx.globalAlpha = 0.25 + 0.45 * tw;
          rotDraw(ctx, FX.halo.small, fx, fy, rt + (h & 7), 7 + tw * 3, 7 + tw * 3);
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

    /* ---------- hooks ---------- */
    onHit(game, e, src) {
      const h = (HEIGHT[e.type] || 22) * 0.5;
      const cols = COLS[e.type] || COLS.creeper;
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 50;
        game.addParticle({ x: e.x, y: e.y, z: h, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 20 + Math.random() * 40, grav: 240, kind: 'dab', col: i === 0 ? (src === 'lantern' ? 'orange' : 'yellow') : cols[(Math.random() * cols.length) | 0], life: 0.5 + Math.random() * 0.4, size: 1.2 + Math.random() * 0.9, drag: 1.5, rot: a, vr: (Math.random() - 0.5) * 12, v: (Math.random() * 3) | 0 });
      }
      game.addParticle({ x: e.x, y: e.y - h, z: 0, kind: 'star', life: 0.18, size: e.type === 'colossus' ? 12 : 8, drag: 0, rot: Math.random() * TAU, vr: 0 });
    },
    onKill(game, e) {
      const h = (HEIGHT[e.type] || 22) * 0.5;
      const big = e.type === 'colossus';
      const cols = COLS[e.type] || COLS.creeper;
      dabBurst(game, e.x, e.y, h, big ? 22 : 9, cols, big ? 110 : 75, big ? 2.6 : 1.8);
      game.addParticle({ x: e.x, y: e.y, kind: 'swirl', col: e.type, life: big ? 1.0 : 0.6, size: big ? 30 : 14, drag: 0, rot: Math.random() * TAU });
    },
    onHurt(game, p) {
      dabBurst(game, p.x, p.y, 14, 8, ['red', 'orange', 'yellow', 'blue'], 70, 1.8);
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'star', life: 0.25, size: 18, drag: 0, rot: Math.random() * TAU });
    },
    onPickup(game, g) {
      const n = g.big ? 5 : 1;
      for (let i = 0; i < n; i++) {
        game.addParticle({ x: g.x + (Math.random() - 0.5) * 8, y: g.y, z: 5 + Math.random() * 8, vz: 12, kind: 'star', life: 0.35 + Math.random() * 0.2, size: g.big ? 9 : 6, drag: 2, rot: Math.random(), vr: 3 });
      }
    },
    onShoot(game, pr) {
      if (Math.random() < 0.4) {
        game.addParticle({ x: pr.x, y: pr.y + 4, z: 4, vx: pr.vx * 0.08 + (Math.random() - 0.5) * 20, vy: pr.vy * 0.08, vz: 25, grav: 200, kind: 'dab', col: 'orange', life: 0.45, size: 1.1, drag: 2, rot: pr.angle, vr: 6, v: (Math.random() * 3) | 0 });
      }
    },
    onDash(game, p) {
      game.addParticle({ x: p.x - p.dashX * 4, y: p.y, z: 12, kind: 'smear', life: 0.35, size: 1, drag: 0, rot: Math.atan2(p.dashY, p.dashX), vr: 0 });
      for (let i = 0; i < 4; i++) game.addParticle({ x: p.x, y: p.y, z: 0, vx: -p.dashX * (20 + Math.random() * 30) + (Math.random() - 0.5) * 20, vy: -p.dashY * 20 + (Math.random() - 0.5) * 14, kind: 'dab', col: i & 1 ? 'blue' : 'turq', life: 0.8, size: 1.5, drag: 4, rot: Math.atan2(p.dashY, p.dashX), v: i % 3 });
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y, kind: 'swirl', col: 'gold', life: 1.2, size: 44, drag: 0, rot: 0 });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * 60, vy: Math.sin(a) * 40, vz: 40, grav: 60, kind: 'star', life: 0.8 + Math.random() * 0.4, size: 7 + Math.random() * 4, drag: 2.5, rot: Math.random() * 3, vr: (Math.random() - 0.5) * 6 });
      }
    },
    onDeath(game, p) {
      dabBurst(game, p.x, p.y, 16, 26, ['orange', 'yellow', 'blue', 'red', 'gold'], 110, 2.4);
      game.addParticle({ x: p.x, y: p.y, kind: 'swirl', col: 'gold', life: 1.6, size: 50, drag: 0, rot: 0 });
    },
  });
})();
