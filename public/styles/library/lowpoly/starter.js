/* Low-Poly Diorama — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   A tiny software 3D pipeline: triangle meshes -> yaw -> 3/4 orthographic projection (pitch 44°) ->
   flat shading (one warm sun + sky/ground ambient) -> painter's sort -> baked into sprite canvases. */
(function (root) {
  'use strict';
  const PALETTE = {
    grass: '#9cb876', grass2: '#95b16f', grass3: '#a3bd7d', grass4: '#99b572',
    forest: '#c98e57', forest2: '#bf824f', forest3: '#cf9c5d', forest4: '#c08a55',
    sand: '#e2cb9c', sand2: '#dbc392', sand3: '#e6d2a6', sand4: '#dfc797',
    pumpkin: '#f48a2c', pumpkinDk: '#e27526', stem: '#7a8a3e', carve: '#6e2e10', glow: '#ffc43a', glowHot: '#fff1a6',
    cape: '#4b68a3', shirt: '#f3e6c8', shirtDk: '#dccaa2', pants: '#6c4e3f', boot: '#46332c', scarf: '#d65d42', glove: '#73a052',
    lilac: '#a77ccf', lilacDk: '#8661b4', cream: '#f3e5bb', creamDk: '#e2cf9a', root: '#dcc495', leaf: '#80b25c', leafDk: '#5f9248',
    ghostTop: '#eaf5ff', ghost: '#c6def6', ghostLow: '#a6b5ec', hole: '#29325a', holeDeep: '#161b33',
    pine: '#4e8d6e', pineDk: '#3f775c', pineLt: '#5c9c79', trunk: '#8c5c3e', mint: '#4fe3b0', sky: '#5cbdf6',
    seed: '#f8ebc6', seedRim: '#dfc58c', shadow: '#2c3263', propShadow: '#7d86c4', ink: '#3e3a58', uiCream: '#fffaf2',
  };
  const TAU = Math.PI * 2;
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const P = {}; for (const k in PALETTE) P[k] = hex(PALETTE[k]);
  const CROWNS = [['#ee8b3a', '#e47a31', '#f2a046'], ['#dc5d43', '#cf4d3c', '#e6714b'], ['#ecb544', '#e3a23c', '#f2c35a']].map((a) => a.map(hex));
  const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  const rgbs = (c) => 'rgb(' + (cl(c[0]) | 0) + ',' + (cl(c[1]) | 0) + ',' + (cl(c[2]) | 0) + ')';
  const mulc = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ramp = (st, t) => { t = Math.max(0, Math.min(1, t)) * (st.length - 1); const i = Math.min(Math.floor(t), st.length - 2); return mix(st[i], st[i + 1], t - i); };
  // seeded randomness (mulberry32) + integer hash -> deterministic scene, no Math.random()
  function rng(seed) { let a = seed >>> 0; const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return { next, range: (x, y) => x + (y - x) * next() }; }
  function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function vnoise(x, y, s) { // smooth value noise [0,1]
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y, s) => vnoise(x, y, s) * 0.57 + vnoise(x * 2, y * 2, s + 101) * 0.29 + vnoise(x * 4, y * 4, s + 202) * 0.14;
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  /* ---------------- tiny 3D core: camera, light, matrices, meshes ---------------- */
  const SP = Math.sin((44 * Math.PI) / 180), CP = Math.cos((44 * Math.PI) / 180); // camera pitch 44°
  const LV = (() => { const v = [-0.58, 0.3, 0.76], l = Math.hypot(v[0], v[1], v[2]); return v.map((c) => c / l); })(); // towards the sun (x right, y south, z up)
  const SKY = [0.47, 0.52, 0.67], GND = [0.52, 0.44, 0.38], SUN = [0.7, 0.62, 0.45];
  /** Flat face shading: hemispheric ambient (cool sky above, warm bounce below) + warm Lambert sun. */
  function shadeRGB(c, nx, ny, nz, lift) {
    const d = Math.max(0, nx * LV[0] + ny * LV[1] + nz * LV[2]), h = 0.5 + 0.5 * nz, out = [0, 0, 0];
    for (let i = 0; i < 3; i++) { out[i] = c[i] * (SKY[i] * h + GND[i] * (1 - h) + SUN[i] * d); if (lift) out[i] += (c[i] - out[i]) * lift; }
    return out;
  }
  const mul = (a, b) => { const r = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) r.push(a[i * 4] * b[j] + a[i * 4 + 1] * b[4 + j] + a[i * 4 + 2] * b[8 + j] + (j === 3 ? a[i * 4 + 3] : 0)); return r; };
  const chain = (...m) => m.reduce(mul);
  const T = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z];
  const SC = (s) => [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0];
  const RX = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]; };
  const RY = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]; };
  const RZ = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]; };
  class Mesh { // flat vertex array + triangle list; faces: {a,b,c,col,em (emissive),ds (double-sided),bias (depth bias)}
    constructor() { this.v = []; this.f = []; }
    vert(x, y, z) { this.v.push(x, y, z); return this.v.length / 3 - 1; }
    tri(a, b, c, col, o) { this.f.push({ a, b, c, col, em: o && o.em ? 1 : 0, ds: o && o.ds ? 1 : 0, bias: (o && o.bias) || 0 }); return this; }
    add(m, M) {
      const base = this.v.length / 3, v = m.v;
      for (let i = 0; i < v.length; i += 3) { const x = v[i], y = v[i + 1], z = v[i + 2]; M ? this.v.push(M[0] * x + M[1] * y + M[2] * z + M[3], M[4] * x + M[5] * y + M[6] * z + M[7], M[8] * x + M[9] * y + M[10] * z + M[11]) : this.v.push(x, y, z); }
      for (const f of m.f) this.f.push({ ...f, a: f.a + base, b: f.b + base, c: f.c + base }); return this;
    }
    orient(dir, from = 0) { // flip faces whose normal disagrees with dir(centroid)
      const v = this.v;
      for (let i = from; i < this.f.length; i++) {
        const f = this.f[i], A = f.a * 3, B = f.b * 3, C = f.c * 3;
        const e1 = [v[B] - v[A], v[B + 1] - v[A + 1], v[B + 2] - v[A + 2]], e2 = [v[C] - v[A], v[C + 1] - v[A + 1], v[C + 2] - v[A + 2]];
        const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        const d = dir((v[A] + v[B] + v[C]) / 3, (v[A + 1] + v[B + 1] + v[C + 1]) / 3, (v[A + 2] + v[B + 2] + v[C + 2]) / 3);
        if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0) { const t = f.b; f.b = f.c; f.c = t; }
      }
      return this;
    }
  }
  /** Surface of revolution. prof = [[r, z, ox?, oy?], ...] bottom to top (r = 0 -> pole). col(ring, seg, upperHalf). */
  function lathe(prof, segs, o = {}) {
    const m = new Mesh(), R = rng(o.seed || 7), jit = o.jitter || 0, open = o.a1 !== undefined;
    const a0 = o.a0 || 0, a1 = open ? o.a1 : a0 + TAU, nA = open ? segs + 1 : segs, rings = [];
    prof.forEach((p, i) => {
      const [r, z, ox = 0, oy = 0] = p;
      if (r <= 1e-4) { rings.push({ pole: m.vert(ox, oy, z) }); return; }
      const idx = []; for (let j = 0; j < nA; j++) {
        const a = a0 + ((a1 - a0) * j) / segs + (o.twist || 0) * i;
        let rr = r * (o.ribs && j & 1 ? o.ribs : 1), zz = z;
        if (jit) { rr += (R.next() - 0.5) * 2 * jit; zz += (R.next() - 0.5) * jit; }
        idx.push(m.vert(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr, zz));
      }
      rings.push({ idx, ox, oy, z });
    });
    const cf = typeof o.col === 'function' ? o.col : () => o.col, fo = { ds: o.ds, em: o.em };
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], B = rings[i + 1];
      for (let j = 0; j < segs; j++) {
        const j1 = open ? j + 1 : (j + 1) % segs;
        if (A.idx && B.idx) { m.tri(A.idx[j], A.idx[j1], B.idx[j1], cf(i, j, 0), fo); m.tri(A.idx[j], B.idx[j1], B.idx[j], cf(i, j, 1), fo); }
        else if (A.idx) m.tri(A.idx[j], A.idx[j1], B.pole, cf(i, j, 0), fo);
        else if (B.idx) m.tri(A.pole, B.idx[j1], B.idx[j], cf(i, j, 1), fo);
      }
    }
    for (const [on, rg, ci, rev] of [[o.capB, rings[0], -1, 1], [o.capT, rings[rings.length - 1], prof.length - 1, 0]]) { // flat caps
      if (!on || !rg.idx) continue; const c = m.vert(rg.ox, rg.oy, rg.z);
      for (let j = 0; j < segs; j++) { const j1 = open ? j + 1 : (j + 1) % segs; rev ? m.tri(c, rg.idx[j1], rg.idx[j], cf(ci, j, 0), fo) : m.tri(c, rg.idx[j], rg.idx[j1], cf(ci, j, 0), fo); }
    }
    return m;
  }
  const sphereProf = (R, Rv, cz, els) => els.map((e) => [Math.abs(e) >= 89.99 ? 0 : R * Math.cos((e * Math.PI) / 180), cz + Rv * Math.sin((e * Math.PI) / 180)]);
  function box(sx, sy, sz, col) {
    const m = new Mesh(), x = sx / 2, y = sy / 2, z = sz / 2;
    for (const p of [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]) m.vert(p[0], p[1], p[2]);
    for (const q of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) { m.tri(q[0], q[1], q[2], col); m.tri(q[0], q[2], q[3], col); }
    return m.orient((a, b, c) => [a, b, c]);
  }
  /** Icosphere (sub 0 = 20 faces, 1 = 80). col(nx, ny, nz, rng) per face; jitter dents the radius. */
  function ico(sub, o = {}) {
    const t = (1 + Math.sqrt(5)) / 2, nrm = (p) => { const l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l, p[1] / l, p[2] / l]; };
    let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nrm);
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let s = 0; s < sub; s++) {
      const cache = new Map(), NF = [];
      const mid = (a, b) => { const k = Math.min(a, b) * 997 + Math.max(a, b); let i = cache.get(k); if (i === undefined) { i = V.length; V.push(nrm([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2])); cache.set(k, i); } return i; };
      for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); NF.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
      F = NF; }
    const R = rng(o.seed || 1), r = o.r || 1, sx = (o.sx || 1) * r, sy = (o.sy || 1) * r, sz = (o.sz || 1) * r, m = new Mesh(); for (const p of V) { const k = 1 + (R.next() - 0.5) * 2 * (o.jitter || 0); m.vert(p[0] * sx * k, p[1] * sy * k, p[2] * sz * k); }
    const cf = typeof o.col === 'function' ? o.col : () => o.col; for (const [a, b, c] of F) { const n = nrm([V[a][0] + V[b][0] + V[c][0], V[a][1] + V[b][1] + V[c][1], V[a][2] + V[b][2] + V[c][2]]); m.tri(a, b, c, cf(n[0], n[1], n[2], R)); }
    return m.orient((x, y, z) => [x, y, z]);
  }
  /** Folded leaf blade along +x, two colours either side of the raised ridge, double-sided. */
  function leaf(len, wid, c1, c2, fold = 0.45, bend = 0) {
    const m = new Mesh(), z = (t) => bend * t * t, fo = { ds: 1 };
    const b = m.vert(0, 0, 0), l1 = m.vert(len * 0.36, -wid * 0.5, z(0.36) - wid * fold * 0.5), r1 = m.vert(len * 0.36, wid * 0.5, z(0.36) - wid * fold * 0.5);
    const m1 = m.vert(len * 0.45, 0, z(0.45)), l2 = m.vert(len * 0.72, -wid * 0.32, z(0.72) - wid * fold * 0.32), r2 = m.vert(len * 0.72, wid * 0.32, z(0.72) - wid * fold * 0.32), tp = m.vert(len, 0, z(1));
    m.tri(b, l1, m1, c1, fo); m.tri(l1, l2, m1, c1, fo); m.tri(m1, l2, tp, c1, fo); m.tri(b, m1, r1, c2, fo); m.tri(r1, m1, r2, c2, fo); m.tri(m1, tp, r2, c2, fo);
    return m;
  }
  function triangulate(pts) { // ear clipping for simple 2D polygons
    let idx = pts.map((_, i) => i), area = 0; pts.forEach((a, i) => { const b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }); if (area < 0) idx.reverse();
    const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), out = [];
    for (let guard = 0; idx.length > 3 && guard < 400; guard++) {
      let found = false;
      for (let i = 0; i < idx.length && !found; i++) {
        const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length], a = pts[ia], b = pts[ib], c = pts[ic];
        if (cr(a, b, c) <= 1e-9) continue;
        if (idx.some((k) => k !== ia && k !== ib && k !== ic && cr(a, b, pts[k]) >= 0 && cr(b, c, pts[k]) >= 0 && cr(c, a, pts[k]) >= 0)) continue;
        out.push([ia, ib, ic]); idx.splice(i, 1); found = true;
      }
      if (!found) break;
    }
    if (idx.length === 3) out.push(idx.slice()); return out;
  }
  /** Paint a flat polygon [[u (lateral), v (height)]] onto the +x (front) side of an ellipsoid as an unlit decal. */
  function feature(m, pts, R, Rv, cz, col, o = {}) {
    const off = o.off !== undefined ? o.off : 0.35, sc = o.scale || 1;
    const cu = pts.reduce((s, p) => s + p[0], 0) / pts.length, cv = pts.reduce((s, p) => s + p[1], 0) / pts.length, sp = pts.map(([u, v]) => [cu + (u - cu) * sc, cv + (v - cv) * sc]);
    const ids = sp.map(([u, v]) => m.vert(R * Math.sqrt(Math.max(0.04, 1 - (u / R) ** 2 - ((v - cz) / Rv) ** 2)) + off, u, v));
    const from = m.f.length, fo = { em: o.em === false ? 0 : 1, bias: o.bias !== undefined ? o.bias : -0.8 };
    for (const [a, b, c] of triangulate(sp)) m.tri(ids[a], ids[b], ids[c], col, fo);
    return m.orient(() => [1, 0, 0], from);
  }
  /** Carved glowing feature: dark rim (x1.3) + glowing fill + hot core (x0.5), stacked with depth bias. */
  function carved(m, pts, R, Rv, cz, o = {}) {
    feature(m, pts, R, Rv, cz, o.rim || P.carve, { scale: o.rs || 1.3, bias: -0.5, off: 0.28 });
    feature(m, pts, R, Rv, cz, o.fill || P.glow, { scale: 1, bias: -0.9, off: 0.36 });
    feature(m, pts, R, Rv, cz, o.hot || P.glowHot, { scale: o.hs || 0.5, bias: -1.2, off: 0.42 });
  }
  /** Projects, back-face culls, flat-shades, depth-sorts and fills a mesh. K = px per world unit, (ax, ay) = feet anchor. */
  function drawMesh(ctx, m, o) {
    const cs = Math.cos(o.yaw || 0), sn = Math.sin(o.yaw || 0), K = o.K, ax = o.ax, ay = o.ay, v = m.v, n = v.length / 3;
    const sp = o.sp || SP, cp = o.cp || CP, X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n), list = [];
    for (let i = 0; i < n; i++) { X[i] = v[i * 3] * cs - v[i * 3 + 1] * sn; Y[i] = v[i * 3] * sn + v[i * 3 + 1] * cs; Z[i] = v[i * 3 + 2]; }
    for (const f of m.f) {
      const { a, b, c } = f, e1x = X[b] - X[a], e1y = Y[b] - Y[a], e1z = Z[b] - Z[a], e2x = X[c] - X[a], e2y = Y[c] - Y[a], e2z = Z[c] - Z[a];
      let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      const l = Math.hypot(nx, ny, nz); if (l < 1e-9) continue;
      nx /= l; ny /= l; nz /= l; // back-face cull against the view vector (0, cp, sp)
      if (ny * cp + nz * sp <= 1e-4) { if (!f.ds) continue; nx = -nx; ny = -ny; nz = -nz; }
      const dep = -((Y[a] + Y[b] + Y[c]) / 3) * cp - ((Z[a] + Z[b] + Z[c]) / 3) * sp + f.bias;
      list.push({ a, b, c, dep, s: rgbs(f.em ? f.col : shadeRGB(f.col, nx, ny, nz, o.lift)) });
    }
    list.sort((p, q) => q.dep - p.dep);
    ctx.lineJoin = 'round'; ctx.lineWidth = o.lw !== undefined ? o.lw : 0.85; // same-colour stroke hides AA seams between facets
    for (const t of list) {
      ctx.fillStyle = ctx.strokeStyle = t.s; ctx.beginPath();
      for (const i of [t.a, t.b, t.c]) ctx.lineTo(ax + X[i] * K, ay + (Y[i] * sp - Z[i] * cp) * K);
      ctx.closePath(); ctx.fill(); if (ctx.lineWidth) ctx.stroke();
    }
  }
  /** Bakes one sprite per animation-frame mesh at a fixed yaw, with a common feet anchor. */
  function spriteSet(meshes, yaw, K, lift) {
    let R = 0, z0 = 0, z1 = 0;
    for (const m of meshes) for (let i = 0; i < m.v.length; i += 3) { R = Math.max(R, Math.hypot(m.v[i], m.v[i + 1])); z0 = Math.min(z0, m.v[i + 2]); z1 = Math.max(z1, m.v[i + 2]); }
    const w = Math.ceil(2 * R * K) + 4, top = Math.ceil((z1 * CP + R * SP) * K) + 2, bot = Math.ceil((R * SP - z0 * CP) * K) + 2, ax = Math.round(w / 2);
    const frames = meshes.map((m) => { const c = canvas(w, top + bot); drawMesh(c.getContext('2d'), m, { yaw, K, ax, ay: top, lift }); return c; });
    return { frames, ax, ay: top, K };
  }
  /** Soft cast shadow: mesh squashed along the sun onto the ground, blurred, plus an AO blob, tinted indigo. */
  function makeShadow(mesh, yaw, K, o = {}) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw), v = mesh.v, n = v.length / 3, kx = -LV[0] / LV[2], ky = -LV[1] / LV[2], PX = [], PY = [], ao = o.ao || 6;
    let x0 = -ao * K, x1 = ao * K, y0 = -ao * SP * K, y1 = ao * SP * K;
    for (let i = 0; i < n; i++) { // project each vertex along the sun ray onto z = 0, then squash by SP
      const x = v[i * 3], y = v[i * 3 + 1], z = Math.max(0, v[i * 3 + 2]); PX[i] = (x * cs - y * sn + z * kx) * K; PY[i] = (x * sn + y * cs + z * ky) * SP * K;
      x0 = Math.min(x0, PX[i]); x1 = Math.max(x1, PX[i]); y0 = Math.min(y0, PY[i]); y1 = Math.max(y1, PY[i]);
    }
    const blur = (o.blur || 1.6) * K, pad = Math.ceil(blur * 2.5) + 2, w = Math.ceil(x1 - x0) + pad * 2, h = Math.ceil(y1 - y0) + pad * 2;
    const ax = Math.round(-x0 + pad), ay = Math.round(-y0 + pad), A = canvas(w, h), a = A.getContext('2d'), B = canvas(w, h), b = B.getContext('2d');
    a.fillStyle = '#000'; for (const f of mesh.f) { a.beginPath(); a.moveTo(ax + PX[f.a], ay + PY[f.a]); a.lineTo(ax + PX[f.b], ay + PY[f.b]); a.lineTo(ax + PX[f.c], ay + PY[f.c]); a.fill(); }
    b.globalAlpha = o.dirA !== undefined ? o.dirA : 0.6; b.filter = 'blur(' + blur.toFixed(1) + 'px)'; b.drawImage(A, 0, 0); b.filter = 'none'; b.globalAlpha = 1;
    b.save(); b.translate(ax, ay); b.scale(1, SP * 0.95);
    const g = b.createRadialGradient(0, 0, 0, 0, 0, ao * K), aoA = o.aoA !== undefined ? o.aoA : 0.85;
    g.addColorStop(0, 'rgba(0,0,0,' + aoA + ')'); g.addColorStop(0.55, 'rgba(0,0,0,' + aoA * 0.55 + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = g; b.beginPath(); b.arc(0, 0, ao * K, 0, TAU); b.fill(); b.restore();
    b.globalCompositeOperation = 'source-in'; b.fillStyle = o.col || PALETTE.shadow; b.fillRect(0, 0, w, h);
    return { c: B, ax, ay };
  }
  function radial(r, stops) {
    const c = canvas(r * 2, r * 2), x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r);
    for (const [t, col] of stops) g.addColorStop(t, col);
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); return c;
  }
  const blit = (ctx, img, ax, ay, x, y, K) => ctx.drawImage(img, x - ax / K, y - ay / K, img.width / K, img.height / K);
  /* ---------------- models (units: world units, +x = front, z up, feet at z = 0) ---------------- */
  function pumpkinHead(m, hz, R, Rv, segs) {
    const prof = sphereProf(R, Rv, hz, [-90, -62, -34, -8, 18, 44, 66]).concat([[R * 0.2, hz + Rv * 0.97], [0, hz + Rv * 0.84]]);
    m.add(lathe(prof, segs, { ribs: 0.88, col: (i, j) => (i <= 0 ? mulc(P.pumpkinDk, 0.96) : j & 1 ? P.pumpkinDk : P.pumpkin) })); // alternating rib colours
    m.add(lathe([[R * 0.17, 0], [R * 0.13, R * 0.32], [R * 0.16, R * 0.42]], 5, { col: P.stem, capB: 1, capT: 1, twist: 0.5 }), chain(T(0.2, 0, hz + Rv * 0.78), RY(-0.32)));
  }
  /** Main character rig (knees, elbows, cape rings, scarf + head pivots); hip height from the stance leg -> feet stay on the ground. */
  function walkPose(ph) {
    const legs = [], arms = [], lag = 0.5 + 0.5 * Math.sin(2 * ph - 1.4); // follow-through peaks after the bob
    for (let k = 0; k < 2; k++) { const f = ph + (k ? 0 : Math.PI); legs.push([-0.58 * Math.sin(f), 0.1 + 1.05 * Math.pow(Math.max(0, Math.cos(f)), 1.4)]); arms.push([0.62 * Math.sin(f), 0.35 + 0.4 * Math.max(0, -Math.sin(f))]); }
    return { legs, arms, lean: 0.11, twist: 0.12 * Math.sin(ph), head: 0.35 * Math.sin(2 * ph - 0.9), cape: 1.5 + 0.9 * lag, capeLift: 0.4 + 0.9 * lag, capeSway: 0.7 * Math.sin(ph - 1.1), scarf: 0.5 + 0.3 * lag };
  }
  function mHero(q) {
    const m = new Mesh(), up = new Mesh(), head = new Mesh(), L1 = 3.8, L2 = 3.9;
    let hip = 0; for (const [a, kn] of q.legs) hip = Math.max(hip, L1 * Math.cos(a) + L2 * Math.cos(a + kn));
    q.legs.forEach(([a, kn], k) => {
      const leg = new Mesh().add(lathe([[1.58, 0], [1.5, L1 + 0.25]], 6, { col: P.pants, capT: 1, capB: 1 }), T(0, 0, -L1));
      const shin = lathe([[1.5, 0], [1.62, 1.7], [1.42, 2.3], [1.47, L2]], 6, { col: (i) => (i <= 0 ? P.boot : P.pants), capB: 1, capT: 1 }).add(box(2.7, 2.8, 1.8, P.boot), T(1.1, 0, 0.9));
      m.add(leg.add(shin, chain(T(0, 0, -L1), RY(kn), T(0, 0, -L2))), chain(T(0, (k ? 1 : -1) * 2.05, hip), RY(a)));
    });
    up.add(lathe([[4.15, 6.3], [4.5, 7.2], [3.95, 10.2], [3.35, 12.9], [2.1, 14.5], [0, 14.8]], 8, { col: (i) => (i <= 0 ? P.shirtDk : P.shirt), capB: 1 }));
    up.add(lathe([[4.18, 9.0], [4.05, 10.1]], 8, { col: P.pants })); up.add(lathe([[3.1, 13.0], [3.8, 13.6], [3.65, 14.6], [2.5, 15.25]], 8, { col: P.scarf }));
    up.add(box(1.3, 2.2, 4.8, P.scarf), chain(T(-3.0, 1.6, 14.4), RY(q.scarf), T(0, 0, -2.3))); // scarf tail on a pivot at the knot
    const fl = q.cape, cl = q.capeLift, cs = q.capeSway;
    up.add(lathe([[5.6, 6.0 + cl, -fl, cs], [5.1, 8.1 + cl * 0.45, -fl * 0.5 - 0.25, cs * 0.45], [4.7, 10.2, -0.5, 0], [3.35, 14.0, -0.1, 0]], 7, { a0: Math.PI * 0.6, a1: Math.PI * 1.4, ds: 1, col: (i) => (i === 0 ? mulc(P.cape, 0.88) : P.cape) }));
    q.arms.forEach(([a, el], k) => up.add(lathe([[1.2, -2.7], [1.25, -1.2], [1.2, 0]], 5, { col: P.shirt, capB: 1, capT: 1 }).add(lathe([[1.02, -2.5], [1.14, 0]], 5, { col: P.shirt, capB: 1 }).add(ico(0, { r: 1.4, col: P.glove }), T(0, 0, -3.2)), chain(T(0, 0, -2.6), RY(-el))), chain(T(0, (k ? 1 : -1) * 4.0, 13.1), RY(a), RX((k ? 1 : -1) * 0.2))));
    const hz = 21.6, R = 7.8, Rv = 6.5; pumpkinHead(head, hz, R, Rv, 16);
    head.add(leaf(4.8, 2.6, P.leaf, P.leafDk, 0.45, -0.6), chain(T(0.1, 0.5, hz + Rv * 0.92), RZ(1.9), RY(-0.35)));
    const eye = [[-4.1, hz + 1.3], [-0.85, hz + 1.3], [-2.45, hz + 4.6]];
    carved(head, eye, R, Rv, hz); carved(head, eye.map(([u, v]) => [-u, v]), R, Rv, hz);
    carved(head, [[-5.0, hz - 0.2], [-3.0, hz - 0.75], [-3.0, hz - 1.95], [-1.6, hz - 1.95], [-1.6, hz - 1.0], [1.6, hz - 1.0], [1.6, hz - 1.95], [3.0, hz - 1.95], [3.0, hz - 0.75], [5.0, hz - 0.2], [3.7, hz - 2.9], [0, hz - 3.8], [-3.7, hz - 2.9]], R, Rv, hz, { rs: 1.16, hs: 0.45 });
    up.add(head, chain(T(0, 0, 15 + q.head), T(0, 0, -15))); m.add(up, chain(T(0, 0, 6.5 + hip - 7.7), RY(q.lean), RZ(q.twist), T(0, 0, -6.5)));
    return new Mesh().add(m, SC(1.1));
  }
  function mEnemy(ph) { // small creature: a walking root creature (cream bottom, lilac top, leaf crown, glowing eyes)
    const m = new Mesh(), body = new Mesh(), sw = Math.sin(ph), R = rng(91), jc = (c) => mulc(c, 1 + (R.next() - 0.5) * 0.06);
    for (const s of [-1, 1]) {
      const leg = lathe([[0.7, 0], [1.0, 1.6], [1.45, 6.4]], 5, { col: P.root, capB: 1, capT: 1 });
      leg.add(ico(0, { r: 1.05, sx: 1.5, sz: 0.7, col: P.creamDk }), T(0.6, 0, 0.4));
      m.add(leg, chain(T(0.2, s * 3.0, 6.4 + Math.max(0, sw * s) * 1.2), RY(sw * 0.6 * s), RX(s * 0.16), T(0, 0, -6.4)));
    }
    body.add(lathe([[0, 2.4], [2.8, 3.0], [5.7, 4.7], [7.7, 7.4], [8.1, 10.1], [7.1, 12.8], [4.9, 15.0], [1.8, 16.3], [0, 16.5]], 9, {
      jitter: 0.32, twist: 0.2, seed: 11, col: (i, j, h) => (i <= 0 ? P.creamDk : i <= 2 ? jc(P.cream) : i === 3 ? (h ? P.lilac : P.cream) : i >= 6 ? P.lilacDk : jc(P.lilac)),
    }));
    for (let k = 0; k < 4; k++) body.add(leaf(8.8, 3.3, P.leaf, P.leafDk, 0.45, -1.4), chain(T(0, 0, 15.8), RZ((k / 4) * TAU + 0.4), RY(-0.95 + 0.13 * Math.sin(ph + k * 1.7))));
    const cz = 9.8, ER = 8.1, ERv = 7.2, eyeL = [[-3.7, 11.9], [-1.0, 10.9], [-1.3, 9.7], [-3.4, 10.2]];
    for (const e of [eyeL, eyeL.map(([u, v]) => [-u, v]).reverse()]) {
      feature(body, e, ER, ERv, cz, hex('#4a2a5e'), { scale: 1.35, bias: -0.5, off: 0.3 });
      feature(body, e, ER, ERv, cz, hex('#ffd43c'), { bias: -0.9, off: 0.38 });
      feature(body, e, ER, ERv, cz, hex('#fff6c0'), { scale: 0.42, bias: -1.2, off: 0.44 });
    }
    feature(body, [[-2.1, 7.7], [-1.0, 8.15], [0, 7.75], [1.0, 8.15], [2.1, 7.7], [1.5, 6.9], [0, 7.25], [-1.5, 6.9]], ER, ERv, cz, hex('#3d2552'), { off: 0.32 });
    return m.add(body, chain(T(0, 0, 2.6), RX(sw * 0.1)));
  }
  function mGhost(ph) { // fast creature: a lathe whose rings drift back and sway -> a trailing sheet
    const m = new Mesh(), zs = [2.6, 3.8, 5.4, 7.6, 10.2, 13.2, 16.2, 18.8, 20.8, 22.0, 22.5], rs = [0, 0.8, 1.7, 2.9, 4.2, 5.5, 6.1, 5.8, 4.5, 2.5, 0];
    m.add(lathe(zs.map((z, i) => { const t = Math.max(0, Math.min(1, (14.5 - z) / 12)); return [rs[i], z + 2.5, -t * t * 6.5, Math.sin(ph + z * 0.33) * t * 2]; }), 9,
      { twist: 0.17, jitter: 0.1, seed: 3, col: (i) => ramp([P.ghostLow, P.ghost, P.ghost, P.ghostTop, P.ghostTop], i / 9) }));
    for (const s of [-1, 1]) m.add(lathe([[0, -5.6], [1.05, -2.6], [1.3, 0]], 5, { col: P.ghost, capT: 1 }), chain(T(1.4, s * 5.0, 17.4), RZ(s * 0.25), RY(-1.15 + 0.25 * Math.sin(ph + s))));
    const hole = (u, v, rx, ry, n) => { const p = []; for (let k = 0; k < n; k++) { const a = (k / n) * TAU; p.push([u + Math.cos(a) * rx, v + Math.sin(a) * ry]); } return p; };
    for (const p of [hole(-2.3, 21.3, 1.25, 1.75, 6), hole(2.3, 21.3, 1.25, 1.75, 6), hole(0, 16.8, 1.6, 2.4, 8)]) { feature(m, p, 6.1, 6.6, 18.2, P.hole, { off: 0.3 }); feature(m, p, 6.1, 6.6, 18.2, P.holeDeep, { scale: 0.55, bias: -1.0, off: 0.35 }); }
    return m;
  }
  function mTree(h, crown, seed) { // prop: trunk + icosphere lobes; crown tone by face normal [mid, shadow, sunlit] -> one lit volume
    const m = new Mesh(), R0 = rng(seed), R = h * 0.3, cc = (nx, ny, nz, r) => mulc(crown[nz > 0.42 ? 2 : nz < -0.12 ? 1 : 0], 1 + (r.next() - 0.5) * 0.06);
    m.add(lathe([[2.0, 0], [1.6, h * 0.35], [1.15, h * 0.62]], 6, { col: P.trunk, capT: 1, twist: 0.3 }));
    m.add(ico(1, { r: R, sz: 0.92, jitter: 0.1, seed, col: cc }), T(0, 0, h * 0.68));
    for (let i = 0; i < 2; i++) { const a = R0.range(0, TAU); m.add(ico(1, { r: R * R0.range(0.55, 0.7), jitter: 0.12, seed: seed + 10 + i, col: cc }), T(Math.cos(a) * R * 0.75, Math.sin(a) * R * 0.75, h * 0.6 + R0.range(-2, 4))); }
    return m;
  }
  function mPine(h, seed) { // prop: 4 stacked jittered cones in rotating greens
    const m = new Mesh(), R = rng(seed), cols = [P.pineDk, P.pine, P.pineLt];
    m.add(lathe([[1.9, 0], [1.5, h * 0.3]], 6, { col: P.trunk, capT: 1 }));
    for (let t = 0; t < 4; t++) { const zb = h * (0.16 + t * 0.19), r = h * (0.27 - t * 0.052), zt = zb + h * (0.34 - t * 0.02);
      m.add(lathe([[r * 0.55, zb + r * 0.12], [r, zb], [0, zt]], 7, { col: (i) => (i === 0 ? mulc(P.pineDk, 0.85) : cols[(t + 1) % 3]), jitter: r * 0.07, twist: R.next(), seed: seed + t, capB: 1 }), RZ(R.range(0, TAU))); }
    return m;
  }
  function mGem(r, h, col) { // collectible: 8-face octahedron, alternate faces x1.06 / x0.92
    const m = new Mesh(), top = m.vert(0, 0, h * 2), bot = m.vert(0, 0, 0), mid = [];
    for (let k = 0; k < 4; k++) mid.push(m.vert(Math.cos((k / 4) * TAU) * r, Math.sin((k / 4) * TAU) * r, h * 1.05));
    for (let k = 0; k < 4; k++) { m.tri(mid[k], mid[(k + 1) % 4], top, k & 1 ? mulc(col, 1.06) : col); m.tri(mid[(k + 1) % 4], mid[k], bot, k & 1 ? mulc(col, 0.92) : mulc(col, 0.98)); }
    return m.orient((x, y, z) => [x, y, z - h]);
  }
  const mTuft = (seed, c1, c2) => { const m = new Mesh(), R = rng(seed); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + R.range(-0.4, 0.4); m.add(leaf(4.6 * R.range(0.7, 1.15), 1.25, c1, c2, 0.6), chain(T(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0), RZ(a), RY(-1.15 - R.range(0, 0.3)))); } return m; };
  /* ---------------- ground: jittered triangle lattice lit from a tiny height field ---------------- */
  const CS = 24, RH = CS * 0.8660254;
  const BIO = [{ cols: ['grass', 'grass2', 'grass3', 'grass4'], h: 0, rough: 1.2 }, { cols: ['forest', 'forest2', 'forest3', 'forest4'], h: 0.9, rough: 1.5 }, { cols: ['sand', 'sand2', 'sand3', 'sand4'], h: -1.6, rough: 0.7 }];
  function paintGround(g, vw, s, biome, sprites) {
    g.setTransform(s, 0, 0, s, 0, 0); g.lineJoin = 'round'; g.lineWidth = 1 / s;
    const i0 = -2, i1 = Math.ceil(vw / CS) + 2, j0 = -2, j1 = Math.ceil(360 / RH) + 2, NI = i1 - i0 + 1, V = [];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = (i + (j & 1) * 0.5 + (hash2(i, j, 17) - 0.5) * 0.52) * CS, y = (j + (hash2(i, j, 23) - 0.5) * 0.46) * RH, b = biome(x, y), B = BIO[b];
      V.push({ x, y, b, h: B.h + B.rough * ((hash2(i, j, 29) - 0.5) * 1.3 + (vnoise(x / 75, y / 75, 57) - 0.5) * 3.2) + (vnoise(x / 280, y / 280, 55) - 0.5) * 12 });
    }
    const facet = (A, Bv, C, hid) => {
      const b = A.b === Bv.b || A.b === C.b ? A.b : Bv.b === C.b ? Bv.b : Math.max(A.b, Bv.b, C.b), r1 = hash2(hid, 0, 71), r3 = hash2(hid, 1, 71);
      let col = P[BIO[b].cols[Math.floor(r1 * 4) % 4]];
      if (!(A.b === Bv.b && Bv.b === C.b) && r3 < 0.4) col = mix(col, P[BIO[[A.b, Bv.b, C.b].find((q) => q !== b)].cols[0]], 0.5); // mixed border facets
      const mt = fbm((A.x + Bv.x + C.x) / 1560, (A.y + Bv.y + C.y) / 1560, 66) - 0.5; // macro tint
      col = [col[0] * (1 + mt * 0.12 + 0.012), col[1] * (1 + mt * 0.1), col[2] * (1 + mt * 0.05 - 0.01)];
      const e1 = [Bv.x - A.x, Bv.y - A.y, Bv.h - A.h], e2 = [C.x - A.x, C.y - A.y, C.h - A.h];
      let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; if (n[2] < 0) n = n.map((q) => -q);
      const l = Math.hypot(n[0], n[1], n[2]); // facet normal from the height field -> same shadeRGB as the models
      g.fillStyle = g.strokeStyle = rgbs(shadeRGB(col, n[0] / l, n[1] / l, n[2] / l, 0));
      g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(Bv.x, Bv.y); g.lineTo(C.x, C.y); g.closePath(); g.fill(); g.stroke();
    };
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      const k = (j - j0) * NI + (i - i0), a = V[k], b = V[k + 1], c = V[k + NI], d = V[k + NI + 1], hid = (j * 7919 + i) * 2;
      if ((j & 1) === 0) { facet(a, b, c, hid); facet(b, d, c, hid + 1); } else { facet(a, d, c, hid); facet(a, b, d, hid + 1); }
    }
    for (let cy = 0; cy < 360 / 11; cy++) for (let cx = 0; cx < vw / 11; cx++) { // decals on an 11-unit jittered grid
      const x = (cx + hash2(cx, cy, 1)) * 11, y = (cy + hash2(cx, cy, 2)) * 11, r = hash2(cx, cy, 3), b = biome(x, y);
      if (b === 0 && r < 0.05) { const d = sprites.tuft; blit(g, d.frames[0], d.ax, d.ay, x, y, d.K); }
    }
    for (const p of sprites.props) for (let k = 0; p.c !== undefined && k < 14; k++) { // leaf litter under each crown, in that crown's own colours
      const a = hash2(k, p.c, 4) * TAU, rr = Math.sqrt(hash2(k, p.y | 0, 5)), x = p.x + 4 + Math.cos(a) * rr * 24, y = p.y + 2 + Math.sin(a) * rr * 13;
      const r = hash2(k, 7, p.x | 0) * TAU, sz = 1.5 + hash2(k, 8, 5) * 1.1, c = CROWNS[p.c][k % 3], ca = Math.cos(r), sa = Math.sin(r);
      for (const sgn of [1, -1]) { g.fillStyle = rgbs(shadeRGB(c, sgn > 0 ? -0.2 : 0.35, 0.1, 0.95, 0)); g.beginPath(); g.moveTo(x - ca * sz, y - sa * sz); g.lineTo(x - sgn * sa * sz * 0.55, y + sgn * ca * sz * 0.55); g.lineTo(x + ca * sz, y + sa * sz); g.fill(); }
    }
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.62; // prop shadows are baked into the ground
    for (const p of sprites.props) blit(g, p.sh.c, p.sh.ax, p.sh.ay, p.x, p.y, s);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0);
  }
  /* ---------------- caches + public drawers ---------------- */
  let C = null;
  function cache(K) {
    if (C && C.K === K) return C; C = { K, sets: {} };
    const walk = []; for (let i = 0; i < 8; i++) walk.push(mHero(walkPose((i / 8) * TAU))); // 8 baked rig poses per stride
    C.hero = spriteSet(walk, 0.45, K); C.heroSh = makeShadow(walk[0], 0.45, K, { ao: 6.2, aoA: 0.9, dirA: 0.55, blur: 1.4 });
    C.enemySh = makeShadow(mEnemy(0), Math.PI / 2, K, { ao: 6.6, aoA: 0.9, dirA: 0.5, blur: 1.4 });
    C.ghost = spriteSet([0, 1, 2, 3].map((i) => mGhost((i / 4) * TAU)), Math.PI * 0.75, K, 0.3);
    C.ghostSh = makeShadow(mGhost(0), Math.PI / 2, K, { ao: 5.2, aoA: 0.7, dirA: 0, blur: 1.6 });
    C.tuft = spriteSet([mTuft(60, hex('#a4c27a'), hex('#87a865'))], 0, K);
    C.glow = radial(10 * K, [[0, 'rgba(255,225,140,0.9)'], [0.4, 'rgba(255,170,70,0.35)'], [1, 'rgba(255,150,50,0)']]);
    C.dot = radial(4 * K, [[0, 'rgba(44,50,99,0.9)'], [0.6, 'rgba(44,50,99,0.5)'], [1, 'rgba(44,50,99,0)']]);
    C.gemM = mGem(2.1, 2.3, P.mint); C.halo = radial(2.1 * 3.2 * K, [[0, 'rgba(160,240,210,0.55)'], [0.45, 'rgba(79,227,176,0.2)'], [1, 'rgba(79,227,176,0)']]);
    return C;
  }
  const yawIdx = (yaw) => ((Math.round((yaw / TAU) * 16) % 16) + 16) % 16; // 16 baked yaw angles
  function enemySet(yi) { return C.sets[yi] || (C.sets[yi] = spriteSet([0, 1, 2, 3].map((i) => mEnemy((i / 4) * TAU)), (yi / 16) * TAU, C.K)); }
  const FLASH = new WeakMap();
  function flashOf(img) { let c = FLASH.get(img); if (c) return c; // white silhouette of a baked sprite for impact flashes (cached)
    c = canvas(img.width, img.height); const x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); FLASH.set(img, c); return c; }
  /** Draws the main character with feet at (x, y) (world units, ctx already scaled). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) {
    const set = C.hero, fi = Math.floor(t * 0.8 * 8) % 8, lift = 0; blit(ctx, C.heroSh.c, C.heroSh.ax, C.heroSh.ay, x, y, set.K); // bob is baked into the poses
    ctx.save(); if (facing < 0) { ctx.translate(2 * x, 0); ctx.scale(-1, 1); }
    blit(ctx, set.frames[fi], set.ax, set.ay, x, y - lift, set.K);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.22 + 0.06 * Math.sin(t * 9); ctx.drawImage(C.glow, x + 6 - 9, y - lift - 21 * CP + 3 - 9, 18, 18); ctx.restore(); } // warm face glow
  /** Draws a small creature with feet at (x, y), walking along yaw. flash 0..1 = impact flash. */
  function drawEnemy(ctx, x, y, t, yaw = Math.PI / 2, flash = 0) {
    const set = enemySet(yawIdx(yaw)), fi = Math.floor(t * 0.55 * 4) % 4, lift = Math.abs(Math.sin(t * 0.55 * TAU)) * 1.4;
    ctx.globalAlpha = 0.5; blit(ctx, C.enemySh.c, C.enemySh.ax, C.enemySh.ay, x, y, set.K); ctx.globalAlpha = 1; blit(ctx, set.frames[fi], set.ax, set.ay, x, y - lift, set.K);
    if (flash > 0.04) { ctx.globalAlpha = Math.min(1, flash * 1.1); blit(ctx, flashOf(set.frames[fi]), set.ax, set.ay, x, y - lift, set.K); ctx.globalAlpha = 1; }
  }
  function drawGhost(ctx, x, y, t, seed) {
    const s = C.ghost, fi = Math.floor((t * 1.4 + seed * 5) * 4) % 4, lift = 2.5 + Math.sin(t * 2.6 + seed * 20) * 1.6;
    ctx.globalAlpha = 0.3; blit(ctx, C.ghostSh.c, C.ghostSh.ax, C.ghostSh.ay, x, y, s.K); ctx.globalAlpha = 0.8; blit(ctx, s.frames[fi], s.ax, s.ay, x, y - lift, s.K); ctx.globalAlpha = 1; }
  function drawGem(ctx, x, y, t, seed) {
    const K = C.K, z = 2.2 + Math.sin(t * 3 + seed * 10) * 0.8;
    ctx.globalAlpha = 0.32; ctx.drawImage(C.dot, x - 2.3 + 0.6, y - 1, 4.6, 2); ctx.globalAlpha = 1; ctx.save(); ctx.translate(x, y - z); ctx.scale(1 / K, 1 / K);
    ctx.drawImage(C.halo, -C.halo.width / 2, -2.3 * CP * K - C.halo.height / 2);
    drawMesh(ctx, C.gemM, { yaw: (Math.floor((t * 1.5 + seed * 7) * 8) % 8 / 8) * (TAU / 4), K, ax: 0, ay: 0, lift: 0.18, lw: 0.5 }); ctx.restore(); }
  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, props, main character, creatures, effects. */
  function draw(ctx, w, h, t) {
    const s = h / 360, K = Math.max(1, Math.round(s * 4) / 4), vw = w / s;
    cache(K);
    if (!C.ground || C.gw !== w || C.gh !== h) {
      const biome = (x, y) => (x + (fbm(x / 90, y / 90, 9) - 0.5) * 70 > vw * 0.72 ? 1 : (x - 60) ** 2 / 1.6 + (y - 300) ** 2 < 4200 + (fbm(x / 40, y / 40, 4) - 0.5) * 3000 ? 2 : 0);
      const props = [[vw * 0.12, 120, 'tree', 2], [vw * 0.2, 150, 'tree', 0], [vw * 0.8, 95, 'tree', 1], [vw * 0.9, 210, 'tree', 0], [vw * 0.76, 300, 'pine'], [vw * 0.96, 330, 'tree', 2], [vw * 0.86, 360, 'pine']];
      C.props = props.map(([x, y, kind, c], i) => {
        const m = kind === 'tree' ? mTree(54 + i * 3, CROWNS[c], 20 + i * 7) : mPine(64 + i, 3 + i), yaw = i * 0.9, sp = spriteSet([m], yaw, K);
        return { x, y, c: kind === 'tree' ? c : undefined, img: sp.frames[0], ax: sp.ax, ay: sp.ay, sh: makeShadow(m, yaw, s, { ao: 6, aoA: 0.9, dirA: 0.62, blur: 1.8, col: PALETTE.propShadow }) };
      });
      C.ground = canvas(w, h); C.gw = w; C.gh = h;
      paintGround(C.ground.getContext('2d'), vw, s, biome, { tuft: C.tuft, props: C.props });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(C.ground, 0, 0); ctx.setTransform(s, 0, 0, s, 0, 0);
    const hx = vw * 0.5, hy = 205, list = [];
    for (const p of C.props) list.push({ y: p.y, f: () => blit(ctx, p.img, p.ax, p.ay, p.x, p.y, K) });
    list.push({ y: hy, f: () => drawHero(ctx, hx, hy, t, 1) });
    [[hx + 70, 175, 0.9], [hx - 95, 235, 0], [hx + 110, 270, 0], [hx - 40, 120, 0], [hx + 150, 140, 0], [hx - 160, 300, 0]].forEach(([ex, ey, fl], i) => {
      const yaw = Math.atan2(hy - ey, hx - ex), x = ex + Math.cos(yaw) * ((t * 6) % 12), y = ey + Math.sin(yaw) * ((t * 6) % 12);
      list.push({ y, f: () => drawEnemy(ctx, x, y, t + i * 0.37, yaw, fl * (0.5 + 0.5 * Math.sin(t * 20))) });
    });
    [[hx - 120, 165, 1], [hx + 60, 300, 2]].forEach(([x, y, sd]) => list.push({ y, f: () => drawGhost(ctx, x, y, t, sd) }));
    list.sort((a, b) => a.y - b.y);
    [[hx + 40, 230], [hx + 52, 238], [hx - 60, 190], [hx + 95, 205], [hx - 20, 280]].forEach(([x, y], i) => drawGem(ctx, x, y, t, i * 0.31));
    for (const o of list) o.f();
    // seed projectile with tapered trail + ground dot, faceted impact shards (brightness from rotation) and a floating number
    const px = hx + 18 + ((t * 120) % 34), py = 195, tl = 14;
    ctx.globalAlpha = 0.22; ctx.drawImage(C.dot, px - 2.6, py + 6, 5.2, 2.2);
    ctx.globalAlpha = 0.45; ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.moveTo(px - tl, py); ctx.lineTo(px, py + 1.7); ctx.lineTo(px, py - 1.7); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = PALETTE.seed; ctx.beginPath(); ctx.ellipse(px, py, 3.4, 1.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = PALETTE.seedRim; ctx.beginPath(); ctx.ellipse(px + 0.4, py + 0.6, 2.6, 0.8, 0, 0, TAU); ctx.fill();
    const shard = [P.lilac, P.lilacDk, P.cream, P.leaf];
    for (let i = 0; i < 9; i++) {
      const a = hash2(i, 0, 5) * TAU, k = ((t * 1.6 + hash2(i, 1, 5)) % 1), d = 6 + k * 18, r = t * 6 + i, sz = 2.2 * (1 - k * 0.5);
      const x = hx + 70 + Math.cos(a) * d, y = 162 + Math.sin(a) * d * 0.7 - 10 * Math.sin(k * Math.PI), bi = Math.abs(Math.cos(r * 1.1)) * 0.45;
      ctx.globalAlpha = 1 - k; ctx.fillStyle = rgbs(mulc(shard[i % 4], 0.6 + bi + 0.1));
      ctx.beginPath(); ctx.moveTo(x + Math.cos(r) * sz, y + Math.sin(r) * sz * 0.8); ctx.lineTo(x + Math.cos(r + 2.2) * sz, y + Math.sin(r + 2.2) * sz * 0.8); ctx.lineTo(x + Math.cos(r + 4) * sz * 0.75, y + Math.sin(r + 4) * sz * 0.6); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.font = '800 9px "Baloo 2", "Nunito", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 2; ctx.strokeStyle = '#8a3a1c'; ctx.strokeText('34!', hx + 72, 140 - (t * 8) % 6); ctx.fillStyle = '#ffcf48'; ctx.fillText('34!', hx + 72, 140 - (t * 8) % 6);
    ctx.setTransform(1, 0, 0, 1, 0, 0); tiltShift(ctx, w, h);
  }
  /** Tilt-shift: top 20% / bottom 17% bands are re-drawn from an 8x downscaled copy, fading towards the centre; soft side vignette. */
  function tiltShift(ctx, W, H) {
    if (!C.ov || C.ov.W !== W || C.ov.H !== H) {
      const mk = (hh) => canvas(Math.max(8, Math.round(W / 8)), Math.max(4, Math.round(hh / 8)));
      C.ov = { W, H, hb: Math.round(H * 0.2), hbb: Math.round(H * 0.17), sw: Math.round(W * 0.09) }; C.ov.top = mk(C.ov.hb); C.ov.bot = mk(C.ov.hbb);
    }
    const o = C.ov; for (const [b, y0, hh, top] of [[o.top, 0, o.hb, true], [o.bot, H - o.hbb, o.hbb, false]]) {
      const bx = b.getContext('2d'), bw = b.width, bh = b.height, g = bx.createLinearGradient(0, 0, 0, bh);
      bx.globalCompositeOperation = 'copy'; bx.drawImage(ctx.canvas, 0, y0, W, hh, 0, 0, bw, bh); bx.globalCompositeOperation = 'source-over';
      if (top) { g.addColorStop(0, 'rgba(232,238,250,0.34)'); g.addColorStop(1, 'rgba(236,240,250,0)'); } else { g.addColorStop(0, 'rgba(70,62,110,0)'); g.addColorStop(1, 'rgba(70,62,110,0.26)'); }
      bx.fillStyle = g; bx.fillRect(0, 0, bw, bh);
      for (let i = 0; i < 7; i++) { const e = top ? (i + 0.5) / 7 : 1 - (i + 0.5) / 7; ctx.globalAlpha = Math.pow(1 - e, 1.6); ctx.drawImage(b, 0, (i / 7) * bh, bw, bh / 7, 0, y0 + (i / 7) * hh, W, hh / 7 + 0.5); }
    }
    ctx.globalAlpha = 1;
    for (const side of [0, 1]) { const g = ctx.createLinearGradient(side ? W : 0, 0, side ? W - o.sw : o.sw, 0); g.addColorStop(0, 'rgba(60,55,100,0.22)'); g.addColorStop(1, 'rgba(60,55,100,0)'); ctx.fillStyle = g; ctx.fillRect(side ? W - o.sw : 0, 0, o.sw, H); }
  }
  const Starter = { id: 'lowpoly', name: 'Low-Poly Diorama', palette: PALETTE, fonts: ['Baloo 2:wght@600;700;800', 'Nunito:wght@600;700;800;900'], drawHero, drawEnemy, draw, Mesh, lathe, box, ico, leaf, feature, carved, drawMesh, spriteSet, makeShadow, shadeRGB };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['lowpoly'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
