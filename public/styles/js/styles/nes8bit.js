/* 8-Bit Arcade – an authentic NES/Famicom-era look.
   Rules followed throughout: only colours from the NES PPU palette, every sprite layer uses at most
   3 colours (black outline included), flat colour, no anti-aliasing, no gradients, no alpha blending
   in the world (ghosts use checker transparency, i-frames flicker). ~240 px tall art buffer (scale 1.5). */
(function () {
  'use strict';
  const U = window.U, G = window.G;

  const PS = 1.5;                                   // world units per art pixel
  const RES = Math.max(1, Math.round(256 / PS)) / 256; // chunk pixels per world unit (same formula as the core)
  const NPX = Math.round(256 * RES);                // chunk size in pixels (171)

  /* =====================================================================
     NES palette (2C02) – only these colours are used anywhere in the world
     ===================================================================== */
  const P = {
    k: '#000000', w: '#FCFCFC', g1: '#BCBCBC', g2: '#7C7C7C',
    gr0: '#005800', gr1: '#00A800', gr2: '#58D854',
    br0: '#503000', ochre: '#AC7C00', sand: '#F0D0B0', cream: '#FCE0A8',
    red0: '#881400', crim: '#A80020', red: '#F83800', orange: '#E45C10', lorange: '#FCA044',
    gold: '#F8B800', yellow: '#F8D878', navy: '#0000BC', blue: '#0058F8', blue2: '#0078F8', cyan: '#3CBCFC', ice: '#A4E4FC',
    purple: '#940084', magenta: '#D800CC', pink: '#F878F8', violet: '#6844FC',
  };
  const rgbCache = {};
  const rgbOf = (h) => rgbCache[h] || (rgbCache[h] = U.hex(h));

  /* =====================================================================
     Sprite builder: rows of chars + char→colour map → canvas with 1px black outline
     opt: outline (default true), diag (8-neighbour outline), tailFrom/parity (checker tail without outline),
          checker (0/1 → drop every other pixel = NES "transparency")
     ===================================================================== */
  function mk(rows, map, opt) {
    opt = opt || {};
    const h = rows.length;
    let w = 0;
    for (const r of rows) if (r.length > w) w = r.length;
    const o = opt.outline === false ? 0 : 1;
    const W = w + 2 * o, H = h + 2 * o;
    const cell = new Array(W * H).fill(null);
    const src = new Uint8Array(W * H);
    const tailFrom = opt.tailFrom === undefined ? 1e9 : opt.tailFrom;
    const par = opt.parity || 0;
    for (let y = 0; y < h; y++) {
      const r = rows[y];
      for (let x = 0; x < r.length; x++) {
        const c = map[r[x]];
        if (!c) continue;
        const i = (y + o) * W + x + o;
        if (y >= tailFrom) {
          if (((x + y + par) & 1) === 0) cell[i] = c;
          src[i] = 2;
        } else { cell[i] = c; src[i] = 1; }
      }
    }
    if (o) {
      const oc = opt.oc || P.k;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (src[i]) continue;
          let n = (x > 0 && src[i - 1] === 1) || (x < W - 1 && src[i + 1] === 1) || (y > 0 && src[i - W] === 1) || (y < H - 1 && src[i + W] === 1);
          if (!n && opt.diag) {
            n = (x > 0 && y > 0 && src[i - W - 1] === 1) || (x < W - 1 && y > 0 && src[i - W + 1] === 1) ||
              (x > 0 && y < H - 1 && src[i + W - 1] === 1) || (x < W - 1 && y < H - 1 && src[i + W + 1] === 1);
          }
          if (n) cell[i] = oc;
        }
      }
    }
    if (opt.checker !== undefined) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x + y) & 1) !== opt.checker) cell[y * W + x] = null;
    }
    const { c, ctx } = U.canvas(W, H);
    const img = ctx.createImageData(W, H), d = img.data;
    for (let i = 0; i < W * H; i++) {
      const col = cell[i];
      if (!col) continue;
      const v = rgbOf(col);
      d[i * 4] = v[0]; d[i * 4 + 1] = v[1]; d[i * 4 + 2] = v[2]; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  const pair = (c) => ({ r: c, l: U.flipX(c) });
  // char grid for procedural sprites
  function cg(w, h) {
    const a = [];
    for (let y = 0; y < h; y++) a.push(new Array(w).fill('.'));
    a.set = (x, y, ch) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) a[y][x] = ch; };
    a.get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? a[y][x] : '.');
    a.rows = () => a.map((r) => r.join(''));
    return a;
  }

  /* =====================================================================
     Screen-space blitting (everything snaps to the art-pixel grid of the buffer)
     ===================================================================== */
  let VS = 1 / PS, OX = 0, OY = 0, FR = 0;
  function setView(view) { VS = view.S; OX = view.W / 2 - view.x * VS; OY = view.H / 2 - view.y * VS; }
  const sx = (x) => Math.round(x * VS + OX);
  const sy = (y) => Math.round(y * VS + OY);
  function toScreen(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); }
  function toWorld(ctx) { ctx.setTransform(VS, 0, 0, VS, OX, OY); }
  // draw img so that its pixel (ax, ay) lands on world (x, y)
  function blit(ctx, img, x, y, ax, ay) {
    toScreen(ctx);
    ctx.drawImage(img, sx(x) - ax, sy(y) - ay);
    toWorld(ctx);
  }
  const blitFeet = (ctx, img, x, y, lift) => blit(ctx, img, x, y, img.width >> 1, img.height - 1 + (lift || 0));
  const blitMid = (ctx, img, x, y) => blit(ctx, img, x, y, img.width >> 1, img.height >> 1);

  /* =====================================================================
     World layout (ground materials)
     ===================================================================== */
  const GR = 0, FO = 1, RD = 2, WA = 3, PL = 4;
  const FTH = 0.555, WTH = 0.335, RHW = 11;
  const forestF = (x, y) => U.warped(x / 640, y / 640, 811, 1.0, 3);
  function waterF(x, y) {
    let v = U.warped(x / 520 + 31.7, y / 520 - 12.3, 977, 0.9, 3);
    const r = Math.sqrt(x * x + y * y);
    if (r < 320) v += 0.3 * (1 - r / 320);
    return v;
  }
  function pathA(x, y) {
    const qx = U.fbm(x / 470, y / 470, 2207, 2) - 0.5, qy = U.fbm(x / 470 + 3.7, y / 470 - 1.9, 2211, 2) - 0.5;
    return U.perlin((x + qx * 320) / 1000, (y + qy * 320) / 1000, 2203);
  }
  function pathB(x, y) {
    const qx = U.fbm(x / 520 - 7.1, y / 520, 2307, 2) - 0.5, qy = U.fbm(x / 520, y / 520 + 4.4, 2311, 2) - 0.5;
    return U.perlin((x + qx * 360) / 1500 + 9.3, (y + qy * 360) / 1500 - 2.1, 2303);
  }
  function sdOf(f, x, y) {
    const e = 6, n = f(x, y);
    const gx = (f(x + e, y) - f(x - e, y)) / (2 * e), gy = (f(x, y + e) - f(x, y - e)) / (2 * e);
    return U.clamp(n / Math.max(1e-5, Math.hypot(gx, gy)), -400, 400);
  }
  const roadDist = (x, y) => Math.min(Math.abs(sdOf(pathA, x, y)), Math.abs(sdOf(pathB, x, y)));

  // plazas (stone-paved graveyards) – octagonal rectangles in chunk-pixel space, one optional per cell
  const PC = 460;
  const plazaCache = new Map();
  function plazaCell(i, j) {
    const key = i + ',' + j;
    if (plazaCache.has(key)) return plazaCache.get(key);
    let p = null;
    const r = U.rng(U.hashInt(i, j, 4411));
    if (r.next() < 0.42) {
      const w = 2 * r.int(44, 66), h = 2 * r.int(30, 46);
      const x0 = i * PC + 2 * r.int(12, Math.floor((PC - w) / 2) - 12), y0 = j * PC + 2 * r.int(12, Math.floor((PC - h) / 2) - 12);
      const cx = (x0 + w / 2) / RES, cy = (y0 + h / 2) / RES;
      let ok = Math.hypot(cx, cy) > 160;
      for (let k = 0; ok && k < 5; k++) {
        const qx = cx + [0, -1, 1, -1, 1][k] * w / RES * 0.5, qy = cy + [0, -1, -1, 1, 1][k] * h / RES * 0.5;
        if (waterF(qx, qy) < WTH + 0.04) ok = false;
      }
      if (ok) p = { x0, y0, x1: x0 + w, y1: y0 + h, cut: 6, seed: r.int(0, 1e6) };
    }
    if (plazaCache.size > 4000) plazaCache.clear();
    plazaCache.set(key, p);
    return p;
  }
  function plazasIn(x0, y0, x1, y1) {
    const out = [];
    for (let j = Math.floor(y0 / PC) - 1; j <= Math.floor(y1 / PC); j++) {
      for (let i = Math.floor(x0 / PC) - 1; i <= Math.floor(x1 / PC); i++) {
        const p = plazaCell(i, j);
        if (p && p.x1 > x0 && p.x0 < x1 && p.y1 > y0 && p.y0 < y1) out.push(p);
      }
    }
    return out;
  }
  function inPlaza(p, px, py) {
    if (px < p.x0 || px >= p.x1 || py < p.y0 || py >= p.y1) return false;
    const dx = Math.min(px - p.x0, p.x1 - 1 - px), dy = Math.min(py - p.y0, p.y1 - 1 - py);
    return dx + dy >= p.cut;
  }
  // exact material at a world position (props)
  function matAt(x, y) {
    const gx = 2 * Math.floor((x * RES) / 2) + 1, gy = 2 * Math.floor((y * RES) / 2) + 1;
    for (const p of plazasIn(gx - 1, gy - 1, gx + 1, gy + 1)) if (inPlaza(p, gx, gy)) return PL;
    const wx = gx / RES, wy = gy / RES;
    if (waterF(wx, wy) < WTH) return WA;
    if (roadDist(wx, wy) < RHW) return RD;
    if (forestF(wx, wy) > FTH) return FO;
    return GR;
  }

  /* ---------- ground colours (sub-palettes) ---------- */
  const C3 = (h) => rgbOf(h);
  const GC = {
    k: C3(P.k),
    grass: C3(P.gr0), grassLip: C3(P.gr1),
    forest: C3(P.br0), forestLip: C3(P.ochre),
    road: C3(P.ochre), roadEdge: C3(P.br0), roadLip: C3(P.sand),
    stone: C3(P.g2), stoneHi: C3(P.g1),
    water: C3(P.navy), waterRing: C3(P.blue),
  };
  // ground decal glyphs: rows + char map (chars → rgb)
  function glyph(rows, map) {
    const px = [];
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (map[ch]) px.push(x, y, map[ch]);
    }
    return px;
  }
  const GL = {};
  (function buildGlyphs() {
    const a = { a: C3(P.gr1) }, f = { w: C3(P.w), y: C3(P.gold) };
    GL.tuft = [
      glyph(['a.a', '.a.'], a),
      glyph(['a.a.a', '.a.a.'], a),
      glyph(['a...a', '.a.a.'], a),
      glyph(['.a.', 'a.a', '.a.'].slice(0, 2), a),
    ];
    GL.tall = [
      glyph(['a.a.a', 'a.a.a', '.a.a.'], a),
      glyph(['..a..', 'a.a.a', '.a.a.'], a),
      glyph(['a.a', 'a.a', '.a.'], a),
    ];
    GL.flower = [
      glyph(['.w.', 'w.w', '.w.'], f),
      glyph(['.y.', 'y.y', '.y.'], f),
      glyph(['w.w'], f),
    ];
    const l = { r: C3(P.red0), o: C3(P.ochre), k: C3(P.k) };
    GL.leaf = [
      glyph(['r'], l), glyph(['o'], l), glyph(['ro'], l), glyph(['.o', 'r.'], l), glyph(['rr', '.r'], l),
      glyph(['o.', '.o'], l), glyph(['r.r'], l),
    ];
    GL.twig = [glyph(['k..', '.kk'], l), glyph(['..k', 'kk.'], l), glyph(['kk.k'], l)];
    const p = { d: C3(P.br0), l: C3(P.sand) };
    GL.pebble = [glyph(['d'], p), glyph(['dd'], p), glyph(['l', 'd'], p), glyph(['d.d'], p), glyph(['.l', 'dd'], p)];
  })();

  // brick pattern for plazas (global pixel coords)
  function brickCol(gx, gy) {
    const row = Math.floor(gy / 6), ly = gy - row * 6;
    const s = gx + ((row & 1) ? 6 : 0);
    const bi = Math.floor(s / 12), lx = s - bi * 12;
    if (ly === 5 || (lx === 11 && ly > 0)) return GC.k;
    if ((ly === 0 && lx < 5) || (lx === 0 && ly < 3)) return GC.stoneHi;
    const h = U.hashInt(bi, row, 77) & 31;
    if (h < 3 && ((lx === 4 && ly === 2) || (lx === 5 && ly === 3) || (lx === 6 && ly === 3) || (lx === 7 && ly === 4))) return GC.k;
    return GC.stone;
  }

  // water wave anchors per chunk (animated in drawGroundOverlay)
  const waveMap = new Map();

  function* buildChunk(ctx, info) {
    const N = info.px, res = info.res, pw = 1 / res;
    const gx0 = Math.round(info.wx * res), gy0 = Math.round(info.wy * res);
    const M = 10, EW = N + 2 * M, ex0 = gx0 - M, ey0 = gy0 - M;
    // coarse noise fields (step 8 px), interpolated per block
    const ST = 8, CW = Math.ceil((EW + 2) / ST) + 2;
    const fF = new Float32Array(CW * CW), fW = new Float32Array(CW * CW), fA = new Float32Array(CW * CW), fB = new Float32Array(CW * CW);
    for (let j = 0; j < CW; j++) {
      for (let i = 0; i < CW; i++) {
        const x = (ex0 + i * ST) * pw, y = (ey0 + j * ST) * pw, k = j * CW + i;
        fF[k] = forestF(x, y);
        fW[k] = waterF(x, y);
        fA[k] = sdOf(pathA, x, y);
        fB[k] = sdOf(pathB, x, y);
      }
      if (j & 1) yield;
    }
    const plz = plazasIn(ex0 - 2, ey0 - 2, ex0 + EW + 2, ey0 + EW + 2);
    const bil = (f, u, v) => {
      const i0 = u | 0, j0 = v | 0, fx = u - i0, fy = v - j0, k = j0 * CW + i0;
      const a = f[k] + (f[k + 1] - f[k]) * fx, b = f[k + CW] + (f[k + CW + 1] - f[k + CW]) * fx;
      return a + (b - a) * fy;
    };
    // material per 2x2 block → per pixel
    const mat = new Uint8Array(EW * EW);
    for (let py = 0; py < EW; py++) {
      const gy = ey0 + py;
      if (py > 0 && (gy & 1) === 1) { mat.copyWithin(py * EW, (py - 1) * EW, py * EW); continue; }
      const cy = 2 * (gy >> 1) + 1, v = (cy - ey0) / ST;
      let prev = 0;
      for (let px = 0; px < EW; px++) {
        const gx = ex0 + px;
        if (px > 0 && (gx & 1) === 1) { mat[py * EW + px] = prev; continue; }
        const cx = 2 * (gx >> 1) + 1, u = (cx - ex0) / ST;
        let m = -1;
        for (let q = 0; q < plz.length; q++) if (inPlaza(plz[q], cx, cy)) { m = PL; break; }
        if (m < 0) {
          if (bil(fW, u, v) < WTH) m = WA;
          else if (Math.min(Math.abs(bil(fA, u, v)), Math.abs(bil(fB, u, v))) < RHW) m = RD;
          else if (bil(fF, u, v) > FTH) m = FO;
          else m = GR;
        }
        mat[py * EW + px] = prev = m;
      }
      if ((py & 7) === 7) yield;
    }
    // base colours + edge tiles
    const img = ctx.createImageData(N, N), d = img.data;
    const edge = new Uint8Array(N * N);
    for (let py = 0; py < N; py++) {
      const gy = gy0 + py;
      for (let px = 0; px < N; px++) {
        const gx = gx0 + px;
        const i = (py + M) * EW + px + M;
        const m = mat[i];
        const n1 = mat[i - 1], n2 = mat[i + 1], n3 = mat[i - EW], n4 = mat[i + EW];
        const diff = n1 !== m || n2 !== m || n3 !== m || n4 !== m;
        let col, e = 0;
        if (m === PL) {
          if (diff) { col = GC.k; e = 1; }
          else if (mat[i - 2] !== m || mat[i + 2] !== m || mat[i - 2 * EW] !== m || mat[i + 2 * EW] !== m) { col = GC.stoneHi; e = 1; }
          else col = brickCol(gx, gy);
        } else if (m === WA) {
          if (diff) { col = GC.k; e = 1; }
          else if (mat[i - 2] !== m || mat[i + 2] !== m || mat[i - 2 * EW] !== m || mat[i + 2 * EW] !== m) { col = GC.waterRing; e = 1; }
          else col = GC.water;
        } else {
          let hasW = false, hasR = false, hasF = false, hasG = false;
          if (diff) {
            for (const q of [n1, n2, n3, n4]) {
              if (q === WA) hasW = true; else if (q === RD) hasR = true; else if (q === FO) hasF = true; else if (q === GR) hasG = true;
            }
          }
          if (m === GR) {
            if (hasW || hasR || hasF) { col = GC.grassLip; e = 1; } else col = GC.grass;
          } else if (m === FO) {
            if (hasG) { col = GC.k; e = 1; } else if (hasW || hasR) { col = GC.forestLip; e = 1; } else col = GC.forest;
          } else {
            if (hasW) { col = GC.roadLip; e = 1; } else if (hasG || hasF) { col = GC.roadEdge; e = 1; } else col = GC.road;
          }
        }
        const o = (py * N + px) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
        edge[py * N + px] = e;
      }
      if ((py & 3) === 3) yield;
    }

    // decals (tile-language details, seamless across chunks)
    let cnt = 0;
    function* stamps(cell, seed, target, pick) {
      const c0x = Math.floor(ex0 / cell), c1x = Math.floor((ex0 + EW) / cell);
      const c0y = Math.floor(ey0 / cell), c1y = Math.floor((ey0 + EW) / cell);
      for (let cy = c0y; cy <= c1y; cy++) {
        for (let cx = c0x; cx <= c1x; cx++) {
          const h = U.hashInt(cx, cy, seed);
          const ax = cx * cell + (h & 255) % cell, ay = cy * cell + ((h >>> 8) & 255) % cell;
          const lx = ax - ex0, ly = ay - ey0;
          if (lx < 0 || ly < 0 || lx >= EW || ly >= EW) continue;
          if (mat[ly * EW + lx] !== target) continue;
          const gph = pick(ax, ay, ((h >>> 16) & 65535) / 65536, h);
          if (!gph) continue;
          for (let k = 0; k < gph.length; k += 3) {
            const X = ax + gph[k] - gx0, Y = ay + gph[k + 1] - gy0;
            if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
            if (mat[(Y + M) * EW + X + M] !== target || edge[Y * N + X]) continue;
            const c = gph[k + 2], o = (Y * N + X) * 4;
            d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2];
          }
          if ((++cnt & 63) === 0) yield;
        }
      }
    }
    // grass: tuft pattern on an 8px tile grid, density varies in big patches
    yield* stamps(8, 5101, GR, (ax, ay, r, h) => {
      const dn = U.fbm(ax * pw / 260, ay * pw / 260, 515, 2);
      if (dn > 0.6) return r < 0.85 ? GL.tall[(h >>> 4) % 3] : null;
      return r < 0.3 + dn * 0.5 ? GL.tuft[(h >>> 4) & 3] : null;
    });
    yield* stamps(19, 5203, GR, (ax, ay, r, h) => {
      const fl = U.fbm(ax * pw / 180 + 9, ay * pw / 180, 616, 2);
      return fl > 0.6 && r < 0.6 ? GL.flower[(h >>> 4) % 3] : r < 0.02 ? GL.flower[2] : null;
    });
    // forest floor: autumn leaf litter + twigs
    yield* stamps(5, 5301, FO, (ax, ay, r, h) => (r < 0.42 ? GL.leaf[(h >>> 4) % GL.leaf.length] : null));
    yield* stamps(17, 5303, FO, (ax, ay, r, h) => (r < 0.3 ? GL.twig[(h >>> 4) % 3] : null));
    // roads: pebbles
    yield* stamps(7, 5401, RD, (ax, ay, r, h) => (r < 0.32 ? GL.pebble[(h >>> 4) % GL.pebble.length] : null));

    // wave anchors for the animated water
    const waves = [];
    const c0x = Math.floor(gx0 / 11), c1x = Math.floor((gx0 + N - 1) / 11), c0y = Math.floor(gy0 / 7), c1y = Math.floor((gy0 + N - 1) / 7);
    for (let cy = c0y; cy <= c1y; cy++) {
      for (let cx = c0x; cx <= c1x; cx++) {
        const h = U.hashInt(cx, cy, 5501);
        if ((h & 7) > 4) continue;
        const ax = cx * 11 + ((h >>> 3) & 7), ay = cy * 7 + ((h >>> 6) & 3);
        if (ax < gx0 || ay < gy0 || ax >= gx0 + N || ay >= gy0 + N) continue;
        let ok = true;
        for (const [dx, dy] of [[-2, -2], [7, -2], [-2, 4], [7, 4], [2, 1]]) {
          const lx = ax + dx - ex0, ly = ay + dy - ey0;
          if (lx < 0 || ly < 0 || lx >= EW || ly >= EW || mat[ly * EW + lx] !== WA) { ok = false; break; }
        }
        if (ok) waves.push(ax - gx0, ay - gy0, (h >>> 9) & 7);
      }
    }
    if (waveMap.size > 160) waveMap.clear();
    waveMap.set(info.cx + ',' + info.cy, waves.length ? Int16Array.from(waves) : null);

    for (let b = 0; b < N; b += 64) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.putImageData(img, 0, 0, 0, b, N, Math.min(64, N - b));
      ctx.restore();
      yield;
    }
  }

  /* =====================================================================
     Characters
     ===================================================================== */
  const JACK_HEAD = [
    '......gg.....',
    '.....gg......',
    '..ooooooooo..',
    '.ooooooooooo.',
    'oooooyoooyooo',
    'ooooyyyoyyyoo',
    'ooooooooooooo',
    'ooooyoyoyoyoo',
    '.oooyyyyyyyo.',
    '..ooooooooo..',
  ];
  const JACK_BODY = [
    '...ggggggg...',
    '..ggbbbbbbb..',
    '.gg.bbbbbbbb.',
    '...bbbbbbbbbg',
    '..gbbbbbbbbb.',
    '..bbbbbbbbbb.',
    '..bbbbbbbbb..',
  ];
  const JACK_LEGS = [
    ['....bb.bb....', '...kkk.kkk...'],
    ['...bb...bb...', '..kkk....kk..'],
  ];
  const JACK_PAL = { o: P.orange, y: P.yellow, g: P.gr1, b: P.blue2, k: P.k };
  const JACK_FLASH = { o: P.w, y: P.red, g: P.w, b: P.red, k: P.k };

  const CREEPER = [
    '...gg.g.gg....',
    '....ggggg.....',
    '......g.......',
    '....PPPPPP....',
    '..PPPPPPPPPP..',
    '.PPPkPPPPPPkP.',
    '.PPPPkkPPkkPP.',
    '.PPPPckPPckPP.',
    '.PPPPccPPccPP.',
    '.cPcPcPcPcPcP.',
    '.cccccccccccc.',
    '..cckckckckcc.',
    '...cckkkkkkc..',
    '....cccccc....',
  ];
  const CREEPER_LEGS = ['...c..cc..c...', '....c.cc.c....'];

  const GHOST_HEAD = [
    '...WWWWW.....',
    '..WWWWWWW....',
    '.WWWWWWWWW...',
    '.WWWkkWWkkW..',
    '.WWWkkWWkkW..',
    '.BWWWWWWWWWW.',
    '.BWWWWkkWWWWW',
    '.BBWWkkkkWWW.',
    '..BWWWkkWWW..',
    '..BBWWWWWWB..',
  ];
  const GHOST_TAIL = [
    ['..BBBWWWWBB..', '...BBWWWBB...', '...BBBWBB....', '....BBBB.....', '....BBB......', '.....B.......'],
    ['..BBBWWWWBB..', '...BBWWWBB...', '....BBWBBB...', '.....BBBB....', '......BBB....', '.......B.....'],
  ];

  const COLO_TOP = [
    '.......g..gg..g.......',
    '......gg.gggg.gg......',
    '.......gggggggg.......',
    '.........gggg.........',
    '......PPPPPPPPPP......',
    '....PPPPPPPPPPPPPP....',
    '...PPPPPPPPPPPPPPPP...',
    '..PPPPPPPPPPPPPPPPPP..',
    '..PPPPPPPPPPPPPPPPPP..',
    '..PPPPPPkPPPPPPPkPPP..',
    '..PPPPPPPkkPPPkkPPPP..',
    '..PPPPPPPyyPPPyyPPPP..',
    '..PPPPPPPyyPPPyyPPPP..',
    '..aPaPaPaPaPaPaPaPaP..',
    '.aaaaaaaaaaaaaaaaaaaa.',
    'aa.aaaaakkkkkkkkaaa.aa',
    'aa.aadaakakakakaaaa.aa',
    'aa.aaadakkkkkkkkaad.aa',
    'aa.aaaaaaadaaaaaaaa.aa',
    'aa.aaaadaaaaaaadaaa.aa',
    'aa.adaaaaaddaaaaada.aa',
    '.a..aaaaaadaaaaaaa..a.',
    '.a...aaaaaaaaaaaa...a.',
    'aa....aaaaaaaaaa....aa',
  ];
  const COLO_LEGS = [
    ['......aaa....aaa......', '.....aaa......aaa.....', '....dddd.....dddd.....'],
    ['......aaa....aaa......', '......aaa...aaa.......', '.....dddd..dddd.......'],
  ];

  const LANTERN = [
    '....g....',
    '...ggg...',
    '..PPPPP..',
    '.PPPPPPP.',
    '.cPcPcPc.',
    '.cyycyyc.',
    '.ccccccc.',
    '.cyyyyyc.',
    '..ccccc..',
    '...ccc...',
  ];

  /* ---------- effect frames (procedural, on the pixel grid) ---------- */
  function boomFrames(R) {
    const out = [];
    const S = Math.ceil(18 * R) | 1, c = (S - 1) / 2;
    const map = { W: P.w, y: P.gold, r: P.red };
    for (let f = 0; f < 4; f++) {
      const g = cg(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const dx = x - c, dy = y - c, dd = Math.hypot(dx, dy), an = Math.atan2(dy, dx);
        const sec = Math.abs(((an / (Math.PI / 4)) % 1 + 1) % 1 - 0.5); // 0.5 = on a diagonal/axis
        let ch = '.';
        if (f === 0) {
          if (dd < 2.2 * R) ch = 'W';
          else if ((Math.abs(dx) < 0.6 * R + 0.1 || Math.abs(dy) < 0.6 * R + 0.1) && dd < 4.2 * R) ch = 'y';
        } else if (f === 1) {
          if (dd < 2.6 * R) ch = 'W';
          else if (dd < 4.4 * R) ch = 'y';
          else if (sec > 0.44 && dd < 7 * R) ch = 'r';
        } else if (f === 2) {
          const s8 = Math.floor((an + Math.PI) / (Math.PI / 4) + 0.5) & 1;
          if (dd > 4.6 * R && dd < 6.8 * R && s8 === 0) ch = 'r';
          else if (dd > 4.4 * R && dd < 6 * R && s8 === 1 && ((x + y) & 1) === 0) ch = 'y';
          else if (dd < 3 * R && ((x + y) & 1) === 0) ch = 'y';
        } else {
          for (let k = 0; k < 8; k++) {
            const a = k * Math.PI / 4 + Math.PI / 8;
            const bx = c + Math.cos(a) * 7.4 * R, by = c + Math.sin(a) * 7.4 * R;
            if (Math.abs(x - bx) < 0.9 * R + 0.2 && Math.abs(y - by) < 0.9 * R + 0.2) ch = k & 1 ? 'y' : 'r';
            const ix = c + Math.cos(a + 0.4) * 4.2 * R, iy = c + Math.sin(a + 0.4) * 4.2 * R;
            if (k % 2 === 0 && Math.abs(x - ix) < 0.6 && Math.abs(y - iy) < 0.6) ch = 'W';
          }
        }
        g[y][x] = ch;
      }
      out.push(mk(g.rows(), map, { outline: false }));
    }
    return out;
  }
  function poofFrames() {
    const out = [];
    const map = { W: P.w, L: P.g1, G: P.g2 };
    const blobs = [
      [[8, 9, 2.2], [6, 8, 1.8], [10, 8, 1.8]],
      [[8, 10, 3.2], [4.5, 8.5, 2.6], [11.5, 8.5, 2.6], [8, 5.5, 2.8]],
      null,
    ];
    for (let f = 0; f < 3; f++) {
      const g = cg(17, 15);
      if (f < 2) {
        for (let y = 0; y < 15; y++) for (let x = 0; x < 17; x++) {
          for (const [bx, by, r] of blobs[f]) {
            const dx = x + 0.5 - bx - 0.5, dy = y + 0.5 - by - 0.5, dd = Math.hypot(dx, dy);
            if (dd <= r) g[y][x] = dy > r * 0.35 && g[y][x] !== 'W' ? 'L' : 'W';
          }
        }
        out.push(mk(g.rows(), map));
      } else {
        for (let k = 0; k < 7; k++) {
          const a = k / 7 * U.TAU, bx = 8 + Math.cos(a) * 6, by = 7.5 + Math.sin(a) * 5;
          for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) if (Math.abs(x) + Math.abs(y) < 2) g.set(Math.round(bx) + x, Math.round(by) + y, y < 0 ? 'L' : 'G');
        }
        out.push(mk(g.rows(), map, { outline: false }));
      }
    }
    return out;
  }
  function starFrames(col) {
    const map = { W: P.w, y: col || P.gold };
    return [
      mk(['.W.', 'WWW', '.W.'], map, { outline: false }),
      mk(['..W..', '.yWy.', 'WWWWW', '.yWy.', '..W..'], map, { outline: false }),
      mk(['y...y', '.....', '..W..', '.....', 'y...y'], map, { outline: false }),
    ];
  }
  function gemFrames(big) {
    const half = big ? [0, 1, 2, 3, 3, 2, 1, 0] : [0, 1, 2, 2, 1, 0];
    const fh = big ? [3, 2, 0, 2] : [2, 1, 0, 1];
    const map = big ? { W: P.w, c: P.gold, d: P.orange } : { W: P.w, c: P.cyan, d: P.blue };
    const out = [];
    for (let f = 0; f < 4; f++) {
      const W = big ? 7 : 5, c = (W - 1) / 2;
      const rows = [];
      for (let r = 0; r < half.length; r++) {
        const hw = Math.min(half[r], fh[f]);
        let s = '';
        for (let x = 0; x < W; x++) {
          const dx = x - c;
          if (Math.abs(dx) > hw) { s += '.'; continue; }
          let ch = 'c';
          if (f === 2) ch = r < half.length / 2 ? 'W' : 'c';
          else if (f === 1 ? dx === -hw : f === 3 ? dx === hw : dx === -hw || (dx === -hw + 1 && r < half.length / 2)) ch = 'W';
          else if (f === 0 && dx === hw && r >= half.length / 2 - 1) ch = 'd';
          s += ch;
        }
        rows.push(s);
      }
      out.push(mk(rows, map));
    }
    return out;
  }
  function shadowSprite(w, par) {
    const h = Math.max(2, Math.round(w / 3));
    const g = cg(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);
      if (dx * dx + dy * dy <= 1 && ((x + y + par) & 1) === 0) g[y][x] = 'k';
    }
    return mk(g.rows(), { k: P.k }, { outline: false });
  }

  /* ---------- 3x5 bitmap font for damage numbers ---------- */
  const DIG = {
    0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
    3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
    6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
    9: ['111', '101', '111', '001', '111'],
  };
  const numCache = new Map();
  function numSprite(v, crit) {
    const key = v + (crit ? 'c' : '');
    let s = numCache.get(key);
    if (s) return s;
    const str = String(v), sc = crit ? 2 : 1;
    const rows = [];
    for (let y = 0; y < 5; y++) {
      let row = '';
      for (let i = 0; i < str.length; i++) {
        const dg = DIG[str[i]] || DIG[0];
        for (let x = 0; x < 3; x++) row += (dg[y][x] === '1' ? '1' : '.').repeat(sc);
        if (i < str.length - 1) row += '.'.repeat(sc);
      }
      for (let k = 0; k < sc; k++) rows.push(row);
    }
    s = mk(rows, { 1: crit ? P.gold : P.w }, { diag: true });
    if (numCache.size > 300) numCache.clear();
    numCache.set(key, s);
    return s;
  }

  /* =====================================================================
     Props
     ===================================================================== */
  function makeTree(autumn, seed) {
    const W = 24, H = 28;
    const g = cg(W, H);
    const r = U.rng(seed);
    const blobs = [[12, 6, 5.5], [6.5, 9, 5], [17.5, 9, 5], [12, 11, 7], [8, 14.5, 5], [16, 14.5, 5], [12, 16, 5]];
    for (const b of blobs) { b[0] += r.range(-0.6, 0.6); b[1] += r.range(-0.5, 0.5); }
    // trunk first (canopy drawn over it)
    for (let y = 17; y < H; y++) {
      const flare = y >= H - 2 ? 1 : 0;
      for (let x = 10 - flare; x <= 13 + flare; x++) g[y][x] = x >= 13 ? 'k' : (x === 10 - flare && y === H - 1) ? 't' : 't';
      if (y === 20 || y === 24) g[y][12] = 'k';
    }
    for (let y = 0; y < 21; y++) for (let x = 0; x < W; x++) {
      let own = -1;
      for (let k = 0; k < blobs.length; k++) {
        const [bx, by, br] = blobs[k];
        if (Math.hypot(x + 0.5 - bx, y + 0.5 - by) <= br) own = k;
      }
      if (own < 0) continue;
      const [bx, by, br] = blobs[own];
      const nx = (x + 0.5 - bx) / br, ny = (y + 0.5 - by) / br, dd = Math.hypot(nx, ny);
      let ch = 'G';
      if (dd > 0.72 && nx + ny > 0.45) ch = 'k';
      else if (nx + ny < -0.55 && dd > 0.3 && dd < 0.9) ch = 'L';
      // global lower-right dither shade
      const gx = (x + 0.5 - 12) / 11, gy = (y + 0.5 - 10) / 10;
      if (ch === 'G' && gx + gy > 0.55 && ((x + y) & 1) === 0) ch = 'k';
      g[y][x] = ch;
    }
    const map = autumn ? { G: P.ochre, L: P.yellow, k: P.k, t: P.red0 } : { G: P.gr1, L: P.gr2, k: P.k, t: P.red0 };
    const rows = g.rows();
    return { img: pair(mk(rows, map)), see: pair(mk(rows, map, { checker: 0 })) };
  }
  function makeBush(seed) {
    const W = 18, H = 10, g = cg(W, H), r = U.rng(seed);
    const blobs = [[5, 6, 4], [10, 4.5, 4.2], [14, 6.5, 3.6], [9, 7, 4]];
    for (const b of blobs) b[0] += r.range(-0.5, 0.5);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let own = -1;
      for (let k = 0; k < blobs.length; k++) if (Math.hypot(x + 0.5 - blobs[k][0], y + 0.5 - blobs[k][1]) <= blobs[k][2]) own = k;
      if (own < 0) continue;
      const [bx, by, br] = blobs[own];
      const nx = (x + 0.5 - bx) / br, ny = (y + 0.5 - by) / br, dd = Math.hypot(nx, ny);
      g[y][x] = dd > 0.7 && nx + ny > 0.45 ? 'k' : nx + ny < -0.5 && dd > 0.3 && dd < 0.9 ? 'L' : 'G';
    }
    return pair(mk(g.rows(), { G: P.gr1, L: P.gr2, k: P.k }));
  }
  function makeDeadTree() {
    const W = 22, H = 30, g = cg(W, H);
    const line = (x0, y0, x1, y1, ch, wdt) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) {
        const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
        for (let k = 0; k < wdt; k++) g.set(x + k, y, ch);
      }
    };
    line(10, 29, 10, 9, 'L', 3);
    for (let y = 9; y < 30; y++) g.set(12, y, 'G');
    line(8, 29, 6, 29, 'L', 1); line(13, 29, 15, 29, 'G', 1);
    line(10, 16, 4, 9, 'L', 2); line(4, 9, 2, 4, 'L', 1); line(5, 10, 6, 5, 'L', 1);
    line(12, 13, 18, 7, 'G', 2); line(18, 7, 20, 3, 'G', 1); line(17, 8, 15, 3, 'G', 1);
    line(11, 9, 9, 2, 'L', 1); line(11, 9, 13, 1, 'G', 1);
    g.set(10, 20, 'k'); g.set(11, 21, 'k'); g.set(10, 12, 'k');
    return pair(mk(g.rows(), { L: P.g1, G: P.g2, k: P.k }));
  }
  const TOMBS = [
    ['...LLLL...', '..LLLLLG..', '.LLLLLLLG.', '.LLLkLLLG.', '.LLkkkLLG.', '.LLLkLLLG.', '.LLLkLLLG.', '.LLLLLLLG.', '.LLLLLLLG.', 'GGGGGGGGGG'],
    ['...LG...', '...LG...', '.LLLLGG.', '.GGLGGG.', '...LG...', '...LG...', '...LG...', '...LG...', '.GGGGGG.'],
    ['..LLLL..', '.LLLLLG.', '.LLkLLG.', '.LkkkLG.', '.LLkLLG.', '.LLLLLG.', '.LLLLLG.', 'GGGGGGGG'],
    ['.LLL....', '.LLLLG..', '.LLLLLG.', '.LkLLLG.', '.LLkLLG.', '.LLLkLG.', 'GGGGGGGG'],
  ];
  const ROCKS = [
    ['..LLL...', '.LLLGG..', 'LLLGGGG.', 'LGGGGGGG', '.GGGGGG.'],
    ['.LL..', 'LLGG.', 'LGGGG', '.GGG.'],
  ];
  function makePumpkin(carved) {
    const W = 11, H = 8, g = cg(W, H);
    for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) {
      const nx = (x + 0.5 - 5.5) / 5.5, ny = (y + 0.5 - 4.8) / 3.4;
      if (nx * nx + ny * ny > 1) continue;
      let ch = 'o';
      if (x === 3 || x === 7) ch = 'd';
      if (!carved && (x === 2 || x === 5) && y >= 2 && y <= 3) ch = 'y';
      g[y][x] = ch;
    }
    g[0][5] = 's'; g[1][5] = 's'; g[0][6] = 's';
    if (carved) {
      g[3][3] = 'y'; g[3][7] = 'y'; g[4][2] = 'y'; g[4][3] = 'y'; g[4][4] = 'y'; g[4][6] = 'y'; g[4][7] = 'y'; g[4][8] = 'y';
      for (let x = 3; x <= 7; x++) g[6][x] = 'y';
      g[5][4] = 'y'; g[5][6] = 'y';
    }
    return mk(g.rows(), { o: P.orange, d: P.red0, y: P.gold, s: P.gr1 });
  }
  const FENCE = ['.a...a...a...a..', 'aaa.aaa.aaa.aaa.', 'aaa.aaa.aaa.aaa.', 'dddddddddddddddd', 'aaa.aaa.aaa.aaa.', 'aaa.aaa.aaa.aaa.', 'dddddddddddddddd', 'aaa.aaa.aaa.aaa.', '.a...a...a...a..'];
  const SIGN = ['aaaaaaaaaa.', 'adddadddaaa', 'aaaaaaaaaaa', 'addaddddaa.', 'aaaaaaaaa..', 'dddddddd...', '....dd.....', '....dd.....', '....dd.....', '....dd.....', '...dddd....'];
  function makeStatue() {
    const W = 14, H = 22, g = cg(W, H);
    // stone jack-o'-lantern on a pedestal
    for (let y = 0; y < 9; y++) for (let x = 0; x < W; x++) {
      const nx = (x + 0.5 - 7) / 6.4, ny = (y + 0.5 - 5) / 4;
      if (nx * nx + ny * ny > 1) continue;
      g[y][x] = nx + ny > 0.55 ? 'G' : 'L';
    }
    g[0][7] = 'G';
    for (const [x, y] of [[4, 4], [5, 3], [6, 4], [8, 4], [9, 3], [10, 4], [4, 6], [5, 7], [6, 6], [7, 7], [8, 6], [9, 7], [10, 6]]) g.set(x, y, 'k');
    for (let y = 9; y < H; y++) for (let x = 2; x < 12; x++) {
      if (y === 9 || y === H - 1 || y === H - 2) { g[y][x - (y >= H - 2 ? 1 : 0)] = 'L'; g[y][x + (y >= H - 2 ? 1 : 0)] = x >= 10 ? 'G' : 'L'; continue; }
      if (x < 3 || x > 10) continue;
      g[y][x] = x >= 9 ? 'G' : 'L';
      if (y === 10) g[y][x] = 'G';
    }
    return mk(g.rows(), { L: P.w, G: P.g1, k: P.k });
  }

  /* =====================================================================
     Icons (16x16 art, NES palette)
     ===================================================================== */
  function tearSeed(g, cx, cy, len, wid, horiz, map) {
    // teardrop: point at the start (top / left)
    for (let i = 0; i < len; i++) {
      const v = (i + 0.5) / len, hw = wid * Math.sin(Math.PI * Math.pow(v, 0.65)) * 0.5 + 0.2;
      for (let j = -3; j <= 3; j++) {
        if (Math.abs(j) > hw) continue;
        const ch = j <= -hw + 1 && i > 0 ? map.hi : j >= hw - 1 ? map.sh : map.base;
        if (horiz) g.set(cx - len / 2 + i, cy + j, ch); else g.set(cx + j, cy - len / 2 + i, ch);
      }
    }
  }
  function iconRows(id) {
    let g;
    switch (id) {
      case 'hp-heart':
        return [
          '..............', '..............', '..rrr...rrr...', '.rWWrr.rrrrr..', '.rWrrrrrrrrr..', '.rrrrrrrrrrr..', '.rrrrrrrrrrr..',
          '..rrrrrrrrr...', '...rrrrrrr....', '....rrrrr.....', '.....rrr......', '......r.......',
        ].map((r) => '.' + r.slice(0, 13));
      case 'kills':
        return [
          '...g..g..g....', '....g.g.g.....', '.....ggg......', '...PPPPPPP....', '..PPPPPPPPP...', '.PPkPPPPPkPP..', '.PPPkkPkkPPP..',
          '.PPPccPccPPP..', '.PPPckPckPPP..', '.cPcPcPcPcPc..', '.ccckckckccc..', '..cckkkkkcc...', '...ccccccc....', '.....ccc......',
        ].map((r) => '.' + r.slice(0, 13));
      case 'dmg':
        g = cg(14, 14);
        tearSeed(g, 5, 7.5, 11, 7, false, { base: 'c', hi: 'W', sh: 's' });
        for (const [x, y] of [[11, 1], [10, 2], [11, 2], [12, 2], [11, 3], [11, 9], [10, 10], [11, 10], [12, 10], [11, 11], [12, 6]]) g.set(x, y, 'W');
        return g.rows();
      case 'rate':
        g = cg(14, 14);
        tearSeed(g, 10, 3.5, 7, 5, true, { base: 'c', hi: 'W', sh: 's' });
        tearSeed(g, 9, 10, 7, 5, true, { base: 'c', hi: 'W', sh: 's' });
        for (const [x, y] of [[0, 3], [1, 3], [3, 3], [4, 3], [1, 5], [2, 5], [0, 9], [2, 9], [3, 9], [1, 11], [3, 11], [4, 11]]) g.set(x, y, 'W');
        return g.rows();
      case 'multi':
        return [
          '..............', '.....rr.......', '....drrd......', '.....dd.......', '....bbbb......', '...bbbbbb.....', '..bbbbbbbb....',
          '.bbbWbbbbbd...', '.bbWbbbbbbd.c.', '.bbbbbbbbdd.c.', '.bbbbbbbbd..cs', '..bbbbbbdd.c..', '...ddddd...cs.', '..............',
        ];
      case 'bounce':
        g = cg(14, 14);
        for (const [x, y] of [[1, 12], [2, 10], [3, 8], [4, 7], [6, 6], [7, 7], [8, 8], [9, 10]]) g.set(x, y, 'W');
        tearSeed(g, 11, 6.5, 6, 4, false, { base: 'c', hi: 'W', sh: 's' });
        for (let x = 0; x < 14; x++) g.set(x, 13, x % 3 === 2 ? '.' : 'g');
        return g.rows();
      case 'lantern':
        return ['..............', '..y........y..', '.....g....y...', '....ggg.......', '...PPPPP......', '..PPPPPPP.....', '..cPcPcPc.....',
          '..cyycyyc...y.', '..ccccccc.....', '..cyyyyyc.....', '...ccccc......', '....ccc.......', '.y............', '..............'].map((r) => r.slice(0, 2) + r.slice(2));
      case 'speed':
        return [
          '..............', '..W...........', '.WWW......b...', '..W......bWb..', '........bWbb..', '.......bWbbb..', '......bWbbbb..',
          '.bbb.bWbbbbb..', 'bWWbbbbbbbbbb.', 'bWbbbbbbbbbbbb', '.bbbbbbbbbbbb.', '..........b...', '..........b...', '.........bbb..',
        ];
      case 'magnet':
        return [
          '..............', '..............', '....bbbbbb....', '...b......b...', '..b..cc.ee.b..', '..b.cWceWe.b..', '.bbbbbbbbbbbb.',
          '.bdbdbdbdbdbd.', '.dbdbdbdbdbdb.', '.bdbdbdbdbdbd.', '..dbdbdbdbdb..', '..bdbdbdbdbd..', '...dddddddd...', '..............',
        ];
      case 'hp':
        return [
          '...W...W......', '....W...W.....', '...W...W......', '..............', '..LLLLLLLLLL..', '.LoPoooPoooL..', '.LLLLLLLLLLLL.',
          'GGGGGGGGGGGGGG', '.GLGGGGGGGGGG.', '.GLGGGGGGGGGG.', '.GGGGGGGGGGGG.', '..GGGGGGGGGG..', '...GG....GG...', '..............',
        ];
      default:
        return ['......'];
    }
  }
  const ICON_MAP = {
    r: P.red, W: P.w, g: P.gr1, P: P.purple, c: P.cream, k: P.k, s: P.ochre, b: P.ochre, d: P.br0, y: P.gold,
    L: P.g1, G: P.g2, o: P.orange, e: P.gold,
  };
  const iconCache = {};
  function iconCanvas(id) {
    if (iconCache[id]) return iconCache[id];
    let map = ICON_MAP;
    if (id === 'speed') map = Object.assign({}, ICON_MAP, { b: P.cyan });
    if (id === 'magnet') map = Object.assign({}, ICON_MAP, { c: P.cyan });
    const rows = iconRows(id);
    const img = mk(rows, map, { diag: false });
    const { c, ctx } = U.canvas(16, 16);
    ctx.drawImage(img, Math.floor((16 - img.width) / 2), Math.floor((16 - img.height) / 2));
    return (iconCache[id] = c);
  }

  /* =====================================================================
     HUD (CSS) – black NES status bar, Zelda hearts, menu windows
     ===================================================================== */
  function svgPix(rows, map, sc) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    let s = `<svg xmlns='http://www.w3.org/2000/svg' width='${w * sc}' height='${h * sc}' shape-rendering='crispEdges'>`;
    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < rows[y].length) {
        const ch = rows[y][x];
        if (!map[ch]) { x++; continue; }
        let e = x;
        while (e < rows[y].length && rows[y][e] === ch) e++;
        s += `<rect x='${x * sc}' y='${y * sc}' width='${(e - x) * sc}' height='${sc}' fill='${map[ch]}'/>`;
        x = e;
      }
    }
    s += '</svg>';
    return `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  }
  const HEART = ['.rr.rr..', 'rWrrrrr.', 'rrrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....'];
  const HEART_FULL = svgPix(HEART, { r: P.red, W: P.w }, 3);
  const HEART_EMPTY = svgPix(HEART, { r: P.red0, W: P.red0 }, 3);
  const CURSOR = svgPix(['W.....', 'WW....', 'WWW...', 'WWWW..', 'WWW...', 'WW....', 'W.....'], { W: P.w }, 3);
  const B = 'body.style-nes8bit';
  const F = `'Press Start 2P', monospace`;
  const WIN = `background: #000; border: 4px solid #fcfcfc; border-radius: 0; box-shadow: 0 0 0 4px #000, inset 0 0 0 4px #000, inset 0 0 0 8px #fcfcfc;`;
  const DITHER = `background: repeating-conic-gradient(#000 0 25%, transparent 0 50%) 0 0 / 8px 8px;`;
  const CSS = `
${B} { font-family: ${F}; color: #fcfcfc; }
${B} #hud { padding: 14px 32px 12px; background: #000; display: flex; flex-direction: column-reverse; gap: 12px;
  box-shadow: 0 4px 0 #000; image-rendering: pixelated; }
${B} #hud .topline { margin: 0; align-items: center; }
${B} #hud .xp { height: 16px; margin: 0 150px 0 56px; border: 0; border-radius: 0; background: #000; overflow: visible;
  box-shadow: 0 0 0 4px #fcfcfc; }
${B} #hud .xp::before { content: 'EP'; position: absolute; left: -56px; top: 0; font: 16px ${F}; color: #f83800; }
${B} #hud .xp-fill { background: repeating-linear-gradient(90deg, #3cbcfc 0 8px, #0058f8 8px 12px, #000 12px 16px); transition: none; }
${B} #hud .lvl { right: -146px; font: 16px ${F}; color: #fcfcfc; text-shadow: none; }
${B} #hud .hp { display: grid; grid-template-columns: auto auto; column-gap: 16px; row-gap: 8px; align-items: center; }
${B} #hud .hp::before { content: '-LEBEN-'; grid-column: 1 / 3; font: 16px ${F}; color: #f83800; }
${B} #hud .hp-icon { display: none; }
${B} #hud .hp-bar { width: 240px; height: 21px; border: 0; border-radius: 0; background: ${HEART_EMPTY} 0 0 / 24px 21px repeat-x; }
${B} #hud .hp-fill { background: ${HEART_FULL} 0 0 / 24px 21px repeat-x; transition: none; }
${B} #hud .hp-text { font: 16px ${F}; color: #fcfcfc; text-shadow: none; min-width: 120px; }
${B}.hurt #hud .hp-bar { filter: none; animation: nesblink .1s steps(1) infinite; }
${B} #hud .clock { gap: 8px; }
${B} #hud .clock-time { font: 32px ${F}; letter-spacing: 0; color: #fcfcfc; text-shadow: none; }
${B} #hud .clock-label { font: 16px ${F}; color: #f83800; opacity: 1; letter-spacing: 0; text-transform: uppercase; }
${B} #hud .kills { min-width: 280px; gap: 10px; font: 24px ${F}; text-shadow: none; }
${B} #hud .kills-icon { width: 48px; height: 48px; image-rendering: pixelated; }
${B} #hud .kills-num::before { content: '×'; color: #f8b800; margin-right: 6px; }
${B} #stylebar { ${WIN} padding: 12px 22px; gap: 16px; bottom: 16px; font-family: ${F}; }
${B} #stylebar .style-family { font: 8px ${F}; color: #f83800; opacity: 1; letter-spacing: 0; }
${B} #stylebar .style-name { font: 16px ${F}; color: #fcfcfc; }
${B} #stylebar .style-hint { font: 8px ${F}; color: #bcbcbc; opacity: 1; }
${B} #stylebar .auto.on { color: #f8b800; }
${B} #levelup { ${DITHER} inset: 112px 0 0 0; gap: 28px; }
${B} #levelup .lu-title { font-size: 0; text-shadow: none; ${WIN} padding: 22px 36px; }
${B} #levelup .lu-title::after { content: 'NEUE STUFE!'; font: 32px ${F}; color: #f8b800; letter-spacing: 2px; }
${B} #levelup .lu-cards { gap: 48px; }
${B} #levelup .card { ${WIN} width: 272px; min-height: 300px; padding: 30px 20px 22px; gap: 16px; transition: none; justify-content: center; }
${B} #levelup .card:hover { transform: none; }
${B} #levelup .card::before { content: ''; display: none; position: absolute; left: -36px; top: 50%; margin-top: -10px; width: 18px; height: 21px;
  background: ${CURSOR} 0 0 / 18px 21px no-repeat; animation: nesblink .5s steps(1) infinite; }
${B} #levelup .card:hover::before, ${B} #levelup .lu-cards:not(:hover) .card:first-child::before { display: block; }
${B} #levelup .card-icon { width: 96px; height: 96px; image-rendering: pixelated; }
${B} #levelup .card-name { font: 16px/1.5 ${F}; color: #f8b800; }
${B} #levelup .card-desc { font: 8px/2 ${F}; color: #fcfcfc; opacity: 1; font-size: 12px; }
${B} #levelup .card-key { top: 16px; left: 18px; font: 16px ${F}; color: #f83800; opacity: 1; }
${B} #levelup .lu-hint { font: 16px ${F}; color: #fcfcfc; opacity: 1; background: #000; padding: 10px 16px; }
${B} #gameover { ${DITHER} gap: 22px; }
${B} #gameover .go-title { font: 32px ${F}; color: #f83800; background: #000; padding: 16px 24px; }
${B} #gameover .go-stats { ${WIN} padding: 22px 28px; font: 16px/1.8 ${F}; }
${B} #gameover .go-hint { font: 16px ${F}; color: #fcfcfc; background: #000; padding: 8px 14px; animation: nesblink 1s steps(1) infinite; }
${B} #pausebox { ${WIN} font: 32px ${F}; padding: 24px 36px; color: #fcfcfc; text-shadow: none; }
@keyframes nesblink { 0% { opacity: 1; } 50% { opacity: 0; } }
`;

  /* =====================================================================
     The style
     ===================================================================== */
  const SPR = {};
  const GEMSEQ = [0, 0, 0, 1, 2, 3];
  const st = {
    id: 'nes8bit',
    name: '8-Bit Arcade',
    family: 'Pixel Art · 8-Bit',
    description: 'Wie ein verschollenes NES-Modul: strenge 8-Bit-Palette, schwarze Konturen, Kachel-Wiesen und flackernde Geister.',
    pixelArt: { scale: PS },
    groundColor: P.gr0,
    chunkSize: 256,
    fonts: ['Press+Start+2P'],
    css: CSS,

    init() {
      // Jack: [hurt][frame] → {r,l}; checker copies for the dash afterimage
      SPR.jack = []; SPR.jackFlash = []; SPR.jackGhost = [];
      for (let f = 0; f < 2; f++) {
        const rows = JACK_HEAD.concat(JACK_BODY, JACK_LEGS[f]);
        SPR.jack.push(pair(mk(rows, JACK_PAL)));
        SPR.jackFlash.push(pair(mk(rows, JACK_FLASH)));
        SPR.jackGhost.push(pair(mk(rows, { o: P.orange, y: P.orange, g: P.orange, b: P.orange, k: P.orange }, { outline: false, checker: 0 })));
      }
      // creepers: 2 palette variants, 2 frames, flash
      const cPal = [
        { P: P.purple, c: P.cream, k: P.k, g: P.gr1 },
        { P: P.magenta, c: P.cream, k: P.k, g: P.gr1 },
      ];
      const cFlash = { P: P.red, c: P.w, k: P.k, g: P.w };
      SPR.creeper = cPal.map((pal) => [0, 1].map((f) => pair(mk(CREEPER.concat([CREEPER_LEGS[f]]), pal))));
      SPR.creeperF = [0, 1].map((f) => pair(mk(CREEPER.concat([CREEPER_LEGS[f]]), cFlash)));
      // ghosts: [frame][parity]
      const gPal = { W: P.w, B: P.cyan, k: P.k };
      const gFlash = { W: P.yellow, B: P.red, k: P.k };
      SPR.ghost = [0, 1].map((f) => [0, 1].map((p) => pair(mk(GHOST_HEAD.concat(GHOST_TAIL[f]), gPal, { tailFrom: 10, parity: p }))));
      SPR.ghostF = [0, 1].map((f) => pair(mk(GHOST_HEAD.concat(GHOST_TAIL[f]), gFlash, { tailFrom: 10, parity: 0 })));
      // colossus
      const kPal = { P: P.purple, y: P.gold, a: P.ochre, d: P.br0, g: P.gr1, k: P.k };
      const kFlash = { P: P.pink, y: P.w, a: P.yellow, d: P.red, g: P.w, k: P.k };
      SPR.colossus = [0, 1].map((f) => pair(mk(COLO_TOP.concat(COLO_LEGS[f]), kPal)));
      SPR.colossusF = [0, 1].map((f) => pair(mk(COLO_TOP.concat(COLO_LEGS[f]), kFlash)));
      // lantern (blinks between two glow colours)
      SPR.lantern = [P.gold, P.w].map((y) => mk(LANTERN, { P: P.purple, c: P.cream, y, g: P.gr1 }));
      // effects
      SPR.boom = boomFrames(1);
      SPR.boomBig = boomFrames(1.7);
      SPR.poof = poofFrames();
      SPR.star = starFrames(P.gold);
      SPR.starC = starFrames(P.cyan);
      SPR.gem = gemFrames(false);
      SPR.gemBig = gemFrames(true);
      SPR.seed = [P.cream, P.w].map((c) => mk(['cc', 'cc'], { c }));
      SPR.dust = [mk(['.L.', 'LWL', '.L.'], { L: P.g1, W: P.w }, { outline: false }), mk(['L.L', '...', 'L.L'], { L: P.g2 }, { outline: false })];
      SPR.shadow = {};
      for (const w of [8, 10, 12, 16, 20, 24]) SPR.shadow[w] = [shadowSprite(w, 0), shadowSprite(w, 1)];
      // props
      SPR.tree = [0, 1, 2].map((s) => makeTree(false, 900 + s));
      SPR.treeA = [makeTree(true, 950), makeTree(true, 951)];
      SPR.dead = makeDeadTree();
      SPR.bush = [makeBush(11), makeBush(12)];
      const stone = { L: P.g1, G: P.g2, k: P.k };
      SPR.tomb = TOMBS.map((r) => mk(r, { L: P.w, G: P.g1, k: P.k }));
      SPR.rock = ROCKS.map((r) => pair(mk(r, stone)));
      SPR.pump = [pair(makePumpkin(false)), pair(makePumpkin(true))];
      SPR.fence = mk(FENCE, { a: P.ochre, d: P.br0 });
      SPR.sign = pair(mk(SIGN, { a: P.ochre, d: P.br0 }));
      SPR.statue = makeStatue();
      this._scan = null;
    },

    *renderGroundChunk(ctx, info) { yield* buildChunk(ctx, info); },

    propsForChunk(info) {
      const out = [];
      const own = (x, y) => x >= info.wx && x < info.wx + info.size && y >= info.wy && y < info.wy + info.size;
      const landOK = (x, y, rx, ry, allowed) => {
        for (const [dx, dy] of [[0, 0], [-rx, 0], [rx, 0], [0, -ry], [0, ry]]) if (!allowed.includes(matAt(x + dx, y + dy))) return false;
        return true;
      };
      // trees (dense in forests, lonely on meadows)
      G.scatterOwned(info, 40, 6101, (x, y, rng) => {
        if (G.nearSpawn(x, y, 110)) return;
        const F = forestF(x, y), roll = rng.next();
        const p = F > FTH + 0.02 ? 0.5 : F > FTH ? 0.24 : 0.012;
        if (roll >= p) return;
        if (!landOK(x, y, 16, 8, [GR, FO])) return;
        if (roadDist(x, y) < RHW + 14) return;
        if (F > FTH && rng.next() < 0.12) { out.push({ x, y, t: 'dead', f: rng.next() < 0.5, pad: 60 }); return; }
        const autumn = rng.next() < 0.16;
        const set = autumn ? SPR.treeA : SPR.tree;
        out.push({ x, y, t: 'tree', s: set[(rng.next() * set.length) | 0], f: rng.next() < 0.5, pad: 80 });
      });
      // bushes
      G.scatterOwned(info, 64, 6203, (x, y, rng) => {
        if (G.nearSpawn(x, y, 90) || rng.next() > 0.08) return;
        if (!landOK(x, y, 12, 5, [GR, FO]) || roadDist(x, y) < RHW + 10) return;
        out.push({ x, y, t: 'bush', i: (rng.next() * 2) | 0, f: rng.next() < 0.5, pad: 30 });
      });
      // rocks
      G.scatterOwned(info, 96, 6307, (x, y, rng) => {
        if (G.nearSpawn(x, y, 90) || rng.next() > 0.08) return;
        if (!landOK(x, y, 8, 4, [GR, FO, RD])) return;
        out.push({ x, y, t: 'rock', i: rng.next() < 0.6 ? 0 : 1, f: rng.next() < 0.5, pad: 20 });
      });
      // pumpkin patches
      G.scatterOwned(info, 150, 6401, (x, y, rng) => {
        if (G.nearSpawn(x, y, 100) || rng.next() > 0.22) return;
        const n = 1 + ((rng.next() * 3) | 0);
        for (let k = 0; k < n; k++) {
          const px = x + (k === 0 ? 0 : rng.range(-16, 16)), py = y + (k === 0 ? 0 : rng.range(-8, 8));
          if (!landOK(px, py, 8, 4, [GR])) continue;
          if (roadDist(px, py) < RHW + 6) continue;
          out.push({ x: px, y: py, t: 'pump', i: rng.next() < 0.35 ? 1 : 0, f: rng.next() < 0.5, pad: 20 });
        }
      });
      // short fence runs
      G.scatterOwned(info, 230, 6503, (x, y, rng) => {
        if (G.nearSpawn(x, y, 140) || rng.next() > 0.3) return;
        const n = 2 + ((rng.next() * 3) | 0);
        for (let k = 0; k < n; k++) {
          const px = x + k * 24;
          if (!landOK(px, y, 13, 4, [GR])) break;
          if (roadDist(px, y) < RHW + 8) break;
          out.push({ x: px, y, t: 'fence', pad: 30 });
        }
      });
      // signposts beside roads
      G.scatterOwned(info, 200, 6607, (x, y, rng) => {
        if (G.nearSpawn(x, y, 100) || rng.next() > 0.45) return;
        const fA = Math.abs(sdOf(pathA, x, y)) < Math.abs(sdOf(pathB, x, y)) ? pathA : pathB;
        const e = 6, n = fA(x, y), gx = (fA(x + e, y) - fA(x - e, y)) / (2 * e), gy = (fA(x, y + e) - fA(x, y - e)) / (2 * e);
        const gl = Math.hypot(gx, gy);
        if (gl < 1e-6) return;
        const sd = n / gl;
        if (Math.abs(sd) > 90) return;
        const s = sd < 0 ? -1 : 1, mv = sd - s * (RHW + 9);
        const px = x - (gx / gl) * mv, py = y - (gy / gl) * mv;
        if (!own(px, py) || G.nearSpawn(px, py, 100)) return;
        const rd = roadDist(px, py);
        if (rd < RHW + 4 || rd > RHW + 16) return;
        if (!landOK(px, py, 6, 3, [GR, FO])) return;
        out.push({ x: px, y: py, t: 'sign', f: gx * s > 0, pad: 30 });
      });
      // graveyards on the stone plazas: rows of tombstones + a statue in the middle
      const px0 = info.wx * RES, py0 = info.wy * RES;
      for (const p of plazasIn(px0, py0, px0 + NPX, py0 + NPX)) {
        const cx = (p.x0 + p.x1) / 2, cy = (p.y0 + p.y1) / 2;
        const wx = cx / RES, wy = cy / RES;
        if (own(wx, wy + 8) && !G.nearSpawn(wx, wy, 60)) out.push({ x: wx, y: wy + 8, t: 'statue', pad: 50 });
        const r = U.rng(p.seed);
        for (let ty = p.y0 + 16; ty <= p.y1 - 8; ty += 18) {
          for (let tx = p.x0 + 10; tx <= p.x1 - 10; tx += 15) {
            const roll = r.next(), v = (r.next() * 4) | 0;
            if (Math.abs(tx - cx) < 22 && Math.abs(ty - cy) < 20) continue;
            if (roll > 0.62) continue;
            const x = tx / RES, y = ty / RES;
            if (!own(x, y) || G.nearSpawn(x, y, 70)) continue;
            out.push({ x, y, t: 'tomb', i: v, pad: 30 });
          }
        }
      }
      // lonely tombstones at forest edges
      G.scatterOwned(info, 170, 6709, (x, y, rng) => {
        if (G.nearSpawn(x, y, 100) || rng.next() > 0.12) return;
        const F = forestF(x, y);
        if (F < FTH - 0.06 || F > FTH + 0.04) return;
        if (!landOK(x, y, 6, 3, [GR, FO]) || roadDist(x, y) < RHW + 8) return;
        out.push({ x, y, t: 'tomb', i: (rng.next() * 4) | 0, pad: 30 });
      });
      return out;
    },

    drawProp(ctx, pr, view) {
      let img;
      switch (pr.t) {
        case 'tree': {
          const p = view.game.player;
          const behind = p.y < pr.y - 4 && p.y > pr.y - 46 && Math.abs(p.x - pr.x) < 18;
          img = (behind ? pr.s.see : pr.s.img)[pr.f ? 'l' : 'r'];
          break;
        }
        case 'dead': img = SPR.dead[pr.f ? 'l' : 'r']; break;
        case 'bush': img = SPR.bush[pr.i][pr.f ? 'l' : 'r']; break;
        case 'rock': img = SPR.rock[pr.i][pr.f ? 'l' : 'r']; break;
        case 'pump': img = SPR.pump[pr.i][pr.f ? 'l' : 'r']; break;
        case 'fence': img = SPR.fence; break;
        case 'sign': img = SPR.sign[pr.f ? 'l' : 'r']; break;
        case 'tomb': img = SPR.tomb[pr.i]; break;
        case 'statue': img = SPR.statue; break;
      }
      if (img) blitFeet(ctx, img, pr.x, pr.y);
    },

    drawShadow(ctx, o, view) {
      let w;
      if (o.kind === 'prop') {
        if (o.t === 'tree') w = 20; else if (o.t === 'dead') w = 12; else if (o.t === 'statue') w = 16; else return;
      } else if (o.kind === 'enemy') {
        if (o.dying || o.spawnT < 0.55) return;
        w = o.type === 'colossus' ? 24 : o.type === 'ghost' ? 8 : 12;
      } else {
        if (o.iframes > 0 && (FR & 2)) return;
        w = 12;
      }
      const set = SPR.shadow[w];
      const x = sx(o.x), y = sy(o.y);
      const img = set[(x + y) & 1];
      toScreen(ctx);
      ctx.drawImage(img, x - (img.width >> 1), y - (img.height >> 1));
      toWorld(ctx);
    },

    drawGroundOverlay(ctx, view) {
      setView(view);
      FR++;
      // animated water: little waves toggle between two frames (classic 2-frame tile animation)
      const S = view.S, ph = Math.floor(view.rt * 2.2);
      const cx0 = Math.floor(view.x0 / 256), cx1 = Math.floor(view.x1 / 256), cy0 = Math.floor(view.y0 / 256), cy1 = Math.floor(view.y1 / 256);
      toScreen(ctx);
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
          const wv = waveMap.get(cx + ',' + cy);
          if (!wv) continue;
          const X0 = Math.round(cx * 256 * S + OX), X1 = Math.round((cx + 1) * 256 * S + OX);
          const Y0 = Math.round(cy * 256 * S + OY), Y1 = Math.round((cy + 1) * 256 * S + OY);
          const kx = (X1 - X0) / NPX, ky = (Y1 - Y0) / NPX;
          for (let i = 0; i < wv.length; i += 3) {
            const x = X0 + Math.floor(wv[i] * kx), y = Y0 + Math.floor(wv[i + 1] * ky), v = wv[i + 2];
            if (x < -8 || y < -4 || x > view.W || y > view.H) continue;
            const f = (ph + v) & 1;
            ctx.fillStyle = v === 0 ? P.cyan : P.blue;
            if (f === 0) { ctx.fillRect(x + 1, y, 2, 1); ctx.fillRect(x, y + 1, 1, 1); ctx.fillRect(x + 3, y + 1, 2, 1); }
            else { ctx.fillRect(x + 2, y, 2, 1); ctx.fillRect(x, y + 1, 2, 1); ctx.fillRect(x + 4, y + 1, 1, 1); }
          }
        }
      }
      toWorld(ctx);
    },

    drawGem(ctx, g, view) {
      const set = g.big ? SPR.gemBig : SPR.gem;
      const f = GEMSEQ[Math.floor(view.rt * 9 + g.seed * 6) % 6];
      const z = g.pop > 0 ? Math.round(Math.sin(g.pop * Math.PI) * 8) : 0;
      const bob = (Math.floor(view.rt * 2.5 + g.seed * 2) & 1);
      const img = set[f];
      blit(ctx, img, g.x, g.y, img.width >> 1, img.height - 1 + z + bob);
    },

    drawPlayer(ctx, p, view) {
      const frame = p.moving ? Math.floor(p.anim) & 1 : 0;
      const fl = p.facing < 0 ? 'l' : 'r';
      const bob = !p.moving && (Math.floor(view.rt * 1.8) & 1) ? 1 : 0;
      // dash: checker afterimages (no alpha on the NES)
      if (p.dashT > 0) {
        const gi = SPR.jackGhost[frame][fl];
        for (let k = 2; k >= 1; k--) blitFeet(ctx, gi, p.x - p.dashX * k * 9, p.y - p.dashY * k * 9);
      }
      // invulnerability: classic sprite flicker
      if (p.iframes > 0 && p.hurtT < 0.6 && (FR & 2)) return;
      const img = (p.hurtT > 0.6 ? SPR.jackFlash : SPR.jack)[frame][fl];
      blit(ctx, img, p.x, p.y, img.width >> 1, img.height - 1 + bob - (frame === 1 ? 0 : 0));
    },

    drawEnemy(ctx, e, view) {
      const fl = e.facing < 0 ? 'l' : 'r';
      const big = e.type === 'colossus';
      const midH = big ? 20 : e.type === 'ghost' ? 13 : 9; // body centre height in art px
      if (e.dying) {
        const f = Math.min(3, Math.floor(e.deathT * 4));
        const set = big ? SPR.boomBig : SPR.boom;
        blitMid(ctx, set[f], e.x, e.y - midH * PS);
        return;
      }
      if (e.spawnT < 0.6) {
        const f = Math.min(2, Math.floor(e.spawnT / 0.2));
        blitMid(ctx, SPR.poof[f], e.x, e.y - (big ? 10 : 6) * PS);
        return;
      }
      const fl2 = e.flash > 0.45;
      let img, lift = 0;
      if (e.type === 'ghost') {
        const f = Math.floor(view.rt * 3 + e.seed * 2) & 1;
        const par = ((FR >> 1) + (e.id | 0)) & 1;
        img = fl2 ? SPR.ghostF[f][fl] : SPR.ghost[f][par][fl];
        lift = 3 + (Math.floor(view.rt * 2 + e.seed * 6) & 1);
      } else if (big) {
        const f = Math.floor(e.anim * 1.2) & 1;
        img = (fl2 ? SPR.colossusF : SPR.colossus)[f][fl];
        if (e._lf !== f && !e.dying) {
          e._lf = f;
          view.game.addParticle({ x: e.x + (f ? 10 : -10), y: e.y, z: 1, kind: 'dust', life: 0.3 });
        }
      } else {
        const f = Math.floor(e.anim * 1.6) & 1;
        img = fl2 ? SPR.creeperF[f][fl] : SPR.creeper[e.seed < 0.55 ? 0 : 1][f][fl];
        lift = f;
      }
      blit(ctx, img, e.x, e.y, img.width >> 1, img.height - 1 + lift);
      // the last puff frame lingers over the freshly spawned enemy
      if (e.spawnT < 0.8) blitMid(ctx, SPR.poof[2], e.x, e.y - (big ? 10 : 6) * PS);
    },

    drawOrbital(ctx, o, view) {
      const img = SPR.lantern[Math.floor(view.rt * 4 + o.idx) & 1];
      blitMid(ctx, img, o.x, o.y);
    },

    drawProjectile(ctx, pr) {
      const img = SPR.seed[FR & 1];
      const x = sx(pr.x), y = sy(pr.y);
      toScreen(ctx);
      ctx.drawImage(img, x - 2, y - 2);
      // short dotted trail
      const sp = Math.hypot(pr.vx, pr.vy) || 1;
      const tx = Math.round(x - (pr.vx / sp) * 4), ty = Math.round(y - (pr.vy / sp) * 4);
      ctx.fillStyle = (FR & 1) ? P.gold : P.cream;
      ctx.fillRect(tx, ty, 1, 1);
      if (pr.age > 0.05) {
        ctx.fillStyle = P.orange;
        ctx.fillRect(Math.round(x - (pr.vx / sp) * 7), Math.round(y - (pr.vy / sp) * 7), 1, 1);
      }
      toWorld(ctx);
    },

    drawParticle(ctx, pt) {
      const k = 1 - pt.life / pt.max;
      const X = pt.x, Y = pt.y - pt.z;
      switch (pt.kind) {
        case 'boom': blitMid(ctx, (pt.big ? SPR.boomBig : SPR.boom)[Math.min(3, Math.floor(k * 4))], X, Y); return;
        case 'poof': blitMid(ctx, SPR.poof[Math.min(2, Math.floor(k * 3))], X, Y); return;
        case 'star': blitMid(ctx, (pt.cyan ? SPR.starC : SPR.star)[Math.min(2, Math.floor(k * 3))], X, Y); return;
        case 'dust': blitMid(ctx, SPR.dust[k < 0.5 ? 0 : 1], X, Y); return;
        default: {
          if (pt.life / pt.max < 0.3 && (FR & 1)) return;
          const s = pt.size >= 2 ? 2 : 1;
          toScreen(ctx);
          ctx.fillStyle = pt.color || P.w;
          ctx.fillRect(sx(X) - (s >> 1), sy(Y) - (s >> 1), s, s);
          toWorld(ctx);
        }
      }
    },

    drawNumber(ctx, n) {
      if (n.life / n.max < 0.25 && (FR & 2)) return;
      const img = numSprite(n.value, n.crit);
      blitMid(ctx, img, n.x, n.y);
    },

    drawDisplayOverlay(ctx, view) {
      // very subtle CRT scanlines: one dark display row at the bottom of every art-pixel row
      const up = view.up;
      if (up < 3) return;
      if (!this._scan || this._scan.up !== up) {
        const c = U.sprite(4, up, (g) => { g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, up - 1, 4, 1); });
        this._scan = { up, pat: ctx.createPattern(c, 'repeat') };
      }
      ctx.fillStyle = this._scan.pat;
      ctx.fillRect(0, 0, view.displayW, view.displayH);
    },

    drawIcon(ctx, id, size) {
      const c = iconCanvas(id);
      const s = Math.max(1, Math.floor(size / 16));
      ctx.imageSmoothingEnabled = false;
      const o = Math.floor((size - 16 * s) / 2);
      ctx.drawImage(c, o, o, 16 * s, 16 * s);
    },

    /* ---------- gameplay hooks → pixel particles ---------- */
    onHit(game, e) {
      const top = e.type === 'colossus' ? 30 : e.type === 'ghost' ? 18 : 14;
      const cols = e.type === 'ghost' ? [P.w, P.cyan] : e.type === 'colossus' ? [P.ochre, P.purple] : [P.cream, e.seed < 0.55 ? P.purple : P.magenta];
      for (let k = 0; k < 2; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: e.x, y: e.y, z: top, vx: Math.cos(a) * 40, vy: Math.sin(a) * 15, vz: 30 + Math.random() * 30, grav: 160, drag: 1, life: 0.35, size: 2, color: cols[k], kind: 'px' });
      }
      game.addParticle({ x: e.x + (Math.random() - 0.5) * 6, y: e.y, z: top, kind: 'px', color: P.w, size: 1, life: 0.08 });
    },
    onKill(game, e) {
      const big = e.type === 'colossus';
      const top = big ? 30 : e.type === 'ghost' ? 20 : 14;
      const cols = e.type === 'ghost' ? [P.w, P.cyan, P.w] : big ? [P.ochre, P.purple, P.gold, P.br0] : [P.cream, e.seed < 0.55 ? P.purple : P.magenta, P.gr1];
      const n = big ? 14 : 6;
      for (let k = 0; k < n; k++) {
        const a = Math.random() * U.TAU, s = (big ? 70 : 50) * (0.5 + Math.random() * 0.7);
        game.addParticle({ x: e.x, y: e.y, z: top * (0.5 + Math.random() * 0.6), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 50, grav: 220, drag: 1, life: 0.6 + Math.random() * 0.3, size: 2, color: cols[k % cols.length], kind: 'px' });
      }
      if (big) {
        for (let k = 0; k < 3; k++) game.addParticle({ x: e.x + (Math.random() - 0.5) * 30, y: e.y, z: 10 + Math.random() * 30, kind: 'boom', life: 0.4, drag: 0 });
      }
    },
    onHurt(game, p) {
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: p.x, y: p.y, z: 18, vx: Math.cos(a) * 55, vy: Math.sin(a) * 25, vz: 40 + Math.random() * 30, grav: 220, life: 0.5, size: 2, color: k % 2 ? P.orange : P.yellow, kind: 'px' });
      }
      game.addParticle({ x: p.x, y: p.y, z: 16, kind: 'star', life: 0.2, drag: 0 });
    },
    onPickup(game, g) {
      game.addParticle({ x: g.x, y: g.y, z: 6, vz: 10, kind: 'star', cyan: !g.big, life: 0.24, drag: 0 });
    },
    onShoot() {},
    onDash(game, p) {
      game.addParticle({ x: p.x - p.dashX * 6, y: p.y, z: 3, kind: 'dust', life: 0.3 });
      game.addParticle({ x: p.x - p.dashX * 14, y: p.y - p.dashY * 6, z: 3, kind: 'dust', life: 0.4 });
    },
    onLevelUp(game, p) {
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * U.TAU;
        game.addParticle({ x: p.x + Math.cos(a) * 10, y: p.y + Math.sin(a) * 5, z: 14, vx: Math.cos(a) * 60, vy: Math.sin(a) * 30, vz: 20, drag: 1.5, kind: 'star', life: 0.5 + (k % 3) * 0.1 });
      }
    },
    onDeath(game, p) {
      for (let k = 0; k < 5; k++) game.addParticle({ x: p.x + (Math.random() - 0.5) * 30, y: p.y, z: 8 + Math.random() * 24, kind: 'boom', big: k === 0, life: 0.45 + k * 0.08, drag: 0 });
    },
  };
  Styles.register(st);
})();
