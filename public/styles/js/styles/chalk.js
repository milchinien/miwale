/* Chalkboard – a world drawn live with chalk on a slate-green school blackboard.
   Side-of-the-chalk fills (streaky, broken by the board's tooth) under tip-of-the-chalk outlines, cool
   lavender / blue hatching in the shadows and warm yellow strokes in the light (light from above-left),
   old eraser wipes with half-erased ghost drawings, chalk dust that falls and settles. Actors are drawn
   per pose and redrawn ("boiled") on twos; they are sketched in when they appear and wiped out by a felt
   eraser when they go. No glow, no gradients-as-light, everything matte and hand-made. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;

  /* ===================================================================================== palette */
  const BOARD = [37, 51, 45];   // #25332d slate board
  const cBoard = 'rgb(37,51,45)';
  const CDK = [28, 40, 35];     // #1c2823 deep board (damp sponge marks, text shadows)
  const CW = [238, 238, 229];   // #eeeee5 white chalk
  const CO = [248, 156, 82];    // #f89c52 pumpkin orange
  const CDO = [222, 108, 52];   // #de6c34 deep orange
  const CL = [194, 172, 236];   // #c2acec lavender
  const CV = [150, 128, 206];   // #9680ce violet (cool shadow hatching)
  const CM = [152, 222, 178];   // #98deb2 mint
  const CG = [112, 188, 126];   // #70bc7e leaf green
  const CY = [249, 229, 140];   // #f9e58c butter yellow
  const CP = [247, 168, 198];   // #f7a8c6 pink
  const CB = [158, 204, 240];   // #9eccf0 light blue
  const CC = [244, 232, 206];   // #f4e8ce cream
  const CWD = [176, 128, 88];   // #b08058 wood brown (eraser)
  const PALL = [CW, CO, CL, CM, CY, CP, CB];
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';

  let K = 2.5; // sprite px per world unit
  /** Groups many strokes by (colour, alpha, width) into Path2Ds – far fewer stroke() calls. */
  class Batch {
    constructor() { this.m = new Map(); }
    path(c, a, w) {
      const aq = Math.round(a * 20) / 20, wq = Math.round(w * 10) / 10;
      const k = c[0] + ',' + c[1] + ',' + c[2] + '|' + aq + '|' + wq;
      let b = this.m.get(k);
      if (!b) { b = { p: new Path2D(), s: rgba(c, aq), w: wq }; this.m.set(k, b); }
      return b.p;
    }
    flush(ctx) { for (const b of this.m.values()) { ctx.lineWidth = b.w; ctx.strokeStyle = b.s; ctx.stroke(b.p); } this.m.clear(); }
  }
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const R = (a, b, rng) => a + (b - a) * rng.next();
  const J = (s, rng) => (rng.next() - 0.5) * 2 * s;

  /* ===================================================================================== geometry */
  function ell(cx, cy, rx, ry, n, rot, a0) {
    n = n || 28;
    const out = [], c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    for (let i = 0; i < n; i++) {
      const a = (a0 || 0) + (i / n) * TAU;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
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
  function shift(pts, dx, dy) { return pts.map((p) => [p[0] + dx, p[1] + dy]); }
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

  /* ===================================================================================== chalk toolkit */
  /** Chalk line: runs of varying pressure + a lighter double pass. */
  function stroke(ctx, pts, o) {
    const rng = o.rng, w = o.w || 1, a = o.a === undefined ? 1 : o.a, c = o.c || CW;
    const j = o.j === undefined ? 0.12 : o.j;
    const P = resample(pts, !!o.closed, o.step || 1.0);
    if (o.closed && P.length > 5) {
      const ov = 1 + ((rng.next() * 3) | 0);
      for (let i = 1; i <= ov; i++) P.push(P[i].slice());
    }
    for (const p of P) { p[0] += J(j, rng); p[1] += J(j, rng); }
    if (P.length < 2) return;
    let i = 0;
    while (i < P.length - 1) {
      const e = Math.min(P.length - 1, i + 3 + ((rng.next() * 5) | 0));
      ctx.beginPath();
      ctx.moveTo(P[i][0], P[i][1]);
      for (let k = i + 1; k <= e; k++) ctx.lineTo(P[k][0], P[k][1]);
      ctx.lineWidth = w * (0.78 + rng.next() * 0.4);
      ctx.strokeStyle = rgba(c, a * (0.72 + rng.next() * 0.28));
      ctx.stroke();
      i = e;
    }
    if (o.dbl !== false && P.length > 2) {
      const ox = J(w * 0.32, rng), oy = J(w * 0.32, rng);
      ctx.beginPath();
      ctx.moveTo(P[0][0] + ox, P[0][1] + oy);
      for (let k = 1; k < P.length; k++) ctx.lineTo(P[k][0] + ox + J(0.08, rng), P[k][1] + oy + J(0.08, rng));
      ctx.lineWidth = w * 0.45;
      ctx.strokeStyle = rgba(c, a * 0.4);
      ctx.stroke();
    }
  }
  /** Sketch mode: while true, only tip lines are drawn (fills, rubs and hatching are skipped). Used to bake the
      construction sketch that creatures are drawn in from. */
  let SK = false;
  function bbox(pts) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2 };
  }
  /**
   * Side-of-the-chalk fill: dense parallel drags of a chalk stick laid flat, broken into dashes where the stick
   * skips over the board's tooth. Pressure varies slowly across the band (streaks), and `lit` makes the strokes
   * heavier towards the light (upper left) – that is where volume comes from, not from gradients.
   */
  function side(ctx, pts, o) {
    if (SK) return;
    const rng = o.rng, ang = o.ang === undefined ? -0.42 : o.ang, sp = o.sp || 0.46, w = o.w || 0.56;
    const c = o.c || CW, a = o.a === undefined ? 0.55 : o.a, gap = o.gap === undefined ? 0.28 : o.gap, lit = o.lit || 0;
    const b = bbox(pts), Rr = Math.hypot(b.rx, b.ry) + 1;
    ctx.save();
    ctx.beginPath(); poly(ctx, pts); ctx.clip();
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const bt = new Batch();
    const ph = rng.next() * 6;
    for (let off = -Rr; off <= Rr; off += sp * (0.8 + rng.next() * 0.4)) {
      const press = 0.62 + 0.38 * Math.sin(off * 0.85 + ph) * Math.sin(off * 0.31 + ph * 2);
      const bx = b.cx + nx * off, by = b.cy + ny * off;
      let s = -Rr - rng.next() * 2;
      while (s < Rr) {
        const L = R(1.1, 4.6, rng);
        if (rng.next() > gap) {
          let al = a * press * R(0.55, 1, rng);
          if (lit) {
            const mx = bx + dx * (s + L / 2) - b.cx, my = by + dy * (s + L / 2) - b.cy;
            const l = (-mx * 0.6 - my * 0.8) / (Math.max(b.rx, b.ry) + 0.01);
            al *= clamp01(0.5 + 0.5 * l * lit + 0.25);
          }
          const p = bt.path(c, al, w * R(0.8, 1.35, rng));
          p.moveTo(bx + dx * s, by + dy * s); p.lineTo(bx + dx * (s + L), by + dy * (s + L));
        }
        s += L + R(0.15, 1.3, rng);
      }
    }
    bt.flush(ctx);
    ctx.restore();
  }
  /** Closed tip-of-the-chalk outline, pressed harder (thicker) on the shadow side (lower right). */
  function outline(ctx, pts, o) {
    stroke(ctx, pts, { rng: o.rng, closed: true, w: o.w || 0.9, c: o.c || CW, a: o.a === undefined ? 1 : o.a, j: o.j });
    if (o.weight === 0) return;
    const b = bbox(pts), n = pts.length, run = [];
    const flush = () => { if (run.length > 2) stroke(ctx, run.slice(), { rng: o.rng, w: (o.w || 0.9) * (o.weight || 0.75), c: o.c || CW, a: 0.9, dbl: false, j: 0.06 }); run.length = 0; };
    for (let i = 0; i <= n; i++) {
      const p = pts[i % n];
      const k = ((p[0] - b.cx) * 0.55 + (p[1] - b.cy) * 0.85) / (Math.max(b.rx, b.ry) + 0.01);
      if (k > 0.28) run.push([p[0] + 0.18, p[1] + 0.22]); else flush();
    }
    flush();
  }
  /**
   * The shading recipe every form uses: occlude the board, a faint rubbed dust film, side-of-the-chalk body
   * colour heavier in the light, cool hatching on the shadow side, a warm stroke in the light, weighted outline.
   */
  function form(ctx, pts, o) {
    const rng = o.rng;
    fillBoard(ctx, pts);
    if (!SK) {
      const b = bbox(pts);
      if (o.rubA !== 0) rub(ctx, pts, o.c, o.rubA || 0.14);
      side(ctx, pts, { rng, c: o.c, a: o.a === undefined ? 0.62 : o.a, ang: o.ang, lit: o.lit === undefined ? 1 : o.lit, sp: o.sp, gap: o.gap });
      ctx.save();
      ctx.beginPath(); poly(ctx, pts); ctx.clip();
      if (o.sh !== null) {
        const sh = ell(b.cx + b.rx * 0.62, b.cy + b.ry * 0.7, b.rx * 1.05, b.ry * 0.95, 20);
        hatch(ctx, sh, { rng, ang: o.shAng === undefined ? 0.82 : o.shAng, sp: o.shSp || 1.05, w: 0.36, c: o.sh || CV, a: o.shA || 0.8 });
      }
      if (o.hi) side(ctx, ell(b.cx - b.rx * 0.38, b.cy - b.ry * 0.5, b.rx * 0.5, b.ry * 0.34, 16), { rng, c: o.hi, a: o.hiA || 0.7, ang: -0.42, sp: 0.42, gap: 0.2 });
      ctx.restore();
    }
    if (o.line !== null) outline(ctx, pts, { rng, c: o.line || CW, w: o.lw || 0.9, weight: o.weight });
  }
  /** Loose parallel hatching clipped to a polygon. */
  function hatch(ctx, pts, o) {
    if (SK) return;
    const rng = o.rng, ang = o.ang === undefined ? 0.9 : o.ang, sp = o.sp || 1.4, w = o.w || 0.45;
    const c = o.c || CW, a = o.a === undefined ? 0.7 : o.a, skip = o.skip || 0;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, Rr = Math.hypot(x1 - x0, y1 - y0) / 2 + 1;
    const ins = o.inset || 1;
    ctx.save();
    ctx.beginPath();
    poly(ctx, ins !== 1 ? pts.map((p) => [cx + (p[0] - cx) * ins, cy + (p[1] - cy) * ins]) : pts);
    ctx.clip();
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const bt = new Batch();
    for (let off = -Rr; off <= Rr; off += sp * (0.75 + rng.next() * 0.5)) {
      if (rng.next() < skip) continue;
      const s0 = -Rr * (0.55 + rng.next() * 0.6), s1 = Rr * (0.55 + rng.next() * 0.6);
      const bx = cx + nx * off, by = cy + ny * off, bend = J(0.5, rng);
      const p = bt.path(c, a * (0.55 + rng.next() * 0.45), w * (0.7 + rng.next() * 0.6));
      p.moveTo(bx + dx * s0, by + dy * s0);
      p.quadraticCurveTo(bx + nx * bend, by + ny * bend, bx + dx * s1, by + dy * s1);
    }
    bt.flush(ctx);
    ctx.restore();
  }
  function rub(ctx, pts, c, a) { if (SK) return; ctx.beginPath(); poly(ctx, pts); ctx.fillStyle = rgba(c, a); ctx.fill(); }
  function softRub(ctx, pts, c, cx, cy, r, a0, a1) {
    if (SK) return;
    ctx.save();
    ctx.beginPath(); poly(ctx, pts); ctx.clip();
    const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    g.addColorStop(0, rgba(c, a0)); g.addColorStop(1, rgba(c, a1));
    ctx.fillStyle = g;
    ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    ctx.restore();
  }
  function dot(ctx, x, y, r, c, a) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = rgba(c, a); ctx.fill(); }
  function fillBoard(ctx, pts) { if (SK) return; ctx.beginPath(); poly(ctx, pts); ctx.fillStyle = cBoard; ctx.fill(); }
  /** Leaf shape (lens) from base to tip. */
  function leafPts(bx, by, ang, len, wid) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
    return spl([[bx, by], [mx + nx * wid, my + ny * wid], [bx + dx * len, by + dy * len], [mx - nx * wid, my - ny * wid]], 4, true);
  }
  function leaf(ctx, rng, bx, by, ang, len, wid, col, occlude) {
    const p = leafPts(bx, by, ang, len, wid);
    if (occlude !== false) fillBoard(ctx, p);
    rub(ctx, p, col, 0.24);
    side(ctx, p, { rng, c: col, a: 0.72, ang: ang + 0.55, sp: 0.4, gap: 0.22, lit: 1 });
    hatch(ctx, p, { rng, ang: ang + 1.2, sp: 1.25, w: 0.3, c: CG, a: 0.55 });
    stroke(ctx, p, { rng, closed: true, w: 0.62, c: col, a: 0.95 });
    stroke(ctx, [[bx, by], [bx + Math.cos(ang) * len * 0.8, by + Math.sin(ang) * len * 0.8]], { rng, w: 0.32, c: CW, a: 0.6, dbl: false });
  }
  function seedPts(cx, cy, ang, len, wid) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    return spl([
      [cx - dx * len * 0.5, cy - dy * len * 0.5],
      [cx + nx * wid * 0.5 - dx * len * 0.1, cy + ny * wid * 0.5 - dy * len * 0.1],
      [cx + dx * len * 0.5, cy + dy * len * 0.5],
      [cx - nx * wid * 0.5 - dx * len * 0.1, cy - ny * wid * 0.5 - dy * len * 0.1],
    ], 5, true);
  }

  /* ===================================================================================== grain + sprite pipeline */
  /** CPU-backed canvas (fast getImageData / putImageData). */
  function cpuCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return { c, ctx: c.getContext('2d', { willReadFrequently: true }) };
  }
  let GRAIN = null;
  /**
   * The board's tooth as an alpha mask (cut out of every sprite with destination-out): clumped pores from two
   * octaves of periodic noise (where the stick skips over the pitted slate), a few fine single pores, and short
   * drag streaks at one angle. Not uniform speckle – the dropouts come in clusters with calm areas between.
   */
  function buildGrain() {
    const N = 128;
    const { c, ctx } = U.canvas(N, N);
    const im = ctx.createImageData(N, N), d = im.data;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const n = U.perlin(x / 8, y / 8, 71, 16, 16) * 0.62 + U.perlin(x / 3.2, y / 3.2, 72, 40, 40) * 0.38;
        const h = U.hash2(x, y, 77);
        let al = U.smoothstep(0.18, 0.5, n) * 215;
        if (h < 0.05) al = Math.max(al, 150 + h * 1800);
        else al = Math.max(al, h * 26);
        d[(y * N + x) * 4 + 3] = Math.min(255, al);
      }
    }
    ctx.putImageData(im, 0, 0);
    const r = U.rng(78);
    ctx.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      const x = r.next() * N, y = r.next() * N, L = R(2, 6, r), a = -0.38 + J(0.12, r);
      for (let ox = -N; ox <= N; ox += N) for (let oy = -N; oy <= N; oy += N) {
        ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.lineTo(x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L);
        ctx.lineWidth = R(0.7, 1.3, r); ctx.strokeStyle = 'rgba(0,0,0,' + R(0.35, 0.8, r).toFixed(2) + ')'; ctx.stroke();
      }
    }
    GRAIN = c;
  }
  function applyGrain(ctx, w, h, k, seed) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = k;
    const pat = ctx.createPattern(GRAIN, 'repeat');
    const ox = (seed * 37) & 127, oy = (seed * 91) & 127;
    ctx.translate(-ox, -oy);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w + ox, h + oy);
    ctx.restore();
  }
  let mkSeed = 1;
  /**
   * Offscreen chalk sprite covering world rect [x0,x1]x[y0,y1] around anchor (0,0) = feet.
   * Returns {c, ax, ay, ch (chalk only), f (flash copy)}. A board-coloured "eraser halo" separates it from the ground.
   */
  /** Scratch canvases for the halo pass (reused – sprites are baked one after another). */
  const SCR = { m: null, g: null, d: null };
  function scratch(key, w, h) {
    let s = SCR[key];
    if (!s || s.c.width < w || s.c.height < h) { s = (key === 'm' ? cpuCanvas : U.canvas)(Math.max(w, s ? s.c.width : 0), Math.max(h, s ? s.c.height : 0)); SCR[key] = s; }
    s.ctx.setTransform(1, 0, 0, 1, 0, 0);
    s.ctx.globalCompositeOperation = 'source-over';
    s.ctx.globalAlpha = 1;
    s.ctx.clearRect(0, 0, w, h);
    return s;
  }
  function mk(x0, y0, x1, y1, draw, opt) {
    opt = opt || {};
    const pad = opt.pad === undefined ? 2 : opt.pad;
    const ax = Math.round((pad - x0) * K), ay = Math.round((pad - y0) * K);
    const w = Math.ceil((x1 - x0 + pad * 2) * K), h = Math.ceil((y1 - y0 + pad * 2) * K);
    const A = U.canvas(w, h);
    const a = A.ctx;
    a.setTransform(K, 0, 0, K, ax, ay);
    a.lineCap = 'round'; a.lineJoin = 'round';
    draw(a);
    a.setTransform(1, 0, 0, 1, 0, 0);
    applyGrain(a, w, h, opt.grain === undefined ? 0.9 : opt.grain, mkSeed++);
    const out = { c: A.c, ax, ay, ch: A.c, w, h };
    if (opt.halo !== 0) {
      // board-coloured "eraser halo": the area around a figure is wiped clean before it is drawn
      const M = scratch('m', w, h);
      // solid board-coloured mask of the real strokes only: faint rubs (lantern light, haze) cast no halo, and the
      // mask is opaque so premultiplied-alpha rounding cannot darken or tint the board colour
      M.ctx.drawImage(A.c, 0, 0);
      const md = M.ctx.getImageData(0, 0, w, h), mp = md.data;
      for (let i = 0; i < mp.length; i += 4) {
        const al = mp[i + 3];
        mp[i] = BOARD[0]; mp[i + 1] = BOARD[1]; mp[i + 2] = BOARD[2];
        mp[i + 3] = al > 70 ? 255 : al > 28 ? (al - 28) * 6 : 0;
      }
      M.ctx.putImageData(md, 0, 0);
      const Mg = scratch('g', w, h); // one upload of the mask, then the dilation runs on the GPU
      Mg.ctx.drawImage(M.c, 0, 0, w, h, 0, 0, w, h);
      const D = scratch('d', w, h);
      const r = (opt.halo || 1) * K;
      for (let k = 0; k < 10; k++) {
        const an = (k / 10) * TAU + 0.3;
        D.ctx.drawImage(Mg.c, 0, 0, w, h, Math.cos(an) * r, Math.sin(an) * r, w, h);
        D.ctx.drawImage(Mg.c, 0, 0, w, h, Math.cos(an) * r * 0.5, Math.sin(an) * r * 0.5, w, h);
      }
      const O = U.canvas(w, h);
      O.ctx.globalAlpha = opt.haloA === undefined ? 0.85 : opt.haloA;
      O.ctx.drawImage(D.c, 0, 0, w, h, 0, 0, w, h);
      O.ctx.globalAlpha = 1;
      O.ctx.drawImage(A.c, 0, 0);
      out.c = O.c;
    }
    if (opt.flash) out.f = U.tint(A.c, '#f6f6ee', 0.82);
    return out;
  }

  /* ===================================================================================== characters */
  /** Two-bone IK: knee/elbow for a limb from (hx,hy) to (fx,fy); bend +1 = joint points forward (+x). */
  function ik(hx, hy, fx, fy, L1, L2, bend) {
    let dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy);
    const md = L1 + L2 - 0.02;
    if (d > md) { const k = md / d; dx *= k; dy *= k; d = md; }
    d = Math.max(d, 0.01);
    const a = Math.atan2(dy, dx), t = Math.acos(U.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const ka = a - bend * t;
    return { kx: hx + Math.cos(ka) * L1, ky: hy + Math.sin(ka) * L1, fx: hx + dx, fy: hy + dy };
  }
  /** Rubbed dust puff with a few fallen crumbs (baked into contact poses). */
  function puff(ctx, rng, x, y, r, a) {
    if (SK) return;
    rub(ctx, ell(x, y, r, r * 0.42, 16), CW, a * 0.35);
    side(ctx, ell(x, y - r * 0.1, r * 0.9, r * 0.38, 14), { rng, c: CW, a: a, ang: -0.1, sp: 0.5, gap: 0.45 });
    for (let k = 0; k < 6; k++) dot(ctx, x + J(r * 1.2, rng), y + J(r * 0.4, rng), R(0.12, 0.28, rng), CW, 0.8);
  }

  /* ---------- main character: pumpkin-head kid in a tattered chalk cloak and a long mint scarf ----------
     Drawn facing right with feet at (0,0); about 18 units wide and 31 tall. Pose parameters:
     by body drop, lean (rad, forward +), near/far foot {fx, lift}, armN/armF swing (rad, forward +),
     hy delayed head drop (follow-through), tilt head roll, scarf/hem cloth lag, eyes 1 open .. 0 shut, mouth 0 grin / 1 "o". */
  const WALK_FOOT = [[3.0, 0], [1.7, 0], [0.2, 0], [-1.7, 0.1], [-3.0, 0.6], [-1.4, 2.0], [0.7, 2.5], [2.5, 1.2]];
  const WALK_BY = [0.15, 0.95, -0.2, -0.95]; // contact, down, passing, up
  function jackWalk(i) {
    const A = WALK_FOOT[i], B = WALK_FOOT[(i + 4) % 8], ph = i / 8;
    return {
      by: WALK_BY[i % 4], lean: 0.07 + (i % 4 === 1 ? 0.035 : 0),
      near: { fx: A[0], lift: A[1] }, far: { fx: B[0], lift: B[1] },
      armN: -A[0] * 0.19, armF: -B[0] * 0.19,
      hy: WALK_BY[(i + 3) % 4] * 0.85, tilt: 0.04 * Math.sin(TAU * ph * 2 - 0.9),
      scarf: 0.3 * Math.sin(TAU * ph * 2 - 1.4), sw: ph * TAU * 2, hem: 0.8 * Math.sin(TAU * ph * 2 - 1.1), eyes: 1, mouth: 0,
    };
  }
  function jackIdle(k, eyes) {
    const by = [0, -0.32, -0.55][k];
    return {
      by, lean: 0.02, near: { fx: 1.5, lift: 0 }, far: { fx: -1.3, lift: 0 }, armN: 0.1 - k * 0.03, armF: -0.08 + k * 0.03,
      hy: [0.05, -0.2, -0.6][k], tilt: [0, 0.02, 0.035][k], scarf: [0, 0.12, 0.07][k], sw: k * 1.4, hem: [0, 0.22, 0.1][k], eyes, mouth: 0,
    };
  }
  const JACK_DASH = [
    // anticipation: crouch, lean back, arms pulled back
    { by: 1.7, lean: -0.13, near: { fx: 1.6, lift: 0 }, far: { fx: -1.8, lift: 0 }, armN: -0.7, armF: -0.9, hy: 1.4, tilt: -0.05, scarf: 0.05, sw: 0, hem: 0.35, eyes: 0.55, mouth: 0 },
    // the dash itself: long forward lean, legs stretched, scarf streaming straight back
    { by: -0.5, lean: 0.4, near: { fx: 3.4, lift: 1.5 }, far: { fx: -4.2, lift: 1.4 }, armN: -1.15, armF: -1.35, hy: -0.2, tilt: 0.08, scarf: 0.75, sw: 1, hem: -1.3, eyes: 1, mouth: 0 },
  ];
  // knocked back: recoil, head thrown back, arms up
  const JACK_HURT = { by: 0.5, lean: -0.24, near: { fx: 2.2, lift: 0.5 }, far: { fx: -1.0, lift: 0 }, armN: 2.3, armF: 2.0, hy: 0.2, tilt: -0.17, scarf: 0.55, sw: 2, hem: 0.7, eyes: 0.25, mouth: 1 };

  function jackLeg(ctx, rng, hx, hy, f, far) {
    const L = ik(hx, hy, f.fx, -f.lift, 4.1, 3.9, 1);
    const c = far ? CL : CW, a = far ? 0.8 : 1;
    stroke(ctx, [[hx, hy], [L.kx, L.ky], [L.fx, L.fy]], { rng, w: far ? 1.25 : 1.45, c, a });
    // boot: rounded toe, toe down while pushing off / swinging back, toe up at heel strike
    const toe = f.lift > 0.4 ? (f.fx < 0.5 ? 0.42 : 0.12) : f.fx > 2.2 ? -0.2 : 0;
    ctx.save();
    ctx.translate(L.fx, L.fy); ctx.rotate(toe);
    const boot = spl([[-1.1, 0.1], [2.3, 0.2], [2.5, -0.9], [1.0, -1.6], [-0.9, -1.8]], 3, true);
    form(ctx, boot, { rng, c: far ? CV : CL, a: 0.75, sh: null, line: far ? CL : CW, lw: 0.7, weight: 0, lit: 0 });
    ctx.restore();
  }
  function jackArm(ctx, rng, sx, sy, ang, far) {
    const hx = sx + Math.sin(ang) * 5.6, hy = sy + Math.cos(ang) * 5.6;
    const L = ik(sx, sy, hx, hy, 3.0, 3.0, -1);
    stroke(ctx, [[sx, sy], [L.kx, L.ky], [L.fx, L.fy]], { rng, w: far ? 1.05 : 1.3, c: far ? CL : CW, a: far ? 0.75 : 1 });
    const m = ell(L.fx, L.fy, 1.05, 0.95, 10);
    form(ctx, m, { rng, c: CC, a: 0.7, sh: null, line: far ? CL : CW, lw: 0.5, weight: 0, lit: 0 });
  }
  function scarfTail(ctx, rng, x, y, base, len, P, k) {
    const pts = [[x, y]];
    let a = base;
    for (let j = 1; j <= 4; j++) {
      a += P.scarf * 0.22 + 0.13 * Math.sin(j * 1.6 + P.sw + k);
      const p = pts[j - 1];
      pts.push([p[0] + Math.cos(a) * len / 4, p[1] + Math.sin(a) * len / 4]);
    }
    const S = spl(pts, 3);
    stroke(ctx, S, { rng, w: 1.9 - k * 0.25, c: CM, a: 1 });
    stroke(ctx, S.map((p) => [p[0] + 0.35, p[1] + 0.45]), { rng, w: 0.4, c: CG, a: 0.8, dbl: false });
    for (let j = 1; j < 4; j++) {
      const p = pts[j], q = pts[j + 1], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
      stroke(ctx, [[p[0] - dy / l * 0.9, p[1] + dx / l * 0.9], [p[0] + dy / l * 0.9, p[1] - dx / l * 0.9]], { rng, w: 0.55, c: CP, a: 0.95, dbl: false });
    }
    const t = pts[4];
    for (let f = -1; f <= 1; f++) stroke(ctx, [[t[0], t[1]], [t[0] + Math.cos(a + f * 0.35) * 1.3, t[1] + Math.sin(a + f * 0.35) * 1.3]], { rng, w: 0.35, c: CM, a: 0.9, dbl: false });
  }
  function drawJack(ctx, P, rng) {
    const by = P.by, hipY = -7.3 + by;
    // rubbed lantern light around the head – grainy chalk dust, not a gradient
    const hcx = 0.6 + Math.sin(P.lean) * 14, hcy = -22.6 + P.hy;
    if (!SK) { for (const [r, a] of [[12.5, 0.035], [10.5, 0.045], [8.8, 0.05]]) rub(ctx, ell(hcx, hcy, r, r * 0.92, 24), CO, a); }
    jackLeg(ctx, rng, -0.6, hipY, P.far, true);
    jackLeg(ctx, rng, 0.7, hipY, P.near, false);
    ctx.save();
    ctx.translate(0, hipY); ctx.rotate(P.lean); ctx.translate(0, -hipY);
    jackArm(ctx, rng, -1.3, -14.3 + by, P.armF, true);
    // scarf tails fly out behind the neck
    const base = Math.PI - 0.6 + P.scarf;
    scarfTail(ctx, rng, -2.2, -15.0 + by, base, 7.6, P, 0);
    scarfTail(ctx, rng, -1.6, -14.6 + by, base + 0.32, 5.4, P, 1.7);
    // cloak with a tattered hem that lags behind the body
    const h = P.hem;
    const cloak = spl([
      [-3.1, -15.7], [3.0, -15.7], [4.6, -13.4], [5.8 - h * 0.2, -9.4], [6.6 - h * 0.35, -5.9], [4.6 - h * 0.45, -4.6], [3.2 - h * 0.5, -6.0],
      [1.0 - h * 0.6, -4.5], [-1.0 - h * 0.7, -5.9], [-3.4 - h * 0.8, -4.4], [-4.8 - h * 0.9, -5.8], [-6.8 - h, -5.1], [-5.6 - h * 0.6, -9.4], [-4.5, -13.2],
    ].map((p) => [p[0], p[1] + by]), 3, true);
    form(ctx, cloak, { rng, c: CW, a: 0.64, rubA: 0.16, sh: CL, shA: 0.85, hi: CC, line: CW, lw: 0.95, lit: 0.8 });
    stroke(ctx, [[0.4, -14.6 + by], [0.9 - h * 0.3, -6.4 + by]], { rng, w: 0.4, c: CL, a: 0.7, dbl: false });
    dot(ctx, 1.4, -12.4 + by, 0.55, CY, 0.95); dot(ctx, 1.6, -10.0 + by, 0.5, CY, 0.9);
    jackArm(ctx, rng, 1.9, -14.0 + by, P.armN, false);
    // scarf band
    stroke(ctx, spl([[-3.8, -15.4 + by], [0, -14.4 + by], [3.9, -15.3 + by]], 3), { rng, w: 2.3, c: CM, a: 1 });
    stroke(ctx, [[-1.4, -15.6 + by], [-1.1, -13.9 + by]], { rng, w: 0.55, c: CP, a: 0.95, dbl: false });
    stroke(ctx, [[1.6, -15.5 + by], [1.9, -13.9 + by]], { rng, w: 0.55, c: CP, a: 0.95, dbl: false });
    ctx.restore();
    // pumpkin head (follows the body one pose late)
    ctx.save();
    ctx.translate(hcx, hcy); ctx.rotate(P.tilt);
    const head = ell(0, 0, 7.8, 6.7, 36).map((p, i) => { const k = 1 + 0.045 * Math.cos(i * (TAU / 36) * 6); return [p[0] * k, p[1] * k]; });
    form(ctx, head, { rng, c: CO, a: 0.78, rubA: 0.3, sh: CDO, shA: 0.95, hi: CY, hiA: 0.75, line: CO, lw: 1.2 });
    if (!SK) { ctx.save(); ctx.beginPath(); poly(ctx, head); ctx.clip(); hatch(ctx, ell(3.6, 5.6, 6, 2.6, 16), { rng, ang: -0.6, sp: 1.0, w: 0.34, c: CV, a: 0.75 }); ctx.restore(); }
    for (const s of [-1, 1]) {
      stroke(ctx, spl([[s * 2.3, -6.3], [s * 4.4, 0], [s * 2.3, 6.3]], 4), { rng, w: 0.6, c: CDO, a: 0.95, dbl: false });
      stroke(ctx, spl([[s * 0.7, -6.6], [s * 1.4, 0], [s * 0.7, 6.6]], 4), { rng, w: 0.4, c: CDO, a: 0.7, dbl: false });
    }
    // stem with a curled tendril and a little leaf – the character's signature shape
    stroke(ctx, spl([[-0.2, -6.4], [-0.5, -8.4], [-1.6, -9.6]], 3), { rng, w: 1.7, c: CG, a: 1 });
    const cur = [];
    for (let k = 0; k < 14; k++) { const a = -0.5 + k * 0.48, r = 2.2 - k * 0.13; cur.push([0.9 + Math.cos(a) * r, -9.2 + Math.sin(a) * r]); }
    stroke(ctx, cur, { rng, w: 0.45, c: CM, a: 0.95, dbl: false });
    leaf(ctx, rng, -1.2, -8.9, -Math.PI - 0.35, 4.2, 1.25, CM);
    // carved face, lit from inside
    const fx = 1.7;
    for (const s of [-1, 1]) {
      const ex = fx + s * 2.7, ey = -1.3, eh = 1.45 * P.eyes + 0.25;
      const tri = [[ex - 1.8, ey + 1.0], [ex + 1.8, ey + 1.0], [ex + 0.3 * s, ey + 1.0 - eh * 1.9]];
      fillBoard(ctx, tri);
      rub(ctx, tri, CY, 0.95);
      side(ctx, tri, { rng, c: CW, a: 0.5, sp: 0.35, gap: 0.4 });
      stroke(ctx, tri, { rng, closed: true, w: 0.4, c: CY, a: 1, dbl: false, step: 0.6 });
    }
    const nose = [[fx - 0.6, 1.3], [fx + 0.6, 1.3], [fx, 0.3]];
    fillBoard(ctx, nose); rub(ctx, nose, CY, 0.9);
    const grin = P.mouth ? ell(fx, 3.4, 1.7, 1.6, 14) : [[-4.4, 1.8], [-2.8, 2.7], [-1.8, 2.1], [-0.2, 3.0], [1.4, 2.1], [2.6, 2.8], [4.3, 1.7], [3.4, 4.0], [1.7, 4.9], [0.9, 4.0], [0, 4.5], [-1.6, 4.9], [-3.4, 3.9]].map((p) => [fx + p[0], p[1]]);
    fillBoard(ctx, grin);
    rub(ctx, grin, CY, 0.95);
    side(ctx, grin, { rng, c: CW, a: 0.45, sp: 0.35, gap: 0.4 });
    stroke(ctx, grin, { rng, closed: true, w: 0.4, c: CY, a: 1, dbl: false, step: 0.6 });
    ctx.restore();
  }

  /* ---------- small creature: a waddling root bulb (turnip / radish) with a leafy top and a curly taproot ----------
     Feet at (0,0), body centre 13.6 above. Pose: by, sq (squash +, stretch -), lean, near/far foot, arm swing, leaf lag, tail swing. */
  function creeperPose(i) {
    const ph = i / 6, s = Math.sin(TAU * ph), c = Math.cos(TAU * ph), c2 = Math.cos(2 * TAU * ph);
    return {
      by: -Math.abs(s) * 1.15, sq: Math.max(0, c2) * 0.07 - Math.max(0, -c2) * 0.035, lean: 0.13 + 0.05 * s,
      near: { x: 2.1 * c, lift: Math.max(0, s) * 1.7 }, far: { x: -2.1 * c, lift: Math.max(0, -s) * 1.7 },
      arm: 0.55 * c, leaf: -0.22 * Math.sin(2 * TAU * ph - 1.1), tail: 0.38 * Math.sin(TAU * ph - 1.3),
    };
  }
  const CREEPER_V = [
    { name: 'turnip', top: CL, topSh: CV, body: CC, rx: 8.2, ry: 8.2, leaves: [[-0.62, 6.8, 2.0, CM], [0.55, 6.4, 1.9, CG], [0.02, 8.6, 2.1, CM]], tail: 1 },
    { name: 'radish', top: CP, topSh: CV, body: CW, rx: 6.6, ry: 9.2, leaves: [[-0.32, 9.8, 1.5, CG], [0.36, 8.6, 1.4, CM]], tail: 1.5 },
  ];
  function rootFoot(ctx, rng, f, far) {
    const x = f.x, y = -f.lift;
    for (let k = -1; k <= 1; k++) stroke(ctx, [[x, y - 0.4], [x + 0.9 + k * 0.9, y + 0.15]], { rng, w: 0.45, c: far ? CL : CC, a: 0.85, dbl: false });
  }
  function drawCreeper(ctx, P, rng, v) {
    const V = CREEPER_V[v], cy = -13.6 + P.by;
    // legs: stubby roots from the bottom of the bulb
    for (const [f, far, hx] of [[P.far, true, -1.8], [P.near, false, 2.0]]) {
      stroke(ctx, spl([[hx, cy + 5.5], [(hx + f.x) / 2 + 0.6, cy + 9 - f.lift * 0.6], [f.x, -f.lift]], 3), { rng, w: far ? 1.0 : 1.2, c: far ? CL : CC, a: far ? 0.8 : 1 });
      rootFoot(ctx, rng, f, far);
    }
    ctx.save();
    ctx.translate(0, cy + V.ry); ctx.rotate(P.lean); ctx.scale(1 + P.sq, 1 - P.sq); ctx.translate(0, -V.ry);
    // far rootlet arm (behind the bulb)
    stroke(ctx, spl([[-V.rx * 0.6, 1.5], [-V.rx * 0.6 + 2.5 + P.arm * 2, 4.6], [-V.rx * 0.4 + 4.6 + P.arm * 3, 5.2]], 3), { rng, w: 0.6, c: CL, a: 0.7, dbl: false });
    // curly taproot tail dragging behind
    const tw = P.tail;
    stroke(ctx, spl([[0.4, V.ry * 0.98], [-1.6, V.ry + 1.8 + tw * 0.5], [-4.6 * V.tail, V.ry + 1.6 + tw], [-6.4 * V.tail, V.ry - 0.2 + tw * 1.4], [-5.4 * V.tail, V.ry - 1.6 + tw]], 3), { rng, w: 0.7, c: CC, a: 0.9, dbl: false });
    const rx = V.rx, ry = V.ry;
    const bulb = spl([
      [0.4, -ry], [rx * 0.55, -ry * 0.9], [rx * 0.9, -ry * 0.52], [rx, 0], [rx * 0.86, ry * 0.42], [rx * 0.52, ry * 0.76], [rx * 0.14, ry * 1.08],
      [-rx * 0.18, ry * 0.94], [-rx * 0.6, ry * 0.68], [-rx * 0.94, ry * 0.28], [-rx * 0.98, -ry * 0.22], [-rx * 0.7, -ry * 0.72], [-rx * 0.3, -ry * 0.96],
    ], 3, true);
    form(ctx, bulb, { rng, c: V.body, a: 0.66, rubA: 0.24, sh: CL, shA: 0.75, line: null, lit: 0.5 });
    // coloured shoulder above a wavy line
    const wave = [[-rx - 2, -ry - 3], [rx + 2, -ry - 3], [rx + 2, -ry * 0.28]];
    for (let k = 6; k >= -6; k--) wave.push([k * rx / 6, -ry * 0.3 + (k & 1 ? 0.7 : -0.5)]);
    wave.push([-rx - 2, -ry * 0.28]);
    if (!SK) {
      ctx.save(); ctx.beginPath(); poly(ctx, bulb); ctx.clip();
      rub(ctx, wave, V.top, 0.32);
      side(ctx, wave, { rng, c: V.top, a: 0.85, ang: -0.5, lit: 1 });
      hatch(ctx, wave, { rng, ang: -0.85, sp: 1.15, w: 0.36, c: V.topSh, a: 0.6 });
      ctx.restore();
    }
    stroke(ctx, wave.slice(3, 16), { rng, w: 0.55, c: V.top, a: 0.95, dbl: false, step: 0.6 });
    outline(ctx, bulb, { rng, c: CW, w: 0.95 });
    // leafy top – lags behind the bob
    for (const [da, len, wid, col] of V.leaves) leaf(ctx, rng, da * 1.4, -ry + 0.6, -Math.PI / 2 + da + P.leaf, len, wid, col);
    stroke(ctx, [[0.2, -ry + 0.4], [0.5, -ry - 1.4]], { rng, w: 0.8, c: CG, a: 1, dbl: false });
    // face: dark carved eyes with yellow pupils under one heavy brow, toothy slit
    const fx = rx * 0.28, fy = -ry * 0.05;
    for (const s of [-1, 1]) {
      const ex = fx + s * 2.3, ey = fy;
      const e = ell(ex, ey, 1.5, 1.25, 14);
      fillBoard(ctx, e);
      if (!SK) rub(ctx, e, BOARD, 1);
      dot(ctx, ex + 0.55, ey + 0.2, 0.62, CY, 1);
      stroke(ctx, e, { rng, closed: true, w: 0.35, c: CW, a: 0.8, dbl: false, step: 0.5 });
    }
    stroke(ctx, [[fx - 4.2, fy - 2.9], [fx - 0.6, fy - 1.6], [fx + 0.4, fy - 1.9], [fx + 4.1, fy - 3.2]], { rng, w: 0.95, c: CW, a: 1, dbl: false, step: 0.5 });
    const m = [[fx - 1.8, fy + 2.6], [fx + 2.4, fy + 2.3], [fx + 1.8, fy + 3.6], [fx - 1.2, fy + 3.8]];
    fillBoard(ctx, m);
    if (!SK) rub(ctx, m, BOARD, 1);
    stroke(ctx, m, { rng, closed: true, w: 0.35, c: CW, a: 0.85, dbl: false, step: 0.5 });
    for (const t of [-0.6, 1.0]) stroke(ctx, [[fx + t, fy + 2.5], [fx + t + 0.1, fy + 3.1]], { rng, w: 0.45, c: CW, a: 1, dbl: false });
    // near rootlet arm reaching forward
    stroke(ctx, spl([[rx * 0.7, 1.2], [rx + 1.8 + P.arm * 1.5, 2.8], [rx + 3.4 + P.arm * 2.2, 2.0]], 3), { rng, w: 0.75, c: CC, a: 0.95, dbl: false });
    for (let k = -1; k <= 1; k++) stroke(ctx, [[rx + 3.4 + P.arm * 2.2, 2.0], [rx + 4.5 + P.arm * 2.2, 2.0 + k * 0.8]], { rng, w: 0.35, c: CC, a: 0.9, dbl: false });
    ctx.restore();
  }

  /* ---------- fast creature: a hooded wisp with a long streaming tail and reaching claws ----------
     Floats; the tail carries a travelling wave. Pose: w wave phase, arm flutter. Variant 1 = frayed, pointed hood. */
  function drawGhost(ctx, i, rng, v) {
    const w = (i / 6) * TAU;
    const C = (t) => [1.2 - 13.5 * t, -7.4 + 4.4 * t + Math.sin(w - t * 4.4) * 1.9 * t];
    const hw = (t) => 3.2 * Math.pow(1 - t, 0.9) + 0.22;
    const lower = [], upper = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10, p = C(t), q = C(Math.min(1, t + 0.05)), r = C(Math.max(0, t - 0.05));
      const dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      lower.push([p[0] - nx * hw(t), p[1] - ny * hw(t)]);
      upper.push([p[0] + nx * hw(t), p[1] + ny * hw(t)]);
    }
    const head = [];
    for (let k = 0; k <= 14; k++) {
      const a = Math.PI - 0.2 + (k / 14) * (Math.PI + 0.35);
      let rr = 6.3;
      if (v === 1) rr += Math.max(0, Math.cos(a + Math.PI / 2 + 0.55)) ** 6 * 4.2; // pointed hood leaning back
      head.push([1 + Math.cos(a) * rr, -15.4 + Math.sin(a) * rr * 1.05]);
    }
    const body = head.concat([[6.9, -11.4], [5.8, -8.4], [3.6, -6.0]], lower, upper.reverse().slice(0, 8), [[-4.6, -10.6]]);
    const sp = spl(body, 2, true);
    // far arm behind the body
    const af = Math.sin(w + 2.1) * 1.3;
    stroke(ctx, spl([[3.4, -11.6], [6.4, -12.0 + af * 0.4], [8.8, -10.8 + af]], 3), { rng, w: 0.6, c: CB, a: 0.6, dbl: false });
    fillBoard(ctx, sp);
    if (!SK) {
      softRub(ctx, sp, CW, 1, -15, 12, 0.46, 0.1);
      side(ctx, sp, { rng, c: CW, a: 0.74, ang: -0.3, lit: 0.6, gap: 0.3 });
      ctx.save(); ctx.beginPath(); poly(ctx, sp); ctx.clip();
      hatch(ctx, [[-16, -9], [8, -9], [8, 2], [-16, 2]], { rng, ang: 0.95, sp: 1.2, w: 0.36, c: CB, a: 0.8 });
      side(ctx, ell(-1, -18.5, 4.5, 2.4, 14), { rng, c: CW, a: 0.7, sp: 0.38 });
      ctx.restore();
    }
    // broken outline: white over the hood, frosty blue along the tail
    stroke(ctx, spl(head, 2).concat([[6.9, -11.4], [5.8, -8.4]]), { rng, w: 0.9, c: CW, a: 1 });
    stroke(ctx, lower.slice(1, 9), { rng, w: 0.6, c: CB, a: 0.85, dbl: false });
    stroke(ctx, upper.slice(4, 11), { rng, w: 0.55, c: CB, a: 0.7, dbl: false });
    if (v === 1) {
      // frayed tail end: two extra wisps peel off
      for (const o of [-1, 1]) {
        const p = C(0.55), q = C(1);
        stroke(ctx, spl([p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + o * 2.4], [q[0] + 1, q[1] + o * 3.4]], 3), { rng, w: 0.45, c: CB, a: 0.75, dbl: false });
      }
    }
    // hollow eyes + gaping mouth
    for (const s of [-1, 1]) {
      const ex = 2 + s * 2.2, ey = -15.6 - (s > 0 ? 0.25 : 0);
      const e = v === 1 ? [[ex - 1.3, ey - 1.4 + s * 0.5], [ex + 1.3, ey - 1.4 - s * 0.5], [ex + 1.0, ey + 1.5], [ex - 1.0, ey + 1.5]] : ell(ex, ey, 1.25, 1.9, 14);
      fillBoard(ctx, e);
      if (!SK) rub(ctx, e, BOARD, 1);
      stroke(ctx, e, { rng, closed: true, w: 0.35, c: CB, a: 0.75, dbl: false, step: 0.6 });
    }
    const mo = ell(2.2, -10.6, 1.3, 2.0 + Math.sin(w) * 0.35, 14);
    fillBoard(ctx, mo);
    if (!SK) rub(ctx, mo, BOARD, 1);
    stroke(ctx, mo, { rng, closed: true, w: 0.35, c: CB, a: 0.65, dbl: false, step: 0.6 });
    // near arm reaching forward, three thin claws
    const an = Math.sin(w) * 1.3;
    const hx = 11.0, hy = -11.8 + an;
    stroke(ctx, spl([[5.6, -11.2], [8.4, -12.6 + an * 0.4], [hx, hy]], 3), { rng, w: 0.85, c: CW, a: 0.9 });
    for (let k = -1; k <= 1; k++) stroke(ctx, [[hx, hy], [hx + 1.3, hy + k * 0.9 - 0.3]], { rng, w: 0.38, c: CW, a: 0.85, dbl: false });
  }

  /* ---------- large creature: a hunched root giant with knuckle-dragging arms, leaf crown and a carved, lit core ----------
     Feet at (0,0), about 44 wide and 58 tall. Heavy stomp: squash at each contact, dust puff under the planted foot. */
  function colossusPose(i) {
    const ph = i / 6, s = Math.sin(TAU * ph), c = Math.cos(TAU * ph), c2 = Math.cos(2 * TAU * ph);
    return {
      by: 1.5 * Math.max(0, c2) - 0.9 * Math.max(0, -c2), sq: 0.055 * Math.max(0, c2), lean: 0.06 + 0.02 * s,
      near: { x: 2.8 * c, lift: Math.max(0, s) * 2.6 }, far: { x: -2.8 * c, lift: Math.max(0, -s) * 2.6 },
      arm: 0.3 * Math.cos(TAU * ph - 0.7), crown: -0.13 * Math.sin(2 * TAU * ph - 1.0), contact: c2 > 0.8 ? (c > 0 ? 1 : -1) : 0,
    };
  }
  function drawColossus(ctx, P, rng) {
    const cy = -30 + P.by;
    if (P.contact) puff(ctx, rng, (P.contact > 0 ? P.near.x : P.far.x) * 1 + 6.5 * P.contact, 0.2, 5.5, 0.55);
    for (const [f, far, hx] of [[P.far, true, -6.5], [P.near, false, 6.0]]) {
      const fx = hx + f.x;
      stroke(ctx, spl([[hx, cy + 13], [hx + f.x * 0.5 + 0.8, cy + 21 - f.lift * 0.5], [fx, -f.lift]], 3), { rng, w: far ? 3.0 : 3.5, c: far ? CL : CC, a: far ? 0.85 : 1 });
      for (let k = -1; k <= 1; k++) stroke(ctx, [[fx, -f.lift - 0.5], [fx + 1.6 + k * 1.9, 0.6 - f.lift]], { rng, w: 0.75, c: far ? CL : CC, a: 0.85, dbl: false });
    }
    ctx.save();
    ctx.translate(0, cy + 17); ctx.rotate(P.lean); ctx.scale(1 + P.sq, 1 - P.sq); ctx.translate(0, -17);
    // far arm (behind)
    const af = -P.arm;
    stroke(ctx, spl([[-13.5, -6], [-18.5 + af * 4, 6], [-19.0 + af * 7, 24.5]], 3), { rng, w: 2.8, c: CL, a: 0.85 });
    const body = spl([[2, -18], [10, -16.2], [15.6, -10.6], [17.6, -3], [16.6, 5], [12.6, 12], [6, 16.6], [0, 17.6], [-6.6, 16.2], [-12.8, 11.4], [-16.4, 4.4], [-17.2, -3.6], [-14.4, -11], [-8, -16.4]], 4, true);
    form(ctx, body, { rng, c: CC, a: 0.4, rubA: 0.12, sh: CL, shA: 0.75, line: null });
    const wave = [[-20, -22], [20, -22], [20, 4]];
    for (let k = 8; k >= -8; k--) wave.push([k * 2.3, 4.4 + (k & 1 ? 1.1 : -0.8)]);
    wave.push([-20, 4]);
    if (!SK) {
      ctx.save(); ctx.beginPath(); poly(ctx, body); ctx.clip();
      rub(ctx, wave, CL, 0.3);
      side(ctx, wave, { rng, c: CL, a: 0.85, ang: -0.5, lit: 1.2 });
      hatch(ctx, ell(9, 2, 14, 13, 20), { rng, ang: 0.85, sp: 1.15, w: 0.42, c: CV, a: 0.85 });
      hatch(ctx, ell(10, -6, 9, 9, 18), { rng, ang: -0.8, sp: 1.6, w: 0.38, c: CP, a: 0.5 });
      side(ctx, ell(-7, -10, 7, 4, 16), { rng, c: CW, a: 0.55, sp: 0.42 });
      ctx.restore();
    }
    stroke(ctx, wave.slice(3, 20), { rng, w: 0.65, c: CL, a: 0.95, dbl: false, step: 0.7 });
    for (const cr of [[[-7, -13], [-4.6, -9.4], [-6.6, -6], [-3.6, -2]], [[11, -11], [8.6, -7.6], [11.4, -3.4]], [[-12, 8], [-8.4, 10.6], [-10.2, 13.6]]]) {
      stroke(ctx, cr, { rng, w: 0.7, c: CW, a: 0.9, dbl: false, step: 0.7 });
    }
    outline(ctx, body, { rng, c: CW, w: 1.5, weight: 0.8 });
    // carved core, lit from within
    const cx = 3.2, ccy = 5.6;
    const core = ell(cx, ccy, 4.4, 4.0, 18);
    fillBoard(ctx, core);
    if (!SK) { rub(ctx, core, CO, 0.85); rub(ctx, ell(cx - 0.4, ccy - 0.3, 2.4, 2.2, 14), CY, 0.95); side(ctx, core, { rng, c: CY, a: 0.5, sp: 0.4 }); }
    stroke(ctx, core, { rng, closed: true, w: 0.75, c: CO, a: 1, dbl: false });
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU + 0.3, r1 = k & 1 ? 6.4 : 7.8;
      stroke(ctx, [[cx + Math.cos(a) * 5.2, ccy + Math.sin(a) * 4.8], [cx + Math.cos(a) * r1, ccy + Math.sin(a) * r1 * 0.92]], { rng, w: 0.6, c: CO, a: 0.9, dbl: false, step: 0.5 });
    }
    // fierce face: one heavy brow ridge, small yellow eyes, jagged mouth
    stroke(ctx, spl([[-6.5, -11.2], [-1, -8.6], [3, -9.4], [8, -8.4], [12.5, -11.2]], 3), { rng, w: 1.6, c: CW, a: 1 });
    for (const s of [-1, 1]) {
      const ex = 3 + s * 4.8, ey = -6.4;
      const e = ell(ex, ey, 2.0, 1.3, 14);
      fillBoard(ctx, e);
      if (!SK) rub(ctx, e, BOARD, 1);
      dot(ctx, ex + 0.7, ey + 0.1, 0.85, CY, 1);
    }
    const mo = [[-2.5, -1.5], [9, -1.8], [8, 0.8], [5.6, -0.2], [3.4, 1.2], [1.0, -0.2], [-1.6, 0.6]];
    fillBoard(ctx, mo);
    if (!SK) rub(ctx, mo, BOARD, 1);
    stroke(ctx, mo, { rng, closed: true, w: 0.45, c: CW, a: 0.9, dbl: false, step: 0.6 });
    // near arm: long root arm hanging to the ground, splayed root fingers
    const an = P.arm, hx = 20.5 + an * 6, hy = 25;
    stroke(ctx, spl([[14.6, -6], [19.6 + an * 3, 6], [hx, hy]], 3), { rng, w: 3.2, c: CC, a: 1 });
    stroke(ctx, spl([[15.6, -4.6], [20.2 + an * 3, 6.4], [hx + 0.6, hy - 0.6]], 3), { rng, w: 0.6, c: CL, a: 0.85, dbl: false });
    for (let k = -1; k <= 2; k++) stroke(ctx, [[hx, hy], [hx + k * 1.5 + 0.4, hy + 2.4], [hx + k * 2.1 + 0.8, hy + 3.4]], { rng, w: 0.75, c: CC, a: 0.9, dbl: false });
    // leaf crown – sways one beat behind the stomp
    const ang = [-1.0, -0.52, -0.08, 0.36, 0.8], len = [10.5, 13.5, 16, 13.5, 10.5];
    for (let k = 0; k < 5; k++) leaf(ctx, rng, (k - 2) * 1.7 + 1.5, -16.5, -Math.PI / 2 + ang[k] + P.crown * (1 + Math.abs(k - 2) * 0.4), len[k], 3.1, k & 1 ? CG : CM);
    ctx.restore();
  }

  /* ===================================================================================== small objects */
  function drawSeed(ctx, rng) {
    const p = seedPts(0, 0, 0, 6.6, 3.8);
    form(ctx, p, { rng, c: CC, a: 0.7, rubA: 0.4, sh: CO, shA: 0.6, hi: CY, line: CW, lw: 0.55, weight: 0 });
    stroke(ctx, [[-2.0, -0.2], [2.2, 0.1]], { rng, w: 0.3, c: CDO, a: 0.8, dbl: false });
  }
  function drawTrail(ctx, rng) {
    // three broken speed streaks that taper and thin out behind the projectile
    for (let k = -1; k <= 1; k++) {
      let x = -3;
      while (x > -15) {
        const L = R(1.4, 3.4, rng);
        stroke(ctx, [[x, k * 1.0], [x - L, k * (1.0 + (-x) * 0.06)]], { rng, w: Math.max(0.15, 0.55 - Math.abs(k) * 0.12 - (-x) * 0.022), c: k ? CC : CW, a: Math.max(0.1, 0.8 - (-x) * 0.05), dbl: false, j: 0.05 });
        x -= L + R(0.7, 1.8, rng);
      }
    }
    for (let k = 0; k < 5; k++) dot(ctx, -R(4, 14, rng), J(1.6, rng), R(0.12, 0.25, rng), CW, 0.6);
  }
  function drawLantern(ctx, rng) {
    // a little jack-o'-lantern on a wire loop, rubbed light around it (grainy, drawn first)
    if (!SK) for (const [r, a] of [[9.5, 0.05], [7.8, 0.06], [6.2, 0.07]]) rub(ctx, ell(0, -5.2, r, r * 0.9, 20), CY, a);
    stroke(ctx, spl([[-3.2, -9.6], [-2.2, -13.4], [0, -14.4], [2.2, -13.4], [3.2, -9.6]], 3), { rng, w: 0.45, c: CW, a: 0.8, dbl: false });
    const b = ell(0, -5.2, 5.6, 4.9, 26).map((p, i) => { const k = 1 + 0.05 * Math.cos(i * (TAU / 26) * 5); return [p[0] * k, -5.2 + (p[1] + 5.2) * k]; });
    form(ctx, b, { rng, c: CO, a: 0.7, rubA: 0.3, sh: CDO, hi: CY, line: CO, lw: 0.75 });
    for (const s of [-1, 1]) stroke(ctx, spl([[s * 1.6, -9.9], [s * 3.0, -5.2], [s * 1.6, -0.5]], 3), { rng, w: 0.4, c: CDO, a: 0.85, dbl: false });
    for (const s of [-1, 1]) {
      const t = [[s * 1.9 - 1.1, -5.4], [s * 1.9 + 1.1, -5.4], [s * 1.9, -7.2]];
      fillBoard(ctx, t); rub(ctx, t, CY, 1);
    }
    const m = [[-2.6, -3.4], [-1.3, -2.8], [0, -3.4], [1.3, -2.8], [2.6, -3.4], [1.7, -1.9], [0, -1.5], [-1.7, -1.9]];
    fillBoard(ctx, m); rub(ctx, m, CY, 1);
    stroke(ctx, [[0, -10.2], [-0.3, -11.4]], { rng, w: 1.0, c: CG, a: 1, dbl: false });
    leaf(ctx, rng, 0.2, -10.6, -0.4, 3.4, 1.0, CM);
  }
  function drawGem(ctx, big, rng) {
    if (!big) {
      // small collectible: a faceted blue chalk crystal
      const p = [[0, -6.6], [2.4, -3.6], [1.4, -0.2], [-1.4, -0.2], [-2.4, -3.6]];
      form(ctx, p, { rng, c: CB, a: 0.7, rubA: 0.3, sh: CV, shA: 0.7, line: CB, lw: 0.55, weight: 0 });
      stroke(ctx, [[-2.4, -3.6], [0, -2.8], [2.4, -3.6]], { rng, w: 0.3, c: CW, a: 0.8, dbl: false, step: 0.5 });
      stroke(ctx, [[0, -6.6], [0, -2.8], [0, -0.2]], { rng, w: 0.25, c: CW, a: 0.5, dbl: false, step: 0.5 });
      stroke(ctx, [[-0.7, -4.8], [-1.2, -3.6]], { rng, w: 0.45, c: CW, a: 1, dbl: false });
    } else {
      // large collectible: a fat star gem, pink core, yellow rim, short light ticks
      const p = starPts(0, -6.2, 6.4, 3.2, 5, 0);
      form(ctx, p, { rng, c: CY, a: 0.7, rubA: 0.3, sh: CO, shA: 0.6, hi: CW, line: CY, lw: 0.75, weight: 0 });
      const core = starPts(0, -6.2, 3.0, 1.5, 5, 0);
      rub(ctx, core, CP, 0.7);
      stroke(ctx, core, { rng, closed: true, w: 0.35, c: CP, a: 0.95, dbl: false, step: 0.5 });
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU - Math.PI / 2 + TAU / 10;
        stroke(ctx, [[Math.cos(a) * 5.2, -6.2 + Math.sin(a) * 5.2], [Math.cos(a) * 6.9, -6.2 + Math.sin(a) * 6.9]], { rng, w: 0.45, c: CY, a: 0.85, dbl: false, step: 0.5 });
      }
    }
  }
  /** Contact shadow: a damp-sponge mark on the board (darker slate, grainy edge). */
  function shadowSpr(rx, ry) {
    const { c, ctx } = U.canvas(Math.ceil(rx * 2 * K + 4), Math.ceil(ry * 2 * K + 4));
    const w = c.width, h = c.height;
    ctx.translate(w / 2, h / 2);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * K);
    g.addColorStop(0, 'rgba(12,20,16,0.62)'); g.addColorStop(0.62, 'rgba(12,20,16,0.38)'); g.addColorStop(1, 'rgba(12,20,16,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, rx * K, 0, TAU); ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    applyGrain(ctx, w, h, 0.5, (rx * 13) | 0);
    return { c, ax: w / 2, ay: h / 2 };
  }

  /* ---------- doodles for the board ---------- */
  function starPts(x, y, r0, r1, n, rot) {
    const out = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (rot || 0) + (i / (n * 2)) * TAU - Math.PI / 2, r = i & 1 ? r1 : r0;
      out.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    return out;
  }
  function pumpkin(ctx, rng, cx, cy, r, face, fillA) {
    const ry = r * 0.78;
    const p = ell(cx, cy - ry, r, ry, 26).map((q, i) => {
      const k = 1 + 0.04 * Math.cos(i * (TAU / 26) * 5);
      return [cx + (q[0] - cx) * k, cy - ry + (q[1] - cy + ry) * k];
    });
    fillBoard(ctx, p);
    rub(ctx, p, CO, fillA === undefined ? 0.5 : fillA);
    hatch(ctx, p, { rng, ang: -0.7, sp: Math.max(0.9, r * 0.18), w: Math.max(0.3, r * 0.05), c: CDO, a: 0.7, inset: 0.92 });
    for (const s of [-1, 1]) stroke(ctx, spl([[cx + s * r * 0.3, cy - ry * 1.95], [cx + s * r * 0.55, cy - ry], [cx + s * r * 0.3, cy - ry * 0.05]], 3), { rng, w: Math.max(0.35, r * 0.07), c: CDO, a: 0.9, dbl: false });
    stroke(ctx, p, { rng, closed: true, w: Math.max(0.5, r * 0.12), c: CO, a: 1 });
    stroke(ctx, [[cx, cy - ry * 1.95], [cx - r * 0.12, cy - ry * 2.35], [cx - r * 0.3, cy - ry * 2.45]], { rng, w: Math.max(0.6, r * 0.16), c: CG, a: 1, dbl: false });
    if (face) {
      for (const s of [-1, 1]) rub(ctx, [[cx + s * r * 0.36 - r * 0.17, cy - ry * 1.1], [cx + s * r * 0.36 + r * 0.17, cy - ry * 1.1], [cx + s * r * 0.36, cy - ry * 1.45]], CY, 1);
      rub(ctx, [[cx - r * 0.5, cy - ry * 0.75], [cx - r * 0.2, cy - ry * 0.6], [cx, cy - ry * 0.75], [cx + r * 0.2, cy - ry * 0.6], [cx + r * 0.5, cy - ry * 0.75], [cx + r * 0.25, cy - ry * 0.4], [cx - r * 0.25, cy - ry * 0.4]], CY, 1);
    }
  }
  const DOODLES = {
    star(c, r) { const p = starPts(0, 0, 3.2, 1.35, 5, 0); rub(c, p, CY, 0.22); stroke(c, p, { rng: r, closed: true, w: 0.55, c: CY, a: 0.95, step: 0.7 }); },
    sparkle(c, r) { for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU; stroke(c, [[Math.cos(a) * 0.8, Math.sin(a) * 0.8], [Math.cos(a) * (k & 1 ? 2.2 : 3.4), Math.sin(a) * (k & 1 ? 2.2 : 3.4)]], { rng: r, w: 0.5, c: CW, a: 0.9, dbl: false }); } },
    spiral(c, r) { const p = []; for (let i = 0; i < 40; i++) { const a = i * 0.42, rr = 0.15 + i * 0.09; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } stroke(c, p, { rng: r, w: 0.5, c: CL, a: 0.9 }); },
    moon(c, r) { const o = ell(0, 0, 3.4, 3.4, 26, 0, -2.2).slice(0, 15); const p = o.concat(spl([o[o.length - 1], [1.2, 0.2], o[0]], 6).slice(1, -1)); rub(c, p, CY, 0.3); hatch(c, p, { rng: r, ang: 0.8, sp: 0.9, w: 0.3, c: CY, a: 0.7 }); stroke(c, p, { rng: r, closed: true, w: 0.55, c: CY, a: 0.95 }); },
    bat(c, r) {
      const wing = [[-6, -1.5], [-4.6, -0.4], [-3.6, 0.6], [-2.8, 0], [-1.6, 0.8], [-0.8, 0]];
      for (const s of [-1, 1]) {
        const w = wing.map((p) => [p[0] * s, p[1]]);
        stroke(c, w, { rng: r, w: 0.5, c: CL, a: 0.95, dbl: false, step: 0.6 });
        stroke(c, spl([[s * 0.8, -0.8], [s * 3, -2.4], [s * 6, -1.5]], 4), { rng: r, w: 0.5, c: CL, a: 0.95, dbl: false });
      }
      const b = ell(0, -0.2, 1.1, 1.4, 12); rub(c, b, CL, 0.7); stroke(c, b, { rng: r, closed: true, w: 0.4, c: CL, a: 1, dbl: false, step: 0.5 });
      stroke(c, [[-0.6, -1.4], [-0.8, -2.2]], { rng: r, w: 0.35, c: CL, a: 1, dbl: false }); stroke(c, [[0.6, -1.4], [0.8, -2.2]], { rng: r, w: 0.35, c: CL, a: 1, dbl: false });
    },
    pumpkin(c, r) { pumpkin(c, r, 0, 2.4, 3.2, r.next() < 0.5, 0.2); },
    arrow(c, r) { const p = spl([[-4, 1.5], [-1.5, -1], [1.5, -0.5], [4, -1.8]], 5); stroke(c, p, { rng: r, w: 0.55, c: CP, a: 0.95 }); stroke(c, [[2.6, -3.1], [4, -1.8], [2.4, -0.7]], { rng: r, w: 0.55, c: CP, a: 0.95, dbl: false, step: 0.6 }); },
    heart(c, r) { const p = []; for (let i = 0; i < 28; i++) { const t = (i / 28) * TAU; p.push([0.19 * 16 * Math.pow(Math.sin(t), 3), -0.19 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } rub(c, p, CP, 0.3); stroke(c, p, { rng: r, closed: true, w: 0.55, c: CP, a: 0.95 }); },
    flower(c, r) { for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; stroke(c, ell(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 1.2, 0.75, 12, a), { rng: r, closed: true, w: 0.45, c: CP, a: 0.9, dbl: false, step: 0.5 }); } dot(c, 0, 0, 0.8, CY, 0.95); stroke(c, [[0, 2], [0.4, 5]], { rng: r, w: 0.45, c: CM, a: 0.9, dbl: false }); },
    snow(c, r) { for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI + 0.3; stroke(c, [[Math.cos(a) * 3, Math.sin(a) * 3], [-Math.cos(a) * 3, -Math.sin(a) * 3]], { rng: r, w: 0.45, c: CB, a: 0.95, dbl: false }); } dot(c, 0, 0, 0.5, CW, 0.9); },
    tally(c, r) { for (let k = 0; k < 4; k++) stroke(c, [[-2.4 + k * 1.4, -2.6], [-2.2 + k * 1.4, 2.6]], { rng: r, w: 0.5, c: CW, a: 0.9, dbl: false }); stroke(c, [[-3.2, 1.6], [3.0, -1.8]], { rng: r, w: 0.5, c: CW, a: 0.9, dbl: false }); },
    turnip(c, r) { const b = spl([[0, -3], [2.6, -1.6], [2.4, 1], [0, 3], [-2.4, 1], [-2.6, -1.6]], 4, true); rub(c, b, CL, 0.35); stroke(c, b, { rng: r, closed: true, w: 0.5, c: CL, a: 0.95 }); stroke(c, [[0, -3], [-1, -5.2]], { rng: r, w: 0.45, c: CM, a: 0.95, dbl: false }); stroke(c, [[0, -3], [1.2, -5]], { rng: r, w: 0.45, c: CM, a: 0.95, dbl: false }); },
    ghost(c, r) { const b = spl([[-2.6, 2.6], [-2.8, -1.4], [0, -3.8], [2.8, -1.4], [2.6, 2.6], [1.3, 1.6], [0, 2.8], [-1.3, 1.6]], 4, true); stroke(c, b, { rng: r, closed: true, w: 0.5, c: CW, a: 0.9 }); dot(c, -0.9, -1, 0.45, CW, 0.9); dot(c, 0.9, -1, 0.45, CW, 0.9); },
    ttt(c, r) {
      for (const k of [-1, 1]) { stroke(c, [[k * 1.4, -4], [k * 1.4, 4]], { rng: r, w: 0.4, c: CW, a: 0.85, dbl: false }); stroke(c, [[-4, k * 1.4], [4, k * 1.4]], { rng: r, w: 0.4, c: CW, a: 0.85, dbl: false }); }
      stroke(c, [[-3.6, -3.6], [-2.2, -2.2]], { rng: r, w: 0.4, c: CO, a: 0.9, dbl: false }); stroke(c, [[-2.2, -3.6], [-3.6, -2.2]], { rng: r, w: 0.4, c: CO, a: 0.9, dbl: false });
      stroke(c, ell(0, 0, 0.8, 0.8, 12), { rng: r, closed: true, w: 0.4, c: CM, a: 0.9, dbl: false, step: 0.4 });
      stroke(c, [[2.2, 2.2], [3.6, 3.6]], { rng: r, w: 0.4, c: CO, a: 0.9, dbl: false }); stroke(c, [[3.6, 2.2], [2.2, 3.6]], { rng: r, w: 0.4, c: CO, a: 0.9, dbl: false });
    },
  };
  const DOODLE_SETS = {
    forest: ['bat', 'moon', 'spiral', 'ghost', 'star', 'bat'],
    field: ['pumpkin', 'turnip', 'arrow', 'sparkle', 'tally', 'pumpkin'],
    meadow: ['flower', 'heart', 'star', 'ttt', 'spiral', 'sparkle', 'flower'],
    frost: ['snow', 'star', 'sparkle', 'moon', 'snow'],
  };

  /* ===================================================================================== props art */
  /* Scenery is lit from the upper left: warm strokes (yellow / cream / mint) there, cool hatching (violet,
     lavender, blue) on the lower right, the outline pressed harder on the shadow side. Every prop stands on a
     few short ground strokes so it never floats. */
  function groundLine(ctx, rng, x0, x1, col) {
    stroke(ctx, [[x0, 0.4 + J(0.2, rng)], [x1, 0.3 + J(0.2, rng)]], { rng, w: 0.6, c: col || CW, a: 0.7, dbl: false });
    stroke(ctx, [[x0 * 0.6 + 2, 1.3], [x1 * 0.5 + 2, 1.2]], { rng, w: 0.4, c: col || CW, a: 0.4, dbl: false });
  }
  function grassTufts(ctx, rng, x0, x1, n) {
    for (let i = 0; i < n; i++) {
      const x = R(x0, x1, rng);
      for (let k = 0; k < 3; k++) stroke(ctx, [[x + k * 0.8, 0.6], [x + k * 0.8 + R(-0.8, 0.8, rng), -R(1.6, 3.4, rng)]], { rng, w: 0.45, c: k === 1 ? CG : CM, a: 0.85, dbl: false });
    }
  }
  function trunk(ctx, rng, h, wb, wt) {
    const sides = [[[-wb, 1], [-wb * 0.45, -2], [-wt, -h * 0.5], [-wt * 0.9, -h]], [[wb * 1.05, 1], [wb * 0.48, -2], [wt, -h * 0.5], [wt * 0.95, -h]]];
    const tr = spl(sides[0], 3).concat(spl(sides[1], 3).reverse());
    fillBoard(ctx, tr);
    side(ctx, tr, { rng, c: CC, a: 0.28, ang: 1.45, sp: 0.55, gap: 0.4 });
    ctx.save(); ctx.beginPath(); poly(ctx, tr); ctx.clip();
    hatch(ctx, [[0, -h - 2], [wb + 2, -h - 2], [wb + 2, 2], [0, 2]], { rng, ang: 1.25, sp: 1.0, w: 0.36, c: CV, a: 0.8 });
    ctx.restore();
    stroke(ctx, spl(sides[0], 4), { rng, w: 0.95, c: CW, a: 1 });
    stroke(ctx, spl(sides[1], 4), { rng, w: 1.25, c: CW, a: 1 });
    for (let k = 0; k < 3; k++) { const y = -4 - k * (h / 4) + R(-2, 2, rng); stroke(ctx, [[R(-1.4, 0, rng), y], [R(0, 1.4, rng), y - 2]], { rng, w: 0.38, c: CW, a: 0.55, dbl: false }); }
  }
  /** Bumpy crown outline around (cx,cy). */
  function crownPts(rng, cx, cy, rx, ry, nb, bump) {
    const b = [];
    for (let i = 0; i < nb; i++) {
      const a = (i / nb) * TAU, rr = 1 + R(-0.05, 0.08, rng);
      b.push([cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr]);
      const a2 = ((i + 0.5) / nb) * TAU;
      b.push([cx + Math.cos(a2) * rx * bump, cy + Math.sin(a2) * ry * bump]);
    }
    return spl(b, 4, true);
  }
  function scribble(ctx, rng, cx, cy, rx, ry, n, col, a) {
    const sc = [];
    let an = 0;
    for (let i = 0; i < n; i++) {
      an += 0.95 + J(0.3, rng);
      const rr = 0.25 + rng.next() * 0.7;
      sc.push([cx + Math.cos(an) * rx * rr + J(1.6, rng), cy + Math.sin(an) * ry * rr + J(1.6, rng) + (i / n - 0.5) * 5]);
    }
    stroke(ctx, spl(sc, 3), { rng, w: 0.5, c: col, a, dbl: false, step: 0.9 });
  }
  /** Round broadleaf: scribbled crown in mint / green, yellow strokes in the light, violet hatching in the shade. */
  function artTree(ctx, rng) {
    trunk(ctx, rng, 34, 6, 2.4);
    stroke(ctx, spl([[-1, -28], [-6, -36], [-9.5, -40]], 4), { rng, w: 0.8, c: CW, a: 0.9 });
    stroke(ctx, spl([[1.4, -29], [7, -38], [10.5, -41]], 4), { rng, w: 0.8, c: CW, a: 0.9 });
    const cx = 0, cy = -50, rx = 21, ry = 16.5;
    const crown = crownPts(rng, cx, cy, rx, ry, 11, 0.86);
    form(ctx, crown, { rng, c: CM, a: 0.42, rubA: 0.1, sh: CV, shA: 0.85, hi: CY, hiA: 0.6, line: CM, lw: 1.2, weight: 0.9 });
    ctx.save(); ctx.beginPath(); poly(ctx, crown); ctx.clip();
    scribble(ctx, rng, cx - 2, cy - 1, rx, ry, 70, CG, 0.6);
    ctx.restore();
    for (let k = 0; k < 4; k++) {
      const x = cx - 11 + R(-3, 6, rng), y = cy - 7 + R(-4, 4, rng);
      stroke(ctx, spl([[x, y + 1.4], [x + 1.4, y], [x + 3, y + 0.6]], 3), { rng, w: 0.45, c: CW, a: 0.8, dbl: false });
    }
    groundLine(ctx, rng, -9, 9);
    grassTufts(ctx, rng, -9, 9, 3);
  }
  /** Spruce: four zigzag tiers, each drawn darker on the right. */
  function artPine(ctx, rng) {
    trunk(ctx, rng, 14, 3.4, 1.6);
    for (let t = 3; t >= 0; t--) {
      const top = -66 + t * 12, bot = top + 20 + t * 1.5, hw = 7 + t * 4.2;
      const pts = [[0, top]];
      const n = 5 + t;
      for (let k = 0; k <= n; k++) { const x = hw - (2 * hw * k) / n; pts.push([x, bot + (k & 1 ? -2.4 : 0.4) + J(0.4, rng)]); }
      form(ctx, pts, { rng, c: CG, a: 0.5, rubA: 0.12, sh: CV, shA: 0.85, hi: CM, hiA: 0.75, line: CM, lw: 1.0, weight: 0.9, ang: -1.0 });
      stroke(ctx, [[0, top + 2], [0.4, bot - 2]], { rng, w: 0.35, c: CG, a: 0.7, dbl: false });
    }
    groundLine(ctx, rng, -12, 12);
    grassTufts(ctx, rng, -10, 8, 2);
  }
  /** Autumn tree: lumpy orange crown of three clouds, a few leaves falling below it. */
  function artAutumn(ctx, rng) {
    trunk(ctx, rng, 30, 5.4, 2.2);
    stroke(ctx, spl([[0.6, -26], [-5, -33], [-8, -37]], 4), { rng, w: 0.75, c: CW, a: 0.9 });
    for (const [cx, cy, rx, ry] of [[-9, -44, 11, 9.5], [9, -45, 11.5, 10], [0, -54, 13, 11]]) {
      const cr = crownPts(rng, cx, cy, rx, ry, 8, 0.88);
      form(ctx, cr, { rng, c: CO, a: 0.5, rubA: 0.12, sh: CDO, shA: 0.9, hi: CY, hiA: 0.75, line: CO, lw: 1.05, weight: 0.9 });
      ctx.save(); ctx.beginPath(); poly(ctx, cr); ctx.clip(); scribble(ctx, rng, cx, cy, rx, ry, 26, CY, 0.45); ctx.restore();
    }
    for (let k = 0; k < 5; k++) {
      const x = R(-16, 16, rng), y = R(-26, -2, rng), a = rng.next() * TAU;
      leaf(ctx, rng, x, y, a, 2.4, 0.9, k & 1 ? CO : CY, false);
    }
    groundLine(ctx, rng, -9, 9);
  }
  function branch(ctx, rng, x, y, a, len, w, d) {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    const mx = (x + x2) / 2 + J(len * 0.12, rng), my = (y + y2) / 2 + J(len * 0.12, rng);
    stroke(ctx, spl([[x, y], [mx, my], [x2, y2]], 4), { rng, w, c: d > 1 ? CW : CL, a: 0.95, dbl: d > 1 });
    if (d <= 0) return;
    const n = d > 2 ? 2 : 2 + (rng.next() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) branch(ctx, rng, x2, y2, a + (i - (n - 1) / 2) * R(0.5, 0.8, rng) + J(0.15, rng), len * R(0.6, 0.75, rng), w * 0.68, d - 1);
  }
  function artDeadTree(ctx, rng, v) {
    trunk(ctx, rng, 26, 5, 1.6);
    branch(ctx, rng, 0, -25, -Math.PI / 2 - 0.45, 13, 1.5, 3);
    branch(ctx, rng, 0, -25, -Math.PI / 2 + 0.5, 12, 1.4, 3);
    branch(ctx, rng, -1, -16, -Math.PI + 0.5, 9, 1.0, 2);
    if (v === 0) { ctx.save(); ctx.translate(9, -44); DOODLES.bat(ctx, rng); ctx.restore(); }
    else { ctx.save(); ctx.translate(-8, -40); ctx.scale(0.9, 0.9); DOODLES.moon(ctx, rng); ctx.restore(); }
    groundLine(ctx, rng, -8, 8);
    grassTufts(ctx, rng, -7, 7, 2);
  }
  function artGrave(ctx, rng, kind) {
    let p;
    if (kind === 1) p = [[-1.6, 0], [-1.6, -9], [-5.6, -9], [-5.6, -12.4], [-1.6, -12.4], [-1.6, -18.4], [1.6, -18.4], [1.6, -12.4], [5.6, -12.4], [5.6, -9], [1.6, -9], [1.6, 0]];
    else if (kind === 2) p = spl([[-5, 0], [-5.4, -14], [0, -20], [5.4, -14], [5, 0]], 4).concat([[0, 0]]);
    else p = [[-6, 0]].concat(spl([[-6, -11], [-4.4, -15.8], [0, -17.4], [4.4, -15.8], [6, -11]], 4)).concat([[6, 0]]);
    form(ctx, p, { rng, c: CW, a: 0.28, rubA: 0.06, sh: CV, shA: 0.85, hi: CC, hiA: 0.5, line: CW, lw: 1.05 });
    if (kind === 0) {
      const L = (pts) => stroke(ctx, pts, { rng, w: 0.6, c: CL, a: 0.95, dbl: false, step: 0.5 });
      L([[-3.8, -8], [-3.8, -12.4], [-2.5, -12.4], [-2.2, -11.2], [-2.6, -10.2], [-3.8, -10.2], [-2.2, -8]]);
      L([[-0.2, -8], [-0.2, -12.4]]);
      L([[1.8, -8], [1.8, -12.4], [3.1, -12.4], [3.5, -11.3], [3.1, -10.2], [1.8, -10.2]]);
      stroke(ctx, [[-3.6, -5], [3.6, -5]], { rng, w: 0.4, c: CW, a: 0.6, dbl: false });
    } else if (kind === 2) {
      stroke(ctx, [[0, -15.5], [0, -8]], { rng, w: 0.6, c: CL, a: 0.95, dbl: false });
      stroke(ctx, [[-2.4, -13], [2.4, -13]], { rng, w: 0.6, c: CL, a: 0.95, dbl: false });
    }
    stroke(ctx, [[2.6, -14 + (kind === 1 ? 2 : 0)], [1.6, -11.5], [2.8, -9.5], [1.8, -7.5]], { rng, w: 0.4, c: CW, a: 0.7, dbl: false, step: 0.5 });
    groundLine(ctx, rng, -8, 8);
    grassTufts(ctx, rng, -7.5, 6, 3);
  }
  function artFence(ctx, rng) {
    const xs = [-15, -5, 5, 15];
    const lean = J(0.08, rng);
    for (const x of xs) {
      const h = R(12, 14.5, rng);
      const p = [[x - 1.3, 0], [x - 1.3 + lean * h, -h + 1.6], [x + lean * h, -h], [x + 1.3 + lean * h, -h + 1.6], [x + 1.3, 0]];
      form(ctx, p, { rng, c: CC, a: 0.3, rubA: 0.05, sh: CV, line: CW, lw: 0.8, ang: 1.4 });
    }
    for (const y of [-4.5, -9.5]) stroke(ctx, [[-17, y + J(0.5, rng)], [17, y + J(0.5, rng)]], { rng, w: 0.9, c: CW, a: 0.95 });
    groundLine(ctx, rng, -17, 17);
    grassTufts(ctx, rng, -17, 16, 5);
  }
  function artScarecrow(ctx, rng) {
    stroke(ctx, [[0, 0.5], [0.3, -38]], { rng, w: 1.4, c: CW, a: 1 });
    stroke(ctx, [[-14, -27.4], [14, -27]], { rng, w: 1.1, c: CW, a: 0.95 });
    const coat = [[-4.2, -30.5], [4.2, -30.5], [6.4, -15.5], [2, -16.6], [0, -15.2], [-2.2, -16.6], [-6.4, -15.5]];
    for (const s of [-1, 1]) {
      const sl = [[s * 3.5, -30], [s * 12.5, -28.6], [s * 12.5, -25.2], [s * 3.5, -25.8]];
      form(ctx, sl, { rng, c: CL, a: 0.6, sh: CV, line: CL, lw: 0.7, weight: 0 });
      for (let k = 0; k < 4; k++) stroke(ctx, [[s * 12.6, -27], [s * (14.8 + R(0, 1, rng)), -28.8 + k * 1.3]], { rng, w: 0.45, c: CY, a: 0.95, dbl: false });
    }
    form(ctx, coat, { rng, c: CL, a: 0.62, sh: CV, hi: CP, hiA: 0.5, line: CL, lw: 0.85 });
    for (let k = 0; k < 5; k++) stroke(ctx, [[-4 + k * 2, -15.8], [-4.4 + k * 2.2, -12.6 - R(0, 1, rng)]], { rng, w: 0.45, c: CY, a: 0.9, dbl: false });
    stroke(ctx, [[-1.6, -24], [1.4, -21.6]], { rng, w: 0.5, c: CP, a: 0.9, dbl: false });
    stroke(ctx, [[1.4, -24], [-1.6, -21.6]], { rng, w: 0.5, c: CP, a: 0.9, dbl: false });
    const head = ell(0.2, -34.6, 4.6, 4.3, 22);
    form(ctx, head, { rng, c: CC, a: 0.5, sh: CO, shA: 0.6, hi: CY, line: CY, lw: 0.8, weight: 0 });
    for (const s of [-1, 1]) {
      const ex = 0.2 + s * 1.7, ey = -35.4;
      stroke(ctx, [[ex - 0.8, ey - 0.8], [ex + 0.8, ey + 0.8]], { rng, w: 0.45, c: CW, a: 1, dbl: false });
      stroke(ctx, [[ex + 0.8, ey - 0.8], [ex - 0.8, ey + 0.8]], { rng, w: 0.45, c: CW, a: 1, dbl: false });
    }
    stroke(ctx, [[-2, -32.6], [2.4, -32.6]], { rng, w: 0.4, c: CW, a: 0.9, dbl: false });
    for (let k = 0; k < 4; k++) stroke(ctx, [[-1.4 + k * 1.1, -33.2], [-1.4 + k * 1.1, -32]], { rng, w: 0.3, c: CW, a: 0.9, dbl: false });
    const hat = [[-3.6, -38.4], [-2, -45.4], [3.6, -44.2], [3.8, -38.4]];
    form(ctx, hat, { rng, c: CL, a: 0.7, sh: CV, line: CL, lw: 0.75, weight: 0 });
    stroke(ctx, [[-7.4, -38.2], [7.6, -38.6]], { rng, w: 1.0, c: CL, a: 1 });
    groundLine(ctx, rng, -5, 5);
    grassTufts(ctx, rng, -5, 4, 2);
  }
  function artPumpkins(ctx, rng, v) {
    if (v === 0) { pumpkin(ctx, rng, 0, 0, 6, false, 0.2); }
    else if (v === 1) { pumpkin(ctx, rng, -4, -1, 4.4, false, 0.2); pumpkin(ctx, rng, 4.5, 0.5, 5.2, false, 0.2); }
    else { pumpkin(ctx, rng, -6, -0.5, 3.6, false, 0.2); pumpkin(ctx, rng, 5.5, -1, 4, false, 0.2); pumpkin(ctx, rng, 0, 1, 4.6, false, 0.2); }
    for (let k = 0; k < 2; k++) stroke(ctx, spl([[-8 + k * 9, -1], [-6 + k * 9, -4], [-4 + k * 9, -2.6], [-3 + k * 9, -4.4]], 4), { rng, w: 0.45, c: CG, a: 0.8, dbl: false });
    groundLine(ctx, rng, -8, 8, CG);
  }
  function artSign(ctx, rng) {
    stroke(ctx, [[0, 0.5], [0.2, -24]], { rng, w: 1.3, c: CW, a: 1 });
    const b = [[-6, -24], [7, -24], [11, -20.6], [7, -17], [-6, -17]];
    form(ctx, b, { rng, c: CY, a: 0.3, rubA: 0.06, sh: CO, shA: 0.5, line: CY, lw: 0.85 });
    stroke(ctx, [[-3.6, -20.6], [5.2, -20.6]], { rng, w: 0.55, c: CW, a: 0.9, dbl: false });
    stroke(ctx, [[3.4, -22.2], [5.4, -20.6], [3.4, -19.0]], { rng, w: 0.55, c: CW, a: 0.9, dbl: false, step: 0.5 });
    groundLine(ctx, rng, -4, 4);
    grassTufts(ctx, rng, -4, 3, 2);
  }
  /** Cattails at the water's edge, with ripple strokes around their feet. */
  function artReeds(ctx, rng, v) {
    const n = v ? 6 : 4;
    for (let k = 0; k < n; k++) {
      const x = (k - (n - 1) / 2) * 2.6 + J(0.8, rng), h = R(11, 20, rng), bend = J(2.2, rng);
      const top = [x + bend, -h];
      stroke(ctx, spl([[x, 0.4], [x + bend * 0.4, -h * 0.5], top], 3), { rng, w: 0.7, c: k & 1 ? CG : CM, a: 0.95, dbl: false });
      if (k % 3 !== 2) {
        const hd = ell(top[0], top[1] + 1.8, 1.0, 2.6, 12, bend * 0.05);
        form(ctx, hd, { rng, c: CWD, a: 0.85, rubA: 0.4, sh: null, line: CC, lw: 0.5, weight: 0, lit: 0 });
        stroke(ctx, [[top[0], top[1] - 0.8], [top[0] + bend * 0.04, top[1] - 2.6]], { rng, w: 0.35, c: CG, a: 0.9, dbl: false });
      } else leaf(ctx, rng, x + bend * 0.3, -h * 0.4, -Math.PI / 2 + (bend > 0 ? 0.5 : -0.5), h * 0.5, 0.9, CM, false);
    }
    for (let k = 0; k < 3; k++) stroke(ctx, [[-8 + k * 3 + J(1, rng), 1.2 + k * 0.9], [-1 + k * 4 + J(1, rng), 1.0 + k * 0.9]], { rng, w: 0.45, c: CB, a: 0.75 - k * 0.15, dbl: false });
  }
  /** Path-side stones: two to four pebbles leaning on each other. */
  function artStones(ctx, rng, v) {
    const list = v ? [[-4.2, 0, 4.4, 3.2], [3.2, 0.4, 3.4, 2.6], [0, -1.2, 2.6, 2.0], [6.8, 0.8, 1.8, 1.3]] : [[-2.6, 0, 3.8, 2.9], [3.0, 0.5, 2.8, 2.2]];
    for (const [x, y, rx, ry] of list) {
      const p = ell(x, y - ry, rx, ry, 18).map((q) => [q[0] + J(0.2, rng), q[1] + J(0.2, rng)]);
      form(ctx, p, { rng, c: CW, a: 0.3, rubA: 0.06, sh: CV, shA: 0.9, hi: CC, hiA: 0.6, line: CW, lw: 0.75 });
    }
    groundLine(ctx, rng, -7, 7);
  }
  /** A ring of toadstools at the foot of trees. */
  function artMush(ctx, rng, v) {
    const list = v ? [[-3.6, 0, 3.2, 5.6], [2.6, 0.6, 2.4, 4.2], [6.2, 0.2, 1.6, 2.8]] : [[-1.6, 0, 3.6, 6.4], [3.6, 0.5, 2.2, 3.8]];
    for (const [x, y, r, h] of list) {
      const st = [[x - r * 0.3, y], [x - r * 0.25, y - h], [x + r * 0.25, y - h], [x + r * 0.32, y]];
      form(ctx, st, { rng, c: CC, a: 0.5, sh: CL, line: CW, lw: 0.55, weight: 0 });
      const cap = ell(x, y - h, r, r * 0.62, 18, 0, Math.PI).slice(0, 10).concat([[x - r, y - h + 0.3]]);
      form(ctx, cap.map((q) => [q[0], q[1] - 0.2]), { rng, c: v ? CP : CO, a: 0.7, sh: CV, hi: CY, hiA: 0.5, line: v ? CP : CO, lw: 0.7, weight: 0 });
      for (let k = 0; k < 3; k++) dot(ctx, x + J(r * 0.6, rng), y - h - r * R(0.15, 0.4, rng), R(0.3, 0.5, rng), CW, 0.95);
    }
    groundLine(ctx, rng, -6, 7, CM);
  }
  /** A round berry bush. */
  function artBush(ctx, rng) {
    const cr = crownPts(rng, 0, -6.4, 9.5, 6.6, 7, 0.84);
    form(ctx, cr, { rng, c: CG, a: 0.5, sh: CV, shA: 0.85, hi: CM, hiA: 0.7, line: CM, lw: 0.95 });
    ctx.save(); ctx.beginPath(); poly(ctx, cr); ctx.clip(); scribble(ctx, rng, 0, -6.4, 9, 6, 24, CM, 0.45); ctx.restore();
    for (let k = 0; k < 5; k++) { const x = J(6, rng), y = -6.4 + J(3.6, rng); dot(ctx, x, y, 0.75, CP, 0.95); dot(ctx, x - 0.25, y - 0.25, 0.25, CW, 0.9); }
    groundLine(ctx, rng, -9, 9);
  }

  /* ===================================================================================== sprite build */
  const SPR = {};
  const LAZY = [];
  let lazyOn = false;
  const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 100 }) : setTimeout(fn, 16));
  /** Extra boil variants are drawn in idle time between frames – never inside a frame or a ground chunk. */
  function pumpLazy() {
    if (lazyOn || !LAZY.length) return;
    lazyOn = true;
    const step = (dl) => {
      const end = performance.now() + (dl && dl.timeRemaining ? U.clamp(dl.timeRemaining(), 4, 10) : 6);
      do { LAZY.shift()(); } while (LAZY.length && performance.now() < end);
      if (LAZY.length) idle(step); else lazyOn = false;
    };
    idle(step);
  }
  function sketch(fn) { SK = true; try { return fn(); } finally { SK = false; } }
  /** Pose set: frames[pose] = [boil variants...]; variant 0 is drawn now, the others later. */
  function poseSet(n, boil, make, flashAll) {
    const fr = [];
    for (let i = 0; i < n; i++) {
      fr[i] = [make(i, 0, true)];
      for (let v = 1; v < boil; v++) LAZY.push(() => fr[i].push(make(i, v, flashAll)));
    }
    return fr;
  }
  const JBOX = [-15, -37, 17, 2], CBOX = [-14, -36, 16, 2], GBOX = [-15, -27, 14, 2], XBOX = [-26, -66, 32, 3];
  function buildSprites() {
    // main character: 8-pose walk, 3-pose breathing idle + blink, dash (anticipation, stretch), hurt recoil
    const JK = (P, seed, fl) => mk(JBOX[0], JBOX[1], JBOX[2], JBOX[3], (c) => drawJack(c, P, U.rng(seed)), { halo: 0.95, haloA: 0.88, flash: fl });
    SPR.jack = {
      walk: poseSet(8, 3, (i, v, fl) => JK(jackWalk(i), 100 + i * 7 + v * 31, fl)),
      idle: poseSet(3, 3, (i, v, fl) => JK(jackIdle(i, 1), 200 + i * 7 + v * 31, fl)),
      blink: poseSet(1, 2, (i, v, fl) => JK(jackIdle(1, 0.12), 230 + v * 31, fl)),
      dash: poseSet(2, 2, (i, v, fl) => JK(JACK_DASH[i], 250 + i * 7 + v * 31, fl)),
      hurt: poseSet(1, 2, (i, v) => JK(JACK_HURT, 270 + v * 31, true), true),
    };
    // creatures: designed variants, pose cycles, line-boil variants, a flash copy, and a construction sketch
    SPR.creeper = [0, 1].map((vv) => poseSet(6, 2, (i, v, fl) => mk(CBOX[0], CBOX[1], CBOX[2], CBOX[3], (c) => drawCreeper(c, creeperPose(i), U.rng(300 + i * 13 + v * 41 + vv * 97), vv), { halo: 0.9, haloA: 0.88, flash: fl })));
    SPR.ghost = [0, 1].map((vv) => poseSet(6, 2, (i, v, fl) => mk(GBOX[0], GBOX[1], GBOX[2], GBOX[3], (c) => drawGhost(c, i, U.rng(500 + i * 13 + v * 41 + vv * 97), vv), { halo: 0.8, haloA: 0.6, flash: fl })));
    SPR.colossus = [poseSet(6, 3, (i, v, fl) => mk(XBOX[0], XBOX[1], XBOX[2], XBOX[3], (c) => drawColossus(c, colossusPose(i), U.rng(700 + i * 13 + v * 41)), { halo: 1.1, haloA: 0.88, flash: fl }))];
    const sk = (box, fn) => sketch(() => mk(box[0], box[1], box[2], box[3], fn, { halo: 0, grain: 0.55 }));
    SPR.sketch = {
      creeper: [0, 1].map((vv) => sk(CBOX, (c) => drawCreeper(c, creeperPose(0), U.rng(390 + vv), vv))),
      ghost: [0, 1].map((vv) => sk(GBOX, (c) => drawGhost(c, 0, U.rng(590 + vv), vv))),
      colossus: [sk(XBOX, (c) => drawColossus(c, colossusPose(1), U.rng(790)))],
    };
    // projectile, orbiting lantern, collectibles
    SPR.seed = [0, 1].map((v) => mk(-3.8, -2.4, 3.8, 2.4, (c) => drawSeed(c, U.rng(400 + v)), { pad: 0.8, halo: 0.6 }));
    SPR.trail = mk(-16, -2.4, 0, 2.4, (c) => drawTrail(c, U.rng(410)), { pad: 0.5, halo: 0 });
    SPR.lantern = [0, 1, 2].map((v) => mk(-10, -15.5, 10, 4, (c) => drawLantern(c, U.rng(420 + v)), { halo: 0.7, haloA: 0.7 }));
    SPR.gem = [0, 1].map((v) => mk(-3.2, -7.2, 3.2, 0.6, (c) => drawGem(c, false, U.rng(430 + v)), { pad: 1, halo: 0.6 }));
    SPR.gemBig = [0, 1].map((v) => mk(-8, -14, 8, 1.5, (c) => drawGem(c, true, U.rng(440 + v)), { pad: 1, halo: 0.6 }));
    SPR.tick = mk(-3, -3, 3, 3, (c) => {
      const r = U.rng(445);
      for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU; stroke(c, [[Math.cos(a) * 0.7, Math.sin(a) * 0.7], [Math.cos(a) * (k & 1 ? 1.8 : 2.8), Math.sin(a) * (k & 1 ? 1.8 : 2.8)]], { rng: r, w: 0.42, c: CW, a: 1, dbl: false }); }
    }, { pad: 0.3, halo: 0, grain: 0.3 });
    // contact shadows (damp sponge marks)
    SPR.shJack = shadowSpr(7, 2.2); SPR.shCreeper = shadowSpr(7.5, 2.3); SPR.shGhost = shadowSpr(4.8, 1.4);
    SPR.shColossus = shadowSpr(18, 4.6); SPR.shGem = shadowSpr(2.4, 0.7); SPR.shTree = shadowSpr(16, 4);
    SPR.shSmall = shadowSpr(8, 2.2); SPR.shWide = shadowSpr(18, 2.6); SPR.shTiny = shadowSpr(5, 1.5);
    // particles: chalk dust (side-of-the-chalk smudges + specks), crumbs, impact ticks, stars, ring, smears, eraser, streaks
    const dust = [0, 1, 2].map((v) => mk(-5, -4, 5, 4, (c) => {
      const r = U.rng(500 + v);
      for (let k = 0; k < 4; k++) {
        const x = R(-2.4, 2.4, r), y = R(-1.8, 1.8, r), rr = R(1.6, 3.0, r);
        const e = ell(x, y, rr, rr * 0.7, 14, J(0.6, r));
        rub(c, e, CW, 0.17);
        side(c, e, { rng: r, c: CW, a: 0.62, ang: -0.3 + J(0.3, r), sp: 0.45, gap: 0.42 });
      }
      for (let k = 0; k < 16; k++) dot(c, R(-4.6, 4.6, r), R(-3.6, 3.6, r), R(0.12, 0.3, r), CW, 0.85);
    }, { pad: 0.3, halo: 0, grain: 0.75 }));
    SPR.dust = PALL.map((col, i) => (i === 0 ? dust : dust.map((s) => ({ c: U.tint(s.c, rgba(col, 1)), ax: s.ax, ay: s.ay }))));
    // kill puff: a scalloped chalk cloud (the comic poof) – side-of-the-chalk fill inside a tip outline, two curls
    const poof = [0, 1, 2].map((v) => mk(-10, -9, 10, 9, (c) => {
      const r = U.rng(590 + v), n = 6 + v, pts = [];
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * TAU + v * 0.4, a1 = ((k + 1) / n) * TAU + v * 0.4, rr = R(5.0, 6.6, r), bump = R(1.3, 2.2, r);
        for (let j = 0; j < 5; j++) { const q = j / 5, an = a0 + (a1 - a0) * q, bb = rr + Math.sin(q * Math.PI) * bump; pts.push([Math.cos(an) * bb, Math.sin(an) * bb * 0.84]); }
      }
      rub(c, pts, CW, 0.18);
      side(c, pts, { rng: r, c: CW, a: 0.6, ang: -0.42, sp: 0.5, gap: 0.38, lit: 1 });
      hatch(c, ell(2.6, 2.6, 5.5, 3.6, 16), { rng: r, ang: 0.85, sp: 1.1, w: 0.32, c: CW, a: 0.45 });
      stroke(c, pts, { rng: r, closed: true, w: 0.8, c: CW, a: 1, step: 0.7 });
      for (let k = 0; k < 2; k++) {
        const cx = R(-3.2, 2.4, r), cy = R(-2.6, 1.6, r), cur = [];
        for (let j = 0; j < 10; j++) { const an = j * 0.72 + k, r2 = 0.35 + j * 0.2; cur.push([cx + Math.cos(an) * r2, cy + Math.sin(an) * r2]); }
        stroke(c, cur, { rng: r, w: 0.42, c: CW, a: 0.85, dbl: false });
      }
    }, { pad: 0.5, halo: 0, grain: 0.5 }));
    SPR.poof = PALL.map((col, i) => (i === 0 ? poof : poof.map((s) => ({ c: U.tint(s.c, rgba(col, 1)), ax: s.ax, ay: s.ay }))));
    const crumb = [0, 1].map((v) => mk(-1.6, -0.9, 1.6, 0.9, (c) => {
      const r = U.rng(510 + v), p = [];
      for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; p.push([Math.cos(a) * R(0.9, 1.5, r), Math.sin(a) * R(0.4, 0.8, r)]); }
      c.fillStyle = rgba(CW, 1); c.beginPath(); poly(c, p); c.fill();
    }, { pad: 0.2, halo: 0, grain: 0.5 }));
    SPR.crumb = PALL.map((col) => crumb.map((s) => ({ c: U.tint(s.c, rgba(col, 1)), ax: s.ax, ay: s.ay })));
    const pow = [0, 1, 2].map((v) => mk(-5, -5, 5, 5, (c) => {
      const r = U.rng(520 + v), n = 6 + v;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + R(-0.2, 0.2, r), r0 = R(1.4, 2.0, r), r1 = k & 1 ? R(2.8, 3.4, r) : R(4.0, 4.8, r);
        stroke(c, [[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1]], { rng: r, w: k & 1 ? 0.45 : 0.62, c: CW, a: 1, dbl: false });
      }
      const st = starPts(0, 0, 1.5, 0.7, 4, 0.4);
      rub(c, st, CW, 0.9);
    }, { pad: 0.4, halo: 0, grain: 0.35 }));
    SPR.pow = PALL.map((col, i) => (i === 0 ? pow : pow.map((s) => ({ c: U.tint(s.c, rgba(col, 1)), ax: s.ax, ay: s.ay }))));
    SPR.star = mk(-3.5, -3.5, 3.5, 3.5, (c) => { const r = U.rng(540); const p = starPts(0, 0, 3.2, 1.3, 5, 0); rub(c, p, CY, 0.4); side(c, p, { rng: r, c: CY, a: 0.6, sp: 0.4 }); stroke(c, p, { rng: r, closed: true, w: 0.6, c: CY, a: 1, step: 0.6 }); }, { pad: 0.4, halo: 0, grain: 0.5 });
    SPR.ring = mk(-14, -14, 14, 14, (c) => {
      const r = U.rng(550);
      stroke(c, ell(0, 0, 11.5, 11.5, 48), { rng: r, closed: true, w: 0.95, c: CY, a: 1 });
      stroke(c, ell(0, 0, 9.4, 9.4, 40), { rng: r, closed: true, w: 0.5, c: CO, a: 0.8, dbl: false });
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, l = k & 1 ? 13.2 : 14.2; stroke(c, [[Math.cos(a) * 12.4, Math.sin(a) * 12.4], [Math.cos(a) * l, Math.sin(a) * l]], { rng: r, w: 0.5, c: CY, a: 1, dbl: false, step: 0.4 }); }
    }, { pad: 0.5, halo: 0, grain: 0.5 });
    SPR.smear = [0, 1, 2].map((v) => mk(-13, -4.5, 13, 4.5, (c) => {
      // an eraser wipe: a streaky band of smeared dust, heavier in the middle, ragged ends
      const r = U.rng(560 + v);
      for (let k = 0; k < 16; k++) {
        const y = R(-3.2, 3.2, r), x0 = R(-12, -5, r) + Math.abs(y) * 1.2, x1 = R(5, 12, r) - Math.abs(y) * 1.2;
        c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo(0, y + R(-0.8, 0.8, r), x1, y + R(-0.6, 0.6, r));
        c.lineWidth = R(0.4, 1.8, r); c.strokeStyle = rgba(CW, R(0.07, 0.22, r)); c.stroke();
      }
      for (let k = 0; k < 14; k++) dot(c, R(-11, 11, r), R(-3.6, 3.6, r), R(0.1, 0.26, r), CW, 0.5);
    }, { pad: 0.3, halo: 0, grain: 0.45 }));
    SPR.eraser = mk(-7.5, -3.6, 7.5, 3.6, (c) => {
      const r = U.rng(570);
      const top = [[-7, -3.4], [7, -3.4], [7, 0.2], [-7, 0.2]];
      c.fillStyle = rgba(CWD, 1); c.beginPath(); poly(c, top); c.fill();
      hatch(c, top, { rng: r, ang: 0.05, sp: 0.9, w: 0.35, c: [120, 82, 52], a: 0.9 });
      const felt = [[-7, 0.2], [7, 0.2], [6.6, 3.2], [-6.6, 3.2]];
      c.fillStyle = 'rgb(84,88,86)'; c.beginPath(); poly(c, felt); c.fill();
      hatch(c, felt, { rng: r, ang: 1.5, sp: 0.6, w: 0.25, c: CW, a: 0.45 });
      stroke(c, top.concat([[-7, 3.2]]), { rng: r, closed: false, w: 0.35, c: [60, 40, 26], a: 0.8, dbl: false });
    }, { pad: 0.4, halo: 0, grain: 0.2 });
    SPR.streak = [0, 1].map((v) => mk(-12, -1, 0, 1, (c) => {
      const r = U.rng(580 + v);
      stroke(c, [[0, 0], [-4, J(0.2, r)], [-11, J(0.4, r)]], { rng: r, w: 0.6, c: CW, a: 0.9, dbl: false, j: 0.05 });
    }, { pad: 0.4, halo: 0, grain: 0.6 }));
    // doodles
    SPR.doodle = {};
    let ds = 600;
    for (const k in DOODLES) SPR.doodle[k] = [0, 1].map(() => { const s = ds++; return mk(-7, -7, 7, 7, (c) => DOODLES[k](c, U.rng(s)), { pad: 0.5, halo: 0, grain: 0.8 }); });
    // props: designed variants per kind
    const P = {};
    const pm = (box, fn, seed, h) => mk(box[0], box[1], box[2], box[3], (c) => fn(c, U.rng(seed)), { halo: h || 0.85, haloA: 0.85 });
    P.tree = [0, 1].map((v) => pm([-26, -72, 26, 3], artTree, 800 + v * 13));
    P.pine = [0, 1].map((v) => pm([-22, -70, 22, 3], artPine, 815 + v * 13));
    P.autumn = [0, 1].map((v) => pm([-26, -70, 26, 3], artAutumn, 830 + v * 13));
    P.dead = [0, 1].map((v) => mk(-24, -62, 24, 3, (c) => artDeadTree(c, U.rng(840 + v * 13), v), { halo: 0.8, haloA: 0.75 }));
    P.grave = [0, 1, 2].map((v) => mk(-10, -21, 10, 2.5, (c) => artGrave(c, U.rng(870 + v * 5), v), { halo: 0.8, haloA: 0.88 }));
    P.fence = [0, 1].map((v) => pm([-19, -17, 19, 2.5], artFence, 890 + v * 5, 0.7));
    P.scare = [pm([-17, -48, 17, 2.5], artScarecrow, 910, 0.8)];
    P.pump = [0, 1, 2].map((v) => mk(-12, -15, 12, 2.5, (c) => artPumpkins(c, U.rng(930 + v), v), { halo: 0.8, haloA: 0.9 }));
    P.sign = [pm([-10, -27, 13, 2.5], artSign, 950, 0.8)];
    P.reeds = [0, 1].map((v) => mk(-11, -25, 11, 4, (c) => artReeds(c, U.rng(960 + v), v), { halo: 0.6, haloA: 0.7 }));
    P.stones = [0, 1].map((v) => mk(-10, -10, 10, 2.5, (c) => artStones(c, U.rng(970 + v), v), { halo: 0.7, haloA: 0.85 }));
    P.mush = [0, 1].map((v) => mk(-9, -12, 10, 2.5, (c) => artMush(c, U.rng(980 + v), v), { halo: 0.7, haloA: 0.85 }));
    P.bush = [0, 1].map((v) => pm([-12, -15, 12, 2.5], artBush, 990 + v * 7, 0.75));
    SPR.props = P;
  }

  /* ===================================================================================== ground textures */
  const TN = 512;
  let TEXRES = 0, MEADOW = null, FIELD = null, FOREST = null, FOREST2 = null, FROST = null, STIP = null, BT = null, GR = null;
  function wrapAt(x, y, m, fn) {
    for (let oy = -TN; oy <= TN; oy += TN) {
      const yy = y + oy;
      if (yy < -m || yy > TN + m) continue;
      for (let ox = -TN; ox <= TN; ox += TN) {
        const xx = x + ox;
        if (xx < -m || xx > TN + m) continue;
        fn(xx, yy);
      }
    }
  }
  function mkT(fn) {
    const { c, ctx } = cpuCanvas(TN, TN);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    fn(ctx);
    return ctx.getImageData(0, 0, TN, TN).data;
  }
  /** Periodic family of broken parallel chalk lines y = c + m x (pixel space). */
  function lineFamily(ctx, rng, m, spU, cols, segA, segB, gapA, gapB, wU, aA, aB) {
    const u = TEXRES;
    const dd0 = spU * u * Math.sqrt(1 + m * m);
    let n = Math.max(4, Math.round(TN / dd0));
    if (n & 1) n++;
    const dd = TN / n, kx = 1 / Math.sqrt(1 + m * m);
    const bt = new Batch();
    for (let i = 0; i < n; i++) {
      const c0 = i * dd;
      let x = -rng.next() * segB * u;
      while (x < TN) {
        const L = R(segA, segB, rng) * u * kx;
        const col = cols[(rng.next() * cols.length) | 0];
        const jy = J(0.25 * u, rng), bend = J(0.3 * u, rng);
        const X0 = ((x % TN) + TN) % TN, Y0 = (((c0 + m * x + jy) % TN) + TN) % TN;
        const p = bt.path(col, R(aA, aB, rng), wU * u * R(0.75, 1.2, rng));
        wrapAt(X0, Y0, L * 2 + 8, (xx, yy) => {
          p.moveTo(xx, yy);
          p.quadraticCurveTo(xx + L / 2, yy + (m * L) / 2 + bend, xx + L, yy + m * L);
        });
        x += L + R(gapA, gapB, rng) * u * kx;
      }
    }
    bt.flush(ctx);
  }
  function buildTextures(res) {
    TEXRES = res;
    const u = res;
    const areaU = (TN / u) * (TN / u);
    // meadow: short tufts of hatch strokes
    MEADOW = mkT((c) => {
      const rng = U.rng(101), bt = new Batch();
      const n = Math.round(areaU / 46);
      for (let i = 0; i < n; i++) {
        const x = rng.next() * TN, y = rng.next() * TN;
        const pk = rng.next();
        const col = pk < 0.6 ? CM : pk < 0.86 ? CG : pk < 0.95 ? CY : CW;
        const ang = -Math.PI / 2 + R(-0.45, 0.45, rng);
        const cnt = 3 + ((rng.next() * 2) | 0);
        const dx = Math.cos(ang), dy = Math.sin(ang);
        const segs = [];
        for (let k = 0; k < cnt; k++) {
          const L = R(2.4, 4.4, rng) * u, o = k * R(0.95, 1.25, rng) * u;
          segs.push([-dy * o + J(0.15 * u, rng), dx * o + J(0.5 * u, rng), L, J(0.3 * u, rng)]);
        }
        const p = bt.path(col, R(0.5, 0.88, rng), 0.55 * u * R(0.85, 1.15, rng));
        wrapAt(x, y, 6 * u, (xx, yy) => {
          for (const s of segs) {
            p.moveTo(xx + s[0], yy + s[1]);
            p.lineTo(xx + s[0] + dx * s[2] + s[3], yy + s[1] + dy * s[2]);
          }
        });
      }
      bt.flush(c);
    });
    // fields: three plot patterns
    FIELD = [
      mkT((c) => lineFamily(c, U.rng(201), 0.5, 2.6, [CO, CO, CO, CY], 4, 14, 0.6, 2.6, 0.6, 0.6, 0.95)),
      mkT((c) => lineFamily(c, U.rng(202), -1, 2.7, [CY, CY, CY, CO], 4, 14, 0.6, 2.6, 0.58, 0.6, 0.95)),
      mkT((c) => {
        const rng = U.rng(203), bt = new Batch();
        const rows = Math.round(TN / (4.2 * u));
        const dy = TN / rows;
        for (let i = 0; i < rows; i++) {
          let x = rng.next() * u * 2;
          const y = i * dy;
          const col = i % 3 === 0 ? CO : CY;
          while (x < TN) {
            const h = R(1.2, 2.2, rng) * u, lx = J(0.5 * u, rng);
            const p = bt.path(col, R(0.6, 0.95, rng), 0.55 * u);
            wrapAt(x, y, 4 * u, (xx, yy) => { p.moveTo(xx, yy + h * 0.5); p.lineTo(xx + lx, yy - h * 0.5); });
            x += R(1.2, 2.0, rng) * u;
          }
        }
        bt.flush(c);
      }),
    ];
    // forest: lavender cross-hatching
    FOREST = mkT((c) => lineFamily(c, U.rng(301), 1, 3.6, [CL, CL, CL, CP], 2, 9, 1.2, 4.5, 0.55, 0.45, 0.88));
    FOREST2 = mkT((c) => lineFamily(c, U.rng(302), -1, 4.2, [CL, CL, CW], 2, 7, 1.6, 5.5, 0.5, 0.4, 0.8));
    // frost: rubbed light blue + snow asterisks
    FROST = mkT((c) => {
      const rng = U.rng(401);
      const nb = Math.round(areaU / 260);
      for (let i = 0; i < nb; i++) {
        const x = rng.next() * TN, y = rng.next() * TN, r = R(6, 18, rng) * u, a = R(0.12, 0.26, rng);
        const col = rng.next() < 0.7 ? CB : CW;
        wrapAt(x, y, r, (xx, yy) => {
          const g = c.createRadialGradient(xx, yy, 0, xx, yy, r);
          g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
          c.fillStyle = g; c.fillRect(xx - r, yy - r, r * 2, r * 2);
        });
      }
      const ns = Math.round(areaU / 300);
      for (let i = 0; i < ns; i++) {
        const x = rng.next() * TN, y = rng.next() * TN, L = R(8, 20, rng) * u, w = R(1.5, 3.5, rng) * u, sl = J(0.15, rng);
        c.beginPath(); wrapAt(x, y, L + w, (xx, yy) => { c.moveTo(xx, yy); c.lineTo(xx + L, yy + sl * L); });
        c.lineWidth = w; c.strokeStyle = rgba(CW, R(0.05, 0.1, rng)); c.stroke();
      }
      const nf = Math.round(areaU / 140), bt = new Batch();
      for (let i = 0; i < nf; i++) {
        const x = rng.next() * TN, y = rng.next() * TN, s = R(0.7, 1.3, rng) * u, a0 = rng.next();
        const p = bt.path(rng.next() < 0.5 ? CW : CB, R(0.55, 0.9, rng), 0.38 * u);
        wrapAt(x, y, s * 2, (xx, yy) => { for (let k = 0; k < 3; k++) { const a = a0 + (k / 3) * Math.PI; p.moveTo(xx - Math.cos(a) * s, yy - Math.sin(a) * s); p.lineTo(xx + Math.cos(a) * s, yy + Math.sin(a) * s); } });
      }
      bt.flush(c);
    });
    // stipple (path): R channel = rank
    STIP = mkT((c) => {
      const rng = U.rng(501), bk = [];
      for (let k = 0; k < 8; k++) bk.push(new Path2D());
      const n = Math.round(areaU / 2.4);
      for (let i = 0; i < n; i++) {
        const x = rng.next() * TN, y = rng.next() * TN, r = R(0.3, 0.55, rng) * u, rank = (rng.next() * 8) | 0;
        const p = bk[rank];
        wrapAt(x, y, r, (xx, yy) => { p.rect(xx - r, yy - r, r * 2, r * 2); });
      }
      for (let k = 0; k < 8; k++) { c.fillStyle = 'rgb(' + (k * 32 + 8) + ',255,255)'; c.fill(bk[k]); }
    });
    // board smudges
    const bd = mkT((c) => {
      const rng = U.rng(601);
      c.fillStyle = 'rgb(128,128,128)'; c.fillRect(0, 0, TN, TN);
      for (let i = 0; i < 160; i++) {
        const x = rng.next() * TN, y = rng.next() * TN, r = R(8, 45, rng) * u, a = R(0.03, 0.09, rng), lt = rng.next() < 0.55;
        wrapAt(x, y, r, (xx, yy) => {
          const g = c.createRadialGradient(xx, yy, 0, xx, yy, r);
          g.addColorStop(0, lt ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(128,128,128,0)');
          c.fillStyle = g; c.fillRect(xx - r, yy - r, r * 2, r * 2);
        });
      }
      for (let i = 0; i < 40; i++) {
        const x = rng.next() * TN, y = rng.next() * TN, L = R(30, 120, rng) * u, w = R(2, 8, rng) * u, sl = J(0.2, rng);
        c.beginPath(); wrapAt(x, y, L + w, (xx, yy) => { c.moveTo(xx, yy); c.quadraticCurveTo(xx + L / 2, yy + sl * L + J(4 * u, rng) * 0, xx + L, yy + sl * L * 0.3); });
        c.lineWidth = w; c.strokeStyle = rng.next() < 0.6 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.04)'; c.stroke();
      }
    });
    BT = new Int8Array(TN * TN);
    for (let i = 0; i < TN * TN; i++) BT[i] = U.clamp(Math.round((bd[i * 4] - 128) * 0.8), -16, 16);
    GR = new Uint8Array(256 * 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const h = U.hash2(x, y, 5), h2 = U.hash2(x >> 1, y >> 1, 6), h3 = U.hash2(x >> 2, y, 7);
        let v = 0.86 + 0.14 * h;
        if (h2 < 0.13) v = 0.5;
        if (h < 0.16) v = 0.1 + h * 1.6;
        if (h3 < 0.05) v *= 0.4;
        GR[y * 256 + x] = Math.round(v * 255);
      }
    }
  }

  /* ===================================================================================== world fields */
  const TH1 = 0.455, TH2 = 0.553, THF = 0.585, ROADW = 8.5, GAP = 1.7, LW = 0.5;
  function fields(x, y, o) {
    o.A = U.warped(x / 760, y / 760, 11, 1.0, 3);
    o.F = U.fbm(x / 420 + 13.1, y / 420 - 7.7, 23, 3);
    const qx = U.noise(x / 1900, y / 1900, 31) - 0.5, qy = U.noise(x / 1900 + 5.3, y / 1900 + 1.7, 32) - 0.5;
    o.R = U.perlin(x / 1250 + qx * 0.9, y / 1250 + qy * 0.9, 37);
    o.T = U.fbm(x / 150, y / 150, 41, 2);
    o.H = U.fbm(x / 520, y / 520, 53, 2);
    o.W = U.perlin(x / 11, y / 11, 59) * 0.45;
  }
  function roadAt(x, y) {
    const f = (xx, yy) => {
      const qx = U.noise(xx / 1900, yy / 1900, 31) - 0.5, qy = U.noise(xx / 1900 + 5.3, yy / 1900 + 1.7, 32) - 0.5;
      return U.perlin(xx / 1250 + qx * 0.9, yy / 1250 + qy * 0.9, 37);
    };
    const r = f(x, y), e = 2;
    const g = Math.hypot((f(x + e, y) - r) / e, (f(x, y + e) - r) / e) + 1e-7;
    return Math.abs(r) / g - ROADW;
  }
  function matAt(x, y) {
    const o = {}, ox = {}, oy = {}, e = 2;
    fields(x, y, o); fields(x + e, y, ox); fields(x, y + e, oy);
    const gA = Math.hypot((ox.A - o.A) / e, (oy.A - o.A) / e) + 1e-7;
    const gF = Math.hypot((ox.F - o.F) / e, (oy.F - o.F) / e) + 1e-7;
    const gR = Math.hypot((ox.R - o.R) / e, (oy.R - o.R) / e) + 1e-7;
    const d1 = (o.A - TH1) / gA, d2 = (o.A - TH2) / gA, dF = (o.F - THF) / gF;
    const m = { dR: Math.abs(o.R) / gR - ROADW };
    if (d1 < 0) { m.mat = 'forest'; m.edge = -d1; }
    else if (d2 > 0) { m.mat = 'field'; m.edge = d2; }
    else { m.mat = dF > 0 ? 'frost' : 'meadow'; m.edge = Math.min(d1, -d2, Math.abs(dF)); }
    return m;
  }

  /* ===================================================================================== ground chunk */
  const GN = 64, CWU = 256 / GN, NCH = 7;
  const WO = {};
  function* renderGround(ctx, info) {
    if (TEXRES !== info.res) buildTextures(info.res);
    const res = info.res, Wp = info.px, wx = info.wx, wy = info.wy;
    const RW = GN + 3;
    const raw = new Float32Array(RW * RW * 6);
    const o = {};
    for (let j = 0; j < RW; j++) {
      if ((j & 3) === 3) yield;
      const y = wy + (j - 1) * CWU;
      for (let i = 0; i < RW; i++) {
        fields(wx + (i - 1) * CWU, y, o);
        const k = (j * RW + i) * 6;
        raw[k] = o.A; raw[k + 1] = o.F; raw[k + 2] = o.R; raw[k + 3] = o.T; raw[k + 4] = o.H; raw[k + 5] = o.W;
      }
    }
    const gw = GN + 1;
    const g = new Float32Array(gw * gw * NCH);
    const inv = 1 / (2 * CWU);
    for (let j = 0; j < gw; j++) {
      for (let i = 0; i < gw; i++) {
        const k = ((j + 1) * RW + (i + 1)) * 6, kx0 = k - 6, kx1 = k + 6, ky0 = k - RW * 6, ky1 = k + RW * 6;
        const gA = Math.hypot((raw[kx1] - raw[kx0]) * inv, (raw[ky1] - raw[ky0]) * inv) + 1e-7;
        const gF = Math.hypot((raw[kx1 + 1] - raw[kx0 + 1]) * inv, (raw[ky1 + 1] - raw[ky0 + 1]) * inv) + 1e-7;
        const gR = Math.hypot((raw[kx1 + 2] - raw[kx0 + 2]) * inv, (raw[ky1 + 2] - raw[ky0 + 2]) * inv) + 1e-7;
        const q = (j * gw + i) * NCH;
        g[q] = Math.min(80, Math.abs(raw[k + 2]) / gR) - ROADW;
        g[q + 1] = U.clamp((raw[k] - TH1) / gA, -80, 80);
        g[q + 2] = U.clamp((raw[k] - TH2) / gA, -80, 80);
        g[q + 3] = U.clamp((raw[k + 1] - THF) / gF, -80, 80);
        g[q + 4] = raw[k + 3]; g[q + 5] = raw[k + 4]; g[q + 6] = raw[k + 5];
      }
    }
    yield;
    const img = ctx.createImageData(Wp, Wp), d = img.data;
    const gpx = Math.round(wx * res), gpy = Math.round(wy * res);
    const ipx = 1 / res, sc = GN / Wp;
    const sm = U.smoothstep;
    const B0 = BOARD[0], B1 = BOARD[1], B2 = BOARD[2];
    // world-unit -> pixel factor for crisp 1-px-ish chalk lines from distance fields
    const lr = res * 0.9;
    for (let py = 0; py < Wp; py++) {
      yield;
      const Y = wy + (py + 0.5) * ipx;
      const gyf = (py + 0.5) * sc, gy0 = gyf | 0, fy = gyf - gy0;
      const tRow = ((gpy + py) & 511) * 512, gRow = ((gpy + py) & 255) * 256;
      const bRow2 = (((gpy + py) >> 1) + 173 & 511) * 512;
      for (let px = 0; px < Wp; px++) {
        const gxf = (px + 0.5) * sc, gx0 = gxf | 0, fx = gxf - gx0;
        const q00 = (gy0 * gw + gx0) * NCH, q10 = q00 + NCH, q01 = q00 + gw * NCH, q11 = q01 + NCH;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        const dR = g[q00] * w00 + g[q10] * w10 + g[q01] * w01 + g[q11] * w11;
        const H = g[q00 + 5] * w00 + g[q10 + 5] * w10 + g[q01 + 5] * w01 + g[q11 + 5] * w11;
        const T = g[q00 + 4] * w00 + g[q10 + 4] * w10 + g[q01 + 4] * w01 + g[q11 + 4] * w11;
        const tx = (gpx + px) & 511, ti = tRow + tx, t4 = ti * 4;
        const gm = GR[gRow + ((gpx + px) & 255)] * 0.0039216;
        const bt = BT[ti] * 0.6 + BT[bRow2 + ((((gpx + px) >> 1) + 91) & 511)] * 0.6;
        const hz = (H - 0.5) * 22 + bt;
        let br = B0 + hz * 0.9, bg = B1 + hz, bb = B2 + hz * 0.95;
        let a = 0, cr = 0, cg = 0, cb = 0, la = 0, lr0 = CW[0], lg0 = CW[1], lb0 = CW[2];
        if (dR < 0) {
          // ---- path: a walked, dusty band – faint side-of-the-chalk rub, broken edge lines, dust in patches
          const dep = -dR;
          const dust = 0.055 * (0.5 + 0.5 * gm) * (0.6 + 0.4 * sm(0.3, 0.7, T));
          br += (CW[0] - br) * dust; bg += (CW[1] - bg) * dust; bb += (CW[2] - bb) * dust;
          const ev = (0.42 - Math.abs(dep - 0.8)) * lr + 0.5;
          if (ev > 0 && T > 0.3) { const v = (ev > 1 ? 1 : ev) * 0.78 * (0.35 + 0.65 * gm) * sm(0.3, 0.38, T); if (v > la) la = v; }
          const sa = STIP[t4 + 3];
          if (sa > 0 && STIP[t4] < 120) {
            const v = sm(0.5, 0.75, T) * sm(2.5, 4.5, dep) * 0.55 + (1 - sm(1.4, 3.2, dep)) * 0.4;
            a = (sa / 255) * v * (0.45 + 0.55 * gm);
            cr = CW[0]; cg = CW[1]; cb = CW[2];
          }
        } else if (dR >= GAP) {
          const wob = g[q00 + 6] * w00 + g[q10 + 6] * w10 + g[q01 + 6] * w01 + g[q11 + 6] * w11;
          const d1 = g[q00 + 1] * w00 + g[q10 + 1] * w10 + g[q01 + 1] * w01 + g[q11 + 1] * w11 + wob;
          const d2 = g[q00 + 2] * w00 + g[q10 + 2] * w10 + g[q01 + 2] * w01 + g[q11 + 2] * w11 + wob;
          const ad1 = d1 < 0 ? -d1 : d1, ad2 = d2 < 0 ? -d2 : d2;
          let near = ad1 < ad2 ? ad1 : ad2;
          let lineV = (LW - near) * res + 0.5;
          let fade = near - LW - 0.9;
          if (dR - GAP < fade) fade = dR - GAP;
          let tex = null, rc = CM, dk = 0.04, gk = 1, dens = 0, tIdx = t4, band = 0;
          if (d1 < 0) {
            // forest: lavender cross-hatching, dense along the edge, then only in clusters – calm board inside
            tex = FOREST; rc = CL; dk = 0.05;
            const fd = -d1;
            dens = Math.max(1 - sm(5, 30, fd), sm(0.56, 0.72, T) * 0.85);
            band = 0.08 * (1 - sm(0.5, 7, fd));
            const l2 = (0.3 - Math.abs(fd - 2.6)) * lr + 0.5;
            if (l2 > 0 && T > 0.4) { const v = (l2 > 1 ? 1 : l2) * 0.6 * (0.3 + 0.7 * gm); if (v > la) { la = v; lr0 = CL[0]; lg0 = CL[1]; lb0 = CL[2]; } }
          } else if (d2 > 0) {
            // fields: plots of furrows, each its own direction and offset; a third left as outlines only
            const X = wx + (px + 0.5) * ipx;
            U.worley(X / 82, Y / 82, 61, 0, WO);
            const e = (WO.f2 - WO.f1) * 41;
            const pl = (0.42 - e) * res + 0.5;
            if (pl > 0) { const v = (pl > 1 ? 1 : pl) * 0.62; if (v > la) { la = v; lr0 = CY[0]; lg0 = CY[1]; lb0 = CY[2]; } }
            if (e - 1.5 < fade) fade = e - 1.5;
            const pid = WO.id % 5;
            tex = FIELD[pid < 2 ? 0 : pid < 4 ? 1 : 2];
            rc = pid < 2 ? CO : CY;
            const ox = (WO.id >>> 7) & 511, oy = (WO.id >>> 16) & 511;
            tIdx = ((((gpy + py + oy) & 511) * 512) + ((gpx + px + ox) & 511)) * 4;
            dens = (WO.id >>> 4) % 3 === 0 ? 0.9 * (1 - sm(1.5, 7, e)) : 0.92;
            band = 0.05 * (1 - sm(0.5, 6, d2));
          } else {
            const dF = g[q00 + 3] * w00 + g[q10 + 3] * w10 + g[q01 + 3] * w01 + g[q11 + 3] * w11 + wob;
            const adF = dF < 0 ? -dF : dF;
            const lf = (LW - adF) * res + 0.5;
            if (lf > lineV) lineV = lf;
            if (adF - LW - 0.9 < fade) fade = adF - LW - 0.9;
            if (dF > 0) {
              // pond: rubbed blue along the shore, ripple lines parallel to it, a darker damp middle
              tex = FROST; rc = CB; dk = 0.03; gk = 0.45;
              band = 0.15 * (1 - sm(0.4, 5, dF));
              const deep = sm(5, 28, dF) * 7;
              br -= deep; bg -= deep * 0.9; bb -= deep * 0.6;
              for (let k = 0; k < 3; k++) {
                const L0 = 2.8 + k * 3.1 + k * k * 0.5, al = 0.62 - k * 0.17;
                const lv = (0.3 - Math.abs(dF - L0)) * lr + 0.5;
                if (lv > 0) {
                  const gate = sm(0.34 + k * 0.05, 0.42 + k * 0.05, T + wob * 0.3);
                  const v = (lv > 1 ? 1 : lv) * al * gate * (0.35 + 0.65 * gm);
                  if (v > la) { la = v; lr0 = CB[0]; lg0 = CB[1]; lb0 = CB[2]; }
                }
              }
              dens = sm(10, 18, dF) * sm(0.52, 0.66, T);
            } else {
              // meadow: grass only in clumps – along region borders, along paths and in a few patches
              tex = MEADOW;
              if (adF < near) near = adF;
              const m1 = 1 - sm(2.5, 13, near), m2 = 1 - sm(GAP + 1, 11, dR), m3 = sm(0.6, 0.74, H) * sm(0.46, 0.64, T);
              dens = Math.max(m1 * 0.9, m2 * 0.8, m3);
              dens *= 0.55 + 0.45 * sm(0.3, 0.6, T);
            }
          }
          fade = fade * 0.6;
          fade = fade < 0 ? 0 : fade > 1 ? 1 : fade;
          // region dust tint + side-of-the-chalk band just inside the edge
          const dt = dk * fade + band * (0.45 + 0.55 * gm);
          br += (rc[0] - br) * dt; bg += (rc[1] - bg) * dt; bb += (rc[2] - bb) * dt;
          let ta = tex[tIdx + 3], tsrc = tex;
          if (tex === FOREST) {
            const tb = FOREST2[t4 + 3] * sm(0.4, 0.62, T);
            if (tb > ta) { ta = tb; tsrc = FOREST2; }
          }
          if (ta > 0 && dens > 0.01) {
            a = (ta / 255) * dens * fade * (1 - gk + gk * gm);
            cr = tsrc[tIdx]; cg = tsrc[tIdx + 1]; cb = tsrc[tIdx + 2];
          }
          if (lineV > 0) {
            const v = (lineV > 1 ? 1 : lineV) * 0.8 * (0.3 + 0.7 * gm);
            if (v > la) { la = v; lr0 = CW[0]; lg0 = CW[1]; lb0 = CW[2]; }
          }
        }
        let r = br + (cr - br) * a, gg = bg + (cg - bg) * a, b = bb + (cb - bb) * a;
        if (la > 0) { r += (lr0 - r) * la; gg += (lg0 - gg) * la; b += (lb0 - b) * la; }
        const o4 = (py * Wp + px) * 4;
        d[o4] = r; d[o4 + 1] = gg; d[o4 + 2] = b; d[o4 + 3] = 255;
      }
    }
    for (let b = 0; b < Wp; b += 96) {
      ctx.putImageData(img, 0, 0, 0, b, Wp, Math.min(96, Wp - b));
      yield;
    }
    yield* decals(ctx, info);
  }

  /* ---------- decals: eraser swipes, doodles, words, pebbles ---------- */
  const FONTOK = {};
  let fontScanAt = 0;
  function fontOK(f) {
    if (FONTOK[f]) return true;
    if (!document.fonts) return false;
    const now = performance.now();
    if (now - fontScanAt < 250) return false;
    fontScanAt = now;
    document.fonts.forEach((ff) => { if (ff.status === 'loaded') FONTOK[ff.family.replace(/["']/g, '')] = true; });
    return !!FONTOK[f];
  }
  const WORDS = ['Boo!', 'Shh…', 'Psst!', 'Hello', 'Oops!', 'Look!', 'Hi there', 'Wow'];
  const WORDCOL = [CW, CY, CL, CO, CP, CB, CW, CY];
  const WCACHE = {};
  function wordSpr(i) {
    if (WCACHE[i]) return WCACHE[i];
    const px = Math.round(8 * K);
    const m = U.canvas(4, 4).ctx;
    m.font = px + 'px "Rock Salt"';
    const w = Math.ceil(m.measureText(WORDS[i]).width + px);
    const { c, ctx } = U.canvas(w, px * 2.2);
    ctx.font = px + 'px "Rock Salt"';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(WORDCOL[i], 0.95);
    ctx.fillText(WORDS[i], px * 0.5, px * 1.1);
    const r = U.rng(990 + i);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px * 0.6, px * 1.95);
    ctx.quadraticCurveTo(w / 2, px * (1.75 + J(0.3, r)), w - px * 0.5, px * 1.9);
    ctx.lineWidth = px * 0.08; ctx.strokeStyle = rgba(WORDCOL[i], 0.7); ctx.stroke();
    applyGrain(ctx, c.width, c.height, 0.9, 40 + i);
    WCACHE[i] = { c, ax: c.width / 2, ay: c.height / 2 };
    return WCACHE[i];
  }
  function stamp(ctx, s, x, y, sc, rot, alpha) {
    const k = sc / K;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.drawImage(s.c, -s.ax * k, -s.ay * k, s.c.width * k, s.c.height * k);
    ctx.restore();
  }
  function* decals(ctx, info) {
    const x0 = info.wx, y0 = info.wy;
    ctx.lineCap = 'round';
    // 1) old eraser wipes: a few big arcs per screen, each over a half-erased older drawing (ghost layer)
    const sw = [];
    G.scatter(info, 360, 515, 190, (x, y, rng) => { if (rng.next() < 0.62) sw.push([x, y, rng]); });
    for (const [x, y, rng] of sw) {
      const rad = R(70, 150, rng), a0 = rng.next() * TAU, span = R(0.7, 1.35, rng), lw = R(20, 34, rng);
      const cx = x - Math.cos(a0 + span / 2) * rad, cy = y - Math.sin(a0 + span / 2) * rad;
      // the ghost layer: an older doodle or word that was wiped – only on calm board
      const n = 1 + ((rng.next() * 3) | 0);
      for (let k = 0; k < n; k++) {
        const t = a0 + span * (0.2 + 0.6 * rng.next()), rr = rad + J(lw * 0.3, rng);
        const gx = cx + Math.cos(t) * rr, gy = cy + Math.sin(t) * rr;
        const m = matAt(gx, gy);
        if (m.dR < 8 || m.mat === 'forest' || m.mat === 'field' || G.nearSpawn(gx, gy, 40)) continue;
        const keys = Object.keys(DOODLES), key = keys[(rng.next() * keys.length) | 0];
        stamp(ctx, SPR.doodle[key][0], gx, gy, R(1.4, 2.2, rng), J(0.5, rng), R(0.14, 0.22, rng));
      }
      // the wipe: lighter haze in the direction of the swipe, feathered ends, felt streaks
      for (let k = 0; k < 4; k++) {
        const s0 = a0 + R(0, 0.12, rng), s1 = a0 + span - R(0, 0.14, rng);
        ctx.beginPath(); ctx.arc(cx, cy, rad + J(2.5, rng), s0, s1);
        ctx.lineWidth = lw * (0.45 + 0.2 * k); ctx.strokeStyle = 'rgba(214,228,218,0.034)'; ctx.stroke();
      }
      for (let k = 0; k < 14; k++) {
        const rr = rad + R(-lw / 2, lw / 2, rng);
        ctx.beginPath(); ctx.arc(cx, cy, rr, a0 + R(0, 0.2, rng), a0 + span - R(0, 0.25, rng));
        ctx.lineWidth = R(0.3, 1.1, rng); ctx.strokeStyle = 'rgba(222,234,226,' + R(0.04, 0.08, rng).toFixed(3) + ')'; ctx.stroke();
      }
      yield;
    }
    yield;
    // 2) doodles: in small groups where the cluster mask is high or along region borders – never evenly spread
    const pts = [];
    G.scatter(info, 40, 717, 10, (x, y, rng) => { if (rng.next() < 0.5) pts.push([x, y, rng]); });
    let n = 0;
    for (const [x, y, rng] of pts) {
      if (G.nearSpawn(x, y, 40)) continue;
      const cl = U.noise(x / 260, y / 260, 77);
      const m = matAt(x, y);
      if (m.dR < 6 || m.edge < 6) continue;
      const atEdge = m.edge < 18 && U.noise(x / 90, y / 90, 78) > 0.58;
      if (cl < 0.66 && !atEdge) continue;
      const set = DOODLE_SETS[m.mat];
      const key = set[(rng.next() * set.length) | 0];
      const s = SPR.doodle[key][rng.next() < 0.5 ? 0 : 1];
      stamp(ctx, s, x, y, R(0.9, 1.35, rng), J(0.35, rng), R(0.55, 0.78, rng));
      if ((++n & 7) === 7) yield;
    }
    yield;
    // 3) handwritten words (fully inside this chunk only, so no seams)
    if (fontOK('Rock Salt')) {
      G.scatterOwned(info, 330, 818, (x, y, rng) => {
        if (rng.next() > 0.7) return;
        if (x < x0 + 50 || x > x0 + 206 || y < y0 + 20 || y > y0 + 236) return;
        if (G.nearSpawn(x, y, 60)) return;
        const m = matAt(x, y);
        if (m.dR < 8 || m.edge < 6 || m.mat === 'field') return;
        const i = (rng.next() * WORDS.length) | 0;
        stamp(ctx, wordSpr(i), x, y, 1, J(0.18, rng), 0.62);
      });
    }
    yield;
    // 4) pebbles in groups along the path edges
    const pb = [];
    G.scatter(info, 9, 919, 3, (x, y, rng) => { if (rng.next() < 0.6) pb.push([x, y, rng]); });
    n = 0;
    for (const [x, y, rng] of pb) {
      const d = roadAt(x, y);
      if (d > -0.9 || d < -3.6) continue;
      if (U.noise(x / 46, y / 46, 91) < 0.55) continue;
      const r = R(0.6, 1.5, rng);
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.25, r * 0.85, J(0.6, rng), 0, TAU);
      if (rng.next() < 0.45) { ctx.fillStyle = 'rgba(230,232,224,0.3)'; ctx.fill(); }
      ctx.lineWidth = 0.42; ctx.strokeStyle = 'rgba(232,234,226,0.68)'; ctx.stroke();
      if ((++n & 31) === 31) yield;
    }
  }

  /* ---------- props: composed – trees at forest edges, reeds on the shore, stones by paths, pumpkins in plots ---------- */
  function propsFor(info) {
    const out = [];
    const P = SPR.props;
    const pick = (arr, rng) => arr[(rng.next() * arr.length) | 0];
    const add = (x, y, type, spr, sh, pad, sway) => out.push({ x, y, type, spr, sh, pad: pad || 40, sway: sway || 0, ph: (x * 0.013 + y * 0.007) % TAU });
    G.scatterOwned(info, 44, 9001, (x, y, rng) => {
      if (G.nearSpawn(x, y, 95)) return;
      const r = rng.next();
      if (r > 0.5) return;
      const m = matAt(x, y);
      if (m.dR < 11) return;
      const cl = U.noise(x / 180, y / 180, 93);
      if (m.mat === 'forest') {
        // dense belt of trees just inside the forest edge, clusters further in, toadstools at their feet
        const belt = m.edge < 34 ? 0.34 : cl > 0.6 ? 0.22 : 0.05;
        if (r < belt) {
          const k = rng.next();
          if (k < 0.5) add(x, y, 'tree', pick(P.tree, rng), SPR.shTree, 90, 0.022);
          else if (k < 0.8) add(x, y, 'pine', pick(P.pine, rng), SPR.shTree, 90, 0.016);
          else add(x, y, 'deadtree', pick(P.dead, rng), SPR.shTree, 80, 0.01);
          if (rng.next() < 0.3) add(x + R(10, 18, rng) * (rng.next() < 0.5 ? -1 : 1), y + R(3, 8, rng), 'mushrooms', pick(P.mush, rng), SPR.shTiny, 30);
        } else if (r < belt + 0.025) add(x, y, 'grave', pick(P.grave, rng), SPR.shSmall);
      } else if (m.mat === 'field') {
        if (r < 0.018) add(x, y, 'scarecrow', P.scare[0], SPR.shSmall, 60, 0.01);
        else if (r < 0.1 && cl > 0.42) add(x, y, 'pumpkin', pick(P.pump, rng), SPR.shSmall);
        else if (r < 0.14 && m.edge < 14) add(x, y, 'fence', pick(P.fence, rng), SPR.shWide);
      } else if (m.mat === 'frost') {
        // reeds hug the shore, a bare tree now and then
        if (m.edge < 7 && r < 0.42) add(x, y, 'reeds', pick(P.reeds, rng), SPR.shTiny, 40, 0.05);
        else if (m.edge < 12 && r < 0.03) add(x, y, 'deadtree', pick(P.dead, rng), SPR.shTree, 80, 0.01);
      } else {
        if (m.dR < 22 && r < 0.06) add(x, y, 'stones', pick(P.stones, rng), SPR.shTiny);
        else if (m.dR < 26 && r < 0.075) add(x, y, 'sign', P.sign[0], SPR.shTiny, 40);
        else if (cl > 0.62 && r < 0.12) {
          // a little graveyard: two or three stones together
          add(x, y, 'grave', pick(P.grave, rng), SPR.shSmall);
          const k = 1 + ((rng.next() * 2) | 0);
          for (let i = 0; i < k; i++) add(x + R(-18, 18, rng), y + R(-12, 12, rng), 'grave', pick(P.grave, rng), SPR.shSmall);
        } else if (m.edge < 16 && r < 0.2) add(x, y, 'bush', pick(P.bush, rng), SPR.shSmall, 40, 0.012);
        else if (r < 0.215) add(x, y, 'tree', pick(P.tree.concat(P.autumn), rng), SPR.shTree, 90, 0.022);
        else if (r < 0.235 && cl > 0.45) add(x, y, 'pumpkin', pick(P.pump, rng), SPR.shSmall);
      }
    });
    return out;
  }

  /* ===================================================================================== icons (100-unit space) */
  function iconSeed(ctx, rng, x, y, a, len, wid) {
    const p = seedPts(x, y, a, len, wid);
    rub(ctx, p, CC, 0.8);
    hatch(ctx, p, { rng, ang: a + 1.2, sp: 3, w: 1.1, c: CY, a: 0.8 });
    stroke(ctx, p, { rng, closed: true, w: 2.6, c: CW, a: 1, step: 2.5, j: 0.4 });
  }
  function drawIconArt(ctx, id) {
    const rng = U.rng(id.split('').reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) >>> 0);
    const S = (pts, c, w, a, closed) => stroke(ctx, pts, { rng, closed, w, c, a: a === undefined ? 1 : a, step: 2.5, j: 0.45 });
    switch (id) {
      case 'hp-heart': {
        const p = [];
        for (let i = 0; i < 40; i++) { const t = (i / 40) * TAU; p.push([50 + 2.6 * 16 * Math.pow(Math.sin(t), 3), 48 - 2.6 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
        rub(ctx, p, CP, 0.55);
        hatch(ctx, p, { rng, ang: -0.8, sp: 6, w: 2.4, c: CP, a: 0.9 });
        S(p, CP, 6.5, 1, true);
        S(spl([[30, 34], [34, 26], [42, 24]], 4), CW, 4, 0.9);
        break;
      }
      case 'kills': {
        const b = spl([[50, 30], [72, 40], [74, 62], [50, 86], [26, 62], [28, 40]], 4, true);
        rub(ctx, b, CC, 0.25);
        ctx.save(); ctx.beginPath(); poly(ctx, b); ctx.clip();
        rub(ctx, [[0, 0], [100, 0], [100, 52], [0, 52]], CL, 0.6);
        hatch(ctx, [[0, 0], [100, 0], [100, 52], [0, 52]], { rng, ang: -0.8, sp: 6, w: 2.2, c: CL, a: 0.9 });
        ctx.restore();
        S(b, CW, 5, 1, true);
        leaf(ctx, rng, 48, 30, -Math.PI / 2 - 0.5, 20, 6, CM);
        leaf(ctx, rng, 52, 30, -Math.PI / 2 + 0.5, 20, 6, CG);
        for (const s of [-1, 1]) { S([[50 + s * 12 - 5, 52], [50 + s * 12 + 5, 62]], CW, 4.5); S([[50 + s * 12 + 5, 52], [50 + s * 12 - 5, 62]], CW, 4.5); }
        break;
      }
      case 'dmg': {
        iconSeed(ctx, rng, 46, 56, -0.8, 50, 26);
        for (let k = 0; k < 5; k++) { const a = -1.6 + k * 0.42; S([[72 + Math.cos(a) * 10, 28 + Math.sin(a) * 10], [72 + Math.cos(a) * 22, 28 + Math.sin(a) * 22]], CY, 4); }
        break;
      }
      case 'rate': {
        for (let k = 0; k < 3; k++) iconSeed(ctx, rng, 34 + k * 20, 70 - k * 20, -0.78, 26, 14);
        for (let k = 0; k < 3; k++) S([[12 + k * 8, 50 + k * 10], [30 + k * 8, 32 + k * 10]], CW, 3, 0.7);
        break;
      }
      case 'multi': {
        const bag = spl([[30, 38], [70, 38], [82, 66], [70, 86], [30, 86], [18, 66]], 4, true);
        rub(ctx, bag, CO, 0.55);
        hatch(ctx, bag, { rng, ang: -0.7, sp: 6, w: 2.4, c: CDO, a: 0.8 });
        S(bag, CO, 5.5, 1, true);
        S([[30, 38], [40, 30], [50, 34], [60, 30], [70, 38]], CM, 5);
        for (let k = 0; k < 3; k++) iconSeed(ctx, rng, 30 + k * 20, 18 + (k & 1) * 6, -1.2 + k * 0.6, 18, 10);
        break;
      }
      case 'bounce': {
        const p = [];
        for (let i = 0; i <= 20; i++) { const t = i / 20; p.push([12 + t * 76, 82 - Math.abs(Math.sin(t * Math.PI * 1.6)) * 52]); }
        for (let i = 0; i < p.length; i += 2) dot(ctx, p[i][0], p[i][1], 2.6, CW, 0.9);
        S([[8, 86], [92, 86]], CM, 4);
        iconSeed(ctx, rng, 74, 40, -0.4, 30, 16);
        break;
      }
      case 'lantern': {
        ctx.save(); ctx.translate(50, 84); ctx.scale(5.2, 5.2);
        drawLantern(ctx, rng);
        ctx.restore();
        break;
      }
      case 'speed': {
        const shoe = spl([[16, 70], [22, 56], [40, 60], [62, 44], [80, 46], [86, 60], [82, 74], [20, 76]], 4, true);
        rub(ctx, shoe, CB, 0.35);
        hatch(ctx, shoe, { rng, ang: 0.9, sp: 6, w: 2, c: CW, a: 0.6 });
        S(shoe, CB, 5.5, 1, true);
        S([[74, 74], [76, 88]], CB, 5);
        for (const [x, y, r] of [[30, 30, 9], [58, 22, 6], [84, 30, 7]]) { const st = starPts(x, y, r, r * 0.35, 4, 0); S(st, CY, 3, 1, true); }
        break;
      }
      case 'magnet': {
        const bk = [[18, 46], [82, 46], [74, 86], [26, 86]];
        rub(ctx, bk, CY, 0.25);
        hatch(ctx, bk, { rng, ang: 0.8, sp: 7, w: 2.4, c: CY, a: 0.8 });
        hatch(ctx, bk, { rng, ang: -0.8, sp: 7, w: 2.4, c: CO, a: 0.6 });
        S(bk, CY, 5, 1, true);
        S(spl([[24, 46], [34, 18], [66, 18], [76, 46]], 5), CY, 5);
        for (let k = 0; k < 3; k++) dot(ctx, 36 + k * 14, 40, 5, CB, 0.9);
        break;
      }
      case 'hp': {
        const bowl = spl([[14, 52], [86, 52], [76, 76], [50, 86], [24, 76]], 4, true);
        rub(ctx, bowl, CW, 0.2);
        hatch(ctx, bowl, { rng, ang: 0.8, sp: 6, w: 2.2, c: CW, a: 0.7 });
        S(bowl, CW, 5, 1, true);
        rub(ctx, ell(50, 52, 34, 6, 20), CO, 0.7);
        dot(ctx, 38, 50, 5, CL, 0.95); dot(ctx, 58, 51, 4.5, CY, 0.95);
        for (let k = 0; k < 3; k++) S(spl([[34 + k * 16, 40], [30 + k * 16, 30], [38 + k * 16, 22], [34 + k * 16, 12]], 4), CW, 3.2, 0.75);
        break;
      }
      default: {
        const st = starPts(50, 50, 34, 14, 5, 0);
        rub(ctx, st, CY, 0.4); S(st, CY, 5, 1, true);
      }
    }
  }

  /* ===================================================================================== damage numbers */
  const NUMS = new Map();
  let numFont = false, numCheck = 0;
  function numSprite(value, crit) {
    const key = value + (crit ? 'c' : 'n');
    let s = NUMS.get(key);
    if (s) return s;
    if (NUMS.size > 300) NUMS.clear();
    const fam = numFont ? '"Cabin Sketch", cursive' : '"Comic Sans MS", cursive';
    const px = Math.round((crit ? 13 : 9.5) * K);
    const txt = String(value);
    const m = U.canvas(4, 4).ctx;
    m.font = '700 ' + px + 'px ' + fam;
    const w = Math.ceil(m.measureText(txt).width);
    const pad = Math.ceil(px * 0.35);
    const W = w + pad * 2, H = Math.ceil(px * 1.45 + pad);
    const A = U.canvas(W, H);
    A.ctx.font = '700 ' + px + 'px ' + fam;
    A.ctx.textBaseline = 'alphabetic';
    const by = pad + px * 0.95;
    A.ctx.fillStyle = rgba(crit ? CY : CW, 1);
    A.ctx.fillText(txt, pad, by);
    if (crit) {
      A.ctx.lineCap = 'round';
      A.ctx.beginPath(); A.ctx.moveTo(pad, by + px * 0.18);
      A.ctx.quadraticCurveTo(W / 2, by + px * 0.32, W - pad, by + px * 0.12);
      A.ctx.lineWidth = px * 0.1; A.ctx.strokeStyle = rgba(CO, 1); A.ctx.stroke();
    }
    applyGrain(A.ctx, W, H, 0.8, value & 255);
    const O = U.canvas(W, H);
    O.ctx.font = A.ctx.font;
    O.ctx.lineJoin = 'round';
    O.ctx.strokeStyle = 'rgba(30,42,37,0.88)';
    O.ctx.lineWidth = px * 0.3;
    O.ctx.strokeText(txt, pad, by);
    O.ctx.drawImage(A.c, 0, 0);
    s = { c: O.c, ax: W / 2, ay: by };
    NUMS.set(key, s);
    return s;
  }

  /* ===================================================================================== screen frame + clock */
  let FRAME = null;
  function buildFrame(W, H) {
    const t = Math.max(8, Math.round(H * 0.013)), tb = Math.round(t * 1.8);
    const vh = Math.round(H * 0.1), vw = Math.round(W * 0.07);
    const { c, ctx } = U.canvas(W, H);
    const rng = U.rng(4711);
    // edge vignette (linear fades, zero at the strip borders)
    const lin = (x0, y0, x1, y1, rx, ry, rw, rh) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(6,12,9,0.5)'); g.addColorStop(0.45, 'rgba(6,12,9,0.18)'); g.addColorStop(1, 'rgba(6,12,9,0)');
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
    };
    lin(0, 0, 0, vh, 0, 0, W, vh);
    lin(0, H, 0, H - vh, 0, H - vh, W, vh);
    lin(0, 0, vw, 0, 0, 0, vw, H);
    lin(W, 0, W - vw, 0, W - vw, 0, vw, H);
    // chalk dust settled near the ledge
    const gd = ctx.createLinearGradient(0, H - tb, 0, H - vh);
    gd.addColorStop(0, 'rgba(225,232,224,0.12)'); gd.addColorStop(1, 'rgba(225,232,224,0)');
    ctx.fillStyle = gd; ctx.fillRect(0, H - vh, W, vh - tb);
    for (let i = 0; i < 700; i++) {
      const side = rng.next();
      let x, y;
      if (side < 0.45) { x = rng.next() * W; y = H - tb - Math.pow(rng.next(), 2) * vh; }
      else if (side < 0.6) { x = rng.next() * W; y = rng.next() * vh; }
      else if (side < 0.8) { x = rng.next() * vw; y = rng.next() * H; }
      else { x = W - rng.next() * vw; y = rng.next() * H; }
      ctx.fillStyle = 'rgba(230,234,226,' + R(0.05, 0.16, rng).toFixed(3) + ')';
      const s = R(1, 2.2, rng);
      ctx.fillRect(x, y, s, s);
    }
    // wooden frame
    const wood = (x, y, w, h, horiz) => {
      const g = horiz ? ctx.createLinearGradient(0, y, 0, y + h) : ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#7a5232'); g.addColorStop(0.5, '#93663f'); g.addColorStop(1, '#5c3b22');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      for (let i = 0; i < (horiz ? W : H) / 9; i++) {
        ctx.strokeStyle = 'rgba(50,30,16,' + R(0.15, 0.35, rng).toFixed(2) + ')';
        ctx.lineWidth = R(0.6, 1.4, rng);
        ctx.beginPath();
        if (horiz) { const yy = y + rng.next() * h, xx = rng.next() * W, L = R(40, 200, rng); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + L / 2, yy + J(1.5, rng), xx + L, yy + J(1, rng)); }
        else { const xx = x + rng.next() * w, yy = rng.next() * H, L = R(40, 200, rng); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + J(1.5, rng), yy + L / 2, xx + J(1, rng), yy + L); }
        ctx.stroke();
      }
      ctx.restore();
    };
    wood(0, 0, W, t, true);
    wood(0, H - tb, W, tb, true);
    wood(0, 0, t, H, false);
    wood(W - t, 0, t, H, false);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(t, t, W - 2 * t, 2); ctx.fillRect(t, t, 2, H - t - tb); ctx.fillRect(W - t - 2, t, 2, H - t - tb);
    ctx.fillStyle = 'rgba(255,220,170,0.25)';
    ctx.fillRect(0, H - tb, W, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, H - tb + 2, W, 2);
    // chalk sticks + eraser on the ledge
    const stick = (x, len, col, rot) => {
      ctx.save(); ctx.translate(x, H - tb + 1); ctx.rotate(rot);
      ctx.fillStyle = rgba(col, 1);
      ctx.beginPath(); ctx.moveTo(0, -t * 0.55); ctx.lineTo(len, -t * 0.55); ctx.lineTo(len + 2, -t * 0.25); ctx.lineTo(len, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, -t * 0.18, len, t * 0.18);
      ctx.restore();
    };
    const u = t / 10;
    stick(W * 0.06, 46 * u, CW, -0.02); stick(W * 0.06 + 56 * u, 28 * u, CP, 0.03); stick(W * 0.06 + 92 * u, 36 * u, CY, -0.01);
    stick(W * 0.84, 22 * u, CM, 0.02); stick(W * 0.84 + 30 * u, 30 * u, CO, -0.03);
    const ex = W * 0.9, ew = 70 * u, eh = 14 * u, ey = H - tb + 1 - eh;
    ctx.fillStyle = '#b07f55'; ctx.fillRect(ex, ey, ew, eh * 0.6);
    ctx.fillStyle = 'rgba(60,40,24,0.4)'; for (let k = 0; k < 6; k++) ctx.fillRect(ex, ey + k * eh * 0.1, ew, 1);
    ctx.fillStyle = '#5a5e5c'; ctx.fillRect(ex + 2 * u, ey + eh * 0.6, ew - 4 * u, eh * 0.4);
    ctx.fillStyle = 'rgba(230,232,226,0.35)'; for (let k = 0; k < 30; k++) ctx.fillRect(ex + rng.next() * ew, ey + eh * (0.6 + rng.next() * 0.4), 1.5, 1.5);
    applyGrain(ctx, W, H, 0.25, 9);
    const cut = (x, y, w, h) => { const s = U.canvas(w, h); s.ctx.drawImage(c, x, y, w, h, 0, 0, w, h); return { c: s.c, x, y }; };
    FRAME = { W, H, parts: [cut(0, 0, W, vh), cut(0, H - vh, W, vh), cut(0, vh, vw, H - 2 * vh), cut(W - vw, vh, vw, H - 2 * vh)] };
  }
  let CLOCK = null, clockRect = null, clockN = 0;
  function buildClockFace(rad) {
    const pad = Math.ceil(rad * 0.25);
    const S = Math.ceil(rad * 2 + pad * 2);
    const { c, ctx } = U.canvas(S, S);
    const rng = U.rng(77);
    ctx.translate(S / 2, S / 2);
    const k = rad / 40;
    ctx.scale(k, k);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    dot(ctx, 0, 0, 40, [28, 40, 35], 0.9);
    rub(ctx, ell(0, 0, 38, 38, 40), CW, 0.05);
    stroke(ctx, ell(0, 0, 38, 38, 48), { rng, closed: true, w: 2.6, c: CW, a: 1, step: 2, j: 0.35 });
    stroke(ctx, ell(0, 0, 34.5, 34.5, 48), { rng, closed: true, w: 1.0, c: CW, a: 0.5, dbl: false, step: 2, j: 0.3 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2, big = i % 3 === 0;
      if (i === 0) continue;
      stroke(ctx, [[Math.cos(a) * (big ? 27 : 30), Math.sin(a) * (big ? 27 : 30)], [Math.cos(a) * 33, Math.sin(a) * 33]], { rng, w: big ? 2.4 : 1.4, c: big ? CY : CW, a: 1, dbl: false, step: 1.5 });
    }
    // midnight pumpkin at 12
    ctx.save(); ctx.translate(0, -24); ctx.scale(1.15, 1.15);
    pumpkin(ctx, rng, 0, 5, 5.2, true);
    ctx.restore();
    // the evening hours 22–24 shaded
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 36, -Math.PI / 2 - TAU / 6, -Math.PI / 2); ctx.closePath(); ctx.clip();
    hatch(ctx, ell(0, 0, 36, 36, 24), { rng, ang: 0.8, sp: 3, w: 0.9, c: CL, a: 0.45 });
    ctx.restore();
    applyGrain(ctx, S, S, 0.7, 5);
    return { c, S, rad };
  }
  function drawClock(ctx, view, game) {
    if (document.body.classList.contains('nohud')) return;
    if (!clockRect || (clockN++ % 30) === 0) {
      const el = document.querySelector('#hud .clock'), cv = document.getElementById('game');
      if (!el || !cv) return;
      const r = el.getBoundingClientRect();
      // the dial hangs under the HUD clock; no visible HUD clock (stage views, embeds) -> no dial
      if (r.width < 2 || r.height < 2) { clockRect = { hidden: true }; return; }
      const k = view.W / (cv.clientWidth || view.W);
      clockRect = { x: (r.left + r.width / 2) * k, y: r.top * k, k };
    }
    if (clockRect.hidden) return;
    const k = clockRect.k, rad = Math.round(38 * k);
    if (!CLOCK || CLOCK.rad !== rad) CLOCK = buildClockFace(rad);
    const cx = clockRect.x, cy = clockRect.y + 42 * k;
    ctx.drawImage(CLOCK.c, Math.round(cx - CLOCK.S / 2), Math.round(cy - CLOCK.S / 2));
    const mins = Math.min(120, game.runProgress * 120);
    const hour = 22 + mins / 60;
    const ha = ((hour % 12) / 12) * TAU - Math.PI / 2, ma = ((mins % 60) / 60) * TAU - Math.PI / 2;
    const s = rad / 40;
    ctx.lineCap = 'round';
    const hand = (a, len, w, col) => {
      ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * 4 * s, cy - Math.sin(a) * 4 * s); ctx.lineTo(cx + Math.cos(a) * len * s, cy + Math.sin(a) * len * s);
      ctx.lineWidth = w * s; ctx.strokeStyle = rgba(col, 0.92); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 0.6 * s, cy + 0.6 * s); ctx.lineTo(cx + Math.cos(a) * len * s * 0.92 + 0.6 * s, cy + Math.sin(a) * len * s * 0.92 + 0.6 * s);
      ctx.lineWidth = w * s * 0.4; ctx.strokeStyle = rgba(CW, 0.35); ctx.stroke();
    };
    hand(ha, 19, 4.2, CW);
    hand(ma, 29, 2.8, CO);
    ctx.fillStyle = rgba(CY, 1);
    ctx.beginPath(); ctx.arc(cx, cy, 2.6 * s, 0, TAU); ctx.fill();
  }

  /* ===================================================================================== blitting */
  let BX = 0, BY = 0, BS = 1;
  function base(view) { BS = view.S; BX = view.W / 2 - view.x * BS; BY = view.H / 2 - view.y * BS; }
  function blitC(ctx, c, s, x, y) {
    const k = 1 / K;
    const dx = Math.round((x - s.ax * k) * BS) / BS, dy = Math.round((y - s.ay * k) * BS) / BS;
    ctx.drawImage(c, dx, dy, c.width * k, c.height * k);
  }
  function blit(ctx, s, x, y) { blitC(ctx, s.c, s, x, y); }
  function blitS(ctx, s, x, y, sx, sy) {
    const k = 1 / K;
    ctx.drawImage(s.c, x - s.ax * k * sx, y - s.ay * k * sy, s.c.width * k * sx, s.c.height * k * sy);
  }
  function blitRot(ctx, s, x, y, ang, sc) {
    const k = (sc * BS) / K, c = Math.cos(ang) * k, sn = Math.sin(ang) * k;
    ctx.setTransform(c, sn, -sn, c, BX + x * BS, BY + y * BS);
    ctx.drawImage(s.c, -s.ax, -s.ay);
    ctx.setTransform(BS, 0, 0, BS, BX, BY);
  }
  /** Anchor (feet) at world (x,y); mirrored, scaled about the feet, rotated about the feet. img defaults to s.c. */
  function blitT(ctx, s, x, y, flip, sx, sy, rot, img) {
    const k = BS / K, f = flip ? -1 : 1;
    const c = rot ? Math.cos(rot) : 1, sn = rot ? Math.sin(rot) : 0;
    ctx.setTransform(c * sx * k * f, sn * sx * k * f, -sn * sy * k, c * sy * k, Math.round(BX + x * BS), Math.round(BY + y * BS));
    ctx.drawImage(img || s.c, -s.ax, -s.ay);
    ctx.setTransform(BS, 0, 0, BS, BX, BY);
  }
  /** Mirrored copy of a sprite canvas, made once on first use (axis-aligned blits stay on the fast path). */
  function flipped(s, img) {
    const key = img === s.c ? 'fc' : img === s.f ? 'ff' : 'fch';
    return s[key] || (s[key] = U.flipX(img));
  }
  /** Unscaled, unrotated sprite at the feet (x,y), optionally mirrored; img defaults to s.c. */
  function blitF(ctx, s, x, y, flip, img) {
    img = img || s.c;
    const k = 1 / K, c = flip ? flipped(s, img) : img, ax = flip ? img.width - s.ax : s.ax;
    ctx.drawImage(c, Math.round((x - ax * k) * BS) / BS, Math.round((y - s.ay * k) * BS) / BS, c.width * k, c.height * k);
  }
  /** Wind lean of a prop: the drawing leaning left / upright / right – two extra copies rotated about the foot, made once. */
  function leanSpr(s, i, amp) {
    if (i === 1) return s;
    const key = i === 0 ? 'lnL' : 'lnR';
    if (!s[key]) {
      const A = U.canvas(s.c.width, s.c.height);
      A.ctx.translate(s.ax, s.ay); A.ctx.rotate((i === 0 ? -1 : 1) * amp); A.ctx.translate(-s.ax, -s.ay);
      A.ctx.drawImage(s.c, 0, 0);
      s[key] = { c: A.c, ax: s.ax, ay: s.ay };
    }
    return s[key];
  }
  /** Props that can hide the main character: type -> how far above its foot it covers (world units). */
  const TALL = { tree: 66, pine: 64, deadtree: 56, scarecrow: 44 };
  /* Hand-drawn timing: the board is redrawn "on twos" – a 12 fps clock; a drawing is held for 2–3 ticks
     (per actor) before the next boil variant, so a crowd never boils in lock-step. */
  const TICK = (rt) => Math.floor(rt * 12);
  function boilIdx(rt, seed, n) {
    if (n <= 1) return 0;
    const hold = seed > 0.62 ? 3 : 2;
    return Math.floor((TICK(rt) + ((seed * 997) | 0)) / hold) % n;
  }
  const easeIO = (t) => t * t * (3 - 2 * t);
  /** Float with hang time at the top and bottom (smoothstep on a triangle wave), not a plain sine. */
  function floatY(t, seed, rate) {
    const u = (t * rate + seed * 3) % 2, tri = u < 1 ? u : 2 - u;
    return easeIO(tri);
  }

  /* ===================================================================================== effects state */
  const SMEARS = [];
  let lastGameTime = 0;
  function addSmear(x, y, s, col, t) {
    if (SMEARS.length > 60) SMEARS.shift();
    SMEARS.push({ x, y, s, col, born: t, life: 2.8, v: (Math.random() * 3) | 0, flip: Math.random() < 0.5 });
  }
  const SMEARC = {};
  function smearSpr(v, col) {
    const key = v + ':' + col;
    if (!SMEARC[key]) { const s = SPR.smear[v]; SMEARC[key] = { c: col === 0 ? s.c : U.tint(s.c, rgba(PALL[col], 1)), ax: s.ax, ay: s.ay }; }
    return SMEARC[key];
  }
  // chalk colours of each creature's debris (indices into PALL: white, orange, lavender, mint, yellow, pink, blue)
  const enemyCols = (e) => (e.type === 'ghost' ? [0, 6, 0] : e.type === 'colossus' ? [2, 5, 0, 3] : e.seed < 0.5 ? [2, 0, 3] : [5, 0, 3]);
  const pickCol = (arr) => arr[(Math.random() * arr.length) | 0];
  let hurtAt = -1e9;

  /* ---------- creature states ---------- */
  function variantOf(e) { return e.type === 'colossus' ? 0 : e.seed < 0.5 ? 0 : 1; }
  /** Spawn: the construction sketch is drawn in with one sweeping stroke, then the colour goes in and it pops. */
  function drawSpawn(ctx, e, s, flip, y, rot) {
    const T = e.type, t = e.spawnT;
    const tq = Math.floor(t * 5.4) / 5.4; // on twos (0.45 s spawn at 12 fps)
    const sk = SPR.sketch[T][variantOf(e)];
    const cy = y - (T === 'colossus' ? 30 : T === 'ghost' ? 13 : 15), Rr = T === 'colossus' ? 48 : 26;
    const p1 = U.clamp(tq / 0.55 + 0.12, 0, 1);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(e.x, cy); ctx.arc(e.x, cy, Rr, -Math.PI / 2, -Math.PI / 2 + p1 * TAU); ctx.closePath(); ctx.clip();
    ctx.globalAlpha = tq < 0.8 ? 0.95 : 0.95 * U.clamp(1 - (tq - 0.8) / 0.2, 0, 1);
    blitT(ctx, sk, e.x, y, flip, 1, 1, rot);
    ctx.restore();
    if (p1 < 1) {
      const a = -Math.PI / 2 + p1 * TAU, r = Rr * 0.5;
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(246,246,238,0.95)';
      ctx.fillRect(e.x + Math.cos(a) * r - 0.9, cy + Math.sin(a) * r - 0.9, 1.8, 1.8);
      ctx.fillStyle = 'rgba(246,246,238,0.5)';
      ctx.fillRect(e.x + Math.cos(a - 0.2) * r - 0.4, cy + Math.sin(a - 0.2) * r + 1.2, 0.8, 0.8);
    }
    if (tq > 0.42) {
      const p2 = U.clamp((tq - 0.42) / 0.4, 0, 1);
      let sx = 1, sy = 1;
      if (tq > 0.8) { const q = (tq - 0.8) / 0.2; sy = 1 - 0.1 * Math.sin(q * TAU) * (1 - q * 0.6); sx = 2 - sy; }
      ctx.globalAlpha = p2;
      blitT(ctx, s, e.x, y, flip, sx, sy, rot);
    }
    ctx.globalAlpha = 1;
  }
  /** Death: a white recoil flash, then a felt eraser wipes the drawing away in zig-zag passes, leaving a smear. */
  function drawDeath(ctx, e, s, flash, flip, y, rot) {
    const T = e.type, u = e.deathT;
    if (u < 0.14) {
      const q = 1 - u / 0.14;
      blitT(ctx, s, e.x, y, flip, 1 + 0.13 * q, 1 - 0.11 * q, rot);
      if (flash) { ctx.globalAlpha = 0.9 * q; blitT(ctx, s, e.x, y, flip, 1 + 0.13 * q, 1 - 0.11 * q, rot, flash); ctx.globalAlpha = 1; }
      return;
    }
    const w = U.clamp((u - 0.14) / 0.8, 0, 1);
    const sw = s.w / K, sh = s.h / K;
    const left = flip ? e.x - (s.w - s.ax) / K : e.x - s.ax / K, top = y - s.ay / K;
    const nb = T === 'colossus' ? 4 : 3;
    const bx0 = left + 1.5, bx1 = left + sw - 1.5, by0 = top + 1.5, by1 = top + sh - 0.5, bh = (by1 - by0) / nb;
    const kf = Math.min(nb - 1e-6, w * nb), band = Math.floor(kf), f = easeIO(kf - band);
    const ltr = (band & 1) === 0;
    const ex = ltr ? bx0 + (bx1 - bx0) * f : bx1 - (bx1 - bx0) * f;
    const yb = by0 + band * bh;
    // residue: where the felt has passed, the drawing survives only as a smeared haze of dust
    ctx.save();
    ctx.beginPath();
    if (band > 0) ctx.rect(bx0 - 4, by0 - 4, bx1 - bx0 + 8, yb - by0 + 4);
    if (ltr) ctx.rect(bx0 - 4, yb, ex - bx0 + 4, bh + 0.5); else ctx.rect(ex, yb, bx1 - ex + 4, bh + 0.5);
    ctx.clip();
    ctx.globalAlpha = 0.3 * (1 - w * 0.55);
    blitT(ctx, s, e.x + (ltr ? 1.4 : -1.4), y + 0.5, flip, 1.14, 0.95, rot, s.ch);
    ctx.restore();
    if (w >= 1) return;
    // what is still on the board
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx0 - 6, yb + bh, bx1 - bx0 + 12, by1 - yb - bh + 6);
    if (ltr) ctx.rect(ex, yb, bx1 - ex + 6, bh + 0.5); else ctx.rect(bx0 - 6, yb, ex - bx0 + 6, bh + 0.5);
    ctx.clip();
    ctx.globalAlpha = 1;
    blitT(ctx, s, e.x, y, flip, 1, 1, rot);
    ctx.restore();
    const big = T === 'colossus' ? 1.45 : T === 'ghost' ? 0.78 : 0.95;
    blitRot(ctx, SPR.eraser, ex, yb + bh * 0.5 + Math.sin(w * 37) * 0.5, Math.PI / 2 + (ltr ? -0.22 : 0.22) + Math.sin(w * 23) * 0.06, big);
  }

  /* ===================================================================================== CSS */
  const NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -9 0 0 0 6.1'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";
  const SMUDGE = 'radial-gradient(ellipse at 30% 20%, rgba(220,235,225,.07), transparent 60%), radial-gradient(ellipse at 80% 85%, rgba(220,235,225,.05), transparent 55%)';
  const CSS = `
body.style-chalk { --w:#eeeee5; --o:#f89c52; --y:#f9e58c; --l:#c2acec; --m:#98deb2; --p:#f7a8c6; --b:#9eccf0; --bd:#25332d; }
body.style-chalk #hud { padding: 24px 34px; color: var(--w); font-family: 'Architects Daughter', 'Comic Sans MS', cursive; -webkit-mask-image: ${NOISE}; mask-image: ${NOISE}; }
body.style-chalk #hud .xp { height: 18px; background: rgba(22,32,28,.55); border: 2.5px solid rgba(238,238,229,.92); border-radius: 14px 4px 12px 5px / 5px 12px 4px 14px; }
body.style-chalk #hud .xp-fill { background: repeating-linear-gradient(-58deg, rgba(152,222,178,.95) 0 3px, rgba(152,222,178,.3) 3px 7px); }
body.style-chalk #hud .lvl { font-family: 'Cabin Sketch', cursive; font-weight: 700; font-size: 16px; color: var(--y); right: 12px; text-shadow: 0 0 3px #1c2823, 0 0 2px #1c2823; }
body.style-chalk #hud .topline { margin-top: 12px; }
body.style-chalk #hud .hp { gap: 10px; }
body.style-chalk #hud .hp-icon, body.style-chalk #hud .kills-icon { width: 42px; height: 42px; }
body.style-chalk #hud .hp-bar { width: 240px; height: 22px; background: rgba(22,32,28,.55); border: 2.5px solid rgba(238,238,229,.92); border-radius: 4px 14px 6px 12px / 12px 5px 14px 4px; }
body.style-chalk #hud .hp-fill { background: repeating-linear-gradient(-58deg, rgba(247,168,198,.95) 0 3.5px, rgba(247,156,82,.45) 3.5px 7px); }
body.style-chalk #hud .hp-text { font-family: 'Cabin Sketch', cursive; font-weight: 700; font-size: 21px; text-shadow: none; }
body.style-chalk #hud .clock { width: 190px; padding-top: 84px; margin-top: -4px; }
body.style-chalk #hud .clock-time { font-family: 'Cabin Sketch', cursive; font-weight: 700; font-size: 34px; line-height: 1; color: var(--w); text-shadow: 0 0 4px #1c2823; letter-spacing: 2px; }
body.style-chalk #hud .clock-label { font-family: 'Architects Daughter', cursive; font-size: 15px; letter-spacing: 1px; text-transform: none; opacity: 1; color: var(--o); text-shadow: 0 0 4px #1c2823; }
body.style-chalk #hud .kills { font-family: 'Cabin Sketch', cursive; font-weight: 700; font-size: 30px; text-shadow: none; gap: 8px; }
body.style-chalk #hud .kills-num { border-bottom: 2.5px solid rgba(238,238,229,.85); border-radius: 0 0 40% 10% / 0 0 6px 3px; padding: 0 8px; min-width: 64px; text-align: center; }
body.style-chalk.hurt #hud .hp-bar { border-color: var(--p); filter: brightness(1.35); }
body.style-chalk #stylebar { bottom: 30px; background: rgba(28,40,35,.94); color: var(--w); border: 2px solid rgba(238,238,229,.8); border-radius: 18px 6px 16px 7px / 7px 16px 6px 18px; font-family: 'Architects Daughter', cursive; -webkit-mask-image: ${NOISE}; mask-image: ${NOISE}; }
body.style-chalk #stylebar .style-name { font-family: 'Cabin Sketch', cursive; font-weight: 700; font-size: 20px; color: var(--y); }
body.style-chalk #stylebar .style-family { color: var(--m); opacity: 1; letter-spacing: 2px; }
body.style-chalk #stylebar .auto.on { color: var(--m); }
body.style-chalk #levelup { background: rgba(18,26,22,.8); gap: 28px; }
body.style-chalk #levelup .lu-title { font-family: 'Fredericka the Great', cursive; font-weight: 400; font-size: 78px; letter-spacing: 3px; color: var(--y); text-shadow: none; -webkit-mask-image: ${NOISE}; mask-image: ${NOISE}; }
body.style-chalk #levelup .lu-title::after { content: ''; display: block; height: 5px; width: 86%; margin: 2px auto 0; border-radius: 50% 40% 60% 30%; background: var(--o); transform: rotate(-1deg); }
body.style-chalk #levelup .lu-cards { gap: 30px; }
body.style-chalk #levelup .card { width: 232px; min-height: 306px; padding: 40px 18px 20px; gap: 8px; color: var(--w); background: ${SMUDGE}, #25332d;
  border: 3px solid rgba(238,238,229,.92); border-radius: 22px 8px 24px 6px / 6px 24px 8px 22px; transition: transform .12s; -webkit-mask-image: ${NOISE}; mask-image: ${NOISE}; }
body.style-chalk #levelup .card:nth-child(1) { transform: rotate(-1.6deg); }
body.style-chalk #levelup .card:nth-child(2) { transform: rotate(0.9deg) translateY(4px); }
body.style-chalk #levelup .card:nth-child(3) { transform: rotate(-0.5deg); }
body.style-chalk #levelup .card:hover { transform: translateY(-8px) rotate(0deg); border-color: var(--y); }
body.style-chalk #levelup .card::before { content: ''; position: absolute; top: 8px; left: 50%; width: 24px; height: 24px; margin-left: -12px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.75) 0 3px, transparent 4px), var(--o); box-shadow: 0 3px 3px rgba(0,0,0,.5), inset 0 -3px 0 rgba(0,0,0,.25); }
body.style-chalk #levelup .card:nth-child(2)::before { background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.75) 0 3px, transparent 4px), var(--l); }
body.style-chalk #levelup .card:nth-child(3)::before { background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.75) 0 3px, transparent 4px), var(--m); }
body.style-chalk #levelup .card-icon { width: 112px; height: 112px; }
body.style-chalk #levelup .card-name { font-family: 'Cabin Sketch', cursive; font-weight: 700; font-size: 25px; line-height: 1.1; color: var(--y); }
body.style-chalk #levelup .card-desc { font-family: 'Architects Daughter', cursive; font-size: 17px; line-height: 1.3; opacity: 1; }
body.style-chalk #levelup .card-key { font-family: 'Cabin Sketch', cursive; font-weight: 700; font-size: 26px; top: 8px; left: 16px; opacity: 1; color: var(--m); }
body.style-chalk #levelup .lu-hint { font-family: 'Architects Daughter', cursive; font-size: 18px; letter-spacing: 1px; color: var(--w); opacity: .9; }
body.style-chalk #gameover { background: rgba(18,26,22,.86); }
body.style-chalk #gameover .go-title { font-family: 'Fredericka the Great', cursive; font-weight: 400; font-size: 66px; color: var(--o); -webkit-mask-image: ${NOISE}; mask-image: ${NOISE}; }
body.style-chalk #gameover .go-stats { font-family: 'Architects Daughter', cursive; font-size: 21px; color: var(--w); }
body.style-chalk #gameover .go-hint { font-family: 'Cabin Sketch', cursive; font-size: 18px; color: var(--y); }
body.style-chalk #pausebox { font-family: 'Fredericka the Great', cursive; font-weight: 400; font-size: 64px; color: var(--y); text-shadow: none; }
`;

  /* ===================================================================================== the style */
  Styles.register({
    id: 'chalk',
    name: 'Kreidetafel',
    family: 'Kreide',
    description: 'Drawn live with pastel chalk on a slate-green board: side-of-the-chalk fills, cool hatched shadows, eraser wipes and line boil on twos.',
    groundColor: '#25332d',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Cabin+Sketch:wght@400;700', 'Fredericka+the+Great', 'Rock+Salt', 'Architects+Daughter'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = (window.__forceH || window.innerHeight || 900) * dpr;
      K = U.clamp(Math.round((h / 360) * 4) / 4, 2, 3.5);
      buildGrain();
      const gres = Math.min(h / 360, 2.5);
      buildTextures(Math.max(1, Math.round(256 * gres)) / 256);
      LAZY.length = 0;
      buildSprites();
      pumpLazy();
      SMEARS.length = 0;
      for (const k in SMEARC) delete SMEARC[k];
      if (document.fonts && document.fonts.load) {
        for (const f of ['700 20px "Cabin Sketch"', '20px "Rock Salt"', '20px "Fredericka the Great"', '20px "Architects Daughter"']) document.fonts.load(f).catch(() => {});
      }
    },

    renderGroundChunk(ctx, info) { return renderGround(ctx, info); },
    propsForChunk(info) { return propsFor(info); },

    drawProp(ctx, p, view) {
      base(view);
      // a tall prop standing in front of the main character is drawn faint, so the main character stays the clearest read
      const pl = view.game && view.game.player;
      if (pl && TALL[p.type] && pl.y < p.y - 1 && pl.y > p.y - TALL[p.type]) {
        const dx = Math.abs(pl.x - p.x);
        if (dx < 30) ctx.globalAlpha = 0.42 + 0.58 * easeIO(U.clamp((dx - 16) / 14, 0, 1));
      }
      if (!p.sway) { blit(ctx, p.spr, p.x, p.y); ctx.globalAlpha = 1; return; }
      // wind: the crown is redrawn leaning left / upright / right, swapped on 6 fps ticks by a slow two-sine gust
      const t = Math.floor(view.rt * 6) / 6;
      const w = Math.sin(t * 1.25 + p.ph) * 0.65 + Math.sin(t * 2.7 + p.ph * 1.7) * 0.35;
      blit(ctx, leanSpr(p.spr, w < -0.4 ? 0 : w > 0.4 ? 2 : 1, p.sway), p.x, p.y);
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o, view) {
      base(view);
      if (o.kind === 'prop') { if (o.sh) blit(ctx, o.sh, o.x, o.y); return; }
      if (o.kind === 'enemy') {
        const sh = o.type === 'ghost' ? SPR.shGhost : o.type === 'colossus' ? SPR.shColossus : SPR.shCreeper;
        if (o.dying) { ctx.globalAlpha = Math.max(0, 1 - o.deathT * 1.3); blit(ctx, sh, o.x, o.y + 0.5); ctx.globalAlpha = 1; return; }
        if (o.spawnT < 1) { const s = 0.3 + 0.7 * easeIO(o.spawnT); blitS(ctx, sh, o.x, o.y, s, s); return; }
        if (o.type === 'ghost') {
          // the shadow tightens when the ghost dips, spreads when it rises
          const f = floatY(view.rt, o.seed || 0, 0.62), s = 1.08 - f * 0.22;
          ctx.globalAlpha = 1 - f * 0.35; blitS(ctx, sh, o.x, o.y + 0.5, s, s); ctx.globalAlpha = 1;
          return;
        }
        blit(ctx, sh, o.x, o.y + 0.5);
        return;
      }
      if (o.dashT > 0) { blitS(ctx, SPR.shJack, o.x, o.y + 0.5, 1.35, 0.8); return; }
      blit(ctx, SPR.shJack, o.x, o.y + 0.5);
    },

    drawGroundOverlay(ctx, view, game) {
      base(view);
      const t = game.time;
      if (t < lastGameTime - 0.5) SMEARS.length = 0;
      lastGameTime = t;
      for (let i = SMEARS.length - 1; i >= 0; i--) {
        const s = SMEARS[i], age = t - s.born;
        if (age > s.life || age < 0) { SMEARS.splice(i, 1); continue; }
        // wiped in fast, then the dust settles and thins out
        ctx.globalAlpha = Math.min(1, age * 8) * Math.pow(1 - age / s.life, 1.4) * 0.85;
        const sp = smearSpr(s.v, s.col);
        blitS(ctx, sp, s.x, s.y, s.s * (s.flip ? -1 : 1), s.s * 0.8);
      }
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      base(view);
      const rt = view.rt, arr = g.big ? SPR.gemBig : SPR.gem;
      const s = arr[boilIdx(rt, g.seed, arr.length)];
      blit(ctx, SPR.shGem, g.x, g.y + 0.6);
      if (g.pop > 0) {
        // popped out of the creature: a hop with an overshooting scale-in
        const u = 1 - g.pop, sc = 0.35 + 0.65 * U.ease.outBack(u);
        blitT(ctx, s, g.x, g.y - Math.sin(u * Math.PI) * 6, false, sc, sc, 0);
        return;
      }
      const f = floatY(rt, g.seed, 0.7);
      blit(ctx, s, g.x, g.y - 0.3 - f * 1.6);
      if (g.big) {
        // a chalk twinkle tick at the tip now and then (held for three ticks)
        const c = (TICK(rt) + ((g.seed * 53) | 0)) % 22;
        if (c < 3) { ctx.globalAlpha = c === 1 ? 1 : 0.6; blitRot(ctx, SPR.tick, g.x + 3.2, g.y - 12.5 - f * 1.6, c * 0.4, 0.75 + (c === 1 ? 0.25 : 0)); ctx.globalAlpha = 1; }
      }
    },

    drawEnemy(ctx, e, view) {
      base(view);
      const set = SPR[e.type];
      if (!set) return;
      const T = e.type, rt = view.rt, seed = e.seed || 0;
      const poses = set[T === 'colossus' ? 0 : variantOf(e)];
      // pose cycles: stride-driven for walkers (≈6 poses/s, i.e. on twos), time-driven flutter for the ghost
      let fr;
      if (T === 'ghost') fr = Math.floor(TICK(rt) / 2 + seed * 17);
      else if (T === 'colossus') fr = Math.floor(e.anim * 2.4);
      else fr = Math.floor(e.anim * 1.7);
      fr = ((fr % 6) + 6) % 6;
      const arr = poses[fr];
      const s = arr[boilIdx(rt, seed, arr.length)];
      const flash = s.f || arr[0].f;
      const flip = e.facing < 0;
      let x = e.x, y = e.y, rot = 0, sx = 1, sy = 1;
      if (T === 'ghost') y -= 1.4 + floatY(rt, seed, 0.62) * 2.8;
      if (e.dying) { drawDeath(ctx, e, s, flash, flip, y, rot); return; }
      if (e.spawnT < 1) { drawSpawn(ctx, e, s, flip, y, rot); return; }
      // hit: ~140 ms squash-and-recoil away from the blow, white chalk flash on top
      const q = e.flash > 0 ? e.flash : 0;
      if (q > 0) {
        const kd = Math.abs(e.kx || 0) > 1 ? Math.sign(e.kx) : -(e.facing || 1);
        const qq = q * q * (3 - 2 * q);
        const heavy = T === 'colossus' ? 0.55 : 1;
        sx = 1 + 0.17 * qq * heavy; sy = 1 - 0.14 * qq * heavy; rot = kd * 0.2 * qq * heavy;
        x += kd * 1.4 * qq * heavy;
      }
      if (T === 'ghost') ctx.globalAlpha = 0.92;
      if (q > 0) blitT(ctx, s, x, y, flip, sx, sy, rot); else blitF(ctx, s, x, y, flip);
      if (q > 0.04 && flash) {
        ctx.globalAlpha = Math.min(0.9, q * 1.15) * (T === 'colossus' ? 0.75 : 1);
        blitT(ctx, s, x, y, flip, sx, sy, rot, flash);
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      base(view);
      const rt = view.rt, JS = SPR.jack, flip = p.facing < 0;
      const ph = (((p.x * 0.37 + p.y * 0.11) % 7) + 7) % 7; // per-instance phase
      let arr, rot = 0, sx = 1, sy = 1, state = 'idle';
      if (p.hurtT > 0.55) { arr = JS.hurt[0]; state = 'hurt'; }
      else if (p.dashT > 0) { arr = JS.dash[p.dashT > 0.17 ? 0 : 1]; state = 'dash'; }
      else if (p.dashCd > 1.08) { arr = JS.dash[0]; state = 'land'; } // recovery crouch after the dash
      else if (p.moving) { arr = JS.walk[((Math.floor(p.anim * 1.1) % 8) + 8) % 8]; state = 'walk'; }
      else {
        // breathing 0-1-2-1 held ~0.45 s each, a blink every ~3.4 s
        const bt = rt + ph;
        if (bt % 3.4 < 0.14) arr = JS.blink[0];
        else { const k = Math.floor(bt * 2.2) % 4; arr = JS.idle[k === 3 ? 1 : k]; }
      }
      const s = arr[boilIdx(rt, 0.3 + ph * 0.09, arr.length)];
      if (p.levelT > 0) {
        ctx.globalAlpha = Math.min(1, p.levelT * 2);
        blitRot(ctx, SPR.ring, p.x, p.y - 15, rt * 0.7, 1.2 + (1 - p.levelT) * 0.6);
        ctx.globalAlpha = 1;
      }
      if (state === 'dash') {
        // chalk after-images and speed strokes trail the dash
        const kk = p.dashT / 0.2, a = Math.atan2(p.dashY, p.dashX);
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = 0.34 * kk / i;
          blitF(ctx, s, p.x - p.dashX * i * 6.5, p.y - p.dashY * i * 6.5, flip, s.ch);
        }
        ctx.globalAlpha = 0.75 * kk;
        blitRot(ctx, SPR.streak[0], p.x - p.dashX * 7, p.y - 9 - p.dashY * 7, a, 1.4);
        blitRot(ctx, SPR.streak[1], p.x - p.dashX * 10, p.y - 19 - p.dashY * 10, a, 1.1);
        ctx.globalAlpha = 1;
        sx = 1.06; sy = 0.96;
      } else if (state === 'land') {
        const u = (p.dashCd - 1.08) / 0.12; sx = 1 + 0.06 * u; sy = 1 - 0.07 * u;
      } else if (state === 'hurt') {
        const u = (p.hurtT - 0.55) / 0.45; rot = (flip ? 1 : -1) * 0.12 * u; sx = 1 - 0.06 * u; sy = 1 + 0.05 * u;
      }
      const since = (performance.now() - hurtAt) / 1000;
      const blink = p.iframes > 0 && since > 0.15 && since < 0.9 && (Math.floor(since * 14) & 1) === 1;
      ctx.globalAlpha = blink ? 0.45 : 1;
      if (sx === 1 && sy === 1 && rot === 0) blitF(ctx, s, p.x, p.y, flip); else blitT(ctx, s, p.x, p.y, flip, sx, sy, rot);
      if (p.hurtT > 0.4) {
        const f = s.f || arr[0].f;
        if (f) { ctx.globalAlpha = Math.min(0.85, (p.hurtT - 0.4) * 1.6); blitT(ctx, s, p.x, p.y, flip, sx, sy, rot, f); }
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      base(view);
      const rt = view.rt, arr = SPR.lantern;
      const s = arr[boilIdx(rt, 0.17 + o.idx * 0.31, arr.length)];
      const ang = o.angle || 0, tx = -Math.sin(ang), ty = Math.cos(ang) * 0.85, ta = Math.atan2(ty, tx);
      // a dusty swoosh along the orbit, then the lantern swinging behind its handle (follow-through)
      ctx.globalAlpha = 0.5;
      blitRot(ctx, SPR.streak[o.idx & 1], o.x - tx * 4, o.y - 5 - ty * 4, ta, 1.15);
      ctx.globalAlpha = 1;
      const bob = floatY(rt, 0.1 + o.idx * 0.37, 0.9) * 1.4;
      blitT(ctx, s, o.x, o.y + 2 - bob, false, 1, 1, -tx * 0.2 + Math.sin(rt * 4.2 + o.idx * 2) * 0.05);
    },

    drawProjectile(ctx, pr, view) {
      base(view);
      const a = Math.atan2(pr.vy, pr.vx);
      const k = Math.min(1, pr.age * 8);
      ctx.globalAlpha = 0.85;
      blitRot(ctx, SPR.trail, pr.x, pr.y, a, 0.4 + 0.6 * k);
      ctx.globalAlpha = 1;
      blitRot(ctx, SPR.seed[boilIdx(view.rt, pr.seed || 0, SPR.seed.length)], pr.x, pr.y, a + Math.sin(pr.spin) * 0.35, 1);
    },

    drawParticle(ctx, pt, view) {
      base(view);
      const life = U.clamp(pt.life / pt.max, 0, 1);
      // effects are redrawn on the 12 fps clock too: age is stepped, positions stay smooth
      const age = Math.min(1, Math.floor((1 - life) * pt.max * 12 + 0.999) / Math.max(1, pt.max * 12));
      const c = pt.c | 0, v = (pt.seed * 3) | 0;
      switch (pt.kind) {
        case 'dust': {
          // a rubbed puff: swells fast, drifts, thins out (ease-out size, ease-in fade)
          const s = pt.size * (0.45 + U.ease.outQuad(age) * 1.05);
          ctx.globalAlpha = (age < 0.1 ? 0.5 + age * 5 : 1) * Math.pow(1 - age, 1.3) * 0.95;
          blitS(ctx, SPR.dust[c][v], pt.x, pt.y - pt.z, s, s);
          break;
        }
        case 'crumb': {
          ctx.globalAlpha = life < 0.3 ? life / 0.3 : 1;
          blitRot(ctx, SPR.crumb[c][v & 1], pt.x, pt.y - pt.z, pt.rot, pt.size);
          break;
        }
        case 'pow': {
          // radiating chalk strokes: pop in oversized, settle, then get wiped
          const s = pt.size * (age < 0.18 ? 0.55 + (age / 0.18) * 0.7 : 1.25 - (age - 0.18) * 0.35);
          ctx.globalAlpha = age < 0.5 ? 1 : (1 - age) / 0.5;
          blitRot(ctx, SPR.pow[c][v], pt.x, pt.y - pt.z, pt.rot, s);
          break;
        }
        case 'poof': {
          // the kill cloud: bursts in with an overshoot, hangs, then breaks up and thins (on the 12 fps clock)
          const s = pt.size * (age < 0.22 ? 0.45 + U.ease.outBack(age / 0.22) * 0.6 : 1.05 + (age - 0.22) * 0.35);
          ctx.globalAlpha = (age < 0.55 ? 0.92 : 0.92 * (1 - age) / 0.45);
          blitRot(ctx, SPR.poof[c][v], pt.x, pt.y - pt.z, pt.rot, s);
          break;
        }
        case 'tick': {
          // the core flash: one hard white chalk star, shrinking
          ctx.globalAlpha = 1 - age * 0.6;
          blitRot(ctx, SPR.tick, pt.x, pt.y - pt.z, pt.rot, pt.size * (1.35 - age * 0.7));
          break;
        }
        case 'star': {
          const s = pt.size * (age < 0.2 ? 0.3 + (age / 0.2) * 0.9 : 1.2 - (age - 0.2) * 0.8);
          ctx.globalAlpha = age < 0.7 ? 1 : (1 - age) / 0.3;
          blitRot(ctx, SPR.star, pt.x, pt.y - pt.z, pt.rot, s);
          break;
        }
        case 'ring': {
          const s = pt.size * (0.4 + U.ease.outQuad(age) * 1.2);
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.ring, pt.x, pt.y - pt.z, pt.rot, s);
          break;
        }
        case 'streak': {
          ctx.globalAlpha = (1 - age) * 0.8;
          blitRot(ctx, SPR.streak[v & 1], pt.x, pt.y - pt.z, pt.rot, pt.size * (1 - age * 0.4));
          break;
        }
        default: {
          ctx.globalAlpha = life;
          ctx.fillStyle = pt.color || '#eeeee5';
          ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.z - pt.size / 2, pt.size, pt.size);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n, view) {
      if (!numFont && (numCheck++ & 31) === 0 && fontOK('Cabin Sketch')) { numFont = true; NUMS.clear(); }
      const spr = numSprite(n.value, n.crit);
      const age = n.max - n.life;
      // scrawled in: overshoot, settle, then rubbed out
      const k = age < 0.09 ? 0.55 + (age / 0.09) * 0.6 : age < 0.16 ? 1.15 - ((age - 0.09) / 0.07) * 0.15 : 1;
      ctx.globalAlpha = n.life < 0.22 ? n.life / 0.22 : 1;
      const kk = 1 / K;
      const rot = (n.seed - 0.5) * 0.25;
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(rot);
      ctx.drawImage(spr.c, -spr.ax * kk * k, -spr.ay * kk * k, spr.c.width * kk * k, spr.c.height * kk * k);
      ctx.restore();
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view, game) {
      if (!FRAME || FRAME.W !== view.W || FRAME.H !== view.H) buildFrame(view.W, view.H);
      for (const p of FRAME.parts) ctx.drawImage(p.c, p.x, p.y);
      drawClock(ctx, view, game);
    },

    drawIcon(ctx, id, size) {
      ctx.save();
      ctx.scale(size / 100, size / 100);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      drawIconArt(ctx, id);
      ctx.restore();
      applyGrain(ctx, size, size, 0.8, id.length * 7);
    },

    /* ---------- hooks: every effect is layered – core tick → main shape → crumbs → lingering dust/smear ---------- */
    onHit(game, e, src) {
      const T = e.type, big = T === 'colossus';
      const y = e.y - e.r * (big ? 1.7 : T === 'ghost' ? 1.9 : 1.3);
      const cols = enemyCols(e), rr = Math.random() * TAU;
      game.addParticle({ x: e.x, y, z: 0, kind: 'tick', life: 0.1, size: big ? 1.7 : 1.15, rot: rr, drag: 0 });
      game.addParticle({ x: e.x + (Math.random() - 0.5) * 3, y: y + (Math.random() - 0.5) * 3, z: 0, kind: 'pow', c: src === 'lantern' ? 4 : src === 'dash' ? 1 : 0, life: 0.26, size: big ? 1.8 : 1.3, rot: rr + 0.4, drag: 0 });
      for (let i = 0; i < (big ? 4 : 2); i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 40;
        game.addParticle({ x: e.x, y: e.y, z: e.r * 1.2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 20 + Math.random() * 30, grav: 160, kind: 'crumb', c: pickCol(cols), life: 0.5, size: 0.7 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, drag: 1.5 });
      }
      game.addParticle({ x: e.x + (Math.random() - 0.5) * 6, y: e.y, z: e.r * 0.8, vx: (Math.random() - 0.5) * 10, vz: 6, kind: 'dust', c: 0, life: 0.45, size: big ? 1.3 : 0.75, drag: 3 });
    },
    onKill(game, e) {
      const big = e.type === 'colossus', T = e.type;
      const cols = enemyCols(e), main = cols[0];
      const yc = e.y - e.r * (big ? 1.7 : T === 'ghost' ? 1.9 : 1.3);
      // core: a hard white tick; main: a coloured chalk poof; debris: crumbs; residue: two motes + the smear on the board
      game.addParticle({ x: e.x, y: yc, z: 0, kind: 'tick', life: 0.1, size: big ? 2.2 : 1.5, rot: Math.random() * TAU, drag: 0 });
      game.addParticle({ x: e.x, y: yc, z: 0, kind: 'poof', c: main, life: 0.42, size: big ? 1.9 : T === 'ghost' ? 0.9 : 1.1, rot: (Math.random() - 0.5) * 0.6, vy: -8, drag: 2 });
      if (big) game.addParticle({ x: e.x + 9, y: yc - 9, z: 0, kind: 'poof', c: 0, life: 0.36, size: 1.0, rot: 0.5, vy: -12, drag: 2 });
      const nc = big ? 12 : T === 'ghost' ? 4 : 6;
      for (let i = 0; i < nc; i++) {
        const a = Math.random() * TAU, sp = (big ? 60 : 40) + Math.random() * 50;
        game.addParticle({ x: e.x, y: e.y, z: e.r * (0.6 + Math.random()), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 40 + Math.random() * 50, grav: 220, kind: 'crumb', c: pickCol(cols), life: 0.6 + Math.random() * 0.4, size: (big ? 1.2 : 0.8) + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 18, drag: 1.2 });
      }
      for (let i = 0; i < (big ? 4 : 2); i++) {
        const a = Math.random() * TAU, sp = 8 + Math.random() * 14;
        game.addParticle({ x: e.x + (Math.random() - 0.5) * e.r, y: e.y, z: e.r * (0.3 + Math.random() * 0.6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, vz: 5 + Math.random() * 6, kind: 'dust', c: i === 0 ? 0 : pickCol(cols), life: 0.8 + Math.random() * 0.4, size: (big ? 1.8 : 1.0) + Math.random() * 0.5, drag: 2.5 });
      }
      addSmear(e.x, e.y - (big ? 4 : 1), big ? 1.8 : T === 'ghost' ? 0.7 : 1.0, pickCol(cols), game.time);
    },
    onHurt(game, p) {
      hurtAt = performance.now();
      const rr = Math.random() * TAU;
      game.addParticle({ x: p.x, y: p.y - 15, z: 0, kind: 'tick', life: 0.12, size: 1.5, rot: rr, drag: 0 });
      game.addParticle({ x: p.x, y: p.y - 15, z: 0, kind: 'pow', c: 1, life: 0.3, size: 1.6, rot: rr + 0.3, drag: 0 });
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * TAU, s = 40 + Math.random() * 50;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 40, grav: 200, kind: 'crumb', c: i & 1 ? 1 : 0, life: 0.6, size: 0.8 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, drag: 1.2 });
      }
    },
    onPickup(game, g) {
      const x = g.x, y = g.y - 6;
      game.addParticle({ x, y, z: 0, kind: 'tick', life: 0.12, size: g.big ? 1.2 : 0.8, rot: Math.random(), drag: 0 });
      game.addParticle({ x: x + (Math.random() - 0.5) * 6, y: y - 3, z: 0, vy: -24, kind: 'star', life: 0.42, size: g.big ? 1.8 : 1.0, rot: Math.random(), vr: 3, drag: 3 });
      if (g.big) for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * 0.9; game.addParticle({ x, y, z: 0, vx: Math.cos(a) * 46, vy: Math.sin(a) * 46, kind: 'star', life: 0.36, size: 0.7, rot: a, vr: 4, drag: 4 }); }
    },
    onShoot(game, pr) {
      if (Math.random() < 0.45) game.addParticle({ x: pr.x, y: pr.y + 3, z: 0, vx: pr.vx * 0.05, vy: pr.vy * 0.05, kind: 'dust', c: 0, life: 0.3, size: 0.55, drag: 4 });
    },
    onDash(game, p) {
      const a = Math.atan2(p.dashY, p.dashX);
      for (let i = 0; i < 4; i++) game.addParticle({ x: p.x - p.dashX * i * 5, y: p.y - p.dashY * i * 5, z: 1, vx: -p.dashX * 20, vy: -p.dashY * 20, kind: 'dust', c: i & 1 ? 3 : 0, life: 0.45, size: 1.2 - i * 0.15, drag: 3 });
      for (let i = 0; i < 2; i++) game.addParticle({ x: p.x, y: p.y - 6 - i * 9, z: 0, vx: p.dashX * 60, vy: p.dashY * 60, kind: 'streak', life: 0.22, size: 1.2 - i * 0.2, rot: a, drag: 6, seed: i * 0.5 });
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'ring', life: 0.7, size: 1.6, rot: 0, drag: 0 });
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'tick', life: 0.14, size: 2.2, rot: 0.3, drag: 0 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        game.addParticle({ x: p.x, y: p.y - 14, z: 0, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, kind: 'star', life: 0.6, size: 1.0, rot: a, vr: 2, drag: 3 });
      }
      for (let i = 0; i < 3; i++) game.addParticle({ x: p.x + (i - 1) * 7, y: p.y, z: 2, vx: (i - 1) * 14, kind: 'dust', c: 4, life: 0.6, size: 1.1, drag: 3 });
    },
    onDeath(game, p) {
      addSmear(p.x, p.y, 2.0, 1, game.time);
      for (let i = 0; i < 6; i++) game.addParticle({ x: p.x + (Math.random() - 0.5) * 10, y: p.y, z: 6 + Math.random() * 14, kind: 'dust', c: i & 1 ? 1 : 0, life: 1.0, size: 2 + Math.random(), drag: 2 });
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * TAU, s = 50 + Math.random() * 70;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 60, grav: 220, kind: 'crumb', c: i % 2 ? 1 : 0, life: 1.0, size: 1 + Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 18, drag: 1.2 });
      }
    },
  });
})();
