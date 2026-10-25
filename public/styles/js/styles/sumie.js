/* ===========================================================================
   Sumi-e Ink  (id: sumie, family: Painterly · Ink wash)
   East-Asian monochrome ink-wash painting on warm xuan paper. A variant of
   the watercolour storybook toolkit, reduced to black ink in five tones:
   - paper: per-pixel xuan shader (long fibres, tooth, foxing), pale ink
     washes that bleed into the fibres, water left as bare paper
   - brush: one-stroke ribbons with pressed starts, tapering ends and a
     dry-brush ("flying white") bristle mode; ink halos via blur
   - one accent colour only: vermilion – seals, a few blossoms and the sash
     of the main character
   =========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const K = 3;                         // prop sprite resolution: px per world unit
  const KC = 4;                        // character sprite resolution
  const PAPER = [243, 236, 221];
  const PAPER_CSS = '#f3ecdd';
  const PAPER_HI = '#f9f4e8';          // unpainted, brightest paper (eyes, flash)
  // five ink tones: jiao (burnt) · nong (thick) · zhong (heavy) · dan (light) · qing (clear)
  const TONE = [[22, 20, 18], [44, 41, 38], [86, 82, 76], [138, 133, 124], [190, 184, 170]];
  const T = TONE.map((c) => 'rgb(' + c.join(',') + ')');
  const INK = T[0];
  const VERM = [206, 60, 38], VERM_CSS = '#ce3c26', VERM_DK = '#a8281a', VERM_LT = '#e47052';
  const clamp = U.clamp;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const hsh = (a, b, c) => U.hashInt(a | 0, b | 0, c | 0);
  const hyp = (a, b) => Math.sqrt(a * a + b * b);
  const rgb = (c, a) => (a === undefined ? 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')' : 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')');

  /* ======================================================================
     1. Procedural textures (tileable float fields)
     ====================================================================== */
  let PAP, GRA, WA, FIB, GRAIN_C, FIBW_C, FIB_C;

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
  /** xuan paper fibres: long thin curved hairs, light and dark, tileable (512 px) */
  function fibreCanvas(size, seed, n, lightOnly) {
    const c = U.canvas(size, size), t = c.ctx, r = U.rng(seed);
    if (!lightOnly) { t.fillStyle = 'rgb(128,128,128)'; t.fillRect(0, 0, size, size); }
    t.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = r.next() * size, y = r.next() * size, a = r.next() * TAU, L = 5 + Math.pow(r.next(), 1.6) * 46;
      const bend = (r.next() - 0.5) * L * 0.5;
      const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
      const mx = (x + ex) / 2 - Math.sin(a) * bend, my = (y + ey) / 2 + Math.cos(a) * bend;
      const light = lightOnly || r.next() < 0.62;
      const al = lightOnly ? 0.14 + r.next() * 0.26 : light ? 0.18 + r.next() * 0.32 : 0.08 + r.next() * 0.16;
      t.strokeStyle = light ? 'rgba(255,255,255,' + al + ')' : 'rgba(0,0,0,' + al + ')';
      t.lineWidth = lightOnly ? 0.4 + r.next() * 0.6 : 0.5 + r.next() * (light ? 1.3 : 0.8);
      U.tileDraw(t, size, size, (cx, ox, oy) => {
        cx.beginPath(); cx.moveTo(x + ox, y + oy); cx.quadraticCurveTo(mx + ox, my + oy, ex + ox, ey + oy); cx.stroke();
      });
    }
    return c;
  }
  function buildTextures() {
    PAP = noiseTex(256, 111, [{ r: 1, w: 0.55, p: 2 }, { r: 2, w: 1, p: 3 }, { r: 6, w: 0.4, p: 3 }]);
    GRA = noiseTex(256, 222, [{ r: 0, w: 0.7 }, { r: 1, w: 1, p: 1 }]);
    WA = noiseTex(512, 333, [{ r: 3, w: 0.35 }, { r: 9, w: 1 }, { r: 26, w: 0.8 }]);
    FIB_C = fibreCanvas(512, 444, 2600, false);
    const fd = FIB_C.ctx.getImageData(0, 0, 512, 512).data;
    FIB = new Float32Array(512 * 512);
    for (let i = 0; i < FIB.length; i++) FIB[i] = fd[i * 4] / 255;
    FIBW_C = fibreCanvas(256, 555, 300, true);
    // grain canvas for wash granulation (multiply): mostly white with ink specks + paper tooth
    GRAIN_C = U.canvas(256, 256);
    const img = GRAIN_C.ctx.createImageData(256, 256), d = img.data;
    for (let i = 0; i < 65536; i++) {
      const g = GRA[i], p = PAP[i];
      const v = 255 - Math.max(0, g - 0.46) * 170 - Math.max(0, 0.5 - p) * 70;
      d[i * 4] = v; d[i * 4 + 1] = v * 0.99; d[i * 4 + 2] = v * 0.975; d[i * 4 + 3] = 255;
    }
    GRAIN_C.ctx.putImageData(img, 0, 0);
  }

  /* ======================================================================
     2. Brush toolkit
     ====================================================================== */
  function spline(pts, closed, steps) {
    steps = steps || 6;
    const n = pts.length, out = [];
    if (n < 3) {
      if (closed || n < 2) return pts.map((p) => p.slice());
      for (let s = 0; s <= steps; s++) out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * s / steps, pts[0][1] + (pts[1][1] - pts[0][1]) * s / steps]);
      return out;
    }
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
  const scaleOf = (ctx) => { const m = ctx.getTransform(); return hyp(m.a, m.b) || 1; };
  function ribbonPath(ctx, P, NX, NY, W, i0, i1, o0, o1) {
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      const x = P[i][0] + NX[i] * W[i] * o0, y = P[i][1] + NY[i] * W[i] * o0;
      if (i === i0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = i1; i >= i0; i--) ctx.lineTo(P[i][0] + NX[i] * W[i] * o1, P[i][1] + NY[i] * W[i] * o1);
    ctx.closePath();
  }
  /**
   * One brush stroke along control points.
   * o: w (width, world units), c (rgb array), c2 (tip ink for wet strokes / far bristles), a (alpha),
   *    ta/tb (taper fractions start/end), press (pressed round start), wv (width wobble), dry (0..1 flying white),
   *    bleed (ink halo into paper, 0..1), jit, steps, nb (bristles), tp (end taper exponent)
   */
  function brush(ctx, pts, o, r) {
    const P = spline(o.jit && r ? jit(pts, o.jit, r) : pts, false, o.steps || 6);
    const n = P.length;
    if (n < 2) return;
    const acc = new Float32Array(n);
    for (let i = 1; i < n; i++) acc[i] = acc[i - 1] + hyp(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    const tot = acc[n - 1] || 1;
    const W = new Float32Array(n), NX = new Float32Array(n), NY = new Float32Array(n);
    const w0 = o.w, ta = o.ta === undefined ? 0.12 : o.ta, tb = o.tb === undefined ? 0.35 : o.tb;
    const press = o.press || 0, wv = o.wv === undefined ? 0.12 : o.wv, tp = o.tp || 0.6;
    const ph = r ? r.next() * 9 : 1.3;
    for (let i = 0; i < n; i++) {
      const a = P[i > 0 ? i - 1 : 0], b = P[i < n - 1 ? i + 1 : n - 1];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = hyp(tx, ty) || 1; tx /= l; ty /= l;
      NX[i] = -ty; NY[i] = tx;
      const u = acc[i] / tot;
      let w = w0;
      if (ta > 0 && u < ta) w *= 0.3 + 0.7 * Math.sqrt(u / ta);
      if (tb > 0 && u > 1 - tb) w *= 0.04 + 0.96 * Math.pow(Math.max(0, 1 - u) / tb, tp);
      if (press) w *= 1 + press * Math.exp(-(acc[i] * acc[i]) / (w0 * w0 * 1.2));
      w *= 1 + wv * (0.6 * Math.sin(acc[i] * 0.55 + ph) + 0.4 * Math.sin(acc[i] * 1.7 + ph * 2.1));
      W[i] = w < 0.04 ? 0.04 : w;
    }
    const col = o.c || TONE[1], al = o.a === undefined ? 1 : o.a;
    const ga = ctx.globalAlpha;
    if (o.bleed) {
      const k = scaleOf(ctx);
      ctx.save();
      ctx.filter = 'blur(' + Math.max(0.6, o.bleed * w0 * 0.55 * k).toFixed(1) + 'px)';
      ctx.globalAlpha = ga * al * 0.32;
      ctx.fillStyle = rgb(col);
      ribbonPath(ctx, P, NX, NY, W, 0, n - 1, -0.7, 0.7);
      ctx.fill();
      ctx.restore();
    }
    const dry = o.dry || 0;
    if (dry <= 0) {
      ctx.fillStyle = rgb(col);
      ctx.globalAlpha = ga * al;
      ribbonPath(ctx, P, NX, NY, W, 0, n - 1, -0.5, 0.5);
      ctx.fill();
      if (press > 0.2) { ctx.beginPath(); ctx.arc(P[0][0], P[0][1], W[0] * 0.5, 0, TAU); ctx.fill(); }
      if (o.c2) {
        ctx.fillStyle = rgb(o.c2);
        ctx.globalAlpha = ga * al * 0.85;
        ribbonPath(ctx, P, NX, NY, W, 0, n - 1, -0.5, -0.12);
        ctx.fill();
      }
      ctx.globalAlpha = ga;
      return;
    }
    // dry brush: a solid body that runs out, then bristles that break into streaks
    const rr = r || U.rng(hsh(n, w0 * 100, 7));
    const k = scaleOf(ctx);
    const nb = o.nb || clamp(Math.round((w0 * k) / 1.5), 4, 18);
    const uBody = 1 - dry * 0.9;
    let iBody = 0;
    while (iBody < n - 1 && acc[iBody] / tot < uBody) iBody++;
    if (iBody > 1) {
      ctx.fillStyle = rgb(col);
      ctx.globalAlpha = ga * al * 0.9;
      ribbonPath(ctx, P, NX, NY, W, 0, iBody, -0.42, 0.42);
      ctx.fill();
      if (press > 0.2) { ctx.beginPath(); ctx.arc(P[0][0], P[0][1], W[0] * 0.45, 0, TAU); ctx.fill(); }
    }
    const c2 = o.c2 || col;
    const bw = 1.55 / nb, gsc = o.gs || Math.max(0.5, w0 * 0.5);
    for (let b = 0; b < nb; b++) {
      const off = (b + 0.5) / nb - 0.5 + (rr.next() - 0.5) * 0.35 / nb;
      const edge = Math.abs(off) * 2;
      const life = 1 - dry * Math.pow(rr.next(), 0.7) * (0.25 + 0.75 * edge) * 0.9;
      const gs = rr.next() * 50, gf = 0.35 + rr.next() * 0.5;
      const t = clamp01(off + 0.5);
      const bc = [col[0] + (c2[0] - col[0]) * t, col[1] + (c2[1] - col[1]) * t, col[2] + (c2[2] - col[2]) * t];
      ctx.fillStyle = rgb(bc);
      ctx.globalAlpha = ga * al * (0.62 + rr.next() * 0.38);
      let s0 = -1;
      for (let i = 0; i < n; i++) {
        const u = acc[i] / tot;
        const g = U.perlin(acc[i] * gf / gsc, gs, 17) * 0.5 + 0.5;
        const on = u <= life && g > dry * (u * 1.25 - 0.25) + 0.08 * edge;
        if (on && s0 < 0) s0 = i;
        if ((!on || i === n - 1) && s0 >= 0) {
          const e = on ? i : i - 1;
          if (e > s0) { ribbonPath(ctx, P, NX, NY, W, s0, e, off - bw / 2, off + bw / 2); ctx.fill(); }
          s0 = -1;
        }
      }
    }
    ctx.globalAlpha = ga;
  }
  /** dot of ink (dian): pressed blob with a slight tail */
  function dot(ctx, x, y, s, c, a, r, ang) {
    ang = ang === undefined ? (r ? r.next() * TAU : 0) : ang;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const P = [];
    for (let i = 0; i < 9; i++) {
      const t = (i / 9) * TAU, k = 1 + (r ? (r.next() - 0.5) * 0.3 : 0) + 0.35 * Math.max(0, Math.cos(t));
      const px = Math.cos(t) * s * k, py = Math.sin(t) * s * 0.78;
      P.push([x + px * ca - py * sa, y + px * sa + py * ca]);
    }
    trace(ctx, spline(P, true, 3));
    ctx.fillStyle = rgb(c || TONE[0]);
    const ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * (a === undefined ? 1 : a);
    ctx.fill();
    ctx.globalAlpha = ga;
  }

  /* ---------- ink wash fill (wet ink in a shape) ---------- */
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
  /**
   * o: c (css base), blobs [{x,y,rx,ry,c,a,blur,rot}], rim (edge width), edge (rim css), rimA, rimBlur,
   *    gran, feather, alpha, fade {y0, y1} (ink thins out from y0 to y1: mist), bleed (halo width units)
   */
  function wash(ctx, P, o) {
    const cv = ctx.canvas, m = ctx.getTransform(), k = hyp(m.a, m.b);
    const s = getScratch(cv.width, cv.height), t = s.ctx;
    t.setTransform(m);
    const bb = bbox(P);
    if (o.bleed) {
      t.filter = 'blur(' + (o.bleed * k).toFixed(1) + 'px)';
      t.globalAlpha = o.bleedA === undefined ? 0.45 : o.bleedA;
      trace(t, P); t.fillStyle = o.c; t.fill();
      t.filter = 'none'; t.globalAlpha = 1;
    }
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
    if (o.rim) {
      t.filter = 'blur(' + ((o.rimBlur === undefined ? 0.5 : o.rimBlur) * k).toFixed(1) + 'px)';
      t.globalAlpha = o.rimA === undefined ? 0.6 : o.rimA;
      t.strokeStyle = o.edge || o.c;
      t.lineWidth = o.rim;
      trace(t, P);
      t.stroke();
      t.filter = 'none';
      t.globalAlpha = 1;
    }
    if (o.gran !== 0) {
      if (!s.pat) s.pat = t.createPattern(GRAIN_C.c, 'repeat');
      t.setTransform(1, 0, 0, 1, 0, 0);
      t.globalCompositeOperation = 'multiply';
      t.globalAlpha = o.gran === undefined ? 0.5 : o.gran;
      t.fillStyle = s.pat;
      t.fillRect(0, 0, cv.width, cv.height);
      t.globalAlpha = 1;
      t.setTransform(m);
    }
    if (o.feather || o.gran !== 0) {
      t.globalCompositeOperation = 'destination-in';
      if (o.feather) t.filter = 'blur(' + (o.feather * k).toFixed(1) + 'px)';
      trace(t, P);
      t.fillStyle = '#000';
      t.fill();
      t.filter = 'none';
      if (o.bleed) {
        // keep the halo: re-add the blurred shape underneath
        t.globalCompositeOperation = 'destination-over';
        t.filter = 'blur(' + (o.bleed * k).toFixed(1) + 'px)';
        t.globalAlpha = o.bleedA === undefined ? 0.45 : o.bleedA;
        trace(t, P); t.fillStyle = o.c; t.fill();
        t.filter = 'none'; t.globalAlpha = 1;
      }
    }
    if (o.fade) {
      t.globalCompositeOperation = 'destination-out';
      const g = t.createLinearGradient(0, o.fade.y0, 0, o.fade.y1);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      t.fillStyle = g;
      t.fillRect(bb.x0 - 20, Math.min(o.fade.y0, o.fade.y1), bb.w + 40, Math.abs(o.fade.y1 - o.fade.y0) + bb.h + 40);
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    if (o.op) ctx.globalCompositeOperation = o.op;
    ctx.drawImage(s.c, 0, 0);
    ctx.restore();
  }
  function radialSprite(px, stops) {
    const c = U.canvas(px, px);
    const g = c.ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    c.ctx.fillStyle = g;
    c.ctx.fillRect(0, 0, px, px);
    return c.c;
  }
  /**
   * abstract calligraphy glyph in a cell of size s centred on (cx, cy) – built like a character
   * (horizontal bars, a spine, falling strokes, a hook, dots) but never real text
   */
  function glyph(ctx, cx, cy, s, r, c, a) {
    const h = s * 0.42, o = { c, a, ta: 0, press: 0.45, wv: 0.08 };
    const x = (u) => cx + u * h, y = (v) => cy + v * h;
    const top = r.next() < 0.55, spine = r.next() < 0.7, bars = 1 + r.int(0, 2);
    if (top) { dot(ctx, x(0.05), y(-0.9), s * 0.07, c, a, r, 0.6); }
    const y0 = top ? -0.55 : -0.8;
    for (let i = 0; i < bars; i++) {
      const v = y0 + (i / Math.max(1, bars)) * 1.1, wdt = 0.55 + r.next() * 0.35;
      brush(ctx, [[x(-wdt), y(v + 0.04)], [x(wdt), y(v - 0.04)]], Object.assign({ w: s * 0.1, tb: 0.25 }, o), r);
    }
    if (spine) brush(ctx, [[x(0.02), y(y0 - 0.1)], [x(0), y(0.9)]], Object.assign({ w: s * 0.11, tb: r.next() < 0.5 ? 0.5 : 0.1 }, o), r);
    const k = r.next();
    if (k < 0.4) {
      // left- and right-falling strokes
      brush(ctx, [[x(-0.05), y(0.15)], [x(-0.4), y(0.55)], [x(-0.85), y(0.85)]], Object.assign({ w: s * 0.09, tb: 0.8 }, o), r);
      brush(ctx, [[x(0.05), y(0.2)], [x(0.45), y(0.6)], [x(0.9), y(0.8)]], Object.assign({ w: s * 0.11, tb: 0.25, ta: 0.4 }, o), r);
    } else if (k < 0.7) {
      // a box-like enclosure
      brush(ctx, [[x(-0.6), y(0.05)], [x(-0.6), y(0.8)]], Object.assign({ w: s * 0.08, tb: 0.2 }, o), r);
      brush(ctx, [[x(-0.6), y(0.05)], [x(0.6), y(0.02)], [x(0.55), y(0.8)]], Object.assign({ w: s * 0.09, tb: 0.3 }, o), r);
      brush(ctx, [[x(-0.5), y(0.75)], [x(0.5), y(0.72)]], Object.assign({ w: s * 0.08, tb: 0.3 }, o), r);
    } else {
      // a hook and two dots
      brush(ctx, [[x(0.45), y(-0.2)], [x(0.5), y(0.7)], [x(0.25), y(0.55)]], Object.assign({ w: s * 0.1, tb: 0.6 }, o), r);
      dot(ctx, x(-0.45), y(0.3), s * 0.06, c, a, r, 0.9);
      dot(ctx, x(-0.3), y(0.62), s * 0.06, c, a, r, 0.5);
    }
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
  /** ink soaks into the paper: lift ink along the paper fibres */
  function paperize(s, a) {
    const t = s.c.getContext('2d');
    t.save();
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalCompositeOperation = 'destination-out';
    t.globalAlpha = a === undefined ? 0.45 : a;
    t.fillStyle = t.createPattern(FIBW_C.c, 'repeat');
    t.fillRect(0, 0, s.c.width, s.c.height);
    t.restore();
  }
  function flashOf(src) {
    // the ink is lifted: a pale paper silhouette with a soft grey rim
    const { c, ctx } = U.canvas(src.width, src.height);
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = PAPER_HI;
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function finish(s, opts) {
    opts = opts || {};
    if (opts.paper !== false) paperize(s, opts.paper);
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
  /** death: the figure dissolves into the paper – ink spreads (blur), pales and breaks along fibres */
  function dissolveFrames(s, n, seed) {
    const w = s.c.width, h = s.c.height;
    const out = [];
    for (let f = 0; f < n; f++) {
      const t = (f + 1) / (n + 1);
      const { c, ctx } = U.canvas(w, h);
      ctx.filter = 'blur(' + (t * 2.2 * s.k).toFixed(1) + 'px)';
      ctx.drawImage(s.c, 0, 0);
      ctx.filter = 'none';
      ctx.globalAlpha = 1 - t * 0.5;
      ctx.drawImage(s.c, 0, 0);
      ctx.globalAlpha = 1;
      const img = ctx.getImageData(0, 0, w, h), d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const o = (y * w + x) * 4;
          if (!d[o + 3]) continue;
          const nv = WA[((((y + seed) * 2) & 511) << 9) | ((x * 2 + seed) & 511)] * 0.7 + FIB[(((y * 3) & 511) << 9) | ((x * 3) & 511)] * 0.3;
          const keep = (nv + 0.2 - t * 1.0) * 6;
          if (keep <= 0) { d[o + 3] = 0; continue; }
          const L = t * 0.55;
          d[o] += (PAPER[0] - d[o]) * L; d[o + 1] += (PAPER[1] - d[o + 1]) * L; d[o + 2] += (PAPER[2] - d[o + 2]) * L;
          d[o + 3] *= Math.min(1, keep) * (1 - t * 0.35);
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
     3. World fields: ponds, streams, pale wash regions
     ====================================================================== */
  const T_W = 0.625, T_M = 0.6;
  const fWater = (x, y) => U.warped(x / 820 + 13.7, y / 820 - 4.1, 61, 1.1, 3);
  const fMist = (x, y) => U.warped(x / 500 - 21.3, y / 500 + 8.8, 71, 0.9, 3);
  const fDen = (x, y) => 0.7 + 0.6 * U.fbm(x / 300 + 3.3, y / 300, 73, 2);
  const fGrass = (x, y) => U.noise(x / 140, y / 140, 75);
  function fRiver(x, y) {
    const qx = x + 70 * U.perlin(x / 280, y / 280, 81), qy = y + 70 * U.perlin(x / 280 + 9.1, y / 280 - 3.3, 82);
    return U.perlin(qx / 860, qy / 860, 83);
  }
  // streams exist only where the mask allows: long sparse runs that thin out and end in mist
  function riverHW(x, y) {
    const m = U.smoothstep(0.52, 0.64, U.noise(x / 1000 + 3.7, y / 1000 - 1.9, 85));
    return (5.5 + 5 * U.noise(x / 240, y / 240, 84)) * m - 6 * (1 - m);
  }
  /** signed distance to water in world units (> 0 inside) and the local flow / shore tangent */
  function waterAt(x, y) {
    const e = 1.5;
    const p = fWater(x, y), px = fWater(x + e, y), py = fWater(x, y + e);
    const gpx = (px - p) / e, gpy = (py - p) / e, gp = hyp(gpx, gpy) || 1e-6;
    const dP = clamp((p - T_W) / gp, -80, 80);
    const q = fRiver(x, y), qx = fRiver(x + e, y), qy = fRiver(x, y + e);
    const gx = (qx - q) / e, gy = (qy - q) / e, gq = hyp(gx, gy) || 1e-6;
    const dR = clamp(riverHW(x, y) - Math.abs(q) / gq, -80, 80);
    if (dR > dP) return { d: dR, river: true, tx: -gy / gq, ty: gx / gq };
    return { d: dP, river: false, tx: -gpy / gp, ty: gpx / gp };
  }
  const waterD = (x, y) => waterAt(x, y).d;
  /** one Newton step onto the shore line (+ offset towards the land) */
  function snapShore(x, y, off) {
    const e = 1.2, d = waterD(x, y), gx = (waterD(x + e, y) - d) / e, gy = (waterD(x, y + e) - d) / e;
    const g2 = gx * gx + gy * gy || 1e-6, gl = Math.sqrt(g2);
    const k = d / g2;
    return [x - gx * k - (gx / gl) * off, y - gy * k - (gy / gl) * off];
  }

  /* ======================================================================
     4. Ground chunk shader: xuan paper + bleeding pale washes + bare water
     ====================================================================== */
  function sst(t) {
    if (t <= -1) return 0;
    if (t >= 1) return 1;
    const u = (t + 1) * 0.5;
    return u * u * (3 - 2 * u);
  }
  const GINK = [50, 47, 44];
  let IMG = null;
  const ST = 16;
  function* groundGen(ctx, info) {
    const res = info.res, W = info.px, wx = info.wx, wy = info.wy;
    const gr = Math.floor((W - 1) / ST) + 6, N = gr * gr;
    const fW = new Float32Array(N), fR = new Float32Array(N), fM = new Float32Array(N);
    const cH = new Float32Array(N), cD = new Float32Array(N);
    const sp = ST / res;
    for (let j = 0; j < gr; j++) {
      if ((j & 1) === 1) yield;
      const y = wy + (j - 2) * sp;
      for (let i = 0; i < gr; i++) {
        const x = wx + (i - 2) * sp, o = j * gr + i;
        fW[o] = fWater(x, y); fR[o] = fRiver(x, y); fM[o] = fMist(x, y);
        cH[o] = riverHW(x, y); cD[o] = fDen(x, y);
      }
    }
    yield;
    const dW = new Float32Array(N), dM = new Float32Array(N);
    const inv = 1 / (2 * sp);
    for (let j = 1; j < gr - 1; j++) {
      if ((j & 7) === 7) yield;
      for (let i = 1; i < gr - 1; i++) {
        const o = j * gr + i;
        let gx = (fW[o + 1] - fW[o - 1]) * inv, gy = (fW[o + gr] - fW[o - gr]) * inv;
        const dP = clamp((fW[o] - T_W) / Math.max(Math.sqrt(gx * gx + gy * gy), 1e-5), -60, 60);
        gx = (fR[o + 1] - fR[o - 1]) * inv; gy = (fR[o + gr] - fR[o - gr]) * inv;
        const dR = clamp(cH[o] - Math.abs(fR[o]) / Math.max(Math.sqrt(gx * gx + gy * gy), 1e-5), -60, 60);
        dW[o] = dP > dR ? dP : dR;
        gx = (fM[o + 1] - fM[o - 1]) * inv; gy = (fM[o + gr] - fM[o - gr]) * inv;
        dM[o] = clamp((fM[o] - T_M) / Math.max(Math.sqrt(gx * gx + gy * gy), 1e-5), -60, 60);
      }
    }
    const rW = new Float32Array(gr), rM = new Float32Array(gr), rD = new Float32Array(gr);
    if (!IMG || IMG.width !== W) IMG = ctx.createImageData(W, W);
    const img = IMG, d = img.data;
    const PR = PAPER[0], PGc = PAPER[1], PB = PAPER[2];
    const gx0 = info.cx * W, gy0 = info.cy * W;
    for (let py = 0; py < W; py++) {
      if ((py & 1) === 1) yield;
      const rf = py / ST + 2, r0 = rf | 0, fy = rf - r0;
      const o0 = r0 * gr, o1 = o0 + gr;
      for (let c = 0; c < gr; c++) {
        const a = o0 + c, b = o1 + c;
        rW[c] = dW[a] + (dW[b] - dW[a]) * fy;
        rM[c] = dM[a] + (dM[b] - dM[a]) * fy;
        rD[c] = cD[a] + (cD[b] - cD[a]) * fy;
      }
      const gy = gy0 + py;
      const rowP = (gy & 255) << 8, rowA = (gy & 511) << 9, rowB = ((gy + 211) & 511) << 9, rowF = (gy & 511) << 9;
      let o = py * W * 4;
      for (let px = 0; px < W; px++, o += 4) {
        const cf = px / ST + 2, c0 = cf | 0, fx = cf - c0, c1 = c0 + 1;
        const vW = rW[c0] + (rW[c1] - rW[c0]) * fx;
        const vM = rM[c0] + (rM[c1] - rM[c0]) * fx;
        const vD = rD[c0] + (rD[c1] - rD[c0]) * fx;
        const gx = gx0 + px;
        const P = PAP[rowP | (gx & 255)];
        const Gr = GRA[rowP | ((gx + 91) & 255)];
        const F = FIB[rowF | (gx & 511)];
        const wa = WA[rowA | (gx & 511)];
        const wb = WA[rowB | ((gx + 307) & 511)];
        // water: bare paper, a faint grey shore wash that thins towards open water
        const eW = vW + (wa - 0.5) * 4 + (P - 0.5) * 0.6;
        const inW = sst(eW / 1.2);
        const shoreD = inW * Math.exp(-(eW > 0 ? eW : 0) / 9) * (0.07 + 0.12 * clamp01((wb - 0.35) * 2.2));
        // pale ink wash on land: one hard edge where the wet ink dried, a long soft fade inwards,
        // feathered into the paper fibres
        const eM = vM + (wa - 0.5) * 18 + (F - 0.5) * 10;
        const land = 1 - inW;
        const soft = 1.5 + 12 * wb;
        const mM = sst(eM / soft) * land;
        const de = eM - 1.1;
        const rimM = Math.exp(-(de * de) / 1.6) * land * clamp01((wb - 0.4) * 3);
        const inner = Math.exp(-(eM > 0 ? eM : 0) / (10 + 26 * wa));
        let dens = mM * vD * (0.03 + 0.09 * inner) * (1 + (Gr - 0.5) * 1.0) + rimM * 0.055;
        dens += mM * clamp01((wb - 0.7) * 5) * 0.06;
        dens += shoreD;
        // banks: a wash on the land side, darkest at the water, fading away from it
        const bankK = clamp01((wa - 0.3) * 2.2);
        dens += land * Math.exp(-(eW < 0 ? -eW : 0) / (8 + 16 * wb)) * (0.04 + 0.13 * bankK) * (1 + (Gr - 0.5) * 0.8);
        // paper: tooth, fibres, a few aged foxing spots
        const fox = clamp01((wb - 0.88) * 7) * clamp01((wa - 0.55) * 3) * 0.015;
        const L = 0.966 + (P - 0.5) * 0.05 + (F - 0.5) * 0.12 * (1 - 0.45 * inW) + inW * 0.012 - fox;
        const kd = 1 - dens;
        d[o] = PR * L * kd + GINK[0] * dens;
        d[o + 1] = PGc * L * kd + GINK[1] * dens;
        d[o + 2] = PB * L * (1 - fox * 1.6) * kd + GINK[2] * dens;
        d[o + 3] = 255;
      }
    }
    for (let band = 0; band < W; band += 128) { ctx.putImageData(img, 0, 0, 0, band, W, Math.min(128, W - band)); yield; }
    yield* decals(ctx, info);
  }

  /* ---------- ground decals: a few brush marks on a lot of empty paper ---------- */
  function* scat(info, cell, seed, margin, fn, every) {
    every = every || 30;
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
  function grassTuft(ctx, x, y, r, s, tone, a) {
    const n = 2 + r.int(0, 3);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42 + (r.next() - 0.5) * 0.4;
      const len = (3 + r.next() * 4.5) * s;
      const bx = x + (i - (n - 1) / 2) * 0.5 * s;
      const tx = bx + Math.cos(ang) * len, ty = y + Math.sin(ang) * len;
      const bend = (r.next() < 0.5 ? -1 : 1) * (0.6 + r.next()) * s;
      brush(ctx, [[bx, y], [(bx + tx) / 2 + bend, (y + ty) / 2], [tx + bend * 0.8, ty + 0.4 * s]], { w: (0.55 + r.next() * 0.35) * s, c: tone, a, ta: 0.08, tb: 0.8, press: 0.35, wv: 0.1, steps: 4 }, r);
    }
  }
  function pebble(ctx, x, y, s, r, a) {
    const P = spline(blobPts(x, y, 1.6 * s, 1.05 * s, 0.18, r, 7), true, 4);
    trace(ctx, P);
    ctx.globalAlpha = 0.28 * a;
    ctx.fillStyle = T[3];
    ctx.fill();
    ctx.globalAlpha = 1;
    const b = bbox(P);
    brush(ctx, [[b.x0, b.cy + 0.2 * s], [b.x0 + b.w * 0.3, b.y0], [b.x1 - b.w * 0.15, b.y0 + 0.1 * s], [b.x1, b.cy]], { w: 0.55 * s, c: TONE[1], a: 0.85 * a, ta: 0.1, tb: 0.4, press: 0.4, steps: 4 }, r);
    brush(ctx, [[b.x1 - 0.2 * s, b.cy + 0.3 * s], [b.cx, b.y1], [b.x0 + 0.4 * s, b.cy + 0.6 * s]], { w: 0.32 * s, c: TONE[2], a: 0.7 * a, ta: 0, tb: 0.5, steps: 4 }, r);
  }
  function petal(ctx, x, y, s, rot, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(1, 0.72);
    ctx.globalAlpha = a;
    ctx.fillStyle = VERM_CSS;
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.78, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = VERM_DK;
    ctx.beginPath(); ctx.ellipse(-s * 0.25, 0, s * 0.45, s * 0.4, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  function* decals(ctx, info) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // long dry-brush strokes that suggest the lie of the land
    yield* scat(info, 120, 901, 90, (x, y, r) => {
      if (!r.chance(0.42)) return;
      if (waterD(x, y) > -8) return;
      const n = 1 + (r.next() < 0.45 ? 1 : 0) + (r.next() < 0.2 ? 1 : 0);
      const ang = (r.next() - 0.5) * 0.4;
      for (let i = 0; i < n; i++) {
        const L = 26 + r.next() * 46, ox = x + (r.next() - 0.5) * 16, oy = y + i * (5 + r.next() * 5);
        const ca = Math.cos(ang), sa = Math.sin(ang), sag = (r.next() - 0.35) * L * 0.12;
        const ex = ox + ca * L, ey = oy + sa * L;
        if (waterD(ex, ey) > -4) continue;
        brush(ctx, [[ox, oy], [(ox + ex) / 2 - sa * sag, (oy + ey) / 2 + ca * sag], [ex, ey]], {
          w: 1.8 + r.next() * 2.6, c: r.next() < 0.6 ? TONE[2] : TONE[3], c2: TONE[4], a: 0.38 + r.next() * 0.2, ta: 0.03, tb: 0.35, press: 0.6, dry: 0.8 + r.next() * 0.15, steps: 10, wv: 0.2, nb: 14, gs: 0.9,
        }, r);
      }
    }, 4);
    // shore: long broken strokes that follow the bank – the paper inside stays water
    yield* scat(info, 15, 902, 26, (x, y, r) => {
      const w = waterAt(x, y);
      if (w.d > 3 || w.d < -3) return;
      if (U.noise(x / 80, y / 80, 91) < 0.34 || !r.chance(0.5)) return;
      const L = 11 + r.next() * 20;
      const pts = [];
      for (let i = 0; i < 4; i++) {
        const t = i / 3 - 0.5;
        pts.push(snapShore(x + w.tx * L * t, y + w.ty * L * t, 0.6 + (r.next() - 0.5) * 0.8));
      }
      brush(ctx, pts, { w: 0.9 + r.next() * 1.5, c: r.next() < 0.55 ? TONE[1] : TONE[2], c2: TONE[3], a: 0.8, ta: 0.1, tb: 0.5, press: 0.5, dry: 0.35 + r.next() * 0.4, steps: 6, wv: 0.3 }, r);
    }, 12);
    // ripples: two or three flowing lines in open water
    yield* scat(info, 22, 903, 40, (x, y, r) => {
      const w = waterAt(x, y);
      if (w.d < 4 || !r.chance(w.river ? 0.6 : 0.36)) return;
      const L = Math.min(9 + r.next() * 26, w.d * 2.4);
      let dx = 1, dy = (r.next() - 0.5) * 0.18;
      if (w.river) { dx = w.tx; dy = w.ty; }
      const dl = hyp(dx, dy) || 1; dx /= dl; dy /= dl;
      const nx = -dy, ny = dx;
      const lines = r.next() < 0.35 ? 2 : 1;
      for (let k = 0; k < lines; k++) {
        const L2 = L * (k ? 0.6 : 1), off = k * 2.3, sh = k * L * 0.18;
        const pts = [];
        const ph = r.next() * TAU;
        for (let i = 0; i <= 4; i++) {
          const t = i / 4 - 0.5, wv = Math.sin(i * 1.7 + ph) * 0.7;
          pts.push([x + dx * (t * L2 + sh) + nx * (wv + off), y + dy * (t * L2 + sh) + ny * (wv + off)]);
        }
        brush(ctx, pts, { w: 0.55 + r.next() * 0.4, c: r.next() < 0.5 ? TONE[2] : TONE[3], a: 0.7, ta: 0.3, tb: 0.45, wv: 0.25, steps: 5 }, r);
      }
    }, 12);
    // reeds along the banks
    yield* scat(info, 22, 904, 26, (x, y, r) => {
      const d = waterD(x, y);
      if (d > 1.5 || d < -7 || U.noise(x / 90, y / 90, 92) < 0.5 || !r.chance(0.55)) return;
      const n = 4 + r.int(0, 4), lean = (r.next() - 0.5) * 0.5;
      for (let i = 0; i < n; i++) {
        const bx = x + (i - n / 2) * 1.1 + (r.next() - 0.5), h = 7 + r.next() * 9, a = lean + (r.next() - 0.5) * 0.5;
        const tx = bx + Math.sin(a) * h, ty = y - Math.cos(a) * h;
        brush(ctx, [[bx, y], [(bx + tx) / 2 + a * 1.5, (y + ty) / 2], [tx, ty]], { w: 0.5 + r.next() * 0.3, c: r.next() < 0.6 ? TONE[1] : TONE[2], a: 0.85, ta: 0, tb: 0.7, steps: 4 }, r);
        if (r.chance(0.25)) brush(ctx, [[tx - Math.sin(a) * 0.4, ty + 3], [tx, ty + 0.4]], { w: 1.2, c: TONE[0], a: 0.85, ta: 0.2, tb: 0.3 }, r);
      }
    }, 10);
    // grass tufts in loose clusters
    yield* scat(info, 14, 905, 10, (x, y, r) => {
      const g = fGrass(x, y);
      if (!r.chance(U.smoothstep(0.56, 0.84, g) * 0.42 + 0.012)) return;
      if (waterD(x, y) > -3) return;
      grassTuft(ctx, x, y, r, 0.8 + r.next() * 0.5, r.next() < 0.7 ? TONE[1] : TONE[2], 0.8);
    }, 25);
    // moss dots (dian)
    yield* scat(info, 24, 906, 6, (x, y, r) => {
      if (!r.chance(U.smoothstep(0.5, 0.8, fGrass(x, y)) * 0.3 + 0.03)) return;
      if (waterD(x, y) > -2) return;
      const n = 3 + r.int(0, 5);
      for (let i = 0; i < n; i++) dot(ctx, x + (r.next() - 0.5) * 7, y + (r.next() - 0.5) * 3.5, 0.35 + r.next() * 0.5, r.next() < 0.7 ? TONE[0] : TONE[1], 0.85, r, (r.next() - 0.5) * 0.8);
    }, 30);
    // pebbles (also stepping stones in the water)
    yield* scat(info, 44, 907, 8, (x, y, r) => {
      if (!r.chance(0.08)) return;
      const n = r.chance(0.3) ? 2 : 1;
      for (let i = 0; i < n; i++) pebble(ctx, x + i * 4, y + (r.next() - 0.5) * 2, 0.9 + r.next() * 1.3, r, 0.9);
    }, 20);
    // ink flicked from the brush
    yield* scat(info, 90, 908, 14, (x, y, r) => {
      if (!r.chance(0.16) || waterD(x, y) > -2) return;
      const dir = r.next() * TAU, n = 3 + r.int(0, 7);
      dot(ctx, x, y, 0.8 + r.next() * 0.8, TONE[0], 0.75, r);
      for (let i = 0; i < n; i++) {
        const dd = 2 + r.next() * 9, an = dir + (r.next() - 0.5) * 0.7;
        dot(ctx, x + Math.cos(an) * dd, y + Math.sin(an) * dd * 0.8, 0.12 + Math.pow(r.next(), 2) * 0.45, TONE[0], 0.7, r);
      }
    }, 20);
    // a few fallen vermilion petals
    yield* scat(info, 70, 909, 4, (x, y, r) => {
      if (!r.chance(0.12) || waterD(x, y) > 2) return;
      const n = 1 + r.int(0, 2);
      for (let i = 0; i < n; i++) petal(ctx, x + (r.next() - 0.5) * 6, y + (r.next() - 0.5) * 3, 0.7 + r.next() * 0.4, r.next() * TAU, 0.85);
    }, 30);
  }

  /* ======================================================================
     5. Props – few strokes each, value gives depth (pale = far)
     ====================================================================== */
  const PROPS = {};
  function baseWash(ctx, rx, ry, r, a) {
    wash(ctx, spline(blobPts(0, -0.4, rx, ry, 0.2, r, 10), true, 4), { c: T[4], gran: 0.55, feather: Math.max(1, ry * 0.5), alpha: a === undefined ? 0.45 : a });
  }
  function leaf(ctx, x, y, ang, L, w, tone, r, a) {
    const ex = x + Math.cos(ang) * L, ey = y + Math.sin(ang) * L;
    const bend = (r.next() - 0.5) * L * 0.18;
    brush(ctx, [[x, y], [(x + ex) / 2 - Math.sin(ang) * bend, (y + ey) / 2 + Math.cos(ang) * bend], [ex, ey]], { w, c: tone, a: a === undefined ? 0.95 : a, ta: 0.3, tb: 0.62, tp: 0.85, press: 0.15, wv: 0.08, steps: 5 }, r);
  }
  function bambooLeaves(ctx, x, y, side, r, tone, s) {
    // 个 / 介 groups: three to five leaves hanging from one point
    const n = 3 + r.int(0, 2);
    const base = Math.PI / 2 - side * (0.55 + r.next() * 0.5);
    for (let i = 0; i < n; i++) {
      const ang = base + (i - (n - 1) / 2) * (0.42 + r.next() * 0.15) * side + (r.next() - 0.5) * 0.2;
      leaf(ctx, x + (r.next() - 0.5), y + (r.next() - 0.5), ang, (7 + r.next() * 5) * s, (1.7 + r.next() * 0.8) * s, tone, r);
    }
  }
  function drawBamboo(ctx, r, n, H) {
    baseWash(ctx, 15, 3, r);
    const stalks = [];
    for (let i = 0; i < n; i++) stalks.push({ x: (i - (n - 1) / 2) * 5.2 + (r.next() - 0.5) * 2.5, h: H * (0.6 + r.next() * 0.4), lean: (r.next() - 0.5) * 0.16 + (i - (n - 1) / 2) * 0.06, back: i % 2 === 1, ph: r.next() * 9 });
    stalks.sort((a, b) => (b.back ? 1 : 0) - (a.back ? 1 : 0));
    for (const st of stalks) {
      const tone = st.back ? TONE[3] : TONE[1], c2 = st.back ? TONE[4] : TONE[2], lt = st.back ? TONE[3] : TONE[0];
      const xAt = (y) => st.x + st.lean * -y + Math.sin(-y / 28 + st.ph) * 0.9;
      let y = 0, seg = 0;
      const w0 = st.back ? 2.0 : 2.7;
      while (-y < st.h) {
        const len = Math.min(st.h + y, (seg === 0 ? 5 : 7.5) + r.next() * 3.5);
        if (len < 2) break;
        const y1 = y - len, k = 1 - 0.4 * (-y / st.h);
        brush(ctx, [[xAt(y), y - 0.45], [xAt(y - len / 2), y - len / 2], [xAt(y1), y1 + 0.45]], { w: w0 * k, c: tone, c2, a: 0.95, ta: 0, tb: 0, press: 0.22, wv: 0.03, dry: 0.12 + r.next() * 0.15, steps: 3 }, r);
        // node: a small dark hook across the joint
        const nx = xAt(y1);
        brush(ctx, [[nx - w0 * k * 0.62, y1 + 0.35], [nx, y1 - 0.3], [nx + w0 * k * 0.62, y1 + 0.35]], { w: 0.55, c: lt, a: 0.9, ta: 0.25, tb: 0.35, steps: 3 }, r);
        if (seg >= 2 && r.chance(0.5)) {
          const side = r.chance(0.5) ? 1 : -1, L = 6 + r.next() * 9, a = -Math.PI / 2 + side * (0.6 + r.next() * 0.5);
          const bx = nx + Math.cos(a) * L, by = y1 + Math.sin(a) * L;
          brush(ctx, [[nx, y1], [(nx + bx) / 2 + side * 0.6, (y1 + by) / 2], [bx, by]], { w: 0.5, c: tone, a: 0.9, ta: 0, tb: 0.4, steps: 4 }, r);
          bambooLeaves(ctx, bx, by, side, r, st.back ? TONE[3] : TONE[1], st.back ? 0.85 : 1);
          if (r.chance(0.5)) bambooLeaves(ctx, (nx + bx) / 2, (y1 + by) / 2, side, r, st.back ? TONE[4] : TONE[2], 0.8);
        }
        y = y1; seg++;
      }
      // crown
      bambooLeaves(ctx, xAt(y), y + 1, st.lean > 0 ? 1 : -1, r, st.back ? TONE[3] : TONE[0], 0.9);
    }
    for (let i = 0; i < 3; i++) grassTuft(ctx, (r.next() - 0.5) * 22, 0, r, 0.9, TONE[1], 0.85);
  }
  function blossom(ctx, x, y, s, r, kind) {
    if (kind === 'bud') {
      ctx.globalAlpha = 0.92; ctx.fillStyle = VERM_CSS;
      ctx.beginPath(); ctx.arc(x, y, 0.75 * s, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      dot(ctx, x - 0.2 * s, y + 0.75 * s, 0.38 * s, TONE[0], 0.9, r);
      return;
    }
    const rot = r.next() * TAU;
    for (let i = 0; i < 5; i++) {
      const a = rot + (i / 5) * TAU;
      const px = x + Math.cos(a) * 0.95 * s, py = y + Math.sin(a) * 0.95 * s;
      ctx.beginPath(); ctx.arc(px, py, 0.82 * s, 0, TAU);
      if (kind === 'outline') {
        ctx.lineWidth = 0.22 * s; ctx.strokeStyle = T[1]; ctx.globalAlpha = 0.85; ctx.stroke();
      } else {
        ctx.fillStyle = i % 2 ? VERM_CSS : 'rgb(214,72,48)'; ctx.globalAlpha = 0.9; ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (kind !== 'outline') {
      ctx.globalAlpha = 0.55; ctx.fillStyle = VERM_LT;
      ctx.beginPath(); ctx.arc(x, y, 0.7 * s, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // stamens: fine ink lines with dots
    for (let i = 0; i < 5; i++) {
      const a = rot + 0.3 + (i / 5) * TAU, L = (0.9 + r.next() * 0.5) * s;
      ctx.strokeStyle = T[0]; ctx.lineWidth = 0.12 * s; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
      ctx.globalAlpha = 1;
      dot(ctx, x + Math.cos(a) * L, y + Math.sin(a) * L, 0.2 * s, TONE[0], 0.9, r);
    }
  }
  function drawPlum(ctx, r, v) {
    baseWash(ctx, 14, 3, r);
    const flip = v === 1 ? -1 : 1;
    const tr = [[1, 0], [-1.6, -7], [1.6, -14], [-2.2, -21], [0.8, -27]].map((p) => [p[0] * flip, p[1]]);
    const spots = [];
    const branch = (x, y, ang, len, w, depth, tone) => {
      const pts = [[x, y]];
      let cx = x, cy = y, a = ang;
      for (let i = 0; i < 3; i++) {
        a += (r.next() - 0.5) * 0.8;
        cx += Math.cos(a) * len / 3; cy += Math.sin(a) * len / 3;
        pts.push([cx, cy]);
      }
      brush(ctx, pts, { w, c: tone, c2: TONE[3], a: 0.95, ta: 0, tb: 0.55, press: 0.3, dry: 0.3 + r.next() * 0.3, steps: 2 }, r);
      for (let i = 1; i < pts.length; i++) spots.push([pts[i][0], pts[i][1], depth]);
      if (depth < 2) {
        const k = 1 + r.int(0, 1);
        for (let i = 0; i < k; i++) {
          const p = pts[1 + r.int(0, 1)];
          branch(p[0], p[1], ang + (r.chance(0.5) ? 1 : -1) * (0.5 + r.next() * 0.5), len * 0.55, w * 0.55, depth + 1, depth === 0 ? TONE[1] : TONE[2]);
        }
      }
      // straight new shoots
      if (r.chance(0.7)) {
        const e = pts[pts.length - 1];
        const sa = -Math.PI / 2 + (r.next() - 0.5) * 0.7;
        brush(ctx, [[e[0], e[1]], [e[0] + Math.cos(sa) * len * 0.35, e[1] + Math.sin(sa) * len * 0.35]], { w: 0.4, c: TONE[1], a: 0.9, ta: 0, tb: 0.7 }, r);
      }
    };
    // pale far branch first, then the trunk on top
    branch(tr[2][0], tr[2][1], -Math.PI / 2 - flip * 1.1, 22, 1.6, 1, TONE[3]);
    brush(ctx, tr, { w: 5.2, c: TONE[1], c2: TONE[3], a: 0.96, ta: 0, tb: 0.25, press: 0.5, dry: 0.55, bleed: 0.25, steps: 5 }, r);
    brush(ctx, tr.map((p) => [p[0] + 1.3 * flip, p[1]]), { w: 1.4, c: TONE[0], a: 0.9, ta: 0.1, tb: 0.4, dry: 0.5, steps: 5 }, r);
    for (let i = 0; i < 4; i++) { const p = tr[1 + r.int(0, 3)]; dot(ctx, p[0] + (r.next() - 0.5) * 2, p[1] + (r.next() - 0.5) * 2, 0.7 + r.next() * 0.5, TONE[0], 0.95, r); }
    branch(tr[4][0], tr[4][1], -Math.PI / 2 + flip * 0.5, 24, 2.6, 0, TONE[1]);
    branch(tr[3][0], tr[3][1], -Math.PI / 2 + flip * 1.25, 26, 2.4, 0, TONE[1]);
    branch(tr[2][0], tr[2][1], -Math.PI / 2 - flip * 0.75, 18, 1.8, 1, TONE[2]);
    // blossoms along the branches: mostly vermilion, a few in outline, buds at tips
    let i = 0;
    for (const sp of spots) {
      if (!r.chance(sp[2] === 0 ? 0.55 : 0.75)) continue;
      const kind = r.chance(0.2) ? 'bud' : r.chance(0.22) ? 'outline' : 'red';
      blossom(ctx, sp[0] + (r.next() - 0.5) * 3, sp[1] + (r.next() - 0.5) * 3, 1.05 + r.next() * 0.4, r, kind);
      if (++i > 20) break;
    }
    for (let j = 0; j < 3; j++) petal(ctx, (r.next() - 0.5) * 20, (r.next() - 0.3) * 3, 0.7, r.next() * TAU, 0.85);
  }
  function needleWheel(ctx, x, y, R, r, tone, a) {
    const n = 13 + r.int(0, 6);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), ang = Math.PI + t * Math.PI + (r.next() - 0.5) * 0.12;
      const L = R * (0.75 + r.next() * 0.3);
      const sx = x + Math.cos(ang) * R * 0.12, sy = y + Math.sin(ang) * R * 0.08;
      brush(ctx, [[sx, sy], [x + Math.cos(ang) * L, y + Math.sin(ang) * L * 0.62]], { w: 0.46, c: tone, a, ta: 0.05, tb: 0.75, steps: 2 }, r);
    }
  }
  function drawPine(ctx, r, v) {
    baseWash(ctx, 16, 3.4, r);
    const flip = v === 1 ? -1 : 1;
    const tr = [[0, 0], [-2.4, -12], [2.6, -25], [-0.6, -38], [4.5, -50], [2.5, -58]].map((p) => [p[0] * flip, p[1]]);
    const clusters = [];
    const lv = [[2, -1], [3, 1], [4, -1], [1, 1]];
    for (const [ti, side] of lv) {
      const p = tr[ti], s = side * flip, L = 12 + r.next() * 9;
      const ex = p[0] + s * L, ey = p[1] - 2 - r.next() * 5;
      clusters.push({ x: ex, y: ey, R: 8 + r.next() * 3, from: p, s });
    }
    clusters.push({ x: tr[5][0], y: tr[5][1] - 1, R: 9, from: null, s: flip });
    // pale far clusters behind (depth)
    for (const c of clusters) {
      wash(ctx, spline(blobPts(c.x, c.y - 1.5, c.R * 1.25, c.R * 0.55, 0.2, r, 10), true, 4), { c: T[4], blobs: [{ x: c.x - c.R * 0.3, y: c.y - 2, rx: c.R * 0.6, ry: c.R * 0.3, c: T[3], a: 0.5, blur: 1.6 }], gran: 0.6, feather: 1.2, alpha: 0.6 });
      needleWheel(ctx, c.x - c.s * 3, c.y - 2.5, c.R * 0.8, r, TONE[3], 0.8);
    }
    brush(ctx, tr, { w: 4.4, c: TONE[1], c2: TONE[3], a: 0.95, ta: 0, tb: 0.2, press: 0.5, dry: 0.55, steps: 5, gs: 3 }, r);
    brush(ctx, tr.slice(0, 5).map((p) => [p[0] - 1.6 * flip, p[1]]), { w: 1.25, c: TONE[0], a: 0.9, ta: 0.05, tb: 0.4, dry: 0.55, steps: 5 }, r);
    // bark scales: small hooked dabs
    for (let i = 0; i < 14; i++) {
      const t = r.next() * 0.85, idx = Math.min(tr.length - 2, Math.floor(t * (tr.length - 1))), f = t * (tr.length - 1) - idx;
      const x = tr[idx][0] + (tr[idx + 1][0] - tr[idx][0]) * f + (r.next() - 0.5) * 2.4, y = tr[idx][1] + (tr[idx + 1][1] - tr[idx][1]) * f;
      brush(ctx, [[x - 0.9, y + 0.3], [x, y - 0.4], [x + 0.9, y + 0.2]], { w: 0.45, c: TONE[1], a: 0.8, ta: 0.2, tb: 0.4, steps: 2 }, r);
    }
    for (const c of clusters) {
      if (c.from) brush(ctx, [c.from, [(c.from[0] + c.x) / 2, (c.from[1] + c.y) / 2 + 1.5], [c.x, c.y]], { w: 1.5, c: TONE[1], a: 0.95, ta: 0, tb: 0.5, dry: 0.35, steps: 3 }, r);
      needleWheel(ctx, c.x, c.y, c.R, r, TONE[0], 0.92);
      needleWheel(ctx, c.x + c.s * c.R * 0.6, c.y + 1.2, c.R * 0.7, r, TONE[1], 0.9);
      for (let i = 0; i < 3; i++) dot(ctx, c.x + (r.next() - 0.5) * c.R, c.y - r.next() * 2, 0.4, TONE[0], 0.9, r);
    }
  }
  function rockShape(r, w, h, tall) {
    const pts = tall
      ? [[-w * 0.45, 0], [-w * 0.55, -h * 0.35], [-w * 0.3, -h * 0.7], [-w * 0.42, -h], [w * 0.1, -h * 0.92], [w * 0.45, -h * 0.62], [w * 0.35, -h * 0.3], [w * 0.5, 0]]
      : [[-w * 0.5, 0], [-w * 0.46, -h * 0.45], [-w * 0.2, -h * 0.95], [w * 0.12, -h], [w * 0.4, -h * 0.62], [w * 0.52, -h * 0.2], [w * 0.45, 0]];
    return spline(jit(pts, Math.min(w, h) * 0.05, r), true, 5);
  }
  function drawRock(ctx, r, v) {
    const tall = v === 2, s = v === 1 ? 1.5 : 1;
    const w = tall ? 13 : 18 * s, h = tall ? 24 : 11 * s;
    baseWash(ctx, w * 0.75, 2.6, r, 0.4);
    const P = rockShape(r, w, h, tall);
    wash(ctx, P, { c: T[4], blobs: [{ x: w * 0.2, y: -h * 0.3, rx: w * 0.35, ry: h * 0.35, c: T[3], a: 0.7, blur: 1.6 }, { x: -w * 0.2, y: -h * 0.75, rx: w * 0.25, ry: h * 0.15, c: PAPER_HI, a: 0.6, blur: 1.5 }], rim: 0.9, edge: T[3], rimA: 0.5, gran: 0.7, alpha: 0.95 });
    if (tall) {
      // scholar-rock holes
      for (const [hx, hy, hr] of [[-1.5, -h * 0.62, 2.2], [2.5, -h * 0.35, 1.5]]) {
        wash(ctx, spline(blobPts(hx, hy, hr, hr * 1.2, 0.15, r, 8), true, 4), { c: T[2], rim: 0.6, edge: T[1], rimA: 0.8, gran: 0.4 });
      }
    }
    const b = bbox(P);
    // contour: heavy on the left/top, light on the right, broken
    const n = P.length;
    const seg = (a, z) => { const out = []; for (let i = a; i <= z; i++) out.push(P[((i % n) + n) % n]); return out; };
    const top = Math.floor(n * 0.08), mid = Math.floor(n * 0.55);
    brush(ctx, seg(0, mid).filter((_, i) => i % 3 === 0), { w: 1.6 * Math.sqrt(s), c: TONE[1], c2: TONE[2], a: 0.95, ta: 0.05, tb: 0.35, press: 0.6, dry: 0.5, steps: 3 }, r);
    brush(ctx, seg(mid + 2, n - 2).filter((_, i) => i % 3 === 0), { w: 1.05 * Math.sqrt(s), c: TONE[2], a: 0.9, ta: 0.1, tb: 0.5, dry: 0.65, steps: 3 }, r);
    void top;
    // axe-cut texture strokes
    for (let i = 0; i < (tall ? 4 : 3 + s * 2); i++) {
      const x = b.x0 + b.w * (0.25 + r.next() * 0.55), y = b.y0 + b.h * (0.3 + r.next() * 0.5);
      brush(ctx, [[x, y], [x + 1.5 * s, y + 2.6 * s]], { w: 1.2 * s, c: r.next() < 0.5 ? TONE[2] : TONE[3], a: 0.75, ta: 0, tb: 0.5, press: 0.6, dry: 0.7, steps: 3 }, r);
    }
    // moss dots on the top
    for (let i = 0; i < 4 + r.int(0, 4); i++) {
      const p = P[Math.floor(n * (0.15 + r.next() * 0.45))];
      dot(ctx, p[0] + (r.next() - 0.5) * 1.5, p[1] + r.next() * 0.8, 0.45 + r.next() * 0.45, TONE[0], 0.95, r, (r.next() - 0.5) * 0.6);
    }
    brush(ctx, [[b.x0 - 2, 0.2], [b.cx, 0.6], [b.x1 + 3, 0.1]], { w: 1.1, c: TONE[2], a: 0.7, ta: 0.05, tb: 0.5, dry: 0.7, steps: 4 }, r);
    grassTuft(ctx, b.x0 + 1, 0.3, r, 0.8, TONE[1], 0.9);
    if (r.chance(0.6)) grassTuft(ctx, b.x1 - 1, 0.3, r, 0.7, TONE[2], 0.85);
  }
  /** horizontal ink dab (the "Mi dot" of mountain painting) */
  function dab(ctx, x, y, s, c, a, r) {
    ctx.globalAlpha = a;
    ctx.fillStyle = rgb(c);
    ctx.beginPath();
    ctx.ellipse(x, y, s * (1.3 + r.next() * 0.6), s * (0.45 + r.next() * 0.2), (r.next() - 0.5) * 0.35, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  function peak(ctx, cx, w, h, r, o) {
    // irregular crest: an envelope with sub-peaks and ledges, summit a little off centre
    const sharp = o.sharp || 1, pts = [], N = 16, sx = (r.next() - 0.5) * 0.3, ph = r.next() * 9;
    for (let i = 0; i <= N; i++) {
      const u = 1 - (i / N) * 2;                       // 1 (right) .. -1 (left)
      const d = Math.min(1, Math.abs(u - sx) / (1 + (u > sx ? -sx : sx)));
      const env = Math.pow(Math.max(0, 1 - Math.pow(d, 1.6)), 0.75 * sharp);
      const jag = 1 + 0.16 * Math.sin(u * 7 + ph) * (1 - env * 0.5) + 0.08 * Math.sin(u * 17 + ph * 2) + (r.next() - 0.5) * 0.06;
      pts.push([cx + u * w / 2, -h * env * jag]);
    }
    const P = spline(pts.concat([[cx - w / 2 - 2, 3], [cx + w / 2 + 2, 3]]), true, 5);
    wash(ctx, P, {
      c: rgb(o.c), blobs: [{ x: cx - w * 0.14, y: -h * 0.82, rx: w * 0.3, ry: h * 0.22, c: rgb(o.dk), a: 0.75, blur: 4 }, { x: cx + w * 0.22, y: -h * 0.5, rx: w * 0.2, ry: h * 0.3, c: PAPER_HI, a: 0.35, blur: 5 }],
      rim: 1.3, edge: rgb(o.dk), rimA: 0.35, gran: 0.8, fade: { y0: -h * (o.fade || 0.55), y1: -h * 0.02 }, feather: 1.1, alpha: o.a || 1,
    });
    // dabs gather along the crest and thin out downwards
    const nd = Math.round(w * 1.6 * (o.dots || 1));
    for (let i = 0; i < nd; i++) {
      const j = 1 + r.int(0, N - 3), t = r.next(), a = pts[j], b = pts[j + 1];
      const depth = Math.pow(r.next(), 2.4) * h * 0.45;
      const x = a[0] + (b[0] - a[0]) * t, top = a[1] + (b[1] - a[1]) * t;
      const y = top + depth + 1.1;
      if (top > -h * 0.22 || y > -h * (o.fade || 0.55) * 0.45) continue;
      dab(ctx, x + (r.next() - 0.5) * 2 * (x - cx) / w * depth * 0.3, y, (0.8 + r.next() * 0.9) * (o.ds || 1), depth < h * 0.08 ? o.dk : o.d2, 0.88 * (1 - depth / (h * 0.55)), r);
    }
    // a broken crest line
    const crest = pts.slice(2, N - 1).reverse();
    void sharp;
    brush(ctx, crest.slice(0, 7), { w: o.lw || 1.6, c: o.dk, a: 0.8, ta: 0.05, tb: 0.5, dry: 0.7, steps: 5, jit: 0.4 }, r);
    brush(ctx, crest.slice(7), { w: (o.lw || 1.6) * 0.7, c: o.dk, a: 0.6, ta: 0.1, tb: 0.6, dry: 0.8, steps: 5, jit: 0.4 }, r);
    return pts;
  }
  function tinyPine(ctx, x, y, h, r) {
    brush(ctx, [[x, y], [x + 0.2, y - h]], { w: 0.42, c: TONE[1], a: 0.92, ta: 0, tb: 0.5 }, r);
    for (let k = 0; k < 3; k++) brush(ctx, [[x - 1.5 + k * 0.3, y - h * (0.3 + k * 0.24)], [x + 1.5 - k * 0.3, y - h * (0.3 + k * 0.24) - 0.2]], { w: 0.75 - k * 0.12, c: TONE[0], a: 0.9, ta: 0.2, tb: 0.4 }, r);
  }
  function drawMountain(ctx, r, v) {
    const mist = (y, rx, ry) => wash(ctx, spline(blobPts(0, y, rx, ry, 0.12, r, 12), true, 4), { c: PAPER_HI, gran: 0, feather: 4, alpha: 0.85, op: 'source-atop' });
    if (v === 0) {
      // rounded Mi-style domes in three values: far pale, middle, near dark
      peak(ctx, 12, 64, 104, r, { c: TONE[4], dk: TONE[3], d2: TONE[4], sharp: 1.25, fade: 0.6, dots: 0.6 });
      mist(-40, 46, 7);
      const mid = peak(ctx, -14, 50, 74, r, { c: TONE[3], dk: TONE[1], d2: TONE[2], sharp: 1.1, fade: 0.55 });
      mist(-20, 44, 5);
      const near = peak(ctx, 16, 34, 38, r, { c: TONE[2], dk: TONE[0], d2: TONE[1], sharp: 0.9, fade: 0.5, ds: 0.9, lw: 2 });
      for (let i = 0; i < 3; i++) { const p = near[4 + i * 2]; tinyPine(ctx, p[0], p[1] + 1.5, 3.5 + r.next() * 2.5, r); }
      for (let i = 0; i < 2; i++) { const p = mid[3 + i * 4]; tinyPine(ctx, p[0], p[1] + 1.2, 3 + r.next() * 2, r); }
    } else {
      // craggy pinnacles with a waterfall between them
      peak(ctx, -16, 34, 112, r, { c: TONE[3], dk: TONE[1], d2: TONE[2], sharp: 2.1, fade: 0.65, dots: 0.7, ds: 0.8 });
      peak(ctx, 14, 40, 86, r, { c: TONE[2], dk: TONE[0], d2: TONE[1], sharp: 1.8, fade: 0.6, dots: 0.8, lw: 2.2 });
      // vertical texture strokes on the cliffs
      for (let i = 0; i < 9; i++) {
        const x = (i < 4 ? -16 : 14) + (r.next() - 0.5) * 18, y = -(i < 4 ? 90 : 70) * (0.55 + r.next() * 0.35), L = 14 + r.next() * 16;
        brush(ctx, [[x, y], [x + (r.next() - 0.5) * 3, y + L * 0.5], [x + (r.next() - 0.5) * 4, y + L]], { w: 0.8, c: r.next() < 0.5 ? TONE[0] : TONE[1], a: 0.6, ta: 0.1, tb: 0.6, dry: 0.6, steps: 4 }, r);
      }
      // the falling water: bare paper with three thin lines and a mist puff below
      wash(ctx, spline([[-3.6, -66], [-1.2, -66], [-0.4, -36], [-1.6, -12], [-4.6, -12], [-3.8, -36]], true, 4), { c: PAPER_HI, gran: 0, feather: 0.7, alpha: 0.95, op: 'source-atop' });
      for (let i = 0; i < 3; i++) brush(ctx, [[-3.2 + i * 0.8, -64], [-2.6 + i * 0.9, -40], [-3.4 + i * 1.0, -16]], { w: 0.3, c: TONE[3], a: 0.75, ta: 0.25, tb: 0.5 }, r);
      mist(-14, 40, 7);
      for (let i = 0; i < 3; i++) tinyPine(ctx, -22 + i * 5 + r.next() * 2, -92 + i * 14 + r.next() * 4, 3 + r.next() * 2.5, r);
    }
  }
  function drawHut(ctx, r) {
    baseWash(ctx, 17, 3, r);
    brush(ctx, [[-16, 0.3], [0, 0.8], [17, 0.2]], { w: 1.4, c: TONE[2], a: 0.8, ta: 0.05, tb: 0.4, dry: 0.65, steps: 4 }, r);
    // dark interior, a seated figure, posts
    wash(ctx, spline([[-10, -11], [10, -11], [10, -1], [-10, -1]], true, 2), { c: T[3], blobs: [{ x: 2, y: -6, rx: 6, ry: 4, c: T[2], a: 0.7, blur: 1.5 }], gran: 0.6, feather: 0.6, alpha: 0.75 });
    dot(ctx, 2, -6.2, 1.1, TONE[4], 1, r, 0);
    brush(ctx, [[0.5, -5], [2, -4.6], [3.6, -1.6], [0, -1.4]], { w: 1.2, c: TONE[4], a: 0.9, ta: 0, tb: 0.3 }, r);
    for (const x of [-10, -3.5, 3.5, 10]) brush(ctx, [[x, -11.5], [x + 0.2, -0.6]], { w: 0.75, c: TONE[1], a: 0.95, ta: 0, tb: 0.15, press: 0.3 }, r);
    // thatched roof
    const roof = [[-17, -10], [-8, -17], [-1, -24], [1.5, -24.3], [9, -17], [18, -10.5], [0, -11.8]];
    wash(ctx, spline(roof, true, 4), { c: T[3], blobs: [{ x: -6, y: -15, rx: 6, ry: 4, c: T[2], a: 0.7, blur: 1.4 }], rim: 0.8, edge: T[2], gran: 0.7, alpha: 0.9 });
    for (let i = 0; i < 11; i++) {
      const t = i / 10, x0 = -15 + t * 31, y0 = -11 - (1 - Math.abs(t - 0.53) * 1.9) * 12;
      brush(ctx, [[x0 * 0.55, y0 - 1], [x0, -11.5]], { w: 0.9, c: TONE[1], a: 0.7, ta: 0.1, tb: 0.5, dry: 0.6 }, r);
    }
    brush(ctx, [[-18, -9.2], [-9, -16.6], [-0.5, -24.4], [2, -24.4]], { w: 1.8, c: TONE[0], a: 0.95, ta: 0.05, tb: 0.15, press: 0.4, dry: 0.4, steps: 4 }, r);
    brush(ctx, [[2, -24.2], [9.5, -17.2], [19, -10.2]], { w: 1.4, c: TONE[1], a: 0.9, ta: 0, tb: 0.35, dry: 0.5, steps: 4 }, r);
    brush(ctx, [[-17.5, -9.6], [0, -11.6], [18.5, -10.2]], { w: 0.9, c: TONE[1], a: 0.85, ta: 0.1, tb: 0.3, dry: 0.4, steps: 4 }, r);
  }
  function drawReeds(ctx, r) {
    baseWash(ctx, 10, 2.4, r, 0.4);
    const n = 9 + r.int(0, 4);
    for (let i = 0; i < n; i++) {
      const bx = (i - n / 2) * 1.2 + (r.next() - 0.5) * 1.5, h = 12 + r.next() * 14, a = (r.next() - 0.5) * 0.7 + (bx > 0 ? 0.15 : -0.15);
      const tx = bx + Math.sin(a) * h, ty = -Math.cos(a) * h;
      const far = r.chance(0.35);
      brush(ctx, [[bx, 0], [(bx + tx) / 2 + a * 2.5, ty / 2], [tx + a * 3, ty + 1]], { w: far ? 0.7 : 1.0, c: far ? TONE[3] : TONE[1], a: 0.92, ta: 0, tb: 0.75, tp: 0.8, steps: 5 }, r);
      if (r.chance(0.35)) {
        // feathery plume
        for (let k = 0; k < 4; k++) brush(ctx, [[tx, ty], [tx + Math.sin(a + 0.5 - k * 0.3) * 3.5, ty - Math.cos(a + 0.5 - k * 0.3) * 3.5]], { w: 0.9, c: TONE[2], a: 0.7, ta: 0, tb: 0.6, dry: 0.8 }, r);
      }
    }
  }
  function drawOrchid(ctx, r) {
    baseWash(ctx, 12, 2.4, r, 0.35);
    const n = 6 + r.int(0, 3);
    for (let i = 0; i < n; i++) {
      // long leaves rise, swell ("mantis belly"), thin out and bow outward at the tip
      const side = i % 2 ? 1 : -1, L = 14 + r.next() * 13, a = -Math.PI / 2 + side * (0.12 + r.next() * 0.75);
      const pts = [[0, 0]];
      let x = 0, y = 0, ang = a;
      for (let k = 0; k < 4; k++) {
        ang += side * (0.12 + r.next() * 0.18) * (k > 1 ? 1.8 : 1);
        x += Math.cos(ang) * L / 4; y += Math.sin(ang) * L / 4;
        pts.push([x, y]);
      }
      brush(ctx, pts, { w: 1.0 + r.next() * 0.45, c: i < 2 ? TONE[2] : TONE[0], a: 0.93, ta: 0.15, tb: 0.55, wv: 0.4, steps: 7 }, r);
    }
    for (let f = 0; f < 2; f++) {
      const fx = (f ? 4 : -3) + (r.next() - 0.5) * 2, fy = -9 - r.next() * 5;
      brush(ctx, [[0, 0], [fx * 0.5, fy * 0.6], [fx, fy]], { w: 0.35, c: TONE[2], a: 0.8, ta: 0, tb: 0.3 }, r);
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k - 2) * 0.55;
        brush(ctx, [[fx, fy], [fx + Math.cos(a) * 2.6, fy + Math.sin(a) * 2.6]], { w: 1.1, c: TONE[3], a: 0.85, ta: 0.3, tb: 0.5, tp: 0.8 }, r);
      }
      for (let k = 0; k < 3; k++) dot(ctx, fx + (k - 1) * 0.6, fy - 0.4 + Math.abs(k - 1) * 0.3, 0.28, TONE[0], 1, r);
    }
    for (let i = 0; i < 3; i++) dot(ctx, (r.next() - 0.5) * 3, 0, 0.5, TONE[0], 0.9, r, 0);
  }
  function buildProps() {
    const mk = (wu, hu, ax, ay, fn, seed) => { const s = mkSprite(wu, hu, ax, ay, K); fn(s.ctx, U.rng(seed)); return finish(s, { flash: false, paper: 0.35 }); };
    PROPS.bamboo = [0, 1, 2].map((v) => mk(62, 96, 31, 92, (c, r) => drawBamboo(c, r, 3 + v, 64 + v * 10), 1100 + v));
    PROPS.plum = [0, 1].map((v) => mk(72, 66, 36, 62, (c, r) => drawPlum(c, r, v), 1200 + v));
    PROPS.pine = [0, 1].map((v) => mk(76, 80, 38, 76, (c, r) => drawPine(c, r, v), 1300 + v));
    PROPS.rock = [0, 1, 2].map((v) => mk(38, 30, 19, 27, (c, r) => drawRock(c, r, v), 1400 + v));
    PROPS.mountain = [0, 1].map((v) => mk(96, 124, 48, 120, (c, r) => drawMountain(c, r, v), 1500 + v));
    PROPS.hut = [mk(42, 30, 21, 27, (c, r) => drawHut(c, r), 1600)];
    PROPS.reeds = [0, 1].map((v) => mk(34, 32, 17, 29, (c, r) => drawReeds(c, r), 1700 + v));
    PROPS.orchid = [0, 1].map((v) => mk(46, 30, 23, 27, (c, r) => drawOrchid(c, r), 1800 + v));
  }

  /* ======================================================================
     6. Characters – a handful of strokes each, read by value contrast
     ====================================================================== */
  const SPR = {};
  const HEIGHT = { creeper: 15, ghost: 22, colossus: 42 };
  const VERM_D = [160, 38, 24];
  const PAPER_HI_RGB = [249, 244, 232];
  function eye(ctx, x, y, rr, look) {
    ctx.fillStyle = PAPER_HI;
    ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 1.1, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(x + rr * (look === undefined ? 0.35 : look), y + 0.1 * rr, rr * 0.52, 0, TAU); ctx.fill();
  }
  function arcPts(cx, cy, rx, ry, a0, a1, n) {
    const out = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return out;
  }

  /* ---------- main character: a wandering calligrapher with a giant brush and a vermilion sash ---------- */
  function drawSage(ctx, pose, r) {
    const walk = pose.ph !== null;
    const s = walk ? Math.sin(pose.ph) : 0, c = walk ? Math.cos(pose.ph) : 0;
    const wave = pose.wave, br = pose.br || 0;
    // the giant brush carried across the back, bristles up
    brush(ctx, [[-7.6, -2.4], [-0.8, -18], [5.9, -33.2]], { w: 1.25, c: TONE[2], c2: TONE[3], a: 0.96, ta: 0, tb: 0, wv: 0.03, steps: 3 }, r);
    for (const t of [0.12, 0.42, 0.72]) { const x = -7.6 + t * 13.5, y = -2.4 - t * 30.8; brush(ctx, [[x - 0.8, y + 0.2], [x + 0.8, y - 0.25]], { w: 0.55, c: TONE[0], ta: 0.2, tb: 0.3 }, r); }
    brush(ctx, [[5.6, -32.6], [6.5, -34.6]], { w: 1.9, c: TONE[1], ta: 0, tb: 0 }, r);
    brush(ctx, [[6.3, -34.2], [7.4, -37], [8.6, -40.2]], { w: 2.9, c: TONE[0], c2: TONE[2], a: 1, ta: 0, tb: 0.8, tp: 0.75, press: 0.35, dry: 0.35, bleed: 0.35 }, r);
    // sash tails flowing back
    brush(ctx, [[-2, -12.9], [-5.8, -12.3 + wave * 0.6], [-9.4, -11.4 - wave * 0.9], [-13.2, -10.2 + wave * 1.2]], { w: 1.8, c: VERM, c2: VERM_D, a: 0.96, ta: 0, tb: 0.6, wv: 0.25, steps: 6 }, r);
    brush(ctx, [[-2, -12.2], [-5.2, -10.5 - wave * 0.5], [-8.4, -9.2 + wave * 0.8], [-11, -8.2 - wave * 0.7]], { w: 1.35, c: VERM, c2: VERM_D, a: 0.92, ta: 0, tb: 0.65, wv: 0.25, steps: 6 }, r);
    // legs and sandals
    const lift = (v) => (walk ? Math.max(0, v) * 1.5 : 0);
    for (const [hx, dx, li, back] of [[-1.7, -2.5 * s, lift(-c), 1], [1.7, 2.5 * s, lift(c), 0]]) {
      const fx = hx + dx, fy = -0.8 - li;
      brush(ctx, [[hx * 0.7, -7.6], [hx + dx * 0.55, -4.1], [fx, fy - 0.5]], { w: 2.4, c: back ? TONE[2] : TONE[1], a: 0.96, ta: 0, tb: 0.1, dry: 0.3, steps: 4 }, r);
      dab(ctx, fx + 0.9, fy + 0.1, 0.95, TONE[0], 0.95, r);
    }
    // robe: a pale wash given its form by a few bold, dry strokes
    const robe = [[-3.4, -21.2 - br], [0.2, -21.8 - br], [3.4, -21.0 - br], [4.8, -17], [5.4, -11.6], [6.6 + s * 0.4, -5.6], [2.2, -4.6], [-2.2, -4.9], [-6.9 - s * 0.4, -5.4], [-5.9, -11.4], [-5.1, -17.2]];
    wash(ctx, spline(jit(robe, 0.12, r), true, 5), {
      c: T[4], blobs: [{ x: 3.6, y: -9.5, rx: 3, ry: 5, c: T[3], a: 0.8, blur: 1.6 }, { x: -4.2, y: -8, rx: 2.4, ry: 3.5, c: T[3], a: 0.6, blur: 1.4 }, { x: -1, y: -15, rx: 2.5, ry: 2.5, c: PAPER_HI, a: 0.4, blur: 1.4 }],
      rim: 0.7, edge: T[3], rimA: 0.5, gran: 0.6, bleed: 0.7, bleedA: 0.25,
    });
    brush(ctx, [[-3.2, -21.4 - br], [-5.3, -16.4], [-6.1, -10.4], [-7.4 - s * 0.4, -5.0]], { w: 3.0, c: TONE[0], c2: TONE[3], a: 0.96, ta: 0.05, tb: 0.25, press: 0.6, dry: 0.6, steps: 6, wv: 0.18 }, r);
    brush(ctx, [[3.6, -20.8 - br], [5.0, -16.0], [5.6, -10.8], [7.0 + s * 0.4, -5.5]], { w: 1.4, c: TONE[1], c2: TONE[3], a: 0.9, ta: 0.05, tb: 0.4, dry: 0.55, steps: 5 }, r);
    brush(ctx, [[-7.0, -5.2], [-2.2, -4.3], [2.4, -4.6], [7.0, -5.5]], { w: 1.1, c: TONE[1], c2: TONE[3], a: 0.85, ta: 0.1, tb: 0.3, dry: 0.65, steps: 4 }, r);
    brush(ctx, [[1.0, -11.4], [1.7, -8.2], [1.1, -5.0]], { w: 1.0, c: TONE[1], a: 0.85, ta: 0.15, tb: 0.5, dry: 0.5 }, r);
    brush(ctx, [[-2.4, -10.8], [-3.0, -7.6], [-3.8, -5.2]], { w: 0.8, c: TONE[2], a: 0.8, ta: 0.15, tb: 0.5, dry: 0.5 }, r);
    // collar: a dark V
    brush(ctx, [[-2.4, -21.4 - br], [0.6, -17.0]], { w: 1.0, c: TONE[0], a: 0.95, ta: 0.05, tb: 0.35, press: 0.4 }, r);
    brush(ctx, [[0.8, -17.2], [3.2, -21.0 - br]], { w: 0.7, c: TONE[1], a: 0.9, ta: 0.1, tb: 0.3 }, r);
    // vermilion sash
    brush(ctx, [[-5.8, -13.3], [0, -12.4], [5.7, -13.1]], { w: 2.1, c: VERM, c2: VERM_D, a: 0.98, ta: 0, tb: 0.04, press: 0.3, steps: 4 }, r);
    dot(ctx, -1.9, -12.7, 0.95, VERM_D, 1, r, 0);
    // front sleeve, swinging: one sweeping stroke over a pale wash
    const sw = s * 1.1;
    const SL = [[2.4, -20.4 - br], [5.2, -19.4], [7.4 + sw, -14.6], [7.8 + sw, -12.2], [5.0 + sw * 0.6, -12.6], [3.6, -16.4]];
    wash(ctx, spline(jit(SL, 0.1, r), true, 4), { c: T[4], blobs: [{ x: 6, y: -14, rx: 2, ry: 2.5, c: T[3], a: 0.8, blur: 1 }], rim: 0.6, edge: T[3], gran: 0.5 });
    brush(ctx, [[2.8, -20.6 - br], [5.8, -19.0], [7.6 + sw, -14.4], [8.1 + sw, -11.9]], { w: 2.2, c: TONE[0], c2: TONE[3], a: 0.95, ta: 0.05, tb: 0.35, press: 0.5, dry: 0.55, steps: 5 }, r);
    brush(ctx, [[4.8 + sw * 0.6, -12.6], [8.0 + sw, -12.0]], { w: 0.8, c: TONE[1], ta: 0.1, tb: 0.2 }, r);
    ctx.fillStyle = PAPER_HI; ctx.beginPath(); ctx.ellipse(7.2 + sw, -11.2, 1.0, 0.9, 0, 0, TAU); ctx.fill();
    brush(ctx, arcPts(7.2 + sw, -11.2, 1.0, 0.9, -0.3, 2.6, 5), { w: 0.35, c: TONE[1], a: 0.9, ta: 0.1, tb: 0.4 }, r);
    // head: bare paper face in one contour, hair gathered into a topknot with a vermilion tie
    const hx = 1.1, hy = -25 - br, R = 3.3;
    ctx.fillStyle = PAPER_HI; ctx.beginPath(); ctx.ellipse(hx, hy, R, R * 1.08, 0, 0, TAU); ctx.fill();
    brush(ctx, arcPts(hx, hy, R, R * 1.08, -0.6, 2.2, 6), { w: 0.6, c: TONE[1], a: 0.92, ta: 0.15, tb: 0.45 }, r);
    const hair = [[hx - 0.6, hy - R - 0.3], [hx + 2.0, hy - R + 0.1], [hx + 3.1, hy - 1.9], [hx + 1.0, hy - 2.3], [hx - 0.9, hy - 0.9], [hx - 1.4, hy + 1.6], [hx - 1.1, hy + 3.0], [hx - 3.1, hy + 2.1], [hx - 3.7, hy - 0.9], [hx - 2.8, hy - 3.0]];
    wash(ctx, spline(jit(hair, 0.08, r), true, 4), { c: T[0], blobs: [{ x: hx - 1.2, y: hy - 2.3, rx: 1.4, ry: 0.9, c: T[2], a: 0.5, blur: 0.6 }], gran: 0.3, bleed: 0.45, bleedA: 0.35 });
    dot(ctx, hx - 0.6, hy - R - 1.5, 1.45, TONE[0], 1, r, 0);
    brush(ctx, [[hx - 1.9, hy - R - 0.4], [hx - 0.6, hy - R], [hx + 0.7, hy - R - 0.6]], { w: 0.75, c: VERM, a: 1, ta: 0, tb: 0.1 }, r);
    brush(ctx, [[hx - 1.8, hy - R - 0.3], [hx - 3.8, hy - R + 0.9 + wave * 0.4], [hx - 5.6, hy - R + 1.8 - wave * 0.5]], { w: 0.65, c: VERM, a: 0.95, ta: 0, tb: 0.6 }, r);
    brush(ctx, [[hx + 1.4, hy - 0.1], [hx + 2.4, hy - 0.3]], { w: 0.6, c: TONE[0], ta: 0.1, tb: 0.4, press: 0.5 }, r);
    brush(ctx, [[hx + 0.9, hy - 1.4], [hx + 2.1, hy - 1.8], [hx + 2.8, hy - 1.6]], { w: 0.45, c: TONE[0], ta: 0.1, tb: 0.5 }, r);
    brush(ctx, [[hx + R - 0.15, hy + 0.4], [hx + R + 0.3, hy + 1.1], [hx + R - 0.1, hy + 1.4]], { w: 0.35, c: TONE[1], ta: 0.1, tb: 0.3 }, r);
  }

  /* ---------- small creature: an ink blot with legs and two bare-paper eyes ---------- */
  function drawBlot(ctx, pose, r, v) {
    const s = Math.sin(pose.ph), c = Math.cos(pose.ph);
    const sq = 1 + c * 0.06, by = -7.2 - Math.abs(s) * 0.7;
    for (let i = 0; i < 4; i++) {
      const lx = -4.2 + i * 2.8, ph = i % 2 ? s : -s;
      brush(ctx, [[lx * 0.8, by + 4], [lx + ph * 1.3, -0.4 - Math.max(0, ph) * 0.9]], { w: 1.1, c: TONE[0], a: 0.95, ta: 0, tb: 0.45, press: 0.3 }, r);
    }
    if (v) brush(ctx, [[-6.2, by + 1], [-9.6, by - 1.5 + s * 0.6], [-10.2, by - 5], [-8.2, by - 6.2 + c * 0.5]], { w: 1.4, c: TONE[1], a: 0.95, ta: 0, tb: 0.7, dry: 0.4, steps: 5 }, r);
    const P = spline(blobPts(0, by, 7.6 * sq, 6.3 / sq, 0.1, r, 14), true, 4);
    wash(ctx, P, {
      c: v ? T[2] : T[0],
      blobs: v
        ? [{ x: -2, y: by - 2, rx: 3, ry: 2.5, c: T[1], a: 0.85, blur: 1.4 }, { x: 3, y: by + 2.5, rx: 3, ry: 2, c: T[3], a: 0.6, blur: 1.4 }]
        : [{ x: 2.5, y: by + 2.4, rx: 3.6, ry: 2.2, c: T[2], a: 0.5, blur: 1.6 }, { x: -3, y: by - 2.5, rx: 2.5, ry: 2, c: T[1], a: 0.4, blur: 1.2 }],
      rim: 1.0, edge: T[0], rimA: 0.75, rimBlur: 0.5, gran: 0.45, bleed: 1.1, bleedA: 0.4,
    });
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * (0.16 + (i / 6) * 0.68) + (r.next() - 0.5) * 0.15;
      const x0 = Math.cos(a) * 6.4 * sq, y0 = by + Math.sin(a) * 5.2 / sq, L = 2 + r.next() * 2.3;
      brush(ctx, [[x0, y0], [x0 + Math.cos(a) * L, y0 + Math.sin(a) * L]], { w: 1.05, c: TONE[0], a: 0.95, ta: 0, tb: 0.8, dry: 0.35 }, r);
    }
    for (let i = 0; i < 3; i++) { const a = -0.4 - r.next() * 2.4; dot(ctx, Math.cos(a) * 9.6, by + Math.sin(a) * 7.8, 0.35 + r.next() * 0.4, TONE[0], 0.85, r); }
    eye(ctx, 3.5, by - 1.3, 1.8);
    eye(ctx, -0.1, by - 1.6, 1.5);
  }

  /* ---------- fast creature: a wisp of pale ink smoke ---------- */
  function drawWisp(ctx, pose, r) {
    const s = Math.sin(pose.ph), c = Math.cos(pose.ph);
    const hx = 0.6, hy = -16;
    brush(ctx, [[hx - 0.5, hy + 3], [hx - 2.6 + s * 0.8, hy + 7.5], [hx - 4.7 + c * 0.9, hy + 11], [hx - 3.0 + s, hy + 14.2], [hx + 0.2, hy + 13.4], [hx - 0.7 + c * 0.4, hy + 11.6]], { w: 3.6, c: TONE[3], c2: TONE[4], a: 0.88, ta: 0, tb: 0.85, dry: 0.45, steps: 6, bleed: 0.8 }, r);
    const head = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; head.push([hx + Math.cos(a) * 5.2, hy + Math.sin(a) * 4.9]); }
    head[3] = [hx + 0.8, hy + 6.6]; head[4] = [hx - 2.8, hy + 7.6];
    wash(ctx, spline(jit(head, 0.25, r), true, 4), {
      c: T[4], blobs: [{ x: hx + 1.6, y: hy - 1.6, rx: 3, ry: 2.6, c: PAPER_HI, a: 0.65, blur: 1.4 }, { x: hx - 2, y: hy + 4, rx: 3, ry: 2.4, c: T[3], a: 0.75, blur: 1.4 }],
      rim: 1.0, edge: T[2], rimA: 0.65, gran: 0.5, feather: 0.45, bleed: 1.2, bleedA: 0.3,
    });
    brush(ctx, [[hx - 3, hy + 2.2], [hx - 1, hy + 3.8], [hx + 2, hy + 3], [hx + 2.6, hy + 1]], { w: 0.6, c: TONE[2], a: 0.75, ta: 0.2, tb: 0.5 }, r);
    brush(ctx, arcPts(hx, hy, 5.3, 5.0, -2.0, 1.1, 7), { w: 0.85, c: TONE[1], c2: TONE[2], a: 0.88, ta: 0.2, tb: 0.5, dry: 0.3 }, r);
    brush(ctx, [[hx + 0.7, hy - 1.1], [hx + 1.9, hy - 0.5]], { w: 1.0, c: TONE[0], ta: 0.1, tb: 0.3, press: 0.5 }, r);
    brush(ctx, [[hx + 3.0, hy - 0.5], [hx + 4.0, hy - 1.0]], { w: 0.9, c: TONE[0], ta: 0.1, tb: 0.3, press: 0.5 }, r);
    dot(ctx, hx + 2.7, hy + 1.7, 0.5, TONE[1], 0.9, r, 0);
    brush(ctx, [[hx - 2, hy - 5], [hx - 3.4, hy - 7.2 + s * 0.5], [hx - 2.2, hy - 8.8]], { w: 0.75, c: TONE[3], a: 0.7, ta: 0.1, tb: 0.6, dry: 0.4 }, r);
  }

  /* ---------- large creature: a shaggy beast of splashed ink with horns ---------- */
  function drawBeast(ctx, pose, r) {
    const s = Math.sin(pose.ph), c = Math.cos(pose.ph);
    const by = -18.5 - Math.abs(c) * 0.7;
    for (const [lx, ph] of [[-9, s], [5, -s]]) brush(ctx, [[lx, by + 6], [lx + ph * 2.2 - 0.6, -5.2], [lx + ph * 3, -0.7]], { w: 4.6, c: TONE[2], a: 0.95, ta: 0, tb: 0.05, dry: 0.4, steps: 4 }, r);
    brush(ctx, [[-13.5, by - 1], [-19.5, by - 6 + s], [-21.5, by - 14], [-18, by - 18 + c]], { w: 3.9, c: TONE[0], c2: TONE[2], a: 0.95, ta: 0, tb: 0.75, press: 0.3, dry: 0.65, steps: 6 }, r);
    wash(ctx, spline(blobPts(-1, by, 16.5, 12.3, 0.1, r, 16), true, 4), {
      c: T[0], blobs: [{ x: -6, y: by + 4, rx: 6, ry: 4, c: T[2], a: 0.6, blur: 2.4 }, { x: 4, y: by - 6, rx: 5, ry: 3, c: T[1], a: 0.6, blur: 2 }, { x: -10, y: by - 4, rx: 3.5, ry: 2.5, c: T[3], a: 0.45, blur: 1.8 }],
      rim: 1.5, edge: T[0], rimA: 0.7, gran: 0.5, bleed: 2.2, bleedA: 0.45,
    });
    // dry-brush fur along the back
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * (0.55 + (i / 8) * 0.42), x0 = -1 + Math.cos(a) * 15, y0 = by + Math.sin(a) * 11.4, L = 3 + r.next() * 3;
      brush(ctx, [[x0, y0], [x0 + Math.cos(a - 0.4) * L, y0 + Math.sin(a - 0.4) * L]], { w: 1.8, c: TONE[0], a: 0.9, ta: 0, tb: 0.8, dry: 0.55 }, r);
    }
    const hx = 10, hy = by - 6;
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI * 0.95 + (i / 15) * Math.PI * 1.25 + (r.next() - 0.5) * 0.15, R0 = 6, L = 5 + r.next() * 5;
      brush(ctx, [[hx + Math.cos(a) * R0 * 0.6, hy + Math.sin(a) * R0 * 0.6], [hx + Math.cos(a) * (R0 + L * 0.5), hy + Math.sin(a) * (R0 + L * 0.5) + 0.4], [hx + Math.cos(a + 0.2) * (R0 + L), hy + Math.sin(a + 0.2) * (R0 + L)]], { w: 2.4, c: TONE[0], c2: TONE[2], a: 0.95, ta: 0, tb: 0.8, dry: 0.6, steps: 3 }, r);
    }
    for (const [lx, ph] of [[-5, -s], [9.5, s]]) {
      const fx = lx + ph * 3, fy = -0.6 - Math.max(0, ph) * 1.2;
      brush(ctx, [[lx, by + 5], [lx + ph * 2.2 + 0.5, -5.5], [fx, fy]], { w: 5.2, c: TONE[0], c2: TONE[1], a: 0.97, ta: 0, tb: 0.05, dry: 0.35, steps: 4 }, r);
      for (let k = 0; k < 3; k++) brush(ctx, [[fx + 1 + k * 1.1, fy - 0.6], [fx + 2 + k * 1.2, fy + 0.4]], { w: 0.6, c: TONE[1], ta: 0, tb: 0.6 }, r);
    }
    wash(ctx, spline(blobPts(hx + 2.2, hy + 1, 6.2, 5.4, 0.1, r, 12), true, 4), { c: T[2], blobs: [{ x: hx + 3, y: hy - 1, rx: 3, ry: 2, c: T[3], a: 0.6, blur: 1 }], rim: 0.9, edge: T[0], rimA: 0.6, gran: 0.5 });
    brush(ctx, [[hx - 1, hy - 4.4], [hx - 4, hy - 9], [hx - 8.5, hy - 10.6], [hx - 10.2, hy - 8.6]], { w: 2.2, c: TONE[3], c2: TONE[2], a: 0.98, ta: 0, tb: 0.75, press: 0.3, steps: 5 }, r);
    brush(ctx, [[hx + 3, hy - 4.8], [hx + 1.6, hy - 10], [hx - 2, hy - 12.6], [hx - 3.8, hy - 11]], { w: 2.5, c: TONE[4], c2: TONE[3], a: 1, ta: 0, tb: 0.75, press: 0.3, steps: 5 }, r);
    brush(ctx, [[hx + 3.6, hy - 4.6], [hx + 2.4, hy - 10.2], [hx - 1.6, hy - 13.2]], { w: 0.55, c: TONE[0], a: 0.9, ta: 0.1, tb: 0.6, steps: 4 }, r);
    brush(ctx, [[hx + 0.4, hy - 2.7], [hx + 3, hy - 1.5], [hx + 5.8, hy - 2.5]], { w: 1.6, c: TONE[0], ta: 0.1, tb: 0.5, press: 0.6 }, r);
    eye(ctx, hx + 4.8, hy - 0.4, 1.55, 0.45);
    eye(ctx, hx + 1.5, hy - 0.2, 1.3, 0.45);
    brush(ctx, [[hx + 1, hy + 3.4], [hx + 4, hy + 4.3], [hx + 7.6, hy + 3.2]], { w: 1.25, c: TONE[0], ta: 0.1, tb: 0.4 }, r);
    for (const fx of [hx + 2.6, hx + 5.8]) {
      ctx.beginPath(); ctx.moveTo(fx - 0.8, hy + 3.9); ctx.lineTo(fx, hy + 6.2); ctx.lineTo(fx + 0.8, hy + 3.9); ctx.closePath();
      ctx.fillStyle = PAPER_HI; ctx.fill(); ctx.lineWidth = 0.25; ctx.strokeStyle = T[1]; ctx.stroke();
    }
    dot(ctx, hx + 7.4, hy + 0.9, 0.75, TONE[0], 1, r, 0);
  }

  /* ---------- seals (hanko): vermilion with eroded edges and carved strokes ---------- */
  function makeSeal(px, seed, round, carve) {
    const c = U.canvas(px, px), t = c.ctx, r = U.rng(seed);
    const m = px * 0.06, S = px - m * 2;
    t.fillStyle = VERM_CSS;
    t.beginPath();
    if (round) t.ellipse(px / 2, px / 2, S / 2, S / 2, 0, 0, TAU);
    else {
      const j = () => (r.next() - 0.5) * S * 0.03;
      t.moveTo(m + j(), m + j()); t.lineTo(px - m + j(), m + j()); t.lineTo(px - m + j(), px - m + j()); t.lineTo(m + j(), px - m + j());
    }
    t.closePath();
    t.fill();
    // uneven ink pressure
    t.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 6; i++) {
      t.globalAlpha = 0.25; t.fillStyle = i % 2 ? '#e8583c' : '#a8281a';
      t.beginPath(); t.arc(r.next() * px, r.next() * px, px * (0.1 + r.next() * 0.2), 0, TAU); t.fill();
    }
    t.globalAlpha = 1;
    t.globalCompositeOperation = 'destination-out';
    if (carve) {
      // abstract carved glyph strokes (yin seal) inside a border
      const k = px / 100;
      t.setTransform(k, 0, 0, k, 0, 0);
      const cells = carve === 2 ? [[34, 34], [66, 34], [34, 66], [66, 66]] : [[50, 50]];
      for (const [cx, cy] of cells) glyph(t, cx, cy, carve === 2 ? 30 : 52, r, [0, 0, 0], 1);
      t.setTransform(1, 0, 0, 1, 0, 0);
    }
    // eroded speckles and nicks along the border
    for (let i = 0; i < px * 1.2; i++) {
      const a = r.next() * TAU, edge = r.next() < 0.6;
      const rr = edge ? S / 2 * (0.94 + r.next() * 0.1) : r.next() * S / 2;
      const x = px / 2 + (round ? Math.cos(a) * rr : (r.next() - 0.5) * S * (edge && r.next() < 0.5 ? 1.02 : 0.9));
      const y = px / 2 + (round ? Math.sin(a) * rr : (edge && r.next() < 0.5 ? (r.next() < 0.5 ? -1 : 1) * S * 0.5 : (r.next() - 0.5) * S));
      t.globalAlpha = 0.5 + r.next() * 0.5;
      t.beginPath(); t.arc(x, y, px * (0.004 + r.next() * 0.014), 0, TAU); t.fill();
    }
    t.globalAlpha = 1;
    t.globalCompositeOperation = 'source-over';
    return c.c;
  }

  /* ---------- effect sprites ---------- */
  const FX = {};
  function fxSprites() {
    const blot = (s, r, R, col, bleed) => {
      const P = spline(blobPts(0, 0, R, R * 0.92, 0.22, r, 9), true, 4);
      const t = s.ctx;
      if (bleed) { t.save(); t.filter = 'blur(' + (R * 0.5 * s.k).toFixed(1) + 'px)'; t.globalAlpha = 0.35; trace(t, P); t.fillStyle = col; t.fill(); t.restore(); }
      trace(t, P); t.fillStyle = col; t.globalAlpha = 0.95; t.fill(); t.globalAlpha = 1;
    };
    FX.drop = [0, 1, 2].map((v) => { const s = mkSprite(7, 7, 3.5, 3.5, 8); blot(s, U.rng(2100 + v), 2.1, T[0], true); return s; });
    FX.dropR = [0, 1].map((v) => { const s = mkSprite(7, 7, 3.5, 3.5, 8); blot(s, U.rng(2150 + v), 2.0, VERM_CSS, true); return s; });
    const splash = (seed, col) => {
      const s = mkSprite(20, 20, 10, 10, 6), r = U.rng(seed), t = s.ctx;
      blot(s, r, 3.6, col, true);
      t.fillStyle = col;
      for (let i = 0; i < 10; i++) {
        const a = r.next() * TAU, d = 4 + r.next() * 4.5, rr = 0.25 + r.next() * 0.8;
        t.beginPath(); t.arc(Math.cos(a) * d, Math.sin(a) * d, rr, 0, TAU); t.fill();
        brush(t, [[Math.cos(a) * 2.6, Math.sin(a) * 2.6], [Math.cos(a) * (d - rr), Math.sin(a) * (d - rr)]], { w: rr * 1.1, c: col === VERM_CSS ? VERM : TONE[0], ta: 0.2, tb: 0.3 }, r);
      }
      return s;
    };
    FX.splash = [splash(2200, T[0]), splash(2201, T[0])];
    FX.splashR = [splash(2210, VERM_CSS)];
    // ink-bleed ring: a pale disc with a darker ragged rim where the water stopped
    {
      const s = mkSprite(28, 28, 14, 14, 5), r = U.rng(2300);
      wash(s.ctx, spline(blobPts(0, 0, 11.5, 11.5, 0.08, r, 18), true, 4), { c: 'rgba(170,164,152,0.34)', rim: 1.3, edge: T[1], rimA: 0.9, rimBlur: 0.5, gran: 0.5, feather: 0.4, alpha: 0.9 });
      FX.ring = s;
    }
    // ensō: the one-stroke circle (large for the glow-up, small for orbiting objects)
    const enso = (R, w, k, seed) => {
      const s = mkSprite(R * 2 + w * 2 + 2, R * 2 + w * 2 + 2, R + w + 1, R + w + 1, k), r = U.rng(seed);
      const pts = arcPts(0, 0, R, R, Math.PI * 0.62, Math.PI * 0.62 + TAU * 0.9, 16).map((p, i) => [p[0] + (r.next() - 0.5) * R * 0.03, p[1] + (r.next() - 0.5) * R * 0.03 + i * 0.01]);
      brush(s.ctx, pts, { w, c: TONE[0], c2: TONE[3], a: 1, ta: 0, tb: 0.4, press: 0.55, dry: 0.7, steps: 6, bleed: 0.25, wv: 0.12, gs: Math.max(1, R * 0.12) }, r);
      return s;
    };
    FX.enso = enso(14, 2.5, 6, 2400);
    FX.ensoS = [enso(5.6, 1.7, 9, 2410), enso(5.6, 1.7, 9, 2411)];
    FX.petal = [0, 1, 2].map((v) => { const s = mkSprite(5, 5, 2.5, 2.5, 12); petal(s.ctx, 0, 0, 1.6, v * 1.1, 1); return s; });
    {
      const s = mkSprite(32, 12, 30, 6, 5), r = U.rng(2500);
      brush(s.ctx, [[-29, 1.2], [-14, -0.4], [0, 0]], { w: 8, c: TONE[3], c2: TONE[2], a: 0.85, ta: 0, tb: 0.05, dry: 0.85, steps: 8 }, r);
      FX.smear = s;
    }
    {
      const s = mkSprite(24, 24, 12, 12, 5), r = U.rng(2600);
      wash(s.ctx, spline(blobPts(0, 0, 8, 6.5, 0.2, r, 12), true, 4), { c: T[4], blobs: [{ x: -2, y: 1, rx: 4, ry: 3, c: T[3], a: 0.5, blur: 2 }], gran: 0.5, feather: 2.2, alpha: 0.85 });
      brush(s.ctx, [[-5, 2], [-2, -2.5], [2.5, -2], [3, 1], [0.5, 1.5]], { w: 0.8, c: TONE[3], a: 0.8, ta: 0.2, tb: 0.5, steps: 5 }, r);
      FX.puff = s;
    }
    {
      const s = mkSprite(32, 32, 16, 16, 4), r = U.rng(2700);
      wash(s.ctx, spline(blobPts(0, 0, 12, 12, 0.16, r, 16), true, 4), { c: T[2], blobs: [{ x: 0, y: 0, rx: 6, ry: 6, c: T[0], a: 0.8, blur: 3 }], rim: 1.6, edge: T[1], rimA: 0.6, gran: 0.6, feather: 1.4, bleed: 2, bleedA: 0.4 });
      FX.stain = s;
    }
    FX.shadow = radialSprite(64, [[0, 'rgba(58,54,48,0.34)'], [0.55, 'rgba(58,54,48,0.17)'], [1, 'rgba(58,54,48,0)']]);
    // collectibles: a bead of ink (small) and a vermilion seal (large)
    FX.bead = [0, 1].map((v) => {
      const s = mkSprite(8, 10, 4, 9, 9), r = U.rng(2800 + v), t = s.ctx;
      const P = spline([[0, -8.2], [1.6, -5], [2.6, -2.6], [1.8, -0.8], [0, -0.2], [-1.8, -0.8], [-2.6, -2.6], [-1.6, -5]].map((p) => [p[0] + (r.next() - 0.5) * 0.15, p[1]]), true, 4);
      t.save(); t.filter = 'blur(' + (0.6 * s.k).toFixed(1) + 'px)'; t.globalAlpha = 0.35; trace(t, P); t.fillStyle = T[0]; t.fill(); t.restore();
      trace(t, P); t.fillStyle = T[0]; t.fill();
      t.fillStyle = 'rgba(249,244,232,0.85)'; t.beginPath(); t.ellipse(-0.8, -3.4, 0.55, 0.9, -0.4, 0, TAU); t.fill();
      return s;
    });
    {
      const s = mkSprite(11, 11, 5.5, 10, 9);
      s.ctx.drawImage(makeSeal(90, 2900, false, 2), -5, -9.6, 9.6, 9.6);
      FX.seal = s;
    }
    FX.sealBox = makeSeal(64, 2950, false, 0);
    // projectile: a flung drop of ink with a dry-brush tail (points +x)
    {
      const s = mkSprite(26, 8, 22, 4, 6), r = U.rng(3000);
      brush(s.ctx, [[0, 0], [-10, 0.2], [-21, 0.7]], { w: 3.4, c: TONE[0], c2: TONE[2], a: 0.92, ta: 0, tb: 0.85, tp: 0.8, dry: 0.7, steps: 8, gs: 3 }, r);
      blot({ ctx: s.ctx, k: 6 }, r, 1.9, T[0], true);
      s.ctx.fillStyle = 'rgba(249,244,232,0.7)'; s.ctx.beginPath(); s.ctx.ellipse(0.5, -0.8, 0.5, 0.35, 0, 0, TAU); s.ctx.fill();
      FX.proj = s;
    }
    // mist band for the world overlay (paper coloured)
    {
      const c = U.canvas(256, 72), t = c.ctx;
      t.filter = 'blur(14px)';
      t.fillStyle = PAPER_HI;
      t.beginPath(); t.ellipse(128, 36, 100, 14, 0, 0, TAU); t.fill();
      t.beginPath(); t.ellipse(80, 40, 50, 10, 0, 0, TAU); t.fill();
      t.beginPath(); t.ellipse(180, 30, 55, 9, 0, 0, TAU); t.fill();
      FX.mist = c.c;
    }
  }

  /* ======================================================================
     7. Build all sprites
     ====================================================================== */
  function frames(wu, hu, ax, ay, poses, fn, seed) {
    return poses.map((pose) => { const s = mkSprite(wu, hu, ax, ay, KC); fn(s.ctx, pose, U.rng(seed)); return finish(s, { paper: 0.28 }); });
  }
  function buildCharacters() {
    const idle = [{ ph: null, wave: 0.4, br: 0 }, { ph: null, wave: -0.35, br: 0.22 }];
    const walk = [0, 1, 2, 3].map((p) => ({ ph: (p / 4) * TAU, wave: Math.sin(p * 1.6) }));
    const sf = frames(28, 44, 14, 41.5, idle.concat(walk), drawSage, 5000);
    SPR.sage = { idle: sf.slice(0, 2), walk: sf.slice(2) };
    const poses4 = [0, 1, 2, 3].map((p) => ({ ph: (p / 4) * TAU }));
    SPR.creeper = [0, 1].map((v) => frames(26, 23, 13, 20, poses4, (c, pose, r) => drawBlot(c, pose, r, v), 6000 + v * 100));
    SPR.ghost = [frames(22, 30, 10.5, 27, poses4, drawWisp, 7000)];
    SPR.colossus = [frames(58, 54, 31, 50, poses4, drawBeast, 8000)];
    SPR.soft = {}; SPR.death = {};
    for (const type of ['creeper', 'ghost', 'colossus']) {
      SPR.soft[type] = SPR[type].map((set) => softOf(set[0], 5));
      SPR.death[type] = SPR[type].map((set, i) => dissolveFrames(set[1], 4, 37 + i * 11 + type.length * 5));
    }
  }

  /* ======================================================================
     8. Screen overlay: a misty unpainted margin, signature and seals
     ====================================================================== */
  let OVL = null;
  function buildOverlay(W, H) {
    const band = Math.ceil(Math.min(W, H) * 0.14);
    const page = U.canvas(W, H), hurt = U.canvas(W, H);
    const pi = page.ctx.createImageData(W, H), hi = hurt.ctx.createImageData(W, H);
    const pd = pi.data, hd = hi.data;
    const m = H * 0.01, rad = H * 0.1, hw = W / 2 - m, hh = H / 2 - m, fade = H * 0.11;
    const n1 = H * 0.06, n2 = H * 0.014;
    for (let y = 0; y < H; y++) {
      const inBandY = y < band || y >= H - band;
      const rowA = (y & 511) << 9, rowB = ((y * 2 + 97) & 511) << 9;
      for (let x = 0; x < W; x++) {
        if (!inBandY && x >= band && x < W - band) continue;
        const qx = Math.abs(x - W / 2) - (hw - rad), qy = Math.abs(y - H / 2) - (hh - rad);
        const sd = hyp(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
        const F = FIB[rowA | (x & 511)];
        const e = sd + (WA[rowA | (x & 511)] - 0.5) * n1 + (F - 0.5) * n2;
        const o = (y * W + x) * 4;
        const f = U.smoothstep(-fade, 0, e) * 0.82;
        if (f > 0.003) {
          const pv = 0.975 + (F - 0.5) * 0.1;
          pd[o] = PAPER[0] * pv; pd[o + 1] = PAPER[1] * pv; pd[o + 2] = PAPER[2] * pv; pd[o + 3] = f * 255;
        }
        // hurt: ink seeps in from the margin along the fibres
        const hf = U.smoothstep(-fade * 1.5, -fade * 0.1, e + (WA[rowB | ((x * 2) & 511)] - 0.5) * n1 * 1.4);
        const ha = Math.min(1, hf * 0.62);
        if (ha > 0.003) { hd[o] = TONE[1][0]; hd[o + 1] = TONE[1][1]; hd[o + 2] = TONE[1][2]; hd[o + 3] = ha * 255; }
      }
    }
    page.ctx.putImageData(pi, 0, 0);
    hurt.ctx.putImageData(hi, 0, 0);
    // painter's inscription (abstract strokes) and seals in the lower left corner
    const t = page.ctx, r = U.rng(4242), gs = Math.max(12, H * 0.034);
    t.lineCap = 'round'; t.lineJoin = 'round';
    const gx = Math.max(gs * 1.2, H * 0.045), gy = H - H * 0.05 - gs * 5.4;
    for (let i = 0; i < 4; i++) glyph(t, gx, gy + i * gs * 1.1, gs, r, TONE[1], 0.72);
    t.globalAlpha = 0.92;
    t.drawImage(makeSeal(96, 4343, false, 2), gx - gs * 0.5, gy + gs * 4.5, gs, gs);
    t.drawImage(makeSeal(96, 4344, true, 1), gx + gs * 0.75, gy + gs * 4.75, gs * 0.6, gs * 0.6);
    t.globalAlpha = 1;
    OVL = { W, H, band, page: page.c, hurt: hurt.c };
  }
  function drawStrips(ctx, img, W, H, b) {
    ctx.drawImage(img, 0, 0, W, b, 0, 0, W, b);
    ctx.drawImage(img, 0, H - b, W, b, 0, H - b, W, b);
    ctx.drawImage(img, 0, b, b, H - 2 * b, 0, b, b, H - 2 * b);
    ctx.drawImage(img, W - b, b, b, H - 2 * b, W - b, b, b, H - 2 * b);
  }

  /* ======================================================================
     9. Icons (HUD + cards), painted in a 100x100 space
     ====================================================================== */
  function beadPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - 9 * s);
    ctx.bezierCurveTo(x + 2 * s, y - 5 * s, x + 4.6 * s, y - 2.6 * s, x + 4.6 * s, y + 0.6 * s);
    ctx.bezierCurveTo(x + 4.6 * s, y + 3.6 * s, x + 2.4 * s, y + 5 * s, x, y + 5 * s);
    ctx.bezierCurveTo(x - 2.4 * s, y + 5 * s, x - 4.6 * s, y + 3.6 * s, x - 4.6 * s, y + 0.6 * s);
    ctx.bezierCurveTo(x - 4.6 * s, y - 2.6 * s, x - 2 * s, y - 5 * s, x, y - 9 * s);
    ctx.closePath();
  }
  function inkBead(ctx, x, y, s, col) {
    ctx.save();
    ctx.filter = 'blur(' + (s * 0.9 * scaleOf(ctx)).toFixed(1) + 'px)';
    ctx.globalAlpha = 0.3; beadPath(ctx, x, y, s); ctx.fillStyle = col || T[0]; ctx.fill();
    ctx.restore();
    beadPath(ctx, x, y, s); ctx.fillStyle = col || T[0]; ctx.fill();
    ctx.fillStyle = 'rgba(249,244,232,0.85)'; ctx.beginPath(); ctx.ellipse(x - 1.6 * s, y - 0.8 * s, 0.9 * s, 1.5 * s, -0.4, 0, TAU); ctx.fill();
  }
  function drawIconImpl(ctx, id, size) {
    const k = size / 100;
    ctx.save();
    ctx.scale(k, k);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const r = U.rng(hsh(id.length * 31, id.charCodeAt(0), id.charCodeAt(id.length - 1)));
    switch (id) {
      case 'kills': {
        const P = spline(blobPts(50, 58, 27, 22, 0.1, r, 14), true, 4);
        wash(ctx, P, { c: T[0], blobs: [{ x: 58, y: 68, rx: 12, ry: 8, c: T[2], a: 0.5, blur: 5 }], rim: 3, edge: T[0], rimA: 0.7, gran: 0.4, bleed: 3, bleedA: 0.4 });
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI * (0.16 + (i / 6) * 0.68), x0 = 50 + Math.cos(a) * 24, y0 = 58 + Math.sin(a) * 19;
          brush(ctx, [[x0, y0], [x0 + Math.cos(a) * 10, y0 + Math.sin(a) * 10]], { w: 4, c: TONE[0], ta: 0, tb: 0.8, dry: 0.35 }, r);
        }
        eye(ctx, 61, 52, 6.6); eye(ctx, 44, 51, 5.6);
        break;
      }
      case 'hp-heart': {
        blossom(ctx, 50, 52, 17, r, 'red');
        brush(ctx, [[14, 92], [30, 80], [40, 66]], { w: 5, c: TONE[0], ta: 0, tb: 0.5, dry: 0.4 }, r);
        break;
      }
      case 'dmg': {
        brush(ctx, [[84, 12], [66, 36], [52, 54]], { w: 8, c: TONE[3], c2: TONE[4], ta: 0, tb: 0, wv: 0.02 }, r);
        brush(ctx, [[76, 22], [72, 27]], { w: 3, c: TONE[1], ta: 0, tb: 0 }, r);
        brush(ctx, [[53, 52], [49, 57]], { w: 11, c: TONE[1], ta: 0, tb: 0 }, r);
        brush(ctx, [[50, 56], [36, 74], [20, 92]], { w: 15, c: TONE[0], c2: TONE[2], ta: 0, tb: 0.85, tp: 0.9, press: 0.2, dry: 0.2, bleed: 0.25 }, r);
        dot(ctx, 16, 95, 2.2, TONE[0], 1, r);
        break;
      }
      case 'rate': {
        for (let i = 0; i < 3; i++) brush(ctx, [[14 + i * 6, 82 - i * 24], [50 + i * 4, 70 - i * 26], [90, 62 - i * 26]], { w: 10 - i, c: TONE[i], c2: TONE[i + 2], ta: 0, tb: 0.65, press: 0.6, dry: 0.55, steps: 6 }, r);
        break;
      }
      case 'multi': {
        inkBead(ctx, 50, 44, 3.4);
        inkBead(ctx, 24, 66, 2.6, T[1]);
        inkBead(ctx, 76, 66, 2.6, T[1]);
        break;
      }
      case 'bounce': {
        brush(ctx, [[8, 24], [30, 74], [52, 38], [70, 68], [86, 52]], { w: 6, c: TONE[1], c2: TONE[3], ta: 0.05, tb: 0.4, press: 0.5, dry: 0.5, steps: 6 }, r);
        brush(ctx, [[18, 86], [50, 84], [84, 87]], { w: 3.5, c: TONE[3], ta: 0.1, tb: 0.4, dry: 0.6 }, r);
        inkBead(ctx, 88, 44, 1.9);
        break;
      }
      case 'lantern': {
        brush(ctx, arcPts(50, 50, 33, 33, Math.PI * 0.62, Math.PI * 0.62 + TAU * 0.9, 16), { w: 11, c: TONE[0], c2: TONE[2], ta: 0, tb: 0.45, press: 0.5, dry: 0.5, steps: 6, bleed: 0.2 }, r);
        dot(ctx, 50, 50, 5, VERM, 1, r);
        break;
      }
      case 'speed': {
        // a swallow in a few strokes
        brush(ctx, [[30, 56], [48, 50], [66, 44], [80, 40]], { w: 10, c: TONE[0], ta: 0.1, tb: 0.5, press: 0.7 }, r);
        brush(ctx, [[54, 47], [40, 26], [16, 12]], { w: 8, c: TONE[0], c2: TONE[2], ta: 0.1, tb: 0.85, dry: 0.4, steps: 5 }, r);
        brush(ctx, [[58, 48], [52, 70], [34, 90]], { w: 7, c: TONE[1], c2: TONE[3], ta: 0.1, tb: 0.85, dry: 0.45, steps: 5 }, r);
        brush(ctx, [[32, 56], [14, 64], [4, 74]], { w: 3, c: TONE[0], ta: 0, tb: 0.7 }, r);
        brush(ctx, [[32, 56], [16, 56], [6, 52]], { w: 3, c: TONE[0], ta: 0, tb: 0.7 }, r);
        ctx.fillStyle = PAPER_HI; ctx.beginPath(); ctx.arc(74, 41, 2, 0, TAU); ctx.fill();
        break;
      }
      case 'magnet': {
        const sp = [];
        for (let i = 0; i <= 26; i++) { const a = i * 0.42, R = 40 - i * 1.35; sp.push([50 + Math.cos(a) * R, 52 + Math.sin(a) * R * 0.9]); }
        brush(ctx, sp, { w: 7, c: TONE[1], c2: TONE[3], ta: 0, tb: 0.5, press: 0.4, dry: 0.45, steps: 3 }, r);
        inkBead(ctx, 50, 54, 1.8);
        break;
      }
      case 'hp': {
        // a tea bowl with steam
        const bowl = [[16, 50], [84, 50], [78, 70], [64, 82], [36, 82], [22, 70]];
        wash(ctx, spline(bowl, true, 4), { c: T[3], blobs: [{ x: 64, y: 70, rx: 14, ry: 9, c: T[2], a: 0.7, blur: 5 }], rim: 2, edge: T[2], gran: 0.5 });
        brush(ctx, [[14, 50], [50, 47], [86, 50]], { w: 5, c: TONE[0], ta: 0.05, tb: 0.2, press: 0.5, dry: 0.3 }, r);
        brush(ctx, [[22, 66], [34, 82], [64, 83], [80, 64]], { w: 3.5, c: TONE[1], ta: 0.1, tb: 0.4, dry: 0.4 }, r);
        brush(ctx, [[40, 84], [60, 84]], { w: 4, c: TONE[0], ta: 0, tb: 0 }, r);
        for (const x of [40, 58]) brush(ctx, [[x, 42], [x - 5, 32], [x + 3, 22], [x - 2, 10]], { w: 4, c: TONE[3], ta: 0.2, tb: 0.7, dry: 0.4, steps: 5 }, r);
        break;
      }
      default: {
        brush(ctx, arcPts(50, 50, 30, 30, Math.PI * 0.6, Math.PI * 0.6 + TAU * 0.88, 14), { w: 9, c: TONE[0], ta: 0, tb: 0.45, press: 0.5, dry: 0.5, steps: 6 }, r);
      }
    }
    ctx.restore();
  }

  /* ======================================================================
     10. HUD textures + CSS
     ====================================================================== */
  function hudTextures() {
    const X = {};
    const url = (c) => c.toDataURL('image/webp', 0.9);
    const urlP = (c) => c.toDataURL('image/png');
    const rrect = (t, x, y, w, h, rad) => { t.beginPath(); if (t.roundRect) t.roundRect(x, y, w, h, rad); else t.rect(x, y, w, h); };
    const paperFill = (t, x, y, w, h, shade) => {
      const img = t.getImageData(x, y, w, h), d = img.data;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const P = PAP[(((y + j) & 255) << 8) | ((x + i) & 255)], F = FIB[(((y + j) & 511) << 9) | ((x + i) & 511)];
        let v = 0.975 + (P - 0.5) * 0.06 + (F - 0.5) * 0.12;
        if (shade) { const e = Math.min(i, j, w - 1 - i, h - 1 - j); v *= 1 - Math.max(0, 1 - e / shade) * 0.07; }
        const o = (j * w + i) * 4;
        d[o] = PAPER[0] * v; d[o + 1] = PAPER[1] * v; d[o + 2] = PAPER[2] * v; d[o + 3] = 255;
      }
      t.putImageData(img, x, y);
    };
    const silk = (t, x, y, w, h, seed) => {
      // woven grey silk mounting with a faint diagonal weave
      t.fillStyle = 'rgb(78,75,70)'; t.fillRect(x, y, w, h);
      t.save(); t.beginPath(); t.rect(x, y, w, h); t.clip();
      t.strokeStyle = 'rgba(160,152,138,0.16)'; t.lineWidth = 1;
      for (let i = -h; i < w; i += 5) { t.beginPath(); t.moveTo(x + i, y); t.lineTo(x + i + h, y + h); t.stroke(); }
      const r = U.rng(seed);
      t.fillStyle = 'rgba(170,160,140,0.12)';
      for (let i = 0; i < (w * h) / 220; i++) { t.beginPath(); t.arc(x + r.next() * w, y + r.next() * h, 2 + r.next() * 3, 0, TAU); t.fill(); }
      t.restore();
    };
    const roller = (t, x0, x1, y, h) => {
      const g = t.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#4a4540'); g.addColorStop(0.35, '#2a2622'); g.addColorStop(1, '#141210');
      t.fillStyle = g;
      rrect(t, x0, y, x1 - x0, h, h / 2); t.fill();
      t.fillStyle = 'rgba(255,248,230,0.18)'; t.fillRect(x0 + h / 2, y + h * 0.18, x1 - x0 - h, h * 0.14);
    };
    { const c = U.canvas(256, 256); paperFill(c.ctx, 0, 0, 256, 256); c.ctx.globalAlpha = 0.6; c.ctx.drawImage(FIBW_C.c, 0, 0); X.paper = url(c.c); }
    // brush-stroke bars
    const bar = (w, h, bw, col, c2, a, dry, seed) => {
      const c = U.canvas(w, h), r = U.rng(seed);
      brush(c.ctx, [[h * 0.3, h * 0.55], [w * 0.3, h * 0.47], [w * 0.7, h * 0.53], [w - h * 0.3, h * 0.5]], { w: bw, c: col, c2, a, ta: 0, tb: 0.02, press: 0.25, dry, wv: 0.06, steps: 14, nb: 22, gs: 30 }, r);
      return urlP(c.c);
    };
    X.xpTrack = bar(1400, 30, 15, TONE[4], TONE[3], 0.75, 0.55, 11);
    X.xpFill = bar(1400, 30, 13, TONE[0], TONE[2], 1, 0.12, 12);
    X.hpTrack = bar(480, 44, 26, TONE[4], TONE[3], 0.7, 0.5, 13);
    X.hpFill = bar(480, 44, 24, TONE[0], TONE[2], 1, 0.1, 14);
    // ragged dry-brush end (mask)
    {
      const c = U.canvas(28, 64), t = c.ctx, r = U.rng(15);
      t.fillStyle = '#000'; t.fillRect(0, 0, 6, 64);
      for (let y = 0; y < 64; y += 2) { t.globalAlpha = 0.5 + r.next() * 0.5; t.fillRect(0, y, 6 + Math.pow(r.next(), 0.7) * 22, 1.6 + r.next()); }
      X.rag = urlP(c.c);
    }
    X.sealSq = urlP(makeSeal(128, 16, false, 0));
    X.sealRd = urlP(makeSeal(128, 17, true, 0));
    X.sealGlyph = urlP(makeSeal(128, 18, false, 2));
    // small handscroll (title plaque / caption bar)
    const handscroll = (w, h, seed) => {
      const c = U.canvas(w, h), t = c.ctx, rw = Math.round(h * 0.16), m = Math.round(h * 0.1);
      silk(t, rw, m, w - rw * 2, h - m * 2, seed);
      paperFill(t, rw + 6, m + 6, w - rw * 2 - 12, h - m * 2 - 12, 14);
      t.fillStyle = 'rgba(120,114,104,0.5)'; t.fillRect(rw + 6, m + 6, w - rw * 2 - 12, 2); t.fillRect(rw + 6, h - m - 8, w - rw * 2 - 12, 2);
      for (const x of [2, w - rw - 2]) {
        const g = t.createLinearGradient(x, 0, x + rw, 0);
        g.addColorStop(0, '#141210'); g.addColorStop(0.45, '#4a4540'); g.addColorStop(1, '#141210');
        t.fillStyle = g; rrect(t, x, 1, rw, h - 2, rw / 2); t.fill();
      }
      return url(c.c);
    };
    X.plaque = handscroll(380, 120, 19);
    X.bar = handscroll(760, 96, 20);
    // hanging scroll card
    {
      const w = 428, h = 640, c = U.canvas(w, h), t = c.ctx;
      t.strokeStyle = 'rgba(40,36,32,0.85)'; t.lineWidth = 2.2;
      t.beginPath(); t.moveTo(64, 44); t.lineTo(w / 2, 8); t.lineTo(w - 64, 44); t.stroke();
      t.fillStyle = '#2a2622'; t.beginPath(); t.arc(w / 2, 8, 5, 0, TAU); t.fill();
      silk(t, 30, 46, w - 60, h - 100, 21);
      t.fillStyle = 'rgba(214,206,190,0.9)'; t.fillRect(44, 112, w - 88, 7); t.fillRect(44, 538, w - 88, 5);
      paperFill(t, 46, 122, w - 92, 412, 18);
      roller(t, 26, w - 26, 38, 14);
      roller(t, 8, w - 8, h - 58, 26);
      t.fillStyle = '#0e0c0b';
      for (const x of [8, w - 22]) { rrect(t, x, h - 62, 14, 34, 5); t.fill(); }
      X.card = url(c.c);
    }
    // broad pale wash stroke behind titles
    {
      const c = U.canvas(900, 150), r = U.rng(22);
      brush(c.ctx, [[30, 82], [300, 70], [620, 78], [870, 70]], { w: 104, c: TONE[4], c2: TONE[3], a: 0.9, ta: 0, tb: 0.1, press: 0.25, dry: 0.45, steps: 14, nb: 64, gs: 16, wv: 0.08 }, r);
      X.banner = urlP(c.c);
    }
    return X;
  }
  function makeCss(X) {
    const S = 'body.style-sumie';
    const brushF = "'Ma Shan Zheng', 'Zhi Mang Xing', 'Yuji Mai', serif";
    const grass = "'Zhi Mang Xing', 'Ma Shan Zheng', cursive";
    const yuji = "'Yuji Mai', 'Cormorant Garamond', serif";
    const corm = "'Cormorant Garamond', Georgia, serif";
    const halo = '0 0 3px #f3ecdd, 0 0 8px #f3ecdd, 0 0 14px rgba(243,236,221,.85)';
    const mask = `-webkit-mask: url(${X.rag}) right center / 18px 100% no-repeat, linear-gradient(#000,#000) left center / calc(100% - 17px) 100% no-repeat; mask: url(${X.rag}) right center / 18px 100% no-repeat, linear-gradient(#000,#000) left center / calc(100% - 17px) 100% no-repeat;`;
    return `
${S} { font-family: ${corm}; color: ${T[0]}; }
${S} #hud { padding: 14px 30px; }
${S} #hud .xp { height: 18px; background: url(${X.xpTrack}) center / 100% 100% no-repeat; border: 0; border-radius: 0; overflow: visible; margin-right: 34px; }
${S} #hud .xp-fill { inset: 1px auto 1px 0; background: url(${X.xpFill}) left center / calc(100vw - 94px) 100% no-repeat; transition: width .3s; ${mask} }
${S} #hud .lvl { right: -42px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: url(${X.sealSq}) center / 100% 100% no-repeat; font: 400 21px/1 ${brushF}; color: #f9f4e8; text-shadow: none; transform: translateY(-50%) rotate(-3deg); }
${S} #hud .topline { margin-top: 16px; }
${S} #hud .hp { gap: 10px; }
${S} #hud .hp-icon, ${S} #hud .kills-icon { width: 42px; height: 42px; }
${S} #hud .hp-bar { width: 240px; height: 24px; background: url(${X.hpTrack}) center / 100% 100% no-repeat; border: 0; border-radius: 0; overflow: visible; }
${S} #hud .hp-fill { inset: 0 auto 0 0; background: url(${X.hpFill}) left center / 240px 100% no-repeat; transition: width .15s; ${mask} }
${S} #hud .hp-text { font: 400 24px/1 ${brushF}; color: ${T[0]}; text-shadow: ${halo}; margin-left: 4px; }
${S} #hud .clock { padding: 12px 40px 16px; margin-top: -6px; background: url(${X.plaque}) center / 100% 100% no-repeat; filter: drop-shadow(0 4px 6px rgba(30,26,22,.3)); }
${S} #hud .clock-time { font: 400 40px/1 ${brushF}; color: ${T[0]}; text-shadow: none; letter-spacing: 2px; }
${S} #hud .clock-label { font: 400 19px/1.1 ${grass}; text-transform: none; letter-spacing: .5px; color: ${VERM_CSS}; opacity: 1; margin-top: 2px; }
${S} #hud .kills { font: 400 34px/1 ${brushF}; color: ${T[0]}; text-shadow: ${halo}; gap: 8px; }
${S}.hurt #hud .hp-bar { filter: drop-shadow(0 0 5px rgba(206,60,38,.75)); }
${S} #stylebar { background: url(${X.bar}) center / 100% 100% no-repeat; color: ${T[0]}; border: 0; border-radius: 0; box-shadow: none; filter: drop-shadow(0 4px 7px rgba(30,26,22,.35)); padding: 12px 54px 12px; gap: 16px; }
${S} #stylebar .style-family { font: 400 19px/1 ${grass}; color: ${VERM_CSS}; text-transform: none; letter-spacing: .5px; opacity: 1; }
${S} #stylebar .style-name { font: 400 23px/1 ${brushF}; font-weight: 400; letter-spacing: 1px; }
${S} #stylebar .style-hint { font: italic 500 15px ${corm}; color: ${T[2]}; opacity: 1; }
${S} #stylebar .auto.on { color: ${VERM_CSS}; font-weight: 700; }
${S} #stylemenu { background: url(${X.paper}) #f3ecdd; border: 0; border-radius: 2px; box-shadow: 0 0 0 6px rgb(78,75,70), 0 10px 26px rgba(20,16,12,.5); }
${S} #stylemenu .sm-item { color: ${T[0]}; background: rgba(44,41,38,.04); font-family: ${corm}; border-radius: 2px; }
${S} #stylemenu .sm-item:hover { background: rgba(44,41,38,.1); }
${S} #stylemenu .sm-item.active { border-color: ${VERM_CSS}; }
${S} #stylemenu .sm-name { font: 400 18px ${brushF}; }
${S} #stylemenu .sm-fam { font: 400 15px ${grass}; color: ${VERM_DK}; opacity: 1; }
${S} #levelup { background: radial-gradient(ellipse at 50% 45%, rgba(243,236,221,.42), rgba(26,23,20,.74) 80%); gap: 22px; }
${S} #levelup .lu-title { font: 400 60px/1 ${brushF}; color: ${T[0]}; letter-spacing: 3px; text-shadow: none; padding: 30px 110px 34px; background: url(${X.banner}) center / 100% 100% no-repeat; display: flex; align-items: center; gap: 18px; }
${S} #levelup .lu-title::after { content: ''; width: 40px; height: 40px; flex: none; background: url(${X.sealGlyph}) center / 100% 100% no-repeat; transform: rotate(4deg); }
${S} #levelup .lu-cards { gap: 34px; align-items: flex-start; }
${S} #levelup .card { width: 214px; min-height: 322px; padding: 66px 30px 62px; gap: 6px; background: url(${X.card}) center / 100% 100% no-repeat; border: 0; border-radius: 0; color: ${T[0]}; filter: drop-shadow(0 12px 12px rgba(16,13,10,.5)); transition: transform .2s; transform-origin: 50% 0; }
${S} #levelup .card:nth-child(2) { margin-top: 18px; }
${S} #levelup .card:hover { transform: rotate(-1.2deg) translateY(4px); }
${S} #levelup .card-icon { width: 104px; height: 104px; }
${S} #levelup .card-name { font: 400 22px/1.15 ${yuji}; margin-top: 2px; }
${S} #levelup .card-desc { font: italic 600 18px/1.2 ${corm}; color: ${T[2]}; opacity: 1; }
${S} #levelup .card-key { top: 64px; left: auto; right: 34px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: url(${X.sealRd}) center / 100% 100% no-repeat; font: 400 17px/1 ${brushF}; color: #f9f4e8; opacity: 1; }
${S} #levelup .lu-hint { font: 400 26px ${grass}; color: #f3ecdd; opacity: .95; text-shadow: 0 1px 5px rgba(16,13,10,.9); }
${S} #gameover { background: radial-gradient(ellipse at 50% 45%, rgba(243,236,221,.3), rgba(26,23,20,.82) 80%); }
${S} #gameover .go-title { font: 400 66px/1 ${brushF}; color: ${T[0]}; padding: 32px 120px 36px; background: url(${X.banner}) center / 100% 100% no-repeat; letter-spacing: 3px; }
${S} #gameover .go-stats { font: italic 600 23px ${corm}; color: #f3ecdd; text-shadow: 0 1px 4px rgba(16,13,10,.9); }
${S} #gameover .go-hint { font: 400 25px ${grass}; color: #f3ecdd; opacity: .9; }
${S} #pausebox { font: 400 60px ${brushF}; color: ${T[0]}; text-shadow: 0 0 8px #f3ecdd, 0 0 18px #f3ecdd, 0 0 30px #f3ecdd; letter-spacing: 4px; }
`;
  }

  /* ======================================================================
     11. Runtime helpers
     ====================================================================== */
  function inkBurst(game, x, y, z, n, sp, size, red) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.35 + Math.random() * 0.8);
      game.addParticle({
        x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.65, vz: 30 + Math.random() * 70, grav: 260,
        life: 1.0 + Math.random() * 0.8, size: size * (0.45 + Math.random() * 0.9), kind: 'drop', red: !!red && Math.random() < red, drag: 1.6, v: (Math.random() * 3) | 0,
      });
    }
  }
  const landed = (pt) => pt.z <= 0.3 && Math.abs(pt.vz) < 25;
  let groundLive = false, groundFrame = -1;
  function groundFx(ctx, pt) {
    if (pt.kind === 'drop') {
      const set = pt.red ? FX.dropR : FX.drop, s = pt.size * 1.2;
      ctx.globalAlpha = Math.min(1, (pt.life / pt.max) * 3) * 0.85;
      ctx.drawImage(set[(pt.v || 0) % set.length].c, pt.x - s / 2, pt.y - s * 0.3, s, s * 0.6);
    } else {
      const age = 1 - pt.life / pt.max, R = pt.size * (0.3 + 0.7 * U.ease.outQuad(Math.min(1, age * 1.5)));
      ctx.globalAlpha = (1 - age) * 0.8;
      ctx.drawImage(FX.ring.c, pt.x - R, pt.y - R * 0.6, R * 2, R * 1.2);
    }
    ctx.globalAlpha = 1;
  }

  /* ======================================================================
     12. Style registration
     ====================================================================== */
  Styles.register({
    id: 'sumie',
    name: 'Sumi-e Ink',
    family: 'Painterly · Ink wash',
    description: 'East-Asian monochrome ink-wash painting: black sumi ink in five tones on warm xuan paper, one-stroke brushwork with dry-brush streaks and bleeding edges, lots of empty space and a single vermilion accent for seals, blossoms and the sash.',
    groundColor: PAPER_CSS,
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Ma+Shan+Zheng', 'Zhi+Mang+Xing', 'Yuji+Mai', 'Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600'],
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
      const X = hudTextures();
      this.css = makeCss(X);
      const tag = document.getElementById('style-css');
      if (tag && document.body.classList.contains('style-sumie')) tag.textContent = this.css;
      window.__sumieInit = { tex: Math.round(t1 - t0), chars: Math.round(t2 - t1), props: Math.round(t3 - t2), rest: Math.round(performance.now() - t3) };
    },

    renderGroundChunk(ctx, info) { return groundGen(ctx, info); },

    propsForChunk(info) {
      const out = [];
      const land = (x, y, m) => waterD(x, y) < -m;
      const ok = (x, y, r0) => !G.nearSpawn(x, y, r0 || 90);
      G.scatterOwned(info, 300, 7111, (x, y, r) => {
        if (!r.chance(0.45) || !ok(x, y, 125) || !land(x, y, 30)) return;
        out.push({ x, y, t: 'mountain', v: r.int(0, 1), flip: r.chance(0.5), pad: 150, fade: [44, 116] });
      });
      G.scatterOwned(info, 130, 7102, (x, y, r) => {
        if (!r.chance(0.3) || !ok(x, y) || !land(x, y, 14)) return;
        out.push({ x, y, t: 'pine', v: r.int(0, 1), flip: r.chance(0.5), sh: [15, 4, 3], pad: 90, fade: [26, 74] });
      });
      G.scatterOwned(info, 66, 7103, (x, y, r) => {
        if (U.noise(x / 300, y / 300, 77) < 0.66 || !r.chance(0.45) || !ok(x, y) || !land(x, y, 10)) return;
        out.push({ x, y, t: 'bamboo', v: r.int(0, 2), flip: r.chance(0.5), sh: [13, 3.6, 2], pad: 100, fade: [20, 86] });
      });
      G.scatterOwned(info, 160, 7104, (x, y, r) => {
        if (!r.chance(0.3) || !ok(x, y) || !land(x, y, 10)) return;
        out.push({ x, y, t: 'plum', v: r.int(0, 1), flip: r.chance(0.5), sh: [12, 3.4, 2], pad: 70, fade: [24, 58] });
      });
      G.scatterOwned(info, 95, 7105, (x, y, r) => {
        if (!r.chance(0.3) || !ok(x, y, 60)) return;
        out.push({ x, y, t: 'rock', v: r.int(0, 2), flip: r.chance(0.5), sh: [9, 2.6, 1.5] });
      });
      G.scatterOwned(info, 420, 7106, (x, y, r) => {
        if (!r.chance(0.5) || !ok(x, y, 120) || !land(x, y, 8)) return;
        out.push({ x, y, t: 'hut', v: 0, flip: r.chance(0.5), sh: [17, 3.4, 2] });
      });
      G.scatterOwned(info, 34, 7107, (x, y, r) => {
        const d = waterD(x, y);
        if (d > 2 || d < -6 || !r.chance(0.45) || !ok(x, y, 60)) return;
        out.push({ x, y, t: 'reeds', v: r.int(0, 1), flip: r.chance(0.5) });
      });
      G.scatterOwned(info, 80, 7108, (x, y, r) => {
        if (!r.chance(0.16) || !ok(x, y, 60) || !land(x, y, 4)) return;
        out.push({ x, y, t: 'orchid', v: r.int(0, 1), flip: r.chance(0.5) });
      });
      return out;
    },

    drawProp(ctx, p, view) {
      const s = PROPS[p.t] && PROPS[p.t][p.v];
      if (!s) return;
      if (p.fade) {
        const pl = view.game.player;
        if (pl.y < p.y - 1 && pl.y > p.y - p.fade[1] && Math.abs(pl.x - p.x) < p.fade[0]) ctx.globalAlpha = 0.45;
      }
      blit(ctx, s, p.x, p.y, p.flip);
      ctx.globalAlpha = 1;
    },

    drawGroundOverlay(ctx, view, game) {
      // landed ink drops, bleed rings, spawn stains, the pale disc under orbiting circles.
      // When another style owns the ground (mixes, element sheets) this runs on a silent context:
      // then the particle layer paints rings and landed drops itself.
      groundLive = typeof CanvasRenderingContext2D !== 'undefined' && ctx instanceof CanvasRenderingContext2D;
      groundFrame = view.rt;
      for (const pt of game.particles) {
        if ((pt.kind === 'drop' && landed(pt)) || pt.kind === 'ring') groundFx(ctx, pt);
      }
      for (const e of game.enemies) {
        if (e.spawnT >= 1 || e.dying) continue;
        const k = U.ease.outQuad(Math.min(1, e.spawnT * 1.4)), R = e.r * (0.5 + 1.2 * k);
        ctx.globalAlpha = (1 - e.spawnT) * 0.8;
        ctx.drawImage(FX.stain.c, e.x - R, e.y - R * 0.6, R * 2, R * 1.2);
      }
      ctx.globalAlpha = 0.5;
      for (const o of game.orbitals) ctx.drawImage(FX.shadow, o.x - 9, o.y + 1, 18, 6);
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o) {
      let rx, ry, ox = 0.6;
      if (o.kind === 'player') { rx = 8; ry = 2.6; }
      else if (o.kind === 'enemy') {
        if (o.dying) return;
        const sp = o.spawnT < 1 ? o.spawnT : 1;
        if (o.type === 'ghost') { rx = 5 * sp; ry = 1.7 * sp; }
        else { rx = (o.type === 'colossus' ? 19 : 9) * sp; ry = rx * 0.3; }
        if (rx < 0.5) return;
      } else if (o.kind === 'prop') {
        if (!o.sh) return;
        rx = o.sh[0]; ry = o.sh[1]; ox = o.sh[2];
      } else return;
      ctx.drawImage(FX.shadow, o.x + ox - rx, o.y - ry + 0.4, rx * 2, ry * 2);
    },

    drawGem(ctx, g, view) {
      const pop = g.pop > 0 ? 1 + Math.sin(g.pop * Math.PI) * 0.7 : 1;
      ctx.globalAlpha = 0.8;
      const sw = g.big ? 12 : 6;
      ctx.drawImage(FX.shadow, g.x - sw / 2, g.y - sw * 0.16, sw, sw * 0.32);
      ctx.globalAlpha = 1;
      if (g.big) {
        const bob = Math.sin(view.rt * 3 + g.seed * 20) * 1.0 - 1.2;
        ctx.save();
        ctx.translate(g.x, g.y + bob);
        ctx.rotate(Math.sin(view.rt * 1.6 + g.seed * 9) * 0.12);
        ctx.scale(pop, pop);
        blit(ctx, FX.seal, 0, 0);
        ctx.restore();
      } else {
        blit(ctx, FX.bead[g.seed < 0.5 ? 0 : 1], g.x, g.y, false, 0.9 * pop);
      }
    },

    drawEnemy(ctx, e, view) {
      const sets = SPR[e.type];
      if (!sets) return;
      const vi = e.type === 'creeper' ? (e.seed < 0.5 ? 0 : 1) : 0;
      const set = sets[vi];
      const flip = e.facing < 0;
      const sc = 0.93 + e.seed * 0.14;
      let y = e.y;
      if (e.type === 'ghost') y += -2.5 + Math.sin(view.rt * 3 + e.seed * 9) * 1.4;
      const alphaBase = e.type === 'ghost' ? 0.92 : 1;
      if (e.dying) {
        const dfs = SPR.death[e.type][vi];
        const i = Math.min(dfs.length - 1, Math.floor(e.deathT * dfs.length));
        ctx.globalAlpha = alphaBase * (1 - e.deathT * 0.3);
        blit(ctx, dfs[i], e.x, y, flip, sc * (1 + e.deathT * 0.12));
        ctx.globalAlpha = 1;
        return;
      }
      const speedK = e.type === 'colossus' ? 0.45 : e.type === 'ghost' ? 0.35 : 0.7;
      const fr = set[Math.floor(e.anim * speedK) & 3];
      if (e.spawnT < 1) {
        // ink drops onto the paper and spreads: a soft blot first, then the strokes
        const st = e.spawnT, soft = SPR.soft[e.type][vi];
        const sy = 0.7 + 0.3 * U.ease.outQuad(st);
        ctx.globalAlpha = alphaBase * Math.sin(Math.PI * Math.min(1, st * 1.1)) * 0.85;
        const ax = flip ? soft.wu - soft.ax : soft.ax;
        ctx.drawImage(flip ? soft.f : soft.c, e.x - ax * sc * 1.08, y - soft.ay * sc * sy, soft.wu * sc * 1.08, soft.hu * sc * sy);
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
        ctx.globalAlpha = Math.min(0.85, e.flash * 1.4) * alphaBase;
        blit(ctx, fr, e.x, y, flip, sc, flip ? fr.flf : fr.fl);
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      const rt = view.rt;
      let fr, bob;
      if (p.moving) {
        const ph = p.anim * 0.8;
        fr = SPR.sage.walk[Math.floor(ph) & 3];
        bob = -0.9 * Math.abs(Math.cos(ph * Math.PI / 2));
      } else {
        fr = SPR.sage.idle[Math.floor(rt * 1.4) & 1];
        bob = 0;
      }
      const flip = p.facing < 0;
      if (p.dashT > 0) {
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = 0.2 / i;
          blit(ctx, fr, p.x - p.dashX * 6 * i, p.y - p.dashY * 6 * i + bob, flip);
        }
        ctx.globalAlpha = 1;
      }
      let a = 1;
      if (p.iframes > 0 && p.hurtT < 0.7 && Math.floor(rt * 14) % 2 === 0) a = 0.45;
      ctx.globalAlpha = a;
      blit(ctx, fr, p.x, p.y + bob, flip);
      if (p.hurtT > 0.4) {
        ctx.globalAlpha = Math.min(1, (p.hurtT - 0.4) * 2.2);
        blit(ctx, fr, p.x, p.y + bob, flip, 1, flip ? fr.flf : fr.fl);
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const s = FX.ensoS[o.idx & 1];
      const bob = Math.sin(view.rt * 3 + o.idx * 1.7) * 1.1;
      ctx.save();
      ctx.translate(o.x, o.y - 4 + bob);
      ctx.rotate(view.rt * 2.2 + o.idx * 2);
      ctx.drawImage(s.c, -s.ax, -s.ay, s.wu, s.hu);
      ctx.restore();
      ctx.fillStyle = VERM_CSS;
      ctx.beginPath(); ctx.arc(o.x, o.y - 4 + bob, 1.1, 0, TAU); ctx.fill();
    },

    drawProjectile(ctx, pr) {
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.angle);
      ctx.globalAlpha = Math.min(1, pr.age * 12) * Math.min(1, pr.life * 6);
      const s = FX.proj;
      ctx.drawImage(s.c, -s.ax, -s.ay, s.wu, s.hu);
      ctx.restore();
      ctx.globalAlpha = 1;
    },

    drawParticle(ctx, pt, view) {
      const life = pt.life / pt.max;
      const own = groundLive && view && groundFrame === view.rt;
      switch (pt.kind) {
        case 'drop': {
          if (landed(pt)) { if (!own) groundFx(ctx, pt); return; }
          const set = pt.red ? FX.dropR : FX.drop, s = pt.size;
          ctx.globalAlpha = 0.95;
          ctx.drawImage(set[(pt.v || 0) % set.length].c, pt.x - s / 2, pt.y - pt.z - s / 2, s, s);
          break;
        }
        case 'splash': {
          const set = pt.red ? FX.splashR : FX.splash;
          const age = 1 - life, s = pt.size * (0.55 + 0.6 * Math.sqrt(age));
          ctx.globalAlpha = Math.min(1, life * 2.2) * (pt.a || 0.85);
          ctx.save();
          ctx.translate(pt.x, pt.y - pt.z);
          ctx.rotate(pt.rot);
          ctx.drawImage(set[(pt.v || 0) % set.length].c, -s / 2, -s / 2, s, s);
          ctx.restore();
          break;
        }
        case 'ring': if (!own) groundFx(ctx, pt); return;
        case 'enso': {
          // the circle is painted in one movement, then fades into the paper
          const age = 1 - life, sweep = Math.min(1, age * 2.6), s = FX.enso, sc = pt.size / 30;
          ctx.save();
          ctx.translate(pt.x, pt.y - 12);
          ctx.scale(sc, sc * 0.82);
          if (sweep < 1) {
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.arc(0, 0, 40, Math.PI * 0.6, Math.PI * 0.6 + TAU * sweep * 0.92);
            ctx.closePath(); ctx.clip();
          }
          ctx.globalAlpha = Math.min(1, life * 2.5);
          ctx.drawImage(s.c, -s.ax, -s.ay, s.wu, s.hu);
          ctx.restore();
          break;
        }
        case 'petal': {
          const s = pt.size * (0.8 + 0.2 * Math.sin(pt.rot * 2));
          ctx.globalAlpha = Math.min(1, life * 2.5);
          ctx.save();
          ctx.translate(pt.x + Math.sin(pt.seed * 20 + pt.life * 6) * 2, pt.y - pt.z);
          ctx.rotate(pt.rot);
          ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(pt.rot * 1.3)));
          ctx.drawImage(FX.petal[(pt.v || 0) % 3].c, -s / 2, -s / 2, s, s);
          ctx.restore();
          break;
        }
        case 'smear': {
          ctx.globalAlpha = life * 0.8;
          ctx.save();
          ctx.translate(pt.x, pt.y - pt.z);
          ctx.rotate(pt.rot);
          const s = FX.smear;
          ctx.drawImage(s.c, -s.ax, -s.ay, s.wu, s.hu);
          ctx.restore();
          break;
        }
        case 'puff': {
          const age = 1 - life, s = pt.size * (0.6 + 0.7 * Math.sqrt(age));
          ctx.globalAlpha = life * 0.85;
          ctx.drawImage(FX.puff.c, pt.x - s / 2, pt.y - pt.z - s / 2, s, s);
          break;
        }
        default: {
          ctx.globalAlpha = Math.min(1, life * 2);
          ctx.fillStyle = pt.color || INK;
          ctx.beginPath(); ctx.arc(pt.x, pt.y - pt.z, pt.size * 0.5, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n) {
      const life = n.life / n.max, age = 1 - life;
      const pop = age < 0.12 ? 0.55 + (age / 0.12) * 0.6 : 1.15 - Math.min(0.15, (age - 0.12) * 0.5);
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate((n.seed - 0.5) * 0.24);
      ctx.scale(pop, pop);
      ctx.globalAlpha = Math.min(1, life * 2.6);
      ctx.font = (n.crit ? '400 13px' : '400 10px') + ' "Ma Shan Zheng", "Yuji Mai", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const txt = String(n.value);
      if (n.crit) {
        // stamped like a seal: vermilion square, paper-coloured numerals
        const w = Math.max(14, ctx.measureText(txt).width + 6);
        ctx.drawImage(FX.sealBox, -w / 2, -8, w, 15);
        ctx.fillStyle = '#f9f4e8';
        ctx.fillText(txt, 0, 0.5);
      } else {
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = 'rgba(249,244,232,0.85)';
        ctx.strokeText(txt, 0, 0);
        ctx.fillStyle = T[0];
        ctx.fillText(txt, 0, 0);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    },

    drawWorldOverlay(ctx, view) {
      // slow bands of mist drifting across the painting
      const cw = 460, ch = 230, t = view.rt;
      const x0 = Math.floor((view.x0 - 300) / cw), x1 = Math.floor((view.x1 + 40) / cw);
      const y0 = Math.floor((view.y0 - 40) / ch), y1 = Math.floor((view.y1 + 40) / ch);
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = hsh(cx, cy, 5150);
          if ((h & 7) > 2) continue;
          const r1 = ((h >>> 3) & 255) / 255, r2 = ((h >>> 11) & 255) / 255, r3 = ((h >>> 19) & 255) / 255;
          const v = 5 + r2 * 6, f = ((r1 * cw + t * v) % cw) / cw;
          const w = 240 + r3 * 140, hh = w * 0.26;
          const mx = cx * cw + f * cw, my = cy * ch + r3 * ch;
          ctx.globalAlpha = 0.32 * Math.sin(Math.PI * f);
          ctx.drawImage(FX.mist, mx - w / 2, my - hh / 2, w, hh);
        }
      }
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
      const h = (HEIGHT[e.type] || 16) * 0.5;
      if (src === 'lantern' || e.type === 'ghost') game.addParticle({ x: e.x, y: e.y, z: h, kind: 'puff', life: 0.35, size: e.type === 'colossus' ? 20 : 13, drag: 0 });
      game.addParticle({ x: e.x, y: e.y, z: h, kind: 'splash', life: 0.24, size: e.type === 'colossus' ? 16 : 11, drag: 0, rot: Math.random() * TAU, v: (Math.random() * 2) | 0, a: 0.75 });
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 50;
        game.addParticle({ x: e.x, y: e.y, z: h, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 20 + Math.random() * 40, grav: 240, kind: 'drop', life: 0.7 + Math.random() * 0.5, size: 1 + Math.random() * 1.2, drag: 1.5, v: (Math.random() * 3) | 0 });
      }
    },
    onKill(game, e) {
      const h = (HEIGHT[e.type] || 16) * 0.5, big = e.type === 'colossus';
      if (e.type === 'ghost') {
        for (let i = 0; i < 3; i++) game.addParticle({ x: e.x + (Math.random() - 0.5) * 8, y: e.y, z: h + Math.random() * 6, vx: (Math.random() - 0.5) * 20, vz: 14, kind: 'puff', life: 0.7 + Math.random() * 0.3, size: 14 + Math.random() * 6, drag: 1 });
        inkBurst(game, e.x, e.y, h, 4, 50, 1.6);
      } else inkBurst(game, e.x, e.y, h, big ? 22 : 10, big ? 110 : 75, big ? 3.4 : 2.4);
      game.addParticle({ x: e.x, y: e.y, kind: 'ring', life: big ? 1.5 : 1.0, size: big ? 32 : 15, drag: 0 });
      game.addParticle({ x: e.x, y: e.y, z: h, kind: 'splash', life: 0.3, size: big ? 32 : 17, drag: 0, rot: Math.random() * TAU, v: (Math.random() * 2) | 0, a: e.type === 'ghost' ? 0.45 : 0.85 });
    },
    onHurt(game, p) {
      game.addParticle({ x: p.x, y: p.y, z: 14, kind: 'splash', life: 0.3, size: 18, drag: 0, rot: Math.random() * TAU, v: 0, a: 0.8 });
      inkBurst(game, p.x, p.y, 14, 8, 70, 2.2, 0.35);
    },
    onPickup(game, g) {
      if (g.big) {
        for (let i = 0; i < 5; i++) game.addParticle({ x: g.x + (Math.random() - 0.5) * 8, y: g.y, z: 6 + Math.random() * 10, vx: (Math.random() - 0.5) * 30, vz: 18, grav: 20, kind: 'petal', life: 0.8 + Math.random() * 0.4, size: 3.4, drag: 2, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 6, v: i % 3 });
        game.addParticle({ x: g.x, y: g.y, kind: 'ring', life: 0.7, size: 10, drag: 0 });
      } else {
        game.addParticle({ x: g.x, y: g.y, kind: 'ring', life: 0.45, size: 6, drag: 0 });
      }
    },
    onShoot(game, pr) {
      if (Math.random() < 0.4) {
        game.addParticle({ x: pr.x, y: pr.y + 4, z: 4, vx: pr.vx * 0.08 + (Math.random() - 0.5) * 20, vy: pr.vy * 0.08, vz: 25, grav: 200, kind: 'drop', life: 0.6, size: 1.1, drag: 2, v: (Math.random() * 3) | 0 });
      }
    },
    onDash(game, p) {
      game.addParticle({ x: p.x - p.dashX * 4, y: p.y, z: 12, kind: 'smear', life: 0.4, size: 1, drag: 0, rot: Math.atan2(p.dashY, p.dashX), vr: 0 });
      for (let i = 0; i < 4; i++) game.addParticle({ x: p.x, y: p.y, z: 0, vx: -p.dashX * (20 + Math.random() * 30) + (Math.random() - 0.5) * 20, vy: -p.dashY * 20 + (Math.random() - 0.5) * 14, vz: 0, kind: 'drop', life: 1.0, size: 1.3, drag: 4, v: i % 3 });
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y, kind: 'enso', life: 1.4, size: 40, drag: 0 });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * 55, vy: Math.sin(a) * 36, vz: 30, grav: 30, kind: 'petal', life: 1.0 + Math.random() * 0.5, size: 3 + Math.random() * 1.5, drag: 2.2, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 7, v: i % 3 });
      }
    },
    onDeath(game, p) {
      game.addParticle({ x: p.x, y: p.y, z: 14, kind: 'splash', life: 0.9, size: 36, drag: 0, rot: Math.random() * TAU, v: 1, a: 0.9 });
      inkBurst(game, p.x, p.y, 16, 24, 110, 3, 0.25);
      game.addParticle({ x: p.x, y: p.y, kind: 'ring', life: 1.6, size: 44, drag: 0 });
    },
  });
})();
