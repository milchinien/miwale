/* Sumi-e Ink — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Black ink in five tones on warm xuan paper. Everything is built from one-stroke brush ribbons
   (pressed start, tapering end, optional dry-brush "flying white" bristles) and soft ink washes.
   Every animation pose is painted as its own drawing from a pose record and baked once; only the
   vermilion sash tails are painted live, so they can lag behind the body. */
(function (root) {
  'use strict';
  const PALETTE = {
    paper: '#f3ecdd', paperHi: '#f9f4e8', jiao: '#161412', nong: '#2c2926', zhong: '#56524c', dan: '#8a857c', qing: '#beb8aa',
    groundInk: '#322f2c', shadow: '#3a3630', vermilion: '#ce3c26', vermilionDeep: '#a8281a', vermilionLight: '#e47052', silk: '#4e4b46',
  };
  const TONE = [[22, 20, 18], [44, 41, 38], [86, 82, 76], [138, 133, 124], [190, 184, 170]];
  const VERM = [206, 60, 38], VERM_D = [160, 38, 24];
  const TAU = Math.PI * 2;
  const rgb = (c) => 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { next, range: (lo, hi) => lo + (hi - lo) * next() };
  }
  function hash(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function noise1(x, s) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i, 0, s) + (hash(i + 1, 0, s) - hash(i, 0, s)) * u; }
  const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.ceil(w)), height: Math.max(1, Math.ceil(h)) });
  const scaleOf = (ctx) => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b) || 1; };

  function spline(pts, steps) {
    const n = pts.length, out = [];
    if (n < 3) { for (let s = 0; s <= steps; s++) out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * s / steps, pts[0][1] + (pts[1][1] - pts[0][1]) * s / steps]); return out; }
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    out.push(pts[n - 1].slice());
    return out;
  }
  const closed = (pts) => pts.concat([pts[0]]);

  /* ---------------- the brush: one stroke = a ribbon with a pressed start and a tapering end ---------------- */
  // o: w width, c / c2 ink tones (rgb arrays), a alpha, ta / tb taper fractions, press, dry (0..1), bleed (halo), gs (streak scale)
  function brush(ctx, pts, o, r) {
    const P = spline(pts, o.steps || 6), n = P.length, acc = [0];
    for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const tot = acc[n - 1] || 1, W = [], NX = [], NY = [], ta = o.ta === undefined ? 0.12 : o.ta, tb = o.tb === undefined ? 0.35 : o.tb, ph = r.next() * 9;
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      NX.push(-(b[1] - a[1]) / l); NY.push((b[0] - a[0]) / l);
      const u = acc[i] / tot;
      let w = o.w;
      if (ta > 0 && u < ta) w *= 0.3 + 0.7 * Math.sqrt(u / ta);
      if (tb > 0 && u > 1 - tb) w *= 0.04 + 0.96 * Math.pow((1 - u) / tb, 0.6);
      if (o.press) w *= 1 + o.press * Math.exp(-(acc[i] * acc[i]) / (o.w * o.w * 1.2));
      W.push(Math.max(0.04, w * (1 + 0.12 * Math.sin(acc[i] * 0.55 + ph))));
    }
    const ribbon = (i0, i1, o0, o1) => {
      ctx.beginPath();
      for (let i = i0; i <= i1; i++) ctx.lineTo(P[i][0] + NX[i] * W[i] * o0, P[i][1] + NY[i] * W[i] * o0);
      for (let i = i1; i >= i0; i--) ctx.lineTo(P[i][0] + NX[i] * W[i] * o1, P[i][1] + NY[i] * W[i] * o1);
      ctx.closePath(); ctx.fill();
    };
    const c = o.c || TONE[1], al = o.a === undefined ? 1 : o.a;
    ctx.save();
    ctx.fillStyle = rgb(c);
    if (o.bleed) { ctx.filter = 'blur(' + Math.max(0.6, o.bleed * o.w * 0.55 * scaleOf(ctx)).toFixed(1) + 'px)'; ctx.globalAlpha = al * 0.32; ribbon(0, n - 1, -0.7, 0.7); ctx.filter = 'none'; }
    const dry = o.dry || 0;
    ctx.globalAlpha = al;
    if (!dry) { ribbon(0, n - 1, -0.5, 0.5); ctx.restore(); return; }
    // dry brush: the body runs out of ink, then single bristles break into streaks of bare paper
    let ib = 0;
    while (ib < n - 1 && acc[ib] / tot < 1 - dry * 0.9) ib++;
    if (ib > 1) { ctx.globalAlpha = al * 0.9; ribbon(0, ib, -0.42, 0.42); }
    const nb = o.nb || Math.max(4, Math.min(18, Math.round((o.w * scaleOf(ctx)) / 1.5))), bw = 1.55 / nb, c2 = o.c2 || c, gs = o.gs || Math.max(0.5, o.w * 0.5);
    for (let b = 0; b < nb; b++) {
      const off = (b + 0.5) / nb - 0.5, edge = Math.abs(off) * 2, life = 1 - dry * Math.pow(r.next(), 0.7) * (0.25 + 0.75 * edge) * 0.9, seed = (r.next() * 1e6) | 0;
      ctx.fillStyle = rgb(c.map((v, k) => v + (c2[k] - v) * (off + 0.5)));
      ctx.globalAlpha = al * (0.62 + r.next() * 0.38);
      let s0 = -1;
      for (let i = 0; i < n; i++) {
        const u = acc[i] / tot, on = u <= life && noise1(acc[i] / gs * 0.6, seed) > dry * (u * 1.25 - 0.25) + 0.08 * edge;
        if (on && s0 < 0) s0 = i;
        if ((!on || i === n - 1) && s0 >= 0) { const e = on ? i : i - 1; if (e > s0) ribbon(s0, e, off - bw / 2, off + bw / 2); s0 = -1; }
      }
    }
    ctx.restore();
  }
  /** ink wash inside a closed shape: base tone, blurred wet blots, a dried rim, optional bleed halo and mist fade */
  function wash(ctx, P, o) {
    const path = () => { ctx.beginPath(); P.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.closePath(); };
    ctx.save();
    path();
    if (o.bleed) { ctx.filter = 'blur(' + (o.bleed * scaleOf(ctx)).toFixed(1) + 'px)'; ctx.globalAlpha = 0.35; ctx.fillStyle = o.c; ctx.fill(); ctx.filter = 'none'; }
    ctx.globalAlpha = o.a === undefined ? 1 : o.a; ctx.fillStyle = o.c; ctx.fill();
    ctx.clip();
    for (const b of o.blobs || []) {   // wet-in-wet: darker (or paper-light) blots bleed inside the shape
      ctx.filter = 'blur(' + ((b.blur === undefined ? 1.5 : b.blur) * scaleOf(ctx)).toFixed(1) + 'px)';
      ctx.globalAlpha = b.a === undefined ? 0.7 : b.a; ctx.fillStyle = b.c;
      ctx.beginPath(); ctx.ellipse(b.x, b.y, b.rx, b.ry === undefined ? b.rx : b.ry, 0, 0, TAU); ctx.fill();
    }
    ctx.filter = 'none';
    if (o.dark) { const g = ctx.createRadialGradient(o.dark[0], o.dark[1], 0, o.dark[0], o.dark[1], o.dark[2]); g.addColorStop(0, o.dk); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(-500, -500, 1000, 1000); }
    if (o.rim) { ctx.globalAlpha = o.rimA || 0.5; ctx.strokeStyle = o.edge || o.c; ctx.lineWidth = o.rim; path(); ctx.stroke(); }   // the dried edge
    if (o.fade) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'destination-out'; const g = ctx.createLinearGradient(0, o.fade[0], 0, o.fade[1]); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); ctx.fillStyle = g; ctx.fillRect(-500, o.fade[0], 1000, 1000); }
    ctx.restore();
  }
  function dot(ctx, x, y, s, c, a) { ctx.globalAlpha = a; ctx.fillStyle = rgb(c); ctx.beginPath(); ctx.ellipse(x, y, s * 1.4, s * 0.6, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }

  /* ---------------- baked sprites (K px per world unit, anchor at the feet) ---------------- */
  function bake(wu, hu, ax, ay, K, fn, seed) {
    const c = canvas(wu * K, hu * K), ctx = c.getContext('2d');
    ctx.setTransform(K, 0, 0, K, ax * K, ay * K); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    fn(ctx, rng(seed));
    return { c, ax, ay, wu, hu };
  }
  function blit(ctx, s, x, y, flip) {
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(s.c, -s.ax, -s.ay, s.wu, s.hu); ctx.restore();
  }

  /* ---------------- main character: a wandering calligrapher, painted per pose ---------------- */
  // pose record: by body drop, lean, arm swing, hem trail, brush / tilt lag (follow-through), legs (near a, far b: x and lift)
  function paintHero(ctx, r, P) {
    const by = P.by, h = P.hem, a = P.arm, L = P.legs;
    const upper = (fn) => { ctx.save(); ctx.translate(0, -5 + by); ctx.rotate(P.lean); ctx.translate(0, 5); fn(); ctx.restore(); };
    upper(() => {   // giant brush strapped across the back, bristles up; it lags behind the body
      ctx.save(); ctx.translate(0.5, -15); ctx.rotate(P.brush); ctx.translate(-0.5, 15);
      brush(ctx, [[5, -7.5], [0.2, -18.5], [-4.4, -30.4]], { w: 1.2, c: TONE[2], c2: TONE[3], ta: 0, tb: 0 }, r);
      brush(ctx, [[-4.9, -31.6], [-5.9, -34.6], [-7.3, -38]], { w: 2.8, c: TONE[0], c2: TONE[2], ta: 0, tb: 0.8, press: 0.35, dry: 0.35, bleed: 0.35 }, r);
      ctx.restore();
    });
    for (const [hx, fx, lift, near] of [[-1.3, L.bx, L.bl, false], [1.3, L.ax, L.al, true]]) {   // far leg one tone paler
      const fy = -0.5 - lift;
      brush(ctx, [[hx, -7 + by], [(hx + fx) / 2 + (near ? 0.3 : -0.3), -3.4 - lift * 0.6 + by * 0.5], [fx, fy - 0.4]], { w: near ? 2.3 : 2.0, c: near ? TONE[1] : TONE[2], ta: 0, tb: 0.1, dry: 0.25, steps: 4 }, r);
      dot(ctx, fx + 0.9, fy + 0.1, 0.95, near ? TONE[0] : TONE[1], 0.95);   // straw sandal
    }
    upper(() => {
      const robe = [[-3.6, -20.6], [0.2, -21.3], [3.4, -20.4], [4.8, -16.5], [5.3, -11.4], [6.5 + h * 0.7, -4.6], [2.3 + h * 0.4, -3.9], [-2.2 + h * 0.5, -4.2], [-6.9 + h, -4.9], [-5.9 + h * 0.3, -11.2], [-5, -16.8]];
      wash(ctx, spline(closed(robe), 4), { c: PALETTE.qing, blobs: [{ x: 3.8, y: -9.5, rx: 3, ry: 5, c: PALETTE.dan, a: 0.85, blur: 1.6 }, { x: -1.2, y: -17, rx: 2.6, ry: 2.4, c: PALETTE.paperHi, a: 0.5 }], rim: 0.7, edge: PALETTE.dan, bleed: 0.7 });
      brush(ctx, [[-3.4, -21], [-5.4, -16.4], [-6.1 + h * 0.3, -10.4], [-7.4 + h, -4.8]], { w: 3, c: TONE[0], c2: TONE[3], ta: 0.05, tb: 0.25, press: 0.6, dry: 0.6 }, r);   // one bold back stroke
      brush(ctx, [[3.6, -20.6], [5, -16], [5.6, -10.8], [7 + h * 0.7, -5]], { w: 1.4, c: TONE[1], c2: TONE[3], tb: 0.4, dry: 0.55 }, r);
      brush(ctx, [[-7 + h, -5], [-2.2 + h * 0.5, -4.1], [2.4 + h * 0.4, -4.3], [7 + h * 0.7, -5.2]], { w: 1.05, c: TONE[1], c2: TONE[3], tb: 0.3, dry: 0.65 }, r);
      brush(ctx, [[-2.2, -21], [0.8, -16.8]], { w: 1, c: TONE[0], tb: 0.35, press: 0.4 }, r);   // collar
      brush(ctx, [[-5.6, -13.2], [0, -12.3], [5.5, -13]], { w: 2.1, c: VERM, c2: VERM_D, ta: 0, tb: 0.04, press: 0.3 }, r);   // vermilion sash
      wash(ctx, spline(closed([[2.4, -20.2], [5.2, -19.2], [7.2 + a, -14.6], [7.7 + a, -12], [4.9 + a * 0.6, -12.4], [3.5, -16.2]]), 4), { c: PALETTE.qing, blobs: [{ x: 6 + a * 0.6, y: -14, rx: 2, ry: 2.5, c: PALETTE.dan, a: 0.8, blur: 1 }] });
      brush(ctx, [[2.8, -20.4], [5.8, -18.8], [7.5 + a, -14.4], [8 + a, -11.8]], { w: 2.2, c: TONE[0], c2: TONE[3], tb: 0.35, press: 0.5, dry: 0.55 }, r);   // sleeve
      ctx.fillStyle = PALETTE.paperHi; ctx.beginPath(); ctx.ellipse(7.1 + a, -11, 1, 0.9, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(1, -24.5); ctx.rotate(P.tilt); ctx.translate(-1, 24.5);   // head and hat tilt a beat late
      wash(ctx, spline(closed([[-2.4, -24.3], [-0.2, -24.4], [0.2, -22.6], [-0.6, -21.4], [-2, -21.6], [-2.8, -22.8]]), 3), { c: PALETTE.jiao, bleed: 0.3 });   // hair knot
      ctx.fillStyle = PALETTE.paperHi; ctx.beginPath();
      [[-0.4, -24.3], [3.7, -24.3], [4.1, -23.2], [3.7, -22.6], [3.1, -21.4], [1, -20.9], [-0.1, -22.2]].forEach((p) => ctx.lineTo(p[0], p[1])); ctx.fill();   // bare-paper face
      brush(ctx, [[3.6, -24.1], [4.1, -23.2], [3.6, -22.6], [3.2, -21.6], [2.4, -21]], { w: 0.48, c: TONE[1], ta: 0.15, tb: 0.45, steps: 3 }, r);   // brow-nose-chin
      if (P.blink) brush(ctx, [[2.1, -23.3], [2.65, -23.05], [3.2, -23.3]], { w: 0.4, c: TONE[0], ta: 0.2, tb: 0.4 }, r);
      else brush(ctx, [[2.4, -23.45], [3.2, -23.35]], { w: 0.66, c: TONE[0], ta: 0.1, tb: 0.4, press: 0.5 }, r);
      wash(ctx, spline(closed([[-8.8, -25.4], [-4.2, -27.9], [0.1, -30.3], [1.3, -30.4], [5.4, -28], [9.6, -24.9], [4.4, -24.2], [-2.8, -24.5]]), 4),
        { c: PALETTE.dan, blobs: [{ x: 4.5, y: -25.8, rx: 4.2, ry: 1.6, c: PALETTE.zhong, a: 0.8, blur: 1.2 }, { x: -2.8, y: -27.6, rx: 2.8, ry: 1.2, c: PALETTE.paperHi, a: 0.55, blur: 1 }], rim: 0.6, edge: PALETTE.zhong });
      brush(ctx, [[-8.6, -25.5], [-4.4, -28], [0.4, -30.4]], { w: 1.1, c: TONE[1], tb: 0.3, press: 0.4, dry: 0.3 }, r);
      brush(ctx, [[-9.2, -25.2], [-3, -24.4], [3.6, -24.2], [9.9, -24.9]], { w: 1.5, c: TONE[0], c2: TONE[2], ta: 0.02, tb: 0.3, press: 0.7, dry: 0.45, steps: 5 }, r);   // the brim: pressed, then dry
      dot(ctx, 0.75, -30.7, 0.55, TONE[0], 1);
      ctx.restore();
    });
  }
  function heroPoses() {
    const base = { by: 0, lean: 0, arm: 0, hem: 0, brush: 0, tilt: 0, blink: false, legs: { ax: 1.6, al: 0, bx: -1.5, bl: 0 } };
    const P = (o) => Object.assign({}, base, o);
    const BY = [0, 0.75, 0.25, -0.55, 0, 0.75, 0.25, -0.55];   // contact, down, passing, up – once per foot
    const walk = BY.map((by, i) => {
      const p = i / 8, c = Math.cos(p * TAU), s = Math.sin(p * TAU);
      return P({ by, lean: 0.06, arm: -1.5 * c, hem: -0.7 + 0.35 * c, brush: 0.05 * Math.sin(p * 2 * TAU - 1), tilt: 0.035 * Math.sin(p * 2 * TAU - 0.6),
        legs: { ax: 3 * c + 0.3, al: Math.max(0, -s) * 1.7, bx: -3 * c - 0.2, bl: Math.max(0, s) * 1.7 } });
    });
    return { walk, idle: [P({}), P({ by: -0.4, arm: 0.15, brush: -0.02 }), P({ blink: true })] };
  }
  /** the two sash tails, painted live from the knot: they hang at rest and stream back when walking */
  function drawSash(ctx, kx, ky, fd, t, mv) {
    const m = Math.min(1, mv);
    for (let k = 1; k >= 0; k--) {
      const len = (k ? 5.8 : 7.4) * (1 + 0.22 * m), w0 = k ? 1.2 : 1.55, ang = 1.05 + (0.3 - 1.05) * m + k * 0.3;
      const dx = -fd * Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, ph = t * (1.8 + 6 * m) + k * 1.9, amp = 0.22 + 0.85 * m;
      const Lp = [], Rp = [];
      for (let i = 0; i < 7; i++) {
        const u = i / 6, wv = amp * u * Math.sin(ph - u * 3.4), x = kx + dx * len * u + nx * wv, y = ky + dy * len * u + ny * wv + u * u * 0.8 * (1 - m), w = w0 * (1 - 0.78 * u) * 0.5;
        Lp.push([x + nx * w, y + ny * w]); Rp.unshift([x - nx * w, y - ny * w]);
      }
      ctx.fillStyle = k ? PALETTE.vermilionDeep : PALETTE.vermilion;
      ctx.beginPath(); Lp.concat(Rp).forEach((p) => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    }
  }

  /* ---------------- small creature: a crow that hops (crouch – push-off – rise – downstroke – land – settle) ---------------- */
  function paintCrow(ctx, r, P) {
    const tp = (x, y) => [x * P.sx, (y + 6.5) * P.sy - 6.5 - P.lift];
    for (let i = 0; i < 2; i++) {
      const hp = tp(0.4 + i * 1.6, -4.6), f = P.feet[i];
      brush(ctx, [hp, [(hp[0] + f[0]) / 2 + 0.9, (hp[1] + f[1]) / 2 - 0.2], f], { w: 0.6, c: TONE[0], ta: 0, tb: 0.1, steps: 3 }, r);
      brush(ctx, [f, [f[0] + 1.6, f[1] + 0.1]], { w: 0.42, c: TONE[0], ta: 0, tb: 0.6 }, r);
    }
    ctx.save(); ctx.translate(0, -P.lift - 6.5); ctx.scale(P.sx, P.sy); ctx.translate(0, 6.5);
    const fold = [[2.6, -10.6], [-1.6, -10], [-6.6, -7.6]], up = [[2, -10.9], [-1.4, -15.4], [-4, -19.6]], dn = [[2, -10.4], [-1.6, -6.4], [-4.6, -2.6]];
    const k = Math.abs(P.wing), W = fold.map((p, i) => { const q = P.wing >= 0 ? up[i] : dn[i]; return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]; });
    for (const [ex, ey, w] of [[-11.2, -9.6, 1.5], [-11.9, -7.9, 1.35], [-10.9, -6.1, 1.2]]) brush(ctx, [[-5.6, -7.4], [(ex - 5.6) / 2 - 0.4, (ey - 7.4) / 2 + P.tail * 0.5], [ex, ey + P.tail]], { w, c: TONE[0], c2: TONE[2], ta: 0.05, tb: 0.75, dry: 0.3, steps: 4 }, r);
    const body = [[6.4, -12.2], [4.8, -13.5], [2.6, -13.1], [0.8, -11.5], [-2.8, -10.7], [-5.6, -9.1], [-6.9, -7.4], [-5.4, -5.2], [-2.4, -3.8], [1.2, -3.6], [3.6, -5], [5.4, -7.6], [6.6, -10.2]];
    wash(ctx, spline(closed(body), 4), { c: PALETTE.nong, blobs: [{ x: 4.2, y: -10.8, rx: 2.8, ry: 2.4, c: PALETTE.jiao, a: 0.95, blur: 0.8 }, { x: 2.8, y: -6.4, rx: 2.6, ry: 2.2, c: PALETTE.jiao, a: 0.7, blur: 1.2 }, { x: -1.8, y: -9, rx: 3, ry: 1.3, c: PALETTE.zhong, a: 0.55, blur: 1.2 }], rim: 0.8, edge: PALETTE.jiao, bleed: 0.9 });
    brush(ctx, W, { w: 3.3, c: TONE[0], c2: TONE[2], ta: 0.08, tb: 0.35, press: 0.4, dry: 0.5, steps: 5, nb: 9 }, r);   // the wing: one dry stroke
    brush(ctx, [[5.9, -12.1], [8.9, -11.3], [10.7, -10.6]], { w: 1.55, c: TONE[0], ta: 0, tb: 0.8, press: 0.4, steps: 4 }, r);   // split beak
    brush(ctx, [[6.2, -10.4], [8.4, -10.3], [9.6, -10.5]], { w: 0.9, c: TONE[0], ta: 0, tb: 0.7, steps: 3 }, r);
    ctx.fillStyle = PALETTE.paperHi; ctx.beginPath(); ctx.arc(5.3, -11.7, 0.72, 0, TAU); ctx.fill();
    ctx.fillStyle = PALETTE.jiao; ctx.beginPath(); ctx.arc(5.55, -11.65, 0.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
  const CROW_POSES = [
    { lift: 0, sx: 1.08, sy: 0.86, wing: 0, tail: -1.4, feet: [[0.8, 0], [3, 0]] },          // crouch: anticipation
    { lift: 2.2, sx: 0.94, sy: 1.1, wing: 0.45, tail: -0.4, feet: [[-1.2, -0.2], [0.2, -0.1]] }, // push off, stretched
    { lift: 5, sx: 1, sy: 1, wing: 1, tail: 0.3, feet: [[-0.6, -5.4], [0.8, -5.2]] },          // rise, wings up
    { lift: 4.4, sx: 1, sy: 1, wing: -1, tail: 0.5, feet: [[1.6, -3.8], [3, -3.6]] },          // downstroke
    { lift: 0.8, sx: 1.02, sy: 0.97, wing: 0.35, tail: -1.3, feet: [[2.8, 0], [4.2, 0]] },     // land, tail up for balance
    { lift: 0, sx: 1.04, sy: 0.94, wing: 0.05, tail: -0.5, feet: [[0.6, 0], [2.8, 0]] },       // settle
  ];

  /* ---------------- props ---------------- */
  function paintBamboo(ctx, r) {
    for (let k = 0; k < 3; k++) {
      const x0 = (k - 1) * 5.2, back = k === 1, tone = back ? TONE[3] : TONE[1], h = 56 + k * 9;
      for (let y = 0; y > -h; y -= 8) {
        brush(ctx, [[x0 - y * 0.05, y - 0.45], [x0 - (y - 8) * 0.05, y - 7.55]], { w: back ? 2 : 2.6, c: tone, ta: 0, tb: 0, press: 0.22, dry: 0.15 }, r);
        brush(ctx, [[x0 - y * 0.05 - 1.5, y - 7.6], [x0 - y * 0.05 + 1.5, y - 7.6]], { w: 0.55, c: back ? TONE[3] : TONE[0], ta: 0.25, tb: 0.35 }, r);
      }
      for (let g = 0; g < 3; g++) {
        const side = (g + k) % 2 ? 1 : -1, bx = x0 + side * (8 + r.next() * 6), by = -h * (0.45 + g * 0.2);
        for (let i = 0; i < 4; i++) { const a = Math.PI / 2 - side * 0.8 + (i - 1.5) * 0.42 * side; brush(ctx, [[bx, by], [bx + Math.cos(a) * 5, by + Math.sin(a) * 5], [bx + Math.cos(a) * 10, by + Math.sin(a) * 10]], { w: 2, c: tone, ta: 0.3, tb: 0.62, press: 0.15 }, r); }
      }
    }
  }
  function paintPlum(ctx, r) {
    brush(ctx, [[1, 0], [-1.6, -7], [1.6, -14], [-2.2, -21], [0.8, -27]], { w: 5.2, c: TONE[1], c2: TONE[3], ta: 0, tb: 0.25, press: 0.5, dry: 0.55, bleed: 0.25 }, r);
    const tips = [];
    for (const [x, y, a, L] of [[0.8, -27, -1.1, 24], [-2.2, -21, -2.6, 22], [1.6, -14, -0.4, 18]]) {
      const pts = [[x, y]]; let cx = x, cy = y, an = a;
      for (let i = 0; i < 3; i++) { an += (r.next() - 0.5) * 0.8; cx += Math.cos(an) * L / 3; cy += Math.sin(an) * L / 3; pts.push([cx, cy]); tips.push([cx, cy]); }
      brush(ctx, pts, { w: 2.4, c: TONE[1], c2: TONE[3], ta: 0, tb: 0.55, dry: 0.4, steps: 3 }, r);
    }
    for (const [x, y] of tips) for (let i = 0; i < 5; i++) {   // five-petal vermilion blossoms, ink stamens
      const a = (i / 5) * TAU; ctx.fillStyle = PALETTE.vermilion; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 1.2, y + Math.sin(a) * 1.2, 1.05, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      if (i === 4) { ctx.fillStyle = PALETTE.jiao; ctx.beginPath(); ctx.arc(x, y, 0.35, 0, TAU); ctx.fill(); }
    }
  }
  function paintMountain(ctx, r) {
    const peak = (cx, w, h, c, dk) => {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const u = 1 - i / 8, env = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 1.6)), 0.75); pts.push([cx + u * w / 2, -h * env * (1 + 0.14 * Math.sin(u * 7 + cx) + 0.07 * Math.sin(u * 17))]); }
      wash(ctx, pts.concat([[cx - w / 2 - 2, 3], [cx + w / 2 + 2, 3]]), { c: rgb(c), dark: [cx - w * 0.14, -h * 0.82, w * 0.4], dk: rgb(dk), fade: [-h * 0.55, -h * 0.02] });
      for (let i = 0; i < w * 1.4; i++) { const j = 1 + ((r.next() * 14) | 0), p = pts[j], d = Math.pow(r.next(), 2.4) * h * 0.45; if (p[1] < -h * 0.22 && p[1] + d < -h * 0.25) dot(ctx, p[0] + (r.next() - 0.5) * 3, p[1] + d + 1.1, 0.8 + r.next() * 0.9, d < h * 0.08 ? dk : c, 0.85 * (1 - d / (h * 0.55))); }   // Mi dots
      brush(ctx, pts.slice(2, 15).reverse(), { w: 1.7, c: dk, a: 0.8, ta: 0.05, tb: 0.5, dry: 0.7, steps: 4 }, r);
    };
    peak(12, 64, 104, TONE[4], TONE[3]);
    peak(-14, 50, 74, TONE[3], TONE[1]);
    peak(16, 34, 38, TONE[2], TONE[0]);
  }

  /* ---------------- the paper: warm sheet with fibres, a pale hill wash, a lake left as bare paper ---------------- */
  function paintGround(ctx, vw, s, w, h) {
    ctx.fillStyle = PALETTE.paper; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.scale(s, s);
    const r = rng(7), lx = vw * 0.24, ly = 280;
    ctx.filter = 'blur(' + (14 * s).toFixed(0) + 'px)';
    ctx.globalAlpha = 0.09; ctx.fillStyle = PALETTE.groundInk;
    for (const [x, y, rx, ry] of [[vw * 0.78, 300, 120, 36], [vw * 0.6, 60, 70, 24]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 0.13; ctx.beginPath(); ctx.ellipse(lx, ly, 96, 44, -0.1, 0, TAU); ctx.fill();   // bank wash around the lake
    ctx.globalAlpha = 1; ctx.fillStyle = PALETTE.paperHi; ctx.filter = 'blur(' + (3 * s).toFixed(0) + 'px)'; ctx.beginPath(); ctx.ellipse(lx, ly, 78, 30, -0.1, 0, TAU); ctx.fill();   // the water: bare paper
    ctx.filter = 'none';
    // hill wash: one hard dried upper edge, fading softly downwards
    const ridge = Array.from({ length: 17 }, (_, i) => { const u = i / 16; return [vw * (0.01 + u * 0.44), 122 - 78 * Math.pow(Math.sin(Math.PI * u), 0.8) * (1 - 0.25 * Math.sin(u * 9)) + (r.next() - 0.5) * 2]; });
    const g = ctx.createLinearGradient(0, 48, 0, 124); g.addColorStop(0, 'rgba(50,47,44,0.12)'); g.addColorStop(1, 'rgba(50,47,44,0)');
    ctx.fillStyle = g; ctx.beginPath(); ridge.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(vw * 0.45, 126); ctx.lineTo(vw * 0.01, 126); ctx.fill();
    brush(ctx, ridge.slice(3, 13).filter((_, i) => i % 2 === 0).map((p) => [p[0], p[1] + 0.8]), { w: 1.6, c: TONE[2], c2: TONE[3], a: 0.7, tb: 0.5, press: 0.5, dry: 0.6, steps: 5 }, r);   // the dried crest
    for (let i = 0; i < 600; i++) {   // fibres
      const x = r.next() * vw, y = r.next() * 360, a = r.next() * TAU, L = 2 + r.next() * 12, light = r.next() < 0.6;
      ctx.strokeStyle = light ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.08)'; ctx.lineWidth = 0.25;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * L * 0.5, y + Math.sin(a + 0.4) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
    }
    for (let i = 0; i < 5; i++) { const x = lx + (r.next() - 0.5) * 100, y = 268 + i * 5; brush(ctx, [[x - 14, y], [x, y - 0.8], [x + 14, y + 0.3]], { w: 0.6, c: TONE[2 + (i % 2)], a: 0.7, ta: 0.3, tb: 0.45 }, r); }   // ripples
    for (let i = 0; i < 9; i++) { const a = -0.3 + i * 0.75, x = lx + Math.cos(a) * 80, y = ly + Math.sin(a) * 32; brush(ctx, [[x - Math.sin(a) * 6, y + Math.cos(a) * 3], [x + Math.sin(a) * 6, y - Math.cos(a) * 3]], { w: 1.4, c: TONE[1], c2: TONE[3], a: 0.8, press: 0.5, dry: 0.5 }, r); }   // broken shore
    // reeds gathered on the bank – detail only where the eye should go, the rest stays empty paper
    for (const [bx, by] of [[lx + 70, ly - 22], [lx + 82, ly - 10], [lx - 76, ly + 14]]) for (let k = 0; k < 6; k++) {
      const x = bx + (k - 3) * 1.1, hh = 8 + r.next() * 8, ln = (r.next() - 0.5) * 0.5;
      brush(ctx, [[x, by], [x + ln * hh * 0.5, by - hh * 0.5], [x + ln * hh, by - hh]], { w: 0.55, c: k % 3 ? TONE[1] : TONE[2], a: 0.85, ta: 0, tb: 0.7, steps: 3 }, r);
    }
    ctx.restore();
  }
  function seal(ctx, x, y, size, seed) {
    const r = rng(seed);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.04);
    ctx.fillStyle = PALETTE.vermilion; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = PALETTE.paperHi; ctx.lineWidth = size * 0.09; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(size * (0.22 + r.next() * 0.2), size * (0.2 + i * 0.2)); ctx.lineTo(size * (0.55 + r.next() * 0.25), size * (0.22 + i * 0.19)); ctx.stroke(); }   // carved strokes, never real text
    ctx.restore();
  }

  const C = {};
  function sprites() {
    if (C.hero) return;
    const HP = heroPoses();
    const knot = (P) => [-5.2 * Math.cos(P.lean) + 7.9 * Math.sin(P.lean), -5.2 * Math.sin(P.lean) - 7.9 * Math.cos(P.lean) - 5 + P.by];
    const mk = (P) => Object.assign(bake(40, 46, 20, 42.5, 5, (c, r) => paintHero(c, r, P), 5000), { knot: knot(P) });   // same seed per pose: strokes do not boil
    C.hero = { walk: HP.walk.map(mk), idle: HP.idle.map(mk) };
    C.crow = CROW_POSES.map((P) => bake(30, 32, 14, 30, 5, (c, r) => paintCrow(c, r, P), 6000));
    C.bamboo = bake(50, 80, 25, 76, 3, paintBamboo, 1100);
    C.plum = bake(64, 56, 32, 52, 3, paintPlum, 1200);
    C.mountain = bake(96, 124, 48, 120, 3, paintMountain, 1500);
    C.enso = bake(16, 16, 8, 8, 8, (c, r) => { const pts = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * 0.62 + (i / 16) * TAU * 0.9; pts.push([Math.cos(a) * 5.6, Math.sin(a) * 5.6]); } brush(c, pts, { w: 1.7, c: TONE[0], c2: TONE[3], ta: 0, tb: 0.4, press: 0.55, dry: 0.7, steps: 4, gs: 1 }, r); }, 2410);
  }

  /** walks in place on twos (12 fps, 8 poses); moving=false shows the idle: breathe, hold, blink */
  function drawHero(ctx, x, y, t, facing, moving) {
    sprites();
    const walking = moving !== false, tk = Math.floor(t * 12);
    const fr = walking ? C.hero.walk[tk & 7] : C.hero.idle[(tk % 47) < 2 ? 2 : (tk % 30) < 15 ? 0 : 1];
    const fd = facing < 0 ? -1 : 1;
    drawSash(ctx, x + fr.knot[0] * fd, y + fr.knot[1], fd, t, walking ? 0.8 : 0);
    blit(ctx, fr, x, y, fd < 0);
  }
  /** a crow hopping on its own tempo; phase offsets keep a flock from moving in lock-step */
  function drawEnemy(ctx, x, y, t, phase) {
    sprites();
    blit(ctx, C.crow[Math.floor(t * 9 + (phase || 0) * 6) % 6], x, y, Math.sin(t * 0.3 + (phase || 0)) < 0);
  }

  function draw(ctx, w, h, t) {
    sprites();
    const s = h / 360, vw = 360 * w / h;
    if (!C.ground || C.gw !== w || C.gh !== h) { C.ground = canvas(w, h); C.gw = w; C.gh = h; paintGround(C.ground.getContext('2d'), vw, s, w, h); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(C.ground, 0, 0);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const shadow = (x, y, rx) => { ctx.globalAlpha = 0.16; ctx.fillStyle = PALETTE.shadow; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.3, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; };
    const hx = vw * 0.5, hy = 210, list = [];
    // wind: tall plants shear at the top in a slow swell, the base stays
    const sway = (img, x, y, k, flip) => { ctx.save(); ctx.transform(1, 0, k, 1, -k * y, 0); blit(ctx, img, x, y, flip); ctx.restore(); };
    list.push({ y: 150, f: () => blit(ctx, C.mountain, vw * 0.8, 150) });
    list.push({ y: 120, f: () => { shadow(vw * 0.14, 120, 12); sway(C.bamboo, vw * 0.14, 120, 0.03 * Math.sin(t * 0.7) + 0.015 * Math.sin(t * 1.9)); } });
    list.push({ y: 330, f: () => { shadow(vw * 0.66, 330, 12); sway(C.bamboo, vw * 0.66, 330, 0.03 * Math.sin(t * 0.7 - 1.2) + 0.015 * Math.sin(t * 1.9 - 2), true); } });
    list.push({ y: 250, f: () => { shadow(vw * 0.36, 250, 11); sway(C.plum, vw * 0.36, 250, 0.008 * Math.sin(t * 0.7 - 0.6)); } });
    list.push({ y: hy, f: () => { shadow(hx, hy, 8); drawHero(ctx, hx, hy, t, Math.sin(t * 0.4) >= 0 ? 1 : -1, Math.sin(t * 0.25) > -0.6); } });
    [[hx + 90, 180], [hx - 110, 230], [hx + 130, 270], [hx - 60, 300]].forEach(([x, y], i) => list.push({ y, f: () => { const ex = x + Math.sin(t * 0.8 + i) * 8; shadow(ex, y, 6); drawEnemy(ctx, ex, y, t * (0.9 + i * 0.07), i * 0.37); } }));
    list.sort((a, b) => a.y - b.y);
    for (const o of list) o.f();
    // two ensō circles orbit the main character, each with a vermilion dot
    for (let i = 0; i < 2; i++) {
      const a = t * 2.4 + i * Math.PI, x = hx + Math.cos(a) * 44, y = hy - 8 + Math.sin(a) * 37;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2.2 + i * 2); ctx.drawImage(C.enso.c, -8, -8, 16, 16); ctx.restore();
      ctx.fillStyle = PALETTE.vermilion; ctx.beginPath(); ctx.arc(x, y, 1.1, 0, TAU); ctx.fill();
    }
    // drifting mist band, then the unpainted misty margin, inscription and seal
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const mx = ((t * 8 * s) % (w * 1.4)) - w * 0.2;
    const mg = ctx.createRadialGradient(mx, h * 0.42, 0, mx, h * 0.42, h * 0.5); mg.addColorStop(0, 'rgba(249,244,232,0.35)'); mg.addColorStop(1, 'rgba(249,244,232,0)');
    ctx.save(); ctx.translate(0, h * 0.42); ctx.scale(1, 0.18); ctx.translate(0, -h * 0.42); ctx.fillStyle = mg; ctx.fillRect(0, 0, w, h); ctx.restore();
    const e = h * 0.11;
    for (const [x0, y0, x1, y1] of [[0, 0, 0, e], [0, h, 0, h - e], [0, 0, e, 0], [w, 0, w - e, 0]]) {
      const lg = ctx.createLinearGradient(x0, y0, x1, y1); lg.addColorStop(0, 'rgba(243,236,221,0.8)'); lg.addColorStop(1, 'rgba(243,236,221,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
    }
    seal(ctx, h * 0.04, h * 0.9, h * 0.034, 4343);
    const gr = rng(4242), gz = h * 0.034;   // a column of abstract calligraphy – never real text
    for (let i = 0; i < 4; i++) {
      const gx = h * 0.057, gy = h * 0.68 + i * gz * 1.1, o = { c: TONE[1], a: 0.72, ta: 0, tb: 0.3, press: 0.45 };
      brush(ctx, [[gx - gz * 0.3, gy - gz * 0.2], [gx + gz * 0.3, gy - gz * 0.22]], Object.assign({ w: gz * 0.1 }, o), gr);
      brush(ctx, [[gx, gy - gz * 0.4], [gx, gy + gz * 0.38]], Object.assign({ w: gz * 0.11 }, o), gr);
      if (i % 2) brush(ctx, [[gx, gy + gz * 0.05], [gx - gz * 0.35, gy + gz * 0.36]], Object.assign({ w: gz * 0.09, tb: 0.8 }, o), gr);
      else brush(ctx, [[gx + gz * 0.05, gy + gz * 0.08], [gx + gz * 0.38, gy + gz * 0.34]], Object.assign({ w: gz * 0.1, ta: 0.4 }, o), gr);
    }
  }

  const Starter = { id: 'sumie', name: 'Sumi-e Ink', palette: PALETTE, tones: TONE, fonts: ['Ma Shan Zheng', 'Zhi Mang Xing', 'Yuji Mai', 'Cormorant Garamond:ital,wght@0,500;0,600;1,500;1,600'],
    drawHero, drawEnemy, draw, brush, wash, bake, seal, heroPoses, drawSash };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['sumie'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
