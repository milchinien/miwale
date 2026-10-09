/* Kreidetafel – "Jack vs. the Turnip Ancestors" drawn live with chalk on a school blackboard.
   Dark slate-green board, smudges and old eraser swipes, white + pastel chalks (orange, lavender, mint,
   butter yellow, pink, light blue). Everything is grainy, matte and hand-drawn – no glow, no gradients-as-light. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;

  /* ===================================================================================== palette */
  const BOARD = [37, 51, 45];
  const cBoard = 'rgb(37,51,45)';
  const CW = [238, 238, 229];   // white chalk
  const CO = [248, 156, 82];    // pumpkin orange
  const CDO = [222, 108, 52];   // deep orange
  const CL = [194, 172, 236];   // lavender
  const CM = [152, 222, 178];   // mint
  const CG = [112, 188, 126];   // leaf green
  const CY = [249, 229, 140];   // butter yellow
  const CP = [247, 168, 198];   // pink
  const CB = [158, 204, 240];   // light blue
  const CC = [244, 232, 206];   // cream
  const CWD = [176, 128, 88];   // wood brown (eraser)
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
  /** Loose parallel hatching clipped to a polygon. */
  function hatch(ctx, pts, o) {
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
  function rub(ctx, pts, c, a) { ctx.beginPath(); poly(ctx, pts); ctx.fillStyle = rgba(c, a); ctx.fill(); }
  function softRub(ctx, pts, c, cx, cy, r, a0, a1) {
    ctx.save();
    ctx.beginPath(); poly(ctx, pts); ctx.clip();
    const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    g.addColorStop(0, rgba(c, a0)); g.addColorStop(1, rgba(c, a1));
    ctx.fillStyle = g;
    ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    ctx.restore();
  }
  function dot(ctx, x, y, r, c, a) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = rgba(c, a); ctx.fill(); }
  function fillBoard(ctx, pts) { ctx.beginPath(); poly(ctx, pts); ctx.fillStyle = cBoard; ctx.fill(); }
  /** Leaf shape (lens) from base to tip. */
  function leafPts(bx, by, ang, len, wid) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
    return spl([[bx, by], [mx + nx * wid, my + ny * wid], [bx + dx * len, by + dy * len], [mx - nx * wid, my - ny * wid]], 4, true);
  }
  function leaf(ctx, rng, bx, by, ang, len, wid, col) {
    const p = leafPts(bx, by, ang, len, wid);
    rub(ctx, p, col, 0.42);
    hatch(ctx, p, { rng, ang: ang + 1.1, sp: 1.2, w: 0.35, c: col, a: 0.6 });
    stroke(ctx, p, { rng, closed: true, w: 0.7, c: col, a: 0.95 });
    stroke(ctx, [[bx, by], [bx + Math.cos(ang) * len * 0.8, by + Math.sin(ang) * len * 0.8]], { rng, w: 0.35, c: CW, a: 0.55, dbl: false });
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
  function buildGrain() {
    const N = 128;
    const { c, ctx } = U.canvas(N, N);
    const im = ctx.createImageData(N, N), d = im.data;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const h = U.hash2(x, y, 77), h2 = U.hash2(x >> 1, y >> 1, 78), h3 = U.hash2(x >> 2, y, 79);
        let al = 0;
        if (h < 0.1) al = 110 + h * 600;
        else if (h2 < 0.1) al = 55;
        else if (h3 < 0.05) al = 80;
        else al = h * 22;
        d[(y * N + x) * 4 + 3] = Math.min(255, al);
      }
    }
    ctx.putImageData(im, 0, 0);
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
  function mk(x0, y0, x1, y1, draw, opt) {
    opt = opt || {};
    const pad = opt.pad === undefined ? 2 : opt.pad;
    const ax = Math.round((pad - x0) * K), ay = Math.round((pad - y0) * K);
    const w = Math.ceil((x1 - x0 + pad * 2) * K), h = Math.ceil((y1 - y0 + pad * 2) * K);
    const A = cpuCanvas(w, h);
    const a = A.ctx;
    a.setTransform(K, 0, 0, K, ax, ay);
    a.lineCap = 'round'; a.lineJoin = 'round';
    draw(a);
    a.setTransform(1, 0, 0, 1, 0, 0);
    applyGrain(a, w, h, opt.grain === undefined ? 1 : opt.grain, mkSeed++);
    const out = { c: A.c, ax, ay, ch: A.c };
    if (opt.halo !== 0) {
      const im = a.getImageData(0, 0, w, h), d = im.data;
      const M = cpuCanvas(w, h);
      const mi = M.ctx.createImageData(w, h), md = mi.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 26) { md[i] = BOARD[0]; md[i + 1] = BOARD[1]; md[i + 2] = BOARD[2]; md[i + 3] = 255; }
      }
      M.ctx.putImageData(mi, 0, 0);
      const D = U.canvas(w, h);
      const r = (opt.halo || 1) * K;
      for (let k = 0; k < 12; k++) {
        const an = (k / 12) * TAU;
        D.ctx.drawImage(M.c, Math.cos(an) * r, Math.sin(an) * r);
        if (k & 1) D.ctx.drawImage(M.c, Math.cos(an) * r * 0.5, Math.sin(an) * r * 0.5);
      }
      D.ctx.drawImage(M.c, 0, 0);
      const O = U.canvas(w, h);
      O.ctx.globalAlpha = opt.haloA === undefined ? 0.9 : opt.haloA;
      O.ctx.drawImage(D.c, 0, 0);
      O.ctx.globalAlpha = 1;
      O.ctx.drawImage(A.c, 0, 0);
      out.c = O.c;
    }
    if (opt.post) {
      const o = out.c.getContext('2d');
      o.save();
      o.setTransform(K, 0, 0, K, ax, ay);
      opt.post(o);
      o.restore();
    }
    if (opt.flash) out.f = U.tint(A.c, '#ffffff', 0.6);
    return out;
  }
  function flipSpr(s) {
    const w = s.c.width, c = U.flipX(s.c);
    return { c, ax: w - s.ax, ay: s.ay, ch: s.ch === s.c ? c : U.flipX(s.ch), f: s.f ? U.flipX(s.f) : null };
  }

  /* ===================================================================================== characters */
  /* ---------- Jack (drawn facing right, flipped for left) ---------- */
  function drawJack(ctx, ph, idle, rng) {
    const f = 1;
    const sw = idle ? 0 : Math.sin(ph * TAU);
    const by = idle ? (ph > 0.25 ? -0.45 : 0) : -Math.abs(Math.cos(ph * TAU)) * 1.0;
    // legs + boots
    for (const s of [-1, 1]) {
      const lift = idle ? 0 : Math.max(0, -sw * s) * 1.7;
      const fx = s * 1.9 + (idle ? 0 : sw * s * 2.6);
      stroke(ctx, [[s * 1.6, -7.6 + by], [(s * 1.6 + fx) / 2, -4 + by * 0.5 - lift * 0.5], [fx, -lift]], { rng, w: 1.35, c: CW, a: 0.95 });
      stroke(ctx, [[fx - 0.6, -lift + 0.1], [fx + f * 1.7, -lift - 0.1]], { rng, w: 1.4, c: CW, a: 0.95, dbl: false });
    }
    // back arm
    stroke(ctx, [[-3.2, -14 + by], [-4.4 - sw * 0.6, -11.5 + by], [-4.6 - sw * 1.6, -9.6 + by]], { rng, w: 1.1, c: CW, a: 0.8 });
    // cloak
    const body = spl([[-3.8, -15.6], [3.8, -15.6], [5.4, -11], [6.6, -6.6], [2.2, -6.0], [-2.2, -6.2], [-6.6, -6.8], [-5.2, -11]].map((p) => [p[0], p[1] + by]), 4, true);
    fillBoard(ctx, body);
    rub(ctx, body, CW, 0.34);
    hatch(ctx, body, { rng, ang: 1.05, sp: 1.25, w: 0.42, c: CW, a: 0.8, inset: 0.9 });
    stroke(ctx, body, { rng, closed: true, w: 0.95, c: CW, a: 1 });
    // front arm + hand
    const hx = 5.0 + sw * 1.6, hy = -9.4 + by;
    stroke(ctx, [[3.2, -14 + by], [4.6 + sw * 0.6, -11.8 + by], [hx, hy]], { rng, w: 1.15, c: CW, a: 1 });
    dot(ctx, hx, hy, 0.9, CW, 0.9);
    // scarf (mint, pink stripes)
    stroke(ctx, [[-4.2, -15.4 + by], [0, -14.6 + by], [4.2, -15.4 + by]], { rng, w: 1.9, c: CM, a: 0.95 });
    const fl = idle ? Math.sin(ph * TAU) * 0.5 : sw * 0.9;
    const tail = [[-2.2, -15 + by], [-5, -14.2 + by + fl * 0.4], [-7.6, -12.6 + by + fl]];
    stroke(ctx, tail, { rng, w: 1.6, c: CM, a: 0.95 });
    stroke(ctx, [[-4.6, -15.2 + by + fl * 0.3], [-4.9, -13.4 + by + fl * 0.3]], { rng, w: 0.5, c: CP, a: 0.9, dbl: false });
    stroke(ctx, [[-6.6, -13.9 + by + fl * 0.8], [-6.9, -12.2 + by + fl * 0.8]], { rng, w: 0.5, c: CP, a: 0.9, dbl: false });
    // pumpkin head
    const hcx = 0.3, hcy = -21.6 + by;
    const head = ell(hcx, hcy, 7.9, 6.7, 34).map((p, i) => {
      const k = 1 + 0.035 * Math.cos(i * (TAU / 34) * 6);
      return [hcx + (p[0] - hcx) * k, hcy + (p[1] - hcy) * k];
    });
    fillBoard(ctx, head);
    rub(ctx, head, CO, 0.72);
    ctx.save();
    ctx.beginPath(); poly(ctx, head); ctx.clip();
    hatch(ctx, ell(hcx - 2.8, hcy + 2.8, 8, 6.4, 20), { rng, ang: -0.75, sp: 1.15, w: 0.5, c: CDO, a: 0.85 });
    hatch(ctx, ell(hcx + 3, hcy - 3.2, 3.6, 2.4, 16), { rng, ang: -0.75, sp: 1.0, w: 0.4, c: CY, a: 0.6 });
    ctx.restore();
    for (const s of [-1, 1]) {
      stroke(ctx, spl([[hcx + s * 2.4, hcy - 6.2], [hcx + s * 4.3, hcy], [hcx + s * 2.4, hcy + 6.2]], 4), { rng, w: 0.6, c: CDO, a: 0.95, dbl: false });
    }
    stroke(ctx, head, { rng, closed: true, w: 1.2, c: CO, a: 1 });
    // stem + vine
    stroke(ctx, [[hcx - 0.2, hcy - 6.4], [hcx - 0.6, hcy - 8.4], [hcx - 1.6, hcy - 9.2]], { rng, w: 1.5, c: CG, a: 1 });
    stroke(ctx, spl([[hcx - 0.6, hcy - 7.8], [hcx + 1.6, hcy - 9.4], [hcx + 3, hcy - 8.4], [hcx + 2.2, hcy - 7.6]], 4), { rng, w: 0.5, c: CM, a: 0.9, dbl: false });
    // face (shifted to facing side) – glowing yellow chalk
    const fx = hcx + 1.4;
    for (const s of [-1, 1]) {
      const ex = fx + s * 2.7, ey = hcy - 1.2;
      const tri = [[ex - 1.75, ey + 1.1], [ex + 1.75, ey + 1.1], [ex + 0.25, ey - 1.7]];
      fillBoard(ctx, tri);
      rub(ctx, tri, CY, 0.95);
      dot(ctx, ex + 0.1, ey + 0.2, 0.55, CW, 0.95);
      stroke(ctx, tri, { rng, closed: true, w: 0.4, c: CY, a: 1, dbl: false, step: 0.6 });
    }
    const grin = [[-4.3, 1.6], [-2.7, 2.5], [-1.7, 1.8], [-0.1, 2.7], [1.5, 1.8], [2.6, 2.5], [4.2, 1.6], [3.3, 3.8], [1.6, 4.7], [0, 4.3], [-1.6, 4.7], [-3.3, 3.8]].map((p) => [fx + p[0], hcy + p[1]]);
    fillBoard(ctx, grin);
    rub(ctx, grin, CY, 0.95);
    stroke(ctx, grin, { rng, closed: true, w: 0.4, c: CY, a: 1, dbl: false, step: 0.6 });
  }
  function jackGlow(ctx, by) {
    ctx.globalCompositeOperation = 'destination-over';
    const g = ctx.createRadialGradient(0.3, -21.6 + by, 3, 0.3, -21.6 + by, 14);
    g.addColorStop(0, rgba(CO, 0.32)); g.addColorStop(0.55, rgba(CO, 0.12)); g.addColorStop(1, rgba(CO, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-15, -37, 30, 30);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- Rüben-Schleicher ---------- */
  function drawCreeper(ctx, fr, rng) {
    const ph = fr / 4, sw = Math.sin(ph * TAU);
    const bob = -Math.abs(Math.cos(ph * TAU)) * 0.9, tilt = sw * 0.09;
    for (const s of [-1, 1]) {
      const lift = Math.max(0, -sw * s) * 1.4;
      const fx = s * 2.8 + sw * s * 1.6;
      stroke(ctx, [[s * 2.2, -5 + bob], [s * 2.6 + sw * s * 0.8, -2.4 - lift * 0.5], [fx, -lift]], { rng, w: 0.95, c: CC, a: 0.95 });
      stroke(ctx, [[fx, -lift], [fx + s * 1.2, 0.2 - lift]], { rng, w: 0.6, c: CC, a: 0.8, dbl: false });
    }
    ctx.save();
    ctx.translate(0, -12.5 + bob);
    ctx.rotate(tilt);
    const bulb = spl([[0, -7.4], [5.4, -5.8], [7.9, -1], [6.6, 3.8], [3, 6.8], [0, 8.4], [-3, 6.8], [-6.6, 3.8], [-7.9, -1], [-5.4, -5.8]], 4, true);
    fillBoard(ctx, bulb);
    rub(ctx, bulb, CC, 0.2);
    // root tip
    stroke(ctx, spl([[0, 8], [-0.6, 9.8], [-1.8, 11]], 3), { rng, w: 0.6, c: CC, a: 0.8, dbl: false });
    ctx.save();
    ctx.beginPath(); poly(ctx, bulb); ctx.clip();
    const wave = [[-9, -10], [9, -10], [9, -0.4], [6, 0.4], [3, -0.6], [0, 0.4], [-3, -0.6], [-6, 0.4], [-9, -0.4]];
    rub(ctx, wave, CL, 0.6);
    hatch(ctx, wave, { rng, ang: -0.8, sp: 1.15, w: 0.45, c: CL, a: 0.95 });
    const low = [[-9, 0], [9, 0], [9, 10], [-9, 10]];
    hatch(ctx, low, { rng, ang: 0.7, sp: 1.7, w: 0.4, c: CW, a: 0.55, skip: 0.15 });
    ctx.restore();
    stroke(ctx, [[-7.8, -0.4], [-6, 0.4], [-3, -0.6], [0, 0.4], [3, -0.6], [6, 0.4], [7.8, -0.4]], { rng, w: 0.55, c: CL, a: 0.9, dbl: false });
    stroke(ctx, bulb, { rng, closed: true, w: 0.95, c: CW, a: 1 });
    stroke(ctx, spl([[-6.6, -3.6], [-4.6, -6.2], [0, -7.5], [4.6, -6.2], [6.6, -3.6]], 3), { rng, w: 0.9, c: CL, a: 0.9, dbl: false });
    // leaves
    leaf(ctx, rng, -0.6, -6.6, -Math.PI / 2 - 0.6, 6.6, 1.9, CM);
    leaf(ctx, rng, 0.6, -6.6, -Math.PI / 2 + 0.55, 6.4, 1.8, CG);
    leaf(ctx, rng, 0, -7, -Math.PI / 2 + 0.05, 8.6, 2.1, CM);
    // angry eyes
    for (const s of [-1, 1]) {
      const ex = 1.4 + s * 2.5, ey = -1.8;
      const e = ell(ex, ey, 1.55, 1.25, 14);
      fillBoard(ctx, e);
      rub(ctx, e, CY, 0.95);
      dot(ctx, ex + 0.45, ey + 0.15, 0.62, BOARD, 1);
      stroke(ctx, [[ex + s * 2.0, ey - 2.6], [ex - s * 1.4, ey - 1.5]], { rng, w: 0.75, c: CW, a: 1, dbl: false });
    }
    stroke(ctx, [[-0.6, 3.2], [0.4, 2.5], [1.4, 3.2], [2.4, 2.5], [3.2, 3.2]], { rng, w: 0.5, c: CW, a: 0.95, dbl: false, step: 0.5 });
    ctx.restore();
  }

  /* ---------- Hungergeist ---------- */
  function drawGhost(ctx, fr, rng) {
    const w = Math.sin((fr / 4) * TAU);
    const body = spl([
      [-6.2, -14], [-5.4, -18.8], [-1.5, -21.4], [2.6, -21.2], [6, -18.2], [6.6, -13.5], [5.6, -8.5],
      [4.4, -4.2 + w * 0.6], [2.2, -1.4], [0.6, -3.6 - w * 0.4], [-1.6, -0.6 + w * 0.7], [-3.6, -3.2],
      [-6.8, -1.2 - w * 0.6], [-7.4, -5], [-6.8, -9.5],
    ], 3, true);
    softRub(ctx, body, CW, 0.6, -14, 11, 0.8, 0.34);
    hatch(ctx, body, { rng, ang: 1.15, sp: 1.4, w: 0.4, c: CW, a: 0.5, skip: 0.15 });
    // frosty lower edge
    const n = body.length;
    stroke(ctx, body.slice(Math.floor(n * 0.42), Math.floor(n * 0.93)), { rng, w: 0.8, c: CB, a: 0.75, dbl: false });
    // broken outline
    stroke(ctx, body.slice(Math.floor(n * 0.95)).concat(body.slice(0, Math.floor(n * 0.55))), { rng, w: 0.85, c: CW, a: 0.95 });
    // trailing wisps
    stroke(ctx, spl([[-6.4, -6], [-9, -5 + w * 0.6], [-11, -2.6 + w]], 4), { rng, w: 0.55, c: CW, a: 0.55, dbl: false });
    stroke(ctx, spl([[-5.6, -11], [-8.4, -10.4 - w * 0.5], [-10.4, -8.6]], 4), { rng, w: 0.45, c: CB, a: 0.5, dbl: false });
    // reaching arm
    stroke(ctx, spl([[5.4, -11.2], [8, -12.6 + w * 0.4], [10.3, -11.6 + w]], 4), { rng, w: 0.85, c: CW, a: 0.8 });
    stroke(ctx, [[10.3, -11.6 + w], [11.4, -12.4 + w]], { rng, w: 0.4, c: CW, a: 0.7, dbl: false });
    stroke(ctx, [[10.3, -11.6 + w], [11.4, -10.9 + w]], { rng, w: 0.4, c: CW, a: 0.7, dbl: false });
    // hollow eyes + gaping mouth
    for (const s of [-1, 1]) {
      const e = ell(1.6 + s * 2.2, -15.2 - (s > 0 ? 0.2 : 0), 1.3, 1.9, 14);
      fillBoard(ctx, e);
      stroke(ctx, e, { rng, closed: true, w: 0.35, c: CB, a: 0.6, dbl: false, step: 0.6 });
    }
    const m = ell(1.9, -10.3, 1.35, 2.2 + w * 0.3, 14);
    fillBoard(ctx, m);
    stroke(ctx, m, { rng, closed: true, w: 0.35, c: CB, a: 0.55, dbl: false, step: 0.6 });
  }

  /* ---------- Steckrüben-Koloss ---------- */
  function drawColossus(ctx, fr, rng) {
    const ph = fr / 4, sw = Math.sin(ph * TAU);
    const bob = -Math.abs(Math.cos(ph * TAU)) * 1.6;
    // legs
    for (const s of [-1, 1]) {
      const lift = Math.max(0, -sw * s) * 2.2;
      const fx = s * 7 + sw * s * 2.2;
      stroke(ctx, [[s * 6, -12 + bob], [s * 6.6 + sw * s, -6 - lift * 0.5], [fx, -lift]], { rng, w: 3.0, c: CC, a: 0.95 });
      for (let k = -1; k <= 1; k++) stroke(ctx, [[fx, -lift], [fx + k * 1.8 + s * 0.8, 0.8 - lift]], { rng, w: 0.7, c: CC, a: 0.85, dbl: false });
    }
    ctx.save();
    ctx.translate(0, -27 + bob);
    const body = spl([[0, -17], [10.5, -14.5], [16.5, -4], [15.5, 7.5], [9, 15], [0, 17.5], [-9, 15], [-15.5, 7.5], [-16.5, -4], [-10.5, -14.5]], 4, true);
    // back arm
    stroke(ctx, spl([[-14.5, -3], [-18.5, 4], [-19.5 - sw * 1.5, 11]], 4), { rng, w: 2.6, c: CL, a: 0.9 });
    fillBoard(ctx, body);
    rub(ctx, body, CL, 0.3);
    ctx.save();
    ctx.beginPath(); poly(ctx, body); ctx.clip();
    const low = [[-18, 6], [-10, 5], [-4, 7], [3, 5.4], [10, 7], [18, 5.6], [18, 20], [-18, 20]];
    rub(ctx, low, CC, 0.22);
    hatch(ctx, [[-18, -20], [18, -20], [18, 7], [-18, 7]], { rng, ang: 0.8, sp: 1.25, w: 0.5, c: CL, a: 0.95 });
    hatch(ctx, [[-18, -20], [18, -20], [18, 7], [-18, 7]], { rng, ang: -0.8, sp: 1.55, w: 0.45, c: CP, a: 0.55 });
    hatch(ctx, low, { rng, ang: 0.25, sp: 1.6, w: 0.45, c: CW, a: 0.55 });
    hatch(ctx, ell(-7, 8, 12, 9, 20), { rng, ang: -1.2, sp: 1.3, w: 0.45, c: CL, a: 0.6 });
    ctx.restore();
    stroke(ctx, [[-16, 6], [-10, 5], [-4, 7], [3, 5.4], [10, 7], [16, 5.6]], { rng, w: 0.6, c: CL, a: 0.9, dbl: false });
    // cracks
    for (const cr of [[[-7, -13], [-4.5, -9.5], [-6.5, -6], [-3.5, -2]], [[9, -11], [6.5, -7.5], [9.5, -3]], [[-11, 9], [-7.5, 11.5], [-9.5, 14]]]) {
      stroke(ctx, cr, { rng, w: 0.7, c: CW, a: 0.9, dbl: false, step: 0.7 });
    }
    stroke(ctx, body, { rng, closed: true, w: 1.5, c: CW, a: 1 });
    stroke(ctx, spl([[-14, -8], [-9, -14.6], [0, -17.4], [9, -14.6], [14, -8]], 4), { rng, w: 1.1, c: CL, a: 0.9, dbl: false });
    // glowing core
    const cx = 1.6, cy = 2.5;
    const core = ell(cx, cy, 4.2, 4.2, 20);
    fillBoard(ctx, core);
    rub(ctx, core, CO, 0.9);
    rub(ctx, ell(cx, cy, 2.2, 2.2, 14), CY, 0.95);
    dot(ctx, cx - 0.5, cy - 0.6, 0.8, CW, 0.95);
    stroke(ctx, core, { rng, closed: true, w: 0.7, c: CO, a: 1, dbl: false });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + 0.2, r1 = k & 1 ? 6.2 : 7.4;
      stroke(ctx, [[cx + Math.cos(a) * 5.1, cy + Math.sin(a) * 5.1], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]], { rng, w: 0.6, c: CO, a: 0.9, dbl: false, step: 0.5 });
    }
    // eyes + brows
    for (const s of [-1, 1]) {
      const ex = 2 + s * 5.2, ey = -7.5;
      const e = ell(ex, ey, 2.3, 1.5, 16);
      fillBoard(ctx, e);
      rub(ctx, e, CY, 0.95);
      dot(ctx, ex + 0.7, ey + 0.2, 0.75, BOARD, 1);
      stroke(ctx, [[ex + s * 2.9, ey - 3.6], [ex - s * 2.4, ey - 2.0]], { rng, w: 1.2, c: CW, a: 1 });
    }
    stroke(ctx, [[-3, 10], [-1.5, 8.8], [0, 10], [1.5, 8.8], [3, 10], [4.5, 8.8], [6, 10]], { rng, w: 0.8, c: CW, a: 0.95, dbl: false, step: 0.6 });
    // front arm with root fingers
    const hx = 19.5 + sw * 1.5, hy = 11;
    stroke(ctx, spl([[14.5, -3], [18.5, 4], [hx, hy]], 4), { rng, w: 2.8, c: CC, a: 0.95 });
    stroke(ctx, spl([[15.4, -2], [18.8, 4.4], [hx + 0.6, hy - 0.4]], 4), { rng, w: 0.6, c: CL, a: 0.8, dbl: false });
    for (let k = -1; k <= 1; k++) stroke(ctx, [[hx, hy], [hx + k * 1.6, hy + 2.6], [hx + k * 2.2 + 0.4, hy + 3.6]], { rng, w: 0.7, c: CC, a: 0.85, dbl: false });
    // leaf crown
    const ang = [-0.95, -0.48, 0, 0.48, 0.95], len = [10, 13, 15, 13, 10];
    for (let k = 0; k < 5; k++) leaf(ctx, rng, (k - 2) * 1.6, -16, -Math.PI / 2 + ang[k], len[k], 3.0, k & 1 ? CG : CM);
    ctx.restore();
  }

  /* ===================================================================================== small objects */
  function drawSeed(ctx, rng) {
    const p = seedPts(0, 0, 0, 6.2, 3.6);
    fillBoard(ctx, p);
    rub(ctx, p, CC, 0.85);
    hatch(ctx, p, { rng, ang: 0.5, sp: 0.9, w: 0.35, c: CY, a: 0.8 });
    stroke(ctx, p, { rng, closed: true, w: 0.55, c: CW, a: 1, dbl: false, step: 0.6 });
    stroke(ctx, [[-1.8, 0], [2.0, 0]], { rng, w: 0.3, c: CO, a: 0.8, dbl: false });
  }
  function drawTrail(ctx, rng) {
    for (let k = -1; k <= 1; k++) {
      let x = -2.5;
      while (x > -13) {
        const L = R(1.2, 2.8, rng);
        stroke(ctx, [[x, k * 0.9], [x - L, k * (0.9 + (-x) * 0.05)]], { rng, w: 0.5 - Math.abs(k) * 0.12 - (-x) * 0.015, c: CW, a: 0.7 - (-x) * 0.04, dbl: false, j: 0.05 });
        x -= L + R(0.6, 1.6, rng);
      }
    }
  }
  function drawLantern(ctx, rng) {
    const b = spl([[0, -10.5], [4.4, -9], [5.6, -5], [4.2, -1.6], [1.6, 0], [-1.6, 0], [-4.2, -1.6], [-5.6, -5], [-4.4, -9]], 4, true);
    fillBoard(ctx, b);
    rub(ctx, b, CC, 0.3);
    ctx.save(); ctx.beginPath(); poly(ctx, b); ctx.clip();
    const top = [[-7, -12], [7, -12], [7, -7], [-7, -7]];
    rub(ctx, top, CL, 0.6);
    hatch(ctx, top, { rng, ang: -0.8, sp: 1.0, w: 0.4, c: CL, a: 0.9 });
    ctx.restore();
    stroke(ctx, b, { rng, closed: true, w: 0.75, c: CW, a: 1 });
    for (const s of [-1, 1]) {
      const t = [[s * 1.9 - 1, -5.2], [s * 1.9 + 1, -5.2], [s * 1.9, -6.8]];
      rub(ctx, t, CY, 1);
    }
    const m = [[-2.4, -3.2], [-1.2, -2.6], [0, -3.2], [1.2, -2.6], [2.4, -3.2], [1.6, -1.8], [0, -1.4], [-1.6, -1.8]];
    rub(ctx, m, CY, 1);
    leaf(ctx, rng, -0.4, -10.2, -Math.PI / 2 - 0.5, 4.2, 1.2, CM);
    leaf(ctx, rng, 0.4, -10.2, -Math.PI / 2 + 0.45, 4.6, 1.3, CG);
    stroke(ctx, [[0, -10.5], [0, -14]], { rng, w: 0.4, c: CW, a: 0.7, dbl: false });
  }
  function lanternGlow(ctx) {
    ctx.globalCompositeOperation = 'destination-over';
    const g = ctx.createRadialGradient(0, -5, 2, 0, -5, 10);
    g.addColorStop(0, rgba(CY, 0.3)); g.addColorStop(1, rgba(CY, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-11, -16, 22, 22);
    ctx.globalCompositeOperation = 'source-over';
  }
  function drawGem(ctx, big, rng) {
    if (!big) {
      const p = [[0, -6.4], [2.2, -3.2], [0, 0], [-2.2, -3.2]];
      fillBoard(ctx, p);
      rub(ctx, p, CB, 0.6);
      hatch(ctx, p, { rng, ang: 0.9, sp: 0.8, w: 0.3, c: CW, a: 0.7 });
      stroke(ctx, p, { rng, closed: true, w: 0.55, c: CB, a: 1, dbl: false, step: 0.5 });
      stroke(ctx, [[-0.6, -4.6], [-1.1, -3.3]], { rng, w: 0.4, c: CW, a: 1, dbl: false });
    } else {
      const p = [[0, -11], [4, -5.6], [0, 0], [-4, -5.6]];
      fillBoard(ctx, p);
      rub(ctx, p, CP, 0.55);
      hatch(ctx, p, { rng, ang: 0.9, sp: 0.9, w: 0.35, c: CY, a: 0.8 });
      stroke(ctx, p, { rng, closed: true, w: 0.75, c: CY, a: 1, dbl: false, step: 0.6 });
      stroke(ctx, [[0, -11], [0, 0]], { rng, w: 0.35, c: CW, a: 0.6, dbl: false });
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU;
        stroke(ctx, [[Math.cos(a) * 5.6, -5.6 + Math.sin(a) * 5.6], [Math.cos(a) * 7.2, -5.6 + Math.sin(a) * 7.2]], { rng, w: 0.45, c: CY, a: 0.85, dbl: false, step: 0.5 });
      }
    }
  }
  function shadowSpr(rx, ry) {
    const { c, ctx } = U.canvas(Math.ceil(rx * 2 * K + 4), Math.ceil(ry * 2 * K + 4));
    const w = c.width, h = c.height;
    ctx.translate(w / 2, h / 2);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * K);
    g.addColorStop(0, 'rgba(10,18,14,0.55)'); g.addColorStop(0.7, 'rgba(10,18,14,0.3)'); g.addColorStop(1, 'rgba(10,18,14,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, rx * K, 0, TAU); ctx.fill();
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
  function grassTufts(ctx, rng, x0, x1, n) {
    for (let i = 0; i < n; i++) {
      const x = R(x0, x1, rng);
      for (let k = 0; k < 3; k++) stroke(ctx, [[x + k * 0.8, 0.6], [x + k * 0.8 + R(-0.8, 0.8, rng), -R(1.6, 3.2, rng)]], { rng, w: 0.45, c: k === 1 ? CG : CM, a: 0.85, dbl: false });
    }
  }
  function artTree(ctx, rng, col, col2) {
    const sides = [[[-6, 1], [-2.8, -2], [-2, -14], [-2.4, -27], [-5, -35]], [[6.5, 1], [3, -2], [2.3, -14], [2.6, -27], [5, -35]]];
    const trunk = spl(sides[0], 3).concat(spl(sides[1], 3).reverse());
    fillBoard(ctx, trunk);
    hatch(ctx, trunk, { rng, ang: 1.35, sp: 1.3, w: 0.42, c: CW, a: 0.55 });
    for (const s of sides) stroke(ctx, spl(s, 4), { rng, w: 1.05, c: CW, a: 1 });
    for (let k = 0; k < 4; k++) { const y = -4 - k * 7 + R(-2, 2, rng); stroke(ctx, [[R(-1.4, 0, rng), y], [R(0, 1.4, rng), y - 2]], { rng, w: 0.4, c: CW, a: 0.6, dbl: false }); }
    stroke(ctx, spl([[-1, -30], [-6, -38], [-10, -42]], 4), { rng, w: 0.8, c: CW, a: 0.9 });
    stroke(ctx, spl([[1.5, -31], [7, -40], [11, -43]], 4), { rng, w: 0.8, c: CW, a: 0.9 });
    // crown
    const cx = 0, cy = -50, rx = 21, ry = 16.5;
    const bumps = [];
    const nb = 11;
    for (let i = 0; i < nb; i++) {
      const a = (i / nb) * TAU, rr = 1 + R(-0.06, 0.1, rng);
      bumps.push([cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr]);
      const a2 = ((i + 0.5) / nb) * TAU;
      bumps.push([cx + Math.cos(a2) * rx * 0.86, cy + Math.sin(a2) * ry * 0.86]);
    }
    const crown = spl(bumps, 4, true);
    fillBoard(ctx, crown);
    rub(ctx, crown, col, 0.14);
    ctx.save();
    ctx.beginPath(); poly(ctx, crown); ctx.clip();
    const sc = [];
    let a = 0;
    for (let i = 0; i < 120; i++) {
      a += 0.95 + J(0.3, rng);
      const rr = 0.25 + rng.next() * 0.72;
      sc.push([cx + Math.cos(a) * rx * rr + J(2, rng), cy + Math.sin(a) * ry * rr + J(2, rng) + (i / 120 - 0.5) * 6]);
    }
    stroke(ctx, spl(sc, 3), { rng, w: 0.55, c: col2, a: 0.55, dbl: false, step: 0.9 });
    hatch(ctx, ell(cx + 6, cy + 6, 16, 11, 20), { rng, ang: -0.8, sp: 1.3, w: 0.45, c: col, a: 0.7 });
    ctx.restore();
    stroke(ctx, crown, { rng, closed: true, w: 1.2, c: col, a: 1 });
    for (let k = 0; k < 4; k++) {
      const x = cx - 10 + R(-4, 6, rng), y = cy - 7 + R(-4, 4, rng);
      stroke(ctx, spl([[x, y + 1.4], [x + 1.4, y], [x + 3, y + 0.6]], 3), { rng, w: 0.45, c: CW, a: 0.8, dbl: false });
    }
    grassTufts(ctx, rng, -9, 9, 3);
  }
  function branch(ctx, rng, x, y, a, len, w, d) {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    const mx = (x + x2) / 2 + J(len * 0.12, rng), my = (y + y2) / 2 + J(len * 0.12, rng);
    stroke(ctx, spl([[x, y], [mx, my], [x2, y2]], 4), { rng, w, c: d > 1 ? CW : CL, a: 0.95, dbl: d > 1 });
    if (d <= 0) return;
    const n = d > 2 ? 2 : 2 + (rng.next() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) branch(ctx, rng, x2, y2, a + (i - (n - 1) / 2) * R(0.5, 0.8, rng) + J(0.15, rng), len * R(0.6, 0.75, rng), w * 0.68, d - 1);
  }
  function artDeadTree(ctx, rng) {
    const sides = [[[-5, 1], [-2.4, -2], [-1.8, -16], [-1.4, -26]], [[5, 1], [2.4, -2], [1.8, -16], [1.4, -26]]];
    const trunk = spl(sides[0], 3).concat(spl(sides[1], 3).reverse());
    fillBoard(ctx, trunk);
    hatch(ctx, trunk, { rng, ang: 1.4, sp: 1.2, w: 0.4, c: CL, a: 0.7 });
    for (const s of sides) stroke(ctx, spl(s, 4), { rng, w: 1.0, c: CW, a: 1 });
    branch(ctx, rng, 0, -25, -Math.PI / 2 - 0.45, 13, 1.5, 3);
    branch(ctx, rng, 0, -25, -Math.PI / 2 + 0.5, 12, 1.4, 3);
    branch(ctx, rng, -1, -16, -Math.PI + 0.5, 9, 1.0, 2);
    if (rng.next() < 0.6) DOODLES.bat(ctx, rng);
    grassTufts(ctx, rng, -7, 7, 2);
  }
  function artGrave(ctx, rng, kind) {
    let p;
    if (kind === 1) p = [[-1.6, 0], [-1.6, -9], [-5.6, -9], [-5.6, -12.4], [-1.6, -12.4], [-1.6, -18.4], [1.6, -18.4], [1.6, -12.4], [5.6, -12.4], [5.6, -9], [1.6, -9], [1.6, 0]];
    else if (kind === 2) p = spl([[-5, 0], [-5.4, -14], [0, -20], [5.4, -14], [5, 0]], 4).concat([[0, 0]]);
    else p = [[-6, 0]].concat(spl([[-6, -11], [-4.4, -15.8], [0, -17.4], [4.4, -15.8], [6, -11]], 4)).concat([[6, 0]]);
    fillBoard(ctx, p);
    rub(ctx, p, CW, 0.1);
    hatch(ctx, p, { rng, ang: 0.9, sp: 1.4, w: 0.42, c: CW, a: 0.5, inset: 0.92, skip: 0.1 });
    stroke(ctx, p, { rng, closed: true, w: 1.05, c: CW, a: 1 });
    if (kind === 0) {
      // R I P carved letters
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
    stroke(ctx, [[-8, 0.4], [8, 0.2]], { rng, w: 0.7, c: CW, a: 0.7, dbl: false });
    grassTufts(ctx, rng, -7.5, 6, 3);
  }
  function artFence(ctx, rng) {
    const xs = [-15, -5, 5, 15];
    const lean = J(0.08, rng);
    for (const x of xs) {
      const h = R(12, 14.5, rng);
      const p = [[x - 1.3, 0], [x - 1.3 + lean * h, -h + 1.6], [x + lean * h, -h], [x + 1.3 + lean * h, -h + 1.6], [x + 1.3, 0]];
      fillBoard(ctx, p);
      hatch(ctx, p, { rng, ang: 1.2, sp: 1.0, w: 0.35, c: CW, a: 0.5 });
      stroke(ctx, p, { rng, closed: false, w: 0.8, c: CW, a: 1, dbl: false });
    }
    for (const y of [-4.5, -9.5]) stroke(ctx, [[-17, y + J(0.5, rng)], [17, y + J(0.5, rng)]], { rng, w: 0.9, c: CW, a: 0.95 });
    grassTufts(ctx, rng, -17, 16, 5);
  }
  function artScarecrow(ctx, rng) {
    stroke(ctx, [[0, 0.5], [0.3, -38]], { rng, w: 1.4, c: CW, a: 1 });
    stroke(ctx, [[-14, -27.4], [14, -27]], { rng, w: 1.1, c: CW, a: 0.95 });
    const coat = [[-4.2, -30.5], [4.2, -30.5], [6.4, -15.5], [2, -16.6], [0, -15.2], [-2.2, -16.6], [-6.4, -15.5]];
    for (const s of [-1, 1]) {
      const sl = [[s * 3.5, -30], [s * 12.5, -28.6], [s * 12.5, -25.2], [s * 3.5, -25.8]];
      fillBoard(ctx, sl);
      rub(ctx, sl, CL, 0.35);
      hatch(ctx, sl, { rng, ang: 1.2, sp: 1.1, w: 0.4, c: CL, a: 0.8 });
      stroke(ctx, sl, { rng, closed: true, w: 0.7, c: CL, a: 1, dbl: false });
      for (let k = 0; k < 4; k++) stroke(ctx, [[s * 12.6, -27], [s * (14.8 + R(0, 1, rng)), -28.8 + k * 1.3]], { rng, w: 0.45, c: CY, a: 0.95, dbl: false });
    }
    fillBoard(ctx, coat);
    rub(ctx, coat, CL, 0.35);
    hatch(ctx, coat, { rng, ang: -1.0, sp: 1.15, w: 0.42, c: CL, a: 0.9 });
    stroke(ctx, coat, { rng, closed: true, w: 0.85, c: CL, a: 1 });
    for (let k = 0; k < 5; k++) stroke(ctx, [[-4 + k * 2, -15.8], [-4.4 + k * 2.2, -12.6 - R(0, 1, rng)]], { rng, w: 0.45, c: CY, a: 0.9, dbl: false });
    stroke(ctx, [[-1.6, -24], [1.4, -21.6]], { rng, w: 0.5, c: CP, a: 0.9, dbl: false });
    stroke(ctx, [[1.4, -24], [-1.6, -21.6]], { rng, w: 0.5, c: CP, a: 0.9, dbl: false });
    const head = ell(0.2, -34.6, 4.6, 4.3, 22);
    fillBoard(ctx, head);
    rub(ctx, head, CC, 0.28);
    hatch(ctx, head, { rng, ang: 0.7, sp: 1.1, w: 0.4, c: CY, a: 0.7 });
    stroke(ctx, head, { rng, closed: true, w: 0.8, c: CY, a: 1 });
    for (const s of [-1, 1]) {
      const ex = 0.2 + s * 1.7, ey = -35.4;
      stroke(ctx, [[ex - 0.8, ey - 0.8], [ex + 0.8, ey + 0.8]], { rng, w: 0.45, c: CW, a: 1, dbl: false });
      stroke(ctx, [[ex + 0.8, ey - 0.8], [ex - 0.8, ey + 0.8]], { rng, w: 0.45, c: CW, a: 1, dbl: false });
    }
    stroke(ctx, [[-2, -32.6], [2.4, -32.6]], { rng, w: 0.4, c: CW, a: 0.9, dbl: false });
    for (let k = 0; k < 4; k++) stroke(ctx, [[-1.4 + k * 1.1, -33.2], [-1.4 + k * 1.1, -32]], { rng, w: 0.3, c: CW, a: 0.9, dbl: false });
    const hat = [[-3.6, -38.4], [-2, -45.4], [3.6, -44.2], [3.8, -38.4]];
    fillBoard(ctx, hat);
    rub(ctx, hat, CL, 0.55);
    hatch(ctx, hat, { rng, ang: 0.8, sp: 1.0, w: 0.4, c: CL, a: 0.9 });
    stroke(ctx, hat, { rng, closed: true, w: 0.75, c: CL, a: 1, dbl: false });
    stroke(ctx, [[-7.4, -38.2], [7.6, -38.6]], { rng, w: 1.0, c: CL, a: 1 });
    grassTufts(ctx, rng, -5, 4, 2);
  }
  function artPumpkins(ctx, rng, v) {
    if (v === 0) { pumpkin(ctx, rng, 0, 0, 6, false, 0.16); }
    else if (v === 1) { pumpkin(ctx, rng, -4, -1, 4.4, false, 0.16); pumpkin(ctx, rng, 4.5, 0.5, 5.2, false, 0.16); }
    else { pumpkin(ctx, rng, -6, -0.5, 3.6, false, 0.16); pumpkin(ctx, rng, 5.5, -1, 4, false, 0.16); pumpkin(ctx, rng, 0, 1, 4.6, false, 0.16); }
    for (let k = 0; k < 2; k++) stroke(ctx, spl([[-8 + k * 9, -1], [-6 + k * 9, -4], [-4 + k * 9, -2.6], [-3 + k * 9, -4.4]], 4), { rng, w: 0.45, c: CG, a: 0.8, dbl: false });
  }
  function artSign(ctx, rng) {
    stroke(ctx, [[0, 0.5], [0.2, -24]], { rng, w: 1.3, c: CW, a: 1 });
    const b = [[-6, -24], [7, -24], [11, -20.6], [7, -17], [-6, -17]];
    fillBoard(ctx, b);
    rub(ctx, b, CY, 0.16);
    hatch(ctx, b, { rng, ang: 0.3, sp: 1.6, w: 0.35, c: CY, a: 0.45 });
    stroke(ctx, b, { rng, closed: true, w: 0.85, c: CY, a: 1 });
    DOODLES.pumpkin && pumpkin(ctx, rng, 1.5, -18.6, 2.2, false);
    grassTufts(ctx, rng, -4, 3, 2);
  }

  /* ===================================================================================== sprite build */
  const SPR = {};
  const LAZY = [];
  function runLazy(ms) {
    const end = performance.now() + ms;
    while (LAZY.length && performance.now() < end) LAZY.shift()();
  }
  function buildSprites() {
    const BOIL = 3;
    // Jack
    const jw = [], ji = [];
    for (let i = 0; i < 4; i++) {
      jw[i] = [];
      for (let v = 0; v < BOIL; v++) {
        const by = -Math.abs(Math.cos((i / 4) * TAU)) * 1.0;
        jw[i][v] = mk(-12, -33, 12, 2, (c) => drawJack(c, i / 4, false, U.rng(100 + i * 7 + v * 31)), { halo: 1.0, flash: true, post: (c) => jackGlow(c, by) });
      }
    }
    for (let i = 0; i < 2; i++) {
      ji[i] = [];
      for (let v = 0; v < BOIL; v++) ji[i][v] = mk(-12, -33, 12, 2, (c) => drawJack(c, i * 0.5, true, U.rng(200 + i * 7 + v * 31)), { halo: 1.0, flash: true, post: (c) => jackGlow(c, i ? -0.45 : 0) });
    }
    const flipAll = (arr) => arr.map((fr) => fr.map(flipSpr));
    SPR.jack = { walk: [jw, flipAll(jw)], idle: [ji, flipAll(ji)] };
    // enemies
    const defs = {
      creeper: { box: [-12, -31, 12, 2], fn: drawCreeper, halo: 0.9, haloA: 0.9 },
      ghost: { box: [-13, -24, 13, 1.5], fn: drawGhost, halo: 0.8, haloA: 0.6 },
      colossus: { box: [-26, -59, 26, 2], fn: drawColossus, halo: 1.1, haloA: 0.9 },
    };
    for (const type in defs) {
      const d = defs[type];
      const fr = [], ff = [];
      const make = (i, v) => mk(d.box[0], d.box[1], d.box[2], d.box[3], (c) => d.fn(c, i, U.rng(300 + i * 13 + v * 41 + type.length * 101)), { halo: d.halo, haloA: d.haloA, flash: true });
      for (let i = 0; i < 4; i++) {
        const s = make(i, 0);
        fr[i] = [s]; ff[i] = [flipSpr(s)];
        // further line-boil variants are drawn in the background during the first frames
        for (let v = 1; v < BOIL; v++) LAZY.push(() => { const t = make(i, v); fr[i].push(t); ff[i].push(flipSpr(t)); });
      }
      SPR[type] = [fr, ff];
    }
    // projectiles, orbital, gems
    SPR.seed = [0, 1].map((v) => mk(-3.6, -2.2, 3.6, 2.2, (c) => drawSeed(c, U.rng(400 + v)), { pad: 0.8, halo: 0.6 }));
    SPR.trail = mk(-14, -2, 0, 2, (c) => drawTrail(c, U.rng(410)), { pad: 0.5, halo: 0 });
    SPR.lantern = [0, 1, 2].map((v) => mk(-7, -15, 7, 1, (c) => drawLantern(c, U.rng(420 + v)), { halo: 0.7, post: lanternGlow }));
    SPR.gem = [0, 1].map((v) => mk(-3, -7, 3, 1, (c) => drawGem(c, false, U.rng(430 + v)), { pad: 1, halo: 0.6 }));
    SPR.gemBig = [0, 1].map((v) => mk(-8, -14, 8, 2, (c) => drawGem(c, true, U.rng(440 + v)), { pad: 1, halo: 0.6 }));
    // shadows
    SPR.shJack = shadowSpr(7, 2.2); SPR.shCreeper = shadowSpr(7.5, 2.3); SPR.shGhost = shadowSpr(4.6, 1.4);
    SPR.shColossus = shadowSpr(17, 4.4); SPR.shGem = shadowSpr(2.4, 0.7); SPR.shTree = shadowSpr(16, 4);
    SPR.shSmall = shadowSpr(8, 2.2); SPR.shWide = shadowSpr(18, 2.6);
    // particles: dust puffs, crumbs, scribbles, star, ring, smear, eraser
    const dust = [0, 1, 2].map((v) => mk(-5, -5, 5, 5, (c) => {
      const r = U.rng(500 + v);
      for (let k = 0; k < 7; k++) {
        const x = R(-2.4, 2.4, r), y = R(-2.4, 2.4, r), rr = R(1.4, 2.8, r);
        const g = c.createRadialGradient(x, y, 0, x, y, rr);
        g.addColorStop(0, rgba(CW, 0.42)); g.addColorStop(1, rgba(CW, 0));
        c.fillStyle = g; c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      for (let k = 0; k < 18; k++) dot(c, R(-4.5, 4.5, r), R(-4.5, 4.5, r), R(0.15, 0.35, r), CW, 0.8);
    }, { pad: 0.3, halo: 0, grain: 0.7 }));
    SPR.dust = PALL.map((col, i) => (i === 0 ? dust : dust.map((s) => ({ c: U.tint(s.c, rgba(col, 1)), ax: s.ax, ay: s.ay }))));
    const crumb = mk(-1.6, -0.7, 1.6, 0.7, (c) => { c.fillStyle = rgba(CW, 1); c.beginPath(); c.moveTo(-1.5, -0.4); c.lineTo(1.3, -0.6); c.lineTo(1.5, 0.4); c.lineTo(-1.3, 0.6); c.closePath(); c.fill(); }, { pad: 0.2, halo: 0, grain: 0.6 });
    SPR.crumb = PALL.map((col) => ({ c: U.tint(crumb.c, rgba(col, 1)), ax: crumb.ax, ay: crumb.ay }));
    const scr = [0, 1, 2].map((v) => mk(-4, -4, 4, 4, (c) => {
      const r = U.rng(520 + v);
      if (v === 0) { for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + R(-0.2, 0.2, r); stroke(c, [[Math.cos(a) * 1.2, Math.sin(a) * 1.2], [Math.cos(a) * 3.6, Math.sin(a) * 3.6]], { rng: r, w: 0.55, c: CW, a: 1, dbl: false }); } }
      else if (v === 1) { const p = []; for (let k = 0; k < 7; k++) p.push([-3.4 + k * 1.1, k & 1 ? -1.4 : 1.4]); stroke(c, p, { rng: r, w: 0.55, c: CW, a: 1, dbl: false, step: 0.5 }); }
      else { const p = []; for (let i = 0; i < 26; i++) { const a = i * 0.7; p.push([Math.cos(a) * (1 + i * 0.1) + i * 0.08 - 1, Math.sin(a) * (1 + i * 0.1)]); } stroke(c, p, { rng: r, w: 0.45, c: CW, a: 1, dbl: false }); }
    }, { pad: 0.4, halo: 0, grain: 0.5 }));
    SPR.scrib = PALL.map((col, i) => (i === 0 ? scr : scr.map((s) => ({ c: U.tint(s.c, rgba(col, 1)), ax: s.ax, ay: s.ay }))));
    SPR.star = mk(-3.5, -3.5, 3.5, 3.5, (c) => { const r = U.rng(540); const p = starPts(0, 0, 3.2, 1.3, 5, 0); rub(c, p, CY, 0.5); stroke(c, p, { rng: r, closed: true, w: 0.6, c: CY, a: 1, step: 0.6 }); }, { pad: 0.4, halo: 0, grain: 0.5 });
    SPR.ring = mk(-13, -13, 13, 13, (c) => {
      const r = U.rng(550);
      stroke(c, ell(0, 0, 11.5, 11.5, 48), { rng: r, closed: true, w: 0.9, c: CY, a: 1 });
      stroke(c, ell(0, 0, 9.6, 9.6, 40), { rng: r, closed: true, w: 0.5, c: CO, a: 0.8, dbl: false });
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; stroke(c, [[Math.cos(a) * 12.4, Math.sin(a) * 12.4], [Math.cos(a) * 13.6, Math.sin(a) * 13.6]], { rng: r, w: 0.5, c: CY, a: 1, dbl: false, step: 0.4 }); }
    }, { pad: 0.5, halo: 0, grain: 0.6 });
    SPR.smear = [0, 1, 2].map((v) => mk(-12, -4, 12, 4, (c) => {
      const r = U.rng(560 + v);
      for (let k = 0; k < 9; k++) {
        const y = R(-2.6, 2.6, r), x0 = R(-11, -4, r), x1 = R(4, 11, r);
        c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y + R(-0.6, 0.6, r));
        c.lineWidth = R(0.6, 2.2, r); c.strokeStyle = rgba(CW, R(0.08, 0.2, r)); c.stroke();
      }
    }, { pad: 0.3, halo: 0, grain: 0.4 }));
    SPR.eraser = mk(-7.5, -3.6, 7.5, 3.6, (c) => {
      const r = U.rng(570);
      const top = [[-7, -3.4], [7, -3.4], [7, 0.2], [-7, 0.2]];
      c.fillStyle = rgba(CWD, 1); c.beginPath(); poly(c, top); c.fill();
      hatch(c, top, { rng: r, ang: 0.05, sp: 0.9, w: 0.35, c: [120, 82, 52], a: 0.9 });
      const felt = [[-7, 0.2], [7, 0.2], [6.6, 3.2], [-6.6, 3.2]];
      c.fillStyle = 'rgb(84,88,86)'; c.beginPath(); poly(c, felt); c.fill();
      hatch(c, felt, { rng: r, ang: 1.5, sp: 0.6, w: 0.25, c: CW, a: 0.35 });
      stroke(c, top.concat([[-7, 3.2]]), { rng: r, closed: false, w: 0.35, c: [60, 40, 26], a: 0.8, dbl: false });
    }, { pad: 0.4, halo: 0, grain: 0.25 });
    // doodles
    SPR.doodle = {};
    let ds = 600;
    for (const k in DOODLES) SPR.doodle[k] = [0, 1].map(() => { const s = ds++; return mk(-7, -7, 7, 7, (c) => DOODLES[k](c, U.rng(s)), { pad: 0.5, halo: 0, grain: 0.8 }); });
    // props
    const P = {};
    P.tree = [[CM, CG], [CO, CY], [CM, CY]].map((cc, v) => mk(-26, -72, 26, 3, (c) => artTree(c, U.rng(800 + v * 13), cc[0], cc[1]), { halo: 0.9, haloA: 0.82 }));
    P.dead = [0, 1].map((v) => mk(-24, -62, 24, 3, (c) => artDeadTree(c, U.rng(840 + v * 13)), { halo: 0.8, haloA: 0.75 }));
    P.grave = [0, 1, 2].map((v) => mk(-10, -21, 10, 2, (c) => artGrave(c, U.rng(870 + v * 5), v), { halo: 0.8, haloA: 0.88 }));
    P.fence = [0, 1].map((v) => mk(-19, -17, 19, 2, (c) => artFence(c, U.rng(890 + v * 5)), { halo: 0.7, haloA: 0.85 }));
    P.scare = [mk(-17, -48, 17, 2, (c) => artScarecrow(c, U.rng(910)), { halo: 0.8, haloA: 0.85 })];
    P.pump = [0, 1, 2].map((v) => mk(-12, -15, 12, 2, (c) => artPumpkins(c, U.rng(930 + v), v), { halo: 0.8, haloA: 0.9 }));
    P.sign = [mk(-10, -27, 13, 2, (c) => artSign(c, U.rng(950)), { halo: 0.8, haloA: 0.85 })];
    P.sign.push(flipSpr(P.sign[0]));
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
    while (LAZY.length) { LAZY.shift()(); yield; }
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
        const tx = (gpx + px) & 511, ti = tRow + tx, t4 = ti * 4;
        const gm = GR[gRow + ((gpx + px) & 255)] * 0.0039216;
        const bt = BT[ti] * 0.6 + BT[bRow2 + ((((gpx + px) >> 1) + 91) & 511)] * 0.6;
        const hz = (H - 0.5) * 22 + bt;
        let br = B0 + hz * 0.9, bg = B1 + hz, bb = B2 + hz * 0.95;
        let a = 0, cr = 0, cg = 0, cb = 0, la = 0, lr = CW[0], lg = CW[1], lb = CW[2];
        if (dR < 0) {
          // ---- path: dusty rubbed band, dotted borders, sparse stipple
          const dep = -dR;
          br += 6; bg += 6; bb += 6;
          const sa = STIP[t4 + 3];
          if (sa > 0) {
            let v = (0.62 - Math.abs(dep - 1.3)) * res * 0.9 + 0.5;
            v = v < 0 ? 0 : v > 1 ? 1 : v;
            if (STIP[t4] < 40 && dep > 3.2) v = v > 0.55 ? v : 0.55;
            a = (sa / 255) * v * (0.45 + 0.55 * gm);
            cr = CW[0]; cg = CW[1]; cb = CW[2];
          }
        } else if (dR >= GAP) {
          const wob = g[q00 + 6] * w00 + g[q10 + 6] * w10 + g[q01 + 6] * w01 + g[q11 + 6] * w11;
          const d1 = g[q00 + 1] * w00 + g[q10 + 1] * w10 + g[q01 + 1] * w01 + g[q11 + 1] * w11 + wob;
          const d2 = g[q00 + 2] * w00 + g[q10 + 2] * w10 + g[q01 + 2] * w01 + g[q11 + 2] * w11 + wob;
          const T = g[q00 + 4] * w00 + g[q10 + 4] * w10 + g[q01 + 4] * w01 + g[q11 + 4] * w11;
          const ad1 = d1 < 0 ? -d1 : d1, ad2 = d2 < 0 ? -d2 : d2;
          let near = ad1 < ad2 ? ad1 : ad2;
          let lineV = (LW - near) * res + 0.5;
          let fade = near - LW - 0.9;
          if (dR - GAP < fade) fade = dR - GAP;
          let tex = null, rc = CM, dk = 0.05, gk = 1;
          if (d1 < 0) { tex = FOREST; rc = CL; dk = 0.07; }
          else if (d2 > 0) {
            const X = wx + (px + 0.5) * ipx;
            U.worley(X / 82, Y / 82, 61, 0, WO);
            const e = (WO.f2 - WO.f1) * 41;
            const pl = (0.42 - e) * res + 0.5;
            if (pl > 0) { const v = (pl > 1 ? 1 : pl) * 0.62; if (v > la) { la = v; lr = CY[0]; lg = CY[1]; lb = CY[2]; } }
            if (e - 1.5 < fade) fade = e - 1.5;
            const pid = WO.id % 5;
            tex = FIELD[pid < 2 ? 0 : pid < 4 ? 1 : 2];
            rc = pid < 2 ? CO : CY; dk = 0.05;
          } else {
            const dF = g[q00 + 3] * w00 + g[q10 + 3] * w10 + g[q01 + 3] * w01 + g[q11 + 3] * w11 + wob;
            const adF = dF < 0 ? -dF : dF;
            if (dF > 0) { tex = FROST; rc = CB; dk = 0.08; gk = 0.45; } else tex = MEADOW;
            const lf = (LW - adF) * res + 0.5;
            if (lf > lineV) lineV = lf;
            if (adF - LW - 0.9 < fade) fade = adF - LW - 0.9;
          }
          fade = fade * 0.6;
          fade = fade < 0 ? 0 : fade > 1 ? 1 : fade;
          // region dust tint
          const dt = dk * fade;
          br += (rc[0] - br) * dt; bg += (rc[1] - bg) * dt; bb += (rc[2] - bb) * dt;
          let ta = tex[t4 + 3];
          if (tex === FOREST) {
            const tb = FOREST2[t4 + 3] * sm(0.4, 0.62, T);
            if (tb > ta) { ta = tb; tex = FOREST2; }
          }
          if (ta > 0) {
            const dens = 0.32 + 0.68 * sm(0.28, 0.72, T);
            a = (ta / 255) * dens * fade * (1 - gk + gk * gm);
            cr = tex[t4]; cg = tex[t4 + 1]; cb = tex[t4 + 2];
          }
          if (lineV > 0) {
            const v = (lineV > 1 ? 1 : lineV) * 0.8 * (0.3 + 0.7 * gm);
            if (v > la) { la = v; lr = CW[0]; lg = CW[1]; lb = CW[2]; }
          }
        }
        let r = br + (cr - br) * a, gg = bg + (cg - bg) * a, b = bb + (cb - bb) * a;
        if (la > 0) { r += (lr - r) * la; gg += (lg - gg) * la; b += (lb - b) * la; }
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
  const WORDS = ['Buh!', 'Mitternacht', 'Rüben!', 'Huhu…', 'Kürbis!', 'Psst!', '22 Uhr', 'Achtung!'];
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
    // old eraser swipes (wide faint arcs)
    const sw = [];
    G.scatter(info, 300, 515, 160, (x, y, rng) => { sw.push([x, y, rng]); });
    for (const [x, y, rng] of sw) {
      if (rng.next() > 0.6) continue;
      const rad = R(60, 140, rng), a0 = rng.next() * TAU, span = R(0.6, 1.3, rng), lw = R(14, 26, rng);
      const cx = x - Math.cos(a0 + span / 2) * rad, cy = y - Math.sin(a0 + span / 2) * rad;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath(); ctx.arc(cx, cy, rad + J(3, rng), a0, a0 + span);
        ctx.lineWidth = lw * (0.55 + 0.25 * k); ctx.strokeStyle = 'rgba(205,222,212,0.026)'; ctx.stroke();
      }
      for (let k = 0; k < 8; k++) {
        const rr = rad + R(-lw / 2, lw / 2, rng);
        ctx.beginPath(); ctx.arc(cx, cy, rr, a0 + R(0, 0.15, rng), a0 + span - R(0, 0.2, rng));
        ctx.lineWidth = R(0.4, 1.2, rng); ctx.strokeStyle = 'rgba(215,230,220,0.045)'; ctx.stroke();
      }
      yield;
    }
    yield;
    // doodles
    const pts = [];
    G.scatter(info, 66, 717, 10, (x, y, rng) => { if (rng.next() < 0.3) pts.push([x, y, rng]); });
    let n = 0;
    for (const [x, y, rng] of pts) {
      if (G.nearSpawn(x, y, 40)) continue;
      const m = matAt(x, y);
      if (m.dR < 6 || m.edge < 7) continue;
      const set = DOODLE_SETS[m.mat];
      const key = set[(rng.next() * set.length) | 0];
      const s = SPR.doodle[key][rng.next() < 0.5 ? 0 : 1];
      stamp(ctx, s, x, y, R(0.9, 1.35, rng), J(0.35, rng), R(0.5, 0.72, rng));
      if ((++n & 7) === 7) yield;
    }
    yield;
    // handwritten words (fully inside this chunk only, so no seams)
    if (fontOK('Rock Salt')) {
      G.scatterOwned(info, 330, 818, (x, y, rng) => {
        if (rng.next() > 0.85) return;
        if (x < x0 + 50 || x > x0 + 206 || y < y0 + 20 || y > y0 + 236) return;
        if (G.nearSpawn(x, y, 60)) return;
        const m = matAt(x, y);
        if (m.dR < 8 || m.edge < 6) return;
        const i = (rng.next() * WORDS.length) | 0;
        stamp(ctx, wordSpr(i), x, y, 1, J(0.18, rng), 0.62);
      });
    }
    yield;
    // pebbles on paths
    const pb = [];
    G.scatter(info, 15, 919, 3, (x, y, rng) => { if (rng.next() < 0.45) pb.push([x, y, rng]); });
    n = 0;
    for (const [x, y, rng] of pb) {
      if (roadAt(x, y) > -3.4) continue;
      const r = R(0.7, 1.5, rng);
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r * 0.85, J(0.6, rng), 0, TAU);
      if (rng.next() < 0.4) { ctx.fillStyle = 'rgba(230,232,224,0.32)'; ctx.fill(); }
      ctx.lineWidth = 0.4; ctx.strokeStyle = 'rgba(232,234,226,0.62)'; ctx.stroke();
      if ((++n & 31) === 31) yield;
    }
  }

  /* ---------- props ---------- */
  function propsFor(info) {
    const out = [];
    const P = SPR.props;
    G.scatterOwned(info, 60, 9001, (x, y, rng) => {
      if (G.nearSpawn(x, y, 95)) return;
      const r = rng.next();
      if (r > 0.3) return;
      const m = matAt(x, y);
      if (m.dR < 12) return;
      const pick = (arr) => arr[(rng.next() * arr.length) | 0];
      let spr = null, sh = SPR.shSmall, pad = 40;
      if (m.mat === 'forest') {
        if (r < 0.22) { spr = rng.next() < 0.72 ? pick(P.tree) : pick(P.dead); sh = SPR.shTree; pad = 90; }
        else if (r < 0.26) spr = pick(P.grave);
      } else if (m.mat === 'field') {
        if (r < 0.025) { spr = P.scare[0]; pad = 60; }
        else if (r < 0.09) spr = pick(P.pump);
        else if (r < 0.11) { spr = pick(P.fence); sh = SPR.shWide; }
      } else if (m.mat === 'frost') {
        if (r < 0.04) { spr = pick(P.dead); sh = SPR.shTree; pad = 80; }
        else if (r < 0.07) spr = pick(P.grave);
      } else {
        if (r < 0.025) { spr = pick(P.tree); sh = SPR.shTree; pad = 90; }
        else if (r < 0.06) {
          spr = pick(P.grave);
          const k = 1 + ((rng.next() * 2) | 0);
          for (let i = 0; i < k; i++) out.push({ x: x + R(-18, 18, rng), y: y + R(-12, 12, rng), spr: pick(P.grave), sh: SPR.shSmall, pad: 40 });
        } else if (r < 0.08) spr = pick(P.pump);
        else if (r < 0.088) spr = pick(P.sign);
      }
      if (spr) out.push({ x, y, spr, sh, pad });
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
        ctx.save(); ctx.translate(50, 86); ctx.scale(5.4, 5.4);
        lanternGlow(ctx);
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
      const k = view.W / (cv.clientWidth || view.W);
      clockRect = { x: (r.left + r.width / 2) * k, y: r.top * k, k };
    }
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
  const boil = (rt, seed) => Math.floor(rt * 7 + seed * 3) % 3;

  /* ===================================================================================== effects state */
  const SMEARS = [];
  let lastGameTime = 0;
  function addSmear(x, y, s, col, t) {
    if (SMEARS.length > 60) SMEARS.shift();
    SMEARS.push({ x, y, s, col, born: t, life: 2.6, v: (Math.random() * 3) | 0, flip: Math.random() < 0.5 });
  }
  const SMEARC = {};
  function smearSpr(v, col) {
    const key = v + ':' + col;
    if (!SMEARC[key]) { const s = SPR.smear[v]; SMEARC[key] = { c: col === 0 ? s.c : U.tint(s.c, rgba(PALL[col], 1)), ax: s.ax, ay: s.ay }; }
    return SMEARC[key];
  }
  const ENEMY_COL = { creeper: [2, 0, 3], ghost: [0, 6, 0], colossus: [2, 5, 1, 3] };
  const pickCol = (arr) => arr[(Math.random() * arr.length) | 0];
  let hurtAt = -1e9;

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
    description: 'Live mit Kreide auf die Schultafel gezeichnet: Pastellkreiden, Schraffuren, Schwamm-Wischer und Kritzeleien – ein Halloween-Tafelbild.',
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
      const t0 = performance.now();
      buildTextures(Math.max(1, Math.round(256 * gres)) / 256);
      buildSprites();
      runLazy(560 - (performance.now() - t0));
      if (document.fonts && document.fonts.load) {
        for (const f of ['700 20px "Cabin Sketch"', '20px "Rock Salt"', '20px "Fredericka the Great"', '20px "Architects Daughter"']) document.fonts.load(f).catch(() => {});
      }
    },

    renderGroundChunk(ctx, info) { return renderGround(ctx, info); },
    propsForChunk(info) { return propsFor(info); },

    drawProp(ctx, p, view) { base(view); blit(ctx, p.spr, p.x, p.y); },

    drawShadow(ctx, o, view) {
      base(view);
      if (o.kind === 'prop') { if (o.sh) blit(ctx, o.sh, o.x, o.y); return; }
      if (o.kind === 'enemy') {
        if (o.dying) return;
        const sh = o.type === 'ghost' ? SPR.shGhost : o.type === 'colossus' ? SPR.shColossus : SPR.shCreeper;
        if (o.spawnT < 1) { const s = 0.3 + 0.7 * o.spawnT; blitS(ctx, sh, o.x, o.y, s, s); return; }
        blit(ctx, sh, o.x, o.y + 0.5);
        return;
      }
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
        ctx.globalAlpha = Math.min(1, age * 8) * (1 - age / s.life) * 0.85;
        const sp = smearSpr(s.v, s.col);
        blitS(ctx, sp, s.x, s.y, s.s * (s.flip ? -1 : 1), s.s * 0.8);
      }
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      base(view);
      const fr = Math.floor(view.rt * 5 + g.seed * 8) & 1;
      const bob = Math.sin(view.rt * 3 + g.seed * 20) * 0.7;
      blit(ctx, SPR.shGem, g.x, g.y + 0.6);
      const spr = g.big ? SPR.gemBig[fr] : SPR.gem[fr];
      if (g.pop > 0) { const s = 1 + g.pop * 0.6; blitS(ctx, spr, g.x, g.y - g.pop * 4, s, s); }
      else blit(ctx, spr, g.x, g.y - 0.5 + bob);
    },

    drawEnemy(ctx, e, view) {
      base(view);
      const set = SPR[e.type];
      if (!set) return;
      const fi = e.facing < 0 ? 1 : 0;
      let fr;
      if (e.type === 'ghost') fr = Math.floor(view.rt * 5 + e.seed * 9) & 3;
      else if (e.type === 'colossus') fr = Math.floor(e.anim * 2.4) & 3;
      else fr = Math.floor(e.anim * 3.2) & 3;
      const arr = set[fi][fr];
      const s = arr[boil(view.rt, e.seed) % arr.length];
      let y = e.y;
      if (e.type === 'ghost') y -= 2.2 + Math.sin(view.rt * 3.1 + e.seed * 20) * 1.1;
      const k = 1 / K, w = s.c.width, h = s.c.height;
      if (e.dying) {
        // wiped away with an eraser
        const u = e.deathT, dir = e.seed < 0.5 ? 1 : -1;
        const dx = e.x - s.ax * k, dy = y - s.ay * k;
        const sx = 1 + u * 0.9;
        ctx.globalAlpha = 0.45 * (1 - u);
        ctx.drawImage(s.ch, dir > 0 ? dx : dx - w * k * (sx - 1), dy + h * k * 0.04, w * k * sx, h * k * 0.96);
        const cut = Math.round(w * U.clamp(u * 1.2, 0, 1));
        ctx.globalAlpha = 1;
        if (cut < w) {
          if (dir > 0) ctx.drawImage(s.c, cut, 0, w - cut, h, dx + cut * k, dy, (w - cut) * k, h * k);
          else ctx.drawImage(s.c, 0, 0, w - cut, h, dx, dy, (w - cut) * k, h * k);
        }
        const big = e.type === 'colossus' ? 1.5 : e.type === 'ghost' ? 0.7 : 0.85;
        if (u < 0.92) {
          const ex = dir > 0 ? dx + cut * k : dx + (w - cut) * k;
          blitRot(ctx, SPR.eraser, ex, y - e.r * (e.type === 'colossus' ? 1.5 : 1.1), dir * (0.35 + Math.sin(u * 20) * 0.08) + Math.PI / 2 * dir, big);
        }
        return;
      }
      if (e.spawnT < 1) {
        // drawn onto the board, top to bottom, chalk tip visible
        const t = e.spawnT, q = U.ease.outQuad(t);
        const rows = Math.max(1, Math.round(h * q));
        const dx = e.x - s.ax * k, dy = y - s.ay * k;
        ctx.drawImage(s.c, 0, 0, w, rows, dx, dy, w * k, rows * k);
        const tx = dx + (0.5 + 0.4 * Math.sin(t * 40 + e.seed * 9)) * w * k, ty = dy + rows * k;
        ctx.fillStyle = 'rgba(245,245,236,0.95)';
        ctx.fillRect(tx - 0.8, ty - 0.8, 1.6, 1.6);
        return;
      }
      if (e.type === 'ghost') ctx.globalAlpha = 0.9;
      blit(ctx, s, e.x, y);
      if (e.flash > 0 && s.f) {
        ctx.globalAlpha = Math.min(0.75, e.flash * (e.type === 'colossus' ? 0.6 : 0.85));
        blitC(ctx, s.f, s, e.x, y);
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      base(view);
      const rt = view.rt;
      const fi = p.facing < 0 ? 1 : 0;
      const v = boil(rt, 0.3);
      const s = p.moving ? SPR.jack.walk[fi][Math.floor(p.anim * 1.25) & 3][v] : SPR.jack.idle[fi][Math.floor(rt * 2.2) & 1][v];
      if (p.levelT > 0) {
        ctx.globalAlpha = Math.min(1, p.levelT * 2);
        blitRot(ctx, SPR.ring, p.x, p.y - 15, rt * 0.7, 1.2 + (1 - p.levelT) * 0.6);
        ctx.globalAlpha = 1;
      }
      if (p.dashT > 0) {
        const kk = p.dashT / 0.2;
        for (let i = 2; i >= 1; i--) {
          ctx.globalAlpha = 0.4 * kk / i;
          blitC(ctx, s.ch, s, p.x - p.dashX * i * 7, p.y - p.dashY * i * 7);
        }
        ctx.globalAlpha = 1;
      }
      const since = (performance.now() - hurtAt) / 1000;
      const blink = p.iframes > 0 && since < 0.9 && (Math.floor(since * 14) & 1) === 1;
      ctx.globalAlpha = blink ? 0.5 : 1;
      blit(ctx, s, p.x, p.y);
      if (p.hurtT > 0 && s.f) {
        ctx.globalAlpha = Math.min(0.7, p.hurtT * 0.9);
        blitC(ctx, s.f, s, p.x, p.y);
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      base(view);
      const v = (Math.floor(view.rt * 7) + o.idx) % 3;
      blit(ctx, SPR.lantern[v], o.x, o.y + 2 + Math.sin(view.rt * 4 + o.idx) * 0.6);
    },

    drawProjectile(ctx, pr, view) {
      base(view);
      const a = Math.atan2(pr.vy, pr.vx);
      const k = Math.min(1, pr.age * 8);
      ctx.globalAlpha = 0.85;
      blitRot(ctx, SPR.trail, pr.x, pr.y, a, 0.4 + 0.6 * k);
      ctx.globalAlpha = 1;
      blitRot(ctx, SPR.seed[Math.floor(pr.spin) & 1], pr.x, pr.y, a + Math.sin(pr.spin) * 0.35, 1);
    },

    drawParticle(ctx, pt, view) {
      base(view);
      const life = pt.life / pt.max, age = 1 - life;
      const c = pt.c | 0;
      switch (pt.kind) {
        case 'dust': {
          const s = pt.size * (0.5 + U.ease.outQuad(age) * 1.1);
          ctx.globalAlpha = Math.min(1, life * 1.4) * 0.9;
          blitS(ctx, SPR.dust[c][(pt.seed * 3) | 0], pt.x, pt.y - pt.z, s, s);
          break;
        }
        case 'crumb': {
          ctx.globalAlpha = life < 0.3 ? life / 0.3 : 1;
          blitRot(ctx, SPR.crumb[c], pt.x, pt.y - pt.z, pt.rot, pt.size);
          break;
        }
        case 'scrib': {
          const s = pt.size * (0.6 + 0.6 * Math.min(1, age * 4));
          ctx.globalAlpha = age > 0.5 ? (1 - age) * 2 : 1;
          blitRot(ctx, SPR.scrib[c][(pt.seed * 3) | 0], pt.x, pt.y - pt.z, pt.rot, s);
          break;
        }
        case 'star': {
          const s = pt.size * (age < 0.2 ? age / 0.2 : 1 - (age - 0.2) * 0.7);
          blitRot(ctx, SPR.star, pt.x, pt.y - pt.z, pt.rot, s);
          break;
        }
        case 'ring': {
          const s = pt.size * (0.4 + U.ease.outQuad(age) * 1.2);
          ctx.globalAlpha = life < 0.4 ? life / 0.4 : 1;
          blitRot(ctx, SPR.ring, pt.x, pt.y - pt.z, pt.rot, s);
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
      const k = age < 0.08 ? 0.6 + (age / 0.08) * 0.4 : 1;
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

    /* ---------- hooks ---------- */
    onHit(game, e, src) {
      const y = e.y - e.r * (e.type === 'colossus' ? 1.6 : 1.2);
      game.addParticle({ x: e.x, y, z: 0, kind: 'scrib', c: src === 'lantern' ? 4 : 0, life: 0.22, size: e.type === 'colossus' ? 1.3 : 0.8, rot: Math.random() * TAU, drag: 0 });
      const cols = ENEMY_COL[e.type] || [0];
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * TAU, s = 30 + Math.random() * 40;
        game.addParticle({ x: e.x, y: e.y, z: e.r * 1.2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 20 + Math.random() * 30, grav: 160, kind: 'crumb', c: pickCol(cols), life: 0.5, size: 0.7 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, drag: 1.5 });
      }
    },
    onKill(game, e) {
      const big = e.type === 'colossus';
      const cols = ENEMY_COL[e.type] || [0];
      const nd = big ? 7 : 3;
      for (let i = 0; i < nd; i++) {
        const a = Math.random() * TAU, s = 10 + Math.random() * (big ? 30 : 18);
        game.addParticle({ x: e.x + (Math.random() - 0.5) * e.r, y: e.y, z: e.r * (0.4 + Math.random() * 1.2), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 6 + Math.random() * 10, kind: 'dust', c: i === 0 ? 0 : pickCol(cols), life: 0.7 + Math.random() * 0.4, size: (big ? 2.2 : 1.2) + Math.random() * 0.6, drag: 2.5 });
      }
      const nc = big ? 12 : e.type === 'ghost' ? 4 : 6;
      for (let i = 0; i < nc; i++) {
        const a = Math.random() * TAU, s = (big ? 60 : 40) + Math.random() * 50;
        game.addParticle({ x: e.x, y: e.y, z: e.r * (0.6 + Math.random()), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 50, grav: 220, kind: 'crumb', c: pickCol(cols), life: 0.6 + Math.random() * 0.4, size: (big ? 1.2 : 0.8) + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 18, drag: 1.2 });
      }
      addSmear(e.x, e.y - (big ? 4 : 1), big ? 1.8 : e.type === 'ghost' ? 0.7 : 1.0, pickCol(cols), game.time);
    },
    onHurt(game, p) {
      hurtAt = performance.now();
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'scrib', c: 1, life: 0.3, size: 1.6, rot: Math.random() * TAU, drag: 0 });
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * TAU, s = 40 + Math.random() * 50;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 40, grav: 200, kind: 'crumb', c: i & 1 ? 1 : 0, life: 0.6, size: 0.8 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, drag: 1.2 });
      }
    },
    onPickup(game, g) {
      const p = game.player;
      game.addParticle({ x: p.x + (Math.random() - 0.5) * 8, y: p.y - 12 - Math.random() * 8, z: 0, vy: -20, kind: 'star', life: 0.35, size: g.big ? 1.5 : 0.8, rot: Math.random(), drag: 3 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.4) game.addParticle({ x: pr.x, y: pr.y + 3, z: 0, vx: pr.vx * 0.05, vy: pr.vy * 0.05, kind: 'dust', c: 0, life: 0.3, size: 0.55, drag: 4 });
    },
    onDash(game, p) {
      for (let i = 0; i < 4; i++) game.addParticle({ x: p.x - p.dashX * i * 5, y: p.y - p.dashY * i * 5, z: 1, vx: -p.dashX * 20, vy: -p.dashY * 20, kind: 'dust', c: i & 1 ? 1 : 0, life: 0.45, size: 1.2 - i * 0.15, drag: 3 });
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y - 14, z: 0, kind: 'ring', life: 0.7, size: 1.6, rot: 0, drag: 0 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        game.addParticle({ x: p.x, y: p.y - 14, z: 0, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, kind: 'star', life: 0.6, size: 1.0, rot: a, drag: 3 });
      }
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
