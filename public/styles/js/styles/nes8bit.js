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
    // flower beds: a few heads around a centre, white/gold and the odd red one
    const fb = { w: C3(P.w), y: C3(P.gold), r: C3(P.red), s: C3(P.gr1) };
    GL.bed = [
      glyph(['.w...', 'wyw.w', '.w.wyw', '.s..w.', '..s.s.'], fb),
      glyph(['..y..y.', '.yry.yry', '..y..y.', 'w..s..s.', '.s......'], fb),
      glyph(['w.w..', '.y...', 'w.w.y', '..s.yry', '....y..'], fb),
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
    const M = 14, EW = N + 2 * M, ex0 = gx0 - M, ey0 = gy0 - M;
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
    const rdist = new Float32Array(EW * EW);   // distance to the road centre (road pixels only) for wheel ruts
    for (let py = 0; py < EW; py++) {
      const gy = ey0 + py;
      if (py > 0 && (gy & 1) === 1) { mat.copyWithin(py * EW, (py - 1) * EW, py * EW); rdist.copyWithin(py * EW, (py - 1) * EW, py * EW); continue; }
      const cy = 2 * (gy >> 1) + 1, v = (cy - ey0) / ST;
      let prev = 0, prevD = 0;
      for (let px = 0; px < EW; px++) {
        const gx = ex0 + px;
        if (px > 0 && (gx & 1) === 1) { mat[py * EW + px] = prev; rdist[py * EW + px] = prevD; continue; }
        const cx = 2 * (gx >> 1) + 1, u = (cx - ex0) / ST;
        let m = -1, rd = 0;
        for (let q = 0; q < plz.length; q++) if (inPlaza(plz[q], cx, cy)) { m = PL; break; }
        if (m < 0) {
          if (bil(fW, u, v) < WTH) m = WA;
          else {
            rd = Math.min(Math.abs(bil(fA, u, v)), Math.abs(bil(fB, u, v)));
            m = rd < RHW ? RD : bil(fF, u, v) > FTH ? FO : GR;
          }
        }
        mat[py * EW + px] = prev = m;
        rdist[py * EW + px] = prevD = rd;
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
            if (hasG) { col = GC.k; e = 1; } else if (hasW || hasR) { col = GC.forestLip; e = 1; }
            else if (((gx + gy) & 1) === 0 && (mat[i - 2] === GR || mat[i + 2] === GR || mat[i - 2 * EW] === GR || mat[i + 2 * EW] === GR ||
              ((((gx >> 1) + (gy >> 1)) & 1) === 0 && (mat[i - 3] === GR || mat[i + 3] === GR || mat[i - 3 * EW] === GR || mat[i + 3 * EW] === GR)))) col = GC.k;   // canopy shade band, dithered
            else col = GC.forest;
          } else {
            if (hasW) { col = GC.roadLip; e = 1; } else if (hasG || hasF) { col = GC.roadEdge; e = 1; }
            else {
              // two worn wheel ruts, broken every few pixels so they read as tracks, not as drawn lines
              const rd = rdist[i];
              col = Math.abs(rd - 5.4) < 0.6 && U.hashInt(gx >> 3, gy >> 3, 91) % 7 !== 0 ? GC.roadEdge : GC.road;
            }
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
    // is another material within d px? (the margin M keeps this identical in neighbouring chunks)
    const near = (ax, ay, d, own) => {
      const lx = ax - ex0, ly = ay - ey0;
      for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) {
        const x = lx + dx, y = ly + dy;
        if (x >= 0 && y >= 0 && x < EW && y < EW && mat[y * EW + x] !== own) return true;
      }
      return false;
    };
    // grass: calm open meadow; tufts gather along every edge (forest, road, pond) and in a few tall-grass patches
    yield* stamps(6, 5101, GR, (ax, ay, r, h) => {
      if (near(ax, ay, 5, GR)) return r < 0.7 ? (r < 0.3 ? GL.tall[(h >>> 4) % 3] : GL.tuft[(h >>> 4) & 3]) : null;
      const cl = U.fbm(ax * pw / 150, ay * pw / 150, 515, 2);
      if (cl > 0.66) return r < 0.8 ? GL.tall[(h >>> 4) % 3] : null;
      if (cl > 0.58) return r < 0.45 ? GL.tuft[(h >>> 4) & 3] : null;
      return r < 0.018 ? GL.tuft[(h >>> 4) & 3] : null;
    });
    // flowers grow in designed little beds of 3-7 heads, not as confetti
    yield* stamps(23, 5203, GR, (ax, ay, r, h) => {
      if (near(ax, ay, 7, GR)) return null;
      const fl = U.fbm(ax * pw / 200 + 9, ay * pw / 200, 616, 2);
      return fl > 0.6 && r < 0.55 ? GL.bed[(h >>> 4) % GL.bed.length] : null;
    });
    // forest floor: leaf litter drifts in clumps, twigs near the shaded rim
    yield* stamps(5, 5301, FO, (ax, ay, r, h) => {
      const lf = U.fbm(ax * pw / 110 - 3, ay * pw / 110, 717, 2);
      return r < (lf > 0.56 ? 0.6 : 0.05) ? GL.leaf[(h >>> 4) % GL.leaf.length] : null;
    });
    yield* stamps(15, 5303, FO, (ax, ay, r, h) => (near(ax, ay, 9, FO) && r < 0.5 ? GL.twig[(h >>> 4) % 3] : null));
    // roads: pebbles collect on the shoulders, the centre stays clean
    yield* stamps(6, 5401, RD, (ax, ay, r, h) => (near(ax, ay, 3, RD) && r < 0.55 ? GL.pebble[(h >>> 4) % GL.pebble.length] : null));

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
     Characters – every figure is built from posed parts on a char grid and baked lazily
     per pose (key → {r, l}); real cycles instead of 2-frame shuffles:
     main character 8-frame walk (contact-down-pass-up ×2) with counter-swinging arms,
     head lagging one frame and a scarf that flaps a frame behind; turnips hop with
     squash & stretch while their leaf crowns lag; ghosts float on an eased bob; the large
     creature stomps with a body drop and dust on every contact.
     ===================================================================== */
  const poseCache = new Map();
  function baked(key, build) {
    let s = poseCache.get(key);
    if (!s) { s = build(); poseCache.set(key, s); }
    return s;
  }
  const seq = (t, fps, n) => ((Math.floor(t * fps) % n) + n) % n;
  const phaseOf = (o) => (o.__ph === undefined ? (o.__ph = o.seed !== undefined ? o.seed * 10 : Math.random() * 10) : o.__ph);

  /* ---------- main character: carved pumpkin head, green scarf, blue tunic ---------- */
  const HW = 16, HH = 20, HF = HH - 3;   // grid size, first leg row (feet on the last row)
  const HERO_PAL = { o: P.orange, h: P.lorange, d: P.red0, y: P.yellow, g: P.gr1, G: P.gr0, l: P.gr2, b: P.blue2, n: P.navy, c: P.cream, r: P.br0, k: P.k };
  const HERO_WHITE = { o: P.w, h: P.w, d: P.g1, y: P.gold, g: P.w, G: P.g1, l: P.w, b: P.w, n: P.g1, c: P.w, r: P.g1, k: P.g2 };
  const HERO_RED = { o: P.red, h: P.lorange, d: P.red0, y: P.yellow, g: P.red, G: P.red0, l: P.lorange, b: P.red, n: P.red0, c: P.lorange, r: P.red0, k: P.red0 };
  const HERO_AFTER = { o: P.orange, h: P.orange, d: P.orange, y: P.orange, g: P.orange, G: P.orange, l: P.orange, b: P.orange, n: P.orange, c: P.orange, r: P.orange, k: P.orange };
  // legs: [x0, x1, row, char] – far leg black, near leg navy ending in a brown boot
  const LEGS = {
    stand: { far: [[5, 6, 0], [5, 6, 1], [5, 7, 2]], near: [[8, 9, 0], [8, 9, 1], [8, 10, 2, 'r']] },
    cA: { far: [[5, 6, 0], [4, 5, 1], [3, 4, 2]], near: [[8, 9, 0], [9, 10, 1], [10, 12, 2, 'r']] },
    pA: { far: [[5, 6, 0], [6, 8, 1]], near: [[7, 8, 0], [7, 8, 1], [7, 9, 2, 'r']] },
    uA: { far: [[6, 7, 0], [8, 10, 1]], near: [[7, 8, 0], [7, 8, 1], [6, 8, 2, 'r']] },
    cB: { far: [[7, 8, 0], [8, 9, 1], [9, 11, 2]], near: [[6, 7, 0], [5, 6, 1], [4, 5, 2, 'r']] },
    pB: { far: [[6, 7, 0], [6, 7, 1], [6, 8, 2]], near: [[8, 9, 0], [9, 11, 1, 'r']] },
    uB: { far: [[6, 7, 0], [6, 7, 1], [5, 7, 2]], near: [[8, 9, 0], [10, 12, 1, 'r']] },
    crouch: { far: [[3, 5, 2]], near: [[9, 11, 2, 'r']] },
    split: { far: [[5, 5, 0], [3, 4, 1], [1, 2, 1]], near: [[9, 10, 0], [11, 12, 1], [13, 14, 1, 'r']] },
    skid: { far: [[5, 6, 0], [4, 5, 1], [3, 5, 2]], near: [[8, 9, 0], [9, 10, 1], [10, 13, 2, 'r']] },
    hurt: { far: [[5, 6, 0], [4, 5, 1], [3, 5, 2]], near: [[8, 9, 0], [9, 10, 1], [10, 11, 2, 'r']] },
  };
  // arms relative to the torso top row: sleeve pixels + hand
  const ARM_N = { n: [[7, 1], [7, 2]], f: [[8, 1], [9, 2]], b: [[6, 1], [5, 2], [4, 2]], t: [[8, 1], [9, 1], [10, 1]], up: [[9, 0], [10, -1]], dash: [[6, 1], [5, 1], [4, 1]] };
  const HAND_N = { n: [7, 3], f: [10, 3], b: [3, 3], t: [11, 1], up: [11, -2], dash: [3, 2] };
  const ARM_F = { f: [[10, 1]], b: [[3, 1], [3, 2]], up: [[3, 0], [2, -1]], dash: [[3, 1], [2, 1]] };
  const HAND_F = { f: [11, 2], b: [2, 3], up: [1, -2], dash: [1, 1] };
  const SCARF = {
    hang: [[3, 0, 'g'], [3, 1, 'g'], [2, 2, 'g'], [2, 3, 'G']],
    w0: [[3, 0, 'g'], [2, 0, 'g'], [1, 1, 'g'], [0, 1, 'G']],
    w1: [[3, 0, 'g'], [2, 1, 'g'], [1, 1, 'g'], [0, 2, 'G']],
    dash: [[3, 0, 'g'], [2, 0, 'g'], [1, 0, 'g'], [0, -1, 'G'], [1, -1, 'G']],
  };
  function heroGrid(o) {
    const g = cg(HW, HH);
    const tx = o.tx || 0, hx = o.hx || 0, T = HF - 5 + o.bob;
    const put = (pts, ch, dx, dy) => { for (const q of pts) g.set(q[0] + dx, q[1] + dy, q[2] || ch); };
    if (ARM_F[o.fa]) { put(ARM_F[o.fa], 'k', tx, T); g.set(HAND_F[o.fa][0] + tx, HAND_F[o.fa][1] + T, 'c'); }
    const L = LEGS[o.legs];
    for (const [leg, ch] of [[L.far, 'k'], [L.near, 'n']]) {
      for (const s of leg) for (let x = s[0]; x <= s[1]; x++) g.set(x, HF + s[2], s[3] || ch);
      if (o.bob < 0) for (let x = leg[0][0]; x <= leg[0][1]; x++) g.set(x, HF - 1, ch);   // hip fills the gap
    }
    put(SCARF[o.sc], 'g', tx, T);
    // torso: scarf collar, tunic, belt with a buckle, darker hem (light from above)
    for (let y = 0; y < 5; y++) for (let x = 4; x <= 9; x++) {
      if (y === 4 && (x === 4 || x === 9)) continue;
      let ch = y === 0 ? (x === 9 ? 'G' : 'g') : y === 3 ? (x === 7 ? 'c' : 'r') : y === 4 ? 'n' : 'b';
      g.set(x + tx, T + y, ch);
    }
    if (ARM_N[o.na]) { put(ARM_N[o.na], 'n', tx, T); g.set(HAND_N[o.na][0] + tx, HAND_N[o.na][1] + T, 'c'); }
    // pumpkin head: ribs top and bottom, shaded underside, warm glint, carved face turned to the front
    const Ht = T - 8 + (o.hb || 0), X = 2 + hx;
    for (let y = 0; y < 9; y++) for (let x = 0; x < 12; x++) {
      const nx = (x + 0.5 - 6) / 6, ny = (y + 0.5 - 4.5) / 4.5;
      if (nx * nx + ny * ny > 1.06) continue;
      let ch = 'o';
      if (ny > 0.62) ch = 'd';
      else if ((x === 3 || x === 8) && (y <= 1 || y >= 6)) ch = 'd';
      g.set(x + X, Ht + y, ch);
    }
    g.set(X + 3, Ht + 1, 'h'); g.set(X + 4, Ht + 1, 'h'); g.set(X + 2, Ht + 2, 'h');
    const eye = (cx, mode) => {
      if (mode === 'blink') { for (let k = -1; k <= 1; k++) g.set(X + cx + k, Ht + 4, 'd'); return; }
      if (mode === 'hurt') { for (let k = -1; k <= 1; k++) g.set(X + cx + k, Ht + 4, 'y'); return; }
      g.set(X + cx, Ht + 3, 'y'); for (let k = -1; k <= 1; k++) g.set(X + cx + k, Ht + 4, 'y');
    };
    eye(5, o.face); eye(9, o.face);
    if (o.face === 'hurt') { for (let x = 6; x <= 8; x++) { g.set(X + x, Ht + 6, 'y'); g.set(X + x, Ht + 7, 'y'); } }
    else { for (let x = 4; x <= 10; x++) if (x !== 7) g.set(X + x, Ht + 6, 'y'); for (let x = 6; x <= 8; x++) g.set(X + x, Ht + 7, 'y'); }
    // curled stem + a leaf that lags behind the head
    g.set(X + 6, Ht - 1, 'G'); g.set(X + 5, Ht - 2, 'g');
    if (o.leaf) { g.set(X + 7, Ht - 2, 'l'); g.set(X + 8, Ht - 2, 'l'); } else { g.set(X + 7, Ht - 1, 'l'); g.set(X + 8, Ht - 1, 'l'); }
    return g;
  }
  const PAL_BY = [HERO_PAL, HERO_WHITE, HERO_RED];
  function heroSprite(o, pal) {
    const key = 'h' + pal + o.legs + o.bob + '|' + (o.hb || 0) + (o.hx || 0) + (o.tx || 0) + o.na + o.fa + o.sc + o.face + o.leaf;
    return baked(key, () => {
      const rows = heroGrid(o).rows();
      return pal === 3 ? pair(mk(rows, HERO_AFTER, { outline: false, checker: 0 })) : pair(mk(rows, PAL_BY[pal]));
    });
  }
  const WALK = [
    { legs: 'cA', bob: 0, na: 'b', fa: 'f' }, { legs: 'cA', bob: 1, na: 'b', fa: 'f' },
    { legs: 'pA', bob: 0, na: 'n', fa: 'h' }, { legs: 'uA', bob: -1, na: 'n', fa: 'h' },
    { legs: 'cB', bob: 0, na: 'f', fa: 'b' }, { legs: 'cB', bob: 1, na: 'f', fa: 'b' },
    { legs: 'pB', bob: 0, na: 'n', fa: 'h' }, { legs: 'uB', bob: -1, na: 'n', fa: 'h' },
  ];
  WALK.forEach((w, i) => {
    w.hb = WALK[(i + 7) & 7].bob - w.bob;            // the head arrives one frame later
    w.sc = (((i + 1) >> 1) & 1) ? 'w1' : 'w0';        // scarf flaps a frame behind the step
    w.leaf = w.hb > 0 ? 1 : 0;
    w.face = 'n';
  });
  const DASH_WIND = { legs: 'crouch', bob: 2, hb: 0, na: 'b', fa: 'b', sc: 'hang', face: 'n', leaf: 1 };
  const DASH_GO = { legs: 'split', bob: 0, hb: 1, hx: 2, tx: 1, na: 'dash', fa: 'dash', sc: 'dash', face: 'n', leaf: 0 };
  const SKID = { legs: 'skid', bob: 1, hb: 0, hx: -1, na: 'f', fa: 'b', sc: 'w1', face: 'n', leaf: 1 };
  const HURT = { legs: 'hurt', bob: 0, hb: -1, hx: -1, na: 'up', fa: 'up', sc: 'w0', face: 'hurt', leaf: 1 };

  /* ---------- small creature: hopping turnip / radish with a leaf crown ---------- */
  const CW = 15, CH = 18;
  // hop cycle: body half-width, height, bottom row, legs, crown pose (0 lifted, 1 normal, 2 droopy)
  const HOP = [
    { w: 6.3, h: 8, b: 15, legs: 'splay', sp: 2 },   // land: squash, crown flops
    { w: 5.3, h: 9, b: 15, legs: 'stand', sp: 1 },   // push off
    { w: 4.7, h: 10, b: 13, legs: 'tuck', sp: 2 },   // airborne: stretch, crown lags down
    { w: 5.3, h: 9, b: 14, legs: 'reach', sp: 0 },   // falling: crown lifts
  ];
  const CROWN = [
    [ // turnip: three-leaf fan
      [[0, -1, 'G'], [0, -2], [0, -3], [0, -4], [-1, -1], [-1, -2], [-2, -3], [1, -1], [1, -2], [2, -3]],
      [[0, -1, 'G'], [0, -2], [0, -3], [1, -4], [-1, -1], [-2, -2], [-3, -3], [1, -1], [2, -2], [3, -2]],
      [[0, -1, 'G'], [0, -2], [1, -3], [-1, -1], [-2, -1], [-3, -2], [-4, -2], [1, -1], [2, -1], [3, -1], [4, -2]],
    ],
    [ // radish: two long curling leaves
      [[0, -1, 'G'], [-1, -2], [-1, -3], [-2, -4], [1, -2], [1, -3], [2, -4], [2, -3, 'G']],
      [[0, -1, 'G'], [-1, -2], [-2, -3], [-3, -3], [1, -2], [2, -3], [3, -4], [3, -3, 'G']],
      [[0, -1, 'G'], [-1, -1], [-2, -2], [-3, -2], [-4, -1], [1, -1], [2, -2], [3, -2], [4, -1, 'G']],
    ],
  ];
  const CREEP_PAL = [
    { P: P.purple, p: P.pink, c: P.cream, w: P.w, g: P.gr1, G: P.gr0, k: P.k },
    { P: P.crim, p: P.red, c: P.cream, w: P.w, g: P.gr1, G: P.gr0, k: P.k },
  ];
  const CREEP_FLASH = { P: P.w, p: P.w, c: P.w, w: P.red, g: P.w, G: P.w, k: P.red };
  function creeperGrid(f, kind, face) {
    const g = cg(CW, CH), H = HOP[f];
    const w = H.w - kind * 0.6, h = H.h + kind, top = H.b - h + 1, cy = top + h / 2, cx = 7.5;
    for (let y = top; y <= H.b; y++) for (let x = 0; x < CW; x++) {
      const nx = (x + 0.5 - cx) / w, ny = (y + 0.5 - cy) / (h / 2);
      if (nx * nx + ny * ny > 1.02) continue;
      let ch = ny < -0.04 ? 'P' : ny < 0.14 ? (((x + y) & 1) ? 'P' : 'c') : 'c';
      if (nx > -0.7 && nx < -0.15 && ny > -0.85 && ny < -0.45) ch = 'p';
      g.set(x, y, ch);
    }
    // face turned to the front (right)
    const ey = top + Math.round(h * 0.36), my = top + Math.round(h * 0.68);
    if (face === 'hit') {
      for (const ex of [5, 10]) { g.set(ex - 1, ey + 1, 'k'); g.set(ex, ey + 1, 'k'); g.set(ex + 1, ey + 1, 'k'); }
      for (let x = 7; x <= 9; x++) { g.set(x, my, 'k'); g.set(x, my + 1, 'k'); }
    } else {
      for (const ex of [5, 9]) {
        g.set(ex, ey, 'k'); g.set(ex + 1, ey, 'w'); g.set(ex, ey + 1, 'k'); g.set(ex + 1, ey + 1, 'k');
      }
      g.set(4, ey - 1, 'k'); g.set(5, ey - 1, 'k'); g.set(10, ey - 1, 'k'); g.set(11, ey - 1, 'k');   // angry brows
      g.set(6, ey - 1, 'P'); g.set(9, ey - 1, 'P');
      for (let x = 5; x <= 10; x++) g.set(x, my, x === 6 || x === 9 ? 'w' : 'k');
      for (let x = 6; x <= 9; x++) g.set(x, my + 1, 'k');
    }
    // leaf crown
    for (const q of CROWN[kind][H.sp]) g.set(7 + q[0], top + q[1] + 1, q[2] || 'g');
    // root legs / tap root
    const b = H.b;
    if (H.legs === 'splay') { g.set(4, b + 1, 'c'); g.set(3, b + 2, 'c'); g.set(11, b + 1, 'c'); g.set(12, b + 2, 'c'); }
    else if (H.legs === 'stand') { g.set(5, b + 1, 'c'); g.set(5, b + 2, 'c'); g.set(10, b + 1, 'c'); g.set(10, b + 2, 'c'); }
    else if (H.legs === 'tuck') { g.set(6, b + 1, 'c'); g.set(9, b + 1, 'c'); g.set(7, b + 2, 'c'); }
    else { g.set(5, b + 1, 'c'); g.set(4, b + 2, 'c'); g.set(10, b + 1, 'c'); g.set(11, b + 2, 'c'); }
    return g;
  }
  function creeperSprite(f, kind, pal, face) {
    return baked('c' + f + kind + pal + face, () => {
      const rows = creeperGrid(f, kind, face).rows();
      return pal === 9 ? pair(mk(rows, CREEP_FLASH, { oc: P.red })) : pair(mk(rows, CREEP_PAL[pal]));
    });
  }

  /* ---------- fast creature: hooded sheet ghost reaching forward, checker tail ---------- */
  const GW = 16, GHt = 19, GTAIL = 11;
  function ghostGrid(f, arm, mouth, stretch) {
    const g = cg(GW, GHt);
    const cx = 7.5;
    for (let y = 0; y < GHt; y++) {
      let hw, off = 0;
      if (y <= 5) { const ny = (5.5 - y) / 5.8; hw = 5.6 * Math.sqrt(Math.max(0, 1 - ny * ny)); }
      else if (y < GTAIL) hw = 5.6 - (y - 6) * 0.15;
      else {
        const k = (y - GTAIL) / (GHt - GTAIL);
        hw = 4.8 * (1 - k) + 0.6;
        off = Math.round(Math.sin(f * Math.PI / 2 + y * 0.8) * 1.3 - k * 3);
      }
      if (stretch) hw *= 0.82;
      for (let x = 0; x < GW; x++) {
        const dx = x + 0.5 - cx - off;
        if (Math.abs(dx) > hw) continue;
        let ch = 'W';
        if (y >= 8 && y < GTAIL) ch = dx < -hw + 1.6 || y === GTAIL - 1 ? 'B' : 'W';
        else if (y >= GTAIL) ch = Math.abs(dx) > hw - 1.4 ? 'B' : 'W';
        else if (y <= 1 && dx > 0) ch = 'W';
        g.set(x, y, ch);
      }
    }
    // hood peak, hollow eyes, open mouth
    g.set(6, 0, 'W'); g.set(5, 0, 'B');
    for (let y = 3; y <= 5; y++) for (const x of [8, 9, 11, 12]) g.set(x, y, 'k');
    g.set(9, 3, 'B'); g.set(12, 3, 'B');   // a cold glint in each eye
    if (mouth) { g.set(10, 7, 'k'); g.set(11, 7, 'k'); g.set(10, 8, 'k'); g.set(11, 8, 'k'); }
    else { g.set(10, 8, 'k'); g.set(11, 8, 'k'); }
    // reaching arm
    if (arm) { g.set(13, 7, 'W'); g.set(14, 8, 'W'); g.set(14, 9, 'B'); }
    else { g.set(13, 8, 'W'); g.set(14, 8, 'W'); g.set(15, 8, 'B'); }
    return g;
  }
  const GHOST_PAL = { W: P.w, B: P.cyan, k: P.k };
  const GHOST_FLASH = { W: P.yellow, B: P.red, k: P.k };
  function ghostSprite(f, arm, mouth, par, flash, stretch) {
    return baked('g' + f + arm + mouth + par + flash + (stretch ? 1 : 0), () => {
      const rows = ghostGrid(f, arm, mouth, stretch).rows();
      return pair(mk(rows, flash ? GHOST_FLASH : GHOST_PAL, { tailFrom: GTAIL, parity: par }));
    });
  }

  /* ---------- large creature: turnip-headed sack golem with root fists ---------- */
  const KW = 28, KHt = 34;
  const STOMP = [
    { bob: 1, legs: [-1, 1], arm: 1, sp: 2 },   // contact (left foot fwd): body drops, crown flops
    { bob: 0, legs: [0, 0], arm: 0, sp: 1 },    // passing
    { bob: 1, legs: [1, -1], arm: -1, sp: 2 },  // contact (right foot fwd)
    { bob: -1, legs: [0, 0], arm: 0, sp: 0 },   // up: crown lifts
  ];
  function colossusGrid(f, face) {
    const g = cg(KW, KHt), S = STOMP[f];
    const ground = KHt - 1, legTop = ground - 4, bodyBot = legTop + S.bob, bodyTop = bodyBot - 11;
    const headBot = bodyTop + 2, headTop = headBot - 11, cx = 13.5;
    // stumpy legs
    for (const [lx, dir] of [[9, S.legs[0]], [16, S.legs[1]]]) {
      for (let y = legTop; y <= ground; y++) for (let x = lx; x < lx + 3; x++) g.set(x + (y > legTop + 1 ? dir : 0), y, y === ground ? 'k' : 'd');
      g.set(lx + 3 + (dir > 0 ? dir : 0), ground, 'k');
    }
    // sack body (ochre burlap, darker hem, stitched seam, a patch)
    for (let y = bodyTop; y <= bodyBot; y++) {
      const k = (y - bodyTop) / 11, hw = 6 + k * 2.4;
      for (let x = 0; x < KW; x++) {
        const dx = x + 0.5 - cx;
        if (Math.abs(dx) > hw) continue;
        let ch = y >= bodyBot - 1 ? 'd' : 'a';
        if (Math.abs(dx) > hw - 1 && y > bodyTop + 2) ch = 'd';
        if (x === 13 && y > bodyTop + 2 && y < bodyBot - 1 && (y & 1)) ch = 'k';
        if (x >= 16 && x <= 18 && y >= bodyTop + 5 && y <= bodyTop + 7) ch = (x + y) & 1 ? 'y' : 'a';
        g.set(x, y, ch);
      }
    }
    // swinging root arms with cream fists
    for (const [ax, sgn] of [[4, -1], [23, 1]]) {
      const sw = S.arm * sgn;
      for (let i = 0; i < 7; i++) { const x = ax + Math.round(sw * i / 4); g.set(x, bodyTop + 2 + i, 'a'); g.set(x + (sgn < 0 ? 1 : -1), bodyTop + 2 + i, i < 2 ? 'a' : 'd'); }
      const hx = ax + Math.round(sw * 7 / 4);
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1], [-1, 2], [1, 2]]) g.set(hx + dx, bodyTop + 9 + dy, 'c');
    }
    // turnip head
    for (let y = headTop; y <= headBot; y++) for (let x = 0; x < KW; x++) {
      const nx = (x + 0.5 - cx) / 8.6, ny = (y + 0.5 - (headTop + headBot + 1) / 2) / 6;
      if (nx * nx + ny * ny > 1) continue;
      let ch = ny < -0.05 ? 'P' : ny < 0.25 ? (((x + y) & 1) ? 'P' : 'c') : 'c';
      if (nx > -0.75 && nx < -0.3 && ny > -0.9 && ny < -0.5) ch = 'p';
      g.set(x, y, ch);
    }
    const ey = headTop + 4;
    if (face === 'hit') { for (const ex of [9, 17]) for (let k = -1; k <= 2; k++) g.set(ex + k, ey + 1, 'k'); }
    else {
      for (const ex of [9, 17]) { g.set(ex, ey, 'y'); g.set(ex + 1, ey, 'y'); g.set(ex, ey + 1, 'y'); g.set(ex + 1, ey + 1, 'k'); g.set(ex - 1, ey - 1, 'k'); g.set(ex + 2, ey - 1, 'k'); }
      g.set(10, ey - 1, 'k'); g.set(16, ey - 1, 'k');
    }
    const my = headTop + 8;
    for (let x = 9; x <= 18; x++) g.set(x, my, (x & 1) ? 'c' : 'k');
    for (let x = 10; x <= 17; x++) g.set(x, my + 1, 'k');
    // five-leaf crown
    const sp = S.sp;
    const leaves = [[0, 5, 0], [-2, 4, -1], [2, 4, 1], [-4, 3, -2], [4, 3, 2]];
    for (const [lx, len, lean] of leaves) {
      for (let i = 1; i <= len; i++) {
        const dx = Math.round(lx + lean * i * (sp === 2 ? 0.9 : sp === 1 ? 0.55 : 0.3)), dy = -i + (sp === 2 && Math.abs(lean) > 1 ? Math.floor(i / 2) : 0);
        g.set(13 + dx, headTop + dy, i === 1 ? 'G' : 'g');
        if (i < len - 1) g.set(14 + dx, headTop + dy, 'g');
      }
    }
    return g;
  }
  const COLO_PAL = { P: P.purple, p: P.pink, c: P.cream, a: P.ochre, d: P.br0, y: P.gold, g: P.gr1, G: P.gr0, k: P.k };
  const COLO_FLASH = { P: P.w, p: P.w, c: P.w, a: P.yellow, d: P.red, y: P.red, g: P.w, G: P.w, k: P.red };
  function colossusSprite(f, flash, face) {
    return baked('k' + f + flash + face, () => pair(mk(colossusGrid(f, face).rows(), flash ? COLO_FLASH : COLO_PAL, flash ? { oc: P.red } : {})));
  }

  /* ---------- orbiting lantern: purple cap, bail handle, 3-step glow ---------- */
  function lanternFrames() {
    const rows = [
      '...kkk...', '..k...k..', '....g....', '..PPPPP..', '.PPpPPPP.', '.cPcPcPc.', '.cyyLyyc.', '.cyLLLyc.', '.cyyLyyc.', '.ccccccc.', '..ccccc..', '...c.c...',
    ];
    return [[P.gold, P.yellow], [P.yellow, P.w], [P.gold, P.gold]].map(([y, L]) => mk(rows, { P: P.purple, p: P.pink, c: P.cream, y, L, g: P.gr1, k: P.k }));
  }

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

  // impact: white cross flash → gold/red X sparks → four far dots
  function hitFrames() {
    const map = { W: P.w, y: P.gold, r: P.red };
    return [
      mk(['...W...', '...W...', '..WWW..', 'WWWWWWW', '..WWW..', '...W...', '...W...'], map, { outline: false }),
      mk(['y.......y', '.y.....y.', '..r...r..', '....W....', '...WWW...', '....W....', '..r...r..', '.y.....y.', 'y.......y'], map, { outline: false }),
      mk(['y.........y', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', 'y.........y'], map, { outline: false }),
    ];
  }
  // pickup: expanding diamond outline, cyan or gold
  function ringFrames(col) {
    const out = [];
    for (const R of [3, 5, 7]) {
      const S = 2 * R + 1, g = cg(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.abs(x - R) + Math.abs(y - R);
        if (d === R) g[y][x] = R === 7 && ((x + y) & 1) ? '.' : 'c';
        else if (R === 3 && d === 0) g[y][x] = 'W';
      }
      out.push(mk(g.rows(), { c: col, W: P.w }, { outline: false }));
    }
    return out;
  }
  // light column (glow-up): checker pillar, two parities so it shimmers
  function beamFrames() {
    return [0, 1].map((par) => {
      const g = cg(9, 40);
      for (let y = 0; y < 40; y++) for (let x = 0; x < 9; x++) {
        const edge = x === 0 || x === 8, core = x >= 3 && x <= 5;
        if (core && ((y + par) % 3)) g[y][x] = 'W';
        else if (!edge && ((x + y + par) & 1) === 0) g[y][x] = y < 6 && ((y + par) & 1) ? '.' : 'y';
        else if (edge && ((y + par) & 3) === 0) g[y][x] = 'y';
      }
      return mk(g.rows(), { W: P.w, y: P.gold }, { outline: false });
    });
  }
  // spinning leaf scrap (death debris)
  const leafBits = () => [['gg', '.g'], ['g.', 'gg'], ['.g', 'gg'], ['gg', 'g.']].map((r) => mk(r, { g: P.gr1 }));
  // thrown pumpkin seed, 4 rotation steps
  const seedFrames = () => [['ccs'], ['..c', '.c.', 's..'], ['c', 'c', 's'], ['c..', '.c.', '..s']].map((r) => mk(r, { c: P.cream, s: P.ochre }));
  // spawn: dirt mound that heaves twice
  function moundFrames(big) {
    const W = big ? 20 : 12, out = [];
    for (let f = 0; f < 3; f++) {
      const h = [2, 3, 4][f] + (big ? 2 : 0), g = cg(W, h + 1);
      for (let y = 0; y <= h; y++) for (let x = 0; x < W; x++) {
        const nx = (x + 0.5 - W / 2) / (W / 2), ny = (h - y + 0.5) / (h + 0.5);
        if (nx * nx + ny * ny > 1) continue;
        g[y][x] = y === 0 || ((x * 7 + y * 3 + f) % 5 === 0) ? 'a' : 'd';
      }
      if (f === 2) for (let k = 0; k < 3; k++) g.set(Math.floor(W / 2) - 2 + k * 2, 0, (k & 1) ? 'g' : '.');
      out.push(mk(g.rows(), { a: P.ochre, d: P.br0, g: P.gr1 }));
    }
    return out;
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
  // pine: three stacked tiers, light ticks on the left rims, checker shade on the right half
  function makePine(seed) {
    const W = 17, H = 31, g = cg(W, H), r = U.rng(seed);
    const tiers = [[0, 9, 4.2], [6, 16, 6.2], [12, 23, 8.2]];
    for (let y = 23; y < H; y++) for (let x = 7; x <= 9; x++) g[y][x] = x === 9 ? 'k' : 't';
    for (const [t0, t1, hw] of tiers) {
      const jag = r.int(0, 1);
      for (let y = t0; y <= t1; y++) {
        const k = (y - t0 + 1) / (t1 - t0 + 1), w = hw * k + ((y + jag) % 3 === 0 ? 0.6 : 0);
        for (let x = 0; x < W; x++) {
          const dx = x + 0.5 - 8.5;
          if (Math.abs(dx) > w) continue;
          let ch = 'G';
          if (dx < -w + 1.2 && (y & 1) === 0) ch = 'L';
          else if (dx > 0.5 && k > 0.45 && ((x + y) & 1) === 0) ch = 'k';
          if (y === t1 && Math.abs(dx) < w - 1) ch = 'k';
          g[y][x] = ch;
        }
      }
    }
    const rows = g.rows(), map = { G: P.gr1, L: P.gr2, k: P.k, t: P.red0 };
    return { img: pair(mk(rows, map)), see: pair(mk(rows, map, { checker: 0 })) };
  }
  // cattails at the pond edge
  const REEDS = ['..r.....', '..r..r..', '.oG..r.r', '..G.oG.r', '..G..G.G', '.G.G.G.G', '.G.G..GG', '..G.G.G.', '..GGG.G.', '...GGG..'];
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
${B} #hud .hp::before { content: '-LIFE-'; grid-column: 1 / 3; font: 16px ${F}; color: #f83800; }
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
${B} #levelup .lu-title::after { content: 'BONUS!'; font: 32px ${F}; color: #f8b800; letter-spacing: 2px; }
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
    description: 'A late NES cartridge: strict 2C02 palette, black-outlined sprites posed from parts, 8-frame walks and tile-language meadows.',
    pixelArt: { scale: PS },
    groundColor: P.gr0,
    chunkSize: 256,
    fonts: ['Press+Start+2P'],
    css: CSS,

    init() {
      // figures are baked lazily per pose; warm the common ones so the first frames do not hitch
      poseCache.clear();
      for (const w of WALK) heroSprite(w, 0);
      for (let f = 0; f < 4; f++) for (let k = 0; k < 2; k++) { creeperSprite(f, k, k, 'n'); colossusSprite(f, 0, 'n'); ghostSprite(f, 0, 0, k, 0, 0); }
      SPR.lantern = lanternFrames();
      // effects
      SPR.boom = boomFrames(1);
      SPR.boomBig = boomFrames(1.7);
      SPR.poof = poofFrames();
      SPR.star = starFrames(P.gold);
      SPR.starC = starFrames(P.cyan);
      SPR.gem = gemFrames(false);
      SPR.gemBig = gemFrames(true);
      SPR.hit = hitFrames();
      SPR.ring = ringFrames(P.cyan);
      SPR.ringG = ringFrames(P.gold);
      SPR.beam = beamFrames();
      SPR.leaf = leafBits();
      SPR.seed = seedFrames();
      SPR.mound = moundFrames(false);
      SPR.moundBig = moundFrames(true);
      SPR.dust = [mk(['.L.', 'LWL', '.L.'], { L: P.g1, W: P.w }, { outline: false }), mk(['L.L', '...', 'L.L'], { L: P.g2 }, { outline: false })];
      SPR.shadow = {};
      for (const w of [8, 10, 12, 16, 20, 24]) SPR.shadow[w] = [shadowSprite(w, 0), shadowSprite(w, 1)];
      // props
      SPR.tree = [0, 1, 2].map((s) => makeTree(false, 900 + s));
      SPR.treeA = [makeTree(true, 950), makeTree(true, 951)];
      SPR.dead = makeDeadTree();
      SPR.bush = [makeBush(11), makeBush(12)];
      SPR.pine = [makePine(31), makePine(32)];
      SPR.reeds = pair(mk(REEDS, { G: P.gr1, r: P.br0, o: P.ochre }));
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
        if (F > FTH + 0.05 && rng.next() < 0.45) { out.push({ x, y, t: 'pine', s: SPR.pine[(rng.next() * 2) | 0], f: rng.next() < 0.5, pad: 80 }); return; }
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
      // cattails in little stands along the pond shores
      G.scatterOwned(info, 34, 6251, (x, y, rng) => {
        if (G.nearSpawn(x, y, 90) || rng.next() > 0.5) return;
        const w = waterF(x, y);
        if (w < WTH + 0.004 || w > WTH + 0.03 || matAt(x, y) !== GR) return;
        out.push({ x, y, t: 'reeds', f: rng.next() < 0.5, pad: 24 });
        if (rng.next() < 0.6) out.push({ x: x + rng.range(-9, 9), y: y + rng.range(3, 6), t: 'reeds', f: rng.next() < 0.5, pad: 24 });
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
        case 'pine': {
          const p = view.game.player;
          const behind = p.y < pr.y - 4 && p.y > pr.y - 44 && Math.abs(p.x - pr.x) < 14;
          img = (behind ? pr.s.see : pr.s.img)[pr.f ? 'l' : 'r'];
          break;
        }
        case 'reeds': img = SPR.reeds[pr.f ? 'l' : 'r']; break;
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
        if (o.t === 'tree') w = 20; else if (o.t === 'pine') w = 16; else if (o.t === 'dead') w = 12; else if (o.t === 'statue') w = 16; else return;
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
      // eased 3-step bob (0,1,2,1) instead of a 1-px toggle, phase per collectible
      const bob = [0, 1, 2, 1][Math.floor(view.rt * 4 + g.seed * 4) & 3];
      const img = set[f];
      blit(ctx, img, g.x, g.y, img.width >> 1, img.height - 1 + z + bob);
      // a glint pops on the upper corner every ~1.8 s
      const gl = (view.rt * 0.55 + g.seed) % 1;
      if (gl < 0.07) blit(ctx, SPR.star[gl < 0.035 ? 0 : 1], g.x, g.y, (g.big ? -1 : 0), img.height + 1 + z + bob);
    },

    drawPlayer(ctx, p, view) {
      const t = view.rt + phaseOf(p);
      let o, pal = 0;
      const sinceDash = 1.4 - p.dashCd;
      if (p.dashT > 0) o = 0.2 - p.dashT < 0.05 ? DASH_WIND : DASH_GO;
      else if (p.hurtT > 0.55) { o = HURT; pal = (FR & 4) ? 1 : 2; }
      else if (p.dashCd > 0 && sinceDash < 0.32) o = SKID;
      else if (p.moving) o = WALK[Math.floor(p.anim * 1.3) & 7];
      else {
        // idle: breathing on a 1.1 s beat, head follows 0.12 s later, leaf in the wind, blinks, scarf fidget
        const br = Math.floor(t / 1.1) & 1, hb = (Math.floor((t - 0.12) / 1.1) & 1) - br;
        o = { legs: 'stand', bob: br, hb, na: 'n', fa: 'h', sc: (t % 4.3) < 0.36 ? ((t % 4.3) < 0.18 ? 'w0' : 'w1') : 'hang', face: (t % 3.4) < 0.13 ? 'blink' : 'n', leaf: seq(t, 1.5, 2) };
      }
      if (p.shootT > 0.6 && o !== DASH_GO && o !== DASH_WIND && o !== HURT) o = Object.assign({}, o, { na: 't' });
      const fl = p.facing < 0 ? 'l' : 'r';
      // dash: two checker afterimages of the same pose (no alpha on the NES)
      if (p.dashT > 0) {
        const gi = heroSprite(DASH_GO, 3)[fl];
        for (let k = 2; k >= 1; k--) blitFeet(ctx, gi, p.x - p.dashX * k * 10, p.y - p.dashY * k * 10);
      }
      // invulnerability: classic sprite flicker
      if (p.iframes > 0 && p.hurtT <= 0.55 && (FR & 2)) return;
      const img = heroSprite(o, pal)[fl];
      blit(ctx, img, p.x, p.y, img.width >> 1, img.height - 1);
    },

    drawEnemy(ctx, e, view) {
      const fl = e.facing < 0 ? 'l' : 'r';
      const big = e.type === 'colossus', ghost = e.type === 'ghost';
      const ph = phaseOf(e), t = view.rt + ph;
      const kind = big || ghost ? 0 : (e.seed < 0.55 ? 0 : 1);
      // ---- death: white pop in a squash pose (≈100 ms), then the 4-frame burst
      if (e.dying) {
        const k = e.deathT;
        if (k < 0.3) {
          if (ghost) {
            const img = ghostSprite(0, 1, 1, (FR >> 1) & 1, 1, 1)[fl];
            blit(ctx, img, e.x, e.y, img.width >> 1, img.height - 1 + 3 + Math.round(k * 12));
          } else {
            const img = big ? colossusSprite(0, 1, 'hit')[fl] : creeperSprite(0, kind, 9, 'hit')[fl];
            blit(ctx, img, e.x, e.y, img.width >> 1, img.height - 1);
          }
          return;
        }
        const f = Math.min(3, Math.floor((k - 0.3) / 0.7 * 4));
        if (ghost) {
          // ghosts unravel upwards: the checker sheet loses rows from the bottom while it rises
          const img = ghostSprite(seq(t, 8, 4), 1, 1, (FR >> 1) & 1, 0, 1)[fl];
          const keep = Math.max(2, Math.round(img.height * (1 - (k - 0.3) / 0.7)));
          toScreen(ctx);
          ctx.drawImage(img, 0, 0, img.width, keep, sx(e.x) - (img.width >> 1), sy(e.y) - img.height - 3 - Math.round(k * 14), img.width, keep);
          toWorld(ctx);
          blitMid(ctx, SPR.star[Math.min(2, f)], e.x, e.y - 16 * PS - k * 10);
          return;
        }
        blitMid(ctx, (big ? SPR.boomBig : SPR.boom)[f], e.x, e.y - (big ? 18 : 8) * PS);
        return;
      }
      // ---- spawn: ghosts unroll from the hood down in checker; root creatures heave a mound and climb out
      if (e.spawnT < 1) {
        const s = e.spawnT;
        if (ghost) {
          const img = ghostSprite(seq(t, 8, 4), 0, 1, (FR >> 1) & 1, 0, s < 0.7)[fl];
          const keep = Math.max(2, Math.round(img.height * Math.min(1, s / 0.7)));
          if (s < 0.85 && (FR & 2)) return;
          toScreen(ctx);
          ctx.drawImage(img, 0, 0, img.width, keep, sx(e.x) - (img.width >> 1), sy(e.y) - img.height - 3, img.width, keep);
          toWorld(ctx);
          return;
        }
        const mound = big ? SPR.moundBig : SPR.mound;
        if (s < 0.35) { blitFeet(ctx, mound[seq(t, 10, 2)], e.x, e.y); return; }
        const img = big ? colossusSprite(s < 0.8 ? 3 : 0, 0, 'n')[fl] : creeperSprite(s < 0.8 ? 2 : 0, kind, kind, 'n')[fl];
        if (s < 0.8) {
          // climbing out: only the top rows show, the mound covers the cut
          const vis = Math.max(2, Math.round(img.height * (s - 0.35) / 0.45));
          toScreen(ctx);
          ctx.drawImage(img, 0, 0, img.width, vis, sx(e.x) - (img.width >> 1), sy(e.y) - vis + 1, img.width, vis);
          toWorld(ctx);
          blitFeet(ctx, mound[2], e.x, e.y + 1);
          return;
        }
        blit(ctx, img, e.x, e.y, img.width >> 1, img.height - 1);
        return;
      }
      // ---- alive: hit = flash palette + squash/recoil pose for ~130 ms
      const hit = e.hitT < 0.13 && e.flash > 0.05;
      const flash = e.flash > 0.45 && (FR & 2) === 0;
      const rec = hit ? Math.round((1 - e.hitT / 0.13) * 2) * (e.facing < 0 ? 1 : -1) : 0;
      let img, lift = 0;
      if (ghost) {
        const f = seq(t, 7, 4);
        const lifts = [0, 0, 1, 2, 3, 3, 2, 1];             // eased float: holds at top and bottom
        lift = 3 + lifts[seq(t, 5, 8)];
        img = ghostSprite(f, seq(t, 3, 2), (t % 2.6) < 0.5 ? 1 : 0, ((FR >> 1) + (e.id | 0)) & 1, flash ? 1 : 0, hit)[fl];
      } else if (big) {
        const f = Math.floor(e.anim * 1.6 + ph) & 3;
        img = colossusSprite(hit ? 0 : f, flash ? 1 : 0, hit ? 'hit' : 'n')[fl];
        if (e._lf !== f && (f === 0 || f === 2) && !hit) view.game.addParticle({ x: e.x + (f ? 12 : -12), y: e.y, z: 1, kind: 'dust', life: 0.3 });
        e._lf = f;
      } else {
        const f = hit ? 0 : Math.floor(e.anim * 2.2 + ph) & 3;
        img = creeperSprite(f, kind, flash ? 9 : kind, hit ? 'hit' : 'n')[fl];
      }
      blit(ctx, img, e.x + rec * PS, e.y, img.width >> 1, img.height - 1 + lift);
    },

    drawOrbital(ctx, o, view) {
      // flicker sequence (not a toggle) so two lanterns never pulse together
      const img = SPR.lantern[[0, 1, 0, 2, 1, 0][Math.floor(view.rt * 9 + o.idx * 2.5) % 6]];
      blitMid(ctx, img, o.x, o.y);
      // a gold spark trails a step behind on the orbit
      if (o.angle !== undefined) {
        const a = o.angle - 0.45, r = Math.hypot(o.x - view.game.player.x, o.y - view.game.player.y);
        if (r > 8 && (FR & 2)) {
          const px = view.game.player.x + Math.cos(a) * r, py = view.game.player.y + Math.sin(a) * r * 0.85;
          toScreen(ctx); ctx.fillStyle = P.gold; ctx.fillRect(sx(px), sy(py), 1, 1); toWorld(ctx);
        }
      }
    },

    drawProjectile(ctx, pr) {
      const img = SPR.seed[Math.floor((pr.spin || 0) / (Math.PI / 4)) & 3];
      const x = sx(pr.x), y = sy(pr.y);
      toScreen(ctx);
      // trail: three dots that thin out (cream → gold → orange)
      const sp = Math.hypot(pr.vx, pr.vy) || 1, ux = pr.vx / sp, uy = pr.vy / sp;
      ctx.fillStyle = P.cream; ctx.fillRect(Math.round(x - ux * 3), Math.round(y - uy * 3), 1, 1);
      ctx.fillStyle = P.gold; ctx.fillRect(Math.round(x - ux * 6), Math.round(y - uy * 6), 1, 1);
      if (pr.age > 0.05 && (FR & 1)) { ctx.fillStyle = P.orange; ctx.fillRect(Math.round(x - ux * 9), Math.round(y - uy * 9), 1, 1); }
      ctx.drawImage(img, x - (img.width >> 1), y - (img.height >> 1));
      toWorld(ctx);
    },

    drawParticle(ctx, pt) {
      const k = 1 - pt.life / pt.max;
      const X = pt.x, Y = pt.y - pt.z;
      switch (pt.kind) {
        case 'boom': blitMid(ctx, (pt.big ? SPR.boomBig : SPR.boom)[Math.min(3, Math.floor(k * 4))], X, Y); return;
        case 'poof': blitMid(ctx, SPR.poof[Math.min(2, Math.floor(k * 3))], X, Y); return;
        case 'smoke': if (k > 0.75 && (FR & 2)) return; blitMid(ctx, SPR.poof[k < 0.4 ? 0 : 2], X, Y); return;
        case 'star': blitMid(ctx, (pt.cyan ? SPR.starC : SPR.star)[Math.min(2, Math.floor(k * 3))], X, Y); return;
        case 'hitfx': blitMid(ctx, SPR.hit[Math.min(2, Math.floor(k * 3))], X, Y); return;
        case 'ring': blitMid(ctx, (pt.gold ? SPR.ringG : SPR.ring)[Math.min(2, Math.floor(k * 3))], X, Y); return;
        case 'beam': {
          if (k > 0.7 && (FR & 2)) return;
          const img = SPR.beam[(FR >> 2) & 1], keep = Math.max(4, Math.round(img.height * (1 - k * 0.6)));
          toScreen(ctx);
          ctx.drawImage(img, 0, img.height - keep, img.width, keep, sx(X) - (img.width >> 1), sy(Y) - keep, img.width, keep);
          toWorld(ctx);
          return;
        }
        case 'leaf': blitMid(ctx, SPR.leaf[(Math.floor(k * 10) + (pt.seed * 4 | 0)) & 3], X, Y); return;
        case 'dust': blitMid(ctx, SPR.dust[k < 0.5 ? 0 : 1], X, Y); return;
        default: {
          if (pt.life / pt.max < 0.3 && (FR & 1)) return;
          const s = pt.size >= 2 ? 2 : 1;
          toScreen(ctx);
          const x = sx(X) - (s >> 1), y = sy(Y) - (s >> 1);
          if (s === 2) { ctx.fillStyle = P.k; ctx.fillRect(x - 1, y - 1, 4, 4); }   // outlined chunk like a sprite
          ctx.fillStyle = pt.color || P.w;
          ctx.fillRect(x, y, s, s);
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

    /* ---------- gameplay hooks → layered pixel effects: flash → shape → debris → residue ---------- */
    onHit(game, e) {
      const top = e.type === 'colossus' ? 30 : e.type === 'ghost' ? 18 : 14;
      const cols = e.type === 'ghost' ? [P.w, P.cyan] : e.type === 'colossus' ? [P.ochre, P.purple] : [P.cream, e.seed < 0.55 ? P.purple : P.crim];
      game.addParticle({ x: e.x + (Math.random() - 0.5) * 4, y: e.y, z: top, kind: 'hitfx', life: 0.2, drag: 0 });
      for (let k = 0; k < 3; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: e.x, y: e.y, z: top, vx: Math.cos(a) * 45, vy: Math.sin(a) * 18, vz: 35 + Math.random() * 30, grav: 170, drag: 1, life: 0.38, size: k ? 1 : 2, color: cols[k & 1], kind: 'px' });
      }
    },
    onKill(game, e) {
      const big = e.type === 'colossus', ghost = e.type === 'ghost';
      const top = big ? 30 : ghost ? 20 : 14;
      const cols = ghost ? [P.w, P.cyan, P.w] : big ? [P.ochre, P.purple, P.gold, P.br0] : [P.cream, e.seed < 0.55 ? P.purple : P.crim, P.cream];
      const n = big ? 12 : 6;
      // debris in the figure's own colours, outlined like sprites
      for (let k = 0; k < n; k++) {
        const a = Math.random() * U.TAU, s = (big ? 70 : 52) * (0.5 + Math.random() * 0.7);
        game.addParticle({ x: e.x, y: e.y, z: top * (0.5 + Math.random() * 0.6), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 45 + Math.random() * 50, grav: 230, drag: 1, life: 0.55 + Math.random() * 0.3, size: k % 3 ? 2 : 1, color: cols[k % cols.length], kind: 'px' });
      }
      if (!ghost) {
        // the leaf crown flies off and tumbles
        for (let k = 0; k < (big ? 4 : 2); k++) game.addParticle({ x: e.x + (k - 0.5) * 6, y: e.y, z: top + 6, vx: (k & 1 ? 1 : -1) * (18 + Math.random() * 20), vy: -6, vz: 70 + Math.random() * 30, grav: 150, drag: 0.6, life: 0.8 + Math.random() * 0.3, kind: 'leaf' });
      } else {
        for (let k = 0; k < 3; k++) game.addParticle({ x: e.x + (k - 1) * 7, y: e.y, z: 18 + k * 4, vz: 28, grav: -1, drag: 0, life: 0.45 + k * 0.1, kind: 'star', cyan: true });
      }
      // residue: a slow puff of smoke that lingers where the figure stood
      game.addParticle({ x: e.x, y: e.y, z: big ? 14 : 6, vz: 10, grav: -1, drag: 0, life: big ? 0.8 : 0.6, kind: 'smoke' });
      if (big) for (let k = 0; k < 3; k++) game.addParticle({ x: e.x + (Math.random() - 0.5) * 30, y: e.y, z: 10 + Math.random() * 30, kind: 'boom', life: 0.4 + k * 0.08, drag: 0 });
    },
    onHurt(game, p) {
      game.addParticle({ x: p.x, y: p.y, z: 16, kind: 'hitfx', life: 0.2, drag: 0 });
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: p.x, y: p.y, z: 18, vx: Math.cos(a) * 55, vy: Math.sin(a) * 25, vz: 40 + Math.random() * 30, grav: 220, life: 0.5, size: 2, color: k % 2 ? P.orange : P.yellow, kind: 'px' });
      }
      game.addParticle({ x: p.x, y: p.y, z: 26, kind: 'star', life: 0.24, drag: 0 });
    },
    onPickup(game, g) {
      game.addParticle({ x: g.x, y: g.y, z: 5, kind: 'ring', gold: !!g.big, life: 0.24, drag: 0 });
      game.addParticle({ x: g.x, y: g.y, z: 8, vz: 30, grav: -1, kind: 'star', cyan: !g.big, life: 0.3, drag: 0 });
      for (let k = 0; k < 3; k++) game.addParticle({ x: g.x + (k - 1) * 4, y: g.y, z: 4, vz: 55 + k * 12, grav: 90, drag: 0, life: 0.35, size: 1, color: g.big ? P.gold : P.cyan, kind: 'px' });
    },
    onShoot() {},
    onDash(game, p) {
      game.addParticle({ x: p.x - p.dashX * 6, y: p.y, z: 3, kind: 'dust', life: 0.3 });
      game.addParticle({ x: p.x - p.dashX * 14, y: p.y - p.dashY * 6, z: 3, kind: 'dust', life: 0.4 });
      game.addParticle({ x: p.x - p.dashX * 22, y: p.y - p.dashY * 10, z: 2, kind: 'dust', life: 0.5 });
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y + 2, z: 0, kind: 'beam', life: 0.55, drag: 0 });
      game.addParticle({ x: p.x, y: p.y, z: 14, kind: 'ring', gold: true, life: 0.3, drag: 0 });
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
