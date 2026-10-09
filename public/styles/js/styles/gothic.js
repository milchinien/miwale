/* =============================================================================
   Gothic Nacht  –  Pixel Art · Dark
   A moonlit cursed churchyard and moor. 1 art pixel = 1 world unit.
   Look: cold, desaturated night world; the only warm colours are Jack's carved
   face, the lanterns, the pumpkin seeds and candles.
   Technique:
     * ground: own per-pixel generator (time sliced) – six procedural tileable
       materials stacked with per-stone / per-tuft / per-leaf thresholds, so
       transitions break up into loose stones, tufts and single leaves
     * lighting: one banded pixel light map per frame (ambient moonlight +
       vignette + drifting cloud light + point lights), multiplied onto the
       ground (full) and onto the entities (partial, so they stay readable),
       then additive bloom and an emissive pass (eyes, seeds, lanterns, embers,
       souls, numbers) drawn after the light
   ============================================================================= */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const clamp = U.clamp;
  const hx = (h) => U.hex(h);
  const RA = (a) => a.map(hx);
  const cs = (c, a) =>
    a === undefined
      ? 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'
      : 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const BY = U.bayer8;
  const dith = (x, y) => BY[((y & 7) << 3) | (x & 7)];
  function pick(r, v, x, y, d) {
    let i = Math.floor(v * r.length + (d ? (dith(x, y) - 0.5) * d : 0));
    return r[i < 0 ? 0 : i >= r.length ? r.length - 1 : i];
  }

  /* =========================================================================
     Palette (authored "fully lit" – the light map turns it into night)
     ========================================================================= */
  const OUT = hx('#0b0910');
  const PAL = {
    stone: RA(['#1d2030', '#2a2e3e', '#3a3f51', '#4e5466', '#666d7f', '#81889a', '#a2a8b8']),
    moss: RA(['#1d2b1c', '#2a3f25', '#3a5530', '#4f6c3c']),
    iron: RA(['#0e0e15', '#1a1a25', '#2a2a3a', '#424258', '#5e5e78']),
    bark: RA(['#151118', '#1f1922', '#2b232d', '#3a3039', '#4d4049', '#63555c']),
    bone: RA(['#4a473f', '#77746a', '#a5a190', '#d0cbb6', '#ebe7d6']),
    pumpkin: RA(['#3a1206', '#652108', '#93370c', '#bd5314', '#de7826', '#f3a046']),
    flesh: hx('#eeb060'),
    stem: RA(['#1c190f', '#34311a', '#4f4d24', '#6a6832']),
    face: RA(['#b84808', '#ff8a1c', '#ffcc4a', '#fff4c4']),
    cloak: RA(['#0f0b17', '#1a1428', '#271f40', '#372e58', '#4f4880']),
    scarf: RA(['#2e0b1e', '#4e1632', '#74244a', '#9a3a62']),
    pants: RA(['#110e17', '#1d1927', '#2b2537']),
    boot: RA(['#0d0a0b', '#211719', '#352729']),
    glove: RA(['#2a1e1c', '#463430', '#64504a']),
    tPurple: RA(['#1c0a24', '#33123c', '#4e1c58', '#6c2a76', '#8a4292', '#ab68b0']),
    tPurple2: RA(['#200a1c', '#3a1234', '#581c4e', '#782a68', '#984284', '#b868a2']),
    tCream: RA(['#3e3022', '#625038', '#8a7650', '#b09c6a', '#d2c28c', '#e8dcae']),
    tLeaf: RA(['#122012', '#1c341c', '#2a4c26', '#3c6532', '#557f42']),
    tWilt: RA(['#3e3420', '#5a4c2a', '#78683a']),
    eyeG: RA(['#2e8a1e', '#6ee03a', '#c8ff7a', '#f4ffd8']),
    ghost: RA(['#1e2840', '#3a4a6c', '#5e7396', '#8aa0c0', '#b6c8de', '#e2ecf6']),
    eyeC: RA(['#1a8aa0', '#4ae8ff', '#c8ffff']),
    kPurple: RA(['#160a1a', '#26112c', '#3a1a40', '#522656', '#6c386c', '#865080']),
    kBark: RA(['#1e1812', '#33291c', '#4c3e28', '#665438', '#82704a', '#9a8a60']),
    kStalk: RA(['#1a2214', '#2a3a1e', '#3e5228', '#566a34']),
    core: RA(['#1a5a1e', '#38b838', '#86ff5a', '#dcffb0', '#ffffff']),
    juice: RA(['#3a0a26', '#64123e', '#901c52', '#bc3068']),
    gem: RA(['#0c3a48', '#14808a', '#36d6c0', '#8cfff0', '#e8fffa']),
    seed: RA(['#5e4428', '#9a7c4e', '#cdb47e', '#eee0b0', '#fffaea']),
    fire: RA(['#7a1c06', '#c8460c', '#ff8a1c', '#ffc848', '#fff2b8']),
    wax: RA(['#6e6656', '#a49c84', '#d0c8ae', '#ece6d0']),
    soul: RA(['#1e6a6a', '#3cc8b0', '#9cffe0', '#eafff8']),
    glass: RA(['#4a0c10', '#8a1a1a', '#c8302a', '#ff6a4a']),
  };
  const GR = {
    soil: RA(['#1e171c', '#291f25', '#36292e', '#443539', '#554441', '#69574e']),
    grass: RA(['#141f18', '#1a291d', '#213423', '#2a422b', '#365233', '#46653d', '#5b7b48']),
    moss: RA(['#1a2a20', '#223827', '#2c492e', '#385a35', '#486d3e', '#5e844a']),
    cob: RA(['#232731', '#2f3441', '#3d4351', '#4d5464', '#5f6778', '#767e90', '#9098a8']),
    flag: RA(['#28292f', '#34353d', '#43444d', '#53545e', '#666771', '#7c7d88', '#9898a2']),
    leafA: RA(['#3e2018', '#5a2e1e', '#7a4428', '#985c34']),
    leafB: RA(['#3e3018', '#5a4622', '#786030', '#947a42']),
    leafC: RA(['#33182a', '#4c2236', '#683246', '#80465a']),
    leafD: RA(['#2e2a26', '#46403a', '#5e554c', '#766b5e']),
    water: RA(['#141a2a', '#1b2438', '#243049', '#33415e', '#56688c', '#9aaed0', '#dce6f4']),
  };

  /* =========================================================================
     Pixel painter
     ========================================================================= */
  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
    set(x, y, c, a) {
      x = Math.floor(x); y = Math.floor(y);
      if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const o = (y * this.w + x) * 4;
      this.d[o] = c[0]; this.d[o + 1] = c[1]; this.d[o + 2] = c[2]; this.d[o + 3] = a === undefined ? 255 : a;
    }
    al(x, y) {
      x = Math.floor(x); y = Math.floor(y);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
      return this.d[(y * this.w + x) * 4 + 3];
    }
    get(x, y) { const o = (y * this.w + x) * 4; return [this.d[o], this.d[o + 1], this.d[o + 2]]; }
    del(x, y) {
      x = Math.floor(x); y = Math.floor(y);
      if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[(y * this.w + x) * 4 + 3] = 0;
    }
    rect(x, y, w, h, c, a) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a); }
    line(x0, y0, x1, y1, c, a) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy, n = 0;
      for (;;) {
        this.set(x0, y0, typeof c === 'function' ? c(x0, y0, n++) : c, a);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    ell(cx, cy, rx, ry, fn) {
      for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx); x++) {
          const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
          if (nx * nx + ny * ny <= 1) fn(x, y, nx, ny);
        }
      }
    }
    poly(pts, fn) {
      let y0 = Infinity, y1 = -Infinity;
      for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          for (let x = Math.ceil(xs[k] - 0.5); x < xs[k + 1] - 0.5; x++) fn(x, y);
        }
      }
    }
    outline(c, diag) {
      const o = new Pix(this.w + 2, this.h + 2);
      for (let y = 0; y < o.h; y++) {
        for (let x = 0; x < o.w; x++) {
          const sx = x - 1, sy = y - 1;
          if (this.al(sx, sy) > 0) {
            const s = (sy * this.w + sx) * 4, t = (y * o.w + x) * 4;
            o.d[t] = this.d[s]; o.d[t + 1] = this.d[s + 1]; o.d[t + 2] = this.d[s + 2]; o.d[t + 3] = this.d[s + 3];
          } else if (this.al(sx - 1, sy) || this.al(sx + 1, sy) || this.al(sx, sy - 1) || this.al(sx, sy + 1) ||
            (diag && (this.al(sx - 1, sy - 1) || this.al(sx + 1, sy - 1) || this.al(sx - 1, sy + 1) || this.al(sx + 1, sy + 1)))) {
            o.set(x, y, c);
          }
        }
      }
      return o;
    }
    canvas() {
      const { c, ctx } = U.canvas(this.w, this.h);
      const img = ctx.createImageData(this.w, this.h);
      img.data.set(this.d);
      ctx.putImageData(img, 0, 0);
      return c;
    }
  }

  /* tone canvas: draw shapes as (id, tone), colourise with moonlight edge rules */
  class TC {
    constructor(w, h) { this.w = w; this.h = h; this.id = new Uint8Array(w * h); this.t = new Float32Array(w * h); }
    put(x, y, id, t) {
      x = Math.floor(x); y = Math.floor(y);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = y * this.w + x;
      this.id[i] = id; this.t[i] = t;
    }
    idAt(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.id[y * this.w + x]; }
    toneAt(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.t[y * this.w + x]; }
    toPix(ramps, o) {
      o = o || {};
      const L = o.left !== undefined ? o.left : 0.17, T = o.top !== undefined ? o.top : 0.1;
      const Rr = o.right !== undefined ? o.right : 0.15, B = o.bottom !== undefined ? o.bottom : 0.08;
      const d = o.dither !== undefined ? o.dither : 0.35;
      const p = new Pix(this.w, this.h);
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          const id = this.id[y * this.w + x];
          if (!id) continue;
          let t = this.t[y * this.w + x];
          if (!this.idAt(x - 1, y)) t += L;
          if (!this.idAt(x, y - 1)) t += T;
          if (!this.idAt(x + 1, y)) t -= Rr;
          if (!this.idAt(x, y + 1)) t -= B;
          p.set(x, y, pick(ramps[id], t, x, y, d));
        }
      }
      return p;
    }
  }

  const LD = (() => { const l = [-0.52, -0.64, 0.56]; const n = Math.hypot(l[0], l[1], l[2]); return l.map((v) => v / n); })();
  function shade(nx, ny) {
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    return nx * LD[0] + ny * LD[1] + nz * LD[2];
  }

  /* moon shadow (moon high in the upper left -> shadows fall to the lower right) */
  function moonShadow(pix, baseY, kx, ky) {
    kx = kx === undefined ? 0.55 : kx; ky = ky === undefined ? 0.3 : ky;
    let maxH = 0;
    for (let y = 0; y < pix.h; y++) for (let x = 0; x < pix.w; x++) if (pix.al(x, y)) maxH = Math.max(maxH, baseY - y);
    const W = Math.ceil(pix.w + maxH * kx + 2), Hh = Math.ceil(maxH * ky + 4);
    const s = new Pix(W, Hh);
    const blk = [5, 5, 12];
    for (let y = 0; y < pix.h; y++) {
      for (let x = 0; x < pix.w; x++) {
        if (!pix.al(x, y)) continue;
        const h = Math.max(0, baseY - y);
        const sx = Math.round(x + h * kx), sy = Math.round(1 + h * ky);
        s.set(sx, sy, blk); s.set(sx, sy + 1, blk);
      }
    }
    return { c: s.canvas(), oy: baseY - 1 };
  }

  /* sprite record: drawn with feet column ax / row ay at the entity position */
  function mk(pix, ax, ay, eyes, white) {
    const r = pix.canvas();
    const s = { r, l: U.flipX(r), w: pix.w, h: pix.h, ax, ay, eyes: eyes || [], eyesL: null, wr: null, wl: null };
    s.eyesL = s.eyes.map((e) => [pix.w - 1 - e[0], e[1], e[2]]);
    if (white) { s.wr = U.tint(r, '#ffffff'); s.wl = U.flipX(s.wr); }
    return s;
  }

  /* =========================================================================
     Ground textures (256², tileable)
     ========================================================================= */
  const TS = 256, TM = 255;
  const at = (x, y) => ((y & TM) << 8) | (x & TM);
  function put3(a, i, c) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; }

  function worleyP(x, y, cw, ch, px, py, seed, o) {
    const gx = x / cw, gy = y / ch, xi = Math.floor(gx), yi = Math.floor(gy);
    let d1 = 1e9, d2 = 1e9, ax = 0, ay = 0, bx = 0, by = 0, id = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const cx = xi + i, cy = yi + j;
        const h = U.hashInt(((cx % px) + px) % px, ((cy % py) + py) % py, seed);
        const fx = (cx + 0.18 + ((h & 1023) / 1023) * 0.64) * cw, fy = (cy + 0.18 + (((h >>> 10) & 1023) / 1023) * 0.64) * ch;
        const dx = fx - x, dy = fy - y, d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; bx = ax; by = ay; d1 = d; ax = fx; ay = fy; id = h; }
        else if (d < d2) { d2 = d; bx = fx; by = fy; }
      }
    }
    o.e = (d2 - d1) / (2 * Math.hypot(bx - ax, by - ay) + 1e-6);
    o.d = Math.sqrt(d1); o.id = id; o.x = ax; o.y = ay;
    return o;
  }

  function texSoil() {
    const rgb = new Uint8Array(TS * TS * 3), v = new Float32Array(TS * TS);
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      v[y * TS + x] = 0.36 + (U.fbmTile(x / 32, y / 32, 8, 11, 3) - 0.5) * 0.55 + (U.fbmTile(x / 8, y / 8, 32, 12, 2) - 0.5) * 0.35;
    }
    const rng = U.rng(77);
    for (let k = 0; k < 1500; k++) {
      const x = rng.int(0, TM), y = rng.int(0, TM), s = rng.chance(0.3) ? 2 : 1;
      for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) v[at(x + i, y + j)] += i + j === 0 ? 0.24 : 0.12;
      for (let i = 0; i <= s; i++) v[at(x + i, y + s)] -= 0.15;
    }
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) put3(rgb, y * TS + x, pick(GR.soil, v[y * TS + x], x, y, 0.5));
    for (let k = 0; k < 110; k++) {
      const x = rng.int(0, TM), y = rng.int(0, TM), w = rng.int(2, 3), tone = rng.int(1, 3);
      for (let j = 0; j < 2; j++) for (let i = 0; i < w; i++) {
        put3(rgb, at(x + i, y + j), i === 0 && j === 0 ? GR.cob[tone + 2] : GR.cob[tone + (j === 1 ? 0 : 1)]);
      }
      for (let i = 0; i < w; i++) put3(rgb, at(x + i, y + 2), GR.soil[0]);
    }
    return { rgb };
  }

  function texGrass(ramp, seed, blades) {
    const rgb = new Uint8Array(TS * TS * 3), thr = new Uint8Array(TS * TS), v = new Float32Array(TS * TS);
    const wo = {};
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const i = y * TS + x;
      v[i] = 0.3 + (U.fbmTile(x / 32, y / 32, 8, seed, 3) - 0.5) * 0.45 + (U.fbmTile(x / 8, y / 8, 32, seed + 5, 2) - 0.5) * 0.3;
      const t = U.fbmTile(x / 16, y / 16, 16, seed + 9, 3);
      worleyP(x, y, 8, 8, 32, 32, seed + 3, wo);
      thr[i] = clamp((t - 0.28) / 0.44 * 0.72 + (wo.d / 8) * 0.42, 0, 0.985) * 255;
    }
    const rng = U.rng(seed * 7 + 1);
    for (let k = 0; k < blades; k++) {
      const x = rng.int(0, TM), y = rng.int(0, TM), h = rng.int(2, 4);
      const lean = rng.next() < 0.3 ? -1 : rng.next() < 0.45 ? 1 : 0, tb = rng.next() * 0.12;
      for (let s = 0; s < h; s++) v[at(x + Math.round(lean * (s / h) * 1.3), y - s)] = 0.34 + 0.48 * (s / (h - 1)) + tb;
      v[at(x, y + 1)] -= 0.1;
    }
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) put3(rgb, y * TS + x, pick(ramp, v[y * TS + x], x, y, 0.35));
    return { rgb, thr };
  }

  function texMoss(seed) {
    const rgb = new Uint8Array(TS * TS * 3), thr = new Uint8Array(TS * TS), v = new Float32Array(TS * TS);
    const wo = {};
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const i = y * TS + x;
      worleyP(x, y, 8, 8, 32, 32, seed, wo);
      const rx = (x - wo.x) / 5, ry = (y - wo.y) / 5;
      let t = 0.44 + (U.fbmTile(x / 16, y / 16, 16, seed + 1, 3) - 0.5) * 0.4;
      t += (-0.55 * rx - 0.75 * ry) * 0.16;
      if (wo.e < 0.9) t -= 0.17;
      v[i] = t;
      thr[i] = clamp((U.fbmTile(x / 32, y / 32, 8, seed + 7, 3) - 0.25) / 0.5, 0, 0.985) * 255;
    }
    const rng = U.rng(seed + 99);
    for (let k = 0; k < 700; k++) { const x = rng.int(0, TM), y = rng.int(0, TM); v[at(x, y)] = 0.86; v[at(x, y + 1)] -= 0.08; }
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) put3(rgb, y * TS + x, pick(GR.moss, v[y * TS + x], x, y, 0.4));
    return { rgb, thr };
  }

  function texLeaves(seed) {
    const rgb = new Uint8Array(TS * TS * 3), thr = new Uint8Array(TS * TS).fill(255), sh = new Uint8Array(TS * TS).fill(255);
    const SH = [
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
      [[0, 0], [1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [0, 1], [1, 1]],
      [[0, 0], [0, 1], [1, 1], [1, 2]],
      [[0, 0], [1, 0], [2, 0], [1, 1], [2, 1], [3, 1]],
      [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2]],
      [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
    ];
    const fams = [GR.leafA, GR.leafA, GR.leafB, GR.leafC, GR.leafD, GR.leafB, GR.leafA];
    const rng = U.rng(seed);
    const list = [];
    for (let k = 0; k < 2900; k++) list.push({ x: rng.int(0, TM), y: rng.int(0, TM), s: rng.int(0, SH.length - 1), f: rng.int(0, fams.length - 1), tone: rng.int(1, 2), t: rng.next() });
    list.sort((a, b) => b.t - a.t);
    for (const L of list) {
      const s = SH[L.s], fam = fams[L.f], tv = Math.floor(L.t * 254);
      for (let i = 0; i < s.length; i++) {
        const c = i === 0 ? fam[L.tone + 1] : i === s.length - 1 ? fam[L.tone - 1] : fam[L.tone];
        const k = at(L.x + s[i][0], L.y + s[i][1]);
        put3(rgb, k, c); thr[k] = tv;
      }
      for (let i = 0; i < s.length; i++) {
        const k = at(L.x + s[i][0] + 1, L.y + s[i][1] + 1);
        if (thr[k] === 255 && sh[k] > tv) sh[k] = tv;
      }
    }
    return { rgb, thr, sh };
  }

  function texCobble(seed) {
    const rgb = new Uint8Array(TS * TS * 3), thr = new Uint8Array(TS * TS);
    const px = 22, py = 28, cw = TS / px, ch = TS / py, o = {};
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const i = y * TS + x;
      worleyP(x + 0.5, y + 0.5, cw, ch, px, py, seed, o);
      if (o.e < 0.85) { thr[i] = 255; put3(rgb, i, GR.cob[0]); continue; }
      const rx = (x + 0.5 - o.x) / (cw * 0.55), ry = (y + 0.5 - o.y) / (ch * 0.55);
      const lit = -0.55 * rx - 0.8 * ry;
      let v = 0.34 + ((o.id >>> 20) & 255) / 255 * 0.24;
      v += lit * 0.13;
      if (o.e < 1.9) v += lit > 0 ? 0.13 : -0.15;
      v += (U.fbmTile(x / 4, y / 4, 64, seed + 3, 2) - 0.5) * 0.2;
      thr[i] = ((o.id >>> 12) & 255) % 250;
      put3(rgb, i, pick(GR.cob, v, x, y, 0.5));
    }
    return { rgb, thr };
  }

  function texFlags(seed) {
    const rgb = new Uint8Array(TS * TS * 3), thr = new Uint8Array(TS * TS);
    const rng = U.rng(seed);
    // rows
    const rows = [];
    let yy = 0;
    while (yy < TS) {
      let h = rng.int(12, 17);
      if (TS - yy - h < 11) h = TS - yy;
      rows.push({ y: yy, h, off: rng.int(0, TM), slabs: [] });
      yy += h;
    }
    for (const r of rows) {
      let xx = 0;
      while (xx < TS) {
        let w = rng.int(15, 30);
        if (TS - xx - w < 12) w = TS - xx;
        r.slabs.push({ x: xx, w, id: rng.int(0, 249), tone: rng.next(), crack: rng.chance(0.28), cs: rng.int(0, 99999), chip: rng.int(0, 15) });
        xx += w;
      }
    }
    const val = new Float32Array(TS * TS), gap = new Uint8Array(TS * TS);
    for (const r of rows) {
      for (const s of r.slabs) {
        for (let j = 0; j < r.h; j++) {
          for (let i = 0; i < s.w; i++) {
            const x = (s.x + i + r.off) & TM, y = r.y + j, k = y * TS + x;
            const right = i === s.w - 1, bottom = j === r.h - 1;
            // chipped corners
            const cTL = i === 0 && j === 0 && s.chip & 1, cTR = i === s.w - 2 && j === 0 && s.chip & 2;
            const cBL = i === 0 && j === r.h - 2 && s.chip & 4, cBR = i === s.w - 2 && j === r.h - 2 && s.chip & 8;
            if (right || bottom || cTL || cTR || cBL || cBR) { gap[k] = 1; thr[k] = 255; continue; }
            let v = 0.36 + s.tone * 0.2;
            if (j === 0) v += 0.14; else if (i === 0) v += 0.08;
            if (j === r.h - 2) v -= 0.16; else if (i === s.w - 2) v -= 0.1;
            const cx = (i - s.w / 2) / s.w, cy = (j - r.h / 2) / r.h;
            v += (0.25 - (cx * cx + cy * cy)) * 0.12;
            v += (U.fbmTile(x / 5.12, y / 5.12, 50, seed + 1, 2) - 0.5) * 0.18;
            val[k] = v; thr[k] = s.id;
          }
        }
        if (s.crack) {
          const cr = U.rng(s.cs);
          let cx = s.x + cr.int(3, s.w - 4) + r.off, cy = r.y + 1;
          const dir = cr.chance(0.5) ? 1 : -1;
          for (let n = 0; n < r.h + 4 && cy < r.y + r.h - 2; n++) {
            const k = at(cx, cy);
            if (gap[k]) break;
            val[k] = 0.02;
            const kb = at(cx, cy + 1);
            if (!gap[kb] && val[kb] > 0.1) val[kb] += 0.06;
            if (cr.chance(0.55)) cy++; else cx += dir * (cr.chance(0.8) ? 1 : -1);
          }
        }
      }
    }
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const k = y * TS + x;
      put3(rgb, k, gap[k] ? GR.flag[0] : pick(GR.flag, val[k], x, y, 0.45));
    }
    return { rgb, thr };
  }

  /* =========================================================================
     World layout (biome fields)
     ========================================================================= */
  const NF = 9;
  function fields(x, y, o) {
    const yard = U.smoothstep(0.5, 0.6, U.warped(x / 950 + 31.7, y / 950 - 12.3, 501, 1.0, 3));
    const gN = U.warped(x / 560 - 4.4, y / 560 + 1.7, 321, 1.25, 4);
    o[0] = U.smoothstep(0.4, 0.52, gN + 0.08 - yard * 0.2);
    o[1] = U.fbm(x / 240, y / 240, 433, 3);
    o[2] = U.smoothstep(0.585, 0.68, U.warped(x / 430 + 8.8, y / 430 - 3.3, 655, 1.0, 3));
    const a1 = U.perlin(x / 520 + 0.37, y / 520 + 9.1, 913) + 0.28 * U.perlin(x / 150, y / 150, 914);
    const a2 = U.perlin(x / 610 - 5.2, y / 610 + 2.2, 923) + 0.28 * U.perlin(x / 170, y / 170, 924);
    const m1 = U.smoothstep(0.38, 0.5, U.noise(x / 1300, y / 1300, 915) + yard * 0.2);
    const m2 = U.smoothstep(0.45, 0.56, U.noise(x / 1500 + 7, y / 1500, 925) + yard * 0.2);
    o[3] = Math.max((1 - U.smoothstep(0.028, 0.062, Math.abs(a1))) * m1, (1 - U.smoothstep(0.028, 0.062, Math.abs(a2))) * m2);
    o[4] = U.smoothstep(0.61, 0.67, U.warped(x / 640 + 40.1, y / 640 - 13.9, 777, 1.1, 3) + yard * 0.05);
    o[5] = 0.9 + 0.2 * U.fbm(x / 420, y / 420, 99, 3);
    o[6] = U.fbm(x / 650, y / 650, 98, 2);
    o[7] = U.fbm(x / 110, y / 110, 97, 2);
    o[8] = yard;
    return o;
  }
  const FT = new Float32Array(NF);
  const fieldsAt = (x, y) => fields(x, y, FT);

  /* =========================================================================
     Ground decal sprites
     ========================================================================= */
  const DEC = {};
  function strSprite(rows, pal, shadowCol) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const p = new Pix(w + 1, h + 1);
    for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) { const ch = rows[y][x]; if (pal[ch]) p.set(x, y, pal[ch]); }
    if (shadowCol) {
      for (let y = h; y >= 0; y--) for (let x = w; x >= 0; x--) {
        if (!p.al(x, y) && (p.al(x - 1, y - 1) || p.al(x, y - 1))) p.set(x, y, shadowCol, 150);
      }
    }
    return p.canvas();
  }
  function buildDecals() {
    const B = PAL.bone, gsh = hx('#100c12');
    const bp = { a: B[4], b: B[3], c: B[2], d: B[1], e: hx('#0a080c') };
    DEC.skull = [
      strSprite([' bbb ', 'bbbbc', 'beebc', 'bcbcd', ' ccd '], bp, gsh),
      strSprite([' bbbb ', 'abbbbc', 'beebec', 'bbcbbd', ' cdcd '], bp, gsh),
    ];
    DEC.bone = [
      strSprite(['b    b', 'abbbbc', 'c    d'], bp, gsh),
      strSprite(['bb', ' bb', '  cc', '   cd'], bp, gsh),
      strSprite(['b  b', 'bbbc', 'c  d'], bp, gsh),
      strSprite([' b b b', 'b b b ', 'c c c '], bp, gsh),
    ];
    const W = PAL.wax;
    const wp = { a: W[3], b: W[2], c: W[1], d: W[0], f: hx('#2a2020') };
    DEC.stub = [
      strSprite([' f ', ' a ', ' b ', 'cbc', 'dccd'], wp, gsh),
      strSprite(['f    ', 'a  f ', 'b  a ', 'bc bc', 'ccdcc'], wp, gsh),
      strSprite([' f', 'ab', 'bc', 'cd'], wp, gsh),
    ];
    DEC.puddle = [];
    for (let i = 0; i < 6; i++) DEC.puddle.push(makePuddle(301 + i * 17));
    DEC.mound = [];
    for (let i = 0; i < 6; i++) DEC.mound.push(makeMound(711 + i * 13, i % 3));
    DEC.openGrave = [makeOpenGrave(5), makeOpenGrave(9)];
    DEC.slab = [makeSlab(3), makeSlab(8), makeSlab(13)];
  }

  function makePuddle(seed) {
    const rng = U.rng(seed);
    const w = rng.int(18, 36), h = Math.round(w * rng.range(0.42, 0.56));
    const p = new Pix(w + 2, h + 2);
    const cx = (w + 2) / 2, cy = (h + 2) / 2;
    const inside = (x, y) => {
      const nx = (x + 0.5 - cx) / (w / 2), ny = (y + 0.5 - cy) / (h / 2);
      return Math.hypot(nx, ny) < 0.9 + U.perlin(x / 6 + seed, y / 4, 3) * 0.22;
    };
    const mx = cx + w * rng.range(-0.15, 0.2), my = cy - h * 0.12;
    const Wt = GR.water;
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      if (!inside(x, y)) continue;
      let c;
      if (!inside(x, y - 1)) c = Wt[0];
      else if (!inside(x, y + 1)) c = Wt[4];
      else if (!inside(x, y - 2)) c = Wt[1];
      else {
        const dm = Math.hypot((x + 0.5 - mx) / 2.6, (y + 0.5 - my) / 1.4);
        if (dm < 1) c = dm < 0.55 ? Wt[6] : Wt[5];
        else if ((y * 7 + x * 3 + seed) % 23 === 0 && inside(x - 1, y) && inside(x + 1, y)) c = Wt[4];
        else c = Wt[(x + y) % 9 === 0 ? 3 : 2];
      }
      p.set(x, y, c);
    }
    return p.canvas();
  }

  function makeMound(seed, kind) {
    const rng = U.rng(seed);
    const w = 13, h = 21;
    const p = new Pix(w + 2, h + 2);
    const S = GR.soil, M = GR.moss;
    p.ell(w / 2 + 1, h / 2 + 1, w / 2, h / 2, (x, y, nx, ny) => {
      const l = shade(nx * 0.9, ny * 0.9);
      let v = 0.5 + l * 0.42 + (U.hash2(x, y, seed) - 0.5) * 0.25;
      let c = pick(S, v, x, y, 0.5);
      if (kind === 2 && U.perlin(x / 3, y / 3, seed) > -0.1) c = pick(M, v - 0.1, x, y, 0.5);
      else if (kind === 1 && U.hash2(x, y, seed + 1) < 0.18) c = pick(M, v - 0.05, x, y, 0.4);
      p.set(x, y, c);
    });
    for (let k = 0; k < 9; k++) {
      const x = rng.int(3, w - 2), y = rng.int(3, h - 3);
      if (p.al(x, y) && p.al(x, y + 1)) { p.set(x, y, S[5]); p.set(x, y + 1, S[1]); }
    }
    for (let y = p.h - 1; y >= 1; y--) for (let x = 0; x < p.w; x++) if (!p.al(x, y) && p.al(x, y - 1)) p.set(x, y, hx('#120d11'), 170);
    return p.canvas();
  }

  function makeOpenGrave(seed) {
    const rng = U.rng(seed);
    const p = new Pix(19, 25);
    const S = GR.soil;
    // dirt heap on the right
    p.ell(15, 13, 4, 10, (x, y, nx, ny) => p.set(x, y, pick(S, 0.55 + shade(nx, ny) * 0.4 + (U.hash2(x, y, seed) - 0.5) * 0.3, x, y, 0.5)));
    // rim + pit
    for (let y = 3; y <= 21; y++) for (let x = 1; x <= 11; x++) {
      const rim = y === 3 || y === 21 || x === 1 || x === 11;
      if (rim) p.set(x, y, S[4]);
      else if (y <= 6) p.set(x, y, S[Math.max(0, 3 - (y - 4))]);
      else if (x === 2) p.set(x, y, S[1]);
      else p.set(x, y, hx('#08070a'));
    }
    for (let k = 0; k < 7; k++) { const x = rng.int(12, 17), y = rng.int(4, 21); if (p.al(x, y)) p.set(x, y, S[5]); }
    for (let x = 1; x <= 18; x++) if (!p.al(x, 22) && p.al(x, 21)) p.set(x, 22, hx('#120d11'), 170);
    return p.canvas();
  }

  function makeSlab(seed) {
    const rng = U.rng(seed);
    const w = 14, h = 21;
    const tc = new TC(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let t = 0.5 + (U.hash2(x, y, seed) - 0.5) * 0.12;
      if (y === 0) t += 0.14; else if (x === 0) t += 0.08;
      if (y === h - 1) t -= 0.22; else if (x === w - 1) t -= 0.14;
      if (y === 1 || x === 1) t -= 0.05;
      tc.put(x, y, 1, t);
    }
    // engraved cross
    const cx = 7, cy = 7;
    for (let y = 3; y <= 15; y++) { tc.put(cx, y, 1, 0.08); tc.put(cx + 1, y, 1, 0.62); }
    for (let x = 4; x <= 10; x++) { tc.put(x, cy, 1, 0.08); tc.put(x, cy + 1, 1, 0.62); }
    tc.put(cx, cy, 1, 0.08);
    // text lines
    for (let x = 4; x <= 10; x++) if (rng.chance(0.75)) tc.put(x, 17, 1, 0.18);
    const p = tc.toPix([null, GR.flag], { left: 0, top: 0, right: 0, bottom: 0, dither: 0.3 });
    // moss in corners
    for (let k = 0; k < 16; k++) {
      const x = rng.chance(0.5) ? rng.int(0, 3) : rng.int(w - 4, w - 1), y = rng.chance(0.5) ? rng.int(0, 4) : rng.int(h - 5, h - 1);
      p.set(x, y, PAL.moss[rng.int(1, 3)]);
    }
    return p.canvas();
  }

  /* =========================================================================
     Ground chunk generator
     ========================================================================= */
  let TX = null;
  const C_GRIME = hx('#121318');
  function* genChunk(ctx, info) {
    const W = info.px, wx = info.wx, wy = info.wy;
    const step = 8;
    const g0x = wx - step, g0y = wy - step;
    const gw = Math.ceil((W + step) / step) + 2;
    const grid = new Float32Array(gw * gw * NF);
    const o = new Float32Array(NF);
    for (let gy = 0; gy < gw; gy++) {
      for (let gx = 0; gx < gw; gx++) { fields(g0x + gx * step, g0y + gy * step, o); grid.set(o, (gy * gw + gx) * NF); }
      if ((gy & 7) === 7) yield;
    }
    const soil = TX.soil.rgb, grass = TX.grass, moss = TX.moss, leaf = TX.leaf, cob = TX.cob, flag = TX.flag;
    const img = ctx.createImageData(W, W), d = img.data;
    let prevL = new Int8Array(W), curL = new Int8Array(W);
    const row = new Float32Array(gw * NF);
    for (let py = -1; py < W; py++) {
      const Y = wy + py;
      const gyf = (Y - g0y) / step, gy0 = gyf | 0, fy = gyf - gy0;
      const r0 = gy0 * gw * NF, r1 = r0 + gw * NF;
      for (let k = 0; k < gw * NF; k++) row[k] = grid[r0 + k] + (grid[r1 + k] - grid[r0 + k]) * fy;
      const ty = (Y & TM) << 8;
      for (let px = 0; px < W; px++) {
        const X = wx + px;
        const gxf = (X - g0x) / step, gx0 = gxf | 0, fx = gxf - gx0;
        const a = gx0 * NF, b = a + NF;
        const cg = row[a] + (row[b] - row[a]) * fx;
        const ms = row[a + 1] + (row[b + 1] - row[a + 1]) * fx;
        const cl = row[a + 2] + (row[b + 2] - row[a + 2]) * fx;
        const cp = row[a + 3] + (row[b + 3] - row[a + 3]) * fx;
        const cz = row[a + 4] + (row[b + 4] - row[a + 4]) * fx;
        const ti = ty | (X & TM), t3 = ti * 3;
        const dt = BY[((Y & 7) << 3) | (X & 7)];
        let r = soil[t3], g = soil[t3 + 1], bl = soil[t3 + 2], layer = 0;
        // grass / moss
        if (cg > 0.003) {
          const T = ms + (dt - 0.5) * 0.1 > 0.57 ? moss : grass;
          const th = T.thr[ti] * 0.003922;
          if (th < cg) {
            r = T.rgb[t3]; g = T.rgb[t3 + 1]; bl = T.rgb[t3 + 2]; layer = 1;
            if (cg - th < 0.035 && cg < 0.97) { r *= 0.72; g *= 0.72; bl *= 0.72; }
          }
        }
        // dead leaves
        if (cl > 0.003) {
          const t = leaf.thr[ti];
          if (t < 255) {
            if (t * 0.003922 < cl) { r = leaf.rgb[t3]; g = leaf.rgb[t3 + 1]; bl = leaf.rgb[t3 + 2]; layer = 2; }
          } else if (leaf.sh[ti] < 255 && leaf.sh[ti] * 0.003922 < cl) { r *= 0.72; g *= 0.72; bl *= 0.74; }
        }
        // flagstones (plazas) then cobbles (paths)
        if (cz > 0.003) {
          const t = flag.thr[ti];
          if (t < 255) {
            if (t * 0.003922 < cz * 1.04) { r = flag.rgb[t3]; g = flag.rgb[t3 + 1]; bl = flag.rgb[t3 + 2]; layer = 4; }
          } else if (cz > 0.72) { layer = 3; }
        }
        if (layer < 3 && cp > 0.003) {
          const t = cob.thr[ti];
          if (t < 255) {
            if (t * 0.003922 < cp * 1.04) { r = cob.rgb[t3]; g = cob.rgb[t3 + 1]; bl = cob.rgb[t3 + 2]; layer = 4; }
          } else if (cp > 0.72) { layer = 3; }
        }
        if (layer === 3) {
          const gm = row[a + 7] + (row[b + 7] - row[a + 7]) * fx;
          if (gm + (dt - 0.5) * 0.18 > 0.52) { r = moss.rgb[t3] * 0.8; g = moss.rgb[t3 + 1] * 0.8; bl = moss.rgb[t3 + 2] * 0.8; }
          else { r = soil[t3] * 0.55 + 4; g = soil[t3 + 1] * 0.55 + 4; bl = soil[t3 + 2] * 0.55 + 6; }
        }
        // cast shadows from the row above (3/4 depth)
        const pl = prevL[px];
        if (pl === 4 && layer < 4) { r *= 0.62; g *= 0.62; bl *= 0.66; }
        else if (pl === 1 && layer === 0) { r *= 0.8; g *= 0.8; bl *= 0.82; }
        curL[px] = layer;
        if (py >= 0) {
          const br = row[a + 5] + (row[b + 5] - row[a + 5]) * fx;
          const hu = (row[a + 6] + (row[b + 6] - row[a + 6]) * fx - 0.5) * 2;
          const oi = (py * W + px) * 4;
          d[oi] = r * br * (1 + 0.05 * hu);
          d[oi + 1] = g * br * (1 - 0.03 * hu);
          d[oi + 2] = bl * br * (1 + 0.06 * hu);
          d[oi + 3] = 255;
        }
      }
      const tmp = prevL; prevL = curL; curL = tmp;
      if ((py & 15) === 15) yield;
    }
    ctx.putImageData(img, 0, 0);
    yield* decals(ctx, info);
  }

  /* --- decals (seamless via G.scatter, drawn in world coords) --- */
  function px1(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
  const BARKS = PAL.bark.map((c) => cs(c));
  function drawRoot(ctx, x, y, rng, len, ang, th) {
    let px = x, py = y, a = ang;
    for (let i = 0; i < len; i++) {
      a += (rng.next() - 0.5) * 0.7;
      px += Math.cos(a); py += Math.sin(a) * 0.75;
      const ix = Math.round(px), iy = Math.round(py), t = i / len;
      px1(ctx, ix, iy, BARKS[3]);
      if (th > 1 && t < 0.55) { px1(ctx, ix, iy - 1, BARKS[4]); px1(ctx, ix, iy + 1, BARKS[1]); }
      else px1(ctx, ix, iy + 1, 'rgba(10,8,12,0.55)');
      if (th > 0 && rng.chance(0.07)) drawRoot(ctx, ix, iy, rng, Math.round(len * 0.4), a + rng.sign() * 0.9, th - 1);
    }
  }
  function drawCrack(ctx, x, y, rng, len) {
    let cx = x, cy = y, a = rng.range(0, TAU);
    for (let i = 0; i < len; i++) {
      a += (rng.next() - 0.5) * 1.1;
      cx += Math.cos(a); cy += Math.sin(a) * 0.8;
      const ix = Math.round(cx), iy = Math.round(cy);
      px1(ctx, ix, iy, 'rgba(14,14,20,0.85)');
      px1(ctx, ix, iy + 1, 'rgba(160,170,190,0.12)');
      if (rng.chance(0.08)) drawCrack(ctx, ix, iy, rng, Math.round(len * 0.35));
    }
  }
  const FLOWER = ['#5a4a6a', '#7a6a8a', '#4a2a3a', '#6a3a4a', '#8a8a9a'];
  function* decals(ctx, info) {
    // grave mounds / open graves under gravestones (same layout as the props)
    graveCells(info.wx - 40, info.wy - 40, info.wx + info.size + 40, info.wy + info.size + 40, (gv) => {
      if (gv.open) ctx.drawImage(DEC.openGrave[gv.v % 2], Math.round(gv.x) - 7, Math.round(gv.y) + 1);
      else if (gv.mound) ctx.drawImage(DEC.mound[gv.v % DEC.mound.length], Math.round(gv.x) - 7, Math.round(gv.y) - 1);
    });
    // roots around trees
    treeCells(info.wx - 80, info.wy - 80, info.wx + info.size + 80, info.wy + info.size + 80, (tr) => {
      const rng = U.rng(tr.seed + 5);
      const n = rng.int(3, 5);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI + rng.range(-0.3, 0.3) - (i % 2 ? 0 : Math.PI);
        drawRoot(ctx, Math.round(tr.x + Math.cos(a) * 3), Math.round(tr.y), rng, rng.int(10, 22), a, 2);
      }
    });
    yield;
    // puddles
    G.scatter(info, 170, 8101, 40, (x, y, rng) => {
      const f = fieldsAt(x, y);
      if (f[3] > 0.15 || f[4] > 0.15 || !rng.chance(0.3)) return;
      ctx.drawImage(DEC.puddle[rng.int(0, DEC.puddle.length - 1)], Math.round(x), Math.round(y));
    });
    // floor grave slabs on plazas
    G.scatter(info, 96, 8103, 26, (x, y, rng) => {
      const f = fieldsAt(x, y);
      if (f[4] < 0.95 || !rng.chance(0.4)) return;
      ctx.drawImage(DEC.slab[rng.int(0, 2)], Math.round(x), Math.round(y));
    });
    // cracks & creeping moss on paving
    G.scatter(info, 44, 8105, 30, (x, y, rng) => {
      const f = fieldsAt(x, y);
      if (Math.max(f[3], f[4]) < 0.75) return;
      if (rng.chance(0.45)) drawCrack(ctx, Math.round(x), Math.round(y), rng, rng.int(6, 16));
      else if (rng.chance(0.4)) {
        const r = rng.range(3, 7);
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
          const dd = Math.hypot(i, j * 1.3) / r;
          if (dd < 1 && U.dither(Math.round(x) + i, Math.round(y) + j) > dd * dd) {
            px1(ctx, Math.round(x) + i, Math.round(y) + j, cs(PAL.moss[dd < 0.4 ? 3 : dd < 0.75 ? 2 : 1]));
          }
        }
      }
    });
    yield;
    // bones & skulls
    G.scatter(info, 64, 8107, 12, (x, y, rng) => {
      const f = fieldsAt(x, y);
      if (f[4] > 0.5 || !rng.chance(0.12 + f[8] * 0.25)) return;
      const arr = rng.chance(0.35) ? DEC.skull : DEC.bone;
      ctx.drawImage(arr[rng.int(0, arr.length - 1)], Math.round(x), Math.round(y));
      if (rng.chance(0.4)) ctx.drawImage(DEC.bone[rng.int(0, 3)], Math.round(x) + rng.int(-9, 9), Math.round(y) + rng.int(3, 8));
    });
    // candle stubs
    G.scatter(info, 110, 8109, 10, (x, y, rng) => {
      const f = fieldsAt(x, y);
      if (!rng.chance(0.08 + f[8] * 0.25 + f[4] * 0.2)) return;
      ctx.drawImage(DEC.stub[rng.int(0, 2)], Math.round(x), Math.round(y));
    });
    yield;
    // dead flowers on grass
    G.scatter(info, 30, 8111, 8, (x, y, rng) => {
      const f = fieldsAt(x, y);
      if (f[0] < 0.6 || f[3] > 0.3 || f[4] > 0.3 || !rng.chance(0.35)) return;
      const n = rng.int(1, 3), col = FLOWER[rng.int(0, FLOWER.length - 1)];
      for (let i = 0; i < n; i++) {
        const fx = Math.round(x) + rng.int(-3, 3), fy = Math.round(y) + rng.int(-2, 2), h = rng.int(2, 4), droop = rng.sign();
        ctx.fillStyle = '#2a3020'; ctx.fillRect(fx, fy - h, 1, h);
        ctx.fillStyle = col; ctx.fillRect(fx + (droop > 0 ? 0 : -1), fy - h, 2, 1); ctx.fillRect(fx + droop, fy - h + 1, 1, 1);
        ctx.fillStyle = 'rgba(8,8,12,0.5)'; ctx.fillRect(fx + 1, fy, 1, 1);
      }
    });
    // pebbles & twigs
    G.scatter(info, 22, 8113, 8, (x, y, rng) => {
      if (!rng.chance(0.35)) return;
      const ix = Math.round(x), iy = Math.round(y);
      if (rng.chance(0.5)) {
        const t = rng.int(2, 4);
        ctx.fillStyle = cs(GR.cob[t]); ctx.fillRect(ix, iy, 2, 1);
        ctx.fillStyle = cs(GR.cob[t + 2]); ctx.fillRect(ix, iy, 1, 1);
        ctx.fillStyle = 'rgba(8,8,12,0.55)'; ctx.fillRect(ix, iy + 1, 2, 1);
      } else {
        const len = rng.int(3, 7), dy = rng.chance(0.5) ? 1 : 0;
        for (let i = 0; i < len; i++) px1(ctx, ix + i, iy + (i > len / 2 ? dy : 0), BARKS[3]);
        if (rng.chance(0.5)) px1(ctx, ix + 2, iy - 1, BARKS[3]);
      }
    });
    // single leaves blown around everywhere
    const LC = [GR.leafA, GR.leafB, GR.leafC, GR.leafD];
    G.scatter(info, 15, 8115, 4, (x, y, rng) => {
      if (!rng.chance(0.22)) return;
      const fam = LC[rng.int(0, 3)], ix = Math.round(x), iy = Math.round(y);
      ctx.fillStyle = cs(fam[2]); ctx.fillRect(ix, iy, 2, 1);
      ctx.fillStyle = cs(fam[1]); ctx.fillRect(ix + 1, iy + 1, rng.chance(0.5) ? 2 : 1, 1);
      ctx.fillStyle = cs(fam[3]); ctx.fillRect(ix, iy, 1, 1);
    });
  }

  /* =========================================================================
     Prop layout (shared by props + ground decals)
     ========================================================================= */
  const GCW = 46, GCH = 62;
  function graveAt(i, j) {
    const h = U.hashInt(i, j, 4401);
    const r1 = (h & 1023) / 1023, r2 = ((h >>> 10) & 1023) / 1023, r3 = ((h >>> 20) & 1023) / 1023;
    const x = (i + 0.5) * GCW + (r2 - 0.5) * 8, y = (j + 0.5) * GCH + (r3 - 0.5) * 6;
    if (G.nearSpawn(x, y, 90)) return null;
    const f = fieldsAt(x, y);
    if (f[3] > 0.2 || f[4] > 0.25) return null;
    const p = f[8] > 0.3 ? 0.18 + f[8] * 0.42 : 0.025;
    if (r1 > p) return null;
    const v = U.hashInt(i, j, 4402);
    const k = v % 100;
    let kind;
    if (k < 6 && f[8] > 0.4) kind = 'angel';
    else if (k < 16) kind = 'celtic';
    else kind = 'grave';
    return {
      x, y, kind, v: v >>> 8, open: kind === 'grave' && (v >>> 3) % 11 === 0,
      mound: kind !== 'angel' && (v >>> 5) % 3 !== 0, light: kind === 'grave' && (v >>> 7) % 6 === 0,
    };
  }
  function graveCells(x0, y0, x1, y1, fn) {
    for (let j = Math.floor(y0 / GCH); j <= Math.floor(y1 / GCH); j++) {
      for (let i = Math.floor(x0 / GCW); i <= Math.floor(x1 / GCW); i++) {
        const g = graveAt(i, j);
        if (g && g.x >= x0 && g.x < x1 && g.y >= y0 && g.y < y1) fn(g, i, j);
      }
    }
  }
  const TCELL = 168;
  function treeAt(i, j) {
    const rng = U.rng(U.hashInt(i, j, 5501));
    const x = (i + 0.15 + rng.next() * 0.7) * TCELL, y = (j + 0.15 + rng.next() * 0.7) * TCELL;
    if (G.nearSpawn(x, y, 110)) return null;
    const f = fieldsAt(x, y);
    if (f[3] > 0.1 || f[4] > 0.1) return null;
    const p = 0.25 + f[0] * 0.3 - f[8] * 0.1;
    if (rng.next() > p) return null;
    return { x, y, seed: U.hashInt(i, j, 5502) };
  }
  function treeCells(x0, y0, x1, y1, fn) {
    for (let j = Math.floor(y0 / TCELL); j <= Math.floor(y1 / TCELL); j++) {
      for (let i = Math.floor(x0 / TCELL); i <= Math.floor(x1 / TCELL); i++) {
        const t = treeAt(i, j);
        if (t && t.x >= x0 && t.x < x1 && t.y >= y0 && t.y < y1) fn(t);
      }
    }
  }

  /* =========================================================================
     Prop sprites
     ========================================================================= */
  const PROP = {};
  function propRec(pix, ax, ay, extra) {
    const sh = moonShadow(pix, ay);
    return Object.assign({ img: pix.canvas(), w: pix.w, h: pix.h, ax, ay, sh: sh.c, shy: sh.oy }, extra || {});
  }

  function stoneTC(W, H, shapeFn, opts) {
    // shapeFn(u, v) -> inside front face; u horizontal (0 = centre), v height above ground (0 = bottom row)
    const tc = new TC(W, H);
    const cx = opts.cx, base = opts.base, depth = opts.depth || 2, seed = opts.seed || 1;
    const front = (u, v) => shapeFn(u, v);
    // extrusion (side + top faces), drawn first
    for (let v = 0; v < H; v++) for (let u = -cx; u < W - cx; u++) {
      if (!front(u, v)) continue;
      for (let k = 1; k <= depth; k++) {
        const eu = u + k, ev = v + k;
        if (front(eu, ev)) continue;
        const top = front(eu, ev - 1);
        tc.put(cx + eu, base - ev, 1, top ? 0.74 : 0.2);
      }
    }
    let hmax = 0;
    for (let v = 0; v < H; v++) for (let u = -cx; u < W - cx; u++) if (front(u, v)) hmax = Math.max(hmax, v);
    for (let v = 0; v < H; v++) for (let u = -cx; u < W - cx; u++) {
      if (!front(u, v)) continue;
      const blot = U.perlin((cx + u) / 4, (base - v) / 4, seed) * 0.08;
      tc.put(cx + u, base - v, 1, 0.42 + 0.2 * (v / Math.max(1, hmax)) + blot + (U.hash2(u, v, seed) - 0.5) * 0.07);
    }
    return { tc, hmax };
  }
  function addMoss(tc, seed, amount, base) {
    const rng = U.rng(seed);
    for (let y = 0; y < tc.h; y++) for (let x = 0; x < tc.w; x++) {
      if (tc.id[y * tc.w + x] !== 1) continue;
      const fromBottom = base - y;
      const topEdge = !tc.idAt(x, y - 1) || !tc.idAt(x, y - 2);
      let p = fromBottom < 4 ? (4 - fromBottom) * 0.18 * amount : 0;
      if (topEdge) p += 0.35 * amount;
      p *= 0.6 + 0.8 * (U.perlin(x / 3, y / 3, seed) + 0.5);
      if (rng.next() < p) tc.put(x, y, 2, 0.35 + rng.next() * 0.45);
    }
  }
  function tiltPix(p, base, tilt) {
    if (!tilt) return p;
    const q = new Pix(p.w + 4, p.h);
    for (let y = 0; y < p.h; y++) {
      const s = Math.round((base - y) * tilt);
      for (let x = 0; x < p.w; x++) {
        if (!p.al(x, y)) continue;
        const o = (y * p.w + x) * 4;
        q.set(x + 2 + s, y, [p.d[o], p.d[o + 1], p.d[o + 2]], p.d[o + 3]);
      }
    }
    return q;
  }

  function makeGrave(kind, seed, tilt) {
    const W = 26, H = 30, cx = 11, base = 27;
    let shape;
    const rng = U.rng(seed);
    switch (kind) {
      case 'round': shape = (u, v) => Math.abs(u) <= 5 && (v < 9 || (u * u) / 30 + ((v - 9) / 4.2) ** 2 <= 1); break;
      case 'arch': shape = (u, v) => Math.abs(u) <= 5 && (v < 10 || Math.abs(u) <= 5.3 * (1 - ((v - 10) / 6.5) ** 1.6)); break;
      case 'cross': shape = (u, v) => (Math.abs(u) <= 1 && v < 18) || (Math.abs(u) <= 5 && v >= 11 && v <= 13) || (Math.abs(u) <= 3 && v < 2); break;
      case 'obelisk': shape = (u, v) => (v < 3 && Math.abs(u) <= 5) || (v >= 3 && v < 19 && Math.abs(u) <= 3 - Math.floor((v - 3) / 9)) || (v >= 19 && v < 23 && Math.abs(u) <= Math.max(0, 2 - (v - 19) * 0.6)); break;
      case 'broken': shape = (u, v) => Math.abs(u) <= 5 && v < 7 + Math.round(Math.sin(u * 1.7 + seed) * 1.5 + (u + 5) * 0.25); break;
      case 'wide': shape = (u, v) => Math.abs(u) <= 8 && (v < 7 || ((u + 4) ** 2) / 17 + ((v - 7) / 3.6) ** 2 <= 1 || ((u - 4) ** 2) / 17 + ((v - 7) / 3.6) ** 2 <= 1); break;
      default: shape = (u, v) => Math.abs(u) <= 4 && (v < 5 || (u * u) / 17 + ((v - 5) / 3) ** 2 <= 1);
    }
    const { tc, hmax } = stoneTC(W, H, shape, { cx, base, seed });
    // engraving
    if (kind === 'round' || kind === 'arch' || kind === 'wide') {
      const ev = hmax - 4;
      const ex = kind === 'wide' ? (rng.chance(0.5) ? -4 : 4) : 0;
      if (rng.chance(0.6)) {
        for (let v = ev - 5; v <= ev; v++) { tc.put(cx + ex, base - v, 1, 0.05); tc.put(cx + ex + 1, base - v, 1, 0.66); }
        for (let u = -2; u <= 2; u++) { tc.put(cx + ex + u, base - (ev - 1), 1, 0.05); tc.put(cx + ex + u + 1, base - (ev - 2), 1, 0.66); }
        tc.put(cx + ex, base - (ev - 1), 1, 0.05);
      } else {
        for (let l = 0; l < 3; l++) for (let u = -3; u <= 3; u++) if (rng.chance(0.7)) tc.put(cx + ex + u, base - (ev - l * 2), 1, 0.1);
      }
    }
    // crack
    if (rng.chance(0.4)) {
      let u = rng.int(-3, 3), v = hmax;
      for (let n = 0; n < 7; n++) { if (shape(u, v)) tc.put(cx + u, base - v, 1, 0.04); v--; if (rng.chance(0.4)) u += rng.sign(); }
    }
    addMoss(tc, seed + 3, 0.9, base);
    let p = tc.toPix([null, PAL.stone, PAL.moss]);
    p = tiltPix(p, base, tilt);
    p = p.outline(OUT);
    return { pix: p, ax: cx + 1 + (tilt ? 2 : 0), ay: base + 1 };
  }

  function makeCeltic(seed) {
    const W = 24, H = 38, cx = 10, base = 36;
    const ring = (u, v) => { const d = Math.hypot(u, v - 26); return d >= 4.2 && d <= 6.2; };
    const shape = (u, v) =>
      (v < 4 && Math.abs(u) <= 5 - (v >= 2 ? 1 : 0)) || (Math.abs(u) <= 2 && v < 33) || (Math.abs(u) <= 7 && v >= 24 && v <= 28) || ring(u, v);
    const { tc } = stoneTC(W, H, shape, { cx, base, seed });
    // knotwork hint on the shaft
    for (let v = 7; v < 22; v++) for (let u = -1; u <= 1; u++) if ((u + v * 2) % 4 === 0) tc.put(cx + u, base - v, 1, 0.3);
    for (let u = -5; u <= 5; u++) if (u % 2 === 0 && Math.abs(u) > 1) tc.put(cx + u, base - 26, 1, 0.3);
    addMoss(tc, seed + 3, 1.0, base);
    let p = tc.toPix([null, PAL.stone, PAL.moss]).outline(OUT);
    return { pix: p, ax: cx + 1, ay: base + 1 };
  }

  function makeTree(seed) {
    const rng = U.rng(seed);
    const W = 70, H = 92, bx = 34, base = 89;
    const tc = new TC(W, H);
    const stamp = (x, y, r, t) => {
      const ri = Math.ceil(r);
      for (let j = -ri; j <= ri; j++) for (let i = -ri; i <= ri; i++) {
        if (i * i + j * j <= r * r + 0.3) tc.put(x + i, y + j, 1, t + (U.hash2(Math.round(x + i), Math.round(y + j), seed) - 0.5) * 0.12);
      }
    };
    let nseg = 0;
    function branch(x, y, ang, len, th, depth) {
      let cx = x, cy = y, a = ang;
      const steps = Math.max(2, Math.round(len / 3));
      for (let i = 0; i < steps; i++) {
        a += (rng.next() - 0.5) * 0.55;
        a += (-Math.PI / 2 - a) * 0.08 * (depth === 0 ? 1 : 0.4);
        const nx = cx + (Math.cos(a) * len) / steps, ny = cy + (Math.sin(a) * len) / steps;
        const t0 = th * (1 - (0.45 * i) / steps);
        const n = Math.ceil(Math.hypot(nx - cx, ny - cy) * 2);
        for (let k = 0; k <= n; k++) {
          const px = cx + ((nx - cx) * k) / n, py = cy + ((ny - cy) * k) / n;
          if (t0 < 0.75) tc.put(px, py, 1, 0.45); else stamp(px, py, t0 * 0.75, 0.45);
        }
        nseg++;
        if (depth < 3 && i > 0 && rng.chance(depth === 0 ? 0.45 : 0.3) && nseg < 220) {
          branch(nx, ny, a + rng.sign() * (0.55 + rng.next() * 0.6), len * (0.4 + rng.next() * 0.25), th * 0.55, depth + 1);
        }
        cx = nx; cy = ny;
      }
      if (depth < 4 && nseg < 220) {
        branch(cx, cy, a - 0.35 - rng.next() * 0.35, len * 0.52, th * 0.62, depth + 1);
        if (rng.chance(0.8)) branch(cx, cy, a + 0.35 + rng.next() * 0.35, len * 0.5, th * 0.62, depth + 1);
      }
    }
    branch(bx, base, -Math.PI / 2 + (rng.next() - 0.5) * 0.25, 36 + rng.next() * 10, 3.6, 0);
    // flared roots
    for (let s = -1; s <= 1; s += 2) {
      for (let k = 0; k < 6; k++) stamp(bx + s * (2 + k), base - 1 + Math.floor(k / 3), Math.max(0.6, 1.8 - k * 0.3), 0.4);
    }
    // knot hole
    const ky = base - rng.int(14, 24);
    tc.put(bx, ky, 1, 0.0); tc.put(bx + 1, ky, 1, 0.0); tc.put(bx, ky + 1, 1, 0.05);
    let p = tc.toPix([null, PAL.bark], { left: 0.32, top: 0.12, right: 0.18, bottom: 0.05, dither: 0.3 });
    p = p.outline(OUT);
    return { pix: p, ax: bx + 1, ay: base + 1 };
  }

  function makeFence(n, seed) {
    const segW = 13, W = n * segW + 6, H = 22, base = 20;
    const tc = new TC(W, H);
    const rng = U.rng(seed);
    for (let s = 0; s < n; s++) {
      const x0 = s * segW + 5;
      // rails
      for (let x = x0; x < x0 + segW - 1; x++) { tc.put(x, base - 13, 1, 0.5); tc.put(x, base - 4, 1, 0.45); }
      // bars with spear tips
      for (let b = 0; b < 4; b++) {
        if (rng.chance(0.06)) continue;
        const x = x0 + 1 + b * 3;
        const top = base - 16 - (b % 2);
        for (let y = top; y <= base; y++) tc.put(x, y, 1, 0.5);
        tc.put(x, top - 1, 1, 0.7); tc.put(x - 1, top, 1, 0.55); tc.put(x + 1, top, 1, 0.4);
      }
    }
    // stone posts
    for (let s = 0; s <= n; s++) {
      const x0 = s * segW;
      for (let y = base - 18; y <= base; y++) for (let x = x0; x < x0 + 5; x++) tc.put(x, y, 2, 0.4 + (x === x0 ? 0.1 : 0) + (U.hash2(x, y, seed) - 0.5) * 0.08);
      for (let x = x0 - 1; x < x0 + 6; x++) tc.put(x, base - 19, 2, 0.62);
      for (let x = x0; x < x0 + 5; x++) tc.put(x, base - 20, 2, 0.7);
      tc.put(x0 + 2, base - 21, 2, 0.75);
    }
    const p = tc.toPix([null, PAL.iron, PAL.stone], { left: 0.25, top: 0.12, right: 0.12, bottom: 0.05 }).outline(OUT);
    return { pix: p, ax: Math.round(W / 2) + 1, ay: base + 1 };
  }

  function makePillar(seed) {
    const rng = U.rng(seed);
    const W = 22, H = 36, cx = 9, base = 34;
    const topH = rng.int(16, 26);
    const shape = (u, v) => (v < 4 && Math.abs(u) <= 6) || (v >= 4 && Math.abs(u) <= 4 && v < topH + Math.round(Math.sin(u * 1.9 + seed) * 2 + u * 0.4));
    const { tc } = stoneTC(W, H, shape, { cx, base, seed });
    for (let v = 5; v < topH + 3; v++) for (let u = -3; u <= 3; u += 2) if (shape(u, v)) tc.put(cx + u, base - v, 1, 0.3);
    addMoss(tc, seed + 9, 1.1, base);
    // rubble
    for (let k = 0; k < 4; k++) {
      const x = cx + rng.sign() * rng.int(7, 9), y = base - rng.int(0, 1);
      tc.put(x, y, 1, 0.5); tc.put(x + 1, y, 1, 0.4); if (rng.chance(0.5)) tc.put(x, y - 1, 1, 0.6);
    }
    const p = tc.toPix([null, PAL.stone, PAL.moss]).outline(OUT);
    return { pix: p, ax: cx + 1, ay: base + 1 };
  }

  function makeAngel(seed) {
    const W = 34, H = 50, cx = 16, base = 47;
    const tc = new TC(W, H);
    const rng = U.rng(seed);
    // pedestal
    for (let v = 0; v < 9; v++) for (let u = -8; u <= 8; u++) {
      let t = 0.45 + (U.hash2(u, v, seed) - 0.5) * 0.06;
      if (v >= 7) t = 0.68;
      if (v === 3) t = 0.3;
      tc.put(cx + u, base - v, 1, t);
    }
    for (let v = 1; v < 9; v++) { tc.put(cx + 9, base - v, 1, 0.2); tc.put(cx + 10, base - v - 1, 1, 0.18); }
    // wings (behind)
    const wing = (s) => {
      const pts = [[cx + s * 2, base - 33], [cx + s * 7, base - 42], [cx + s * 12, base - 40], [cx + s * 13, base - 32], [cx + s * 10, base - 22], [cx + s * 5, base - 13], [cx + s * 2, base - 20]];
      new Pix(1, 1);
      const pp = { set() {} };
      void pp;
      const tmp = new Pix(W, H);
      tmp.poly(pts, (x, y) => tc.put(x, y, 1, 0.48 + ((x + y * 2) % 5 === 0 ? -0.12 : 0) + (s > 0 ? -0.08 : 0.04)));
    };
    wing(-1); wing(1);
    // robe
    const robe = [[cx - 3, base - 30], [cx + 3, base - 30], [cx + 6, base - 9], [cx - 6, base - 9]];
    new Pix(W, H).poly(robe, (x, y) => tc.put(x, y, 1, 0.55 + ((x - cx) % 3 === 0 && y > base - 26 ? -0.14 : 0) - (x - cx) * 0.012));
    // head bowed, arms raised to the face
    new Pix(W, H).ell(cx - 1, base - 33, 2.8, 3, (x, y) => tc.put(x, y, 1, 0.62));
    for (let k = 0; k < 5; k++) { tc.put(cx - 3 + k * 0.5, base - 29 + k * 0.2, 1, 0.68); tc.put(cx + 1 + k * 0.4, base - 29 + k * 0.3, 1, 0.6); }
    tc.put(cx - 2, base - 33, 1, 0.75); tc.put(cx - 1, base - 33, 1, 0.75); tc.put(cx, base - 32, 1, 0.7);
    // hair cap
    for (let u = -3; u <= 1; u++) tc.put(cx + u, base - 36, 1, 0.38);
    addMoss(tc, seed + 1, 0.8, base);
    // weathering streaks
    for (let k = 0; k < 6; k++) {
      const x = cx + rng.int(-5, 5);
      for (let y = base - 28 + rng.int(0, 6); y < base - 10; y++) if (tc.idAt(x, y) === 1 && rng.chance(0.8)) tc.put(x, y, 1, tc.toneAt(x, y) - 0.12);
    }
    const p = tc.toPix([null, PAL.stone, PAL.moss], { left: 0.2, top: 0.12, right: 0.16, bottom: 0.08 }).outline(OUT);
    return { pix: p, ax: cx + 1, ay: base + 1 };
  }

  function makeCandles(seed) {
    const rng = U.rng(seed);
    const W = 16, H = 14, base = 12;
    const p = new Pix(W, H);
    const flames = [];
    const n = rng.int(3, 5);
    const W2 = PAL.wax;
    // little wax puddle
    for (let x = 2; x < 14; x++) if (rng.chance(0.8)) p.set(x, base, W2[1]);
    for (let k = 0; k < n; k++) {
      const x = 2 + Math.round((k / Math.max(1, n - 1)) * 10) + rng.int(-1, 0);
      const h = rng.int(3, 9), w = rng.chance(0.3) ? 3 : 2;
      for (let y = base - h; y < base; y++) for (let i = 0; i < w; i++) p.set(x + i, y, W2[i === 0 ? 3 : i === w - 1 ? 1 : 2]);
      if (rng.chance(0.6)) p.set(x + w, base - h + 2, W2[2]);
      p.set(x + (w > 2 ? 1 : 0), base - h - 1, hx('#2a2020'));
      flames.push({ x: x + (w > 2 ? 1 : 0), y: base - h - 1 });
    }
    const q = p.outline(OUT);
    flames.forEach((f) => { f.x += 1; f.y += 1; });
    return { pix: q, ax: 8, ay: base + 2, flames };
  }

  function buildProps() {
    const kinds = ['round', 'arch', 'cross', 'obelisk', 'broken', 'wide', 'small', 'round', 'arch'];
    PROP.grave = [];
    let s = 1;
    for (const k of kinds) {
      for (const tilt of [0, -0.09, 0.08]) {
        const g = makeGrave(k, s++ * 31, tilt);
        PROP.grave.push(propRec(g.pix, g.ax, g.ay));
      }
    }
    PROP.celtic = [0, 1].map((i) => { const g = makeCeltic(91 + i * 7); return propRec(g.pix, g.ax, g.ay); });
    PROP.tree = [0, 1, 2, 3].map((i) => { const g = makeTree(1201 + i * 77); return propRec(g.pix, g.ax, g.ay); });
    PROP.fence = [2, 3, 4].map((n) => { const g = makeFence(n, 33 + n); return propRec(g.pix, g.ax, g.ay); });
    PROP.pillar = [0, 1, 2].map((i) => { const g = makePillar(51 + i * 5); return propRec(g.pix, g.ax, g.ay); });
    PROP.angel = [0].map((i) => { const g = makeAngel(61 + i); return propRec(g.pix, g.ax, g.ay); });
    PROP.candles = [0, 1, 2, 3].map((i) => { const g = makeCandles(71 + i * 3); return propRec(g.pix, g.ax, g.ay, { flames: g.flames }); });
  }

  /* =========================================================================
     Characters
     ========================================================================= */
  const SPR = {};
  const FACE = [
    [-4, 0, 0], [4, 0, 0],
    [-4, 1, 1], [-3, 1, 0], [3, 1, 0], [4, 1, 1],
    [-4, 2, 1], [-3, 2, 2], [-2, 2, 1], [2, 2, 1], [3, 2, 2], [4, 2, 1],
    [0, 3, 1],
    [-4, 4, 0], [4, 4, 0],
    [-4, 5, 1], [-3, 5, 2], [-1, 5, 2], [0, 5, 2], [1, 5, 2], [3, 5, 2], [4, 5, 1],
    [-3, 6, 1], [-2, 6, 2], [-1, 6, 1], [1, 6, 1], [2, 6, 2], [3, 6, 1],
  ];
  const JW = 22, JH = 34;
  function makeJack(f) {
    const p = new Pix(JW, JH);
    const CL = PAL.cloak, PU = PAL.pumpkin, SC = PAL.scarf, PA = PAL.pants, BO = PAL.boot, ST = PAL.stem, GL = PAL.glove;
    const by = 2 + f.bob, cx = 10;
    const leg = (dx, lift, back) => {
      const lx = cx - 1 + dx;
      for (let y = 28; y <= 31 - lift; y++) { p.set(lx, y, PA[back ? 0 : 1]); p.set(lx + 1, y, PA[back ? 1 : 2]); }
      const fy = 32 - lift;
      p.set(lx, fy, BO[back ? 0 : 1]); p.set(lx + 1, fy, BO[back ? 1 : 2]); p.set(lx + 2, fy, BO[1]);
      p.set(lx, fy + 1, BO[0]); p.set(lx + 1, fy + 1, BO[1]); p.set(lx + 2, fy + 1, BO[1]); p.set(lx + 3, fy + 1, BO[0]);
    };
    leg(f.bDx, f.bLift, true);
    leg(f.aDx, f.aLift, false);
    // scarf tail (behind the cloak)
    const sy = by + 13;
    const tail = [[-8, 3], [-9, 2], [-8, 4], [-7, 5]][f.scarf];
    p.line(cx - 4, sy + 1, cx + tail[0], sy + 1 + tail[1], SC[2]);
    p.line(cx - 4, sy + 2, cx + tail[0], sy + 2 + tail[1], SC[1]);
    p.set(cx + tail[0], sy + 3 + tail[1], SC[3]);
    // cloak
    const top = by + 14, bot = by + 26;
    for (let y = top; y <= bot + 1; y++) {
      const t = (y - top) / (bot - top);
      const hw = 4.3 + t * 3.2;
      const sw = Math.round(f.sway * Math.max(0, t - 0.3) * 2.2);
      const x0 = Math.round(cx + 0.5 - hw) + sw, x1 = Math.round(cx + 0.5 + hw) - 1 + sw;
      for (let x = x0; x <= x1; x++) {
        if (y >= bot) {
          const k = (x * 7 + 3) % 5;
          if (y === bot && k === 0) continue;
          if (y === bot + 1 && k > 1) continue;
        }
        const u = (x - x0) / Math.max(1, x1 - x0);
        let c = CL[2];
        if (x === x0) c = y < top + 4 ? CL[4] : CL[3];
        else if (u < 0.22) c = CL[3];
        else if (u > 0.8) c = CL[1];
        const fold1 = cx - 2 + Math.round(sw * 0.6), fold2 = cx + 4 + sw;
        if (y > top + 4 && (x === fold1 || x === fold2)) c = CL[1];
        if (y > top + 3 && x === cx + 2 + Math.round(sw * 0.7)) c = CL[0];
        if (y === top) c = u < 0.5 ? CL[4] : CL[3];
        p.set(x, y, c);
      }
    }
    // hand
    p.set(cx + 4, by + 21, GL[2]); p.set(cx + 5, by + 21, GL[1]); p.set(cx + 4, by + 22, GL[1]); p.set(cx + 5, by + 22, GL[0]);
    // scarf
    for (let x = cx - 4; x <= cx + 5; x++) { p.set(x, sy, SC[3]); p.set(x, sy + 1, SC[2]); p.set(x, sy + 2, SC[1]); }
    p.set(cx + 4, sy + 3, SC[2]); p.set(cx + 5, sy + 3, SC[1]); p.set(cx + 4, sy + 4, SC[1]); p.set(cx + 3, sy + 3, SC[1]);
    // pumpkin head
    const hcx = 10.5, hcy = by + 7.2;
    p.ell(hcx, hcy, 7.6, 6.3, (x, y, nx, ny) => {
      let v = 0.47 + shade(nx, ny) * 0.42;
      const seg = Math.asin(clamp(nx, -1, 1)) / (Math.PI / 2);
      const sf = seg * 2.6 + 0.5, fr = sf - Math.floor(sf);
      if (fr < 0.13 || fr > 0.94) v -= 0.17; else if (fr > 0.42 && fr < 0.58) v += 0.05;
      if (ny > 0.74) v -= 0.12;
      p.set(x, y, pick(PU, v, x, y, 0.3));
    });
    // stem
    p.set(10, by - 0, ST[3]); p.set(10, by + 1, ST[2]); p.set(11, by + 1, ST[1]); p.set(11, by - 1, ST[2]); p.set(12, by - 1, ST[1]);
    // carved face
    const fc = 12, fy = by + 4;
    const faceSet = new Set(FACE.map((q) => q[0] + ',' + q[1]));
    for (const [dx, dy, lv] of FACE) {
      p.set(fc + dx, fy + dy, PAL.face[lv + 1]);
      if (!faceSet.has(dx + ',' + (dy + 1))) p.set(fc + dx, fy + dy + 1, PAL.flesh);
    }
    for (const [dx, dy, lv] of FACE) p.set(fc + dx, fy + dy, PAL.face[lv + 1]);
    return p.outline(OUT);
  }
  function makeJackFace(level) {
    const p = new Pix(JW + 2, JH + 2);
    const fc = 13, fy = 2 + 4 + 1;
    for (const [dx, dy, lv] of FACE) p.set(fc + dx, fy + dy, PAL.face[clamp(lv + level, 0, 3)]);
    return { r: p.canvas(), l: U.flipX(p.canvas()) };
  }

  function makeCreeper(fr, vari) {
    const W = 20, H = 26;
    const p = new Pix(W, H);
    const PU = vari ? PAL.tPurple2 : PAL.tPurple, CR = PAL.tCream, LF = PAL.tLeaf, WI = PAL.tWilt;
    const bob = [0, -1, 0, -1][fr], tilt = [0, 1, 0, -1][fr];
    const cx = 9.5 + tilt * 0.5, cy = 14 + bob;
    // root legs
    const legs = [[cx - 4, fr === 1 ? 1 : 0, fr === 1 ? 1 : 0], [cx + 2, fr === 3 ? 1 : 0, fr === 3 ? 1 : 0]];
    for (const [lx0, lift, fwd] of legs) {
      const lx = Math.round(lx0) + fwd;
      for (let y = 20; y <= 24 - lift; y++) { p.set(lx, y, CR[1]); p.set(lx + 1, y, CR[2]); }
      p.set(lx - 1, 25 - lift, CR[1]); p.set(lx, 25 - lift, CR[1]); p.set(lx + 1, 25 - lift, CR[0]); p.set(lx + 2, 25 - lift, CR[1]);
    }
    // leaves
    const sway = ([0, 7, 0, -7][fr] * Math.PI) / 180;
    const leaves = vari ? [[-92, 8.5], [-130, 7], [-52, 6.5], [-162, 4.5]] : [[-96, 9], [-137, 6.5], [-48, 7.5]];
    for (const [deg, len] of leaves) {
      const a = (deg * Math.PI) / 180 + sway;
      const ca = Math.cos(a), sa = Math.sin(a);
      const bx0 = cx + ca * 1.2, by0 = cy - 6 + sa * 0.6;
      const mx = bx0 + (ca * len) / 2, my = by0 + (sa * len) / 2;
      for (let y = Math.floor(my - len); y <= Math.ceil(my + len); y++) {
        for (let x = Math.floor(mx - len); x <= Math.ceil(mx + len); x++) {
          const dx = x + 0.5 - mx, dy = y + 0.5 - my;
          const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
          const t = (lx / (len / 2) + 1) / 2;
          const wdt = 1.9 * Math.sin(Math.PI * clamp(t, 0, 1) * 0.9 + 0.15);
          if (Math.abs(lx) > len / 2 || Math.abs(ly) > wdt) continue;
          let c = ly < -0.4 ? LF[3] : ly > 0.5 ? LF[1] : LF[2];
          if (Math.abs(ly) < 0.35 && t > 0.15) c = LF[1];
          if (t > 0.8) c = WI[ly < 0 ? 2 : 1];
          p.set(x, y, c);
        }
      }
      p.line(cx, cy - 6, bx0, by0, PU[1]);
    }
    // bulb
    p.ell(cx, cy, 7.4, 7, (x, y, nx, ny) => {
      const l = shade(nx, ny);
      const wave = 0.12 + 0.1 * Math.sin(nx * 5 + vari * 2);
      const tt = ny - wave;
      const purple = tt < -0.06 || (tt < 0.08 && dith(x, y) > (tt + 0.06) / 0.14);
      const v = 0.42 + l * 0.45;
      p.set(x, y, pick(purple ? PU : CR, purple ? v + 0.05 : v - 0.02, x, y, 0.3));
    });
    // veins
    const vr = U.rng(500 + vari);
    for (let k = 0; k < 4; k++) {
      let vx = cx + vr.range(-4, 4), vy = cy - 6 + vr.range(0, 1.5);
      const dir = vr.sign();
      for (let n = 0; n < 7; n++) {
        const ix = Math.round(vx), iy = Math.round(vy);
        const nx = (ix + 0.5 - cx) / 7.4, ny = (iy + 0.5 - cy) / 7;
        if (nx * nx + ny * ny < 0.86 && ny < 0.1) p.set(ix, iy, PU[1]);
        vy += 0.8; vx += dir * (vr.chance(0.5) ? 0.7 : 0);
      }
    }
    // taproot + root hairs
    p.set(Math.round(cx), Math.round(cy + 7), CR[2]); p.set(Math.round(cx), Math.round(cy + 8), CR[1]);
    p.set(Math.round(cx - 7), Math.round(cy + 3), CR[1]); p.set(Math.round(cx - 8), Math.round(cy + 4), CR[0]);
    p.set(Math.round(cx + 7), Math.round(cy + 2), CR[1]); p.set(Math.round(cx + 8), Math.round(cy + 3), CR[0]);
    // face
    const fx = Math.round(cx) + 1, ey = Math.round(cy) - 1;
    const DK = hx('#14061a');
    p.set(fx - 5, ey - 2, DK); p.set(fx - 4, ey - 1, DK); p.set(fx - 3, ey - 1, DK);
    p.set(fx + 3, ey - 2, DK); p.set(fx + 2, ey - 1, DK); p.set(fx + 1, ey - 1, DK);
    const eyes = [[fx - 4, ey, 1], [fx - 3, ey, 2], [fx + 1, ey, 2], [fx + 2, ey, 1], [fx - 3, ey + 1, 0], [fx + 1, ey + 1, 0]];
    for (const [x, y, l] of eyes) p.set(x, y, PAL.eyeG[l + 1]);
    for (let x = fx - 3; x <= fx + 2; x++) p.set(x, ey + 4, DK);
    for (let x = fx - 2; x <= fx + 1; x++) p.set(x, ey + 5, DK);
    p.set(fx - 2, ey + 4, CR[5]); p.set(fx + 1, ey + 4, CR[5]); p.set(fx - 4, ey + 3, DK); p.set(fx + 3, ey + 3, DK);
    const o = p.outline(OUT);
    return mk(o, 11, o.h - 1, eyes.filter((e) => e[2] > 0).map(([x, y, l]) => [x + 1, y + 1, cs(PAL.eyeG[l + 1])]), true);
  }

  function makeGhost(fr) {
    const W = 27, H = 28;
    const p = new Pix(W, H);
    const GH = PAL.ghost;
    const ph = (fr * Math.PI) / 2, reach = [0, 1, 2, 1][fr];
    const cx = 11;
    // back arm (behind)
    const armCol = (x, y, n) => GH[n < 3 ? 2 : 3];
    p.line(cx - 2, 11, cx + 6 + reach, 15, armCol);
    p.line(cx + 6 + reach, 15, cx + 9 + reach, 14, GH[2]);
    p.line(cx + 6 + reach, 15, cx + 9 + reach, 16, GH[2]);
    // tail
    for (let y = 14; y < H; y++) {
      const t = (y - 14) / (H - 15);
      const w = 3.6 * (1 - t) + 0.6;
      const xc = cx + 0.5 + Math.sin(t * 3.4 + ph) * 2.2 * t - t * 3;
      for (let x = Math.floor(xc - w - 1); x <= Math.ceil(xc + w); x++) {
        const dd = Math.abs(x + 0.5 - xc) / w;
        if (dd > 1) continue;
        const v = 0.62 - t * 0.3 + (1 - dd) * 0.12 - (x + 0.5 > xc ? 0.12 : 0);
        p.set(x, y, pick(GH, v, x, y, 0.4));
      }
    }
    // torso + ribcage
    p.ell(cx + 0.5, 12.5, 3.8, 4.2, (x, y, nx, ny) => p.set(x, y, pick(GH, 0.42 + shade(nx, ny) * 0.3, x, y, 0.3)));
    for (const ry of [10, 12, 14]) {
      for (let x = cx - 2; x <= cx + 3; x++) p.set(x, ry, GH[5]);
      p.set(cx - 3, ry + 1, GH[4]); p.set(cx + 4, ry + 1, GH[3]);
      for (let x = cx - 1; x <= cx + 2; x++) if (x !== cx) p.set(x, ry + 1, GH[1]);
    }
    for (let y = 9; y <= 16; y++) p.set(cx, y, GH[4]);
    // head (skull)
    p.ell(cx + 0.5, 5.2, 4.3, 4.6, (x, y, nx, ny) => p.set(x, y, pick(GH, 0.6 + shade(nx, ny) * 0.38, x, y, 0.3)));
    const fx = cx + 1;
    const SO = hx('#070a14');
    for (const [x, y] of [[fx - 3, 4], [fx - 2, 4], [fx - 3, 5], [fx - 2, 5], [fx + 1, 4], [fx + 2, 4], [fx + 1, 5], [fx + 2, 5]]) p.set(x, y, SO);
    // gaping mouth
    for (let y = 7; y <= 10; y++) { p.set(fx - 1, y, SO); p.set(fx, y, SO); }
    p.set(fx - 1, 11, GH[2]); p.set(fx, 11, GH[1]);
    // front arm reaching
    p.line(cx + 3, 10, cx + 8 + reach, 12, GH[4]);
    p.line(cx + 3, 11, cx + 8 + reach, 13, GH[2]);
    const hx0 = cx + 8 + reach, hy0 = 12;
    p.line(hx0, hy0, hx0 + 3, hy0 - 2, GH[5]);
    p.line(hx0, hy0, hx0 + 4, hy0, GH[4]);
    p.line(hx0, hy0 + 1, hx0 + 3, hy0 + 3, GH[4]);
    let o = p.outline(hx('#141a2e'));
    // dithered fade of the tail tip
    for (let y = 0; y < o.h; y++) {
      const t = (y - 21) / 8;
      if (t <= 0) continue;
      for (let x = 0; x < o.w; x++) if (dith(x, y) < t) o.del(x, y);
    }
    const eyes = [[fx - 2 + 1, 5 + 1, cs(PAL.eyeC[2])], [fx + 1 + 1, 5 + 1, cs(PAL.eyeC[2])], [fx - 3 + 1, 5 + 1, cs(PAL.eyeC[1])], [fx + 2 + 1, 5 + 1, cs(PAL.eyeC[1])]];
    return mk(o, 12, o.h - 1, eyes, true);
  }

  function makeColossus(fr) {
    const W = 46, H = 54;
    const p = new Pix(W, H);
    const KP = PAL.kPurple, KB = PAL.kBark, KS = PAL.kStalk;
    const bob = [0, 1, 0, 1][fr], swing = [0, 2, 0, -2][fr];
    const cx = 22.5, cy = 27 + bob;
    const lift = [[0, 0], [2, 0], [0, 0], [0, 2]][fr];
    // legs
    const leg = (x0, lf) => {
      for (let y = 40; y <= 52 - lf; y++) for (let x = x0; x < x0 + 6; x++) p.set(x, y, pick(KB, 0.45 + (x === x0 ? 0.18 : x === x0 + 5 ? -0.2 : 0) + (U.hash2(x, y, 3) - 0.5) * 0.15, x, y, 0.4));
      for (let x = x0 - 1; x < x0 + 8; x++) p.set(x, 53 - lf, KB[1]);
      p.set(x0 + 7, 52 - lf, KB[2]);
    };
    leg(Math.round(cx) - 10, lift[0]);
    leg(Math.round(cx) + 3, lift[1]);
    // crown stalks
    const sr = U.rng(77);
    for (let k = 0; k < 5; k++) {
      const bx0 = cx - 8 + k * 4, h = [7, 10, 13, 10, 7][k], lean = (k - 2) * 0.6;
      let x = bx0, y = cy - 14;
      for (let s = 0; s < h; s++) {
        x += lean * 0.3 + (sr.next() - 0.5) * 0.6; y -= 1;
        p.set(Math.round(x), Math.round(y), KS[2]); p.set(Math.round(x) + 1, Math.round(y), KS[1]);
        if (s === Math.floor(h * 0.6)) { p.set(Math.round(x) + Math.sign(lean || 1) * 2, Math.round(y) - 1, KS[2]); p.set(Math.round(x) + Math.sign(lean || 1), Math.round(y), KS[2]); }
      }
      p.set(Math.round(x), Math.round(y) - 1, PAL.tWilt[2]); p.set(Math.round(x) + 1, Math.round(y) - 1, PAL.tWilt[1]); p.set(Math.round(x) - 1, Math.round(y), PAL.tWilt[1]);
    }
    // arms (behind body edges)
    const arm = (s) => {
      const sx = cx + s * 13, sy = cy - 5, ex = cx + s * 17 + swing * s * -1, ey = cy + 15;
      const n = 22;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = sx + (ex - sx) * t + Math.sin(t * 5) * 1.2, y = sy + (ey - sy) * t, r = 2.6 - t * 1.2;
        for (let j = -3; j <= 3; j++) for (let k = -3; k <= 3; k++) {
          if (j * j + k * k > r * r) continue;
          const xx = Math.round(x + k), yy = Math.round(y + j);
          p.set(xx, yy, pick(KB, 0.42 + (k < 0 ? 0.15 : -0.12) + (U.hash2(xx, yy, 9) - 0.5) * 0.15, xx, yy, 0.3));
        }
      }
      for (const d of [-1, 0, 1]) p.line(ex, ey, ex + d * 3, ey + 5, KB[2]);
    };
    arm(-1); arm(1);
    // body
    const wo = {};
    p.ell(cx, cy, 15.5, 16, (x, y, nx, ny) => {
      const l = shade(nx, ny);
      const tt = ny - (-0.05 + 0.12 * Math.sin(nx * 4 + 1));
      const purple = tt < -0.06 || (tt < 0.06 && dith(x, y) > (tt + 0.06) / 0.12);
      let v = 0.42 + l * 0.42;
      U.worley(x / 5.5, y / 5.5, 41, 0, wo);
      const crack = wo.f2 - wo.f1 < 0.13;
      let c = pick(purple ? KP : KB, v, x, y, 0.35);
      if (crack) c = hx('#0e0810');
      if (purple && ny < -0.55 && U.perlin(x / 3, y / 3, 5) > 0.1) c = pick(PAL.moss, v + 0.1, x, y, 0.4);
      p.set(x, y, c);
    });
    // core
    const ccx = Math.round(cx) + 1, ccy = Math.round(cy) + 2;
    const coreP = [];
    for (let j = -5; j <= 5; j++) for (let i = -4; i <= 4; i++) {
      const dd = Math.abs(i) / 3.6 + Math.abs(j) / 4.8;
      if (dd > 1.25) continue;
      if (dd > 1) { p.set(ccx + i, ccy + j, hx('#0b0610')); continue; }
      const lv = dd < 0.3 ? 3 : dd < 0.6 ? 2 : 1;
      p.set(ccx + i, ccy + j, PAL.core[lv]);
      coreP.push([ccx + i + 1, ccy + j + 1, lv]);
    }
    // eyes + brow
    const fx = Math.round(cx) + 2, ey = Math.round(cy) - 8;
    for (let i = -7; i <= 7; i++) p.set(fx + i, ey - 1, KP[0]);
    p.set(fx - 7, ey - 2, KP[0]); p.set(fx + 7, ey - 2, KP[0]);
    const eyes = [];
    for (const [x, l] of [[fx - 6, 1], [fx - 5, 2], [fx - 4, 1], [fx + 3, 1], [fx + 4, 2], [fx + 5, 1]]) {
      p.set(x, ey, PAL.core[l + 1]); eyes.push([x + 1, ey + 1, cs(PAL.core[l + 1])]);
    }
    p.set(fx - 5, ey + 1, hx('#0b0610')); p.set(fx + 4, ey + 1, hx('#0b0610'));
    // grim mouth crack
    for (let i = -3; i <= 3; i++) p.set(fx + i - 1, ey + 5 + (i % 2 === 0 ? 0 : 1), hx('#0e0810'));
    const o = p.outline(OUT);
    const s = mk(o, 23, o.h - 1, eyes, true);
    s.core = coreP;
    return s;
  }

  /* =========================================================================
     Small sprites: seeds, lanterns, gems, souls, digits, misc
     ========================================================================= */
  function makeSeed(angle) {
    const p = new Pix(9, 9);
    const ca = Math.cos(angle), sa = Math.sin(angle);
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
      const dx = x + 0.5 - 4.5, dy = y + 0.5 - 4.5;
      const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      const b = 1.75 * (lx < 0 ? 1 : 1 - (lx / 3.3) * 0.6);
      if ((lx / 3.3) ** 2 + (ly / b) ** 2 > 1) continue;
      let v = 0.62 - dy * 0.12;
      if ((lx / 3.3) ** 2 + (ly / b) ** 2 > 0.55) v -= 0.22;
      p.set(x, y, pick(PAL.seed, v, x, y, 0));
    }
    return p.outline(hx('#2a1606')).canvas();
  }

  function makeLantern(fl) {
    const p = new Pix(13, 15);
    const PU = PAL.tPurple, CR = PAL.tCream, IR = PAL.iron;
    // handle
    p.set(4, 1, IR[3]); p.set(5, 0, IR[3]); p.set(6, 0, IR[4]); p.set(7, 0, IR[3]); p.set(8, 1, IR[2]);
    p.set(4, 2, IR[2]); p.set(8, 2, IR[2]);
    // leaf stub
    p.set(6, 2, PAL.tLeaf[3]); p.set(7, 2, PAL.tLeaf[2]); p.set(6, 3, PAL.tLeaf[2]);
    p.ell(6.5, 8.5, 5.4, 5.2, (x, y, nx, ny) => {
      const l = shade(nx, ny);
      const purple = ny < 0.05 + 0.1 * Math.sin(nx * 4);
      p.set(x, y, pick(purple ? PU : CR, 0.45 + l * 0.42, x, y, 0.3));
    });
    p.set(6, 14, CR[1]);
    const F = PAL.fire;
    const lv = [[2, 3, 4], [1, 3, 4], [1, 2, 3]][fl];
    // eyes
    p.set(4, 7, F[lv[1]]); p.set(3, 8, F[lv[0]]); p.set(4, 8, F[lv[2]]);
    p.set(8, 7, F[lv[1]]); p.set(8, 8, F[lv[2]]); p.set(9, 8, F[lv[0]]);
    // mouth
    for (let x = 4; x <= 9; x++) p.set(x, 11, F[x % 2 ? lv[2] : lv[1]]);
    p.set(3, 10, F[lv[0]]); p.set(10, 10, F[lv[0]]); p.set(5, 12, F[lv[1]]); p.set(8, 12, F[lv[1]]);
    return p.outline(OUT).canvas();
  }

  function makeGem(big, fr) {
    const rx = big ? 3.2 : 2.2, ry = big ? 4.6 : 3.2;
    const W = big ? 8 : 6, H = big ? 11 : 8;
    const p = new Pix(W, H);
    const cx = W / 2, cy = H / 2;
    const GM = PAL.gem;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (Math.abs(dx) / rx + Math.abs(dy) / ry > 1) continue;
      let lv = dx < 0 ? 3 : 2;
      if (dy > ry * 0.35) lv = dx < 0 ? 2 : 1;
      if (Math.abs(dx) / rx + Math.abs(dy) / ry > 0.78) lv -= 1;
      p.set(x, y, GM[clamp(lv, 0, 4)]);
    }
    // glint travels down the left facet
    const gy = Math.round(cy - ry * 0.55 + fr * (big ? 1.4 : 1));
    if (fr < 3) { p.set(Math.floor(cx) - 1, gy, GM[4]); if (big) p.set(Math.floor(cx) - 2, gy + 1, GM[4]); }
    else p.set(Math.floor(cx) - 1, Math.round(cy - ry * 0.4), GM[4]);
    return p.outline(hx('#061c24')).canvas();
  }

  function makeSoul(fr) {
    const p = new Pix(7, 12);
    const S = PAL.soul;
    p.ell(3.5, 3.5, 2.6, 2.8, (x, y, nx, ny) => p.set(x, y, S[nx * nx + ny * ny < 0.35 ? 3 : 2]));
    for (let y = 6; y < 12; y++) {
      const t = (y - 6) / 6;
      const xc = 3.5 + Math.sin(t * 4 + fr * 2.1) * 1.4 * t;
      const w = 1.8 * (1 - t) + 0.3;
      for (let x = 0; x < 7; x++) if (Math.abs(x + 0.5 - xc) <= w && dith(x, y) > t * 0.7) p.set(x, y, S[t < 0.4 ? 2 : 1]);
    }
    p.set(2, 3, S[0]); p.set(4, 3, S[0]);
    return p.canvas();
  }

  const GLYPH = {
    0: ['.#.', '#.#', '#.#', '#.#', '.#.'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
    3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
    6: ['.##', '#..', '##.', '#.#', '.#.'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['.#.', '#.#', '.#.', '#.#', '.#.'],
    9: ['.#.', '#.#', '.##', '..#', '##.'],
  };
  function makeDigit(d, crit) {
    const g = GLYPH[d], sc = crit ? 2 : 1;
    const p = new Pix(3 * sc, 5 * sc);
    const top = crit ? hx('#ffc070') : hx('#ffffff'), mid = crit ? hx('#ff5a1e') : hx('#f2eef8'), bot = crit ? hx('#b81e0e') : hx('#b4b4c8');
    for (let y = 0; y < 5 * sc; y++) for (let x = 0; x < 3 * sc; x++) {
      if (g[Math.floor(y / sc)][Math.floor(x / sc)] !== '#') continue;
      p.set(x, y, y < sc ? top : y >= 4 * sc ? bot : mid);
    }
    return p.outline(crit ? hx('#2a0606') : hx('#0c0a12'), true).canvas();
  }

  function shadowEll(rx, ry, a) {
    const p = new Pix(Math.ceil(rx * 2), Math.ceil(ry * 2));
    p.ell(p.w / 2, p.h / 2, rx, ry, (x, y, nx, ny) => { if (nx * nx + ny * ny < 0.55 || dith(x, y) > 0.5) p.set(x, y, [6, 6, 14], a); });
    return p.canvas();
  }
  function makeMist() {
    const p = new Pix(14, 7);
    p.ell(7, 3.5, 7, 3.5, (x, y, nx, ny) => { const dd = nx * nx + ny * ny; if (dd < 0.4 || dith(x, y) > dd) p.set(x, y, [190, 205, 230], dd < 0.4 ? 150 : 90); });
    return p.canvas();
  }
  function makeDirt(w) {
    const p = new Pix(w, 6);
    const S = GR.soil;
    p.ell(w / 2, 4, w / 2, 3, (x, y, nx, ny) => p.set(x, y, pick(S, 0.55 + shade(nx, ny) * 0.4 + (U.hash2(x, y, w) - 0.5) * 0.3, x, y, 0.5)));
    for (let x = 0; x < w; x++) if (p.al(x, 3) && U.hash2(x, 1, 7) < 0.3) p.set(x, 2, S[4]);
    return p.outline(OUT).canvas();
  }
  function makeRing(r) {
    const s = Math.ceil(r) * 2 + 3;
    const p = new Pix(s, s);
    const c = s / 2;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const d = Math.hypot((x + 0.5 - c), (y + 0.5 - c) * 1.25);
      if (Math.abs(d - r) < 0.7) p.set(x, y, [255, 230, 170]);
    }
    return p.canvas();
  }

  /* light sprites: banded radial falloff with dithered band edges */
  function makeLight(rx, ry, inner, outer, maxA, bands, pw) {
    const w = Math.ceil(rx) * 2, h = Math.ceil(ry) * 2;
    const p = new Pix(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dd = Math.hypot((x + 0.5 - w / 2) / rx, (y + 0.5 - h / 2) / ry);
      if (dd >= 1) continue;
      const f = Math.pow(1 - dd, pw);
      let q = Math.floor(f * bands + (dith(x, y) - 0.5) * 0.55 + 0.35) / bands;
      q = clamp(q, 0, 1);
      if (q <= 0) continue;
      p.set(x, y, U.mix(outer, inner, q), Math.round(q * maxA * 255));
    }
    return p.canvas();
  }

  function fogTexture(seed, alphaMax, colr) {
    const N = 256;
    const p = new Pix(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let s = 0, a = 1, n = 0;
      for (let o = 0; o < 4; o++) {
        const f = 1 << o;
        s += a * U.perlin((x / 64) * f, (y / 32) * f, seed + o * 31, 4 * f, 8 * f);
        n += a; a *= 0.5;
      }
      const v = U.smoothstep(0.08, 0.5, s / n);
      const q = Math.floor(v * 3 + (dith(x, y) - 0.5) * 0.9) / 3;
      if (q > 0) p.set(x, y, colr, Math.round(q * alphaMax * 255));
    }
    return p.canvas();
  }
  function cloudTexture(seed) {
    const N = 256;
    const p = new Pix(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v = U.smoothstep(0.42, 0.68, U.fbmTile(x / 64, y / 64, 4, seed, 3));
      const q = Math.floor(v * 3 + (dith(x, y) - 0.5) * 0.8) / 3;
      if (q > 0) p.set(x, y, [22, 26, 38], Math.round(q * 255));
    }
    return p.canvas();
  }

  /* =========================================================================
     Icons (16x16 pixel art, scaled up crisp)
     ========================================================================= */
  const ICON = {};
  function iconPix(id) {
    const p = new Pix(14, 14);
    const S = PAL.seed, F = PAL.fire;
    const seedAt = (cx, cy, ang, rx, ry) => {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
        const b = ry * (lx < 0 ? 1 : 1 - (lx / rx) * 0.6);
        const e = (lx / rx) ** 2 + (ly / b) ** 2;
        if (e > 1) continue;
        p.set(x, y, S[e > 0.6 ? 1 : ly < -b * 0.3 ? 4 : ly < b * 0.2 ? 3 : 2]);
      }
    };
    switch (id) {
      case 'hp-heart': {
        const R = RA(['#4a0610', '#7a0c1c', '#b8142a', '#e2403a', '#ffc4b4']);
        for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
          const u = (x + 0.5 - 7) / 6.2, v = (y + 0.5 - 6) / 6.2;
          const inside = Math.pow(u * u + v * v - 0.35, 3) - u * u * Math.pow(-v + 0.1, 3) * 1.2 < 0 && y > 1;
          if (!inside) continue;
          let lv = 2;
          if (u + v * 0.6 > 0.25) lv = 1;
          if (u + v > 0.75) lv = 0;
          if (u < -0.1 && v < -0.1) lv = 3;
          p.set(x, y, R[lv]);
        }
        p.set(3, 3, R[4]); p.set(4, 3, R[4]); p.set(3, 4, R[4]);
        // thorn band
        for (let x = 1; x < 13; x++) { const y = 7 + Math.round(Math.sin(x * 1.3)); if (p.al(x, y)) p.set(x, y, hx('#2a1a14')); }
        break;
      }
      case 'kills': {
        const B = PAL.bone;
        p.ell(7, 5.5, 5.6, 5.2, (x, y, nx, ny) => p.set(x, y, B[nx < -0.3 && ny < -0.2 ? 4 : nx > 0.45 ? 2 : 3]));
        for (let x = 4; x <= 9; x++) for (let y = 9; y <= 12; y++) p.set(x, y, B[y === 12 ? 2 : 3]);
        const E = PAL.eyeG;
        for (const [x, y] of [[4, 5], [5, 5], [4, 6], [5, 6], [8, 5], [9, 5], [8, 6], [9, 6]]) p.set(x, y, hx('#0a080c'));
        p.set(5, 6, E[2]); p.set(8, 6, E[2]);
        p.set(6, 8, hx('#0a080c')); p.set(7, 8, hx('#0a080c'));
        for (let x = 5; x <= 8; x++) p.set(x, 11, x % 2 ? hx('#3a3830') : B[3]);
        break;
      }
      case 'dmg': {
        seedAt(7, 7, -Math.PI / 4, 6, 3.2);
        p.line(4, 9, 9, 4, PAL.seed[4]);
        p.set(11, 1, hx('#ffffff')); p.set(12, 2, F[3]); p.set(10, 2, F[3]); p.set(11, 3, F[3]); p.set(11, 0, F[3]);
        p.set(2, 12, hx('#c8201a')); p.set(3, 11, hx('#ff5a1e'));
        break;
      }
      case 'rate': {
        seedAt(10, 4, -0.35, 3.4, 1.8);
        seedAt(9, 8.5, -0.35, 3.4, 1.8);
        seedAt(8, 12.5, -0.35, 3.0, 1.6);
        for (const [x, y, l] of [[1, 5, 4], [3, 5, 6], [0, 9, 3], [2, 9, 5], [1, 13, 4]]) p.line(x, y, l, y, F[2]);
        break;
      }
      case 'multi': {
        const L = RA(['#2a1610', '#4a2a1a', '#6e4428', '#946038', '#b88050']);
        p.ell(7, 9, 5.6, 4.6, (x, y, nx, ny) => p.set(x, y, pick(L, 0.45 + shade(nx, ny) * 0.45, x, y, 0.3)));
        for (let x = 4; x <= 9; x++) p.set(x, 4, L[2]);
        p.set(5, 3, L[3]); p.set(8, 3, L[1]);
        p.line(3, 5, 10, 5, hx('#c8a050'));
        seedAt(3, 2, -1.2, 2.2, 1.2); seedAt(11, 2.5, 0.9, 2.2, 1.2); seedAt(7, 1.5, -1.57, 2, 1.1);
        break;
      }
      case 'bounce': {
        for (let i = 0; i < 9; i++) { const t = i / 8; const x = 1 + t * 11, y = 12 - Math.sin(t * Math.PI) * 10; if (i % 2 === 0) p.set(x, y, F[2]); }
        seedAt(11, 9, 0.9, 3, 1.7);
        p.set(2, 12, F[4]); p.set(1, 13, F[3]); p.set(3, 13, F[3]); p.set(2, 11, F[3]); p.set(0, 12, F[3]); p.set(4, 12, F[3]);
        break;
      }
      case 'lantern': {
        const PU = PAL.tPurple, CR = PAL.tCream;
        p.ell(7, 8, 5.6, 5.2, (x, y, nx, ny) => p.set(x, y, pick(ny < 0.1 ? PU : CR, 0.45 + shade(nx, ny) * 0.4, x, y, 0.3)));
        p.set(7, 2, PAL.tLeaf[3]); p.set(6, 1, PAL.tLeaf[2]); p.set(8, 1, PAL.tLeaf[3]); p.set(9, 0, PAL.tLeaf[2]);
        for (const [x, y, l] of [[4, 6, 2], [4, 7, 4], [5, 7, 3], [9, 6, 2], [9, 7, 4], [8, 7, 3], [4, 10, 2], [5, 10, 4], [6, 10, 3], [7, 10, 4], [8, 10, 3], [9, 10, 2], [6, 11, 3]]) p.set(x, y, F[l]);
        break;
      }
      case 'speed': {
        const GLS = RA(['#2a4a6a', '#5a8ab0', '#9cc8e8', '#dff4ff', '#ffffff']);
        const pts = [[1, 11], [3, 8], [6, 9], [9, 6], [11, 4], [13, 5], [13, 8], [10, 11], [5, 12], [2, 12]];
        p.poly(pts, (x, y) => p.set(x, y, GLS[y < 8 ? 3 : x < 6 ? 2 : 1]));
        p.line(11, 5, 12, 8, GLS[4]);
        p.line(3, 9, 6, 10, GLS[4]);
        p.set(12, 11, GLS[1]); p.set(12, 12, GLS[1]); p.set(11, 12, GLS[0]);
        p.set(2, 3, GLS[4]); p.set(1, 3, GLS[3]); p.set(3, 3, GLS[3]); p.set(2, 2, GLS[3]); p.set(2, 4, GLS[3]);
        p.set(7, 1, GLS[4]); p.set(6, 1, GLS[2]); p.set(7, 0, GLS[2]);
        break;
      }
      case 'magnet': {
        const L = RA(['#2a1810', '#4e3018', '#74502a', '#9a7040', '#c09858']);
        for (let y = 7; y <= 13; y++) for (let x = 1 + (y > 11 ? 1 : 0); x <= 12 - (y > 11 ? 1 : 0); x++) p.set(x, y, L[(x + y) % 3 === 0 ? 1 : (x + (y >> 1)) % 2 ? 3 : 2]);
        for (let x = 1; x <= 12; x++) p.set(x, 7, L[4]);
        p.line(2, 7, 4, 2, L[3]); p.line(4, 2, 9, 2, L[3]); p.line(9, 2, 11, 7, L[2]);
        const GM = PAL.gem;
        for (const [x, y] of [[4, 5], [7, 4], [9, 5], [6, 6]]) { p.set(x, y, GM[3]); p.set(x, y + 1, GM[2]); }
        p.set(7, 4, GM[4]);
        break;
      }
      case 'hp': {
        const IR = PAL.iron;
        p.ell(7, 8.5, 6, 4.8, (x, y, nx, ny) => { if (ny > -0.35) p.set(x, y, pick(IR, 0.5 + shade(nx, ny) * 0.5, x, y, 0.3)); });
        for (let x = 2; x <= 12; x++) { p.set(x, 6, hx('#6a2a5a')); p.set(x, 7, x % 3 === 0 ? hx('#e07a26') : hx('#8a3a7a')); }
        p.set(4, 6, hx('#c8b070')); p.set(9, 6, hx('#c8b070')); p.set(7, 6, hx('#e07a26'));
        p.set(1, 7, IR[3]); p.set(13, 7, IR[2]); p.set(4, 13, IR[1]); p.set(10, 13, IR[1]);
        for (const [x, y] of [[5, 4], [5, 3], [6, 2], [8, 4], [9, 3], [8, 2], [8, 1]]) p.set(x, y, hx('#c8d4e8'));
        break;
      }
      default:
        p.ell(7, 7, 5, 5, (x, y) => p.set(x, y, PAL.fire[2]));
    }
    return p.outline(OUT, false);
  }

  /* =========================================================================
     Runtime state
     ========================================================================= */
  let LM = null; // light map {w,h,c,ctx,base}
  const AMB = [104, 124, 178];
  const ENT_A = 0.55;
  let LS = {}; // light sprites
  let GL = {}; // bloom glows
  let FOG = null, FOG2 = null, CLOUD = null;
  const BLOOM = [];
  const EMI = [];
  const EYES = [];
  const propsByChunk = new Map();
  const vis = new WeakMap();
  let lastEmberRT = 0;

  function ensureLM(view) {
    if (LM && LM.w === view.W && LM.h === view.H) return LM;
    const { c, ctx } = U.canvas(view.W, view.H);
    ctx.imageSmoothingEnabled = false;
    const b = new Pix(view.W, view.H);
    const cx = view.W / 2, cy = view.H / 2 - 6;
    for (let y = 0; y < view.H; y++) for (let x = 0; x < view.W; x++) {
      const dx = (x + 0.5 - cx) / (view.W * 0.6), dy = (y + 0.5 - cy) / (view.H * 0.62);
      const dd = Math.hypot(dx, dy);
      let v = U.smoothstep(0.5, 1.12, dd);
      v = Math.floor(v * 5 + (dith(x, y) - 0.5) * 0.8) / 5;
      const f = 1 - clamp(v, 0, 1) * 0.5;
      b.set(x, y, [AMB[0] * f, AMB[1] * f, AMB[2] * f]);
    }
    LM = { w: view.W, h: view.H, c, ctx, base: b.canvas() };
    return LM;
  }

  const flick = (t, s) => 0.86 + 0.09 * U.perlin(t * 7.3, s * 17.1, 3) + 0.05 * Math.sin(t * 23 + s * 40);

  function lightAt(lc, spr, x, y, a) {
    lc.globalAlpha = a > 1 ? 1 : a;
    lc.drawImage(spr, Math.round(x - spr.width / 2), Math.round(y - spr.height / 2));
  }
  function bloom(spr, x, y, a) { BLOOM.push(spr, x, y, a); }

  function buildLight(view, game) {
    const L = ensureLM(view);
    const lc = L.ctx;
    const S = view.S, ox = view.x0, oy = view.y0, rt = view.rt;
    lc.globalCompositeOperation = 'copy';
    lc.globalAlpha = 1;
    lc.drawImage(L.base, 0, 0);
    // drifting moonlight through clouds
    lc.globalCompositeOperation = 'lighter';
    const T = 512, cxo = rt * 7, cyo = rt * 3;
    const sx0 = Math.floor((ox - cxo) / T) * T + cxo, sy0 = Math.floor((oy - cyo) / T) * T + cyo;
    lc.globalAlpha = 1;
    for (let y = sy0; y < view.y1; y += T) for (let x = sx0; x < view.x1; x += T) lc.drawImage(CLOUD, Math.round((x - ox) * S), Math.round((y - oy) * S), T * S, T * S);
    lc.globalCompositeOperation = 'source-over';
    const p = game.player;
    const sx = (wx) => (wx - ox) * S, sy = (wy) => (wy - oy) * S;
    // candles & grave lights on props
    const cs0 = Math.floor((view.x0 - 64) / 256), cs1 = Math.floor((view.x1 + 64) / 256);
    const cr0 = Math.floor((view.y0 - 64) / 256), cr1 = Math.floor((view.y1 + 96) / 256);
    for (let cy = cr0; cy <= cr1; cy++) for (let cx = cs0; cx <= cs1; cx++) {
      const arr = propsByChunk.get(cx + ',' + cy);
      if (!arr) continue;
      for (const pr of arr) {
        if (!pr.lit) continue;
        if (pr.x < view.x0 - 40 || pr.x > view.x1 + 40 || pr.y < view.y0 - 30 || pr.y > view.y1 + 40) continue;
        const fl = flick(rt, pr.seed);
        if (pr.t === 'candles') {
          lightAt(lc, LS.candle, sx(pr.x), sy(pr.y - 8), fl);
          bloom(GL.warmS, pr.x, pr.y - 9, 0.7 * fl);
        } else {
          lightAt(lc, LS.grave, sx(pr.lx), sy(pr.ly - 3), fl * 0.9);
          bloom(GL.redS, pr.lx, pr.ly - 4, 0.6 * fl);
        }
      }
    }
    // gems
    for (const g of game.gems) {
      if (g.x < view.x0 - 20 || g.x > view.x1 + 20 || g.y < view.y0 - 20 || g.y > view.y1 + 20) continue;
      lightAt(lc, g.big ? LS.gemB : LS.gem, sx(g.x), sy(g.y - 3), 0.9);
    }
    // enemies: spectral ghosts glow faintly, colossus cores, hit flashes
    for (const e of game.enemies) {
      if (e.x < view.x0 - 30 || e.x > view.x1 + 30 || e.y < view.y0 - 10 || e.y > view.y1 + 60) continue;
      if (e.dying) {
        if (e.deathT < 0.4) lightAt(lc, e.type === 'colossus' ? LS.flashB : LS.flash, sx(e.x), sy(e.y - e.r), 1 - e.deathT * 2);
        continue;
      }
      if (e.type === 'ghost') lightAt(lc, LS.ghost, sx(e.x), sy(e.y - 14), 0.55 * e.spawnT);
      else if (e.type === 'colossus') {
        const pulse = 0.75 + 0.25 * Math.sin(rt * 4 + e.seed * 9);
        lightAt(lc, LS.core, sx(e.x), sy(e.y - 22), pulse);
        bloom(GL.green, e.x, e.y - 24, 0.5 * pulse);
      }
      if (e.flash > 0.45) lightAt(lc, e.type === 'colossus' ? LS.flashB : LS.flash, sx(e.x), sy(e.y - e.r), e.flash * 0.9);
    }
    // souls
    for (const pt of game.particles) {
      if (pt.kind !== 'soul') continue;
      const a = clamp(pt.life / pt.max, 0, 1);
      lightAt(lc, LS.soul, sx(pt.x), sy(pt.y - pt.z), a);
    }
    // projectiles
    for (const pr of game.projectiles) {
      lightAt(lc, LS.proj, sx(pr.x), sy(pr.y), 0.85);
      bloom(GL.warmT, pr.x, pr.y, 0.5);
    }
    // lanterns
    for (const o of game.orbitals) {
      const fl = flick(rt, o.seed + 3);
      lightAt(lc, LS.lantern, sx(o.x), sy(o.y - 6), fl);
      bloom(GL.warmM, o.x, o.y - 12, 0.55 * fl);
    }
    // Jack
    const fl = flick(rt, 0.37);
    const lvl = p.levelT > 0 ? 1 + p.levelT * 0.3 : 1;
    lc.globalAlpha = clamp(fl + 0.1, 0, 1);
    const jw = LS.jack.width * lvl * (0.985 + fl * 0.02), jh = LS.jack.height * lvl * (0.985 + fl * 0.02);
    lc.drawImage(LS.jack, Math.round(sx(p.x) - jw / 2), Math.round(sy(p.y - 12) - jh / 2), Math.round(jw), Math.round(jh));
    bloom(GL.warmM, p.x, p.y - 21, 0.42 * fl);
    if (p.hurtT > 0) lightAt(lc, LS.hurt, sx(p.x), sy(p.y - 12), p.hurtT * 0.8);
    lc.globalAlpha = 1;
  }

  function applyLight(ctx, alpha) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = alpha;
    ctx.drawImage(LM.c, 0, 0);
    ctx.restore();
  }

  function drawFogLayer(ctx, view, tex, sc, ox, oy, alpha) {
    const T = tex.width * sc;
    const x0 = Math.floor((view.x0 - ox) / T) * T + ox, y0 = Math.floor((view.y0 - oy) / T) * T + oy;
    ctx.globalAlpha = alpha;
    for (let y = y0; y < view.y1; y += T) for (let x = x0; x < view.x1; x += T) ctx.drawImage(tex, Math.round(x), Math.round(y), T, T);
    ctx.globalAlpha = 1;
  }

  /* =========================================================================
     Particles helpers
     ========================================================================= */
  const EMISSIVE = { ember: 1, spark: 1, soul: 1, frost: 1, glint: 1, ring: 1 };
  function ember(game, x, y, z, n, spread) {
    for (let i = 0; i < n; i++) {
      game.addParticle({
        x: x + (Math.random() - 0.5) * (spread || 4), y: y + (Math.random() - 0.5) * 2, z: z,
        vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 4, vz: 14 + Math.random() * 16,
        grav: -0.001, drag: 1.2, life: 0.6 + Math.random() * 0.7, size: 1, kind: 'ember',
      });
    }
  }
  function sparks(game, x, y, z, n, speed, cols) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = speed * (0.5 + Math.random() * 0.8);
      game.addParticle({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, vz: 0, drag: 6, life: 0.16 + Math.random() * 0.14, size: 1, kind: 'spark', color: cols[(Math.random() * cols.length) | 0] });
    }
  }
  function splash(game, x, y, z, n, cols, speed) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = (speed || 45) * (0.4 + Math.random() * 0.8);
      game.addParticle({
        x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 60, grav: 260, drag: 1.4,
        life: 0.9 + Math.random() * 0.8, size: Math.random() < 0.3 ? 2 : 1, kind: 'juice', color: cols[(Math.random() * cols.length) | 0],
      });
    }
  }
  function chunks(game, x, y, z, n, cols, speed) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = (speed || 60) * (0.4 + Math.random() * 0.8);
      game.addParticle({
        x, y, z: z * (0.5 + Math.random()), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 70, grav: 300, drag: 1.6,
        life: 0.6 + Math.random() * 0.6, size: Math.random() < 0.35 ? 3 : 2, kind: 'chunk', color: cols[(Math.random() * cols.length) | 0],
      });
    }
  }
  function soul(game, x, y, z, big) {
    game.addParticle({ x, y, z, vx: (Math.random() - 0.5) * 6, vy: 0, vz: 20 + Math.random() * 8, grav: -0.001, drag: 0.5, life: big ? 1.6 : 1.1, size: big ? 2 : 1, kind: 'soul' });
  }
  const CH_COL = {
    creeper: [cs(PAL.tPurple[3]), cs(PAL.tPurple[4]), cs(PAL.tPurple[2]), cs(PAL.tCream[3]), cs(PAL.tCream[4]), cs(PAL.tLeaf[3])],
    ghost: [cs(PAL.ghost[4]), cs(PAL.ghost[5]), cs(PAL.ghost[3])],
    colossus: [cs(PAL.kBark[3]), cs(PAL.kBark[4]), cs(PAL.kPurple[3]), cs(PAL.kPurple[4]), cs(PAL.kStalk[2])],
  };
  const JUICE = PAL.juice.map((c) => cs(c));
  const FROST = ['#dffaff', '#a8e8ff', '#ffffff'];

  /* =========================================================================
     HUD: iron frames, blackletter + pixel numbers, tarot-like level-up cards
     (ornaments are tiny pixel sprites turned into data URLs at load time)
     ========================================================================= */
  function pixURL(rows, pal, rot) {
    let r = rows.map((l) => l.split(''));
    for (let k = 0; k < (rot || 0); k++) {
      const n = r.length, m = r[0].length, o = [];
      for (let y = 0; y < m; y++) { o.push([]); for (let x = 0; x < n; x++) o[y].push(r[n - 1 - x][y]); }
      r = o;
    }
    const c = document.createElement('canvas');
    c.width = r[0].length; c.height = r.length;
    const g = c.getContext('2d');
    r.forEach((l, y) => l.forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
    return 'url("' + c.toDataURL() + '")';
  }
  const ORN = [
    'xxxxxxxxxx',
    'xhhhhhhhGx',
    'xhGGGGGGxx',
    'xhGxxxxxx.',
    'xhGx......',
    'xhGx..xx..',
    'xhGx.xhGx.',
    'xhGx.xGGx.',
    'xGxx..xx..',
    'xxx.......',
  ];
  const ORN_PAL = { x: '#07070b', G: '#a8874c', h: '#f0d89a' };
  const CROSS = ['..x..', '.xhx.', 'xhGhx', '.xGx.', '.xGx.', '.xGx.', '..x..'];
  function gothicCSS() {
    const B = 'body.style-gothic';
    const o = [0, 1, 2, 3].map((k) => pixURL(ORN, ORN_PAL, k));
    const cross = pixURL(CROSS, ORN_PAL);
    const BL = "'UnifrakturMaguntia', 'Pirata One', serif";
    const PX = "'Silkscreen', monospace";
    const PI = "'Pirata One', serif";
    const FE = "'IM Fell English', Georgia, serif";
    const frame = (c1, c2) =>
      `border: 2px solid ${c1}; outline: 2px solid #06070b; box-shadow: inset 0 0 0 2px #06070b, inset 0 2px 0 2px ${c2}, 0 4px 0 2px rgba(0,0,0,.45);`;
    return `
${B} { font-family: ${FE}; }
${B} #hud { padding: 12px 20px; }
${B} #hud .xp { height: 14px; border-radius: 0; background: #0b0c13; ${frame('#4d5266', '#1a1c28')} overflow: hidden; }
${B} #hud .xp-fill { background: linear-gradient(#c8fff0 0 2px, #5fd8bc 2px 6px, #2a9688 6px 9px, #17565a 9px); }
${B} #hud .xp::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 30px, rgba(6,7,11,.75) 30px 32px); }
${B} #hud .lvl { z-index: 2; font: 400 10px/1 ${PX}; color: #e6eef8; text-shadow: 1px 1px 0 #000, -1px 0 0 #000, 0 -1px 0 #000; letter-spacing: 1px; }
${B} #hud .topline { margin-top: 14px; }
${B} #hud .hp { gap: 10px; }
${B} #hud .hp-icon, ${B} #hud .kills-icon { width: 32px; height: 32px; image-rendering: pixelated; filter: drop-shadow(2px 2px 0 #000); }
${B} #hud .hp-bar { width: 236px; height: 18px; border-radius: 0; background: #16070b; ${frame('#6a5f6e', '#2a0e14')} }
${B} #hud .hp-fill { background: linear-gradient(#ffb0a0 0 2px, #d8343c 2px 8px, #9a1822 8px 12px, #5c0c14 12px); }
${B} #hud .hp-bar::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 24px, rgba(6,7,11,.7) 24px 26px); }
${B} #hud .hp-text { font: 400 13px/1 ${PX}; color: #eadfc8; text-shadow: 2px 2px 0 #000; }
${B} #hud .clock { position: relative; padding: 4px 32px 6px; margin-top: 2px; background: linear-gradient(#141624, #090a10); ${frame('#4d5266', '#232638')}
  clip-path: polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%); }
${B} #hud .clock::before, ${B} #hud .clock::after { content: ''; position: absolute; top: 50%; width: 15px; height: 21px; margin-top: -10px;
  background: ${cross} 0 0/100% 100% no-repeat; image-rendering: pixelated; }
${B} #hud .clock::before { left: 9px; } ${B} #hud .clock::after { right: 9px; }
${B} #hud .clock-time { font: 400 28px/1.1 ${PX}; color: #e8eefa; letter-spacing: 2px; text-shadow: 3px 3px 0 #000, 0 0 12px rgba(150,180,255,.35); }
${B} #hud .clock-label { font: 400 17px/1 ${BL}; text-transform: none; letter-spacing: .5px; opacity: 1; color: #f0a850; text-shadow: 2px 2px 0 #000, 0 0 8px rgba(255,140,40,.4); }
${B} #hud .kills { gap: 8px; font: 400 20px/1 ${PX}; color: #eadfc8; text-shadow: 2px 2px 0 #000; }
${B} #stylebar { border-radius: 0; background: rgba(9,10,16,.92); border: 2px solid #3d4152; outline: 2px solid #06070b; padding: 6px 18px; gap: 14px; font-family: ${FE}; }
${B} #stylebar .style-family { font: 400 9px/1 ${PX}; color: #8c93a8; letter-spacing: 1px; opacity: 1; }
${B} #stylebar .style-name { font: 400 20px/1 ${BL}; color: #f0a850; text-shadow: 2px 2px 0 #000; }
${B} #stylebar .style-hint { font-style: italic; color: #a8afc2; }
${B} #stylemenu { border-radius: 0; background: rgba(9,10,16,.96); border: 2px solid #3d4152; }
${B} #levelup { gap: 18px; background: radial-gradient(ellipse at 50% 50%, rgba(14,10,26,.55) 0, rgba(4,4,9,.9) 75%); }
${B} #levelup .lu-title { font-size: 0; text-shadow: none; }
${B} #levelup .lu-title::after { content: 'Ziehe dein Schicksal'; font: 400 62px/1 ${BL}; color: #f4e6c4; letter-spacing: 1px;
  text-shadow: 4px 4px 0 #000, 0 0 22px rgba(255,140,40,.45); }
${B} #levelup .lu-cards { gap: 26px; }
${B} #levelup .card { width: 206px; min-height: 300px; padding: 38px 18px 22px; gap: 8px; border-radius: 0; image-rendering: pixelated;
  border: 3px solid #a8874c; outline: 3px solid #06070b;
  box-shadow: inset 0 0 0 3px #0b0a10, inset 0 0 0 5px #5a4628, 0 14px 30px rgba(0,0,0,.75);
  background: ${o[0]} left 8px top 8px/40px 40px no-repeat, ${o[1]} right 8px top 8px/40px 40px no-repeat,
    ${o[2]} right 8px bottom 8px/40px 40px no-repeat, ${o[3]} left 8px bottom 8px/40px 40px no-repeat,
    radial-gradient(ellipse at 50% 32%, #2e2848 0, #18152a 45%, #0b0a12 100%);
  transition: transform .14s, box-shadow .14s, border-color .14s; }
${B} #levelup .card:hover { transform: translateY(-8px); border-color: #f0c070;
  box-shadow: inset 0 0 0 3px #0b0a10, inset 0 0 0 5px #8a6a38, 0 0 26px rgba(255,150,50,.4), 0 18px 34px rgba(0,0,0,.8); }
${B} #levelup .card-icon { width: 104px; height: 122px; padding: 20px 4px 6px; box-sizing: border-box; image-rendering: pixelated;
  border: 2px solid #5a4628; border-radius: 52px 52px 0 0 / 64px 64px 0 0; box-shadow: 0 0 0 2px #06070b;
  background: radial-gradient(ellipse at 50% 62%, rgba(255,150,60,.32) 0, rgba(60,40,90,.25) 55%, rgba(6,6,10,.6) 100%); }
${B} #levelup .card-name { margin-top: 6px; font: 400 25px/1.05 ${PI}; color: #f4e6c4; letter-spacing: .5px; text-shadow: 2px 2px 0 #000; }
${B} #levelup .card-name::after { content: ''; display: block; height: 2px; margin: 9px auto 0; width: 120px;
  background: linear-gradient(90deg, transparent, #a8874c 30%, #f0d89a 50%, #a8874c 70%, transparent); }
${B} #levelup .card-desc { font: italic 400 16px/1.25 ${FE}; color: #c2bad4; opacity: 1; }
${B} #levelup .card-key { left: 0; right: 0; top: 12px; text-align: center; font-size: 0; opacity: 1; }
${B} #levelup .card-key::after { font: 400 20px/1 ${PI}; color: #c8a868; text-shadow: 2px 2px 0 #000; letter-spacing: 2px; }
${B} #levelup .card:nth-child(1) .card-key::after { content: 'I'; }
${B} #levelup .card:nth-child(2) .card-key::after { content: 'II'; }
${B} #levelup .card:nth-child(3) .card-key::after { content: 'III'; }
${B} #levelup .card:nth-child(4) .card-key::after { content: 'IV'; }
${B} #levelup .lu-hint { font: italic 400 16px/1 ${FE}; color: #a8afc2; opacity: 1; text-shadow: 1px 1px 0 #000; }
${B} #gameover { background: radial-gradient(ellipse at 50% 50%, rgba(30,4,8,.6), rgba(3,2,5,.92) 75%); }
${B} #gameover .go-title { font: 400 76px/1 ${BL}; color: #d8343c; text-shadow: 4px 4px 0 #000, 0 0 26px rgba(200,30,40,.5); }
${B} #gameover .go-stats { font: italic 400 20px/1.3 ${FE}; color: #e6dcc4; }
${B} #gameover .go-hint { font: 400 12px/1 ${PX}; color: #8c93a8; letter-spacing: 1px; }
${B} #pausebox { font: 400 60px/1 ${BL}; color: #f4e6c4; text-shadow: 4px 4px 0 #000; }
${B}.hurt #hud .hp-bar { filter: brightness(1.7) saturate(1.3); }
`;
  }

  /* =========================================================================
     The style
     ========================================================================= */
  Styles.register({
    id: 'gothic',
    name: 'Gothic Nacht',
    family: 'Pixel Art · Dark',
    description: 'Mondbeschienener Friedhof voller Nebel – nur Jacks Kürbisgesicht, Laternen und Kerzen spenden warmes Licht.',
    pixelArt: { scale: 1 },
    groundColor: '#12151e',
    chunkSize: 256,
    fonts: ['UnifrakturMaguntia', 'Pirata+One', 'Silkscreen', 'IM+Fell+English:ital@0;1'],

    init() {
      TX = {
        soil: texSoil(),
        grass: texGrass(GR.grass, 21, 5200),
        moss: texMoss(31),
        leaf: texLeaves(41),
        cob: texCobble(51),
        flag: texFlags(61),
      };
      buildDecals();
      buildProps();
      // Jack
      const frames = [
        { aDx: 2, aLift: 0, bDx: -2, bLift: 0, bob: 0, sway: -1, scarf: 0 },
        { aDx: 0, aLift: 0, bDx: 0, bLift: 1, bob: -1, sway: 0, scarf: 1 },
        { aDx: -2, aLift: 0, bDx: 2, bLift: 0, bob: 0, sway: 1, scarf: 2 },
        { aDx: 0, aLift: 1, bDx: 0, bLift: 0, bob: -1, sway: 0, scarf: 3 },
        { aDx: 1, aLift: 0, bDx: -1, bLift: 0, bob: 0, sway: 0, scarf: 3 },
        { aDx: 1, aLift: 0, bDx: -1, bLift: 0, bob: 1, sway: 0, scarf: 2 },
      ];
      SPR.jack = frames.map((f) => {
        const s = mk(makeJack(f), 11, JH + 1, [], true);
        s.bob = f.bob;
        s.silR = U.tint(s.r, '#3a1c5a'); s.silL = U.flipX(s.silR);
        s.warmR = U.tint(s.r, '#ff7a1a'); s.warmL = U.flipX(s.warmR);
        return s;
      });
      SPR.jackFace = [makeJackFace(-1), makeJackFace(0), makeJackFace(1)];
      SPR.creeper = [0, 1].map((v) => [0, 1, 2, 3].map((f) => makeCreeper(f, v)));
      SPR.ghost = [0, 1, 2, 3].map((f) => makeGhost(f));
      SPR.colossus = [0, 1, 2, 3].map((f) => makeColossus(f));
      SPR.seed = [];
      for (let i = 0; i < 16; i++) SPR.seed.push(makeSeed((i / 16) * TAU));
      SPR.lantern = [0, 1, 2].map((f) => makeLantern(f));
      SPR.gem = [0, 1, 2, 3].map((f) => makeGem(false, f));
      SPR.gemB = [0, 1, 2, 3].map((f) => makeGem(true, f));
      SPR.soul = [0, 1, 2].map((f) => makeSoul(f));
      SPR.digit = [];
      SPR.digitC = [];
      for (let d = 0; d < 10; d++) { SPR.digit.push(makeDigit(d, false)); SPR.digitC.push(makeDigit(d, true)); }
      SPR.shadow = { s: shadowEll(6, 2, 120), m: shadowEll(8, 2.5, 120), l: shadowEll(15, 4, 120), g: shadowEll(4, 1.5, 70) };
      SPR.mist = makeMist();
      SPR.dirtS = makeDirt(14);
      SPR.dirtL = makeDirt(28);
      SPR.ring = [];
      for (let r = 4; r <= 40; r += 3) SPR.ring.push(makeRing(r));
      // lights
      LS = {
        jack: makeLight(96, 78, [255, 214, 160], [255, 140, 60], 1, 7, 0.85),
        lantern: makeLight(42, 34, [255, 206, 140], [255, 120, 40], 0.85, 5, 0.9),
        candle: makeLight(34, 26, [255, 200, 120], [255, 110, 40], 0.8, 5, 1),
        grave: makeLight(20, 15, [255, 150, 110], [220, 50, 40], 0.8, 4, 1),
        proj: makeLight(14, 11, [255, 214, 150], [255, 140, 60], 0.7, 3, 1),
        gem: makeLight(10, 8, [200, 255, 240], [80, 230, 210], 0.85, 3, 1),
        gemB: makeLight(22, 18, [200, 255, 240], [80, 230, 210], 0.85, 4, 1),
        ghost: makeLight(16, 13, [200, 225, 255], [140, 180, 255], 0.5, 3, 1),
        core: makeLight(36, 29, [190, 255, 160], [80, 210, 80], 0.75, 4, 1),
        flash: makeLight(15, 13, [255, 255, 255], [220, 230, 255], 0.9, 3, 1),
        flashB: makeLight(28, 24, [255, 255, 255], [220, 230, 255], 0.9, 4, 1),
        soul: makeLight(14, 14, [190, 255, 235], [90, 230, 200], 0.6, 3, 1),
        hurt: makeLight(60, 50, [255, 120, 100], [200, 30, 30], 0.6, 4, 1),
      };
      GL = {
        warmM: makeLight(11, 10, [255, 170, 70], [255, 120, 30], 0.32, 4, 1),
        warmS: makeLight(6, 6, [255, 170, 70], [255, 120, 30], 0.35, 3, 1),
        warmT: makeLight(5, 5, [255, 170, 70], [255, 120, 30], 0.35, 3, 1),
        redS: makeLight(6, 5, [255, 110, 70], [255, 50, 30], 0.35, 3, 1),
        green: makeLight(12, 12, [140, 255, 110], [60, 200, 60], 0.35, 4, 1),
        cyan: makeLight(5, 5, [120, 255, 230], [60, 220, 200], 0.3, 3, 1),
      };
      FOG = fogTexture(707, 0.2, [196, 208, 232]);
      FOG2 = fogTexture(909, 0.12, [210, 220, 240]);
      CLOUD = cloudTexture(313);
      for (const id of ['hp-heart', 'kills', 'dmg', 'rate', 'multi', 'bounce', 'lantern', 'speed', 'magnet', 'hp']) ICON[id] = iconPix(id).canvas();
    },

    *renderGroundChunk(ctx, info) {
      yield* genChunk(ctx, info);
    },

    propsForChunk(info) {
      const props = [];
      const x0 = info.wx, y0 = info.wy, x1 = x0 + info.size, y1 = y0 + info.size;
      graveCells(x0, y0, x1, y1, (g) => {
        if (g.kind === 'angel') { props.push({ x: g.x, y: g.y, t: 'angel', s: PROP.angel[0], pad: 70, seed: g.v }); return; }
        if (g.kind === 'celtic') { props.push({ x: g.x, y: g.y, t: 'celtic', s: PROP.celtic[g.v % 2], pad: 60, seed: g.v }); return; }
        const s = PROP.grave[g.v % PROP.grave.length];
        const pr = { x: g.x, y: g.y, t: 'grave', s, seed: (g.v % 997) / 997 };
        if (g.light) { pr.lit = true; pr.lx = g.x + 6; pr.ly = g.y + 4; }
        props.push(pr);
      });
      treeCells(x0, y0, x1, y1, (tr) => props.push({ x: tr.x, y: tr.y, t: 'tree', s: PROP.tree[tr.seed % 4], pad: 110, seed: tr.seed }));
      // fences, pillars, candles
      G.scatterOwned(info, 150, 6601, (x, y, rng) => {
        if (G.nearSpawn(x, y, 100)) return;
        const f = fieldsAt(x, y);
        const r = rng.next();
        if (f[4] > 0.6) {
          if (r < 0.5) props.push({ x, y, t: 'pillar', s: PROP.pillar[rng.int(0, 2)], pad: 60, seed: rng.next() });
          else if (r < 0.75) props.push({ x, y, t: 'candles', s: PROP.candles[rng.int(0, 3)], lit: true, seed: rng.next() });
        } else if (f[3] > 0.3) {
          if (r < 0.3) props.push({ x, y, t: 'candles', s: PROP.candles[rng.int(0, 3)], lit: true, seed: rng.next() });
        } else if (f[8] > 0.4) {
          if (r < 0.32) props.push({ x, y, t: 'fence', s: PROP.fence[rng.int(0, 2)], pad: 70, seed: rng.next() });
          else if (r < 0.48) props.push({ x, y, t: 'candles', s: PROP.candles[rng.int(0, 3)], lit: true, seed: rng.next() });
        } else if (r < 0.06) props.push({ x, y, t: 'candles', s: PROP.candles[rng.int(0, 3)], lit: true, seed: rng.next() });
      });
      propsByChunk.set(info.cx + ',' + info.cy, props);
      if (propsByChunk.size > 260) {
        const k = propsByChunk.keys().next().value;
        propsByChunk.delete(k);
      }
      return props;
    },

    drawProp(ctx, pr, view) {
      const s = pr.s;
      const dx = Math.round(pr.x) - s.ax, dy = Math.round(pr.y) - s.ay;
      ctx.drawImage(s.img, dx, dy);
      const rt = view.rt;
      if (pr.t === 'candles') {
        for (let i = 0; i < s.flames.length; i++) {
          const f = s.flames[i];
          const k = Math.floor(rt * 9 + i * 1.7 + pr.seed * 10) % 3;
          const fx = dx + f.x, fy = dy + f.y;
          ctx.fillStyle = '#ff8a1c'; ctx.fillRect(fx, fy - 1, 1, 2);
          ctx.fillStyle = '#fff2b8'; ctx.fillRect(fx, fy - 1, 1, 1);
          if (k === 0) { ctx.fillStyle = '#ffc848'; ctx.fillRect(fx, fy - 2, 1, 1); }
          else if (k === 1) { ctx.fillStyle = '#ff8a1c'; ctx.fillRect(fx + (i % 2 ? 1 : -1), fy - 2, 1, 1); }
        }
      } else if (pr.lit) {
        // Grablicht: red glass grave light
        const gx = Math.round(pr.lx), gy = Math.round(pr.ly);
        const k = Math.floor(rt * 8 + pr.seed * 20) % 3;
        ctx.fillStyle = '#0b0910'; ctx.fillRect(gx - 2, gy - 7, 5, 8);
        ctx.fillStyle = '#3a3a44'; ctx.fillRect(gx - 1, gy - 6, 3, 1);
        ctx.fillStyle = '#8a1a1a'; ctx.fillRect(gx - 1, gy - 5, 3, 5);
        ctx.fillStyle = k === 0 ? '#ff8a5a' : '#ff6a4a'; ctx.fillRect(gx - 1, gy - 4, 2, 3);
        ctx.fillStyle = '#ffe0a0'; ctx.fillRect(gx, gy - 3 - (k === 2 ? 1 : 0), 1, 1);
      }
    },

    drawShadow(ctx, o, view) {
      if (o.kind === 'prop') {
        const s = o.s;
        ctx.globalAlpha = 0.42;
        ctx.drawImage(s.sh, Math.round(o.x) - s.ax, Math.round(o.y) - s.ay + s.shy);
        ctx.globalAlpha = 1;
        return;
      }
      if (o.kind === 'enemy') {
        if (o.dying && o.deathT > 0.4) return;
        const sh = o.type === 'colossus' ? SPR.shadow.l : o.type === 'ghost' ? SPR.shadow.g : SPR.shadow.s;
        ctx.globalAlpha = o.type === 'ghost' ? 0.6 * o.spawnT : 1;
        ctx.drawImage(sh, Math.round(o.x - sh.width / 2) + 1, Math.round(o.y - sh.height / 2));
        ctx.globalAlpha = 1;
        return;
      }
      const sh = SPR.shadow.m;
      ctx.drawImage(sh, Math.round(o.x - sh.width / 2) + 1, Math.round(o.y - sh.height / 2));
    },

    drawGroundOverlay(ctx, view, game) {
      BLOOM.length = 0; EMI.length = 0; EYES.length = 0;
      const rt = view.rt;
      // low ground mist, drifting
      drawFogLayer(ctx, view, FOG, 2, rt * 5, rt * 1.5, 1);
      drawFogLayer(ctx, view, FOG2, 1, -rt * 7 + 90, rt * 2 + 40, 1);
      buildLight(view, game);
      applyLight(ctx, 1);
    },

    drawGem(ctx, g, view) {
      const fr = Math.floor(view.rt * 5 + g.seed * 8) % 8;
      const arr = g.big ? SPR.gemB : SPR.gem;
      const img = arr[fr < 4 ? fr : 3];
      const bobY = Math.round(Math.sin(view.rt * 3 + g.seed * 6) * 1);
      const z = g.pop > 0 ? Math.round(Math.sin(g.pop * Math.PI) * 6) : 0;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(SPR.shadow.g, Math.round(g.x) - 4, Math.round(g.y) - 1);
      ctx.globalAlpha = 1;
      ctx.drawImage(img, Math.round(g.x - img.width / 2), Math.round(g.y - img.height - 1 + bobY - z));
      if (g.big) bloom(GL.cyan, g.x, g.y - 6, 0.8);
    },

    drawEnemy(ctx, e, view) {
      const flip = e.facing < 0;
      let s;
      if (e.type === 'creeper') s = SPR.creeper[e.seed < 0.5 ? 0 : 1][Math.floor(e.anim * 1.6) & 3];
      else if (e.type === 'ghost') s = SPR.ghost[Math.floor(view.rt * 7 + e.seed * 4) & 3];
      else s = SPR.colossus[Math.floor(e.anim * 2) & 3];
      const x = Math.round(e.x);
      let y = Math.round(e.y);
      if (e.type === 'ghost') y -= 4 + Math.round(Math.sin(view.rt * 3 + e.seed * 10) * 1.5);
      const dx = x - (flip ? s.w - 1 - s.ax : s.ax), dy = y - s.ay;
      if (e.dying) {
        if (e.deathT < 0.18) ctx.drawImage(flip ? s.wl : s.wr, dx, dy);
        else if (e.deathT < 0.4) {
          ctx.globalAlpha = 0.5;
          ctx.drawImage(flip ? s.wl : s.wr, dx, dy + 1);
          ctx.globalAlpha = 1;
        }
        return;
      }
      const white = e.flash > 0.5;
      const img = white ? (flip ? s.wl : s.wr) : flip ? s.l : s.r;
      if (e.spawnT < 1) {
        if (e.type === 'ghost') {
          ctx.globalAlpha = 0.35 * (1 - e.spawnT);
          ctx.drawImage(SPR.mist, x - 7, Math.round(e.y) - 5);
          ctx.globalAlpha = e.spawnT * 0.85;
          ctx.drawImage(img, dx, dy + Math.round((1 - e.spawnT) * 8));
          ctx.globalAlpha = 1;
        } else {
          const t = U.ease.outQuad(e.spawnT);
          const vh = Math.max(1, Math.round(s.h * t));
          ctx.drawImage(img, 0, 0, s.w, vh, dx, y - vh + 1, s.w, vh);
          const dirt = e.type === 'colossus' ? SPR.dirtL : SPR.dirtS;
          ctx.drawImage(dirt, x - (dirt.width >> 1), y - 4);
        }
        return;
      }
      if (e.type === 'ghost') {
        ctx.globalAlpha = 0.86;
        ctx.drawImage(img, dx, dy);
        ctx.globalAlpha = 1;
        // icy trail
        const sp = Math.hypot(e.vx, e.vy);
        if (sp > 10) {
          const tx = -e.vx / sp, ty = -e.vy / sp;
          ctx.fillStyle = 'rgba(200,235,255,0.5)';
          for (let i = 1; i <= 3; i++) {
            const k = (Math.floor(view.rt * 12 + i * 3 + e.seed * 20) % 5) - 2;
            ctx.fillRect(Math.round(e.x + tx * (6 + i * 4) + k * 0.5), Math.round(e.y - 8 + ty * (6 + i * 4) + (i % 2)), 1, 1);
          }
        }
      } else ctx.drawImage(img, dx, dy);
      if (!white) {
        const eyes = flip ? s.eyesL : s.eyes;
        for (let i = 0; i < eyes.length; i++) EYES.push(dx + eyes[i][0], dy + eyes[i][1], eyes[i][2]);
        if (s.core) EMI.push(3, e, dx, dy, flip);
      }
    },

    drawPlayer(ctx, p, view) {
      const rt = view.rt;
      let fi;
      if (p.moving) fi = Math.floor(p.anim) & 3;
      else fi = 4 + (Math.floor(rt * 1.6) & 1);
      const s = SPR.jack[fi];
      const flip = p.facing < 0;
      const x = Math.round(p.x), y = Math.round(p.y);
      const dx = x - (flip ? s.w - 1 - s.ax : s.ax), dy = y - s.ay;
      // dash afterimages
      if (p.dashT > 0) {
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = 0.18 * (4 - i);
          ctx.drawImage(i === 1 ? (flip ? s.warmL : s.warmR) : flip ? s.silL : s.silR, Math.round(dx - p.dashX * i * 6), Math.round(dy - p.dashY * i * 6));
        }
        ctx.globalAlpha = 1;
      }
      if (p.iframes > 0 && p.hurtT < 0.6 && Math.floor(rt * 18) % 2 === 0) ctx.globalAlpha = 0.45;
      if (p.hurtT > 0.6) { ctx.drawImage(flip ? s.wl : s.wr, dx, dy); ctx.globalAlpha = 1; return; }
      ctx.drawImage(flip ? s.l : s.r, dx, dy);
      // flickering carved face
      const f = flick(rt, 0.37);
      const fl = f > 0.95 ? 2 : f > 0.84 ? 1 : 0;
      const face = SPR.jackFace[fl];
      ctx.drawImage(flip ? face.l : face.r, dx, dy + s.bob);
      // throwing arm
      if (p.shootT > 0.35) {
        const ax = Math.cos(p.aim), ay = Math.sin(p.aim);
        const sxp = x + (ax >= 0 ? 3 : -4), syp = y - 17 + s.bob;
        ctx.fillStyle = cs(PAL.cloak[2]);
        ctx.fillRect(Math.round(sxp + ax * 2), Math.round(syp + ay * 2), 2, 2);
        ctx.fillStyle = cs(PAL.glove[2]);
        ctx.fillRect(Math.round(sxp + ax * 4), Math.round(syp + ay * 4), 2, 2);
      }
      ctx.globalAlpha = 1;
      // embers rising from the pumpkin
      if (rt - lastEmberRT > 0.16) {
        lastEmberRT = rt;
        const g = view.game;
        if (g && g.particles.length < 600) ember(g, p.x + (flip ? -1 : 1), p.y, 26, 1, 6);
      }
    },

    drawOrbital(ctx, o) { EMI.push(1, o, 0, 0, 0); },
    drawProjectile(ctx, pr) { EMI.push(2, pr, 0, 0, 0); },

    drawParticle(ctx, pt, view) {
      if (EMISSIVE[pt.kind]) { EMI.push(4, pt, 0, 0, 0); return; }
      const a = clamp(pt.life / pt.max, 0, 1);
      const x = Math.round(pt.x), y = Math.round(pt.y - pt.z);
      switch (pt.kind) {
        case 'juice': {
          ctx.globalAlpha = a > 0.3 ? 1 : 0.55;
          ctx.fillStyle = pt.color;
          if (pt.z < 0.5 && Math.abs(pt.vz) < 8) { ctx.fillRect(x - 1, y, 2 + (pt.size > 1 ? 1 : 0), 1); }
          else ctx.fillRect(x, y, pt.size, pt.size);
          break;
        }
        case 'chunk': {
          ctx.globalAlpha = a > 0.25 ? 1 : 0.5;
          ctx.fillStyle = pt.color;
          const s = pt.size;
          ctx.fillRect(x, y - s + 1, s, s);
          if (s > 2) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 1, y, s - 1, 1); }
          break;
        }
        case 'mist': {
          ctx.globalAlpha = a * 0.6;
          ctx.drawImage(SPR.mist, x - 7, y - 4);
          break;
        }
        case 'dust': {
          ctx.globalAlpha = a * 0.7;
          ctx.fillStyle = pt.color || '#6a5c58';
          ctx.fillRect(x, y, pt.size, pt.size);
          break;
        }
        default: {
          ctx.globalAlpha = a;
          ctx.fillStyle = pt.color || '#fff';
          ctx.fillRect(x, y, pt.size, pt.size);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n) { EMI.push(5, n, 0, 0, 0); },

    drawWorldOverlay(ctx, view, game) {
      const rt = view.rt;
      applyLight(ctx, ENT_A);
      // bloom
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < BLOOM.length; i += 4) {
        const spr = BLOOM[i];
        ctx.globalAlpha = clamp(BLOOM[i + 3], 0, 1);
        ctx.drawImage(spr, Math.round(BLOOM[i + 1] - spr.width / 2), Math.round(BLOOM[i + 2] - spr.height / 2));
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      // eyes
      for (let i = 0; i < EYES.length; i += 3) { ctx.fillStyle = EYES[i + 2]; ctx.fillRect(EYES[i], EYES[i + 1], 1, 1); }
      // emissive objects
      for (let i = 0; i < EMI.length; i += 5) {
        const k = EMI[i], o = EMI[i + 1];
        if (k === 1) {
          const fl = Math.floor(rt * 10 + o.seed * 7) % 3;
          const img = SPR.lantern[fl];
          const sway = Math.round(Math.sin(rt * 5 + o.idx) * 1);
          ctx.drawImage(img, Math.round(o.x - img.width / 2) + sway, Math.round(o.y - img.height - 4));
        } else if (k === 2) {
          const sp = Math.hypot(o.vx, o.vy) || 1, tx = -o.vx / sp, ty = -o.vy / sp;
          const cols = ['#ffc848', '#ff8a1c', '#c8460c', '#7a1c06'];
          for (let j = 0; j < 4; j++) {
            ctx.globalAlpha = 1 - j * 0.2;
            ctx.fillStyle = cols[j];
            ctx.fillRect(Math.round(o.x + tx * (3 + j * 2.2)), Math.round(o.y + ty * (3 + j * 2.2)), j < 2 ? 2 : 1, j < 2 ? 2 : 1);
          }
          ctx.globalAlpha = 1;
          const fi = ((Math.floor(((o.angle + o.spin) / TAU) * 16) % 16) + 16) % 16;
          const img = SPR.seed[fi];
          ctx.drawImage(img, Math.round(o.x) - 5, Math.round(o.y) - 5);
        } else if (k === 3) {
          const s = SPR.colossus[0], dx = EMI[i + 2], dy = EMI[i + 3], flip = EMI[i + 4];
          const pulse = Math.sin(rt * 4 + o.seed * 9);
          const C = PAL.core;
          for (const [cx0, cy0, lv] of s.core) {
            const l = clamp(lv + (pulse > 0.5 ? 1 : 0), 0, 4);
            ctx.fillStyle = cs(C[l]);
            ctx.fillRect(dx + (flip ? s.w - 1 - cx0 : cx0), dy + cy0, 1, 1);
          }
        } else if (k === 4) {
          drawEmissiveParticle(ctx, o, rt);
        } else if (k === 5) {
          drawNum(ctx, o);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view, game) {
      const p = game.player;
      if (p.hurtT > 0.05) {
        ctx.globalAlpha = p.hurtT * 0.35;
        ctx.fillStyle = '#6a0010';
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(LM.base, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = p.hurtT * 0.18;
        ctx.fillRect(0, 0, view.W, view.H);
        ctx.globalAlpha = 1;
      }
    },

    drawIcon(ctx, id, size) {
      const img = ICON[id] || ICON['kills'];
      if (!img) return;
      ctx.imageSmoothingEnabled = false;
      const sc = Math.floor(size / 16);
      const w = img.width * sc, h = img.height * sc;
      ctx.drawImage(img, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
    },

    /* ---------- hooks ---------- */
    onHit(game, e, src) {
      const z = e.type === 'colossus' ? 22 : e.type === 'ghost' ? 14 : 10;
      if (e.type === 'ghost') {
        sparks(game, e.x, e.y, z, 4, 50, FROST);
      } else {
        splash(game, e.x, e.y, z, e.type === 'colossus' ? 5 : 3, JUICE, 40);
        sparks(game, e.x, e.y, z, 3, 60, ['#ffffff', '#fff2b8', '#ffc848']);
      }
    },
    onKill(game, e) {
      if (e.type === 'ghost') {
        sparks(game, e.x, e.y, 14, 8, 60, FROST);
        chunks(game, e.x, e.y, 14, 6, CH_COL.ghost, 50);
        game.addParticle({ x: e.x, y: e.y, z: 6, life: 0.7, kind: 'mist', drag: 3, vx: 0, vy: 0 });
        soul(game, e.x, e.y, 14, false);
      } else if (e.type === 'colossus') {
        chunks(game, e.x, e.y, 26, 22, CH_COL.colossus, 90);
        splash(game, e.x, e.y, 24, 12, JUICE, 60);
        sparks(game, e.x, e.y, 24, 14, 90, ['#dcffb0', '#86ff5a', '#ffffff']);
        game.addParticle({ x: e.x, y: e.y - 22, z: 0, life: 0.45, kind: 'ring', size: 1, drag: 0 });
        soul(game, e.x, e.y, 24, true);
      } else {
        chunks(game, e.x, e.y, 10, 10, CH_COL.creeper, 60);
        splash(game, e.x, e.y, 10, 7, JUICE, 50);
        soul(game, e.x, e.y, 12, false);
      }
    },
    onHurt(game, p) {
      sparks(game, p.x, p.y, 18, 10, 80, ['#ff8a1c', '#ffc848', '#fff2b8']);
      ember(game, p.x, p.y, 20, 6, 10);
    },
    onPickup(game, g) {
      game.addParticle({ x: g.x, y: g.y, z: 6, life: 0.22, kind: 'glint', size: 1, drag: 0 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.4) ember(game, game.player.x, game.player.y, 22, 1, 6);
    },
    onDash(game, p) {
      for (let i = 0; i < 8; i++) {
        game.addParticle({
          x: p.x + (Math.random() - 0.5) * 8, y: p.y + (Math.random() - 0.5) * 3, z: 1, vx: -p.dashX * 30 + (Math.random() - 0.5) * 30,
          vy: -p.dashY * 20 + (Math.random() - 0.5) * 10, vz: 6, grav: 30, life: 0.35 + Math.random() * 0.3, size: Math.random() < 0.3 ? 2 : 1,
          kind: 'dust', color: Math.random() < 0.5 ? '#5a4c4a' : '#3e3438',
        });
      }
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y - 12, z: 0, life: 0.6, kind: 'ring', size: 1, drag: 0 });
      ember(game, p.x, p.y, 12, 18, 24);
      for (let i = 0; i < 4; i++) soul(game, p.x + (Math.random() - 0.5) * 30, p.y + (Math.random() - 0.5) * 10, 6, false);
    },
    onDeath(game, p) {
      sparks(game, p.x, p.y, 16, 24, 110, ['#ff8a1c', '#ffc848', '#fff2b8', '#c8460c']);
      ember(game, p.x, p.y, 16, 20, 20);
      chunks(game, p.x, p.y, 18, 14, [cs(PAL.pumpkin[3]), cs(PAL.pumpkin[4]), cs(PAL.pumpkin[2])], 70);
    },

    css: gothicCSS(),
  });

  /* emissive particle + number drawing (after the light) */
  function drawEmissiveParticle(ctx, pt, rt) {
    const a = clamp(pt.life / pt.max, 0, 1);
    const x = Math.round(pt.x), y = Math.round(pt.y - pt.z);
    switch (pt.kind) {
      case 'ember': {
        const wob = Math.round(Math.sin(rt * 6 + pt.seed * 20) * 1);
        const F = PAL.fire;
        ctx.fillStyle = cs(F[a > 0.75 ? 4 : a > 0.5 ? 3 : a > 0.25 ? 2 : 1]);
        ctx.fillRect(x + wob, y, 1, 1);
        break;
      }
      case 'spark': {
        ctx.fillStyle = pt.color;
        ctx.fillRect(x, y, 1, 1);
        if (a > 0.5) {
          const sp = Math.hypot(pt.vx, pt.vy) || 1;
          ctx.fillRect(Math.round(pt.x - (pt.vx / sp) * 2), Math.round(pt.y - pt.z - (pt.vy / sp) * 2), 1, 1);
        }
        break;
      }
      case 'soul': {
        const fr = Math.floor(rt * 10 + pt.seed * 5) % 3;
        const img = SPR.soul[fr];
        ctx.globalAlpha = a > 0.35 ? 1 : a > 0.15 ? 0.6 : 0.3;
        ctx.drawImage(img, x - 3 + Math.round(Math.sin(rt * 4 + pt.seed * 9)), y - 6);
        ctx.globalAlpha = 1;
        break;
      }
      case 'frost': {
        ctx.globalAlpha = a;
        ctx.fillStyle = '#dffaff';
        ctx.fillRect(x, y, 1, 1);
        ctx.globalAlpha = 1;
        break;
      }
      case 'glint': {
        ctx.fillStyle = cs(PAL.gem[4]);
        ctx.fillRect(x, y - 1, 1, 3); ctx.fillRect(x - 1, y, 3, 1);
        if (a > 0.5) { ctx.fillStyle = cs(PAL.gem[3]); ctx.fillRect(x, y - 3, 1, 1); ctx.fillRect(x, y + 3, 1, 1); ctx.fillRect(x - 3, y, 1, 1); ctx.fillRect(x + 3, y, 1, 1); }
        break;
      }
      case 'ring': {
        const t = 1 - a;
        const idx = clamp(Math.floor(t * SPR.ring.length), 0, SPR.ring.length - 1);
        const img = SPR.ring[idx];
        ctx.globalAlpha = a > 0.3 ? 1 : 0.5;
        ctx.drawImage(img, x - (img.width >> 1), y - (img.height >> 1));
        ctx.globalAlpha = 1;
        break;
      }
    }
  }

  function drawNum(ctx, n) {
    const a = clamp(n.life / n.max, 0, 1);
    const str = String(Math.max(0, n.value | 0));
    const arr = n.crit ? SPR.digitC : SPR.digit;
    const gw = arr[0].width - 1;
    const age = n.max - n.life;
    const pop = age < 0.1 ? -2 : 0;
    const x0 = Math.round(n.x - (str.length * gw) / 2), y0 = Math.round(n.y - arr[0].height + pop);
    ctx.globalAlpha = a > 0.4 ? 1 : a > 0.2 ? 0.66 : 0.33;
    for (let i = 0; i < str.length; i++) ctx.drawImage(arr[+str[i]], x0 + i * gw, y0);
    ctx.globalAlpha = 1;
  }
})();
