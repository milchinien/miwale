/* Origami Fold — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Everything is a "fold mesh": flat triangles with a pseudo height per vertex. One light from the upper left gives
   each facet a flat tone from a 4-step ramp; shared edges become mountain folds (bright line) or valley folds
   (dark line) automatically; open edges get a deep paper edge. Every pose is baked once into a sprite and played
   back like a stop-motion puppet: held poses on 8-12 fps steps, each actor on its own phase. */
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
    paper: '#f4eee1', meadow: '#d5e1c0', grove: '#b7cf9e', field: '#f2dca6', blossom: '#f3cebe', shore: '#c3dfd6', water: '#88a8d8',
    waveLit: '#a9c3ea', waveShade: '#6d8cc6', ribbon: '#e8d9bc', ribbonBack: '#faf5ea', coral: '#e8755b', cream: '#f3e9d6',
    indigo: '#4f62a6', teal: '#35a194', sage: '#98b37d', mustard: '#e6ae42', blush: '#ee9597', plum: '#76599b', pine: '#60a077',
    wood: '#b0875e', ink: '#2a2433', shadow: '#4e3848',
  };
  const TAU = Math.PI * 2, PI = Math.PI, INK = PALETTE.ink;
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
  const LINE = {};
  for (const k in RAMP) { const r = RAMP[k]; LINE[k] = { edge: mixHex(r[3], INK, 0.38), hi: mixHex(r[0], '#ffffff', 0.55), lo: mixHex(r[3], INK, 0.15) }; }
  function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
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

  /** o: { mirror, crumple (vertex jitter = crushed paper), ol, cw, seam } */
  function renderFold(ctx, m, o) {
    o = o || {};
    const mir = o.mirror ? -1 : 1, v = m.v, n = v.length / 3, F = m.f, X = [], Y = [], Z = [];
    for (let i = 0; i < n; i++) {
      const c = o.crumple || 0;
      X[i] = v[i * 3] * mir + (hash2(i, 1, 7) - 0.5) * c * 0.9; Y[i] = v[i * 3 + 1] + (hash2(i, 2, 7) - 0.5) * c * 0.9; Z[i] = v[i * 3 + 2] + (hash2(i, 3, 7) - 0.5) * c * 5;
    }
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
  // main character pose: a/b near/far foot x, la/lb foot lift, bob, lean, sw hem lag, tx/ty tail-tip lag, ey ear-tip lag, arm swing
  function fox(m, fr) {
    const lc = Math.cos(fr.lean || 0), ls = Math.sin(fr.lean || 0);
    const P = (x, y, z) => { const dx = x - 0.4, dy = y - fr.bob + 8.2; return [0.4 + dx * lc - dy * ls, -8.2 + dx * ls + dy * lc, z || 0]; };
    const tx = fr.tx || 0, ty = fr.ty || 0, sw = fr.sw || 0, ey = fr.ey || 0, ar = fr.arm || 0;
    const TA = P(-2.4, -9.6, 1.8), TB = P(-12.8 + tx, -22.6 + ty, 1.2), TP = P(-10.6 + tx * 0.5, -11.4 + ty * 0.4), TQ = P(-4.6 + tx * 0.3, -18.8 + ty * 0.6);
    m.kite(TA, TB, TP, TQ, 'coral').kite(L3(TA, TB, 0.6), TB, L3(TP, TB, 0.52), L3(TQ, TB, 0.52), 'cream');   // tail, tip folded back
    m.strip(P(-1.7, -8.2), [fr.b, -fr.lb], 3.0, 2.1, 1.0, ['ink', 1]).tri([fr.b - 1.3, -fr.lb, 0], [fr.b + 2.4, -fr.lb * 0.75 + 0.2, 0], [fr.b - 0.4, -fr.lb - 2.2, 0.9], ['ink', 1]);
    m.strip(P(1.8, -8.2), [fr.a, -fr.la], 3.0, 2.1, 1.0, 'ink').tri([fr.a - 1.3, -fr.la, 0], [fr.a + 2.5, -fr.la * 0.75 + 0.2, 0], [fr.a - 0.4, -fr.la - 2.2, 0.9], 'ink');
    const Nk = P(0.8, -18.8, 2.2), BL = P(-6.4 + sw, -6.0), BR = P(6.8 + sw * 0.7, -6.4), BC = P(0.9 + sw * 0.4, -5.2, 2.6);   // kimono, hem lags
    m.tri(Nk, BL, BC, 'indigo').tri(Nk, BC, BR, 'indigo');
    m.quad(L3(Nk, BL, 0.55), L3(Nk, BC, 0.55), L3(Nk, BC, 0.7), L3(Nk, BL, 0.7), 'mustard').quad(L3(Nk, BC, 0.55), L3(Nk, BR, 0.55), L3(Nk, BR, 0.7), L3(Nk, BC, 0.7), 'mustard');
    m.quad(L3(Nk, BL, 0.9), L3(Nk, BC, 0.9), BC, BL, 'cream').quad(L3(Nk, BC, 0.9), L3(Nk, BR, 0.9), BR, BC, 'cream');  // hem = cream back side
    const SA = P(3.2, -16.4, 1.8), SB = P(6 + ar, -9.6, 1.6), SP = P(1.8 + ar * 0.2, -11.4), SQ = P(7.8 + ar * 0.7, -14);   // sleeve counter-swings
    m.kite(SA, SB, SP, SQ, 'indigo').tri(L3(SP, SB, 0.62), L3(SA, SB, 0.7), SB, ['cream', 1]).tri(L3(SA, SB, 0.7), L3(SQ, SB, 0.62), SB, 'cream');
    m.kite(P(-2.7, -26, 1.8), P(-4.6, -34 + ey), P(-4.8, -24.4), P(-0.6, -27), 'coral').tri(P(-3.9, -25.9, 0.6), P(-1.5, -26.7, 0.6), P(-4.2, -31.6 + ey * 0.8, 0.6), ['cream', 1]);
    m.kite(P(2.6, -26.6, 1.8), P(2.4, -34.8 + ey), P(0.4, -26.9), P(4.8, -25.6), 'coral').tri(P(1.3, -26.9, 0.6), P(3.9, -26.1, 0.6), P(2.5, -32.2 + ey * 0.8, 0.6), ['cream', 1]);
    const F = P(-0.4, -27.4, 2.6), Bk = P(-5, -23.4), Ck = P(-3, -19.4), Ch = P(3.4, -18.4, 0.4), Sn = P(10.4, -21, 0.8), Ft = P(4.9, -26, 1), Md = P(2.2, -22.4, 3.6);
    m.tri(F, Bk, Md, 'coral').tri(Bk, Ck, Md, 'coral').tri(F, Md, Ft, 'coral').tri(Ft, Md, Sn, 'coral').tri(Md, Ck, Ch, 'cream').tri(Md, Ch, Sn, 'cream');
    const E = P(4.7, -23.3), No = P(10.1, -21);
    m.dot(E[0], E[1], 0.85, INK, true).dot(No[0], No[1], 0.75, INK);
  }
  // 8-pose walk: contact – down – passing – up for each foot; tail, ears and hem take the previous pose's bob (overlap)
  const FOX_WALK = (() => {
    const out = [], S = 4.4, LIFT = 2.4, bobs = [0.3, -0.3, 0.8, 1.3];
    const foot = (ph) => (ph < 0.5 ? { x: S - (ph / 0.5) * 2 * S, l: 0 } : { x: -S + ((ph - 0.5) / 0.5) * 2 * S, l: Math.sin(((ph - 0.5) / 0.5) * PI) * LIFT });
    for (let i = 0; i < 8; i++) {
      const ph = i / 8, nf = foot(ph), ff = foot((ph + 0.5) % 1), bob = bobs[i & 3], prev = bobs[(i + 3) & 3];
      out.push({ a: 1 + nf.x, la: nf.l, b: -0.6 + ff.x, lb: ff.l, bob, lean: 0.07 + (bob > 1 ? 0.025 : 0), arm: -nf.x * 0.5,
        sw: (prev - bob) * 1.3 - nf.x * 0.12, tx: -Math.cos(ph * TAU * 2) * 0.9, ty: (prev - 0.5) * 2, ey: (bob - prev) * 1.1 });
    }
    return out;
  })();
  // frog poses: sit, crouch (anticipation), launch (stretched), airborne (tucked), land (squash)
  const FROG_FR = [{ y: 0, leg: 0, st: 0 }, { y: -1.7, leg: -0.9, st: 0 }, { y: 1.6, leg: 5.2, st: 1 }, { y: 0.8, leg: 1.2, st: 0.3, tk: 1.2 }, { y: -1.3, leg: -0.4, st: -0.2 }];
  function frog(m, key, fr) {
    const by = -fr.y, st = fr.st, tk = fr.tk || 0;
    m.kite([-2.6, -6.4 + by, 2.2], [-9.4 - fr.leg + tk * 2.6, -0.4 - fr.leg * 0.2 - tk * 1.4, 0.4], [-3.4, -0.6 - tk, 0], [-7.6 - fr.leg * 0.4 + tk, -7 + by, 0], [key, 1]);
    const R = [-7.4 - st * 0.8, -4.8 + by + st * 0.6, 0], T = [-1.2 + st * 0.8, -11.8 + by - st * 1.4, 0], Nn = [7.8 + st, -6.8 + by - st * 2.2, 0], B = [0.4, -1.2 + by * 0.4, 0], C = [0.2 + st * 0.6, -6.6 + by - st, 3.6];
    m.tri(R, T, C, key).tri(T, Nn, C, key).tri(R, C, B, 'cream').tri(C, Nn, B, 'cream');
    const e = by - st * 1.8, ex = st * 0.9;
    m.tri([0.6 + ex, -10.4 + e, 1.2], [2 + ex, -14 + e, 2.2], [3.5 + ex, -10.6 + e, 1.8], key).tri([3.4 + ex, -9.6 + e, 1.6], [5 + ex, -12.8 + e, 2], [6.4 + ex, -9.2 + e, 1.2], key);
    m.dot(2 + ex, -11.6 + e, 0.8, INK, true).dot(5 + ex, -10.4 + e, 0.75, INK, true);
    m.tri([3.6, -3.6 + by, 1.2], [6.6 + st * 2, -0.2 - tk * 0.8, 0.4], [2.4, -0.4, 0], [key, 1]);
  }
  // paper crane: u = wing raise; 6 poses up – half – down-stroke – low – recovery – half
  const CRANE_U = [1, 0.6, -0.05, -0.42, -0.15, 0.5], CRANE_LIFT = [0, 0.5, 1.3, 1.6, 1.0, 0.3], CRANE_SEQ = [0, 0, 1, 2, 3, 4, 5];
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
  function house(m, roof) {
    m.quad([-12, 0, 0], [-12, -15, 0], [-1, -15, 1.2], [-1, 0, 1.2], 'cream').quad([-1, 0, 1.2], [-1, -15, 1.2], [10, -15, 0], [10, 0, 0], 'cream');
    m.quad([10, 0, 0], [10, -15, 0], [17, -18.5, 0], [17, -3.5, 0], ['cream', 1]);                             // side wall
    m.tri([-14, -14, 0], [-1, -31, 3], [-1, -14, 2.6], roof).tri([-1, -14, 2.6], [-1, -31, 3], [12, -14, 0], roof).tri([12, -14, 0], [-1, -31, 3], [18, -17.5, 0], [roof, 1]);
    m.tri([-8.6, -14.2, 0.6], [-4.6, -19.6, 1.4], [-1.2, -14.2, 1.2], 'cream').tri([1.2, -14.2, 1.2], [4.6, -19.6, 1.4], [8.6, -14.2, 0.6], 'cream');   // squash-fold flaps
    m.quad([-8, 0, 0.4], [-8, -8, 0.4], [-4, -8, 0.8], [-4, 0, 0.8], 'indigo').quad([3, -6, 1], [3, -10, 1], [7, -10, 0.6], [7, -6, 0.6], 'mustard');
  }
  function tuft(m, x, y, s, key) {
    m.at(x, y, s, 0).strip([-1.5, 0], [-3.6, -5.2], 1.4, 0, 0.5, key).strip([0, 0], [0.6, -7], 1.6, 0, 0.6, key).strip([1.4, 0], [3.8, -4.6], 1.4, 0, 0.5, key).at();
  }
  function plane(m, ang) {
    m.at(0, 0, 1, ang).tri([7, 0, 1], [-5, -4.8, 1.8], [-3.6, 0, 0], 'cream').tri([7, 0, 1], [-3.6, 0, 0], [-5, 4.8, 1.8], 'cream');
    m.tri([-5, -4.8, 1.8], [-3, -3, 1.2], [-4.6, -1.6, 0.6], 'coral').tri([-5, 4.8, 1.8], [-4.6, 1.6, 0.6], [-3, 3, 1.2], 'coral').at();
  }
  function shuriken(m, rot) {
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * PI) / 2, T = [Math.cos(a) * 9, Math.sin(a) * 9, 0];
      m.tri([Math.cos(a - PI / 4) * 3.2, Math.sin(a - PI / 4) * 3.2, 1.2], T, [0, 0, 2.6], i & 1 ? 'teal' : 'coral').tri([0, 0, 2.6], T, [Math.cos(a + PI / 4) * 3.2, Math.sin(a + PI / 4) * 3.2, 1.2], i & 1 ? 'coral' : 'teal');
    }
  }
  /** flat folded square (spawn packet / the sheet a creature leaves): 4 facets in ramp tones, X creases; open 0 = folded shut */
  function packet(ctx, x, y, s, key, open) {
    const R = RAMP[key], tones = [R[0], R[1], R[2], R[1]], P4 = [[0, -1], [1, 0], [0, 1], [-1, 0]], k = 0.35 + 0.65 * open;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * k, s * k * 0.55);
    for (let i = 0; i < 4; i++) { const a = P4[i], b = P4[(i + 1) % 4]; ctx.fillStyle = tones[i]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.closePath(); ctx.fill(); }
    ctx.lineWidth = 0.08; ctx.strokeStyle = LINE[key].lo; ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(1, 0); ctx.moveTo(0, -1); ctx.lineTo(0, 1); ctx.stroke();
    ctx.strokeStyle = LINE[key].edge; ctx.beginPath(); P4.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.stroke(); ctx.restore();
  }

  /* ---------------- baking: pose sprite + sheared soft cast shadow (light from the upper left) ---------------- */
  const C = { K: 0 };
  function bake(box, fn, mirror, K, crumple) {
    const pad = 1.4, x0 = mirror ? -box[2] : box[0], x1 = mirror ? -box[0] : box[2];
    const c = canvas((x1 - x0 + pad * 2) * K, (box[3] - box[1] + pad * 2) * K), ctx = c.getContext('2d');
    const ox = (-x0 + pad) * K, oy = (-box[1] + pad) * K;
    ctx.setTransform(K, 0, 0, K, ox, oy);
    const m = new Fold(); fn(m); renderFold(ctx, m, { mirror, seam: 0.9 / K, crumple });
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
    if (C.K === K) return K; C.K = K;
    // every pose baked twice from mirrored geometry (never flipped), each with its own shadow
    const pair = (box, fn, shx, shy, cr) => [false, true].map((mir) => { const s = bake(box, fn, mir, K, cr); s.sh = castShadow(s, shx, shy, 0.3, K); return s; });
    C.fox = FOX_WALK.map((fr) => pair([-16, -38, 14, 2], (m) => fox(m, fr), 0.62, -0.36));
    C.frog = ['teal', 'sage', 'mustard'].map((key) => FROG_FR.map((fr) => pair([-15, -18, 12, 2], (m) => frog(m, key, fr), 0.5, -0.4)));
    C.frogHit = pair([-15, -18, 12, 2], (m) => frog(m, 'teal', FROG_FR[1]), 0.5, -0.4, 1.1);   // crumpled pose
    C.flash = tint(C.frogHit[0], '#fffaf0');                                                    // baked hit flash
    C.crane = CRANE_U.map((u) => pair([-14, -28, 15, 1], (m) => crane(m, u), 0.05, 0.42));
    C.pine = pair([-17, -60, 17, 4], pine, 0.62, -0.34)[0];
    C.tree = ['coral', 'mustard', 'teal'].map((k) => pair([-17, -50, 17, 4], (m) => roundTree(m, k), 0.62, -0.34)[0]);
    C.house = ['coral', 'indigo'].map((k) => pair([-15, -33, 20, 3], (m) => house(m, k), 0.62, -0.34)[0]);
    C.plane = []; for (let i = 0; i < 16; i++) C.plane.push(bake([-8, -8, 8, 8], (m) => plane(m, (i / 16) * TAU), false, K));
    C.shuri = []; for (let i = 0; i < 8; i++) C.shuri.push(bake([-10, -10, 10, 10], (m) => shuriken(m, (i / 8) * (PI / 2)), false, K));
    C.ground = null;
    return K;
  }
  function tint(s, col) { const c = canvas(s.c.width, s.c.height), g = c.getContext('2d'); g.drawImage(s.c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return { c, ox: s.ox, oy: s.oy }; }
  function blit(ctx, s, x, y, sx, sy, K) { ctx.drawImage(s.c, x - (s.ox / K) * sx, y - (s.oy / K) * sy, (s.c.width / K) * sx, (s.c.height / K) * sy); }

  /* ---------------- ground: crease grid, designed sites, hemmed sheets, mitred ribbon, clumped grass ---------------- */
  const CS = 40, BASE = 0, MEADOW = 1, FIELD = 2, GROVE = 3, SHORE = 4, WATER = 5;
  const GROUND = [PALETTE.paper, PALETTE.meadow, PALETTE.field, PALETTE.grove, PALETTE.shore, PALETTE.water];
  const LAYER = [2, 3, 5, 4, 1, 0], RELIEF = [0.022, -0.017, -0.027, 0.013], OUT = [[0, -1, 2], [1, 0, 3], [0, 1, 0], [-1, 0, 1]];
  function makeWorld(vw) {
    const S = { vil: { x: vw * 0.66, y: 185, r: 118 }, grv: { x: vw * 0.13, y: 92, r: 92 }, lake: { x: vw * 0.04, y: 345, r: 120 } };
    const cell = (i, j) => {   // one region per crease cell, from designed sites
      const x = (i + 0.5) * CS, y = (j + 0.5) * CS, lk = Math.hypot((x - S.lake.x) / 1.3, y - S.lake.y) / (S.lake.r * (0.8 + 0.4 * vnoise(x / 70, y / 70, 5)));
      if (lk < 1) return WATER; if (lk < 1.25) return SHORE;
      if (Math.abs(x - S.vil.x) + Math.abs(y - S.vil.y) < S.vil.r) return FIELD;
      const g = Math.hypot(x - S.grv.x, y - S.grv.y) / (S.grv.r * (0.78 + 0.44 * vnoise(x / 90, y / 90, 17)));
      return g < 1 ? GROVE : g < 1.75 || vnoise(x / 210, y / 210, 31) > 0.78 ? MEADOW : BASE;
    };
    const tri = (i, j, k) => {   // a higher sheet fills the cell corner where it wraps two sides -> straight 45° folds
      const r = cell(i, j), o = OUT[k], nb = cell(i + o[0], j + o[1]);
      if (nb !== r && LAYER[nb] > LAYER[r]) { const a = OUT[(k + 1) & 3], b = OUT[(k + 3) & 3]; if (cell(i + a[0], j + a[1]) === nb || cell(i + b[0], j + b[1]) === nb) return nb; }
      return r;
    };
    const at = (x, y) => { const i = Math.floor(x / CS), j = Math.floor(y / CS), u = x - (i + 0.5) * CS, v = y - (j + 0.5) * CS; return tri(i, j, Math.abs(u) > Math.abs(v) ? (u > 0 ? 1 : 3) : v > 0 ? 2 : 0); };
    S.ribbon = [[S.grv.x + 84, S.grv.y + 34], [vw * 0.33, 196], [vw * 0.43, 164], [S.vil.x - 52, S.vil.y + 2]];
    S.cell = cell; S.tri = tri; S.at = at;
    return S;
  }
  const triPts = (i, j, k) => { const x0 = i * CS, y0 = j * CS, x1 = x0 + CS, y1 = y0 + CS, cx = x0 + CS / 2, cy = y0 + CS / 2; return [[x0, y0, x1, y0, cx, cy], [x1, y0, x1, y1, cx, cy], [x1, y1, x0, y1, cx, cy], [x0, y1, x0, y0, cx, cy]][k]; };
  function segDist(x, y, pts) {
    let best = 1e9;
    for (let s = 0; s < pts.length - 1; s++) { const a = pts[s], b = pts[s + 1], dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy))); best = Math.min(best, Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t)); }
    return best;
  }
  /** folded ribbon: straight runs cut on the bisector (mitre) of every bend, alternating front / back */
  function ribbon(ctx, pts, w) {
    const n = pts.length - 1, hw = w / 2, unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    const bis = (s) => { const u = unit(pts[s - 1][0] - pts[s][0], pts[s - 1][1] - pts[s][1]), v = unit(pts[s + 1][0] - pts[s][0], pts[s + 1][1] - pts[s][1]); return Math.hypot(u[0] + v[0], u[1] + v[1]) < 1e-3 ? [-u[1], u[0]] : unit(u[0] + v[0], u[1] + v[1]); };
    const cut = (s, dx, dy, nx, ny) => { if (s <= 0 || s >= n) return 0; const [bx, by] = bis(s), c = dx * by - dy * bx; return Math.abs(c) < 0.15 ? 0 : Math.max(-2.5 * hw, Math.min(2.5 * hw, (-hw * (nx * by - ny * bx)) / c)); };
    const quads = [];
    for (let s = 0; s < n; s++) {
      const a = pts[s], b = pts[s + 1], [ux, uy] = unit(b[0] - a[0], b[1] - a[1]), nx = -uy, ny = ux;
      quads.push([[a, nx, ny, cut(s, ux, uy, nx, ny)], [b, nx, ny, cut(s + 1, ux, uy, nx, ny)], [b, -nx, -ny, cut(s + 1, ux, uy, -nx, -ny)], [a, -nx, -ny, cut(s, ux, uy, -nx, -ny)]].map(([p, ex, ey, t]) => [p[0] + ex * hw + ux * t, p[1] + ey * hw + uy * t]));
    }
    const path = (q, d) => { ctx.beginPath(); q.forEach((p) => ctx.lineTo(p[0] + d, p[1] + d * 1.35)); ctx.closePath(); };
    ctx.fillStyle = 'rgba(84,60,58,.1)'; quads.forEach((q) => { path(q, 1.4); ctx.fill(); });
    quads.forEach((q, s) => {
      path(q, 0); ctx.fillStyle = s & 1 ? PALETTE.ribbonBack : PALETTE.ribbon; ctx.fill(); ctx.strokeStyle = 'rgba(120,92,64,.38)'; ctx.lineWidth = 0.45; ctx.stroke();
      if (s) { ctx.strokeStyle = 'rgba(96,70,52,.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); ctx.lineTo(q[3][0], q[3][1]); ctx.stroke(); }
      ctx.setLineDash([3.2, 2.6]); ctx.strokeStyle = s & 1 ? 'rgba(120,92,64,.22)' : 'rgba(255,253,246,.75)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(pts[s][0], pts[s][1]); ctx.lineTo(pts[s + 1][0], pts[s + 1][1]); ctx.stroke(); ctx.setLineDash([]);
    });
  }
  function paintGround(ctx, vw, s, W) {
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const ni = Math.ceil(vw / CS) + 1, tris = [];
    for (let j = -1; j < 10; j++) for (let i = -1; i < ni; i++) for (let k = 0; k < 4; k++) {
      const r = W.tri(i, j, k), amp = 0.4 + 0.9 * vnoise(i * 0.21, j * 0.21, 91), m = 1 + (r === WATER ? 0 : RELIEF[k] * amp);
      tris.push({ i, j, k, r, L: LAYER[r], p: triPts(i, j, k), col: 'rgb(' + hex(GROUND[r]).map((v) => Math.min(255, v * m) | 0).join(',') + ')' });
    }
    const path = (list) => { const p = new Path2D(); for (const t of list) { const q = t.p; p.moveTo(q[0], q[1]); p.lineTo(q[2], q[3]); p.lineTo(q[4], q[5]); p.closePath(); } return p; };
    for (let L = 0; L < 6; L++) {
      const list = tris.filter((t) => t.L === L); if (!list.length) continue;
      if (L > 0) { const p = path(list); ctx.save(); ctx.fillStyle = 'rgba(84,60,58,.07)'; ctx.translate(2.6, 3.2); ctx.fill(p); ctx.fillStyle = 'rgba(84,60,58,.09)'; ctx.translate(-1.3, -1.6); ctx.fill(p); ctx.restore(); }
      for (const t of list) { const q = t.p; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.lineTo(q[4], q[5]); ctx.closePath(); ctx.fillStyle = ctx.strokeStyle = t.col; ctx.lineWidth = 0.6; ctx.fill(); ctx.stroke(); }
      if (L === 0) { ctx.save(); ctx.clip(path(list)); waves(ctx, vw); ctx.restore(); continue; }
      for (const t of list) {   // folded hem: the paper turned over along every edge above a lower sheet
        const q = t.p, o = OUT[t.k];
        for (const [a, b, nl] of [[0, 1, LAYER[W.tri(t.i + o[0], t.j + o[1], o[2])]], [1, 2, LAYER[W.tri(t.i, t.j, (t.k + 1) & 3)]], [2, 0, LAYER[W.tri(t.i, t.j, (t.k + 3) & 3)]]]) {
          if (nl >= L) continue;
          const c = 3 - a - b, f = 2.4 / Math.hypot(q[c * 2] - (q[a * 2] + q[b * 2]) / 2, q[c * 2 + 1] - (q[a * 2 + 1] + q[b * 2 + 1]) / 2);
          const P = (u) => [q[u * 2] + (q[c * 2] - q[u * 2]) * f, q[u * 2 + 1] + (q[c * 2 + 1] - q[u * 2 + 1]) * f], A2 = P(a), B2 = P(b);
          ctx.fillStyle = mixHex(GROUND[t.r], '#fffcf4', 0.55);
          ctx.beginPath(); ctx.moveTo(q[a * 2], q[a * 2 + 1]); ctx.lineTo(q[b * 2], q[b * 2 + 1]); ctx.lineTo(B2[0], B2[1]); ctx.lineTo(A2[0], A2[1]); ctx.fill();
          ctx.strokeStyle = 'rgba(96,72,60,.34)'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(q[a * 2], q[a * 2 + 1]); ctx.lineTo(q[b * 2], q[b * 2 + 1]); ctx.stroke();
        }
      }
    }
    for (const t of tris) {   // creases: diagonals mountain (light), grid valley (dark), majors in diagram notation
      if (t.r === WATER || t.r === SHORE) continue;
      const q = t.p;
      ctx.strokeStyle = 'rgba(255,253,246,.7)'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(q[2], q[3]); ctx.lineTo(q[4], q[5]); ctx.stroke();
      if ((t.k === 0 && t.j % 4) || (t.k === 3 && t.i % 4)) { ctx.strokeStyle = 'rgba(98,76,60,.13)'; ctx.lineWidth = 0.38; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.stroke(); }
    }
    ctx.lineWidth = 0.6; for (let x = 0; x < vw + 1; x += CS * 4) { ctx.strokeStyle = 'rgba(59,74,135,.28)'; ctx.setLineDash([5, 3.5]); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 360); ctx.stroke(); } ctx.setLineDash([]);
    ribbon(ctx, W.ribbon, 12);
    // crop ridges in the village field: pleated sage ridges on the 45° grid, double rows + fallow gap, sprouts on the crease
    const V = W.vil, busy = W.props.filter((p) => p.big);
    const ok = (x, y) => Math.abs(x - V.x) + Math.abs(y - V.y) < V.r - 16 && W.at(x, y) === FIELD && segDist(x, y, W.ribbon) > 12 && !busy.some((p) => Math.hypot(x - p.x, y - p.y + 8) < 24);
    for (let u = -V.r; u <= V.r; u += 12) {
      if (Math.floor((u + V.r) / 24) % 3 === 2) continue;
      let run = [];
      const flush = () => {
        if (run.length >= 3) {
          const m = new Fold(), p0 = run[0], p1 = run[run.length - 1];
          m.strip(p0, p1, 3.2, 3.2, 1.1, 'sage');
          for (let i = 1; i < run.length - 1; i += 2) m.at(run[i][0], run[i][1] - 0.6, 0.7, i & 2 ? -0.18 : 0.18).kite([0, 0, 1.6], [-3.4, -3.4, 1], [-0.6, -1.4, 1.2], [-2.6, -0.4, 1.2], 'pine').kite([0, 0, 1.6], [3, -4, 1], [0.6, -1.6, 1.2], [2.8, -0.8, 1.2], ['pine', 1]).at();
          renderFold(ctx, m, { ol: 0.34, cw: 0.24 });
        } run = [];
      };
      for (let v = -V.r; v <= V.r; v += 3.5) { const x = V.x + (u - v) * 0.7071, y = V.y + (u + v) * 0.7071; if (ok(x, y)) run.push([x, y]); else flush(); }
      flush();
    }
    // grass gathers in clumps at sheet edges and ribbon verges – open paper stays calm
    const m = new Fold();
    for (let cy = 0; cy < 7; cy++) for (let cx = 0; cx < Math.ceil(vw / 62); cx++) {
      const x = (cx + 0.2 + hash2(cx, cy, 1) * 0.6) * 62, y = (cy + 0.2 + hash2(cx, cy, 2) * 0.6) * 62, reg = W.at(x, y);
      if (reg === WATER || reg === FIELD || segDist(x, y, W.ribbon) < 13) continue;
      let edge = false;
      for (let q = 0; q < 6 && !edge; q++) if (W.at(x + Math.cos(q * 1.047) * 20, y + Math.sin(q * 1.047) * 20) !== reg) edge = true;
      const lush = reg !== BASE, p = edge ? (lush ? 0.85 : 0.6) : segDist(x, y, W.ribbon) < 32 ? 0.5 : lush ? 0.2 : 0.04;
      if (hash2(cx, cy, 3) > p) continue;
      const cnt = 3 + ((hash2(cx, cy, 4) * 5) | 0);
      for (let k = 0; k < cnt; k++) { const a = k * 2.4, d = k ? 2.6 + Math.sqrt(k) * 3.6 : 0; tuft(m, x + Math.cos(a) * d * 1.3, y + Math.sin(a) * d * 0.75, 1.0 - (k / cnt) * 0.6, reg === GROVE || reg === SHORE ? 'pine' : 'sage'); }
    }
    renderFold(ctx, m, { ol: 0.38, cw: 0.26 });
  }
  /** Folded waves: chevron pleats – ridge (light line), shaded slope, valley (dark line), lit slope. */
  function waves(ctx, vw) {
    const PW = 18, PH = 11, A = 3.4;
    const row = (r, dy) => { const off = hash2(r, 3, 77) * PW, pts = []; for (let x = -off - PW; x <= vw + PW; x += PW / 2) pts.push([x, r * PH + dy + (Math.round((x + off) / (PW / 2)) & 1 ? A : 0)]); return pts; };
    for (let r = -1; r < 36; r++) {
      const top = row(r, 0), mid = row(r, PH * 0.45), bot = row(r + 1, 0);
      const band = (a, b, col) => { ctx.fillStyle = col; ctx.beginPath(); a.forEach((p) => ctx.lineTo(p[0], p[1])); b.slice().reverse().forEach((p) => ctx.lineTo(p[0], p[1])); ctx.fill(); };
      band(top, mid, PALETTE.waveShade); band(mid, bot, PALETTE.waveLit);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.55; ctx.beginPath(); top.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.stroke();
    }
  }

  /* ---------------- public draw functions: stop-motion playback ---------------- */
  function drawHero(ctx, x, y, t, facing) {
    const K = C.K || sprites(ctx.canvas.height), set = C.fox[Math.floor(t * 12) & 7];   // 8 walk poses, held at 12 fps
    const s = set[facing < 0 ? 1 : 0]; blit(ctx, s.sh, x, y, 1, 1, K); blit(ctx, s, x, y, 1, 1, K);
  }
  /** small creature hop on 9 held steps: crouch (anticipation) – launch – airborne – land (squash) – sit */
  function drawEnemy(ctx, x, y, t, v) {
    const K = C.K || sprites(ctx.canvas.height), seed = ((v || 0) * 0.37) % 1, set = C.frog[(v || 0) % 3];
    const ph = t * 1.5 + seed * 3, q = Math.floor((ph - Math.floor(ph)) * 9) / 9;
    let fr = 0, sx = 1, sy = 1, lift = 0;
    if (q < 0.2) { fr = 1; sx = 1.05; sy = 0.94; }
    else if (q < 0.7) { const u = Math.min(1, (q - 0.17) / 0.5); fr = q < 0.3 ? 2 : q < 0.6 ? 3 : 4; lift = Math.sin(u * PI) * 6.5; if (fr === 4) { sx = 1.08; sy = 0.9; } }
    const s = set[fr][0];
    blit(ctx, s.sh, x, y, sx * (1 - lift * 0.04), 1 - lift * 0.04, K); blit(ctx, s, x, y - lift, sx, sy, K);
  }
  function drawCrane(ctx, x, y, t, seed) {
    const K = C.K, f = CRANE_SEQ[Math.floor(t * 12 + seed * 97) % 7], s = C.crane[f][0], h = 8 + CRANE_LIFT[f] + Math.sin(t * 1.3 + seed * 9) * 1.6;
    blit(ctx, s.sh, x + h * 0.45 + 2, y + 2.5, 0.9, 0.9, K); blit(ctx, s, x, y - h, 1, 1, K);
  }
  /** appear – live – vanish loop of one creature (1.6 s): packet opens, frog rises squashed, crumples, leaves a flat sheet */
  function drawLifeCycle(ctx, x, y, t) {
    const K = C.K, c = t % 1.6, st = Math.floor(c * 12) / 12;   // held 12 fps steps
    if (st < 0.45) {
      const q = st / 0.45;
      packet(ctx, x, y + 0.5, 9.5, 'teal', q < 0.1 ? 0 : q < 0.25 ? 0.32 : 1);
      if (q >= 0.3) { const s = C.frog[0][0][0], k = q < 0.45 ? [1.22, 0.42] : q < 0.6 ? [0.9, 1.18] : q < 0.75 ? [1.05, 0.93] : [1, 1]; blit(ctx, s, x, y, k[0], k[1], K); }
    } else if (st < 1.2) drawEnemy(ctx, x, y, st, 0);
    else if (st < 1.32) { const s = C.frogHit[0]; blit(ctx, s, x, y, 1.2, 0.8, K); ctx.globalAlpha = 0.6; blit(ctx, C.flash, x, y, 1.2, 0.8, K); ctx.globalAlpha = 1; }
    else if (st < 1.42) blit(ctx, C.frogHit[0], x, y - 1.5, 0.86, 0.9, K);
    else packet(ctx, x, y + 0.5, 9.9, 'teal', st < 1.5 ? 1 : 0.32);
  }
  function confetti(ctx, x, y, s, rot, flip, key) {
    const R = RAMP[key], co = Math.cos(rot) * s, si = Math.sin(rot) * s, f = Math.abs(flip) < 0.15 ? 0.15 : flip;
    ctx.save(); ctx.transform(co, si, -si * f, co * f, x, y);
    ctx.fillStyle = flip > 0 ? R[flip > 0.6 ? 0 : 1] : RAMP.cream[flip < -0.6 ? 0 : 2];   // two-sided paper: colour front, cream back
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0.95, 0.7); ctx.lineTo(-0.95, 0.7); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function draw(ctx, w, h, t) {
    const K = sprites(h), s = h / 360, vw = 360 * w / h;
    if (!C.ground || C.gw !== w || C.gh !== h) {
      C.world = makeWorld(vw);
      const Vx = C.world.vil.x, Vy = C.world.vil.y, Gx = C.world.grv.x, Gy = C.world.grv.y;
      // designed arrangements: houses + trees in the village, pines in the grove
      C.world.props = [{ x: Vx - 30, y: Vy - 12, k: 'house', v: 0, big: 1 }, { x: Vx + 34, y: Vy + 18, k: 'house', v: 1, big: 1 }, { x: Vx + 78, y: Vy - 52, k: 'tree', v: 0, big: 1 },
        { x: Gx - 30, y: Gy - 22, k: 'pine' }, { x: Gx + 22, y: Gy - 6, k: 'pine' }, { x: Gx - 8, y: Gy + 34, k: 'pine' }, { x: Gx + 60, y: Gy + 52, k: 'tree', v: 2 }, { x: vw * 0.47, y: 330, k: 'tree', v: 1 }];
      C.ground = canvas(w, h); C.gw = w; C.gh = h; paintGround(C.ground.getContext('2d'), vw, s, C.world);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(C.ground, 0, 0); ctx.setTransform(s, 0, 0, s, 0, 0);
    const hx = vw * 0.44, hy = 238, list = [];
    for (const p of C.world.props) {
      const sp = p.k === 'pine' ? C.pine : p.k === 'house' ? C.house[p.v] : C.tree[p.v];
      blit(ctx, sp.sh, p.x, p.y, 1, 1, K); list.push({ y: p.y, f: () => blit(ctx, sp, p.x, p.y, 1, 1, K) });
    }
    list.push({ y: hy, f: () => drawHero(ctx, hx, hy, t, 1) });
    [[hx + 92, 262, 1], [hx - 96, 285, 2], [hx + 150, 300, 0], [hx - 40, 318, 1]].forEach(([x, y, v], i) => list.push({ y, f: () => drawEnemy(ctx, x, y, t + i * 0.23, v + i) }));
    list.push({ y: 300, f: () => drawLifeCycle(ctx, vw * 0.86, 300, t) });
    [[hx - 140, 196], [hx + 40, 150]].forEach(([x, y], i) => list.push({ y, f: () => drawCrane(ctx, x + Math.sin(t * 0.7 + i) * 10, y, t, i * 0.41) }));
    list.sort((a, b) => a.y - b.y);
    for (const o of list) o.f();
    // orbiting shuriken, a paper-plane projectile with a pencil flight line, two-sided confetti
    for (let i = 0; i < 2; i++) { const a = t * 2.4 + i * PI, x = hx + Math.cos(a) * 44, y = hy - 4 + Math.sin(a) * 37; blit(ctx, C.shuri[Math.floor(t * 30 + i * 3) & 7], x, y - 4, 1, 0.8, K); }
    const pa = -0.35, px = hx + 16 + ((t * 110) % 60), py = hy - 10 - ((t * 110) % 60) * 0.36, pl = C.plane[Math.round((((pa % TAU) + TAU) % TAU) / TAU * 16) & 15];
    ctx.strokeStyle = '#7a6c74'; ctx.globalAlpha = 0.55; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(px - Math.cos(pa) * 7, py - Math.sin(pa) * 7); ctx.lineTo(px - Math.cos(pa) * 12, py - Math.sin(pa) * 12); ctx.stroke(); ctx.globalAlpha = 1;
    blit(ctx, pl, px, py, 1, 1, K);
    const keys = ['coral', 'mustard', 'teal', 'cream', 'blush'];
    for (let i = 0; i < 12; i++) {
      const a = hash2(i, 0, 5) * TAU, k = (t * 0.8 + hash2(i, 1, 5)) % 1, d = 6 + k * 24;
      confetti(ctx, hx + 92 + Math.cos(a) * d, 240 + Math.sin(a) * d * 0.6 - 14 * Math.sin(k * PI) + k * 8, 1.9 * (1 - k * 0.4), t * 5 + i, Math.cos(t * 9 + i * 2.3), keys[i % 5]);
    }
    // soft light from the upper left + warm shade to the lower right
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,250,235,.16)'); g.addColorStop(0.45, 'rgba(255,250,235,0)'); g.addColorStop(0.7, 'rgba(90,64,80,0)'); g.addColorStop(1, 'rgba(90,64,80,.14)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  const Starter = { id: 'origami', name: 'Origami Fold', palette: PALETTE, ramps: RAMP, fonts: ['Zen Maru Gothic:wght@500;700;900', 'M PLUS Rounded 1c:wght@500;700;800', 'Kalam:wght@400;700'], drawHero, drawEnemy, draw, Fold, renderFold, bake, castShadow, ribbon, packet, fox, frog, crane, pine, roundTree, house, plane, shuriken };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['origami'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
