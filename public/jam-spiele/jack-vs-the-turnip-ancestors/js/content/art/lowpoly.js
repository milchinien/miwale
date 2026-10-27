/* Native art for the new enemies / upgrades in the 'lowpoly' world (Low-Poly-Diorama) – see js/content/ART_API.md.
   Same tiny software-3D pipeline as js/styles/lowpoly.js (meshes -> yaw -> 3/4 ortho projection -> flat shading with
   one sun + sky/ground ambient -> painter's sort), copied here because the style's closure is not reachable.
   Meshes are built in init(); the yaw/frame sprites are rendered lazily on first use (keeps init fast). */
(function () {
  'use strict';
  const U = window.U, C = window.Content;
  if (!U || !C) return;
  const TAU = Math.PI * 2;
  const hex = U.hex, clamp = U.clamp;

  /* ================================ palette (from the style) ================================ */
  const P = {
    pumpkin: hex('#f48a2c'), pumpkinDk: hex('#e27526'), stem: hex('#7a8a3e'),
    carve: hex('#6e2e10'), glow: hex('#ffc43a'), glowHot: hex('#fff1a6'),
    lilac: hex('#a77ccf'), lilacDk: hex('#8661b4'), cream: hex('#f3e5bb'), creamDk: hex('#e2cf9a'), root: hex('#dcc495'),
    leaf: hex('#80b25c'), leafDk: hex('#5f9248'), olive: hex('#7c8e47'), oliveDk: hex('#617638'),
    crack: hex('#ffa63a'), core: hex('#ffe58c'), scarf: hex('#d65d42'),
    wood: hex('#ad7a50'), woodDk: hex('#8a5e3d'), woodLt: hex('#cfa475'),
    mint: hex('#4fe3b0'), sky: hex('#5cbdf6'), seed: hex('#f8ebc6'), seedRim: hex('#dfc58c'), white: hex('#ffffff'),
  };
  // new accents
  const SPx = { plum: hex('#8f66b2'), plumDk: hex('#74519a'), green: hex('#93b25e'), greenDk: hex('#76944a'), belly: hex('#e4e8b6'), bellyDk: hex('#cdd294'),
    lip: hex('#64b83c'), lipDk: hex('#4c9a30'), tox: hex('#8cf23e'), toxHot: hex('#e2ff96'), hole: hex('#1d3a12') };
  const BEx = { red: hex('#c8304c'), redDk: hex('#a3223f'), top: hex('#9e2242'), orange: hex('#e2583c'), stem: hex('#c23a56'), fuse: hex('#4c3b34'), fuseLt: hex('#73594a') };
  const CHx = { cream: hex('#efd8a8'), creamDk: hex('#d6b884'), tan: hex('#c9a06a'), ring: hex('#bd965f'), horn: hex('#5e4538'), hornLt: hex('#a3846a'), hoof: hex('#6d564a') };
  const MOx = { plum: hex('#9670ba'), plumDk: hex('#7a5a9e'), cream: hex('#f1e2b8'), creamDk: hex('#dccb98'), scarf: hex('#3f9c95'), scarfDk: hex('#2f7f7c'), dot: hex('#86d6c8'), wrinkle: hex('#664887') };
  const SOx = { pink: hex('#e271b2'), pinkDk: hex('#c75697'), white: hex('#f8f0dc'), whiteDk: hex('#e7d9b8') };

  const rgbs = (c) => 'rgb(' + (clamp(c[0], 0, 255) | 0) + ',' + (clamp(c[1], 0, 255) | 0) + ',' + (clamp(c[2], 0, 255) | 0) + ')';
  const mulc = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
  const jcol = (c, rng, a = 0.05) => mulc(c, 1 + (rng.next() - 0.5) * 2 * a);

  /* ============================== tiny 3D core (copied) ============================== */
  let SP = 0, CP = 0;
  const setPitch = (deg) => { const a = (deg * Math.PI) / 180; SP = Math.sin(a); CP = Math.cos(a); };
  setPitch(44);
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
    tri(a, b, c, col, o) { this.f.push({ a, b, c, col, em: o && o.em ? 1 : 0, ds: o && o.ds ? 1 : 0, bias: (o && o.bias) || 0 }); return this; }
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
    const fo = { ds: 1, em: o.em };
    m.tri(b, l1, m1, c1, fo); m.tri(l1, l2, m1, c1, fo); m.tri(m1, l2, tp, c1, fo);
    m.tri(b, m1, r1, c2, fo); m.tri(r1, m1, r2, c2, fo); m.tri(m1, tp, r2, c2, fo);
    return m;
  }
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
  function carved(m, pts, R, Rv, cz, o = {}) {
    feature(m, pts, R, Rv, cz, o.rim || P.carve, { scale: o.rs || 1.3, bias: -0.5, off: 0.28 });
    feature(m, pts, R, Rv, cz, o.fill || P.glow, { scale: 1, bias: -0.9, off: 0.36, em: o.em });
    feature(m, pts, R, Rv, cz, o.hot || P.glowHot, { scale: o.hs || 0.5, bias: -1.2, off: 0.42, em: o.em });
  }
  function strip(m, pts, w, R, Rv, cz, col, off = 0.4, bias = -0.8) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [u0, v0] = pts[i], [u1, v1] = pts[i + 1];
      const du = u1 - u0, dv = v1 - v0, l = Math.hypot(du, dv) || 1;
      const nu = (-dv / l) * w * 0.5, nv = (du / l) * w * 0.5;
      const w0 = i === 0 ? 0.35 : 1, w1 = i === pts.length - 2 ? 0.35 : 1;
      feature(m, [[u0 - nu * w0, v0 - nv * w0], [u1 - nu * w1, v1 - nv * w1], [u1 + nu * w1, v1 + nv * w1], [u0 + nu * w0, v0 + nv * w0]], R, Rv, cz, col, { off, bias });
    }
  }
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
  let K = 3, VS = 3;
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
  function makeShadow(mesh, yaw, o = {}) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const v = mesh.v, n = v.length / 3;
    const PX = new Float32Array(n), PY = new Float32Array(n);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const kx = -LV[0] / LV[2], ky = -LV[1] / LV[2];
    for (let i = 0; i < n; i++) {
      const x = v[i * 3], y = v[i * 3 + 1], z = Math.max(0, v[i * 3 + 2]);
      const X = x * cs - y * sn + z * kx, Y = x * sn + y * cs + z * ky;
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
    B.ctx.save();
    B.ctx.translate(ax, ay);
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
  function extrude(pts, d, bevel, col, o = {}) {
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
    const fopt = { em: o.em };
    const tri = triangulate(ip);
    const from = m.f.length;
    for (const [a, b, c] of tri) m.tri(inn[a], inn[b], inn[c], col, fopt);
    m.orient(() => [0, 1, 0], from);
    let f2 = m.f.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      m.tri(fo[i], fo[j], inn[j], col, fopt); m.tri(fo[i], inn[j], inn[i], col, fopt);
    }
    m.orient((x, y, z) => [x - cx, 1.2, z - cz], f2);
    f2 = m.f.length;
    const side = o.side || mulc(col, 0.9);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      m.tri(fo[i], bo[i], bo[j], side, fopt); m.tri(fo[i], bo[j], fo[j], side, fopt);
    }
    m.orient((x, y, z) => [x - cx, 0, z - cz], f2);
    return m;
  }
  function torus(R, r, segs, col, rs = 6) {
    const prof = [];
    for (let k = 0; k <= rs; k++) { const a = -Math.PI / 2 + (k / rs) * TAU; prof.push([R + Math.cos(a) * r, Math.sin(a) * r]); }
    return lathe(prof, segs, { col });
  }
  /** Tapered tube along a 3D polyline (horns, vines, fuses). */
  function tube(pts, r0, r1, segs, colFn, o = {}) {
    const m = new Mesh();
    const n = pts.length - 1;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[i + 1];
      const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2];
      const L = Math.hypot(dx, dy, dz);
      const a = Math.atan2(dy, dx), b = Math.atan2(Math.hypot(dx, dy), dz);
      const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n);
      m.add(lathe([[ra, -0.12 * L], [rb, L * 1.06]], segs, { col: colFn(i), capB: i === 0 ? 1 : 0, capT: i === n - 1 ? 1 : 0, em: o.em }), chain(T(p[0], p[1], p[2]), RZ(a), RY(b)));
    }
    return m;
  }
  function pumpkinHead(m, hz, R, Rv, segs, o = {}) {
    const prof = sphereProf(R, Rv, hz, [-90, -62, -34, -8, 18, 44, 66]);
    prof.push([R * 0.2, hz + Rv * 0.97]);
    prof.push([0, hz + Rv * 0.84]);
    const c1 = o.c1 || P.pumpkin, c2 = o.c2 || P.pumpkinDk;
    m.add(lathe(prof, segs, { ribs: o.ribs || 0.88, col: (i, j) => (i <= 0 ? mulc(c2, 0.96) : j & 1 ? c2 : c1), twist: 0 }));
    m.add(lathe([[R * 0.17, 0], [R * 0.13, R * 0.32], [R * 0.16, R * 0.42]], 5, { col: P.stem, capB: 1, capT: 1, twist: 0.5 }), chain(T(0.2, 0, hz + Rv * 0.78), RY(-0.32)));
  }
  function mGem(r, h, col, o = {}) {
    const m = new Mesh();
    const top = m.vert(0, 0, h * 2), bot = m.vert(0, 0, 0);
    const mid = [];
    for (let k = 0; k < 4; k++) mid.push(m.vert(Math.cos((k / 4) * TAU) * r, Math.sin((k / 4) * TAU) * r, h * 1.05));
    const fo = { em: o.em };
    for (let k = 0; k < 4; k++) {
      const a = mid[k], b = mid[(k + 1) % 4];
      m.tri(a, b, top, k & 1 ? mulc(col, 1.06) : col, fo);
      m.tri(b, a, bot, k & 1 ? mulc(col, 0.92) : mulc(col, 0.98), fo);
    }
    return m.orient((x, y, z) => [x, y, z - h]);
  }
  function mSeed() {
    const m = lathe([[0, -3.6], [1.0, -2.7], [1.7, -1.0], [1.75, 0.6], [1.3, 2.3], [0.6, 3.3], [0, 3.6]], 8, {
      col: (i, j) => (j === 0 || j === 3 || j === 4 || j === 7 ? P.seedRim : P.seed), a0: Math.PI / 8,
    });
    return new Mesh().add(m, chain(SC(1, 1, 0.42), RY(Math.PI / 2)));
  }

  /* ================================= enemy models ================================= */
  const eyeSet = (m, eye, R, Rv, cz, rim, fill, hot, o = {}) => {
    for (const e of [eye, eye.map(([u, v]) => [-u, v]).reverse()]) {
      feature(m, e, R, Rv, cz, rim, { scale: o.rs || 1.35, bias: -0.5, off: 0.3 });
      feature(m, e, R, Rv, cz, fill, { bias: -0.9, off: 0.38 });
      if (hot) feature(m, e, R, Rv, cz, hot, { scale: o.hs || 0.42, bias: -1.2, off: 0.44 });
    }
  };
  const mirror = (pts) => pts.map(([u, v]) => [-u, v]).reverse();

  /* --- Rüben-Spucker: mottled plum/green turnip with a puckered snout tube --- */
  function mSpitter(ph, walk, swell, recoil) {
    const m = new Mesh();
    const sw = Math.sin(ph) * walk;
    for (const s of [-1, 1]) {
      const a = sw * 0.6 * s;
      const leg = lathe([[0.7, 0], [1.0, 1.6], [1.5, 6.4]], 5, { col: P.root, capB: 1, capT: 1 });
      leg.add(ico(0, { r: 1.1, sx: 1.5, sz: 0.7, col: P.creamDk }), T(0.6, 0, 0.4));
      m.add(leg, chain(T(0.2, s * 3.4, 6.4 + Math.max(0, sw * s) * 1.2), RY(a), RX(s * 0.18), T(0, 0, -6.4)));
    }
    const body = new Mesh();
    const k = 1 + 0.16 * swell + 0.07 * recoil, kz = 1 - 0.03 * swell - 0.12 * recoil;
    const prof = [[0, 2.4], [3.0, 3.0], [6.1, 4.6], [8.2, 7.2], [8.7, 10.0], [7.7, 12.8], [5.3, 15.0], [2.0, 16.3], [0, 16.5]].map(([r, z]) => [r * k, 2.4 + (z - 2.4) * kz]);
    const rng = U.rng(37);
    const mott = (dk) => (rng.next() < 0.24 ? jcol(dk ? SPx.greenDk : SPx.green, rng, 0.05) : jcol(dk ? SPx.plumDk : SPx.plum, rng, 0.04));
    body.add(lathe(prof, 9, {
      jitter: 0.32, twist: 0.2, seed: 13,
      col: (i, j, h) => {
        if (i <= 0) return SPx.bellyDk;
        if (i <= 2) return jcol(SPx.belly, rng, 0.03);
        if (i === 3) return h ? mott() : SPx.belly;
        if (i >= 6) return mott(true);
        return mott();
      },
    }));
    body.add(lathe([[0, -3.0], [0.75, 0]], 4, { col: P.root }), chain(T(-1.2, 0, 3.1), RY(0.6)));
    // spiky leaf tuft (3 upright blades + one curled)
    for (let i = 0; i < 3; i++) {
      const az = (i / 3) * TAU + 2.2;
      body.add(leaf(9.4, 2.6, { c1: P.leaf, c2: P.leafDk, fold: 0.5, bend: -0.5 }), chain(T(0, 0, 2.4 + 13.6 * kz), RZ(az), RY(-1.25 + 0.12 * Math.sin(ph + i * 2))));
    }
    body.add(leaf(6.6, 2.4, { c1: P.olive, c2: P.oliveDk, fold: 0.5, bend: -1.2 }), chain(T(0, 0, 2.4 + 13.8 * kz), RZ(0.5), RY(-0.7)));
    const R = 8.7 * k, Rv = 7.2 * kz, cz = 2.4 + 7.4 * kz;
    // snout tube (built along z, turned to +x), puckered lips
    const sn = new Mesh();
    const len = 1 - 0.25 * recoil + 0.08 * swell;
    sn.add(lathe([[2.9, -1.6], [2.5, 1.2 * len], [2.4, 2.7 * len], [3.5, 3.7 * len], [3.6, 4.5 * len], [2.6, 5.3 * len]], 8, {
      ribs: 0.84, seed: 5, col: (i, j) => (i <= 1 ? (j & 1 ? SPx.plumDk : SPx.plum) : i === 2 ? SPx.lipDk : j & 1 ? SPx.lipDk : SPx.lip),
    }));
    const hot = swell > 0.05;
    const holeCol = hot ? U.mix(SPx.tox, SPx.toxHot, Math.min(1, swell)) : SPx.hole;
    sn.add(lathe([[2.6, 5.3 * len], [1.4, 5.0 * len], [0, 4.7 * len]], 8, { ribs: 0.84, col: (i) => (i === 0 ? SPx.lipDk : holeCol), em: 1, ds: 1, bias: -0.4 }));
    if (hot) sn.add(lathe([[1.1, 4.9 * len], [0, 5.2 * len]], 6, { col: SPx.toxHot, em: 1, ds: 1, bias: -0.8 }));
    body.add(sn, chain(T(R - 1.4, 0, cz - 0.2), RY(Math.PI / 2)));
    // drool drop hanging from the lip
    if (!recoil) {
      body.add(lathe([[0, 0], [0.55, -0.9], [0.8, -2.0], [0.5, -2.8], [0, -3.0]], 5, { col: SPx.tox, em: 1 }), T(R - 1.4 + 4.9 * len, 0.6, cz - 2.6));
    }
    // swelling cheek sacks
    const cr = 1.7 + 1.9 * swell;
    for (const s of [-1, 1]) body.add(ico(0, { r: cr, sx: 0.9, col: (nx, ny, nz, g) => jcol(swell > 0.4 ? U.mix(SPx.green, SPx.tox, 0.35) : SPx.green, g, 0.05), seed: 3 }), T(R * 0.62, s * (3.3 + swell * 0.9) * k, cz - 0.6));
    // angry yellow-green eyes + brows above the snout
    eyeSet(body, [[-3.9, cz + 3.9], [-1.3, cz + 2.9], [-1.5, cz + 1.9], [-3.6, cz + 2.4]], R, Rv, cz, hex('#2f4a1e'), hex('#d6f25a'), hex('#fbffd0'));
    const brow = [[-4.6, cz + 4.5], [-0.8, cz + 3.3], [-0.9, cz + 4.2], [-4.4, cz + 5.6]];
    for (const b of [brow, mirror(brow)]) feature(body, b, R, Rv, cz, hex('#4f3870'), { bias: -1.0, off: 0.5 });
    m.add(body, chain(T(0, 0, 2.6), RX(sw * 0.1), RY(0.06)));
    return m;
  }

  /* --- Zündrübe: round beetroot bomb, burning fuse out of the leaf tuft --- */
  function mBomber(ph) {
    const m = new Mesh();
    const sw = Math.sin(ph);
    for (const fx of [-1, 1]) for (const s of [-1, 1]) {
      const a = sw * 0.75 * s * fx;
      const leg = lathe([[0.55, 0], [0.75, 1.2], [1.05, 4.2]], 4, { col: P.root, capB: 1, capT: 1 });
      leg.add(ico(0, { r: 0.8, sx: 1.4, sz: 0.6, col: P.creamDk }), T(0.4, 0, 0.3));
      m.add(leg, chain(T(fx * 2.3, s * 2.9, 4.2 + Math.max(0, sw * s * fx) * 1.1), RY(a), RX(s * 0.2), T(0, 0, -4.2)));
    }
    const body = new Mesh();
    const cz = 8.0, R = 6.3, Rv = 6.0;
    body.add(ico(1, {
      r: R, sz: Rv / R, jitter: 0.05, seed: 8,
      col: (nx, ny, nz, g) => (nz > 0.62 ? jcol(BEx.top, g, 0.04) : nz < -0.5 ? jcol(BEx.redDk, g, 0.04) : g.next() < 0.18 ? jcol(BEx.orange, g, 0.05) : jcol(BEx.red, g, 0.05)),
    }), T(0, 0, cz));
    body.add(lathe([[0, -3.2], [1.1, 0]], 5, { col: BEx.redDk }), T(0, 0, cz - Rv + 0.9));
    // red stems + dark leaves
    for (let i = 0; i < 3; i++) {
      const az = (i / 3) * TAU + 0.9;
      const st = new Mesh();
      st.add(lathe([[0.42, 0], [0.32, 3.2]], 4, { col: BEx.stem, capT: 1 }));
      st.add(leaf(5.4, 2.6, { c1: P.leafDk, c2: hex('#4d7d3c'), fold: 0.45, bend: -0.8 }), chain(T(0, 0, 3.0), RY(-0.9)));
      body.add(st, chain(T(0, 0, cz + Rv - 0.6), RZ(az), RY(0.5 + 0.08 * Math.sin(ph + i))));
    }
    // fuse cord
    const fp = [[-0.4, 0, cz + Rv - 0.6], [-1.3, 0, cz + Rv + 1.6], [-1.2, 0, cz + Rv + 3.6], [-0.1, 0, cz + Rv + 5.0], [1.2, 0, cz + Rv + 5.6]];
    body.add(tube(fp, 0.55, 0.42, 4, (i) => (i & 1 ? BEx.fuseLt : BEx.fuse)));
    // mean little eyes, heavy brows, jagged grin
    const eye = [[-3.0, cz + 1.9], [-0.9, cz + 1.0], [-1.1, cz - 0.1], [-2.9, cz + 0.5]];
    eyeSet(body, eye, R, Rv, cz, hex('#4a1020'), hex('#ffd43c'), hex('#fff6c0'));
    const brow = [[-3.8, cz + 2.4], [-0.5, cz + 1.4], [-0.6, cz + 2.3], [-3.6, cz + 3.6]];
    for (const b of [brow, mirror(brow)]) feature(body, b, R, Rv, cz, hex('#5a1430'), { bias: -1.0, off: 0.5 });
    feature(body, [[-2.6, cz - 1.7], [-1.3, cz - 1.2], [0, cz - 1.7], [1.3, cz - 1.2], [2.6, cz - 1.7], [1.6, cz - 2.9], [0, cz - 2.5], [-1.6, cz - 2.9]], R, Rv, cz, hex('#3a0c18'), { bias: -0.8, off: 0.32 });
    m.add(body, chain(T(0, 0, 0.6), RX(sw * 0.08)));
    return m;
  }
  const BOMB_TIP = [1.6, 0, 8.0 + 6.0 + 5.8 + 0.6];

  /* --- Wurzel-Bock: stocky parsnip ram with curled horns --- */
  function hornPath(s) {
    const pts = [];
    const r0 = 4.1, cx = 0.5 - r0 * Math.cos(1.1), cz = 3.4 - r0 * Math.sin(1.1);
    for (let i = 0; i <= 13; i++) {
      const t = i / 13, rho = r0 * (1 - 0.6 * t), ph = 1.1 + t * 1.9 * Math.PI;
      pts.push([cx + Math.cos(ph) * rho, s * (2.3 + 3.6 * Math.min(1, t * 2.5) + 0.8 * t), cz + Math.sin(ph) * rho]);
    }
    return pts;
  }
  function mChargerHead(eyes) {
    const h = new Mesh();
    const rng = U.rng(4);
    h.add(ico(1, { r: 4.1, sx: 1.18, sz: 0.95, jitter: 0.06, seed: 12, col: (nx, ny, nz, g) => (nx > 0.55 && nz < 0.2 ? jcol(CHx.creamDk, g, 0.04) : jcol(CHx.cream, rng, 0.04)) }));
    h.add(ico(0, { r: 2.5, sx: 1.1, sz: 0.85, col: (nx, ny, nz, g) => jcol(CHx.tan, g, 0.05) }), T(3.6, 0, -1.4));
    const R = 4.8, Rv = 3.9, cz = 0;
    if (eyes === 'red') eyeSet(h, [[-2.4, 1.6], [-0.7, 0.8], [-0.9, -0.1], [-2.3, 0.5]], R, Rv, cz, hex('#3a1010'), hex('#ff3b2a'), hex('#ffd0a0'), { rs: 1.4, hs: 0.5 });
    else if (eyes === 'dizzy') {
      const ring = (u) => { const p = []; for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; p.push([u + Math.cos(a) * 0.95, 0.8 + Math.sin(a) * 1.05]); } return p; };
      for (const u of [-1.6, 1.6]) { feature(h, ring(u), R, Rv, cz, hex('#4a3428'), { scale: 1.35, bias: -0.5, off: 0.3 }); feature(h, ring(u), R, Rv, cz, hex('#fff3d0'), { bias: -0.9, off: 0.38 }); feature(h, ring(u + 0.3), R, Rv, cz, hex('#4a3428'), { scale: 0.42, bias: -1.2, off: 0.44 }); }
    } else eyeSet(h, [[-2.4, 1.6], [-0.7, 0.8], [-0.9, -0.1], [-2.3, 0.5]], R, Rv, cz, hex('#4a3428'), hex('#ffd43c'), hex('#fff6c0'));
    const brow = [[-2.9, 2.3], [-0.4, 1.3], [-0.5, 2.0], [-2.8, 3.2]];
    for (const b of [brow, mirror(brow)]) feature(h, b, R, Rv, cz, hex('#7a5a3c'), { bias: -1.0, off: 0.5 });
    for (const s of [-1, 1]) {
      h.add(tube(hornPath(s), 1.6, 0.35, 5, (i) => (i & 1 ? CHx.hornLt : CHx.horn)), chain(RZ(s * 0.5), SC(1.12)));
      h.add(leaf(2.6, 1.6, { c1: CHx.creamDk, c2: CHx.tan, fold: 0.3 }), chain(T(-1.6, s * 3.6, 0.8), RZ(s * 2.2), RY(0.3)));
    }
    return h;
  }
  /** pose: 'trot' | 'rear' | 'dash' | 'dizzy' */
  function mCharger(ph, pose) {
    const m = new Mesh();
    const sw = Math.sin(ph);
    const legA = (fx, s) => {
      if (pose === 'trot') return sw * 0.55 * fx * s;
      if (pose === 'rear') return fx > 0 ? (s > 0 ? -0.9 - 0.35 * sw : 0.15) : 0.25;
      if (pose === 'dash') return fx > 0 ? -0.95 : 0.9;
      return 0.12 * fx;
    };
    for (const fx of [-1, 1]) for (const s of [-1, 1]) {
      const leg = lathe([[1.1, 0], [1.35, 1.0], [1.55, 3.0], [2.1, 7.0]], 5, { col: (i) => (i === 0 ? CHx.hoof : CHx.tan), capB: 1, capT: 1, jitter: 0.12, seed: 3 + fx + s });
      const lift = pose === 'trot' ? Math.max(0, sw * fx * s) * 1.4 : 0;
      m.add(leg, chain(T(fx * 5.0, s * 3.5, 7.0 + lift), RY(legA(fx, s)), RX(s * 0.08), T(0, 0, -7.0)));
    }
    const up = new Mesh();
    // body: parsnip lying along x (thick shoulders in front, root tail behind)
    const rng = U.rng(19);
    const prof = [[0, -12.5], [1.0, -10.4], [2.9, -7.6], [5.0, -4.4], [6.5, -1.0], [7.0, 1.8], [6.3, 4.6], [4.0, 6.6], [0, 7.2]];
    up.add(lathe(prof, 9, { jitter: 0.3, twist: 0.25, seed: 23, col: (i, j, h) => (i <= 1 ? CHx.tan : i === 3 || i === 5 ? (h ? CHx.ring : CHx.creamDk) : jcol(CHx.cream, rng, 0.04)) }), chain(T(-0.6, 0, 10.2), RY(Math.PI / 2)));
    up.add(tube([[-12.5, 0, 10.2], [-14.6, 0, 9.0], [-15.6, 0, 10.6], [-16.8, 0, 9.6]], 0.55, 0.2, 3, () => CHx.tan));
    // leafy mane over the shoulders
    for (let k = 0; k < 4; k++) {
      const az = Math.PI + (k - 1.5) * 0.42;
      up.add(leaf(10.5 - Math.abs(k - 1.5) * 1.6, 3.2, { c1: k & 1 ? P.leafDk : P.leaf, c2: k & 1 ? mulc(P.leafDk, 0.85) : P.leafDk, fold: 0.45, bend: -1.6 }), chain(T(3.0, (k - 1.5) * 1.2, 16.6), RZ(az), RY(-0.75 + 0.1 * Math.sin(ph + k))));
    }
    const head = mChargerHead(pose === 'rear' ? 'red' : pose === 'dizzy' ? 'dizzy' : 'normal');
    const hp = pose === 'dash' ? chain(T(9.8, 0, 8.6), RY(0.4)) : pose === 'dizzy' ? chain(T(9.4, 0, 9.0), RX(0.35), RY(0.25)) : chain(T(9.2, 0, 9.4), RY(0.28));
    up.add(head, hp);
    let M;
    if (pose === 'rear') M = chain(T(-5, 0, 4.5), RY(-0.34 - 0.04 * sw), T(5, 0, -4.5));
    else if (pose === 'dash') M = chain(T(0, 0, 9), RY(0.16), SC(1.12, 1, 0.92), T(0, 0, -9.5));
    else if (pose === 'dizzy') M = chain(T(0, 0, 6), RX(0.12), T(0, 0, -6));
    else M = chain(T(0, 0, Math.abs(Math.cos(ph)) * 0.6), RY(0.03 * sw));
    m.add(up, M);
    return new Mesh().add(m, SC(1.05));
  }

  /* --- Rüben-Ahnin: the matriarch, polka headscarf with a crown of babies --- */
  function mBaby(o = {}) {
    const m = new Mesh();
    m.add(lathe([[0, -1.6], [0.5, 0], [1.6, 0.6], [2.3, 2.0], [2.0, 3.5], [1.0, 4.3], [0, 4.5]], 6, { col: (i, j, h) => (i <= 2 ? SOx.white : i === 3 && !h ? SOx.white : i >= 5 ? SOx.pinkDk : SOx.pink), twist: 0.2 }));
    m.add(leaf(4.2, 2.0, { c1: P.leaf, c2: P.leafDk, fold: 0.5, bend: -0.6 }), chain(T(0, 0, 4.3), RZ(o.az || 0), RY(-1.2)));
    feature(m, [[-1.25, 2.5], [-0.45, 2.1], [-0.5, 1.6], [-1.2, 1.8]], 2.3, 2.2, 2.0, hex('#3d2552'), { bias: -0.9, off: 0.3 });
    feature(m, mirror([[-1.25, 2.5], [-0.45, 2.1], [-0.5, 1.6], [-1.2, 1.8]]), 2.3, 2.2, 2.0, hex('#3d2552'), { bias: -0.9, off: 0.3 });
    return m;
  }
  function mMother(ph) {
    const m = new Mesh();
    const sw = Math.sin(ph);
    for (const s of [-1, 1]) {
      const a = sw * 0.42 * s;
      const leg = lathe([[1.5, 0], [1.9, 1.8], [2.5, 6.4]], 6, { col: P.root, capB: 1, capT: 1 });
      leg.add(ico(0, { r: 1.7, sx: 1.5, sz: 0.65, col: P.creamDk }), T(0.9, 0, 0.5));
      m.add(leg, chain(T(0.2, s * 5.2, 6.4 + Math.max(0, sw * s) * 1.4), RY(a), RX(s * 0.12), T(0, 0, -6.4)));
    }
    const body = new Mesh();
    const rng = U.rng(61);
    const prof = [[0, 2.0], [4.0, 2.6], [8.2, 4.8], [10.9, 8.6], [11.7, 13.2], [11.3, 18.0], [9.8, 22.4], [7.0, 25.8], [3.4, 27.9], [0, 28.4]];
    body.add(lathe(prof, 11, {
      jitter: 0.42, twist: 0.18, seed: 17,
      col: (i, j, h) => {
        if (i <= 0) return MOx.creamDk;
        if (i <= 2) return (j + h) % 3 === 0 ? MOx.creamDk : jcol(MOx.cream, rng, 0.03);
        if (i === 3) return h ? jcol(MOx.plum, rng, 0.04) : MOx.cream;
        if (i >= 6) return MOx.plumDk;
        return (j + h) % 4 === 0 ? MOx.plumDk : jcol(MOx.plum, rng, 0.04);
      },
    }));
    body.add(lathe([[0, -3.4], [1.1, 0]], 5, { col: P.root }), chain(T(-2, 0, 2.8), RY(0.5)));
    // headscarf: polka cap over the crown + darker hem, knot with two flaps at the front-left
    body.add(lathe([[10.6, 22.4], [10.3, 23.8], [8.0, 26.7], [4.3, 28.9], [0, 29.6]], 11, {
      seed: 9, jitter: 0.1,
      col: (i, j, h) => (i === 0 ? MOx.scarfDk : (i + j * 2 + h) % 5 === 0 ? MOx.dot : j & 1 ? MOx.scarf : U.mix(MOx.scarf, MOx.scarfDk, 0.3)),
    }));
    const knot = new Mesh();
    knot.add(ico(0, { r: 1.5, col: MOx.scarfDk }));
    knot.add(leaf(5.0, 2.8, { c1: MOx.scarf, c2: MOx.scarfDk, fold: 0.3, bend: 0.4 }), chain(RZ(0.5), RY(1.25)));
    knot.add(leaf(4.2, 2.4, { c1: MOx.scarf, c2: MOx.scarfDk, fold: 0.3, bend: 0.4 }), chain(RZ(-0.5), RY(1.05)));
    body.add(knot, chain(RZ(-1.05), T(10.5, 0, 22.4)));
    // crown of baby sprouts + her own old leaves
    const babies = [[0.15, 4.0, 2.6, 1.2], [2.25, 4.2, 0.6, 1.05], [4.25, 4.0, 1.6, 1.1]];
    for (const [az, rr, la, sc] of babies) {
      const bob = 0.4 * Math.sin(ph * 2 + az * 3);
      // stand upright on the scarf, face turned outwards
      body.add(mBaby({ az: la }), chain(T(Math.cos(az) * rr, Math.sin(az) * rr, 27.4 + bob), RZ(az), RY(0.22), SC(sc)));
    }
    for (let k = 0; k < 3; k++) body.add(leaf(9, 3.2, { c1: P.olive, c2: P.oliveDk, fold: 0.45, bend: -2.2 }), chain(T(0, 0, 28.6), RZ((k / 3) * TAU + 2.6), RY(-0.85 + 0.08 * Math.sin(ph + k))));
    // stern old face: amber eyes under heavy lids, wrinkles, little nose, frown
    const R = 11.7, Rv = 12.5, cz = 14.6;
    const eye = [[-5.4, 20.6], [-1.5, 19.7], [-1.8, 18.1], [-5.1, 18.7]];
    eyeSet(body, eye, R, Rv, cz, hex('#3e2450'), hex('#ffc43a'), hex('#fff1a6'));
    const lid = [[-6.1, 21.7], [-1.0, 20.6], [-1.1, 19.6], [-5.9, 20.3]];
    for (const l of [lid, mirror(lid)]) feature(body, l, R, Rv, cz, hex('#6a4a8c'), { bias: -1.3, off: 0.52 });
    for (const sgn of [-1, 1]) {
      strip(body, [[sgn * 6.0, 17.2], [sgn * 4.6, 16.1], [sgn * 2.8, 16.5]], 0.45, R, Rv, cz, MOx.wrinkle, 0.42);
      strip(body, [[sgn * 7.4, 19.6], [sgn * 7.0, 18.0]], 0.4, R, Rv, cz, MOx.wrinkle, 0.42);
      strip(body, [[sgn * 7.4, 12.2], [sgn * 5.8, 11.0]], 0.4, R, Rv, cz, MOx.wrinkle, 0.42);
    }
    body.add(ico(0, { r: 1.9, sx: 1.2, sz: 0.9, col: hex('#b48fd0') }), T(11.2, 0, 17.0));
    feature(body, [[-3.0, 14.2], [0, 15.0], [3.0, 14.2], [2.8, 13.4], [0, 14.1], [-2.8, 13.4]], R, Rv, cz, hex('#3d2552'), { bias: -0.8, off: 0.32 });
    strip(body, [[-6.4, 6.4], [-3.0, 5.6], [1.0, 6.0], [4.6, 5.4], [6.8, 6.2]], 0.45, R, Rv, cz, MOx.creamDk, 0.4);
    // a baby clinging to her side
    body.add(mBaby({ az: -0.4 }), chain(T(1.2, -11.0, 7.6), RZ(-1.25), RX(-0.5), SC(0.95)));
    m.add(body, chain(T(0, 0, 3.4), RX(sw * 0.05), RY(0.04)));
    return m;
  }

  /* --- Rübchen: tiny angry baby turnip --- */
  function mSprout(ph) {
    const m = new Mesh();
    const sw = Math.sin(ph);
    for (const s of [-1, 1]) {
      const a = sw * 0.8 * s;
      const leg = lathe([[0.45, 0], [0.6, 1.0], [0.85, 3.4]], 4, { col: P.root, capB: 1, capT: 1 });
      leg.add(ico(0, { r: 0.7, sx: 1.5, sz: 0.6, col: P.creamDk }), T(0.35, 0, 0.25));
      m.add(leg, chain(T(0, s * 1.9, 3.4 + Math.max(0, sw * s) * 1.0), RY(a), T(0, 0, -3.4)));
    }
    const body = new Mesh();
    const prof = [[0, 1.0], [2.2, 1.4], [4.0, 2.8], [4.9, 4.8], [4.8, 6.8], [3.8, 8.4], [2.0, 9.4], [0, 9.6]];
    body.add(lathe(prof, 8, { jitter: 0.15, twist: 0.2, seed: 29, col: (i, j, h) => (i <= 0 ? SOx.whiteDk : i <= 3 ? SOx.white : i === 4 ? (h ? SOx.pink : SOx.white) : i >= 6 ? SOx.pinkDk : SOx.pink) }));
    body.add(lathe([[0, -2.0], [0.5, 0]], 4, { col: P.root }), T(-0.6, 0, 1.4));
    body.add(leaf(7.6, 3.8, { c1: P.leaf, c2: P.leafDk, fold: 0.5, bend: -1.4 }), chain(T(0, 0, 9.3), RZ(Math.PI + 0.5), RY(-1.05 + 0.15 * Math.sin(ph * 2))));
    body.add(leaf(3.6, 1.8, { c1: P.leaf, c2: P.leafDk, fold: 0.5, bend: -0.4 }), chain(T(0, 0, 9.4), RZ(0.6), RY(-1.25)));
    const R = 4.9, Rv = 4.3, cz = 5.2;
    const eyeP = (u) => { const p = []; for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; p.push([u + Math.cos(a) * 1.15, 5.9 + Math.sin(a) * 1.25]); } return p; };
    for (const u of [-1.55, 1.55]) {
      feature(body, eyeP(u), R, Rv, cz, hex('#3d2552'), { scale: 1.3, bias: -0.5, off: 0.3 });
      feature(body, eyeP(u), R, Rv, cz, hex('#ffd43c'), { bias: -0.9, off: 0.38 });
      feature(body, eyeP(u * 1.08), R, Rv, cz, hex('#3d2552'), { scale: 0.42, bias: -1.2, off: 0.44 });
    }
    const brow = [[-2.8, 7.6], [-0.4, 6.9], [-0.5, 7.7], [-2.6, 8.7]];
    for (const b of [brow, mirror(brow)]) feature(body, b, R, Rv, cz, hex('#7a2e66'), { bias: -1.3, off: 0.52 });
    feature(body, [[-1.1, 3.6], [0, 4.1], [1.1, 3.6], [0.9, 3.1], [0, 3.5], [-0.9, 3.1]], R, Rv, cz, hex('#3d2552'), { bias: -0.8, off: 0.32 });
    m.add(body, chain(T(0, 0, 1.4), RX(sw * 0.12)));
    return m;
  }

  /* ================================ sprite types (lazy yaw frames) ================================ */
  const NYAW = 16;
  const TYPES = {};
  const FX = {};
  function makeType(meshes, o = {}) {
    const { R, z0, z1 } = measure(meshes);
    const pad = 2;
    const w = Math.ceil(2 * R * K) + pad * 2;
    const top = Math.ceil((z1 * CP + R * SP) * K) + pad;
    const bot = Math.ceil((R * SP - z0 * CP) * K) + pad;
    return { meshes, w, h: top + bot, ax: Math.round(w / 2), ay: top, nf: meshes.length, spr: [], fl: [], red: [], lift: o.lift, shOpt: o.sh, sh: null };
  }
  function spr(Ty, yi, fi) {
    const k = yi * Ty.nf + fi;
    let c = Ty.spr[k];
    if (!c) {
      const cv = U.canvas(Ty.w, Ty.h);
      drawMesh(cv.ctx, Ty.meshes[fi], { yaw: (yi / NYAW) * TAU, K, ax: Ty.ax, ay: Ty.ay, lift: Ty.lift });
      c = Ty.spr[k] = cv.c;
    }
    return c;
  }
  const flashOf = (Ty, yi, fi) => { const k = yi * Ty.nf + fi; return Ty.fl[k] || (Ty.fl[k] = U.tint(spr(Ty, yi, fi), '#ffffff')); };
  const redOf = (Ty, yi, fi) => { const k = yi * Ty.nf + fi; return Ty.red[k] || (Ty.red[k] = U.tint(spr(Ty, yi, fi), '#ff2a18')); };

  const yawState = new WeakMap();
  function yawOf(o, tx, ty, rate) {
    let s = yawState.get(o);
    if (!s) { s = { y: Math.PI / 2 }; yawState.set(o, s); }
    if (tx * tx + ty * ty > 9) s.y = U.angleLerp(s.y, Math.atan2(ty, tx), rate);
    return s.y;
  }
  const yawIdx = (yaw) => { let i = Math.round((yaw / TAU) * NYAW) % NYAW; if (i < 0) i += NYAW; return i; };

  function spawnFx(ctx, e, t) {
    const r = e.r * 1.15;
    const a = 1 - t;
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = '#6b5550';
    ctx.beginPath(); ctx.ellipse(e.x, e.y, r * (0.75 + 0.25 * t), r * 0.4, 0, 0, TAU); ctx.fill();
    const rr = r * (0.8 + 1.2 * U.ease.outQuad(t));
    ctx.globalAlpha = a * 0.8;
    ctx.strokeStyle = '#f6ecd6';
    ctx.lineWidth = 1.8 * a + 0.4;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, rr, rr * 0.48, 0, 0, TAU); ctx.stroke();
    const pf = FX.puff;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * TAU + e.seed * 6;
      const px = e.x + Math.cos(ang) * rr, py = e.y + Math.sin(ang) * rr * 0.48 - t * 5;
      const s = (0.55 + (i % 2) * 0.25) * (1 - t * 0.5) * (e.r > 12 ? 1.4 : 1);
      ctx.globalAlpha = a;
      ctx.drawImage(pf.c, px - (pf.cx / K) * s, py - (pf.cy / K) * s, (pf.c.width / K) * s, (pf.c.height / K) * s);
    }
    ctx.globalAlpha = 1;
  }

  /** Common body draw: death squash, spawn rise, hit flash (capped). Returns the placement or null. */
  function drawBody(ctx, e, Ty, fi, yaw, o = {}) {
    const yi = yawIdx(yaw);
    const img = spr(Ty, yi, fi);
    const lift = o.lift || 0;
    if (e.dying) {
      const t = e.deathT / 0.22;
      if (t >= 1) return null;
      const sx = 1 + t * 0.3, sy = 1 - t * 0.55, w = (Ty.w / K) * sx, h = (Ty.h / K) * sy;
      const x = e.x - (Ty.ax / K) * sx, y = e.y - lift - (Ty.ay / K) * sy;
      ctx.globalAlpha = 1 - t;
      ctx.drawImage(img, x, y, w, h);
      ctx.globalAlpha = (1 - t) * 0.55;
      ctx.drawImage(flashOf(Ty, yi, fi), x, y, w, h);
      ctx.globalAlpha = 1;
      return null;
    }
    if (e.spawnT < 1) {
      const t = e.spawnT;
      spawnFx(ctx, e, t);
      const vis = Math.floor(Ty.ay * U.ease.outQuad(t));
      if (vis > 1) {
        ctx.globalAlpha = Math.min(1, t * 2.5);
        const px = Math.round(e.x * VS - (Ty.ax * VS) / K) / VS;
        ctx.drawImage(img, 0, 0, Ty.w, vis, px, e.y - vis / K, Ty.w / K, vis / K);
      }
      ctx.globalAlpha = 1;
      return null;
    }
    const sx = o.sx || 1, sy = o.sy || 1;
    const w = (Ty.w / K) * sx, h = (Ty.h / K) * sy;
    let x = e.x + (o.ox || 0) - (Ty.ax / K) * sx, y = e.y - lift - (Ty.ay / K) * sy;
    if (sx === 1 && sy === 1) { x = Math.round(x * VS) / VS; y = Math.round(y * VS) / VS; }
    const pl = { x, y, w, h, yi, fi };
    if (o.under) o.under(pl);
    ctx.drawImage(img, x, y, w, h);
    if (o.over) o.over(pl);
    if (e.flash > 0.04) {
      ctx.globalAlpha = Math.min(0.6, e.flash * 0.9);
      ctx.drawImage(flashOf(Ty, yi, fi), x, y, w, h);
    }
    ctx.globalAlpha = 1;
    return pl;
  }
  /** Screen point of a mesh point (mx forward, mz up) on an enemy facing yaw. */
  const meshPt = (e, yaw, mx, mz, lift = 0, my = 0) => [e.x + Math.cos(yaw) * mx - Math.sin(yaw) * my, e.y - lift - mz * CP + (Math.sin(yaw) * mx + Math.cos(yaw) * my) * SP];
  function glow(ctx, img, x, y, r, a) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a;
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  function star4(ctx, x, y, s, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.32, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.32, y);
    ctx.moveTo(x - s, y); ctx.lineTo(x, y - s * 0.32); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 0.32);
    ctx.fill();
  }
  function shardTri(ctx, x, y, s, r, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(r) * s, y + Math.sin(r) * s * 0.8);
    ctx.lineTo(x + Math.cos(r + 2.2) * s * 0.85, y + Math.sin(r + 2.2) * s * 0.7);
    ctx.lineTo(x + Math.cos(r + 4.0) * s * 0.75, y + Math.sin(r + 4.0) * s * 0.6);
    ctx.fill();
  }

  /* ================================ build ================================ */
  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const h = (window.__forceH || window.innerHeight || 900) * dpr;
    K = clamp(Math.round((h / 360) * 4) / 4, 2, 4);
    VS = K;
    const ph = (i, n) => (i / n) * TAU;
    // spitter: 0-3 walk, 4-6 aim swell, 7 spit recoil
    const sp = [];
    for (let i = 0; i < 4; i++) sp.push(mSpitter(ph(i, 4), 1, 0, 0));
    sp.push(mSpitter(0, 0, 0.35, 0), mSpitter(0, 0, 0.7, 0), mSpitter(0, 0, 1, 0), mSpitter(0, 0, 0, 1));
    TYPES.spitter = makeType(sp, { sh: { ao: 6.6, aoA: 0.9, dirA: 0.5, blur: 1.4 } });
    const bo = [];
    for (let i = 0; i < 4; i++) bo.push(mBomber(ph(i, 4)));
    TYPES.bomber = makeType(bo, { sh: { ao: 6.2, aoA: 0.9, dirA: 0.5, blur: 1.4 } });
    // charger: 0-3 trot, 4-5 rear, 6-7 dash, 8 dizzy
    const ch = [];
    for (let i = 0; i < 4; i++) ch.push(mCharger(ph(i, 4), 'trot'));
    ch.push(mCharger(Math.PI / 2, 'rear'), mCharger(-Math.PI / 2, 'rear'), mCharger(0, 'dash'), mCharger(Math.PI, 'dash'), mCharger(0, 'dizzy'));
    TYPES.charger = makeType(ch, { sh: { ao: 9, aoA: 0.9, dirA: 0.5, blur: 1.6 } });
    const mo = [];
    for (let i = 0; i < 4; i++) mo.push(mMother(ph(i, 4)));
    TYPES.mother = makeType(mo, { sh: { ao: 10, aoA: 0.9, dirA: 0.5, blur: 1.8 } });
    const so = [];
    for (let i = 0; i < 4; i++) so.push(mSprout(ph(i, 4)));
    TYPES.sprout = makeType(so, { sh: { ao: 4.4, aoA: 0.9, dirA: 0.5, blur: 1.2 } });
    // fx
    {
      const m = ico(1, { r: 3, jitter: 0.14, seed: 5, col: hex('#d8c09a') });
      const t = makeType([m], { lift: 0.25 });
      FX.puff = { c: spr(t, 4, 0), cx: t.ax, cy: t.ay - 3 * CP * K };
    }
    FX.glowGreen = radial(12 * K, [[0, 'rgba(210,255,140,0.95)'], [0.35, 'rgba(140,240,60,0.45)'], [1, 'rgba(100,220,40,0)']]);
    FX.glowRed = radial(10 * K, [[0, 'rgba(255,200,170,0.95)'], [0.35, 'rgba(255,70,40,0.5)'], [1, 'rgba(255,40,20,0)']]);
    FX.glowWarm = radial(10 * K, [[0, 'rgba(255,225,140,0.9)'], [0.4, 'rgba(255,170,70,0.35)'], [1, 'rgba(255,150,50,0)']]);
    FX.glowBirth = radial(16 * K, [[0, 'rgba(255,236,170,0.85)'], [0.4, 'rgba(240,150,200,0.35)'], [1, 'rgba(240,120,190,0)']]);
    FX.dot = radial(4 * K, [[0, 'rgba(44,50,99,0.9)'], [0.6, 'rgba(44,50,99,0.5)'], [1, 'rgba(44,50,99,0)']]);
  }

  /* ---- enemy shot: faceted glob of toxic turnip juice with a dark rim ---- */
  let SHOT = null;
  function shotSprites() {
    if (SHOT) return SHOT;
    const frames = [];
    const R = 4.4, s = Math.ceil(R * 2.6 * K) + 4, c0 = s / 2;
    for (let i = 0; i < 4; i++) {
      const m = ico(1, { r: 3.7, jitter: 0.13, seed: 11 + i, col: (nx, ny, nz, g) => (nz > 0.45 ? jcol(SPx.toxHot, g, 0.03) : nz > -0.2 ? jcol(SPx.tox, g, 0.04) : jcol(hex('#56c22c'), g, 0.05)) });
      m.add(ico(0, { r: 0.9, col: P.white, em: 1, bias: -2 }), T(-1.2, 1.4, 2.2));
      frames.push(U.sprite(s, s, (ctx) => {
        ctx.fillStyle = '#16300e';
        ctx.beginPath();
        for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU + i * 0.4, rr = (R + 0.2 + ((k * 7 + i) % 3) * 0.18) * K; ctx.lineTo(c0 + Math.cos(a) * rr, c0 + Math.sin(a) * rr * 0.95); }
        ctx.closePath(); ctx.fill();
        drawMesh(ctx, m, { yaw: (i / 4) * TAU, K, ax: c0, ay: c0, lift: 0.5, lw: 0.6, sp: 0.8, cp: 0.6 });
      }));
    }
    SHOT = { frames, s };
    return SHOT;
  }

  /* ================================ icons ================================ */
  function heartPts(sc) {
    const pts = [];
    for (let k = 0; k < 16; k++) {
      const t = (k / 16) * TAU;
      pts.push([16 * Math.sin(t) ** 3 * sc, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * sc]);
    }
    return pts;
  }
  const ICON = {};
  function iconMesh(id) {
    if (ICON[id]) return ICON[id];
    let r = null;
    switch (id) {
      case 'leech': {
        // bowl of pumpkin soup, a little heart floating above
        const m = new Mesh();
        const bowl = hex('#f2e4c8'), bowlDk = hex('#dcc9a4'), band = hex('#5c6fae');
        m.add(lathe([[0, 0], [4.8, 0.2], [7.6, 2.4], [8.8, 5.6], [9.2, 8.2], [8.6, 8.4], [8.2, 6.0]], 12, { col: (i) => (i === 3 ? band : i >= 4 ? bowl : bowlDk) }));
        const soup = new Mesh();
        const c = soup.vert(0, 0, 7.0);
        const ring = [];
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; ring.push(soup.vert(Math.cos(a) * 8.3, Math.sin(a) * 8.3, 6.9 + (k & 1) * 0.25)); }
        for (let k = 0; k < 12; k++) soup.tri(c, ring[k], ring[(k + 1) % 12], k & 1 ? hex('#f39a3c') : hex('#ea8a30'));
        m.add(soup.orient(() => [0, 0, 1]));
        const rng = U.rng(9);
        for (let i = 0; i < 5; i++) { const a = rng.range(0, TAU), rr = rng.range(1.5, 5.6); m.add(box(1.8, 1.8, 1.8, i % 2 ? P.pumpkin : P.cream), chain(T(Math.cos(a) * rr, Math.sin(a) * rr, 7.3), RZ(a), RX(0.4))); }
        m.add(ico(0, { r: 1.0, sz: 0.4, col: P.leaf }), T(-2.6, 2, 7.4));
        m.add(extrude(heartPts(0.3), 2.2, 0.9, hex('#f2625a'), { inset: 0.74 }), chain(T(2.4, 3.0, 16.0), RZ(-(Math.PI / 2 - 0.2)), RX(0.35), RY(0.2)));
        r = { m, yaw: Math.PI / 2 - 0.2, pitch: 34, extra: 'steam' };
        break;
      }
      case 'thorns': {
        // rutabaga in a spiky armoured shell: ring of thorns around it
        const m = new Mesh();
        const shell = hex('#8d63b8'), shellDk = hex('#6f4c98'), plate = hex('#f2d27a');
        m.add(lathe([[0, -0.6], [3.6, 0.2], [6.8, 2.6], [8.0, 6.0], [7.4, 9.4], [5.0, 11.6], [2.0, 12.6], [0, 12.8]], 10, {
          twist: 0.1, col: (i, j, h) => (i <= 1 ? plate : (i + j + h) % 3 === 0 ? shellDk : shell),
        }));
        const thorn = hex('#f4ebcf'), thornDk = hex('#d9c99a');
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * TAU, z = 6 + (k & 1 ? 2.4 : -0.6);
          m.add(lathe([[1.6, 0], [0, 6.4]], 4, { col: (i, j) => (j & 1 ? thornDk : thorn), capB: 1 }), chain(T(Math.cos(a) * 7.0, Math.sin(a) * 7.0, z), RZ(a), RY(Math.PI / 2 - (k & 1 ? 0.25 : -0.1))));
        }
        for (let k = 0; k < 3; k++) m.add(lathe([[1.0, 0], [0, 4.0]], 4, { col: (i, j) => (j & 1 ? thornDk : thorn), capB: 1 }), chain(T(Math.cos(k * 2.1) * 3.2, Math.sin(k * 2.1) * 3.2, 11.2), RZ(k * 2.1), RY(0.55)));
        const R = 8, Rv = 6.4, cz = 6;
        eyeSet(m, [[-3.2, 7.4], [-0.9, 6.6], [-1.1, 5.6], [-3.0, 6.0]], R, Rv, cz, hex('#3a2350'), hex('#ffd43c'), hex('#fff6c0'));
        r = { m, yaw: Math.PI / 2 - 0.3, pitch: 24, extra: 'burst' };
        break;
      }
      case 'dashup': {
        // pumpkin rolling to the right, dust puffs behind
        const m = new Mesh();
        const pk = new Mesh();
        pumpkinHead(pk, 0, 7.0, 6.0, 14, { ribs: 0.86 });
        const R = 7.0, Rv = 6.0, hz = 0;
        const eye = [[-R * 0.45, hz + Rv * 0.06], [-R * 0.12, hz + Rv * 0.06], [-R * 0.28, hz + Rv * 0.5]];
        carved(pk, eye, R, Rv, hz);
        carved(pk, mirror(eye), R, Rv, hz);
        carved(pk, [[-R * 0.52, hz - Rv * 0.2], [0, hz - Rv * 0.3], [R * 0.52, hz - Rv * 0.2], [R * 0.3, hz - Rv * 0.62], [-R * 0.3, hz - Rv * 0.62]], R, Rv, hz, { rs: 1.2 });
        m.add(pk, chain(T(3, 0, 6.2), RY(-0.55), RZ(Math.PI / 2 - 0.35)));
        const puff = hex('#f2e6cf');
        m.add(ico(1, { r: 2.4, jitter: 0.12, seed: 3, col: puff }), T(-6.8, 1.0, 1.6));
        m.add(ico(1, { r: 1.7, jitter: 0.12, seed: 4, col: puff }), T(-10.2, 2.4, 1.0));
        m.add(ico(0, { r: 1.1, col: puff }), T(-12.6, 0.6, 0.8));
        r = { m, yaw: 0.15, pitch: 24, extra: 'speed2' };
        break;
      }
      case 'range': {
        // seed flying along a long dotted arc towards a target on the ground
        const m = new Mesh();
        const red = hex('#e0503e'), wh = hex('#f6ecd6');
        m.add(lathe([[7.2, 0], [7.2, 0.8], [5.6, 0.8], [3.8, 0.8], [2.0, 0.8], [0, 0.8]], 14, { col: (i) => (i === 1 || i === 3 ? red : i === 2 || i === 4 ? wh : mulc(red, 0.8)), capB: 1 }), T(9, 0, 0));
        m.add(ico(0, { r: 0.9, sz: 0.5, col: red }), T(9, 0, 1.0));
        for (let i = 0; i < 9; i++) {
          const t = i / 9, x = -13 + t * 18, z = 2 + Math.sin(t * Math.PI * 0.92) * 15;
          m.add(ico(0, { r: 0.75 - t * 0.15, col: P.seed }), T(x, 0, z));
        }
        m.add(mSeed(), chain(T(6.6, 0, 9.8), RY(0.9), SC(2.0)));
        r = { m, yaw: 0.05, pitch: 30, extra: 'glintR' };
        break;
      }
      default: return null;
    }
    ICON[id] = r;
    return r;
  }
  function iconExtra(ctx, kind, size, pr) {
    const s = size / 96;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const star = (x, y, r, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, rr = k & 1 ? r * 0.28 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.fill();
    };
    if (kind === 'glintR') { const p = pr(7.6, 0, 9.4); star(p[0] + 10 * s, p[1] - 10 * s, 9 * s, '#ffffff'); }
    if (kind === 'burst') {
      ctx.strokeStyle = 'rgba(255,214,120,0.95)';
      ctx.lineWidth = 3.4 * s;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU + 0.2, r0 = 40 * s, r1 = 46 * s;
        ctx.beginPath(); ctx.moveTo(48 * s + Math.cos(a) * r0, 50 * s + Math.sin(a) * r0 * 0.9); ctx.lineTo(48 * s + Math.cos(a) * r1, 50 * s + Math.sin(a) * r1 * 0.9); ctx.stroke();
      }
    }
    if (kind === 'speed2') {
      ctx.strokeStyle = 'rgba(120,160,220,0.8)';
      ctx.lineWidth = 4 * s;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo((8 + i * 5) * s, (30 + i * 13) * s); ctx.lineTo((28 + i * 5) * s, (30 + i * 13) * s); ctx.stroke(); }
    }
    if (kind === 'steam') {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3.6 * s;
      for (let i = 0; i < 2; i++) {
        const x = (26 + i * 14) * s;
        ctx.beginPath(); ctx.moveTo(x, 36 * s); ctx.bezierCurveTo(x - 7 * s, 26 * s, x + 7 * s, 18 * s, x, 8 * s); ctx.stroke();
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
    ctx.save();
    ctx.translate(size / 2 + size * 0.03, ay + y1 * k - size * 0.06);
    ctx.scale(1, 0.3);
    const rr = (x1 - x0) * k * 0.45;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
    g.addColorStop(0, 'rgba(60,50,110,0.28)'); g.addColorStop(1, 'rgba(60,50,110,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.fill();
    ctx.restore();
    if (ic.glow) {
      const gg = ctx.createRadialGradient(size / 2, size * 0.55, 0, size / 2, size * 0.55, size * 0.45);
      gg.addColorStop(0, ic.glow); gg.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, size, size);
    }
    drawMesh(ctx, ic.m, { yaw: ic.yaw, K: k, ax, ay, sp, cp, lw: size < 64 ? 0.5 : 0.7 });
    const pr = (x, y, z) => { const X = x * cs - y * sn, Y = x * sn + y * cs; return [ax + X * k, ay + (Y * sp - z * cp) * k]; };
    if (ic.extra) iconExtra(ctx, ic.extra, size, pr);
  }

  /* ================================ registration ================================ */
  /** background warm-up: pre-render the yaw sprites a few per frame (most common poses first), so a crowd of a new type
      appearing does not stall a frame with dozens of mesh renders */
  let warm = null;
  function warmJobs() {
    const jobs = [];
    const order = ['spitter', 'bomber', 'sprout', 'charger', 'mother'];
    for (const pass of [0, 1]) {
      for (const id of order) {
        const Ty = TYPES[id];
        if (!Ty) continue;
        for (let fi = 0; fi < Ty.nf; fi++) {
          if ((pass === 0) !== (fi < 4)) continue; // walk frames of every type first, special poses after
          for (let yi = 0; yi < NYAW; yi++) jobs.push([Ty, yi, fi]);
        }
      }
    }
    return jobs;
  }

  C.art('lowpoly', {
    init() { build(); },
    idle() {
      if (warm === null) warm = warmJobs().reverse(); // pop() takes from the end -> walk frames first
      if (!warm.length) return;
      const t0 = performance.now();
      for (let n = 0; n < 4 && warm.length; n++) {
        const [Ty, yi, fi] = warm.pop();
        spr(Ty, yi, fi);
        if (performance.now() - t0 > 2.5) break;
      }
    },
    enemies: {
      spitter(ctx, e, view) {
        VS = view.S;
        const Ty = TYPES.spitter;
        const p = view.game && view.game.player;
        const aiming = e.mode === 'aim';
        const yaw = aiming && p ? yawOf(e, p.x - e.x, p.y - e.y, 0.35) : yawOf(e, e.vx, e.vy, 0.16);
        let fi, lift = 0, ox = 0;
        const spit = e.spit || 0, ch = e.charge || 0;
        if (aiming) { fi = 4 + Math.min(2, Math.floor(ch * 3)); ox = Math.sin(view.rt * 70 + e.seed * 9) * 0.45 * ch; }
        else if (spit > 0.3) fi = 7;
        else { fi = Math.floor(e.anim * 0.55 * 4) % 4; lift = Math.abs(Math.sin(e.anim * 0.55 * TAU)) * 1.3; }
        const pl = drawBody(ctx, e, Ty, fi, yaw, { lift, ox });
        if (!pl) return;
        const k = 1 + 0.16 * (aiming ? ch : 0);
        const fwd = Math.sin(yaw);
        const [mx, my] = meshPt(e, yaw, (8.7 * k + 3.3) , 12.0, lift);
        if (aiming) {
          if (fwd > -0.5) glow(ctx, FX.glowGreen, mx + ox, my, 3 + 6 * ch, (0.35 + 0.55 * ch) * (0.85 + 0.15 * Math.sin(view.rt * 30)));
        }
        if (spit > 0.02) {
          const t = 1 - spit;
          glow(ctx, FX.glowGreen, mx, my, 4 + 5 * spit, spit * 0.8);
          for (let i = 0; i < 7; i++) {
            const a = yaw + (((i * 0.37 + e.seed) % 1) - 0.5) * 1.1;
            const d = 3 + t * (10 + (i % 3) * 5);
            const x = mx + Math.cos(a) * d, y = my + Math.sin(a) * d * SP - (i % 2) * 2 + t * t * 6;
            ctx.globalAlpha = Math.min(1, spit * 1.6);
            shardTri(ctx, x, y, 1.8 * (0.6 + spit * 0.6), i * 1.7 + t * 4, '#1d3a12');
            shardTri(ctx, x, y, 1.25 * (0.6 + spit * 0.6), i * 1.7 + t * 4, i & 1 ? '#c8ff6e' : '#8cf23e');
          }
          ctx.globalAlpha = 1;
        }
      },
      bomber(ctx, e, view) {
        VS = view.S;
        const Ty = TYPES.bomber;
        const yaw = yawOf(e, e.vx, e.vy, 0.2);
        const fi = Math.floor(e.anim * 0.8 * 4) % 4;
        const lift = Math.abs(Math.sin(e.anim * 0.8 * TAU)) * 0.9;
        const fuse = e.armed ? e.fuse || 0 : 0;
        const sc = e.armed ? 1 + 0.13 * fuse + 0.04 * Math.sin(view.rt * 40) * fuse : 1;
        const freq = 5 + fuse * fuse * 26;
        const ph = Math.sin(view.rt * freq + e.seed * 20);
        const pl = drawBody(ctx, e, Ty, fi, yaw, {
          lift, sx: sc, sy: sc,
          over: e.armed ? (q) => {
            ctx.globalAlpha = 0.25 + 0.5 * Math.abs(ph);
            ctx.drawImage(ph > 0 ? redOf(Ty, q.yi, q.fi) : flashOf(Ty, q.yi, q.fi), q.x, q.y, q.w, q.h);
            ctx.globalAlpha = 1;
          } : null,
        });
        if (!pl) return;
        // fuse spark (mesh tip, scaled with the body)
        const [tx, ty] = meshPt(e, yaw, BOMB_TIP[0] * sc, BOMB_TIP[2] * sc, lift);
        const fl = 0.75 + 0.25 * Math.sin(view.rt * 37 + e.seed * 7);
        const r = (e.armed ? 4 + 5 * fuse : 3) * fl;
        glow(ctx, FX.glowWarm, tx, ty, r * 1.6, e.armed ? 0.9 : 0.6);
        star4(ctx, tx, ty, r * 0.7, '#fff3c0');
        star4(ctx, tx, ty, r * 0.35, '#ffffff');
        if (e.armed) {
          for (let i = 0; i < 3; i++) {
            const a = view.rt * 9 + i * 2.1 + e.seed * 5, d = 2 + ((view.rt * 3 + i * 0.33) % 1) * (3 + 4 * fuse);
            ctx.globalAlpha = 0.9;
            star4(ctx, tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.7 - d * 0.4, 0.9 + fuse, i & 1 ? '#ffd27a' : '#ff8a3a');
          }
          ctx.globalAlpha = 1;
        }
      },
      charger(ctx, e, view) {
        VS = view.S;
        const Ty = TYPES.charger;
        const mode = e.mode;
        let yaw, fi, lift = 0, ox = 0;
        if (mode === 'tele' || mode === 'dash') yaw = yawOf(e, (e.dashX || 1) * 10, (e.dashY || 0) * 10, 0.45);
        else yaw = yawOf(e, e.vx, e.vy, 0.14);
        if (mode === 'tele') { fi = 4 + (Math.floor(view.rt * 9) & 1); ox = Math.sin(view.rt * 80 + e.seed * 7) * 0.6 * Math.min(1, (e.modeT || 0) / 0.3); }
        else if (mode === 'dash') fi = 6 + (Math.floor(view.rt * 14) & 1);
        else if (mode === 'rest') { fi = 8; ox = Math.sin(view.rt * 5 + e.seed * 6) * 1.2; }
        else { fi = Math.floor(e.anim * 0.5 * 4) % 4; lift = Math.abs(Math.sin(e.anim * 0.5 * TAU)) * 1.2; }
        const pl = drawBody(ctx, e, Ty, fi, yaw, {
          lift, ox,
          under: mode === 'dash' ? (q) => {
            const fl = flashOf(Ty, q.yi, q.fi);
            const dx = e.dashX || 0, dy = e.dashY || 0;
            for (let i = 3; i >= 1; i--) {
              ctx.globalAlpha = 0.13 * (4 - i);
              ctx.drawImage(fl, q.x - dx * i * 7, q.y - dy * i * 7, q.w, q.h);
            }
            ctx.globalAlpha = 1;
          } : null,
        });
        if (!pl) return;
        if (mode === 'tele') {
          const k = Math.min(1, (e.modeT || 0) / 0.72);
          if (Math.sin(yaw) > -0.4) {
            const [hx, hy] = meshPt(e, yaw, 13.5, 15.5, lift);
            glow(ctx, FX.glowRed, hx + ox, hy, 5 + 4 * k, 0.55 + 0.4 * k);
          }
          // scraped dust kicked up under the front hooves
          for (let i = 0; i < 3; i++) {
            const t = (view.rt * 2.2 + i / 3 + e.seed) % 1;
            const [fx, fy] = meshPt(e, yaw, 6 - t * 9, 0, 0, (i - 1) * 3);
            ctx.globalAlpha = (1 - t) * 0.8;
            ctx.drawImage(FX.puff.c, fx - 2, fy - 3 - t * 5, 4 + t * 3, (4 + t * 3) * (FX.puff.c.height / FX.puff.c.width));
          }
          ctx.globalAlpha = 1;
        } else if (mode === 'rest') {
          const [hx, hy] = meshPt(e, yaw, 10.5, 22, 0);
          for (let i = 0; i < 3; i++) {
            const a = view.rt * 6 + (i / 3) * TAU;
            const x = hx + ox + Math.cos(a) * 7, y = hy + Math.sin(a) * 2.6;
            ctx.globalAlpha = 0.95;
            star4(ctx, x, y, 2.6, '#7a5a20');
            star4(ctx, x, y, 2.0, i === 1 ? '#ffffff' : '#ffe27a');
          }
          ctx.globalAlpha = 1;
        }
      },
      mother(ctx, e, view) {
        VS = view.S;
        const Ty = TYPES.mother;
        const yaw = yawOf(e, e.vx, e.vy, 0.06);
        const fi = Math.floor(e.anim * 0.4 * 4) % 4;
        const lift = Math.abs(Math.sin(e.anim * 0.4 * TAU)) * 0.8;
        const b = e.birth || 0;
        let sx = 1, sy = 1;
        if (b > 0.01) {
          const t = 1 - b;
          const w = Math.sin(t * Math.PI * 3) * b;
          sy = 1 - 0.16 * w; sx = 1 + 0.12 * w;
        }
        const pl = drawBody(ctx, e, Ty, fi, yaw, { lift, sx, sy });
        if (!pl) return;
        if (b > 0.01) {
          const [gx, gy] = meshPt(e, yaw, 0, 24, lift);
          glow(ctx, FX.glowBirth, gx, gy, 16 + 10 * (1 - b), b * 0.75);
          const rr = 14 + (1 - b) * 20;
          ctx.globalAlpha = b * 0.85;
          ctx.strokeStyle = '#ffe9b8';
          ctx.lineWidth = 2 * b + 0.4;
          ctx.beginPath(); ctx.ellipse(e.x, e.y, rr, rr * 0.48, 0, 0, TAU); ctx.stroke();
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * TAU + e.seed * 4;
            star4(ctx, gx + Math.cos(a) * (8 + (1 - b) * 12), gy + Math.sin(a) * (5 + (1 - b) * 6) - (1 - b) * 6, 1.8 * b + 0.4, i & 1 ? '#ffe27a' : '#ffc6e4');
          }
          ctx.globalAlpha = 1;
        }
      },
      sprout(ctx, e, view) {
        VS = view.S;
        const Ty = TYPES.sprout;
        const yaw = yawOf(e, e.vx, e.vy, 0.25);
        const fi = Math.floor(e.anim * 0.9 * 4) % 4;
        const lift = Math.abs(Math.sin(e.anim * 0.9 * TAU)) * 1.2;
        drawBody(ctx, e, Ty, fi, yaw, { lift });
      },
    },
    shadow(ctx, o, view) {
      const Ty = TYPES[o.type];
      if (!Ty) return false;
      if (!Ty.sh) Ty.sh = makeShadow(Ty.meshes[0], Math.PI / 2, Ty.shOpt || {});
      let a = 0.5;
      if (o.dying) a *= Math.max(0, 1 - o.deathT / 0.3);
      if (o.spawnT < 1) a *= o.spawnT;
      if (a <= 0.01) return true;
      VS = view.S;
      ctx.globalAlpha = a;
      blit(ctx, Ty.sh.c, Ty.sh.ax, Ty.sh.ay, o.x, o.y);
      ctx.globalAlpha = 1;
      return true;
    },
    shot(ctx, s, view) {
      const S = shotSprites();
      const x = s.x, y = s.y - (s.z || 0);
      const ca = Math.cos(s.angle || 0), sa = Math.sin(s.angle || 0);
      const wob = Math.sin((s.age || 0) * 22 + (s.seed || 0) * 10);
      glow(ctx, FX.glowGreen, x, y, 10, 0.55);
      // dripping trail
      for (let i = 2; i >= 1; i--) {
        const d = 4.5 * i + 1, r = 2.2 - i * 0.55;
        const tx = x - ca * d - sa * wob * 0.8 * i, ty = y - sa * d + ca * wob * 0.8 * i;
        ctx.globalAlpha = 0.95 - i * 0.2;
        ctx.fillStyle = '#16300e';
        ctx.beginPath(); ctx.arc(tx, ty, r + 0.6, 0, TAU); ctx.fill();
        ctx.fillStyle = i === 1 ? '#a6f550' : '#7fe03a';
        ctx.beginPath(); ctx.arc(tx, ty, r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const fi = Math.floor(((s.age || 0) * 10 + (s.seed || 0) * 4)) & 3;
      const w = S.s / K;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(s.angle || 0);
      ctx.scale(1 + 0.12 * wob, 1 - 0.1 * wob);
      ctx.rotate(-(s.angle || 0));
      ctx.drawImage(S.frames[fi], -w / 2, -w / 2, w, w);
      ctx.restore();
    },
    icons: {
      leech(ctx, size) { renderIcon(ctx, 'leech', size); },
      thorns(ctx, size) { renderIcon(ctx, 'thorns', size); },
      dashup(ctx, size) { renderIcon(ctx, 'dashup', size); },
      range(ctx, size) { renderIcon(ctx, 'range', size); },
    },
  });
})();
