/* Ukiyo-e Woodblock — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Every image is "printed" from blocks: a kinari paper underlay, flat colour blocks with bokashi
   gradients laid slightly off-register (+0.38 / +0.30 units), one sumi key block whose stamped lines
   swell and thin (heavier towards the lower right), and washi fibres showing through everything. */
(function (root) {
  'use strict';
  const PALETTE = {
    paper: '#f2e8d2', paperWhite: '#fbf5e6', sumi: '#1e1b19',
    indigo: '#2d4a72', indigoLight: '#5a7aa0', indigoDeep: '#1c3150',
    vermilion: '#cf4a2c', vermilionLight: '#e7845a', vermilionDeep: '#9e321e',
    ochre: '#d8b264', ochreLight: '#eed79c', ochreDeep: '#a9813d',
    prussian: '#24527e', prussianLight: '#7ea6c4', prussianDeep: '#173a5e',
    pine: '#3d5a45', pineLight: '#748f61', pineDeep: '#2a4031',
    meadowCream: '#eee4c7', meadowSage: '#c7cf98', meadowOchre: '#e6cf96', moss: '#96aa74',
    kappa: '#5f9466', kappaLight: '#8fb886', kappaDeep: '#3a684a',
    gold: '#d9a93b', goldLight: '#f4d77e', skin: '#efd5ae', pink: '#f0c3c3',
  };
  const P = PALETTE, TAU = Math.PI * 2, PI = Math.PI;
  const REG = [0.38, 0.3];          // colour blocks print off-register by this much (world units)
  const LX = 0.6, LY = 0.8;         // key lines swell towards the lower right

  /* ---------- tiny deterministic helpers ---------- */
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return { c, ctx: c.getContext('2d') }; };
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

  /* ---------- washi fibres (transparent overlay, applied source-atop to every sprite) ---------- */
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
  function bake(box, K, fn) {
    const { c, ctx } = canvas((box[2] - box[0]) * K, (box[3] - box[1]) * K);
    ctx.setTransform(K, 0, 0, K, -box[0] * K, -box[1] * K); ctx.lineJoin = ctx.lineCap = 'round';
    fn(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = ctx.createPattern(fibres(), 'repeat'); ctx.fillRect(0, 0, c.width, c.height);
    return { c, ox: -box[0] * K, oy: -box[1] * K, K };
  }
  function blit(ctx, s, x, y, k, flip) {
    const sc = k / s.K;
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(s.c, -s.ox * sc, -s.oy * sc, s.c.width * sc, s.c.height * sc); ctx.restore();
  }

  /* ---------- main character: traveller in a straw sugegasa ---------- */
  function heroParts(c, f) {
    const st = [0, 1, 0, -1][f];
    const leg = (hx, fx, back) => {
      part(c, capsule(hx, -8.4, fx, -1.7, 1.55, 1.12), back ? '#6a809e' : '#8fa5bf', { ink: 0.7 });
      part(c, ell(fx + 0.75, -0.8, 2.3, 0.95), back ? P.ochreDeep : P.ochre, { ink: 0.55 });
    };
    ink(c, [[1.2, -12.8], [-12, -7.5]], 1.9, { taper: 0.4, side: 0 });                   // scabbard
    part(c, spline([[-6.2, -20], [-3.4, -19.6], [-3, -15.6], [-4.6, -13.2], [-7.6, -13.6], [-9.2, -16.4], [-8.4, -19.2]], true, 5), bk(-20, -13, '#efe2bf', '#d4bf8f'), { ink: 0.75 });
    leg(-1.4, -2.3 - st * 2, true); leg(1.5, 2.5 + st * 2, false);
    part(c, spline([[-4.4, -20.6], [0.2, -21.3], [4.6, -20.4], [5.6, -15.5], [6.4, -8.8], [5.2, -6.9], [0.2, -6.5], [-5, -6.9], [-6, -9], [-5.4, -15.5]], true, 5),
      bk(-21.3, -6.5, P.indigoLight, P.indigoDeep), {
        ink: 1.0,
        detail(k) {   // paper-white kasuri crosses
          k.strokeStyle = 'rgba(246,238,220,0.88)'; k.lineWidth = 0.42; k.beginPath();
          for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const x = -4.6 + i * 2.6 + (j & 1) * 1.3, y = -19.2 + j * 2.7; k.moveTo(x - 0.55, y - 0.55); k.lineTo(x + 0.55, y + 0.55); k.moveTo(x + 0.55, y - 0.55); k.lineTo(x - 0.55, y + 0.55); }
          k.stroke();
        },
      });
    part(c, poly([[-5.75, -14.1], [5.85, -14.5], [6.1, -11.3], [-5.9, -11]]), bk(-14.5, -11, P.vermilionLight, P.vermilionDeep), { ink: 0.65 });   // obi
    ink(c, [[3, -12.9], [8.7, -16]], 1.45, { taper: 0.3, side: 0 });                     // hilt
    part(c, ell(1.9, -20.3, 3.3, 2.85), P.skin, { ink: 0.65 });                           // face
    ink(c, spline([[3, -21.15], [3.85, -21.45], [4.7, -21.05]], false, 5), 0.5);
    const sleeve = spline([[-1.9, -0.6], [1.9, -0.6], [2.6, 5], [2.3, 7.7], [-0.3, 8.5], [-2.5, 7.4], [-2.7, 3]], true, 5)
      .map(([x, y]) => { const a = -st * 0.4, co = Math.cos(a), si = Math.sin(a); return [2.6 + x * co - y * si, -19.6 + x * si + y * co]; });
    // sugegasa: a shallow cone, bokashi from light crown to deep brim, straw lines in brown ink
    const hat = poly([[0.9, -32.6], [12.1, -24.2]]).concat(Array.from({ length: 17 }, (_, i) => { const a = ((i + 1) / 18) * PI; return [0.5 + Math.cos(a) * 11.6, -24.2 + Math.sin(a) * 1.5]; })).concat(poly([[-11.1, -24.2], [0.9, -32.6]]));
    part(c, hat, bk(-32.5, -22.7, '#f3dea4', '#b48a43'), { ink: 1.1 });
    for (let i = -3; i <= 3; i++) ink(c, [[0.9 + i * 0.4, -31.7], [0.5 + i * 3.25, -23.5]], 0.26, { col: '#6b5330', taper: 1.2 });
    part(c, sleeve, bk(-20, -11, P.indigoLight, P.indigo), { ink: 0.85 });
  }
  /* ---------- a typical creature: kappa with a water dish ---------- */
  function kappaParts(c, f) {
    const st = [0, 1, 0, -1][f];
    part(c, spline([[-3, -15.4], [-7.2, -13.6], [-8.9, -8.6], [-7.6, -3.6], [-3.4, -2.6], [-2.2, -8.8]], true, 6), bk(-15, -3, '#a37d4f', '#5a3f28'), { ink: 0.85 });
    part(c, capsule(-2.2, -5, -2.6 + st * 1.4, -1.1, 1.5, 1.2), P.kappaDeep, { ink: 0.7 });
    part(c, spline([[-4.4, -14.8], [0.6, -15.8], [4.8, -13.6], [5.6, -8], [4, -3.2], [-0.4, -2.2], [-4.2, -3.6], [-5.4, -9]], true, 6), bk(-16, -2, P.kappaLight, P.kappaDeep), { ink: 0.95 });
    part(c, ell(2.7, -8.4, 2.5, 4.6), bk(-13, -3.8, '#f2e2b4', '#cdae70'), { ink: 0.55 });
    part(c, capsule(1.8, -4.6, 2.2 - st * 1.4, -1.1, 1.55, 1.25), P.kappa, { ink: 0.7 });
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
  let cacheK = 0, HERO = null, KAPPA = null, PINE = null, GATE = null, TOMOE = null;
  function ensure(K) {
    if (cacheK === K) return;
    cacheK = K;
    HERO = [0, 1, 2, 3].map((f) => bake([-14, -34, 15, 2], K, (c) => heroParts(c, f)));
    KAPPA = [0, 1, 2, 3].map((f) => bake([-11, -26, 12, 2], K, (c) => kappaParts(c, f)));
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
  }

  /** Main character, feet at (x, y); size = px per world unit (default 2.5). */
  function drawHero(ctx, x, y, t, facing, size) {
    const k = size || 2.5; ensure(Math.max(3, Math.round(k * 1.6)));
    const f = Math.floor(t * 5) & 3;
    ctx.fillStyle = 'rgba(75,79,88,0.22)'; ctx.beginPath(); ctx.ellipse(x + k * 0.5, y + k * 0.35, 9 * k, 3 * k, 0, 0, TAU); ctx.fill();
    blit(ctx, HERO[f], x, y - Math.abs(Math.sin(t * 5 * PI / 2)) * k, k, facing < 0);
  }
  /** A typical creature (kappa), feet at (x, y). */
  function drawEnemy(ctx, x, y, t, size) {
    const k = size || 2.5; ensure(Math.max(3, Math.round(k * 1.6)));
    const f = Math.floor(t * 4) & 3;
    ctx.fillStyle = 'rgba(75,79,88,0.22)'; ctx.beginPath(); ctx.ellipse(x + k * 0.5, y + k * 0.35, 8.2 * k, 2.7 * k, 0, 0, TAU); ctx.fill();
    blit(ctx, KAPPA[f], x, y - Math.abs(Math.sin(t * 4 * PI)) * 0.9 * k, k, true);
  }

  /* ---------- ground: bokashi meadow, moss, a pond with contour lines + seigaiha (cached) ---------- */
  let G = null;
  function ground(w, h, k) {
    if (G && G.w === w && G.h === h) return G.c;
    const { c, ctx } = canvas(w, h);
    ctx.fillStyle = P.meadowCream; ctx.fillRect(0, 0, w, h);
    const blob = (x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); };
    blob(w * 0.25, h * 0.3, h * 0.65, '199,207,152', 0.85); blob(w * 0.85, h * 0.85, h * 0.5, '230,207,150', 0.75);
    // moss region: key line in deep green, bokashi darker at its edge
    const moss = spline([[w * 0.62, h * 1.05], [w * 0.66, h * 0.62], [w * 0.8, h * 0.5], [w * 1.05, h * 0.42], [w * 1.05, h * 1.05]], true, 10);
    ctx.save(); ctx.beginPath(); trace(ctx, moss); ctx.clip(); ctx.fillStyle = '#6c8a5a'; ctx.fillRect(0, 0, w, h); ctx.restore();
    ctx.save(); ctx.beginPath(); trace(ctx, moss); ctx.clip(); ctx.globalAlpha = 0.85; ctx.fillStyle = P.moss; ctx.translate(w * 0.04, h * 0.04); ctx.scale(0.95, 0.95); ctx.beginPath(); trace(ctx, moss); ctx.fill(); ctx.restore();
    ink(ctx, moss, 0.6 * k, { closed: true, col: '#405a3a' });
    // pond: shallow -> deep bokashi, seigaiha in the deep, paper contour lines along the shore
    const cx = w * 0.18, cy = h * 0.8, rx = h * 0.34, ry = h * 0.2;
    const pond = ell(cx, cy, rx, ry);
    ctx.save(); ctx.beginPath(); trace(ctx, pond); ctx.clip();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx); g.addColorStop(0, '#1e4570'); g.addColorStop(0.6, '#28547f'); g.addColorStop(0.88, '#7ea3bc'); g.addColorStop(1, '#a8c5c9');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const R = 7 * k; ctx.strokeStyle = 'rgba(132,170,198,0.5)'; ctx.lineWidth = 0.45 * k;
    for (let j = 0; j * R * 0.5 < h + R; j++) for (let i = -1; i * 2 * R < w + R; i++) { const x = i * 2 * R + (j & 1 ? R : 0), y = j * R * 0.5; for (let q = 1; q <= 4; q++) { ctx.beginPath(); ctx.arc(x, y, (R * q) / 4, PI, TAU); ctx.stroke(); } }
    ctx.restore();
    ctx.strokeStyle = 'rgba(233,239,233,0.75)'; ctx.lineWidth = 0.55 * k;
    for (const d of [2.4, 5, 7.6]) { ctx.beginPath(); ctx.ellipse(cx, cy, rx - d * k, ry - d * k, 0, 0, TAU); ctx.stroke(); }
    ink(ctx, pond, 0.95 * k, { closed: true });
    // Hiroshige grass ticks
    const r = rng(77);
    for (let i = 0; i < 160; i++) {
      const x = r() * w, y = r() * h, s = (0.8 + r() * 0.5) * k;
      if (Math.hypot((x - cx) / rx, (y - cy) / ry) < 1.08) continue;
      ctx.fillStyle = x > w * 0.66 && y > h * 0.5 ? '#3f5c3d' : '#6c8858'; ctx.beginPath();
      for (let b = 0; b < 4; b++) { const a = -0.75 + b * 0.5, L = (2.3 + r() * 2) * s, bx = x + (b - 1.5) * 0.75 * s; ctx.moveTo(bx - 0.34 * s, y); ctx.lineTo(bx + Math.sin(a) * L, y - Math.cos(a) * L); ctx.lineTo(bx + 0.34 * s, y); }
      ctx.fill();
    }
    // suyari-gasumi mist band
    ctx.beginPath();
    for (const [x0, y0, bw] of [[w * 0.36, h * 0.18, h * 0.5], [w * 0.42, h * 0.18 + 9 * k, h * 0.38]]) { const rr = 5.5 * k; ctx.moveTo(x0 + rr, y0); ctx.arc(x0 + bw - rr, y0 + rr, rr, -PI / 2, PI / 2); ctx.arc(x0 + rr, y0 + rr, rr, PI / 2, PI * 1.5); ctx.closePath(); }
    ctx.lineWidth = 1 * k; ctx.strokeStyle = 'rgba(156,118,92,0.8)'; ctx.stroke(); ctx.fillStyle = '#f2e0cf'; ctx.fill();
    G = { w, h, c };
    return c;
  }

  /* ---------- complete preview scene ---------- */
  function draw(ctx, w, h, t) {
    const k = h / 360;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(ground(w, h, k), 0, 0);
    ensure(Math.max(3, Math.round(k * 1.6)));
    // props and actors, y-sorted by hand
    blit(ctx, PINE, w * 0.78, h * 0.42, k);
    blit(ctx, GATE, w * 0.5, h * 0.5, k);
    drawEnemy(ctx, w * 0.72 - ((t * 18) % 60) * k, h * 0.62, t, k);
    drawEnemy(ctx, w * 0.3 + Math.sin(t) * 6 * k, h * 0.48, t + 0.4, k);
    const hx = w * 0.5 + Math.sin(t * 0.8) * 30 * k, hy = h * 0.66;
    drawHero(ctx, hx, hy, t, Math.cos(t * 0.8) >= 0 ? 1 : -1, k);
    for (let i = 0; i < 2; i++) {   // orbiting mitsudomoe crests
      const a = t * 2.4 + i * PI, ox = hx + Math.cos(a) * 44 * k, oy = hy - 10 * k + Math.sin(a) * 37 * k;
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(t * 6); blit(ctx, TOMOE, 0, 0, k); ctx.restore();
    }
    // falling petals (deterministic in t)
    for (let i = 0; i < 14; i++) {
      const r = rng(500 + i), ph = (t / (7 + r() * 6) + r()) % 1, x = r() * w + ph * 120 * k, y = r() * h * 0.8 + ph * 60 * k;
      ctx.save(); ctx.globalAlpha = Math.sin(ph * PI); ctx.translate(x % w, y); ctx.rotate(t + i); ctx.scale(1, Math.cos(t * 3.4 + i));
      ctx.fillStyle = i % 3 ? '#eab0b6' : P.paperWhite; ctx.beginPath(); ctx.ellipse(0, 0, 1.7 * k, 1.1 * k, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    // ichimonji-bokashi band, paper margin, key-line border
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.095);
    g.addColorStop(0, 'rgba(22,52,88,0.88)'); g.addColorStop(0.3, 'rgba(32,74,116,0.6)'); g.addColorStop(1, 'rgba(36,82,126,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * 0.095);
    const m = Math.max(2, Math.round(10 * h / 900)), lw = Math.max(1, Math.round(2.4 * h / 900));
    ctx.fillStyle = '#efe4cb'; ctx.fillRect(0, 0, w, m); ctx.fillRect(0, h - m, w, m); ctx.fillRect(0, 0, m, h); ctx.fillRect(w - m, 0, m, h);
    ctx.strokeStyle = P.sumi; ctx.lineWidth = lw; ctx.strokeRect(m + lw / 2, m + lw / 2, w - 2 * m - lw, h - 2 * m - lw);
    // title cartouche (HUD panel sample) with a vertical red slip and a seal
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

  const Starter = { id: 'ukiyoe', name: 'Ukiyo-e Woodblock', palette: PALETTE, fonts: ['Shippori Mincho:wght@500;700;800', 'Zen Antique', 'Yuji Syuku'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['ukiyoe'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
