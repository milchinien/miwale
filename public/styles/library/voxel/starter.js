/* Voxel Cube World — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Every character, prop and collectible is a voxel grid baked ONCE into sprites (46 deg ortho projection, 3-tone faces, sun from the upper left,
   colour jitter, neighbour AO, painter's sort). Ground = flat 4x4-unit voxel tiles with 1-voxel steps showing side faces. */
(function (root) {
  'use strict';
  const PALETTE = {
    grass: '#6da548', grassLt: '#75ad4d', stone: '#94949a', path: '#cfa86e', field: '#8e5d3a', water: '#4aa6dc',
    leafFloor: '#b47643', pumpkin: '#f7842a', carve: '#8a3412', faceGlow: '#ffd84a', cloak: '#36325f', scarf: '#22b8a2',
    turnip: '#9b54d2', cream: '#f4e9cc', leaf: '#5fbe3b', eye: '#ff4a2c', ghost: '#f6faff', ghostIce: '#b8d6f3',
    brute: '#6c3e88', bruteBrown: '#946a42', crack: '#ff9a2a', gem: '#5df0b6', gold: '#ffc43a', pine: '#2f6e4c',
    panel: '#2b2446', edge: '#151024', hudGold: '#ffc23e',
  };
  const TAU = Math.PI * 2;
  const PITCH = (46 * Math.PI) / 180, SP = Math.sin(PITCH), CP = Math.cos(PITCH); // ground depth / height factor
  const SHX = 0.62, SHY = 0.26; // sun shadow offset per unit of height (sun from the upper left)
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return { c, ctx: c.getContext('2d') }; };
  // integer hash -> deterministic randomness (never Math.random per frame)
  function hashInt(x, y, seed) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0; }
  const hash2 = (x, y, s) => hashInt(x, y, s) / 4294967296;
  const rnd3 = (x, y, z, s) => hashInt(x * 73 + z * 9301, y * 19 + z * 7, s) / 4294967296;
  // gradient noise in [0,1] + fbm (only used to lay out the ground)
  function perlin(x, y, seed) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const f = (t) => t * t * t * (t * (t * 6 - 15) + 10), u = f(fx), v = f(fy);
    const g = (ix, iy, dx, dy) => { const a = ((hashInt(ix, iy, seed) & 15) / 16) * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
    const a = g(x0, y0, fx, fy) + u * (g(x0 + 1, y0, fx - 1, fy) - g(x0, y0, fx, fy));
    const b = g(x0, y0 + 1, fx, fy - 1) + u * (g(x0 + 1, y0 + 1, fx - 1, fy - 1) - g(x0, y0 + 1, fx, fy - 1));
    return (a + v * (b - a)) * 0.707 + 0.5;
  }
  const fbm = (x, y, s) => (perlin(x, y, s) + perlin(x * 2, y * 2, s + 101) * 0.5 + perlin(x * 4, y * 4, s + 202) * 0.25) / 1.75;
  /* ---------------- voxel colours: id -> { c: rgb, em: emissive (no shading), jit: brightness jitter } ---------------- */
  const COLS = [null], colIds = new Map();
  function C(h, o) { const key = h + (o ? (o.em ? 'e' : '') + (o.jit !== undefined ? 'j' + o.jit : '') : ''); if (colIds.has(key)) return colIds.get(key);
    COLS.push({ c: hex(h), em: !!(o && o.em), jit: o && o.jit !== undefined ? o.jit : 0.045 }); colIds.set(key, COLS.length - 1); return COLS.length - 1; }
  /* ---------------- voxel grid: x = right, y = towards the viewer, z = up ---------------- */
  class Vox {
    constructor(w, d, h, seed) { this.w = w; this.d = d; this.h = h; this.seed = seed || 1; this.a = new Uint16Array(w * d * h); }
    in(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.d && z < this.h; }
    get(x, y, z) { return this.in(x, y, z) ? this.a[(z * this.d + y) * this.w + x] : 0; }
    set(x, y, z, c) { x |= 0; y |= 0; z |= 0; if (!this.in(x, y, z)) return this; const v = typeof c === 'function' ? c(x, y, z) : c; if (v != null && v >= 0) this.a[(z * this.d + y) * this.w + x] = v; return this; }
    box(x0, y0, z0, x1, y1, z1, c) { for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, z, c); return this; }
    /** super-ellipsoid: p = 2 ellipsoid, p = 3..4 rounded box */
    blob(cx, cy, cz, rx, ry, rz, c, p = 2) {
      for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
        if (Math.abs((x + 0.5 - cx) / rx) ** p + Math.abs((y + 0.5 - cy) / ry) ** p + Math.abs((z + 0.5 - cz) / rz) ** p <= 1) this.set(x, y, z, c);
      return this;
    }
    /** paint the front-most voxel of column (x, z) – used for faces, cracks, eyes */
    paintFront(x, z, c) { for (let y = this.d - 1; y >= 0; y--) if (this.get(x, y, z)) return this.set(x, y, z, c); return this; }
  }
  /* ---------------- the voxel renderer ---------------- */
  const FACES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  function prep(yaw, ppv) {
    const c = Math.cos(yaw), s = Math.sin(yaw), R = (x, y) => [x * c + y * s, -x * s + y * c];
    const proj = (x, y, z) => { const r = R(x, y); return [r[0] * ppv, (r[1] * SP - z * CP) * ppv]; };
    const ex = 1 + 0.8 / ppv; // faces are grown by 0.8 px -> no hairline seams between cubes
    const faces = [];
    for (const n of FACES) {
      const rn = R(n[0], n[1]);
      if (rn[1] * CP + n[2] * SP <= 1e-3) continue; // back face
      const a = n[0] ? 0 : n[1] ? 1 : 2, b = (a + 1) % 3, cc = (a + 2) % 3;
      const fc = proj(n[0] * 0.5, n[1] * 0.5, n[2] * 0.5), pts = [];
      for (const [u, v] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) {
        const p = [0, 0, 0]; p[a] = n[a] * 0.5; p[b] = u; p[cc] = v;
        const q = proj(p[0], p[1], p[2]);
        pts.push(fc[0] + (q[0] - fc[0]) * ex, fc[1] + (q[1] - fc[1]) * ex);
      }
      const t1 = [0, 0, 0], t2 = [0, 0, 0]; t1[b] = 1; t2[cc] = 1;
      const top = n[2] === 1; faces.push({ n, pts, top, tone: top ? 1 : 0.76 - 0.15 * rn[0], t1, t2 }); // sun from screen-left
    }
    return { R, faces };
  }
  /** Render a voxel model into a sprite { c, ax, ay } (anchor = centre of the footprint at z = 0). */
  function renderVox(m, yaw, ppv, o = {}) {
    const P = prep(yaw, ppv), items = [];
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (let z = 0; z < m.h; z++) for (let y = 0; y < m.d; y++) for (let x = 0; x < m.w; x++) {
      const id = m.get(x, y, z);
      if (!id || !P.faces.some((f) => !m.get(x + f.n[0], y + f.n[1], z + f.n[2]))) continue;
      const r = P.R(x + 0.5 - m.w / 2, y + 0.5 - m.d / 2), Z = z + 0.5;
      const sx = r[0] * ppv, sy = (r[1] * SP - Z * CP) * ppv;
      items.push({ x, y, z, id, sx, sy, dep: r[1] * CP + Z * SP });
      minX = Math.min(minX, sx); maxX = Math.max(maxX, sx); minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
    }
    items.sort((p, q) => p.dep - q.dep); // painter's sort, far -> near
    const pad = Math.ceil(ppv * 1.1) + 2, ax = Math.ceil(-minX) + pad, ay = Math.ceil(-minY) + pad;
    const { c, ctx } = mkCanvas(maxX - minX + pad * 2 + 1, maxY - minY + pad * 2 + 1);
    const aoK = o.ao !== undefined ? o.ao : 0.075;
    for (const it of items) {
      const col = COLS[it.id], cc = col.c;
      const j = 1 + (rnd3(it.x, it.y, it.z, m.seed) - 0.5) * 2 * col.jit;
      for (const f of P.faces) {
        const nx = it.x + f.n[0], ny = it.y + f.n[1], nz = it.z + f.n[2];
        if (m.get(nx, ny, nz)) continue;
        let r, g, b;
        if (col.em) { const k = j * (f.top ? 1.02 : 0.95); r = cc[0] * k; g = cc[1] * k; b = cc[2] * k; } else {
          let ao = 1; // each occupied neighbour around the open face darkens it by 7.5 %
          if (aoK) {
            for (const t of [f.t1, f.t2]) { if (m.get(nx + t[0], ny + t[1], nz + t[2])) ao -= aoK; if (m.get(nx - t[0], ny - t[1], nz - t[2])) ao -= aoK; }
            if (!f.top && it.z === 0 && !o.noGround) ao *= 0.9;
          }
          const k = j * f.tone * ao;
          if (f.top) { r = cc[0] * k * 1.035; g = cc[1] * k * 1.015; b = cc[2] * k * 0.965; } // warm sunlit tops
          else { const cool = (1 - f.tone) * 0.45; r = cc[0] * k * (1 - cool * 0.25); g = cc[1] * k * (1 - cool * 0.1); b = cc[2] * k * (1 + cool * 0.5) + cool * 14; } // cool sides
        }
        ctx.fillStyle = 'rgb(' + (clamp(r, 0, 255) | 0) + ',' + (clamp(g, 0, 255) | 0) + ',' + (clamp(b, 0, 255) | 0) + ')';
        const p = f.pts, X = ax + it.sx, Y = ay + it.sy;
        ctx.beginPath(); ctx.moveTo(X + p[0], Y + p[1]); ctx.lineTo(X + p[2], Y + p[3]); ctx.lineTo(X + p[4], Y + p[5]); ctx.lineTo(X + p[6], Y + p[7]); ctx.fill();
      }
    }
    return { c, ax, ay };
  }
  /** Blocky sun shadow: every surface voxel's footprint at z and z+1, sheared to the lower right, blurred. */
  function renderShadow(m, yaw, ppv, zoff = 0) {
    const P = prep(yaw, ppv), quads = [], contact = [];
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    const push = (arr, x, y, zz) => {
      const q = []; for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const r = P.R(x + u - m.w / 2, y + v - m.d / 2), X = (r[0] + (zz + zoff) * SHX) * ppv, Y = (r[1] + (zz + zoff) * SHY) * SP * ppv;
        q.push(X, Y); minX = Math.min(minX, X); maxX = Math.max(maxX, X); minY = Math.min(minY, Y); maxY = Math.max(maxY, Y);
      } arr.push(q);
    };
    for (let z = 0; z < m.h; z++) for (let y = 0; y < m.d; y++) for (let x = 0; x < m.w; x++) {
      if (!m.get(x, y, z)) continue;
      if (m.get(x, y, z + 1) && m.get(x + 1, y, z) && m.get(x - 1, y, z) && m.get(x, y + 1, z) && m.get(x, y - 1, z)) continue;
      push(quads, x, y, z); push(quads, x, y, z + 1);
      if (z + zoff <= 1.5) push(contact, x, y, z);
    }
    const pad = Math.ceil(ppv * 0.8) + 3, ax = Math.ceil(-minX) + pad, ay = Math.ceil(-minY) + pad, W = maxX - minX + pad * 2, H = maxY - minY + pad * 2;
    const layer = (arr) => { const L = mkCanvas(W, H); L.ctx.fillStyle = '#000'; for (const q of arr) { L.ctx.beginPath(); L.ctx.moveTo(ax + q[0], ay + q[1]); for (let i = 2; i < 8; i += 2) L.ctx.lineTo(ax + q[i], ay + q[i + 1]); L.ctx.fill(); } return L.c; };
    const { c, ctx } = mkCanvas(W, H);
    ctx.filter = 'blur(' + (ppv * 0.16).toFixed(2) + 'px)';
    ctx.globalAlpha = 0.62; ctx.drawImage(layer(quads), 0, 0);
    if (contact.length) { ctx.globalAlpha = 0.55; ctx.drawImage(layer(contact), 0, 0); }
    return { c, ax, ay };
  }
  function glowSprite(r, g, b) {
    const { c, ctx } = mkCanvas(64, 64), gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${r},${g},${b},0.9)`); gr.addColorStop(0.35, `rgba(${r},${g},${b},0.35)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64); return c;
  }
  function tinted(s, color) { const { c, ctx } = mkCanvas(s.c.width, s.c.height); ctx.drawImage(s.c, 0, 0); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = color; ctx.fillRect(0, 0, c.width, c.height); return { c, ax: s.ax, ay: s.ay }; }
  /* ---------------- models (ported from the reference module) ---------------- */
  let P = null;
  function palette() { P = {
      pk: C('#f7842a'), carve: C('#8a3412'), pkDk: C('#e86f22'), pkLt: C('#fb9036'), stem: C('#5b7a2a'), leafG: C('#7cc24a'),
      face: C('#ffd84a', { em: 1, jit: 0.03 }), faceHot: C('#fff1a2', { em: 1, jit: 0.02 }), mouth: C('#ffc23a', { em: 1, jit: 0.03 }),
      cloak: C('#36325f'), cloakDk: C('#27234a'), cloakLt: C('#4c4787'), shirt: C('#efe2c4'), scarf: C('#22b8a2'), scarfDk: C('#178c7c'), pants: C('#5b4232'), boot: C('#2c221e'), glove: C('#7d5634'),
      tPur: C('#9b54d2'), tPurDk: C('#7a3db2'), tPurLt: C('#b672e2'), tCream: C('#f4e9cc'), tCreamDk: C('#ddcfa8'), tRoot: C('#c9a46c'), tLeaf: C('#5fbe3b'), tLeafDk: C('#3e8f2b'), tEye: C('#ff4a2c', { em: 1, jit: 0.02 }), tBrow: C('#3a1a50'),
      gW: C('#f6faff', { jit: 0.025 }), gMid: C('#dfe9f8', { jit: 0.025 }), gIce: C('#b8d6f3', { jit: 0.03 }), gDeep: C('#94bfea'), gHole: C('#1c2044', { jit: 0.02 }),
      cPur: C('#6c3e88'), cPurDk: C('#54306b'), cPurLt: C('#81509e'), cBr: C('#946a42'), cBrDk: C('#6f4b2d'), cRoot: C('#5c3f27'), cCrack: C('#ff9a2a', { em: 1, jit: 0.05 }), cCrackHot: C('#ffd36a', { em: 1, jit: 0.03 }), cEye: C('#ffef8a', { em: 1, jit: 0.02 }), cLeaf: C('#4b8a3a'), cLeafDk: C('#356b2f'), cMouth: C('#24122c', { jit: 0.02 }),
      bark: C('#7a5236'), barkDk: C('#5f3f29'), pine: C('#2f6e4c'), pineDk: C('#255a3e'), pineLt: C('#3d8659'), hay: C('#ebc75c'), hayDk: C('#d3aa45'), hayLt: C('#f6dc84'),
      stone: C('#a9abb2'), stoneDk: C('#8a8d97'), moss: C('#7f9a52'), engr: C('#5e606b'), seed: C('#f8edd2', { jit: 0.03 }), seedDk: C('#dcc394', { jit: 0.03 }),
      gem: C('#5df0b6', { jit: 0.04 }), gemLt: C('#b6ffe0', { jit: 0.03 }), gemDk: C('#2fc596', { jit: 0.04 }),
    }; }
  const ribCol = (cx, cy, zTop, base, dk, lt) => (x, y, z) => (z >= zTop ? lt : Math.cos(Math.atan2(y + 0.5 - cy, x + 0.5 - cx) * 5) > 0.55 ? dk : base);
  /** Main character rig (12x12x22): each pose re-assembles parts on whole-voxel offsets; hem, scarf, head lag a frame. f 0-7 walk, 8 idle, 9 blink. */
  function jackPose(f) {
    if (f >= 8) return { hem: 1, blink: f === 9 };
    const L = [2, 1, 0, -1, -2, -1, 0, 1][f], A = Math.abs(L) > 1 ? Math.sign(L) : 0;
    return { lf: L, rf: -L, ll: [0, 0, 0, 0, 0, 1, 1, 0][f], rl: [0, 1, 1, 0, 0, 0, 0, 0][f], bob: f % 4 === 2 ? 1 : 0, al: -A, ar: A, hz: (f + 3) % 4 === 0 ? 1 : 0, hem: 1 + ((f + 1) % 4 === 0 ? 1 : 0), scarf: f % 4 < 2 ? 1 : 2 };
  }
  function jackModel(f) {
    const q = jackPose(f), m = new Vox(12, 12, 22, 11), b = 3 + (q.bob || 0);
    const leg = (x0, fwd, lift) => { const y0 = 5 + fwd; m.box(x0, y0, lift, x0 + 1, y0 + 1, Math.max(lift, b - 1), (x, y, z) => (z === lift ? P.boot : P.pants)); m.box(x0, y0 + 2, lift, x0 + 1, y0 + 2, lift, P.boot); };
    leg(4, q.lf || 0, q.ll || 0); leg(6, q.rf || 0, q.rl || 0);
    m.box(2, 3, b, 9, 8, b, (x, y) => (x === 2 || x === 9 || y === 3 || y === 8 ? P.cloakDk : P.cloak)); // hem slab
    for (let k = 1; k <= q.hem; k++) m.box(3, 3 - k, b + (k > 1 ? 1 : 0), 8, 3 - k, b + 1, P.cloakDk); // hem flutters back (follow-through)
    m.box(3, 4, b + 1, 8, 7, b + 4, P.cloak); m.box(5, 7, b + 1, 6, 7, b + 4, (x, y, z) => (z === b + 4 ? P.shirt : P.cloakLt));
    for (const [x, fwd] of [[2, q.al || 0], [9, q.ar || 0]]) { m.box(x, 5 + fwd, b + 1, x, 6 + fwd, b + 4, P.cloak); m.box(x, 5 + fwd, b, x, 6 + fwd, b, P.glove); } // counter-swinging sleeves
    m.box(3, 4, b + 5, 8, 7, b + 5, (x, y) => ((x + y) % 3 === 0 ? P.scarfDk : P.scarf));
    for (const [y, dz] of [[[3, 3], [3, 2], [3, 1]], [[3, 3], [2, 3], [2, 2]], [[3, 4], [2, 4], [1, 3]]][q.scarf || 0]) m.box(6, y, b + dz + 1, 7, y, b + dz + 1, P.scarf); // scarf tail
    const hz = b + 9.6 + (q.hz || 0), top = Math.floor(hz + 3.6), ez = Math.round(hz) + 1;
    m.blob(6, 6, hz, 5.05, 4.4, 3.75, ribCol(6, 6, hz + 3.0, P.pk, P.pkDk, P.pkLt), 2.6);
    m.box(5, 5, top, 6, 5, top + 1, P.stem); m.set(5, 5, top + 2, P.stem); m.set(7, 5, top, P.leafG); m.set(8, 5, top, P.leafG); m.set(8, 4, top + 1, P.leafG);
    const eyes = q.blink ? [[2, ez], [3, ez], [4, ez], [7, ez], [8, ez], [9, ez]] : [[3, ez + 1], [8, ez + 1], [2, ez], [3, ez], [4, ez], [7, ez], [8, ez], [9, ez]];
    const face = eyes.concat([[3, ez - 2], [4, ez - 2], [6, ez - 2], [7, ez - 2], [8, ez - 2], [4, ez - 3], [5, ez - 3], [6, ez - 3], [7, ez - 3]]), fs = new Set(face.map(([x, z]) => x + ',' + z));
    for (const [x, z] of face) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!fs.has(x + dx + ',' + (z + dz))) m.paintFront(x + dx, z + dz, P.carve); // dark carved rim
    for (const [x, z] of face) m.paintFront(x, z, z >= ez - 1 ? P.face : P.mouth);
    if (!q.blink) { m.paintFront(3, ez, P.faceHot); m.paintFront(8, ez, P.faceHot); } return m; }
  function creeperModel(i) { // small creature: 6 waddle poses – body sways over the stance foot, hops at passing, squashes at contact, leaves lag
    const m = new Vox(12, 12, 18, 23), sway = [0, 1, 1, 0, -1, -1][i], hop = [0, 0, 1, 0, 0, 1][i], sq = [1, 0, 0, 1, 0, 0][i], lag = [-1, 0, 1, 1, 0, -1][i], lf = [1, 1, 0, -1, -1, 0][i];
    m.box(4, 6 + lf, [0, 0, 0, 0, 0, 1][i], 4, 6 + lf, 1 + hop, P.tRoot); m.box(7, 6 - lf, [0, 0, 1, 0, 0, 0][i], 7, 6 - lf, 1 + hop, P.tRoot);
    const cx = 6 + sway, rz = 4.4 - sq * 0.35, cz = 6.3 + hop - sq * 0.3;
    m.blob(cx, 6, cz, 4.7 + sq * 0.25, 4.5 + sq * 0.2, rz, (x, y, z) => { const t = z + 0.5 - cz + (rnd3(x, y, z, 5) - 0.5) * 1.2; if (t > 1.6) return z + 0.5 > cz + rz - 1 ? P.tPurDk : rnd3(x, y, z, 9) < 0.14 ? P.tPurLt : P.tPur; if (t > 0.4) return (x + z) & 1 ? P.tPur : P.tCream; return z + 0.5 < cz - rz + 1.6 ? P.tCreamDk : P.tCream; });
    const tz = Math.floor(cz + rz - 0.1); m.box(cx - 1, 6, tz, cx, 6, tz + 1, P.tLeafDk); m.box(cx - 3 + lag, 5, tz + 2, cx - 2 + lag, 6, tz + 3, P.tLeaf); m.set(cx - 4 + lag, 5, tz + 4, P.tLeaf);
    m.box(cx + 1 + lag, 6, tz + 2, cx + 2 + lag, 7, tz + 3, P.tLeaf); m.set(cx + 3 + lag, 7, tz + 4, P.tLeaf); m.box(cx - 1 + lag, 4, tz + 3, cx + lag, 4, tz + 5, P.tLeafDk);
    const ez = Math.round(cz) + 1;
    m.paintFront(cx - 2, ez, P.tEye); m.paintFront(cx + 1, ez, P.tEye); for (let x = cx - 2; x <= cx + 1; x++) m.paintFront(x, ez + 1, P.tBrow); m.paintFront(cx - 1, ez - 2, P.tBrow); m.paintFront(cx, ez - 2, P.tBrow); return m; }
  function ghostModel(f) { // fast creature (white floating ghost), 11 x 9 x 15
    const m = new Vox(11, 9, 15, 37), sw = [0, 0.8, 0, -0.8][f], arm = [0, 1, 0, -1][f], hz = 10.2, ez = Math.round(hz) + 1;
    m.blob(5.5, 4.5, hz, 4.4, 3.7, 3.9, P.gW);
    for (let z = 1; z <= 7; z++) { const r = 0.9 + (z - 1) * 0.55; m.blob(5.5 + sw * (7 - z) * 0.35, 4.5 - (7 - z) * 0.12, z + 0.5, r, r * 0.85, 0.55, z < 3 ? P.gDeep : z < 5 ? P.gIce : P.gMid); }
    m.box(0, 5, 7 + (arm > 0), 1, 7, 7 + (arm > 0), P.gMid); m.box(9, 5, 7 + (arm < 0), 10, 7, 7 + (arm < 0), P.gMid);
    for (const [x, z] of [[3, ez], [4, ez], [3, ez - 1], [4, ez - 1], [6, ez], [7, ez], [6, ez - 1], [7, ez - 1], [5, ez - 3], [4, ez - 4], [5, ez - 4], [6, ez - 4], [4, ez - 3], [6, ez - 3]]) m.paintFront(x, z, P.gHole);
    return m; }
  function colossusModel(f) { // large creature (plum root creature with glowing cracks), 19 x 16 x 25
    const m = new Vox(19, 16, 25, 51), legY = [1, 0, -1, 0][f], lift = [0, 1, 0, 1][f], armY = -legY, cz = 12.5 + lift, fz = Math.floor(cz);
    m.box(4, 6 + legY, 0, 7, 9 + legY, 4 + lift, (x, y, z) => (z === 0 ? P.cRoot : P.cBrDk)); m.box(11, 6 - legY, 0, 14, 9 - legY, 4 + lift, (x, y, z) => (z === 0 ? P.cRoot : P.cBrDk));
    m.blob(9.5, 8, cz, 7.6, 6.6, 8.4, (x, y, z) => { const t = z + 0.5 - cz + (rnd3(x, y, z, 7) - 0.5) * 2.2, sp = rnd3(x, y, z, 13); if (t > 1.5) return sp < 0.16 ? P.cPurDk : sp > 0.9 ? P.cPurLt : P.cPur; if (t > 0) return sp < 0.5 ? P.cPur : P.cBr; return sp < 0.18 ? P.cBrDk : P.cBr; }, 2.4);
    m.box(0, 6 + armY, fz - 3, 2, 9 + armY, fz + 3, P.cPur); m.box(16, 6 - armY, fz - 3, 18, 9 - armY, fz + 3, P.cPur);
    m.box(0, 6 + armY, fz - 6, 2, 9 + armY, fz - 4, P.cBrDk); m.box(16, 6 - armY, fz - 6, 18, 9 - armY, fz - 4, P.cBrDk);
    const tz = Math.floor(cz + 7.6);
    m.box(8, 7, tz, 10, 9, tz + 1, P.cLeafDk); m.box(5, 7, tz + 2, 7, 8, tz + 4, P.cLeaf); m.box(11, 8, tz + 2, 13, 9, tz + 4, P.cLeaf); m.box(9, 6, tz + 2, 10, 6, tz + 5, P.cLeafDk);
    for (const cr of [[[5, 17], [6, 16], [6, 15], [7, 14], [7, 13], [6, 12], [6, 11], [7, 10], [7, 9]], [[13, 18], [13, 17], [12, 16], [12, 15], [13, 14], [13, 13], [12, 12]], [[10, 9], [10, 8], [11, 7], [11, 6]]])
      for (const [x, z] of cr) m.paintFront(x, z + lift, z & 1 ? P.cCrack : P.cCrackHot); // emissive cracks
    const ez = Math.round(cz) + 3;
    for (const x of [6, 7, 11, 12]) m.paintFront(x, ez, P.cEye); for (const x of [5, 6, 7, 8, 10, 11, 12, 13]) m.paintFront(x, ez + 1, P.cPurDk); for (const x of [7, 8, 9, 10, 11]) m.paintFront(x, ez - 3, P.cMouth);
    return m; }
  function lanternModel() { // orbiting object: glowing root-shaped lantern
    const m = new Vox(8, 8, 11, 61);
    m.blob(4, 4, 4.2, 3.7, 3.6, 3.5, (x, y, z) => (z >= 5 ? P.tPur : z >= 4 ? (rnd3(x, y, z, 2) < 0.5 ? P.tPur : P.tCream) : P.tCream));
    for (const [x, z] of [[2, 5], [5, 5], [2, 3], [3, 3], [4, 3], [5, 3], [3, 2], [4, 2]]) m.paintFront(x, z, z === 5 ? P.faceHot : P.face);
    m.box(3, 4, 8, 4, 4, 8, P.tLeafDk); m.box(2, 3, 9, 2, 4, 9, P.tLeaf); m.box(5, 4, 9, 5, 5, 9, P.tLeaf);
    return m; }
  function gemModel() { // collectible: stepped octahedron gem
    const m = new Vox(5, 5, 7, 73);
    for (let z = 0; z < 7; z++) { const t = z / 6, r = (t < 0.45 ? t / 0.45 : (1 - t) / 0.55) * 2.3 + 0.5; for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) if (Math.abs(x - 2) + Math.abs(y - 2) <= r) m.set(x, y, z, t > 0.45 ? (z === 6 || rnd3(x, y, z, 1) < 0.3 ? P.gemLt : P.gem) : P.gemDk); }
    return m; }
  function seedModel() { const m = new Vox(3, 2, 4, 3); m.box(0, 0, 0, 2, 1, 2, (x, y, z) => (x === 1 || z === 1 ? P.seed : P.seedDk)); m.set(1, 0, 3, P.seed); return m; }
  function treeModel(v) {
    const cols = [['#f08a2c', '#e2701f', '#f7a845', '#d45f1d'], ['#df4c34', '#c93a2c', '#ec6a45', '#b02f28'], ['#f0c03e', '#e2a52f', '#f8d867', '#d4902a']][v].map((h) => C(h));
    const m = new Vox(15, 15, 24, 100 + v), pick = (x, y, z) => { const h = rnd3(x, y, z, 11); return z >= 19 ? (h < 0.5 ? cols[2] : cols[0]) : h < 0.12 ? cols[3] : h < 0.45 ? cols[1] : h < 0.6 ? cols[2] : cols[0]; };
    m.box(6, 6, 0, 8, 8, 10, (x, y, z) => (rnd3(x, y, z, 3) < 0.3 ? P.barkDk : P.bark));
    m.blob(7.5, 7.5, 15, 6.6, 6.4, 5.2, pick, 3.2);
    for (let i = 0; i < 4; i++) { const a = hash2(i, v, 5) * TAU, d = 3 + hash2(i, v, 6) * 2; m.blob(7.5 + Math.cos(a) * d, 7.5 + Math.sin(a) * d, 14 + hash2(i, v, 7) * 5, 3, 3, 2.4, pick, 3); }
    return m.blob(7.5, 7.5, 20.3, 4, 4, 2.4, pick, 3);
  }
  function pineModel() {
    const m = new Vox(13, 13, 25, 130); m.box(5, 5, 0, 7, 7, 4, P.barkDk);
    for (const [z0, z1, r] of [[3, 6, 6.2], [7, 10, 5], [11, 14, 3.8], [15, 18, 2.6], [19, 21, 1.5]]) for (let z = z0; z <= z1; z++) m.blob(6.5, 6.5, z + 0.5, r - (z - z0) * 0.55, r - (z - z0) * 0.55, 0.55, (x, y, zz) => (zz === z0 ? P.pineDk : rnd3(x, y, zz, 4) < 0.2 ? P.pineLt : P.pine), 2.6);
    return m.box(6, 6, 22, 6, 6, 23, P.pineLt);
  }
  function pumpkinModel() { const m = new Vox(8, 8, 8, 142); m.blob(4, 4, 2.6, 3.8, 3.6, 2.7, ribCol(4, 4, 4.7, P.pk, P.pkDk, P.pkLt)); m.box(3, 4, 5, 3, 4, 6, P.stem); m.set(4, 4, 5, P.leafG); return m; }
  function hayModel() { return new Vox(10, 9, 9, 150).blob(5, 4.5, 3.6, 4.9, 4.4, 4.2, (x, y, z) => (z >= 6 ? P.hayLt : rnd3(x, y, z, 1) < 0.3 ? P.hayDk : P.hay), 3); }
  function graveModel() {
    const m = new Vox(7, 3, 10, 170), st = (x, y, z) => (z === 0 && rnd3(x, y, z, 1) < 0.6 ? P.moss : rnd3(x, y, z, 2) < 0.2 ? P.stoneDk : P.stone);
    m.box(0, 0, 0, 6, 2, 0, st); m.box(1, 1, 1, 5, 2, 6, st); m.box(2, 1, 7, 4, 2, 7, st);
    for (const [x, z] of [[3, 5], [3, 4], [2, 4], [4, 4], [3, 3]]) m.set(x, 2, z, P.engr);
    return m; }
  /* ---------------- bake all sprites once per scale ---------------- */
  let B = null;
  const YAW = 0.6; // facing right = +0.6 rad, facing left = -0.6 rad (two baked sides, no mirroring)
  function bake(K) {
    if (B && B.K === K) return B;
    if (!P) palette();
    const PPV = Math.max(3, Math.round(K * 1.9)); // sprite px per voxel -> ~1.9-2 world units per voxel
    const chars = (fn, nf, zoff = 0) => { const fr = [[], []]; for (let f = 0; f < nf; f++) { const m = fn(f); fr[0].push(renderVox(m, YAW, PPV)); fr[1].push(renderVox(m, -YAW, PPV)); } return { fr, sh: [renderShadow(fn(0), YAW, PPV, zoff), renderShadow(fn(0), -YAW, PPV, zoff)] }; };
    const spin = (m, n, ppv) => Array.from({ length: n }, (_, i) => renderVox(m, (i / n) * (Math.PI / 2) + 0.2, ppv));
    const prop = (m, yaw) => Object.assign(renderVox(m, yaw, PPV), { sh: renderShadow(m, yaw, PPV) });
    const cube = (h) => { const m = new Vox(1, 1, 1, 400).set(0, 0, 0, C(h, { jit: 0 })); return Array.from({ length: 6 }, (_, k) => renderVox(m, (k / 6) * (Math.PI / 2), K * 2, { ao: 0, noGround: true })); };
    B = { K, PPV, VW: PPV / K, jack: chars(jackModel, 10), creeper: chars(creeperModel, 6), ghost: chars(ghostModel, 4, 2), colossus: chars(colossusModel, 4),
      lantern: spin(lanternModel(), 8, PPV * 0.85), gem: spin(gemModel(), 8, PPV * 0.6), seed: spin(seedModel(), 6, PPV * 0.75),
      props: { tree0: prop(treeModel(0), 0.55), tree1: prop(treeModel(1), 0.55), tree2: prop(treeModel(2), 0.55), pine: prop(pineModel(), 0.5), pump: prop(pumpkinModel(), 0.45), hay: prop(hayModel(), 0.5), grave: prop(graveModel(), 0.3) },
      cubes: ['#9b54d2', '#7a3db2', '#f4e9cc', '#5fbe3b', '#b672e2'].map(cube), warm: glowSprite(255, 190, 80), mint: glowSprite(120, 255, 200), hot: glowSprite(255, 150, 50) };
    B.flash = tinted(B.creeper.fr[0][0], '#ffffff');
    return B;
  }
  /** World-space blit with pixel snapping; sprites are baked at K sprite px per world unit. */
  let VSC = 1;
  function blit(ctx, s, x, y, sx = 1, sy = 1) {
    const K = B.K;
    ctx.drawImage(s.c, Math.round((x - (s.ax / K) * sx) * VSC) / VSC, Math.round((y - (s.ay / K) * sy) * VSC) / VSC, (s.c.width / K) * sx, (s.c.height / K) * sy);
  }
  function glow(ctx, img, x, y, w, h, a) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.drawImage(img, x - w / 2, y - h / 2, w, h); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  /** Draws the main character with feet at (x, y). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing, moving = true) {
    bake(B ? B.K : 2);
    const side = facing < 0 ? 1 : 0, fi = moving ? Math.floor(t * 10) % 8 : t % 3.4 < 0.14 ? 9 : 8, lift = 0; // stepped poses, bob baked in
    glow(ctx, B.warm, x, y, 60, 30, 0.14 + 0.02 * Math.sin(t * 7)); // warm light pool on the ground
    ctx.globalAlpha = 0.42; blit(ctx, B.jack.sh[side], x, y); ctx.globalAlpha = 1;
    blit(ctx, B.jack.fr[side][fi], x, y - lift);
    const q = jackPose(fi), gz = (13 + (q.bob || 0) + (q.hz || 0)) * CP * B.VW; // bloom over the carved face
    glow(ctx, B.warm, x + (side ? -2.5 : 2.5), y - gz, 22, 18, 0.34 + 0.06 * Math.sin(t * 9));
  }
  /** Draws a creature with feet at (x, y). type: 'creeper' (small) | 'ghost' (fast) | 'colossus' (large). */
  function drawEnemy(ctx, x, y, t, type = 'creeper', facing = 1, seed = 0, flash = 0) {
    bake(B ? B.K : 2);
    const set = B[type], side = facing < 0 ? 1 : 0, ghost = type === 'ghost';
    const fi = Math.floor(t * (ghost ? 6 : type === 'creeper' ? 9 : 4) + seed * 4) % set.fr[0].length, lift = ghost ? 2.5 + Math.sin(t * 2.8 + seed * 20) * 1.5 : 0;
    ctx.globalAlpha = ghost ? 0.22 : 0.42; blit(ctx, set.sh[side], x, y);
    ctx.globalAlpha = ghost ? 0.84 : 1; blit(ctx, set.fr[side][fi], x, y - lift);
    if (flash > 0) { ctx.globalAlpha = Math.min(0.58, flash * 0.8); blit(ctx, B.flash, x, y - lift); }
    ctx.globalAlpha = 1;
    if (type === 'colossus') glow(ctx, B.hot, x + (side ? -2 : 2), y - 15.5 * CP * B.VW, 30, 26, 0.32 + 0.12 * Math.sin(t * 4 + seed * 9));
  }
  /* ---------------- voxel ground: 4x4-unit tiles, 1-voxel steps with visible side faces ---------------- */
  const CELL = 4, GRASS = 0, LEAF = 1, FIELD = 2, STONE = 3, PATH = 4, WATER = 5;
  const GP = { grass: ['#689f45', '#6da548', '#71aa4a', '#66a044', '#75ad4d', '#6aa246'].map(hex), leaf: ['#a8673e', '#b47643', '#9e5c3a', '#bf8a4c', '#935538', '#ad6e40'].map(hex),
    stone: ['#94949a', '#8e8f96', '#9a9a9d', '#8a8b92', '#97938d'].map(hex), moss: hex('#82905f'), path: ['#cfa86e', '#c59d63', '#d7b37c', '#be955d'].map(hex),
    fieldA: hex('#8e5d3a'), fieldB: hex('#7b4f31'), shore: hex('#dcbd86'), water: hex('#4aa6dc'), waterDeep: hex('#3784c2'), waterLt: hex('#5cb6e6') };
  const SIDEC = ['#7e5536', '#70452b', '#5c3a23', '#63646e', '#94693f', '#3a6f9e'].map(hex), LIP = [1, 1, 0, 0, 0, 0];
  /** Material + height of a tile: pure function of world position (here: a hand-laid demo map). */
  function cellMat(i, j) {
    const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL, jit = (perlin(x / 15, y / 15, 401) - 0.5) * 0.3 + (hash2(i, j, 4242) - 0.5) * 0.1;
    const pond = 1 - Math.hypot((x - 330) / 120, (y - 190) / 90) + jit * 0.5;
    if (pond > 0.12) return { mat: WATER, h: -1, aux: pond - 0.12 }; if (pond > 0) return { mat: PATH, h: 0, aux: 1 };
    if (Math.abs(y + 40 + (x - 30) * 0.95 + Math.sin(x / 40) * 14) < 8 + jit * 6 && y < 10) return { mat: PATH, h: 0 };
    if (1 - Math.max(Math.abs(x - 205) / 105, Math.abs(y + 10) / 62) + jit * 0.5 > 0) return { mat: FIELD, h: 0 };
    if (1 - Math.hypot((x + 60) / 175, (y - 95) / 120) + (fbm(x / 70, y / 70, 3) - 0.5) * 0.9 + jit > 0) return { mat: STONE, h: 1 };
    const leaf = 1 - Math.hypot((x + 300) / 110, (y + 110) / 90) + (fbm(x / 50, y / 50, 8) - 0.5) + jit;
    return { mat: leaf > 0 ? LEAF : GRASS, h: fbm(x / 60, y / 60, 77) + jit * 0.3 > 0.6 ? 2 : 1 };
  }
  function cellColor(i, j, cm) {
    const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL, hv = hash2(i, j, 77), pn = perlin(x / 64, y / 64, 13) * 0.75 + perlin(x / 22, y / 22, 14) * 0.25, v = clamp(pn * 1.05 + hv * 0.1 - 0.1, 0, 0.999); // calm patches, little salt
    let c, p;
    if (cm.mat === GRASS) { p = GP.grass; c = p[Math.floor(v * p.length)]; }
    else if (cm.mat === LEAF) { p = GP.leaf; c = p[Math.floor(clamp(hv * 0.12 + perlin(x / 34, y / 34, 17) * 0.95 - 0.08, 0, 0.999) * p.length)]; }
    else if (cm.mat === FIELD) c = (j & 1 ? GP.fieldB : GP.fieldA).map((k) => k * (0.95 + hv * 0.09)); // furrow rows
    else if (cm.mat === STONE) { p = GP.stone; c = perlin(x / 70, y / 70, 5) > 0.63 && hv < 0.4 ? GP.moss : p[Math.floor(clamp(pn * 0.7 + hv * 0.45 - 0.08, 0, 0.999) * p.length)]; }
    else if (cm.mat === PATH) { p = GP.path; c = p[Math.floor(v * p.length)]; if (cm.aux) c = c.map((k, n) => GP.shore[n] + (k - GP.shore[n]) * hv * 0.4); }
    else { const d = clamp(cm.aux * 4, 0, 1), a = hv < 0.3 ? GP.waterLt : GP.water; c = a.map((k, n) => k + (GP.waterDeep[n] - k) * d); }
    if (cm.h === 2) c = c.map((k) => k * 1.05);
    return c;
  }
  function mini(ctx, x, y, s, hh, top, side) { // tiny voxel decal: shadow, side face, top face
    const sd = s * SP, hz = hh * CP;
    ctx.fillStyle = 'rgba(30,40,20,0.22)'; ctx.fillRect(x + s * 0.35, y + sd * 0.25, s * 0.7 + hz * 0.6, sd * 0.85);
    ctx.fillStyle = side; ctx.fillRect(x, y + sd - hz, s, hz); ctx.fillStyle = top; ctx.fillRect(x, y - hz, s, sd);
  }
  let GROUND = null;
  function bakeGround(w, h, s) {
    if (GROUND && GROUND.w === w && GROUND.h === h) return GROUND;
    const x0 = -w / 2 / s, y0 = -h / 2 / s, i0 = Math.floor(x0 / CELL) - 1, j0 = Math.floor(y0 / CELL) - 1;
    const GW = Math.ceil(w / s / CELL) + 3, GH = Math.ceil(h / s / CELL) + 3, cells = [], sparks = [];
    for (let gj = 0; gj < GH; gj++) for (let gi = 0; gi < GW; gi++) {
      const cm = cellMat(i0 + gi, j0 + gj); cm.c = cellColor(i0 + gi, j0 + gj, cm); cm.sj = 0.94 + hash2(i0 + gi, j0 + gj, 555) * 0.1; cells.push(cm);
      if (cm.mat === WATER && hash2(gi, gj, 31) < 0.16) sparks.push([(i0 + gi + 0.3) * CELL, (j0 + gj + 0.5) * CELL, hash2(gi, gj, 34) * TAU]);
    }
    const { c, ctx } = mkCanvas(w, h), img = ctx.createImageData(c.width, c.height), d = img.data, edge = Math.max(0.42, 1 / s);
    for (let py = 0, o = 0; py < c.height; py++) {
      const yv = y0 + (py + 0.5) / s, cj = Math.floor(yv / CELL), fy = yv - cj * CELL;
      for (let px = 0; px < c.width; px++, o += 4) {
        const xv = x0 + (px + 0.5) / s, ci = Math.floor(xv / CELL), fx = xv - ci * CELL, k = (cj - j0) * GW + (ci - i0);
        const cm = cells[k], n = cells[k - GW], wst = cells[k - 1], nw = cells[k - GW - 1];
        let [r, g, b] = cm.c, m = 1;
        if (n.h > cm.h) { // the tile to the north is higher: paint its side face into the top of this tile
          const band = Math.min(3.5, (n.h - cm.h) * 1.9);
          if (fy < band) {
            if (fy < edge) { r = n.c[0] * 1.14 + 6; g = n.c[1] * 1.14 + 6; b = n.c[2] * 1.12 + 6; } // lit top edge
            else if (LIP[n.mat] && fy < 1.05) { r = n.c[0] * 0.8; g = n.c[1] * 0.8; b = n.c[2] * 0.82; } // grass overhang lip
            else { const sc = SIDEC[n.mat], sh = (0.98 - 0.2 * (fy / band)) * n.sj * (fx > CELL - edge ? 0.94 : 1); r = sc[0] * sh; g = sc[1] * sh; b = sc[2] * sh; }
            d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255; continue;
          }
          if (fy < band + 0.9) m *= 0.84; // contact shadow under the step
        }
        if (wst.h > cm.h) { if (fx < 1.5) m *= 0.8; else if (fx < 2) m *= 0.9; } // west step casts a sun shadow
        else if (nw.h > cm.h && fx < 1.5 && fy < 1.2 + Math.min(3.5, (nw.h - cm.h) * 1.9)) m *= 0.86;
        if (cm.mat === STONE) { if (fy > CELL - edge || fx > CELL - edge) m *= 0.86; else if (fy < edge || fx < edge) m *= 1.05; } // flagstone joints
        else if (cm.mat !== WATER) { if (fy > CELL - edge) m *= 0.95; else if (fy < edge) m *= 1.035; if (fx > CELL - edge) m *= 0.965; else if (fx < edge) m *= 1.015; }
        d[o] = r * m; d[o + 1] = g * m; d[o + 2] = b * m; d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.setTransform(s, 0, 0, s, w / 2, h / 2); // decals in world units
    for (let cy = Math.floor(y0 / 7); cy <= Math.ceil(-y0 / 7); cy++) for (let cx = Math.floor(x0 / 7); cx <= Math.ceil(-x0 / 7); cx++) {
      const r0 = hash2(cx, cy, 1), r1 = hash2(cx, cy, 2), r2 = hash2(cx, cy, 3), x = Math.round((cx + hash2(cx, cy, 4)) * 14) / 2, y = Math.round((cy + hash2(cx, cy, 5)) * 14) / 2;
      const k = (Math.floor(y / CELL) - j0) * GW + Math.floor(x / CELL) - i0, cm = cells[k];
      if (x < x0 + 2 || x > -x0 - 2 || y < y0 + 4 || y > -y0 - 2 || cells[k - GW].h > cm.h) continue;
      if (cm.mat === GRASS && r0 < 0.38) for (let q = 0; q < 2 + Math.floor(r2 * 2.5); q++) mini(ctx, x + q * 0.9, y + (q & 1) * 0.4, 0.8, 1.2 + ((r1 * 7 + q * 0.37) % 1) * 1.6, ['#8acb57', '#7cbd4c', '#97d462'][q % 3], ['#5f9a3a', '#548c34', '#68a440'][q % 3]);
      else if (cm.mat === GRASS && r0 < 0.47) { const fc = [['#fff7ea', '#e2d8c8'], ['#ffd94a', '#e0b02c'], ['#ef4b3e', '#c2342d'], ['#b07ae6', '#8a58c2'], ['#ff8fb0', '#d86a8e']][Math.floor(r1 * 5)]; mini(ctx, x + 0.3, y, 0.6, 1.6, '#6aa844', '#4c8030'); mini(ctx, x - 0.2, y - 1.6 * CP, 1.6, 1, fc[0], fc[1]); }
      else if (cm.mat === LEAF && r0 < 0.5) for (let q = 0; q < 1 + Math.floor(r2 * 3); q++) { const lx = x + ((r1 * 13 + q * 2.7) % 4) - 2, ly = y + ((r2 * 11 + q * 1.9) % 3) - 1.5; ctx.fillStyle = 'rgba(60,30,10,0.22)'; ctx.fillRect(lx + 0.4, ly + 0.4, 1.6, 1.1); ctx.fillStyle = ['#f08a2c', '#e05a2e', '#f2b23e', '#c94a2c', '#e8702a'][Math.floor(((r1 + q * 0.31) % 1) * 5)]; ctx.fillRect(lx, ly, 1.6, 1.1); }
      else if ((cm.mat === STONE && r0 < 0.12) || (cm.mat === PATH && r0 < 0.18) || (cm.mat === GRASS && r0 < 0.5)) mini(ctx, x, y, 1 + r1 * 1.2, 0.7 + r1 * 0.5, r1 < 0.5 ? '#b9b9bc' : '#a6a39f', r1 < 0.5 ? '#86868d' : '#7c7973');
      else if (cm.mat === STONE && r0 < 0.24) { const gx = Math.floor(x / CELL) * CELL, gy = Math.floor(y / CELL) * CELL; ctx.fillStyle = 'rgba(70,72,82,0.55)'; ctx.fillRect(gx + 1, gy + 1.5, 1.6, 0.45); ctx.fillRect(gx + 2.2, gy + 1.5, 0.45, 1.5); }
      else if (cm.mat === FIELD && r0 < 0.22) { const sy = Math.floor(y / CELL) * CELL + 2; mini(ctx, x, sy, 0.7, 1.2 + r1, '#86c556', '#5b9338'); mini(ctx, x + 0.7, sy - 0.9, 0.9, 0.5, '#9bd666', '#6aa444'); }
    }
    return (GROUND = { w, h, c, sparks, at: (x, y) => cells[(Math.floor(y / CELL) - j0) * GW + Math.floor(x / CELL) - i0] });
  }
  let VIG = null;
  function vignette(w, h) {
    if (VIG && VIG.w === w && VIG.h === h) return VIG.c;
    const { c, ctx } = mkCanvas(320, 180), g = ctx.createRadialGradient(160, 86.4, 57.6, 160, 90, 198.4);
    g.addColorStop(0, 'rgba(30,20,60,0)'); g.addColorStop(0.6, 'rgba(30,20,60,0.12)'); g.addColorStop(1, 'rgba(24,14,50,0.42)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 320, 180);
    const t = ctx.createLinearGradient(0, 0, 0, 180); t.addColorStop(0, 'rgba(255,236,190,0.10)'); t.addColorStop(0.35, 'rgba(255,236,190,0)'); ctx.fillStyle = t; ctx.fillRect(0, 0, 320, 180);
    return (VIG = { w, h, c }).c;
  }
  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, props, main character, creatures, effects. */
  function draw(ctx, w, h, t) {
    const s = h / 360; VSC = s;
    bake(clamp(Math.round(s * 4) / 4, 1.5, 4));
    const gr = bakeGround(w, h, s);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(gr.c, 0, 0);
    ctx.setTransform(s, 0, 0, s, w / 2, h / 2); // world space, origin = screen centre, 360 units tall
    ctx.fillStyle = '#e8f8ff';
    for (const [x, y, ph] of gr.sparks) { const v = Math.sin(t * 1.7 + ph); if (v < 0.55) continue; ctx.globalAlpha = (v - 0.55) * 1.6; ctx.fillRect(x, y, 1.8, 0.55); ctx.fillRect(x + 0.6, y - 0.6, 0.6, 0.6); }
    ctx.globalAlpha = 1;
    const hx = -10 + Math.sin(t * 0.5) * 6, hy = 10;
    const list = [
      ['tree0', -300, -95], ['tree1', -235, -150], ['tree2', -270, 10], ['pine', -170, -130], ['pine', 110, -150], ['tree0', 280, -150],
      ['pump', 160, -30], ['pump', 205, 10], ['pump', 240, -35], ['hay', 280, 20], ['hay', 135, 25], ['grave', -120, 70], ['grave', -40, 150], ['grave', 20, 95],
    ].map(([k, x, y]) => ({ y, f: (c) => { const p = B.props[k]; c.globalAlpha = 0.4; blit(c, p.sh, x, y); c.globalAlpha = 1; blit(c, p, x, y); } }));
    list.push({ y: hy, f: (c) => drawHero(c, hx, hy, t, 1) });
    for (const [type, x, y, f, sd] of [['creeper', 95, 50, -1, 0.1], ['creeper', -95, -40, 1, 0.5], ['creeper', 60, -80, -1, 0.8], ['creeper', -200, 120, 1, 0.3], ['ghost', -140, 20, 1, 0.2], ['ghost', 140, 120, -1, 0.7], ['colossus', 175, 75, -1, 0.4], ['creeper', 230, 120, -1, 0.9]]) {
      const ex = x + Math.sin(t * 1.3 + sd * 9) * 4;
      list.push({ y, f: (c) => drawEnemy(c, ex, y, t, type, f, sd, type === 'creeper' && sd === 0.1 ? Math.max(0, 0.7 - ((t * 0.9) % 1) * 3) : 0) });
    }
    list.sort((a, b) => a.y - b.y).forEach((o) => o.f(ctx));
    for (let i = 0; i < 6; i++) { // collectibles: spinning gems with mint glow and hover
      const gx = 40 + i * 17 + (i & 1) * 5, gy = 70 + ((i * 37) % 30), z = 2.4 + Math.sin(t * 3 + i) * 0.9, fi = Math.floor((t * 1.6 + i * 0.7) * 8) % 8;
      ctx.globalAlpha = 0.28; ctx.fillStyle = '#1d2a14'; ctx.fillRect(gx - 0.6, gy - 0.6, 3.2, 1.44);
      glow(ctx, B.mint, gx, gy - z - 1.4, 14, 14, 0.4); blit(ctx, B.gem[fi], gx, gy - z);
    }
    for (let i = 0; i < 3; i++) { // orbiting lanterns
      const a = t * 2.2 + (i * TAU) / 3, ox = hx + Math.cos(a) * 34, oy = hy - 6 + Math.sin(a) * 34 * 0.62, hov = 9 + Math.sin(t * 4 + i * 1.7) * 1.2;
      const fi = (((Math.floor((a / (Math.PI / 2)) * 8) % 8) + 8) % 8);
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#1d2a14'; ctx.fillRect(ox - 2, oy + 5, 6, 2.6);
      glow(ctx, B.warm, ox, oy + 6 - hov - 6, 32, 32, 0.5 + 0.12 * Math.sin(t * 11 + i)); blit(ctx, B.lantern[fi], ox, oy + 6 - hov);
    }
    const tx = 95, ty = 50, pt = (t * 0.9) % 1; // seed projectile -> small creature, then a cube burst + square ring
    for (let k = 0; k < 2; k++) {
      const q = (pt + k * 0.5) % 1, px = hx + (tx - hx) * q, py = hy - 12 + (ty - 12 - hy + 12) * q, ang = Math.atan2(ty - hy, tx - hx);
      for (let i = 1; i <= 3; i++) { const dd = i * 3.2, sz = 2.2 - i * 0.45; ctx.globalAlpha = 0.55 - i * 0.14; ctx.fillStyle = i === 1 ? '#fff6dc' : '#ffe2a8'; ctx.fillRect(px - Math.cos(ang) * dd - sz / 2, py - Math.sin(ang) * dd - sz / 2, sz, sz); }
      ctx.globalAlpha = 1; blit(ctx, B.seed[Math.floor(t * 12 + k) % 6], px, py + 2);
    }
    const bt = ((t * 0.9) % 1) * 1.1;
    for (let i = 0; i < 14; i++) {
      const a = hash2(i, 1, 9) * TAU, sp = 70 * (0.35 + hash2(i, 2, 9) * 0.8), vz = 110 * (0.5 + hash2(i, 3, 9) * 0.8), z = Math.max(0, 6 + vz * bt - 160 * bt * bt);
      const x = tx + Math.cos(a) * sp * bt * 0.7, y = ty + Math.sin(a) * sp * 0.6 * bt * 0.7, sz = 2.3 * (0.7 + hash2(i, 4, 9) * 0.6) / 2;
      ctx.globalAlpha = bt > 0.8 ? Math.max(0, (1.1 - bt) / 0.3) : 1;
      blit(ctx, B.cubes[i % 5][Math.floor(t * 8 + i) % 6], x, y - z + sz, sz, sz);
    }
    const rk = 1 - Math.min(1, bt / 0.5), rr = 10 + 38 * (1 - (1 - (1 - rk)) ** 2);
    if (rk > 0) { ctx.globalAlpha = rk * 0.85; ctx.strokeStyle = '#fff1c8'; ctx.lineWidth = 3 * rk + 0.4; ctx.strokeRect(tx - rr, ty - rr * SP, rr * 2, rr * 2 * SP); } ctx.globalAlpha = 1;
    const age = (t * 0.7) % 1, pop = age < 0.12 ? 0.6 + (age / 0.12) * 0.55 : 1.15 - Math.min(0.15, (age - 0.12) * 0.6); // floating number
    ctx.font = Math.round(9 * pop * 2) / 2 + "px 'Bungee', 'Chakra Petch', system-ui, sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = clamp((1 - age) * 3, 0, 1); ctx.fillStyle = '#5a200a'; ctx.fillText('34!', 175.3, 26 - age * 14); ctx.fillStyle = '#ffc23e'; ctx.fillText('34!', 175, 25 - age * 14); ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(vignette(w, h), 0, 0, w, h);
    const u = h / 540, X = 14 * u, Y = 14 * u, PW = 250 * u, PH = 44 * u; // HUD panel: flat purple slab, 3 px dark edge, hard bevel
    ctx.fillStyle = PALETTE.edge; ctx.fillRect(X - 3 * u, Y - 3 * u, PW + 6 * u, PH + 9 * u);
    ctx.fillStyle = PALETTE.panel; ctx.fillRect(X, Y, PW, PH);
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(X, Y, PW, 3 * u); ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fillRect(X, Y + PH - 4 * u, PW, 4 * u);
    const bx = X + 12 * u, by = Y + 11 * u, bw = 150 * u, bh = 20 * u;
    ctx.fillStyle = '#160f22'; ctx.fillRect(bx, by, bw, bh);
    for (const [f0, f1, col] of [[0, 0.22, '#ffb09a'], [0.22, 0.7, '#f0443a'], [0.7, 1, '#b3242a']]) { ctx.fillStyle = col; ctx.fillRect(bx, by + bh * f0, bw * 0.86, bh * (f1 - f0) + 0.5); }
    ctx.fillStyle = 'rgba(50,8,16,.8)'; for (let sx = 15 * u; sx < bw * 0.86; sx += 18 * u) ctx.fillRect(bx + sx, by, 3 * u, bh);
    ctx.font = 15 * u + "px 'Bungee', 'Chakra Petch', system-ui, sans-serif"; ctx.textAlign = 'left'; ctx.fillStyle = PALETTE.edge; ctx.fillText('86/100', bx + bw + 9 * u, by + bh / 2 + 2 * u); ctx.fillStyle = '#fff'; ctx.fillText('86/100', bx + bw + 9 * u, by + bh / 2);
  }

  const Starter = { id: 'voxel', name: 'Voxel Cube World', palette: PALETTE, fonts: ['Bungee', 'Chakra Petch'], drawHero, drawEnemy, draw, Vox, renderVox, renderShadow };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['voxel'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
