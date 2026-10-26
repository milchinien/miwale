/* Low-Poly Diorama ("lowpoly") – a toy-like miniature world made of flat-shaded facets.
   A tiny software 3D pipeline (meshes -> yaw -> 3/4 orthographic projection -> flat shading with one sun plus
   sky/ground ambient -> painter's sort) pre-renders every character, prop, pickup, decal and icon into sprite caches.
   The ground is a jittered triangle lattice whose facets are lit from their (tiny) height-field normals. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const hex = U.hex, clamp = U.clamp;

  /* ================================ palette ================================ */
  const P = {
    pumpkin: hex('#f48a2c'), pumpkinDk: hex('#e27526'), stem: hex('#7a8a3e'),
    carve: hex('#6e2e10'), glow: hex('#ffc43a'), glowHot: hex('#fff1a6'),
    cape: hex('#4b68a3'), shirt: hex('#f3e6c8'), shirtDk: hex('#dccaa2'), pants: hex('#6c4e3f'), boot: hex('#46332c'),
    scarf: hex('#d65d42'), glove: hex('#73a052'),
    lilac: hex('#a77ccf'), lilacDk: hex('#8661b4'), cream: hex('#f3e5bb'), creamDk: hex('#e2cf9a'), root: hex('#dcc495'),
    leaf: hex('#80b25c'), leafDk: hex('#5f9248'), olive: hex('#7c8e47'), oliveDk: hex('#617638'),
    ghostTop: hex('#eaf5ff'), ghost: hex('#c6def6'), ghostLow: hex('#a6b5ec'), hole: hex('#29325a'), holeDeep: hex('#161b33'),
    golemTop: hex('#7f5c95'), golemMid: hex('#9c7c90'), golemLow: hex('#c19c64'), crack: hex('#ffa63a'), core: hex('#ffe58c'),
    wood: hex('#ad7a50'), woodDk: hex('#8a5e3d'), woodLt: hex('#cfa475'),
    roof: hex('#cf6644'), roofDk: hex('#b4553a'), wall: hex('#f5ecd8'), barn: hex('#bf5540'), barnRoof: hex('#7d7f96'),
    hay: hex('#ecc766'), hayDk: hex('#d4ab4f'),
    rock: hex('#b4ab9e'), rockDk: hex('#9a9288'), moss: hex('#95ad6c'),
    pine: hex('#4e8d6e'), pineDk: hex('#3f775c'), pineLt: hex('#5c9c79'), trunk: hex('#8c5c3e'),
    mint: hex('#4fe3b0'), sky: hex('#5cbdf6'),
    seed: hex('#f8ebc6'), seedRim: hex('#dfc58c'),
    win: hex('#ffd77a'), door: hex('#7a5038'), mush: hex('#d9583f'), white: hex('#ffffff'),
    water: hex('#6fb4c8'), waterDeep: hex('#4b8fb4'), foam: hex('#cdeae6'), reed: hex('#8aa457'), cattail: hex('#7a5038'), lily: hex('#6fa452'), path: hex('#c49a6c'),
  };
  // crown palettes, by role: [mid, shadow side, sunlit top]
  const CROWNS = [
    [hex('#ee8b3a'), hex('#e47a31'), hex('#f2a046')],
    [hex('#dc5d43'), hex('#cf4d3c'), hex('#e6714b')],
    [hex('#ecb544'), hex('#e3a23c'), hex('#f2c35a')],
    [hex('#d07a3f'), hex('#c4653a'), hex('#e09447')],
  ];
  const rgbs = (c) => 'rgb(' + (clamp(c[0], 0, 255) | 0) + ',' + (clamp(c[1], 0, 255) | 0) + ',' + (clamp(c[2], 0, 255) | 0) + ')';
  const mulc = (c, f) => [c[0] * f, c[1] * f, c[2] * f];

  /* ============================== tiny 3D core ============================== */
  let SP = 0, CP = 0; // sin / cos of the camera pitch
  const setPitch = (deg) => { const a = (deg * Math.PI) / 180; SP = Math.sin(a); CP = Math.cos(a); };
  setPitch(44);
  // sun direction (towards the light): from the left, a bit from the front, high. x right, y south (towards camera), z up
  const LV = (() => { const v = [-0.58, 0.3, 0.76], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
  const SKY = [0.47, 0.52, 0.67], GND = [0.52, 0.44, 0.38], SUN = [0.7, 0.62, 0.45];
  function shadeRGB(c, nx, ny, nz, lift) {
    const d = Math.max(0, nx * LV[0] + ny * LV[1] + nz * LV[2]);
    const h = 0.5 + 0.5 * nz;
    let r = c[0] * (SKY[0] * h + GND[0] * (1 - h) + SUN[0] * d);
    let g = c[1] * (SKY[1] * h + GND[1] * (1 - h) + SUN[1] * d);
    let b = c[2] * (SKY[2] * h + GND[2] * (1 - h) + SUN[2] * d);
    if (lift) { r += (c[0] - r) * lift; g += (c[1] - g) * lift; b += (c[2] - b) * lift; }
    return [r, g, b];
  }

  // 3x4 affine matrices
  const mul = (a, b) => [
    a[0] * b[0] + a[1] * b[4] + a[2] * b[8], a[0] * b[1] + a[1] * b[5] + a[2] * b[9], a[0] * b[2] + a[1] * b[6] + a[2] * b[10], a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3],
    a[4] * b[0] + a[5] * b[4] + a[6] * b[8], a[4] * b[1] + a[5] * b[5] + a[6] * b[9], a[4] * b[2] + a[5] * b[6] + a[6] * b[10], a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7],
    a[8] * b[0] + a[9] * b[4] + a[10] * b[8], a[8] * b[1] + a[9] * b[5] + a[10] * b[9], a[8] * b[2] + a[9] * b[6] + a[10] * b[10], a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11],
  ];
  const chain = (...m) => m.reduce(mul);
  const T = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z];
  const SC = (x, y = x, z = x) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0];
  const RX = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]; };
  const RY = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]; };
  const RZ = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]; };

  class Mesh {
    constructor() { this.v = []; this.f = []; }
    vert(x, y, z) { this.v.push(x, y, z); return this.v.length / 3 - 1; }
    tri(a, b, c, col, o) {
      this.f.push({ a, b, c, col, em: o && o.em ? 1 : 0, ds: o && o.ds ? 1 : 0, bias: (o && o.bias) || 0 });
      return this;
    }
    add(m, M) {
      const base = this.v.length / 3, v = m.v;
      for (let i = 0; i < v.length; i += 3) {
        const x = v[i], y = v[i + 1], z = v[i + 2];
        if (M) this.v.push(M[0] * x + M[1] * y + M[2] * z + M[3], M[4] * x + M[5] * y + M[6] * z + M[7], M[8] * x + M[9] * y + M[10] * z + M[11]);
        else this.v.push(x, y, z);
      }
      for (const f of m.f) this.f.push({ a: f.a + base, b: f.b + base, c: f.c + base, col: f.col, em: f.em, ds: f.ds, bias: f.bias });
      return this;
    }
    normal(f) {
      const v = this.v;
      const ax = v[f.a * 3], ay = v[f.a * 3 + 1], az = v[f.a * 3 + 2];
      const e1x = v[f.b * 3] - ax, e1y = v[f.b * 3 + 1] - ay, e1z = v[f.b * 3 + 2] - az;
      const e2x = v[f.c * 3] - ax, e2y = v[f.c * 3 + 1] - ay, e2z = v[f.c * 3 + 2] - az;
      return [e1y * e2z - e1z * e2y, e1z * e2x - e1x * e2z, e1x * e2y - e1y * e2x];
    }
    centroid(f) {
      const v = this.v;
      return [(v[f.a * 3] + v[f.b * 3] + v[f.c * 3]) / 3, (v[f.a * 3 + 1] + v[f.b * 3 + 1] + v[f.c * 3 + 1]) / 3, (v[f.a * 3 + 2] + v[f.b * 3 + 2] + v[f.c * 3 + 2]) / 3];
    }
    /** Flip faces whose normal disagrees with dir(centroid). */
    orient(dir, from = 0) {
      for (let i = from; i < this.f.length; i++) {
        const f = this.f[i];
        const n = this.normal(f), c = this.centroid(f), d = dir(c[0], c[1], c[2]);
        if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0) { const t = f.b; f.b = f.c; f.c = t; }
      }
      return this;
    }
    set(o) { for (const f of this.f) Object.assign(f, o); return this; }
  }

  /** Surface of revolution. prof = [[r, z, ox?, oy?], ...] from bottom to top (r = 0 -> pole). col(ring, seg, upperHalf). */
  function lathe(prof, segs, o = {}) {
    const m = new Mesh();
    const rng = U.rng(o.seed || 7);
    const jit = o.jitter || 0;
    const open = o.a1 !== undefined;
    const a0 = o.a0 || 0, a1 = open ? o.a1 : a0 + TAU;
    const nA = open ? segs + 1 : segs;
    const rings = [];
    for (let i = 0; i < prof.length; i++) {
      const p = prof[i], r = p[0], z = p[1], ox = p[2] || 0, oy = p[3] || 0;
      if (r <= 1e-4) { rings.push({ pole: m.vert(ox, oy, z) }); continue; }
      const idx = [];
      const tw = (o.twist || 0) * i;
      for (let j = 0; j < nA; j++) {
        const a = a0 + ((a1 - a0) * j) / segs + tw;
        let rr = r * (o.ribs && j & 1 ? o.ribs : 1);
        let zz = z;
        if (jit) { rr += (rng.next() - 0.5) * 2 * jit; zz += (rng.next() - 0.5) * jit * (o.zj !== undefined ? o.zj : 1); }
        idx.push(m.vert(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr, zz));
      }
      rings.push({ idx, ox, oy, z });
    }
    const cf = typeof o.col === 'function' ? o.col : () => o.col;
    const fo = { ds: o.ds, em: o.em, bias: o.bias };
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], B = rings[i + 1];
      for (let j = 0; j < segs; j++) {
        const j1 = open ? j + 1 : (j + 1) % segs;
        if (A.idx && B.idx) {
          m.tri(A.idx[j], A.idx[j1], B.idx[j1], cf(i, j, 0), fo);
          m.tri(A.idx[j], B.idx[j1], B.idx[j], cf(i, j, 1), fo);
        } else if (A.idx) m.tri(A.idx[j], A.idx[j1], B.pole, cf(i, j, 0), fo);
        else if (B.idx) m.tri(A.pole, B.idx[j1], B.idx[j], cf(i, j, 1), fo);
      }
    }
    const first = rings[0], last = rings[rings.length - 1];
    if (o.capB && first.idx) {
      const c = m.vert(first.ox, first.oy, first.z);
      for (let j = 0; j < segs; j++) { const j1 = open ? j + 1 : (j + 1) % segs; m.tri(c, first.idx[j1], first.idx[j], cf(-1, j, 0), fo); }
    }
    if (o.capT && last.idx) {
      const c = m.vert(last.ox, last.oy, last.z);
      for (let j = 0; j < segs; j++) { const j1 = open ? j + 1 : (j + 1) % segs; m.tri(c, last.idx[j], last.idx[j1], cf(prof.length - 1, j, 0), fo); }
    }
    return m;
  }
  const sphereProf = (R, Rv, cz, els) => els.map((e) => {
    const a = (e * Math.PI) / 180;
    return [Math.abs(e) >= 89.99 ? 0 : R * Math.cos(a), cz + Rv * Math.sin(a)];
  });

  function box(sx, sy, sz, col, o) {
    const m = new Mesh();
    const x = sx / 2, y = sy / 2, z = sz / 2;
    for (const p of [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]) m.vert(p[0], p[1], p[2]);
    const cf = typeof col === 'function' ? col : () => col;
    [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]].forEach((q, k) => {
      m.tri(q[0], q[1], q[2], cf(k), o); m.tri(q[0], q[2], q[3], cf(k), o);
    });
    return m.orient((cx, cy, cz) => [cx, cy, cz]);
  }

  const ICO_T = (1 + Math.sqrt(5)) / 2;
  const ICO_V = [[-1, ICO_T, 0], [1, ICO_T, 0], [-1, -ICO_T, 0], [1, -ICO_T, 0], [0, -1, ICO_T], [0, 1, ICO_T], [0, -1, -ICO_T], [0, 1, -ICO_T], [ICO_T, 0, -1], [ICO_T, 0, 1], [-ICO_T, 0, -1], [-ICO_T, 0, 1]];
  const ICO_F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const nrm3 = (p) => { const l = Math.hypot(p[0], p[1], p[2]) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };
  /** Icosphere. col(nx, ny, nz, rng) per face (face direction). */
  function ico(sub, o = {}) {
    let V = ICO_V.map(nrm3), F = ICO_F.map((f) => f.slice());
    for (let s = 0; s < sub; s++) {
      const cache = new Map(), NF = [];
      const mid = (a, b) => {
        const k = a < b ? a * 997 + b : b * 997 + a;
        let i = cache.get(k);
        if (i === undefined) { i = V.length; V.push(nrm3([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2])); cache.set(k, i); }
        return i;
      };
      for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); NF.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
      F = NF;
    }
    const rng = U.rng(o.seed || 1);
    const r = o.r || 1, sx = (o.sx || 1) * r, sy = (o.sy || 1) * r, sz = (o.sz || 1) * r, jit = o.jitter || 0;
    const m = new Mesh();
    for (const p of V) { const k = 1 + (rng.next() - 0.5) * 2 * jit; m.vert(p[0] * sx * k, p[1] * sy * k, p[2] * sz * k); }
    const cf = typeof o.col === 'function' ? o.col : () => o.col;
    const fo = { em: o.em, bias: o.bias };
    for (const [a, b, c] of F) {
      const n = nrm3([V[a][0] + V[b][0] + V[c][0], V[a][1] + V[b][1] + V[c][1], V[a][2] + V[b][2] + V[c][2]]);
      m.tri(a, b, c, cf(n[0], n[1], n[2], rng), fo);
    }
    return m.orient((x, y, z) => [x, y, z]);
  }

  /** Folded leaf blade along +x (ridge raised), double-sided. */
  function leaf(len, wid, o = {}) {
    const m = new Mesh();
    const fold = o.fold !== undefined ? o.fold : 0.35, bend = o.bend || 0;
    const c1 = o.c1, c2 = o.c2 || o.c1;
    const z = (t) => bend * t * t;
    const b = m.vert(0, 0, 0);
    const l1 = m.vert(len * 0.36, -wid * 0.5, z(0.36) - wid * fold * 0.5);
    const r1 = m.vert(len * 0.36, wid * 0.5, z(0.36) - wid * fold * 0.5);
    const m1 = m.vert(len * 0.45, 0, z(0.45));
    const l2 = m.vert(len * 0.72, -wid * 0.32, z(0.72) - wid * fold * 0.32);
    const r2 = m.vert(len * 0.72, wid * 0.32, z(0.72) - wid * fold * 0.32);
    const tp = m.vert(len, 0, z(1));
    const fo = { ds: 1 };
    m.tri(b, l1, m1, c1, fo); m.tri(l1, l2, m1, c1, fo); m.tri(m1, l2, tp, c1, fo);
    m.tri(b, m1, r1, c2, fo); m.tri(r1, m1, r2, c2, fo); m.tri(m1, tp, r2, c2, fo);
    return m;
  }

  /** Ear-clipping triangulation of a simple 2D polygon. */
  function triangulate(pts) {
    const n = pts.length;
    let idx = [];
    for (let i = 0; i < n; i++) idx.push(i);
    let area = 0;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
    if (area < 0) idx.reverse();
    const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const out = [];
    let guard = 0;
    while (idx.length > 3 && guard++ < 400) {
      let found = false;
      for (let i = 0; i < idx.length; i++) {
        const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length];
        const a = pts[ia], b = pts[ib], c = pts[ic];
        if (cr(a, b, c) <= 1e-9) continue;
        let ok = true;
        for (const k of idx) {
          if (k === ia || k === ib || k === ic) continue;
          const p = pts[k];
          if (cr(a, b, p) >= 0 && cr(b, c, p) >= 0 && cr(c, a, p) >= 0) { ok = false; break; }
        }
        if (!ok) continue;
        out.push([ia, ib, ic]);
        idx.splice(i, 1);
        found = true;
        break;
      }
      if (!found) break;
    }
    if (idx.length === 3) out.push(idx.slice());
    return out;
  }

  /** Paint/carve a polygon [[u (lateral), v (height)]] onto the +x side of an ellipsoid (R horizontal, Rv vertical, centre cz). */
  function feature(m, pts, R, Rv, cz, col, o = {}) {
    const off = o.off !== undefined ? o.off : 0.35, sc = o.scale || 1;
    let cu = 0, cv = 0;
    for (const p of pts) { cu += p[0]; cv += p[1]; }
    cu /= pts.length; cv /= pts.length;
    const surf = (u, v) => {
      const q = 1 - (u / R) ** 2 - ((v - cz) / Rv) ** 2;
      return [R * Math.sqrt(Math.max(0.04, q)) + off, u, v];
    };
    const sp = pts.map(([u, v]) => [cu + (u - cu) * sc, cv + (v - cv) * sc]);
    const ids = sp.map(([u, v]) => { const s = surf(u, v); return m.vert(s[0], s[1], s[2]); });
    const fo = { em: o.em === false ? 0 : 1, bias: o.bias !== undefined ? o.bias : -0.8 };
    const from = m.f.length;
    for (const [a, b, c] of triangulate(sp)) m.tri(ids[a], ids[b], ids[c], col, fo);
    m.orient(() => [1, 0, 0], from);
    return m;
  }
  /** Carved jack-o'-lantern style feature: dark rim + glowing fill + hot core. */
  function carved(m, pts, R, Rv, cz, o = {}) {
    feature(m, pts, R, Rv, cz, o.rim || P.carve, { scale: o.rs || 1.3, bias: -0.5, off: 0.28 });
    feature(m, pts, R, Rv, cz, o.fill || P.glow, { scale: 1, bias: -0.9, off: 0.36 });
    feature(m, pts, R, Rv, cz, o.hot || P.glowHot, { scale: o.hs || 0.5, bias: -1.2, off: 0.42 });
  }
  /** Strip (crack) along a polyline on the ellipsoid front. */
  function strip(m, pts, w, R, Rv, cz, col, off = 0.4, bias = -0.8) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [u0, v0] = pts[i], [u1, v1] = pts[i + 1];
      const du = u1 - u0, dv = v1 - v0, l = Math.hypot(du, dv) || 1;
      const nu = (-dv / l) * w * 0.5, nv = (du / l) * w * 0.5;
      const w0 = i === 0 ? 0.35 : 1, w1 = i === pts.length - 2 ? 0.35 : 1;
      feature(m, [[u0 - nu * w0, v0 - nv * w0], [u1 - nu * w1, v1 - nv * w1], [u1 + nu * w1, v1 + nv * w1], [u0 + nu * w0, v0 + nv * w0]], R, Rv, cz, col, { off, bias });
    }
  }

  /* ------------------------------ rendering ------------------------------ */
  function drawMesh(ctx, m, o) {
    const yaw = o.yaw || 0, K = o.K, ax = o.ax, ay = o.ay;
    const sp = o.sp !== undefined ? o.sp : SP, cp = o.cp !== undefined ? o.cp : CP;
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const v = m.v, n = v.length / 3;
    const X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = v[i * 3], y = v[i * 3 + 1];
      X[i] = x * cs - y * sn; Y[i] = x * sn + y * cs; Z[i] = v[i * 3 + 2];
    }
    const list = [];
    for (const f of m.f) {
      const a = f.a, b = f.b, c = f.c;
      const e1x = X[b] - X[a], e1y = Y[b] - Y[a], e1z = Z[b] - Z[a];
      const e2x = X[c] - X[a], e2y = Y[c] - Y[a], e2z = Z[c] - Z[a];
      let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      const l = Math.hypot(nx, ny, nz);
      if (l < 1e-9) continue;
      nx /= l; ny /= l; nz /= l;
      const facing = ny * cp + nz * sp;
      if (facing <= 1e-4) { if (!f.ds) continue; nx = -nx; ny = -ny; nz = -nz; }
      const dep = -((Y[a] + Y[b] + Y[c]) / 3) * cp - ((Z[a] + Z[b] + Z[c]) / 3) * sp + f.bias;
      const col = f.em ? f.col : shadeRGB(f.col, nx, ny, nz, o.lift);
      list.push({ a, b, c, dep, s: rgbs(col) });
    }
    list.sort((p, q) => q.dep - p.dep);
    ctx.lineJoin = 'round';
    const lw = o.lw !== undefined ? o.lw : 0.85;
    ctx.lineWidth = lw || 1;
    for (const t of list) {
      ctx.fillStyle = t.s;
      ctx.beginPath();
      ctx.moveTo(ax + X[t.a] * K, ay + (Y[t.a] * sp - Z[t.a] * cp) * K);
      ctx.lineTo(ax + X[t.b] * K, ay + (Y[t.b] * sp - Z[t.b] * cp) * K);
      ctx.lineTo(ax + X[t.c] * K, ay + (Y[t.c] * sp - Z[t.c] * cp) * K);
      ctx.closePath();
      ctx.fill();
      if (lw) { ctx.strokeStyle = t.s; ctx.stroke(); }
    }
  }

  let K = 2.5; // sprite pixels per world unit (= screen px per world unit at the reference resolution)
  let VS = 2.5; // current view scale (for pixel snapping)
  const canBlur = (() => { try { const c = document.createElement('canvas').getContext('2d'); return 'filter' in c; } catch (e) { return false; } })();

  function measure(meshes) {
    let R = 0, z0 = 0, z1 = 0;
    for (const m of meshes) {
      const v = m.v;
      for (let i = 0; i < v.length; i += 3) {
        R = Math.max(R, Math.hypot(v[i], v[i + 1]));
        z0 = Math.min(z0, v[i + 2]); z1 = Math.max(z1, v[i + 2]);
      }
    }
    return { R, z0, z1 };
  }
  /** Pre-render meshes (one per animation frame) at nYaw yaw angles into canvases with a common anchor (feet). */
  function spriteSet(meshes, nYaw, o = {}) {
    const { R, z0, z1 } = measure(meshes);
    const pad = 2;
    const w = Math.ceil(2 * R * K) + pad * 2;
    const top = Math.ceil((z1 * CP + R * SP) * K) + pad;
    const bot = Math.ceil((R * SP - z0 * CP) * K) + pad;
    const ax = Math.round(w / 2), ay = top;
    const frames = [];
    for (let yi = 0; yi < nYaw; yi++) {
      const row = [];
      for (let fi = 0; fi < meshes.length; fi++) {
        const { c, ctx } = U.canvas(w, top + bot);
        drawMesh(ctx, meshes[fi], { yaw: (yi / nYaw) * TAU + (o.yaw0 || 0), K, ax, ay, lift: o.lift });
        row.push(c);
      }
      frames.push(row);
    }
    return { frames, flash: [], ax, ay, w, h: top + bot, n: nYaw, nf: meshes.length };
  }
  function flashOf(set, yi, fi) {
    const k = yi * set.nf + fi;
    return set.flash[k] || (set.flash[k] = U.tint(set.frames[yi][fi], '#ffffff'));
  }
  /** Soft shadow sprite: mesh projected along the sun onto the ground (+ ambient-occlusion blob). */
  function makeShadow(mesh, yaw, o = {}) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const v = mesh.v, n = v.length / 3;
    const PX = new Float32Array(n), PY = new Float32Array(n);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const kx = -LV[0] / LV[2], ky = -LV[1] / LV[2];
    const len = o.len || 1;
    for (let i = 0; i < n; i++) {
      const x = v[i * 3], y = v[i * 3 + 1], z = Math.max(0, v[i * 3 + 2]);
      const X = x * cs - y * sn + z * kx * len, Y = x * sn + y * cs + z * ky * len;
      PX[i] = X * K; PY[i] = Y * SP * K;
      x0 = Math.min(x0, PX[i]); x1 = Math.max(x1, PX[i]); y0 = Math.min(y0, PY[i]); y1 = Math.max(y1, PY[i]);
    }
    const ao = o.ao || 6;
    x0 = Math.min(x0, -ao * K); x1 = Math.max(x1, ao * K); y0 = Math.min(y0, -ao * SP * K); y1 = Math.max(y1, ao * SP * K);
    const blur = (o.blur || 1.6) * K;
    const pad = Math.ceil(blur * 2.5) + 2;
    const w = Math.ceil(x1 - x0) + pad * 2, h = Math.ceil(y1 - y0) + pad * 2;
    const ax = Math.round(-x0 + pad), ay = Math.round(-y0 + pad);
    const A = U.canvas(w, h);
    A.ctx.fillStyle = '#000';
    for (const f of mesh.f) {
      A.ctx.beginPath();
      A.ctx.moveTo(ax + PX[f.a], ay + PY[f.a]); A.ctx.lineTo(ax + PX[f.b], ay + PY[f.b]); A.ctx.lineTo(ax + PX[f.c], ay + PY[f.c]);
      A.ctx.closePath(); A.ctx.fill();
    }
    const B = U.canvas(w, h);
    B.ctx.globalAlpha = o.dirA !== undefined ? o.dirA : 0.6;
    if (canBlur) B.ctx.filter = 'blur(' + blur.toFixed(1) + 'px)';
    B.ctx.drawImage(A.c, 0, 0);
    B.ctx.filter = 'none';
    B.ctx.globalAlpha = 1;
    // ambient occlusion blob
    B.ctx.save();
    B.ctx.translate(ax + (o.aoX || 0) * K, ay);
    B.ctx.scale(1, SP * 0.95);
    const g = B.ctx.createRadialGradient(0, 0, 0, 0, 0, ao * K);
    const aoA = o.aoA !== undefined ? o.aoA : 0.85;
    g.addColorStop(0, 'rgba(0,0,0,' + aoA + ')');
    g.addColorStop(0.55, 'rgba(0,0,0,' + aoA * 0.55 + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    B.ctx.fillStyle = g;
    B.ctx.beginPath(); B.ctx.arc(0, 0, ao * K, 0, TAU); B.ctx.fill();
    B.ctx.restore();
    B.ctx.globalCompositeOperation = 'source-in';
    B.ctx.fillStyle = o.col || '#2c3263';
    B.ctx.fillRect(0, 0, w, h);
    return { c: B.c, ax, ay };
  }
  function blit(ctx, img, ax, ay, x, y) {
    const k = 1 / K;
    ctx.drawImage(img, Math.round(x * VS - ax * VS * k) / VS, Math.round(y * VS - ay * VS * k) / VS, img.width * k, img.height * k);
  }
  function radial(r, stops) {
    const s = Math.ceil(r * 2);
    return U.sprite(s, s, (ctx) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      for (const [t, c] of stops) g.addColorStop(t, c);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    });
  }

  /* ================================= models ================================= */
  const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];
  const jcol = (c, rng, a = 0.05) => mulc(c, 1 + (rng.next() - 0.5) * 2 * a);

  function pumpkinHead(m, hz, R, Rv, segs, o = {}) {
    const prof = sphereProf(R, Rv, hz, [-90, -62, -34, -8, 18, 44, 66]);
    prof.push([R * 0.2, hz + Rv * 0.97]);
    prof.push([0, hz + Rv * 0.84]);
    const c1 = o.c1 || P.pumpkin, c2 = o.c2 || P.pumpkinDk;
    m.add(lathe(prof, segs, { ribs: o.ribs || 0.88, col: (i, j) => (i <= 0 ? mulc(c2, 0.96) : j & 1 ? c2 : c1), twist: 0 }));
    m.add(lathe([[R * 0.17, 0], [R * 0.13, R * 0.32], [R * 0.16, R * 0.42]], 5, { col: P.stem, capB: 1, capT: 1, twist: 0.5 }), chain(T(0.2, 0, hz + Rv * 0.78), RY(-0.32)));
  }

  /* ---------------- main character rig ----------------
     Every pose is a real mesh: legs = thigh + shin with a knee, arms = upper + fore arm, torso, cape (3 rings whose hem
     flares, lifts and sways), scarf tail on a pivot, head on a neck pivot. The hip height is taken from the stance leg,
     so one foot always touches the ground and the body bob (down at contact, up at passing) falls out of the leg pose. */
  const JL1 = 3.8, JL2 = 3.9;
  function mJack(q) {
    const m = new Mesh();
    let hip = 0;
    for (const [a, kn] of q.legs) hip = Math.max(hip, JL1 * Math.cos(a) + JL2 * Math.cos(a + kn));
    hip += q.bob || 0;
    q.legs.forEach(([a, kn], k) => {
      const s = k ? 1 : -1;
      const leg = new Mesh();
      leg.add(lathe([[1.58, 0], [1.5, JL1 + 0.25]], 6, { col: P.pants, capT: 1, capB: 1 }), T(0, 0, -JL1));
      const shin = lathe([[1.5, 0], [1.62, 1.7], [1.42, 2.3], [1.47, JL2]], 6, { col: (i) => (i <= 0 ? P.boot : P.pants), capB: 1, capT: 1 });
      shin.add(box(2.7, 2.8, 1.8, P.boot), T(1.1, 0, 0.9));
      leg.add(shin, chain(T(0, 0, -JL1), RY(kn), T(0, 0, -JL2)));
      m.add(leg, chain(T(0, s * 2.05, hip), RY(a)));
    });
    const up = new Mesh();
    const br = q.breathe || 0;
    up.add(lathe([[4.15, 6.3], [4.5, 7.2], [3.95 + br * 0.14, 10.2], [3.35 + br * 0.12, 12.9], [2.1, 14.5], [0, 14.8]], 8, { col: (i) => (i <= 0 ? P.shirtDk : P.shirt), capB: 1 }));
    up.add(lathe([[4.18, 9.0], [4.05, 10.1]], 8, { col: P.pants }));
    up.add(box(1.2, 1.7, 1.3, P.woodLt), T(4.0, 0, 9.55)); // belt buckle: small focal detail on the front
    up.add(lathe([[3.1, 13.0], [3.8, 13.6], [3.65, 14.6], [2.5, 15.25]], 8, { col: P.scarf }));
    const tail = box(1.3, 2.2, 4.8, P.scarf);
    tail.add(box(1.38, 2.28, 0.8, mulc(P.scarf, 0.78)), T(0, 0, -1.7));
    up.add(tail, chain(T(-3.0, 1.6, 14.4), RY(q.scarf !== undefined ? q.scarf : 0.35), T(0, 0, -2.3)));
    const fl = q.cape || 1.2, cl = q.capeLift || 0, cs = q.capeSway || 0;
    up.add(lathe([[5.6, 6.0 + cl, -fl, cs], [5.1, 8.1 + cl * 0.45, -fl * 0.5 - 0.25, cs * 0.45], [4.7, 10.2, -0.5, 0], [3.35, 14.0, -0.1, 0]], 7, {
      a0: Math.PI * 0.6, a1: Math.PI * 1.4, ds: 1, col: (i) => (i === 0 ? mulc(P.cape, 0.88) : P.cape),
    }));
    q.arms.forEach(([a, el], k) => {
      const s = k ? 1 : -1;
      const arm = lathe([[1.2, -2.7], [1.25, -1.2], [1.2, 0]], 5, { col: P.shirt, capB: 1, capT: 1 });
      const fore = lathe([[1.02, -2.5], [1.14, 0]], 5, { col: P.shirt, capB: 1 });
      fore.add(ico(0, { r: 1.4, col: P.glove }), T(0, 0, -3.2));
      arm.add(fore, chain(T(0, 0, -2.6), RY(-el)));
      up.add(arm, chain(T(0, s * 4.0, 13.1), RY(a), RX(s * (q.armOut !== undefined ? q.armOut : 0.2))));
    });
    const head = new Mesh();
    const hz = 21.6, R = 7.8, Rv = 6.5;
    pumpkinHead(head, hz, R, Rv, 16);
    head.add(leaf(4.8, 2.6, { c1: P.leaf, c2: P.leafDk, fold: 0.45, bend: -0.6 }), chain(T(0.1, 0.5, hz + Rv * 0.92), RZ(1.9), RY(-0.35 + (q.leafLag || 0))));
    const eye = q.blink ? [[-4.2, hz + 2.0], [-0.8, hz + 2.0], [-2.5, hz + 2.95]] : [[-4.1, hz + 1.3], [-0.85, hz + 1.3], [-2.45, hz + 4.6]];
    const eo = q.blink ? { hs: 0.01 } : undefined;
    carved(head, eye, R, Rv, hz, eo);
    carved(head, eye.map(([u, v]) => [-u, v]), R, Rv, hz, eo);
    carved(head, [[-0.75, hz + 0.1], [0.75, hz + 0.1], [0, hz + 1.25]], R, Rv, hz, { rs: 1.35, hs: 0.01 });
    const mouth = q.hurt
      ? [[-2.4, hz - 0.9], [0, hz - 0.4], [2.4, hz - 0.9], [2.7, hz - 2.7], [0, hz - 4.0], [-2.7, hz - 2.7]]
      : [[-5.0, hz - 0.2], [-3.0, hz - 0.75], [-3.0, hz - 1.95], [-1.6, hz - 1.95], [-1.6, hz - 1.0], [1.6, hz - 1.0], [1.6, hz - 1.95], [3.0, hz - 1.95], [3.0, hz - 0.75], [5.0, hz - 0.2], [3.7, hz - 2.9], [0, hz - 3.8], [-3.7, hz - 2.9]];
    carved(head, mouth, R, Rv, hz, { rs: 1.16, hs: 0.45 });
    up.add(head, chain(T(0, 0, 15 + (q.head || 0)), RX(q.headTilt || 0), RY(q.headNod || 0), T(0, 0, -15)));
    m.add(up, chain(T(0, 0, 6.5 + hip - 7.7), RX(q.roll || 0), RY(q.lean || 0), RZ(q.twist || 0), T(0, 0, -6.5)));
    return m;
  }
  /** Poses of the main character (angles in radians; legs/arms: [hip or shoulder pitch, knee or elbow bend], [-y side, +y side]). */
  const JP = {
    walk(ph) {
      const legs = [], arms = [];
      for (let k = 0; k < 2; k++) {
        const f = ph + (k ? 0 : Math.PI);
        // swing phase (cos f > 0): the knee folds, the foot clears the ground; stance phase: leg almost straight
        legs.push([-0.58 * Math.sin(f), 0.1 + 1.05 * Math.pow(Math.max(0, Math.cos(f)), 1.4)]);
        arms.push([0.62 * Math.sin(f), 0.35 + 0.4 * Math.max(0, -Math.sin(f))]);
      }
      const w2 = 0.5 + 0.5 * Math.sin(2 * ph - 1.4); // follow-through: cape + scarf peak a little after the bob
      return {
        legs, arms, lean: 0.11, twist: 0.12 * Math.sin(ph), roll: 0.045 * Math.cos(ph), head: 0.35 * Math.sin(2 * ph - 0.9), headTilt: 0.04 * Math.sin(ph - 0.6),
        cape: 1.5 + 0.9 * w2, capeLift: 0.4 + 0.9 * w2, capeSway: 0.7 * Math.sin(ph - 1.1), scarf: 0.5 + 0.3 * (0.5 + 0.5 * Math.sin(2 * ph - 1.1)), leafLag: 0.22 * Math.sin(2 * ph - 1.2),
      };
    },
    idle(i, blink) {
      const b = Math.sin((i / 4) * TAU), b2 = Math.sin((i / 4) * TAU - 0.9);
      return {
        legs: [[0.06, 0.12], [-0.05, 0.12]], arms: [[0.05 + 0.04 * b, 0.32], [-0.02 + 0.04 * b, 0.3]], armOut: 0.23 + 0.03 * b,
        breathe: b, bob: 0.12 * b, head: 0.22 * b2, lean: 0.02, cape: 1.0 + 0.12 * b2, capeSway: 0.25 * b2, scarf: 0.32 + 0.06 * b2, leafLag: 0.08 * b2, blink,
      };
    },
    // dash anticipation: knees fold, body drops and leans, arms pull back
    crouch() { return { legs: [[-0.6, 1.2], [0.3, 0.45]], arms: [[0.95, 0.6], [0.95, 0.6]], lean: 0.36, head: -0.5, cape: 2.2, capeLift: 0.6, scarf: 0.8, leafLag: -0.2 }; },
    // dash: airborne lunge, cape and scarf streaming
    stretch() { return { legs: [[-0.95, 0.28], [0.85, 0.95]], arms: [[1.3, 0.15], [1.25, 0.2]], armOut: 0.36, bob: 1.0, lean: 0.42, head: 0.25, cape: 5.0, capeLift: 3.4, capeSway: 0.4, scarf: 1.35, leafLag: -0.6 }; },
    // hit reaction: thrown back, arms up, eyes squeezed, mouth open
    hurt() { return { legs: [[0.28, 0.5], [-0.18, 0.55]], arms: [[-1.0, 0.9], [-0.75, 1.0]], armOut: 0.75, lean: -0.32, headNod: -0.26, headTilt: 0.1, cape: 0.5, capeLift: 0.6, scarf: 0.05, leafLag: 0.4, blink: true, hurt: true }; },
  };
  const J_IDLE = 8, J_BLINK = 12, J_CROUCH = 13, J_STRETCH = 14, J_HURT = 15;

  /* ---------------- small creature (two designed variants) ---------------- */
  function creeperFace(m, o = {}) {
    const R = o.R || 8.1, Rv = o.Rv || 7.2, cz = o.cz || 9.8, d = cz - 9.8;
    const sh = (pts) => pts.map(([u, v]) => [u, v + d]);
    if (o.hurt) {
      const eyeL = sh([[-3.9, 11.9], [-1.0, 10.9], [-3.9, 9.9], [-2.9, 10.9]]);
      for (const e of [eyeL, eyeL.map(([u, v]) => [-u, v]).reverse()]) feature(m, e, R, Rv, cz, hex('#3d2552'), { bias: -0.9, off: 0.38 });
      feature(m, sh([[-1.6, 8.4], [0, 8.9], [1.6, 8.4], [1.3, 6.6], [0, 6.0], [-1.3, 6.6]]), R, Rv, cz, hex('#3d2552'), { bias: -0.8, off: 0.32 });
      return;
    }
    const eyeL = sh(o.v ? [[-3.5, 11.6], [-1.0, 11.0], [-1.2, 9.9], [-3.3, 10.3]] : [[-3.7, 11.9], [-1.0, 10.9], [-1.3, 9.7], [-3.4, 10.2]]);
    for (const e of [eyeL, eyeL.map(([u, v]) => [-u, v]).reverse()]) {
      feature(m, e, R, Rv, cz, hex('#4a2a5e'), { scale: 1.35, bias: -0.5, off: 0.3 });
      feature(m, e, R, Rv, cz, hex('#ffd43c'), { bias: -0.9, off: 0.38 });
      feature(m, e, R, Rv, cz, hex('#fff6c0'), { scale: 0.42, bias: -1.2, off: 0.44 });
    }
    const brow = sh(o.v ? [[-4.2, 12.0], [-0.4, 11.6], [-0.5, 12.6], [-4.0, 13.4]] : [[-4.4, 12.5], [-0.5, 11.3], [-0.6, 12.3], [-4.2, 13.7]]);
    for (const b of [brow, brow.map(([u, v]) => [-u, v]).reverse()]) feature(m, b, R, Rv, cz, hex('#5a3a78'), { bias: -1.0, off: 0.5 });
    const mouth = o.v
      ? [[-2.3, 7.9], [2.3, 7.9], [1.7, 7.0], [0.9, 7.4], [0.5, 6.6], [0, 7.3], [-1.6, 7.0]] // lopsided grin with a fang
      : [[-2.1, 7.7], [-1.0, 8.15], [0, 7.75], [1.0, 8.15], [2.1, 7.7], [1.5, 6.9], [0, 7.25], [-1.5, 6.9]];
    feature(m, sh(mouth), R, Rv, cz, hex('#3d2552'), { bias: -0.8, off: 0.32 });
  }
  function creeperBody(ph, o = {}) {
    const body = new Mesh();
    const v = o.v || 0, hurt = !!o.hurt;
    const prof = v
      ? [[0, 2.4], [2.6, 3.0], [5.2, 4.8], [7.0, 7.6], [7.4, 10.3], [6.6, 13.2], [4.6, 15.7], [2.1, 17.5], [0.7, 18.5], [0, 18.7]]
      : [[0, 2.4], [2.8, 3.0], [5.7, 4.7], [7.7, 7.4], [8.1, 10.1], [7.1, 12.8], [4.9, 15.0], [1.8, 16.3], [0, 16.5]];
    const rng = U.rng(91 + v);
    body.add(lathe(prof, 9, {
      jitter: 0.32, twist: 0.2, seed: 11 + v,
      col: (i, j, h) => {
        if (i <= 0) return P.creamDk;
        if (i <= 2) return jcol(P.cream, rng, 0.03);
        if (i === 3) return h ? P.lilac : P.cream;
        if (i >= 6) return P.lilacDk;
        return jcol(P.lilac, rng, 0.03);
      },
    }));
    body.add(lathe([[0, -3.2], [0.75, 0]], 4, { col: P.root }), chain(T(-1.2, 0, 3.1), RY(0.6)));
    const lag = o.lag || 0, top = v ? 18.3 : 15.8;
    if (!v) {
      for (let k = 0; k < 4; k++) {
        const az = (k / 4) * TAU + 0.4;
        body.add(leaf(8.8, 3.3, { c1: P.leaf, c2: P.leafDk, fold: 0.45, bend: -1.4 }), chain(T(0, 0, top), RZ(az), RY(hurt ? -0.4 : -0.95 + lag + 0.06 * Math.sin(k * 1.7))));
      }
      body.add(leaf(6.5, 2.6, { c1: P.leaf, c2: P.leafDk, fold: 0.5, bend: -0.6 }), chain(T(0, 0, 16.1), RZ(-0.3), RY(hurt ? -0.9 : -1.35 + lag * 0.6)));
    } else {
      // tall variant: three upright blades fanned like a crest + a curled sprout, and a long root tail
      for (let k = 0; k < 3; k++) {
        body.add(leaf(11.5, 2.9, { c1: k === 1 ? P.leafDk : P.leaf, c2: P.leafDk, fold: 0.5, bend: -1.0 }), chain(T(0, 0, top), RZ(Math.PI + (k - 1) * 0.55), RY(hurt ? -0.55 : -1.3 + lag * 0.7 + (k === 1 ? -0.1 : 0.08))));
      }
      body.add(leaf(4.6, 1.8, { c1: P.olive, c2: P.oliveDk, fold: 0.5, bend: -2.4 }), chain(T(0.4, 0, top + 0.1), RY(-0.9 + lag)));
      body.add(lathe([[1.0, 0], [0.7, 2.4], [0.35, 4.6], [0, 6.2]], 4, { col: P.root, capB: 1 }), chain(T(-4.6, 0, 3.6), RY(-2.05 + lag * 0.5)));
    }
    if (!o.noFace) creeperFace(body, v ? { v, R: 7.4, Rv: 7.8, cz: 10.3, hurt } : { hurt });
    return body;
  }
  /** Small creature: waddling root legs, squash at contact / stretch at passing, side-to-side roll, leaves that lag behind. */
  function mCreeper(ph, o = {}) {
    const m = new Mesh();
    const hurt = !!o.hurt;
    const sw = Math.sin(ph), c2 = Math.cos(2 * ph);
    for (const s of [-1, 1]) {
      const a = hurt ? s * 0.3 : sw * 0.65 * s;
      const lift = hurt ? 0.6 : Math.max(0, sw * s) * 1.5;
      const leg = lathe([[0.7, 0], [1.0, 1.6], [1.45, 6.4]], 5, { col: P.root, capB: 1, capT: 1 });
      leg.add(ico(0, { r: 1.05, sx: 1.5, sz: 0.7, col: P.creamDk }), T(0.6, 0, 0.4));
      m.add(leg, chain(T(0.2, s * 3.0, 6.4 + lift), RY(a), RX(s * 0.16), T(0, 0, -6.4)));
    }
    const sq = hurt ? 0.82 : 1 + 0.065 * c2, sxy = hurt ? 1.12 : 1 / Math.sqrt(sq);
    const up = hurt ? 0.4 : 1.1 * Math.max(0, c2);
    const body = creeperBody(ph, { v: o.v, hurt, lag: 0.2 * Math.sin(2 * ph - 1.3) });
    m.add(body, chain(T(0, 0, 2.6 + up), RX(hurt ? 0 : 0.13 * sw), RY(hurt ? -0.34 : 0.06 + 0.04 * c2), SC(sxy, sxy, sq)));
    return m;
  }

  /* ---------------- fast creature: a teardrop spirit with a whipping tail ---------------- */
  function mGhost(ph, o = {}) {
    const m = new Mesh();
    const hurt = !!o.hurt;
    const zs = [2.6, 3.8, 5.4, 7.6, 10.2, 13.2, 16.2, 18.8, 20.8, 22.0, 22.5];
    const rs = [0, 0.8, 1.7, 2.9, 4.2, 5.5, 6.1, 5.8, 4.5, 2.5, 0];
    const prof = zs.map((z, i) => {
      const t = clamp((14.5 - z) / 12, 0, 1);
      return [rs[i], z + 2.5, -t * t * (hurt ? 9 : 6.5) - (hurt ? Math.max(0, z - 12) * 0.16 : 0), Math.sin(ph + z * 0.33) * t * 2.2];
    });
    m.add(lathe(prof, 9, { twist: 0.17, jitter: 0.1, seed: 3, col: (i) => U.ramp([P.ghostLow, P.ghost, P.ghost, P.ghostTop, P.ghostTop], i / 9) }));
    for (const s of [-1, 1]) {
      const arm = lathe([[0, -5.0], [0.95, -4.6], [1.3, -3.3], [1.15, -1.2], [1.25, 0]], 5, { col: P.ghost, capT: 1 }); // soft mitten, not a spike
      const swim = Math.sin(ph + (s > 0 ? 0 : Math.PI)); // alternating reach, like a slow swim stroke
      m.add(arm, chain(T(1.4, s * 5.0, 17.4), RZ(s * (hurt ? 0.6 : 0.12)), RY(hurt ? -2.3 : -0.75 + 0.42 * swim), RX(s * 0.2)));
    }
    // cowlick: a curled wisp on top that trails behind (silhouette feature + follow-through)
    m.add(leaf(5.6, 3.0, { c1: P.ghostTop, c2: P.ghost, fold: 0.22, bend: -1.1 }), chain(T(-1.2, 0, 24.2), RZ(Math.PI), RY(hurt ? -1.2 : -0.5 + 0.22 * Math.sin(ph - 1.2))));
    const R = 6.1, Rv = 6.6, cz = 18.2;
    const er = hurt ? 1.3 : 1;
    const eye = (u) => { const pts = []; for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; pts.push([u + Math.cos(a) * 1.25 * er, 21.3 + Math.sin(a) * 1.75 * er]); } return pts; };
    for (const u of [-2.3, 2.3]) {
      feature(m, eye(u), R, Rv, cz, P.hole, { bias: -0.8, off: 0.3 });
      feature(m, eye(u), R, Rv, cz, P.holeDeep, { scale: 0.55, bias: -1.0, off: 0.35 });
    }
    const mouth = [];
    const mr = hurt ? 1.35 : 1;
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; mouth.push([Math.cos(a) * 1.6 * mr, 16.8 + Math.sin(a) * 2.4 * mr]); }
    feature(m, mouth, R, Rv, cz, P.hole, { bias: -0.8, off: 0.3 });
    feature(m, mouth, R, Rv, cz, P.holeDeep, { scale: 0.6, bias: -1.0, off: 0.35 });
    return m;
  }

  /* ---------------- large creature: a heavy cracked golem with a glowing core ---------------- */
  function mColossus(ph, o = {}) {
    const m = new Mesh();
    const hurt = !!o.hurt;
    const sw = Math.sin(ph), c2 = Math.cos(2 * ph);
    for (const s of [-1, 1]) {
      const lift = hurt ? 0.8 : Math.max(0, sw * s) * 3.8;
      m.add(lathe([[4.8, 0], [5.3, 3.4], [4.5, 9]], 6, { col: P.golemLow, capB: 1, capT: 1, jitter: 0.45, seed: 21 + s }), T(hurt ? 0 : sw * s * 2.2, s * 7.6, lift));
    }
    const body = new Mesh();
    const rng = U.rng(5);
    const prof = [[0, 5.5], [9.5, 6.4], [15, 10.4], [17.4, 16.4], [17.2, 23.4], [15.2, 30.0], [11.0, 35.4], [5.2, 38.6], [0, 39.6]];
    body.add(lathe(prof, 8, {
      jitter: 1.0, twist: 0.3, seed: 77,
      col: (i, j, h) => {
        if (i <= 1) return jcol(P.golemLow, rng, 0.06);
        if (i === 2) return h ? jcol(mulc(U.mix(P.golemLow, P.golemMid, 0.5), 1), rng, 0.06) : jcol(P.golemLow, rng, 0.06);
        if (i === 3) return h ? jcol(P.golemTop, rng, 0.07) : jcol(P.golemMid, rng, 0.06);
        if (i >= 6) return jcol(mulc(P.golemTop, 0.9), rng, 0.06);
        return jcol(P.golemTop, rng, 0.07);
      },
    }));
    const R = 17.4, Rv = 17, cz = 22;
    const cracks = [
      [[-6.5, 31], [-4.0, 27], [-5.6, 23.5], [-2.6, 19.5], [-3.6, 14.5]],
      [[5.0, 30.5], [7.6, 26.5], [5.6, 22.0], [8.8, 17.0]],
      [[-11.5, 22.5], [-8.6, 19.5], [-10.6, 15.0]],
      [[11.0, 24.5], [13.0, 20.0], [11.5, 16.0]],
      [[1.5, 15.0], [3.4, 11.5], [1.8, 8.6]],
    ];
    for (const c of cracks) strip(body, c, 1.05, R, Rv, cz, P.crack);
    const hexp = (r, cu, cv) => { const pts = []; for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + 0.3; pts.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r * 1.1]); } return pts; };
    feature(body, hexp(4.4, 0, 22.5), R, Rv, cz, hex('#5e3a2a'), { bias: -0.6, off: 0.35 });
    feature(body, hexp(3.3, 0, 22.5), R, Rv, cz, P.crack, { bias: -0.9, off: 0.45 });
    feature(body, hexp(1.9, 0, 22.5), R, Rv, cz, P.core, { bias: -1.2, off: 0.55 });
    const slit = hurt ? [[-6.6, 32.9], [-2.2, 31.0], [-2.5, 30.4], [-6.3, 31.8]] : [[-6.6, 32.4], [-2.2, 31.3], [-2.5, 30.2], [-6.3, 30.8]];
    for (const e of [slit, slit.map(([u, v]) => [-u, v]).reverse()]) {
      feature(body, e, R, Rv, cz, hex('#3e2648'), { scale: 1.4, bias: -0.5, off: 0.3 });
      feature(body, e, R, Rv, cz, P.core, { bias: -0.9, off: 0.45 });
    }
    body.add(box(4.2, 16, 2.6, P.golemTop), chain(T(13.6, 0, 34.6), RY(0.4)));
    const back = new Mesh();
    strip(back, [[-4, 30], [-1.5, 25], [-4.5, 20], [-2, 15]], 1.0, R, Rv, cz, P.crack);
    strip(back, [[6, 27], [3.5, 22], [6.5, 17]], 1.0, R, Rv, cz, P.crack);
    body.add(back, RZ(Math.PI));
    for (const s of [-1, 1]) {
      const a = hurt ? -1.05 : -sw * 0.5 * s;
      const arm = new Mesh();
      arm.add(ico(0, { r: 6.4, col: (nx, ny, nz, r) => jcol(P.golemTop, r, 0.07), jitter: 0.12, seed: 31 + s }));
      arm.add(lathe([[4.0, -15], [4.8, -8.5], [3.8, -1]], 6, { col: P.golemMid, capB: 1, capT: 1, jitter: 0.55, seed: 41 + s }));
      arm.add(ico(0, { r: 5.6, col: (nx, ny, nz, r) => jcol(P.golemLow, r, 0.07), jitter: 0.15, seed: 51 + s }), T(0.5, 0, -17));
      strip(arm, [[-1.5, -4], [1.0, -8], [-0.5, -12]], 0.8, 4.6, 8, -8, P.crack, 0.5);
      body.add(arm, chain(T(1, s * 17.8, 28.5), RY(a), RX(s * (hurt ? 0.5 : 0.24))));
    }
    for (let k = 0; k < 5; k++) {
      const az = (k / 5) * TAU + 0.6;
      body.add(leaf(17, 6.8, { c1: k & 1 ? P.olive : P.leafDk, c2: k & 1 ? P.oliveDk : mulc(P.leafDk, 0.85), fold: 0.45, bend: -3.5 }), chain(T(0, 0, 38.2), RZ(az), RY(hurt ? -0.4 : -0.75 + 0.15 * Math.sin(2 * ph - 1.4 + k))));
    }
    for (let k = 0; k < 4; k++) {
      const az = (k / 4) * TAU + 0.9;
      body.add(lathe([[0, -6], [0.9, 0]], 4, { col: P.root }), chain(T(Math.cos(az) * 10, Math.sin(az) * 10, 8), RZ(az), RY(0.9)));
    }
    // heavy gait: the body drops on every footfall and rolls over the stance leg
    const drop = hurt ? -0.6 : -1.5 * (1 - c2) * 0.5;
    m.add(body, chain(T(0, 0, 6 + drop), RX(hurt ? 0 : 0.06 * sw), RY(hurt ? -0.22 : 0.05), T(0, 0, -6)));
    return m;
  }

  function mLantern() {
    const m = new Mesh();
    const prof = [[0, 0.4], [2.6, 0.9], [5.0, 2.9], [5.7, 5.8], [4.7, 8.8], [2.3, 10.6], [0, 11.0]];
    m.add(lathe(prof, 9, { col: (i, j, h) => (i >= 4 || (i === 3 && h) ? P.lilac : i <= 0 ? P.creamDk : P.cream), twist: 0.15, jitter: 0.1, seed: 4 }));
    for (let k = 0; k < 3; k++) m.add(leaf(5.6, 2.3, { c1: P.leaf, c2: P.leafDk, fold: 0.45, bend: -0.8 }), chain(T(0, 0, 10.5), RZ((k / 3) * TAU + 0.5), RY(-1.0)));
    const R = 5.7, Rv = 5.2, cz = 5.8;
    const eye = [[-2.5, 6.4], [-0.6, 6.4], [-1.5, 8.3]];
    carved(m, eye, R, Rv, cz);
    carved(m, eye.map(([u, v]) => [-u, v]), R, Rv, cz);
    carved(m, [[-3.0, 4.6], [-1.6, 4.2], [-1.1, 3.6], [1.1, 3.6], [1.6, 4.2], [3.0, 4.6], [1.6, 2.4], [-1.6, 2.4]], R, Rv, cz, { rs: 1.22, hs: 0.45 });
    return m;
  }

  function mGem(r, h, col) {
    const m = new Mesh();
    const top = m.vert(0, 0, h * 2), bot = m.vert(0, 0, 0);
    const mid = [];
    for (let k = 0; k < 4; k++) mid.push(m.vert(Math.cos((k / 4) * TAU) * r, Math.sin((k / 4) * TAU) * r, h * 1.05));
    for (let k = 0; k < 4; k++) {
      const a = mid[k], b = mid[(k + 1) % 4];
      m.tri(a, b, top, k & 1 ? mulc(col, 1.06) : col);
      m.tri(b, a, bot, k & 1 ? mulc(col, 0.92) : mulc(col, 0.98));
    }
    return m.orient((x, y, z) => [x, y, z - h]);
  }

  function mSeed() {
    const m = lathe([[0, -3.6], [1.0, -2.7], [1.7, -1.0], [1.75, 0.6], [1.3, 2.3], [0.6, 3.3], [0, 3.6]], 8, {
      col: (i, j) => (j === 0 || j === 3 || j === 4 || j === 7 ? P.seedRim : P.seed), a0: Math.PI / 8,
    });
    const out = new Mesh();
    out.add(m, chain(SC(1, 1, 0.42), RY(Math.PI / 2)));
    return out;
  }

  function mPumpkin(R, Rv, seed, o = {}) {
    const m = new Mesh();
    pumpkinHead(m, Rv * 0.92, R, Rv, o.segs || 14, { ribs: 0.86, c1: o.c1, c2: o.c2 });
    const rng = U.rng(seed);
    if (o.leaf !== false) m.add(leaf(R * 0.9, R * 0.55, { c1: P.leaf, c2: P.leafDk, fold: 0.5, bend: -0.6 }), chain(T(0, 0, Rv * 1.62), RZ(rng.range(0, TAU)), RY(-0.25)));
    if (o.face) {
      const hz = Rv * 0.92;
      const eye = [[-R * 0.45, hz + Rv * 0.08], [-R * 0.12, hz + Rv * 0.08], [-R * 0.28, hz + Rv * 0.5]];
      carved(m, eye, R, Rv, hz);
      carved(m, eye.map(([u, v]) => [-u, v]), R, Rv, hz);
      carved(m, [[-R * 0.55, hz - Rv * 0.2], [-R * 0.2, hz - Rv * 0.32], [0, hz - Rv * 0.2], [R * 0.2, hz - Rv * 0.32], [R * 0.55, hz - Rv * 0.2], [R * 0.3, hz - Rv * 0.62], [-R * 0.3, hz - Rv * 0.62]], R, Rv, hz, { rs: 1.2 });
    }
    return m;
  }

  function mPine(h, seed) {
    const m = new Mesh();
    const rng = U.rng(seed);
    m.add(lathe([[1.9, 0], [1.5, h * 0.3]], 6, { col: P.trunk, capT: 1 }));
    const tiers = 4;
    for (let t = 0; t < tiers; t++) {
      const zb = h * (0.16 + t * 0.19), r = h * (0.27 - t * 0.052), zt = zb + h * (0.34 - t * 0.02);
      // tier colour by role: dark skirt underneath, mid body, a lighter sunlit cap on the top tier
      m.add(lathe([[r * 0.55, zb + r * 0.12], [r, zb], [0, zt]], 7, {
        col: (i) => (i === 0 ? mulc(P.pineDk, 0.85) : jcol(t === tiers - 1 ? P.pineLt : t === 0 ? P.pineDk : P.pine, rng, 0.03)), jitter: r * 0.07, twist: rng.range(0, 1), seed: seed + t, capB: 1,
      }), RZ(rng.range(0, TAU)));
    }
    return m;
  }

  /** Crown facets are coloured by their normal – dark underside, mid body, light sunlit top – so a crown reads as one lit volume. */
  const crownCol = (crown) => (nx, ny, nz, r) => jcol(nz > 0.42 ? crown[2] : nz < -0.12 ? crown[1] : crown[0], r, 0.03);
  const TREE_CROWN = [1, 0, 2, 3]; // maple: red, oak: orange, birch: yellow, poplar: rust
  /** Deciduous trees, four designed species: 0 maple (broad round), 1 oak (two-tier lobes), 2 birch (white trunk, clumps), 3 poplar (column). */
  function mTree(kind, seed) {
    const m = new Mesh();
    const rng = U.rng(seed);
    const cc = crownCol(CROWNS[TREE_CROWN[kind]]);
    const fork = (z, a, tilt, len, r) => m.add(lathe([[r, 0], [r * 0.55, len]], 4, { col: P.trunk, capT: 1 }), chain(T(0, 0, z), RZ(a), RY(tilt)));
    if (kind === 0) {
      const h = 56, R = h * 0.3;
      m.add(lathe([[2.4, 0], [1.9, h * 0.3], [1.35, h * 0.56]], 7, { col: P.trunk, capT: 1, twist: 0.3 }));
      fork(h * 0.36, rng.range(0, TAU), 0.85, h * 0.2, 0.85);
      m.add(ico(1, { r: R, sz: 0.8, jitter: 0.09, seed, col: cc }), T(0, 0, h * 0.7));
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + rng.range(-0.35, 0.35);
        m.add(ico(1, { r: R * rng.range(0.5, 0.6), sz: 0.82, jitter: 0.1, seed: seed + 3 + i, col: cc }), T(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.74, h * 0.6 + rng.range(-1, 2.5)));
      }
    } else if (kind === 1) {
      const h = 62, R = h * 0.26;
      m.add(lathe([[2.6, 0], [2.0, h * 0.22], [1.6, h * 0.5], [1.0, h * 0.72]], 7, { col: P.trunk, capT: 1, twist: 0.5 }));
      fork(h * 0.3, rng.range(0, TAU), 1.0, h * 0.24, 0.9);
      fork(h * 0.42, rng.range(0, TAU), -0.9, h * 0.2, 0.75);
      // a broad flat canopy of overlapping lobes with one higher crown lobe off-centre
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.5;
        m.add(ico(1, { r: R * 0.82, sz: 0.6, jitter: 0.1, seed: seed + i, col: cc }), T(Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.75, h * 0.6 + (i & 1) * 2));
      }
      m.add(ico(1, { r: R * 0.9, sz: 0.7, jitter: 0.1, seed: seed + 7, col: cc }), T(R * 0.25, -R * 0.15, h * 0.72));
    } else if (kind === 2) {
      const h = 64;
      const bark = hex('#ece6da'), mark = hex('#4a4540');
      m.add(lathe([[1.5, 0], [1.4, h * 0.2], [1.3, h * 0.4], [1.1, h * 0.6], [0.75, h * 0.86]], 6, { col: (i, j) => ((i * 5 + j * 3) % 7 === 0 ? mark : bark), capT: 1, twist: 0.2 }));
      fork(h * 0.5, 0.6, 0.9, h * 0.16, 0.55);
      // loose clumps hung off alternate sides of the trunk, largest lowest
      [[0.52, 0.2, 5.4, 0.3], [0.64, 0.17, 5.0, 3.3], [0.78, 0.15, 3.6, 1.6], [0.9, 0.11, 1.2, 4.6]].forEach(([z, r, ox, a], i) => {
        m.add(ico(1, { r: h * r, sz: 0.85, jitter: 0.11, seed: seed + i, col: cc }), T(Math.cos(a) * ox, Math.sin(a) * ox, h * z));
      });
    } else {
      const h = 78, R = h * 0.16;
      m.add(lathe([[1.9, 0], [1.4, h * 0.3], [0.9, h * 0.7]], 6, { col: P.trunk, capT: 1 }));
      m.add(ico(1, { r: R, sx: 0.95, sy: 0.95, sz: 2.25, jitter: 0.08, seed, col: cc }), T(0, 0, h * 0.58));
      m.add(ico(1, { r: R * 0.7, sz: 1.6, jitter: 0.1, seed: seed + 5, col: cc }), T(R * 0.45, R * 0.2, h * 0.42));
    }
    return m;
  }

  function mBoulder(r, seed) {
    return ico(1, {
      r, sx: 1.25, sz: 0.72, jitter: 0.16, seed,
      col: (nx, ny, nz, g) => (nz > 0.62 && g.next() < 0.75 ? jcol(P.moss, g, 0.05) : jcol(g.next() < 0.5 ? P.rock : P.rockDk, g, 0.04)),
    });
  }

  function mStump() {
    const m = new Mesh();
    m.add(lathe([[3.4, 0], [2.9, 1.4], [2.7, 4.2]], 8, { col: (i) => (i === 2 ? P.woodLt : P.trunk), capT: 1, jitter: 0.2, seed: 9 }));
    for (let k = 0; k < 3; k++) m.add(lathe([[0, 3.5], [0.8, 0]].reverse().map(([r, z]) => [r, z]), 4, { col: P.trunk }), chain(RZ((k / 3) * TAU + 0.3), T(2.8, 0, 0.6), RY(1.2)));
    return m;
  }

  function mHouse(barn) {
    const m = new Mesh();
    const W = barn ? 30 : 25, D = barn ? 21 : 18, H = barn ? 17 : 15, RH = barn ? 12 : 11;
    const wall = barn ? P.barn : P.wall;
    m.add(box(W, D, H, (k) => (k === 0 ? wall : wall)), T(0, 0, H / 2));
    m.add(box(W + 0.6, D + 0.6, 1.4, P.woodDk), T(0, 0, 0.7));
    // roof
    const roof = new Mesh();
    const ex = W / 2 + 1.8, ey = D / 2 + 2.4, ez = H - 1.2;
    const fl = roof.vert(-ex, ey, ez), fr = roof.vert(ex, ey, ez), bl = roof.vert(-ex, -ey, ez), br = roof.vert(ex, -ey, ez);
    const rl = roof.vert(-ex, 0, H + RH), rr = roof.vert(ex, 0, H + RH);
    const rc = barn ? P.barnRoof : P.roof;
    roof.tri(fl, fr, rr, rc, { ds: 1 }); roof.tri(fl, rr, rl, rc, { ds: 1 });
    roof.tri(bl, rl, rr, mulc(rc, 0.95), { ds: 1 }); roof.tri(bl, rr, br, mulc(rc, 0.95), { ds: 1 });
    m.add(roof);
    // gables
    const gab = new Mesh();
    for (const s of [-1, 1]) {
      const a = gab.vert(s * W / 2, D / 2, H - 0.01), b = gab.vert(s * W / 2, -D / 2, H - 0.01), c = gab.vert(s * W / 2, 0, H + RH - 1.0);
      gab.tri(a, b, c, wall);
    }
    m.add(gab.orient((x) => [x, 0, 0]));
    // ridge beam
    m.add(box(W + 4.2, 1.4, 1.4, barn ? mulc(P.barnRoof, 0.8) : P.roofDk), T(0, 0, H + RH + 0.2));
    // door + windows on the front (+y)
    const front = (sx, sz, x, z, col, o) => m.add(box(sx, 0.6, sz, col, o), T(x, D / 2 + 0.25, z));
    if (barn) {
      front(10, 12, 0, 6, P.woodDk);
      front(10.6, 0.8, 0, 6, P.wall); front(0.8, 12.6, 0, 6.3, P.wall);
      front(11.4, 0.9, 0, 12.4, P.wall);
      front(5, 4.2, 0, H + 4.2, P.win, { em: 1 });
      front(5.8, 0.7, 0, H + 6.5, P.wall);
    } else {
      front(5, 9, -5, 4.5, P.door);
      front(5.6, 0.6, -5, 9.2, P.woodDk);
      front(5, 4.4, 5.5, 8, P.win, { em: 1 });
      front(5.8, 0.7, 5.5, 5.6, P.woodLt);
      front(0.6, 4.6, 5.5, 8, P.woodLt);
      m.add(box(0.6, 4.6, 4.2, P.win, { em: 1 }), T(W / 2 + 0.25, -1, 8.5));
      m.add(box(2.6, 2.6, 7, hex('#b2694f')), T(-W * 0.25, -D * 0.2, H + RH * 0.75));
      m.add(box(3.2, 3.2, 1, hex('#8f5340')), T(-W * 0.25, -D * 0.2, H + RH * 0.75 + 3.6));
    }
    return m;
  }

  function mHaystack(seed) {
    const m = new Mesh();
    m.add(lathe([[7.2, 0], [7.6, 2.4], [6.8, 6.4], [4.8, 9.6], [2.0, 11.6], [0, 12.2]], 9, { col: (i, j, h) => ((i + j + h) % 3 === 0 ? P.hayDk : P.hay), jitter: 0.35, seed, twist: 0.2 }));
    m.add(lathe([[0.45, 9], [0.4, 15]], 4, { col: P.woodDk, capT: 1 }), RY(0.12));
    return m;
  }
  function mBales() {
    const m = new Mesh();
    const bale = (x, y, z, rot) => {
      const b = box(9, 6, 5.4, (k) => (k === 1 ? P.hay : k === 0 ? P.hayDk : mulc(P.hay, 0.96)));
      b.add(box(0.7, 6.2, 5.6, P.woodDk), T(-2.4, 0, 0)).add(box(0.7, 6.2, 5.6, P.woodDk), T(2.4, 0, 0));
      m.add(b, chain(T(x, y, z + 2.7), RZ(rot)));
    };
    bale(-4.8, 0, 0, 0.05); bale(4.6, 0.4, 0, -0.04); bale(0, -0.5, 5.4, 0.12);
    return m;
  }
  function mFence(len, posts) {
    const m = new Mesh();
    for (let i = 0; i < posts; i++) {
      const x = -len / 2 + (i * len) / (posts - 1);
      m.add(box(1.7, 1.7, 9.4, P.woodDk), chain(T(x, 0, 4.7), RZ(0.2 * i)));
      m.add(box(2.1, 2.1, 0.7, P.woodLt), T(x, 0, 9.5));
    }
    m.add(box(len + 2, 0.9, 1.5, P.wood), T(0, 0.9, 3.6));
    m.add(box(len + 2, 0.9, 1.5, P.wood), T(0, 0.9, 7.2));
    return m;
  }

  /* --------- decals (tiny ground details, baked into chunks) --------- */
  function mTuft(seed, c1, c2, n = 5, h = 4) {
    const m = new Mesh();
    const rng = U.rng(seed);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rng.range(-0.4, 0.4);
      m.add(leaf(h * rng.range(0.7, 1.15), 1.25, { c1, c2, fold: 0.6 }), chain(T(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0), RZ(a), RY(-1.15 - rng.range(0, 0.3))));
    }
    return m;
  }
  function mFlower(seed, col) {
    const m = new Mesh();
    const rng = U.rng(seed);
    const h = rng.range(3.2, 4.6);
    m.add(lathe([[0.25, 0], [0.2, h]], 3, { col: P.leafDk }));
    m.add(leaf(2.6, 1.1, { c1: P.leaf, c2: P.leafDk, fold: 0.5 }), chain(T(0, 0, h * 0.35), RZ(rng.range(0, TAU)), RY(-0.6)));
    const head = new Mesh();
    const c = head.vert(0, 0, 0.35);
    const ring = [];
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU, r = k & 1 ? 1.0 : 2.2; ring.push(head.vert(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    for (let k = 0; k < 10; k++) head.tri(c, ring[k], ring[(k + 1) % 10], k & 1 ? mulc(col, 0.93) : col, { ds: 1 });
    head.add(ico(0, { r: 0.8, col: hex('#ffd86a') }), T(0, 0, 0.5));
    m.add(head, chain(T(0, 0, h), RY(-0.55)));
    return m;
  }
  function mMushroom(seed) {
    const m = new Mesh();
    m.add(lathe([[0.6, 0], [0.5, 2.0]], 5, { col: P.cream, capT: 1 }));
    m.add(lathe([[1.9, 1.8], [1.6, 2.6], [0.8, 3.3], [0, 3.5]], 6, { col: (i, j) => (i === 1 && j % 3 === 0 ? P.cream : P.mush), capB: 1 }));
    return m;
  }
  /** Shore reeds: a fan of upright blades with two cattail heads. */
  function mReeds(seed) {
    const m = new Mesh();
    const rng = U.rng(seed);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + rng.range(-0.4, 0.4);
      m.add(leaf(rng.range(6, 9.5), 1.1, { c1: P.reed, c2: mulc(P.reed, 0.8), fold: 0.6, bend: -0.5 }), chain(T(Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0), RZ(a), RY(-1.32 - rng.range(0, 0.18))));
    }
    for (let i = 0; i < 2; i++) {
      const x = i ? 1.1 : -0.9, h = i ? 10.5 : 8.6;
      m.add(lathe([[0.18, 0], [0.16, h]], 3, { col: mulc(P.reed, 0.85) }), T(x, 0.3, 0));
      m.add(lathe([[0, -1.6], [0.62, -1.1], [0.66, 1.1], [0, 1.6]], 5, { col: P.cattail }), T(x, 0.3, h - 1.2));
    }
    return m;
  }
  /** Lily pad: a flat notched disc, optionally with a small flower. */
  function mLily(seed, flower) {
    const m = new Mesh();
    const rng = U.rng(seed);
    const c = m.vert(0, 0, 0.12), ring = [];
    const n = 9, r = rng.range(2.4, 3.2);
    for (let k = 0; k <= n; k++) { const a = 0.35 + (k / n) * (TAU - 0.7); ring.push(m.vert(Math.cos(a) * r, Math.sin(a) * r * 0.95, 0.05)); }
    for (let k = 0; k < n; k++) m.tri(c, ring[k], ring[k + 1], k & 1 ? mulc(P.lily, 0.9) : P.lily, { ds: 1 });
    if (flower) m.add(mFlower(seed + 1, hex('#f6c2d6')), chain(T(0.6, -0.4, -3.6), SC(0.8)));
    return m;
  }

  /* ================================ caches ================================ */
  const SET = {}; // character / pickup sprite sets
  const SH = {}; // character shadows
  const PROPS = []; // prop sprites {c, ax, ay, sh, w, h}
  const DEC = {}; // decal sprites
  const FX = {}; // fx sprites
  const SHARD = {}; // shard palettes (8 brightness levels)
  const NYAW = 16;

  function decalSprite(mesh, yaw, shadow = 0.28) {
    const { R, z1 } = measure([mesh]);
    const pad = 3;
    const w = Math.ceil(2 * (R + 1.2) * K) + pad * 2;
    const top = Math.ceil((z1 * CP + R * SP) * K) + pad;
    const bot = Math.ceil((R * SP + 1.2) * K) + pad;
    const ax = Math.round(w / 2), ay = top;
    const c = U.sprite(w, top + bot, (ctx) => {
      if (shadow) {
        ctx.save();
        ctx.translate(ax + 0.5 * K, ay + 0.1 * K);
        ctx.scale(1, 0.5);
        const r = Math.max(1.4, R * 0.95) * K;
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, 'rgba(40,46,90,' + shadow + ')'); g.addColorStop(1, 'rgba(40,46,90,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.restore();
      }
      drawMesh(ctx, mesh, { yaw, K, ax, ay, lw: 0.6 });
    });
    return { c, ax, ay };
  }
  function addProp(mesh, yaw, o = {}) {
    const s = spriteSet([mesh], 1, { yaw0: yaw });
    const sh = makeShadow(mesh, yaw, { ao: o.ao || 7, aoA: 0.9, dirA: 0.62, blur: o.blur || 1.8, col: '#7d86c4', aoX: o.aoX || 0 });
    PROPS.push({ c: s.frames[0][0], ax: s.ax, ay: s.ay, w: s.w, h: s.h, sh, hw: o.hw || 10, occl: o.occl !== false });
    return PROPS.length - 1;
  }
  const PI_ = {}; // prop index groups

  function shardPal(cols) {
    return cols.map((c) => {
      const out = [];
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const f = 0.6 + 0.45 * t;
        out.push(rgbs([c[0] * f * (0.92 + 0.08 * t), c[1] * f * (0.94 + 0.06 * t), c[2] * f * (1.06 - 0.06 * t)]));
      }
      return out;
    });
  }

  function buildAll() {
    const t0 = performance.now();
    // characters: every pose is its own mesh, pre-rendered at NYAW yaw angles
    const jq = [];
    for (let i = 0; i < 8; i++) jq.push(JP.walk((i / 8) * TAU));
    for (let i = 0; i < 4; i++) jq.push(JP.idle(i, false));
    jq.push(JP.idle(0, true), JP.crouch(), JP.stretch(), JP.hurt());
    SET.jack = spriteSet(jq.map((q) => new Mesh().add(mJack(q), SC(1.1))), NYAW);
    SH.jack = makeShadow(mJack(JP.idle(0)), Math.PI / 2, { ao: 6.2, aoA: 0.9, dirA: 0.55, blur: 1.4 });
    const cf = [], cf2 = [], gf = [], kf = [];
    for (let i = 0; i < 6; i++) {
      const ph = (i / 6) * TAU;
      cf.push(mCreeper(ph)); cf2.push(mCreeper(ph, { v: 1 })); gf.push(mGhost(ph)); kf.push(mColossus(ph));
    }
    cf.push(mCreeper(0, { hurt: 1 })); cf2.push(mCreeper(0, { v: 1, hurt: 1 })); gf.push(mGhost(0, { hurt: 1 })); kf.push(mColossus(0, { hurt: 1 }));
    SET.creeper = spriteSet(cf, NYAW);
    SET.creeper2 = spriteSet(cf2, NYAW);
    SET.ghost = spriteSet(gf, NYAW, { lift: 0.3 });
    SET.colossus = spriteSet(kf, NYAW);
    for (const k of ['jack', 'creeper', 'creeper2', 'ghost', 'colossus']) {
      const st = SET[k];
      st.pieces = shatterPieces(st, 9 + k.length);
      for (let yi = 0; yi < st.n; yi++) for (const fi of k === 'jack' ? [J_STRETCH, J_HURT] : [st.nf - 1]) flashOf(st, yi, fi);
    }
    SH.creeper = makeShadow(cf[0], Math.PI / 2, { ao: 6.6, aoA: 0.9, dirA: 0.5, blur: 1.4 });
    SH.ghost = makeShadow(gf[0], Math.PI / 2, { ao: 5.2, aoA: 0.7, dirA: 0.0, blur: 1.6 });
    SH.colossus = makeShadow(kf[0], Math.PI / 2, { ao: 14, aoA: 0.9, dirA: 0.5, blur: 2.2 });
    SET.lantern = spriteSet([new Mesh().add(mLantern(), SC(1.3))], NYAW);
    // gems: spin frames over a quarter turn (4-fold symmetry)
    const gemSet = (r, h, col) => {
      const m = mGem(r, h, col);
      const s = spriteSet([m], 1);
      const frames = [];
      const halo = radial(r * 3.2 * K, [[0, U.rgb(U.mix(col, [255, 255, 255], 0.4), 0.55)], [0.45, U.rgb(col, 0.2)], [1, U.rgb(col, 0)]]);
      for (let i = 0; i < 8; i++) {
        frames.push(U.sprite(s.w, s.h, (ctx) => {
          ctx.drawImage(halo, s.ax - halo.width / 2, s.ay - h * CP * K - halo.height / 2);
          drawMesh(ctx, m, { yaw: (i / 8) * (TAU / 4), K, ax: s.ax, ay: s.ay, lift: 0.18, lw: 0.5 });
        }));
      }
      return { frames, ax: s.ax, ay: s.ay, n: 8 };
    };
    SET.gem = gemSet(2.1, 2.3, P.mint);
    SET.gemBig = gemSet(3.1, 3.5, P.sky);
    // seeds (top-down, rolling)
    {
      const m = mSeed();
      const sp0 = SP, cp0 = CP;
      const frames = [];
      const w = Math.ceil(8.4 * K), h = Math.ceil(5.2 * K);
      for (let i = 0; i < 8; i++) {
        frames.push(U.sprite(w, h, (ctx) => {
          const mm = new Mesh().add(m, RX(Math.sin((i / 8) * TAU) * 0.85));
          drawMesh(ctx, mm, { yaw: 0, K, ax: w / 2, ay: h / 2, sp: 0.94, cp: 0.34, lw: 0.6 });
        }));
      }
      SP = sp0; CP = cp0;
      SET.seed = { frames, w, h };
    }
    // fx sprites
    FX.puff = [hex('#f6eedf'), hex('#e0ecfb'), hex('#d8c09a'), hex('#fff3c9')].map((c, i) => {
      const m = ico(1, { r: 3, jitter: 0.14, seed: 3 + i, col: c });
      const s = spriteSet([m], 1, { lift: 0.25 });
      return { c: s.frames[0][0], cx: s.ax, cy: s.ay - 3 * CP * K };
    });
    FX.glowWarm = radial(24 * K, [[0, 'rgba(255,214,120,0.75)'], [0.35, 'rgba(255,170,70,0.3)'], [1, 'rgba(255,140,40,0)']]);
    FX.glowSmall = radial(10 * K, [[0, 'rgba(255,225,140,0.9)'], [0.4, 'rgba(255,170,70,0.35)'], [1, 'rgba(255,150,50,0)']]);
    FX.glowCold = radial(12 * K, [[0, 'rgba(220,240,255,0.5)'], [1, 'rgba(180,210,255,0)']]);
    FX.dot = radial(4 * K, [[0, 'rgba(44,50,99,0.9)'], [0.6, 'rgba(44,50,99,0.5)'], [1, 'rgba(44,50,99,0)']]);
    SHARD.creeper = shardPal([P.lilac, P.lilacDk, P.cream, P.lilac, P.leaf]);
    SHARD.ghost = shardPal([P.ghost, P.ghostTop, P.ghostLow]);
    SHARD.colossus = shardPal([P.golemTop, P.golemLow, P.golemMid, P.golemTop, P.crack]);
    SHARD.jack = shardPal([P.pumpkin, P.pumpkinDk, P.glow]);
    SHARD.seed = shardPal([P.seed, P.seedRim]);
    SHARD.gold = shardPal([P.glow, P.glowHot, P.mint]);
    SOIL = [hex('#8a6448'), hex('#a47a57'), hex('#6b4e3c'), hex('#4a3a3a')].map((c) => rgbs(shadeRGB(c, -0.2, 0.2, 0.96, 0)));
    LITTER = CROWNS.map((c) => c.map((col) => [rgbs(shadeRGB(col, -0.2, 0.15, 0.97, 0)), rgbs(shadeRGB(col, 0.35, -0.1, 0.93, 0))]));
    SHARD.leaf = shardPal([P.leaf, P.leafDk, P.olive]);
    SHARD.soil = shardPal([P.woodDk, P.trunk, P.wood]);
    SHARD.frost = shardPal([P.ghostTop, P.white, P.ghostLow]);
    // props
    PI_.pine = [addProp(mPine(58, 3), 0.3, { ao: 5, hw: 13 }), addProp(mPine(70, 5), 1.1, { ao: 5.5, hw: 15 }), addProp(mPine(82, 8), 2.0, { ao: 6, hw: 17 })];
    PI_.tree = [0, 1, 2, 3].map((k) => addProp(mTree(k, 20 + k * 7), k * 0.9, { ao: k === 3 ? 4.5 : 6, hw: k === 3 ? 11 : k === 2 ? 13 : 16 }));
    PI_.rock = [addProp(mBoulder(5, 31), 0.4, { ao: 6, occl: false }), addProp(mBoulder(7.5, 33), 1.2, { ao: 8.5, occl: false }), addProp(mBoulder(10, 35), 2.2, { ao: 11, hw: 10 })];
    PI_.pump = [
      addProp(mPumpkin(6.4, 5.2, 41), 0.4, { ao: 6.5, occl: false }),
      addProp(mPumpkin(8.4, 6.6, 42, { c1: hex('#f29a3a'), c2: hex('#e0822e') }), 1.6, { ao: 8.5, occl: false }),
      addProp(mPumpkin(5.4, 4.4, 43, { c1: hex('#f0b048'), c2: hex('#e39c3c') }), 2.6, { ao: 5.5, occl: false }),
    ];
    PI_.jackolantern = addProp(mPumpkin(6.8, 5.4, 44, { face: true }), Math.PI / 2 - 0.25, { ao: 7, occl: false });
    PI_.house = addProp(new Mesh().add(mHouse(false), SC(1.5)), -0.32, { ao: 26, hw: 30, blur: 2.4 });
    PI_.barn = addProp(new Mesh().add(mHouse(true), SC(1.5)), 0.3, { ao: 30, hw: 34, blur: 2.4 });
    PI_.hay = [addProp(new Mesh().add(mHaystack(51), SC(1.3)), 0.2, { ao: 11, occl: false }), addProp(new Mesh().add(mBales(), SC(1.25)), -0.25, { ao: 11, occl: false })];
    PI_.fenceH = addProp(mFence(30, 3), 0, { ao: 3, occl: false });
    PI_.fenceV = addProp(mFence(30, 3), Math.PI / 2, { ao: 3, occl: false });
    PI_.stump = addProp(mStump(), 0.5, { ao: 4.5, occl: false });
    // decals
    DEC.tuft = [0, 1, 2].map((i) => decalSprite(mTuft(60 + i, hex('#a4c27a'), hex('#87a865'), 6 + i, 4.6 + i * 0.7), i));
    DEC.tuftDry = [0, 1].map((i) => decalSprite(mTuft(70 + i, hex('#c39550'), hex('#a77c42'), 5, 3.8 + i * 0.6), i));
    DEC.tuftSand = [0, 1].map((i) => decalSprite(mTuft(80 + i, hex('#bba36b'), hex('#a08957'), 4 + i, 3.4 + i * 0.6), i));
    DEC.flower = [hex('#fff4e0'), hex('#c9a5ea'), hex('#ff9c84'), hex('#ffd45e'), hex('#f2b6d6')].map((c, i) => decalSprite(mFlower(90 + i, c), i, 0.2));
    DEC.pebble = [0, 1, 2].map((i) => decalSprite(ico(0, { r: 1.3 + i * 0.5, sx: 1.3, sz: 0.65, jitter: 0.2, seed: 100 + i, col: (nx, ny, nz, g) => jcol(P.rock, g, 0.05) }), i));
    DEC.pebbleSand = [0, 1].map((i) => decalSprite(ico(0, { r: 1.2 + i * 0.5, sx: 1.3, sz: 0.6, jitter: 0.2, seed: 110 + i, col: (nx, ny, nz, g) => jcol(hex('#c9b38c'), g, 0.05) }), i));
    DEC.mush = [0, 1].map((i) => decalSprite(mMushroom(120 + i), i * 2));
    DEC.reeds = [0, 1, 2].map((i) => decalSprite(mReeds(140 + i), i * 1.7, 0.22));
    DEC.lily = [0, 1, 2, 3].map((i) => decalSprite(mLily(150 + i, i === 3), i * 1.4, 0));
    DEC.minipump = [0, 1, 2].map((i) => decalSprite(mPumpkin(2.4 + i * 0.35, 1.9 + i * 0.25, 130 + i, { segs: 10, leaf: false, c1: i === 2 ? hex('#f3b04c') : P.pumpkin, c2: i === 2 ? hex('#e39b3d') : P.pumpkinDk }), i * 1.3, 0.3));
    buildAll.ms = performance.now() - t0;
  }

  /* ============================== ground / biomes ============================== */
  const CS = 24, RH = CS * 0.8660254;
  const B_GRASS = 0, B_FOREST = 1, B_SAND = 2, B_ROCK = 3, B_FIELD = 4, B_YARD = 5, B_WATER = 6, B_PATH = 7;
  const BIO = [
    { cols: ['#9cb876', '#95b16f', '#a3bd7d', '#99b572'], h: 0, rough: 1.2 },
    { cols: ['#c98e57', '#bf824f', '#cf9c5d', '#c08a55'], h: 0.9, rough: 1.5 },
    { cols: ['#e2cb9c', '#dbc392', '#e6d2a6', '#dfc797'], h: -1.6, rough: 0.7 },
    { cols: ['#c2b49c', '#b8aa92', '#c9bca5', '#bcae97'], h: 3.6, rough: 1.9 },
    { cols: ['#ab805d', '#a47a59', '#b08662', '#a87d5b'], h: -0.6, rough: 0.5 },
    { cols: ['#dbc293', '#d4ba8a', '#dfc79a', '#d8bf8f'], h: -1.0, rough: 0.5 },
    { cols: ['#6fb4c8', '#69aec4', '#76b9cc', '#6cb1c6'], h: -3.0, rough: 0.14 },
    { cols: ['#c49a6c', '#bc9164', '#c9a274', '#c09667'], h: -0.5, rough: 0.35 }, // trodden earth, darker than sand
  ].map((b) => ({ ...b, cols: b.cols.map(hex) }));
  const MOSS_FACET = hex('#98aa78'), DRY_FACET = hex('#b5b672');

  const FIELD_CELL = 520;
  const fieldMemo = new Map();
  function fieldRect(fx, fy) {
    const k = fx * 100003 + fy;
    let f = fieldMemo.get(k);
    if (f !== undefined) return f;
    const rng = U.rng(U.hashInt(fx, fy, 515));
    f = null;
    if (rng.next() < 0.5) {
      const hw = rng.range(150, 235), hh = rng.range(105, 165);
      const cx = (fx + 0.5) * FIELD_CELL + rng.range(-1, 1) * (FIELD_CELL / 2 - hw - 8);
      const cy = (fy + 0.5) * FIELD_CELL + rng.range(-1, 1) * (FIELD_CELL / 2 - hh - 8);
      f = { x0: cx - hw, x1: cx + hw, y0: cy - hh, y1: cy + hh };
    }
    if (fieldMemo.size > 4000) fieldMemo.clear();
    fieldMemo.set(k, f);
    return f;
  }
  // ponds: low-frequency blobs with a sand shore band; paths: thin ridge lines of noise that wind through grass and woods
  const pondAt = (x, y) => U.fbm(x / 300 + 5.7, y / 300 - 3.3, 404, 3);
  const pathAt = (x, y) => Math.abs(U.perlin(x / 560 + 3.3, y / 560 - 8.1, 606));
  const POND = 0.7, SHORE = 0.684, PATH_W = 0.042;
  let lastPond = 0;
  function baseBiome(x, y, jit) {
    lastPond = 0;
    const r = U.fbm(x / 330 + 11.3, y / 330 - 7.1, 303, 3);
    if (r + jit > 0.675) return B_ROCK;
    const fr = fieldRect(Math.floor(x / FIELD_CELL), Math.floor(y / FIELD_CELL));
    if (fr && x > fr.x0 && x < fr.x1 && y > fr.y0 && y < fr.y1) return B_FIELD;
    const pd = pondAt(x, y) + jit - Math.max(0, 1 - (x * x + y * y) / 52000) * 0.12; // keep the start area dry
    lastPond = pd;
    if (pd > POND) return B_WATER;
    if (pd > SHORE) return B_SAND;
    if (pathAt(x, y) < PATH_W + jit * 0.5) return B_PATH;
    const f = U.warped(x / 780, y / 780, 101, 1.1, 3);
    if (f + jit > 0.578) return B_FOREST;
    const s = U.warped(x / 560 + 40, y / 560, 202, 1.0, 3);
    if (s + jit > 0.585) return B_SAND;
    return B_GRASS;
  }
  const FARM_CELL = 620;
  const farmMemo = new Map();
  function farmAt(fx, fy) {
    const k = fx * 100003 + fy;
    let f = farmMemo.get(k);
    if (f !== undefined) return f;
    const rng = U.rng(U.hashInt(fx, fy, 777));
    const x = (fx + 0.22 + rng.next() * 0.56) * FARM_CELL, y = (fy + 0.22 + rng.next() * 0.56) * FARM_CELL;
    f = null;
    if (rng.next() < 0.6 && x * x + y * y > 240 * 240) {
      const b = baseBiome(x, y, 0);
      if ((b === B_GRASS || b === B_SAND) && pondAt(x, y) < SHORE - 0.03) f = { x, y, barn: rng.next() < 0.45, flip: rng.next() < 0.5 ? -1 : 1, seed: U.hashInt(fx, fy, 778) };
    }
    if (farmMemo.size > 4000) farmMemo.clear();
    farmMemo.set(k, f);
    return f;
  }
  function nearFarm(x, y, r) {
    const fx = Math.floor(x / FARM_CELL), fy = Math.floor(y / FARM_CELL);
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const f = farmAt(fx + i, fy + j);
        if (f && (f.x - x) ** 2 + (f.y - y) ** 2 < r * r) return f;
      }
    }
    return null;
  }
  function biomeAt(x, y, jit = 0) {
    const f = nearFarm(x, y, 120);
    if (f) {
      const dx = (x - f.x) / 96, dy = (y - f.y - 10) / 72;
      if (dx * dx + dy * dy < 1 + jit * 9) { lastPond = 0; return B_YARD; }
    }
    return baseBiome(x, y, jit);
  }

  /* -------- props (deterministic per chunk; also used to bake their shadows + leaf litter into the ground) -------- */
  const propMemo = new Map();
  function genProps(cx, cy) {
    const key = cx * 100003 + cy;
    let arr = propMemo.get(key);
    if (arr) return arr;
    arr = [];
    const size = 256, wx = cx * size, wy = cy * size;
    const info = { wx, wy, size };
    const push = (x, y, t, pad) => { if (!G.nearSpawn(x, y, 80)) arr.push({ x, y, t, pad: pad || 70 }); };
    // farms
    for (let fy = Math.floor(wy / FARM_CELL); fy <= Math.floor((wy + size - 1) / FARM_CELL); fy++) {
      for (let fx = Math.floor(wx / FARM_CELL); fx <= Math.floor((wx + size - 1) / FARM_CELL); fx++) {
        const f = farmAt(fx, fy);
        if (!f || f.x < wx || f.x >= wx + size || f.y < wy || f.y >= wy + size) continue;
        const s = f.flip;
        push(f.x, f.y, f.barn ? PI_.barn : PI_.house, 110);
        push(f.x - 34 * s, f.y + 52, PI_.fenceH);
        push(f.x + 34 * s, f.y + 52, PI_.fenceH);
        push(f.x - 70 * s, f.y + 28, PI_.fenceV);
        push(f.x + 56 * s, f.y + 8, PI_.hay[f.seed & 1]);
        push(f.x - 30 * s, f.y + 30, PI_.pump[0]);
        push(f.x - 42 * s, f.y + 38, PI_.pump[2]);
        push(f.x + 14 * s, f.y + 30, PI_.jackolantern);
      }
    }
    const tree = (x, y, kind) => arr.push({ x, y, t: PI_.tree[kind], crown: TREE_CROWN[kind], pad: 90 });
    G.scatterOwned(info, 46, 501, (x, y, rng) => {
      if (G.nearSpawn(x, y, 90) || nearFarm(x, y, 135)) return;
      const b = baseBiome(x, y, 0);
      const r = rng.next(), q = rng.next();
      if (b === B_FOREST) {
        // groves: one species dominates a region (noise), denser towards the forest interior
        const f = U.warped(x / 780, y / 780, 101, 1.1, 3);
        if (r > 0.22 + clamp((f - 0.578) * 5, 0, 0.32)) return;
        const sp = U.noise(x / 210, y / 210, 919);
        if (q < 0.06) arr.push({ x, y, t: PI_.stump, pad: 60 });
        else if (sp < 0.4 ? q < 0.85 : q < 0.14) arr.push({ x, y, t: pick(PI_.pine, rng.next()), pad: 90 });
        else tree(x, y, rng.next() < 0.85 ? clamp(Math.floor(((sp - 0.4) / 0.36) * 4), 0, 3) : Math.floor(rng.next() * 4));
      } else if (b === B_GRASS) {
        if (r < 0.03) { if (q < 0.55) tree(x, y, Math.floor(rng.next() * 4)); else if (q < 0.75) arr.push({ x, y, t: pick(PI_.pine, rng.next()), pad: 90 }); else arr.push({ x, y, t: pick(PI_.rock, rng.next()), pad: 90 }); }
      } else if (b === B_ROCK) {
        if (r < 0.2) arr.push({ x, y, t: q < 0.62 ? pick(PI_.rock, rng.next()) : pick(PI_.pine, rng.next()), pad: 90 });
      } else if (b === B_SAND) {
        if (r < 0.02) arr.push({ x, y, t: pick(PI_.rock, rng.next() * 0.66), pad: 60 });
      }
    });
    G.scatterOwned(info, 34, 909, (x, y, rng) => {
      if (G.nearSpawn(x, y, 80) || nearFarm(x, y, 120)) return;
      const b = baseBiome(x, y, 0);
      const r = rng.next();
      if ((b === B_FIELD && r < 0.16) || (b === B_GRASS && r < 0.004)) arr.push({ x, y: Math.round(y / 14) * 14 + 1, t: pick(PI_.pump, rng.next()), pad: 50 });
    });
    G.scatterOwned(info, 190, 313, (x, y, rng) => {
      if (G.nearSpawn(x, y, 80) || nearFarm(x, y, 140)) return;
      const b = baseBiome(x, y, 0);
      if ((b === B_SAND || b === B_FIELD) && rng.next() < 0.14) arr.push({ x, y, t: pick(PI_.hay, rng.next()), pad: 60 });
    });
    if (propMemo.size > 800) propMemo.clear();
    propMemo.set(key, arr);
    return arr;
  }

  const RES_ROW = 14;
  const GLINT = new Map(); // water glints per chunk (animated in drawGroundOverlay)
  let LITTER = null;
  const LEAF_CELL = 64, leafMemo = new Map();
  /** Falling-leaf cells: 1 + crown palette index over woods (every other cell), 0 elsewhere. */
  function leafCell(i, j) {
    const k = i * 100003 + j;
    let v = leafMemo.get(k);
    if (v !== undefined) return v;
    const hsh = U.hashInt(i, j, 4040);
    v = (hsh & 1) && baseBiome((i + 0.5) * LEAF_CELL, (j + 0.5) * LEAF_CELL, 0) === B_FOREST ? 1 + ((hsh >>> 3) % 4) : 0;
    if (leafMemo.size > 6000) leafMemo.clear();
    leafMemo.set(k, v);
    return v;
  }
  function* groundChunk(ctx, info) {
    const { wx, wy, res } = info;
    const size = info.size;
    const i0 = Math.floor(wx / CS) - 3, i1 = Math.ceil((wx + size) / CS) + 3;
    const j0 = Math.floor(wy / RH) - 3, j1 = Math.ceil((wy + size) / RH) + 3;
    const NI = i1 - i0 + 1, NJ = j1 - j0 + 1;
    const VX = new Float32Array(NI * NJ), VY = new Float32Array(NI * NJ), VH = new Float32Array(NI * NJ), VA = new Float32Array(NI * NJ);
    const VB = new Uint8Array(NI * NJ);
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const k = (j - j0) * NI + (i - i0);
        const off = (j & 1) * 0.5;
        const x = (i + off + (U.hash2(i, j, 17) - 0.5) * 0.52) * CS;
        const y = (j + (U.hash2(i, j, 23) - 0.5) * 0.46) * RH;
        VX[k] = x; VY[k] = y;
        const b = biomeAt(x, y, (U.hash2(i, j, 31) - 0.5) * 0.014);
        VB[k] = b; VA[k] = lastPond;
        VH[k] = BIO[b].h + BIO[b].rough * ((U.hash2(i, j, 29) - 0.5) * 1.3 + U.perlin(x / 75, y / 75, 57) * 1.6) + (b === B_WATER ? 0 : U.perlin(x / 280, y / 280, 55) * 6);
      }
      if (((j - j0) & 3) === 3) yield;
    }
    // clean-up pass: absorb lone vertices (speckles) into the surrounding material
    {
      const src = VB.slice(), cnt = new Uint8Array(BIO.length);
      for (let j = j0 + 1; j < j1; j++) {
        const sh = j & 1;
        for (let i = i0 + 1; i < i1; i++) {
          const k = (j - j0) * NI + (i - i0), own = src[k];
          cnt.fill(0);
          const nb = [k - 1, k + 1, k - NI + sh - 1, k - NI + sh, k + NI + sh - 1, k + NI + sh];
          let same = 0;
          for (const q of nb) { const b = src[q]; cnt[b]++; if (b === own) same++; }
          if (same <= 1 && own !== B_PATH) {
            let best = own, bc = 0;
            for (let b = 0; b < cnt.length; b++) if (cnt[b] > bc) { bc = cnt[b]; best = b; }
            if (bc >= 3) { VB[k] = best; VH[k] += BIO[best].h - BIO[own].h; }
          }
        }
      }
    }
    const lw = 1 / res;
    ctx.lineJoin = 'round';
    ctx.lineWidth = lw;
    const x0 = wx - 2, x1 = wx + size + 2, y0 = wy - 2, y1 = wy + size + 2;
    const glints = [];
    const facet = (ka, kb, kc, hid) => {
      const ax = VX[ka], ay = VY[ka], bx = VX[kb], by = VY[kb], cx = VX[kc], cy = VY[kc];
      if (Math.max(ax, bx, cx) < x0 || Math.min(ax, bx, cx) > x1 || Math.max(ay, by, cy) < y0 || Math.min(ay, by, cy) > y1) return;
      const ba = VB[ka], bb = VB[kb], bc = VB[kc];
      let b = ba === bb || ba === bc ? ba : bb === bc ? bb : Math.max(ba, bb, bc);
      const h = U.hashInt(hid, 0, 71);
      const r1 = (h & 1023) / 1023, r2 = ((h >>> 10) & 1023) / 1023, r3 = ((h >>> 20) & 1023) / 1023;
      const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3;
      const cols = BIO[b].cols;
      // facet tones cluster in soft patches (noise) instead of a random pick per facet -> calm large areas
      let col = cols[Math.floor(clamp(U.noise(mx / 64, my / 64, 88) * 0.85 + r1 * 0.3 - 0.12, 0, 0.999) * cols.length)];
      if (b === B_ROCK && r2 < 0.18) col = U.mix(col, MOSS_FACET, 0.75);
      else if (b === B_GRASS && r2 < 0.035) col = U.mix(col, DRY_FACET, 0.4);
      else if (b === B_FOREST && r2 < 0.06) col = mulc(col, 0.93);
      const mixed = !(ba === bb && bb === bc);
      if (b === B_WATER) {
        const depth = clamp(((VA[ka] + VA[kb] + VA[kc]) / 3 - POND) / 0.055, 0, 1);
        col = U.mix(col, P.waterDeep, depth * 0.85);
        if (mixed) col = U.mix(col, P.foam, 0.42); // shallow rim
        else if (r2 < 0.2 && mx > wx && mx < wx + size && my > wy && my < wy + size) glints.push(mx, my, r3 * TAU);
      } else if (mixed) {
        const other = ba !== b ? ba : bb !== b ? bb : bc;
        if (r3 < 0.4 && other !== B_WATER) col = U.mix(col, BIO[other].cols[0], 0.5);
      }
      const mt = U.fbm(mx / 520, my / 520, 66, 2) - 0.5;
      col = [col[0] * (1 + mt * 0.12 + 0.012), col[1] * (1 + mt * 0.1), col[2] * (1 + mt * 0.05 - 0.01)];
      // facet normal from the height field
      const e1x = bx - ax, e1y = by - ay, e1z = VH[kb] - VH[ka];
      const e2x = cx - ax, e2y = cy - ay, e2z = VH[kc] - VH[ka];
      let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const l = Math.hypot(nx, ny, nz);
      const s = rgbs(shadeRGB(col, nx / l, ny / l, nz / l, 0));
      ctx.fillStyle = s; ctx.strokeStyle = s;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath();
      ctx.fill(); ctx.stroke();
    };
    for (let j = j0; j < j1; j++) {
      const even = (j & 1) === 0;
      for (let i = i0; i < i1; i++) {
        const a = (j - j0) * NI + (i - i0), b = a + 1, c = a + NI, d = c + 1;
        const hid = (j * 7919 + i) * 2;
        if (even) { facet(a, b, c, hid); facet(b, d, c, hid + 1); } else { facet(a, d, c, hid); facet(a, b, d, hid + 1); }
      }
      if (((j - j0) & 3) === 3) yield;
    }
    GLINT.set(info.cx + ',' + info.cy, new Float32Array(glints));
    if (GLINT.size > 160) GLINT.delete(GLINT.keys().next().value);
    // biome lookup (nearest lattice vertex)
    const look = (x, y) => {
      const j = clamp(Math.round(y / RH), j0, j1);
      const i = clamp(Math.round(x / CS - (j & 1) * 0.5), i0, i1);
      return VB[(j - j0) * NI + (i - i0)];
    };
    const edgeOf = (x, y, b, d) => look(x + d, y) !== b || look(x - d, y) !== b || look(x, y + d) !== b || look(x, y - d) !== b;
    const nearB = (x, y, b, d) => look(x + d, y) === b || look(x - d, y) === b || look(x, y + d) === b || look(x, y - d) === b;
    // field furrows
    const soil = BIO[B_FIELD].cols[0];
    const furN = rgbs(shadeRGB(mulc(soil, 0.98), 0, -0.55, 0.835, 0));
    const furS = rgbs(shadeRGB(mulc(soil, 1.05), 0, 0.5, 0.866, 0));
    const vineA = rgbs(shadeRGB(P.leaf, -0.2, 0.2, 0.96, 0)), vineB = rgbs(shadeRGB(P.leafDk, 0.3, 0.1, 0.95, 0));
    const SEG = 10;
    for (let ry = Math.floor((wy - 6) / RES_ROW); ry <= Math.ceil((wy + size + 6) / RES_ROW); ry++) {
      const yr = ry * RES_ROW;
      let run = [];
      const flush = () => {
        if (run.length >= 2) {
          ctx.fillStyle = furN;
          ctx.beginPath();
          ctx.moveTo(run[0][0], run[0][1]);
          for (const p of run) ctx.lineTo(p[0], p[1] - 3.2);
          for (let k = run.length - 1; k >= 0; k--) ctx.lineTo(run[k][0], run[k][1]);
          ctx.fill();
          ctx.fillStyle = furS;
          ctx.beginPath();
          ctx.moveTo(run[0][0], run[0][1]);
          for (const p of run) ctx.lineTo(p[0], p[1]);
          for (let k = run.length - 1; k >= 0; k--) ctx.lineTo(run[k][0], run[k][1] + 3.4);
          ctx.fill();
        }
        run = [];
      };
      for (let sx = Math.floor((wx - 12) / SEG); sx <= Math.ceil((wx + size + 12) / SEG); sx++) {
        const xa = sx * SEG;
        if (look(xa + SEG / 2, yr) !== B_FIELD) { if (run.length) { run.push([xa, yr + (U.hash2(sx, ry, 61) - 0.5) * 1.4]); flush(); } continue; }
        run.push([xa, yr + (U.hash2(sx, ry, 61) - 0.5) * 1.4]);
      }
      flush();
      for (let sx = Math.floor((wx - 8) / 5); sx <= Math.ceil((wx + size + 8) / 5); sx++) {
        const hv = U.hash2(sx, ry, 67);
        if (hv > 0.55) continue;
        const x = sx * 5 + hv * 3, y = yr + (U.hash2(sx, ry, 68) - 0.5) * 2;
        if (look(x, yr) !== B_FIELD) continue;
        const a = hv * 40, s = 1.6 + U.hash2(sx, ry, 69) * 1.2;
        ctx.fillStyle = hv < 0.28 ? vineA : vineB;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * s, y + Math.sin(a) * s * 0.6);
        ctx.lineTo(x + Math.cos(a + 2.2) * s * 0.8, y + Math.sin(a + 2.2) * s * 0.6);
        ctx.lineTo(x + Math.cos(a + 4.1) * s * 0.9, y + Math.sin(a + 4.1) * s * 0.6);
        ctx.fill();
      }
    }
    yield;
    /* decals – placed with intent, not sprinkled:
       leaf litter under each deciduous crown (in that crown's colours), tufts along region edges and around rocks,
       flowers in meadow patches, mushrooms at the foot of pines, reeds on shores, lily pads in pond interiors,
       pebbles along path edges */
    const snap = (v) => Math.round(v * res) / res;
    const dimg = (d, x, y) => ctx.drawImage(d.c, snap(x - d.ax / K), snap(y - d.ay / K), d.c.width / K, d.c.height / K);
    const mossCol = [rgbs(shadeRGB(P.moss, -0.1, 0.1, 0.99, 0)), rgbs(shadeRGB(mulc(P.moss, 0.9), 0.3, 0, 0.95, 0))];
    const list = [];
    const ccx = Math.floor(wx / size), ccy = Math.floor(wy / size);
    const near = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) for (const p of genProps(ccx + dx, ccy + dy)) near.push(p);
    for (const p of near) {
      if (p.x < wx - 40 || p.x > wx + size + 40 || p.y < wy - 30 || p.y > wy + size + 30) continue;
      const rng = U.rng(U.hashInt(Math.round(p.x), Math.round(p.y), 9));
      if (p.crown !== undefined) {
        for (let k = 0; k < 14; k++) {
          const a = rng.next() * TAU, rr = Math.sqrt(rng.next());
          list.push(['leaf', p.x + 4 + Math.cos(a) * rr * 24, p.y + 2 + Math.sin(a) * rr * 13, rng.next(), rng.next(), p.crown]);
        }
      } else if (PI_.pine.includes(p.t) && rng.next() < 0.35) {
        for (let k = 0; k < 3; k++) list.push([pick(DEC.mush, rng.next()), p.x + 6 + rng.range(-3, 5), p.y + rng.range(1, 5)]);
      } else if (PI_.rock.includes(p.t)) {
        for (let k = 0; k < 4; k++) { const a = rng.next() * TAU; list.push([k & 1 ? pick(DEC.pebble, rng.next()) : pick(DEC.tuft, rng.next()), p.x + Math.cos(a) * 12, p.y + 2 + Math.sin(a) * 6]); }
      }
    }
    G.scatter(info, 11, 4242, 10, (x, y, rng) => {
      const b = look(x, y);
      const r = rng.next();
      if (b === B_GRASS) {
        const meadow = U.fbm(x / 110 + 4, y / 110 - 2, 808, 2);
        if (meadow > 0.6 && r < 0.34) {
          const n = 2 + Math.floor(rng.next() * 3), fl = DEC.flower[Math.floor(U.noise(x / 150, y / 150, 812) * 5) % 5];
          for (let k = 0; k < n; k++) list.push([fl, x + rng.range(-4, 4), y + rng.range(-3, 3)]);
        } else if (r < 0.3 && edgeOf(x, y, b, 13)) list.push([pick(DEC.tuft, rng.next()), x, y]);
        else if (r < 0.012) list.push([pick(DEC.tuft, rng.next()), x, y]);
      } else if (b === B_FOREST) {
        if (r < 0.05) list.push(['leaf', x, y, rng.next(), rng.next(), Math.floor(rng.next() * 4)]);
        else if (r < 0.3 && edgeOf(x, y, b, 13)) list.push([pick(DEC.tuftDry, rng.next()), x, y]);
      } else if (b === B_SAND || b === B_YARD) {
        if (nearB(x, y, B_WATER, 12)) { if (r < 0.5) list.push([pick(DEC.reeds, rng.next()), x, y]); else if (r < 0.62) list.push([pick(DEC.pebbleSand, rng.next()), x, y]); }
        else if (r < 0.2 && edgeOf(x, y, b, 12)) list.push([pick(DEC.tuftSand, rng.next()), x, y]);
        else if (r < 0.012) list.push([pick(DEC.pebbleSand, rng.next()), x, y]);
      } else if (b === B_WATER) {
        if (!nearB(x, y, B_SAND, 16) && U.noise(x / 60, y / 60, 818) > 0.55 && r < 0.45) list.push([pick(DEC.lily, rng.next()), x, y]);
      } else if (b === B_PATH) {
        if (edgeOf(x, y, b, 10)) { if (r < 0.22) list.push([pick(DEC.pebble, rng.next()), x, y]); else if (r < 0.34) list.push([pick(DEC.tuft, rng.next()), x, y]); }
      } else if (b === B_ROCK) {
        if (r < 0.05) list.push([pick(DEC.pebble, rng.next()), x, y]);
        else if (r < 0.1) list.push(['moss', x, y, rng.next(), rng.next()]);
      } else if (b === B_FIELD) {
        if (r < 0.025) list.push([pick(DEC.minipump, rng.next()), x, Math.round(y / RES_ROW) * RES_ROW + 0.5]);
      }
    });
    list.sort((a, b) => a[2] - b[2]);
    let cnt = 0;
    for (const it of list) {
      const d = it[0], x = it[1], y = it[2];
      if (d === 'leaf') {
        const a = it[3] * TAU, s = 1.5 + it[4] * 1.1, c = LITTER[it[5]][Math.floor(it[4] * 3) % 3];
        const ca = Math.cos(a), sa = Math.sin(a);
        const px = -sa * s * 0.55, py = ca * s * 0.55;
        ctx.fillStyle = c[0];
        ctx.beginPath(); ctx.moveTo(x - ca * s, y - sa * s); ctx.lineTo(x + px, y + py); ctx.lineTo(x + ca * s, y + sa * s); ctx.fill();
        ctx.fillStyle = c[1];
        ctx.beginPath(); ctx.moveTo(x - ca * s, y - sa * s); ctx.lineTo(x - px, y - py); ctx.lineTo(x + ca * s, y + sa * s); ctx.fill();
      } else if (d === 'moss') {
        const a = it[3] * TAU, s = 2 + it[4] * 2;
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = mossCol[k & 1];
          const b = a + k * 2.1;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(b) * s, y + Math.sin(b) * s * 0.7);
          ctx.lineTo(x + Math.cos(b + 1.9) * s, y + Math.sin(b + 1.9) * s * 0.7);
          ctx.lineTo(x, y);
          ctx.fill();
        }
      } else dimg(d, x, y);
      if ((++cnt & 63) === 63) yield;
    }
    yield;
    // baked prop shadows (props of this and neighbouring chunks)
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.62;
    for (const p of near) {
      const s = PROPS[p.t].sh;
      const sx = p.x - s.ax / K, sy = p.y - s.ay / K, sw = s.c.width / K, shh = s.c.height / K;
      if (sx > wx + size || sy > wy + size || sx + sw < wx || sy + shh < wy) continue;
      ctx.drawImage(s.c, snap(sx), snap(sy), sw, shh);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ================================ entity helpers ================================ */
  const yawState = new WeakMap();
  function yawOf(o, tx, ty, rate, def) {
    let s = yawState.get(o);
    if (!s) { s = { y: def !== undefined ? def : Math.PI / 2 }; yawState.set(o, s); }
    if (tx * tx + ty * ty > 9) s.y = U.angleLerp(s.y, Math.atan2(ty, tx), rate);
    return s.y;
  }
  const yawIdx = (yaw, n) => { let i = Math.round((yaw / TAU) * n) % n; if (i < 0) i += n; return i; };
  const FR = { rt: 0, shatter: 0 };

  /** Sprite blit with a transform around the feet (hit tilt, squash & stretch). */
  function blitT(ctx, img, ax, ay, x, y, rot, sx, sy) {
    const k = 1 / K;
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    ctx.drawImage(img, -ax * k, -ay * k, img.width * k, img.height * k);
    ctx.restore();
  }
  /** Faceted polygon around (x, y): n vertices, ground-plane squash q, deterministic radial jitter. */
  function facetPoly(ctx, x, y, r, q, n, seed, jit) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + seed, rr = r * (1 + (U.hash2(i, (seed * 997) | 0, 5) - 0.5) * 2 * jit);
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * q);
    }
    ctx.closePath();
  }
  function starPath(ctx, x, y, r, ri, n, a0) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = a0 + (i / (n * 2)) * TAU, rr = i & 1 ? ri : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.86); }
    ctx.closePath();
  }

  /** Death = the model breaks along facet lines: an inner core (3 pieces) + an outer ring of quads (n pieces).
      Pieces are clip polygons over the current frame (world units relative to the feet). */
  function shatterPieces(set, seed) {
    const H = (set.ay - 4) / K, R = (set.w / 2 - 2) / K;
    const cx = 0, cy = -H * 0.5, n = 6;
    const big = Math.max(R, H) * 1.25, rin = Math.min(R, H * 0.5) * 0.5;
    const rng = U.rng(seed);
    const O = [], I = [];
    for (let k = 0; k < n; k++) {
      const a = ((k + rng.range(-0.25, 0.25)) / n) * TAU, b = ((k + rng.range(-0.3, 0.3)) / n) * TAU;
      O.push([cx + Math.cos(a) * big, cy + Math.sin(a) * big]);
      I.push([cx + Math.cos(b) * rin * rng.range(0.7, 1.3), cy + Math.sin(b) * rin * rng.range(0.7, 1.3)]);
    }
    const polys = [];
    for (let k = 0; k < n; k++) polys.push([I[k], O[k], O[(k + 1) % n], I[(k + 1) % n]]);
    polys.push([[cx, cy], I[0], I[1], I[2]], [[cx, cy], I[2], I[3], I[4]], [[cx, cy], I[4], I[5], I[0]]);
    return polys.map((pts, i) => {
      let gx = 0, gy = 0;
      for (const p of pts) { gx += p[0]; gy += p[1]; }
      gx /= pts.length; gy /= pts.length;
      const dx = gx - cx, dy = gy - cy, l = Math.hypot(dx, dy) || 1;
      return { p: pts.flat(), gx, gy, dx: dx / l, dy: dy / l, sp: (i < n ? 15 : 6) * rng.range(0.75, 1.25), up: rng.range(0.6, 1.3), spin: rng.range(1.2, 3.6) * (rng.next() < 0.5 ? -1 : 1) };
    });
  }
  function drawShatter(ctx, set, img, fl, x, y, u, kind, base) {
    const k = 1 / K, w = img.width * k, h = img.height * k, ax = set.ax * k, ay = set.ay * k;
    const ease = 1 - (1 - u) * (1 - u);
    const fade = 1 - U.smoothstep(0.55, 1, u);
    const heavy = kind === 'colossus', ghost = kind === 'ghost';
    for (const pc of set.pieces) {
      let ox, oy, oz, sc = 1;
      if (ghost) {
        // spirit: the pieces drift up and shrink away
        ox = pc.dx * pc.sp * 0.7 * ease; oy = pc.dy * pc.sp * 0.3 * ease; oz = (8 + pc.up * 12) * ease; sc = 1 - 0.6 * u;
      } else {
        // solid: thrown out and up, gravity pulls them down, they land and rest (clamped to the ground) before fading
        const f = heavy ? 0.45 : 1;
        ox = pc.dx * pc.sp * f * ease; oy = pc.dy * pc.sp * 0.5 * f * ease;
        oz = Math.max(pc.gy + 1.2, pc.up * (heavy ? 8 : 17) * u - (heavy ? 34 : 44) * u * u);
      }
      ctx.save();
      ctx.globalAlpha = base * fade;
      ctx.translate(x + pc.gx + ox, y + pc.gy + oy - oz);
      ctx.rotate(pc.spin * ease * (heavy ? 0.5 : 1));
      if (sc !== 1) ctx.scale(sc, sc);
      ctx.beginPath();
      const p = pc.p;
      for (let i = 0; i < p.length; i += 2) ctx.lineTo(p[i] - pc.gx, p[i + 1] - pc.gy);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, -ax - pc.gx, -ay - pc.gy, w, h);
      const fa = 1 - u * 2.6;
      if (fa > 0.05 && fl) { ctx.globalAlpha = base * fade * fa; ctx.drawImage(fl, -ax - pc.gx, -ay - pc.gy, w, h); }
      ctx.restore();
    }
  }

  /** Spawn: the ground opens (dark faceted hole, cracks, soil chunks pushed up), the creature rises out of it with an
      overshoot, stretches on the way up and squashes when it lands. Spirits materialise instead (fade, drop, un-stretch). */
  let SOIL = null;
  function spawnFx(ctx, e, t) {
    const ghost = e.type === 'ghost', big = e.type === 'colossus' ? 1.7 : 1;
    const r = e.r * 1.25, sd = e.seed * 9;
    const fade = 1 - U.smoothstep(0.55, 1, t);
    if (ghost) {
      ctx.globalAlpha = fade * 0.32;
      ctx.fillStyle = '#9fb3e6';
      facetPoly(ctx, e.x, e.y, r * (0.5 + 0.6 * t), 0.46, 8, sd, 0.15); ctx.fill();
      ctx.globalAlpha = fade * 0.85;
      ctx.strokeStyle = '#eef6ff';
      ctx.lineWidth = 0.4 + 1.6 * fade;
      facetPoly(ctx, e.x, e.y, r * (0.8 + 1.5 * U.ease.outQuad(t)), 0.46, 10, sd, 0.06); ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }
    const open = U.ease.outQuad(Math.min(1, t * 2.2));
    ctx.globalAlpha = fade * 0.8;
    ctx.fillStyle = SOIL[3];
    facetPoly(ctx, e.x, e.y, r * (0.3 + 0.7 * open) * big * 0.75, 0.48, 7, sd, 0.22); ctx.fill();
    if (t < 0.6) {
      ctx.strokeStyle = SOIL[3];
      ctx.lineWidth = 0.9 * big;
      ctx.globalAlpha = (1 - t / 0.6) * 0.8;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + sd, l = r * big * (0.6 + 0.9 * U.ease.outQuad(Math.min(1, t * 3)));
        ctx.moveTo(e.x + Math.cos(a) * r * 0.4, e.y + Math.sin(a) * r * 0.2);
        ctx.lineTo(e.x + Math.cos(a + 0.25) * l * 0.6, e.y + Math.sin(a + 0.25) * l * 0.3);
        ctx.lineTo(e.x + Math.cos(a) * l, e.y + Math.sin(a) * l * 0.5);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + sd, d = r * big * (0.55 + 0.75 * U.ease.outQuad(t));
      const z = Math.max(0, Math.sin(Math.min(1, t * 1.3) * Math.PI) * (5 + (i % 3) * 2.5) * big);
      const s = (1.5 + (i % 3) * 0.55) * big * (1 - 0.45 * t), rot = a + t * 7;
      const px = e.x + Math.cos(a) * d, py = e.y + Math.sin(a) * d * 0.5 - z;
      ctx.globalAlpha = fade;
      ctx.fillStyle = SOIL[i % 3];
      ctx.beginPath();
      ctx.moveTo(px + Math.cos(rot) * s, py + Math.sin(rot) * s * 0.8);
      ctx.lineTo(px + Math.cos(rot + 2.3) * s * 0.8, py + Math.sin(rot + 2.3) * s * 0.7);
      ctx.lineTo(px + Math.cos(rot + 4.2) * s * 0.9, py + Math.sin(rot + 4.2) * s * 0.75);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawSpawn(ctx, e, set, img, lift, base) {
    const t = e.spawnT, k = 1 / K;
    spawnFx(ctx, e, t);
    if (e.type === 'ghost') {
      const u = U.smoothstep(0.05, 1, t);
      const flick = u < 0.85 && Math.floor(FR.rt * 28 + e.seed * 9) & 1 ? 0.6 : 1;
      ctx.globalAlpha = base * u * flick;
      blitT(ctx, img, set.ax, set.ay, e.x, e.y - lift - (1 - u) * 14, 0, 1 - 0.35 * (1 - u), 1 + 0.5 * (1 - u));
      ctx.globalAlpha = 1;
      return;
    }
    const u = clamp((t - 0.2) / 0.8, 0, 1);
    if (u <= 0) return;
    const rise = U.ease.outBack(u);
    const st = u < 0.7 ? 1 + 0.13 * Math.sin((u / 0.7) * Math.PI) : 1 - 0.1 * Math.sin(((u - 0.7) / 0.3) * Math.PI);
    const w = img.width * k, h = img.height * k;
    const dy = (1 - rise) * set.ay * k * 0.92;
    ctx.save();
    ctx.beginPath(); ctx.rect(e.x - w, e.y - h - 24, w * 2, h + 24 + 1.2); ctx.clip();
    ctx.globalAlpha = base;
    blitT(ctx, img, set.ax, set.ay, e.x, e.y - lift + dy, 0, 1 / Math.sqrt(st), st);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function addShards(game, x, y, z, pals, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = (o.speed || 60) * (0.35 + Math.random() * 0.8);
      const p = game.addParticle({
        x: x + (Math.random() - 0.5) * (o.spread || 6), y: y + (Math.random() - 0.5) * (o.spread || 6) * 0.5,
        z: z + Math.random() * (o.zr || 8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: (o.vz || 70) * (0.5 + Math.random() * 0.8),
        grav: o.grav || 260, life: (o.life || 0.8) * (0.7 + Math.random() * 0.6), size: (o.size || 2.4) * (0.6 + Math.random() * 0.8),
        kind: 'shard', drag: o.drag || 1.6, vr: (Math.random() - 0.5) * 18,
      });
      if (p) { p.pal = pals[(Math.random() * pals.length) | 0]; p.shp = Math.random(); p.em = o.em && Math.random() < o.em; }
    }
  }
  function addPuffs(game, x, y, n, v, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = (o.speed || 24) * (0.4 + Math.random() * 0.8);
      const p = game.addParticle({
        x: x + Math.cos(a) * (o.r || 4), y: y + Math.sin(a) * (o.r || 4) * 0.5, z: o.z || 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6,
        vz: o.vz || 10, life: (o.life || 0.55) * (0.7 + Math.random() * 0.6), size: (o.size || 1) * (0.6 + Math.random() * 0.6), kind: 'puff', drag: 3,
      });
      if (p) p.v = v;
    }
  }
  function addSparks(game, x, y, z, n, col, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = (o.speed || 70) * (0.5 + Math.random() * 0.7);
      game.addParticle({ x, y, z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: (o.vz || 20) * Math.random(), life: (o.life || 0.28) * (0.7 + Math.random() * 0.6), size: (o.size || 2.2) * (0.6 + Math.random() * 0.6), kind: 'spark', color: col, drag: 5, grav: o.grav || 0 });
    }
  }
  /** Faceted ground ring (a 12-gon on the ground plane); delay staggers several rings. */
  function addRing(game, x, y, r0, r1, col, life, lw, delay) {
    const p = game.addParticle({ x, y, z: 0, life: life + (delay || 0), size: 1, kind: 'ring', drag: 0, color: col });
    if (p) { p.r0 = r0; p.r1 = r1; p.lw = lw || 2; p.delay = delay || 0; }
  }
  /** Core flash: a faceted star burst (coloured rim + white core), very short. */
  function addFlash(game, x, y, z, r0, r1, col, life, n) {
    const p = game.addParticle({ x, y, z, life, size: 1, kind: 'flash', drag: 0, color: col });
    if (p) { p.r0 = r0; p.r1 = r1; p.n = n || 6; }
  }
  /** Residue: a flat faceted patch left on the ground that fades out. */
  function addScorch(game, x, y, r, col, life) {
    const p = game.addParticle({ x, y, z: 0, life, size: 1, kind: 'scorch', drag: 0, color: col });
    if (p) p.r = r;
  }

  /* ================================ numbers ================================ */
  const NUM_FONTS = [];
  for (let i = 0; i <= 16; i++) NUM_FONTS.push('800 ' + (4 + i * 0.5).toFixed(1) + 'px "Baloo 2", "Nunito", system-ui, sans-serif');

  /* ================================ screen post ================================ */
  let OV = null;
  function overlay(W, H) {
    if (OV && OV.W === W && OV.H === H) return OV;
    const hb = Math.round(H * 0.2), hbb = Math.round(H * 0.17);
    const ds = 8;
    const mk = (h) => { const c = U.canvas(Math.max(8, Math.round(W / ds)), Math.max(4, Math.round(h / ds))); c.ctx.imageSmoothingQuality = 'medium'; return c; };
    OV = { W, H, hb, hbb, top: mk(hb), bot: mk(hbb) };
    // haze + vignette gradients for the small band canvases
    const tg = OV.top.ctx.createLinearGradient(0, 0, 0, OV.top.c.height);
    tg.addColorStop(0, 'rgba(232,238,250,0.34)'); tg.addColorStop(1, 'rgba(236,240,250,0.0)');
    OV.topHaze = tg;
    const bg = OV.bot.ctx.createLinearGradient(0, 0, 0, OV.bot.c.height);
    bg.addColorStop(0, 'rgba(70,62,110,0)'); bg.addColorStop(1, 'rgba(70,62,110,0.26)');
    OV.botHaze = bg;
    // side vignette strips (pre-rendered)
    const sw = Math.round(W * 0.09);
    OV.side = U.sprite(sw, 8, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, sw, 0);
      g.addColorStop(0, 'rgba(60,55,100,0.22)'); g.addColorStop(1, 'rgba(60,55,100,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, sw, 8);
    });
    OV.sw = sw;
    return OV;
  }

  /* ================================ icons ================================ */
  function extrude(pts, d, bevel, col, o = {}) {
    // polygon in (x, z), thickness along y, front (+y) gets a raised bevel cap
    const m = new Mesh();
    const n = pts.length;
    let cx = 0, cz = 0;
    for (const p of pts) { cx += p[0]; cz += p[1]; }
    cx /= n; cz /= n;
    const fo = [], bo = [], inn = [];
    for (const p of pts) { fo.push(m.vert(p[0], d / 2, p[1])); bo.push(m.vert(p[0], -d / 2, p[1])); }
    const ins = o.inset || 0.72;
    const ip = pts.map((p) => [cx + (p[0] - cx) * ins, cz + (p[1] - cz) * ins]);
    for (const p of ip) inn.push(m.vert(p[0], d / 2 + bevel, p[1]));
    const tri = triangulate(ip);
    const from = m.f.length;
    for (const [a, b, c] of tri) m.tri(inn[a], inn[b], inn[c], col);
    m.orient(() => [0, 1, 0], from);
    let f2 = m.f.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      m.tri(fo[i], fo[j], inn[j], col); m.tri(fo[i], inn[j], inn[i], col);
    }
    m.orient((x, y, z) => [x - cx, 1.2, z - cz], f2);
    f2 = m.f.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      m.tri(fo[i], bo[i], bo[j], mulc(col, 0.9)); m.tri(fo[i], bo[j], fo[j], mulc(col, 0.9));
    }
    m.orient((x, y, z) => [x - cx, 0, z - cz], f2);
    return m;
  }
  function torus(R, r, segs, col, rs = 6) {
    const prof = [];
    for (let k = 0; k <= rs; k++) { const a = -Math.PI / 2 + (k / rs) * TAU; prof.push([R + Math.cos(a) * r, Math.sin(a) * r]); }
    return lathe(prof, segs, { col });
  }
  const ICON = {};
  function iconMesh(id) {
    if (ICON[id]) return ICON[id];
    let r = null;
    const seedM = mSeed();
    switch (id) {
      case 'hp-heart': {
        const pts = [];
        for (let k = 0; k < 16; k++) {
          const t = (k / 16) * TAU;
          pts.push([16 * Math.sin(t) ** 3 * 0.5, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.5]);
        }
        r = { m: extrude(pts, 5, 2.2, hex('#f2625a')), yaw: 0.32, pitch: 18 };
        break;
      }
      case 'kills': {
        const m = new Mesh().add(creeperBody(0.6));
        r = { m, yaw: Math.PI / 2 - 0.35, pitch: 22 };
        break;
      }
      case 'dmg': {
        const m = new Mesh().add(seedM, chain(RZ(-0.2), RX(0.5), SC(2.2)));
        r = { m, yaw: Math.PI / 2 + 0.6, pitch: 40, extra: 'glint' };
        break;
      }
      case 'rate': {
        const m = new Mesh();
        for (let i = 0; i < 3; i++) m.add(seedM, chain(T(i * 6 - 6, 0, i * 2.4), RX(0.6), SC(1.4)));
        r = { m, yaw: Math.PI / 2 + 0.25, pitch: 30, extra: 'speed' };
        break;
      }
      case 'multi': {
        const m = new Mesh();
        m.add(lathe([[0, 0], [5.5, 0.6], [7.6, 3.4], [8, 7.5], [6.4, 11], [3.2, 13.2], [2.5, 13.8], [3.9, 15.2], [2.6, 15.6], [0, 15.0]], 9, { col: (i, j, h) => ((i + j) % 2 ? hex('#c99c62') : hex('#d6ab70')), jitter: 0.25, seed: 5 }));
        m.add(lathe([[2.75, 13.0], [2.75, 14.2]], 9, { col: P.scarf }));
        m.add(pumpkinPatch(), chain(T(6.7, 0, 6.5), RY(0.12)));
        for (let i = 0; i < 3; i++) m.add(seedM, chain(T(8 + i * 3.2, -5 + i * 4.5, 0.8), RZ(i * 0.9), RY(Math.PI / 2 - 0.15), SC(0.9)));
        r = { m, yaw: 0.2 + Math.PI / 2 - 0.9, pitch: 26 };
        break;
      }
      case 'bounce': {
        const m = new Mesh();
        for (let i = 0; i < 3; i++) m.add(torus(5, 1.2, 10, hex('#8d97b4')), T(0, 0, i * 3.4 + 1.2));
        m.add(lathe([[5.8, 0], [5.8, 0.8]], 10, { col: hex('#6f7896'), capT: 1, capB: 1 }));
        m.add(seedM, chain(T(0, 0, 13), RX(0.5), SC(1.6)));
        r = { m, yaw: Math.PI / 2 - 0.3, pitch: 30, extra: 'arc' };
        break;
      }
      case 'lantern': r = { m: mLantern(), yaw: Math.PI / 2 - 0.3, pitch: 20, extra: 'glow' }; break;
      case 'speed': {
        const m = new Mesh();
        const glass = hex('#bfe4ff'), glassDk = hex('#9ccff5');
        const sole = [];
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; sole.push([Math.cos(a) * 8 + (Math.cos(a) > 0 ? 1.5 : 0), Math.sin(a) * (Math.cos(a) > 0 ? 3.4 : 2.5)]); }
        m.add(extrude(sole, 1.2, 0.3, glassDk, { inset: 0.85 }), chain(T(0, 0, 3), RY(0.28), RX(Math.PI / 2)));
        m.add(ico(1, { r: 4.2, sx: 1.55, sy: 0.95, sz: 0.75, col: (nx, ny, nz, g) => (g.next() < 0.18 ? hex('#ffffff') : glass) }), T(3.6, 0, 3.4));
        m.add(lathe([[1.0, 0], [0.7, 4.2]], 6, { col: glassDk, capT: 1 }), T(-6.8, 0, 0));
        m.add(ico(0, { r: 1.6, col: hex('#ffd4ea') }), T(4.8, 0, 6.6));
        r = { m, yaw: Math.PI / 2 - 0.55, pitch: 32, extra: 'sparkle' };
        break;
      }
      case 'magnet': {
        const m = new Mesh();
        const w1 = hex('#c99258'), w2 = hex('#a8743f');
        m.add(lathe([[0, 0], [5.2, 0.3], [7.6, 3.6], [8.9, 8.0], [8.3, 8.2], [7.0, 4.8], [0, 1.6]], 12, { col: (i, j, h) => ((i + j + h) % 2 ? w1 : w2) }));
        for (let k = 0; k < 9; k++) {
          const a0 = (k / 9) * Math.PI, a1 = ((k + 1) / 9) * Math.PI;
          const am = (a0 + a1) / 2;
          m.add(box(1.4, 1.4, 9.6 * (a1 - a0) + 0.6, w2), chain(T(Math.cos(am) * 8.6, 0, 8 + Math.sin(am) * 8.6), RY(-am)));
        }
        m.add(pumpkinPatch(), chain(T(-1.5, 1, 4.6), SC(0.85)));
        m.add(mGem(1.8, 2.0, P.mint), chain(T(3.2, -1.5, 6.6), RY(0.4)));
        m.add(mGem(2.2, 2.5, P.sky), chain(T(0.5, 3.4, 6.2), RX(-0.4)));
        r = { m, yaw: Math.PI / 2 - 0.25, pitch: 34 };
        break;
      }
      case 'hp': {
        const m = new Mesh();
        m.add(lathe([[0, 0], [5.6, 0.2], [8.2, 2.6], [8.8, 6.8], [8.4, 9.4], [9.1, 9.9], [7.7, 9.9], [7.6, 8.6], [0, 8.6]], 12, { col: (i) => (i >= 4 ? hex('#6c7290') : hex('#5d627d')) }));
        const stew = new Mesh();
        const c = stew.vert(0, 0, 8.7);
        const ring = [];
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; ring.push(stew.vert(Math.cos(a) * 7.6, Math.sin(a) * 7.6, 8.6 + (k & 1) * 0.25)); }
        for (let k = 0; k < 12; k++) stew.tri(c, ring[k], ring[(k + 1) % 12], k & 1 ? hex('#e8a14a') : hex('#e09440'));
        m.add(stew.orient(() => [0, 0, 1]));
        const rng = U.rng(4);
        for (let i = 0; i < 7; i++) {
          const a = rng.range(0, TAU), rr = rng.range(1, 5.5);
          m.add(box(2, 2, 2, i % 3 === 0 ? P.lilac : i % 3 === 1 ? P.cream : P.pumpkin), chain(T(Math.cos(a) * rr, Math.sin(a) * rr, 9.1), RZ(a), RX(0.4)));
        }
        for (const s of [-1, 1]) m.add(box(2.2, 3.2, 1.4, hex('#4c5069')), T(0, s * 9.3, 7.6));
        r = { m, yaw: 0.25 + Math.PI / 2 - 0.25, pitch: 36, extra: 'steam' };
        break;
      }
      default: return null;
    }
    ICON[id] = r;
    return r;
  }
  function pumpkinPatch() {
    const m = new Mesh();
    pumpkinHead(m, 2.6, 3.2, 2.6, 10, { ribs: 0.86 });
    return m;
  }
  function iconExtra(ctx, kind, size, fit) {
    const s = size / 96;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const star = (x, y, r, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, rr = k & 1 ? r * 0.28 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.fill();
    };
    if (kind === 'glint') { star(66 * s, 26 * s, 13 * s, '#ffffff'); star(30 * s, 70 * s, 7 * s, '#fff3c4'); }
    if (kind === 'sparkle') { star(70 * s, 22 * s, 11 * s, '#ffffff'); star(20 * s, 34 * s, 7 * s, '#e3f3ff'); star(78 * s, 62 * s, 6 * s, '#ffffff'); }
    if (kind === 'speed') {
      ctx.strokeStyle = 'rgba(120,160,220,0.75)';
      ctx.lineWidth = 4 * s;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo((10 + i * 4) * s, (62 - i * 13) * s); ctx.lineTo((26 + i * 4) * s, (62 - i * 13) * s); ctx.stroke(); }
    }
    if (kind === 'arc') {
      ctx.strokeStyle = 'rgba(255,190,90,0.9)';
      ctx.lineWidth = 3.2 * s;
      ctx.setLineDash([5 * s, 5 * s]);
      ctx.beginPath(); ctx.arc(48 * s, 40 * s, 30 * s, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (kind === 'steam') {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3.6 * s;
      for (let i = 0; i < 3; i++) {
        const x = (34 + i * 14) * s;
        ctx.beginPath(); ctx.moveTo(x, 30 * s); ctx.bezierCurveTo(x - 7 * s, 22 * s, x + 7 * s, 16 * s, x, 7 * s); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function renderIcon(ctx, id, size) {
    const ic = iconMesh(id);
    if (!ic) return;
    const a = (ic.pitch * Math.PI) / 180, sp = Math.sin(a), cp = Math.cos(a);
    const cs = Math.cos(ic.yaw), sn = Math.sin(ic.yaw);
    const v = ic.m.v;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let i = 0; i < v.length; i += 3) {
      const X = v[i] * cs - v[i + 1] * sn, Y = v[i] * sn + v[i + 1] * cs;
      const py = Y * sp - v[i + 2] * cp;
      x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    const pad = size < 64 ? 0.06 : 0.14;
    const k = (size * (1 - 2 * pad)) / Math.max(x1 - x0, y1 - y0);
    const ax = size / 2 - ((x0 + x1) / 2) * k, ay = size / 2 - ((y0 + y1) / 2) * k + size * 0.02;
    // soft contact shadow
    ctx.save();
    ctx.translate(size / 2 + size * 0.03, ay + y1 * k - size * 0.06);
    ctx.scale(1, 0.3);
    const rr = (x1 - x0) * k * 0.45;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
    g.addColorStop(0, 'rgba(60,50,110,0.28)'); g.addColorStop(1, 'rgba(60,50,110,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.fill();
    ctx.restore();
    if (ic.extra === 'glow') {
      const gg = ctx.createRadialGradient(size / 2, size * 0.55, 0, size / 2, size * 0.55, size * 0.45);
      gg.addColorStop(0, 'rgba(255,200,90,0.55)'); gg.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, size, size);
    }
    drawMesh(ctx, ic.m, { yaw: ic.yaw, K: k, ax, ay, sp, cp, lw: size < 64 ? 0.5 : 0.7 });
    if (ic.extra) iconExtra(ctx, ic.extra, size);
  }

  /* ================================ CSS ================================ */
  const F_HEAD = "'Baloo 2', 'Nunito', system-ui, sans-serif";
  const F_BODY = "'Nunito', 'Baloo 2', system-ui, sans-serif";
  const INK = '#3e3a58', SOFT = '#8f87ab', CREAM = '#fffaf2';
  const SHADOW = '0 6px 16px rgba(58,48,96,.24)';
  const css = `
body.style-lowpoly { font-family: ${F_BODY}; }
body.style-lowpoly #hud { padding: 14px 22px; }
body.style-lowpoly #hud .xp { height: 24px; background: #e9e3f1; border: 4px solid ${CREAM}; border-radius: 999px; box-shadow: ${SHADOW}, inset 0 2px 3px rgba(70,56,110,.18); }
body.style-lowpoly #hud .xp-fill { background: linear-gradient(90deg, #62dcb4, #6fd1d8 55%, #74c3f4); border-radius: 999px; box-shadow: inset 0 -3px 0 rgba(30,90,110,.16); }
body.style-lowpoly #hud .xp-fill::after { content: ''; position: absolute; left: 8px; right: 8px; top: 2px; height: 5px; border-radius: 99px; background: rgba(255,255,255,.5); }
body.style-lowpoly #hud .lvl { right: 12px; font: 800 13px/1 ${F_HEAD}; color: ${INK}; text-shadow: 0 1px 0 rgba(255,255,255,.9); letter-spacing: .5px; }
body.style-lowpoly #hud .topline { margin-top: 12px; align-items: center; }
body.style-lowpoly #hud .hp { position: relative; gap: 0; }
body.style-lowpoly #hud .hp-icon, body.style-lowpoly #hud .kills-icon { width: 50px; height: 50px; padding: 5px; border-radius: 50%; position: relative; z-index: 2;
  background: radial-gradient(circle at 45% 35%, #ffffff, #fff1e4 75%); box-shadow: ${SHADOW}, inset 0 -3px 0 rgba(160,120,90,.14); }
body.style-lowpoly #hud .hp-bar { width: 230px; height: 28px; margin-left: -12px; background: #f2e6e2; border: 4px solid ${CREAM}; border-radius: 999px;
  box-shadow: ${SHADOW}, inset 0 2px 3px rgba(110,50,50,.16); }
body.style-lowpoly #hud .hp-fill { background: linear-gradient(180deg, #ffa58a 0%, #f46d5d 55%, #dd5449 100%); border-radius: 999px; box-shadow: inset 0 -3px 0 rgba(120,20,20,.14); }
body.style-lowpoly #hud .hp-fill::after { content: ''; position: absolute; left: 14px; right: 8px; top: 3px; height: 5px; border-radius: 99px; background: rgba(255,255,255,.45); }
body.style-lowpoly #hud .hp-text { position: absolute; left: 38px; width: 230px; top: 50%; transform: translateY(-50%); text-align: center; z-index: 3;
  font: 800 14px/1 ${F_HEAD}; color: #fff; text-shadow: 0 1px 2px rgba(130,30,30,.55); }
body.style-lowpoly #hud .clock { background: ${CREAM}; padding: 3px 26px 7px; border-radius: 22px; box-shadow: ${SHADOW}, inset 0 -4px 0 rgba(150,130,180,.13); min-width: 150px; }
body.style-lowpoly #hud .clock-time { font: 800 32px/1.1 ${F_HEAD}; color: ${INK}; text-shadow: none; letter-spacing: 1px; }
body.style-lowpoly #hud .clock-label { font: 800 10px/1 ${F_BODY}; color: ${SOFT}; letter-spacing: 2.2px; opacity: 1; }
body.style-lowpoly #hud .kills { min-width: 280px; gap: 0; text-shadow: none; }
body.style-lowpoly #hud .kills-num { margin-left: -14px; padding: 4px 18px 4px 24px; min-width: 84px; text-align: right; background: ${CREAM}; border-radius: 999px;
  font: 800 21px/1.2 ${F_HEAD}; color: ${INK}; box-shadow: ${SHADOW}, inset 0 -3px 0 rgba(150,130,180,.13); }
body.style-lowpoly.hurt #hud .hp-bar { filter: none; border-color: #ffd7cc; box-shadow: 0 0 0 3px rgba(255,120,90,.55), ${SHADOW}; }
body.style-lowpoly #stylebar { background: rgba(255,250,242,.95); border: none; box-shadow: 0 8px 22px rgba(58,48,96,.26); color: ${INK}; padding: 8px 22px; }
body.style-lowpoly #stylebar .style-family { color: ${SOFT}; opacity: 1; font-weight: 800; }
body.style-lowpoly #stylebar .style-name { font-family: ${F_HEAD}; font-weight: 800; font-size: 16px; color: ${INK}; }
body.style-lowpoly #stylebar .style-hint { color: #7e7898; opacity: 1; font-weight: 600; }
body.style-lowpoly #stylebar .auto.on { color: #23a582; }
body.style-lowpoly #levelup { background: radial-gradient(ellipse at 50% 46%, rgba(255,246,232,.30), rgba(66,56,104,.66)); backdrop-filter: blur(3px); gap: 26px; }
body.style-lowpoly #levelup .lu-title { font: 800 58px/1 ${F_HEAD}; color: #fff; letter-spacing: 1px;
  text-shadow: 0 1px 0 #f39a52, 0 2px 0 #ee8c45, 0 3px 0 #e8803c, 0 4px 0 #e07434, 0 5px 0 #d6692e, 0 12px 20px rgba(60,40,100,.45); }
body.style-lowpoly #levelup .lu-cards { gap: 26px; }
body.style-lowpoly #levelup .card { width: 226px; min-height: 282px; padding: 24px 18px 22px; gap: 8px; color: ${INK}; border: none; border-radius: 28px;
  background: linear-gradient(180deg, #fffefb, #fbf3e9); box-shadow: 0 18px 36px rgba(40,30,80,.34), inset 0 -6px 0 rgba(150,130,190,.16); transition: transform .14s, box-shadow .14s; }
body.style-lowpoly #levelup .card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 26px 44px rgba(40,30,80,.38), inset 0 -6px 0 rgba(150,130,190,.16); }
body.style-lowpoly #levelup .card-icon { width: 116px; height: 116px; padding: 10px; border-radius: 50%; background: radial-gradient(circle at 50% 38%, #ffffff, #d6f2e8 74%);
  box-shadow: inset 0 -5px 0 rgba(60,120,100,.12); }
body.style-lowpoly #levelup .card:nth-child(2) .card-icon { background: radial-gradient(circle at 50% 38%, #ffffff, #ffe4cf 74%); box-shadow: inset 0 -5px 0 rgba(160,100,60,.12); }
body.style-lowpoly #levelup .card:nth-child(3) .card-icon { background: radial-gradient(circle at 50% 38%, #ffffff, #e8ddf8 74%); box-shadow: inset 0 -5px 0 rgba(100,80,160,.12); }
body.style-lowpoly #levelup .card-name { font: 800 22px/1.1 ${F_HEAD}; color: ${INK}; margin-top: 6px; }
body.style-lowpoly #levelup .card-desc { font: 700 14px/1.35 ${F_BODY}; color: #7e7898; opacity: 1; }
body.style-lowpoly #levelup .card-key { top: 14px; left: 14px; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: #f0e9f7;
  color: #8a7fb2; font: 800 14px/1 ${F_HEAD}; opacity: 1; }
body.style-lowpoly #levelup .lu-hint { font: 700 15px ${F_BODY}; color: #fff; opacity: .95; text-shadow: 0 2px 8px rgba(40,30,80,.55); }
body.style-lowpoly #gameover { background: radial-gradient(ellipse at 50% 46%, rgba(255,246,232,.25), rgba(56,46,96,.72)); backdrop-filter: blur(3px); gap: 16px; }
body.style-lowpoly #gameover .go-title { font: 800 60px/1 ${F_HEAD}; color: #fff; text-shadow: 0 1px 0 #a98bd6, 0 2px 0 #9c7dcb, 0 3px 0 #8f70c0, 0 4px 0 #8264b4, 0 12px 20px rgba(40,30,80,.45); }
body.style-lowpoly #gameover .go-stats { font: 700 17px ${F_BODY}; color: ${INK}; background: ${CREAM}; padding: 10px 26px; border-radius: 999px; box-shadow: ${SHADOW}; opacity: 1; }
body.style-lowpoly #gameover .go-hint { font: 700 14px ${F_BODY}; color: #fff; opacity: .9; }
body.style-lowpoly #pausebox { font: 800 48px ${F_HEAD}; color: #fff; text-shadow: 0 4px 0 #8f70c0, 0 12px 20px rgba(40,30,80,.4); }
`;

  /* ================================ the style ================================ */
  Styles.register({
    id: 'lowpoly',
    name: 'Low-Poly-Diorama',
    family: '3D-Look · Low Poly',
    description: 'A toy-like autumn miniature world of flat-shaded triangle facets in soft afternoon light, with tilt-shift blur at the screen edges.',
    groundColor: '#a1b97e',
    groundResMax: 3,
    chunkSize: 256,
    fonts: ['Baloo+2:wght@600;700;800', 'Nunito:wght@600;700;800;900'],
    css,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = (window.__forceH || window.innerHeight || 900) * dpr;
      K = clamp(Math.round((h / 360) * 4) / 4, 2, 4);
      VS = K;
      buildAll();
    },

    renderGroundChunk(ctx, info) { return groundChunk(ctx, info); },

    propsForChunk(info) { return genProps(info.cx, info.cy).slice(); },

    drawProp(ctx, p, view) {
      const s = PROPS[p.t];
      if (!s) return;
      let a = 1;
      const pl = view.game.player;
      if (s.occl && pl.y < p.y - 2 && pl.y > p.y - s.ay / K + 6 && Math.abs(pl.x - p.x) < s.hw) a = 0.42;
      ctx.globalAlpha = a;
      blit(ctx, s.c, s.ax, s.ay, p.x, p.y);
      ctx.globalAlpha = 1;
    },

    drawGroundOverlay(ctx, view) {
      VS = view.S;
      FR.rt = view.rt;
      FR.shatter = 0;
      // water glints: small faceted sparkles that blink slowly on pond facets
      const s = 256;
      const cx0 = Math.floor(view.x0 / s), cx1 = Math.floor(view.x1 / s), cy0 = Math.floor(view.y0 / s), cy1 = Math.floor(view.y1 / s);
      ctx.fillStyle = '#effcff';
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const arr = GLINT.get(cx + ',' + cy);
        if (!arr || !arr.length) continue;
        for (let i = 0; i < arr.length; i += 3) {
          const x = arr[i], y = arr[i + 1];
          if (x < view.x0 - 4 || x > view.x1 + 4 || y < view.y0 - 4 || y > view.y1 + 4) continue;
          const v = Math.sin(view.rt * 1.1 + arr[i + 2]);
          if (v < 0.5) continue;
          const g = (v - 0.5) * 2, r = 1.2 + g * 1.6;
          ctx.globalAlpha = g * 0.8;
          ctx.beginPath();
          ctx.moveTo(x - r * 1.8, y); ctx.lineTo(x, y - r * 0.4); ctx.lineTo(x + r * 1.8, y); ctx.lineTo(x, y + r * 0.4);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o) {
      if (o.kind === 'prop') return;
      let sh, a = 0.5;
      if (o.kind === 'player') sh = SH.jack;
      else {
        sh = SH[o.type];
        if (!sh) return;
        if (o.type === 'ghost') a = 0.3;
        if (o.dying) a *= Math.max(0, 1 - o.deathT / 0.3);
        if (o.spawnT < 1) a *= U.smoothstep(0.15, 0.8, o.spawnT);
      }
      if (a <= 0.01) return;
      ctx.globalAlpha = a;
      blit(ctx, sh.c, sh.ax, sh.ay, o.x, o.y);
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      const s = g.big ? SET.gemBig : SET.gem;
      const fi = Math.floor((view.rt * 1.5 + g.seed * 7) * s.n) % s.n;
      const hop = g.pop > 0 ? Math.sin(g.pop * Math.PI) * 9 : 0;
      const w = U.fract(view.rt * 0.55 + g.seed * 3), tri = w < 0.5 ? w * 2 : 2 - w * 2;
      const z = 1.6 + U.smoothstep(0, 1, tri) * 1.8 + hop;
      const sc = g.big ? 7 : 4.6;
      ctx.globalAlpha = 0.32;
      ctx.drawImage(FX.dot, g.x - sc / 2 + 0.6, g.y - sc * 0.22, sc, sc * 0.44);
      ctx.globalAlpha = 1;
      blit(ctx, s.frames[fi], s.ax, s.ay, g.x, g.y - z);
      // a facet catches the sun every few seconds
      const tw = U.fract(view.rt * 0.38 + g.seed * 5);
      if (tw < 0.1) {
        const a = Math.sin((tw / 0.1) * Math.PI), r = (g.big ? 4.2 : 3) * a;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ffffff';
        starPath(ctx, g.x + (g.big ? 1.6 : 1.1), g.y - z - (g.big ? 7 : 4.8), r, r * 0.2, 4, 0); ctx.fill();
        ctx.globalAlpha = 1;
      }
    },

    drawEnemy(ctx, e) {
      const set = e.type === 'creeper' && e.seed > 0.5 ? SET.creeper2 : SET[e.type];
      if (!set) return;
      const ghost = e.type === 'ghost';
      const mv = e.vx * e.vx + e.vy * e.vy > 9;
      const yaw = yawOf(e, mv ? e.vx : e.facing * 8, mv ? e.vy : 7, e.type === 'colossus' ? 0.08 : 0.16);
      const yi = yawIdx(yaw, set.n), NW = set.nf - 1;
      let fi, lift = 0;
      if (ghost) {
        fi = Math.floor((FR.rt * 1.5 + e.seed * 5) * NW) % NW;
        // eased hover: holds at the top and bottom of each bob (not a plain sine), own phase per actor
        const w = U.fract(FR.rt * 0.45 + e.seed * 3.7), tri = w < 0.5 ? w * 2 : 2 - w * 2;
        lift = 1.6 + U.smoothstep(0, 1, tri) * 3.0;
      } else fi = Math.floor(e.anim * (e.type === 'creeper' ? 0.55 : 0.42) * NW) % NW;
      if (fi < 0) fi += NW;
      const base = ghost ? 0.84 : 1;
      if (e.dying) {
        const t = e.deathT;
        fi = NW;
        const img = set.frames[yi][fi];
        if (t < 0.14) {
          // anticipation of the break: a quick swell + white-out
          const u = t / 0.14;
          ctx.globalAlpha = base;
          blitT(ctx, img, set.ax, set.ay, e.x, e.y - lift, 0, 1 + 0.16 * u, 1 - 0.08 * u);
          ctx.globalAlpha = base * u;
          blitT(ctx, flashOf(set, yi, fi), set.ax, set.ay, e.x, e.y - lift, 0, 1 + 0.16 * u, 1 - 0.08 * u);
        } else if (FR.shatter++ < 6) drawShatter(ctx, set, img, flashOf(set, yi, fi), e.x, e.y - lift, Math.min(1, (t - 0.14) / 0.86), e.type, base);
        else {
          // crowd fallback (more than 6 break-ups in one frame): sink into the ground and fade
          const u = (t - 0.14) / 0.86;
          ctx.globalAlpha = base * (1 - u);
          blitT(ctx, img, set.ax, set.ay, e.x, e.y - lift + u * 6, 0, 1 + 0.2 * u, 1 - 0.5 * u);
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (e.spawnT < 1) { drawSpawn(ctx, e, set, set.frames[yi][fi], lift, base); return; }
      // hit: ~140 ms reaction pose, thrown back in the push direction, squashed, white flash
      const hk = e.flash;
      if (hk > 0.25) fi = NW;
      const img = set.frames[yi][fi];
      ctx.globalAlpha = base;
      if (hk > 0.02) {
        const dir = Math.abs(e.kx) > 2 ? Math.sign(e.kx) : -e.facing;
        const ek = hk * hk * (3 - 2 * hk);
        const rot = dir * (e.type === 'colossus' ? 0.12 : 0.26) * ek, sx = 1 + 0.09 * ek, sy = 1 - 0.08 * ek;
        blitT(ctx, img, set.ax, set.ay, e.x + dir * 1.5 * ek, e.y - lift, rot, sx, sy);
        if (fi === NW) {
          ctx.globalAlpha = Math.min(1, hk * 1.15) * base;
          blitT(ctx, flashOf(set, yi, fi), set.ax, set.ay, e.x + dir * 1.5 * ek, e.y - lift, rot, sx, sy);
        }
      } else blit(ctx, img, set.ax, set.ay, e.x, e.y - lift);
      if (e.type === 'colossus') {
        const fwd = Math.sin(yaw);
        if (fwd > -0.3) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (0.35 + 0.15 * Math.sin(FR.rt * 5 + e.seed * 9)) * Math.min(1, fwd + 0.6);
          const gx = e.x + Math.cos(yaw) * 15, gy = e.y - lift - 25 * CP + Math.sin(yaw) * 15 * SP;
          ctx.drawImage(FX.glowSmall, gx - 16, gy - 16, 32, 32);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      const set = SET.jack;
      let tx = 0, ty = 0;
      if (p.dashT > 0) { tx = p.dashX * 10; ty = p.dashY * 10; }
      else if (p.moving) { if (p.vx * p.vx + p.vy * p.vy > 9) { tx = p.vx; ty = p.vy; } else { tx = p.facing * 8; ty = 7; } }
      const yaw = yawOf(p, tx, ty, p.dashT > 0 ? 0.5 : 0.22);
      const yi = yawIdx(yaw, set.n);
      let fi;
      if (p.hurtT > 0.62) fi = J_HURT;
      else if (p.dashT > 0) fi = 0.2 - p.dashT < 0.045 ? J_CROUCH : J_STRETCH;
      else if (p.moving) fi = ((Math.floor(p.anim * 0.5 * 8) % 8) + 8) % 8;
      else fi = (view.rt + 0.6) % 3.6 < 0.14 ? J_BLINK : J_IDLE + (Math.floor((view.rt / 2.0) * 4) % 4);
      const img = set.frames[yi][fi];
      // glow-up: faceted ground rings + warm light
      if (p.levelT > 0) {
        const t = 1 - p.levelT;
        ctx.globalAlpha = p.levelT * 0.9;
        ctx.strokeStyle = '#ffd666';
        ctx.lineWidth = 2.4 * p.levelT + 0.5;
        facetPoly(ctx, p.x, p.y, 10 + t * 34, 0.5, 12, t * 0.6, 0); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = p.levelT * 0.6;
        ctx.drawImage(FX.glowWarm, p.x - 30, p.y - 44, 60, 60);
        ctx.globalCompositeOperation = 'source-over';
      }
      // dash: cool after-images of the lunge pose + three speed facets
      if (p.dashT > 0 && fi === J_STRETCH) {
        const fl = flashOf(set, yi, fi), k = Math.min(1, p.dashT * 7);
        for (let i = 2; i >= 1; i--) {
          ctx.globalAlpha = 0.2 * (3 - i) * k;
          blit(ctx, fl, set.ax, set.ay, p.x - p.dashX * i * 7, p.y - p.dashY * i * 7);
        }
        ctx.fillStyle = '#f6ecd6';
        for (let i = 0; i < 3; i++) {
          const ox = -p.dashX * (10 + i * 3), oy = -p.dashY * (10 + i * 3) - 6 - i * 6, l = 10 + i * 4;
          ctx.globalAlpha = 0.5 * k * (1 - i * 0.25);
          ctx.beginPath();
          ctx.moveTo(p.x + ox, p.y + oy - 0.8); ctx.lineTo(p.x + ox - p.dashX * l, p.y + oy - p.dashY * l); ctx.lineTo(p.x + ox, p.y + oy + 0.8);
          ctx.fill();
        }
      }
      let a = 1;
      if (p.iframes > 0 && p.hurtT <= 0 && p.dashT <= 0) a = Math.floor(view.rt * 18) % 2 ? 0.5 : 1;
      ctx.globalAlpha = a;
      if (p.hurtT > 0) {
        const hk = p.hurtT * p.hurtT, rot = -Math.cos(yaw) * 0.16 * hk;
        blitT(ctx, img, set.ax, set.ay, p.x, p.y, rot, 1 + 0.05 * hk, 1 - 0.05 * hk);
        ctx.globalAlpha = fi === J_HURT ? (p.hurtT > 0.75 ? 0.9 : p.hurtT * 0.8) : 0;
        if (fi === J_HURT) blitT(ctx, flashOf(set, yi, fi), set.ax, set.ay, p.x, p.y, rot, 1 + 0.05 * hk, 1 - 0.05 * hk);
      } else blit(ctx, img, set.ax, set.ay, p.x, p.y);
      // warm glow from the carved face
      const fwd = Math.sin(yaw);
      if (fwd > -0.35) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (0.22 + 0.06 * Math.sin(view.rt * 9)) * Math.min(1, fwd + 0.5) * (fi === J_BLINK ? 0.4 : 1);
        const gx = p.x + Math.cos(yaw) * 7, gy = p.y - 21 * CP + Math.sin(yaw) * 7 * SP;
        ctx.drawImage(FX.glowSmall, gx - 9, gy - 9, 18, 18);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    },

    /** Ambient: a few leaves tumble down over the woods (slow, never more than one per 64-unit cell). */
    drawWorldOverlay(ctx, view) {
      const C = LEAF_CELL;
      const i0 = Math.floor(view.x0 / C) - 1, i1 = Math.floor(view.x1 / C), j0 = Math.floor(view.y0 / C), j1 = Math.floor(view.y1 / C) + 1;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const v = leafCell(i, j);
        if (!v) continue;
        const h = U.hash2(i, j, 41), per = 5 + h * 3;
        const ph = U.fract(view.rt / per + h * 7);
        const z = 50 * (1 - ph) * (1 - ph * 0.2);
        const x = (i + h) * C + Math.sin(ph * TAU * 1.2 + h * 9) * 9 + ph * 18, y = (j + U.hash2(i, j, 42)) * C;
        if (x < view.x0 - 8 || x > view.x1 + 8 || y - z < view.y0 - 8 || y > view.y1 + 60) continue;
        const flip = Math.cos(view.rt * 3.4 + h * 20), s = 2.1;
        const c = LITTER[v - 1][Math.floor(h * 30) % 3];
        ctx.globalAlpha = Math.min(1, ph * 6, (1 - ph) * 8) * 0.95;
        const a = h * TAU + ph * 2, ca = Math.cos(a) * s, sa = Math.sin(a) * s * Math.abs(flip);
        const px = -Math.sin(a) * s * 0.55, py = Math.cos(a) * s * 0.55 * flip;
        ctx.fillStyle = c[flip > 0 ? 0 : 1];
        ctx.beginPath(); ctx.moveTo(x - ca, y - z - sa); ctx.lineTo(x + px, y - z + py); ctx.lineTo(x + ca, y - z + sa); ctx.fill();
        ctx.fillStyle = c[flip > 0 ? 1 : 0];
        ctx.beginPath(); ctx.moveTo(x - ca, y - z - sa); ctx.lineTo(x - px, y - z - py); ctx.lineTo(x + ca, y - z + sa); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const s = SET.lantern;
      const yi = yawIdx(o.angle, s.n);
      const gy = o.y + 6;
      const hover = 9 + Math.sin(view.rt * 4 + o.idx * 1.7) * 1.2;
      ctx.globalAlpha = 0.3;
      ctx.drawImage(FX.dot, o.x - 4, gy - 1.6, 8, 3.2);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + 0.12 * Math.sin(view.rt * 11 + o.idx);
      ctx.drawImage(FX.glowWarm, o.x - 18, gy - hover - 6 * CP - 18, 36, 36);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      blit(ctx, s.frames[yi][0], s.ax, s.ay, o.x, gy - hover);
    },

    drawProjectile(ctx, pr) {
      const s = SET.seed;
      const ca = Math.cos(pr.angle), sa = Math.sin(pr.angle);
      // ground shadow
      ctx.globalAlpha = 0.22;
      ctx.drawImage(FX.dot, pr.x - 2.6, pr.y + 6, 5.2, 2.2);
      // trail
      const tl = Math.min(16, 6 + pr.age * 60);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#fff6dc';
      ctx.beginPath();
      ctx.moveTo(pr.x - ca * tl, pr.y - sa * tl);
      ctx.lineTo(pr.x - sa * 1.7, pr.y + ca * 1.7);
      ctx.lineTo(pr.x + sa * 1.7, pr.y - ca * 1.7);
      ctx.fill();
      ctx.globalAlpha = 1;
      const fi = Math.floor((pr.spin / Math.PI) * 8) % 8;
      const w = s.w / K, h = s.h / K;
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.angle);
      ctx.drawImage(s.frames[fi], -w / 2, -h / 2, w, h);
      ctx.restore();
    },

    drawParticle(ctx, pt) {
      const k = pt.life / pt.max;
      const x = pt.x, y = pt.y - pt.z;
      switch (pt.kind) {
        case 'shard': {
          const a = k < 0.35 ? k / 0.35 : 1;
          const r = pt.rot, s = pt.size * (pt.z <= 0.01 ? 0.5 + 0.5 * Math.min(1, k / 0.35) : 1);
          const bi = Math.min(7, Math.floor(Math.abs(Math.cos(r * 1.1 + pt.seed * 6)) * 8));
          ctx.globalAlpha = a;
          ctx.fillStyle = pt.pal ? pt.pal[bi] : pt.color || '#fff';
          const c = Math.cos(r), sn = Math.sin(r), q = 0.7 + pt.shp * 0.4;
          ctx.beginPath();
          ctx.moveTo(x + c * s, y + sn * s * 0.8);
          ctx.lineTo(x + Math.cos(r + 2.2) * s * q, y + Math.sin(r + 2.2) * s * q * 0.8);
          if (pt.shp > 0.68) ctx.lineTo(x + Math.cos(r + 3.3) * s * 0.9, y + Math.sin(r + 3.3) * s * 0.7); // some chips are 4-sided plates
          ctx.lineTo(x + Math.cos(r + 4.0) * s * 0.75, y + Math.sin(r + 4.0) * s * 0.6);
          ctx.fill();
          if (pt.em) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.5; ctx.drawImage(FX.glowSmall, x - s * 2, y - s * 2, s * 4, s * 4); ctx.globalCompositeOperation = 'source-over'; }
          break;
        }
        case 'puff': {
          const f = FX.puff[pt.v || 0];
          const sc = pt.size * (0.7 + (1 - k) * 0.7);
          ctx.globalAlpha = Math.min(1, k * 1.6) * 0.95;
          ctx.drawImage(f.c, x - (f.cx / K) * sc, y - (f.cy / K) * sc, (f.c.width / K) * sc, (f.c.height / K) * sc);
          break;
        }
        case 'ring': {
          const age = pt.max - pt.life, d = pt.delay || 0;
          if (age < d) break;
          const t = (age - d) / (pt.max - d), kk = 1 - t;
          const r = pt.r0 + (pt.r1 - pt.r0) * (1 - (1 - t) * (1 - t) * (1 - t));
          ctx.globalAlpha = kk * 0.9;
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = pt.lw * kk + 0.3;
          ctx.lineJoin = 'miter';
          facetPoly(ctx, pt.x, pt.y, r, 0.5, 12, pt.seed * TAU, 0);
          ctx.stroke();
          break;
        }
        case 'flash': {
          const t = 1 - k, r = pt.r0 + (pt.r1 - pt.r0) * (1 - (1 - t) * (1 - t));
          const a0 = pt.seed * TAU, n = pt.n || 6;
          ctx.globalAlpha = k * k;
          ctx.fillStyle = pt.color;
          starPath(ctx, x, y, r, r * 0.36, n, a0); ctx.fill();
          ctx.globalAlpha = Math.min(1, k * 1.6);
          ctx.fillStyle = '#ffffff';
          starPath(ctx, x, y, r * 0.5, r * 0.2, n, a0 + Math.PI / n); ctx.fill();
          break;
        }
        case 'scorch': {
          const age = pt.max - pt.life;
          ctx.globalAlpha = 0.3 * Math.min(1, age * 8) * Math.min(1, k * 2.2);
          ctx.fillStyle = pt.color;
          facetPoly(ctx, pt.x, pt.y + 1, pt.r * (0.85 + 0.15 * Math.min(1, age * 6)), 0.5, 7, pt.seed * TAU, 0.28);
          ctx.fill();
          break;
        }
        case 'spark':
        case 'mote': {
          const s = pt.size * (pt.kind === 'mote' ? 1 : 0.5 + k * 0.5);
          ctx.globalAlpha = Math.min(1, k * 2);
          ctx.fillStyle = pt.color || '#fff';
          ctx.beginPath();
          ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.32, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.32, y);
          ctx.moveTo(x - s, y); ctx.lineTo(x, y - s * 0.32); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 0.32);
          ctx.fill();
          break;
        }
        default: {
          ctx.globalAlpha = k;
          ctx.fillStyle = pt.color || '#fff';
          const s = pt.size;
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n) {
      const k = n.life / n.max, age = 1 - k;
      const pop = age < 0.14 ? 0.55 + (age / 0.14) * 0.6 : 1.15 - Math.min(0.15, (age - 0.14) * 0.6);
      const sz = (n.crit ? 8.4 : 6.6) * pop;
      const fi = clamp(Math.round((sz - 4) * 2), 0, NUM_FONTS.length - 1);
      ctx.globalAlpha = clamp(k * 3, 0, 1);
      ctx.font = NUM_FONTS[fi];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = n.crit ? 2.0 : 1.5;
      ctx.strokeStyle = n.crit ? '#8a3a1c' : '#463c66';
      const txt = n.crit ? n.value + '!' : '' + n.value;
      ctx.strokeText(txt, n.x, n.y);
      ctx.fillStyle = n.crit ? '#ffcf48' : '#ffffff';
      ctx.fillText(txt, n.x, n.y);
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      const W = view.W, H = view.H;
      const o = overlay(W, H);
      const src = ctx.canvas;
      // tilt-shift: blurred + hazy top band (far), blurred + darker bottom band (near)
      const bands = [[o.top, 0, o.hb, o.topHaze, true], [o.bot, H - o.hbb, o.hbb, o.botHaze, false]];
      for (const [b, y0, hh, grad, top] of bands) {
        const bw = b.c.width, bh = b.c.height;
        b.ctx.globalCompositeOperation = 'copy';
        b.ctx.drawImage(src, 0, y0, W, hh, 0, 0, bw, bh);
        b.ctx.globalCompositeOperation = 'source-over';
        b.ctx.fillStyle = grad;
        b.ctx.fillRect(0, 0, bw, bh);
        const N = 7;
        for (let i = 0; i < N; i++) {
          const t = (i + 0.5) / N; // 0 at the screen edge side
          const e = top ? t : 1 - t;
          ctx.globalAlpha = Math.pow(1 - e, 1.6);
          const sy0 = (i / N) * bh, sy1 = ((i + 1) / N) * bh;
          ctx.drawImage(b.c, 0, sy0, bw, sy1 - sy0, 0, y0 + (i / N) * hh, W, hh / N + 0.5);
        }
      }
      ctx.globalAlpha = 1;
      // soft side vignette
      ctx.drawImage(o.side, 0, 0, o.sw, H);
      ctx.save();
      ctx.translate(W, 0); ctx.scale(-1, 1);
      ctx.drawImage(o.side, 0, 0, o.sw, H);
      ctx.restore();
    },

    drawIcon(ctx, id, size) { renderIcon(ctx, id, size); },

    /* ---------------- hooks ---------------- */
    onHit(game, e, src) {
      const pal = SHARD[e.type] || SHARD.creeper;
      const z = e.type === 'colossus' ? 22 : e.type === 'ghost' ? 14 : 10;
      const hot = src === 'lantern' ? '#ffcf6a' : '#fff1c9';
      // core flash -> a few facet chips -> quick sparks
      addFlash(game, e.x, e.y, z, 2.5, e.type === 'colossus' ? 13 : 9, hot, 0.12, 5);
      addShards(game, e.x, e.y, z, pal, e.type === 'colossus' ? 4 : 3, { speed: 60, life: 0.5, size: 1.8, vz: 55 });
      addSparks(game, e.x, e.y, z, 3, src === 'lantern' ? '#ffd27a' : '#ffffff', { speed: 95, life: 0.22 });
    },
    onKill(game, e) {
      const pal = SHARD[e.type] || SHARD.creeper;
      if (e.type === 'colossus') {
        addFlash(game, e.x, e.y, 24, 6, 34, '#ffd27a', 0.2, 7);
        addShards(game, e.x, e.y, 6, pal, 24, { speed: 95, life: 1.2, size: 4.2, vz: 110, zr: 30, spread: 20 });
        addShards(game, e.x, e.y, 26, SHARD.gold, 6, { speed: 70, life: 0.9, size: 2.4, vz: 120, em: 1 });
        addShards(game, e.x, e.y, 36, SHARD.leaf, 5, { speed: 60, life: 1.1, size: 3.2, vz: 90, grav: 150 });
        addPuffs(game, e.x, e.y, 9, 2, { speed: 50, r: 14, size: 2.2, life: 0.8 });
        addRing(game, e.x, e.y, 10, 46, '#f6ecd6', 0.5, 3.2);
        addRing(game, e.x, e.y, 6, 30, '#ffcf6a', 0.4, 2, 0.08);
        addSparks(game, e.x, e.y, 24, 8, '#ffcf6a', { speed: 120, life: 0.45, size: 3 });
        addScorch(game, e.x, e.y, 20, '#4a3a4a', 1.6);
      } else if (e.type === 'ghost') {
        addFlash(game, e.x, e.y, 14, 3, 16, '#dcebff', 0.16, 6);
        addShards(game, e.x, e.y, 12, SHARD.frost, 9, { speed: 50, life: 0.75, size: 2.3, vz: 50, grav: -40, drag: 2.4 });
        addPuffs(game, e.x, e.y, 4, 1, { speed: 22, size: 1.1, vz: 18, z: 10, life: 0.6 });
        addRing(game, e.x, e.y, 5, 22, '#e6f1ff', 0.35, 1.8);
        addScorch(game, e.x, e.y, 8, '#9fb6e8', 0.9);
      } else {
        addFlash(game, e.x, e.y, 10, 4, 18, '#e9d6ff', 0.16, 6);
        addShards(game, e.x, e.y, 6, pal, 12, { speed: 72, life: 0.95, size: 2.7, vz: 95, zr: 12 });
        addShards(game, e.x, e.y, 16, SHARD.leaf, 3, { speed: 45, life: 1.0, size: 2.6, vz: 80, grav: 140 });
        addPuffs(game, e.x, e.y, 3, 0, { speed: 26, size: 0.9 });
        addRing(game, e.x, e.y, 6, 26, '#f6ecd6', 0.36, 2);
        addScorch(game, e.x, e.y, 10, '#5a4060', 1.2);
      }
    },
    onHurt(game, p) {
      addFlash(game, p.x, p.y, 16, 3, 14, '#ffb35c', 0.14, 6);
      addShards(game, p.x, p.y, 16, SHARD.jack, 7, { speed: 70, life: 0.6, size: 2.2, vz: 70 });
      addSparks(game, p.x, p.y, 16, 4, '#ffd27a', { speed: 90 });
    },
    onPickup(game, g) {
      addFlash(game, g.x, g.y, 5, 1.5, g.big ? 9 : 6, g.big ? '#bfe6ff' : '#c6ffe9', 0.14, 4);
      addRing(game, g.x, g.y, 2, g.big ? 12 : 8, g.big ? '#bfe6ff' : '#9ff5d6', 0.3, 1.4);
      for (let i = 0; i < (g.big ? 5 : 3); i++) {
        game.addParticle({ x: g.x + (Math.random() - 0.5) * 6, y: g.y, z: 4 + Math.random() * 4, vx: (Math.random() - 0.5) * 12, vy: 0, vz: 34 + Math.random() * 24, life: 0.45 + Math.random() * 0.2, size: g.big ? 2.6 : 2, kind: 'mote', color: g.big ? '#d9f1ff' : '#d6fff0', drag: 2 });
      }
    },
    onShoot(game, pr) {
      if (Math.random() < 0.5) addPuffs(game, pr.x, pr.y + 4, 1, 3, { speed: 12, size: 0.45, life: 0.3, z: 6, r: 1 });
    },
    onDash(game, p) {
      addPuffs(game, p.x - p.dashX * 4, p.y, 5, 0, { speed: 30, r: 4, size: 0.85, life: 0.5 });
      addRing(game, p.x, p.y, 3, 14, '#f6ecd6', 0.28, 1.6);
    },
    onLevelUp(game, p) {
      addFlash(game, p.x, p.y, 18, 6, 26, '#ffe27a', 0.22, 8);
      addRing(game, p.x, p.y, 8, 52, '#ffd666', 0.7, 3);
      addRing(game, p.x, p.y, 6, 34, '#bdf5df', 0.55, 2, 0.12);
      addShards(game, p.x, p.y, 4, SHARD.gold, 10, { speed: 30, life: 1.2, size: 2.2, vz: 120, grav: 90, em: 1 });
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * TAU;
        game.addParticle({ x: p.x + Math.cos(a) * 12, y: p.y + Math.sin(a) * 6, z: 4 + Math.random() * 16, vx: Math.cos(a) * 10, vy: Math.sin(a) * 6, vz: 30 + Math.random() * 30, life: 0.9 + Math.random() * 0.5, size: 2 + Math.random() * 1.6, kind: 'mote', color: i & 1 ? '#ffe27a' : '#bdf5df', drag: 1 });
      }
    },
    onDeath(game, p) {
      addFlash(game, p.x, p.y, 16, 6, 28, '#ffb35c', 0.22, 7);
      addShards(game, p.x, p.y, 14, SHARD.jack, 24, { speed: 90, life: 1.3, size: 3, vz: 110, zr: 16 });
      addPuffs(game, p.x, p.y, 6, 0, { speed: 40, size: 1.4 });
      addScorch(game, p.x, p.y, 12, '#5a4038', 2);
    },
  });
})();
