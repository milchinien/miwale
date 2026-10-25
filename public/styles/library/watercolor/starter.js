/* Watercolor Storybook — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Technique: transparent pigment washes (absorbance mixing over warm paper, edge pooling, granulation,
   wet-in-wet blobs) + loose, broken, variable-width ink contours. Everything expensive is baked once. */
(function (root) {
  'use strict';
  const PALETTE = {
    paper: '#f5eede', ink: '#2a1b14', inkBlue: '#252c46', meadow: '#b2c6a2', sap: '#c2cc96', ochreWash: '#dace98',
    forest: '#8e9c92', indigo: '#828aa2', field: '#e9ce88', path: '#d8b894', pumpkin: '#e8832f', pumpkinLight: '#f6b45e',
    pumpkinShade: '#bf531b', coat: '#41528a', coatShade: '#29345e', scarf: '#b4432f', turnip: '#7a4a8c', turnipSkin: '#eee0ba',
    leaf: '#6c8a38', ghost: '#d3dbe3', ghostShade: '#8fa0bb', glow: '#ffcf55', gold: '#e6a92f', hpRed: '#c23b2b', shadow: '#32365c',
  };
  const TAU = Math.PI * 2, K = 3, LX = -0.6, LY = -0.8;                 // K = sprite px per world unit; light from upper left
  const PAPER = [245, 238, 222], INK = PALETTE.ink, INK_BLUE = PALETTE.inkBlue;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const hyp = (a, b) => Math.sqrt(a * a + b * b);
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  /** Seeded PRNG (mulberry32) + integer hash — never Math.random() in drawing code. */
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { next, chance: (p) => next() < p, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)) };
  }
  const hash = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; };
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  /** Smooth value noise + fbm for low-frequency world fields (biomes, paths). */
  function vn(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const h = (i, j) => hash(xi + i, yi + j, s) / 4294967296;
    const a = h(0, 0) + (h(1, 0) - h(0, 0)) * u, b = h(0, 1) + (h(1, 1) - h(0, 1)) * u;
    return a + (b - a) * v;
  }
  const fbm = (x, y, s) => (vn(x, y, s) * 0.57 + vn(x * 2, y * 2, s + 7) * 0.29 + vn(x * 4, y * 4, s + 13) * 0.14);

  /* ---------- 1. tileable float textures: white noise -> repeated box blur -> normalise ---------- */
  let PAP, GRA, WA, WB, EXP, GRAIN;
  function boxBlur(a, n, r, horiz) {
    const t = new Float32Array(a.length), inv = 1 / (2 * r + 1);
    for (let j = 0; j < n; j++) {
      let acc = 0;
      const at = (i) => a[horiz ? j * n + ((i + n) % n) : ((i + n) % n) * n + j];
      for (let i = -r; i <= r; i++) acc += at(i);
      for (let i = 0; i < n; i++) { t[horiz ? j * n + i : i * n + j] = acc * inv; acc += at(i + r + 1) - at(i - r); }
    }
    a.set(t);
  }
  function noiseTex(n, seed, layers) {
    const R = rng(seed), out = new Float32Array(n * n);
    const norm = (a) => { let m = 0, s = 0; for (const v of a) m += v; m /= a.length; for (const v of a) s += (v - m) ** 2; s = Math.sqrt(s / a.length) || 1; for (let i = 0; i < a.length; i++) a[i] = (a[i] - m) / s; };
    for (const L of layers) {
      const a = new Float32Array(n * n);
      for (let i = 0; i < a.length; i++) a[i] = R.next();
      if (L.r) for (let p = 0; p < 3; p++) { boxBlur(a, n, L.r, true); boxBlur(a, n, L.r, false); }
      norm(a);
      for (let i = 0; i < a.length; i++) out[i] += a[i] * L.w;
    }
    norm(out);
    for (let i = 0; i < out.length; i++) out[i] = clamp01(0.5 + out[i] / 4.6);
    return out;
  }
  function buildTextures() {
    PAP = noiseTex(256, 101, [{ r: 1, w: 0.55 }, { r: 2, w: 1 }, { r: 6, w: 0.45 }]);      // paper tooth
    GRA = noiseTex(256, 202, [{ r: 0, w: 0.7 }, { r: 1, w: 1 }]);                       // pigment granules
    WA = noiseTex(512, 303, [{ r: 4, w: 0.35 }, { r: 12, w: 1 }, { r: 34, w: 0.9 }]);   // wash flow A
    WB = noiseTex(512, 404, [{ r: 6, w: 0.5 }, { r: 18, w: 1 }, { r: 46, w: 0.7 }]);    // wash flow B
    EXP = new Float32Array(4097);
    for (let i = 0; i <= 4096; i++) EXP[i] = Math.exp(-i / 512);
    GRAIN = canvas(256, 256);                                                           // multiply-texture for sprite washes
    const g = GRAIN.getContext('2d'), img = g.createImageData(256, 256), d = img.data;
    for (let i = 0; i < 65536; i++) { const v = 255 - Math.max(0, GRA[i] - 0.46) * 190 - Math.max(0, 0.5 - PAP[i]) * 60; d[i * 4] = v; d[i * 4 + 1] = v * 0.985; d[i * 4 + 2] = v * 0.96; d[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
  }

  /* ---------- 2. brush toolkit ---------- */
  /** Catmull-Rom spline through control points (closed or open), `steps` samples per segment. */
  function spline(pts, closed, steps) {
    const n = pts.length, out = [], seg = closed ? n : n - 1, P = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    if (n < 3) return pts.map((p) => p.slice());
    for (let i = 0; i < seg; i++) {
      const a = P(i - 1), b = P(i), c = P(i + 1), d = P(i + 2);
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3)));
      }
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }
  const jit = (pts, a, r) => pts.map((p) => [p[0] + (r.next() - 0.5) * 2 * a, p[1] + (r.next() - 0.5) * 2 * a]);
  const trace = (ctx, P, closed) => { ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); if (closed !== false) ctx.closePath(); };
  function bbox(P) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } return { x0, y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }; }
  /** Irregular ellipse control points (rough = radial jitter). */
  const blobPts = (cx, cy, rx, ry, rough, r, n) => Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU + (r.next() - 0.5) * 0.3, k = 1 + (r.next() - 0.5) * 2 * rough; return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
  /** Ribbon polygon along an open curve with width function wf(u) — limbs, leaves, scarves. */
  function ribbon(pts, wf) {
    const P = spline(pts, false, 6), n = P.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = hyp(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l, w = wf(i / (n - 1)) * 0.5;
      L.push([P[i][0] - ty * w, P[i][1] + tx * w]); R.push([P[i][0] + ty * w, P[i][1] - tx * w]);
    }
    return L.concat(R.reverse());
  }
  const taperW = (w0, w1) => (u) => w0 + (w1 - w0) * u;
  const leafW = (wm) => (u) => wm * Math.pow(Math.sin(Math.PI * clamp01(u * 0.98 + 0.02)), 0.75) * (u < 0.1 ? 0.6 + u * 4 : 1);
  /** Variable-width ink line: tapered ends (ta/tb), two-sine pressure wobble (wv), thicker on the side away from light. */
  function inkLine(ctx, P, o) {
    const n = P.length; if (n < 2) return;
    const acc = [0]; for (let i = 1; i < n; i++) acc[i] = acc[i - 1] + hyp(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    const tot = acc[n - 1] || 1, ta = o.ta === undefined ? 0.2 : o.ta, tb = o.tb === undefined ? 0.3 : o.tb, wv = o.wv === undefined ? 0.3 : o.wv, ph = o.ph || 0, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = hyp(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l, u = acc[i] / tot;
      let w = o.w;
      if (ta > 0 && u < ta) w *= 0.2 + 0.8 * Math.sqrt(u / ta);
      if (tb > 0 && u > 1 - tb) w *= 0.1 + 0.9 * Math.sqrt(Math.max(0, 1 - u) / tb);
      w *= 1 + wv * (0.6 * Math.sin(acc[i] * 0.8 + ph) + 0.4 * Math.sin(acc[i] * 2.1 + ph * 2.3));
      if (o.light) { const nx = P[i][0] - o.cx, ny = P[i][1] - o.cy, nl = hyp(nx, ny) || 1; w *= 1 - o.light * ((nx * LX + ny * LY) / nl); }
      w = Math.max(0.04, w) * 0.5;
      L.push([P[i][0] - ty * w, P[i][1] + tx * w]); R.push([P[i][0] + ty * w, P[i][1] - tx * w]);
    }
    trace(ctx, L.concat(R.reverse()));
    const ga = ctx.globalAlpha; ctx.globalAlpha = ga * (o.alpha === undefined ? 1 : o.alpha); ctx.fillStyle = o.color || INK; ctx.fill(); ctx.globalAlpha = ga;
  }
  const stroke = (ctx, pts, o, r) => inkLine(ctx, spline(o.jit ? jit(pts, o.jit, r) : pts, false, 6), o);
  /** Broken contour: the closed ring is split into `pieces` strokes with small overshoots (pen lifted). */
  function outline(ctx, P, o, r) {
    const n = P.length, pieces = o.pieces || 2, b = bbox(P);
    let s = (r.next() * n) | 0, rem = n;
    for (let i = 0; i < pieces; i++) {
      const len = i === pieces - 1 ? rem : Math.round((rem / (pieces - i)) * (0.75 + r.next() * 0.5)); rem -= len;
      const seg = []; for (let j = 0; j < len + Math.round((r.next() - 0.3) * 4); j++) seg.push(P[(s + j) % n]);
      if (seg.length > 1) inkLine(ctx, seg, Object.assign({ cx: b.cx, cy: b.cy, ta: 0.12, tb: 0.16, light: 0.45, w: 0.7 }, o, { ph: r.next() * 10 }));
      s += len;
    }
  }
  /** Watercolour wash on a scratch canvas: base fill, blurred wet-in-wet blobs (source-atop), paper-white highlight,
      blurred darker rim (edge pooling), granulation (multiply), optional feathered edge; composited slightly offset
      from the ink (misregistration 0.45/0.35 units). */
  let SCR = null, MIS = [0.45, 0.35];
  function wash(ctx, P, o, r) {
    const cv = ctx.canvas, m = ctx.getTransform(), k = hyp(m.a, m.b);
    if (!SCR || SCR.width !== cv.width || SCR.height !== cv.height) SCR = canvas(cv.width, cv.height);
    const t = SCR.getContext('2d'); t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.globalAlpha = 1; t.filter = 'none'; t.clearRect(0, 0, cv.width, cv.height);
    t.setTransform(m); const bb = bbox(P);
    trace(t, P); t.fillStyle = o.c; t.fill(); t.globalCompositeOperation = 'source-atop';
    for (const b of o.blobs || []) { t.filter = 'blur(' + ((b.blur === undefined ? 2 : b.blur) * k).toFixed(1) + 'px)'; t.globalAlpha = b.a === undefined ? 0.7 : b.a; t.fillStyle = b.c; t.beginPath(); t.ellipse(b.x, b.y, b.rx, b.ry === undefined ? b.rx : b.ry, 0, 0, TAU); t.fill(); }
    t.filter = 'none'; t.globalAlpha = 1;
    if (o.hi !== 0) {
      const lx = bb.x0 + bb.w * 0.3, ly = bb.y0 + bb.h * 0.26, ha = o.hi === undefined ? 0.4 : o.hi, g = t.createRadialGradient(lx, ly, 0, lx, ly, Math.max(bb.w, bb.h) * 0.62);
      g.addColorStop(0, 'rgba(255,251,238,' + ha + ')'); g.addColorStop(0.55, 'rgba(255,251,238,' + ha * 0.35 + ')'); g.addColorStop(1, 'rgba(255,251,238,0)');
      t.fillStyle = g; t.fillRect(bb.x0 - 2, bb.y0 - 2, bb.w + 4, bb.h + 4);
    }
    if (o.rim !== 0) { t.filter = 'blur(' + ((o.rimBlur || 0.55) * k).toFixed(1) + 'px)'; t.globalAlpha = o.rimA || 0.6; t.strokeStyle = o.edge || o.c; t.lineWidth = o.rim || 1.4; trace(t, P); t.stroke(); t.filter = 'none'; t.globalAlpha = 1; }
    if (o.salt) { t.fillStyle = 'rgba(250,250,246,0.75)'; for (let i = 0; i < o.salt; i++) { t.beginPath(); t.arc(bb.x0 + bb.w * (0.15 + r.next() * 0.7), bb.y0 + bb.h * (0.1 + r.next() * 0.8), 0.18 + r.next() * 0.35, 0, TAU); t.fill(); } }
    if (o.gran !== 0) { t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'multiply'; t.globalAlpha = o.gran || 0.55; t.fillStyle = t.createPattern(GRAIN, 'repeat'); t.fillRect(0, 0, cv.width, cv.height); t.globalAlpha = 1; t.setTransform(m); }
    t.globalCompositeOperation = 'destination-in'; if (o.feather) t.filter = 'blur(' + (o.feather * k).toFixed(1) + 'px)'; trace(t, P); t.fillStyle = '#000'; t.fill(); t.filter = 'none';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    ctx.drawImage(SCR, Math.round((o.dx === undefined ? MIS[0] : o.dx) * k), Math.round((o.dy === undefined ? MIS[1] : o.dy) * k)); ctx.restore();
  }
  const part = (ctx, P, o, r, io) => { wash(ctx, P, o, r); outline(ctx, P, Object.assign({ w: 0.7, pieces: 2 }, io || {}), r); };
  /** Carved glowing shape (eyes, mouths): warm yellow wash with white-hot core + thin ink. */
  function glow(ctx, pts, r, o) {
    o = o || {}; const P = o.smooth ? spline(pts, true, 4) : pts, b = bbox(P);
    wash(ctx, P, { c: '#ffcf55', blobs: [{ x: b.cx - b.w * 0.05, y: b.cy - b.h * 0.05, rx: b.w * 0.32, ry: b.h * 0.3, c: '#fff6cf', a: 0.95, blur: Math.max(0.3, b.h * 0.18) }], hi: 0, rim: 0.9, edge: '#e0661f', rimA: 0.85, rimBlur: 0.35, gran: 0, dx: 0, dy: 0 });
    outline(ctx, P, { w: o.w || 0.42, pieces: 1, wv: 0.2, light: 0 }, r);
  }
  /** Offscreen sprite in world units (anchor ax, ay = feet), K px per unit, round caps. */
  function sprite(wu, hu, ax, ay, fn, seed, k) {
    k = k || K; const c = canvas(wu * k, hu * k), x = c.getContext('2d');
    x.setTransform(k, 0, 0, k, ax * k, ay * k); x.lineCap = x.lineJoin = 'round'; fn(x, rng(seed));
    const f = canvas(c.width, c.height), fx = f.getContext('2d'); fx.translate(f.width, 0); fx.scale(-1, 1); fx.drawImage(c, 0, 0);
    return { c, f, ax, ay, wu: c.width / k, hu: c.height / k };
  }
  const blit = (ctx, s, x, y, flip, sc) => { sc = sc || 1; const ax = flip ? s.wu - s.ax : s.ax; ctx.drawImage(flip ? s.f : s.c, x - ax * sc, y - s.ay * sc, s.wu * sc, s.hu * sc); };

  /* ---------- 3. characters (ported from the reference module) ---------- */
  function drawJack(ctx, ph, wave, r) {
    const sw = ph === null ? 0 : Math.sin(ph), cw = ph === null ? 0 : Math.cos(ph), lift = (v) => (ph === null ? 0 : Math.max(0, v) * 1.5);
    part(ctx, ribbon(jit([[-3.4, -11.6], [-4.8, -9.6], [-5 - sw * 1.5, -7.6]], 0.2, r), taperW(2.5, 2)), { c: '#34406c', blobs: [{ x: -4.6, y: -10, rx: 1.4, ry: 2, c: '#4b5a8e', a: 0.6, blur: 0.8 }], hi: 0.15, rim: 0.8, edge: '#1f2748', gran: 0.5 }, r, { w: 0.55 });
    wash(ctx, spline(blobPts(-5.1 - sw * 1.5, -7.2, 1.2, 1.1, 0.12, r, 7), true, 4), { c: '#e6d6b8', hi: 0.2, rim: 0.6, edge: '#a08060', gran: 0.3 }, r);
    for (const [hx, dx, li] of [[-1.6, -2.4 * sw, lift(-cw)], [1.6, 2.4 * sw, lift(cw)]]) {
      const fx = hx + dx, fy = -0.9 - li;
      part(ctx, ribbon(jit([[hx, -6], [hx + dx * 0.5, -3.4 - li * 0.5], [fx, fy - 0.4]], 0.12, r), taperW(2.3, 1.9)), { c: '#4a3a34', hi: 0.12, rim: 0.6, edge: '#2a1e1a', gran: 0.35 }, r, { w: 0.5 });
      part(ctx, spline(blobPts(fx + 0.7, fy + 0.1, 1.9, 1.15, 0.1, r, 8), true, 4), { c: '#3b2a24', blobs: [{ x: fx, y: fy - 0.4, rx: 1, ry: 0.5, c: '#6b5040', a: 0.7, blur: 0.5 }], hi: 0.1, rim: 0.5, gran: 0.3 }, r, { w: 0.5 });
    }
    part(ctx, ribbon(jit([[-2, -13.2], [-5, -12.6 + wave * 0.5], [-8, -12 - wave * 0.7], [-10.4, -10.8 + wave * 0.9]], 0.2, r), (u) => 2.3 - u * 0.9 + Math.sin(u * 9) * 0.15), { c: '#b4432f', blobs: [{ x: -6, y: -12.8, rx: 2.5, ry: 1, c: '#d66a48', a: 0.6, blur: 0.7 }, { x: -9.5, y: -11, rx: 1.6, ry: 1.2, c: '#862a1e', a: 0.6, blur: 0.8 }], hi: 0.15, rim: 0.7, edge: '#6e1f15', gran: 0.4 }, r, { w: 0.55 });
    const CP = spline(jit([[-3.4, -13.6], [-0.2, -14], [3.2, -13.6], [4.9, -11.8], [5.8, -8.2], [6.5, -4.6], [3.4, -4], [0.3, -4.5], [-3, -3.9], [-6.1, -4.7], [-5.6, -8.4], [-4.9, -12]], 0.2, r), true, 6);
    wash(ctx, CP, { c: '#41528a', blobs: [{ x: -2.2, y: -11, rx: 2.8, ry: 3.2, c: '#6677ad', a: 0.75, blur: 1.4 }, { x: 4.5, y: -6, rx: 3, ry: 3.4, c: '#29345e', a: 0.75, blur: 1.4 }], hi: 0.3, rim: 1, edge: '#1d2546', gran: 0.6 }, r);
    outline(ctx, CP, { w: 0.78, light: 0.5, pieces: 3 }, r);
    stroke(ctx, [[0.9, -12.6], [1.2, -8.5], [1.4, -4.7]], { w: 0.32, jit: 0.15, ta: 0.1, tb: 0.4, alpha: 0.75 }, r);
    for (const by of [-10.8, -8.3, -5.9]) { ctx.beginPath(); ctx.arc(2, by, 0.48, 0, TAU); ctx.fillStyle = '#d4a03c'; ctx.fill(); ctx.lineWidth = 0.18; ctx.strokeStyle = INK; ctx.stroke(); }
    part(ctx, spline(jit([[-4.6, -13.9], [-1.2, -14.9], [2.8, -14.6], [4.8, -13.4], [3.6, -12.2], [0.2, -12.4], [-3.4, -12.3], [-5, -12.9]], 0.15, r), true, 5), { c: '#b4432f', blobs: [{ x: -1, y: -14.2, rx: 3, ry: 0.8, c: '#dc7650', a: 0.7, blur: 0.6 }], hi: 0.2, rim: 0.7, edge: '#6e1f15', gran: 0.4 }, r, { w: 0.6 });
    const hx = 0.4, hy = -19.6, hp = [];                                   // pumpkin head: 14-point lobed ellipse, dented top
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU - Math.PI / 2, lobe = 1 + 0.035 * Math.cos(a * 5 + 0.3); hp.push([hx + Math.cos(a) * 8.5 * lobe, hy + (Math.sin(a) * 6.9 + Math.exp(-Math.pow((a + Math.PI / 2) / 0.32, 2))) * lobe]); }
    const HP = spline(jit(hp, 0.22, r), true, 6);
    wash(ctx, HP, { c: '#e8832f', blobs: [{ x: hx - 3, y: hy - 3, rx: 4.4, ry: 3.2, c: '#f6b45e', a: 0.85, blur: 1.6 }, { x: hx + 4.2, y: hy + 3.6, rx: 6, ry: 3.4, c: '#bf531b', a: 0.75, blur: 1.8 }, { x: hx - 5.5, y: hy + 1.5, rx: 2.2, ry: 2.8, c: '#dca13c', a: 0.45, blur: 1.2 }], hi: 0.35, rim: 1.25, edge: '#93380f', gran: 0.45 }, r);
    for (const dx of [-5.6, -2.2, 3.4, 6.4]) stroke(ctx, [[hx + dx * 0.55, hy - 5.7], [hx + dx * 1.03, hy], [hx + dx * 0.6, hy + 5.9]], { w: 0.42, jit: 0.15, ta: 0.25, tb: 0.35, color: '#7e2f0e', alpha: 0.7 }, r);
    outline(ctx, HP, { w: 0.95, light: 0.55, pieces: 3 }, r);
    part(ctx, ribbon(jit([[hx + 0.2, -25.6], [hx - 0.4, -27.6], [hx + 0.7, -29.6]], 0.12, r), taperW(2.2, 1.4)), { c: '#7a6a30', hi: 0.1, rim: 0.5, gran: 0.4 }, r, { w: 0.55 });
    part(ctx, ribbon(jit([[hx - 0.6, -26.2], [hx - 2.6, -27.6], [hx - 4.6, -27.9]], 0.12, r), leafW(2.2)), { c: '#6e8b3a', hi: 0.1, rim: 0.5, edge: '#3e5220', gran: 0.4 }, r, { w: 0.45 });
    const fx = hx + 1.7;
    glow(ctx, jit([[fx - 4.1, -19.5], [fx - 1.3, -19.8], [fx - 2.5, -22.6]], 0.1, r), r);
    glow(ctx, jit([[fx + 0.9, -19.8], [fx + 3.3, -19.5], [fx + 2.4, -22.3]], 0.1, r), r);
    glow(ctx, jit([[-4.9, -17], [-3.6, -16.25], [-2.7, -16.75], [-1.7, -16.05], [0.3, -16.05], [1.3, -16.7], [2.3, -16.15], [3.7, -16.55], [4.4, -17.3], [3.4, -15.15], [1.2, -14.2], [-1.4, -14.1], [-3.6, -14.9]].map((p) => [fx + p[0], p[1]]), 0.08, r), r, { w: 0.45 });
    part(ctx, ribbon(jit([[3, -11.8], [4.6, -9.8], [5.6 + sw * 1.5, -7.9]], 0.2, r), taperW(2.6, 2.1)), { c: '#46578f', blobs: [{ x: 3.6, y: -11, rx: 1.2, ry: 1.6, c: '#7182b5', a: 0.6, blur: 0.7 }], hi: 0.25, rim: 0.8, edge: '#1f2748', gran: 0.5 }, r, { w: 0.6 });
    part(ctx, spline(blobPts(5.9 + sw * 1.5, -7.4, 1.3, 1.15, 0.12, r, 7), true, 4), { c: '#ecdfc2', hi: 0.2, rim: 0.5, edge: '#a08060', gran: 0.25 }, r, { w: 0.45 });
  }
  function drawCreeper(ctx, ph, sway, r, pal) {                           // small melee enemy: walking turnip
    const sw = Math.sin(ph), cw = Math.cos(ph), lift = (v) => Math.max(0, v) * 1.4;
    for (const [hx, dir, li] of [[-2.4, -1, lift(cw)], [2.6, 1, lift(-cw)]]) {
      const fx = hx + dir * (2 * sw + 0.4), fy = -0.4 - li;
      stroke(ctx, [[hx, -5.6], [hx + (fx - hx) * 0.4 - 0.3, -3.2 - li * 0.4], [fx, fy]], { w: 1.25, jit: 0.12, ta: 0.05, tb: 0.35, wv: 0.2, color: '#4a3020' }, r);
      stroke(ctx, [[fx, fy], [fx + 1.3, fy + 0.25]], { w: 0.45, ta: 0, tb: 0.6, wv: 0, color: '#4a3020' }, r);
    }
    ctx.save(); ctx.translate(0, -4.5); ctx.rotate(sw * 0.075); ctx.translate(0, 4.5);
    const BP = spline(jit([[0, -22.6], [5.6, -21.4], [8.8, -15.6], [7.7, -9.4], [4.2, -5.6], [0.6, -3.9], [-3.4, -5.6], [-7.5, -9.2], [-8.7, -15.4], [-5.5, -21.4]], 0.28, r), true, 6);
    wash(ctx, BP, { c: '#eee0ba', blobs: [{ x: 0, y: -20.6, rx: 10.6, ry: 6, c: pal[0], a: 0.95, blur: 2 }, { x: -3.4, y: -19.6, rx: 3.8, ry: 2.4, c: pal[1], a: 0.6, blur: 1.3 }, { x: 5.6, y: -17.6, rx: 3.4, ry: 3.2, c: pal[2], a: 0.5, blur: 1.5 }, { x: 2.4, y: -7.6, rx: 6, ry: 2.6, c: '#e3c886', a: 0.55, blur: 1.6 }], hi: 0.32, rim: 1.2, edge: '#5a3a52', rimA: 0.5, gran: 0.5 }, r);
    stroke(ctx, [[-5.8, -9.8], [-3, -8.7], [-0.4, -8.9]], { w: 0.34, jit: 0.12, alpha: 0.55, color: '#6a4a3a' }, r);
    outline(ctx, BP, { w: 0.95, light: 0.55, pieces: 3 }, r);
    for (const [L, w] of [[[[-0.6, -22], [-3.8, -26.4], [-6.6 + sway * 0.6, -30.2]], 3], [[[0.3, -22.4], [0.2, -27.4], [1.6 + sway, -31.6]], 3.2], [[[1, -22], [4.2, -25.8], [6.8 + sway * 0.8, -28.4]], 2.8]]) {
      const pts = jit(L, 0.18, r), LP = ribbon(pts, leafW(w));
      wash(ctx, LP, { c: '#6c8a38', blobs: [{ x: pts[0][0], y: pts[0][1] - 1, rx: 1.6, c: '#a7bd68', a: 0.7, blur: 0.8 }, { x: pts[2][0], y: pts[2][1], rx: 1.6, c: '#46602a', a: 0.6, blur: 0.9 }], hi: 0.1, rim: 0.7, edge: '#3a4e1c', gran: 0.45 }, r);
      outline(ctx, LP, { w: 0.5, light: 0.4 }, r); stroke(ctx, pts, { w: 0.32, ta: 0.05, tb: 0.5, wv: 0.1, alpha: 0.8 }, r);
    }
    const eye = (cx, cy, s) => [[cx - 1.25 * s, cy + 0.25], [cx - 0.1, cy - 0.85 * s], [cx + 1.25 * s, cy - 0.15], [cx + 0.1, cy + 0.75 * s]];
    glow(ctx, eye(2.4, -16.4, 1), r, { smooth: true, w: 0.4 }); glow(ctx, eye(6, -16.2, 0.82), r, { smooth: true, w: 0.36 });
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(2.7, -16.4, 0.42, 0, TAU); ctx.arc(6.15, -16.25, 0.36, 0, TAU); ctx.fill();
    stroke(ctx, [[0.3, -18.6], [1.9, -18.2], [3.5, -17.3]], { w: 0.95, ta: 0.15, tb: 0.35, wv: 0.1 }, r);
    stroke(ctx, [[7.6, -18.4], [6.4, -18], [5, -17.2]], { w: 0.85, ta: 0.15, tb: 0.35, wv: 0.1 }, r);
    inkLine(ctx, jit([[2.2, -12.3], [3.3, -13.1], [4.3, -12.5], [5.3, -13.2], [6.5, -12.3]], 0.08, r), { w: 0.55, ta: 0.15, tb: 0.2, wv: 0.1 });
    ctx.restore();
  }
  function drawGhost(ctx, p, r) {                                         // fast enemy: feathered, lost-and-found edges
    const w1 = Math.sin(p), w2 = Math.sin(p + 1.9), w3 = Math.sin(p + 3.6), arm = Math.sin(p + 0.8);
    const BP = spline(jit([[-5.6, -19.2], [-1.6, -23.4], [4.2, -22.6], [7.2, -18.2], [7, -13], [5.2, -8.6], [2.6, -5.8 + w1 * 0.8], [0, -6.9], [-2.4, -3.7 + w2], [-4.1, -7.2], [-7, -4.8 + w3], [-7.1, -9.6], [-6.9, -14.6]], 0.25, r), true, 6);
    wash(ctx, BP, { c: '#d3dbe3', blobs: [{ x: -3.4, y: -8.6, rx: 6, ry: 5, c: '#8fa0bb', a: 0.8, blur: 2.4 }, { x: -1.4, y: -20.2, rx: 4.6, ry: 2.6, c: '#f1f3ef', a: 0.7, blur: 1.6 }, { x: -5.6, y: -5.6, rx: 2.8, ry: 2, c: '#6a7b9e', a: 0.65, blur: 1.4 }], hi: 0.25, rim: 1.5, edge: '#6f80a2', rimA: 0.65, rimBlur: 0.7, gran: 0.55, feather: 0.85, salt: 12 }, r);
    const n = BP.length;
    inkLine(ctx, BP.slice(1, Math.round(n * 0.3)), { w: 0.62, ta: 0.3, tb: 0.35, wv: 0.35, color: INK_BLUE, alpha: 0.85, light: 0.5, cx: 0, cy: -15 });
    inkLine(ctx, BP.slice(Math.round(n * 0.36), Math.round(n * 0.5)), { w: 0.5, ta: 0.3, tb: 0.4, color: INK_BLUE, alpha: 0.7 });
    const k = hyp(ctx.getTransform().a, ctx.getTransform().b);
    ctx.filter = 'blur(' + (0.3 * k).toFixed(1) + 'px)'; ctx.fillStyle = '#20263e'; ctx.globalAlpha = 0.92;
    for (const [x, y, rx, ry] of [[1.3, -17.8, 1.35, 1.95], [4.85, -17.6, 1.05, 1.7], [3.3, -12.7, 1.35, 2.35 + w2 * 0.15]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0.1, 0, TAU); ctx.fill(); }
    ctx.filter = 'none'; ctx.globalAlpha = 1;
    const FA = ribbon(jit([[4.4, -13.4], [7.8, -13.8 + arm * 0.5], [11, -12.6 + arm]], 0.15, r), taperW(1.8, 0.6));
    wash(ctx, FA, { c: '#c9d2dd', hi: 0.1, rim: 0.6, edge: '#6c7c9c', gran: 0.4, feather: 0.25 }, r);
    for (let i = 0; i < 3; i++) stroke(ctx, [[10.9, -12.6 + arm], [10.9 + Math.cos(-0.55 + i * 0.5) * 1.6, -12.6 + arm + Math.sin(-0.55 + i * 0.5) * 1.6]], { w: 0.28, ta: 0, tb: 0.6, wv: 0, color: INK_BLUE, alpha: 0.85 }, r);
  }
  function drawGem(ctx, r) {
    const P = spline(jit([[0, -8.6], [1.3, -6.4], [2.6, -4], [2.4, -2], [0.4, -0.9], [-1.8, -1.5], [-2.6, -3.6], [-1.6, -6.2]], 0.12, r), true, 5);
    wash(ctx, P, { c: '#e6a92f', blobs: [{ x: -0.4, y: -4, rx: 1.4, ry: 2, c: '#fbe39c', a: 0.95, blur: 0.6 }, { x: 1.6, y: -2, rx: 1.2, ry: 1, c: '#b8701c', a: 0.6, blur: 0.5 }], hi: 0, rim: 0.7, edge: '#9a5a14', rimA: 0.7, gran: 0.25, dx: 0.25, dy: 0.2 }, r);
    outline(ctx, P, { w: 0.42, light: 0.5 }, r); ctx.fillStyle = 'rgba(255,253,244,0.95)'; ctx.beginPath(); ctx.ellipse(-0.8, -4.6, 0.45, 0.7, 0.3, 0, TAU); ctx.fill();
  }
  function drawBush(ctx, r) {
    for (const [x, y, rr] of [[-5, -5, 6], [4, -5.4, 6.2], [0, -9, 6.4]]) {
      const P = spline(blobPts(x, y, rr, rr * 0.8, 0.14, r, 12), true, 4);
      wash(ctx, P, { c: '#7d8f45', blobs: [{ x: x - rr * 0.35, y: y - rr * 0.3, rx: rr * 0.5, ry: rr * 0.4, c: '#a9b86a', a: 0.6, blur: 1.4 }, { x: x + rr * 0.4, y: y + rr * 0.35, rx: rr * 0.6, ry: rr * 0.45, c: '#4f6428', a: 0.6, blur: 1.4 }], hi: 0.15, rim: 1, edge: '#2f3a1a', gran: 0.55, alpha: 0.92 }, r);
      outline(ctx, P, { w: 0.62, wv: 0.4, pieces: 2 }, r);
    }
  }
  /** All animation frames are baked once: walk poses x "boil" variants (re-jittered strokes = living line). */
  let SPR = null;
  function buildSprites() {
    buildTextures();
    SPR = { jack: [], creep: [[], []], ghost: [] };
    for (let p = 0; p < 4; p++) for (let b = 0; b < 3; b++) SPR.jack.push(sprite(30, 35, 15.5, 32.5, (c, r) => drawJack(c, (p / 4) * TAU, Math.sin(p * 1.6 + b * 2.1), r), 5000 + (p * 3 + b) * 7919));
    const pals = [['#7a4a8c', '#a77ab5', '#4e2a5c'], ['#8b3d6d', '#b4729a', '#5a2244']];
    pals.forEach((pal, v) => { for (let p = 0; p < 4; p++) for (let b = 0; b < 2; b++) SPR.creep[v].push(sprite(26, 37, 13, 34, (c, r) => drawCreeper(c, (p / 4) * TAU, Math.sin(p * 1.7 + b * 2.4), r, pal), 6000 + v * 100 + (p * 2 + b) * 7919)); });
    for (let p = 0; p < 4; p++) for (let b = 0; b < 2; b++) SPR.ghost.push(sprite(26, 28, 11.5, 26, (c, r) => drawGhost(c, (p / 4) * TAU + b * 0.4, r), 7000 + (p * 2 + b) * 7919));
    MIS = [0, 0]; SPR.gem = [0, 1, 2].map((i) => sprite(8, 11, 4, 9.6, drawGem, 9100 + i, 4)); MIS = [0.45, 0.35];
    SPR.bush = sprite(30, 22, 15, 19, drawBush, 1300);
    const g = canvas(64, 64), gx = g.getContext('2d'), gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,226,140,0.95)'); gr.addColorStop(0.35, 'rgba(255,196,90,0.5)'); gr.addColorStop(1, 'rgba(255,170,60,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64); SPR.glow = g;
  }

  /* ---------- 4. ground: per-pixel pigment shader in absorbance space (baked once per canvas size) ---------- */
  const ab = (c) => c.map((v, i) => -Math.log(Math.max(4, v) / PAPER[i]));     // colour -> absorbance over paper
  const PG = { mC: ab([178, 198, 162]), mS: ab([194, 204, 150]), mO: ab([218, 206, 152]), fP: ab([142, 156, 146]), fI: ab([130, 138, 162]), gO: ab([233, 206, 136]), gS: ab([228, 186, 122]), pE: ab([216, 184, 148]), pD: ab([198, 162, 128]) };
  const sst = (t) => (t <= -1 ? 0 : t >= 1 ? 1 : ((t + 1) / 2) ** 2 * (3 - (t + 1)));
  const pool = (d) => (d <= 0 || d >= 2.6 ? 0 : (1 - d / 2.6) ** 2 * (d < 0.35 ? d / 0.35 : 1));   // pigment pooling inside a wash edge
  const gapf = (d) => (Math.abs(d) < 0.75 ? 1 - Math.abs(d) / 0.75 : 0);                         // thin bare-paper gap at edges
  function buildGround(w, h, s) {
    const Wu = w / s, ST = 8, gw = Math.ceil(w / ST) + 3, gh = Math.ceil(h / ST) + 3, N = gw * gh;
    const F = new Float32Array(N), Gf = new Float32Array(N), Pp = new Float32Array(N), HW = new Float32Array(N), HU = new Float32Array(N), DN = new Float32Array(N), BL = new Float32Array(N);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {                        // low-frequency world fields on a coarse grid
      const x = ((i - 1) * ST) / s, y = ((j - 1) * ST) / s, o = j * gw + i;
      F[o] = fbm(x / 150, y / 150, 11) * 0.7 + (x / Wu - 0.75) * 1.6 - (y / 360) * 1.2;                     // forest: top-right corner
      Gf[o] = fbm(x / 90, y / 90, 23) * 0.6 + 0.4 - Math.hypot((x - Wu * 0.08) / 50, (y - 120) / 70) * 0.25; // golden field: left
      Pp[o] = x - Wu * 0.12 - y * 0.75 - 22 * Math.sin(y / 55) - 30 * (fbm(x / 160, y / 160, 7) - 0.5);    // path: winding diagonal
      HW[o] = 6 + 5 * vn(x / 90, y / 90, 8); HU[o] = clamp01((fbm(x / 120, y / 120, 9) - 0.5) * 2.4 + 0.5);
      DN[o] = 0.76 + 0.5 * fbm(x / 160 + 3.3, y / 160, 10); BL[o] = smooth(0.55, 0.75, vn(x / 80, y / 80, 12));
    }
    const sd = (f, T) => { const out = new Float32Array(N); for (let j = 1; j < gh - 1; j++) for (let i = 1; i < gw - 1; i++) { const o = j * gw + i, gx = (f[o + 1] - f[o - 1]) * s / (2 * ST), gy = (f[o + gw] - f[o - gw]) * s / (2 * ST); out[o] = Math.max(-40, Math.min(40, (f[o] - T) / Math.max(1e-5, hyp(gx, gy)))); } return out; };
    const dF = sd(F, 0.5), dG = sd(Gf, 0.5), dS = sd(Pp, 0);                          // signed distances in world units
    const c = canvas(w, h), cx = c.getContext('2d'), img = cx.createImageData(w, h), d = img.data;
    const lerpG = (A, px, py) => { const fx = px / ST + 1, fy = py / ST + 1, i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, o = j * gw + i; const a = A[o] + (A[o + 1] - A[o]) * u, b = A[o + gw] + (A[o + gw + 1] - A[o + gw]) * u; return a + (b - a) * v; };
    const mix3 = (A, B, t, k) => A[k] + (B[k] - A[k]) * t;
    for (let py = 0, o = 0; py < h; py++) for (let px = 0; px < w; px++, o += 4) {
      const vF = lerpG(dF, px, py), vG = lerpG(dG, px, py), vS = lerpG(dS, px, py), vH = lerpG(HW, px, py), vU = lerpG(HU, px, py), vD = lerpG(DN, px, py), vB = lerpG(BL, px, py);
      const ip = ((py & 255) << 8) | (px & 255), P = PAP[ip], Gr = GRA[((py & 255) << 8) | ((px + 91) & 255)], wa = WA[((py & 511) << 9) | (px & 511)], wb = WB[(((py + 389) & 511) << 9) | ((px + (py >> 1)) & 511)];
      const hs = 1 - vB, soft = 0.45 + 5 * vB;                                       // vB = wet-in-wet bleed zones (soft edges)
      const eF = vF + (wa - 0.5) * 9 + (P - 0.5) * 0.9, eG = vG + (wb - 0.5) * 9 + (P - 0.5) * 0.9, pc = Math.abs(vS + (wb - 0.5) * 3.5), eP = vH - pc + (P - 0.5) * 0.7;
      const mF = sst(eF / soft), mG = sst(eG / soft), wP = sst(eP / (0.5 + 2 * vB)), wF = mF * (1 - wP), wG = mG * (1 - mF) * (1 - wP), wM = 1 - wP - wF - wG;
      const kM = 1 + hs * (0.85 * pool(-eF) + 0.85 * pool(-eG) * (1 - mF) + 0.5 * pool(-eP)), kF = 1 + hs * (pool(eF) + 0.5 * pool(-eP));
      const kG = 1 + hs * (pool(eG) + 0.8 * pool(-eF) + 0.5 * pool(-eP)), kP = 1 + hs * 0.9 * pool(eP) + 0.5 * Math.max(0, 1 - Math.abs(pc - vH * 0.5) * 1.1);
      const gap = hs * clamp01((wa - 0.55) * 7) * (gapf(eF) + gapf(eG) * (1 - mF) + 0.6 * gapf(eP));
      const dM = vD * (0.6 + 0.6 * wb) * (1 - 0.55 * clamp01((0.32 - wb) * 9)), dap = clamp01((wa - 0.64) * 28);
      const dF_ = vD * (0.82 + 0.35 * wb) * (1 - 0.42 * dap), dG_ = vD * (0.7 + 0.55 * wa), dP_ = 0.82 + 0.35 * wb;
      const hh = clamp01(vU + (wb - 0.5) * 0.5), tf = clamp01(wa * 1.6 - 0.35), tg = clamp01(wb * 1.6 - 0.3);
      const gran = (1 + (Gr - 0.5) * (0.6 * wM + 1.05 * wF + 0.6 * wG + 1.2 * wP)) * (1 + (0.5 - P) * 0.45), mul = (1 - 0.88 * Math.min(1, gap)) * gran;
      const sM = wM * kM * dM * mul, sF = wF * kF * dF_ * mul, sG = wG * kG * dG_ * mul, sP = wP * kP * dP_ * mul, sh = 0.95 + 0.075 * P;
      for (let k = 0; k < 3; k++) {
        const aM = hh < 0.5 ? mix3(PG.mC, PG.mS, hh * 2, k) : mix3(PG.mS, PG.mO, hh * 2 - 1, k);
        const A = sM * aM + sF * mix3(PG.fP, PG.fI, tf, k) + sG * mix3(PG.gO, PG.gS, tg, k) + sP * mix3(PG.pE, PG.pD, wa, k);
        d[o + k] = PAPER[k] * sh * EXP[Math.max(0, Math.min(4096, (A * 512) | 0))];  // Beer-Lambert: paper * exp(-absorbance)
      }
      d[o + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    const mat = (x, y) => { const px = x * s, py = y * s; if (px < 0 || py < 0 || px >= w || py >= h) return 'M'; return lerpG(dS, px, py) !== 0 && Math.abs(lerpG(dS, px, py)) < lerpG(HW, px, py) ? 'P' : lerpG(dF, px, py) > 0 ? 'F' : lerpG(dG, px, py) > 0 ? 'G' : 'M'; };
    cx.setTransform(s, 0, 0, s, 0, 0); cx.lineCap = cx.lineJoin = 'round';
    const scat = (cell, seed, fn) => { for (let cy = -1; cy <= 360 / cell + 1; cy++) for (let cxl = -1; cxl <= Wu / cell + 1; cxl++) { const r = rng(hash(cxl, cy, seed)); fn((cxl + r.next()) * cell, (cy + r.next()) * cell, r); } };
    scat(95, 811, (x, y, r) => { if (!r.chance(0.55)) return; const P = spline(blobPts(x, y, 6 + r.next() * 10, (6 + r.next() * 10) * 0.8, 0.12, r, 14), true, 3); trace(cx, P); cx.globalAlpha = 0.2; cx.fillStyle = '#faf6ea'; cx.fill(); cx.globalAlpha = 0.3; cx.lineWidth = 0.65; cx.strokeStyle = '#7d8a4a'; cx.stroke(); cx.globalAlpha = 1; }); // backrun blooms
    scat(30, 833, (x, y, r) => { if (mat(x, y) !== 'P' || !r.chance(0.6)) return; const sz = 0.7 + r.next() * 1.4, P = spline(blobPts(x, y, 1.6 * sz, 1.1 * sz, 0.2, r, 7), true, 4); cx.globalAlpha = 0.5; cx.fillStyle = '#a7aaa6'; trace(cx, P.map((p) => [p[0] + 0.3, p[1] + 0.22])); cx.fill(); cx.globalAlpha = 1; outline(cx, P, { w: 0.32, light: 0.5, pieces: 1, alpha: 0.75 }, r); });
    scat(8, 845, (x, y, r) => { if (mat(x, y) !== 'F' || !r.chance(0.5)) return; cx.save(); cx.translate(x, y); cx.scale(1, 0.78); cx.rotate(r.next() * TAU); const L = 1.8 + r.next() * 1.9; cx.beginPath(); cx.moveTo(-L / 2, 0); cx.quadraticCurveTo(0, -L * 0.45, L / 2, 0); cx.quadraticCurveTo(0, L * 0.4, -L / 2, 0); cx.globalAlpha = 0.8; cx.fillStyle = ['#b5602e', '#cf9a45', '#d9772f', '#a83c2a'][r.int(0, 3)]; cx.fill(); cx.restore(); cx.globalAlpha = 1; });
    scat(12, 867, (x, y, r) => {                                                     // ink grass tufts: 3-5 tapered blades
      const m = mat(x, y); if (m === 'P' || !r.chance(m === 'M' ? 0.42 : m === 'G' ? 0.1 : 0.16)) return;
      const n = 3 + r.int(0, 2), sc = 0.8 + r.next() * 0.45;
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.34 + (r.next() - 0.5) * 0.35, len = (2.2 + r.next() * 3.4) * sc, bx = x + (i - (n - 1) / 2) * 0.6 * sc, tx = bx + Math.cos(a) * len, ty = y + Math.sin(a) * len; inkLine(cx, spline([[bx, y], [(bx + tx) / 2 + (r.next() - 0.5) * 1.4 * sc, (y + ty) / 2], [tx, ty]], false, 4), { w: (0.36 + r.next() * 0.14) * sc, ta: 0.04, tb: 0.75, wv: 0.1, color: m === 'F' ? INK_BLUE : INK, alpha: m === 'F' ? 0.38 : 0.45 }); }
    });
    scat(24, 878, (x, y, r) => {                                                     // tiny flowers: daisy, poppy, cornflower
      if (mat(x, y) !== 'M' || !r.chance(0.32)) return; const t = r.next();
      if (t < 0.4) { for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; cx.beginPath(); cx.ellipse(x + Math.cos(a) * 0.95, y + Math.sin(a) * 0.75, 0.75, 0.42, a, 0, TAU); cx.fillStyle = 'rgba(252,249,238,0.95)'; cx.fill(); cx.lineWidth = 0.16; cx.strokeStyle = 'rgba(42,27,20,0.55)'; cx.stroke(); } cx.beginPath(); cx.arc(x, y, 0.45, 0, TAU); cx.fillStyle = '#d9a52e'; cx.fill(); }
      else if (t < 0.75) { cx.beginPath(); cx.ellipse(x + 0.2, y + 0.15, 1.25, 1, 0, 0, TAU); cx.fillStyle = 'rgba(196,62,40,0.8)'; cx.fill(); cx.beginPath(); cx.arc(x, y, 0.3, 0, TAU); cx.fillStyle = INK; cx.fill(); }
      else { cx.fillStyle = 'rgba(84,110,176,0.8)'; for (let i = 0; i < 6; i++) { cx.beginPath(); cx.arc(x + Math.cos(i) * 0.7, y + Math.sin(i) * 0.55, 0.42, 0, TAU); cx.fill(); } }
    });
    scat(64, 822, (x, y, r) => { if (!r.chance(0.5)) return; cx.fillStyle = '#7d8a4a'; for (let i = 0, n = 5 + r.int(0, 9), dir = r.next() * TAU; i < n; i++) { const dd = r.next() * 8, an = dir + (r.next() - 0.5) * 0.9; cx.globalAlpha = 0.25; cx.beginPath(); cx.arc(x + Math.cos(an) * dd, y + Math.sin(an) * dd * 0.8, 0.12 + Math.pow(r.next(), 3) * 0.85, 0, TAU); cx.fill(); } cx.globalAlpha = 1; }); // splatter
    return c;
  }
  /** Book-page margin: bare deckled paper frame with a faint pigment rim line, built per pixel only inside the bands. */
  function buildPage(W, H) {
    const c = canvas(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data, band = Math.ceil(H * 0.11);
    const m = H * 0.024, rad = H * 0.07, hw = W / 2 - m, hh = H / 2 - m, fade = H * 0.09;
    for (let y = 0; y < H; y++) for (let px = 0; px < W; px++) {
      if (y >= band && y < H - band && px >= band && px < W - band) continue;
      const qx = Math.abs(px - W / 2) - (hw - rad), qy = Math.abs(y - H / 2) - (hh - rad), pp = PAP[((y & 255) << 8) | (px & 255)];
      const e = hyp(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad + (WA[((y & 511) << 9) | (px & 511)] - 0.5) * 22 + (pp - 0.5) * 3;
      const f = smooth(-fade, 0, e) * 0.32, rb = Math.exp(-(((e + 3.5) / 2.6) ** 2)) * 0.22, ap = smooth(-1.2, 1.4, e) * 0.97;
      let A = rb + f * (1 - rb); const col = PAPER.map((v, k) => { let C = v * f; C = [120, 82, 58][k] * rb + C * (1 - rb); return v * (0.97 + (pp - 0.5) * 0.08) * ap + C * (1 - ap); });
      A = ap + A * (1 - ap); const o = (y * W + px) * 4;
      if (A > 0.003) { d[o] = col[0] / A; d[o + 1] = col[1] / A; d[o + 2] = col[2] / A; d[o + 3] = A * 255; }
    }
    x.putImageData(img, 0, 0);
    const u = H / 540, r = rng(21); x.lineCap = x.lineJoin = 'round'; MIS = [0, 0];      // HUD bars: wash fill + hand-drawn ink frame
    for (const [x0, y0, bw, bh, f, c, c2, e] of [[14, 8, W / u - 28, 10, 0.77, '#dca23a', '#f2cd72', '#9a5a14'], [42, 32, 142, 12, 1, '#c23b2b', '#e06a50', '#7a1a12']]) {
      x.setTransform(u, 0, 0, u, 0, 0);
      const P = [[x0, y0 + 1], [x0 + bw * f, y0 + 0.5], [x0 + bw * f - 2, y0 + bh / 2], [x0 + bw * f, y0 + bh - 0.5], [x0, y0 + bh - 1]];
      wash(x, P, { c, blobs: [{ x: x0 + bw * 0.3, y: y0 + bh / 2, rx: bw * 0.2, ry: bh * 0.4, c: c2, a: 0.55, blur: 4 }], hi: 0, rim: 2.5, edge: e, rimA: 0.7, rimBlur: 1, gran: 0.6 }, r);
      for (const L of [[[x0 - 4, y0], [x0 + bw / 2, y0 - 0.5], [x0 + bw + 4, y0 + 0.5]], [[x0 - 4, y0 + bh], [x0 + bw / 2, y0 + bh + 0.4], [x0 + bw + 4, y0 + bh]], [[x0, y0 - 3], [x0, y0 + bh + 3]], [[x0 + bw, y0 - 3], [x0 + bw, y0 + bh + 3]]])
        inkLine(x, spline(jit(L, 0.6, r), false, 12), { w: 1.6, ta: 0.04, tb: 0.06, wv: 0.35, ph: r.next() * 9, alpha: 0.9 });
    }
    MIS = [0.45, 0.35]; return c;
  }

  /* ---------- 5. public API ---------- */
  /** Draws the hero with feet at (x, y) in world units. t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) {
    if (!SPR) buildSprites();
    const ph = t * 7, fr = SPR.jack[(Math.floor(ph) & 3) * 3 + (Math.floor(t * 6) % 3)], bob = -0.9 * Math.abs(Math.cos(ph * Math.PI / 2));
    blit(ctx, fr, x, y + bob, facing < 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3 + 0.08 * Math.sin(t * 11) + 0.05 * Math.sin(t * 23);   // warm glow of the carved face
    ctx.drawImage(SPR.glow, x + (facing < 0 ? -2.1 : 2.1) - 9, y + bob - 26.6, 18, 16); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  /** Draws a typical enemy (walking turnip) with feet at (x, y). */
  function drawEnemy(ctx, x, y, t, facing, variant) {
    if (!SPR) buildSprites();
    const set = SPR.creep[variant || 0], seed = (x * 0.13 + y * 0.07) % 1;
    blit(ctx, set[(Math.floor(t * 0.7 * 9 + seed * 4) & 3) * 2 + ((Math.floor(t * 5 + seed * 7)) & 1)], x, y, facing < 0, 0.93 + Math.abs(seed) * 0.14);
  }
  let GROUND = null, PAGE = null, KEY = '';
  /** Paints a complete preview scene into a w×h canvas at time t (seconds). */
  function draw(ctx, w, h, t) {
    if (!SPR) buildSprites();
    const s = h / 360, Wu = w / s, key = w + 'x' + h;
    if (KEY !== key) { GROUND = buildGround(w, h, s); PAGE = buildPage(w, h); KEY = key; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(GROUND, 0, 0);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const hx = Wu * 0.47, hy = 200, actors = [{ k: 'bush', x: hx - 70, y: 245 }, { k: 'bush', x: hx + 120, y: 120 }, { k: 'hero', x: hx, y: hy }];
    [[95, 190], [120, 215], [150, 175], [180, 230], [205, 200], [235, 165], [160, 255], [220, 260], [-150, 110], [-130, 280]].forEach(([dx, dy], i) => actors.push({ k: 'creep', x: hx + dx - Math.min(30, t * 4) % 30, y: dy, v: i % 2, f: dx > 0 ? -1 : 1 }));
    [[-90, 150], [60, 300], [-200, 220]].forEach(([dx, dy], i) => actors.push({ k: 'ghost', x: hx + dx + Math.sin(t + i) * 4, y: dy, i }));
    const sh = new Path2D(), shl = new Path2D();                                     // all shadows = one indigo glaze per frame
    for (const a of actors) { const [rx, ry, P] = a.k === 'hero' ? [7.6, 2.8, sh] : a.k === 'creep' ? [8.5, 3.1, sh] : a.k === 'ghost' ? [5.2, 1.9, shl] : [10, 3.2, sh]; P.moveTo(a.x + 0.8 + rx, a.y + 0.4); P.ellipse(a.x + 0.8, a.y + 0.4, rx, ry, 0, 0, TAU); }
    ctx.fillStyle = 'rgba(50,54,92,0.2)'; ctx.fill(sh); ctx.fillStyle = 'rgba(50,54,92,0.11)'; ctx.fill(shl);
    for (let i = 0; i < 9; i++) { const gx = hx + 40 + (hash(i, 1, 3) % 90), gy = 150 + (hash(i, 2, 3) % 110); ctx.drawImage(SPR.glow, gx - 3, gy - 1.5, 6, 3); blit(ctx, SPR.gem[(Math.floor(t * 4) + i) % 3], gx, gy); }
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) {
      if (a.k === 'hero') drawHero(ctx, a.x, a.y, t, 1);
      else if (a.k === 'creep') drawEnemy(ctx, a.x, a.y, t, a.f, a.v);
      else if (a.k === 'bush') blit(ctx, SPR.bush, a.x, a.y);
      else { ctx.globalAlpha = 0.9; blit(ctx, SPR.ghost[((Math.floor(t * 2.5 + a.i) & 3) * 2) + (Math.floor(t * 5 + a.i) & 1)], a.x, a.y - 2.2 + Math.sin(t * 3 + a.i * 9) * 1.3, a.x > hx); ctx.globalAlpha = 1; }
    }
    const pr = ((t * 1.3) % 1), sx = hx + 10 + pr * 75, sy = hy - 14 + pr * 4;          // seed projectile with dry-brush trail
    const tg = ctx.createLinearGradient(sx - 18, 0, sx, 0); tg.addColorStop(0, 'rgba(214,138,52,0)'); tg.addColorStop(1, 'rgba(224,128,42,0.85)');
    ctx.fillStyle = tg; trace(ctx, ribbon([[sx - 18, sy + 0.3], [sx - 9, sy - 0.2], [sx, sy]], (u) => 0.4 + 2.6 * Math.pow(u, 1.4))); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx, sy, 3.3, 1.8, 0.05, 0, TAU); ctx.fillStyle = '#f1e4bf'; ctx.fill(); ctx.lineWidth = 0.42; ctx.strokeStyle = INK; ctx.stroke();
    ctx.font = '700 15px Caveat, "Segoe Print", cursive'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';  // crit damage number
    ctx.save(); ctx.translate(hx + 98, 160 - (t % 1) * 6); ctx.rotate(-0.1); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(246,239,224,0.9)'; ctx.strokeText('34', 0, 0); ctx.fillStyle = '#9e2a1c'; ctx.fillText('34', 0, 0); ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(PAGE, 0, 0);                     // book page margin on top
    const u = h / 540;
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.font = 26 * u + "px 'IM Fell English SC', Georgia, serif"; ctx.fillText('22:09', w / 2, 40 * u);
    ctx.fillStyle = '#8a3a1e'; ctx.font = '700 ' + 15 * u + "px Caveat, cursive"; ctx.fillText('until midnight', w / 2, 58 * u);
    ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.font = 14 * u + "px 'Cormorant Garamond', Georgia, serif"; ctx.fillText('100/100', 192 * u, 39 * u);
  }

  const Starter = { id: 'watercolor', name: 'Watercolor Storybook', palette: PALETTE, fonts: ['IM Fell English SC', 'Cormorant Garamond', 'Caveat'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['watercolor'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
