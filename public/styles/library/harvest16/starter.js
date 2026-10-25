/* Harvest 16-Bit — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Pixel art at 1 art pixel = 1 world unit. Every sprite is painted procedurally into a pixel grid
   (hue-shifted ramps, one shared top-left light, quantised Lambert, auto 1-px coloured outline). */
(function (root) {
  'use strict';
  const PALETTE = {
    meadow: '#77963b', tuftShade: '#617f38', tuftLight: '#8ea945', goldGrass: '#9a9d45', clover: '#5b893f',
    soil: '#8a5a3c', path: '#b08a5a', pathShadow: '#755244', litter: '#7c3531', rustLeaf: '#bc5a2f',
    goldLeaf: '#d6a944', pumpkin: '#de6e2c', cloak: '#336046', scarf: '#cc842e', turnip: '#713488',
    cream: '#dcc290', ghost: '#a6bee2', ember: '#ffc640', ink: '#24162a', hudWood: '#8f5c34',
  };
  const TAU = Math.PI * 2;
  const hx = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const hexes = (a) => a.map(hx);
  const mixc = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const INK = hx('#24162a');
  // ramps, deep -> highlight (hue shifts toward purple in shadow, toward yellow in light)
  const R = {
    pk: hexes(['#74282a', '#b0462a', '#de6e2c', '#f59a3c', '#ffc76c']), stem: hexes(['#2c4628', '#4a7030', '#6e9c3c']),
    cloak: hexes(['#1b3236', '#26473e', '#336046', '#447a4c', '#5c9652']), scarf: hexes(['#8e4e26', '#cc842e', '#f2be4c']),
    pants: hexes(['#2a2032', '#40304a']), boot: hexes(['#331f1e', '#583624', '#7e512e', '#a4733e']),
    tpur: hexes(['#2c1740', '#4c235f', '#713488', '#9654a8', '#bf80c8']), tmag: hexes(['#381634', '#5e2248', '#86325e', '#ad5278', '#d07e98']),
    cream: hexes(['#8a6458', '#b8946e', '#dcc290', '#f2e2b0', '#fff6da']), leaf: hexes(['#22402c', '#356432', '#4f8c3a', '#78b246']),
    root: hexes(['#6e5040', '#a2845e', '#cdb282']), ice: hexes(['#465482', '#7488bc', '#a6bee2', '#d4e6f6', '#f6fcff']),
    bark: hexes(['#3a2228', '#5a3428', '#7c4c32', '#9e6c44']), glow: hexes(['#f2902a', '#ffc640', '#fff2a8']),
    glowB: hexes(['#e07a26', '#ffaa34', '#ffde7a']), stone: hexes(['#5a5064', '#8a8090', '#b8aea8', '#e0d8c8']),
  };
  const TREE_RAMPS = [
    hexes(['#5a2230', '#963a2c', '#c95c2c', '#ea8a36', '#f7ba5c']), hexes(['#461a30', '#782434', '#a6362f', '#cb5639', '#e8844e']),
    hexes(['#573826', '#946629', '#c69832', '#e6c24a', '#f6e084']), hexes(['#253e3a', '#476636', '#8a8a34', '#cc8a34', '#f0ba58']),
  ];
  /* ---------- deterministic hash, rng and gradient noise ---------- */
  function hashInt(x, y, s) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { next, range: (lo, hi) => lo + (hi - lo) * next() };
  }
  const GR = []; for (let i = 0; i < 16; i++) GR.push(Math.cos(i / 16 * TAU), Math.sin(i / 16 * TAU));
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  function perlin(x, y, s, p) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const g = (ix, iy, dx, dy) => { if (p) { ix = ((ix % p) + p) % p; iy = ((iy % p) + p) % p; } const k = (hashInt(ix, iy, s) & 15) * 2; return GR[k] * dx + GR[k + 1] * dy; };
    const u = fade(fx), v = fade(fy), n00 = g(x0, y0, fx, fy), n10 = g(x0 + 1, y0, fx - 1, fy);
    const n01 = g(x0, y0 + 1, fx, fy - 1), n11 = g(x0 + 1, y0 + 1, fx - 1, fy - 1);
    const a = n00 + u * (n10 - n00), b = n01 + u * (n11 - n01);
    return (a + v * (b - a)) * 1.414;
  }
  const noise = (x, y, s) => perlin(x, y, s) * 0.5 + 0.5;
  function fbm(x, y, s, oct, p) {
    let a = 1, f = 1, t = 0, n = 0;
    for (let i = 0; i < oct; i++) { t += a * perlin(x * f, y * f, s + i * 101, p ? p * f : 0); n += a; a *= 0.5; f *= 2; }
    return clamp((t / n) * 0.5 + 0.5, 0, 1);
  }
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, ctx: c.getContext('2d') }; };
  const flipX = (src) => { const { c, ctx } = mk(src.width, src.height); ctx.translate(src.width, 0); ctx.scale(-1, 1); ctx.drawImage(src, 0, 0); return c; };
  const tint = (src, col) => { const { c, ctx } = mk(src.width, src.height); ctx.drawImage(src, 0, 0); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = col; ctx.fillRect(0, 0, c.width, c.height); return c; };
  /* ---------- shared light + the tiny pixel painter ---------- */
  const LV = (() => { const v = [-0.5, -0.6, 0.62], l = Math.hypot(v[0], v[1], v[2]); return v.map((a) => a / l); })();
  const lam = (nx, ny, nz) => nx * LV[0] + ny * LV[1] + nz * LV[2];          // Lambert vs. top-left-front light
  const qi = (l, th) => { let i = 0; while (i < th.length && l > th[i]) i++; return i; }; // quantise to ramp index
  const outlineOf = (c) => mixc(c, INK, 0.58 + 0.26 * ((c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255)); // coloured outline
  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.a = new Array(w * h).fill(null); }
    set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y * this.w + x] = c; }
    get(x, y) { x = Math.floor(x); y = Math.floor(y); return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.a[y * this.w + x]; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
    rows(x, y, rows, pal) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (pal[r[i]]) this.set(x + i, y + j, pal[r[i]]); }); }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
    // filled ellipse; fn(nx, ny, nz, x, y) returns the colour (sphere normal given)
    blob(cx, cy, rx, ry, fn) {
      for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
        if (d <= 1) this.set(x, y, fn(nx, ny, Math.sqrt(1 - d), x, y)); } }
    // tapered leaf / blade between two points, lit side + mid-rib + bright tip
    leaf(x0, y0, x1, y1, wmax, ramp, pow = 0.75) {
      const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy, len = Math.sqrt(l2);
      for (let y = Math.floor(Math.min(y0, y1) - wmax - 1); y <= Math.ceil(Math.max(y0, y1) + wmax + 1); y++) {
        for (let x = Math.floor(Math.min(x0, x1) - wmax - 1); x <= Math.ceil(Math.max(x0, x1) + wmax + 1); x++) {
          const px = x + 0.5 - x0, py = y + 0.5 - y0, t = (px * dx + py * dy) / l2;
          if (t < 0 || t > 1) continue;
          const side = (px * dy - py * dx) / len, w = wmax * Math.sin(Math.PI * Math.pow(t, pow)) + 0.35;
          if (Math.abs(side) > w) continue;
          const sg = side < 0 ? -1 : 1, lit = -((dy / len) * sg * 0.6 + (-dx / len) * sg * 0.8);
          let k = lit > 0.15 ? 2 : 1;
          if (Math.abs(side) < 0.55 && t > 0.12 && t < 0.85) k = 1;
          if (t > 0.8 && lit > 0) k = 3;
          if (lit < -0.5 && Math.abs(side) > w - 0.9) k = 0;
          this.set(x, y, ramp[Math.min(k, ramp.length - 1)]); } } }
    // bake to a canvas; empty pixels next to filled ones get the darkened average colour (1-px outline)
    canvas(outline = true, oc = null) {
      const pad = outline ? 1 : 0, W = this.w + pad * 2, H = this.h + pad * 2, { c, ctx } = mk(W, H);
      const img = ctx.createImageData(W, H), d = img.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const sx = x - pad, sy = y - pad;
        let col = this.get(sx, sy), a = 255;
        if (col) a = col.length > 3 ? col[3] : 255;
        else if (outline) {
          let r = 0, g = 0, b = 0, n = 0, al = 0;
          for (const q of [this.get(sx - 1, sy), this.get(sx + 1, sy), this.get(sx, sy - 1), this.get(sx, sy + 1)]) {
            if (!q) continue; r += q[0]; g += q[1]; b += q[2]; al += q.length > 3 ? q[3] : 255; n++; }
          if (!n) continue;
          col = oc || outlineOf([r / n, g / n, b / n]); a = al / n;
        } else continue;
        const o = (y * W + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = a; }
      ctx.putImageData(img, 0, 0);
      return c; }
  }
  const pair = (c) => ({ r: c, l: flipX(c) });
  const blit = (ctx, img, x, y) => ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height + 1)); // feet anchor
  /* ---------- characters (ported from the reference module) ---------- */
  function carve(p, list, glow, cut) { // glowing carved holes + a 1-px dark cut lip above each
    const s = new Set(list.map(([x, y]) => x + ',' + y));
    for (const [x, y, t] of list) { p.set(x, y, glow[t]); if (!s.has(x + ',' + (y - 1)) && p.get(x, y - 1)) p.set(x, y - 1, cut); }
  }
  const pts = (rows, ox, oy) => { const o = []; rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const t = '012'.indexOf(r[x]); if (t >= 0) o.push([ox + x, oy + y, t]); } }); return o; };
  function pumpkinBody(p, cx, cy, rx, ry, ramp, creases, th) {
    const idx = new Map();
    p.blob(cx, cy, rx, ry, (nx, ny, nz, x, y) => { const k = qi(lam(nx, ny, nz), th || [-0.22, 0.14, 0.5, 0.8]); idx.set(x + ',' + y, k); return ramp[k]; });
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) { // ribs: 1-px curves one ramp step darker
      const ny = (y + 0.5 - cy) / ry; if (Math.abs(ny) >= 0.92) continue;
      for (const c of creases) { const x = Math.floor(cx + c * rx * Math.sqrt(1 - ny * ny)), k = idx.get(x + ',' + y); if (k !== undefined) p.set(x, y, ramp[Math.max(0, k - 1)]); } }
  }
  function makeHero(f, glow) { // 22x30 grid (+1 px outline), faces right, 4 walk frames
    const p = new Pix(22, 30);
    const s = [{ bob: 0, a: 2, b: -2, la: 0, lb: 0, hand: 1, flap: 0 }, { bob: -1, a: 0, b: 0, la: 0, lb: -1, hand: 0, flap: 1 },
      { bob: 0, a: -2, b: 2, la: 0, lb: 0, hand: -1, flap: 0 }, { bob: -1, a: 0, b: 0, la: -1, lb: 0, hand: 0, flap: 1 }][f];
    const leg = (x, lift, far) => {
      const fb = 29 + lift;
      for (let y = 22; y <= fb - 3; y++) p.rect(x, y, 2, 1, far ? R.pants[0] : R.pants[1]);
      p.rect(x, fb - 2, 2, 1, R.boot[far ? 2 : 3]); p.rect(x, fb - 1, 3, 1, R.boot[far ? 1 : 2]); p.rect(x, fb, 3, 1, R.boot[far ? 0 : 1]);
      if (!far) p.set(x, fb - 1, R.boot[3]); };
    leg(8 + s.b, s.lb, true); leg(11 + s.a, s.la, false);
    const top = 17 + s.bob;
    for (let r = 0; r < 7; r++) { // short cape, back edge flares left
      const xl = Math.round(11 - 3.6 - r * 0.6) - (r >= 4 ? s.flap : 0), xr = Math.round(11 + 3.4 + r * 0.2);
      for (let x = xl; x < xr; x++) {
        if (r === 6 && (x === xl || x === xr - 1)) continue;
        const u = (x - xl) / Math.max(1, xr - xl - 1);
        let k = u < 0.25 ? 3 : u < 0.6 ? 2 : u < 0.86 ? 1 : 0;
        if (r === 0) k = Math.min(4, k + 1); if (r === 6) k = Math.max(0, k - 1); if (r >= 3 && x === xl + 2) k = Math.max(0, k - 1);
        p.set(x, top + r, R.cloak[k]); } }
    const ax = 13 + s.hand;
    for (let y = top + 1; y <= top + 3; y++) { p.set(ax, y, R.cloak[3]); p.set(ax + 1, y, R.cloak[2]); }
    p.set(ax, top + 4, R.boot[3]); p.set(ax + 1, top + 4, R.boot[2]); p.set(ax, top + 5, R.boot[2]); p.set(ax + 1, top + 5, R.boot[1]);
    for (let x = 6; x <= 15; x++) { p.set(x, top - 1, R.scarf[x < 11 ? 2 : 1]); p.set(x, top, R.scarf[x < 9 ? 1 : 0]); }
    p.set(6, top + 1, R.scarf[2]); p.set(5, top + 1, R.scarf[1]);
    p.set(5 - s.flap, top + 2, R.scarf[2]); p.set(4 - s.flap, top + 2, R.scarf[1]); p.set(4 - s.flap, top + 3, R.scarf[0]);
    const hy = 9.2 + s.bob;
    pumpkinBody(p, 11, hy, 8.6, 6.7, R.pk, [-0.5, 0.05, 0.58]);
    const ht = Math.floor(hy - 6.7);
    p.set(10, ht, R.pk[1]); p.set(11, ht, R.pk[1]); p.set(12, ht, R.pk[2]);
    for (const [x, y, k] of [[10, 1, 2], [11, 1, 1], [10, 2, 2], [11, 2, 1], [11, 3, 2], [12, 3, 1], [13, 1, 2], [14, 2, 2], [14, 1, 1]]) p.set(x, ht - y, R.stem[k]);
    const ey = Math.round(hy) - 3;
    carve(p, pts(['.1....1..', '121..121.'], 9, ey).concat(pts(['0.......0', '1121.1211', '.0122210.'], 8, ey + 4)), glow ? R.glowB : R.glow, R.pk[0]);
    return p.canvas();
  }
  function makeCreeper(f, v) { // small melee enemy: turnip bulb on root legs, 20x26
    const TOP = v ? R.tmag : R.tpur, p = new Pix(20, 26);
    const st = [{ sx: 0, by: 0, la: 0, lb: -1, sw: 0 }, { sx: 1, by: -1, la: 0, lb: 0, sw: 1 }, { sx: 0, by: 0, la: -1, lb: 0, sw: 0 }, { sx: -1, by: -1, la: 0, lb: 0, sw: -1 }][f];
    const leg = (x, lift, far) => {
      const fb = 25 + lift;
      for (let y = 21; y < fb; y++) p.rect(x, y, 2, 1, R.root[far ? 0 : 1]);
      p.set(x, 21, R.root[far ? 1 : 2]); p.rect(x, fb, 3, 1, R.root[far ? 0 : 1]); p.set(x, fb, R.root[far ? 1 : 2]); };
    leg(6, st.lb, true); leg(11, st.la, false);
    const cx = 10 + st.sx * 0.5, cy = 15 + st.by, rx = 7.6, ry = 7.4;
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, wf = ny > 0.1 ? 1 - 0.6 * Math.pow((ny - 0.1) / 0.9, 1.25) : 1;
      const nxx = nx / Math.max(0.05, wf), d = nxx * nxx + ny * ny;
      if (d > 1) continue;
      const k = qi(lam(nxx, ny, Math.sqrt(1 - d)), [-0.3, 0.08, 0.46, 0.8]), zb = 0.02 + 0.12 * Math.sin(nxx * 8.5 + 1.3);
      let c = ny < zb ? TOP[k] : R.cream[k];
      if (ny >= zb && ny < zb + 0.13) c = mixc(TOP[Math.min(4, k + 1)], R.cream[k], 0.5); // blended seam band
      p.set(x, y, c); }
    p.set(Math.floor(cx), Math.floor(cy + ry), R.cream[1]);
    const lb = Math.floor(cy - ry) + 1;
    p.leaf(9.5, lb + 1, 4 + st.sw, lb - 5, 1.8, R.leaf); p.leaf(11, lb + 1, 16.5 + st.sw, lb - 5.5, 1.8, R.leaf); p.leaf(10.2, lb + 1, 10.4 + st.sw, lb - 8, 2.1, R.leaf);
    p.set(10, lb, TOP[1]); p.set(9, lb, TOP[2]); p.set(11, lb, TOP[1]);
    const ex = Math.round(cx) + 1, ey = Math.round(cy) - 1, B = hx('#22122c'), E = R.glow, my = ey + 4;
    for (const [x, y, c] of [[-1, -2, B], [0, -1, B], [1, -1, B], [5, -2, B], [4, -1, B], [3, -1, B], [0, 0, E[2]], [1, 0, E[1]], [0, 1, E[1]], [1, 1, E[0]],
      [3, 0, E[2]], [4, 0, E[1]], [3, 1, E[0]], [4, 1, E[0]], [0, 5, B], [1, 4, B], [2, 4, B], [3, 4, B], [4, 5, B], [1, 5, R.cream[4]]]) p.set(ex + x, ey + y, c);
    return p.canvas();
  }
  function makeGhost(f) { // fast enemy: translucent tattered sheet, own cool outline colour
    const p = new Pix(22, 28), I = R.ice, cx = 9.5, cy = 8.5;
    for (let y = 9; y <= 27; y++) {
      const t = (y - 9) / 18, ccx = cx - 4 * t * t + Math.sin(f * Math.PI / 2 + t * 4.2) * 1.9 * t, hw = 6.3 * (1 - 0.6 * Math.pow(t, 1.05)) + 0.2;
      for (let x = Math.floor(ccx - hw) - 1; x <= Math.ceil(ccx + hw); x++) {
        const dx = x + 0.5 - ccx; if (Math.abs(dx) > hw) continue;
        const u = (dx / hw + 1) / 2;
        if (t > 0.5) { const si = Math.min(2, Math.floor(u * 3)), su = u * 3 - si; if (t > [0.88, 1.0, 0.76][(si + f) % 3] || su < 0.18 + (t - 0.5) * 0.7 || su > 0.95) continue; }
        const u2 = dx / hw; let k = u2 < -0.4 ? 3 : u2 < 0.3 ? 2 : u2 < 0.72 ? 1 : 0;
        if (t > 0.45 && k > 1) k--;
        const c = I[k].slice(); c[3] = Math.round(235 - t * 105); p.set(x, y, c); } }
    p.blob(cx, cy, 6.6, 7.4, (nx, ny, nz) => { const c = I[Math.min(4, qi(lam(nx, ny, nz), [-0.25, 0.12, 0.5, 0.82]))].slice(); c[3] = 242; return c; });
    const D0 = hx('#100d24'), D1 = hx('#272650'), M0 = hx('#3a2652'), CH = I[1].slice(); CH[3] = 242;
    for (const [x, y, c] of [[10, 5, D1], [11, 5, D1], [10, 6, D0], [11, 6, D0], [10, 7, D0], [11, 7, D1], [10, 8, D1], [14, 5, D1], [14, 6, D0], [15, 6, D1], [14, 7, D0], [14, 8, D1],
      [9, 9, CH], [12, 9, CH], [15, 9, CH], [11, 10, D1], [12, 10, D1], [13, 10, D1], [11, 11, D0], [12, 11, M0], [13, 11, D0], [11, 12, D0], [12, 12, M0], [13, 12, D0], [12, 13, D1]]) p.set(x, y, c);
    if (f % 2) { p.set(11, 13, D0); p.set(13, 13, D0); p.set(12, 14, D1); }
    const aw = [0, 1, 0, -1][f], ac = I[3].slice(), ac2 = I[2].slice(); ac[3] = 215; ac2[3] = 190;
    for (const [x, y, c] of [[15, 13, ac], [16, 13, ac], [17, 12 + (aw > 0 ? 1 : 0), ac], [18, 12 + aw, ac2], [19, 11 + aw, ac2], [19, 13 + aw, ac2], [20, 12 + aw, ac2],
      [14, 15, ac2], [15, 15, ac2], [16, 16 + (aw < 0 ? 1 : 0), ac2], [17, 16, ac2]]) p.set(x, y, c);
    return p.canvas(true, hx('#33406c'));
  }
  function makeTree(ramp, big, seed) { // canopy of overlapping noisy blobs, height-field picks the top blob
    const r = rng(seed), W = big ? 68 : 56, H = big ? 80 : 65, p = new Pix(W, H), cx = W / 2, base = H - 1;
    const R0 = big ? 26 : 21, ccy = R0 + 3, cBot = Math.round(ccy + R0 * 0.82), trunkTop = ccy + 2;
    for (let y = trunkTop; y <= base; y++) {
      const t = (y - trunkTop) / (base - trunkTop), hw = (big ? 3.7 : 3.1) + t * 0.6 + (t > 0.8 ? Math.pow((t - 0.8) / 0.2, 2) * 3.6 : 0);
      for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) {
        if (x + 0.5 < cx - hw || x + 0.5 > cx + hw) continue;
        const u = (x + 0.5 - cx) / hw; let k = u < -0.45 ? 3 : u < 0.15 ? 2 : u < 0.6 ? 1 : 0;
        if (k > 0 && k < 3 && ((x * 5 + ((y / 4) | 0) * 3) % 7 === 0)) k--;
        p.set(x, y, R.bark[k]); } }
    p.line(cx - 2, cBot + 2, cx - 9, cBot - 7, R.bark[2]); p.line(cx + 1, cBot + 2, cx + 9, cBot - 8, R.bark[1]);
    const blobs = [{ x: cx, y: ccy, r: R0 * 0.8, z: 4 }];
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + r.range(-0.22, 0.22), dd = R0 * r.range(0.5, 0.6); blobs.push({ x: cx + Math.cos(a) * dd * 1.16, y: ccy + Math.sin(a) * dd * 0.8, r: R0 * r.range(0.42, 0.52), z: Math.sin(a) * 3 }); }
    for (let i = 0; i < 3; i++) { const a = Math.PI * (1.15 + i * 0.35) + r.range(-0.2, 0.2); blobs.push({ x: cx + Math.cos(a) * R0 * 0.36, y: ccy + Math.sin(a) * R0 * 0.34, r: R0 * 0.38, z: 6 }); }
    const ph = r.range(0, 6), shade = new Set();
    for (let y = 0; y < cBot + 6; y++) for (let x = 0; x < W; x++) {
      let best = null, bh = -1e9;
      for (const b of blobs) {
        const dx = x + 0.5 - b.x, dy = y + 0.5 - b.y, a = Math.atan2(dy, dx), rr = b.r * (1 + 0.08 * Math.sin(a * 7 + ph + b.x) + 0.05 * Math.sin(a * 13 + b.y)), d2 = dx * dx + dy * dy;
        if (d2 > rr * rr) continue;
        const hgt = Math.sqrt(rr * rr - d2) + b.z; if (hgt > bh) { bh = hgt; best = { dx, dy, rr }; } }
      if (!best) continue;
      const nx = best.dx / best.rr, ny = best.dy / best.rr;
      let l = lam(nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))) * 0.85 + 0.1 - 0.24 * ((y - (ccy - R0)) / (2 * R0));
      l += (noise(x / 2.7, y / 2.4, seed) - 0.5) * 0.3;
      p.set(x, y, ramp[qi(l, [-0.12, 0.2, 0.47, 0.73])]); shade.add(x + ',' + y); }
    for (let y = cBot - 2; y < cBot + 4; y++) for (let x = 0; x < W; x++) if (!shade.has(x + ',' + y) && p.get(x, y)) p.set(x, y, R.bark[0]);
    return p.canvas();
  }
  const rowsSprite = (rows, pal, outline, oc) => { const p = new Pix(Math.max(...rows.map((r) => r.length)), rows.length); p.rows(0, 0, rows, pal); return p.canvas(outline, oc); };
  function disc(r, col, a0, a1) { // stepped additive glow (3 hard alpha rings, no gradients)
    const s = r * 2 + 1, { c, ctx } = mk(s, s), img = ctx.createImageData(s, s), cc = hx(col);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dd = Math.hypot(x - r, y - r) / (r + 0.5); if (dd > 1) continue;
      const o = (y * s + x) * 4; img.data.set([cc[0], cc[1], cc[2], (dd < 0.45 ? a0 : dd < 0.75 ? (a0 + a1) / 2 : a1) * 255], o); }
    ctx.putImageData(img, 0, 0); return c;
  }
  function shadowSprite(w) { // plum pixel ellipse, two alpha steps
    const h = Math.max(2, Math.round(w * 0.36)), { c, ctx } = mk(w, h), img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - w / 2) / (w / 2), ny = (y + 0.5 - h / 2) / (h / 2), q = nx * nx + ny * ny;
      if (q <= 1) img.data.set([40, 22, 56, q > 0.55 ? 62 : 92], (y * w + x) * 4); }
    ctx.putImageData(img, 0, 0); return c;
  }
  /* ---------- ground: material map -> edge rules -> stamps -> decals (baked once per size) ---------- */
  const GRASS = 0, GOLD = 1, CLOVER = 2, SOIL = 3, PATH = 4;
  const GP = [
    { t: hexes(['#77963b', '#617f38', '#8ea945', '#a6bd55', '#86a948', '#557a39', '#7e9c3f']), rim: hx('#9ab64e'), rim2: hx('#88a645'), lip: hx('#456b39'), dk: hx('#668639') },
    { t: hexes(['#9a9d45', '#80873c', '#b0b052', '#cbc366', '#aaab4f', '#757d3c', '#a2a449']), rim: hx('#bcba5b'), rim2: hx('#aaaa50'), lip: hx('#5a6e38'), dk: hx('#878e3f') },
    { t: hexes(['#5b893f', '#48723c', '#6c9a48', '#83b054', '#7aaa4c', '#3d643b', '#608e43']), rim: hx('#78a64b'), rim2: hx('#699745'), lip: hx('#33573a'), dk: hx('#4d7a3d') },
  ];
  const SOILC = { fur: hexes(['#a26e44', '#8a5a3c', '#784d36', '#664132', '#50332f', '#5c3a31']), rim: hx('#734a35'), rimL: hx('#8d5d3d'), sh: hx('#3c2530'), sh2: hx('#513232') };
  const PATHC = { base: hx('#b08a5a'), light: hx('#c4a06a'), bright: hx('#d6b882'), dark: hx('#987450'), rut: hx('#9e7a50'), edge: hx('#a4804f'), sh: hx('#755244'), sh2: hx('#8f6a4c') };
  const LEAFSETS = [hexes(['#c8563b', '#a33b31', '#7c2b33']), hexes(['#da763b', '#bc5a2f', '#8f402f']), hexes(['#eda146', '#d88437', '#ab5e2f']), hexes(['#efcb5d', '#d6a944', '#a67c37']), hexes(['#aa7a50', '#8b5c3c', '#673f32'])];
  const LITTER = hexes(['#7c3531', '#86412f', '#93582f', '#8d4a2d']), LITTER2 = hexes(['#6c2c2f', '#76372d', '#82492c', '#7c3f2b']);
  const LEAFSH = [['.12.', '1223', '.23.'], ['.1.', '122', '223', '.3.'], ['12.', '223', '.3.'], ['.12', '122', '23.'], ['122', '.23']];
  const LEAFZ = [[0, 0, 0, 1, 1, 0, 4, 1], [1, 1, 1, 2, 0, 1, 4, 2], [3, 3, 2, 3, 2, 3, 4, 1], [2, 2, 2, 1, 1, 3, 2, 4]];
  const TUFTS = [['..2..', '2.1.2', '1.1.1', '.111.'], ['2.2', '1.1', '.1.'], ['.2..', '21.2', '.1.1', '..1.'], ['.3.3.', '.2.2.', '21.12', '.111.'], ['3.3', '2.2', '1.1', '.1.']];
  const TREFOIL = [['.4.', '454', '.5.'], ['44.', '454', '.5.'], ['.44', '545', '.5.']];
  const TREE_ZONE = [3, 0, 2, 1];
  const DEC = { // decal rows: 's' = multiply shadow pixel
    flower: [['.p.', 'PyP', '.gs'], { p: hx('#fbf6e6'), P: hx('#e2dac8'), y: hx('#f6d040'), g: hx('#3f6a36') }],
    flowerY: [['.p.', 'PyP', '.gs'], { p: hx('#f4d24a'), P: hx('#d8a838'), y: hx('#f6d040'), g: hx('#3f6a36') }],
    flowerV: [['.p.', 'PyP', '.gs'], { p: hx('#c79ae0'), P: hx('#9a6cbc'), y: hx('#f6d040'), g: hx('#3f6a36') }],
    mush: [['.rrr.', 'rwrrw', 'RRRRR', '.scs.', '..cs.'], { r: hx('#d6402e'), R: hx('#962a2e'), w: hx('#fff4dc'), c: hx('#efe0c0') }],
    pumpkin: [['...g...', '.hh.oo.', 'hoohood', 'ooodooD', 'oodDdDD', '.sDDDs.'], { g: hx('#4a7030'), h: hx('#f8a848'), o: hx('#e07a2e'), d: hx('#b4502a'), D: hx('#7e3228') }],
    pebble: [['.hl', 'lmd', 'sss'], { h: R.stone[3], l: R.stone[2], m: R.stone[1], d: R.stone[0] }],
    edge: [['.hhl.', 'hllmd', 'lmmdd', '.sss.'], { h: R.stone[3], l: R.stone[2], m: R.stone[1], d: R.stone[0] }],
    sprout: [['l.l', '.g.', '.s.'], { l: hx('#7cb446'), g: hx('#4a8636') }],
  };
  function bakeGround(W, H, trees) {
    const M = 2, NB = W + M * 2, NH = H + M * 2, N = NB * NH, X0 = 1000 - M, Y0 = 700 - M;
    const JA = new Float32Array(4096), JB = new Float32Array(4096); // tileable 64x64 jitter for organic edges
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { JA[y * 64 + x] = (fbm(x / 8, y / 8, 71, 2, 8) - 0.5) * 2.2; JB[y * 64 + x] = (fbm(x / 8 + 0.37, y / 8 + 0.61, 97, 2, 8) - 0.5) * 2.2; }
    const mat = new Uint8Array(N), pd = new Float32Array(N), ld = new Float32Array(N), mv = new Float32Array(N), zone = new Uint8Array(N), mot = new Uint8Array(N);
    const pathY = (x) => H * 0.6 + Math.sin(x * 0.012 + 0.4) * H * 0.13 + Math.sin(x * 0.037) * 5, field = { x0: W * 0.04, y0: H * 0.05, x1: W * 0.04 + 150, y1: H * 0.05 + 78 };
    const fSdf = (x, y) => { const r = 6, qx = Math.abs(x - (field.x0 + field.x1) / 2) - ((field.x1 - field.x0) / 2 - r), qy = Math.abs(y - (field.y0 + field.y1) / 2) - ((field.y1 - field.y0) / 2 - r); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; };
    for (let py = 0; py < NH; py++) for (let px = 0; px < NB; px++) {
      const X = X0 + px, Y = Y0 + py, i = py * NB + px, lx = px - M, ly = py - M, ti = ((Y & 63) << 6) | (X & 63), ja = JA[ti], jb = JB[ti];
      const d = Math.abs(ly - pathY(lx)) / Math.hypot(1, (pathY(lx + 1) - pathY(lx - 1)) / 2), m0 = fbm(X / 700, Y / 700, 3313, 2), hw = 8.5 + m0 * 6;
      pd[i] = d; mv[i] = m0;
      const F = fbm(X / 200, Y / 200, 1101, 2) * 0.75 + 0.26 * (lx / W);
      let dens = sstep(0.585, 0.69, F) * 1.25, z = -1, best = 0;
      for (const t of trees) { const dx = (lx - t.x) / (t.big ? 38 : 31), dy = (ly - t.y + 3) / (t.big ? 22 : 18), q = 1 - (dx * dx + dy * dy); if (q > 0) { dens = Math.max(dens, q * 1.8); if (q > best) { best = q; z = TREE_ZONE[t.v]; } } }
      if (z < 0) { const n = fbm(X / 170, Y / 170, 3331, 2); z = n < 0.45 ? 0 : n < 0.56 ? 1 : 2; }
      ld[i] = dens; zone[i] = z;
      if (d + ja * 2.2 < hw) mat[i] = PATH;
      else if (fSdf(lx + 0.5, ly + 0.5) + jb * 1.2 < 0) mat[i] = SOIL;
      else {
        mat[i] = fbm(X / 220, Y / 220, 3301, 3) + jb * 0.035 > 0.6 ? CLOVER : fbm(X / 260, Y / 260, 3307, 3) + ja * 0.03 > 0.54 ? GOLD : GRASS;
        mot[i] = fbm(X / 52, Y / 52, 3323, 2) + jb * 0.035 > 0.575 ? 1 : 0; } }
    const tone = new Uint8Array(N), leafB = new Uint8Array(N);
    const stampRows = (rows, lx, ly, fn) => { for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) { const ch = rows[y].charCodeAt(x) - 48, qx = lx + x, qy = ly + y; if (ch >= 1 && ch <= 9 && qx >= 0 && qy >= 0 && qx < NB && qy < NH) fn(qy * NB + qx, ch); } };
    for (let cy = -1; cy <= NH / 6; cy++) for (let cx = -1; cx <= NB / 7; cx++) { // grass tufts, clumped by the mottle noise
      const h = hashInt(cx, cy, 7717), lx = cx * 7 + (h & 3), ly = cy * 6 + ((h >>> 2) & 3);
      const p = 0.05 + 0.42 * sstep(0.42, 0.72, fbm((X0 + lx) / 52, (Y0 + ly) / 52, 3323, 2));
      if (((h >>> 4) & 1023) / 1024 > p) continue;
      const am = mat[clamp(ly + 2, 0, NH - 1) * NB + clamp(lx + 1, 0, NB - 1)];
      stampRows(am === GOLD ? TUFTS[3 + ((h >>> 14) & 1)] : TUFTS[(h >>> 14) % 3], lx, ly, (q, ch) => { if (mat[q] <= CLOVER && !tone[q]) tone[q] = ch; }); }
    for (let cy = -1; cy <= NH / 4; cy++) for (let cx = -1; cx <= NB / 5; cx++) { // clover trefoils
      const h = hashInt(cx, cy, 6619); if ((h & 255) > 110) continue;
      stampRows(TREFOIL[(h >>> 12) % 3], cx * 5 + ((h >>> 8) & 3), cy * 4 + ((h >>> 10) & 3), (q, ch) => { if (mat[q] === CLOVER) tone[q] = ch; }); }
    for (let cy = -2; cy <= NH / 3; cy++) for (let cx = -2; cx <= NB / 3; cx++) { // leaf litter: stamp survival ~ density
      const h = hashInt(cx, cy, 8819), lx = cx * 3 + (h & 3) % 3, ly = cy * 3 + ((h >>> 2) & 3) % 3, k = clamp(ly, 0, NH - 1) * NB + clamp(lx, 0, NB - 1);
      if (ld[k] < 0.03 || ((h >>> 4) & 1023) / 1024 > ld[k] * 1.05 - 0.12) continue;
      const set = LEAFZ[zone[k]][(h >>> 18) & 7];
      stampRows(LEAFSH[(h >>> 14) % 5], lx, ly, (q, ch) => { if (ch <= 3 && mat[q] <= CLOVER) leafB[q] = set * 4 + ch; }); }
    const { c, ctx } = mk(W, H), out = ctx.createImageData(W, H), od = out.data;
    for (let py = M; py < M + H; py++) for (let px = M; px < M + W; px++) {
      const X = X0 + px, Y = Y0 + py, i = py * NB + px, m = mat[i], hh = hashInt(X, Y, 4242), hr = (hh & 1023) / 1024, ti = ((Y & 63) << 6) | (X & 63);
      let col;
      if (m <= CLOVER) { // grass: lip above a drop, rim below a raised edge, then litter / tufts
        const gp = GP[m], dn = mat[i + NB], up = mat[i - NB];
        if (dn > CLOVER) col = gp.lip; else if (up > CLOVER) col = gp.rim;
        else if (leafB[i]) { const s = LEAFSETS[(leafB[i] - 1) >> 2], k = (leafB[i] - 1) & 3; col = s[k === 3 ? 1 : k]; }
        else if (ld[i] + JA[ti] * 0.12 > 0.62) col = (hh >>> 15) % 5 ? LITTER[zone[i]] : LITTER2[zone[i]];
        else if (mat[i - 1] > CLOVER) col = gp.rim2; else if (mat[i + 1] > CLOVER) col = gp.dk;
        else col = gp.t[tone[i] || (mot[i] ? 6 : 0)];
      } else { // soil / path sit LOWER than grass: 2-px dithered shadow band under the grass edge
        const up = mat[i - NB], up2 = mat[i - NB * 2], isS = m === SOIL;
        if (up <= CLOVER) col = (hh >>> 12) & 1 ? GP[up].lip : isS ? SOILC.sh : PATHC.sh;
        else if (up2 <= CLOVER) col = ((X + Y) & 1) || ((hh >>> 13) & 1) ? (isS ? SOILC.sh2 : PATHC.sh2) : (isS ? SOILC.sh : PATHC.sh);
        else if (mat[i - 1] <= CLOVER) col = isS ? SOILC.sh2 : PATHC.sh2;
        else if (isS) {
          if (fSdf(px - M + 0.5, py - M + 0.5) > -3.2) col = mat[i + NB] <= CLOVER ? SOILC.rimL : SOILC.rim;
          else { col = SOILC.fur[(((Y + Math.round(JB[ti] * 1.3)) % 6) + 6) % 6]; if (hr < 0.035) col = hx('#b07a4c'); else if (hr < 0.06) col = hx('#462a2c'); }
        } else {
          const hw = 8.5 + mv[i] * 6;
          col = Math.abs(pd[i] - hw * 0.42) < 1.05 ? PATHC.rut : pd[i] > hw - 1.6 ? PATHC.edge : PATHC.base;
          if (hr < 0.05) col = PATHC.light; else if (hr < 0.085) col = PATHC.dark; else if (hr < 0.095) col = PATHC.bright; } }
      const k = 0.955 + mv[i] * 0.09, wr = (mv[i] - 0.5) * 0.03, o = ((py - M) * W + (px - M)) * 4; // macro warm/cool drift
      od[o] = col[0] * (k + wr); od[o + 1] = col[1] * k; od[o + 2] = col[2] * (k - wr); od[o + 3] = 255; }
    const stamp = (dec, x, y) => {
      const [rows, pal] = dec, ox = Math.round(x - rows[0].length / 2), oy = Math.round(y - rows.length + 1);
      rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) {
        const qx = ox + i, qy = oy + j, ch = r[i]; if (qx < 0 || qy < 0 || qx >= W || qy >= H || ch === '.') continue;
        const o = (qy * W + qx) * 4;
        if (ch === 's') { od[o] *= 0.72; od[o + 1] *= 0.7; od[o + 2] *= 0.8; } else if (pal[ch]) od.set(pal[ch], o);
      } }); };
    const at = (x, y) => clamp(Math.round(y) + M, 0, NH - 1) * NB + clamp(Math.round(x) + M, 0, NB - 1);
    for (let cy = 0; cy <= H / 9; cy++) for (let cx = 0; cx <= W / 9; cx++) {
      const r = rng(hashInt(cx, cy, 9101)), x = (cx + r.next()) * 9, y = (cy + r.next()) * 9, k = at(x, y), m = mat[k], roll = r.next();
      if (m === PATH) { if (roll < 0.1 && pd[k] < 6) stamp(DEC.pebble, x, y); else if (roll > 0.8 && pd[k] > 7) stamp(DEC.edge, x, y); }
      else if (m === SOIL) { if (((Math.round(y) + 700) % 6 + 6) % 6 === 1 && roll < 0.6 && fSdf(x, y) < -6) stamp(DEC.sprout, x, y); }
      else if (ld[k] > 0.15 && ld[k] < 0.9 && roll < 0.05) stamp(DEC.mush, x, y);
      else if (ld[k] < 0.15 && pd[k] > 16) { if (roll < 0.13) stamp(m === GOLD ? DEC.flowerY : m === CLOVER ? DEC.flowerV : DEC.flower, x, y); else if (roll > 0.993) stamp(DEC.pumpkin, x, y); } }
    ctx.putImageData(out, 0, 0);
    return c;
  }
  /* ---------- sprite cache ---------- */
  let S = null, scene = null;
  function sprites() {
    if (S) return S;
    S = { hero: [0, 1].map((g) => [0, 1, 2, 3].map((f) => pair(makeHero(f, g)))), creeper: [0, 1].map((v) => [0, 1, 2, 3].map((f) => pair(makeCreeper(f, v)))),
      ghost: [0, 1, 2, 3].map((f) => pair(makeGhost(f))), shadow: {}, glowS: disc(3, '#ff9030', 0.26, 0.06), glowJ: disc(9, '#ffb040', 0.18, 0.05),
      trees: [[TREE_RAMPS[0], true, 200], [TREE_RAMPS[1], true, 201], [TREE_RAMPS[2], false, 102], [TREE_RAMPS[3], true, 203]].map((a) => makeTree(...a)),
      gem: rowsSprite(['.a.', 'aya', 'yao', 'aoo', '.o.'], { y: hx('#fff4b0'), a: hx('#ffc23e'), o: hx('#f08a2a') }, true, hx('#6a2a1a')),
      seed: rowsSprite(['.cmm.', 'chmme', '.mee.'], { c: hx('#fff6dc'), m: hx('#eedcaa'), e: hx('#c9a874'), h: hx('#ffffff') }, true, hx('#5e3a2a')),
      spark: rowsSprite(['..w..', '..y..', 'wyWyw', '..y..', '..w..'], { w: hx('#ffe9a0'), y: hx('#ffc84a'), W: hx('#ffffff') }, false),
      leafP: LEAFSETS.map((s) => [rowsSprite(['ab', 'bc'], { a: s[0], b: s[1], c: s[2] }, false), rowsSprite(['ab.', '.bc'], { a: s[0], b: s[1], c: s[2] }, false), rowsSprite(['a', 'b', 'c'], { a: s[0], b: s[1], c: s[2] }, false), rowsSprite(['.ab', 'bc.'], { a: s[0], b: s[1], c: s[2] }, false)]) };
    S.creeperF = S.creeper[0].map((p) => tint(p.r, '#ffffff'));
    for (const w of [10, 14, 40, 50, 6]) S.shadow[w] = shadowSprite(w);
    return S;
  }
  function shadow(ctx, w, x, y, a) { const img = S.shadow[w]; ctx.globalAlpha = a || 1; ctx.drawImage(img, Math.round(x + 1 - w / 2), Math.round(y - img.height / 2)); ctx.globalAlpha = 1; }
  /** Draws the hero with feet at (x, y). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) {
    sprites();
    const flick = noise(t * 9, 0.5, 3) > 0.62 ? 1 : 0, fr = Math.floor(t * 9.2) & 3; // 92 u/s, 1 frame per 10 u
    blit(ctx, S.hero[flick][fr][facing < 0 ? 'l' : 'r'], x, y);
  }
  /** Draws a typical enemy (turnip creeper) with feet at (x, y). */
  function drawEnemy(ctx, x, y, t, facing = -1, variant = 0, flash = false) {
    sprites();
    const fr = Math.floor(t * 5.8 + variant * 1.7) & 3;
    blit(ctx, flash ? S.creeperF[fr] : S.creeper[variant][fr][facing < 0 ? 'l' : 'r'], x, y);
  }
  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, hero, enemies, an effect. */
  function draw(ctx, w, h, t) {
    sprites();
    const up = Math.max(1, Math.round(h / 360)), W = Math.ceil(w / up), H = Math.ceil(h / up); // 1 art px = 1 world unit
    if (!scene || scene.W !== W || scene.H !== H) {
      const trees = [{ x: W * 0.8, y: H * 0.42, v: 0, big: true, i: 0 }, { x: W * 0.14, y: H * 0.98, v: 1, big: true, i: 1 }, { x: W * 0.62, y: H * 0.34, v: 2, big: false, i: 2 }, { x: W * 0.95, y: H * 0.9, v: 3, big: true, i: 3 }].map((o) => ({ ...o, x: Math.round(o.x), y: Math.round(o.y) }));
      const buf = mk(W, H), grade = mk(W, H), vig = mk(W, H);
      const lg = grade.ctx.createLinearGradient(0, 0, W, H); // warm afternoon grade (soft-light) + plum vignette (multiply)
      lg.addColorStop(0, 'rgba(255,190,110,0.55)'); lg.addColorStop(0.5, 'rgba(255,170,100,0.18)'); lg.addColorStop(1, 'rgba(80,90,160,0.42)');
      grade.ctx.fillStyle = lg; grade.ctx.fillRect(0, 0, W, H);
      const rg = vig.ctx.createRadialGradient(W * 0.48, H * 0.46, Math.min(W, H) * 0.35, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.62);
      rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, 'rgb(150,110,150)'); vig.ctx.fillStyle = rg; vig.ctx.fillRect(0, 0, W, H);
      scene = { W, H, trees, buf, grade: grade.c, vig: vig.c, ground: bakeGround(W, H, trees) }; }
    const b = scene.buf.ctx;
    b.imageSmoothingEnabled = false; b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
    b.drawImage(scene.ground, 0, 0);
    const hx0 = Math.round(W * 0.47 + Math.sin(t * 0.7) * 30), hy0 = Math.round(H * 0.55), hf = Math.cos(t * 0.7) >= 0 ? 1 : -1;
    const list = scene.trees.map((tr) => ({ y: tr.y, sh: tr.v === 2 ? 40 : 50, x: tr.x, d: () => blit(b, S.trees[tr.i], tr.x, tr.y) }));
    list.push({ x: hx0, y: hy0, sh: 14, d: () => drawHero(b, hx0, hy0, t, hf) });
    const foes = [[0.3, 0.42, 0], [0.7, 0.66, 1], [0.24, 0.74, 0], [0.82, 0.62, 0]];
    foes.forEach(([fx, fy, v], k) => {
      const x = Math.round(W * fx + Math.sin(t * 0.9 + k) * 6), y = Math.round(H * fy + Math.cos(t * 0.7 + k) * 4), face = x < hx0 ? 1 : -1;
      const flash = k === 0 && (t * 1.3) % 1 < 0.12;
      list.push({ x, y, sh: 14, d: () => drawEnemy(b, x, y, t, face, v, flash) }); });
    [[0.38, 0.86], [0.6, 0.48]].forEach(([fx, fy], k) => { // ghosts hover 3 +-1.5 units, 86 % opacity
      const x = Math.round(W * fx + Math.sin(t * 1.1 + k * 2) * 10), y = Math.round(H * fy), lift = 3 + Math.round(Math.sin(t * 3 + k * 6) * 1.5);
      list.push({ x, y, sh: 10, a: 0.55, d: () => { b.globalAlpha = 0.86; blit(b, S.ghost[Math.floor(t * 6 + k) & 3][x < hx0 ? 'r' : 'l'], x, y - lift); b.globalAlpha = 1; } }); });
    for (const o of list) shadow(b, o.sh, o.x, o.y, o.a);
    list.sort((p, q) => p.y - q.y);
    for (const o of list) o.d();
    [[0.55, 0.7], [0.4, 0.6], [0.66, 0.8]].forEach(([fx, fy], k) => { // XP gems: bob 1 unit, additive stepped glow
      const x = Math.round(W * fx), y = Math.round(H * fy), gy = y - 4 - Math.round(Math.sin(t * 3 + k * 2));
      b.drawImage(S.shadow[6], x - 3, y - 1);
      b.globalCompositeOperation = 'lighter'; b.globalAlpha = 0.5 + 0.15 * Math.sin(t * 5 + k);
      b.drawImage(S.glowS, x - 3, gy + 2 - 3); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
      b.drawImage(S.gem, x - (S.gem.width >> 1), gy);
      if ((t * 0.8 + k * 0.37) % 1 < 0.16) b.drawImage(S.spark, x + 1 - 2, gy - 3); });
    for (let k = 0; k < 3; k++) { // seed projectiles toward the flashing enemy, 2 trail pixels
      const tx = W * 0.3, ty = H * 0.42 - 10, u = ((t * 1.3 + k / 3) % 1), sx = hx0 + 4, sy = hy0 - 14;
      const x = sx + (tx - sx) * u, y = sy + (ty - sy) * u, dl = Math.hypot(tx - sx, ty - sy), dx = (tx - sx) / dl, dy = (ty - sy) / dl;
      b.fillStyle = '#fff2c8'; b.globalAlpha = 0.55; b.fillRect(Math.round(x - dx * 4), Math.round(y - dy * 4), 1, 1);
      b.globalAlpha = 0.28; b.fillRect(Math.round(x - dx * 6), Math.round(y - dy * 6), 1, 1); b.globalAlpha = 1;
      b.drawImage(S.seed, Math.round(x - 3), Math.round(y - 2)); }
    for (let i = 0; i < 9; i++) { // wind-blown leaves, world anchored and wrapping
      const x = ((hashInt(i, 1, 77) / 4294967296) * W + t * (16 + i * 1.3)) % W, y = ((hashInt(i, 2, 77) / 4294967296) * H + t * 7 + Math.sin(t * 1.4 + i) * 8 + H) % H;
      b.drawImage(S.leafP[i % 5][Math.floor(t * 6 + i) & 3], Math.round(x), Math.round(y)); }
    b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.5; b.drawImage(scene.grade, 0, 0);
    b.globalAlpha = 1; b.globalCompositeOperation = 'multiply'; b.drawImage(scene.vig, 0, 0); b.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE.meadow; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(scene.buf.c, 0, 0, W * up, H * up);
  }
  const Starter = { id: 'harvest16', name: 'Harvest 16-Bit', palette: PALETTE, fonts: ['Pixelify Sans:wght@400;500;600;700', 'Silkscreen:wght@400;700'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['harvest16'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
