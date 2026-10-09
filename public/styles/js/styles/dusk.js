/* Dämmerwald – modern "HD-2D" pixel art: an enchanted forest clearing in the golden-to-violet minute before night.
   Everything is procedural: hand-picked hue-shifted ramps, per-pixel shaded sprites with selective (coloured) outlines
   and a two-tone rim light (warm sun from the left, cool sky bounce from the right), additive banded glow sprites,
   long sheared shadows towards the upper right, colour grading + soft bloom + tilt-shift on the low-res buffer. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const hx = U.hex, mix = U.mix, clamp = U.clamp, sstep = U.smoothstep;
  const rp = (...a) => a.map(hx);

  /* =================================================================== palette */
  const P = {
    ink: hx('#150c29'), night: hx('#1e1538'), plum: hx('#4a2c62'), violet: hx('#6b4a8e'),
    rim: hx('#ffcfa2'), rimLeaf: hx('#ffd08a'), bounce: hx('#8d86ea'), shadow: hx('#1a1034'),
    white: hx('#ffffff'),
  };
  const R = {
    grass: rp('#0a1d2a', '#0d2732', '#11323a', '#153d3f', '#194943', '#1e5546', '#246248', '#2c6f4a', '#387d4d', '#4a8c51', '#62a056'),
    meadow: rp('#0e2733', '#13333a', '#183f3f', '#1e4b43', '#255846', '#2d6548', '#38734a', '#46824d', '#589250', '#70a456', '#8eb75d'),
    earth: rp('#150f1d', '#1c1525', '#241b2d', '#2d2134', '#36273a', '#412e40', '#4d3645', '#5b404b', '#6b4b50'),
    stone: rp('#141127', '#1f1b34', '#2a2641', '#36324f', '#433e5c', '#504a69', '#5f5876', '#6f6782', '#82788f', '#988b9e', '#b3a2b0'),
    moss: rp('#11292a', '#173a31', '#1f4d37', '#2a613c', '#387541', '#4a8a47', '#62a04f', '#82b65a'),
    water: rp('#131a3c', '#16244c', '#1a305a', '#1e3e68', '#244f74', '#2b627e', '#357486', '#43878d'),
    bark: rp('#160f22', '#21162d', '#2d1d36', '#3b2540', '#4b2f49', '#5d3a51', '#714758', '#88565f', '#a26a68'),
    birch: rp('#2a2340', '#454061', '#666184', '#8c86a6', '#b3abc6', '#d6cde0', '#f1e9ee', '#fffaf4'),
    leaf: rp('#0a1328', '#0d1b33', '#10253d', '#133046', '#163d4c', '#1a4b51', '#1f5a54', '#266a56', '#307a57', '#3e8a57', '#539b58', '#71ad5c', '#9cc063', '#cfd27a'),
    leafB: rp('#0e1c30', '#12283b', '#173545', '#1d444c', '#245451', '#2d6554', '#387656', '#468858', '#589a5a', '#70ac5d', '#8fbd62', '#b8cd6c', '#e4dc82'),
    bloom: rp('#170d2a', '#22123a', '#311848', '#421f56', '#562862', '#6c326e', '#843f7a', '#9d4e86', '#b66090', '#cd769b', '#e293a8', '#f2b4b8', '#fdd6c8'),
    pumpkin: rp('#3a1428', '#64202c', '#93332c', '#c24f2c', '#e5742f', '#f79a3e', '#ffc35c', '#ffe08c'),
    stem: rp('#13201f', '#203324', '#33492a', '#4d6330', '#6d7d3a'),
    cape: rp('#0c1430', '#102241', '#143354', '#194866', '#1f6076', '#2a7a85', '#40978f', '#6ab8a4'),
    leather: rp('#25132a', '#3f1f2e', '#5e3135', '#81493d', '#a5654b', '#c8875c'),
    pants: rp('#120f2a', '#1b1838', '#252148', '#322c5a'),
    turnip: rp('#1a0d33', '#2a1150', '#3f166c', '#581d88', '#7426a0', '#922fb0', '#b044b8', '#d06cc4', '#eea0d6'),
    turnipM: rp('#200c2c', '#381040', '#541656', '#71206a', '#90297c', '#b0358a', '#cc5098', '#e47aa8', '#f8aec0'),
    rbody: rp('#2e1636', '#4d2a44', '#7a4a4c', '#a8704c', '#cf9748', '#e8b950', '#f6d572', '#fff0b0'),
    cream: rp('#3e2645', '#5f4157', '#866460', '#ad8a72', '#cdae86', '#e5cd9f', '#f6e6bf', '#fff6dc'),
    tops: rp('#0d2629', '#133b36', '#1b5440', '#256e48', '#36894e', '#52a455', '#78bf5e', '#a6d66c'),
    ice: rp('#1a2252', '#223672', '#2c4f92', '#3a6cb0', '#5590cc', '#7ab3e4', '#a4d3f4', '#cfecfb', '#f0fcff'),
    oldv: rp('#1a1128', '#281937', '#3a2248', '#4e2d58', '#643b68', '#7c4d78', '#966388', '#b07f98'),
    ochre: rp('#2b1c29', '#463033', '#66473c', '#8a664a', '#ad8656', '#cba664', '#e4c57a', '#f4de98'),
    seed: rp('#5a3f2c', '#8c6c48', '#bc9e6e', '#e2cc98', '#f6eac4', '#fffbec'),
    amber: rp('#6e2430', '#b2452e', '#e3763a', '#ffaa48', '#ffd27a', '#fff2c4'),
    rose: rp('#4a1240', '#7e1d5c', '#b8307a', '#e8559a', '#ff8ab8', '#ffc4dc', '#fff2f8'),
    shroom: rp('#0c2440', '#123a5a', '#185274', '#1f6c8a', '#2a8a9a', '#3fb0ae', '#7ee0cc', '#d0fff2'),
    mstem: rp('#3e3858', '#625a7e', '#8d85a4', '#b9b0c8', '#e2dbe8'),
    berry: rp('#330c2c', '#641440', '#9c2152', '#d63a6a', '#ff6e8e', '#ffb4c4'),
    flame: rp('#b8401c', '#f07a26', '#ffb648', '#ffe48a', '#fffbe0'),
    gold: rp('#5a3420', '#8e5a2a', '#c48a3a', '#e8b85a', '#ffe08e', '#fff6d0'),
    lily: rp('#0e2f36', '#164a44', '#226a4c', '#348652', '#52a05a', '#7cbc64'),
  };
  const FLOWERS = {
    pink: rp('#a24f7e', '#e58bb4', '#ffc4dc'),
    lav: rp('#5d47a2', '#9a7fe0', '#cfbfff'),
    white: rp('#9d93b4', '#e8e0ec', '#ffffff'),
    peach: rp('#c0605a', '#f7a688', '#ffd9bf'),
    gold: rp('#b8702a', '#f2c04e', '#fff0a0'),
  };
  const CENTER = hx('#ffcf4e');

  /* =================================================================== pixel painter */
  const EMIT = 1, NOOUT = 2, NORIM = 4;
  const LDIR = (() => { const v = [-0.62, -0.5, 0.6], n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; })();

  class Pix {
    constructor(w, h, wrap) {
      this.w = w; this.h = h; this.wrap = !!wrap;
      this.d = new Uint8ClampedArray(w * h * 4);
      this.f = new Uint8Array(w * h);
    }
    idx(x, y) {
      x = Math.floor(x); y = Math.floor(y);
      if (this.wrap) { x = ((x % this.w) + this.w) % this.w; y = ((y % this.h) + this.h) % this.h; }
      else if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
      return y * this.w + x;
    }
    set(x, y, c, a = 255, fl = 0) {
      const i = this.idx(x, y);
      if (i < 0) return;
      const o = i * 4, d = this.d;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = a; this.f[i] = fl;
    }
    blend(x, y, c, t) {
      const i = this.idx(x, y);
      if (i < 0) return;
      const o = i * 4, d = this.d;
      if (!d[o + 3]) return;
      d[o] += (c[0] - d[o]) * t; d[o + 1] += (c[1] - d[o + 1]) * t; d[o + 2] += (c[2] - d[o + 2]) * t;
    }
    clear(x, y) { const i = this.idx(x, y); if (i >= 0) { this.d[i * 4 + 3] = 0; this.f[i] = 0; } }
    a(x, y) { const i = this.idx(x, y); return i < 0 ? 0 : this.d[i * 4 + 3]; }
    rgb(x, y) { const i = this.idx(x, y); if (i < 0) return [0, 0, 0]; const o = i * 4; return [this.d[o], this.d[o + 1], this.d[o + 2]]; }
    rect(x, y, w, h, c, a, fl) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a, fl); }
    line(x0, y0, x1, y1, c, a, fl) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (let n = 0; n < 400; n++) {
        this.set(x0, y0, c, a, fl);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    /** Shaded ellipsoid, ramp dark -> light, lit by LDIR. */
    blob(cx, cy, rx, ry, rmp, o = {}) {
      const L = o.L || LDIR, k = o.k === undefined ? 1 : o.k, bias = o.bias || 0;
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx); x++) {
          const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, dd = nx * nx + ny * ny;
          if (dd > (o.edge ? o.edge(x, y, nx, ny) : 1)) continue;
          if (o.under && this.a(x, y)) continue;
          if (o.over && !this.a(x, y)) continue;
          if (o.mask && !o.mask(x, y, nx, ny)) continue;
          const nz = Math.sqrt(Math.max(0, 1 - dd));
          let v = (nx * L[0] + ny * L[1] + nz * L[2]) * k * 0.5 + 0.5 + bias;
          if (o.tex) v += o.tex(x, y, nx, ny);
          const Rm = o.rampAt ? o.rampAt(x, y, nx, ny) : rmp;
          const i = clamp(Math.floor(v * Rm.length), o.min || 0, Rm.length - 1 - (o.top || 0));
          const al = o.alpha === undefined ? 255 : typeof o.alpha === 'function' ? o.alpha(x, y, nx, ny) : o.alpha;
          if (al <= 0) continue;
          this.set(x, y, Rm[i], al, o.flag || 0);
        }
      }
    }
    flip() {
      const p = new Pix(this.w, this.h);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const s = (y * this.w + x), t = (y * this.w + (this.w - 1 - x));
        for (let k = 0; k < 4; k++) p.d[t * 4 + k] = this.d[s * 4 + k];
        p.f[t] = this.f[s];
      }
      return p;
    }
    canvas() {
      const { c, ctx } = U.canvas(this.w, this.h);
      const img = ctx.createImageData(this.w, this.h);
      img.data.set(this.d);
      ctx.putImageData(img, 0, 0);
      return c;
    }
  }
  const fromData = (d, w, h) => {
    const { c, ctx } = U.canvas(w, h);
    const img = ctx.createImageData(w, h);
    img.data.set(d);
    ctx.putImageData(img, 0, 0);
    return c;
  };

  /**
   * Finishing pass for every character / prop sprite:
   * two-tone rim light (warm sun from the left/top, cool sky bounce on the right) and a selective outline:
   * darkened hue of the neighbouring colour – deep indigo on the shadow side, a softer plum on the lit side.
   * Returns {c, ox, oy} where (ox, oy) is the anchor (feet) inside the grown canvas.
   */
  function finish(p, o = {}) {
    const w = p.w, h = p.h, d = p.d, f = p.f;
    const rim = o.rim || P.rim, rimA = o.rimA === undefined ? 0.42 : o.rimA;
    const cool = o.cool || P.bounce, coolA = o.coolA === undefined ? 0.22 : o.coolA;
    const sol = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    const src = new Uint8ClampedArray(d);
    if (rimA > 0 || coolA > 0) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, q = i * 4;
        if (!d[q + 3] || (f[i] & (EMIT | NORIM))) continue;
        let lit = 0;
        if (!sol(x - 1, y)) lit = 1; else if (!sol(x, y - 1)) lit = o.topRim === undefined ? 0.75 : o.topRim; else if (!sol(x - 1, y - 1)) lit = 0.3;
        let dk = 0;
        if (!sol(x + 1, y)) dk = 1; else if (!sol(x + 1, y - 1) && !sol(x + 1, y + 1)) dk = 0.4;
        if (lit && rimA) { const t = rimA * lit; src[q] += (rim[0] - src[q]) * t; src[q + 1] += (rim[1] - src[q + 1]) * t; src[q + 2] += (rim[2] - src[q + 2]) * t; }
        else if (dk && coolA) { const t = coolA * dk; src[q] += (cool[0] - src[q]) * t; src[q + 1] += (cool[1] - src[q + 1]) * t; src[q + 2] += (cool[2] - src[q + 2]) * t; }
      }
    }
    const W = w + 2, H = h + 2, od = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, t = ((y + 1) * W + x + 1) * 4;
      od[t] = src[s]; od[t + 1] = src[s + 1]; od[t + 2] = src[s + 2]; od[t + 3] = src[s + 3];
    }
    if (o.outline !== false) {
      const outA = o.outA === undefined ? 1 : o.outA;
      const dark = o.dark || P.ink, litC = o.lit || P.plum;
      for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
        const x = X - 1, y = Y - 1;
        if (sol(x, y)) continue;
        let nb = -1, dk = false;
        if (sol(x - 1, y)) { nb = y * w + x - 1; dk = true; }
        else if (sol(x, y - 1)) { nb = (y - 1) * w + x; dk = true; }
        else if (sol(x + 1, y)) nb = y * w + x + 1;
        else if (sol(x, y + 1)) nb = (y + 1) * w + x;
        if (nb < 0 || (f[nb] & NOOUT)) continue;
        const q = nb * 4, c = [d[q], d[q + 1], d[q + 2]];
        const oc = dk ? mix(U.mul(c, 0.32), dark, 0.55) : mix(U.mul(c, 0.55), litC, 0.45);
        const t = (Y * W + X) * 4;
        od[t] = oc[0]; od[t + 1] = oc[1]; od[t + 2] = oc[2]; od[t + 3] = d[q + 3] * outA;
      }
    }
    return { c: fromData(od, W, H), ox: (o.ox !== undefined ? o.ox : w / 2) + 1, oy: (o.oy !== undefined ? o.oy : h) + 1 };
  }

  /**
   * Long cast shadow: the silhouette is sheared towards the upper right (low sun from the left/front),
   * squashed onto the ground and given a banded soft edge. Returns {c, ox, oy}.
   */
  function makeShadow(p, ax, ay, o = {}) {
    const kx = o.kx === undefined ? 0.8 : o.kx, ky = o.ky === undefined ? 0.3 : o.ky;
    const pts = [];
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      if (!p.d[(y * p.w + x) * 4 + 3]) continue;
      const hgt = Math.max(0, ay - (y + 0.5));
      const sx = Math.floor(x + hgt * kx), sy = Math.floor(ay - 0.5 - hgt * ky);
      pts.push(sx, sy);
      if (sx < minx) minx = sx; if (sx > maxx) maxx = sx; if (sy < miny) miny = sy; if (sy > maxy) maxy = sy;
    }
    // contact blob around the feet
    const cr = o.contact || 0;
    if (cr) { minx = Math.min(minx, Math.floor(ax - cr - 1)); maxx = Math.max(maxx, Math.ceil(ax + cr + 1)); maxy = Math.max(maxy, Math.ceil(ay + 2)); miny = Math.min(miny, Math.floor(ay - 3)); }
    const pad = 2, W = maxx - minx + 1 + pad * 2, H = maxy - miny + 1 + pad * 2;
    const m = new Uint8Array(W * H);
    for (let i = 0; i < pts.length; i += 2) m[(pts[i + 1] - miny + pad) * W + (pts[i] - minx + pad)] = 2;
    if (cr) {
      for (let y = -3; y <= 2; y++) for (let x = -cr - 1; x <= cr + 1; x++) {
        const nx = (x + 0.5) / (cr + 0.5), ny = (y + 0.5) / 2.6;
        if (nx * nx + ny * ny <= 1) m[(Math.floor(ay) + y - miny + pad) * W + (Math.floor(ax) + x - minx + pad)] = 3;
      }
    }
    // close 1px holes horizontally, then a soft outer band
    for (let y = 0; y < H; y++) for (let x = 1; x < W - 1; x++) if (!m[y * W + x] && m[y * W + x - 1] >= 2 && m[y * W + x + 1] >= 2) m[y * W + x] = 2;
    const band = new Uint8Array(m);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (m[y * W + x]) continue;
      if (m[y * W + x - 1] || m[y * W + x + 1] || m[(y - 1) * W + x] || m[(y + 1) * W + x]) band[y * W + x] = 1;
    }
    const d = new Uint8ClampedArray(W * H * 4), sc = o.color || P.shadow;
    const A = [0, 0.18, o.alpha || 0.34, o.contactA || 0.5];
    for (let i = 0; i < W * H; i++) {
      if (!band[i]) continue;
      d[i * 4] = sc[0]; d[i * 4 + 1] = sc[1]; d[i * 4 + 2] = sc[2]; d[i * 4 + 3] = 255 * A[band[i]];
    }
    return { c: fromData(d, W, H), ox: ax - minx + pad, oy: ay - miny + pad };
  }

  /* =================================================================== glow sprites (additive, banded) */
  const GLOWCOL = {
    warm: rp('#fff0b8', '#ffab4a', '#d8456a'),
    amber: rp('#fff4c8', '#ffbe55', '#e0607a'),
    cyan: rp('#e8fffa', '#58e8d6', '#3a6ad0'),
    ice: rp('#ffffff', '#9fd8ff', '#6a5ae0'),
    pink: rp('#fff4fa', '#ff9ac8', '#9a5ae0'),
    rose: rp('#fff0f6', '#ff7ab0', '#8a40c0'),
    eye: rp('#ffe0ea', '#ff4f7a', '#8a2060'),
    fly: rp('#f6ffc8', '#c8f070', '#3a9a7a'),
    sun: rp('#fff6dc', '#ffc890', '#e0789a'),
  };
  const glowCache = new Map();
  function glow(type, r, flat) {
    r = Math.max(2, Math.round(r));
    const key = type + r + (flat ? 'f' : '');
    let g = glowCache.get(key);
    if (g) return g;
    const rx = r, ry = flat ? Math.max(2, Math.round(r * 0.55)) : r;
    const w = rx * 2 + 1, h = ry * 2 + 1, cols = GLOWCOL[type] || GLOWCOL.warm;
    const bands = r < 5 ? 3 : r < 12 ? 4 : 5;
    const p = new Pix(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x - rx) / (rx + 0.5), dy = (y - ry) / (ry + 0.5), dd = Math.sqrt(dx * dx + dy * dy);
      if (dd >= 1) continue;
      const b = dd * bands;
      let bi = Math.floor(b);
      if (b - bi > 0.55 && U.dither(x, y) < (b - bi - 0.55) / 0.45) bi++;
      if (bi >= bands) continue;
      const t = bi / bands, inten = Math.pow(1 - t, 1.6);
      p.set(x, y, U.ramp(cols, t / (1 - 1 / bands)), 255 * inten);
    }
    g = { c: p.canvas(), w, h, hw: rx, hh: ry };
    glowCache.set(key, g);
    return g;
  }
  function drawGlow(ctx, type, r, x, y, a, flat) {
    if (a <= 0.01) return;
    const g = glow(type, r, flat);
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(g.c, Math.round(x) - g.hw, Math.round(y) - g.hh);
  }

  /* =================================================================== ground */
  const STEP = 8, NF = 6;
  const GRASS = 0, FOREST = 1, STONE = 2, WATER = 3;
  const HGT = [3, 1, 2, 0];
  let FINE, CLUMP, TEX = {}, BLOOM_T, BLOOM_C, RIPPLE;
  const matCache = new Map(); // chunk key -> coarse material map for the animated overlay

  function fieldsAt(x, y, out, o) {
    const c = Math.exp(-(x * x + y * y) / (250 * 250));
    out[o] = U.warped(x / 760, y / 760, 11, 1.1, 2) - 0.24 * c;               // forest
    out[o + 1] = U.fbm(x / 520 + 31.7, y / 520 - 12.3, 23, 3) + 0.14 * c;     // meadow
    out[o + 2] = U.warped(x / 600 + 7.1, y / 600 - 3.3, 37, 1.3, 2) - 0.22 * c; // ruins
    out[o + 3] = U.fbm(x / 420, y / 420, 51, 2) - 0.3 * c;                    // water
    out[o + 4] = U.fbm(x / 230, y / 230, 67, 2);                              // light pools
    out[o + 5] = U.fbm(x / 150, y / 150, 79, 2);                              // texture variant
  }
  /** Bilinear field sample from a chunk grid (world-aligned nodes -> identical results in every chunk). */
  function sampleFields(gc, X, Y, out) {
    const gx = Math.floor(X / STEP), gy = Math.floor(Y / STEP);
    const fx = (X - gx * STEP) / STEP, fy = (Y - gy * STEP) / STEP;
    const g = gc.grid, o00 = ((gy - gc.gy0) * gc.GW + (gx - gc.gx0)) * NF, o10 = o00 + NF, o01 = o00 + gc.GW * NF, o11 = o01 + NF;
    for (let k = 0; k < NF; k++) {
      const a = g[o00 + k] + (g[o10 + k] - g[o00 + k]) * fx;
      const b = g[o01 + k] + (g[o11 + k] - g[o01 + k]) * fx;
      out[k] = a + (b - a) * fy;
    }
    return out;
  }
  function classify(f, X, Y) {
    const t = ((Y & 255) << 8) | (X & 255);
    const fn = FINE[t], cl = CLUMP[t];
    if (f[3] + fn * 0.05 > 0.69) return WATER;
    if (f[2] + fn * 0.07 + cl * 0.025 > 0.625) return STONE;
    if (f[0] + fn * 0.09 + cl * 0.035 > 0.57) return FOREST;
    return GRASS;
  }
  /** Direct (grid-free) material lookup for prop placement. */
  const _wf = new Float32Array(NF);
  function matWorld(x, y) {
    fieldsAt(x, y, _wf, 0);
    return classify(_wf, Math.floor(x), Math.floor(y));
  }

  function worleyT(x, y, px, py, seed, out) {
    const xi = Math.floor(x), yi = Math.floor(y);
    let f1 = 9, f2 = 9, bx = 0, by = 0, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = xi + i, cy = yi + j;
      const h = U.hashInt(((cx % px) + px) % px, ((cy % py) + py) % py, seed);
      const fx = cx + 0.15 + ((h & 1023) / 1023) * 0.7, fy = cy + 0.15 + (((h >>> 10) & 1023) / 1023) * 0.7;
      const dx = fx - x, dy = fy - y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < f1) { f2 = f1; f1 = d; bx = fx; by = fy; id = h; } else if (d < f2) f2 = d;
    }
    out.f1 = f1; out.f2 = f2; out.x = bx; out.y = by; out.id = id;
    return out;
  }

  /** Painterly grass: large soft tonal patches posterised into a few greens, plus sparse blade tufts. */
  function grassTex(seed, rmp, lo, hi, tufts) {
    const p = new Pix(256, 256, true), rng = U.rng(seed), n = hi - lo + 1;
    const base = new Uint8Array(65536);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const a = U.fbmTile(x / 64, y / 64, 4, seed, 3) - 0.5;
      const b = U.fbmTile(x / 16, y / 16, 16, seed + 1, 2) - 0.5;
      const c = U.fbmTile(x / 4, y / 4, 64, seed + 2, 1) - 0.5;
      const v = 0.5 + a * 1.5 + b * 0.6 + c * 0.32;
      const i = lo + clamp(Math.floor(v * n), 0, n - 1);
      base[(y << 8) | x] = i;
      p.set(x, y, rmp[i]);
    }
    for (let k = 0; k < tufts; k++) {
      const x = rng.int(0, 255), y = rng.int(0, 255), bi = base[(y << 8) | x];
      const nb = rng.int(2, 4);
      for (let j = 0; j < nb; j++) {
        const bx = x + j * 2 - nb + rng.int(0, 1), hgt = rng.int(1, 3);
        for (let q = 0; q < hgt; q++) {
          const top = q === hgt - 1;
          p.set(bx + (top && hgt > 1 && rng.chance(0.35) ? rng.sign() : 0), y - q, rmp[clamp(bi + 1 + (top ? 1 : 0), 0, rmp.length - 1)]);
        }
        p.set(bx, y + 1, rmp[clamp(bi - 1, 0, rmp.length - 1)]);
      }
    }
    return p.d;
  }
  function forestTex(seed) {
    const p = new Pix(256, 256, true), rng = U.rng(seed), E = R.earth, Mo = R.moss;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const n = U.fbmTile(x / 32, y / 32, 8, seed, 3) - 0.5, m = U.fbmTile(x / 8, y / 8, 32, seed + 5, 2) - 0.5;
      const v = 0.5 + n * 1.3 + m * 0.55 + (U.hash2(x, y, seed) - 0.5) * 0.06;
      const ms = U.fbmTile(x / 16, y / 16, 16, seed + 7, 3) + m * 0.2;
      if (ms > 0.63) p.set(x, y, Mo[clamp(Math.floor((ms - 0.63) * 14 + v * 2), 0, 3)]);
      else p.set(x, y, E[clamp(1 + Math.floor(v * 6), 1, 7)]);
    }
    // fallen leaves (muted rust / ochre / mauve) + petals + twigs
    const LEAVES = [rp('#3f2234', '#5e2f3a', '#7e4440'), rp('#3e2d30', '#5f4636', '#806040'), rp('#38233f', '#553357', '#77496c'), rp('#1d3434', '#28473e', '#355a46')];
    for (let i = 0; i < 1100; i++) {
      const x = rng.int(0, 255), y = rng.int(0, 255), L = rng.pick(LEAVES), k = rng.int(0, 2);
      if (k === 0) { p.set(x, y, L[2]); p.set(x + 1, y, L[1]); p.set(x + 1, y + 1, L[0]); p.set(x + 2, y + 1, L[0]); }
      else if (k === 1) { p.set(x, y, L[1]); p.set(x + 1, y, L[2]); p.set(x, y + 1, L[0]); }
      else { p.set(x, y, L[2]); p.set(x, y + 1, L[1]); p.set(x + 1, y + 1, L[0]); }
    }
    const PET = [FLOWERS.pink, FLOWERS.white, FLOWERS.peach];
    for (let i = 0; i < 260; i++) {
      const x = rng.int(0, 255), y = rng.int(0, 255), F = rng.pick(PET);
      p.set(x, y, mix(F[1], E[4], 0.25)); if (rng.chance(0.5)) p.set(x + 1, y, mix(F[0], E[3], 0.4));
    }
    for (let i = 0; i < 70; i++) {
      let x = rng.int(0, 255), y = rng.int(0, 255);
      const len = rng.int(4, 8), dy = rng.range(-0.5, 0.5);
      for (let k = 0; k < len; k++) { p.set(x + k, y + Math.round(k * dy), R.bark[5]); p.set(x + k, y + Math.round(k * dy) + 1, R.bark[1]); }
    }
    return { data: p.d };
  }
  function stoneTex(seed) {
    const p = new Pix(256, 256, true), rng = U.rng(seed), S = R.stone, E = R.earth;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) p.set(x, y, S[1]);
    const isStone = new Uint8Array(65536);
    const rows = [];
    for (let y = 0; y < 256;) { let h = rng.pick([12, 14, 16, 16, 18, 20]); if (256 - (y + h) < 12) h = 256 - y; rows.push([y, h]); y += h; }
    for (const [y0, rh] of rows) {
      let x = rng.int(0, 40);
      const end = x + 256;
      while (x < end - 1) {
        let w = rng.int(14, 40);
        if (end - (x + w) < 12) w = end - x;
        const tone = rng.range(-0.13, 0.13), crack = rng.chance(0.25), broken = rng.chance(0.06), wet = rng.chance(0.15);
        for (let yy = 1; yy < rh; yy++) for (let xx = 1; xx < w; xx++) {
          const X = x + xx, Y = y0 + yy;
          if (broken) { p.set(X, Y, E[yy < 3 ? 1 : 3 + (U.hash2(X & 255, Y, 3) < 0.3 ? 1 : 0)]); continue; }
          if ((xx === 1 || xx === w - 1) && (yy === 1 || yy === rh - 1)) continue;
          let v = 0.52 + tone + (U.fbmTile(X / 8, Y / 8, 32, seed + 3, 2) - 0.5) * 0.5 + (U.hash2(X & 255, Y, seed) - 0.5) * 0.05;
          if (wet) v -= 0.12;
          if (yy === 1) v += 0.2; else if (yy === 2) v += 0.07;
          if (xx === 1) v += 0.1;
          if (yy === rh - 1) v -= 0.22; else if (yy === rh - 2) v -= 0.06;
          if (xx === w - 1) v -= 0.14;
          p.set(X, Y, S[3 + clamp(Math.floor(v * 5), 0, 5)]);
          if (!wet && U.hash2(X & 255, Y, seed + 7) < 0.012) p.set(X, Y, hx('#8fa08e'));
          isStone[((Y & 255) << 8) | (X & 255)] = 1;
        }
        if (crack && !broken) {
          let cx = x + rng.int(4, Math.max(5, w - 4)), cy = y0 + rng.int(3, rh - 4);
          const n = rng.int(4, 9);
          for (let k = 0; k < n; k++) {
            p.set(cx, cy, S[2]); p.set(cx, cy + 1, S[6]);
            cx += rng.sign(); cy += rng.int(-1, 1);
            if (cy <= y0 + 1 || cy >= y0 + rh - 2) break;
          }
        }
        x += w;
      }
    }
    // moss creeping through the joints and over stone edges
    const Mo = R.moss;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const mn = U.fbmTile(x / 16, y / 16, 16, seed + 9, 3) + (U.fbmTile(x / 4, y / 4, 64, seed + 11, 1) - 0.5) * 0.25;
      const st = isStone[(y << 8) | x];
      if (!st && mn > 0.5) p.set(x, y, Mo[mn > 0.6 ? 3 : 2]);
      else if (st && mn > 0.64) p.set(x, y, Mo[clamp(2 + Math.floor((mn - 0.64) * 30), 2, 5)]);
    }
    return { data: p.d };
  }
  function makeBlossoms(seed) {
    BLOOM_T = new Uint8Array(65536).fill(255);
    BLOOM_C = new Uint8Array(65536 * 3);
    const rng = U.rng(seed);
    const sets = [FLOWERS.lav, FLOWERS.lav, FLOWERS.pink, FLOWERS.white, FLOWERS.white, FLOWERS.gold];
    const put = (x, y, c, t) => {
      const i = ((y & 255) << 8) | (x & 255);
      BLOOM_T[i] = t; BLOOM_C[i * 3] = c[0]; BLOOM_C[i * 3 + 1] = c[1]; BLOOM_C[i * 3 + 2] = c[2];
    };
    for (let k = 0; k < 340; k++) {
      const cx = rng.int(0, 255), cy = rng.int(0, 255), F = rng.pick(sets), t = rng.int(20, 235), n = rng.int(3, 9);
      for (let j = 0; j < n; j++) {
        const x = cx + rng.int(-5, 5), y = cy + rng.int(-3, 3);
        put(x, y, F[2], t); put(x + 1, y, F[1], t); put(x, y + 1, F[0], t);
      }
    }
  }
  function makeRipples(seed) {
    RIPPLE = new Uint8Array(65536);
    const rng = U.rng(seed);
    for (let k = 0; k < 520; k++) {
      const x = rng.int(0, 255), y = rng.int(0, 255), len = rng.int(3, 11), kind = rng.chance(0.25) ? 3 : 1;
      for (let i = 0; i < len; i++) {
        RIPPLE[((y & 255) << 8) | ((x + i) & 255)] = (i === 0 || i === len - 1) && kind === 1 ? 2 : kind;
        if (kind === 1 && i > 0 && i < len - 1) RIPPLE[(((y + 1) & 255) << 8) | ((x + i) & 255)] = 4;
      }
    }
  }

  /* ---------- ground decals (small pixel sprites baked into the chunks) */
  const DEC = {};
  function decal(p, shadow = true) {
    // tiny cast shadow to the right on the lowest rows (same sun as everything else)
    if (shadow) {
      const add = [];
      for (let y = p.h - 3; y < p.h; y++) for (let x = 0; x < p.w; x++) {
        if (p.a(x, y) && !p.a(x + 1, y) && !(p.f[y * p.w + x] & NOOUT)) add.push(x + 1, y);
      }
      for (let i = 0; i < add.length; i += 2) p.set(add[i], add[i + 1], P.shadow, 90, NOOUT);
    }
    return p.canvas();
  }
  function tuftPix(rng, rmp, h0, h1, w) {
    const p = new Pix(w, h1 + 1);
    const n = rng.int(3, 5);
    for (let b = 0; b < n; b++) {
      const bx = Math.round((w - 1) * (b + 0.5) / n + rng.range(-0.6, 0.6));
      const hgt = rng.int(h0, h1), lean = rng.range(-1.2, 1.2);
      for (let k = 0; k < hgt; k++) {
        const t = k / (hgt - 1 || 1);
        const x = Math.round(bx + lean * t * t), y = h1 - k;
        const ci = clamp(Math.round(3 + t * (rmp.length - 4)), 0, rmp.length - 1);
        p.set(x, y, rmp[ci]);
      }
    }
    return p;
  }
  function flowerPix(rng, F, n, w, h) {
    const p = new Pix(w, h);
    for (let i = 0; i < n; i++) {
      const x = rng.int(1, w - 2), top = rng.int(1, h - 3), stem = h - 1 - top;
      for (let k = 1; k <= stem; k++) p.set(x, top + k, R.tops[k === stem ? 2 : 3]);
      const C = F === 'mix' ? rng.pick([FLOWERS.pink, FLOWERS.white, FLOWERS.lav, FLOWERS.peach]) : F;
      if (rng.chance(0.5)) {
        p.set(x, top - 1, C[2]); p.set(x - 1, top, C[2]); p.set(x + 1, top, C[1]); p.set(x, top + 1, C[0]); p.set(x, top, CENTER);
      } else {
        p.set(x, top, C[2]); p.set(x + 1, top, C[1]); p.set(x, top + 1, C[1]); p.set(x + 1, top + 1, C[0]);
      }
    }
    return p;
  }
  function lavPix(rng) {
    const h = rng.int(6, 8), p = new Pix(5, h + 1);
    const n = rng.int(1, 3);
    for (let s = 0; s < n; s++) {
      const x = 1 + s + rng.int(-1, 0), top = rng.int(0, 2);
      for (let y = top; y <= h; y++) {
        if (y < top + 4) { p.set(x, y, FLOWERS.lav[(y + s) % 2 ? 1 : 2]); if ((y - top) % 2 === 1) p.set(x + 1, y, FLOWERS.lav[0]); }
        else p.set(x, y, R.tops[3]);
      }
    }
    return p;
  }
  function cloverPix(rng) {
    const p = new Pix(8, 5);
    const n = rng.int(2, 4);
    for (let i = 0; i < n; i++) {
      const x = rng.int(1, 5), y = rng.int(1, 3);
      p.set(x, y, R.tops[6]); p.set(x + 1, y, R.tops[5]); p.set(x, y - 1, R.tops[7]); p.set(x + 1, y + 1, R.tops[4]); p.set(x - 1, y, R.tops[5]);
    }
    return p;
  }
  function fernPix(rng) {
    const w = 15, h = 10, p = new Pix(w, h), bx = 7, by = 9;
    const n = rng.int(3, 5);
    for (let f = 0; f < n; f++) {
      const ang = -Math.PI / 2 + (f - (n - 1) / 2) * rng.range(0.42, 0.6), len = rng.range(5.5, 8.5);
      let side = 0;
      for (let k = 1; k <= len; k++) {
        const t = k / len, a = ang + t * 0.45 * Math.sign(Math.cos(ang) || 1);
        const x = bx + Math.cos(a) * k, y = by + Math.sin(a) * k * 0.8 + t * t * 1.8;
        const ci = clamp(Math.round(2 + (1 - t) * 1 + (Math.cos(a) < 0 ? 2 : 0)), 0, 7);
        p.set(x, y, R.tops[ci]);
        if (k > 1 && k < len) {
          side ^= 1;
          p.set(x + (side ? 1 : -1), y + (side ? 0 : 0) - 1, R.tops[clamp(ci + 1, 0, 7)]);
        }
      }
    }
    return p;
  }
  function pebblePix(rng) {
    const p = new Pix(9, 6);
    const n = rng.int(1, 3);
    for (let i = 0; i < n; i++) p.blob(rng.range(2, 6.5), rng.range(2.5, 3.5), rng.range(1.2, 2.4), rng.range(1, 1.6), R.stone.slice(3, 10));
    return p;
  }
  function mossPix(rng) {
    const w = rng.int(7, 13), h = rng.int(4, 6), p = new Pix(w, h);
    const s = rng.int(0, 999);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - w / 2) / (w / 2), ny = (y + 0.5 - h / 2) / (h / 2);
      if (nx * nx + ny * ny > 1 - 0.45 * U.hash2(x, y, s)) continue;
      p.set(x, y, R.moss[clamp(Math.round(5 - (y / h) * 3 - nx * 0.6 + U.hash2(x, y, s + 1)), 1, 6)]);
    }
    return p;
  }
  function lilyPix(rng) {
    const w = rng.int(7, 9), h = 5, p = new Pix(w, h), cx = w / 2, cy = h / 2;
    const notch = rng.range(0, Math.PI * 2);
    p.blob(cx, cy, w / 2, h / 2, R.lily.slice(1), {
      mask: (x, y, nx, ny) => {
        let a = Math.atan2(ny, nx) - notch;
        a = Math.atan2(Math.sin(a), Math.cos(a));
        return Math.abs(a) > 0.32 || nx * nx + ny * ny < 0.08;
      },
    });
    if (rng.chance(0.35)) {
      const F = rng.chance(0.6) ? FLOWERS.pink : FLOWERS.white;
      const x = Math.round(cx + rng.range(-1, 1)), y = 1;
      p.set(x, y - 1, F[2]); p.set(x - 1, y, F[1]); p.set(x, y, CENTER); p.set(x + 1, y, F[0]); p.set(x, y + 1, F[1]);
    }
    return p;
  }
  function shroomDecal(rng) {
    const p = new Pix(9, 7);
    const n = rng.int(2, 3);
    for (let i = 0; i < n; i++) {
      const x = 1 + i * 3 + rng.int(0, 1), hgt = rng.int(2, 3), y = 6 - hgt;
      for (let k = 1; k <= hgt; k++) p.set(x, y + k, R.mstem[k === 1 ? 3 : 2]);
      p.set(x - 1, y, R.shroom[4], 255, EMIT); p.set(x, y, R.shroom[6], 255, EMIT); p.set(x + 1, y, R.shroom[3], 255, EMIT);
      p.set(x, y - 1, R.shroom[5], 255, EMIT);
    }
    return p;
  }
  function buildDecals() {
    const rng = U.rng(9001);
    DEC.tuft = []; DEC.tuftM = []; DEC.tuftF = [];
    for (let i = 0; i < 6; i++) {
      DEC.tuft.push(decal(tuftPix(rng, R.grass.slice(2), 3, 5, 7)));
      DEC.tuftM.push(decal(tuftPix(rng, R.meadow.slice(3), 3, 6, 7)));
      DEC.tuftF.push(decal(tuftPix(rng, R.tops.slice(0, 7), 2, 4, 6)));
    }
    DEC.flower = []; DEC.lav = []; DEC.daisy = []; DEC.clover = []; DEC.fern = []; DEC.pebble = []; DEC.moss = []; DEC.lily = []; DEC.shroom = [];
    for (let i = 0; i < 8; i++) DEC.flower.push(decal(flowerPix(rng, 'mix', rng.int(3, 5), 9, 7)));
    for (let i = 0; i < 5; i++) DEC.lav.push(decal(lavPix(rng)));
    for (let i = 0; i < 4; i++) DEC.daisy.push(decal(flowerPix(rng, rng.chance(0.6) ? FLOWERS.white : FLOWERS.gold, rng.int(1, 3), 7, 5)));
    for (let i = 0; i < 4; i++) DEC.clover.push(decal(cloverPix(rng), false));
    for (let i = 0; i < 5; i++) DEC.fern.push(decal(fernPix(rng)));
    for (let i = 0; i < 5; i++) DEC.pebble.push(decal(pebblePix(rng)));
    for (let i = 0; i < 5; i++) DEC.moss.push(decal(mossPix(rng), false));
    for (let i = 0; i < 6; i++) DEC.lily.push(decal(lilyPix(rng)));
    for (let i = 0; i < 4; i++) DEC.shroom.push(decal(shroomDecal(rng)));
  }

  function initGround() {
    FINE = new Float32Array(65536); CLUMP = new Float32Array(65536);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      FINE[(y << 8) | x] = (U.fbmTile(x / 16, y / 16, 16, 901, 3) - 0.5) * 2.2;
      CLUMP[(y << 8) | x] = (U.fbmTile(x / 5.12, y / 5.12, 50, 902, 2) - 0.5) * 2.2;
    }
    TEX.grassA = grassTex(101, R.grass, 3, 7, 1400);
    TEX.grassB = grassTex(202, R.grass, 3, 7, 1400);
    TEX.meadow = grassTex(303, R.meadow, 4, 8, 1700);
    TEX.forest = forestTex(404).data;
    TEX.stone = stoneTex(505).data;
    makeBlossoms(606);
    makeRipples(707);
    buildDecals();
  }

  function* renderGround(ctx, info) {
    const N = info.px, wx = info.wx, wy = info.wy;
    const M = 3, NN = N + 2 * M, GM = 24;
    const gx0 = Math.floor((wx - GM) / STEP), gy0 = Math.floor((wy - GM) / STEP);
    const gx1 = Math.floor((wx + N + GM) / STEP) + 1, gy1 = Math.floor((wy + N + GM) / STEP) + 1;
    const GW = gx1 - gx0 + 1, GH = gy1 - gy0 + 1;
    const grid = new Float32Array(GW * GH * NF);
    for (let j = 0; j < GH; j++) {
      for (let i = 0; i < GW; i++) fieldsAt((gx0 + i) * STEP, (gy0 + j) * STEP, grid, (j * GW + i) * NF);
      if ((j & 7) === 7) yield;
    }
    const gc = { grid, GW, gx0, gy0 };
    const mat = new Uint8Array(NN * NN), fld = new Float32Array(NN * NN * 4);
    const f = new Float32Array(NF);
    for (let py = 0; py < NN; py++) {
      const Y = wy - M + py;
      for (let px = 0; px < NN; px++) {
        const X = wx - M + px;
        sampleFields(gc, X, Y, f);
        const i = py * NN + px;
        mat[i] = classify(f, X, Y);
        fld[i * 4] = f[1]; fld[i * 4 + 1] = f[3]; fld[i * 4 + 2] = f[4]; fld[i * 4 + 3] = f[5];
      }
      if ((py & 31) === 31) yield;
    }
    // despeckle: drop 1px islands (reads raw, writes clean -> identical results in neighbouring chunks)
    {
      const raw = mat.slice();
      for (let py = 1; py < NN - 1; py++) for (let px = 1; px < NN - 1; px++) {
        const i = py * NN + px, m = raw[i], l = raw[i - 1], r = raw[i + 1], u = raw[i - NN], dn = raw[i + NN];
        if (l !== m && l === r && (u === l || dn === l)) mat[i] = l;
        else if (u !== m && u === dn && (l === u || r === u)) mat[i] = u;
      }
    }
    // coarse material map for the animated overlay (4 px cells)
    const cm = new Uint8Array(64 * 64);
    for (let j = 0; j < 64; j++) for (let i = 0; i < 64; i++) {
      const k = (j * 4 + 2 + M) * NN + (i * 4 + 2 + M);
      cm[j * 64 + i] = mat[k] === GRASS ? (fld[k * 4] > 0.6 ? 4 : 0) : mat[k];
    }
    matCache.set(info.cx + ',' + info.cy, cm);
    if (matCache.size > 160) matCache.delete(matCache.keys().next().value);

    const img = ctx.createImageData(N, N), d = img.data;
    const gA = TEX.grassA, gB = TEX.grassB, gM = TEX.meadow, gF = TEX.forest, gS = TEX.stone, WR = R.water;
    for (let py = 0; py < N; py++) {
      const Y = wy + py;
      for (let px = 0; px < N; px++) {
        const X = wx + px;
        const i = (py + M) * NN + (px + M), m = mat[i];
        const t = ((Y & 255) << 8) | (X & 255), t4 = t * 4;
        const fM = fld[i * 4], fW = fld[i * 4 + 1], fL = fld[i * 4 + 2], fV = fld[i * 4 + 3];
        const fn = FINE[t];
        let r, g, b;
        const u1 = mat[i - NN], u2 = mat[i - 2 * NN], d1 = mat[i + NN], l1 = mat[i - 1], l2 = mat[i - 2], r1 = mat[i + 1];
        const h = HGT[m];
        const hsh = U.hashInt(X, Y >> 2, 77) & 255;
        let tip = 0;
        if (m !== GRASS) {
          if (u1 === GRASS && hsh < 120) tip = 1;
          else if (u2 === GRASS && hsh < 46) tip = 2;
        }
        if (tip) {
          const c = tip === 1 ? R.grass[4] : R.grass[3];
          r = c[0]; g = c[1]; b = c[2];
        } else if (m === GRASS) {
          const T = fV + fn * 0.08 > 0.5 ? gB : gA;
          r = T[t4]; g = T[t4 + 1]; b = T[t4 + 2];
          const wm = sstep(0.555, 0.64, fM + fn * 0.05);
          if (wm > 0) {
            r += (gM[t4] - r) * wm; g += (gM[t4 + 1] - g) * wm; b += (gM[t4 + 2] - b) * wm;
            if (BLOOM_T[t] < wm * 255) { r = BLOOM_C[t * 3]; g = BLOOM_C[t * 3 + 1]; b = BLOOM_C[t * 3 + 2]; }
          }
        } else if (m === FOREST) {
          r = gF[t4]; g = gF[t4 + 1]; b = gF[t4 + 2];
        } else if (m === STONE) {
          r = gS[t4]; g = gS[t4 + 1]; b = gS[t4 + 2];
        } else {
          const dep = clamp((fW + fn * 0.05 - 0.69) / 0.07, 0, 1);
          const c = WR[clamp(Math.floor((1 - dep) * 7.99), 0, 7)];
          r = c[0]; g = c[1]; b = c[2];
          // dusk sky reflection in long soft bands
          const sky = sstep(0.55, 0.75, U.hash2(X >> 5, Y >> 2, 31) * 0.4 + (FINE[(((Y * 4) & 255) << 8) | (X & 255)] * 0.25 + 0.5));
          r += sky * 34; g += sky * 10; b += sky * 22;
          const rp_ = RIPPLE[t];
          if (rp_ === 1 || rp_ === 3) { const k = rp_ === 3 ? 0.62 : 0.32; r += (238 - r) * k; g += (196 - g) * k; b += (214 - b) * k; }
          else if (rp_ === 2) { r += (150 - r) * 0.2; g += (190 - g) * 0.2; b += (210 - b) * 0.2; }
          else if (rp_ === 4) { r *= 0.86; g *= 0.88; b *= 0.94; }
          if (dep < 0.22 && U.hash2(X >> 1, Y, 5) < 0.12) { r += 10; g += 14; b += 8; }
        }
        // ---- edges: overhangs, cast shadows, sunlit lips
        if (!tip) {
          let sh = 0;
          if (HGT[u1] > h) sh = 1; else if (HGT[u2] > h) sh = 0.5;
          if (HGT[l1] > h) sh = Math.max(sh, 0.6); else if (HGT[l2] > h) sh = Math.max(sh, 0.28);
          if (m === WATER) {
            if (u1 !== WATER) { r = 18; g = 24; b = 52; sh = 0; }
            else if (u2 !== WATER) sh = 0.7;
            else if (d1 !== WATER) { r += (170 - r) * 0.55; g += (222 - g) * 0.55; b += (214 - b) * 0.55; }
          }
          if (sh > 0) { const k = sh * 0.62; r += (r * 0.5 - r) * k; g += (g * 0.48 - g) * k; b += (b * 0.62 + 14 - b) * k; }
          if (HGT[d1] < h) {
            if (d1 === WATER) { r = 30; g = 22; b = 40; }
            else if (m === GRASS) { r *= 0.72; g *= 0.74; b *= 0.82; }
            else if (m === STONE) { const c = R.stone[1]; r = c[0]; g = c[1]; b = c[2]; }
          } else if (HGT[u1] < h && sh === 0) {
            if (m === GRASS) { r += (150 - r) * 0.42; g += (200 - g) * 0.42; b += (110 - b) * 0.42; }
            else if (m === STONE) { r += (190 - r) * 0.35; g += (170 - g) * 0.35; b += (180 - b) * 0.35; }
          } else if (HGT[l1] < h) { r *= 1.12; g *= 1.12; b *= 1.06; }
          else if (HGT[r1] < h) { r *= 0.86; g *= 0.86; b *= 0.92; }
        }
        // ---- macro light: dappled warm sun pools and cool shade
        const warm = sstep(0.56, 0.75, fL), cool = sstep(0.46, 0.28, fL);
        r *= 1 + 0.17 * warm - 0.1 * cool; g *= 1 + 0.07 * warm - 0.07 * cool; b *= 1 - 0.05 * warm + 0.06 * cool;
        const o = (py * N + px) * 4;
        d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
      }
      if ((py & 15) === 15) yield;
    }
    ctx.putImageData(img, 0, 0);
    yield;

    // ---- decals (deterministic per world cell -> seamless across chunks)
    const fd = new Float32Array(NF);
    const at = (x, y) => { const X = Math.floor(x), Y = Math.floor(y); sampleFields(gc, X, Y, fd); return classify(fd, X, Y); };
    const put = (img2, x, y) => ctx.drawImage(img2, Math.round(x - img2.width / 2), Math.round(y - img2.height + 1));
    // forest roots (procedural strokes)
    G.scatter(info, 64, 1301, 22, (x, y, rng) => {
      if (!rng.chance(0.55) || at(x, y) !== FOREST) return;
      let px = x, py = y, dir = rng.sign(), dy = rng.range(-0.25, 0.25);
      const len = rng.int(10, 24);
      for (let k = 0; k < len; k++) {
        const th = k < len * 0.45 ? 2 : 1;
        if (U.hash2(k, Math.round(px), 3) < 0.12) { px += dir; continue; } // half-buried gaps
        ctx.fillStyle = U.rgb(R.bark[6]); ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
        ctx.fillStyle = U.rgb(R.bark[th === 2 ? 4 : 3]); ctx.fillRect(Math.round(px), Math.round(py) + 1, 1, th);
        ctx.fillStyle = 'rgba(16,10,30,0.45)'; ctx.fillRect(Math.round(px), Math.round(py) + 1 + th, 1, 1);
        px += dir; py += dy + (rng.next() - 0.5) * 0.6;
        if (rng.chance(0.08)) dy = rng.range(-0.4, 0.4);
      }
    });
    yield;
    G.scatter(info, 15, 1302, 8, (x, y, rng) => {
      const m = at(x, y), v = rng.next();
      if (m === GRASS) {
        sampleFields(gc, Math.floor(x), Math.floor(y), fd);
        const meadow = fd[1] > 0.585;
        if (meadow) {
          if (v < 0.22) put(rng.pick(DEC.flower), x, y);
          else if (v < 0.36) put(rng.pick(DEC.lav), x, y);
          else if (v < 0.5) put(rng.pick(DEC.tuftM), x, y);
        } else {
          if (v < 0.2) put(rng.pick(DEC.tuft), x, y);
          else if (v < 0.25) put(rng.pick(DEC.daisy), x, y);
          else if (v < 0.29) put(rng.pick(DEC.clover), x, y);
          else if (v < 0.305) put(rng.pick(DEC.pebble), x, y);
        }
      } else if (m === FOREST) {
        if (v < 0.13) put(rng.pick(DEC.fern), x, y);
        else if (v < 0.2) put(rng.pick(DEC.tuftF), x, y);
        else if (v < 0.215) put(rng.pick(DEC.pebble), x, y);
      } else if (m === STONE) {
        if (v < 0.1) put(rng.pick(DEC.moss), x, y);
        else if (v < 0.15) put(rng.pick(DEC.tuft), x, y);
        else if (v < 0.18) put(rng.pick(DEC.pebble), x, y);
        else if (v < 0.2) put(rng.pick(DEC.daisy), x, y);
      } else if (m === WATER) {
        sampleFields(gc, Math.floor(x), Math.floor(y), fd);
        if (v < 0.2 && fd[3] > 0.705) put(rng.pick(DEC.lily), x, y);
      }
    });
    yield;
    // glowing mushrooms in the forest (baked soft halo)
    G.scatter(info, 70, 1303, 14, (x, y, rng) => {
      if (!rng.chance(0.4) || at(x, y) !== FOREST) return;
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, 'cyan', 9, x, y - 2, 0.35, true);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      put(rng.pick(DEC.shroom), x, y);
    });
    ctx.globalAlpha = 1;
  }

  /* =================================================================== props */
  const PROPS = {};
  function propSprite(r, o = {}) {
    const s = finish(r.p, Object.assign({ ox: r.ax, oy: r.ay }, o.fin || {}));
    s.sh = makeShadow(r.p, r.ax, r.ay, o.shadow || {});
    s.light = r.light || null;
    return s;
  }
  function treePix(seed, kind) {
    const rng = U.rng(seed);
    const birch = kind === 'birch', bloom = kind === 'bloom';
    const W = birch ? 70 : 104, H = birch ? 112 : 106;
    const p = new Pix(W, H);
    const bx = Math.floor(W / 2), by = H - 3;
    const lean = rng.range(-2.5, 2.5);
    const trunkTop = birch ? 30 : 40;
    const TR = birch ? R.birch : R.bark;
    // roots spreading over the ground
    const roots = birch ? 2 : rng.int(3, 4);
    for (let r = 0; r < roots; r++) {
      const dir = r % 2 ? 1 : -1, len = rng.int(birch ? 4 : 7, birch ? 6 : 13);
      let x = bx + dir * (birch ? 3 : 5) + (r > 1 ? dir * -2 : 0), y = by - rng.int(1, 2);
      for (let k = 0; k < len; k++) {
        const th = k < len * 0.5 ? 2 : 1;
        for (let q = 0; q < th; q++) p.set(x, y + q, TR[q === 0 ? 6 : 4]);
        p.set(x, y + th, TR[1]);
        x += dir; if (k % 3 === 2) y += 1;
      }
    }
    // trunk (cylinder shading, bark streaks or birch lenticels, moss on the shaded side)
    for (let y = trunkTop; y <= by; y++) {
      const t = (y - trunkTop) / (by - trunkTop);
      const cx = bx + lean * (1 - t);
      let hw = birch ? 2.4 + t * 0.9 : 3.8 + t * 2.4;
      if (t > 0.8) hw += Math.pow((t - 0.8) / 0.2, 2) * (birch ? 2 : 5);
      for (let x = Math.floor(cx - hw - 1); x <= Math.ceil(cx + hw); x++) {
        const nx = (x + 0.5 - cx) / hw;
        if (Math.abs(nx) > 1) continue;
        const nz = Math.sqrt(1 - nx * nx);
        let v = (nx * LDIR[0] + nz * LDIR[2]) * 0.55 + 0.42;
        if (birch) {
          if (U.hash2(Math.floor(y / 2), Math.floor((x - cx + 9) / 2), seed) < 0.14 && Math.abs(nx) < 0.92) v -= 0.5;
        } else v += (U.hash2(x, Math.floor((y + U.hash2(x, 0, seed) * 5) / 4), seed) - 0.5) * 0.22;
        p.set(x, y, TR[clamp(Math.floor(v * TR.length), 0, TR.length - 1)]);
        if (!birch && t > 0.5 && nx > 0.05 && U.fbm(x / 3, y / 3, seed, 2) > 0.54) p.set(x, y, R.moss[clamp(Math.floor(v * 6), 1, 5)]);
      }
    }
    // a couple of branches reaching into the canopy
    for (let b = 0; b < (birch ? 1 : 2); b++) {
      const dir = b ? 1 : -1, x0 = bx + lean, y0 = trunkTop + 8;
      for (let k = 0; k < (birch ? 7 : 12); k++) {
        const x = Math.round(x0 + dir * k * 0.9), y = Math.round(y0 - k * 0.8);
        p.set(x, y, TR[4]); p.set(x, y + 1, TR[2]);
      }
    }
    // layered canopy: many leaf clusters, top tier first so lower clusters overlap -> depth
    const ccx = bx + lean, ccy = birch ? 40 : 38, CRx = birch ? 30 : 44, CRy = birch ? 30 : 31;
    const balls = [];
    const n = birch ? 34 : 30;
    for (let i = 0; i < n; i++) {
      const a = rng.range(0, Math.PI * 2), d = Math.sqrt(rng.next()) * (birch ? 0.72 : 0.85);
      const r = birch ? rng.range(6, 9.5) : rng.range(8, 14);
      balls.push({ x: ccx + Math.cos(a) * d * (CRx - r * 0.7), y: ccy + Math.sin(a) * d * (CRy - r * 0.7), r });
    }
    const nb = birch ? 2 : 3;
    for (let i = 0; i < nb; i++) balls.push({ x: ccx + (i - (nb - 1) / 2) * (birch ? 14 : 20), y: ccy + CRy * 0.5, r: birch ? 7.5 : 13 });
    balls.sort((a, b) => a.y - b.y);
    const LR = bloom ? R.bloom : birch ? R.leafB.slice(0, 11) : R.leaf.slice(0, 12);
    canopy(p, balls, LR, ccx, ccy, CRx, CRy, seed, bloom ? R.leaf : null);
    // a few blossoms / golden leaves on the sunny side
    const nf = bloom ? 12 : birch ? 7 : 6;
    for (let i = 0; i < nf; i++) {
      const x = Math.round(ccx + rng.range(-CRx, CRx * 0.5)), y = Math.round(ccy + rng.range(-CRy, CRy * 0.6));
      if (!p.a(x, y) || !p.a(x + 1, y + 1)) continue;
      if (!bloom && !birch) break;
      if (birch) { p.set(x, y, R.leafB[10]); p.set(x + 1, y + 1, R.leafB[9]); continue; }
      const F = FLOWERS.white;
      p.set(x, y, F[2]); p.set(x + 1, y, F[1]); p.set(x, y + 1, F[1]); p.set(x + 1, y + 1, F[0]);
    }
    return { p, ax: bx, ay: by + 1 };
  }
  /** Painterly canopy: flat leaf clusters lit by the whole crown's normal, shaded undersides, leaf-clump texture. */
  const WO = {};
  function canopy(p, balls, LR, ccx, ccy, CRx, CRy, seed, alt) {
    const n = LR.length;
    for (const b of balls) {
      const bs = U.hashInt(Math.round(b.x * 7), Math.round(b.y * 13), seed);
      const ryb = b.r * 0.82;
      for (let y = Math.floor(b.y - ryb - 1); y <= Math.ceil(b.y + ryb); y++) for (let x = Math.floor(b.x - b.r - 1); x <= Math.ceil(b.x + b.r); x++) {
        const nx = (x + 0.5 - b.x) / b.r, ny = (y + 0.5 - b.y) / ryb, dd = nx * nx + ny * ny;
        if (dd > 1 - 0.34 * U.hash2(x >> 1, y >> 1, bs)) continue;
        const gx = (x + 0.5 - ccx) / CRx, gy = (y + 0.5 - ccy) / CRy;
        let v = 0.42 - gx * 0.24 - gy * 0.3;
        if (ny > 0.35) v -= (ny - 0.35) * 0.5;
        else if (ny < -0.45 && nx < 0.3) v += 0.07;
        // leaf-clump texture: small 3x2 'leaf' cells, each with its own lit top pixel row
        const lw = U.worley((x + 0.5) / 4.6, (y + 0.5) / 3.6, seed + 9, 0, WO);
        v += clamp((lw.y * 3.6 - y - 0.5) / 3.6, -0.6, 0.6) * 0.16 + clamp((lw.x * 4.6 - x - 0.5) / 4.6, -0.6, 0.6) * 0.06
          - (lw.f2 - lw.f1 < 0.12 ? 0.07 : 0) + (U.hash2(x, y, seed) - 0.5) * 0.03;
        const Rm = alt && U.hash2(x >> 1, y >> 1, seed + 5) < 0.035 ? alt : LR;
        p.set(x, y, Rm[clamp(Math.floor(v * Rm.length), 0, Rm.length - 1)]);
      }
    }
  }
  function rockPix(seed, w, h) {
    const rng = U.rng(seed), W = w + 2, H = h + 2, p = new Pix(W, H);
    const cx = W / 2, cy = H - h * 0.48 - 1, rx = w / 2, ry = h * 0.55;
    p.blob(cx, cy, rx, ry, R.stone.slice(2), {
      edge: (x, y) => 1 - 0.16 * U.hash2(x >> 1, y >> 1, seed),
      mask: (x, y) => y < H - 1,
      tex: (x, y, nx) => (U.hash2(x >> 1, y >> 1, seed + 1) - 0.5) * 0.1 + (Math.floor((nx + 1) * 2.2) % 2 ? 0.05 : -0.03),
    });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!p.a(x, y)) continue;
      const ny = (y + 0.5 - cy) / ry, nx = (x + 0.5 - cx) / rx;
      if (ny < -0.05 + (U.fbm(x / 3, y / 3, seed, 2) - 0.5) * 1.2 - nx * 0.25) {
        p.set(x, y, R.moss[clamp(Math.round(5 - (ny + 1) * 2 - nx * 1.2 + (U.hash2(x, y, seed) - 0.5)), 1, 7)]);
        if (U.hash2(x, y, seed + 9) < 0.035) p.set(x, y, rng.pick([FLOWERS.white, FLOWERS.pink, FLOWERS.gold])[2]);
      }
    }
    return { p, ax: Math.floor(W / 2), ay: H - 1 };
  }
  function ivy(p, rng, x, y0, y1) {
    let side = 0;
    for (let y = y0; y > y1; y--) {
      if (rng.chance(0.3)) x += rng.sign();
      p.set(x, y, R.tops[2]);
      if ((y0 - y) % 3 === 1) {
        side ^= 1;
        const lx = x + (side ? 1 : -1);
        p.set(lx, y, R.tops[side ? 4 : 5]); p.set(lx + (side ? 1 : -1), y - 1, R.tops[side ? 3 : 6]);
      }
    }
  }
  function stoneShade(p, x, y, v) { p.set(x, y, R.stone[clamp(Math.floor(v * 10), 1, 10)]); }
  function pillarPix(seed, hgt, broken, rune) {
    const rng = U.rng(seed), W = 20, H = hgt + 9, p = new Pix(W, H), cx = 10;
    const base = H - 5, topY = base - hgt;
    for (let y = base; y < H; y++) for (let x = 2; x < 18; x++) {
      let v = y === base ? 0.86 : y === base + 1 ? 0.66 : 0.5 - (y - base) * 0.04;
      if (x === 2) v += 0.08; if (x === 17) v -= 0.16; if (y === H - 1) v -= 0.18;
      stoneShade(p, x, y, v + (U.hash2(x, y, seed) - 0.5) * 0.06);
    }
    const brk = [];
    for (let x = 0; x < W; x++) brk[x] = broken ? Math.round(Math.abs(Math.sin(x * 0.8 + seed)) * rng.range(1, 6)) : 0;
    for (let x = 4; x < 16; x++) {
      const nx = (x + 0.5 - cx) / 6, nz = Math.sqrt(Math.max(0, 1 - nx * nx));
      let b = (nx * LDIR[0] + nz * LDIR[2]) * 0.5 + 0.42;
      if ((x - 4) % 3 === 2) b -= 0.1;
      for (let y = topY + brk[x]; y < base; y++) {
        let v = b + (U.hash2(x, y >> 1, seed) - 0.5) * 0.07;
        if (y === topY + brk[x]) v += broken ? 0.28 : 0.2;
        stoneShade(p, x, y, v);
      }
    }
    if (!broken) {
      for (let y = topY - 4; y < topY; y++) for (let x = 2; x < 18; x++) {
        let v = y === topY - 4 ? 0.9 : y === topY - 1 ? 0.38 : 0.62;
        if (x === 2) v += 0.08; if (x === 17) v -= 0.16;
        stoneShade(p, x, y, v);
      }
    }
    // moss on top and at the foot, ivy climbing up
    const top = broken ? topY : topY - 4;
    for (let y = top; y < H; y++) for (let x = 0; x < W; x++) {
      if (!p.a(x, y)) continue;
      const nearTop = y - top < 3 + U.hash2(x, 1, seed) * 3, nearFoot = y > base - 3 - U.hash2(x, 2, seed) * 5;
      if ((nearTop || nearFoot) && U.fbm(x / 2.5, y / 2.5, seed + 3, 2) > 0.5) p.set(x, y, R.moss[clamp(nearTop ? 5 - (y - top) : 3, 2, 6)]);
    }
    ivy(p, rng, rng.chance(0.5) ? 5 : 13, base - 1, base - Math.round(hgt * rng.range(0.4, 0.85)));
    if (rune) {
      const ry = topY + 8 + rng.int(0, 4), gx = cx;
      const G1 = R.shroom[5], G2 = R.shroom[6];
      for (let k = 0; k < 7; k++) p.set(gx, ry + k, k === 3 ? G2 : G1, 255, EMIT);
      p.set(gx - 1, ry + 1, G1, 255, EMIT); p.set(gx - 2, ry, G1, 255, EMIT); p.set(gx + 1, ry + 1, G1, 255, EMIT); p.set(gx + 2, ry, G1, 255, EMIT);
      p.set(gx - 1, ry + 5, G1, 255, EMIT); p.set(gx + 1, ry + 5, G1, 255, EMIT);
    }
    return { p, ax: cx, ay: H - 1, light: rune ? { type: 'cyan', dx: 0, dy: -(H - 1 - (topY + 11)), r: 12, a: 0.4, ground: 0 } : null };
  }
  function archPix(seed, broken) {
    const rng = U.rng(seed), W = 76, H = 70, p = new Pix(W, H), cx = 38, ay = 30, Ro = 31, Ri = 21;
    const base = H - 5;
    for (const px0 of [5, 59]) {
      for (let y = base; y < H; y++) for (let x = px0 - 2; x < px0 + 14; x++) {
        let v = y === base ? 0.86 : 0.55 - (y - base) * 0.05; if (x === px0 - 2) v += 0.08; if (x === px0 + 13) v -= 0.16;
        stoneShade(p, x, y, v);
      }
      const ptop = broken && px0 > 30 ? ay + 10 : ay;
      for (let x = px0; x < px0 + 12; x++) {
        const nx = (x + 0.5 - (px0 + 6)) / 6, nz = Math.sqrt(Math.max(0, 1 - nx * nx));
        const b = (nx * LDIR[0] + nz * LDIR[2]) * 0.5 + 0.42;
        for (let y = ptop; y < base; y++) {
          const blk = ((y - ptop) % 9 === 0) ? -0.16 : 0;
          stoneShade(p, x, y, b + blk + (U.hash2(x, y >> 1, seed) - 0.5) * 0.06);
        }
      }
    }
    // voussoirs
    for (let y = 0; y <= ay; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - ay, r = Math.sqrt(dx * dx + dy * dy);
      if (r < Ri || r > Ro) continue;
      const ang = Math.atan2(-dy, dx); // 0..pi
      if (broken && ang < 0.95 + Math.sin(r) * 0.08) continue;
      const seg = ang / (Math.PI / 11), joint = seg - Math.floor(seg) < 0.09;
      let v = 0.5 + (-dx / r) * 0.18 + (r > Ro - 1.5 ? 0.3 : 0) + (r < Ri + 1 ? -0.22 : 0) + (U.hash2(Math.floor(seg), 3, seed) - 0.5) * 0.1;
      if (joint) v -= 0.25;
      stoneShade(p, x, y, v);
    }
    // moss on the crown, hanging ivy from the soffit
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!p.a(x, y)) continue;
      const dx = x + 0.5 - cx, dy = y + 0.5 - ay, r = Math.sqrt(dx * dx + dy * dy);
      if (y <= ay && r > Ro - 3 && U.fbm(x / 3, y / 3, seed, 2) > 0.48) p.set(x, y, R.moss[clamp(Math.round(6 - (Ro - r) * 1.2), 2, 7)]);
    }
    for (let k = 0; k < 5; k++) {
      const ang = rng.range(broken ? 1.3 : 0.4, 2.7), x = Math.round(cx + Math.cos(ang) * Ri), y0 = Math.round(ay - Math.sin(ang) * Ri);
      const len = rng.int(4, 13);
      for (let q = 0; q < len; q++) { p.set(x, y0 + q, R.tops[2]); if (q % 3 === 1) { p.set(x - 1, y0 + q, R.tops[5]); p.set(x + 1, y0 + q + 1, R.tops[3]); } }
    }
    ivy(p, rng, 7, base - 1, base - 20);
    if (broken) {
      // fallen block at the foot of the broken side
      p.blob(66, H - 4, 5, 3.4, R.stone.slice(3), {});
    }
    return { p, ax: cx, ay: H - 1 };
  }
  function lanternPix(seed) {
    const W = 16, H = 31, p = new Pix(W, H), cx = 8;
    const sv = (x, y, v) => stoneShade(p, x, y, v + (U.hash2(x, y, seed) - 0.5) * 0.06);
    for (let y = 26; y < 31; y++) for (let x = 3; x < 13; x++) sv(x, y, y === 26 ? 0.84 : 0.56 - (x - 3) * 0.02 - (y === 30 ? 0.15 : 0));
    for (let y = 17; y < 26; y++) for (let x = 5; x < 11; x++) sv(x, y, 0.62 - (x - 5) * 0.06);
    for (let y = 15; y < 17; y++) for (let x = 3; x < 13; x++) sv(x, y, y === 15 ? 0.82 : 0.48);
    for (let y = 8; y < 15; y++) for (let x = 3; x < 13; x++) {
      if (x >= 5 && x <= 10 && y >= 9 && y <= 13) {
        const c = R.flame[clamp(4 - Math.round(Math.abs(x - 7.5) * 0.8 + Math.abs(y - 11.5) * 0.6), 1, 4)];
        p.set(x, y, (x === 7 || x === 8) && y === 9 ? R.stone[3] : c, 255, EMIT);
      } else sv(x, y, 0.64 - (x - 3) * 0.035);
    }
    const roof = [[7, 0, 16], [6, 1, 15], [5, 3, 13], [4, 5, 11]];
    for (const [y, a, b] of roof) for (let x = a; x < b; x++) sv(x, y, y === 4 ? 0.9 : y === 7 ? 0.4 : 0.72 - (x - a) * 0.025);
    for (let y = 1; y < 4; y++) { sv(7, y, 0.8); sv(8, y, 0.55); }
    for (let x = 1; x < 15; x++) if (U.hash2(x, 5, seed) < 0.55) p.set(x, 6 - (U.hash2(x, 6, seed) < 0.4 ? 1 : 0), R.moss[U.hash2(x, 7, seed) < 0.5 ? 4 : 5]);
    return { p, ax: cx, ay: H - 1, light: { type: 'warm', dx: 0, dy: -(H - 1 - 11), r: 16, a: 0.6, ground: 34, flicker: 1 } };
  }
  function shroomPix(seed) {
    const rng = U.rng(seed), W = 26, H = 22, p = new Pix(W, H);
    const n = rng.int(3, 4), ms = [];
    for (let i = 0; i < n; i++) ms.push({ x: 5 + i * 5 + rng.int(-1, 1), h: i === 1 ? rng.int(9, 12) : rng.int(4, 8), r: 0 });
    ms.forEach((m) => (m.r = 2.2 + m.h * 0.35));
    ms.sort((a, b) => b.h - a.h);
    for (const m of ms) {
      const top = H - 1 - m.h, sw = m.h > 7 ? 2 : 1;
      for (let y = top; y < H; y++) for (let k = 0; k < sw; k++) p.set(m.x + k, y, R.mstem[clamp(2 - k - (y > H - 3 ? 1 : 0) + (y < top + 3 ? 0 : 0), 0, 4)]);
      const cx = m.x + sw / 2, cy = top + 0.5;
      p.blob(cx, cy, m.r, m.r * 0.72, R.shroom, { mask: (x, y) => y <= top, bias: -0.2, k: 1.3, top: 2 });
      for (let x = Math.ceil(cx - m.r) + 1; x < cx + m.r - 1; x++) p.set(x, top + 1, (x & 1) ? R.shroom[6] : R.shroom[5], 255, EMIT);
      for (let s = 0; s < 3; s++) { const sx = Math.round(cx + rng.range(-m.r * 0.6, m.r * 0.4)), sy = Math.round(cy - rng.range(0.5, m.r * 0.5)); if (p.a(sx, sy)) p.set(sx, sy, R.shroom[7], 255, EMIT); }
    }
    return { p, ax: Math.floor(W / 2), ay: H - 1, light: { type: 'cyan', dx: 0, dy: -8, r: 14, a: 0.3, ground: 30, pulse: 1 } };
  }
  function bushPix(seed, kind) {
    const rng = U.rng(seed), W = 30, H = 21, p = new Pix(W, H);
    const balls = [];
    for (let i = 0; i < 7; i++) balls.push({ x: 15 + rng.range(-8, 8), y: 12 + rng.range(-4, 3), r: rng.range(4.5, 7) });
    balls.sort((a, b) => a.y - b.y);
    for (const b of balls) {
      const bs = rng.int(0, 999);
      p.blob(b.x, b.y, b.r, b.r * 0.85, R.leaf, {
        edge: (x, y) => 1 - 0.22 * U.hash2(x >> 1, y >> 1, bs),
        mask: (x, y) => y < H - 1,
        tex: (x, y, nx, ny) => ((x + 0.5 - 15) / 15 * LDIR[0] + (y - 12) / 9 * LDIR[1]) * 0.35 + (U.hash2(x >> 1, y >> 1, seed) - 0.5) * 0.12 - 0.04,
      });
    }
    const nb = rng.int(7, 11);
    for (let i = 0; i < nb; i++) {
      const x = Math.round(15 + rng.range(-9, 7)), y = Math.round(12 + rng.range(-5, 4));
      if (!p.a(x, y) || !p.a(x + 1, y + 1)) continue;
      if (kind === 'berry') {
        p.set(x, y, R.berry[4], 255, NORIM); p.set(x + 1, y, R.berry[3]); p.set(x, y + 1, R.berry[3]); p.set(x + 1, y + 1, R.berry[1]);
        if (rng.chance(0.4)) p.set(x, y, R.berry[5], 255, NORIM);
      } else {
        const F = kind === 'rose' ? FLOWERS.pink : FLOWERS.white;
        p.set(x, y - 1, F[2]); p.set(x - 1, y, F[1]); p.set(x, y, CENTER); p.set(x + 1, y, F[1]); p.set(x, y + 1, F[0]);
      }
    }
    return { p, ax: 15, ay: H - 1 };
  }
  function lupinePix(seed) {
    const rng = U.rng(seed), W = 16, H = 26, p = new Pix(W, H);
    const n = rng.int(2, 3);
    const F = rng.pick([[FLOWERS.lav, FLOWERS.pink], [FLOWERS.pink, FLOWERS.white], [FLOWERS.lav, FLOWERS.lav]]);
    for (let i = 0; i < n; i++) {
      const x = 4 + i * 4 + rng.int(-1, 1), top = rng.int(1, 8), fl = rng.int(8, 11);
      for (let y = top; y < H; y++) p.set(x, y, R.tops[2]);
      for (let k = 0; k < fl; k++) {
        const y = top + k, t = k / fl, C = t < 0.4 ? F[1] : F[0];
        const wdt = k < 2 ? 0 : 1;
        p.set(x, y, C[k % 2 ? 1 : 2]);
        if (wdt) { p.set(x - 1, y, C[k % 2 ? 2 : 1]); p.set(x + 1, y, C[0]); }
      }
    }
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI * (0.12 + k * 0.15), len = rng.int(3, 5), x0 = 7, y0 = H - 2;
      for (let q = 1; q <= len; q++) p.set(Math.round(x0 + Math.cos(a) * q * 1.4), Math.round(y0 + Math.sin(a) * q * 0.7), R.tops[q === len ? 5 : 3]);
    }
    return { p, ax: 7, ay: H - 1 };
  }
  function bigFernPix(seed) {
    const rng = U.rng(seed), W = 30, H = 18, p = new Pix(W, H), bx = 15, by = H - 1;
    const n = rng.int(5, 7);
    for (let f = 0; f < n; f++) {
      const ang = -Math.PI / 2 + (f - (n - 1) / 2) * rng.range(0.36, 0.46), len = rng.range(10, 14);
      let side = 0;
      for (let k = 1; k <= len; k++) {
        const t = k / len, a = ang + t * 0.55 * Math.sign(Math.cos(ang) || 1);
        const x = bx + Math.cos(a) * k * 1.05, y = by + Math.sin(a) * k * 0.82 + t * t * 3.2;
        const lit = Math.cos(a) < 0 ? 1 : 0;
        p.set(x, y, R.tops[clamp(2 + lit + Math.round((1 - t) * 1), 0, 7)]);
        if (k > 1 && k < len - 1) {
          side ^= 1;
          const ox = side ? 1 : -1;
          p.set(x + ox, y - 1, R.tops[clamp(3 + lit + side, 0, 7)]);
          if (t < 0.7) p.set(x + ox * 2, y - 1, R.tops[clamp(2 + lit + side, 0, 7)]);
        }
      }
    }
    return { p, ax: bx, ay: by };
  }
  function buildProps() {
    const tree = (seed, kind) => propSprite(treePix(seed, kind), { fin: { rim: P.rimLeaf, rimA: 0.5, coolA: 0.26 }, shadow: { kx: 0.78, ky: 0.28, alpha: 0.3 } });
    PROPS.oak = [tree(11, 'oak'), tree(12, 'oak'), tree(13, 'oak')];
    PROPS.bloom = [tree(21, 'bloom'), tree(22, 'bloom')];
    PROPS.birch = [tree(31, 'birch'), tree(32, 'birch')];
    PROPS.rock = [propSprite(rockPix(41, 22, 14)), propSprite(rockPix(42, 16, 11)), propSprite(rockPix(43, 28, 17))];
    PROPS.pillar = [propSprite(pillarPix(51, 34, true, false)), propSprite(pillarPix(52, 46, false, true)), propSprite(pillarPix(53, 22, true, false)), propSprite(pillarPix(54, 40, false, false))];
    PROPS.arch = [propSprite(archPix(61, false), { shadow: { kx: 0.8, ky: 0.28 } }), propSprite(archPix(62, true), { shadow: { kx: 0.8, ky: 0.28 } })];
    PROPS.lantern = [propSprite(lanternPix(71)), propSprite(lanternPix(72))];
    PROPS.shroom = [propSprite(shroomPix(81), { fin: { rimA: 0.25 } }), propSprite(shroomPix(82), { fin: { rimA: 0.25 } }), propSprite(shroomPix(83), { fin: { rimA: 0.25 } })];
    PROPS.bush = [propSprite(bushPix(91, 'berry'), { fin: { rim: P.rimLeaf, rimA: 0.45 } }), propSprite(bushPix(92, 'white'), { fin: { rim: P.rimLeaf, rimA: 0.45 } }), propSprite(bushPix(93, 'berry'), { fin: { rim: P.rimLeaf, rimA: 0.45 } }), propSprite(bushPix(94, 'rose'), { fin: { rim: P.rimLeaf, rimA: 0.45 } })];
    PROPS.lupine = [propSprite(lupinePix(101), { fin: { rimA: 0.3 } }), propSprite(lupinePix(102), { fin: { rimA: 0.3 } }), propSprite(lupinePix(103), { fin: { rimA: 0.3 } })];
    PROPS.fern = [propSprite(bigFernPix(111), { fin: { rim: P.rimLeaf, rimA: 0.35 } }), propSprite(bigFernPix(112), { fin: { rim: P.rimLeaf, rimA: 0.35 } })];
  }

  /* =================================================================== characters */
  const SPR = {};
  const WHITE = '#fff8f0';
  function variants(pix, o) {
    const r = finish(pix, o), l = finish(pix.flip(), Object.assign({}, o, { ox: pix.w - (o.ox !== undefined ? o.ox : pix.w / 2) }));
    return [r, l];
  }
  function withFlash(s) { s.fl = { c: U.tint(s.c, WHITE, 1), ox: s.ox, oy: s.oy }; return s; }

  function leafStroke(p, x0, y0, ang, len, wid, rmp, bend) {
    for (let k = 0; k <= len * 2; k++) {
      const t = k / (len * 2), a = ang + bend * t;
      const x = x0 + Math.cos(ang) * t * len + Math.cos(a) * 0.0, y = y0 + Math.sin(ang) * t * len + bend * t * t * 3;
      const w = wid * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7);
      const ci = clamp(Math.round(2 + t * 3), 0, rmp.length - 1);
      p.set(x, y, rmp[ci]);
      if (w > 0.8) {
        const px = -Math.sin(ang), py = Math.cos(ang);
        p.set(x + px, y + py, rmp[clamp(ci - 1, 0, rmp.length - 1)]);
        p.set(x - px, y - py, rmp[clamp(ci + 1, 0, rmp.length - 1)]);
      }
    }
  }

  /* ---------- Jack: pumpkin head with soft inner glow, little teal hooded cape, satchel */
  function jackPix(mode, k, throwing) {
    const W = 26, H = 32, p = new Pix(W, H), cx = 13, FY = 31;
    let bob = 0, hb = 0, ax = 1, bx = -1, al = 0, bl = 0, arm = 0, hem = 0;
    if (mode === 1) {
      bob = [1, 0, 0, 1, 0, 0][k]; hb = [1, 1, 0, 1, 1, 0][k];
      ax = [2, 1, -1, -2, -1, 1][k]; bx = -ax; al = [0, 0, 0, 0, 1, 1][k]; bl = [0, 1, 1, 0, 0, 0][k];
      arm = [-1, -1, 0, 1, 1, 0][k]; hem = [0, -1, -1, 0, -1, -1][k];
    } else {
      bob = [0, 0, 1, 1][k]; hb = [0, 0, 0, 1][k]; hem = [0, -1, -1, 0][k];
    }
    // legs + boots
    const leg = (lx, lift, dk) => {
      const x0 = cx - 1 + lx;
      for (let y = 24 + bob; y <= FY - 2 - lift; y++) { p.set(x0, y, R.pants[3 - dk]); p.set(x0 + 1, y, R.pants[2 - dk]); }
      const by = FY - lift;
      p.set(x0, by - 1, R.leather[3 - dk]); p.set(x0 + 1, by - 1, R.leather[2 - dk]);
      p.set(x0, by, R.leather[2 - dk]); p.set(x0 + 1, by, R.leather[2 - dk]); p.set(x0 + 2, by, R.leather[1 - dk]);
    };
    leg(bx - 1, bl, 1);
    leg(ax, al, 0);
    // hood bunched behind the head
    const top = 14 + bob, hemY = 25 + bob;
    p.blob(cx - 5, top + 1, 3.4, 3, R.cape, { bias: -0.08 });
    // cape body
    for (let y = top; y <= hemY; y++) {
      const t = (y - top) / (hemY - top);
      const hw = 3.8 + t * 3.4;
      const ccx = cx - 0.5 - t * 0.9 + (y >= hemY - 2 ? hem : 0);
      for (let x = Math.floor(ccx - hw - 1); x <= Math.ceil(ccx + hw); x++) {
        const nx = (x + 0.5 - ccx) / hw;
        if (Math.abs(nx) > 1) continue;
        if (y === hemY && (x + k) % 3 === 0) continue;
        const nz = Math.sqrt(1 - nx * nx);
        let v = (nx * LDIR[0] - 0.15 * LDIR[1] + nz * LDIR[2]) * 0.5 + 0.5 - t * 0.1;
        if ((x - Math.round(ccx) + 40) % 4 === 1 && t > 0.3) v -= 0.08;
        let c = R.cape[clamp(Math.floor(v * 8), 0, 7)];
        if (nx > 0.7 && t > 0.35) c = mix(hx('#7a2f5a'), hx('#c45a7a'), clamp(1 - t, 0, 1)); // magenta lining at the front edge
        p.set(x, y, c);
      }
    }
    // satchel strap + bag on the back hip
    for (let i = 0; i <= 6; i++) p.set(cx + 3 - i, top + i, R.leather[i < 2 ? 4 : 3]);
    for (let y = top + 6; y <= top + 9; y++) for (let x = cx - 8; x <= cx - 4; x++) {
      const v = y === top + 6 ? 4 : y === top + 9 ? 1 : x === cx - 8 ? 3 : 2;
      p.set(x, y, R.leather[v]);
    }
    p.set(cx - 6, top + 7, R.gold[4]); p.set(cx - 6, top + 6, R.gold[3]);
    // clasp
    p.set(cx + 1, top + 1, R.gold[4]); p.set(cx + 2, top + 1, R.gold[3]);
    // near arm
    if (throwing) {
      for (let x = cx + 3; x <= cx + 7; x++) { p.set(x, top + 2, R.cape[5]); p.set(x, top + 3, R.cape[3]); }
      p.set(cx + 8, top + 1, R.leather[3]); p.set(cx + 9, top + 1, R.leather[2]); p.set(cx + 8, top + 2, R.leather[2]); p.set(cx + 9, top + 2, R.leather[1]);
    } else {
      for (let y = top + 2; y <= top + 6; y++) { const ox = y > top + 4 ? arm : 0; p.set(cx + 3 + ox, y, R.cape[5]); p.set(cx + 4 + ox, y, R.cape[3]); }
      p.set(cx + 3 + arm, top + 7, R.leather[3]); p.set(cx + 4 + arm, top + 7, R.leather[2]);
    }
    // pumpkin head
    const hcx = cx + 0.5, hcy = 8.5 + hb, rx = 7.6, ry = 6.4;
    const RIBS = [-0.62, -0.22, 0.2, 0.6];
    p.blob(hcx, hcy, rx, ry, R.pumpkin, {
      tex: (x, y, nx, ny) => {
        const lon = nx / Math.sqrt(Math.max(0.08, 1 - ny * ny));
        let g = 0;
        for (const r of RIBS) if (Math.abs(lon - r) < 0.085) g = -0.16;
        return g + (ny < -0.75 ? -0.06 : 0) - 0.03;
      },
    });
    // stem + leaf
    const ty = Math.round(hcy - ry);
    p.set(hcx - 1, ty, R.stem[2]); p.set(hcx - 1, ty - 1, R.stem[3]); p.set(hcx - 2, ty - 2, R.stem[3]); p.set(hcx - 1, ty - 2, R.stem[4]);
    p.set(hcx - 3, ty - 2, R.stem[2]);
    p.set(hcx, ty - 1, R.tops[5]); p.set(hcx + 1, ty - 1, R.tops[6]); p.set(hcx + 1, ty - 2, R.tops[4]); p.set(hcx + 2, ty - 2, R.tops[5]);
    // carved face (3/4 view, emissive)
    const fx = Math.round(hcx + 1), fy = Math.round(hcy);
    const G0 = hx('#fff6c4'), G1 = hx('#ffd05a'), G2 = hx('#ff9a2e'), G3 = hx('#d4581e');
    const em = (x, y, c) => p.set(x, y, c, 255, EMIT);
    // eyes: upward triangles
    em(fx - 3, fy - 2, G1); em(fx - 4, fy - 1, G2); em(fx - 3, fy - 1, G0); em(fx - 2, fy - 1, G1);
    em(fx + 2, fy - 2, G1); em(fx + 1, fy - 1, G1); em(fx + 2, fy - 1, G0); em(fx + 3, fy - 1, G2);
    // jagged grin
    em(fx - 5, fy + 1, G2); em(fx + 4, fy + 1, G2);
    for (let x = fx - 4; x <= fx + 3; x++) em(x, fy + 2, x === fx - 1 ? G2 : (x === fx - 2 || x === fx) ? G0 : G1);
    for (let x = fx - 3; x <= fx + 2; x++) if (x !== fx - 1 && x !== fx + 1) em(x, fy + 3, G3);
    em(fx - 1, fy + 1, G1);
    // carved rind around every glowing hole: deep cut wall above/left (in shade), thin dark rim at the sides/below
    const cut = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if ((p.f[i] & EMIT) || !p.a(x, y) || y > hcy + ry) continue;
      const E = (dx, dy) => (p.f[(y + dy) * W + x + dx] & EMIT) !== 0;
      if (E(0, 1)) cut.push(x, y, 0);
      else if (E(1, 0) || E(-1, 0)) cut.push(x, y, 1);
      else if (E(0, -1)) cut.push(x, y, 2);
    }
    for (let i = 0; i < cut.length; i += 3) p.set(cut[i], cut[i + 1], R.pumpkin[cut[i + 2] === 2 ? 2 : cut[i + 2]]);
    return p;
  }

  /* ---------- Rüben-Schleicher: glossy violet turnip with a leaf crown, root legs and angry glowing eyes */
  function creeperPix(k, variant) {
    const W = 24, H = 28, p = new Pix(W, H), cx = 12;
    const bob = [0, 1, 0, 0, 1, 0][k], tilt = [0, 1, 1, 0, -1, -1][k];
    const al = [0, 1, 1, 0, 0, 0][k], bl = [0, 0, 0, 0, 1, 1][k];
    const TR = variant ? R.turnipM : R.turnip;
    const bcx = cx, bcy = 15.5 + bob, rx = 7.6, ry = 7.1;
    // root legs
    const leg = (x0, lift, dk) => {
      for (let y = Math.round(bcy + 4); y <= H - 2 - lift; y++) { p.set(x0, y, R.rbody[4 - dk]); p.set(x0 + 1, y, R.rbody[3 - dk]); }
      p.set(x0, H - 1 - lift, R.rbody[3 - dk]); p.set(x0 + 1, H - 1 - lift, R.rbody[3 - dk]); p.set(x0 + 2, H - 1 - lift, R.rbody[2 - dk]);
    };
    leg(cx - 4, bl, 1);
    leg(cx + 1, al, 0);
    // tail root
    p.set(cx - 1, Math.round(bcy + ry), R.rbody[3]); p.set(cx - 2, Math.round(bcy + ry) + 1, R.rbody[2]);
    // bulb (pointed turnip, sheared for the waddle), violet top fading into cream
    for (let y = Math.floor(bcy - ry - 1); y <= Math.ceil(bcy + ry + 1); y++) {
      const sh = tilt * clamp((bcy - y) / ry, 0, 1);
      for (let x = 0; x < W; x++) {
        const ny = (y + 0.5 - bcy) / ry;
        const rxe = rx * (1 - Math.pow(Math.max(0, ny), 2) * 0.38);
        const nx = (x + 0.5 - bcx - sh) / rxe, dd = nx * nx + ny * ny;
        if (dd > 1) continue;
        const nz = Math.sqrt(1 - dd);
        const v = (nx * LDIR[0] + ny * LDIR[1] + nz * LDIR[2]) * 0.55 + 0.36;
        const split = bcy + 1.5 + Math.sin(x * 1.3 + variant * 2) * 0.8;
        let top = y + 0.5 < split;
        if (Math.abs(y + 0.5 - split) < 0.9 && (x + y) % 2 === 0) top = !top;
        const Rm = top ? TR : R.rbody;
        p.set(x, y, Rm[clamp(Math.floor(v * Rm.length), 0, Rm.length - 2)]);
      }
    }
    // gloss
    const gx = Math.round(bcx - 4 + tilt), gy = Math.round(bcy - 4);
    p.set(gx, gy, hx('#ffeefa'), 255, NORIM); p.set(gx + 1, gy, TR[8], 255, NORIM); p.set(gx, gy + 1, TR[7], 255, NORIM);
    // leaf crown
    const lx = bcx + tilt + 0.5, ly = bcy - ry + 1;
    const sw = [0, 1, 1, 0, -1, -1][k] * 0.15;
    leafStroke(p, lx - 1, ly, -Math.PI * 0.72 + sw, 6, 1.2, R.tops, -0.3);
    leafStroke(p, lx + 1, ly, -Math.PI * 0.3 + sw, 6, 1.2, R.tops, -0.3);
    leafStroke(p, lx, ly, -Math.PI * 0.5 + sw, 8, 1.4, R.tops, -0.2);
    p.set(lx, ly + 1, TR[2]); p.set(lx - 1, ly + 1, TR[3]); p.set(lx + 1, ly + 1, TR[2]);
    // angry eyes (glowing) + brows + frown
    const ex = Math.round(bcx + 0.5 + tilt * 0.5), ey = Math.round(bcy - 1);
    const E0 = hx('#ffe2ec'), E1 = hx('#ff4f7a'), BR = hx('#24082c');
    const em = (x, y, c) => p.set(x, y, c, 255, EMIT);
    em(ex, ey, E1); em(ex, ey + 1, E1); em(ex + 1, ey + 1, E0); p.set(ex + 1, ey, BR, 255, NORIM); p.set(ex, ey - 1, BR, 255, NORIM);
    em(ex + 4, ey, E1); em(ex + 4, ey + 1, E1); em(ex + 3, ey + 1, E0); p.set(ex + 3, ey, BR, 255, NORIM); p.set(ex + 4, ey - 1, BR, 255, NORIM);
    p.set(ex + 1, ey + 4, BR, 255, NORIM); p.set(ex + 2, ey + 3, BR, 255, NORIM); p.set(ex + 3, ey + 3, BR, 255, NORIM); p.set(ex + 4, ey + 4, BR, 255, NORIM);
    return p;
  }

  /* ---------- Hungergeist: translucent icy wisp, hollow eyes, gaping mouth, reaching arms */
  function ghostPix(k) {
    const W = 26, H = 30, p = new Pix(W, H), cx = 12;
    const ph = (k / 6) * Math.PI * 2;
    const hcy = 9, hr = 6.6;
    for (let y = 2; y < 29; y++) {
      let hw, cxx, alpha, nyv;
      if (y + 0.5 <= hcy + 2) {
        const dy = y + 0.5 - hcy;
        hw = Math.sqrt(Math.max(0, hr * hr - dy * dy)); cxx = cx; nyv = dy / hr; alpha = 230;
      } else {
        const t = (y + 0.5 - hcy - 2) / 18;
        if (t > 1) break;
        hw = 6.4 * Math.pow(1 - t, 0.85) + 0.3;
        cxx = cx - t * 2 + Math.sin(ph + t * 4.2) * t * 3.2;
        nyv = 0.2 + t * 0.4; alpha = 225 - t * 150;
      }
      for (let x = 0; x < W; x++) {
        const nx = (x + 0.5 - cxx) / hw;
        if (Math.abs(nx) > 1) continue;
        const t = (y - hcy) / 18;
        if (t > 0.55 && U.dither(x, y) < (t - 0.55) * 1.4) continue;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - (y + 0.5 <= hcy + 2 ? nyv * nyv : 0)));
        const v = (nx * LDIR[0] + nyv * LDIR[1] + nz * LDIR[2]) * 0.5 + 0.55 - Math.max(0, t) * 0.25;
        p.set(x, y, R.ice[clamp(Math.floor(v * 9), 1, 8)], alpha);
      }
    }
    // reaching arms (towards the front/right)
    const reach = Math.round(Math.sin(ph) * 1);
    const armA = 170;
    for (let i = 0; i < 5; i++) p.set(cx + 6 + i, 13 + Math.round(i * 0.5) + (i > 2 ? reach : 0), R.ice[i < 2 ? 6 : 5], armA);
    p.set(cx + 11, 15 + reach, R.ice[7], armA); p.set(cx + 11, 16 + reach, R.ice[6], armA); p.set(cx + 10, 17 + reach, R.ice[6], armA);
    for (let i = 0; i < 3; i++) p.set(cx - 6 - i, 14 + i, R.ice[4], 120);
    // hollow eyes + gaping mouth
    const HO = hx('#120c2c'), IN = hx('#2c2a6a');
    const fx = cx + 1;
    for (const ex of [fx - 3, fx + 1]) { p.set(ex, 7, HO, 240, NORIM); p.set(ex + 1, 7, HO, 240, NORIM); p.set(ex, 8, HO, 240, NORIM); p.set(ex + 1, 8, HO, 240, NORIM); p.set(ex, 9, IN, 240, NORIM); p.set(ex + 1, 9, HO, 240, NORIM); }
    p.set(fx - 3, 8, hx('#bff4ff'), 255, EMIT); p.set(fx + 1, 8, hx('#bff4ff'), 255, EMIT);
    const mo = [[fx - 1, 11], [fx, 11], [fx - 2, 12], [fx - 1, 12], [fx, 12], [fx + 1, 12], [fx - 2, 13], [fx - 1, 13], [fx, 13], [fx + 1, 13], [fx - 1, 14], [fx, 14]];
    for (const [x, y] of mo) p.set(x, y, y === 13 && (x === fx - 1 || x === fx) ? IN : HO, 240, NORIM);
    return p;
  }

  /* ---------- Steckrüben-Koloss: mossy ancient rutabaga guardian, flowers, glowing runes */
  function colossusPix(k) {
    const W = 60, H = 58, p = new Pix(W, H), cx = 30;
    const bob = [2, 1, 0, 2, 1, 0][k], al = [0, 0, 2, 0, 0, 0][k], bl = [0, 0, 0, 0, 0, 2][k], sw = [1, 0, -1, -1, 0, 1][k];
    const bcx = cx, bcy = 35 + bob, rx = 19, ry = 16.5;
    const C0 = hx('#e8fffa'), C1 = hx('#6ff5e0'), C2 = hx('#2fb8b0'), DK = hx('#1a0f24');
    const BK = R.bark;
    // stubby root legs
    const leg = (x0, lift, dk) => {
      const y0 = Math.round(bcy + 8), y1 = H - 2 - lift;
      for (let y = y0; y <= y1; y++) {
        const t = (y - y0) / Math.max(1, y1 - y0), w = Math.round(10 - t * 1.5);
        for (let i = 0; i < w; i++) {
          const nx = ((i + 0.5) / w) * 2 - 1;
          const v = (nx * LDIR[0] + Math.sqrt(1 - nx * nx) * LDIR[2]) * 0.5 + 0.42 - dk * 0.16;
          p.set(x0 + i + Math.round(t), y, BK[clamp(Math.floor(v * 9), 0, 8)]);
        }
      }
      const fy = H - 1 - lift;
      for (let i = -2; i < 11; i++) p.set(x0 + i, fy, BK[clamp(3 - dk + (i < 3 ? 1 : 0), 0, 8)]);
      p.set(x0 - 3, fy, BK[2]); p.set(x0 + 11, fy, BK[1]);
    };
    leg(cx - 14, bl, 1);
    leg(cx + 3, al, 0);
    // gnarled root arms
    const arm = (sx, sy, dir, swing, dk) => {
      let x = sx, y = sy;
      for (let i = 0; i < 15; i++) {
        const th = i < 5 ? 5 : i < 10 ? 4 : 3;
        for (let q = 0; q < th; q++) p.set(x + q, y, BK[clamp(6 - Math.round(q * 1.6) - dk * 2, 0, 8)]);
        y += 1;
        if (i < 5 || i % 4 === 0) x += dir;
        if (i === 9) x += swing;
      }
      for (let f = -1; f <= 1; f++) { p.set(x + 1 + f * 2, y, BK[4 - dk]); p.set(x + 1 + f * 3, y + 1, BK[3 - dk]); p.set(x + 1 + f * 3, y + 2, BK[2 - dk]); }
    };
    arm(bcx - rx + 2, bcy - 6, -1, -sw, 1);
    // body: old violet top, ochre rutabaga belly, rough skin
    for (let y = Math.floor(bcy - ry - 1); y <= Math.ceil(bcy + ry); y++) for (let x = 0; x < W; x++) {
      const ny = (y + 0.5 - bcy) / ry;
      const rxe = rx * (1 - Math.pow(Math.max(0, ny), 3) * 0.32);
      const nx = (x + 0.5 - bcx) / rxe, dd = nx * nx + ny * ny;
      if (dd > 1 - 0.1 * U.hash2(x >> 1, y >> 1, 7)) continue;
      const nz = Math.sqrt(Math.max(0, 1 - dd));
      let v = (nx * LDIR[0] + ny * LDIR[1] + nz * LDIR[2]) * 0.5 + 0.46;
      v += (U.hash2(x >> 1, y >> 1, 77) - 0.5) * 0.12;
      const split = bcy + 3 + Math.sin(x * 0.5) * 1.6;
      let top = y + 0.5 < split;
      if (Math.abs(y + 0.5 - split) < 1 && (x + y) % 2 === 0) top = !top;
      const Rm = top ? R.oldv : R.ochre;
      p.set(x, y, Rm[clamp(Math.floor(v * Rm.length), 0, Rm.length - 1)]);
      if (!top && (y - Math.round(bcy)) % 5 === 1 && U.hash2(x >> 2, y, 5) < 0.55) p.set(x, y, R.ochre[clamp(Math.floor(v * 8) - 2, 0, 7)]);
    }
    // moss cap with tiny flowers
    for (let y = Math.floor(bcy - ry - 1); y < bcy + 2; y++) for (let x = 0; x < W; x++) {
      if (!p.a(x, y)) continue;
      const ny = (y + 0.5 - bcy) / ry, nx = (x + 0.5 - bcx) / rx;
      const lim = -0.45 + (U.fbm(x / 4, y / 4, 31, 2) - 0.5) * 1.3 - nx * 0.25;
      if (ny < lim) {
        const v = (nx * LDIR[0] + ny * LDIR[1]) * 0.5 + 0.5;
        p.set(x, y, R.moss[clamp(Math.floor(v * 7 + U.hash2(x, y, 3) * 0.8), 1, 7)]);
        const hh = U.hash2(x, y, 99);
        if (hh < 0.045) p.set(x, y, [FLOWERS.white[2], FLOWERS.pink[2], FLOWERS.gold[2], FLOWERS.lav[2]][Math.floor(hh * 88)], 255, NORIM);
      }
    }
    for (const [fx0, fy0, F] of [[cx - 8, bcy - 12, FLOWERS.pink], [cx + 7, bcy - 13, FLOWERS.white], [cx - 14, bcy - 6, FLOWERS.lav]]) {
      if (!p.a(fx0, fy0)) continue;
      p.set(fx0, fy0 - 1, F[2], 255, NORIM); p.set(fx0 - 1, fy0, F[1], 255, NORIM); p.set(fx0, fy0, CENTER, 255, NORIM); p.set(fx0 + 1, fy0, F[1], 255, NORIM); p.set(fx0, fy0 + 1, F[0], 255, NORIM);
    }
    // cracks with glowing seams
    const crack = (pts, glowAt) => {
      for (let i = 0; i < pts.length; i += 2) p.set(pts[i], pts[i + 1], i / 2 === glowAt ? C1 : DK, 255, i / 2 === glowAt ? EMIT : NORIM);
    };
    crack([cx - 13, bcy + 1, cx - 12, bcy + 2, cx - 12, bcy + 3, cx - 11, bcy + 4, cx - 11, bcy + 5, cx - 12, bcy + 6, cx - 12, bcy + 7], 3);
    crack([cx + 12, bcy - 1, cx + 13, bcy, cx + 13, bcy + 1, cx + 12, bcy + 2, cx + 13, bcy + 3, cx + 14, bcy + 4], 2);
    // brow ridge + deep-set glowing eyes
    const ex = cx + 3, ey = Math.round(bcy - 6);
    for (let x = ex - 7; x <= ex + 8; x++) { p.set(x, ey - 2, R.oldv[3], 255, NORIM); p.set(x, ey - 1, DK, 255, NORIM); }
    for (let x = ex - 6; x <= ex + 7; x++) p.set(x, ey, DK, 255, NORIM);
    for (const e0 of [ex - 5, ex + 3]) { p.set(e0, ey, C2, 255, EMIT); p.set(e0 + 1, ey, C0, 255, EMIT); p.set(e0 + 2, ey, C1, 255, EMIT); p.set(e0 + 1, ey + 1, C2, 255, EMIT); }
    // mouth: a dark maw with a faint inner glow
    const my = ey + 6;
    for (let x = ex - 3; x <= ex + 3; x++) p.set(x, my, DK, 255, NORIM);
    for (let x = ex - 2; x <= ex + 2; x++) p.set(x, my + 1, DK, 255, NORIM);
    p.set(ex, my, C2, 255, EMIT); p.set(ex - 2, my - 1, R.ochre[1], 255, NORIM); p.set(ex + 2, my - 1, R.ochre[1], 255, NORIM);
    // rune on the belly
    const rx0 = cx - 1, ry0 = Math.round(bcy + 5);
    const rune = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [-1, 1], [-2, 0], [1, 1], [2, 0], [-1, 5], [-2, 6], [1, 5], [2, 6]];
    for (const [dx, dy] of rune) p.set(rx0 + dx, ry0 + dy, dy === 3 && dx === 0 ? C0 : C1, 255, EMIT);
    // leaf crown: big ragged leaves + a small sapling
    const lx = bcx - 1, ly = Math.round(bcy - ry + 1);
    const DR = R.tops.slice(0, 6);
    leafStroke(p, lx - 3, ly, -Math.PI * 0.78 + sw * 0.05, 11, 2.2, DR, -0.4);
    leafStroke(p, lx + 3, ly, -Math.PI * 0.24 + sw * 0.05, 11, 2.2, DR, -0.4);
    leafStroke(p, lx, ly, -Math.PI * 0.55, 13, 2.4, R.tops, -0.3);
    leafStroke(p, lx + 1, ly - 1, -Math.PI * 0.42, 9, 1.6, R.tops, -0.2);
    arm(bcx + rx - 5, bcy - 6, 1, sw, 0);
    return p;
  }

  function seedPix(ang, spin) {
    const p = new Pix(9, 9), c = 4.5;
    const ry = [1.7, 1.0, 0.55][spin];
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
      const dx = x + 0.5 - c, dy = y + 0.5 - c;
      const u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
      const w = ry * (1 - Math.max(0, u) / 3 * 0.45);
      if ((u / 3) * (u / 3) + (v / w) * (v / w) > 1) continue;
      const l = (dx * LDIR[0] + dy * LDIR[1]) * 0.35 + 0.62 + (Math.abs(v) < 0.6 && u < 1 ? 0.12 : 0);
      p.set(x, y, R.seed[clamp(Math.floor(l * 6), 1, 5)]);
    }
    return p;
  }
  function lanternOrbPix(hot) {
    const p = new Pix(14, 17), cx = 7;
    p.blob(cx, 10, 5.6, 5.2, R.turnip, {
      rampAt: (x, y) => (y + 0.5 < 9.5 + Math.sin(x) * 0.6 ? R.turnip : R.cream),
    });
    const G0 = hx(hot ? '#fffbe0' : '#fff2b0'), G1 = hx(hot ? '#ffd864' : '#ffc040'), G2 = hx('#ff8a2a');
    const em = (x, y, c) => p.set(x, y, c, 255, EMIT);
    em(cx - 2, 9, G1); em(cx - 3, 10, G2); em(cx - 2, 10, G0); em(cx + 1, 9, G1); em(cx + 1, 10, G0); em(cx + 2, 10, G2);
    for (let x = cx - 3; x <= cx + 2; x++) em(x, 12, x % 2 ? G0 : G1);
    em(cx - 2, 13, G2); em(cx, 13, G2);
    leafStroke(p, cx - 0.5, 5, -Math.PI * 0.62, 4, 1, R.tops, -0.2);
    leafStroke(p, cx + 0.5, 5, -Math.PI * 0.35, 3, 1, R.tops, -0.2);
    return p;
  }
  function gemPix(big, k) {
    if (!big) {
      const p = new Pix(5, 7);
      p.blob(2.5, 3.6, 2.1, 2.9, R.amber, { bias: 0.08 });
      p.set(2, 0, R.amber[3]);
      p.set(1, 2, R.amber[5], 255, EMIT);
      if (k === 1) p.set(2, 2, R.amber[5], 255, EMIT);
      return p;
    }
    const p = new Pix(9, 11), cx = 4.5;
    for (let y = 0; y < 11; y++) for (let x = 0; x < 9; x++) {
      const dx = Math.abs(x + 0.5 - cx), t = y < 4 ? (y + 0.5) / 4 : (11 - y - 0.5) / 7;
      if (dx > t * 4.2) continue;
      const left = x + 0.5 < cx, up = y < 4;
      const v = up ? (left ? 5 : 4) : left ? 3 : 2;
      p.set(x, y, R.rose[clamp(v + (Math.abs(x + 0.5 - cx) < 0.6 ? 1 : 0), 0, 6)]);
    }
    p.set(3, 2, R.rose[6], 255, EMIT); p.set(3, 3, R.rose[6], 255, EMIT);
    if (k === 1) p.set(5, 5, R.rose[6], 255, EMIT);
    return p;
  }

  function buildCharacters() {
    SPR.jack = [[], []];
    for (let mode = 0; mode < 4; mode++) {
      const walk = mode & 1, thr = mode >> 1;
      const n = walk ? 6 : 4;
      const r = [], l = [];
      for (let k = 0; k < n; k++) {
        const [a, b] = variants(jackPix(walk, k, thr), { ox: 13, oy: 32 });
        r.push(withFlash(a)); l.push(withFlash(b));
      }
      SPR.jack[0][mode] = r; SPR.jack[1][mode] = l;
    }
    SPR.jackDash = [0, 1].map((fl) => SPR.jack[fl][1].map((s) => ({ c: U.tint(s.c, '#c88cf0', 1), ox: s.ox, oy: s.oy })));
    const jp = jackPix(0, 0, 0);
    SPR.jackSh = [makeShadow(jp, 13, 32, { contact: 6, alpha: 0.32 }), makeShadow(jp.flip(), 13, 32, { contact: 6, alpha: 0.32 })];
    SPR.cr = [0, 1].map((v) => {
      const out = [[], []];
      for (let k = 0; k < 6; k++) { const [a, b] = variants(creeperPix(k, v), { ox: 12, oy: 28 }); out[0].push(withFlash(a)); out[1].push(withFlash(b)); }
      return out;
    });
    const cp = creeperPix(0, 0);
    SPR.crSh = [makeShadow(cp, 12, 28, { contact: 6, alpha: 0.3 }), makeShadow(cp.flip(), 12, 28, { contact: 6, alpha: 0.3 })];
    SPR.gh = [[], []];
    for (let k = 0; k < 6; k++) {
      const [a, b] = variants(ghostPix(k), { ox: 12, oy: 30, rim: hx('#f4ffff'), rimA: 0.5, cool: hx('#7466e6'), coolA: 0.3, outA: 0.55, dark: hx('#141640'), lit: hx('#3a4a9a') });
      SPR.gh[0].push(withFlash(a)); SPR.gh[1].push(withFlash(b));
    }
    SPR.co = [[], []];
    for (let k = 0; k < 6; k++) { const [a, b] = variants(colossusPix(k), { ox: 30, oy: 58 }); SPR.co[0].push(withFlash(a)); SPR.co[1].push(withFlash(b)); }
    const kp = colossusPix(0);
    SPR.coSh = [makeShadow(kp, 30, 58, { contact: 14, alpha: 0.32 }), makeShadow(kp.flip(), 30, 58, { contact: 14, alpha: 0.32 })];
    // ghosts float: soft oval shadow
    {
      const p = new Pix(16, 6);
      p.blob(8, 3, 7, 2.6, [P.shadow]);
      const d = p.d;
      for (let i = 0; i < 16 * 6; i++) if (d[i * 4 + 3]) d[i * 4 + 3] = 70;
      SPR.ghSh = { c: p.canvas(), ox: 6, oy: 3 };
    }
    SPR.seed = [];
    for (let a = 0; a < 16; a++) {
      SPR.seed[a] = [];
      for (let s = 0; s < 3; s++) SPR.seed[a][s] = finish(seedPix((a / 16) * Math.PI * 2, s), { ox: 4.5, oy: 4.5, rimA: 0.35, coolA: 0, dark: hx('#3a1a20'), lit: hx('#6a3a30') });
    }
    SPR.orb = [0, 1].map((h) => finish(lanternOrbPix(h), { ox: 7, oy: 17 }));
    SPR.gem = [0, 1].map((k) => finish(gemPix(false, k), { ox: 2.5, oy: 7, rimA: 0.3, dark: hx('#4a1020'), lit: hx('#7a2a2a') }));
    SPR.gemBig = [0, 1].map((k) => finish(gemPix(true, k), { ox: 4.5, oy: 11, rimA: 0.25, dark: hx('#2a0830'), lit: hx('#5a1848') }));
  }

  /* =================================================================== effects sprites */
  const FX = {};
  const PETAL_SETS = {
    pink: FLOWERS.pink, lav: FLOWERS.lav, white: FLOWERS.white, peach: FLOWERS.peach,
    leaf: [R.tops[3], R.tops[5], R.tops[6]], violet: [R.turnip[3], R.turnip[5], R.turnip[7]],
    ice: [R.ice[4], R.ice[6], R.ice[8]], moss: [R.moss[3], R.moss[5], R.moss[6]], ochre: [R.ochre[3], R.ochre[5], R.ochre[6]],
    ember: [R.amber[2], R.amber[3], R.amber[4]], red: [hx('#8a1e4a'), hx('#e0456a'), hx('#ff9ab0')],
  };
  function buildFx() {
    FX.petal = {};
    const shapes = [
      [[0, 0, 2], [1, 0, 1], [0, 1, 1], [1, 1, 0]],
      [[0, 0, 2], [1, 0, 1], [2, 0, 0]],
      [[1, 0, 2], [0, 1, 1], [1, 1, 1], [2, 1, 0]],
      [[0, 0, 2], [0, 1, 1], [0, 2, 0]],
    ];
    for (const key in PETAL_SETS) {
      const C = PETAL_SETS[key];
      FX.petal[key] = shapes.map((sh) => { const p = new Pix(3, 3); for (const [x, y, c] of sh) p.set(x, y, C[c]); return p.canvas(); });
    }
    FX.ring = [];
    for (let r = 2; r <= 48; r += 2) {
      const n = r * 2 + 3, p = new Pix(n, n), c = n / 2;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const d = Math.hypot(x + 0.5 - c, (y + 0.5 - c) / 0.62);
        if (Math.abs(d - r) < 0.75) p.set(x, y, R.gold[4]);
        else if (Math.abs(d - r + 1.2) < 0.5) p.set(x, y, R.gold[2], 160);
      }
      FX.ring.push({ c: p.canvas(), h: n / 2 });
    }
    FX.puff = [2, 3, 4, 5].map((r) => { const p = new Pix(r * 2 + 1, r + 2); p.blob(r + 0.5, (r + 2) / 2, r, (r + 1) / 2, rp('#6a5a8a', '#9a88b0', '#c8b8d0', '#efe2e6'), {}); return p.canvas(); });
    FX.star = [0, 1, 2].map((s) => {
      const p = new Pix(7, 7), c = 3, W = hx('#fffbe8'), Y = hx('#ffd27a');
      p.set(c, c, W);
      const len = 3 - s;
      for (let i = 1; i <= len; i++) { const col = i === len ? Y : W; p.set(c + i, c, col); p.set(c - i, c, col); p.set(c, c + i, col); p.set(c, c - i, col); }
      return p.canvas();
    });
  }

  /* ---------- pixel digits for damage numbers (4x6, elegant thin strokes) */
  const DIG = {
    0: ['.##.', '#..#', '#..#', '#..#', '#..#', '.##.'], 1: ['.#.', '##.', '.#.', '.#.', '.#.', '###'],
    2: ['.##.', '#..#', '...#', '..#.', '.#..', '####'], 3: ['###.', '...#', '.##.', '...#', '...#', '###.'],
    4: ['#..#', '#..#', '####', '...#', '...#', '...#'], 5: ['####', '#...', '###.', '...#', '...#', '###.'],
    6: ['.##.', '#...', '###.', '#..#', '#..#', '.##.'], 7: ['####', '...#', '..#.', '..#.', '.#..', '.#..'],
    8: ['.##.', '#..#', '.##.', '#..#', '#..#', '.##.'], 9: ['.##.', '#..#', '#..#', '.###', '...#', '.##.'],
  };
  const numCache = new Map();
  function numSprite(v, crit) {
    const key = v + (crit ? 'c' : '');
    let s = numCache.get(key);
    if (s) return s;
    if (numCache.size > 400) numCache.clear();
    const str = String(v);
    let w = 0;
    for (const ch of str) w += DIG[ch][0].length + 1;
    w -= 1;
    const pad = crit ? 2 : 1, W = w + pad * 2 + 1, H = 6 + pad * 2 + 1;
    const p = new Pix(W, H);
    const top = crit ? [hx('#fffbe0'), hx('#ffe48a'), hx('#ffc24a'), hx('#ffa33a'), hx('#ff8a3a'), hx('#ff7048')] : [hx('#ffffff'), hx('#fff6ec'), hx('#ffeedd'), hx('#ffd9c0'), hx('#ffc8aa'), hx('#f7b49c')];
    const glyph = [];
    let x0 = pad;
    for (const ch of str) {
      const g = DIG[ch];
      for (let y = 0; y < 6; y++) for (let x = 0; x < g[y].length; x++) if (g[y][x] === '#') glyph.push(x0 + x, pad + y);
      x0 += g[0].length + 1;
    }
    const sh = hx('#1c0f34');
    // soft drop shadow (down-right), then an outline for crits, then the face
    for (let i = 0; i < glyph.length; i += 2) {
      const x = glyph[i], y = glyph[i + 1];
      p.set(x + 1, y + 1, sh, 230); if (!p.a(x, y + 1)) p.set(x, y + 1, sh, 200);
    }
    if (crit) for (let i = 0; i < glyph.length; i += 2) {
      const x = glyph[i], y = glyph[i + 1];
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (!p.a(x + dx, y + dy)) p.set(x + dx, y + dy, hx('#5a1a2a'), 255);
    }
    for (let i = 0; i < glyph.length; i += 2) p.set(glyph[i], glyph[i + 1], top[glyph[i + 1] - pad]);
    s = { c: p.canvas(), w: W, h: H };
    numCache.set(key, s);
    return s;
  }

  /* =================================================================== draw helpers */
  function spr(ctx, s, x, y) { ctx.drawImage(s.c, Math.round(x) - s.ox, Math.round(y) - s.oy); }
  function sprS(ctx, s, x, y, sx, sy) {
    if (sx === 1 && sy === 1) return spr(ctx, s, x, y);
    const w = Math.max(1, Math.round(s.c.width * sx)), h = Math.max(1, Math.round(s.c.height * sy));
    ctx.drawImage(s.c, Math.round(x) - Math.round(s.ox * sx), Math.round(y) - Math.round(s.oy * sy), w, h);
  }
  /** Draw only the top part of a sprite rising out of the ground (spawn). */
  function sprRise(ctx, s, x, y, k) {
    const h = s.c.height, vis = Math.max(1, Math.round((h - (h - s.oy)) * k + (h - s.oy)));
    ctx.drawImage(s.c, 0, 0, s.c.width, vis, Math.round(x) - s.ox, Math.round(y) - vis + (h - s.oy) * 0, s.c.width, vis);
  }
  const LIGHTS = [];  // light sources collected while drawing props (used next frame for ground pools)
  let lightsPrev = [];
  function add(ctx) { ctx.globalCompositeOperation = 'lighter'; }
  function norm(ctx) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }

  /* =================================================================== screen grading */
  const GR = { key: '' };
  function buildGrade(W, H) {
    GR.key = W + 'x' + H;
    // dusk tint (multiply): warm peach light on the left, violet shade on the right
    GR.tint = U.sprite(W, H, (c) => {
      const g = c.createLinearGradient(0, H * 0.1, W, H * 0.9);
      g.addColorStop(0, '#fff0dc'); g.addColorStop(0.4, '#f0dce0'); g.addColorStop(0.75, '#b8a6d4'); g.addColorStop(1, '#8a76c0');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    });
    // low sun glow from the upper left (screen)
    GR.sun = U.sprite(W, H, (c) => {
      const g = c.createRadialGradient(-W * 0.05, -H * 0.1, 0, -W * 0.05, -H * 0.1, W * 0.75);
      g.addColorStop(0, 'rgba(255,170,110,0.55)'); g.addColorStop(0.35, 'rgba(255,140,120,0.22)'); g.addColorStop(1, 'rgba(255,120,140,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    });
    // vignette (multiply), slightly violet
    GR.vig = U.sprite(W, H, (c) => {
      c.translate(W / 2, H / 2); c.scale(1, H / W);
      const g = c.createRadialGradient(0, 0, W * 0.22, 0, 0, W * 0.72);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#e4dcf0'); g.addColorStop(1, '#5c4a8a');
      c.fillStyle = g; c.fillRect(-W, -W, W * 2, W * 2);
    });
    // god rays from the upper left (screen)
    GR.rays = U.sprite(W, H, (c) => {
      const rng = U.rng(77);
      c.translate(-W * 0.1, -H * 0.25);
      c.rotate(0.42);
      for (let i = 0; i < 7; i++) {
        const y = rng.range(-H * 0.1, H * 1.0), h = rng.range(8, 34), a = rng.range(0.05, 0.12);
        const g = c.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, 'rgba(255,190,140,0)'); g.addColorStop(0.5, `rgba(255,196,150,${a})`); g.addColorStop(1, 'rgba(255,190,140,0)');
        c.fillStyle = g; c.fillRect(0, y, W * 1.6, h);
      }
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'destination-in';
      const f = c.createLinearGradient(0, 0, W * 0.9, H * 0.7);
      f.addColorStop(0, 'rgba(0,0,0,1)'); f.addColorStop(0.55, 'rgba(0,0,0,0.5)'); f.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = f; c.fillRect(0, 0, W, H);
    });
    // sun glow + god rays baked into one screen layer (one full-screen composite less per frame)
    GR.light = U.sprite(W, H, (c) => { c.drawImage(GR.sun, 0, 0); c.globalCompositeOperation = 'lighter'; c.drawImage(GR.rays, 0, 0); });
    GR.bw = Math.max(8, Math.round(W / 5)); GR.bh = Math.max(6, Math.round(H / 5));
    GR.b1 = U.canvas(GR.bw, GR.bh); GR.b2 = U.canvas(GR.bw, GR.bh);
    GR.tw = Math.max(8, Math.round(W / 2)); GR.th = Math.max(6, Math.round(H / 2));
    GR.t1 = U.canvas(GR.tw, GR.th);
    GR.strip = Math.round(H * 0.16);
    GR.tiltTop = U.canvas(W, GR.strip); GR.tiltBot = U.canvas(W, GR.strip);
    GR.maskTop = U.sprite(W, GR.strip, (c) => { const g = c.createLinearGradient(0, 0, 0, GR.strip); g.addColorStop(0, 'rgba(0,0,0,0.95)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, GR.strip); });
    GR.maskBot = U.sprite(W, GR.strip, (c) => { const g = c.createLinearGradient(0, GR.strip, 0, 0); g.addColorStop(0, 'rgba(0,0,0,0.95)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, GR.strip); });
  }

  const TRAIL = ['#ffe9a0', '#ffc35a', '#ff9a4a', '#f06a6a', '#c04a8a'];
  const SWAY = {};
  function buildSway() {
    const rng = U.rng(4040);
    const mk = (type) => {
      const blades = [];
      const n = type === 'fern' ? 4 : rng.int(3, 5);
      for (let i = 0; i < n; i++) {
        blades.push({
          x: 1 + i * 1.7 + rng.range(-0.4, 0.4), h: rng.int(type === 'meadow' ? 6 : 4, type === 'meadow' ? 10 : 7), lean: rng.range(-0.6, 0.6),
          flower: type === 'meadow' && i === 1 ? rng.pick([FLOWERS.pink, FLOWERS.lav, FLOWERS.white, FLOWERS.gold]) : null,
        });
      }
      const W = 13, Hh = 12, frames = [];
      const RM = type === 'meadow' ? R.meadow : type === 'fern' ? R.tops : R.grass;
      for (let f = 0; f < 5; f++) {
        const sway = (f - 2) * 0.9, p = new Pix(W, Hh);
        for (const b of blades) for (let k = 0; k < b.h; k++) {
          const t = k / (b.h - 1);
          const x = Math.round(b.x + 3 + (b.lean + sway) * t * t * 2.2), y = Hh - 1 - k;
          p.set(x, y, RM[clamp(Math.round(3 + t * (RM.length - 5)), 0, RM.length - 1)]);
          if (b.flower && k === b.h - 1) { p.set(x, y - 1, b.flower[2]); p.set(x - 1, y, b.flower[1]); p.set(x + 1, y, b.flower[0]); p.set(x, y, CENTER); }
        }
        frames.push(decal(p));
      }
      return frames;
    };
    SWAY.grass = [mk('grass'), mk('grass'), mk('grass')];
    SWAY.meadow = [mk('meadow'), mk('meadow'), mk('meadow')];
    SWAY.fern = [mk('fern'), mk('fern')];
  }

  /* =================================================================== HUD + icons */
  /* =================================================================== HUD */
  const CSS_DUSK = `
body.style-dusk { font-family: 'Pixelify Sans', system-ui, sans-serif; }
body.style-dusk #hud { padding: 14px 22px; }
body.style-dusk #hud .xp { height: 12px; border-radius: 2px; background: linear-gradient(rgba(20,12,40,.78), rgba(34,20,58,.72));
  border: 1px solid rgba(232,184,90,.75); box-shadow: 0 0 0 1px rgba(20,10,30,.8), 0 0 14px rgba(255,190,110,.18), inset 0 1px 0 rgba(255,240,200,.12); overflow: visible; }
body.style-dusk #hud .xp::before, body.style-dusk #hud .xp::after { content: ''; position: absolute; top: 50%; width: 9px; height: 9px; background: #e8b85a;
  transform: translateY(-50%) rotate(45deg); box-shadow: 0 0 8px rgba(255,200,120,.7); z-index: 2; }
body.style-dusk #hud .xp::before { left: -6px; } body.style-dusk #hud .xp::after { right: -6px; }
body.style-dusk #hud .xp-fill { border-radius: 1px; background: linear-gradient(90deg, #3fb0ae 0%, #7ee0cc 45%, #ffd08a 85%, #fff2c4 100%);
  box-shadow: 0 0 12px rgba(126,224,204,.55), inset 0 -3px 0 rgba(20,60,80,.35), inset 0 1px 0 rgba(255,255,255,.45); }
body.style-dusk #hud .lvl { right: 14px; font-family: 'Cinzel', serif; font-weight: 900; font-size: 11px; color: #fff2c4; letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(255,180,90,.8), 0 1px 0 #1a0f24; z-index: 3; }
body.style-dusk #hud .topline { margin-top: 14px; }
body.style-dusk #hud .hp { gap: 10px; padding: 6px 14px 6px 8px; background: linear-gradient(90deg, rgba(22,12,42,.72), rgba(22,12,42,.25));
  border-left: 2px solid #e8b85a; border-radius: 2px 18px 18px 2px; }
body.style-dusk #hud .hp-icon, body.style-dusk #hud .kills-icon { width: 30px; height: 30px; filter: drop-shadow(0 0 6px rgba(255,170,80,.45)); }
body.style-dusk #hud .hp-bar { width: 210px; height: 12px; border-radius: 2px; background: rgba(18,8,30,.85); border: 1px solid rgba(232,184,90,.7);
  box-shadow: 0 0 0 1px rgba(10,5,20,.8); }
body.style-dusk #hud .hp-fill { background: linear-gradient(#ffb36a 0%, #f07a3a 40%, #c2402c 100%); box-shadow: 0 0 10px rgba(255,120,60,.6), inset 0 1px 0 rgba(255,236,190,.6); }
body.style-dusk #hud .hp-text { font-size: 15px; font-weight: 600; color: #ffe8c8; text-shadow: 0 1px 0 #1a0f24, 0 0 8px rgba(255,150,80,.5); }
body.style-dusk #hud .clock { padding: 2px 26px 6px; background: radial-gradient(ellipse at center, rgba(22,12,42,.6) 0%, rgba(22,12,42,0) 70%); }
body.style-dusk #hud .clock-time { font-family: 'Cinzel', serif; font-weight: 900; font-size: 32px; color: #fff4dc; letter-spacing: 3px;
  text-shadow: 0 0 14px rgba(255,170,110,.65), 0 2px 0 #1a0f24; }
body.style-dusk #hud .clock-label { font-family: 'Cinzel', serif; font-weight: 700; font-size: 10px; color: #e8b85a; letter-spacing: 4px; opacity: 1;
  border-top: 1px solid rgba(232,184,90,.55); padding-top: 3px; text-shadow: 0 1px 0 #1a0f24; }
body.style-dusk #hud .kills { gap: 8px; font-size: 22px; font-weight: 600; color: #ffe8f2; text-shadow: 0 1px 0 #1a0f24, 0 0 10px rgba(230,110,200,.55); }
body.style-dusk #hud .kills-num { padding: 2px 14px 2px 18px; background: linear-gradient(270deg, rgba(22,12,42,.72), rgba(22,12,42,.2));
  border-right: 2px solid #e8b85a; border-radius: 18px 2px 2px 18px; }
body.style-dusk.hurt #hud .hp-bar { filter: brightness(1.7) saturate(1.3); }
body.style-dusk #stylebar { background: rgba(20,12,40,.72); border: 1px solid rgba(232,184,90,.55); border-radius: 3px; box-shadow: 0 0 18px rgba(0,0,0,.35);
  font-family: 'Pixelify Sans', sans-serif; color: #f4e6ff; }
body.style-dusk #stylebar .style-family { color: #e8b85a; opacity: .9; font-family: 'Cinzel', serif; }
body.style-dusk #stylebar .style-name { font-family: 'Cinzel', serif; font-weight: 900; color: #fff2c4; text-shadow: 0 0 8px rgba(255,180,100,.5); }
body.style-dusk #levelup { background: radial-gradient(ellipse at 50% 45%, rgba(60,30,80,.55) 0%, rgba(14,8,30,.86) 75%); gap: 26px; }
body.style-dusk #levelup .lu-title { font-family: 'Cinzel', serif; font-weight: 900; font-size: 46px; letter-spacing: 6px; color: #fff2c4;
  text-shadow: 0 0 22px rgba(255,170,90,.75), 0 3px 0 #2a1238; }
body.style-dusk #levelup .lu-title::before, body.style-dusk #levelup .lu-title::after { content: '\\2726'; color: #e8b85a; font-size: 24px; margin: 0 18px; vertical-align: middle; }
body.style-dusk #levelup .lu-cards { gap: 26px; }
body.style-dusk #levelup .card { width: 220px; min-height: 270px; padding: 26px 18px 18px; border-radius: 4px; gap: 12px;
  background: linear-gradient(180deg, rgba(48,28,82,.94) 0%, rgba(26,16,50,.96) 60%, rgba(18,30,46,.96) 100%);
  border: 1px solid #e8b85a; box-shadow: 0 0 0 4px rgba(20,10,34,.85), 0 0 0 5px rgba(232,184,90,.35), 0 14px 30px rgba(0,0,0,.5), inset 0 0 30px rgba(126,224,204,.08);
  transition: transform .14s, box-shadow .14s; }
body.style-dusk #levelup .card::before { content: ''; position: absolute; left: 50%; top: -6px; width: 10px; height: 10px; background: #e8b85a;
  transform: translateX(-50%) rotate(45deg); box-shadow: 0 0 10px rgba(255,200,120,.8); }
body.style-dusk #levelup .card:hover { transform: translateY(-8px); box-shadow: 0 0 0 4px rgba(20,10,34,.85), 0 0 0 5px rgba(255,214,140,.8), 0 0 34px rgba(255,170,90,.45), inset 0 0 30px rgba(126,224,204,.14); }
body.style-dusk #levelup .card-icon { width: 96px; height: 96px; background: radial-gradient(circle, rgba(255,190,110,.22) 0%, rgba(126,224,204,.08) 45%, transparent 70%); }
body.style-dusk #levelup .card-name { font-family: 'Cinzel', serif; font-weight: 900; font-size: 19px; color: #fff2c4; letter-spacing: 1px; text-shadow: 0 0 10px rgba(255,170,90,.45); }
body.style-dusk #levelup .card-desc { font-size: 15px; color: #e6daf4; opacity: 1; line-height: 1.3; }
body.style-dusk #levelup .card-key { top: 8px; left: 10px; color: #e8b85a; opacity: .9; font-family: 'Cinzel', serif; }
body.style-dusk #levelup .lu-hint { color: #cdbfe6; letter-spacing: 1px; }
body.style-dusk #gameover { background: radial-gradient(ellipse at center, rgba(50,20,60,.6), rgba(10,6,22,.92)); }
body.style-dusk #gameover .go-title { font-family: 'Cinzel', serif; font-weight: 900; color: #ffcfa2; letter-spacing: 4px; text-shadow: 0 0 24px rgba(255,120,90,.6), 0 3px 0 #2a1238; }
body.style-dusk #gameover .go-stats { color: #f4e6ff; } body.style-dusk #gameover .go-hint { color: #e8b85a; }
body.style-dusk #pausebox { font-family: 'Cinzel', serif; color: #fff2c4; letter-spacing: 6px; text-shadow: 0 0 20px rgba(255,170,90,.7), 0 3px 0 #2a1238; }
`;
  const iconCache = new Map();
  function iconPix(id) {
    const p = new Pix(18, 18);
    const em = (x, y, c) => p.set(x, y, c, 255, EMIT);
    switch (id) {
      case 'hp-heart': {
        for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) {
          const u = (x + 0.5 - 9) / 7.4, v = (8 - y - 0.5) / 7.4;
          const f = Math.pow(u * u + v * v - 0.42, 3) - u * u * v * v * v * 1.1;
          if (f > 0) continue;
          const l = clamp(0.62 - u * 0.35 + v * 0.42, 0, 0.999);
          p.set(x, y, R.berry[clamp(Math.floor(l * 6), 1, 5)]);
        }
        p.set(5, 5, R.berry[5], 255, NORIM); p.set(5, 6, R.berry[5], 255, NORIM); p.set(6, 5, hx('#fff2f6'), 255, NORIM);
        break;
      }
      case 'kills': {
        p.blob(9, 10, 6.2, 5.8, R.turnip, { rampAt: (x, y) => (y + 0.5 < 11 ? R.turnip : R.rbody) });
        leafStroke(p, 8.5, 4, -Math.PI * 0.7, 4, 1, R.tops, -0.2); leafStroke(p, 9.5, 4, -Math.PI * 0.32, 4, 1, R.tops, -0.2);
        const X = hx('#24082c');
        for (const ex of [6, 11]) { em(ex, 9, hx('#ff4f7a')); em(ex + 1, 9, hx('#ffe2ec')); p.set(ex, 8, X, 255, NORIM); p.set(ex + 1, 8, X, 255, NORIM); }
        for (let x = 7; x <= 11; x++) p.set(x, 12 + (x & 1), X, 255, NORIM);
        break;
      }
      case 'dmg': {
        const s = seedPix(-Math.PI * 0.25, 0);
        for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) { const i = (y * 9 + x) * 4; if (s.d[i + 3]) p.rect(x * 2, y * 2, 2, 2, [s.d[i], s.d[i + 1], s.d[i + 2]]); }
        em(15, 1, R.flame[4]); em(14, 2, R.flame[3]); em(16, 2, R.flame[2]); em(15, 3, R.flame[2]); em(15, 0, R.flame[2]);
        break;
      }
      case 'rate': {
        const bolt = [[10, 1], [9, 2], [8, 3], [7, 4], [6, 5], [5, 6], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [9, 8], [8, 9], [7, 10], [6, 11], [5, 12], [4, 13]];
        for (const [x, y] of bolt) { em(x, y, R.amber[4]); em(x + 1, y, R.amber[3]); em(x + 2, y, R.amber[2]); }
        for (const [x, y] of [[14, 4], [15, 10], [13, 14], [2, 3]]) em(x, y, R.amber[5]);
        break;
      }
      case 'multi': {
        p.blob(9, 11, 6.5, 5.5, R.leather, {});
        for (let x = 4; x <= 14; x++) p.set(x, 7, R.leather[4]);
        for (const [x, y] of [[6, 4], [9, 3], [12, 4]]) p.blob(x + 0.5, y + 0.5, 1.8, 1.4, R.seed, {});
        em(9, 11, R.gold[4]); em(9, 12, R.gold[3]);
        break;
      }
      case 'bounce': {
        for (let i = 0; i <= 12; i++) { const x = 2 + i, y = Math.round(14 - Math.abs(Math.sin(i / 12 * Math.PI * 1.5)) * 10); em(x, y, i % 2 ? R.shroom[6] : R.shroom[5]); }
        p.blob(14.5, 5.5, 2.4, 1.6, R.seed, {});
        p.rect(1, 15, 16, 1, R.stone[5]); p.rect(1, 16, 16, 1, R.stone[3]);
        break;
      }
      case 'lantern': {
        const s = lanternOrbPix(true);
        for (let y = 0; y < 17; y++) for (let x = 0; x < 14; x++) { const i = (y * 14 + x) * 4; if (s.d[i + 3]) p.set(x + 2, y, [s.d[i], s.d[i + 1], s.d[i + 2]], 255, s.f[y * 14 + x]); }
        break;
      }
      case 'speed': {
        // glass slipper (side view, high heel at the back, pointed toe)
        const M = [
          '..##..............',
          '..###.............',
          '..####............',
          '..#####...........',
          '..#oooo#..........',
          '..##oooo###.......',
          '..###ooo#######...',
          '...#############..',
          '...##############.',
          '...##.....########',
          '...##.........####',
          '...##.............',
          '...#..............',
        ];
        M.forEach((row, j) => { for (let x = 0; x < 18; x++) {
          const ch = row[x]; if (ch === '.') continue;
          const y = j + 4;
          if (ch === 'o') { p.set(x, y, R.ice[1]); continue; }
          const l = clamp(0.95 - j / 13 * 0.55 - x / 18 * 0.25, 0, 0.99);
          p.set(x, y, R.ice[clamp(Math.floor(l * 9), 2, 8)]);
        } });
        em(5, 6, hx('#ffffff')); em(12, 11, R.ice[8]); em(13, 11, R.ice[7]); em(15, 4, R.ice[8]); em(15, 3, R.ice[6]); em(16, 4, R.ice[6]); em(1, 13, R.ice[7]);
        break;
      }
      case 'magnet': {
        p.blob(9, 11, 7, 4.5, R.ochre, { mask: (x, y) => y >= 9 });
        for (let y = 9; y <= 15; y++) for (let x = 2; x <= 16; x++) if (p.a(x, y) && (x + y) % 3 === 0) p.set(x, y, R.ochre[2]);
        for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; p.set(Math.round(9 + Math.cos(a) * 6.5), Math.round(9 + Math.sin(a) * 6.5), R.ochre[5]); }
        em(6, 8, R.amber[4]); em(9, 7, R.amber[5]); em(12, 8, R.amber[4]); em(8, 8, R.amber[3]); em(11, 7, R.rose[4]);
        break;
      }
      case 'hp': {
        p.blob(9, 11, 7.2, 5, R.stone, { mask: (x, y) => y >= 9, bias: 0.05 });
        for (let x = 3; x <= 15; x++) { p.set(x, 9, R.amber[x % 3 ? 3 : 4]); p.set(x, 10, R.amber[2]); }
        p.set(6, 9, R.turnip[6]); p.set(7, 9, R.turnip[5]); p.set(11, 9, R.rbody[6]); p.set(12, 9, R.tops[5]);
        for (const [x, y0] of [[6, 3], [9, 2], [12, 3]]) for (let k = 0; k < 4; k++) p.set(x + ((k & 1) ? 1 : 0), y0 + k, R.mstem[4], 170, NORIM);
        break;
      }
      default: p.blob(9, 9, 6, 6, R.amber, {});
    }
    return finish(p, { rimA: 0.35, coolA: 0.2 });
  }
  function drawIconImpl(ctx, id, size) {
    let s = iconCache.get(id);
    if (!s) { s = iconPix(id); iconCache.set(id, s); }
    const k = Math.max(1, Math.floor(size / 20));
    const w = s.c.width * k, h = s.c.height * k;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(s.c, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
  }



  /* scratch-only debug hook (sprite sheet viewer) */
  if (window.__DUSK_DEBUG) {
    window.__DUSK_DEBUG.draw = function (b, which, put) {
      if (which === 'chars') {
        for (let fl = 0; fl < 2; fl++) for (let m = 0; m < 4; m++) SPR.jack[fl][m].forEach((s, k) => put(s, 14 + k * 28 + fl * 180, 36 + m * 0 + (m % 2) * 0 + Math.floor(m / 2) * 0 + (m ? 0 : 0) + (m === 0 ? 0 : m === 1 ? 34 : m === 2 ? 68 : 102)));
        SPR.cr[0][0].forEach((s, k) => put(s, 14 + k * 26, 170));
        SPR.cr[1][1].forEach((s, k) => put(s, 180 + k * 26, 170));
        SPR.gh[0].forEach((s, k) => put(s, 14 + k * 26, 205));
        SPR.co[0].slice(0, 3).forEach((s, k) => put(s, 200 + k * 60, 225));
        put(SPR.orb[0], 350, 40); put(SPR.orb[1], 370, 40); put(SPR.gem[0], 350, 60); put(SPR.gemBig[0], 365, 64);
        for (let a = 0; a < 8; a++) put(SPR.seed[a * 2][0], 345 + (a % 4) * 10, 80 + Math.floor(a / 4) * 10);
        put(SPR.jackSh[0], 360, 130); put(SPR.jack[0][0][0], 360, 130);
      } else if (which === 'props') {
        put(PROPS.oak[0], 50, 122); put(PROPS.oak[1], 150, 122); put(PROPS.bloom[0], 250, 122); put(PROPS.birch[0], 340, 122);
        put(PROPS.rock[0], 20, 160); put(PROPS.rock[2], 55, 160); put(PROPS.pillar[0], 90, 220); put(PROPS.pillar[1], 115, 220);
        put(PROPS.arch[0], 170, 222); put(PROPS.arch[1], 250, 222); put(PROPS.lantern[0], 300, 222);
        put(PROPS.shroom[0], 330, 222); put(PROPS.bush[0], 365, 222); put(PROPS.bush[1], 365, 196); put(PROPS.lupine[0], 20, 222); put(PROPS.fern[0], 50, 222);
      } else if (which === 'shadows') {
        put(PROPS.oak[0].sh, 60, 122); put(PROPS.oak[0], 60, 122); put(PROPS.arch[0].sh, 250, 200); put(PROPS.arch[0], 250, 200);
        put(SPR.coSh[0], 100, 200); put(SPR.co[0][0], 100, 200);
      }
    };
  }

  /* =================================================================== style */
  const TAU = Math.PI * 2;
  Styles.register({
    id: 'dusk',
    name: 'Dämmerwald',
    family: 'Pixel Art · Modern',
    description: 'Ein verwunschener Waldrand in der goldenen Minute vor der Nacht – moderne HD-2D-Pixelkunst mit weichem Licht.',
    pixelArt: { scale: 1 },
    groundColor: '#1e4a44',
    chunkSize: 256,
    fonts: ['Cinzel:wght@500;700;900', 'Pixelify+Sans:wght@400;500;600;700'],
    css: typeof CSS_DUSK === 'string' ? CSS_DUSK : '',

    init() {
      initGround();
      buildProps();
      buildCharacters();
      buildFx();
      buildSway();
    },

    *renderGroundChunk(ctx, info) { yield* renderGround(ctx, info); },

    propsForChunk(info) {
      const out = [];
      G.scatterOwned(info, 96, 2101, (x, y, rng) => {
        if (G.nearSpawn(x, y, 95)) return;
        const m = matWorld(x, y), v = rng.next();
        if (m === WATER || matWorld(x - 14, y) === WATER || matWorld(x + 14, y) === WATER) return;
        let t = null;
        if (m === FOREST) t = v < 0.42 ? (rng.chance(0.75) ? 'oak' : 'bloom') : v < 0.52 ? 'birch' : null;
        else if (m === GRASS) t = v < 0.07 ? (rng.chance(0.5) ? 'birch' : rng.chance(0.5) ? 'bloom' : 'oak') : null;
        else if (m === STONE) t = v < 0.14 ? 'arch' : null;
        if (!t) return;
        const list = PROPS[t];
        out.push({ x: Math.round(x), y: Math.round(y), t, v: rng.int(0, list.length - 1), big: t !== 'arch', pad: 120 });
      });
      G.scatterOwned(info, 46, 2102, (x, y, rng) => {
        if (G.nearSpawn(x, y, 70)) return;
        const m = matWorld(x, y), v = rng.next();
        if (m === WATER) return;
        let t = null;
        if (m === FOREST) t = v < 0.08 ? 'shroom' : v < 0.15 ? 'fern' : v < 0.19 ? 'rock' : v < 0.22 ? 'bush' : null;
        else if (m === GRASS) {
          fieldsAt(x, y, _wf, 0);
          const meadow = _wf[1] > 0.585;
          t = meadow ? (v < 0.07 ? 'lupine' : v < 0.1 ? 'bush' : null) : (v < 0.035 ? 'rock' : v < 0.075 ? 'bush' : v < 0.085 ? 'shroom' : null);
        } else if (m === STONE) t = v < 0.14 ? 'pillar' : v < 0.2 ? 'lantern' : v < 0.24 ? 'rock' : null;
        if (!t) return;
        out.push({ x: Math.round(x), y: Math.round(y), t, v: rng.int(0, PROPS[t].length - 1), pad: 40 });
      });
      return out;
    },

    drawProp(ctx, pr, view) {
      const s = PROPS[pr.t][pr.v];
      let a = 1;
      if (pr.big) {
        const p = view.game.player;
        if (p.y < pr.y - 3 && p.y > pr.y - 104 && Math.abs(p.x - pr.x) < (pr.t === 'birch' ? 24 : 42)) a = 0.55;
      }
      ctx.globalAlpha = a;
      spr(ctx, s, pr.x, pr.y);
      ctx.globalAlpha = 1;
      const L = s.light;
      if (L) {
        let k = 1;
        if (L.flicker) k = 0.82 + 0.12 * Math.sin(view.rt * 9 + pr.x) + 0.06 * Math.sin(view.rt * 23 + pr.y);
        if (L.pulse) k = 0.75 + 0.25 * Math.sin(view.rt * 1.6 + pr.x * 0.1);
        add(ctx);
        drawGlow(ctx, L.type, L.r, pr.x + L.dx, pr.y + L.dy, L.a * k);
        norm(ctx);
        if (L.ground) LIGHTS.push(pr.x, pr.y, L.ground, k, L.type === 'cyan' ? 1 : 0);
      }
    },

    drawShadow(ctx, o, view) {
      let s = null, a = 1;
      if (o.kind === 'prop') s = PROPS[o.t][o.v].sh;
      else if (o.kind === 'player') s = SPR.jackSh[o.facing < 0 ? 1 : 0];
      else if (o.kind === 'enemy') {
        if (o.type === 'ghost') s = SPR.ghSh;
        else s = o.type === 'creeper' ? SPR.crSh[o.facing < 0 ? 1 : 0] : SPR.coSh[o.facing < 0 ? 1 : 0];
        a = o.dying ? 1 - o.deathT : o.spawnT;
      }
      if (!s || a <= 0) return;
      ctx.globalAlpha = a;
      spr(ctx, s, o.x, o.y);
      ctx.globalAlpha = 1;
    },

    drawGroundOverlay(ctx, view, game) {
      lightsPrev = LIGHTS.splice(0, LIGHTS.length);
      const rt = view.rt, p = game.player;
      // coloured light pools on the ground
      add(ctx);
      const fl = 0.9 + 0.06 * Math.sin(rt * 7.3) + 0.04 * Math.sin(rt * 17.1);
      drawGlow(ctx, 'warm', 50, p.x + p.facing * 2, p.y - 2, 0.42 * fl, true);
      drawGlow(ctx, 'amber', 16, p.x, p.y - 1, 0.35 * fl, true);
      for (const o of game.orbitals) drawGlow(ctx, 'warm', 26, o.x, o.y + 8, 0.28 * fl, true);
      for (let i = 0; i < lightsPrev.length; i += 5) {
        const x = lightsPrev[i], y = lightsPrev[i + 1];
        if (x < view.x0 - 60 || x > view.x1 + 60 || y < view.y0 - 40 || y > view.y1 + 60) continue;
        drawGlow(ctx, lightsPrev[i + 4] ? 'cyan' : 'warm', lightsPrev[i + 2], x, y - 2, 0.32 * lightsPrev[i + 3], true);
      }
      for (const pr of game.projectiles) drawGlow(ctx, 'amber', 7, pr.x, pr.y + 8, 0.25, true);
      norm(ctx);
      // swaying grass blades / flowers near the camera
      const cell = 22, x0 = Math.floor(view.x0 / cell), x1 = Math.floor(view.x1 / cell), y0 = Math.floor(view.y0 / cell), y1 = Math.floor((view.y1 + 8) / cell);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
        const h = U.hashInt(cx, cy, 515);
        if ((h & 255) > 70) continue;
        const x = cx * cell + ((h >>> 8) & 15) + 3, y = cy * cell + ((h >>> 12) & 15) + 3;
        const ck = Math.floor(x / 256) + ',' + Math.floor(y / 256), cm = matCache.get(ck);
        if (!cm) continue;
        const lx = ((x % 256) + 256) % 256, ly = ((y % 256) + 256) % 256, m = cm[(ly >> 2) * 64 + (lx >> 2)];
        if (m !== 0 && m !== 4 && m !== FOREST) continue;
        let k = Math.floor((Math.sin(rt * 2.1 + x * 0.045 + y * 0.03) + Math.sin(rt * 0.7 + x * 0.01)) * 0.8 + 2);
        const dx = x - p.x, dy = y - p.y;
        if (dx * dx + dy * dy < 160) k = dx < 0 ? 0 : 4;
        const set = m === 4 ? SWAY.meadow : m === FOREST ? SWAY.fern : SWAY.grass;
        const fr = set[(h >>> 16) % set.length][clamp(k, 0, 4)];
        ctx.drawImage(fr, Math.round(x) - (fr.width >> 1), Math.round(y) - fr.height + 1);
      }
    },

    drawGem(ctx, g, view) {
      const rt = view.rt;
      const bob = Math.round(Math.sin(rt * 3 + g.seed * 6) * 1.2);
      const pop = g.pop > 0 ? Math.sin(g.pop * Math.PI) * 9 : 0;
      const y = g.y - bob - pop;
      const tw = Math.sin(rt * 4 + g.seed * 9);
      add(ctx);
      drawGlow(ctx, g.big ? 'rose' : 'amber', g.big ? 7 : 4, g.x, g.y, 0.4, true);
      drawGlow(ctx, g.big ? 'rose' : 'amber', g.big ? 10 : 6, g.x, y - (g.big ? 5 : 3), 0.5 + 0.18 * tw);
      norm(ctx);
      spr(ctx, g.big ? SPR.gemBig[tw > 0.7 ? 1 : 0] : SPR.gem[tw > 0.6 ? 1 : 0], g.x, y);
    },

    drawPlayer(ctx, p, view) {
      const rt = view.rt, fl = p.facing < 0 ? 1 : 0;
      const thr = p.shootT > 0.35 ? 2 : 0;
      let mode, k;
      if (p.moving) { mode = 1 + thr; k = Math.floor(p.anim * 1.5) % 6; }
      else { mode = thr; k = Math.floor(rt * 3.2) % 4; }
      const s = SPR.jack[fl][mode][k];
      // dash smear: violet afterimages
      if (p.dashT > 0) {
        const ds = SPR.jackDash[fl][Math.floor(p.anim * 1.5) % 6];
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = 0.16 * (4 - i);
          spr(ctx, ds, p.x - p.dashX * i * 7, p.y - p.dashY * i * 7);
        }
        ctx.globalAlpha = 1;
      }
      let sx = 1, sy = 1;
      if (p.shootT > 0) { sx = 1 + 0.07 * p.shootT; sy = 1 - 0.06 * p.shootT; }
      if (p.levelT > 0) { const q = Math.sin(p.levelT * Math.PI); sx -= 0.08 * q; sy += 0.12 * q; }
      if (p.hurtT > 0) { sx += 0.1 * p.hurtT; sy -= 0.08 * p.hurtT; }
      const blink = p.iframes > 0 && p.hurtT <= 0 && Math.floor(rt * 18) % 2 === 0;
      ctx.globalAlpha = blink ? 0.5 : 1;
      sprS(ctx, p.hurtT > 0.55 ? s.fl : s, p.x, p.y, sx, sy);
      ctx.globalAlpha = 1;
      // soft inner glow of the carved face
      const f = 0.85 + 0.1 * Math.sin(rt * 8.1) + 0.05 * Math.sin(rt * 19.3);
      add(ctx);
      drawGlow(ctx, 'warm', 14, p.x + p.facing * 1.5, p.y - 21, 0.3 * f);
      norm(ctx);
    },

    drawEnemy(ctx, e, view) {
      const rt = view.rt, fl = e.facing < 0 ? 1 : 0;
      let s, eyeY = 0, gl = null;
      if (e.type === 'creeper') {
        s = SPR.cr[e.seed < 0.5 ? 0 : 1][fl][Math.floor(e.anim * 2.2 + e.seed * 6) % 6];
        eyeY = 14;
      } else if (e.type === 'ghost') {
        s = SPR.gh[fl][Math.floor(rt * 9 + e.seed * 6) % 6];
      } else {
        s = SPR.co[fl][Math.floor(e.anim * 2.4 + e.seed * 6) % 6];
      }
      const float = e.type === 'ghost' ? 4 + Math.round(Math.sin(rt * 3 + e.seed * 9) * 1.5) : 0;
      const x = e.x, y = e.y - float;
      if (e.dying) {
        const t = e.deathT;
        // white pop, then dissolve into light
        const sx = 1 + 0.3 * t, sy = t < 0.3 ? 1 + 0.2 * t : Math.max(0.1, 1.06 - (t - 0.3) * 1.4);
        ctx.globalAlpha = 1 - t * 0.8;
        sprS(ctx, s.fl, x, y, sx, sy);
        ctx.globalAlpha = 1;
        add(ctx);
        drawGlow(ctx, e.type === 'ghost' ? 'ice' : e.type === 'colossus' ? 'cyan' : 'pink', e.type === 'colossus' ? 24 : 12, x, y - s.oy * 0.45, 0.7 * (1 - t));
        norm(ctx);
        return;
      }
      if (e.spawnT < 1) {
        const k = U.ease.outQuad(e.spawnT);
        if (e.type === 'ghost') {
          ctx.globalAlpha = k * 0.9;
          sprS(ctx, s, x, y, 1 - 0.4 * (1 - k), 1 + 0.6 * (1 - k));
          ctx.globalAlpha = 1;
        } else {
          // sprout from the ground: soil mound + petals swirling out
          sprRise(ctx, s, x, y, k);
          const n = e.type === 'colossus' ? 8 : 5;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU + e.seed * 9 + k * 2.5, rr = 3 + k * (e.type === 'colossus' ? 20 : 11);
            const px = Math.round(x + Math.cos(a) * rr), py = Math.round(y - 2 + Math.sin(a) * rr * 0.5 - k * 4);
            ctx.globalAlpha = 1 - k;
            ctx.drawImage(FX.petal[i % 2 ? 'pink' : 'white'][(i + Math.floor(k * 8)) & 3], px, py);
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#2a1d2e';
          const mw = e.type === 'colossus' ? 22 : 12;
          ctx.fillRect(Math.round(x - mw / 2), Math.round(y - 1), mw, 2);
          ctx.fillStyle = '#4a3540';
          ctx.fillRect(Math.round(x - mw / 2) + 1, Math.round(y - 2), mw - 2, 1);
        }
        return;
      }
      let sx = 1, sy = 1;
      if (e.flash > 0) { sx = 1 + e.flash * 0.14; sy = 1 - e.flash * 0.12; }
      if (e.type === 'ghost') ctx.globalAlpha = 0.92;
      sprS(ctx, e.flash > 0.5 ? s.fl : s, x, y, sx, sy);
      ctx.globalAlpha = 1;
      add(ctx);
      if (e.type === 'creeper') {
        drawGlow(ctx, 'eye', 3, x + (e.facing < 0 ? -2 : 3), y - eyeY, 0.45);
      } else if (e.type === 'ghost') {
        drawGlow(ctx, 'ice', 9, x, y - 14, 0.16);
        const tw = Math.sin(rt * 5 + e.seed * 40);
        if (tw > 0.55) {
          ctx.globalAlpha = (tw - 0.55) * 2;
          ctx.fillStyle = '#eaffff';
          const ox = Math.round(x + (U.hash2(Math.floor(rt * 0.8 + e.seed * 7), 1, 3) - 0.5) * 18), oy = Math.round(y - 6 - U.hash2(Math.floor(rt * 0.8 + e.seed * 7), 2, 3) * 18);
          ctx.fillRect(ox, oy, 1, 1);
          if (tw > 0.85) { ctx.fillRect(ox - 1, oy, 3, 1); ctx.fillRect(ox, oy - 1, 1, 3); }
        }
      } else {
        const pz = 0.75 + 0.25 * Math.sin(rt * 2.2 + e.seed * 7);
        drawGlow(ctx, 'cyan', 14, x - 1, y - 22, 0.38 * pz);
        drawGlow(ctx, 'cyan', 5, x + (e.facing < 0 ? -4 : 4), y - 33, 0.5 * pz);
      }
      norm(ctx);
    },

    drawOrbital(ctx, o, view) {
      const rt = view.rt;
      const bob = Math.round(Math.sin(rt * 4 + o.idx * 1.7) * 1.2);
      ctx.globalAlpha = 0.3;
      ctx.drawImage(SPR.ghSh.c, Math.round(o.x) - 5, Math.round(o.y + 9));
      ctx.globalAlpha = 1;
      const hot = Math.sin(rt * 11 + o.idx * 3) > 0.2 ? 1 : 0;
      spr(ctx, SPR.orb[hot], o.x, o.y + 6 - bob);
      const f = 0.85 + 0.15 * Math.sin(rt * 9 + o.idx);
      add(ctx);
      drawGlow(ctx, 'warm', 13, o.x, o.y - 4 - bob, 0.5 * f);
      norm(ctx);
    },

    drawProjectile(ctx, pr, view) {
      const l = Math.hypot(pr.vx, pr.vy) || 1, ux = pr.vx / l, uy = pr.vy / l;
      // tiny ground shadow
      ctx.fillStyle = 'rgba(20,10,40,0.35)';
      ctx.fillRect(Math.round(pr.x + 2), Math.round(pr.y + 7), 2, 1);
      add(ctx);
      drawGlow(ctx, 'amber', 5, pr.x, pr.y, 0.45);
      const TR = TRAIL;
      for (let i = 1; i <= 5; i++) {
        ctx.globalAlpha = 0.8 - i * 0.14;
        ctx.fillStyle = TR[i - 1];
        ctx.fillRect(Math.round(pr.x - ux * (i * 2 + 1)), Math.round(pr.y - uy * (i * 2 + 1)), 1, 1);
      }
      norm(ctx);
      const ai = ((Math.round((pr.angle / TAU) * 16) % 16) + 16) % 16;
      const si = [0, 1, 2, 1][Math.floor(pr.spin * 0.7) & 3];
      spr(ctx, SPR.seed[ai][si], pr.x, pr.y);
    },

    drawParticle(ctx, pt, view) {
      const a = clamp(pt.life / pt.max, 0, 1);
      const x = pt.x, y = pt.y - pt.z;
      switch (pt.kind) {
        case 'petal': case 'leaf': case 'shard': {
          const set = FX.petal[pt.set || 'pink'] || FX.petal.pink;
          ctx.globalAlpha = Math.min(1, a * 2.2);
          ctx.drawImage(set[Math.floor(Math.abs(pt.rot) * 1.5) & 3], Math.round(x) - 1, Math.round(y) - 1);
          ctx.globalAlpha = 1;
          return;
        }
        case 'mote': {
          add(ctx);
          drawGlow(ctx, pt.glow || 'amber', pt.size > 2 ? 4 : 3, x, y, a * 0.9);
          ctx.globalAlpha = a;
          ctx.fillStyle = pt.core || '#fff6d0';
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
          norm(ctx);
          return;
        }
        case 'star': {
          add(ctx);
          ctx.globalAlpha = Math.min(1, a * 1.5);
          const st = FX.star[a > 0.66 ? 0 : a > 0.33 ? 1 : 2];
          ctx.drawImage(st, Math.round(x) - 3, Math.round(y) - 3);
          norm(ctx);
          return;
        }
        case 'bloom': {
          add(ctx);
          drawGlow(ctx, pt.glow || 'pink', pt.size * (1.2 - a * 0.5), x, y, a * 0.9);
          norm(ctx);
          return;
        }
        case 'ring': {
          const r = clamp(Math.round((1 - a) * pt.size / 2), 0, FX.ring.length - 1);
          const rg = FX.ring[r];
          add(ctx);
          ctx.globalAlpha = a;
          ctx.drawImage(rg.c, Math.round(x) - rg.h, Math.round(y) - rg.h);
          norm(ctx);
          return;
        }
        case 'puff': {
          const pf = FX.puff[clamp(Math.floor((1 - a) * 4), 0, 3)];
          ctx.globalAlpha = a * 0.75;
          ctx.drawImage(pf, Math.round(x) - (pf.width >> 1), Math.round(y) - pf.height);
          ctx.globalAlpha = 1;
          return;
        }
        default: {
          ctx.globalAlpha = a;
          ctx.fillStyle = pt.color || '#fff';
          const s = Math.max(1, Math.round(pt.size));
          ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
          ctx.globalAlpha = 1;
        }
      }
    },

    drawNumber(ctx, n, view) {
      const t = 1 - n.life / n.max;
      const s = numSprite(n.value, n.crit);
      const a = clamp(n.life / n.max * 3, 0, 1);
      const pop = t < 0.15 ? Math.round((1 - t / 0.15) * 3) : 0;
      ctx.globalAlpha = a;
      ctx.drawImage(s.c, Math.round(n.x - s.w / 2), Math.round(n.y - s.h - pop));
      if (n.crit && t < 0.5) {
        add(ctx);
        ctx.globalAlpha = 1 - t * 2;
        ctx.drawImage(FX.star[Math.floor(t * 6) % 3], Math.round(n.x + s.w / 2 - 2), Math.round(n.y - s.h - pop - 3));
        norm(ctx);
      }
      ctx.globalAlpha = 1;
    },

    drawWorldOverlay(ctx, view, game) {
      const rt = view.rt;
      add(ctx);
      // drifting fireflies
      const cell = 120, x0 = Math.floor(view.x0 / cell) - 1, x1 = Math.floor(view.x1 / cell) + 1, y0 = Math.floor(view.y0 / cell) - 1, y1 = Math.floor(view.y1 / cell) + 1;
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
        const h = U.hashInt(cx, cy, 616);
        for (let j = 0; j < 2; j++) {
          const hh = U.hashInt(h, j, 3), ph = (hh & 1023) / 1023 * TAU;
          const x = cx * cell + ((hh >>> 10) & 127) + Math.sin(rt * 0.45 + ph) * 26 + Math.sin(rt * 1.3 + ph * 2) * 5;
          const y = cy * cell + ((hh >>> 17) & 127) + Math.cos(rt * 0.33 + ph) * 16 - 8;
          if (x < view.x0 - 8 || x > view.x1 + 8 || y < view.y0 - 8 || y > view.y1 + 8) continue;
          const b = Math.max(0, Math.sin(rt * 1.4 + ph * 3));
          if (b < 0.05) continue;
          drawGlow(ctx, 'fly', 5, x, y, b * 0.8);
          ctx.globalAlpha = b;
          ctx.fillStyle = '#f6ffd0';
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
      }
      norm(ctx);
      // petals drifting through the air on the evening breeze
      const W = view.x1 - view.x0 + 40, H = view.y1 - view.y0 + 40;
      for (let i = 0; i < 14; i++) {
        const s1 = U.hash2(i, 1, 818), s2 = U.hash2(i, 2, 818), sp = 10 + s1 * 12;
        let px = (s1 * 997 + rt * sp * 1.6) % W, py = (s2 * 677 + rt * sp * 0.55 + Math.sin(rt * 0.9 + i) * 8) % H;
        px = view.x0 - 20 + ((px % W) + W) % W; py = view.y0 - 20 + ((py % H) + H) % H;
        const set = FX.petal[i % 3 === 0 ? 'white' : i % 3 === 1 ? 'pink' : 'peach'];
        ctx.globalAlpha = 0.85;
        ctx.drawImage(set[Math.floor(rt * 4 + i) & 3], Math.round(px), Math.round(py));
      }
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view, game) {
      const W = view.W, H = view.H;
      if (GR.key !== W + 'x' + H) buildGrade(W, H);
      const prog = game.runProgress || 0;
      // 1) tilt-shift: soft focus at the top and bottom edges
      const t1 = GR.t1.ctx;
      t1.imageSmoothingEnabled = true;
      t1.globalCompositeOperation = 'copy';
      for (const [cv, mask, sy] of [[GR.tiltTop, GR.maskTop, 0], [GR.tiltBot, GR.maskBot, H - GR.strip]]) {
        t1.drawImage(ctx.canvas, 0, sy, W, GR.strip, 0, sy / 2, GR.tw, GR.strip / 2); // only the strips get downsampled
        const c = cv.ctx;
        c.imageSmoothingEnabled = true;
        c.globalCompositeOperation = 'copy';
        c.drawImage(GR.t1.c, 0, sy / 2, GR.tw, GR.strip / 2, 0, 0, W, GR.strip);
        c.globalCompositeOperation = 'destination-in';
        c.drawImage(mask, 0, 0);
        ctx.drawImage(cv.c, 0, sy);
      }
      // 2) colour grade: warm-pink light from the left, violet shade on the right
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(GR.tint, 0, 0);
      // 3) bloom: downsample, square (keeps the highlights), add back softly
      const b1 = GR.b1.ctx, b2 = GR.b2.ctx;
      b1.imageSmoothingEnabled = true; b2.imageSmoothingEnabled = true;
      b1.globalCompositeOperation = 'copy';
      b1.drawImage(ctx.canvas, 0, 0, W, H, 0, 0, GR.bw, GR.bh);
      b2.globalCompositeOperation = 'copy';
      b2.drawImage(GR.b1.c, 0, 0);
      b2.globalCompositeOperation = 'multiply';
      b2.drawImage(GR.b1.c, 0, 0);
      b2.drawImage(GR.b1.c, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.7;
      ctx.drawImage(GR.b2.c, 0, 0, GR.bw, GR.bh, 0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      // 4) god rays
      ctx.globalAlpha = 0.9 + 0.1 * Math.sin(view.rt * 0.35);
      ctx.drawImage(GR.light, 0, 0);
      // 5) vignette, deepening towards midnight
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.9;
      ctx.drawImage(GR.vig, 0, 0);
      if (prog > 0.02) {
        ctx.globalAlpha = prog * 0.4;
        ctx.fillStyle = '#4a3a8a';
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'source-over';
      const p = game.player;
      if (p.hurtT > 0) {
        ctx.globalAlpha = p.hurtT * 0.35;
        ctx.drawImage(GR.vig, 0, 0);
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = '#ff6a8a';
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    },

    drawIcon(ctx, id, size) { if (typeof drawIconImpl === 'function') drawIconImpl(ctx, id, size); },

    /* ---------- hooks: petals, light motes and bloom pops */
    onHit(game, e, src) {
      const y = e.y - e.r - (e.type === 'ghost' ? 6 : 2);
      game.addParticle({ kind: 'bloom', x: e.x, y, life: 0.16, size: e.type === 'colossus' ? 12 : 8, glow: e.type === 'ghost' ? 'ice' : 'pink', drag: 0 });
      game.addParticle({ kind: 'star', x: e.x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, life: 0.22 });
      const set = e.type === 'ghost' ? 'ice' : e.type === 'colossus' ? (Math.random() < 0.5 ? 'moss' : 'ochre') : (Math.random() < 0.5 ? 'leaf' : 'violet');
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * TAU, sp = 30 + Math.random() * 40;
        game.addParticle({ kind: 'petal', set, x: e.x, y: e.y, z: e.r + 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 40 + Math.random() * 40, grav: 220, life: 0.5 + Math.random() * 0.3, vr: (Math.random() - 0.5) * 12, drag: 2 });
      }
    },
    onKill(game, e) {
      const big = e.type === 'colossus', gh = e.type === 'ghost';
      const n = big ? 26 : gh ? 8 : 12;
      const sets = gh ? ['ice', 'white', 'lav'] : big ? ['pink', 'white', 'lav', 'moss', 'peach'] : ['pink', 'lav', 'white', 'violet'];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, sp = (big ? 50 : 30) + Math.random() * 50;
        game.addParticle({ kind: 'petal', set: sets[i % sets.length], x: e.x, y: e.y, z: e.r + 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 70, grav: 160, life: 0.7 + Math.random() * 0.6, vr: (Math.random() - 0.5) * 14, drag: 2.2 });
      }
      const m = big ? 14 : 5;
      for (let i = 0; i < m; i++) {
        game.addParticle({ kind: 'mote', glow: gh ? 'ice' : big ? 'cyan' : 'amber', core: gh ? '#f0ffff' : big ? '#e8fffa' : '#fff3c8', x: e.x + (Math.random() - 0.5) * e.r * 1.6, y: e.y - Math.random() * e.r * 2, vx: (Math.random() - 0.5) * 20, vy: -14 - Math.random() * 26, life: 0.6 + Math.random() * 0.7, drag: 1.2, size: big ? 3 : 2 });
      }
      game.addParticle({ kind: 'bloom', x: e.x, y: e.y - e.r, life: 0.3, size: big ? 26 : 14, glow: gh ? 'ice' : big ? 'cyan' : 'pink', drag: 0 });
      if (big) game.addParticle({ kind: 'ring', x: e.x, y: e.y - 4, life: 0.45, size: 60, drag: 0 });
    },
    onHurt(game, p) {
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * TAU, sp = 40 + Math.random() * 50;
        game.addParticle({ kind: 'petal', set: i % 2 ? 'red' : 'ember', x: p.x, y: p.y, z: 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 50, grav: 200, life: 0.6 + Math.random() * 0.3, vr: (Math.random() - 0.5) * 14, drag: 2 });
      }
      game.addParticle({ kind: 'bloom', x: p.x, y: p.y - 14, life: 0.25, size: 16, glow: 'eye', drag: 0 });
    },
    onPickup(game, g) {
      game.addParticle({ kind: 'mote', glow: g.big ? 'rose' : 'amber', core: '#fffbe8', x: g.x, y: g.y - 4, vx: 0, vy: -26, life: 0.4, drag: 1, size: 2 });
      if (g.big) game.addParticle({ kind: 'ring', x: g.x, y: g.y, life: 0.35, size: 30, drag: 0 });
    },
    onShoot(game, pr) {
      game.addParticle({ kind: 'star', x: pr.x, y: pr.y, life: 0.14, drag: 0 });
    },
    onDash(game, p) {
      for (let i = 0; i < 5; i++) game.addParticle({ kind: 'puff', x: p.x - p.dashX * i * 3 + (Math.random() - 0.5) * 6, y: p.y + (Math.random() - 0.5) * 3, vx: -p.dashX * 20 + (Math.random() - 0.5) * 20, vy: -p.dashY * 20, life: 0.35 + Math.random() * 0.2, drag: 3 });
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * TAU;
        game.addParticle({ kind: 'petal', set: i % 2 ? 'pink' : 'white', x: p.x, y: p.y, z: 6, vx: Math.cos(a) * 30 - p.dashX * 30, vy: Math.sin(a) * 20, vz: 30, grav: 120, life: 0.6, vr: 8, drag: 2 });
      }
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'ring', x: p.x, y: p.y - 2, life: 0.6, size: 80, drag: 0 });
      game.addParticle({ kind: 'ring', x: p.x, y: p.y - 2, life: 0.4, size: 44, drag: 0 });
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        game.addParticle({ kind: 'mote', glow: 'amber', core: '#fffbe8', x: p.x + Math.cos(a) * 12, y: p.y - 4 + Math.sin(a) * 7, vx: Math.cos(a) * 18, vy: -20 - Math.random() * 30, life: 0.9 + Math.random() * 0.5, drag: 1, size: 2 });
      }
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * TAU, sp = 40 + Math.random() * 40;
        game.addParticle({ kind: 'petal', set: ['pink', 'white', 'peach', 'lav'][i % 4], x: p.x, y: p.y, z: 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 60 + Math.random() * 40, grav: 120, life: 1.1, vr: 10, drag: 1.5 });
      }
    },
    onDeath(game, p) {
      for (let i = 0; i < 30; i++) {
        const a = Math.random() * TAU, sp = 40 + Math.random() * 70;
        game.addParticle({ kind: 'petal', set: ['ember', 'red', 'peach'][i % 3], x: p.x, y: p.y, z: 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 60 + Math.random() * 60, grav: 160, life: 1.2, vr: 12, drag: 1.6 });
      }
      for (let i = 0; i < 16; i++) game.addParticle({ kind: 'mote', glow: 'warm', core: '#fff3c8', x: p.x + (Math.random() - 0.5) * 16, y: p.y - 10 - Math.random() * 14, vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 30, life: 1.2, drag: 1, size: 3 });
    },
  });
})();
