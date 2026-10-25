/* Pumpkin Boy — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   4-colour pumpkin LCD: every world pixel is one of 4 shades, shading only via Bayer dither; 1 art px = 2 world units. */
(function (root) {
  'use strict';
  const PALETTE = { ink: '#2a1712', rust: '#7c3a1e', pumpkin: '#e0812c', cream: '#f6d7a1' };
  const HEX = [PALETTE.ink, PALETTE.rust, PALETTE.pumpkin, PALETTE.cream]; // index 0 darkest .. 3 lightest
  const RGB = HEX.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const PX32 = RGB.map((c) => ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0); // little-endian ABGR
  const INV = [3, 2, 1, 0];          // palette inversion = flash frame
  const PS = 2;                      // world units per art pixel (360 world units tall = 180 art px)
  const TAU = Math.PI * 2, B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const bay = (x, y) => B4[((y & 3) << 2) | (x & 3)], clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /** Integer hash (same as the module) – deterministic per art pixel. */
  function hashInt(x, y, seed) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return h >>> 0;
  }
  /** Smooth value noise 0..1. */
  function vnoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const h = (i, j) => hashInt(xi + i, yi + j, seed) / 4294967296;
    const a = h(0, 0) + (h(1, 0) - h(0, 0)) * u, b = h(0, 1) + (h(1, 1) - h(0, 1)) * u;
    return a + (b - a) * v;
  }
  function mk(w, h) {
    const c = typeof document !== 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(w, h);
    c.width = w; c.height = h; return { c, ctx: c.getContext('2d') };
  }
  function flipX(src) {
    const { c, ctx } = mk(src.width, src.height);
    ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(src, 0, 0); return c;
  }

  /* ---------- index grids: -1 transparent, 0..3 palette index; sprites are text rows ---------- */
  function IG(w, h) {
    const a = new Int8Array(w * h).fill(-1);
    return {
      w, h, a,
      set(x, y, v) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = v; },
      get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? a[y * w + x] : -1; },
      rows(rows, ox = 0, oy = 0) { // '0'..'3' = colour, 'x' = erase, anything else = keep
        for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
          const ch = rows[y].charCodeAt(x);
          if (ch >= 48 && ch <= 51) this.set(ox + x, oy + y, ch - 48);
          else if (ch === 120) this.set(ox + x, oy + y, -1);
        }
        return this;
      },
    };
  }
  /** Grow by 1 px and add a 4-neighbour outline in palette index col (default darkest). */
  function outline(g, col = 0) {
    const o = IG(g.w + 2, g.h + 2);
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
      const v = g.get(x - 1, y - 1);
      if (v >= 0) { o.a[y * o.w + x] = v; continue; }
      if (g.get(x - 2, y - 1) >= 0 || g.get(x, y - 1) >= 0 || g.get(x - 1, y - 2) >= 0 || g.get(x - 1, y) >= 0) o.a[y * o.w + x] = col;
    }
    return o;
  }
  function toCanvas(g, map) {
    const { c, ctx } = mk(g.w, g.h);
    const img = ctx.createImageData(g.w, g.h), d32 = new Uint32Array(img.data.buffer);
    for (let i = 0; i < g.a.length; i++) { let v = g.a[i]; if (v < 0) continue; if (map) v = map[v]; d32[i] = PX32[v]; }
    ctx.putImageData(img, 0, 0); return c;
  }
  /** Sprite set: right/left facing + palette-inverted copies for the flash frame. */
  function sset(g) { const r = toCanvas(g), ri = toCanvas(g, INV); return { r, l: flipX(r), ri, li: flipX(ri), g }; }
  /** Blit with anchor (ax, ay) at art-pixel position (x, y), snapped to whole pixels. */
  function blit(ctx, img, x, y, ax = 0.5, ay = 1, oy = 0) {
    ctx.drawImage(img, Math.round(x - img.width * ax), Math.round(y - img.height * ay) + oy);
  }
  function dot(ctx, x, y, ci, w = 1, h = 1) { ctx.fillStyle = HEX[ci]; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  /* ---------- sprites (grids verbatim from the module) ---------- */
  const JACK_HEAD = ['....11....', '.22211222.', '2221221222', '2223222322', '2233323332',
    '2222222221', '2322222231', '2333233332', '.22322322.', '..222222..'];
  const JB0 = '...113311...';
  const JACK_BODY = {
    idle: [JB0, '..21111112..', '...111111...', '...11..11...'],
    w0: [JB0, '.321111112..', '...111111...', '..11...11...'],
    w1: [JB0, '.321111112..', '...111111...', '...11.11....'],
    w2: [JB0, '.321111112..', '...111111...', '...11...11..'],
    w3: [JB0, '.321111112..', '...111111...', '....11.11...'],
  };
  const CREEP = ['..2..2..2.', '..22.2.22.', '...21212..', '..111111..', '.11111111.',
    '1113010311', '1113313311', '2121212121', '.33300332.', '..333322..'];
  const CREEP_LEGS = [['..1.32.1..', '.1......1.'], ['..1.32.1..', '..1....1..'], ['..1.32.1..', '.1......1.'], ['..1.321...', '..1...1...']];
  const GHOST_BODY = ['...33333...', '..3333333..', '.333333333.', '.333003003.', '3333003003.',
    '33333333323', '3333330032.', '3333330032.', '.333333332.', '..3333332..'];
  const GHOST_TAIL = [['..33332....', '..332......', '.33........', '.3.........'],
    ['...33332...', '...3332....', '....33.....', '.....3.....'], ['..33332....', '.3332......', '.33........', '3..........']];
  const LANTERN = [['.1...1.', '..1.1..', '.11111.', '1131311', '2333332', '.23032.', '..222..', '...2...'],
    ['.1...1.', '..1.1..', '.11111.', '1121211', '2222222', '.22022.', '..222..', '...2...']];
  const PROPS = {
    pumpkin: ['....1....', '...11....', '.2212122.', '222121222', '222121222', '222121221', '.2212121.'],
    jackolantern: ['....1....', '...11....', '.2212122.', '232232321', '222222221', '233333331', '.2323231.'],
    bush: ['...2222...', '.22333222.', '2233322221', '2232222121', '1222212211', '.11111111.'],
  };
  const FONT = { 0: ['111', '101', '101', '101', '111'], 1: ['110', '010', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
    3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], '!': ['1', '1', '1', '0', '1'] };

  /** Main character (pumpkin-headed figure): body rows + head rows composed into one 12x14 grid, then dark outline + light halo. */
  function jackFrame(body, headDy = 0) {
    const g = IG(12, 14).rows(JACK_BODY[body], 0, 10).rows(JACK_HEAD, 1, headDy);
    return sset(outline(outline(g), 3));
  }
  function creeperFrame(f) {
    const g = IG(10, 12).rows(CREEP).rows(CREEP_LEGS[f], 0, 10);
    if (f === 1) { g.set(2, 0, -1); g.set(1, 0, 2); }
    if (f === 3) { g.set(8, 0, -1); g.set(9, 0, 2); }
    return sset(outline(g));
  }
  /** Fast creature (ghost): solid body, outlined, then the lower rows dissolve with Bayer dither (fake transparency). */
  function ghostFrame(f) {
    const o = outline(IG(11, 14).rows(GHOST_BODY).rows(GHOST_TAIL[f], 0, 10)), g = IG(o.w, o.h);
    for (let y = 0; y < o.h; y++) {
      const lv = y < 9 ? 1 : y < 11 ? 0.75 : y < 13 ? 0.5 : 0.3;
      for (let x = 0; x < o.w; x++) { const v = o.a[y * o.w + x]; if (v >= 0 && bay(x + f, y + f * 2) < lv) g.a[y * o.w + x] = v; }
    }
    return sset(g);
  }
  /** Large creature (root colossus): procedural dithered ellipse body (4 stomp frames), cracks, angry eyes, pulsing core, leaf crown. */
  function colossusFrame(f) {
    const W = 26, H = 27, g = IG(W, H);
    const bob = (f === 1 || f === 3) ? -1 : 0, legL = f === 1 ? -2 : 0, legR = f === 3 ? -2 : 0;
    for (let y = 20; y < 25; y++) {
      for (let x = 8; x < 12; x++) g.set(x, y + legL, x === 8 ? 2 : 1);
      for (let x = 14; x < 18; x++) g.set(x, y + legR, x === 14 ? 2 : 1);
    }
    const cx = 13, cy = 12.5 + bob, rx = 8.8, ry = 8.6;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      const t = (y + 0.5 - (cy - ry)) / (2 * ry), ck = (x + y) & 1;
      let c = t < 0.4 ? 1 : t < 0.48 ? (ck ? 2 : 1) : t < 0.7 ? 2 : t < 0.78 ? (ck ? 3 : 2) : 3;
      if (dx > 0.62) c = Math.max(c === 3 ? 2 : 1, c - 1); else if (dx > 0.45 && ck) c = Math.max(1, c - 1);
      if (dx < -0.55 && t > 0.15 && t < 0.4 && ck) c = 2;
      g.set(x, y, c);
    }
    const B = (pts, c) => { for (const [x, y] of pts) g.set(x, y + bob, c); };
    B([[6, 7], [7, 8], [7, 9], [19, 6], [20, 7], [19, 8], [11, 4], [12, 5], [16, 4]], 0);
    B([[7, 8], [8, 9], [9, 9], [10, 10], [11, 10], [19, 8], [18, 9], [17, 9], [16, 10], [15, 10]], 0);
    B([[8, 10], [9, 10], [9, 11], [10, 11], [18, 10], [17, 10], [17, 11], [16, 11]], 3);
    B([[13, 13], [12, 14], [13, 14], [14, 14], [13, 15]], 3);
    B([[13, 12], [12, 13], [14, 13], [11, 14], [15, 14], [12, 15], [14, 15], [13, 16]], f & 1 ? 0 : 1);
    const sw = f === 1 ? 1 : f === 3 ? -1 : 0;
    for (let i = 0; i < 8; i++) {
      const yl = 10 + i + bob + (i > 3 ? sw : 0), yr = 10 + i + bob - (i > 3 ? sw : 0), xl = i < 3 ? 2 : 1, xr = i < 3 ? 23 : 24;
      g.set(xl, yl, 1); g.set(xl + 1, yl, i < 6 ? 2 : 1); g.set(xr, yr, 1); g.set(xr - 1, yr, 1);
    }
    g.rows(['...2......2.....2...', '..212....212...212..', '..212....212...212..', '...212...212..212...', '....21...212..12....', '.....11.11111.1.....'], 3, bob);
    return sset(outline(g));
  }
  /** Round tree: union of blobs, one light from the upper left in dithered bands, darker leaf-clump arcs. */
  function treeSprite(kind) {
    const big = kind !== 1, W = big ? 24 : 18, H = big ? 27 : 21, g = IG(W, H), cx = W / 2, canopyH = big ? 19 : 14;
    const blobs = big ? [[cx, 9.5, 9.2], [cx - 5.8, 12.4, 5.4], [cx + 5.8, 12.4, 5.4], [cx - 3.4, 5.2, 5], [cx + 3.6, 5.6, 4.8], [cx, 14, 6]]
      : [[cx, 7, 6.6], [cx - 3.9, 9.2, 4.2], [cx + 3.9, 9.2, 4.2]];
    const tw = big ? 4 : 3, tx0 = Math.round(cx - tw / 2);
    for (let y = canopyH - 4; y < H; y++) for (let x = tx0; x < tx0 + tw; x++) g.set(x, y, x === tx0 + tw - 1 ? 0 : x === tx0 ? 2 : 1);
    g.set(tx0 - 1, H - 1, 1); g.set(tx0 + tw, H - 1, 1);
    const inside = (x, y) => blobs.some(([bx, by, br]) => { const dx = (x + 0.5 - bx) / br, dy = (y + 0.5 - by) / (br * 0.92); return dx * dx + dy * dy <= 1; });
    const base = kind === 2 ? -1 : 0, Rx = W * 0.5, Ry = canopyH * 0.55;
    for (let y = 0; y < canopyH; y++) for (let x = 0; x < W; x++) {
      if (!inside(x, y)) continue;
      const L = -0.62 * (x + 0.5 - cx) / Rx - 0.78 * (y + 0.5 - canopyH * 0.5) / Ry, ck = (x + y) & 1;
      const c = L > 0.62 ? 3 : L > 0.45 ? (ck ? 3 : 2) : L > -0.28 ? 2 : L > -0.45 ? (ck ? 2 : 1) : 1;
      g.set(x, y, clamp(c + base, 0, 3));
    }
    for (let row = 0, cy = 2; cy < canopyH - 1; row++, cy += 4) for (let x2 = (row & 1) ? 3 : 1; x2 < W - 2; x2 += 5) {
      const pts = [[x2, cy], [x2 + 1, cy + 1], [x2 + 2, cy + 1], [x2 + 3, cy]];
      if (!pts.every(([x, y]) => inside(x, y) && inside(x, y - 1) && inside(x, y + 1))) continue;
      for (const [x, y] of pts) { const v = g.get(x, y); if (v > 0) g.set(x, y, v - 1); }
    }
    for (let x = 0; x < W; x++) for (let y = canopyH - 1; y > 0; y--) if (inside(x, y) && !inside(x, y + 1)) { g.set(x, y, Math.max(0, 1 + base)); break; }
    return toCanvas(outline(g));
  }
  /** Dithered ring halo in pumpkin (lit lanterns) – no alpha, just a Bayer threshold. */
  function haloSprite(r0, r1, density) {
    const S = Math.ceil(r1) * 2 + 1, c = S / 2, g = IG(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.hypot(x + 0.5 - c, (y + 0.5 - c) * 1.15);
      if (d > r0 && d < r1 && bay(x, y) < density * (1 - (d - r0) / (r1 - r0) * 0.6)) g.set(x, y, 2);
    }
    return toCanvas(g);
  }
  /** Shadow = checkerboard ellipse in rust, two phases so the checker locks to the world grid. */
  const SHADOWS = new Map();
  function drawShadow(ctx, x, y, w, h) {
    const k = w + 'x' + h; if (!SHADOWS.has(k)) SHADOWS.set(k, [0, 1].map((ph) => {
      const g = IG(w, h);
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
        const dx = (xx + 0.5 - w / 2) / (w / 2), dy = (yy + 0.5 - h / 2) / (h / 2);
        if (dx * dx + dy * dy <= 1.05 && ((xx + yy + ph) & 1) === 0) g.set(xx, yy, 1);
      }
      return toCanvas(g);
    }));
    const px = Math.round(x - w / 2), py = Math.round(y - h / 2);
    ctx.drawImage(SHADOWS.get(k)[(px + py) & 1], px, py);
  }
  /** Floating number from the 3x5 bitmap font: cream (emphasised: pumpkin) + ink outline + rust underline. */
  function numberSprite(str, crit) {
    const chars = crit ? str + '!' : str;
    let w = -1; for (const ch of chars) w += FONT[ch][0].length + 1;
    const g = IG(w, 5); let x = 0;
    for (const ch of chars) { const gl = FONT[ch]; for (let y = 0; y < 5; y++) for (let i = 0; i < gl[y].length; i++) if (gl[y][i] === '1') g.set(x + i, y, crit ? 2 : 3); x += gl[0].length + 1; }
    const o = outline(g, 0), o2 = IG(o.w, o.h + 1); o2.a.set(o.a);
    for (let xx = 1; xx < o.w - 1; xx++) if (o.get(xx, o.h - 2) >= 0 || o.get(xx, o.h - 1) >= 0) o2.set(xx, o.h, 1);
    return toCanvas(o2);
  }

  let SPR = null;
  function build() {
    SPR = {
      jack: { idle: [jackFrame('idle', 0), jackFrame('idle', 1)], walk: ['w0', 'w1', 'w2', 'w3'].map((b) => jackFrame(b)) },
      creeper: [0, 1, 2, 3].map(creeperFrame), ghost: [0, 1, 2].map(ghostFrame), colossus: [0, 1, 2, 3].map(colossusFrame),
      lantern: LANTERN.map((r) => toCanvas(outline(IG(7, 8).rows(r)))), haloS: haloSprite(3, 7, 0.45), haloP: haloSprite(5, 8.5, 0.5),
      seed: [['333', '322'], ['32', '33', '23'], ['33.', '.33'], ['.33', '33.']].map((s) => toCanvas(outline(IG(s[0].length, s.length).rows(s)))),
      gem: [['.2.', '233', '.3.'], ['.3.', '332', '.2.']].map((r) => toCanvas(outline(IG(3, 3).rows(r)))),
      gemB: [['..2..', '.233.', '23332', '23332', '22332', '.222.', '..1..'], ['..3..', '.333.', '33333', '33333', '23333', '.233.', '..2..']].map((r) => toCanvas(outline(IG(5, 7).rows(r)))),
      tree: [0, 1, 2].map(treeSprite), num: numberSprite('34', false), crit: numberSprite('120', true),
    };
    for (const k in PROPS) SPR[k] = toCanvas(outline(IG(PROPS[k][0].length, PROPS[k].length).rows(PROPS[k])));
  }

  /* ---------- ground: per-art-pixel patterns in the 3 light shades (ground never uses ink) ---------- */
  function grassPx(gx, gy, mac) { // sparse 'v' tufts on cream, staggered 6x5 cells
    const cy = Math.floor(gy / 5), sx = gx + ((cy & 1) ? 3 : 0), cx = Math.floor(sx / 6), h = hashInt(cx, cy, 77);
    if ((h & 1023) / 1024 < 0.06 + 0.5 * mac) {
      const lx = sx - cx * 6 - (h >>> 10) % 4, ly = gy - cy * 5 - (h >>> 13) % 3;
      if (((h >>> 16) & 3) < 3) { if ((ly === 0 && (lx === 0 || lx === 2)) || (ly === 1 && lx === 1)) return 2; }
      else if ((lx === 0 || lx === 2) && (ly === 0 || ly === 1) && !(lx === 2 && ly === 0)) return 2;
    }
    return 3;
  }
  const TALL = [3, 2, 3, 3, 2, 3, 2, 3, 2, 1, 2, 3, 3, 3, 3, 3];
  function tallPx(gx, gy) {
    const ry = gy >> 2, sx = gx + ((ry & 1) ? 2 : 0), v = TALL[((gy & 3) << 2) | (sx & 3)];
    return v !== 3 && (hashInt(sx >> 2, ry, 12) & 7) === 0 ? 3 : v;
  }
  function roadPx(gx, gy) { return (gy & 3) === 1 && ((gx + ((gy >> 2) & 1) * 2) & 3) === 0 && hashInt(gx, gy, 5) % 3 ? 1 : 2; }
  const furrow = (gx, gy, o) => (o === 0 ? gy : o === 1 ? gx : o === 2 ? gy + gx : gy - gx);
  function fieldPx(gx, gy, o) {
    const r = ((furrow(gx, gy, o) % 6) + 6) % 6, diag = o >= 2;
    if (r === 0 || (diag && r === 1)) return hashInt(gx >> 1, gy >> 1, 21) % 11 === 0 ? 1 : 2;
    if (r === (diag ? 2 : 1)) return (gx & 3) === 1 && hashInt(gx >> 2, gy, 22) % 3 === 0 ? 2 : 3;
    return 3;
  }
  const DEC = { flower: ['.2.', '212', '.2.'], flower2: ['2.2', '.1.', '2.2'], daisy: ['.2.2.', '2.1.2', '.2.2.'], stone: ['.22.', '2332', '.11.'],
    pumpkinS: ['..1..', '.222.', '22322', '.111.'], blades: ['2...2', '2.2.2', '.2.2.'], pebble: ['3', '1'], pebble2: ['33.', '113'],
    pumpkinF: ['...1...', '.23212.', '2322221', '2222211', '.11111.'], pumpkinF2: ['..1..', '23221', '.111.'], leafV: ['1.1', '.1.'] };

  function segDist(px, py, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
    return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
  }
  function polyIn(px, py, P) { // signed distance, > 0 inside a convex polygon
    let area = 0, m = 1e9;
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a[0] * b[1] - b[0] * a[1]; }
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], ex = b[0] - a[0], ey = b[1] - a[1];
      m = Math.min(m, (ex * (py - a[1]) - ey * (px - a[0])) / Math.hypot(ex, ey) * Math.sign(area));
    }
    return m;
  }
  /** Layout (art px): a country road, a footpath, two furrowed fields, a tall-grass blob. Bakes once per size. */
  function bakeGround(W, H) {
    const S = (fx, fy) => [fx * W, fy * H];
    const road = [S(-0.05, 0.9), S(0.42, -0.05)], path = [S(0.55, -0.05), S(0.72, 1.05)];
    const fields = [{ P: [S(0.1, 1.1), S(0.44, 0.2), S(0.6, 0.7), S(0.5, 1.1)], o: 1 }, { P: [S(-0.1, -0.1), S(0.28, -0.1), S(-0.1, 0.6)], o: 2 },
      { P: [S(0.7, 0.75), S(1.1, 0.62), S(1.1, 1.1), S(0.78, 1.1)], o: 0 }];
    const M_GRASS = 0, M_TALL = 1, M_ROAD = 2, M_FIELD = 3, mat = new Uint8Array(W * H), col = new Uint8Array(W * H), F = [];
    const info = (gx, gy) => {
      const w = (vnoise(gx / 28, gy / 28, 3) - 0.5) * 7;
      const rv = Math.min(segDist(gx, gy, road[0], road[1]) + w - 6.25, segDist(gx, gy, path[0], path[1]) + w * 0.6 - 3.5);
      let fv = -99, fo = 0;
      for (const f of fields) { const d = polyIn(gx, gy, f.P) - 6; if (d > fv) { fv = d; fo = f.o; } }
      fv = Math.min(fv, rv - 10);
      const tv = Math.min(0.55 - Math.hypot(gx / W - 0.9, (gy / H - 0.2) * H / W) * 5 + (vnoise(gx / 14, gy / 14, 9) - 0.5) * 0.9, (rv - 6) / 35, (-fv - 11) / 45);
      return { rv, fv, fo, tv, mac: vnoise(gx / 60, gy / 60, 61) };
    };
    for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) {
      const s = info(gx, gy), k = gy * W + gx;
      F[k] = s.fo;
      if (s.rv < 0 || (s.rv < 1.2 && ((gx + gy) & 1) === 0)) { mat[k] = M_ROAD; col[k] = roadPx(gx, gy); }  // dithered road fringe
      else if (s.fv > 0) { mat[k] = M_FIELD; col[k] = fieldPx(gx, gy, s.fo); }
      else if (s.tv > 0) { mat[k] = M_TALL; col[k] = tallPx(gx, gy); }
      else { mat[k] = M_GRASS; col[k] = grassPx(gx, gy, s.mac); }
    }
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { // edge pass: crisp outlined borders + dithered drop shadow
      const k = j * W + i, m = mat[k];
      if (m === M_FIELD) { if (mat[k - 1] !== m || mat[k + 1] !== m || mat[k - W] !== m || mat[k + W] !== m) col[k] = mat[k + W] !== m ? 1 : 2; }
      else if (m === M_TALL) { if (mat[k + W] !== m) col[k] = 1; else if (mat[k - W] !== m || mat[k - 1] !== m || mat[k + 1] !== m) col[k] = 2; }
      else if (m === M_GRASS && (mat[k - W] === M_FIELD || mat[k - W] === M_TALL)) col[k] = ((i + j) & 1) ? 2 : 3;
    }
    const stamp = (ex, ey, rows) => { for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
      const xx = ex + x, yy = ey + y, ch = rows[y].charCodeAt(x);
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && ch >= 48 && ch <= 51) col[yy * W + xx] = ch - 48; } };
    for (let cy = 0; cy * 17 < H; cy++) for (let cx = 0; cx * 17 < W; cx++) { // meadow + road decals, 34 world-unit cells
      const h = hashInt(cx, cy, 501), x = cx * 17 + (h & 15), y = cy * 17 + ((h >>> 4) & 15), s = info(x, y), r = ((h >>> 8) & 1023) / 1024;
      if (s.rv < 1.5) { if (s.rv < -1 && r < 0.45) stamp(x, y, r < 0.27 ? DEC.pebble : DEC.pebble2); continue; }
      if (s.fv > -5 || s.tv > -0.02 || s.rv < 4) continue;
      const d = r < 0.13 ? DEC.flower : r < 0.2 ? DEC.flower2 : r < 0.25 ? DEC.daisy : r < 0.31 ? DEC.stone : r < 0.35 ? DEC.pumpkinS : r < 0.44 ? DEC.blades : null;
      if (d) stamp(x, y, d);
    }
    for (let cy = 0; cy * 12 < H; cy++) for (let cx = 0; cx * 12 < W; cx++) { // pumpkins snapped onto the furrows
      const h = hashInt(cx, cy, 777); let gx = cx * 12 + (h & 7), gy = cy * 12 + ((h >>> 3) & 7);
      const s = info(gx, gy); if (s.fv < 4) continue;
      const r0 = ((furrow(gx, gy, s.fo) % 6) + 6) % 6; if (s.fo === 1) gx -= r0; else gy -= r0;
      const r = ((h >>> 9) & 1023) / 1024, d = r < 0.4 ? DEC.pumpkinF : r < 0.66 ? DEC.pumpkinF2 : DEC.leafV;
      stamp(gx - (d[0].length >> 1), gy - d.length + 1 + (s.fo === 1 ? 2 : 0), d);
    }
    const { c, ctx } = mk(W, H), img = ctx.createImageData(W, H), d32 = new Uint32Array(img.data.buffer);
    for (let i = 0; i < col.length; i++) d32[i] = PX32[col[i]];
    ctx.putImageData(img, 0, 0); return c;
  }

  /** Draws the main character with feet at art-pixel (x, y). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing = 1, moving = true) {
    if (!SPR) build();
    const k = Math.floor(t * 7) & 3, fr = moving ? SPR.jack.walk[k] : SPR.jack.idle[Math.floor(t * 2.2) & 1];
    blit(ctx, facing < 0 ? fr.l : fr.r, x, y + 2, 0.5, 1, moving && (k & 1) ? -1 : 0);
  }
  /** Draws a typical creature with feet at (x, y). type: creeper (small root bulb) | ghost (fast floater) | colossus (large); flash = palette-inverted flash frame. */
  function drawEnemy(ctx, x, y, t, type = 'creeper', seed = 0, flash = false, facing = -1) {
    if (!SPR) build();
    const set = SPR[type], ghost = type === 'ghost', big = type === 'colossus';
    const f = Math.floor(t * (ghost ? 6 : big ? 4 : 7) + seed * 7) % set.length, fr = set[f];
    const oy = ghost ? -3 - (Math.floor(t * 3 + seed * 6) & 1) : !big && (f & 1) ? -1 : 0;
    blit(ctx, flash ? (facing < 0 ? fr.li : fr.ri) : (facing < 0 ? fr.l : fr.r), x, y + 2, 0.5, 1, oy);
  }

  let ground = null, gKey = '', lcd = null, lKey = '';
  /** LCD overlay at display resolution: light cell gaps, dark cell edge, faint vignette, recessed bezel. */
  function buildLCD(W, H, up) {
    const { c, ctx } = mk(W, H);
    if (up >= 3) {
      ctx.fillStyle = 'rgba(250,228,180,0.2)';
      for (let x = 0; x < W; x += up) ctx.fillRect(x, 0, 1, H);
      for (let y = 0; y < H; y += up) ctx.fillRect(0, y, W, 1);
      ctx.fillStyle = 'rgba(42,23,18,0.035)';
      for (let x = up - 1; x < W; x += up) ctx.fillRect(x, 0, 1, H);
      for (let y = up - 1; y < H; y += up) ctx.fillRect(0, y, W, 1);
    }
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.58); // vignette
    g.addColorStop(0, 'rgba(42,23,18,0)'); g.addColorStop(1, 'rgba(42,23,18,0.16)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); const b = Math.max(4, up * 2);
    let lg = ctx.createLinearGradient(0, 0, 0, b); lg.addColorStop(0, 'rgba(42,23,18,0.3)'); lg.addColorStop(1, 'rgba(42,23,18,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, b);
    lg = ctx.createLinearGradient(0, 0, b, 0); lg.addColorStop(0, 'rgba(42,23,18,0.24)'); lg.addColorStop(1, 'rgba(42,23,18,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, b, H);
    return c;
  }
  /** Handheld window: cream fill, ink border, cream gap, ink outer ring (CSS: border + 2 box-shadows). */
  function win(ctx, x, y, w, h, q) {
    [[2, 0], [1, 3], [0, 0], [-1, 3]].forEach(([e, ci]) => { ctx.fillStyle = HEX[ci]; ctx.fillRect(x - e * q, y - e * q, w + 2 * e * q, h + 2 * e * q); });
  }
  function bar(ctx, x, y, w, h, q, fill, top) { // segmented fill: 3q on, 1q cream gap, lighter top stripe
    ctx.fillStyle = HEX[1]; ctx.fillRect(x, y, w * fill, h); ctx.fillStyle = HEX[top]; ctx.fillRect(x, y, w * fill, q);
    ctx.fillStyle = HEX[3]; for (let sx = x + 3 * q; sx < x + w * fill; sx += 4 * q) ctx.fillRect(sx, y, q, h);
  }
  function hud(ctx, W, H, t) {
    const q = Math.max(1, Math.round(H / 225)), font = (n) => n * q + "px 'Press Start 2P', monospace";
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    win(ctx, 6 * q, 5 * q, W - 12 * q, 7 * q, q); bar(ctx, 7 * q, 6 * q, W - 30 * q, 5 * q, q, 0.74, 2);
    ctx.fillStyle = HEX[0]; ctx.fillRect(W - 22 * q, 6 * q, 15 * q, 5 * q); ctx.fillStyle = HEX[3]; ctx.font = font(4); ctx.fillText('NO 4', W - 20 * q, 6.6 * q);
    win(ctx, 6 * q, 18 * q, 98 * q, 15 * q, q);
    ctx.fillStyle = HEX[2]; for (const [a, b, c] of [[0, 1, 2], [4, 1, 2], [0, 2, 6], [1, 4, 4], [2, 5, 2]]) ctx.fillRect((10 + a) * q, (22 + b) * q, c * q, q);
    ctx.fillStyle = HEX[0]; ctx.fillRect(19 * q, 22 * q, 52 * q, 7 * q); ctx.fillStyle = HEX[3]; ctx.fillRect(20 * q, 23 * q, 50 * q, 5 * q);
    bar(ctx, 20 * q, 23 * q, 50 * q, 5 * q, q, 1, 2);
    ctx.fillStyle = HEX[0]; ctx.font = font(4); ctx.fillText('100/100', 73 * q, 23.5 * q);
    const cx = Math.round(W / 2 - 27 * q);
    win(ctx, cx, 18 * q, 54 * q, 20 * q, q);
    const mm = String(9 + (Math.floor(t) % 50)).padStart(2, '0');
    ctx.font = font(8); ctx.fillStyle = HEX[2]; ctx.fillText('22:' + mm, cx + 8 * q, 22 * q);
    ctx.fillStyle = HEX[0]; ctx.fillText('22:' + mm, cx + 7 * q, 21 * q);
    ctx.font = font(2); ctx.fillStyle = HEX[1]; ctx.fillText('TITLE TEXT', cx + 14 * q, 32 * q);
    win(ctx, W - 38 * q, 18 * q, 32 * q, 15 * q, q); ctx.font = font(6); ctx.fillStyle = HEX[0]; ctx.fillText('88', W - 24 * q, 22.5 * q);
    ctx.fillStyle = HEX[1]; ctx.fillRect(W - 33 * q, 22 * q, 6 * q, 6 * q); ctx.fillStyle = HEX[2]; ctx.fillRect(W - 32 * q, 23 * q, 2 * q, 2 * q);
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, props, main character, creatures, effects. */
  function draw(ctx, w, h, t) {
    if (!SPR) build();
    const up = Math.max(1, Math.round(h / (360 / PS))), W = Math.ceil(w / up), H = Math.ceil(h / up);
    if (gKey !== W + 'x' + H) { ground = { buf: mk(W, H), img: bakeGround(W, H) }; gKey = W + 'x' + H; }
    const b = ground.buf.ctx;
    b.setTransform(1, 0, 0, 1, 0, 0); b.imageSmoothingEnabled = false; b.globalAlpha = 1; b.drawImage(ground.img, 0, 0);
    const hx = Math.round(W * 0.5), hy = Math.round(H * 0.58), list = [];
    const P = (fx, fy) => [Math.round(fx * W), Math.round(fy * H)];
    for (const [fx, fy, k] of [[0.8, 0.45, 0], [0.9, 0.38, 1], [0.86, 0.6, 2], [0.96, 0.52, 0], [0.75, 0.62, 1]]) {
      const [x, y] = P(fx, fy); list.push({ y, sh: [x + 1, y, k === 1 ? 14 : 20, k === 1 ? 4 : 5], fn: () => blit(b, SPR.tree[k], x, y) });
    }
    for (const [fx, fy, k] of [[0.3, 0.7, 'pumpkin'], [0.42, 0.5, 'jackolantern'], [0.62, 0.3, 'bush']]) {
      const [x, y] = P(fx, fy);
      list.push({ y, sh: [x + 1, y, 10, 3], fn: () => {
        const lit = k !== 'jackolantern' || Math.sin(t * 7) > -0.7;
        if (k === 'jackolantern' && lit) blit(b, SPR.haloP, x, y - 4, 0.5, 0.5);
        blit(b, SPR[lit ? k : 'pumpkin'], x, y);
      } });
    }
    list.push({ y: hy, sh: [hx, hy + 1, 11, 3], fn: () => drawHero(b, hx, hy, t, 1, true) });
    const foes = [['colossus', 0.66, 0.36], ['creeper', 0.58, 0.72], ['creeper', 0.34, 0.42], ['creeper', 0.12, 0.62], ['ghost', 0.39, 0.6],
      ['ghost', 0.2, 0.3], ['creeper', 0.72, 0.86], ['creeper', 0.79, 0.8], ['creeper', 0.86, 0.9], ['ghost', 0.66, 0.92], ['ghost', 0.92, 0.75], ['creeper', 0.95, 0.95], ['ghost', 0.6, 0.98]];
    foes.forEach(([type, fx, fy], i) => {
      const [x, y] = P(fx + Math.sin(t * 0.8 + i) * 0.006, fy), big = type === 'colossus';
      list.push({ y, sh: [x, y + 1, big ? 20 : type === 'ghost' ? 6 : 9, big ? 4 : 2],
        fn: () => drawEnemy(b, x, y, t, type, i * 0.37, i === 2 && (t * 3) % 1 < 0.35, x > hx ? -1 : 1) });
    });
    for (const o of list) drawShadow(b, ...o.sh);
    list.sort((a, c) => a.y - c.y).forEach((o) => o.fn());
    for (let i = 0; i < 7; i++) { // gems with a rust drop dot, 2-frame blink
      const [x, y] = P(0.44 + 0.04 * (i % 4) + 0.01 * i, 0.68 + 0.05 * (i >> 1) % 0.2), big = i === 3, blink = Math.floor(t * 3 + i * 0.7) & 1;
      dot(b, x - 1, y + 1, 1, 2, 1); blit(b, (big ? SPR.gemB : SPR.gem)[blink], x, y, 0.5, 1, -(Math.floor(t * 2 + i) & 1));
    }
    const [tx, ty] = P(0.66, 0.36);
    for (let i = 0; i < 3; i++) { // seed projectiles with a 2-dot trail (rust, pumpkin)
      const k = ((t * 1.3 + i / 3) % 1), x = hx + (tx - hx) * k, y = hy - 8 + (ty - 10 - hy + 8) * k, vx = (tx - hx) * 0.03, vy = (ty - hy) * 0.03;
      dot(b, x - vx * 2.4, y - vy * 2.4, 1); dot(b, x - vx * 1.2, y - vy * 1.2, 2);
      blit(b, SPR.seed[Math.floor(t * 12 + i) & 3], x, y, 0.5, 0.5);
    }
    for (let i = 0; i < 3; i++) { // orbiting lanterns with dithered halo, flicker
      const a = t * 2.2 + i * TAU / 3, x = hx + Math.cos(a) * 22, y = hy - 8 + Math.sin(a) * 18;
      const lit = Math.sin(t * 11 + i * 2.1) + Math.sin(t * 27 + i * 9) > -0.6, bob = Math.floor(t * 4 + i) & 1 ? 0 : -1;
      if (lit) blit(b, SPR.haloS, x, y - 3, 0.5, 0.5, bob);
      blit(b, SPR.lantern[lit ? 0 : 1], x, y, 0.5, 0.65, bob);
    }
    for (let i = 0; i < 6; i++) { // impact sparks: single art pixels in ink / cream, blink out
      const a = i * 1.7 + t * 4, r = 4 + ((t * 20 + i * 3) % 8);
      if ((Math.floor(t * 20 + i) & 1) || i < 3) dot(b, tx + Math.cos(a) * r, ty - 12 + Math.sin(a) * r * 0.7, i & 1 ? 0 : 3);
    }
    if (Math.floor(t * 20) % 4) blit(b, SPR.num, tx + 4, ty - 26 - ((t * 10) % 4), 0.5, 1);
    blit(b, SPR.crit, Math.round(W * 0.34), Math.round(H * 0.42) - 16, 0.5, 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; // nearest-neighbour upscale
    ctx.drawImage(ground.buf.c, 0, 0, W * up, H * up);
    if (lKey !== w + 'x' + h) { lcd = buildLCD(w, h, up); lKey = w + 'x' + h; }
    ctx.drawImage(lcd, 0, 0); hud(ctx, w, h, t);
  }

  const Starter = { id: 'kuerbisboy', name: 'Pumpkin Boy', palette: PALETTE, fonts: ['Press Start 2P'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['kuerbisboy'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
