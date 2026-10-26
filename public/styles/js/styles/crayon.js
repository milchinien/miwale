/* Crayon Kids – a child's wax-crayon drawing brought to life.
   Bright, toothy white drawing paper; everything is drawn with waxy crayon strokes whose colour skips on the paper
   tooth. Every coloured shape is built up in layers like real wax: a light-pressure wash, a zigzag scribble fill that is
   printed a little off its outline (colouring that misses the lines), a cooler "shade crayon" hatched along the lower
   contour (light from above), a light-crayon gloss on top and a tapered, overshooting black outline. Lines "boil" between
   three redrawn variants on twos, with a per-actor phase, so a crowd never flickers in lock-step. The world is composed
   like a child's picture: grassy hills with a zigzag grass fringe and shaded lower edge, ponds with reeds at their
   edges, villages along a dirt-road network, striped crop fields with scarecrows below the roads, long blue streams
   crossed on plank bridges, orchards and flower beds – and lots of calm white paper. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;

  /* ===================================================================================== palette */
  const PAPER = [251, 248, 239];
  const cPaper = 'rgb(251,248,239)';
  const INK = [43, 42, 48];          // black crayon (outlines, faces)
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
  const WHITE = [255, 254, 250];
  // shade crayons: the cooler partner every colour is shaded with (hue-shifted, never just "darker")
  const PINE = [22, 104, 86];        // shades the greens
  const CRIMSON = [176, 28, 74];     // shades red
  const INDIGO = [58, 48, 150];      // shades blue + purple
  const SEPIA = [104, 56, 44];       // shades brown
  const SLATE = [96, 98, 132];       // shades grey, sketch lines, shadows
  const SALMON = [238, 128, 112];    // shades skin
  const MAGENTA = [206, 62, 148];    // shades pink
  const SHADE = new Map([[GREEN, PINE], [LGREEN, GREEN], [DGREEN, PINE], [RED, CRIMSON], [ORANGE, RED], [YELLOW, ORANGE], [BLUE, INDIGO],
    [SKY, BLUE], [PALE, BLUE], [PURPLE, INDIGO], [DPURPLE, INDIGO], [PINK, MAGENTA], [PEACH, SALMON], [BROWN, SEPIA], [TAN, BROWN],
    [GREY, SLATE], [WHITE, PALE], [CRIMSON, INDIGO], [SALMON, CRIMSON]]);
  const LIGHT = new Map([[GREEN, LGREEN], [LGREEN, YELLOW], [DGREEN, GREEN], [RED, ORANGE], [ORANGE, YELLOW], [YELLOW, WHITE], [BLUE, SKY],
    [SKY, WHITE], [PALE, WHITE], [PURPLE, PINK], [DPURPLE, PURPLE], [PINK, WHITE], [PEACH, WHITE], [BROWN, TAN], [TAN, YELLOW], [GREY, WHITE]]);
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const shadeOf = (c) => SHADE.get(c) || mixc(c, INDIGO, 0.42);
  const lightOf = (c) => LIGHT.get(c) || mixc(c, WHITE, 0.55);
  const R = (a, b, rng) => a + (b - a) * rng.next();
  const J = (s, rng) => (rng.next() - 0.5) * 2 * s;

  let K = 4; // sprite px per world unit
  let SKETCH = false; // bake mode: only light construction lines (used for the "being drawn" spawn)
  const MIS = [0.7, 0.5]; // per-sprite misregistration of fills against their outline

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
  function bbox(pts) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    return [x0, y0, x1, y1];
  }
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
  /** Two-bone limb: elbow/knee position for a joint chain root -> end, bending toward the preferred side. */
  function ik(a, b, L1, L2, pref) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    let d = Math.hypot(dx, dy) || 1e-3;
    const ux = dx / d, uy = dy / d;
    d = Math.min(d, L1 + L2 - 0.05);
    const p = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - p * p));
    let px = -uy, py = ux;
    if (px * pref[0] + py * pref[1] < 0) { px = -px; py = -py; }
    return [a[0] + ux * p + px * h, a[1] + uy * p + py * h];
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
  /**
   * Wax crayon line: pressure runs that taper at both ends (the crayon lands, presses, lifts off) + a lighter second
   * pass slightly offset. Closed loops overshoot their start like a real hand.
   */
  function wax(ctx, pts, o) {
    const rng = o.rng;
    let w = o.w || 1, c = o.c || INK, a = o.a === undefined ? 1 : o.a, dbl = o.dbl;
    if (SKETCH) { c = SLATE; a *= 0.6; w *= 0.55; dbl = false; }
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
    const N = P.length - 1, tp = o.taper === false ? 0 : 0.45;
    let i = 0;
    while (i < N) {
      const e = Math.min(N, i + 4 + ((rng.next() * 6) | 0));
      ctx.beginPath();
      ctx.moveTo(P[i][0], P[i][1]);
      for (let k = i + 1; k <= e; k++) ctx.lineTo(P[k][0], P[k][1]);
      const u = (i + e) * 0.5 / N, f = 1 - tp * (1 - Math.min(1, Math.sin(Math.PI * u) * 2.2));
      ctx.lineWidth = w * f * R(0.86, 1.08, rng);
      ctx.strokeStyle = rgba(c, a * R(0.8, 1, rng));
      ctx.stroke();
      i = e;
    }
    if (dbl !== false && P.length > 2) {
      const ox = J(w * 0.32, rng), oy = J(w * 0.32, rng);
      ctx.beginPath();
      ctx.moveTo(P[0][0] + ox, P[0][1] + oy);
      for (let k = 1; k < P.length; k++) ctx.lineTo(P[k][0] + ox, P[k][1] + oy);
      ctx.lineWidth = w * 0.55;
      ctx.strokeStyle = rgba(c, a * 0.5);
      ctx.stroke();
    }
  }
  /** Extent [t0, t1] (along d) of the polygon on the scan line {p·n = off}, or null. Shared result array – copy it. */
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
  /** Vertical extent [top, bottom] of the polygon at column x. */
  function vspan(pts, x) { const iv = span(pts, 0, 1, 1, 0, x); return iv ? [iv[0], iv[1]] : null; }
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
  /**
   * Zigzag scribble fill: back-and-forth sweeps across the shape whose ends overshoot the outline (or stop short) at
   * random – colouring that goes outside the lines and leaves little white gaps. `cell` colours big areas in short
   * patches, each at its own angle; with `seedCell` every patch has its own random stream (chunk-independent), and `box`
   * skips patches outside a rectangle.
   */
  function scribble(ctx, pts, o) {
    if (SKETCH) return;
    const rng = o.rng, ang = o.ang === undefined ? -0.55 : o.ang, sp = o.sp || 1, w = o.w || sp * 1.05;
    const c = o.c, a = o.a === undefined ? 0.85 : o.a, over = o.over === undefined ? 0.5 : o.over;
    const bt = o.batch || new Batch();
    if (o.cell) {
      const b = bbox(pts), box = o.box;
      const L = o.cell, st = L * 0.78;
      const ny = Math.ceil((b[3] - b[1] + L * 0.4) / st), nx = Math.ceil((b[2] - b[0] + L * 0.4) / st) + 1;
      for (let iy = 0; iy <= ny; iy++) {
        const gy = b[1] - L * 0.2 + iy * st;
        if (box && (gy + L < box[1] || gy - L > box[3])) continue;
        for (let ix = 0; ix <= nx; ix++) {
          const gx = b[0] - L * 0.2 + ix * st + (iy & 1) * st * 0.5;
          if (box && (gx + L < box[0] || gx - L > box[2])) continue;
          const r = o.seedCell !== undefined ? U.rng(U.hashInt(ix, iy, o.seedCell)) : rng;
          const cx = gx + J(L * 0.14, r), cy = gy + J(L * 0.14, r), h = (L / 2) * R(0.85, 1.15, r);
          const sq = [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]];
          const zig = zigPts(pts, sq, ang + J(o.angJ === undefined ? 0.4 : o.angJ, r), sp, over, r);
          drawZig(bt, zig, c, a, w, sp, o.bow, r);
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
  /**
   * Shade crayon: the cooler partner colour hatched up and down in a band that follows the lower contour of the shape
   * (light comes from above). Thicker in the middle, thinning out to the sides – a crescent, like a child shading a ball.
   */
  function shadeBand(ctx, pts, o) {
    if (SKETCH) return;
    const rng = o.rng, b = bbox(pts), H = b[3] - b[1], W = b[2] - b[0];
    if (H < 1.2 || W < 1.2) return;
    const thick = H * (o.h === undefined ? 0.34 : o.h), sp = o.sp || 0.9, w = o.w || sp * 1.05;
    const cx = (b[0] + b[2]) / 2, hw = W / 2, st = sp * 0.82, over = o.over === undefined ? 0.4 : o.over;
    const zig = [];
    let side = 0;
    for (let x = b[0] + st * 0.4; x < b[2] - st * 0.2; x += st * R(0.8, 1.2, rng)) {
      const iv = vspan(pts, x);
      if (!iv) continue;
      const q = (x - cx) / hw;
      const th = Math.min(iv[1] - iv[0], thick * (0.5 + 0.5 * (1 - q * q))) * R(0.8, 1.12, rng);
      if (th < sp * 0.45) continue;
      zig.push(side ? [x, iv[1] + R(-0.3, over, rng)] : [x + sp * 0.5, iv[1] - th]);
      side ^= 1;
    }
    const bt = o.batch || new Batch();
    drawZig(bt, zig, o.c, o.a === undefined ? 0.6 : o.a, w, sp, 0.3, rng);
    if (!o.batch) bt.flush(ctx);
  }
  /** Light crayon gloss: one stroke following the top contour, slightly inside – the lit side of the form. */
  function gloss(ctx, pts, o) {
    if (SKETCH) return;
    const b = bbox(pts), W = b[2] - b[0], H = b[3] - b[1];
    if (W < 3 || H < 3) return;
    const x0 = b[0] + W * 0.2, x1 = b[0] + W * (o.len || 0.52), arc = [];
    for (let i = 0; i <= 7; i++) {
      const x = x0 + ((x1 - x0) * i) / 7, iv = vspan(pts, x);
      if (iv) arc.push([x, iv[0] + Math.min(H * 0.17, 1.1 + H * 0.06)]);
    }
    if (arc.length > 2) wax(ctx, arc, { rng: o.rng, w: o.w || Math.min(1.15, 0.4 + W * 0.035), c: o.c || WHITE, a: o.a === undefined ? 0.75 : o.a, dbl: false, wob: 0.05, step: 0.5 });
  }
  function flat(ctx, pts, c, a) { if (SKETCH) return; ctx.beginPath(); poly(ctx, pts); ctx.fillStyle = rgba(c, a); ctx.fill(); }
  function dot(ctx, x, y, r, c, a) { if (SKETCH) return; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = rgba(c, a === undefined ? 1 : a); ctx.fill(); }
  /**
   * The standard "coloured-in shape", in wax layers: light wash, zigzag scribble (printed a little off the outline),
   * shade crayon along the lower contour, optional light gloss, wobbly tapered outline.
   */
  function shape(ctx, pts, fill, line, rng, o) {
    o = o || {};
    if (fill && !SKETCH) {
      const m = o.mis === undefined ? 0.35 : o.mis;
      const fp = m ? mv(pts, MIS[0] * m, MIS[1] * m) : pts;
      flat(ctx, fp, fill, o.base === undefined ? 0.4 : o.base);
      scribble(ctx, fp, { rng, c: fill, a: o.fa === undefined ? 0.85 : o.fa, sp: o.sp || 0.95, w: o.sw, ang: o.ang, over: o.over === undefined ? 0.6 : o.over });
      if (o.sh !== 0) shadeBand(ctx, fp, { rng, c: o.sc || shadeOf(fill), h: o.sh === undefined ? 0.34 : o.sh, sp: (o.sp || 0.95) * 0.85, a: o.sa === undefined ? 0.6 : o.sa });
      if (o.hi) gloss(ctx, fp, { rng, c: o.hc || lightOf(fill), a: o.ha, len: o.hl });
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
  let misN = 0;
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
    const ma = (misN++ * 2.39996) % TAU;
    MIS[0] = Math.cos(ma); MIS[1] = Math.sin(ma) * 0.7 + 0.25;
    SKETCH = !!opt.sketch;
    try { draw(a); } finally { SKETCH = false; }
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
    if (opt.flash) s.f = U.tint(out, 'rgb(255,251,232)', 0.78);
    if (opt.hurt) s.h = U.tint(A.c, 'rgb(226,54,44)', 0.6);
    return s;
  }
  function flipSpr(s) {
    const w = s.c.width;
    return { c: U.flipX(s.c), ax: w - s.ax, ay: s.ay, k: s.k, f: s.f ? U.flipX(s.f) : null, h: s.h ? U.flipX(s.h) : null };
  }

  /* ===================================================================================== characters (drawn facing right) */
  /* ---------- main character: a kid in a red cape with a big orange crayon ---------- */
  /** Pose table: every drawing of the kid is computed from a few numbers (body bob, lean, feet, hands, cape wave...). */
  function kidPose(mode, f) {
    const P = { mode, by: 0, hl: 0, lean: 0.4, br: 0, eyes: 'open', mouth: 'smile', brow: 0, tuft: -0.25, cray: 1.25 };
    if (mode === 'walk') {
      // 8 drawings: contact – down – passing – up, both sides. The head and the hair tuft lag the body, the arms
      // counter-swing the legs, the cape hem waves a quarter cycle late.
      const th = (TAU * f) / 8;
      const bob = (p) => 0.35 - 1.35 * (1 - Math.abs(Math.cos(p)));
      P.by = bob(th - 0.45); P.hl = bob(th - 1.2) - P.by; P.lean = 1.0;
      P.legs = [-1, 1].map((s) => { const t = th + (s > 0 ? 0 : Math.PI); return { s, fx: 3.7 * Math.cos(t) + 0.5, lift: 2.5 * Math.max(0, -Math.sin(t)) }; });
      const sw = Math.cos(th);
      P.hb = [-2.2 + 3.3 * sw, -9.4 - 0.8 * Math.abs(sw)];
      P.hf = [3.4 - 3.5 * sw, -9.2 - 0.9 * Math.abs(sw)];
      P.tuft = -0.25 + 0.5 * Math.sin(2 * th - 2.0);
      P.cray = 1.15 + 0.4 * sw;
      P.cape = capeWalk(th, 1.8);
    } else if (mode === 'idle') {
      // 4 drawings: neutral, breathe in, hold (crayon lifted), blink – played in a held sequence (IDLESEQ)
      P.br = [0, 0.55, 0.8, 0.2][f];
      P.by = -P.br * 0.35;
      P.legs = [{ s: -1, fx: -1.9, lift: 0 }, { s: 1, fx: 2.4, lift: 0 }];
      P.hb = [-5.6, -8.6 - P.br * 0.5];
      P.hf = f === 2 ? [6.4, -12.6] : [6.0, -9.0 - P.br * 0.6];
      P.cray = f === 2 ? -0.9 : 1.3;
      P.eyes = f === 3 ? 'blink' : 'open';
      P.tuft = -0.25 + [0, 0.2, 0.3, 0.05][f];
      P.cape = capeIdle([0, 0.5, 0.8, 0.3][f]);
    } else if (mode === 'dash') {
      // 2 drawings: leaning into the dash, back leg pushing off, crayon thrust forward, cape streaming
      P.by = -1.1; P.lean = 2.8; P.hl = 0.2;
      P.legs = [{ s: -1, fx: -5.6, lift: 1.6, back: true }, { s: 1, fx: 3.4, lift: 2.6 }];
      P.hb = [-6.6, -11.4];
      P.hf = [10.4, -15.4];
      P.cray = -0.12;
      P.eyes = 'open'; P.brow = 1; P.mouth = 'grin';
      P.tuft = -1.25 + f * 0.25;
      P.cape = capeDash(f);
    } else { // hurt: knocked back, arms flung up, eyes squeezed shut
      P.by = -1.6; P.lean = -2.0; P.hl = 0.6;
      P.legs = [{ s: -1, fx: -3.6, lift: 0 }, { s: 1, fx: 3.8, lift: 2.8 }];
      P.hb = [-6.6, -19.4];
      P.hf = [5.4, -20.6];
      P.cray = -1.9;
      P.eyes = 'squint'; P.mouth = 'open';
      P.tuft = 0.9;
      P.cape = [[-3.4, -15.6], [2.2, -15.9], [-0.8, -12.8], [-4.6, -10.4], [-9.8, -14.4], [-13.8, -19.6], [-9.4, -19.2], [-6.6, -17.8]];
    }
    return P;
  }
  function capeIdle(sway) {
    return [[-3.4, -15.6], [2.2, -15.9], [-0.6, -11], [-2.0, -3.6], [-5.2, -2.2 - sway * 0.4], [-8.4, -3.4 - sway * 0.2], [-11.8 - sway * 0.6, -2.6 + sway * 0.3], [-10.4 - sway * 0.4, -9.4], [-7, -14.6]];
  }
  function capeWalk(th, blow) {
    const wv = (i) => Math.sin(2 * th - 1.1 - i * 0.8);
    return [[-3.4, -15.6], [2.2, -15.9], [-0.6, -11.2], [-2.4 - blow * 0.3, -3.8 + wv(0) * 0.4], [-5.6 - blow * 0.6, -2.6 + wv(0.5) * 0.8],
      [-8.8 - blow * 0.9, -3.8 + wv(1) * 1.0], [-12.6 - blow * 1.2, -3.0 + wv(1.6) * 1.4], [-11.0 - blow * 0.8, -9.6 + wv(1.2) * 0.6], [-7.2 - blow * 0.3, -14.6]];
  }
  function capeDash(f) {
    const p = f ? Math.PI * 0.5 : 0, w = (i) => Math.sin(p + i * 1.3) * (0.4 + i * 0.25);
    return [[-3.2, -15.8], [2.2, -16], [-1, -12.6], [-6.4, -11.2 + w(0)], [-12.6, -9.8 + w(1)], [-17.8, -11.6 + w(2)], [-16, -14.2 + w(1.5) * 0.6], [-18.6, -16.8 + w(2.5)], [-10.2, -17.8 + w(1) * 0.5]];
  }
  /** A wax crayon lying along +x (tip at +x), centred on the origin. */
  function drawCrayon(ctx, rng, col) {
    const body = [[-8, -2.2], [3, -2.2], [3, 2.2], [-8, 2.2]];
    shape(ctx, body, col, null, rng, { ang: 1.2, sp: 0.8, base: 0.7, mis: 0, sh: 0.4 });
    const wrap = [[-5.6, -2.3], [1.2, -2.3], [1.2, 2.3], [-5.6, 2.3]];
    flat(ctx, wrap, mixc(col, [255, 255, 255], 0.45), 0.95);
    wax(ctx, [[-4.6, -1.2], [-3.4, 0], [-2.2, -1.2], [-1, 0], [0.2, -1.2]], { rng, w: 0.35, c: INK, a: 0.8, dbl: false, step: 0.3, wob: 0.03 });
    wax(ctx, [[-4.6, 1.2], [0.2, 1.2]], { rng, w: 0.35, c: INK, a: 0.6, dbl: false, step: 0.3, wob: 0.03 });
    const tip = [[3, -2.2], [7.2, -0.7], [8, 0], [7.2, 0.7], [3, 2.2]];
    shape(ctx, tip, col, null, rng, { ang: 0.3, sp: 0.7, base: 0.8, mis: 0, sh: 0 });
    flat(ctx, [[6.6, -0.9], [8, 0], [6.6, 0.9]], shadeOf(col), 1);
    wax(ctx, [[-8, -2.2], [7.2, -0.7], [8, 0], [7.2, 0.7], [-8, 2.2]], { rng, closed: true, w: 0.55, c: INK, dbl: false, step: 0.5, wob: 0.08 });
  }
  function drawKid(ctx, rng, P) {
    const by = P.by, ln = P.lean, hipY = -7.3 + by;
    // cape (behind everything), with a knot at the collar drawn later
    shape(ctx, spl(P.cape, 3, true), RED, INK, rng, { ang: -0.95, sp: 0.95, lw: 0.9, sh: 0.3, sa: 0.65 });
    // legs: far one first, two-bone stick legs with knees that bend forward, red shoes that tip on the lift
    const legs = P.legs.slice().sort((a, b) => a.s - b.s);
    for (const L of legs) {
      const hip = [L.s * 1.4 + ln * 0.15, hipY], foot = [L.fx, -L.lift];
      const knee = L.back ? [(hip[0] + foot[0]) / 2 - 0.4, (hip[1] + foot[1]) / 2 + 0.6] : ik(hip, foot, 4.4, 4.3, [1, 0]);
      wax(ctx, [hip, knee, foot], { rng, w: 1.3, c: INK, dbl: false, taper: false, wob: 0.12 });
      const shoe = ell(foot[0] + 1.0, foot[1] - 0.45, 2.15, 1.25, 16, L.lift > 0.5 ? 0.38 : 0);
      shape(ctx, shoe, L.s < 0 ? mixc(RED, CRIMSON, 0.35) : RED, INK, rng, { sp: 0.55, lw: 0.6, sh: 0.45, mis: 0.15, base: 0.8 });
    }
    // back arm (behind the shirt)
    const shB = [-2.6 + ln * 0.35, -14.5 + by], shF = [2.7 + ln * 0.35, -14.5 + by];
    const hb = [P.hb[0], P.hb[1] + by], hf = [P.hf[0], P.hf[1] + by];
    wax(ctx, [shB, ik(shB, hb, 3, 3, [-0.6, 1]), hb], { rng, w: 1.15, c: INK, dbl: false, taper: false });
    dot(ctx, hb[0], hb[1], 1.2, mixc(PEACH, SALMON, 0.3), 1);
    wax(ctx, ell(hb[0], hb[1], 1.2, 1.2, 10), { rng, closed: true, w: 0.45, c: INK, dbl: false, step: 0.4, wob: 0.06 });
    // shirt: blue tunic with a yellow star; breathing widens the chest a little
    const tw = 3.3 + P.br * 0.15, ty = -15.9 + by - P.br * 0.35;
    const shirt = [[-tw + ln * 0.4, ty], [tw + ln * 0.4, ty], [4.7 + ln * 0.1, -6.5 + by], [-4.6 + ln * 0.1, -6.5 + by]];
    shape(ctx, spl(shirt, 3, true), BLUE, INK, rng, { ang: -0.5, sp: 0.85, lw: 0.9, sh: 0.3, hi: true, hc: SKY, ha: 0.8 });
    const st = starPts(0.6 + ln * 0.3, -11.2 + by, 2.4, 1.05, 5, 0.1);
    flat(ctx, st, YELLOW, 1);
    shadeBand(ctx, st, { rng, c: ORANGE, h: 0.35, sp: 0.5, w: 0.5, a: 0.8 });
    wax(ctx, st, { rng, closed: true, w: 0.45, c: ORANGE, dbl: false, step: 0.4, wob: 0.08 });
    // cape knot at the collar
    const kx = 2.0 + ln * 0.4, ky = -15.6 + by;
    shape(ctx, [[kx - 1.6, ky - 1.2], [kx + 1.6, ky - 0.2], [kx - 0.2, ky + 2.4]], RED, INK, rng, { sp: 0.5, lw: 0.5, sh: 0, mis: 0.1 });
    // front arm with the big crayon
    const elF = ik(shF, hf, 3, 3, P.mode === 'hurt' ? [1, 0] : [-0.6, 1]);
    ctx.save();
    ctx.translate(hf[0], hf[1]);
    ctx.rotate(P.cray);
    ctx.scale(0.5, 0.5);
    ctx.translate(-1, 0);
    drawCrayon(ctx, rng, ORANGE);
    ctx.restore();
    wax(ctx, [shF, elF, hf], { rng, w: 1.15, c: INK, dbl: false, taper: false });
    dot(ctx, hf[0], hf[1], 1.35, PEACH, 1);
    wax(ctx, ell(hf[0], hf[1], 1.35, 1.35, 10), { rng, closed: true, w: 0.45, c: INK, dbl: false, step: 0.4, wob: 0.06 });
    // head: big round head (naive proportions), ear at the back, the head bobs a beat after the body
    const hx = 0.9 + ln * 0.9, hy = -22.7 + by + P.hl;
    const ear = ell(hx - 5.9, hy + 1.2, 1.5, 1.8, 12);
    shape(ctx, ear, PEACH, INK, rng, { sp: 0.5, lw: 0.5, sh: 0, mis: 0 });
    const head = blob(hx, hy, 7.1, 6.8, rng, 0.025, 30);
    shape(ctx, head, PEACH, null, rng, { ang: -0.6, sp: 0.85, base: 0.6, fa: 0.75, sh: 0.2, sa: 0.32, mis: 0.2 });
    wax(ctx, head, { rng, closed: true, w: 0.95, c: INK });
    // hair: messy brown spikes swept back, a zigzag fringe and a springy cowlick on top
    const hair = [];
    const nsp = 8, sweep = P.mode === 'dash' ? -0.9 : 0;
    for (let i = 0; i <= nsp * 2; i++) {
      const a = Math.PI - 0.3 + (i / (nsp * 2)) * (Math.PI - 0.15);
      const r = i & 1 ? 8.5 + J(0.7, rng) + (i === 7 || i === 9 ? 0.9 : 0) : 6.9;
      const sx = i & 1 ? sweep * (1 - i / (nsp * 2)) : 0;
      hair.push([hx + Math.cos(a) * r + sx, hy - 0.6 + Math.sin(a) * r * 0.95]);
    }
    hair.push([hx + 5.6, hy - 2.6], [hx + 4.2, hy - 4.6], [hx + 2.8, hy - 3.2], [hx + 1.2, hy - 4.8], [hx - 0.6, hy - 3.4], [hx - 3.6, hy - 3], [hx - 6.2, hy + 0.6]);
    shape(ctx, hair, BROWN, INK, rng, { ang: 0.9, sp: 0.75, lw: 0.75, over: 0.4, base: 0.55, sh: 0.28, hi: true, ha: 0.7 });
    const tb = [hx - 0.4, hy - 8.0], ta = P.tuft - Math.PI / 2;
    const tuft = [tb, [tb[0] + Math.cos(ta) * 2.4, tb[1] + Math.sin(ta) * 2.4], [tb[0] + Math.cos(ta + 0.9) * 3.6, tb[1] + Math.sin(ta + 0.9) * 3.4], [tb[0] + Math.cos(ta + 1.7) * 3.2, tb[1] + Math.sin(ta + 1.7) * 2.8]];
    wax(ctx, spl(tuft, 4), { rng, w: 1.0, c: SEPIA, dbl: false, wob: 0.06, step: 0.4 });
    // face (toward the facing side): the eyes are the focal point
    const fx = hx + 1.7, ey = hy + 0.4;
    for (const [ex, k] of [[fx - 1.3, -1], [fx + 2.4, 1]]) {
      if (P.eyes === 'blink') wax(ctx, [[ex - 0.95, ey + 0.1], [ex, ey + 0.75], [ex + 0.95, ey + 0.1]], { rng, w: 0.55, c: INK, dbl: false, step: 0.3, wob: 0.03 });
      else if (P.eyes === 'squint') wax(ctx, [[ex + k * 0.9, ey - 0.9], [ex - k * 0.6, ey], [ex + k * 0.9, ey + 0.9]], { rng, w: 0.6, c: INK, dbl: false, step: 0.3, wob: 0.03 });
      else {
        flat(ctx, ell(ex, ey, 0.8, 1.15, 10), INK, 1);
        dot(ctx, ex + 0.25, ey - 0.45, 0.28, WHITE, 0.95);
      }
      if (P.brow) wax(ctx, [[ex - 1.0, ey - 2.1 - k * 0.2], [ex + 1.0, ey - 1.7 + k * 0.2]], { rng, w: 0.55, c: SEPIA, dbl: false, step: 0.3, wob: 0.03 });
    }
    if (P.mouth === 'smile') {
      const sm = [];
      for (let i = 0; i <= 8; i++) { const a = 0.35 + (i / 8) * 2.3; sm.push([fx + 0.6 + Math.cos(a) * 2.5, hy + 2 + Math.sin(a) * 1.8]); }
      wax(ctx, sm, { rng, w: 0.6, c: INK, dbl: false, step: 0.4, wob: 0.06 });
    } else {
      const m = P.mouth === 'grin' ? ell(fx + 0.9, hy + 3.3, 2.4, 1.3, 14).filter((p) => p[1] >= hy + 3.1) : ell(fx + 0.8, hy + 3.4, 1.2, 1.5, 12);
      if (P.mouth === 'grin') m.push([fx - 1.5, hy + 3.1], [fx + 3.3, hy + 3.1]);
      flat(ctx, m, [120, 30, 50], 0.95);
      wax(ctx, m, { rng, closed: true, w: 0.45, c: INK, dbl: false, step: 0.35, wob: 0.04 });
    }
    scribble(ctx, ell(fx + 4.6, hy + 2.6, 1.15, 0.85, 10), { rng, c: PINK, a: 0.9, sp: 0.5, w: 0.6, over: 0.2 });
    scribble(ctx, ell(fx - 3.6, hy + 2.6, 1.0, 0.8, 10), { rng, c: PINK, a: 0.8, sp: 0.5, w: 0.6, over: 0.2 });
  }

  /* ---------- small creature: a purple scribble monster with yellow horns ---------- */
  function drawScribbler(ctx, rng, f) {
    // 6-drawing waddle: squash on contact, stretch on the passing pose, arms and googly pupils lag behind
    const th = (TAU * f) / 6, c2 = Math.cos(2 * th);
    const by = -1.6 * (1 - Math.abs(Math.cos(th)));
    const sx = 1 + 0.07 * c2, sy = 1 - 0.08 * c2;
    for (const s of [-1, 1]) {
      const t = th + (s > 0 ? 0 : Math.PI);
      const foot = [s * 2.4 + 2.3 * Math.cos(t), -1.9 * Math.max(0, -Math.sin(t))];
      const hip = [s * 2.6, -4.6 + by];
      wax(ctx, [hip, [(hip[0] + foot[0]) / 2 + 0.5, (hip[1] + foot[1]) / 2], foot], { rng, w: 1.1, c: INK, dbl: false, taper: false });
      for (let k = -1; k <= 1; k++) wax(ctx, [[foot[0] + 0.2, foot[1]], [foot[0] + 1.3 + k * 0.2, foot[1] - 0.3 + k * 0.75]], { rng, w: 0.6, c: INK, dbl: false, wob: 0.03 });
    }
    const cx = 0, cy = -11.2 + by, r = 8;
    // curly tail at the back, wagging late
    const tw = Math.sin(th - 1.6);
    const tail = [];
    for (let i = 0; i < 14; i++) { const a = -0.5 + i * 0.5 + tw * 0.25, rr = 2.6 - i * 0.14; tail.push([cx - r - 1.2 + Math.cos(a) * rr * 0.8 - (13 - i) * 0.12, cy + 3 + Math.sin(a) * rr]); }
    wax(ctx, tail, { rng, w: 0.85, c: DPURPLE, dbl: false, step: 0.4, wob: 0.06 });
    // arms up – "rawr" – lagging the waddle
    const aw = Math.sin(th - 0.9);
    const hl = [-9.6 - aw * 0.4, cy - 4.8 + aw * 1.1], hr = [10.2 + aw * 0.4, cy - 4.2 - aw * 1.1];
    wax(ctx, [[-6.4, cy + 0.4], [-9.1, cy - 2.2 + aw * 0.6], hl], { rng, w: 1.05, c: INK, dbl: false });
    wax(ctx, [[6.6, cy + 0.8], [9.6, cy - 1.8 - aw * 0.6], hr], { rng, w: 1.05, c: INK, dbl: false });
    for (const [hx, hy] of [hl, hr]) for (let k = -1; k <= 1; k++) wax(ctx, [[hx, hy], [hx + k * 1.15, hy - 1.5]], { rng, w: 0.6, c: INK, dbl: false });
    // horns
    for (const [x, s] of [[-3.6, -1], [2.8, 1]]) {
      const hn = [[x - 1.5, cy - r * sy + 1.4], [x + s * 0.8, cy - r * sy - 3.4], [x + 1.6, cy - r * sy + 1.0]];
      shape(ctx, hn, YELLOW, INK, rng, { sp: 0.55, lw: 0.6, base: 0.8, sh: 0.5, mis: 0.1 });
    }
    // pear-shaped body: a little wider at the bottom
    const body = blob(cx, cy, r * sx, r * 0.96 * sy, rng, 0.06, 30).map((p) => (p[1] > cy ? [cx + (p[0] - cx) * 1.06, p[1]] : p));
    shape(ctx, body, PURPLE, null, rng, { ang: -0.7, sp: 0.9, sw: 1.0, over: 1.1, base: 0.5, fa: 0.9, sh: 0.36, sa: 0.7, hi: true, hc: PINK, ha: 0.8 });
    // the tangle: loopy scribble lines that make it a "scribble monster"
    const tang = [];
    for (let i = 0; i < 14; i++) { const a = rng.next() * TAU, rr = r * Math.sqrt(rng.next()) * 0.85; tang.push([cx + Math.cos(a) * rr, cy + 1 + Math.sin(a) * rr * 0.8]); }
    wax(ctx, spl(tang, 5), { rng, w: 0.5, c: DPURPLE, a: 0.75, dbl: false, wob: 0.1 });
    // fuzzy messy outline (a firm loop + a loose one)
    wax(ctx, body, { rng, closed: true, w: 0.95, c: INK, wob: 0.3 });
    wax(ctx, blob(cx, cy, r * sx + 0.9, r * sy + 0.5, rng, 0.1, 22), { rng, closed: true, w: 0.45, c: DPURPLE, a: 0.7, dbl: false, wob: 0.5 });
    // googly eyes – pupils swing a beat late
    const pl = [Math.cos(th - 1.3) * 0.45, Math.abs(Math.sin(th - 1.3)) * 0.5];
    for (const [ex, ey, er] of [[1.2, cy - 2.6, 2.5], [5.4, cy - 2.0, 1.95]]) {
      const e = ell(ex, ey, er, er, 16);
      flat(ctx, e, WHITE, 1);
      wax(ctx, e, { rng, closed: true, w: 0.55, c: INK, dbl: false, step: 0.45, wob: 0.06 });
      dot(ctx, ex + er * 0.3 + pl[0], ey + er * 0.1 + pl[1], er * 0.46, INK, 1);
    }
    // jagged mouth with teeth
    const m = [[0, cy + 2.4], [6.8, cy + 2.0], [6, cy + 4.4], [3.4, cy + 5.6], [0.8, cy + 4.6]];
    flat(ctx, m, [70, 20, 40], 0.95);
    for (let k = 0; k < 3; k++) { const tx = 1 + k * 2; flat(ctx, [[tx, cy + 2.3], [tx + 1.6, cy + 2.2], [tx + 0.8, cy + 3.8]], WHITE, 1); }
    wax(ctx, m, { rng, closed: true, w: 0.55, c: INK, dbl: false, step: 0.45, wob: 0.08 });
  }

  /* ---------- fast creature: a sheet ghost with a long zigzag tail ---------- */
  function drawGhost(ctx, rng, f) {
    // 6 drawings: a wave travels down the tail (each point a little later than the one before), mittens alternate
    const th = (TAU * f) / 6, wv = (i) => Math.sin(th - i * 0.75);
    const st = Math.sin(th) * 0.4;
    const pts = [];
    for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI; pts.push([1 + Math.cos(a) * 6.5, -14.8 + st * 0.5 + Math.sin(a) * (6.7 + st)]); }
    pts.push([7.3, -11], [6.6, -7.6], [4.6, -5.4 + wv(0) * 0.5], [2.8, -3.6 + wv(0.5) * 0.45], [1.3, -5.6], [-0.6, -3 + wv(1) * 0.6], [-2.5, -5.2],
      [-4.6, -2.5 + wv(1.6) * 0.9], [-6.4, -4.6 + wv(2) * 0.9], [-9.2, -1.8 + wv(2.6) * 1.4], [-13.2, -0.4 + wv(3.3) * 2.0], [-10.2, -5.2 + wv(2.9) * 1.2], [-7.4, -8.4 + wv(2) * 0.5], [-5.6, -11.4]);
    shape(ctx, pts, PALE, INK, rng, { ang: 0.6, sp: 0.95, lw: 0.95, over: 0.5, sh: 0.4, sc: BLUE, sa: 0.5, hi: true, hc: WHITE, ha: 0.95 });
    // little mitten arms reaching forward
    for (const [ax, ay, rot, k] of [[8.6, -12 + wv(0.3) * 0.8, -0.35, 1], [7.6, -8.8 - wv(0.3) * 0.7, 0.25, 0.85]]) {
      const arm = ell(ax, ay, 2.6 * k, 1.4 * k, 14, rot);
      shape(ctx, arm, PALE, INK, rng, { sp: 0.5, lw: 0.75, sh: 0.45, sc: BLUE, sa: 0.5, mis: 0.1, base: 0.9 });
    }
    // eyes + "oo" mouth
    for (const ex of [2.1, 5.1]) { flat(ctx, ell(ex, -15.6, 0.98, 1.65, 12), INK, 1); dot(ctx, ex + 0.3, -16.2, 0.32, WHITE, 0.95); }
    const m = ell(3.7, -11.6 + wv(0) * 0.15, 1.05, 1.35 + wv(0) * 0.25, 12);
    flat(ctx, m, [60, 40, 70], 0.95);
    wax(ctx, m, { rng, closed: true, w: 0.45, c: INK, dbl: false, step: 0.4, wob: 0.05 });
    scribble(ctx, ell(6.7, -13.2, 0.9, 0.6, 8), { rng, c: PINK, a: 0.75, sp: 0.45, w: 0.55, over: 0.1 });
  }

  /* ---------- large creature: a big scribble dragon ---------- */
  function drawDragon(ctx, rng, f) {
    // 6 heavy drawings: the body dips on every stomp, the head, wing and tail follow late (overlapping action)
    const th = (TAU * f) / 6;
    const bob = (p) => 1.0 - 2.4 * (1 - Math.abs(Math.cos(p)));
    const by = bob(th), hb = bob(th - 0.8) - by;
    const tl = Math.sin(th - 1.5) * 2.4, fl = Math.sin(th - 0.9) * 2.8;
    const jaw = f === 2 || f === 3 ? 1.4 : 0;
    // tail with arrow tip
    const tail = spl([[-9, -21 + by], [-16, -19 + by + tl * 0.2], [-21.5, -14 + by * 0.5 + tl * 0.5], [-25.5, -9 - tl], [-22.5, -8.2 - tl * 0.9], [-18.5, -10.5 - tl * 0.4], [-13, -12.5], [-8, -12.5]], 3, true);
    shape(ctx, tail, GREEN, INK, rng, { ang: 0.7, sp: 1.1, lw: 1.1, sh: 0.42 });
    const tip = [[-24, -10.5 - tl], [-29.4, -7.4 - tl * 1.2], [-24.4, -5.2 - tl]];
    shape(ctx, tip, ORANGE, INK, rng, { sp: 0.8, lw: 0.8, sh: 0.4 });
    for (const [x, y, k] of [[-12, -21.4, 0.2], [-17, -18.8, 0.4], [-21, -15, 0.6]]) {
      const sp = [[x - 2.2, y + 0.9 + by + tl * k * 0.5], [x + 0.2, y - 3 + by + tl * k * 0.5], [x + 2, y + 0.4 + by + tl * k * 0.5]];
      shape(ctx, sp, YELLOW, INK, rng, { sp: 0.7, lw: 0.65, base: 0.6, sh: 0.45 });
    }
    // wing (behind the body)
    const wing = spl([[-5, -25 + by], [-11, -36 + by + fl], [-7.4, -35 + by + fl], [-4.4, -38.6 + by + fl], [-1.8, -34.2 + by + fl * 0.7], [1.6, -35.6 + by + fl * 0.6], [1.4, -27 + by]], 3, true);
    shape(ctx, wing, PURPLE, INK, rng, { ang: -1.0, sp: 0.95, lw: 0.95, sh: 0.3, hi: true, hc: PINK });
    wax(ctx, [[-4, -26.5 + by], [-7.4, -34.6 + by + fl]], { rng, w: 0.55, c: INK, dbl: false });
    wax(ctx, [[-1.6, -27 + by], [-2, -33.8 + by + fl * 0.7]], { rng, w: 0.55, c: INK, dbl: false });
    // legs: far one darker, stomping with a toe-off lift
    for (const s of [-1, 1]) {
      const t = th + (s > 0 ? 0 : Math.PI);
      const lift = 2.6 * Math.max(0, -Math.sin(t));
      const lx = s * 6.6 - 1 + 2.2 * Math.cos(t);
      const leg = [[lx - 3.4, -11 + by], [lx + 3.2, -11 + by], [lx + 3.6, -1.8 - lift], [lx + 5, -0.4 - lift], [lx - 3.6, -0.2 - lift]];
      shape(ctx, spl(leg, 2, true), s < 0 ? mixc(GREEN, PINE, 0.4) : GREEN, INK, rng, { ang: -1.2, sp: 1.0, lw: 1.0, sh: 0.32 });
      for (let k = 0; k < 3; k++) wax(ctx, [[lx + 1 + k * 1.5, -0.6 - lift], [lx + 1.6 + k * 1.5, 0.6 - lift]], { rng, w: 0.6, c: INK, dbl: false });
    }
    // body
    const body = blob(-1, -18 + by, 13.6, 10.6, rng, 0.03, 34);
    shape(ctx, body, GREEN, INK, rng, { ang: -0.6, sp: 1.05, lw: 1.25, sh: 0.3, sa: 0.7, hi: true, ha: 0.85 });
    // belly with plates
    const belly = blob(4.6, -15.2 + by, 6.8, 7.4, rng, 0.03, 22);
    shape(ctx, belly, YELLOW, null, rng, { ang: 0.2, sp: 0.85, base: 0.6, sh: 0.4 });
    for (let k = 0; k < 4; k++) {
      const y = -20 + k * 3 + by;
      wax(ctx, spl([[0.6 + k * 0.3, y], [4.6, y + 0.9], [9.6 - k * 0.6, y + 0.2]], 3), { rng, w: 0.55, c: ORANGE, dbl: false });
    }
    // back spikes
    for (const [x, y, s] of [[-9, -27.6, 3.4], [-3.8, -29.6, 3.8], [1.6, -29.4, 3.6]]) {
      const sp = [[x - s * 0.6, y + 1.6 + by], [x, y - s + by], [x + s * 0.6, y + 1.6 + by]];
      shape(ctx, sp, ORANGE, INK, rng, { sp: 0.7, lw: 0.7, base: 0.6, sh: 0.45 });
    }
    // neck + head (the head lags the body)
    const hy = by + hb;
    const neck = spl([[4.6, -25 + by], [9.4, -31 + hy], [13.4, -30.6 + hy], [12, -22 + by]], 3, true);
    shape(ctx, neck, GREEN, null, rng, { ang: -0.9, sp: 1.0, sh: 0 });
    wax(ctx, [[4.8, -25.4 + by], [9.2, -31.4 + hy]], { rng, w: 1.1, c: INK, dbl: false });
    wax(ctx, [[12.4, -22.4 + by], [13.6, -29.4 + hy]], { rng, w: 1.0, c: INK, dbl: false });
    for (const [x, y] of [[8, -32.8], [10.8, -36.6]]) {
      const hn = [[x - 1.6, y + 1.6 + hy], [x - 2.6, y - 3.6 + hy], [x + 1.2, y + 0.8 + hy]];
      shape(ctx, hn, YELLOW, INK, rng, { sp: 0.6, lw: 0.6, base: 0.7, sh: 0.4 });
    }
    const head = spl([[8.6, -33 + hy], [12, -38 + hy], [18.6, -38.4 + hy], [24.6, -35.4 + hy], [26, -31.8 + hy], [24, -28.4 + hy + jaw], [16, -27.6 + hy + jaw * 0.6], [10.4, -28.4 + hy]], 3, true);
    shape(ctx, head, GREEN, INK, rng, { ang: -0.4, sp: 1.0, lw: 1.15, sh: 0.3, hi: true });
    // mouth + teeth (opens wide on the roar drawings)
    if (jaw) {
      const mo = [[25.4, -31.2 + hy], [19.6, -30.4 + hy], [15.6, -30.6 + hy], [19.6, -29 + hy + jaw], [24.4, -29.2 + hy + jaw]];
      flat(ctx, mo, [120, 30, 50], 0.95);
      wax(ctx, mo, { rng, closed: true, w: 0.55, c: INK, dbl: false, step: 0.4, wob: 0.05 });
    } else wax(ctx, [[25.2, -31 + hy], [20, -30.2 + hy], [15.4, -30.8 + hy]], { rng, w: 0.65, c: INK, dbl: false });
    for (let k = 0; k < 3; k++) {
      const tx = 23.6 - k * 2.6, ty = -30.6 + hy + k * 0.15;
      const t = [[tx - 0.9, ty], [tx + 0.9, ty], [tx, ty + 1.9]];
      flat(ctx, t, WHITE, 1);
      wax(ctx, t, { rng, closed: true, w: 0.35, c: INK, dbl: false, step: 0.35, wob: 0.04 });
    }
    dot(ctx, 24.2, -34.6 + hy, 0.55, INK, 1);
    dot(ctx, 22.6, -35.4 + hy, 0.5, INK, 1);
    // eye + angry brow
    const e = ell(16.6, -34.4 + hy, 2.1, 2.1, 14);
    flat(ctx, e, WHITE, 1);
    wax(ctx, e, { rng, closed: true, w: 0.5, c: INK, dbl: false, step: 0.4, wob: 0.05 });
    dot(ctx, 17.4, -34.1 + hy, 1.0, INK, 1);
    dot(ctx, 17.7, -34.6 + hy, 0.3, WHITE, 1);
    wax(ctx, [[13.6, -38 + hy], [19.6, -36.4 + hy]], { rng, w: 1.1, c: INK, dbl: false });
    scribble(ctx, ell(20.6, -31.6 + hy, 1.3, 0.8, 10), { rng, c: PINK, a: 0.75, sp: 0.5, w: 0.6, over: 0.2 });
    // smoke curl from the nose
    if (f === 1 || f === 4) {
      const c = [];
      for (let i = 0; i < 22; i++) { const a = i * 0.55, rr = 0.4 + i * 0.12; c.push([27.6 + i * 0.12 + Math.cos(a) * rr, -38.2 + hy - i * 0.18 + Math.sin(a) * rr]); }
      wax(ctx, c, { rng, w: 0.55, c: GREY, a: 0.9, dbl: false, step: 0.4, wob: 0.05 });
    }
  }

  /* ===================================================================================== small objects */
  function drawBall(ctx, rng) {
    // a tight red scribble ball with a lighter top
    const b = blob(0, 0, 3.7, 3.5, rng, 0.08, 18);
    flat(ctx, b, RED, 0.6);
    const loop = [];
    for (let i = 0; i < 12; i++) { const a = rng.next() * TAU, rr = 3.2 * Math.sqrt(rng.next()); loop.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    wax(ctx, spl(loop, 4), { rng, w: 0.9, c: RED, dbl: false, wob: 0.08 });
    shadeBand(ctx, b, { rng, c: CRIMSON, h: 0.4, sp: 0.6, w: 0.7, a: 0.8 });
    gloss(ctx, b, { rng, c: ORANGE, a: 0.9, w: 0.8 });
    wax(ctx, b, { rng, closed: true, w: 0.7, c: mixc(RED, INK, 0.45), dbl: false, step: 0.5, wob: 0.15 });
  }
  function drawTrail(ctx, rng) {
    // a thick red crayon swoosh that tapers off behind the ball, with two grey speed ticks
    const sw = [];
    for (let i = 0; i <= 10; i++) sw.push([-4 - i * 1.3, Math.sin(i * 0.5) * 0.35]);
    wax(ctx, sw, { rng, w: 2.0, c: RED, a: 0.55, dbl: false, wob: 0.15, step: 0.6 });
    wax(ctx, sw.slice(0, 6), { rng, w: 1.0, c: ORANGE, a: 0.8, dbl: false, wob: 0.1, step: 0.5 });
    for (const k of [-1, 1]) wax(ctx, [[-6.5, k * 2.6], [-12.5 + Math.abs(k), k * 3.0]], { rng, w: 0.7, c: SLATE, a: 0.7, dbl: false, wob: 0.08 });
  }
  function drawGemSmall(ctx, rng) {
    const p = [[-2.8, -4.4], [2.8, -4.4], [4, -2.8], [0, 1.4], [-4, -2.8]];
    flat(ctx, p, SKY, 0.6);
    scribble(ctx, p, { rng, c: SKY, a: 0.9, sp: 0.7, w: 0.8, ang: 0.9, over: 0.5 });
    shadeBand(ctx, p, { rng, c: BLUE, h: 0.45, sp: 0.55, w: 0.6, a: 0.85 });
    wax(ctx, p, { rng, closed: true, w: 0.6, c: BLUE, dbl: false, step: 0.45, wob: 0.08 });
    wax(ctx, [[-4, -2.8], [4, -2.8]], { rng, w: 0.4, c: BLUE, dbl: false, wob: 0.05 });
    wax(ctx, [[-1.2, -4.2], [0, 1.2], [1.2, -4.2]], { rng, w: 0.35, c: BLUE, a: 0.8, dbl: false, wob: 0.05 });
    dot(ctx, -1.6, -3.4, 0.6, WHITE, 0.95);
  }
  function drawGemBig(ctx, rng) {
    const st = starPts(0, -5, 7.2, 3.3, 5, 0);
    flat(ctx, st, YELLOW, 0.75);
    scribble(ctx, st, { rng, c: YELLOW, a: 0.95, sp: 0.85, w: 0.95, ang: -0.6, over: 0.8 });
    shadeBand(ctx, st, { rng, c: ORANGE, h: 0.32, sp: 0.7, w: 0.8, a: 0.75 });
    wax(ctx, st, { rng, closed: true, w: 0.8, c: ORANGE, step: 0.5, wob: 0.12 });
    dot(ctx, -1.5, -5.6, 0.55, INK, 1);
    dot(ctx, 1.5, -5.6, 0.55, INK, 1);
    const sm = [];
    for (let i = 0; i <= 6; i++) { const a = 0.4 + (i / 6) * 2.34; sm.push([Math.cos(a) * 1.6, -4.4 + Math.sin(a) * 1.2]); }
    wax(ctx, sm, { rng, w: 0.4, c: INK, dbl: false, step: 0.3, wob: 0.03 });
    scribble(ctx, ell(-3, -3.8, 0.8, 0.55, 8), { rng, c: PINK, a: 0.8, sp: 0.4, w: 0.5, over: 0.1 });
    scribble(ctx, ell(3, -3.8, 0.8, 0.55, 8), { rng, c: PINK, a: 0.8, sp: 0.4, w: 0.5, over: 0.1 });
  }
  /** Contact shadow: a quick sideways slate scribble under the figure. */
  function shadowSpr(rx, ry, seed) {
    const rng = U.rng(seed);
    return mk(-rx - 1, -ry - 1, rx + 1, ry + 1, (c) => {
      const e = blob(0, 0, rx, ry, rng, 0.05, 22);
      flat(c, e, SLATE, 0.07);
      scribble(c, e, { rng, c: SLATE, a: 0.28, sp: 0.95, w: 1.0, ang: -0.12, over: 0.7 });
      scribble(c, blob(0, ry * 0.15, rx * 0.6, ry * 0.55, rng, 0.05, 16), { rng, c: SLATE, a: 0.22, sp: 0.9, w: 0.9, ang: 0.3, over: 0.4 });
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
    // v0 round apple tree, v1 tall poplar with sun-dapples, v2 wide blossom tree – three different silhouettes
    const th = v === 1 ? -28 : -22;
    const trunk = [[-2.6, 0.5], [2.6, 0.5], [2.1, th], [-2.1, th]];
    shape(ctx, trunk, BROWN, SEPIA, rng, { ang: -1.45, sp: 0.9, lw: 0.9, sh: 0, mis: 0.2 });
    // trunk shade: the crown's shadow falls on the top of the trunk
    scribble(ctx, [[-2.2, th + 1], [2.2, th + 1], [2.3, th + 6], [-2.3, th + 6]], { rng, c: SEPIA, a: 0.7, sp: 0.7, w: 0.8, ang: 0.3, over: 0.1 });
    wax(ctx, [[0.6, th + 5], [4.6, th + 0.4]], { rng, w: 1.0, c: SEPIA, dbl: false });
    const col = v === 1 ? LGREEN : GREEN;
    const crown = v === 1 ? puffPts(0, -38, 9.6, 16.5, 6, rng, 54) : v === 2 ? puffPts(0, -32, 15.5, 11.5, 8, rng, 60) : puffPts(0, -33, 14.2, 12.6, 7, rng, 54);
    shape(ctx, crown, col, DGREEN, rng, { ang: -0.6, sp: 1.15, lw: 1.15, over: 1.3, sh: 0.36, sa: 0.62, sc: v === 1 ? GREEN : PINE });
    const hb = bbox(crown);
    scribble(ctx, blob((hb[0] + hb[2]) / 2 - 3, hb[1] + (hb[3] - hb[1]) * 0.32, (hb[2] - hb[0]) * 0.25, (hb[3] - hb[1]) * 0.2, rng, 0.1, 18),
      { rng, c: v === 1 ? YELLOW : LGREEN, a: 0.55, sp: 1.1, w: 1.0, ang: 0.6, over: 0.6 });
    if (v === 0) for (const [x, y] of [[-6, -29], [5, -36], [7.5, -28], [-1, -38], [1.5, -27]]) {
      dot(ctx, x, y, 1.6, RED, 1);
      dot(ctx, x - 0.5, y - 0.5, 0.45, WHITE, 0.8);
      wax(ctx, ell(x, y, 1.6, 1.6, 10), { rng, closed: true, w: 0.4, c: CRIMSON, dbl: false, step: 0.4, wob: 0.05 });
    }
    if (v === 1) for (const [x, y] of [[-3, -44], [3.5, -36], [-4, -32], [2, -48]]) wax(ctx, [[x - 1.2, y], [x + 1.2, y - 0.6]], { rng, w: 0.9, c: ORANGE, a: 0.8, dbl: false });
    if (v === 2) for (const [x, y] of [[-9, -31], [4, -37], [10, -30], [-2, -26], [-5, -39], [2, -31], [-12, -35]]) {
      for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; dot(ctx, x + Math.cos(a) * 1.1, y + Math.sin(a) * 1.1, 0.75, PINK, 1); }
      dot(ctx, x, y, 0.5, YELLOW, 1);
    }
    tufts(ctx, rng, -6, 6, 3, GREEN);
  }
  function artPine(ctx, rng, v) {
    shape(ctx, [[-2, 0.5], [2, 0.5], [1.8, -9], [-1.8, -9]], BROWN, SEPIA, rng, { ang: -1.4, sp: 0.9, lw: 0.8, sh: 0 });
    const tiers = v ? [[[-13, -7], [13, -7], [0, -22]], [[-10, -15], [10, -15], [0, -30]]]
      : [[[-12, -8], [12, -8], [0, -24]], [[-10, -17], [10, -17], [0, -32]], [[-7.6, -25.5], [7.6, -25.5], [0, -39.5]]];
    for (const t of tiers) shape(ctx, t, DGREEN, mixc(DGREEN, INK, 0.35), rng, { ang: -0.4, sp: 1.0, lw: 1.0, over: 1, sh: 0.3, sc: PINE, sa: 0.75, hi: true, hc: GREEN });
    if (v) for (const [x, y] of [[-5, -10], [4, -12], [-2, -19]]) { dot(ctx, x, y, 1.0, BROWN, 1); wax(ctx, ell(x, y, 1, 1.2, 8), { rng, closed: true, w: 0.35, c: SEPIA, dbl: false, step: 0.3 }); }
    tufts(ctx, rng, -6, 6, 2, GREEN);
  }
  function artHouse(ctx, rng, v) {
    // v0 yellow classic house, v1 tall pink two-storey house, v2 wide sky-blue cottage with a flower box
    const wallCol = [YELLOW, PINK, SKY][v % 3];
    const W = v === 1 ? 13 : v === 2 ? 21 : 17, Hh = v === 1 ? 34 : v === 2 ? 20 : 25, roofH = v === 1 ? 22 : v === 2 ? 14 : 19;
    if (v !== 2) {
      const cx = W * 0.55;
      shape(ctx, [[cx - 2.4, -Hh - roofH * 0.35], [cx + 2.4, -Hh - roofH * 0.35], [cx + 2.4, -Hh - roofH * 0.95], [cx - 2.4, -Hh - roofH * 0.95]], RED, INK, rng, { ang: -1.2, sp: 0.9, lw: 0.8, sh: 0.3 });
      for (const [x, y, r] of [[cx, -Hh - roofH - 2.6, 1.5], [cx + 1.6, -Hh - roofH - 6.6, 2.1], [cx + 0.4, -Hh - roofH - 11.8, 2.8]]) wax(ctx, puffPts(x, y, r, r * 0.85, 4, rng, 16), { rng, closed: true, w: 0.6, c: GREY, a: 0.9, dbl: false, step: 0.45, wob: 0.06 });
    }
    const wall = [[-W, 0.5], [W, 0.5], [W, -Hh], [-W, -Hh]];
    shape(ctx, wall, wallCol, INK, rng, { ang: -0.7, sp: 1.1, lw: 1.05, over: 1.2, sh: 0 });
    // shade crayon under the eave (light from above, the roof overhang shades the wall)
    scribble(ctx, [[-W + 0.6, -Hh + 0.4], [W - 0.6, -Hh + 0.4], [W - 0.6, -Hh + 4.2], [-W + 0.6, -Hh + 3.4]], { rng, c: shadeOf(wallCol), a: 0.55, sp: 0.9, w: 1.0, ang: 1.1, over: 0.2 });
    const roof = [[-W - 4.5, -Hh + 1], [W + 4.5, -Hh + 1], [0.5, -Hh - roofH]];
    shape(ctx, roof, RED, INK, rng, { ang: 0.5, sp: 1.1, lw: 1.1, over: 1.4, sh: 0.22, sa: 0.7 });
    // roof tiles: little scallop rows
    for (let r = 1; r <= 2; r++) {
      const y = -Hh + 1 - roofH * r * 0.32, hw = (W + 4.5) * (1 - r * 0.32);
      const sc = [];
      for (let i = 0; i <= 8; i++) sc.push([-hw + (hw * 2 * i) / 8, y + (i & 1 ? 0.9 : 0)]);
      wax(ctx, sc, { rng, w: 0.45, c: CRIMSON, a: 0.8, dbl: false, step: 0.5, wob: 0.06 });
    }
    // door
    const dx = v === 2 ? -W * 0.45 : 0;
    const door = [[dx - 3.8, 0.4], [dx + 3.8, 0.4], [dx + 3.8, -13.5], [dx - 3.8, -13.5]];
    shape(ctx, door, BROWN, INK, rng, { ang: -1.3, sp: 0.85, lw: 0.85, sh: 0.25 });
    dot(ctx, dx + 2.2, -6.6, 0.6, YELLOW, 1);
    // windows with crosses (a warm yellow light inside)
    const wins = v === 1 ? [[-6.2, -16.5], [6.2, -16.5], [-6.2, -27.5], [6.2, -27.5]] : v === 2 ? [[4, -11], [13.4, -11]] : [[-11, -17], [11, -17]];
    for (const [wx, wy] of wins) {
      const s = v === 1 ? 3.2 : 3.8;
      const wn = [[wx - s, wy - 3.5], [wx + s, wy - 3.5], [wx + s, wy + 3.5], [wx - s, wy + 3.5]];
      shape(ctx, wn, SKY, INK, rng, { ang: 0.8, sp: 0.9, lw: 0.8, base: 0.25, fa: 0.55, sh: 0.4, sc: YELLOW, sa: 0.7 });
      wax(ctx, [[wx, wy - 3.4], [wx, wy + 3.4]], { rng, w: 0.6, c: INK, dbl: false });
      wax(ctx, [[wx - s + 0.1, wy], [wx + s - 0.1, wy]], { rng, w: 0.6, c: INK, dbl: false });
    }
    if (v === 2) {
      // flower box under the windows
      const fb = [[1, -6.6], [16.4, -6.6], [16, -4.2], [1.4, -4.2]];
      shape(ctx, fb, BROWN, INK, rng, { sp: 0.6, lw: 0.6, sh: 0 });
      for (let i = 0; i < 6; i++) dot(ctx, 2.6 + i * 2.6, -7.6, 0.95, [RED, YELLOW, PINK][i % 3], 1);
    } else {
      const rw = ell(0.5, -Hh - roofH * 0.42, 2.4, 2.4, 14);
      shape(ctx, rw, YELLOW, INK, rng, { sp: 0.7, lw: 0.6, sh: 0.3 });
    }
    tufts(ctx, rng, -W - 1, W + 1, 7, GREEN);
  }
  function artFlowers(ctx, rng, v) {
    if (v === 2) { // sunflower
      wax(ctx, spl([[0, 0.5], [0.6, -10], [-0.4, -20]], 4), { rng, w: 1.2, c: DGREEN });
      for (const s of [-1, 1]) { const l = lens(0.2, -8 - s * 2, -Math.PI / 2 + s * 1.0, 6, 1.8); shape(ctx, l, GREEN, DGREEN, rng, { sp: 0.7, lw: 0.6, sh: 0.4 }); }
      const pet = starPts(-0.4, -22, 7, 3.4, 11, 0.1);
      shape(ctx, spl(pet, 2, true), YELLOW, ORANGE, rng, { ang: 0.5, sp: 0.8, lw: 0.7, sh: 0.3 });
      const c = blob(-0.4, -22, 3.4, 3.4, rng, 0.05, 16);
      shape(ctx, c, BROWN, SEPIA, rng, { ang: 0.9, sp: 0.6, lw: 0.6, sh: 0.4 });
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
      shape(ctx, l, GREEN, DGREEN, rng, { sp: 0.55, lw: 0.45, base: 0.7, sh: 0 });
      const col = cols[i];
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + i, p = ell(tx + Math.cos(a) * 2.2, -h + Math.sin(a) * 2.2, 1.45, 1.45, 10);
        flat(ctx, p, Math.sin(a) > 0.3 ? mixc(col, shadeOf(col), 0.35) : col, 0.75);
        wax(ctx, p, { rng, closed: true, w: 0.45, c: mixc(col, INK, 0.3), dbl: false, step: 0.4, wob: 0.05 });
      }
      dot(ctx, tx, -h, 1.25, i === 0 && v === 0 ? BROWN : YELLOW, 1);
    }
    tufts(ctx, rng, -8, 8, 3, GREEN);
  }
  function artBush(ctx, rng, v) {
    const b = puffPts(0, -7.2, 12, 8, 6, rng, 44);
    shape(ctx, b, v ? LGREEN : GREEN, DGREEN, rng, { ang: -0.5, sp: 1.0, lw: 1.0, over: 1.2, sh: 0.42, sa: 0.65, hi: true });
    const bc = v ? PURPLE : RED;
    for (const [x, y] of [[-6, -6], [-1, -10], [4.5, -5.6], [7, -9.6], [-3.2, -3.4], [1.6, -6.4]]) { dot(ctx, x, y, 1.05, bc, 1); dot(ctx, x - 0.35, y - 0.35, 0.3, WHITE, 0.8); }
    tufts(ctx, rng, -8, 8, 3, GREEN);
  }
  function artRock(ctx, rng, v) {
    const b = blob(0, -4, v ? 7.5 : 5.4, v ? 5 : 3.8, rng, 0.08, 20).map((p) => [p[0], Math.min(p[1], 0.4)]);
    shape(ctx, b, GREY, SLATE, rng, { ang: -0.6, sp: 0.9, lw: 0.9, base: 0.35, fa: 0.7, sh: 0.45, sa: 0.7, hi: true });
    wax(ctx, [[-1.6, -6.4], [-0.4, -4.4], [-1.4, -2.2]], { rng, w: 0.5, c: SLATE, dbl: false });
    if (v) { dot(ctx, 5, 0, 1.5, GREY, 0.7); wax(ctx, ell(5, -0.2, 1.8, 1.3, 10), { rng, closed: true, w: 0.5, c: SLATE, dbl: false, step: 0.4 }); }
    tufts(ctx, rng, -7, 7, 2, GREEN);
  }
  function artFence(ctx, rng) {
    for (let i = 0; i < 5; i++) {
      const x = -16 + i * 8 + J(0.4, rng), h = 14 + J(1, rng);
      shape(ctx, [[x - 2.5, 0.5], [x + 2.5, 0.5], [x + 2.5, -h + 3], [x, -h], [x - 2.5, -h + 3]], TAN, BROWN, rng, { ang: -1.35, sp: 0.85, lw: 0.75, sh: 0.25 });
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
      flat(ctx, cl, WHITE, 1);
      shadeBand(ctx, cl, { rng, c: PALE, h: 0.45, sp: 0.9, w: 0.9, a: 0.7 });
      wax(ctx, cl, { rng, closed: true, w: 0.8, c: SKY, step: 0.55 });
    }
  }
  function artReeds(ctx, rng, v) {
    // v0 cattails with brown velvet heads, v1 a tall grass clump – they grow at the pond edges
    const n = v ? 7 : 5;
    for (let i = 0; i < n; i++) {
      const x = -5 + (i / (n - 1)) * 10 + J(0.6, rng), h = v ? R(9, 14, rng) : R(12, 18, rng), lean = J(2.2, rng) + (x * 0.2);
      wax(ctx, spl([[x, 0.5], [x + lean * 0.4, -h * 0.5], [x + lean, -h]], 3), { rng, w: v ? 0.9 : 0.75, c: i & 1 ? DGREEN : GREEN, dbl: false, wob: 0.06 });
      if (!v && i % 2 === 0) {
        const hd = ell(x + lean * 0.95, -h + 1.8, 1.0, 2.4, 12, lean * 0.04);
        shape(ctx, hd, BROWN, SEPIA, rng, { sp: 0.45, lw: 0.45, sh: 0.45, mis: 0.1, base: 0.9 });
      }
    }
    if (!v) for (const s of [-1, 1]) { const l = lens(s * 1.5, 0, -Math.PI / 2 + s * 0.55, 9, 1.3); shape(ctx, l, GREEN, DGREEN, rng, { sp: 0.6, lw: 0.5, sh: 0.4, sc: PINE }); }
  }
  function artScarecrow(ctx, rng, v) {
    // v0 straw hat + red shirt with a yellow patch (wheat), v1 floppy brown hat + blue shirt with a crow on the arm (ploughed rows)
    const shirt = v ? BLUE : RED, patch = v ? PINK : YELLOW;
    shape(ctx, [[-1.3, 0.5], [1.3, 0.5], [1.1, -40], [-1.1, -40]], BROWN, SEPIA, rng, { ang: -1.5, sp: 0.8, lw: 0.75, sh: 0, mis: 0.15 });
    shape(ctx, [[-14, -27.6], [14, -28.6], [14, -26.2], [-14, -25.4]], BROWN, SEPIA, rng, { ang: 0.05, sp: 0.8, lw: 0.7, sh: 0, mis: 0.15 });
    // straw sticking out of the sleeves and the hem – short yellow strokes fanning out
    const straw = (x, y, dir, n) => { for (let i = 0; i < n; i++) { const a = dir + (i - (n - 1) / 2) * 0.32 + J(0.1, rng), l = R(2.6, 4.2, rng); wax(ctx, [[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], { rng, w: 0.6, c: i & 1 ? ORANGE : YELLOW, dbl: false, wob: 0.05 }); } };
    straw(-11.6, -27, Math.PI, 4); straw(11.6, -27.4, 0, 4); straw(0, -13.6, Math.PI / 2, 5);
    const body = [[-11, -29.6], [-4.4, -31], [4.4, -31], [11, -29.8], [11, -24.4], [6, -24.6], [6.6, -14], [-6.6, -14], [-6, -24.4], [-11, -24]];
    shape(ctx, body, shirt, INK, rng, { ang: -0.7, sp: 0.9, lw: 0.95, over: 0.9, sh: 0.3 });
    const pt = [[1.6, -21], [5, -21.4], [5.2, -17.4], [1.8, -17]];
    shape(ctx, pt, patch, mixc(patch, INK, 0.4), rng, { sp: 0.6, lw: 0.5, sh: 0, base: 0.6 });
    for (let i = 0; i < 3; i++) wax(ctx, [[1.4 + i * 1.4, -21.9], [1.8 + i * 1.4, -20.5]], { rng, w: 0.35, c: INK, dbl: false, wob: 0.02 });
    for (const y of [-27, -23.6, -20.2]) dot(ctx, -1.2, y, 0.55, INK, 0.85);
    // sack head: burlap tan, button eyes with a cross stitch, stitched zigzag smile
    const head = blob(0, -35.4, 5.2, 4.8, rng, 0.06, 20);
    shape(ctx, head, mixc(TAN, PEACH, 0.5), SEPIA, rng, { ang: 0.6, sp: 0.75, lw: 0.8, sh: 0.26, sc: TAN, sa: 0.7, hi: true, hc: PEACH });
    for (const x of [-2, 2]) { dot(ctx, x, -36.4, 0.85, INK, 1); wax(ctx, [[x - 0.5, -36.9], [x + 0.5, -35.9]], { rng, w: 0.3, c: WHITE, dbl: false, wob: 0 }); }
    const sm = [];
    for (let i = 0; i <= 6; i++) sm.push([-2.6 + i * 0.87, -33.2 + (i & 1 ? 0.7 : 0) + Math.sin((i / 6) * Math.PI) * 0.6]);
    wax(ctx, sm, { rng, w: 0.4, c: INK, dbl: false, step: 0.3, wob: 0.02 });
    dot(ctx, -3.6, -34.4, 0.8, PINK, 0.6); dot(ctx, 3.6, -34.4, 0.8, PINK, 0.6);
    if (!v) {
      const brim = ell(0, -39.4, 9.4, 2.2, 22);
      shape(ctx, brim, YELLOW, ORANGE, rng, { ang: 0.2, sp: 0.7, lw: 0.75, sh: 0.4, sc: ORANGE });
      const crown = [[-4.6, -39.6], [-3.6, -45.2], [3.8, -45.6], [4.6, -39.8]];
      shape(ctx, crown, YELLOW, ORANGE, rng, { ang: -1.2, sp: 0.7, lw: 0.75, sh: 0.25, sc: ORANGE });
      wax(ctx, [[-4.4, -41], [4.4, -41.2]], { rng, w: 1.1, c: RED, dbl: false, wob: 0.05 });
    } else {
      const hat = [[-6.8, -38.2], [-4.6, -43.6], [0.6, -46.2], [4.4, -43.2], [7.2, -38.8], [2, -39.6]];
      shape(ctx, spl(hat, 2, true), BROWN, SEPIA, rng, { ang: 0.7, sp: 0.75, lw: 0.75, sh: 0.3 });
      // a little crow perched on the right arm
      const crow = blob(11.4, -31.2, 2.6, 1.9, rng, 0.05, 14);
      shape(ctx, crow, INK, INK, rng, { sp: 0.5, lw: 0.5, sh: 0, base: 0.8 });
      shape(ctx, ell(13.6, -33.2, 1.5, 1.4, 10), INK, INK, rng, { sp: 0.45, lw: 0.45, sh: 0, base: 0.8 });
      shape(ctx, [[14.9, -33.6], [16.6, -33], [14.9, -32.6]], ORANGE, ORANGE, rng, { sp: 0.3, lw: 0.3, sh: 0, base: 1 });
      dot(ctx, 13.9, -33.6, 0.35, WHITE, 1);
      wax(ctx, [[9.2, -31], [7.4, -32.2]], { rng, w: 0.9, c: INK, dbl: false });
    }
    tufts(ctx, rng, -4, 4, 3, GREEN);
  }

  /* ===================================================================================== effects art */
  function drawPow(ctx, rng) {
    const p = [];
    const n = 9;
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU + J(0.08, rng), r = i & 1 ? R(4, 5, rng) : R(8.4, 10.4, rng); p.push([Math.cos(a) * r, Math.sin(a) * r]); }
    flat(ctx, p, YELLOW, 0.8);
    scribble(ctx, p, { rng, c: YELLOW, a: 0.95, sp: 0.9, w: 1.0, ang: -0.5, over: 1 });
    scribble(ctx, ell(0, 0.6, 4.2, 3.6, 14), { rng, c: ORANGE, a: 0.75, sp: 0.9, w: 1.0, ang: 0.6, over: 0.6 });
    dot(ctx, -1.3, -1.4, 1.6, WHITE, 0.9);
    wax(ctx, p, { rng, closed: true, w: 0.95, c: RED, step: 0.55, wob: 0.1 });
  }
  function drawBolt(ctx, rng, col) {
    wax(ctx, [[-4.4, -4], [1.2, -1.4], [-1.6, 0.4], [4.4, 3.8]], { rng, w: 1.0, c: col, step: 0.5, wob: 0.08 });
  }
  function drawTick(ctx, rng) {
    // impact: short black crayon dashes radiating from the hit point (a comic "whack")
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + J(0.22, rng), r0 = R(4.2, 5.4, rng), r1 = r0 + R(3.0, 5.4, rng) * (i & 1 ? 0.7 : 1);
      wax(ctx, [[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1]], { rng, w: 1.05, c: INK, dbl: false, wob: 0.06 });
    }
  }
  function drawCurl(ctx, rng, col) {
    const p = [];
    for (let i = 0; i < 26; i++) { const a = i * 0.5, rr = 0.3 + i * 0.13; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    wax(ctx, p, { rng, w: 0.75, c: col, dbl: false, step: 0.45, wob: 0.06 });
  }
  function drawShave(ctx, rng, col) {
    // a curled crayon shaving with its darker frilled edge
    const p = [];
    for (let i = 0; i < 15; i++) { const a = i * 0.6, rr = 0.5 + i * 0.17; p.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.62]); }
    wax(ctx, p, { rng, w: 1.15, c: col, dbl: false, step: 0.4, wob: 0.05 });
    wax(ctx, p.slice(7), { rng, w: 0.4, c: shadeOf(col), dbl: false, step: 0.4, wob: 0.05 });
  }
  function drawStar(ctx, rng, col) {
    const st = starPts(0, 0, 4.2, 1.9, 5, 0);
    flat(ctx, st, col, 0.85);
    shadeBand(ctx, st, { rng, c: shadeOf(col), h: 0.35, sp: 0.6, w: 0.6, a: 0.7 });
    wax(ctx, st, { rng, closed: true, w: 0.6, c: col === YELLOW ? ORANGE : mixc(col, INK, 0.35), dbl: false, step: 0.45, wob: 0.08 });
  }
  function drawSpark(ctx, rng, col) {
    const p = starPts(0, 0, 4.4, 0.9, 4, 0);
    flat(ctx, p, col, 0.95);
    wax(ctx, p, { rng, closed: true, w: 0.5, c: shadeOf(col), dbl: false, step: 0.4, wob: 0.05 });
  }
  function drawHeart(ctx, rng, col) {
    const h = heartPts(0, 0, 4.4, 26);
    flat(ctx, h, col, 0.8);
    scribble(ctx, h, { rng, c: col, a: 0.9, sp: 0.75, w: 0.85, ang: -0.6, over: 0.5 });
    shadeBand(ctx, h, { rng, c: shadeOf(col), h: 0.35, sp: 0.65, w: 0.7, a: 0.7 });
    wax(ctx, h, { rng, closed: true, w: 0.6, c: mixc(col, INK, 0.4), dbl: false, step: 0.45, wob: 0.08 });
  }
  function drawRing(ctx, rng) {
    // a rainbow loop: three wax circles drawn in one go, each overshooting its start
    for (const [c, r] of [[RED, 13.2], [YELLOW, 11.8], [SKY, 10.4]]) wax(ctx, ell(0, 0, r, r * 0.8, 40), { rng, closed: true, w: 1.25, c, step: 0.8, wob: 0.45 });
  }
  function drawRays(ctx, rng) {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + J(0.06, rng), r0 = 9.5, r1 = i & 1 ? 13.5 : 16;
      wax(ctx, [[Math.cos(a) * r0, Math.sin(a) * r0 * 0.8], [Math.cos(a) * r1, Math.sin(a) * r1 * 0.8]], { rng, w: 1.3, c: i & 1 ? ORANGE : YELLOW, dbl: false, wob: 0.1 });
    }
  }
  function drawPuff(ctx, rng) {
    const p = puffPts(0, 0, 4.6, 3.4, 5, rng, 30);
    flat(ctx, p, WHITE, 0.9);
    shadeBand(ctx, p, { rng, c: PALE, h: 0.4, sp: 0.7, w: 0.7, a: 0.7 });
    wax(ctx, p, { rng, closed: true, w: 0.6, c: GREY, dbl: false, step: 0.45, wob: 0.1 });
  }
  function drawLines(ctx, rng) {
    for (let k = -1; k <= 1; k++) wax(ctx, [[0, k * 4], [-R(9, 13, rng) + Math.abs(k) * 2, k * 4.4]], { rng, w: 0.85, c: INK, a: 0.7, dbl: false, wob: 0.1 });
  }
  function drawWave(ctx, rng) {
    const wv = [];
    for (let k = 0; k <= 12; k++) wv.push([-6 + k, -Math.abs(Math.sin((k / 12) * Math.PI * 2)) * 1.6]);
    wax(ctx, wv, { rng, w: 0.9, c: WHITE, a: 0.95, dbl: false, step: 0.6, wob: 0.1 });
    wax(ctx, mv(wv, 0.4, 0.9), { rng, w: 0.6, c: BLUE, a: 0.7, dbl: false, step: 0.6, wob: 0.1 });
  }
  /** Crossing out: black scribble of growing density (each level redraws the levels below with the same strokes). */
  function drawScratch(ctx, seed, lvl) {
    const c = ell(0, 0, 9, 9, 20);
    for (let l = 0; l <= lvl; l++) {
      const rng = U.rng(seed + l * 11);
      if (l === 0) scribble(ctx, c, { rng, c: INK, a: 0.85, sp: 3.2, w: 0.95, ang: -0.6, over: 1.3, bow: 0.9 });
      if (l === 1) scribble(ctx, c, { rng, c: INK, a: 0.82, sp: 2.4, w: 0.9, ang: -0.5, over: 1.2, bow: 0.9 });
      if (l === 2) scribble(ctx, c, { rng, c: INK, a: 0.8, sp: 2.2, w: 0.85, ang: 0.75, over: 1.2, bow: 0.9 });
      if (l === 3) {
        const t = [];
        for (let i = 0; i < 18; i++) { const a = rng.next() * TAU, rr = 8 * Math.sqrt(rng.next()); t.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
        wax(ctx, spl(t, 4), { rng, w: 0.85, c: INK, a: 0.9, dbl: false, wob: 0.2 });
      }
    }
  }
  function drawScar(ctx, rng, col) {
    const b = blob(0, 0, 6, 4, rng, 0.15, 18);
    scribble(ctx, b, { rng, c: col, a: 0.55, sp: 1.3, w: 1.1, ang: -0.6, over: 1.5, bow: 0.8 });
    for (let i = 0; i < 2; i++) wax(ctx, [[J(4, rng), J(2.5, rng)], [J(4, rng), J(2.5, rng)]], { rng, w: 0.5, c: INK, a: 0.45, dbl: false, wob: 0.2 });
  }
  function drawCrumb(ctx, rng, col) {
    wax(ctx, [[-1.2, 0.3], [1.2, -0.3]], { rng, w: 1.1, c: col, dbl: false, wob: 0.05 });
  }

  /* ===================================================================================== bake */
  const SPR = {};
  const BOIL = 3;
  const IDLESEQ = [0, 1, 2, 2, 1, 0, 0, 1, 1, 0, 0, 3];
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
    misN = 0;
    // main character: [mode][facing][frame][variant]
    const kid = { idle: [[], []], walk: [[], []], dash: [[], []], hurt: [[], []] };
    const kb = [-20, -37.5, 15.5, 2.6];
    const kmk = (seed, mode, f) => { const P = kidPose(mode, f); return (v) => mk(kb[0], kb[1], kb[2], kb[3], (c) => drawKid(c, U.rng(seed + v * 31), P), { hurt: true }); };
    const frames = (mode, n, seed) => { for (let f = 0; f < n; f++) { kid[mode][0][f] = []; kid[mode][1][f] = []; vary([kid[mode][0][f], kid[mode][1][f]], kmk(seed + f * 7, mode, f)); } };
    frames('idle', 4, 100);
    frames('walk', 8, 200);
    frames('dash', 2, 300);
    vary(kid.hurt, kmk(400, 'hurt', 0));
    SPR.kid = kid;
    // creatures: [facing][frame][variant] + a sketch (construction lines only) for the "being drawn" entrance
    const crea = (fn, bx, seed) => {
      const out = [[], []];
      for (let f = 0; f < 6; f++) {
        out[0][f] = []; out[1][f] = [];
        vary([out[0][f], out[1][f]], (v) => mk(bx[0], bx[1], bx[2], bx[3], (c) => fn(c, U.rng(seed + f * 13 + v * 37), f), { flash: true }));
      }
      const sk = [[], []];
      vary(sk, (v) => mk(bx[0], bx[1], bx[2], bx[3], (c) => fn(c, U.rng(seed + v * 37), 0), { sketch: true, halo: 0, tooth: 0.5 }));
      return { set: out, sketch: sk };
    };
    const cr = crea(drawScribbler, [-13, -24, 12.5, 1.5], 1000);
    const gh = crea(drawGhost, [-14, -23, 11.5, 1.5], 2000);
    const dr = crea(drawDragon, [-30.5, -48, 30, 1.5], 3000);
    SPR.creeper = cr.set; SPR.ghost = gh.set; SPR.colossus = dr.set;
    SPR.sketch = { creeper: cr.sketch, ghost: gh.sketch, colossus: dr.sketch };
    SPR.scratch = [0, 1, 2, 3].map((l) => [0, 1, 2].map((v) => mk(-10, -10, 10, 10, (c) => drawScratch(c, 4000 + v * 5, l), { halo: 0 })));
    // shadows
    SPR.shKid = shadowSpr(7, 2.4, 11);
    SPR.shCreeper = shadowSpr(7.5, 2.4, 12);
    SPR.shGhost = shadowSpr(5.5, 1.8, 13);
    SPR.shColossus = shadowSpr(17, 4.6, 14);
    SPR.shTree = shadowSpr(10, 3, 15);
    SPR.shHouse = shadowSpr(22, 3.4, 16);
    SPR.shSmall = shadowSpr(6, 1.8, 17);
    SPR.shWide = shadowSpr(19, 2, 18);
    SPR.shGem = shadowSpr(2.6, 0.9, 19);
    // effects
    SPR.ball = [0, 1, 2].map((v) => mk(-4.5, -4.5, 4.5, 4.5, (c) => drawBall(c, U.rng(500 + v)), { halo: 0.6 }));
    SPR.trail = [0, 1, 2].map((v) => mk(-18, -4.5, -3, 4.5, (c) => drawTrail(c, U.rng(510 + v)), { halo: 0 }));
    SPR.crayon = [ORANGE, GREEN, PURPLE, BLUE, PINK, RED, SLATE].map((col, i) => [0, 1, 2].map((v) => mk(-8.5, -2.6, 8.5, 2.6, (c) => drawCrayon(c, U.rng(520 + i * 7 + v), col), { halo: 0.7 })));
    SPR.gem = [0, 1, 2].map((v) => mk(-4.5, -5, 4.5, 2, (c) => drawGemSmall(c, U.rng(540 + v)), { halo: 0.6 }));
    SPR.gemBig = [0, 1, 2].map((v) => mk(-7.6, -12.6, 7.6, 2.6, (c) => drawGemBig(c, U.rng(550 + v)), { halo: 0.7 }));
    SPR.pow = [0, 1, 2].map((v) => mk(-11, -11, 11, 11, (c) => drawPow(c, U.rng(560 + v)), { halo: 0.8 }));
    const FX = [YELLOW, RED, SKY, PINK, GREEN, PURPLE, ORANGE, INK];
    SPR.fxCols = FX;
    SPR.zig = FX.map((col, i) => mk(-5, -5, 5, 5, (c) => drawBolt(c, U.rng(570 + i), col), { halo: 0.5 }));
    SPR.curl = FX.map((col, i) => mk(-4, -4, 4, 4, (c) => drawCurl(c, U.rng(580 + i), col), { halo: 0.4 }));
    SPR.star = FX.map((col, i) => mk(-4.5, -4.5, 4.5, 4.5, (c) => drawStar(c, U.rng(590 + i), col), { halo: 0.5 }));
    SPR.crumb = FX.map((col, i) => mk(-1.8, -1, 1.8, 1, (c) => drawCrumb(c, U.rng(600 + i), col), { halo: 0, pad: 0.8 }));
    SPR.shave = FX.map((col, i) => mk(-3.2, -2.4, 3.2, 2.4, (c) => drawShave(c, U.rng(605 + i), col), { halo: 0.4 }));
    SPR.spark = [YELLOW, WHITE].map((col, i) => mk(-4.6, -4.6, 4.6, 4.6, (c) => drawSpark(c, U.rng(608 + i), col), { halo: 0.5 }));
    SPR.heart = [PINK, RED].map((col, i) => mk(-5, -5, 5, 5, (c) => drawHeart(c, U.rng(610 + i), col), { halo: 0.6 }));
    SPR.tick = [0, 1, 2].map((v) => mk(-10.5, -10.5, 10.5, 10.5, (c) => drawTick(c, U.rng(615 + v)), { halo: 0.5 }));
    SPR.ring = [0, 1, 2].map((v) => mk(-14.5, -12, 14.5, 12, (c) => drawRing(c, U.rng(620 + v)), { halo: 0 }));
    SPR.rays = [0, 1, 2].map((v) => mk(-17, -14, 17, 14, (c) => drawRays(c, U.rng(625 + v)), { halo: 0 }));
    SPR.puff = [0, 1, 2].map((v) => mk(-5.5, -4.5, 5.5, 4.5, (c) => drawPuff(c, U.rng(630 + v)), { halo: 0 }));
    SPR.lines = mk(-14, -6, 1, 6, (c) => drawLines(c, U.rng(640)), { halo: 0 });
    SPR.wave = [0, 1, 2].map((v) => mk(-6.5, -2.5, 6.5, 1.6, (c) => drawWave(c, U.rng(645 + v)), { halo: 0 }));
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
      tree: prop(artTree, [-17, -56, 17, 1.5], 3, 7000),
      pine: prop(artPine, [-14, -41, 14, 1.5], 2, 7100),
      house: prop(artHouse, [-26, -60, 26, 1.5], 3, 7200),
      flowers: prop(artFlowers, [-10, -31, 10, 1.5], 3, 7300),
      bush: prop(artBush, [-14, -17, 14, 1.5], 2, 7400),
      rock: prop(artRock, [-9, -11, 9, 1.5], 2, 7500),
      fence: prop(artFence, [-21, -17, 21, 1.5], 1, 7600),
      rainbow: prop(artRainbow, [-24.5, -24.5, 24.5, 3], 1, 7700),
      reeds: prop(artReeds, [-10, -21, 10, 1.5], 2, 7800),
      scarecrow: prop(artScarecrow, [-16, -50, 16, 1.5], 2, 7900),
    };
  }

  /* ===================================================================================== world: paper, hills, ponds, roads */
  /* ---------- road network: long wavy roads, linked by side roads that exist only between some of them ---------- */
  const PH = 760, PV = 1100, PW = 10.5; // road spacing + half width
  const hPathY = (k, x) => (k + 0.16) * PH + 46 * Math.sin(x / 260 + k * 1.7) + 18 * Math.sin(x / 97 + k * 3.1);
  const vPathX = (k, y) => (k - 0.2) * PV + 130 * Math.sin(k * 2.71) + 52 * Math.sin(y / 300 + k * 2.3) + 16 * Math.sin(y / 83 + k * 1.3);
  /* ---------- streams: long blue streams meander north–south far apart; the roads cross them on plank bridges ---------- */
  const RV = 2300, RW = 9; // stream spacing + half width
  const rivX = (j, y) => (j + 0.55) * RV + 150 * Math.sin(y / 420 + j * 1.9) + 58 * Math.sin(y / 170 + j * 4.1) + 14 * Math.sin(y / 61 + j);
  function riverDist(x, y) {
    const j = Math.round(x / RV - 0.55);
    let d = 1e9;
    for (let i = j - 1; i <= j + 1; i++) d = Math.min(d, Math.abs(x - rivX(i, y)) * 0.9);
    return d - RW;
  }
  /** Does side road kv run between road k and road k+1? (never alongside a stream) */
  const VON = new Map();
  function vOn(kv, k) {
    const key = kv * 100003 + k;
    let on = VON.get(key);
    if (on !== undefined) return on;
    if (VON.size > 4000) VON.clear();
    on = U.hash2(kv, k, 3131) < 0.55;
    for (let i = 0; i <= 4 && on; i++) { const y = (k + 0.16 + i * 0.25) * PH; if (riverDist(vPathX(kv, y), y) < 110) on = false; }
    VON.set(key, on);
    return on;
  }
  function vRange(kv, k) {
    const x = vPathX(kv, (k + 0.66) * PH);
    return [hPathY(k, x), hPathY(k + 1, x)];
  }
  function pathDist(x, y) {
    let d = 1e9;
    const kh = Math.round(y / PH - 0.16);
    for (let k = kh - 1; k <= kh + 1; k++) d = Math.min(d, Math.abs(y - hPathY(k, x)) * 0.94);
    const kv = Math.round(x / PV + 0.2);
    for (let j = kv - 1; j <= kv + 1; j++) {
      const k = Math.floor(y / PH - 0.16);
      for (let kk = k - 1; kk <= k; kk++) {
        if (!vOn(j, kk)) continue;
        const r = vRange(j, kk);
        if (y < r[0] - 4 || y > r[1] + 4) continue;
        d = Math.min(d, Math.abs(x - vPathX(j, y)) * 0.94);
      }
    }
    return d - PW;
  }

  /* ---------- hills: clusters of 2–4 overlapping lobes, one hand direction each; ponds sit at their edges ---------- */
  const MC = 430;
  const MEAD = new Map();
  function lobe(x, y, r, rng) {
    const sx = R(0.85, 1.3, rng);
    const s = { x, y, R: r, sx, sy: R(0.78, 1.0, rng) / Math.sqrt(sx), rot: J(0.45, rng), p1: rng.next() * TAU, p2: rng.next() * TAU, a1: R(0.06, 0.15, rng), a2: R(0.03, 0.08, rng) };
    s.bound = s.R * (1 + s.a1 + s.a2) * Math.max(s.sx, s.sy);
    return s;
  }
  function meadowAt(cx, cy) {
    const key = cx * 100003 + cy;
    let m = MEAD.get(key);
    if (m !== undefined) return m;
    if (MEAD.size > 4000) MEAD.clear();
    const seed = U.hashInt(cx, cy, 5151), rng = U.rng(seed);
    m = null;
    if (rng.next() < 0.84) {
      const x = (cx + 0.24 + rng.next() * 0.52) * MC, y = (cy + 0.24 + rng.next() * 0.52) * MC;
      const R0 = R(66, 114, rng);
      const lobes = [lobe(x, y, R0, rng)];
      const n = 1 + ((rng.next() * 3) | 0);
      let a = rng.next() * TAU;
      for (let i = 0; i < n; i++) {
        a += R(1.3, 2.5, rng);
        const d = R0 * R(0.6, 0.95, rng), r = R0 * R(0.45, 0.72, rng);
        lobes.push(lobe(x + Math.cos(a) * d * 1.15, y + Math.sin(a) * d * 0.85, r, rng));
      }
      const box = [1e9, 1e9, -1e9, -1e9];
      for (const s of lobes) { box[0] = Math.min(box[0], s.x - s.bound); box[1] = Math.min(box[1], s.y - s.bound); box[2] = Math.max(box[2], s.x + s.bound); box[3] = Math.max(box[3], s.y + s.bound); }
      m = { x, y, lobes, seed, box, ang: R(-0.95, -0.3, rng), alt: rng.next() < 0.35, kind: rng.next() };
      const hw = (box[2] - box[0]) / 2 + 26, mx = (box[0] + box[2]) / 2;
      if (riverDist(mx, box[1]) < hw || riverDist(mx, (box[1] + box[3]) / 2) < hw || riverDist(mx, box[3]) < hw) { MEAD.set(key, null); return null; }
      m.bed = rng.next() < 0.6;
      if (rng.next() < 0.45) {
        const pa = rng.next() * TAU, L0 = lobes[0];
        const px = x + Math.cos(pa) * R0 * 0.92 * L0.sx, py = y + Math.sin(pa) * R0 * 0.8 * L0.sy;
        const p = lobe(px, py, R(30, 50, rng), rng);
        p.seed = U.hashInt(cx, cy, 6161);
        if (pathDist(px, py) > p.bound + 16 && Math.hypot(px, py) > p.bound + 50) {
          m.pond = p;
          box[0] = Math.min(box[0], p.x - p.bound - 6); box[1] = Math.min(box[1], p.y - p.bound - 6);
          box[2] = Math.max(box[2], p.x + p.bound + 6); box[3] = Math.max(box[3], p.y + p.bound + 6);
        }
      }
    }
    MEAD.set(key, m);
    return m;
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
    const cx = Math.floor(x / MC), cy = Math.floor(y / MC);
    let d = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const m = meadowAt(cx + i, cy + j);
      if (!m) continue;
      if (kind === 'o') { if (m.pond) d = Math.min(d, shapeD(m.pond, x, y)); }
      else for (const s of m.lobes) d = Math.min(d, shapeD(s, x, y));
    }
    return d;
  }
  function meadowsNear(x0, y0, x1, y1) {
    const out = [];
    for (let cy = Math.floor((y0 - 320) / MC); cy <= Math.floor((y1 + 320) / MC); cy++) {
      for (let cx = Math.floor((x0 - 320) / MC); cx <= Math.floor((x1 + 320) / MC); cx++) {
        const m = meadowAt(cx, cy);
        if (m && m.box[2] > x0 && m.box[0] < x1 && m.box[3] > y0 && m.box[1] < y1) out.push(m);
      }
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
  const inBox = (x, y, b, m) => x > b[0] - m && x < b[2] + m && y > b[1] - m && y < b[3] + m;
  function tuftAt(bt, x, y, h, col, rng) {
    const p = bt.path(col, R(0.7, 0.9, rng), R(0.6, 0.85, rng));
    for (let k = -1; k <= 1; k++) { p.moveTo(x + k * 1.1, y); p.lineTo(x + k * 2.1 + J(0.4, rng), y - h * (k === 0 ? 1.15 : 0.85)); }
  }
  /** A whole hill: wash, main colour patches, light crayon on top, shade crayon along the bottom, grass fringe, tufts. */
  function drawMeadow(ctx, m, box) {
    const col = m.alt ? LGREEN : GREEN, col2 = m.alt ? YELLOW : LGREEN, sh = m.alt ? GREEN : PINE;
    const bt = new Batch();
    const polys = m.lobes.map((s) => shapePts(s, 60));
    for (const p of polys) flat(ctx, p, col, 0.1);
    m.lobes.forEach((s, i) => scribble(ctx, polys[i], { c: col, a: 0.78, sp: 2.5, w: 2.7, ang: m.ang + i * 0.12, over: 3.2, bow: 0.8, cell: 30, batch: bt, seedCell: m.seed + i * 13, box }));
    m.lobes.forEach((s, i) => {
      const sub = shapePts(s, 30, 0.55, 0, J(4, U.rng(m.seed + i)), -s.R * s.sy * 0.34);
      scribble(ctx, sub, { c: col2, a: 0.5, sp: 3.0, w: 2.4, ang: m.ang + 1.0, over: 2, bow: 0.8, cell: 26, batch: bt, seedCell: m.seed + 50 + i, box });
    });
    bt.flush(ctx);
    // shade: up-and-down zigzag hatching in a band along the lowest contour of the whole hill
    let x0 = 1e9, x1 = -1e9;
    for (const p of polys) { const b = bbox(p); x0 = Math.min(x0, b[0]); x1 = Math.max(x1, b[2]); }
    const cxm = (x0 + x1) / 2, hw = (x1 - x0) / 2;
    const zig = [];
    let side = 0;
    const flushZig = () => { if (zig.length > 1) drawZig(bt, zig.slice(), sh, 0.6, 2.4, 2.6, 0.3, U.rng(m.seed + zig.length)); zig.length = 0; };
    for (let xi = Math.floor(x0 / 2.2); xi * 2.2 < x1; xi++) {
      const x = xi * 2.2;
      if (x < box[0] - 6 || x > box[2] + 6) { flushZig(); continue; }
      let bot = -1e9, top = 1e9;
      for (const p of polys) { const iv = vspan(p, x); if (iv) { if (iv[1] > bot) bot = iv[1]; if (iv[0] < top) top = iv[0]; } }
      if (bot < -1e8) { flushZig(); continue; }
      const r = U.rng(U.hashInt(xi, 7, m.seed)), q = (x - cxm) / hw;
      const th = Math.min(bot - top, (13 + 9 * (1 - q * q)) * R(0.8, 1.15, r));
      zig.push(side ? [x, bot + R(-0.5, 1.4, r)] : [x + 1.1, bot - th]);
      side ^= 1;
    }
    flushZig();
    bt.flush(ctx);
    // contour: a grass fringe ("WWW") along the upper edge, a firm darker line along the lower edge
    m.lobes.forEach((s, li) => {
      const n = Math.max(24, Math.round((s.bound * TAU) / 3.2));
      const pts = shapePts(s, n);
      let run = [], kind = -1;
      const end = () => {
        if (run.length > 1) {
          if (kind === 1) { const p = bt.path(DGREEN, 0.9, 0.85); p.moveTo(run[0][0], run[0][1]); for (let i = 1; i < run.length; i++) p.lineTo(run[i][0], run[i][1]); }
          else { const p = bt.path(sh, 0.75, 1.3); p.moveTo(run[0][0], run[0][1]); for (let i = 1; i < run.length; i++) p.lineTo(run[i][0], run[i][1]); }
        }
        run = [];
      };
      for (let i = 0; i <= n; i++) {
        const q = pts[i % n];
        let covered = !inBox(q[0], q[1], box, 8);
        if (!covered) for (let j = 0; j < m.lobes.length; j++) if (j !== li && shapeD(m.lobes[j], q[0], q[1]) < 0.97) { covered = true; break; }
        if (covered) { end(); continue; }
        const nx = q[0] - s.x, ny = q[1] - s.y, l = Math.hypot(nx, ny) || 1;
        const k = ny / l < 0.25 ? 1 : 0;
        if (k !== kind) { end(); kind = k; }
        const r = U.rng(U.hashInt(i, li, m.seed + 99));
        if (k === 1) {
          const h = R(2.2, 4.0, r);
          run.push([q[0], q[1] + 0.6]);
          const nq = pts[(i + 1) % n];
          run.push([(q[0] + nq[0]) / 2 + (nx / l) * 0.8 + J(0.5, r), (q[1] + nq[1]) / 2 - h]);
        } else run.push([q[0] + J(0.35, r), q[1] + J(0.35, r)]);
      }
      end();
    });
    // tuft clusters near the upper rim of each lobe, a few in the middle (clustered, never spread evenly)
    m.lobes.forEach((s, li) => {
      const r = U.rng(m.seed + 300 + li);
      const nc = 2 + ((r.next() * 3) | 0);
      for (let c = 0; c < nc; c++) {
        const a = -Math.PI / 2 + J(1.5, r), rr = R(0.55, 0.82, r);
        const ccx = s.x + Math.cos(a) * s.R * s.sx * rr, ccy = s.y + Math.sin(a) * s.R * s.sy * rr;
        const nt = 3 + ((r.next() * 4) | 0);
        for (let t = 0; t < nt; t++) {
          const x = ccx + J(9, r), y = ccy + J(5, r), h = R(2.4, 4.2, r);
          if (!inBox(x, y, box, 6)) continue;
          if (fieldD('o', x, y) < 1.15) continue;
          tuftAt(bt, x, y, h, DGREEN, r);
        }
      }
    });
    // flower bed: one tight cluster of mini flowers in two colours
    if (m.bed) {
      const r = U.rng(m.seed + 400), L0 = m.lobes[0];
      const a = r.next() * TAU, rr = R(0.2, 0.45, r);
      const bx = L0.x + Math.cos(a) * L0.R * L0.sx * rr, by = L0.y + Math.sin(a) * L0.R * L0.sy * rr;
      const c1 = [RED, YELLOW, PINK, PURPLE, ORANGE, SKY][(r.next() * 6) | 0], c2 = [YELLOW, PINK, WHITE][(r.next() * 3) | 0];
      const nf = 8 + ((r.next() * 6) | 0);
      for (let i = 0; i < nf; i++) {
        const fa = r.next() * TAU, fr = Math.sqrt(r.next());
        const x = bx + Math.cos(fa) * 15 * fr, y = by + Math.sin(fa) * 9 * fr;
        if (!inBox(x, y, box, 6)) { r.next(); continue; }
        miniFlower(ctx, x, y, r, i & 1 ? c2 : c1);
      }
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
    // deeper water: blue crayon pressed harder toward the lower half
    const inner = shapePts(s, 30, 0.62, 0, J(s.R * 0.1, rng), s.R * 0.16);
    scribble(ctx, inner, { rng, c: BLUE, a: 0.42, sp: 2.8, w: 2.3, ang: R(0.4, 0.9, rng), over: 1.5, bow: 0.8, cell: 26, batch: bt });
    shadeBand(ctx, pts, { rng, c: INDIGO, h: 0.2, sp: 2.4, w: 2.0, a: 0.32, batch: bt });
    bt.flush(ctx);
    // a light reflection streak left near the top (paper showing through)
    const top = shapePts(s, 30, 0.62, 0, -s.R * 0.12, -s.R * s.sy * 0.42);
    scribble(ctx, top.map((p) => [p[0], s.y + (p[1] - s.y) * 0.35 - s.R * s.sy * 0.32]), { rng, c: WHITE, a: 0.55, sp: 2.2, w: 1.6, ang: -0.15, over: 0.6 });
    wax(ctx, pts, { rng, closed: true, w: 1.5, c: BLUE, wob: 0.55, step: 1.4, drift: 3 });
    // stones along the lower bank
    const ns = 2 + ((rng.next() * 3) | 0);
    for (let i = 0; i < ns; i++) {
      const a = Math.PI * 0.25 + rng.next() * Math.PI * 0.5, x = s.x + Math.cos(a) * shapeR(s, a) * s.sx * 1.02, y = s.y + Math.sin(a) * shapeR(s, a) * s.sy * 1.02 + 1;
      const pb = ell(x, y, R(1.6, 2.8, rng), R(1.1, 1.8, rng), 12);
      shape(ctx, pb, GREY, SLATE, rng, { sp: 0.8, lw: 0.6, sh: 0.45, base: 0.5, mis: 0.2 });
    }
    // lily pads in a small cluster
    if (rng.next() < 0.75) {
      const a = rng.next() * TAU, rr = 0.45 * s.R;
      const x0 = s.x + Math.cos(a) * rr * s.sx, y0 = s.y + Math.sin(a) * rr * s.sy;
      for (let k = 0; k < 2 + ((rng.next() * 2) | 0); k++) {
        const x = x0 + J(6, rng), y = y0 + J(3.5, rng), sz = R(0.65, 1, rng);
        const pad = ell(x, y, 5 * sz, 3.6 * sz, 22).slice(2);
        pad.push([x, y]);
        shape(ctx, pad, GREEN, DGREEN, rng, { sp: 1.0, lw: 0.9, sh: 0.35, sc: PINE });
        if (k === 0) { for (let j = 0; j < 5; j++) { const b = (j / 5) * TAU; dot(ctx, x - 1.4 + Math.cos(b) * 1.3, y - 1.4 + Math.sin(b) * 1.1, 0.95, PINK, 1); } dot(ctx, x - 1.4, y - 1.4, 0.6, YELLOW, 1); }
      }
    }
    // a fish
    if (rng.next() < 0.5) {
      const a = rng.next() * TAU, rr = 0.3 * s.R, f = rng.next() < 0.5 ? 1 : -1;
      const x = s.x + Math.cos(a) * rr * s.sx, y = s.y + Math.sin(a) * rr * s.sy;
      const b = ell(x, y, 4, 2.2, 18);
      shape(ctx, b, ORANGE, mixc(ORANGE, INK, 0.45), rng, { sp: 0.8, lw: 0.7, sh: 0.4 });
      const t = [[x - f * 3.6, y], [x - f * 7, y - 2.4], [x - f * 7, y + 2.4]];
      shape(ctx, t, ORANGE, mixc(ORANGE, INK, 0.45), rng, { sp: 0.7, lw: 0.6, sh: 0 });
      dot(ctx, x + f * 2, y - 0.5, 0.5, INK, 1);
    }
  }
  /* ---------- crop fields: striped patches hung below some road stretches – a child's farmland ---------- */
  const FSEG = 380;
  const CROP = new Map();
  /** Bilinear point in the field quad [tl, tr, br, bl]: u along the rows, v down the field. */
  function qpt(q, u, v) {
    const ax = q[0][0] + (q[1][0] - q[0][0]) * u, ay = q[0][1] + (q[1][1] - q[0][1]) * u;
    const bx = q[3][0] + (q[2][0] - q[3][0]) * u, by = q[3][1] + (q[2][1] - q[3][1]) * u;
    return [ax + (bx - ax) * v, ay + (by - ay) * v];
  }
  function cropAt(k, s) {
    const key = k * 100003 + s;
    let f = CROP.get(key);
    if (f !== undefined) return f;
    if (CROP.size > 3000) CROP.clear();
    f = null;
    const seed = U.hashInt(k, s, 7373), rng = U.rng(seed);
    if (rng.next() < 0.64) {
      const x = (s + 0.25 + rng.next() * 0.5) * FSEG, w = R(118, 176, rng), h = R(58, 86, rng), gap = R(13, 22, rng);
      const xl = x - w / 2, xr = x + w / 2, up = rng.next() < 0.4;
      // the edge along the road follows the road's curve; the far edge is drawn freehand
      let q;
      if (!up) {
        const tl = [xl + J(4, rng), hPathY(k, xl) + PW + gap + J(2, rng)], tr = [xr + J(4, rng), hPathY(k, xr) + PW + gap + J(2, rng)];
        q = [tl, tr, [xr + R(-4, 12, rng), tr[1] + h + J(6, rng)], [xl + R(-12, 4, rng), tl[1] + h + J(6, rng)]];
      } else {
        const bl = [xl + J(4, rng), hPathY(k, xl) - PW - gap + J(2, rng)], br = [xr + J(4, rng), hPathY(k, xr) - PW - gap + J(2, rng)];
        q = [[xl + R(-4, 10, rng), bl[1] - h + J(6, rng)], [xr + R(-10, 4, rng), br[1] - h + J(6, rng)], br, bl];
      }
      let ok = true;
      for (let j = 0; j <= 4 && ok; j++) for (let i = 0; i <= 6; i++) {
        const p = qpt(q, i / 6, j / 4);
        if (pathDist(p[0], p[1]) < 7 || riverDist(p[0], p[1]) < 16 || nearHouse(p[0], p[1]) || fieldD('g', p[0], p[1]) < 1.15 || fieldD('o', p[0], p[1]) < 1.35 || G.nearSpawn(p[0], p[1], 95)) { ok = false; break; }
      }
      if (ok) f = { k, s, q, box: bbox(q), seed, kind: (rng.next() * 3) | 0, scare: rng.next() < 0.8, fence: rng.next() < 0.6, side: rng.next() < 0.5 ? 0.22 : 0.74 };
    }
    CROP.set(key, f);
    return f;
  }
  function cropsNear(box, m) {
    const out = [];
    const k0 = Math.floor((box[1] - m) / PH - 0.16) - 1, k1 = Math.ceil((box[3] + m) / PH - 0.16);
    for (let k = k0; k <= k1; k++) {
      for (let s = Math.floor((box[0] - m) / FSEG) - 1; s <= Math.floor((box[2] + m) / FSEG) + 1; s++) {
        const f = cropAt(k, s);
        if (f && f.box[2] > box[0] - m && f.box[0] < box[2] + m && f.box[3] > box[1] - m && f.box[1] < box[3] + m) out.push(f);
      }
    }
    return out;
  }
  const PT = [0, 0, 0, 0];
  function inCrop(x, y, m) { PT[0] = PT[2] = x; PT[1] = PT[3] = y; return cropsNear(PT, m).length > 0; }
  // wheat (orange ears on yellow), ploughed earth (brown furrows with green sprouts), tulip rows (green with coloured cups)
  const CROPCOL = [
    { base: YELLOW, row: ORANGE, line: ORANGE, sh: ORANGE, sp: 6.4, a: 0.62 },
    { base: TAN, row: SEPIA, line: SEPIA, sh: BROWN, sp: 6.0, a: 0.55 },
    { base: LGREEN, row: GREEN, line: DGREEN, sh: GREEN, sp: 8.6, a: 0.5 },
  ];
  const TULIP = [RED, PINK, YELLOW, PURPLE];
  /** A crop field: wash, base scribble, crop rows that follow the field's own shape, shade crayon along the lower edge, outline. */
  function drawCrop(ctx, f, box) {
    const C = CROPCOL[f.kind], q = f.q, rng = U.rng(f.seed + 1);
    const pts = [];
    for (let e = 0; e < 4; e++) {
      const A = q[e], B = q[(e + 1) % 4], n = Math.max(2, Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) / 8));
      for (let i = 0; i < n; i++) { const t = i / n; pts.push([A[0] + (B[0] - A[0]) * t + J(0.8, rng), A[1] + (B[1] - A[1]) * t + J(0.8, rng)]); }
    }
    const bt = new Batch();
    flat(ctx, pts, C.base, 0.14);
    const ang = Math.atan2(q[1][1] - q[0][1], q[1][0] - q[0][0]);
    scribble(ctx, pts, { rng, c: C.base, a: C.a, sp: 2.6, w: 2.5, ang: ang + 0.55, over: 1.6, bow: 0.8, cell: 30, batch: bt, seedCell: f.seed + 3, box });
    bt.flush(ctx);
    const hgt = (Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]) + Math.hypot(q[2][0] - q[1][0], q[2][1] - q[1][1])) / 2;
    const wid = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]);
    const nRows = Math.max(4, Math.round(hgt / C.sp)), nT = Math.round(wid / (f.kind === 2 ? 5.6 : 5));
    for (let r = 0; r < nRows; r++) {
      const v = (r + 0.6) / nRows, rr = U.rng(f.seed + 50 + r);
      const a0 = qpt(q, 0, v), a1 = qpt(q, 1, v);
      if (Math.max(a0[1], a1[1]) < box[1] - 6 || Math.min(a0[1], a1[1]) > box[3] + 6) continue;
      const row = [];
      for (let i = 0; i <= 10; i++) { const p = qpt(q, 0.035 + (i / 10) * 0.93, v); row.push([p[0], p[1] + Math.sin(i * 0.9 + r * 1.7) * 0.45]); }
      const rp = bt.path(C.row, f.kind === 2 ? 0.55 : 0.7, f.kind === 1 ? 1.7 : 1.2);
      rp.moveTo(row[0][0], row[0][1]);
      for (let i = 1; i < row.length; i++) rp.lineTo(row[i][0], row[i][1]);
      if (f.kind === 1) { const lp = bt.path(lightOf(TAN), 0.55, 1.0); lp.moveTo(row[0][0], row[0][1] - 1.6); for (let i = 1; i < row.length; i++) lp.lineTo(row[i][0], row[i][1] - 1.6); }
      const tc = TULIP[(r + f.seed) % 4];
      for (let i = 0; i < nT; i++) {
        const u = 0.06 + (0.88 * (i + 0.5 + J(0.25, rr))) / nT, p = qpt(q, u, v), x = p[0] + J(0.4, rr), y = p[1] + J(0.3, rr), hh = R(2.2, 3.3, rr), lean = J(0.6, rr);
        const skip = rr.next() < (f.kind === 2 ? 0.12 : 0.18);
        if (skip || !inBox(x, y, box, 5)) continue;
        if (f.kind === 0) {
          if ((i + r) % 3 === 0) continue;
          const e = bt.path((i & 3) === 1 ? BROWN : ORANGE, 0.72, 0.72);
          e.moveTo(x - 1.3 + lean, y - hh); e.lineTo(x, y); e.lineTo(x + 1.3 + lean, y - hh);
          e.moveTo(x, y); e.lineTo(x + lean * 1.4, y - hh - 1.2);
        } else if (f.kind === 1) {
          const e = bt.path(i & 1 ? GREEN : DGREEN, 0.9, 0.8);
          e.moveTo(x - 1.4, y - hh * 0.75); e.quadraticCurveTo(x - 0.4, y - 0.6, x, y); e.quadraticCurveTo(x + 0.4, y - 0.6, x + 1.5, y - hh * 0.8);
        } else {
          const st = bt.path(DGREEN, 0.85, 0.6);
          st.moveTo(x, y); st.lineTo(x + lean * 0.5, y - hh);
          const cup = [[x - 1.5 + lean * 0.5, y - hh - 2.6], [x - 0.5 + lean * 0.5, y - hh - 1.7], [x + lean * 0.5, y - hh - 2.9], [x + 0.5 + lean * 0.5, y - hh - 1.7], [x + 1.5 + lean * 0.5, y - hh - 2.6], [x + 1.2 + lean * 0.5, y - hh - 0.2], [x - 1.2 + lean * 0.5, y - hh - 0.2]];
          flat(ctx, cup, tc, 0.9);
          const ol = bt.path(shadeOf(tc), 0.75, 0.4);
          ol.moveTo(cup[0][0], cup[0][1]); for (let k = 1; k < cup.length; k++) ol.lineTo(cup[k][0], cup[k][1]); ol.closePath();
        }
      }
    }
    shadeBand(ctx, pts, { rng, c: C.sh, h: 0.15, sp: 2.4, w: 2.0, a: 0.42, batch: bt });
    bt.flush(ctx);
    wax(ctx, pts, { rng, closed: true, w: 1.25, c: C.line, a: 0.9, wob: 0.35, step: 1.2, drift: 2 });
  }

  /* ---------- stream drawing: pale wash, lengthwise sky-blue strokes, a deeper blue middle, shaded east bank, blue banks ---------- */
  function riverList(info, M) {
    const out = [];
    const j0 = Math.floor((info.wx - M - 260) / RV - 0.55), j1 = Math.ceil((info.wx + info.size + M + 260) / RV - 0.55);
    for (let j = j0; j <= j1; j++) {
      let hit = false;
      for (let t = info.wy - M; t <= info.wy + info.size + M; t += 16) { const x = rivX(j, t); if (x > info.wx - M - RW - 12 && x < info.wx + info.size + M + RW + 12) { hit = true; break; } }
      if (hit) out.push({ j, t0: info.wy - M, t1: info.wy + info.size + M, seed: j * 31 + 5 });
    }
    return out;
  }
  function drawRiver(ctx, rv) {
    const at = (t, o) => [rivX(rv.j, t) + o, t];
    const band = (o) => { const b = []; for (let t = rv.t0; t <= rv.t1; t += 4) b.push(at(t, -o)); for (let t = rv.t1; t >= rv.t0; t -= 4) b.push(at(t, o)); return b; };
    eraseShape(ctx, band(RW + 3.5));
    flat(ctx, band(RW - 0.4), PALE, 0.42);
    const bt = new Batch();
    for (let s = Math.floor(rv.t0 / SEG); s <= Math.floor(rv.t1 / SEG); s++) {
      const rng = U.rng(U.hashInt(s, rv.seed, 991));
      const a0 = s * SEG - 3, a1 = (s + 1) * SEG + 3;
      for (let o = -RW + 1.8; o <= RW - 1.6; o += R(2.3, 3.0, rng)) {
        const deep = Math.abs(o) < RW * 0.4;
        const p = bt.path(deep ? BLUE : SKY, deep ? R(0.4, 0.55, rng) : R(0.6, 0.78, rng), R(2.4, 3.1, rng));
        const b0 = a0 + R(-3, 5, rng), b1 = a1 + R(-5, 3, rng), oo = o + J(0.5, rng);
        const q0 = at(b0, oo), q1 = at((b0 + b1) / 2, oo + J(1.1, rng)), q2 = at(b1, oo + J(0.6, rng));
        p.moveTo(q0[0], q0[1]); p.quadraticCurveTo(q1[0], q1[1], q2[0], q2[1]);
      }
      // the east bank lies in shade (light from the upper left); paper glints near the west bank
      for (let o = RW - 3.2; o <= RW - 0.9; o += 1.5) { const p = bt.path(INDIGO, R(0.3, 0.42, rng), R(1.5, 2.0, rng)); const q0 = at(a0 + R(0, 4, rng), o), q1 = at(a1 - R(0, 4, rng), o + J(0.5, rng)); p.moveTo(q0[0], q0[1]); p.lineTo(q1[0], q1[1]); }
      if (rng.next() < 0.7) { const t = R(a0, a1 - 12, rng), o = -RW * R(0.35, 0.6, rng), p = bt.path(WHITE, 0.7, 1.1), q0 = at(t, o), q1 = at(t + R(7, 13, rng), o + J(1, rng)); p.moveTo(q0[0], q0[1]); p.lineTo(q1[0], q1[1]); }
      // grass tufts in clusters along the banks
      if (rng.next() < 0.55) {
        const t = R(a0, a1, rng), sd = rng.next() < 0.5 ? -1 : 1, n = 3 + ((rng.next() * 3) | 0);
        for (let k = 0; k < n; k++) {
          const q = at(t + J(6, rng), sd * (RW + R(1.8, 4.5, rng))), h = R(2.4, 4, rng);
          if (pathDist(q[0], q[1]) > 2) tuftAt(bt, q[0], q[1], h, k & 1 ? GREEN : DGREEN, rng);
        }
      }
      // stones on the banks, in little groups
      if (rng.next() < 0.3) {
        const t = R(a0, a1, rng), sd = rng.next() < 0.5 ? -1 : 1;
        for (let k = 0; k < 1 + ((rng.next() * 3) | 0); k++) {
          const q = at(t + J(4, rng), sd * (RW + R(0.5, 2.5, rng)));
          const pb = ell(q[0], q[1], R(1.2, 2.2, rng), R(0.9, 1.5, rng), 12);
          flat(ctx, pb, GREY, 0.5);
          wax(ctx, pb, { rng, closed: true, w: 0.55, c: SLATE, dbl: false, step: 0.5, wob: 0.1 });
        }
      }
    }
    bt.flush(ctx);
    for (const sd of [-1, 1]) {
      for (let s = Math.floor(rv.t0 / 60); s <= Math.floor(rv.t1 / 60); s++) {
        const r = U.rng(U.hashInt(s, rv.seed + sd, 993)), e = [];
        for (let t = s * 60 - 2; t <= (s + 1) * 60 + 2; t += 3) e.push(at(t, sd * (RW + J(0.3, r))));
        wax(ctx, e, { rng: r, w: 1.35, c: BLUE, a: 0.95, wob: 0.35, step: 1.2 });
      }
    }
  }
  /** Plank bridge where road k crosses stream j: opaque tan deck, plank seams across, two brown rails with posts, a shadow on the water. */
  function bridgeAt(j, k) {
    let y = (k + 0.16) * PH, x = 0;
    for (let i = 0; i < 5; i++) { x = rivX(j, y); y = hPathY(k, x); }
    return [x, y];
  }
  function drawBridge(ctx, j, k) {
    const [x, y] = bridgeAt(j, k), rng = U.rng(U.hashInt(j, k, 2468));
    const x0 = x - RW - 7, x1 = x + RW + 7;
    const top = (xx) => hPathY(k, xx) - PW - 1.4, bot = (xx) => hPathY(k, xx) + PW + 1.4;
    // the bridge's shadow on the water just below the deck
    const shd = [];
    for (let xx = x - RW; xx <= x + RW; xx += 3) shd.push([xx, bot(xx) + 0.5]);
    for (let xx = x + RW; xx >= x - RW; xx -= 3) shd.push([xx, bot(xx) + 4.2]);
    scribble(ctx, shd, { rng, c: INDIGO, a: 0.45, sp: 1.3, w: 1.4, ang: 1.2, over: 0.2 });
    const deck = [];
    for (let xx = x0; xx <= x1; xx += 3) deck.push([xx, top(xx)]);
    for (let xx = x1; xx >= x0; xx -= 3) deck.push([xx, bot(xx)]);
    flat(ctx, deck, mixc(TAN, PAPER, 0.35), 1);
    scribble(ctx, deck, { rng, c: mixc(TAN, BROWN, 0.3), a: 0.85, sp: 1.2, w: 1.3, ang: 1.45, over: 0.3, bow: 0.4 });
    const bt = new Batch();
    for (let xx = x0 + 2.6; xx < x1 - 1; xx += R(2.5, 3.1, rng)) { const p = bt.path(SEPIA, R(0.6, 0.85, rng), 0.7); p.moveTo(xx + J(0.2, rng), top(xx) + 0.5); p.lineTo(xx + J(0.3, rng), bot(xx) - 0.5); }
    bt.flush(ctx);
    for (const edge of [top, bot]) {
      const rail = [];
      for (let xx = x0 - 1; xx <= x1 + 1; xx += 2) rail.push([xx, edge(xx) + (edge === top ? -0.4 : 0.4)]);
      wax(ctx, rail, { rng, w: 1.7, c: BROWN, wob: 0.2, step: 0.8 });
      for (const px of [x0, (x0 + x) / 2, x, (x + x1) / 2, x1]) { const py = edge(px) + (edge === top ? -0.4 : 0.4); dot(ctx, px, py, 1.25, SEPIA, 1); dot(ctx, px - 0.4, py - 0.4, 0.45, TAN, 1); }
    }
  }

  /** Dirt road: lengthwise tan crayon strokes, a brown shade along the lower edge, two wobbly edges, pebbles in clusters. */
  const SEG = 36;
  function pathList(info, M) {
    const out = [];
    const k0 = Math.floor((info.wy - M - 80) / PH - 0.16), k1 = Math.ceil((info.wy + info.size + M + 80) / PH - 0.16);
    for (let k = k0; k <= k1; k++) {
      let hit = false;
      for (let t = info.wx - M; t <= info.wx + info.size + M; t += 16) { const y = hPathY(k, t); if (y > info.wy - M - 20 && y < info.wy + info.size + M + 20) { hit = true; break; } }
      if (hit) out.push({ P: (t) => [t, hPathY(k, t)], n: [0, 1], t0: info.wx - M, t1: info.wx + info.size + M, seed: k * 2, h: true });
    }
    const v0 = Math.floor((info.wx - M - 300) / PV + 0.2), v1 = Math.ceil((info.wx + info.size + M + 300) / PV + 0.2);
    const kk0 = Math.floor((info.wy - M) / PH - 0.16) - 1, kk1 = Math.floor((info.wy + info.size + M) / PH - 0.16) + 1;
    for (let kv = v0; kv <= v1; kv++) {
      for (let k = kk0; k <= kk1; k++) {
        if (!vOn(kv, k)) continue;
        const r = vRange(kv, k);
        const t0 = Math.max(info.wy - M, r[0]), t1 = Math.min(info.wy + info.size + M, r[1]);
        if (t1 <= t0) continue;
        let hit = false;
        for (let t = t0; t <= t1; t += 16) { const x = vPathX(kv, t); if (x > info.wx - M - 20 && x < info.wx + info.size + M + 20) { hit = true; break; } }
        if (hit) out.push({ P: (t) => [vPathX(kv, t), t], n: [1, 0], t0, t1, seed: kv * 7919 + k * 2 + 1, r0: r[0] + PW + 1, r1: r[1] - PW - 1 });
      }
    }
    return out;
  }
  function erasePath(ctx, pa) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    for (let t = Math.floor(pa.t0 / 4) * 4, f = true; t <= pa.t1 + 4; t += 4, f = false) { const p = pa.P(Math.min(t, pa.t1)); if (f) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
    ctx.lineWidth = PW * 2 + 8;
    ctx.strokeStyle = '#000';
    ctx.lineCap = pa.h ? 'butt' : 'round';
    ctx.stroke();
    ctx.restore();
  }
  function drawPath(ctx, pa) {
    const s0 = Math.floor(pa.t0 / SEG), s1 = Math.floor(pa.t1 / SEG);
    const nx = pa.n[0], ny = pa.n[1];
    const at = (t, o) => { const p = pa.P(t); return [p[0] + nx * o, p[1] + ny * o]; };
    const band = [];
    for (let t = pa.t0; t <= pa.t1; t += 4) band.push(at(t, -PW + 0.6));
    for (let t = pa.t1; t >= pa.t0; t -= 4) band.push(at(t, PW - 0.6));
    flat(ctx, band, TAN, 0.24);
    for (let s = s0; s <= s1; s++) {
      const rng = U.rng(U.hashInt(s, pa.seed, 777));
      const a0 = Math.max(pa.t0, s * SEG - 2), a1 = Math.min(pa.t1, (s + 1) * SEG + 3);
      if (a1 - a0 < 2) continue;
      // fill: lengthwise tan crayon strokes, the way a child colours a road
      const bt = new Batch();
      for (let o = -PW + 2.2; o <= PW - 1.8; o += R(2.4, 3.2, rng)) {
        const p = bt.path(TAN, R(0.5, 0.72, rng), R(2.6, 3.4, rng));
        const b0 = a0 + R(-3, 4, rng), b1 = a1 + R(-4, 3, rng), oo = o + J(0.5, rng), bend = J(1, rng);
        const q0 = at(Math.max(pa.t0, b0), oo), q1 = at((b0 + b1) / 2, oo + bend), q2 = at(Math.min(pa.t1, b1), oo + J(0.6, rng));
        p.moveTo(q0[0], q0[1]);
        p.quadraticCurveTo(q1[0], q1[1], q2[0], q2[1]);
      }
      // shade crayon along the lower (horizontal roads) or left (side roads) edge: worn ruts
      for (let o = PW - 3.4; o <= PW - 1; o += 1.6) {
        const p = bt.path(BROWN, R(0.35, 0.5, rng), R(1.6, 2.2, rng));
        const q0 = at(a0 + R(0, 4, rng), (pa.h ? 1 : -1) * o), q1 = at(a1 - R(0, 4, rng), (pa.h ? 1 : -1) * (o + J(0.5, rng)));
        p.moveTo(q0[0], q0[1]); p.lineTo(q1[0], q1[1]);
      }
      // dirt ticks
      for (let i = 0; i < 3; i++) {
        const t = R(a0, a1, rng), o = J(PW - 3, rng), q = at(t, o), q2 = at(t + R(1.5, 3, rng), o + J(0.8, rng));
        const d = bt.path(SEPIA, 0.6, 0.8);
        d.moveTo(q[0], q[1]); d.lineTo(q2[0], q2[1]);
      }
      // where the road crosses a hill, grass tufts lean in over its edges
      const mid = at((a0 + a1) / 2, 0);
      if (fieldD('g', mid[0], mid[1]) < 1.05) {
        for (const sd of [-1, 1]) if (rng.next() < 0.7) { const q = at(R(a0, a1, rng), sd * (PW + 1.2)); tuftAt(bt, q[0], q[1] + (pa.h && sd < 0 ? 0 : 1.5), R(2.2, 3.6, rng), DGREEN, rng); }
      }
      bt.flush(ctx);
      // edges (side roads leave the main road's band clean)
      for (const sd of [-1, 1]) {
        const e = [];
        for (let t = a0 - 1; t <= a1 + 1; t += 3) {
          if (!pa.h && (t < pa.r0 || t > pa.r1)) { if (e.length > 1) wax(ctx, e.splice(0), { rng, w: 1.3, c: BROWN, a: 0.95, wob: 0.35, step: 1.2 }); e.length = 0; continue; }
          e.push(at(t, sd * (PW + J(0.3, rng))));
        }
        if (e.length > 1) wax(ctx, e, { rng, w: 1.3, c: BROWN, a: 0.95, wob: 0.35, step: 1.2 });
      }
      // pebbles in little groups near the edges
      if (rng.next() < 0.4) {
        const t = R(a0, a1, rng), o = (rng.next() < 0.5 ? -1 : 1) * R(PW - 5, PW - 2.5, rng);
        for (let k = 0; k < 1 + ((rng.next() * 3) | 0); k++) {
          const q = at(t + J(4, rng), o + J(1.5, rng));
          const pb = ell(q[0], q[1], R(1.1, 2.0, rng), R(0.9, 1.4, rng), 12);
          flat(ctx, pb, GREY, 0.45);
          wax(ctx, pb, { rng, closed: true, w: 0.55, c: SLATE, dbl: false, step: 0.5, wob: 0.1 });
        }
      }
    }
  }
  /* ---------- paper doodles: rare little clusters in the margins of the picture ---------- */
  function doodle(ctx, x, y, rng, k) {
    if (k === 0) { const st = starPts(x, y, 3, 1.3, 5, J(0.3, rng)); flat(ctx, st, YELLOW, 0.65); wax(ctx, st, { rng, closed: true, w: 0.5, c: ORANGE, dbl: false, step: 0.45, wob: 0.06 }); }
    else if (k === 1) { const h = heartPts(x, y, 3, 22); flat(ctx, h, PINK, 0.55); wax(ctx, h, { rng, closed: true, w: 0.5, c: MAGENTA, dbl: false, step: 0.45, wob: 0.06 }); }
    else if (k === 2) {
      const p = [];
      for (let i = 0; i < 22; i++) { const a = i * 0.55, rr = 0.3 + i * 0.14; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
      wax(ctx, p, { rng, w: 0.6, c: [BLUE, PURPLE, RED][(rng.next() * 3) | 0], dbl: false, step: 0.45, wob: 0.06 });
    } else {
      const col = [PINK, ORANGE, SKY, PURPLE][(rng.next() * 4) | 0];
      for (const s of [-1, 1]) {
        const w1 = ell(x + s * 2.4, y - 1.4, 2.4, 2, 12), w2 = ell(x + s * 1.9, y + 1.4, 1.6, 1.4, 10);
        flat(ctx, w1, col, 0.75); flat(ctx, w2, col, 0.75);
        wax(ctx, w1, { rng, closed: true, w: 0.45, c: shadeOf(col), dbl: false, step: 0.45, wob: 0.06 });
      }
      wax(ctx, [[x, y - 2.6], [x, y + 2.6]], { rng, w: 0.8, c: INK, dbl: false });
      wax(ctx, [[x, y - 2.6], [x - 1.2, y - 4.4]], { rng, w: 0.4, c: INK, dbl: false });
      wax(ctx, [[x, y - 2.6], [x + 1.2, y - 4.4]], { rng, w: 0.4, c: INK, dbl: false });
    }
  }
  function miniFlower(ctx, x, y, rng, col) {
    col = col || [RED, YELLOW, PINK, PURPLE, ORANGE, SKY][(rng.next() * 6) | 0];
    wax(ctx, [[x, y + 2.4], [x + J(0.6, rng), y - 1]], { rng, w: 0.6, c: DGREEN, dbl: false, wob: 0.05 });
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; dot(ctx, x + Math.cos(a) * 1.3, y - 1.6 + Math.sin(a) * 1.3, 0.95, k > 2 ? mixc(col, shadeOf(col), 0.3) : col, 0.9); }
    dot(ctx, x, y - 1.6, 0.6, col === YELLOW ? ORANGE : YELLOW, 1);
  }

  function* renderGround(ctx, info) {
    const M = 26;
    // boil variants 1–2 are baked here, one per generator step (the first chunk is built while the page loads)
    while (LAZY.length) { LAZY.shift()(); yield; }
    const box = [info.wx - M, info.wy - M, info.wx + info.size + M, info.wy + info.size + M];
    const meads = meadowsNear(box[0], box[1], box[2], box[3]);
    // 1. hills
    for (const m of meads) { drawMeadow(ctx, m, box); yield; }
    // 1b. crop fields below some road stretches
    for (const f of cropsNear(box, 4)) { drawCrop(ctx, f, box); yield; }
    // 1c. streams
    const rivers = riverList(info, M);
    for (const rv of rivers) { drawRiver(ctx, rv); yield; }
    // 2. ponds at the hill edges (a white margin is cut into the grass first)
    for (const m of meads) if (m.pond && inBox(m.pond.x, m.pond.y, box, m.pond.bound + 10)) { drawPond(ctx, m.pond); yield; }
    // 3. roads: side roads first, main roads over them (clean junctions)
    const paths = pathList(info, M);
    paths.sort((a, b) => (a.h ? 1 : 0) - (b.h ? 1 : 0));
    for (const pa of paths) erasePath(ctx, pa);
    for (const pa of paths) { drawPath(ctx, pa); yield; }
    // 3b. plank bridges where the roads cross the streams
    for (const rv of rivers) {
      for (let k = Math.floor((box[1] - 60) / PH - 0.16); k <= Math.ceil((box[3] + 60) / PH - 0.16); k++) {
        const b = bridgeAt(rv.j, k);
        if (inBox(b[0], b[1], box, 40)) drawBridge(ctx, rv.j, k);
      }
    }
    // 4. stepping stones from each front door down to the road
    for (const h of housesNear(box)) {
      const rng = U.rng(U.hashInt(h.k, h.s, 4545));
      const y1 = hPathY(h.k, h.x) - PW - 1.5;
      for (let y = h.y + 4, i = 0; y < y1 - 1; y += 5.2, i++) {
        const pb = ell(h.x + h.dx + J(0.8, rng) + (i & 1 ? 0.8 : -0.8), y, R(1.8, 2.4, rng), R(1.1, 1.5, rng), 12);
        flat(ctx, pb, GREY, 0.4);
        wax(ctx, pb, { rng, closed: true, w: 0.55, c: SLATE, dbl: false, step: 0.5, wob: 0.08 });
      }
    }
    yield;
    // 5. paper doodles: rare clusters in the open paper, away from roads and hills
    G.scatter(info, 330, 4242, 40, (x, y, rng) => {
      if (rng.next() > 0.32) return;
      if (pathDist(x, y) < 26 || riverDist(x, y) < 26 || fieldD('g', x, y) < 1.25 || fieldD('o', x, y) < 1.4 || G.nearSpawn(x, y, 60) || inCrop(x, y, 30)) return;
      const k0 = (rng.next() * 4) | 0, n = 3 + ((rng.next() * 3) | 0);
      for (let i = 0; i < n; i++) doodle(ctx, x + J(18, rng), y + J(11, rng), rng, i === 0 ? 3 : (k0 + i) % 3);
    });
    yield;
    // 6. paper tooth (wax skips the valleys) – world aligned, so chunks join seamlessly
    const res = info.res, ox = -(info.wx * res), oy = -(info.wy * res);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.92;
    let pat = ctx.createPattern(TOOTH, 'repeat');
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, ((ox % TN) + TN) % TN, ((oy % TN) + TN) % TN]));
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, info.px, info.px);
    // 7. the paper underneath
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-over';
    pat = ctx.createPattern(PAPERTEX, 'repeat');
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, ((ox % 256) + 256) % 256, ((oy % 256) + 256) % 256]));
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, info.px, info.px);
    ctx.restore();
  }

  /* ---------- props: villages along the roads, orchards and groves on the hills, reeds at the ponds ---------- */
  const HSEG = 300;
  function houseAt(k, s) {
    const rng = U.rng(U.hashInt(k, s, 8808));
    const village = U.hash2(k, Math.floor(s / 3), 8809) < 0.42;
    if (rng.next() > (village ? 0.8 : 0.06)) return null;
    const x = (s + 0.25 + rng.next() * 0.5) * HSEG;
    const y = hPathY(k, x) - PW - 14 - rng.next() * 8;
    if (G.nearSpawn(x, y, 110) || pathDist(x, y + 14) < 0 || pathDist(x, y - 30) < 4) return null;
    if (fieldD('o', x, y) < 1.5 || riverDist(x, y) < 56) return null;
    const v = (rng.next() * 3) | 0;
    return { x, y, k, s, v, dx: v === 2 ? -21 * 0.45 : 0, fence: rng.next() < 0.6, bed: rng.next() < 0.6, tree: rng.next() < 0.45, side: rng.next() < 0.5 ? 1 : -1 };
  }
  function housesNear(box) {
    const out = [];
    const k0 = Math.floor(box[1] / PH - 0.16) - 1, k1 = Math.ceil(box[3] / PH - 0.16) + 1;
    for (let k = k0; k <= k1; k++) {
      for (let s = Math.floor(box[0] / HSEG) - 1; s <= Math.floor(box[2] / HSEG) + 1; s++) {
        const h = houseAt(k, s);
        if (h && inBox(h.x, h.y, box, 40)) out.push(h);
      }
    }
    return out;
  }
  function nearHouse(x, y) {
    const k0 = Math.round(y / PH - 0.16);
    for (let k = k0 - 1; k <= k0 + 1; k++) {
      const s0 = Math.floor(x / HSEG);
      for (let s = s0 - 1; s <= s0 + 1; s++) {
        const h = houseAt(k, s);
        if (h && Math.abs(x - h.x) < 58 && y > h.y - 70 && y < h.y + 18) return true;
      }
    }
    return false;
  }
  const SWAY = { tree: 0.03, pine: 0.022, flowers: 0.06, bush: 0.018, reeds: 0.075, scarecrow: 0.014 };
  function propsFor(info) {
    const out = [];
    const P = SPR.props;
    const own = (x, y) => x >= info.wx && x < info.wx + info.size && y >= info.wy && y < info.wy + info.size;
    const add = (x, y, type, v, sh, pad) => {
      const arr = P[type];
      out.push({ x, y, type, spr: arr[Math.min(v, arr.length - 1)], sh, pad: pad || 40, ph: U.hash2(Math.round(x), Math.round(y), 17), sway: SWAY[type] || 0 });
    };
    const free = (x, y, r) => !G.nearSpawn(x, y, 80) && pathDist(x, y) > (r || 7) && riverDist(x, y) > (r || 7) + 3 && fieldD('o', x, y) > 1.25 && !nearHouse(x, y) && !inCrop(x, y, 5);
    // houses + their yards (fence, flower bunch, a tree behind)
    const box = [info.wx, info.wy, info.wx + info.size, info.wy + info.size];
    for (const h of housesNear(box)) {
      if (own(h.x, h.y)) add(h.x, h.y, 'house', h.v, SPR.shHouse, 80);
      const fx = h.x + h.side * 46, fy = h.y + 3;
      if (h.fence && own(fx, fy) && pathDist(fx, fy) > 4) add(fx, fy, 'fence', 0, SPR.shWide, 40);
      const bx = h.x - h.side * 34, byy = h.y + 4;
      if (h.bed && own(bx, byy) && pathDist(bx, byy) > 4) add(bx, byy, 'flowers', (h.k + h.s) & 1 ? 2 : 0, SPR.shSmall, 40);
      const tx = h.x + h.side * 18, ty = h.y - 26;
      if (h.tree && own(tx, ty)) add(tx, ty, 'tree', (h.s & 1) ? 2 : 0, SPR.shTree, 70);
    }
    // streams: reeds and the odd rock on the banks, never at a bridge
    for (const rv of riverList(info, 0)) {
      for (let s = Math.floor(info.wy / 44); s <= Math.floor((info.wy + info.size) / 44); s++) {
        const r = U.rng(U.hashInt(s, rv.j, 5577));
        if (r.next() > 0.34) continue;
        const y = (s + r.next()) * 44, sd = r.next() < 0.5 ? -1 : 1, x = rivX(rv.j, y) + sd * (RW + R(2.5, 4.5, r));
        const kind = r.next() < 0.78 ? 'reeds' : 'rock', v = r.next() < 0.5 ? 0 : 1;
        if (own(x, y) && pathDist(x, y) > 16 && !G.nearSpawn(x, y, 80)) add(x, y, kind, v, SPR.shSmall, 40);
      }
    }
    // crop fields: a scarecrow standing in the rows, a fence along the lower edge, a bush at a corner
    for (const f of cropsNear(box, 40)) {
      const r = U.rng(f.seed + 91);
      if (f.scare && f.kind !== 2) { const p = qpt(f.q, R(0.38, 0.62, r), R(0.42, 0.58, r)); if (own(p[0], p[1])) add(p[0], p[1], 'scarecrow', f.kind === 0 ? 0 : 1, SPR.shSmall, 60); }
      if (f.fence) {
        for (let i = 0; i < 2; i++) {
          const p = qpt(f.q, f.side + i * 0.21 - 0.1, 1);
          if (own(p[0], p[1] + 6) && pathDist(p[0], p[1] + 6) > 6 && fieldD('g', p[0], p[1] + 6) > 1.05) add(p[0], p[1] + 6, 'fence', 0, SPR.shWide, 40);
        }
      }
      if (r.next() < 0.55) {
        const c = r.next() < 0.5 ? 2 : 3, p = f.q[c], x = p[0] + (c === 2 ? 14 : -14), y = p[1] + 4;
        if (own(x, y) && pathDist(x, y) > 8 && !G.nearSpawn(x, y, 80) && fieldD('o', x, y) > 1.25) add(x, y, r.next() < 0.6 ? 'bush' : 'flowers', (r.next() * 2) | 0, SPR.shSmall, 40);
      }
    }
    // hills: an orchard, a pine grove on the upper rim, bushes on the rim, reeds + rocks at the pond
    for (const m of meadowsNear(info.wx - 60, info.wy - 60, info.wx + info.size + 60, info.wy + info.size + 60)) {
      const r = U.rng(m.seed + 77), L0 = m.lobes[0];
      const kind = m.kind < 0.42 ? 'orchard' : m.kind < 0.72 ? 'grove' : 'open';
      if (kind === 'orchard') {
        const v = (r.next() * 3) | 0, n = 3 + ((r.next() * 3) | 0), a0 = r.next() * TAU;
        for (let i = 0; i < n; i++) {
          const a = a0 + (i / n) * TAU + J(0.4, r), rr = R(0.18, 0.52, r);
          const x = L0.x + Math.cos(a) * L0.R * L0.sx * rr, y = L0.y + Math.sin(a) * L0.R * L0.sy * rr;
          if (own(x, y) && free(x, y, 12)) add(x, y, 'tree', i === n - 1 && r.next() < 0.4 ? (v + 1) % 3 : v, SPR.shTree, 70);
        }
      } else if (kind === 'grove') {
        const n = 2 + ((r.next() * 3) | 0), s = m.lobes[(r.next() * m.lobes.length) | 0];
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32 + J(0.08, r), rr = R(0.62, 0.8, r);
          const x = s.x + Math.cos(a) * s.R * s.sx * rr, y = s.y + Math.sin(a) * s.R * s.sy * rr;
          if (own(x, y) && free(x, y, 12)) add(x, y, 'pine', r.next() < 0.35 ? 1 : 0, SPR.shTree, 60);
        }
      }
      const nb = 1 + ((r.next() * 3) | 0);
      for (let i = 0; i < nb; i++) {
        const s = m.lobes[(r.next() * m.lobes.length) | 0], a = r.next() * TAU, rr = R(0.82, 0.95, r);
        const x = s.x + Math.cos(a) * shapeR(s, a) * s.sx * rr, y = s.y + Math.sin(a) * shapeR(s, a) * s.sy * rr;
        const v = (r.next() * 2) | 0;
        if (own(x, y) && free(x, y, 10)) add(x, y, r.next() < 0.3 ? 'flowers' : 'bush', v, SPR.shSmall, 40);
      }
      if (m.pond) {
        const p = m.pond, nr = 2 + ((r.next() * 3) | 0), a0 = Math.PI * 0.5 + J(0.6, r);
        for (let i = 0; i < nr; i++) {
          const a = a0 + (i - (nr - 1) / 2) * 0.42 + J(0.08, r);
          const x = p.x + Math.cos(a) * shapeR(p, a) * p.sx * 0.98, y = p.y + Math.sin(a) * shapeR(p, a) * p.sy * 0.98 + 2;
          if (own(x, y) && !G.nearSpawn(x, y, 60) && pathDist(x, y) > 6) add(x, y, 'reeds', i === 0 || r.next() < 0.6 ? 0 : 1, SPR.shSmall, 40);
        }
        const a = a0 + Math.PI * 0.8, x = p.x + Math.cos(a) * shapeR(p, a) * p.sx * 1.12, y = p.y + Math.sin(a) * shapeR(p, a) * p.sy * 1.12 + 2;
        if (r.next() < 0.6 && own(x, y) && pathDist(x, y) > 6 && !G.nearSpawn(x, y, 60)) add(x, y, 'rock', 1, SPR.shSmall, 40);
      }
    }
    // open paper: stones along the roads, rare single flowers, a rare rainbow – big calm areas stay empty
    G.scatterOwned(info, 64, 9001, (x, y, rng) => {
      if (!free(x, y, 7)) return;
      const pd = pathDist(x, y), g = fieldD('g', x, y);
      if (g < 1.15) return;
      const r = rng.next();
      if (pd < 18 && r < 0.11) add(x, y, 'rock', rng.next() < 0.7 ? 0 : 1, SPR.shSmall, 40);
      else if (pd > 60 && g > 1.5 && r > 0.996) add(x, y, 'rainbow', 0, SPR.shWide, 50);
      else if (g < 1.5 && r > 0.94) add(x, y, 'flowers', (rng.next() * 3) | 0, SPR.shSmall, 40);
    });
    return out;
  }

  /* ===================================================================================== icons (100-unit space) */
  function drawIconArt(ctx, id) {
    const rng = U.rng(id.split('').reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) >>> 0);
    const L = (pts, c, w, closed) => wax(ctx, pts, { rng, closed, w, c, step: 2.2, wob: 1.0 });
    const F = (pts, c, ang, a) => {
      flat(ctx, pts, c, 0.4);
      scribble(ctx, pts, { rng, c, a: a === undefined ? 0.9 : a, sp: 5, w: 5.6, ang: ang === undefined ? -0.6 : ang, over: 3, bow: 0.5 });
      shadeBand(ctx, pts, { rng, c: shadeOf(c), h: 0.3, sp: 4.6, w: 5, a: 0.55 });
    };
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
        for (const [x, s] of [[34, -1], [62, 1]]) { const hn = [[x - 8, 26], [x + s * 4, 6], [x + 8, 24]]; F(hn, YELLOW, 0.4); L(hn, INK, 3.5, true); }
        F(b, PURPLE, -0.7);
        L(b, INK, 5, true);
        for (const [ex, ey, er] of [[38, 46, 11], [64, 47, 9]]) { const e = ell(ex, ey, er, er, 18); flat(ctx, e, WHITE, 1); L(e, INK, 3, true); dot(ctx, ex + er * 0.3, ey + 2, er * 0.45, INK, 1); }
        const m = [[34, 66], [68, 64], [62, 78], [42, 79]];
        flat(ctx, m, [70, 20, 40], 1);
        for (let k = 0; k < 3; k++) flat(ctx, [[38 + k * 9, 66], [45 + k * 9, 66], [41.5 + k * 9, 73]], WHITE, 1);
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
        flat(ctx, sole, WHITE, 1);
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
    const sunArt = (c, r, blink) => {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + J(0.05, r), r0 = 27, r1 = i & 1 ? 37 : 44;
        if (i % 3 === 1) wax(c, [[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a + 0.08) * (r0 + r1) / 2 + 2, Math.sin(a + 0.08) * (r0 + r1) / 2], [Math.cos(a) * r1, Math.sin(a) * r1]], { rng: r, w: 2.2, c: ORANGE, wob: 0.4 });
        else wax(c, [[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1]], { rng: r, w: 2.4, c: i & 1 ? ORANGE : YELLOW, wob: 0.4 });
      }
      const d = blob(0, 0, 23, 23, r, 0.03, 40);
      flat(c, d, YELLOW, 0.6);
      scribble(c, d, { rng: r, c: YELLOW, a: 0.95, sp: 2.2, w: 2.5, ang: -0.6, over: 2.5 });
      shadeBand(c, d, { rng: r, c: ORANGE, h: 0.32, sp: 2.2, w: 2.4, a: 0.55 });
      gloss(c, d, { rng: r, c: WHITE, a: 0.8, w: 2.2 });
      wax(c, d, { rng: r, closed: true, w: 2.0, c: ORANGE, wob: 0.5, step: 1.2 });
      for (const ex of [-8, 6]) {
        if (blink) wax(c, [[ex - 2.6, -3.6], [ex, -1.8], [ex + 2.6, -3.6]], { rng: r, w: 1.5, c: INK, dbl: false, wob: 0.1 });
        else { flat(c, ell(ex, -4, 2.2, 3.2, 14), INK, 1); dot(c, ex + 0.8, -5, 0.8, [255, 255, 255], 1); }
      }
      const sm = [];
      for (let i = 0; i <= 12; i++) { const a = 0.35 + (i / 12) * 2.4; sm.push([-1 + Math.cos(a) * 11, 3 + Math.sin(a) * 8]); }
      wax(c, sm, { rng: r, w: 1.8, c: INK, dbl: false, wob: 0.2 });
      scribble(c, ell(-15, 7, 3.6, 2.6, 12), { rng: r, c: PINK, a: 0.8, sp: 1.2, w: 1.4, over: 0.4 });
      scribble(c, ell(13, 7, 3.6, 2.6, 12), { rng: r, c: PINK, a: 0.8, sp: 1.2, w: 1.4, over: 0.4 });
    };
    const sun = [0, 1, 2].map((v) => mk(-48, -48, 48, 48, (c) => sunArt(c, U.rng(900 + v), false), { k, halo: 0, tooth: 0.9 }));
    const sunBlink = mk(-48, -48, 48, 48, (c) => sunArt(c, U.rng(900), true), { k, halo: 0, tooth: 0.9 });
    const clouds = [0, 1].map((i) => [0, 1, 2].map((v) => mk(-36, -16, 36, 14, (c) => {
      const r = U.rng(950 + i * 10 + v);
      const p = puffPts(0, 0, 32 - i * 6, 12 - i * 2, 7, U.rng(960 + i), 56);
      flat(c, p, [255, 255, 255], 0.9);
      scribble(c, p, { rng: r, c: PALE, a: 0.4, sp: 2.4, w: 2.2, ang: -0.2, over: 0.6 });
      shadeBand(c, p, { rng: r, c: SKY, h: 0.3, sp: 2.2, w: 2.0, a: 0.5 });
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
    SCR = { W, H, k, sun, sunBlink, clouds, parts: [cut(0, 0, W, t), cut(0, H - t, W, t), cut(0, t, vh, H - 2 * t), cut(W - vh, t, vh, H - 2 * t)] };
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
  /** Sprite anchored at (x,y) with squash/stretch (sx, sy) and a lean (rad) around the anchor. */
  function blitT(ctx, img, s, x, y, sx, sy, rot) {
    if (!rot && sx === 1 && sy === 1) { blitC(ctx, img, s, x, y); return; }
    const k = 1 / s.k, c = Math.cos(rot || 0), sn = Math.sin(rot || 0);
    ctx.setTransform(BS * c * sx, BS * sn * sx, -BS * sn * sy, BS * c * sy, BX + x * BS, BY + y * BS);
    ctx.drawImage(img, -s.ax * k, -s.ay * k, img.width * k, img.height * k);
    ctx.setTransform(BS, 0, 0, BS, BX, BY);
  }
  function blitRot(ctx, s, x, y, ang, sc) {
    const k = (sc * BS) / s.k, c = Math.cos(ang) * k, sn = Math.sin(ang) * k;
    ctx.setTransform(c, sn, -sn, c, BX + x * BS, BY + y * BS);
    ctx.drawImage(s.c, -s.ax, -s.ay);
    ctx.setTransform(BS, 0, 0, BS, BX, BY);
  }
  /**
   * Boiling line: every drawing is redrawn from three variants 8 times a second ("on threes" at 24 fps); each actor
   * and prop has its own phase so a crowd never flips in lock-step.
   */
  const boilAt = (rt, ph) => Math.floor(rt * 8 + ph * 5.3) % 3;
  const twos = (t) => Math.floor(t * 12) / 12;
  function ghostBob(rt, ph) {
    const t = twos(rt), u = Math.sin(t * 3.4 + ph * 20);
    return 2.6 + 1.5 * Math.sign(u) * Math.pow(Math.abs(u), 0.6) + 0.35 * Math.sin(t * 7.3 + ph * 9);
  }

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
${B} { --ink:#2b2a30; --red:#e2362c; --org:#f78b1f; --yel:#fdce28; --grn:#42ae3a; --dgrn:#217a38; --sky:#42a8ea; --blu:#2a5ec8; --pur:#8c4cc4; --pnk:#f67eb4; --brn:#94582c; --paper:#fffdf6;
  --crimson:#b01c4a; --indigo:#3a3096; --pine:#166856; }
${B} #hud { padding: 20px 30px; color: var(--ink); font-family: 'Patrick Hand', 'Comic Sans MS', cursive; }
${B} #hud .xp { height: 26px; border: 2px solid #8a6326; border-radius: 3px 4px 3px 5px; overflow: hidden; transform: rotate(-.35deg);
  background: repeating-linear-gradient(90deg, rgba(110,70,25,.8) 0 1.5px, transparent 1.5px 12px) 6px 0 / 100% 7px no-repeat,
    repeating-linear-gradient(90deg, rgba(110,70,25,.8) 0 2px, transparent 2px 60px) 6px 0 / 100% 12px no-repeat, linear-gradient(180deg, #fbe08a, #f1c75a);
  box-shadow: 2px 3px 0 rgba(60,40,20,.16); }
${B} #hud .xp-fill { top: 12px; bottom: 3px; border-radius: 6px 0 0 6px;
  background: linear-gradient(180deg, transparent 52%, rgba(58,48,150,.5) 52% 100%), repeating-linear-gradient(-62deg, rgba(66,168,234,.95) 0 3px, rgba(66,168,234,.55) 3px 5px);
  clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 30%, calc(100% - 4px) 55%, 100% 80%, calc(100% - 5px) 100%, 0 100%);
  -webkit-mask-image: ${TOOTHCSS}; mask-image: ${TOOTHCSS}; }
${B} #hud .lvl { right: 10px; font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 19px; color: var(--red); text-shadow: 0 0 3px #fbe08a, 0 0 2px #fbe08a; }
${B} #hud .topline { margin-top: 16px; }
${B} #hud .hp { position: relative; gap: 8px; padding: 7px 16px 7px 9px; ${SCRAP} transform: rotate(-1.4deg); border-radius: 2px 6px 3px 5px; }
${B} #hud .hp::before { ${TAPE} left: 44%; top: -10px; transform: rotate(-5deg); }
${B} #hud .hp-icon, ${B} #hud .kills-icon { width: 42px; height: 42px; }
${B} #hud .hp-bar { width: 232px; height: 22px; background: #fff; border: 2.5px solid var(--ink); border-radius: 12px 5px 10px 4px / 5px 10px 4px 12px;
  box-shadow: inset 0 -3px 0 rgba(150,144,152,.18); }
${B} #hud .hp-fill { background: linear-gradient(180deg, rgba(255,255,255,.35) 0 18%, transparent 18% 60%, rgba(176,28,74,.55) 60% 100%),
    repeating-linear-gradient(-58deg, rgba(226,54,44,.95) 0 3.5px, rgba(226,54,44,.6) 3.5px 6px);
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 25%, calc(100% - 5px) 50%, 100% 75%, calc(100% - 6px) 100%, 0 100%);
  -webkit-mask-image: ${TOOTHCSS}; mask-image: ${TOOTHCSS}; }
${B} #hud .hp-text { font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 23px; text-shadow: none; color: var(--ink); }
${B}.hurt #hud .hp { animation: crayonWiggle .25s steps(3, end); }
${B}.hurt #hud .hp-bar { border-color: var(--red); }
@keyframes crayonWiggle { 0%,100% { transform: rotate(-1.4deg); } 30% { transform: rotate(1.5deg) translateX(-3px); } 70% { transform: rotate(-3deg) translateX(3px); } }
${B} #hud .clock { position: relative; min-width: 150px; padding: 8px 26px 6px; margin-top: -4px; transform: rotate(1.6deg);
  background: linear-gradient(180deg, #fff6a8, #ffec7e); box-shadow: 2px 4px 0 rgba(60,50,30,.12), 4px 8px 12px rgba(60,50,30,.12); border-radius: 2px 3px 14px 2px; }
${B} #hud .clock::before { ${TAPE} left: 50%; top: -11px; margin-left: -29px; transform: rotate(3deg); }
${B} #hud .clock-time { font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 40px; line-height: 1; letter-spacing: 1px; color: var(--blu); text-shadow: 2px 2px 0 rgba(58,48,150,.18);
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
${B} #levelup .card { --r: -2deg; width: 232px; min-height: 304px; padding: 42px 18px 22px; gap: 8px; color: var(--ink);
  background: linear-gradient(180deg, transparent 0 86%, rgba(226,54,44,.08) 86%), var(--paper);
  border: 3px solid var(--red); border-radius: 18px 6px 22px 5px / 6px 20px 6px 18px; transform: rotate(var(--r));
  box-shadow: 0 0 0 1.5px rgba(226,54,44,.35), 3px 6px 0 rgba(60,50,30,.12), 6px 12px 18px rgba(60,50,30,.14); transition: transform .14s cubic-bezier(.3,1.6,.5,1); }
${B} #levelup .card:nth-child(2) { --r: 1.4deg; border-color: var(--blu); background: linear-gradient(180deg, transparent 0 86%, rgba(42,94,200,.08) 86%), var(--paper);
  box-shadow: 0 0 0 1.5px rgba(42,94,200,.35), 3px 6px 0 rgba(60,50,30,.12), 6px 12px 18px rgba(60,50,30,.14); }
${B} #levelup .card:nth-child(3) { --r: -.8deg; border-color: var(--grn); background: linear-gradient(180deg, transparent 0 86%, rgba(66,174,58,.09) 86%), var(--paper);
  box-shadow: 0 0 0 1.5px rgba(66,174,58,.35), 3px 6px 0 rgba(60,50,30,.12), 6px 12px 18px rgba(60,50,30,.14); }
${B} #levelup .card:hover { transform: rotate(0deg) translateY(-8px) scale(1.03); }
${B} #levelup .card::before { ${TAPE} width: 74px; height: 22px; left: 50%; top: -12px; margin-left: -37px; transform: rotate(-3deg); }
${B} #levelup .card:nth-child(2)::before { transform: rotate(4deg); }
${B} #levelup .card-icon { width: 116px; height: 116px; }
${B} #levelup .card-name { font-family: 'Gochi Hand', cursive; font-weight: 400; font-size: 27px; line-height: 1.05; color: var(--ink); padding-bottom: 6px;
  background: ${ZIG('fdce28')} 50% 100% / 22px 7px repeat-x; }
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
    description: "A child's wax-crayon drawing brought to life: toothy white paper, layered scribble fills that go outside the lines with a cooler shade crayon underneath, wobbly outlines that boil, grassy hills and ponds, villages and striped fields along dirt roads, streams with plank bridges and a smiling sun in the corner.",
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
      const ph = p.ph || 0;
      const s = arr[boilAt(view.rt * 0.7, ph) % arr.length];
      if (p.sway) {
        // wind: a gust travels across the field (phase follows x), held on twos like the rest of the drawing
        const t = twos(view.rt);
        const k = p.sway * (0.7 * Math.sin(t * 1.3 - p.x * 0.011 + p.y * 0.003) + 0.3 * Math.sin(t * 3.1 + ph * 9));
        const kk = 1 / s.k;
        ctx.setTransform(BS, 0, -BS * k, BS, BX + p.x * BS, BY + p.y * BS);
        ctx.drawImage(s.c, -s.ax * kk, -s.ay * kk, s.c.width * kk, s.c.height * kk);
        ctx.setTransform(BS, 0, 0, BS, BX, BY);
        return;
      }
      blit(ctx, s, p.x, p.y);
    },

    drawShadow(ctx, o, view) {
      base(view);
      if (o.kind === 'prop') { if (o.sh) blit(ctx, o.sh, o.x, o.y + 0.6); return; }
      if (o.kind === 'enemy') {
        const sh = o.type === 'ghost' ? SPR.shGhost : o.type === 'colossus' ? SPR.shColossus : SPR.shCreeper;
        if (o.dying) { ctx.globalAlpha = Math.max(0, 1 - o.deathT * 1.2); blit(ctx, sh, o.x, o.y + 0.5); ctx.globalAlpha = 1; return; }
        if (o.spawnT < 1) { const s = 0.3 + 0.7 * o.spawnT; blitS(ctx, sh, o.x, o.y + 0.5, s, s); return; }
        if (o.type === 'ghost') { const s = 1.12 - ghostBob(view.rt, o.seed || 0) * 0.06; blitS(ctx, sh, o.x, o.y + 0.5, s, s); return; }
        blit(ctx, sh, o.x, o.y + 0.5);
        return;
      }
      blit(ctx, SPR.shKid, o.x, o.y + 0.5);
    },

    drawGroundOverlay(ctx, view, game) {
      if (LAZY.length) runLazy(1.5);
      base(view);
      const t = game.time, rt = view.rt;
      if (t < lastGameTime - 0.5) SCARS.length = 0;
      lastGameTime = t;
      // ambient water: little white wave marks that come and go on the ponds, each on its own beat
      if (SPR.wave) {
        for (const m of meadowsNear(view.x0 - 40, view.y0 - 40, view.x1 + 40, view.y1 + 40)) {
          const p = m.pond;
          if (!p || !inBox(p.x, p.y, [view.x0, view.y0, view.x1, view.y1], p.bound + 10)) continue;
          for (let i = 0; i < 4; i++) {
            const h = U.hash2(i, 0, p.seed), cyc = (twos(rt) * 0.45 + h) % 1;
            if (cyc > 0.62) continue;
            const a = h * TAU * 3, rr = 0.22 + 0.4 * U.hash2(i, 1, p.seed);
            const x = p.x + Math.cos(a) * p.R * p.sx * rr + cyc * 4, y = p.y + Math.sin(a) * p.R * p.sy * rr * 0.8;
            ctx.globalAlpha = cyc < 0.1 ? 0.5 : cyc > 0.52 ? 0.5 : 0.9;
            blit(ctx, SPR.wave[(i + Math.floor(rt * 6)) % 3], x, y);
          }
        }
        ctx.globalAlpha = 1;
      }
      // streams: white ripple marks drift downstream and come and go, held on twos
      if (SPR.wave) {
        const j0 = Math.floor((view.x0 - 260) / RV - 0.55), j1 = Math.ceil((view.x1 + 260) / RV - 0.55), fr = (twos(rt) * 0.32) % 1;
        for (let j = j0; j <= j1; j++) {
          const xm = rivX(j, view.y);
          if (xm < view.x0 - 240 || xm > view.x1 + 240) continue;
          for (let n = Math.floor((view.y0 - 30) / 41); n <= Math.floor((view.y1 + 30) / 41); n++) {
            const h = U.hash2(n, j, 4321);
            if (h < 0.3) continue;
            const f = (fr + h * 3) % 1, y = n * 41 + f * 26, x = rivX(j, y) + (U.hash2(n, j, 4322) - 0.5) * RW * 1.1;
            if (x < view.x0 - 10 || x > view.x1 + 10 || pathDist(x, y) < 3) continue;
            ctx.globalAlpha = 0.9 * Math.sin(f * Math.PI);
            blit(ctx, SPR.wave[(n + Math.floor(rt * 6)) % 3], x, y);
          }
        }
        ctx.globalAlpha = 1;
      }
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
      const rt = view.rt, ph = g.seed || 0, v = boilAt(rt, ph);
      const t = twos(rt);
      const bob = Math.sin(t * 3 + ph * 20) * 0.9;
      blit(ctx, SPR.shGem, g.x, g.y + 0.6);
      const spr = g.big ? SPR.gemBig[v] : SPR.gem[v];
      if (g.pop > 0) { const s = 1 + g.pop * 0.6; blitS(ctx, spr, g.x, g.y - g.pop * 4, s, s); return; }
      if (g.big) blitRot(ctx, spr, g.x, g.y - 0.5 + bob, Math.sin(t * 2 + ph * 9) * 0.15, 1);
      else blit(ctx, spr, g.x, g.y - 0.5 + bob);
      // twinkle: a four-point sparkle pops on for two drawings every ~1.7 s
      const tw = (t * 0.6 + ph * 7) % 1;
      if (tw < 0.1) blitRot(ctx, SPR.spark[g.big ? 1 : 0], g.x + (g.big ? 5.5 : 3.2), g.y - (g.big ? 11 : 6.5) + bob, 0, tw < 0.05 ? 0.55 : 0.85);
    },

    drawEnemy(ctx, e, view) {
      base(view);
      const set = SPR[e.type];
      if (!set) return;
      const rt = view.rt, fi = e.facing < 0 ? 1 : 0, ph = e.seed || 0;
      let fr;
      if (e.type === 'ghost') fr = Math.floor(rt * 9 + ph * 6) % 6;
      else if (e.type === 'colossus') fr = Math.floor(e.anim * 3) % 6;
      else fr = Math.floor(e.anim * 2.6) % 6;
      const v = boilAt(rt, ph);
      const s = set[fi][fr][v];
      let y = e.y;
      if (e.type === 'ghost') y -= ghostBob(rt, ph);
      const cy = y - (e.type === 'colossus' ? 22 : e.type === 'ghost' ? 12 : 11);
      const sc = e.type === 'colossus' ? 2.3 : e.type === 'ghost' ? 1.15 : 1.05;
      if (e.dying) {
        // 1. struck: squash + paper-white flash; 2. the child scribbles it out, stroke by stroke, while it shivers;
        // 3. it melts flat into the paper and the scribble knot drops to the ground (a colour smudge stays behind)
        const u = e.deathT;
        const lvl = u < 0.06 ? -1 : u < 0.2 ? 0 : u < 0.32 ? 1 : u < 0.44 ? 2 : 3;
        if (u < 0.55) {
          const q = u < 0.2 ? 1 : 0.35;
          const shiv = u >= 0.2 ? ((Math.floor(rt * 24) & 1) ? 0.7 : -0.7) : 0;
          blitT(ctx, s.c, s, e.x + shiv, y, 1 + 0.18 * q, 1 - 0.14 * q, 0);
          if (s.f && u < 0.2) { ctx.globalAlpha = 0.8; blitT(ctx, s.f, s, e.x, y, 1.18, 0.86, 0); ctx.globalAlpha = 1; }
          if (lvl >= 0) blitS(ctx, SPR.scratch[lvl][v], e.x + shiv, cy, sc, sc);
        } else {
          const k = (u - 0.55) / 0.45, ke = k * k;
          ctx.globalAlpha = Math.max(0, 1 - k * 1.5);
          blitT(ctx, s.c, s, e.x, y, 1 + 0.35 * ke, Math.max(0.12, 1 - 0.88 * ke), 0);
          ctx.globalAlpha = Math.max(0, 1 - ke);
          const ss = sc * (1 - 0.62 * ke);
          blitS(ctx, SPR.scratch[3][v], e.x, cy + (y - cy) * ke * 0.85, ss, ss);
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (e.spawnT < 1) {
        // being drawn: a grey construction sketch is drawn left to right, then the colour is filled in from the top
        // with the crayon tip zigzagging along, then the finished drawing pops (squash & stretch)
        const t = e.spawnT, k = 1 / s.k, w = s.c.width, h = s.c.height;
        const sk = SPR.sketch[e.type][fi][v];
        const dx = e.x - s.ax * k, dy = y - s.ay * k;
        if (t < 0.3) {
          const q = U.ease.outQuad(t / 0.3), cols = Math.max(1, Math.round(sk.c.width * q));
          ctx.drawImage(sk.c, 0, 0, cols, sk.c.height, dx, dy, cols * k, sk.c.height * k);
          blitRot(ctx, SPR.crayon[6][v], dx + cols * k + 3, dy + h * k * (0.5 + 0.3 * Math.sin(twos(t) * 70)) - 4, 1.0, 0.75);
        } else if (t < 0.88) {
          ctx.drawImage(sk.c, dx, dy, sk.c.width * k, sk.c.height * k);
          const q = U.ease.outQuad((t - 0.3) / 0.58), rows = Math.max(1, Math.round(h * q));
          ctx.drawImage(s.c, 0, 0, w, rows, dx, dy, w * k, rows * k);
          const col = e.type === 'colossus' ? 1 : e.type === 'ghost' ? 3 : 2;
          const tx = dx + (0.5 + 0.38 * Math.sin(twos(t) * 46 + ph * 9)) * w * k, ty = dy + rows * k;
          blitRot(ctx, SPR.crayon[col][v], tx - 3, ty - 5, 1.0, 0.8);
        } else {
          const p = Math.sin(((t - 0.88) / 0.12) * Math.PI);
          blitT(ctx, s.c, s, e.x, y, 1 - 0.08 * p, 1 + 0.12 * p, 0);
        }
        return;
      }
      // hit: two held drawings – a hard squash leaning away from the blow with a paper-white flash, then half of it
      const f = e.flash;
      if (f > 0.2) {
        const q = f > 0.55 ? 1 : 0.45;
        const lean = U.clamp((e.kx || 0) / 90, -1, 1) * 0.22 * q;
        const sx = 1 + 0.2 * q, sy = 1 - 0.16 * q;
        blitT(ctx, s.c, s, e.x, y, sx, sy, lean);
        if (s.f) {
          ctx.globalAlpha = q > 0.5 ? (e.type === 'colossus' ? 0.7 : 0.88) : 0.35;
          blitT(ctx, s.f, s, e.x, y, sx, sy, lean);
          ctx.globalAlpha = 1;
        }
        return;
      }
      blit(ctx, s, e.x, y);
    },

    drawPlayer(ctx, p, view) {
      base(view);
      const rt = view.rt;
      const fi = p.facing < 0 ? 1 : 0;
      const v = boilAt(rt, 0.37);
      const KS = SPR.kid;
      let s, sx = 1, sy = 1;
      if (p.hurtT > 0.62) s = KS.hurt[fi][v];
      else if (p.dashT > 0) { s = KS.dash[fi][Math.floor(rt * 12) & 1][v]; sx = 1.07; sy = 0.95; }
      else if (p.moving) s = KS.walk[fi][Math.floor(p.anim * 1.3) & 7][v];
      else s = KS.idle[fi][IDLESEQ[Math.floor(rt * 3.3) % IDLESEQ.length]][v];
      if (p.levelT > 0) {
        // glow-up: a rainbow loop and sun rays turn around the kid on held drawings, stars orbit outward
        const u = 1 - p.levelT, tq = twos(rt);
        ctx.globalAlpha = Math.min(1, p.levelT * 2.2);
        blitRot(ctx, SPR.rays[v], p.x, p.y - 14, Math.floor(tq * 4) * 0.22, 1.0 + U.ease.outQuad(u) * 0.5);
        blitRot(ctx, SPR.ring[v], p.x, p.y - 14, tq * 0.8, 1.1 + U.ease.outQuad(u) * 0.7);
        for (let i = 0; i < 5; i++) {
          const a = tq * 2 + (i / 5) * TAU, r = 18 + U.ease.outQuad(u) * 12;
          blitRot(ctx, SPR.star[i % 2 ? 0 : 3], p.x + Math.cos(a) * r, p.y - 14 + Math.sin(a) * r * 0.8, Math.floor(a * 2) * 0.5, 0.8);
        }
        ctx.globalAlpha = 1;
      }
      if (p.dashT > 0) {
        const ang = Math.atan2(p.dashY, p.dashX);
        ctx.globalAlpha = 0.85;
        blitRot(ctx, SPR.lines, p.x - p.dashX * 8, p.y - 14 - p.dashY * 4, ang, 1.3);
        ctx.globalAlpha = 0.25;
        blit(ctx, s, p.x - p.dashX * 11, p.y - p.dashY * 11);
        ctx.globalAlpha = 1;
      }
      const since = (performance.now() - hurtAt) / 1000;
      const blink = p.iframes > 0 && since < 0.9 && (Math.floor(since * 12) & 1) === 1;
      ctx.globalAlpha = blink ? 0.55 : 1;
      blitT(ctx, s.c, s, p.x, p.y, sx, sy, 0);
      if (p.hurtT > 0 && s.h) {
        ctx.globalAlpha = p.hurtT > 0.62 ? 0.75 : Math.min(0.6, p.hurtT);
        blitT(ctx, s.h, s, p.x, p.y, sx, sy, 0);
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      base(view);
      const v = boilAt(view.rt, (o.idx || 0) * 0.31);
      const col = [0, 2, 1, 3, 4][o.idx % 5];
      const tang = o.angle + Math.PI / 2;
      // two short motion lines behind the crayon
      const bx = -Math.cos(tang), by = -Math.sin(tang);
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(96,98,132,0.55)';
      ctx.beginPath();
      for (const s of [-2.2, 2.2]) {
        const px = o.x + by * s + bx * 8, py = o.y - bx * s + by * 8;
        ctx.moveTo(px, py);
        ctx.lineTo(px + bx * (s < 0 ? 7 : 5), py + by * (s < 0 ? 7 : 5));
      }
      ctx.stroke();
      blitRot(ctx, SPR.crayon[col][v], o.x, o.y, tang + 0.35 * Math.sin(twos(view.rt) * 5 + o.idx), 1.05);
    },

    drawProjectile(ctx, pr, view) {
      base(view);
      const a = Math.atan2(pr.vy, pr.vx);
      const k = Math.min(1, pr.age * 8);
      const v = boilAt(view.rt, pr.seed || 0);
      ctx.globalAlpha = 0.9;
      blitRot(ctx, SPR.trail[v], pr.x, pr.y, a, 0.4 + 0.6 * k);
      ctx.globalAlpha = 1;
      // the ball tumbles in held 45° steps (drawn on twos)
      blitRot(ctx, SPR.ball[v], pr.x, pr.y, Math.floor(pr.spin * 0.9) * 0.785, 1);
    },

    drawParticle(ctx, pt, view) {
      base(view);
      const life = pt.life / pt.max, age = 1 - life;
      const sec = pt.max - pt.life;
      if (pt.delay && sec < pt.delay) return;
      const c = (pt.c | 0) % 8;
      const y = pt.y - pt.z;
      const rot = Math.round(pt.rot / 0.4) * 0.4; // held rotation steps
      switch (pt.kind) {
        case 'pow': {
          // pops in with an overshoot in two drawings, holds, then shrinks away
          const s = pt.size * (sec < 0.04 ? 0.6 : sec < 0.09 ? 1.22 : 1.05 - Math.max(0, age - 0.5) * 0.9);
          ctx.globalAlpha = life < 0.25 ? life / 0.25 : 1;
          blitRot(ctx, SPR.pow[(pt.seed * 3) | 0], pt.x, y, pt.rot, s);
          break;
        }
        case 'tick': {
          const s = pt.size * (sec < 0.045 ? 0.75 : 1.15);
          blitRot(ctx, SPR.tick[(pt.seed * 3) | 0], pt.x, y, pt.rot, s);
          break;
        }
        case 'zig': {
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.zig[c], pt.x, y, rot, pt.size);
          break;
        }
        case 'curl': {
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.curl[c], pt.x, y, rot, pt.size * (0.6 + twos(age) * 0.6));
          break;
        }
        case 'shave': {
          ctx.globalAlpha = life < 0.3 ? life / 0.3 : 1;
          blitRot(ctx, SPR.shave[c], pt.x, y, rot, pt.size);
          break;
        }
        case 'star': {
          const a2 = twos(sec) / pt.max;
          const s = pt.size * (a2 < 0.2 ? 0.5 + a2 / 0.2 * 0.6 : 1.1 - (a2 - 0.2) * 0.7);
          blitRot(ctx, SPR.star[c], pt.x, y, rot, Math.max(0.05, s));
          break;
        }
        case 'spark': {
          ctx.globalAlpha = life < 0.35 ? life / 0.35 : 1;
          blitRot(ctx, SPR.spark[c & 1], pt.x, y, 0, pt.size * (sec < 0.05 ? 0.6 : 1.1 - age * 0.5));
          break;
        }
        case 'heart': {
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.heart[c & 1], pt.x, y, Math.sin(twos(sec) * 9 + pt.seed * 6) * 0.25, pt.size * (0.6 + Math.min(1, age * 5) * 0.4));
          break;
        }
        case 'crumb': {
          ctx.globalAlpha = life < 0.3 ? life / 0.3 : 1;
          blitRot(ctx, SPR.crumb[c], pt.x, y, rot, pt.size);
          break;
        }
        case 'puff': {
          const s = pt.size * (0.6 + U.ease.outQuad(twos(sec) / pt.max) * 0.8);
          ctx.globalAlpha = Math.min(1, life * 1.6) * 0.95;
          blitS(ctx, SPR.puff[(pt.seed * 3) | 0], pt.x, y, s, s);
          break;
        }
        case 'ring': {
          const s = pt.size * (0.4 + U.ease.outQuad(twos(sec) / pt.max) * 1.1);
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.ring[(pt.seed * 3) | 0], pt.x, y, pt.rot + Math.floor(age * 6) * 0.25, s);
          break;
        }
        case 'rays': {
          const s = pt.size * (0.5 + U.ease.outQuad(twos(sec) / pt.max) * 0.9);
          ctx.globalAlpha = life < 0.45 ? life / 0.45 : 1;
          blitRot(ctx, SPR.rays[(pt.seed * 3) | 0], pt.x, y, pt.rot + Math.floor(age * 6) * 0.2, s);
          break;
        }
        case 'lines': {
          ctx.globalAlpha = life;
          blitRot(ctx, SPR.lines, pt.x, y, pt.rot, pt.size);
          break;
        }
        default: {
          // particles of other styles' generic bursts: a short crayon crumb in the nearest crayon colour
          ctx.globalAlpha = life < 0.3 ? life / 0.3 : 1;
          blitRot(ctx, SPR.crumb[(pt.seed * 8) | 0], pt.x, y, rot, Math.max(0.6, (pt.size || 2) * 0.5));
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
      const k = SCR.k, v = boilAt(view.rt * 0.75, 0.6), rt = view.rt, tq = twos(rt);
      // two clouds drifting along the top edge (moved on twos)
      for (let i = 0; i < 2; i++) {
        const cl = SCR.clouds[i][v];
        const span = view.W + 90 * k;
        const x = ((view.W * (0.18 + i * 0.4) + tq * (5 + i * 3) * k) % span) - 45 * k;
        const y = (22 + i * 16) * k;
        ctx.drawImage(cl.c, Math.round(x - cl.ax), Math.round(y - cl.ay));
      }
      // the sun with a face in the corner: rocks in held steps and blinks now and then
      const sun = (rt % 4.2) > 4.05 ? SCR.sunBlink : SCR.sun[v];
      const sx = view.W - 34 * k, sy = 34 * k;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.sin(Math.floor(rt * 4) / 4 * 0.8) * 0.06);
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
      // core: black impact dashes (two drawings) → main: a coloured bolt → debris: crumbs in the creature's colours
      const big = e.type === 'colossus';
      const hy = e.y - e.r * (big ? 1.4 : 1.2);
      game.addParticle({ x: e.x + (Math.random() - 0.5) * 3, y: hy, z: 0, kind: 'tick', life: 0.13, size: big ? 1.05 : 0.7, rot: Math.random() * TAU, seed: Math.random(), drag: 0 });
      game.addParticle({ x: e.x + (Math.random() - 0.5) * 4, y: hy - 2, z: 0, kind: 'zig', c: src === 'lantern' ? 6 : src === 'dash' ? 2 : 0, life: 0.3, size: big ? 1.3 : 0.95, rot: Math.random() * TAU, drag: 0 });
      const cols = ECOL[e.type] || [7];
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 40;
        game.addParticle({ x: e.x, y: e.y, z: e.r * 1.1, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 25 + Math.random() * 30, grav: 170, kind: 'crumb', c: pickC(cols), life: 0.5, size: 0.8 + Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, drag: 1.5 });
      }
    },
    onKill(game, e) {
      // core: POW star → main: stars and swirls flying out → debris: crayon shavings + crumbs → residue: smudge
      const big = e.type === 'colossus';
      const cols = ECOL[e.type] || [7];
      const cy = e.y - e.r * (big ? 1.3 : 1.1);
      game.addParticle({ x: e.x, y: cy, z: 0, kind: 'pow', life: big ? 0.55 : 0.42, size: big ? 1.7 : e.type === 'ghost' ? 0.85 : 1.0, rot: Math.random() * TAU, seed: Math.random(), drag: 0 });
      game.addParticle({ x: e.x, y: cy, z: 0, kind: 'tick', life: 0.16, size: big ? 1.9 : 1.2, rot: Math.random() * TAU, seed: Math.random(), drag: 0 });
      const ns = big ? 6 : 4;
      for (let i = 0; i < ns; i++) {
        const a = (i / ns) * TAU + Math.random() * 0.8, s = (big ? 75 : 55) + Math.random() * 30;
        game.addParticle({ x: e.x, y: cy, z: 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, kind: i % 2 ? 'curl' : 'star', c: i % 2 ? pickC(cols) : pickC([0, 0, 6, 3, 2]), life: 0.5 + Math.random() * 0.2, size: big ? 1.0 : 0.75, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 6, drag: 3.5, delay: i * 0.02 });
      }
      const nc = big ? 12 : e.type === 'ghost' ? 5 : 7;
      for (let i = 0; i < nc; i++) {
        const a = Math.random() * TAU, s = (big ? 60 : 40) + Math.random() * 50;
        game.addParticle({ x: e.x, y: e.y, z: e.r * (0.6 + Math.random()), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 50, grav: 220, kind: i % 3 === 0 ? 'shave' : 'crumb', c: pickC(cols), life: 0.6 + Math.random() * 0.4, size: (big ? 1.2 : 0.85) + Math.random() * 0.35, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 18, drag: 1.2 });
      }
      if (big) for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; game.addParticle({ x: e.x + Math.cos(a) * 16, y: cy + Math.sin(a) * 12, z: 0, kind: 'zig', c: 1, life: 0.4, size: 1.4, rot: a, drag: 0, delay: 0.04 }); }
      if (SCARS.length > 50) SCARS.shift();
      SCARS.push({ x: e.x, y: e.y - (big ? 3 : 1), s: big ? 2 : e.type === 'ghost' ? 0.75 : 1, c: SCARCOL[e.type] === undefined ? 3 : SCARCOL[e.type], v: (Math.random() * 2) | 0, flip: Math.random() < 0.5, born: game.time, life: 2.6 });
    },
    onHurt(game, p) {
      hurtAt = performance.now();
      game.addParticle({ x: p.x, y: p.y - 16, z: 0, kind: 'tick', life: 0.15, size: 1.1, rot: Math.random() * TAU, seed: Math.random(), drag: 0 });
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
      // core twinkle -> a few short crayon dashes flicked outward in the gem's blue -> a star / heart floats up as residue
      game.addParticle({ x: g.x, y: g.y - 6, z: 0, kind: 'spark', c: g.big ? 1 : 0, life: 0.22, size: g.big ? 1.3 : 0.85, rot: 0, drag: 0 });
      const n = g.big ? 5 : 3, a0 = Math.random() * TAU;
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * TAU, sp = g.big ? 95 : 70;
        game.addParticle({ x: g.x + Math.cos(a) * 3, y: g.y - 6 + Math.sin(a) * 3, z: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, kind: 'shave', c: i & 1 ? 2 : 0, life: 0.26, size: g.big ? 0.75 : 0.55, rot: a, drag: 9 });
      }
      game.addParticle({ x: g.x + (Math.random() - 0.5) * 10, y: g.y - 16 - Math.random() * 8, z: 0, vy: -26, kind: g.big ? 'heart' : 'star', c: g.big ? 0 : 2, life: 0.45, size: g.big ? 1.0 : 0.55, rot: Math.random(), drag: 2.5, delay: 0.05 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.3) game.addParticle({ x: pr.x, y: pr.y + 2, z: 0, vx: pr.vx * 0.04, vy: pr.vy * 0.04, kind: 'puff', life: 0.3, size: 0.45, seed: Math.random(), drag: 4 });
    },
    onDash(game, p) {
      for (let i = 0; i < 3; i++) game.addParticle({ x: p.x - p.dashX * (4 + i * 6) + (Math.random() - 0.5) * 4, y: p.y - 1 - p.dashY * i * 5, z: 0, vx: -p.dashX * 18, vy: -p.dashY * 18 - 6, kind: 'puff', life: 0.5, size: 1.1 - i * 0.2, seed: Math.random(), drag: 3, delay: i * 0.03 });
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'rays', life: 0.55, size: 1.2, rot: 0, seed: Math.random(), drag: 0 });
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'ring', life: 0.7, size: 1.5, rot: 0, seed: Math.random(), drag: 0, delay: 0.05 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        game.addParticle({ x: p.x, y: p.y - 14, z: 0, vx: Math.cos(a) * 75, vy: Math.sin(a) * 75, kind: i & 1 ? 'heart' : 'star', c: i & 1 ? 0 : [0, 2, 3, 4][(i >> 1) & 3], life: 0.7, size: 0.95, rot: a, drag: 3, delay: 0.08 + (i & 3) * 0.03 });
      }
    },
    onDeath(game, p) {
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'pow', life: 0.8, size: 2.0, rot: 0, seed: 0.5, drag: 0 });
      for (let i = 0; i < 6; i++) game.addParticle({ x: p.x + (Math.random() - 0.5) * 14, y: p.y - Math.random() * 10, z: 0, vy: -10, kind: 'puff', life: 1.0, size: 1.4 + Math.random() * 0.6, seed: Math.random(), drag: 2, delay: i * 0.04 });
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * TAU, s = 50 + Math.random() * 70;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 60, grav: 220, kind: i % 3 ? 'crumb' : 'shave', c: [1, 2, 0, 7][i % 4], life: 1.0, size: 1 + Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 18, drag: 1.2 });
      }
    },
  });
})();
