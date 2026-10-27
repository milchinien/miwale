/* Native art for the new enemies / upgrades in the 'Dusk Forest' world – see js/content/ART_API.md.
   Same technique as js/styles/dusk.js ("HD-2D" pixel art, 1 art pixel = 1 world unit): hue-shifted ramps, per-pixel
   shaded sprites lit from the upper left, a finishing pass with a two-tone rim light (warm sun left / cool bounce right)
   and a selective coloured outline, long sheared cast shadows, additive banded glow sprites for eyes and magic. */
(function () {
  'use strict';
  const U = window.U, C = window.Content;
  const hx = U.hex, mix = U.mix, clamp = U.clamp;
  const rp = (...a) => a.map(hx);
  const TAU = Math.PI * 2;

  /* ---------- palette (copied from the style + accents for the new family members) ---------- */
  const P = { ink: hx('#150c29'), plum: hx('#4a2c62'), rim: hx('#ffcfa2'), bounce: hx('#8d86ea'), shadow: hx('#1a1034') };
  const R = {
    stone: rp('#141127', '#1f1b34', '#2a2641', '#36324f', '#433e5c', '#504a69', '#5f5876', '#6f6782', '#82788f', '#988b9e', '#b3a2b0'),
    bark: rp('#160f22', '#21162d', '#2d1d36', '#3b2540', '#4b2f49', '#5d3a51', '#714758', '#88565f', '#a26a68'),
    pumpkin: rp('#3a1428', '#64202c', '#93332c', '#c24f2c', '#e5742f', '#f79a3e', '#ffc35c', '#ffe08c'),
    stem: rp('#13201f', '#203324', '#33492a', '#4d6330', '#6d7d3a'),
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
    shroom: rp('#0c2440', '#123a5a', '#185274', '#1f6c8a', '#2a8a9a', '#3fb0ae', '#7ee0cc', '#d0fff2'),
    mstem: rp('#3e3858', '#625a7e', '#8d85a4', '#b9b0c8', '#e2dbe8'),
    berry: rp('#330c2c', '#641440', '#9c2152', '#d63a6a', '#ff6e8e', '#ffb4c4'),
    flame: rp('#b8401c', '#f07a26', '#ffb648', '#ffe48a', '#fffbe0'),
    gold: rp('#5a3420', '#8e5a2a', '#c48a3a', '#e8b85a', '#ffe08e', '#fff6d0'),
    leather: rp('#25132a', '#3f1f2e', '#5e3135', '#81493d', '#a5654b', '#c8875c'),
    // new
    tox: rp('#0f2430', '#123f36', '#1a6a3a', '#3a9a36', '#78c83a', '#b8ec4a', '#eaff8a', '#fbffd8'),
    beet: rp('#2a0a26', '#4e0f30', '#7a1634', '#a8213a', '#d23a3e', '#f06a4a', '#ffa070'),
    horn: rp('#1e1226', '#33203a', '#4e3446', '#6c4c52', '#8e6a62', '#b28e78', '#d6b896'),
    shawl: rp('#141a3a', '#1c2a52', '#253c68', '#30527c', '#3f6a8c', '#5a849a'),
  };
  const FLOWERS = { pink: rp('#a24f7e', '#e58bb4', '#ffc4dc'), white: rp('#9d93b4', '#e8e0ec', '#ffffff'), lav: rp('#5d47a2', '#9a7fe0', '#cfbfff') };
  const E0 = hx('#ffe2ec'), E1 = hx('#ff4f7a'), BR = hx('#24082c');

  /* ---------- pixel painter (same as the style) ---------- */
  const EMIT = 1, NOOUT = 2, NORIM = 4;
  const LDIR = (() => { const v = [-0.62, -0.5, 0.6], n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; })();
  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); this.f = new Uint8Array(w * h); }
    idx(x, y) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1; return y * this.w + x; }
    set(x, y, c, a = 255, fl = 0) {
      const i = this.idx(x, y);
      if (i < 0 || !c) return;
      const o = i * 4, d = this.d;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = a; this.f[i] = fl;
    }
    a(x, y) { const i = this.idx(x, y); return i < 0 ? 0 : this.d[i * 4 + 3]; }
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
    blob(cx, cy, rx, ry, rmp, o = {}) {
      const L = LDIR, k = o.k === undefined ? 1 : o.k, bias = o.bias || 0;
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx); x++) {
          const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, dd = nx * nx + ny * ny;
          if (dd > 1) continue;
          if (o.over && !this.a(x, y)) continue;
          if (o.mask && !o.mask(x, y, nx, ny)) continue;
          const nz = Math.sqrt(Math.max(0, 1 - dd));
          let v = (nx * L[0] + ny * L[1] + nz * L[2]) * k * 0.5 + 0.5 + bias;
          if (o.tex) v += o.tex(x, y, nx, ny);
          const Rm = o.rampAt ? o.rampAt(x, y, nx, ny) : rmp;
          const i = clamp(Math.floor(v * Rm.length), o.min || 0, Rm.length - 1 - (o.top || 0));
          this.set(x, y, Rm[i], 255, o.flag || 0);
        }
      }
    }
    flip() {
      const p = new Pix(this.w, this.h);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const s = y * this.w + x, t = y * this.w + (this.w - 1 - x);
        for (let k = 0; k < 4; k++) p.d[t * 4 + k] = this.d[s * 4 + k];
        p.f[t] = this.f[s];
      }
      return p;
    }
    canvas() { return fromData(this.d, this.w, this.h); }
  }
  function fromData(d, w, h) {
    const { c, ctx } = U.canvas(w, h);
    const img = ctx.createImageData(w, h);
    img.data.set(d);
    ctx.putImageData(img, 0, 0);
    return c;
  }
  /* rim light + selective outline (copied from the style) */
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
        if (!sol(x - 1, y)) lit = 1; else if (!sol(x, y - 1)) lit = 0.75; else if (!sol(x - 1, y - 1)) lit = 0.3;
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
        od[t] = oc[0]; od[t + 1] = oc[1]; od[t + 2] = oc[2]; od[t + 3] = d[q + 3];
      }
    }
    return { c: fromData(od, W, H), ox: (o.ox !== undefined ? o.ox : w / 2) + 1, oy: (o.oy !== undefined ? o.oy : h) + 1 };
  }
  /* long sheared cast shadow (copied from the style) */
  function makeShadow(p, ax, ay, o = {}) {
    const kx = 0.8, ky = 0.3;
    const pts = [];
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      if (!p.d[(y * p.w + x) * 4 + 3]) continue;
      const hgt = Math.max(0, ay - (y + 0.5));
      const sx = Math.floor(x + hgt * kx), sy = Math.floor(ay - 0.5 - hgt * ky);
      pts.push(sx, sy);
      if (sx < minx) minx = sx; if (sx > maxx) maxx = sx; if (sy < miny) miny = sy; if (sy > maxy) maxy = sy;
    }
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
    for (let y = 0; y < H; y++) for (let x = 1; x < W - 1; x++) if (!m[y * W + x] && m[y * W + x - 1] >= 2 && m[y * W + x + 1] >= 2) m[y * W + x] = 2;
    const band = new Uint8Array(m);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (m[y * W + x]) continue;
      if (m[y * W + x - 1] || m[y * W + x + 1] || m[(y - 1) * W + x] || m[(y + 1) * W + x]) band[y * W + x] = 1;
    }
    const d = new Uint8ClampedArray(W * H * 4), sc = P.shadow;
    const A = [0, 0.18, o.alpha || 0.3, 0.5];
    for (let i = 0; i < W * H; i++) {
      if (!band[i]) continue;
      d[i * 4] = sc[0]; d[i * 4 + 1] = sc[1]; d[i * 4 + 2] = sc[2]; d[i * 4 + 3] = 255 * A[band[i]];
    }
    return { c: fromData(d, W, H), ox: ax - minx + pad, oy: ay - miny + pad };
  }
  /* additive banded glow sprites (copied from the style) */
  const GLOWCOL = {
    warm: rp('#fff0b8', '#ffab4a', '#d8456a'),
    eye: rp('#ffe0ea', '#ff4f7a', '#8a2060'),
    fly: rp('#f6ffc8', '#c8f070', '#3a9a7a'),
    tox: rp('#fbffd8', '#a8f04a', '#2a8a5a'),
    red: rp('#fff0e0', '#ff5a3a', '#a01a40'),
    pink: rp('#fff4fa', '#ff9ac8', '#9a5ae0'),
    ice: rp('#ffffff', '#9fd8ff', '#6a5ae0'),
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
    g = { c: p.canvas(), hw: rx, hh: ry };
    glowCache.set(key, g);
    return g;
  }
  function drawGlow(ctx, type, r, x, y, a, flat) {
    if (a <= 0.01) return;
    const g = glow(type, r, flat);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(g.c, Math.round(x) - g.hw, Math.round(y) - g.hh);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  function leafStroke(p, x0, y0, ang, len, wid, rmp, bend) {
    for (let k = 0; k <= len * 2; k++) {
      const t = k / (len * 2);
      const x = x0 + Math.cos(ang) * t * len, y = y0 + Math.sin(ang) * t * len + bend * t * t * 3;
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
  const lv = (nx, ny, nz) => nx * LDIR[0] + ny * LDIR[1] + nz * LDIR[2];
  /* pointed turnip bulb like the style's creeper: top ramp above a wavy split, bottom ramp below */
  function bulb(p, bcx, bcy, rx, ry, TOP, BOT, o = {}) {
    const W = p.w, split0 = o.split === undefined ? 1.5 : o.split, tilt = o.tilt || 0, pinch = o.pinch === undefined ? 0.38 : o.pinch;
    for (let y = Math.floor(bcy - ry - 1); y <= Math.ceil(bcy + ry + 1); y++) {
      const sh = tilt * clamp((bcy - y) / ry, 0, 1);
      for (let x = 0; x < W; x++) {
        const ny = (y + 0.5 - bcy) / ry;
        const rxe = rx * (1 - Math.pow(Math.max(0, ny), 2) * pinch);
        const nx = (x + 0.5 - bcx - sh) / rxe, dd = nx * nx + ny * ny;
        if (dd > 1) continue;
        const nz = Math.sqrt(1 - dd);
        let v = lv(nx, ny, nz) * 0.55 + 0.36;
        const split = bcy + split0 + Math.sin(x * 1.3 + (o.seed || 0)) * 0.8;
        let top = y + 0.5 < split;
        if (Math.abs(y + 0.5 - split) < 0.9 && (x + y) % 2 === 0) top = !top;
        let Rm = top ? TOP : BOT;
        if (o.spots) { const s = o.spots(x, y, nx, ny, top); if (s) { Rm = s; v -= 0.02; } }
        if (o.tex) v += o.tex(x, y, nx, ny, top);
        p.set(x, y, Rm[clamp(Math.floor(v * Rm.length), 0, Rm.length - 2)]);
      }
    }
  }

  /* =========================================================================
     Enemy sprites (face right; the finished record holds both facings)
     ========================================================================= */
  function spitterPix(k, swell, recoil) {
    const W = 30, H = 30, p = new Pix(W, H), cx = 12;
    const bob = [0, 1, 0, 0, 1, 0][k], tilt = [0, 1, 1, 0, -1, -1][k];
    const al = [0, 1, 1, 0, 0, 0][k], bl = [0, 0, 0, 0, 1, 1][k];
    const bcx = cx - recoil, bcy = 17.5 + bob + recoil * 0.8;
    const rx = 7.6 + swell * 1.6 + recoil, ry = 7.1 + swell * 0.9 - recoil;
    const leg = (x0, lift, dk) => {
      for (let y = Math.round(bcy + 4); y <= H - 2 - lift; y++) { p.set(x0, y, R.cream[4 - dk]); p.set(x0 + 1, y, R.cream[3 - dk]); }
      p.set(x0, H - 1 - lift, R.cream[3 - dk]); p.set(x0 + 1, H - 1 - lift, R.cream[3 - dk]); p.set(x0 + 2, H - 1 - lift, R.cream[2 - dk]);
    };
    leg(cx - 4, bl, 1); leg(cx + 1, al, 0);
    // mottled violet / acid-green skin, pale belly
    bulb(p, bcx, bcy, rx, ry, R.turnip, R.cream, {
      tilt, seed: 3,
      spots: (x, y, nx, ny) => (U.perlin(nx * 2.3 + 4.1, ny * 2.3 + 2.2, 11) > 0.2 && ny < 0.5 ? R.tox : null),
    });
    // puffed cheek
    if (swell > 0.2) p.blob(bcx + rx * 0.4, bcy + ry * 0.22, 1.2 + swell * 1.7, (1.2 + swell * 1.7) * 0.85, R.cream, { bias: 0.15 });
    // snout tube
    const sy = Math.round(bcy + 1.5), hh = 2 + Math.round(swell * 0.6);
    const bx = Math.round(bcx + rx - 3), ex = Math.round(bcx + rx + 4 + swell * 0.6 - recoil * 2.4);
    for (let x = bx; x <= ex - 2; x++) for (let y = sy - hh; y <= sy + hh; y++) {
      const ny = (y + 0.5 - sy - 0.5) / (hh + 0.5), nz = Math.sqrt(Math.max(0, 1 - ny * ny));
      const v = lv(0, ny, nz) * 0.55 + 0.4 + (x === ex - 2 ? 0.06 : 0);
      p.set(x, y, R.turnip[clamp(Math.floor(v * 9), 1, 7)]);
    }
    for (let y = sy - hh - 1; y <= sy + hh + 1; y++) {
      const ny = (y - sy) / (hh + 1);
      p.set(ex - 1, y, R.tox[ny < -0.4 ? 6 : ny < 0.3 ? 5 : 4]);
      if (Math.abs(y - sy) >= hh) p.set(ex, y, R.tox[ny < 0 ? 5 : 3]);
      else p.set(ex, y, hx('#08180c'), 255, NORIM);
    }
    if (!recoil) { const dl = [2, 3, 3, 2, 1, 1][k]; for (let j = 1; j <= dl; j++) p.set(ex - 1, sy + hh + 1 + j, R.tox[j === dl ? 7 : 5], 255, EMIT); }
    // leaves swept back
    const lx = bcx + tilt + 0.5 - 1, ly = bcy - ry + 1;
    const sw = [0, 1, 1, 0, -1, -1][k] * 0.15 - recoil * 0.3;
    leafStroke(p, lx - 1, ly, -Math.PI * 0.8 + sw, 7, 1.2, R.tops, -0.3);
    leafStroke(p, lx, ly, -Math.PI * 0.62 + sw, 8, 1.4, R.tops, -0.2);
    leafStroke(p, lx + 1, ly, -Math.PI * 0.42 + sw, 5, 1.1, R.tops, -0.3);
    // angry eyes above the snout
    const ex0 = Math.round(bcx + 1 + tilt * 0.5), ey = Math.round(bcy - 3 - swell * 0.6);
    const em = (x, y, c) => p.set(x, y, c, 255, EMIT);
    em(ex0, ey, E1); em(ex0, ey + 1, E1); em(ex0 + 1, ey + 1, E0); p.set(ex0 + 1, ey, BR, 255, NORIM); p.set(ex0, ey - 1, BR, 255, NORIM);
    em(ex0 + 4, ey, E1); em(ex0 + 4, ey + 1, E1); em(ex0 + 3, ey + 1, E0); p.set(ex0 + 3, ey, BR, 255, NORIM); p.set(ex0 + 4, ey - 1, BR, 255, NORIM);
    p.mouth = [ex, sy]; p.hh = hh; p.eye = [ex0 + 2, ey];
    return p;
  }

  function bomberPix(k, swell) {
    const W = 22, H = 25, p = new Pix(W, H), cx = 10;
    const bob = [0, 1, 0, 0, 1, 0][k];
    const bcx = cx, bcy = 14 + bob - swell, rx = 6.4 + swell, ry = 6 + swell;
    // scurrying legs
    const lifts = [[1, 0, 1], [0, 1, 0], [0, 1, 0], [1, 0, 1], [0, 0, 1], [1, 0, 0]][k];
    const fw = [[1, -1, 1], [0, 0, 0], [-1, 1, -1], [0, 0, 0], [1, 0, -1], [-1, 0, 1]][k];
    [-3, 0, 3].forEach((dx, i) => {
      const x0 = Math.round(bcx + dx) + fw[i], top = Math.round(bcy + ry) - 2, bot = H - 2 - lifts[i];
      for (let y = top; y <= bot; y++) p.set(x0, y, R.rbody[i === 1 ? 3 : 4]);
      p.set(x0, bot + 1, R.rbody[3]); p.set(x0 + (i === 0 ? -1 : 1), bot + 1, R.rbody[2]);
    });
    // beet leaves with magenta stems
    for (const [ang, len, s] of [[-Math.PI * 0.68, 6, -1], [-Math.PI * 0.36, 5, 1]]) {
      const x0 = bcx + s * 0.5, y0 = bcy - ry + 0.5, x1 = x0 + Math.cos(ang) * 3, y1 = y0 + Math.sin(ang) * 3;
      p.line(x0, y0, x1, y1, R.beet[5]);
      leafStroke(p, x1, y1, ang + s * 0.2, len, 1.3, R.tops, -0.2);
    }
    // round beet body with root rings
    p.blob(bcx, bcy, rx, ry, R.beet, {
      tex: (x, y, nx, ny) => (Math.abs(ny - 0.45 - nx * nx * 0.2) < 0.07 || Math.abs(ny - 0.75 - nx * nx * 0.15) < 0.06 ? -0.14 : 0),
    });
    p.set(bcx - 1, Math.round(bcy + ry), R.beet[3]); p.set(bcx - 2, Math.round(bcy + ry) + 1, R.beet[2]);
    p.set(Math.round(bcx - rx * 0.45), Math.round(bcy - ry * 0.5), hx('#ffd0c0'), 255, NORIM);
    // mean face
    const fx = bcx + 1, ey = Math.round(bcy - 1);
    const em = (x, y, c) => p.set(x, y, c, 255, EMIT);
    p.set(fx - 1, ey - 2, BR, 255, NORIM); p.set(fx, ey - 1, BR, 255, NORIM); p.set(fx + 1, ey - 1, BR, 255, NORIM);
    p.set(fx + 4, ey - 2, BR, 255, NORIM); p.set(fx + 3, ey - 1, BR, 255, NORIM); p.set(fx + 2, ey - 1, BR, 255, NORIM);
    em(fx, ey, R.flame[3]); em(fx + 3, ey, R.flame[3]); em(fx + 1, ey, R.flame[1]);
    for (let x = fx - 1; x <= fx + 3; x++) p.set(x, ey + 3, BR, 255, NORIM);
    p.set(fx - 2, ey + 2, BR, 255, NORIM); p.set(fx + 4, ey + 2, BR, 255, NORIM);
    p.set(fx, ey + 3, R.cream[6], 255, NORIM); p.set(fx + 2, ey + 3, R.cream[6], 255, NORIM);
    p.fuse = [bcx, Math.round(bcy - ry)];
    return p;
  }

  function chargerPix(pose, k) {
    const W = 40, H = 34, p = new Pix(W, H);
    const PA = R.cream, HO = R.horn;
    let ang = 0, st = 1, bob = 0;
    if (pose === 'trot') bob = [0, 1, 0, 0, 1, 0][k];
    if (pose === 'rear') ang = -0.36;
    if (pose === 'scrape') ang = -0.12;
    if (pose === 'dash') { ang = 0.18; st = 1.12; }
    if (pose === 'stand') { ang = 0.05; bob = 1; }
    const pvx = pose === 'rear' ? -5 : 0, px0 = 16 + pvx, py0 = 22 + bob;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const T = (lx, ly) => [px0 + (lx - pvx) * ca - ly * sa, py0 + (lx - pvx) * sa + ly * ca];
    const FOOT = 31;
    let legs;
    if (pose === 'trot') {
      const L = [[0, 1, 1, 0], [0, 0, 0, 0], [1, 0, 0, 1], [1, 0, 0, 1], [0, 0, 0, 0], [0, 1, 1, 0]][k];
      const F = [[1, -1, -1, 1], [0, 0, 0, 0], [-1, 1, 1, -1], [-1, 1, 1, -1], [0, 0, 0, 0], [1, -1, -1, 1]][k];
      legs = [[-6, 1, L[0], F[0]], [5, 1, L[1], F[1]], [-3, 0, L[2], F[2]], [7, 0, L[3], F[3]]];
    } else if (pose === 'rear') legs = [[-6, 1, 0, -1], [5, 1, 5, 3], [-3, 0, 0, 1], [7, 0, 7, 4]];
    else if (pose === 'scrape') legs = [[-6, 1, 0, 0], [5, 1, 0, 0], [-3, 0, 0, 0], [7, 0, 1, -4]];
    else if (pose === 'dash') legs = [[-6, 1, 1, -4], [5, 1, 1, 4], [-3, 0, 2, -5], [7, 0, 2, 5]];
    else legs = [[-6, 1, 0, -1], [5, 1, 0, 1], [-3, 0, 0, 0], [7, 0, 0, 0]];
    const drawLeg = ([lx, far, lift, f]) => {
      const [tx, ty] = T(lx, 1);
      const fxp = Math.round(tx + f), fyp = Math.min(FOOT - lift, Math.round(ty) + 7);
      p.line(tx - 1, ty, fxp - 1, fyp, R.rbody[far ? 1 : 4]);
      p.line(tx, ty, fxp, fyp, R.rbody[far ? 2 : 3]);
      p.line(tx + 1, ty, fxp + 1, fyp, R.rbody[far ? 1 : 2]);
      p.rect(fxp - 1, fyp + 1, 4, 1, R.rbody[far ? 1 : 2]);
    };
    legs.filter((l) => l[1]).forEach(drawLeg);
    const horn = (ox, oy, dark) => {
      const q = new Pix(W, H);
      const [hcx, hcy] = T(7.4 * st + ox, -4.4 + oy);
      for (let i = 0; i <= 52; i++) {
        const t = i / 52, th = -1.75 - t * 7.6, r = 5.9 - t * 4.7, w = 1.55 - t * 0.7;
        const x = hcx + Math.cos(th) * r, y = hcy + Math.sin(th) * r;
        const ridge = Math.floor(t * 13) % 2 === 0;
        q.blob(x, y, w, w, HO, { bias: (ridge ? 0.12 : -0.04) - t * 0.12 - dark });
      }
      const fq = finish(q, { rimA: 0.35, coolA: 0.15 });
      const qc = fq.c.getContext('2d').getImageData(0, 0, W + 2, H + 2).data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = ((y + 1) * (W + 2) + x + 1) * 4; if (qc[o + 3]) p.set(x, y, [qc[o], qc[o + 1], qc[o + 2]], 255, NORIM); }
    };
    horn(-2.2, -0.8, 0.25);
    { const [lx, ly] = T(-1, -9.5); for (const [a, len] of [[-0.72, 7], [-0.56, 8.5], [-0.84, 6], [-0.42, 5.5]]) leafStroke(p, lx, ly, Math.PI * a + ang, len, 1.3, R.tops, -0.3); }
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, [x, y] = T(-9 * st - t * 4, -2 + t * 3), r = 2.4 * (1 - t) + 0.4;
      p.blob(x, y, r, r, PA, { bias: -0.05 });
    }
    // stout parsnip body, thick at the shoulders
    {
      const [bx, by] = T(0, -4);
      const rx = 10 * st, ry = 7.6, Rr = rx + 2;
      for (let y = Math.floor(by - Rr); y <= Math.ceil(by + Rr); y++) for (let x = Math.floor(bx - Rr); x <= Math.ceil(bx + Rr); x++) {
        const dx = x + 0.5 - bx, dy = y + 0.5 - by;
        const lx = (dx * ca + dy * sa) / rx, ly = (-dx * sa + dy * ca) / ry;
        const kk = 0.72 + 0.28 * clamp(lx, -1, 1), nyy = ly / kk;
        const dd = lx * lx + nyy * nyy;
        if (dd > 1) continue;
        let v = lv(lx, nyy, Math.sqrt(1 - dd)) * 0.55 + 0.38;
        if (Math.abs(((lx * 3.4 + 10) % 1) - 0.5) < 0.06 && nyy > -0.75 && nyy < 0.8) v -= 0.14;
        p.set(x, y, PA[clamp(Math.floor(v * PA.length), 0, PA.length - 2)]);
      }
    }
    legs.filter((l) => !l[1]).forEach(drawLeg);
    const [hx0, hy0] = T(10.2 * st, -0.5);
    p.blob(hx0, hy0, 4.6, 4.9, PA, { bias: 0.02, top: 1 });
    const [mx, my] = T(13.2 * st, 2);
    p.blob(mx, my, 2.7, 2.8, PA, { bias: -0.06, top: 1 });
    const [ex, ey] = T(12.4 * st, -1.0);
    p.set(ex - 1, ey - 1, BR, 255, NORIM); p.set(ex, ey - 1, BR, 255, NORIM); p.set(ex + 1, ey - 1, BR, 255, NORIM); p.set(ex + 2, ey - 2, BR, 255, NORIM);
    p.set(ex, ey, E1, 255, EMIT); p.set(ex + 1, ey, BR, 255, NORIM);
    const [nx0, ny0] = T(15.2 * st, 2.2);
    p.set(nx0, ny0, BR, 255, NORIM);
    const [m0x, m0y] = T(13 * st, 4.3), [m1x, m1y] = T(15 * st, 4);
    p.line(m0x, m0y, m1x, m1y, PA[1], 255, NORIM);
    horn(0, 0, 0);
    p.eye = [Math.round(ex), Math.round(ey)];
    p.head = [Math.round(hx0), Math.round(hy0) - 7];
    return p;
  }

  function motherPix(k, sx, sy) {
    const W = 44, H = 50, p = new Pix(W, H);
    const bob = [1, 0, 0, 1, 0, 0][k];
    const rx = 12.5 * sx, ry = 12 * sy, cx = 19, cy = H - 1 - 5 - ry + bob;
    // stubby legs
    const lifts = [[0, 0], [1, 0], [1, 0], [0, 0], [0, 1], [0, 1]][k];
    [[cx - 6, lifts[0], 1], [cx + 2, lifts[1], 0]].forEach(([lx, lf, far]) => {
      for (let y = Math.round(cy + ry) - 3; y <= H - 2 - lf; y++) { p.set(lx, y, R.rbody[far ? 2 : 4]); p.set(lx + 1, y, R.rbody[far ? 2 : 3]); p.set(lx + 2, y, R.rbody[far ? 1 : 2]); }
      p.rect(lx - 1, H - 1 - lf, 5, 1, R.rbody[far ? 1 : 3]);
    });
    // old wilted leaves behind
    const top = cy - ry;
    const DRY = rp('#2a2a2a', '#3e3a30', '#5a5238', '#7a6e42', '#9c8a50', '#bca866');
    leafStroke(p, cx - 2, top + 2, -Math.PI * 0.86, 9, 1.4, DRY, 0.5);
    leafStroke(p, cx + 2, top + 2, -Math.PI * 0.16, 9, 1.4, DRY, 0.5);
    // body: old violet top, cream belly, wrinkles
    bulb(p, cx, cy, rx, ry, R.oldv, R.cream, {
      split: 1, pinch: 0.25, seed: 1,
      tex: (x, y, nx, ny) => (Math.sin(ny * 19 + Math.sin(nx * 6) * 1.6) > 0.86 && Math.abs(nx) < 0.85 ? -0.13 : 0),
    });
    // shawl draped over the crown and down both sides (face side open), lace edge
    const SH = R.shawl;
    const shawlAt = (nx, ny) => (ny < -0.38 + nx * nx * 0.25 || (Math.abs(nx) > 0.74 && ny < 0.42)) && !(nx > 0.6 && ny > -0.5);
    const edge = [];
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry); y++) for (let x = 0; x < W; x++) {
      const nx = (x + 0.5 - cx) / (rx + 0.6), ny = (y + 0.5 - cy) / (ry + 0.6), dd = nx * nx + ny * ny;
      if (dd > 1 || !shawlAt(nx, ny)) continue;
      let v = lv(nx, ny, Math.sqrt(1 - dd)) * 0.55 + 0.4;
      if (Math.sin(nx * 9 + ny * 3) > 0.75) v -= 0.12;
      if ((x + y * 3) % 7 === 0 && y % 2 === 0) { p.set(x, y, FLOWERS.lav[1], 255, NORIM); continue; }
      p.set(x, y, SH[clamp(Math.floor(v * SH.length), 0, SH.length - 1)]);
      edge.push([x, y]);
    }
    for (const [x, y] of edge) {
      const nx = (x + 0.5 - cx) / (rx + 0.6), ny = (y + 1.5 - cy) / (ry + 0.6);
      if (nx * nx + ny * ny <= 1 && !shawlAt(nx, ny)) {
        p.set(x, y, FLOWERS.white[(x & 1) ? 2 : 1], 255, NORIM);
        if (x % 3 === 0) p.set(x, y + 1, FLOWERS.white[0], 255, NORIM);
      }
    }
    p.set(Math.round(cx + rx * 0.62), Math.round(cy - ry * 0.42), R.gold[4], 255, NORIM); p.set(Math.round(cx + rx * 0.62) + 1, Math.round(cy - ry * 0.42), R.gold[2], 255, NORIM);
    // face: heavy lids, knobbly nose, downturned mouth with one tooth
    const fx = Math.round(cx) + 3, ey = Math.round(cy) - 3;
    for (const x of [fx, fx + 1, fx + 2, fx + 5, fx + 6, fx + 7]) p.set(x, ey - 1, BR, 255, NORIM);
    p.set(fx - 1, ey, BR, 255, NORIM); p.set(fx + 8, ey, BR, 255, NORIM);
    for (const [x, c] of [[fx, E1], [fx + 1, E0], [fx + 6, E0], [fx + 7, E1]]) p.set(x, ey, c, 255, EMIT);
    p.blob(fx + 4, ey + 2.4, 1.7, 1.6, R.cream, { bias: 0.12 });
    for (const [x, y] of [[fx + 1, ey + 6], [fx + 2, ey + 5], [fx + 3, ey + 5], [fx + 4, ey + 5], [fx + 5, ey + 5], [fx + 6, ey + 6]]) p.set(x, y, BR, 255, NORIM);
    p.set(fx + 3, ey + 6, R.cream[7], 255, NORIM);
    // arm + gnarled walking stick
    const caneX = Math.round(cx + rx + 2) + [0, 1, 1, 0, -1, -1][k];
    p.line(cx + rx - 3, cy + 3, caneX, cy + 1, R.cream[4]); p.line(cx + rx - 3, cy + 4, caneX, cy + 2, R.cream[3]);
    for (let y = Math.round(cy - 2); y <= H - 1; y++) {
      const wob = Math.round(Math.sin(y * 0.7) * 0.5);
      p.set(caneX + wob, y, R.bark[6]); p.set(caneX + 1 + wob, y, R.bark[3]);
      if (y % 5 === 0) p.set(caneX + 2 + wob, y, R.bark[4]);
    }
    p.set(caneX - 1, cy - 3, R.bark[7]); p.set(caneX - 2, cy - 2, R.bark[6]); p.set(caneX, cy - 3, R.bark[7]); p.set(caneX + 1, cy - 2, R.bark[4]);
    p.set(caneX, cy + 1, R.cream[5]); p.set(caneX + 1, cy + 1, R.cream[4]);
    // crown of baby sprouts
    const babies = [];
    [[cx - 6.5, top + 2.5, 0], [cx + 0.5, top - 0.5, 1], [cx + 6.5, top + 2.5, 2]].forEach(([bx0, by0, j]) => {
      const by1 = by0 + ((k + j) % 2 === 0 ? 0 : -1);
      leafStroke(p, bx0, by1 - 2, -Math.PI * 0.5 + (j - 1) * 0.5, 4, 1, R.tops, -0.2);
      p.blob(bx0, by1, 2.9, 2.6, R.turnipM, { rampAt: (x, y) => (y + 0.5 < by1 + 0.4 ? R.turnipM : R.cream), bias: 0.08, top: 1 });
      p.set(Math.round(bx0), Math.round(by1), E1, 255, EMIT); p.set(Math.round(bx0) + 2, Math.round(by1), E1, 255, EMIT);
      babies.push([Math.round(bx0) + 1, Math.round(by1)]);
    });
    p.babies = babies; p.eyeY = ey;
    return p;
  }

  function sproutPix(k) {
    const W = 14, H = 17, p = new Pix(W, H), cx = 6;
    const bob = [0, 1, 0, 0, 1, 0][k];
    const bcy = 9 + bob;
    const lf = [[0, 1], [0, 0], [1, 0], [1, 0], [0, 0], [0, 1]][k], fw = [[1, -1], [0, 0], [-1, 1], [-1, 1], [0, 0], [1, -1]][k];
    [[cx - 2, 0], [cx + 1, 1]].forEach(([lx0, i]) => {
      const lx = lx0 + fw[i];
      for (let y = 13; y <= 14 - lf[i]; y++) p.set(lx, y, R.rbody[i ? 4 : 3]);
      p.set(lx, 15 - lf[i], R.rbody[3]); p.set(lx + 1, 15 - lf[i], R.rbody[2]);
    });
    leafStroke(p, cx, bcy - 3.5, -Math.PI * 0.55 + [0, 1, 1, 0, -1, -1][k] * 0.15, 7, 1.5, R.tops, -0.4);
    bulb(p, cx + 0.5, bcy, 4.6, 4.2, R.turnipM, R.rbody, { split: 0.5, seed: 2 });
    const ex = cx + 1, ey = bcy - 1;
    p.set(ex - 1, ey - 1, BR, 255, NORIM); p.set(ex + 3, ey - 1, BR, 255, NORIM);
    p.set(ex, ey, E1, 255, EMIT); p.set(ex + 2, ey, E1, 255, EMIT);
    p.set(ex, ey + 2, BR, 255, NORIM); p.set(ex + 1, ey + 2, BR, 255, NORIM); p.set(ex + 2, ey + 2, BR, 255, NORIM);
    p.eye = [ex + 1, ey];
    return p;
  }

  function shotPix(ang, wob) {
    const N = 13, c0 = 6.5, p = new Pix(N, N);
    const ca = Math.cos(ang), sa = Math.sin(ang), Rr = 3.5 + wob * 0.35;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = x + 0.5 - c0, dy = y + 0.5 - c0;
      const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca, h0 = lx - 0.8;
      let inside;
      if (h0 >= 0) inside = h0 * h0 + ly * ly <= Rr * Rr;
      else { const t = -h0 / 5.2; inside = t < 1 && Math.abs(ly) <= Rr * (1 - t * t) * (1 - t * 0.2); }
      if (!inside) continue;
      const d = Math.hypot(lx - 1.6, ly);
      let l = d < 1.1 ? 7 : d < 2.0 ? 6 : 5;
      if (h0 < -1.5) l = 4;
      if (dx * 0.6 + dy * 0.8 > 1.5 && l < 7) l -= 1;
      p.set(x, y, R.tox[l], 255, NORIM);
    }
    return finish(p, { ox: c0, oy: c0, rimA: 0, coolA: 0, dark: hx('#100820'), lit: hx('#1a1030') });
  }

  /* =========================================================================
     Icons (18x18 + finish, like the style's icons)
     ========================================================================= */
  function iconPix(id) {
    const p = new Pix(18, 18);
    const em = (x, y, c) => p.set(x, y, c, 255, EMIT);
    switch (id) {
      case 'leech': {
        p.blob(9, 12, 7.5, 5, R.stone, { mask: (x, y) => y >= 11, bias: 0.08 });
        for (let x = 2; x <= 16; x++) { p.set(x, 11, R.pumpkin[x % 3 ? 5 : 6]); p.set(x, 12, R.pumpkin[4]); }
        p.rect(6, 17, 7, 1, R.stone[3]);
        for (const [x0, y0] of [[3, 4], [15, 5]]) for (let j = 0; j < 5; j++) p.set(x0 + ((j & 1) ? 1 : 0), y0 + j, R.mstem[4], 180, NORIM);
        for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) {
          const u = (x + 0.5 - 9) / 4.2, v = (5.6 - y - 0.5) / 4.2;
          if (Math.pow(u * u + v * v - 0.42, 3) - u * u * v * v * v * 1.1 > 0 || y > 9) continue;
          p.set(x, y, R.berry[clamp(Math.floor((0.62 - u * 0.35 + v * 0.42) * 6), 1, 5)]);
        }
        em(7, 3, hx('#fff2f6'));
        break;
      }
      case 'thorns': {
        for (let kk = 0; kk < 10; kk++) {
          const a = (kk / 10) * TAU - Math.PI / 2;
          for (let r = 4.5; r <= 8.3; r += 0.5) p.set(Math.round(9 + Math.cos(a) * r - 0.5), Math.round(9 + Math.sin(a) * r - 0.5), R.bark[r > 7 ? 8 : 5]);
        }
        p.blob(9, 9, 5.6, 5.6, R.turnip, { rampAt: (x, y) => (y < 10 ? R.turnip : R.rbody), tex: (x, y, nx, ny) => (Math.abs(Math.hypot(nx, ny) - 0.72) < 0.1 ? -0.18 : 0) });
        em(6, 6, R.turnip[8]);
        break;
      }
      case 'dashup': {
        p.blob(10.5, 9.5, 6, 6, R.pumpkin, { tex: (x, y, nx, ny) => { const a = Math.atan2(ny, nx) + 0.6, kk = ((a / TAU) * 6 + 6) % 1; return kk < 0.12 && Math.hypot(nx, ny) > 0.25 ? -0.18 : 0; } });
        p.set(14, 4, R.stem[3]); p.set(15, 4, R.stem[4]); p.set(15, 3, R.stem[3]);
        for (const [y, x0, x1] of [[5, 0, 3], [9, 0, 4], [13, 1, 4]]) for (let x = x0; x <= x1; x++) em(x, y, R.amber[y === 9 ? 4 : 3]);
        for (const [x, y] of [[4, 16], [6, 17], [2, 17]]) p.set(x, y, R.mstem[3]);
        break;
      }
      case 'range': {
        for (let i = 0; i <= 14; i++) { const t = i / 14; if (i % 2 === 0) em(Math.round(1 + t * 13), Math.round(15 - Math.sin(t * Math.PI) * 12), R.amber[4]); }
        p.blob(3.5, 12.5, 3, 2, R.seed, { bias: 0.1 });
        p.blob(14.5, 14.5, 3, 3, R.berry, { rampAt: (x, y, nx, ny) => (Math.hypot(nx, ny) > 0.7 ? R.berry : Math.hypot(nx, ny) > 0.38 ? R.cream : R.berry), bias: 0.15 });
        break;
      }
      default: p.blob(9, 9, 6, 6, R.amber, {});
    }
    return finish(p, { rimA: 0.35, coolA: 0.2 });
  }

  /* =========================================================================
     Runtime
     ========================================================================= */
  let S = null;
  const ICON = {};
  const WHITE = '#fff8f0';
  function rec(pix, ox, oy) {
    const r = finish(pix, { ox, oy }), l = finish(pix.flip(), { ox: pix.w - ox, oy });
    for (const s of [r, l]) s.fl = U.tint(s.c, WHITE, 1);
    const flipPt = (pt) => (pt ? [pix.w - 1 - pt[0], pt[1]] : null);
    const pts = {};
    for (const key of ['mouth', 'eye', 'fuse', 'head']) if (pix[key]) pts[key] = [pix[key], flipPt(pix[key])];
    return { r, l, pts, hh: pix.hh, babies: pix.babies, w: pix.w, oxr: ox, ox };
  }
  /* point in sprite space -> world, for facing fl (0 right, 1 left) */
  function pt(s, key, fl, x, y) {
    const sp = fl ? s.l : s.r, q = s.pts[key][fl];
    return [Math.round(x) - sp.ox + 1 + q[0], Math.round(y) - sp.oy + 1 + q[1]];
  }
  /* every group is built on first use, so init() stays cheap and no group costs more than a few ms */
  const lazy = (o, key, fn) => Object.defineProperty(o, key, { configurable: true, enumerable: true, get() { const v = fn(); Object.defineProperty(o, key, { value: v }); return v; } });
  function build() {
    const o = {};
    lazy(o, 'sp', () => [0, 1, 2, 3, 4, 5].map((k) => rec(spitterPix(k, 0, 0), 12, 30)));
    lazy(o, 'spAim', () => [0.35, 0.7, 1].map((sw) => rec(spitterPix(0, sw, 0), 12, 30)));
    lazy(o, 'spRecoil', () => rec(spitterPix(0, 0, 1), 12, 30));
    const red = (arr) => { for (const s of arr) { s.r.red = U.tint(s.r.c, '#ff3a2a', 1); s.l.red = U.tint(s.l.c, '#ff3a2a', 1); } return arr; };
    lazy(o, 'bo', () => red([0, 1, 2, 3, 4, 5].map((k) => rec(bomberPix(k, 0), 10, 25))));
    lazy(o, 'boSwell', () => red([0, 1, 2, 3, 4, 5].map((k) => rec(bomberPix(k, 1), 10, 25))));
    lazy(o, 'ch', () => [0, 1, 2, 3, 4, 5].map((k) => rec(chargerPix('trot', k), 16, 33)));
    lazy(o, 'chRear', () => rec(chargerPix('rear', 0), 16, 33));
    lazy(o, 'chScrape', () => rec(chargerPix('scrape', 0), 16, 33));
    lazy(o, 'chDash', () => { const s = rec(chargerPix('dash', 0), 16, 33); s.r.ghost = U.tint(s.r.c, '#c88cf0', 1); s.l.ghost = U.tint(s.l.c, '#c88cf0', 1); return s; });
    lazy(o, 'chStand', () => rec(chargerPix('stand', 0), 16, 33));
    lazy(o, 'mo', () => [0, 1, 2, 3, 4, 5].map((k) => rec(motherPix(k, 1, 1), 19, 50)));
    lazy(o, 'moSquash', () => rec(motherPix(0, 1.12, 0.86), 19, 50));
    lazy(o, 'moStretch', () => rec(motherPix(0, 0.93, 1.08), 19, 50));
    lazy(o, 'so', () => [0, 1, 2, 3, 4, 5].map((k) => rec(sproutPix(k), 6, 17)));
    lazy(o, 'shot', () => { const a = []; for (let i = 0; i < 16; i++) a.push([shotPix((i / 16) * TAU, 0), shotPix((i / 16) * TAU, 1)]); return a; });
    // long cast shadows
    const sh = (pix, ox, oy, c) => [makeShadow(pix, ox, oy, { contact: c }), makeShadow(pix.flip(), pix.w - ox, oy, { contact: c })];
    o.shadow = {};
    lazy(o.shadow, 'spitter', () => sh(spitterPix(0, 0, 0), 12, 30, 6));
    lazy(o.shadow, 'bomber', () => sh(bomberPix(0, 0), 10, 25, 5));
    lazy(o.shadow, 'charger', () => sh(chargerPix('trot', 0), 16, 33, 8));
    lazy(o.shadow, 'mother', () => sh(motherPix(0, 1, 1), 19, 50, 10));
    lazy(o.shadow, 'sprout', () => sh(sproutPix(0), 6, 17, 4));
    return o;
  }
  function spr(ctx, s, x, y) { ctx.drawImage(s.c, Math.round(x) - s.ox, Math.round(y) - s.oy); }
  function sprS(ctx, s, img, x, y, sx, sy) {
    const w = Math.max(1, Math.round(s.c.width * sx)), h = Math.max(1, Math.round(s.c.height * sy));
    ctx.drawImage(img, Math.round(x) - Math.round(s.ox * sx), Math.round(y) - Math.round(s.oy * sy), w, h);
  }
  const PET = [FLOWERS.pink[2], FLOWERS.white[2], FLOWERS.pink[1], FLOWERS.white[1]].map((c) => 'rgb(' + c.join(',') + ')');

  /* spawn / death / flash handled like the style's creeper. Returns the drawn sprite (facing) or null. */
  function body(ctx, e, view, rec0, ox, glowType, sxy) {
    const fl = e.facing < 0 ? 1 : 0, s = fl ? rec0.l : rec0.r;
    const x = e.x + (ox || 0), y = e.y;
    if (e.dying) {
      const t = e.deathT;
      const sx = 1 + 0.3 * t, sy = t < 0.3 ? 1 + 0.2 * t : Math.max(0.1, 1.06 - (t - 0.3) * 1.4);
      ctx.globalAlpha = 1 - t * 0.8;
      sprS(ctx, s, s.fl, x, y, sx, sy);
      ctx.globalAlpha = 1;
      drawGlow(ctx, glowType || 'pink', s.oy > 40 ? 18 : 12, x, y - s.oy * 0.45, 0.7 * (1 - t));
      return null;
    }
    if (e.spawnT < 1) {
      const k = U.ease.outQuad(e.spawnT);
      const h = s.c.height, vis = Math.max(1, Math.round((h - (h - s.oy)) * k + (h - s.oy)));
      ctx.drawImage(s.c, 0, 0, s.c.width, vis, Math.round(x) - s.ox, Math.round(y) - vis, s.c.width, vis);
      const n = s.oy > 40 ? 7 : 5;
      ctx.globalAlpha = 1 - k;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + e.seed * 9 + k * 2.5, rr = 3 + k * (s.oy > 40 ? 16 : 11);
        ctx.fillStyle = PET[i & 3];
        ctx.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(y - 2 + Math.sin(a) * rr * 0.5 - k * 4), 2, 1);
      }
      ctx.globalAlpha = 1;
      const mw = s.oy > 40 ? 18 : 12;
      ctx.fillStyle = '#2a1d2e'; ctx.fillRect(Math.round(x - mw / 2), Math.round(y - 1), mw, 2);
      ctx.fillStyle = '#4a3540'; ctx.fillRect(Math.round(x - mw / 2) + 1, Math.round(y - 2), mw - 2, 1);
      return null;
    }
    let sx = sxy ? sxy[0] : 1, sy = sxy ? sxy[1] : 1;
    const f = e.flash || 0;
    if (f > 0) { sx += f * 0.14; sy -= f * 0.12; }
    if (sx === 1 && sy === 1) spr(ctx, s, x, y); else sprS(ctx, s, s.c, x, y, sx, sy);
    if (f > 0.05) { ctx.globalAlpha = Math.min(0.6, f * 0.9); sprS(ctx, s, s.fl, x, y, sx, sy); ctx.globalAlpha = 1; }
    return { fl, s, x, y };
  }

  C.art('dusk', {
    init() {
      S = build();
    },
    enemies: {
      spitter(ctx, e, view) {
        const rt = view.rt, aiming = e.mode === 'aim', ch = e.charge || 0, spit = e.spit || 0;
        let r0, ox = 0;
        if (aiming) { r0 = S.spAim[ch < 0.34 ? 0 : ch < 0.67 ? 1 : 2]; if (ch > 0.45) ox = Math.floor(rt * 30) % 2 ? 1 : 0; }
        else if (spit > 0.55) r0 = S.spRecoil;
        else r0 = S.sp[Math.floor(e.anim * 2.2 + e.seed * 6) % 6];
        const d = body(ctx, e, view, r0, ox, 'tox');
        if (!d) return;
        const [mx, my] = pt(r0, 'mouth', d.fl, d.x, d.y);
        const [ex, ey] = pt(r0, 'eye', d.fl, d.x, d.y);
        const dir = d.fl ? -1 : 1;
        drawGlow(ctx, 'eye', 3, ex, ey, 0.4);
        if (aiming) {
          ctx.fillStyle = 'rgb(' + R.tox[ch < 0.34 ? 5 : ch < 0.67 ? 6 : 7].join(',') + ')';
          ctx.fillRect(mx, my - r0.hh + 1, 1, r0.hh * 2 - 1);
          drawGlow(ctx, 'tox', 4 + Math.round(ch * 4), mx + dir, my, 0.35 + ch * 0.6);
        } else if (spit > 0) {
          const k = 1 - spit;
          for (let i = 0; i < 6; i++) {
            const a = (i - 2.5) * 0.32 + (e.seed - 0.5) * 0.3, dd = 2 + k * (7 + (i % 3) * 3);
            ctx.fillStyle = 'rgb(' + R.tox[i % 2 ? 7 : 5].join(',') + ')';
            ctx.fillRect(Math.round(mx + dir * Math.cos(a) * dd), Math.round(my + Math.sin(a) * dd * 0.8 + k * k * 4), 1, 1);
          }
          drawGlow(ctx, 'tox', 5, mx + dir * 2, my, spit * 0.8);
        } else drawGlow(ctx, 'tox', 2, mx, my, 0.5);
      },

      bomber(ctx, e, view) {
        const rt = view.rt, armed = !!e.armed, fz = e.fuse || 0;
        const k = Math.floor(e.anim * (armed ? 3 : 2.6) + e.seed * 6) % 6;
        const r0 = armed && fz > 0.4 ? S.boSwell[k] : S.bo[k];
        const ox = armed && fz > 0.6 ? (Math.floor(rt * 40) % 2 ? 1 : 0) : 0;
        const d = body(ctx, e, view, r0, ox, 'red');
        if (!d) return;
        let on = false;
        if (armed) {
          const ph = fz * (3 + fz * 12);
          on = Math.floor(ph * 2) % 2 === 0;
          if (on) {
            ctx.globalAlpha = 0.55 + fz * 0.15;
            spr(ctx, { c: fz > 0.7 && Math.floor(ph * 4) % 2 ? d.s.fl : d.s.red, ox: d.s.ox, oy: d.s.oy }, d.x, d.y);
            ctx.globalAlpha = 1;
          }
        }
        // fuse cord out of the leaves
        const [fx0, fy0] = pt(r0, 'fuse', d.fl, d.x, d.y);
        const dir = d.fl ? -1 : 1;
        const cord = [[0, -1], [0, -2], [1, -3], [1, -4], [2, -5], [3, -5], [4, -6]];
        const n = armed ? Math.max(2, Math.round(7 - fz * 5)) : 7;
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = '#5e3135'; ctx.fillRect(fx0 + cord[i][0] * dir, fy0 + cord[i][1], 1, 1);
          ctx.fillStyle = '#25132a'; ctx.fillRect(fx0 + cord[i][0] * dir + dir, fy0 + cord[i][1], 1, 1);
        }
        const tip = cord[n - 1], tx = fx0 + tip[0] * dir, ty = fy0 + tip[1] - 1;
        const f3 = Math.floor(rt * 18 + e.seed * 9) % 3;
        drawGlow(ctx, 'warm', armed ? 4 + Math.round(fz * 4) : 3, tx, ty, armed ? 0.6 + fz * 0.4 : 0.5);
        ctx.fillStyle = '#fffbe0'; ctx.fillRect(tx, ty, 1, 1);
        ctx.fillStyle = '#ffb648'; ctx.fillRect(tx + (f3 === 0 ? 1 : f3 === 1 ? -1 : 0), ty - 1, 1, 1);
        if (armed) {
          const big = 1 + Math.round(fz * 2);
          for (let i = 0; i < 2 + big * 2; i++) {
            const a = rt * 13 + i * 2.1 + e.seed * 7, dd = 1 + ((i * 7 + Math.floor(rt * 20)) % (big + 1));
            ctx.fillStyle = ['#ffe48a', '#ffb648', '#f07a26'][i % 3];
            ctx.fillRect(Math.round(tx + Math.cos(a) * dd), Math.round(ty + Math.sin(a) * dd), 1, 1);
          }
          drawGlow(ctx, 'red', 10, d.x, d.y - 11, on ? 0.35 + fz * 0.45 : 0.12);
        }
        drawGlow(ctx, 'warm', 2, d.x + dir * 2.5, d.y - 12, 0.35);
      },

      charger(ctx, e, view) {
        const rt = view.rt, mode = e.mode || 'chase', mt = e.modeT || 0;
        let r0, ox = 0;
        if (mode === 'tele') { r0 = mt < 0.3 || Math.floor(mt * 11) % 3 ? S.chRear : S.chScrape; ox = Math.floor(rt * 34) % 2 ? 1 : -1; }
        else if (mode === 'dash') r0 = S.chDash;
        else if (mode === 'rest') { r0 = S.chStand; ox = Math.round(Math.sin(mt * 14) * 1.2); }
        else r0 = S.ch[Math.floor(e.anim * 2.2 + e.seed * 6) % 6];
        const fl = e.facing < 0 ? 1 : 0;
        if (mode === 'dash' && !e.dying && e.spawnT >= 1) {
          const s = fl ? r0.l : r0.r, dX = e.dashX || (fl ? -1 : 1), dY = e.dashY || 0;
          for (let i = 3; i >= 1; i--) {
            ctx.globalAlpha = 0.14 * (4 - i);
            ctx.drawImage(s.ghost, Math.round(e.x - dX * i * 7) - s.ox, Math.round(e.y - dY * i * 7) - s.oy);
          }
          ctx.globalAlpha = 1;
        }
        const d = body(ctx, e, view, r0, ox, 'pink');
        if (!d) return;
        const [ex, ey] = pt(r0, 'eye', d.fl, d.x, d.y);
        if (mode === 'tele' || mode === 'dash') {
          drawGlow(ctx, 'red', 4, ex, ey, 0.75);
          if (mode === 'tele') drawGlow(ctx, 'red', 9, ex, ey + 2, 0.14 + 0.12 * Math.sin(rt * 30));
          ctx.fillStyle = '#fff0e0'; ctx.fillRect(ex, ey, 1, 1);
          if (mode === 'tele' && Math.floor(rt * 16) % 2) {
            // dust kicked up by the scraping hoof
            ctx.fillStyle = '#c8b8d0';
            const bx = Math.round(d.x + (d.fl ? -6 : 6));
            for (let i = 0; i < 3; i++) ctx.fillRect(bx - (d.fl ? -1 : 1) * (2 + i * 2), Math.round(d.y - 1 - (i % 2) * 2), 1, 1);
          }
        } else drawGlow(ctx, 'eye', 3, ex, ey, 0.45);
        if (mode === 'rest') {
          const [hx0, hy0] = pt(r0, 'head', d.fl, d.x, d.y);
          for (let i = 0; i < 3; i++) {
            const a = rt * 6 + (i * TAU) / 3, sx = Math.round(hx0 + Math.cos(a) * 7), sy = Math.round(hy0 - 2 + Math.sin(a) * 2.2);
            drawGlow(ctx, 'warm', 3, sx, sy, 0.5);
            ctx.fillStyle = '#fffbe8'; ctx.fillRect(sx, sy, 1, 1);
            if (Math.sin(a) > -0.2) { ctx.fillStyle = '#ffd27a'; ctx.fillRect(sx - 1, sy, 3, 1); ctx.fillRect(sx, sy - 1, 1, 3); ctx.fillStyle = '#fffbe8'; ctx.fillRect(sx, sy, 1, 1); }
          }
        }
        if (mode === 'dash') {
          ctx.fillStyle = 'rgba(255,240,224,0.75)';
          const dir = d.fl ? 1 : -1, s = d.s;
          for (let i = 0; i < 4; i++) {
            const yy = Math.round(d.y) - s.oy + 10 + i * 5, len = 4 + ((i * 5 + Math.floor(rt * 20)) % 5);
            const x0 = dir > 0 ? Math.round(d.x) - s.ox + s.c.width + 1 : Math.round(d.x) - s.ox - len - 1;
            ctx.fillRect(x0, yy, len, 1);
          }
        }
      },

      mother(ctx, e, view) {
        const b = e.birth || 0;
        let r0, sxy = null;
        if (b > 0.62) r0 = S.moSquash; else if (b > 0.3) r0 = S.moStretch;
        else r0 = S.mo[Math.floor(e.anim * 1.6 + e.seed * 6) % 6];
        const d = body(ctx, e, view, r0, 0, 'pink', sxy);
        if (!d) return;
        const s = d.s, x0 = Math.round(d.x) - s.ox + 1, y0 = Math.round(d.y) - s.oy + 1;
        for (const q of r0.babies) {
          const bx = d.fl ? x0 + r0.w - 1 - q[0] : x0 + q[0];
          drawGlow(ctx, 'eye', 2, bx, y0 + q[1], 0.35 + b * 0.6);
        }
        drawGlow(ctx, 'eye', 3, d.x + (d.fl ? -7 : 7), d.y - 21, 0.3);
        if (b > 0) {
          drawGlow(ctx, 'pink', 22, d.x, d.y - 16, b * 0.28);
          drawGlow(ctx, 'warm', 10, d.x, d.y - 32, b * 0.4);
        }
      },

      sprout(ctx, e, view) {
        const r0 = S.so[Math.floor(e.anim * 2.8 + e.seed * 6) % 6];
        const d = body(ctx, e, view, r0, 0, 'pink');
        if (!d) return;
        const [ex, ey] = pt(r0, 'eye', d.fl, d.x, d.y);
        drawGlow(ctx, 'eye', 2, ex, ey, 0.4);
      },
    },

    shadow(ctx, o) {
      const arr = S.shadow[o.type];
      if (!arr) return false;
      const a = o.dying ? 1 - o.deathT : o.spawnT;
      if (a <= 0) return true;
      ctx.globalAlpha = a;
      spr(ctx, arr[o.facing < 0 ? 1 : 0], o.x, o.y);
      ctx.globalAlpha = 1;
      return true;
    },

    shot(ctx, s, view) {
      const y = s.y - s.z, ang = s.angle !== undefined ? s.angle : Math.atan2(s.vy, s.vx);
      const fi = ((Math.round((ang / TAU) * 16) % 16) + 16) % 16;
      const wob = Math.floor(view.rt * 12 + s.seed * 10) % 2;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      drawGlow(ctx, 'tox', 10, s.x, y, 0.75);
      drawGlow(ctx, 'tox', 5, s.x, y, 0.8);
      for (let j = 1; j <= 4; j++) {
        const dd = 4 + j * 2.6 + ((Math.floor(view.rt * 20) + j) % 2);
        ctx.fillStyle = 'rgb(' + R.tox[j === 1 ? 7 : j === 2 ? 6 : j === 3 ? 5 : 4].join(',') + ')';
        ctx.fillRect(Math.round(s.x - ca * dd), Math.round(y - sa * dd + j * 0.4), 1, 1);
      }
      spr(ctx, S.shot[fi][wob], s.x, y);
    },

    icons: Object.fromEntries(['leech', 'thorns', 'dashup', 'range'].map((id) => [id, (ctx, size) => {
      const s = ICON[id] || (ICON[id] = iconPix(id));
      const k = Math.max(1, Math.floor(size / 20));
      const w = s.c.width * k, h = s.c.height * k;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(s.c, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
    }])),
  });
})();
