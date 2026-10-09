/* Voxel-Würfelwelt ("voxel") – a MagicaVoxel-style miniature autumn world made of little cubes.
   Every character, prop, pickup, particle and HUD icon is a real 3D voxel grid that is rendered once in init()
   by a tiny software voxel renderer (yaw -> 3/4 orthographic projection -> per-face 3-tone shading with a fixed sun,
   per-voxel colour jitter, neighbour ambient occlusion, painter's sort) into sprite canvases.
   The ground is a flat voxel terrain: 4x4 world-unit top faces with per-voxel colour variation, 1-voxel height steps
   that show their side faces + a lit edge, blocky sun shadows from the west, and tiny voxel decals. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const hex = U.hex, clamp = U.clamp;

  /* ================================ camera ================================ */
  const PITCH = (46 * Math.PI) / 180;
  const SP = Math.sin(PITCH), CP = Math.cos(PITCH); // ground depth factor / height factor
  const SHX = 0.62, SHY = 0.26; // sun shadow offset per unit of height (sun from the upper left)

  let K = 2.5; // sprite pixels per world unit
  let VSC = 2.5; // current view scale (for pixel snapping)
  let PPV = 5; // sprite pixels per voxel (characters + props)
  let VW = 2; // world units per voxel (= PPV / K)

  /* ================================ colours ================================ */
  const COLS = [null];
  const colIds = new Map();
  /** Register a voxel colour. o: { em: emissive, jit: per-voxel brightness jitter } */
  function C(h, o) {
    const key = h + (o ? (o.em ? 'e' : '') + (o.jit !== undefined ? 'j' + o.jit : '') : '');
    let id = colIds.get(key);
    if (id) return id;
    id = COLS.length;
    COLS.push({ c: hex(h), em: !!(o && o.em), jit: o && o.jit !== undefined ? o.jit : 0.045 });
    colIds.set(key, id);
    return id;
  }
  const strCache = new Map();
  function cstr(r, g, b) {
    r = clamp(r, 0, 255) | 0; g = clamp(g, 0, 255) | 0; b = clamp(b, 0, 255) | 0;
    const k = (r << 16) | (g << 8) | b;
    let s = strCache.get(k);
    if (!s) { s = 'rgb(' + r + ',' + g + ',' + b + ')'; strCache.set(k, s); }
    return s;
  }
  const rnd3 = (x, y, z, s) => U.hashInt(x * 73 + z * 9301, y * 19 + z * 7, s) / 4294967296;

  /* ================================ voxel grid ================================ */
  class Vox {
    constructor(w, d, h, seed = 1) {
      this.w = w; this.d = d; this.h = h; this.seed = seed;
      this.a = new Uint16Array(w * d * h);
    }
    in(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.d && z < this.h; }
    get(x, y, z) { return this.in(x, y, z) ? this.a[(z * this.d + y) * this.w + x] : 0; }
    set(x, y, z, c) {
      x |= 0; y |= 0; z |= 0;
      if (!this.in(x, y, z)) return this;
      const v = typeof c === 'function' ? c(x, y, z) : c;
      if (v === undefined || v === null || v < 0) return this;
      this.a[(z * this.d + y) * this.w + x] = v;
      return this;
    }
    box(x0, y0, z0, x1, y1, z1, c) {
      for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, z, c);
      return this;
    }
    /** Super-ellipsoid (p = 2 ellipsoid, p = 4 rounded box). Centre in voxel-edge coordinates. */
    blob(cx, cy, cz, rx, ry, rz, c, p = 2) {
      const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry), z0 = Math.floor(cz - rz), z1 = Math.ceil(cz + rz);
      for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = Math.abs((x + 0.5 - cx) / rx), dy = Math.abs((y + 0.5 - cy) / ry), dz = Math.abs((z + 0.5 - cz) / rz);
        if (Math.pow(dx, p) + Math.pow(dy, p) + Math.pow(dz, p) <= 1) this.set(x, y, z, c);
      }
      return this;
    }
    /** Front-most (max y) occupied voxel in column (x, z), -1 if none. */
    front(x, z) {
      for (let y = this.d - 1; y >= 0; y--) if (this.get(x, y, z)) return y;
      return -1;
    }
    paintFront(x, z, c) { const y = this.front(x, z); if (y >= 0) this.set(x, y, z, c); return this; }
    /** Recolour existing voxels. */
    recolor(fn) {
      for (let z = 0; z < this.h; z++) for (let y = 0; y < this.d; y++) for (let x = 0; x < this.w; x++) {
        const i = (z * this.d + y) * this.w + x, v = this.a[i];
        if (!v) continue;
        const n = fn(x, y, z, v);
        if (n !== undefined && n !== null) this.a[i] = n;
      }
      return this;
    }
  }

  /* ================================ voxel renderer ================================ */
  const FACES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  function prep(yaw, ppv) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const R = (x, y) => [x * c + y * s, -x * s + y * c];
    const proj = (x, y, z) => { const r = R(x, y); return [r[0] * ppv, (r[1] * SP - z * CP) * ppv]; };
    const ex = 1 + 0.8 / ppv;
    const faces = [];
    for (const n of FACES) {
      const rn = R(n[0], n[1]);
      const vis = rn[1] * CP + n[2] * SP;
      if (vis <= 1e-3) continue;
      const a = n[0] ? 0 : n[1] ? 1 : 2, b = (a + 1) % 3, cc = (a + 2) % 3;
      const fc = proj(n[0] * 0.5, n[1] * 0.5, n[2] * 0.5);
      const pts = [];
      for (const [u, v] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) {
        const p = [0, 0, 0]; p[a] = n[a] * 0.5; p[b] = u; p[cc] = v;
        const q = proj(p[0], p[1], p[2]);
        pts.push(fc[0] + (q[0] - fc[0]) * ex, fc[1] + (q[1] - fc[1]) * ex);
      }
      const t1 = [0, 0, 0], t2 = [0, 0, 0]; t1[b] = 1; t2[cc] = 1;
      const top = n[2] === 1;
      faces.push({ n, pts, top, tone: top ? 1 : 0.76 - 0.15 * rn[0], t1, t2 });
    }
    return { R, proj, faces };
  }

  /** Render a voxel model -> { c, ax, ay } (anchor = model origin: centre of the footprint at z = 0). */
  function renderVox(m, yaw, ppv, o = {}) {
    const P = prep(yaw, ppv);
    const w = m.w, d = m.d, h = m.h, A = m.a;
    const ox = o.ox !== undefined ? o.ox : w / 2, oy = o.oy !== undefined ? o.oy : d / 2;
    const items = [];
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (let z = 0; z < h; z++) for (let y = 0; y < d; y++) for (let x = 0; x < w; x++) {
      const id = A[(z * d + y) * w + x];
      if (!id) continue;
      let exposed = false;
      for (const f of P.faces) if (!m.get(x + f.n[0], y + f.n[1], z + f.n[2])) { exposed = true; break; }
      if (!exposed) continue;
      const X = x + 0.5 - ox, Y = y + 0.5 - oy, Z = z + 0.5;
      const r = P.R(X, Y);
      const sx = r[0] * ppv, sy = (r[1] * SP - Z * CP) * ppv;
      items.push({ x, y, z, id, sx, sy, dep: r[1] * CP + Z * SP });
      if (sx < minX) minX = sx; if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
    }
    items.sort((p, q) => p.dep - q.dep);
    const pad = Math.ceil(ppv * 1.1) + 2;
    const ax = Math.ceil(-minX) + pad, ay = Math.ceil(-minY) + pad;
    const cw = Math.ceil(maxX - minX) + pad * 2 + 1, ch = Math.ceil(maxY - minY) + pad * 2 + 1;
    const { c, ctx } = U.canvas(cw, ch);
    const lift = o.lift || 0;
    const aoK = o.ao !== undefined ? o.ao : 0.075;
    for (const it of items) {
      const col = COLS[it.id];
      const j = 1 + (rnd3(it.x, it.y, it.z, m.seed) - 0.5) * 2 * col.jit;
      const cx = ax + it.sx, cy = ay + it.sy;
      for (const f of P.faces) {
        const nx = it.x + f.n[0], ny = it.y + f.n[1], nz = it.z + f.n[2];
        if (m.get(nx, ny, nz)) continue;
        let r, g, b;
        const cc = col.c;
        if (col.em) {
          const k = j * (f.top ? 1.02 : 0.95);
          r = cc[0] * k; g = cc[1] * k; b = cc[2] * k;
        } else {
          let ao = 1;
          if (aoK) {
            if (m.get(nx + f.t1[0], ny + f.t1[1], nz + f.t1[2])) ao -= aoK;
            if (m.get(nx - f.t1[0], ny - f.t1[1], nz - f.t1[2])) ao -= aoK;
            if (m.get(nx + f.t2[0], ny + f.t2[1], nz + f.t2[2])) ao -= aoK;
            if (m.get(nx - f.t2[0], ny - f.t2[1], nz - f.t2[2])) ao -= aoK;
            if (!f.top && it.z === 0 && !o.noGround) ao *= 0.9;
          }
          let tone = f.tone;
          if (lift) tone += (1 - tone) * lift;
          const k = j * tone * ao;
          if (f.top) { r = cc[0] * k * 1.035; g = cc[1] * k * 1.015; b = cc[2] * k * 0.965; }
          else {
            const cool = (1 - tone) * 0.45;
            r = cc[0] * k * (1 - cool * 0.25); g = cc[1] * k * (1 - cool * 0.1); b = cc[2] * k * (1 + cool * 0.5) + cool * 14;
          }
        }
        ctx.fillStyle = cstr(r, g, b);
        const p = f.pts;
        ctx.beginPath();
        ctx.moveTo(cx + p[0], cy + p[1]); ctx.lineTo(cx + p[2], cy + p[3]);
        ctx.lineTo(cx + p[4], cy + p[5]); ctx.lineTo(cx + p[6], cy + p[7]);
        ctx.closePath();
        ctx.fill();
      }
    }
    return { c, ax, ay, ppv };
  }

  /** Blocky sun shadow of a model projected onto the ground (same anchor convention). */
  function renderShadow(m, yaw, ppv, o = {}) {
    const P = prep(yaw, ppv);
    const w = m.w, d = m.d, h = m.h;
    const ox = w / 2, oy = d / 2;
    const zoff = o.zoff || 0;
    const quads = [], contact = [];
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    const push = (arr, x, y, zz) => {
      const q = [];
      for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const r = P.R(x + u - ox, y + v - oy);
        const X = (r[0] + (zz + zoff) * SHX) * ppv, Y = (r[1] + (zz + zoff) * SHY) * SP * ppv;
        q.push(X, Y);
        if (X < minX) minX = X; if (X > maxX) maxX = X; if (Y < minY) minY = Y; if (Y > maxY) maxY = Y;
      }
      arr.push(q);
    };
    for (let z = 0; z < h; z++) for (let y = 0; y < d; y++) for (let x = 0; x < w; x++) {
      if (!m.get(x, y, z)) continue;
      const surf = !m.get(x, y, z + 1) || !m.get(x + 1, y, z) || !m.get(x - 1, y, z) || !m.get(x, y + 1, z) || !m.get(x, y - 1, z);
      if (!surf) continue;
      push(quads, x, y, z); push(quads, x, y, z + 1);
      if (z + zoff <= 1.5) push(contact, x, y, z);
    }
    if (!quads.length) return null;
    const pad = Math.ceil(ppv * 0.8) + 3;
    const ax = Math.ceil(-minX) + pad, ay = Math.ceil(-minY) + pad;
    const cw = Math.ceil(maxX - minX) + pad * 2, ch = Math.ceil(maxY - minY) + pad * 2;
    const draw = (arr) => {
      const L = U.canvas(cw, ch);
      L.ctx.fillStyle = '#000';
      for (const q of arr) {
        L.ctx.beginPath();
        L.ctx.moveTo(ax + q[0], ay + q[1]); L.ctx.lineTo(ax + q[2], ay + q[3]); L.ctx.lineTo(ax + q[4], ay + q[5]); L.ctx.lineTo(ax + q[6], ay + q[7]);
        L.ctx.closePath(); L.ctx.fill();
      }
      return L.c;
    };
    const { c, ctx } = U.canvas(cw, ch);
    const main = draw(quads);
    if (canFilter) ctx.filter = 'blur(' + (ppv * 0.16).toFixed(2) + 'px)';
    ctx.globalAlpha = 0.62;
    ctx.drawImage(main, 0, 0);
    if (contact.length) { ctx.globalAlpha = 0.55; ctx.drawImage(draw(contact), 0, 0); }
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    return { c, ax, ay };
  }
  const canFilter = (() => { try { return 'filter' in document.createElement('canvas').getContext('2d'); } catch (e) { return false; } })();

  /** World-space blit with pixel snapping (sprite rendered at K px per world unit). */
  function blit(ctx, s, x, y) {
    const w = s.c.width / K, hh = s.c.height / K;
    ctx.drawImage(s.c, Math.round(x * VSC - (s.ax * VSC) / K) / VSC, Math.round(y * VSC - (s.ay * VSC) / K) / VSC, w, hh);
  }
  function blitScaled(ctx, s, x, y, sx, sy) {
    const w = (s.c.width / K) * sx, hh = (s.c.height / K) * sy;
    ctx.drawImage(s.c, x - (s.ax / K) * sx, y - (s.ay / K) * sy, w, hh);
  }

  /* ================================ palette ================================ */
  const P = {};
  function buildPalette() {
    Object.assign(P, {
      pk: C('#f7842a'), carve: C('#8a3412'), pkDk: C('#e86f22'), pkLt: C('#fb9036'), stem: C('#5b7a2a'), stemDk: C('#47621f'), leafG: C('#7cc24a'),
      face: C('#ffd84a', { em: 1, jit: 0.03 }), faceHot: C('#fff1a2', { em: 1, jit: 0.02 }), mouth: C('#ffc23a', { em: 1, jit: 0.03 }),
      cloak: C('#36325f'), cloakDk: C('#27234a'), cloakLt: C('#4c4787'), shirt: C('#efe2c4'), scarf: C('#22b8a2'), scarfDk: C('#178c7c'),
      pants: C('#5b4232'), boot: C('#2c221e'), glove: C('#7d5634'),
      tPur: C('#9b54d2'), tPurDk: C('#7a3db2'), tPurLt: C('#b672e2'), tCream: C('#f4e9cc'), tCreamDk: C('#ddcfa8'), tRoot: C('#c9a46c'),
      tLeaf: C('#5fbe3b'), tLeafDk: C('#3e8f2b'), tEye: C('#ff4a2c', { em: 1, jit: 0.02 }), tBrow: C('#3a1a50'),
      gW: C('#f6faff', { jit: 0.025 }), gMid: C('#dfe9f8', { jit: 0.025 }), gIce: C('#b8d6f3', { jit: 0.03 }), gDeep: C('#94bfea'), gHole: C('#1c2044', { jit: 0.02 }), gMouth: C('#3c1a3e', { jit: 0.02 }), gFrost: C('#e2f6ff', { em: 1, jit: 0.02 }),
      cPur: C('#6c3e88'), cPurDk: C('#54306b'), cPurLt: C('#81509e'), cBr: C('#946a42'), cBrDk: C('#6f4b2d'), cRoot: C('#5c3f27'),
      cCrack: C('#ff9a2a', { em: 1, jit: 0.05 }), cCrackHot: C('#ffd36a', { em: 1, jit: 0.03 }), cEye: C('#ffef8a', { em: 1, jit: 0.02 }), cLeaf: C('#4b8a3a'), cLeafDk: C('#356b2f'), cMouth: C('#24122c', { jit: 0.02 }),
      wood: C('#b07a46'), woodDk: C('#7c5230'), woodLt: C('#c9965c'), bark: C('#7a5236'), barkDk: C('#5f3f29'),
      pine: C('#2f6e4c'), pineDk: C('#255a3e'), pineLt: C('#3d8659'),
      hay: C('#ebc75c'), hayDk: C('#d3aa45'), hayLt: C('#f6dc84'),
      stone: C('#a9abb2'), stoneDk: C('#8a8d97'), stoneLt: C('#c3c4c8'), moss: C('#7f9a52'), engr: C('#5e606b'),
      rock: C('#9a9ca4'), rockDk: C('#80838d'),
      bush: C('#4f9a3c'), bushDk: C('#3e7f31'), berry: C('#e2423a'),
      lamp: C('#ffcf5a', { em: 1, jit: 0.03 }), lampHot: C('#fff3b8', { em: 1, jit: 0.02 }), iron: C('#3b3540'), ironLt: C('#5a5262'),
      mushCap: C('#e2463a'), mushDot: C('#fff6e8'), mushStem: C('#f0e3c6'),
      seed: C('#f8edd2', { jit: 0.03 }), seedDk: C('#dcc394', { jit: 0.03 }),
      gem: C('#5df0b6', { jit: 0.04 }), gemLt: C('#b6ffe0', { jit: 0.03 }), gemDk: C('#2fc596', { jit: 0.04 }),
      gold: C('#ffc43a', { jit: 0.04 }), goldLt: C('#fff0a0', { jit: 0.03 }), goldDk: C('#e8932a', { jit: 0.04 }),
      heart: C('#ee3b4e'), heartDk: C('#c42a40'), heartLt: C('#ff8b96'),
      white: C('#ffffff', { jit: 0.02 }), steam: C('#eef2f6', { jit: 0.03 }), pot: C('#3f3a46'), potLt: C('#5c5666'),
      glass: C('#bdf0ff', { jit: 0.03 }), glassDk: C('#7fd0ef', { jit: 0.03 }), glassLt: C('#ecfdff', { jit: 0.02 }),
      bolt: C('#ffd23a', { jit: 0.03 }), boltDk: C('#f0a020', { jit: 0.03 }),
      spring: C('#b4bac6'), springDk: C('#858c9a'), sack: C('#b88b5a'), sackDk: C('#946b42'), rope: C('#d9b77a'),
      wicker: C('#c08a4a'), wickerDk: C('#9c6a34'),
    });
  }

  /* ================================ models ================================ */
  /** Pumpkin rib colouring for a sphere around (cx, cy). */
  function ribCol(cx, cy, zTop, base, dk, lt) {
    return (x, y, z) => {
      const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx);
      if (z >= zTop) return lt;
      return Math.cos(a * 5) > 0.55 ? dk : base;
    };
  }

  // Jack: 10 x 9 x 18. frame 0 = idle, 1..4 walk
  function jackModel(f) {
    const m = new Vox(10, 9, 18, 11);
    const legY = [0, 1, 0, -1, 0][f], lift = [0, 0, 1, 0, 1][f];
    const armY = -legY;
    // legs
    const legL = 2 + lift, legR = 2 + lift;
    const raiseL = f === 4 ? 1 : 0, raiseR = f === 2 ? 1 : 0;
    m.box(3, 4 + legY, raiseL, 4, 5 + legY, legL, (x, y, z) => (z === raiseL ? P.boot : P.pants));
    m.box(5, 4 - legY, raiseR, 6, 5 - legY, legR, (x, y, z) => (z === raiseR ? P.boot : P.pants));
    const b = 3 + lift;
    // cloak body with flared hem
    m.box(1, 2, b, 8, 7, b, (x, y) => ((x === 1 || x === 8 || y === 2 || y === 7) ? P.cloakDk : P.cloak));
    m.box(2, 2, b + 1, 7, 6, b + 3, P.cloak);
    m.box(4, 6, b + 1, 5, 6, b + 3, (x, y, z) => (z === b + 3 ? P.shirt : P.cloakLt));
    m.set(4, 7, b, P.cloakLt); m.set(5, 7, b, P.cloakLt);
    // arms
    m.box(1, 3 + armY, b + 1, 1, 4 + armY, b + 3, P.cloak);
    m.box(8, 3 - armY, b + 1, 8, 4 - armY, b + 3, P.cloak);
    m.box(1, 3 + armY, b, 1, 4 + armY, b, P.glove);
    m.box(8, 3 - armY, b, 8, 4 - armY, b, P.glove);
    // scarf + tail
    m.box(2, 2, b + 4, 7, 6, b + 4, (x, y) => ((x + y) % 3 === 0 ? P.scarfDk : P.scarf));
    m.box(6, 1, b + 2, 7, 1, b + 4, P.scarf);
    m.set(7, 1, b + 1, P.scarfDk);
    // pumpkin head
    const hz = b + 8.6;
    m.blob(5, 4.5, hz, 5.05, 4.4, 3.75, ribCol(5, 4.5, hz + 3.0, P.pk, P.pkDk, P.pkLt), 2.6);
    // stem + leaf
    const top = Math.floor(hz + 3.6);
    m.box(4, 4, top, 5, 4, top + 1, (x, y, z) => (z === top + 1 && x === 5 ? P.stemDk : P.stem));
    m.set(4, 4, top + 2, P.stem);
    m.set(6, 4, top, P.leafG); m.set(7, 4, top, P.leafG); m.set(7, 3, top + 1, P.leafG);
    // carved glowing face
    const ez = Math.round(hz) + 1;
    const face = [
      [2, ez + 1], [7, ez + 1],
      [1, ez], [2, ez], [3, ez], [6, ez], [7, ez], [8, ez],
      [2, ez - 2], [3, ez - 2], [5, ez - 2], [6, ez - 2], [7, ez - 2],
      [3, ez - 3], [4, ez - 3], [5, ez - 3], [6, ez - 3],
    ];
    const fset = new Set(face.map(([x, z]) => x + ',' + z));
    for (const [x, z] of face) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!fset.has(x + dx + ',' + (z + dz))) m.paintFront(x + dx, z + dz, P.carve);
    }
    for (const [x, z] of face) m.paintFront(x, z, z >= ez ? P.face : P.mouth);
    m.paintFront(2, ez, P.faceHot); m.paintFront(7, ez, P.faceHot);
    return m;
  }

  // Rüben-Schleicher: 10 x 10 x 15
  function creeperModel(f) {
    const m = new Vox(10, 10, 15, 23);
    const legY = [1, 0, -1, 0][f], lift = [0, 1, 0, 1][f], sway = [0, 1, 0, -1][f];
    m.box(3, 5 + legY, 0, 3, 5 + legY, 1 + lift, P.tRoot);
    m.box(6, 5 - legY, 0, 6, 5 - legY, 1 + lift, P.tRoot);
    if (!lift) { m.set(3, 6 + legY, 0, P.tRoot); m.set(6, 6 - legY, 0, P.tRoot); }
    const cz = 6.3 + lift;
    m.blob(5, 5, cz, 4.7, 4.5, 4.4, (x, y, z) => {
      const t = z + 0.5 - cz + (rnd3(x, y, z, 5) - 0.5) * 1.6;
      if (t > 1.6) return z + 0.5 > cz + 3.4 ? P.tPurDk : (rnd3(x, y, z, 9) < 0.18 ? P.tPurLt : P.tPur);
      if (t > 0.4) return rnd3(x, y, z, 3) < 0.5 ? P.tPur : P.tCream;
      return z + 0.5 < cz - 2.8 ? P.tCreamDk : P.tCream;
    });
    m.set(5, 5, Math.floor(cz - 4.4) , P.tRoot); m.set(4, 5, Math.floor(cz - 4.4), P.tCreamDk);
    // leaf tuft
    const tz = Math.floor(cz + 4.3);
    m.box(4, 5, tz, 5, 5, tz + 1, P.tLeafDk);
    m.box(2 + sway, 4, tz + 2, 3 + sway, 5, tz + 3, P.tLeaf); m.set(1 + sway, 4, tz + 4, P.tLeaf); m.set(4, 5, tz + 2, P.tLeafDk);
    m.box(6 + sway, 5, tz + 2, 7 + sway, 6, tz + 3, P.tLeaf); m.set(8 + sway, 6, tz + 4, P.tLeaf); m.set(5, 5, tz + 2, P.tLeafDk);
    m.box(4 + sway, 3, tz + 3, 5 + sway, 3, tz + 5, P.tLeafDk); m.set(5 + sway, 3, tz + 6, P.tLeaf);
    // angry face
    const ez = Math.round(cz) + 1;
    m.paintFront(3, ez, P.tEye); m.paintFront(6, ez, P.tEye);
    m.paintFront(3, ez + 1, P.tBrow); m.paintFront(4, ez + 1, P.tBrow); m.paintFront(5, ez + 1, P.tBrow); m.paintFront(6, ez + 1, P.tBrow);
    m.paintFront(4, ez - 2, P.tBrow); m.paintFront(5, ez - 2, P.tBrow);
    return m;
  }

  // Hungergeist: 11 x 9 x 15
  function ghostModel(f) {
    const m = new Vox(11, 9, 15, 37);
    const sw = [0, 0.8, 0, -0.8][f], arm = [0, 1, 0, -1][f];
    const hz = 10.2;
    m.blob(5.5, 4.5, hz, 4.4, 3.7, 3.9, (x, y, z) => (z + 0.5 > hz + 2.4 ? (rnd3(x, y, z, 2) < 0.3 ? P.gFrost : P.gW) : P.gW));
    for (let z = 1; z <= 7; z++) {
      const r = 0.9 + (z - 1) * 0.55;
      const cx = 5.5 + sw * (7 - z) * 0.35 + (z < 3 ? sw * 0.6 : 0);
      m.blob(cx, 4.5 - (7 - z) * 0.12, z + 0.5, r, r * 0.85, 0.55, z < 3 ? P.gDeep : z < 5 ? P.gIce : P.gMid);
    }
    // little tail curl
    m.set(Math.round(5.5 + sw * 2.6), 4, 0, P.gDeep);
    // arms reaching forward
    m.box(0, 5, 7 + (arm > 0 ? 1 : 0), 1, 7, 7 + (arm > 0 ? 1 : 0), P.gMid);
    m.box(9, 5, 7 + (arm < 0 ? 1 : 0), 10, 7, 7 + (arm < 0 ? 1 : 0), P.gMid);
    m.set(0, 8, 7 + (arm > 0 ? 1 : 0), P.gIce); m.set(10, 8, 7 + (arm < 0 ? 1 : 0), P.gIce);
    // hollow eyes + gaping mouth
    const ez = Math.round(hz) + 1;
    for (const [x, z] of [[3, ez], [4, ez], [3, ez - 1], [4, ez - 1], [6, ez], [7, ez], [6, ez - 1], [7, ez - 1]]) m.paintFront(x, z, P.gHole);
    for (const [x, z] of [[5, ez - 3], [4, ez - 4], [5, ez - 4], [6, ez - 4], [5, ez - 5], [4, ez - 3], [6, ez - 3]]) m.paintFront(x, z, z === ez - 5 ? P.gMouth : P.gHole);
    return m;
  }

  // Steckrüben-Koloss: 19 x 16 x 25
  function colossusModel(f) {
    const m = new Vox(19, 16, 25, 51);
    const legY = [1, 0, -1, 0][f], lift = [0, 1, 0, 1][f], armY = -legY;
    m.box(4, 6 + legY, 0, 7, 9 + legY, 4 + lift, (x, y, z) => (z === 0 ? P.cRoot : P.cBrDk));
    m.box(11, 6 - legY, 0, 14, 9 - legY, 4 + lift, (x, y, z) => (z === 0 ? P.cRoot : P.cBrDk));
    m.set(3, 9 + legY, 0, P.cRoot); m.set(15, 9 - legY, 0, P.cRoot);
    const cz = 12.5 + lift;
    m.blob(9.5, 8, cz, 7.6, 6.6, 8.4, (x, y, z) => {
      const t = z + 0.5 - cz + (rnd3(x, y, z, 7) - 0.5) * 2.2;
      const sp = rnd3(x, y, z, 13);
      if (t > 1.5) return sp < 0.16 ? P.cPurDk : sp > 0.9 ? P.cPurLt : P.cPur;
      if (t > 0) return sp < 0.5 ? P.cPur : P.cBr;
      return sp < 0.18 ? P.cBrDk : P.cBr;
    }, 2.4);
    // arms + fists
    m.box(0, 6 + armY, Math.floor(cz) - 3, 2, 9 + armY, Math.floor(cz) + 3, (x, y, z) => (rnd3(x, y, z, 4) < 0.3 ? P.cPurDk : P.cPur));
    m.box(16, 6 - armY, Math.floor(cz) - 3, 18, 9 - armY, Math.floor(cz) + 3, (x, y, z) => (rnd3(x, y, z, 4) < 0.3 ? P.cPurDk : P.cPur));
    m.box(0, 6 + armY, Math.floor(cz) - 6, 2, 9 + armY, Math.floor(cz) - 4, P.cBrDk);
    m.box(16, 6 - armY, Math.floor(cz) - 6, 18, 9 - armY, Math.floor(cz) - 4, P.cBrDk);
    m.set(1, 8 + armY, Math.floor(cz) - 7, P.cRoot); m.set(17, 7 - armY, Math.floor(cz) - 7, P.cRoot);
    // leaf crown
    const tz = Math.floor(cz + 7.6);
    m.box(8, 7, tz, 10, 9, tz + 1, P.cLeafDk);
    m.box(5, 7, tz + 2, 7, 8, tz + 4, P.cLeaf); m.box(4, 7, tz + 5, 5, 7, tz + 5, P.cLeaf);
    m.box(11, 8, tz + 2, 13, 9, tz + 4, P.cLeaf); m.box(13, 9, tz + 5, 14, 9, tz + 5, P.cLeaf);
    m.box(9, 6, tz + 2, 10, 6, tz + 5, P.cLeafDk); m.set(9, 6, tz + 6, P.cLeaf);
    // glowing cracks
    const cracks = [
      [[5, 17], [6, 16], [6, 15], [7, 14], [7, 13], [6, 12], [6, 11], [7, 10], [7, 9]],
      [[13, 18], [13, 17], [12, 16], [12, 15], [13, 14], [13, 13], [12, 12]],
      [[10, 9], [10, 8], [11, 7], [11, 6]],
    ];
    for (const cr of cracks) for (const [x, z] of cr) m.paintFront(x, z + lift, (z & 1) ? P.cCrack : P.cCrackHot);
    // eyes + brow + mouth
    const ez = Math.round(cz) + 3;
    for (const x of [6, 7, 11, 12]) m.paintFront(x, ez, P.cEye);
    for (const x of [5, 6, 7, 8, 10, 11, 12, 13]) m.paintFront(x, ez + 1, P.cPurDk);
    for (const x of [7, 8, 9, 10, 11]) m.paintFront(x, ez - 3, P.cMouth);
    m.paintFront(8, ez - 4, P.cMouth); m.paintFront(10, ez - 4, P.cMouth); m.paintFront(9, ez - 3, P.cCrack);
    return m;
  }

  function lanternModel() {
    const m = new Vox(8, 8, 11, 61);
    m.blob(4, 4, 4.2, 3.7, 3.6, 3.5, (x, y, z) => (z >= 5 ? (rnd3(x, y, z, 1) < 0.2 ? P.tPurDk : P.tPur) : z >= 4 ? (rnd3(x, y, z, 2) < 0.5 ? P.tPur : P.tCream) : P.tCream));
    for (const [x, z] of [[2, 5], [5, 5], [2, 3], [3, 3], [4, 3], [5, 3], [3, 2], [4, 2]]) m.paintFront(x, z, z === 5 ? P.faceHot : P.face);
    m.box(3, 4, 8, 4, 4, 8, P.tLeafDk);
    m.box(2, 3, 9, 2, 4, 9, P.tLeaf); m.box(5, 4, 9, 5, 5, 9, P.tLeaf); m.set(1, 3, 10, P.tLeaf); m.set(6, 5, 10, P.tLeaf);
    return m;
  }
  function seedModel() {
    const m = new Vox(3, 2, 4, 3);
    m.box(0, 0, 0, 2, 1, 2, (x, y, z) => (x === 1 || z === 1 ? P.seed : P.seedDk));
    m.set(1, 0, 3, P.seed); m.set(1, 1, 3, P.seed);
    return m;
  }
  function gemModel(big) {
    const n = big ? 7 : 5, hgt = big ? 10 : 7;
    const m = new Vox(n, n, hgt, big ? 71 : 73);
    const c = n / 2;
    for (let z = 0; z < hgt; z++) {
      const t = z / (hgt - 1);
      const r = (t < 0.45 ? t / 0.45 : (1 - t) / 0.55) * (n / 2 - 0.2) + 0.5;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (Math.abs(x + 0.5 - c) + Math.abs(y + 0.5 - c) <= r) {
          const top = t > 0.45;
          m.set(x, y, z, big ? (top ? (z === hgt - 1 || rnd3(x, y, z, 1) < 0.3 ? P.goldLt : P.gold) : P.goldDk) : (top ? (z === hgt - 1 || rnd3(x, y, z, 1) < 0.3 ? P.gemLt : P.gem) : P.gemDk));
        }
      }
    }
    return m;
  }

  /* -------- props -------- */
  const CROWN_COLS = () => [
    [C('#f08a2c'), C('#e2701f'), C('#f7a845'), C('#d45f1d')],
    [C('#df4c34'), C('#c93a2c'), C('#ec6a45'), C('#b02f28')],
    [C('#f0c03e'), C('#e2a52f'), C('#f8d867'), C('#d4902a')],
  ];
  function treeModel(v) {
    const cols = CROWN_COLS()[v];
    const m = new Vox(15, 15, 24, 100 + v);
    const r = U.rng(500 + v * 17);
    m.box(6, 6, 0, 8, 8, 10, (x, y, z) => (rnd3(x, y, z, 3) < 0.3 ? P.barkDk : P.bark));
    m.set(5, 7, 0, P.bark); m.set(9, 6, 0, P.bark); m.set(7, 9, 0, P.barkDk);
    m.box(9, 7, 7, 11, 7, 7, P.bark); m.set(11, 7, 8, P.bark);
    const pick = (x, y, z) => {
      const h = rnd3(x, y, z, 11);
      return z >= 19 ? (h < 0.5 ? cols[2] : cols[0]) : h < 0.12 ? cols[3] : h < 0.45 ? cols[1] : h < 0.6 ? cols[2] : cols[0];
    };
    m.blob(7.5, 7.5, 15, 6.6, 6.4, 5.2, pick, 3.2);
    for (let i = 0; i < 4; i++) {
      const a = r.next() * TAU, d = 3 + r.next() * 2;
      m.blob(7.5 + Math.cos(a) * d, 7.5 + Math.sin(a) * d, 14 + r.next() * 5, 2.6 + r.next(), 2.6 + r.next(), 2.4, pick, 3);
    }
    m.blob(7.5, 7.5, 20.3, 4, 4, 2.4, pick, 3);
    return m;
  }
  function pineModel() {
    const m = new Vox(13, 13, 25, 130);
    m.box(5, 5, 0, 7, 7, 4, P.barkDk);
    const tiers = [[3, 6, 6.2], [7, 10, 5], [11, 14, 3.8], [15, 18, 2.6], [19, 21, 1.5]];
    for (const [z0, z1, r] of tiers) {
      for (let z = z0; z <= z1; z++) {
        const rr = r - (z - z0) * 0.55;
        m.blob(6.5, 6.5, z + 0.5, rr, rr, 0.55, (x, y, zz) => (zz === z0 ? P.pineDk : rnd3(x, y, zz, 4) < 0.2 ? P.pineLt : P.pine), 2.6);
      }
    }
    m.box(6, 6, 22, 6, 6, 23, P.pineLt);
    return m;
  }
  function pumpkinModel(big, carved) {
    const s = big ? 1.4 : 1;
    const w = big ? 11 : 8;
    const m = new Vox(w, w, big ? 10 : 8, big ? 141 : 142);
    const c = w / 2, hz = 2.6 * s;
    m.blob(c, c, hz, 3.8 * s, 3.6 * s, 2.7 * s, ribCol(c, c, hz + 2.1 * s, P.pk, P.pkDk, P.pkLt));
    const tz = Math.floor(hz + 2.7 * s);
    m.box(Math.floor(c) - 1, Math.floor(c), tz, Math.floor(c) - 1, Math.floor(c), tz + 1, P.stem);
    m.set(Math.floor(c), Math.floor(c), tz, P.leafG); m.set(Math.floor(c) + 1, Math.floor(c) - 1, tz, P.leafG);
    if (carved) {
      const ez = Math.round(hz) + 1, cx = Math.floor(c);
      for (const [x, z] of [[cx - 2, ez], [cx + 1, ez], [cx - 1, ez - 2], [cx, ez - 2], [cx - 2, ez - 2], [cx + 1, ez - 2], [cx - 1, ez - 3], [cx + 1, ez - 3]]) m.paintFront(x, z, P.face);
    }
    return m;
  }
  function hayModel() {
    const m = new Vox(10, 9, 9, 150);
    m.blob(5, 4.5, 3.6, 4.9, 4.4, 4.2, (x, y, z) => (z >= 6 ? P.hayLt : rnd3(x, y, z, 1) < 0.3 ? P.hayDk : P.hay), 3);
    m.box(0, 3, 2, 9, 3, 2, P.woodDk);
    return m.recolor((x, y, z, v) => (v === P.woodDk && !(x === 0 || x === 9) ? P.hayDk : undefined));
  }
  function crateModel() {
    const m = new Vox(6, 6, 6, 160);
    m.box(0, 0, 0, 5, 5, 5, (x, y, z) => {
      const e = (x === 0 || x === 5) + (y === 0 || y === 5) + (z === 0 || z === 5);
      return e >= 2 ? P.woodDk : rnd3(x, y, z, 1) < 0.25 ? P.woodLt : P.wood;
    });
    return m;
  }
  function graveModel(cross) {
    const m = new Vox(7, 3, 10, 170 + (cross ? 1 : 0));
    const st = (x, y, z) => (z === 0 && rnd3(x, y, z, 1) < 0.6 ? P.moss : rnd3(x, y, z, 2) < 0.2 ? P.stoneDk : P.stone);
    if (cross) {
      m.box(2, 0, 0, 4, 2, 0, st);
      m.box(3, 1, 1, 3, 1, 8, st);
      m.box(1, 1, 5, 5, 1, 6, st);
      m.box(3, 1, 9, 3, 1, 9, P.stoneLt);
    } else {
      m.box(0, 0, 0, 6, 2, 0, st);
      m.box(1, 1, 1, 5, 2, 6, st);
      m.box(2, 1, 7, 4, 2, 7, st);
      m.box(1, 1, 7, 1, 1, 6, st);
      m.set(3, 2, 5, P.engr); m.set(3, 2, 4, P.engr); m.set(2, 2, 4, P.engr); m.set(4, 2, 4, P.engr); m.set(3, 2, 3, P.engr);
      m.set(1, 2, 1, P.moss); m.set(2, 2, 1, P.moss); m.set(5, 1, 6, P.moss);
    }
    return m;
  }
  function lampModel() {
    const m = new Vox(5, 5, 15, 180);
    m.box(1, 1, 0, 3, 3, 0, P.iron);
    m.box(2, 2, 1, 2, 2, 9, P.iron);
    m.box(1, 1, 10, 3, 3, 12, (x, y, z) => ((x === 1 || x === 3) && (y === 1 || y === 3) ? P.iron : z === 11 ? P.lampHot : P.lamp));
    m.box(0, 0, 13, 4, 4, 13, P.ironLt);
    m.box(1, 1, 14, 3, 3, 14, P.iron);
    return m;
  }
  function fenceModel() {
    const m = new Vox(13, 1, 6, 190);
    for (const x of [0, 6, 12]) m.box(x, 0, 0, x, 0, 5, P.woodDk);
    m.box(0, 0, 2, 12, 0, 2, P.woodLt); m.box(0, 0, 4, 12, 0, 4, P.woodLt);
    return m;
  }
  function bushModel() {
    const m = new Vox(8, 7, 6, 200);
    m.blob(4, 3.5, 2.6, 3.9, 3.4, 2.7, (x, y, z) => (rnd3(x, y, z, 1) < 0.07 ? P.berry : rnd3(x, y, z, 2) < 0.35 ? P.bushDk : P.bush), 2.6);
    return m;
  }
  function rockModel() {
    const m = new Vox(7, 6, 5, 210);
    m.blob(3.5, 3, 1.6, 3.4, 2.9, 2.4, (x, y, z) => (z >= 3 && rnd3(x, y, z, 1) < 0.6 ? P.moss : rnd3(x, y, z, 2) < 0.3 ? P.rockDk : P.rock), 2.6);
    return m;
  }
  function mushModel() {
    const m = new Vox(7, 7, 7, 220);
    m.box(3, 3, 0, 3, 3, 2, P.mushStem);
    m.blob(3.5, 3.5, 4, 3.4, 3.4, 1.8, (x, y, z) => (z >= 3 && rnd3(x, y, z, 1) < 0.18 ? P.mushDot : P.mushCap), 2.4);
    m.box(1, 5, 0, 1, 5, 1, P.mushStem); m.blob(1.5, 5.5, 2.4, 1.5, 1.5, 0.9, P.mushCap);
    return m;
  }

  /* -------- icons -------- */
  const ICON_MODELS = {
    'hp-heart': () => {
      const m = new Vox(9, 3, 8, 300);
      const rows = ['.HH...HH.', 'HHHH.HHHH', 'HHHHHHHHH', 'HHHHHHHHH', '.HHHHHHH.', '..HHHHH..', '...HHH...', '....H....'];
      rows.forEach((row, i) => { for (let x = 0; x < 9; x++) if (row[x] === 'H') m.box(x, 0, 7 - i, x, 2, 7 - i, (xx, y) => (y === 2 && i < 3 && (x === 1 || x === 2) ? P.heartLt : P.heart)); });
      return m.recolor((x, y, z, v) => (y === 0 ? P.heartDk : undefined));
    },
    kills: () => creeperModel(0),
    dmg: () => {
      const m = new Vox(5, 3, 10, 301);
      m.blob(2.5, 1.5, 4, 2.4, 1.4, 4, (x, y, z) => (x === 2 || z > 6 ? P.seed : P.seedDk));
      m.box(2, 1, 8, 2, 1, 9, P.white);
      return m;
    },
    rate: () => {
      const m = new Vox(7, 2, 11, 302);
      const pts = [[4, 10], [4, 9], [3, 9], [3, 8], [2, 8], [2, 7], [1, 7], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [4, 5], [4, 4], [3, 4], [3, 3], [2, 3], [2, 2], [1, 1], [1, 0], [5, 7]];
      for (const [x, z] of pts) m.box(x, 0, z, x, 1, z, z > 6 ? P.bolt : P.boltDk);
      return m;
    },
    multi: () => {
      const m = new Vox(9, 8, 11, 303);
      m.blob(4.5, 4, 3.8, 4.2, 3.7, 3.9, (x, y, z) => (rnd3(x, y, z, 1) < 0.3 ? P.sackDk : P.sack), 2.6);
      m.box(3, 3, 7, 5, 5, 7, P.rope);
      m.blob(4.5, 4, 8.8, 2.4, 2.4, 1.2, P.sack);
      m.box(3, 4, 9, 3, 4, 10, P.seed); m.box(5, 3, 9, 5, 3, 10, P.seed); m.box(4, 5, 10, 4, 5, 10, P.seedDk);
      m.recolor((x, y, z, v) => (z === 3 && v === P.sack ? P.pk : undefined));
      return m;
    },
    bounce: () => {
      const m = new Vox(7, 7, 12, 304);
      for (let i = 0; i < 4; i++) {
        const z = i * 2;
        m.blob(3.5, 3.5, z + 0.5, 3.2, 3.2, 0.55, i & 1 ? P.springDk : P.spring);
        m.blob(3.5, 3.5, z + 0.5, 2, 2, 0.6, 0);
      }
      m.blob(3.5, 3.5, 10, 2, 1.4, 2.4, (x, y, z) => (x === 3 ? P.seed : P.seedDk));
      return m;
    },
    lantern: () => lanternModel(),
    speed: () => {
      const m = new Vox(11, 5, 8, 305);
      m.box(1, 1, 0, 9, 3, 1, P.glassDk);
      m.box(0, 1, 1, 3, 3, 3, P.glass);
      m.box(1, 1, 2, 3, 3, 3, 0);
      m.box(8, 1, 0, 9, 3, 5, P.glass); m.box(7, 1, 2, 9, 3, 5, P.glass); m.box(8, 2, 3, 8, 2, 5, 0);
      m.box(9, 2, 0, 9, 2, 0, P.glassDk); m.box(9, 2, -1, 9, 2, -1, P.glassDk);
      m.set(10, 2, 6, P.glassLt); m.set(10, 2, 7, P.glassLt); m.set(4, 2, 2, P.glassLt);
      return m;
    },
    magnet: () => {
      const m = new Vox(11, 9, 10, 306);
      m.box(1, 1, 0, 9, 7, 5, (x, y, z) => ((x + z) & 1 ? P.wickerDk : P.wicker));
      m.box(2, 2, 1, 8, 6, 5, 0);
      m.blob(3.5, 4.5, 6, 2.3, 2.3, 1.8, ribCol(3.5, 4.5, 7.5, P.pk, P.pkDk, P.pkLt));
      m.blob(7, 4, 6.2, 2, 2, 1.8, (x, y, z) => (z >= 6 ? P.tPur : P.tCream));
      m.set(7, 4, 8, P.tLeaf); m.set(3, 4, 8, P.stem);
      m.box(1, 4, 6, 1, 4, 9, P.wickerDk); m.box(9, 4, 6, 9, 4, 9, P.wickerDk); m.box(2, 4, 9, 8, 4, 9, P.wickerDk);
      return m;
    },
    hp: () => {
      const m = new Vox(11, 9, 11, 307);
      m.blob(5.5, 4.5, 3, 5, 4.2, 3.1, (x, y, z) => (rnd3(x, y, z, 1) < 0.25 ? P.potLt : P.pot), 2.8);
      m.box(0, 4, 4, 0, 4, 4, P.potLt); m.box(10, 4, 4, 10, 4, 4, P.potLt);
      m.blob(5.5, 4.5, 5.5, 4.2, 3.4, 0.6, (x, y, z) => (rnd3(x, y, z, 2) < 0.3 ? P.tPur : rnd3(x, y, z, 3) < 0.5 ? P.pk : P.hayLt));
      m.box(4, 4, 7, 4, 4, 8, P.steam); m.box(5, 4, 9, 5, 4, 9, P.steam); m.box(7, 5, 7, 7, 5, 7, P.steam); m.box(6, 5, 8, 6, 5, 9, P.steam); m.set(7, 5, 10, P.steam);
      return m;
    },
  };

  /* ================================ sprite caches ================================ */
  const SET = {}, PROPS = {}, FX = {}, CUBES = [];
  const CUBE_HEX = [];
  const cubeIdx = (h) => { let i = CUBE_HEX.indexOf(h); if (i < 0) { i = CUBE_HEX.length; CUBE_HEX.push(h); } return i; };
  const DEB = {};
  const YAW = 0.6;

  function charSet(builder, nf, ppv, shZ = 0) {
    const frames = [[], []], sh = [];
    for (let f = 0; f < nf; f++) {
      const m = builder(f);
      frames[0].push(renderVox(m, YAW, ppv));
      frames[1].push(renderVox(m, -YAW, ppv));
      if (f === 0) { sh.push(renderShadow(m, YAW, ppv, { zoff: shZ })); sh.push(renderShadow(m, -YAW, ppv, { zoff: shZ })); }
    }
    return { frames, sh, tint: new Map() };
  }
  function tintOf(set, side, fi, color) {
    const k = side * 100 + fi + color;
    let t = set.tint.get(k);
    if (!t) { const s = set.frames[side][fi]; t = { c: U.tint(s.c, color), ax: s.ax, ay: s.ay }; set.tint.set(k, t); }
    return t;
  }
  function spinSet(m, n, ppv) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(renderVox(m, (i / n) * (Math.PI / 2) + 0.2, ppv));
    return out;
  }
  function glowSprite(r, g, b, size = 64) {
    return U.sprite(size, size, (ctx, w) => {
      const gr = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.9)`); gr.addColorStop(0.35, `rgba(${r},${g},${b},0.35)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, w);
    });
  }

  function buildAll() {
    buildPalette();
    SET.jack = charSet(jackModel, 5, PPV);
    SET.creeper = charSet(creeperModel, 4, PPV);
    SET.ghost = charSet(ghostModel, 4, PPV, 2);
    SET.colossus = charSet(colossusModel, 4, PPV);
    SET.lantern = spinSet(lanternModel(), 8, PPV * 0.85);
    SET.seed = spinSet(seedModel(), 6, PPV * 0.75);
    SET.gem = spinSet(gemModel(false), 8, PPV * 0.6);
    SET.gemBig = spinSet(gemModel(true), 8, PPV * 0.62);
    const prop = (name, m, yaw, o = {}) => {
      const s = renderVox(m, yaw, PPV);
      s.sh = renderShadow(m, yaw, PPV);
      Object.assign(s, o);
      s.hw = (s.c.width / K) * 0.42;
      PROPS[name] = s;
    };
    for (let v = 0; v < 3; v++) prop('tree' + v, treeModel(v), 0.55, { occl: true });
    prop('pine', pineModel(), 0.5, { occl: true });
    prop('pump', pumpkinModel(false, false), 0.45);
    prop('pumpBig', pumpkinModel(true, false), -0.4);
    prop('jackl', pumpkinModel(false, true), 0.35, { glow: 7, gz: 4 });
    prop('hay', hayModel(), 0.5);
    prop('crate', crateModel(), 0.5);
    prop('grave0', graveModel(false), 0.3);
    prop('grave1', graveModel(true), -0.3);
    prop('lamp', lampModel(), 0.4, { glow: 14, gz: 21 });
    prop('fence', fenceModel(), 0.0);
    prop('bush', bushModel(), 0.5);
    prop('rock', rockModel(), 0.6);
    prop('mush', mushModel(), 0.5);
    // debris cubes
    DEB.creeper = ['#9b54d2', '#7a3db2', '#f4e9cc', '#ddcfa8', '#5fbe3b', '#b672e2'].map(cubeIdx);
    DEB.ghost = ['#f6faff', '#dfe9f8', '#b8d6f3', '#94bfea', '#ffffff'].map(cubeIdx);
    DEB.colossus = ['#6c3e88', '#54306b', '#946a42', '#6f4b2d', '#ff9a2a', '#4b8a3a', '#ffd36a'].map(cubeIdx);
    DEB.jack = ['#f7842a', '#e2661e', '#ffa046', '#36325f', '#22b8a2', '#ffd84a'].map(cubeIdx);
    DEB.dust = ['#e9dcc0', '#d8c7a2', '#f3ead6'].map(cubeIdx);
    DEB.dirt = ['#8c5b37', '#a87a4c', '#6fae46'].map(cubeIdx);
    DEB.gold = ['#ffd84a', '#fff1a2', '#ffb23a'].map(cubeIdx);
    DEB.mint = ['#5df0b6', '#b6ffe0'].map(cubeIdx);
    DEB.seed = ['#f8edd2', '#dcc394'].map(cubeIdx);
    for (let i = 0; i < CUBE_HEX.length; i++) {
      const m = new Vox(1, 1, 1, 400 + i);
      const id = C(CUBE_HEX[i], { jit: 0 });
      m.set(0, 0, 0, id);
      const fr = [];
      for (let k = 0; k < 6; k++) fr.push(renderVox(m, (k / 6) * (Math.PI / 2), K * 2, { ao: 0, noGround: true }));
      CUBES.push(fr);
    }
    FX.warm = glowSprite(255, 190, 80);
    FX.mint = glowSprite(120, 255, 200);
    FX.gold = glowSprite(255, 200, 80);
    FX.hot = glowSprite(255, 150, 50);
  }

  /* ================================ ground ================================ */
  const CELL = 4;
  const GRASS = 0, LEAF = 1, FIELD = 2, STONE = 3, PATH = 4, WATER = 5;
  const toRGB = (a) => a.map(hex);
  const GP = {
    grass: toRGB(['#689f45', '#6da548', '#71aa4a', '#66a044', '#75ad4d', '#6aa246']),
    leaf: toRGB(['#a8673e', '#b47643', '#9e5c3a', '#bf8a4c', '#935538', '#857c46', '#ad6e40']),
    leafW: [3, 3, 2, 1.2, 1.2, 0.8, 2.4],
    fieldA: hex('#8e5d3a'), fieldB: hex('#7b4f31'),
    stone: toRGB(['#94949a', '#8e8f96', '#9a9a9d', '#8a8b92', '#97938d']), moss: hex('#82905f'),
    path: toRGB(['#cfa86e', '#c59d63', '#d7b37c', '#be955d']), shore: hex('#dcbd86'),
    water: hex('#4aa6dc'), waterDeep: hex('#3784c2'), waterLt: hex('#5cb6e6'),
  };
  const SIDEC = [hex('#7e5536'), hex('#70452b'), hex('#5c3a23'), hex('#63646e'), hex('#94693f'), hex('#3a6f9e')];
  const LIP = [1, 1, 0, 0, 0, 0];
  const LEAF_CUM = (() => { const s = GP.leafW.reduce((a, b) => a + b, 0); let acc = 0; return GP.leafW.map((w) => (acc += w / s)); })();

  /** Material + height + aux of a ground voxel (cell indices). Pure function of world position -> seamless. */
  function cellMat(i, j, out) {
    const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL;
    const h1 = U.hash2(i, j, 4242), h2 = U.hash2(i, j, 977);
    // narrow, chunky transition band: clustered jitter (few cells) + a little per-voxel salt
    const cl = U.noise(x / 15, y / 15, 401) - 0.5;
    const jit = cl * 0.0065 + (h1 - 0.5) * 0.0025;
    const pond = U.fbm(x / 560 + 3.1, y / 560 - 7.7, 91, 3) + cl * 0.012 + (h2 - 0.5) * 0.004;
    out.aux = 0;
    if (pond > 0.695) { out.mat = WATER; out.h = -1; out.aux = pond - 0.695; return out; }
    if (pond > 0.668) { out.mat = PATH; out.h = 0; out.aux = 1; return out; }
    const a = U.warped(x / 950, y / 950, 11, 1.1, 3) + jit;
    const b = U.warped(x / 820 + 17.3, y / 820 - 5.1, 23, 1.1, 3) - jit;
    const c = U.warped(x / 1050 - 9.7, y / 1050 + 13.9, 37, 1.0, 3) - 0.012 + jit * 0.8;
    let best = 0.552 - jit * 0.5, m = GRASS;
    if (a > best) { best = a; m = LEAF; }
    if (b > best) { best = b; m = FIELD; }
    if (c > best) { best = c; m = STONE; }
    out.mat = m; out.h = m === FIELD ? 0 : 1;
    if (m === GRASS || m === LEAF) {
      const r = Math.abs(U.perlin(x / 430, y / 430, 55)) + (h2 - 0.5) * 0.008;
      if (r < 0.034) { out.mat = PATH; out.h = 0; return out; }
      if (U.fbm(x / 230, y / 230, 77, 3) + cl * 0.01 > 0.655) out.h = 2;
    }
    return out;
  }
  function cellColor(i, j, cm, out) {
    const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL;
    const hv = U.hash2(i, j, 77);
    const pn = U.noise(x / 44, y / 44, 13);
    const v = clamp(pn * 0.85 + hv * 0.3 - 0.1, 0, 0.999);
    let c;
    switch (cm.mat) {
      case GRASS: { const p = GP.grass; c = p[Math.floor(v * p.length)]; if (cm.h === 2) c = U.mul(c, 1.05); break; }
      case LEAF: {
        const t = clamp(hv * 0.35 + U.noise(x / 26, y / 26, 17) * 0.8 - 0.12, 0, 0.999);
        let k = 0; while (LEAF_CUM[k] < t && k < LEAF_CUM.length - 1) k++;
        c = GP.leaf[k]; if (cm.h === 2) c = U.mul(c, 1.05);
        break;
      }
      case FIELD: c = U.mul(j & 1 ? GP.fieldB : GP.fieldA, 0.95 + hv * 0.09); break;
      case STONE: {
        const p = GP.stone;
        c = p[Math.floor(clamp(pn * 0.7 + hv * 0.45 - 0.08, 0, 0.999) * p.length)];
        if (U.noise(x / 70, y / 70, 5) > 0.63 && hv < 0.4) c = GP.moss;
        else if (((i + j) & 1) === 0) c = U.mul(c, 1.015);
        break;
      }
      case PATH: { const p = GP.path; c = cm.aux ? U.mix(GP.shore, p[Math.floor(v * p.length)], hv * 0.4) : p[Math.floor(v * p.length)]; break; }
      default: {
        const d = clamp(cm.aux * 14, 0, 1);
        c = U.mix(hv < 0.3 ? GP.waterLt : GP.water, GP.waterDeep, d);
        c = U.mul(c, 0.985 + hv * 0.03);
      }
    }
    const mac = 0.95 + 0.1 * U.noise(x / 620, y / 620, 9);
    out[0] = c[0] * mac; out[1] = c[1] * mac; out[2] = c[2] * mac;
    return out;
  }

  const WATER_SPARK = new Map();

  function* groundChunk(ctx, info) {
    const res = info.res, PX = info.px, wx = info.wx, wy = info.wy;
    const N = info.size / CELL, GW = N + 2;
    const i0 = Math.floor(wx / CELL) - 1, j0 = Math.floor(wy / CELL) - 1;
    const NN = GW * GW;
    const MAT = new Uint8Array(NN), H = new Int8Array(NN), R = new Float32Array(NN), GG = new Float32Array(NN), B = new Float32Array(NN), SJ = new Float32Array(NN);
    const cm = {}, col = [0, 0, 0];
    const sparks = [];
    for (let gj = 0; gj < GW; gj++) {
      if (gj & 1) yield;
      for (let gi = 0; gi < GW; gi++) {
        const i = i0 + gi, j = j0 + gj, k = gj * GW + gi;
        cellMat(i, j, cm);
        MAT[k] = cm.mat; H[k] = cm.h;
        cellColor(i, j, cm, col);
        R[k] = col[0]; GG[k] = col[1]; B[k] = col[2];
        SJ[k] = 0.94 + U.hash2(i, j, 555) * 0.1;
        if (cm.mat === WATER && gi > 0 && gj > 0 && gi <= N && gj <= N && U.hash2(i, j, 31) < 0.16) sparks.push((i + 0.2 + U.hash2(i, j, 32) * 0.4) * CELL, (j + 0.3 + U.hash2(i, j, 33) * 0.5) * CELL, U.hash2(i, j, 34) * TAU);
      }
    }
    WATER_SPARK.set(info.cx + ',' + info.cy, new Float32Array(sparks));
    if (WATER_SPARK.size > 160) WATER_SPARK.delete(WATER_SPARK.keys().next().value);

    const img = ctx.createImageData(PX, PX), d = img.data;
    const colI = new Int32Array(PX), colF = new Float32Array(PX);
    for (let px = 0; px < PX; px++) {
      const xv = wx + (px + 0.5) / res, ci = Math.floor(xv / CELL);
      colI[px] = ci - i0; colF[px] = xv - ci * CELL;
    }
    const edge = Math.max(0.42, 1 / res);
    for (let py = 0; py < PX; py++) {
      if ((py & 1) === 1) yield;
      const yv = wy + (py + 0.5) / res, cj = Math.floor(yv / CELL), fy = yv - cj * CELL;
      const rowK = (cj - j0) * GW;
      let o = py * PX * 4;
      for (let px = 0; px < PX; px++, o += 4) {
        const k = rowK + colI[px], fx = colF[px];
        const h = H[k], kn = k - GW, hn = H[kn];
        let r = R[k], g = GG[k], b = B[k], m = 1;
        if (hn > h) {
          const band = Math.min(3.5, (hn - h) * 1.9);
          if (fy < band) {
            const mn = MAT[kn];
            if (fy < edge) { r = R[kn] * 1.14 + 6; g = GG[kn] * 1.14 + 6; b = B[kn] * 1.12 + 6; }
            else if (LIP[mn] && fy < 1.05) { r = R[kn] * 0.8; g = GG[kn] * 0.8; b = B[kn] * 0.82; }
            else {
              const s = SIDEC[mn], t = fy / band, sh = (0.98 - 0.2 * t) * SJ[kn] * (fx > CELL - edge ? 0.94 : 1);
              r = s[0] * sh; g = s[1] * sh; b = s[2] * sh;
            }
            d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
            continue;
          }
          if (fy < band + 0.9) m *= 0.84;
        }
        const hw = H[k - 1];
        if (hw > h) { if (fx < 1.5) m *= 0.8; else if (fx < 2.0) m *= 0.9; }
        else if (H[kn - 1] > h && fx < 1.5 && fy < 1.2 + Math.min(3.5, (H[kn - 1] - h) * 1.9)) m *= 0.86;
        const mk = MAT[k];
        if (mk === STONE) {
          if (fy > CELL - edge || fx > CELL - edge) m *= 0.86; else if (fy < edge || fx < edge) m *= 1.05;
        } else if (mk !== WATER) {
          if (fy > CELL - edge) m *= 0.95; else if (fy < edge) m *= 1.035;
          if (fx > CELL - edge) m *= 0.965; else if (fx < edge) m *= 1.015;
        } else if (fy < edge && hn === h) m *= 1.02;
        d[o] = r * m; d[o + 1] = g * m; d[o + 2] = b * m; d[o + 3] = 255;
      }
    }
    for (let y = 0; y < PX; y += 96) { ctx.putImageData(img, 0, 0, 0, y, PX, Math.min(96, PX - y)); yield; }

    /* ---- decals: tiny voxel tufts, flowers, pebbles, leaves, reeds, lily pads ---- */
    const at = (x, y) => {
      const gi = Math.floor(x / CELL) - i0, gj = Math.floor(y / CELL) - j0;
      if (gi < 1 || gj < 1 || gi >= GW || gj >= GW) return -1;
      return gj * GW + gi;
    };
    const inBand = (k, y) => {
      const hn = H[k - GW], h = H[k];
      if (hn <= h) return false;
      const fy = y - Math.floor(y / CELL) * CELL;
      return fy < Math.min(3.5, (hn - h) * 1.9) + 0.8;
    };
    let n = 0;
    const deco = [];
    G.scatter(info, 7, 8123, 5, (x, y, rng) => { deco.push(x, y, rng.next(), rng.next(), rng.next(), rng.next()); });
    for (let q = 0; q < deco.length; q += 6) {
      if ((++n & 31) === 0) yield;
      let x = Math.round(deco[q] * 2) / 2, y = Math.round(deco[q + 1] * 2) / 2;
      const r0 = deco[q + 2], r1 = deco[q + 3], r2 = deco[q + 4], r3 = deco[q + 5];
      const k = at(x, y);
      if (k < 0 || inBand(k, y)) continue;
      const mat = MAT[k];
      if (mat === GRASS) {
        if (r0 < 0.38) tuft(ctx, x, y, r1, r2, GRASS_TUFT);
        else if (r0 < 0.47) flower(ctx, x, y, r1, r2);
        else if (r0 < 0.5) pebble(ctx, x, y, r1);
      } else if (mat === LEAF) {
        if (r0 < 0.4) leafy(ctx, x, y, r1, r2, r3);
        else if (r0 < 0.47) tuft(ctx, x, y, r1, r2, LEAF_TUFT);
        else if (r0 < 0.5) twig(ctx, x, y, r1);
      } else if (mat === FIELD) {
        if (r0 < 0.22) sprout(ctx, x, Math.floor(y / CELL) * CELL + 2, r1);
        else if (r0 < 0.3) clod(ctx, x, y, r1);
      } else if (mat === STONE) {
        if (r0 < 0.1) pebble(ctx, x, y, r1);
        else if (r0 < 0.2) mossy(ctx, x, y, r1);
        else if (r0 < 0.25) crack(ctx, x, y, r1);
      } else if (mat === PATH) {
        if (r0 < 0.18) pebble(ctx, x, y, r1);
        else if (r0 < 0.22) clod(ctx, x, y, r1);
      } else if (mat === WATER) {
        const nearShore = MAT[k - 1] !== WATER || MAT[k + 1] !== WATER || MAT[k - GW] !== WATER || MAT[k + GW] !== WATER;
        if (r0 < 0.12 && !nearShore) lily(ctx, x, y, r1, r2);
        else if (nearShore && r0 < 0.4) reeds(ctx, x, y, r1, r2);
      }
    }
  }

  /* ---- ground decal helpers (world coords, chunk ctx) ---- */
  const S_SH = 'rgba(30,40,20,0.22)';
  function mini(ctx, x, y, s, hh, top, side) {
    const sd = s * SP, hz = hh * CP;
    ctx.fillStyle = S_SH;
    ctx.fillRect(x + s * 0.35, y + sd * 0.25, s * 0.7 + hz * 0.6, sd * 0.85);
    ctx.fillStyle = side; ctx.fillRect(x, y + sd - hz, s, hz);
    ctx.fillStyle = top; ctx.fillRect(x, y - hz, s, sd);
  }
  const GRASS_TUFT = [['#8acb57', '#5f9a3a'], ['#7cbd4c', '#548c34'], ['#97d462', '#68a440']];
  const LEAF_TUFT = [['#a0a04a', '#76772f'], ['#8f9a45', '#69722f']];
  function tuft(ctx, x, y, r1, r2, pal) {
    const n = 2 + Math.floor(r2 * 2.5);
    for (let i = 0; i < n; i++) {
      const c = pal[(i + Math.floor(r1 * 3)) % pal.length];
      const ox = (i - n / 2) * 0.9, hh = 1.2 + ((r1 * 7 + i * 0.37) % 1) * 1.6 + (i === 1 ? 0.7 : 0);
      mini(ctx, x + ox, y + (i & 1) * 0.4, 0.8, hh, c[0], c[1]);
    }
  }
  const FLOWERS = [['#fff7ea', '#e2d8c8'], ['#ffd94a', '#e0b02c'], ['#ef4b3e', '#c2342d'], ['#b07ae6', '#8a58c2'], ['#ff8fb0', '#d86a8e']];
  function flower(ctx, x, y, r1, r2) {
    const c = FLOWERS[Math.floor(r1 * FLOWERS.length)];
    mini(ctx, x + 0.3, y, 0.6, 1.6, '#6aa844', '#4c8030');
    mini(ctx, x - 0.2, y - 1.6 * CP, 1.6, 1.0, c[0], c[1]);
    ctx.fillStyle = '#ffe06a';
    ctx.fillRect(x + 0.4, y - 2.6 * CP + 0.2, 0.5, 0.5);
    if (r2 < 0.5) { mini(ctx, x + 1.8, y + 1.2, 0.6, 1.1, '#6aa844', '#4c8030'); mini(ctx, x + 1.5, y + 1.2 - 1.1 * CP, 1.2, 0.8, c[0], c[1]); }
  }
  function pebble(ctx, x, y, r1) {
    const s = 1 + r1 * 1.2;
    mini(ctx, x, y, s, 0.7 + r1 * 0.5, r1 < 0.5 ? '#b9b9bc' : '#a6a39f', r1 < 0.5 ? '#86868d' : '#7c7973');
    if (r1 > 0.6) mini(ctx, x + s + 0.4, y + 0.6, 0.8, 0.5, '#c3c2c0', '#8e8c88');
  }
  const LEAVES = ['#f08a2c', '#e05a2e', '#f2b23e', '#c94a2c', '#e8702a'];
  function leafy(ctx, x, y, r1, r2, r3) {
    const n = 1 + Math.floor(r2 * 3);
    for (let i = 0; i < n; i++) {
      const c = LEAVES[Math.floor(((r1 + i * 0.31) % 1) * LEAVES.length)];
      const ox = ((r3 * 13 + i * 2.7) % 4) - 2, oy = ((r2 * 11 + i * 1.9) % 3) - 1.5;
      ctx.fillStyle = 'rgba(60,30,10,0.22)'; ctx.fillRect(x + ox + 0.4, y + oy + 0.4, 1.6, 1.1);
      ctx.fillStyle = c; ctx.fillRect(x + ox, y + oy, 1.6, 1.1);
    }
  }
  function twig(ctx, x, y, r1) {
    ctx.fillStyle = 'rgba(60,30,10,0.2)'; ctx.fillRect(x + 0.4, y + 0.5, 4, 0.8);
    ctx.fillStyle = '#6f4a2c'; ctx.fillRect(x, y, 4, 0.7);
    ctx.fillRect(x + 1.5 + r1, y - 0.8, 0.7, 0.8);
  }
  function sprout(ctx, x, y, r1) {
    mini(ctx, x, y, 0.7, 1.2 + r1, '#86c556', '#5b9338');
    mini(ctx, x + 0.7, y - 0.9, 0.9, 0.5, '#9bd666', '#6aa444');
    mini(ctx, x - 0.9, y - 0.5, 0.9, 0.5, '#9bd666', '#6aa444');
  }
  function clod(ctx, x, y, r1) { mini(ctx, x, y, 1.2 + r1, 0.7, '#a0714a', '#6f4a2d'); }
  function mossy(ctx, x, y, r1) {
    ctx.fillStyle = r1 < 0.5 ? '#89a35c' : '#7c944f';
    ctx.fillRect(x, y, 1.4, 1.0); ctx.fillRect(x + 1.0, y + 0.7, 1.0, 0.8);
  }
  function crack(ctx, x, y, r1) {
    const cx = Math.floor(x / CELL) * CELL, cy = Math.floor(y / CELL) * CELL;
    ctx.fillStyle = 'rgba(70,72,82,0.55)';
    ctx.fillRect(cx + 1, cy + 1.5, 1.6, 0.45); ctx.fillRect(cx + 2.2, cy + 1.5, 0.45, 1.5);
    if (r1 > 0.5) ctx.fillRect(cx + 2.2, cy + 2.8, 1.2, 0.45);
  }
  function lily(ctx, x, y, r1, r2) {
    ctx.fillStyle = 'rgba(20,60,100,0.3)'; ctx.fillRect(x + 0.6, y + 0.6, 3, 2.2);
    ctx.fillStyle = r1 < 0.5 ? '#5fae4a' : '#6dbb52';
    ctx.fillRect(x, y, 3, 2.2);
    ctx.fillStyle = '#4aa6dc'; ctx.fillRect(x + 1.5, y, 0.8, 0.9);
    if (r2 < 0.35) { mini(ctx, x + 0.5, y + 0.4, 1, 0.8, '#ffb3cf', '#e07aa2'); }
  }
  function reeds(ctx, x, y, r1, r2) {
    const n = 2 + Math.floor(r2 * 3);
    for (let i = 0; i < n; i++) {
      const hh = 2.5 + ((r1 * 9 + i * 0.41) % 1) * 3;
      mini(ctx, x + i * 0.9, y + (i & 1) * 0.6, 0.6, hh, '#7fa64a', '#5a7c34');
      if (i === 1) mini(ctx, x + i * 0.9 - 0.1, y - hh * CP + 0.4, 0.8, 1.2, '#7a4f2c', '#5e3c22');
    }
  }

  /* ================================ props ================================ */
  function genProps(info) {
    const out = [];
    const cm = {};
    const ok = (x, y, mat) => {
      cellMat(Math.floor(x / CELL), Math.floor(y / CELL), cm);
      if (cm.mat !== mat) return false;
      const h = cm.h;
      cellMat(Math.floor(x / CELL), Math.floor(y / CELL) + 1, cm);
      if (cm.mat === WATER || cm.mat === PATH || cm.h !== h) return false;
      return true;
    };
    G.scatterOwned(info, 50, 7071, (x, y, rng) => {
      if (G.nearSpawn(x, y, 80)) return;
      cellMat(Math.floor(x / CELL), Math.floor(y / CELL), cm);
      const mat = cm.mat;
      if (mat === WATER || mat === PATH) return;
      if (!ok(x, y, mat)) return;
      const r = rng.next();
      const add = (t, dx = 0, dy = 0) => { const px = Math.round(x + dx), py = Math.round(y + dy); if (dx || dy) { if (!ok(px, py, mat)) return; } out.push({ x: px, y: py, t }); };
      if (mat === LEAF) {
        if (r < 0.32) add('tree' + Math.floor(rng.next() * 3));
        else if (r < 0.42) add('pine');
        else if (r < 0.47) add('mush');
        else if (r < 0.52) add('bush');
      } else if (mat === GRASS) {
        if (r < 0.08) add('tree' + Math.floor(rng.next() * 3));
        else if (r < 0.12) add('pine');
        else if (r < 0.17) add('bush');
        else if (r < 0.21) add('rock');
        else if (r < 0.235) add('hay');
      } else if (mat === FIELD) {
        if (r < 0.34) {
          add(rng.next() < 0.25 ? 'pumpBig' : 'pump');
          if (rng.next() < 0.6) add('pump', 10 + rng.next() * 6, 2 + rng.next() * 6);
          if (rng.next() < 0.25) add('jackl', -10 - rng.next() * 6, 4 + rng.next() * 4);
        } else if (r < 0.42) add('hay');
        else if (r < 0.5) { add('fence'); if (rng.next() < 0.6) add('fence', 24, 0); }
        else if (r < 0.53) add('crate');
      } else if (mat === STONE) {
        if (r < 0.2) { add(rng.next() < 0.6 ? 'grave0' : 'grave1'); if (rng.next() < 0.5) add(rng.next() < 0.5 ? 'grave0' : 'grave1', 16, 0); }
        else if (r < 0.28) add('lamp');
        else if (r < 0.33) add('crate');
        else if (r < 0.36) add('jackl');
      }
    });
    return out;
  }

  /* ================================ particles ================================ */
  function cubes(game, x, y, z, pal, n, o = {}) {
    const sp = o.speed || 70;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.35 + Math.random() * 0.8);
      game.addParticle({
        x: x + (Math.random() - 0.5) * (o.spread || 6), y: y + (Math.random() - 0.5) * (o.spread || 6) * 0.5,
        z: z + Math.random() * (o.zr || 6), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: (o.vz || 90) * (0.5 + Math.random() * 0.8),
        grav: o.grav !== undefined ? o.grav : 320, drag: o.drag !== undefined ? o.drag : 1.4, life: (o.life || 1) * (0.7 + Math.random() * 0.6),
        size: (o.size || 2) * (0.7 + Math.random() * 0.6), kind: 'cube', ci: pal[(Math.random() * pal.length) | 0],
        vr: (Math.random() - 0.5) * 16, rot: Math.random() * 6,
      });
    }
  }
  function sparks(game, x, y, z, n, color, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = (o.speed || 80) * (0.4 + Math.random() * 0.8);
      game.addParticle({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: (o.vz || 40) * Math.random(), grav: o.grav || 0, drag: 4, life: (o.life || 0.3) * (0.6 + Math.random() * 0.6), size: o.size || 1.6, kind: 'spark', color });
    }
  }
  function ring(game, x, y, r0, r1, color, life = 0.5, lw = 2) {
    game.addParticle({ x, y, z: 0, life, r0, r1, color, lw, kind: 'ring', drag: 0 });
  }

  /* ================================ screen fx ================================ */
  let VIG = null;
  function vignette(W, H) {
    if (VIG && VIG.W === W && VIG.H === H) return VIG.c;
    const c = U.sprite(320, 180, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h * 0.48, h * 0.32, w / 2, h * 0.5, w * 0.62);
      g.addColorStop(0, 'rgba(30,20,60,0)'); g.addColorStop(0.6, 'rgba(30,20,60,0.12)'); g.addColorStop(1, 'rgba(24,14,50,0.42)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const t = ctx.createLinearGradient(0, 0, 0, h);
      t.addColorStop(0, 'rgba(255,236,190,0.10)'); t.addColorStop(0.35, 'rgba(255,236,190,0)');
      ctx.fillStyle = t; ctx.fillRect(0, 0, w, h);
    });
    VIG = { W, H, c };
    return c;
  }

  const NUM_FONT = "'Bungee', 'Chakra Petch', system-ui, sans-serif";

  /* ================================ CSS ================================ */
  const FH = "'Bungee', 'Chakra Petch', system-ui, sans-serif";
  const FB = "'Chakra Petch', system-ui, sans-serif";
  const PANEL = '#2b2446', EDGE = '#151024';
  const BEVEL = `inset 0 3px 0 rgba(255,255,255,.16), inset 3px 0 0 rgba(255,255,255,.07), inset 0 -4px 0 rgba(0,0,0,.38), inset -3px 0 0 rgba(0,0,0,.22), 0 0 0 3px ${EDGE}, 0 6px 0 3px ${EDGE}, 0 10px 18px rgba(10,6,24,.35)`;
  const css = `
body.style-voxel { font-family: ${FB}; }
body.style-voxel #hud { padding: 14px 22px; }
body.style-voxel #hud .xp { height: 22px; background: #191329; border: none; border-radius: 2px; overflow: hidden;
  box-shadow: inset 0 3px 0 rgba(0,0,0,.5), 0 0 0 3px ${EDGE}, 0 5px 0 3px ${EDGE}; }
body.style-voxel #hud .xp-fill { border-radius: 0;
  background: repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 15px, rgba(16,40,40,.75) 15px 18px),
              linear-gradient(180deg, #c8ffee 0 20%, #57e6b4 20% 68%, #26a888 68% 100%); }
body.style-voxel #hud .lvl { right: 10px; font: 400 13px/1 ${FH}; color: #fff; letter-spacing: 1px; text-shadow: 0 2px 0 ${EDGE}, 2px 0 0 ${EDGE}, -2px 0 0 ${EDGE}, 0 -2px 0 ${EDGE}; }
body.style-voxel #hud .topline { margin-top: 16px; align-items: flex-start; }
body.style-voxel #hud .hp { gap: 10px; padding: 7px 14px 7px 8px; background: ${PANEL}; border-radius: 3px; box-shadow: ${BEVEL}; }
body.style-voxel #hud .hp-icon, body.style-voxel #hud .kills-icon { width: 38px; height: 38px; image-rendering: auto; }
body.style-voxel #hud .hp-bar { width: 216px; height: 22px; background: #160f22; border: none; border-radius: 2px; box-shadow: inset 0 3px 0 rgba(0,0,0,.55), 0 0 0 2px #0e0a18; }
body.style-voxel #hud .hp-fill { border-radius: 0;
  background: repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 15px, rgba(50,8,16,.8) 15px 18px),
              linear-gradient(180deg, #ffb09a 0 22%, #f0443a 22% 70%, #b3242a 70% 100%); }
body.style-voxel #hud .hp-text { font: 400 15px/1 ${FH}; color: #fff; min-width: 74px; text-shadow: 0 2px 0 ${EDGE}; }
body.style-voxel #hud .clock { background: ${PANEL}; padding: 6px 24px 8px; border-radius: 3px; box-shadow: ${BEVEL}; min-width: 168px; }
body.style-voxel #hud .clock-time { font: 400 34px/1.05 ${FH}; color: #ffc23e; letter-spacing: 2px;
  text-shadow: 0 2px 0 #d9741c, 0 4px 0 #a2470f, 0 6px 0 ${EDGE}; }
body.style-voxel #hud .clock-label { font: 700 11px/1 ${FB}; color: #b7a9e6; letter-spacing: 3px; opacity: 1; margin-top: 6px; }
body.style-voxel #hud .kills { min-width: 0; gap: 10px; padding: 7px 18px 7px 10px; background: ${PANEL}; border-radius: 3px; box-shadow: ${BEVEL}; text-shadow: none; }
body.style-voxel #hud .kills-num { font: 400 24px/1 ${FH}; color: #fff; min-width: 64px; text-align: right; text-shadow: 0 3px 0 ${EDGE}; }
body.style-voxel.hurt #hud .hp-bar { filter: none; box-shadow: inset 0 3px 0 rgba(0,0,0,.55), 0 0 0 2px #ff5a3a; }
body.style-voxel.hurt #hud .hp { background: #4a2036; }
body.style-voxel #stylebar { background: ${PANEL}; border: none; border-radius: 3px; box-shadow: ${BEVEL}; padding: 9px 20px; bottom: 16px; }
body.style-voxel #stylebar .style-family { font: 700 10px ${FB}; color: #9d8fd0; letter-spacing: 2px; opacity: 1; }
body.style-voxel #stylebar .style-name { font: 400 16px ${FH}; color: #ffc23e; text-shadow: 0 2px 0 #8a3d0e; }
body.style-voxel #stylebar .style-hint { font: 600 12px ${FB}; color: #d4cbef; opacity: .85; }
body.style-voxel #stylebar .auto.on { color: #57e6b4; }
body.style-voxel #levelup { background: radial-gradient(ellipse at 50% 45%, rgba(40,30,80,.35), rgba(16,10,34,.78)); gap: 30px; }
body.style-voxel #levelup .lu-title { font: 400 64px/1 ${FH}; color: #ffc23e; letter-spacing: 3px;
  text-shadow: 0 3px 0 #e8801e, 0 6px 0 #c55a12, 0 9px 0 #8a3a0c, 0 12px 0 ${EDGE}, 0 20px 26px rgba(0,0,0,.45); }
body.style-voxel #levelup .lu-cards { gap: 30px; }
body.style-voxel #levelup .card { width: 224px; min-height: 290px; padding: 22px 16px 20px; gap: 10px; border: none; border-radius: 3px; color: #fff;
  background: linear-gradient(180deg, #3d335f 0 52%, #30284c 52%); box-shadow: ${BEVEL}; transition: transform .12s; }
body.style-voxel #levelup .card:hover { transform: translateY(-8px); }
body.style-voxel #levelup .card-icon { width: 120px; height: 120px; padding: 8px; border-radius: 2px;
  background: repeating-conic-gradient(#251e3c 0 25%, #2c2447 0 50%) 0 0 / 24px 24px;
  box-shadow: inset 0 4px 0 rgba(0,0,0,.4), inset 0 -3px 0 rgba(255,255,255,.08), 0 0 0 3px ${EDGE}; }
body.style-voxel #levelup .card:nth-child(1) .card-icon { background-color: #2a3a3a; }
body.style-voxel #levelup .card-name { font: 400 19px/1.15 ${FH}; color: #ffc23e; margin-top: 8px; text-shadow: 0 3px 0 ${EDGE}; letter-spacing: .5px; }
body.style-voxel #levelup .card-desc { font: 600 15px/1.3 ${FB}; color: #ddd4f6; opacity: 1; }
body.style-voxel #levelup .card-key { top: 10px; left: 10px; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 2px; opacity: 1;
  font: 400 15px/1 ${FH}; color: #2b1a0c; background: linear-gradient(180deg, #ffd36a 0 50%, #f3a13a 50%);
  box-shadow: inset 0 -3px 0 rgba(0,0,0,.25), 0 0 0 2px ${EDGE}; }
body.style-voxel #levelup .lu-hint { font: 700 15px ${FB}; color: #e9e2ff; letter-spacing: 1px; opacity: .9; }
body.style-voxel #gameover { background: radial-gradient(ellipse at 50% 45%, rgba(40,30,80,.4), rgba(14,8,30,.85)); gap: 18px; }
body.style-voxel #gameover .go-title { font: 400 58px/1 ${FH}; color: #b672e2; text-shadow: 0 3px 0 #7a3db2, 0 6px 0 #4c2470, 0 9px 0 ${EDGE}; }
body.style-voxel #gameover .go-stats { font: 700 18px ${FB}; color: #fff; background: ${PANEL}; padding: 12px 26px; border-radius: 3px; box-shadow: ${BEVEL}; opacity: 1; }
body.style-voxel #gameover .go-hint { font: 700 14px ${FB}; color: #d4cbef; }
body.style-voxel #pausebox { font: 400 52px ${FH}; color: #ffc23e; text-shadow: 0 3px 0 #c55a12, 0 6px 0 ${EDGE}; }
`;

  /* ================================ the style ================================ */
  let RT = 0;
  const yawSide = (f) => (f < 0 ? 1 : 0);

  Styles.register({
    id: 'voxel',
    name: 'Voxel-Würfelwelt',
    family: '3D-Look · Voxel',
    description: 'Eine knallbunte Miniaturwelt aus kleinen Würfeln – Kürbis-Jack, Rüben und Geister als MagicaVoxel-Figuren im Herbstsonnenlicht.',
    groundColor: '#6eae46',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Bungee', 'Chakra+Petch:wght@500;600;700'],
    css,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = (window.__forceH || window.innerHeight || 900) * dpr;
      K = clamp(Math.round((h / 360) * 4) / 4, 1.5, 4);
      VSC = K;
      PPV = Math.max(3, Math.round(K * 1.9));
      VW = PPV / K;
      buildAll();
    },

    renderGroundChunk(ctx, info) { return groundChunk(ctx, info); },
    propsForChunk(info) { return genProps(info); },

    drawGroundOverlay(ctx, view) {
      VSC = view.S;
      RT = view.rt;
      // water shimmer: little glints that blink on the pond voxels
      const s = 256;
      const cx0 = Math.floor(view.x0 / s), cx1 = Math.floor(view.x1 / s), cy0 = Math.floor(view.y0 / s), cy1 = Math.floor(view.y1 / s);
      ctx.fillStyle = '#e8f8ff';
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const arr = WATER_SPARK.get(cx + ',' + cy);
        if (!arr || !arr.length) continue;
        for (let i = 0; i < arr.length; i += 3) {
          const x = arr[i], y = arr[i + 1];
          if (x < view.x0 - 4 || x > view.x1 + 4 || y < view.y0 - 4 || y > view.y1 + 4) continue;
          const v = Math.sin(view.rt * 1.7 + arr[i + 2]);
          if (v < 0.55) continue;
          ctx.globalAlpha = (v - 0.55) * 1.6;
          ctx.fillRect(x, y, 1.8, 0.55);
          ctx.fillRect(x + 0.6, y - 0.6, 0.6, 0.6);
        }
      }
      ctx.globalAlpha = 1;
      // warm light pool of Jack's lantern head
      const p = view.game.player;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.14 + 0.02 * Math.sin(view.rt * 7);
      ctx.drawImage(FX.warm, p.x - 30, p.y - 15, 60, 30);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },

    drawProp(ctx, p, view) {
      const s = PROPS[p.t];
      if (!s) return;
      let a = 1;
      if (s.occl) {
        const pl = view.game.player;
        if (pl.y < p.y - 2 && pl.y > p.y - s.ay / K + 4 && Math.abs(pl.x - p.x) < s.hw) a = 0.45;
      }
      ctx.globalAlpha = a;
      blit(ctx, s, p.x, p.y);
      if (s.glow) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5 + 0.08 * Math.sin(RT * 6 + p.x);
        const r = s.glow;
        ctx.drawImage(FX.warm, p.x - r, p.y - s.gz - r, r * 2, r * 2);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o) {
      let sh, a = 0.42, oy = 0;
      if (o.kind === 'prop') { const s = PROPS[o.t]; if (!s || !s.sh) return; sh = s.sh; a = 0.4; }
      else if (o.kind === 'player') sh = SET.jack.sh[yawSide(o.facing)];
      else {
        const set = SET[o.type];
        if (!set) return;
        sh = set.sh[yawSide(o.facing)];
        if (o.type === 'ghost') a = 0.22;
        if (o.dying) a *= Math.max(0, 1 - o.deathT / 0.3);
        if (o.spawnT < 1) a *= o.spawnT;
      }
      if (!sh || a <= 0.01) return;
      ctx.globalAlpha = a;
      blit(ctx, sh, o.x, o.y + oy);
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      const fr = g.big ? SET.gemBig : SET.gem;
      const fi = Math.floor((view.rt * 1.6 + g.seed * 7) * fr.length) % fr.length;
      const hop = g.pop > 0 ? Math.sin(g.pop * Math.PI) * 9 : 0;
      const z = 2.4 + Math.sin(view.rt * 3 + g.seed * 10) * 0.9 + hop;
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#1d2a14';
      const sw = g.big ? 5 : 3.2;
      ctx.fillRect(g.x - sw / 2 + 1, g.y - 0.6, sw, sw * 0.45);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4;
      const gr = g.big ? 12 : 7;
      ctx.drawImage(g.big ? FX.gold : FX.mint, g.x - gr, g.y - z - gr * 0.8, gr * 2, gr * 2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      blit(ctx, fr[fi], g.x, g.y - z);
    },

    drawEnemy(ctx, e) {
      const set = SET[e.type];
      if (!set) return;
      const side = yawSide(e.facing);
      let fi, lift = 0, alpha = 1;
      if (e.type === 'ghost') {
        fi = Math.floor(RT * 6 + e.seed * 4) & 3;
        lift = 2.5 + Math.sin(RT * 2.8 + e.seed * 20) * 1.5;
        alpha = 0.84;
      } else if (e.type === 'creeper') {
        fi = Math.floor(e.anim * 1.8) & 3;
      } else {
        fi = Math.floor(e.anim * 1.3) & 3;
      }
      const s = set.frames[side][fi];
      if (e.dying) {
        const t = e.deathT / 0.28;
        if (t >= 1) return;
        ctx.globalAlpha = alpha;
        blitScaled(ctx, s, e.x, e.y - lift, 1 + t * 0.35, 1 - t * 0.6);
        ctx.globalAlpha = 0.6 * (1 - t);
        blitScaled(ctx, tintOf(set, side, fi, '#ffffff'), e.x, e.y - lift, 1 + t * 0.35, 1 - t * 0.6);
        ctx.globalAlpha = 1;
        return;
      }
      if (e.spawnT < 1) {
        const t = e.spawnT;
        const layer = PPV * CP;
        const total = s.c.height;
        const vis = Math.min(total, Math.round(Math.ceil((U.ease.outQuad(t) * total) / layer) * layer));
        if (vis > 0) {
          const sy = total - vis;
          ctx.globalAlpha = alpha;
          const x0 = Math.round(e.x * VSC - (s.ax * VSC) / K) / VSC, y0 = Math.round((e.y - lift) * VSC - (s.ay * VSC) / K) / VSC;
          ctx.drawImage(s.c, 0, sy, s.c.width, vis, x0, y0 + sy / K, s.c.width / K, vis / K);
        }
        // popping dirt cubes
        for (let i = 0; i < 4; i++) {
          const a = e.seed * 20 + i * 1.7, r = 4 + t * 10;
          const z = Math.sin(Math.min(1, t * 1.4) * Math.PI) * (6 + i * 2);
          const cf = CUBES[DEB.dirt[i % 3]][(i + Math.floor(t * 12)) % 6];
          ctx.globalAlpha = 1 - t * 0.8;
          blitScaled(ctx, cf, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.5 - z, 0.7, 0.7);
        }
        ctx.globalAlpha = 1;
        return;
      }
      ctx.globalAlpha = alpha;
      blit(ctx, s, e.x, e.y - lift);
      if (e.flash > 0.04) {
        ctx.globalAlpha = Math.min(0.58, e.flash * 0.8);
        blit(ctx, tintOf(set, side, fi, '#ffffff'), e.x, e.y - lift);
      }
      if (e.type === 'colossus') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.32 + 0.12 * Math.sin(RT * 4 + e.seed * 9);
        const gz = 15.5 * CP * VW;
        ctx.drawImage(FX.hot, e.x - 15 + (side ? -2 : 2), e.y - gz - 13, 30, 26);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      const set = SET.jack;
      const side = yawSide(p.facing);
      const fi = p.moving ? 1 + (Math.floor(p.anim * 1.6) & 3) : 0;
      const lift = p.moving ? 0 : Math.max(0, Math.sin(view.rt * 2.6)) * 0.6;
      const s = set.frames[side][fi];
      if (p.levelT > 0) {
        const t = 1 - p.levelT, r = 10 + t * 36;
        ctx.globalAlpha = p.levelT;
        ctx.strokeStyle = '#ffd84a';
        ctx.lineWidth = 2.6 * p.levelT + 0.6;
        ctx.strokeRect(p.x - r, p.y - r * SP, r * 2, r * 2 * SP);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = p.levelT * 0.55;
        ctx.drawImage(FX.warm, p.x - 30, p.y - 46, 60, 60);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (p.dashT > 0) {
        const tt = tintOf(set, side, fi, '#ffb347');
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = 0.17 * (4 - i) * Math.min(1, p.dashT * 6);
          blit(ctx, tt, p.x - p.dashX * i * 6, p.y - p.dashY * i * 6);
        }
      }
      let a = 1;
      if (p.iframes > 0 && p.hurtT <= 0 && p.dashT <= 0) a = Math.floor(view.rt * 18) % 2 ? 0.5 : 1;
      ctx.globalAlpha = a;
      blit(ctx, s, p.x, p.y - lift);
      if (p.hurtT > 0) {
        ctx.globalAlpha = Math.min(0.6, p.hurtT * 0.8);
        blit(ctx, tintOf(set, side, fi, '#ff4a3a'), p.x, p.y - lift);
      }
      // bloom of the carved face
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.34 + 0.06 * Math.sin(view.rt * 9);
      const gz = (fi === 2 || fi === 4 ? 13 : 12) * CP * VW + lift;
      ctx.drawImage(FX.warm, p.x - 11 + (side ? -2.5 : 2.5), p.y - gz - 9, 22, 18);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const fr = SET.lantern;
      const fi = (((Math.floor((o.angle / (Math.PI / 2)) * fr.length) % fr.length) + fr.length) % fr.length);
      const hover = 9 + Math.sin(view.rt * 4 + o.idx * 1.7) * 1.2;
      const gy = o.y + 6;
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#1d2a14';
      ctx.fillRect(o.x - 2, gy - 1, 6, 2.6);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + 0.12 * Math.sin(view.rt * 11 + o.idx);
      ctx.drawImage(FX.warm, o.x - 16, gy - hover - 22, 32, 32);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      blit(ctx, fr[fi], o.x, gy - hover);
    },

    drawProjectile(ctx, pr) {
      const fr = SET.seed;
      const ca = Math.cos(pr.angle), sa = Math.sin(pr.angle);
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#1d2a14';
      ctx.fillRect(pr.x - 1.2, pr.y + 6, 2.6, 1.3);
      for (let i = 1; i <= 3; i++) {
        const d = i * 3.2, s = 2.2 - i * 0.45;
        ctx.globalAlpha = 0.55 - i * 0.14;
        ctx.fillStyle = i === 1 ? '#fff6dc' : '#ffe2a8';
        ctx.fillRect(pr.x - ca * d - s / 2, pr.y - sa * d - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      const fi = ((Math.floor(Math.abs(pr.spin) * 3) % fr.length) + fr.length) % fr.length;
      blit(ctx, fr[fi], pr.x, pr.y + 2);
    },

    drawParticle(ctx, pt) {
      const k = pt.life / pt.max;
      const x = pt.x, y = pt.y - pt.z;
      switch (pt.kind) {
        case 'cube': {
          const fr = CUBES[pt.ci];
          if (!fr) break;
          const fi = ((Math.floor(pt.rot * 2) % 6) + 6) % 6;
          ctx.globalAlpha = k < 0.3 ? k / 0.3 : 1;
          if (pt.z <= 0.5) { ctx.globalAlpha *= 0.4; ctx.fillStyle = '#1d2a14'; ctx.fillRect(pt.x - pt.size * 0.3, pt.y - pt.size * 0.1, pt.size * 0.9, pt.size * 0.4); ctx.globalAlpha = k < 0.3 ? k / 0.3 : 1; }
          const sc = pt.size / 2;
          blitScaled(ctx, fr[fi], x, y + pt.size * 0.3, sc, sc);
          break;
        }
        case 'spark': {
          const s = pt.size * (0.5 + k * 0.5);
          ctx.globalAlpha = Math.min(1, k * 2);
          ctx.fillStyle = pt.color || '#fff';
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
          break;
        }
        case 'ring': {
          const t = 1 - k;
          const r = pt.r0 + (pt.r1 - pt.r0) * U.ease.outQuad(t);
          ctx.globalAlpha = k * 0.85;
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = pt.lw * k + 0.4;
          ctx.strokeRect(pt.x - r, pt.y - r * SP, r * 2, r * 2 * SP);
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
      const pop = age < 0.12 ? 0.6 + (age / 0.12) * 0.55 : 1.15 - Math.min(0.15, (age - 0.12) * 0.6);
      const sz = Math.round((n.crit ? 9 : 7) * pop * 2) / 2;
      ctx.globalAlpha = clamp(k * 3, 0, 1);
      ctx.font = sz + 'px ' + NUM_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const txt = n.crit ? n.value + '!' : '' + n.value;
      ctx.fillStyle = n.crit ? '#5a200a' : '#1a1028';
      ctx.fillText(txt, n.x + 0.3, n.y + 1.0);
      ctx.fillStyle = n.crit ? '#ffc23e' : '#ffffff';
      ctx.fillText(txt, n.x, n.y);
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      ctx.drawImage(vignette(view.W, view.H), 0, 0, view.W, view.H);
    },

    drawIcon(ctx, id, size) {
      const mk = ICON_MODELS[id];
      if (!mk) return;
      if (!P.pk) buildPalette();
      const m = mk();
      const probe = renderVox(m, 0.6, 10);
      const fit = Math.min((size * 0.84) / (probe.c.width - 8), (size * 0.84) / (probe.c.height - 8));
      let ppv = 10 * fit;
      if (ppv >= 2.5) ppv = Math.floor(ppv);
      const s = renderVox(m, 0.6, ppv, { noGround: true });
      const dx = Math.round((size - s.c.width) / 2), dy = Math.round((size - s.c.height) / 2);
      ctx.globalAlpha = 0.35;
      ctx.drawImage(U.tint(s.c, '#0c0818'), dx + Math.max(1, size * 0.04), dy + Math.max(1, size * 0.05));
      ctx.globalAlpha = 1;
      ctx.drawImage(s.c, dx, dy);
    },

    /* ---------------- hooks ---------------- */
    onHit(game, e, src) {
      const pal = DEB[e.type] || DEB.creeper;
      const z = e.type === 'colossus' ? 22 : e.type === 'ghost' ? 14 : 10;
      cubes(game, e.x, e.y, z, pal, e.type === 'colossus' ? 3 : 2, { speed: 50, life: 0.5, size: 1.6, vz: 60 });
      sparks(game, e.x, e.y, z, 2, src === 'lantern' ? '#ffd27a' : '#ffffff', { speed: 80 });
    },
    onKill(game, e) {
      const pal = DEB[e.type] || DEB.creeper;
      if (e.type === 'colossus') {
        cubes(game, e.x, e.y, 8, pal, 34, { speed: 95, life: 1.4, size: 3.6, vz: 140, zr: 34, spread: 24 });
        ring(game, e.x, e.y, 10, 48, '#fff1c8', 0.55, 3);
        sparks(game, e.x, e.y, 24, 8, '#ffcf6a', { speed: 120, life: 0.45, size: 2.4 });
        game.shake = Math.max(game.shake || 0, 4);
      } else if (e.type === 'ghost') {
        cubes(game, e.x, e.y, 10, pal, 10, { speed: 50, life: 0.8, size: 2, vz: 50, grav: -30, drag: 2.5 });
      } else {
        cubes(game, e.x, e.y, 4, pal, 14, { speed: 70, life: 1.1, size: 2.3, vz: 110, zr: 14 });
      }
    },
    onHurt(game, p) {
      cubes(game, p.x, p.y, 14, DEB.jack, 6, { speed: 70, life: 0.7, size: 2, vz: 80 });
      sparks(game, p.x, p.y, 16, 4, '#ffd27a', { speed: 90 });
    },
    onPickup(game, g) {
      sparks(game, g.x, g.y, 6, g.big ? 5 : 2, g.big ? '#ffe58a' : '#b6ffe0', { speed: 40, vz: 30, life: 0.3, size: g.big ? 2 : 1.4 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.3) cubes(game, pr.x, pr.y + 4, 4, DEB.seed, 1, { speed: 18, life: 0.35, size: 1, vz: 30 });
    },
    onDash(game, p) {
      cubes(game, p.x, p.y, 1, DEB.dust, 6, { speed: 34, life: 0.5, size: 1.6, vz: 40 });
    },
    onLevelUp(game, p) {
      ring(game, p.x, p.y, 8, 54, '#ffd84a', 0.7, 3);
      cubes(game, p.x, p.y, 6, DEB.gold, 16, { speed: 40, life: 1.2, size: 2, vz: 90, grav: 120 });
    },
    onDeath(game, p) {
      cubes(game, p.x, p.y, 12, DEB.jack, 30, { speed: 90, life: 1.5, size: 2.8, vz: 120, zr: 18 });
    },
  });
})();
