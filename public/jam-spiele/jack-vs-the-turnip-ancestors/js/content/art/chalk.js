/* Native art for the new enemies / upgrades in the 'chalk' world (Kreidetafel) – see js/content/ART_API.md.
   Everything is drawn with the same chalk toolkit as js/styles/chalk.js (copied here – its closure is private):
   broken chalk strokes with a lighter double pass, loose hatching clipped to shapes, rubbed-in fills, grain knocked
   out of every sprite and a board-coloured "eraser halo" around it. Sprites are pre-rendered at 2.5 px per world unit
   with 3 line-boil variants (the extra variants are drawn lazily in the background during the first frames). */
(function () {
  'use strict';
  const U = window.U, C = window.Content;
  const TAU = Math.PI * 2;

  /* ===================================================================================== palette (from chalk.js) */
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
  // new chalk sticks for the new family members
  const CTX = [200, 244, 102];  // toxic lime (spitter juice)
  const CR = [240, 98, 112];    // beetroot red (bomber)
  const CRD = [176, 52, 86];    // dark beet
  const CHOT = [255, 84, 64];   // hot red (charger eyes)
  const CPS = [222, 200, 160];  // parsnip
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';

  const K = 2.5; // sprite px per world unit (same as the style)
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
  function spiralPts(cx, cy, r0, turns, n, a0, dir) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = (a0 || 0) + (dir || 1) * t * turns * TAU, r = r0 * (1 - t * 0.85);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }

  /* ===================================================================================== chalk toolkit (from chalk.js) */
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
  function clipTo(ctx, pts) { ctx.save(); ctx.beginPath(); poly(ctx, pts); ctx.clip(); }
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
  function heartPts(cx, cy, s) {
    const p = [];
    for (let i = 0; i < 32; i++) { const t = (i / 32) * TAU; p.push([cx + s * 16 * Math.pow(Math.sin(t), 3), cy - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
    return p;
  }
  /** The style's chalk pumpkin (ribs, stem, optional carved face). */
  function pumpkin(ctx, rng, cx, cy, r, face, fillA, faceCol) {
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
      const fc = faceCol || CY;
      const eyes = [-1, 1].map((s) => [[cx + s * r * 0.36 - r * 0.17, cy - ry * 1.1], [cx + s * r * 0.36 + r * 0.17, cy - ry * 1.1], [cx + s * r * 0.36, cy - ry * 1.45]]);
      const mouth = [[cx - r * 0.5, cy - ry * 0.75], [cx - r * 0.2, cy - ry * 0.6], [cx, cy - ry * 0.75], [cx + r * 0.2, cy - ry * 0.6], [cx + r * 0.5, cy - ry * 0.75], [cx + r * 0.25, cy - ry * 0.4], [cx - r * 0.25, cy - ry * 0.4]];
      for (const e of eyes) { fillBoard(ctx, e); rub(ctx, e, fc, face === 'dark' ? 0.25 : 1); }
      fillBoard(ctx, mouth); rub(ctx, mouth, fc, face === 'dark' ? 0.25 : 1);
    }
  }

  /* ===================================================================================== grain + sprite pipeline */
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
    if (!GRAIN) buildGrain();
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
  let mkSeed = 300;
  /** Offscreen chalk sprite for world rect [x0,x1]x[y0,y1] around the feet; board halo + optional flash copy. */
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
    applyGrain(a, w, h, opt.grain === undefined ? 1 : opt.grain, mkSeed++);
    const out = { c: A.c, ax, ay, ch: A.c };
    if (opt.halo !== 0) {
      // board-coloured silhouette (no pixel readback), stamped around in a ring = eraser halo
      const M = U.canvas(w, h);
      M.ctx.drawImage(A.c, 0, 0); M.ctx.drawImage(A.c, 0, 0); M.ctx.drawImage(A.c, 0, 0);
      M.ctx.globalCompositeOperation = 'source-in';
      M.ctx.fillStyle = cBoard; M.ctx.fillRect(0, 0, w, h);
      const D = U.canvas(w, h);
      const r = (opt.halo || 1) * K;
      for (let k = 0; k < 10; k++) {
        const an = (k / 10) * TAU;
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
    if (opt.flash) out.f = U.tint(A.c, '#ffffff', 0.6);
    if (opt.hot) out.hot = U.tint(A.c, opt.hot, 0.62);
    return out;
  }
  function flipSpr(s) {
    const w = s.c.width, c = U.flipX(s.c);
    return { c, ax: w - s.ax, ay: s.ay, ch: s.ch === s.c ? c : U.flipX(s.ch), f: s.f ? U.flipX(s.f) : null, hot: s.hot ? U.flipX(s.hot) : null };
  }
  /** soft chalk-dust halo (pre-rendered, drawn with low alpha – no per-frame gradients) */
  function dustGlow(col, r, a) {
    return mk(-r, -r, r, r, (c) => {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, rgba(col, a)); g.addColorStop(0.45, rgba(col, a * 0.45)); g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
    }, { pad: 0, halo: 0, grain: 0.55 });
  }

  /* ===================================================================================== the new family */
  /* ---------- Rüben-Spucker: squat mottled turnip with a cannon snout (facing right) ---------- */
  function spitterGeo(swell, rec) {
    const k = 1 + swell * 0.2;
    return { k, rx: 7.7 * k, ry: 7.0 * k * (1 - rec * 0.1), ox: -rec * 1.4, oy: -11.6 - swell * 0.9 };
  }
  function drawSpitter(ctx, o, rng) {
    const ph = o.ph, sw = Math.sin(ph * TAU), swell = o.swell || 0, rec = o.rec || 0;
    const still = swell > 0 || rec > 0;
    const bob = still ? 0 : -Math.abs(Math.cos(ph * TAU)) * 0.8;
    // root legs (planted wide while aiming)
    for (const s of [-1, 1]) {
      const lift = still ? 0 : Math.max(0, -sw * s) * 1.4;
      const fx = s * (still ? 3.6 : 2.9) + (still ? 0 : sw * s * 1.6);
      stroke(ctx, [[s * 2.4, -5 + bob], [s * 2.8 + (still ? s * 0.6 : sw * s * 0.8), -2.4 - lift * 0.5], [fx, -lift]], { rng, w: 0.95, c: CC, a: 0.95 });
      stroke(ctx, [[fx, -lift], [fx + s * 1.2, 0.2 - lift]], { rng, w: 0.6, c: CC, a: 0.8, dbl: false });
    }
    const G = spitterGeo(swell, rec);
    ctx.save();
    ctx.translate(G.ox, G.oy + bob);
    ctx.rotate(still ? -rec * 0.14 : sw * 0.07);
    const rx = G.rx, ry = G.ry;
    // swept-back spiky leaves (behind the bulb)
    leaf(ctx, rng, -1.5, -ry + 1.2, -Math.PI / 2 - 1.05, 7.2, 1.6, CG);
    leaf(ctx, rng, -0.6, -ry + 0.8, -Math.PI / 2 - 0.62, 8.2, 1.7, CM);
    leaf(ctx, rng, 0.6, -ry + 0.8, -Math.PI / 2 - 0.18, 6.8, 1.6, CTX);
    const bulb = spl([[0, -ry], [rx * 0.72, -ry * 0.8], [rx, -0.6], [rx * 0.86, ry * 0.55], [rx * 0.42, ry * 0.92], [0, ry + 0.6], [-rx * 0.42, ry * 0.92], [-rx * 0.86, ry * 0.55], [-rx, -0.6], [-rx * 0.72, -ry * 0.8]], 4, true);
    fillBoard(ctx, bulb);
    rub(ctx, bulb, CC, 0.18);
    stroke(ctx, spl([[0, ry], [-0.8, ry + 1.8], [-2.2, ry + 2.6]], 3), { rng, w: 0.6, c: CC, a: 0.8, dbl: false });
    clipTo(ctx, bulb);
    const wave = [[-rx - 2, -ry - 2], [rx + 2, -ry - 2], [rx + 2, 0.4], [rx * 0.66, 1.2], [rx * 0.33, 0.1], [0, 1.2], [-rx * 0.33, 0.1], [-rx * 0.66, 1.2], [-rx - 2, 0.4]];
    rub(ctx, wave, CL, 0.55);
    hatch(ctx, wave, { rng, ang: -0.8, sp: 1.2, w: 0.45, c: CL, a: 0.9 });
    const low = [[-rx - 2, 0], [rx + 2, 0], [rx + 2, ry + 2], [-rx - 2, ry + 2]];
    hatch(ctx, low, { rng, ang: 0.7, sp: 1.8, w: 0.4, c: CW, a: 0.5, skip: 0.15 });
    // toxic mottles
    for (const [mx, my, mr] of [[-4.6, -3.2, 1.7], [-1.4, -5.2, 1.2], [-5.2, 2.6, 1.3], [-1.8, 4.4, 1.6], [2.4, 5.2, 1.0], [-3.2, -0.4, 0.9]]) {
      const b = ell(mx * G.k, my * G.k, mr * G.k, mr * 0.8 * G.k, 12, rng.next());
      rub(ctx, b, CTX, 0.5);
      hatch(ctx, b, { rng, ang: 0.4, sp: 0.8, w: 0.35, c: CTX, a: 0.9 });
    }
    // puffed cheeks while aiming
    if (swell > 0) softRub(ctx, ell(rx * 0.42, ry * 0.25, 3.6 * G.k, 3 * G.k, 16), CTX, rx * 0.42, ry * 0.25, 3.8 * G.k, 0.25 + swell * 0.45, 0);
    ctx.restore();
    stroke(ctx, [[-rx, -0.4], [-rx * 0.66, 1.2], [-rx * 0.33, 0.1], [0, 1.2], [rx * 0.33, 0.1]], { rng, w: 0.55, c: CL, a: 0.9, dbl: false });
    stroke(ctx, bulb, { rng, closed: true, w: 0.95, c: CW, a: 1 });
    stroke(ctx, spl([[-rx * 0.85, -ry * 0.5], [-rx * 0.6, -ry * 0.85], [0, -ry], [rx * 0.6, -ry * 0.85], [rx * 0.85, -ry * 0.5]], 3), { rng, w: 0.9, c: CL, a: 0.9, dbl: false });
    // cannon snout (sticks out in front)
    const ty = 1.6 * G.k, tx0 = rx * 0.55, tx1 = rx + 4.4 + swell * 0.6, th = 2.0 + swell * 0.5;
    const tube = [[tx0, ty - th], [tx1 - 0.6, ty - th - 0.5], [tx1 - 0.6, ty + th + 0.5], [tx0, ty + th]];
    fillBoard(ctx, tube);
    rub(ctx, tube, CC, 0.22);
    hatch(ctx, tube, { rng, ang: 1.3, sp: 1.0, w: 0.4, c: CTX, a: 0.75 });
    stroke(ctx, [[tx0 + 0.6, ty - th], [tx1 - 0.6, ty - th - 0.5]], { rng, w: 0.8, c: CW, a: 1, dbl: false });
    stroke(ctx, [[tx0 + 0.6, ty + th], [tx1 - 0.6, ty + th + 0.5]], { rng, w: 0.8, c: CW, a: 1, dbl: false });
    for (const f of [0.35, 0.65]) stroke(ctx, [[tx0 + (tx1 - tx0) * f, ty - th - 0.2], [tx0 + (tx1 - tx0) * f + 0.3, ty + th + 0.2]], { rng, w: 0.4, c: CTX, a: 0.8, dbl: false });
    // puckered mouth ring
    const mrx = 1.35 + swell * 0.35, mry = th + 0.9;
    const ring = ell(tx1, ty, mrx, mry, 16);
    fillBoard(ctx, ring);
    rub(ctx, ell(tx1 + 0.2, ty, mrx * 0.6, mry * 0.62, 12), swell > 0 ? CTX : BOARD, swell > 0 ? 0.35 + swell * 0.65 : 1);
    if (swell > 0.5) dot(ctx, tx1 + 0.3, ty, 0.7 * swell, CW, 0.95);
    stroke(ctx, ring, { rng, closed: true, w: 0.85, c: CTX, a: 1, dbl: false, step: 0.6 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; stroke(ctx, [[tx1 + Math.cos(a) * mrx * 0.9, ty + Math.sin(a) * mry * 0.9], [tx1 + Math.cos(a) * (mrx + 0.8), ty + Math.sin(a) * (mry + 0.7)]], { rng, w: 0.35, c: CW, a: 0.7, dbl: false, step: 0.4 }); }
    // green drool
    if (!rec) {
      const dl = 1.8 + swell * 1.6;
      stroke(ctx, [[tx1 - 0.3, ty + mry - 0.2], [tx1 - 0.1, ty + mry + dl]], { rng, w: 0.55, c: CTX, a: 0.95, dbl: false, step: 0.5 });
      dot(ctx, tx1 - 0.1, ty + mry + dl + 0.4, 0.55, CTX, 1);
    }
    // angry eyes (looking down the barrel)
    for (const s of [-1, 1]) {
      const ex = 1.6 + s * 2.3, ey = -2.6 * G.k;
      const e = ell(ex, ey, 1.45, 1.15, 14);
      fillBoard(ctx, e);
      rub(ctx, e, CY, 0.95);
      dot(ctx, ex + 0.55, ey + 0.2, 0.6, BOARD, 1);
      stroke(ctx, [[ex + s * 1.9, ey - 2.4 - swell * 0.4], [ex - s * 1.3, ey - 1.3]], { rng, w: 0.75, c: CW, a: 1, dbl: false });
    }
    ctx.restore();
  }

  /* ---------- Zündrübe: round beet bomb with a fuse (facing right) ---------- */
  function drawBomber(ctx, o, rng) {
    const ph = o.ph, sw = Math.sin(ph * TAU), swell = o.swell || 0;
    const bob = -Math.abs(Math.cos(ph * TAU * 2)) * 0.6;
    // scurrying legs: 2 pairs
    for (let i = 0; i < 4; i++) {
      const s = i < 2 ? -1 : 1, q = i & 1 ? 1 : -1;
      const pp = Math.sin(ph * TAU * 2 + i * 1.7);
      const lift = Math.max(0, pp) * 1.1;
      const hx = s * 2.6 + q * 0.9, fx = hx + s * 1.2 + pp * 1.3;
      stroke(ctx, [[hx, -4.2 + bob], [hx + s * 0.9 + pp * 0.6, -2.1 - lift * 0.5], [fx, -lift]], { rng, w: 0.75, c: CC, a: i & 1 ? 0.95 : 0.7, dbl: false });
    }
    const r = 6.4 * (1 + swell * 0.13);
    ctx.save();
    ctx.translate(0, -9.4 + bob - swell * 0.6);
    ctx.rotate(sw * 0.07);
    // leaf tuft + fuse grow out of the top
    leaf(ctx, rng, -0.6, -r + 0.6, -Math.PI / 2 - 0.85, 4.4, 1.3, CG);
    leaf(ctx, rng, 0.4, -r + 0.6, -Math.PI / 2 + 0.95, 4.0, 1.2, CM);
    const fuse = spl([[0, -r + 0.4], [-0.9, -r - 1.8], [0.6, -r - 3.6], [1.6, -r - 5.4]], 4);
    stroke(ctx, fuse, { rng, w: 1.0, c: CWD, a: 1 });
    for (let i = 2; i < fuse.length - 1; i += 3) stroke(ctx, [fuse[i], [fuse[i][0] + 0.7, fuse[i][1] - 0.2]], { rng, w: 0.35, c: CC, a: 0.85, dbl: false, step: 0.3 });
    const body = ell(0, 0, r, r * 0.95, 30).map((p, i) => { const k = 1 + 0.025 * Math.sin(i * 1.9); return [p[0] * k, p[1] * k]; });
    fillBoard(ctx, body);
    rub(ctx, body, CR, 0.5);
    clipTo(ctx, body);
    hatch(ctx, body, { rng, ang: -0.75, sp: 1.05, w: 0.5, c: CR, a: 0.95 });
    hatch(ctx, ell(r * 0.35, r * 0.4, r * 0.95, r * 0.75, 18), { rng, ang: 0.7, sp: 1.1, w: 0.45, c: CRD, a: 0.9 });
    hatch(ctx, ell(-r * 0.4, -r * 0.42, r * 0.42, r * 0.32, 14), { rng, ang: -0.7, sp: 0.9, w: 0.4, c: CP, a: 0.85 });
    ctx.restore();
    // beet rings
    stroke(ctx, spl([[-r * 0.55, -r * 0.6], [-r * 0.2, -r * 0.82], [r * 0.3, -r * 0.8]], 3), { rng, w: 0.4, c: CP, a: 0.6, dbl: false });
    stroke(ctx, body, { rng, closed: true, w: 1.05, c: CW, a: 1 });
    stroke(ctx, spl([[-r * 0.75, -r * 0.3], [-r * 0.55, -r * 0.62], [-r * 0.2, -r * 0.8]], 3), { rng, w: 0.6, c: CW, a: 0.9, dbl: false });
    // root tail
    stroke(ctx, spl([[-0.4, r * 0.95], [-1.2, r + 1.4], [-2.6, r + 1.8]], 3), { rng, w: 0.6, c: CR, a: 0.9, dbl: false });
    // mean little eyes
    for (const s of [-1, 1]) {
      const ex = 1.5 + s * 2.0, ey = -0.8;
      const e = [[ex - 1.2, ey - 0.3 + (s > 0 ? -0.2 : 0.2) * 0], [ex + 1.2, ey - 0.3], [ex + 0.9 * s * 0 + 0.6, ey + 0.9], [ex - 0.8, ey + 0.8]];
      fillBoard(ctx, e);
      rub(ctx, e, CY, 1);
      dot(ctx, ex + 0.4, ey + 0.35, 0.45, BOARD, 1);
      stroke(ctx, [[ex + s * 1.7, ey - 2.0], [ex - s * 1.2, ey - 0.6]], { rng, w: 0.8, c: CW, a: 1, dbl: false });
    }
    // jagged grin
    stroke(ctx, [[-0.6, 2.6], [0.3, 2.0], [1.1, 2.7], [1.9, 2.0], [2.7, 2.7], [3.4, 2.1]], { rng, w: 0.5, c: CW, a: 0.95, dbl: false, step: 0.4 });
    ctx.restore();
  }
  const bomberFuseTip = (swell) => [1.6, -9.4 - swell * 0.6 - 6.4 * (1 + swell * 0.13) - 5.4];

  /* ---------- Wurzel-Bock: gnarled parsnip ram on four stubby root legs (facing right) ---------- */
  function horn(ctx, rng, cx, cy, r, a0, alpha, wd) {
    const p = spiralPts(cx, cy, r, 1.15, 28, a0, -1);
    stroke(ctx, p, { rng, w: wd, c: CY, a: alpha, step: 0.8 });
    stroke(ctx, p.slice(0, 22), { rng, w: wd * 0.32, c: CW, a: alpha * 0.85, dbl: false });
    for (let i = 2; i < 24; i += 3) {
      const q = p[i], n = p[i + 1];
      const dx = n[0] - q[0], dy = n[1] - q[1], L = Math.hypot(dx, dy) || 1, hw = wd * 0.55 * (1 - i / 34);
      stroke(ctx, [[q[0] - (dy / L) * hw, q[1] + (dx / L) * hw], [q[0] + (dy / L) * hw, q[1] - (dx / L) * hw]], { rng, w: 0.35, c: CWD, a: 0.9 * alpha, dbl: false, step: 0.4 });
    }
  }
  function drawCharger(ctx, o, rng) {
    const ph = o.ph || 0, mode = o.mode || 'chase';
    const sw = Math.sin(ph * TAU);
    let bob = mode === 'chase' ? -Math.abs(Math.cos(ph * TAU)) * 0.9 : 0;
    let rot = 0, px = -6, py = -6;
    if (mode === 'tele') { rot = -0.2 - (o.v ? 0.04 : 0); }
    else if (mode === 'dash') { rot = 0.1; px = 5; py = -5; bob = -1.2; }
    else if (mode === 'rest') { rot = 0.06; bob = 0.5; }
    // leg poses: [hipX, footDX, lift] for far-back, far-front, near-back, near-front
    const legs = [];
    const hips = [-8.4, 3.2, -5.8, 6.0];
    for (let i = 0; i < 4; i++) {
      let dx = 0, lift = 0;
      if (mode === 'chase') {
        const p = Math.sin(ph * TAU + (i === 0 || i === 3 ? 0 : Math.PI));
        dx = p * 1.8; lift = Math.max(0, -p) * 1.5;
      } else if (mode === 'tele') {
        if (i === 3) { dx = o.v ? -1.6 : 2.6; lift = o.v ? 0.2 : 2.2; }
        if (i === 1) { dx = 1.4; lift = 1.4; }
        if (i === 0 || i === 2) dx = -1;
      } else if (mode === 'dash') {
        dx = i === 1 || i === 3 ? 3.4 : -3.6; lift = i === 1 || i === 3 ? 1.6 : 0.8;
      } else { dx = i === 1 || i === 3 ? 1.6 : -1.6; }
      legs.push([hips[i], dx, lift]);
    }
    const leg = (L, near) => {
      const [hx, dx, lift] = L;
      const fx = hx + dx;
      const fy = -lift - (mode === 'dash' ? 1.2 : 0);
      stroke(ctx, [[hx, -6.6], [(hx + fx) / 2 + 0.3, -3.6 - lift * 0.5], [fx, fy]], { rng, w: near ? 1.7 : 1.5, c: near ? CPS : CWD, a: near ? 0.95 : 0.85 });
      stroke(ctx, [[fx - 0.7, fy + 0.2], [fx + 0.9, fy + 0.1]], { rng, w: 0.8, c: near ? CC : CWD, a: 0.9, dbl: false });
    };
    ctx.save();
    ctx.translate(px, py + bob);
    ctx.rotate(rot);
    ctx.translate(-px, -py);
    leg(legs[0], false); leg(legs[1], false);
    // far horn (behind the head)
    horn(ctx, rng, 6.4, -15.4, 4.6, -0.2, 0.6, 1.9);
    // body: thick parsnip root lying down, tapering to a root tail
    const body = spl([[-14.5, -9.6], [-10.5, -14.2], [-3, -16.2], [4, -15.6], [8.2, -12.2], [8.6, -7.2], [4.2, -4.6], [-4, -4.4], [-10.5, -5.8], [-15.2, -8.0]], 4, true);
    fillBoard(ctx, body);
    rub(ctx, body, CPS, 0.32);
    clipTo(ctx, body);
    hatch(ctx, body, { rng, ang: 1.0, sp: 1.25, w: 0.45, c: CPS, a: 0.85 });
    hatch(ctx, [[-20, -9], [20, -9], [20, 0], [-20, 0]], { rng, ang: -0.5, sp: 1.3, w: 0.45, c: CWD, a: 0.8 });
    hatch(ctx, [[-20, -20], [20, -20], [20, -13], [-20, -13]], { rng, ang: -0.9, sp: 1.3, w: 0.4, c: CL, a: 0.55 });
    ctx.restore();
    // root rings + gnarls
    for (const x of [-11, -6.5, -1.5, 3]) stroke(ctx, spl([[x + 0.8, -15 + Math.abs(x) * 0.08], [x - 0.3, -10], [x + 0.6, -5]], 3), { rng, w: 0.45, c: CWD, a: 0.9, dbl: false });
    stroke(ctx, body, { rng, closed: true, w: 1.05, c: CW, a: 1 });
    stroke(ctx, spl([[-15, -8.6], [-18, -9.6], [-19.6, -8.2], [-20.4, -9.6]], 4), { rng, w: 0.7, c: CPS, a: 0.9, dbl: false });
    stroke(ctx, [[-17.4, -9.2], [-18.4, -11.2]], { rng, w: 0.45, c: CPS, a: 0.8, dbl: false });
    // leaf tuft on the back
    leaf(ctx, rng, -4.6, -15.4, -Math.PI / 2 - 0.75, 6.6, 1.8, CG);
    leaf(ctx, rng, -3.4, -15.8, -Math.PI / 2 - 0.25, 7.6, 1.9, CM);
    leg(legs[2], true); leg(legs[3], true);
    // head, lowered at the front
    const hx = 10.6, hy = -9.6;
    const head = spl([[hx - 3.8, hy - 3.6], [hx + 0.6, hy - 4.6], [hx + 3.6, hy - 2.2], [hx + 4.8, hy + 1.8], [hx + 3.4, hy + 4.4], [hx - 0.4, hy + 4.2], [hx - 3.6, hy + 1.4]], 4, true);
    fillBoard(ctx, head);
    rub(ctx, head, CC, 0.3);
    hatch(ctx, head, { rng, ang: 0.9, sp: 1.15, w: 0.4, c: CPS, a: 0.8, inset: 0.92 });
    stroke(ctx, head, { rng, closed: true, w: 0.95, c: CW, a: 1 });
    // nostrils + snort puffs while scraping
    dot(ctx, hx + 3.6, hy + 2.6, 0.45, BOARD, 1); dot(ctx, hx + 2.6, hy + 3.2, 0.4, BOARD, 1);
    if (mode === 'tele') {
      for (let i = 0; i < 3; i++) stroke(ctx, spl([[hx + 5.2, hy + 2.6 + i * 0.6], [hx + 7 + i, hy + 1.4 + i * 1.2], [hx + 8.6 + i, hy + 2.4 + i * 1.2]], 3), { rng, w: 0.45, c: CW, a: 0.75, dbl: false });
    }
    // eye(s)
    const eyeCol = mode === 'tele' || mode === 'dash' ? CHOT : CY;
    if (mode === 'rest') {
      stroke(ctx, spiralPts(hx + 1.2, hy - 0.6, 1.6, 2, 18, 0, 1), { rng, w: 0.45, c: CY, a: 1, dbl: false, step: 0.4 });
      stroke(ctx, spl([[hx + 0.6, hy + 3.2], [hx + 1.6, hy + 4.6], [hx + 2.6, hy + 3.6]], 3), { rng, w: 0.6, c: CP, a: 0.95, dbl: false });
    } else {
      const e = ell(hx + 1.3, hy - 0.5, 1.5, 1.1, 14, 0.2);
      fillBoard(ctx, e);
      rub(ctx, e, eyeCol, 1);
      if (mode === 'tele' || mode === 'dash') { dot(ctx, hx + 1.3, hy - 0.5, 0.45, CW, 1); }
      else dot(ctx, hx + 1.8, hy - 0.4, 0.55, BOARD, 1);
      stroke(ctx, [[hx - 1.2, hy - 3.0], [hx + 3.0, hy - 1.4]], { rng, w: 0.85, c: CW, a: 1, dbl: false });
    }
    // near horn: big curl from the top of the head sweeping back
    horn(ctx, rng, 7.2, -14.0, 5.6, -0.15, 1, 2.4);
    ctx.restore();
  }

  /* ---------- Rüben-Ahnin: matriarch with headscarf, spectacles, cane and a crown of babies ---------- */
  function babyHead(ctx, rng, x, y, r, la) {
    leaf(ctx, rng, x, y - r + 0.3, -Math.PI / 2 + la, r * 1.7, r * 0.5, la > 0 ? CG : CM);
    const b = spl([[x, y - r], [x + r * 0.9, y - r * 0.4], [x + r * 0.8, y + r * 0.5], [x, y + r], [x - r * 0.8, y + r * 0.5], [x - r * 0.9, y - r * 0.4]], 3, true);
    fillBoard(ctx, b);
    rub(ctx, b, CC, 0.25);
    clipTo(ctx, b);
    rub(ctx, [[x - 5, y - 5], [x + 5, y - 5], [x + 5, y], [x - 5, y]], CL, 0.7);
    ctx.restore();
    stroke(ctx, b, { rng, closed: true, w: 0.6, c: CW, a: 1, step: 0.6 });
    dot(ctx, x - 0.4, y + 0.1, 0.36, CY, 1); dot(ctx, x + 0.9, y + 0.1, 0.36, CY, 1);
  }
  function drawMother(ctx, o, rng) {
    const ph = o.ph, sw = Math.sin(ph * TAU);
    const bob = -Math.abs(Math.cos(ph * TAU)) * 1.1;
    // thick short legs
    for (const s of [-1, 1]) {
      const lift = Math.max(0, -sw * s) * 1.4;
      const fx = s * 4.8 + sw * s * 1.4;
      stroke(ctx, [[s * 4.4, -5.6 + bob], [s * 4.8 + sw * s * 0.5, -2.8 - lift * 0.5], [fx, -lift]], { rng, w: 2.2, c: CC, a: 0.95 });
      for (let k = -1; k <= 1; k++) stroke(ctx, [[fx, -lift], [fx + k * 1.1 + s * 0.6, 0.6 - lift]], { rng, w: 0.6, c: CC, a: 0.85, dbl: false });
    }
    // cane (in front)
    const cx = 15.2 + sw * 0.5;
    ctx.save();
    ctx.translate(0, -17.6 + bob);
    ctx.rotate(sw * 0.035);
    // back arm
    stroke(ctx, spl([[-11, -1], [-13.6, 3.4], [-14.2 - sw * 0.8, 7.6]], 4), { rng, w: 1.6, c: CC, a: 0.85 });
    const body = spl([[0, -13], [8.6, -11], [12.6, -3], [11.6, 5], [6.6, 10.6], [0, 12], [-6.6, 10.6], [-11.6, 5], [-12.6, -3], [-8.6, -11]], 4, true);
    fillBoard(ctx, body);
    rub(ctx, body, CC, 0.2);
    clipTo(ctx, body);
    const top = [[-14, -14], [14, -14], [14, 3.2], [10, 4.4], [5, 3], [0, 4.6], [-5, 3], [-10, 4.4], [-14, 3.2]];
    rub(ctx, top, CL, 0.55);
    hatch(ctx, top, { rng, ang: -0.8, sp: 1.2, w: 0.5, c: CL, a: 0.95 });
    hatch(ctx, top, { rng, ang: 0.8, sp: 1.9, w: 0.4, c: CP, a: 0.35 });
    rub(ctx, [[-14, 3], [14, 3], [14, 14], [-14, 14]], CC, 0.22);
    hatch(ctx, [[-14, 3], [14, 3], [14, 14], [-14, 14]], { rng, ang: 0.25, sp: 1.3, w: 0.5, c: CC, a: 0.75 });
    ctx.restore();
    stroke(ctx, [[-12, 3.4], [-10, 4.4], [-5, 3], [0, 4.6], [5, 3], [10, 4.4], [12, 3.4]], { rng, w: 0.6, c: CL, a: 0.9, dbl: false });
    // wrinkles
    for (const [x, y, w2] of [[-7.5, 0.5, 3.4], [-8.6, 6.4, 3], [-3.4, 8.6, 3.4], [7.8, 7.2, 2.6], [-9.4, -3.4, 2.4]]) {
      stroke(ctx, spl([[x - w2, y + 0.3], [x, y - 0.5], [x + w2, y + 0.3]], 3), { rng, w: 0.45, c: CW, a: 0.65, dbl: false });
    }
    stroke(ctx, body, { rng, closed: true, w: 1.25, c: CW, a: 1 });
    // headscarf (pink with white polka dots) – knotted under the chin at the front
    const scarf = spl([[-12.8, -2.6], [-11.4, -9.2], [-6.2, -13.4], [0, -14.4], [6.2, -13.4], [11.4, -9.2], [12.9, -2.4], [9.8, -5.0], [5.6, -7.6], [0, -8.4], [-5.8, -7.4], [-10.2, -4.8]], 3, true);
    fillBoard(ctx, scarf);
    rub(ctx, scarf, CP, 0.5);
    hatch(ctx, scarf, { rng, ang: 0.9, sp: 1.1, w: 0.45, c: CP, a: 0.95 });
    for (const [x, y] of [[-8.4, -8.6], [-4, -11.4], [1.4, -12.2], [6.4, -10.8], [9.8, -7.4], [-1.4, -9.6], [3.8, -9.0], [-6.8, -6.0]]) dot(ctx, x, y, 0.62, CW, 0.95);
    stroke(ctx, scarf, { rng, closed: true, w: 0.85, c: CP, a: 1 });
    // knot + tails
    const kx = 12.2, ky = -2.2;
    stroke(ctx, ell(kx, ky, 1.3, 1.1, 10), { rng, closed: true, w: 0.75, c: CP, a: 1, dbl: false, step: 0.5 });
    stroke(ctx, spl([[kx, ky + 0.9], [kx + 1.6, ky + 3.2], [kx + 1.2, ky + 5.2]], 3), { rng, w: 0.85, c: CP, a: 1, dbl: false });
    stroke(ctx, spl([[kx + 0.6, ky + 0.8], [kx + 3.0, ky + 2.4], [kx + 3.6, ky + 4.4]], 3), { rng, w: 0.75, c: CP, a: 0.9, dbl: false });
    // babies sitting in her scarf
    const w1 = o.fr & 1 ? -0.4 : 0;
    babyHead(ctx, rng, -6.2, -14.4 + w1, 2.6, -0.5);
    babyHead(ctx, rng, 6.4, -14.2 - w1, 2.5, 0.5);
    babyHead(ctx, rng, 0.2, -16.6 - w1 * 0.5, 2.9, 0.15);
    // face: spectacles, stern little eyes, long root nose, pursed mouth
    for (const s of [-1, 1]) {
      const ex = 4.4 + s * 2.8, ey = -2.6;
      dot(ctx, ex + 0.2, ey + 0.2, 0.75, CY, 1);
      dot(ctx, ex + 0.45, ey + 0.3, 0.35, BOARD, 1);
      stroke(ctx, ell(ex, ey, 2.0, 1.75, 16), { rng, closed: true, w: 0.45, c: CW, a: 0.95, dbl: false, step: 0.5 });
      stroke(ctx, [[ex - s * 1.8, ey - 2.9], [ex + s * 1.4, ey - 2.4]], { rng, w: 0.6, c: CW, a: 0.95, dbl: false });
    }
    stroke(ctx, [[3.4, -2.8], [5.4, -2.8]], { rng, w: 0.35, c: CW, a: 0.9, dbl: false });
    stroke(ctx, spl([[5.6, -1.2], [7.0, 1.0], [6.2, 1.6]], 3), { rng, w: 0.6, c: CC, a: 0.95, dbl: false });
    stroke(ctx, spl([[3.2, 3.6], [4.6, 3.0], [6.0, 3.6]], 3), { rng, w: 0.55, c: CW, a: 0.95, dbl: false });
    stroke(ctx, [[2.6, 2.6], [2.2, 3.8]], { rng, w: 0.35, c: CW, a: 0.6, dbl: false });
    // front arm holding the cane
    stroke(ctx, spl([[11.4, 0.4], [13.6, 3.2], [cx - 0.6, 5.2]], 4), { rng, w: 1.7, c: CC, a: 0.95 });
    ctx.restore();
    stroke(ctx, spl([[cx - 2.4, -14.8], [cx - 1.6, -16.6], [cx, -16.0], [cx, -13.8]], 4), { rng, w: 1.1, c: CWD, a: 1, dbl: false });
    stroke(ctx, [[cx, -13.8], [cx + 0.3, 0]], { rng, w: 1.1, c: CWD, a: 1 });
    dot(ctx, cx - 0.4, -12.4 + bob, 1.0, CC, 0.95);
  }

  /* ---------- Rübchen: tiny angry baby turnip with one leaf ---------- */
  function drawSprout(ctx, o, rng) {
    const ph = o.ph, sw = Math.sin(ph * TAU);
    const bob = -Math.abs(Math.cos(ph * TAU)) * 0.9;
    for (const s of [-1, 1]) {
      const lift = Math.max(0, -sw * s) * 1.3;
      const fx = s * 1.8 + sw * s * 1.4;
      stroke(ctx, [[s * 1.3, -3.4 + bob], [s * 1.5 + sw * s * 0.6, -1.7 - lift * 0.5], [fx, -lift]], { rng, w: 0.7, c: CC, a: 0.95, dbl: false });
      stroke(ctx, [[fx, -lift], [fx + s * 0.8, 0.1 - lift]], { rng, w: 0.5, c: CC, a: 0.8, dbl: false });
    }
    ctx.save();
    ctx.translate(0, -7.4 + bob);
    ctx.rotate(sw * 0.12);
    leaf(ctx, rng, 0.2, -4.0, -Math.PI / 2 + 0.38, 5.4, 1.7, CM);
    const b = spl([[0, -4.4], [3.3, -3.4], [4.6, -0.4], [3.7, 2.5], [1.5, 4.0], [0, 4.8], [-1.5, 4.0], [-3.7, 2.5], [-4.6, -0.4], [-3.3, -3.4]], 4, true);
    fillBoard(ctx, b);
    rub(ctx, b, CC, 0.22);
    clipTo(ctx, b);
    const wave = [[-6, -6], [6, -6], [6, 0.2], [3, 0.8], [0, -0.2], [-3, 0.8], [-6, 0.2]];
    rub(ctx, wave, CL, 0.7);
    hatch(ctx, wave, { rng, ang: -0.8, sp: 1.0, w: 0.4, c: CL, a: 0.95 });
    hatch(ctx, [[-6, 0], [6, 0], [6, 6], [-6, 6]], { rng, ang: 0.7, sp: 1.5, w: 0.35, c: CW, a: 0.55 });
    ctx.restore();
    stroke(ctx, b, { rng, closed: true, w: 0.8, c: CW, a: 1, step: 0.7 });
    stroke(ctx, spl([[0, 4.6], [-0.5, 5.8], [-1.4, 6.4]], 3), { rng, w: 0.45, c: CC, a: 0.85, dbl: false });
    for (const s of [-1, 1]) {
      const ex = 1.0 + s * 1.55, ey = -0.7;
      dot(ctx, ex, ey, 0.95, BOARD, 1);
      dot(ctx, ex, ey, 0.82, CY, 1);
      dot(ctx, ex + 0.35, ey + 0.1, 0.38, BOARD, 1);
      stroke(ctx, [[ex + s * 1.3, ey - 1.7], [ex - s * 0.9, ey - 0.9]], { rng, w: 0.55, c: CW, a: 1, dbl: false });
    }
    stroke(ctx, [[0.0, 1.9], [0.7, 1.5], [1.4, 1.9], [2.1, 1.5]], { rng, w: 0.4, c: CW, a: 0.95, dbl: false, step: 0.4 });
    ctx.restore();
  }

  /* ---------- small objects ---------- */
  function drawJuice(ctx, rng) {
    // glob of toxic turnip juice, flying to the right
    const b = spl([[3.6, 0], [1.6, -2.9], [-1.6, -3.0], [-3.4, -1.2], [-4.6, 0.2], [-3.2, 1.7], [-0.8, 3.0], [2.0, 2.6]], 4, true);
    fillBoard(ctx, b);
    rub(ctx, b, CTX, 0.85);
    hatch(ctx, b, { rng, ang: 0.6, sp: 0.75, w: 0.4, c: CG, a: 0.8, inset: 0.85 });
    softRub(ctx, b, [250, 255, 214], 0.8, -0.9, 2.4, 0.95, 0);
    stroke(ctx, b, { rng, closed: true, w: 0.7, c: CTX, a: 1, step: 0.6 });
    dot(ctx, 1.0, -1.1, 0.8, CW, 1);
    // bubbles
    dot(ctx, -2.0, 1.0, 0.45, CW, 0.75);
  }
  function drawJuiceTrail(ctx, rng) {
    for (let i = 0; i < 6; i++) {
      const x = -4 - i * 2.1, y = J(1.0, rng), r = 1.2 - i * 0.16;
      dot(ctx, x, y, Math.max(0.3, r), CTX, 0.8 - i * 0.1);
    }
    stroke(ctx, [[-3, -1.3], [-11, -0.4]], { rng, w: 0.4, c: CTX, a: 0.5, dbl: false });
    stroke(ctx, [[-3, 1.2], [-9, 0.8]], { rng, w: 0.35, c: CTX, a: 0.45, dbl: false });
  }
  function drawSpray(ctx, rng) {
    for (let i = 0; i < 14; i++) {
      const a = J(0.55, rng), d = R(1, 8, rng);
      dot(ctx, Math.cos(a) * d, Math.sin(a) * d, R(0.3, 0.8, rng), i & 1 ? CTX : CW, R(0.6, 1, rng));
    }
    for (let i = 0; i < 4; i++) { const a = -0.4 + i * 0.27; stroke(ctx, [[Math.cos(a) * 2, Math.sin(a) * 2], [Math.cos(a) * 7, Math.sin(a) * 7]], { rng, w: 0.5, c: CTX, a: 0.85, dbl: false }); }
  }
  function drawStar(ctx, rng, col) {
    const p = starPts(0, 0, 3.2, 1.3, 5, 0);
    rub(ctx, p, col, 0.5);
    stroke(ctx, p, { rng, closed: true, w: 0.6, c: col, a: 1, step: 0.6 });
  }
  function drawSpark(ctx, rng) {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + J(0.15, rng), r1 = k & 1 ? 2.0 : 3.3;
      stroke(ctx, [[Math.cos(a) * 0.6, Math.sin(a) * 0.6], [Math.cos(a) * r1, Math.sin(a) * r1]], { rng, w: 0.5, c: k & 1 ? CO : CY, a: 1, dbl: false, step: 0.5 });
    }
    dot(ctx, 0, 0, 0.9, CW, 1);
  }
  function drawSmear(ctx, rng) {
    for (let k = 0; k < 7; k++) {
      const y = R(-5, 5, rng), x0 = R(-14, -8, rng), x1 = R(-3, 0, rng);
      stroke(ctx, [[x0, y], [x1, y + R(-0.3, 0.3, rng)]], { rng, w: R(0.4, 0.9, rng), c: k % 3 ? CW : CPS, a: R(0.35, 0.7, rng), dbl: false, j: 0.05 });
    }
  }
  function drawEraser(c) {
    const r = U.rng(570);
    const top = [[-7, -3.4], [7, -3.4], [7, 0.2], [-7, 0.2]];
    c.fillStyle = rgba(CWD, 1); c.beginPath(); poly(c, top); c.fill();
    hatch(c, top, { rng: r, ang: 0.05, sp: 0.9, w: 0.35, c: [120, 82, 52], a: 0.9 });
    const felt = [[-7, 0.2], [7, 0.2], [6.6, 3.2], [-6.6, 3.2]];
    c.fillStyle = 'rgb(84,88,86)'; c.beginPath(); poly(c, felt); c.fill();
    hatch(c, felt, { rng: r, ang: 1.5, sp: 0.6, w: 0.25, c: CW, a: 0.35 });
    stroke(c, top.concat([[-7, 3.2]]), { rng: r, closed: false, w: 0.35, c: [60, 40, 26], a: 0.8, dbl: false });
  }
  /* ===================================================================================== sprite cache */
  let SPR = null;
  const LAZY = [];
  let lazyFrame = -1;
  const BOIL = 3;
  /** A pose = {r: [variants], l: [variants]} – variant 0 now, the other line-boil variants lazily. */
  function pose(box, draw, opt, seed) {
    const make = (v) => mk(box[0], box[1], box[2], box[3], (c) => draw(c, U.rng(seed + v * 41)), opt);
    const s = make(0);
    const P = { r: [s], l: [flipSpr(s)] };
    for (let v = 1; v < BOIL; v++) LAZY.push(() => { const t = make(v); P.r.push(t); P.l.push(flipSpr(t)); });
    return P;
  }
  function build() {
    if (!GRAIN) buildGrain();
    const S = {};
    let sd = 7000;
    const E = { flash: true };
    // spitter
    const bS = [-12, -31, 19, 2];
    S.spitter = {
      walk: [0, 1, 2, 3].map((i) => pose(bS, (c, r) => drawSpitter(c, { ph: i / 4 }, r), { halo: 0.9, flash: true }, sd += 13)),
      aim: [0.3, 0.6, 1].map((w) => pose(bS, (c, r) => drawSpitter(c, { ph: 0, swell: w }, r), { halo: 0.9, flash: true }, sd += 13)),
      spit: pose(bS, (c, r) => drawSpitter(c, { ph: 0, rec: 1 }, r), { halo: 0.9, flash: true }, sd += 13),
    };
    // bomber
    const bB = [-10, -29, 10, 2];
    S.bomber = {
      walk: [0, 1, 2, 3].map((i) => pose(bB, (c, r) => drawBomber(c, { ph: i / 4 }, r), { halo: 0.9, flash: true, hot: '#ff3b2f' }, sd += 13)),
      armed: [0.5, 1].map((w, i) => pose(bB, (c, r) => drawBomber(c, { ph: i * 0.25, swell: w }, r), { halo: 0.9, flash: true, hot: '#ff3b2f' }, sd += 13)),
    };
    // charger
    const bC = [-22, -27, 22, 2];
    S.charger = {
      walk: [0, 1, 2, 3].map((i) => pose(bC, (c, r) => drawCharger(c, { ph: i / 4, mode: 'chase' }, r), { halo: 0.9, flash: true }, sd += 13)),
      tele: [0, 1].map((v) => pose(bC, (c, r) => drawCharger(c, { mode: 'tele', v }, r), { halo: 0.9, flash: true }, sd += 13)),
      dash: pose(bC, (c, r) => drawCharger(c, { mode: 'dash' }, r), { halo: 0.9, flash: true }, sd += 13),
      rest: pose(bC, (c, r) => drawCharger(c, { mode: 'rest' }, r), { halo: 0.9, flash: true }, sd += 13),
    };
    // mother
    const bM = [-17, -42, 20, 2];
    S.mother = { walk: [0, 1, 2, 3].map((i) => pose(bM, (c, r) => drawMother(c, { ph: i / 4, fr: i }, r), { halo: 1.0, flash: true }, sd += 13)) };
    // sprout
    const bP = [-7, -18, 7, 1.5];
    S.sprout = { walk: [0, 1, 2, 3].map((i) => pose(bP, (c, r) => drawSprout(c, { ph: i / 4 }, r), { halo: 0.8, flash: true }, sd += 13)) };
    // shots, spray, sparks, stars, eraser, smear, glows
    S.juice = [0, 1, 2].map((v) => mk(-5, -3.6, 4.2, 3.6, (c) => drawJuice(c, U.rng(7700 + v)), { pad: 0.8, halo: 0.9, haloA: 1 }));
    S.juiceTrail = mk(-14, -2.4, -2.5, 2.4, (c) => drawJuiceTrail(c, U.rng(7710)), { pad: 0.5, halo: 0, grain: 0.5 });
    S.spray = [0, 1].map((v) => mk(0, -5, 9, 5, (c) => drawSpray(c, U.rng(7720 + v)), { pad: 0.5, halo: 0, grain: 0.4 }));
    S.spark = [0, 1].map((v) => mk(-3.6, -3.6, 3.6, 3.6, (c) => drawSpark(c, U.rng(7730 + v)), { pad: 0.4, halo: 0.5, haloA: 0.7, grain: 0.4 }));
    S.star = mk(-3.5, -3.5, 3.5, 3.5, (c) => drawStar(c, U.rng(7740), CY), { pad: 0.4, halo: 0.6, haloA: 0.8, grain: 0.5 });
    S.eraser = mk(-7.5, -3.6, 7.5, 3.6, drawEraser, { pad: 0.4, halo: 0, grain: 0.25 });
    S.smear = mk(-15, -6, 0, 6, (c) => drawSmear(c, U.rng(7750)), { pad: 0.4, halo: 0, grain: 0.5 });
    S.gLime = dustGlow(CTX, 9, 0.75);
    S.gWarm = dustGlow(CY, 9, 0.7);
    S.gLav = dustGlow(CL, 22, 0.5);
    S.spiral = mk(-4, -4, 4, 4, (c) => stroke(c, spiralPts(0, 0, 3.6, 2.2, 36, 0, 1), { rng: U.rng(7760), w: 0.55, c: CW, a: 0.95 }), { pad: 0.5, halo: 0.5, haloA: 0.7, grain: 0.5 });
    return S;
  }
  function runLazy(view) {
    if (!LAZY.length) return;
    const fr = Math.round(view.rt * 240);
    if (fr === lazyFrame) return;
    lazyFrame = fr;
    const end = performance.now() + 1.6;
    do { LAZY.shift()(); } while (LAZY.length && performance.now() < end);
  }

  /* ===================================================================================== blitting */
  let BX = 0, BY = 0, BS = 1;
  function base(view) { BS = view.S; BX = view.W / 2 - view.x * BS; BY = view.H / 2 - view.y * BS; }
  const kk = 1 / K;
  function blitC(ctx, c, s, x, y) {
    const dx = Math.round((x - s.ax * kk) * BS) / BS, dy = Math.round((y - s.ay * kk) * BS) / BS;
    ctx.drawImage(c, dx, dy, c.width * kk, c.height * kk);
  }
  function blitS(ctx, c, s, x, y, sx, sy) {
    ctx.drawImage(c, x - s.ax * kk * sx, y - s.ay * kk * sy, c.width * kk * sx, c.height * kk * sy);
  }
  function blitRot(ctx, s, x, y, ang, sc, img) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(sc * kk, sc * kk);
    ctx.drawImage(img || s.c, -s.ax, -s.ay);
    ctx.restore();
  }
  const boil = (rt, seed) => Math.floor(rt * 7 + seed * 3) % 3;
  function pick(P, e, view) {
    const arr = e.facing < 0 ? P.l : P.r;
    return arr[boil(view.rt, e.seed) % arr.length];
  }

  /** Spawn (drawn onto the board), death (eraser wipe), body + hit flash – exactly like the style's creeper. */
  function drawBody(ctx, e, view, s, x, y, sx, sy, big) {
    const w = s.c.width, h = s.c.height;
    sx = sx || 1; sy = sy || 1;
    if (e.dying) {
      const u = e.deathT, dir = e.seed < 0.5 ? 1 : -1;
      const dx = x - s.ax * kk, dy = y - s.ay * kk;
      const ex = 1 + u * 0.9;
      ctx.globalAlpha = 0.45 * (1 - u);
      ctx.drawImage(s.ch, dir > 0 ? dx : dx - w * kk * (ex - 1), dy + h * kk * 0.04, w * kk * ex, h * kk * 0.96);
      const cut = Math.round(w * U.clamp(u * 1.2, 0, 1));
      ctx.globalAlpha = 1;
      if (cut < w) {
        if (dir > 0) ctx.drawImage(s.c, cut, 0, w - cut, h, dx + cut * kk, dy, (w - cut) * kk, h * kk);
        else ctx.drawImage(s.c, 0, 0, w - cut, h, dx, dy, (w - cut) * kk, h * kk);
      }
      if (u < 0.92) {
        const exx = dir > 0 ? dx + cut * kk : dx + (w - cut) * kk;
        blitRot(ctx, SPR.eraser, exx, y - e.r * 1.2, dir * (0.35 + Math.sin(u * 20) * 0.08) + Math.PI / 2 * dir, big || 0.85);
      }
      return false;
    }
    if (e.spawnT < 1) {
      const t = e.spawnT, q = U.ease.outQuad(t);
      const rows = Math.max(1, Math.round(h * q));
      const dx = x - s.ax * kk, dy = y - s.ay * kk;
      ctx.drawImage(s.c, 0, 0, w, rows, dx, dy, w * kk, rows * kk);
      const tx = dx + (0.5 + 0.4 * Math.sin(t * 40 + e.seed * 9)) * w * kk, ty = dy + rows * kk;
      ctx.fillStyle = 'rgba(245,245,236,0.95)';
      ctx.fillRect(tx - 0.8, ty - 0.8, 1.6, 1.6);
      return false;
    }
    if (sx === 1 && sy === 1) blitC(ctx, s.c, s, x, y); else blitS(ctx, s.c, s, x, y, sx, sy);
    if (e.flash > 0 && s.f) {
      ctx.globalAlpha = Math.min(0.6, e.flash * 0.8);
      if (sx === 1 && sy === 1) blitC(ctx, s.f, s, x, y); else blitS(ctx, s.f, s, x, y, sx, sy);
    }
    ctx.globalAlpha = 1;
    return true;
  }
  function ensure(view) { if (!SPR) SPR = build(); base(view); runLazy(view); }

  /* ===================================================================================== icons (100-unit space, like the style) */
  function iconSeed(ctx, rng, x, y, a, len, wid) {
    const p = seedPts(x, y, a, len, wid);
    rub(ctx, p, CC, 0.8);
    hatch(ctx, p, { rng, ang: a + 1.2, sp: 3, w: 1.1, c: CY, a: 0.8 });
    stroke(ctx, p, { rng, closed: true, w: 2.6, c: CW, a: 1, step: 2.5, j: 0.4 });
  }
  function icon(ctx, size, id, fn) {
    const rng = U.rng(id.split('').reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) >>> 0);
    const S = (pts, c, w, a, closed) => stroke(ctx, pts, { rng, closed, w, c, a: a === undefined ? 1 : a, step: 2.5, j: 0.45 });
    ctx.save();
    ctx.scale(size / 100, size / 100);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    fn(ctx, rng, S);
    ctx.restore();
    applyGrain(ctx, size, size, 0.8, id.length * 7);
  }
  const ICONS = {
    leech(ctx, size) {
      icon(ctx, size, 'leech', (c, rng, S) => {
        const bowl = spl([[10, 56], [90, 56], [80, 80], [50, 92], [20, 80]], 4, true);
        rub(c, bowl, CC, 0.18);
        hatch(c, bowl, { rng, ang: 0.8, sp: 6, w: 2.2, c: CW, a: 0.65 });
        S(bowl, CW, 5, 1, true);
        rub(c, ell(50, 56, 38, 7, 22), CO, 0.8);
        hatch(c, ell(50, 56, 38, 7, 22), { rng, ang: 0.2, sp: 4, w: 1.8, c: CDO, a: 0.8 });
        dot(c, 34, 55, 4, CY, 0.95); dot(c, 60, 56, 3.6, CL, 0.95); dot(c, 46, 58, 3, CG, 0.9);
        for (let k = 0; k < 2; k++) S(spl([[28 + k * 16, 44], [24 + k * 16, 34], [32 + k * 16, 26], [28 + k * 16, 16]], 4), CW, 3.2, 0.75);
        const h = heartPts(72, 24, 1.15);
        rub(c, h, CP, 0.6);
        hatch(c, h, { rng, ang: -0.8, sp: 4.5, w: 1.8, c: CP, a: 0.9 });
        S(h, CP, 4.5, 1, true);
        S(spl([[64, 18], [66, 14], [70, 13]], 3), CW, 2.4, 0.9);
      });
    },
    thorns(ctx, size) {
      icon(ctx, size, 'thorns', (c, rng, S) => {
        const st = starPts(50, 52, 47, 31, 12, 0.13);
        rub(c, st, CG, 0.3);
        hatch(c, st, { rng, ang: 0.9, sp: 5, w: 1.8, c: CG, a: 0.8 });
        S(st, CM, 4, 1, true);
        const b = spl([[50, 26], [70, 36], [74, 56], [50, 78], [26, 56], [30, 36]], 4, true);
        fillBoard(c, b);
        rub(c, b, CC, 0.25);
        clipTo(c, b);
        rub(c, [[0, 0], [100, 0], [100, 52], [0, 52]], CL, 0.65);
        hatch(c, [[0, 0], [100, 0], [100, 52], [0, 52]], { rng, ang: -0.8, sp: 5.5, w: 2.1, c: CL, a: 0.9 });
        hatch(c, [[0, 52], [100, 52], [100, 100], [0, 100]], { rng, ang: 0.8, sp: 6, w: 1.8, c: CW, a: 0.5 });
        c.restore();
        S(b, CW, 4.6, 1, true);
        // armour plates
        S(spl([[30, 44], [50, 40], [70, 44]], 4), CW, 2.4, 0.75);
        S(spl([[28, 60], [50, 56], [72, 60]], 4), CW, 2.4, 0.6);
        leaf(c, rng, 48, 27, -Math.PI / 2 - 0.5, 16, 5, CM);
        leaf(c, rng, 52, 27, -Math.PI / 2 + 0.5, 16, 5, CG);
      });
    },
    dashup(ctx, size) {
      icon(ctx, size, 'dashup', (c, rng, S) => {
        for (let k = 0; k < 4; k++) S([[6 + k * 3, 34 + k * 12], [34 + k * 2, 34 + k * 12]], k & 1 ? CO : CW, 3.6, 0.8);
        c.save();
        c.translate(62, 56);
        c.rotate(0.45);
        pumpkin(c, rng, 0, 30, 30, true, 0.55);
        c.restore();
        // shockwave arcs in front
        S(spl([[86, 22], [96, 50], [86, 82]], 4), CY, 4);
        S(spl([[80, 92], [60, 96], [36, 92]], 4), CW, 2.6, 0.6);
        for (const [x, y, r] of [[20, 88, 5], [32, 92, 4]]) dot(c, x, y, r, CW, 0.35);
      });
    },
    range(ctx, size) {
      icon(ctx, size, 'range', (c, rng, S) => {
        // target
        rub(c, ell(78, 80, 20, 12, 24), CP, 0.25);
        for (const [r, col] of [[20, CP], [12.5, CW], [5.5, CP]]) S(ell(78, 80, r, r * 0.6, 24), col, 4.4, 1, true);
        dot(c, 78, 80, 3.6, CP, 1);
        // long dotted arc
        const p = [];
        for (let i = 0; i <= 16; i++) { const t = i / 16; p.push([12 + t * 64, 82 - Math.sin(t * Math.PI) * 66 + t * 2]); }
        for (let i = 0; i < p.length - 3; i += 2) dot(c, p[i][0], p[i][1], 3.6, CW, 0.95);
        iconSeed(c, rng, 64, 32, 0.8, 38, 21);
        for (let k = 0; k < 3; k++) S([[46 - k * 6, 14 + k * 9], [56 - k * 6, 20 + k * 9]], CY, 2.6, 0.75);
      });
    },
  };

  /* ===================================================================================== registration */
  C.art('chalk', {
    init() { SPR = build(); },
    enemies: {
      spitter(ctx, e, view) {
        ensure(view);
        const T = SPR.spitter;
        let P, tremble = 0;
        if (e.mode === 'aim' && !e.dying) { const ch = e.charge || 0; P = T.aim[Math.min(2, Math.floor(ch * 3))]; tremble = ch; }
        else if ((e.spit || 0) > 0.35 && !e.dying) P = T.spit;
        else P = T.walk[Math.floor(e.anim * 3.2) & 3];
        const s = pick(P, e, view);
        const x = e.x + (tremble > 0.3 ? Math.sin(view.rt * 70 + e.seed * 9) * 0.45 * tremble : 0);
        if (!drawBody(ctx, e, view, s, x, e.y)) return;
        const f = e.facing < 0 ? -1 : 1;
        if (tremble > 0) {
          const G = spitterGeo(Math.min(1, (Math.floor(tremble * 3) + 1) / 3), 0);
          const mx = x + f * (G.rx + 4.4), my = e.y + G.oy + 1.6 * G.k;
          ctx.globalAlpha = 0.35 + 0.55 * tremble * (0.8 + 0.2 * Math.sin(view.rt * 40));
          const gs = 0.5 + tremble * 0.7;
          blitS(ctx, SPR.gLime.c, SPR.gLime, mx, my, gs, gs);
          ctx.globalAlpha = 1;
        }
        if ((e.spit || 0) > 0) {
          const sp = SPR.spray[e.seed < 0.5 ? 0 : 1], k = e.spit;
          const mx = x + f * 11, my = e.y - 10;
          ctx.globalAlpha = Math.min(1, k * 1.6);
          ctx.save(); ctx.translate(mx, my); ctx.scale(f * (1.4 - k * 0.6), 1.4 - k * 0.6);
          ctx.drawImage(sp.c, -sp.ax * kk, -sp.ay * kk, sp.c.width * kk, sp.c.height * kk);
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      },
      bomber(ctx, e, view) {
        ensure(view);
        const T = SPR.bomber;
        const armed = e.armed && !e.dying;
        const fz = armed ? e.fuse || 0 : 0;
        const P = armed ? T.armed[fz > 0.5 ? 1 : 0] : T.walk[Math.floor(e.anim * 4) & 3];
        const s = pick(P, e, view);
        const sc = armed ? 1 + 0.05 * Math.sin(view.rt * 50) * fz : 1;
        const x = e.x + (armed ? Math.sin(view.rt * 80 + e.seed * 7) * 0.5 * fz : 0);
        if (!drawBody(ctx, e, view, s, x, e.y, sc, sc)) return;
        if (armed) {
          // blinks red / white faster and faster
          const cyc = fz * 3 + fz * fz * 9;
          const on = (cyc % 1) < 0.5;
          const img = on ? s.hot : s.f;
          ctx.globalAlpha = on ? 0.55 + fz * 0.3 : 0.35 + fz * 0.25;
          blitS(ctx, img, s, x, e.y, sc, sc);
          ctx.globalAlpha = 1;
        }
        // fuse spark
        const tip = bomberFuseTip(armed ? (fz > 0.5 ? 1 : 0.5) : 0);
        const f = e.facing < 0 ? -1 : 1;
        const sx = x + tip[0] * f, sy = e.y + tip[1] - (armed ? 0 : Math.abs(Math.cos(Math.floor(e.anim * 4) * Math.PI / 2)) * 0);
        const fl = 0.75 + 0.25 * Math.sin(view.rt * 37 + e.seed * 11);
        const big = (armed ? 1.0 + fz * 0.9 : 0.6) * fl;
        ctx.globalAlpha = armed ? 0.55 + 0.3 * fz : 0.35;
        blitS(ctx, SPR.gWarm.c, SPR.gWarm, sx, sy, big * 0.8, big * 0.8);
        ctx.globalAlpha = 1;
        blitRot(ctx, SPR.spark[Math.floor(view.rt * 12) & 1], sx, sy, view.rt * 6, big);
      },
      charger(ctx, e, view) {
        ensure(view);
        const T = SPR.charger;
        const f = e.facing < 0 ? -1 : 1;
        let P = T.walk[Math.floor(e.anim * 3) & 3], x = e.x, rot = 0, sx = 1, sy = 1;
        const mode = e.dying ? 'chase' : e.mode;
        if (mode === 'tele') {
          const k = Math.min(1, (e.modeT || 0) / 0.72);
          P = T.tele[Math.floor(view.rt * (8 + k * 10)) & 1];
          x += Math.sin(view.rt * 60 + e.seed * 9) * (0.25 + k * 0.6);
        } else if (mode === 'dash') { P = T.dash; sx = 1.18; sy = 0.92; }
        else if (mode === 'rest') { P = T.rest; rot = Math.sin(view.rt * 9 + e.seed * 5) * 0.08; }
        const s = pick(P, e, view);
        if (mode === 'dash') {
          // speed smear behind
          ctx.globalAlpha = 0.85;
          ctx.save(); ctx.translate(e.x - f * 6, e.y - 10); ctx.scale(f * 1.2, 1);
          ctx.drawImage(SPR.smear.c, -SPR.smear.ax * kk, -SPR.smear.ay * kk, SPR.smear.c.width * kk, SPR.smear.c.height * kk);
          ctx.restore();
          ctx.globalAlpha = 1;
        }
        if (rot && !e.dying && e.spawnT >= 1) {
          ctx.save(); ctx.translate(x, e.y); ctx.rotate(rot); ctx.translate(-x, -e.y);
          drawBody(ctx, e, view, s, x, e.y);
          ctx.restore();
        } else if (!drawBody(ctx, e, view, s, x, e.y, sx, sy)) return;
        if (mode === 'tele') {
          // glowing red eye
          const k = Math.min(1, (e.modeT || 0) / 0.72);
          ctx.globalAlpha = 0.4 + 0.5 * k;
          blitS(ctx, SPR.gWarm.c, SPR.gWarm, x + f * 11.5, e.y - 13, 0.45, 0.45);
          ctx.globalAlpha = 1;
        }
        if (mode === 'rest') {
          // dizzy: stars + spiral circling the head
          const hx = e.x + f * 7, hy = e.y - 25;
          for (let i = 0; i < 3; i++) {
            const a = view.rt * 6 + (i / 3) * TAU;
            const px = hx + Math.cos(a) * 7, py = hy + Math.sin(a) * 2.2;
            if (i === 2) blitRot(ctx, SPR.spiral, px, py, view.rt * 8, 0.65);
            else blitRot(ctx, SPR.star, px, py, a, 0.62);
          }
        }
      },
      mother(ctx, e, view) {
        ensure(view);
        const T = SPR.mother;
        const s = pick(T.walk[Math.floor(e.anim * 2.4) & 3], e, view);
        const b = e.dying ? 0 : e.birth || 0;
        let sx = 1, sy = 1;
        if (b > 0) {
          const w = Math.sin((1 - b) * Math.PI * 3) * b;
          sx = 1 + 0.12 * w; sy = 1 - 0.1 * w;
          ctx.globalAlpha = b * 0.75;
          blitS(ctx, SPR.gLav.c, SPR.gLav, e.x, e.y - 20, 1.1 + (1 - b) * 0.4, 1.0 + (1 - b) * 0.3);
          ctx.globalAlpha = 1;
        }
        drawBody(ctx, e, view, s, e.x, e.y, sx, sy, 1.3);
      },
      sprout(ctx, e, view) {
        ensure(view);
        const s = pick(SPR.sprout.walk[Math.floor(e.anim * 4.5) & 3], e, view);
        drawBody(ctx, e, view, s, e.x, e.y, 1, 1, 0.55);
      },
    },
    icons: ICONS,
    shot(ctx, s, view) {
      ensure(view);
      const y = s.y - s.z;
      const a = s.angle !== undefined ? s.angle : Math.atan2(s.vy, s.vx);
      const k = Math.min(1, s.age * 6);
      ctx.globalAlpha = 0.85;
      blitRot(ctx, SPR.juiceTrail, s.x, y, a, 0.5 + 0.5 * k);
      ctx.globalAlpha = 0.5 + 0.15 * Math.sin(view.rt * 20 + s.seed * 9);
      blitS(ctx, SPR.gLime.c, SPR.gLime, s.x, y, 0.8, 0.8);
      ctx.globalAlpha = 1;
      const wob = Math.sin(view.rt * 22 + s.seed * 13) * 0.1;
      ctx.save();
      ctx.translate(s.x, y);
      ctx.rotate(a);
      ctx.scale((1.25 + wob) * kk, (1.25 - wob) * kk);
      const sp = SPR.juice[Math.floor(view.rt * 7 + s.seed * 3) % 3];
      ctx.drawImage(sp.c, -sp.ax, -sp.ay);
      ctx.restore();
    },
  });
})();
