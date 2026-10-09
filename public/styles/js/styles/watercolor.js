/* ===========================================================================
   Aquarell-Märchenbuch  (id: watercolor, family: Illustriert)
   A living illustrated storybook: watercolour washes + loose ink linework on
   cold-pressed paper. Everything is procedural:
   - ground: own per-pixel "pigment" shader (absorbance mixing over paper,
     edge pooling, paper gaps, granulation, dapples, wet-in-wet bleeds)
   - sprites: brush toolkit (variable-width ink strokes, wash fills with
     wet-in-wet blobs, rim darkening, granulation, misregistration)
   =========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const K = 3;                         // sprite resolution: px per world unit
  const LX = -0.6, LY = -0.8;          // direction towards the light (upper left)
  const PAPER = [245, 238, 222];
  const PAPER_CSS = '#f5eede';
  const INK = '#2a1b14';
  const INK_BLUE = '#252c46';
  const clamp = U.clamp;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const hsh = (a, b, c) => U.hashInt(a | 0, b | 0, c | 0);
  const hyp = (a, b) => Math.sqrt(a * a + b * b);   // Math.hypot is slow in V8

  /* ======================================================================
     1. Procedural textures (tileable float fields)
     ====================================================================== */
  let PAP, GRA, WA, WB, STR, EXP, GRAIN_C;

  function boxBlur(a, size, rx, ry) {
    const tmp = new Float32Array(a.length);
    if (rx > 0) {
      const inv = 1 / (2 * rx + 1);
      for (let y = 0; y < size; y++) {
        const row = y * size;
        let acc = 0;
        for (let i = -rx; i <= rx; i++) acc += a[row + (((i % size) + size) % size)];
        for (let x = 0; x < size; x++) {
          tmp[row + x] = acc * inv;
          let xa = x + rx + 1; if (xa >= size) xa -= size;
          let xs = x - rx; if (xs < 0) xs += size;
          acc += a[row + xa] - a[row + xs];
        }
      }
      a.set(tmp);
    }
    if (ry > 0) {
      // row-major sweep (one running sum per column) – cache friendly
      const inv = 1 / (2 * ry + 1);
      const acc = new Float32Array(size);
      for (let i = -ry; i <= ry; i++) {
        const row = (((i % size) + size) % size) * size;
        for (let x = 0; x < size; x++) acc[x] += a[row + x];
      }
      for (let y = 0; y < size; y++) {
        const row = y * size;
        let ya = y + ry + 1; if (ya >= size) ya -= size;
        let ys = y - ry; if (ys < 0) ys += size;
        const ra = ya * size, rs = ys * size;
        for (let x = 0; x < size; x++) {
          tmp[row + x] = acc[x] * inv;
          acc[x] += a[ra + x] - a[rs + x];
        }
      }
      a.set(tmp);
    }
  }
  function stdNorm(a) {
    let m = 0;
    for (let i = 0; i < a.length; i++) m += a[i];
    m /= a.length;
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    s = Math.sqrt(s / a.length) || 1;
    for (let i = 0; i < a.length; i++) a[i] = (a[i] - m) / s;
  }
  function noiseTex(size, seed, layers) {
    const rnd = U.mulberry32(seed);
    const out = new Float32Array(size * size);
    for (const L of layers) {
      const a = new Float32Array(size * size);
      for (let i = 0; i < a.length; i++) a[i] = rnd();
      const rx = L.rx === undefined ? L.r : L.rx, ry = L.ry === undefined ? L.r : L.ry;
      if (rx || ry) for (let p = 0; p < (L.p || 3); p++) boxBlur(a, size, rx, ry);
      stdNorm(a);
      for (let i = 0; i < a.length; i++) out[i] += a[i] * L.w;
    }
    stdNorm(out);
    for (let i = 0; i < out.length; i++) out[i] = clamp01(0.5 + out[i] / 4.6);
    return out;
  }
  function buildTextures() {
    PAP = noiseTex(256, 101, [{ r: 1, w: 0.55, p: 2 }, { r: 2, w: 1, p: 3 }, { r: 6, w: 0.45, p: 3 }]);
    GRA = noiseTex(256, 202, [{ r: 0, w: 0.7 }, { r: 1, w: 1, p: 1 }]);
    WA = noiseTex(1024, 303, [{ r: 4, w: 0.35 }, { r: 12, w: 1 }, { r: 34, w: 0.9 }]);
    WB = noiseTex(1024, 404, [{ r: 6, w: 0.5 }, { r: 18, w: 1 }, { r: 46, w: 0.7 }]);
    STR = noiseTex(256, 505, [{ rx: 18, ry: 1, w: 1 }, { rx: 54, ry: 2, w: 0.6 }, { r: 1, w: 0.25, p: 1 }]);
    EXP = new Float32Array(4097);
    for (let i = 0; i <= 4096; i++) EXP[i] = Math.exp(-i / 512);
    // grain canvas for sprite granulation (multiply): mostly white with pigment specks + paper tooth
    GRAIN_C = U.canvas(256, 256);
    const img = GRAIN_C.ctx.createImageData(256, 256), d = img.data;
    for (let i = 0; i < 65536; i++) {
      const g = GRA[i], p = PAP[i];
      const v = 255 - Math.max(0, g - 0.46) * 190 - Math.max(0, 0.5 - p) * 60;
      d[i * 4] = v; d[i * 4 + 1] = v * 0.985; d[i * 4 + 2] = v * 0.96; d[i * 4 + 3] = 255;
    }
    GRAIN_C.ctx.putImageData(img, 0, 0);
  }

  /* ======================================================================
     2. Brush toolkit
     ====================================================================== */
  function spline(pts, closed, steps) {
    steps = steps || 6;
    const n = pts.length, out = [];
    if (n < 3) return pts.map((p) => p.slice());
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      const p3 = pts[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }
  const jit = (pts, a, r) => pts.map((p) => [p[0] + (r.next() - 0.5) * 2 * a, p[1] + (r.next() - 0.5) * 2 * a]);
  function trace(ctx, P, closed) {
    ctx.beginPath();
    ctx.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
    if (closed !== false) ctx.closePath();
  }
  function bbox(P) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of P) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  /** irregular ellipse control points */
  function blobPts(cx, cy, rx, ry, rough, r, n, rot) {
    n = n || 12;
    const out = [];
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (r.next() - 0.5) * 0.3;
      const k = 1 + (r.next() - 0.5) * 2 * rough;
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      out.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return out;
  }
  /** ribbon polygon along an open curve, width function wf(u) */
  function ribbon(pts, wf, steps) {
    const P = spline(pts, false, steps || 6);
    const n = P.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = P[i > 0 ? i - 1 : 0], b = P[i < n - 1 ? i + 1 : n - 1];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = hyp(tx, ty) || 1; tx /= l; ty /= l;
      const w = wf(i / (n - 1)) * 0.5;
      L.push([P[i][0] - ty * w, P[i][1] + tx * w]);
      R.push([P[i][0] + ty * w, P[i][1] - tx * w]);
    }
    return L.concat(R.reverse());
  }
  const leafW = (wm) => (u) => wm * Math.pow(Math.sin(Math.PI * clamp01(u * 0.98 + 0.02)), 0.75) * (u < 0.1 ? 0.6 + u * 4 : 1);
  const taperW = (w0, w1) => (u) => w0 + (w1 - w0) * u;

  /** variable-width ink line along dense points */
  function inkLine(ctx, P, o) {
    const n = P.length;
    if (n < 2) return;
    const acc = new Float32Array(n);
    for (let i = 1; i < n; i++) acc[i] = acc[i - 1] + hyp(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    const tot = acc[n - 1] || 1;
    const w0 = o.w, ta = o.ta === undefined ? 0.2 : o.ta, tb = o.tb === undefined ? 0.3 : o.tb;
    const ph = o.ph || 0, wv = o.wv === undefined ? 0.3 : o.wv, light = o.light || 0;
    const Lx = new Float32Array(n), Ly = new Float32Array(n), Rx = new Float32Array(n), Ry = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = P[i > 0 ? i - 1 : 0], b = P[i < n - 1 ? i + 1 : n - 1];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = hyp(tx, ty) || 1; tx /= l; ty /= l;
      const u = acc[i] / tot;
      let w = w0;
      if (ta > 0 && u < ta) w *= 0.2 + 0.8 * Math.sqrt(u / ta);
      if (tb > 0 && u > 1 - tb) w *= 0.1 + 0.9 * Math.sqrt(Math.max(0, 1 - u) / tb);
      w *= 1 + wv * (0.6 * Math.sin(acc[i] * 0.8 + ph) + 0.4 * Math.sin(acc[i] * 2.1 + ph * 2.3));
      if (light) {
        const nx = P[i][0] - o.cx, ny = P[i][1] - o.cy, nl = hyp(nx, ny) || 1;
        w *= 1 - light * ((nx * LX + ny * LY) / nl);
      }
      if (w < 0.04) w = 0.04;
      const hx = -ty * w * 0.5, hy = tx * w * 0.5;
      Lx[i] = P[i][0] + hx; Ly[i] = P[i][1] + hy; Rx[i] = P[i][0] - hx; Ry[i] = P[i][1] - hy;
    }
    ctx.beginPath();
    ctx.moveTo(Lx[0], Ly[0]);
    for (let i = 1; i < n; i++) ctx.lineTo(Lx[i], Ly[i]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rx[i], Ry[i]);
    ctx.closePath();
    ctx.fillStyle = o.color || INK;
    const ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * (o.alpha === undefined ? 1 : o.alpha);
    ctx.fill();
    ctx.globalAlpha = ga;
  }
  /** control points -> jitter -> spline -> ink line */
  function stroke(ctx, pts, o, r) {
    const p = o.jit && r ? jit(pts, o.jit, r) : pts;
    inkLine(ctx, spline(p, false, o.steps || 6), o);
  }
  /** broken contour around a dense closed ring (pen lifted 2-3 times) */
  function outline(ctx, P, o, r) {
    const n = P.length, pieces = o.pieces || 2;
    if (o.cx === undefined) { const b = bbox(P); o = Object.assign({}, o, { cx: b.cx, cy: b.cy }); }
    let s = (r.next() * n) | 0;
    let rem = n;
    for (let i = 0; i < pieces; i++) {
      const len = i === pieces - 1 ? rem : Math.round((rem / (pieces - i)) * (0.75 + r.next() * 0.5));
      rem -= len;
      const over = Math.round((r.next() - 0.3) * (o.over || 4));
      const seg = [];
      for (let j = 0; j < len + over; j++) seg.push(P[(((s + j) % n) + n) % n]);
      if (seg.length > 1) inkLine(ctx, seg, Object.assign({}, o, { ph: r.next() * 10, ta: o.ta === undefined ? 0.12 : o.ta, tb: o.tb === undefined ? 0.16 : o.tb }));
      s += len;
    }
  }
  /** partial contour: only the part of the ring facing away from light (or a fraction) */
  function partialOutline(ctx, P, o, r) {
    const b = bbox(P), n = P.length;
    const keep = P.map((p) => ((p[0] - b.cx) * -LX + (p[1] - b.cy) * -LY) / (hyp(p[0] - b.cx, p[1] - b.cy) || 1) > (o.side === undefined ? -0.2 : o.side));
    let start = keep.findIndex((k, i) => k && !keep[(i - 1 + n) % n]);
    if (start < 0) { if (keep[0]) outline(ctx, P, o, r); return; }
    let seg = [];
    for (let j = 0; j <= n; j++) {
      const i = (start + j) % n;
      if (keep[i]) seg.push(P[i]);
      else if (seg.length) { if (seg.length > 2) inkLine(ctx, seg, Object.assign({ ta: 0.25, tb: 0.35, cx: b.cx, cy: b.cy, ph: r.next() * 9 }, o)); seg = []; }
    }
    if (seg.length > 2) inkLine(ctx, seg, Object.assign({ ta: 0.25, tb: 0.35, cx: b.cx, cy: b.cy, ph: r.next() * 9 }, o));
  }

  /* ---------- wash fill (watercolour) ---------- */
  const scratches = new Map();
  function getScratch(w, h) {
    const key = w + 'x' + h;
    let s = scratches.get(key);
    if (!s) { s = U.canvas(w, h); s.pat = null; scratches.set(key, s); }
    const t = s.ctx;
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalCompositeOperation = 'source-over';
    t.globalAlpha = 1;
    t.filter = 'none';
    t.clearRect(0, 0, w, h);
    return s;
  }
  let MIS = [0.45, 0.35];   // misregistration of wash vs. ink (world units)
  /**
   * o: c (base), blobs [{x,y,rx,ry,c,a,blur,rot}], hi (highlight alpha), rim (width), edge (rim colour),
   *    rimA, rimBlur, gran, feather, salt (count), alpha, dx, dy, op
   */
  function wash(ctx, P, o, r) {
    const cv = ctx.canvas, m = ctx.getTransform(), k = hyp(m.a, m.b);
    const s = getScratch(cv.width, cv.height), t = s.ctx;
    t.setTransform(m);
    const bb = bbox(P);
    trace(t, P);
    t.fillStyle = o.c;
    t.fill();
    t.globalCompositeOperation = 'source-atop';
    if (o.blobs) {
      for (const b of o.blobs) {
        t.filter = 'blur(' + ((b.blur === undefined ? 2 : b.blur) * k).toFixed(1) + 'px)';
        t.globalAlpha = b.a === undefined ? 0.7 : b.a;
        t.fillStyle = b.c;
        t.beginPath();
        t.ellipse(b.x, b.y, b.rx, b.ry === undefined ? b.rx : b.ry, b.rot || 0, 0, TAU);
        t.fill();
      }
      t.filter = 'none';
      t.globalAlpha = 1;
    }
    if (o.hi !== 0) {
      const lx = bb.x0 + bb.w * 0.3, ly = bb.y0 + bb.h * 0.26, R = Math.max(bb.w, bb.h) * 0.62;
      const g = t.createRadialGradient(lx, ly, 0, lx, ly, R);
      const ha = o.hi === undefined ? 0.4 : o.hi;
      g.addColorStop(0, 'rgba(255,251,238,' + ha + ')');
      g.addColorStop(0.55, 'rgba(255,251,238,' + ha * 0.35 + ')');
      g.addColorStop(1, 'rgba(255,251,238,0)');
      t.fillStyle = g;
      t.fillRect(bb.x0 - 2, bb.y0 - 2, bb.w + 4, bb.h + 4);
    }
    if (o.rim !== 0) {
      t.filter = 'blur(' + ((o.rimBlur === undefined ? 0.55 : o.rimBlur) * k).toFixed(1) + 'px)';
      t.globalAlpha = o.rimA === undefined ? 0.6 : o.rimA;
      t.strokeStyle = o.edge || o.c;
      t.lineWidth = o.rim === undefined ? 1.4 : o.rim;
      trace(t, P);
      t.stroke();
      t.filter = 'none';
      t.globalAlpha = 1;
    }
    if (o.salt && r) {
      // salt texture: tiny pale star-like spots
      t.fillStyle = 'rgba(250,250,246,0.75)';
      for (let i = 0; i < o.salt; i++) {
        const x = bb.x0 + bb.w * (0.15 + r.next() * 0.7), y = bb.y0 + bb.h * (0.1 + r.next() * 0.8);
        const rr = (0.18 + r.next() * 0.35);
        t.beginPath(); t.arc(x, y, rr, 0, TAU); t.fill();
      }
    }
    if (o.gran !== 0) {
      if (!s.pat) s.pat = t.createPattern(GRAIN_C.c, 'repeat');
      t.setTransform(1, 0, 0, 1, 0, 0);
      t.globalCompositeOperation = 'multiply';
      t.globalAlpha = o.gran === undefined ? 0.55 : o.gran;
      t.fillStyle = s.pat;
      t.fillRect(0, 0, cv.width, cv.height);
      t.globalAlpha = 1;
      t.globalCompositeOperation = 'destination-in';
      t.setTransform(m);
      if (o.feather) t.filter = 'blur(' + (o.feather * k).toFixed(1) + 'px)';
      trace(t, P);
      t.fillStyle = '#000';
      t.fill();
      t.filter = 'none';
    } else if (o.feather) {
      t.globalCompositeOperation = 'destination-in';
      t.filter = 'blur(' + (o.feather * k).toFixed(1) + 'px)';
      trace(t, P);
      t.fillStyle = '#000';
      t.fill();
      t.filter = 'none';
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    if (o.op) ctx.globalCompositeOperation = o.op;
    const dx = o.dx === undefined ? MIS[0] : o.dx, dy = o.dy === undefined ? MIS[1] : o.dy;
    ctx.drawImage(s.c, Math.round(dx * k), Math.round(dy * k));
    ctx.restore();
  }
  /** hatching clipped to a shape, only where region(x,y) > 0 */
  function hatch(ctx, P, o, r) {
    const bb = bbox(P);
    ctx.save();
    trace(ctx, P);
    ctx.clip();
    const ca = Math.cos(o.ang), sa = Math.sin(o.ang);
    const R = hyp(bb.w, bb.h) / 2 + 1;
    for (let off = -R; off <= R; off += o.sp * (0.8 + r.next() * 0.4)) {
      let run = null;
      const runs = [];
      for (let t = -R; t <= R; t += 0.5) {
        const x = bb.cx + ca * t - sa * off, y = bb.cy + sa * t + ca * off;
        const v = o.region(x, y) + (r.next() - 0.5) * 0.6;
        if (v > 0) { if (!run) run = []; run.push([x, y]); } else if (run) { runs.push(run); run = null; }
      }
      if (run) runs.push(run);
      for (const rr of runs) {
        if (rr.length < 3) continue;
        const pts = [rr[0], rr[(rr.length / 2) | 0], rr[rr.length - 1]];
        stroke(ctx, pts, { w: o.w, jit: o.jit === undefined ? 0.18 : o.jit, ta: 0.12, tb: 0.4, wv: 0.25, color: o.color || INK, alpha: o.alpha === undefined ? 0.7 : o.alpha }, r);
      }
    }
    ctx.restore();
  }
  /** glowing carved shape (eyes, mouths): warm glow wash + thin ink */
  function glowShape(ctx, pts, r, o) {
    o = o || {};
    const P = o.smooth ? spline(pts, true, 4) : pts;
    const b = bbox(P);
    wash(ctx, P, {
      c: o.c || '#ffcf55',
      blobs: [{ x: b.cx - b.w * 0.05, y: b.cy - b.h * 0.05, rx: b.w * 0.32, ry: b.h * 0.3, c: o.core || '#fff6cf', a: 0.95, blur: Math.max(0.3, b.h * 0.18) }],
      hi: 0, rim: o.rim || 0.9, edge: o.edge || '#e0661f', rimA: 0.85, rimBlur: 0.35, gran: 0, dx: 0, dy: 0,
    });
    outline(ctx, P, { w: o.w || 0.42, pieces: 1, wv: 0.2, over: 2, color: o.ink || INK }, r);
  }
  function radialSprite(px, stops) {
    const c = U.canvas(px, px);
    const g = c.ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    c.ctx.fillStyle = g;
    c.ctx.fillRect(0, 0, px, px);
    return c.c;
  }

  /* ---------- sprite containers ---------- */
  function mkSprite(wu, hu, ax, ay, k) {
    k = k || K;
    const c = document.createElement('canvas');
    c.width = Math.ceil(wu * k); c.height = Math.ceil(hu * k);
    const ctx = c.getContext('2d');
    ctx.setTransform(k, 0, 0, k, ax * k, ay * k);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    return { c, ctx, ax, ay, wu: c.width / k, hu: c.height / k, k };
  }
  function flashOf(src) {
    const w = src.width, h = src.height;
    const { c, ctx } = U.canvas(w, h);
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const L = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
      const t = U.smoothstep(0.14, 0.4, L) * 0.88;
      d[i] += (255 - d[i]) * t; d[i + 1] += (250 - d[i + 1]) * t; d[i + 2] += (236 - d[i + 2]) * t;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  function finish(s, opts) {
    opts = opts || {};
    s.f = U.flipX(s.c);
    if (opts.flash !== false) { s.fl = flashOf(s.c); s.flf = U.flipX(s.fl); }
    return s;
  }
  function softOf(s, blurPx) {
    const { c, ctx } = U.canvas(s.c.width, s.c.height);
    ctx.filter = 'blur(' + blurPx + 'px)';
    ctx.drawImage(s.c, 0, 0);
    ctx.filter = 'none';
    return { c, f: U.flipX(c), ax: s.ax, ay: s.ay, wu: s.wu, hu: s.hu };
  }
  function dissolveFrames(s, n, seed) {
    const w = s.c.width, h = s.c.height;
    const sd = s.c.getContext('2d').getImageData(0, 0, w, h).data;
    const rnd = U.mulberry32(seed);
    const drip = new Float32Array(w);
    let v = rnd();
    for (let x = 0; x < w; x++) {
      v = clamp01(v + (rnd() - 0.5) * 0.45);
      drip[x] = 0.1 + v * 0.9 * (rnd() < 0.12 ? 1.7 : 1);
    }
    const out = [];
    for (let f = 0; f < n; f++) {
      const t = (f + 1) / (n + 1);
      const { c, ctx } = U.canvas(w, h);
      const img = ctx.createImageData(w, h), d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const sy = Math.round(y - drip[x] * t * h * 0.2);
          if (sy < 0) continue;
          const si = (sy * w + x) * 4, a = sd[si + 3];
          if (!a) continue;
          const nv = WA[(((y * 3) & 1023) << 10) | ((x * 2) & 1023)] * 0.75 + PAP[((y & 255) << 8) | (x & 255)] * 0.25;
          const keep = (nv + 0.12 - t * 1.05) * 7;
          if (keep <= 0) continue;
          const kk = Math.min(1, keep), L = t * 0.4, o = (y * w + x) * 4;
          d[o] = sd[si] + (245 - sd[si]) * L;
          d[o + 1] = sd[si + 1] + (238 - sd[si + 1]) * L;
          d[o + 2] = sd[si + 2] + (222 - sd[si + 2]) * L;
          d[o + 3] = a * kk * (1 - t * 0.3);
        }
      }
      ctx.putImageData(img, 0, 0);
      out.push({ c, f: U.flipX(c), ax: s.ax, ay: s.ay, wu: s.wu, hu: s.hu });
    }
    return out;
  }
  function blit(ctx, s, x, y, flip, sc, img) {
    sc = sc || 1;
    const ax = flip ? s.wu - s.ax : s.ax;
    ctx.drawImage(img || (flip ? s.f : s.c), x - ax * sc, y - s.ay * sc, s.wu * sc, s.hu * sc);
  }

  /* ======================================================================
     3. World fields (biomes)
     ====================================================================== */
  const T_F = 0.575, T_G = 0.57;
  const fieldF = (x, y) => U.warped(x / 820, y / 820, 11, 1.15, 3);
  const fieldG = (x, y) => U.warped(x / 640 + 40.3, y / 640 - 25.7, 23, 1.0, 3);
  function fieldP(x, y) {
    const qx = x + 80 * U.perlin(x / 300, y / 300, 5), qy = y + 80 * U.perlin(x / 300 + 9.1, y / 300 - 3.3, 6);
    return U.perlin(qx / 560, qy / 560, 7);
  }
  const pathHW = (x, y) => 7 + 6 * U.noise(x / 260, y / 260, 8);
  const fieldHue = (x, y) => clamp01((U.fbm(x / 260, y / 260, 9, 3) - 0.5) * 2.4 + 0.5);
  const fieldDen = (x, y) => 0.76 + 0.5 * U.fbm(x / 380 + 3.3, y / 380, 10, 2);
  const fieldBleed = (x, y) => U.smoothstep(0.52, 0.72, U.noise(x / 210, y / 210, 12));
  function pathDist(x, y) {
    const p = fieldP(x, y), e = 1.5;
    const gx = (fieldP(x + e, y) - p) / e, gy = (fieldP(x, y + e) - p) / e;
    const gl = Math.sqrt(gx * gx + gy * gy) || 1e-6;
    return Math.abs(p) / gl - pathHW(x, y);   // < 0 inside the path
  }
  function matAt(x, y) {
    const pd = pathDist(x, y);
    const f = fieldF(x, y) - T_F;
    const g = fieldG(x, y) - T_G;
    const kind = pd < 0 ? 'P' : f > 0 ? 'F' : g > 0 ? 'G' : 'M';
    return { kind, pd, f, g };
  }

  /* ======================================================================
     4. Ground chunk shader
     ====================================================================== */
  const ab = (rgb) => rgb.map((v, i) => -Math.log(Math.max(4, v) / PAPER[i]));
  const PG = {
    mCool: ab([178, 198, 162]), mSap: ab([194, 204, 150]), mOch: ab([218, 206, 152]),
    fPay: ab([142, 156, 146]), fInd: ab([130, 138, 162]),
    gOch: ab([233, 206, 136]), gSie: ab([228, 186, 122]),
    pEar: ab([216, 184, 148]), pDk: ab([198, 162, 128]),
  };
  function sst(t) {
    if (t <= -1) return 0;
    if (t >= 1) return 1;
    const u = (t + 1) * 0.5;
    return u * u * (3 - 2 * u);
  }
  function pool(d) {
    if (d <= 0 || d >= 2.6) return 0;
    const q = 1 - d / 2.6;
    return q * q * (d < 0.35 ? d / 0.35 : 1);
  }
  function gapf(d) {
    const a = d < 0 ? -d : d;
    return a < 0.75 ? 1 - a / 0.75 : 0;
  }
  let IMG = null;
  const ST = 16;                       // field grid step (chunk px) – fields are low-frequency, bilinear is plenty
  function* groundGen(ctx, info) {
    const res = info.res, W = info.px, wx = info.wx, wy = info.wy;
    const gr = Math.floor((W - 1) / ST) + 6, N = gr * gr;
    const fF = new Float32Array(N), fG = new Float32Array(N), fP = new Float32Array(N);
    const cH = new Float32Array(N), cU = new Float32Array(N), cD = new Float32Array(N), cB = new Float32Array(N);
    const sp = ST / res;
    for (let j = 0; j < gr; j++) {
      if ((j & 1) === 1) yield;
      const y = wy + (j - 2) * sp;
      for (let i = 0; i < gr; i++) {
        const x = wx + (i - 2) * sp, o = j * gr + i;
        fF[o] = fieldF(x, y); fG[o] = fieldG(x, y); fP[o] = fieldP(x, y);
        cH[o] = pathHW(x, y); cU[o] = fieldHue(x, y); cD[o] = fieldDen(x, y); cB[o] = fieldBleed(x, y);
      }
    }
    yield;
    const dF = new Float32Array(N), dG = new Float32Array(N), dS = new Float32Array(N);
    const inv = 1 / (2 * sp);
    const sd = (f, o, T) => {
      const gx = (f[o + 1] - f[o - 1]) * inv, gy = (f[o + gr] - f[o - gr]) * inv;
      const g = Math.max(Math.sqrt(gx * gx + gy * gy), 1e-5);
      return clamp((f[o] - T) / g, -40, 40);
    };
    for (let j = 1; j < gr - 1; j++) {
      if ((j & 7) === 7) yield;
      for (let i = 1; i < gr - 1; i++) {
        const o = j * gr + i;
        dF[o] = sd(fF, o, T_F); dG[o] = sd(fG, o, T_G); dS[o] = sd(fP, o, 0);
      }
    }
    const rF = new Float32Array(gr), rG = new Float32Array(gr), rS = new Float32Array(gr), rH = new Float32Array(gr);
    const rU = new Float32Array(gr), rD = new Float32Array(gr), rB = new Float32Array(gr);
    // one reusable pixel buffer (chunk jobs run one at a time) – avoids 1.6 MB garbage per chunk
    if (!IMG || IMG.width !== W) IMG = ctx.createImageData(W, W);
    const img = IMG, d = img.data;
    const [mc0, mc1, mc2] = PG.mCool, [ms0, ms1, ms2] = PG.mSap, [mo0, mo1, mo2] = PG.mOch;
    const [fp0, fp1, fp2] = PG.fPay, [fi0, fi1, fi2] = PG.fInd;
    const [go0, go1, go2] = PG.gOch, [gs0, gs1, gs2] = PG.gSie;
    const [pe0, pe1, pe2] = PG.pEar, [pd0, pd1, pd2] = PG.pDk;
    const PR = PAPER[0], PGc = PAPER[1], PB = PAPER[2];
    const gx0 = info.cx * W, gy0 = info.cy * W;
    for (let py = 0; py < W; py++) {
      if ((py & 1) === 1) yield;
      const rf = py / ST + 2, r0 = rf | 0, fy = rf - r0;
      const o0 = r0 * gr, o1 = o0 + gr;
      for (let c = 0; c < gr; c++) {
        const a = o0 + c, b = o1 + c;
        rF[c] = dF[a] + (dF[b] - dF[a]) * fy; rG[c] = dG[a] + (dG[b] - dG[a]) * fy;
        rS[c] = dS[a] + (dS[b] - dS[a]) * fy; rH[c] = cH[a] + (cH[b] - cH[a]) * fy;
        rU[c] = cU[a] + (cU[b] - cU[a]) * fy; rD[c] = cD[a] + (cD[b] - cD[a]) * fy;
        rB[c] = cB[a] + (cB[b] - cB[a]) * fy;
      }
      const gy = gy0 + py;
      const rowP = (gy & 255) << 8, rowA = (gy & 1023) << 10, rowB = ((gy + 389) & 1023) << 10;
      const skew = gy >> 1;
      let o = py * W * 4;
      for (let px = 0; px < W; px++, o += 4) {
        const cf = px / ST + 2, c0 = cf | 0, fx = cf - c0, c1 = c0 + 1;
        const vF = rF[c0] + (rF[c1] - rF[c0]) * fx;
        const vG = rG[c0] + (rG[c1] - rG[c0]) * fx;
        const vS = rS[c0] + (rS[c1] - rS[c0]) * fx;
        const vH = rH[c0] + (rH[c1] - rH[c0]) * fx;
        const vU = rU[c0] + (rU[c1] - rU[c0]) * fx;
        const vD = rD[c0] + (rD[c1] - rD[c0]) * fx;
        const vB = rB[c0] + (rB[c1] - rB[c0]) * fx;
        const gx = gx0 + px;
        const P = PAP[rowP | (gx & 255)];
        const Gr = GRA[rowP | ((gx + 91) & 255)];
        const wa = WA[rowA | (gx & 1023)];
        const wb = WB[rowB | ((gx + skew) & 1023)];
        const st = STR[rowP | ((gx + 37) & 255)];
        const hs = 1 - vB;
        const soft = 0.45 + 5 * vB;
        const eF = vF + (wa - 0.5) * 9 + (P - 0.5) * 0.9;
        const eG = vG + (wb - 0.5) * 9 + (P - 0.5) * 0.9;
        const pc = Math.abs(vS + (wb - 0.5) * 3.5);
        const eP = vH - pc + (P - 0.5) * 0.7;
        const mF = sst(eF / soft), mG = sst(eG / soft), mP = sst(eP / (0.5 + 2 * vB));
        const wP = mP, wF = mF * (1 - wP), wG = mG * (1 - mF) * (1 - wP), wM = 1 - wP - wF - wG;
        // pigment pooling along the wash edges
        const kM = 1 + hs * (0.85 * pool(-eF) + 0.85 * pool(-eG) * (1 - mF) + 0.5 * pool(-eP));
        const kF = 1 + hs * (1.0 * pool(eF) + 0.5 * pool(-eP)) + 0.32 * sst((eF - 20) / 18);
        const kG = 1 + hs * (1.0 * pool(eG) + 0.8 * pool(-eF) + 0.5 * pool(-eP));
        const rut = Math.max(0, 1 - Math.abs(pc - vH * 0.5) * 1.1);
        const kP = 1 + hs * 0.9 * pool(eP) + 0.5 * rut;
        // thin paper gaps between neighbouring washes (in places)
        const gapOn = hs * clamp01((wa - 0.55) * 7);
        const gap = gapOn * (gapf(eF) + gapf(eG) * (1 - mF) + 0.6 * gapf(eP));
        // densities
        let dM = vD * (0.6 + 0.6 * wb);
        dM *= 1 - 0.55 * clamp01((0.32 - wb) * 9);
        const dap = clamp01((wa - 0.64) * 28), ring = Math.max(0, 1 - Math.abs(wa - 0.64) * 70);
        const dFo = vD * (0.82 + 0.35 * wb) * (1 - 0.42 * dap) * (1 + 0.5 * ring * hs);
        const dGo = vD * (0.7 + 0.55 * st);
        const dPo = 0.82 + 0.35 * wb;
        // pigment mixtures (absorbance space)
        const h = clamp01(vU + (wb - 0.5) * 0.5);
        let aM0, aM1, aM2;
        if (h < 0.5) {
          const t = h * 2;
          aM0 = mc0 + (ms0 - mc0) * t; aM1 = mc1 + (ms1 - mc1) * t; aM2 = mc2 + (ms2 - mc2) * t;
        } else {
          const t = h * 2 - 1;
          aM0 = ms0 + (mo0 - ms0) * t; aM1 = ms1 + (mo1 - ms1) * t; aM2 = ms2 + (mo2 - ms2) * t;
        }
        const tf = clamp01(wa * 1.6 - 0.35), tg = clamp01(wb * 1.6 - 0.3);
        const gran = (1 + (Gr - 0.5) * (0.6 * wM + 1.05 * wF + 0.6 * wG + 1.2 * wP)) * (1 + (0.5 - P) * 0.45);
        const mul = (1 - 0.88 * Math.min(1, gap)) * gran;
        const sM = wM * kM * dM * mul, sF = wF * kF * dFo * mul, sG = wG * kG * dGo * mul, sP = wP * kP * dPo * mul;
        const a0 = sM * aM0 + sF * (fp0 + (fi0 - fp0) * tf) + sG * (go0 + (gs0 - go0) * tg) + sP * (pe0 + (pd0 - pe0) * wa);
        const a1 = sM * aM1 + sF * (fp1 + (fi1 - fp1) * tf) + sG * (go1 + (gs1 - go1) * tg) + sP * (pe1 + (pd1 - pe1) * wa);
        const a2 = sM * aM2 + sF * (fp2 + (fi2 - fp2) * tf) + sG * (go2 + (gs2 - go2) * tg) + sP * (pe2 + (pd2 - pe2) * wa);
        const sh = 0.95 + 0.075 * P;
        let i0 = (a0 * 512) | 0, i1 = (a1 * 512) | 0, i2 = (a2 * 512) | 0;
        if (i0 > 4096) i0 = 4096; else if (i0 < 0) i0 = 0;
        if (i1 > 4096) i1 = 4096; else if (i1 < 0) i1 = 0;
        if (i2 > 4096) i2 = 4096; else if (i2 < 0) i2 = 0;
        d[o] = PR * sh * EXP[i0];
        d[o + 1] = PGc * sh * EXP[i1];
        d[o + 2] = PB * sh * EXP[i2];
        d[o + 3] = 255;
      }
    }
    // upload in bands so a single frame never pays for the whole chunk
    for (let band = 0; band < W; band += 128) { ctx.putImageData(img, 0, 0, 0, band, W, Math.min(128, W - band)); yield; }
    yield* decals(ctx, info);
  }

  /* ---------- ground decals (ink + small washes) ---------- */
  const MAT_DK = { M: '#7d8a4a', F: '#3d4a5c', G: '#a8803a', P: '#8a5a36' };
  const LEAF_COLS = ['#b5602e', '#cf9a45', '#d9772f', '#a83c2a', '#8a7a3a', '#c4823a'];
  function grassTuft(ctx, x, y, r, col, a, s) {
    const n = 3 + ((r.next() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i - (n - 1) / 2) * 0.34 + (r.next() - 0.5) * 0.35;
      const len = (2.2 + r.next() * 3.4) * s;
      const bx = x + (i - (n - 1) / 2) * 0.6 * s, by = y + (r.next() - 0.5) * 0.5;
      const bend = (r.next() - 0.5) * 1.4 * s;
      const tx = bx + Math.cos(ang) * len, ty = by + Math.sin(ang) * len;
      inkLine(ctx, spline([[bx, by], [(bx + tx) / 2 + bend, (by + ty) / 2], [tx, ty]], false, 4),
        { w: (0.36 + r.next() * 0.14) * s, ta: 0.04, tb: 0.75, wv: 0.1, color: col, alpha: a });
    }
  }
  function flower(ctx, x, y, r) {
    const t = r.next();
    // tiny stem
    inkLine(ctx, spline([[x, y + 2.6], [x + (r.next() - 0.5) * 0.8, y + 1.2], [x, y]], false, 3), { w: 0.28, ta: 0, tb: 0.5, wv: 0, color: '#4a5a2a', alpha: 0.6 });
    if (t < 0.38) { // daisy / chamomile
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + r.next() * 0.3;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 0.95, y + Math.sin(a) * 0.75, 0.75, 0.42, a, 0, TAU);
        ctx.fillStyle = 'rgba(252,249,238,0.95)'; ctx.fill();
        ctx.lineWidth = 0.16; ctx.strokeStyle = 'rgba(42,27,20,0.55)'; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x + 0.08, y + 0.05, 0.45, 0, TAU); ctx.fillStyle = '#d9a52e'; ctx.fill();
    } else if (t < 0.62) { // poppy
      ctx.beginPath(); ctx.ellipse(x + 0.2, y + 0.15, 1.25, 1.0, r.next(), 0, TAU); ctx.fillStyle = 'rgba(196,62,40,0.8)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y, 1.1, 0.9, r.next(), 0, TAU);
      ctx.lineWidth = 0.18; ctx.strokeStyle = 'rgba(42,27,20,0.6)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 0.3, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    } else if (t < 0.8) { // cornflower
      ctx.fillStyle = 'rgba(84,110,176,0.8)';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * 0.7 + 0.15, y + Math.sin(a) * 0.55 + 0.1, 0.42, 0, TAU); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x, y, 0.35, 0, TAU); ctx.fillStyle = 'rgba(42,27,40,0.7)'; ctx.fill();
    } else { // buttercups
      for (let i = 0; i < 3; i++) {
        const dx = (r.next() - 0.5) * 2.4, dy = (r.next() - 0.5) * 1.6;
        ctx.beginPath(); ctx.arc(x + dx + 0.12, y + dy + 0.1, 0.55, 0, TAU); ctx.fillStyle = 'rgba(232,188,52,0.9)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x + dx, y + dy, 0.5, 0, TAU); ctx.lineWidth = 0.14; ctx.strokeStyle = 'rgba(42,27,20,0.5)'; ctx.stroke();
      }
    }
  }
  function leafDecal(ctx, x, y, r, s) {
    const col = LEAF_COLS[(r.next() * LEAF_COLS.length) | 0];
    const ang = r.next() * TAU, L = (1.8 + r.next() * 1.9) * s, Wd = L * (0.36 + r.next() * 0.2);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.78);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.quadraticCurveTo(0, -Wd, L / 2, 0);
    ctx.quadraticCurveTo(0, Wd * 0.9, -L / 2, 0);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = col;
    ctx.fill();
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 0.22;
    ctx.strokeStyle = '#5a2c18';
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(-L / 2 - 0.4, 0.1); ctx.lineTo(L / 2 * 0.8, -0.05);
    ctx.lineWidth = 0.14; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  function stoneDecal(ctx, x, y, r, s, a) {
    const P = spline(blobPts(x, y, 1.6 * s, 1.1 * s, 0.2, r, 7), true, 4);
    ctx.save();
    ctx.translate(0.3 * s, 0.22 * s);
    trace(ctx, P);
    ctx.globalAlpha = 0.5 * a;
    ctx.fillStyle = ['#a7aaa6', '#b4ab98', '#9da2ab'][(r.next() * 3) | 0];
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = a;
    partialOutline(ctx, P, { w: 0.32 * Math.sqrt(s), wv: 0.3, side: -0.1, color: INK, alpha: 0.75 }, r);
    ctx.globalAlpha = 1;
  }
  function splatter(ctx, x, y, r, col, a) {
    const n = 5 + r.int(0, 9), dir = r.next() * TAU, spread = 3 + r.next() * 7;
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const dd = r.next() * spread, an = dir + (r.next() - 0.5) * 0.9;
      const rad = 0.12 + Math.pow(r.next(), 3) * 0.85;
      ctx.globalAlpha = a * (0.6 + r.next() * 0.4);
      ctx.beginPath(); ctx.arc(x + Math.cos(an) * dd, y + Math.sin(an) * dd * 0.8, rad, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function bloomDecal(ctx, x, y, r, col) {
    const R = 5 + r.next() * 11, n = 28, p1 = r.next() * 9, p2 = r.next() * 9;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + 0.13 * Math.sin(a * 3 + p1) + 0.08 * Math.sin(a * 7 + p2) + (r.next() - 0.5) * 0.14;
      pts.push([x + Math.cos(a) * R * k, y + Math.sin(a) * R * k * 0.8]);
    }
    const P = spline(pts, true, 3);
    trace(ctx, P);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'rgb(250,246,234)';
    ctx.fill();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 0.65;
    ctx.strokeStyle = col;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  function stubble(ctx, x, y, r) {
    const n = 5 + r.int(0, 6);
    for (let i = 0; i < n; i++) {
      const bx = x + i * (1.5 + r.next() * 0.5), by = y + (r.next() - 0.5) * 0.5;
      const h = 0.9 + r.next() * 1.1, lean = (r.next() - 0.3) * 0.6;
      inkLine(ctx, [[bx, by], [bx + lean, by - h]], { w: 0.28, ta: 0, tb: 0.6, wv: 0, color: '#6b4a24', alpha: 0.45 });
    }
  }
  function twig(ctx, x, y, r) {
    const a = r.next() * TAU, L = 3 + r.next() * 4;
    const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.8;
    stroke(ctx, [[x, y], [(x + ex) / 2 + (r.next() - 0.5), (y + ey) / 2 + (r.next() - 0.5)], [ex, ey]], { w: 0.34, ta: 0.05, tb: 0.5, wv: 0.2, color: '#3a2a1f', alpha: 0.6 }, r);
    const t = 0.4 + r.next() * 0.3, fx = x + (ex - x) * t, fy = y + (ey - y) * t, fa = a + (r.next() < 0.5 ? 0.6 : -0.6);
    stroke(ctx, [[fx, fy], [fx + Math.cos(fa) * L * 0.35, fy + Math.sin(fa) * L * 0.3]], { w: 0.24, ta: 0, tb: 0.6, wv: 0, color: '#3a2a1f', alpha: 0.55 }, r);
  }
  function mushroom(ctx, x, y, r) {
    const n = 1 + r.int(0, 2);
    for (let i = 0; i < n; i++) {
      const mx = x + i * (1.8 + r.next()), my = y + (r.next() - 0.5) * 1.2, s = 0.75 + r.next() * 0.5;
      ctx.fillStyle = 'rgba(238,226,196,0.95)';
      ctx.fillRect(mx - 0.3 * s, my - 1.4 * s, 0.6 * s, 1.4 * s);
      ctx.beginPath(); ctx.ellipse(mx + 0.15, my - 1.35 * s + 0.1, 1.25 * s, 0.8 * s, 0, Math.PI, TAU); ctx.closePath();
      ctx.fillStyle = 'rgba(184,64,42,0.9)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(mx, my - 1.35 * s, 1.25 * s, 0.8 * s, 0, Math.PI, TAU); ctx.closePath();
      ctx.lineWidth = 0.2; ctx.strokeStyle = INK; ctx.globalAlpha = 0.75; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(250,246,234,0.95)';
      ctx.beginPath(); ctx.arc(mx - 0.4 * s, my - 1.75 * s, 0.18 * s, 0, TAU); ctx.arc(mx + 0.45 * s, my - 1.6 * s, 0.14 * s, 0, TAU); ctx.fill();
    }
  }
  /** G.scatter clone (identical points) that yields every ~`every` decals so chunk builds stay time-sliced */
  function* scat(info, cell, seed, margin, fn, every) {
    every = every || 40;
    const x0 = Math.floor((info.wx - margin) / cell), x1 = Math.floor((info.wx + info.size + margin) / cell);
    const y0 = Math.floor((info.wy - margin) / cell), y1 = Math.floor((info.wy + info.size + margin) / cell);
    const lx = info.wx - margin, hx = info.wx + info.size + margin, ly = info.wy - margin, hy = info.wy + info.size + margin;
    let k = 0;
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const rng = U.rng(U.hashInt(cx, cy, seed));
        const x = (cx + rng.next()) * cell, y = (cy + rng.next()) * cell;
        if (x < lx || x > hx || y < ly || y > hy) continue;
        fn(x, y, rng, cx, cy);
        if (++k % every === 0) yield;
      }
    }
  }
  function* decals(ctx, info) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // wash blooms / backruns
    yield* scat(info, 95, 811, 22, (x, y, r) => {
      if (!r.chance(0.55)) return;
      const m = matAt(x, y);
      bloomDecal(ctx, x, y, r, MAT_DK[m.kind]);
    });
    // pigment splatter
    yield* scat(info, 64, 822, 12, (x, y, r) => {
      if (!r.chance(0.5)) return;
      const m = matAt(x, y);
      splatter(ctx, x, y, r, MAT_DK[m.kind], m.kind === 'F' ? 0.4 : 0.32);
      if (r.chance(0.35)) splatter(ctx, x + 4, y + 2, r, 'rgba(42,27,20,1)', 0.3);
    });
    // stones (paths + some elsewhere) and pebbles
    yield* scat(info, 30, 833, 6, (x, y, r) => {
      const pd = pathDist(x, y);
      const ch = pd < -1 ? 0.6 : 0.08;
      if (!r.chance(ch)) return;
      stoneDecal(ctx, x, y, r, 0.7 + r.next() * 1.4, pd < 0 ? 0.85 : 0.7);
    });
    yield* scat(info, 11, 834, 3, (x, y, r) => {
      if (!r.chance(0.35)) return;
      if (pathDist(x, y) > -1.5) return;
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#7a5a42';
      ctx.beginPath(); ctx.ellipse(x, y, 0.45 + r.next() * 0.4, 0.3 + r.next() * 0.25, r.next(), 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    });
    // leaf litter
    yield* scat(info, 8, 845, 4, (x, y, r) => {
      const f = fieldF(x, y) - T_F;
      const ch = f > 0.004 ? 0.5 : f > -0.012 ? 0.2 : 0.012;
      if (!r.chance(ch)) return;
      if (f > -0.012 && pathDist(x, y) < 0) { if (!r.chance(0.3)) return; }
      leafDecal(ctx, x, y, r, 0.9 + r.next() * 0.4);
    });
    // stubble rows in golden fields
    yield* scat(info, 14, 856, 18, (x, y, r) => {
      if (!r.chance(0.5)) return;
      const m = matAt(x, y);
      if (m.kind !== 'G') return;
      stubble(ctx, x, y, r);
    });
    // grass tufts (denser along path borders)
    yield* scat(info, 12, 867, 8, (x, y, r) => {
      const m = matAt(x, y);
      if (m.kind === 'P') return;
      const edge = m.pd < 5;
      const ch = edge ? 0.85 : m.kind === 'M' ? 0.42 : m.kind === 'G' ? 0.1 : 0.16;
      if (!r.chance(ch)) return;
      const col = m.kind === 'F' ? INK_BLUE : INK;
      grassTuft(ctx, x, y, r, col, m.kind === 'F' ? 0.38 : 0.45, 0.8 + r.next() * 0.45);
      if (m.kind === 'M' && r.chance(0.3)) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#6e8a3a';
        ctx.beginPath(); ctx.ellipse(x + 0.6, y - 1.2, 2.2, 1.4, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
    // flowers
    yield* scat(info, 24, 878, 4, (x, y, r) => {
      if (!r.chance(0.32)) return;
      const m = matAt(x, y);
      if (m.kind !== 'M') return;
      const n = r.chance(0.4) ? 2 + r.int(0, 2) : 1;
      for (let i = 0; i < n; i++) flower(ctx, x + (r.next() - 0.5) * 6, y + (r.next() - 0.5) * 4, r);
    });
    // forest twigs + mushrooms
    yield* scat(info, 26, 889, 8, (x, y, r) => {
      if (!r.chance(0.32)) return;
      if (fieldF(x, y) < T_F + 0.006) return;
      if (r.chance(0.22)) mushroom(ctx, x, y, r); else twig(ctx, x, y, r);
    });
  }

  /* ======================================================================
     5. Character sprites
     ====================================================================== */
  const SPR = {};
  const HEIGHT = { creeper: 24, ghost: 22, colossus: 48 };

  function part(ctx, P, o, r, io) {
    wash(ctx, P, o, r);
    if (io !== false) outline(ctx, P, Object.assign({ w: 0.7, light: 0.45, pieces: 2, wv: 0.3 }, io || {}), r);
  }

  /* ---------- Jack ---------- */
  function drawJack(ctx, pose, r) {
    const walking = pose.ph !== null;
    const sw = walking ? Math.sin(pose.ph) : 0, cw = walking ? Math.cos(pose.ph) : 0;
    const lift = (v) => (walking ? Math.max(0, v) * 1.5 : 0);
    const J = 0.2;
    // back arm
    const ba = [[-3.4, -11.6], [-4.8, -9.6], [-5.0 - sw * 1.5, -7.6]];
    part(ctx, ribbon(jit(ba, J, r), taperW(2.5, 2.0)), { c: '#34406c', blobs: [{ x: -4.6, y: -10, rx: 1.4, ry: 2, c: '#4b5a8e', a: 0.6, blur: 0.8 }], hi: 0.15, rim: 0.8, edge: '#1f2748', gran: 0.5 }, r, { w: 0.55 });
    wash(ctx, spline(blobPts(-5.1 - sw * 1.5, -7.2, 1.2, 1.1, 0.12, r, 7), true, 4), { c: '#e6d6b8', hi: 0.2, rim: 0.6, edge: '#a08060', gran: 0.3 }, r);
    // legs + boots
    const legs = [[-1.6, -2.4 * sw, lift(-cw)], [1.6, 2.4 * sw, lift(cw)]];
    for (const [hx, dx, li] of legs) {
      const fx = hx + dx, fy = -0.9 - li;
      const LP = ribbon(jit([[hx, -6], [hx + dx * 0.5, -3.4 - li * 0.5], [fx, fy - 0.4]], 0.12, r), taperW(2.3, 1.9));
      part(ctx, LP, { c: '#4a3a34', hi: 0.12, rim: 0.6, edge: '#2a1e1a', gran: 0.35 }, r, { w: 0.5 });
      const BP = spline(blobPts(fx + 0.7, fy + 0.1, 1.9, 1.15, 0.1, r, 8), true, 4);
      part(ctx, BP, { c: '#3b2a24', blobs: [{ x: fx, y: fy - 0.4, rx: 1, ry: 0.5, c: '#6b5040', a: 0.7, blur: 0.5 }], hi: 0.1, rim: 0.5, gran: 0.3 }, r, { w: 0.5 });
    }
    // scarf tail (behind)
    const wv = pose.wave;
    const tail = [[-2.0, -13.2], [-5.0, -12.6 + wv * 0.5], [-8.0, -12.0 - wv * 0.7], [-10.4, -10.8 + wv * 0.9]];
    const TP = ribbon(jit(tail, J, r), (u) => 2.3 - u * 0.9 + Math.sin(u * 9) * 0.15);
    part(ctx, TP, { c: '#b4432f', blobs: [{ x: -6, y: -12.8, rx: 2.5, ry: 1, c: '#d66a48', a: 0.6, blur: 0.7 }, { x: -9.5, y: -11, rx: 1.6, ry: 1.2, c: '#862a1e', a: 0.6, blur: 0.8 }], hi: 0.15, rim: 0.7, edge: '#6e1f15', gran: 0.4 }, r, { w: 0.55 });
    inkLine(ctx, [[-10.2, -10.4], [-11.2, -10.0 + wv * 0.3]], { w: 0.3, ta: 0, tb: 0.6, wv: 0 });
    inkLine(ctx, [[-10.4, -11.2], [-11.5, -11.3 + wv * 0.3]], { w: 0.3, ta: 0, tb: 0.6, wv: 0 });
    // coat
    const coat = [[-3.4, -13.6], [-0.2, -14.0], [3.2, -13.6], [4.9, -11.8], [5.8, -8.2], [6.5, -4.6], [3.4, -4.0], [0.3, -4.5], [-3.0, -3.9], [-6.1, -4.7], [-5.6, -8.4], [-4.9, -12.0]];
    const CP = spline(jit(coat, J, r), true, 6);
    wash(ctx, CP, {
      c: '#41528a',
      blobs: [{ x: -2.2, y: -11, rx: 2.8, ry: 3.2, c: '#6677ad', a: 0.75, blur: 1.4 }, { x: 4.5, y: -6, rx: 3, ry: 3.4, c: '#29345e', a: 0.75, blur: 1.4 }, { x: 0, y: -5, rx: 5, ry: 1.2, c: '#33406e', a: 0.4, blur: 0.8 }],
      hi: 0.3, rim: 1.0, edge: '#1d2546', rimA: 0.6, gran: 0.6,
    }, r);
    outline(ctx, CP, { w: 0.78, light: 0.5, cx: 0, cy: -9, pieces: 3 }, r);
    stroke(ctx, [[0.9, -12.6], [1.2, -8.5], [1.4, -4.7]], { w: 0.32, jit: 0.15, ta: 0.1, tb: 0.4, alpha: 0.75 }, r);
    for (const by of [-10.8, -8.3, -5.9]) {
      ctx.beginPath(); ctx.arc(2.0 + (r.next() - 0.5) * 0.2, by, 0.48, 0, TAU);
      ctx.fillStyle = '#d4a03c'; ctx.fill();
      ctx.lineWidth = 0.18; ctx.strokeStyle = INK; ctx.stroke();
    }
    // pocket hint
    stroke(ctx, [[-4.2, -7.6], [-2.6, -7.4], [-1.6, -7.7]], { w: 0.28, jit: 0.1, ta: 0.2, tb: 0.3, alpha: 0.6 }, r);
    // scarf wrap
    const SW = spline(jit([[-4.6, -13.9], [-1.2, -14.9], [2.8, -14.6], [4.8, -13.4], [3.6, -12.2], [0.2, -12.4], [-3.4, -12.3], [-5.0, -12.9]], 0.15, r), true, 5);
    part(ctx, SW, { c: '#b4432f', blobs: [{ x: -1, y: -14.2, rx: 3, ry: 0.8, c: '#dc7650', a: 0.7, blur: 0.6 }, { x: 3, y: -12.8, rx: 2, ry: 0.9, c: '#7c2318', a: 0.6, blur: 0.6 }], hi: 0.2, rim: 0.7, edge: '#6e1f15', gran: 0.4 }, r, { w: 0.6 });
    stroke(ctx, [[-1.6, -14.3], [-0.6, -13.2], [-0.9, -12.5]], { w: 0.25, jit: 0.08, alpha: 0.6 }, r);
    // head: pumpkin
    const hx = 0.4, hy = -19.6, rx = 8.5, ry = 6.9;
    const hp = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU - Math.PI / 2;
      let x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      const top = Math.exp(-Math.pow((a + Math.PI / 2) / 0.32, 2)); // dent at top
      y += top * 1.0;
      const lobe = 1 + 0.035 * Math.cos(a * 5 + 0.3);
      hp.push([hx + x * lobe, hy + y * lobe]);
    }
    const HP = spline(jit(hp, 0.22, r), true, 6);
    wash(ctx, HP, {
      c: '#e8832f',
      blobs: [
        { x: hx - 3, y: hy - 3, rx: 4.4, ry: 3.2, c: '#f6b45e', a: 0.85, blur: 1.6 },
        { x: hx + 4.2, y: hy + 3.6, rx: 6, ry: 3.4, c: '#bf531b', a: 0.75, blur: 1.8 },
        { x: hx - 5.5, y: hy + 1.5, rx: 2.2, ry: 2.8, c: '#dca13c', a: 0.45, blur: 1.2 },
      ],
      hi: 0.35, rim: 1.25, edge: '#93380f', rimA: 0.6, gran: 0.45,
    }, r);
    // ribs (softer sienna ink)
    for (const dx of [-5.6, -2.2, 3.4, 6.4]) {
      const k = dx / rx;
      const pts = [[hx + dx * 0.55, hy - ry * 0.82], [hx + dx * (1 + Math.abs(k) * 0.05), hy], [hx + dx * 0.6, hy + ry * 0.86]];
      stroke(ctx, pts, { w: 0.42, jit: 0.15, ta: 0.25, tb: 0.35, wv: 0.3, color: '#7e2f0e', alpha: 0.7 }, r);
    }
    outline(ctx, HP, { w: 0.95, light: 0.55, cx: hx, cy: hy, pieces: 3 }, r);
    // stem + tendril + leaf
    const ST_ = ribbon(jit([[hx + 0.2, -25.6], [hx - 0.4, -27.6], [hx + 0.7, -29.6]], 0.12, r), taperW(2.2, 1.4));
    part(ctx, ST_, { c: '#7a6a30', blobs: [{ x: hx, y: -28, rx: 0.8, ry: 1.5, c: '#a39246', a: 0.7, blur: 0.5 }], hi: 0.1, rim: 0.5, gran: 0.4 }, r, { w: 0.55 });
    stroke(ctx, [[hx + 1.2, -26.2], [hx + 2.8, -27.6], [hx + 4.2, -27.0], [hx + 4.1, -25.9], [hx + 3.3, -25.8], [hx + 3.3, -26.6]], { w: 0.34, jit: 0.1, ta: 0.05, tb: 0.5, color: '#3c4a1c' }, r);
    const LF = ribbon(jit([[hx - 0.6, -26.2], [hx - 2.6, -27.6], [hx - 4.6, -27.9]], 0.12, r), leafW(2.2));
    part(ctx, LF, { c: '#6e8b3a', blobs: [{ x: hx - 2, y: -27, rx: 1.2, ry: 0.7, c: '#a3b86a', a: 0.7, blur: 0.5 }], hi: 0.1, rim: 0.5, edge: '#3e5220', gran: 0.4 }, r, { w: 0.45 });
    // carved face (facing right)
    const fx = hx + 1.7;
    glowShape(ctx, jit([[fx - 4.1, -19.5], [fx - 1.3, -19.8], [fx - 2.5, -22.6]], 0.1, r), r);
    glowShape(ctx, jit([[fx + 0.9, -19.8], [fx + 3.3, -19.5], [fx + 2.4, -22.3]], 0.1, r), r);
    glowShape(ctx, jit([[fx - 0.9, -18.1], [fx + 0.4, -18.1], [fx - 0.2, -19.2]], 0.06, r), r, { w: 0.32 });
    const mouth = [[-4.9, -17.0], [-3.6, -16.25], [-2.7, -16.75], [-1.7, -16.05], [0.3, -16.05], [1.3, -16.7], [2.3, -16.15], [3.7, -16.55], [4.4, -17.3], [3.4, -15.15], [1.2, -14.2], [-1.4, -14.1], [-3.6, -14.9]].map((p) => [fx + p[0], p[1]]);
    glowShape(ctx, jit(mouth, 0.08, r), r, { w: 0.45 });
    // front arm
    const fa = [[3.0, -11.8], [4.6, -9.8], [5.6 + sw * 1.5, -7.9]];
    part(ctx, ribbon(jit(fa, J, r), taperW(2.6, 2.1)), { c: '#46578f', blobs: [{ x: 3.6, y: -11, rx: 1.2, ry: 1.6, c: '#7182b5', a: 0.6, blur: 0.7 }], hi: 0.25, rim: 0.8, edge: '#1f2748', gran: 0.5 }, r, { w: 0.6 });
    const MP = spline(blobPts(5.9 + sw * 1.5, -7.4, 1.3, 1.15, 0.12, r, 7), true, 4);
    part(ctx, MP, { c: '#ecdfc2', blobs: [{ x: 6.4 + sw * 1.5, y: -7, rx: 0.8, ry: 0.7, c: '#c9a77e', a: 0.5, blur: 0.4 }], hi: 0.2, rim: 0.5, edge: '#a08060', gran: 0.25 }, r, { w: 0.45 });
  }

  /* ---------- Rüben-Schleicher ---------- */
  const CREEP_PAL = [
    { top: '#7a4a8c', lt: '#a77ab5', dk: '#4e2a5c' },
    { top: '#8b3d6d', lt: '#b4729a', dk: '#5a2244' },
  ];
  function drawCreeper(ctx, pose, r, pal) {
    const sw = Math.sin(pose.ph), cw = Math.cos(pose.ph);
    const lift = (v) => Math.max(0, v) * 1.4;
    // root legs
    for (const [hx, dir, li] of [[-2.4, -1, lift(cw)], [2.6, 1, lift(-cw)]]) {
      const fx = hx + dir * (2.0 * sw + 0.4);
      const fy = -0.4 - li;
      stroke(ctx, [[hx, -5.6], [hx + (fx - hx) * 0.4 - 0.3, -3.2 - li * 0.4], [fx, fy]], { w: 1.25, jit: 0.12, ta: 0.05, tb: 0.35, wv: 0.2, color: '#4a3020' }, r);
      stroke(ctx, [[fx, fy], [fx + 1.3, fy + 0.25]], { w: 0.45, jit: 0.05, ta: 0, tb: 0.6, wv: 0, color: '#4a3020' }, r);
      stroke(ctx, [[fx, fy], [fx - 1.0, fy + 0.35]], { w: 0.4, jit: 0.05, ta: 0, tb: 0.6, wv: 0, color: '#4a3020' }, r);
    }
    // tail root
    stroke(ctx, [[0.4, -4.4], [-0.9, -2.6], [-3.2, -2.2], [-4.4, -2.9]], { w: 0.65, jit: 0.15, ta: 0.05, tb: 0.6, color: '#4a3020' }, r);
    ctx.save();
    ctx.translate(0, -4.5);
    ctx.rotate(sw * 0.075);
    ctx.scale(1, 1 - Math.max(0, -cw) * 0.035);
    ctx.translate(0, 4.5);
    const body = [[0, -22.6], [5.6, -21.4], [8.8, -15.6], [7.7, -9.4], [4.2, -5.6], [0.6, -3.9], [-3.4, -5.6], [-7.5, -9.2], [-8.7, -15.4], [-5.5, -21.4]];
    const BP = spline(jit(body, 0.28, r), true, 6);
    wash(ctx, BP, {
      c: '#eee0ba',
      blobs: [
        { x: 0, y: -20.6, rx: 10.6, ry: 6.0, c: pal.top, a: 0.95, blur: 2.0 },
        { x: -3.4, y: -19.6, rx: 3.8, ry: 2.4, c: pal.lt, a: 0.6, blur: 1.3 },
        { x: 5.6, y: -17.6, rx: 3.4, ry: 3.2, c: pal.dk, a: 0.5, blur: 1.5 },
        { x: 2.4, y: -7.6, rx: 6, ry: 2.6, c: '#e3c886', a: 0.55, blur: 1.6 },
        { x: 6.6, y: -10.6, rx: 2.6, ry: 4.6, c: '#c4a27e', a: 0.4, blur: 1.6 },
      ],
      hi: 0.32, rim: 1.2, edge: '#5a3a52', rimA: 0.5, gran: 0.5,
    }, r);
    // skin rings + root hairs
    stroke(ctx, [[-5.8, -9.8], [-3.0, -8.7], [-0.4, -8.9]], { w: 0.34, jit: 0.12, ta: 0.25, tb: 0.4, alpha: 0.55, color: '#6a4a3a' }, r);
    stroke(ctx, [[2.4, -6.8], [4.4, -7.5], [6.0, -9.0]], { w: 0.34, jit: 0.12, ta: 0.25, tb: 0.4, alpha: 0.55, color: '#6a4a3a' }, r);
    stroke(ctx, [[-4.6, -6.6], [-6.0, -5.4]], { w: 0.25, jit: 0.1, ta: 0, tb: 0.6, wv: 0, alpha: 0.7 }, r);
    stroke(ctx, [[4.8, -6.8], [6.4, -6.0]], { w: 0.25, jit: 0.1, ta: 0, tb: 0.6, wv: 0, alpha: 0.7 }, r);
    outline(ctx, BP, { w: 0.95, light: 0.55, cx: 0, cy: -13.5, pieces: 3 }, r);
    // leaves
    const sway = pose.sway;
    const leaves = [
      [[-0.6, -22.0], [-3.8, -26.4], [-6.6 + sway * 0.6, -30.2]], 3.0,
      [[0.3, -22.4], [0.2, -27.4], [1.6 + sway, -31.6]], 3.2,
      [[1.0, -22.0], [4.2, -25.8], [6.8 + sway * 0.8, -28.4]], 2.8,
    ];
    for (let i = 0; i < leaves.length; i += 2) {
      const pts = jit(leaves[i], 0.18, r);
      const LP = ribbon(pts, leafW(leaves[i + 1]));
      const lb = bbox(LP);
      wash(ctx, LP, {
        c: '#6c8a38',
        blobs: [{ x: pts[0][0], y: pts[0][1] - 1, rx: 1.6, ry: 1.6, c: '#a7bd68', a: 0.7, blur: 0.8 }, { x: pts[2][0], y: pts[2][1], rx: 1.6, ry: 1.6, c: '#46602a', a: 0.6, blur: 0.9 }],
        hi: 0.1, rim: 0.7, edge: '#3a4e1c', gran: 0.45,
      }, r);
      outline(ctx, LP, { w: 0.5, light: 0.4, cx: lb.cx, cy: lb.cy, pieces: 2 }, r);
      stroke(ctx, pts, { w: 0.32, jit: 0.05, ta: 0.05, tb: 0.5, wv: 0.1, alpha: 0.8 }, r);
    }
    // angry glowing eyes
    const eye = (cx, cy, s) => [[cx - 1.25 * s, cy + 0.25], [cx - 0.1, cy - 0.85 * s], [cx + 1.25 * s, cy - 0.15], [cx + 0.1, cy + 0.75 * s]];
    glowShape(ctx, jit(eye(2.4, -16.4, 1), 0.06, r), r, { smooth: true, w: 0.4 });
    glowShape(ctx, jit(eye(6.0, -16.2, 0.82), 0.06, r), r, { smooth: true, w: 0.36 });
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(2.7, -16.4, 0.42, 0, TAU); ctx.arc(6.15, -16.25, 0.36, 0, TAU); ctx.fill();
    stroke(ctx, [[0.3, -18.6], [1.9, -18.2], [3.5, -17.3]], { w: 0.95, jit: 0.08, ta: 0.15, tb: 0.35, wv: 0.1 }, r);
    stroke(ctx, [[7.6, -18.4], [6.4, -18.0], [5.0, -17.2]], { w: 0.85, jit: 0.08, ta: 0.15, tb: 0.35, wv: 0.1 }, r);
    // jagged frown
    inkLine(ctx, jit([[2.2, -12.3], [3.3, -13.1], [4.3, -12.5], [5.3, -13.2], [6.5, -12.3]], 0.08, r), { w: 0.55, ta: 0.15, tb: 0.2, wv: 0.1 });
    ctx.restore();
  }

  /* ---------- Hungergeist ---------- */
  function drawGhost(ctx, pose, r) {
    const p = pose.ph;
    const w1 = Math.sin(p), w2 = Math.sin(p + 1.9), w3 = Math.sin(p + 3.6), arm = Math.sin(p + 0.8);
    // back arm (behind body)
    const BA = ribbon(jit([[3.0, -10.8], [6.6, -10.4 + arm * 0.4], [9.8, -8.9 + arm * 0.7]], 0.15, r), taperW(1.7, 0.6));
    wash(ctx, BA, { c: '#a9b6c8', blobs: [{ x: 8, y: -9.5, rx: 2, ry: 1, c: '#7f8fab', a: 0.6, blur: 0.8 }], hi: 0, rim: 0.6, edge: '#6c7c9c', gran: 0.4, feather: 0.3 }, r);
    for (let i = 0; i < 3; i++) {
      const bx = 9.6, by = -8.9 + arm * 0.7, a = -0.5 + i * 0.45;
      stroke(ctx, [[bx, by], [bx + Math.cos(a) * 1.4, by + Math.sin(a) * 1.4]], { w: 0.26, ta: 0, tb: 0.6, wv: 0, color: INK_BLUE, alpha: 0.75 }, r);
    }
    const body = [[-5.6, -19.2], [-1.6, -23.4], [4.2, -22.6], [7.2, -18.2], [7.0, -13.0], [5.2, -8.6], [2.6, -5.8 + w1 * 0.8], [0.0, -6.9], [-2.4, -3.7 + w2], [-4.1, -7.2], [-7.0, -4.8 + w3], [-7.1, -9.6], [-6.9, -14.6]];
    const BP = spline(jit(body, 0.25, r), true, 6);
    wash(ctx, BP, {
      c: '#d3dbe3',
      blobs: [
        { x: -3.4, y: -8.6, rx: 6, ry: 5, c: '#8fa0bb', a: 0.8, blur: 2.4 },
        { x: 3.4, y: -11.6, rx: 3.6, ry: 4, c: '#a8b8cd', a: 0.55, blur: 1.8 },
        { x: -1.4, y: -20.2, rx: 4.6, ry: 2.6, c: '#f1f3ef', a: 0.7, blur: 1.6 },
        { x: -5.6, y: -5.6, rx: 2.8, ry: 2, c: '#6a7b9e', a: 0.65, blur: 1.4 },
        { x: 6, y: -16, rx: 1.6, ry: 3, c: '#8a9cb8', a: 0.4, blur: 1.2 },
      ],
      hi: 0.25, rim: 1.5, edge: '#6f80a2', rimA: 0.65, rimBlur: 0.7, gran: 0.55, feather: 0.85, salt: 12,
    }, r);
    // lost-and-found ink edges
    const n = BP.length;
    inkLine(ctx, BP.slice(1, Math.round(n * 0.3)), { w: 0.62, ta: 0.3, tb: 0.35, wv: 0.35, color: INK_BLUE, alpha: 0.85, light: 0.5, cx: 0, cy: -15, ph: r.next() * 9 });
    inkLine(ctx, BP.slice(Math.round(n * 0.36), Math.round(n * 0.5)), { w: 0.5, ta: 0.3, tb: 0.4, wv: 0.3, color: INK_BLUE, alpha: 0.7, ph: r.next() * 9 });
    inkLine(ctx, BP.slice(Math.round(n * 0.86), n), { w: 0.42, ta: 0.4, tb: 0.4, wv: 0.3, color: INK_BLUE, alpha: 0.55, ph: r.next() * 9 });
    // hollow eyes + gaping mouth
    const m = ctx.getTransform(), k = hyp(m.a, m.b);
    ctx.filter = 'blur(' + (0.3 * k).toFixed(1) + 'px)';
    ctx.fillStyle = '#20263e';
    ctx.globalAlpha = 0.92;
    ctx.beginPath(); ctx.ellipse(1.3, -17.8, 1.35, 1.95, 0.12, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4.85, -17.6, 1.05, 1.7, 0.08, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3.3, -12.7, 1.35, 2.35 + w2 * 0.15, 0.1, 0, TAU); ctx.fill();
    ctx.filter = 'none';
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#b9d0f2';
    ctx.beginPath(); ctx.ellipse(1.45, -16.8, 0.45, 0.35, 0, 0, TAU); ctx.ellipse(4.95, -16.7, 0.35, 0.3, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    // drooping brows
    stroke(ctx, [[-0.4, -20.2], [1.2, -20.5], [2.6, -19.9]], { w: 0.4, jit: 0.06, ta: 0.2, tb: 0.4, color: INK_BLUE, alpha: 0.75 }, r);
    stroke(ctx, [[3.9, -19.9], [5.0, -20.3], [6.1, -19.8]], { w: 0.36, jit: 0.06, ta: 0.2, tb: 0.4, color: INK_BLUE, alpha: 0.7 }, r);
    // front reaching arm
    const FA = ribbon(jit([[4.4, -13.4], [7.8, -13.8 + arm * 0.5], [11.0, -12.6 + arm]], 0.15, r), taperW(1.8, 0.6));
    wash(ctx, FA, { c: '#c9d2dd', blobs: [{ x: 9.5, y: -13, rx: 2.5, ry: 1, c: '#91a2bd', a: 0.6, blur: 0.8 }], hi: 0.1, rim: 0.6, edge: '#6c7c9c', gran: 0.4, feather: 0.25 }, r);
    stroke(ctx, [[5.2, -14.3], [8.0, -14.5 + arm * 0.5], [10.8, -13.2 + arm]], { w: 0.34, jit: 0.1, ta: 0.2, tb: 0.3, color: INK_BLUE, alpha: 0.7 }, r);
    for (let i = 0; i < 3; i++) {
      const bx = 10.9, by = -12.6 + arm, a = -0.55 + i * 0.5;
      stroke(ctx, [[bx, by], [bx + Math.cos(a) * 1.6, by + Math.sin(a) * 1.6]], { w: 0.28, ta: 0, tb: 0.6, wv: 0, color: INK_BLUE, alpha: 0.85 }, r);
    }
  }

  /* ---------- Steckrüben-Koloss ---------- */
  function drawColossus(ctx, pose, r) {
    const sw = Math.sin(pose.ph), cw = Math.cos(pose.ph);
    const by = 1.4 * Math.abs(sw);
    const lift = (v) => Math.max(0, v) * 2.2;
    const umber = { c: '#7a4e34', blobs: [], hi: 0.15, rim: 1.0, edge: '#3a2216', gran: 0.6 };
    // back arm
    const BA = ribbon(jit([[-13, -33 + by], [-17.2, -25 + by], [-17.4 - sw * 1.2, -15.5 + by]], 0.3, r), taperW(5.2, 2.6));
    part(ctx, BA, Object.assign({}, umber, { c: '#5f3b2a', blobs: [{ x: -16, y: -26 + by, rx: 2, ry: 5, c: '#7e5640', a: 0.6, blur: 1.2 }] }), r, { w: 0.85 });
    for (let i = 0; i < 3; i++) stroke(ctx, [[-17.4 - sw * 1.2, -15.8 + by], [-18.6 + i * 1.3 - sw * 1.2, -12.6 + by + (i === 1 ? 0.6 : 0)]], { w: 0.75, jit: 0.15, ta: 0, tb: 0.6, wv: 0.1 }, r);
    // legs
    for (const [hx, dir, li] of [[-7, -1, lift(cw)], [6.6, 1, lift(-cw)]]) {
      const fx = hx + (dir > 0 ? 3.2 * sw : -3.2 * sw), fy = -0.6 - li;
      const LP = ribbon(jit([[hx, -10 + by], [hx + (fx - hx) * 0.5, -5 - li * 0.5], [fx, fy]], 0.25, r), taperW(5.6, 4.4));
      part(ctx, LP, Object.assign({}, umber, { blobs: [{ x: fx - 1, y: fy - 4, rx: 1.4, ry: 3, c: '#a5764e', a: 0.6, blur: 1 }] }), r, { w: 0.9 });
      for (let i = 0; i < 3; i++) stroke(ctx, [[fx - 1.6 + i * 1.6, fy], [fx - 2.6 + i * 2.6, fy + 0.8]], { w: 0.7, jit: 0.1, ta: 0, tb: 0.6, wv: 0.1 }, r);
    }
    // body
    const cy = -27 + by, n = 18, bp = [];
    const ph1 = r.next() * 6, ph2 = r.next() * 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const kk = 1 + 0.07 * Math.sin(3 * a + 1 + ph1 * 0.05) + 0.05 * Math.sin(5 * a + 2 + ph2 * 0.05) + (r.next() - 0.5) * 0.06;
      let y = Math.sin(a) * 18.4 * kk;
      if (y > 15.5) y = 15.5 + (y - 15.5) * 0.4;
      bp.push([Math.cos(a) * 17.4 * kk, cy + y]);
    }
    const BP = spline(bp, true, 5);
    wash(ctx, BP, {
      c: '#b06a3a',
      blobs: [
        { x: -1, y: cy - 13, rx: 19, ry: 9, c: '#6b4a7d', a: 0.95, blur: 2.6 },
        { x: -7, y: cy - 11.5, rx: 5, ry: 3, c: '#9a7aa8', a: 0.5, blur: 1.8 },
        { x: 2, y: cy + 13, rx: 13, ry: 5, c: '#c99545', a: 0.7, blur: 2.4 },
        { x: 10.5, y: cy + 6, rx: 8, ry: 10, c: '#5a2f2a', a: 0.55, blur: 2.6 },
        { x: -10, y: cy + 3, rx: 4, ry: 6, c: '#c47a45', a: 0.5, blur: 2 },
      ],
      hi: 0.28, rim: 1.8, edge: '#3d2230', rimA: 0.65, gran: 0.7,
    }, r);
    // moss
    wash(ctx, spline(blobPts(-8.5, cy - 13.5, 3.4, 1.6, 0.25, r, 8), true, 4), { c: '#7d8f45', blobs: [{ x: -9, y: cy - 14, rx: 1.4, ry: 0.8, c: '#a9b86a', a: 0.6, blur: 0.6 }], hi: 0, rim: 0.6, edge: '#4a5a24', gran: 0.6, alpha: 0.85 }, r);
    // hatching on the shadow side
    hatch(ctx, BP, { ang: -1.0, sp: 1.15, w: 0.4, alpha: 0.62, region: (x, y) => (x * 0.55 + (y - cy) * 0.83) - 4.5 }, r);
    hatch(ctx, BP, { ang: 0.55, sp: 1.4, w: 0.36, alpha: 0.55, region: (x, y) => (x * 0.55 + (y - cy) * 0.83) - 11 }, r);
    // gnarl marks on the lit side
    for (let i = 0; i < 7; i++) {
      const x = -12 + r.next() * 14, y = cy - 6 + r.next() * 16;
      stroke(ctx, [[x, y], [x + 1.2 + r.next(), y - 0.6 + r.next() * 1.2], [x + 2.4, y + (r.next() - 0.5)]], { w: 0.36, jit: 0.15, ta: 0.2, tb: 0.4, alpha: 0.5 }, r);
    }
    // glowing cracks from the core
    const core = [3.2, cy + 1.5];
    const cracks = [
      [core, [-2.6, cy - 4.6], [-6.4, cy - 7.2], [-9.4, cy - 6.4]],
      [core, [8.4, cy + 6.4], [12.2, cy + 9.6], [13.4, cy + 13.4]],
      [core, [1.6, cy + 8.8], [-1.8, cy + 12.2]],
      [core, [8.2, cy - 4.4], [10.6, cy - 8.0]],
    ];
    const m = ctx.getTransform(), k = hyp(m.a, m.b);
    for (const c of cracks) {
      const pts = jit(c, 0.35, r);
      ctx.filter = 'blur(' + (0.9 * k).toFixed(1) + 'px)';
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#ffc548';
      ctx.lineWidth = 1.5;
      trace(ctx, pts, false);
      ctx.stroke();
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff0b0';
      ctx.lineWidth = 0.4;
      trace(ctx, pts, false);
      ctx.stroke();
      inkLine(ctx, pts.map((p) => [p[0] + 0.35, p[1] + 0.3]), { w: 0.55, ta: 0.05, tb: 0.5, wv: 0.4 });
    }
    // glowing core
    const CP = jit(blobPts(core[0], core[1], 3.6, 4.2, 0.22, r, 9), 0.1, r);
    ctx.filter = 'blur(' + (1.6 * k).toFixed(1) + 'px)';
    ctx.fillStyle = 'rgba(255,196,80,0.75)';
    trace(ctx, CP); ctx.fill();
    ctx.filter = 'none';
    wash(ctx, CP, { c: '#ffb43c', blobs: [{ x: core[0] - 0.4, y: core[1] - 0.6, rx: 2.4, ry: 2.8, c: '#fff6c8', a: 1, blur: 1 }], hi: 0, rim: 1.2, edge: '#d2561f', rimA: 0.9, rimBlur: 0.4, gran: 0, dx: 0, dy: 0 }, r);
    outline(ctx, CP, { w: 0.85, light: 0.4, pieces: 2 }, r);
    // brow, eye sockets, glowing eyes, cracked mouth
    for (const [ex, ey, rx, ry] of [[2.2, cy - 9.6, 2.4, 1.6], [9.8, cy - 9.1, 2.0, 1.4]]) {
      ctx.fillStyle = '#2b1a1c';
      ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, TAU); ctx.fill();
      ctx.filter = 'blur(' + (0.7 * k).toFixed(1) + 'px)';
      ctx.fillStyle = 'rgba(255,200,80,0.9)';
      ctx.beginPath(); ctx.ellipse(ex + 0.3, ey + 0.1, rx * 0.65, ry * 0.6, 0, 0, TAU); ctx.fill();
      ctx.filter = 'none';
      ctx.fillStyle = '#fff4c2';
      ctx.beginPath(); ctx.ellipse(ex + 0.3, ey + 0.1, rx * 0.32, ry * 0.36, 0, 0, TAU); ctx.fill();
    }
    stroke(ctx, [[-1.6, cy - 12.0], [2.4, cy - 11.4], [6.0, cy - 10.2], [9.6, cy - 11.3], [13.0, cy - 12.0]], { w: 1.55, jit: 0.15, ta: 0.15, tb: 0.25, wv: 0.3 }, r);
    const mouth = jit([[2.4, cy - 4.6], [4.2, cy - 3.6], [6.0, cy - 4.5], [7.8, cy - 3.4], [9.6, cy - 4.3], [11.2, cy - 3.7]], 0.12, r);
    ctx.filter = 'blur(' + (0.7 * k).toFixed(1) + 'px)';
    ctx.strokeStyle = 'rgba(255,190,70,0.8)'; ctx.lineWidth = 1.2;
    trace(ctx, mouth, false); ctx.stroke();
    ctx.filter = 'none';
    inkLine(ctx, mouth, { w: 0.75, ta: 0.1, tb: 0.15, wv: 0.3 });
    outline(ctx, BP, { w: 1.5, light: 0.6, cx: 0, cy, pieces: 3 }, r);
    // withered leaf crown
    const crown = [
      [[-2.2, cy - 17.4], [-6.4, cy - 22.4], [-11.4, cy - 21.6]], '#7e7a3c',
      [[0.6, cy - 18.0], [-0.2, cy - 24.0], [2.6, cy - 26.6]], '#9a5a2a',
      [[3.0, cy - 17.6], [8.0, cy - 22.0], [12.2, cy - 20.4]], '#6d7f3a',
      [[-4.4, cy - 16.8], [-10.0, cy - 18.8], [-13.4, cy - 15.6]], '#8a6a30',
    ];
    for (let i = 0; i < crown.length; i += 2) {
      const pts = jit(crown[i], 0.3, r);
      const LP = ribbon(pts, leafW(3.6));
      wash(ctx, LP, { c: crown[i + 1], blobs: [{ x: pts[1][0], y: pts[1][1], rx: 2, ry: 1.4, c: '#b8a860', a: 0.5, blur: 1 }], hi: 0.1, rim: 0.8, edge: '#3a3018', gran: 0.6 }, r);
      outline(ctx, LP, { w: 0.6, light: 0.4, pieces: 2 }, r);
      stroke(ctx, pts, { w: 0.4, jit: 0.05, ta: 0.05, tb: 0.5, wv: 0.1, alpha: 0.75 }, r);
    }
    // front arm
    const FA = ribbon(jit([[12.6, -33.6 + by], [18.4, -25 + by], [19.6 + sw * 1.2, -15 + by]], 0.3, r), taperW(5.6, 2.8));
    part(ctx, FA, Object.assign({}, umber, { c: '#8a5a3a', blobs: [{ x: 15, y: -31 + by, rx: 2, ry: 2.5, c: '#b78058', a: 0.6, blur: 1 }, { x: 19, y: -20 + by, rx: 2, ry: 4, c: '#5a3826', a: 0.6, blur: 1.2 }] }), r, { w: 0.95, light: 0.5 });
    for (let i = 0; i < 3; i++) stroke(ctx, [[19.6 + sw * 1.2, -15.4 + by], [18.6 + i * 1.5 + sw * 1.2, -12.0 + by + (i === 1 ? 0.7 : 0)]], { w: 0.8, jit: 0.15, ta: 0, tb: 0.6, wv: 0.1 }, r);
  }

  /* ---------- small things: gems, lantern, seed, trails ---------- */
  function drawGemDrop(ctx, r) {
    const pts = [[0, -8.6], [1.3, -6.4], [2.6, -4.0], [2.4, -2.0], [0.4, -0.9], [-1.8, -1.5], [-2.6, -3.6], [-1.6, -6.2]];
    const P = spline(jit(pts, 0.12, r), true, 5);
    wash(ctx, P, { c: '#e6a92f', blobs: [{ x: -0.4, y: -4, rx: 1.4, ry: 2, c: '#fbe39c', a: 0.95, blur: 0.6 }, { x: 1.6, y: -2, rx: 1.2, ry: 1, c: '#b8701c', a: 0.6, blur: 0.5 }], hi: 0, rim: 0.7, edge: '#9a5a14', rimA: 0.7, gran: 0.25, dx: 0.25, dy: 0.2 }, r);
    outline(ctx, P, { w: 0.42, light: 0.5, pieces: 2, over: 2 }, r);
    ctx.fillStyle = 'rgba(255,253,244,0.95)';
    ctx.beginPath(); ctx.ellipse(-0.8, -4.6, 0.45, 0.7, 0.3, 0, TAU); ctx.fill();
  }
  function starPts(cx, cy, R1, R2, n, rot) {
    const out = [];
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * TAU, R = i % 2 ? R2 : R1;
      out.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
    }
    return out;
  }
  function drawGemStar(ctx, r) {
    const P = spline(jit(starPts(0, -5.6, 5.0, 2.4, 5, -Math.PI / 2), 0.2, r), true, 3);
    wash(ctx, P, { c: '#e9a52c', blobs: [{ x: -0.4, y: -6.2, rx: 2, ry: 2, c: '#fff0b8', a: 1, blur: 0.8 }, { x: 2.5, y: -3, rx: 2, ry: 1.6, c: '#c2541c', a: 0.6, blur: 0.8 }], hi: 0, rim: 0.9, edge: '#a2501a', rimA: 0.75, gran: 0.3, dx: 0.3, dy: 0.25 }, r);
    outline(ctx, P, { w: 0.5, light: 0.5, pieces: 2, over: 2 }, r);
    for (let i = 0; i < 4; i++) {
      const a = -2.4 + i * 1.6 + r.next() * 0.3;
      stroke(ctx, [[Math.cos(a) * 6.4, -5.6 + Math.sin(a) * 6.4], [Math.cos(a) * 7.8, -5.6 + Math.sin(a) * 7.8]], { w: 0.35, ta: 0, tb: 0.5, wv: 0, color: '#9a5a14' }, r);
    }
  }
  function drawLantern(ctx, r) {
    // small carved turnip lantern hanging from a looped stalk
    stroke(ctx, [[0, -12.4], [-0.6, -14.2], [0.4, -15.4], [1.0, -14.0], [0.2, -12.6]], { w: 0.38, jit: 0.08, ta: 0.05, tb: 0.1, wv: 0.2 }, r);
    const body = [[0, -12.0], [3.6, -11.2], [5.2, -7.8], [4.4, -3.6], [1.6, -1.4], [0, -0.6], [-1.6, -1.4], [-4.4, -3.6], [-5.2, -7.8], [-3.6, -11.2]];
    const BP = spline(jit(body, 0.18, r), true, 5);
    wash(ctx, BP, {
      c: '#efe0b8',
      blobs: [{ x: 0, y: -11, rx: 6.4, ry: 3.4, c: '#7a4a8c', a: 0.95, blur: 1.4 }, { x: 0.5, y: -4.4, rx: 3.6, ry: 2.4, c: '#ffd77a', a: 0.65, blur: 1.4 }],
      hi: 0.25, rim: 0.9, edge: '#5a3a52', rimA: 0.5, gran: 0.4,
    }, r);
    outline(ctx, BP, { w: 0.62, light: 0.5, cx: 0, cy: -6.5, pieces: 2 }, r);
    for (const L of [[[-0.4, -11.8], [-2.6, -14.4], [-4.0, -15.6]], [[0.4, -11.8], [2.2, -14.6], [3.6, -15.8]]]) {
      const LP = ribbon(jit(L, 0.1, r), leafW(1.8));
      wash(ctx, LP, { c: '#6c8a38', hi: 0, rim: 0.5, edge: '#3a4e1c', gran: 0.3 }, r);
      outline(ctx, LP, { w: 0.35, pieces: 1 }, r);
    }
    glowShape(ctx, jit([[-2.6, -6.4], [-0.8, -6.6], [-1.6, -8.4]], 0.06, r), r, { w: 0.32 });
    glowShape(ctx, jit([[0.8, -6.6], [2.6, -6.4], [1.8, -8.3]], 0.06, r), r, { w: 0.32 });
    glowShape(ctx, jit([[-2.8, -4.6], [-1.5, -3.9], [0, -4.4], [1.5, -3.9], [2.8, -4.6], [1.6, -2.7], [-1.6, -2.7]], 0.06, r), r, { w: 0.34 });
  }
  function drawSeed(ctx, r) {
    const pts = [[3.4, 0], [2.0, -1.55], [-0.6, -1.9], [-2.6, -1.0], [-3.3, 0], [-2.6, 1.0], [-0.6, 1.9], [2.0, 1.55]];
    const P = spline(jit(pts, 0.08, r), true, 5);
    wash(ctx, P, { c: '#f1e4bf', blobs: [{ x: -0.4, y: -0.3, rx: 1.6, ry: 0.9, c: '#fffaf0', a: 0.9, blur: 0.5 }, { x: 1.8, y: 0.8, rx: 1.6, ry: 1, c: '#c9a050', a: 0.5, blur: 0.5 }], hi: 0, rim: 0.7, edge: '#b48a3c', rimA: 0.8, gran: 0.2, dx: 0.15, dy: 0.12 }, r);
    outline(ctx, P, { w: 0.42, pieces: 1, over: 2, wv: 0.2 }, r);
    stroke(ctx, [[-2.2, 0.1], [0, -0.1], [2.2, 0.05]], { w: 0.2, ta: 0.3, tb: 0.4, wv: 0, color: '#9a7a3a', alpha: 0.6 }, r);
  }
  function drawTrail(ctx, r) {
    // tapered dry-brush stroke, head at x=0 pointing right
    const len = 18;
    const pts = [[-len, 0.3], [-len * 0.66, -0.2], [-len * 0.33, 0.25], [0, 0]];
    const P = ribbon(pts, (u) => 0.4 + 2.6 * Math.pow(u, 1.4));
    const s = getScratch(ctx.canvas.width, ctx.canvas.height), t = s.ctx;
    t.setTransform(ctx.getTransform());
    const g = t.createLinearGradient(-len, 0, 0, 0);
    g.addColorStop(0, 'rgba(214,138,52,0)');
    g.addColorStop(0.45, 'rgba(214,138,52,0.45)');
    g.addColorStop(1, 'rgba(224,128,42,0.85)');
    trace(t, P); t.fillStyle = g; t.fill();
    // dry brush streak gaps
    t.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 5; i++) {
      const y = -1.2 + i * 0.6 + (r.next() - 0.5) * 0.2;
      t.globalAlpha = 0.5 + r.next() * 0.4;
      t.lineWidth = 0.18 + r.next() * 0.15;
      t.beginPath(); t.moveTo(-len, y); t.lineTo(-len * (0.1 + r.next() * 0.4), y + (r.next() - 0.5) * 0.3); t.strokeStyle = '#000'; t.stroke();
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(s.c, 0, 0); ctx.restore();
  }

  /* ---------- particle / fx sprites ---------- */
  const FXCOL = {
    ink: '#2a1b14', violet: '#7a4a8c', plum: '#8b3d6d', cream: '#eadcb4', leaf: '#6c8a38', ghost: '#9fb0c6', ghostDk: '#5f6f92',
    sienna: '#a3532c', ochre: '#cf9a45', gold: '#e6a92f', red: '#b5352a', orange: '#e57f2c', indigo: '#3f4f7d', umber: '#6b4a2e', frost: '#e4ebf2',
  };
  const FX = {};
  function fxSprites() {
    for (const key in FXCOL) {
      const col = FXCOL[key];
      const set = (FX[key] = { dot: [], splat: [] });
      for (let v = 0; v < 3; v++) {
        const s = mkSprite(6, 6, 3, 3, 6);
        const r = U.rng(hsh(v, key.length, 31));
        const P = spline(blobPts(0, 0, 2.2, 2.0, 0.22, r, 8), true, 4);
        const t = s.ctx;
        trace(t, P); t.fillStyle = col; t.globalAlpha = 0.9; t.fill();
        t.globalAlpha = 0.55; t.lineWidth = 0.5; t.strokeStyle = key === 'ink' ? col : 'rgba(42,27,20,0.6)'; t.stroke();
        t.globalAlpha = 1;
        set.dot.push(s);
      }
      for (let v = 0; v < 2; v++) {
        const s = mkSprite(16, 16, 8, 8, 5);
        const r = U.rng(hsh(v + 7, key.length, 37));
        const t = s.ctx;
        // splash: central blot + radiating droplets
        const P = spline(blobPts(0, 0, 3.4, 3.1, 0.35, r, 11), true, 3);
        trace(t, P); t.fillStyle = col; t.globalAlpha = 0.92; t.fill();
        for (let i = 0; i < 9; i++) {
          const a = r.next() * TAU, d = 3.5 + r.next() * 3.6, rr = 0.25 + r.next() * 0.8;
          t.beginPath(); t.arc(Math.cos(a) * d, Math.sin(a) * d, rr, 0, TAU); t.fill();
          t.lineWidth = rr * 0.9; t.strokeStyle = col;
          t.beginPath(); t.moveTo(Math.cos(a) * 2.4, Math.sin(a) * 2.4); t.lineTo(Math.cos(a) * (d - rr), Math.sin(a) * (d - rr)); t.stroke();
        }
        t.globalAlpha = 1;
        set.splat.push(s);
      }
    }
    // bloom ring
    {
      const s = mkSprite(24, 24, 12, 12, 5), t = s.ctx, r = U.rng(99);
      const pts = [];
      for (let i = 0; i < 30; i++) { const a = (i / 30) * TAU, k = 1 + 0.08 * Math.sin(a * 5) + (r.next() - 0.5) * 0.1; pts.push([Math.cos(a) * 10 * k, Math.sin(a) * 10 * k]); }
      const P = spline(pts, true, 3);
      trace(t, P);
      const g = t.createRadialGradient(0, 0, 2, 0, 0, 10.5);
      g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.75, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0.9)');
      t.fillStyle = g; t.fill();
      FX.ring = s; // white – tinted per use
    }
    FX.ringTint = {};
    for (const key of ['violet', 'ghost', 'sienna', 'gold', 'red', 'orange', 'ink']) FX.ringTint[key] = U.tint(FX.ring.c, FXCOL[key], 1);
    // star sparkle
    {
      const s = mkSprite(8, 8, 4, 4, 6), t = s.ctx;
      const P = starPts(0, 0, 3.6, 0.9, 4, 0);
      trace(t, P); t.fillStyle = '#ffd866'; t.fill();
      t.lineWidth = 0.35; t.strokeStyle = '#8a5a14'; t.stroke();
      t.fillStyle = '#fffbe8'; t.beginPath(); t.arc(0, 0, 0.7, 0, TAU); t.fill();
      FX.star = s;
    }
    // dash smear: indigo dry brush
    {
      const s = mkSprite(30, 12, 28, 6, 4), t = s.ctx, r = U.rng(555);
      for (let i = 0; i < 9; i++) {
        const y = -3.6 + i * 0.9 + (r.next() - 0.5) * 0.3;
        const x0 = -26 + r.next() * 10;
        inkLine(t, [[x0, y], [(x0) / 2, y + (r.next() - 0.5) * 0.6], [0, y * 0.6]], { w: 0.6 + r.next() * 0.7, ta: 0.6, tb: 0.05, wv: 0.4, color: i % 3 === 0 ? '#2b3558' : '#41528a', alpha: 0.55 + r.next() * 0.3 });
      }
      FX.smear = s;
    }
    // glow halos
    FX.glow = radialSprite(64, [[0, 'rgba(255,226,140,0.95)'], [0.35, 'rgba(255,196,90,0.5)'], [1, 'rgba(255,170,60,0)']]);
    FX.pool = radialSprite(64, [[0, 'rgba(255,214,110,0.55)'], [0.6, 'rgba(255,200,100,0.22)'], [1, 'rgba(255,190,90,0)']]);
    // spawn stains (enemy colours)
    FX.stain = {};
    for (const [key, col, col2] of [['creeper', '#7a4a8c', '#e3c886'], ['ghost', '#8fa0bb', '#d3dbe3'], ['colossus', '#9a5a3a', '#6b4a7d']]) {
      const s = mkSprite(28, 28, 14, 14, 4), r = U.rng(key.length * 13);
      MIS = [0, 0];
      wash(s.ctx, spline(blobPts(0, 0, 11, 11, 0.16, r, 14), true, 4), { c: col2, blobs: [{ x: 0, y: 0, rx: 7, ry: 7, c: col, a: 0.8, blur: 3 }], hi: 0, rim: 2.2, edge: col, rimA: 0.8, rimBlur: 0.8, gran: 0.6, feather: 0.6 }, r);
      MIS = [0.45, 0.35];
      FX.stain[key] = s;
    }
  }

  /* ======================================================================
     6. Props
     ====================================================================== */
  const PROPS = {};
  const TREE_PALS = [
    ['#d9a443', '#c26a31', '#8a8a3a'],
    ['#9aa648', '#d0a046', '#6f7f3a'],
    ['#e08a3a', '#b8452c', '#d6aa4c'],
    ['#c49a3e', '#8f8a3a', '#b5602e'],
  ];
  function drawTree(ctx, r, pal, h) {
    // trunk
    const tl = [[-3.8, 0.4], [-2.3, -3.6], [-1.6, -h * 0.25], [-1.3, -h * 0.46]];
    const tr = [[1.6, -h * 0.46], [1.9, -h * 0.25], [2.6, -3.6], [4.4, 0.4]];
    const TP = spline(jit(tl, 0.25, r), false, 5).concat(spline(jit(tr, 0.25, r), false, 5));
    wash(ctx, TP, { c: '#7d5a3e', blobs: [{ x: -1.2, y: -h * 0.2, rx: 1.2, ry: h * 0.2, c: '#a88563', a: 0.7, blur: 1 }, { x: 2.4, y: -h * 0.18, rx: 1.4, ry: h * 0.2, c: '#4e3628', a: 0.65, blur: 1.2 }], hi: 0.1, rim: 0.8, edge: '#3a2618', gran: 0.6 }, r);
    stroke(ctx, tl, { w: 0.8, jit: 0.2, ta: 0.05, tb: 0.3, wv: 0.3 }, r);
    stroke(ctx, tr, { w: 1.3, jit: 0.2, ta: 0.3, tb: 0.05, wv: 0.3 }, r);
    for (let i = 0; i < 4; i++) {
      const y = -3 - r.next() * h * 0.36;
      stroke(ctx, [[0.2 + r.next(), y], [1.2 + r.next(), y - 1.2]], { w: 0.3, jit: 0.1, ta: 0.1, tb: 0.5, wv: 0, alpha: 0.6 }, r);
    }
    // branches into the crown
    const bt = -h * 0.44;
    for (const [ex, ey] of [[-8, -h * 0.66], [7, -h * 0.7], [0.6, -h * 0.8], [-3.6, -h * 0.58]]) {
      stroke(ctx, [[0.2, bt], [ex * 0.45, (bt + ey) / 2], [ex, ey]], { w: 1.1, jit: 0.6, ta: 0.05, tb: 0.65, wv: 0.3 }, r);
    }
    // crown: overlapping glazes
    const ccx = 0.5, ccy = -h * 0.68, R = h * 0.3;
    const blobs = [
      [-R * 0.42, R * 0.12, 0.62], [R * 0.4, R * 0.1, 0.62], [0, -R * 0.38, 0.66], [-R * 0.2, R * 0.38, 0.5], [R * 0.28, R * 0.4, 0.5], [-R * 0.62, -R * 0.2, 0.4], [R * 0.6, -R * 0.24, 0.42],
    ];
    const all = [];
    blobs.forEach((b, i) => {
      const cx = ccx + b[0] + (r.next() - 0.5) * 2, cy = ccy + b[1] + (r.next() - 0.5) * 2, rr = R * b[2];
      const P = spline(blobPts(cx, cy, rr, rr * 0.86, 0.16, r, 13), true, 4);
      all.push(P);
      const lit = (-(b[0]) * 0.6 - b[1] * 0.8) / R;
      wash(ctx, P, {
        c: pal[i % 3],
        blobs: [
          { x: cx - rr * 0.35, y: cy - rr * 0.35, rx: rr * 0.5, ry: rr * 0.42, c: '#f2d68c', a: 0.35 + Math.max(0, lit) * 0.3, blur: rr * 0.25 },
          { x: cx + rr * 0.4, y: cy + rr * 0.4, rx: rr * 0.6, ry: rr * 0.5, c: pal[(i + 1) % 3], a: 0.55, blur: rr * 0.25 },
        ],
        hi: 0.15, rim: 1.4, edge: '#5a3a1a', rimA: 0.45, gran: 0.55, alpha: 0.86,
      }, r);
    });
    // indigo shadow glaze on lower-right of the crown
    const SP = spline(blobPts(ccx + R * 0.35, ccy + R * 0.38, R * 0.8, R * 0.55, 0.15, r, 12), true, 4);
    wash(ctx, SP, { c: '#7d86a8', hi: 0, rim: 0, gran: 0.5, feather: 2.2, alpha: 0.45, op: 'multiply', dx: 0, dy: 0 }, r);
    // loose scallops along the shadow edge + leaf-clump hints
    for (let i = 0; i < 9; i++) {
      const a = 0.0 + (i / 9) * 2.6 + (r.next() - 0.5) * 0.2;
      const rr = R * (0.88 + r.next() * 0.1);
      const x = ccx + Math.cos(a) * rr, y = ccy + Math.sin(a) * rr * 0.92;
      const tx = -Math.sin(a), ty = Math.cos(a);
      const L = 2 + r.next() * 2;
      stroke(ctx, [[x - tx * L, y - ty * L], [x + Math.cos(a) * 1.0, y + Math.sin(a) * 1.0], [x + tx * L, y + ty * L]], { w: 0.75, jit: 0.2, ta: 0.25, tb: 0.35, wv: 0.3 }, r);
    }
    for (let i = 0; i < 7; i++) {
      const x = ccx + (r.next() - 0.3) * R * 1.2, y = ccy + (r.next() - 0.35) * R * 1.1;
      stroke(ctx, [[x - 1.6, y], [x, y + 0.9], [x + 1.6, y]], { w: 0.42, jit: 0.15, ta: 0.25, tb: 0.35, wv: 0.3, alpha: 0.55 }, r);
    }
    // a few falling leaves
    for (let i = 0; i < 3; i++) {
      const x = ccx + (r.next() - 0.5) * R * 2.4, y = ccy + R * (0.8 + r.next() * 0.9);
      ctx.fillStyle = pal[i % 3];
      ctx.beginPath(); ctx.ellipse(x, y, 0.9, 0.5, r.next() * 3, 0, TAU); ctx.fill();
      ctx.lineWidth = 0.18; ctx.strokeStyle = INK; ctx.stroke();
    }
  }
  function drawFir(ctx, r, h) {
    // short trunk
    const TP = [[-1.4, 0.4], [-1.0, -6], [1.2, -6], [1.8, 0.4]];
    wash(ctx, TP, { c: '#6b4a32', hi: 0, rim: 0.5, gran: 0.5 }, r);
    stroke(ctx, [[-1.4, 0.4], [-1.0, -5]], { w: 0.6, ta: 0, tb: 0.4, wv: 0.2 }, r);
    stroke(ctx, [[1.8, 0.4], [1.3, -5]], { w: 0.9, ta: 0, tb: 0.4, wv: 0.2 }, r);
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers;
      const base = -5 - t * (h - 12), top = base - (h - 6) * 0.42;
      const hw = (1 - t * 0.78) * h * 0.2;
      const pts = [[0, top]];
      const zig = 6;
      for (let j = 0; j <= zig; j++) {
        const u = j / zig;
        const x = hw - u * hw * 2;
        const y = base + (j % 2 ? -1.6 : 0.6) + Math.abs(x) * 0.08;
        pts.push([x, y]);
      }
      const P = spline(jit(pts.slice(0, 1).concat([[hw * 0.45, (top + base) / 2]], pts.slice(1), [[-hw * 0.45, (top + base) / 2]]), 0.35, r), true, 3);
      wash(ctx, P, {
        c: '#4f6458',
        blobs: [{ x: -hw * 0.4, y: (top + base) / 2, rx: hw * 0.5, ry: (base - top) * 0.4, c: '#7a9474', a: 0.6, blur: 1.5 }, { x: hw * 0.45, y: base - 1, rx: hw * 0.55, ry: (base - top) * 0.3, c: '#2c3a50', a: 0.7, blur: 1.5 }],
        hi: 0.12, rim: 1.0, edge: '#1f2a36', rimA: 0.55, gran: 0.65,
      }, r);
      partialOutline(ctx, P, { w: 0.7, side: -0.35, wv: 0.35 }, r);
    }
  }
  function drawBush(ctx, r) {
    const cols = [['#7d8f45', '#a9b86a', '#4f6428'], ['#8a8a3a', '#c9a24a', '#5a5a24'], ['#6f8a4a', '#b5602e', '#3f5530']][r.int(0, 2)];
    const parts = [[-5, -5, 6], [4, -5.4, 6.2], [0, -9, 6.4]];
    for (const [x, y, rr] of parts) {
      const P = spline(blobPts(x, y, rr, rr * 0.8, 0.14, r, 12), true, 4);
      wash(ctx, P, { c: cols[0], blobs: [{ x: x - rr * 0.35, y: y - rr * 0.3, rx: rr * 0.5, ry: rr * 0.4, c: cols[1], a: 0.6, blur: 1.4 }, { x: x + rr * 0.4, y: y + rr * 0.35, rx: rr * 0.6, ry: rr * 0.45, c: cols[2], a: 0.6, blur: 1.4 }], hi: 0.15, rim: 1.0, edge: '#2f3a1a', gran: 0.55, alpha: 0.92 }, r);
      partialOutline(ctx, P, { w: 0.62, side: 0.0, wv: 0.4 }, r);
    }
    if (r.chance(0.6)) {
      for (let i = 0; i < 5; i++) {
        const x = -7 + r.next() * 14, y = -11 + r.next() * 8;
        ctx.fillStyle = '#b5352a'; ctx.beginPath(); ctx.arc(x, y, 0.65, 0, TAU); ctx.fill();
        ctx.lineWidth = 0.18; ctx.strokeStyle = INK; ctx.stroke();
      }
    }
  }
  function drawPumpkin(ctx, r, s, col, carved) {
    const rx = 7 * s, ry = 5.4 * s, cx = 0, cy = -ry + 0.2;
    // vine on the ground
    stroke(ctx, [[-rx * 0.6, -0.4], [-rx * 1.2, 0.6], [-rx * 1.6, -0.2], [-rx * 1.9, 0.8]], { w: 0.45, jit: 0.2, ta: 0.05, tb: 0.5, color: '#3c4a1c' }, r);
    const LF = ribbon(jit([[-rx * 1.1, 0.3], [-rx * 1.5, -1.6], [-rx * 1.8, -1.4]], 0.15, r), leafW(3.2 * s));
    wash(ctx, LF, { c: '#6c8a38', blobs: [{ x: -rx * 1.4, y: -1, rx: 1.5, ry: 1, c: '#a3b86a', a: 0.6, blur: 0.6 }], hi: 0, rim: 0.6, edge: '#3a4e1c', gran: 0.4 }, r);
    outline(ctx, LF, { w: 0.42, pieces: 1 }, r);
    const hp = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU - Math.PI / 2;
      let x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      y += Math.exp(-Math.pow((a + Math.PI / 2) / 0.32, 2)) * 0.9 * s;
      const lobe = 1 + 0.04 * Math.cos(a * 5);
      hp.push([cx + x * lobe, cy + y * lobe]);
    }
    const HP = spline(jit(hp, 0.2, r), true, 6);
    wash(ctx, HP, { c: col[0], blobs: [{ x: cx - rx * 0.35, y: cy - ry * 0.4, rx: rx * 0.5, ry: ry * 0.45, c: col[1], a: 0.85, blur: 1.6 }, { x: cx + rx * 0.45, y: cy + ry * 0.5, rx: rx * 0.7, ry: ry * 0.5, c: col[2], a: 0.75, blur: 1.8 }], hi: 0.3, rim: 1.2, edge: col[3], rimA: 0.6, gran: 0.5 }, r);
    for (const dx of [-0.62, -0.25, 0.3, 0.68]) {
      stroke(ctx, [[cx + dx * rx * 0.55, cy - ry * 0.8], [cx + dx * rx, cy], [cx + dx * rx * 0.6, cy + ry * 0.85]], { w: 0.42, jit: 0.15, ta: 0.25, tb: 0.35, color: col[3], alpha: 0.7 }, r);
    }
    outline(ctx, HP, { w: 0.85, light: 0.55, cx, cy, pieces: 3 }, r);
    const STp = ribbon(jit([[cx + 0.2, cy - ry + 0.6], [cx - 0.3, cy - ry - 1.4], [cx + 0.8, cy - ry - 2.8]], 0.1, r), taperW(1.9 * s, 1.2 * s));
    part(ctx, STp, { c: '#7a6a30', hi: 0, rim: 0.4, gran: 0.4 }, r, { w: 0.45 });
    if (carved) {
      glowShape(ctx, jit([[-3.2, cy - 0.4], [-0.9, cy - 0.6], [-2.0, cy - 2.8]], 0.08, r), r, { w: 0.36 });
      glowShape(ctx, jit([[0.9, cy - 0.6], [3.2, cy - 0.4], [2.2, cy - 2.7]], 0.08, r), r, { w: 0.36 });
      glowShape(ctx, jit([[-4, cy + 1.6], [-2.4, cy + 2.3], [-1.2, cy + 1.8], [0, cy + 2.4], [1.2, cy + 1.8], [2.4, cy + 2.3], [4, cy + 1.6], [2.8, cy + 3.6], [0, cy + 4.2], [-2.8, cy + 3.6]], 0.08, r), r, { w: 0.38 });
    }
  }
  function drawHaystack(ctx, r, tall) {
    const hw = tall ? 10 : 13, hh = tall ? 24 : 18;
    const pts = [[-hw, 0.2], [-hw * 0.95, -hh * 0.42], [-hw * 0.62, -hh * 0.82], [0, -hh], [hw * 0.62, -hh * 0.82], [hw * 0.95, -hh * 0.42], [hw, 0.2], [0, 1.2]];
    const P = spline(jit(pts, 0.4, r), true, 6);
    wash(ctx, P, { c: '#d9b05a', blobs: [{ x: -hw * 0.35, y: -hh * 0.6, rx: hw * 0.5, ry: hh * 0.3, c: '#f0d792', a: 0.7, blur: 2 }, { x: hw * 0.5, y: -hh * 0.25, rx: hw * 0.55, ry: hh * 0.35, c: '#a7782f', a: 0.7, blur: 2 }, { x: 0, y: -1, rx: hw, ry: 2, c: '#8a6228', a: 0.5, blur: 1 }], hi: 0.3, rim: 1.4, edge: '#6a4a1a', rimA: 0.5, gran: 0.6 }, r);
    // straw strokes following the dome
    for (let i = 0; i < 26; i++) {
      const u = r.next() * 2 - 1;
      const x = u * hw * 0.9, yTop = -hh * Math.sqrt(Math.max(0, 1 - u * u)) * 0.92 + 1;
      const y0 = yTop + r.next() * hh * 0.5, L = 2.5 + r.next() * 5;
      const lit = u < -0.2;
      stroke(ctx, [[x, y0], [x + u * 1.2, y0 + L * 0.5], [x + u * 1.8, y0 + L]], { w: 0.32, jit: 0.15, ta: 0.15, tb: 0.5, wv: 0.2, color: '#6a4a1a', alpha: lit ? 0.35 : 0.6 }, r);
    }
    outline(ctx, P, { w: 0.85, light: 0.55, pieces: 3 }, r);
    // pole + straws at the top
    stroke(ctx, [[0.3, -hh + 1], [0.1, -hh - 4.5]], { w: 0.8, ta: 0, tb: 0.2, wv: 0.1, color: '#5a3a24' }, r);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (r.next() - 0.5) * 1.8;
      stroke(ctx, [[0, -hh + 0.5], [Math.cos(a) * 3.4, -hh + 0.5 + Math.sin(a) * 2.6]], { w: 0.3, ta: 0, tb: 0.6, wv: 0, color: '#8a6228' }, r);
    }
  }
  function drawFence(ctx, r, broken) {
    const posts = [-15, 0, 15];
    const rail = (y0, y1, x0, x1, br) => {
      const pts = br ? [[x0, y0], [x0 + (x1 - x0) * 0.45, y0 + (y1 - y0) * 0.45 + 1.4]] : [[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 0.5], [x1, y1]];
      const P = ribbon(jit(pts, 0.2, r), () => 1.7);
      wash(ctx, P, { c: '#9a7550', blobs: [{ x: (x0 + x1) / 2, y: y0, rx: 6, ry: 0.5, c: '#c4a27a', a: 0.6, blur: 0.6 }], hi: 0, rim: 0.6, edge: '#4a3020', gran: 0.6 }, r);
      outline(ctx, P, { w: 0.5, pieces: 2, light: 0.3 }, r);
    };
    rail(-10.5, -10, -16, 16, false);
    rail(-5.5, -5.8, -16, 16, broken);
    posts.forEach((x, i) => {
      const lean = (r.next() - 0.5) * 0.12;
      const h = 13 + r.next() * 3;
      const pts = [[x - 1.2, 0.4], [x - 1.1 + lean * h, -h], [x + 0.2 + lean * h, -h - 0.9], [x + 1.3 + lean * h, -h + 0.1], [x + 1.3, 0.4]];
      const P = spline(jit(pts, 0.12, r), true, 3);
      wash(ctx, P, { c: '#8a6646', blobs: [{ x: x - 0.5, y: -h / 2, rx: 0.6, ry: h * 0.4, c: '#b89470', a: 0.6, blur: 0.5 }, { x: x + 0.8, y: -h / 2, rx: 0.6, ry: h * 0.4, c: '#5a3e2a', a: 0.6, blur: 0.5 }], hi: 0, rim: 0.5, gran: 0.6 }, r);
      outline(ctx, P, { w: 0.55, pieces: 2, light: 0.4 }, r);
      stroke(ctx, [[x + 0.2, -h * 0.7], [x + 0.4, -h * 0.5]], { w: 0.22, ta: 0, tb: 0.5, wv: 0, alpha: 0.6 }, r);
    });
    // grass at the posts
    for (const x of posts) grassTuft(ctx, x + 0.5, 0.5, r, INK, 0.6, 0.8);
  }
  function drawWall(ctx, r) {
    const stones = [];
    let x = -16;
    while (x < 16) { const w = 3.6 + r.next() * 2.4; stones.push([x + w / 2, -2.2, w / 2, 2.2]); x += w + 0.2; }
    x = -14.5;
    while (x < 14.5) { const w = 3.2 + r.next() * 2.6; stones.push([x + w / 2, -6.3, w / 2, 2.0]); x += w + 0.2; }
    x = -11;
    while (x < 10) { const w = 3 + r.next() * 2.4; if (r.chance(0.8)) stones.push([x + w / 2, -9.8, w / 2, 1.7]); x += w + 0.3; }
    for (const [sx, sy, rx, ry] of stones) {
      const P = spline(blobPts(sx, sy, rx, ry, 0.12, r, 8), true, 4);
      const c = ['#a7a9a3', '#b8ae94', '#959ca8', '#aaa28c'][r.int(0, 3)];
      wash(ctx, P, { c, blobs: [{ x: sx - rx * 0.3, y: sy - ry * 0.4, rx: rx * 0.6, ry: ry * 0.5, c: '#d8d6cc', a: 0.6, blur: 0.8 }, { x: sx + rx * 0.4, y: sy + ry * 0.4, rx: rx * 0.6, ry: ry * 0.5, c: '#6c7280', a: 0.5, blur: 0.8 }], hi: 0.1, rim: 0.6, edge: '#4a4e58', gran: 0.7 }, r);
      partialOutline(ctx, P, { w: 0.55, side: -0.45, wv: 0.3 }, r);
    }
    // moss
    for (let i = 0; i < 3; i++) {
      const mx = -12 + r.next() * 24;
      wash(ctx, spline(blobPts(mx, -11 + r.next() * 3, 2.2, 0.9, 0.3, r, 7), true, 3), { c: '#7d8f45', hi: 0, rim: 0.4, gran: 0.5, alpha: 0.8 }, r);
    }
    grassTuft(ctx, -15, 0.6, r, INK, 0.55, 0.8);
    grassTuft(ctx, 13, 0.6, r, INK, 0.55, 0.8);
  }
  function drawSign(ctx, r) {
    const lean = 0.06;
    const pts = [[-1.2, 0.4], [-1.0 + lean * 30, -30], [0.9 + lean * 30, -30.6], [1.3, 0.4]];
    const P = spline(jit(pts, 0.15, r), true, 3);
    wash(ctx, P, { c: '#7d5a3e', blobs: [{ x: 0.8, y: -15, rx: 0.6, ry: 12, c: '#4e3628', a: 0.6, blur: 0.6 }], hi: 0.1, rim: 0.5, gran: 0.6 }, r);
    outline(ctx, P, { w: 0.6, pieces: 2, light: 0.4 }, r);
    const board = (y, dir, len, tilt) => {
      const x0 = 1 + lean * -y, s = dir;
      const bp = [[x0 - s * 1.5, y - 1.9 + tilt], [x0 + s * len, y - 1.9 - tilt], [x0 + s * (len + 2.4), y - tilt * 0.5], [x0 + s * len, y + 1.9 - tilt], [x0 - s * 1.5, y + 1.9 + tilt]];
      const B = jit(bp, 0.12, r);
      wash(ctx, B, { c: '#b48a5a', blobs: [{ x: x0 + s * len * 0.4, y: y - 1, rx: len * 0.4, ry: 0.8, c: '#d8b88a', a: 0.6, blur: 0.6 }], hi: 0.15, rim: 0.6, edge: '#5a3e24', gran: 0.6 }, r);
      outline(ctx, B, { w: 0.5, pieces: 2, over: 2 }, r);
      // scribbled lettering
      let xx = x0 + s * 0.6;
      for (let i = 0; i < 4; i++) {
        const wl = 1.2 + r.next() * 1.6;
        const q = [];
        for (let j = 0; j <= 4; j++) q.push([xx + s * (wl * j / 4), y + (j % 2 ? -0.5 : 0.4) + (r.next() - 0.5) * 0.3]);
        inkLine(ctx, spline(q, false, 3), { w: 0.26, ta: 0.1, tb: 0.2, wv: 0.2, alpha: 0.7 });
        xx += s * (wl + 0.7);
        if (Math.abs(xx - x0) > len) break;
      }
    };
    board(-25.5, 1, 9, 0.3);
    board(-19.5, -1, 8, -0.4);
    // a crow on top
    const cx = 0.2 + lean * 31, cy = -31;
    const CP = spline([[cx - 2.4, cy - 1.0], [cx - 0.4, cy - 2.6], [cx + 1.6, cy - 2.4], [cx + 2.4, cy - 3.4], [cx + 3.4, cy - 3.0], [cx + 2.6, cy - 1.6], [cx + 1.0, cy - 0.2], [cx - 1.6, cy - 0.2], [cx - 4.2, cy - 0.6]], true, 3);
    trace(ctx, CP); ctx.fillStyle = '#2a2430'; ctx.fill();
    inkLine(ctx, [[cx + 3.3, cy - 3.0], [cx + 4.4, cy - 2.7]], { w: 0.4, ta: 0, tb: 0.8, wv: 0, color: '#c49a3e' });
    inkLine(ctx, [[cx, cy - 0.2], [cx - 0.2, cy + 0.6]], { w: 0.2, ta: 0, tb: 0, wv: 0 });
    inkLine(ctx, [[cx + 0.8, cy - 0.2], [cx + 0.8, cy + 0.6]], { w: 0.2, ta: 0, tb: 0, wv: 0 });
    ctx.fillStyle = '#f4e8c0'; ctx.beginPath(); ctx.arc(cx + 2.6, cy - 2.8, 0.25, 0, TAU); ctx.fill();
    grassTuft(ctx, -1, 0.6, r, INK, 0.6, 0.9);
  }
  function drawScarecrow(ctx, r) {
    // pole + cross bar
    stroke(ctx, [[0, 0.5], [0.2, -18], [0.1, -34]], { w: 1.3, jit: 0.15, ta: 0, tb: 0.05, wv: 0.2, color: '#4a3020' }, r);
    // coat
    const coat = [[-3.2, -27.4], [3.4, -27.4], [5.4, -18.6], [3.6, -16.4], [2.2, -18.0], [0.6, -15.8], [-1.2, -17.8], [-3.0, -16.0], [-5.0, -18.6]];
    const CP = spline(jit(coat, 0.25, r), true, 4);
    part(ctx, CP, { c: '#4a5a86', blobs: [{ x: -1, y: -24, rx: 2.4, ry: 3, c: '#6f7fae', a: 0.6, blur: 1 }, { x: 3, y: -19, rx: 2, ry: 2.4, c: '#2b3558', a: 0.6, blur: 1 }], hi: 0.2, rim: 0.8, gran: 0.6 }, r, { w: 0.7 });
    // patches
    wash(ctx, jit([[-2.6, -22], [-0.8, -22.2], [-0.8, -20.4], [-2.6, -20.2]], 0.1, r), { c: '#b5602e', hi: 0, rim: 0.4, gran: 0.4 }, r);
    stroke(ctx, [[-2.8, -22.3], [-0.6, -20.0]], { w: 0.2, ta: 0, tb: 0, wv: 0, alpha: 0.6 }, r);
    // arms (sleeves on the cross bar) + straw tufts
    for (const s of [-1, 1]) {
      const SP = ribbon(jit([[s * 2.6, -26.2], [s * 6.4, -26.0], [s * 10.6, -25.4]], 0.2, r), taperW(2.8, 2.2));
      part(ctx, SP, { c: '#4a5a86', blobs: [{ x: s * 7, y: -26.6, rx: 2, ry: 0.6, c: '#6f7fae', a: 0.6, blur: 0.6 }], hi: 0.1, rim: 0.6, gran: 0.6 }, r, { w: 0.6 });
      for (let i = 0; i < 4; i++) stroke(ctx, [[s * 10.8, -25.4], [s * (12.6 + r.next() * 1.2), -25.4 + (i - 1.5) * 0.9]], { w: 0.32, ta: 0, tb: 0.6, wv: 0, color: '#b8902e' }, r);
    }
    // sack head
    const HP = spline(jit(blobPts(0.2, -30.6, 3.4, 3.0, 0.08, r, 10), 0.1, r), true, 4);
    part(ctx, HP, { c: '#e2d3a8', blobs: [{ x: 1.4, y: -29.4, rx: 2, ry: 1.6, c: '#b8a478', a: 0.6, blur: 0.9 }], hi: 0.3, rim: 0.7, gran: 0.6 }, r, { w: 0.65 });
    for (const [ex, ey] of [[-0.9, -31.0], [1.7, -31.0]]) {
      stroke(ctx, [[ex - 0.6, ey - 0.6], [ex + 0.6, ey + 0.6]], { w: 0.34, ta: 0, tb: 0, wv: 0 }, r);
      stroke(ctx, [[ex - 0.6, ey + 0.6], [ex + 0.6, ey - 0.6]], { w: 0.34, ta: 0, tb: 0, wv: 0 }, r);
    }
    stroke(ctx, [[-1.2, -29.0], [0.4, -28.5], [2.0, -29.0]], { w: 0.3, ta: 0.1, tb: 0.1, wv: 0.2 }, r);
    // hat
    const hat = [[-5.2, -32.6], [-2.4, -33.4], [-2.0, -36.6], [0.4, -37.6], [2.6, -36.6], [2.8, -33.4], [5.4, -32.8], [3.0, -32.0], [-3.0, -32.0]];
    part(ctx, spline(jit(hat, 0.2, r), true, 3), { c: '#6b4a2e', blobs: [{ x: -0.5, y: -35, rx: 1.6, ry: 1.4, c: '#94704a', a: 0.6, blur: 0.8 }], hi: 0.1, rim: 0.6, gran: 0.6 }, r, { w: 0.65 });
    grassTuft(ctx, 0, 0.6, r, INK, 0.6, 0.9);
  }
  function drawBoulder(ctx, r, s) {
    const P = spline(blobPts(0, -5.2 * s, 9 * s, 5.8 * s, 0.1, r, 11), true, 5);
    wash(ctx, P, { c: '#a3a7a6', blobs: [{ x: -3 * s, y: -8 * s, rx: 4 * s, ry: 2.5 * s, c: '#d6d4ca', a: 0.7, blur: 1.6 }, { x: 4 * s, y: -3 * s, rx: 5 * s, ry: 3 * s, c: '#646c7c', a: 0.6, blur: 1.8 }, { x: -5 * s, y: -3 * s, rx: 2.5 * s, ry: 2 * s, c: '#b8ac8c', a: 0.5, blur: 1.4 }], hi: 0.2, rim: 1.2, edge: '#3e4450', gran: 0.75 }, r);
    hatch(ctx, P, { ang: -0.9, sp: 1.1, w: 0.34, alpha: 0.55, region: (x, y) => (x * 0.6 + (y + 5.2 * s) * 0.8) - 2.5 * s }, r);
    outline(ctx, P, { w: 0.85, light: 0.55, pieces: 2 }, r);
    stroke(ctx, [[-2 * s, -9 * s], [0, -7 * s], [1.4 * s, -7.6 * s]], { w: 0.35, jit: 0.1, alpha: 0.6 }, r);
    wash(ctx, spline(blobPts(-2 * s, -10.2 * s, 3.4 * s, 1.0, 0.3, r, 8), true, 3), { c: '#7d8f45', blobs: [{ x: -2.5 * s, y: -10.5 * s, rx: 1.4, ry: 0.5, c: '#a9b86a', a: 0.6, blur: 0.4 }], hi: 0, rim: 0.4, gran: 0.5, alpha: 0.85 }, r);
    grassTuft(ctx, -8 * s, 0.5, r, INK, 0.6, 0.9);
    grassTuft(ctx, 7.5 * s, 0.5, r, INK, 0.6, 0.8);
  }
  function buildProps() {
    const mk = (wu, hu, ax, ay, fn, seed) => {
      const s = mkSprite(wu, hu, ax, ay);
      fn(s.ctx, U.rng(seed));
      s.f = U.flipX(s.c);
      return s;
    };
    PROPS.tree = TREE_PALS.map((pal, i) => mk(64, 98, 32, 94, (c, r) => drawTree(c, r, pal, 80 + i * 3), 1100 + i));
    PROPS.fir = [0, 1].map((i) => mk(40, 92, 20, 89, (c, r) => drawFir(c, r, 80 + i * 6), 1200 + i));
    PROPS.bush = [0, 1, 2].map((i) => mk(30, 22, 15, 19, (c, r) => drawBush(c, r), 1300 + i));
    const PCOL = [['#e8832f', '#f6b45e', '#bf531b', '#7e2f0e'], ['#e6a33a', '#f6cd7a', '#b8701c', '#7e4a0e'], ['#e9dcc0', '#fbf5e6', '#b8a688', '#6a5a40']];
    PROPS.pumpkin = [
      mk(34, 22, 22, 19, (c, r) => drawPumpkin(c, r, 1.15, PCOL[0], false), 1400),
      mk(30, 18, 19, 15, (c, r) => drawPumpkin(c, r, 0.85, PCOL[1], false), 1401),
      mk(30, 18, 19, 15, (c, r) => drawPumpkin(c, r, 0.9, PCOL[2], false), 1402),
      mk(34, 22, 22, 19, (c, r) => drawPumpkin(c, r, 1.15, PCOL[0], true), 1403),
    ];
    PROPS.hay = [mk(34, 34, 17, 31, (c, r) => drawHaystack(c, r, false), 1500), mk(28, 38, 14, 35, (c, r) => drawHaystack(c, r, true), 1501)];
    PROPS.fence = [mk(40, 22, 20, 19, (c, r) => drawFence(c, r, false), 1600), mk(40, 22, 20, 19, (c, r) => drawFence(c, r, true), 1601)];
    PROPS.wall = [mk(40, 18, 20, 15, (c, r) => drawWall(c, r), 1700), mk(40, 18, 20, 15, (c, r) => drawWall(c, r), 1701)];
    PROPS.sign = [mk(30, 40, 12, 37, (c, r) => drawSign(c, r), 1800)];
    PROPS.scare = [mk(32, 44, 16, 41, (c, r) => drawScarecrow(c, r), 1900)];
    PROPS.boulder = [mk(28, 18, 14, 15, (c, r) => drawBoulder(c, r, 1.15), 2000), mk(22, 14, 11, 11.5, (c, r) => drawBoulder(c, r, 0.8), 2001)];
  }

  /* ======================================================================
     7. Build all sprites
     ====================================================================== */
  function frames(wu, hu, ax, ay, poses, fn, seedBase) {
    return poses.map((pose, i) => {
      const s = mkSprite(wu, hu, ax, ay);
      fn(s.ctx, pose, U.rng(seedBase + i * 7919));
      return finish(s);
    });
  }
  function buildCharacters() {
    // Jack: idle (3 boils) + walk 4 poses x 3 boils
    const jp = [];
    for (let b = 0; b < 3; b++) jp.push({ ph: null, wave: Math.sin(b * 2.1) });
    for (let p = 0; p < 4; p++) for (let b = 0; b < 3; b++) jp.push({ ph: (p / 4) * TAU, wave: Math.sin(p * 1.6 + b * 2.1) });
    const jf = frames(30, 35, 15.5, 32.5, jp, drawJack, 5000);
    SPR.jack = { idle: jf.slice(0, 3), walk: [0, 1, 2, 3].map((p) => jf.slice(3 + p * 3, 6 + p * 3)) };
    // creepers: 2 palettes x (4 poses x 2 boils)
    SPR.creeper = CREEP_PAL.map((pal, vi) => {
      const poses = [];
      for (let p = 0; p < 4; p++) for (let b = 0; b < 2; b++) poses.push({ ph: (p / 4) * TAU, sway: Math.sin(p * 1.7 + b * 2.4) });
      return frames(26, 37, 13, 34, poses, (c, pose, r) => drawCreeper(c, pose, r, pal), 6000 + vi * 100);
    });
    const ghostPoses = [];
    for (let p = 0; p < 4; p++) for (let b = 0; b < 2; b++) ghostPoses.push({ ph: (p / 4) * TAU + b * 0.4 });
    SPR.ghost = [frames(26, 28, 11.5, 26, ghostPoses, drawGhost, 7000)];
    const colPoses = [];
    for (let p = 0; p < 4; p++) for (let b = 0; b < 2; b++) colPoses.push({ ph: (p / 4) * TAU });
    SPR.colossus = [frames(50, 58, 24, 55, colPoses, drawColossus, 8000)];
    // spawn (soft) + death (dissolve) versions
    SPR.soft = {}; SPR.death = {};
    for (const type of ['creeper', 'ghost', 'colossus']) {
      SPR.soft[type] = SPR[type].map((set) => softOf(set[0], 4));
      SPR.death[type] = SPR[type].map((set, i) => dissolveFrames(set[1], 4, 300 + i + type.length));
    }
    // small sprites
    SPR.gem = [0, 1, 2].map((i) => { const s = mkSprite(8, 11, 4, 9.6, 4); MIS = [0, 0]; drawGemDrop(s.ctx, U.rng(9100 + i)); return s; });
    SPR.gemBig = [0, 1, 2].map((i) => { const s = mkSprite(18, 16, 9, 13, 4); drawGemStar(s.ctx, U.rng(9200 + i)); return s; });
    MIS = [0.45, 0.35];
    SPR.lantern = [0, 1, 2].map((i) => { const s = mkSprite(14, 18, 7, 16, 4); drawLantern(s.ctx, U.rng(9300 + i)); s.f = U.flipX(s.c); return s; });
    SPR.seed = [0, 1].map((i) => { const s = mkSprite(9, 6, 4.5, 3, 5); drawSeed(s.ctx, U.rng(9400 + i)); return s; });
    { const s = mkSprite(22, 6, 20, 3, 4); drawTrail(s.ctx, U.rng(9500)); SPR.trail = s; }
    // gem shadow
    SPR.gemShadow = radialSprite(32, [[0, 'rgba(52,56,92,0.35)'], [0.7, 'rgba(52,56,92,0.18)'], [1, 'rgba(52,56,92,0)']]);
  }

  /* ======================================================================
     8. Screen overlay (book page margins) – rebuilt on resize
     ====================================================================== */
  let OVL = null;
  function buildOverlay(W, H) {
    const band = Math.ceil(H * 0.11);
    const page = U.canvas(W, H), hurt = U.canvas(W, H);
    const pi = page.ctx.createImageData(W, H), hi = hurt.ctx.createImageData(W, H);
    const pd = pi.data, hd = hi.data;
    const m = H * 0.024, rad = H * 0.07, hw = W / 2 - m, hh = H / 2 - m;
    const fade = H * 0.09;
    for (let y = 0; y < H; y++) {
      const inBandY = y < band || y >= H - band;
      for (let x = 0; x < W; x++) {
        if (!inBandY && x >= band && x < W - band) continue;
        const qx = Math.abs(x - W / 2) - (hw - rad), qy = Math.abs(y - H / 2) - (hh - rad);
        const sd = hyp(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
        const nz = (WA[((y & 1023) << 10) | (x & 1023)] - 0.5) * 22 + (PAP[((y & 255) << 8) | (x & 255)] - 0.5) * 3;
        const e = sd + nz;
        // layer 1: broad paper fade, layer 2: pigment rim line, layer 3: bare paper margin
        const f = U.smoothstep(-fade, 0, e) * 0.32;
        const rb = Math.exp(-Math.pow((e + 3.5) / 2.6, 2)) * 0.22;
        const ap = U.smoothstep(-1.2, 1.4, e) * 0.97;
        let A = f, R = PAPER[0] * f, Gc = PAPER[1] * f, B = PAPER[2] * f;
        R = 120 * rb + R * (1 - rb); Gc = 82 * rb + Gc * (1 - rb); B = 58 * rb + B * (1 - rb); A = rb + A * (1 - rb);
        const pp = 0.97 + (PAP[((y & 255) << 8) | (x & 255)] - 0.5) * 0.08;
        R = PAPER[0] * pp * ap + R * (1 - ap); Gc = PAPER[1] * pp * ap + Gc * (1 - ap); B = PAPER[2] * pp * ap + B * (1 - ap); A = ap + A * (1 - ap);
        const o = (y * W + x) * 4;
        if (A > 0.003) { pd[o] = R / A; pd[o + 1] = Gc / A; pd[o + 2] = B / A; pd[o + 3] = A * 255; }
        // hurt: alizarin wash creeping in from the margins
        const hf = U.smoothstep(-fade * 1.1, -2, e);
        const hrim = Math.exp(-Math.pow((e + fade * 0.75) / 5, 2)) * 0.3;
        const ha = Math.min(1, hf * 0.42 + hrim);
        if (ha > 0.003) { hd[o] = 178 - hrim * 120; hd[o + 1] = 44 - hrim * 20; hd[o + 2] = 34 - hrim * 10; hd[o + 3] = ha * 255; }
      }
    }
    page.ctx.putImageData(pi, 0, 0);
    hurt.ctx.putImageData(hi, 0, 0);
    OVL = { W, H, band, page: page.c, hurt: hurt.c };
  }
  function drawStrips(ctx, img, W, H, b) {
    ctx.drawImage(img, 0, 0, W, b, 0, 0, W, b);
    ctx.drawImage(img, 0, H - b, W, b, 0, H - b, W, b);
    ctx.drawImage(img, 0, b, b, H - 2 * b, 0, b, b, H - 2 * b);
    ctx.drawImage(img, W - b, b, b, H - 2 * b, W - b, b, b, H - 2 * b);
  }

  /* ======================================================================
     9. Icons (HUD + level-up cards), painted in a 100x100 space
     ====================================================================== */
  function turnipIcon(ctx, r, cx, cy, s, dead) {
    for (const L of [[[cx - 2 * s, cy - 22 * s], [cx - 12 * s, cy - 36 * s], [cx - 20 * s, cy - 42 * s]], [[cx, cy - 23 * s], [cx + 1 * s, cy - 38 * s], [cx + 6 * s, cy - 46 * s]], [[cx + 3 * s, cy - 22 * s], [cx + 13 * s, cy - 32 * s], [cx + 21 * s, cy - 36 * s]]]) {
      const LP = ribbon(jit(L, 1 * s, r), leafW(9 * s));
      wash(ctx, LP, { c: '#6c8a38', blobs: [{ x: L[1][0], y: L[1][1], rx: 4 * s, ry: 4 * s, c: '#a7bd68', a: 0.6, blur: 2 * s }], hi: 0, rim: 2 * s, edge: '#3a4e1c', gran: 0.4 }, r);
      outline(ctx, LP, { w: 2 * s, pieces: 2 }, r);
    }
    const body = [[0, -24], [16, -20], [24, -4], [20, 12], [8, 22], [1, 30], [-7, 22], [-20, 12], [-24, -4], [-16, -20]].map((p) => [cx + p[0] * s, cy + p[1] * s]);
    const P = spline(jit(body, 0.8 * s, r), true, 6);
    wash(ctx, P, { c: '#eee0ba', blobs: [{ x: cx, y: cy - 16 * s, rx: 30 * s, ry: 16 * s, c: '#7a4a8c', a: 0.95, blur: 5 * s }, { x: cx - 9 * s, y: cy - 13 * s, rx: 9 * s, ry: 6 * s, c: '#a77ab5', a: 0.55, blur: 3 * s }, { x: cx + 6 * s, y: cy + 14 * s, rx: 14 * s, ry: 7 * s, c: '#e3c886', a: 0.6, blur: 4 * s }], hi: 0.3, rim: 3.2 * s, edge: '#5a3a52', rimA: 0.5, gran: 0.5 }, r);
    outline(ctx, P, { w: 3 * s, light: 0.5, cx, cy, pieces: 3 }, r);
    if (dead) {
      for (const ex of [-8, 8]) {
        stroke(ctx, [[cx + (ex - 4) * s, cy - 6 * s], [cx + (ex + 4) * s, cy + 2 * s]], { w: 2.6 * s, ta: 0.1, tb: 0.2, wv: 0 }, r);
        stroke(ctx, [[cx + (ex + 4) * s, cy - 6 * s], [cx + (ex - 4) * s, cy + 2 * s]], { w: 2.6 * s, ta: 0.1, tb: 0.2, wv: 0 }, r);
      }
      stroke(ctx, [[cx - 6 * s, cy + 11 * s], [cx, cy + 9 * s], [cx + 6 * s, cy + 11 * s]], { w: 2 * s, ta: 0.2, tb: 0.2, wv: 0.2 }, r);
    }
  }
  function seedIcon(ctx, r, cx, cy, s, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s);
    const pts = [[30, 0], [18, -14], [-6, -17], [-24, -9], [-30, 0], [-24, 9], [-6, 17], [18, 14]];
    const P = spline(jit(pts, 0.6, r), true, 5);
    wash(ctx, P, { c: '#f1e4bf', blobs: [{ x: -4, y: -3, rx: 14, ry: 8, c: '#fffaf0', a: 0.9, blur: 4 }, { x: 16, y: 8, rx: 14, ry: 9, c: '#c9a050', a: 0.55, blur: 5 }], hi: 0, rim: 5, edge: '#b48a3c', rimA: 0.8, gran: 0.3 }, r);
    outline(ctx, P, { w: 3.4, pieces: 2, over: 2 }, r);
    stroke(ctx, [[-20, 1], [0, -1], [20, 0.5]], { w: 1.6, ta: 0.3, tb: 0.4, wv: 0, color: '#9a7a3a', alpha: 0.6 }, r);
    ctx.restore();
  }
  function drawIconImpl(ctx, id, size) {
    const k = size / 100;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const small = size <= 48;
    const r = U.rng(hsh(id.charCodeAt(0) * 31 + id.length, size, 77));
    const oldMis = MIS;
    MIS = [1.6, 1.3];
    const lw = small ? 1.35 : 1;
    switch (id) {
      case 'hp-heart': {
        const pts = [];
        for (let i = 0; i < 24; i++) {
          const t = (i / 24) * TAU;
          pts.push([50 + 2.35 * 16 * Math.pow(Math.sin(t), 3), 50 - 2.35 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) + 4]);
        }
        const P = spline(jit(pts, 0.8, r), true, 4);
        wash(ctx, P, { c: '#c23b2b', blobs: [{ x: 36, y: 34, rx: 13, ry: 10, c: '#e8826a', a: 0.85, blur: 5 }, { x: 62, y: 66, rx: 20, ry: 14, c: '#8c1f17', a: 0.7, blur: 6 }], hi: 0.35, rim: 4, edge: '#7a1a12', rimA: 0.7, rimBlur: 1.5, gran: 0.5 }, r);
        outline(ctx, P, { w: 4.4 * lw, light: 0.5, cx: 50, cy: 52, pieces: 2 }, r);
        stroke(ctx, [[28, 36], [32, 28], [40, 25]], { w: 3.4, ta: 0.2, tb: 0.5, wv: 0, color: '#fff6ea', alpha: 0.85 }, r);
        break;
      }
      case 'kills':
        turnipIcon(ctx, r, 50, 58, 1.05, true);
        break;
      case 'dmg': {
        const P = spline(jit(blobPts(46, 54, 30, 26, 0.25, r, 12), 1, r), true, 4);
        wash(ctx, P, { c: '#e9b06a', blobs: [{ x: 40, y: 50, rx: 18, ry: 14, c: '#f6d9a0', a: 0.7, blur: 6 }], hi: 0, rim: 5, edge: '#c2541c', rimA: 0.6, gran: 0.4, feather: 3, alpha: 0.55 }, r);
        seedIcon(ctx, r, 48, 54, 1.25, -0.75);
        for (let i = 0; i < 3; i++) {
          const a = -1.25 + i * 0.42;
          stroke(ctx, [[72 + Math.cos(a) * 8, 26 + Math.sin(a) * 8 + 4], [72 + Math.cos(a) * 22, 26 + Math.sin(a) * 22 + 4]], { w: 3.4 * lw, ta: 0.05, tb: 0.6, wv: 0 }, r);
        }
        break;
      }
      case 'rate': {
        for (let i = 0; i < 3; i++) {
          const x = 30 + i * 22, y = 72 - i * 22;
          const BP = ribbon(jit([[x - 30, y + 14], [x - 16, y + 7], [x - 4, y + 2]], 0.6, r), (u) => 2 + u * 10);
          wash(ctx, BP, { c: '#d98a34', hi: 0, rim: 2, edge: '#a34f1a', gran: 0.5, alpha: 0.6, feather: 1.5 }, r);
          seedIcon(ctx, r, x + 4, y - 2, 0.62, -0.45);
        }
        break;
      }
      case 'multi': {
        // satchel
        const bag = [[18, 42], [82, 40], [86, 70], [78, 88], [22, 88], [14, 70]];
        const P = spline(jit(bag, 1, r), true, 5);
        wash(ctx, P, { c: '#a3532c', blobs: [{ x: 34, y: 54, rx: 16, ry: 12, c: '#cf8a58', a: 0.7, blur: 5 }, { x: 70, y: 80, rx: 18, ry: 10, c: '#6e2f16', a: 0.7, blur: 5 }], hi: 0.25, rim: 4, edge: '#5a2410', rimA: 0.6, gran: 0.6 }, r);
        seedIcon(ctx, r, 36, 32, 0.55, -1.2);
        seedIcon(ctx, r, 52, 28, 0.6, -1.6);
        seedIcon(ctx, r, 66, 33, 0.55, -1.95);
        outline(ctx, P, { w: 3.6 * lw, light: 0.5, pieces: 3 }, r);
        const flap = spline(jit([[16, 42], [84, 40], [80, 60], [50, 66], [20, 60]], 0.8, r), true, 4);
        wash(ctx, flap, { c: '#8a4424', blobs: [{ x: 36, y: 46, rx: 14, ry: 6, c: '#b8704a', a: 0.6, blur: 4 }], hi: 0.15, rim: 3, edge: '#4a1c0c', gran: 0.6 }, r);
        outline(ctx, flap, { w: 3 * lw, pieces: 2 }, r);
        ctx.beginPath(); ctx.arc(50, 62, 4.5, 0, TAU); ctx.fillStyle = '#e6a92f'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
        stroke(ctx, [[20, 44], [8, 20], [50, 8], [92, 20], [80, 42]], { w: 2.4 * lw, jit: 1, ta: 0.05, tb: 0.05, wv: 0.3, color: '#4a2410' }, r);
        break;
      }
      case 'bounce': {
        stroke(ctx, [[8, 84], [50, 82], [92, 85]], { w: 3.4 * lw, ta: 0.1, tb: 0.1, wv: 0.3 }, r);
        for (let i = 0; i < 4; i++) stroke(ctx, [[30 + i * 14, 88], [26 + i * 14, 94]], { w: 1.6, ta: 0, tb: 0.5, wv: 0, alpha: 0.6 }, r);
        // dotted trajectory
        const traj = [];
        for (let t = 0; t <= 1.001; t += 0.07) traj.push([10 + t * 38, 22 + 60 * t * t]);
        for (let t = 0.07; t <= 1.001; t += 0.07) traj.push([48 + t * 30, 82 - 70 * (t * (2 - t)) * 0.85]);
        ctx.fillStyle = '#a3532c';
        for (const p of traj) { ctx.beginPath(); ctx.arc(p[0], p[1], small ? 2.6 : 2, 0, TAU); ctx.fill(); }
        for (let i = 0; i < 3; i++) stroke(ctx, [[48 + (i - 1) * 6, 76], [48 + (i - 1) * 12, 68]], { w: 2.4, ta: 0.1, tb: 0.5, wv: 0 }, r);
        seedIcon(ctx, r, 78, 26, 0.75, -0.9);
        break;
      }
      case 'lantern': {
        const g = ctx.createRadialGradient(50, 58, 4, 50, 58, 46);
        g.addColorStop(0, 'rgba(255,214,110,0.85)'); g.addColorStop(0.5, 'rgba(255,196,90,0.35)'); g.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 100, 100);
        ctx.save(); ctx.translate(50, 92); ctx.scale(5.2, 5.2);
        MIS = [0.3, 0.25];
        drawLantern(ctx, r);
        ctx.restore();
        break;
      }
      case 'speed': {
        const shoe = [[14, 70], [30, 64], [50, 62], [66, 50], [76, 36], [86, 38], [88, 56], [84, 74], [70, 80], [40, 82], [20, 80]];
        const P = spline(jit(shoe, 0.8, r), true, 5);
        wash(ctx, P, { c: '#b9cfe2', blobs: [{ x: 40, y: 68, rx: 20, ry: 8, c: '#f2f7fa', a: 0.85, blur: 5 }, { x: 78, y: 66, rx: 12, ry: 12, c: '#7896c0', a: 0.7, blur: 5 }], hi: 0.2, rim: 4, edge: '#5a78a8', rimA: 0.6, gran: 0.4 }, r);
        outline(ctx, P, { w: 3.4 * lw, light: 0.5, pieces: 3 }, r);
        stroke(ctx, [[78, 74], [82, 92], [86, 74]], { w: 3 * lw, ta: 0.1, tb: 0.2, wv: 0.2 }, r);
        stroke(ctx, [[26, 72], [44, 70], [60, 64]], { w: 2.4, ta: 0.2, tb: 0.4, wv: 0, color: '#fffdf6', alpha: 0.9 }, r);
        for (const [sx, sy, sr] of [[26, 34, 9], [46, 22, 6], [12, 52, 5]]) {
          const S = starPts(sx, sy, sr, sr * 0.28, 4, 0);
          trace(ctx, S); ctx.fillStyle = '#ffd866'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#8a5a14'; ctx.stroke();
        }
        break;
      }
      case 'magnet': {
        // golden drops above, basket in front
        for (const [gx, gy, gs] of [[34, 30, 3.2], [54, 22, 3.6], [70, 32, 3]]) {
          ctx.save(); ctx.translate(gx, gy + 14); ctx.scale(gs, gs); MIS = [0.2, 0.15]; drawGemDrop(ctx, r); ctx.restore();
        }
        MIS = [1.6, 1.3];
        stroke(ctx, [[16, 52], [24, 18], [50, 10], [76, 18], [84, 52]], { w: 4 * lw, jit: 0.8, ta: 0.05, tb: 0.05, wv: 0.3, color: '#6b4a24' }, r);
        const bask = [[10, 50], [90, 50], [82, 86], [66, 92], [34, 92], [18, 86]];
        const P = spline(jit(bask, 0.8, r), true, 5);
        wash(ctx, P, { c: '#c9963f', blobs: [{ x: 32, y: 62, rx: 18, ry: 10, c: '#e8c27a', a: 0.7, blur: 5 }, { x: 70, y: 82, rx: 18, ry: 10, c: '#8a5a1e', a: 0.7, blur: 5 }], hi: 0.2, rim: 4, edge: '#6a4214', rimA: 0.6, gran: 0.6 }, r);
        hatch(ctx, P, { ang: 0.6, sp: 7, w: 1.6, alpha: 0.55, jit: 0.6, region: () => 1 }, r);
        hatch(ctx, P, { ang: -0.6, sp: 7, w: 1.6, alpha: 0.45, jit: 0.6, region: () => 1 }, r);
        outline(ctx, P, { w: 3.6 * lw, light: 0.5, pieces: 3 }, r);
        const rim = ribbon(jit([[8, 51], [50, 47], [92, 51]], 0.6, r), () => 7);
        wash(ctx, rim, { c: '#a8742e', blobs: [{ x: 30, y: 49, rx: 14, ry: 3, c: '#d8a85a', a: 0.6, blur: 3 }], hi: 0, rim: 2, gran: 0.6 }, r);
        outline(ctx, rim, { w: 2.6 * lw, pieces: 2 }, r);
        break;
      }
      case 'hp': {
        // steam
        for (let i = 0; i < 3; i++) stroke(ctx, [[34 + i * 14, 34], [30 + i * 14, 24], [38 + i * 14, 16], [33 + i * 14, 6]], { w: 2.2 * lw, jit: 0.8, ta: 0.3, tb: 0.5, wv: 0.2, color: '#6a6a7a', alpha: 0.7 }, r);
        const pot = [[12, 44], [88, 44], [86, 66], [76, 84], [50, 90], [24, 84], [14, 66]];
        const P = spline(jit(pot, 0.8, r), true, 5);
        wash(ctx, P, { c: '#46506e', blobs: [{ x: 30, y: 56, rx: 14, ry: 10, c: '#7a86a8', a: 0.7, blur: 5 }, { x: 70, y: 78, rx: 18, ry: 10, c: '#232a40', a: 0.7, blur: 5 }], hi: 0.2, rim: 4, edge: '#1a1f30', rimA: 0.6, gran: 0.7 }, r);
        outline(ctx, P, { w: 3.6 * lw, light: 0.5, pieces: 3 }, r);
        // stew surface with chunks
        const top = spline(jit(blobPts(50, 44, 36, 7, 0.06, r, 12), 0.5, r), true, 4);
        wash(ctx, top, { c: '#d9862f', blobs: [{ x: 40, y: 42, rx: 12, ry: 3, c: '#f0b45a', a: 0.7, blur: 2 }], hi: 0, rim: 2, edge: '#8a3a12', gran: 0.4 }, r);
        for (const [cx, cy, c] of [[34, 43, '#7a4a8c'], [52, 41, '#eee0ba'], [64, 45, '#e8832f'], [44, 46, '#6c8a38']]) {
          ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, cy, 4.2, 2.6, 0.3, 0, TAU); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.stroke();
        }
        outline(ctx, top, { w: 2.6 * lw, pieces: 2 }, r);
        for (const s of [-1, 1]) stroke(ctx, [[50 + s * 36, 50], [50 + s * 46, 50], [50 + s * 44, 60], [50 + s * 34, 60]], { w: 3 * lw, ta: 0.05, tb: 0.05, wv: 0.2 }, r);
        break;
      }
      default: {
        const P = spline(blobPts(50, 50, 30, 30, 0.2, r, 10), true, 4);
        wash(ctx, P, { c: '#cf9a45', hi: 0.3, rim: 3, gran: 0.5 }, r);
        outline(ctx, P, { w: 3, pieces: 2 }, r);
      }
    }
    MIS = oldMis;
  }

  /* ======================================================================
     10. HUD textures + CSS
     ====================================================================== */
  function hudTextures() {
    const T = {};
    const url = (c) => c.toDataURL('image/png');
    // paper tile
    {
      const c = U.canvas(256, 256), img = c.ctx.createImageData(256, 256), d = img.data;
      for (let i = 0; i < 65536; i++) {
        const v = 0.95 + (PAP[i] - 0.5) * 0.1 - Math.max(0, GRA[i] - 0.7) * 0.06;
        d[i * 4] = PAPER[0] * v; d[i * 4 + 1] = PAPER[1] * v; d[i * 4 + 2] = PAPER[2] * v; d[i * 4 + 3] = 255;
      }
      c.ctx.putImageData(img, 0, 0);
      T.paper = url(c.c);
    }
    // hand-drawn frames (stretched by CSS)
    const frame = (w, h, seed, lw) => {
      const c = U.canvas(w, h), t = c.ctx, r = U.rng(seed);
      t.lineCap = 'round'; t.lineJoin = 'round';
      const m = 4, o = 6;
      const lines = [[[m - o, m + 1], [w / 2, m], [w - m + o, m + 2]], [[w - m - 1, m - 3], [w - m, h / 2], [w - m + 1, h - m + 3]], [[w - m + o, h - m - 1], [w / 2, h - m], [m - o, h - m]], [[m + 1, h - m + 3], [m, h / 2], [m - 1, m - 3]]];
      for (const L of lines) {
        const pts = L.map((p) => [p[0] + (r.next() - 0.5) * 1.6, p[1] + (r.next() - 0.5) * 1.2]);
        inkLine(t, spline(pts, false, 12), { w: lw, ta: 0.04, tb: 0.06, wv: 0.35, ph: r.next() * 9, color: INK, alpha: 0.9 });
      }
      return url(c.c);
    };
    T.frameXp = frame(1400, 28, 11, 2.6);
    T.frameHp = frame(240, 28, 12, 2.4);
    // wash strokes for bars
    const washBar = (w, h, base, blobs, seed, edge) => {
      const s = mkSprite(w, h, 0, 0, 1), r = U.rng(seed);
      const pts = [];
      const n = Math.max(8, Math.round(w / 40));
      for (let i = 0; i <= n; i++) pts.push([(i / n) * w, 2.5 + (r.next() - 0.5) * 2.4]);
      for (let i = n; i >= 0; i--) pts.push([(i / n) * w, h - 2.5 + (r.next() - 0.5) * 2.4]);
      const P = pts;
      const bl = [];
      for (let i = 0; i < Math.round(w / 60); i++) bl.push({ x: r.next() * w, y: h * (0.2 + r.next() * 0.6), rx: 20 + r.next() * 40, ry: h * 0.35, c: blobs[i % blobs.length], a: 0.55, blur: 6 });
      MIS = [0, 0];
      wash(s.ctx, P, { c: base, blobs: bl, hi: 0, rim: 3.5, edge, rimA: 0.7, rimBlur: 1.2, gran: 0.6 }, r);
      MIS = [0.45, 0.35];
      return url(s.c);
    };
    T.hp = washBar(460, 40, '#c23b2b', ['#e06a50', '#9a2418', '#d8483a'], 21, '#7a1a12');
    T.xp = washBar(1400, 30, '#dca23a', ['#f2cd72', '#c27a22', '#e8b44a'], 22, '#9a5a14');
    // ragged right edge mask
    {
      const c = U.canvas(16, 64), t = c.ctx, r = U.rng(5);
      t.fillStyle = '#000';
      t.beginPath(); t.moveTo(0, 0);
      for (let y = 0; y <= 64; y += 4) t.lineTo(6 + r.next() * 8, y);
      t.lineTo(0, 64); t.closePath(); t.fill();
      T.rag = url(c.c);
    }
    // paper plaque behind the clock (feathered)
    {
      const s = mkSprite(320, 120, 0, 0, 1), r = U.rng(31);
      MIS = [0, 0];
      wash(s.ctx, spline(blobPts(160, 60, 146, 48, 0.08, r, 16), true, 4), { c: 'rgb(246,239,224)', blobs: [{ x: 230, y: 80, rx: 60, ry: 25, c: '#e8dcc2', a: 0.6, blur: 14 }], hi: 0, rim: 5, edge: '#cbb994', rimA: 0.5, rimBlur: 2.5, gran: 0.4, feather: 6, alpha: 0.88 }, r);
      MIS = [0.45, 0.35];
      T.plaque = url(s.c);
    }
    // banner wash for titles
    const banner = (seed, c1, c2, c3) => {
      const s = mkSprite(900, 150, 0, 0, 1), r = U.rng(seed);
      const pts = [];
      for (let i = 0; i <= 18; i++) pts.push([30 + (i / 18) * 840 + (r.next() - 0.5) * 10, 26 + (r.next() - 0.5) * 18 + Math.sin(i * 0.7) * 6]);
      for (let i = 18; i >= 0; i--) pts.push([30 + (i / 18) * 840 + (r.next() - 0.5) * 10, 124 + (r.next() - 0.5) * 18 + Math.sin(i * 0.9) * 6]);
      MIS = [0, 0];
      const bl = [];
      for (let i = 0; i < 9; i++) bl.push({ x: 60 + r.next() * 780, y: 50 + r.next() * 50, rx: 50 + r.next() * 60, ry: 30, c: i % 2 ? c2 : c3, a: 0.5, blur: 18 });
      wash(s.ctx, spline(pts, true, 3), { c: c1, blobs: bl, hi: 0, rim: 7, edge: c3, rimA: 0.6, rimBlur: 2.5, gran: 0.55, feather: 2 }, r);
      MIS = [0.45, 0.35];
      // dry brush ends
      const t = s.ctx;
      t.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 26; i++) {
        const y = 22 + r.next() * 106, side = r.next() < 0.5;
        t.globalAlpha = 0.6 + r.next() * 0.4;
        t.lineWidth = 1 + r.next() * 3;
        t.beginPath();
        if (side) { t.moveTo(0, y); t.lineTo(30 + r.next() * 90, y + (r.next() - 0.5) * 4); } else { t.moveTo(900, y); t.lineTo(870 - r.next() * 90, y + (r.next() - 0.5) * 4); }
        t.stroke();
      }
      t.globalCompositeOperation = 'source-over';
      t.globalAlpha = 1;
      return url(s.c);
    };
    T.banner = banner(41, '#efc36a', '#f7dc9a', '#d0902e');
    T.banner2 = banner(42, '#c9a0a0', '#e8c8b8', '#9a5a4a');
    // deckle-edged watercolour paper card
    {
      const w = 448, h = 584, c = U.canvas(w, h), t = c.ctx, r = U.rng(51);
      const img = t.createImageData(w, h), d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const e = Math.min(x, y, w - 1 - x, h - 1 - y);
          const nz = (WA[(((y * 3) & 1023) << 10) | ((x * 3) & 1023)] - 0.5) * 18 + (PAP[((y & 255) << 8) | (x & 255)] - 0.5) * 5;
          const a = clamp01((e - 7 + nz * 0.5) / 2.2);
          if (a <= 0) continue;
          const pv = 0.965 + (PAP[((y & 255) << 8) | (x & 255)] - 0.5) * 0.09;
          // soft wash bloom behind the icon area + edge pooling of the paper tint
          const dx = (x - w / 2) / (w * 0.42), dy = (y - h * 0.3) / (h * 0.24);
          const bl = clamp01(1 - Math.sqrt(dx * dx + dy * dy)) * (0.75 + (WB[(((y * 2) & 1023) << 10) | ((x * 2) & 1023)] - 0.5) * 0.9);
          const edge = Math.exp(-Math.pow((Math.sqrt(dx * dx + dy * dy) - 0.95) / 0.07, 2)) * 0.25;
          let R = PAPER[0] * pv, Gc = PAPER[1] * pv, B = PAPER[2] * pv;
          const wsh = clamp01(bl * 0.55 + edge);
          R *= 1 - wsh * 0.10; Gc *= 1 - wsh * 0.16; B *= 1 - wsh * 0.36;
          const o = (y * w + x) * 4;
          d[o] = R; d[o + 1] = Gc; d[o + 2] = B; d[o + 3] = a * 255;
        }
      }
      t.putImageData(img, 0, 0);
      t.lineCap = 'round';
      const m = 22;
      const pts = [[[m, m + 2], [w / 2, m - 1], [w - m, m + 1]], [[w - m + 1, m - 2], [w - m - 1, h / 2], [w - m + 1, h - m + 2]], [[w - m + 2, h - m], [w / 2, h - m + 1], [m - 2, h - m - 1]], [[m - 1, h - m + 2], [m + 1, h / 2], [m, m - 3]]];
      for (const L of pts) inkLine(t, spline(L.map((p) => [p[0] + (r.next() - 0.5) * 3, p[1] + (r.next() - 0.5) * 3]), false, 10), { w: 2.2, ta: 0.05, tb: 0.08, wv: 0.4, ph: r.next() * 9, alpha: 0.75 });
      // little corner flourishes
      for (const [cx, cy, sx, sy] of [[m + 10, m + 10, 1, 1], [w - m - 10, m + 10, -1, 1], [m + 10, h - m - 10, 1, -1], [w - m - 10, h - m - 10, -1, -1]]) {
        inkLine(t, spline([[cx, cy + sy * 14], [cx + sx * 2, cy + sy * 2], [cx + sx * 14, cy]], false, 6), { w: 1.6, ta: 0.3, tb: 0.3, wv: 0.2, alpha: 0.6 });
        t.fillStyle = 'rgba(42,27,20,0.6)'; t.beginPath(); t.arc(cx + sx * 5, cy + sy * 5, 1.8, 0, TAU); t.fill();
      }
      T.card = url(c.c);
    }
    // ink swash ornament under the clock
    {
      const c = U.canvas(220, 26), t = c.ctx, r = U.rng(61);
      inkLine(t, spline([[12, 15], [50, 9], [92, 15], [110, 12], [128, 15], [170, 9], [208, 15]], false, 10), { w: 2.0, ta: 0.3, tb: 0.3, wv: 0.3, alpha: 0.85 });
      t.fillStyle = INK; t.beginPath(); t.arc(110, 13, 2.6, 0, TAU); t.fill();
      T.swash = url(c.c);
    }
    return T;
  }
  function makeCss(T) {
    const S = 'body.style-watercolor';
    const fell = "'IM Fell English SC', 'IM Fell English', Georgia, serif";
    const corm = "'Cormorant Garamond', Georgia, serif";
    const cav = "'Caveat', 'Segoe Print', cursive";
    const halo = '0 0 3px #f5eede, 0 0 7px #f5eede, 0 0 12px rgba(245,238,222,.8)';
    const mask = `-webkit-mask: url(${T.rag}) right center / 12px 100% no-repeat, linear-gradient(#000,#000) left center / calc(100% - 11px) 100% no-repeat; mask: url(${T.rag}) right center / 12px 100% no-repeat, linear-gradient(#000,#000) left center / calc(100% - 11px) 100% no-repeat;`;
    return `
${S} { font-family: ${corm}; color: ${INK}; }
${S} #hud { padding: 12px 24px; }
${S} #hud .xp { height: 20px; background: rgba(245,238,222,.55); border: 0; border-radius: 0; overflow: visible; }
${S} #hud .xp::after { content: ''; position: absolute; inset: -4px -6px; background: url(${T.frameXp}) center / 100% 100% no-repeat; pointer-events: none; }
${S} #hud .xp-fill { inset: 1px auto 1px 0; background: url(${T.xp}) left center / calc(100vw - 48px) 100% no-repeat; transition: width .3s; ${mask} }
${S} #hud .lvl { font: 700 20px ${cav}; color: ${INK}; right: 14px; text-shadow: ${halo}; letter-spacing: .5px; z-index: 2; }
${S} #hud .topline { margin-top: 12px; }
${S} #hud .hp { gap: 8px; }
${S} #hud .hp-icon, ${S} #hud .kills-icon { width: 38px; height: 38px; }
${S} #hud .hp-bar { width: 236px; height: 22px; background: rgba(245,238,222,.62); border: 0; border-radius: 0; overflow: visible; }
${S} #hud .hp-bar::after { content: ''; position: absolute; inset: -4px -6px; background: url(${T.frameHp}) center / 100% 100% no-repeat; pointer-events: none; }
${S} #hud .hp-fill { inset: 1px auto 1px 0; background: url(${T.hp}) left center / 236px 100% no-repeat; transition: width .15s; ${mask} }
${S} #hud .hp-text { font: 400 19px ${fell}; color: ${INK}; text-shadow: ${halo}; margin-left: 4px; }
${S} #hud .clock { padding: 8px 46px 14px; margin-top: -8px; background: url(${T.plaque}) center / 100% 100% no-repeat; }
${S} #hud .clock-time { font: 400 40px ${fell}; color: ${INK}; text-shadow: none; letter-spacing: 1.5px; line-height: 1; }
${S} #hud .clock-label { font: 700 20px ${cav}; text-transform: none; letter-spacing: .3px; color: #8a3a1e; opacity: 1; margin-top: -1px; padding-bottom: 8px; background: url(${T.swash}) center bottom / 110px 13px no-repeat; }
${S} #hud .kills { font: 400 30px ${fell}; color: ${INK}; text-shadow: ${halo}; gap: 6px; }
${S}.hurt #hud .hp-bar { filter: drop-shadow(0 0 6px rgba(178,40,28,.8)); }
${S} #stylebar { background: url(${T.paper}) #f5eede; color: ${INK}; border: 1.5px solid rgba(42,27,20,.85); border-radius: 255px 18px 225px 18px / 18px 225px 18px 255px; box-shadow: 0 3px 12px rgba(60,40,20,.3); padding: 6px 24px; gap: 14px; }
${S} #stylebar .style-family { font: 700 18px ${cav}; color: #8a3a1e; text-transform: none; letter-spacing: 0; opacity: 1; }
${S} #stylebar .style-name { font: 400 19px ${fell}; font-weight: 400; }
${S} #stylebar .style-hint { font: italic 500 15px ${corm}; opacity: .85; }
${S} #stylebar .auto.on { color: #4f6b22; font-weight: 700; }
${S} #stylemenu { background: url(${T.paper}) #f5eede; border: 1.5px solid ${INK}; border-radius: 6px; box-shadow: 0 8px 22px rgba(40,25,10,.4); }
${S} #stylemenu .sm-item { color: ${INK}; background: rgba(42,27,20,.04); font-family: ${corm}; }
${S} #stylemenu .sm-item:hover { background: rgba(201,154,63,.2); }
${S} #stylemenu .sm-item.active { border-color: #a3532c; }
${S} #stylemenu .sm-name { font: 400 17px ${fell}; }
${S} #stylemenu .sm-fam { font: 700 14px ${cav}; color: #8a3a1e; opacity: 1; }
${S} #levelup { background: radial-gradient(ellipse at 50% 46%, rgba(245,238,222,.28), rgba(58,40,26,.68) 78%); gap: 24px; }
${S} #levelup .lu-title { font-size: 0; text-shadow: none; padding: 20px 80px 26px; background: url(${T.banner}) center / 100% 100% no-repeat; }
${S} #levelup .lu-title::after { content: 'Ein neues Kapitel!'; font: 400 52px ${fell}; color: ${INK}; letter-spacing: 1px; }
${S} #levelup .lu-cards { gap: 30px; }
${S} #levelup .card { width: 224px; min-height: 292px; padding: 34px 24px 28px; gap: 8px; background: url(${T.card}) center / 100% 100% no-repeat; border: 0; border-radius: 0; color: ${INK}; filter: drop-shadow(0 8px 10px rgba(30,18,8,.45)); transition: transform .15s; }
${S} #levelup .card:nth-child(1) { transform: rotate(-1.4deg); }
${S} #levelup .card:nth-child(3) { transform: rotate(1.1deg); }
${S} #levelup .card:hover { transform: translateY(-8px) rotate(-.4deg); }
${S} #levelup .card-icon { width: 108px; height: 108px; }
${S} #levelup .card-name { font: 400 23px ${fell}; line-height: 1.1; margin-top: 4px; }
${S} #levelup .card-desc { font: italic 600 18px ${corm}; color: #5b3a24; opacity: 1; line-height: 1.2; }
${S} #levelup .card-key { font: 700 24px ${cav}; color: #a3532c; opacity: 1; top: 18px; left: 26px; }
${S} #levelup .lu-hint { font: 700 22px ${cav}; color: #f5eede; opacity: .95; text-shadow: 0 1px 4px rgba(30,18,8,.85); }
${S} #gameover { background: radial-gradient(ellipse at 50% 46%, rgba(245,238,222,.28), rgba(58,40,26,.78) 78%); }
${S} #gameover .go-title { font: 400 60px ${fell}; color: ${INK}; padding: 18px 90px 24px; background: url(${T.banner2}) center / 100% 100% no-repeat; }
${S} #gameover .go-stats { font: italic 600 23px ${corm}; color: #f5eede; text-shadow: 0 1px 4px rgba(30,18,8,.9); }
${S} #gameover .go-hint { font: 700 23px ${cav}; color: #f5eede; opacity: .9; }
${S} #pausebox { font: 400 56px ${fell}; color: ${INK}; text-shadow: 0 0 6px #f5eede, 0 0 16px #f5eede, 0 0 26px #f5eede; }
`;
  }

  /* ======================================================================
     11. Runtime helpers
     ====================================================================== */
  let SH = null, SHL = null;   // shadow union paths (one wash per frame)
  function flushShadows(ctx) {
    if (!SH) return;
    ctx.fillStyle = 'rgba(50,54,92,0.2)';
    ctx.fill(SH);
    ctx.fillStyle = 'rgba(50,54,92,0.11)';
    ctx.fill(SHL);
    SH = SHL = null;
  }
  const COLS = {
    creeper: ['violet', 'cream', 'violet', 'leaf', 'plum'],
    ghost: ['ghost', 'frost', 'ghostDk', 'ghost'],
    colossus: ['sienna', 'violet', 'ochre', 'umber', 'orange'],
  };
  function dropBurst(game, x, y, z, n, cols, sp, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.35 + Math.random() * 0.8);
      game.addParticle({
        x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.65, vz: 30 + Math.random() * 70, grav: 260,
        life: 0.9 + Math.random() * 0.8, size: size * (0.5 + Math.random() * 0.9), kind: 'paint',
        col: cols[(Math.random() * cols.length) | 0], drag: 1.6, v: (Math.random() * 3) | 0,
      });
    }
  }

  /* ======================================================================
     12. Style registration
     ====================================================================== */
  Styles.register({
    id: 'watercolor',
    name: 'Aquarell-Märchenbuch',
    family: 'Illustriert',
    description: 'Lasuren aus Aquarellfarbe und lockere Tuschelinien auf kaltgepresstem Papier – ein lebendiges Märchenbuch.',
    groundColor: '#d6d7b2',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['IM+Fell+English+SC', 'Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600', 'Caveat:wght@500;700'],
    css: '',

    init() {
      const t0 = performance.now();
      buildTextures();
      const t1 = performance.now();
      buildCharacters();
      const t2 = performance.now();
      buildProps();
      const t3 = performance.now();
      fxSprites();
      const T = hudTextures();
      this.css = makeCss(T);
      const tag = document.getElementById('style-css');
      if (tag && document.body.classList.contains('style-watercolor')) tag.textContent = this.css;
      window.__wcInit = { tex: Math.round(t1 - t0), chars: Math.round(t2 - t1), props: Math.round(t3 - t2), rest: Math.round(performance.now() - t3) };
    },

    renderGroundChunk(ctx, info) { return groundGen(ctx, info); },

    propsForChunk(info) {
      const out = [];
      const ok = (x, y, clear) => !G.nearSpawn(x, y, 95) && pathDist(x, y) > clear;
      // trees: mostly inside forests, a few lone ones in meadows
      G.scatterOwned(info, 76, 7001, (x, y, r) => {
        const f = fieldF(x, y) - T_F;
        const pr = f > 0.012 ? 0.5 : f > -0.008 ? 0.16 : 0.03;
        if (!r.chance(pr) || !ok(x, y, 12)) return;
        const fir = f > 0.02 && r.chance(0.4);
        out.push({ x, y, t: fir ? 'fir' : 'tree', v: fir ? r.int(0, 1) : r.int(0, 3), flip: r.chance(0.5), sh: fir ? [13, 4.5, 4] : [21, 6.5, 5], pad: 110, fade: fir ? [14, 82] : [26, 90] });
      });
      G.scatterOwned(info, 110, 7002, (x, y, r) => {
        if (!r.chance(0.2) || !ok(x, y, 6)) return;
        const m = matAt(x, y);
        if (m.kind === 'G' && !r.chance(0.3)) return;
        out.push({ x, y, t: 'bush', v: r.int(0, 2), flip: r.chance(0.5), sh: [10, 3.2, 2] });
      });
      G.scatterOwned(info, 120, 7003, (x, y, r) => {
        const m = matAt(x, y);
        const pr = m.kind === 'G' ? 0.35 : m.kind === 'M' ? 0.14 : 0;
        if (!r.chance(pr) || !ok(x, y, 6)) return;
        const n = 1 + r.int(0, 2);
        for (let i = 0; i < n; i++) {
          const v = i === 0 && r.chance(0.22) ? 3 : r.int(0, 2);
          out.push({ x: x + (i ? (r.next() - 0.5) * 26 : 0), y: y + (i ? (r.next() - 0.3) * 14 : 0), t: 'pumpkin', v, flip: r.chance(0.5), sh: [v === 0 || v === 3 ? 8 : 6, 2.4, 1.5] });
        }
      });
      G.scatterOwned(info, 140, 7004, (x, y, r) => {
        if (!r.chance(0.5)) return;
        const m = matAt(x, y);
        if (m.kind !== 'G' || !ok(x, y, 10)) return;
        out.push({ x, y, t: 'hay', v: r.int(0, 1), flip: r.chance(0.5), sh: [13, 4, 4], pad: 70 });
      });
      G.scatterOwned(info, 190, 7005, (x, y, r) => {
        if (!r.chance(0.22)) return;
        const m = matAt(x, y);
        if (m.kind !== 'M' || !ok(x, y, 8)) return;
        const n = 1 + r.int(0, 2);
        for (let i = 0; i < n; i++) out.push({ x: x + i * 31.5, y: y + i * (r.next() - 0.5) * 2, t: 'fence', v: i === 1 && r.chance(0.5) ? 1 : 0, flip: false, sh: [16, 2.6, 1] });
      });
      G.scatterOwned(info, 230, 7006, (x, y, r) => {
        if (!r.chance(0.16)) return;
        const m = matAt(x, y);
        if ((m.kind !== 'M' && m.kind !== 'G') || !ok(x, y, 8)) return;
        out.push({ x, y, t: 'wall', v: r.int(0, 1), flip: r.chance(0.5), sh: [17, 3, 1.5] });
      });
      G.scatterOwned(info, 140, 7007, (x, y, r) => {
        const pd = pathDist(x, y);
        if (pd < 3 || pd > 16 || !r.chance(0.6) || G.nearSpawn(x, y, 95)) return;
        out.push({ x, y, t: 'sign', v: 0, flip: r.chance(0.5), sh: [5, 1.8, 2], pad: 70 });
      });
      G.scatterOwned(info, 280, 7008, (x, y, r) => {
        if (!r.chance(0.5)) return;
        const m = matAt(x, y);
        if (m.kind !== 'G' || !ok(x, y, 10)) return;
        out.push({ x, y, t: 'scare', v: 0, flip: r.chance(0.5), sh: [8, 2.4, 3], pad: 70 });
      });
      G.scatterOwned(info, 200, 7009, (x, y, r) => {
        if (!r.chance(0.14) || !ok(x, y, 10)) return;
        out.push({ x, y, t: 'boulder', v: r.int(0, 1), flip: r.chance(0.5), sh: [11, 3.4, 2] });
      });
      return out;
    },

    drawProp(ctx, p, view) {
      if (SH) flushShadows(ctx);
      const s = PROPS[p.t] && PROPS[p.t][p.v];
      if (!s) return;
      if (p.fade) {
        const pl = view.game.player;
        if (pl.y < p.y - 1 && pl.y > p.y - p.fade[1] && Math.abs(pl.x - p.x) < p.fade[0]) ctx.globalAlpha = 0.42;
      }
      blit(ctx, s, p.x, p.y, p.flip);
      ctx.globalAlpha = 1;
    },

    drawGroundOverlay(ctx, view, game) {
      SH = new Path2D();
      SHL = new Path2D();
      // ground stains: landed paint, blooms, spawn puddles, lantern light
      for (const pt of game.particles) {
        if (pt.kind === 'paint' && pt.z <= 0.3 && Math.abs(pt.vz) < 25) {
          const set = FX[pt.col] || FX.ink;
          const s = pt.size * 1.15;
          ctx.globalAlpha = Math.min(1, (pt.life / pt.max) * 3) * 0.85;
          ctx.drawImage(set.dot[pt.v || 0].c, pt.x - s / 2, pt.y - s * 0.3, s, s * 0.6);
        } else if (pt.kind === 'ring') {
          const age = 1 - pt.life / pt.max, R = pt.size * (0.35 + 0.65 * U.ease.outQuad(Math.min(1, age * 1.6)));
          ctx.globalAlpha = (1 - age) * 0.75;
          ctx.drawImage(FX.ringTint[pt.col] || FX.ringTint.ink, pt.x - R, pt.y - R * 0.62, R * 2, R * 1.24);
        }
      }
      for (const e of game.enemies) {
        if (e.spawnT >= 1 || e.dying) continue;
        const st = FX.stain[e.type];
        const k = U.ease.outQuad(Math.min(1, e.spawnT * 1.5));
        const R = e.r * (0.6 + 1.1 * k);
        ctx.globalAlpha = (1 - e.spawnT) * 0.85;
        ctx.drawImage(st.c, e.x - R, e.y - R * 0.6, R * 2, R * 1.2);
      }
      ctx.globalAlpha = 1;
      for (const o of game.orbitals) {
        ctx.globalAlpha = 0.55;
        ctx.drawImage(FX.pool, o.x - 16, o.y + 4 - 8, 32, 16);
      }
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o) {
      if (!SH) return;
      let rx, ry, ox = 0.8, oy = 0.4, light = false;
      if (o.kind === 'player') { rx = 7.6; ry = 2.8; }
      else if (o.kind === 'enemy') {
        if (o.dying) return;
        const sp = o.spawnT < 1 ? o.spawnT : 1;
        if (o.type === 'ghost') { rx = 5.2 * sp; ry = 1.9 * sp; light = true; }
        else { rx = o.r * 0.95 * sp; ry = rx * 0.36; }
        if (rx < 0.5) return;
      } else if (o.kind === 'prop') {
        if (!o.sh) return;
        rx = o.sh[0]; ry = o.sh[1]; ox = o.sh[2];
      } else return;
      const P = light ? SHL : SH;
      P.moveTo(o.x + ox + rx, o.y + oy);
      P.ellipse(o.x + ox, o.y + oy, rx, ry, 0, 0, TAU);
    },

    drawGem(ctx, g, view) {
      const set = g.big ? SPR.gemBig : SPR.gem;
      const s = set[(Math.floor(view.rt * 4 + g.seed * 3)) % 3];
      const pop = g.pop > 0 ? 1 + Math.sin(g.pop * Math.PI) * 0.7 : 1;
      const bob = g.big ? Math.sin(view.rt * 3 + g.seed * 20) * 1.0 - 1 : 0;
      const sw = g.big ? 14 : 7;
      ctx.drawImage(SPR.gemShadow, g.x - sw / 2 + 0.5, g.y - sw * 0.18, sw, sw * 0.36);
      blit(ctx, s, g.x, g.y + bob, false, pop);
    },

    drawEnemy(ctx, e, view) {
      if (SH) flushShadows(ctx);
      const sets = SPR[e.type];
      if (!sets) return;
      const vi = e.type === 'creeper' ? (e.seed < 0.5 ? 0 : 1) : 0;
      const set = sets[vi];
      const flip = e.facing < 0;
      const sc = 0.93 + e.seed * 0.14;
      let y = e.y;
      if (e.type === 'ghost') y += -2.2 + Math.sin(view.rt * 3 + e.seed * 9) * 1.3;
      const alphaBase = e.type === 'ghost' ? 0.9 : 1;
      if (e.dying) {
        const dfs = SPR.death[e.type][vi];
        const i = Math.min(dfs.length - 1, Math.floor(e.deathT * dfs.length));
        ctx.globalAlpha = alphaBase * (1 - e.deathT * 0.25);
        blit(ctx, dfs[i], e.x, y, flip, sc);
        ctx.globalAlpha = 1;
        return;
      }
      const speedK = e.type === 'colossus' ? 0.45 : e.type === 'ghost' ? 0.35 : 0.7;
      const pose = Math.floor(e.anim * speedK) & 3;
      const boil = (Math.floor(view.rt * 5 + e.seed * 7)) & 1;
      const fr = set[pose * 2 + boil];
      if (e.spawnT < 1) {
        const st = e.spawnT;
        const soft = SPR.soft[e.type][vi];
        const sy = 0.75 + 0.25 * U.ease.outQuad(st);
        ctx.globalAlpha = alphaBase * Math.sin(Math.PI * Math.min(1, st * 1.1)) * 0.9;
        const ax = flip ? soft.wu - soft.ax : soft.ax;
        ctx.drawImage(flip ? soft.f : soft.c, e.x - ax * sc * 1.06, y - soft.ay * sc * sy, soft.wu * sc * 1.06, soft.hu * sc * sy);
        const a2 = U.smoothstep(0.35, 1, st);
        if (a2 > 0) {
          ctx.globalAlpha = alphaBase * a2;
          const fx = flip ? fr.wu - fr.ax : fr.ax;
          ctx.drawImage(flip ? fr.f : fr.c, e.x - fx * sc, y - fr.ay * sc * sy, fr.wu * sc, fr.hu * sc * sy);
        }
        ctx.globalAlpha = 1;
        return;
      }
      ctx.globalAlpha = alphaBase;
      blit(ctx, fr, e.x, y, flip, sc);
      if (e.flash > 0) {
        ctx.globalAlpha = Math.min(0.55, e.flash * 1.2) * alphaBase;
        blit(ctx, fr, e.x, y, flip, sc, flip ? fr.flf : fr.fl);
      }
      ctx.globalAlpha = 1;
      if (e.type === 'colossus') {
        // pulsing core glow
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.22 + 0.1 * Math.sin(view.rt * 4 + e.seed * 9);
        const gx = e.x + (flip ? -3.2 : 3.2) * sc, gy = y - 25.5 * sc;
        ctx.drawImage(FX.glow, gx - 9, gy - 9, 18, 18);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    },

    drawPlayer(ctx, p, view) {
      if (SH) flushShadows(ctx);
      const rt = view.rt;
      const boil = Math.floor(rt * 6) % 3;
      let fr, bob;
      if (p.moving) {
        const ph = p.anim * 0.8;
        fr = SPR.jack.walk[Math.floor(ph) & 3][boil];
        bob = -0.9 * Math.abs(Math.cos(ph * Math.PI / 2));
      } else {
        fr = SPR.jack.idle[boil];
        bob = Math.sin(rt * 2.4) * 0.35;
      }
      const flip = p.facing < 0;
      // level-up golden bloom
      if (p.levelT > 0) {
        const R = 10 + (1 - p.levelT) * 34;
        ctx.globalAlpha = p.levelT * 0.8;
        ctx.drawImage(FX.ringTint.gold, p.x - R, p.y - R * 0.62, R * 2, R * 1.24);
        ctx.globalAlpha = 1;
      }
      // dash smear copies
      if (p.dashT > 0) {
        for (let i = 2; i >= 1; i--) {
          ctx.globalAlpha = 0.22 / i;
          blit(ctx, fr, p.x - p.dashX * 7 * i, p.y - p.dashY * 7 * i + bob, flip);
        }
        ctx.globalAlpha = 1;
      }
      let a = 1;
      if (p.iframes > 0 && p.hurtT < 0.7 && Math.floor(rt * 16) % 2 === 0) a = 0.5;
      ctx.globalAlpha = a;
      blit(ctx, fr, p.x, p.y + bob, flip);
      if (p.hurtT > 0.4) {
        ctx.globalAlpha = Math.min(1, (p.hurtT - 0.4) * 2.5);
        blit(ctx, fr, p.x, p.y + bob, flip, 1, flip ? fr.flf : fr.fl);
      }
      // warm glow of the carved face
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (0.3 + 0.08 * Math.sin(rt * 11) + 0.05 * Math.sin(rt * 23)) * a;
      const fx = p.x + (flip ? -2.1 : 2.1), fy = p.y + bob - 18.6;
      ctx.drawImage(FX.glow, fx - 9, fy - 8, 18, 16);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const bob = Math.sin(view.rt * 3 + o.idx * 1.7) * 1.1;
      const s = SPR.lantern[(Math.floor(view.rt * 5) + o.idx) % 3];
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.32 + 0.07 * Math.sin(view.rt * 9 + o.idx * 3);
      ctx.drawImage(FX.glow, o.x - 12, o.y - 18 + bob, 24, 22);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      blit(ctx, s, o.x, o.y + 2 + bob, Math.cos(o.angle) < 0);
    },

    drawProjectile(ctx, pr) {
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.angle);
      const tr = SPR.trail;
      ctx.globalAlpha = Math.min(1, pr.age * 10) * Math.min(1, pr.life * 5) * 0.9;
      ctx.drawImage(tr.c, -tr.ax, -tr.ay, tr.wu, tr.hu);
      ctx.globalAlpha = Math.min(1, pr.life * 6);
      ctx.rotate(pr.spin);
      const s = SPR.seed[pr.seed < 0.5 ? 0 : 1];
      ctx.drawImage(s.c, -s.ax, -s.ay, s.wu, s.hu);
      ctx.restore();
      ctx.globalAlpha = 1;
    },

    drawParticle(ctx, pt) {
      const life = pt.life / pt.max;
      switch (pt.kind) {
        case 'paint': {
          if (pt.z <= 0.3 && Math.abs(pt.vz) < 25) return; // drawn on the ground layer
          const set = FX[pt.col] || FX.ink;
          const s = pt.size;
          ctx.globalAlpha = 0.95;
          ctx.drawImage(set.dot[pt.v || 0].c, pt.x - s / 2, pt.y - pt.z - s / 2, s, s);
          break;
        }
        case 'splat': {
          const set = FX[pt.col] || FX.ink;
          const age = 1 - life, s = pt.size * (0.55 + 0.6 * Math.sqrt(age));
          ctx.globalAlpha = Math.min(1, life * 2.2) * (pt.a || 0.8);
          ctx.save();
          ctx.translate(pt.x, pt.y - pt.z);
          ctx.rotate(pt.rot);
          ctx.drawImage(set.splat[pt.v || 0].c, -s / 2, -s / 2, s, s);
          ctx.restore();
          break;
        }
        case 'ring': return;
        case 'star': {
          const s = pt.size * (0.6 + 0.4 * Math.sin(life * Math.PI));
          ctx.globalAlpha = Math.min(1, life * 2.5);
          ctx.save();
          ctx.translate(pt.x, pt.y - pt.z);
          ctx.rotate(pt.rot);
          ctx.drawImage(FX.star.c, -s / 2, -s / 2, s, s);
          ctx.restore();
          break;
        }
        case 'smear': {
          ctx.globalAlpha = life * 0.75;
          ctx.save();
          ctx.translate(pt.x, pt.y - pt.z);
          ctx.rotate(pt.rot);
          const s = FX.smear;
          ctx.drawImage(s.c, -s.ax, -s.ay, s.wu, s.hu);
          ctx.restore();
          break;
        }
        default: {
          ctx.globalAlpha = Math.min(1, life * 2);
          ctx.fillStyle = pt.color || INK;
          const s = pt.size;
          ctx.beginPath(); ctx.arc(pt.x, pt.y - pt.z, s * 0.5, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n) {
      const life = n.life / n.max, age = 1 - life;
      const pop = age < 0.12 ? 0.55 + (age / 0.12) * 0.6 : 1.15 - Math.min(0.15, (age - 0.12) * 0.5);
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate((n.seed - 0.5) * 0.28);
      ctx.scale(pop, pop);
      ctx.globalAlpha = Math.min(1, life * 2.6);
      ctx.font = n.crit ? '700 15px Caveat, "Segoe Print", cursive' : '700 10.5px Caveat, "Segoe Print", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const txt = String(n.value);
      if (n.crit) {
        const set = FX.red;
        ctx.globalAlpha *= 0.45;
        ctx.drawImage(set.splat[(n.seed * 2) | 0].c, -11, -10, 22, 20);
        ctx.globalAlpha = Math.min(1, life * 2.6);
      }
      ctx.lineJoin = 'round';
      ctx.lineWidth = n.crit ? 3 : 2.4;
      ctx.strokeStyle = 'rgba(246,239,224,0.9)';
      ctx.strokeText(txt, 0, 0);
      ctx.fillStyle = n.crit ? '#9e2a1c' : INK;
      ctx.fillText(txt, 0, 0);
      ctx.restore();
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

    drawIcon(ctx, id, size) { drawIconImpl(ctx, id, size); },

    /* ---------- hooks ---------- */
    onHit(game, e, src) {
      const h = (HEIGHT[e.type] || 24) * 0.5;
      game.addParticle({ x: e.x, y: e.y, z: h, kind: 'splat', col: src === 'lantern' ? 'orange' : 'ink', life: 0.17, size: e.type === 'colossus' ? 15 : 10, drag: 0, rot: Math.random() * TAU, v: (Math.random() * 2) | 0, a: 0.7 });
      const cols = COLS[e.type] || COLS.creeper;
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 50;
        game.addParticle({ x: e.x, y: e.y, z: h, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 20 + Math.random() * 40, grav: 240, kind: 'paint', col: i === 0 ? 'ink' : cols[(Math.random() * cols.length) | 0], life: 0.6 + Math.random() * 0.5, size: 1 + Math.random() * 1.1, drag: 1.5, v: (Math.random() * 3) | 0 });
      }
    },
    onKill(game, e) {
      const h = (HEIGHT[e.type] || 24) * 0.5;
      const big = e.type === 'colossus';
      const cols = COLS[e.type] || COLS.creeper;
      dropBurst(game, e.x, e.y, h, big ? 22 : 10, cols.concat(['ink']), big ? 110 : 75, big ? 3.4 : 2.4);
      game.addParticle({ x: e.x, y: e.y, kind: 'ring', col: e.type === 'ghost' ? 'ghost' : e.type === 'colossus' ? 'sienna' : 'violet', life: big ? 1.4 : 1.0, size: big ? 30 : 15, drag: 0 });
      game.addParticle({ x: e.x, y: e.y, z: h, kind: 'splat', col: cols[0], life: 0.28, size: big ? 30 : 16, drag: 0, rot: Math.random() * TAU, v: (Math.random() * 2) | 0, a: 0.75 });
    },
    onHurt(game, p) {
      game.addParticle({ x: p.x, y: p.y, z: 14, kind: 'splat', col: 'red', life: 0.3, size: 18, drag: 0, rot: Math.random() * TAU, v: 0, a: 0.75 });
      dropBurst(game, p.x, p.y, 14, 8, ['red', 'red', 'orange', 'ink'], 70, 2.2);
    },
    onPickup(game, g) {
      const n = g.big ? 5 : 1;
      for (let i = 0; i < n; i++) {
        game.addParticle({ x: g.x + (Math.random() - 0.5) * 8, y: g.y, z: 6 + Math.random() * 10, vz: 10, kind: 'star', life: 0.4 + Math.random() * 0.2, size: g.big ? 7 : 4.5, drag: 2, rot: Math.random(), vr: 3 });
      }
    },
    onShoot(game, pr) {
      if (Math.random() < 0.5) {
        game.addParticle({ x: pr.x, y: pr.y + 4, z: 4, vx: pr.vx * 0.08 + (Math.random() - 0.5) * 20, vy: pr.vy * 0.08, vz: 25, grav: 200, kind: 'paint', col: 'orange', life: 0.5, size: 1.1, drag: 2, v: (Math.random() * 3) | 0 });
      }
    },
    onDash(game, p) {
      game.addParticle({ x: p.x - p.dashX * 4, y: p.y, z: 12, kind: 'smear', life: 0.38, size: 1, drag: 0, rot: Math.atan2(p.dashY, p.dashX), vr: 0 });
      for (let i = 0; i < 4; i++) game.addParticle({ x: p.x, y: p.y, z: 0, vx: -p.dashX * (20 + Math.random() * 30) + (Math.random() - 0.5) * 20, vy: -p.dashY * 20 + (Math.random() - 0.5) * 14, vz: 0, kind: 'paint', col: 'umber', life: 0.9, size: 1.4, drag: 4, v: i % 3 });
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y, kind: 'ring', col: 'gold', life: 1.2, size: 40, drag: 0 });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * 60, vy: Math.sin(a) * 40, vz: 40, grav: 60, kind: 'star', life: 0.8 + Math.random() * 0.4, size: 5 + Math.random() * 3, drag: 2.5, rot: Math.random() * 3, vr: (Math.random() - 0.5) * 6 });
      }
    },
    onDeath(game, p) {
      game.addParticle({ x: p.x, y: p.y, z: 14, kind: 'splat', col: 'orange', life: 0.8, size: 34, drag: 0, rot: Math.random() * TAU, v: 1, a: 0.85 });
      dropBurst(game, p.x, p.y, 16, 24, ['orange', 'orange', 'indigo', 'red', 'ink'], 110, 3);
      game.addParticle({ x: p.x, y: p.y, kind: 'ring', col: 'orange', life: 1.6, size: 44, drag: 0 });
    },
  });
})();
