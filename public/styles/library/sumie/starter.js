/* Sumi-e Ink — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Black ink in five tones on warm xuan paper. Everything is built from one-stroke brush ribbons
   (pressed start, tapering end, optional dry-brush "flying white" bristles) and soft ink washes,
   baked once into sprites. One accent only: vermilion for seals, blossoms and the sash. */
(function (root) {
  'use strict';
  const PALETTE = {
    paper: '#f3ecdd', paperHi: '#f9f4e8', jiao: '#161412', nong: '#2c2926', zhong: '#56524c', dan: '#8a857c', qing: '#beb8aa',
    groundInk: '#322f2c', shadow: '#3a3630', vermilion: '#ce3c26', vermilionDeep: '#a0261a', vermilionLight: '#e47052', silk: '#4e4b46',
  };
  const TONE = [[22, 20, 18], [44, 41, 38], [86, 82, 76], [138, 133, 124], [190, 184, 170]];
  const VERM = [206, 60, 38], VERM_D = [160, 38, 24], PAPER = [243, 236, 221];
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
  /** ink wash inside a closed shape: base tone, darker blot, optional mist fade at the bottom (bake on its own canvas) */
  function wash(ctx, P, o) {
    ctx.save();
    ctx.beginPath(); P.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.closePath();
    if (o.bleed) { ctx.filter = 'blur(' + (o.bleed * scaleOf(ctx)).toFixed(1) + 'px)'; ctx.globalAlpha = 0.35; ctx.fillStyle = o.c; ctx.fill(); ctx.filter = 'none'; }
    ctx.globalAlpha = o.a === undefined ? 1 : o.a; ctx.fillStyle = o.c; ctx.fill();
    ctx.clip();
    if (o.dark) { const g = ctx.createRadialGradient(o.dark[0], o.dark[1], 0, o.dark[0], o.dark[1], o.dark[2]); g.addColorStop(0, o.dk); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-500, -500, 1000, 1000); }
    if (o.fade) { ctx.globalCompositeOperation = 'destination-out'; const g = ctx.createLinearGradient(0, o.fade[0], 0, o.fade[1]); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); ctx.fillStyle = g; ctx.fillRect(-500, o.fade[0], 1000, 1000); }
    ctx.restore();
  }
  const blob = (cx, cy, rx, ry, r, n) => Array.from({ length: n || 12 }, (_, i) => { const a = (i / (n || 12)) * TAU, k = 1 + (r.next() - 0.5) * 0.2; return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
  function dot(ctx, x, y, s, c, a) { ctx.globalAlpha = a; ctx.fillStyle = rgb(c); ctx.beginPath(); ctx.ellipse(x, y, s * 1.4, s * 0.6, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  function eye(ctx, x, y, r) { ctx.fillStyle = PALETTE.paperHi; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.1, 0, 0, TAU); ctx.fill(); ctx.fillStyle = PALETTE.jiao; ctx.beginPath(); ctx.arc(x + r * 0.35, y, r * 0.52, 0, TAU); ctx.fill(); }

  /* ---------------- baked sprites (K px per world unit, anchor at the feet) ---------------- */
  function bake(wu, hu, ax, ay, K, fn, seed) {
    const c = canvas(wu * K, hu * K), ctx = c.getContext('2d');
    ctx.setTransform(K, 0, 0, K, ax * K, ay * K); ctx.lineCap = 'round';
    fn(ctx, rng(seed));
    return { c, ax, ay, wu, hu };
  }
  function blit(ctx, s, x, y, flip) {
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(s.c, -s.ax, -s.ay, s.wu, s.hu); ctx.restore();
  }
  function paintHero(ctx, r, ph) {
    const s = Math.sin(ph), wv = Math.cos(ph);
    brush(ctx, [[-7.6, -2.4], [-0.8, -18], [5.9, -33.2]], { w: 1.25, c: TONE[2], ta: 0, tb: 0 }, r);                  // giant brush on the back
    brush(ctx, [[6.3, -34.2], [7.4, -37], [8.6, -40.2]], { w: 2.9, c: TONE[0], ta: 0, tb: 0.8, press: 0.35, dry: 0.35, bleed: 0.35 }, r);
    brush(ctx, [[-2, -12.9], [-5.8, -12.3 + wv * 0.6], [-9.4, -11.4 - wv * 0.9], [-13.2, -10.2 + wv * 1.2]], { w: 1.8, c: VERM, c2: VERM_D, ta: 0, tb: 0.6 }, r);
    for (const [hx, dx] of [[-1.7, -2.5 * s], [1.7, 2.5 * s]]) { brush(ctx, [[hx * 0.7, -7.6], [hx + dx * 0.55, -4.1], [hx + dx, -1.3]], { w: 2.4, c: TONE[1], ta: 0, tb: 0.1, dry: 0.3 }, r); dot(ctx, hx + dx + 0.9, -0.7, 0.95, TONE[0], 1); }
    wash(ctx, spline([[-3.4, -21.2], [0.2, -21.8], [3.4, -21], [4.8, -17], [5.4, -11.6], [6.6, -5.6], [2.2, -4.6], [-2.2, -4.9], [-6.9, -5.4], [-5.9, -11.4], [-5.1, -17.2], [-3.4, -21.2]], 4),
      { c: PALETTE.qing, dark: [3.6, -9.5, 5], dk: 'rgba(138,133,124,0.8)', bleed: 0.7 });
    brush(ctx, [[-3.2, -21.4], [-5.3, -16.4], [-6.1, -10.4], [-7.4, -5]], { w: 3, c: TONE[0], c2: TONE[3], ta: 0.05, tb: 0.25, press: 0.6, dry: 0.6 }, r);   // one bold back stroke
    brush(ctx, [[3.6, -20.8], [5, -16], [5.6, -10.8], [7, -5.5]], { w: 1.4, c: TONE[1], c2: TONE[3], tb: 0.4, dry: 0.55 }, r);
    brush(ctx, [[-7, -5.2], [-2.2, -4.3], [2.4, -4.6], [7, -5.5]], { w: 1.1, c: TONE[1], c2: TONE[3], dry: 0.65 }, r);
    brush(ctx, [[-5.8, -13.3], [0, -12.4], [5.7, -13.1]], { w: 2.1, c: VERM, c2: VERM_D, ta: 0, tb: 0.04, press: 0.3 }, r);   // vermilion sash
    brush(ctx, [[2.8, -20.6], [5.8, -19], [7.6 + s, -14.4], [8.1 + s, -11.9]], { w: 2.2, c: TONE[0], c2: TONE[3], tb: 0.35, press: 0.5, dry: 0.55 }, r);
    const hx = 1.1, hy = -25, R = 3.3;
    ctx.fillStyle = PALETTE.paperHi; ctx.beginPath(); ctx.ellipse(hx, hy, R, R * 1.08, 0, 0, TAU); ctx.fill();   // bare-paper face
    ctx.strokeStyle = PALETTE.nong; ctx.lineWidth = 0.55; ctx.beginPath(); ctx.ellipse(hx, hy, R, R * 1.08, 0, -0.6, 2.2); ctx.stroke();
    wash(ctx, [[hx - 0.6, hy - 3.6], [hx + 2, hy - 3.2], [hx + 3.1, hy - 1.9], [hx + 1, hy - 2.3], [hx - 0.9, hy - 0.9], [hx - 1.4, hy + 1.6], [hx - 1.1, hy + 3], [hx - 3.1, hy + 2.1], [hx - 3.7, hy - 0.9], [hx - 2.8, hy - 3]], { c: PALETTE.jiao, bleed: 0.45 });
    ctx.fillStyle = PALETTE.jiao; ctx.beginPath(); ctx.arc(hx - 0.6, hy - R - 1.5, 1.45, 0, TAU); ctx.fill();   // topknot
    brush(ctx, [[hx - 1.9, hy - R - 0.4], [hx + 0.7, hy - R - 0.6]], { w: 0.75, c: VERM, ta: 0, tb: 0.1 }, r);
    brush(ctx, [[hx + 1.4, hy - 0.1], [hx + 2.4, hy - 0.3]], { w: 0.6, c: TONE[0], ta: 0.1, tb: 0.4, press: 0.5 }, r);
  }
  function paintBlot(ctx, r, ph) {
    const s = Math.sin(ph), by = -7.2 - Math.abs(s) * 0.7;
    for (let i = 0; i < 4; i++) { const lx = -4.2 + i * 2.8, q = i % 2 ? s : -s; brush(ctx, [[lx * 0.8, by + 4], [lx + q * 1.3, -0.4]], { w: 1.1, c: TONE[0], ta: 0, tb: 0.45 }, r); }
    const bp = blob(0, by, 7.6, 6.3, r, 12);
    wash(ctx, spline(bp.concat([bp[0]]), 3), { c: PALETTE.jiao, dark: [2.5, by + 2.4, 4], dk: 'rgba(86,82,76,0.5)', bleed: 1.1 });
    for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.16 + (i / 6) * 0.68), x0 = Math.cos(a) * 6.4, y0 = by + Math.sin(a) * 5.2; brush(ctx, [[x0, y0], [x0 + Math.cos(a) * 3, y0 + Math.sin(a) * 3]], { w: 1.05, c: TONE[0], ta: 0, tb: 0.8, dry: 0.35 }, r); }
    eye(ctx, 3.5, by - 1.3, 1.8); eye(ctx, -0.1, by - 1.6, 1.5);
  }
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

  /* ---------------- the paper: warm xuan sheet with fibres, pale washes, a lake left as bare paper ---------------- */
  function paintGround(ctx, vw, s, w, h) {
    ctx.fillStyle = PALETTE.paper; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.scale(s, s);
    const r = rng(7);
    ctx.filter = 'blur(' + (14 * s).toFixed(0) + 'px)';
    for (const [x, y, rx, ry] of [[vw * 0.18, 70, 90, 40], [vw * 0.78, 300, 120, 36], [vw * 0.6, 60, 70, 24]]) { ctx.globalAlpha = 0.09; ctx.fillStyle = PALETTE.groundInk; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }
    // banks: a wash around the lake, the water itself stays bare paper
    ctx.globalAlpha = 0.13; ctx.beginPath(); ctx.ellipse(vw * 0.24, 280, 96, 44, -0.1, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = PALETTE.paperHi; ctx.filter = 'blur(' + (3 * s).toFixed(0) + 'px)'; ctx.beginPath(); ctx.ellipse(vw * 0.24, 280, 78, 30, -0.1, 0, TAU); ctx.fill();
    ctx.filter = 'none';
    for (let i = 0; i < 600; i++) {   // fibres
      const x = r.next() * vw, y = r.next() * 360, a = r.next() * TAU, L = 2 + r.next() * 12, light = r.next() < 0.6;
      ctx.strokeStyle = light ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.08)'; ctx.lineWidth = 0.25;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * L * 0.5, y + Math.sin(a + 0.4) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
    }
    for (let i = 0; i < 6; i++) { const x = vw * 0.24 + (r.next() - 0.5) * 110, y = 268 + i * 5; brush(ctx, [[x - 14, y], [x, y - 0.8], [x + 14, y + 0.3]], { w: 0.6, c: TONE[2 + (i % 2)], a: 0.7, ta: 0.3, tb: 0.45 }, r); }   // ripples
    for (let i = 0; i < 9; i++) { const a = -0.3 + i * 0.75, x = vw * 0.24 + Math.cos(a) * 80, y = 280 + Math.sin(a) * 32; brush(ctx, [[x - Math.sin(a) * 6, y + Math.cos(a) * 3], [x + Math.sin(a) * 6, y - Math.cos(a) * 3]], { w: 1.4, c: TONE[1], c2: TONE[3], a: 0.8, press: 0.5, dry: 0.5 }, r); }   // broken shore
    for (let i = 0; i < 40; i++) {   // sparse grass and moss dots: most of the sheet stays empty (ma)
      const x = r.next() * vw, y = r.next() * 360;
      if (Math.hypot((x - vw * 0.24) / 90, (y - 280) / 40) < 1) continue;
      if (i % 3) for (let k = 0; k < 3; k++) brush(ctx, [[x + k * 0.6, y], [x + k * 0.6 + (k - 1) * 1.8, y - 4.5]], { w: 0.65, c: TONE[1], a: 0.8, ta: 0.08, tb: 0.8, press: 0.35 }, r);
      else for (let k = 0; k < 4; k++) dot(ctx, x + (r.next() - 0.5) * 6, y + (r.next() - 0.5) * 3, 0.5, TONE[0], 0.85);
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
    C.hero = [0, 1, 2, 3].map((p) => bake(28, 44, 14, 41.5, 4, (c, r) => paintHero(c, r, (p / 4) * TAU), 5000));
    C.blot = [0, 1, 2, 3].map((p) => bake(26, 23, 13, 20, 4, (c, r) => paintBlot(c, r, (p / 4) * TAU), 6000));
    C.bamboo = bake(50, 80, 25, 76, 3, paintBamboo, 1100);
    C.plum = bake(64, 56, 32, 52, 3, paintPlum, 1200);
    C.mountain = bake(96, 124, 48, 120, 3, paintMountain, 1500);
    C.enso = bake(16, 16, 8, 8, 8, (c, r) => { const pts = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * 0.62 + (i / 16) * TAU * 0.9; pts.push([Math.cos(a) * 5.6, Math.sin(a) * 5.6]); } brush(c, pts, { w: 1.7, c: TONE[0], c2: TONE[3], ta: 0, tb: 0.4, press: 0.55, dry: 0.7, steps: 4, gs: 1 }, r); }, 2410);
  }

  function drawHero(ctx, x, y, t, facing) { sprites(); blit(ctx, C.hero[Math.floor(t * 6) & 3], x, y - Math.abs(Math.sin(t * 9.4)) * 0.9, facing < 0); }
  function drawEnemy(ctx, x, y, t) { sprites(); blit(ctx, C.blot[Math.floor(t * 5) & 3], x, y, Math.sin(t * 0.3) < 0); }

  function draw(ctx, w, h, t) {
    sprites();
    const s = h / 360, vw = 360 * w / h;
    if (!C.ground || C.gw !== w || C.gh !== h) { C.ground = canvas(w, h); C.gw = w; C.gh = h; paintGround(C.ground.getContext('2d'), vw, s, w, h); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(C.ground, 0, 0);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const shadow = (x, y, rx) => { ctx.globalAlpha = 0.16; ctx.fillStyle = PALETTE.shadow; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.3, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; };
    const hx = vw * 0.5, hy = 210, list = [];
    list.push({ y: 150, f: () => blit(ctx, C.mountain, vw * 0.8, 150) });
    list.push({ y: 120, f: () => { shadow(vw * 0.14, 120, 12); blit(ctx, C.bamboo, vw * 0.14, 120); } });
    list.push({ y: 330, f: () => { shadow(vw * 0.66, 330, 12); blit(ctx, C.bamboo, vw * 0.66, 330, true); } });
    list.push({ y: 250, f: () => { shadow(vw * 0.36, 250, 11); blit(ctx, C.plum, vw * 0.36, 250); } });
    list.push({ y: hy, f: () => { shadow(hx, hy, 8); drawHero(ctx, hx, hy, t, Math.sin(t * 0.4) >= 0 ? 1 : -1); } });
    [[hx + 90, 180], [hx - 110, 230], [hx + 130, 270], [hx - 60, 300]].forEach(([x, y], i) => list.push({ y, f: () => { const ex = x + Math.sin(t * 0.8 + i) * 8; shadow(ex, y, 9); drawEnemy(ctx, ex, y, t + i * 0.37); } }));
    list.sort((a, b) => a.y - b.y);
    for (const o of list) o.f();
    // two ensō circles orbit the main character, each with a vermilion dot
    for (let i = 0; i < 2; i++) {
      const a = t * 2.4 + i * Math.PI, x = hx + Math.cos(a) * 44, y = hy - 8 + Math.sin(a) * 37;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2.2 + i * 2); ctx.drawImage(C.enso.c, -8, -8, 16, 16); ctx.restore();
      ctx.fillStyle = PALETTE.vermilion; ctx.beginPath(); ctx.arc(x, y, 1.1, 0, TAU); ctx.fill();
    }
    // a flung drop of ink with a dry-brush tail
    const px = hx + 20 + ((t * 120) % 70), py = hy - 14 - ((t * 120) % 70) * 0.3;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.29); ctx.globalAlpha = 0.85;
    const g = ctx.createLinearGradient(-20, 0, 0, 0); g.addColorStop(0, 'rgba(44,41,38,0)'); g.addColorStop(1, 'rgba(44,41,38,0.9)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-20, 0.3); ctx.lineTo(0, -1.6); ctx.lineTo(0, 1.6); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = PALETTE.jiao; ctx.beginPath(); ctx.arc(0, 0, 1.9, 0, TAU); ctx.fill(); ctx.restore();
    // drifting mist band, then the unpainted misty margin, inscription and seals
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
    // a column of abstract calligraphy (bars, a spine, falling strokes) – never real text
    const gr = rng(4242), gz = h * 0.034;
    for (let i = 0; i < 4; i++) {
      const gx = h * 0.057, gy = h * 0.68 + i * gz * 1.1, o = { c: TONE[1], a: 0.72, ta: 0, tb: 0.3, press: 0.45 };
      brush(ctx, [[gx - gz * 0.3, gy - gz * 0.2], [gx + gz * 0.3, gy - gz * 0.22]], Object.assign({ w: gz * 0.1 }, o), gr);
      brush(ctx, [[gx, gy - gz * 0.4], [gx, gy + gz * 0.38]], Object.assign({ w: gz * 0.11 }, o), gr);
      if (i % 2) brush(ctx, [[gx, gy + gz * 0.05], [gx - gz * 0.35, gy + gz * 0.36]], Object.assign({ w: gz * 0.09, tb: 0.8 }, o), gr);
      else brush(ctx, [[gx + gz * 0.05, gy + gz * 0.08], [gx + gz * 0.38, gy + gz * 0.34]], Object.assign({ w: gz * 0.1, ta: 0.4 }, o), gr);
    }
  }

  const Starter = { id: 'sumie', name: 'Sumi-e Ink', palette: PALETTE, tones: TONE, fonts: ['Ma Shan Zheng', 'Zhi Mang Xing', 'Yuji Mai', 'Cormorant Garamond:ital,wght@0,500;0,600;1,500;1,600'],
    drawHero, drawEnemy, draw, brush, wash, bake, seal };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['sumie'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
