/* Herbsternte 16-Bit – SNES-era cozy autumn afternoon on the farmland.
   Everything is pixel art at 1 art pixel = 1 world unit, painted procedurally in init():
   hue-shifted ramps, top-left light, 1-px coloured outlines, hand-tuned shapes. */
(function () {
  'use strict';
  const U = window.U, G = window.G;

  /* =====================================================================
     Colour helpers + palette
     ===================================================================== */
  const hx = (s) => U.hex(s);
  const hexes = (a) => a.map(hx);
  const mixc = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  const rgbs = (c) => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  const INK = hx('#24162a');

  // light from the top-left-front (shared by every sprite)
  const LV = (() => { const v = [-0.5, -0.6, 0.62]; const l = Math.hypot(v[0], v[1], v[2]); return v.map((a) => a / l); })();
  const lam = (nx, ny, nz) => nx * LV[0] + ny * LV[1] + nz * LV[2];
  const qi = (l, th) => { let i = 0; while (i < th.length && l > th[i]) i++; return i; };

  // character / prop ramps (deep → highlight)
  const R = {
    pk: hexes(['#74282a', '#b0462a', '#de6e2c', '#f59a3c', '#ffc76c']),
    stem: hexes(['#2c4628', '#4a7030', '#6e9c3c']),
    cloak: hexes(['#1b3236', '#26473e', '#336046', '#447a4c', '#5c9652']),
    scarf: hexes(['#8e4e26', '#cc842e', '#f2be4c']),
    pants: hexes(['#2a2032', '#40304a']),
    boot: hexes(['#331f1e', '#583624', '#7e512e', '#a4733e']),
    tpur: hexes(['#2c1740', '#4c235f', '#713488', '#9654a8', '#bf80c8']),
    tmag: hexes(['#381634', '#5e2248', '#86325e', '#ad5278', '#d07e98']),
    cream: hexes(['#8a6458', '#b8946e', '#dcc290', '#f2e2b0', '#fff6da']),
    leaf: hexes(['#22402c', '#356432', '#4f8c3a', '#78b246']),
    root: hexes(['#6e5040', '#a2845e', '#cdb282']),
    ice: hexes(['#465482', '#7488bc', '#a6bee2', '#d4e6f6', '#f6fcff']),
    rut: hexes(['#4e3028', '#7a5034', '#a87a46', '#cfa25a', '#ead08a']),
    rpur: hexes(['#2e1832', '#4a2448', '#6c3660', '#8e5078']),
    moss: hexes(['#2c4a30', '#467036', '#689a44']),
    bark: hexes(['#3a2228', '#5a3428', '#7c4c32', '#9e6c44']),
    wood: hexes(['#3e2420', '#64402a', '#8c5e36', '#b8844c', '#d8aa6a']),
    straw: hexes(['#7a5a2a', '#ad8436', '#d2aa48', '#ecd070', '#faeaa0']),
    glow: hexes(['#f2902a', '#ffc640', '#fff2a8']),
    glowB: hexes(['#e07a26', '#ffaa34', '#ffde7a']),
    stone: hexes(['#5a5064', '#8a8090', '#b8aea8', '#e0d8c8']),
    red: hexes(['#5a1a28', '#962a2e', '#d0442e', '#f07a54']),
  };
  const TREE_RAMPS = [
    hexes(['#5a2230', '#963a2c', '#c95c2c', '#ea8a36', '#f7ba5c']), // orange
    hexes(['#461a30', '#782434', '#a6362f', '#cb5639', '#e8844e']), // red
    hexes(['#573826', '#946629', '#c69832', '#e6c24a', '#f6e084']), // gold
    hexes(['#253e3a', '#476636', '#8a8a34', '#cc8a34', '#f0ba58']), // turning (green core → orange tips)
  ];

  /* =====================================================================
     Tiny pixel painter (colours are [r,g,b] or [r,g,b,a])
     ===================================================================== */
  function outlineOf(c) {
    const l = (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255;
    return mixc(c, INK, 0.58 + 0.26 * l);
  }
  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.a = new Array(w * h).fill(null); }
    set(x, y, c) {
      x = Math.floor(x); y = Math.floor(y);
      if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      this.a[y * this.w + x] = c;
    }
    get(x, y) {
      x = Math.floor(x); y = Math.floor(y);
      return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.a[y * this.w + x];
    }
    del(x, y) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y * this.w + x] = null; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
    rows(x, y, rows, pal) {
      for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
        const ch = rows[j][i];
        if (pal[ch]) this.set(x + i, y + j, pal[ch]);
      }
    }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy, n = 0;
      for (;;) {
        this.set(x0, y0, typeof c === 'function' ? c(n++, x0, y0) : c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
    }
    // ellipse; fn(nx, ny, nz, x, y) → colour
    blob(cx, cy, rx, ry, fn) {
      for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx); x++) {
          const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
          if (d > 1) continue;
          const c = fn(nx, ny, Math.sqrt(1 - d), x, y);
          if (c) this.set(x, y, c);
        }
      }
    }
    // tapered leaf/blade between two points
    leaf(x0, y0, x1, y1, wmax, ramp, pow = 0.75) {
      const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy, len = Math.sqrt(l2);
      const bx0 = Math.floor(Math.min(x0, x1) - wmax - 1), bx1 = Math.ceil(Math.max(x0, x1) + wmax + 1);
      const by0 = Math.floor(Math.min(y0, y1) - wmax - 1), by1 = Math.ceil(Math.max(y0, y1) + wmax + 1);
      for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
        const px = x + 0.5 - x0, py = y + 0.5 - y0;
        const t = (px * dx + py * dy) / l2;
        if (t < 0 || t > 1) continue;
        const side = (px * dy - py * dx) / len;
        const w = wmax * Math.sin(Math.PI * Math.pow(t, pow)) + 0.35;
        if (Math.abs(side) > w) continue;
        const sg = side < 0 ? -1 : 1;
        const nxs = (dy / len) * sg, nys = (-dx / len) * sg;
        const lit = -(nxs * 0.6 + nys * 0.8);
        let k = lit > 0.15 ? 2 : 1;
        if (Math.abs(side) < 0.55 && t > 0.12 && t < 0.85) k = 1;
        if (t > 0.8 && lit > 0) k = 3;
        if (lit < -0.5 && Math.abs(side) > w - 0.9) k = 0;
        this.set(x, y, ramp[Math.min(k, ramp.length - 1)]);
      }
    }
    canvas(outline = true, oc = null) {
      const pad = outline ? 1 : 0, W = this.w + pad * 2, Hh = this.h + pad * 2;
      const { c, ctx } = U.canvas(W, Hh);
      const img = ctx.createImageData(W, Hh), d = img.data;
      for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
        const sx = x - pad, sy = y - pad;
        let col = this.get(sx, sy), a = 255;
        if (col) a = col.length > 3 ? col[3] : 255;
        else if (outline) {
          let r = 0, g = 0, b = 0, n = 0, al = 0;
          const nb = [this.get(sx - 1, sy), this.get(sx + 1, sy), this.get(sx, sy - 1), this.get(sx, sy + 1)];
          for (const q of nb) {
            if (!q || q.noOut) continue;
            r += q[0]; g += q[1]; b += q[2]; al += q.length > 3 ? q[3] : 255; n++;
          }
          if (!n) continue;
          col = oc || outlineOf([r / n, g / n, b / n]);
          a = al / n;
        } else continue;
        const o = (y * W + x) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = a;
      }
      ctx.putImageData(img, 0, 0);
      return c;
    }
  }
  const pair = (c) => ({ r: c, l: U.flipX(c) });
  // draws img so that pixel (ax, ay) of the image lands on world (x, y)
  function blit(ctx, img, x, y, ax, ay) { ctx.drawImage(img, Math.round(x - ax), Math.round(y - ay)); }

  /* =====================================================================
     Ground
     ===================================================================== */
  const SD = { forest: 1101, path: 2203, pw1: 2207, pw2: 2211, clover: 3301, gold: 3307, macro: 3313, mot: 3323, zone: 3331, field: 4401, tree: 5501 };
  const GRASS = 0, GOLD = 1, CLOVER = 2, SOIL = 3, PATH = 4;
  const forestF = (x, y) => U.warped(x / 640, y / 640, SD.forest, 1.1, 3);
  function pathN(x, y) {
    const qx = U.fbm(x / 470, y / 470, SD.pw1, 2) - 0.5, qy = U.fbm(x / 470 + 3.7, y / 470 - 1.9, SD.pw2, 2) - 0.5;
    return U.perlin((x + qx * 320) / 980, (y + qy * 320) / 980, SD.path);
  }
  function pathDistA(x, y) {
    const e = 4, n = pathN(x, y);
    const gx = (pathN(x + e, y) - pathN(x - e, y)) / (2 * e), gy = (pathN(x, y + e) - pathN(x, y - e)) / (2 * e);
    return Math.min(400, Math.abs(n) / Math.max(1e-6, Math.hypot(gx, gy)));
  }
  const macroA = (x, y) => U.fbm(x / 1100, y / 1100, SD.macro, 2);
  const pathHW = (mv) => 8.5 + mv * 6;

  // farm fields: one optional rounded rectangle per 400x300 cell (never overlapping)
  const FCW = 400, FCH = 300;
  const fieldCache = new Map();
  function fieldCell(i, j) {
    const key = i + ',' + j;
    if (fieldCache.has(key)) return fieldCache.get(key);
    let f = null;
    const r = U.rng(U.hashInt(i, j, SD.field));
    if (r.next() < 0.5) {
      const w = Math.round(r.range(150, 290)), h = Math.round(r.range(96, 190));
      const x0 = Math.round(i * FCW + r.range(24, FCW - w - 24)), y0 = Math.round(j * FCH + r.range(24, FCH - h - 24));
      const cx = x0 + w / 2, cy = y0 + h / 2;
      if (forestF(cx, cy) < 0.53 && pathDistA(cx, cy) > 26) {
        f = {
          x0, y0, x1: x0 + w, y1: y0 + h, cx, cy, hw: w / 2, hh: h / 2,
          horiz: r.next() < 0.7, phase: (r.next() * 6) | 0, crop: r.next() < 0.4 ? 0 : r.next() < 0.55 ? 1 : 2,
          seed: (r.next() * 1e6) | 0, fence: r.next() < 0.6, fenceB: r.next() < 0.3, scare: r.next() < 0.4, i, j,
        };
      }
    }
    if (fieldCache.size > 6000) fieldCache.clear();
    fieldCache.set(key, f);
    return f;
  }
  function fieldsIn(x0, y0, x1, y1) {
    const out = [];
    for (let j = Math.floor(y0 / FCH); j <= Math.floor(y1 / FCH); j++) {
      for (let i = Math.floor(x0 / FCW); i <= Math.floor(x1 / FCW); i++) {
        const f = fieldCell(i, j);
        if (f && f.x1 > x0 && f.x0 < x1 && f.y1 > y0 && f.y0 < y1) out.push(f);
      }
    }
    return out;
  }
  function fieldSdf(f, x, y) {
    const r = 6;
    const qx = Math.abs(x - f.cx) - (f.hw - r), qy = Math.abs(y - f.cy) - (f.hh - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  }
  function fieldSdfAt(x, y) {
    let s = 99;
    for (const f of fieldsIn(x - 1, y - 1, x + 1, y + 1)) s = Math.min(s, fieldSdf(f, x, y));
    // neighbours may still be close
    for (const f of fieldsIn(x - 40, y - 40, x + 40, y + 40)) s = Math.min(s, fieldSdf(f, x, y));
    return s;
  }

  // trees: one optional per 58x58 cell, dense in forest regions, lone trees elsewhere
  const TC = 58;
  const treeCache = new Map();
  function treeCell(i, j) {
    const key = i + ',' + j;
    if (treeCache.has(key)) return treeCache.get(key);
    let t = null;
    const r = U.rng(U.hashInt(i, j, SD.tree));
    const x = Math.round((i + 0.15 + 0.7 * r.next()) * TC), y = Math.round((j + 0.15 + 0.7 * r.next()) * TC);
    const roll = r.next();
    const F = forestF(x, y);
    const p = U.smoothstep(0.57, 0.72, F) * 0.42 + 0.022;
    if (roll < p && !G.nearSpawn(x, y, 110)) {
      if (pathDistA(x, y) > pathHW(macroA(x, y)) + 12 && fieldSdfAt(x, y) > 20) {
        const big = r.next() < 0.6;
        // groves share a dominant colour (low-frequency), lone trees are mostly golden
        const zn = U.fbm(x / 380, y / 380, SD.zone + 7, 2);
        let v = zn < 0.42 ? 1 : zn < 0.5 ? 3 : zn < 0.58 ? 0 : 2;
        if (r.next() < 0.25) v = (r.next() * 4) | 0;
        t = { x, y, v, big, flip: r.next() < 0.5, s: r.next() };
      }
    }
    if (treeCache.size > 8000) treeCache.clear();
    treeCache.set(key, t);
    return t;
  }
  function treesIn(x0, y0, x1, y1) {
    const out = [];
    for (let j = Math.floor(y0 / TC) - 1; j <= Math.floor(y1 / TC) + 1; j++) {
      for (let i = Math.floor(x0 / TC) - 1; i <= Math.floor(x1 / TC) + 1; i++) {
        const t = treeCell(i, j);
        if (t && t.x >= x0 && t.x < x1 && t.y >= y0 && t.y < y1) out.push(t);
      }
    }
    return out;
  }
  // leaf litter density + colour zone (tree discs take the colour of their tree)
  const TREE_ZONE = [3, 0, 2, 1];
  const LD = { d: 0, z: 0 };
  function leafDens(x, y, F, trees) {
    let d = U.smoothstep(0.585, 0.69, F) * 1.25, z = -1, best = 0;
    for (let k = 0; k < trees.length; k++) {
      const t = trees[k];
      const dx = (x - t.x) / (t.big ? 38 : 31), dy = (y - t.y + 3) / (t.big ? 22 : 18);
      const q = 1 - (dx * dx + dy * dy);
      if (q > 0) {
        d = Math.max(d, q * 1.8);
        if (q > best) { best = q; z = TREE_ZONE[t.v]; }
      }
    }
    if (z < 0) { const n = U.fbm(x / 170, y / 170, SD.zone, 2); z = n < 0.45 ? 0 : n < 0.56 ? 1 : 2; }
    LD.d = d; LD.z = z;
    return LD;
  }

  // ground palettes
  // tones: 0 base, 1 tuft dark, 2 tuft light, 3 bright tip, 4 trefoil light, 5 trefoil dark, 6 mottle patch
  const GP = [
    { t: hexes(['#77963b', '#617f38', '#8ea945', '#a6bd55', '#86a948', '#557a39', '#7e9c3f']), rim: hx('#9ab64e'), rim2: hx('#88a645'), lip: hx('#456b39'), dk: hx('#668639') },
    { t: hexes(['#9a9d45', '#80873c', '#b0b052', '#cbc366', '#aaab4f', '#757d3c', '#a2a449']), rim: hx('#bcba5b'), rim2: hx('#aaaa50'), lip: hx('#5a6e38'), dk: hx('#878e3f') },
    { t: hexes(['#5b893f', '#48723c', '#6c9a48', '#83b054', '#7aaa4c', '#3d643b', '#608e43']), rim: hx('#78a64b'), rim2: hx('#699745'), lip: hx('#33573a'), dk: hx('#4d7a3d') },
  ];
  const SOILC = {
    fur: hexes(['#a26e44', '#8a5a3c', '#784d36', '#664132', '#50332f', '#5c3a31']),
    rim: hx('#734a35'), rimL: hx('#8d5d3d'), sh: hx('#3c2530'), sh2: hx('#513232'),
    clodL: hx('#b07a4c'), clodD: hx('#462a2c'),
  };
  const PATHC = {
    base: hx('#b08a5a'), light: hx('#c4a06a'), bright: hx('#d6b882'), dark: hx('#987450'), rut: hx('#9e7a50'),
    edge: hx('#a4804f'), sh: hx('#755244'), sh2: hx('#8f6a4c'),
  };
  // leaf litter colours [light, base, dark] per hue
  const LEAFSETS = [
    hexes(['#c8563b', '#a33b31', '#7c2b33']), // red
    hexes(['#da763b', '#bc5a2f', '#8f402f']), // rust
    hexes(['#eda146', '#d88437', '#ab5e2f']), // orange
    hexes(['#efcb5d', '#d6a944', '#a67c37']), // yellow
    hexes(['#aa7a50', '#8b5c3c', '#673f32']), // brown
  ];
  const LEAFC = [null];
  for (const s of LEAFSETS) { LEAFC.push(s[0], s[1], s[2], s[1]); }
  // litter ground between the leaves, per colour zone (red, rust, gold, orange)
  const LITTER = hexes(['#7c3531', '#86412f', '#93582f', '#8d4a2d']);
  const LITTER2 = hexes(['#6c2c2f', '#76372d', '#82492c', '#7c3f2b']);
  // leaf stamp shapes (1 light, 2 base, 3 dark)
  const LEAFSH = [
    ['.12.', '1223', '.23.'],
    ['.1.', '122', '223', '.3.'],
    ['12.', '223', '.3.'],
    ['.12', '122', '23.'],
    ['122', '.23'],
  ];
  // leaf colour picks per zone
  const LEAFZ = [
    [0, 0, 0, 1, 1, 0, 4, 1],
    [1, 1, 1, 2, 0, 1, 4, 2],
    [3, 3, 2, 3, 2, 3, 4, 1],
    [2, 2, 2, 1, 1, 3, 2, 4],
  ];
  // grass tufts (1 dark, 2 light, 3 bright)
  const TUFTS = [
    ['..2..', '2.1.2', '1.1.1', '.111.'],
    ['2.2', '1.1', '.1.'],
    ['.2..', '21.2', '.1.1', '..1.'],
    ['.3.3.', '.2.2.', '21.12', '.111.'],
    ['3.3', '2.2', '1.1', '.1.'],
  ];
  const TREFOIL = [['.4.', '454', '.5.'], ['44.', '454', '.5.'], ['.44', '545', '.5.']];

  // jitter tiles (smooth, tileable, world aligned)
  let JA = null, JB = null;
  function buildJitter() {
    JA = new Float32Array(4096); JB = new Float32Array(4096);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      JA[y * 64 + x] = (U.fbmTile(x / 8, y / 8, 8, 71, 2) - 0.5) * 2.2;
      JB[y * 64 + x] = (U.fbmTile(x / 8 + 0.37, y / 8 + 0.61, 8, 97, 2) - 0.5) * 2.2;
    }
  }

  // ground decal sprites: rows + palette → flat [dx, dy, r, g, b, kind] (kind 1 = shadow multiply)
  function decal(rows, pal, ox = 0, oy = 0) {
    const out = [];
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      if (ch === 's') { out.push(x - ox, y - oy, 0, 0, 0, 1); continue; }
      const c = pal[ch];
      if (!c) continue;
      out.push(x - ox, y - oy, c[0], c[1], c[2], 0);
    }
    return out;
  }
  const DEC = {};
  function buildDecals() {
    const fl = (petal, petal2) => decal(['.p.', 'PyP', '.gs'], { p: hx(petal), P: hx(petal2), y: hx('#f6d040'), g: hx('#3f6a36') }, 1, 1);
    DEC.flowers = [
      fl('#fbf6e6', '#e2dac8'), fl('#f4d24a', '#d8a838'), fl('#c79ae0', '#9a6cbc'), fl('#9cc0f0', '#7090cc'), fl('#f0a2b4', '#d07890'),
    ];
    DEC.flowerTiny = [
      decal(['w', 's'], { w: hx('#fbf6e6') }), decal(['y', 's'], { y: hx('#f4d24a') }), decal(['p', 's'], { p: hx('#c79ae0') }),
    ];
    DEC.mush = [
      decal(['.rrr.', 'rwrrw', 'RRRRR', '.scs.', '..cs.'], { r: hx('#d6402e'), R: hx('#962a2e'), w: hx('#fff4dc'), c: hx('#efe0c0') }, 2, 4),
      decal(['.bb.', 'bBBB', '.cs.'], { b: hx('#c08a52'), B: hx('#8a5a36'), c: hx('#efe0c0') }, 1, 2),
      decal(['.rr..', 'rwrr.', 'RRRR.', '.cs.r', '.c.RR', '...c.'], { r: hx('#d6402e'), R: hx('#962a2e'), w: hx('#fff4dc'), c: hx('#efe0c0') }, 1, 4),
    ];
    DEC.pumpkin = [
      decal(['..g..', '.hoo.', 'hoood', 'oodDD', '.sDD.'], { g: hx('#4a7030'), h: hx('#f8a848'), o: hx('#e07a2e'), d: hx('#b4502a'), D: hx('#7e3228') }, 2, 4),
      decal(['...g...', '.hh.oo.', 'hoohood', 'ooodooD', 'oodDdDD', '.sDDDs.'], { g: hx('#4a7030'), h: hx('#f8a848'), o: hx('#e07a2e'), d: hx('#b4502a'), D: hx('#7e3228') }, 3, 5),
    ];
    DEC.pebble = [
      decal(['hl', 'md'], { h: R.stone[3], l: R.stone[2], m: R.stone[1], d: R.stone[0] }),
      decal(['l.', 'ds'], { l: R.stone[2], d: R.stone[1] }),
      decal(['.hl', 'lmd', 'sss'], { h: R.stone[3], l: R.stone[2], m: R.stone[1], d: R.stone[0] }, 1, 1),
      decal(['m'], { m: hx('#8e6c4a') }),
      decal(['d', 'm'], { d: hx('#c9a674'), m: hx('#8e6c4a') }),
    ];
    DEC.edgeStone = [
      decal(['.hhl.', 'hllmd', 'lmmdd', '.sss.'], { h: R.stone[3], l: R.stone[2], m: R.stone[1], d: R.stone[0] }, 2, 2),
      decal(['.hl.', 'hlmd', '.dd.', '.ss.'], { h: R.stone[3], l: R.stone[2], m: R.stone[1], d: R.stone[0] }, 2, 2),
      decal(['hhl', 'lmd', 'sss'], { h: R.stone[3], l: R.stone[2], m: R.stone[1], d: R.stone[0] }, 1, 1),
    ];
    DEC.rock = [
      decal(['..hhl..', '.hllmm.', 'hlllmdd', 'lmmmddd', '.sssss.'], { h: R.stone[3], l: R.stone[2], m: R.stone[1], d: R.stone[0] }, 3, 3),
      decal(['.hl.', 'hlmd', 'mmdd', 'sss.'], { h: R.stone[3], l: R.stone[2], m: R.stone[1], d: R.stone[0] }, 2, 2),
    ];
    DEC.twig = [
      decal(['w....', 'Www..', '..WWw', '...sW'], { w: R.wood[3], W: R.wood[1] }, 2, 2),
      decal(['...w', '.wW.', 'wWs.', 'W...'], { w: R.wood[3], W: R.wood[1] }, 2, 2),
      decal(['ww..w', 'WWwWW', '..sss'], { w: R.wood[3], W: R.wood[1] }, 2, 1),
    ];
    DEC.leaf = [];
    for (const s of LEAFSETS) {
      DEC.leaf.push(decal(['.ab', 'abc', 'cs.'], { a: s[0], b: s[1], c: s[2] }, 1, 1));
      DEC.leaf.push(decal(['ab.', 'bbc', '.cs'], { a: s[0], b: s[1], c: s[2] }, 1, 1));
    }
    DEC.sprout = [
      decal(['l.l', '.g.', '.s.'], { l: hx('#7cb446'), g: hx('#4a8636') }, 1, 1),
      decal(['.l.', 'lgl', '.s.'], { l: hx('#7cb446'), g: hx('#4a8636') }, 1, 1),
    ];
    DEC.turnip = [
      decal(['l.l.', '.gl.', 'qpp.', 'pPPs'], { l: hx('#7cb446'), g: hx('#4a8636'), q: hx('#c27ecc'), p: hx('#8a48a0'), P: hx('#5a2c6e') }, 1, 2),
      decal(['.ll.', 'l.gl', '.qp.', '.pPs'], { l: hx('#7cb446'), g: hx('#4a8636'), q: hx('#c27ecc'), p: hx('#8a48a0'), P: hx('#5a2c6e') }, 1, 2),
    ];
    DEC.cloverFlower = [decal(['.w.', 'wpw', '.s.'], { w: hx('#f6f0f0'), p: hx('#f2c2d0') }, 1, 1)];
  }

  const CS = 256, MG = 4, NB = CS + MG * 2, GS = 4, GM = 12, GW = (CS + GM * 2) / GS + 1;

  function* buildChunk(ctx, info) {
    const wx = info.wx, wy = info.wy;
    const gx0 = wx - GM, gy0 = wy - GM, GN = GW * GW;
    const gF = new Float32Array(GN), gP = new Float32Array(GN), gC = new Float32Array(GN), gT = new Float32Array(GN);
    const gM = new Float32Array(GN), gD = new Float32Array(GN), gL = new Float32Array(GN), gO = new Float32Array(GN);
    const gZ = new Uint8Array(GN);
    const trees = treesIn(wx - 70, wy - 50, wx + CS + 70, wy + CS + 70);
    for (let j = 0; j < GW; j++) {
      for (let i = 0; i < GW; i++) {
        const x = gx0 + i * GS, y = gy0 + j * GS, k = j * GW + i;
        const F = forestF(x, y);
        gF[k] = F;
        gP[k] = pathN(x, y);
        // clover / moss: own patches + a fringe ring around the groves
        const fringe = U.smoothstep(0.46, 0.53, F) * (1 - U.smoothstep(0.6, 0.66, F));
        gC[k] = U.fbm(x / 360, y / 360, SD.clover, 3) + fringe * 0.2;
        gT[k] = U.fbm(x / 430, y / 430, SD.gold, 3);
        gM[k] = macroA(x, y);
        gO[k] = U.fbm(x / 52, y / 52, SD.mot, 2);
        const ld = leafDens(x, y, F, trees);
        gL[k] = ld.d; gZ[k] = ld.z;
      }
      if ((j & 7) === 7) yield;
    }
    for (let j = 1; j < GW - 1; j++) for (let i = 1; i < GW - 1; i++) {
      const k = j * GW + i;
      const gxv = (gP[k + 1] - gP[k - 1]) / (2 * GS), gyv = (gP[k + GW] - gP[k - GW]) / (2 * GS);
      gD[k] = Math.min(400, Math.abs(gP[k]) / Math.max(1e-6, Math.hypot(gxv, gyv)));
    }
    const samp = (arr, X, Y) => {
      const gx = (X - gx0) / GS, gy = (Y - gy0) / GS;
      const i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j, k = j * GW + i;
      const a = arr[k] + (arr[k + 1] - arr[k]) * fx, b = arr[k + GW] + (arr[k + GW + 1] - arr[k + GW]) * fx;
      return a + (b - a) * fy;
    };
    const zoneAt = (X, Y) => gZ[Math.round((Y - gy0) / GS) * GW + Math.round((X - gx0) / GS)];
    yield;

    /* ---- material map (with a 4 px margin so edge rules see across chunk borders) ---- */
    const fields = fieldsIn(wx - 20, wy - 20, wx + CS + 20, wy + CS + 20);
    const NN = NB * NB;
    const raw = new Uint8Array(NN), mat = new Uint8Array(NN), mot = new Uint8Array(NN);
    const pdB = new Float32Array(NN), sdB = new Float32Array(NN), fiB = new Uint8Array(NN), mvB = new Float32Array(NN), ldB = new Float32Array(NN);
    const X0 = wx - MG, Y0 = wy - MG;
    for (let py = 0; py < NB; py++) {
      const Y = Y0 + py, gy = (Y - gy0) / GS, j = gy | 0, fy = gy - j;
      for (let px = 0; px < NB; px++) {
        const X = X0 + px, i0 = py * NB + px;
        const gx = (X - gx0) / GS, i = gx | 0, fx = gx - i, k = j * GW + i;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        const k1 = k + 1, k2 = k + GW, k3 = k + GW + 1;
        const pd = gD[k] * w00 + gD[k1] * w10 + gD[k2] * w01 + gD[k3] * w11;
        const mv = gM[k] * w00 + gM[k1] * w10 + gM[k2] * w01 + gM[k3] * w11;
        const ti = ((Y & 63) << 6) | (X & 63);
        const ja = JA[ti], jb = JB[ti];
        let m;
        if (pd + ja * 2.2 < pathHW(mv)) m = PATH;
        else {
          let sd = 99, fi = 0;
          for (let f = 0; f < fields.length; f++) {
            const s = fieldSdf(fields[f], X + 0.5, Y + 0.5);
            if (s < sd) { sd = s; fi = f; }
          }
          if (sd + jb * 1.2 < 0) { m = SOIL; sdB[i0] = sd; fiB[i0] = fi; }
          else {
            const c = gC[k] * w00 + gC[k1] * w10 + gC[k2] * w01 + gC[k3] * w11;
            const t = gT[k] * w00 + gT[k1] * w10 + gT[k2] * w01 + gT[k3] * w11;
            if (c + jb * 0.035 > 0.64) m = CLOVER;
            else if (t + ja * 0.03 > 0.555) m = GOLD;
            else m = GRASS;
            const o = gO[k] * w00 + gO[k1] * w10 + gO[k2] * w01 + gO[k3] * w11;
            mot[i0] = o + jb * 0.035 > 0.575 ? 1 : 0;
          }
        }
        raw[i0] = m; pdB[i0] = pd; mvB[i0] = mv;
        ldB[i0] = gL[k] * w00 + gL[k1] * w10 + gL[k2] * w01 + gL[k3] * w11;
      }
      if ((py & 31) === 31) yield;
    }
    // pixel cleanup: remove 1-px spurs between height classes (grass / soil / path) and grass variants
    const cls = (m) => (m <= CLOVER ? 0 : m);
    mat.set(raw);
    for (let py = 1; py < NB - 1; py++) for (let px = 1; px < NB - 1; px++) {
      const i = py * NB + px, m = raw[i], c = cls(m);
      const a = raw[i - 1], b = raw[i + 1], u = raw[i - NB], d = raw[i + NB];
      const same = (cls(a) === c) + (cls(b) === c) + (cls(u) === c) + (cls(d) === c);
      if (same <= 1) {
        const ca = cls(a), cb = cls(b), cu = cls(u);
        mat[i] = (ca === cb || ca === cu || ca === cls(d)) ? a : (cb === cu || cb === cls(d)) ? b : u;
      } else if (c === 0) {
        const s2 = (a === m) + (b === m) + (u === m) + (d === m);
        if (s2 <= 1) mat[i] = (a === b || a === u || a === d) && a <= CLOVER ? a : (b === u || b === d) && b <= CLOVER ? b : m;
      }
    }
    yield;

    /* ---- detail stamps: tufts, trefoils, leaf litter ---- */
    const toneB = new Uint8Array(NN), leafB = new Uint8Array(NN);
    {
      const TW = 7, TH = 6;
      const c0x = Math.floor(X0 / TW) - 1, c1x = Math.floor((X0 + NB) / TW), c0y = Math.floor(Y0 / TH) - 1, c1y = Math.floor((Y0 + NB) / TH);
      for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
        const h = U.hashInt(cx, cy, 7717);
        const ax = cx * TW + (h & 3), ay = cy * TH + ((h >>> 2) & 3);
        const lx = ax - X0, ly = ay - Y0;
        if (lx < -5 || ly < -4 || lx >= NB || ly >= NB) continue;
        const sx = U.clamp(ax, wx - 8, wx + CS + 8), sy = U.clamp(ay, wy - 8, wy + CS + 8);
        const clump = samp(gO, sx, sy);
        const p = 0.05 + 0.42 * U.smoothstep(0.42, 0.72, clump);
        if (((h >>> 4) & 1023) / 1024 > p) continue;
        const am = mat[U.clamp(ly + 2, 0, NB - 1) * NB + U.clamp(lx + 1, 0, NB - 1)];
        const sh = am === GOLD ? TUFTS[3 + ((h >>> 14) & 1)] : TUFTS[(h >>> 14) % 3];
        for (let y = 0; y < sh.length; y++) for (let x = 0; x < sh[y].length; x++) {
          const ch = sh[y].charCodeAt(x) - 48;
          if (ch < 1 || ch > 9) continue;
          const qx = lx + x, qy = ly + y;
          if (qx < 0 || qy < 0 || qx >= NB || qy >= NB) continue;
          const qi2 = qy * NB + qx;
          if (mat[qi2] <= CLOVER && !toneB[qi2]) toneB[qi2] = ch;
        }
      }
      // clover trefoils
      const d0x = Math.floor(X0 / 5) - 1, d1x = Math.floor((X0 + NB) / 5), d0y = Math.floor(Y0 / 4) - 1, d1y = Math.floor((Y0 + NB) / 4);
      for (let cy = d0y; cy <= d1y; cy++) for (let cx = d0x; cx <= d1x; cx++) {
        const h = U.hashInt(cx, cy, 6619);
        if ((h & 255) > 110) continue;
        const ax = cx * 5 + ((h >>> 8) & 3), ay = cy * 4 + ((h >>> 10) & 3);
        const lx = ax - X0, ly = ay - Y0;
        const sh = TREFOIL[(h >>> 12) % 3];
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
          const ch = sh[y].charCodeAt(x) - 48;
          if (ch < 1 || ch > 9) continue;
          const qx = lx + x, qy = ly + y;
          if (qx < 0 || qy < 0 || qx >= NB || qy >= NB) continue;
          const qi2 = qy * NB + qx;
          if (mat[qi2] === CLOVER) toneB[qi2] = ch;
        }
      }
      yield;
      // leaf litter: overlapping leaf stamps whose survival depends on local density → organic carpet edges
      const e0x = Math.floor(X0 / 3) - 2, e1x = Math.floor((X0 + NB) / 3), e0y = Math.floor(Y0 / 3) - 2, e1y = Math.floor((Y0 + NB) / 3);
      for (let cy = e0y; cy <= e1y; cy++) {
        for (let cx = e0x; cx <= e1x; cx++) {
          const h = U.hashInt(cx, cy, 8819);
          const ax = cx * 3 + (h & 3) % 3, ay = cy * 3 + ((h >>> 2) & 3) % 3;
          const sx = U.clamp(ax, wx - 8, wx + CS + 8), sy = U.clamp(ay, wy - 8, wy + CS + 8);
          const ld = samp(gL, sx, sy);
          if (ld < 0.03) continue;
          const rank = ((h >>> 4) & 1023) / 1024;
          if (rank > ld * 1.05 - 0.12) continue;
          const sh = LEAFSH[(h >>> 14) % LEAFSH.length];
          const set = LEAFZ[zoneAt(sx, sy)][(h >>> 18) & 7];
          const lx = ax - X0, ly = ay - Y0;
          for (let y = 0; y < sh.length; y++) for (let x = 0; x < sh[y].length; x++) {
            const ch = sh[y].charCodeAt(x) - 48;
            if (ch < 1 || ch > 3) continue;
            const qx = lx + x, qy = ly + y;
            if (qx < 0 || qy < 0 || qx >= NB || qy >= NB) continue;
            const qi2 = qy * NB + qx;
            if (mat[qi2] <= CLOVER) leafB[qi2] = set * 4 + ch;
          }
        }
        if ((cy & 15) === 15) yield;
      }
    }

    /* ---- final colour pass ---- */
    const out = ctx.createImageData(CS, CS), od = out.data;
    for (let py = MG; py < MG + CS; py++) {
      const Y = Y0 + py;
      for (let px = MG; px < MG + CS; px++) {
        const X = X0 + px, i = py * NB + px, m = mat[i];
        const hh = U.hashInt(X, Y, 4242);
        const hr = (hh & 1023) / 1024;
        const ti = ((Y & 63) << 6) | (X & 63);
        let col;
        if (m <= CLOVER) {
          const gp = GP[m];
          const dn = mat[i + NB], up = mat[i - NB], lf = mat[i - 1], rt = mat[i + 1];
          if (dn > CLOVER) col = gp.lip;
          else if (up > CLOVER) col = gp.rim;
          else if (leafB[i]) col = LEAFC[leafB[i]];
          else if (ldB[i] + JA[ti] * 0.12 > 0.62) { const z = zoneAt(X, Y); col = (hh >>> 15) % 5 ? LITTER[z] : LITTER2[z]; }
          else if (lf > CLOVER) col = gp.rim2;
          else if (rt > CLOVER) col = gp.dk;
          else col = gp.t[toneB[i] || (mot[i] ? 6 : 0)];
        } else {
          const up = mat[i - NB], up2 = mat[i - NB * 2], lf = mat[i - 1];
          const isS = m === SOIL;
          if (up <= CLOVER) col = (hh >>> 12) & 1 ? GP[up].lip : isS ? SOILC.sh : PATHC.sh;
          else if (up2 <= CLOVER) col = ((X + Y) & 1) || ((hh >>> 13) & 1) ? (isS ? SOILC.sh2 : PATHC.sh2) : (isS ? SOILC.sh : PATHC.sh);
          else if (lf <= CLOVER) col = isS ? SOILC.sh2 : PATHC.sh2;
          else if (isS) {
            if (up === PATH) col = SOILC.sh2;
            else {
              const f = fields[fiB[i]], sd = sdB[i];
              if (sd > -3.2) col = mat[i + NB] <= CLOVER || mat[i + NB] === PATH ? SOILC.rimL : SOILC.rim;
              else {
                const wob = Math.round(JB[ti] * 1.3);
                const ph = ((((f.horiz ? Y : X) + f.phase + wob) % 6) + 6) % 6;
                col = SOILC.fur[ph];
                if (hr < 0.035) col = SOILC.clodL;
                else if (hr < 0.06) col = SOILC.clodD;
              }
            }
          } else {
            if (up === SOIL) col = PATHC.sh2;
            else {
              const pd = pdB[i], hw = pathHW(mvB[i]);
              col = Math.abs(pd - hw * 0.42) < 1.05 ? PATHC.rut : pd > hw - 1.6 ? PATHC.edge : PATHC.base;
              if (hr < 0.05) col = PATHC.light;
              else if (hr < 0.085) col = PATHC.dark;
              else if (hr < 0.095) col = PATHC.bright;
            }
          }
        }
        const mv = mvB[i];
        const k = 0.955 + mv * 0.09, wr = (mv - 0.5) * 0.03;
        const o = ((py - MG) * CS + (px - MG)) * 4;
        od[o] = col[0] * (k + wr); od[o + 1] = col[1] * k; od[o + 2] = col[2] * (k - wr); od[o + 3] = 255;
      }
      if ((py & 31) === 31) yield;
    }

    /* ---- decals (deterministic across chunk borders) ---- */
    const stamp = (spr, X, Y) => {
      X = Math.round(X); Y = Math.round(Y);
      for (let n = 0; n < spr.length; n += 6) {
        const lx = X + spr[n] - wx, ly = Y + spr[n + 1] - wy;
        if (lx < 0 || ly < 0 || lx >= CS || ly >= CS) continue;
        const o = (ly * CS + lx) * 4;
        if (spr[n + 5] === 1) { od[o] *= 0.72; od[o + 1] *= 0.7; od[o + 2] *= 0.8; }
        else { od[o] = spr[n + 2]; od[o + 1] = spr[n + 3]; od[o + 2] = spr[n + 4]; }
      }
    };
    const fieldSd = (X, Y) => { let s = 99; for (const f of fields) s = Math.min(s, fieldSdf(f, X, Y)); return s; };
    const pdAt = (X, Y) => samp(gD, X, Y);
    const hwAt = (X, Y) => pathHW(samp(gM, X, Y));
    const onGrass = (X, Y, pad) => pdAt(X, Y) > hwAt(X, Y) + pad && fieldSd(X, Y) > pad;
    const kindAt = (X, Y) => {
      const t = samp(gT, X, Y), c = samp(gC, X, Y);
      return c > 0.64 ? CLOVER : t > 0.555 ? GOLD : GRASS;
    };
    const MGD = 7;
    // flowers (small clusters, meadow-dependent colours)
    G.scatter(info, 21, 9101, MGD, (x, y, rng) => {
      if (!onGrass(x, y, 5) || samp(gL, x, y) > 0.15) return;
      const kd = kindAt(x, y);
      const dens = (kd === GOLD ? 0.34 : kd === CLOVER ? 0.3 : 0.22) * (0.4 + U.smoothstep(0.4, 0.7, samp(gO, x, y)) * 1.2);
      if (rng.next() > dens) return;
      const n = 1 + ((rng.next() * 3) | 0);
      const pal = kd === GOLD ? [1, 1, 0, 4] : kd === CLOVER ? [0, 0, 4, 2] : [2, 0, 3, 0];
      const pc = pal[(rng.next() * pal.length) | 0];
      for (let q = 0; q < n; q++) {
        const fx = x + (q ? rng.range(-5, 5) : 0), fy = y + (q ? rng.range(-3, 3) : 0);
        if (kd === CLOVER && rng.next() < 0.6) stamp(DEC.cloverFlower[0], fx, fy);
        else if (rng.next() < 0.3) stamp(DEC.flowerTiny[(rng.next() * 3) | 0], fx, fy);
        else stamp(DEC.flowers[pc], fx, fy);
      }
    });
    yield;
    // mushrooms near trees / leaves
    G.scatter(info, 30, 9202, MGD, (x, y, rng) => {
      const ld = samp(gL, x, y);
      if (ld < 0.15 || pdAt(x, y) < hwAt(x, y) + 3 || rng.next() > 0.3) return;
      stamp(DEC.mush[(rng.next() * DEC.mush.length) | 0], x, y);
      if (rng.next() < 0.4) stamp(DEC.mush[1], x + rng.range(3, 6), y + rng.range(-1, 2));
    });
    // small pumpkins + rocks in meadows
    G.scatter(info, 84, 9303, MGD, (x, y, rng) => {
      if (!onGrass(x, y, 8) || samp(gL, x, y) > 0.3) return;
      const r = rng.next();
      if (r < 0.2) stamp(DEC.pumpkin[(rng.next() * 2) | 0], x, y);
      else if (r < 0.42) stamp(DEC.rock[(rng.next() * 2) | 0], x, y);
    });
    // twigs
    G.scatter(info, 36, 9707, MGD, (x, y, rng) => {
      if (pdAt(x, y) < hwAt(x, y) + 2 || fieldSd(x, y) < 3) return;
      const ld = samp(gL, x, y);
      if (rng.next() > (ld > 0.3 ? 0.45 : 0.06)) return;
      stamp(DEC.twig[(rng.next() * 3) | 0], x, y);
    });
    // stray leaves around the carpets and on forest paths
    G.scatter(info, 12, 9404, MGD, (x, y, rng) => {
      const ld = samp(gL, x, y);
      const pd = pdAt(x, y), hw = hwAt(x, y);
      let p = 0;
      if (pd < hw - 1) p = ld > 0.25 ? 0.4 : samp(gF, x, y) > 0.52 ? 0.12 : 0.02;
      else if (ld > 0.02 && ld < 0.45) p = 0.22;
      if (rng.next() > p) return;
      const z = zoneAt(U.clamp(x, wx - 8, wx + CS + 8), U.clamp(y, wy - 8, wy + CS + 8));
      stamp(DEC.leaf[LEAFZ[z][(rng.next() * 8) | 0] * 2 + (rng.next() < 0.5 ? 0 : 1)], x, y);
    });
    yield;
    // path pebbles + edge stones
    G.scatter(info, 8, 9505, MGD, (x, y, rng) => {
      const pd = pdAt(x, y), hw = hwAt(x, y);
      if (pd > hw - 2.5 || rng.next() > 0.2) return;
      stamp(DEC.pebble[(rng.next() * DEC.pebble.length) | 0], x, y);
    });
    G.scatter(info, 10, 9606, MGD, (x, y, rng) => {
      const pd = pdAt(x, y), hw = hwAt(x, y);
      if (pd < hw - 3.5 || pd > hw - 0.5 || rng.next() > 0.28 || fieldSd(x, y) < 2) return;
      stamp(DEC.edgeStone[(rng.next() * DEC.edgeStone.length) | 0], x, y);
    });
    // crops in the fields (rows on the furrow ridges)
    for (const f of fields) {
      if (!f.crop) continue;
      const spr = f.crop === 2 ? DEC.turnip : DEC.sprout;
      const okP = (x, y) => { const cx = U.clamp(x, wx - 8, wx + CS + 8), cy = U.clamp(y, wy - 8, wy + CS + 8); return pdAt(cx, cy) > hwAt(cx, cy) + 3; };
      if (f.horiz) {
        for (let y = Math.max(f.y0, wy - 6); y <= Math.min(f.y1, wy + CS + 6); y++) {
          if (((((y + f.phase) % 6) + 6) % 6) !== 1) continue;
          for (let x = f.x0 + 6; x < f.x1 - 6; x += 8) {
            const h = U.hashInt(x, y, f.seed);
            if ((h & 7) === 0) continue;
            const xx = x + ((h >>> 3) & 1);
            if (xx < wx - 6 || xx > wx + CS + 6) continue;
            if (fieldSdf(f, xx, y) > -6 || !okP(xx, y)) continue;
            stamp(spr[(h >>> 4) & 1], xx, y);
          }
        }
      } else {
        for (let x = Math.max(f.x0, wx - 6); x <= Math.min(f.x1, wx + CS + 6); x++) {
          if (((((x + f.phase) % 6) + 6) % 6) !== 1) continue;
          for (let y = f.y0 + 7; y < f.y1 - 5; y += 7) {
            const h = U.hashInt(x, y, f.seed);
            if ((h & 7) === 0) continue;
            if (y < wy - 6 || y > wy + CS + 6) continue;
            if (fieldSdf(f, x, y) > -6 || !okP(x, y)) continue;
            stamp(spr[(h >>> 4) & 1], x + 1, y);
          }
        }
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  /* =====================================================================
     Characters
     ===================================================================== */
  const SPR = {};

  // carved face helper: list of [x, y, tone] (tone 0 edge, 1 mid, 2 core)
  function carve(p, pts, glow, cut) {
    const set = new Set();
    for (const [x, y] of pts) set.add(x + ',' + y);
    for (const [x, y, t] of pts) {
      p.set(x, y, glow[t]);
      if (!set.has(x + ',' + (y - 1)) && p.get(x, y - 1)) p.set(x, y - 1, cut);
    }
  }
  const pts = (rows, ox, oy) => {
    const out = [];
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const t = '012'.indexOf(r[x]); if (t >= 0) out.push([ox + x, oy + y, t]); } });
    return out;
  };

  function pumpkinBody(p, cx, cy, rx, ry, ramp, creases, th) {
    const idx = new Map();
    p.blob(cx, cy, rx, ry, (nx, ny, nz, x, y) => {
      const l = lam(nx, ny, nz);
      const k = qi(l, th || [-0.22, 0.14, 0.5, 0.8]);
      idx.set(x + ',' + y, k);
      return ramp[k];
    });
    // ribs: 1-px darker vertical curves
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      const ny = (y + 0.5 - cy) / ry;
      if (Math.abs(ny) >= 0.92) continue;
      const span = rx * Math.sqrt(1 - ny * ny);
      for (const c of creases) {
        const x = Math.floor(cx + c * span);
        const k = idx.get(x + ',' + y);
        if (k === undefined) continue;
        p.set(x, y, ramp[Math.max(0, k - 1)]);
      }
    }
    return idx;
  }

  function makeJack(mode, f, glow) {
    const p = new Pix(22, 30);
    const WALK = [
      { bob: 0, a: 2, b: -2, la: 0, lb: 0, hand: 1, flap: 0 },
      { bob: -1, a: 0, b: 0, la: 0, lb: -1, hand: 0, flap: 1 },
      { bob: 0, a: -2, b: 2, la: 0, lb: 0, hand: -1, flap: 0 },
      { bob: -1, a: 0, b: 0, la: -1, lb: 0, hand: 0, flap: 1 },
    ];
    const s = mode === 'walk' ? WALK[f] : { bob: 0, a: 0, b: 0, la: 0, lb: 0, hand: 0, flap: f, hb: f };
    const GL = glow ? R.glowB : R.glow;
    const by = s.bob;
    // legs (far leg first): dark trousers + chunky brown boots with a lit cuff
    const leg = (x, lift, far) => {
      const fb = 29 + lift;
      for (let y = 22; y <= fb - 3; y++) p.rect(x, y, 2, 1, far ? R.pants[0] : R.pants[1]);
      p.rect(x, fb - 2, 2, 1, R.boot[far ? 2 : 3]);
      p.rect(x, fb - 1, 3, 1, R.boot[far ? 1 : 2]);
      p.rect(x, fb, 3, 1, R.boot[far ? 0 : 1]);
      if (!far) p.set(x, fb - 1, R.boot[3]);
    };
    leg(8 + s.b, s.lb, true);
    leg(11 + s.a, s.la, false);
    // short cape: straight front edge, back edge flares out behind (left)
    const top = 17 + by;
    for (let r = 0; r < 7; r++) {
      const y = top + r;
      const xl = Math.round(11 - 3.6 - r * 0.6) - (r >= 4 ? s.flap : 0);
      const xr = Math.round(11 + 3.4 + r * 0.2);
      for (let x = xl; x < xr; x++) {
        if (r === 6 && (x === xl || x === xr - 1)) continue;
        const u = (x - xl) / Math.max(1, xr - xl - 1);
        let k = u < 0.25 ? 3 : u < 0.6 ? 2 : u < 0.86 ? 1 : 0;
        if (r === 0) k = Math.min(4, k + 1);
        if (r === 6) k = Math.max(0, k - 1);
        if (r >= 3 && x === xl + 2) k = Math.max(0, k - 1);
        p.set(x, y, R.cloak[k]);
      }
    }
    // front arm: sleeve + glove, swinging
    const ax = 13 + s.hand;
    for (let y = top + 1; y <= top + 3; y++) { p.set(ax, y, R.cloak[3]); p.set(ax + 1, y, R.cloak[2]); }
    p.set(ax, top + 4, R.boot[3]); p.set(ax + 1, top + 4, R.boot[2]);
    p.set(ax, top + 5, R.boot[2]); p.set(ax + 1, top + 5, R.boot[1]);
    // mustard scarf with a fluttering tail
    for (let x = 6; x <= 15; x++) {
      p.set(x, top - 1, R.scarf[x < 11 ? 2 : 1]);
      p.set(x, top, R.scarf[x < 9 ? 1 : 0]);
    }
    p.set(6, top + 1, R.scarf[2]); p.set(5, top + 1, R.scarf[1]);
    p.set(5 - s.flap, top + 2, R.scarf[2]); p.set(4 - s.flap, top + 2, R.scarf[1]);
    p.set(4 - s.flap, top + 3, R.scarf[0]);
    // head
    const hy = 9.2 + by + (s.hb || 0);
    pumpkinBody(p, 11, hy, 8.6, 6.7, R.pk, [-0.5, 0.05, 0.58]);
    const ht = Math.floor(hy - 6.7);
    p.set(10, ht, R.pk[1]); p.set(11, ht, R.pk[1]); p.set(12, ht, R.pk[2]);
    p.set(10, ht - 1, R.stem[2]); p.set(11, ht - 1, R.stem[1]);
    p.set(10, ht - 2, R.stem[2]); p.set(11, ht - 2, R.stem[1]);
    p.set(11, ht - 3, R.stem[2]); p.set(12, ht - 3, R.stem[1]);
    p.set(13, ht - 1, R.stem[2]); p.set(14, ht - 2, R.stem[2]); p.set(14, ht - 1, R.stem[1]);
    // carved face (facing right): triangle eyes + jagged grin
    const ey = Math.round(hy) - 3;
    carve(p, pts([
      '.1....1..',
      '121..121.',
    ], 9, ey).concat(pts([
      '0.......0',
      '1121.1211',
      '.0122210.',
    ], 8, ey + 4)), GL, R.pk[0]);
    return p.canvas();
  }

  function makeCreeper(f, v) {
    const TOP = v ? R.tmag : R.tpur;
    const p = new Pix(20, 26);
    const st = [
      { sx: 0, by: 0, la: 0, lb: -1, sw: 0 },
      { sx: 1, by: -1, la: 0, lb: 0, sw: 1 },
      { sx: 0, by: 0, la: -1, lb: 0, sw: 0 },
      { sx: -1, by: -1, la: 0, lb: 0, sw: -1 },
    ][f];
    const leg = (x, lift, far) => {
      const fb = 25 + lift;
      for (let y = 21; y < fb; y++) p.rect(x, y, 2, 1, R.root[far ? 0 : 1]);
      p.set(x, 21, R.root[far ? 1 : 2]);
      p.rect(x, fb, 3, 1, R.root[far ? 0 : 1]);
      p.set(x, fb, R.root[far ? 1 : 2]);
    };
    leg(6, st.lb, true);
    leg(11, st.la, false);
    // bulb (turnip: wide shoulders, tapering to a root tip)
    const cx = 10 + st.sx * 0.5, cy = 15 + st.by, rx = 7.6, ry = 7.4;
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) {
      for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const wf = ny > 0.1 ? 1 - 0.6 * Math.pow((ny - 0.1) / 0.9, 1.25) : 1;
        const nxx = nx / Math.max(0.05, wf), d = nxx * nxx + ny * ny;
        if (d > 1) continue;
        const nz = Math.sqrt(1 - d);
        const l = lam(nxx, ny, nz);
        const zb = 0.02 + 0.12 * Math.sin(nxx * 8.5 + 1.3);
        const k = qi(l, [-0.3, 0.08, 0.46, 0.8]);
        let c = ny < zb ? TOP[k] : R.cream[k];
        if (ny >= zb && ny < zb + 0.13) c = mixc(TOP[Math.min(4, k + 1)], R.cream[k], 0.5);
        p.set(x, y, c);
      }
    }
    // root tip
    p.set(Math.floor(cx), Math.floor(cy + ry), R.cream[1]);
    // leaves
    const lb = Math.floor(cy - ry) + 1;
    p.leaf(9.5, lb + 1, 4 + st.sw, lb - 5, 1.8, R.leaf);
    p.leaf(11, lb + 1, 16.5 + st.sw, lb - 5.5, 1.8, R.leaf);
    p.leaf(10.2, lb + 1, 10.4 + st.sw, lb - 8, 2.1, R.leaf);
    p.set(10, lb, TOP[1]); p.set(9, lb, TOP[2]); p.set(11, lb, TOP[1]);
    // face (facing right): angry glowing eyes + slanted brows + frown with one fang
    const ex = Math.round(cx) + 1, ey = Math.round(cy) - 1;
    const B = hx('#22122c');
    p.set(ex - 1, ey - 2, B); p.set(ex, ey - 1, B); p.set(ex + 1, ey - 1, B);
    p.set(ex + 5, ey - 2, B); p.set(ex + 4, ey - 1, B); p.set(ex + 3, ey - 1, B);
    const E = R.glow;
    p.set(ex, ey, E[2]); p.set(ex + 1, ey, E[1]); p.set(ex, ey + 1, E[1]); p.set(ex + 1, ey + 1, E[0]);
    p.set(ex + 3, ey, E[2]); p.set(ex + 4, ey, E[1]); p.set(ex + 3, ey + 1, E[0]); p.set(ex + 4, ey + 1, E[0]);
    const my = ey + 4;
    p.set(ex, my + 1, B); p.set(ex + 1, my, B); p.set(ex + 2, my, B); p.set(ex + 3, my, B); p.set(ex + 4, my + 1, B);
    p.set(ex + 1, my + 1, R.cream[4]);
    return p.canvas();
  }

  function makeGhost(f) {
    const p = new Pix(22, 28);
    const I = R.ice;
    const cx = 9.5, cy = 8.5;
    // tattered sheet body that streams behind (left) and waves
    for (let y = 9; y <= 27; y++) {
      const t = (y - 9) / 18;
      const ccx = cx - 4 * t * t + Math.sin(f * Math.PI / 2 + t * 4.2) * 1.9 * t;
      const hw = 6.3 * (1 - 0.6 * Math.pow(t, 1.05)) + 0.2;
      for (let x = Math.floor(ccx - hw) - 1; x <= Math.ceil(ccx + hw); x++) {
        const dx = x + 0.5 - ccx;
        if (Math.abs(dx) > hw) continue;
        const u = (dx / hw + 1) / 2;
        if (t > 0.5) {
          const sIdx = Math.min(2, Math.floor(u * 3));
          const su = u * 3 - sIdx;
          const len = [0.88, 1.0, 0.76][(sIdx + f) % 3];
          if (t > len) continue;
          if (su < 0.18 + (t - 0.5) * 0.7 || su > 0.95) continue;
        }
        const u2 = dx / hw;
        let k = u2 < -0.4 ? 3 : u2 < 0.3 ? 2 : u2 < 0.72 ? 1 : 0;
        if (t > 0.45 && k > 1) k--;
        const c = I[k].slice(); c[3] = Math.round(235 - t * 105);
        p.set(x, y, c);
      }
    }
    // head
    p.blob(cx, cy, 6.6, 7.4, (nx, ny, nz) => {
      const k = qi(lam(nx, ny, nz), [-0.25, 0.12, 0.5, 0.82]);
      const c = I[Math.min(4, k)].slice(); c[3] = 242;
      return c;
    });
    // gaunt cheeks: cool shadow under the eye sockets
    const CH = I[1].slice(); CH[3] = 242;
    // sunken, hollow eye sockets (facing right)
    const D0 = hx('#100d24'), D1 = hx('#272650');
    for (const [x, y, c] of [
      [10, 5, D1], [11, 5, D1], [10, 6, D0], [11, 6, D0], [10, 7, D0], [11, 7, D1], [10, 8, D1],
      [14, 5, D1], [14, 6, D0], [15, 6, D1], [14, 7, D0], [14, 8, D1],
      [9, 9, CH], [12, 9, CH], [15, 9, CH],
    ]) p.set(x, y, c);
    // gaping, hungry mouth (opens wider on odd frames)
    const M0 = hx('#3a2652');
    const my = 10, wide = f % 2;
    for (const [x, y, c] of [[11, my, D1], [12, my, D1], [13, my, D1],
      [11, my + 1, D0], [12, my + 1, M0], [13, my + 1, D0],
      [11, my + 2, D0], [12, my + 2, M0], [13, my + 2, D0],
      [12, my + 3, D1]]) p.set(x, y, c);
    if (wide) { p.set(11, my + 3, D0); p.set(13, my + 3, D0); p.set(12, my + 4, D1); }
    // skinny arms reaching for Jack
    const aw = [0, 1, 0, -1][f];
    const ac = I[3].slice(); ac[3] = 215;
    const ac2 = I[2].slice(); ac2[3] = 190;
    p.set(15, 13, ac); p.set(16, 13, ac); p.set(17, 12 + (aw > 0 ? 1 : 0), ac); p.set(18, 12 + aw, ac2);
    p.set(19, 11 + aw, ac2); p.set(19, 13 + aw, ac2); p.set(20, 12 + aw, ac2);
    p.set(14, 15, ac2); p.set(15, 15, ac2); p.set(16, 16 + (aw < 0 ? 1 : 0), ac2); p.set(17, 16, ac2);
    return p.canvas(true, hx('#33406c'));
  }

  function makeColossus(f) {
    const p = new Pix(52, 58);
    const st = [
      { by: 0, la: 0, lb: -2, arm: 0 },
      { by: 1, la: 0, lb: 0, arm: 1 },
      { by: 0, la: -2, lb: 0, arm: 0 },
      { by: 1, la: 0, lb: 0, arm: -1 },
    ][f];
    const RT = R.rut, PU = R.rpur, BK = R.bark;
    const GY = 57;
    // legs: thick gnarled root stumps
    const leg = (x, lift, far) => {
      const fb = GY + lift;
      for (let y = 45; y <= fb; y++) {
        const foot = y >= fb - 1;
        const x0 = foot ? x - 1 : x, w = foot ? 9 : 7;
        for (let i = 0; i < w; i++) {
          let k = i === 0 ? 3 : i < 3 ? 2 : i < w - 1 ? 1 : 0;
          if (far) k = Math.max(0, k - 1);
          if (!foot && i > 0 && (y * 2 + i * 5) % 9 === 0 && k > 0) k--;
          p.set(x0 + i, y, BK[k]);
        }
      }
      p.set(x - 2, fb, BK[far ? 0 : 1]); p.set(x + 8, fb, BK[0]); p.set(x - 3, fb, BK[0]);
    };
    leg(14, st.lb, true);
    leg(29, st.la, false);
    // thick root arms with knots and root fingers
    const arm = (x0, y0, dir, sw, far) => {
      let x = x0, y = y0;
      for (let i = 0; i < 19; i++) {
        const w = i < 7 ? 4 : i < 14 ? 3 : 2;
        for (let k = 0; k < w; k++) {
          const xx = Math.round(x) + k - (dir < 0 ? w - 1 : 0);
          let tone = k === 0 ? 3 : k === 1 ? 2 : k === w - 1 ? 0 : 1;
          if (far) tone = Math.max(0, tone - 1);
          if ((i === 5 || i === 11) && k === 1) tone = Math.max(0, tone - 2);
          p.set(xx, y, BK[tone]);
        }
        if (i === 5 || i === 11) p.set(Math.round(x) + (dir > 0 ? w : -w), y, BK[far ? 0 : 1]);
        y += 1;
        x += dir * (i < 5 ? 0.6 : i < 12 ? 0.1 : -0.18) + (i > 9 ? sw * 0.16 : 0);
      }
      const ex = Math.round(x), ey = y;
      const c1 = BK[far ? 0 : 1], c2 = BK[far ? 1 : 2];
      p.line(ex - 1, ey, ex - 3, ey + 3, c1);
      p.line(ex, ey, ex, ey + 4, c2);
      p.line(ex + 1, ey - 1, ex + 3, ey + 2, c1);
    };
    arm(9, 25 + st.by, -1, st.arm, true);
    // body: huge gnarled rutabaga (purple crown, ochre flesh)
    const cx = 26, cy = 30 + st.by, rx = 18, ry = 17;
    const body = new Map();
    for (let y = Math.floor(cy - ry) - 2; y <= Math.ceil(cy + ry) + 2; y++) {
      for (let x = Math.floor(cx - rx) - 2; x <= Math.ceil(cx + rx) + 2; x++) {
        let nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const a = Math.atan2(ny, nx);
        const bump = 1 + 0.055 * Math.sin(a * 5 + 0.7) + 0.035 * Math.sin(a * 11 + 2.1);
        nx /= bump; ny /= bump;
        if (ny > 0.3) nx /= 1 - 0.3 * (ny - 0.3);
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        const nz = Math.sqrt(1 - d);
        let l = lam(nx, ny, nz);
        l += (U.noise(x / 2.4, y / 2.4, 31) - 0.5) * 0.22;
        const zb = -0.2 + 0.1 * Math.sin(nx * 6 + 0.4);
        const purple = ny < zb;
        let k = qi(l, [-0.28, 0.1, 0.45, 0.78]);
        // heavy brow shadow over the eyes
        if (!purple && ny < zb + 0.14 && nx > -0.05 && nx < 0.82) k = Math.max(0, k - 2);
        const c = purple ? PU[Math.min(3, k)] : RT[k];
        p.set(x, y, c);
        body.set(x + ',' + y, purple ? 1 : 2);
      }
    }
    // moss on crown / shoulders (lit top pixel)
    for (const [key] of body) {
      const [x, y] = key.split(',').map(Number);
      const ny = (y + 0.5 - cy) / ry;
      if (ny > -0.4) continue;
      const n = U.noise(x / 3.4, y / 2.6, 55);
      if (n > 0.58) p.set(x, y, R.moss[!body.has(x + ',' + (y - 1)) || n > 0.7 ? 2 : 1]);
    }
    // root hairs on the lower body
    for (const [x, y, d] of [[9, 36, -1], [8, 40, -1], [43, 35, 1], [44, 39, 1], [12, 44, -1], [40, 44, 1]]) {
      p.set(x + d, y + st.by, BK[1]); p.set(x + d * 2, y + 1 + st.by, BK[0]);
    }
    // crown leaves
    const ty = Math.floor(cy - ry);
    const WILT = hexes(['#4a3424', '#7a5a34', '#a8823e', '#c8a456']);
    p.leaf(20, ty + 3, 10, ty - 8, 3, R.leaf, 0.6);
    p.leaf(27, ty + 2, 33, ty - 12, 3.2, R.leaf, 0.6);
    p.leaf(23, ty + 2, 21, ty - 13, 2.6, WILT, 0.6);
    p.leaf(31, ty + 3, 42, ty - 5, 2.6, R.leaf, 0.6);
    for (let x = 21; x <= 31; x++) p.set(x, ty + 1, PU[x < 25 ? 2 : 1]);
    // cracks
    const CR = hx('#24121e');
    const rr = U.rng(777);
    const hair = (x, y, steps, dx) => {
      for (let i = 0; i < steps; i++) {
        if (!body.has(x + ',' + y)) break;
        p.set(x, y, CR);
        y += 1; x += rr.next() < 0.5 ? dx : 0;
      }
    };
    hair(14, Math.floor(cy) - 4, 7, -1);
    hair(40, Math.floor(cy) + 2, 6, 1);
    // eyes: deep sockets with bright glowing cores
    const ex = 28, ey = Math.floor(cy) - 4;
    p.rect(ex, ey, 4, 3, CR); p.rect(ex + 7, ey, 4, 3, CR);
    p.set(ex + 1, ey + 1, R.glow[2]); p.set(ex + 2, ey + 1, R.glow[2]); p.set(ex + 1, ey + 2, R.glow[1]); p.set(ex + 2, ey + 2, R.glow[0]);
    p.set(ex + 8, ey + 1, R.glow[2]); p.set(ex + 9, ey + 1, R.glow[1]); p.set(ex + 8, ey + 2, R.glow[0]);
    // angry brow ridge
    for (let i = 0; i < 5; i++) p.set(ex - 1 + i, ey - 1 + (i > 2 ? 1 : 0), PU[0]);
    for (let i = 0; i < 5; i++) p.set(ex + 6 + i, ey + (i < 2 ? 0 : -1), PU[0]);
    // wide jagged maw with ember glow
    const my = ey + 6;
    for (let i = 0; i < 12; i++) {
      const x = ex - 2 + i;
      p.set(x, my + (i % 2), CR);
      p.set(x, my + 2, i % 3 === 1 ? R.glow[2] : R.glow[1]);
      p.set(x, my + 3, (i % 2) ? CR : R.glow[0]);
      p.set(x, my + 4, CR);
    }
    p.set(ex - 3, my + 1, CR); p.set(ex + 10, my + 2, CR);
    // glowing chest crack (the ancestral ember core)
    const steps = [0, 1, 1, 2, 2, 3, 2, 2, 3, 4];
    for (let i = 0; i < steps.length; i++) {
      const y = my + 7 + i, kx = ex + 2 + steps[i];
      if (!body.has(kx + ',' + y)) break;
      p.set(kx - 1, y, CR); p.set(kx, y, i > 2 && i < 7 ? R.glow[2] : R.glow[1]);
      if (i === 5) { p.set(kx - 2, y + 1, R.glow[0]); p.set(kx - 3, y + 2, R.glow[0]); p.set(kx - 3, y + 1, CR); }
    }
    // front arm
    arm(42, 24 + st.by, 1, st.arm, false);
    return p.canvas();
  }

  /* ---------- small sprites ---------- */
  function rowsSprite(rows, pal, outline = true, oc) {
    const p = new Pix(Math.max(...rows.map((r) => r.length)), rows.length);
    p.rows(0, 0, rows, pal);
    return p.canvas(outline, oc);
  }
  function buildSmall() {
    // pumpkin seeds (4 rotations)
    const sp = { c: hx('#fff6dc'), m: hx('#eedcaa'), e: hx('#c9a874'), h: hx('#ffffff') };
    const SO = hx('#5e3a2a');
    SPR.seed = [
      rowsSprite(['.cmm.', 'chmme', '.mee.'], sp, true, SO),
      rowsSprite(['..cm', '.chm', 'cmme', 'me..'], sp, true, SO),
      rowsSprite(['.c.', 'chm', 'cmm', 'mme', '.e.'], sp, true, SO),
      rowsSprite(['cm..', 'hmm.', '.mme', '..ee'], sp, true, SO),
    ];
    // XP gems
    const gp = { y: hx('#fff4b0'), a: hx('#ffc23e'), o: hx('#f08a2a'), d: hx('#c4561e') };
    SPR.gem = [
      rowsSprite(['.a.', 'aya', 'yao', 'aoo', '.o.'], gp, true, hx('#6a2a1a')),
      rowsSprite(['.a.', 'ayo', 'aao', 'aod', '.d.'], gp, true, hx('#6a2a1a')),
    ];
    const tp = { w: hx('#fffbe0'), g: hx('#ffe070'), t: hx('#5ce0c8'), T: hx('#2aa8a0'), d: hx('#1a6a70') };
    SPR.gemBig = [
      rowsSprite(['..g..', '.gwg.', 'gwttT', 'gtttT', 'tttTd', '.tTd.', '..d..'], tp, true, hx('#123c48')),
      rowsSprite(['..g..', '.gwg.', 'gttTT', 'gtwtT', 'ttTTd', '.tTd.', '..d..'], tp, true, hx('#123c48')),
    ];
    SPR.sparkle = [
      rowsSprite(['..w..', '..y..', 'wyWyw', '..y..', '..w..'], { w: hx('#ffe9a0'), y: hx('#ffc84a'), W: hx('#ffffff') }, false),
      rowsSprite(['.w.', 'wWw', '.w.'], { w: hx('#ffd86a'), W: hx('#ffffff') }, false),
      rowsSprite(['W'], { W: hx('#fff4c0') }, false),
    ];
    SPR.sparkleT = [
      rowsSprite(['..w..', '..t..', 'wtWtw', '..t..', '..w..'], { w: hx('#c8fff0'), t: hx('#5ce0c8'), W: hx('#ffffff') }, false),
      rowsSprite(['.w.', 'wWw', '.w.'], { w: hx('#9af0e0'), W: hx('#ffffff') }, false),
      rowsSprite(['W'], { W: hx('#e8fff8') }, false),
    ];
    // glow discs (additive)
    const disc = (r, col, a0, a1) => {
      const s = r * 2 + 1;
      const { c, ctx } = U.canvas(s, s);
      const img = ctx.createImageData(s, s), d = img.data;
      const cc = hx(col);
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const dd = Math.hypot(x - r, y - r) / (r + 0.5);
        if (dd > 1) continue;
        const a = dd < 0.45 ? a0 : dd < 0.75 ? (a0 + a1) / 2 : a1;
        const o = (y * s + x) * 4;
        d[o] = cc[0]; d[o + 1] = cc[1]; d[o + 2] = cc[2]; d[o + 3] = a * 255;
      }
      ctx.putImageData(img, 0, 0);
      return c;
    };
    SPR.glowS = disc(3, '#ff9030', 0.26, 0.06);
    SPR.glowT = disc(5, '#40d0c0', 0.28, 0.07);
    SPR.glowL = [disc(11, '#ffa040', 0.32, 0.1), disc(13, '#ff9a34', 0.28, 0.08)];
    SPR.glowJ = disc(9, '#ffb040', 0.18, 0.05);
    // turnip lantern (orbital)
    const lantern = (g) => {
      const p = new Pix(13, 15);
      p.blob(6.5, 9.5, 5.6, 5.2, (nx, ny, nz) => {
        const k = qi(lam(nx, ny, nz), [-0.3, 0.1, 0.5, 0.8]);
        return ny < -0.05 + 0.12 * Math.sin(nx * 7) ? R.tpur[k] : R.cream[k];
      });
      p.leaf(6, 5, 3, 0.5, 1.2, R.leaf); p.leaf(7, 5, 10, 0.5, 1.2, R.leaf);
      p.set(6, 4, R.tpur[2]); p.set(7, 4, R.tpur[1]);
      const GLc = g ? R.glowB : R.glow;
      carve(p, pts(['1...1', '2...2', '.....', '01210', '.0.0.'], 4, 7), GLc, R.cream[0]);
      return p.canvas();
    };
    SPR.lantern = [lantern(0), lantern(1)];
    // shadows (pixel ellipses, two-step soft edge)
    SPR.shadow = {};
    for (let w = 4; w <= 70; w += 2) {
      const h = Math.max(2, Math.round(w * 0.36));
      const { c, ctx } = U.canvas(w, h);
      const img = ctx.createImageData(w, h), d = img.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const nx = (x + 0.5 - w / 2) / (w / 2), ny = (y + 0.5 - h / 2) / (h / 2), q = nx * nx + ny * ny;
        if (q > 1) continue;
        const o = (y * w + x) * 4;
        d[o] = 40; d[o + 1] = 22; d[o + 2] = 56; d[o + 3] = q > 0.55 ? 62 : 92;
      }
      ctx.putImageData(img, 0, 0);
      SPR.shadow[w] = c;
    }
    // puffs (dust), vapour, rings
    SPR.puff = [];
    SPR.vapour = [];
    for (let r = 1; r <= 5; r++) {
      const mk = (ramp) => {
        const p = new Pix(r * 2 + 1, r * 2 + 1);
        p.blob(r + 0.5, r + 0.5, r + 0.4, r + 0.4, (nx, ny, nz) => ramp[qi(lam(nx, ny, nz), [0.1, 0.6])]);
        return p.canvas(false);
      };
      SPR.puff.push(mk(hexes(['#b89c7c', '#d2bc9c', '#e8dcc0'])));
      SPR.vapour.push(mk(hexes(['#8aa2d2', '#c4d8f0', '#f0f8ff'])));
    }
    SPR.ring = {};
    SPR.dirtMound = rowsSprite(['....hhll....', '..hlllmmmd..', '.llmmmmmdddd'], { h: hx('#a8744a'), l: hx('#87593a'), m: hx('#6e4632'), d: hx('#4e3030') }, false);
    // falling leaf particle frames per colour
    SPR.leafP = LEAFSETS.concat([R.leaf.slice(1)]).map((s) => [
      rowsSprite(['ab', 'bc'], { a: s[0], b: s[1], c: s[2] }, false),
      rowsSprite(['ab.', '.bc'], { a: s[0], b: s[1], c: s[2] }, false),
      rowsSprite(['a', 'b', 'c'], { a: s[0], b: s[1], c: s[2] }, false),
      rowsSprite(['.ab', 'bc.'], { a: s[0], b: s[1], c: s[2] }, false),
    ]);
  }
  function ringSprite(r, col) {
    const key = r + col;
    if (SPR.ring[key]) return SPR.ring[key];
    const s = r * 2 + 3;
    const p = new Pix(s, s);
    const c = hx(col);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const d = Math.hypot(x - r - 1, y - r - 1);
      if (Math.abs(d - r) < 0.6) p.set(x, y, c);
    }
    return (SPR.ring[key] = p.canvas(false));
  }

  /* ---------- bitmap digits ---------- */
  const DIG3 = {
    0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
    3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
    6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
    9: ['###', '#.#', '###', '..#', '##.'],
  };
  const DIG5 = {
    0: ['.###.', '##.##', '##.##', '##.##', '##.##', '.###.'], 1: ['.##.', '###.', '.##.', '.##.', '.##.', '####'],
    2: ['####.', '...##', '..##.', '.##..', '##...', '#####'], 3: ['####.', '...##', '.###.', '...##', '...##', '####.'],
    4: ['##.##', '##.##', '#####', '...##', '...##', '...##'], 5: ['#####', '##...', '####.', '...##', '##.##', '.###.'],
    6: ['.###.', '##...', '####.', '##.##', '##.##', '.###.'], 7: ['#####', '...##', '..##.', '.##..', '.##..', '.##..'],
    8: ['.###.', '##.##', '.###.', '##.##', '##.##', '.###.'], 9: ['.###.', '##.##', '##.##', '.####', '...##', '.###.'],
  };
  const numCache = new Map();
  function numSprite(v, crit) {
    const key = (crit ? 'c' : 'n') + v;
    let c = numCache.get(key);
    if (c) return c;
    const s = String(v), F = crit ? DIG5 : DIG3;
    let w = 0;
    for (const ch of s) w += F[ch][0].length + 1;
    const h = F[0].length;
    const p = new Pix(Math.max(1, w - 1), h);
    const ramp = crit ? hexes(['#fff6b0', '#ffd23f', '#ffd23f', '#f6a92e', '#f6a92e', '#e07a22']) : hexes(['#ffffff', '#fff6e2', '#fff6e2', '#fff6e2', '#e8d4aa']);
    let x = 0;
    for (const ch of s) {
      const g = F[ch];
      for (let y = 0; y < h; y++) for (let i = 0; i < g[y].length; i++) if (g[y][i] === '#') p.set(x + i, y, ramp[Math.min(ramp.length - 1, y)]);
      x += g[0].length + 1;
    }
    // 8-neighbour outline for crisp text
    const W = p.w + 2, Hh = p.h + 3;
    const q = new Pix(W, Hh);
    const oc = crit ? hx('#5a1a1e') : hx('#2c1a2a');
    for (let y = 0; y < Hh; y++) for (let x2 = 0; x2 < W; x2++) {
      if (p.get(x2 - 1, y - 1)) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (p.get(x2 - 1 + dx, y - 1 + dy)) { near = true; break; }
      if (!near && p.get(x2 - 1, y - 2)) near = true; // drop shadow row
      if (near) q.set(x2, y, oc);
    }
    for (let y = 0; y < p.h; y++) for (let x2 = 0; x2 < p.w; x2++) { const cc = p.get(x2, y); if (cc) q.set(x2 + 1, y + 1, cc); }
    c = q.canvas(false);
    if (numCache.size > 300) numCache.clear();
    numCache.set(key, c);
    return c;
  }

  /* =====================================================================
     Props
     ===================================================================== */
  function makeTree(ramp, big, seed) {
    const r = U.rng(seed);
    const W = big ? 68 : 56, Hh = big ? 80 : 65;
    const p = new Pix(W, Hh);
    const cx = W / 2, base = Hh - 1;
    const R0 = big ? 26 : 21;
    const ccy = R0 + 3;
    const cBot = Math.round(ccy + R0 * 0.82);
    const trunkTop = ccy + 2;
    // trunk with root flare
    for (let y = trunkTop; y <= base; y++) {
      const t = (y - trunkTop) / (base - trunkTop);
      const hw = (big ? 3.7 : 3.1) + t * 0.6 + (t > 0.8 ? Math.pow((t - 0.8) / 0.2, 2) * 3.6 : 0);
      for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) {
        if (x + 0.5 < cx - hw || x + 0.5 > cx + hw) continue;
        const u = (x + 0.5 - cx) / hw;
        let k = u < -0.45 ? 3 : u < 0.15 ? 2 : u < 0.6 ? 1 : 0;
        if (k > 0 && k < 3 && ((x * 5 + ((y / 4) | 0) * 3) % 7 === 0)) k--;
        p.set(x, y, R.bark[k]);
      }
    }
    // fork into the canopy
    p.line(cx - 2, cBot + 2, cx - 9, cBot - 7, R.bark[2]); p.line(cx - 2, cBot + 3, cx - 9, cBot - 6, R.bark[1]);
    p.line(cx + 1, cBot + 2, cx + 9, cBot - 8, R.bark[1]); p.line(cx + 1, cBot + 3, cx + 9, cBot - 7, R.bark[0]);
    // canopy from overlapping blobs (wider than tall)
    const blobs = [{ x: cx, y: ccy, r: R0 * 0.8, z: 4 }];
    const N = 9;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * U.TAU + r.range(-0.22, 0.22);
      const dist = R0 * r.range(0.5, 0.6);
      blobs.push({ x: cx + Math.cos(a) * dist * 1.16, y: ccy + Math.sin(a) * dist * 0.8, r: R0 * r.range(0.42, 0.52), z: Math.sin(a) * 3 });
    }
    for (let i = 0; i < 3; i++) {
      const a = Math.PI * (1.15 + i * 0.35) + r.range(-0.2, 0.2);
      blobs.push({ x: cx + Math.cos(a) * R0 * 0.36, y: ccy + Math.sin(a) * R0 * 0.34, r: R0 * 0.38, z: 6 });
    }
    const ph = r.range(0, 6);
    const shade = new Set();
    for (let y = 0; y < cBot + 6; y++) for (let x = 0; x < W; x++) {
      let best = null, bh = -1e9;
      for (const b of blobs) {
        const dx = x + 0.5 - b.x, dy = y + 0.5 - b.y;
        const a = Math.atan2(dy, dx);
        const rr = b.r * (1 + 0.08 * Math.sin(a * 7 + ph + b.x) + 0.05 * Math.sin(a * 13 + b.y));
        const d2 = dx * dx + dy * dy;
        if (d2 > rr * rr) continue;
        const hgt = Math.sqrt(rr * rr - d2) + b.z;
        if (hgt > bh) { bh = hgt; best = { dx, dy, rr }; }
      }
      if (!best) continue;
      const nx = best.dx / best.rr, ny = best.dy / best.rr, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      let l = lam(nx, ny, nz) * 0.85 + 0.1;
      l -= 0.24 * ((y - (ccy - R0)) / (2 * R0));
      l += (U.noise(x / 2.7, y / 2.4, seed) - 0.5) * 0.3;
      const k = qi(l, [-0.12, 0.2, 0.47, 0.73]);
      p.set(x, y, ramp[k]);
      shade.add(x + ',' + y);
    }
    // canopy shadow on the upper trunk
    for (let y = cBot - 2; y < cBot + 4; y++) for (let x = 0; x < W; x++) {
      if (!shade.has(x + ',' + y) && p.get(x, y)) p.set(x, y, R.bark[0]);
    }
    return p.canvas();
  }

  function makeHay(round) {
    const S = R.straw;
    if (!round) {
      const p = new Pix(26, 19);
      for (let y = 0; y < 19; y++) for (let x = 0; x < 26; x++) {
        let c;
        if (y < 6) {
          if ((x === 0 || x === 25) && y === 0) continue;
          c = S[3];
          if ((x * 2 - y * 3 + 40) % 7 === 0) c = S[4];
          else if ((x + y * 4) % 9 === 0) c = S[2];
          if (x < 2) c = S[4];
          if (x > 23) c = S[2];
          if (y === 5) c = S[4];
        } else {
          c = S[2];
          if ((x * 3 + (y >> 1)) % 5 === 0) c = S[1];
          else if ((x + y * 2) % 7 === 0) c = S[3];
          if (x < 2) c = S[3];
          if (x > 22) c = S[1];
          if (y === 6) c = S[1];
          if (y > 16) c = S[0 + (x % 3 ? 1 : 0)];
        }
        p.set(x, y, c);
      }
      for (const tx of [7, 18]) for (let y = 0; y < 19; y++) p.set(tx, y, y < 6 ? hx('#c8643e') : y === 6 ? hx('#6a2a26') : hx('#9a4430'));
      for (const [x, y] of [[3, 0], [12, 0], [21, 0], [0, 9], [25, 12], [0, 14], [10, 18], [16, 18]]) p.set(x, y, S[4]);
      p.set(-0, 3, S[4]);
      return p.canvas();
    }
    const p = new Pix(28, 20);
    // lying round bale: cylinder body + spiral end on the left
    for (let y = 0; y < 20; y++) for (let x = 6; x < 28; x++) {
      const v = (y + 0.5 - 10) / 10;
      if (Math.abs(v) > 1) continue;
      if (x > 25 && Math.abs(v) > 0.8) continue;
      const k = v < -0.55 ? 4 : v < -0.1 ? 3 : v < 0.45 ? 2 : 1;
      let c = S[k];
      if ((x * 2 + y * 7) % 9 === 0) c = S[Math.max(0, k - 1)];
      p.set(x, y, c);
    }
    p.blob(7, 10, 6.6, 9.8, (nx, ny) => {
      const d = Math.hypot(nx, ny);
      const ring = Math.floor(d * 4.2 + Math.atan2(ny, nx) / U.TAU * 1.0) % 2;
      return ring ? S[3] : S[2];
    });
    p.set(7, 10, S[1]);
    return p.canvas();
  }

  function makeFence() {
    const p = new Pix(34, 20);
    const Wd = R.wood;
    const post = (x) => {
      for (let y = 1; y < 20; y++) { p.set(x, y, Wd[3]); p.set(x + 1, y, Wd[2]); p.set(x + 2, y, Wd[1]); }
      p.set(x + 1, 0, Wd[3]);
      p.set(x, 1, Wd[4]);
    };
    const rail = (y) => {
      for (let x = 0; x < 34; x++) { p.set(x, y, Wd[3]); p.set(x, y + 1, Wd[2]); p.set(x, y + 2, Wd[1]); }
      for (let x = 3; x < 34; x += 9) p.set(x, y, Wd[4]);
    };
    rail(5); rail(12);
    post(1); post(16); post(30);
    p.set(2, 6, hx('#4a4450')); p.set(17, 6, hx('#4a4450')); p.set(31, 13, hx('#4a4450'));
    return p.canvas();
  }

  function makePumpkins(seed) {
    const r = U.rng(seed);
    const p = new Pix(38, 20);
    const LG = R.leaf;
    // vines
    const vine = (x0, y0, x1, y1) => p.line(x0, y0, x1, y1, (n) => (n % 3 ? LG[1] : LG[2]));
    vine(2, 17, 14, 15); vine(14, 15, 24, 17); vine(24, 17, 35, 13); vine(30, 15, 33, 18);
    p.leaf(4, 17, 2, 10, 2.6, LG); p.leaf(33, 14, 36, 7, 2.4, LG); p.leaf(20, 17, 22, 11, 2.2, LG);
    // pumpkins
    pumpkinBody(p, 13, 12, 7.2 + r.range(-0.4, 0.4), 5.6, R.pk, [-0.6, -0.15, 0.32, 0.72], [-0.32, 0.08, 0.46, 0.78]);
    p.set(12, 6, R.stem[2]); p.set(13, 6, R.stem[1]); p.set(13, 5, R.stem[2]);
    pumpkinBody(p, 27, 14.5, 5.2, 4.1, R.pk, [-0.45, 0.1, 0.6], [-0.32, 0.08, 0.46, 0.78]);
    p.set(27, 10, R.stem[1]); p.set(28, 9, R.stem[2]);
    p.leaf(7, 15, 3, 13, 1.6, LG);
    return p.canvas();
  }

  function makeScarecrow(crow) {
    const p = new Pix(30, 48);
    const Wd = R.wood;
    // post
    for (let y = 14; y < 48; y++) { p.set(14, y, Wd[3]); p.set(15, y, Wd[2]); p.set(16, y, Wd[1]); }
    // crossbar
    for (let x = 2; x < 28; x++) { p.set(x, 19, Wd[3]); p.set(x, 20, Wd[1]); }
    // shirt (plaid) on the bar
    const PL = hexes(['#7a2230', '#b8402f', '#e0603e', '#f2a07a']);
    const BL = hexes(['#3a3a6a', '#5a5a96']);
    for (let y = 17; y < 33; y++) {
      const hw = y < 23 ? 12 - (y < 19 ? 19 - y : 0) * 0 : 7 + (y > 29 ? 1 : 0);
      for (let x = 15 - hw; x <= 15 + hw - 1; x++) {
        if (y < 23 && (x < 4 || x > 26)) continue;
        if (y >= 23 && Math.abs(x + 0.5 - 15) > hw) continue;
        if (y === 32 && (x % 3 === 0)) continue;
        const u = (x + 0.5 - 15) / 13;
        let k = u < -0.3 ? 2 : u < 0.3 ? 1 : 0;
        if (y < 19) k = Math.min(3, k + 1);
        let c = PL[k];
        if (x % 5 === 0 || y % 5 === 0) c = (x % 5 === 0 && y % 5 === 0) ? BL[0] : BL[1];
        p.set(x, y, c);
      }
    }
    // patch
    p.rect(18, 26, 3, 3, hx('#d8b060')); p.set(18, 26, hx('#f0d080'));
    // straw tufts
    const S = R.straw;
    for (const [x, y] of [[2, 18], [1, 19], [2, 21], [3, 22], [27, 18], [28, 19], [27, 21], [26, 22], [10, 33], [12, 34], [17, 34], [19, 33], [14, 33]]) p.set(x, y, S[(x + y) % 2 ? 3 : 2]);
    // burlap head
    p.blob(15, 11, 6, 5.6, (nx, ny, nz) => hexes(['#8a6a4a', '#b49268', '#d4b484', '#ecd6a4'])[qi(lam(nx, ny, nz), [-0.2, 0.2, 0.62])]);
    const K = hx('#3a2420');
    p.set(13, 10, K); p.set(17, 10, K); p.set(12, 9, K); p.set(14, 11, K); p.set(16, 9, K); p.set(18, 11, K);
    for (let x = 12; x <= 18; x++) p.set(x, 14, x % 2 ? K : hx('#a07850'));
    // rope at the neck
    for (let x = 12; x <= 18; x++) p.set(x, 16, S[1]);
    // hat
    for (let x = 6; x <= 24; x++) { p.set(x, 7, hx('#8a5a2a')); p.set(x, 6, hx('#b07a3a')); }
    for (let y = 1; y <= 5; y++) for (let x = 10; x <= 20; x++) {
      if (y === 1 && (x < 12 || x > 18)) continue;
      p.set(x, y, x < 13 ? hx('#c89048') : x > 17 ? hx('#8a5a2a') : hx('#b07a3a'));
    }
    for (let x = 10; x <= 20; x++) p.set(x, 5, hx('#a83a2e'));
    if (crow) {
      const B = hexes(['#1e1a28', '#34304a', '#504c6a']);
      p.rows(22, 13, ['.bb..', 'bBbbb', '.bbb.', '..y..'], { b: B[1], B: B[2], y: hx('#f0b040') });
      p.set(26, 14, hx('#f0b040'));
      p.set(23, 14, hx('#ffffff'));
    }
    return p.canvas();
  }

  function makeStump() {
    const p = new Pix(22, 14);
    for (let y = 4; y < 13; y++) for (let x = 3; x < 19; x++) {
      const u = (x + 0.5 - 11) / 8;
      const k = u < -0.4 ? 3 : u < 0.25 ? 2 : u < 0.7 ? 1 : 0;
      p.set(x, y, R.bark[k]);
    }
    p.rows(0, 10, ['.bb', 'bb.'], { b: R.bark[2] }); p.rows(19, 10, ['bb.', '.bb'], { b: R.bark[1] });
    p.blob(11, 4.5, 8, 3.6, (nx, ny) => {
      const d = Math.hypot(nx, ny * 1.1);
      if (d > 0.82) return R.bark[3];
      return Math.floor(d * 6) % 2 ? hx('#c8945a') : hx('#e2b878');
    });
    p.set(11, 4, hx('#a87648'));
    p.line(8, 4, 13, 5, (n) => (n % 2 ? hx('#7c4c32') : null));
    return p.canvas();
  }

  function makeBarrow() {
    const p = new Pix(30, 20);
    const Wd = R.wood;
    // pumpkins inside
    pumpkinBody(p, 14, 6, 5, 3.8, R.pk, [-0.4, 0.15, 0.6]);
    pumpkinBody(p, 21, 6.5, 4, 3.2, R.pk, [-0.3, 0.4]);
    p.set(14, 2, R.stem[2]); p.set(21, 3, R.stem[1]);
    // tray
    for (let y = 8; y < 15; y++) {
      const x0 = 6 + (y - 8) * 0.5, x1 = 27 - (y - 8) * 0.4;
      for (let x = Math.floor(x0); x < x1; x++) p.set(x, y, y === 8 ? Wd[4] : y < 11 ? Wd[3] : y < 13 ? Wd[2] : Wd[1]);
    }
    for (let x = 9; x < 26; x += 5) for (let y = 9; y < 14; y++) p.set(x, y, Wd[1]);
    // handles + leg
    p.line(0, 8, 7, 11, Wd[2]); p.line(0, 9, 7, 12, Wd[1]);
    p.line(9, 14, 8, 19, Wd[1]);
    // wheel
    p.blob(25, 15.5, 3.6, 3.6, (nx, ny) => (Math.hypot(nx, ny) > 0.62 ? hx('#3a3040') : hx('#7a7080')));
    p.set(25, 15, hx('#b8aea8'));
    return p.canvas();
  }

  function makeCrate() {
    const p = new Pix(18, 18);
    const Wd = R.wood;
    // turnips peeking out
    p.leaf(5, 5, 3, 0, 1.2, R.leaf); p.leaf(6, 5, 8, 0, 1.2, R.leaf); p.leaf(12, 5, 13, 0, 1.3, R.leaf);
    p.blob(6, 6.5, 3.2, 2.6, (nx, ny, nz) => R.tpur[qi(lam(nx, ny, nz), [-0.2, 0.2, 0.6]) + 1]);
    p.blob(12, 6.5, 3, 2.5, (nx, ny, nz) => R.tpur[qi(lam(nx, ny, nz), [-0.2, 0.2, 0.6]) + 1]);
    // crate box
    for (let y = 7; y < 18; y++) for (let x = 1; x < 17; x++) {
      let c = Wd[2];
      if (y === 7) c = Wd[4];
      else if (y === 8) c = Wd[3];
      else if ((y - 9) % 4 === 3) c = Wd[1];
      if (x === 1 || x === 2) c = y === 7 ? Wd[4] : Wd[3];
      if (x === 15 || x === 16) c = Wd[1];
      p.set(x, y, c);
    }
    p.line(3, 9, 14, 16, (n) => (n % 2 ? Wd[3] : Wd[2]));
    return p.canvas();
  }

  const PROP_SH = {
    tree: { w: 50, dx: 3, dy: -1 }, treeS: { w: 40, dx: 2, dy: -1 }, hay: { w: 28, dx: 2, dy: -1 }, hayR: { w: 28, dx: 2, dy: -1 },
    fence: { w: 36, dx: 1, dy: 0 }, pumpkins: { w: 30, dx: 1, dy: -2 }, scare: { w: 18, dx: 2, dy: 0 }, stump: { w: 22, dx: 1, dy: -1 },
    barrow: { w: 28, dx: 1, dy: -1 }, crate: { w: 18, dx: 1, dy: 0 },
  };

  /* =====================================================================
     HUD icons (16x16 art, crisp upscale)
     ===================================================================== */
  const ICP = {
    k: hx('#24162a'), r: hx('#e0442e'), R: hx('#9e2a30'), h: hx('#ff9a7a'), w: hx('#fff8e8'),
    o: hx('#ec8a30'), O: hx('#c4562a'), d: hx('#8a3428'), y: hx('#ffe27a'), Y: hx('#ffb83a'),
    c: hx('#f4e2b0'), C: hx('#c8a874'), e: hx('#9a7a54'),
    g: hx('#5a9a3a'), G: hx('#3a6a34'), l: hx('#8cc850'),
    p: hx('#9152a6'), P: hx('#5e2d70'), q: hx('#c088cc'),
    b: hx('#a06a3c'), B: hx('#6a4228'), n: hx('#c8945a'), m: hx('#e2b878'),
    i: hx('#bcd8f2'), I: hx('#7f9bcb'), j: hx('#f2faff'), J: hx('#4a5a8c'),
    s: hx('#b8b0a8'), S: hx('#787080'), t: hx('#fff4d6'),
  };
  const ICONS = {
    'hp-heart': [
      '..RRR...RRR...',
      '.RrrrR.RrrrR..',
      'Rrhhrrrrrrrrr.',
      'Rrhwrrrrrrrrr.',
      'Rrhrrrrrrrrrr.',
      'Rrrrrrrrrrrrr.',
      '.RrrrrrrrrrR..',
      '..RrrrrrrrR...',
      '...RrrrrrR....',
      '....RrrrR.....',
      '.....RrR......',
      '......R.......',
    ],
    kills: [
      '.....l..g.....',
      '....lg.lG.....',
      '.....gGgG.....',
      '....qppPP.....',
      '...qpppppP....',
      '..qkpppppkP...',
      '..pqkpppkpP...',
      '..pyYpppYyP...',
      '..pppppppPP...',
      '..cccccccCC...',
      '..ccckkkcCC...',
      '...cckckcC....',
      '....cccCC.....',
      '......C.......',
    ],
    dmg: [
      '...........y..',
      '..........ywy.',
      '........tc.y..',
      '.......twtC...',
      '......twwtC...',
      '.....twwttC...',
      '....twwttcC...',
      '...twwttccC...',
      '..twwttccC....',
      '..twttccCC....',
      '..ttcccCC.....',
      '..tccCCC......',
      '...CCC........',
      '..............',
    ],
    rate: [
      '..............',
      '........tttc..',
      '.YY.o..twwttcC',
      '........cccC..',
      '..............',
      '.....tttc.....',
      'YY.o.twwttcC..',
      '.....cccC.....',
      '..............',
      '........tttc..',
      '.YY.o..twwttcC',
      '........cccC..',
      '..............',
      '..............',
    ],
    multi: [
      '.....B..B.....',
      '......BB......',
      '.....nbbB.....',
      '....nbbbbB....',
      '...nbbbbbbB...',
      '..nbbOOOObbB..',
      '..nbOhooOObB..',
      '..nbOooooObB..',
      '..nbbOOOObbB..',
      '..nbbbbbbbbB..',
      '...BbbbbbbB...',
      '....BBBBBB....',
      '..........tc..',
      '........tc.tc.',
    ],
    bounce: [
      '..............',
      '..........ttc.',
      'y........twwtC',
      '..........ccC.',
      '.y.......y....',
      '..............',
      '..y.....y.....',
      '..............',
      '...y...y......',
      '....Y.Y.......',
      '..o..Y..o.....',
      '..............',
      'bbbbbbbbbbbbbb',
      'BBBBBBBBBBBBBB',
    ],
    lantern: [
      '......l.......',
      '....lg.gG.....',
      '.....gGG......',
      '....qqppPP....',
      '...qpppppPP...',
      '..qpYppppYPP..',
      '..pYyppppyYP..',
      '..ccccccccCC..',
      '..cYyyyyyYCC..',
      '..ccyycyyCCC..',
      '...ccccccCC...',
      '....ccccCC....',
      '......CC......',
      '..............',
    ],
    speed: [
      '...........w..',
      '..........wjw.',
      '...........w..',
      '..........ii..',
      '.........ijI..',
      '........ijjI..',
      '.......ijjII..',
      '.iii..ijjiII..',
      'ijjjiijjiIII..',
      'ijwjjjjjiIII..',
      '.IiiiiiiiIIJ..',
      '..JJJJJJJJ.J..',
      '...........J..',
      '..............',
    ],
    magnet: [
      '....nnnnnn....',
      '...n......B...',
      '..n...g....B..',
      '..n.qpgoO..B..',
      '..npPPoohO.B..',
      '.mnbnbnbnbnbB.',
      '.bnbbnbbnbbnB.',
      '.nbnnbnnbnnbB.',
      '..bnbbnbbnbB..',
      '..nbnnbnnbnB..',
      '..bnbbnbbnbB..',
      '...nbnnbnnB...',
      '....BBBBBB....',
      '..............',
    ],
    hp: [
      '...t.....t....',
      '...t.....t....',
      '....t...t.....',
      '....t...t.....',
      '..mmmmmmmmmm..',
      '.mOoyOqoYpOom.',
      'mbOoqPoyOOcobB',
      'bnbbbbbbbbbbbB',
      'bnmbbbbbbbbbbB',
      '.bnbbbbbbbbbB.',
      '.bnbbbbbbbbbB.',
      '..bbbbbbbbbB..',
      '...BBBBBBBB...',
      '..............',
    ],
  };
  const ICON_C = {};
  function iconCanvas(id) {
    if (ICON_C[id]) return ICON_C[id];
    const rows = ICONS[id] || ICONS.kills;
    const p = new Pix(14, 14);
    p.rows(0, Math.floor((14 - rows.length) / 2), rows, ICP);
    return (ICON_C[id] = p.canvas(true)); // 16x16 incl. coloured outline
  }

  /* =====================================================================
     CSS (wooden HUD, parchment cards, pixel fonts)
     ===================================================================== */
  const B = 'body.style-harvest16';
  const WOOD = `background-color:#8f5c34;background-image:
      repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 5px, rgba(58,30,16,.38) 5px 6px, rgba(0,0,0,0) 6px 11px, rgba(255,214,150,.14) 11px 12px, rgba(0,0,0,0) 12px 17px, rgba(58,30,16,.22) 17px 18px);`;
  const NAILS = `linear-gradient(#efe4cc,#efe4cc) 5px 5px/3px 3px no-repeat, linear-gradient(#4a3426,#4a3426) 6px 6px/3px 3px no-repeat,
      linear-gradient(#efe4cc,#efe4cc) calc(100% - 8px) 5px/3px 3px no-repeat, linear-gradient(#4a3426,#4a3426) calc(100% - 7px) 6px/3px 3px no-repeat,
      linear-gradient(#efe4cc,#efe4cc) 5px calc(100% - 8px)/3px 3px no-repeat, linear-gradient(#4a3426,#4a3426) 6px calc(100% - 7px)/3px 3px no-repeat,
      linear-gradient(#efe4cc,#efe4cc) calc(100% - 8px) calc(100% - 8px)/3px 3px no-repeat, linear-gradient(#4a3426,#4a3426) calc(100% - 7px) calc(100% - 7px)/3px 3px no-repeat`;
  const GRAIN = `repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 5px, rgba(58,30,16,.38) 5px 6px, rgba(0,0,0,0) 6px 11px, rgba(255,214,150,.14) 11px 12px, rgba(0,0,0,0) 12px 17px, rgba(58,30,16,.22) 17px 18px)`;
  const PANEL = `background-color:#8f5c34;background-image:${NAILS},${GRAIN};border:3px solid #2b170f;
      box-shadow: inset 3px 3px 0 #b97f4b, inset -3px -3px 0 #5e3820, 0 4px 0 rgba(26,12,6,.6);`;
  const OUT = (c, s) => `text-shadow: ${s}px 0 ${c}, -${s}px 0 ${c}, 0 ${s}px ${c}, 0 -${s}px ${c}, ${s}px ${s}px ${c}, -${s}px ${s}px ${c}, ${s}px -${s}px ${c}, -${s}px -${s}px ${c}, 0 ${s * 2}px ${c}, ${s}px ${s * 2}px ${c}, -${s}px ${s * 2}px ${c};`;
  const CSS = `
${B} { font-family: 'Pixelify Sans', 'Silkscreen', monospace; color: #fff3d6; }
${B} #hud { padding: 12px 20px; }
${B} #hud .xp { height: 20px; border-radius: 0; border: 3px solid #2b170f; background: #3a2016;
  box-shadow: inset 0 3px 0 #22120b, 0 0 0 3px #a06a3c, 0 0 0 6px #2b170f, 0 7px 0 rgba(26,12,6,.55); overflow: hidden; margin: 6px 6px 0; }
${B} #hud .xp-fill { background: linear-gradient(180deg, #fff0a0 0 3px, #ffc94a 3px 8px, #f19434 8px 12px, #c8621f 12px); }
${B} #hud .xp-fill::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 9px, rgba(122,52,18,.35) 9px 12px); }
${B} #hud .lvl { right: 8px; font: 700 13px 'Silkscreen', monospace; color: #fff3d6; ${OUT('#2b170f', 2)} z-index: 2; }
${B} #hud .topline { margin-top: 14px; align-items: flex-start; }
${B} #hud .hp { ${PANEL} padding: 7px 16px 7px 10px; gap: 10px; }
${B} #hud .hp-icon, ${B} #hud .kills-icon { width: 48px; height: 48px; image-rendering: pixelated; }
${B} #hud .hp-bar { width: 220px; height: 22px; border-radius: 0; border: 3px solid #2b170f; background: #3a1c18;
  box-shadow: inset 0 3px 0 #200e0c, 0 3px 0 #c58a54; }
${B} #hud .hp-fill { background: linear-gradient(180deg, #ffa58a 0 3px, #ee4f36 3px 9px, #c0302c 9px 13px, #8e1f2a 13px); }
${B} #hud .hp-text { font: 700 16px 'Silkscreen', monospace; color: #fff3d6; ${OUT('#2b170f', 2)} min-width: 86px; }
${B}.hurt #hud .hp-bar { filter: none; box-shadow: inset 0 3px 0 #200e0c, 0 0 0 3px #ffdd88; }
${B} #hud .clock { ${PANEL} position: relative; padding: 4px 22px 6px; margin-top: 18px; min-width: 170px; }
${B} #hud .clock::before, ${B} #hud .clock::after { content: ''; position: absolute; top: -30px; width: 4px; height: 27px;
  background: repeating-linear-gradient(180deg, #e2c084 0 3px, #a07a44 3px 6px); box-shadow: 1px 0 0 #5e3e20; }
${B} #hud .clock::before { left: 22px; } ${B} #hud .clock::after { right: 22px; }
${B} #hud .clock-time { font: 400 34px 'Silkscreen', monospace; letter-spacing: 2px; color: #ffe08a; ${OUT('#2b170f', 3)} line-height: 1.1; }
${B} #hud .clock-label { font: 600 14px 'Pixelify Sans', monospace; text-transform: none; letter-spacing: 1px; opacity: 1; color: #fff3d6; ${OUT('#3b2010', 2)} }
${B} #hud .kills { ${PANEL} padding: 6px 18px 6px 10px; min-width: 0; gap: 8px; }
${B} #hud .kills-num { font: 700 24px 'Silkscreen', monospace; color: #fff3d6; ${OUT('#2b170f', 2)} min-width: 60px; text-align: right; }
${B} #stylebar { ${PANEL} border-radius: 0; padding: 8px 18px; gap: 14px; font-family: 'Pixelify Sans', monospace; }
${B} #stylebar .style-family { font: 400 11px 'Silkscreen', monospace; color: #ffe3a8; opacity: .9; }
${B} #stylebar .style-name { font: 700 18px 'Pixelify Sans', monospace; color: #fff3d6; ${OUT('#2b170f', 2)} }
${B} #stylebar .style-hint { font-size: 13px; color: #fbe8c4; opacity: .9; }
${B} #stylebar .auto.on { color: #ffd84a; }
${B} #levelup { background: radial-gradient(ellipse at 50% 45%, rgba(80,40,20,.25), rgba(28,14,22,.8)); gap: 30px; }
${B} #levelup .lu-title { font-size: 0; text-shadow: none; }
${B} #levelup .lu-title::after { content: 'Neue Stufe!'; font: 700 60px 'Pixelify Sans', monospace; color: #ffd36a; letter-spacing: 3px; ${OUT('#3b1d10', 4)} }
${B} #levelup .lu-cards { gap: 28px; }
${B} #levelup .card { width: 224px; min-height: 278px; border-radius: 0; padding: 26px 18px 18px; gap: 12px;
  background: radial-gradient(circle at 18% 14%, rgba(255,251,232,.75) 0 12%, rgba(255,251,232,0) 34%),
              radial-gradient(circle at 86% 88%, rgba(176,112,52,.28) 0 14%, rgba(176,112,52,0) 42%),
              linear-gradient(180deg, #f6e6bc, #ead096);
  border: 4px solid #4a2a18; box-shadow: inset 0 0 0 3px #fbf0d0, inset 0 0 0 6px #d8b679, 0 6px 0 #2a160c, 0 0 0 3px #2a160c; }
${B} #levelup .card::before { content: ''; position: absolute; top: 7px; left: 50%; width: 12px; height: 12px; margin-left: -6px; background: #c8402e;
  box-shadow: inset 3px 3px 0 #f58a6a, inset -3px -3px 0 #7a2026, 0 0 0 3px #2b170f, 3px 5px 0 3px rgba(60,30,10,.35); }
${B} #levelup .card:hover { transform: translateY(-8px) rotate(-1deg); border-color: #e0702a; }
${B} #levelup .card-icon { width: 96px; height: 96px; image-rendering: pixelated; background: #e4c88c;
  box-shadow: inset 0 0 0 3px #c49a5c, 0 0 0 3px #6a4426, 0 3px 0 3px #4a2a18; }
${B} #levelup .card-name { font: 700 23px 'Pixelify Sans', monospace; color: #6a2a14; }
${B} #levelup .card-desc { font: 500 17px 'Pixelify Sans', monospace; color: #6e4a2e; opacity: 1; line-height: 1.25; }
${B} #levelup .card-key { top: auto; bottom: 8px; left: auto; right: 10px; font: 700 13px 'Silkscreen', monospace; opacity: 1; color: #fff3d6;
  background: #8f5c34; padding: 2px 6px; border: 2px solid #2b170f; box-shadow: inset 2px 2px 0 #b97f4b; }
${B} #levelup .lu-hint { font: 600 16px 'Pixelify Sans', monospace; opacity: 1; color: #fff3d6; ${OUT('#2b170f', 2)} }
${B} #gameover { background: radial-gradient(ellipse at 50% 45%, rgba(90,30,20,.35), rgba(24,10,16,.85)); }
${B} #gameover .go-title { font: 700 64px 'Pixelify Sans', monospace; color: #f59a3c; ${OUT('#3b1d10', 4)} }
${B} #gameover .go-stats { ${PANEL} padding: 10px 22px; font: 600 18px 'Pixelify Sans', monospace; color: #fff3d6; }
${B} #gameover .go-hint { font: 600 16px 'Pixelify Sans', monospace; ${OUT('#2b170f', 2)} }
${B} #pausebox { font: 700 48px 'Pixelify Sans', monospace; color: #ffd36a; ${OUT('#3b1d10', 4)} }
`;

  /* =====================================================================
     The style
     ===================================================================== */
  const st = {
    id: 'harvest16',
    name: 'Herbsternte 16-Bit',
    family: 'Pixel Art',
    description: 'Gemütlicher Herbstnachmittag auf dem Acker – SNES-Pixelkunst mit warmen Farben, Laubteppichen und Furchenfeldern.',
    pixelArt: { scale: 1 },
    groundColor: '#77963b',
    chunkSize: 256,
    fonts: ['Pixelify+Sans:wght@400;500;600;700', 'Silkscreen:wght@400;700'],
    css: CSS,

    init() {
      buildJitter();
      buildDecals();
      buildSmall();
      // Jack: [glow][mode][frame] → {r,l}
      SPR.jack = [0, 1].map((g) => ({
        walk: [0, 1, 2, 3].map((f) => pair(makeJack('walk', f, g))),
        idle: [0, 1].map((f) => pair(makeJack('idle', f, g))),
      }));
      const tintPair = (pr, col, a) => ({ r: U.tint(pr.r, col, a), l: U.tint(pr.l, col, a) });
      SPR.jackFlash = { walk: SPR.jack[0].walk.map((p) => tintPair(p, '#ffffff', 1)), idle: SPR.jack[0].idle.map((p) => tintPair(p, '#ffffff', 1)) };
      SPR.jackDash = { walk: SPR.jack[0].walk.map((p) => tintPair(p, '#ffc36a', 1)), idle: SPR.jack[0].idle.map((p) => tintPair(p, '#ffc36a', 1)) };
      SPR.creeper = [0, 1].map((v) => [0, 1, 2, 3].map((f) => pair(makeCreeper(f, v))));
      SPR.creeperF = SPR.creeper.map((fr) => fr.map((p) => tintPair(p, '#ffffff', 1)));
      SPR.ghost = [0, 1, 2, 3].map((f) => pair(makeGhost(f)));
      SPR.ghostF = SPR.ghost.map((p) => tintPair(p, '#ffffff', 1));
      SPR.colossus = [0, 1, 2, 3].map((f) => pair(makeColossus(f)));
      SPR.colossusF = SPR.colossus.map((p) => tintPair(p, '#ffffff', 1));
      // props
      SPR.trees = [];
      for (let v = 0; v < 4; v++) SPR.trees.push([pair(makeTree(TREE_RAMPS[v], false, 100 + v)), pair(makeTree(TREE_RAMPS[v], true, 200 + v))]);
      SPR.hay = pair(makeHay(false));
      SPR.hayR = pair(makeHay(true));
      SPR.fence = makeFence();
      SPR.pumpkins = [pair(makePumpkins(11)), pair(makePumpkins(12))];
      SPR.scare = [pair(makeScarecrow(false)), pair(makeScarecrow(true))];
      SPR.stump = pair(makeStump());
      SPR.barrow = pair(makeBarrow());
      SPR.crate = pair(makeCrate());
      this._frameTrees = [];
      this._ov = null;
      // debug sheet for tools/scratch
      this._sheet = [
        ...SPR.jack[0].walk.map((p) => p.r), ...SPR.jack[0].idle.map((p) => p.r), SPR.jackFlash.walk[0].r,
        ...SPR.creeper[0].map((p) => p.r), ...SPR.creeper[1].map((p) => p.r),
        ...SPR.ghost.map((p) => p.r), ...SPR.colossus.map((p) => p.r),
        ...SPR.trees.map((t) => t[1].r), ...SPR.trees.map((t) => t[0].r),
        SPR.hay.r, SPR.hayR.r, SPR.fence, SPR.pumpkins[0].r, SPR.scare[1].r, SPR.stump.r, SPR.barrow.r, SPR.crate.r,
        ...SPR.seed, ...SPR.gem, ...SPR.gemBig, ...SPR.lantern, numSprite(17, false), numSprite(48, true),
        ...Object.keys(ICONS).map((k) => iconCanvas(k)),
      ];
    },

    *renderGroundChunk(ctx, info) { yield* buildChunk(ctx, info); },

    propsForChunk(info) {
      const props = [];
      const wx = info.wx, wy = info.wy;
      const own = (x, y) => x >= wx && x < wx + CS && y >= wy && y < wy + CS;
      // trees
      for (const t of treesIn(wx, wy, wx + CS, wy + CS)) {
        props.push({ x: t.x, y: t.y, type: t.big ? 'tree' : 'treeS', img: SPR.trees[t.v][t.big ? 1 : 0][t.flip ? 'l' : 'r'], pad: 110, tree: t });
      }
      // fences + scarecrows on the fields
      for (const f of fieldsIn(wx - 420, wy - 320, wx + CS + 420, wy + CS + 320)) {
        const edges = [];
        if (f.fence) edges.push(f.y0 - 2);
        if (f.fenceB) edges.push(f.y1 + 6);
        for (const ey of edges) {
          let k = 0;
          for (let x = f.x0 + 4; x + 34 <= f.x1 - 2; x += 33, k++) {
            const h = U.hashInt(f.seed, k + ey, 99);
            if ((h & 7) < 2) continue;
            const cx = x + 17;
            if (!own(cx, ey) || G.nearSpawn(cx, ey, 90)) continue;
            if (pathDistA(cx, ey) < pathHW(macroA(cx, ey)) + 8) continue;
            props.push({ x: cx, y: ey, type: 'fence', img: SPR.fence, pad: 40 });
          }
        }
        if (f.scare) {
          const r = U.rng(f.seed + 5);
          const x = Math.round(f.cx + r.range(-f.hw * 0.4, f.hw * 0.4)), y = Math.round(f.cy + r.range(-f.hh * 0.3, f.hh * 0.3));
          if (own(x, y) && !G.nearSpawn(x, y, 90) && pathDistA(x, y) > pathHW(macroA(x, y)) + 10) {
            const v = r.next() < 0.5 ? 1 : 0;
            props.push({ x, y, type: 'scare', img: SPR.scare[v][r.next() < 0.5 ? 'l' : 'r'], pad: 60 });
          }
        }
      }
      // misc farm props
      G.scatterOwned(info, 128, 7101, (x, y, rng) => {
        x = Math.round(x); y = Math.round(y);
        const roll = rng.next();
        if (roll > 0.3 || G.nearSpawn(x, y, 95)) return;
        const pd = pathDistA(x, y), hw = pathHW(macroA(x, y));
        if (pd < hw + 12) return;
        const sd = fieldSdfAt(x, y);
        if (sd < 8) return;
        for (const t of treesIn(x - 40, y - 30, x + 40, y + 30)) if (Math.abs(t.x - x) < 30 && Math.abs(t.y - y) < 22) return;
        const F = forestF(x, y);
        const flip = rng.next() < 0.5 ? 'l' : 'r';
        let type, img;
        if (F > 0.56) { if (roll < 0.14) { type = 'stump'; img = SPR.stump[flip]; } else return; }
        else if (sd < 60 && roll < 0.1) { type = rng.next() < 0.5 ? 'hay' : 'hayR'; img = (type === 'hay' ? SPR.hay : SPR.hayR)[flip]; }
        else if (sd < 60 && roll < 0.15) { type = rng.next() < 0.5 ? 'barrow' : 'crate'; img = SPR[type][flip]; }
        else if (roll < 0.1) { type = 'pumpkins'; img = SPR.pumpkins[(rng.next() * 2) | 0][flip]; }
        else if (roll < 0.13) { type = rng.next() < 0.5 ? 'hayR' : 'stump'; img = SPR[type][flip]; }
        else return;
        props.push({ x, y, type, img, pad: 50 });
      });
      return props;
    },

    drawProp(ctx, pr, view) {
      const img = pr.img;
      if (!img) return;
      if (pr.tree) {
        // see-through canopy when Jack walks behind it
        const p = view.game.player;
        const hw = img.width / 2;
        if (p.y < pr.y - 2 && p.y > pr.y - img.height + 8 && Math.abs(p.x - pr.x) < hw - 4) ctx.globalAlpha = 0.6;
        if (this._frameTrees.length < 24) this._frameTrees.push(pr);
      }
      blit(ctx, img, pr.x, pr.y, img.width / 2, img.height - 1);
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o, view) {
      let w, dx = 1, dy = 0, a = 1;
      if (o.kind === 'prop') {
        const s = PROP_SH[o.type];
        if (!s) return;
        w = s.w; dx = s.dx; dy = s.dy;
      } else if (o.kind === 'enemy') {
        if (o.dying) { if (o.deathT > 0.25) return; a = 1 - o.deathT * 3; }
        w = o.type === 'colossus' ? 32 : o.type === 'ghost' ? 10 : 14;
        if (o.type === 'ghost') a *= 0.55;
        if (o.spawnT < 1) w = Math.max(4, Math.round(w * (0.35 + 0.65 * o.spawnT)));
      } else {
        w = o.dashT > 0 ? 12 : 14;
      }
      w = Math.min(70, Math.max(4, w & ~1));
      const img = SPR.shadow[w];
      ctx.globalAlpha = a;
      ctx.drawImage(img, Math.round(o.x + dx - w / 2), Math.round(o.y + dy - img.height / 2));
      ctx.globalAlpha = 1;
    },

    drawGroundOverlay(ctx, view, game) {
      this._frameTrees.length = 0;
      const p = game.player;
      if (p.levelT > 0) {
        const t = 1 - p.levelT;
        const r = Math.round(6 + t * 34);
        ctx.globalAlpha = Math.min(1, p.levelT * 1.6);
        const img = ringSprite(r, '#ffd25a');
        ctx.drawImage(img, Math.round(p.x - r - 1), Math.round(p.y - r * 0.5 - 1), img.width, Math.round(img.height * 0.5));
        ctx.globalAlpha = 1;
      }
    },

    drawGem(ctx, g, view) {
      const big = g.big;
      const set = big ? SPR.gemBig : SPR.gem;
      const bob = Math.round(Math.sin(view.rt * 3 + g.seed * 6.28) * 1);
      const z = g.pop > 0 ? Math.round(Math.sin(g.pop * Math.PI) * 9) : 0;
      const x = Math.round(g.x), y = Math.round(g.y);
      // tiny ground shadow
      ctx.globalAlpha = 0.8;
      ctx.drawImage(SPR.shadow[big ? 8 : 6], x - (big ? 4 : 3), y - 1);
      ctx.globalAlpha = 1;
      const img = set[((view.rt * 4 + g.seed * 8) | 0) % 2 === 0 ? 0 : (g.seed > 0.5 ? 1 : 0)];
      const gy = y - 4 - bob - z;
      // glow
      ctx.globalCompositeOperation = 'lighter';
      const glow = big ? SPR.glowT : SPR.glowS;
      ctx.globalAlpha = 0.5 + 0.15 * Math.sin(view.rt * 5 + g.seed * 9);
      ctx.drawImage(glow, x - (glow.width >> 1), gy + (img.height >> 1) - (glow.height >> 1));
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, x - (img.width >> 1), gy);
      // sparkle
      const ph = (view.rt * 0.8 + g.seed * 3.7) % 1;
      if (ph < 0.16) {
        const sp = big ? SPR.sparkleT : SPR.sparkle;
        const s = sp[Math.min(2, Math.floor(Math.abs(ph - 0.08) / 0.08 * 3))];
        ctx.drawImage(s, x + (big ? 2 : 1) - (s.width >> 1), gy - 1 - (s.height >> 1));
      }
    },

    drawPlayer(ctx, p, view) {
      const mode = p.moving ? 'walk' : 'idle';
      const frame = p.moving ? Math.floor(p.anim) & 3 : Math.floor(view.rt * 2.2) & 1;
      const fl = p.facing < 0 ? 'l' : 'r';
      const flick = U.noise(view.rt * 9, 0.5, 3) > 0.62 ? 1 : 0;
      const base = SPR.jack[flick][mode][frame][fl];
      const ax = base.width / 2, ay = base.height - 1;
      // dash smear: tinted afterimages
      if (p.dashT > 0) {
        const di = SPR.jackDash[mode][frame][fl];
        for (let k = 3; k >= 1; k--) {
          ctx.globalAlpha = 0.16 * (4 - k);
          blit(ctx, di, p.x - p.dashX * k * 7, p.y - p.dashY * k * 7, ax, ay);
        }
        ctx.globalAlpha = 1;
      }
      // footstep dust
      if (p.moving && (frame === 0 || frame === 2) && this._lastStep !== frame) {
        this._lastStep = frame;
        view.game.addParticle({ x: p.x - p.facing * 4, y: p.y, z: 1, vx: -p.facing * 8, vy: -2, vz: 4, kind: 'dust', life: 0.35, size: 1.4, drag: 4 });
      }
      if (!p.moving) this._lastStep = -1;
      // invulnerability blink
      if (p.iframes > 0 && p.hurtT < 0.5 && Math.floor(view.rt * 18) % 2 === 0) ctx.globalAlpha = 0.35;
      const img = p.hurtT > 0.55 ? SPR.jackFlash[mode][frame][fl] : base;
      blit(ctx, img, p.x, p.y, ax, ay);
      ctx.globalAlpha = 1;
    },

    drawEnemy(ctx, e, view) {
      const fl = e.facing < 0 ? 'l' : 'r';
      let set, flash, frame, lift = 0;
      if (e.type === 'ghost') {
        frame = Math.floor(view.rt * 6 + e.seed * 4) & 3;
        set = SPR.ghost; flash = SPR.ghostF;
        lift = 3 + Math.round(Math.sin(view.rt * 3 + e.seed * 6) * 1.5);
      } else if (e.type === 'colossus') {
        frame = Math.floor(e.anim * 1.2) & 3;
        set = SPR.colossus; flash = SPR.colossusF;
        if ((frame === 1 || frame === 3) && e._lf !== frame && e.spawnT >= 1 && !e.dying) {
          view.game.addParticle({ x: e.x - 8, y: e.y, z: 1, vx: -10, vz: 6, kind: 'dust', life: 0.45, size: 2.2, drag: 3 });
          view.game.addParticle({ x: e.x + 8, y: e.y, z: 1, vx: 10, vz: 6, kind: 'dust', life: 0.45, size: 2.2, drag: 3 });
        }
        e._lf = frame;
      } else {
        frame = Math.floor(e.anim * 1.6) & 3;
        const v = e.seed < 0.5 ? 0 : 1;
        set = SPR.creeper[v]; flash = SPR.creeperF[v];
      }
      const img = set[frame][fl];
      const ax = img.width / 2, ay = img.height - 1;
      if (e.dying) {
        if (e.deathT < 0.2) blit(ctx, flash[frame][fl], e.x, e.y - lift - 1, ax, ay);
        return;
      }
      const useFlash = e.flash > 0.45;
      if (e.spawnT < 1) {
        const s = e.spawnT;
        if (e.type === 'ghost') {
          ctx.globalAlpha = s * 0.85;
          blit(ctx, img, e.x, e.y - lift + Math.round((1 - s) * 8), ax, ay);
          ctx.globalAlpha = 1;
          if (!e._sp && s < 0.5) {
            e._sp = true;
            for (let k = 0; k < 3; k++) view.game.addParticle({ x: e.x + (Math.random() - 0.5) * 10, y: e.y, z: 2, vz: 14, kind: 'vapour', life: 0.6, size: 2, drag: 2 });
          }
          return;
        }
        // rise out of the soil
        const vis = Math.max(1, Math.round(img.height * U.ease.outQuad(s)));
        const sx = Math.round(e.x - ax), sy = Math.round(e.y + 1 - vis);
        ctx.drawImage(useFlash ? flash[frame][fl] : img, 0, 0, img.width, vis, sx, sy, img.width, vis);
        const m = SPR.dirtMound;
        ctx.globalAlpha = Math.min(1, (1 - s) * 3);
        const mw = e.type === 'colossus' ? 2 : 1;
        ctx.drawImage(m, Math.round(e.x - (m.width * mw) / 2), Math.round(e.y - m.height + 1), m.width * mw, m.height);
        ctx.globalAlpha = 1;
        if (!e._sp && s < 0.6) {
          e._sp = true;
          const n = e.type === 'colossus' ? 8 : 4;
          for (let k = 0; k < n; k++) {
            const a = Math.random() * Math.PI;
            view.game.addParticle({ x: e.x + Math.cos(a) * 5, y: e.y, z: 2, vx: Math.cos(a) * 30, vy: (Math.random() - 0.5) * 10, vz: 30 + Math.random() * 30, grav: 160, kind: 'chunk', color: Math.random() < 0.5 ? '#6e4632' : '#9a663f', life: 0.6, size: 2, drag: 1 });
          }
          view.game.addParticle({ x: e.x, y: e.y, z: 2, vz: 8, kind: 'dust', life: 0.5, size: 2.5, drag: 2 });
        }
        return;
      }
      e._sp = false;
      if (e.type === 'ghost') ctx.globalAlpha = 0.86;
      blit(ctx, useFlash ? flash[frame][fl] : img, e.x, e.y - lift, ax, ay);
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const fl = Math.floor(view.rt * 10 + o.idx * 3) % 7 === 0 ? 1 : 0;
      const img = SPR.lantern[fl];
      const x = Math.round(o.x), y = Math.round(o.y) - 8 + Math.round(Math.sin(view.rt * 4 + o.idx) * 1);
      ctx.globalCompositeOperation = 'lighter';
      const gl = SPR.glowL[(Math.floor(view.rt * 7 + o.idx) % 3 === 0) ? 1 : 0];
      ctx.globalAlpha = 0.85;
      ctx.drawImage(gl, x - (gl.width >> 1), y + 2 - (gl.height >> 1));
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, x - (img.width >> 1), y - (img.height >> 1));
    },

    drawProjectile(ctx, pr, view) {
      const sp = Math.hypot(pr.vx, pr.vy) || 1;
      const dx = pr.vx / sp, dy = pr.vy / sp;
      ctx.fillStyle = '#fff2c8';
      ctx.globalAlpha = 0.55;
      ctx.fillRect(Math.round(pr.x - dx * 4), Math.round(pr.y - dy * 4), 1, 1);
      ctx.globalAlpha = 0.28;
      ctx.fillRect(Math.round(pr.x - dx * 6), Math.round(pr.y - dy * 6), 1, 1);
      ctx.globalAlpha = 1;
      const img = SPR.seed[Math.floor(pr.spin / (Math.PI / 4)) & 3];
      ctx.drawImage(img, Math.round(pr.x - img.width / 2), Math.round(pr.y - img.height / 2));
    },

    drawParticle(ctx, pt, view) {
      const a = U.clamp(pt.life / pt.max, 0, 1);
      const x = Math.round(pt.x), y = Math.round(pt.y - pt.z);
      switch (pt.kind) {
        case 'dust': {
          const r = Math.max(0, Math.min(4, Math.round(pt.size * (1.5 - a * 0.7)) - 1));
          const img = SPR.puff[r];
          ctx.globalAlpha = Math.min(1, a * 1.2) * 0.42;
          ctx.drawImage(img, x - (img.width >> 1), y - (img.height >> 1));
          break;
        }
        case 'vapour': {
          const r = Math.max(0, Math.min(4, Math.round(pt.size * (1.6 - a * 0.8)) - 1));
          const img = SPR.vapour[r];
          ctx.globalAlpha = a * 0.7;
          ctx.drawImage(img, x - (img.width >> 1), y - (img.height >> 1));
          break;
        }
        case 'leaf': {
          const fr = SPR.leafP[pt.col || 0][Math.floor(pt.rot) & 3];
          const sw = Math.round(Math.sin(pt.rot * 1.3 + pt.seed * 6) * 2);
          ctx.globalAlpha = Math.min(1, a * 2.5);
          ctx.drawImage(fr, x + sw, y);
          break;
        }
        case 'chunk': {
          ctx.globalAlpha = Math.min(1, a * 3);
          const s = pt.size > 2.4 ? 3 : 2;
          ctx.fillStyle = pt.color || '#9a663f';
          ctx.fillRect(x, y, s, s);
          if (pt.hi) { ctx.fillStyle = pt.hi; ctx.fillRect(x, y, 1, 1); }
          break;
        }
        case 'sparkle': {
          const set = pt.teal ? SPR.sparkleT : SPR.sparkle;
          const img = set[a > 0.6 ? 0 : a > 0.3 ? 1 : 2];
          ctx.drawImage(img, x - (img.width >> 1), y - (img.height >> 1));
          break;
        }
        case 'ring': {
          const r = Math.max(2, Math.round(pt.r0 + (1 - a) * pt.r1));
          const img = ringSprite(r, pt.color || '#fff4d0');
          ctx.globalAlpha = Math.min(1, a * 2);
          ctx.drawImage(img, x - r - 1, y - r - 1);
          break;
        }
        default: {
          ctx.globalAlpha = Math.min(1, a * 2);
          ctx.fillStyle = pt.color || '#fff4d0';
          const s = pt.size > 1.8 ? 2 : 1;
          ctx.fillRect(x, y, s, s);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n, view) {
      const img = numSprite(Math.max(0, n.value | 0), n.crit);
      const age = n.max - n.life;
      const a = U.clamp((n.life / n.max) * 2.6, 0, 1);
      const pop = age < 0.08 ? (n.crit ? 3 : 2) : age < 0.14 ? 1 : 0;
      ctx.globalAlpha = a;
      ctx.drawImage(img, Math.round(n.x - img.width / 2), Math.round(n.y - img.height - pop));
      ctx.globalAlpha = 1;
    },

    drawWorldOverlay(ctx, view, game) {
      const rt = view.rt;
      // leaves drifting down from visible trees
      for (const t of this._frameTrees) {
        const tr = t.tree;
        for (let k = 0; k < 2; k++) {
          const period = 5 + tr.s * 3 + k * 1.7;
          const ph = (rt / period + tr.s * 7.3 + k * 0.5) % 1;
          if (ph > 0.55) continue;
          const u = ph / 0.55;
          const h = t.img.height;
          const sx = t.x + (U.hash2(k, (tr.s * 1e4) | 0, 9) - 0.5) * t.img.width * 0.7;
          const x = sx + Math.sin(u * 9 + k) * 4 + u * 8;
          const y = t.y - h * 0.55 + u * (h * 0.55 + 6);
          const fr = SPR.leafP[(k + ((tr.s * 10) | 0)) % 4][Math.floor(u * 14 + k) & 3];
          ctx.globalAlpha = u > 0.85 ? (1 - u) / 0.15 : 1;
          ctx.drawImage(fr, Math.round(x), Math.round(y));
        }
      }
      // wind-blown leaves (world anchored, wrap around the camera)
      const TX = 720, TY = 480;
      for (let i = 0; i < 9; i++) {
        const sx = U.hash2(i, 1, 77) * TX, sy = U.hash2(i, 2, 77) * TY;
        const wx = sx + rt * (16 + i * 1.3), wy = sy + rt * 7 + Math.sin(rt * 1.4 + i) * 8;
        const bx = view.x0 - 40, by = view.y0 - 40;
        const x = bx + ((((wx - bx) % TX) + TX) % TX), y = by + ((((wy - by) % TY) + TY) % TY);
        if (x > view.x1 + 10 || y > view.y1 + 10) continue;
        const fr = SPR.leafP[i % 5][Math.floor(rt * 6 + i) & 3];
        ctx.globalAlpha = 0.9;
        ctx.drawImage(fr, Math.round(x), Math.round(y));
      }
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      const W = view.W, H = view.H;
      if (!this._ov || this._ov.w !== W || this._ov.h !== H) {
        // warm afternoon grade (soft-light) + plum vignette (multiply)
        const g = U.canvas(W, H);
        const lg = g.ctx.createLinearGradient(0, 0, W, H);
        lg.addColorStop(0, 'rgba(255,190,110,0.55)');
        lg.addColorStop(0.5, 'rgba(255,170,100,0.18)');
        lg.addColorStop(1, 'rgba(80,90,160,0.42)');
        g.ctx.fillStyle = lg;
        g.ctx.fillRect(0, 0, W, H);
        const v = U.canvas(W, H);
        const rg = v.ctx.createRadialGradient(W * 0.48, H * 0.46, Math.min(W, H) * 0.35, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.62);
        rg.addColorStop(0, 'rgba(255,255,255,1)');
        rg.addColorStop(1, 'rgba(150,110,150,1)');
        v.ctx.fillStyle = rg;
        v.ctx.fillRect(0, 0, W, H);
        this._ov = { w: W, h: H, grade: g.c, vig: v.c };
      }
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.5;
      ctx.drawImage(this._ov.grade, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(this._ov.vig, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    },

    drawIcon(ctx, id, size) {
      const c = iconCanvas(id);
      const s = Math.max(1, Math.floor(size / 16));
      ctx.imageSmoothingEnabled = false;
      const o = Math.floor((size - 16 * s) / 2);
      ctx.drawImage(c, o, o, 16 * s, 16 * s);
    },

    /* ---------- gameplay hooks → particles ---------- */
    onHit(game, e, src) {
      const top = e.type === 'colossus' ? 40 : e.type === 'ghost' ? 14 : 18;
      game.addParticle({ x: e.x, y: e.y, z: top * 0.6, kind: 'sparkle', life: 0.16 });
      if (e.type === 'ghost') {
        game.addParticle({ x: e.x + (Math.random() - 0.5) * 6, y: e.y, z: top * 0.7, vx: (Math.random() - 0.5) * 20, vz: 6, kind: 'vapour', life: 0.4, size: 1.5 });
      } else if (Math.random() < 0.55) {
        game.addParticle({
          x: e.x + (Math.random() - 0.5) * 8, y: e.y, z: top + 4, vx: (Math.random() - 0.5) * 18, vy: 2, vz: 10, grav: 22, drag: 1.5,
          kind: 'leaf', col: Math.random() < 0.6 ? 5 : (Math.random() * 4) | 0, life: 1.1, vr: 6 + Math.random() * 4,
        });
      }
      if (e.type === 'colossus') game.addParticle({ x: e.x, y: e.y, z: 26, vx: (Math.random() - 0.5) * 50, vz: 30, grav: 160, kind: 'chunk', color: '#a87a46', hi: '#ead08a', life: 0.6, size: 2 });
    },
    onKill(game, e) {
      const big = e.type === 'colossus';
      const top = big ? 26 : 10;
      if (e.type === 'ghost') {
        for (let k = 0; k < 7; k++) {
          const a = Math.random() * U.TAU;
          game.addParticle({ x: e.x + Math.cos(a) * 3, y: e.y, z: 9 + Math.sin(a) * 3, vx: Math.cos(a) * 26, vy: Math.sin(a) * 10, vz: 10, kind: 'vapour', life: 0.55 + Math.random() * 0.3, size: 2.2, drag: 3 });
        }
        for (let k = 0; k < 3; k++) game.addParticle({ x: e.x + (Math.random() - 0.5) * 10, y: e.y, z: 8 + Math.random() * 8, vz: 8, kind: 'spark', color: '#e8f6ff', life: 0.5, size: 1 });
        game.addParticle({ x: e.x, y: e.y - 9, kind: 'ring', r0: 3, r1: 8, color: '#d4e6f6', life: 0.25 });
        return;
      }
      const cols = big ? [['#8e5078', '#b47ea0'], ['#a87a46', '#ead08a'], ['#cfa25a', '#f4e0a0'], ['#467036', '#689a44']]
        : e.seed < 0.5 ? [['#713488', '#bf80c8'], ['#9654a8', '#c890d0'], ['#dcc290', '#fff6da'], ['#f2e2b0', '#ffffff']]
          : [['#86325e', '#d07e98'], ['#ad5278', '#e8a0b8'], ['#dcc290', '#fff6da'], ['#f2e2b0', '#ffffff']];
      const n = big ? 16 : 8;
      for (let k = 0; k < n; k++) {
        const a = Math.random() * U.TAU, s = (big ? 60 : 45) * (0.5 + Math.random() * 0.7);
        const c = cols[(Math.random() * cols.length) | 0];
        game.addParticle({ x: e.x, y: e.y, z: top * (0.6 + Math.random() * 0.6), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 50, grav: 200, drag: 1.2, kind: 'chunk', color: c[0], hi: c[1], life: 0.7 + Math.random() * 0.4, size: big ? 3 : 2 + Math.random() });
      }
      const nl = big ? 6 : 3;
      for (let k = 0; k < nl; k++) {
        game.addParticle({ x: e.x + (Math.random() - 0.5) * 10, y: e.y, z: top + 8 + Math.random() * 6, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 8, vz: 18, grav: 26, drag: 1.6, kind: 'leaf', col: k % 2 ? 5 : (Math.random() * 4) | 0, life: 1.2 + Math.random() * 0.5, vr: 5 + Math.random() * 5 });
      }
      for (let k = 0; k < (big ? 5 : 2); k++) game.addParticle({ x: e.x + (Math.random() - 0.5) * 12, y: e.y, z: 2, vx: (Math.random() - 0.5) * 20, vz: 6, kind: 'dust', life: 0.5, size: big ? 3 : 2, drag: 3 });
      game.addParticle({ x: e.x, y: e.y - top, kind: 'ring', r0: big ? 6 : 3, r1: big ? 16 : 8, color: '#fff4d0', life: 0.22 });
    },
    onHurt(game, p) {
      for (let k = 0; k < 7; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: p.x, y: p.y, z: 18, vx: Math.cos(a) * 50, vy: Math.sin(a) * 25, vz: 40 + Math.random() * 30, grav: 200, kind: 'chunk', color: k % 2 ? '#de6e2c' : '#f59a3c', hi: '#ffc76c', life: 0.6, size: 2 });
      }
      game.addParticle({ x: p.x, y: p.y - 14, kind: 'ring', r0: 4, r1: 10, color: '#ffb36b', life: 0.2 });
    },
    onPickup(game, g) {
      const n = g.big ? 6 : 2;
      for (let k = 0; k < n; k++) {
        game.addParticle({ x: g.x + (Math.random() - 0.5) * 6, y: g.y, z: 6 + Math.random() * 8, vx: (Math.random() - 0.5) * 20, vz: 14, kind: 'sparkle', teal: g.big, life: 0.3 + Math.random() * 0.2 });
      }
      game.addParticle({ x: g.x, y: g.y, z: 10, vz: 20, kind: 'spark', color: g.big ? '#9af0e0' : '#ffc84a', life: 0.3, size: 2 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.5) game.addParticle({ x: pr.x, y: pr.y + 4, z: 4, vx: pr.vx * 0.05, vy: pr.vy * 0.05, kind: 'spark', color: '#fff2c8', life: 0.12, size: 1 });
    },
    onDash(game, p) {
      for (let k = 0; k < 5; k++) {
        game.addParticle({ x: p.x - p.dashX * k * 3, y: p.y, z: 1, vx: -p.dashX * 20 + (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 8, vz: 6, kind: 'dust', life: 0.4 + Math.random() * 0.2, size: 2, drag: 3 });
      }
    },
    onLevelUp(game, p) {
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * U.TAU;
        game.addParticle({ x: p.x + Math.cos(a) * 8, y: p.y + Math.sin(a) * 4, z: 12, vx: Math.cos(a) * 50, vy: Math.sin(a) * 25, vz: 30, grav: 40, kind: 'sparkle', life: 0.6 + Math.random() * 0.3 });
      }
      for (let k = 0; k < 6; k++) game.addParticle({ x: p.x + (Math.random() - 0.5) * 20, y: p.y, z: 28, vx: (Math.random() - 0.5) * 30, vz: 10, grav: 20, drag: 1.5, kind: 'leaf', col: (Math.random() * 4) | 0, life: 1.4, vr: 6 });
    },
    onDeath(game, p) {
      for (let k = 0; k < 18; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * 70, vy: Math.sin(a) * 35, vz: 50 + Math.random() * 40, grav: 200, kind: 'chunk', color: k % 3 ? '#de6e2c' : '#f59a3c', hi: '#ffc76c', life: 1.2, size: 3 });
      }
    },
  };
  Styles.register(st);
})();
