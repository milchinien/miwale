/* ============================================================================
   Ukiyo-e Woodblock (id: ukiyoe) – the world as an Edo-period colour woodblock print
   (Hokusai / Hiroshige feel). Every image is "printed" from blocks:
     1. a paper underlay (kinari washi),
     2. flat colour blocks with bokashi gradients, laid slightly off-register (+0.38/+0.30 units),
     3. one sumi key block whose lines swell and thin like a carved line
        (stamped brush ribbon, thicker towards the lower right),
     4. washi fibres that show through everything.
   Sprites are baked once in init(); flash / hurt / dissolve variants are derived per pixel.
   Ground: per-pixel shader over signed-distance terrain regions (bokashi by depth, offset colour
   vs. key line, water contour lines + seigaiha) cached in chunks, brush decals on top.
   Screen: ichimonji-bokashi band, paper margin with key-line border, signature cartouche + seal.
   ========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ------------------------------------------------------------------ palette */
  const PAPER = '#f2e8d2';      // kinari washi – the paper underlay of every print
  const PAPER_W = '#fbf5e6';    // unprinted paper (flash)
  const SUMI = '#1e1b19';       // key block ink
  const C = {
    indigo: '#2d4a72', indigoL: '#5a7aa0', indigoD: '#1c3150',
    verm: '#cf4a2c', vermL: '#e7845a', vermD: '#9e321e',
    ochre: '#d8b264', ochreL: '#eed79c', ochreD: '#a9813d',
    skin: '#efd5ae', skinD: '#d8b387',
    pine: '#3d5a45', pineL: '#748f61', pineD: '#2a4031', sage: '#8fa36f',
    prus: '#24527e', prusL: '#7ea6c4', prusD: '#173a5e',
    gold: '#d9a93b', goldL: '#f4d77e', goldD: '#a47722',
    pink: '#f0c3c3', pinkD: '#d58c97', pinkW: '#fbf1ea',
    stone: '#8d918b', stoneL: '#c3c5b9', stoneD: '#5d6a76',
    bark: '#6b4f3c', barkD: '#4a3628', barkL: '#8f725a',
    ivory: '#efe3c4', iron: '#454b59', ironD: '#2a2e37',
  };
  const KAPPA_V = [
    { b: '#5f9466', l: '#8fb886', d: '#3a684a' },
    { b: '#4b8a86', l: '#7fb6ac', d: '#2d6161' },
    { b: '#7d8f45', l: '#a9b56c', d: '#56652d' },
  ];
  const ONI_V = [
    { s: '#c9472f', l: '#e5835c', d: '#8c2a1b' },
    { s: '#3f6c96', l: '#76a0c2', d: '#22446a' },
  ];

  const REG = [0.38, 0.3];      // colour-block misregistration (world units)
  const LDX = 0.6, LDY = 0.8;   // key lines swell towards the lower right
  let K = 4;                    // sprite px per world unit (from display size in init)
  const SPR = {};

  /* ================================================================ geometry */
  /** Catmull-Rom spline through control points -> dense polyline. */
  function spline(pts, closed, seg) {
    seg = seg || 7;
    const n = pts.length, out = [];
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
      const p1 = pts[i], p2 = pts[(i + 1) % n];
      const p3 = pts[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      for (let k = 0; k < seg; k++) {
        const t = k / seg, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }
  /** Straight polygon, densified so the stamped key line follows it evenly. */
  function poly(pts, closed, step) {
    closed = closed !== false;
    step = step || 0.8;
    const n = pts.length, out = [];
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }
  function ell(cx, cy, rx, ry, rot, n) {
    rot = rot || 0;
    n = n || Math.max(16, Math.ceil((rx + ry) * 3.2));
    const co = Math.cos(rot), si = Math.sin(rot), out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      out.push([cx + x * co - y * si, cy + x * si + y * co]);
    }
    return out;
  }
  function arc(cx, cy, rx, ry, a0, a1, n) {
    n = n || Math.max(6, Math.ceil(Math.abs(a1 - a0) * (rx + ry) * 1.2));
    const out = [];
    for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return out;
  }
  /** Tapered capsule from (x1,y1) radius r1 to (x2,y2) radius r2 – limbs, trunks, stalks. */
  function capsule(x1, y1, x2, y2, r1, r2) {
    const a = Math.atan2(y2 - y1, x2 - x1), out = [];
    const n = 9;
    for (let i = 0; i <= n; i++) { const t = a + PI / 2 + (i / n) * PI; out.push([x1 + Math.cos(t) * r1, y1 + Math.sin(t) * r1]); }
    for (let i = 0; i <= n; i++) { const t = a - PI / 2 + (i / n) * PI; out.push([x2 + Math.cos(t) * r2, y2 + Math.sin(t) * r2]); }
    return poly(out, true, 0.7);
  }
  function rrect(x, y, w, h, r) {
    const out = [];
    const q = (cx, cy, a0) => { for (let i = 0; i <= 4; i++) { const a = a0 + (i / 4) * (PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    q(x + w - r, y + r, -PI / 2); q(x + w - r, y + h - r, 0); q(x + r, y + h - r, PI / 2); q(x + r, y + r, PI);
    return poly(out, true, 0.7);
  }
  function xf(pts, dx, dy, s, rot) {
    const co = Math.cos(rot || 0), si = Math.sin(rot || 0);
    s = s || 1;
    return pts.map((p) => [dx + (p[0] * co - p[1] * si) * s, dy + (p[0] * si + p[1] * co) * s]);
  }
  function trace(c, pts, closed) {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    if (closed !== false) c.closePath();
  }

  /* ========================================================== the key block */
  let seedN = 1;
  /**
   * Carved sumi line: circles stamped along the polyline into one path (a brush ribbon).
   * Width swells and thins along the line, closed outlines get heavier on the lower-right side,
   * open lines taper at both ends.  o: { closed, vary, side, taper, col, seed }
   */
  function ink(c, pts, w, o) {
    o = o || {};
    const n = pts.length;
    if (n < 2 || !(w > 0)) return;
    const closed = !!o.closed;
    const vary = o.vary !== undefined ? o.vary : 0.3;
    const side = o.side !== undefined ? o.side : closed ? 0.45 : 0.15;
    const taper = o.taper !== undefined ? o.taper : closed ? 0 : Math.max(0.8, w * 2.4);
    const seed = o.seed !== undefined ? o.seed : (seedN++ * 2.399) % 50;
    let sg = 1;
    if (closed) {
      let a = 0;
      for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; }
      sg = a >= 0 ? 1 : -1;
    }
    const segs = closed ? n : n - 1;
    let total = 0;
    for (let i = 0; i < segs; i++) { const p = pts[i], q = pts[(i + 1) % n]; total += Math.hypot(q[0] - p[0], q[1] - p[1]); }
    const step = Math.max(0.04, w * 0.2);
    c.beginPath();
    let s = 0, next = 0;
    for (let i = 0; i < segs; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
      if (L < 1e-6) continue;
      const tx = dx / L, ty = dy / L;
      const nd = sg * ty * LDX - sg * tx * LDY;
      while (next <= s + L) {
        const d = next - s;
        const x = p[0] + tx * d, y = p[1] + ty * d;
        let k = 1 + vary * (0.55 * Math.sin(next * 0.85 + seed) + 0.45 * Math.sin(next * 2.3 + seed * 1.7));
        k *= 1 + side * nd;
        if (taper > 0) {
          const e = Math.min(next, total - next) / taper;
          if (e < 1) k *= 0.2 + 0.8 * Math.sin(Math.max(0, e) * PI * 0.5);
        }
        const r = Math.max(0.04, w * k * 0.5);
        c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
        next += step;
      }
      s += L;
    }
    c.fillStyle = o.col || SUMI;
    c.fill();
  }
  const line = (c, pts, w, o) => ink(c, pts, w, o);
  const sline = (c, pts, w, o) => ink(c, spline(pts, false, 6), w, o);

  /* ========================================================= colour blocks */
  let OLW = 0.95; // default key-line width of an outline (world units)
  /**
   * One printed part: paper underlay, the colour block (off-register, bokashi fill / pattern),
   * then the key-block outline.  fill: css colour | fn(ctx) painting inside the clipped shape.
   * o: { ink (0 = none), detail(ctx) clipped colour detail, paper:false, vary, side, reg }
   */
  function part(c, pts, fill, o) {
    o = o || {};
    if (o.paper !== false) { c.beginPath(); trace(c, pts); c.fillStyle = PAPER; c.fill(); }
    const rg = o.reg === undefined ? 1 : o.reg;
    c.save();
    c.translate(REG[0] * rg, REG[1] * rg);
    c.beginPath(); trace(c, pts);
    if (typeof fill === 'function') { c.save(); c.clip(); fill(c); c.restore(); }
    else if (fill) { c.fillStyle = fill; c.fill(); }
    if (o.detail) { c.save(); c.beginPath(); trace(c, pts); c.clip(); o.detail(c); c.restore(); }
    c.restore();
    if (o.ink !== 0) ink(c, pts, o.ink || OLW, { closed: true, vary: o.vary, side: o.side, col: o.inkCol });
  }
  function grad(c, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
    return g;
  }
  /** Linear bokashi fill (inside a clip). stops: [t0, col0, t1, col1, ...] */
  const lin = (x0, y0, x1, y1, stops) => (c) => { c.fillStyle = grad(c, x0, y0, x1, y1, stops); c.fillRect(-300, -300, 600, 600); };
  /** Vertical bokashi from colour a at y0 to b at y1. */
  const bk = (y0, y1, a, b) => lin(0, y0, 0, y1, [0, a, 1, b]);
  const rad = (x, y, r0, r1, stops) => (c) => {
    const g = c.createRadialGradient(x, y, r0, x, y, r1);
    for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
    c.fillStyle = g; c.fillRect(-300, -300, 600, 600);
  };
  function dot(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  /** Colour detail strokes (pattern lines on fabric, hatching inside a block). */
  function stroke(c, pts, w, col, a) {
    c.save();
    if (a !== undefined) c.globalAlpha = a;
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); trace(c, pts, false); c.stroke();
    c.restore();
  }

  /* ================================================================ washi */
  let FIBC = null;      // sprite fibre overlay (transparent, light + dark fibres)
  let FIB = null;       // ground fibre luminance, 512x512 tile = 256 world units
  function makeFibres() {
    // sprite overlay: drawn source-atop over every baked sprite
    const a = U.canvas(160, 160), ac = a.ctx;
    const r = U.rng(9137);
    ac.lineCap = 'round';
    for (let i = 0; i < 170; i++) {
      const x = r.range(0, 160), y = r.range(0, 160), ang = r.range(0, TAU), L = r.range(4, 18);
      const light = r.next() < 0.62;
      ac.strokeStyle = light ? 'rgba(255,250,236,0.24)' : 'rgba(70,52,30,0.13)';
      ac.lineWidth = r.range(0.6, 1.4);
      const bx = r.range(-3, 3), by = r.range(-3, 3);
      U.tileDraw(ac, 160, 160, (k, ox, oy) => {
        k.beginPath();
        k.moveTo(x + ox, y + oy);
        k.quadraticCurveTo(x + ox + Math.cos(ang) * L * 0.5 + bx, y + oy + Math.sin(ang) * L * 0.5 + by, x + ox + Math.cos(ang) * L, y + oy + Math.sin(ang) * L);
        k.stroke();
      });
    }
    for (let i = 0; i < 900; i++) {
      ac.fillStyle = r.next() < 0.5 ? 'rgba(255,250,236,0.22)' : 'rgba(60,44,26,0.10)';
      ac.fillRect(r.range(0, 160), r.range(0, 160), 1, 1);
    }
    FIBC = a.c;
    // ground: luminance tile
    const g = U.canvas(512, 512), gc = g.ctx;
    gc.fillStyle = 'rgb(128,128,128)'; gc.fillRect(0, 0, 512, 512);
    gc.lineCap = 'round';
    for (let i = 0; i < 1500; i++) {
      const x = r.range(0, 512), y = r.range(0, 512), ang = r.range(0, TAU), L = r.range(5, 30);
      const light = r.next() < 0.6;
      gc.strokeStyle = light ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.22)';
      gc.lineWidth = r.range(0.5, 1.3);
      const bx = r.range(-5, 5), by = r.range(-5, 5);
      U.tileDraw(gc, 512, 512, (k, ox, oy) => {
        k.beginPath();
        k.moveTo(x + ox, y + oy);
        k.quadraticCurveTo(x + ox + Math.cos(ang) * L * 0.5 + bx, y + oy + Math.sin(ang) * L * 0.5 + by, x + ox + Math.cos(ang) * L, y + oy + Math.sin(ang) * L);
        k.stroke();
      });
    }
    const d = gc.getImageData(0, 0, 512, 512).data;
    FIB = new Float32Array(512 * 512);
    for (let i = 0; i < FIB.length; i++) {
      const n = U.hash2(i & 511, i >> 9, 77) - 0.5;
      FIB[i] = (d[i * 4] - 128) / 128 + n * 0.5;
    }
  }

  /* ========================================================= sprite baking */
  function build(box, fn) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const c = cv.getContext('2d');
    c.setTransform(K, 0, 0, K, -l * K, -t * K);
    c.lineJoin = 'round'; c.lineCap = 'round';
    fn(c);
    // washi fibres print through every block
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = c.createPattern(FIBC, 'repeat');
    c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'source-over';
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  /** Unregistered sprite (no fibres) for small FX. */
  function plain(box, fn) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const c = cv.getContext('2d');
    c.setTransform(K, 0, 0, K, -l * K, -t * K);
    c.lineJoin = 'round'; c.lineCap = 'round';
    fn(c);
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy }; }
  /** Per-pixel colour transform of a baked sprite. fn(d, i, x, y) edits rgba in place. */
  function remap(s, fn) {
    const w = s.c.width, h = s.c.height;
    const { c, ctx } = U.canvas(w, h);
    ctx.drawImage(s.c, 0, 0);
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) if (d[i + 3]) fn(d, i, x, y, w, h);
    ctx.putImageData(img, 0, 0);
    return { c, ox: s.ox, oy: s.oy };
  }
  const RGB_PW = U.hex(PAPER_W), RGB_SUMI = U.hex(SUMI), RGB_VERM = U.hex(C.verm);
  const inkT = (d, i) => { const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; return l < 40 ? 0 : l > 82 ? 1 : (l - 40) / 42; };
  /** Hit flash: only the key block is printed, the colour blocks become bare paper. */
  const flashFn = (d, i) => {
    const t = inkT(d, i);
    d[i] = RGB_SUMI[0] + (RGB_PW[0] - RGB_SUMI[0]) * t; d[i + 1] = RGB_SUMI[1] + (RGB_PW[1] - RGB_SUMI[1]) * t; d[i + 2] = RGB_SUMI[2] + (RGB_PW[2] - RGB_SUMI[2]) * t;
  };
  /** Hurt: the colour blocks re-printed in vermilion. */
  const hurtFn = (d, i) => {
    const t = inkT(d, i), l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
    const r = 150 + 100 * l, g = 40 + 140 * l * l, b = 26 + 110 * l * l;
    d[i] = RGB_SUMI[0] + (r - RGB_SUMI[0]) * t; d[i + 1] = RGB_SUMI[1] + (g - RGB_SUMI[1]) * t; d[i + 2] = RGB_SUMI[2] + (b - RGB_SUMI[2]) * t;
  };
  /** Dissolve frame: the unprinted paper burns away from the top, with an ink + vermilion rim. */
  function dissolve(s, th, seed) {
    return remap(s, (d, i, x, y, w, h) => {
      const v = U.noise(x / (K * 3.4), y / (K * 3.4), seed) * 0.7 + U.noise(x / K, y / K, seed + 9) * 0.08 + (y / h) * 0.32;
      if (v < th) { d[i + 3] = 0; return; }
      if (v < th + 0.03) { d[i] = RGB_SUMI[0]; d[i + 1] = RGB_SUMI[1]; d[i + 2] = RGB_SUMI[2]; return; }
      if (v < th + 0.05) { d[i] = RGB_VERM[0]; d[i + 1] = RGB_VERM[1]; d[i + 2] = RGB_VERM[2]; return; }
      // the colour blocks fade towards bare paper while the sheet burns away
      const t = inkT(d, i) * 0.6;
      d[i] += (RGB_PW[0] - d[i]) * t; d[i + 1] += (RGB_PW[1] - d[i + 1]) * t; d[i + 2] += (RGB_PW[2] - d[i + 2]) * t;
    });
  }
  /** n = normal, f = flash, l* = facing left. */
  function set4(box, fn) {
    const n = build(box, fn), f = remap(n, flashFn);
    return { n, f, nl: flipS(n), fl: flipS(f) };
  }

  /* ============================================================ characters */
  /** Ribbon polygon around an open centre line (width w0 -> w1, round tip) – tongues, sashes, blades. */
  function ribbon(pts, w0, w1) {
    const c = spline(pts, false, 6), n = c.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const p = c[Math.max(0, i - 1)], q = c[Math.min(n - 1, i + 1)];
      const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
      const w = w0 + (w1 - w0) * (i / (n - 1));
      L.push([c[i][0] - (dy / l) * w, c[i][1] + (dx / l) * w]);
      R.push([c[i][0] + (dy / l) * w, c[i][1] - (dx / l) * w]);
    }
    const e = c[n - 1], p = c[n - 2], a = Math.atan2(e[1] - p[1], e[0] - p[0]);
    const tip = arc(e[0], e[1], w1, w1, a + PI / 2, a - PI / 2, 6);
    return L.concat(tip.slice(1, -1)).concat(R.reverse());
  }

  /* ---- main character: a wandering traveller in a wide straw hat ---- */
  // back foot x, back lift, front foot x, front lift, back sleeve, front sleeve (rad, + = forward)
  const HERO_FR = [
    [-2.3, 0, 2.5, 0, 0.08, -0.08],     // 0 idle
    [-4.3, 0, 4.1, 0.25, 0.42, -0.4],   // 1 stride
    [-1.3, 1.7, 1.6, 0, 0.12, -0.12],   // 2 passing
    [4.0, 0.25, -4.2, 0, -0.38, 0.44],  // 3 stride (other leg)
    [1.5, 0, -1.5, 1.7, -0.12, 0.12],   // 4 passing
    [-3.4, 0, 3.6, 0, 0.32, 1.32],      // 5 throw: front sleeve thrust forward
  ];
  function heroLeg(c, hx, fx, lift, back) {
    part(c, capsule(hx, -8.4, fx, -1.7 - lift, 1.55, 1.12), back ? '#6a809e' : bk(-8, -1, '#9db2ca', '#7a90ad'), { ink: 0.7 });
    part(c, ell(fx + 0.75, -0.8 - lift, 2.3, 0.95), back ? C.ochreD : bk(-1.8 - lift, 0.2 - lift, C.ochreL, C.ochre), { ink: 0.55 });
    line(c, [[fx - 0.3, -1.6 - lift], [fx + 1.7, -0.95 - lift]], 0.35, { col: C.vermD });
  }
  /** Small paper-white kasuri cross woven into the indigo cloth. */
  function kasuri(k, x, y) {
    k.strokeStyle = 'rgba(246,238,220,0.88)'; k.lineWidth = 0.42; k.lineCap = 'round';
    k.beginPath(); k.moveTo(x - 0.55, y - 0.55); k.lineTo(x + 0.55, y + 0.55); k.moveTo(x + 0.55, y - 0.55); k.lineTo(x - 0.55, y + 0.55); k.stroke();
  }
  function heroSleeve(c, sx, sy, ang, back) {
    const loc = [[-1.9, -0.6], [1.9, -0.6], [2.6, 5.0], [2.3, 7.7], [-0.3, 8.5], [-2.5, 7.4], [-2.7, 3.0]];
    const hand = xf([[0.3, 9.1]], sx, sy, 1, -ang)[0];
    if (back) part(c, ell(hand[0], hand[1], 1.2, 1.1), C.skinD, { ink: 0.5 });
    part(c, xf(spline(loc, true, 5), sx, sy, 1, -ang), back ? C.indigoD : lin(sx - 2, sy, sx + 2, sy + 8, [0, C.indigoL, 1, C.indigo]), {
      ink: 0.85,
      detail: back ? null : (k) => {
        for (const p of xf([[-0.8, 2.4], [1.0, 4.6], [-1.2, 6.2]], sx, sy, 1, -ang)) kasuri(k, p[0], p[1]);
      },
    });
    if (!back) part(c, ell(hand[0], hand[1], 1.25, 1.15), C.skin, { ink: 0.5 });
  }
  function heroParts(c, f) {
    const F = HERO_FR[f];
    // scabbard behind the body (black lacquer, gold end cap)
    line(c, [[1.2, -12.8], [-12.0, -7.5]], 1.9, { taper: 0.4, vary: 0.05, side: 0 });
    part(c, ell(-12.1, -7.45, 1.05, 1.05), C.gold, { ink: 0.45 });
    heroSleeve(c, -2.6, -19.6, F[4], true);
    // travel bundle (furoshiki) on the back
    part(c, spline([[-6.2, -20.0], [-3.4, -19.6], [-3.0, -15.6], [-4.6, -13.2], [-7.6, -13.6], [-9.2, -16.4], [-8.4, -19.2]], true, 5),
      bk(-20, -13, '#efe2bf', '#d4bf8f'), { ink: 0.75, detail(k) { for (const p of [[-7.4, -17.8], [-5.2, -16.4], [-7.2, -15.0], [-5.6, -18.6]]) dot(k, p[0], p[1], 0.5, C.indigo); } });
    heroLeg(c, -1.4, F[0], F[1], true);
    heroLeg(c, 1.5, F[2], F[3], false);
    // kimono, tucked up for walking
    const body = spline([[-4.4, -20.6], [0.2, -21.3], [4.6, -20.4], [5.6, -15.5], [6.4, -8.8], [5.2, -6.9], [0.2, -6.5], [-5.0, -6.9], [-6.0, -9.0], [-5.4, -15.5]], true, 5);
    part(c, body, bk(-21.3, -6.5, C.indigoL, C.indigoD), {
      ink: 1.0,
      detail(k) {
        for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) kasuri(k, -4.6 + i * 2.6 + (j & 1) * 1.3, -19.2 + j * 2.7);
        // white under-collar
        k.fillStyle = PAPER_W;
        k.beginPath(); k.moveTo(-0.9, -21.0); k.lineTo(0.5, -21.2); k.lineTo(2.9, -14.6); k.lineTo(1.9, -14.4); k.closePath(); k.fill();
      },
    });
    line(c, [[2.6, -14.3], [3.3, -6.8]], 0.45, { taper: 0.5 });
    line(c, [[0.4, -21.0], [2.7, -14.4]], 0.4, { taper: 0.3 });
    // vermilion obi
    part(c, poly([[-5.75, -14.1], [5.85, -14.5], [6.1, -11.3], [-5.9, -11.0]], true, 0.7), bk(-14.5, -11, C.vermL, C.vermD), {
      ink: 0.65, detail(k) { stroke(k, [[-5.8, -12.6], [6.0, -12.9]], 0.32, C.ochreL, 0.9); },
    });
    // sword hilt in front
    line(c, [[3.0, -12.9], [8.7, -16.0]], 1.45, { taper: 0.3, side: 0 });
    for (let i = 0; i < 3; i++) dot(c, 4.9 + i * 1.3, -14.0 - i * 0.72, 0.28, C.ochreL);
    part(c, ell(3.4, -13.1, 0.75, 1.5, -0.5), C.gold, { ink: 0.4 });
    // face under the hat
    part(c, ell(-0.7, -21.0, 1.9, 2.0), SUMI, { ink: 0.35 });
    part(c, ell(1.9, -20.3, 3.3, 2.85), bk(-23.2, -17.5, C.skin, C.skinD), { ink: 0.65 });
    sline(c, [[3.0, -21.15], [3.85, -21.45], [4.7, -21.05]], 0.5);
    line(c, [[5.0, -20.6], [5.35, -19.7]], 0.32, { taper: 0.25 });
    line(c, [[4.0, -18.7], [4.7, -18.75]], 0.3);
    dot(c, 3.0, -19.7, 0.55, 'rgba(214,120,100,0.55)');
    // vermilion hat cord
    // sugegasa: shallow straw cone
    const apex = [0.9, -32.6];
    const brim = arc(0.5, -24.2, 11.6, 1.5, 0, PI, 18);
    const hat = poly([apex, [12.1, -24.2]], false, 0.8).concat(brim.slice(1, -1)).concat(poly([[-11.1, -24.2], apex], false, 0.8).slice(0, -1));
    part(c, hat, lin(0, -32.5, 0, -22.7, [0, '#f3dea4', 0.5, '#dcb76a', 1, '#b48a43']), {
      ink: 1.1,
      detail(k) { stroke(k, arc(0.5, -24.4, 10.4, 0.9, 0.15, PI - 0.15, 14), 0.4, C.ochreD, 0.9); },
    });
    for (let i = -3; i <= 3; i++) {
      const bx = 0.5 + i * 3.25, by = -23.5 - Math.abs(i) * 0.12;
      line(c, [[0.9 + (bx - 0.9) * 0.12, -31.7], [bx, by]], 0.26, { col: '#6b5330', taper: 1.2 });
    }
  }

  /* ---- small creature: kappa (water imp with a dish on its head) ---- */
  function kfoot(x, y) { return spline([[x - 1.5, y - 1.4], [x + 1.8, y - 1.3], [x + 2.9, y - 0.2], [x + 1.4, y + 0.25], [x - 1.5, y + 0.15]], true, 4); }
  function kappaParts(c, f, v) {
    const P = KAPPA_V[v];
    const st = [0, 1, 0, -1][f];
    const lift = (s) => Math.max(0, s) * 1.2;
    const shell = spline([[-3.0, -15.4], [-7.2, -13.6], [-8.9, -8.6], [-7.6, -3.6], [-3.4, -2.6], [-2.2, -8.8]], true, 6);
    part(c, shell, lin(-9, -15, -2, -3, [0, '#a37d4f', 1, '#5a3f28']), {
      ink: 0.85,
      detail(k) {
        for (const s of [[[-7.0, -11.8], [-5.0, -12.4], [-3.4, -11.0]], [[-8.0, -8.0], [-5.6, -8.8], [-3.6, -7.6]], [[-5.0, -12.4], [-5.6, -8.8], [-5.2, -5.0]], [[-7.6, -4.8], [-5.2, -5.0], [-3.4, -4.2]]]) stroke(k, s, 0.42, '#3b2a1c', 0.85);
      },
    });
    const bfx = -2.6 + st * 1.4, bfy = -lift(st);
    part(c, capsule(-2.2, -5.0, bfx, bfy - 1.1, 1.5, 1.2), P.d, { ink: 0.7 });
    part(c, kfoot(bfx, bfy), P.d, { ink: 0.6 });
    part(c, capsule(-0.6, -11.4, -2.6 - st * 0.9, -6.8, 1.05, 0.9), P.d, { ink: 0.6 });
    const body = spline([[-4.4, -14.8], [0.6, -15.8], [4.8, -13.6], [5.6, -8.0], [4.0, -3.2], [-0.4, -2.2], [-4.2, -3.6], [-5.4, -9.0]], true, 6);
    part(c, body, bk(-16, -2, P.l, P.d), { ink: 0.95 });
    part(c, ell(2.7, -8.4, 2.5, 4.6, 0.12), bk(-13, -3.8, '#f2e2b4', '#cdae70'), {
      ink: 0.55, detail(k) { for (const y of [-10.6, -8.4, -6.2]) stroke(k, [[0.6, y + 0.3], [2.6, y - 0.2], [4.8, y + 0.3]], 0.3, '#9a7b45', 0.9); },
    });
    const ffx = 2.2 - st * 1.4, ffy = -lift(-st);
    part(c, capsule(1.8, -4.6, ffx, ffy - 1.1, 1.55, 1.25), P.b, { ink: 0.7 });
    part(c, kfoot(ffx, ffy), P.b, { ink: 0.6 });
    const head = spline([[-3.8, -19.6], [0.8, -22.4], [5.4, -20.8], [6.6, -17.2], [5.0, -13.6], [0.6, -12.6], [-3.8, -14.2], [-4.8, -17.0]], true, 6);
    part(c, head, bk(-22.4, -12.6, P.l, P.b), { ink: 0.95 });
    part(c, spline([[5.2, -18.8], [8.2, -17.9], [10.5, -16.2], [8.0, -15.0], [5.0, -14.9]], true, 5), bk(-18.8, -14.9, C.ochreL, C.ochreD), { ink: 0.7 });
    line(c, [[5.9, -16.6], [9.7, -16.3]], 0.38);
    part(c, ell(2.7, -18.5, 1.95, 2.15), PAPER_W, { ink: 0.5, paper: false, reg: 0 });
    dot(c, 3.4, -18.3, 1.02, SUMI); dot(c, 3.05, -18.75, 0.32, PAPER_W);
    sline(c, [[0.7, -21.0], [2.8, -21.5], [4.9, -20.7]], 0.62);
    // spiky hair fringe (solid key block) around the water dish
    const fr = [];
    for (let i = 0; i <= 16; i++) { const a = PI * 1.04 + (i / 16) * PI * 0.92, r = i & 1 ? 1.0 : 1.32; fr.push([0.6 + Math.cos(a) * 5.0 * r, -20.2 + Math.sin(a) * 2.5 * r]); }
    for (let i = 10; i >= 0; i--) { const a = PI * 1.04 + (i / 10) * PI * 0.92; fr.push([0.6 + Math.cos(a) * 4.3, -20.6 + Math.sin(a) * 1.4]); }
    part(c, fr, '#2b2724', { ink: 0.45 });
    part(c, ell(0.6, -22.2, 3.2, 1.15), lin(-2.6, -23.3, 3.8, -21.1, [0, '#eef2e6', 1, '#b9cbc4']), { ink: 0.5, detail(k) { stroke(k, arc(0.8, -22.1, 2.0, 0.55, 0.2, PI - 0.2, 8), 0.3, C.prusL, 0.9); } });
    part(c, capsule(2.0, -11.8, 5.6 + st * 0.6, -8.7, 1.1, 0.95), P.b, { ink: 0.65 });
    part(c, spline([[5.0, -9.6], [7.4, -9.8], [8.0, -8.3], [7.3, -7.2], [5.5, -7.5]], true, 4), P.l, { ink: 0.5 });
  }

  /* ---- fast creature: chochin-obake (haunted paper lantern) ---- */
  function lanternParts(c, f) {
    const ph = (f / 4) * TAU;
    line(c, arc(0, -21.8, 1.7, 1.6, PI, TAU, 10), 0.5, { taper: 0.3 });
    part(c, rrect(-4.6, -21.7, 9.2, 3.0, 0.9), bk(-21.7, -18.7, '#4c423b', SUMI), { ink: 0.6, detail(k) { stroke(k, [[-4.6, -19.8], [4.6, -19.8]], 0.55, C.verm); } });
    const body = spline([[-4.4, -18.9], [0, -19.3], [4.4, -18.9], [6.6, -15.4], [7.2, -10.8], [6.6, -6.4], [4.4, -3.0], [0, -2.6], [-4.4, -3.0], [-6.6, -6.4], [-7.2, -10.8], [-6.6, -15.4]], true, 6);
    part(c, body, (k) => {
      k.fillStyle = grad(k, -7.3, 0, 7.3, 0, [0, '#cf9450', 0.22, '#ecd3a0', 0.5, '#f8ecd2', 0.78, '#edd5a4', 1, '#cb8f4c']);
      k.fillRect(-20, -30, 40, 40);
      const g = k.createRadialGradient(0.6, -10.6, 0, 0.6, -10.6, 6.8);
      g.addColorStop(0, 'rgba(255,212,112,0.6)'); g.addColorStop(1, 'rgba(255,212,112,0)');
      k.fillStyle = g; k.fillRect(-20, -30, 40, 40);
    }, { ink: 0.9 });
    for (const y of [-16.4, -13.6, -10.8, -8.0, -5.4]) {
      const t = (y + 19) / 16.4, w = 4.3 + 2.75 * Math.sin(PI * t);
      const pts = [];
      for (let i = 0; i <= 10; i++) { const x = -w + (2 * w * i) / 10; pts.push([x, y + 0.6 * (1 - (x / w) ** 2)]); }
      line(c, pts, 0.3, { taper: 0.7, vary: 0.2 });
    }
    line(c, [[-6.3, -12.6], [-5.2, -11.4], [-6.0, -9.8], [-5.2, -8.8]], 0.32, { taper: 0.3 });
    // torn mouth and the long lolling tongue
    part(c, poly([[-0.6, -8.6], [1.0, -9.4], [2.4, -8.7], [3.8, -9.5], [5.4, -8.8], [6.3, -7.2], [5.2, -5.0], [3.6, -5.8], [2.2, -4.8], [0.6, -5.6], [-0.4, -6.6]], true, 0.6), '#4a1d16', { ink: 0.55, paper: false, reg: 0 });
    const sw = Math.sin(ph) * 0.9;
    const tg = ribbon([[3.0, -6.2], [5.4, -4.6], [7.0 + sw * 0.6, -2.0], [6.8 + sw, 0.6]], 1.35, 1.05);
    part(c, tg, bk(-6, 1.6, '#e57460', '#b9392b'), { ink: 0.55 });
    sline(c, [[4.0, -5.4], [5.8, -3.6], [6.6 + sw * 0.8, -0.8]], 0.25, { col: '#7d2219' });
    // one big eye, one squinting
    part(c, ell(2.5, -13.4, 2.6, 2.85), PAPER_W, { ink: 0.6, paper: false, reg: 0 });
    dot(c, 3.25, -13.1, 1.3, SUMI); dot(c, 2.8, -13.7, 0.4, PAPER_W);
    sline(c, [[-0.2, -16.6], [2.4, -17.2], [5.0, -16.4]], 0.55);
    sline(c, [[-3.6, -14.0], [-2.4, -14.8], [-1.1, -14.1]], 0.5);
    part(c, rrect(-4.7, -3.5, 9.4, 3.1, 0.9), bk(-3.5, -0.4, '#4c423b', SUMI), { ink: 0.6, detail(k) { stroke(k, [[-4.7, -2.4], [4.7, -2.4]], 0.5, C.verm); } });
  }

  /* ---- large creature: oni with an iron club ---- */
  function onifoot(x, y) { return spline([[x - 3.6, y - 2.7], [x + 2.8, y - 2.9], [x + 5.1, y - 1.2], [x + 4.6, y + 0.25], [x - 3.9, y + 0.25]], true, 4); }
  function horn(x, y, dir) { return spline([[x - 1.6, y + 0.9], [x - 1.0 + dir * 0.5, y - 3.6], [x + dir * 1.5, y - 7.3], [x + 1.0 + dir * 0.3, y - 3.4], [x + 1.6, y + 0.9]], true, 4); }
  function oniParts(c, f, v) {
    const O = ONI_V[v];
    const st = [0, 1, 0, -1][f];
    const lift = (s) => Math.max(0, s) * 2.2;
    const bfx = -6.8 + st * 2.4, bfy = -lift(st);
    part(c, capsule(-5.8, -14.0, bfx, bfy - 2.4, 4.3, 3.3), O.d, { ink: 1.1 });
    part(c, onifoot(bfx, bfy), O.d, { ink: 0.9 });
    part(c, capsule(-11.5, -34.5, -15.2, -22.0 + st * 0.6, 3.7, 3.0), O.d, { ink: 1.05 });
    part(c, ell(-15.4, -20.4 + st * 0.6, 3.1, 3.0), O.d, { ink: 0.95 });
    const torso = spline([[-12.4, -37.6], [0.4, -39.6], [12.2, -37.4], [14.0, -29.6], [12.6, -19.6], [0.6, -16.2], [-12.2, -19.0], [-14.2, -28.6]], true, 6);
    part(c, torso, rad(1, -32, 1, 18, [0, O.l, 0.55, O.s, 1, O.d]), { ink: 1.35 });
    sline(c, [[-7.4, -33.0], [-3.6, -30.4], [0.4, -31.6]], 0.55);
    sline(c, [[2.8, -31.6], [6.6, -30.2], [9.8, -32.8]], 0.55);
    sline(c, [[1.5, -27.8], [1.2, -25.6], [1.7, -23.4]], 0.45);
    line(c, arc(1.6, -21.6, 0.9, 0.6, 0.2, PI - 0.2, 6), 0.4, { taper: 0.3 });
    // tiger-skin loincloth
    const cloth = poly([[-13.0, -21.2], [13.2, -21.6], [12.6, -13.6], [9.4, -10.4], [6.0, -12.6], [2.6, -9.6], [-0.8, -12.4], [-4.4, -9.8], [-7.8, -12.6], [-11.0, -10.6], [-12.8, -14.0]], true, 0.6);
    part(c, cloth, bk(-21.6, -10, C.ochreL, C.ochreD), {
      ink: 1.0,
      detail(k) {
        k.fillStyle = SUMI;
        for (const [x, sk, len] of [[-10.6, 0.8, 6], [-6.4, -0.6, 7.5], [-2.0, 0.9, 6.4], [2.4, -0.7, 7.8], [6.8, 0.6, 6.6], [10.8, -0.5, 5.6]]) {
          k.beginPath(); k.moveTo(x - 1.0, -22); k.lineTo(x + 1.0, -22); k.lineTo(x + sk + 0.25, -22 + len); k.lineTo(x + sk - 0.2, -22 + len + 0.3); k.closePath(); k.fill();
        }
      },
    });
    const ffx = 6.8 - st * 2.4, ffy = -lift(-st);
    part(c, capsule(6.0, -14.0, ffx, ffy - 2.4, 4.4, 3.4), bk(-14, 0, O.s, O.d), { ink: 1.15 });
    part(c, onifoot(ffx, ffy), O.s, { ink: 0.95 });
    part(c, rrect(ffx - 3.3, ffy - 5.8, 6.6, 1.7, 0.7), C.gold, { ink: 0.5 });
    // wild mane
    const mane = [];
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, r = i & 1 ? 8.2 : 10.8; mane.push([-0.8 + Math.cos(a) * r * 1.05, -45.0 + Math.sin(a) * r * 0.92]); }
    part(c, spline(mane, true, 3), '#2a2422', { ink: 0.7 });
    part(c, horn(-2.6, -51.0, -1), lin(0, -59, 0, -50, [0, '#fbf3dc', 1, '#cdb88c']), { ink: 0.75 });
    part(c, horn(6.6, -50.8, 1), lin(0, -59, 0, -50, [0, '#fbf3dc', 1, '#cdb88c']), { ink: 0.75 });
    const face = spline([[-4.6, -49.0], [2.6, -51.6], [9.6, -48.6], [11.4, -43.0], [10.2, -37.8], [3.6, -35.4], [-3.6, -37.2], [-5.6, -42.8]], true, 6);
    part(c, face, bk(-51.6, -35.4, O.l, O.s), { ink: 1.25 });
    part(c, poly([[-1.8, -47.0], [3.4, -48.8], [4.6, -46.4], [0.0, -45.2]], true, 0.5), SUMI, { ink: 0.4, paper: false, reg: 0 });
    part(c, poly([[5.6, -48.6], [10.8, -47.0], [9.9, -44.9], [6.0, -45.8]], true, 0.5), SUMI, { ink: 0.4, paper: false, reg: 0 });
    part(c, ell(1.9, -43.4, 2.3, 1.85), C.goldL, { ink: 0.6, paper: false, reg: 0 });
    part(c, ell(8.0, -43.2, 2.1, 1.75), C.goldL, { ink: 0.6, paper: false, reg: 0 });
    dot(c, 2.65, -43.3, 1.0, SUMI); dot(c, 8.7, -43.1, 0.95, SUMI);
    sline(c, [[4.6, -42.6], [5.7, -40.4], [4.3, -39.7], [6.8, -39.8]], 0.6);
    part(c, spline([[0.2, -38.6], [5.2, -37.4], [10.0, -39.0], [9.0, -36.4], [5.0, -35.6], [1.2, -36.4]], true, 5), '#5a1812', { ink: 0.65, paper: false, reg: 0 });
    part(c, poly([[1.6, -36.8], [3.0, -36.7], [2.4, -39.7]], true, 0.4), C.ivory, { ink: 0.38, paper: false, reg: 0 });
    part(c, poly([[7.4, -36.6], [8.8, -36.9], [8.5, -39.9]], true, 0.4), C.ivory, { ink: 0.38, paper: false, reg: 0 });
    // kanabo held upright in the front fist
    const gx = 13.4, gy = -22.6 + st * 0.4, tx = 17.2, ty = -56.4 + st * 0.4;
    part(c, capsule(gx - 0.4, gy + 3.8, tx, ty, 1.15, 3.2), lin(gx - 3, 0, gx + 3, 0, [0, '#5c6474', 1, '#2f343e']), { ink: 1.05 });
    {
      const dx = tx - gx, dy = ty - gy, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      for (let t = 0.36; t < 0.97; t += 0.085) {
        const r = 1.15 + (3.2 - 1.15) * t;
        for (const sgn of [-0.5, 0.15]) {
          const x = gx + dx * t + nx * r * sgn, y = gy + dy * t + ny * r * sgn;
          dot(c, x, y, 0.6, SUMI); dot(c, x - 0.12, y - 0.12, 0.4, '#c9bd98');
        }
      }
    }
    part(c, capsule(9.6, -35.2, 13.0, -24.8 + st * 0.4, 3.9, 3.2), bk(-36, -22, O.l, O.s), { ink: 1.1 });
    part(c, xf(rrect(-3.3, -0.95, 6.6, 1.9, 0.7), 11.3, -30.2, 1, 0.28), C.gold, { ink: 0.5 });
    part(c, ell(13.4, -22.8 + st * 0.4, 3.3, 3.0), O.s, { ink: 1.0 });
    sline(c, [[12.0, -24.6], [12.6, -22.8], [12.1, -21.0]], 0.4);
  }

  /* ================================================================ props */
  /** Flat cloud-like foliage pad: lumpy top, flattened underside. */
  function padPts(cx, cy, rx, ry, sd) {
    const out = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU, s = Math.sin(a), co = Math.cos(a);
      const bump = s < 0 ? 1 + 0.13 * Math.sin(a * 6 + sd) : 1;
      out.push([cx + co * rx * bump, cy + s * ry * (s > 0 ? 0.5 : 1.0) * bump]);
    }
    return spline(out, true, 4);
  }
  /** Lumpy round crown lobe. */
  function lobePts(cx, cy, rx, ry, sd, n) {
    n = n || 9;
    const out = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * TAU, r = i & 1 ? 0.9 : 1.04 + 0.05 * Math.sin(i * 1.7 + sd);
      out.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
    }
    return spline(out, true, 3);
  }
  function lance(x, y, a, len, w) {
    const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
    return spline([[x, y], [x + dx * len * 0.35 + nx * w, y + dy * len * 0.35 + ny * w], [x + dx * len, y + dy * len], [x + dx * len * 0.35 - nx * w, y + dy * len * 0.35 - ny * w]], true, 5);
  }
  /** Maple leaf: a five-lobed star. */
  function mleaf(k, x, y, s, rot, col) {
    k.fillStyle = col; k.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i / 10) * TAU - PI / 2, r = (i & 1 ? 0.42 : 1) * s;
      if (i) k.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else k.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    k.closePath(); k.fill();
  }
  function blossom(k, x, y, s, col, mid) {
    k.fillStyle = col; k.beginPath();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - PI / 2, px = x + Math.cos(a) * s * 0.75, py = y + Math.sin(a) * s * 0.75; k.moveTo(px + s * 0.55, py); k.arc(px, py, s * 0.55, 0, TAU); }
    k.fill();
    dot(k, x, y, s * 0.35, mid);
  }
  function bark(k, x0, y0, x1, y1, n, sd) {
    const r = U.rng(sd);
    for (let i = 0; i < n; i++) {
      const t = r.next(), x = x0 + (x1 - x0) * t + r.range(-0.9, 0.9), y = y0 + (y1 - y0) * t;
      stroke(k, arc(x, y, 0.9, 0.5, 0.2, PI - 0.2, 5), 0.32, C.barkD, 0.8);
    }
  }
  const PINE_V = [
    { trunk: [[0, 0], [1.2, -10], [-1.6, -22], [1.4, -34], [3.6, -46], [2, -56]], pads: [[-11, -31, 10, 4.4], [12, -38, 11.5, 4.8], [-6, -47, 12, 5.0], [9, -55, 9.5, 4.4], [0.5, -63, 7.5, 3.6]] },
    { trunk: [[0, 0], [-2.4, -11], [-1.0, -22], [4, -31], [9, -38], [13, -44]], pads: [[-12, -27, 9, 4.0], [-6, -40, 8.5, 3.8], [3, -35, 12, 4.8], [17, -44, 10, 4.4], [8, -52, 9.5, 4.2]] },
  ];
  function pineParts(c, v) {
    const P = PINE_V[v];
    const tr = P.trunk;
    // branches to every pad
    for (const pd of P.pads) {
      let best = tr[0], bd = 1e9;
      for (const q of tr) { const d = Math.abs(q[1] - pd[1] - 3); if (d < bd) { bd = d; best = q; } }
      part(c, ribbon([[best[0], best[1] + 1], [(best[0] + pd[0]) / 2, (best[1] + pd[1]) / 2 + 1.5], [pd[0] * 0.8 + best[0] * 0.2, pd[1] + 1.2]], 1.3, 0.55), C.bark, { ink: 0.6 });
    }
    part(c, ribbon(tr, 3.3, 1.2), lin(-4, 0, 4, 0, [0, C.barkL, 1, C.barkD]), { ink: 1.0, detail(k) { bark(k, 0, -2, 2, -50, 16, 41 + v); } });
    const pads = P.pads.slice().sort((a, b) => a[1] - b[1]);
    pads.forEach((pd, i) => {
      const [cx, cy, rx, ry] = pd;
      part(c, padPts(cx, cy, rx, ry, i * 2.1 + v), bk(cy - ry, cy + ry * 0.5, C.pineL, C.pineD), {
        ink: 0.95,
        detail(k) {
          // fan-shaped needle clusters
          for (let x = cx - rx * 0.78; x <= cx + rx * 0.8; x += 3.1) {
            const ox = x, oy = cy - ry * 0.2;
            for (let j = -3; j <= 3; j++) { const a = j * 0.32; stroke(k, [[ox, oy], [ox + Math.sin(a) * ry * 0.95, oy + Math.cos(a) * ry * 0.7]], 0.3, C.pineD, 0.85); }
            stroke(k, [[ox - 1.2, oy - ry * 0.35], [ox + 1.2, oy - ry * 0.35]], 0.45, '#9db27c', 0.7);
          }
        },
      });
    });
  }
  const MAPLE_PAL = [['#ef9558', '#cc4a2c', '#8c2a1a'], ['#f3cd68', '#dc9d38', '#9c6a22']];
  function mapleParts(c, v) {
    const pal = MAPLE_PAL[v];
    const lobes = [[0, -42, 11, 8.5], [-9.5, -33, 9, 7.5], [9, -34, 10, 8], [-1, -27, 9, 6.2]];
    part(c, ribbon([[0, 0], [0.8, -10], [-0.4, -20], [0.6, -28]], 2.6, 1.5), lin(-3, 0, 3, 0, [0, C.barkL, 1, C.barkD]), { ink: 0.9, detail(k) { bark(k, 0, -2, 0, -20, 7, 77 + v); } });
    for (const [bx, by] of [[-8, -31], [8, -33], [0, -40]]) part(c, ribbon([[0.2, -19], [bx * 0.6, by * 0.8], [bx, by]], 1.0, 0.5), C.bark, { ink: 0.55 });
    lobes.forEach((lb, i) => {
      const [cx, cy, rx, ry] = lb;
      const r = U.rng(500 + i * 13 + v);
      part(c, lobePts(cx, cy, rx, ry, i * 1.3 + v), bk(cy - ry, cy + ry, pal[0], pal[2]), {
        ink: 0.85,
        detail(k) {
          for (let j = 0; j < 9; j++) mleaf(k, cx + r.range(-rx, rx) * 0.8, cy + r.range(-ry, ry) * 0.8, r.range(1.1, 1.7), r.range(-0.5, 0.5), j % 3 ? pal[0] : pal[2]);
          for (let j = 0; j < 4; j++) mleaf(k, cx + r.range(-rx, rx) * 0.7, cy - ry * r.range(0.3, 0.8), 1.2, r.range(-0.5, 0.5), '#f7d79a');
        },
      });
    });
  }
  function cherryParts(c, v) {
    const lobes = v ? [[-11, -36, 9, 6], [10, -38, 10, 6.5], [0, -45, 10, 6.5], [-2, -32, 9, 5.5], [18, -31, 6, 4.4]]
      : [[-14, -33, 8, 5.4], [12, -35, 9.5, 6], [-3, -43, 11, 6.6], [0, -30, 9, 5.4], [-20, -27, 6, 4]];
    // gnarled trunk with spreading limbs
    part(c, ribbon([[0, 0], [1.5, -9], [-1.2, -18], [1.2, -26]], 3.0, 1.6), lin(-4, 0, 4, 0, [0, '#7d6a63', 1, '#3e302c']), { ink: 1.0, detail(k) { for (let y = -3; y > -24; y -= 3.4) stroke(k, [[-1.2, y], [1.2, y - 0.3]], 0.35, '#2c221f', 0.7); } });
    for (const lb of lobes) part(c, ribbon([[0.5, -18], [lb[0] * 0.55, (lb[1] - 18) / 2], [lb[0], lb[1] + 2]], 1.1, 0.5), '#4d3d37', { ink: 0.55 });
    lobes.forEach((lb, i) => {
      const [cx, cy, rx, ry] = lb;
      const r = U.rng(900 + i * 7 + v);
      part(c, lobePts(cx, cy, rx, ry, i * 0.9 + v, 8), bk(cy - ry, cy + ry, '#fbe4e2', '#dc97a0'), {
        ink: 0.7,
        detail(k) {
          for (let j = 0; j < 7; j++) blossom(k, cx + r.range(-rx, rx) * 0.75, cy + r.range(-ry, ry) * 0.7, r.range(0.9, 1.3), j & 1 ? C.pinkW : '#f3b9c0', '#c8545e');
        },
      });
    });
  }
  function toroParts(c) {
    const stoneV = (y0, y1) => bk(y0, y1, C.stoneL, C.stone);
    part(c, poly([[-6.2, 0], [6.2, 0], [5.2, -2.7], [-5.2, -2.7]], true, 0.6), stoneV(-2.7, 0), { ink: 0.8 });
    part(c, rrect(-2.2, -13.2, 4.4, 10.8, 0.8), lin(-2.2, 0, 2.2, 0, [0, C.stoneL, 1, C.stone]), { ink: 0.75 });
    part(c, poly([[-5.6, -13.0], [5.6, -13.0], [4.6, -15.4], [-4.6, -15.4]], true, 0.6), stoneV(-15.4, -13), { ink: 0.75 });
    part(c, rrect(-3.9, -22.4, 7.8, 7.2, 0.4), stoneV(-22.4, -15.2), { ink: 0.8 });
    part(c, rrect(-2.1, -21.0, 4.2, 4.4, 0.3), rad(0, -18.8, 0, 3.2, [0, '#fff3c6', 0.5, '#f3c862', 1, '#c98a36']), { ink: 0.5, paper: false });
    part(c, spline([[-8.8, -22.2], [-6.6, -23.4], [-3.0, -26.6], [0, -27.9], [3.0, -26.6], [6.6, -23.4], [8.8, -22.2], [6.8, -21.6], [0, -21.9], [-6.8, -21.6]], true, 4), bk(-28, -21.6, C.stoneL, C.stoneD), { ink: 0.95 });
    part(c, spline([[0, -33.6], [1.5, -31.4], [1.7, -29.4], [0.0, -27.6], [-1.7, -29.4], [-1.5, -31.4]], true, 4), stoneV(-33.6, -27.6), { ink: 0.6 });
    for (const [x, y, r] of [[-4.6, -23.6, 0.7], [-2.8, -24.9, 0.55], [4.2, -0.9, 0.6], [-4.4, -1.2, 0.5], [3.4, -23.2, 0.5]]) dot(c, x, y, r, '#6f8a52');
  }
  function toriiParts(c) {
    const vg = (x0, x1) => lin(x0, 0, x1, 0, [0, C.vermL, 0.5, C.verm, 1, C.vermD]);
    part(c, poly([[-19.8, 0], [-16.4, 0], [-16.9, -38.2], [-19.3, -38.2]], true, 0.8), vg(-20, -16.4), { ink: 1.0 });
    part(c, poly([[16.4, 0], [19.8, 0], [19.3, -38.2], [16.9, -38.2]], true, 0.8), vg(16.4, 20), { ink: 1.0 });
    part(c, rrect(-20.8, -3.6, 5.4, 3.6, 0.6), '#2a2523', { ink: 0.6 });
    part(c, rrect(15.4, -3.6, 5.4, 3.6, 0.6), '#2a2523', { ink: 0.6 });
    part(c, poly([[-24.6, -31.0], [24.6, -31.0], [24.6, -28.2], [-24.6, -28.2]], true, 0.8), bk(-31, -28.2, C.vermL, C.vermD), { ink: 0.85 });
    part(c, rrect(-1.3, -36.2, 2.6, 5.4, 0.2), C.verm, { ink: 0.6 });
    part(c, poly([[-23.4, -38.4], [23.4, -38.4], [23.4, -35.9], [-23.4, -35.9]], true, 0.8), bk(-38.4, -35.9, C.vermL, C.vermD), { ink: 0.8 });
    part(c, spline([[-28.6, -43.4], [-22.0, -40.4], [0, -39.6], [22.0, -40.4], [28.6, -43.4], [27.9, -45.2], [22.0, -43.4], [0, -42.6], [-22.0, -43.4], [-27.9, -45.2]], true, 4), bk(-45, -39.6, '#4a423d', SUMI), { ink: 0.9 });
  }
  const STONE_V = [
    [[-10.5, 0.2], [-11, -4.4], [-7.4, -9.6], [-1.6, -11.0], [4.8, -9.4], [9.6, -5.0], [10.6, -0.4]],
    [[-7.4, 0.2], [-7.6, -3.0], [-4.6, -7.0], [0.6, -8.2], [5.4, -6.4], [7.6, -2.6], [7.2, 0.2]],
    [[-13.4, 0.2], [-12.4, -5.6], [-8.0, -12.6], [-3.6, -14.6], [0.6, -11.0], [5.4, -7.0], [10.0, -5.0], [12.2, -0.4]],
  ];
  function stoneParts(c, v) {
    const pts = STONE_V[v];
    const top = Math.min(...pts.map((p) => p[1]));
    const r = U.rng(310 + v);
    c.scale(1.3, 1.3);
    if (v === 0) part(c, spline([[8.0, 0.2], [8.6, -2.8], [12.4, -4.0], [15.6, -2.2], [15.2, 0.2]], true, 4), bk(-4, 0, C.stoneL, C.stoneD), { ink: 0.75 });
    part(c, spline(pts, true, 4), lin(-8, top, 6, 0, [0, C.stoneL, 0.55, C.stone, 1, C.stoneD]), {
      ink: 1.0,
      detail(k) {
        for (let i = 0; i < 9; i++) {
          const x = r.range(-8, 8), y = r.range(top * 0.8, -1.5);
          stroke(k, [[x, y], [x + 1.4, y + 1.6]], 0.42, C.stoneD, 0.75);
        }
        for (let i = 0; i < 7; i++) dot(k, r.range(-6, 6), top + r.range(0.6, 2.6), r.range(0.45, 0.9), i & 1 ? '#6f8a52' : '#8fa36a');
      },
    });
  }
  function bambooParts(c) {
    const stalks = [[-7.2, 50, -1.6], [-3.0, 60, 0.6], [1.4, 54, 2.4], [5.2, 62, 1.0], [8.6, 46, 3.2]];
    const r = U.rng(222);
    for (const [x, h, lean] of stalks) {
      part(c, capsule(x, 0, x + lean, -h, 1.05, 0.75), lin(x - 1, 0, x + 1, 0, [0, '#a9c77c', 1, '#4f7a45']), { ink: 0.6 });
      for (let y = -6; y > -h + 3; y -= 6.4) { const xx = x + lean * (-y / h); line(c, [[xx - 1.25, y], [xx + 1.25, y + 0.15]], 0.42, { taper: 0.3, side: 0 }); }
    }
    for (let i = 0; i < 16; i++) {
      const s = stalks[i % 5], t = r.range(0.45, 0.95), x = s[0] + s[2] * t, y = -s[1] * t;
      const a = r.range(-1.9, 1.9);
      part(c, lance(x, y, a, r.range(6, 8.5), r.range(0.9, 1.3)), bk(y - 6, y + 6, '#7f9f5c', C.pineD), { ink: 0.45 });
    }
  }
  function jizoParts(c) {
    part(c, rrect(-4.8, -2.4, 9.6, 2.6, 0.8), bk(-2.4, 0, C.stoneL, C.stone), { ink: 0.6 });
    part(c, spline([[-3.6, -2.1], [-4.2, -7.8], [-3.0, -12.4], [3.0, -12.4], [4.2, -7.8], [3.6, -2.1]], true, 5), lin(-4, 0, 4, 0, [0, C.stoneL, 1, C.stone]), { ink: 0.7 });
    part(c, ell(0, -6.4, 1.5, 1.2), C.stoneL, { ink: 0.45 });
    part(c, spline([[-3.4, -12.2], [3.4, -12.2], [2.7, -8.8], [0, -7.6], [-2.7, -8.8]], true, 4), bk(-12.2, -7.6, C.vermL, C.vermD), { ink: 0.55 });
    part(c, ell(0, -15.0, 3.0, 3.0), bk(-18, -12, C.stoneL, C.stone), { ink: 0.65 });
    sline(c, [[-1.8, -14.8], [-1.0, -14.5], [-0.3, -14.8]], 0.3);
    sline(c, [[0.6, -14.8], [1.3, -14.5], [2.0, -14.8]], 0.3);
    part(c, spline([[-3.2, -16.0], [-2.2, -18.6], [0.2, -19.4], [2.6, -18.4], [3.2, -16.0], [0, -16.8]], true, 4), bk(-19.4, -16, C.vermL, C.verm), { ink: 0.55 });
  }
  function reedParts(c) {
    const r = U.rng(611);
    for (let i = 0; i < 13; i++) {
      const bx = r.range(-4, 4), side = bx < 0 ? -1 : 1, h = r.range(10, 17), out = r.range(3, 10) * side;
      sline(c, [[bx, 0], [bx + out * 0.3, -h * 0.6], [bx + out, -h + r.range(0, 4)]], r.range(0.45, 0.7), { col: i & 1 ? '#7b7a3c' : '#9b8848' });
    }
    for (const [x, h, bend] of [[-5, 20, -6], [0, 23, 3], [4.6, 19, 7], [-1.6, 16, -9]]) {
      const pl = ribbon([[x, -h * 0.55], [x + bend * 0.2, -h * 0.9], [x + bend * 0.6, -h], [x + bend, -h + 3.2]], 1.4, 0.7);
      part(c, pl, bk(-h, -h + 4, '#f6ead0', '#cfae6a'), { ink: 0.42, detail(k) { stroke(k, [[x, -h * 0.6], [x + bend * 0.25, -h * 0.9], [x + bend * 0.65, -h + 0.4], [x + bend, -h + 3]], 0.25, '#a98a4c', 0.8); } });
      sline(c, [[x, 0], [x + bend * 0.05, -h * 0.3], [x, -h * 0.55]], 0.4, { col: '#7b6a34' });
    }
  }
  const PROP_DEF = {
    pine: { n: 2, box: [-27, -70, 32, 3], fn: pineParts, sh: [15, 4.6], pad: 80, sway: 0.018 },
    maple: { n: 2, box: [-22, -54, 22, 3], fn: mapleParts, sh: [14, 4.4], pad: 70, sway: 0.022 },
    cherry: { n: 2, box: [-28, -55, 28, 3], fn: cherryParts, sh: [16, 4.6], pad: 70, sway: 0.02 },
    shrine: { n: 2, box: [-10, -36, 10, 2], fn: (c, v) => (v ? jizoParts(c) : toroParts(c)), sh: [7.4, 2.4], shv: [[7.4, 2.4], [5.2, 1.7]], pad: 40 },
    gate: { n: 1, box: [-30, -47, 30, 2], fn: toriiParts, sh: [24, 3.2], pad: 60 },
    stone: { n: 3, box: [-19, -21, 22, 2], fn: stoneParts, sh: [15, 4.2], pad: 34 },
    bamboo: { n: 1, box: [-16, -66, 18, 2], fn: bambooParts, sh: [11, 3.4], pad: 80, sway: 0.03 },
    reeds: { n: 1, box: [-17, -26, 17, 2], fn: reedParts, sh: [9, 2.6], pad: 30, sway: 0.05 },
  };

  /* ============================================================ fx sprites */
  function slashPts(s) {
    const outer = arc(-3.6 * s, 0, 5.8 * s, 5.8 * s, -1.2, 1.2, 22);
    const inner = arc(-5.3 * s, 0, 5.5 * s, 5.5 * s, 1.08, -1.08, 22);
    return outer.concat(inner);
  }
  /** Brushed crescent: a vermilion block off-register under a sumi stroke with dry-brush gaps. */
  function slashDraw(c, s) {
    const pts = slashPts(s);
    c.save(); c.translate(0.45 * s, 0.35 * s); c.beginPath(); trace(c, pts); c.fillStyle = C.verm; c.fill(); c.restore();
    c.beginPath(); trace(c, pts); c.fillStyle = SUMI; c.fill();
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.strokeStyle = '#000'; c.lineWidth = 0.24 * s; c.setLineDash([1.7 * s, 1.1 * s]);
    for (const rr of [5.0, 5.45]) { c.beginPath(); trace(c, arc(-4.3 * s, 0, rr * s, rr * s, -0.95, 0.95, 16), false); c.stroke(); }
    c.restore();
  }
  function spiral(cx, cy, r, turns, a0) {
    const out = [];
    turns = turns || 1.15; a0 = a0 === undefined ? 2.2 : a0;
    for (let i = 0; i <= 20; i++) { const t = i / 20, a = a0 + t * TAU * turns, rr = r * (1 - t * 0.85); out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return out;
  }
  /** Mitsudomoe crest disc (orbiting object). */
  function tomoeDraw(c, R) {
    // vermilion rim, cream field, three black commas (mitsudomoe)
    part(c, ell(0, 0, R, R), lin(-R, -R, R, R, [0, C.vermL, 0.5, C.verm, 1, C.vermD]), { ink: R * 0.13 });
    const r = R * 0.76;
    part(c, ell(0, 0, r, r), rad(-r * 0.3, -r * 0.3, 0, r * 1.2, [0, '#fcf6e6', 1, '#ead8b0']), { ink: R * 0.06, reg: 0.4 });
    c.beginPath();
    for (let k = 0; k < 3; k++) {
      const base = (k / 3) * TAU;
      for (let t = 0; t <= 1.001; t += 0.02) {
        const a = base - t * 2.2, rr = r * (0.44 + 0.36 * t), w = r * (0.21 * Math.pow(1 - t, 0.75) + 0.012);
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        c.moveTo(x + w, y); c.arc(x, y, w, 0, TAU);
      }
    }
    c.fillStyle = SUMI; c.fill();
  }
  function kobanParts(c, big) {
    const rx = big ? 3.8 : 2.7, ry = big ? 5.2 : 3.7;
    part(c, ell(0, 0, rx, ry), lin(-rx, -ry, rx, ry, [0, C.goldL, 0.5, C.gold, 1, C.goldD]), {
      ink: big ? 0.7 : 0.6,
      detail(k) {
        for (let y = -ry * 0.62; y <= ry * 0.62; y += ry * 0.21) stroke(k, [[-rx * 0.45, y], [rx * 0.45, y]], 0.22, C.goldD, 0.8);
        stroke(k, arc(0, 0, rx * 0.72, ry * 0.8, PI * 1.05, PI * 1.45, 6), 0.45, '#fff4c4', 0.9);
      },
    });
    if (big) {
      part(c, rrect(-1.7, -1.7, 3.4, 3.4, 0.35), C.verm, { ink: 0, paper: false, reg: 0 });
      ink(c, rrect(-1.25, -1.25, 2.5, 2.5, 0.2), 0.2, { closed: true, col: PAPER_W, side: 0, vary: 0.1 });
      ink(c, [[-0.7, -0.5], [0.7, -0.5]], 0.28, { col: PAPER_W, taper: 0.2 });
      ink(c, [[0, -0.9], [0, 0.9]], 0.28, { col: PAPER_W, taper: 0.2 });
      ink(c, [[-0.6, 0.55], [0.6, 0.55]], 0.28, { col: PAPER_W, taper: 0.2 });
      dot(c, 0, -ry * 0.72, 0.5, SUMI); dot(c, 0, ry * 0.72, 0.5, SUMI);
    }
  }
  function splatDraw(c, sd, col) {
    const r = U.rng(sd);
    const pts = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, rr = 2.5 * (0.72 + r.next() * 0.5) * (i % 3 === 0 ? 1.35 : 1); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    c.beginPath(); trace(c, spline(pts, true, 3)); c.fillStyle = col; c.fill();
    for (let i = 0; i < 8; i++) {
      const a = r.range(0, TAU), d = r.range(3.8, 7.4), s = r.range(0.35, 0.95);
      ink(c, [[Math.cos(a) * (d - 2.6 - s), Math.sin(a) * (d - 2.6 - s)], [Math.cos(a) * d, Math.sin(a) * d]], s * 1.2, { col, taper: d * 0.5, side: 0, vary: 0.1 });
      dot(c, Math.cos(a) * d, Math.sin(a) * d, s, col);
    }
  }
  function puffParts(c, v) {
    const lobes = v ? [[-3.6, -0.8, 3.3], [2.6, -2.0, 3.8], [5.0, 1.0, 2.4], [0, 1.2, 3.0]] : [[-4.2, 0.2, 3.0], [0.4, -1.8, 4.0], [4.4, 0.6, 2.8], [-0.8, 1.6, 2.6]];
    for (const [x, y, r] of lobes) part(c, ell(x, y, r, r * 0.9), rad(x - r * 0.3, y - r * 0.4, 0, r * 1.25, [0, PAPER_W, 0.65, '#ede4cf', 1, '#c9c0ae']), { ink: 0.55 });
    for (const [x, y, r] of lobes) ink(c, spiral(x + r * 0.08, y + r * 0.05, r * 0.55), 0.3, { taper: 0.9 });
  }
  function curlParts(c) {
    const crest = spline([[6.0, 3.0], [5.2, -1.4], [3.0, -4.6], [-0.4, -6.0], [-3.8, -5.0], [-5.6, -2.6], [-4.6, -1.0], [-3.0, -2.6], [-1.2, -3.0], [0.8, -1.6], [1.6, 0.8], [1.2, 3.0]], true, 5);
    part(c, crest, lin(-2, -6, 4, 3, [0, C.prusL, 0.55, C.prus, 1, C.prusD]), {
      ink: 0.7,
      detail(k) { stroke(k, [[4.6, 2.4], [4.0, -1.0], [2.0, -3.6], [-0.6, -4.6], [-3.0, -4.0]], 0.35, '#c9dbe4', 0.9); },
    });
    for (const [x, y, r] of [[-5.3, -1.5, 0.95], [-3.7, -0.5, 0.8], [-2.2, -1.3, 0.62], [-6.2, -0.1, 0.55], [-4.6, 0.9, 0.45]]) part(c, ell(x, y, r, r), PAPER_W, { ink: 0.28 });
  }
  function petalPts() { return spline([[-1.6, 0], [-0.6, -1.1], [1.0, -0.95], [1.65, -0.4], [1.2, 0], [1.65, 0.4], [1.0, 0.95], [-0.6, 1.1]], true, 4); }

  /* ================================================================= icons */
  function withReg(rx, ry, w, fn) {
    const a = REG[0], b = REG[1], o = OLW;
    REG[0] = rx; REG[1] = ry; OLW = w;
    try { fn(); } finally { REG[0] = a; REG[1] = b; OLW = o; }
  }
  function at(c, x, y, s, rot, fn) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(s, s); fn(c); c.restore(); }
  const ICONS = {
    'hp-heart'(c) {
      part(c, lance(24, 26, -2.36, 20, 5.4), bk(24, 42, C.pineL, C.pineD), { ink: 1.3 });
      part(c, lance(24, 26, 0.8, 20, 5.0), bk(8, 28, C.pineL, C.pineD), { ink: 1.3 });
      for (let k = 0; k < 5; k++) {
        const pts = xf(spline([[0, -1], [-6.4, -4.6], [-6.4, -11.4], [0, -14.4], [6.4, -11.4], [6.4, -4.6]], true, 5), 24, 25, 1, (k / 5) * TAU + 0.3);
        part(c, pts, rad(24, 25, 2, 15, [0, '#8e2618', 0.45, C.verm, 1, '#ec8061']), { ink: 1.25 });
      }
      part(c, ell(24, 25, 5.4, 5.0), rad(23, 24, 0, 6, [0, '#fff3be', 1, C.gold]), {
        ink: 1.0, detail(k) { for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; dot(k, 24 + Math.cos(a) * 3.2, 25 + Math.sin(a) * 2.9, 0.75, C.goldD); } },
      });
    },
    kills(c) {
      const mane = [];
      for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU, r = i & 1 ? 16.5 : 20.5; mane.push([24 + Math.cos(a) * r, 27 + Math.sin(a) * r * 0.88]); }
      part(c, spline(mane, true, 3), '#2a2422', { ink: 1.0 });
      part(c, xf(horn(0, 0, -1), 15.5, 13, 1.45), lin(0, 0, 0, 14, [0, '#fbf3dc', 1, '#cdb88c']), { ink: 1.0 });
      part(c, xf(horn(0, 0, 1), 32.5, 13, 1.45), lin(0, 0, 0, 14, [0, '#fbf3dc', 1, '#cdb88c']), { ink: 1.0 });
      part(c, spline([[11, 20], [24, 13], [37, 20], [38, 32], [31, 41], [17, 41], [10, 32]], true, 5), bk(12, 42, '#ea8a62', '#b33a24'), { ink: 1.7 });
      part(c, poly([[13.5, 22.5], [22, 20.5], [22.5, 24.5], [14.5, 25.5]], true, 1), SUMI, { ink: 0.6, paper: false, reg: 0 });
      part(c, poly([[26, 20.5], [34.5, 22.5], [33.5, 25.5], [25.5, 24.5]], true, 1), SUMI, { ink: 0.6, paper: false, reg: 0 });
      part(c, ell(18.5, 28.2, 3.4, 2.7), C.goldL, { ink: 0.9, paper: false, reg: 0 });
      part(c, ell(29.5, 28.2, 3.4, 2.7), C.goldL, { ink: 0.9, paper: false, reg: 0 });
      dot(c, 19.4, 28.4, 1.5, SUMI); dot(c, 30.4, 28.4, 1.5, SUMI);
      part(c, spline([[16, 35.5], [24, 34], [32, 35.5], [30, 39.5], [24, 40.5], [18, 39.5]], true, 4), '#5a1812', { ink: 0.9, paper: false, reg: 0 });
      part(c, poly([[17.6, 38.6], [20.2, 38.6], [19.2, 33.4]], true, 0.6), C.ivory, { ink: 0.6, paper: false, reg: 0 });
      part(c, poly([[27.8, 38.6], [30.4, 38.6], [28.8, 33.4]], true, 0.6), C.ivory, { ink: 0.6, paper: false, reg: 0 });
    },
    dmg(c) {
      at(c, 33, 15, 1.7, 0, (k) => splatDraw(k, 5, C.verm));
      part(c, poly([[13.2, 36.4], [40.6, 6.2], [42.6, 7.2], [15.0, 38.4]], true, 1), lin(13, 36, 42, 7, [0, '#c9d2d6', 1, '#f6f7f2']), {
        ink: 1.2,
        detail(k) { const pts = []; for (let t = 0; t <= 1.001; t += 0.05) pts.push([14.6 + 26.6 * t + Math.sin(t * 40) * 0.35, 37.0 - 29.6 * t + Math.sin(t * 40) * 0.35]); stroke(k, pts, 0.6, '#8f9ba3', 0.9); },
      });
      part(c, ell(13.6, 37.4, 3.1, 3.1), lin(10, 34, 17, 41, [0, C.goldL, 1, C.goldD]), { ink: 1.0 });
      ink(c, [[12.4, 38.6], [5.4, 45.4]], 3.8, { taper: 0.8, side: 0, vary: 0.05 });
      for (let i = 0; i < 3; i++) dot(c, 10.6 - i * 2.0, 40.6 + i * 2.0, 0.75, C.ochreL);
    },
    rate(c) {
      for (const [y, x0, x1] of [[16, 3, 22], [24, 1, 19], [32, 5, 21]]) ink(c, [[x1, y], [x0, y]], 1.8, { taper: 6, col: '#6f6a62', side: 0 });
      at(c, 32, 24, 2.7, 0, (k) => slashDraw(k, 1));
      ink(c, spiral(11, 40, 5.2, 1.2, 0.2), 1.1, { taper: 2.5 });
    },
    multi(c) {
      // a volley: three crescents in a row, each with its own speed line
      for (const [x, y, s] of [[15, 35, 1.05], [25, 24.5, 1.2], [36, 13, 1.35]]) {
        ink(c, [[x - 3, y + 3], [x - 12, y + 12]], 1.0, { taper: 4, col: '#6f6a62', side: 0 });
        at(c, x, y, s, -0.78, (k) => slashDraw(k, 1));
      }
    },
    bounce(c) {
      at(c, 25, 39, 2.5, 0, curlParts);
      for (let t = 0; t <= 1.001; t += 0.1) dot(c, 5 + t * 15, 8 + t * 22, 0.95, SUMI);
      for (let t = 0.1; t <= 0.85; t += 0.125) dot(c, 20 + t * 16, 30 - t * 20, 0.95, SUMI);
      at(c, 38, 11, 1.7, -0.95, (k) => slashDraw(k, 1));
    },
    lantern(c) {
      const pts = ell(24, 26, 19.5, 12.5, -0.25, 64);
      for (let i = 0; i < 64; i += 4) ink(c, pts.slice(i, i + 3), 1.0, { taper: 0.6, side: 0, col: '#5a554e' });
      at(c, 24, 26, 2.05, 0, (k) => tomoeDraw(k, 5.6));
      at(c, 41.5, 19.5, 0.95, 0.8, (k) => tomoeDraw(k, 5.6));
    },
    speed(c) {
      for (const [y, x0, x1] of [[20, 2, 14], [27, 1, 12], [34, 4, 15]]) ink(c, [[x1, y], [x0, y]], 1.6, { taper: 4.5, col: '#6f6a62', side: 0 });
      const sole = xf(spline([[0, -14], [5.4, -10], [5.6, 4], [3.4, 13], [-3.4, 13], [-5.6, 4], [-5.4, -10]], true, 5), 30, 26, 1, 1.05);
      part(c, sole, lin(18, 18, 42, 34, [0, C.ochreL, 1, C.ochreD]), {
        ink: 1.3,
        detail(k) { for (let i = -5; i <= 5; i++) stroke(k, xf([[-5.5, i * 2.4], [5.5, i * 2.4 + 0.6]], 30, 26, 1, 1.05), 0.55, C.ochreD, 0.9); },
      });
      ink(c, spline([[22, 21], [28, 26], [36, 22]], false, 6), 1.5, { col: C.indigo, side: 0 });
      ink(c, spline([[28, 26], [31, 31], [39, 32]], false, 6), 1.5, { col: C.indigo, side: 0 });
      ink(c, spiral(9, 42, 4.5, 1.1, 0.4), 1.0, { taper: 2 });
    },
    magnet(c) {
      part(c, capsule(7, 43, 27, 19, 1.8, 1.5), lin(0, 43, 0, 19, [0, '#c9b26a', 1, '#8e7a3c']), { ink: 1.0 });
      for (let i = 0; i < 7; i++) {
        const a = -1.75 + i * 0.32, x1 = 27 + Math.cos(a) * 17, y1 = 19 + Math.sin(a) * 17;
        ink(c, spline([[27, 19], [27 + Math.cos(a - 0.08) * 10, 19 + Math.sin(a - 0.08) * 10], [x1, y1], [x1 + Math.cos(a + 1.3) * 2.4, y1 + Math.sin(a + 1.3) * 2.4]], false, 5), 1.25, { taper: 1.2, side: 0, col: '#4b3a22' });
      }
      ink(c, arc(27, 19, 9.5, 9.5, -1.8, 0.35, 12), 0.9, { col: '#4b3a22', side: 0 });
      part(c, ribbon([[22, 24], [18, 30], [21, 35]], 1.4, 1.0), C.verm, { ink: 0.7 });
      at(c, 39, 36, 1.35, 0.3, (k) => kobanParts(k, false));
      at(c, 30, 41, 1.05, -0.4, (k) => kobanParts(k, false));
    },
    hp(c) {
      part(c, rrect(21.6, 3.4, 4.8, 4.6, 0.8), lin(0, 3, 0, 8, [0, C.barkL, 1, C.barkD]), { ink: 0.9 });
      part(c, ell(24, 32, 10.6, 10.0), lin(14, 22, 34, 42, [0, C.ochreL, 0.55, C.ochre, 1, C.ochreD]), { ink: 1.4 });
      part(c, ell(24, 14.8, 6.6, 6.4), lin(18, 9, 30, 21, [0, C.ochreL, 0.6, C.ochre, 1, C.ochreD]), { ink: 1.3 });
      part(c, rrect(18.6, 20.0, 10.8, 3.0, 1.2), bk(20, 23, C.vermL, C.vermD), { ink: 0.9 });
      part(c, ribbon([[28.8, 22.6], [33, 27], [32, 34]], 1.2, 1.6), bk(22, 36, C.vermL, C.vermD), { ink: 0.8 });
      ink(c, arc(24, 32, 7.2, 7.0, PI * 1.1, PI * 1.45, 8), 1.2, { col: '#fff1c6', side: 0 });
    },
  };
  function drawIconImpl(ctx, id, size) {
    const fn = ICONS[id] || ICONS.dmg;
    ctx.save();
    ctx.scale(size / 48, size / 48);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    withReg(0.9, 0.7, 1.4, () => {
      if (size >= 80) {
        part(ctx, ell(24, 24, 22.6, 22.6), rad(19, 17, 2, 28, [0, '#fbf4e2', 1, '#e3cfa2']), { ink: 1.5 });
        ink(ctx, ell(24, 24, 20.2, 20.2), 0.55, { closed: true, side: 0 });
        ctx.translate(24, 24); ctx.scale(0.74, 0.74); ctx.translate(-24, -24);
      }
      fn(ctx);
    });
    ctx.restore();
    // washi fibres over the printed icon
    if (FIBC) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = ctx.createPattern(FIBC, 'repeat');
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }

  /* ================================================================ ground */
  const GSTEP = 4, NL = 4, NF = 6;
  const GREG = [0.8, 0.6];                 // ground colour blocks vs. key line
  // region layers (bottom -> top): 0 moss, 1 dry susuki field, 2 earth path, 3 water
  const LC = [[64, 90, 58], [146, 108, 50], [124, 92, 60], [30, 27, 25]];   // key line colour per layer
  const LHW = [0.3, 0.26, 0.3, 0.48];      // key line half width (world units)
  const LA = [0.85, 0.7, 0.8, 1];
  const MEAD = [[230, 207, 150], [238, 228, 199], [199, 207, 152]];        // ochre, cream, sage
  const MOSS = [[104, 133, 88], [150, 170, 116]];
  const FIELD = [[194, 150, 80], [222, 196, 138]];
  const PATH = [[194, 163, 114], [231, 212, 168]];
  const WATER = [[168, 197, 201], [122, 163, 188], [64, 110, 151], [39, 84, 127], [30, 69, 110]];
  const WDEP = [0, 4, 10, 20, 34];
  function fieldsAt(x, y, out) {
    const wx = U.perlin(x / 900, y / 900, 811) * 80, wy = U.perlin(x / 900 + 7.7, y / 900, 812) * 80;
    const X = x + wx, Y = y + wy;
    out[0] = U.fbm(X / 460 + 2.1, Y / 460, 121, 3) - 0.575;
    out[1] = U.fbm(X / 820 - 4.3, Y / 820, 131, 2) - 0.605;
    const qx = U.perlin(x / 420, y / 420, 141) * 50, qy = U.perlin(x / 420 + 3.3, y / 420, 142) * 50;
    out[2] = (0.0105 - Math.abs(U.perlin((x + qx) / 1500, (y + qy) / 1500, 143))) * 40;
    const pond = U.fbm(X / 620 + 11.3, Y / 620, 151, 3) - 0.655;
    const river = (0.0085 - Math.abs(U.perlin((x - qy) / 2300 + 5.5, (y + qx) / 2300, 153))) * 30;
    const r2 = x * x + y * y;
    out[3] = Math.max(pond, river) - (r2 < 67600 ? (1 - Math.sqrt(r2) / 260) * 0.3 : 0);
    out[4] = U.fbm(X / 700 + 9.1, Y / 700, 161, 2);
    out[5] = U.perlin(x / 26, y / 26, 171);
  }
  const FT = new Float32Array(NF);
  function matAt(x, y) {
    fieldsAt(x, y, FT);
    for (let L = 3; L >= 0; L--) if (FT[L] > 0) return L + 1;
    return 0;
  }
  function matSafe(x, y, r) {
    const m = matAt(x, y);
    if (matAt(x + r, y) !== m || matAt(x - r, y) !== m || matAt(x, y + r) !== m || matAt(x, y - r) !== m) return -1;
    return m;
  }
  const pack = (r, g, b) => (255 << 24) | ((b < 0 ? 0 : b > 255 ? 255 : b | 0) << 16) | ((g < 0 ? 0 : g > 255 ? 255 : g | 0) << 8) | (r < 0 ? 0 : r > 255 ? 255 : r | 0);
  /** Seigaiha: distance of (x,y) from the centre of the fan that covers it (rows overlap downwards). */
  const SR = 7, SH = SR * 0.5;
  function seigaiha(x, y) {
    let j = Math.floor((y + SR) / SH);
    for (let k = 0; k < 6; k++, j--) {
      const yc = j * SH, xs = j & 1 ? SR : 0;
      const cx = xs + Math.round((x - xs) / (2 * SR)) * 2 * SR;
      const dx = x - cx, dy = y - yc, d = Math.sqrt(dx * dx + dy * dy);
      if (d < SR) return d;
    }
    return SR;
  }

  /* -------- brush decals baked on top of the shader -------- */
  function dGrass(c, x, y, s, col, rnd) {
    c.fillStyle = col; c.beginPath();
    const n = 3 + ((rnd() * 2) | 0);
    for (let i = 0; i < n; i++) {
      const a = -0.75 + (i / (n - 1)) * 1.5 + (rnd() - 0.5) * 0.35, L = (2.3 + rnd() * 2.0) * s;
      const bx = x + (i - (n - 1) / 2) * 0.75 * s, w = 0.34 * s;
      const tx = bx + Math.sin(a) * L, ty = y - Math.cos(a) * L;
      c.moveTo(bx - w, y);
      c.quadraticCurveTo(bx + (tx - bx) * 0.4 - w * 0.6, y + (ty - y) * 0.55, tx, ty);
      c.quadraticCurveTo(bx + (tx - bx) * 0.4 + w * 0.6, y + (ty - y) * 0.55, bx + w, y);
      c.closePath();
    }
    c.fill();
  }
  function dFlower(c, x, y, s, col) {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU, px = x + Math.cos(a) * 0.75 * s, py = y + Math.sin(a) * 0.75 * s; c.moveTo(px + 0.55 * s, py); c.arc(px, py, 0.55 * s, 0, TAU); }
    c.fill();
    dot(c, x, y, 0.35 * s, '#e9c454');
  }
  function dPetal(c, x, y, s, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.beginPath(); trace(c, petalPts()); c.fillStyle = col; c.fill();
    c.restore();
  }
  function dPebble(c, x, y, rx, ry, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#a39d8e'; c.beginPath(); c.ellipse(0.3, 0.25, rx, ry, 0, 0, TAU); c.fill();
    c.fillStyle = '#c9c4b4'; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(30,27,25,0.75)'; c.lineWidth = 0.32; c.stroke();
    c.restore();
  }
  function dLily(c, x, y, r, rot, flower) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, 0.35, TAU - 0.05); c.closePath();
    c.fillStyle = '#6f9a62'; c.fill();
    c.strokeStyle = SUMI; c.lineWidth = 0.38; c.stroke();
    c.strokeStyle = 'rgba(200,222,170,0.85)'; c.lineWidth = 0.25; c.beginPath();
    for (let i = 0; i < 5; i++) { const a = 0.9 + i * 1.05; c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); }
    c.stroke();
    c.restore();
    if (flower) {
      c.fillStyle = '#f2b8c0'; c.beginPath();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; c.moveTo(x + 1.6, y); c.ellipse(x + Math.cos(a) * 0.9, y - 0.8 + Math.sin(a) * 0.5, 0.9, 0.55, a, 0, TAU); }
      c.fill();
      dot(c, x, y - 0.9, 0.45, '#e9c454');
    }
  }
  /** Suyari-gasumi: stylised horizontal mist bands, stepped, rounded ends, one outline around the union. */
  function kasumi(ctx, info) {
    G.scatter(info, 300, 9191, 150, (x, y, rng) => {
      if (rng.next() > 0.5) return;
      const steps = 2 + ((rng.next() * 2) | 0), w = rng.range(110, 190), h = rng.range(9, 13);
      ctx.beginPath();
      for (let k = 0; k < steps; k++) {
        const bx = x + rng.range(-35, 35) - w / 2, by = y + k * h * 0.78, bw = w * rng.range(0.6, 1);
        trace(ctx, rrect(bx, by, bw, h, h / 2));
      }
      ctx.lineJoin = 'round';
      ctx.lineWidth = 1.0; ctx.strokeStyle = 'rgba(156,118,92,0.8)'; ctx.stroke();
      ctx.fillStyle = grad(ctx, 0, y, 0, y + steps * h * 0.8, [0, '#efd3c4', 0.5, '#f3e2d0', 1, '#f5ecda']);
      ctx.fill('nonzero');
    });
  }
  function* decals(ctx, info) {
    const pts = [];
    G.scatter(info, 11, 7001, 7, (x, y, rng) => { pts.push(x, y, rng.next(), rng.next(), rng.next()); });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < pts.length; i += 5) {
      if (i % 250 === 245) yield;
      const x = pts[i], y = pts[i + 1], r0 = pts[i + 2], r1 = pts[i + 3], r2 = pts[i + 4];
      const m = matSafe(x, y, 4);
      if (m < 0) continue;
      const rnd = U.mulberry32(((r1 * 1e9) | 0) ^ 0x2c1b3c6d);
      if (m === 0) {
        const dens = U.noise(x / 85, y / 85, 333);
        if (r0 < 0.05 + 0.42 * U.smoothstep(0.42, 0.72, dens)) dGrass(ctx, x, y, 0.85 + r1 * 0.45, r2 < 0.5 ? '#6c8858' : '#56744c', rnd);
        else if (r0 < 0.53 && dens < 0.36 && r2 < 0.05) dFlower(ctx, x, y, 0.8, r1 < 0.3 ? '#d0573d' : '#f6efe0');
        else if (r0 < 0.25) dFlower(ctx, x, y, 0.85, r2 < 0.2 ? '#d0573d' : r2 < 0.6 ? '#f6efe0' : '#efc2c6');
        else if (r0 < 0.28) dPetal(ctx, x, y, 0.85 + r2 * 0.3, r1 * TAU, r2 < 0.6 ? '#eab0b6' : '#f8e6e2');
      } else if (m === 1) {
        if (r0 < 0.4) dGrass(ctx, x, y, 0.95 + r1 * 0.45, r2 < 0.5 ? '#3f5c3d' : '#4d6b45', rnd);
        else if (r0 < 0.46) mleaf(ctx, x, y, 1.3 + r2 * 0.4, r1 * TAU, r2 < 0.6 ? '#c9502f' : '#dc9a3a');
      } else if (m === 2) {
        if (r0 < 0.42) {
          ctx.strokeStyle = r2 < 0.5 ? '#a1803f' : '#8c7134'; ctx.lineWidth = 0.42; ctx.beginPath();
          for (let k = 0; k < 3; k++) { const a = (rnd() - 0.5) * 1.6, L = 3 + rnd() * 3; ctx.moveTo(x + k - 1, y); ctx.quadraticCurveTo(x + k - 1 + Math.sin(a) * L * 0.3, y - L * 0.7, x + k - 1 + Math.sin(a) * L, y - L * Math.cos(a * 0.5)); }
          ctx.stroke();
        } else if (r0 < 0.5) dFlower(ctx, x, y, 0.7, '#f2e6c8');
      } else if (m === 3) {
        if (r0 < 0.08) dPebble(ctx, x, y, 1.2 + r1, 0.8 + r2 * 0.6, r1 * 2);
        else if (r0 < 0.3) { ctx.strokeStyle = 'rgba(150,118,78,0.7)'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(x - 1.2, y); ctx.lineTo(x + 1.2, y + (r2 - 0.5)); ctx.stroke(); }
      } else if (m === 4) {
        if (r0 < 0.035 && matSafe(x, y, 7) === 4) dLily(ctx, x, y, 2.4 + r1 * 1.2, r2 * TAU, r1 < 0.25);
        else if (r0 < 0.06) {
          ctx.strokeStyle = 'rgba(233,239,233,0.55)'; ctx.lineWidth = 0.35;
          for (let k = 1; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x, y, 1.8 * k, 0.8 * k, 0, 0.3, PI * 2 - 0.3); ctx.stroke(); }
        }
      }
    }
  }

  /* ========================================================== draw helpers */
  let TV = null;
  const TF = { S: 1, ox: 0, oy: 0 };
  function tf(view) {
    if (TV !== view) { TV = view; TF.S = view.S; TF.ox = view.W / 2 - view.x * view.S; TF.oy = view.H / 2 - view.y * view.S; }
    return TF;
  }
  function blit(ctx, s, x, y, sx, sy) {
    const k = 1 / K;
    ctx.drawImage(s.c, x - s.ox * k * sx, y - s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
  }
  function blitRot(ctx, V, s, x, y, sx, sy, rot) {
    const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
    ctx.setTransform(co, si, -si, co, V.ox + x * S, V.oy + y * S);
    const k = 1 / K;
    ctx.drawImage(s.c, -s.ox * k * sx, -s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }
  /** Top part of a sprite only (creature rising out of its ink pool): q = visible fraction. */
  function blitRise(ctx, s, x, y, sx, sy, q) {
    const k = 1 / K, h = s.oy * q;
    if (h < 1) return;
    ctx.drawImage(s.c, 0, 0, s.c.width, h, x - s.ox * k * sx, y - h * k * sy, s.c.width * k * sx, h * k * sy);
  }
  function shadow(ctx, x, y, rx, ry, a) {
    ctx.globalAlpha = a;
    ctx.fillStyle = '#4b4f58';
    ctx.beginPath(); ctx.ellipse(x + 0.5, y + 0.35, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // floating numbers: cached sprites, Zen Antique once it is loaded
  const NUMS = new Map();
  let numFont = false, numCheck = 0;
  function numSprite(v, crit) {
    const key = v + (crit ? 'c' : 'n') + (numFont ? 'f' : '');
    let s = NUMS.get(key);
    if (s) return s;
    if (NUMS.size > 400) NUMS.clear();
    const fs = (crit ? 12.5 : 9) * K;
    const font = fs + 'px "Zen Antique", "Shippori Mincho", Georgia, serif';
    const txt = String(v);
    const m = U.canvas(4, 4).ctx; m.font = font;
    const w = Math.ceil(m.measureText(txt).width + fs * 0.8), h = Math.ceil(fs * 1.5);
    const { c, ctx } = U.canvas(w, h);
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const x = w / 2, y = h / 2 + fs * 0.04;
    if (crit) {
      ctx.fillStyle = 'rgba(36,82,126,0.75)'; ctx.fillText(txt, x + fs * 0.07, y + fs * 0.06);   // off-register indigo block
      ctx.strokeStyle = SUMI; ctx.lineWidth = fs * 0.2; ctx.strokeText(txt, x, y);
      ctx.fillStyle = C.verm; ctx.fillText(txt, x, y);
    } else {
      ctx.strokeStyle = 'rgba(251,245,230,0.95)'; ctx.lineWidth = fs * 0.24; ctx.strokeText(txt, x, y);
      ctx.fillStyle = SUMI; ctx.fillText(txt, x, y);
    }
    s = { c, ox: w / 2, oy: h / 2 };
    NUMS.set(key, s);
    return s;
  }

  /* ================================================== screen: print framing */
  let FRAME = null;
  function buildFrame(W, H) {
    const u = H / 900;
    const m = Math.max(2, Math.round(10 * u)), lw = Math.max(1, Math.round(2.4 * u));
    const hb = Math.max(4, Math.round(H * 0.095));
    // ichimonji-bokashi: a Prussian-blue band printed along the top edge, wiped out downwards
    const top = U.canvas(W, hb), tc = top.ctx;
    const g = tc.createLinearGradient(0, 0, 0, hb);
    g.addColorStop(0, 'rgba(22,52,88,0.88)'); g.addColorStop(0.3, 'rgba(32,74,116,0.6)'); g.addColorStop(0.7, 'rgba(36,82,126,0.18)'); g.addColorStop(1, 'rgba(36,82,126,0)');
    tc.fillStyle = g; tc.fillRect(0, 0, W, hb);
    const r = U.rng(4242);
    tc.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 46; i++) {
      const y = r.range(0, hb * 0.75), ph = r.range(0, TAU), amp = r.range(1, 4) * u;
      tc.strokeStyle = 'rgba(0,0,0,' + r.range(0.04, 0.16).toFixed(3) + ')';
      tc.lineWidth = r.range(0.6, 2.2) * Math.max(0.5, u);
      tc.beginPath();
      for (let x = 0; x <= W + 40; x += 40) { const yy = y + Math.sin(x * 0.0045 + ph) * amp; if (x) tc.lineTo(x, yy); else tc.moveTo(x, yy); }
      tc.stroke();
    }
    tc.globalCompositeOperation = 'source-over';
    // vermilion edge bokashi (hurt), low-res, scaled up when drawn
    const hw = Math.max(8, Math.round(W / 8)), hh = Math.max(8, Math.round(H / 8));
    const hurt = U.canvas(hw, hh), hc = hurt.ctx;
    const hg = hc.createRadialGradient(hw / 2, hh / 2, Math.min(hw, hh) * 0.25, hw / 2, hh / 2, Math.max(hw, hh) * 0.68);
    hg.addColorStop(0, 'rgba(207,74,44,0)'); hg.addColorStop(0.65, 'rgba(207,74,44,0.22)'); hg.addColorStop(1, 'rgba(158,50,30,0.8)');
    hc.fillStyle = hg; hc.fillRect(0, 0, hw, hh);
    // signature cartouche + red seal (bottom right), abstract brush marks only
    const sw = Math.max(6, Math.round(24 * u)), sh = Math.max(20, Math.round(104 * u)), ss = Math.max(7, Math.round(27 * u));
    const sig = U.canvas(sw + 4, sh + ss + Math.round(10 * u) + 4), sc = sig.ctx;
    sc.lineJoin = 'round'; sc.lineCap = 'round';
    sc.fillStyle = '#f7efd9'; sc.fillRect(2, 2, sw, sh);
    sc.strokeStyle = SUMI; sc.lineWidth = Math.max(1, 1.6 * u); sc.strokeRect(2, 2, sw, sh);
    const rr = U.rng(77);
    for (let i = 0; i < 4; i++) {
      const cy = 2 + sh * (0.15 + i * 0.22), cx = 2 + sw / 2;
      const pts = [];
      for (let k = 0; k < 4; k++) pts.push([cx + rr.range(-0.3, 0.3) * sw, cy + rr.range(-0.08, 0.1) * sh]);
      ink(sc, spline(pts, false, 4), Math.max(0.8, 2.3 * u), { taper: 3 * u, vary: 0.35 });
      ink(sc, [[cx - sw * 0.25, cy + sh * 0.06], [cx + sw * 0.22, cy + sh * 0.035]], Math.max(0.7, 1.8 * u), { taper: 2 * u });
    }
    const sy = 2 + sh + Math.round(10 * u), sx = 2 + (sw - ss) / 2;
    sc.fillStyle = C.verm; sc.fillRect(sx, sy, ss, ss);
    sc.strokeStyle = '#f7efd9'; sc.lineWidth = Math.max(0.8, 1.4 * u); sc.strokeRect(sx + ss * 0.14, sy + ss * 0.14, ss * 0.72, ss * 0.72);
    for (const [a, b, c2, d] of [[0.3, 0.32, 0.7, 0.32], [0.5, 0.25, 0.5, 0.75], [0.3, 0.55, 0.7, 0.55], [0.32, 0.72, 0.68, 0.72]]) {
      ink(sc, [[sx + ss * a, sy + ss * b], [sx + ss * c2, sy + ss * d]], Math.max(0.8, 1.7 * u), { col: '#f7efd9', taper: 0.5, side: 0, vary: 0.15 });
    }
    FRAME = { W, H, m, lw, top: top.c, hurt: hurt.c, sig: sig.c, pad: Math.round(14 * u) };
  }

  /* ============================================================ particles */
  function puff(game, x, y, z, size, vx, vy, life, v) {
    return game.addParticle({ kind: 'puff', x, y, z, vx, vy, drag: 4.5, life, size, v: v === undefined ? (Math.random() * 2) | 0 : v, rot: (Math.random() - 0.5) * 0.6, vr: (Math.random() - 0.5) * 1.5, rise: 8 });
  }
  function petals(game, x, y, z, n, sp, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.4 + Math.random() * 0.8);
      game.addParticle({ kind: 'petal', v: Math.random() < 0.7 ? 0 : 1, x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 50, grav: 70, drag: 2.6, life: life * (0.7 + Math.random() * 0.6), size: 0.9 + Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 8 });
    }
  }
  function drops(game, x, y, z, n, sp, col) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.5 + Math.random() * 0.7);
      game.addParticle({ kind: 'drop', col, x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 50, grav: 240, drag: 1.4, life: 0.5 + Math.random() * 0.3, size: 0.5 + Math.random() * 0.45 });
    }
  }

  /* ================================================================== CSS */
  const P_ = '#f4ead4', S_ = '#1e1b19', V_ = '#c8402a';
  const FIBRE_BG = 'repeating-linear-gradient(17deg, rgba(120,96,60,.05) 0 1px, transparent 1px 7px), repeating-linear-gradient(-63deg, rgba(255,255,255,.24) 0 1px, transparent 1px 11px), repeating-linear-gradient(101deg, rgba(120,96,60,.04) 0 1px, transparent 1px 13px)';
  const SEAL_BG = `linear-gradient(${P_},${P_}) 50% 30% / 54% 2px no-repeat, linear-gradient(${P_},${P_}) 50% 70% / 54% 2px no-repeat, linear-gradient(${P_},${P_}) 35% 50% / 2px 44% no-repeat, linear-gradient(${P_},${P_}) 65% 50% / 2px 44% no-repeat, radial-gradient(circle at 30% 25%, rgba(255,255,255,.16), transparent 48%), ${V_}`;
  const frame2 = (o) => `inset 0 0 0 ${o}px ${P_}, inset 0 0 0 ${o + 1.5}px ${S_}`;
  const outline = (w, col) => [[w, 0], [-w, 0], [0, w], [0, -w], [w, w], [-w, w], [w, -w], [-w, -w]].map((d) => d[0] + 'px ' + d[1] + 'px 0 ' + col).join(', ');
  const CSS = `
body.style-ukiyoe { font-family: 'Shippori Mincho', 'Yu Mincho', 'Hiragino Mincho ProN', Georgia, serif; color: ${S_}; }
body.style-ukiyoe #hud { padding: 20px 28px; }
body.style-ukiyoe #hud .xp { height: 14px; overflow: visible; background: ${FIBRE_BG}, ${P_}; border: 2px solid ${S_}; border-radius: 0; box-shadow: 0 0 0 3px ${P_}, 0 0 0 4.5px ${S_}, 0 6px 14px rgba(30,27,25,.28); }
body.style-ukiyoe #hud .xp-fill { background: linear-gradient(180deg, #173a5e 0%, #24527e 50%, #7ea6c4 100%); box-shadow: inset -2px 0 0 rgba(30,27,25,.5); }
body.style-ukiyoe #hud .lvl { right: -14px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 30% 25%, rgba(255,255,255,.16), transparent 50%), ${V_}; border-radius: 3px 5px 3px 6px; box-shadow: inset 0 0 0 2px ${V_}, inset 0 0 0 3.5px rgba(247,238,219,.9), 0 3px 6px rgba(30,27,25,.3); color: #f7eedb; font: 400 15px/1 'Zen Antique', serif; text-shadow: none; transform: translateY(-50%) rotate(-4deg); white-space: nowrap; }
body.style-ukiyoe #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 24px; }
body.style-ukiyoe #hud .hp { position: relative; gap: 10px; justify-self: start; }
body.style-ukiyoe #hud .hp-icon { width: 46px; height: 46px; filter: drop-shadow(1px 2px 0 rgba(30,27,25,.25)); }
body.style-ukiyoe #hud .hp-bar { width: 250px; height: 24px; background: ${FIBRE_BG}, ${P_}; border: 2px solid ${S_}; border-radius: 0; box-shadow: 0 0 0 3px ${P_}, 0 0 0 4.5px ${S_}, 0 6px 14px rgba(30,27,25,.28); }
body.style-ukiyoe #hud .hp-fill { background: linear-gradient(180deg, #8e2a1a 0%, #cf4a2c 45%, #e8906a 100%); box-shadow: inset -2px 0 0 rgba(30,27,25,.55); }
body.style-ukiyoe #hud .hp-text { position: absolute; left: 56px; width: 250px; top: 50%; transform: translateY(-50%); text-align: center; font: 400 17px/1 'Zen Antique', serif; letter-spacing: 1px; color: #fbf4e4; text-shadow: ${outline(1.2, S_)}; }
body.style-ukiyoe.hurt #hud .hp-bar { filter: none; animation: ukiyoeShake .25s linear; }
@keyframes ukiyoeShake { 0%,100% { transform: none } 30% { transform: translateX(-3px) } 70% { transform: translateX(3px) } }
body.style-ukiyoe #hud .clock { justify-self: center; flex-direction: row; align-items: stretch; gap: 11px; margin-top: -10px; padding: 8px 20px 8px 9px; background: ${FIBRE_BG}, linear-gradient(180deg, #e9d8ad 0, ${P_} 58%); border: 2.5px solid ${S_}; box-shadow: ${frame2(3)}, 0 8px 16px rgba(30,27,25,.3); }
body.style-ukiyoe #hud .clock-label { order: -1; writing-mode: vertical-rl; text-transform: none; letter-spacing: 1px; opacity: 1; font: 400 12px/1 'Yuji Syuku', serif; color: #f7eedb; background: ${V_}; padding: 6px 4px; max-height: 54px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; box-shadow: inset 0 0 0 1px rgba(247,238,219,.7); }
body.style-ukiyoe #hud .clock-time { align-self: center; font: 400 40px/1 'Zen Antique', serif; letter-spacing: 2px; color: ${S_}; text-shadow: 2px 1.5px 0 rgba(36,82,126,.42); }
body.style-ukiyoe #hud .kills { justify-self: end; min-width: 0; flex-direction: column; justify-content: center; gap: 2px; margin-top: -10px; padding: 7px 12px 7px; background: ${FIBRE_BG}, linear-gradient(180deg, #e9d8ad 0, ${P_} 52%); border: 2.5px solid ${S_}; box-shadow: ${frame2(3)}, 0 8px 16px rgba(30,27,25,.3); font: 400 23px/1 'Zen Antique', serif; color: ${S_}; text-shadow: 1.5px 1px 0 rgba(207,74,44,.38); }
body.style-ukiyoe #hud .kills-icon { width: 42px; height: 42px; }
body.style-ukiyoe #stylebar { background: ${FIBRE_BG}, ${P_}; color: ${S_}; border: 2px solid ${S_}; border-radius: 0; box-shadow: ${frame2(3)}, 0 6px 14px rgba(30,27,25,.3); padding: 7px 48px 7px 18px; gap: 14px; font: 500 13px 'Shippori Mincho', serif; bottom: 16px; }
body.style-ukiyoe #stylebar::after { content: ''; position: absolute; right: 11px; top: 50%; width: 24px; height: 24px; transform: translateY(-50%) rotate(5deg); background: ${SEAL_BG}; border-radius: 2px; }
body.style-ukiyoe #stylebar .style-family { font: 400 13px 'Yuji Syuku', serif; letter-spacing: 1px; text-transform: none; color: #9e321e; opacity: 1; }
body.style-ukiyoe #stylebar .style-name { font: 400 20px 'Zen Antique', serif; letter-spacing: 1px; color: ${S_}; text-shadow: 1.5px 1px 0 rgba(36,82,126,.35); }
body.style-ukiyoe #stylebar .style-hint { opacity: .75; }
body.style-ukiyoe #stylebar .auto.on { color: #24527e; font-weight: 800; }
body.style-ukiyoe #levelup { gap: 32px; background: radial-gradient(ellipse at 50% 52%, rgba(242,232,210,.55) 0, rgba(242,232,210,.25) 55%, rgba(242,232,210,0) 80%), linear-gradient(0deg, rgba(207,74,44,.2) 0, rgba(207,74,44,0) 14%), rgba(60,52,40,.22); -webkit-backdrop-filter: sepia(.4) saturate(.75); backdrop-filter: sepia(.4) saturate(.75); }
body.style-ukiyoe #levelup .lu-title { position: relative; padding: 12px 44px 14px; font: 400 56px/1 'Zen Antique', serif; letter-spacing: 4px; color: ${S_}; text-shadow: 3px 2px 0 rgba(207,74,44,.45); background: ${FIBRE_BG}, linear-gradient(180deg, #ecdcae 0, ${P_} 62%); border: 3px solid ${S_}; box-shadow: ${frame2(4)}, 0 12px 26px rgba(30,27,25,.35); animation: ukiyoeUnroll .5s cubic-bezier(.2,.9,.3,1) backwards; }
body.style-ukiyoe #levelup .lu-title::after { content: ''; position: absolute; right: -20px; bottom: -18px; width: 42px; height: 42px; transform: rotate(7deg); background: ${SEAL_BG}; border-radius: 3px; box-shadow: 0 3px 6px rgba(30,27,25,.3); }
@keyframes ukiyoeUnroll { from { clip-path: inset(0 50% 0 50%); } to { clip-path: inset(0 0 0 0); } }
body.style-ukiyoe #levelup .lu-cards { gap: 28px; }
body.style-ukiyoe #levelup .card { width: 232px; min-height: 318px; padding: 28px 18px 24px; gap: 11px; color: ${S_}; border: 3px solid ${S_}; border-radius: 0; background: linear-gradient(180deg, rgba(23,58,94,.96) 0, rgba(36,82,126,.72) 22px, rgba(126,166,196,.25) 58px, rgba(126,166,196,0) 92px), ${FIBRE_BG}, ${P_}; box-shadow: ${frame2(5)}, 0 14px 26px rgba(30,27,25,.38); transition: transform .16s ease; animation: ukiyoeCard .45s cubic-bezier(.2,.9,.3,1) backwards; }
body.style-ukiyoe #levelup .card:nth-child(2) { animation-delay: .07s; background: linear-gradient(180deg, rgba(142,42,26,.96) 0, rgba(207,74,44,.72) 22px, rgba(231,132,90,.25) 58px, rgba(231,132,90,0) 92px), ${FIBRE_BG}, ${P_}; }
body.style-ukiyoe #levelup .card:nth-child(3) { animation-delay: .14s; background: linear-gradient(180deg, rgba(42,64,49,.96) 0, rgba(61,90,69,.72) 22px, rgba(116,143,97,.25) 58px, rgba(116,143,97,0) 92px), ${FIBRE_BG}, ${P_}; }
@keyframes ukiyoeCard { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
body.style-ukiyoe #levelup .card:hover { transform: translateY(-8px) rotate(-.6deg); }
body.style-ukiyoe #levelup .card-icon { width: 120px; height: 120px; margin-top: 4px; filter: drop-shadow(2px 3px 0 rgba(30,27,25,.22)); }
body.style-ukiyoe #levelup .card-name { margin-top: 4px; padding: 5px 14px 6px; background: linear-gradient(180deg, #f4e2a6, #e9cf88); border: 2px solid ${S_}; box-shadow: inset 0 0 0 2px #f4e2a6, inset 0 0 0 3px rgba(30,27,25,.6); font: 800 20px/1.15 'Shippori Mincho', serif; letter-spacing: .5px; }
body.style-ukiyoe #levelup .card-desc { font: 600 16px/1.3 'Shippori Mincho', serif; color: #4a3f36; opacity: 1; }
body.style-ukiyoe #levelup .card-key { top: 10px; left: 12px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 30% 25%, rgba(255,255,255,.16), transparent 50%), ${V_}; border-radius: 2px 4px 2px 5px; box-shadow: inset 0 0 0 2px ${V_}, inset 0 0 0 3.2px rgba(247,238,219,.9); color: #f7eedb; font: 400 16px/1 'Zen Antique', serif; opacity: 1; transform: rotate(-5deg); }
body.style-ukiyoe #levelup .lu-hint { font: 400 19px 'Yuji Syuku', serif; color: ${S_}; opacity: 1; text-shadow: 0 0 6px ${P_}, 0 0 12px ${P_}; }
body.style-ukiyoe #gameover { gap: 18px; background: linear-gradient(180deg, rgba(22,52,88,.9) 0, rgba(36,82,126,0) 25%), rgba(30,27,25,.45); -webkit-backdrop-filter: grayscale(.8) sepia(.4) brightness(.8); backdrop-filter: grayscale(.8) sepia(.4) brightness(.8); }
body.style-ukiyoe #gameover .go-title { font: 400 70px/1 'Zen Antique', serif; color: ${P_}; letter-spacing: 3px; text-shadow: 3px 2px 0 rgba(207,74,44,.85), ${outline(1, S_)}; }
body.style-ukiyoe #gameover .go-stats { font: 600 19px 'Shippori Mincho', serif; color: ${S_}; opacity: 1; background: ${FIBRE_BG}, ${P_}; border: 2px solid ${S_}; box-shadow: ${frame2(3)}; padding: 10px 24px; }
body.style-ukiyoe #gameover .go-hint { font: 400 18px 'Yuji Syuku', serif; color: #f7eedb; background: ${V_}; padding: 6px 18px; opacity: 1; box-shadow: inset 0 0 0 2px ${V_}, inset 0 0 0 3.5px rgba(247,238,219,.85); }
body.style-ukiyoe #pausebox { font: 400 64px 'Zen Antique', serif; color: ${S_}; letter-spacing: 4px; text-shadow: 3px 2px 0 rgba(207,74,44,.5), 0 0 14px ${P_}; }
`;

  /* ================================================================ style */
  const BOX_HERO = [-14, -34, 15, 2], BOX_KAPPA = [-11, -26, 12, 2], BOX_LANT = [-10, -25, 12, 3], BOX_ONI = [-22, -62, 22, 2];
  const HEIGHT = { creeper: 12, ghost: 16, colossus: 28 };
  let lastStep = -1;
  Styles.register({
    id: 'ukiyoe',
    name: 'Ukiyo-e Woodblock',
    family: 'Print · Woodblock',
    description: 'An Edo-period colour woodblock print in motion: flat colour blocks with bokashi gradients printed slightly off-register, carved sumi key lines, washi fibres, seigaiha water and red seals.',
    groundColor: '#e7dcbd',
    groundResMax: 3,
    chunkSize: 256,
    fonts: ['Shippori+Mincho:wght@500;600;700;800', 'Zen+Antique', 'Yuji+Syuku'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = Math.max(3, Math.min(7, Math.round(S * 1.6)));
      makeFibres();
      SPR.hero = HERO_FR.map((_, f) => {
        const n = build(BOX_HERO, (c) => heroParts(c, f));
        const h = remap(n, hurtFn);
        const g = { c: U.tint(n.c, '#6f7a8c'), ox: n.ox, oy: n.oy };
        return { n, nl: flipS(n), h, hl: flipS(h), g, gl: flipS(g) };
      });
      SPR.kappa = [0, 1, 2].map((v) => [0, 1, 2, 3].map((f) => set4(BOX_KAPPA, (c) => kappaParts(c, f, v))));
      SPR.lant = [0, 1, 2, 3].map((f) => set4(BOX_LANT, (c) => lanternParts(c, f)));
      SPR.oni = [0, 1].map((v) => [0, 1, 2, 3].map((f) => set4(BOX_ONI, (c) => oniParts(c, f, v))));
      const dis = (s, sd) => [0.28, 0.52, 0.76].map((th, i) => { const d = dissolve(s, th, sd + i); return { n: d, l: flipS(d) }; });
      SPR.kappaD = SPR.kappa.map((v, i) => dis(v[0].n, 31 + i * 5));
      SPR.lantD = dis(SPR.lant[0].n, 61);
      SPR.oniD = SPR.oni.map((v, i) => dis(v[0].n, 71 + i * 5));
      SPR.props = {};
      for (const t in PROP_DEF) {
        const d = PROP_DEF[t];
        SPR.props[t] = [];
        for (let v = 0; v < d.n; v++) { const s = build(d.box, (c) => d.fn(c, v)); SPR.props[t].push({ n: s, l: flipS(s) }); }
      }
      SPR.slash = plain([-7.5, -7, 3.5, 7], (c) => slashDraw(c, 1.05));
      SPR.trail = plain([-22, -3, 0.5, 3], (c) => {
        for (const [y, len, w] of [[-1.7, 13, 0.55], [-0.6, 19, 0.7], [0.5, 16, 0.6], [1.6, 10, 0.5]]) ink(c, [[-0.5, y * 0.6], [-len, y]], w, { col: 'rgba(40,40,46,0.7)', taper: 3, side: 0 });
        c.globalCompositeOperation = 'destination-in';
        c.fillStyle = grad(c, 0, 0, -22, 0, [0, 'rgba(0,0,0,1)', 1, 'rgba(0,0,0,0)']);
        c.fillRect(-22, -3, 23, 6);
      });
      SPR.tomoe = build([-7.4, -7.4, 7.4, 7.4], (c) => tomoeDraw(c, 6.5));
      SPR.koban = build([-3.8, -4.8, 3.8, 4.8], (c) => kobanParts(c, false));
      SPR.oban = build([-5, -6.4, 5, 6.4], (c) => kobanParts(c, true));
      SPR.spark = plain([-4.5, -4.5, 4.5, 4.5], (c) => part(c, poly([[0, -4], [0.9, -0.9], [4, 0], [0.9, 0.9], [0, 4], [-0.9, 0.9], [-4, 0], [-0.9, -0.9]], true, 0.5), lin(-3, -3, 3, 3, [0, '#fff2bf', 1, C.gold]), { ink: 0.38, paper: false, reg: 0.5 }));
      SPR.splat = [11, 23, 37].map((sd) => plain([-9, -9, 9, 9], (c) => splatDraw(c, sd, SUMI)));
      SPR.splatR = plain([-9, -9, 9, 9], (c) => splatDraw(c, 51, C.verm));
      SPR.splatB = plain([-9, -9, 9, 9], (c) => splatDraw(c, 61, C.prus));
      SPR.puff = [0, 1].map((v) => build([-8, -6.5, 8.5, 5], (c) => puffParts(c, v)));
      SPR.petal = [['#f7dcdb', '#de92a0'], [PAPER_W, '#efc3c8']].map((cc) => plain([-1.9, -1.4, 1.9, 1.4], (c) => { c.beginPath(); trace(c, petalPts()); c.fillStyle = grad(c, -1.6, 0, 1.6, 0, [0, cc[0], 1, cc[1]]); c.fill(); }));
      SPR.leaf = [C.verm, '#dc9a3a'].map((col) => plain([-2.4, -2.4, 2.4, 2.4], (c) => { mleaf(c, 0, 0, 2.1, 0, col); dot(c, 0, 0, 0.3, '#7a2a18'); }));
      SPR.curl = build([-7, -7, 7, 4], curlParts);
      SPR.enso = plain([-21, -21, 21, 21], (c) => {
        ink(c, arc(0, 0, 18, 18, -1.3, 4.45, 96), 3.2, { taper: 9, vary: 0.4, side: 0 });
        c.globalCompositeOperation = 'destination-out';
        c.strokeStyle = '#000'; c.lineWidth = 0.4; c.setLineDash([3, 2.2]);
        for (const r of [17.1, 18.9]) { c.beginPath(); c.arc(0, 0, r, 1.2, 4.4); c.stroke(); }
      });
      SPR.scrap = plain([-1.8, -1.4, 1.8, 1.4], (c) => part(c, poly([[-1.3, -0.9], [1.4, -0.6], [1.0, 1.0], [-1.2, 0.7]], true, 0.4), '#f3e3bd', { ink: 0.25, reg: 0 }));
      if (document.fonts && document.fonts.load) { try { document.fonts.load('20px "Zen Antique"', '0123456789'); } catch (e) { /* ignore */ } }
    },

    /* ------------------------------------------------------------ ground */
    *renderGroundChunk(ctx, info) {
      const res = info.res, Wp = info.px, nc = Math.ceil(info.size / GSTEP);
      const nf = nc + 5, nd = nc + 3;
      const F = new Float32Array(nf * nf * NF), tmp = new Float32Array(NF);
      for (let j = 0; j < nf; j++) {
        const y = info.wy + (j - 2) * GSTEP;
        for (let i = 0; i < nf; i++) {
          fieldsAt(info.wx + (i - 2) * GSTEP, y, tmp);
          const o = (j * nf + i) * NF;
          for (let k = 0; k < NF; k++) F[o + k] = tmp[k];
        }
        if ((j & 7) === 7) yield;
      }
      // approximate signed distance (world units) per region: field / |gradient|
      const D = [0, 1, 2, 3].map(() => new Float32Array(nd * nd));
      const T = new Float32Array(nd * nd), Wb = new Float32Array(nd * nd);
      const inv2 = 1 / (2 * GSTEP);
      for (let j = 0; j < nd; j++) {
        for (let i = 0; i < nd; i++) {
          const fo = ((j + 1) * nf + (i + 1)) * NF, o = j * nd + i;
          for (let L = 0; L < NL; L++) {
            const gx = (F[fo + NF + L] - F[fo - NF + L]) * inv2, gy = (F[fo + nf * NF + L] - F[fo - nf * NF + L]) * inv2;
            const g = Math.sqrt(gx * gx + gy * gy);
            let d = F[fo + L] / Math.max(g, 1e-7);
            D[L][o] = d > 60 ? 60 : d < -60 ? -60 : d;
          }
          T[o] = F[fo + 4]; Wb[o] = F[fo + 5];
        }
      }
      yield;
      const img = ctx.createImageData(Wp, Wp);
      const buf = new Uint32Array(img.data.buffer);
      const FAR = -(GSTEP * 1.6 + 2.5);
      const bil = (A, o, fx, fy) => { const a = A[o] + (A[o + 1] - A[o]) * fx, b = A[o + nd] + (A[o + nd + 1] - A[o + nd]) * fx; return a + (b - a) * fy; };
      const D0 = D[0], D1 = D[1], D2 = D[2], D3 = D[3];
      for (let py = 0; py < Wp; py++) {
        const ly = (py + 0.5) / res;
        const gy = ly / GSTEP + 1, gy0 = gy | 0, fy = gy - gy0;
        const cyv = (ly - GREG[1]) / GSTEP + 1, cy0 = cyv | 0, cfy = cyv - cy0;
        const wy = info.wy + ly - GREG[1];
        const fibRow = (Math.floor((info.wy + ly) * 2) & 511) * 512;
        for (let px = 0; px < Wp; px++) {
          const lx = (px + 0.5) / res;
          const gx = lx / GSTEP + 1, gx0 = gx | 0, fx = gx - gx0;
          const cxv = (lx - GREG[0]) / GSTEP + 1, cx0 = cxv | 0, cfx = cxv - cx0;
          const o = gy0 * nd + gx0, oc = cy0 * nd + cx0;
          // meadow: ochre <-> cream <-> sage washes
          let m = (bil(T, oc, cfx, cfy) - 0.34) * 3.4;
          m = m < 0 ? 0 : m > 1 ? 1 : m;
          let r, g, b;
          if (m < 0.5) { const t = m * 2; r = MEAD[0][0] + (MEAD[1][0] - MEAD[0][0]) * t; g = MEAD[0][1] + (MEAD[1][1] - MEAD[0][1]) * t; b = MEAD[0][2] + (MEAD[1][2] - MEAD[0][2]) * t; }
          else { const t = (m - 0.5) * 2; r = MEAD[1][0] + (MEAD[2][0] - MEAD[1][0]) * t; g = MEAD[1][1] + (MEAD[2][1] - MEAD[1][1]) * t; b = MEAD[1][2] + (MEAD[2][2] - MEAD[1][2]) * t; }
          const wob = bil(Wb, o, fx, fy);
          for (let L = 0; L < NL; L++) {
            const A = L === 0 ? D0 : L === 1 ? D1 : L === 2 ? D2 : D3;
            if (A[o] < FAR && A[oc] < FAR) continue;
            const dc = bil(A, oc, cfx, cfy);
            let cov = dc * res + 0.5;
            if (cov > 0) {
              if (cov > 1) cov = 1;
              let lr, lg, lb;
              if (L === 3) {
                // water: shallow -> deep bokashi, shore contour lines, seigaiha in the deep
                let i = 0;
                while (i < 3 && dc > WDEP[i + 1]) i++;
                const t = Math.min(1, Math.max(0, (dc - WDEP[i]) / (WDEP[i + 1] - WDEP[i])));
                const A0 = WATER[i], A1 = WATER[i + 1];
                lr = A0[0] + (A1[0] - A0[0]) * t; lg = A0[1] + (A1[1] - A0[1]) * t; lb = A0[2] + (A1[2] - A0[2]) * t;
                const dd = dc + wob * 0.8;
                for (let k = 0; k < 3; k++) {
                  const lv = 2.4 + k * 2.6;
                  let a = (0.27 - Math.abs(dd - lv)) * res + 0.5;
                  if (a > 0) { a = (a > 1 ? 1 : a) * (0.8 - k * 0.15); lr += (233 - lr) * a; lg += (239 - lg) * a; lb += (233 - lb) * a; }
                }
                if (dc > 7) {
                  const wx = info.wx + lx - GREG[0];
                  const sd = seigaiha(wx, wy), sp = SR / 4;
                  const near = Math.abs(sd - Math.round(sd / sp) * sp);
                  let a = (0.24 - near) * res + 0.5;
                  if (sd > sp * 0.6 && a > 0) {
                    const fade = dc > 15 ? 1 : (dc - 7) / 8;
                    a = (a > 1 ? 1 : a) * 0.55 * fade;
                    lr += (132 - lr) * a; lg += (170 - lg) * a; lb += (198 - lb) * a;
                  }
                }
              } else {
                const P = L === 0 ? MOSS : L === 1 ? FIELD : PATH, span = L === 0 ? 9 : L === 1 ? 8 : 5;
                const t = dc > span ? 1 : dc / span;
                lr = P[0][0] + (P[1][0] - P[0][0]) * t; lg = P[0][1] + (P[1][1] - P[0][1]) * t; lb = P[0][2] + (P[1][2] - P[0][2]) * t;
              }
              r += (lr - r) * cov; g += (lg - g) * cov; b += (lb - b) * cov;
            }
            // key block line on the region edge, swelling with the wobble noise
            const dk = bil(A, o, fx, fy);
            const hw = LHW[L] * (1 + 0.45 * wob);
            let a = (hw - Math.abs(dk)) * res + 0.5;
            if (a > 0) {
              a = (a > 1 ? 1 : a) * LA[L];
              const lc = LC[L];
              r += (lc[0] - r) * a; g += (lc[1] - g) * a; b += (lc[2] - b) * a;
            }
          }
          const fv = 1 + 0.05 * FIB[fibRow + (Math.floor((info.wx + lx) * 2) & 511)];
          buf[py * Wp + px] = pack(r * fv, g * fv, b * fv);
        }
        if ((py & 15) === 15) yield;
      }
      ctx.putImageData(img, 0, 0);
      yield;
      yield* decals(ctx, info);
      kasumi(ctx, info);
    },

    propsForChunk(info) {
      const out = [];
      G.scatterOwned(info, 76, 5150, (x, y, rng) => {
        if (G.nearSpawn(x, y, 95)) return;
        const r = rng.next(), vr = rng.next();
        const m = matAt(x, y);
        let t = null, v = 0;
        if (m === 0) {
          if (r < 0.07) { t = 'pine'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.12) { t = 'cherry'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.16) { t = 'stone'; v = (vr * 3) | 0; }
          else if (r < 0.185) { t = 'shrine'; v = 0; }
          else if (r < 0.2) { t = 'shrine'; v = 1; }
          else if (r < 0.218) t = 'gate';
          else if (r < 0.235) t = 'reeds';
        } else if (m === 1) {
          if (r < 0.09) { t = 'pine'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.17) { t = 'maple'; v = vr < 0.65 ? 0 : 1; }
          else if (r < 0.24) t = 'bamboo';
          else if (r < 0.27) { t = 'stone'; v = (vr * 3) | 0; }
        } else if (m === 2) {
          if (r < 0.14) t = 'reeds';
          else if (r < 0.18) { t = 'maple'; v = 1; }
          else if (r < 0.2) { t = 'stone'; v = 1; }
          else if (r < 0.21) { t = 'shrine'; v = 1; }
        } else if (m === 3) {
          if (r < 0.05) { t = 'shrine'; v = 0; }
          else if (r < 0.1) t = 'gate';
          else if (r < 0.1) { t = 'shrine'; v = 1; }
        } else if (r < 0.05) { t = 'stone'; v = 1; }
        if (!t) return;
        out.push({ x, y, t, v, f: t === 'gate' ? false : rng.chance(0.5), sw: rng.next() * TAU, pad: PROP_DEF[t].pad });
      });
      return out;
    },

    drawProp(ctx, p, view) {
      const d = PROP_DEF[p.t];
      if (!d) return;
      const list = SPR.props[p.t];
      const s = list[p.v] || list[0];
      const spr = p.f ? s.l : s.n;
      if (d.sway) {
        const V = tf(view), S = V.S;
        const k = Math.sin(view.rt * 1.2 + (p.sw || 0)) * d.sway;
        ctx.setTransform(S, 0, -k * S, S, V.ox + p.x * S, V.oy + p.y * S);
        const q = 1 / K;
        ctx.drawImage(spr.c, -spr.ox * q, -spr.oy * q, spr.c.width * q, spr.c.height * q);
        ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
      } else blit(ctx, spr, p.x, p.y, 1, 1);
    },

    drawShadow(ctx, o) {
      if (o.kind === 'prop') { const d = PROP_DEF[o.t]; if (d) { const sh = d.shv ? d.shv[o.v] || d.sh : d.sh; shadow(ctx, o.x, o.y, sh[0], sh[1], 0.2); } return; }
      if (o.kind === 'enemy') {
        let k = 1;
        if (o.dying) { if (o.deathT > 0.6) return; k = 1 - o.deathT / 0.6; }
        if (o.spawnT < 1) k *= U.clamp(o.spawnT * 2 - 0.2, 0, 1);
        if (k <= 0.02) return;
        if (o.type === 'ghost') shadow(ctx, o.x, o.y, 5.2 * k, 1.8 * k, 0.15);
        else if (o.type === 'colossus') shadow(ctx, o.x, o.y, 18 * k, 5.2 * k, 0.24);
        else shadow(ctx, o.x, o.y, 8.2 * k, 2.7 * k, 0.22);
        return;
      }
      const h = o.moving ? Math.abs(Math.sin(o.anim * 0.52 * PI)) : 0;
      shadow(ctx, o.x, o.y, 9 - h * 0.8, 3 - h * 0.25, 0.22);
    },

    drawGroundOverlay(ctx, view, game) {
      // creatures rise out of an ink pool with ripple rings
      for (const e of game.enemies) {
        if (e.dying || e.spawnT >= 1 || e.type === 'ghost') continue;
        if (e.x < view.x0 - 40 || e.x > view.x1 + 40 || e.y < view.y0 - 20 || e.y > view.y1 + 60) continue;
        const t = e.spawnT;
        const a = t < 0.2 ? U.ease.outBack(t / 0.2) : t > 0.75 ? Math.max(0, 1 - (t - 0.75) / 0.25) : 1;
        if (a <= 0.01) continue;
        const big = e.type === 'colossus';
        const rx = (big ? 19 : 10) * a, ry = rx * 0.38;
        ctx.fillStyle = big ? 'rgba(30,27,25,0.88)' : 'rgba(23,58,94,0.88)';
        ctx.beginPath(); ctx.ellipse(e.x, e.y, rx, ry, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = big ? SUMI : C.prusD; ctx.lineWidth = 0.6;
        for (let k = 1; k <= 2; k++) {
          const s = 1 + k * 0.32 + t * 0.4;
          ctx.globalAlpha = Math.max(0, 0.8 - t * 0.6) * (k === 1 ? 1 : 0.6);
          ctx.beginPath(); ctx.ellipse(e.x, e.y, rx * s, ry * s, 0, 0, TAU); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    },

    drawWorldOverlay(ctx, view) {
      // drifting cherry petals and the odd maple leaf
      const V = tf(view), cell = 110, rt = view.rt, k = 1 / K;
      const x0 = Math.floor((view.x0 - 80) / cell), x1 = Math.floor((view.x1 + 80) / cell);
      const y0 = Math.floor((view.y0 - 40) / cell), y1 = Math.floor((view.y1 + 40) / cell);
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = U.hash2(cx, cy, 515);
          if (h > 0.42) continue;
          const life = 7 + h * 8, ph = U.fract(rt / life + U.hash2(cx, cy, 516));
          const bx = (cx + U.hash2(cx, cy, 517)) * cell, by = (cy + U.hash2(cx, cy, 518)) * cell;
          const x = bx - 70 + ph * 150 + Math.sin(rt * 1.3 + h * 40) * 9;
          const y = by - 30 + ph * 60 + Math.sin(rt * 2.0 + h * 21) * 4;
          if (x < view.x0 - 10 || x > view.x1 + 10 || y < view.y0 - 10 || y > view.y1 + 40) continue;
          const z = 26 * (1 - ph) + 3;
          const spr = h < 0.05 ? SPR.leaf[(h * 100) & 1] : SPR.petal[h < 0.3 ? 0 : 1];
          const a = Math.sin(ph * PI);
          ctx.globalAlpha = a * 0.2;
          ctx.fillStyle = '#4b4f58'; ctx.beginPath(); ctx.ellipse(x, y, 1.3, 0.5, 0, 0, TAU); ctx.fill();
          ctx.globalAlpha = a;
          const s = h < 0.05 ? 1.3 : 1.15, fl = Math.cos(rt * 3.4 + h * 30), rot = rt * (0.6 + h) + h * 20;
          const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
          ctx.setTransform(co * s, si * s, -si * s * fl, co * s * fl, V.ox + x * S, V.oy + (y - z) * S);
          ctx.drawImage(spr.c, -spr.ox * k, -spr.oy * k, spr.c.width * k, spr.c.height * k);
          ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      const s = g.big ? SPR.oban : SPR.koban;
      let h = 2.2 + Math.sin(view.rt * 4 + g.seed * 20) * 1.0, sx = 1, sy = 1;
      if (g.pop > 0) {
        const q = 1 - g.pop;
        h += Math.sin(q * PI) * 9;
        const p = U.ease.outBack(Math.min(1, q * 1.4));
        sx = sy = 0.4 + 0.6 * p;
      }
      // the coin turns slowly like a spinning koban
      sx *= 0.3 + 0.7 * Math.abs(Math.cos(view.rt * 2.4 + g.seed * 9));
      const ry = g.big ? 5.2 : 3.7;
      shadow(ctx, g.x, g.y, g.big ? 4.2 : 3, g.big ? 1.4 : 1, 0.2);
      blit(ctx, s, g.x, g.y - h - ry * sy, sx, sy);
      if (g.big) {
        const tw = Math.sin(view.rt * 3 + g.seed * 9);
        if (tw > 0.55) { const q = (tw - 0.55) / 0.45; blitRot(ctx, tf(view), SPR.spark, g.x + 3.6, g.y - h - ry * 2 - 1, q * 0.8, q * 0.8, view.rt); }
      }
    },

    drawEnemy(ctx, e, view) {
      const V = tf(view);
      const left = e.facing < 0;
      let set, dis, sx = 1, sy = 1, rot = 0, y = e.y, alpha = 1;
      const scl = 0.94 + e.seed * 0.12;
      if (e.type === 'ghost') {
        const f = Math.floor(view.rt * 6 + e.seed * 4) & 3;
        set = SPR.lant[f]; dis = SPR.lantD;
        y -= 5 + Math.sin(view.rt * 2.4 + e.seed * 12) * 1.8;
        rot = U.clamp(e.vx / 64, -1, 1) * 0.16 + Math.sin(view.rt * 3.1 + e.seed * 7) * 0.05;
      } else if (e.type === 'colossus') {
        const v = e.seed < 0.68 ? 0 : 1;
        const ph = e.anim * 0.3 + e.seed, f = Math.floor(ph * 4) & 3;
        set = SPR.oni[v][f]; dis = SPR.oniD[v];
        const sn = Math.sin(ph * TAU), up = Math.abs(sn), contact = Math.pow(1 - up, 3);
        y -= up * 1.6;
        sx = 1 + contact * 0.05; sy = 1 - contact * 0.05;
        rot = sn * 0.03;
      } else {
        const v = Math.floor(e.seed * 3) % 3;
        const ph = e.anim * 0.36 + e.seed, f = Math.floor(ph * 4) & 3;
        set = SPR.kappa[v][f]; dis = SPR.kappaD[v];
        const sn = Math.sin(ph * TAU);
        y -= Math.abs(sn) * 0.9;
        rot = sn * 0.07;
      }
      sx *= scl; sy *= scl;
      if (e.dying) {
        const q = e.deathT;
        if (q >= 1) return;
        if (q < 0.16) {
          const k = 1 + (q / 0.16) * 0.14;
          blitRot(ctx, V, left ? set.fl : set.f, e.x, y, sx * k, sy * k, rot);
        } else {
          const i = Math.min(2, Math.floor(((q - 0.16) / 0.84) * 3));
          const d = dis[i];
          ctx.globalAlpha = 1 - Math.max(0, q - 0.75) * 2;
          blitRot(ctx, V, left ? d.l : d.n, e.x, y - (q - 0.16) * 6, sx * 1.14, sy * 1.14, rot);
          ctx.globalAlpha = 1;
        }
        return;
      }
      if (e.spawnT < 1) {
        if (e.type === 'ghost') {
          const q = U.clamp(e.spawnT / 0.8, 0, 1);
          alpha = q;
          const p = U.ease.outBack(q);
          sx *= p; sy *= p;
        } else {
          // rises out of the ink pool
          const q = U.clamp((e.spawnT - 0.08) / 0.8, 0, 1);
          if (q <= 0) return;
          blitRise(ctx, left ? set.nl : set.n, e.x, e.y, sx, sy, U.ease.outQuad(q));
          return;
        }
      }
      const fl = e.flash;
      if (fl > 0) { sx *= 1 + 0.12 * fl; sy *= 1 - 0.1 * fl; }
      ctx.globalAlpha = alpha;
      if (rot) blitRot(ctx, V, left ? set.nl : set.n, e.x, y, sx, sy, rot); else blit(ctx, left ? set.nl : set.n, e.x, y, sx, sy);
      if (fl > 0.02) {
        ctx.globalAlpha = Math.min(1, fl * 1.4) * alpha;
        if (rot) blitRot(ctx, V, left ? set.fl : set.f, e.x, y, sx, sy, rot); else blit(ctx, left ? set.fl : set.f, e.x, y, sx, sy);
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      const V = tf(view), game = view.game;
      let frame = 0, lift = 0, sx = 1, sy = 1, rot = 0;
      if (p.moving) {
        const ph = p.anim * 0.13, f = Math.floor(ph * 4);
        frame = 1 + (f & 3);
        lift = Math.abs(Math.sin(ph * TAU)) * 1.0;
        rot = Math.sin(ph * TAU * 2) * 0.025;
        if (f !== lastStep) {
          if (lastStep >= 0 && (f & 1) === 0 && game && game.state === 'play' && p.dashT <= 0 && Math.random() < 0.7) {
            puff(game, p.x - p.facing * 3, p.y + 0.4, 1.2, 0.32, -p.vx * 0.12, -p.vy * 0.12, 0.4);
          }
          lastStep = f;
        }
      } else {
        lastStep = -1;
        const b = Math.sin(view.rt * 2.2);
        sy = 1 + 0.015 * b; sx = 1 - 0.01 * b;
        if (p.shootT > 0.35) frame = 5;
      }
      if (p.levelT > 0) { lift += Math.sin(p.levelT * PI) * 5; const w = Math.sin(p.levelT * PI * 3) * p.levelT; sy *= 1 + 0.08 * w; sx *= 1 - 0.06 * w; }
      const hurt = p.hurtT > 0;
      let x = p.x;
      if (hurt) { x += Math.sin(view.rt * 70) * p.hurtT * 1.1; sx *= 1 + 0.08 * p.hurtT; sy *= 1 - 0.07 * p.hurtT; }
      const left = p.facing < 0;
      const S = SPR.hero[frame];
      if (p.dashT > 0) {
        const k = U.clamp(p.dashT / 0.2, 0, 1);
        sx *= 1 + 0.1 * k;
        rot += 0.12 * p.facing * k;
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = (0.38 / i) * k;
          blitRot(ctx, V, left ? S.gl : S.g, x - p.dashX * i * 7, p.y - p.dashY * i * 7 - lift, sx, sy, rot);
        }
        ctx.globalAlpha = 1;
      }
      let a = 1;
      if (p.iframes > 0 && !hurt && p.dashT <= 0 && (Math.floor(view.rt * 14) & 1)) a = 0.55;
      ctx.globalAlpha = a;
      blitRot(ctx, V, left ? S.nl : S.n, x, p.y - lift, sx, sy, rot);
      if (hurt) {
        ctx.globalAlpha = Math.min(1, p.hurtT * 1.4);
        blitRot(ctx, V, left ? S.hl : S.h, x, p.y - lift, sx, sy, rot);
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view);
      const bob = Math.sin(view.rt * 4 + o.idx * 1.7) * 1.2;
      const y = o.y - 6 + bob;
      // wind trail behind the spinning crest
      const tr = o._tr || (o._tr = []);
      tr.unshift(o.x, y);
      if (tr.length > 16) tr.length = 16;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#46506a';
      for (let i = 2; i < tr.length; i += 2) {
        const q = 1 - i / 16;
        ctx.globalAlpha = 0.34 * q; ctx.lineWidth = 3.4 * q;
        ctx.beginPath(); ctx.moveTo(tr[i - 2], tr[i - 1]); ctx.lineTo(tr[i], tr[i + 1]); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      shadow(ctx, o.x, o.y + 4, 3.8, 1.3, 0.16);
      blitRot(ctx, V, SPR.tomoe, o.x, y, 1, 1, view.rt * 6 + o.idx * 2);
    },

    drawProjectile(ctx, pr, view) {
      const V = tf(view);
      ctx.globalAlpha = Math.min(1, pr.age * 10) * 0.85;
      blitRot(ctx, V, SPR.trail, pr.x, pr.y, 1, 1, pr.angle);
      ctx.globalAlpha = 1;
      shadow(ctx, pr.x, pr.y + 7, 2.6, 0.8, 0.14);
      blitRot(ctx, V, SPR.slash, pr.x, pr.y, 1, 1, pr.angle);
    },

    drawParticle(ctx, pt, view) {
      const V = tf(view);
      const t = 1 - pt.life / pt.max, z = pt.z || 0;
      switch (pt.kind) {
        case 'splat': {
          const spr = pt.col === 'r' ? SPR.splatR : pt.col === 'b' ? SPR.splatB : SPR.splat[pt.v || 0];
          const sc = pt.size * (t < 0.2 ? 0.55 + (t / 0.2) * 0.5 : 1.05);
          ctx.globalAlpha = t > 0.55 ? Math.max(0, 1 - (t - 0.55) / 0.45) : 1;
          blitRot(ctx, V, spr, pt.x, pt.y - z, sc, sc, pt.rot);
          ctx.globalAlpha = 1;
          return;
        }
        case 'drop': {
          const s = pt.size * (t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1);
          if (s <= 0.02) return;
          ctx.fillStyle = pt.col || SUMI;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y - z, s, z > 0.4 ? s : s * 0.5, 0, 0, TAU); ctx.fill();
          return;
        }
        case 'puff': {
          const spr = SPR.puff[pt.v || 0];
          const sc = pt.size * (t < 0.2 ? U.ease.outBack(t / 0.2) : 1 + (t - 0.2) * 0.3);
          ctx.globalAlpha = t > 0.45 ? Math.max(0, 1 - (t - 0.45) / 0.55) : 1;
          blitRot(ctx, V, spr, pt.x, pt.y - z - (pt.rise || 0) * t, sc, sc, pt.rot);
          ctx.globalAlpha = 1;
          return;
        }
        case 'petal': case 'leaf': case 'scrap': {
          const spr = pt.kind === 'petal' ? SPR.petal[pt.v || 0] : pt.kind === 'leaf' ? SPR.leaf[pt.v || 0] : SPR.scrap;
          const s = pt.size * (t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1);
          if (s <= 0.01) return;
          const fl = Math.cos(view.rt * 7 + pt.seed * 20);
          const S = V.S, co = Math.cos(pt.rot) * S, si = Math.sin(pt.rot) * S;
          ctx.setTransform(co * s, si * s, -si * s * fl, co * s * fl, V.ox + pt.x * S, V.oy + (pt.y - z) * S);
          const k = 1 / K;
          ctx.drawImage(spr.c, -spr.ox * k, -spr.oy * k, spr.c.width * k, spr.c.height * k);
          ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
          return;
        }
        case 'spark': {
          const s = pt.size * (t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75);
          if (s > 0.01) blitRot(ctx, V, SPR.spark, pt.x, pt.y - z, s, s, pt.rot);
          return;
        }
        case 'curl': {
          const s = pt.size * (t < 0.25 ? U.ease.outBack(t / 0.25) : 1);
          ctx.globalAlpha = t > 0.55 ? Math.max(0, 1 - (t - 0.55) / 0.45) : 1;
          blit(ctx, SPR.curl, pt.x, pt.y - z, s, s);
          ctx.globalAlpha = 1;
          return;
        }
        case 'enso': {
          const s = pt.size * (0.35 + 0.75 * U.ease.outQuad(t));
          ctx.globalAlpha = t > 0.5 ? Math.max(0, 1 - (t - 0.5) / 0.5) : 1;
          const S = V.S, co = Math.cos(pt.rot) * S, si = Math.sin(pt.rot) * S;
          ctx.setTransform(co * s, si * s * 0.5, -si * s, co * s * 0.5, V.ox + pt.x * S, V.oy + pt.y * S);
          const k = 1 / K, spr = SPR.enso;
          ctx.drawImage(spr.c, -spr.ox * k, -spr.oy * k, spr.c.width * k, spr.c.height * k);
          ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
          ctx.globalAlpha = 1;
          return;
        }
        case 'streak': {
          ctx.globalAlpha = (1 - t) * 0.8;
          blitRot(ctx, V, SPR.trail, pt.x, pt.y - z, pt.size, pt.size * 0.8, pt.rot);
          ctx.globalAlpha = 1;
          return;
        }
        case 'ember': {
          const s = pt.size * (1 - t);
          if (s <= 0.02) return;
          ctx.fillStyle = t < 0.4 ? '#f0a24a' : C.verm;
          ctx.beginPath(); ctx.arc(pt.x, pt.y - z, s, 0, TAU); ctx.fill();
          return;
        }
        default: {
          ctx.globalAlpha = U.clamp(pt.life / pt.max, 0, 1);
          ctx.fillStyle = pt.color || SUMI;
          ctx.beginPath(); ctx.arc(pt.x, pt.y - z, (pt.size || 2) * 0.5, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    },

    drawNumber(ctx, n, view) {
      if (!numFont && (numCheck++ & 31) === 0 && document.fonts && document.fonts.check('20px "Zen Antique"')) { numFont = true; NUMS.clear(); }
      const spr = numSprite(n.value, n.crit);
      const t = 1 - n.life / n.max;
      let sc = t < 0.1 ? 0.4 + (t / 0.1) * 0.85 : t < 0.22 ? 1.25 - ((t - 0.1) / 0.12) * 0.25 : 1;
      ctx.globalAlpha = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.2) : 1;
      blitRot(ctx, tf(view), spr, n.x, n.y, sc, sc, (n.seed - 0.5) * 0.18);
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view, game) {
      if (!FRAME || FRAME.W !== view.W || FRAME.H !== view.H) buildFrame(view.W, view.H);
      const F = FRAME, W = view.W, H = view.H;
      ctx.drawImage(F.top, 0, 0);
      const ht = game && game.player ? game.player.hurtT : 0;
      if (ht > 0) { ctx.globalAlpha = Math.min(1, ht * 1.2) * 0.85; ctx.drawImage(F.hurt, 0, 0, W, H); ctx.globalAlpha = 1; }
      // paper margin + key-line border of the print
      ctx.fillStyle = '#efe4cb';
      ctx.fillRect(0, 0, W, F.m); ctx.fillRect(0, H - F.m, W, F.m); ctx.fillRect(0, 0, F.m, H); ctx.fillRect(W - F.m, 0, F.m, H);
      ctx.strokeStyle = SUMI; ctx.lineWidth = F.lw;
      ctx.strokeRect(F.m + F.lw / 2, F.m + F.lw / 2, W - 2 * F.m - F.lw, H - 2 * F.m - F.lw);
      ctx.drawImage(F.sig, W - F.m - F.sig.width - F.pad, H - F.m - F.sig.height - F.pad);
    },

    drawIcon(ctx, id, size) { drawIconImpl(ctx, id, size); },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e, src) {
      const h = HEIGHT[e.type] || 12;
      game.addParticle({ kind: 'splat', v: (Math.random() * 3) | 0, x: e.x + (Math.random() - 0.5) * 5, y: e.y + 0.5, z: h + (Math.random() - 0.5) * 4, life: 0.22, size: e.type === 'colossus' ? 0.75 : 0.5, rot: Math.random() * TAU, drag: 0 });
      drops(game, e.x, e.y + 0.5, h, 2, 50, src === 'lantern' ? C.verm : SUMI);
    },
    onKill(game, e) {
      const x = e.x, y = e.y + 0.6, T = e.type, big = T === 'colossus', ghost = T === 'ghost';
      const h = big ? 24 : ghost ? 14 : 11;
      const n = big ? 8 : 4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.random() * 0.7, sp = (big ? 40 : 24) * (0.6 + Math.random() * 0.6);
        puff(game, x + Math.cos(a) * 3, y + Math.sin(a) * 1.2, h + Math.sin(a) * 4, (big ? 1.35 : 0.85) * (0.8 + Math.random() * 0.4), Math.cos(a) * sp, Math.sin(a) * sp * 0.55, 0.55 + Math.random() * 0.2);
      }
      game.addParticle({ kind: 'splat', col: T === 'creeper' ? 'b' : null, v: (Math.random() * 3) | 0, x, y, z: h * 0.6, life: 0.4, size: big ? 1.25 : 0.75, rot: Math.random() * TAU, drag: 0 });
      if (T === 'creeper') {
        game.addParticle({ kind: 'curl', x: x + 2, y, z: 1, life: 0.55, size: 0.9, flip: Math.random() < 0.5, drag: 0 });
        drops(game, x, y, h, 5, 60, C.prus);
      } else if (ghost) {
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * TAU, sp = 30 + Math.random() * 40;
          game.addParticle({ kind: 'scrap', x, y, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 40 + Math.random() * 40, grav: 120, drag: 2, life: 0.9, size: 0.9 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10 });
          game.addParticle({ kind: 'ember', x: x + (Math.random() - 0.5) * 8, y, z: h, vx: (Math.random() - 0.5) * 20, vy: 0, vz: 30 + Math.random() * 30, grav: -10, drag: 1.5, life: 0.7, size: 0.5 + Math.random() * 0.4 });
        }
      } else {
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * TAU, sp = 40 + Math.random() * 60;
          game.addParticle({ kind: 'leaf', v: i & 1, x, y, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 60 + Math.random() * 50, grav: 90, drag: 2.2, life: 1.2 + Math.random() * 0.5, size: 0.9 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 8 });
        }
        drops(game, x, y, h, 6, 80, SUMI);
        game.addParticle({ kind: 'enso', x, y, life: 0.6, size: 1.3, rot: Math.random() * TAU, drag: 0 });
      }
    },
    onHurt(game, p) {
      game.addParticle({ kind: 'splat', col: 'r', x: p.x, y: p.y + 0.5, z: 16, life: 0.32, size: 0.95, rot: Math.random() * TAU, drag: 0 });
      drops(game, p.x, p.y + 0.5, 16, 5, 60, C.verm);
      petals(game, p.x, p.y + 0.5, 16, 3, 50, 0.9);
    },
    onPickup(game, g) {
      const p = game.player;
      const n = g.big ? 3 : 1;
      for (let i = 0; i < n; i++) game.addParticle({ kind: 'spark', x: p.x + (Math.random() - 0.5) * 12, y: p.y + 0.5, z: 8 + Math.random() * 16, vz: 6, life: 0.35, size: g.big ? 0.95 : 0.6, rot: Math.random(), drag: 0 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.35) game.addParticle({ kind: 'streak', x: pr.x, y: pr.y + 1, z: 0, vx: pr.vx * 0.05, vy: pr.vy * 0.05, life: 0.2, size: 0.5, rot: pr.angle, drag: 3 });
    },
    onDash(game, p) {
      const a = Math.atan2(p.dashY, p.dashX);
      for (let i = 0; i < 4; i++) game.addParticle({ kind: 'streak', x: p.x + (Math.random() - 0.5) * 6, y: p.y - 6 - i * 4.5, z: 0, vx: -p.dashX * 30, vy: -p.dashY * 30, life: 0.35, size: 0.9 + Math.random() * 0.3, rot: a, drag: 3 });
      for (let i = 0; i < 3; i++) puff(game, p.x - p.dashX * i * 4, p.y + 0.5 - p.dashY * i * 4, 1.5, 0.5 + Math.random() * 0.2, -p.dashX * 20, -p.dashY * 20, 0.45);
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'enso', x: p.x, y: p.y, life: 0.9, size: 1.6, rot: Math.random() * TAU, drag: 0 });
      petals(game, p.x, p.y + 0.5, 18, 18, 60, 1.6);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        game.addParticle({ kind: 'spark', x: p.x + Math.cos(a) * 12, y: p.y + Math.sin(a) * 6, z: 14, vz: 20, life: 0.6, size: 0.9, rot: a, drag: 0 });
      }
    },
    onDeath(game, p) {
      game.addParticle({ kind: 'splat', col: 'r', x: p.x, y: p.y + 0.5, z: 14, life: 0.9, size: 2.0, rot: Math.random() * TAU, drag: 0 });
      game.addParticle({ kind: 'enso', x: p.x, y: p.y, life: 1.4, size: 2.0, rot: 0, drag: 0 });
      petals(game, p.x, p.y + 0.5, 16, 30, 80, 2.0);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; puff(game, p.x, p.y + 0.5, 14, 1.1, Math.cos(a) * 40, Math.sin(a) * 22, 0.8); }
    },
  });
})();
