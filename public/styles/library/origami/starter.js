/* Origami Fold — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Everything is a "fold mesh": flat triangles with a pseudo height per vertex. One light from the upper left gives
   each facet a flat tone from a 4-step ramp; shared edges become mountain folds (bright line) or valley folds
   (dark line) automatically; open edges get a deep paper edge. Meshes are baked once into sprites. */
(function (root) {
  'use strict';
  const RAMP = {
    coral: ['#f7a283', '#e8755b', '#c95b47', '#9b4136'], cream: ['#fffbf3', '#f3e9d6', '#dccbae', '#b5a083'],
    indigo: ['#7488c9', '#4f62a6', '#3b4a87', '#283462'], teal: ['#63c2b3', '#35a194', '#277f76', '#1a5b56'],
    sage: ['#bdd39b', '#98b37d', '#779562', '#587149'], mustard: ['#f8d372', '#e6ae42', '#c68c2d', '#936624'],
    blush: ['#f9c0bd', '#ee9597', '#cd7279', '#9d525c'], plum: ['#9a7fbb', '#76599b', '#5a447c', '#3f3059'],
    pine: ['#88c197', '#60a077', '#46805c', '#305d44'], wood: ['#d4ae83', '#b0875e', '#8b6543', '#63472f'],
    ink: ['#5a5368', '#3d3747', '#2e2936', '#201c27'],
  };
  const PALETTE = {
    paper: '#f4eee1', sheetSage: '#d5e1c0', sheetMustard: '#f2dca6', sheetCoral: '#f3cebe', sheetTeal: '#c3dfd6', water: '#88a8d8',
    waveLit: '#a9c3ea', waveShade: '#6d8cc6', coral: '#e8755b', cream: '#f3e9d6', indigo: '#4f62a6', teal: '#35a194', sage: '#98b37d',
    mustard: '#e6ae42', blush: '#ee9597', plum: '#76599b', pine: '#60a077', wood: '#b0875e', ink: '#2a2433', shadow: '#4e3848',
  };
  const TAU = Math.PI * 2, PI = Math.PI, INK = PALETTE.ink;
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
  const LINE = {};
  for (const k in RAMP) { const r = RAMP[k]; LINE[k] = { edge: mixHex(r[3], INK, 0.38), hi: mixHex(r[0], '#ffffff', 0.55), lo: mixHex(r[3], INK, 0.15) }; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y, s) => (vnoise(x, y, s) * 0.6 + vnoise(x * 2, y * 2, s + 7) * 0.3 + vnoise(x * 4, y * 4, s + 13) * 0.1);
  const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.ceil(w)), height: Math.max(1, Math.ceil(h)) });

  /* ---------------- fold mesh: one light, 4 tones, automatic mountain / valley creases ---------------- */
  const LV = (() => { const v = [-0.55, -0.45, 0.7], l = Math.hypot(...v); return v.map((a) => a / l); })();
  const toneOf = (nx, ny, nz) => { const d = nx * LV[0] + ny * LV[1] + nz * LV[2]; return d > 0.8 ? 0 : d > 0.55 ? 1 : d > 0.3 ? 2 : 3; };
  function Fold() { this.v = []; this.f = []; this.idx = new Map(); this.dots = []; this.T = null; }
  Fold.prototype.at = function (tx, ty, s, rot) { this.T = tx === undefined ? null : { tx, ty, s: s || 1, c: Math.cos(rot || 0), sn: Math.sin(rot || 0) }; return this; };
  Fold.prototype.pt = function (p) {
    let x = p[0], y = p[1], z = p[2] || 0; const T = this.T;
    if (T) { const X = x * T.c - y * T.sn, Y = x * T.sn + y * T.c; x = T.tx + X * T.s; y = T.ty + Y * T.s; z *= T.s; }
    const k = Math.round(x * 64) + ',' + Math.round(y * 64) + ',' + Math.round(z * 64);
    let i = this.idx.get(k);
    if (i === undefined) { i = this.v.length / 3; this.v.push(x, y, z); this.idx.set(k, i); }
    return i;
  };
  Fold.prototype.tri = function (a, b, c, col) { this.f.push({ a: this.pt(a), b: this.pt(b), c: this.pt(c), key: Array.isArray(col) ? col[0] : col, off: Array.isArray(col) ? col[1] : 0 }); return this; };
  Fold.prototype.quad = function (a, b, c, d, col) { this.tri(a, b, c, col); return this.tri(a, c, d, col); };
  Fold.prototype.kite = function (A, B, P, Q, col) { this.tri(A, P, B, col); return this.tri(A, B, Q, col); };
  Fold.prototype.strip = function (p0, p1, w0, w1, z, col) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const L0 = [p0[0] + nx * w0 / 2, p0[1] + ny * w0 / 2, 0], R0 = [p0[0] - nx * w0 / 2, p0[1] - ny * w0 / 2, 0], C0 = [p0[0], p0[1], z];
    if (w1 <= 0) { const C1 = [p1[0], p1[1], z * 0.3]; this.tri(L0, C0, C1, col); return this.tri(C0, R0, C1, col); }
    const L1 = [p1[0] + nx * w1 / 2, p1[1] + ny * w1 / 2, 0], R1 = [p1[0] - nx * w1 / 2, p1[1] - ny * w1 / 2, 0], C1 = [p1[0], p1[1], z];
    this.quad(L0, C0, C1, L1, col); return this.quad(C0, R0, R1, C1, col);
  };
  Fold.prototype.fan = function (c, ring, col) { for (let i = 0; i < ring.length; i++) this.tri(c, ring[i], ring[(i + 1) % ring.length], col); return this; };
  Fold.prototype.dot = function (x, y, r, col, hi) { this.dots.push({ x, y, r, col, hi }); return this; };
  const L3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * t];

  function renderFold(ctx, m, o) {
    o = o || {};
    const mir = o.mirror ? -1 : 1, v = m.v, n = v.length / 3, F = m.f;
    const X = [], Y = [], Z = [];
    for (let i = 0; i < n; i++) { X[i] = v[i * 3] * mir; Y[i] = v[i * 3 + 1]; Z[i] = v[i * 3 + 2]; }
    const N = [], tone = [], edges = new Map(), ek = (p, q) => (p < q ? p * 100003 + q : q * 100003 + p);
    F.forEach((f, i) => {
      const e1 = [X[f.b] - X[f.a], Y[f.b] - Y[f.a], Z[f.b] - Z[f.a]], e2 = [X[f.c] - X[f.a], Y[f.c] - Y[f.a], Z[f.c] - Z[f.a]];
      let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const l = Math.hypot(nx, ny, nz) || 1; N[i] = [nx / l, ny / l, nz / l];
      tone[i] = Math.max(0, Math.min(3, toneOf(...N[i]) + (f.off || 0)));
      for (const [p, q] of [[f.a, f.b], [f.b, f.c], [f.c, f.a]]) { const k = ek(p, q); if (!edges.has(k)) edges.set(k, []); edges.get(k).push(i); }
    });
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const ol = o.ol || 0.55, cw = o.cw || 0.3;
    F.forEach((f, i) => {
      const col = RAMP[f.key][tone[i]];
      ctx.beginPath(); ctx.moveTo(X[f.a], Y[f.a]); ctx.lineTo(X[f.b], Y[f.b]); ctx.lineTo(X[f.c], Y[f.c]); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = o.seam || 0.25; ctx.stroke();  // hides AA seams
      for (const [p, q] of [[f.a, f.b], [f.b, f.c], [f.c, f.a]]) {
        const j = edges.get(ek(p, q)).find((t) => t !== i);
        if (j === undefined) { ctx.strokeStyle = LINE[f.key].edge; ctx.lineWidth = ol; }           // open paper edge
        else if (j > i) continue;
        else {
          const g = F[j], d = [g.a, g.b, g.c].find((x) => x !== p && x !== q);
          const s = (N[i][0] * (X[d] - X[p]) + N[i][1] * (Y[d] - Y[p]) + N[i][2] * (Z[d] - Z[p])) / (Math.hypot(X[d] - X[p], Y[d] - Y[p]) + 1e-6);
          if (Math.abs(s) < 0.025) { if (g.key === f.key) continue; ctx.strokeStyle = LINE[f.key].lo; ctx.globalAlpha = 0.45; }
          else if (s < 0) { ctx.strokeStyle = LINE[tone[i] < tone[j] ? f.key : g.key].hi; ctx.globalAlpha = 0.9; }  // mountain fold
          else { ctx.strokeStyle = LINE[tone[i] > tone[j] ? f.key : g.key].lo; ctx.globalAlpha = 0.6; }          // valley fold
          ctx.lineWidth = cw;
        }
        ctx.beginPath(); ctx.moveTo(X[p], Y[p]); ctx.lineTo(X[q], Y[q]); ctx.stroke(); ctx.globalAlpha = 1;
      }
    });
    for (const d of m.dots) {
      ctx.fillStyle = d.col || INK; ctx.beginPath(); ctx.arc(d.x * mir, d.y, d.r, 0, TAU); ctx.fill();
      if (d.hi) { ctx.fillStyle = 'rgba(255,252,240,.9)'; ctx.beginPath(); ctx.arc(d.x * mir - d.r * 0.32 * mir, d.y - d.r * 0.35, d.r * 0.34, 0, TAU); ctx.fill(); }
    }
  }

  /* ---------------- models (feet at 0,0, facing +x, world units; 360 units = screen height) ---------------- */
  function fox(m, fr) {
    const Y = (y) => y - fr.bob, H = (x, y, z) => [x, Y(y), z || 0];
    const TA = [-2.4, Y(-9.6), 1.8], TB = [-12.8, Y(-22.6) + fr.tail, 1.2], TP = [-10.6, Y(-11.4), 0], TQ = [-4.6, Y(-18.8), 0];
    m.kite(TA, TB, TP, TQ, 'coral').kite(L3(TA, TB, 0.6), TB, L3(TP, TB, 0.52), L3(TQ, TB, 0.52), 'cream');
    m.strip([-1.7, Y(-8.2)], [fr.b, 0], 3.0, 2.1, 1.0, ['ink', 1]).strip([1.8, Y(-8.2)], [fr.a, 0], 3.0, 2.1, 1.0, 'ink');
    const Nk = [0.8, Y(-18.8), 2.2], BL = [-6.4, Y(-6), 0], BR = [6.8, Y(-6.4), 0], BC = [0.9, Y(-5.2), 2.6];
    m.tri(Nk, BL, BC, 'indigo').tri(Nk, BC, BR, 'indigo');
    m.quad(L3(Nk, BL, 0.55), L3(Nk, BC, 0.55), L3(Nk, BC, 0.7), L3(Nk, BL, 0.7), 'mustard').quad(L3(Nk, BC, 0.55), L3(Nk, BR, 0.55), L3(Nk, BR, 0.7), L3(Nk, BC, 0.7), 'mustard');
    m.quad(L3(Nk, BL, 0.9), L3(Nk, BC, 0.9), BC, BL, 'cream').quad(L3(Nk, BC, 0.9), L3(Nk, BR, 0.9), BR, BC, 'cream');  // hem = cream back side
    m.kite([3.2, Y(-16.4), 1.8], [6 + fr.arm, Y(-9.6), 1.6], [1.8, Y(-11.4), 0], [7.8, Y(-14), 0], 'indigo');
    m.kite(H(-2.7, -26, 1.8), H(-4.6, -34), H(-4.8, -24.4), H(-0.6, -27), 'coral').tri(H(-3.9, -25.9, 0.6), H(-1.5, -26.7, 0.6), H(-4.2, -31.6, 0.6), ['cream', 1]);
    m.kite(H(2.6, -26.6, 1.8), H(2.4, -34.8), H(0.4, -26.9), H(4.8, -25.6), 'coral').tri(H(1.3, -26.9, 0.6), H(3.9, -26.1, 0.6), H(2.5, -32.2, 0.6), ['cream', 1]);
    const F = H(-0.4, -27.4, 2.6), Bk = H(-5, -23.4), Ck = H(-3, -19.4), Ch = H(3.4, -18.4, 0.4), Sn = H(10.4, -21, 0.8), Ft = H(4.9, -26, 1), Md = H(2.2, -22.4, 3.6);
    m.tri(F, Bk, Md, 'coral').tri(Bk, Ck, Md, 'coral').tri(F, Md, Ft, 'coral').tri(Ft, Md, Sn, 'coral').tri(Md, Ck, Ch, 'cream').tri(Md, Ch, Sn, 'cream');
    m.dot(4.7, Y(-23.3), 0.85, INK, true).dot(10.1, Y(-21), 0.75, INK);
  }
  function frog(m, key, y) {
    const by = -y;
    m.kite([-2.6, -6.4 + by, 2.2], [-9.4, -0.4, 0.4], [-3.4, -0.6, 0], [-7.6, -7 + by, 0], [key, 1]);
    const R = [-7.4, -4.8 + by, 0], T = [-1.2, -11.8 + by, 0], Nn = [7.8, -6.8 + by, 0], B = [0.4, -1.2, 0], C = [0.2, -6.6 + by, 3.6];
    m.tri(R, T, C, key).tri(T, Nn, C, key).tri(R, C, B, 'cream').tri(C, Nn, B, 'cream');
    m.tri([0.6, -10.4 + by, 1.2], [2, -14 + by, 2.2], [3.5, -10.6 + by, 1.8], key).tri([3.4, -9.6 + by, 1.6], [5, -12.8 + by, 2], [6.4, -9.2 + by, 1.2], key);
    m.dot(2, -11.6 + by, 0.8, INK, true).dot(5, -10.4 + by, 0.75, INK, true);
    m.tri([3.6, -3.6 + by, 1.2], [6.6, -0.2, 0.4], [2.4, -0.4, 0], [key, 1]);
  }
  function crane(m, u) {
    const wy = -11 - 12.8 * u, wx = -4.6 + 2.4 * (1 - u), under = u < 0.1;
    m.kite([-0.6, -11.4, 1.3], [wx + 3, wy - 1.4, 0.8], [-2.6, -11, 0], [2.2, -11.8, 0], under ? ['cream', 1] : ['blush', 1]);
    m.strip([-3.6, -10.6], [-12.6, -17.4], 2.8, 0, 1.2, 'blush').strip([3.4, -10.8], [9.4, -19.8], 2.8, 1, 1.1, 'blush');
    m.tri([8.9, -20, 0.9], [10.6, -20.8, 0.7], [13.6, -16.6, 0.2], 'blush');
    m.fan([0.2, -10.6, 3], [[-5, -10.6, 0], [0.2, -13.6, 0], [5.6, -10.8, 0], [0.4, -7.4, 0]], 'blush');
    m.kite([0.4, -10.4, 1.6], [wx, wy, 1], [-2.4, -9.9, 0], [3, -10.6, 0], under ? 'cream' : 'blush');
  }
  function pine(m) {
    m.strip([0, 0.6], [0, -10], 3.8, 3, 1, 'wood');
    for (let t = 0; t < 3; t++) { const yb = -7 - t * 14, w = 15.5 - t * 3.8, yt = yb - 24.6; m.tri([0.3, yt, 1.6], [-w, yb, 0], [1, yb + 3, 5.5], 'pine').tri([0.3, yt, 1.6], [1, yb + 3, 5.5], [w, yb + 0.6, 0], 'pine'); }
  }
  function roundTree(m, key) {
    m.strip([0, 0.6], [0, -18], 4, 2.8, 1.2, 'wood');
    const inner = [], outer = [], cy = -33;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - PI / 2, k = i & 1 ? 0.92 : 1, b = a + PI / 8;
      outer.push([Math.cos(a) * 15 * k, cy + Math.sin(a) * 13.5 * k, 0]); inner.push([-1 + Math.cos(b) * 7.5, cy - 1 + Math.sin(b) * 6.75, 6.5]);
    }
    for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; m.tri(outer[i], outer[j], inner[i], key).tri(inner[i], outer[j], inner[j], key).tri([-1.6, cy - 2.2, 9.5], inner[i], inner[j], key); }
  }
  function plane(m, ang) {
    m.at(0, 0, 1, ang).tri([7, 0, 1], [-5, -4.8, 1.8], [-3.6, 0, 0], 'cream').tri([7, 0, 1], [-3.6, 0, 0], [-5, 4.8, 1.8], 'cream');
    m.tri([-5, -4.8, 1.8], [-3, -3, 1.2], [-4.6, -1.6, 0.6], 'coral').tri([-5, 4.8, 1.8], [-4.6, 1.6, 0.6], [-3, 3, 1.2], 'coral').at();
  }
  function shuriken(m, rot) {
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * PI) / 2, T = [Math.cos(a) * 9, Math.sin(a) * 9, 0];
      m.tri([Math.cos(a - PI / 4) * 3.2, Math.sin(a - PI / 4) * 3.2, 1.2], T, [0, 0, 2.6], i & 1 ? 'teal' : 'coral');
      m.tri([0, 0, 2.6], T, [Math.cos(a + PI / 4) * 3.2, Math.sin(a + PI / 4) * 3.2, 1.2], i & 1 ? 'coral' : 'teal');
    }
  }
  function luckyStar(m, r) {
    const o = [], n = [];
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU - PI / 2; o.push([Math.cos(a) * r, Math.sin(a) * r, 0]); n.push([Math.cos(a + PI / 5) * r * 0.5, Math.sin(a + PI / 5) * r * 0.5, r * 0.25]); }
    for (let k = 0; k < 5; k++) m.tri([0, 0, r * 0.62], n[(k + 4) % 5], o[k], 'mustard').tri([0, 0, r * 0.62], o[k], n[k], 'mustard');
  }

  /* ---------------- baking: sprite + sheared soft cast shadow (light from the upper left) ---------------- */
  const C = { K: 0 };
  function bake(box, fn, mirror, K) {
    const pad = 1.4, x0 = mirror ? -box[2] : box[0], x1 = mirror ? -box[0] : box[2];
    const c = canvas((x1 - x0 + pad * 2) * K, (box[3] - box[1] + pad * 2) * K), ctx = c.getContext('2d');
    const ox = (-x0 + pad) * K, oy = (-box[1] + pad) * K;
    ctx.setTransform(K, 0, 0, K, ox, oy);
    const m = new Fold(); fn(m); renderFold(ctx, m, { mirror, seam: 0.9 / K });
    return { c, ox, oy };
  }
  function castShadow(s, shx, shy, alpha, K) {
    const pad = Math.ceil(K * 3), W = Math.ceil(s.c.width + Math.abs(shx) * s.oy) + pad * 2, H = Math.ceil(Math.abs(shy) * s.c.height) + pad * 2 + K * 4;
    const c = canvas(W, H), ctx = c.getContext('2d'), ax = s.ox + pad, ay = shy < 0 ? pad + K * 2 : Math.ceil(shy * s.oy) + pad;
    const sil = canvas(s.c.width, s.c.height), sc = sil.getContext('2d');
    sc.drawImage(s.c, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = PALETTE.shadow; sc.fillRect(0, 0, sil.width, sil.height);
    ctx.filter = 'blur(' + (K * 1.1).toFixed(1) + 'px)'; ctx.globalAlpha = alpha;
    ctx.setTransform(1, 0, -shx, shy, ax - s.ox + shx * s.oy, ay - shy * s.oy); ctx.drawImage(sil, 0, 0);
    return { c, ox: ax, oy: ay };
  }
  function sprites(h) {
    const K = Math.max(2, Math.min(8, Math.round((h / 360) * 1.6)));
    if (C.K === K) return K;
    C.K = K;
    const FR = [{ a: 1.8, b: -1.6, bob: 0, tail: 0, arm: 0 }, { a: 4.8, b: -4.4, bob: 0.3, tail: -1, arm: 1.3 }, { a: 1.4, b: -0.9, bob: 1.1, tail: 0.4, arm: 0.2 }, { a: -3.6, b: 3.8, bob: 0.3, tail: 1, arm: -1.3 }];
    const pair = (box, fn, shx, shy) => [false, true].map((mir) => { const s = bake(box, fn, mir, K); s.sh = castShadow(s, shx, shy, 0.3, K); return s; });
    C.fox = FR.map((fr) => pair([-14, -36, 12, 2], (m) => fox(m, fr), 0.62, -0.36));
    C.frog = ['teal', 'sage', 'mustard'].map((key) => pair([-14, -16, 10, 2], (m) => frog(m, key, 0), 0.5, -0.4));
    C.crane = [1, 0.45, -0.35, 0.45].map((u) => pair([-14, -26, 15, 1], (m) => crane(m, u), 0.05, 0.42));
    C.pine = pair([-17, -60, 17, 4], pine, 0.62, -0.34)[0];
    C.tree = ['coral', 'mustard', 'sage'].map((k) => pair([-17, -50, 17, 4], (m) => roundTree(m, k), 0.62, -0.34)[0]);
    C.plane = []; for (let i = 0; i < 16; i++) C.plane.push(bake([-8, -8, 8, 8], (m) => plane(m, (i / 16) * TAU), false, K));
    C.shuri = []; for (let i = 0; i < 8; i++) C.shuri.push(bake([-10, -10, 10, 10], (m) => shuriken(m, (i / 8) * (PI / 2)), false, K));
    C.star = bake([-5, -5, 5, 5], (m) => luckyStar(m, 4.4), false, K);
    C.ground = null;
    return K;
  }
  function blit(ctx, s, x, y, sx, sy, K) { ctx.drawImage(s.c, x - (s.ox / K) * sx, y - (s.oy / K) * (sy || sx), (s.c.width / K) * sx, (s.c.height / K) * (sy || sx)); }

  /* ---------------- ground: one sheet with a pyramid crease tessellation, sheets on top, sunken water ---------------- */
  const CS = 40, GROUND = [PALETTE.paper, PALETTE.sheetSage, PALETTE.sheetMustard, PALETTE.sheetCoral, PALETTE.sheetTeal, PALETTE.water].map(hex);
  const LAYER = [1, 2, 3, 4, 5, 0], RELIEF = [0.022, -0.017, -0.027, 0.013];
  function region(x, y) {
    if (fbm(x / 260 + 3, y / 260, 71) > 0.66 && x > 380) return 5;
    if (fbm(x / 170, y / 170, 31) < 0.5) return 0;
    const c = fbm(x / 400, y / 400, 47); return c < 0.42 ? 1 : c < 0.5 ? 2 : c < 0.58 ? 3 : 4;
  }
  function triPts(i, j, k) {
    const x0 = i * CS, y0 = j * CS, x1 = x0 + CS, y1 = y0 + CS, cx = x0 + CS / 2, cy = y0 + CS / 2;
    return [[x0, y0, x1, y0, cx, cy], [x1, y0, x1, y1, cx, cy], [x1, y1, x0, y1, cx, cy], [x0, y1, x0, y0, cx, cy]][k];
  }
  function paintGround(ctx, vw, s) {
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const ni = Math.ceil(vw / CS) + 1, nj = 10, tris = [], reg = (i, j, k) => { const p = triPts(i, j, k); return region((p[0] + p[2] + p[4]) / 3, (p[1] + p[3] + p[5]) / 3); };
    for (let j = -1; j < nj; j++) for (let i = -1; i < ni; i++) for (let k = 0; k < 4; k++) {
      const r = reg(i, j, k), amp = 0.4 + 0.9 * fbm(i * 0.21, j * 0.21, 91), g = GROUND[r], m = 1 + (r === 5 ? 0 : RELIEF[k] * amp);
      tris.push({ i, j, k, r, L: LAYER[r], p: triPts(i, j, k), col: 'rgb(' + g.map((v) => Math.min(255, v * m) | 0).join(',') + ')' });
    }
    const path = (list) => { const p = new Path2D(); for (const t of list) { const q = t.p; p.moveTo(q[0], q[1]); p.lineTo(q[2], q[3]); p.lineTo(q[4], q[5]); p.closePath(); } return p; };
    const OUT = [[0, -1, 2], [1, 0, 3], [0, 1, 0], [-1, 0, 1]];
    for (let L = 0; L < 6; L++) {
      const list = tris.filter((t) => t.L === L); if (!list.length) continue;
      if (L > 0) { const p = path(list); ctx.save(); ctx.fillStyle = 'rgba(84,60,58,.07)'; ctx.translate(2.6, 3.2); ctx.fill(p); ctx.fillStyle = 'rgba(84,60,58,.09)'; ctx.translate(-1.3, -1.6); ctx.fill(p); ctx.restore(); }
      for (const t of list) { const q = t.p; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.lineTo(q[4], q[5]); ctx.closePath(); ctx.fillStyle = ctx.strokeStyle = t.col; ctx.lineWidth = 0.6; ctx.fill(); ctx.stroke(); }
      if (L === 0) { ctx.save(); ctx.clip(path(list)); waves(ctx, vw); ctx.restore(); continue; }
      for (const t of list) {   // folded hem: cream back side turned over along every edge that borders a lower layer
        const q = t.p, o = OUT[t.k];
        for (const [a, b, nl] of [[0, 1, LAYER[reg(t.i + o[0], t.j + o[1], o[2])]], [1, 2, LAYER[reg(t.i, t.j, (t.k + 1) & 3)]], [2, 0, LAYER[reg(t.i, t.j, (t.k + 3) & 3)]]]) {
          if (nl >= L) continue;
          const c = 3 - a - b, f = 2.4 / Math.hypot(q[c * 2] - (q[a * 2] + q[b * 2]) / 2, q[c * 2 + 1] - (q[a * 2 + 1] + q[b * 2 + 1]) / 2);
          const P = (u) => [q[u * 2] + (q[c * 2] - q[u * 2]) * f, q[u * 2 + 1] + (q[c * 2 + 1] - q[u * 2 + 1]) * f], A2 = P(a), B2 = P(b);
          ctx.fillStyle = mixHex(t.r === 0 ? PALETTE.paper : [PALETTE.paper, PALETTE.sheetSage, PALETTE.sheetMustard, PALETTE.sheetCoral, PALETTE.sheetTeal][t.r], '#fffcf4', 0.55);
          ctx.beginPath(); ctx.moveTo(q[a * 2], q[a * 2 + 1]); ctx.lineTo(q[b * 2], q[b * 2 + 1]); ctx.lineTo(B2[0], B2[1]); ctx.lineTo(A2[0], A2[1]); ctx.fill();
          ctx.strokeStyle = 'rgba(96,72,60,.22)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(A2[0], A2[1]); ctx.lineTo(B2[0], B2[1]); ctx.stroke();
          ctx.strokeStyle = 'rgba(96,72,60,.34)'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(q[a * 2], q[a * 2 + 1]); ctx.lineTo(q[b * 2], q[b * 2 + 1]); ctx.stroke();
        }
      }
    }
    // creases: diagonals are mountain folds (light), the square grid valley folds (dark), majors in diagram notation
    for (const t of tris) {
      if (t.r === 5) continue;
      const q = t.p;
      ctx.strokeStyle = 'rgba(255,253,246,.7)'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(q[2], q[3]); ctx.lineTo(q[4], q[5]); ctx.stroke();
      if (t.k === 0 && t.j % 4) { ctx.strokeStyle = 'rgba(98,76,60,.13)'; ctx.lineWidth = 0.38; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.stroke(); }
      if (t.k === 3 && t.i % 4) { ctx.strokeStyle = 'rgba(98,76,60,.13)'; ctx.lineWidth = 0.38; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.stroke(); }
    }
    ctx.lineWidth = 0.6;
    for (let x = 0; x < vw + 1; x += CS * 4) { ctx.strokeStyle = 'rgba(59,74,135,.28)'; ctx.setLineDash([5, 3.5]); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 360); ctx.stroke(); }
    for (let y = 0; y < 361; y += CS * 4) { ctx.strokeStyle = 'rgba(201,91,71,.3)'; ctx.setLineDash([7, 2.5, 1.2, 2.5]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(vw, y); ctx.stroke(); }
    ctx.setLineDash([]);
    // paper fibre
    const r = rng(9137); ctx.lineCap = 'round';
    for (let i = 0; i < vw * 360 / 120; i++) {
      const x = r() * vw, y = r() * 360, a = r() * PI, l = 1 + r() * 3;
      ctx.strokeStyle = r() < 0.55 ? 'rgba(255,255,255,.4)' : 'rgba(120,92,64,.1)'; ctx.lineWidth = 0.25;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    }
  }
  /** Folded waves: chevron pleats – ridge (light line), shaded slope, valley (dark line), lit slope. */
  function waves(ctx, vw) {
    const PW = 18, PH = 11, A = 3.4;
    const row = (r, dy) => { const off = hash2(r, 3, 77) * PW, pts = []; for (let x = -off - PW; x <= vw + PW; x += PW / 2) pts.push([x, r * PH + dy + (Math.round((x + off) / (PW / 2)) & 1 ? A : 0)]); return pts; };
    for (let r = -1; r < 36; r++) {
      const top = row(r, 0), mid = row(r, PH * 0.45), bot = row(r + 1, 0);
      const band = (a, b, col) => { ctx.fillStyle = col; ctx.beginPath(); a.forEach((p) => ctx.lineTo(p[0], p[1])); b.slice().reverse().forEach((p) => ctx.lineTo(p[0], p[1])); ctx.fill(); };
      band(top, mid, PALETTE.waveShade); band(mid, bot, PALETTE.waveLit);
      ctx.strokeStyle = 'rgba(44,64,122,.32)'; ctx.lineWidth = 0.45; ctx.beginPath(); mid.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.55; ctx.beginPath(); top.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.stroke();
    }
  }

  /* ---------------- public draw functions ---------------- */
  function drawHero(ctx, x, y, t, facing) {
    const K = C.K || sprites(ctx.canvas.height), set = C.fox[Math.floor(t * 8) & 3];
    const s = set[facing < 0 ? 1 : 0], lift = Math.abs(Math.sin(t * 8 * PI / 2)) * 1.1;
    blit(ctx, s.sh, x, y, 1, 1, K); blit(ctx, s, x, y - lift, 1, 1, K);
  }
  function drawEnemy(ctx, x, y, t, v) {
    const K = C.K || sprites(ctx.canvas.height), set = C.frog[(v || 0) % 3], ph = (t * 1.8) % 1, lift = ph > 0.2 && ph < 0.78 ? Math.sin(((ph - 0.2) / 0.58) * PI) * 4.5 : 0;
    blit(ctx, set[1].sh, x, y, 1, 1, K); blit(ctx, set[1], x, y - lift, 1, 1, K);
  }
  function drawCrane(ctx, x, y, t) {
    const K = C.K, s = C.crane[Math.floor(t * 10) & 3][0], h = 8 + Math.sin(t * 3) * 1.8;
    blit(ctx, s.sh, x + h * 0.45 + 2, y + 2.5, 0.9, 0.9, K); blit(ctx, s, x, y - h, 1, 1, K);
  }
  function confetti(ctx, x, y, s, rot, flip, key) {
    const R = RAMP[key], co = Math.cos(rot) * s, si = Math.sin(rot) * s, f = Math.abs(flip) < 0.15 ? 0.15 : flip;
    ctx.save(); ctx.transform(co, si, -si * f, co * f, x, y);
    ctx.fillStyle = flip > 0 ? R[flip > 0.6 ? 0 : 1] : RAMP.cream[flip < -0.6 ? 0 : 2];   // two-sided paper: colour front, cream back
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0.95, 0.7); ctx.lineTo(-0.95, 0.7); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function draw(ctx, w, h, t) {
    const K = sprites(h), s = h / 360, vw = 360 * w / h;
    if (!C.ground || C.gw !== w || C.gh !== h) { C.ground = canvas(w, h); C.gw = w; C.gh = h; paintGround(C.ground.getContext('2d'), vw, s); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(C.ground, 0, 0); ctx.setTransform(s, 0, 0, s, 0, 0);
    const hx = vw * 0.5, hy = 200, list = [];
    [[vw * 0.12, 120, 'pine'], [vw * 0.2, 330, 0], [vw * 0.82, 110, 1], [vw * 0.66, 340, 'pine'], [vw * 0.9, 250, 2], [vw * 0.3, 160, 2]].forEach(([x, y, k]) => {
      const sp = k === 'pine' ? C.pine : C.tree[k]; blit(ctx, sp.sh, x, y, 1, 1, K); list.push({ y, f: () => blit(ctx, sp, x, y, 1, 1, K) });
    });
    list.push({ y: hy, f: () => drawHero(ctx, hx, hy, t, Math.sin(t * 0.4) >= 0 ? 1 : -1) });
    [[hx + 80, 170, 0], [hx - 100, 235, 1], [hx + 120, 270, 2], [hx - 50, 120, 0], [hx - 170, 290, 2]].forEach(([x, y, v], i) => list.push({ y, f: () => drawEnemy(ctx, x + ((t * 9 + i * 7) % 14) * (x < hx ? 1 : -1), y, t + i * 0.37, v) }));
    [[hx - 120, 170], [hx + 60, 305]].forEach(([x, y], i) => list.push({ y, f: () => drawCrane(ctx, x + Math.sin(t + i) * 10, y, t + i * 0.4) }));
    list.sort((a, b) => a.y - b.y);
    for (const [x, y] of [[hx + 40, 232], [hx - 62, 188], [hx + 96, 206], [hx - 18, 282]]) { ctx.globalAlpha = 0.3; ctx.fillStyle = PALETTE.shadow; ctx.beginPath(); ctx.ellipse(x + 1, y + 0.5, 3, 1.2, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; blit(ctx, C.star, x, y - 5 - Math.sin(t * 4 + x) * 1.2, 1, 1, K); }
    for (const o of list) o.f();
    // orbiting shuriken, a paper-plane projectile with a pencil flight line, a confetti burst of two-sided paper
    for (let i = 0; i < 2; i++) { const a = t * 2.4 + i * PI, x = hx + Math.cos(a) * 44, y = hy - 4 + Math.sin(a) * 37; blit(ctx, C.shuri[Math.floor(t * 30 + i * 3) & 7], x, y - 4, 1, 0.8, K); }
    const pa = -0.35, px = hx + 16 + ((t * 110) % 60), py = hy - 10 - ((t * 110) % 60) * 0.36, pl = C.plane[Math.round((((pa % TAU) + TAU) % TAU) / TAU * 16) & 15];
    ctx.strokeStyle = '#7a6c74'; ctx.globalAlpha = 0.55; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(px - Math.cos(pa) * 7, py - Math.sin(pa) * 7); ctx.lineTo(px - Math.cos(pa) * 12, py - Math.sin(pa) * 12); ctx.stroke(); ctx.globalAlpha = 1;
    blit(ctx, pl, px, py, 1, 1, K);
    const keys = ['coral', 'mustard', 'teal', 'cream', 'blush'];
    for (let i = 0; i < 14; i++) {
      const a = hash2(i, 0, 5) * TAU, k = (t * 0.8 + hash2(i, 1, 5)) % 1, d = 6 + k * 26;
      confetti(ctx, hx + 80 + Math.cos(a) * d, 150 + Math.sin(a) * d * 0.6 - 14 * Math.sin(k * PI) + k * 8, 1.9 * (1 - k * 0.4), t * 5 + i, Math.cos(t * 9 + i * 2.3), keys[i % 5]);
    }
    ctx.font = '900 9px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fffbf3'; ctx.lineWidth = 2.6; ctx.strokeText('34', hx + 82, 132 - (t * 8) % 6); ctx.fillStyle = '#3b4a87'; ctx.fillText('34', hx + 82, 132 - (t * 8) % 6);
    // soft light from the upper left + warm vignette
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,250,235,.16)'); g.addColorStop(0.45, 'rgba(255,250,235,0)'); g.addColorStop(0.7, 'rgba(90,64,80,0)'); g.addColorStop(1, 'rgba(90,64,80,.14)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  const Starter = { id: 'origami', name: 'Origami Fold', palette: PALETTE, ramps: RAMP, fonts: ['Zen Maru Gothic:wght@500;700;900', 'M PLUS Rounded 1c:wght@500;700;800', 'Kalam:wght@400;700'],
    drawHero, drawEnemy, draw, Fold, renderFold, bake, castShadow, fox, frog, crane, pine, roundTree, plane, shuriken, luckyStar };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['origami'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
