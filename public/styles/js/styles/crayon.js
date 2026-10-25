/* Crayon Kids – a child's wax-crayon drawing brought to life.
   Bright, slightly toothy white drawing paper; everything is drawn with waxy crayon strokes whose colour skips on the
   paper tooth. Fills are zigzag scribbles that go outside the lines, outlines wobble and "boil" between three redrawn
   variants, proportions are naive (big heads, stick limbs). Lollipop trees, triangle-roof houses, a scribbled pond,
   a brown dirt path – and lots of white paper. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;

  /* ===================================================================================== palette */
  const PAPER = [251, 248, 239];
  const cPaper = 'rgb(251,248,239)';
  const INK = [43, 42, 48];          // black crayon
  const RED = [226, 54, 44];
  const ORANGE = [247, 139, 31];
  const YELLOW = [253, 206, 40];
  const GREEN = [66, 174, 58];       // grass green
  const DGREEN = [33, 122, 56];
  const LGREEN = [158, 206, 58];
  const SKY = [66, 168, 234];        // sky blue
  const BLUE = [42, 94, 200];
  const PURPLE = [140, 76, 196];
  const DPURPLE = [92, 44, 140];
  const PINK = [246, 126, 180];
  const BROWN = [148, 88, 44];
  const TAN = [216, 162, 98];
  const PEACH = [252, 198, 152];
  const GREY = [146, 144, 152];
  const PALE = [168, 214, 246];      // ghost blue
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const R = (a, b, rng) => a + (b - a) * rng.next();
  const J = (s, rng) => (rng.next() - 0.5) * 2 * s;

  let K = 4; // sprite px per world unit

  /** Groups many strokes by (colour, alpha, width) into Path2Ds – far fewer stroke() calls. */
  class Batch {
    constructor() { this.m = new Map(); }
    path(c, a, w) {
      const aq = Math.round(a * 20) / 20, wq = Math.round(w * 10) / 10;
      const k = (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + '|' + aq + '|' + wq;
      let b = this.m.get(k);
      if (!b) { b = { p: new Path2D(), s: rgba(c, aq), w: wq }; this.m.set(k, b); }
      return b.p;
    }
    flush(ctx) { for (const b of this.m.values()) { ctx.lineWidth = b.w; ctx.strokeStyle = b.s; ctx.stroke(b.p); } this.m.clear(); }
  }

  /* ===================================================================================== geometry */
  function ell(cx, cy, rx, ry, n, rot) {
    n = n || 24;
    const out = [], c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      out.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return out;
  }
  function spl(pts, sub, closed) {
    const out = [], n = pts.length;
    const P = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let s = 0; s < sub; s++) {
        const t = s / sub, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }
  function poly(ctx, pts) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }
  const mv = (pts, dx, dy) => pts.map((p) => [p[0] + dx, p[1] + dy]);
  function resample(pts, closed, step) {
    const src = closed ? pts.concat([pts[0]]) : pts;
    const out = [src[0].slice()];
    let carry = 0;
    for (let i = 1; i < src.length; i++) {
      const a = src[i - 1], b = src[i];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 1e-6) continue;
      let d = step - carry;
      while (d <= L) {
        const t = d / L;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        d += step;
      }
      carry = L - (d - step);
    }
    const last = src[src.length - 1], lo = out[out.length - 1];
    if (Math.hypot(last[0] - lo[0], last[1] - lo[1]) > step * 0.3) out.push(last.slice());
    return out;
  }
  function starPts(x, y, r0, r1, n, rot) {
    const out = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (rot || 0) + (i / (n * 2)) * TAU - Math.PI / 2, r = i & 1 ? r1 : r0;
      out.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    return out;
  }
  function heartPts(cx, cy, s, n) {
    const p = [];
    n = n || 30;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU;
      p.push([cx + s * 16 * Math.pow(Math.sin(t), 3) / 16, cy - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]);
    }
    return p;
  }
  /** Lumpy hand-drawn circle. */
  function blob(cx, cy, rx, ry, rng, lump, n) {
    n = n || 26;
    const out = [], p1 = rng.next() * TAU, p2 = rng.next() * TAU;
    lump = lump === undefined ? 0.06 : lump;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, k = 1 + lump * Math.sin(a * 3 + p1) + lump * 0.6 * Math.sin(a * 5 + p2);
      out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return out;
  }
  /** Scalloped cloud / bush outline. */
  function puffPts(cx, cy, rx, ry, bumps, rng, n) {
    n = n || 48;
    const out = [], ph = rng.next() * TAU;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, k = 0.84 + 0.2 * Math.abs(Math.sin(a * bumps / 2 + ph));
      out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return out;
  }
  function lens(bx, by, ang, len, wid) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
    return spl([[bx, by], [mx + nx * wid, my + ny * wid], [bx + dx * len, by + dy * len], [mx - nx * wid, my - ny * wid]], 4, true);
  }

  /* ===================================================================================== crayon toolkit */
  /** Low-frequency hand wobble along the line normal + a little jitter. */
  function wobble(pts, step, amp, rng) {
    const P = resample(pts, false, step);
    const n = P.length;
    if (n < 2) return P;
    const f1 = R(0.16, 0.3, rng), f2 = R(0.55, 1.0, rng), p1 = rng.next() * TAU, p2 = rng.next() * TAU;
    const out = new Array(n);
    let s = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      const a = P[i > 0 ? i - 1 : 0], b = P[i < n - 1 ? i + 1 : n - 1];
      let nx = a[1] - b[1], ny = b[0] - a[0];
      const l = Math.hypot(nx, ny) || 1;
      nx /= l; ny /= l;
      const off = amp * (0.65 * Math.sin(s * f1 + p1) + 0.35 * Math.sin(s * f2 + p2)) + J(amp * 0.15, rng);
      out[i] = [P[i][0] + nx * off, P[i][1] + ny * off];
    }
    return out;
  }
  /** Wax crayon line: pressure runs + a lighter second pass. Closed loops overshoot their start like a real hand. */
  function wax(ctx, pts, o) {
    const rng = o.rng, w = o.w || 1, c = o.c || INK, a = o.a === undefined ? 1 : o.a;
    let src = pts;
    if (o.closed) {
      const n = pts.length, i0 = (rng.next() * n) | 0;
      let cx = 0, cy = 0;
      for (const p of pts) { cx += p[0]; cy += p[1]; }
      cx /= n; cy /= n;
      const ov = Math.max(2, Math.round(n * R(0.07, 0.2, rng)));
      const drift = R(0.3, 0.9, rng) * w * (o.drift === undefined ? 1 : o.drift);
      src = [];
      for (let i = 0; i <= n; i++) src.push(pts[(i0 + i) % n]);
      for (let i = 1; i <= ov; i++) {
        const p = pts[(i0 + i) % n], dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1, k = (drift * i) / ov;
        src.push([p[0] + (dx / l) * k, p[1] + (dy / l) * k]);
      }
    }
    const P = wobble(src, o.step || 0.7, o.wob === undefined ? 0.2 : o.wob, rng);
    if (P.length < 2) return;
    let i = 0;
    while (i < P.length - 1) {
      const e = Math.min(P.length - 1, i + 4 + ((rng.next() * 6) | 0));
      ctx.beginPath();
      ctx.moveTo(P[i][0], P[i][1]);
      for (let k = i + 1; k <= e; k++) ctx.lineTo(P[k][0], P[k][1]);
      ctx.lineWidth = w * R(0.86, 1.08, rng);
      ctx.strokeStyle = rgba(c, a * R(0.8, 1, rng));
      ctx.stroke();
      i = e;
    }
    if (o.dbl !== false && P.length > 2) {
      const ox = J(w * 0.32, rng), oy = J(w * 0.32, rng);
      ctx.beginPath();
      ctx.moveTo(P[0][0] + ox, P[0][1] + oy);
      for (let k = 1; k < P.length; k++) ctx.lineTo(P[k][0] + ox, P[k][1] + oy);
      ctx.lineWidth = w * 0.55;
      ctx.strokeStyle = rgba(c, a * 0.5);
      ctx.stroke();
    }
  }
  /**
   * Zigzag scribble fill: diagonal back-and-forth sweeps across the shape. Sweep ends overshoot the outline (or stop
   * short) at random – colouring that goes outside the lines and leaves little white gaps.
   */
  /** Extent [t0, t1] (along d) of the polygon on the scan line {p·n = off}, or null. */
  const IV = [0, 0];
  function span(pts, dx, dy, nx, ny, off) {
    let t0 = 1e9, t1 = -1e9;
    const N = pts.length;
    for (let i = 0; i < N; i++) {
      const A = pts[i], B = pts[(i + 1) % N];
      const va = A[0] * nx + A[1] * ny - off, vb = B[0] * nx + B[1] * ny - off;
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      const s = (A[0] + (B[0] - A[0]) * t) * dx + (A[1] + (B[1] - A[1]) * t) * dy;
      if (s < t0) t0 = s;
      if (s > t1) t1 = s;
    }
    if (t0 > t1) return null;
    IV[0] = t0; IV[1] = t1;
    return IV;
  }
  /** Zigzag turn points across `pts` (optionally limited to the square `clip`). */
  function zigPts(pts, clip, ang, sp, over, rng) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const src = clip || pts;
    let n0 = 1e9, n1 = -1e9;
    for (const p of src) { const v = p[0] * nx + p[1] * ny; if (v < n0) n0 = v; if (v > n1) n1 = v; }
    const zig = [];
    let side = rng.next() < 0.5 ? 1 : 0;
    for (let off = n0 + sp * 0.3; off < n1 - sp * 0.05; off += sp * R(0.75, 1.25, rng)) {
      const iv = span(pts, dx, dy, nx, ny, off);
      if (!iv) continue;
      let t0 = iv[0] - over * R(-0.4, 1, rng), t1 = iv[1] + over * R(-0.4, 1, rng);
      if (clip) {
        const cv = span(clip, dx, dy, nx, ny, off);
        if (!cv) continue;
        t0 = Math.max(t0, cv[0] + J(1.2, rng));
        t1 = Math.min(t1, cv[1] + J(1.2, rng));
        if (t1 - t0 < sp * 0.6) continue;
      }
      const s = side ? t1 : t0;
      zig.push([dx * s + nx * off, dy * s + ny * off]);
      side ^= 1;
    }
    return zig;
  }
  function scribble(ctx, pts, o) {
    const rng = o.rng, ang = o.ang === undefined ? -0.55 : o.ang, sp = o.sp || 1, w = o.w || sp * 1.05;
    const c = o.c, a = o.a === undefined ? 0.85 : o.a, over = o.over === undefined ? 0.5 : o.over;
    const bt = o.batch || new Batch();
    if (o.cell) {
      // big areas: coloured in short back-and-forth patches, each at its own slightly different angle
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
      const L = o.cell, st = L * 0.78;
      for (let gy = y0 - L * 0.2; gy < y1 + L * 0.2; gy += st) {
        for (let gx = x0 - L * 0.2 + ((((gy - y0) / st) | 0) & 1) * st * 0.5; gx < x1 + L * 0.2; gx += st) {
          const cx = gx + J(L * 0.14, rng), cy = gy + J(L * 0.14, rng), h = (L / 2) * R(0.85, 1.15, rng);
          const sq = [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]];
          const zig = zigPts(pts, sq, ang + J(o.angJ === undefined ? 0.4 : o.angJ, rng), sp, over, rng);
          drawZig(bt, zig, c, a, w, sp, o.bow, rng);
        }
      }
    } else drawZig(bt, zigPts(pts, null, ang, sp, over, rng), c, a, w, sp, o.bow, rng);
    if (!o.batch) bt.flush(ctx);
  }
  function drawZig(bt, zig, c, a, w, sp, bow, rng) {
    if (zig.length < 2) return;
    bow = bow === undefined ? 0.5 : bow;
    let i = 0;
    while (i < zig.length - 1) {
      const e = Math.min(zig.length - 1, i + 2 + ((rng.next() * 4) | 0));
      const p = bt.path(c, a * R(0.75, 1, rng), w * R(0.85, 1.1, rng));
      p.moveTo(zig[i][0], zig[i][1]);
      for (let k = i + 1; k <= e; k++) {
        const A = zig[k - 1], B = zig[k];
        p.quadraticCurveTo((A[0] + B[0]) / 2 + J(sp * bow, rng), (A[1] + B[1]) / 2 + J(sp * bow, rng), B[0], B[1]);
      }
      i = e;
    }
  }
  function flat(ctx, pts, c, a) { ctx.beginPath(); poly(ctx, pts); ctx.fillStyle = rgba(c, a); ctx.fill(); }
  function dot(ctx, x, y, r, c, a) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = rgba(c, a === undefined ? 1 : a); ctx.fill(); }
  /** The standard "coloured-in shape": light wax layer, zigzag scribble, wobbly outline. */
  function shape(ctx, pts, fill, line, rng, o) {
    o = o || {};
    if (fill) {
      flat(ctx, pts, fill, o.base === undefined ? 0.4 : o.base);
      scribble(ctx, pts, { rng, c: fill, a: o.fa === undefined ? 0.85 : o.fa, sp: o.sp || 0.95, w: o.sw, ang: o.ang, over: o.over === undefined ? 0.6 : o.over });
    }
    if (line) wax(ctx, pts, { rng, closed: true, w: o.lw || 0.9, c: line, a: 1, wob: o.wob });
  }

  /* ===================================================================================== paper tooth + sprite pipeline */
  const TN = 160;
  let TOOTH = null, PAPERTEX = null;
  /** Alpha map of the paper valleys where wax does not reach (tileable, 160 px). */
  function buildTooth() {
    const { c, ctx } = U.canvas(TN, TN);
    const im = ctx.createImageData(TN, TN), d = im.data;
    for (let y = 0; y < TN; y++) {
      for (let x = 0; x < TN; x++) {
        const n1 = U.perlin(x / 4, y / 2.5, 11, TN / 4, TN / 2.5);
        const n2 = U.perlin(x / 1.6, y / 1.25, 12, TN / 1.6, TN / 1.25);
        const n3 = U.perlin(x / 16, y / 10, 14, TN / 16, TN / 10);
        const h = U.hash2(x, y, 13);
        const v = 0.5 * n1 + 0.34 * n2 + 0.22 * n3 + 0.24 * (h - 0.5);
        d[(y * TN + x) * 4 + 3] = U.clamp((v - 0.1) / 0.26, 0, 1) * 235;
      }
    }
    ctx.putImageData(im, 0, 0);
    TOOTH = c;
  }
  /** The drawing paper itself: warm white with faint mottling, tooth shading and a few fibres (tileable, 256 px). */
  function buildPaper() {
    const N = 256;
    const { c, ctx } = U.canvas(N, N);
    const im = ctx.createImageData(N, N), d = im.data;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const m = U.perlin(x / 64, y / 64, 21, 4, 4) * 2.2 + U.perlin(x / 16, y / 16, 22, 16, 16) * 1.2;
        const g = U.perlin(x / 2, y / 1.6, 23, 128, 160) * 3.2 + (U.hash2(x, y, 24) - 0.5) * 2.4;
        let k = m + g;
        if (U.hash2(x, y, 25) < 0.0016) k -= 26;
        const o = (y * N + x) * 4;
        d[o] = PAPER[0] + k; d[o + 1] = PAPER[1] + k; d[o + 2] = PAPER[2] + k * 1.15; d[o + 3] = 255;
      }
    }
    ctx.putImageData(im, 0, 0);
    const rng = U.rng(99);
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = rng.next() * N, y = rng.next() * N, a = rng.next() * TAU, L = R(4, 12, rng);
      U.tileDraw(ctx, N, N, (cx, ox, oy) => {
        cx.beginPath();
        cx.moveTo(x + ox, y + oy);
        cx.quadraticCurveTo(x + ox + Math.cos(a) * L * 0.5 + J(2, rng), y + oy + Math.sin(a) * L * 0.5, x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L);
        cx.strokeStyle = 'rgba(150,135,110,0.13)';
        cx.lineWidth = 0.7;
        cx.stroke();
      });
    }
    PAPERTEX = c;
  }
  let toothSeed = 1;
  function tooth(ctx, w, h, k) {
    if (k <= 0) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = k;
    const pat = ctx.createPattern(TOOTH, 'repeat');
    const s = toothSeed++;
    const ox = (s * 37) % TN, oy = (s * 91) % TN;
    ctx.translate(-ox, -oy);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w + ox, h + oy);
    ctx.restore();
  }
  /**
   * Offscreen crayon sprite covering world rect [x0,x1]x[y0,y1] around the anchor (0,0) = feet.
   * The wax gets the paper tooth; a paper-white margin ("halo") is left around the drawing, the way a child colours
   * the background up to a figure and leaves a little white gap.
   */
  function mk(x0, y0, x1, y1, draw, opt) {
    opt = opt || {};
    const kk = opt.k || K;
    const halo = opt.halo === undefined ? 0.9 : opt.halo;
    const pad = (opt.pad === undefined ? 1.2 : opt.pad) + halo;
    const ax = Math.round((pad - x0) * kk), ay = Math.round((pad - y0) * kk);
    const w = Math.ceil((x1 - x0 + pad * 2) * kk), h = Math.ceil((y1 - y0 + pad * 2) * kk);
    const A = U.canvas(w, h);
    const a = A.ctx;
    a.setTransform(kk, 0, 0, kk, ax, ay);
    a.lineCap = 'round';
    a.lineJoin = 'round';
    draw(a);
    a.setTransform(1, 0, 0, 1, 0, 0);
    tooth(a, w, h, opt.tooth === undefined ? 1 : opt.tooth);
    let out = A.c;
    if (halo > 0) {
      const M = U.canvas(w, h);
      M.ctx.drawImage(A.c, 0, 0);
      M.ctx.globalCompositeOperation = 'source-in';
      M.ctx.fillStyle = cPaper;
      M.ctx.fillRect(0, 0, w, h);
      const O = U.canvas(w, h);
      const r = halo * kk;
      O.ctx.globalAlpha = opt.haloA === undefined ? 1 : opt.haloA;
      for (let k = 0; k < 12; k++) {
        const an = (k / 12) * TAU;
        O.ctx.drawImage(M.c, Math.cos(an) * r, Math.sin(an) * r);
        if (k & 1) O.ctx.drawImage(M.c, Math.cos(an) * r * 0.5, Math.sin(an) * r * 0.5);
      }
      O.ctx.drawImage(M.c, 0, 0);
      O.ctx.drawImage(M.c, 0, 0);
      O.ctx.globalAlpha = 1;
      O.ctx.drawImage(A.c, 0, 0);
      out = O.c;
    }
    const s = { c: out, ax, ay, k: kk };
    if (opt.flash) s.f = U.tint(out, '#ffffff', 0.72);
    if (opt.hurt) s.h = U.tint(A.c, 'rgb(226,54,44)', 0.6);
    return s;
  }
  function flipSpr(s) {
    const w = s.c.width;
    return { c: U.flipX(s.c), ax: w - s.ax, ay: s.ay, k: s.k, f: s.f ? U.flipX(s.f) : null, h: s.h ? U.flipX(s.h) : null };
  }

  /* ===================================================================================== characters (drawn facing right) */
  /* ---------- main character: a kid with a red cape ---------- */
  function drawKid(ctx, rng, mode, ph) {
    const walk = mode === 'walk', dash = mode === 'dash', idle = mode === 'idle';
    const sw = walk ? Math.sin(ph * TAU) : 0;
    const by = walk ? -Math.abs(Math.cos(ph * TAU)) * 1.3 : idle ? (ph > 0.5 ? -0.6 : 0) : -1.2;
    const fl = walk ? Math.cos(ph * TAU) : idle ? (ph > 0.5 ? 0.6 : -0.3) : 0;
    // cape (behind everything)
    let cape;
    if (dash) cape = spl([[-3.2, -15.8], [2.2, -16], [-1, -12.4], [-7, -10.6], [-13.5, -9.4], [-17, -11.6], [-15.5, -14.2], [-17.2, -16.6], [-10, -17.6]], 3, true);
    else cape = spl([[-3.4, -15.6 + by], [2.2, -15.9 + by], [-0.6, -11 + by], [-2.2, -3.4], [-5.6, -2.2 + fl * 0.6], [-8.6, -3.6 + fl], [-12.2, -2.8 + fl * 1.3], [-10.6, -9.6 + by], [-7, -14.8 + by]], 3, true);
    shape(ctx, cape, RED, INK, rng, { ang: -0.9, sp: 0.95, lw: 0.85 });
    // legs + shoes
    for (const s of [-1, 1]) {
      let hip, foot;
      if (dash) { hip = [s * 1.3 - 0.6, -7 + by]; foot = s < 0 ? [-5.6, -2.2] : [2.4, -0.6]; }
      else {
        const lift = walk ? Math.max(0, -sw * s) * 1.8 : 0;
        hip = [s * 1.5, -7 + by];
        foot = [s * 2 + (walk ? sw * s * 3 : 0), -lift];
      }
      wax(ctx, [hip, [(hip[0] + foot[0]) / 2 + 0.3, (hip[1] + foot[1]) / 2], foot], { rng, w: 1.25, c: INK, dbl: false });
      const shoe = blob(foot[0] + 0.9, foot[1] - 0.4, 1.9, 1.15, rng, 0.05, 16);
      flat(ctx, shoe, RED, 0.9);
      wax(ctx, shoe, { rng, closed: true, w: 0.6, c: INK, dbl: false, step: 0.5 });
    }
    // back arm
    const sh = [-2.9, -14.2 + by];
    const bh = dash ? [-6.8, -10.8 + by] : idle ? [-7.2, -10.4 + by + (ph > 0.5 ? -0.5 : 0)] : [-5.8 - sw * 1.6, -10.2 + by];
    wax(ctx, [sh, [(sh[0] + bh[0]) / 2, (sh[1] + bh[1]) / 2 - 0.4], bh], { rng, w: 1.1, c: INK, dbl: false });
    // shirt
    const shirt = [[-3.4, -15.5 + by], [3.4, -15.5 + by], [4.6, -6.4 + by], [-4.6, -6.4 + by]];
    shape(ctx, spl(shirt, 3, true), BLUE, INK, rng, { ang: -0.5, sp: 0.85, lw: 0.9 });
    const st = starPts(0.4, -11 + by, 2.4, 1.05, 5, 0.1);
    flat(ctx, st, YELLOW, 1);
    wax(ctx, st, { rng, closed: true, w: 0.45, c: ORANGE, dbl: false, step: 0.4, wob: 0.08 });
    // hands
    dot(ctx, bh[0], bh[1], 1.15, PEACH, 1);
    wax(ctx, ell(bh[0], bh[1], 1.15, 1.15, 10), { rng, closed: true, w: 0.45, c: INK, dbl: false, step: 0.4, wob: 0.06 });
    const fs = [2.9, -14.2 + by];
    const fh = dash ? [10.2, -15.6 + by] : idle ? [7.4, -10.4 + by + (ph > 0.5 ? -0.5 : 0)] : [5.8 + sw * 1.6, -10.2 + by];
    wax(ctx, [fs, [(fs[0] + fh[0]) / 2, (fs[1] + fh[1]) / 2 - 0.4], fh], { rng, w: 1.1, c: INK, dbl: false });
    dot(ctx, fh[0], fh[1], 1.3, PEACH, 1);
    wax(ctx, ell(fh[0], fh[1], 1.3, 1.3, 10), { rng, closed: true, w: 0.45, c: INK, dbl: false, step: 0.4, wob: 0.06 });
    // head
    const hx = dash ? 1.6 : 0.6, hy = -22.2 + by;
    const head = blob(hx, hy, 7.1, 6.8, rng, 0.025, 30);
    shape(ctx, head, PEACH, null, rng, { ang: -0.6, sp: 0.85, base: 0.6, fa: 0.75 });
    // hair: messy brown spikes on top, a zigzag fringe over the forehead
    const hair = [];
    const nsp = 8;
    for (let i = 0; i <= nsp * 2; i++) {
      const a = Math.PI - 0.3 + (i / (nsp * 2)) * (Math.PI - 0.15);
      const r = i & 1 ? 8.5 + J(0.7, rng) + (i === 7 || i === 9 ? 0.9 : 0) : 6.9;
      hair.push([hx + Math.cos(a) * r, hy - 0.6 + Math.sin(a) * r * 0.95]);
    }
    hair.push([hx + 5.6, hy - 2.6], [hx + 4.2, hy - 4.6], [hx + 2.8, hy - 3.2], [hx + 1.2, hy - 4.8], [hx - 0.6, hy - 3.4], [hx - 3.6, hy - 3], [hx - 6.2, hy + 0.6]);
    wax(ctx, head, { rng, closed: true, w: 0.95, c: INK });
    shape(ctx, hair, BROWN, INK, rng, { ang: 0.9, sp: 0.75, lw: 0.75, over: 0.4, base: 0.55 });
    // face (toward the facing side)
    const fx = hx + 1.6;
    for (const ex of [fx - 1.3, fx + 2.4]) {
      const e = ell(ex, hy + 0.4, 0.8, 1.1, 10);
      flat(ctx, e, INK, 1);
      dot(ctx, ex + 0.25, hy - 0.05, 0.28, [255, 255, 255], 0.95);
    }
    const sm = [];
    for (let i = 0; i <= 8; i++) { const a = 0.35 + (i / 8) * 2.3; sm.push([fx + 0.6 + Math.cos(a) * 2.5, hy + 2 + Math.sin(a) * 1.8]); }
    wax(ctx, sm, { rng, w: 0.6, c: INK, dbl: false, step: 0.4, wob: 0.06 });
    scribble(ctx, ell(fx + 4.6, hy + 2.6, 1.15, 0.85, 10), { rng, c: PINK, a: 0.9, sp: 0.5, w: 0.6, over: 0.2 });
    scribble(ctx, ell(fx - 3.6, hy + 2.6, 1.0, 0.8, 10), { rng, c: PINK, a: 0.8, sp: 0.5, w: 0.6, over: 0.2 });
  }

  /* ---------- small creature: a scribble monster ---------- */
  function drawScribbler(ctx, rng, fr) {
    const ph = fr / 4, sw = Math.sin(ph * TAU);
    const by = -Math.abs(Math.cos(ph * TAU)) * 1.4;
    for (const s of [-1, 1]) {
      const lift = Math.max(0, -sw * s) * 1.6;
      const f = [s * 3 + sw * s * 1.6, -lift];
      wax(ctx, [[s * 2.6, -4.5 + by], f], { rng, w: 1.05, c: INK, dbl: false });
      wax(ctx, [[f[0] - 0.6, f[1]], [f[0] + 1.6, f[1] - 0.1]], { rng, w: 1.0, c: INK, dbl: false });
    }
    const cx = 0, cy = -11 + by, r = 8;
    // arms up: "rawr"
    wax(ctx, [[-6.4, cy + 0.4], [-9, cy - 2.4 + sw * 0.8], [-9.6, cy - 4.6 + sw]], { rng, w: 1.0, c: INK, dbl: false });
    wax(ctx, [[6.6, cy + 0.8], [9.4, cy - 1.8 - sw * 0.8], [10.2, cy - 4 - sw]], { rng, w: 1.0, c: INK, dbl: false });
    for (const [hx, hy] of [[-9.6, cy - 4.6 + sw], [10.2, cy - 4 - sw]]) {
      for (let k = -1; k <= 1; k++) wax(ctx, [[hx, hy], [hx + k * 1.1, hy - 1.4]], { rng, w: 0.6, c: INK, dbl: false });
    }
    const body = blob(cx, cy, r, r * 0.96, rng, 0.07, 28);
    flat(ctx, body, PURPLE, 0.5);
    scribble(ctx, body, { rng, c: PURPLE, a: 0.9, sp: 0.9, w: 1.0, ang: -0.7, over: 1.2 });
    // the tangle: loopy scribble lines that make it a "scribble monster"
    const tang = [];
    for (let i = 0; i < 16; i++) { const a = rng.next() * TAU, rr = r * Math.sqrt(rng.next()) * 0.95; tang.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    wax(ctx, spl(tang, 5), { rng, w: 0.55, c: DPURPLE, a: 0.85, dbl: false, wob: 0.1 });
    // fuzzy messy outline (two loose loops)
    wax(ctx, blob(cx, cy, r + 0.3, r * 0.98, rng, 0.08, 26), { rng, closed: true, w: 0.9, c: INK, wob: 0.35 });
    wax(ctx, blob(cx, cy, r + 0.9, r + 0.5, rng, 0.1, 22), { rng, closed: true, w: 0.45, c: DPURPLE, a: 0.8, dbl: false, wob: 0.5 });
    // hair tuft
    wax(ctx, [[-2, cy - r + 0.4], [-1.2, cy - r - 2.6], [0, cy - r + 0.2], [1.2, cy - r - 2.8], [2.2, cy - r + 0.4]], { rng, w: 0.7, c: INK, dbl: false, step: 0.5 });
    // googly eyes
    for (const [ex, ey, er] of [[1.2, cy - 2.6, 2.4], [5.2, cy - 2, 1.9]]) {
      const e = ell(ex, ey, er, er, 16);
      flat(ctx, e, [255, 254, 250], 1);
      wax(ctx, e, { rng, closed: true, w: 0.55, c: INK, dbl: false, step: 0.45, wob: 0.06 });
      dot(ctx, ex + er * 0.35, ey + er * 0.15, er * 0.45, INK, 1);
    }
    // jagged mouth with teeth
    const m = [[0, cy + 2.2], [6.8, cy + 1.8], [6, cy + 4.2], [3.4, cy + 5.4], [0.8, cy + 4.4]];
    flat(ctx, m, [70, 20, 40], 0.95);
    for (let k = 0; k < 3; k++) {
      const tx = 1 + k * 2;
      flat(ctx, [[tx, cy + 2.1], [tx + 1.6, cy + 2.0], [tx + 0.8, cy + 3.6]], [255, 254, 250], 1);
    }
    wax(ctx, m, { rng, closed: true, w: 0.55, c: INK, dbl: false, step: 0.45, wob: 0.08 });
  }

  /* ---------- fast creature: a ghost with a zigzag tail ---------- */
  function drawGhost(ctx, rng, fr) {
    const w = Math.sin((fr / 4) * TAU), w2 = Math.cos((fr / 4) * TAU);
    const pts = [];
    for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI; pts.push([1 + Math.cos(a) * 6.4, -14.6 + Math.sin(a) * 6.6]); }
    pts.push([7.2, -11], [6.4, -7.6], [4.4, -5.6 + w * 0.4], [2.6, -3.8 + w * 0.3], [1.2, -5.8], [-0.8, -3.2 + w2 * 0.4], [-2.6, -5.4],
      [-4.8, -2.6 + w * 0.6], [-6.4, -4.8 + w2 * 0.5], [-9, -1.8 + w], [-12.4, -0.6 + w * 1.4], [-9.6, -5.4 + w * 0.7], [-7.2, -8.4 + w * 0.3], [-5.6, -11.4]);
    flat(ctx, pts, PALE, 0.55);
    scribble(ctx, pts, { rng, c: PALE, a: 0.9, sp: 0.95, w: 1.05, ang: 0.6, over: 0.5 });
    scribble(ctx, blob(2.6, -15.6, 3.4, 3, rng, 0.05, 14), { rng, c: [255, 255, 255], a: 0.35, sp: 0.9, w: 0.9, ang: 0.6, over: 0.2 });
    wax(ctx, pts, { rng, closed: true, w: 0.95, c: INK, step: 0.6 });
    // little mitten arms reaching forward
    for (const [ax, ay, rot, k] of [[8.4, -12 + w * 0.5, -0.35, 1], [7.4, -8.8 - w * 0.4, 0.25, 0.85]]) {
      const arm = ell(ax, ay, 2.6 * k, 1.35 * k, 14, rot);
      flat(ctx, arm, PALE, 1);
      wax(ctx, arm, { rng, closed: true, w: 0.8, c: INK, dbl: false, step: 0.45, wob: 0.06 });
    }
    // eyes + "oo" mouth
    for (const ex of [2, 5]) flat(ctx, ell(ex, -15.6, 0.95, 1.6, 12), INK, 1);
    const m = ell(3.7, -11.6 + w * 0.15, 1.05, 1.35 + w * 0.2, 12);
    flat(ctx, m, [60, 40, 70], 0.95);
    wax(ctx, m, { rng, closed: true, w: 0.45, c: INK, dbl: false, step: 0.4, wob: 0.05 });
    scribble(ctx, ell(6.6, -13.2, 0.9, 0.6, 8), { rng, c: PINK, a: 0.7, sp: 0.45, w: 0.55, over: 0.1 });
  }

  /* ---------- large creature: a big scribble dragon ---------- */
  function drawDragon(ctx, rng, fr) {
    const ph = fr / 4, sw = Math.sin(ph * TAU);
    const by = -Math.abs(Math.cos(ph * TAU)) * 1.6;
    const fl = sw * 2.2;
    // tail with arrow tip
    const tail = spl([[-9, -21 + by], [-16, -19 + by], [-21.5, -14 + by * 0.5], [-25.5, -9 - sw], [-22.5, -8.2 - sw], [-18.5, -10.5], [-13, -12.5], [-8, -12.5]], 3, true);
    shape(ctx, tail, GREEN, INK, rng, { ang: 0.7, sp: 1.1, lw: 1.1 });
    const tip = [[-24, -10.5 - sw], [-29.2, -7.4 - sw], [-24.4, -5.2 - sw]];
    shape(ctx, tip, ORANGE, INK, rng, { sp: 0.8, lw: 0.8 });
    for (const [x, y] of [[-12, -21.4], [-17, -18.8], [-21, -15]]) {
      const sp = [[x - 2.2, y + 0.9 + by], [x + 0.2, y - 3 + by], [x + 2, y + 0.4 + by]];
      shape(ctx, sp, YELLOW, INK, rng, { sp: 0.7, lw: 0.65, base: 0.6 });
    }
    // wing (behind the body)
    const wing = spl([[-5, -25 + by], [-11, -36 + by + fl], [-7.4, -35 + by + fl], [-4.4, -38.6 + by + fl], [-1.8, -34.2 + by + fl * 0.7], [1.6, -35.6 + by + fl * 0.6], [1.4, -27 + by]], 3, true);
    shape(ctx, wing, PURPLE, INK, rng, { ang: -1.0, sp: 0.95, lw: 0.95 });
    wax(ctx, [[-4, -26.5 + by], [-7.4, -34.6 + by + fl]], { rng, w: 0.55, c: INK, dbl: false });
    wax(ctx, [[-1.6, -27 + by], [-2, -33.8 + by + fl * 0.7]], { rng, w: 0.55, c: INK, dbl: false });
    // legs
    for (const s of [-1, 1]) {
      const lift = Math.max(0, -sw * s) * 2.2;
      const lx = s * 7 - 1 + sw * s * 1.4;
      const leg = [[lx - 3.4, -11 + by], [lx + 3.2, -11 + by], [lx + 3.6, -1.8 - lift], [lx + 5, -0.4 - lift], [lx - 3.6, -0.2 - lift]];
      shape(ctx, spl(leg, 2, true), s < 0 ? mixc(GREEN, DGREEN, 0.45) : GREEN, INK, rng, { ang: -1.2, sp: 1.0, lw: 1.0 });
      for (let k = 0; k < 3; k++) wax(ctx, [[lx + 1 + k * 1.5, -0.6 - lift], [lx + 1.6 + k * 1.5, 0.6 - lift]], { rng, w: 0.6, c: INK, dbl: false });
    }
    // body
    const body = blob(-1, -18 + by, 13.6, 10.6, rng, 0.03, 34);
    shape(ctx, body, GREEN, INK, rng, { ang: -0.6, sp: 1.05, lw: 1.25 });
    // belly with plates
    const belly = blob(4.6, -15.2 + by, 6.8, 7.4, rng, 0.03, 22);
    shape(ctx, belly, YELLOW, null, rng, { ang: 0.2, sp: 0.85, base: 0.6 });
    for (let k = 0; k < 4; k++) {
      const y = -20 + k * 3 + by;
      wax(ctx, spl([[0.6 + k * 0.3, y], [4.6, y + 0.9], [9.6 - k * 0.6, y + 0.2]], 3), { rng, w: 0.55, c: ORANGE, dbl: false });
    }
    // back spikes
    for (const [x, y, s] of [[-9, -27.6, 3.4], [-3.8, -29.6, 3.8], [1.6, -29.4, 3.6]]) {
      const sp = [[x - s * 0.6, y + 1.6 + by], [x, y - s + by], [x + s * 0.6, y + 1.6 + by]];
      shape(ctx, sp, ORANGE, INK, rng, { sp: 0.7, lw: 0.7, base: 0.6 });
    }
    // neck + head
    const neck = spl([[4.6, -25 + by], [9.4, -31 + by], [13.4, -30.6 + by], [12, -22 + by]], 3, true);
    shape(ctx, neck, GREEN, null, rng, { ang: -0.9, sp: 1.0 });
    wax(ctx, [[4.8, -25.4 + by], [9.2, -31.4 + by]], { rng, w: 1.1, c: INK, dbl: false });
    wax(ctx, [[12.4, -22.4 + by], [13.6, -29.4 + by]], { rng, w: 1.0, c: INK, dbl: false });
    for (const [x, y] of [[8, -32.8], [10.8, -36.6]]) {
      const hn = [[x - 1.6, y + 1.6 + by], [x - 2.6, y - 3.6 + by], [x + 1.2, y + 0.8 + by]];
      shape(ctx, hn, YELLOW, INK, rng, { sp: 0.6, lw: 0.6, base: 0.7 });
    }
    const head = spl([[8.6, -33 + by], [12, -38 + by], [18.6, -38.4 + by], [24.6, -35.4 + by], [26, -31.8 + by], [24, -28.4 + by], [16, -27.6 + by], [10.4, -28.4 + by]], 3, true);
    shape(ctx, head, GREEN, INK, rng, { ang: -0.4, sp: 1.0, lw: 1.15 });
    // mouth + teeth
    wax(ctx, [[25.2, -31 + by], [20, -30.2 + by], [15.4, -30.8 + by]], { rng, w: 0.65, c: INK, dbl: false });
    for (let k = 0; k < 3; k++) {
      const tx = 23.6 - k * 2.6, ty = -30.6 + by + k * 0.15;
      const t = [[tx - 0.9, ty], [tx + 0.9, ty], [tx, ty + 1.9]];
      flat(ctx, t, [255, 254, 250], 1);
      wax(ctx, t, { rng, closed: true, w: 0.35, c: INK, dbl: false, step: 0.35, wob: 0.04 });
    }
    dot(ctx, 24.2, -34.6 + by, 0.55, INK, 1);
    dot(ctx, 22.6, -35.4 + by, 0.5, INK, 1);
    // eye + angry brow
    const e = ell(16.6, -34.4 + by, 2.1, 2.1, 14);
    flat(ctx, e, [255, 254, 250], 1);
    wax(ctx, e, { rng, closed: true, w: 0.5, c: INK, dbl: false, step: 0.4, wob: 0.05 });
    dot(ctx, 17.4, -34.1 + by, 1.0, INK, 1);
    wax(ctx, [[13.6, -38 + by], [19.6, -36.4 + by]], { rng, w: 1.1, c: INK, dbl: false });
    scribble(ctx, ell(20.6, -31.6 + by, 1.3, 0.8, 10), { rng, c: PINK, a: 0.75, sp: 0.5, w: 0.6, over: 0.2 });
    // smoke curl from the nose on two frames
    if (fr & 1) {
      const c = [];
      for (let i = 0; i < 22; i++) { const a = i * 0.55, rr = 0.4 + i * 0.12; c.push([27.6 + i * 0.12 + Math.cos(a) * rr, -38.2 - i * 0.18 + Math.sin(a) * rr]); }
      wax(ctx, c, { rng, w: 0.55, c: GREY, a: 0.9, dbl: false, step: 0.4, wob: 0.05 });
    }
  }

  /* ===================================================================================== small objects */
  function drawBall(ctx, rng) {
    // a tight red scribble ball
    const b = blob(0, 0, 3.7, 3.5, rng, 0.08, 18);
    flat(ctx, b, RED, 0.6);
    const loop = [];
    for (let i = 0; i < 12; i++) { const a = rng.next() * TAU, rr = 3.2 * Math.sqrt(rng.next()); loop.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    wax(ctx, spl(loop, 4), { rng, w: 0.9, c: RED, dbl: false, wob: 0.08 });
    wax(ctx, b, { rng, closed: true, w: 0.7, c: mixc(RED, INK, 0.45), dbl: false, step: 0.5, wob: 0.15 });
  }
  function drawTrail(ctx, rng) {
    for (let k = -1; k <= 1; k++) {
      const x0 = -5 - Math.abs(k) * 1.6, L = R(6, 9, rng) - Math.abs(k) * 1.5;
      wax(ctx, [[x0, k * 2.1], [x0 - L, k * 2.4]], { rng, w: 0.75, c: k === 0 ? RED : GREY, a: 0.85, dbl: false, wob: 0.12 });
    }
  }
  /** A wax crayon lying along +x (tip at +x), centred on the origin. */
  function drawCrayon(ctx, rng, col) {
    const body = [[-8, -2.2], [3, -2.2], [3, 2.2], [-8, 2.2]];
    shape(ctx, body, col, null, rng, { ang: 1.2, sp: 0.8, base: 0.7 });
    const wrap = [[-5.6, -2.3], [1.2, -2.3], [1.2, 2.3], [-5.6, 2.3]];
    flat(ctx, wrap, mixc(col, [255, 255, 255], 0.45), 0.95);
    wax(ctx, [[-4.6, -1.2], [-3.4, 0], [-2.2, -1.2], [-1, 0], [0.2, -1.2]], { rng, w: 0.35, c: INK, a: 0.8, dbl: false, step: 0.3, wob: 0.03 });
    wax(ctx, [[-4.6, 1.2], [0.2, 1.2]], { rng, w: 0.35, c: INK, a: 0.6, dbl: false, step: 0.3, wob: 0.03 });
    const tip = [[3, -2.2], [7.2, -0.7], [8, 0], [7.2, 0.7], [3, 2.2]];
    shape(ctx, tip, col, null, rng, { ang: 0.3, sp: 0.7, base: 0.8 });
    flat(ctx, [[6.6, -0.9], [8, 0], [6.6, 0.9]], mixc(col, INK, 0.35), 1);
    wax(ctx, [[-8, -2.2], [7.2, -0.7], [8, 0], [7.2, 0.7], [-8, 2.2]], { rng, closed: true, w: 0.55, c: INK, dbl: false, step: 0.5, wob: 0.08 });
  }
  function drawGemSmall(ctx, rng) {
    const p = [[-2.8, -4.4], [2.8, -4.4], [4, -2.8], [0, 1.4], [-4, -2.8]];
    flat(ctx, p, SKY, 0.6);
    scribble(ctx, p, { rng, c: SKY, a: 0.9, sp: 0.7, w: 0.8, ang: 0.9, over: 0.5 });
    wax(ctx, p, { rng, closed: true, w: 0.6, c: BLUE, dbl: false, step: 0.45, wob: 0.08 });
    wax(ctx, [[-4, -2.8], [4, -2.8]], { rng, w: 0.4, c: BLUE, dbl: false, wob: 0.05 });
    wax(ctx, [[-1.2, -4.2], [0, 1.2], [1.2, -4.2]], { rng, w: 0.35, c: BLUE, a: 0.8, dbl: false, wob: 0.05 });
    dot(ctx, -1.6, -3.4, 0.6, [255, 255, 255], 0.95);
  }
  function drawGemBig(ctx, rng) {
    const st = starPts(0, -5, 7.2, 3.3, 5, 0);
    flat(ctx, st, YELLOW, 0.75);
    scribble(ctx, st, { rng, c: YELLOW, a: 0.95, sp: 0.85, w: 0.95, ang: -0.6, over: 0.8 });
    wax(ctx, st, { rng, closed: true, w: 0.8, c: ORANGE, step: 0.5, wob: 0.12 });
    dot(ctx, -1.5, -5.6, 0.55, INK, 1);
    dot(ctx, 1.5, -5.6, 0.55, INK, 1);
    const sm = [];
    for (let i = 0; i <= 6; i++) { const a = 0.4 + (i / 6) * 2.34; sm.push([Math.cos(a) * 1.6, -4.4 + Math.sin(a) * 1.2]); }
    wax(ctx, sm, { rng, w: 0.4, c: INK, dbl: false, step: 0.3, wob: 0.03 });
  }
  function shadowSpr(rx, ry, seed) {
    const rng = U.rng(seed);
    return mk(-rx - 1, -ry - 1, rx + 1, ry + 1, (c) => {
      const e = blob(0, 0, rx, ry, rng, 0.05, 22);
      flat(c, e, GREY, 0.1);
      scribble(c, e, { rng, c: GREY, a: 0.3, sp: 0.95, w: 1.0, ang: -0.25, over: 0.8 });
    }, { halo: 0, tooth: 0.7 });
  }

  /* ===================================================================================== props */
  function tufts(ctx, rng, x0, x1, n, col) {
    for (let i = 0; i < n; i++) {
      const x = R(x0, x1, rng);
      for (let k = -1; k <= 1; k++) wax(ctx, [[x + k * 0.9, 0.5], [x + k * 1.6 + J(0.3, rng), -R(1.8, 3.2, rng)]], { rng, w: 0.6, c: col || GREEN, dbl: false, wob: 0.05 });
    }
  }
  function artTree(ctx, rng, v) {
    const trunk = [[-2.6, 0.5], [2.6, 0.5], [2.1, -23], [-2.1, -23]];
    shape(ctx, trunk, BROWN, mixc(BROWN, INK, 0.4), rng, { ang: -1.45, sp: 0.9, lw: 0.9 });
    wax(ctx, [[0.6, -18], [4.6, -22.6]], { rng, w: 1.0, c: mixc(BROWN, INK, 0.3), dbl: false });
    const col = v === 1 ? LGREEN : GREEN;
    const crown = puffPts(0, -33, 14.2, 12.6, 7, rng, 54);
    shape(ctx, crown, col, DGREEN, rng, { ang: -0.6, sp: 1.15, lw: 1.15, over: 1.4 });
    scribble(ctx, blob(-3.6, -36.6, 7, 5.5, rng, 0.1, 18), { rng, c: v === 1 ? YELLOW : LGREEN, a: 0.45, sp: 1.2, w: 1.1, ang: 0.6, over: 0.8 });
    if (v === 0) for (const [x, y] of [[-6, -29], [5, -36], [7.5, -28], [-1, -38], [1.5, -27]]) { dot(ctx, x, y, 1.6, RED, 1); wax(ctx, ell(x, y, 1.6, 1.6, 10), { rng, closed: true, w: 0.4, c: mixc(RED, INK, 0.5), dbl: false, step: 0.4, wob: 0.05 }); }
    if (v === 2) for (const [x, y] of [[-7, -31], [4, -37], [8, -30], [-2, -26], [-4, -39], [2, -31]]) {
      for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; dot(ctx, x + Math.cos(a) * 1.1, y + Math.sin(a) * 1.1, 0.75, PINK, 1); }
      dot(ctx, x, y, 0.5, YELLOW, 1);
    }
    tufts(ctx, rng, -6, 6, 3, GREEN);
  }
  function artPine(ctx, rng) {
    shape(ctx, [[-2, 0.5], [2, 0.5], [1.8, -9], [-1.8, -9]], BROWN, mixc(BROWN, INK, 0.4), rng, { ang: -1.4, sp: 0.9, lw: 0.8 });
    const tiers = [[[-12, -8], [12, -8], [0, -24]], [[-10, -17], [10, -17], [0, -32]], [[-7.6, -25.5], [7.6, -25.5], [0, -39.5]]];
    for (const t of tiers) shape(ctx, t, DGREEN, mixc(DGREEN, INK, 0.35), rng, { ang: -0.4, sp: 1.0, lw: 1.0, over: 1 });
    const st = starPts(0, -40.6, 2.6, 1.1, 5, 0);
    flat(ctx, st, YELLOW, 1);
    wax(ctx, st, { rng, closed: true, w: 0.45, c: ORANGE, dbl: false, step: 0.4, wob: 0.06 });
    tufts(ctx, rng, -6, 6, 2, GREEN);
  }
  function artHouse(ctx, rng, v) {
    const wallCol = [YELLOW, PINK, SKY][v % 3];
    // chimney behind roof
    shape(ctx, [[8.6, -31], [13.4, -31], [13.4, -44], [8.6, -44]], RED, INK, rng, { ang: -1.2, sp: 0.9, lw: 0.8 });
    for (const [x, y, r] of [[11.6, -47.4, 1.5], [13.2, -51.4, 2.1], [12, -56.6, 2.8]]) wax(ctx, puffPts(x, y, r, r * 0.85, 4, rng, 16), { rng, closed: true, w: 0.6, c: GREY, a: 0.9, dbl: false, step: 0.45, wob: 0.06 });
    const wall = [[-17, 0.5], [17, 0.5], [17, -25], [-17, -25]];
    shape(ctx, wall, wallCol, INK, rng, { ang: -0.7, sp: 1.1, lw: 1.05, over: 1.2 });
    const roof = [[-21.5, -24], [21.5, -24], [0.5, -43]];
    shape(ctx, roof, RED, INK, rng, { ang: 0.5, sp: 1.1, lw: 1.1, over: 1.4 });
    // door
    const door = [[-3.8, 0.4], [3.8, 0.4], [3.8, -13.5], [-3.8, -13.5]];
    shape(ctx, door, BROWN, INK, rng, { ang: -1.3, sp: 0.85, lw: 0.85 });
    dot(ctx, 2.2, -6.6, 0.6, YELLOW, 1);
    // windows with crosses
    for (const wx of [-11, 11]) {
      const wn = [[wx - 3.8, -20.5], [wx + 3.8, -20.5], [wx + 3.8, -13.5], [wx - 3.8, -13.5]];
      shape(ctx, wn, SKY, INK, rng, { ang: 0.8, sp: 0.9, lw: 0.8, base: 0.25, fa: 0.55 });
      wax(ctx, [[wx, -20.4], [wx, -13.6]], { rng, w: 0.6, c: INK, dbl: false });
      wax(ctx, [[wx - 3.7, -17], [wx + 3.7, -17]], { rng, w: 0.6, c: INK, dbl: false });
    }
    // round attic window
    const rw = ell(0.5, -31, 2.4, 2.4, 14);
    shape(ctx, rw, YELLOW, INK, rng, { sp: 0.7, lw: 0.6 });
    tufts(ctx, rng, -18, 18, 7, GREEN);
  }
  function artFlowers(ctx, rng, v) {
    if (v === 2) { // sunflower
      wax(ctx, spl([[0, 0.5], [0.6, -10], [-0.4, -20]], 4), { rng, w: 1.2, c: DGREEN });
      for (const s of [-1, 1]) { const l = lens(0.2, -8 - s * 2, -Math.PI / 2 + s * 1.0, 6, 1.8); shape(ctx, l, GREEN, DGREEN, rng, { sp: 0.7, lw: 0.6 }); }
      const pet = starPts(-0.4, -22, 7, 3.4, 11, 0.1);
      shape(ctx, spl(pet, 2, true), YELLOW, ORANGE, rng, { ang: 0.5, sp: 0.8, lw: 0.7 });
      const c = blob(-0.4, -22, 3.4, 3.4, rng, 0.05, 16);
      shape(ctx, c, BROWN, mixc(BROWN, INK, 0.4), rng, { ang: 0.9, sp: 0.6, lw: 0.6 });
      for (let k = 0; k < 6; k++) dot(ctx, -0.4 + J(2, rng), -22 + J(2, rng), 0.35, INK, 0.7);
      tufts(ctx, rng, -3, 3, 2, GREEN);
      return;
    }
    const cols = v === 0 ? [RED, YELLOW, PINK] : [PURPLE, ORANGE, SKY];
    const xs = [-6, 0.5, 6.5], hs = [9, 13.5, 8];
    for (let i = 0; i < 3; i++) {
      const x = xs[i], h = hs[i], tx = x + J(1, rng);
      wax(ctx, [[x, 0.5], [(x + tx) / 2 + J(0.5, rng), -h / 2], [tx, -h]], { rng, w: 0.8, c: DGREEN, dbl: false });
      const l = lens(x + (tx - x) * 0.4, -h * 0.4, -Math.PI / 2 + (i === 1 ? 0.9 : -0.9), 3.6, 1.1);
      shape(ctx, l, GREEN, DGREEN, rng, { sp: 0.55, lw: 0.45, base: 0.7 });
      const col = cols[i];
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + i, p = ell(tx + Math.cos(a) * 2.2, -h + Math.sin(a) * 2.2, 1.45, 1.45, 10);
        flat(ctx, p, col, 0.7);
        wax(ctx, p, { rng, closed: true, w: 0.45, c: mixc(col, INK, 0.3), dbl: false, step: 0.4, wob: 0.05 });
      }
      dot(ctx, tx, -h, 1.25, i === 0 && v === 0 ? BROWN : YELLOW, 1);
    }
    tufts(ctx, rng, -8, 8, 3, GREEN);
  }
  function artBush(ctx, rng, v) {
    const b = puffPts(0, -7.2, 12, 8, 6, rng, 44);
    shape(ctx, b, v ? LGREEN : GREEN, DGREEN, rng, { ang: -0.5, sp: 1.0, lw: 1.0, over: 1.2 });
    const bc = v ? PURPLE : RED;
    for (const [x, y] of [[-6, -6], [-1, -10], [4.5, -5.6], [7, -9.6], [-3.2, -3.4], [1.6, -6.4]]) dot(ctx, x, y, 1.05, bc, 1);
    tufts(ctx, rng, -8, 8, 3, GREEN);
  }
  function artRock(ctx, rng, v) {
    const b = blob(0, -4, v ? 7.5 : 5.4, v ? 5 : 3.8, rng, 0.08, 20).map((p) => [p[0], Math.min(p[1], 0.4)]);
    shape(ctx, b, GREY, mixc(GREY, INK, 0.5), rng, { ang: -0.6, sp: 0.9, lw: 0.9, base: 0.35, fa: 0.7 });
    wax(ctx, [[-1.6, -6.4], [-0.4, -4.4], [-1.4, -2.2]], { rng, w: 0.5, c: mixc(GREY, INK, 0.5), dbl: false });
    if (v) { dot(ctx, 5, 0, 1.5, GREY, 0.7); wax(ctx, ell(5, -0.2, 1.8, 1.3, 10), { rng, closed: true, w: 0.5, c: mixc(GREY, INK, 0.5), dbl: false, step: 0.4 }); }
    tufts(ctx, rng, -7, 7, 2, GREEN);
  }
  function artFence(ctx, rng) {
    for (let i = 0; i < 5; i++) {
      const x = -16 + i * 8 + J(0.4, rng), h = 14 + J(1, rng);
      shape(ctx, [[x - 2.5, 0.5], [x + 2.5, 0.5], [x + 2.5, -h + 3], [x, -h], [x - 2.5, -h + 3]], TAN, BROWN, rng, { ang: -1.35, sp: 0.85, lw: 0.75 });
    }
    for (const y of [-4.4, -10]) wax(ctx, [[-20, y + J(0.4, rng)], [20, y + J(0.4, rng)]], { rng, w: 1.4, c: BROWN });
    tufts(ctx, rng, -18, 18, 6, GREEN);
  }
  function artRainbow(ctx, rng) {
    const cols = [RED, ORANGE, YELLOW, GREEN, SKY, PURPLE];
    for (let i = 0; i < cols.length; i++) {
      const r = 21 - i * 2.5, pts = [];
      for (let k = 0; k <= 26; k++) { const a = Math.PI + (k / 26) * Math.PI; pts.push([Math.cos(a) * r, -2 + Math.sin(a) * r * 0.92]); }
      wax(ctx, pts, { rng, w: 2.7, c: cols[i], a: 0.95, wob: 0.18 });
    }
    for (const s of [-1, 1]) {
      const cl = puffPts(s * 16.2, -2.4, 7.4, 4.2, 5, rng, 34);
      flat(ctx, cl, [255, 254, 250], 1);
      scribble(ctx, cl, { rng, c: PALE, a: 0.45, sp: 1, w: 0.9, ang: -0.3, over: 0.3 });
      wax(ctx, cl, { rng, closed: true, w: 0.8, c: SKY, step: 0.55 });
    }
  }

  /* ===================================================================================== effects art */
  function drawPow(ctx, rng) {
    const p = [];
    const n = 9;
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU + J(0.08, rng), r = i & 1 ? R(4, 5, rng) : R(8.4, 10.4, rng); p.push([Math.cos(a) * r, Math.sin(a) * r]); }
    flat(ctx, p, YELLOW, 0.8);
    scribble(ctx, p, { rng, c: YELLOW, a: 0.95, sp: 0.9, w: 1.0, ang: -0.5, over: 1 });
    scribble(ctx, ell(0, 0, 4, 3.6, 14), { rng, c: ORANGE, a: 0.7, sp: 0.9, w: 1.0, ang: 0.6, over: 0.6 });
    wax(ctx, p, { rng, closed: true, w: 0.9, c: RED, step: 0.55, wob: 0.1 });
  }
  function drawBolt(ctx, rng, col) {
    wax(ctx, [[-4.4, -4], [1.2, -1.4], [-1.6, 0.4], [4.4, 3.8]], { rng, w: 1.0, c: col, step: 0.5, wob: 0.08 });
  }
  function drawCurl(ctx, rng, col) {
    const p = [];
    for (let i = 0; i < 26; i++) { const a = i * 0.5, rr = 0.3 + i * 0.13; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    wax(ctx, p, { rng, w: 0.75, c: col, dbl: false, step: 0.45, wob: 0.06 });
  }
  function drawStar(ctx, rng, col) {
    const st = starPts(0, 0, 4.2, 1.9, 5, 0);
    flat(ctx, st, col, 0.85);
    wax(ctx, st, { rng, closed: true, w: 0.6, c: col === YELLOW ? ORANGE : mixc(col, INK, 0.35), dbl: false, step: 0.45, wob: 0.08 });
  }
  function drawHeart(ctx, rng, col) {
    const h = heartPts(0, 0, 4.4, 26);
    flat(ctx, h, col, 0.8);
    scribble(ctx, h, { rng, c: col, a: 0.9, sp: 0.75, w: 0.85, ang: -0.6, over: 0.5 });
    wax(ctx, h, { rng, closed: true, w: 0.6, c: mixc(col, INK, 0.4), dbl: false, step: 0.45, wob: 0.08 });
  }
  function drawRing(ctx, rng) {
    wax(ctx, ell(0, 0, 13, 13 * 0.8, 40), { rng, closed: true, w: 1.2, c: YELLOW, step: 0.8, wob: 0.5 });
    wax(ctx, ell(0, 0, 11.6, 11.6 * 0.8, 40), { rng, closed: true, w: 0.7, c: ORANGE, dbl: false, step: 0.8, wob: 0.6 });
  }
  function drawPuff(ctx, rng) {
    const p = puffPts(0, 0, 4.6, 3.4, 5, rng, 30);
    flat(ctx, p, [255, 254, 250], 0.9);
    wax(ctx, p, { rng, closed: true, w: 0.6, c: GREY, dbl: false, step: 0.45, wob: 0.1 });
  }
  function drawLines(ctx, rng) {
    for (let k = -1; k <= 1; k++) wax(ctx, [[0, k * 4], [-R(9, 13, rng) + Math.abs(k) * 2, k * 4.4]], { rng, w: 0.85, c: INK, a: 0.7, dbl: false, wob: 0.1 });
  }
  function drawScratch(ctx, rng, lvl) {
    // a child "crossing out" a drawing: black scribble of increasing density
    const c = ell(0, 0, 9, 9, 20);
    scribble(ctx, c, { rng, c: INK, a: 0.85, sp: 2.4 - lvl * 0.5, w: 0.9, ang: -0.6, over: 1.2, bow: 0.9 });
    if (lvl >= 1) scribble(ctx, c, { rng, c: INK, a: 0.8, sp: 2.2, w: 0.85, ang: 0.7, over: 1.2, bow: 0.9 });
    if (lvl >= 2) {
      const t = [];
      for (let i = 0; i < 18; i++) { const a = rng.next() * TAU, rr = 8 * Math.sqrt(rng.next()); t.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      wax(ctx, spl(t, 4), { rng, w: 0.8, c: INK, a: 0.9, dbl: false, wob: 0.2 });
    }
  }
  function drawScar(ctx, rng, col) {
    const b = blob(0, 0, 6, 4, rng, 0.15, 18);
    scribble(ctx, b, { rng, c: col, a: 0.55, sp: 1.3, w: 1.1, ang: -0.6, over: 1.5, bow: 0.8 });
  }
  function drawCrumb(ctx, rng, col) {
    wax(ctx, [[-1.2, 0.3], [1.2, -0.3]], { rng, w: 1.1, c: col, dbl: false, wob: 0.05 });
  }

  /* ===================================================================================== bake */
  const SPR = {};
  const BOIL = 3;
  function both(s) { return [s, flipSpr(s)]; }
  /* boil variants 1 and 2 are baked lazily (chunk generator + a small per-frame budget); until then variant 0 stands in */
  const LAZY = [];
  function runLazy(ms) {
    const end = performance.now() + ms;
    while (LAZY.length && performance.now() < end) LAZY.shift()();
  }
  /** Fills arrs[0][v] / arrs[1][v] (facing right / left) for every boil variant. */
  function vary(arrs, make) {
    const [a, b] = both(make(0));
    for (let v = 0; v < BOIL; v++) { arrs[0][v] = a; arrs[1][v] = b; }
    for (let v = 1; v < BOIL; v++) LAZY.push(() => { const [x, y] = both(make(v)); arrs[0][v] = x; arrs[1][v] = y; });
  }
  function buildSprites() {
    LAZY.length = 0;
    // main character: [facing][frame][variant]
    const kid = { idle: [[], []], walk: [[], []], dash: [[], []] };
    const kb = [-18.5, -33, 13, 2.2];
    const kmk = (seed, mode, ph) => (v) => mk(kb[0], kb[1], kb[2], kb[3], (c) => drawKid(c, U.rng(seed + v * 31), mode, ph), { hurt: true });
    for (let f = 0; f < 2; f++) { kid.idle[0][f] = []; kid.idle[1][f] = []; vary([kid.idle[0][f], kid.idle[1][f]], kmk(100 + f * 7, 'idle', f / 2 + 0.25)); }
    for (let f = 0; f < 4; f++) { kid.walk[0][f] = []; kid.walk[1][f] = []; vary([kid.walk[0][f], kid.walk[1][f]], kmk(200 + f * 7, 'walk', f / 4)); }
    vary(kid.dash, kmk(300, 'dash', 0));
    SPR.kid = kid;
    // creatures: [facing][frame][variant]
    const crea = (fn, bx, seed) => {
      const out = [[], []];
      for (let f = 0; f < 4; f++) {
        out[0][f] = []; out[1][f] = [];
        vary([out[0][f], out[1][f]], (v) => mk(bx[0], bx[1], bx[2], bx[3], (c) => fn(c, U.rng(seed + f * 13 + v * 37), f), { flash: true }));
      }
      return out;
    };
    SPR.creeper = crea(drawScribbler, [-12, -22, 12, 1.5], 1000);
    SPR.ghost = crea(drawGhost, [-13.5, -22.5, 11.5, 1.5], 2000);
    SPR.colossus = crea(drawDragon, [-30, -48, 30, 1.5], 3000);
    SPR.scratch = [0, 1, 2].map((l) => [0, 1, 2].map((v) => mk(-10, -10, 10, 10, (c) => drawScratch(c, U.rng(4000 + l * 11 + v * 5), l), { halo: 0 })));
    // shadows
    SPR.shKid = shadowSpr(7, 2.4, 11);
    SPR.shCreeper = shadowSpr(7.5, 2.4, 12);
    SPR.shGhost = shadowSpr(5.5, 1.8, 13);
    SPR.shColossus = shadowSpr(17, 4.6, 14);
    SPR.shTree = shadowSpr(10, 3, 15);
    SPR.shHouse = shadowSpr(20, 3.4, 16);
    SPR.shSmall = shadowSpr(6, 1.8, 17);
    SPR.shWide = shadowSpr(19, 2, 18);
    SPR.shGem = shadowSpr(2.6, 0.9, 19);
    // effects
    SPR.ball = [0, 1, 2].map((v) => mk(-4.5, -4.5, 4.5, 4.5, (c) => drawBall(c, U.rng(500 + v)), { halo: 0.6 }));
    SPR.trail = mk(-17, -4, -3, 4, (c) => drawTrail(c, U.rng(510)), { halo: 0 });
    SPR.crayon = [ORANGE, GREEN, PURPLE, BLUE, PINK, RED].map((col, i) => [0, 1, 2].map((v) => mk(-8.5, -2.6, 8.5, 2.6, (c) => drawCrayon(c, U.rng(520 + i * 7 + v), col), { halo: 0.7 })));
    SPR.gem = [0, 1, 2].map((v) => mk(-4.5, -5, 4.5, 2, (c) => drawGemSmall(c, U.rng(540 + v)), { halo: 0.6 }));
    SPR.gemBig = [0, 1, 2].map((v) => mk(-7.6, -12.6, 7.6, 2.6, (c) => drawGemBig(c, U.rng(550 + v)), { halo: 0.7 }));
    SPR.pow = [0, 1, 2].map((v) => mk(-11, -11, 11, 11, (c) => drawPow(c, U.rng(560 + v)), { halo: 0.8 }));
    const FX = [YELLOW, RED, SKY, PINK, GREEN, PURPLE, ORANGE, INK];
    SPR.fxCols = FX;
    SPR.zig = FX.map((col, i) => mk(-5, -5, 5, 5, (c) => drawBolt(c, U.rng(570 + i), col), { halo: 0.5 }));
    SPR.curl = FX.map((col, i) => mk(-4, -4, 4, 4, (c) => drawCurl(c, U.rng(580 + i), col), { halo: 0.4 }));
    SPR.star = FX.map((col, i) => mk(-4.5, -4.5, 4.5, 4.5, (c) => drawStar(c, U.rng(590 + i), col), { halo: 0.5 }));
    SPR.crumb = FX.map((col, i) => mk(-1.8, -1, 1.8, 1, (c) => drawCrumb(c, U.rng(600 + i), col), { halo: 0, pad: 0.8 }));
    SPR.heart = [PINK, RED].map((col, i) => mk(-5, -5, 5, 5, (c) => drawHeart(c, U.rng(610 + i), col), { halo: 0.6 }));
    SPR.ring = [0, 1, 2].map((v) => mk(-14.5, -12, 14.5, 12, (c) => drawRing(c, U.rng(620 + v)), { halo: 0 }));
    SPR.puff = [0, 1, 2].map((v) => mk(-5.5, -4.5, 5.5, 4.5, (c) => drawPuff(c, U.rng(630 + v)), { halo: 0 }));
    SPR.lines = mk(-14, -6, 1, 6, (c) => drawLines(c, U.rng(640)), { halo: 0 });
    SPR.scar = [PURPLE, PALE, GREEN, RED].map((col, i) => [0, 1].map((v) => mk(-8, -6, 8, 6, (c) => drawScar(c, U.rng(650 + i * 3 + v), col), { halo: 0 })));
    // props: [variant][boil]
    const prop = (fn, bx, nv, seed) => {
      const out = [];
      for (let i = 0; i < nv; i++) {
        const make = (v) => mk(bx[0], bx[1], bx[2], bx[3], (c) => fn(c, U.rng(seed + i * 17 + v * 101), i));
        const s0 = make(0);
        out[i] = [s0, s0, s0];
        for (let v = 1; v < BOIL; v++) LAZY.push(() => { out[i][v] = make(v); });
      }
      return out;
    };
    SPR.props = {
      tree: prop(artTree, [-16, -48, 16, 1.5], 3, 7000),
      pine: prop(artPine, [-13, -44, 13, 1.5], 1, 7100),
      house: prop(artHouse, [-23, -60, 23, 1.5], 3, 7200),
      flowers: prop(artFlowers, [-10, -31, 10, 1.5], 3, 7300),
      bush: prop(artBush, [-14, -17, 14, 1.5], 2, 7400),
      rock: prop(artRock, [-9, -11, 9, 1.5], 2, 7500),
      fence: prop(artFence, [-21, -17, 21, 1.5], 1, 7600),
      rainbow: prop(artRainbow, [-24.5, -24.5, 24.5, 3], 1, 7700),
    };
  }

  /* ===================================================================================== world: paper, grass, pond, path */
  const PH = 760, PV = 1100, PW = 10.5; // path spacing + half width
  const hPathY = (k, x) => (k + 0.16) * PH + 46 * Math.sin(x / 260 + k * 1.7) + 18 * Math.sin(x / 97 + k * 3.1);
  const vPathX = (k, y) => (k - 0.2) * PV + 52 * Math.sin(y / 300 + k * 2.3) + 16 * Math.sin(y / 83 + k * 1.3);
  function pathDist(x, y) {
    let d = 1e9;
    const kh = Math.round(y / PH - 0.16);
    for (let k = kh - 1; k <= kh + 1; k++) d = Math.min(d, Math.abs(y - hPathY(k, x)) * 0.94);
    const kv = Math.round(x / PV + 0.2);
    for (let k = kv - 1; k <= kv + 1; k++) d = Math.min(d, Math.abs(x - vPathX(k, y)) * 0.94);
    return d - PW;
  }

  const PC = 270, OC = 560;
  const SHAPES = new Map();
  function shapeAt(kind, cx, cy) {
    const key = kind + cx + ',' + cy;
    let s = SHAPES.get(key);
    if (s !== undefined) return s;
    if (SHAPES.size > 6000) SHAPES.clear();
    const pond = kind === 'o';
    const seed = U.hashInt(cx, cy, pond ? 6161 : 5151);
    const rng = U.rng(seed);
    s = null;
    if (rng.next() < (pond ? 0.66 : 0.7)) {
      const cell = pond ? OC : PC;
      const x = (cx + 0.2 + rng.next() * 0.6) * cell, y = (cy + 0.2 + rng.next() * 0.6) * cell;
      const r = pond ? R(42, 78, rng) : R(55, 118, rng);
      const sx = R(0.8, 1.3, rng);
      s = {
        x, y, R: r, sx, sy: R(0.8, 1.05, rng) / Math.sqrt(sx), rot: rng.next() * TAU, p1: rng.next() * TAU, p2: rng.next() * TAU,
        a1: R(0.07, 0.18, rng), a2: R(0.03, 0.09, rng), seed, ang: R(-0.95, -0.25, rng), alt: rng.next() < 0.3,
      };
      s.bound = s.R * (1 + s.a1 + s.a2) * Math.max(s.sx, s.sy);
      if (pond && (pathDist(x, y) < s.bound + 16 || Math.hypot(x, y) < s.bound + 40)) s = null;
    }
    SHAPES.set(key, s);
    return s;
  }
  const shapeR = (s, a) => s.R * (1 + s.a1 * Math.sin(3 * a + s.p1) + s.a2 * Math.sin(5 * a + s.p2));
  function shapePts(s, n, scale, extra, dx, dy) {
    scale = scale || 1; extra = extra || 0;
    const out = [], c = Math.cos(s.rot), sn = Math.sin(s.rot);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, r = shapeR(s, a) * scale + extra;
      const lx = Math.cos(a) * r * s.sx, ly = Math.sin(a) * r * s.sy;
      out.push([s.x + (dx || 0) + lx * c - ly * sn, s.y + (dy || 0) + lx * sn + ly * c]);
    }
    return out;
  }
  function shapeD(s, x, y) {
    const dx = x - s.x, dy = y - s.y, c = Math.cos(-s.rot), sn = Math.sin(-s.rot);
    const lx = (dx * c - dy * sn) / s.sx, ly = (dx * sn + dy * c) / s.sy;
    return Math.hypot(lx, ly) / shapeR(s, Math.atan2(ly, lx));
  }
  function fieldD(kind, x, y) {
    const cell = kind === 'o' ? OC : PC;
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
    let d = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const s = shapeAt(kind, cx + i, cy + j);
      if (s) d = Math.min(d, shapeD(s, x, y));
    }
    return d;
  }
  function shapesNear(kind, info, m) {
    const cell = kind === 'o' ? OC : PC, out = [];
    const x0 = Math.floor((info.wx - 160 - m) / cell), x1 = Math.floor((info.wx + info.size + 160 + m) / cell);
    const y0 = Math.floor((info.wy - 160 - m) / cell), y1 = Math.floor((info.wy + info.size + 160 + m) / cell);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const s = shapeAt(kind, cx, cy);
      if (!s) continue;
      const b = s.bound + m;
      if (s.x + b < info.wx || s.x - b > info.wx + info.size || s.y + b < info.wy || s.y - b > info.wy + info.size) continue;
      out.push(s);
    }
    return out;
  }
  function eraseShape(ctx, pts) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); poly(ctx, pts);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();
  }

  function drawPatch(ctx, s) {
    const rng = U.rng(s.seed);
    const col = s.alt ? LGREEN : GREEN, col2 = s.alt ? GREEN : LGREEN;
    const pts = shapePts(s, 52);
    flat(ctx, pts, col, 0.12);
    const bt = new Batch();
    scribble(ctx, pts, { rng, c: col, a: 0.8, sp: 2.5, w: 2.7, ang: s.ang, over: 3.4, bow: 0.8, cell: 30, batch: bt });
    const sub = shapePts(s, 30, 0.5, 0, J(s.R * 0.3, rng), J(s.R * 0.3, rng));
    scribble(ctx, sub, { rng, c: col2, a: 0.5, sp: 3.2, w: 2.5, ang: s.ang + R(0.7, 1.2, rng), over: 2, bow: 0.8, cell: 26, batch: bt });
    bt.flush(ctx);
    // grass blades: little tick tufts
    const area = Math.PI * s.R * s.R * s.sx * s.sy;
    const n = Math.round(area / 360);
    for (let i = 0; i < n; i++) {
      const a = rng.next() * TAU, rr = Math.sqrt(rng.next()) * 0.9;
      const lx = Math.cos(a) * rr * shapeR(s, a) * s.sx, ly = Math.sin(a) * rr * shapeR(s, a) * s.sy;
      const c = Math.cos(s.rot), sn = Math.sin(s.rot);
      const x = s.x + lx * c - ly * sn, y = s.y + lx * sn + ly * c;
      const p = bt.path(DGREEN, R(0.6, 0.85, rng), R(0.6, 0.85, rng));
      const h = R(2.6, 4.2, rng);
      for (let k = -1; k <= 1; k++) { p.moveTo(x + k * 1.1, y); p.lineTo(x + k * 2.1 + J(0.4, rng), y - h * (k === 0 ? 1.15 : 0.85)); }
    }
    // blades sticking out along the edge
    const edge = shapePts(s, Math.round(s.bound / 2.6));
    for (const q of edge) {
      if (rng.next() < 0.45) continue;
      const p = bt.path(GREEN, 0.85, 0.8);
      const h = R(2.4, 4.6, rng);
      p.moveTo(q[0], q[1] + 1);
      p.lineTo(q[0] + J(1.4, rng), q[1] - h);
    }
    bt.flush(ctx);
  }
  function drawPond(ctx, s) {
    const rng = U.rng(s.seed + 3);
    eraseShape(ctx, shapePts(s, 40, 1, 4.5));
    const pts = shapePts(s, 46);
    flat(ctx, pts, PALE, 0.4);
    const bt = new Batch();
    scribble(ctx, pts, { rng, c: SKY, a: 0.82, sp: 2.3, w: 2.6, ang: R(-0.3, 0.15, rng), over: 2.2, bow: 0.8, cell: 28, angJ: 0.3, batch: bt });
    const inner = shapePts(s, 30, 0.6, 0, J(s.R * 0.1, rng), s.R * 0.14);
    scribble(ctx, inner, { rng, c: BLUE, a: 0.38, sp: 3.0, w: 2.3, ang: R(0.4, 0.9, rng), over: 1.5, bow: 0.8, cell: 26, batch: bt });
    bt.flush(ctx);
    wax(ctx, pts, { rng, closed: true, w: 1.5, c: BLUE, wob: 0.55, step: 1.4, drift: 3 });
    // little waves
    const nw = 3 + ((rng.next() * 3) | 0);
    for (let i = 0; i < nw; i++) {
      const a = rng.next() * TAU, rr = Math.sqrt(rng.next()) * 0.6 * s.R;
      const x = s.x + Math.cos(a) * rr * s.sx, y = s.y + Math.sin(a) * rr * s.sy;
      const wv = [];
      for (let k = 0; k <= 12; k++) wv.push([x - 6 + k, y - Math.abs(Math.sin((k / 12) * Math.PI * 2)) * 1.6]);
      wax(ctx, wv, { rng, w: 0.9, c: BLUE, a: 0.9, dbl: false, step: 0.6, wob: 0.1 });
    }
    // lily pad + flower
    if (rng.next() < 0.7) {
      const a = rng.next() * TAU, rr = 0.45 * s.R;
      const x = s.x + Math.cos(a) * rr * s.sx, y = s.y + Math.sin(a) * rr * s.sy;
      const pad = ell(x, y, 5, 3.6, 22).slice(2);
      pad.push([x, y]);
      shape(ctx, pad, GREEN, DGREEN, rng, { sp: 1.0, lw: 0.9 });
      for (let k = 0; k < 5; k++) { const b = (k / 5) * TAU; dot(ctx, x - 1.4 + Math.cos(b) * 1.3, y - 1.4 + Math.sin(b) * 1.1, 0.95, PINK, 1); }
      dot(ctx, x - 1.4, y - 1.4, 0.6, YELLOW, 1);
    }
    // a fish
    if (rng.next() < 0.5) {
      const a = rng.next() * TAU, rr = 0.3 * s.R, f = rng.next() < 0.5 ? 1 : -1;
      const x = s.x + Math.cos(a) * rr * s.sx, y = s.y + Math.sin(a) * rr * s.sy;
      const b = ell(x, y, 4, 2.2, 18);
      shape(ctx, b, ORANGE, mixc(ORANGE, INK, 0.45), rng, { sp: 0.8, lw: 0.7 });
      const t = [[x - f * 3.6, y], [x - f * 7, y - 2.4], [x - f * 7, y + 2.4]];
      shape(ctx, t, ORANGE, mixc(ORANGE, INK, 0.45), rng, { sp: 0.7, lw: 0.6 });
      dot(ctx, x + f * 2, y - 0.5, 0.5, INK, 1);
    }
  }
  /** Dirt path: erase a band, zigzag tan scribble across it, two wobbly brown edges, pebbles. Deterministic per segment. */
  const SEG = 36;
  function pathList(info, M) {
    const out = [];
    const k0 = Math.floor((info.wy - M - 80) / PH - 0.16), k1 = Math.ceil((info.wy + info.size + M + 80) / PH - 0.16);
    for (let k = k0; k <= k1; k++) {
      const P = (t) => [t, hPathY(k, t)];
      let hit = false;
      for (let t = info.wx - M; t <= info.wx + info.size + M; t += 16) { const y = hPathY(k, t); if (y > info.wy - M - 20 && y < info.wy + info.size + M + 20) { hit = true; break; } }
      if (hit) out.push({ P, n: [0, 1], t0: info.wx - M, t1: info.wx + info.size + M, seed: k * 2 });
    }
    const v0 = Math.floor((info.wx - M - 80) / PV + 0.2), v1 = Math.ceil((info.wx + info.size + M + 80) / PV + 0.2);
    for (let k = v0; k <= v1; k++) {
      const P = (t) => [vPathX(k, t), t];
      let hit = false;
      for (let t = info.wy - M; t <= info.wy + info.size + M; t += 16) { const x = vPathX(k, t); if (x > info.wx - M - 20 && x < info.wx + info.size + M + 20) { hit = true; break; } }
      if (hit) out.push({ P, n: [1, 0], t0: info.wy - M, t1: info.wy + info.size + M, seed: k * 2 + 1 });
    }
    return out;
  }
  function erasePath(ctx, pa) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    for (let t = Math.floor(pa.t0 / 4) * 4, f = true; t <= pa.t1 + 4; t += 4, f = false) { const p = pa.P(t); if (f) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
    ctx.lineWidth = PW * 2 + 8;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.restore();
  }
  function drawPath(ctx, pa) {
    const s0 = Math.floor(pa.t0 / SEG), s1 = Math.floor(pa.t1 / SEG);
    const nx = pa.n[0], ny = pa.n[1];
    const at = (t, o) => { const p = pa.P(t); return [p[0] + nx * o, p[1] + ny * o]; };
    const band = [];
    for (let t = Math.floor(pa.t0 / 4) * 4; t <= pa.t1 + 4; t += 4) band.push(at(t, -PW + 0.6));
    for (let t = Math.floor(pa.t1 / 4) * 4 + 4; t >= pa.t0 - 4; t -= 4) band.push(at(t, PW - 0.6));
    flat(ctx, band, TAN, 0.24);
    for (let s = s0; s <= s1; s++) {
      const rng = U.rng(U.hashInt(s, pa.seed, 777));
      const a0 = s * SEG - 2, a1 = (s + 1) * SEG + 3;
      // fill: lengthwise tan crayon strokes, the way a child colours a road
      const bt = new Batch();
      for (let o = -PW + 2.2; o <= PW - 1.8; o += R(2.4, 3.2, rng)) {
        const p = bt.path(TAN, R(0.5, 0.72, rng), R(2.6, 3.4, rng));
        const b0 = a0 + R(-3, 4, rng), b1 = a1 + R(-4, 3, rng), oo = o + J(0.5, rng), bend = J(1, rng);
        const q0 = at(b0, oo), q1 = at((b0 + b1) / 2, oo + bend), q2 = at(b1, oo + J(0.6, rng));
        p.moveTo(q0[0], q0[1]);
        p.quadraticCurveTo(q1[0], q1[1], q2[0], q2[1]);
      }
      // dirt ticks
      for (let i = 0; i < 3; i++) {
        const t = R(a0, a1, rng), o = J(PW - 3, rng), q = at(t, o), q2 = at(t + R(1.5, 3, rng), o + J(0.8, rng));
        const d = bt.path(BROWN, 0.7, 0.8);
        d.moveTo(q[0], q[1]); d.lineTo(q2[0], q2[1]);
      }
      bt.flush(ctx);
      // edges
      for (const sd of [-1, 1]) {
        const e = [];
        for (let t = a0 - 1; t <= a1 + 1; t += 3) e.push(at(t, sd * (PW + J(0.3, rng))));
        wax(ctx, e, { rng, w: 1.3, c: BROWN, a: 0.95, wob: 0.35, step: 1.2 });
      }
      // pebbles
      if (rng.next() < 0.55) {
        const q = at(R(a0, a1, rng), J(PW - 3.5, rng));
        const pb = ell(q[0], q[1], R(1.3, 2.2, rng), R(1, 1.6, rng), 12);
        flat(ctx, pb, GREY, 0.35);
        wax(ctx, pb, { rng, closed: true, w: 0.6, c: mixc(GREY, INK, 0.3), dbl: false, step: 0.5, wob: 0.1 });
      }
    }
  }
  /* ---------- paper doodles ---------- */
  function decal(ctx, x, y, rng, inGrass) {
    const r = rng.next();
    if (inGrass) {
      if (r < 0.2) miniFlower(ctx, x, y, rng);
      return;
    }
    if (r < 0.16) {
      const bt = new Batch();
      const p = bt.path(GREEN, 0.85, 0.75);
      const n = 3 + ((rng.next() * 2) | 0), h = R(2.4, 4, rng);
      for (let k = 0; k < n; k++) { const bx = x + (k - (n - 1) / 2) * 1.2; p.moveTo(bx, y); p.lineTo(bx + (k - (n - 1) / 2) * 0.9 + J(0.3, rng), y - h * (0.75 + rng.next() * 0.4)); }
      bt.flush(ctx);
    } else if (r < 0.215) miniFlower(ctx, x, y, rng);
    else if (r < 0.24) {
      for (let k = 0; k < 2 + ((rng.next() * 2) | 0); k++) {
        const pb = ell(x + J(4, rng), y + J(2.5, rng), R(1.2, 2.2, rng), R(0.9, 1.5, rng), 12);
        flat(ctx, pb, GREY, 0.3);
        wax(ctx, pb, { rng, closed: true, w: 0.55, c: mixc(GREY, INK, 0.25), dbl: false, step: 0.5, wob: 0.1 });
      }
    } else if (r < 0.254) {
      const col = [PINK, ORANGE, SKY, PURPLE][(rng.next() * 4) | 0];
      for (const s of [-1, 1]) {
        const w1 = ell(x + s * 2.4, y - 1.4, 2.4, 2, 12), w2 = ell(x + s * 1.9, y + 1.4, 1.6, 1.4, 10);
        flat(ctx, w1, col, 0.75); flat(ctx, w2, col, 0.75);
        wax(ctx, w1, { rng, closed: true, w: 0.45, c: mixc(col, INK, 0.4), dbl: false, step: 0.45, wob: 0.06 });
      }
      wax(ctx, [[x, y - 2.6], [x, y + 2.6]], { rng, w: 0.8, c: INK, dbl: false });
      wax(ctx, [[x, y - 2.6], [x - 1.2, y - 4.4]], { rng, w: 0.4, c: INK, dbl: false });
      wax(ctx, [[x, y - 2.6], [x + 1.2, y - 4.4]], { rng, w: 0.4, c: INK, dbl: false });
    } else if (r < 0.27) {
      const k = (rng.next() * 3) | 0;
      if (k === 0) { const st = starPts(x, y, 3, 1.3, 5, J(0.3, rng)); flat(ctx, st, YELLOW, 0.6); wax(ctx, st, { rng, closed: true, w: 0.5, c: ORANGE, dbl: false, step: 0.45, wob: 0.06 }); }
      else if (k === 1) { const h = heartPts(x, y, 3, 22); flat(ctx, h, PINK, 0.55); wax(ctx, h, { rng, closed: true, w: 0.5, c: mixc(PINK, INK, 0.3), dbl: false, step: 0.45, wob: 0.06 }); }
      else {
        const p = [];
        for (let i = 0; i < 22; i++) { const a = i * 0.55, rr = 0.3 + i * 0.14; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
        wax(ctx, p, { rng, w: 0.6, c: [BLUE, PURPLE, RED][(rng.next() * 3) | 0], dbl: false, step: 0.45, wob: 0.06 });
      }
    }
  }
  function miniFlower(ctx, x, y, rng) {
    const col = [RED, YELLOW, PINK, PURPLE, ORANGE, SKY][(rng.next() * 6) | 0];
    wax(ctx, [[x, y + 2.4], [x + J(0.6, rng), y - 1]], { rng, w: 0.6, c: DGREEN, dbl: false, wob: 0.05 });
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; dot(ctx, x + Math.cos(a) * 1.3, y - 1.6 + Math.sin(a) * 1.3, 0.95, col, 0.9); }
    dot(ctx, x, y - 1.6, 0.6, col === YELLOW ? ORANGE : YELLOW, 1);
  }

  function* renderGround(ctx, info) {
    const M = 26;
    while (LAZY.length) { LAZY.shift()(); yield; }
    // 1. grass patches
    for (const s of shapesNear('g', info, M)) { drawPatch(ctx, s); yield; }
    // 2. ponds (cut a white margin into the grass first)
    for (const s of shapesNear('o', info, M)) { drawPond(ctx, s); yield; }
    // 3. paths
    const paths = pathList(info, M);
    for (const pa of paths) erasePath(ctx, pa);
    for (const pa of paths) { drawPath(ctx, pa); yield; }
    // 4. paper doodles
    G.scatter(info, 40, 4242, 12, (x, y, rng) => {
      if (pathDist(x, y) < 6) return;
      if (fieldD('o', x, y) < 1.15) return;
      decal(ctx, x, y, rng, fieldD('g', x, y) < 0.92);
    });
    yield;
    // 5. paper tooth (wax skips the valleys) – world aligned, so chunks join seamlessly
    const res = info.res, ox = -(info.wx * res), oy = -(info.wy * res);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.92;
    let pat = ctx.createPattern(TOOTH, 'repeat');
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, ((ox % TN) + TN) % TN, ((oy % TN) + TN) % TN]));
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, info.px, info.px);
    // 6. the paper underneath
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-over';
    pat = ctx.createPattern(PAPERTEX, 'repeat');
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, ((ox % 256) + 256) % 256, ((oy % 256) + 256) % 256]));
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, info.px, info.px);
    ctx.restore();
  }

  /* ---------- props ---------- */
  const HSEG = 300;
  function houseAt(k, s) {
    const rng = U.rng(U.hashInt(k, s, 8808));
    if (rng.next() > 0.38) return null;
    const x = (s + 0.25 + rng.next() * 0.5) * HSEG;
    const y = hPathY(k, x) - PW - 14 - rng.next() * 8;
    if (G.nearSpawn(x, y, 110) || pathDist(x, y + 14) < 0 || Math.abs(x - vPathX(Math.round(x / PV + 0.2), y)) < 60) return null;
    if (fieldD('o', x, y) < 1.4) return null;
    return { x, y, v: (rng.next() * 3) | 0 };
  }
  function nearHouse(x, y) {
    const k0 = Math.round(y / PH - 0.16);
    for (let k = k0 - 1; k <= k0 + 1; k++) {
      const s0 = Math.floor(x / HSEG);
      for (let s = s0 - 1; s <= s0 + 1; s++) {
        const h = houseAt(k, s);
        if (h && Math.abs(x - h.x) < 34 && y > h.y - 62 && y < h.y + 16) return true;
      }
    }
    return false;
  }
  function propsFor(info) {
    const out = [];
    const P = SPR.props;
    // houses line the horizontal paths
    const k0 = Math.floor(info.wy / PH - 0.16) - 1, k1 = Math.ceil((info.wy + info.size) / PH - 0.16) + 1;
    for (let k = k0; k <= k1; k++) {
      for (let s = Math.floor(info.wx / HSEG) - 1; s <= Math.floor((info.wx + info.size) / HSEG) + 1; s++) {
        const h = houseAt(k, s);
        if (!h || h.x < info.wx || h.x >= info.wx + info.size || h.y < info.wy || h.y >= info.wy + info.size) continue;
        out.push({ x: h.x, y: h.y, type: 'house', spr: P.house[h.v], sh: SPR.shHouse, pad: 80 });
      }
    }
    G.scatterOwned(info, 58, 9001, (x, y, rng) => {
      if (G.nearSpawn(x, y, 90)) return;
      const pd = pathDist(x, y);
      if (pd < 7) return;
      if (fieldD('o', x, y) < 1.2) return;
      if (nearHouse(x, y)) return;
      const g = fieldD('g', x, y) < 0.95;
      const r = rng.next();
      const pick = (arr) => arr[(rng.next() * arr.length) | 0];
      let type = null, v = 0, sh = SPR.shSmall, pad = 40;
      if (pd < 26 && r < 0.09) { type = 'fence'; sh = SPR.shWide; }
      else if (g) {
        if (r < 0.2) { type = 'tree'; v = pick([0, 1, 2, 0]); sh = SPR.shTree; pad = 70; }
        else if (r < 0.27) { type = 'pine'; sh = SPR.shTree; pad = 60; }
        else if (r < 0.33) { type = 'bush'; v = pick([0, 1]); }
        else if (r < 0.43) { type = 'flowers'; v = pick([0, 1, 2]); }
      } else {
        if (r < 0.035) { type = 'tree'; v = pick([0, 1, 2]); sh = SPR.shTree; pad = 70; }
        else if (r < 0.06) { type = 'rock'; v = pick([0, 1]); }
        else if (r < 0.115) { type = 'flowers'; v = pick([0, 1, 2]); }
        else if (r < 0.127) { type = 'bush'; v = pick([0, 1]); }
        else if (r < 0.134 && pd > 40) { type = 'rainbow'; sh = SPR.shWide; pad = 50; }
      }
      if (!type) return;
      const arr = P[type];
      out.push({ x, y, type, spr: arr[Math.min(v, arr.length - 1)], sh, pad });
    });
    return out;
  }

  /* ===================================================================================== icons (100-unit space) */
  function drawIconArt(ctx, id) {
    const rng = U.rng(id.split('').reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) >>> 0);
    const L = (pts, c, w, closed) => wax(ctx, pts, { rng, closed, w, c, step: 2.2, wob: 1.0 });
    const F = (pts, c, ang, a) => { flat(ctx, pts, c, 0.4); scribble(ctx, pts, { rng, c, a: a === undefined ? 0.9 : a, sp: 5, w: 5.6, ang: ang === undefined ? -0.6 : ang, over: 3, bow: 0.5 }); };
    const crayon = (x, y, ang, col, len) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(len / 16, len / 16);
      drawCrayon(ctx, rng, col);
      ctx.restore();
    };
    switch (id) {
      case 'hp-heart': {
        const h = heartPts(50, 52, 40, 40);
        F(h, RED, -0.6);
        L(h, mixc(RED, INK, 0.5), 5.5, true);
        L(spl([[28, 38], [32, 30], [40, 27]], 4), [255, 255, 255], 4.5);
        break;
      }
      case 'kills': {
        const b = blob(50, 54, 34, 33, rng, 0.06, 30);
        F(b, PURPLE, -0.7);
        L(b, INK, 5, true);
        for (const [ex, ey, er] of [[38, 46, 11], [64, 47, 9]]) { const e = ell(ex, ey, er, er, 18); flat(ctx, e, [255, 254, 250], 1); L(e, INK, 3, true); dot(ctx, ex + er * 0.3, ey + 2, er * 0.45, INK, 1); }
        const m = [[34, 66], [68, 64], [62, 78], [42, 79]];
        flat(ctx, m, [70, 20, 40], 1);
        for (let k = 0; k < 3; k++) flat(ctx, [[38 + k * 9, 66], [45 + k * 9, 66], [41.5 + k * 9, 73]], [255, 254, 250], 1);
        L([[44, 22], [48, 10], [52, 21], [57, 9], [60, 23]], INK, 3.5);
        break;
      }
      case 'dmg': {
        const p = [];
        for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU, r = i & 1 ? 22 : 44; p.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]); }
        F(p, YELLOW, -0.5);
        F(ell(50, 50, 18, 16, 20), ORANGE, 0.6, 0.7);
        L(p, RED, 5, true);
        break;
      }
      case 'rate': {
        for (let k = 0; k < 3; k++) {
          const x = 30 + k * 22, y = 72 - k * 22;
          const b = blob(x, y, 11, 10, rng, 0.08, 16);
          F(b, RED, 0.5);
          L(b, mixc(RED, INK, 0.45), 3.5, true);
          for (let j = -1; j <= 1; j++) L([[x - 14 - Math.abs(j) * 3, y + 6 + j * 5], [x - 24, y + 12 + j * 5]], GREY, 3);
        }
        break;
      }
      case 'multi': {
        crayon(34, 30, -Math.PI / 2 - 0.25, RED, 56);
        crayon(50, 26, -Math.PI / 2, BLUE, 56);
        crayon(66, 30, -Math.PI / 2 + 0.25, GREEN, 56);
        const box = [[16, 46], [84, 46], [80, 92], [20, 92]];
        F(box, YELLOW, 0.4);
        L(box, INK, 4.5, true);
        const lab = [[30, 58], [70, 58], [68, 78], [32, 78]];
        F(lab, GREEN, -0.5, 0.8);
        L(lab, DGREEN, 3, true);
        break;
      }
      case 'bounce': {
        const p = [];
        for (let i = 0; i <= 30; i++) { const t = i / 30; p.push([10 + t * 70, 84 - Math.abs(Math.sin(t * Math.PI * 1.5)) * 56 * (1 - t * 0.35)]); }
        for (let i = 0; i < p.length - 1; i += 3) L([p[i], p[i + 1]], GREY, 3);
        L([[6, 88], [94, 88]], GREEN, 5);
        const b = blob(80, 66, 12, 12, rng, 0.04, 18);
        F(b, RED, 0.3);
        L(b, INK, 4, true);
        L(spl([[70, 62], [80, 56], [90, 62]], 4), [255, 255, 255], 3);
        break;
      }
      case 'lantern': {
        L(ell(50, 52, 30, 24, 36), GREY, 2.6, true);
        const k = blob(50, 52, 10, 10, rng, 0.05, 16);
        F(k, PEACH, 0.4);
        L(k, INK, 3.5, true);
        crayon(22, 40, -1.0, ORANGE, 42);
        crayon(78, 64, 2.1, PURPLE, 42);
        break;
      }
      case 'speed': {
        const shoe = spl([[22, 62], [26, 42], [44, 46], [62, 40], [84, 52], [88, 66], [22, 70]], 3, true);
        F(shoe, RED, -0.5);
        L(shoe, INK, 4.5, true);
        const sole = [[18, 66], [90, 64], [88, 76], [20, 78]];
        flat(ctx, sole, [255, 254, 250], 1);
        L(sole, INK, 4, true);
        L([[44, 48], [50, 56]], [255, 255, 255], 3); L([[52, 45], [58, 53]], [255, 255, 255], 3);
        for (let k = 0; k < 3; k++) L([[14 - k * 2, 30 + k * 11], [-2, 30 + k * 11]], INK, 3.5);
        break;
      }
      case 'magnet': {
        const outer = [], inner = [];
        for (let i = 0; i <= 18; i++) { const a = Math.PI + (i / 18) * Math.PI; outer.push([50 + Math.cos(a) * 32, 48 + Math.sin(a) * 32]); inner.push([50 + Math.cos(a) * 14, 48 + Math.sin(a) * 14]); }
        const u = outer.concat([[82, 74], [64, 74]], inner.slice().reverse(), [[36, 74], [18, 74]]);
        F(u, RED, -0.6);
        L(u, INK, 4.5, true);
        for (const x of [18, 64]) { const t = [[x, 74], [x + 18, 74], [x + 18, 88], [x, 88]]; flat(ctx, t, GREY, 0.75); L(t, INK, 4, true); }
        L([[10, 8], [18, 18], [12, 22], [22, 30]], YELLOW, 4);
        L([[90, 8], [82, 18], [88, 22], [78, 30]], YELLOW, 4);
        break;
      }
      case 'hp': {
        const h = heartPts(50, 48, 36, 40);
        F(h, PINK, -0.6);
        L(h, mixc(PINK, INK, 0.45), 4.5, true);
        ctx.save(); ctx.translate(50, 54); ctx.rotate(-0.6);
        const band = [[-38, -11], [38, -11], [38, 11], [-38, 11]];
        F(band, TAN, 0, 0.85);
        L(band, BROWN, 3.5, true);
        const pad = [[-12, -11], [12, -11], [12, 11], [-12, 11]];
        flat(ctx, pad, [255, 240, 220], 1);
        L(pad, BROWN, 2.5, true);
        for (const [x, y] of [[-28, -4], [-24, 4], [24, -4], [28, 4], [-20, -3], [20, 3]]) dot(ctx, x, y, 1.8, BROWN, 0.8);
        ctx.restore();
        break;
      }
      default: {
        const st = starPts(50, 52, 40, 18, 5, 0);
        F(st, YELLOW, -0.6);
        L(st, ORANGE, 5, true);
      }
    }
  }

  /* ===================================================================================== hand-written numbers */
  const NUMS = new Map();
  let numFont = false, numCheck = 0;
  function fontOK(f) { try { return !!(document.fonts && document.fonts.check('20px "' + f + '"') && [...document.fonts].some((ff) => ff.family.replace(/["']/g, '') === f && ff.status === 'loaded')); } catch (e) { return false; } }
  function numSprite(value, crit) {
    const key = value + (crit ? 'c' : 'n');
    let s = NUMS.get(key);
    if (s) return s;
    if (NUMS.size > 300) NUMS.clear();
    const fam = numFont ? '"Gochi Hand", cursive' : '"Comic Sans MS", cursive';
    const px = Math.round((crit ? 14 : 10) * K);
    const txt = String(value);
    const m = U.canvas(4, 4).ctx;
    m.font = px + 'px ' + fam;
    const w = Math.ceil(m.measureText(txt).width);
    const pad = Math.ceil(px * 0.4);
    const W = w + pad * 2, H = Math.ceil(px * 1.5 + pad);
    const by = pad + px * 0.95;
    const A = U.canvas(W, H);
    A.ctx.font = px + 'px ' + fam;
    A.ctx.fillStyle = rgba(crit ? RED : INK, 1);
    A.ctx.fillText(txt, pad, by);
    if (crit) {
      A.ctx.lineCap = 'round'; A.ctx.lineJoin = 'round';
      A.ctx.beginPath();
      const n = Math.max(3, Math.round(w / (px * 0.25)));
      for (let i = 0; i <= n; i++) A.ctx.lineTo(pad + (w * i) / n, by + px * (i & 1 ? 0.22 : 0.08));
      A.ctx.lineWidth = px * 0.09; A.ctx.strokeStyle = rgba(ORANGE, 1); A.ctx.stroke();
    }
    tooth(A.ctx, W, H, 0.55);
    const O = U.canvas(W, H);
    O.ctx.font = A.ctx.font;
    O.ctx.lineJoin = 'round';
    O.ctx.strokeStyle = cPaper;
    O.ctx.lineWidth = px * 0.32;
    O.ctx.strokeText(txt, pad, by);
    O.ctx.drawImage(A.c, 0, 0);
    s = { c: O.c, ax: W / 2, ay: by };
    NUMS.set(key, s);
    return s;
  }

  /* ===================================================================================== screen: sun in the corner, clouds, tape */
  let SCR = null;
  function buildScreen(W, H) {
    const k = H / 360; // screen px per world unit
    const rng = U.rng(31337);
    const sun = [0, 1, 2].map((v) => mk(-48, -48, 48, 48, (c) => {
      const r = U.rng(900 + v);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + J(0.05, r), r0 = 27, r1 = i & 1 ? 37 : 44;
        if (i % 3 === 1) wax(c, [[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a + 0.08) * (r0 + r1) / 2 + 2, Math.sin(a + 0.08) * (r0 + r1) / 2], [Math.cos(a) * r1, Math.sin(a) * r1]], { rng: r, w: 2.2, c: ORANGE, wob: 0.4 });
        else wax(c, [[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1]], { rng: r, w: 2.4, c: i & 1 ? ORANGE : YELLOW, wob: 0.4 });
      }
      const d = blob(0, 0, 23, 23, r, 0.03, 40);
      flat(c, d, YELLOW, 0.6);
      scribble(c, d, { rng: r, c: YELLOW, a: 0.95, sp: 2.2, w: 2.5, ang: -0.6, over: 2.5 });
      scribble(c, blob(6, 6, 13, 12, r, 0.1, 20), { rng: r, c: ORANGE, a: 0.4, sp: 2.4, w: 2.2, ang: 0.6, over: 1 });
      wax(c, d, { rng: r, closed: true, w: 2.0, c: ORANGE, wob: 0.5, step: 1.2 });
      for (const ex of [-8, 6]) { flat(c, ell(ex, -4, 2.2, 3.2, 14), INK, 1); dot(c, ex + 0.8, -5, 0.8, [255, 255, 255], 1); }
      const sm = [];
      for (let i = 0; i <= 12; i++) { const a = 0.35 + (i / 12) * 2.4; sm.push([-1 + Math.cos(a) * 11, 3 + Math.sin(a) * 8]); }
      wax(c, sm, { rng: r, w: 1.8, c: INK, dbl: false, wob: 0.2 });
      scribble(c, ell(-15, 7, 3.6, 2.6, 12), { rng: r, c: PINK, a: 0.8, sp: 1.2, w: 1.4, over: 0.4 });
      scribble(c, ell(13, 7, 3.6, 2.6, 12), { rng: r, c: PINK, a: 0.8, sp: 1.2, w: 1.4, over: 0.4 });
    }, { k, halo: 0, tooth: 0.9 }));
    const clouds = [0, 1].map((i) => [0, 1, 2].map((v) => mk(-36, -16, 36, 14, (c) => {
      const r = U.rng(950 + i * 10 + v);
      const p = puffPts(0, 0, 32 - i * 6, 12 - i * 2, 7, U.rng(960 + i), 56);
      flat(c, p, [255, 255, 255], 0.9);
      scribble(c, p, { rng: r, c: PALE, a: 0.5, sp: 2.4, w: 2.2, ang: -0.2, over: 0.6 });
      wax(c, p, { rng: r, closed: true, w: 1.6, c: SKY, wob: 0.5, step: 1.2 });
    }, { k, halo: 0, tooth: 0.7 })));
    // masking tape in two corners + a soft edge darkening of the sheet
    const { c, ctx } = U.canvas(W, H);
    const vg = (x0, y0, x1, y1, rx, ry, rw, rh) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(150,120,70,0.13)'); g.addColorStop(1, 'rgba(150,120,70,0)');
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
    };
    const vh = Math.round(H * 0.07);
    vg(0, 0, 0, vh, 0, 0, W, vh); vg(0, H, 0, H - vh, 0, H - vh, W, vh);
    vg(0, 0, vh, 0, 0, 0, vh, H); vg(W, 0, W - vh, 0, W - vh, 0, vh, H);
    const tape = (x, y, ang, len) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      const tw = len * k, th = 15 * k;
      ctx.beginPath();
      ctx.moveTo(-tw / 2, -th / 2);
      for (let i = 0; i <= 6; i++) ctx.lineTo(-tw / 2 + J(1.6 * k, rng) + (i & 1 ? 1.4 * k : 0), -th / 2 + (th * i) / 6);
      for (let i = 6; i >= 0; i--) ctx.lineTo(tw / 2 + J(1.6 * k, rng) - (i & 1 ? 1.4 * k : 0), -th / 2 + (th * i) / 6);
      ctx.closePath();
      ctx.fillStyle = 'rgba(238,226,186,0.82)';
      ctx.shadowColor = 'rgba(80,60,30,0.18)'; ctx.shadowBlur = 3 * k; ctx.shadowOffsetY = 1 * k;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(-tw / 2 + 3 * k, -th / 2 + 2 * k, tw - 6 * k, th * 0.25);
      ctx.restore();
    };
    tape(14 * k, 12 * k, -0.75, 62);
    tape(W - 14 * k, H - 12 * k, -0.75, 62);
    tooth(ctx, W, H, 0.5);
    const cut = (x, y, w, h) => { const s = U.canvas(w, h); s.ctx.drawImage(c, x, y, w, h, 0, 0, w, h); return { c: s.c, x, y }; };
    const t = Math.round(46 * k);
    SCR = { W, H, k, sun, clouds, parts: [cut(0, 0, W, t), cut(0, H - t, W, t), cut(0, t, vh, H - 2 * t), cut(W - vh, t, vh, H - 2 * t)] };
  }

  /* ===================================================================================== blitting */
  let BX = 0, BY = 0, BS = 1;
  function base(view) { BS = view.S; BX = view.W / 2 - view.x * BS; BY = view.H / 2 - view.y * BS; }
  function blitC(ctx, c, s, x, y) {
    const k = 1 / s.k;
    const dx = Math.round((x - s.ax * k) * BS) / BS, dy = Math.round((y - s.ay * k) * BS) / BS;
    ctx.drawImage(c, dx, dy, c.width * k, c.height * k);
  }
  function blit(ctx, s, x, y) { blitC(ctx, s.c, s, x, y); }
  function blitS(ctx, s, x, y, sx, sy) {
    const k = 1 / s.k;
    if (sx < 0) {
      ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
      ctx.drawImage(s.c, -s.ax * k * -sx, -s.ay * k * sy, s.c.width * k * -sx, s.c.height * k * sy);
      ctx.restore();
      return;
    }
    ctx.drawImage(s.c, x - s.ax * k * sx, y - s.ay * k * sy, s.c.width * k * sx, s.c.height * k * sy);
  }
  function blitRot(ctx, s, x, y, ang, sc) {
    const k = (sc * BS) / s.k, c = Math.cos(ang) * k, sn = Math.sin(ang) * k;
    ctx.setTransform(c, sn, -sn, c, BX + x * BS, BY + y * BS);
    ctx.drawImage(s.c, -s.ax, -s.ay);
    ctx.setTransform(BS, 0, 0, BS, BX, BY);
  }
  /** All drawn objects are redrawn 7 times a second from three variants – the "boiling" line of animation on paper. */
  const boil = (rt) => Math.floor(rt * 7) % 3;

  /* ===================================================================================== effects state */
  const SCARS = [];
  let lastGameTime = 0;
  const SCARCOL = { creeper: 0, ghost: 1, colossus: 2 };
  const ECOL = { creeper: [5, 5, 0], ghost: [2, 2, 3], colossus: [4, 4, 6, 0] };
  const pickC = (arr) => arr[(Math.random() * arr.length) | 0];
  let hurtAt = -1e9;

  /* ===================================================================================== CSS (HUD skin) */
  const TOOTHCSS = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='0.9 1.3' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -11 0 0 0 7.2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";
  const ZIG = (col) => `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='10'><path d='M0 8 L5.5 2 L11 8 L16.5 2 L22 8' fill='none' stroke='%23${col}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>")`;
  const TAPE = "content: ''; position: absolute; width: 58px; height: 18px; background: linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,0) 40%), rgba(238,226,186,.85); box-shadow: 0 1px 2px rgba(80,60,30,.18); clip-path: polygon(0 8%, 6% 0, 12% 10%, 88% 0, 94% 8%, 100% 0, 100% 92%, 94% 100%, 88% 90%, 12% 100%, 6% 92%, 0 100%);";
  const SCRAP = 'background: #fffdf6; box-shadow: 1px 2px 0 rgba(60,50,30,.10), 3px 5px 10px rgba(60,50,30,.12);';
  const B = 'body.style-crayon';
  const CSS = `
${B} { --ink:#2b2a30; --red:#e2362c; --org:#f78b1f; --yel:#fdce28; --grn:#42ae3a; --dgrn:#217a38; --sky:#42a8ea; --blu:#2a5ec8; --pur:#8c4cc4; --pnk:#f67eb4; --brn:#94582c; --paper:#fffdf6; }
${B} #hud { padding: 20px 30px; color: var(--ink); font-family: 'Patrick Hand', 'Comic Sans MS', cursive; }
${B} #hud .xp { height: 26px; border: 2px solid #8a6326; border-radius: 3px 4px 3px 5px; overflow: hidden; transform: rotate(-.35deg);
  background: repeating-linear-gradient(90deg, rgba(110,70,25,.8) 0 1.5px, transparent 1.5px 12px) 6px 0 / 100% 7px no-repeat,
    repeating-linear-gradient(90deg, rgba(110,70,25,.8) 0 2px, transparent 2px 60px) 6px 0 / 100% 12px no-repeat, linear-gradient(180deg, #fbe08a, #f1c75a);
  box-shadow: 2px 3px 0 rgba(60,40,20,.16); }
${B} #hud .xp-fill { top: 12px; bottom: 3px; border-radius: 6px 0 0 6px;
  background: repeating-linear-gradient(-62deg, rgba(66,168,234,.95) 0 3px, rgba(66,168,234,.55) 3px 5px);
  clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 30%, calc(100% - 4px) 55%, 100% 80%, calc(100% - 5px) 100%, 0 100%);
  -webkit-mask-image: ${TOOTHCSS}; mask-image: ${TOOTHCSS}; }
${B} #hud .lvl { right: 10px; font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 19px; color: var(--red); text-shadow: 0 0 3px #fbe08a, 0 0 2px #fbe08a; }
${B} #hud .topline { margin-top: 16px; }
${B} #hud .hp { position: relative; gap: 8px; padding: 7px 16px 7px 9px; ${SCRAP} transform: rotate(-1.4deg); border-radius: 2px 6px 3px 5px; }
${B} #hud .hp::before { ${TAPE} left: 44%; top: -10px; transform: rotate(-5deg); }
${B} #hud .hp-icon, ${B} #hud .kills-icon { width: 42px; height: 42px; }
${B} #hud .hp-bar { width: 232px; height: 22px; background: #fff; border: 2.5px solid var(--ink); border-radius: 12px 5px 10px 4px / 5px 10px 4px 12px; }
${B} #hud .hp-fill { background: repeating-linear-gradient(-58deg, rgba(226,54,44,.95) 0 3.5px, rgba(226,54,44,.6) 3.5px 6px);
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 25%, calc(100% - 5px) 50%, 100% 75%, calc(100% - 6px) 100%, 0 100%);
  -webkit-mask-image: ${TOOTHCSS}; mask-image: ${TOOTHCSS}; }
${B} #hud .hp-text { font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 23px; text-shadow: none; color: var(--ink); }
${B}.hurt #hud .hp { animation: crayonWiggle .25s linear; }
${B}.hurt #hud .hp-bar { border-color: var(--red); }
@keyframes crayonWiggle { 0%,100% { transform: rotate(-1.4deg); } 30% { transform: rotate(1.5deg) translateX(-3px); } 70% { transform: rotate(-3deg) translateX(3px); } }
${B} #hud .clock { position: relative; min-width: 150px; padding: 8px 26px 6px; margin-top: -4px; transform: rotate(1.6deg);
  background: linear-gradient(180deg, #fff6a8, #ffec7e); box-shadow: 2px 4px 0 rgba(60,50,30,.12), 4px 8px 12px rgba(60,50,30,.12); border-radius: 2px 3px 14px 2px; }
${B} #hud .clock::before { ${TAPE} left: 50%; top: -11px; margin-left: -29px; transform: rotate(3deg); }
${B} #hud .clock-time { font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 40px; line-height: 1; letter-spacing: 1px; color: var(--blu); text-shadow: none;
  -webkit-mask-image: ${TOOTHCSS}; mask-image: ${TOOTHCSS}; }
${B} #hud .clock-label { font-family: 'Patrick Hand', cursive; font-size: 17px; letter-spacing: .5px; text-transform: none; opacity: 1; color: var(--red); }
${B} #hud .kills { position: relative; min-width: 0; padding: 6px 18px 6px 10px; gap: 8px; ${SCRAP} transform: rotate(1.2deg); border-radius: 5px 2px 6px 3px;
  font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 32px; color: var(--pur); text-shadow: none; }
${B} #hud .kills::before { ${TAPE} right: -16px; top: -6px; transform: rotate(38deg); }
${B} #hud .kills-num { min-width: 60px; text-align: center; padding-bottom: 2px; background: ${ZIG('8c4cc4')} 0 100% / 22px 8px repeat-x; }
${B} #stylebar { bottom: 18px; padding: 8px 26px; gap: 14px; border: 0; border-radius: 2px; color: var(--ink); ${SCRAP} transform: translateX(-50%) rotate(-.8deg);
  font-family: 'Patrick Hand', cursive; font-size: 14px; }
${B} #stylebar::before { ${TAPE} left: -24px; top: 50%; margin-top: -9px; transform: rotate(-70deg); }
${B} #stylebar .style-family { font-family: 'Schoolbell', cursive; font-size: 14px; letter-spacing: .5px; text-transform: none; opacity: 1; color: var(--dgrn); }
${B} #stylebar .style-name { font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 22px; color: var(--red); }
${B} #stylebar .style-hint { opacity: .75; }
${B} #stylebar .auto.on { color: var(--blu); }
${B} #levelup { gap: 30px; background: radial-gradient(ellipse at 50% 50%, rgba(255,253,246,.55), rgba(255,250,236,.82)); }
${B} #levelup .lu-title { font-family: 'Caveat Brush', 'Gochi Hand', cursive; font-weight: 400; font-size: 88px; line-height: 1; letter-spacing: 2px; text-shadow: none; transform: rotate(-2.5deg);
  color: var(--red); background: linear-gradient(90deg, #e2362c 0 17%, #f78b1f 17% 33%, #e0b400 33% 50%, #42ae3a 50% 67%, #2a5ec8 67% 83%, #8c4cc4 83%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; -webkit-mask-image: ${TOOTHCSS}; mask-image: ${TOOTHCSS}; padding: 0 10px 14px; }
${B} #levelup .lu-title::after { content: ''; display: block; height: 10px; margin: 0 6%; background: ${ZIG('f78b1f')} 0 0 / 22px 10px repeat-x; }
${B} #levelup .lu-cards { gap: 34px; }
${B} #levelup .card { --r: -2deg; width: 232px; min-height: 304px; padding: 42px 18px 22px; gap: 8px; color: var(--ink); background: var(--paper);
  border: 3px solid var(--red); border-radius: 18px 6px 22px 5px / 6px 20px 6px 18px; transform: rotate(var(--r));
  box-shadow: 0 0 0 1.5px rgba(226,54,44,.35), 3px 6px 0 rgba(60,50,30,.12), 6px 12px 18px rgba(60,50,30,.14); transition: transform .14s cubic-bezier(.3,1.6,.5,1); }
${B} #levelup .card:nth-child(2) { --r: 1.4deg; border-color: var(--blu); box-shadow: 0 0 0 1.5px rgba(42,94,200,.35), 3px 6px 0 rgba(60,50,30,.12), 6px 12px 18px rgba(60,50,30,.14); }
${B} #levelup .card:nth-child(3) { --r: -.8deg; border-color: var(--grn); box-shadow: 0 0 0 1.5px rgba(66,174,58,.35), 3px 6px 0 rgba(60,50,30,.12), 6px 12px 18px rgba(60,50,30,.14); }
${B} #levelup .card:hover { transform: rotate(0deg) translateY(-8px) scale(1.03); }
${B} #levelup .card::before { ${TAPE} width: 74px; height: 22px; left: 50%; top: -12px; margin-left: -37px; transform: rotate(-3deg); }
${B} #levelup .card:nth-child(2)::before { transform: rotate(4deg); }
${B} #levelup .card-icon { width: 116px; height: 116px; }
${B} #levelup .card-name { font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 27px; line-height: 1.05; color: var(--ink); }
${B} #levelup .card-desc { font-family: 'Patrick Hand', cursive; font-size: 19px; line-height: 1.25; opacity: 1; color: #57545e; }
${B} #levelup .card-key { top: 10px; left: 12px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; opacity: 1;
  font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 21px; color: var(--red); border: 2.5px solid currentColor; border-radius: 52% 46% 55% 44% / 48% 55% 45% 52%; }
${B} #levelup .card:nth-child(2) .card-key { color: var(--blu); }
${B} #levelup .card:nth-child(3) .card-key { color: var(--grn); }
${B} #levelup .lu-hint { font-family: 'Patrick Hand', cursive; font-size: 21px; color: var(--ink); opacity: .85; }
${B} #gameover { background: rgba(255,250,236,.84); }
${B} #gameover .go-title { font-family: 'Caveat Brush', cursive; font-weight: 400; font-size: 76px; color: var(--red); transform: rotate(-2deg); -webkit-mask-image: ${TOOTHCSS}; mask-image: ${TOOTHCSS}; }
${B} #gameover .go-stats { font-family: 'Patrick Hand', cursive; font-size: 23px; color: var(--ink); }
${B} #gameover .go-hint { font-family: 'Gochi Hand', cursive; font-size: 21px; color: var(--blu); }
${B} #pausebox { font-family: 'Caveat Brush', cursive; font-weight: 400; font-size: 76px; color: var(--blu); text-shadow: 3px 3px 0 rgba(253,206,40,.8); }
`;

  /* ===================================================================================== the style */
  Styles.register({
    id: 'crayon',
    name: 'Crayon Kids',
    family: 'Hand-drawn · Wax crayon',
    description: "A child's wax-crayon drawing brought to life: toothy white paper, zigzag scribble fills that go outside the lines, wobbly outlines that boil, lollipop trees, triangle-roof houses and a smiling sun in the corner.",
    groundColor: '#fbf8ef',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Gochi+Hand', 'Patrick+Hand', 'Caveat+Brush', 'Schoolbell'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = (window.__forceH || window.innerHeight || 900) * dpr;
      K = U.clamp(Math.round((h / 360) * 1.5 * 4) / 4, 2.5, 5);
      buildTooth();
      buildPaper();
      buildSprites();
      if (document.fonts && document.fonts.load) {
        for (const f of ['20px "Gochi Hand"', '20px "Patrick Hand"', '20px "Caveat Brush"', '20px "Schoolbell"']) document.fonts.load(f).catch(() => {});
      }
    },

    renderGroundChunk(ctx, info) { return renderGround(ctx, info); },
    propsForChunk(info) { return propsFor(info); },

    drawProp(ctx, p, view) {
      base(view);
      const arr = p.spr;
      if (!arr) return;
      blit(ctx, arr[boil(view.rt) % arr.length], p.x, p.y);
    },

    drawShadow(ctx, o, view) {
      base(view);
      if (o.kind === 'prop') { if (o.sh) blit(ctx, o.sh, o.x, o.y + 0.6); return; }
      if (o.kind === 'enemy') {
        const sh = o.type === 'ghost' ? SPR.shGhost : o.type === 'colossus' ? SPR.shColossus : SPR.shCreeper;
        if (o.dying) { ctx.globalAlpha = 1 - o.deathT; blit(ctx, sh, o.x, o.y + 0.5); ctx.globalAlpha = 1; return; }
        if (o.spawnT < 1) { const s = 0.3 + 0.7 * o.spawnT; blitS(ctx, sh, o.x, o.y + 0.5, s, s); return; }
        blit(ctx, sh, o.x, o.y + 0.5);
        return;
      }
      blit(ctx, SPR.shKid, o.x, o.y + 0.5);
    },

    drawGroundOverlay(ctx, view, game) {
      if (LAZY.length) runLazy(1.5);
      base(view);
      const t = game.time;
      if (t < lastGameTime - 0.5) SCARS.length = 0;
      lastGameTime = t;
      for (let i = SCARS.length - 1; i >= 0; i--) {
        const s = SCARS[i], age = t - s.born;
        if (age > s.life || age < 0) { SCARS.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, age * 10) * (1 - age / s.life) * 0.9;
        blitS(ctx, SPR.scar[s.c][s.v], s.x, s.y, s.s * (s.flip ? -1 : 1), s.s);
      }
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      base(view);
      const v = boil(view.rt);
      const bob = Math.sin(view.rt * 3 + g.seed * 20) * 0.8;
      blit(ctx, SPR.shGem, g.x, g.y + 0.6);
      const spr = g.big ? SPR.gemBig[v] : SPR.gem[v];
      if (g.pop > 0) { const s = 1 + g.pop * 0.6; blitS(ctx, spr, g.x, g.y - g.pop * 4, s, s); }
      else if (g.big) blitRot(ctx, spr, g.x, g.y - 0.5 + bob, Math.sin(view.rt * 2 + g.seed * 9) * 0.15, 1);
      else blit(ctx, spr, g.x, g.y - 0.5 + bob);
    },

    drawEnemy(ctx, e, view) {
      base(view);
      const set = SPR[e.type];
      if (!set) return;
      const fi = e.facing < 0 ? 1 : 0;
      let fr;
      if (e.type === 'ghost') fr = Math.floor(view.rt * 6 + e.seed * 9) & 3;
      else if (e.type === 'colossus') fr = Math.floor(e.anim * 2.2) & 3;
      else fr = Math.floor(e.anim * 3) & 3;
      const s = set[fi][fr][boil(view.rt)];
      let y = e.y;
      if (e.type === 'ghost') y -= 2.4 + Math.sin(view.rt * 3.4 + e.seed * 20) * 1.4;
      const k = 1 / s.k, w = s.c.width, h = s.c.height;
      const cy = y - (e.type === 'colossus' ? 22 : e.type === 'ghost' ? 12 : 11);
      const sc = e.type === 'colossus' ? 2.3 : e.type === 'ghost' ? 1.15 : 1.05;
      if (e.dying) {
        // the child crosses it out, then it shrinks away
        const u = e.deathT;
        const sh = u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45;
        ctx.globalAlpha = Math.max(0, sh);
        const shrink = 0.5 + 0.5 * sh;
        blitS(ctx, s, e.x, y - (1 - shrink) * (h * k) * 0.3, shrink, shrink);
        const lvl = u < 0.18 ? 0 : u < 0.36 ? 1 : 2;
        blitS(ctx, SPR.scratch[lvl][boil(view.rt)], e.x, cy, sc * shrink, sc * shrink);
        ctx.globalAlpha = 1;
        return;
      }
      if (e.spawnT < 1) {
        // drawn onto the paper from the top down – the crayon tip is visible
        const t = e.spawnT, q = U.ease.outQuad(t);
        const rows = Math.max(1, Math.round(h * q));
        const dx = e.x - s.ax * k, dy = y - s.ay * k;
        ctx.drawImage(s.c, 0, 0, w, rows, dx, dy, w * k, rows * k);
        const col = e.type === 'colossus' ? 1 : e.type === 'ghost' ? 3 : 2;
        const tx = dx + (0.5 + 0.38 * Math.sin(t * 46 + e.seed * 9)) * w * k, ty = dy + rows * k;
        blitRot(ctx, SPR.crayon[col][boil(view.rt)], tx - 3, ty - 5, 1.0, 0.8);
        return;
      }
      let ox = 0;
      if (e.flash > 0.3) ox = Math.sin(view.rt * 90 + e.seed * 10) * e.flash * 1.2;
      blit(ctx, s, e.x + ox, y);
      if (e.flash > 0 && s.f) {
        ctx.globalAlpha = Math.min(0.85, e.flash * (e.type === 'colossus' ? 0.7 : 0.95));
        blitC(ctx, s.f, s, e.x + ox, y);
        ctx.globalAlpha = 1;
      }
    },

    drawPlayer(ctx, p, view) {
      base(view);
      const rt = view.rt;
      const fi = p.facing < 0 ? 1 : 0;
      const v = boil(rt);
      const K_ = SPR.kid;
      let s;
      if (p.dashT > 0) s = K_.dash[fi][v];
      else if (p.moving) s = K_.walk[fi][Math.floor(p.anim * 1.25) & 3][v];
      else s = K_.idle[fi][Math.floor(rt * 2) & 1][v];
      if (p.levelT > 0) {
        ctx.globalAlpha = Math.min(1, p.levelT * 2);
        blitRot(ctx, SPR.ring[v], p.x, p.y - 14, rt * 0.8, 1.15 + (1 - p.levelT) * 0.7);
        for (let i = 0; i < 5; i++) {
          const a = rt * 2 + (i / 5) * TAU, r = 18 + (1 - p.levelT) * 10;
          blitRot(ctx, SPR.star[i % 2 ? 0 : 3], p.x + Math.cos(a) * r, p.y - 14 + Math.sin(a) * r * 0.8, a, 0.8);
        }
        ctx.globalAlpha = 1;
      }
      if (p.dashT > 0) {
        const ang = Math.atan2(p.dashY, p.dashX);
        ctx.globalAlpha = 0.85;
        blitRot(ctx, SPR.lines, p.x - p.dashX * 8, p.y - 14 - p.dashY * 4, ang, 1.3);
        ctx.globalAlpha = 0.28;
        blit(ctx, s, p.x - p.dashX * 10, p.y - p.dashY * 10);
        ctx.globalAlpha = 1;
      }
      const since = (performance.now() - hurtAt) / 1000;
      const blink = p.iframes > 0 && since < 0.9 && (Math.floor(since * 14) & 1) === 1;
      ctx.globalAlpha = blink ? 0.55 : 1;
      blit(ctx, s, p.x, p.y);
      if (p.hurtT > 0 && s.h) {
        ctx.globalAlpha = Math.min(0.85, p.hurtT * 1.1);
        blitC(ctx, s.h, s, p.x, p.y);
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      base(view);
      const v = boil(view.rt);
      const col = [0, 2, 1, 3, 4][o.idx % 5];
      const tang = o.angle + Math.PI / 2;
      // two short motion lines behind the crayon
      const bx = -Math.cos(tang), by = -Math.sin(tang);
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(146,144,152,0.6)';
      ctx.beginPath();
      for (const s of [-2.2, 2.2]) {
        const px = o.x + by * s + bx * 8, py = o.y - bx * s + by * 8;
        ctx.moveTo(px, py);
        ctx.lineTo(px + bx * (s < 0 ? 7 : 5), py + by * (s < 0 ? 7 : 5));
      }
      ctx.stroke();
      blitRot(ctx, SPR.crayon[col][v], o.x, o.y, tang + 0.35 * Math.sin(view.rt * 5 + o.idx), 1.05);
    },

    drawProjectile(ctx, pr, view) {
      base(view);
      const a = Math.atan2(pr.vy, pr.vx);
      const k = Math.min(1, pr.age * 8);
      ctx.globalAlpha = 0.9;
      blitRot(ctx, SPR.trail, pr.x, pr.y, a, 0.4 + 0.6 * k);
      ctx.globalAlpha = 1;
      blitRot(ctx, SPR.ball[Math.floor(pr.spin * 0.5) % 3], pr.x, pr.y, pr.spin * 0.4, 1);
    },

    drawParticle(ctx, pt, view) {
      base(view);
      const life = pt.life / pt.max, age = 1 - life;
      const c = (pt.c | 0) % 8;
      const y = pt.y - pt.z;
      switch (pt.kind) {
        case 'pow': {
          const s = pt.size * (age < 0.15 ? 0.5 + (age / 0.15) * 0.6 : 1.1 - (age - 0.15) * 0.3);
          ctx.globalAlpha = life < 0.35 ? life / 0.35 : 1;
          blitRot(ctx, SPR.pow[(pt.seed * 3) | 0], pt.x, y, pt.rot, s);
          break;
        }
        case 'zig': {
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.zig[c], pt.x, y, pt.rot, pt.size);
          break;
        }
        case 'curl': {
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.curl[c], pt.x, y, pt.rot, pt.size * (0.6 + age * 0.6));
          break;
        }
        case 'star': {
          const s = pt.size * (age < 0.2 ? age / 0.2 : 1 - (age - 0.2) * 0.6);
          blitRot(ctx, SPR.star[c], pt.x, y, pt.rot, s);
          break;
        }
        case 'heart': {
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.heart[c & 1], pt.x, y, Math.sin(age * 9 + pt.seed * 6) * 0.25, pt.size * (0.6 + Math.min(1, age * 5) * 0.4));
          break;
        }
        case 'crumb': {
          ctx.globalAlpha = life < 0.3 ? life / 0.3 : 1;
          blitRot(ctx, SPR.crumb[c], pt.x, y, pt.rot, pt.size);
          break;
        }
        case 'puff': {
          const s = pt.size * (0.6 + U.ease.outQuad(age) * 0.8);
          ctx.globalAlpha = Math.min(1, life * 1.6) * 0.95;
          blitS(ctx, SPR.puff[(pt.seed * 3) | 0], pt.x, y, s, s);
          break;
        }
        case 'ring': {
          const s = pt.size * (0.4 + U.ease.outQuad(age) * 1.1);
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.ring[(pt.seed * 3) | 0], pt.x, y, pt.rot + age, s);
          break;
        }
        case 'lines': {
          ctx.globalAlpha = life;
          blitRot(ctx, SPR.lines, pt.x, y, pt.rot, pt.size);
          break;
        }
        default: {
          ctx.globalAlpha = life;
          ctx.fillStyle = pt.color || 'rgb(43,42,48)';
          ctx.fillRect(pt.x - pt.size / 2, y - pt.size / 2, pt.size, pt.size);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n) {
      if (!numFont && (numCheck++ & 31) === 0 && fontOK('Gochi Hand')) { numFont = true; NUMS.clear(); }
      const spr = numSprite(n.value, n.crit);
      const age = n.max - n.life;
      const k = age < 0.08 ? 0.6 + (age / 0.08) * 0.5 : age < 0.16 ? 1.1 - ((age - 0.08) / 0.08) * 0.1 : 1;
      ctx.globalAlpha = n.life < 0.22 ? n.life / 0.22 : 1;
      const kk = 1 / K;
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate((n.seed - 0.5) * 0.35);
      ctx.drawImage(spr.c, -spr.ax * kk * k, -spr.ay * kk * k, spr.c.width * kk * k, spr.c.height * kk * k);
      ctx.restore();
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      if (!SCR || SCR.W !== view.W || SCR.H !== view.H) buildScreen(view.W, view.H);
      for (const p of SCR.parts) ctx.drawImage(p.c, p.x, p.y);
      const k = SCR.k, v = boil(view.rt), rt = view.rt;
      // two clouds drifting along the top edge
      for (let i = 0; i < 2; i++) {
        const cl = SCR.clouds[i][v];
        const span = view.W + 90 * k;
        const x = ((view.W * (0.18 + i * 0.4) + rt * (5 + i * 3) * k) % span) - 45 * k;
        const y = (22 + i * 16) * k;
        ctx.drawImage(cl.c, Math.round(x - cl.ax), Math.round(y - cl.ay));
      }
      // the sun with a face in the corner
      const sun = SCR.sun[v];
      const sx = view.W - 34 * k, sy = 34 * k;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.sin(rt * 0.8) * 0.06);
      ctx.drawImage(sun.c, -sun.ax, -sun.ay);
      ctx.restore();
    },

    drawIcon(ctx, id, size) {
      ctx.save();
      ctx.scale(size / 100, size / 100);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      drawIconArt(ctx, id);
      ctx.restore();
      tooth(ctx, size, size, 0.75);
    },

    /* ---------- hooks ---------- */
    onHit(game, e, src) {
      const big = e.type === 'colossus';
      const hy = e.y - e.r * (big ? 1.4 : 1.2);
      game.addParticle({ x: e.x + (Math.random() - 0.5) * 4, y: hy, z: 0, kind: 'zig', c: src === 'lantern' ? 6 : src === 'dash' ? 2 : 0, life: 0.32, size: big ? 1.3 : 0.9, rot: Math.random() * TAU, drag: 0 });
      const cols = ECOL[e.type] || [7];
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 40;
        game.addParticle({ x: e.x, y: e.y, z: e.r * 1.1, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 25 + Math.random() * 30, grav: 170, kind: 'crumb', c: pickC(cols), life: 0.5, size: 0.8 + Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, drag: 1.5 });
      }
    },
    onKill(game, e) {
      const big = e.type === 'colossus';
      const cols = ECOL[e.type] || [7];
      const cy = e.y - e.r * (big ? 1.3 : 1.1);
      game.addParticle({ x: e.x, y: cy, z: 0, kind: 'pow', life: big ? 0.6 : 0.46, size: big ? 1.7 : e.type === 'ghost' ? 0.8 : 1.0, rot: Math.random() * TAU, seed: Math.random(), drag: 0 });
      const ns = big ? 6 : 3;
      for (let i = 0; i < ns; i++) {
        const a = (i / ns) * TAU + Math.random(), s = (big ? 70 : 50) + Math.random() * 30;
        game.addParticle({ x: e.x, y: cy, z: 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, kind: i % 3 === 2 ? 'heart' : 'star', c: i % 3 === 2 ? 0 : pickC([0, 0, 6, 3, 2]), life: 0.5 + Math.random() * 0.2, size: big ? 1.0 : 0.75, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 6, drag: 3.5 });
      }
      const nc = big ? 12 : e.type === 'ghost' ? 4 : 6;
      for (let i = 0; i < nc; i++) {
        const a = Math.random() * TAU, s = (big ? 60 : 40) + Math.random() * 50;
        game.addParticle({ x: e.x, y: e.y, z: e.r * (0.6 + Math.random()), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 50, grav: 220, kind: 'crumb', c: pickC(cols), life: 0.6 + Math.random() * 0.4, size: (big ? 1.3 : 0.9) + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 18, drag: 1.2 });
      }
      if (big) for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; game.addParticle({ x: e.x + Math.cos(a) * 16, y: cy + Math.sin(a) * 12, z: 0, kind: 'zig', c: 1, life: 0.4, size: 1.4, rot: a, drag: 0 }); }
      if (SCARS.length > 50) SCARS.shift();
      SCARS.push({ x: e.x, y: e.y - (big ? 3 : 1), s: big ? 2 : e.type === 'ghost' ? 0.75 : 1, c: SCARCOL[e.type] || 3, v: (Math.random() * 2) | 0, flip: Math.random() < 0.5, born: game.time, life: 2.6 });
    },
    onHurt(game, p) {
      hurtAt = performance.now();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.9;
        game.addParticle({ x: p.x + Math.cos(a) * 12, y: p.y - 16 + Math.sin(a) * 10, z: 0, vx: Math.cos(a) * 20, vy: Math.sin(a) * 20, kind: 'zig', c: 1, life: 0.35, size: 1.1, rot: a + Math.PI / 2, drag: 2 });
      }
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * TAU, s = 40 + Math.random() * 50;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 40, grav: 200, kind: 'crumb', c: i & 1 ? 1 : 7, life: 0.6, size: 0.9 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, drag: 1.2 });
      }
    },
    onPickup(game, g) {
      game.addParticle({ x: g.x + (Math.random() - 0.5) * 10, y: g.y - 16 - Math.random() * 8, z: 0, vy: -26, kind: g.big ? 'heart' : 'star', c: g.big ? 0 : 2, life: 0.45, size: g.big ? 1.0 : 0.55, rot: Math.random(), drag: 2.5 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.3) game.addParticle({ x: pr.x, y: pr.y + 2, z: 0, vx: pr.vx * 0.04, vy: pr.vy * 0.04, kind: 'puff', life: 0.3, size: 0.45, seed: Math.random(), drag: 4 });
    },
    onDash(game, p) {
      for (let i = 0; i < 3; i++) game.addParticle({ x: p.x - p.dashX * (4 + i * 6) + (Math.random() - 0.5) * 4, y: p.y - 1 - p.dashY * i * 5, z: 0, vx: -p.dashX * 18, vy: -p.dashY * 18 - 6, kind: 'puff', life: 0.5, size: 1.1 - i * 0.2, seed: Math.random(), drag: 3 });
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'ring', life: 0.7, size: 1.5, rot: 0, seed: Math.random(), drag: 0 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        game.addParticle({ x: p.x, y: p.y - 14, z: 0, vx: Math.cos(a) * 75, vy: Math.sin(a) * 75, kind: i & 1 ? 'heart' : 'star', c: i & 1 ? 0 : [0, 2, 3, 4][(i >> 1) & 3], life: 0.65, size: 0.95, rot: a, drag: 3 });
      }
    },
    onDeath(game, p) {
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'pow', life: 0.8, size: 2.0, rot: 0, seed: 0.5, drag: 0 });
      for (let i = 0; i < 6; i++) game.addParticle({ x: p.x + (Math.random() - 0.5) * 14, y: p.y - Math.random() * 10, z: 0, vy: -10, kind: 'puff', life: 1.0, size: 1.4 + Math.random() * 0.6, seed: Math.random(), drag: 2 });
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * TAU, s = 50 + Math.random() * 70;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 60, grav: 220, kind: 'crumb', c: [1, 2, 0, 7][i % 4], life: 1.0, size: 1 + Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 18, drag: 1.2 });
      }
    },
  });
})();
