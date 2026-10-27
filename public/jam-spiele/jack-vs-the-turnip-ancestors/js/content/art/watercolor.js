/* Native art for the new enemies / upgrades in the 'watercolor' world (Aquarell-Märchenbuch) – see js/content/ART_API.md.
   Same brush toolkit as js/styles/watercolor.js (copied): wet-in-wet washes with rim darkening + granulation on
   cold-pressed paper, loose broken ink contours, glowing carved eyes, 2 "boil" variants per pose, paint-dissolve death.
   Frames are painted lazily (with a small per-frame time budget) and cached. */
(function () {
  'use strict';
  const U = window.U, CT = window.Content;
  const TAU = Math.PI * 2;
  const K = 3;
  const LX = -0.6, LY = -0.8;
  const INK = '#2a1b14';
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const hyp = (a, b) => Math.sqrt(a * a + b * b);

  /* The style's drawGroundOverlay paints a spawn stain via FX.stain[e.type] – unknown for the new types (TypeError
     the moment e.g. an Rübchen pops out of a dying Ahnin). Let it see the base type during that call. */
  (function guardGroundOverlay() {
    const st = window.Styles && window.Styles.byId && window.Styles.byId.watercolor;
    if (!st || !st.drawGroundOverlay || st.__contentGOGuard) return;
    st.__contentGOGuard = true;
    const o = st.drawGroundOverlay;
    const swapped = [];
    st.drawGroundOverlay = function (ctx, view, game) {
      const defs = CT.enemyTypes;
      if (game && game.enemies) {
        for (const e of game.enemies) {
          const d = defs[e.type];
          if (d && e.spawnT < 1 && !e.dying) { swapped.push(e, e.type); e.type = d.base; }
        }
      }
      try { return o.call(this, ctx, view, game); } finally {
        for (let i = 0; i < swapped.length; i += 2) swapped[i].type = swapped[i + 1];
        swapped.length = 0;
      }
    };
  })();

  /* ---------- textures (small versions of the style's) ---------- */
  let PAP, GRA, WA, GRAIN_C;
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
      const inv = 1 / (2 * ry + 1);
      const acc = new Float32Array(size);
      for (let i = -ry; i <= ry; i++) { const row = (((i % size) + size) % size) * size; for (let x = 0; x < size; x++) acc[x] += a[row + x]; }
      for (let y = 0; y < size; y++) {
        const row = y * size;
        let ya = y + ry + 1; if (ya >= size) ya -= size;
        let ys = y - ry; if (ys < 0) ys += size;
        const ra = ya * size, rs = ys * size;
        for (let x = 0; x < size; x++) { tmp[row + x] = acc[x] * inv; acc[x] += a[ra + x] - a[rs + x]; }
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
    WA = noiseTex(256, 303, [{ r: 2, w: 0.35 }, { r: 5, w: 1 }, { r: 12, w: 0.9 }]);
    GRAIN_C = U.canvas(256, 256);
    const img = GRAIN_C.ctx.createImageData(256, 256), d = img.data;
    for (let i = 0; i < 65536; i++) {
      const g = GRA[i], p = PAP[i];
      const v = 255 - Math.max(0, g - 0.46) * 190 - Math.max(0, 0.5 - p) * 60;
      d[i * 4] = v; d[i * 4 + 1] = v * 0.985; d[i * 4 + 2] = v * 0.96; d[i * 4 + 3] = 255;
    }
    GRAIN_C.ctx.putImageData(img, 0, 0);
  }

  /* ---------- brush toolkit (copied from the style) ---------- */
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
  function stroke(ctx, pts, o, r) {
    const p = o.jit && r ? jit(pts, o.jit, r) : pts;
    inkLine(ctx, spline(p, false, o.steps || 6), o);
  }
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
  let MIS = [0.45, 0.35];
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
      // wet-in-wet blobs: a blurred ellipse, approximated by a radial gradient (no per-blob filter pass → ~5× faster)
      for (const b of o.blobs) {
        const rx = b.rx, ry = b.ry === undefined ? b.rx : b.ry, bl = (b.blur === undefined ? 2 : b.blur) / Math.max(0.3, Math.min(rx, ry));
        const outer = 1 + 1.15 * bl, inner = Math.max(0, 1 - 1.15 * bl) / outer;
        const h = U.hex(b.c), cs = h[0] + ',' + h[1] + ',' + h[2];
        t.save();
        t.translate(b.x, b.y); if (b.rot) t.rotate(b.rot); t.scale(rx, ry);
        const g = t.createRadialGradient(0, 0, 0, 0, 0, outer);
        g.addColorStop(0, 'rgba(' + cs + ',1)'); g.addColorStop(inner, 'rgba(' + cs + ',1)');
        g.addColorStop(inner + (1 - inner) * 0.5, 'rgba(' + cs + ',0.5)'); g.addColorStop(1, 'rgba(' + cs + ',0)');
        t.globalAlpha = b.a === undefined ? 0.7 : b.a;
        t.fillStyle = g;
        t.fillRect(-outer, -outer, outer * 2, outer * 2);
        t.restore();
      }
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
      // rim darkening: soft double stroke instead of a blur pass
      const rA = o.rimA === undefined ? 0.6 : o.rimA, rw = o.rim === undefined ? 1.4 : o.rim, rb = o.rimBlur === undefined ? 0.55 : o.rimBlur;
      t.strokeStyle = o.edge || o.c;
      trace(t, P);
      t.globalAlpha = rA * 0.35; t.lineWidth = rw + rb * 2.2; t.stroke();
      t.globalAlpha = rA * 0.45; t.lineWidth = rw + rb * 0.8; t.stroke();
      t.globalAlpha = rA * 0.4; t.lineWidth = Math.max(0.2, rw - rb * 0.6); t.stroke();
      t.globalAlpha = 1;
    }
    if (o.salt && r) {
      t.fillStyle = 'rgba(250,250,246,0.75)';
      for (let i = 0; i < o.salt; i++) {
        const x = bb.x0 + bb.w * (0.15 + r.next() * 0.7), y = bb.y0 + bb.h * (0.1 + r.next() * 0.8);
        t.beginPath(); t.arc(x, y, 0.18 + r.next() * 0.35, 0, TAU); t.fill();
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
        stroke(ctx, [rr[0], rr[(rr.length / 2) | 0], rr[rr.length - 1]], { w: o.w, jit: o.jit === undefined ? 0.18 : o.jit, ta: 0.12, tb: 0.4, wv: 0.25, color: o.color || INK, alpha: o.alpha === undefined ? 0.7 : o.alpha }, r);
      }
    }
    ctx.restore();
  }
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
  function part(ctx, P, o, r, io) {
    wash(ctx, P, o, r);
    if (io !== false) outline(ctx, P, Object.assign({ w: 0.7, light: 0.45, pieces: 2, wv: 0.3 }, io || {}), r);
  }
  function radialSprite(px, stops) {
    const c = U.canvas(px, px);
    const g = c.ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    c.ctx.fillStyle = g;
    c.ctx.fillRect(0, 0, px, px);
    return c.c;
  }
  function starPts(cx, cy, R1, R2, n, rot) {
    const out = [];
    for (let i = 0; i < n * 2; i++) { const a = (rot || 0) - Math.PI / 2 + (i / (n * 2)) * TAU, rr = i % 2 ? R2 : R1; out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return out;
  }
  function mkSprite(wu, hu, ax, ay, k) {
    k = k || K;
    const c = document.createElement('canvas');
    c.width = Math.ceil(wu * k); c.height = Math.ceil(hu * k);
    const ctx = c.getContext('2d');
    ctx.setTransform(k, 0, 0, k, ax * k, ay * k);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    return { c, ctx, ax, ay, wu: c.width / k, hu: c.height / k, k };
  }
  /** hit-flash copy: the sprite washed over with paper-white (no pixel readback – that stalls the canvas) */
  function flashOf(src) {
    const { c, ctx } = U.canvas(src.width, src.height);
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = '#fffaec';
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function finish(s) {
    s.f = U.flipX(s.c);
    s.fl = flashOf(s.c); s.flf = U.flipX(s.fl);
    return s;
  }
  function softOf(s, blurPx) {
    const { c, ctx } = U.canvas(s.c.width, s.c.height);
    ctx.filter = 'blur(' + blurPx + 'px)';
    ctx.drawImage(s.c, 0, 0);
    ctx.filter = 'none';
    return { c, f: U.flipX(c), ax: s.ax, ay: s.ay, wu: s.wu, hu: s.hu };
  }
  /** paint-dissolve masks (noise thresholds that eat the wash away from the paper grain), shared by all types */
  let DMASK = null;
  function buildMasks(n) {
    const w = 96, h = 128, rnd = U.mulberry32(77);
    const drip = new Float32Array(w);
    let v = rnd();
    for (let x = 0; x < w; x++) { v = clamp01(v + (rnd() - 0.5) * 0.45); drip[x] = 0.1 + v * 0.9 * (rnd() < 0.12 ? 1.7 : 1); }
    DMASK = [];
    for (let f = 0; f < n; f++) {
      const t = (f + 1) / (n + 1);
      const { c, ctx } = U.canvas(w, h);
      const img = ctx.createImageData(w, h), d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nv = WA[(((y * 2) & 255) << 8) | ((x * 2) & 255)] * 0.75 + PAP[((y & 255) << 8) | (x & 255)] * 0.25;
          const keep = (nv + 0.12 - t * 1.05 - drip[x] * t * (y / h) * 0.25) * 7;
          d[(y * w + x) * 4 + 3] = keep <= 0 ? 0 : Math.min(1, keep) * 255 * (1 - t * 0.3);
        }
      }
      ctx.putImageData(img, 0, 0);
      DMASK.push({ c, t });
    }
  }
  function dissolveFrames(s) {
    if (!DMASK) buildMasks(4);
    const w = s.c.width, h = s.c.height;
    return DMASK.map((m) => {
      const { c, ctx } = U.canvas(w, h);
      ctx.drawImage(s.c, 0, Math.round(m.t * h * 0.05));
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(m.c, 0, 0, w, h);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = m.t * 0.4; ctx.fillStyle = '#f5eede'; ctx.fillRect(0, 0, w, h);
      return { c, f: U.flipX(c), ax: s.ax, ay: s.ay, wu: s.wu, hu: s.hu };
    });
  }
  function blit(ctx, s, x, y, flip, sc, img, sx, sy) {
    sc = sc || 1;
    const kx = sc * (sx || 1), ky = sc * (sy || 1);
    const ax = flip ? s.wu - s.ax : s.ax;
    ctx.drawImage(img || (flip ? s.f : s.c), x - ax * kx, y - s.ay * ky, s.wu * kx, s.hu * ky);
  }

  /* ---------- shared pieces ---------- */
  const ROOT = '#4a3020';
  function rootLegs(ctx, r, ph, hx0, hx1, hipY, len, w, col) {
    const sw = Math.sin(ph), cw = Math.cos(ph);
    const lift = (v) => Math.max(0, v) * 1.4 * len / 5;
    for (const [hx, dir, li] of [[hx0, -1, lift(cw)], [hx1, 1, lift(-cw)]]) {
      const fx = hx + dir * (2.0 * sw * len / 5 + 0.4);
      const fy = -0.4 - li;
      stroke(ctx, [[hx, hipY], [hx + (fx - hx) * 0.4 - 0.3, hipY + (fy - hipY) * 0.55 - li * 0.4], [fx, fy]], { w: w || 1.2, jit: 0.12, ta: 0.05, tb: 0.35, wv: 0.2, color: col || ROOT }, r);
      stroke(ctx, [[fx, fy], [fx + 1.2, fy + 0.25]], { w: 0.42, jit: 0.05, ta: 0, tb: 0.6, wv: 0, color: col || ROOT }, r);
      stroke(ctx, [[fx, fy], [fx - 0.9, fy + 0.35]], { w: 0.38, jit: 0.05, ta: 0, tb: 0.6, wv: 0, color: col || ROOT }, r);
    }
  }
  function leaf(ctx, r, pts, wm, pal) {
    const P0 = jit(pts, 0.18, r);
    const LP = ribbon(P0, leafW(wm));
    const lb = bbox(LP);
    wash(ctx, LP, {
      c: pal[0],
      blobs: [{ x: P0[0][0], y: P0[0][1] - 1, rx: 1.6, ry: 1.6, c: pal[1], a: 0.7, blur: 0.8 }, { x: P0[2][0], y: P0[2][1], rx: 1.6, ry: 1.6, c: pal[2], a: 0.6, blur: 0.9 }],
      hi: 0.1, rim: 0.7, edge: pal[3], gran: 0.45,
    }, r);
    outline(ctx, LP, { w: 0.5, light: 0.4, cx: lb.cx, cy: lb.cy, pieces: 2 }, r);
    stroke(ctx, P0, { w: 0.3, jit: 0.05, ta: 0.05, tb: 0.5, wv: 0.1, alpha: 0.8 }, r);
  }
  const LEAF = ['#6c8a38', '#a7bd68', '#46602a', '#3a4e1c'];
  const LEAF_TOX = ['#86ad34', '#d2ea7a', '#4f7a1e', '#34501a'];
  const EYE_FIRE = {};
  const EYE_TOX = { c: '#c8f060', core: '#f8ffd8', edge: '#4a8a1c' };
  const EYE_RED = { c: '#ff6a3a', core: '#ffe6c8', edge: '#a01010' };
  const eyeShape = (cx, cy, s) => [[cx - 1.25 * s, cy + 0.25], [cx - 0.1, cy - 0.85 * s], [cx + 1.25 * s, cy - 0.15], [cx + 0.1, cy + 0.75 * s]];

  /* ===== Rüben-Spucker ===== */
  function drawSpitter(ctx, pose, r) {
    const c = pose.c || 0, ph = pose.ph;
    const sw = c ? 0 : Math.sin(ph), cw = Math.cos(ph);
    rootLegs(ctx, r, c ? 0 : ph, -2.4, 2.6, -5.6, 5, 1.25);
    stroke(ctx, [[0.4, -4.4], [-0.9, -2.6], [-3.2, -2.2], [-4.4, -2.9]], { w: 0.65, jit: 0.15, ta: 0.05, tb: 0.6, color: ROOT }, r);
    ctx.save();
    ctx.translate(0, -4.5);
    ctx.rotate(sw * 0.075);
    ctx.scale(1 + 0.15 * c, (1 - Math.max(0, -cw) * 0.035 * (c ? 0 : 1)) * (1 + 0.06 * c));
    ctx.translate(0, 4.5);
    // back arm
    stroke(ctx, [[-6.4, -12], [-8.6, -10.6 - c * 1.2], [-9.4, -8.6 - c * 2]], { w: 0.75, jit: 0.1, ta: 0.05, tb: 0.5, color: ROOT }, r);
    const body = [[0, -22.2], [5.8, -21.0], [9.0, -15.4], [8.0, -9.2], [4.4, -5.5], [0.6, -3.9], [-3.6, -5.5], [-7.8, -9.0], [-9.0, -15.2], [-5.8, -21.0]];
    const BP = spline(jit(body, 0.28, r), true, 6);
    wash(ctx, BP, {
      c: '#e2e0ae',
      blobs: [
        { x: 0, y: -20.4, rx: 10.8, ry: 5.8, c: '#5e3f70', a: 0.95, blur: 2.0 },
        { x: -3.6, y: -19.2, rx: 2.2, ry: 1.6, c: '#8fb43a', a: 0.9, blur: 0.7 },
        { x: 2.4, y: -21.0, rx: 1.5, ry: 1.1, c: '#b6d050', a: 0.9, blur: 0.6 },
        { x: 5.8, y: -17.4, rx: 1.4, ry: 1.3, c: '#7d9a3a', a: 0.85, blur: 0.6 },
        { x: -6.6, y: -15.6, rx: 1.2, ry: 1.0, c: '#9cbc48', a: 0.8, blur: 0.6 },
        { x: -2.2, y: -8.6, rx: 6, ry: 3, c: '#c4d27e', a: 0.65, blur: 1.6 },
        { x: 6.6, y: -10.6, rx: 2.6, ry: 4.6, c: '#93a462', a: 0.45, blur: 1.6 },
      ],
      hi: 0.32, rim: 1.2, edge: '#4a4a2a', rimA: 0.5, gran: 0.5,
    }, r);
    stroke(ctx, [[-5.8, -9.8], [-3.0, -8.7], [-0.4, -8.9]], { w: 0.34, jit: 0.12, ta: 0.25, tb: 0.4, alpha: 0.55, color: '#5a5a2a' }, r);
    stroke(ctx, [[-4.6, -6.6], [-6.0, -5.4]], { w: 0.25, jit: 0.1, ta: 0, tb: 0.6, wv: 0, alpha: 0.7 }, r);
    outline(ctx, BP, { w: 0.95, light: 0.55, cx: 0, cy: -13.5, pieces: 3 }, r);
    // spiky toxic crest
    const sway = pose.sway || 0;
    const spread = c * 1.4;
    leaf(ctx, r, [[-0.8, -21.8], [-4.4 - spread, -26], [-7.0 + sway * 0.6 - spread, -29.6]], 2.6, LEAF_TOX);
    leaf(ctx, r, [[1.0, -21.8], [4.4 + spread, -25.6], [7.0 + sway * 0.8 + spread, -28.0]], 2.4, LEAF_TOX);
    leaf(ctx, r, [[0.2, -22.4], [0.2, -27.6], [1.4 + sway, -32.0]], 2.9, LEAF_TOX);
    // toxic glowing eyes + brows
    glowShape(ctx, jit(eyeShape(1.4, -16.2, 1), 0.06, r), r, Object.assign({ smooth: true, w: 0.4 }, EYE_TOX));
    glowShape(ctx, jit(eyeShape(5.0, -16.0, 0.82), 0.06, r), r, Object.assign({ smooth: true, w: 0.36 }, EYE_TOX));
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(1.7, -16.2, 0.42, 0, TAU); ctx.arc(5.15, -16.05, 0.36, 0, TAU); ctx.fill();
    stroke(ctx, [[-0.7, -18.6], [0.9, -18.2], [2.5, -17.3]], { w: 0.95, jit: 0.08, ta: 0.15, tb: 0.35, wv: 0.1 }, r);
    stroke(ctx, [[6.8, -18.4], [5.6, -18.0], [4.2, -17.2]], { w: 0.85, jit: 0.08, ta: 0.15, tb: 0.35, wv: 0.1 }, r);
    // the snout: a puckered tube like a little cannon
    const ty = -11.2;
    const TP = ribbon(jit([[4.6, ty + 0.3], [8.6, ty], [12.2, ty - 0.4 - c * 0.6]], 0.08, r), (u) => 4.1 + u * 1.4 + c * 0.8);
    wash(ctx, TP, { c: '#c8cf88', blobs: [{ x: 8, y: ty - 1.6, rx: 3.5, ry: 0.9, c: '#f0f2c8', a: 0.75, blur: 0.6 }, { x: 9, y: ty + 2, rx: 4, ry: 1, c: '#7e8a40', a: 0.65, blur: 0.8 }], hi: 0.1, rim: 0.8, edge: '#4e5a22', gran: 0.45 }, r);
    for (const px of [7.4, 9.8]) stroke(ctx, [[px, ty - 2.3], [px + 0.5, ty], [px, ty + 2.3]], { w: 0.28, jit: 0.06, ta: 0.2, tb: 0.3, alpha: 0.55, color: '#4a5222' }, r);
    outline(ctx, TP, { w: 0.65, light: 0.4, pieces: 2 }, r);
    const lx = 12.4, ly = ty - 0.5 - c * 0.6;
    const LP = spline(jit(blobPts(lx, ly, 1.6 + c * 0.3, 3.3 + c * 0.4, 0.08, r, 10), 0.06, r), true, 4);
    wash(ctx, LP, { c: '#93ab4a', blobs: [{ x: lx - 0.4, y: ly - 1.4, rx: 0.8, ry: 1.2, c: '#cfe08a', a: 0.7, blur: 0.4 }], hi: 0, rim: 0.7, edge: '#3a5418', gran: 0.4 }, r);
    outline(ctx, LP, { w: 0.55, pieces: 2 }, r);
    const HP = jit(blobPts(lx + 0.35, ly, 0.9 + c * 0.2, 2.1 + c * 0.3, 0.05, r, 8), 0.04, r);
    if (c > 0) glowShape(ctx, HP, r, { smooth: true, c: '#b6f04a', core: '#fbffe0', edge: '#3f8a1c', w: 0.3, rim: 0.6 });
    else {
      ctx.fillStyle = '#1c2410'; trace(ctx, spline(HP, true, 3)); ctx.fill();
      ctx.fillStyle = 'rgba(150,220,70,0.7)'; ctx.beginPath(); ctx.ellipse(lx + 0.6, ly + 0.8, 0.35, 0.7, 0, 0, TAU); ctx.fill();
    }
    // green drool
    const DP = spline(jit([[lx - 0.6, ly + 3.0], [lx - 0.2, ly + 5.0], [lx - 0.6, ly + 6.4], [lx + 0.3, ly + 7.0], [lx + 0.8, ly + 6.2], [lx + 0.4, ly + 4.6], [lx + 0.5, ly + 3.0]], 0.05, r), true, 3);
    wash(ctx, DP, { c: '#8fd43a', blobs: [{ x: lx, y: ly + 6.4, rx: 0.5, ry: 0.4, c: '#efffc0', a: 0.9, blur: 0.2 }], hi: 0, rim: 0.4, edge: '#3a7a18', gran: 0.2, dx: 0, dy: 0 }, r);
    // front arm (clutching the tube)
    stroke(ctx, [[5.6, -9.4], [7.6, -7.8 - c], [8.8, -8.8 - c]], { w: 0.8, jit: 0.1, ta: 0.05, tb: 0.5, color: ROOT }, r);
    ctx.restore();
  }
  const spitMouth = (c) => [(12.75) * (1 + 0.15 * c), -4.5 + (-11.7 - c * 0.6 + 4.5) * (1 + 0.06 * c)];

  /* ===== Zündrübe ===== */
  function drawBomber(ctx, pose, r) {
    const ph = pose.ph, bob = -Math.abs(Math.cos(ph)) * 0.7;
    rootLegs(ctx, r, ph, -2.0, 2.2, -4.4, 4, 1.05, '#5a1424');
    ctx.save(); ctx.translate(0, bob);
    stroke(ctx, [[-0.2, -3.6], [-1.6, -2.4], [-3.4, -2.6], [-4.2, -3.6]], { w: 0.55, jit: 0.1, ta: 0.05, tb: 0.6, color: '#5a1424' }, r);
    // leaves on red stems
    const sway = pose.sway || 0;
    for (const [pts, wm] of [[[[-0.6, -15.4], [-3.4, -18.4], [-5.4 + sway * 0.5, -20.6]], 2.4], [[[0.4, -15.6], [2.6, -18.8], [3.4 + sway * 0.6, -21.4]], 2.2]]) {
      stroke(ctx, [pts[0], pts[1]], { w: 0.45, jit: 0.05, ta: 0, tb: 0.2, wv: 0, color: '#a02a40' }, r);
      leaf(ctx, r, pts, wm, ['#4f7a30', '#86a858', '#2f4a1c', '#2a3a14']);
      stroke(ctx, [pts[0], pts[1], pts[2]], { w: 0.28, ta: 0.05, tb: 0.5, wv: 0, color: '#b02e48', alpha: 0.85 }, r);
    }
    // fuse: twisted string
    const fuse = [[0.3, -15.6], [-0.6, -17.6], [0.9, -19.4], [2.6, -20.2]];
    stroke(ctx, fuse, { w: 0.7, jit: 0.05, ta: 0.05, tb: 0.05, wv: 0.4, color: '#4a3020' }, r);
    stroke(ctx, fuse, { w: 0.22, ta: 0.1, tb: 0.1, wv: 0, color: '#c9a275', alpha: 0.8 }, r);
    // round beet body
    const body = [[0, -16.0], [4.6, -14.8], [6.7, -10.6], [6.1, -6.2], [3.2, -3.7], [0.3, -3.1], [-3.0, -3.8], [-6.0, -6.3], [-6.7, -10.8], [-4.6, -14.8]];
    const BP = spline(jit(body, 0.2, r), true, 6);
    wash(ctx, BP, {
      c: '#b02e48',
      blobs: [
        { x: 0, y: -15.6, rx: 4.6, ry: 1.9, c: '#e8862f', a: 0.92, blur: 0.9 },
        { x: -2.8, y: -12.2, rx: 2.4, ry: 2.6, c: '#e2707e', a: 0.7, blur: 1.2 },
        { x: 3.4, y: -6.0, rx: 4.2, ry: 3.0, c: '#5e1428', a: 0.65, blur: 1.5 },
        { x: -4.4, y: -6.8, rx: 1.6, ry: 1.8, c: '#8a1f38', a: 0.5, blur: 1 },
      ],
      hi: 0.3, rim: 1.1, edge: '#4a0f1e', rimA: 0.6, gran: 0.5,
    }, r);
    stroke(ctx, [[-4.8, -12.6], [-5.6, -9.6], [-4.4, -6.8]], { w: 0.32, jit: 0.08, ta: 0.3, tb: 0.3, wv: 0, color: '#ffd0d8', alpha: 0.5 }, r);
    stroke(ctx, [[-3.2, -12.4], [-3.8, -9.8], [-2.8, -7.6]], { w: 0.26, jit: 0.08, ta: 0.3, tb: 0.3, wv: 0, color: '#ffd0d8', alpha: 0.4 }, r);
    outline(ctx, BP, { w: 0.85, light: 0.55, cx: 0, cy: -9.6, pieces: 3 }, r);
    // mean little eyes, one heavy brow, gritted grin
    glowShape(ctx, jit([[0.0, -9.9], [2.0, -10.9], [2.2, -9.6]], 0.05, r), r, { w: 0.3, rim: 0.6 });
    glowShape(ctx, jit([[3.6, -10.9], [5.4, -10.0], [3.5, -9.6]], 0.05, r), r, { w: 0.3, rim: 0.6 });
    stroke(ctx, [[-0.6, -12.3], [2.9, -10.6], [6.0, -12.1]], { w: 1.05, jit: 0.06, ta: 0.15, tb: 0.15, wv: 0.1 }, r);
    const MP = jit([[0.6, -7.6], [5.0, -7.9], [4.6, -6.5], [1.0, -6.4]], 0.05, r);
    ctx.fillStyle = '#2a0a12'; trace(ctx, MP); ctx.fill();
    for (const tx of [1.7, 2.8, 3.9]) { ctx.fillStyle = '#f3e6c8'; ctx.fillRect(tx - 0.32, -7.75, 0.6, 0.75); }
    inkLine(ctx, [[0.4, -7.7], [2.8, -7.9], [5.1, -7.95]], { w: 0.35, ta: 0.1, tb: 0.1, wv: 0 });
    ctx.restore();
  }
  const BOMB_TIP = [2.8, -20.3];

  /* ===== Wurzel-Bock ===== */
  function hornPts(a0, R0, turn) {
    const pts = [], N = 22;
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = a0 - t * turn, rr = R0 * (1 - 0.6 * t);
      pts.push([Math.cos(a) * rr - Math.cos(a0) * R0, Math.sin(a) * rr - Math.sin(a0) * R0]);
    }
    return pts;
  }
  function drawHorn(ctx, r, bx, by, dark, tilt) {
    const H = hornPts(-0.25, 4.9, 5.1).map((p) => {
      const c = Math.cos(tilt), s = Math.sin(tilt);
      return [bx + p[0] * c - p[1] * s, by + p[0] * s + p[1] * c];
    });
    // ribbon along the spiral (tapering)
    const n = H.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = H[i > 0 ? i - 1 : 0], b = H[i < n - 1 ? i + 1 : n - 1];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = hyp(tx, ty) || 1; tx /= l; ty /= l;
      const w = (3.1 * (1 - 0.68 * (i / (n - 1)))) * 0.5;
      L.push([H[i][0] - ty * w, H[i][1] + tx * w]); R.push([H[i][0] + ty * w, H[i][1] - tx * w]);
    }
    const P = L.concat(R.reverse());
    wash(ctx, P, { c: dark ? '#5f3b2a' : '#7a4e34', blobs: [{ x: bx - 2.4, y: by - 4.2, rx: 2.4, ry: 1.4, c: dark ? '#7e5640' : '#b78058', a: 0.7, blur: 0.8 }, { x: bx - 3.6, y: by + 1.6, rx: 2, ry: 1.6, c: '#3a2216', a: 0.55, blur: 0.8 }], hi: 0.15, rim: 0.8, edge: '#2a160c', gran: 0.6 }, r);
    for (let i = 2; i < n - 2; i += 2) stroke(ctx, [L[i], R[R.length - 1 - i]], { w: 0.22, ta: 0.2, tb: 0.2, wv: 0, color: '#2a160c', alpha: 0.6 }, r);
    outline(ctx, P, { w: 0.6, light: 0.45, pieces: 2 }, r);
  }
  /** mode 'chase' | 'tele' | 'dash' | 'rest' */
  function drawCharger(ctx, pose, r) {
    const ph = pose.ph, mode = pose.mode;
    const sw = Math.sin(ph), cw = Math.cos(ph);
    let tilt = 0, bob = -Math.abs(cw) * 0.8, lf = sw * 2.2, lb = -sw * 2.2, liftF = Math.max(0, cw) * 1.2, liftB = Math.max(0, -cw) * 1.2;
    if (mode === 'tele') { tilt = -0.17; bob = -1.0; lf = 2.6 + sw * 1.6; liftF = 3.0 + Math.max(0, sw) * 1.4; lb = -1.0; liftB = 0; }
    else if (mode === 'dash') { tilt = 0.14; bob = 0.5; lf = 4.2; liftF = 1.6; lb = -4.4; liftB = 1.4; }
    else if (mode === 'rest') { tilt = 0.06 * sw; bob = 0.4; lf = 0.6; lb = -0.6; liftF = liftB = 0; }
    const cy = -10.2 + bob;
    const rot = (px, py) => [px * Math.cos(tilt) - (py - -12) * Math.sin(tilt), cy + px * Math.sin(tilt) + (py - -12) * Math.cos(tilt)];
    const leg = (hx, hy, dx, li, dark) => {
      const top = rot(hx, hy), fx = top[0] + dx, fy = -0.6 - li;
      const LP = ribbon(jit([top, [top[0] + dx * 0.5, (top[1] + fy) / 2 - li * 0.3], [fx, fy]], 0.15, r), taperW(2.5, 1.7));
      part(ctx, LP, { c: dark ? '#5f3b2a' : '#7a4e34', blobs: [{ x: fx - 0.4, y: fy - 2, rx: 0.8, ry: 1.6, c: '#a5764e', a: 0.6, blur: 0.6 }], hi: 0.1, rim: 0.7, edge: '#3a2216', gran: 0.55 }, r, { w: 0.55 });
      stroke(ctx, [[fx - 1.2, fy + 0.1], [fx + 1.6, fy]], { w: 0.75, ta: 0.05, tb: 0.1, wv: 0, color: '#2a160c' }, r);
    };
    // far legs
    leg(5.4, -7.4, lf * 0.8 - 0.8, liftF * 0.8, true);
    leg(-6.4, -9, lb * 0.8 - 0.8, liftB * 0.8, true);
    // root tail
    const t0 = rot(-14.2, -13.6);
    stroke(ctx, [t0, [t0[0] - 2.4, t0[1] - 1.6], [t0[0] - 3.0, t0[1] - 4.0], [t0[0] - 1.8, t0[1] - 5.0]], { w: 0.9, jit: 0.1, ta: 0.05, tb: 0.6, color: ROOT }, r);
    // leaf tuft on the shoulders
    const tf = rot(-1.6, -18.2);
    leaf(ctx, r, [[tf[0] - 0.4, tf[1] + 0.6], [tf[0] - 3.4, tf[1] - 3.2], [tf[0] - 5.6, tf[1] - 5.4]], 2.4, LEAF);
    leaf(ctx, r, [[tf[0] + 0.4, tf[1] + 0.6], [tf[0] + 0.2, tf[1] - 4.0], [tf[0] + 1.4, tf[1] - 7.0]], 2.6, LEAF);
    // back horn
    const hb = rot(2.6, -17.4);
    drawHorn(ctx, r, hb[0], hb[1], true, tilt);
    // body: a gnarled parsnip lying on its belly, thick end = lowered head
    const body = [[-14.6, -13.8], [-9.2, -17.4], [-2.4, -18.8], [4.0, -18.0], [9.0, -15.6], [11.9, -11.6], [11.5, -7.8], [8.2, -5.9], [3.0, -6.4], [-3.0, -7.4], [-8.6, -9.8]].map((p) => rot(p[0], p[1]));
    const BP = spline(jit(body, 0.22, r), true, 6);
    const b0 = rot(0, -12);
    wash(ctx, BP, {
      c: '#e6d2a0',
      blobs: [
        { x: b0[0] - 3, y: b0[1] - 5, rx: 7, ry: 2, c: '#f6ead0', a: 0.6, blur: 1.2 },
        { x: b0[0] + 1, y: b0[1] + 4.2, rx: 10, ry: 2.6, c: '#c99545', a: 0.6, blur: 1.5 },
        { x: b0[0] - 6, y: b0[1] + 3, rx: 6, ry: 2, c: '#8a5a3a', a: 0.4, blur: 1.4 },
        { x: b0[0] + 9.6, y: b0[1] + 2, rx: 2.4, ry: 3, c: '#b88a5a', a: 0.45, blur: 1.2 },
      ],
      hi: 0.3, rim: 1.2, edge: '#5a3a22', rimA: 0.55, gran: 0.55,
    }, r);
    hatch(ctx, BP, { ang: -0.9, sp: 1.2, w: 0.3, alpha: 0.45, region: (x, y) => (y - b0[1]) - 3.2 }, r);
    for (const [px, y0, y1] of [[-10.5, -16.4, -12.6], [-6.8, -17.6, -14.4], [-3, -18.2, -15.6], [-3.6, -8.6, -10.6], [0.2, -7.4, -9.8]]) {
      const a = rot(px, y0), b = rot(px + 0.6, (y0 + y1) / 2), c2 = rot(px, y1);
      stroke(ctx, [a, b, c2], { w: 0.3, jit: 0.1, ta: 0.25, tb: 0.35, alpha: 0.6, color: '#6a4a2a' }, r);
    }
    outline(ctx, BP, { w: 0.95, light: 0.55, cx: b0[0], cy: b0[1], pieces: 3 }, r);
    // face on the lowered head
    const e1 = rot(7.0, -12.8), e2 = rot(10.2, -12.6);
    if (mode === 'rest') {
      for (const e of [e1, e2]) {
        ctx.fillStyle = '#fbf3e0'; ctx.beginPath(); ctx.arc(e[0], e[1], 1.15, 0, TAU); ctx.fill();
        const S = [];
        for (let i = 0; i <= 22; i++) { const a = i * 0.6, rr = 0.1 + i * 0.045; S.push([e[0] + Math.cos(a) * rr, e[1] + Math.sin(a) * rr]); }
        inkLine(ctx, S, { w: 0.28, ta: 0.1, tb: 0.1, wv: 0 });
      }
    } else {
      const ec = mode === 'chase' ? EYE_FIRE : EYE_RED;
      glowShape(ctx, jit(eyeShape(e1[0], e1[1], 0.9), 0.05, r), r, Object.assign({ smooth: true, w: 0.36 }, ec));
      glowShape(ctx, jit(eyeShape(e2[0], e2[1], 0.75), 0.05, r), r, Object.assign({ smooth: true, w: 0.32 }, ec));
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(e1[0] + 0.3, e1[1], 0.36, 0, TAU); ctx.arc(e2[0] + 0.2, e2[1], 0.3, 0, TAU); ctx.fill();
    }
    const br = [rot(5.0, -15.4), rot(8.4, -14.0), rot(11.6, -15.2)];
    stroke(ctx, br, { w: 1.15, jit: 0.06, ta: 0.15, tb: 0.15, wv: 0.1 }, r);
    for (const n of [rot(11.0, -9.4), rot(9.9, -9.0)]) { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(n[0], n[1], 0.32, 0.5, 0.3, 0, TAU); ctx.fill(); }
    inkLine(ctx, jit([rot(6.6, -7.8), rot(7.8, -8.3), rot(8.8, -7.7), rot(10.0, -8.2)], 0.05, r), { w: 0.45, ta: 0.15, tb: 0.2, wv: 0.1 });
    // near legs
    leg(6.6, -7.2, lf, liftF, false);
    leg(-5.4, -8.6, lb, liftB, false);
    // front horn
    const hf = rot(4.2, -17.0);
    drawHorn(ctx, r, hf[0], hf[1], false, tilt);
    pose.eye = [(e1[0] + e2[0]) / 2, (e1[1] + e2[1]) / 2];
    pose.top = rot(2, -22);
  }

  /* ===== Rüben-Ahnin ===== */
  function drawMother(ctx, pose, r) {
    const ph = pose.ph, sw = Math.sin(ph), cw = Math.cos(ph);
    const by = 1.0 * Math.abs(sw);
    const cy = -21 + by;
    // feet (umber stumps + dark boots)
    for (const [hx, dir, li] of [[-5, -1, Math.max(0, cw) * 1.4], [5, 1, Math.max(0, -cw) * 1.4]]) {
      const fx = hx + dir * sw * 1.6, fy = -0.6 - li;
      const LP = ribbon(jit([[hx, -9 + by], [hx + (fx - hx) * 0.5, -4.6 - li * 0.5], [fx, fy - 0.6]], 0.15, r), taperW(3.6, 3.0));
      part(ctx, LP, { c: '#d8c08a', blobs: [{ x: fx + 1, y: fy - 3, rx: 1, ry: 2, c: '#a88a5a', a: 0.6, blur: 0.8 }], hi: 0.15, rim: 0.7, edge: '#6a4a2a', gran: 0.5 }, r, { w: 0.6 });
      const BP = spline(blobPts(fx + 0.9, fy - 0.3, 2.6, 1.3, 0.1, r, 8), true, 4);
      part(ctx, BP, { c: '#3b2a24', blobs: [{ x: fx, y: fy - 0.8, rx: 1.2, ry: 0.5, c: '#6b5040', a: 0.7, blur: 0.5 }], hi: 0.1, rim: 0.5, gran: 0.3 }, r, { w: 0.5 });
    }
    // back arm
    const BA = ribbon(jit([[-11, cy + 1], [-14.2, cy + 5], [-14.4 - sw, cy + 9]], 0.2, r), taperW(3, 2.2));
    part(ctx, BA, { c: '#cdb27a', blobs: [{ x: -13.5, y: cy + 6, rx: 1.2, ry: 2, c: '#a88a5a', a: 0.6, blur: 0.8 }], hi: 0.1, rim: 0.7, edge: '#6a4a2a', gran: 0.5 }, r, { w: 0.55 });
    // body
    const n = 16, bp = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const kk = 1 + 0.04 * Math.sin(3 * a + 1) + (r.next() - 0.5) * 0.05;
      let y = Math.sin(a) * 14.4 * kk;
      if (y > 11.5) y = 11.5 + (y - 11.5) * 0.5;
      bp.push([Math.cos(a) * 13.2 * kk, cy + y]);
    }
    const BP = spline(bp, true, 5);
    wash(ctx, BP, {
      c: '#e8d29a',
      blobs: [
        { x: 0, y: cy - 10, rx: 16, ry: 7.6, c: '#6b4a7d', a: 0.95, blur: 2.4 },
        { x: -5, y: cy - 9.6, rx: 4, ry: 2.4, c: '#9a7aa8', a: 0.5, blur: 1.6 },
        { x: 2, y: cy + 10, rx: 10, ry: 4, c: '#c99545', a: 0.6, blur: 2 },
        { x: 9, y: cy + 3, rx: 5, ry: 8, c: '#8a6a50', a: 0.4, blur: 2 },
      ],
      hi: 0.3, rim: 1.6, edge: '#3d2230', rimA: 0.6, gran: 0.6,
    }, r);
    hatch(ctx, BP, { ang: -1.0, sp: 1.25, w: 0.34, alpha: 0.5, region: (x, y) => (x * 0.55 + (y - cy) * 0.83) - 7 }, r);
    for (const yy of [6.6, 8.6]) stroke(ctx, [[-7, cy + yy], [0, cy + yy + 1.2], [7, cy + yy]], { w: 0.3, jit: 0.15, ta: 0.25, tb: 0.35, alpha: 0.5, color: '#6a4a3a' }, r);
    outline(ctx, BP, { w: 1.2, light: 0.55, cx: 0, cy, pieces: 3 }, r);
    // knitted ochre shawl over the lower body
    const SH = ribbon(jit([[-13.2, cy + 2.6], [-6, cy + 6.4], [0, cy + 7.2], [6, cy + 6.4], [13.2, cy + 2.6]], 0.15, r), (u) => 3.4 + Math.sin(u * Math.PI) * 1.4, 5);
    wash(ctx, SH, { c: '#d4a03c', blobs: [{ x: -4, y: cy + 5, rx: 6, ry: 1.2, c: '#f0c870', a: 0.7, blur: 0.9 }, { x: 8, y: cy + 6, rx: 5, ry: 1.6, c: '#9a6a1c', a: 0.6, blur: 1 }], hi: 0.1, rim: 0.8, edge: '#7a4a10', gran: 0.6 }, r);
    for (let i = -5; i <= 5; i++) {
      const x = i * 2.2, y = cy + 6.4 - Math.abs(i) * 0.32;
      stroke(ctx, [[x - 0.6, y - 0.6], [x, y + 0.2], [x + 0.6, y - 0.6]], { w: 0.22, ta: 0.1, tb: 0.1, wv: 0, color: '#6a4010', alpha: 0.6 }, r);
    }
    outline(ctx, SH, { w: 0.6, pieces: 2 }, r);
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) stroke(ctx, [[sd * (12.4 - i * 0.7), cy + 4 + i * 0.4], [sd * (12.8 - i * 0.7), cy + 6.6 + i * 0.4]], { w: 0.3, ta: 0, tb: 0.5, wv: 0, color: '#7a4a10', alpha: 0.8 }, r);
    // face: half-lidded glowing eyes behind round spectacles, stern mouth
    const fx = 6.4, ey = cy - 2.2;
    for (const [ex, s] of [[fx - 2.7, 1], [fx + 2.6, 0.9]]) {
      glowShape(ctx, jit([[ex - 1.4 * s, ey + 0.1], [ex + 1.4 * s, ey + 0.1], [ex + 0.9 * s, ey + 0.9], [ex - 0.9 * s, ey + 0.9]], 0.04, r), r, { w: 0.3, rim: 0.6 });
      inkLine(ctx, [[ex - 1.7 * s, ey + 0.05], [ex, ey - 0.35], [ex + 1.7 * s, ey + 0.05]], { w: 0.45, ta: 0.1, tb: 0.1, wv: 0 });
      ctx.lineWidth = 0.42; ctx.strokeStyle = '#7a5a1a';
      ctx.beginPath(); ctx.arc(ex, ey + 0.4, 2.2 * s, 0, TAU); ctx.stroke();
      ctx.lineWidth = 0.22; ctx.strokeStyle = 'rgba(255,240,190,0.85)';
      ctx.beginPath(); ctx.arc(ex, ey + 0.4, 2.2 * s, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
    }
    inkLine(ctx, [[fx - 0.5, ey], [fx + 0.1, ey - 0.5], [fx + 0.4, ey]], { w: 0.35, ta: 0.1, tb: 0.1, wv: 0, color: '#5a3a10' });
    for (const d of [-0.7, 0.4]) stroke(ctx, [[fx + 5.2, ey + d], [fx + 6.3, ey + d * 1.8]], { w: 0.22, ta: 0, tb: 0.5, wv: 0, alpha: 0.6 }, r);
    stroke(ctx, [[fx - 1.6, ey + 5.2], [fx, ey + 4.6], [fx + 1.6, ey + 5.2]], { w: 0.5, jit: 0.05, ta: 0.15, tb: 0.15, wv: 0.1 }, r);
    // red polka-dot headscarf band with a knot
    const SC = ribbon(jit([[-12.2, cy - 3.6], [-9.4, cy - 10.6], [-3.4, cy - 14.4], [3.6, cy - 14.4], [9.6, cy - 10.6], [12.6, cy - 4.6]], 0.15, r), () => 3.4, 5);
    wash(ctx, SC, { c: '#b4432f', blobs: [{ x: -2, y: cy - 14, rx: 6, ry: 1.2, c: '#dc7650', a: 0.7, blur: 0.8 }, { x: 10, y: cy - 7, rx: 2.4, ry: 3, c: '#7c2318', a: 0.6, blur: 0.8 }], hi: 0.15, rim: 0.8, edge: '#6e1f15', gran: 0.45 }, r);
    ctx.fillStyle = '#f6ead0';
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.08 + (i / 8) * 0.84), rx = 11.6, ry = 11.2; ctx.beginPath(); ctx.arc(Math.cos(a) * rx * 1.02, cy - 2.6 + Math.sin(a) * ry, 0.45, 0, TAU); ctx.fill(); }
    outline(ctx, SC, { w: 0.6, pieces: 2 }, r);
    for (const [pts, wm] of [[[[12.4, cy - 4.4], [15.4, cy - 3.4], [16.6, cy - 1.0]], 2.4], [[[12.6, cy - 4.8], [15.6, cy - 6.8], [17.2, cy - 6.0]], 2.2]]) {
      const KP = ribbon(jit(pts, 0.1, r), leafW(wm));
      part(ctx, KP, { c: '#b4432f', blobs: [{ x: pts[1][0], y: pts[1][1], rx: 1, ry: 0.8, c: '#dc7650', a: 0.6, blur: 0.5 }], hi: 0.1, rim: 0.6, edge: '#6e1f15', gran: 0.4 }, r, { w: 0.45 });
    }
    // crown of baby turnips
    for (const [bx, byy, cap, s] of [[-5.6, cy - 14.4, '#a77ab5', 0.9], [5.8, cy - 14.0, '#b4729a', 0.9], [0.2, cy - 16.0, '#8b3d6d', 1]]) {
      const yb = byy + Math.sin(ph * 2 + bx) * 0.3;
      leaf(ctx, r, [[bx, yb - 3.8 * s], [bx + 0.6, yb - 6 * s], [bx + 1.8, yb - 7.6 * s]], 1.6 * s, LEAF);
      const PB = spline(jit([[bx, yb - 4.4 * s], [bx + 2.8 * s, yb - 3.4 * s], [bx + 3 * s, yb - 0.6 * s], [bx + 0.3, yb + 1.4 * s], [bx - 2.6 * s, yb - 0.6 * s], [bx - 2.8 * s, yb - 3.4 * s]], 0.08, r), true, 4);
      wash(ctx, PB, { c: '#f1e4bf', blobs: [{ x: bx, y: yb - 3.8 * s, rx: 3.6 * s, ry: 1.6 * s, c: cap, a: 0.95, blur: 0.7 }], hi: 0.2, rim: 0.6, edge: '#5a3a52', gran: 0.4 }, r);
      outline(ctx, PB, { w: 0.42, pieces: 2 }, r);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(bx + 0.4, yb - 1.4 * s, 0.32, 0, TAU); ctx.arc(bx + 1.8, yb - 1.4 * s, 0.32, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(220,110,120,0.6)'; ctx.beginPath(); ctx.arc(bx - 0.4, yb - 0.6 * s, 0.45, 0, TAU); ctx.arc(bx + 2.6, yb - 0.6 * s, 0.45, 0, TAU); ctx.fill();
    }
    // cane + front arm
    const hx = 15.2, hy = cy + 8;
    stroke(ctx, [[hx + 0.6, -0.6], [hx + 0.4, hy - 2], [hx + 1.4, hy - 4.2], [hx + 3, hy - 3.6]], { w: 1.0, jit: 0.05, ta: 0.02, tb: 0.1, wv: 0.15, color: '#5a3a1e' }, r);
    const FA = ribbon(jit([[11.2, cy + 1.6], [13.6, cy + 5], [hx + 0.2, hy - 1]], 0.15, r), taperW(3, 2.4));
    part(ctx, FA, { c: '#dcc490', blobs: [{ x: 13, y: cy + 3, rx: 1.2, ry: 1.6, c: '#f2e2b8', a: 0.6, blur: 0.6 }], hi: 0.15, rim: 0.7, edge: '#6a4a2a', gran: 0.5 }, r, { w: 0.55 });
    const MP = spline(blobPts(hx + 0.4, hy - 0.8, 1.4, 1.2, 0.12, r, 7), true, 4);
    part(ctx, MP, { c: '#d8c08a', hi: 0.2, rim: 0.5, edge: '#6a4a2a', gran: 0.25 }, r, { w: 0.45 });
  }

  /* ===== Rübchen ===== */
  function drawSprout(ctx, pose, r, v) {
    const ph = pose.ph, sw = Math.sin(ph);
    rootLegs(ctx, r, ph, -1.3, 1.4, -2.8, 3, 0.8);
    ctx.save(); ctx.translate(0, -2.4); ctx.rotate(sw * 0.1); ctx.translate(0, 2.4);
    const cap = v ? '#b4729a' : '#a77ab5';
    leaf(ctx, r, [[0.2, -10.6], [1.6, -14.0], [3.8 + (pose.sway || 0) * 0.5, -16.0]], 2.6, LEAF);
    leaf(ctx, r, [[-0.3, -10.4], [-1.8, -12.2], [-3.2, -12.8]], 1.4, LEAF);
    const body = [[0, -11.0], [3.0, -10.3], [4.6, -7.4], [4.0, -4.6], [2.2, -2.8], [0.3, -2.0], [-1.9, -2.8], [-4.0, -4.6], [-4.6, -7.4], [-3.0, -10.3]];
    const BP = spline(jit(body, 0.15, r), true, 5);
    wash(ctx, BP, { c: '#f1e4bf', blobs: [{ x: 0, y: -10.2, rx: 5.6, ry: 3.0, c: cap, a: 0.95, blur: 1.1 }, { x: -1.6, y: -9.8, rx: 1.8, ry: 1, c: '#d9b4d4', a: 0.6, blur: 0.7 }, { x: 3.0, y: -5, rx: 1.6, ry: 2.4, c: '#c4a27e', a: 0.4, blur: 0.9 }], hi: 0.3, rim: 0.8, edge: '#5a3a52', rimA: 0.5, gran: 0.45 }, r);
    outline(ctx, BP, { w: 0.6, light: 0.5, cx: 0, cy: -6.5, pieces: 2 }, r);
    for (const [ex, ey] of [[0.9, -6.9], [3.1, -6.8]]) {
      ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(ex, ey, 0.75, 0.9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd866'; ctx.beginPath(); ctx.arc(ex + 0.15, ey + 0.15, 0.36, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(ex - 0.25, ey - 0.35, 0.22, 0, TAU); ctx.fill();
    }
    stroke(ctx, [[-0.4, -8.6], [0.8, -8.2], [1.6, -7.7]], { w: 0.5, ta: 0.15, tb: 0.2, wv: 0 }, r);
    stroke(ctx, [[4.4, -8.5], [3.4, -8.1], [2.5, -7.6]], { w: 0.46, ta: 0.15, tb: 0.2, wv: 0 }, r);
    ctx.fillStyle = '#3a1830'; ctx.beginPath(); ctx.ellipse(2.0, -4.9, 0.6, 0.38, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(220,110,120,0.55)'; ctx.beginPath(); ctx.arc(-0.6, -5.6, 0.5, 0, TAU); ctx.arc(4.2, -5.6, 0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------- frame cache (lazy, time-budgeted) ---------- */
  const FR = {}, ANY = {};
  let budgetT = -1, budgetStart = 0, FORCE = false;
  const DEF = {
    spitter: { wu: 32, hu: 37, ax: 13, ay: 34, fn: (c, p, r) => drawSpitter(c, p, r) },
    bomber: { wu: 20, hu: 27, ax: 10, ay: 25, fn: (c, p, r) => drawBomber(c, p, r) },
    charger: { wu: 38, hu: 34, ax: 20, ay: 31, fn: (c, p, r) => drawCharger(c, p, r) },
    mother: { wu: 40, hu: 50, ax: 18, ay: 47, fn: (c, p, r) => drawMother(c, p, r) },
    sprout0: { wu: 14, hu: 19, ax: 6.5, ay: 17, fn: (c, p, r) => drawSprout(c, p, r, 0) },
    sprout1: { wu: 14, hu: 19, ax: 6.5, ay: 17, fn: (c, p, r) => drawSprout(c, p, r, 1) },
  };
  function paint(type, pose, seed) {
    const d = DEF[type];
    const s = mkSprite(d.wu, d.hu, d.ax, d.ay);
    d.fn(s.ctx, pose, U.rng(seed));
    finish(s);
    if (pose.eye) { s.eye = pose.eye; s.top = pose.top; }
    return s;
  }
  /** cached frame; while a frame is being painted in this rendered frame for > 4 ms, siblings stand in */
  function frame(type, key, pose, seed, view) {
    const k = type + ':' + key;
    let s = FR[k];
    if (s) return s;
    if (view.rt !== budgetT) { budgetT = view.rt; budgetStart = performance.now(); }
    // the 2nd boil of a walk pose is painted in the background; until then the 1st one stands in
    if (!FORCE && key[0] === 'w' && key[key.length - 1] === '1') { const sib = FR[k.slice(0, -1) + '0']; if (sib) return sib; }
    if (ANY[type] && performance.now() - budgetStart > 4) return ANY[type];
    s = FR[k] = paint(type, pose, seed);
    if (!ANY[type]) ANY[type] = s;
    return s;
  }
  const SOFT = {}, DEATH = {};
  function softFor(type, s) { return SOFT[type] || (SOFT[type] = softOf(s, 4)); }
  function deathFor(type, s, view) {
    let d = DEATH[type];
    if (d) return d;
    if (view.rt === budgetT && performance.now() - budgetStart > 4) return null;
    return (DEATH[type] = dissolveFrames(s));
  }
  const poseIdx = (anim, k) => (Math.floor(anim * k) % 4 + 4) % 4;
  const boilOf = (view, e) => (Math.floor(view.rt * 5 + e.seed * 7)) & 1;
  const scOf = (e) => 0.93 + e.seed * 0.14;
  /** shared draw: spawn (soft bloom + squash) / flash (≤55 %) / paint-dissolve death, exactly like the style's creeper */
  function drawBody(ctx, e, type, s, view, o) {
    o = o || {};
    const flip = e.facing < 0;
    const sc = o.sc || scOf(e);
    const x = e.x + (o.dx || 0), y = e.y + (o.dy || 0);
    if (e.dying) {
      const dfs = deathFor(type, s, view);
      if (!dfs) { ctx.globalAlpha = 1 - e.deathT; blit(ctx, s, x, y, flip, sc); ctx.globalAlpha = 1; return null; }
      const i = Math.min(dfs.length - 1, Math.floor(e.deathT * dfs.length));
      ctx.globalAlpha = 1 - e.deathT * 0.25;
      blit(ctx, dfs[i], x, y, flip, sc);
      ctx.globalAlpha = 1;
      return null;
    }
    if (e.spawnT < 1) {
      const st = e.spawnT, soft = softFor(type, s);
      const sy = 0.75 + 0.25 * U.ease.outQuad(st);
      ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, st * 1.1)) * 0.9;
      blit(ctx, soft, x, y, flip, sc, null, 1.06, sy);
      const a2 = U.smoothstep(0.35, 1, st);
      if (a2 > 0) { ctx.globalAlpha = a2; blit(ctx, s, x, y, flip, sc, null, 1, sy); }
      ctx.globalAlpha = 1;
      return null;
    }
    const sx = o.sx || 1, sy = o.sy || 1;
    blit(ctx, s, x, y, flip, sc, null, sx, sy);
    if (o.hot > 0.02) { ctx.globalAlpha = o.hot; blit(ctx, s, x, y, flip, sc, flip ? s.flf : s.fl, sx, sy); }
    if (e.flash > 0) { ctx.globalAlpha = Math.min(0.55, e.flash * 1.2); blit(ctx, s, x, y, flip, sc, flip ? s.flf : s.fl, sx, sy); }
    ctx.globalAlpha = 1;
    return { sc, sx, sy, flip };
  }
  const at = (e, r, px, py) => [e.x + (r.flip ? -1 : 1) * px * r.sc * r.sx, e.y + py * r.sc * r.sy];
  function glowAt(ctx, img, x, y, R, a) {
    if (a <= 0.01) return;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(img, x - R, y - R, R * 2, R * 2);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  /** flush the style's batched ground shadows before our first sprite (they are flushed by its own draw calls) */
  const FLUSH = { t: '__none', v: 0, x: 0, y: 0 };
  function flushStyleShadows(ctx, view, style) {
    if (style && style.drawProp) { try { style.drawProp(ctx, FLUSH, view); } catch (err) { /* nothing to flush */ } }
  }

  /* ---------- small sprites ---------- */
  const SM = {};
  function buildSmall() {
    SM.glow = radialSprite(64, [[0, 'rgba(255,226,140,0.95)'], [0.35, 'rgba(255,196,90,0.5)'], [1, 'rgba(255,170,60,0)']]);
    SM.green = radialSprite(64, [[0, 'rgba(210,255,140,0.95)'], [0.3, 'rgba(150,240,70,0.5)'], [0.65, 'rgba(90,200,40,0.14)'], [1, 'rgba(90,200,40,0)']]);
    SM.red = radialSprite(64, [[0, 'rgba(255,210,170,0.95)'], [0.3, 'rgba(255,90,50,0.5)'], [1, 'rgba(255,40,20,0)']]);
    SM.lilac = radialSprite(64, [[0, 'rgba(240,215,255,0.9)'], [0.35, 'rgba(200,150,240,0.4)'], [1, 'rgba(160,100,220,0)']]);
    // spit glob (2 boils) + droplet
    SM.shot = [0, 1].map((i) => {
      const s = mkSprite(12, 11, 6, 5.5, 5), r = U.rng(9600 + i), t = s.ctx;
      const P = spline(jit([[4.8, 0], [3.2, -3.0], [-0.4, -3.9], [-3.6, -2.8], [-4.4, 0.2], [-3.2, 3.0], [0.2, 3.9], [3.4, 2.8]], 0.2, r), true, 5);
      MIS = [0.2, 0.15];
      wash(t, P, { c: '#7fd32f', blobs: [{ x: -1.2, y: -1.2, rx: 2.4, ry: 1.8, c: '#efffb0', a: 0.95, blur: 0.8 }, { x: 2, y: 1.8, rx: 2.6, ry: 1.6, c: '#2f6a14', a: 0.7, blur: 0.9 }], hi: 0, rim: 1.1, edge: '#1f4a10', rimA: 0.9, gran: 0.3 }, r);
      MIS = [0.45, 0.35];
      outline(t, P, { w: 0.75, pieces: 2, over: 2, color: '#14240a' }, r);
      t.fillStyle = '#fbfff0'; t.beginPath(); t.ellipse(-1.6, -1.7, 1.0, 0.6, -0.4, 0, TAU); t.fill();
      return s;
    });
    SM.drop = (() => {
      const s = mkSprite(5, 5, 2.5, 2.5, 5), r = U.rng(9700), t = s.ctx;
      const P = spline(blobPts(0, 0, 1.5, 1.4, 0.15, r, 7), true, 4);
      MIS = [0, 0];
      wash(t, P, { c: '#8fdc3c', blobs: [{ x: -0.4, y: -0.4, rx: 0.6, ry: 0.5, c: '#efffb0', a: 0.9, blur: 0.3 }], hi: 0, rim: 0.6, edge: '#1f4a10', rimA: 0.9, gran: 0.2 }, r);
      MIS = [0.45, 0.35];
      outline(t, P, { w: 0.4, pieces: 1, color: '#14240a' }, r);
      return s;
    })();
    // dizzy star + fuse spark (painted)
    SM.star = (() => {
      const s = mkSprite(6, 6, 3, 3, 6), r = U.rng(9900), t = s.ctx;
      const P = starPts(0, 0, 2.4, 1.0, 5, 0);
      MIS = [0, 0];
      wash(t, P, { c: '#e6a92f', blobs: [{ x: -0.4, y: -0.6, rx: 1.2, ry: 1, c: '#fff0b8', a: 0.95, blur: 0.5 }], hi: 0, rim: 0.6, edge: '#9a5a14', rimA: 0.8, gran: 0.2 }, r);
      MIS = [0.45, 0.35];
      outline(t, P, { w: 0.35, pieces: 1 }, r);
      return s;
    })();
    SM.spark = (() => {
      const s = mkSprite(7, 7, 3.5, 3.5, 6), t = s.ctx;
      const P = starPts(0, 0, 3.0, 1.0, 6, 0.2);
      t.fillStyle = '#ffcf55'; trace(t, P); t.fill();
      t.fillStyle = '#fff8d8'; trace(t, starPts(0, 0, 1.6, 0.6, 6, 0.5)); t.fill();
      t.lineWidth = 0.25; t.strokeStyle = '#c2541c'; trace(t, P); t.stroke();
      return s;
    })();
  }

  /* ---------- icons (painted in a 100×100 space, like the style's) ---------- */
  function seedIcon(ctx, r, cx, cy, s, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s);
    const pts = [[30, 0], [18, -14], [-6, -17], [-24, -9], [-30, 0], [-24, 9], [-6, 17], [18, 14]];
    const P = spline(jit(pts, 0.6, r), true, 5);
    wash(ctx, P, { c: '#f1e4bf', blobs: [{ x: -4, y: -3, rx: 14, ry: 8, c: '#fffaf0', a: 0.9, blur: 4 }, { x: 16, y: 8, rx: 14, ry: 9, c: '#c9a050', a: 0.55, blur: 5 }], hi: 0, rim: 5, edge: '#b48a3c', rimA: 0.8, gran: 0.3 }, r);
    outline(ctx, P, { w: 3.4, pieces: 2, over: 2 }, r);
    stroke(ctx, [[-20, 1], [0, -1], [20, 0.5]], { w: 1.6, ta: 0.3, tb: 0.4, wv: 0, color: '#9a7a3a', alpha: 0.6 }, r);
    ctx.restore();
  }
  function pumpkinIcon(ctx, r, cx, cy, s, lw, carved) {
    const rx = 26 * s, ry = 21 * s;
    const hp = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU - Math.PI / 2;
      let x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      y += Math.exp(-Math.pow((a + Math.PI / 2) / 0.32, 2)) * 3 * s;
      const lobe = 1 + 0.04 * Math.cos(a * 5);
      hp.push([cx + x * lobe, cy + y * lobe]);
    }
    const HP = spline(jit(hp, 0.6, r), true, 6);
    wash(ctx, HP, { c: '#e8832f', blobs: [{ x: cx - rx * 0.35, y: cy - ry * 0.4, rx: rx * 0.5, ry: ry * 0.45, c: '#f6b45e', a: 0.85, blur: 5 }, { x: cx + rx * 0.45, y: cy + ry * 0.5, rx: rx * 0.7, ry: ry * 0.5, c: '#bf531b', a: 0.75, blur: 6 }], hi: 0.3, rim: 4, edge: '#93380f', rimA: 0.6, gran: 0.5 }, r);
    for (const dx of [-0.6, -0.22, 0.3, 0.66]) stroke(ctx, [[cx + dx * rx * 0.55, cy - ry * 0.8], [cx + dx * rx, cy], [cx + dx * rx * 0.6, cy + ry * 0.85]], { w: 1.8 * s * 2, jit: 0.4, ta: 0.25, tb: 0.35, color: '#7e2f0e', alpha: 0.6 }, r);
    outline(ctx, HP, { w: 3.4 * lw, light: 0.55, cx, cy, pieces: 3 }, r);
    const ST = ribbon(jit([[cx + 0.5, cy - ry + 2], [cx - 1, cy - ry - 5 * s], [cx + 3 * s, cy - ry - 10 * s]], 0.4, r), taperW(7 * s, 4 * s));
    part(ctx, ST, { c: '#7a6a30', blobs: [{ x: cx, y: cy - ry - 4, rx: 3, ry: 5, c: '#a39246', a: 0.7, blur: 2 }], hi: 0.1, rim: 1.5, gran: 0.4 }, r, { w: 2.2 * lw });
    if (carved) {
      const g = (pts) => glowShape(ctx, jit(pts.map((p) => [cx + p[0] * s, cy + p[1] * s]), 0.3, r), r, { w: 1.8 * lw, rim: 2.4 });
      g([[-14, -2], [-4, -3], [-9, -13]]);
      g([[4, -3], [14, -2], [9, -12.5]]);
      g([[-16, 5], [-10, 8], [-5, 6], [0, 9], [5, 6], [10, 8], [16, 5], [11, 13], [0, 16], [-11, 13]]);
    }
  }
  function turnipIcon(ctx, r, cx, cy, s, lw, top) {
    const body = [[0, -24], [16, -20], [24, -4], [20, 12], [8, 22], [1, 30], [-7, 22], [-20, 12], [-24, -4], [-16, -20]].map((p) => [cx + p[0] * s, cy + p[1] * s]);
    const P = spline(jit(body, 0.8 * s, r), true, 6);
    wash(ctx, P, { c: '#eee0ba', blobs: [{ x: cx, y: cy - 16 * s, rx: 30 * s, ry: 16 * s, c: top || '#7a4a8c', a: 0.95, blur: 5 * s }, { x: cx - 9 * s, y: cy - 13 * s, rx: 9 * s, ry: 6 * s, c: '#a77ab5', a: 0.55, blur: 3 * s }, { x: cx + 6 * s, y: cy + 14 * s, rx: 14 * s, ry: 7 * s, c: '#e3c886', a: 0.6, blur: 4 * s }], hi: 0.3, rim: 3.2 * s, edge: '#5a3a52', rimA: 0.5, gran: 0.5 }, r);
    outline(ctx, P, { w: 3 * s * lw, light: 0.5, cx, cy, pieces: 3 }, r);
    return P;
  }
  const ICONS = {
    leech(ctx, r, lw) {
      for (let i = 0; i < 2; i++) stroke(ctx, [[30 + i * 16, 40], [26 + i * 16, 30], [34 + i * 16, 22], [29 + i * 16, 12]], { w: 2.4 * lw, jit: 0.8, ta: 0.3, tb: 0.5, wv: 0.2, color: '#7a7a8a', alpha: 0.75 }, r);
      // heart
      const hp = [];
      for (let i = 0; i < 20; i++) { const t = (i / 20) * TAU; hp.push([76 + 1.0 * 16 * Math.pow(Math.sin(t), 3) * 0.95, 26 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.95]); }
      const HP = spline(jit(hp, 0.5, r), true, 4);
      wash(ctx, HP, { c: '#c23b2b', blobs: [{ x: 70, y: 20, rx: 6, ry: 5, c: '#e8826a', a: 0.85, blur: 3 }, { x: 82, y: 32, rx: 8, ry: 6, c: '#8c1f17', a: 0.7, blur: 3 }], hi: 0.3, rim: 2.4, edge: '#7a1a12', rimA: 0.7, gran: 0.5 }, r);
      outline(ctx, HP, { w: 2.8 * lw, light: 0.5, pieces: 2 }, r);
      // bowl
      const bowl = [[8, 52], [92, 52], [88, 68], [74, 84], [50, 90], [26, 84], [12, 68]];
      const P = spline(jit(bowl, 0.8, r), true, 5);
      wash(ctx, P, { c: '#3f6f8a', blobs: [{ x: 30, y: 62, rx: 14, ry: 9, c: '#7aa8c0', a: 0.7, blur: 5 }, { x: 70, y: 80, rx: 18, ry: 9, c: '#1f3a50', a: 0.7, blur: 5 }], hi: 0.2, rim: 4, edge: '#16283a', rimA: 0.6, gran: 0.65 }, r);
      stroke(ctx, [[16, 66], [50, 72], [84, 66]], { w: 1.8, ta: 0.1, tb: 0.1, wv: 0.3, color: '#f2ead8', alpha: 0.7 }, r);
      outline(ctx, P, { w: 3.6 * lw, light: 0.5, pieces: 3 }, r);
      const top = spline(jit(blobPts(50, 52, 41, 7, 0.05, r, 12), 0.5, r), true, 4);
      wash(ctx, top, { c: '#e8832f', blobs: [{ x: 38, y: 50, rx: 14, ry: 3, c: '#f6b45e', a: 0.75, blur: 2 }, { x: 70, y: 55, rx: 12, ry: 3, c: '#bf531b', a: 0.6, blur: 2 }], hi: 0, rim: 2, edge: '#8a3a12', gran: 0.4 }, r);
      outline(ctx, top, { w: 2.6 * lw, pieces: 2 }, r);
      seedIcon(ctx, r, 62, 51, 0.16, 0.3); seedIcon(ctx, r, 36, 52, 0.14, -0.5);
    },
    thorns(ctx, r, lw) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + 0.13, c = Math.cos(a), s = Math.sin(a), px = -s, py = c;
        const T = [[50 + c * 27 + px * 7, 52 + s * 27 + py * 7], [50 + c * 46, 52 + s * 46], [50 + c * 27 - px * 7, 52 + s * 27 - py * 7]];
        wash(ctx, T, { c: i % 2 ? '#8a5a3a' : '#a5764e', blobs: [{ x: T[1][0], y: T[1][1], rx: 4, ry: 4, c: '#4a2c1c', a: 0.5, blur: 2 }], hi: 0, rim: 1.4, edge: '#3a2216', gran: 0.5 }, r);
        outline(ctx, T, { w: 2 * lw, pieces: 1 }, r);
      }
      const ring = spline(jit(blobPts(50, 52, 30, 30, 0.03, r, 14), 0.5, r), true, 4);
      wash(ctx, ring, { c: '#6b4a2e', blobs: [{ x: 40, y: 42, rx: 14, ry: 10, c: '#a5764e', a: 0.6, blur: 5 }], hi: 0.1, rim: 3, edge: '#2a160c', gran: 0.6 }, r);
      outline(ctx, ring, { w: 3 * lw, pieces: 2 }, r);
      turnipIcon(ctx, r, 50, 56, 0.82, lw);
      glowShape(ctx, jit([[38, 52], [46, 50], [44, 46]], 0.4, r), r, { w: 1.4 * lw, rim: 2 });
      glowShape(ctx, jit([[54, 50], [62, 52], [56, 46]], 0.4, r), r, { w: 1.4 * lw, rim: 2 });
      stroke(ctx, [[36, 44], [44, 47], [48, 46]], { w: 2.6 * lw, ta: 0.1, tb: 0.1, wv: 0 }, r);
      stroke(ctx, [[64, 44], [56, 47], [52, 46]], { w: 2.6 * lw, ta: 0.1, tb: 0.1, wv: 0 }, r);
    },
    dashup(ctx, r, lw) {
      for (const [y, l] of [[38, 30], [54, 38], [70, 28]]) stroke(ctx, [[6, y], [6 + l * 0.5, y + 0.6], [6 + l, y]], { w: 4.2 * lw, jit: 0.4, ta: 0.4, tb: 0.05, wv: 0.3, color: '#a3532c', alpha: 0.75 }, r);
      const arc = [];
      for (let i = 0; i <= 8; i++) { const t = -2.4 + (i / 8) * 1.7; arc.push([62 + Math.cos(t) * 34, 56 + Math.sin(t) * 34]); }
      stroke(ctx, arc, { w: 3 * lw, ta: 0.3, tb: 0.05, wv: 0.2, color: '#c2541c' }, r);
      const e = arc[arc.length - 1];
      trace(ctx, [[e[0] + 8, e[1] - 4], [e[0] - 4, e[1] - 6], [e[0] + 2, e[1] + 6]]); ctx.fillStyle = '#c2541c'; ctx.fill();
      ctx.save(); ctx.translate(62, 60); ctx.rotate(0.5); ctx.translate(-62, -60);
      pumpkinIcon(ctx, r, 62, 62, 1.1, lw, true);
      ctx.restore();
    },
    range(ctx, r, lw, small) {
      const traj = [];
      for (let t = 0; t <= 1.001; t += 0.065) traj.push([10 + t * 58, 88 - 140 * t * (1 - t) * 0.62 - t * 50]);
      ctx.fillStyle = '#3f6f8a';
      for (const p of traj) { ctx.beginPath(); ctx.arc(p[0], p[1], small ? 2.8 : 2.1, 0, TAU); ctx.fill(); }
      // target
      for (const [R, c, e] of [[20, '#b5352a', '#7a1a12'], [14, '#f2e7cf', '#b8a688'], [8, '#b5352a', '#7a1a12'], [3, '#f2e7cf', '#b8a688']]) {
        const P = spline(jit(blobPts(78, 74, R, R * 0.85, 0.02, r, 12), 0.3, r), true, 4);
        wash(ctx, P, { c, hi: 0, rim: 1.4, edge: e, gran: 0.4 }, r);
      }
      outline(ctx, spline(blobPts(78, 74, 20, 17, 0.02, r, 12), true, 4), { w: 2.6 * lw, pieces: 2 }, r);
      seedIcon(ctx, r, 62, 34, 0.62, 0.5);
    },
  };
  const ICON_CACHE = {};
  function paintIcon(id, size) {
    const c = U.canvas(size, size), ctx = c.ctx;
    const k = size / 100;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const small = size <= 48;
    const r = U.rng((id.charCodeAt(0) * 31 + id.length * 7 + size) | 0);
    const old = MIS;
    MIS = [1.6, 1.3];
    try { ICONS[id](ctx, r, small ? 1.35 : 1, small); } finally { MIS = old; }
    return c.c;
  }

  /* ---------- kill splash (style particle kinds: paint / ring / splat) ---------- */
  const KCOLS = {
    spitter: ['leaf', 'cream', 'violet', 'leaf', 'ochre'],
    bomber: ['red', 'plum', 'orange', 'red'],
    charger: ['ochre', 'cream', 'umber', 'sienna'],
    mother: ['violet', 'cream', 'red', 'ochre', 'plum'],
    sprout: ['plum', 'cream', 'leaf'],
  };
  const KH = { spitter: 13, bomber: 10, charger: 12, mother: 20, sprout: 7 };

  /** paint the remaining frames in the background (one every ~60 ms) so a crowd never waits for the brush */
  function warmUp(art, style) {
    const jobs = [];
    const add = (type, extra, anim, b) => jobs.push([type, extra, anim, b]);
    for (let b = 0; b < 2; b++) {
      for (let p = 0; p < 4; p++) {
        add('spitter', { mode: 'move' }, (p + 0.5) / 0.7, b);
        add('bomber', {}, (p + 0.5) / 1.05, b);
        add('charger', { mode: 'chase' }, (p + 0.5) / 0.75, b);
        add('mother', {}, (p + 0.5) / 0.45, b);
        add('sprout', { seed: 0.1 }, (p + 0.5) / 1.2, b);
        add('sprout', { seed: 0.6 }, (p + 0.5) / 1.2, b);
      }
    }
    for (const lv of [1, 2, 3]) add('spitter', { mode: 'aim', charge: (lv - 0.5) / 3 }, 0, 0);
    for (const m of ['tele', 'dash', 'rest']) for (let i = 0; i < 2; i++) add('charger', { mode: m, modeT: 0.3, dashX: 1, dashY: 0, _i: i }, 0, i);
    for (const t of ['spitter', 'bomber', 'charger', 'mother', 'sprout']) add(t, { dying: true, deathT: 0.5 }, 0, 0);
    const cv = U.canvas(64, 64).ctx;
    let n = 0;
    const run = (job) => {
      const [type, extra, anim, b] = job;
      // rt chosen so that boil parity / tele-dash-rest frame index = b
      const rt = 1000 + (n++) * 2 + (extra._i !== undefined ? 0 : b * 0.2) + 0.01;
      const view = { rt, t: rt, S: 3, pixel: false };
      if (extra._i !== undefined) view.rt = extra.mode === 'tele' ? 1000 + n * 2 + b / 9 + 0.001 : extra.mode === 'dash' ? 1000 + n * 2 + b / 16 + 0.001 : 1000 + n * 2 + b / 5 + 0.001;
      const e = Object.assign({ x: 0, y: 0, r: 9, facing: 1, anim, seed: 0, spawnT: 1, flash: 0, dying: false, deathT: 0, vx: 0, vy: 0, type }, extra);
      FORCE = true;
      try { art.enemies[type] && art.enemies[type].call(art, cv, e, view, null); } catch (err) { /* reported by the real draw */ }
      FORCE = false;
    };
    // first boil of every walk pose right now (≈100 ms), everything else in the background
    const now = jobs.filter((j) => j[3] === 0 && j[2] > 0 && !j[1].dying);
    const later = jobs.filter((j) => now.indexOf(j) < 0);
    for (const j of now) run(j);
    const step = () => { if (!later.length) return; run(later.shift()); setTimeout(step, 50); };
    setTimeout(step, 200);
  }

  CT.art('watercolor', {
    init(style) {
      buildTextures();
      buildSmall();
      buildMasks(4);
      warmUp(this, style);
    },
    enemies: {
      spitter(ctx, e, view, style) {
        flushStyleShadows(ctx, view, style);
        const b = boilOf(view, e);
        let s, o = {};
        if (e.mode === 'aim' && !e.dying) {
          const lv = Math.min(3, 1 + Math.floor((e.charge || 0) * 3));
          s = frame('spitter', 'a' + lv, { ph: 0, c: lv / 3, sway: 0 }, 1100 + lv * 31, view);
          o.dx = Math.sin(view.rt * 70 + e.seed * 9) * 0.35 * e.charge;
        } else {
          const p = poseIdx(e.anim, 0.7);
          s = frame('spitter', 'w' + p + b, { ph: (p / 4) * TAU, sway: Math.sin(p * 1.7 + b * 2.4), c: 0 }, 1000 + p * 7919 + b * 131, view);
          const k = e.spit || 0;
          if (k > 0) { o.sx = 1 + 0.16 * k; o.sy = 1 - 0.13 * k; o.dx = -(e.facing < 0 ? -1 : 1) * 1.6 * k; }
        }
        const r = drawBody(ctx, e, 'spitter', s, view, o);
        if (!r) return;
        const f = e.facing < 0 ? -1 : 1;
        if (e.mode === 'aim') {
          const c = e.charge || 0, m = spitMouth(Math.min(3, 1 + Math.floor(c * 3)) / 3);
          const [mx, my] = at(e, r, m[0], m[1]);
          glowAt(ctx, SM.green, mx + (o.dx || 0), my, 5 + 8 * c, 0.3 + 0.65 * c);
        } else if (e.spit > 0) {
          const k = e.spit, m = spitMouth(0);
          const [mx, my] = at(e, r, m[0], m[1]);
          glowAt(ctx, SM.green, mx, my, 9 * k, 0.8 * k);
          ctx.globalAlpha = Math.min(1, k * 1.6);
          for (let i = 0; i < 5; i++) {
            const a = (i - 2) * 0.32 + (e.seed - 0.5) * 0.4, d = 2 + (1 - k) * (9 + i * 2.2), sz = 0.55 + 0.3 * k;
            blit(ctx, SM.drop, mx + f * Math.cos(a) * d, my + Math.sin(a) * d - (1 - k) * 2 + (i % 2) * 1.2 + SM.drop.ay * sz - 0, false, sz);
          }
          ctx.globalAlpha = 1;
        }
      },
      bomber(ctx, e, view, style) {
        flushStyleShadows(ctx, view, style);
        const b = boilOf(view, e);
        const p = poseIdx(e.anim, e.armed ? 1.3 : 1.05);
        const s = frame('bomber', 'w' + p + b, { ph: (p / 4) * TAU, sway: Math.sin(p * 1.7 + b * 2.4) }, 2000 + p * 7919 + b * 131, view);
        const o = { sc: scOf(e) * 0.98 };
        if (e.armed && !e.dying) {
          const fu = e.fuse || 0;
          const on = Math.sin(view.rt * (5 + fu * 22) * Math.PI + e.seed * 10) > 0;
          const pulse = 1 + 0.12 * fu + (on ? 0.05 : 0);
          o.sx = pulse; o.sy = pulse;
          o.hot = on ? 0.62 : 0;
          o.dx = Math.sin(view.rt * 80) * 0.5 * fu;
          if (on) glowAt(ctx, SM.red, e.x, e.y - 9, 13 + fu * 6, 0.35 + fu * 0.3);
        }
        const r = drawBody(ctx, e, 'bomber', s, view, o);
        if (!r) return;
        const fu = e.armed ? e.fuse || 0 : 0;
        const bob = -Math.abs(Math.cos((p / 4) * TAU)) * 0.7;
        const [tx, ty] = at(e, r, BOMB_TIP[0], BOMB_TIP[1] + bob);
        const flick = 0.75 + 0.25 * Math.sin(view.rt * 31 + e.seed * 7);
        const X = tx + (o.dx || 0);
        glowAt(ctx, SM.glow, X, ty, (4 + fu * 8) * flick, 0.6 + fu * 0.4);
        ctx.save(); ctx.translate(X, ty); ctx.rotate(view.rt * 9 + e.seed * 5);
        const k = (0.5 + fu * 0.7) * flick;
        ctx.drawImage(SM.spark.c, -3.5 * k, -3.5 * k, 7 * k, 7 * k);
        ctx.restore();
      },
      charger(ctx, e, view, style) {
        flushStyleShadows(ctx, view, style);
        const mode = e.dying ? 'chase' : e.mode || 'chase';
        const t = view.rt;
        let s, o = {};
        const f = e.facing < 0 ? -1 : 1;
        if (mode === 'tele') {
          const i = Math.floor(t * 9 + e.seed * 4) & 1;
          s = frame('charger', 't' + i, { ph: i * Math.PI, mode: 'tele' }, 3100 + i * 17, view);
          const k = Math.min(1, (e.modeT || 0) / 0.72);
          o.dx = Math.sin(t * 75 + e.seed * 9) * (0.3 + 0.7 * k);
          o.dy = -Math.abs(Math.sin(t * 9)) * 0.6;
        } else if (mode === 'dash') {
          const i = Math.floor(t * 16) & 1;
          s = frame('charger', 'd' + i, { ph: i * Math.PI * 0.5, mode: 'dash' }, 3200 + i * 17, view);
          o.sx = 1.1; o.sy = 0.93;
          const dx = e.dashX || f, dy = e.dashY || 0, sc = scOf(e);
          for (let k2 = 3; k2 >= 1; k2--) { ctx.globalAlpha = 0.28 - k2 * 0.07; blit(ctx, s, e.x - dx * k2 * 7, e.y - dy * k2 * 7, f < 0, sc, null, 1.1, 0.93); }
          ctx.globalAlpha = 1;
          // dry-brush speed streaks
          for (let j = 0; j < 3; j++) {
            const oy = -7 - j * 6, ox = (t * 60 + j * 17) % 14;
            const L = [[e.x - dx * (10 + ox), e.y + oy - dy * (10 + ox)], [e.x - dx * (22 + ox + j * 3), e.y + oy - dy * (22 + ox)]];
            inkLine(ctx, L, { w: 1.1 - j * 0.25, ta: 0.6, tb: 0.05, wv: 0, color: '#5a3a22', alpha: 0.55 });
          }
        } else if (mode === 'rest') {
          const i = Math.floor(t * 5 + e.seed * 3) % 2;
          s = frame('charger', 'r' + i, { ph: i * Math.PI, mode: 'rest' }, 3300 + i * 17, view);
          o.dx = Math.sin(t * 7) * 0.8;
        } else {
          const b = boilOf(view, e), p = poseIdx(e.anim, 0.75);
          s = frame('charger', 'c' + p + b, { ph: (p / 4) * TAU, mode: 'chase' }, 3000 + p * 7919 + b * 131, view);
        }
        const r = drawBody(ctx, e, 'charger', s, view, o);
        if (!r || !s.eye) return;
        if (mode === 'tele' || mode === 'dash') {
          const [ex, ey] = at(e, r, s.eye[0], s.eye[1]);
          glowAt(ctx, SM.red, ex + (o.dx || 0), ey + (o.dy || 0), mode === 'tele' ? 6 + 4 * Math.min(1, e.modeT / 0.72) : 6, 0.8);
          if (mode === 'tele') {
            const [hx, hy] = at(e, r, 9, 0);
            ctx.fillStyle = '#d8c8a8';
            for (let j = 0; j < 3; j++) {
              const q = (t * 3 + j / 3) % 1;
              ctx.globalAlpha = 0.5 * (1 - q);
              ctx.beginPath(); ctx.arc(hx - f * q * 9 - f * j, hy - q * 4, 1.2 + q * 2.2, 0, TAU); ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
        } else if (mode === 'rest') {
          const [hx, hy] = at(e, r, s.top[0], s.top[1]);
          for (let j = 0; j < 3; j++) {
            const a = t * 5 + (j / 3) * TAU, d = Math.sin(a), k = 0.8 + 0.25 * d;
            ctx.drawImage(SM.star.c, hx + Math.cos(a) * 7.5 - 3 * k, hy + d * 2.2 - 3 * k, 6 * k, 6 * k);
          }
        }
      },
      mother(ctx, e, view, style) {
        flushStyleShadows(ctx, view, style);
        const b = boilOf(view, e), p = poseIdx(e.anim, 0.45);
        const s = frame('mother', 'w' + p + b, { ph: (p / 4) * TAU }, 4000 + p * 7919 + b * 131, view);
        const bb = e.dying ? 0 : e.birth || 0;
        const o = { sc: 0.96 + e.seed * 0.08 };
        if (bb > 0) {
          const w = Math.sin((1 - bb) * Math.PI * 3) * bb;
          o.sy = 1 + 0.16 * w; o.sx = 1 - 0.12 * w;
          glowAt(ctx, SM.lilac, e.x, e.y - 20, 26 + 8 * (1 - bb), bb * 0.7);
        }
        const r = drawBody(ctx, e, 'mother', s, view, o);
        if (!r || bb <= 0.05) return;
        const [hx, hy] = at(e, r, 1, -44);
        ctx.globalAlpha = Math.min(1, bb * 2);
        for (let j = 0; j < 4; j++) {
          const a = -Math.PI / 2 + (j - 1.5) * 0.7, d = (1 - bb) * 14 + 4;
          ctx.drawImage(SM.star.c, hx + Math.cos(a) * d - 2.4, hy + Math.sin(a) * d * 0.8 - 2.4, 4.8, 4.8);
        }
        ctx.globalAlpha = 1;
      },
      sprout(ctx, e, view, style) {
        flushStyleShadows(ctx, view, style);
        const v = e.seed < 0.5 ? 0 : 1, b = boilOf(view, e), p = poseIdx(e.anim, 1.2);
        const type = 'sprout' + v;
        const s = frame(type, 'w' + p + b, { ph: (p / 4) * TAU, sway: Math.sin(p * 1.7 + b * 2.4) }, 5000 + v * 50 + p * 7919 + b * 131, view);
        drawBody(ctx, e, type, s, view, { sc: 0.95 + e.seed * 0.1 });
      },
    },
    onKill(game, e) {
      const cols = KCOLS[e.type];
      if (!cols) return false;
      const h = KH[e.type] || 12, big = e.type === 'mother', small = e.type === 'sprout';
      for (let i = 0, n = big ? 16 : small ? 5 : 10; i < n; i++) {
        const a = Math.random() * TAU, sp = (big ? 95 : 75) * (0.35 + Math.random() * 0.8);
        game.addParticle({
          x: e.x, y: e.y, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.65, vz: 30 + Math.random() * 70, grav: 260,
          life: 0.9 + Math.random() * 0.8, size: (big ? 3 : small ? 1.8 : 2.4) * (0.5 + Math.random() * 0.9), kind: 'paint',
          col: (i % 4 === 3 ? 'ink' : cols[(Math.random() * cols.length) | 0]), drag: 1.6, v: (Math.random() * 3) | 0,
        });
      }
      game.addParticle({ x: e.x, y: e.y, kind: 'ring', col: e.type === 'bomber' ? 'red' : e.type === 'charger' ? 'sienna' : 'violet', life: big ? 1.2 : 1.0, size: big ? 24 : small ? 10 : 15, drag: 0 });
      game.addParticle({ x: e.x, y: e.y, z: h, kind: 'splat', col: cols[0], life: 0.28, size: big ? 24 : small ? 10 : 16, drag: 0, rot: Math.random() * TAU, v: (Math.random() * 2) | 0, a: 0.75 });
    },
    shot(ctx, s, view) {
      const y = s.y - s.z;
      const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp;
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.85 - i * 0.2;
        const k = 1 - i * 0.2;
        ctx.drawImage(SM.drop.c, s.x - ux * i * 4.6 - 2.5 * k + Math.sin(s.age * 20 + i) * 0.5, y - uy * i * 4.6 - 2.5 * k, 5 * k, 5 * k);
      }
      ctx.globalAlpha = 1;
      glowAt(ctx, SM.green, s.x, y, 12, 0.6 + 0.15 * Math.sin(view.rt * 14 + s.seed * 9));
      const wob = 1 + 0.1 * Math.sin(view.rt * 18 + s.seed * 10);
      const fr = SM.shot[(Math.floor(view.rt * 6 + s.seed * 5)) & 1];
      ctx.save(); ctx.translate(s.x, y); ctx.rotate(Math.atan2(uy, ux)); ctx.scale(wob, 2 - wob);
      ctx.drawImage(fr.c, -fr.ax, -fr.ay, fr.wu, fr.hu);
      ctx.restore();
    },
    icons: (() => {
      const out = {};
      for (const id of Object.keys(ICONS)) {
        out[id] = function (ctx, size) {
          if (!GRAIN_C) buildTextures();
          const key = id + ':' + size;
          let c = ICON_CACHE[key];
          if (!c) c = ICON_CACHE[key] = paintIcon(id, size);
          ctx.drawImage(c, 0, 0);
        };
      }
      return out;
    })(),
  });
})();
