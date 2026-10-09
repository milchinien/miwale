/* Kürbis-Boy – a pumpkin-tinted 4-colour handheld LCD look.
   Every pixel of the world and of the HUD uses exactly four colours. Shading only via ordered dither + pattern. */
(function () {
  'use strict';
  const U = window.U, G = window.G;

  /* ======================================================================
     Palette + low-level pixel helpers
     ====================================================================== */
  const PS = 2; // world units per art pixel
  const HEX = ['#2a1712', '#7c3a1e', '#e0812c', '#f6d7a1'];
  const RGB = HEX.map((h) => U.hex(h));
  const PX32 = RGB.map((c) => ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0);
  const INV = [3, 2, 1, 0];
  const B4 = U.bayer4;
  const bay = (x, y) => B4[((y & 3) << 2) | (x & 3)];

  /** Index grid: -1 = transparent, 0..3 palette index. */
  function IG(w, h) {
    const a = new Int8Array(w * h).fill(-1);
    return {
      w, h, a,
      set(x, y, v) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = v; },
      get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? a[y * w + x] : -1; },
      rows(rows, ox = 0, oy = 0) {
        for (let y = 0; y < rows.length; y++) {
          const r = rows[y];
          for (let x = 0; x < r.length; x++) {
            const ch = r.charCodeAt(x);
            if (ch >= 48 && ch <= 51) this.set(ox + x, oy + y, ch - 48);
            else if (ch === 120) this.set(ox + x, oy + y, -1); // 'x' erases
          }
        }
        return this;
      },
    };
  }
  /** Grid grown by 1 px with an outline (4-neighbour) in palette index `col`. */
  function outline(g, col = 0) {
    const o = IG(g.w + 2, g.h + 2);
    for (let y = 0; y < o.h; y++) {
      for (let x = 0; x < o.w; x++) {
        const v = g.get(x - 1, y - 1);
        if (v >= 0) { o.a[y * o.w + x] = v; continue; }
        if (g.get(x - 2, y - 1) >= 0 || g.get(x, y - 1) >= 0 || g.get(x - 1, y - 2) >= 0 || g.get(x - 1, y) >= 0) o.a[y * o.w + x] = col;
      }
    }
    return o;
  }
  function toCanvas(g, map) {
    const { c, ctx } = U.canvas(g.w, g.h);
    const img = ctx.createImageData(g.w, g.h);
    const d32 = new Uint32Array(img.data.buffer);
    for (let i = 0; i < g.a.length; i++) {
      let v = g.a[i];
      if (v < 0) continue;
      if (map) v = map[v];
      if (v < 0) continue;
      d32[i] = PX32[v];
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  /** Sprite set: right / left facing, normal + palette-inverted (hit flash). */
  function sset(g) {
    const r = toCanvas(g), ri = toCanvas(g, INV);
    return { r, l: U.flipX(r), ri, li: U.flipX(ri), w: g.w, h: g.h, g };
  }
  /** Copy of a grid with an ordered-dither alpha mask (level 0..1 kept). */
  function ditherMask(g, level, phase = 0) {
    const o = IG(g.w, g.h);
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const v = g.a[y * g.w + x];
      if (v >= 0 && bay(x + phase, y + phase) < level) o.a[y * g.w + x] = v;
    }
    return o;
  }
  function copyGrid(g) { const o = IG(g.w, g.h); o.a.set(g.a); return o; }
  function stampGrid(dst, src, ox, oy) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const v = src.a[y * src.w + x];
      if (v >= 0) dst.set(ox + x, oy + y, v);
    }
    return dst;
  }

  /** Draw a sprite canvas so its anchor sits at world (x, y), snapped to the art grid. */
  function blit(ctx, img, x, y, ax = 0.5, ay = 1, oy = 0, ox = 0) {
    const w = img.width, h = img.height;
    const px = Math.round(x / PS - w * ax) + ox, py = Math.round(y / PS - h * ay) + oy;
    ctx.drawImage(img, px * PS, py * PS, w * PS, h * PS);
  }
  /** One art pixel (or a w×h block) in palette colour at world pos, snapped. */
  function dot(ctx, x, y, ci, w = 1, h = 1) {
    ctx.fillStyle = HEX[ci];
    ctx.fillRect(Math.round(x / PS) * PS, Math.round(y / PS) * PS, w * PS, h * PS);
  }

  /* ======================================================================
     World layout (deterministic functions of world position)
     · a coarse warped Voronoi net: roads on its edges, plazas on some junctions
     · a finer Voronoi patchwork: pumpkin fields, clustered into farmland zones
     · noise blobs: tall grass, forests; macro noise: tuft density
     ====================================================================== */
  const RC = 1150, FC = 400;
  const WOX = 60; const WOY = -200; // world offset: puts the spawn into a nice mixed area
  const VO = { x1: 0, y1: 0, h1: 0, x2: 0, y2: 0, h2: 0, x3: 0, y3: 0, h3: 0 };
  function vor3(qx, qy, seed, o) {
    const xi = Math.floor(qx), yi = Math.floor(qy);
    let d1 = 1e9, d2 = 1e9, d3 = 1e9, x1 = 0, y1 = 0, x2 = 0, y2 = 0, x3 = 0, y3 = 0, h1 = 0, h2 = 0, h3 = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const cx = xi + i, cy = yi + j;
        const h = U.hashInt(cx, cy, seed);
        const px = cx + 0.1 + ((h & 1023) / 1023) * 0.8, py = cy + 0.1 + (((h >>> 10) & 1023) / 1023) * 0.8;
        const dx = px - qx, dy = py - qy, d = dx * dx + dy * dy;
        if (d < d1) { d3 = d2; x3 = x2; y3 = y2; h3 = h2; d2 = d1; x2 = x1; y2 = y1; h2 = h1; d1 = d; x1 = px; y1 = py; h1 = h; }
        else if (d < d2) { d3 = d2; x3 = x2; y3 = y2; h3 = h2; d2 = d; x2 = px; y2 = py; h2 = h; }
        else if (d < d3) { d3 = d; x3 = px; y3 = py; h3 = h; }
      }
    }
    o.x1 = x1; o.y1 = y1; o.h1 = h1; o.x2 = x2; o.y2 = y2; o.h2 = h2; o.x3 = x3; o.y3 = y3; o.h3 = h3;
    return o;
  }
  /** distance (cell units) from q to the bisector between site a (nearest) and b */
  function bis(qx, qy, ax, ay, bx, by) {
    const nx = bx - ax, ny = by - ay, l = Math.hypot(nx, ny) || 1;
    return (((ax + bx) / 2 - qx) * nx + ((ay + by) / 2 - qy) * ny) / l;
  }
  function roadHalf(ha, hb) {
    const lo = Math.min(ha, hb), hi = Math.max(ha, hb);
    const h = U.hashInt(lo | 0, hi | 0, 313);
    return (h & 1023) / 1024 < 0.62 ? 12.5 : 7; // country road / footpath
  }
  const WARP = 64, WL = 540;
  function warpX(wx, wy) { return wx + WARP * U.perlin(wx / WL, wy / WL, 3); }
  function warpY(wx, wy) { return wy + WARP * U.perlin(wx / WL + 7.7, wy / WL + 2.1, 4); }
  /** Fills o with: rv road value (<0 on road), fv field (>0 in field), tv tall grass (>0), pv plaza (>0),
      mac macro tuft density, fo forest density, farm zone, fh field cell hash, plaza info. */
  function fieldsAt(wx, wy, o) {
    wx += WOX; wy += WOY;
    const ux = warpX(wx, wy), uy = warpY(wx, wy);
    // --- road net
    const qx = ux / RC, qy = uy / RC;
    const V = vor3(qx, qy, 4242, VO);
    const e2 = bis(qx, qy, V.x1, V.y1, V.x2, V.y2) * RC, e3 = bis(qx, qy, V.x1, V.y1, V.x3, V.y3) * RC;
    const rv = Math.min(e2 - roadHalf(V.h1, V.h2), e3 - roadHalf(V.h1, V.h3));
    o.rv = rv;
    // --- plaza on some junctions
    o.pv = -999; o.pk = 0; o.pid = 0;
    const vh = U.hashInt((V.h1 ^ V.h2 ^ V.h3) | 0, (V.h1 + V.h2 + V.h3) | 0, 77);
    if ((vh & 1023) / 1024 < 0.62) {
      const x1 = V.x1, y1 = V.y1, x2 = V.x2, y2 = V.y2, x3 = V.x3, y3 = V.y3;
      const dd = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
      if (Math.abs(dd) > 1e-6) {
        const s1 = x1 * x1 + y1 * y1, s2 = x2 * x2 + y2 * y2, s3 = x3 * x3 + y3 * y3;
        const vx = (s1 * (y2 - y3) + s2 * (y3 - y1) + s3 * (y1 - y2)) / dd;
        const vy = (s1 * (x3 - x2) + s2 * (x1 - x3) + s3 * (x2 - x1)) / dd;
        const R = 58 + (((vh >>> 10) & 63) / 63) * 36;
        const d = Math.hypot(qx - vx, qy - vy) * RC;
        o.pv = R - d + 6 * U.perlin(wx / 34, wy / 34, 8);
        o.pk = (vh >>> 17) & 1; // 0 graveyard, 1 village square
        o.pid = vh; o.pr = R;
        o.pcx = vx * RC; o.pcy = vy * RC; // warped space
      }
    }
    // --- farmland patchwork
    const farm = U.fbm(wx / 1500, wy / 1500, 33, 2);
    o.farm = farm;
    const fx = ux / FC, fy = uy / FC;
    const W = vor3(fx, fy, 5151, VO);
    const emf = Math.min(bis(fx, fy, W.x1, W.y1, W.x2, W.y2), bis(fx, fy, W.x1, W.y1, W.x3, W.y3)) * FC;
    const pf = 0.04 + 0.86 * U.smoothstep(0.44, 0.56, farm);
    const isField = ((W.h1 >>> 20) & 1023) / 1024 < pf;
    o.fh = W.h1;
    const oh = (W.h1 >>> 8) & 15;
    o.fo4 = oh < 7 ? 0 : oh < 10 ? 1 : oh < 13 ? 2 : 3;
    let fv = (isField ? emf : -emf) - 12;
    fv = Math.min(fv, rv - 20, -o.pv - 16);
    o.fv = fv;
    // --- tall grass + forests (mostly outside the farmland)
    const wild = 1 - U.smoothstep(0.42, 0.56, farm);
    const n = U.fbm(wx / 300, wy / 300, 51, 3);
    let tv = n - (0.66 - 0.09 * wild);
    tv = Math.min(tv, (rv - 12) / 70, (-fv - 22) / 90, (-o.pv - 30) / 90);
    o.tv = tv;
    o.mac = U.perlin(wx / 520, wy / 520, 61) * 0.5 + 0.5;
    o.fo = U.fbm(wx / 300, wy / 300, 71, 2) * (0.55 + 0.45 * wild);
    return o;
  }

  /* ---------- ground pixel patterns (gx, gy = global art pixel coords) ---------- */
  const M_GRASS = 0, M_TALL = 1, M_ROAD = 2, M_FIELD = 3, M_PLAZA = 4;
  function grassPx(gx, gy, mac) {
    const cy = Math.floor(gy / 5);
    const sx = gx + ((cy & 1) ? 3 : 0);
    const cx = Math.floor(sx / 6);
    const h = U.hashInt(cx, cy, 77);
    const dens = 0.06 + 0.5 * mac;
    if ((h & 1023) / 1024 < dens) {
      const tx = (h >>> 10) % 4, ty = (h >>> 13) % 3;
      const lx = sx - cx * 6 - tx, ly = gy - cy * 5 - ty;
      const kind = (h >>> 16) & 3;
      if (kind < 3) {
        if ((ly === 0 && (lx === 0 || lx === 2)) || (ly === 1 && lx === 1)) return 2; // 'v' tuft
      } else if ((lx === 0 || lx === 2) && (ly === 0 || ly === 1) && !(lx === 2 && ly === 0)) return 2; // two blades
    }
    return 3;
  }
  // tall grass motif (4x4, rows staggered by 2)
  const TALL = [
    3, 2, 3, 3,
    2, 3, 2, 3,
    2, 1, 2, 3,
    3, 3, 3, 3,
  ];
  function tallPx(gx, gy) {
    const ry = gy >> 2;
    const sx = (gx + ((ry & 1) ? 2 : 0)) & 3;
    const v = TALL[((gy & 3) << 2) | sx];
    if (v !== 3 && (U.hashInt((gx + ((ry & 1) ? 2 : 0)) >> 2, ry, 12) & 7) === 0) return 3; // sparse gaps
    return v;
  }
  function roadPx(gx, gy) {
    const ry = gy >> 2;
    if ((gy & 3) === 1 && ((gx + (ry & 1) * 2) & 3) === 0) {
      if (U.hashInt(gx, gy, 5) % 3 !== 0) return 1;
    }
    return 2;
  }
  const FROW = 6;
  /** furrow coordinate for the field orientation (0 rows, 1 columns, 2 '/', 3 '') */
  function furrow(gx, gy, o) { return o === 0 ? gy : o === 1 ? gx : o === 2 ? gy + gx : gy - gx; }
  function fieldPx(gx, gy, o) {
    const rr = furrow(gx, gy, o);
    const r = ((rr % FROW) + FROW) % FROW;
    const diag = o >= 2;
    if (r === 0 || (diag && r === 1)) return (U.hashInt(gx >> 1, gy >> 1, 21) % 11 === 0) ? 1 : 2; // furrow + clods
    if (r === (diag ? 2 : 1)) return ((gx & 3) === 1 && U.hashInt(gx >> 2, gy, 22) % 3 === 0) ? 2 : 3; // soil crumbs
    return 3;
  }

  /* ---------- ground decals (1-bit-ish glyphs, ground never uses the darkest colour) ---------- */
  const DEC = {
    flower: ['.2.', '212', '.2.'],
    flower2: ['2.2', '.1.', '2.2'],
    daisy: ['.2.2.', '2.1.2', '.2.2.'],
    stone: ['.22.', '2332', '.11.'],
    pebble: ['3', '1'],
    pebble2: ['33.', '113'],
    pumpkinS: ['..1..', '.222.', '22322', '.111.'],
    leaf: ['1.', '.1'],
    leaf2: ['.1', '1.'],
    leaf3: ['.2.', '212'],
    blades: ['2...2', '2.2.2', '.2.2.'],
    mush: ['.111.', '13131', '..2..'],
    crack: ['1..', '.11', '...1'],
    crack2: ['..1', '11.', '1..'],
    bone: ['3...3', '.333.', '3...3'],
    pumpkinF: ['...1...', '.23212.', '2322221', '2222211', '.11111.'],
    pumpkinF2: ['..1..', '23221', '.111.'],
    leafV: ['1.1', '.1.'],
    vine: ['.1.1.', '1.1.1'],
    leafF: ['.1.1.', '12121', '.1.1.'],
    puddle: ['.2222.', '222222', '.2222.'],
  };
  function stamp(col, E, ex, ey, rows) {
    for (let y = 0; y < rows.length; y++) {
      const yy = ey + y;
      if (yy < 0 || yy >= E) continue;
      const r = rows[y];
      for (let x = 0; x < r.length; x++) {
        const xx = ex + x;
        if (xx < 0 || xx >= E) continue;
        const ch = r.charCodeAt(x);
        if (ch >= 48 && ch <= 51) col[yy * E + xx] = ch - 48;
      }
    }
  }

  /* ======================================================================
     Sprites (index grids -> auto darkest outline -> canvases; inverted copies for hit flashes)
     ====================================================================== */
  const SPR = {};

  /* ---------- Jack ---------- */
  const JACK_HEAD = [
    '....11....',
    '.22211222.',
    '2221221222',
    '2223222322',
    '2233323332',
    '2222222221',
    '2322222231',
    '2333233332',
    '.22322322.',
    '..222222..',
  ];
  const JB0 = '...113311...';
  const JACK_BODY = {
    idle: [JB0, '..21111112..', '...111111...', '...11..11...'],
    w0: [JB0, '.321111112..', '...111111...', '..11...11...'],
    w1: [JB0, '.321111112..', '...111111...', '...11.11....'],
    w2: [JB0, '.321111112..', '...111111...', '...11...11..'],
    w3: [JB0, '.321111112..', '...111111...', '....11.11...'],
    throw: ['...1133112..', '..2111111...', '...111111...', '...11..11...'],
    dash: [JB0, '3321111112..', '..1111111...', '.11.....11..'],
  };
  function jackFrame(body, headDy = 0, headDx = 0) {
    const g = IG(12, 14);
    g.rows(JACK_BODY[body], 0, 10);
    g.rows(JACK_HEAD, 1 + headDx, headDy);
    return sset(outline(outline(g), 3)); // dark outline + light LCD halo so Jack pops on every ground
  }

  /* ---------- Rüben-Schleicher (walking rutabaga) ---------- */
  const CREEP = [
    '..2..2..2.',
    '..22.2.22.',
    '...21212..',
    '..111111..',
    '.11111111.',
    '1113010311',
    '1113313311',
    '2121212121',
    '.33300332.',
    '..333322..',
  ];
  const CREEP_LEGS = [
    ['..1.32.1..', '.1......1.'],
    ['..1.32.1..', '..1....1..'],
    ['..1.32.1..', '.1......1.'],
    ['..1.321...', '..1...1...'],
  ];
  function creeperFrame(f) {
    const g = IG(10, 12);
    g.rows(CREEP, 0, 0);
    g.rows(CREEP_LEGS[f], 0, 10);
    // leaves sway
    if (f === 1) { g.set(2, 0, -1); g.set(1, 0, 2); }
    if (f === 3) { g.set(8, 0, -1); g.set(9, 0, 2); }
    return sset(outline(g));
  }

  /* ---------- Hungergeist (dithered, wispy) ---------- */
  const GHOST_BODY = [
    '...33333...',
    '..3333333..',
    '.333333333.',
    '.333003003.',
    '3333003003.',
    '33333333323',
    '3333330032.',
    '3333330032.',
    '.333333332.',
    '..3333332..',
  ];
  const GHOST_TAIL = [
    ['..33332....', '..332......', '.33........', '.3.........'],
    ['...33332...', '...3332....', '....33.....', '.....3.....'],
    ['..33332....', '.3332......', '.33........', '3..........'],
  ];
  function ghostFrame(f) {
    const solid = IG(11, 14).rows(GHOST_BODY).rows(GHOST_TAIL[f], 0, 10);
    const o = outline(solid);
    // dithered transparency: the lower body and the tail dissolve into the ground
    const g = IG(o.w, o.h);
    for (let y = 0; y < o.h; y++) {
      const lv = y < 9 ? 1 : y < 11 ? 0.75 : y < 13 ? 0.5 : 0.3;
      for (let x = 0; x < o.w; x++) {
        const v = o.a[y * o.w + x];
        if (v >= 0 && bay(x + f, y + f * 2) < lv) g.a[y * o.w + x] = v;
      }
    }
    return g;
  }

  /* ---------- Steckrüben-Koloss (procedural, 4 stomp frames) ---------- */
  function colossusFrame(f) {
    const W = 26, H = 27;
    const g = IG(W, H);
    const bob = (f === 1 || f === 3) ? -1 : 0;
    const legL = f === 1 ? -2 : 0, legR = f === 3 ? -2 : 0;
    // legs
    for (let y = 20; y < 25; y++) {
      for (let x = 8; x < 12; x++) g.set(x, y + legL, x === 8 ? 2 : 1);
      for (let x = 14; x < 18; x++) g.set(x, y + legR, x === 14 ? 2 : 1);
    }
    for (const [x, y] of [[7, 24 + legL], [12, 24 + legL], [13, 24 + legR], [18, 24 + legR]]) g.set(x, y, 1);
    // body
    const cx = 13, cy = 12.5 + bob, rx = 8.8, ry = 8.6;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        const t = (y + 0.5 - (cy - ry)) / (2 * ry);
        const ck = (x + y) & 1;
        let c = t < 0.4 ? 1 : t < 0.48 ? (ck ? 2 : 1) : t < 0.7 ? 2 : t < 0.78 ? (ck ? 3 : 2) : 3;
        if (dx > 0.62) c = Math.max(c === 3 ? 2 : 1, c - 1);           // shaded right flank
        else if (dx > 0.45 && ck) c = Math.max(1, c - 1);
        if (dx < -0.55 && t > 0.15 && t < 0.4 && ck) c = 2;             // rim light on the left
        g.set(x, y, c);
      }
    }
    // root tip
    g.set(12, Math.round(cy + ry), 3); g.set(13, Math.round(cy + ry), 2); g.set(13, Math.round(cy + ry) + 1, 2);
    const B = (x, y, c) => g.set(x, y + bob, c);
    // cracks
    for (const [x, y] of [[6, 7], [7, 8], [7, 9], [19, 6], [20, 7], [19, 8], [11, 4], [12, 5], [16, 4]]) B(x, y, 0);
    for (const [x, y] of [[9, 17], [10, 18], [17, 16], [18, 17], [17, 18]]) B(x, y, 1);
    // brow + glowing eyes (angry)
    for (const [x, y] of [[7, 8], [8, 9], [9, 9], [10, 10], [11, 10], [19, 8], [18, 9], [17, 9], [16, 10], [15, 10]]) B(x, y, 0);
    for (const [x, y] of [[8, 10], [9, 10], [9, 11], [10, 11], [18, 10], [17, 10], [17, 11], [16, 11]]) B(x, y, 3);
    // glowing core in the chest
    const pulse = f & 1;
    for (const [x, y] of [[13, 13], [12, 14], [13, 14], [14, 14], [13, 15]]) B(x, y, 3);
    for (const [x, y] of [[13, 12], [12, 13], [14, 13], [11, 14], [15, 14], [12, 15], [14, 15], [13, 16]]) B(x, y, pulse ? 0 : 1);
    if (pulse) for (const [x, y] of [[13, 11], [10, 14], [16, 14], [13, 17]]) B(x, y, 2);
    // gnarled root arms (separated from the body by a 1 px gap -> outline)
    const sw = f === 1 ? 1 : f === 3 ? -1 : 0;
    for (let i = 0; i < 8; i++) {
      const yl = 10 + i + bob + (i > 3 ? sw : 0), yr = 10 + i + bob - (i > 3 ? sw : 0);
      const xl = i < 3 ? 2 : 1, xr = i < 3 ? 23 : 24;
      g.set(xl, yl, 1); g.set(xl + 1, yl, i < 6 ? 2 : 1);
      g.set(xr, yr, 1); g.set(xr - 1, yr, 1);
    }
    for (const [x, y] of [[0, 18], [1, 19], [3, 19], [2, 18]]) g.set(x, y + bob + sw, 1);
    for (const [x, y] of [[25, 18], [24, 19], [22, 19], [23, 18]]) g.set(x, y + bob - sw, 1);
    g.set(3, 9 + bob, 1); g.set(22, 9 + bob, 1); // shoulders
    // leaf crown
    const leaves = [
      '...2......2.....2...',
      '..212....212...212..',
      '..212....212...212..',
      '...212...212..212...',
      '....21...212..12....',
      '.....11.11111.1.....',
    ];
    stampGrid(g, IG(20, 6).rows(leaves), 3, bob + (f === 2 ? 0 : 0));
    if (f === 1) { g.set(5, bob, -1); g.set(4, bob, 2); }
    if (f === 3) { g.set(19, bob, -1); g.set(20, bob, 2); }
    return sset(outline(g));
  }

  /* ---------- small things ---------- */
  function seedSprites() {
    const shapes = [['333', '322'], ['32', '33', '23'], ['33.', '.33'], ['.33', '33.']];
    return shapes.map((s) => toCanvas(outline(IG(s[0].length, s.length).rows(s))));
  }
  const LANTERN = [
    ['.1...1.', '..1.1..', '.11111.', '1131311', '2333332', '.23032.', '..222..', '...2...'],
    ['.1...1.', '..1.1..', '.11111.', '1121211', '2222222', '.22022.', '..222..', '...2...'],
  ];
  function haloSprite(r0, r1, density) {
    const S = Math.ceil(r1) * 2 + 1, c = S / 2;
    const g = IG(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.hypot(x + 0.5 - c, (y + 0.5 - c) * 1.15);
      if (d > r0 && d < r1 && bay(x, y) < density * (1 - (d - r0) / (r1 - r0) * 0.6)) g.set(x, y, 2);
    }
    return toCanvas(g);
  }
  function lanternSprites() {
    return LANTERN.map((rows) => toCanvas(outline(IG(7, 8).rows(rows))));
  }
  function gemSprites() {
    const small = [['.2.', '233', '.3.'], ['.3.', '332', '.2.']];
    const big = [['..2..', '.233.', '23332', '23332', '22332', '.222.', '..1..'], ['..3..', '.333.', '33333', '33333', '23333', '.233.', '..2..']];
    return {
      s: small.map((r) => toCanvas(outline(IG(3, 3).rows(r)))),
      b: big.map((r) => toCanvas(outline(IG(5, 7).rows(r)))),
    };
  }
  /** Pixel puff frames (spawn / death / dust). */
  function puffFrames(s) {
    const frames = [];
    const R = Math.ceil(8 * s) + 3;
    const S = R * 2 + 1, c = R;
    const sets = [
      [[0, 0, 2.7 * s]],
      [[0, 0, 2.6 * s], [-2.8 * s, 0.6 * s, 2.2 * s], [2.8 * s, 0.6 * s, 2.2 * s], [-1.2 * s, -2.2 * s, 2.1 * s], [1.6 * s, -2 * s, 2 * s]],
      [0, 1, 2, 3, 4, 5].map((i) => { const a = i / 6 * U.TAU + 0.5; return [Math.cos(a) * 4.8 * s, Math.sin(a) * 4 * s, 1.5 * s]; }),
      [0, 1, 2, 3, 4, 5, 6].map((i) => { const a = i / 7 * U.TAU + 0.2; return [Math.cos(a) * 6.4 * s, Math.sin(a) * 5.4 * s, 0.6 + 0.3 * s]; }),
    ];
    sets.forEach((blobs, f) => {
      const g = IG(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        for (const [bx, by, br] of blobs) {
          const dx = x + 0.5 - c - bx, dy = y + 0.5 - c - by;
          if (dx * dx + dy * dy <= br * br) {
            let col = f === 3 ? 2 : 3;
            if (f < 3 && dy > br * 0.35 && dx > -br * 0.3) col = 2; // shaded underside
            g.set(x, y, col);
            break;
          }
        }
      }
      frames.push(toCanvas(f < 3 ? outline(g, f === 2 ? 1 : 0) : g));
    });
    return frames;
  }
  /** Dithered shadow ellipse (two checker phases so the pattern always locks to the world grid). */
  const SHADOWS = new Map();
  function shadow(w, h) {
    const k = w + 'x' + h;
    let s = SHADOWS.get(k);
    if (s) return s;
    s = [0, 1].map((ph) => {
      const g = IG(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);
        if (dx * dx + dy * dy <= 1.05 && ((x + y + ph) & 1) === 0) g.set(x, y, 1);
      }
      return toCanvas(g);
    });
    SHADOWS.set(k, s);
    return s;
  }
  function drawShadowAt(ctx, x, y, w, h) {
    const s = shadow(w, h);
    const px = Math.round(x / PS - w / 2), py = Math.round(y / PS - h / 2);
    ctx.drawImage(s[(px + py) & 1], px * PS, py * PS, w * PS, h * PS);
  }

  /* ---------- props ---------- */
  function treeSprite(kind) {
    // kind 0: big autumn tree, 1: small autumn tree, 2: dark round tree
    const big = kind !== 1;
    const W = big ? 24 : 18, H = big ? 27 : 21;
    const g = IG(W, H);
    const cx = W / 2;
    const canopyH = big ? 19 : 14;
    const blobs = big
      ? [[cx, 9.5, 9.2], [cx - 5.8, 12.4, 5.4], [cx + 5.8, 12.4, 5.4], [cx - 3.4, 5.2, 5], [cx + 3.6, 5.6, 4.8], [cx, 14, 6]]
      : [[cx, 7, 6.6], [cx - 3.9, 9.2, 4.2], [cx + 3.9, 9.2, 4.2]];
    // trunk
    const tw = big ? 4 : 3, tx0 = Math.round(cx - tw / 2);
    for (let y = canopyH - 4; y < H; y++) for (let x = tx0; x < tx0 + tw; x++) g.set(x, y, x === tx0 + tw - 1 ? 0 : x === tx0 ? 2 : 1);
    g.set(tx0 - 1, H - 1, 1); g.set(tx0 + tw, H - 1, 1);
    // canopy mask (scalloped union of blobs) + one coherent light from the upper left
    const ccy = canopyH * 0.5, Rx = W * 0.5, Ry = canopyH * 0.55;
    const inside = (x, y) => blobs.some(([bx, by, br]) => {
      const dx = (x + 0.5 - bx) / br, dy = (y + 0.5 - by) / (br * 0.92);
      return dx * dx + dy * dy <= 1;
    });
    const base = kind === 2 ? -1 : 0;
    for (let y = 0; y < canopyH; y++) {
      for (let x = 0; x < W; x++) {
        if (!inside(x, y)) continue;
        const nx = (x + 0.5 - cx) / Rx, ny = (y + 0.5 - ccy) / Ry;
        const L = -0.62 * nx - 0.78 * ny;
        const ck = (x + y) & 1;
        let c = L > 0.62 ? 3 : L > 0.45 ? (ck ? 3 : 2) : L > -0.28 ? 2 : L > -0.45 ? (ck ? 2 : 1) : 1;
        g.set(x, y, U.clamp(c + base, 0, 3));
      }
    }
    // leaf clumps: staggered little arcs one tone darker (classic handheld tree texture)
    for (let row = 0, cy = 2; cy < canopyH - 1; row++, cy += 4) {
      for (let cx2 = (row & 1) ? 3 : 1; cx2 < W - 2; cx2 += 5) {
        const pts = [[cx2, cy], [cx2 + 1, cy + 1], [cx2 + 2, cy + 1], [cx2 + 3, cy]];
        if (!pts.every(([x, y]) => inside(x, y) && inside(x, y - 1) && inside(x, y + 1))) continue;
        for (const [x, y] of pts) { const v = g.get(x, y); if (v > 0) g.set(x, y, v - 1); }
      }
    }
    // shadow rim along the canopy bottom
    for (let x = 0; x < W; x++) for (let y = canopyH - 1; y > 0; y--) {
      if (g.get(x, y) >= 0 && y < canopyH - 0 && !inside(x, y + 1) && inside(x, y)) { g.set(x, y, Math.max(0, 1 + base)); break; }
    }
    return toCanvas(outline(g));
  }
  function deadTreeSprite() {
    const rows = [
      '....1.......1.....',
      '.....1.....1...1..',
      '..1..1....1...1...',
      '...1.11..1...1....',
      '....1.1.11..1.....',
      '.....1111..1......',
      '.11...111.1.......',
      '...1..1111........',
      '....1.111.........',
      '.....1111.........',
      '......111.........',
      '......121.........',
      '......1211........',
      '......1211........',
      '.....11211........',
      '....111.111.......',
    ];
    return toCanvas(outline(IG(18, rows.length).rows(rows)));
  }
  const PROP_ROWS = {
    grave0: ['.3333.', '333332', '313132', '331332', '333132', '313332', '333332', '222221'],
    grave1: ['..32..', '..32..', '333332', '222221', '..32..', '..32..', '..32..', '..21..'],
    grave2: ['.33332.', '3333332', '3111132', '3333332', '3111332', '3333332', '2222221'],
    fence: ['1......1......', '12222221222222', '1......1......', '12222221222222', '1......1......'],
    sign: ['3333333332.', '31131111332', '3333333332.', '2222222221.', '....11.....', '....11.....', '....11.....', '....11.....', '...1111....'],
    bush: ['...2222...', '.22333222.', '2233322221', '2232222121', '1222212211', '.11111111.'],
    rock: ['..3332..', '.333322.', '33322221', '32222111', '.111111.'],
    pumpkin: ['....1....', '...11....', '.2212122.', '222121222', '222121222', '222121221', '.2212121.'],
    jackolantern: ['....1....', '...11....', '.2212122.', '232232321', '222222221', '233333331', '.2323231.'],
    stump: ['.3332.', '322221', '111111', '1.11.1'],
    scarecrow: [
      '...1111...',
      '..111111..',
      '.11111111.',
      '...2222...',
      '...3232...',
      '...2222...',
      '1111111111',
      '2.11311..2',
      '...1131...',
      '...1111...',
      '...1111...',
      '....11....',
      '....11....',
      '....11....',
      '....11....',
      '....11....',
    ],
    lamppost: [
      '.11.......',
      '.1111111..',
      '.11....1..',
      '.11...111.',
      '.11..23332',
      '.11..23032',
      '.11..22222',
      '.11...222.',
      '.11....2..',
      '.11.......',
      '.11.......',
      '.11.......',
      '.11.......',
      '.11.......',
      '.11.......',
      '.11.......',
      '1111......',
    ],
    lamppost2: [
      '.11.......',
      '.1111111..',
      '.11....1..',
      '.11...111.',
      '.11..22222',
      '.11..22122',
      '.11..12221',
      '.11...222.',
      '.11....1..',
      '.11.......',
      '.11.......',
      '.11.......',
      '.11.......',
      '.11.......',
      '.11.......',
      '.11.......',
      '1111......',
    ],
  };

  /* ---------- damage numbers: own 3x5 bitmap font ---------- */
  const FONT = {
    0: ['111', '101', '101', '101', '111'], 1: ['110', '010', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
    3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
    6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '001', '010', '010'], 8: ['111', '101', '111', '101', '111'],
    9: ['111', '101', '111', '001', '111'], '!': ['1', '1', '1', '0', '1'],
  };
  const NUMS = new Map();
  function numberSprite(str, crit) {
    const k = str + (crit ? '!' : '');
    let s = NUMS.get(k);
    if (s) return s;
    const chars = crit ? str + '!' : str;
    let w = 0;
    for (const ch of chars) w += FONT[ch][0].length + 1;
    w -= 1;
    const g = IG(w, 5);
    let x = 0;
    for (const ch of chars) {
      const gl = FONT[ch];
      for (let y = 0; y < 5; y++) for (let i = 0; i < gl[y].length; i++) if (gl[y][i] === '1') g.set(x + i, y, crit ? 2 : 3);
      x += gl[0].length + 1;
    }
    // outline that keeps 1 px gaps between glyphs readable: full outline + darkest underline row
    const o = outline(g, 0);
    const o2 = IG(o.w, o.h + 1);
    stampGrid(o2, o, 0, 0);
    for (let xx = 1; xx < o.w - 1; xx++) if (o.get(xx, o.h - 2) >= 0 || o.get(xx, o.h - 1) >= 0) o2.set(xx, o.h, crit ? 1 : 1);
    s = toCanvas(o2);
    if (NUMS.size > 400) NUMS.clear();
    NUMS.set(k, s);
    return s;
  }
  /* ---------- HUD icons (16x16, 4 colours) ---------- */
  const ICONS = {
    'hp-heart': [
      '..............',
      '..222....222..',
      '.23322..22222.',
      '23332222222222',
      '23322222222221',
      '23222222222221',
      '22222222222221',
      '.222222222221.',
      '..2222222221..',
      '...22222221...',
      '....222221....',
      '.....2221.....',
      '......21......',
    ],
    kills: [
      '.....2...2....',
      '....212.212...',
      '.....2121.....',
      '.....1111.....',
      '...11111111...',
      '..1111111111..',
      '.110101101011.',
      '.111011110111.',
      '.110101101011.',
      '.212121212121.',
      '..2323232323..',
      '...33333333...',
      '.....3333.....',
      '......33......',
    ],
    dmg: [
      '..........1...',
      '.......1..1.1.',
      '......22...1..',
      '.....2332.1.1.',
      '....233332....',
      '...23333332...',
      '...23333332...',
      '..233333322...',
      '..233333222...',
      '..23333222....',
      '...233221.....',
      '...22221......',
      '....221.......',
      '..............',
    ],
    rate: [
      '....3.3.3.....',
      '....3.3.3.3...',
      '....3.3.3.3...',
      '.3..3333333...',
      '.33.3333333...',
      '..333333332...',
      '...33333332...',
      '...3333332....',
      '....333322....',
      '....111111....',
      '....111111....',
      '..............',
      '.1.1.1........',
      '..............',
    ],
    multi: [
      '.....1..1.....',
      '......11......',
      '.....1331.....',
      '....222222....',
      '...22222222...',
      '..2222122222..',
      '..2221312222..',
      '.222211122222.',
      '.222222222221.',
      '.222222222221.',
      '.222222222211.',
      '..2222222211..',
      '...11111111...',
      '..............',
    ],
    bounce: [
      '..............',
      '....1.1.......',
      '..1.....1.....',
      '.1.......1....',
      '..........1...',
      '1..........33.',
      '..........3332',
      '1.........3322',
      '...........22.',
      '1.............',
      '..............',
      '22222222222222',
      '11111111111111',
      '..............',
    ],
    lantern: [
      '....1....1....',
      '.....1..1.....',
      '......11......',
      '....111111....',
      '..1111111111..',
      '..1131111311..',
      '.111333333111.',
      '.122222222221.',
      '.223323323322.',
      '..2333333332..',
      '...22222222...',
      '.....2222.....',
      '......22......',
      '..............',
    ],
    speed: [
      '..........3...',
      '.........333..',
      '..........3...',
      '..............',
      '.........22...',
      '........2332..',
      '.......23332..',
      '..2222233332..',
      '.233333333332.',
      '23333333333322',
      '.222222222.112',
      '..........1..1',
      '..........1...',
      '..............',
    ],
    magnet: [
      '....111111....',
      '...1......1...',
      '..1........1..',
      '..1..3..2..1..',
      '..1.323.22.1..',
      '.222222222222.',
      '.212121212121.',
      '.122222222221.',
      '..1212121212..',
      '..2222222222..',
      '..1212121212..',
      '...22222222...',
      '...11111111...',
      '..............',
    ],
    hp: [
      '....3...3.....',
      '.....3...3....',
      '....3...3.....',
      '..............',
      '.1..........1.',
      '.111111111111.',
      '..2333223332..',
      '..1222222221..',
      '..1111111111..',
      '..1111111111..',
      '..1111111111..',
      '...11111111...',
      '...1......1...',
      '..............',
    ],
  };
  const ICON_GRIDS = {};

  /* ======================================================================
     Display overlay (LCD pixel gaps, recessed bezel, faint vignette) – rebuilt on resize
     ====================================================================== */
  let lcd = null, lcdKey = '';
  function buildLCD(W, H, up) {
    const { c, ctx } = U.canvas(W, H);
    if (up >= 3) {
      // the gaps between LCD cells show the lighter backplane: visible on dark pixels, invisible on light ones
      ctx.fillStyle = 'rgba(250,228,180,0.2)';
      for (let x = 0; x < W; x += up) ctx.fillRect(x, 0, 1, H);
      for (let y = 0; y < H; y += up) ctx.fillRect(0, y, W, 1);
      ctx.fillStyle = 'rgba(42,23,18,0.035)';
      for (let x = up - 1; x < W; x += up) ctx.fillRect(x, 0, 1, H);
      for (let y = up - 1; y < H; y += up) ctx.fillRect(0, y, W, 1);
    }
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.58);
    g.addColorStop(0, 'rgba(42,23,18,0)');
    g.addColorStop(1, 'rgba(42,23,18,0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const b = Math.max(4, up * 2);
    let lg = ctx.createLinearGradient(0, 0, 0, b);
    lg.addColorStop(0, 'rgba(42,23,18,0.3)'); lg.addColorStop(1, 'rgba(42,23,18,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, b);
    lg = ctx.createLinearGradient(0, 0, b, 0);
    lg.addColorStop(0, 'rgba(42,23,18,0.24)'); lg.addColorStop(1, 'rgba(42,23,18,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, b, H);
    return c;
  }

  /* ======================================================================
     Particles helpers
     ====================================================================== */
  function px(game, x, y, ci, o) {
    return game.addParticle(Object.assign({ x, y, kind: 'px', ci, color: HEX[ci], size: 1, life: 0.4, drag: 3 }, o || {}));
  }
  function colorIndex(c) {
    if (typeof c !== 'string') return 3;
    const i = HEX.indexOf(c);
    if (i >= 0) return i;
    try { return RGB.indexOf(U.nearest(U.hex(c), RGB)); } catch (e) { return 3; }
  }

  /* ======================================================================
     HUD (Game-Boy windows, Press Start 2P, segmented bars – same 4 colours)
     ====================================================================== */
  const C0 = HEX[0], C1 = HEX[1], C2 = HEX[2], C3 = HEX[3];
  const svgPx = (rows, col) => {
    let r = '';
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '1') r += `<rect x='${x}' y='${y}' width='1' height='1'/>`; });
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${rows[0].length} ${rows.length}' shape-rendering='crispEdges' fill='${col}'>${r}</svg>`)}")`;
  };
  const CURSOR = svgPx(['1...', '11..', '111.', '1111', '111.', '11..', '1...'], C0);
  const B = 'body.style-kuerbisboy';
  const WIN = `background:${C3};border:4px solid ${C0};border-radius:0;box-shadow:0 0 0 4px ${C3},0 0 0 8px ${C0};`;
  const CSS = `
${B}{font-family:'Press Start 2P',monospace;}
${B} #hud{padding:20px 24px;color:${C0};}
${B} #hud .xp{height:28px;${WIN}overflow:hidden;}
${B} #hud .xp-fill{background:repeating-linear-gradient(90deg,transparent 0 12px,${C3} 12px 16px),linear-gradient(${C3} 0 4px,${C2} 4px 16px,${C1} 16px);transition:none;}
${B} #hud .lvl{right:0;top:0;bottom:0;transform:none;padding:0 10px 0 12px;background:${C0};color:${C3};font-size:16px;font-weight:400;line-height:20px;text-shadow:none;text-transform:uppercase;}
${B} #hud .topline{margin-top:24px;align-items:flex-start;}
${B} #hud .hp{${WIN}padding:8px 12px 8px 8px;gap:10px;}
${B} #hud .hp-icon,${B} #hud .kills-icon{width:32px;height:32px;image-rendering:pixelated;}
${B} #hud .hp-bar{width:208px;height:24px;background:${C3};border:4px solid ${C0};border-radius:0;}
${B} #hud .hp-fill{background:repeating-linear-gradient(90deg,transparent 0 8px,${C3} 8px 12px),linear-gradient(${C2} 0 4px,${C1} 4px);transition:none;}
${B} #hud .hp-text{font-size:16px;font-weight:400;text-shadow:none;color:${C0};min-width:112px;}
${B}.hurt #hud .hp{background:${C0};box-shadow:0 0 0 4px ${C3},0 0 0 8px ${C0};}
${B}.hurt #hud .hp-text{color:${C3};}
${B}.hurt #hud .hp-bar{filter:none;border-color:${C3};background:${C0};}
${B} #hud .clock{${WIN}padding:10px 18px 8px;}
${B} #hud .clock-time{font-size:32px;font-weight:400;letter-spacing:0;text-shadow:4px 4px 0 ${C2};color:${C0};line-height:36px;}
${B} #hud .clock-label{font-size:8px;letter-spacing:1px;opacity:1;color:${C1};margin-top:8px;text-transform:uppercase;}
${B} #hud .kills{${WIN}padding:8px 14px 8px 8px;gap:10px;font-size:24px;font-weight:400;text-shadow:none;min-width:0;line-height:24px;}
${B} #stylebar{${WIN}font-family:'Press Start 2P',monospace;color:${C0};padding:10px 16px;gap:16px;bottom:16px;}
${B} #stylebar .style-family{font-size:8px;opacity:1;color:${C1};letter-spacing:0;}
${B} #stylebar .style-name{font-size:16px;font-weight:400;}
${B} #stylebar .style-hint{font-size:8px;opacity:1;color:${C1};}
${B} #stylebar .auto.on{color:${C3};background:${C0};padding:2px 4px;}
${B} #stylemenu{font-family:'Press Start 2P',monospace;${WIN}grid-template-columns:repeat(2,300px);}
${B} #stylemenu .sm-item{background:${C3};color:${C0};border:4px solid transparent;border-radius:0;font-size:8px;}
${B} #stylemenu .sm-item:hover{border-color:${C2};}
${B} #stylemenu .sm-item.active{border-color:${C0};}
${B} #stylemenu .sm-name{font-size:8px;font-weight:400;line-height:2;}
${B} #stylemenu .sm-fam{font-size:8px;opacity:1;color:${C1};}
${B} #levelup,${B} #gameover{background:repeating-conic-gradient(${C0} 0 25%,transparent 0 50%) 0 0/10px 10px;gap:34px;}
${B} #levelup .lu-title,${B} #gameover .go-title{${WIN}font-size:32px;font-weight:400;letter-spacing:0;text-shadow:4px 4px 0 ${C2};padding:18px 28px 14px;color:${C0};}
${B} #levelup .lu-cards{gap:40px;}
${B} #levelup .card{width:272px;min-height:320px;${WIN}padding:30px 20px 20px 34px;gap:16px;color:${C0};transition:none;align-items:flex-start;text-align:left;}
${B} #levelup .card:hover{transform:none;background:${C3};}
${B} #levelup .card::before{content:'';position:absolute;left:10px;top:146px;width:16px;height:28px;background:${CURSOR} 0 0/100% 100% no-repeat;opacity:0;}
${B} #levelup .card:hover::before,${B} #levelup .lu-cards:not(:hover) .card:first-child::before{opacity:1;animation:kbBlink 1s steps(1) infinite;}
${B} #levelup .card-icon{width:96px;height:96px;align-self:center;image-rendering:pixelated;margin-bottom:6px;}
${B} #levelup .card-name{font-size:16px;font-weight:400;line-height:24px;}
${B} #levelup .card-desc{font-size:16px;line-height:24px;opacity:1;color:${C1};}
${B} #levelup .card-key{top:8px;left:8px;font-size:16px;opacity:1;font-weight:400;background:${C0};color:${C3};padding:6px 8px 4px;}
${B} #levelup .lu-hint,${B} #gameover .go-hint{${WIN}font-size:16px;opacity:1;padding:10px 16px 8px;color:${C0};}
${B} #gameover .go-stats{${WIN}font-size:16px;line-height:28px;opacity:1;padding:12px 18px 8px;max-width:900px;text-align:center;}
${B} #pausebox{${WIN}font-size:32px;font-weight:400;color:${C0};text-shadow:4px 4px 0 ${C2};padding:18px 28px 14px;}
@keyframes kbBlink{0%{opacity:1}60%{opacity:0}}
`;

  /* ======================================================================
     Style
     ====================================================================== */
  const F1 = {}, F2 = {};
  Styles.register({
    id: 'kuerbisboy',
    name: 'Kürbis-Boy',
    family: 'Pixel Art · 4 Farben',
    description: 'Ein Handheld-Abenteuer auf kürbisgetöntem LCD: genau vier Farben, Raster-Dithering und knackige Mini-Sprites.',
    pixelArt: { scale: PS },
    groundColor: HEX[3],
    chunkSize: 256,
    fonts: ['Press+Start+2P'],
    css: CSS,

    init() {
      SPR.jack = {
        idle: [jackFrame('idle', 0), jackFrame('idle', 1)],
        walk: [jackFrame('w0'), jackFrame('w1'), jackFrame('w2'), jackFrame('w3')],
        throw: jackFrame('throw'),
        dash: jackFrame('dash', 1, 1),
      };
      SPR.jackGhost = [0, 1].map((ph) => {
        const g = SPR.jack.dash.g;
        const o = IG(g.w, g.h);
        for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.a[y * g.w + x] >= 0 && ((x + y + ph) & 1) === 0) o.set(x, y, 2);
        const c = toCanvas(o);
        return { r: c, l: U.flipX(c) };
      });
      SPR.creeper = [0, 1, 2, 3].map(creeperFrame);
      SPR.ghost = [0, 1, 2].map((f) => {
        const g = ghostFrame(f);
        const full = sset(g);
        full.fade = [0.25, 0.5, 0.75].map((lv) => sset(ditherMask(g, lv)));
        return full;
      });
      SPR.colossus = [0, 1, 2, 3].map(colossusFrame);
      SPR.seed = seedSprites();
      SPR.lantern = lanternSprites();
      SPR.gem = gemSprites();
      SPR.puff = puffFrames(1);
      SPR.puffS = puffFrames(0.6);
      SPR.puffL = puffFrames(1.7);
      SPR.halo = haloSprite(4, 8, 0.62);
      SPR.haloP = haloSprite(5, 8.5, 0.5);
      SPR.haloS = haloSprite(3, 7, 0.45);
      SPR.props = { tree0: treeSprite(0), tree1: treeSprite(1), tree2: treeSprite(2), dead: deadTreeSprite() };
      for (const k in PROP_ROWS) {
        const rows = PROP_ROWS[k];
        const g = IG(Math.max(...rows.map((r) => r.length)), rows.length).rows(rows);
        SPR.props[k] = toCanvas(k === 'fence' ? g : outline(g));
      }
      SPR.star = [['.3.', '333', '.3.'], ['3.3', '.3.', '3.3']].map((r) => toCanvas(outline(IG(3, 3).rows(r))));
      SPR.spark = toCanvas(IG(1, 1).rows(['3']));
      for (const k in ICONS) {
        const rows = ICONS[k];
        ICON_GRIDS[k] = outline(IG(14, 14).rows(rows, 0, Math.floor((14 - rows.length) / 2)));
      }
    },

    /* ---------------- ground ---------------- */
    *renderGroundChunk(ctx, info) {
      const N = info.px;            // 128 art px per chunk
      const M = 2;                  // margin for neighbour tests
      const E = N + 2 * M;
      const gx0 = Math.round(info.wx / PS), gy0 = Math.round(info.wy / PS);
      // coarse field grid, anchored to global multiples of 4 art px -> identical across chunk borders
      const GS = 4, GO = 8;
      const gw = Math.ceil((N + GO * 2) / GS) + 1;
      const CH = 6;
      const grid = new Float32Array(gw * gw * CH);
      const f = F1;
      for (let j = 0; j < gw; j++) {
        if ((j & 3) === 3) yield;
        for (let i = 0; i < gw; i++) {
          fieldsAt((gx0 - GO + i * GS + 0.5) * PS, (gy0 - GO + j * GS + 0.5) * PS, f);
          const o = (j * gw + i) * CH;
          grid[o] = f.rv; grid[o + 1] = f.fv; grid[o + 2] = f.tv; grid[o + 3] = f.pv; grid[o + 4] = f.mac; grid[o + 5] = f.fo4;
        }
      }
      const val = new Float32Array(CH);
      const sample = (lx, ly) => {
        let u = (lx + GO) / GS, v = (ly + GO) / GS;
        u = U.clamp(u, 0, gw - 1.001); v = U.clamp(v, 0, gw - 1.001);
        const i0 = u | 0, j0 = v | 0, fx = u - i0, fy = v - j0;
        const o00 = (j0 * gw + i0) * CH, o10 = o00 + CH, o01 = o00 + gw * CH, o11 = o01 + CH;
        for (let k = 0; k < CH; k++) {
          const a = grid[o00 + k] + (grid[o10 + k] - grid[o00 + k]) * fx;
          const b = grid[o01 + k] + (grid[o11 + k] - grid[o01 + k]) * fx;
          val[k] = a + (b - a) * fy;
        }
        return val;
      };
      const mat = new Uint8Array(E * E);
      const col = new Uint8Array(E * E);
      const wo = {};
      const SX = 6.5, SY = 4.6; // flagstone size (art px)
      for (let j = 0; j < E; j++) {
        if ((j & 15) === 15) yield;
        const ly = j - M, gy = gy0 + ly;
        for (let i = 0; i < E; i++) {
          const lx = i - M, gx = gx0 + lx;
          const s = sample(lx + 0.5, ly + 0.5);
          const rv = s[0], fv = s[1], tv = s[2], pv = s[3], mac = s[4];
          let m = -1, c = 3;
          if (pv > -16) {
            U.worley(gx / SX, gy / SY, 909, 0, wo);
            const pc = sample(wo.x * SX - gx0, wo.y * SY - gy0)[3];
            if (pc > (((wo.id >>> 8) & 255) / 255 - 0.3) * 24) {
              m = M_PLAZA;
              const e = wo.f2 - wo.f1;
              if (e < 0.13) c = 2;
              else if (e < 0.32 && gy / SY > wo.y + 0.1) c = 2;
              else c = 3;
            }
          }
          if (m < 0) {
            if (rv < 0 || (rv < 2.4 && ((gx + gy) & 1) === 0)) { m = M_ROAD; c = roadPx(gx, gy); }
            else if (fv > 0) {
              m = M_FIELD;
              const gi = Math.round(U.clamp((lx + 0.5 + GO) / GS, 0, gw - 1)), gj = Math.round(U.clamp((ly + 0.5 + GO) / GS, 0, gw - 1));
              c = fieldPx(gx, gy, grid[(gj * gw + gi) * CH + 5]);
            }
            else if (tv > 0) { m = M_TALL; c = tallPx(gx, gy); }
            else { m = M_GRASS; c = grassPx(gx, gy, mac); }
          }
          const k = j * E + i;
          mat[k] = m; col[k] = c;
        }
      }
      yield;
      // edge pass: crisp outlined edges
      for (let j = 1; j < E - 1; j++) {
        for (let i = 1; i < E - 1; i++) {
          const k = j * E + i, m = mat[k];
          if (m === M_FIELD) {
            if (mat[k - 1] !== M_FIELD || mat[k + 1] !== M_FIELD || mat[k - E] !== M_FIELD || mat[k + E] !== M_FIELD) col[k] = mat[k + E] !== M_FIELD ? 1 : 2;
          } else if (m === M_TALL) {
            if (mat[k + E] !== M_TALL) col[k] = 1;
            else if (mat[k - E] !== M_TALL || mat[k - 1] !== M_TALL || mat[k + 1] !== M_TALL) col[k] = 2;
          } else if (m === M_GRASS) {
            if (mat[k - E] === M_FIELD || mat[k - E] === M_TALL) col[k] = ((i + j) & 1) ? 2 : 3; // dithered drop shadow
          }
        }
      }
      yield;
      // decals
      const ox = gx0 - M, oy = gy0 - M;
      const put = (x, y, rows) => stamp(col, E, Math.floor(x / PS) - ox, Math.floor(y / PS) - oy, rows);
      const ff = F2;
      G.scatter(info, 34, 501, 12, (x, y, rng) => {
        fieldsAt(x, y, ff);
        if (ff.pv > -6) {
          if (ff.pv > 4 && ff.pk === 0 && rng.chance(0.12)) put(x, y, DEC.bone);
          else if (ff.pv > 4 && rng.chance(0.25)) put(x, y, rng.chance(0.5) ? DEC.crack : DEC.crack2);
          return;
        }
        if (ff.rv < 3) { if (ff.rv < -2 && rng.chance(0.45)) put(x, y, rng.chance(0.6) ? DEC.pebble : DEC.pebble2); return; }
        if (ff.fv > -10 || ff.tv > -0.02 || ff.rv < 8) return;
        const r = rng.next();
        if (ff.fo > 0.56) {
          if (r < 0.75) put(x, y, rng.pick([DEC.leaf, DEC.leaf2, DEC.leaf3]));
          else if (r < 0.88) put(x, y, DEC.mush);
          return;
        }
        if (r < 0.13) put(x, y, DEC.flower);
        else if (r < 0.2) put(x, y, DEC.flower2);
        else if (r < 0.25) put(x, y, DEC.daisy);
        else if (r < 0.31) put(x, y, DEC.stone);
        else if (r < 0.35) put(x, y, DEC.pumpkinS);
        else if (r < 0.44) put(x, y, DEC.blades);
      });
      yield;
      // pumpkins + leaves sitting on the furrows
      G.scatter(info, 24, 777, 10, (x, y, rng) => {
        fieldsAt(x, y, ff);
        if (ff.fv < 8) return;
        const o4 = ff.fo4;
        let gx = Math.floor(x / PS), gy = Math.floor(y / PS);
        const r0 = ((furrow(gx, gy, o4) % FROW) + FROW) % FROW;
        if (o4 === 1) gx -= r0; else gy -= r0;           // snap onto the furrow
        const r = rng.next();
        const dec = r < 0.4 ? DEC.pumpkinF : r < 0.66 ? DEC.pumpkinF2 : DEC.leafV;
        const w = dec[0].length, h = dec.length;
        stamp(col, E, gx - ox - (w >> 1), gy - oy - h + 1 + (o4 === 1 ? 2 : 0), dec);
      });
      yield;
      const img = ctx.createImageData(N, N);
      const d32 = new Uint32Array(img.data.buffer);
      for (let j = 0; j < N; j++) {
        const so = (j + M) * E + M, dof = j * N;
        for (let i = 0; i < N; i++) d32[dof + i] = PX32[col[so + i]];
      }
      ctx.putImageData(img, 0, 0);
    },

    /* ---------------- props ---------------- */
    propsForChunk(info) {
      const props = [];
      const f = {};
      const ok = (x, y, r = 90) => !G.nearSpawn(x, y, r);
      // trees: clusters in forest noise, a few lonely ones elsewhere
      G.scatterOwned(info, 34, 1001, (x, y, rng) => {
        if (!ok(x, y)) return;
        fieldsAt(x, y, f);
        if (f.fv > -18 || f.rv < 18 || f.pv > -26 || f.tv > 0.02) return;
        const dense = f.fo > 0.58;
        if (!rng.chance(dense ? 0.62 : 0.025)) return;
        const r = rng.next();
        const t = r < 0.42 ? 'tree0' : r < 0.74 ? 'tree1' : r < 0.94 ? 'tree2' : 'dead';
        props.push({ x, y, t, pad: 70 });
      });
      // dead trees in tall grass, bushes / rocks / stumps in meadows
      G.scatterOwned(info, 80, 1002, (x, y, rng) => {
        if (!ok(x, y)) return;
        fieldsAt(x, y, f);
        if (f.fv > -12 || f.rv < 12 || f.pv > -14) return;
        const r = rng.next();
        if (f.tv > 0.05) { if (r < 0.12) props.push({ x, y, t: 'dead', pad: 60 }); return; }
        if (r < 0.12) props.push({ x, y, t: 'bush' });
        else if (r < 0.18) props.push({ x, y, t: 'rock' });
        else if (r < 0.21) props.push({ x, y, t: 'stump' });
      });
      // fields: big pumpkins + scarecrows
      G.scatterOwned(info, 64, 1003, (x, y, rng) => {
        if (!ok(x, y, 70)) return;
        fieldsAt(x, y, f);
        if (f.fv < 10) return;
        if (rng.chance(0.16)) props.push({ x, y, t: rng.chance(0.3) ? 'jackolantern' : 'pumpkin', ph: rng.next() * 10 });
      });
      G.scatterOwned(info, 230, 1004, (x, y, rng) => {
        if (!ok(x, y)) return;
        fieldsAt(x, y, f);
        if (f.fv < 30) return;
        if (rng.chance(0.6)) props.push({ x, y, t: 'scarecrow', pad: 60 });
      });
      // fences along the upper / lower borders of fields
      const FCE = 28;
      for (let cy = Math.floor(info.wy / FCE); cy < Math.floor((info.wy + info.size) / FCE); cy++) {
        for (let cx = Math.floor(info.wx / FCE); cx < Math.floor((info.wx + info.size) / FCE); cx++) {
          const x = (cx + 0.5) * FCE, y0 = cy * FCE, y1 = y0 + FCE;
          if (!ok(x, y0)) continue;
          const a = fieldsAt(x, y0, f).fv, fa = f.fh;
          const b = fieldsAt(x, y1, f).fv, fb = f.fh;
          const T = -5;
          if (!(a < T && b >= T)) continue;                     // upper border only
          if (((fb >>> 4) & 3) < 2 || f.fo4 !== 0) continue;      // half of the fields stay unfenced
          if (U.hash2(cx, cy, 9) < 0.08) continue;               // gaps
          const yA = y0 + (T - a) / (b - a) * FCE;
          const c1 = fieldsAt(x + FCE, yA, f).fv, c2 = fieldsAt(x - FCE, yA, f).fv;
          if (Math.abs(c1 - T) > 9 || Math.abs(c2 - T) > 9) continue; // edge too steep -> no staircase
          props.push({ x, y: yA - 1, t: 'fence', pad: 40 });
        }
      }
      // graveyards + village squares on plazas
      G.scatterOwned(info, 24, 1005, (x, y, rng, cx, cy) => {
        const gx = (cx + 0.5) * 24 + ((cy & 1) ? 6 : -6), gy = (cy + 0.5) * 24;
        if (!ok(gx, gy, 80)) return;
        fieldsAt(gx, gy, f);
        if (f.pv < 14) return;
        if (f.pk === 0) {
          if (f.pv < f.pr - 14 && rng.chance(0.6)) props.push({ x: gx, y: gy, t: rng.pick(['grave0', 'grave0', 'grave1', 'grave2']) });
        } else if (f.pv < 24 && rng.chance(0.3)) props.push({ x: gx, y: gy, t: 'lamppost', ph: rng.next() * 10, pad: 40 });
      });
      // plaza centre pieces (owned by the chunk that contains the centre)
      const seen = new Set();
      for (let sy = 0; sy <= 4; sy++) {
        for (let sx = 0; sx <= 4; sx++) {
          fieldsAt(info.wx + sx * 64, info.wy + sy * 64, f);
          if (f.pv < -60 || seen.has(f.pid)) continue;
          seen.add(f.pid);
          let wx = f.pcx, wy = f.pcy;
          for (let it = 0; it < 4; it++) { const nx = f.pcx - (warpX(wx, wy) - wx), ny = f.pcy - (warpY(wx, wy) - wy); wx = nx; wy = ny; }
          if (wx < info.wx || wx >= info.wx + info.size || wy < info.wy || wy >= info.wy + info.size) continue;
          if (!ok(wx, wy, 80)) continue;
          if (f.pk === 1) props.push({ x: wx, y: wy, t: 'sign', pad: 40 });
          else props.push({ x: wx, y: wy, t: 'dead', pad: 60 });
        }
      }
      // roadside lantern posts + signs
      G.scatterOwned(info, 160, 1006, (x, y, rng) => {
        if (!ok(x, y)) return;
        fieldsAt(x, y, f);
        if (f.rv < 3 || f.rv > 9 || f.pv > -20 || f.fv > -6 || f.tv > 0) return;
        if (rng.chance(0.42)) props.push({ x, y, t: rng.chance(0.65) ? 'lamppost' : 'sign', ph: rng.next() * 10, pad: 40 });
      });
      return props;
    },
    drawProp(ctx, p, view) {
      const S = SPR.props;
      let img = S[p.t];
      if (p.t === 'lamppost') {
        const lit = Math.sin(view.rt * 9 + p.ph) + Math.sin(view.rt * 23 + p.ph * 3) > -0.5;
        if (lit) blit(ctx, SPR.halo, p.x + 3, p.y - 24, 0.5, 0.5);
        img = lit ? S.lamppost : S.lamppost2;
      } else if (p.t === 'jackolantern') {
        const lit = Math.sin(view.rt * 7 + p.ph) > -0.7;
        if (lit) blit(ctx, SPR.haloP, p.x, p.y - 9, 0.5, 0.5);
        img = lit ? S.jackolantern : S.pumpkin;
      }
      if (img) blit(ctx, img, p.x, p.y, 0.5, 1);
    },
    drawShadow(ctx, o) {
      if (o.kind === 'prop') {
        const t = o.t;
        if (t === 'tree0' || t === 'tree2') drawShadowAt(ctx, o.x + 2, o.y, 20, 5);
        else if (t === 'tree1') drawShadowAt(ctx, o.x + 2, o.y, 14, 4);
        else if (t === 'dead') drawShadowAt(ctx, o.x + 2, o.y, 12, 3);
        else if (t === 'fence') return;
        else if (t === 'scarecrow') drawShadowAt(ctx, o.x + 2, o.y, 10, 3);
        else if (t === 'lamppost' || t === 'sign') drawShadowAt(ctx, o.x, o.y, 8, 3);
        else drawShadowAt(ctx, o.x + 1, o.y, 10, 3);
        return;
      }
      if (o.kind === 'enemy') {
        if (o.dying && o.deathT > 0.22) return;
        const k = o.spawnT < 1 ? Math.min(1, o.spawnT * 1.5) : 1;
        if (o.type === 'ghost') drawShadowAt(ctx, o.x, o.y + 1, Math.max(3, Math.round(6 * k)), 2);
        else if (o.type === 'colossus') drawShadowAt(ctx, o.x, o.y + 1, Math.max(4, Math.round(20 * k)), 4);
        else drawShadowAt(ctx, o.x, o.y + 1, Math.max(3, Math.round(9 * k)), 2);
        return;
      }
      if (o.kind === 'player') drawShadowAt(ctx, o.x, o.y + 1, 11, 3);
    },

    /* ---------------- entities ---------------- */
    drawPlayer(ctx, p, view) {
      const J = SPR.jack;
      const left = p.facing < 0;
      if (p.dashT > 0) {
        for (let i = 2; i >= 1; i--) {
          const gi = SPR.jackGhost[i & 1];
          blit(ctx, left ? gi.l : gi.r, p.x - p.dashX * i * 9, p.y - p.dashY * i * 9 + PS, 0.5, 1, 1);
        }
      }
      // invulnerability flicker (classic handheld blink)
      if (p.iframes > 0 && p.dashT <= 0 && p.hurtT < 0.6 && Math.floor(view.rt * 15) % 2 === 0) return;
      let fr, oy = 0;
      if (p.dashT > 0) fr = J.dash;
      else if (p.shootT > 0.55) fr = J.throw;
      else if (p.moving) { const k = Math.floor(p.anim * 0.9) & 3; fr = J.walk[k]; oy = (k & 1) ? -1 : 0; }
      else fr = J.idle[Math.floor(view.rt * 2.2) & 1];
      const inv = p.hurtT > 0.6;
      blit(ctx, inv ? (left ? fr.li : fr.ri) : (left ? fr.l : fr.r), p.x, p.y + PS, 0.5, 1, oy + 1);
      if (p.levelT > 0) {
        const n = 6, rr = 12 + (1 - p.levelT) * 16;
        for (let i = 0; i < n; i++) {
          const a = i / n * U.TAU + view.rt * 3;
          blit(ctx, SPR.star[(i + Math.floor(view.rt * 8)) & 1], p.x + Math.cos(a) * rr, p.y - 14 + Math.sin(a) * rr * 0.8, 0.5, 0.5);
        }
      }
    },
    drawEnemy(ctx, e, view) {
      const set = SPR[e.type];
      const nfr = set.length;
      const left = e.facing < 0;
      const ghost = e.type === 'ghost', big = e.type === 'colossus';
      if (e.dying) {
        const t = e.deathT;
        if (t < 0.22) {
          const fr = set[0];
          blit(ctx, left ? fr.li : fr.ri, e.x, e.y + PS, 0.5, 1, ghost ? -3 : 0);
        } else {
          const pf = big ? SPR.puffL : ghost ? SPR.puffS : SPR.puff;
          const k = Math.min(3, Math.floor((t - 0.22) / 0.78 * 4));
          blit(ctx, pf[k], e.x, e.y - (big ? 22 : ghost ? 16 : 11), 0.5, 0.5);
        }
        return;
      }
      let f;
      if (ghost) f = Math.floor(view.rt * 6 + e.seed * 9) % nfr;
      else f = Math.floor(e.anim * (big ? 0.6 : 1.1) + e.seed * 7) % nfr;
      const fr = set[f];
      let oy = 0;
      if (ghost) oy = -3 - (Math.floor(view.rt * 3 + e.seed * 6) & 1);
      else if (!big && (f & 1)) oy = -1;
      if (e.spawnT < 1) {
        const t = e.spawnT;
        if (ghost) {
          const fd = fr.fade[Math.min(2, Math.floor(t * 3.2))];
          blit(ctx, left ? fd.l : fd.r, e.x, e.y + PS, 0.5, 1, oy);
          return;
        }
        // rise out of the ground: clip at the feet, push the sprite up
        const img = left ? fr.l : fr.r;
        const h = img.height;
        const rise = Math.round(h * U.ease.outQuad(U.clamp((t - 0.15) / 0.85, 0, 1)));
        if (rise > 0) {
          const bx = Math.round(e.x / PS - img.width / 2) * PS, by = (Math.round(e.y / PS) + 1) * PS;
          ctx.save();
          ctx.beginPath();
          ctx.rect(bx, by - h * PS, img.width * PS, h * PS);
          ctx.clip();
          ctx.drawImage(img, bx, by - rise * PS, img.width * PS, h * PS);
          ctx.restore();
        }
        blit(ctx, (big ? SPR.puff : SPR.puffS)[Math.min(3, Math.floor(t * 4))], e.x, e.y - 1, 0.5, 0.5);
        return;
      }
      const inv = e.flash > 0.4;
      blit(ctx, inv ? (left ? fr.li : fr.ri) : (left ? fr.l : fr.r), e.x, e.y + PS, 0.5, 1, oy);
    },
    drawOrbital(ctx, o, view) {
      const lit = (Math.sin(view.rt * 11 + o.idx * 2.1) + Math.sin(view.rt * 27 + o.seed * 9)) > -0.6;
      const bob = Math.floor(view.rt * 4 + o.idx) & 1 ? 0 : -1;
      if (lit) blit(ctx, SPR.haloS, o.x, o.y - 6, 0.5, 0.5, bob);
      blit(ctx, SPR.lantern[lit ? 0 : 1], o.x, o.y, 0.5, 0.65, bob);
    },
    drawProjectile(ctx, pr) {
      const tl = 0.016;
      dot(ctx, pr.x - pr.vx * tl * 2.4, pr.y - pr.vy * tl * 2.4, 1);
      dot(ctx, pr.x - pr.vx * tl * 1.2, pr.y - pr.vy * tl * 1.2, 2);
      blit(ctx, SPR.seed[Math.floor(pr.spin / (Math.PI / 4)) & 3], pr.x, pr.y, 0.5, 0.5);
    },
    drawGem(ctx, g, view) {
      const set = g.big ? SPR.gem.b : SPR.gem.s;
      const blink = Math.floor(view.rt * 3 + g.seed * 7) & 1;
      const hop = g.pop > 0 ? Math.round(Math.sin(g.pop * Math.PI) * 4) : 0;
      const bob = (Math.floor(view.rt * 2 + g.seed * 5) & 1) && !g.fly ? 1 : 0;
      if (!g.fly) dot(ctx, g.x - PS, g.y + PS, 1, 2, 1);
      blit(ctx, set[blink], g.x, g.y, 0.5, 1, -hop - bob);
      if (g.big && blink) blit(ctx, SPR.star[0], g.x + 7, g.y - 16, 0.5, 0.5);
    },
    drawParticle(ctx, pt, view) {
      const life = pt.life / pt.max;
      if (pt.kind === 'puff') {
        blit(ctx, (pt.big ? SPR.puff : SPR.puffS)[Math.min(3, Math.floor((1 - life) * 4))], pt.x, pt.y - pt.z, 0.5, 0.5);
        return;
      }
      if (pt.kind === 'star') {
        blit(ctx, SPR.star[Math.floor(view.rt * 10 + pt.seed * 4) & 1], pt.x, pt.y - pt.z, 0.5, 0.5);
        return;
      }
      if (life < 0.3 && (Math.floor(view.rt * 20 + pt.seed * 5) & 1)) return; // blink out
      const ci = pt.ci !== undefined ? pt.ci : (pt.ci = colorIndex(pt.color));
      const s = pt.size > 1.6 ? 2 : 1;
      dot(ctx, pt.x, pt.y - pt.z, ci, s, s);
    },
    drawNumber(ctx, n, view) {
      const life = n.life / n.max;
      if (life < 0.25 && (Math.floor(view.rt * 20) & 1)) return;
      blit(ctx, numberSprite(String(n.value), n.crit), n.x, n.y, 0.5, 1, life > 0.8 ? -1 : 0);
    },
    drawDisplayOverlay(ctx, view) {
      const key = view.displayW + 'x' + view.displayH + ':' + view.up;
      if (key !== lcdKey) { lcd = buildLCD(view.displayW, view.displayH, view.up); lcdKey = key; }
      ctx.drawImage(lcd, 0, 0);
    },
    drawIcon(ctx, id, size) {
      const g = ICON_GRIDS[id];
      if (!g) return;
      const s = Math.max(1, Math.floor(size / 16));
      const o = Math.floor((size - 16 * s) / 2);
      for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
        const v = g.a[y * g.w + x];
        if (v < 0) continue;
        ctx.fillStyle = HEX[v];
        ctx.fillRect(o + x * s, o + y * s, s, s);
      }
    },

    /* ---------------- hooks: all particles in the 4 LCD colours ---------------- */
    onHit(game, e) {
      const y = e.y - (e.type === 'colossus' ? 22 : e.type === 'ghost' ? 16 : 10);
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * U.TAU, s = 40 + Math.random() * 40;
        px(game, e.x, y, i === 0 ? 0 : 3, { vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, life: 0.22 });
      }
    },
    onKill(game, e) {
      const big = e.type === 'colossus', ghost = e.type === 'ghost';
      const n = big ? 16 : ghost ? 5 : 8;
      const y = e.y - (big ? 18 : 8);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * U.TAU, s = (big ? 70 : 50) * (0.5 + Math.random());
        const ci = ghost ? (i & 1 ? 3 : 2) : [1, 2, 3, 0][i & 3];
        px(game, e.x, y, ci, { vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, z: 4, vz: 40 + Math.random() * 60, grav: 260, life: 0.5 + Math.random() * 0.3, size: i % 3 === 0 ? 2 : 1, drag: 1.5 });
      }
      if (ghost) for (let i = 0; i < 3; i++) px(game, e.x + (Math.random() - 0.5) * 10, y - 6, 3, { vy: -30 - Math.random() * 20, life: 0.6, drag: 1 });
    },
    onHurt(game, p) {
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * U.TAU;
        px(game, p.x, p.y - 12, i & 1 ? 0 : 1, { vx: Math.cos(a) * 70, vy: Math.sin(a) * 50, life: 0.35, size: 2 });
      }
    },
    onPickup(game, g) {
      if (g.big || Math.random() < 0.3) game.addParticle({ x: game.player.x + (Math.random() - 0.5) * 12, y: game.player.y - 20, vy: -24, kind: 'star', life: 0.3, drag: 2 });
    },
    onShoot() {},
    onDash(game, p) {
      for (let i = 0; i < 3; i++) game.addParticle({ x: p.x - p.dashX * i * 7, y: p.y - 2, kind: 'puff', life: 0.32 + i * 0.05, drag: 4, vx: -p.dashX * 20, vy: -p.dashY * 20 });
    },
    onLevelUp(game, p) {
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * U.TAU;
        game.addParticle({ x: p.x, y: p.y - 12, vx: Math.cos(a) * 80, vy: Math.sin(a) * 60, kind: 'star', life: 0.5, drag: 3 });
      }
    },
    onDeath(game, p) {
      game.addParticle({ x: p.x, y: p.y - 10, kind: 'puff', big: true, life: 0.6 });
    },
  });
})();
