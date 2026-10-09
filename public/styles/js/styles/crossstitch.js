/* Kreuzstich – the whole game is a living cross-stitch sampler on Aida cloth.
   One stitch = one cell of 3.2 world units (8 px at 1600x900). Every stitch is a real little "X" of two
   twisted thread strokes with sheen and a tiny shadow; contours are backstitched; flowers are French knots
   and lazy daisies; the pond is satin stitch. Everything is procedural and snaps to the world stitch grid. */
(function () {
  'use strict';
  const U = window.U, G = window.G;

  /* =====================================================================
     Grid constants
     ===================================================================== */
  const C = 3.2;          // world units per stitch cell
  const CP = 8;           // sprite pixels per cell
  const K = C / CP;       // world units per sprite pixel
  const SM = 2;           // stitch sprite margin (px)
  const MP = 5;           // motif canvas margin (px)
  const CS = 256;         // chunk size (world units)
  const NC = CS / C;      // 80 cells per chunk side
  const WHITE = [255, 255, 255];

  /* =====================================================================
     DMC-like floss palette
     ===================================================================== */
  const PAL = {
    // pumpkin
    Q: '#6c2817', q: '#a4401b', O: '#e2701f', o: '#f59b40', y: '#ffd23c', Y: '#fff2a6',
    // greens
    G: '#2d5230', g: '#55843a', l: '#8daf55', L: '#b3c07c',
    // browns
    B: '#45291c', b: '#7c4a2b', k: '#c79a66', K: '#2b1d1d',
    // rutabaga purples
    P: '#4f2560', p: '#83479a', m: '#bc8ac7',
    // creams
    c: '#f3e6bf', C: '#d8bc7f', w: '#fbf8f0',
    // winter ghost blues
    i: '#d5e6f2', I: '#97b6d4', j: '#3c5078',
    // reds
    r: '#c3312b', R: '#7a1c24', E: '#e65f3e',
    // greys
    a: '#9f9a93', A: '#5f5a58', e: '#d0cbc2',
    // Jack's cloak
    d: '#1d3f55', D: '#2e6479',
    // ground: ochre field, gold, rust forest, pond
    f: '#c99a3e', F: '#a6782e', h: '#e3b24d', t: '#f2d37c',
    x: '#a24f2a', X: '#84391f', z: '#6b3b24',
    N: '#2b4b70', n: '#43729e', u: '#7faacf', W: '#bcd6ea',
    s: '#e58ca2', v: '#7b59a8', V: '#a98bd0',
  };
  const PALR = {};
  for (const k in PAL) PALR[k] = U.hex(PAL[k]);
  const rgbCache = new Map();
  const toRgb = (c) => {
    if (Array.isArray(c)) return c;
    if (PALR[c]) return PALR[c];
    let v = rgbCache.get(c);
    if (!v) { v = U.hex(c); rgbCache.set(c, v); }
    return v;
  };
  const rgbStr = (c, a) => U.rgb(c, a);
  const FLASH = (c) => U.mix(c, WHITE, 0.6);

  /* =====================================================================
     Thread primitives
     ===================================================================== */
  // one stitch (full cross or half stitch '/'), CP x CP cell + SM margin
  function makeStitch(rgb, v, half) {
    const S = CP + SM * 2;
    const { c, ctx } = U.canvas(S, S);
    const r = U.rng(v * 977 + rgb[0] * 3 + rgb[1] * 7 + rgb[2] * 11 + (half ? 5 : 0));
    const j = () => (r.next() - 0.5) * 0.5;
    const a = SM + 0.85, b = SM + CP - 0.85;
    const base = U.mul(rgb, 0.95 + r.next() * 0.1);
    const strokes = [[a + j(), b + j(), b + j(), a + j(), -1]];
    if (!half) strokes.push([a + j(), a + j(), b + j(), b + j(), 1]);
    ctx.lineCap = 'round';
    const line = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
    strokes.forEach(([x0, y0, x1, y1, dir], n) => {
      // shadow (the top stroke also shades the bottom one)
      ctx.strokeStyle = n ? 'rgba(40,22,10,0.30)' : 'rgba(40,22,10,0.36)';
      ctx.lineWidth = 3.1;
      line(x0 + 0.45, y0 + 0.85, x1 + 0.45, y1 + 0.85);
      ctx.strokeStyle = rgbStr(U.mul(base, 0.7));
      ctx.lineWidth = 2.9;
      line(x0, y0, x1, y1);
      ctx.strokeStyle = rgbStr(base);
      ctx.lineWidth = 2.0;
      const px = dir < 0 ? -0.18 : 0.18, py = -0.22;
      line(x0 + px, y0 + py, x1 + px, y1 + py);
      // sheen
      ctx.strokeStyle = rgbStr(U.mix(base, WHITE, 0.5), 0.75);
      ctx.lineWidth = 0.7;
      const hx = dir < 0 ? -0.55 : 0.5, hy = -0.6;
      line(U.lerp(x0, x1, 0.18) + hx, U.lerp(y0, y1, 0.18) + hy, U.lerp(x0, x1, 0.78) + hx, U.lerp(y0, y1, 0.78) + hy);
      // two-ply twist ticks
      ctx.strokeStyle = rgbStr(U.mul(base, 0.62), 0.45);
      ctx.lineWidth = 0.55;
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      for (const tt of [0.3, 0.52, 0.74]) {
        const cx = x0 + dx * tt, cy = y0 + dy * tt;
        line(cx - nx * 0.9 - ux * 0.5, cy - ny * 0.9 - uy * 0.5, cx + nx * 0.9 + ux * 0.5, cy + ny * 0.9 + uy * 0.5);
      }
    });
    return c;
  }
  const stitchCache = new Map();
  function stitchSet(rgb, half) {
    const key = rgb[0] + ',' + rgb[1] + ',' + rgb[2] + (half ? 'h' : 'x');
    let s = stitchCache.get(key);
    if (!s) { s = [0, 1, 2].map((v) => makeStitch(rgb, v, half)); stitchCache.set(key, s); }
    return s;
  }

  // seamless 4x4-cell tile of stitches of one colour ('<key>x' full, '<key>h' half)
  const patCache = new Map();
  function stitchPattern(pk) {
    let c = patCache.get(pk);
    if (c) return c;
    const key = pk.slice(0, -1), half = pk.endsWith('h');
    const n = 4, S = n * CP;
    const set = stitchSet(PALR[key], half);
    c = U.sprite(S, S, (ctx) => {
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        ctx.drawImage(set[U.hashInt(x, y, key.charCodeAt(0)) % 3], x * CP - SM + ox * S, y * CP - SM + oy * S);
      }
    });
    patCache.set(pk, c);
    return c;
  }
  // batched backstitch: segs = flat [x0,y0,x1,y1,...]; w = thread width; gap = shortening at each hole
  function threadSegs(ctx, segs, rgb, w, gap) {
    const n = segs.length;
    if (!n) return;
    const path = (dx, dy) => {
      ctx.beginPath();
      for (let k = 0; k < n; k += 4) {
        const x0 = segs[k], y0 = segs[k + 1], x1 = segs[k + 2], y1 = segs[k + 3];
        const L = Math.hypot(x1 - x0, y1 - y0) || 1;
        const g = Math.min(gap, L * 0.3);
        const gx = ((x1 - x0) / L) * g, gy = ((y1 - y0) / L) * g;
        ctx.moveTo(x0 + gx + dx, y0 + gy + dy);
        ctx.lineTo(x1 - gx + dx, y1 - gy + dy);
      }
    };
    ctx.lineCap = 'round';
    path(w * 0.28, w * 0.42);
    ctx.strokeStyle = 'rgba(35,20,10,0.36)';
    ctx.lineWidth = w * 1.12;
    ctx.stroke();
    path(0, 0);
    ctx.strokeStyle = rgbStr(U.mul(rgb, 0.72));
    ctx.lineWidth = w;
    ctx.stroke();
    path(-w * 0.06, -w * 0.08);
    ctx.strokeStyle = rgbStr(rgb);
    ctx.lineWidth = w * 0.62;
    ctx.stroke();
    path(-w * 0.16, -w * 0.22);
    ctx.strokeStyle = rgbStr(U.mix(rgb, WHITE, 0.45), 0.7);
    ctx.lineWidth = w * 0.26;
    ctx.stroke();
  }
  // polyline -> flat segment list
  function polySegs(pts, sc, ox, oy) {
    const out = [];
    for (let k = 0; k + 3 < pts.length; k += 2) out.push(ox + pts[k] * sc, oy + pts[k + 1] * sc, ox + pts[k + 2] * sc, oy + pts[k + 3] * sc);
    return out;
  }

  /* =====================================================================
     Motifs (cell grids) -> pre-rendered embroidery sprites
     ===================================================================== */
  function motif(rows, outline, segs) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const cell = new Array(w * h).fill(null);
    for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch !== '.' && ch !== ' ') cell[y * w + x] = ch;
    }
    return { w, h, cell, outline: outline || null, segs: segs || [] };
  }
  function blank(w, h, outline) { return { w, h, cell: new Array(w * h).fill(null), outline: outline || null, segs: [] }; }
  function mset(m, x, y, k) { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.cell[y * m.w + x] = k; }
  function mget(m, x, y) { return x >= 0 && y >= 0 && x < m.w && y < m.h ? m.cell[y * m.w + x] : null; }
  function mirror(m) {
    const o = { w: m.w, h: m.h, cell: new Array(m.w * m.h), outline: m.outline, segs: [], inner: m.inner };
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) o.cell[y * m.w + x] = m.cell[y * m.w + (m.w - 1 - x)];
    o.segs = m.segs.map((s) => ({ ...s, pts: s.pts.map((v, i) => (i % 2 === 0 ? m.w - v : v)) }));
    return o;
  }

  function renderMotif(m, o = {}) {
    const W = m.w * CP + MP * 2, H = m.h * CP + MP * 2;
    const { c, ctx } = U.canvas(W, H);
    const col = (k) => {
      let rgb = (o.remap && o.remap[k]) ? toRgb(o.remap[k]) : toRgb(k);
      return o.mod ? o.mod(rgb) : rgb;
    };
    const has = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.cell[y * m.w + x] && (!o.mask || o.mask[y * m.w + x]);
    if (!o.noShadow) {
      const s = U.canvas(W, H);
      s.ctx.fillStyle = '#28160c';
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (has(x, y)) s.ctx.fillRect(MP + x * CP, MP + y * CP, CP, CP);
      ctx.save();
      ctx.filter = 'blur(1.1px)';
      ctx.globalAlpha = o.shadowAlpha !== undefined ? o.shadowAlpha : 0.42;
      ctx.drawImage(s.c, 1.4, 2.4);
      ctx.restore();
    }
    // dense thread underlay (fabric barely shows inside motifs)
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!has(x, y)) continue;
      ctx.fillStyle = rgbStr(U.mul(col(m.cell[y * m.w + x]), 0.64));
      ctx.fillRect(MP + x * CP + 0.6, MP + y * CP + 0.6, CP - 1.2, CP - 1.2);
    }
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!has(x, y)) continue;
      const set = stitchSet(col(m.cell[y * m.w + x]), false);
      ctx.drawImage(set[U.hashInt(x, y, 77) % 3], MP + x * CP - SM, MP + y * CP - SM);
    }
    if (!o.noOutline) {
      if (m.outline) {
        const segs = [];
        for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
          if (!has(x, y)) continue;
          const X0 = MP + x * CP, Y0 = MP + y * CP, X1 = X0 + CP, Y1 = Y0 + CP;
          if (!has(x, y - 1)) segs.push(X0, Y0, X1, Y0);
          if (!has(x, y + 1)) segs.push(X0, Y1, X1, Y1);
          if (!has(x - 1, y)) segs.push(X0, Y0, X0, Y1);
          if (!has(x + 1, y)) segs.push(X1, Y0, X1, Y1);
        }
        threadSegs(ctx, segs, col(m.outline), 2.2, 0.55);
      }
      if (m.inner) {
        const ks = m.inner.keys, isK = (x, y) => has(x, y) && ks.indexOf(m.cell[y * m.w + x]) >= 0;
        const segs = [];
        for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
          if (!isK(x, y)) continue;
          const X0 = MP + x * CP, Y0 = MP + y * CP, X1 = X0 + CP, Y1 = Y0 + CP;
          if (!isK(x, y - 1) && has(x, y - 1)) segs.push(X0, Y0, X1, Y0);
          if (!isK(x, y + 1) && has(x, y + 1)) segs.push(X0, Y1, X1, Y1);
          if (!isK(x - 1, y) && has(x - 1, y)) segs.push(X0, Y0, X0, Y1);
          if (!isK(x + 1, y) && has(x + 1, y)) segs.push(X1, Y0, X1, Y1);
        }
        threadSegs(ctx, segs, col(m.inner.k), 1.7, 0.5);
      }
      for (const s of m.segs) threadSegs(ctx, polySegs(s.pts, CP, MP, MP), col(s.k), s.w || 2.1, 0.55);
    }
    return c;
  }
  // draw a motif sprite with its grid origin on world cell (gx, gy)
  function blitCell(ctx, spr, gx, gy) {
    ctx.drawImage(spr, gx * C - MP * K, gy * C - MP * K, spr.width * K, spr.height * K);
  }

  /* =====================================================================
     Characters
     ===================================================================== */
  const PN = 6; // spawn / unravel steps
  function buildChar(frames, opts = {}) {
    const out = { w: frames[0].w, h: frames[0].h, r: [], l: [], fr: [], fl: [], part: [], partL: [] };
    for (const m of frames) {
      const ml = mirror(m);
      out.r.push(renderMotif(m, opts));
      out.l.push(renderMotif(ml, opts));
      out.fr.push(renderMotif(m, { ...opts, mod: FLASH, noShadow: true }));
      out.fl.push(renderMotif(ml, { ...opts, mod: FLASH, noShadow: true }));
    }
    const m = frames[0];
    const idx = [];
    for (let k = 0; k < m.cell.length; k++) if (m.cell[k]) idx.push(k);
    // stitchers work roughly bottom-up with some randomness
    const rr = U.rng(4242 + m.w * 31 + m.h);
    idx.sort((a, b) => (Math.floor(b / m.w) + rr.next() * 4) - (Math.floor(a / m.w) + rr.next() * 4));
    for (let s = 1; s < PN; s++) {
      const mask = new Uint8Array(m.cell.length);
      const n = Math.round((idx.length * s) / PN);
      for (let k = 0; k < n; k++) mask[idx[k]] = 1;
      const cv = renderMotif(m, { ...opts, mask, noOutline: true, shadowAlpha: 0.25 });
      out.part.push(cv);
      out.partL.push(U.flipX(cv));
    }
    return out;
  }

  // Jack: 9 x 11, facing right
  const JACK_HEAD = [
    '....gG...',
    '..qoOOq..',
    '.qoOOOOq.',
    'qoOYyOYyq',
    'qoOOOOOOq',
    'qOyYyYyYq',
    '.qOyOyOq.',
    '..RrrrR..',
  ];
  const JACK_BODY = [
    ['.rdDDDdk.', '..dDDDd..', '..BB.BB..'],
    ['.rdDDDd.k', '.ddDDDd..', '.BB...BB.'],
    ['r.dDDDdk.', '..dDDDdd.', '...BBB...'],
  ];
  const JACK_SEGS = [{ k: 'g', w: 1.8, pts: [6, 1, 7, 0.5, 7.5, 0] }];
  function jackFrames() {
    return JACK_BODY.map((b) => { const m = motif([...JACK_HEAD, ...b], 'K', JACK_SEGS); m.inner = { keys: 'yY', k: 'Q' }; return m; });
  }

  // Rüben-Schleicher: 7 x 8
  const CREEP_TOP = [['.g.G.g.', '..gGg..'], ['g..G.g.', '..gGg..'], ['.g.G..g', '..gGg..']];
  const CREEP_MID = ['.PPpPP.', 'PpmpppP', 'PppyPyP', 'pCcccCp', '.CcccC.'];
  const CREEP_LEG = ['..k.k..', '.k...k.', '...kk..'];
  const CREEP_SEGS = [{ k: 'K', w: 1.6, pts: [3, 3, 4, 4] }, { k: 'K', w: 1.6, pts: [6, 3, 5, 4] }, { k: 'R', w: 1.6, pts: [3, 6.6, 4, 5.6, 5, 6.6] }];
  function creeperFrames() {
    return [0, 1, 2].map((f) => motif([...CREEP_TOP[f], ...CREEP_MID, CREEP_LEG[f]], 'K', CREEP_SEGS));
  }

  // Hungergeist: 8 x 8
  const GHOST_TOP = ['..iwi...', '.iwwwi..', 'iwjwjwi.', 'iwjwjwii', 'iwwjwwI.', 'IwwjwwI.'];
  const GHOST_TAIL = [['.IiwiI..', '..I.I...'], ['..IiwI..', '.I..I...'], ['.IiwI...', '...I.I..']];
  function ghostFrames() {
    return [0, 1, 2].map((f) => motif([...GHOST_TOP, ...GHOST_TAIL[f]], 'j', []));
  }

  // Steckrüben-Koloss: 15 x 17, procedural
  function colossusMotif(fr) {
    const w = 15, h = 17;
    const m = blank(w, h, 'K');
    // leaf crown
    const leaves = [[4, 2, 'G'], [5, 1, 'g'], [6, 0, 'g'], [7, 1, 'G'], [8, 0, 'l'], [9, 1, 'g'], [10, 2, 'G']];
    for (const [x, top, k] of leaves) {
      const tt = top + (fr === 1 && x < 7 ? 1 : 0) + (fr === 2 && x > 7 ? 1 : 0);
      for (let y = tt; y <= 3; y++) mset(m, x, y, y === tt ? (k === 'G' ? 'g' : 'l') : k);
    }
    // body
    const cx = 7.5, cy = 9.2, rx = 5.9, ry = 5.9;
    for (let y = 3; y <= 14; y++) for (let x = 1; x <= 13; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const l = -0.5 * nx - 0.55 * ny + 0.62 * nz + (U.bayer4[(y & 3) * 4 + (x & 3)] - 0.5) * 0.28;
      const top = ny < 0.12 + 0.18 * Math.sin(x * 1.7);
      const ramp = top ? ['P', 'p', 'm'] : ['z', 'b', 'k'];
      mset(m, x, y, ramp[l < 0.22 ? 0 : l < 0.62 ? 1 : 2]);
    }
    mset(m, 4, 5, 'g'); mset(m, 5, 4, 'g'); mset(m, 4, 6, 'l'); mset(m, 11, 5, 'G');
    // face
    mset(m, 6, 8, 'y'); mset(m, 7, 8, 'Y'); mset(m, 10, 8, 'y'); mset(m, 11, 8, 'Y');
    for (let x = 6; x <= 11; x++) mset(m, x, 11, x % 2 ? 'y' : 'R');
    mset(m, 7, 12, 'R'); mset(m, 8, 12, 'y'); mset(m, 9, 12, 'y'); mset(m, 10, 12, 'R');
    // root arms
    const armL = fr === 1 ? [[1, 6], [0, 7], [0, 8], [1, 9]] : [[1, 9], [0, 10], [0, 11], [1, 12]];
    const armR = fr === 2 ? [[13, 6], [14, 7], [14, 8], [13, 9]] : [[13, 9], [14, 10], [14, 11], [13, 12]];
    for (const [x, y] of armL) mset(m, x, y, 'b');
    for (const [x, y] of armR) mset(m, x, y, 'b');
    const clL = armL[armL.length - 1], clR = armR[armR.length - 1];
    mset(m, clL[0], clL[1] + 1, 'k'); mset(m, clR[0], clR[1] + 1, 'k');
    // legs
    const legs = [[4, fr === 1], [9, fr === 2]];
    for (const [lx, up] of legs) {
      const y0 = 15 - (up ? 1 : 0);
      mset(m, lx, y0, 'b'); mset(m, lx + 1, y0, 'z');
      mset(m, lx, y0 + 1, 'z'); mset(m, lx + 1, y0 + 1, 'B'); mset(m, lx + 2, y0 + 1, 'z');
      if (up) { mset(m, lx, 16, null); mset(m, lx + 1, 16, null); mset(m, lx + 2, 16, null); }
    }
    m.segs = [
      { k: 'K', w: 1.8, pts: [5, 7, 6, 7.5, 8, 8] }, { k: 'K', w: 1.8, pts: [13, 7, 12, 7.5, 10, 8] },
      { k: 'B', w: 1.5, pts: [3, 9, 4, 10, 4, 12] }, { k: 'B', w: 1.5, pts: [12, 10, 12, 12, 11, 13] },
      { k: 'B', w: 1.5, pts: [8, 4, 8, 5, 9, 6] },
      { k: 'y', w: 1.4, pts: [7, 13.6, 8, 14, 9, 13.6] },
    ];
    return m;
  }

  /* =====================================================================
     Props (sampler motifs)
     ===================================================================== */
  function treeMotif(ramp, seed) {
    const w = 13, h = 16;
    const m = blank(w, h, 'B');
    const r = U.rng(seed);
    const ph = r.next() * 6;
    for (let y = 0; y <= 11; y++) for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - 6.5) / 6.2, ny = (y + 0.5 - 6.0) / 5.9;
      const ang = Math.atan2(ny, nx);
      const rr = 1 + 0.1 * Math.sin(ang * 5 + ph) + 0.05 * Math.sin(ang * 9 + ph * 2);
      const d = Math.hypot(nx, ny) / rr;
      if (d > 1) continue;
      const nz = Math.sqrt(Math.max(0, 1 - d * d));
      const l = -0.5 * nx - 0.6 * ny + 0.62 * nz + (r.next() - 0.5) * 0.3;
      const idx = U.clamp(Math.floor(l * 2.3 + 1.5 + (U.bayer4[(y & 3) * 4 + (x & 3)] - 0.5) * 0.9), 0, 3);
      mset(m, x, y, ramp[idx]);
    }
    for (let y = 9; y <= 14; y++) { mset(m, 5, y, 'k'); mset(m, 6, y, 'b'); mset(m, 7, y, 'z'); }
    mset(m, 4, 11, 'b'); mset(m, 8, 10, 'b');
    for (let x = 4; x <= 8; x++) mset(m, x, 15, x === 6 ? 'z' : 'b');
    mset(m, 3, 15, null); mset(m, 9, 15, null);
    // a few accent leaves
    for (let k = 0; k < 5; k++) {
      const x = r.int(1, 11), y = r.int(1, 9);
      if (mget(m, x, y)) mset(m, x, y, ramp[3]);
    }
    return m;
  }
  function pineMotif(seed) {
    const w = 11, h = 17;
    const m = blank(w, h, 'K');
    const r = U.rng(seed);
    for (let y = 0; y <= 13; y++) {
      const tier = Math.floor(y / 4.5), within = y - tier * 4.5;
      const hw = Math.min(5, Math.floor(0.6 + within * 0.75 + tier * 0.95));
      for (let x = 5 - hw; x <= 5 + hw; x++) {
        const side = (x - 5) / Math.max(1, hw);
        let k = side < -0.3 ? 'l' : side < 0.4 ? 'g' : 'G';
        if (within > 3 && r.next() < 0.5) k = 'G';
        if (r.next() < 0.06) k = 'L';
        mset(m, x, y, k);
      }
    }
    for (let y = 14; y <= 16; y++) { mset(m, 5, y, 'b'); mset(m, 4, y, y === 16 ? 'b' : null); mset(m, 6, y, y === 16 ? 'z' : null); }
    return m;
  }
  function bareTreeMotif(seed) {
    const w = 13, h = 16;
    const m = blank(w, h, 'K');
    for (let y = 6; y <= 14; y++) mset(m, 6, y, y % 3 ? 'z' : 'b');
    for (let y = 11; y <= 14; y++) mset(m, 5, y, 'b');
    for (let x = 4; x <= 8; x++) mset(m, x, 15, 'z');
    mset(m, 7, 14, 'B');
    const flip = seed % 2;
    const S = [
      [6, 9, 4, 7, 3, 5, 1, 4], [4, 7, 4, 4, 3, 2], [7, 8, 9, 6, 10, 4, 12, 3], [10, 4, 10, 1], [6.5, 6, 6, 3, 7, 1],
      [6, 4, 4, 2], [9, 6, 11, 6], [3, 5, 2, 7],
    ];
    m.segs = S.map((p) => ({ k: 'B', w: 2.4, pts: p }));
    // crow (or an owl)
    if (flip) { mset(m, 10, 3, 'K'); mset(m, 11, 3, 'K'); mset(m, 11, 2, 'A'); }
    else { mset(m, 3, 4, 'b'); mset(m, 3, 3, 'k'); m.segs.push({ k: 'y', w: 1.4, pts: [3, 3.5, 4, 3.5] }); }
    mset(m, 1, 3, 'q'); mset(m, 12, 2, 'q'); mset(m, 4, 1, 'h');
    return m;
  }
  const PUMPKIN_ROWS = [
    ['...G........', '.oOoOq......', 'oOoOoOq..G..', 'oOoOoOq.oOoq', 'qOoOoOq.oOoq', '.qqqqq...qq.'],
    ['...Gl..', '...G.ll', '.oOoOq.', 'oOoOoOq', 'oOoOoOq', 'qOoOoOq', '.qqqqq.'],
  ];
  const GRAVE_ROWS = [
    ['.aea.', 'aeeea', 'aeAea', 'aAAAa', 'aeAea', 'aeeea', 'AAAAA'],
    ['..b..', '..b..', 'bbkbb', '..b..', '..b..', '..b..', '.lgl.'],
    ['.eee.', 'eaaaa', 'eaaaa', 'eaaaA', 'eaaaA', 'gaaaA', 'AAAAA'],
  ];
  const SCARE_ROWS = [
    '...AAA...', '...AAA...', '.AAAAAAA.', '...CCC...', '...KCK...', '...CCC...',
    'hbbrRrbbh', '...rDr...', '...RrR...', '...hbh...', '....b....', '....b....', '....b....',
  ];
  const HOUSE_ROWS = [
    '.........AA..', '....RRRRRAA..', '...RrrrrrrR..', '..RrrrrrrrrR.', '.RrrrrrrrrrrR', 'RRRRRRRRRRRRR',
    '.ccccccccccC.', '.cyycccccyyC.', '.cyycbbbcyyC.', '.ccccbbbccCC.', '.cCccbkbccCC.', '.CCCCbbbCCCC.',
  ];
  const FENCE_ROWS = ['k....k....k', 'b....b....b', 'b....b....b', 'b....b....b', 'b....b....b'];

  /* =====================================================================
     Small sprites (knots, daisies, sequins, beads, buttons, threads ...)
     ===================================================================== */
  const DS = 5; // decal px per world unit
  function knotSprite(rgb, rad) {
    const s = Math.ceil(rad * DS * 2 + 6);
    return U.sprite(s, s, (ctx) => {
      const c = s / 2, R = rad * DS;
      ctx.fillStyle = 'rgba(40,22,10,0.38)';
      ctx.beginPath(); ctx.arc(c + 0.8, c + 1.3, R, 0, U.TAU); ctx.fill();
      const g = ctx.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R);
      g.addColorStop(0, rgbStr(U.mix(rgb, WHITE, 0.45)));
      g.addColorStop(0.55, rgbStr(rgb));
      g.addColorStop(1, rgbStr(U.mul(rgb, 0.6)));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(c, c, R, 0, U.TAU); ctx.fill();
      // wraps of the knot
      ctx.strokeStyle = rgbStr(U.mul(rgb, 0.6), 0.55);
      ctx.lineWidth = 0.7;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath(); ctx.arc(c, c, R * (0.35 + k * 0.22), 0.4 + k, 2.2 + k); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.arc(c - R * 0.35, c - R * 0.4, R * 0.22, 0, U.TAU); ctx.fill();
    });
  }
  const knotCache = new Map();
  function knot(key, rad = 1.05) {
    rad = Math.round(rad * 10) / 10;
    const id = key + '|' + rad;
    let s = knotCache.get(id);
    if (!s) { s = knotSprite(toRgb(key), rad); knotCache.set(id, s); }
    return s;
  }
  function drawKnot(ctx, key, x, y, rad = 1.05) {
    const s = knot(key, rad);
    ctx.drawImage(s, x - s.width / DS / 2, y - s.height / DS / 2, s.width / DS, s.height / DS);
  }
  function daisySprite(petal, centre) {
    const s = 9 * DS;
    return U.sprite(s, s, (ctx) => {
      const c = s / 2;
      const prgb = toRgb(petal);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * U.TAU - Math.PI / 2 + 0.2;
        const px = c + Math.cos(a) * 1.75 * DS, py = c + Math.sin(a) * 1.75 * DS;
        const layers = [
          ['rgba(40,22,10,0.35)', 3.4, 0.7, 1.1],
          [rgbStr(U.mul(prgb, 0.7)), 3.0, 0, 0],
          [rgbStr(prgb), 1.8, -0.2, -0.25],
          [rgbStr(U.mix(prgb, WHITE, 0.5), 0.8), 0.7, -0.5, -0.6],
        ];
        for (const [st, lw, ox, oy] of layers) {
          ctx.strokeStyle = st; ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.ellipse(px + ox, py + oy, 1.45 * DS, 0.62 * DS, a, 0, U.TAU);
          ctx.stroke();
        }
        // tack stitch at the tip
        const tx = c + Math.cos(a) * 3.3 * DS, ty = c + Math.sin(a) * 3.3 * DS;
        ctx.strokeStyle = rgbStr(U.mul(prgb, 0.75)); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(tx - Math.sin(a) * 1.6, ty + Math.cos(a) * 1.6); ctx.lineTo(tx + Math.sin(a) * 1.6, ty - Math.cos(a) * 1.6); ctx.stroke();
      }
      const kn = knotSprite(toRgb(centre), 0.95);
      ctx.drawImage(kn, c - kn.width / 2, c - kn.height / 2);
    });
  }
  function sequinSprite(rgb) {
    const s = 18;
    return U.sprite(s, s, (ctx) => {
      const c = s / 2, R = 7;
      ctx.fillStyle = 'rgba(40,22,10,0.4)';
      ctx.beginPath(); ctx.arc(c + 0.8, c + 1.2, R, 0, U.TAU); ctx.fill();
      const g = ctx.createLinearGradient(c - R, c - R, c + R, c + R);
      g.addColorStop(0, rgbStr(U.mix(rgb, WHITE, 0.7)));
      g.addColorStop(0.35, rgbStr(rgb));
      g.addColorStop(0.6, rgbStr(U.mul(rgb, 0.55)));
      g.addColorStop(0.85, rgbStr(U.mix(rgb, WHITE, 0.35)));
      g.addColorStop(1, rgbStr(U.mul(rgb, 0.7)));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(c, c, R, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = rgbStr(U.mul(rgb, 0.5)); ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = '#3a2618';
      ctx.beginPath(); ctx.arc(c, c, 1.4, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = '#efe4c8'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(c + R * 0.95, c - R * 0.15); ctx.stroke();
    });
  }
  function beadSprite(rgb, size) {
    const s = size;
    return U.sprite(s, s, (ctx) => {
      const c = s / 2, R = s * 0.36;
      ctx.fillStyle = 'rgba(40,22,10,0.35)';
      ctx.beginPath(); ctx.ellipse(c + 0.6, c + 1, R, R * 0.9, 0, 0, U.TAU); ctx.fill();
      const g = ctx.createRadialGradient(c - R * 0.4, c - R * 0.45, R * 0.1, c, c, R);
      g.addColorStop(0, rgbStr(U.mix(rgb, WHITE, 0.75)));
      g.addColorStop(0.45, rgbStr(rgb));
      g.addColorStop(1, rgbStr(U.mul(rgb, 0.5)));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(c, c, R, R * 0.9, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = rgbStr(U.mul(rgb, 0.35), 0.8);
      ctx.beginPath(); ctx.ellipse(c, c, R * 0.3, R * 0.25, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(c - R * 0.42, c - R * 0.45, R * 0.18, 0, U.TAU); ctx.fill();
    });
  }
  const beadCache = new Map();
  function bead(colorStr) {
    let s = beadCache.get(colorStr);
    if (!s) { s = beadSprite(toRgb(colorStr), 12); beadCache.set(colorStr, s); }
    return s;
  }
  function buttonSprite(rgb, s) {
    return U.sprite(s, s, (ctx) => {
      const c = s / 2, R = s * 0.42;
      ctx.fillStyle = 'rgba(40,22,10,0.4)';
      ctx.beginPath(); ctx.arc(c + 1, c + 1.5, R, 0, U.TAU); ctx.fill();
      const g = ctx.createRadialGradient(c - R * 0.4, c - R * 0.4, R * 0.1, c, c, R);
      g.addColorStop(0, rgbStr(U.mix(rgb, WHITE, 0.5)));
      g.addColorStop(0.6, rgbStr(rgb));
      g.addColorStop(1, rgbStr(U.mul(rgb, 0.6)));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(c, c, R, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = rgbStr(U.mul(rgb, 0.55)); ctx.lineWidth = s * 0.05;
      ctx.beginPath(); ctx.arc(c, c, R * 0.72, 0, U.TAU); ctx.stroke();
      const hp = R * 0.28;
      // cross thread through 4 holes
      ctx.strokeStyle = '#f3e6bf'; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(c - hp, c - hp); ctx.lineTo(c + hp, c + hp); ctx.moveTo(c + hp, c - hp); ctx.lineTo(c - hp, c + hp); ctx.stroke();
      ctx.fillStyle = rgbStr(U.mul(rgb, 0.35));
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        ctx.beginPath(); ctx.arc(c + dx * hp, c + dy * hp, s * 0.045, 0, U.TAU); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(c - R * 0.5, c - R * 0.5, R * 0.13, 0, U.TAU); ctx.fill();
    });
  }
  // loose thread snippet (curly), 4 px per world unit
  function threadSprite(rgb, shape) {
    const s = 32;
    return U.sprite(s, s, (ctx) => {
      const r = U.rng(shape * 131 + 7);
      const pts = [];
      let x = 6 + r.next() * 4, y = 10 + r.next() * 12, a = r.next() * 0.8 - 0.4;
      for (let k = 0; k < 6; k++) {
        pts.push(x, y);
        a += (r.next() - 0.5) * 1.8;
        x += Math.cos(a) * 4; y += Math.sin(a) * 4;
        x = U.clamp(x, 3, s - 3); y = U.clamp(y, 3, s - 3);
      }
      const draw = (st, lw, ox, oy) => {
        ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(pts[0] + ox, pts[1] + oy);
        for (let k = 2; k < pts.length - 2; k += 2) {
          const mx = (pts[k] + pts[k + 2]) / 2, my = (pts[k + 1] + pts[k + 3]) / 2;
          ctx.quadraticCurveTo(pts[k] + ox, pts[k + 1] + oy, mx + ox, my + oy);
        }
        ctx.stroke();
      };
      draw('rgba(40,22,10,0.3)', 2.6, 0.8, 1.2);
      draw(rgbStr(U.mul(rgb, 0.72)), 2.4, 0, 0);
      draw(rgbStr(rgb), 1.4, -0.2, -0.3);
      draw(rgbStr(U.mix(rgb, WHITE, 0.5), 0.7), 0.5, -0.5, -0.6);
    });
  }
  const threadCache = new Map();
  function threadSpr(colorStr, shape) {
    const id = colorStr + '|' + shape;
    let s = threadCache.get(id);
    if (!s) { s = threadSprite(toRgb(colorStr), shape); threadCache.set(id, s); }
    return s;
  }
  function glowSprite(r, rgb, a) {
    const s = Math.ceil(r * 2);
    return U.sprite(s, s, (ctx) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, rgbStr(rgb, a));
      g.addColorStop(0.4, rgbStr(rgb, a * 0.45));
      g.addColorStop(1, rgbStr(rgb, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    });
  }
  function satinSprite(rgb, L, v) {
    const Wd = L * CP + SM * 2, Hd = CP + SM * 2;
    return U.sprite(Wd, Hd, (ctx) => {
      const r = U.rng(v * 31 + L * 7 + rgb[2]);
      ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const y = SM + 1.4 + k * 2.6 + (r.next() - 0.5) * 0.3;
        const x0 = SM + 0.7, x1 = SM + L * CP - 0.7, sl = 0.9;
        const base = U.mul(rgb, 0.94 + r.next() * 0.12);
        const line = (st, lw, ox, oy) => { ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0 + ox, y - sl + oy); ctx.lineTo(x1 + ox, y + sl + oy); ctx.stroke(); };
        line('rgba(20,20,40,0.3)', 2.7, 0.3, 0.9);
        line(rgbStr(U.mul(base, 0.75)), 2.5, 0, 0);
        line(rgbStr(base), 1.6, 0, -0.2);
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = rgbStr(U.mix(base, WHITE, 0.55));
        ctx.lineWidth = 0.6;
        const a0 = 0.15 + r.next() * 0.3;
        ctx.beginPath(); ctx.moveTo(U.lerp(x0, x1, a0), y - sl + 2 * sl * a0 - 0.6); ctx.lineTo(U.lerp(x0, x1, a0 + 0.35), y - sl + 2 * sl * (a0 + 0.35) - 0.6); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
  }
  function needleSprite() {
    return U.sprite(40, 40, (ctx) => {
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(40,22,10,0.35)'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(10, 32); ctx.lineTo(33, 6); ctx.stroke();
      const g = ctx.createLinearGradient(8, 30, 32, 4);
      g.addColorStop(0, '#8c8f96'); g.addColorStop(0.5, '#f4f6fa'); g.addColorStop(1, '#a7aab2');
      ctx.strokeStyle = g; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(9, 30); ctx.lineTo(32, 4); ctx.stroke();
      ctx.strokeStyle = '#6a6d74'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.ellipse(29.5, 7, 1.6, 0.6, -0.85, 0, U.TAU); ctx.stroke();
      ctx.strokeStyle = '#c3312b'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(29.5, 7); ctx.quadraticCurveTo(38, 14, 30, 22); ctx.quadraticCurveTo(24, 30, 31, 38); ctx.stroke();
    });
  }

  /* =====================================================================
     Ground
     ===================================================================== */
  const SD = { forest: 7101, path: 7203, pw1: 7207, pw2: 7211, phw: 7215, pond: 7301, macro: 7313, mead: 7321, mtone: 7323, dry: 7327, ftone: 7331, fold: 7337, field: 7401, grave: 7411, prop: 7501, dec: 7601 };
  const MEADOW = 0, FOREST = 1, FIELD = 2, POND = 3, PATH = 4;
  const FOREST_T = 0.58, POND_T = 0.66;
  const forestF = (x, y) => U.warped(x / 760, y / 760, SD.forest, 1.1, 3);
  const pondF = (x, y) => U.warped(x / 420, y / 420, SD.pond, 0.7, 2);
  function pathN(x, y) {
    const qx = U.fbm(x / 520, y / 520, SD.pw1, 2) - 0.5, qy = U.fbm(x / 520 + 3.7, y / 520 - 1.9, SD.pw2, 2) - 0.5;
    return U.perlin((x + qx * 340) / 1050, (y + qy * 340) / 1050, SD.path);
  }
  const pathHW = (x, y) => 7.5 + 5 * U.noise(x / 900, y / 900, SD.phw);
  const pnAt = (i, j) => pathN((i + 0.5) * C, (j + 0.5) * C);
  function pathDistCell(i, j) {
    const n = pnAt(i, j);
    const gx = (pnAt(i + 1, j) - pnAt(i - 1, j)) / (2 * C), gy = (pnAt(i, j + 1) - pnAt(i, j - 1)) / (2 * C);
    return Math.min(400, Math.abs(n) / Math.max(1e-6, Math.hypot(gx, gy)));
  }

  // farm fields: one optional cell-aligned rectangle per 430 x 340 macro cell
  const FW = 430, FH = 340;
  const fieldCache = new Map();
  function fieldCell(fi, fj) {
    const key = fi + ',' + fj;
    let f = fieldCache.get(key);
    if (f !== undefined) return f;
    f = null;
    const r = U.rng(U.hashInt(fi, fj, SD.field));
    if (r.next() < 0.68) {
      const w = r.range(160, 320), h = r.range(110, 220);
      const x0 = fi * FW + r.range(24, FW - w - 24), y0 = fj * FH + r.range(24, FH - h - 24);
      const cx = x0 + w / 2, cy = y0 + h / 2;
      const i0 = Math.round(x0 / C), j0 = Math.round(y0 / C);
      if (forestF(cx, cy) < 0.53 && pondF(cx, cy) < 0.6 && pathDistCell(Math.floor(cx / C), Math.floor(cy / C)) > 40) {
        f = {
          i0, j0, i1: i0 + Math.round(w / C), j1: j0 + Math.round(h / C), cx, cy,
          crop: r.next() < 0.5 ? 0 : r.next() < 0.5 ? 1 : 2, horiz: r.next() < 0.7,
          seed: (r.next() * 1e6) | 0, fence: r.next() < 0.6, scare: r.next() < 0.55,
        };
      }
    }
    if (fieldCache.size > 4000) fieldCache.clear();
    fieldCache.set(key, f);
    return f;
  }
  function fieldAtCell(i, j) {
    const x = (i + 0.5) * C, y = (j + 0.5) * C;
    const f = fieldCell(Math.floor(x / FW), Math.floor(y / FH));
    return f && i >= f.i0 && i < f.i1 && j >= f.j0 && j < f.j1 ? f : null;
  }
  function fieldsIn(x0, y0, x1, y1) {
    const out = [];
    for (let fj = Math.floor(y0 / FH); fj <= Math.floor(y1 / FH); fj++) for (let fi = Math.floor(x0 / FW); fi <= Math.floor(x1 / FW); fi++) {
      const f = fieldCell(fi, fj);
      if (f) out.push(f);
    }
    return out;
  }

  // classify one cell; pd = path distance (world units)
  function classify(i, j, pd, out) {
    const x = (i + 0.5) * C, y = (j + 0.5) * C;
    out.f = null; out.v = 0;
    const hw = pathHW(x, y);
    if (pd < hw) { out.m = PATH; out.v = pd / hw; return out; }
    const f = fieldAtCell(i, j);
    if (f) { out.m = FIELD; out.f = f; return out; }
    const F = forestF(x, y);
    if (F > FOREST_T) { out.m = FOREST; out.v = F; return out; }
    if (F < 0.54 && pd > hw + 10) {
      const pv = pondF(x, y);
      if (pv > POND_T) { out.m = POND; out.v = pv; return out; }
    }
    out.m = MEADOW; out.v = F;
    return out;
  }
  const _ci = {};
  function cellInfo(i, j) { return classify(i, j, pathDistCell(i, j), _ci); }

  const MEADOW_TONES = [['L', 'l', 'g'], ['t', 'L', 'l']];
  const FOREST_TONES = ['z', 'X', 'x'];
  const CROPS = [['f', 'h', 'F'], ['l', 'g', 'l'], ['g', 'G', 'g']];
  const POND_TONES = ['W', 'u', 'n', 'N'];
  const EDGE_COL = (a, b) => {
    if (a === b) return null;
    if (a === POND || b === POND) return 'N';
    if (a === PATH || b === PATH) return 'b';
    if (a === FOREST || b === FOREST) return 'B';
    return 'B';
  };
  const bayer = (i, j) => U.bayer8[((j & 7) << 3) | (i & 7)];

  let FAB = null;          // fabric tile
  let SPR = {};            // all sprites

  function* buildChunk(ctx, info) {
    const wx = info.wx, wy = info.wy;
    const ci0 = Math.round(wx / C), cj0 = Math.round(wy / C);
    const MG = 3, N = NC + MG * 2, NP = N + 2;
    const bi = ci0 - MG, bj = cj0 - MG;
    // 1. Aida fabric
    const pat = ctx.createPattern(FAB, 'repeat');
    pat.setTransform(new DOMMatrix([K, 0, 0, K, 0, 0]));
    ctx.fillStyle = pat;
    ctx.fillRect(wx, wy, CS, CS);
    yield;
    // 2. material grid
    const PNg = new Float32Array(NP * NP);
    for (let b = 0; b < NP; b++) {
      for (let a = 0; a < NP; a++) PNg[b * NP + a] = pathN((bi - 1 + a + 0.5) * C, (bj - 1 + b + 0.5) * C);
      if (b & 1) yield;
    }
    const MAT = new Uint8Array(N * N), VAL = new Float32Array(N * N), FLD = new Array(N * N);
    const o = {};
    for (let b = 0; b < N; b++) {
      for (let a = 0; a < N; a++) {
        const pa = (b + 1) * NP + (a + 1);
        const gx = (PNg[pa + 1] - PNg[pa - 1]) / (2 * C), gy = (PNg[pa + NP] - PNg[pa - NP]) / (2 * C);
        const pd = Math.min(400, Math.abs(PNg[pa]) / Math.max(1e-6, Math.hypot(gx, gy)));
        classify(bi + a, bj + b, pd, o);
        const q = b * N + a;
        MAT[q] = o.m; VAL[q] = o.v; FLD[q] = o.f;
      }
      yield;
    }
    const matAt = (i, j) => {
      const a = i - bi, b = j - bj;
      if (a >= 0 && b >= 0 && a < N && b < N) return MAT[b * N + a];
      return cellInfo(i, j).m;
    };
    // 3. bare linen path (lighter fabric)
    ctx.fillStyle = 'rgba(255,250,236,0.42)';
    for (let b = MG; b < MG + NC; b++) {
      let run = -1;
      for (let a = MG; a <= MG + NC; a++) {
        const isP = a < MG + NC && MAT[b * N + a] === PATH;
        if (isP && run < 0) run = a;
        if (!isP && run >= 0) { ctx.fillRect((bi + run) * C, (bj + b) * C, (a - run) * C, C); run = -1; }
      }
    }
    yield;
    // 4. stitches
    yield 'stitch';
    const SO = SM * K;
    // cells are collected per thread colour into one path each (merged row runs) and filled with a
    // seamless stitch pattern -> a dozen fill calls per chunk instead of thousands of drawImage calls
    const paths = new Map(), knots = [];
    let runKey = null, runX = 0, runY = 0, runN = 0;
    const endRun = () => {
      if (runKey) {
        let pth = paths.get(runKey);
        if (!pth) { pth = new Path2D(); paths.set(runKey, pth); }
        pth.rect(runX, runY, runN * C, C);
      }
      runKey = null; runN = 0;
    };
    for (let b = MG; b < MG + NC; b++) {
      const j = bj + b;
      for (let a = MG; a < MG + NC; a++) {
        const q = b * N + a, m = MAT[q], i = bi + a;
        const x = i * C, y = j * C;
        let key = null, half = false;
        if (m === MEADOW) {
          const cx = x + C / 2, cy = y + C / 2;
          let dens = 0.03 + 0.24 * U.smoothstep(0.36, 0.78, U.fbm(cx / 190, cy / 190, SD.mead, 3));
          dens += 0.36 * U.smoothstep(0.5, FOREST_T, VAL[q]);
          if (bayer(i, j) * 0.55 + U.hash2(i, j, 17) * 0.45 < dens) {
            const tn = U.fbm(cx / 260, cy / 260, SD.mtone, 2);
            const tones = MEADOW_TONES[U.noise(cx / 600, cy / 600, SD.dry) > 0.62 ? 1 : 0];
            key = tones[U.clamp(Math.floor(tn * 3.4 - 0.2 + (bayer(i + 3, j + 5) - 0.5) * 0.9), 0, 2)];
          }
        } else if (m === FOREST) {
          const cx = x + C / 2, cy = y + C / 2;
          const tn = U.fbm(cx / 150, cy / 150, SD.ftone, 2);
          key = FOREST_TONES[U.clamp(Math.floor(tn * 3.6 - 0.3 + (bayer(i, j) - 0.5) * 0.9), 0, 2)];
          const hh = U.hash2(i, j, 91);
          if (hh < 0.018) key = 'h'; else if (hh < 0.034) key = 'o';
        } else if (m === FIELD) {
          const f = FLD[q];
          const r = (f.horiz ? j - f.j0 : i - f.i0) % 4;
          if (r !== 3) {
            key = CROPS[f.crop][r];
            half = true;
            if (f.crop === 2 && r === 1 && U.hash2(i, j, f.seed) < 0.1) { key = 'O'; half = false; }
          }
        }
        const pk = key ? key + (half ? 'h' : 'x') : null;
        if (pk !== runKey) { endRun(); if (pk) { runKey = pk; runX = x; runY = y; } }
        if (pk) runN++;
        // rutabaga field: purple knots on the leaf rows
        if (m === FIELD) {
          const f = FLD[q];
          const r = (f.horiz ? j - f.j0 : i - f.i0) % 4;
          if (f.crop === 1 && r === 1 && ((f.horiz ? i : j) % 3 === 0)) knots.push(x + C / 2, y + C / 2, U.hash2(i, j, 3) < 0.5 ? 'p' : 'm');
        }
      }
      endRun();
      if ((b & 1) === 0) yield;
    }
    for (const [pk, pth] of paths) {
      const pat = ctx.createPattern(stitchPattern(pk), 'repeat');
      pat.setTransform(new DOMMatrix([K, 0, 0, K, 0, 0]));
      ctx.fillStyle = pat;
      ctx.fill(pth);
      yield;
    }
    for (let k = 0; k < knots.length; k += 3) drawKnot(ctx, knots[k + 2], knots[k], knots[k + 1], 1.15);
    yield 'pond';
    // 5. pond: satin stitch blocks (brick pattern, global boundaries)
    for (let b = MG; b < MG + NC; b++) {
      const j = bj + b;
      const off = ((j % 3) + 3) % 3;
      let hasPond = false;
      for (let a = MG; a < MG + NC; a++) if (MAT[b * N + a] === POND) { hasPond = true; break; }
      if (!hasPond) continue;
      const iStart = ci0 - 3, iEnd = ci0 + NC + 3;
      let s0 = Math.floor((iStart - off) / 3) * 3 + off;
      for (let s = s0; s < iEnd; s += 3) {
        let k = 0;
        while (k < 3) {
          if (matAt(s + k, j) !== POND) { k++; continue; }
          let e = k;
          while (e < 3 && matAt(s + e, j) === POND) e++;
          const L = e - k, si = s + k;
          const pv = cellInfoPond(si, j, bi, bj, N, VAL, MAT);
          const tone = POND_TONES[U.clamp(Math.floor((pv - POND_T) / 0.045 + (U.hash2(si, j, 8) - 0.5) * 0.8), 0, 3)];
          const spr = SPR.satin[tone][L - 1][U.hashInt(si, j, 9) % 2];
          ctx.drawImage(spr, si * C - SO, j * C - SO, spr.width * K, spr.height * K);
          k = e;
        }
      }
      if (b & 1) yield;
    }
    // 6. decals
    yield 'decals';
    yield* decals(ctx, info, matAt);
    // 7. backstitch region contours
    yield 'edges';
    const segs = { N: [], b: [], B: [] };
    const xA = wx - C, xB = wx + CS + C, yA = wy - C, yB = wy + CS + C;
    for (let b = MG - 1; b <= MG + NC; b++) {
      for (let a = MG - 1; a <= MG + NC; a++) {
        const m = MAT[b * N + a];
        const x = (bi + a) * C, y = (bj + b) * C;
        if (a + 1 < N) {
          const col = EDGE_COL(m, MAT[b * N + a + 1]);
          if (col && x + C >= xA && x + C <= xB) segs[col].push(x + C, y, x + C, y + C);
        }
        if (b + 1 < N) {
          const col = EDGE_COL(m, MAT[(b + 1) * N + a]);
          if (col && y + C >= yA && y + C <= yB) segs[col].push(x, y + C, x + C, y + C);
        }
      }
    }
    yield;
    for (const k in segs) { threadSegs(ctx, segs[k], PALR[k], 1.0, 0.3); yield; }
    yield 'cloth';
    // 8. cloth light: macro tint + soft folds
    const ON = NC + 2;
    const ov = U.canvas(ON, ON);
    const img = ov.ctx.createImageData(ON, ON), d = img.data;
    for (let b = 0; b < ON; b++) {
      for (let a = 0; a < ON; a++) {
        const x = (ci0 - 1 + a + 0.5) * C, y = (cj0 - 1 + b + 0.5) * C;
        const u = x * 0.8 + y * 0.6, v = -x * 0.6 + y * 0.8;
        const f0 = U.perlin(u / 1100, (v - 7) / 260, SD.fold), f1 = U.perlin(u / 1100, (v + 7) / 260, SD.fold);
        let s = (f0 - f1) * 1.3 + (U.fbm(x / 800, y / 800, SD.macro, 2) - 0.5) * 0.28;
        const o4 = (b * ON + a) * 4;
        if (s > 0) { d[o4] = 255; d[o4 + 1] = 248; d[o4 + 2] = 228; }
        else { d[o4] = 62; d[o4 + 1] = 38; d[o4 + 2] = 22; }
        d[o4 + 3] = Math.min(0.15, Math.abs(s)) * 255;
      }
      if (b & 3) continue;
      yield;
    }
    ov.ctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(ov.c, wx - C, wy - C, ON * C, ON * C);
  }
  function cellInfoPond(i, j, bi, bj, N, VAL, MAT) {
    const a = i - bi, b = j - bj;
    if (a >= 0 && b >= 0 && a < N && b < N && MAT[b * N + a] === POND) return VAL[b * N + a];
    return pondF((i + 0.5) * C, (j + 0.5) * C);
  }

  function* decals(ctx, info, matAt) {
    const list = [];
    G.scatter(info, 21, SD.dec, 8, (x, y, rng) => list.push([x, y, rng.next(), rng.next(), rng.next(), rng.next()]));
    let n = 0;
    for (const [x, y, r0, r1, r2, r3] of list) {
      if ((++n & 15) === 0) yield;
      const i = Math.floor(x / C), j = Math.floor(y / C);
      const m = matAt(i, j);
      const hx = i * C, hy = j * C; // hole (top-left corner of the cell)
      if (m === MEADOW) {
        if (matAt(i - 1, j) !== MEADOW || matAt(i + 1, j) !== MEADOW || matAt(i, j - 1) !== MEADOW || matAt(i, j + 1) !== MEADOW) continue;
        if (r0 < 0.26) {
          // French knot flower cluster with stems
          const cols = ['s', 'w', 'h', 'V', 'm', 'E'];
          const ck = cols[Math.floor(r1 * cols.length)];
          threadSegs(ctx, [hx, hy + C * 1.6, hx + C * 0.1, hy + C * 0.4, hx, hy + C * 1.6, hx - C * 0.7, hy + C * 0.7], PALR.g, 0.6, 0.15);
          const nk = 3 + Math.floor(r2 * 3);
          for (let k = 0; k < nk; k++) {
            const a = (k / nk) * U.TAU + r3 * 3;
            drawKnot(ctx, ck, hx + Math.cos(a) * 1.25, hy + Math.sin(a) * 1.0, 0.95);
          }
          drawKnot(ctx, ck === 'h' ? 'q' : 'y', hx, hy, 0.75);
        } else if (r0 < 0.36) {
          const spr = SPR.daisy[Math.floor(r1 * SPR.daisy.length)];
          threadSegs(ctx, [hx, hy + 2, hx + 0.6, hy + 7], PALR.g, 0.6, 0.1);
          ctx.drawImage(spr, hx - spr.width / DS / 2, hy - spr.height / DS / 2, spr.width / DS, spr.height / DS);
        } else if (r0 < 0.56) {
          // grass tuft: three straight stitches from one hole
          const k = r1 < 0.5 ? PALR.g : PALR.l;
          threadSegs(ctx, [hx, hy + C, hx - C * 0.7, hy - C * 0.3, hx, hy + C, hx + C * 0.1, hy - C * 0.8, hx, hy + C, hx + C * 0.8, hy - C * 0.2], k, 0.62, 0.12);
        } else if (r0 < 0.585) {
          const spr = SPR.sequins[Math.floor(r1 * SPR.sequins.length)];
          ctx.drawImage(spr, hx - 1.8, hy - 1.8, 3.6, 3.6);
        } else if (r0 < 0.61) {
          for (let k = 0; k < 3; k++) {
            const spr = bead(['#c3312b', '#f3e6bf', '#e3b24d', '#7b59a8'][Math.floor(r1 * 4)]);
            ctx.drawImage(spr, hx + (k - 1) * 1.7 - 1.2, hy + Math.sin(k + r2 * 6) * 0.8 - 1.2, 2.4, 2.4);
          }
        } else if (r0 < 0.62) {
          blitCell(ctx, SPR.mush, i - 1, j - 1);
        }
      } else if (m === FOREST) {
        if (r0 < 0.24) blitCell(ctx, SPR.leaves[Math.floor(r1 * SPR.leaves.length)], i - 1, j - 1);
        else if (r0 < 0.29) blitCell(ctx, SPR.mush, i - 1, j - 1);
        else if (r0 < 0.4) { drawKnot(ctx, 'b', hx, hy, 1.0); drawKnot(ctx, 'k', hx + 1.3, hy + 0.9, 0.85); }
      } else if (m === POND) {
        if (matAt(i - 2, j) !== POND || matAt(i + 2, j) !== POND || matAt(i, j - 2) !== POND || matAt(i, j + 2) !== POND) continue;
        if (r0 < 0.12) {
          blitCell(ctx, SPR.lily, i - 1, j - 1);
          if (r1 < 0.5) drawKnot(ctx, 's', hx + C * 0.5, hy - C * 0.1, 1.0);
        } else if (r0 < 0.45) {
          threadSegs(ctx, [hx, hy, hx + C * 1.5, hy, hx + C * 2.5, hy + C, hx + C * 3.3, hy + C], PALR.w, 0.55, 0.2);
        }
      } else if (m === PATH) {
        if (r0 < 0.18) drawKnot(ctx, ['e', 'a', 'k', 'C'][Math.floor(r1 * 4)], hx + C / 2, hy + C / 2, 0.8 + r2 * 0.4);
      }
    }
  }

  /* =====================================================================
     Bitmap stitch digits
     ===================================================================== */
  const DIGITS = {
    0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###', '..#', '###', '#..', '###'],
    3: ['###', '..#', '.##', '..#', '###'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '###', '..#', '###'],
    6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '..#', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
    9: ['###', '#.#', '###', '..#', '###'],
  };
  function digitSprites(key, outline) {
    const out = [];
    for (let d = 0; d < 10; d++) out.push(renderMotif(motif(DIGITS[d].map((r) => r.replace(/#/g, key)), outline), { shadowAlpha: 0.5 }));
    return out;
  }

  /* =====================================================================
     Icons (12 x 12 cross-stitch motifs)
     ===================================================================== */
  const ICONS = {
    'hp-heart': ['............', '.rrr....rrr.', 'rEErr..rrrrR', 'rEwrrrrrrrrR', 'rErrrrrrrrrR', 'rrrrrrrrrrRR', '.rrrrrrrrRR.', '..rrrrrrRR..', '...rrrrRR...', '....rrRR....', '.....RR.....'],
    kills: ['.....gG.....', '...g.Gg.g...', '....gGGg....', '...PPpPPP...', '..PpmppppP..', '.PpmpppppPP.', '.PpyppppyPP.', '.ppcccccCpp.', '.ccccRRcccC.', '..cccccccC..', '...CcccCC...', '.....kk.....'],
    dmg: ['.........y..', '........yYy.', '.........y..', '.....cc.....', '....cwcC....', '...cwccCk...', '...ccccCk...', '...cccCCk...', '....cCCk....', '.....Ck..y..', '........yYy.', '.........y..'],
    rate: ['............', '....eeee....', '...eaeaea...', '...aeaeaa...', '...eaeaeA...', '...aeaeaA...', '...eaeaeA...', '...aeaeaA...', '..AAAAAAAA..', '..aaaaaaaA..', '............'],
    multi: ['....b..b....', '...b....b...', '..qOOOOOOq..', '.qOoOOOOOOq.', '.qoOyOOyOOq.', '.qOOOOOOOOq.', '.qOyyyyyyOq.', '.qOOyOOyOOq.', '..qOOOOOOq..', '...qqqqqq...'],
    bounce: ['............', '.........cc.', '........cwcC', '........cCC.', '............', '............', '...cc.......', '..cwcC......', '..cCC.......', '............', 'ggggggggggg.', 'GGGGGGGGGGG.'],
    lantern: ['....g.G.....', '.....gG.....', '...PPpPP....', '..PpmppPP...', '..PyPPyPP...', '..ccccccC...', '..cyyyycC...', '..ccyycCC...', '...cccCC....', '....CC......', '............'],
    speed: ['............', '.........w..', '........wYw.', '.........w..', '..........I.', '.........WI.', '........WWI.', '.IIII..WWWI.', 'IWWWWIWWWWI.', 'IWwWWWWWWII.', '.IIIIIIIIIj.', '.j.......j..'],
    magnet: ['....bbbb....', '...b....b...', '..b.qOq..b..', '..bqOoOqgb..', '.kbkbkbkbkb.', '.bkbkbkbkbk.', '.kbkbkbkbkb.', '..bkbkbkbk..', '..kbkbkbkb..', '...bbbbbb...'],
    hp: ['............', '............', '............', '............', '.AAAAAAAAAA.', 'AaOpOcOpOcaA', 'AaaaaaaaaaaA', '.aaaaaaaaaA.', '.aaaaaaaaaA.', '..aaaaaaAA..', '...AAAAAA...'],
  };
  const ICON_SEGS = {
    rate: [{ k: 'h', w: 1.6, pts: [0.5, 4, 2.5, 4] }, { k: 'h', w: 1.6, pts: [0, 6, 2.5, 6] }, { k: 'h', w: 1.6, pts: [0.5, 8, 2.5, 8] }],
    bounce: [{ k: 'r', w: 1.4, pts: [3.5, 6, 4, 4, 5, 3, 6, 3, 7, 4, 7.5, 6, 8, 8, 8.5, 9.5] }, { k: 'r', w: 1.4, pts: [8.5, 9.5, 9, 7, 9.5, 5] }],
    magnet: [],
    hp: [{ k: 'e', w: 1.5, pts: [4, 3.6, 3.4, 2.6, 4, 1.6, 3.4, 0.6] }, { k: 'e', w: 1.5, pts: [7, 3.6, 6.4, 2.6, 7, 1.6, 6.4, 0.6] }, { k: 'e', w: 1.5, pts: [9.5, 3.6, 9, 2.8, 9.5, 2] }],
  };
  const iconCache = {};
  function iconSprite(id) {
    if (iconCache[id]) return iconCache[id];
    const rows = ICONS[id] || ICONS.kills;
    const m = motif(rows, id === 'speed' ? 'j' : 'K', ICON_SEGS[id] || []);
    return (iconCache[id] = renderMotif(m, { shadowAlpha: 0.5 }));
  }

  /* =====================================================================
     HUD textures (generated once, used as data-URL backgrounds)
     ===================================================================== */
  function aidaCanvas(cells, cp, baseHex) {
    const n = cells * cp;
    const base = U.hex(baseHex);
    const { c, ctx } = U.canvas(n, n);
    const img = ctx.createImageData(n, n), d = img.data;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const lx = x % cp, ly = y % cp;
      const ex = lx === 0 || lx === cp - 1, ey = ly === 0 || ly === cp - 1;
      let f = 1;
      if (ex && ey) f = 0.74;
      else if (ex || ey) f = 0.93;
      else f = (((lx >> 1) + (ly >> 1)) & 1) ? 1.03 : 0.985;
      f *= 1 + (U.hash2(y >> 1, 0, 11) - 0.5) * 0.035 + (U.hash2(0, x >> 1, 12) - 0.5) * 0.035 + (U.hash2(x, y, 13) - 0.5) * 0.03;
      const o = (y * n + x) * 4;
      d[o] = base[0] * f; d[o + 1] = base[1] * f; d[o + 2] = base[2] * f; d[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  function stitchTile(key, fabricHex, under, uf = 0.64) {
    const { c, ctx } = U.canvas(CP, CP);
    if (fabricHex) ctx.drawImage(aidaCanvas(1, CP, fabricHex), 0, 0);
    if (under) { ctx.fillStyle = rgbStr(U.mul(PALR[key], uf)); ctx.fillRect(0.6, 0.6, CP - 1.2, CP - 1.2); }
    ctx.drawImage(stitchSet(PALR[key], false)[0], -SM, -SM);
    return c.toDataURL();
  }
  let CSS_CACHE = null;
  function buildCss() {
    if (CSS_CACHE) return CSS_CACHE;
    const fab = aidaCanvas(4, 8, '#efe3c4').toDataURL();
    const fabD = aidaCanvas(4, 8, '#ddcba4').toDataURL();
    const xpT = stitchTile('h', '#ddcba4', true), hpT = stitchTile('r', '#ddcba4', true);
    const tO = stitchTile('o', null, true, 0.8), tP = stitchTile('m', null, true, 0.8);
    const B = 'body.style-crossstitch';
    const SAT = (a, b, c2) => `repeating-linear-gradient(-52deg, ${a} 0 2px, ${b} 2px 3px, ${c2} 3px 4.5px)`;
    const TAG = (a, b, c2, dash) => `border: 5px solid transparent; border-radius: 12px;
      background: url(${fab}) padding-box, ${SAT(a, b, c2)} border-box;
      outline: 2px dashed ${dash}; outline-offset: -10px;
      box-shadow: 0 4px 0 rgba(50,26,10,.35), 0 6px 14px rgba(20,10,4,.35);`;
    const STITCHED = (url, px) => `background: url(${url}) 0 0/${px}px ${px}px; -webkit-background-clip: text; background-clip: text; color: transparent;`;
    CSS_CACHE = `
${B} { font-family: 'Mali', 'Grandstander', sans-serif; color: #4a2c1e; }
${B} #hud { padding: 12px 18px; }
${B} #hud .xp { height: 26px; margin: 2px 4px 0; border-radius: 6px; border: 5px solid transparent; overflow: hidden;
  background: url(${fabD}) padding-box, ${SAT('#b98a52', '#8e6136', '#d8ab70')} border-box;
  box-shadow: 0 3px 0 rgba(50,26,10,.35), 0 5px 12px rgba(20,10,4,.3); }
${B} #hud .xp-fill { background: url(${xpT}) 0 0/8px 8px; transition: width .15s; }
${B} #hud .lvl { right: 6px; font: 800 13px 'Grandstander', sans-serif; color: #fff7e4; background: #7a1c24; padding: 0 8px; border-radius: 4px;
  outline: 1px dashed #f3c99c; outline-offset: -3px; line-height: 15px; text-shadow: none; z-index: 2; }
${B} #hud .topline { margin-top: 10px; align-items: flex-start; }
${B} #hud .hp { ${TAG('#c0442c', '#8c2a1c', '#e0704c', 'rgba(124,29,36,.55)')} padding: 7px 16px 7px 10px; gap: 10px; }
${B} #hud .hp-icon, ${B} #hud .kills-icon { width: 40px; height: 40px; }
${B} #hud .hp-bar { width: 216px; height: 18px; border: 0; border-radius: 3px; background: url(${fabD}) 0 0/32px 32px;
  box-shadow: inset 0 0 0 1px rgba(110,70,30,.45), inset 0 2px 3px rgba(60,30,10,.25); }
${B} #hud .hp-fill { background: url(${hpT}) 0 1px/8px 8px; }
${B} #hud .hp-text { font: 800 17px 'Grandstander', sans-serif; color: #7a1c24; min-width: 76px; text-shadow: 0 1px 0 rgba(255,255,255,.6); }
${B}.hurt #hud .hp-bar { filter: none; box-shadow: inset 0 0 0 2px #ff8a5a, 0 0 8px #ff8a5a; }
${B} #hud .clock { position: relative; width: 138px; height: 138px; border-radius: 50%; justify-content: center; margin-top: 8px;
  border: 10px solid transparent;
  background: radial-gradient(circle, rgba(255,250,235,.5) 0 40%, rgba(120,80,40,.18) 100%) padding-box, url(${fab}) padding-box,
    repeating-radial-gradient(circle, #c98f55 0 2px, #b47842 2px 3.5px, #d9a46a 3.5px 5px) border-box;
  box-shadow: inset 0 0 0 1px #7a4c26, inset 0 5px 10px rgba(70,40,15,.35), 0 0 0 2px #6b4221, 0 0 0 5px #d39c60, 0 0 0 7px #6b4221,
    0 7px 0 rgba(40,20,8,.3), 0 8px 18px rgba(20,10,4,.4); }
${B} #hud .clock::before { content: ''; position: absolute; top: -27px; left: 50%; width: 24px; height: 14px; margin-left: -12px;
  background: linear-gradient(90deg, #7d7f84, #f1f2f4 40%, #a3a5aa 70%, #6c6e73); border-radius: 3px; box-shadow: 0 0 0 2px #45464a; }
${B} #hud .clock::after { content: ''; position: absolute; inset: 4px; border-radius: 50%; border: 2px dashed rgba(124,29,36,.5); }
${B} #hud .clock-time { font: 900 35px 'Grandstander', sans-serif; letter-spacing: 1px; line-height: 1; color: #a3302a; margin-top: 6px;
  text-shadow: 0 1px 0 rgba(255,250,235,.9), 0 2px 0 rgba(90,30,15,.25); }
${B} #hud .clock-label { font: 700 11px 'Mali', sans-serif; text-transform: none; letter-spacing: 0; opacity: 1; color: #6a3a1e; margin-top: 4px; }
${B} #hud .kills { ${TAG('#6e3a80', '#4c2160', '#9a62ac', 'rgba(79,37,96,.5)')} padding: 6px 16px 6px 10px; min-width: 0; gap: 8px; }
${B} #hud .kills-num { font: 800 24px 'Grandstander', sans-serif; color: #4f2560; min-width: 52px; text-align: right; text-shadow: 0 1px 0 rgba(255,255,255,.6); }
${B} #stylebar { ${TAG('#5c8a3c', '#3a6028', '#86b45a', 'rgba(45,82,48,.5)')} border-radius: 14px; padding: 8px 20px; gap: 14px; color: #4a2c1e; }
${B} #stylebar .style-family { font: 700 11px 'Mali', sans-serif; letter-spacing: 1.5px; color: #7c4a2b; opacity: 1; }
${B} #stylebar .style-name { font: 800 18px 'Grandstander', sans-serif; color: #a4401b; }
${B} #stylebar .style-hint { font: 600 12px 'Mali', sans-serif; color: #5a3a26; opacity: .9; }
${B} #stylebar .auto.on { color: #2d5230; font-weight: 800; }
${B} #levelup { background: radial-gradient(ellipse at 50% 45%, rgba(80,45,20,.3), rgba(28,14,8,.82)); gap: 28px; }
${B} #levelup .lu-title { font-size: 0; text-shadow: none; }
${B} #levelup .lu-title::after { content: 'Neue Stufe!'; font: 900 70px 'Grandstander', sans-serif; letter-spacing: 2px; ${STITCHED(tO, 8)}
  filter: drop-shadow(0 3px 0 #3a1a0c) drop-shadow(0 0 1px #3a1a0c); }
${B} #levelup .lu-cards { gap: 26px; }
${B} #levelup .card { width: 226px; min-height: 284px; padding: 26px 18px 20px; gap: 10px; border-radius: 26px; border: 8px solid transparent;
  background: radial-gradient(ellipse at 50% 30%, rgba(255,252,240,.55), rgba(255,252,240,0) 70%) padding-box, url(${fab}) padding-box, ${SAT('#d0662e', '#9a3e1a', '#f0924a')} border-box;
  outline: 2px dashed rgba(124,60,30,.65); outline-offset: -14px;
  box-shadow: 0 6px 0 rgba(40,20,8,.5), 0 12px 22px rgba(0,0,0,.4); }
${B} #levelup .card:nth-child(2) { background: radial-gradient(ellipse at 50% 30%, rgba(255,252,240,.55), rgba(255,252,240,0) 70%) padding-box, url(${fab}) padding-box, ${SAT('#7c4a96', '#4f2560', '#a679bc')} border-box; outline-color: rgba(79,37,96,.6); }
${B} #levelup .card:nth-child(3) { background: radial-gradient(ellipse at 50% 30%, rgba(255,252,240,.55), rgba(255,252,240,0) 70%) padding-box, url(${fab}) padding-box, ${SAT('#5c8a3c', '#2d5230', '#8db45a')} border-box; outline-color: rgba(45,82,48,.6); }
${B} #levelup .card:hover { transform: translateY(-8px) rotate(-1.5deg); }
${B} #levelup .card-icon { width: 96px; height: 96px; }
${B} #levelup .card-name { font: 800 22px 'Grandstander', sans-serif; color: #7a1c24; line-height: 1.1; }
${B} #levelup .card-desc { font: 600 15px 'Mali', sans-serif; color: #5a3a26; opacity: 1; line-height: 1.3; }
${B} #levelup .card-key { top: auto; bottom: 12px; left: auto; right: 14px; width: 26px; height: 26px; border-radius: 50%; opacity: 1;
  display: flex; align-items: center; justify-content: center; font: 800 13px 'Grandstander', sans-serif; color: #4a2c1e;
  background: radial-gradient(circle at 35% 30%, #f4d49a, #c8954f 70%); box-shadow: inset 0 0 0 2px #9a6a34, 0 2px 0 rgba(40,20,8,.45); }
${B} #levelup .lu-hint { font: 700 16px 'Mali', sans-serif; opacity: 1; color: #f6e7c8; text-shadow: 0 2px 0 #3a1a0c; }
${B} #gameover { background: radial-gradient(ellipse at 50% 45%, rgba(90,30,20,.35), rgba(24,10,8,.86)); }
${B} #gameover .go-title { font: 900 68px 'Grandstander', sans-serif; ${STITCHED(tO, 8)} filter: drop-shadow(0 3px 0 #3a1a0c); }
${B} #gameover .go-stats { ${TAG('#c0442c', '#8c2a1c', '#e0704c', 'rgba(124,29,36,.55)')} padding: 12px 26px; font: 700 18px 'Mali', sans-serif; color: #4a2c1e; }
${B} #gameover .go-hint { font: 700 16px 'Mali', sans-serif; color: #f6e7c8; }
${B} #pausebox { font: 900 54px 'Grandstander', sans-serif; ${STITCHED(tP, 8)} filter: drop-shadow(0 3px 0 #1a0c10); text-shadow: none; }
`;
    return CSS_CACHE;
  }

  /* =====================================================================
     Particle colours per enemy
     ===================================================================== */
  const KILL_COLS = {
    creeper: ['#83479a', '#bc8ac7', '#f3e6bf', '#d8bc7f', '#55843a'],
    creeperB: ['#a8487a', '#d888b0', '#f3e6bf', '#d8bc7f', '#55843a'],
    ghost: ['#d5e6f2', '#97b6d4', '#fbf8f0', '#bcd6ea'],
    colossus: ['#83479a', '#4f2560', '#7c4a2b', '#c79a66', '#55843a', '#ffd23c'],
  };
  const CREEPER_B = { p: '#a8487a', P: '#6c2550', m: '#d888b0' };

  /* =====================================================================
     The style
     ===================================================================== */
  const st = {
    id: 'crossstitch',
    name: 'Kreuzstich',
    family: 'Stickerei',
    description: 'Ein lebendiges Kreuzstich-Mustertuch auf Aida-Stoff – Omas Halloween-Stickerei mit Knötchen, Perlen und Steppstich-Konturen.',
    groundColor: '#d9c8a4',
    groundResMax: 2.5,
    chunkSize: CS,
    fonts: ['Grandstander:wght@600;700;800;900', 'Mali:wght@500;600;700'],
    get css() { return buildCss(); },

    init() {
      FAB = aidaCanvas(16, CP, '#dccaa5');
      // slubs and irregular threads on the fabric tile
      {
        const ctx = FAB.getContext('2d');
        const r = U.rng(99);
        for (let k = 0; k < 22; k++) {
          const horiz = r.next() < 0.5, p = r.int(0, 127), s = r.int(0, 127), L = r.int(10, 40);
          ctx.fillStyle = r.next() < 0.5 ? 'rgba(255,250,235,0.16)' : 'rgba(110,80,40,0.08)';
          for (let o = -128; o <= 128; o += 128) {
            if (horiz) ctx.fillRect(s + o, p, L, 1); else ctx.fillRect(p, s + o, 1, L);
          }
        }
      }
      SPR = {};
      for (const k in PALR) { stitchSet(PALR[k], false); }
      for (const k of 'fhFlgGLt') stitchPattern(k + 'h');
      for (const k of 'LlgtzXxhoO') stitchPattern(k + 'x');
      for (const k of 'swhVmEqypbkeaCw') for (const r of [0.8, 0.9, 1, 1.1, 1.2]) knot(k, r);
      SPR.jack = buildChar(jackFrames());
      SPR.creeper = [buildChar(creeperFrames()), buildChar(creeperFrames(), { remap: CREEPER_B })];
      SPR.ghost = buildChar(ghostFrames());
      SPR.colossus = buildChar([0, 1, 2].map(colossusMotif));
      // props
      SPR.trees = [
        renderMotif(treeMotif(['Q', 'q', 'O', 'o'], 1)), renderMotif(treeMotif(['R', 'r', 'E', 'o'], 2)),
        renderMotif(treeMotif(['F', 'f', 'h', 't'], 3)), renderMotif(treeMotif(['X', 'q', 'O', 'h'], 4)),
      ];
      SPR.pines = [renderMotif(pineMotif(5)), renderMotif(pineMotif(6))];
      SPR.bare = [renderMotif(bareTreeMotif(1)), renderMotif(bareTreeMotif(2))];
      SPR.pumpkins = PUMPKIN_ROWS.map((r, k) => renderMotif(motif(r, 'K', k ? [{ k: 'g', w: 1.6, pts: [3, 2, 2, 1.4, 1, 1.8, 0.6, 2.8] }] : [{ k: 'g', w: 1.6, pts: [4, 1, 6, 0.5, 8, 1, 9, 2] }, { k: 'g', w: 1.6, pts: [3, 0.5, 2, 0, 1, 0.4] }])));
      SPR.graves = GRAVE_ROWS.map((r, k) => renderMotif(motif(r, 'K', k === 0 ? [] : k === 2 ? [{ k: 'A', w: 1.4, pts: [1.5, 2.5, 3.5, 2.5] }, { k: 'A', w: 1.4, pts: [1.5, 3.5, 3.5, 3.5] }] : [])));
      SPR.scare = renderMotif(motif(SCARE_ROWS, 'K', [{ k: 'K', w: 1.5, pts: [3.5, 6, 4.5, 5.6, 5.5, 6] }]));
      SPR.house = renderMotif(motif(HOUSE_ROWS, 'B', [
        { k: 'B', w: 1.6, pts: [3, 7, 3, 9] }, { k: 'B', w: 1.6, pts: [2, 8, 4, 8] }, { k: 'B', w: 1.6, pts: [10, 7, 10, 9] }, { k: 'B', w: 1.6, pts: [9, 8, 11, 8] },
        { k: 'e', w: 1.4, pts: [10, 0, 10.6, -0.6] },
      ]));
      SPR.fence = renderMotif(motif(FENCE_ROWS, 'B', [
        { k: 'b', w: 2.6, pts: [1, 2, 2, 2, 3, 2, 4, 2, 5, 2] }, { k: 'b', w: 2.6, pts: [6, 2, 7, 2, 8, 2, 9, 2, 10, 2] },
        { k: 'b', w: 2.6, pts: [1, 4, 2, 4, 3, 4, 4, 4, 5, 4] }, { k: 'b', w: 2.6, pts: [6, 4, 7, 4, 8, 4, 9, 4, 10, 4] },
      ]));
      SPR.propDims = {};
      // ground decals
      SPR.leaves = [['.oo', 'oOq', '.q.'], ['.EE', 'rrR', '.R.'], ['.tt', 'hhF', '.F.']].map((r, k) => renderMotif(motif(r, ['q', 'R', 'F'][k], [{ k: 'b', w: 1.3, pts: [1, 2, 0, 3] }]), { shadowAlpha: 0.3 }));
      SPR.mush = U.sprite(5 * CP + MP * 2, 3 * CP + MP * 2, (ctx) => {
        ctx.drawImage(renderMotif(motif(['.rrr.', 'rrrrR', '..e..'], 'R'), { shadowAlpha: 0.35 }), 0, 0);
        for (const [x, y] of [[1.6, 1.2], [3.2, 0.8], [2.6, 1.7]]) { const kn = knot('w', 0.7); ctx.drawImage(kn, MP + x * CP - kn.width * 1.6 / DS / 2 * (CP / C) , MP + y * CP - kn.width * 1.6 / DS / 2 * (CP / C), kn.width / DS * (CP / C), kn.height / DS * (CP / C)); }
      });
      SPR.lily = renderMotif(motif(['lg.', 'gGg', '.g.'], 'G'), { shadowAlpha: 0.3 });
      SPR.daisy = [daisySprite('w', 'y'), daisySprite('s', 'h'), daisySprite('t', 'q'), daisySprite('V', 'y')];
      SPR.sequins = ['#e3b24d', '#55843a', '#83479a', '#c3312b'].map((h) => sequinSprite(U.hex(h)));
      SPR.satin = {};
      for (const t of POND_TONES) SPR.satin[t] = [1, 2, 3].map((L) => [satinSprite(PALR[t], L, 0), satinSprite(PALR[t], L, 1)]);
      // pickups / fx
      SPR.gem = beadSprite(U.hex('#f39a2e'), 18);
      SPR.gemBig = buttonSprite(U.hex('#e3b24d'), 30);
      SPR.glowS = glowSprite(24, [255, 190, 80], 0.5);
      SPR.glowB = glowSprite(40, [255, 205, 110], 0.55);
      SPR.glowJ = glowSprite(64, [255, 170, 70], 0.32);
      SPR.glowC = glowSprite(40, [255, 150, 60], 0.5);
      SPR.button = ['#c3312b', '#e3b24d', '#3c5078', '#55843a'].map((h) => buttonSprite(U.hex(h), 20));
      SPR.lantern = renderMotif(motif(['..G..', '.pmp.', 'pymyp', 'cCyCc', '.cCc.'], 'K'));
      SPR.needle = needleSprite();
      SPR.shadow = U.sprite(48, 18, (ctx) => {
        const g = ctx.createRadialGradient(24, 9, 0, 24, 9, 24);
        g.addColorStop(0, 'rgba(50,28,12,0.55)'); g.addColorStop(0.6, 'rgba(50,28,12,0.25)'); g.addColorStop(1, 'rgba(50,28,12,0)');
        ctx.fillStyle = g; ctx.scale(1, 18 / 48); ctx.fillRect(0, 0, 48, 48);
      });
      SPR.seed = U.sprite(56, 20, (ctx) => {
        // running-stitch trail + the seed itself (pointing right)
        ctx.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          const x0 = 4 + k * 9;
          ctx.strokeStyle = 'rgba(40,22,10,0.3)'; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(x0 + 0.6, 11.5); ctx.lineTo(x0 + 5.6, 11.5); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,214,120,' + (0.35 + k * 0.2) + ')'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(x0, 10); ctx.lineTo(x0 + 5, 10); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(40,22,10,0.4)';
        ctx.beginPath(); ctx.ellipse(44, 11.5, 9, 5.5, 0, 0, U.TAU); ctx.fill();
        const g = ctx.createLinearGradient(36, 4, 50, 16);
        g.addColorStop(0, '#fffaf0'); g.addColorStop(0.5, '#f3e6bf'); g.addColorStop(1, '#c9a86a');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(53, 10); ctx.quadraticCurveTo(46, 2, 36, 6); ctx.quadraticCurveTo(33, 10, 36, 14); ctx.quadraticCurveTo(46, 18, 53, 10); ctx.fill();
        ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.strokeStyle = 'rgba(160,120,70,0.6)'; ctx.lineWidth = 0.7;
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(38 + k * 3.5, 6.5 + k * 0.4); ctx.lineTo(37 + k * 3.5, 13.5 - k * 0.4); ctx.stroke(); }
      });
      SPR.digits = digitSprites('w', 'K');
      SPR.digitsC = digitSprites('y', 'R');
      SPR.vignette = U.sprite(320, 180, (ctx) => {
        const g = ctx.createRadialGradient(160, 92, 60, 160, 90, 200);
        g.addColorStop(0, 'rgba(60,30,12,0)'); g.addColorStop(0.7, 'rgba(60,30,12,0.10)'); g.addColorStop(1, 'rgba(40,18,8,0.42)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 320, 180);
      });
      this._lastFrame = -1;
    },

    *renderGroundChunk(ctx, info) { yield* buildChunk(ctx, info); },

    propsForChunk(info) {
      const props = [];
      const own = (x, y) => x >= info.wx && x < info.wx + CS && y >= info.wy && y < info.wy + CS;
      const add = (spr, w, h, x, y, type, extra) => {
        const gx = Math.round(x / C - w / 2), gy = Math.round(y / C);
        props.push({ x: (gx + w / 2) * C, y: gy * C, gx, gy: gy - h, spr, type, w, h, pad: h * C + 20, ...extra });
      };
      const ok = (x, y, r) => {
        const i = Math.floor(x / C), j = Math.floor(y / C);
        if (pathDistCell(i, j) < pathHW(x, y) + r) return false;
        return true;
      };
      G.scatterOwned(info, 60, SD.prop, (x, y, rng) => {
        if (G.nearSpawn(x, y, 110)) return;
        const roll = rng.next();
        const ci = cellInfo(Math.floor(x / C), Math.floor(y / C));
        const m = ci.m;
        if (m === PATH || m === POND) return;
        if (!ok(x, y, 14)) return;
        if (m === FOREST) {
          if (roll > 0.62) return;
          const k = rng.next();
          if (k < 0.55) add(SPR.trees[(rng.next() * 4) | 0], 13, 16, x, y, 'tree', { tree: true });
          else if (k < 0.85) add(SPR.pines[(rng.next() * 2) | 0], 11, 17, x, y, 'pine', { tree: true });
          else add(SPR.bare[(rng.next() * 2) | 0], 13, 16, x, y, 'bare', { tree: true });
        } else if (m === MEADOW) {
          const gz = U.fbm(x / 520, y / 520, SD.grave, 2);
          if (gz > 0.63) {
            if (roll < 0.55) add(SPR.graves[(rng.next() * 3) | 0], 5, 7, x, y, 'grave');
            else if (roll < 0.62) add(SPR.bare[(rng.next() * 2) | 0], 13, 16, x, y, 'bare', { tree: true });
            return;
          }
          if (roll < 0.06) add(SPR.trees[(rng.next() * 4) | 0], 13, 16, x, y, 'tree', { tree: true });
          else if (roll < 0.12) { const k = (rng.next() * 2) | 0; add(SPR.pumpkins[k], k ? 7 : 12, k ? 7 : 6, x, y, 'pumpkins'); }
          else if (roll < 0.13 && ok(x, y, 30)) add(SPR.house, 13, 12, x, y, 'house');
          else if (roll < 0.15) add(SPR.graves[(rng.next() * 3) | 0], 5, 7, x, y, 'grave');
        }
      });
      // fences + scarecrows on fields
      for (const f of fieldsIn(info.wx - 500, info.wy - 400, info.wx + CS + 500, info.wy + CS + 400)) {
        if (f.fence) {
          for (let i = f.i0 + 1, k = 0; i + 11 <= f.i1 - 1; i += 11, k++) {
            if ((U.hashInt(f.seed, k, 5) & 7) < 2) continue;
            const x = (i + 5.5) * C, y = f.j0 * C;
            if (!own(x, y) || G.nearSpawn(x, y, 90) || !ok(x, y, 8)) continue;
            props.push({ x, y, gx: i, gy: f.j0 - 5, spr: SPR.fence, type: 'fence', w: 11, h: 5, pad: 40 });
          }
        }
        if (f.scare) {
          const r = U.rng(f.seed + 5);
          const i = Math.round(U.lerp(f.i0 + 5, f.i1 - 5, r.next())), j = Math.round(U.lerp(f.j0 + 14, f.j1 - 2, r.next()));
          const x = (i + 0.5) * C, y = j * C;
          if (j > f.j0 + 13 && own(x, y) && !G.nearSpawn(x, y, 90) && ok(x, y, 10)) props.push({ x, y, gx: i - 4, gy: j - 13, spr: SPR.scare, type: 'scare', w: 9, h: 13, pad: 60 });
        }
      }
      return props;
    },

    drawProp(ctx, pr, view) {
      if (pr.tree) {
        const p = view.game.player;
        if (p.y < pr.y - 3 && p.y > pr.y - pr.h * C + 6 && Math.abs(p.x - pr.x) < pr.w * C / 2 - 2) ctx.globalAlpha = 0.55;
      }
      blitCell(ctx, pr.spr, pr.gx, pr.gy);
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o, view) {
      let w, a = 1, dy = 0;
      if (o.kind === 'prop') {
        if (!o.tree) return;
        w = o.type === 'pine' ? 26 : 34; a = 0.7; dy = -1;
      } else if (o.kind === 'enemy') {
        if (o.dying) { a = 1 - o.deathT; }
        w = o.type === 'colossus' ? 46 : o.type === 'ghost' ? 16 : 20;
        if (o.type === 'ghost') a *= 0.5;
        if (o.spawnT < 1) a *= o.spawnT;
      } else {
        w = 26;
      }
      ctx.globalAlpha = a;
      ctx.drawImage(SPR.shadow, o.x - w / 2, o.y - w * 0.19 + dy, w, w * 0.375);
      ctx.globalAlpha = 1;
    },

    drawGroundOverlay(ctx, view, game) {
      const p = game.player;
      // warm candle light pool around Jack
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + 0.06 * Math.sin(view.rt * 7.3) + 0.04 * Math.sin(view.rt * 13.1);
      ctx.drawImage(SPR.glowJ, p.x - 40, p.y - 30, 80, 52);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (p.levelT > 0) {
        const t = 1 - p.levelT;
        const r = 8 + t * 46;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.levelT * 1.5);
        ctx.setLineDash([2.4, 1.6]);
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#e3b24d'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.55, 0, 0, U.TAU); ctx.stroke();
        ctx.strokeStyle = '#c3312b'; ctx.lineDashOffset = 2;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 0.75, r * 0.41, 0, 0, U.TAU); ctx.stroke();
        ctx.restore();
      }
    },

    drawGem(ctx, g, view) {
      const big = g.big;
      const bob = Math.sin(view.rt * 3 + g.seed * 6.28) * 0.8;
      const z = g.pop > 0 ? Math.sin(g.pop * Math.PI) * 9 : 0;
      const gy = g.y - 3 - bob - z;
      ctx.globalAlpha = 0.6;
      ctx.drawImage(SPR.shadow, g.x - 3, g.y - 1.2, 6, 2.4);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 + 0.2 * Math.sin(view.rt * 4 + g.seed * 9);
      const gl = big ? SPR.glowB : SPR.glowS, gs = big ? 22 : 13;
      ctx.drawImage(gl, g.x - gs / 2, gy - gs / 2, gs, gs);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if (big) {
        ctx.save();
        ctx.translate(g.x, gy);
        ctx.rotate(Math.sin(view.rt * 2 + g.seed * 5) * 0.3);
        ctx.drawImage(SPR.gemBig, -4.5, -4.5, 9, 9);
        ctx.restore();
      } else ctx.drawImage(SPR.gem, g.x - 2.7, gy - 2.7, 5.4, 5.4);
    },

    drawPlayer(ctx, p, view) {
      const set = SPR.jack;
      const left = p.facing < 0;
      let fr = 0;
      if (p.moving) fr = [1, 0, 2, 0][Math.floor(p.anim * 2) & 3];
      const gx = Math.round(p.x / C - set.w / 2), gy = Math.round(p.y / C) - set.h;
      const img = (left ? set.l : set.r)[fr];
      if (p.dashT > 0) {
        for (let k = 2; k >= 1; k--) {
          ctx.globalAlpha = 0.22 / k;
          blitCell(ctx, img, Math.round((p.x - p.dashX * k * 7) / C - set.w / 2), Math.round((p.y - p.dashY * k * 7) / C) - set.h);
        }
      }
      ctx.globalAlpha = p.iframes > 0 && Math.floor(view.rt * 18) % 2 ? 0.45 : 1;
      blitCell(ctx, img, gx, gy);
      if (p.hurtT > 0) {
        ctx.globalAlpha = Math.min(1, p.hurtT * 1.4) * 0.85;
        blitCell(ctx, (left ? set.fl : set.fr)[fr], gx, gy);
      }
      ctx.globalAlpha = 1;
      // carved face glow
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.22 + 0.07 * Math.sin(view.rt * 9) + 0.05 * Math.sin(view.rt * 23);
      const hx = (gx + 4.5 + (left ? -0.6 : 0.6)) * C, hy = (gy + 5) * C;
      ctx.drawImage(SPR.glowC, hx - 12, hy - 9, 24, 18);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    drawEnemy(ctx, e, view) {
      let set = SPR[e.type];
      if (e.type === 'creeper') set = SPR.creeper[e.seed < 0.5 ? 0 : 1];
      const left = e.facing < 0;
      const gx = Math.round(e.x / C - set.w / 2);
      let gy = Math.round(e.y / C) - set.h;
      if (e.type === 'ghost') gy -= 1 + (Math.sin(view.rt * 2.2 + e.seed * 9) > 0.3 ? 1 : 0);
      const ghostA = e.type === 'ghost' ? 0.9 : 1;
      if (e.spawnT < 1 || e.dying) {
        const prog = e.dying ? 1 - e.deathT : e.spawnT;
        const k = Math.floor(prog * PN);
        if (k >= PN) { ctx.globalAlpha = ghostA; blitCell(ctx, (left ? set.l : set.r)[0], gx, gy); }
        else if (k > 0) {
          ctx.globalAlpha = ghostA * (e.dying ? Math.min(1, prog * 3) : 1);
          blitCell(ctx, (left ? set.partL : set.part)[k - 1], gx, gy);
        }
        if (!e.dying) {
          // the needle stitching it into existence
          const nx = (gx + set.w * 0.5) * C + Math.sin(view.rt * 30 + e.seed * 9) * set.w * 0.9;
          const ny = (gy + set.h * (1 - prog)) * C - 4;
          ctx.globalAlpha = Math.min(1, (1 - prog) * 4);
          ctx.drawImage(SPR.needle, nx - 3, ny - 14, 16, 16);
        }
        ctx.globalAlpha = 1;
        return;
      }
      let fr = [0, 1, 0, 2][Math.floor(e.anim * 1.6 + e.seed * 4) & 3];
      if (e.type === 'ghost') fr = Math.floor(view.rt * 5 + e.seed * 7) % 3;
      ctx.globalAlpha = ghostA;
      blitCell(ctx, (left ? set.l : set.r)[fr], gx, gy);
      if (e.flash > 0) {
        ctx.globalAlpha = Math.min(1, e.flash * 1.3) * 0.9;
        blitCell(ctx, (left ? set.fl : set.fr)[fr], gx, gy);
      }
      ctx.globalAlpha = 1;
      if (e.type === 'colossus') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.45 + 0.2 * Math.sin(view.rt * 4 + e.seed * 6);
        const cx = (gx + 8.5 + (left ? -1 : 0)) * C, cy = (gy + 10) * C;
        ctx.drawImage(SPR.glowC, cx - 18, cy - 14, 36, 28);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    },

    drawOrbital(ctx, o, view) {
      const s = SPR.lantern;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.6 + 0.15 * Math.sin(view.rt * 8 + o.idx);
      ctx.drawImage(SPR.glowB, o.x - 14, o.y - 22, 28, 28);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      const w = s.width * K, h = s.height * K;
      ctx.drawImage(s, o.x - w / 2, o.y - h + 2 + Math.sin(view.rt * 4 + o.idx) * 0.8, w, h);
    },

    drawProjectile(ctx, pr, view) {
      const a = Math.atan2(pr.vy, pr.vx);
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(a);
      // sprite: seed tip at x=53 of 56 px, centre y=10, 0.25 world units / px
      ctx.drawImage(SPR.seed, -11.5, -2.5, 14, 5);
      ctx.restore();
    },

    drawParticle(ctx, pt, view) {
      const life = U.clamp(pt.life / pt.max, 0, 1);
      const a = Math.min(1, life * 2.2);
      const x = pt.x, y = pt.y - pt.z;
      switch (pt.kind) {
        case 'thread': {
          const s = threadSpr(pt.color, pt.shape || 0);
          ctx.globalAlpha = a;
          ctx.save(); ctx.translate(x, y); ctx.rotate(pt.rot);
          const sz = 8 * (pt.size || 1);
          ctx.drawImage(s, -sz / 2, -sz / 2, sz, sz);
          ctx.restore();
          break;
        }
        case 'bead': {
          ctx.globalAlpha = a;
          const sz = 2.6 * (pt.size || 1);
          ctx.drawImage(bead(pt.color), x - sz / 2, y - sz / 2, sz, sz);
          break;
        }
        case 'button': {
          ctx.globalAlpha = a;
          ctx.save(); ctx.translate(x, y); ctx.rotate(pt.rot);
          const s = SPR.button[pt.b || 0];
          ctx.drawImage(s, -2.6, -2.6, 5.2, 5.2);
          ctx.restore();
          break;
        }
        case 'knot': {
          ctx.globalAlpha = a;
          const s = knot(pt.color, 1.05), sc = (pt.size || 1) * (0.7 + (1 - life) * 0.6);
          const w = (s.width / DS) * sc;
          ctx.drawImage(s, x - w / 2, y - w / 2, w, w);
          break;
        }
        case 'fluff': {
          ctx.globalAlpha = a * 0.6;
          ctx.drawImage(SPR.glowS, x - pt.size, y - pt.size, pt.size * 2, pt.size * 2);
          break;
        }
        case 'ring': {
          const t = 1 - life;
          const r = U.lerp(pt.r0, pt.r1, U.ease.outQuad(t));
          ctx.save();
          ctx.globalAlpha = life;
          ctx.setLineDash([1.6, 1.2]);
          ctx.lineCap = 'round';
          ctx.strokeStyle = pt.color; ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0, 0, U.TAU); ctx.stroke();
          ctx.restore();
          break;
        }
        default: {
          // tiny cross stitch spark
          ctx.globalAlpha = a;
          const s = stitchSet(toRgb(pt.color || '#ffd23c'), false)[0];
          const sz = 2.4 * (pt.size || 1);
          ctx.drawImage(s, x - sz / 2, y - sz / 2, sz, sz);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawNumber(ctx, n) {
      const s = String(n.value);
      const crit = n.crit;
      const set = crit ? SPR.digitsC : SPR.digits;
      const t = 1 - n.life / n.max;
      ctx.globalAlpha = U.clamp((n.life / n.max) * 3, 0, 1);
      const pop = t < 0.15 ? 1 + (0.15 - t) * 2.5 : 1;
      const cs = (crit ? 1.8 : 1.3) * pop, sc = cs / CP;
      const adv = 3.4 * cs, total = s.length * adv;
      const x0 = n.x - total / 2, y0 = n.y - 5 * cs;
      for (let k = 0; k < s.length; k++) {
        const img = set[s.charCodeAt(k) - 48];
        if (!img) continue;
        ctx.drawImage(img, x0 + k * adv - MP * sc, y0 - MP * sc, img.width * sc, img.height * sc);
      }
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view, game) {
      ctx.drawImage(SPR.vignette, 0, 0, view.W, view.H);
      // the night deepens towards midnight (gently, gameplay stays readable)
      const pr = game.runProgress || 0;
      if (pr > 0.02) {
        ctx.globalAlpha = Math.min(0.16, pr * 0.2);
        ctx.fillStyle = '#2a2050';
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(0, 0, view.W, view.H);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    },

    drawIcon(ctx, id, size) {
      const c = iconSprite(id);
      const inner = 12 * CP;
      const sc = (size * 0.96) / inner;
      ctx.imageSmoothingEnabled = true;
      const w = c.width * sc, h = c.height * sc;
      ctx.drawImage(c, (size - w) / 2 + 0.5, (size - h) / 2 + 0.5, w, h);
    },

    /* ---------- gameplay hooks -> threads, knots, beads ---------- */
    onHit(game, e, src) {
      const top = e.type === 'colossus' ? 30 : e.type === 'ghost' ? 14 : 12;
      const cols = e.type === 'ghost' ? KILL_COLS.ghost : e.type === 'colossus' ? KILL_COLS.colossus : e.seed < 0.5 ? KILL_COLS.creeper : KILL_COLS.creeperB;
      game.addParticle({ x: e.x, y: e.y, z: top, kind: 'knot', color: 'w', life: 0.18, size: 0.9 });
      if (Math.random() < 0.6) {
        game.addParticle({
          x: e.x + (Math.random() - 0.5) * 8, y: e.y, z: top, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 10, vz: 30, grav: 120, drag: 2,
          kind: 'thread', color: cols[(Math.random() * cols.length) | 0], shape: (Math.random() * 6) | 0, life: 0.6, size: 0.7, vr: (Math.random() - 0.5) * 8,
        });
      }
    },
    onKill(game, e) {
      const big = e.type === 'colossus';
      const cols = e.type === 'ghost' ? KILL_COLS.ghost : big ? KILL_COLS.colossus : e.seed < 0.5 ? KILL_COLS.creeper : KILL_COLS.creeperB;
      const top = big ? 24 : 12;
      const n = big ? 16 : 7;
      for (let k = 0; k < n; k++) {
        const a = Math.random() * U.TAU, s = (big ? 60 : 42) * (0.5 + Math.random() * 0.7);
        game.addParticle({
          x: e.x, y: e.y, z: top * (0.5 + Math.random() * 0.7), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 40 + Math.random() * 40, grav: 150, drag: 1.6,
          kind: 'thread', color: cols[(Math.random() * cols.length) | 0], shape: (Math.random() * 6) | 0, life: 0.9 + Math.random() * 0.5, size: big ? 1.1 : 0.85,
          vr: (Math.random() - 0.5) * 10,
        });
      }
      const nb = big ? 5 : e.type === 'ghost' ? 1 : 2;
      const bc = e.type === 'ghost' ? ['#fbf8f0', '#bcd6ea'] : ['#83479a', '#f3e6bf', '#c3312b', '#e3b24d'];
      for (let k = 0; k < nb; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: e.x, y: e.y, z: top, vx: Math.cos(a) * 35, vy: Math.sin(a) * 20, vz: 50 + Math.random() * 30, grav: 220, drag: 1.2, kind: 'bead', color: bc[(Math.random() * bc.length) | 0], life: 1.1 + Math.random() * 0.4, size: 1 });
      }
      if (big) game.addParticle({ x: e.x, y: e.y, z: 20, vx: (Math.random() - 0.5) * 30, vz: 70, grav: 220, kind: 'button', b: (Math.random() * 4) | 0, life: 1.6, vr: 6 });
      game.addParticle({ x: e.x, y: e.y - top * 0.6, kind: 'ring', r0: big ? 6 : 3, r1: big ? 22 : 11, color: e.type === 'ghost' ? '#97b6d4' : '#f3e6bf', life: 0.3 });
    },
    onHurt(game, p) {
      for (let k = 0; k < 7; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: p.x, y: p.y, z: 18, vx: Math.cos(a) * 50, vy: Math.sin(a) * 25, vz: 40 + Math.random() * 30, grav: 160, drag: 1.5, kind: 'thread', color: k % 2 ? '#e2701f' : '#f59b40', shape: k % 6, life: 0.7, size: 0.8, vr: 8 });
      }
      game.addParticle({ x: p.x, y: p.y - 14, kind: 'ring', r0: 4, r1: 14, color: '#c3312b', life: 0.25 });
    },
    onPickup(game, g) {
      const n = g.big ? 5 : 1;
      for (let k = 0; k < n; k++) {
        game.addParticle({ x: g.x + (Math.random() - 0.5) * 6, y: g.y, z: 5 + Math.random() * 6, vx: (Math.random() - 0.5) * 20, vz: 18, kind: 'spark', color: g.big ? '#e3b24d' : '#ffd23c', life: 0.35, size: 0.9 });
      }
    },
    onShoot(game, pr) {},
    onDash(game, p) {
      for (let k = 0; k < 5; k++) {
        game.addParticle({ x: p.x - p.dashX * k * 3, y: p.y, z: 2, vx: -p.dashX * 20 + (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 8, vz: 6, kind: 'fluff', life: 0.45 + Math.random() * 0.2, size: 3, drag: 3 });
      }
    },
    onLevelUp(game, p) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * U.TAU;
        game.addParticle({ x: p.x + Math.cos(a) * 8, y: p.y + Math.sin(a) * 4, z: 12, vx: Math.cos(a) * 55, vy: Math.sin(a) * 28, vz: 30, grav: 40, kind: 'spark', color: k % 2 ? '#e3b24d' : '#c3312b', life: 0.7 + Math.random() * 0.3, size: 1.1 });
      }
      for (let k = 0; k < 4; k++) game.addParticle({ x: p.x + (Math.random() - 0.5) * 20, y: p.y, z: 26, vx: (Math.random() - 0.5) * 40, vz: 40, grav: 120, kind: 'button', b: k % 4, life: 1.3, vr: 6 });
    },
    onDeath(game, p) {
      for (let k = 0; k < 20; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * 70, vy: Math.sin(a) * 35, vz: 50 + Math.random() * 40, grav: 160, kind: 'thread', color: ['#e2701f', '#f59b40', '#1d3f55', '#c3312b'][k % 4], shape: k % 6, life: 1.4, size: 1.1, vr: 8 });
      }
    },
  };
  Styles.register(st);
})();
