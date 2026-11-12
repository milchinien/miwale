/* Ukiyo-e Woodblock — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Every image is "printed" from blocks: a kinari paper underlay, flat colour blocks with ONE bokashi
   gradient laid slightly off-register (+0.38 / +0.30 units), one sumi key block whose stamped lines
   swell, taper and grow heavier towards the lower right, and washi fibres showing through everything.
   Motion is hand-printed: held poses from a pose table (8-pose walk with lagging sleeves, hat and cords),
   per-actor phases, a key-block-only hit flash and a layered impact (star -> splat -> speed lines). */
(function (root) {
  'use strict';
  const PALETTE = {
    paper: '#f2e8d2', paperWhite: '#fbf5e6', sumi: '#1e1b19', margin: '#efe4cb',
    indigo: '#2d4a72', indigoLight: '#5a7aa0', indigoDeep: '#1c3150',
    vermilion: '#cf4a2c', vermilionLight: '#e7845a', vermilionDeep: '#9e321e',
    ochre: '#d8b264', ochreLight: '#eed79c', ochreDeep: '#a9813d',
    prussian: '#24527e', prussianLight: '#7ea6c4', prussianDeep: '#173a5e',
    pine: '#3d5a45', pineLight: '#748f61', pineDeep: '#2a4031',
    meadowCream: '#eee4c7', meadowOchre: '#e6cf96', meadowSage: '#c7cf98', shoreCeladon: '#d6e0ce',
    moss: '#96aa74', mossEdge: '#688558', road: '#e7d4a8', roadEdge: '#c2a372',
    kappa: '#5f9466', kappaLight: '#8fb886', kappaDeep: '#3a684a',
    gold: '#d9a93b', skin: '#efd5ae', skinDeep: '#d8b387', pink: '#f0c3c3', usuzumi: '#4b4f58',
  };
  const P = PALETTE, TAU = Math.PI * 2, PI = Math.PI;
  const REG = [0.38, 0.3];          // colour blocks print off-register by this much (world units)
  const LX = 0.6, LY = 0.8;         // key lines swell towards the lower right

  /* ---------- tiny deterministic helpers ---------- */
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return { c, ctx: c.getContext('2d') }; };
  const outQuad = (q) => 1 - (1 - q) * (1 - q), inQuad = (q) => q * q;
  function spline(pts, closed, seg) {
    seg = seg || 7; const n = pts.length, out = [], last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      for (let k = 0; k < seg; k++) {
        const t = k / seg, t2 = t * t, t3 = t2 * t;
        const f = (j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3);
        out.push([f(0), f(1)]);
      }
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }
  function ell(cx, cy, rx, ry) { const n = Math.max(16, Math.ceil((rx + ry) * 3)), o = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
  function poly(pts, step) { const o = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (step || 0.8))); for (let j = 0; j < k; j++) o.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]); } return o; }
  function capsule(x1, y1, x2, y2, r1, r2) { const a = Math.atan2(y2 - y1, x2 - x1), o = []; for (let i = 0; i <= 8; i++) { const t = a + PI / 2 + (i / 8) * PI; o.push([x1 + Math.cos(t) * r1, y1 + Math.sin(t) * r1]); } for (let i = 0; i <= 8; i++) { const t = a - PI / 2 + (i / 8) * PI; o.push([x2 + Math.cos(t) * r2, y2 + Math.sin(t) * r2]); } return poly(o, 0.7); }
  function xf(pts, dx, dy, rot) { const co = Math.cos(rot), si = Math.sin(rot); return pts.map(([x, y]) => [dx + x * co - y * si, dy + x * si + y * co]); }
  function trace(c, pts, closed) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); if (closed !== false) c.closePath(); }

  /* ---------- the key block: stamped brush ribbon ---------- */
  let seedN = 1;
  function ink(c, pts, w, o) {
    o = o || {};
    const closed = !!o.closed, n = pts.length;
    const vary = o.vary !== undefined ? o.vary : 0.3, side = o.side !== undefined ? o.side : closed ? 0.45 : 0.15;
    const taper = o.taper !== undefined ? o.taper : closed ? 0 : Math.max(0.8, w * 2.4), seed = (seedN++ * 2.399) % 50;
    let sg = 1;
    if (closed) { let a = 0; for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } sg = a >= 0 ? 1 : -1; }
    const segs = closed ? n : n - 1;
    let total = 0;
    for (let i = 0; i < segs; i++) { const p = pts[i], q = pts[(i + 1) % n]; total += Math.hypot(q[0] - p[0], q[1] - p[1]); }
    const step = Math.max(0.04, w * 0.2);
    c.beginPath();
    let s = 0, next = 0;
    for (let i = 0; i < segs; i++) {
      const p = pts[i], q = pts[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
      if (L < 1e-6) continue;
      const tx = dx / L, ty = dy / L, nd = sg * ty * LX - sg * tx * LY;
      while (next <= s + L) {
        const d = next - s, x = p[0] + tx * d, y = p[1] + ty * d;
        let k = (1 + vary * (0.55 * Math.sin(next * 0.85 + seed) + 0.45 * Math.sin(next * 2.3 + seed * 1.7))) * (1 + side * nd);
        if (taper > 0) { const e = Math.min(next, total - next) / taper; if (e < 1) k *= 0.2 + 0.8 * Math.sin(Math.max(0, e) * PI * 0.5); }
        const r = Math.max(0.04, w * k * 0.5);
        c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
        next += step;
      }
      s += L;
    }
    c.fillStyle = o.col || P.sumi; c.fill();
  }
  /* ---------- one printed part: paper underlay, off-register colour block, key line ---------- */
  function part(c, pts, fill, o) {
    o = o || {};
    c.beginPath(); trace(c, pts); c.fillStyle = P.paper; c.fill();
    c.save(); c.translate(REG[0], REG[1]); c.beginPath(); trace(c, pts);
    if (typeof fill === 'function') { c.save(); c.clip(); fill(c); c.restore(); } else { c.fillStyle = fill; c.fill(); }
    if (o.detail) { c.save(); c.beginPath(); trace(c, pts); c.clip(); o.detail(c); c.restore(); }
    c.restore();
    if (o.ink !== 0) ink(c, pts, o.ink || 0.95, { closed: true });
  }
  const bk = (y0, y1, a, b) => (c) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(-300, -300, 600, 600); };

  /* ---------- washi fibres + baking ---------- */
  let FIB = null;
  function fibres() {
    if (FIB) return FIB;
    const { c, ctx } = canvas(160, 160), r = rng(9137);
    ctx.lineCap = 'round';
    for (let i = 0; i < 170; i++) {
      const x = r() * 160, y = r() * 160, a = r() * TAU, L = 4 + r() * 14;
      ctx.strokeStyle = r() < 0.62 ? 'rgba(255,250,236,0.24)' : 'rgba(70,52,30,0.13)'; ctx.lineWidth = 0.6 + r() * 0.8;
      for (const ox of [-160, 0, 160]) for (const oy of [-160, 0, 160]) { ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.lineTo(x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L); ctx.stroke(); }
    }
    return (FIB = c);
  }
  /** Bake a sprite once: box [l,t,r,b] in world units, K px per unit. Returns {c, ox, oy, K}. */
  function bake(box, K, fn, plainFx) {
    const { c, ctx } = canvas((box[2] - box[0]) * K, (box[3] - box[1]) * K);
    ctx.setTransform(K, 0, 0, K, -box[0] * K, -box[1] * K); ctx.lineJoin = ctx.lineCap = 'round';
    fn(ctx);
    if (!plainFx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = ctx.createPattern(fibres(), 'repeat'); ctx.fillRect(0, 0, c.width, c.height); }
    return { c, ox: -box[0] * K, oy: -box[1] * K, K };
  }
  /** Hit flash derived per pixel: only the key block stays, colour blocks become unprinted paper. */
  function flashCopy(s) {
    const { c, ctx } = canvas(s.c.width, s.c.height);
    ctx.drawImage(s.c, 0, 0);
    const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11, t = Math.min(1, Math.max(0, (l - 40) / 42));
      d[i] = 30 + 221 * t; d[i + 1] = 27 + 218 * t; d[i + 2] = 25 + 205 * t;
    }
    ctx.putImageData(img, 0, 0);
    return { c, ox: s.ox, oy: s.oy, K: s.K };
  }
  /** Draw a baked sprite with its feet at (x, y): k = px per world unit, sx/sy squash, rot lean. */
  function blit(ctx, s, x, y, k, flip, sx, sy, rot) {
    const sc = k / s.K;
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale((flip ? -1 : 1) * (sx || 1), sy || 1);
    ctx.drawImage(s.c, -s.ox * sc, -s.oy * sc, s.c.width * sc, s.c.height * sc); ctx.restore();
  }

  /* ---------- main character: traveller in a straw sugegasa, driven by a pose table ---------- */
  // foot x / lift (back, front), body drop (+ down), lean, sleeve swing (back, front), cord streaming, hat lag
  const HP = (bf, bl, ff, fl, by, lean, bs, fs, cord, hy) => ({ bf, bl, ff, fl, by, lean, bs, fs, cord, hy });
  const WALK = [
    HP(-4.2, 0.3, 4.4, 0, 0.25, 0.5, 0.24, -0.26, 0.35, 0.2),    // contact (near foot forward)
    HP(-3.0, 1.1, 2.6, 0, 0.85, 0.6, 0.42, -0.46, 0.55, -0.3),   // down: sleeves still swinging from the last step
    HP(0.4, 2.3, 0.2, 0, 0.05, 0.5, 0.3, -0.34, 0.75, 0.35),     // passing: the cords stream back
    HP(2.8, 1.3, -2.2, 0.1, -0.55, 0.4, 0.04, -0.06, 0.5, 0.3),  // up
    HP(4.4, 0, -4.2, 0.3, 0.25, 0.5, -0.26, 0.24, 0.35, -0.4),   // contact (far foot forward)
    HP(2.6, 0, -3.0, 1.1, 0.85, 0.6, -0.46, 0.42, 0.55, -0.3),   // down
    HP(0.2, 0, 0.4, 2.3, 0.05, 0.5, -0.34, 0.3, 0.75, 0.35),     // passing
    HP(-2.2, 0.1, 2.8, 1.3, -0.55, 0.4, -0.06, 0.04, 0.5, 0.3),  // up
  ];
  function leg(c, hx, hy, fx, lift, back) {
    part(c, capsule(hx, hy, fx, -1.7 - lift, 1.6, 1.12), back ? '#b7ad93' : bk(hy, -1, '#f3ead2', '#cfc3a1'), { ink: 0.7 });
    part(c, ell(fx + 0.75, -0.8 - lift, 2.35, 0.95), back ? P.ochreDeep : bk(-1.8 - lift, 0.2 - lift, P.ochreLight, P.ochre), { ink: 0.55 });
    ink(c, [[fx - 0.4, -1.65 - lift], [fx + 1.8, -0.95 - lift]], 0.4, { col: back ? P.vermilionDeep : P.vermilion });
  }
  function sleeve(c, sx, sy, ang, back) {
    const pts = xf(spline([[-2, -0.5], [2, -0.6], [2.8, 4.6], [2.6, 7.4], [-0.2, 8.4], [-2.6, 7.6], [-2.9, 3]], true, 5), sx, sy, -ang);
    const hand = xf([[1.1, 8.9]], sx, sy, -ang)[0];
    part(c, pts, back ? '#14233a' : bk(sy, sy + 8, '#7393b8', '#24406a'), { ink: back ? 0.75 : 0.9 });
    part(c, ell(hand[0], hand[1], 1.2, 1.1), back ? P.skinDeep : P.skin, { ink: 0.5 });
  }
  function cords(c, s) {   // two vermilion hat cords: 0 = hanging, 1 = streaming straight back
    const a = 0.25 + s * 1.15, co = Math.cos(a), si = Math.sin(a);
    for (const [len, off, wv] of [[7.2, 0, 0.9], [5.6, 0.7, -0.7]]) {
      const pts = [];
      for (let i = 0; i <= 4; i++) { const t = i / 4, d = len * t, w = Math.sin(t * PI * 1.6 + off * 3) * wv * (0.4 + s * 0.6) * t; pts.push([-1.6 - si * d - co * w * 0.4, -22 + off + co * d - si * w]); }
      ink(c, spline(pts, false, 6), 0.62, { col: off ? P.vermilionDeep : P.vermilion, taper: 1.6, side: 0 });
    }
  }
  function heroParts(c, p) {
    const hip = -8.4 + p.by;
    const upper = (fn) => { c.save(); c.translate(0, hip); c.rotate(p.lean * 0.05); c.translate(p.lean * 0.18, -hip + p.by); fn(); c.restore(); };
    upper(() => {
      ink(c, [[1.2, -12.8], [-12, -7.5 - p.lean * 0.4]], 1.9, { taper: 0.4, side: 0, vary: 0.05 });   // scabbard
      sleeve(c, -2.6, -19.6, p.bs, true);
      part(c, spline([[-6.2, -20], [-3.4, -19.6], [-3, -15.6], [-4.6, -13.2], [-7.6, -13.6], [-9.2, -16.4], [-8.4, -19.2]], true, 5), bk(-20, -13, '#efe2bf', '#cdb582'), { ink: 0.75 });
      cords(c, p.cord);
    });
    leg(c, -1.4, hip, p.bf, p.bl, true);
    leg(c, 1.5, hip, p.ff, p.fl, false);
    upper(() => {
      part(c, spline([[-4.4, -20.6], [0.2, -21.3], [4.6, -20.4], [5.6, -15.5], [6.4, -8.8], [5.2, -6.9], [0.2, -6.5], [-5, -6.9], [-6, -9], [-5.4, -15.5]], true, 5),
        bk(-21.3, -6.5, '#3b5b86', '#15253d'), {
          ink: 1.05,
          detail(k) {   // paper-white kasuri crosses
            k.strokeStyle = 'rgba(246,238,220,0.92)'; k.lineWidth = 0.44; k.lineCap = 'round'; k.beginPath();
            for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const x = -4.6 + i * 2.6 + (j & 1) * 1.3, y = -19.2 + j * 2.7; k.moveTo(x - 0.55, y - 0.55); k.lineTo(x + 0.55, y + 0.55); k.moveTo(x + 0.55, y - 0.55); k.lineTo(x - 0.55, y + 0.55); }
            k.stroke();
          },
        });
      part(c, poly([[-5.75, -14.1], [5.85, -14.5], [6.1, -11.3], [-5.9, -11]]), bk(-14.5, -11, P.vermilionLight, P.vermilionDeep), { ink: 0.65 });   // obi
      ink(c, [[3, -12.9], [8.7, -16 - p.lean * 0.3]], 1.45, { taper: 0.3, side: 0 });                                                  // hilt
      sleeve(c, 0.8, -19.8, p.fs, false);
      part(c, ell(-0.7, -21, 1.9, 2), P.sumi, { ink: 0.35 });                                                                      // hair
      part(c, ell(1.9, -20.3, 3.3, 2.85), bk(-23.2, -17.5, P.skin, P.skinDeep), { ink: 0.65 });
      c.fillStyle = P.sumi; c.beginPath(); c.arc(3.85, -20.75, 0.5, 0, TAU); c.fill();
      c.save(); c.translate(0, p.hy);   // the hat lags the body drop
      const hat = poly([[0.9, -32.6], [12.1, -24.2]]).concat(Array.from({ length: 17 }, (_, i) => { const a = ((i + 1) / 18) * PI; return [0.5 + Math.cos(a) * 11.6, -24.2 + Math.sin(a) * 1.5]; })).concat(poly([[-11.1, -24.2], [0.9, -32.6]]));
      part(c, hat, (k) => { const g = k.createLinearGradient(0, -32.5, 0, -22.7); g.addColorStop(0, '#ecc775'); g.addColorStop(0.45, '#cf9e4f'); g.addColorStop(1, '#94672b'); k.fillStyle = g; k.fillRect(-20, -40, 40, 20); }, { ink: 1.15 });
      for (let i = -3; i <= 3; i++) ink(c, [[0.9 + i * 0.4, -31.7], [0.5 + i * 3.25, -23.5]], 0.28, { col: '#5a4122', taper: 1.2 });
      c.restore();
    });
  }
  /* ---------- a typical creature: kappa with a water dish, 4 waddle poses ---------- */
  function kappaParts(c, f) {
    const st = [0, 1, 0, -1][f], lift = (s) => Math.max(0, s) * 1.2;
    part(c, spline([[-3, -15.4], [-7.2, -13.6], [-8.9, -8.6], [-7.6, -3.6], [-3.4, -2.6], [-2.2, -8.8]], true, 6), bk(-15, -3, '#a37d4f', '#5a3f28'), { ink: 0.85 });
    part(c, capsule(-2.2, -5, -2.6 + st * 1.4, -1.1 - lift(st), 1.5, 1.2), P.kappaDeep, { ink: 0.7 });
    part(c, spline([[-4.4, -14.8], [0.6, -15.8], [4.8, -13.6], [5.6, -8], [4, -3.2], [-0.4, -2.2], [-4.2, -3.6], [-5.4, -9]], true, 6), bk(-16, -2, P.kappaLight, P.kappaDeep), { ink: 0.95 });
    part(c, ell(2.7, -8.4, 2.5, 4.6), bk(-13, -3.8, '#f2e2b4', '#cdae70'), { ink: 0.55 });
    part(c, capsule(1.8, -4.6, 2.2 - st * 1.4, -1.1 - lift(-st), 1.55, 1.25), P.kappa, { ink: 0.7 });
    part(c, spline([[-3.8, -19.6], [0.8, -22.4], [5.4, -20.8], [6.6, -17.2], [5, -13.6], [0.6, -12.6], [-3.8, -14.2], [-4.8, -17]], true, 6), bk(-22.4, -12.6, P.kappaLight, P.kappa), { ink: 0.95 });
    part(c, spline([[5.2, -18.8], [8.2, -17.9], [10.5, -16.2], [8, -15], [5, -14.9]], true, 5), bk(-18.8, -14.9, P.ochreLight, P.ochreDeep), { ink: 0.7 });
    part(c, ell(2.7, -18.5, 1.95, 2.15), P.paperWhite, { ink: 0.5 });
    c.fillStyle = P.sumi; c.beginPath(); c.arc(3.4, -18.3, 1.02, 0, TAU); c.fill();
    const fr = [];
    for (let i = 0; i <= 16; i++) { const a = PI * 1.04 + (i / 16) * PI * 0.92, r = i & 1 ? 1 : 1.32; fr.push([0.6 + Math.cos(a) * 5 * r, -20.2 + Math.sin(a) * 2.5 * r]); }
    for (let i = 10; i >= 0; i--) { const a = PI * 1.04 + (i / 10) * PI * 0.92; fr.push([0.6 + Math.cos(a) * 4.3, -20.6 + Math.sin(a) * 1.4]); }
    part(c, fr, '#2b2724', { ink: 0.45 });
    part(c, ell(0.6, -22.2, 3.2, 1.15), bk(-23.3, -21.1, '#eef2e6', '#b9cbc4'), { ink: 0.5 });
  }

  /* ---------- cached bakes ---------- */
  let cacheK = 0, HERO = null, KAPPA = null, KAPPA_F = null, PINE = null, GATE = null, TOMOE = null, STAR = null;
  function ensure(K) {
    if (cacheK === K) return;
    cacheK = K;
    HERO = WALK.map((p) => bake([-16, -36, 18, 2], K, (c) => heroParts(c, p)));
    KAPPA = [0, 1, 2, 3].map((f) => bake([-11, -26, 12, 2], K, (c) => kappaParts(c, f)));
    KAPPA_F = KAPPA.map(flashCopy);
    PINE = bake([-27, -70, 32, 3], K, (c) => {
      part(c, capsule(0, 0, 3, -50, 3.2, 1.3), bk(-50, 0, '#8f725a', '#4a3628'), { ink: 1.0 });
      for (const [x, y, rx, ry] of [[0.5, -63, 7.5, 3.6], [-6, -47, 12, 5], [9, -55, 9.5, 4.4], [12, -38, 11.5, 4.8], [-11, -31, 10, 4.4]]) {
        const pts = []; for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU, s = Math.sin(a); pts.push([x + Math.cos(a) * rx, y + s * ry * (s > 0 ? 0.5 : 1)]); }
        part(c, spline(pts, true, 4), bk(y - ry, y + ry * 0.5, P.pineLight, P.pineDeep), { ink: 0.95, detail(k) { k.strokeStyle = P.pineDeep; k.lineWidth = 0.3; k.beginPath(); for (let px = x - rx * 0.75; px < x + rx * 0.8; px += 3.1) for (let j = -3; j <= 3; j++) { k.moveTo(px, y - ry * 0.2); k.lineTo(px + Math.sin(j * 0.32) * ry, y + ry * 0.5); } k.stroke(); } });
      }
    });
    GATE = bake([-30, -47, 30, 2], K, (c) => {
      for (const x of [-18, 18]) part(c, poly([[x - 1.7, 0], [x + 1.7, 0], [x + 1.2, -38.2], [x - 1.2, -38.2]]), bk(-38, 0, P.vermilionLight, P.vermilionDeep), { ink: 1.0 });
      part(c, poly([[-24.6, -31], [24.6, -31], [24.6, -28.2], [-24.6, -28.2]]), P.vermilion, { ink: 0.85 });
      part(c, poly([[-23.4, -38.4], [23.4, -38.4], [23.4, -35.9], [-23.4, -35.9]]), P.vermilion, { ink: 0.8 });
      part(c, spline([[-28.6, -43.4], [-22, -40.4], [0, -39.6], [22, -40.4], [28.6, -43.4], [27.9, -45.2], [22, -43.4], [0, -42.6], [-22, -43.4], [-27.9, -45.2]], true, 4), '#2a2523', { ink: 0.9 });
    });
    TOMOE = bake([-7.4, -7.4, 7.4, 7.4], K, (c) => {
      part(c, ell(0, 0, 6.5, 6.5), P.vermilion, { ink: 0.85 });
      part(c, ell(0, 0, 4.9, 4.9), '#f7efdc', { ink: 0.4 });
      c.beginPath();
      for (let k = 0; k < 3; k++) for (let t = 0; t <= 1; t += 0.02) { const a = (k / 3) * TAU - t * 2.2, rr = 4.9 * (0.44 + 0.36 * t), w = 4.9 * (0.21 * Math.pow(1 - t, 0.75) + 0.012); c.moveTo(Math.cos(a) * rr + w, Math.sin(a) * rr); c.arc(Math.cos(a) * rr, Math.sin(a) * rr, w, 0, TAU); }
      c.fillStyle = P.sumi; c.fill();
    });
    // impact star: nine jagged points in unprinted paper, a sumi key line, an off-register vermilion heart
    STAR = bake([-8, -8, 8, 8], K, (c) => {
      const pts = [];
      for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU - PI / 2, r = i & 1 ? 2.3 + (i % 3) * 0.3 : 5 + ((i * 7) % 5) * 0.45; pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.9]); }
      part(c, pts, P.paperWhite, { ink: 0.62 });
      c.save(); c.translate(REG[0], REG[1]); c.beginPath(); trace(c, pts.map(([x, y]) => [x * 0.42, y * 0.42])); c.fillStyle = P.vermilion; c.fill(); c.restore();
    }, true);
  }

  /** Main character walking, feet at (x, y); k = px per world unit (default 2.5). Held poses, no tween. */
  function drawHero(ctx, x, y, t, facing, size) {
    const k = size || 2.5; ensure(Math.max(3, Math.round(k * 1.6)));
    const f = Math.floor(t * 11.6) & 7, up = Math.max(0, -WALK[f].by);   // one held pose per 1/11.6 s
    ctx.fillStyle = 'rgba(75,79,88,0.22)'; ctx.beginPath(); ctx.ellipse(x + k * 0.5, y + k * 0.35, (9 - up * 1.3) * k, (3 - up * 0.4) * k, 0, 0, TAU); ctx.fill();
    blit(ctx, HERO[f], x, y, k, facing < 0);
  }
  /** A typical creature (kappa), feet at (x, y). hit = seconds since it was struck (or -1). */
  function drawEnemy(ctx, x, y, t, size, hit, phase) {
    const k = size || 2.5; ensure(Math.max(3, Math.round(k * 1.6)));
    const ph = t * 1.3 + (phase || 0), f = Math.floor(ph * 4) & 3, sn = Math.sin(ph * TAU), up = Math.abs(sn);
    let sx = 1 + (1 - up) * 0.05, sy = 1 - (1 - up) * 0.05, rot = sn * 0.07, dx = 0;
    const q = hit >= 0 && hit < 0.15 ? hit / 0.15 : -1;                  // hit: squash + rebound, knock-back lean
    if (q >= 0) { const w = Math.cos(q * PI * 1.4) * (1 - q); sx *= 1 + 0.15 * w; sy *= 1 - 0.13 * w; rot += 0.26 * Math.pow(1 - q, 1.5); dx = 1.2 * (1 - q) * k; }   // pushed along +x, away from the blow
    ctx.fillStyle = 'rgba(75,79,88,0.22)'; ctx.beginPath(); ctx.ellipse(x + k * 0.5, y + k * 0.35, 8.2 * k, 2.7 * k, 0, 0, TAU); ctx.fill();
    blit(ctx, KAPPA[f], x + dx, y - up * 0.9 * k, k, true, sx, sy, rot);
    if (q >= 0) { ctx.globalAlpha = q < 0.43 ? 1 : 1 - (q - 0.43) / 0.57; blit(ctx, KAPPA_F[f], x + dx, y - up * 0.9 * k, k, true, sx, sy, rot); ctx.globalAlpha = 1; }
  }
  /** Layered impact at (x, y): splat under a paper-white star, three carved speed lines along dir. u = 0..1 over 0.26 s. */
  function drawImpact(ctx, x, y, u, dir, k) {
    if (u < 0 || u >= 1) return;
    const t = u * 0.26;
    ctx.fillStyle = P.sumi; ctx.globalAlpha = u > 0.55 ? 1 - (u - 0.55) / 0.45 : 1;             // 1 splat (0.26 s)
    const r = rng(41), sp = (u < 0.2 ? 0.55 + u * 2.5 : 1.05) * 2.2 * k;
    ctx.beginPath(); ctx.arc(x, y, sp, 0, TAU);
    for (let i = 0; i < 6; i++) { const a = r() * TAU, d = (3.2 + r() * 2.5) * k * (sp / (2.3 * k)); ctx.moveTo(x + Math.cos(a) * d + 0.6 * k, y + Math.sin(a) * d); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 0.6 * k, 0, TAU); }
    ctx.fill(); ctx.globalAlpha = 1;
    if (t < 0.15) {                                                                            // 2 star (0.15 s)
      const q = t / 0.15, s = q < 0.4 ? 0.5 + 0.65 * outQuad(q / 0.4) : 1.15 - (q - 0.4) * 0.5;
      ctx.globalAlpha = q > 0.5 ? 1 - (q - 0.5) / 0.5 : 1; blit(ctx, STAR, x, y, k * 0.86 * s); ctx.globalAlpha = 1;
    }
    if (t < 0.2) {                                                                             // 3 speed lines (0.2 s)
      const q = t / 0.2;
      for (let i = -1; i <= 1; i++) {
        const a = dir + i * 0.62, L = 7 * k, r1 = 2.5 * k + L * outQuad(Math.min(1, q * 2.4)), r0 = 2.5 * k + L * (q < 0.3 ? 0 : inQuad((q - 0.3) / 0.7));
        if (r1 - r0 < 0.4 * k) continue;
        const co = Math.cos(a), si = Math.sin(a) * 0.72, w = 0.62 * k * (1 - q * 0.4);
        const ax = x + co * r0, ay = y + si * r0, bx = x + co * r1, by = y + si * r1, mx = ax + (bx - ax) * 0.35, my = ay + (by - ay) * 0.35;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx - si * w, my + co * w); ctx.lineTo(bx, by); ctx.lineTo(mx + si * w, my - co * w); ctx.fill();
      }
    }
  }

  /* ---------- ground: composed, colour follows the land (cached) ---------- */
  let GR = null;
  function roadX(w, h, y) { const v = y / h; return w * (0.67 - v * 0.27) + Math.sin(v * PI) * w * 0.035; }
  function ground(w, h, k) {
    if (GR && GR.w === w && GR.h === h) return GR;
    const { c, ctx } = canvas(w, h);
    ctx.lineJoin = ctx.lineCap = 'round';
    const wash = ctx.createLinearGradient(0, 0, w, h);                         // broad ochre -> cream wash
    wash.addColorStop(0, P.meadowCream); wash.addColorStop(0.55, P.meadowCream); wash.addColorStop(1, P.meadowOchre);
    ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h);
    const moss = spline([[w * 0.74, h * 1.05], [w * 0.77, h * 0.66], [w * 0.88, h * 0.52], [w * 1.05, h * 0.44], [w * 1.05, h * 1.05]], true, 10);
    const pcx = w * 0.17, pcy = h * 0.8, prx = h * 0.34, pry = h * 0.19, pond = ell(pcx, pcy, prx, pry);
    // distance skirts: overlapping wide strokes of the region outline = a bokashi that follows the edge
    const skirt = (pts, rgb, reach, a) => { for (let i = 0; i < 6; i++) { ctx.lineWidth = reach * 2 * k * (1 - i / 6); ctx.strokeStyle = 'rgba(' + rgb + ',' + a + ')'; ctx.beginPath(); trace(ctx, pts); ctx.stroke(); } };
    skirt(moss, '199,207,152', 30, 0.17);
    skirt(pond, '214,224,206', 18, 0.15);
    // road: earth bokashi edge -> inner, two ruts, tinted key lines on both verges
    const L = [], R = [], hw = 11 * k;
    for (let y = -10; y <= h + 10; y += 6) { const x = roadX(w, h, y); L.push([x - hw, y]); R.push([x + hw, y]); }
    const band = (d) => L.map(([x, y]) => [x + hw - d, y]).concat(R.map(([x, y]) => [x - hw + d, y]).reverse());
    ctx.fillStyle = P.roadEdge; ctx.beginPath(); trace(ctx, band(hw)); ctx.fill();
    ctx.fillStyle = '#d8bf8c'; ctx.beginPath(); trace(ctx, band(hw - 2.5 * k)); ctx.fill();
    ctx.fillStyle = P.road; ctx.beginPath(); trace(ctx, band(hw - 5 * k)); ctx.fill();
    ctx.strokeStyle = 'rgba(124,92,60,0.18)'; ctx.lineWidth = 0.6 * k;
    for (const s of [-1, 1]) { ctx.beginPath(); trace(ctx, L.map(([x, y]) => [x + hw + s * (hw - 4.6 * k), y]), false); ctx.stroke(); }
    ink(ctx, L, 0.6 * k, { col: '#7c5c3c', taper: 0 }); ink(ctx, R, 0.6 * k, { col: '#7c5c3c', taper: 0 });
    // moss: edge colour, inner colour inset, deep-green key line
    ctx.fillStyle = P.mossEdge; ctx.beginPath(); trace(ctx, moss); ctx.fill();
    ctx.save(); ctx.beginPath(); trace(ctx, moss); ctx.clip();
    ctx.fillStyle = P.moss; ctx.translate(w * 0.045, h * 0.05); ctx.beginPath(); trace(ctx, moss); ctx.fill(); ctx.restore();
    ink(ctx, moss, 0.6 * k, { closed: true, col: '#405a3a' });
    // pond: depth bokashi, seigaiha in the deep, three paper contour lines, sumi shore line
    ctx.save(); ctx.beginPath(); trace(ctx, pond); ctx.clip();
    const g = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, prx); g.addColorStop(0, '#1e456e'); g.addColorStop(0.6, '#27547f'); g.addColorStop(0.88, '#7aa3bc'); g.addColorStop(1, '#a8c5c9');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const RR = 7 * k; ctx.strokeStyle = 'rgba(132,170,198,0.5)'; ctx.lineWidth = 0.45 * k;
    for (let j = 0; j * RR * 0.5 < h + RR; j++) for (let i = -1; i * 2 * RR < w * 0.45; i++) { const x = i * 2 * RR + (j & 1 ? RR : 0), y = j * RR * 0.5; for (let q = 1; q <= 4; q++) { ctx.beginPath(); ctx.arc(x, y, (RR * q) / 4, PI, TAU); ctx.stroke(); } }
    ctx.restore();
    ctx.strokeStyle = 'rgba(233,239,233,0.75)'; ctx.lineWidth = 0.55 * k;
    for (const d of [2.4, 5, 7.6]) { ctx.beginPath(); ctx.ellipse(pcx, pcy, prx - d * k, pry - d * k, 0, 0, TAU); ctx.stroke(); }
    ink(ctx, pond, 0.95 * k, { closed: true });
    // grass: tight clumps on the meadow + a skirt along the moss rim; never an even sprinkle
    const mossPath = new Path2D(); trace(mossPath, moss);
    const free = (x, y) => Math.hypot((x - pcx) / prx, (y - pcy) / pry) > 1.12 && Math.abs(x - roadX(w, h, y)) > hw + 3 * k && !ctx.isPointInPath(mossPath, x, y) && y > h * 0.12;
    const tuft = (x, y, s, col, r) => { ctx.fillStyle = col; ctx.beginPath(); for (let b = 0; b < 4; b++) { const a = -0.75 + b * 0.5 + (r() - 0.5) * 0.35, Lb = (2.3 + r() * 2) * s, bx = x + (b - 1.5) * 0.75 * s; ctx.moveTo(bx - 0.34 * s, y); ctx.quadraticCurveTo(bx + Math.sin(a) * Lb * 0.4, y - Math.cos(a) * Lb * 0.55, bx + Math.sin(a) * Lb, y - Math.cos(a) * Lb); ctx.quadraticCurveTo(bx + Math.sin(a) * Lb * 0.4 + 0.3 * s, y - Math.cos(a) * Lb * 0.55, bx + 0.34 * s, y); } ctx.fill(); };
    const r = rng(77);
    for (let cl = 0; cl < 13; cl++) {
      const cx = r() * w, cy = h * 0.15 + r() * h * 0.82, n = 3 + Math.floor(r() * 5), flowers = cl % 4 === 1;
      for (let i = 0; i < n; i++) { const x = cx + (r() - 0.5) * 16 * k, y = cy + (r() - 0.5) * 8 * k; if (free(x, y)) tuft(x, y, (0.8 + r() * 0.45) * k, r() < 0.5 ? '#6c8858' : '#56744c', r); }
      if (flowers) for (let i = 0; i < 5; i++) {                                // one colour per flower patch
        const x = cx + (r() - 0.5) * 14 * k, y = cy + (r() - 0.5) * 7 * k;
        if (!free(x, y)) continue;
        ctx.fillStyle = '#d0573d'; ctx.beginPath(); for (let p = 0; p < 5; p++) { const a = (p / 5) * TAU, px = x + Math.cos(a) * 0.75 * k, py = y + Math.sin(a) * 0.75 * k; ctx.moveTo(px + 0.55 * k, py); ctx.arc(px, py, 0.55 * k, 0, TAU); } ctx.fill();
        ctx.fillStyle = '#e9c454'; ctx.beginPath(); ctx.arc(x, y, 0.35 * k, 0, TAU); ctx.fill();
      }
    }
    for (let i = 0; i < moss.length; i += 3) {                                   // skirt: denser close to the edge
      const [ex, ey] = moss[i], d = r() * r() * 16 * k;
      const x = ex - d * 0.8, y = ey - d * 0.6;
      if (r() < 0.75 && free(x, y)) tuft(x, y, (0.75 + r() * 0.4) * k, '#6c8858', r);
    }
    GR = { w, h, c };
    return GR;
  }

  /* ---------- complete preview scene ---------- */
  function draw(ctx, w, h, t) {
    const k = h / 360;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(ground(w, h, k).c, 0, 0);
    ensure(Math.max(3, Math.round(k * 1.6)));
    // slow ripple rings on the pond (ambient motion, slower than the actors)
    ctx.strokeStyle = 'rgb(236,240,232)'; ctx.lineWidth = 0.38 * k;
    for (let i = 0; i < 3; i++) {
      const ph = (t / (4 + i * 1.3) + i * 0.37) % 1, a = Math.sin(ph * PI), x = w * 0.12 + i * 22 * k, y = h * 0.8 + (i - 1) * 9 * k;
      for (let j = 0; j < 2; j++) { const q = Math.min(1, Math.max(0, ph * 1.15 - j * 0.18)), rx = (2 + q * 8 + j * 1.5) * k; ctx.globalAlpha = a * (j ? 0.35 : 0.6) * (1 - q * 0.5); ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.36, 0, PI * 0.08, PI * 1.92); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    // composed props: an avenue pine on each verge, a torii astride the road, a pine on the moss rim
    const sway = (i) => Math.sin(t * 1.2 + i * 1.7) * 0.018;
    const prop = (s, x, y, i, flip) => { ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -sway(i), 1, 0, 0); blit(ctx, s, 0, 0, k, flip); ctx.restore(); };
    const ry0 = h * 0.33, ry1 = h * 0.47, ry2 = h * 0.62;
    prop(PINE, roadX(w, h, ry0) + 22 * k, ry0, 0, false);
    blit(ctx, GATE, roadX(w, h, ry1), ry1, k);
    prop(PINE, roadX(w, h, ry2) - 24 * k, ry2, 1, true);
    // actors in y order: a kappa struck every 1.2 s with a layered impact, a second one waddling, the traveller
    const hitT = t % 1.2, kx = w * 0.84, ky = h * 0.74;
    drawEnemy(ctx, w * 0.34 + Math.sin(t * 0.6) * 10 * k, h * 0.55, t, k, -1, 0.37);
    const hx = w * 0.5 + Math.sin(t * 0.5) * 70 * k, hy = h * 0.72;
    drawHero(ctx, hx, hy, t, Math.cos(t * 0.5) >= 0 ? 1 : -1, k);
    drawEnemy(ctx, kx, ky, t, k, hitT, 0);
    drawImpact(ctx, kx - 3 * k, ky - 12 * k, hitT / 0.26, 0, k);
    for (let i = 0; i < 2; i++) {   // orbiting mitsudomoe crests
      const a = t * 2.4 + i * PI, ox = hx + Math.cos(a) * 44 * k, oy = hy - 10 * k + Math.sin(a) * 37 * k;
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(t * 6); blit(ctx, TOMOE, 0, 0, k); ctx.restore();
    }
    // falling petals (deterministic in t)
    for (let i = 0; i < 12; i++) {
      const r = rng(500 + i), ph = (t / (7 + r() * 6) + r()) % 1, x = r() * w + ph * 120 * k, y = r() * h * 0.8 + ph * 60 * k;
      ctx.save(); ctx.globalAlpha = Math.sin(ph * PI); ctx.translate(x % w, y); ctx.rotate(t + i); ctx.scale(1, Math.cos(t * 3.4 + i));
      ctx.fillStyle = i % 3 ? '#eab0b6' : P.paperWhite; ctx.beginPath(); ctx.ellipse(0, 0, 1.7 * k, 1.1 * k, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    // ichimonji-bokashi band, paper margin, key-line border
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.095);
    g.addColorStop(0, 'rgba(22,52,88,0.88)'); g.addColorStop(0.3, 'rgba(32,74,116,0.6)'); g.addColorStop(1, 'rgba(36,82,126,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * 0.095);
    const m = Math.max(2, Math.round(10 * h / 900)), lw = Math.max(1, Math.round(2.4 * h / 900));
    ctx.fillStyle = P.margin; ctx.fillRect(0, 0, w, m); ctx.fillRect(0, h - m, w, m); ctx.fillRect(0, 0, m, h); ctx.fillRect(w - m, 0, m, h);
    ctx.strokeStyle = P.sumi; ctx.lineWidth = lw; ctx.strokeRect(m + lw / 2, m + lw / 2, w - 2 * m - lw, h - 2 * m - lw);
    // title cartouche (HUD panel sample) with a vertical red slip, and a seal in the corner
    const bw = 30 * k, bh = 13 * k, bx = w / 2 - bw / 2, by = 14 * k;
    ctx.fillStyle = '#f4ead4'; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = P.sumi; ctx.lineWidth = 1.6; ctx.strokeRect(bx, by, bw, bh); ctx.lineWidth = 0.8; ctx.strokeRect(bx + 2.5, by + 2.5, bw - 5, bh - 5);
    ctx.fillStyle = '#c8402a'; ctx.fillRect(bx + 4, by + 4, 3.2 * k, bh - 8);
    ctx.font = Math.round(8.5 * k) + 'px "Zen Antique", "Shippori Mincho", Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(36,82,126,0.42)'; ctx.fillText('12:30', bx + bw * 0.56 + 1.5, by + bh / 2 + 1.5);
    ctx.fillStyle = P.sumi; ctx.fillText('12:30', bx + bw * 0.56, by + bh / 2);
    const ss = 9 * k, sx = w - m - ss - 6 * k, sy = h - m - ss - 6 * k;
    ctx.fillStyle = '#c8402a'; ctx.fillRect(sx, sy, ss, ss);
    ctx.strokeStyle = '#f7efd9'; ctx.lineWidth = Math.max(1, 0.5 * k); ctx.strokeRect(sx + ss * 0.15, sy + ss * 0.15, ss * 0.7, ss * 0.7);
    ctx.beginPath(); ctx.moveTo(sx + ss * 0.3, sy + ss * 0.35); ctx.lineTo(sx + ss * 0.7, sy + ss * 0.35); ctx.moveTo(sx + ss * 0.5, sy + ss * 0.3); ctx.lineTo(sx + ss * 0.5, sy + ss * 0.72); ctx.moveTo(sx + ss * 0.3, sy + ss * 0.7); ctx.lineTo(sx + ss * 0.7, sy + ss * 0.7); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  const Starter = { id: 'ukiyoe', name: 'Ukiyo-e Woodblock', palette: PALETTE, fonts: ['Shippori Mincho:wght@500;700;800', 'Zen Antique', 'Yuji Syuku'], drawHero, drawEnemy, drawImpact, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['ukiyoe'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
