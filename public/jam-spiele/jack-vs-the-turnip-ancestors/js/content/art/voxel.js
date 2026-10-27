/* Native art for the new enemies / upgrades in the 'voxel' world (Voxel-Würfelwelt) – see js/content/ART_API.md.
   Same tiny software voxel renderer as js/styles/voxel.js (yaw ±0.6 -> 3/4 ortho projection, 3-tone faces with
   per-voxel jitter, neighbour AO, painter's sort), copied here because the style's closure is not reachable.
   Models are built and rendered lazily per (side, frame) on first use. */
(function () {
  'use strict';
  const U = window.U, Cn = window.Content;
  if (!U || !Cn) return;
  const TAU = Math.PI * 2;
  const hex = U.hex, clamp = U.clamp;

  /* ================================ camera (from the style) ================================ */
  const PITCH = (46 * Math.PI) / 180;
  const SP = Math.sin(PITCH), CP = Math.cos(PITCH);
  const SHX = 0.62, SHY = 0.26;
  let K = 3, VSC = 3, PPV = 6, VW = 2;
  const YAW = 0.6;

  /* ================================ colours ================================ */
  const COLS = [null];
  const colIds = new Map();
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

  /* ================================ voxel grid + renderer (copied) ================================ */
  class Vox {
    constructor(w, d, h, seed = 1) { this.w = w; this.d = d; this.h = h; this.seed = seed; this.a = new Uint16Array(w * d * h); }
    in(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.d && z < this.h; }
    get(x, y, z) { return this.in(x, y, z) ? this.a[(z * this.d + y) * this.w + x] : 0; }
    set(x, y, z, c) {
      x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
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
    blob(cx, cy, cz, rx, ry, rz, c, p = 2) {
      const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry), z0 = Math.floor(cz - rz), z1 = Math.ceil(cz + rz);
      for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = Math.abs((x + 0.5 - cx) / rx), dy = Math.abs((y + 0.5 - cy) / ry), dz = Math.abs((z + 0.5 - cz) / rz);
        if (Math.pow(dx, p) + Math.pow(dy, p) + Math.pow(dz, p) <= 1) this.set(x, y, z, c);
      }
      return this;
    }
    front(x, z) { for (let y = this.d - 1; y >= 0; y--) if (this.get(x, y, z)) return y; return -1; }
    paintFront(x, z, c) { const y = this.front(x, z); if (y >= 0) this.set(x, y, z, c); return this; }
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
  const canFilter = (() => { try { return 'filter' in document.createElement('canvas').getContext('2d'); } catch (e) { return false; } })();
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
  function blit(ctx, s, x, y) {
    const w = s.c.width / K, hh = s.c.height / K;
    ctx.drawImage(s.c, Math.round(x * VSC - (s.ax * VSC) / K) / VSC, Math.round(y * VSC - (s.ay * VSC) / K) / VSC, w, hh);
  }
  function blitScaled(ctx, s, x, y, sx, sy) {
    const w = (s.c.width / K) * sx, hh = (s.c.height / K) * sy;
    ctx.drawImage(s.c, x - (s.ax / K) * sx, y - (s.ay / K) * sy, w, hh);
  }
  function glowSprite(r, g, b, size = 64) {
    return U.sprite(size, size, (ctx, w) => {
      const gr = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.9)`); gr.addColorStop(0.35, `rgba(${r},${g},${b},0.35)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, w);
    });
  }
  function ribCol(cx, cy, zTop, base, dk, lt) {
    return (x, y, z) => {
      const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx);
      if (z >= zTop) return lt;
      return Math.cos(a * 5) > 0.55 ? dk : base;
    };
  }

  /* ================================ palette ================================ */
  const P = {};
  function buildPalette() {
    if (P.pk) return;
    Object.assign(P, {
      // shared with the style
      pk: C('#f7842a'), carve: C('#8a3412'), pkDk: C('#e86f22'), pkLt: C('#fb9036'), stem: C('#5b7a2a'), stemDk: C('#47621f'), leafG: C('#7cc24a'),
      face: C('#ffd84a', { em: 1, jit: 0.03 }), faceHot: C('#fff1a2', { em: 1, jit: 0.02 }), mouth: C('#ffc23a', { em: 1, jit: 0.03 }),
      tPur: C('#9b54d2'), tPurDk: C('#7a3db2'), tPurLt: C('#b672e2'), tCream: C('#f4e9cc'), tCreamDk: C('#ddcfa8'), tRoot: C('#c9a46c'),
      tLeaf: C('#5fbe3b'), tLeafDk: C('#3e8f2b'), tEye: C('#ff4a2c', { em: 1, jit: 0.02 }), tBrow: C('#3a1a50'),
      seed: C('#f8edd2', { jit: 0.03 }), seedDk: C('#dcc394', { jit: 0.03 }),
      white: C('#ffffff', { jit: 0.02 }), steam: C('#eef2f6', { jit: 0.03 }),
      glass: C('#bdf0ff', { jit: 0.03 }), glassDk: C('#7fd0ef', { jit: 0.03 }), glassLt: C('#ecfdff', { jit: 0.02 }),
      gIce: C('#b8d6f3', { jit: 0.03 }), gDeep: C('#94bfea'), gFrost: C('#e2f6ff', { em: 1, jit: 0.02 }),
      heart: C('#ee3b4e'), heartDk: C('#c42a40'), heartLt: C('#ff8b96'),
      iron: C('#3b3540'), lampHot: C('#fff3b8', { em: 1, jit: 0.02 }), lamp: C('#ffcf5a', { em: 1, jit: 0.03 }),
      // Rüben-Spucker
      sPur: C('#8e4fc4'), sPurDk: C('#6e3aa4'), sGrn: C('#7fb546'), sGrnDk: C('#5f9234'), sBelly: C('#e9ecc0'), sBellyDk: C('#cfd59e'),
      sLip: C('#5fcf3a'), sLipDk: C('#3f9e2a'), sHole: C('#173a10', { jit: 0.02 }), sTox: C('#8cff3a', { em: 1, jit: 0.04 }), sToxHot: C('#e4ff9a', { em: 1, jit: 0.02 }),
      sEye: C('#d8ff4a', { em: 1, jit: 0.02 }),
      // Zündrübe
      bRed: C('#d22c48'), bRedDk: C('#a01e3a'), bRedLt: C('#ec4a5c'), bOr: C('#ff7a3a'), bTop: C('#8e1a3a'), bStem: C('#d83a5a'),
      fuse: C('#3d302a'), fuseLt: C('#6b5646'), bEye: C('#ffe04a', { em: 1, jit: 0.02 }), bBrow: C('#3a0a1a', { jit: 0.02 }), bTooth: C('#fff3d6', { jit: 0.02 }),
      // Wurzel-Bock
      cCream: C('#f2dfb0'), cCreamDk: C('#d9be86'), cTan: C('#c49a62'), cRing: C('#b08452'), horn: C('#5e4536'), hornLt: C('#a07e5e'), hoof: C('#4a3a30'),
      cEye: C('#ffd84a', { em: 1, jit: 0.02 }), cRed: C('#ff3a2a', { em: 1, jit: 0.02 }), cNose: C('#5a3a2a', { jit: 0.02 }),
      // Rüben-Ahnin
      mPur: C('#8f5bbf'), mPurDk: C('#6e419c'), mPurLt: C('#a875d4'), mWrinkle: C('#5a3484', { jit: 0.02 }),
      scarf: C('#2f9f96'), scarfDk: C('#1f7f78'), scarfDot: C('#f3e9cf', { jit: 0.02 }),
      // Rübchen
      kPink: C('#e86ab8'), kPinkDk: C('#c24e98'), kWhite: C('#fbf3e0'), kWhiteDk: C('#e3d6b8'),
      // icons
      vine: C('#5fbe3b'), vineDk: C('#3e8f2b'), wisp: C('#c8fff0', { jit: 0.02 }), wispDk: C('#7fe8cf'), boltC: C('#9ffff0', { em: 1, jit: 0.02 }), boltDk: C('#3fd8b8', { em: 1, jit: 0.03 }),
      bowl: C('#f2e4c8'), bowlDk: C('#d8c6a0'), band: C('#4a6ab0'), soup: C('#f39a3c'), soupDk: C('#e07e2c'),
      thorn: C('#f6edd2'), thornDk: C('#d9c99a'), red: C('#e2423a'), redDk: C('#a82a2e'),
    });
  }

  /* ================================ models ================================ */
  // Rüben-Spucker: 13 x 15 x 17. f 0-3 walk, 4-6 aim swell, 7 spit recoil
  function spitterModel(f) {
    const m = new Vox(13, 15, 17, 81);
    const walk = f < 4;
    const legY = walk ? [1, 0, -1, 0][f] : 0, lift = walk ? [0, 1, 0, 1][f] : 0, sway = walk ? [0, 1, 0, -1][f] : 0;
    const sw = f >= 4 && f <= 6 ? (f - 3) / 3 : 0, rec = f === 7 ? 1 : 0;
    m.box(4, 6 + legY, 0, 4, 6 + legY, 1 + lift, P.tRoot);
    m.box(8, 6 - legY, 0, 8, 6 - legY, 1 + lift, P.tRoot);
    if (!lift) { m.set(4, 7 + legY, 0, P.tRoot); m.set(8, 7 - legY, 0, P.tRoot); }
    const k = 1 + 0.14 * sw + 0.06 * rec, kz = 1 - 0.04 * sw - 0.12 * rec;
    const cz = 6.6 + lift - rec * 0.5;
    const ry = 4.6 * k;
    m.blob(6.5, 6, cz, 4.9 * k, ry, 4.5 * kz, (x, y, z) => {
      const t = z + 0.5 - cz + (rnd3(x, y, z, 5) - 0.5) * 1.6;
      const g = rnd3(x, y, z, 11) < 0.2;
      if (t > 1.6) return z + 0.5 > cz + 3.3 ? (g ? P.sGrnDk : P.sPurDk) : g ? P.sGrn : P.sPur;
      if (t > 0.4) return rnd3(x, y, z, 3) < 0.5 ? (g ? P.sGrn : P.sPur) : P.sBelly;
      return z + 0.5 < cz - 2.8 ? P.sBellyDk : P.sBelly;
    });
    m.set(6, 6, Math.floor(cz - 4.5), P.tRoot);
    // spiky leaf tuft
    const tz = Math.floor(cz + 4.3 * kz);
    m.box(6, 6, tz, 6, 6, tz + 1, P.tLeafDk);
    m.box(4 + sway, 6, tz + 2, 4 + sway, 6, tz + 4, P.tLeaf); m.set(3 + sway, 6, tz + 5, P.tLeaf);
    m.box(8 + sway, 5, tz + 2, 8 + sway, 5, tz + 4, P.tLeaf); m.set(9 + sway, 5, tz + 5, P.tLeaf);
    m.box(6 + sway, 4, tz + 2, 6 + sway, 4, tz + 5, P.tLeafDk); m.set(6 + sway, 4, tz + 6, P.tLeaf);
    m.set(5, 6, tz + 2, P.tLeafDk); m.set(7, 5, tz + 2, P.tLeafDk);
    // snout tube + puckered lips + hole
    const ez = Math.round(cz) - 1;
    const yf = Math.floor(6 + ry) - 1;
    const len = rec ? 2 : 3 + (sw > 0.6 ? 1 : 0);
    m.box(5, yf, ez - 1, 7, yf + len - 1, ez + 1, (x, y, z) => (y < yf + 1 ? P.sPur : (x + z) & 1 ? P.sLipDk : P.sLip));
    const ye = yf + len;
    for (let x = 4; x <= 8; x++) for (let z = ez - 2; z <= ez + 2; z++) {
      const corner = (x === 4 || x === 8) && (z === ez - 2 || z === ez + 2);
      if (corner) continue;
      const inner = x >= 5 && x <= 7 && z >= ez - 1 && z <= ez + 1;
      if (inner) m.set(x, ye, z, x === 6 && z === ez ? (sw > 0 ? P.sToxHot : P.sHole) : sw > 0 ? P.sTox : P.sHole);
      else m.set(x, ye, z, (x + z) & 1 ? P.sLip : P.sLipDk);
    }
    if (!rec) { m.set(6, ye, ez - 3, P.sTox); m.set(6, ye, ez - 4, P.sTox); }
    // swelling cheek sacks
    const cr = 1.1 + 1.6 * sw;
    for (const s of [-1, 1]) m.blob(6.5 + s * (3.6 + sw * 0.6), yf - 0.5, ez + 0.5, cr, cr, cr, (x, y, z) => (sw > 0.5 && rnd3(x, y, z, 2) < 0.4 ? P.sLip : P.sGrn));
    // toxic eyes + brows above the snout
    for (const x of [4, 8]) m.paintFront(x, ez + 3, P.sEye);
    for (const [x, z] of [[3, ez + 5], [4, ez + 4], [5, ez + 4], [9, ez + 5], [8, ez + 4], [7, ez + 4]]) m.paintFront(x, z, P.tBrow);
    return m;
  }
  const SPIT_MOUTH = (f) => { const sw = f >= 4 && f <= 6 ? (f - 3) / 3 : 0, rec = f === 7 ? 1 : 0; const cz = 6.6 - rec * 0.5; const ry = 4.6 * (1 + 0.14 * sw + 0.06 * rec); return { y: Math.floor(6 + ry) - 1 + (rec ? 2 : 3 + (sw > 0.6 ? 1 : 0)) + 0.5, z: Math.round(cz) - 1 + 0.5 }; };

  // Zündrübe: 11 x 11 x 15, f 0-3 scurry
  function bomberModel(f) {
    const m = new Vox(11, 11, 15, 91);
    const st = [0, 1, 0, -1][f], lift = [0, 1, 0, 1][f];
    for (const [x, y, s] of [[3, 3, 1], [7, 3, -1], [3, 7, -1], [7, 7, 1]]) {
      const dy = st * s;
      m.box(x, y + dy, 0, x, y + dy, 1 + (s > 0 ? lift : 1 - lift), P.tRoot);
    }
    const cz = 6.2 + (lift ? 0.5 : 0);
    m.blob(5.5, 5.5, cz, 4.4, 4.4, 4.1, (x, y, z) => {
      const r = rnd3(x, y, z, 7);
      if (z + 0.5 > cz + 2.9) return P.bTop;
      if (z + 0.5 < cz - 2.6) return P.bRedDk;
      return r < 0.07 ? P.bOr : r < 0.17 ? P.bRedLt : r > 0.9 ? P.bRedDk : P.bRed;
    }, 2.2);
    m.set(5, 5, Math.floor(cz - 4.3), P.bRedDk);
    // red stems + leaves
    const tz = Math.floor(cz + 4.1);
    m.box(5, 5, tz, 5, 5, tz, P.bStem); m.set(4, 6, tz + 1, P.bStem); m.set(6, 4, tz + 1, P.bStem);
    m.box(3, 6, tz + 2, 3, 7, tz + 2, P.tLeafDk); m.set(2, 7, tz + 3, P.tLeaf);
    m.box(7, 3, tz + 2, 7, 4, tz + 2, P.tLeafDk); m.set(8, 3, tz + 3, P.tLeaf);
    // fuse cord curling up
    for (const [x, y, z, c] of [[5, 5, tz + 1, 'fuse'], [5, 5, tz + 2, 'fuseLt'], [4, 5, tz + 3, 'fuse'], [4, 5, tz + 4, 'fuseLt'], [5, 5, tz + 5, 'fuse'], [6, 5, tz + 5, 'fuseLt']]) m.set(x, y, z, P[c]);
    // mean little eyes, brows, jagged grin
    const ez = Math.round(cz) + 1;
    for (const x of [3, 7]) m.paintFront(x, ez, P.bEye);
    for (const [x, z] of [[2, ez + 2], [3, ez + 1], [4, ez + 1], [8, ez + 2], [7, ez + 1], [6, ez + 1]]) m.paintFront(x, z, P.bBrow);
    for (const x of [3, 4, 5, 6, 7]) m.paintFront(x, ez - 2, P.bBrow);
    m.paintFront(4, ez - 2, P.bTooth); m.paintFront(6, ez - 2, P.bTooth);
    m.paintFront(3, ez - 1, P.bBrow); m.paintFront(7, ez - 1, P.bBrow);
    return m;
  }
  const BOMB_TIP = { x: 6.5, y: 5.5, z: Math.floor(6.2 + 4.1) + 6.2 };

  // Wurzel-Bock: 13 x 18 x 16, poses trot 0-3, rear 4-5, dash 6-7, dizzy 8
  function chargerModel(f) {
    const m = new Vox(13, 19, 16, 101);
    const pose = f < 4 ? 'trot' : f < 6 ? 'rear' : f < 8 ? 'dash' : 'dizzy';
    const ph = f & 1;
    const legs = [[2, 4, 0], [9, 4, 1], [2, 11, 1], [9, 11, 0]]; // x, y, diagonal pair
    const fr = pose === 'rear' ? 2.2 : pose === 'dash' ? -1.2 : 0; // front lift (z)
    const lean = (y) => (pose === 'rear' ? clamp((y - 5) / 8, 0, 1) * fr : pose === 'dash' ? clamp((y - 5) / 8, 0, 1) * fr : 0);
    for (const [x, y, pair] of legs) {
      const isFront = y > 8;
      let dy = 0, lz = 0, top = 4;
      if (pose === 'trot') { const up = (pair ^ (f >> 1 & 1)) && f & 1 ? 1 : 0; dy = [1, 0, -1, 0][f] * (pair ? 1 : -1); lz = up; }
      if (pose === 'rear' && isFront) { lz = Math.round(fr) + (x < 6 ? (ph ? 2 : 0) : (ph ? 0 : 1)); dy = x < 6 ? 1 : 0; }
      if (pose === 'dash') { dy = isFront ? 2 : -2; top = 3; }
      m.box(x, y + dy, lz, x + 1, y + 1 + dy, lz + top, (xx, yy, zz) => (zz === lz ? P.hoof : P.cTan));
    }
    // parsnip body along y: thick shoulders, tapering root behind
    const bz = (pose === 'dash' ? 7.0 : 7.6);
    for (let y = 1; y <= 13; y++) {
      const t = y / 13;
      const r = 1.0 + 4.2 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5);
      const zc = bz + lean(y) + (t < 0.3 ? (0.3 - t) * 3 : 0);
      for (let z = Math.floor(zc - r); z <= Math.ceil(zc + r); z++) for (let x = 0; x < 13; x++) {
        const dx = (x + 0.5 - 6.5) / (r * 1.05), dz = (z + 0.5 - zc) / (r * 0.92);
        if (dx * dx + dz * dz > 1) continue;
        const ring = y % 3 === 0;
        const under = z + 0.5 < zc - r * 0.55;
        m.set(x, y, z, under ? P.cTan : ring ? (rnd3(x, y, z, 3) < 0.6 ? P.cRing : P.cCreamDk) : rnd3(x, y, z, 4) < 0.2 ? P.cCreamDk : P.cCream);
      }
    }
    m.set(6, 0, Math.round(bz + 1), P.cTan); m.set(6, 0, Math.round(bz + 2), P.cTan);
    // head + muzzle
    const hz = pose === 'dash' ? 6.2 : pose === 'rear' ? 9.6 + fr : pose === 'dizzy' ? 6.6 : 7.4;
    const hy = pose === 'dash' ? 15.4 : 14.6;
    const hx = pose === 'dizzy' ? 7.0 : 6.5;
    m.blob(hx, hy, hz, 3.1, 2.9, 2.8, (x, y, z) => (rnd3(x, y, z, 6) < 0.2 ? P.cCreamDk : P.cCream));
    m.box(Math.round(hx) - 2, Math.round(hy) + 2, Math.round(hz) - 3, Math.round(hx) + 1, Math.round(hy) + 3, Math.round(hz) - 1, (x, y, z) => (z === Math.round(hz) - 3 ? P.cRing : P.cTan));
    m.set(Math.round(hx) - 2, Math.round(hy) + 4, Math.round(hz) - 2, P.cNose); m.set(Math.round(hx) + 1, Math.round(hy) + 4, Math.round(hz) - 2, P.cNose);
    // curled ram horns beside the head
    const loop = [[0, 0], [-1, 1], [-2, 1], [-3, 0], [-3, -1], [-2, -2], [-1, -2], [0, -1], [0, -0.01]];
    for (const s of [-1, 1]) {
      const bx = s < 0 ? Math.round(hx) - 4 : Math.round(hx) + 3;
      const by = Math.round(hy), bzz = Math.round(hz) + 2;
      m.box(s < 0 ? bx + 1 : bx - 1, by, bzz + 1, s < 0 ? bx + 1 : bx - 1, by, bzz + 1, P.horn);
      loop.forEach(([dy, dz], i) => {
        const col = i & 1 ? P.hornLt : P.horn;
        m.set(bx, by + dy, bzz + dz, col);
        m.set(bx + s, by + dy, bzz + dz, i < 6 ? col : 0);
      });
      m.set(bx, by + 1, bzz - 2, P.hornLt);
    }
    // eyes / brows
    const ez = Math.round(hz) + 1, ex0 = Math.round(hx) - 2, ex1 = Math.round(hx) + 1;
    const eye = pose === 'rear' ? P.cRed : pose === 'dizzy' ? P.white : P.cEye;
    m.paintFront(ex0, ez, eye); m.paintFront(ex1, ez, eye);
    if (pose === 'dizzy') { m.paintFront(ex0, ez + 1, P.cNose); m.paintFront(ex1, ez - 1, P.cNose); }
    else { m.paintFront(ex0 - 1, ez + 1, P.tBrow); m.paintFront(ex0, ez + 1, P.tBrow); m.paintFront(ex1, ez + 1, P.tBrow); m.paintFront(ex1 + 1, ez + 1, P.tBrow); }
    // leafy mane on the shoulders
    const mz = Math.round(bz + lean(10) + 4.6);
    m.box(6, 10, mz, 6, 11, mz + 1, P.tLeafDk);
    m.box(5, 9, mz + 2, 5, 9, mz + 3, P.tLeaf); m.set(4, 8, mz + 4, P.tLeaf);
    m.box(7, 10, mz + 2, 7, 10, mz + 4, P.tLeaf); m.set(8, 9, mz + 5, P.tLeaf);
    m.box(6, 8, mz + 1, 6, 7, mz + 2, P.tLeafDk); m.set(6, 6, mz + 3, P.tLeaf);
    return m;
  }

  // Rüben-Ahnin: 17 x 16 x 23
  function motherModel(f) {
    const m = new Vox(18, 16, 23, 111);
    const legY = [1, 0, -1, 0][f], lift = [0, 1, 0, 1][f], sway = [0, 1, 0, -1][f];
    m.box(5, 7 + legY, 0, 6, 8 + legY, 2 + lift, (x, y, z) => (z === 0 ? P.tCreamDk : P.tRoot));
    m.box(11, 7 - legY, 0, 12, 8 - legY, 2 + lift, (x, y, z) => (z === 0 ? P.tCreamDk : P.tRoot));
    const cz = 10.0 + lift * 0.6;
    const hem = Math.round(cz + 4.4);
    m.blob(9, 8, cz, 6.9, 6.2, 7.6, (x, y, z) => {
      const t = z + 0.5 - cz + (rnd3(x, y, z, 5) - 0.5) * 1.8;
      const r = rnd3(x, y, z, 9);
      if (t > 0.6) return (z === Math.round(cz) - 2 || z === Math.round(cz) + 2) && r < 0.6 ? P.mWrinkle : r < 0.18 ? P.mPurDk : r > 0.9 ? P.mPurLt : P.mPur;
      if (t > -0.6) return r < 0.5 ? P.mPur : P.tCream;
      return z + 0.5 < cz - 5.2 ? P.tCreamDk : z === Math.round(cz) - 4 && r < 0.5 ? P.tCreamDk : P.tCream;
    }, 2.2);
    m.set(9, 8, 1, P.tRoot);
    // headscarf: cap over everything above the hem, dotted, darker hem row
    m.blob(9, 8, cz + 0.2, 7.4, 6.7, 7.9, (x, y, z) => (z < hem ? undefined : z === hem ? P.scarfDk : (x * 3 + y * 5 + z * 7) % 19 === 0 ? P.scarfDot : P.scarf), 2.2);
    m.recolor((x, y, z, v) => (z > hem && v !== P.scarfDk && v !== P.scarfDot && v !== P.scarf ? P.scarf : undefined));
    // knot + flaps at the front-left
    const fy = m.front(4, hem);
    if (fy >= 0) { m.set(4, fy + 1, hem, P.scarfDk); m.set(3, fy + 1, hem - 1, P.scarf); m.set(3, fy + 1, hem - 2, P.scarfDk); m.set(5, fy + 1, hem - 1, P.scarf); m.set(5, fy + 1, hem - 2, P.scarf); }
    // crown of babies on the scarf
    const top = Math.floor(cz + 7.9);
    for (const [bx, by, bz] of [[5.5, 8, top - 1], [9, 9.5, top], [12.5, 7, top - 1]]) {
      m.blob(bx, by, bz + 1.4, 1.6, 1.6, 1.5, (x, y, z) => (z + 0.5 > bz + 1.6 ? P.kPink : P.kWhite));
      m.set(Math.floor(bx), Math.floor(by), bz + 3, P.tLeaf); m.set(Math.floor(bx) + (sway > 0 ? 1 : 0), Math.floor(by), bz + 4, P.tLeaf);
      m.set(Math.floor(bx) - 1, Math.floor(by) + 1, bz + 1, P.tBrow); m.set(Math.floor(bx), Math.floor(by) + 1, bz + 1, P.tBrow);
    }
    m.box(9, 7, top + 1, 9, 7, top + 2, P.tLeafDk); m.set(8, 6, top + 3, P.tLeaf); m.set(10, 6, top + 3, P.tLeaf);
    // stern old face
    const ez = Math.round(cz) + 1;
    for (const x of [6, 7, 10, 11]) m.paintFront(x, ez, P.face);
    for (const x of [5, 6, 7, 8, 10, 11, 12, 9]) m.paintFront(x, ez + 1, x === 9 ? P.mPur : P.mPurDk);
    const ny = m.front(9, ez - 1); if (ny >= 0) m.set(9, ny + 1, ez - 1, P.mPurLt);
    for (const x of [7, 8, 9, 10, 11]) m.paintFront(x, ez - 3, P.tBrow);
    m.paintFront(6, ez - 4, P.tBrow); m.paintFront(12, ez - 4, P.tBrow);
    for (const [x, z] of [[4, ez - 1], [5, ez - 2], [13, ez - 1], [14, ez], [4, ez + 1]]) m.paintFront(x, z, P.mWrinkle);
    // a baby clinging to her side
    m.blob(1.6, 8, 6.4, 1.6, 1.6, 1.6, (x, y, z) => (z >= 7 ? P.kPink : P.kWhite));
    m.set(1, 8, 8, P.tLeaf); m.set(1, 9, 6, P.tBrow); m.set(2, 9, 6, P.tBrow);
    return m;
  }

  // Rübchen: 7 x 7 x 11
  function sproutModel(f) {
    const m = new Vox(7, 7, 11, 121);
    const legY = [1, 0, -1, 0][f], lift = [0, 1, 0, 1][f];
    m.box(2, 3 + legY, 0, 2, 3 + legY, lift, P.tRoot);
    m.box(4, 3 - legY, 0, 4, 3 - legY, lift, P.tRoot);
    const cz = 3.9 + lift;
    m.blob(3.5, 3.5, cz, 3.1, 2.9, 2.9, (x, y, z) => (z + 0.5 > cz + 0.9 ? (rnd3(x, y, z, 3) < 0.2 ? P.kPinkDk : P.kPink) : z + 0.5 > cz + 0.2 ? (rnd3(x, y, z, 4) < 0.5 ? P.kPink : P.kWhite) : z + 0.5 < cz - 2 ? P.kWhiteDk : P.kWhite));
    // one big leaf
    const tz = Math.floor(cz + 2.9);
    m.set(3, 3, tz, P.tLeafDk); m.set(3, 3, tz + 1, P.tLeaf); m.set(3, 2, tz + 2, P.tLeaf); m.set(2, 2, tz + 2, P.tLeaf);
    m.set(2, 1, tz + 3, P.tLeaf); m.set(1, 1, tz + 3, P.tLeafDk); m.set(1, 1, tz + 4, P.tLeaf); m.set(4, 3, tz + 1, P.tLeafDk);
    // cute-angry face
    const ez = Math.round(cz);
    m.paintFront(2, ez, P.face); m.paintFront(4, ez, P.face);
    m.paintFront(2, ez + 1, P.tBrow); m.paintFront(4, ez + 1, P.tBrow); m.paintFront(3, ez + 1, P.kPinkDk);
    m.paintFront(3, ez - 1, P.tBrow);
    return m;
  }

  /* ================================ lazy sprite types ================================ */
  const TYPES = {}, FX = {};
  const DIRT = [];
  function makeType(builder, nf, o = {}) { return { builder, nf, models: [], frames: [[], []], tint: new Map(), sh: null, shZ: o.shZ || 0 }; }
  function model(Ty, fi) { return Ty.models[fi] || (Ty.models[fi] = Ty.builder(fi)); }
  function frame(Ty, side, fi) {
    let s = Ty.frames[side][fi];
    if (!s) s = Ty.frames[side][fi] = renderVox(model(Ty, fi), side ? -YAW : YAW, PPV);
    return s;
  }
  function tintOf(Ty, side, fi, color) {
    const k = side * 100 + fi + color;
    let t = Ty.tint.get(k);
    if (!t) { const s = frame(Ty, side, fi); t = { c: U.tint(s.c, color), ax: s.ax, ay: s.ay }; Ty.tint.set(k, t); }
    return t;
  }
  function shadowOf(Ty, side) {
    if (!Ty.sh) Ty.sh = [null, null];
    if (!Ty.sh[side]) Ty.sh[side] = renderShadow(model(Ty, 0), side ? -YAW : YAW, PPV, { zoff: Ty.shZ });
    return Ty.sh[side];
  }
  const yawSide = (f) => (f < 0 ? 1 : 0);
  /** world offset of a model voxel point (model coords, centred like renderVox) */
  function vpt(Ty, fi, side, mx, my, mz) {
    const m = model(Ty, fi);
    const X = mx - m.w / 2, Y = my - m.d / 2;
    const yaw = side ? -YAW : YAW, c = Math.cos(yaw), s = Math.sin(yaw);
    const r0 = X * c + Y * s, r1 = -X * s + Y * c;
    return [r0 * VW, (r1 * SP - mz * CP) * VW];
  }

  function build() {
    buildPalette();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const h = (window.__forceH || window.innerHeight || 900) * dpr;
    K = clamp(Math.round((h / 360) * 4) / 4, 1.5, 4);
    VSC = K;
    PPV = Math.max(3, Math.round(K * 1.9));
    VW = PPV / K;
    TYPES.spitter = makeType(spitterModel, 8);
    TYPES.bomber = makeType(bomberModel, 4);
    TYPES.charger = makeType(chargerModel, 9);
    TYPES.mother = makeType(motherModel, 4);
    TYPES.sprout = makeType(sproutModel, 4);
    FX.warm = glowSprite(255, 190, 80);
    FX.tox = glowSprite(150, 255, 70);
    FX.red = glowSprite(255, 60, 40);
    FX.birth = glowSprite(255, 210, 230);
    for (const hx of ['#8c5b37', '#a87a4c', '#6fae46', '#8cff3a', '#3f9e2a']) {
      const m = new Vox(1, 1, 1, 400 + DIRT.length);
      m.set(0, 0, 0, C(hx, { jit: 0 }));
      const fr = [];
      for (let k = 0; k < 6; k++) fr.push(renderVox(m, (k / 6) * (Math.PI / 2), K * 2, { ao: 0, noGround: true }));
      DIRT.push(fr);
    }
  }

  /** common draw: death squash, spawn reveal by voxel layers + popping dirt cubes, capped hit flash */
  function drawBody(ctx, e, Ty, fi, o = {}) {
    const side = o.side !== undefined ? o.side : yawSide(e.facing);
    const s = frame(Ty, side, fi);
    const lift = o.lift || 0;
    if (e.dying) {
      const t = e.deathT / 0.28;
      if (t >= 1) return null;
      blitScaled(ctx, s, e.x, e.y - lift, 1 + t * 0.35, 1 - t * 0.6);
      ctx.globalAlpha = 0.6 * (1 - t);
      blitScaled(ctx, tintOf(Ty, side, fi, '#ffffff'), e.x, e.y - lift, 1 + t * 0.35, 1 - t * 0.6);
      ctx.globalAlpha = 1;
      return null;
    }
    if (e.spawnT < 1) {
      const t = e.spawnT;
      const layer = PPV * CP;
      const total = s.c.height;
      const vis = Math.min(total, Math.round(Math.ceil((U.ease.outQuad(t) * total) / layer) * layer));
      if (vis > 0) {
        const sy = total - vis;
        const x0 = Math.round(e.x * VSC - (s.ax * VSC) / K) / VSC, y0 = Math.round((e.y - lift) * VSC - (s.ay * VSC) / K) / VSC;
        ctx.drawImage(s.c, 0, sy, s.c.width, vis, x0, y0 + sy / K, s.c.width / K, vis / K);
      }
      for (let i = 0; i < 4; i++) {
        const a = e.seed * 20 + i * 1.7, r = 4 + t * 10;
        const z = Math.sin(Math.min(1, t * 1.4) * Math.PI) * (6 + i * 2);
        const cf = DIRT[i % 3][(i + Math.floor(t * 12)) % 6];
        ctx.globalAlpha = 1 - t * 0.8;
        blitScaled(ctx, cf, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.5 - z, 0.7, 0.7);
      }
      ctx.globalAlpha = 1;
      return null;
    }
    const pl = { side, fi, s, x: e.x + (o.ox || 0), y: e.y - lift, sx: o.sx || 1, sy: o.sy || 1 };
    const put = (spr) => (pl.sx !== 1 || pl.sy !== 1 ? blitScaled(ctx, spr, pl.x, pl.y, pl.sx, pl.sy) : blit(ctx, spr, pl.x, pl.y));
    pl.put = put;
    if (o.under) o.under(pl);
    put(s);
    if (o.over) o.over(pl);
    if (e.flash > 0.04) {
      ctx.globalAlpha = Math.min(0.58, e.flash * 0.8);
      put(tintOf(Ty, side, fi, '#ffffff'));
    }
    ctx.globalAlpha = 1;
    return pl;
  }
  function glow(ctx, img, x, y, r, a) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a;
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  /** chunky voxel spark: square + 4 arms */
  function vspark(ctx, x, y, s, col, dark) {
    if (dark) { ctx.fillStyle = dark; ctx.fillRect(x - s * 0.5 - 0.5, y - s * 1.5 - 0.5, s + 1, s * 3 + 1); ctx.fillRect(x - s * 1.5 - 0.5, y - s * 0.5 - 0.5, s * 3 + 1, s + 1); }
    ctx.fillStyle = col;
    ctx.fillRect(x - s * 0.5, y - s * 1.5, s, s * 3);
    ctx.fillRect(x - s * 1.5, y - s * 0.5, s * 3, s);
  }

  /* ---- enemy shot: a blocky glob of toxic juice with a dark outline ---- */
  let SHOT = null;
  function shotSprites() {
    if (SHOT) return SHOT;
    buildPalette();
    const m = new Vox(5, 5, 5, 131);
    m.blob(2.5, 2.5, 2.5, 2.5, 2.5, 2.5, (x, y, z) => (z >= 3 ? (rnd3(x, y, z, 1) < 0.4 ? P.sToxHot : P.sTox) : z <= 1 ? P.sLipDk : P.sLip), 2.3);
    m.set(1, 2, 4, P.white);
    const ppv = Math.max(2, Math.round(PPV * 0.62));
    const frames = [];
    for (let i = 0; i < 4; i++) {
      const s = renderVox(m, (i / 4) * (Math.PI / 2) + 0.3, ppv, { noGround: true, ao: 0.05 });
      const o = U.outline(s.c, '#14300c', Math.max(1, Math.round(K * 0.55)));
      const d = (o.width - s.c.width) / 2;
      frames.push({ c: o, ax: s.ax + d, ay: s.ay + d, h: s.c.height });
    }
    SHOT = { frames, zc: 2.5 * CP * (ppv / K) };
    return SHOT;
  }
  /* ================================ icons ================================ */
  const ICON_MODELS = {
    leech: () => {
      const m = new Vox(12, 10, 17, 505);
      m.blob(6, 5, 2.8, 5.8, 4.8, 3.0, (x, y, z) => (z === 3 ? P.band : z <= 1 ? P.bowlDk : P.bowl), 2.6);
      m.recolor((x, y, z, v) => (z >= 5 ? 0 : undefined));
      m.box(2, 2, 3, 9, 7, 4, 0);
      m.blob(6, 5, 3.6, 4.8, 3.8, 0.7, (x, y, z) => (rnd3(x, y, z, 2) < 0.12 ? P.tCream : rnd3(x, y, z, 3) < 0.4 ? P.soupDk : P.soup));
      for (const [x, y, z] of [[3, 4, 6], [2, 4, 7], [3, 4, 8], [9, 5, 6], [10, 5, 7], [9, 5, 8]]) m.set(x, y, z, P.steam);
      const heart = ['.HHH.HHH.', 'HHHHHHHHH', 'HHHHHHHHH', '.HHHHHHH.', '..HHHHH..', '...HHH...', '....H....'];
      heart.forEach((row, i) => { for (let x = 0; x < 9; x++) if (row[x] === 'H') m.box(x + 1.5, 6, 16 - i, x + 1.5, 7, 16 - i, i < 2 && (x === 1 || x === 2) ? P.heartLt : P.heart); });
      return m.recolor((x, y, z, v) => (v === P.heart && y === 6 ? P.heartDk : undefined));
    },
    thorns: () => {
      const m = new Vox(15, 15, 14, 506);
      m.blob(7.5, 7.5, 6.5, 4.6, 4.6, 4.8, (x, y, z) => (z >= 6 ? (rnd3(x, y, z, 1) < 0.2 ? P.tPurDk : P.tPur) : z === 5 ? P.tPurLt : P.tCream), 2.2);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * TAU, z = 5 + (k & 1) * 2;
        for (let r = 5; r <= 7; r++) m.set(7.5 + Math.cos(a) * r, 7.5 + Math.sin(a) * r, z + (r === 7 ? 0 : 0), r === 7 ? P.thornDk : P.thorn);
      }
      for (const [x, y] of [[6, 7], [9, 8], [7, 9]]) { m.set(x, y, 11, P.thorn); m.set(x, y, 12, P.thornDk); }
      m.paintFront(5, 7, P.tEye); m.paintFront(9, 7, P.tEye);
      m.paintFront(5, 8, P.tBrow); m.paintFront(6, 8, P.tBrow); m.paintFront(8, 8, P.tBrow); m.paintFront(9, 8, P.tBrow);
      return m;
    },
    dashup: () => {
      const m = new Vox(17, 9, 11, 507);
      m.blob(11.5, 4.5, 5, 4.6, 4.2, 4.6, (x, y, z) => { const a = Math.atan2(z + 0.5 - 5, x + 0.5 - 11.5) + 0.6; return Math.cos(a * 5) > 0.55 ? P.pkDk : P.pk; });
      for (const [x, z] of [[9, 6], [13, 6], [10, 3], [11, 3], [12, 3], [13, 4], [9, 4]]) m.paintFront(x, z, P.face);
      m.set(14, 4, 9, P.stem); m.set(15, 4, 9, P.stem);
      for (const [x, z, c] of [[1, 7, 'steam'], [2, 7, 'steam'], [3, 7, 'steam'], [4, 7, 'steam'], [0, 4, 'steam'], [1, 4, 'steam'], [2, 4, 'steam'], [3, 4, 'steam'], [5, 4, 'steam'], [2, 1, 'steam'], [3, 1, 'steam'], [4, 1, 'steam']]) m.set(x, 4, z, P[c]);
      m.blob(6, 6, 0.8, 1.2, 1.2, 0.9, P.tCreamDk);
      return m;
    },
    range: () => {
      const m = new Vox(19, 9, 13, 508);
      for (let y = 0; y < 9; y++) for (let x = 11; x < 19; x++) {
        const d = Math.hypot((x + 0.5 - 15), (y + 0.5 - 4.5) * 1.1);
        if (d <= 4) m.set(x, y, 0, d < 1.2 ? P.red : d < 2.2 ? P.white : d < 3.2 ? P.red : P.white);
      }
      m.set(15, 4, 1, P.redDk);
      for (let i = 0; i < 12; i += 2) {
        const t = i / 12, x = 0.5 + t * 11, z = 1 + Math.sin(t * Math.PI * 0.9) * 10;
        m.set(x, 4, z, P.seed);
      }
      m.blob(12.5, 4.5, 9.5, 3.4, 1.6, 2.2, (x, y, z) => (z >= 10 ? P.seed : P.seedDk));
      m.set(14, 4, 11, P.white); m.set(13, 5, 11, P.white);
      return m;
    },
  };
  function drawIcon(ctx, id, size) {
    buildPalette();
    const mk = ICON_MODELS[id];
    if (!mk) return;
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
  }

  /* ================================ registration ================================ */
  Cn.art('voxel', {
    init() { build(); },
    enemies: {
      spitter(ctx, e, view) {
        VSC = view.S;
        const Ty = TYPES.spitter;
        const aiming = e.mode === 'aim', ch = e.charge || 0, spit = e.spit || 0;
        let fi, ox = 0;
        if (aiming) { fi = 4 + Math.min(2, Math.floor(ch * 3)); ox = Math.sin(view.rt * 70 + e.seed * 9) * 0.5 * ch; }
        else if (spit > 0.3) fi = 7;
        else fi = Math.floor(e.anim * 1.8) & 3;
        const pl = drawBody(ctx, e, Ty, fi, { ox });
        if (!pl) return;
        const mp = SPIT_MOUTH(fi);
        const [dx, dy] = vpt(Ty, fi, pl.side, 6.5, mp.y, mp.z);
        const mx = pl.x + dx, my = pl.y + dy;
        if (aiming) glow(ctx, FX.tox, mx, my, 4 + 7 * ch, (0.35 + 0.55 * ch) * (0.85 + 0.15 * Math.sin(view.rt * 30)));
        if (spit > 0.02) {
          const t = 1 - spit, dir = pl.side ? -1 : 1;
          glow(ctx, FX.tox, mx, my, 5 + 5 * spit, spit * 0.8);
          for (let i = 0; i < 7; i++) {
            const a = (dir > 0 ? 0.55 : Math.PI - 0.55) + (((i * 0.37 + e.seed) % 1) - 0.5) * 1.1;
            const d = 3 + t * (9 + (i % 3) * 5);
            const x = mx + Math.cos(a) * d, y = my + Math.sin(a) * d * SP + t * t * 6;
            const s = (i % 3 === 0 ? 2.2 : 1.6) * (0.6 + spit * 0.5);
            ctx.globalAlpha = Math.min(1, spit * 1.6);
            ctx.fillStyle = '#14300c'; ctx.fillRect(x - s / 2 - 0.5, y - s / 2 - 0.5, s + 1, s + 1);
            ctx.fillStyle = i & 1 ? '#e4ff9a' : '#8cff3a'; ctx.fillRect(x - s / 2, y - s / 2, s, s);
          }
          ctx.globalAlpha = 1;
        }
      },
      bomber(ctx, e, view) {
        VSC = view.S;
        const Ty = TYPES.bomber;
        const fi = Math.floor(e.anim * 2.6) & 3;
        const fuse = e.armed ? e.fuse || 0 : 0;
        const sc = e.armed ? 1 + 0.12 * fuse + 0.04 * Math.sin(view.rt * 40) * fuse : 1;
        const ph = Math.sin(view.rt * (5 + fuse * fuse * 26) + e.seed * 20);
        const pl = drawBody(ctx, e, Ty, fi, {
          sx: sc, sy: sc,
          over: e.armed ? (q) => { ctx.globalAlpha = 0.25 + 0.5 * Math.abs(ph); q.put(tintOf(Ty, q.side, q.fi, ph > 0 ? '#ff2a18' : '#ffffff')); ctx.globalAlpha = 1; } : null,
        });
        if (!pl) return;
        const [dx, dy] = vpt(Ty, fi, pl.side, BOMB_TIP.x, BOMB_TIP.y, BOMB_TIP.z);
        const tx = pl.x + dx * sc, ty = pl.y + dy * sc;
        const fl = 0.75 + 0.25 * Math.sin(view.rt * 37 + e.seed * 7);
        const r = (e.armed ? 4 + 5 * fuse : 3) * fl;
        glow(ctx, FX.warm, tx, ty, r * 1.7, e.armed ? 0.95 : 0.65);
        vspark(ctx, tx, ty, Math.max(0.9, r * 0.32), '#fff3b8');
        if (e.armed) {
          for (let i = 0; i < 3; i++) {
            const a = view.rt * 9 + i * 2.1 + e.seed * 5, d = 2 + ((view.rt * 3 + i * 0.33) % 1) * (3 + 4 * fuse);
            const s = 0.9 + fuse;
            ctx.fillStyle = i & 1 ? '#ffd84a' : '#ff8a2a';
            ctx.fillRect(tx + Math.cos(a) * d - s / 2, ty + Math.sin(a) * d * 0.7 - d * 0.4 - s / 2, s, s);
          }
        }
      },
      charger(ctx, e, view) {
        VSC = view.S;
        const Ty = TYPES.charger;
        const mode = e.mode;
        let fi, ox = 0, side;
        if (mode === 'tele' || mode === 'dash') side = (e.dashX || 1) < 0 ? 1 : 0;
        if (mode === 'tele') { fi = 4 + (Math.floor(view.rt * 9) & 1); ox = Math.sin(view.rt * 80 + e.seed * 7) * 0.6 * Math.min(1, (e.modeT || 0) / 0.3); }
        else if (mode === 'dash') fi = 6 + (Math.floor(view.rt * 14) & 1);
        else if (mode === 'rest') { fi = 8; ox = Math.sin(view.rt * 5 + e.seed * 6) * 1.2; }
        else fi = Math.floor(e.anim * 1.6) & 3;
        const pl = drawBody(ctx, e, Ty, fi, {
          ox, side,
          under: mode === 'dash' ? (q) => {
            const t = tintOf(Ty, q.side, q.fi, '#f2dfb0');
            for (let i = 3; i >= 1; i--) { ctx.globalAlpha = 0.14 * (4 - i); blit(ctx, t, q.x - (e.dashX || 0) * i * 7, q.y - (e.dashY || 0) * i * 7); }
            ctx.globalAlpha = 1;
          } : null,
        });
        if (!pl) return;
        if (mode === 'tele') {
          const k = Math.min(1, (e.modeT || 0) / 0.72);
          const [dx, dy] = vpt(Ty, fi, pl.side, 6.5, 18, 11.5);
          glow(ctx, FX.red, pl.x + dx, pl.y + dy, 6 + 5 * k, 0.55 + 0.4 * k);
          for (let i = 0; i < 3; i++) {
            const t = (view.rt * 2.2 + i / 3 + e.seed) % 1;
            const [fx, fy] = vpt(Ty, fi, pl.side, 3 + i * 3, 14 - t * 6, 0);
            const cf = DIRT[i % 2][(i + Math.floor(t * 12)) % 6];
            ctx.globalAlpha = 1 - t;
            blitScaled(ctx, cf, pl.x + fx, pl.y + fy - Math.sin(t * Math.PI) * 6, 0.6, 0.6);
          }
          ctx.globalAlpha = 1;
        } else if (mode === 'rest') {
          const [dx, dy] = vpt(Ty, fi, pl.side, 7, 15, 14);
          const hx = pl.x + dx, hy = pl.y + dy;
          for (let i = 0; i < 3; i++) {
            const a = view.rt * 6 + (i / 3) * TAU;
            vspark(ctx, hx + Math.cos(a) * 7, hy + Math.sin(a) * 2.6, 1.1, i === 1 ? '#ffffff' : '#ffd84a', '#5a3a10');
          }
        }
      },
      mother(ctx, e, view) {
        VSC = view.S;
        const Ty = TYPES.mother;
        const fi = Math.floor(e.anim * 1.1) & 3;
        const b = e.birth || 0;
        let sx = 1, sy = 1;
        if (b > 0.01) { const w = Math.sin((1 - b) * Math.PI * 3) * b; sy = 1 - 0.15 * w; sx = 1 + 0.11 * w; }
        const pl = drawBody(ctx, e, Ty, fi, { sx, sy });
        if (!pl) return;
        if (b > 0.01) {
          const [dx, dy] = vpt(Ty, fi, pl.side, 9, 8, 17);
          const gx = pl.x + dx, gy = pl.y + dy;
          glow(ctx, FX.birth, gx, gy, 18 + 10 * (1 - b), b * 0.7);
          const r = 14 + (1 - b) * 20;
          ctx.globalAlpha = b * 0.85;
          ctx.strokeStyle = '#fff1c8';
          ctx.lineWidth = 2 * b + 0.5;
          ctx.strokeRect(e.x - r, e.y - r * SP, r * 2, r * 2 * SP);
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * TAU + e.seed * 4;
            vspark(ctx, gx + Math.cos(a) * (8 + (1 - b) * 12), gy + Math.sin(a) * (5 + (1 - b) * 6) - (1 - b) * 6, 0.8 * b + 0.3, i & 1 ? '#ffd84a' : '#ffb0dc');
          }
          ctx.globalAlpha = 1;
        }
      },
      sprout(ctx, e, view) {
        VSC = view.S;
        drawBody(ctx, e, TYPES.sprout, Math.floor(e.anim * 2.6) & 3);
      },
    },
    shadow(ctx, o, view) {
      const Ty = TYPES[o.type];
      if (!Ty) return false;
      VSC = view.S;
      const side = o.type === 'charger' && (o.mode === 'tele' || o.mode === 'dash') ? ((o.dashX || 1) < 0 ? 1 : 0) : yawSide(o.facing);
      const sh = shadowOf(Ty, side);
      let a = 0.42;
      if (o.dying) a *= Math.max(0, 1 - o.deathT / 0.3);
      if (o.spawnT < 1) a *= o.spawnT;
      if (!sh || a <= 0.01) return true;
      ctx.globalAlpha = a;
      blit(ctx, sh, o.x, o.y);
      ctx.globalAlpha = 1;
      return true;
    },
    shot(ctx, s, view) {
      VSC = view.S;
      const S = shotSprites();
      const x = s.x, y = s.y - (s.z || 0);
      const ca = Math.cos(s.angle || 0), sa = Math.sin(s.angle || 0);
      glow(ctx, FX.tox, x, y, 10, 0.55);
      for (let i = 3; i >= 1; i--) {
        const d = i * 3.4 + 1.5, sz = 3 - i * 0.6;
        const wob = Math.sin((s.age || 0) * 20 + i * 1.3 + (s.seed || 0) * 9) * 0.8;
        const tx = x - ca * d - sa * wob, ty = y - sa * d + ca * wob;
        ctx.globalAlpha = 1 - i * 0.2;
        ctx.fillStyle = '#14300c'; ctx.fillRect(tx - sz / 2 - 0.6, ty - sz / 2 - 0.6, sz + 1.2, sz + 1.2);
        ctx.fillStyle = i === 1 ? '#c8ff6e' : '#8cff3a'; ctx.fillRect(tx - sz / 2, ty - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
      const fi = Math.floor((s.age || 0) * 10 + (s.seed || 0) * 4) & 3;
      blit(ctx, S.frames[fi], x, y + S.zc);
    },
    icons: {
      leech(ctx, size) { drawIcon(ctx, 'leech', size); },
      thorns(ctx, size) { drawIcon(ctx, 'thorns', size); },
      dashup(ctx, size) { drawIcon(ctx, 'dashup', size); },
      range(ctx, size) { drawIcon(ctx, 'range', size); },
    },
  });
})();
