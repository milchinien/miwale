/* Dusk Grove — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Modern "HD-2D" pixel art: 1 world unit = 1 art pixel, hue-shifted ramps, per-pixel lit sprites with a two-tone
   rim light and selective outline, long sheared shadows, additive banded glows, then grade + bloom on the low-res buffer. */
(function (root) {
  'use strict';
  const hx = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rp = (...a) => a.map(hx);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const mul = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

  const PALETTE = {
    ink: '#150c29', night: '#1e1538', plum: '#4a2c62', rim: '#ffcfa2', rimLeaf: '#ffd08a', bounce: '#8d86ea', shadow: '#1a1034',
    grass: '#246248', meadow: '#589250', earth: '#36273a', stone: '#504a69', water: '#1e3e68', pumpkin: '#f79a3e', cape: '#1f6076',
    turnip: '#7426a0', ghost: '#7ab3e4', shroom: '#7ee0cc', gold: '#e8b85a', amber: '#ffaa48', bloomPink: '#e58bb4', lavender: '#9a7fe0',
  };
  // hue-shifted ramps (dark -> light): shadows drift to blue/violet, lights to warm yellow
  const R = {
    grass: rp('#0a1d2a', '#0d2732', '#11323a', '#153d3f', '#194943', '#1e5546', '#246248', '#2c6f4a', '#387d4d', '#4a8c51', '#62a056'),
    meadow: rp('#0e2733', '#13333a', '#183f3f', '#1e4b43', '#255846', '#2d6548', '#38734a', '#46824d', '#589250', '#70a456', '#8eb75d'),
    stone: rp('#141127', '#1f1b34', '#2a2641', '#36324f', '#433e5c', '#504a69', '#5f5876', '#6f6782', '#82788f', '#988b9e', '#b3a2b0'), moss: rp('#11292a', '#173a31', '#1f4d37', '#2a613c', '#387541', '#4a8a47', '#62a04f', '#82b65a'),
    bark: rp('#160f22', '#21162d', '#2d1d36', '#3b2540', '#4b2f49', '#5d3a51', '#714758', '#88565f', '#a26a68'), leaf: rp('#0a1328', '#0d1b33', '#10253d', '#133046', '#163d4c', '#1a4b51', '#1f5a54', '#266a56', '#307a57', '#3e8a57', '#539b58', '#71ad5c'),
    pumpkin: rp('#3a1428', '#64202c', '#93332c', '#c24f2c', '#e5742f', '#f79a3e', '#ffc35c', '#ffe08c'), stem: rp('#13201f', '#203324', '#33492a', '#4d6330', '#6d7d3a'),
    cape: rp('#0c1430', '#102241', '#143354', '#194866', '#1f6076', '#2a7a85', '#40978f', '#6ab8a4'), leather: rp('#25132a', '#3f1f2e', '#5e3135', '#81493d', '#a5654b', '#c8875c'),
    pants: rp('#120f2a', '#1b1838', '#252148', '#322c5a'), turnip: rp('#1a0d33', '#2a1150', '#3f166c', '#581d88', '#7426a0', '#922fb0', '#b044b8', '#d06cc4', '#eea0d6'),
    rbody: rp('#2e1636', '#4d2a44', '#7a4a4c', '#a8704c', '#cf9748', '#e8b950', '#f6d572', '#fff0b0'), cream: rp('#3e2645', '#5f4157', '#866460', '#ad8a72', '#cdae86', '#e5cd9f', '#f6e6bf', '#fff6dc'),
    tops: rp('#0d2629', '#133b36', '#1b5440', '#256e48', '#36894e', '#52a455', '#78bf5e', '#a6d66c'), ice: rp('#1a2252', '#223672', '#2c4f92', '#3a6cb0', '#5590cc', '#7ab3e4', '#a4d3f4', '#cfecfb', '#f0fcff'),
    amber: rp('#6e2430', '#b2452e', '#e3763a', '#ffaa48', '#ffd27a', '#fff2c4'), shroom: rp('#0c2440', '#123a5a', '#185274', '#1f6c8a', '#2a8a9a', '#3fb0ae', '#7ee0cc', '#d0fff2'),
    mstem: rp('#3e3858', '#625a7e', '#8d85a4', '#b9b0c8', '#e2dbe8'), gold: rp('#5a3420', '#8e5a2a', '#c48a3a', '#e8b85a', '#ffe08e', '#fff6d0'),
    seed: rp('#5a3f2c', '#8c6c48', '#bc9e6e', '#e2cc98', '#f6eac4', '#fffbec'),
  };
  const FLOWERS = { pink: rp('#a24f7e', '#e58bb4', '#ffc4dc'), lav: rp('#5d47a2', '#9a7fe0', '#cfbfff'), white: rp('#9d93b4', '#e8e0ec', '#ffffff'), peach: rp('#c0605a', '#f7a688', '#ffd9bf'), gold: rp('#b8702a', '#f2c04e', '#fff0a0') };
  const CENTER = hx('#ffcf4e'), INK = hx(PALETTE.ink), PLUM = hx(PALETTE.plum), SHADOW = hx(PALETTE.shadow);
  const EMIT = 1, NOOUT = 2, NORIM = 4;                       // per-pixel flags: emissive / no outline / no rim
  const LDIR = (() => { const v = [-0.62, -0.5, 0.6], n = Math.hypot(...v); return v.map((c) => c / n); })(); // sun: upper-left-front

  /* ---- deterministic hash, rng, tileable value-noise fbm, Bayer 8x8 dither */
  function hashInt(x, y, s) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0;
  }
  const hash2 = (x, y, s) => hashInt(x, y, s) / 4294967296;
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { next, range: (a0, b0) => a0 + (b0 - a0) * next(), int: (a0, b0) => a0 + Math.floor(next() * (b0 - a0 + 1)), pick: (arr) => arr[Math.floor(next() * arr.length)], chance: (p) => next() < p, sign: () => (next() < 0.5 ? -1 : 1) };
  }
  function vnoise(x, y, p, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const h = (i, j) => hash2(p ? ((i % p) + p) % p : i, p ? ((j % p) + p) % p : j, s);
    const a = h(x0, y0) + (h(x0 + 1, y0) - h(x0, y0)) * u, b = h(x0, y0 + 1) + (h(x0 + 1, y0 + 1) - h(x0, y0 + 1)) * u; return a + (b - a) * v;
  }
  function fbm(x, y, period, seed, oct) { let a = 1, f = 1, s = 0, n = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f, period * f, seed + i * 101); n += a; a *= 0.5; f *= 2; } return s / n; }
  const B8 = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21].map((v) => (v + 0.5) / 64);
  const dither = (x, y) => B8[((y & 7) << 3) | (x & 7)];
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };

  /* ---- Pix: an RGBA + flag buffer you paint pixel by pixel */
  class Pix {
    constructor(w, h, wrap) { this.w = w; this.h = h; this.wrap = !!wrap; this.d = new Uint8ClampedArray(w * h * 4); this.f = new Uint8Array(w * h); }
    idx(x, y) {
      x = Math.floor(x); y = Math.floor(y);
      if (this.wrap) { x = ((x % this.w) + this.w) % this.w; y = ((y % this.h) + this.h) % this.h; } else if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
      return y * this.w + x;
    }
    set(x, y, c, a = 255, fl = 0) { const i = this.idx(x, y); if (i < 0) return; const o = i * 4; this.d[o] = c[0]; this.d[o + 1] = c[1]; this.d[o + 2] = c[2]; this.d[o + 3] = a; this.f[i] = fl; }
    a(x, y) { const i = this.idx(x, y); return i < 0 ? 0 : this.d[i * 4 + 3]; }
    /** Shaded ellipsoid: Lambert-ish N·L picks an index in the ramp (no smooth gradients, only ramp steps). */
    blob(cx, cy, rx, ry, rmp, o = {}) {
      const k = o.k === undefined ? 1 : o.k, bias = o.bias || 0;
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, dd = nx * nx + ny * ny; if (dd > (o.edge ? o.edge(x, y) : 1) || (o.mask && !o.mask(x, y, nx, ny))) continue;
        const nz = Math.sqrt(Math.max(0, 1 - dd)); let v = (nx * LDIR[0] + ny * LDIR[1] + nz * LDIR[2]) * k * 0.5 + 0.5 + bias + (o.tex ? o.tex(x, y, nx, ny) : 0);
        const Rm = o.rampAt ? o.rampAt(x, y) : rmp; this.set(x, y, Rm[clamp(Math.floor(v * Rm.length), 0, Rm.length - 1 - (o.top || 0))], 255, o.flag || 0);
      }
    }
    flip() { const p = new Pix(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const s = y * this.w + x, t = y * this.w + this.w - 1 - x; for (let k = 0; k < 4; k++) p.d[t * 4 + k] = this.d[s * 4 + k]; p.f[t] = this.f[s]; } return p; }
    canvas() { return fromData(this.d, this.w, this.h); }
  }
  function fromData(d, w, h) { const c = mkCanvas(w, h), x = c.getContext('2d'), img = x.createImageData(w, h); img.data.set(d); x.putImageData(img, 0, 0); return c; }

  /** Finishing pass: warm rim on lit (left/top) edges, cool bounce on the right edge, then a selective 1px outline
   *  = darkened neighbour hue mixed with indigo on the shadow side / plum on the lit side. Returns {c, ox, oy}. */
  function finish(p, o = {}) {
    const w = p.w, h = p.h, d = p.d, f = p.f, rim = o.rim || hx(PALETTE.rim), rimA = o.rimA ?? 0.42, cool = o.cool || hx(PALETTE.bounce), coolA = o.coolA ?? 0.22;
    const sol = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0; const src = new Uint8ClampedArray(d);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, q = i * 4; if (!d[q + 3] || (f[i] & (EMIT | NORIM))) continue;
      const lit = !sol(x - 1, y) ? 1 : !sol(x, y - 1) ? 0.75 : !sol(x - 1, y - 1) ? 0.3 : 0;
      const dk = !sol(x + 1, y) ? 1 : (!sol(x + 1, y - 1) && !sol(x + 1, y + 1)) ? 0.4 : 0; const [c, t] = lit ? [rim, rimA * lit] : [cool, coolA * dk];
      for (let k = 0; k < 3; k++) src[q + k] += (c[k] - src[q + k]) * t;
    }
    const W = w + 2, H = h + 2, od = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) od[((y + 1) * W + x + 1) * 4 + k] = src[(y * w + x) * 4 + k];
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
      const x = X - 1, y = Y - 1; if (sol(x, y)) continue; let nb = -1, dkS = false;
      if (sol(x - 1, y)) { nb = y * w + x - 1; dkS = true; } else if (sol(x, y - 1)) { nb = (y - 1) * w + x; dkS = true; } else if (sol(x + 1, y)) nb = y * w + x + 1; else if (sol(x, y + 1)) nb = (y + 1) * w + x;
      if (nb < 0 || (f[nb] & NOOUT)) continue; const q = nb * 4, c = [d[q], d[q + 1], d[q + 2]];
      const oc = dkS ? mix(mul(c, 0.32), o.dark || INK, 0.55) : mix(mul(c, 0.55), o.lit || PLUM, 0.45), t = (Y * W + X) * 4;
      od[t] = oc[0]; od[t + 1] = oc[1]; od[t + 2] = oc[2]; od[t + 3] = d[q + 3] * (o.outA ?? 1);
    }
    return { c: fromData(od, W, H), ox: (o.ox ?? w / 2) + 1, oy: (o.oy ?? h) + 1 };
  }

  /** Long cast shadow: silhouette sheared towards the upper right (low sun at the left/front), 3 alpha bands. */
  function makeShadow(p, ax, ay, o = {}) {
    const kx = o.kx ?? 0.8, ky = o.ky ?? 0.3, pts = [], cr = o.contact || 0; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      if (!p.d[(y * p.w + x) * 4 + 3]) continue; const hg = Math.max(0, ay - (y + 0.5)), sx = Math.floor(x + hg * kx), sy = Math.floor(ay - 0.5 - hg * ky);
      pts.push(sx, sy); x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    if (cr) { x0 = Math.min(x0, Math.floor(ax - cr - 1)); x1 = Math.max(x1, Math.ceil(ax + cr + 1)); y1 = Math.max(y1, Math.ceil(ay + 2)); y0 = Math.min(y0, Math.floor(ay - 3)); }
    const pad = 2, W = x1 - x0 + 1 + pad * 2, H = y1 - y0 + 1 + pad * 2, m = new Uint8Array(W * H);
    for (let i = 0; i < pts.length; i += 2) m[(pts[i + 1] - y0 + pad) * W + pts[i] - x0 + pad] = 2;
    if (cr) for (let y = -3; y <= 2; y++) for (let x = -cr - 1; x <= cr + 1; x++) { const nx = (x + 0.5) / (cr + 0.5), ny = (y + 0.5) / 2.6; if (nx * nx + ny * ny <= 1) m[(Math.floor(ay) + y - y0 + pad) * W + Math.floor(ax) + x - x0 + pad] = 3; }
    for (let y = 0; y < H; y++) for (let x = 1; x < W - 1; x++) if (!m[y * W + x] && m[y * W + x - 1] >= 2 && m[y * W + x + 1] >= 2) m[y * W + x] = 2;
    const band = new Uint8Array(m), A = [0, 0.18, o.alpha || 0.34, 0.5], d = new Uint8ClampedArray(W * H * 4);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (!m[y * W + x] && (m[y * W + x - 1] || m[y * W + x + 1] || m[(y - 1) * W + x] || m[(y + 1) * W + x])) band[y * W + x] = 1;
    for (let i = 0; i < W * H; i++) if (band[i]) { d[i * 4] = SHADOW[0]; d[i * 4 + 1] = SHADOW[1]; d[i * 4 + 2] = SHADOW[2]; d[i * 4 + 3] = 255 * A[band[i]]; }
    return { c: fromData(d, W, H), ox: ax - x0 + pad, oy: ay - y0 + pad };
  }

  /* ---- additive glow sprites: 3–5 concentric colour bands, band edges broken with Bayer dither */
  const GLOWCOL = { warm: rp('#fff0b8', '#ffab4a', '#d8456a'), amber: rp('#fff4c8', '#ffbe55', '#e0607a'), cyan: rp('#e8fffa', '#58e8d6', '#3a6ad0'),
    ice: rp('#ffffff', '#9fd8ff', '#6a5ae0'), eye: rp('#ffe0ea', '#ff4f7a', '#8a2060'), fly: rp('#f6ffc8', '#c8f070', '#3a9a7a'), pink: rp('#fff4fa', '#ff9ac8', '#9a5ae0') };
  const glowCache = new Map();
  function glow(type, r, flat) {
    r = Math.max(2, Math.round(r)); const key = type + r + (flat ? 'f' : ''); if (glowCache.has(key)) return glowCache.get(key);
    const rx = r, ry = flat ? Math.max(2, Math.round(r * 0.55)) : r, p = new Pix(rx * 2 + 1, ry * 2 + 1), cols = GLOWCOL[type], bands = r < 5 ? 3 : r < 12 ? 4 : 5;
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      const dd = Math.hypot((x - rx) / (rx + 0.5), (y - ry) / (ry + 0.5)); if (dd >= 1) continue; const b = dd * bands; let bi = Math.floor(b);
      if (b - bi > 0.55 && dither(x, y) < (b - bi - 0.55) / 0.45) bi++; if (bi >= bands) continue;
      const t = clamp((bi / bands) / (1 - 1 / bands), 0, 1) * 2, i = Math.min(1, Math.floor(t));
      p.set(x, y, mix(cols[i], cols[i + 1], t - i), 255 * Math.pow(1 - bi / bands, 1.6));
    }
    const g = { c: p.canvas(), hw: rx, hh: ry }; glowCache.set(key, g); return g;
  }
  function drawGlow(ctx, type, r, x, y, a, flat) {
    const g = glow(type, r, flat); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(g.c, Math.round(x) - g.hw, Math.round(y) - g.hh); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  /* ---- characters (ported from the reference module) */
  function leafStroke(p, x0, y0, ang, len, wid, rmp, bend) {
    for (let k = 0; k <= len * 2; k++) {
      const t = k / (len * 2), x = x0 + Math.cos(ang) * t * len, y = y0 + Math.sin(ang) * t * len + bend * t * t * 3, ci = clamp(Math.round(2 + t * 3), 0, rmp.length - 1);
      p.set(x, y, rmp[ci]);
      if (wid * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7) > 0.8) { const px = -Math.sin(ang), py = Math.cos(ang); p.set(x + px, y + py, rmp[clamp(ci - 1, 0, rmp.length - 1)]); p.set(x - px, y - py, rmp[clamp(ci + 1, 0, rmp.length - 1)]); }
    }
  }
  /** Hero, 26x32 px: pumpkin head with an emissive carved face, teal hooded cape, satchel. walk: 6 frames, idle: 4. */
  function heroPix(walk, k) {
    const W = 26, H = 32, p = new Pix(W, H), cx = 13, FY = 31; const bob = walk ? [1, 0, 0, 1, 0, 0][k] : [0, 0, 1, 1][k], hb = walk ? [1, 1, 0, 1, 1, 0][k] : [0, 0, 0, 1][k];
    const ax = walk ? [2, 1, -1, -2, -1, 1][k] : 1, al = walk ? [0, 0, 0, 0, 1, 1][k] : 0, bl = walk ? [0, 1, 1, 0, 0, 0][k] : 0, arm = walk ? [-1, -1, 0, 1, 1, 0][k] : 0, hem = walk ? [0, -1, -1, 0, -1, -1][k] : [0, -1, -1, 0][k];
    const leg = (lx, lift, dk) => {
      const x0 = cx - 1 + lx; for (let y = 24 + bob; y <= FY - 2 - lift; y++) { p.set(x0, y, R.pants[3 - dk]); p.set(x0 + 1, y, R.pants[2 - dk]); }
      const by = FY - lift; p.set(x0, by - 1, R.leather[3 - dk]); p.set(x0 + 1, by - 1, R.leather[2 - dk]); p.set(x0, by, R.leather[2 - dk]); p.set(x0 + 1, by, R.leather[2 - dk]); p.set(x0 + 2, by, R.leather[1 - dk]);
    }; leg(-ax - 1, bl, 1); leg(ax, al, 0); const top = 14 + bob, hemY = 25 + bob;
    p.blob(cx - 5, top + 1, 3.4, 3, R.cape, { bias: -0.08 });                     // hood bunched behind the head
    for (let y = top; y <= hemY; y++) {                                              // cape: cylinder-shaded cone
      const t = (y - top) / (hemY - top), hw = 3.8 + t * 3.4, ccx = cx - 0.5 - t * 0.9 + (y >= hemY - 2 ? hem : 0);
      for (let x = Math.floor(ccx - hw - 1); x <= Math.ceil(ccx + hw); x++) {
        const nx = (x + 0.5 - ccx) / hw; if (Math.abs(nx) > 1 || (y === hemY && (x + k) % 3 === 0)) continue;
        let v = (nx * LDIR[0] - 0.15 * LDIR[1] + Math.sqrt(1 - nx * nx) * LDIR[2]) * 0.5 + 0.5 - t * 0.1;
        if ((x - Math.round(ccx) + 40) % 4 === 1 && t > 0.3) v -= 0.08;             // fold lines
        p.set(x, y, nx > 0.7 && t > 0.35 ? mix(hx('#7a2f5a'), hx('#c45a7a'), 1 - t) : R.cape[clamp(Math.floor(v * 8), 0, 7)]);
      }
    }
    for (let i = 0; i <= 6; i++) p.set(cx + 3 - i, top + i, R.leather[i < 2 ? 4 : 3]);   // strap + satchel
    for (let y = top + 6; y <= top + 9; y++) for (let x = cx - 8; x <= cx - 4; x++) p.set(x, y, R.leather[y === top + 6 ? 4 : y === top + 9 ? 1 : x === cx - 8 ? 3 : 2]);
    p.set(cx - 6, top + 7, R.gold[4]); p.set(cx + 1, top + 1, R.gold[4]); p.set(cx + 2, top + 1, R.gold[3]);
    for (let y = top + 2; y <= top + 6; y++) { const o = y > top + 4 ? arm : 0; p.set(cx + 3 + o, y, R.cape[5]); p.set(cx + 4 + o, y, R.cape[3]); }
    p.set(cx + 3 + arm, top + 7, R.leather[3]); p.set(cx + 4 + arm, top + 7, R.leather[2]); const hcx = cx + 0.5, hcy = 8.5 + hb, ry = 6.4, RIBS = [-0.62, -0.22, 0.2, 0.6];
    p.blob(hcx, hcy, 7.6, ry, R.pumpkin, { tex: (x, y, nx, ny) => { const lon = nx / Math.sqrt(Math.max(0.08, 1 - ny * ny)); return (RIBS.some((r) => Math.abs(lon - r) < 0.085) ? -0.16 : 0) + (ny < -0.75 ? -0.06 : 0) - 0.03; } });
    const ty = Math.round(hcy - ry); p.set(hcx - 1, ty, R.stem[2]); p.set(hcx - 1, ty - 1, R.stem[3]); p.set(hcx - 2, ty - 2, R.stem[3]); p.set(hcx - 1, ty - 2, R.stem[4]);
    p.set(hcx, ty - 1, R.tops[5]); p.set(hcx + 1, ty - 1, R.tops[6]); p.set(hcx + 1, ty - 2, R.tops[4]); p.set(hcx + 2, ty - 2, R.tops[5]);
    const fx = Math.round(hcx + 1), fy = Math.round(hcy), G0 = hx('#fff6c4'), G1 = hx('#ffd05a'), G2 = hx('#ff9a2e'), G3 = hx('#d4581e'), em = (x, y, c) => p.set(x, y, c, 255, EMIT);
    em(fx - 3, fy - 2, G1); em(fx - 4, fy - 1, G2); em(fx - 3, fy - 1, G0); em(fx - 2, fy - 1, G1); em(fx + 2, fy - 2, G1); em(fx + 1, fy - 1, G1); em(fx + 2, fy - 1, G0); em(fx + 3, fy - 1, G2);
    em(fx - 5, fy + 1, G2); em(fx + 4, fy + 1, G2); em(fx - 1, fy + 1, G1);
    for (let x = fx - 4; x <= fx + 3; x++) em(x, fy + 2, x === fx - 1 ? G2 : (x === fx - 2 || x === fx) ? G0 : G1);
    for (let x = fx - 3; x <= fx + 2; x++) if (x !== fx - 1 && x !== fx + 1) em(x, fy + 3, G3);
    const cut = [];                                                                  // carved rind around glowing holes
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if ((p.f[y * W + x] & EMIT) || !p.a(x, y) || y > hcy + ry) continue; const E = (dx, dy) => (p.f[(y + dy) * W + x + dx] & EMIT) !== 0;
      if (E(0, 1)) cut.push(x, y, 0); else if (E(1, 0) || E(-1, 0)) cut.push(x, y, 1); else if (E(0, -1)) cut.push(x, y, 2);
    }
    for (let i = 0; i < cut.length; i += 3) p.set(cut[i], cut[i + 1], R.pumpkin[cut[i + 2]]); return p;
  }
  /** Small melee enemy, 24x28: glossy violet turnip, cream belly, leaf crown, root legs, glowing angry eyes. 6 frames. */
  function creeperPix(k) {
    const W = 24, H = 28, p = new Pix(W, H), cx = 12, bob = [0, 1, 0, 0, 1, 0][k], tilt = [0, 1, 1, 0, -1, -1][k], TR = R.turnip; const bcy = 15.5 + bob, rx = 7.6, ry = 7.1;
    const leg = (x0, lift, dk) => { for (let y = Math.round(bcy + 4); y <= H - 2 - lift; y++) { p.set(x0, y, R.rbody[4 - dk]); p.set(x0 + 1, y, R.rbody[3 - dk]); } p.set(x0, H - 1 - lift, R.rbody[3 - dk]); p.set(x0 + 1, H - 1 - lift, R.rbody[3 - dk]); p.set(x0 + 2, H - 1 - lift, R.rbody[2 - dk]); };
    leg(cx - 4, [0, 0, 0, 0, 1, 1][k], 1); leg(cx + 1, [0, 1, 1, 0, 0, 0][k], 0); for (let y = Math.floor(bcy - ry - 1); y <= Math.ceil(bcy + ry + 1); y++) {
      const sh = tilt * clamp((bcy - y) / ry, 0, 1); for (let x = 0; x < W; x++) {
        const ny = (y + 0.5 - bcy) / ry, nx = (x + 0.5 - cx - sh) / (rx * (1 - Math.pow(Math.max(0, ny), 2) * 0.38)), dd = nx * nx + ny * ny; if (dd > 1) continue;
        const v = (nx * LDIR[0] + ny * LDIR[1] + Math.sqrt(1 - dd) * LDIR[2]) * 0.55 + 0.36, split = bcy + 1.5 + Math.sin(x * 1.3) * 0.8;
        let topPart = y + 0.5 < split; if (Math.abs(y + 0.5 - split) < 0.9 && (x + y) % 2 === 0) topPart = !topPart;  // checker-dithered seam
        const Rm = topPart ? TR : R.rbody; p.set(x, y, Rm[clamp(Math.floor(v * Rm.length), 0, Rm.length - 2)]);
      }
    }
    const gx = Math.round(cx - 4 + tilt), gy = Math.round(bcy - 4);
    p.set(gx, gy, hx('#ffeefa'), 255, NORIM); p.set(gx + 1, gy, TR[8], 255, NORIM); p.set(gx, gy + 1, TR[7], 255, NORIM);  // gloss
    const lx = cx + tilt + 0.5, ly = bcy - ry + 1, sw = [0, 1, 1, 0, -1, -1][k] * 0.15;
    leafStroke(p, lx - 1, ly, -Math.PI * 0.72 + sw, 6, 1.2, R.tops, -0.3); leafStroke(p, lx + 1, ly, -Math.PI * 0.3 + sw, 6, 1.2, R.tops, -0.3); leafStroke(p, lx, ly, -Math.PI * 0.5 + sw, 8, 1.4, R.tops, -0.2);
    const ex = Math.round(cx + 0.5 + tilt * 0.5), ey = Math.round(bcy - 1), E0 = hx('#ffe2ec'), E1 = hx('#ff4f7a'), BR = hx('#24082c'), em = (x, y, c) => p.set(x, y, c, 255, EMIT), br = (x, y) => p.set(x, y, BR, 255, NORIM);
    em(ex, ey, E1); em(ex, ey + 1, E1); em(ex + 1, ey + 1, E0); br(ex + 1, ey); br(ex, ey - 1);
    em(ex + 4, ey, E1); em(ex + 4, ey + 1, E1); em(ex + 3, ey + 1, E0); br(ex + 3, ey); br(ex + 4, ey - 1);
    br(ex + 1, ey + 4); br(ex + 2, ey + 3); br(ex + 3, ey + 3); br(ex + 4, ey + 4); return p;
  }
  /** Fast floating enemy, 26x30: translucent icy wisp whose tail dithers out; hollow eyes, open mouth. 6 frames. */
  function ghostPix(k) {
    const W = 26, H = 30, p = new Pix(W, H), cx = 12, ph = (k / 6) * Math.PI * 2, hcy = 9, hr = 6.6; for (let y = 2; y < 29; y++) {
      let hw, cxx, alpha, nyv; const head = y + 0.5 <= hcy + 2;
      if (head) { const dy = y + 0.5 - hcy; hw = Math.sqrt(Math.max(0, hr * hr - dy * dy)); cxx = cx; nyv = dy / hr; alpha = 230; } else {
        const t = (y + 0.5 - hcy - 2) / 18; if (t > 1) break;
        hw = 6.4 * Math.pow(1 - t, 0.85) + 0.3; cxx = cx - t * 2 + Math.sin(ph + t * 4.2) * t * 3.2; nyv = 0.2 + t * 0.4; alpha = 225 - t * 150;
      }
      for (let x = 0; x < W; x++) {
        const nx = (x + 0.5 - cxx) / hw, t = (y - hcy) / 18; if (Math.abs(nx) > 1 || (t > 0.55 && dither(x, y) < (t - 0.55) * 1.4)) continue;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - (head ? nyv * nyv : 0)));
        p.set(x, y, R.ice[clamp(Math.floor(((nx * LDIR[0] + nyv * LDIR[1] + nz * LDIR[2]) * 0.5 + 0.55 - Math.max(0, t) * 0.25) * 9), 1, 8)], alpha);
      }
    }
    const reach = Math.round(Math.sin(ph)); for (let i = 0; i < 5; i++) p.set(cx + 6 + i, 13 + Math.round(i * 0.5) + (i > 2 ? reach : 0), R.ice[i < 2 ? 6 : 5], 170);
    p.set(cx + 11, 15 + reach, R.ice[7], 170); p.set(cx + 10, 17 + reach, R.ice[6], 170); const HO = hx('#120c2c'), IN = hx('#2c2a6a'), fx = cx + 1;
    for (const ex of [fx - 3, fx + 1]) { for (const [dx, dy] of [[0, 7], [1, 7], [0, 8], [1, 8], [1, 9]]) p.set(ex + dx, dy, HO, 240, NORIM); p.set(ex, 9, IN, 240, NORIM); p.set(ex, 8, hx('#bff4ff'), 255, EMIT); }
    for (const [x, y] of [[-1, 11], [0, 11], [-2, 12], [-1, 12], [0, 12], [1, 12], [-2, 13], [-1, 13], [0, 13], [1, 13], [-1, 14], [0, 14]]) p.set(fx + x, y, y === 13 && (x === -1 || x === 0) ? IN : HO, 240, NORIM);
    return p;
  }
  /** Round tree: cylinder-shaded trunk + canopy of leaf clusters lit by the whole crown's normal, 3x2-ish leaf cells. */
  function treePix(seed) {
    const g = rng(seed), W = 104, H = 106, p = new Pix(W, H), bx = 52, by = H - 3, lean = g.range(-2.5, 2.5), TR = R.bark; for (let y = 40; y <= by; y++) {
      const t = (y - 40) / (by - 40), cxT = bx + lean * (1 - t); let hw = 3.8 + t * 2.4; if (t > 0.8) hw += Math.pow((t - 0.8) / 0.2, 2) * 5;
      for (let x = Math.floor(cxT - hw - 1); x <= Math.ceil(cxT + hw); x++) {
        const nx = (x + 0.5 - cxT) / hw; if (Math.abs(nx) > 1) continue;
        const v = (nx * LDIR[0] + Math.sqrt(1 - nx * nx) * LDIR[2]) * 0.55 + 0.42 + (hash2(x, Math.floor((y + hash2(x, 0, seed) * 5) / 4), seed) - 0.5) * 0.22;
        p.set(x, y, t > 0.5 && nx > 0.05 && fbm(x / 3, y / 3, 0, seed, 2) > 0.56 ? R.moss[clamp(Math.floor(v * 6), 1, 5)] : TR[clamp(Math.floor(v * TR.length), 0, 8)]);
      }
    }
    const ccx = bx + lean, ccy = 38, CRx = 44, CRy = 31, balls = [];
    for (let i = 0; i < 30; i++) { const a = g.range(0, 6.283), d = Math.sqrt(g.next()) * 0.85, r = g.range(8, 14); balls.push({ x: ccx + Math.cos(a) * d * (CRx - r * 0.7), y: ccy + Math.sin(a) * d * (CRy - r * 0.7), r }); }
    for (let i = 0; i < 3; i++) balls.push({ x: ccx + (i - 1) * 20, y: ccy + CRy * 0.5, r: 13 }); balls.sort((a, b) => a.y - b.y); const LR = R.leaf, n = LR.length;
    for (const b of balls) {
      const bs = hashInt(Math.round(b.x * 7), Math.round(b.y * 13), seed), ryb = b.r * 0.82;
      for (let y = Math.floor(b.y - ryb - 1); y <= Math.ceil(b.y + ryb); y++) for (let x = Math.floor(b.x - b.r - 1); x <= Math.ceil(b.x + b.r); x++) {
        const nx = (x + 0.5 - b.x) / b.r, ny = (y + 0.5 - b.y) / ryb; if (nx * nx + ny * ny > 1 - 0.34 * hash2(x >> 1, y >> 1, bs)) continue;
        let v = 0.42 - ((x + 0.5 - ccx) / CRx) * 0.24 - ((y + 0.5 - ccy) / CRy) * 0.3; if (ny > 0.35) v -= (ny - 0.35) * 0.5; else if (ny < -0.45 && nx < 0.3) v += 0.07;
        const cyl = (y + 0.5) / 3.6 + hash2(Math.floor(x / 4.6), 0, seed) * 0.7, fy = cyl - Math.floor(cyl);   // leaf cells: lit top row, dark seam
        v += (0.5 - fy) * 0.18 - (fy > 0.82 ? 0.07 : 0) + (hash2(x, y, seed) - 0.5) * 0.03; p.set(x, y, LR[clamp(Math.floor(v * n), 0, n - 1)]);
      }
    }
    return { p, ax: bx, ay: by + 1 };
  }
  /** Glowing mushroom cluster prop: emissive gill row + spots, cyan light. */
  function shroomPix(seed) {
    const g = rng(seed), W = 26, H = 22, p = new Pix(W, H), ms = [];
    for (let i = 0; i < 4; i++) ms.push({ x: 5 + i * 5 + g.int(-1, 1), h: i === 1 ? g.int(9, 12) : g.int(4, 8) }); ms.sort((a, b) => b.h - a.h); for (const m of ms) {
      const top = H - 1 - m.h, sw = m.h > 7 ? 2 : 1, r = 2.2 + m.h * 0.35, cx = m.x + sw / 2, cy = top + 0.5;
      for (let y = top; y < H; y++) for (let k = 0; k < sw; k++) p.set(m.x + k, y, R.mstem[clamp(2 - k - (y > H - 3 ? 1 : 0), 0, 4)]);
      p.blob(cx, cy, r, r * 0.72, R.shroom, { mask: (x, y) => y <= top, bias: -0.2, k: 1.3, top: 2 });
      for (let x = Math.ceil(cx - r) + 1; x < cx + r - 1; x++) p.set(x, top + 1, (x & 1) ? R.shroom[6] : R.shroom[5], 255, EMIT);
      for (let s = 0; s < 3; s++) { const sx = Math.round(cx + g.range(-r * 0.6, r * 0.4)), sy = Math.round(cy - g.range(0.5, r * 0.5)); if (p.a(sx, sy)) p.set(sx, sy, R.shroom[7], 255, EMIT); }
    }
    return { p, ax: 13, ay: H - 1 };
  }
  function rockPix(seed, w, h) {
    const W = w + 2, H = h + 2, p = new Pix(W, H), cx = W / 2, cy = H - h * 0.48 - 1, rx = w / 2, ry = h * 0.55;
    p.blob(cx, cy, rx, ry, R.stone.slice(2), { edge: (x, y) => 1 - 0.16 * hash2(x >> 1, y >> 1, seed), mask: (x, y) => y < H - 1, tex: (x, y, nx) => (hash2(x >> 1, y >> 1, seed + 1) - 0.5) * 0.1 + (Math.floor((nx + 1) * 2.2) % 2 ? 0.05 : -0.03) });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {                      // moss cap on the upper-left
      const ny = (y + 0.5 - cy) / ry, nx = (x + 0.5 - cx) / rx;
      if (p.a(x, y) && ny < -0.05 + (fbm(x / 3, y / 3, 0, seed, 2) - 0.5) * 1.2 - nx * 0.25) p.set(x, y, hash2(x, y, seed + 9) < 0.035 ? FLOWERS.white[2] : R.moss[clamp(Math.round(5 - (ny + 1) * 2 - nx * 1.2), 1, 7)]);
    }
    return { p, ax: Math.floor(W / 2), ay: H - 1 };
  }

  /* ---- ground: posterised painterly grass + meadow with blossom pixels, decals, warm/cool light pools */
  function grassTex(seed, rmp, lo, hi) {
    const out = new Uint8Array(65536), n = hi - lo + 1; for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const v = 0.5 + (fbm(x / 64, y / 64, 4, seed, 3) - 0.5) * 1.5 + (fbm(x / 16, y / 16, 16, seed + 1, 2) - 0.5) * 0.6 + (fbm(x / 4, y / 4, 64, seed + 2, 1) - 0.5) * 0.32;
      out[(y << 8) | x] = lo + clamp(Math.floor(v * n), 0, n - 1);
    }
    return out;
  }
  function decal(p) {                                                                // tiny 1px cast shadow to the right
    for (let y = p.h - 3; y < p.h; y++) for (let x = p.w - 1; x >= 0; x--) if (p.a(x, y) && !p.a(x + 1, y) && !(p.f[y * p.w + x] & NOOUT)) p.set(x + 1, y, SHADOW, 90, NOOUT);
    return p.canvas();
  }
  function tuftPix(g, rmp) {
    const p = new Pix(7, 6), n = g.int(3, 5);
    for (let b = 0; b < n; b++) { const bx = Math.round(6 * (b + 0.5) / n + g.range(-0.6, 0.6)), hg = g.int(3, 5), lean = g.range(-1.2, 1.2); for (let k = 0; k < hg; k++) { const t = k / (hg - 1); p.set(Math.round(bx + lean * t * t), 5 - k, rmp[clamp(Math.round(3 + t * (rmp.length - 4)), 0, rmp.length - 1)]); } }
    return p;
  }
  function flowerPix(g, n) {
    const p = new Pix(9, 7); for (let i = 0; i < n; i++) {
      const x = g.int(1, 7), top = g.int(1, 4), C = g.pick([FLOWERS.pink, FLOWERS.white, FLOWERS.lav, FLOWERS.peach]);
      for (let k = 1; k <= 6 - top; k++) p.set(x, top + k, R.tops[k === 6 - top ? 2 : 3]);
      p.set(x, top - 1, C[2]); p.set(x - 1, top, C[2]); p.set(x + 1, top, C[1]); p.set(x, top + 1, C[0]); p.set(x, top, CENTER);
    }
    return p;
  }
  function bakeGround(W, H, ox, oy) {
    const gA = grassTex(101, R.grass, 3, 7), gM = grassTex(303, R.meadow, 4, 8), c = mkCanvas(W, H), x2 = c.getContext('2d'), img = x2.createImageData(W, H), d = img.data;
    const bt = new Uint8Array(65536).fill(255), bc = [], g = rng(606), sets = [FLOWERS.lav, FLOWERS.lav, FLOWERS.pink, FLOWERS.white, FLOWERS.white, FLOWERS.gold];
    for (let k = 0; k < 340; k++) {                                                  // blossom map: threshold per pixel, revealed by meadow weight
      const cx = g.int(0, 255), cy = g.int(0, 255), F = g.pick(sets), t = g.int(20, 235), n = g.int(3, 9);
      for (let j = 0; j < n; j++) { const x = cx + g.int(-5, 5), y = cy + g.int(-3, 3); [[0, 0, 2], [1, 0, 1], [0, 1, 0]].forEach(([dx, dy, s]) => { const i = (((y + dy) & 255) << 8) | ((x + dx) & 255); bt[i] = t; bc[i] = F[s]; }); }
    }
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const X = px + ox, Y = py + oy, t = ((Y & 255) << 8) | (X & 255); let col = R.grass[gA[t]]; const wm = sstep(0.42, 0.53, fbm(X / 170 + 31.7, Y / 170 - 12.3, 0, 23, 3));
      if (wm > 0) { col = mix(col, R.meadow[gM[t]], wm); if (bt[t] < wm * 255) col = bc[t]; }
      const fL = fbm(X / 120, Y / 120, 0, 67, 2), warm = sstep(0.56, 0.75, fL), cool = sstep(0.46, 0.28, fL); const o = (py * W + px) * 4;
      d[o] = col[0] * (1 + 0.17 * warm - 0.1 * cool); d[o + 1] = col[1] * (1 + 0.07 * warm - 0.07 * cool); d[o + 2] = col[2] * (1 - 0.05 * warm + 0.06 * cool); d[o + 3] = 255;
    }
    x2.putImageData(img, 0, 0);
    const dg = rng(9001), tufts = [0, 1, 2, 3].map(() => decal(tuftPix(dg, R.grass.slice(2)))), tuftM = [0, 1, 2].map(() => decal(tuftPix(dg, R.meadow.slice(3)))), fl = [0, 1, 2, 3, 4].map(() => decal(flowerPix(dg, dg.int(3, 5))));
    for (let cy = Math.floor(oy / 15); cy <= (oy + H) / 15; cy++) for (let cx = Math.floor(ox / 15); cx <= (ox + W) / 15; cx++) {
      const r = rng(hashInt(cx, cy, 1302)), x = (cx + r.next()) * 15 - ox, y = (cy + r.next()) * 15 - oy, v = r.next();
      const meadow = fbm((x + ox) / 170 + 31.7, (y + oy) / 170 - 12.3, 0, 23, 3) > 0.47, im = meadow ? (v < 0.25 ? r.pick(fl) : v < 0.45 ? r.pick(tuftM) : null) : (v < 0.22 ? r.pick(tufts) : v < 0.3 ? r.pick(fl) : null);
      if (im) x2.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height + 1));
    }
    return c;
  }

  /* ---- baked sprite sets */
  let S = null;
  function build() {
    const both = (pix, o) => [finish(pix, o), finish(pix.flip(), Object.assign({}, o, { ox: pix.w - o.ox }))];
    S = { hero: [[0, 1, 2, 3, 4, 5].map((k) => both(heroPix(1, k), { ox: 13, oy: 32 })), [0, 1, 2, 3].map((k) => both(heroPix(0, k), { ox: 13, oy: 32 }))],
      heroSh: makeShadow(heroPix(0, 0), 13, 32, { contact: 6, alpha: 0.32 }), crSh: makeShadow(creeperPix(0), 12, 28, { contact: 6, alpha: 0.3 }),
      cr: [0, 1, 2, 3, 4, 5].map((k) => both(creeperPix(k), { ox: 12, oy: 28 })),
      gh: [0, 1, 2, 3, 4, 5].map((k) => both(ghostPix(k), { ox: 12, oy: 30, rim: hx('#f4ffff'), rimA: 0.5, cool: hx('#7466e6'), coolA: 0.3, outA: 0.55, dark: hx('#141640'), lit: hx('#3a4a9a') })) };
    const prop = (r, fin) => { const s = finish(r.p, Object.assign({ ox: r.ax, oy: r.ay }, fin)); s.sh = makeShadow(r.p, r.ax, r.ay, { kx: 0.78, ky: 0.28, alpha: 0.3 }); return s; };
    S.tree = prop(treePix(11), { rim: hx(PALETTE.rimLeaf), rimA: 0.5, coolA: 0.26 }); S.shroom = prop(shroomPix(81), { rimA: 0.25 }); S.rock = prop(rockPix(41, 22, 14), {});
    const gp = new Pix(16, 6); gp.blob(8, 3, 7, 2.6, [SHADOW]); for (let i = 3; i < gp.d.length; i += 4) if (gp.d[i]) gp.d[i] = 70; S.ghSh = { c: gp.canvas(), ox: 6, oy: 3 };
    const gem = new Pix(5, 7); gem.blob(2.5, 3.6, 2.1, 2.9, R.amber, { bias: 0.08 }); gem.set(2, 0, R.amber[3]); gem.set(1, 2, R.amber[5], 255, EMIT);
    S.gem = finish(gem, { ox: 2.5, oy: 7, rimA: 0.3, dark: hx('#4a1020'), lit: hx('#7a2a2a') });
    const orb = new Pix(14, 17); orb.blob(7, 10, 5.6, 5.2, R.turnip, { rampAt: (x, y) => (y + 0.5 < 9.5 + Math.sin(x) * 0.6 ? R.turnip : R.cream) });
    for (const [x, y, c] of [[5, 9, '#ffc040'], [4, 10, '#ff8a2a'], [5, 10, '#fff2b0'], [8, 9, '#ffc040'], [8, 10, '#fff2b0'], [9, 10, '#ff8a2a'], [4, 12, '#ffc040'], [5, 12, '#fff2b0'], [6, 12, '#ffc040'], [7, 12, '#fff2b0'], [8, 12, '#ffc040'], [9, 12, '#fff2b0']]) orb.set(x, y, hx(c), 255, EMIT);
    leafStroke(orb, 6.5, 5, -Math.PI * 0.62, 4, 1, R.tops, -0.2); S.orb = finish(orb, { ox: 7, oy: 17 });
    const sd = new Pix(9, 9); for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) { const u = x + 0.5 - 4.5, v = y + 0.5 - 4.5, w = 1.7 * (1 - Math.max(0, u) / 3 * 0.45); if ((u / 3) ** 2 + (v / w) ** 2 <= 1) sd.set(x, y, R.seed[clamp(Math.floor(((u * LDIR[0] + v * LDIR[1]) * 0.35 + 0.62) * 6), 1, 5)]); }
    S.seed = finish(sd, { ox: 4.5, oy: 4.5, rimA: 0.35, coolA: 0, dark: hx('#3a1a20'), lit: hx('#6a3a30') });
    S.petal = [FLOWERS.pink, FLOWERS.white, FLOWERS.peach].map((C) => { const p = new Pix(3, 3); p.set(0, 0, C[2]); p.set(1, 0, C[1]); p.set(0, 1, C[1]); p.set(1, 1, C[0]); return p.canvas(); });
  }
  const spr = (ctx, s, x, y) => ctx.drawImage(s.c, Math.round(x) - s.ox, Math.round(y) - s.oy);

  /** Draws the hero with feet at (x, y) in art pixels (1 px = 1 world unit). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing, moving = true) {
    if (!S) build(); const fr = moving ? S.hero[0][Math.floor(t * 9) % 6] : S.hero[1][Math.floor(t * 3.2) % 4]; spr(ctx, fr[facing < 0 ? 1 : 0], x, y);
    drawGlow(ctx, 'warm', 14, x + facing * 1.5, y - 21, 0.3 * (0.85 + 0.1 * Math.sin(t * 8.1) + 0.05 * Math.sin(t * 19.3)));  // face glow
  }
  /** Draws a typical enemy with feet at (x, y). kind: 'creeper' (default) | 'ghost'. */
  function drawEnemy(ctx, x, y, t, kind = 'creeper', facing = -1, seed = 0) {
    if (!S) build(); const f = facing < 0 ? 1 : 0; if (kind === 'ghost') {
      const fy = y - 4 - Math.round(Math.sin(t * 3 + seed * 9) * 1.5); ctx.globalAlpha = 0.92; spr(ctx, S.gh[Math.floor(t * 9 + seed * 6) % 6][f], x, fy); ctx.globalAlpha = 1;
      drawGlow(ctx, 'ice', 9, x, fy - 14, 0.16);
    } else {
      spr(ctx, S.cr[Math.floor(t * 5.5 + seed * 6) % 6][f], x, y); drawGlow(ctx, 'eye', 3, x + (facing < 0 ? -2 : 3), y - 14, 0.45);
    }
  }

  /* ---- screen grade on the low-res buffer: multiply tint, bloom (downsample, square, screen), sun glow, vignette */
  let GR = null;
  function buildGrade(W, H) {
    const mk = (fn) => { const c = mkCanvas(W, H); fn(c.getContext('2d')); return c; };
    GR = { key: W + 'x' + H, bw: Math.max(8, Math.round(W / 5)), bh: Math.max(6, Math.round(H / 5)) };
    GR.tint = mk((c) => { const g = c.createLinearGradient(0, H * 0.1, W, H * 0.9); g.addColorStop(0, '#fff0dc'); g.addColorStop(0.4, '#f0dce0'); g.addColorStop(0.75, '#b8a6d4'); g.addColorStop(1, '#8a76c0'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
    GR.sun = mk((c) => { const g = c.createRadialGradient(-W * 0.05, -H * 0.1, 0, -W * 0.05, -H * 0.1, W * 0.75); g.addColorStop(0, 'rgba(255,170,110,0.55)'); g.addColorStop(0.35, 'rgba(255,140,120,0.22)'); g.addColorStop(1, 'rgba(255,120,140,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
    GR.vig = mk((c) => { c.translate(W / 2, H / 2); c.scale(1, H / W); const g = c.createRadialGradient(0, 0, W * 0.22, 0, 0, W * 0.72); g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#e4dcf0'); g.addColorStop(1, '#5c4a8a'); c.fillStyle = g; c.fillRect(-W, -W, W * 2, W * 2); });
    GR.b1 = mkCanvas(GR.bw, GR.bh); GR.b2 = mkCanvas(GR.bw, GR.bh);
  }
  function grade(ctx, W, H, t) {
    if (!GR || GR.key !== W + 'x' + H) buildGrade(W, H); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(GR.tint, 0, 0);
    const b1 = GR.b1.getContext('2d'), b2 = GR.b2.getContext('2d'); b1.globalCompositeOperation = 'copy'; b1.drawImage(ctx.canvas, 0, 0, W, H, 0, 0, GR.bw, GR.bh);
    b2.globalCompositeOperation = 'copy'; b2.drawImage(GR.b1, 0, 0); b2.globalCompositeOperation = 'multiply'; b2.drawImage(GR.b1, 0, 0); b2.drawImage(GR.b1, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.7; ctx.drawImage(GR.b2, 0, 0, W, H); ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.9 + 0.1 * Math.sin(t * 0.35); ctx.drawImage(GR.sun, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.9; ctx.drawImage(GR.vig, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  /* ---- preview scene */
  let BUF = null, GROUND = null, GKEY = '';
  const TRAIL = ['#ffe9a0', '#ffc35a', '#ff9a4a', '#f06a6a', '#c04a8a'];
  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, hero, enemies, an effect. */
  function draw(ctx, w, h, t) {
    if (!S) build(); const up = Math.max(1, Math.round(h / 360)), W = Math.ceil(w / up), H = Math.ceil(h / up);    // 360 art px tall
    if (!BUF || BUF.width !== W || BUF.height !== H) { BUF = mkCanvas(W, H); }
    if (GKEY !== W + 'x' + H) { GROUND = bakeGround(W, H, -Math.floor(W / 2), -Math.floor(H / 2)); GKEY = W + 'x' + H; }
    const b = BUF.getContext('2d'), cx = Math.floor(W / 2), cy = Math.floor(H / 2) + 10;
    b.setTransform(1, 0, 0, 1, 0, 0); b.imageSmoothingEnabled = false; b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.drawImage(GROUND, 0, 0);
    const fl = 0.9 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 17.1);
    drawGlow(b, 'warm', 50, cx, cy - 2, 0.42 * fl, true); drawGlow(b, 'amber', 16, cx, cy - 1, 0.35 * fl, true);   // hero light pool
    const sh = [[S.tree, cx - 150, cy - 30], [S.shroom, cx - 70, cy + 70], [S.rock, cx + 60, cy + 80]];
    drawGlow(b, 'cyan', 30, cx - 70, cy + 68, 0.32 * (0.75 + 0.25 * Math.sin(t * 1.6)), true); const actors = [{ y: cy, f: () => drawHero(b, cx, cy, t, 1) }];
    for (const [s, x, y] of sh) { spr(b, s.sh, x, y); actors.push({ y, f: () => spr(b, s, x, y) }); }
    actors.push({ y: cy + 70, f: () => drawGlow(b, 'cyan', 14, cx - 70, cy + 62, 0.3 * (0.75 + 0.25 * Math.sin(t * 1.6))) });
    const foes = [[cx + 70, cy + 6, 'creeper', 0.1], [cx + 105, cy - 22, 'creeper', 0.55], [cx + 120, cy + 34, 'creeper', 0.8], [cx - 80, cy - 10, 'ghost', 0.3], [cx - 40, cy - 60, 'ghost', 0.7]];
    for (const [x, y, k, sd] of foes) {
      if (k === 'ghost') spr(b, S.ghSh, x, y); else spr(b, S.crSh, x, y); actors.push({ y, f: () => drawEnemy(b, x, y, t, k, k === 'ghost' ? 1 : -1, sd) });
    }
    actors.sort((a, c) => a.y - c.y).forEach((a) => a.f()); for (let i = 0; i < 4; i++) {                                                    // pickups: amber shards bobbing
      const gx = cx + [-30, 40, 30, -100][i], gy = cy + [40, -40, 60, 30][i], bob = Math.round(Math.sin(t * 3 + i * 6) * 1.2);
      drawGlow(b, 'amber', 4, gx, gy, 0.4, true); drawGlow(b, 'amber', 6, gx, gy - bob - 3, 0.5 + 0.18 * Math.sin(t * 4 + i * 9)); spr(b, S.gem, gx, gy - bob);
    }
    for (let i = 0; i < 2; i++) {                                                    // orbiting lantern familiars
      const a = t * 2.2 + i * Math.PI, ox = cx + Math.cos(a) * 30, oy = cy - 12 + Math.sin(a) * 18, bob = Math.round(Math.sin(t * 4 + i * 1.7) * 1.2);
      b.globalAlpha = 0.3; b.drawImage(S.ghSh.c, Math.round(ox) - 5, Math.round(oy + 9)); b.globalAlpha = 1;
      spr(b, S.orb, ox, oy + 6 - bob); drawGlow(b, 'warm', 13, ox, oy - 4 - bob, 0.5 * (0.85 + 0.15 * Math.sin(t * 9 + i)));
    }
    const ph = (t * 1.3) % 1, px = cx + 8 + ph * 56, py = cy - 14 + ph * 6;           // seed projectile + 5-pixel ember trail
    b.fillStyle = 'rgba(20,10,40,0.35)'; b.fillRect(Math.round(px + 2), Math.round(py + 7), 2, 1); drawGlow(b, 'amber', 5, px, py, 0.45);
    b.globalCompositeOperation = 'lighter'; for (let i = 1; i <= 5; i++) { b.globalAlpha = 0.8 - i * 0.14; b.fillStyle = TRAIL[i - 1]; b.fillRect(Math.round(px - (i * 2 + 1)), Math.round(py), 1, 1); }
    b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; spr(b, S.seed, px, py);
    for (let i = 0; i < 14; i++) {                                                   // drifting petals + fireflies
      const s1 = hash2(i, 1, 818), s2 = hash2(i, 2, 818), sp = 10 + s1 * 12;
      b.globalAlpha = 0.85; b.drawImage(S.petal[i % 3], Math.round((s1 * 997 + t * sp * 1.6) % W), Math.round((s2 * 677 + t * sp * 0.55 + Math.sin(t * 0.9 + i) * 8) % H)); b.globalAlpha = 1;
      const fx = (hash2(i, 3, 616) * W + Math.sin(t * 0.45 + i) * 26) % W, fy = (hash2(i, 4, 616) * H + Math.cos(t * 0.33 + i) * 16) % H, br = Math.max(0, Math.sin(t * 1.4 + i * 3));
      if (br > 0.05) { drawGlow(b, 'fly', 5, fx, fy, br * 0.8); b.globalAlpha = br; b.fillStyle = '#f6ffd0'; b.fillRect(Math.round(fx), Math.round(fy), 1, 1); b.globalAlpha = 1; }
    }
    grade(b, W, H, t); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(BUF, 0, 0, W * up, H * up);  // nearest-neighbour upscale
    const k = h / 540;                                                               // HUD at display resolution
    ctx.fillStyle = 'rgba(20,12,40,0.78)'; ctx.fillRect(24 * k, 14 * k, w - 48 * k, 9 * k);
    ctx.fillStyle = '#7ee0cc'; ctx.fillRect(25 * k, 15 * k, (w - 50 * k) * 0.58, 7 * k);
    ctx.strokeStyle = 'rgba(232,184,90,0.75)'; ctx.lineWidth = Math.max(1, k); ctx.strokeRect(24 * k, 14 * k, w - 48 * k, 9 * k);
    ctx.textAlign = 'center'; ctx.font = `900 ${Math.round(32 * k)}px Cinzel, serif`; ctx.fillStyle = '#1a0f24'; ctx.fillText('22:09', w / 2, 62 * k + 2 * k);
    ctx.fillStyle = '#fff4dc'; ctx.shadowColor = 'rgba(255,170,110,0.65)'; ctx.shadowBlur = 14 * k; ctx.fillText('22:09', w / 2, 62 * k); ctx.shadowBlur = 0;
    ctx.font = `700 ${Math.round(10 * k)}px Cinzel, serif`; ctx.fillStyle = '#e8b85a'; ctx.fillText('U N T I L   M I D N I G H T', w / 2, 80 * k);
  }

  const Starter = { id: 'dusk', name: 'Dusk Grove', palette: PALETTE, fonts: ['Cinzel:wght@700;900', 'Pixelify Sans:wght@400;600'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['dusk'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
