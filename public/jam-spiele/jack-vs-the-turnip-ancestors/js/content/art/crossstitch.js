/* Native art for the new enemies / upgrades in the 'crossstitch' world (Kreuzstich) – see js/content/ART_API.md.
   Same technique as js/styles/crossstitch.js (copied – its closure is private): every enemy is a cell motif
   (1 cell = 3.2 world units) rendered as real twisted cross stitches with a dense thread underlay, a dark backstitch
   contour and backstitched details; motifs snap to the world stitch grid; spawn = stitched in by the needle,
   death = unravelled. */
(function () {
  'use strict';
  const U = window.U, Cn = window.Content;

  /* ===================================================================== grid constants (from crossstitch.js) */
  const C = 3.2;          // world units per stitch cell
  const CP = 8;           // sprite pixels per cell
  const K = C / CP;       // world units per sprite pixel
  const SM = 2;           // stitch sprite margin (px)
  const MP = 5;           // motif canvas margin (px)
  const WHITE = [255, 255, 255];
  const TAU = Math.PI * 2;

  /* ===================================================================== floss palette (style + new skeins) */
  const PAL = {
    Q: '#6c2817', q: '#a4401b', O: '#e2701f', o: '#f59b40', y: '#ffd23c', Y: '#fff2a6',
    G: '#2d5230', g: '#55843a', l: '#8daf55', L: '#b3c07c',
    B: '#45291c', b: '#7c4a2b', k: '#c79a66', K: '#2b1d1d',
    P: '#4f2560', p: '#83479a', m: '#bc8ac7',
    c: '#f3e6bf', C: '#d8bc7f', w: '#fbf8f0',
    i: '#d5e6f2', I: '#97b6d4', j: '#3c5078',
    r: '#c3312b', R: '#7a1c24', E: '#e65f3e',
    a: '#9f9a93', A: '#5f5a58', e: '#d0cbc2',
    d: '#1d3f55', D: '#2e6479',
    f: '#c99a3e', F: '#a6782e', h: '#e3b24d', t: '#f2d37c',
    x: '#a24f2a', X: '#84391f', z: '#6b3b24',
    N: '#2b4b70', n: '#43729e', u: '#7faacf', W: '#bcd6ea',
    s: '#e58ca2', v: '#7b59a8', V: '#a98bd0',
    // new skeins
    T: '#86c43a', U: '#ddf98a', H: '#3c6a1a',   // toxic lime (spitter)
    M: '#a3285a',                               // beet magenta (bomber)
    S: '#5fcfb2', Z: '#c6f6e6',                 // will-o'-wisp cyan
    J: '#ff4a2a',                               // hot red eye
  };
  const PALR = {};
  for (const k in PAL) PALR[k] = U.hex(PAL[k]);
  const toRgb = (c) => (Array.isArray(c) ? c : PALR[c] || U.hex(c));
  const rgbStr = (c, a) => U.rgb(c, a);
  const FLASH = (c) => U.mix(c, WHITE, 0.6);
  const HOT = (c) => U.mix(c, [255, 52, 34], 0.62);

  /* ===================================================================== thread primitives (from crossstitch.js) */
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
      ctx.strokeStyle = rgbStr(U.mix(base, WHITE, 0.5), 0.75);
      ctx.lineWidth = 0.7;
      const hx = dir < 0 ? -0.55 : 0.5, hy = -0.6;
      line(U.lerp(x0, x1, 0.18) + hx, U.lerp(y0, y1, 0.18) + hy, U.lerp(x0, x1, 0.78) + hx, U.lerp(y0, y1, 0.78) + hy);
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
  function polySegs(pts, sc, ox, oy) {
    const out = [];
    for (let k = 0; k + 3 < pts.length; k += 2) out.push(ox + pts[k] * sc, oy + pts[k + 1] * sc, ox + pts[k + 2] * sc, oy + pts[k + 3] * sc);
    return out;
  }

  /* ===================================================================== motifs (from crossstitch.js) */
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
  function mset(m, x, y, k) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.cell[y * m.w + x] = k; }
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
      const rgb = (o.remap && o.remap[k]) ? toRgb(o.remap[k]) : toRgb(k);
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
      for (const s of m.segs) threadSegs(ctx, polySegs(s.pts, CP, MP, MP), col(s.k), s.w || 2.1, 0.55);
    }
    return c;
  }
  function blitCell(ctx, spr, gx, gy) {
    ctx.drawImage(spr, gx * C - MP * K, gy * C - MP * K, spr.width * K, spr.height * K);
  }
  /** blit with a scale around the feet (grid-anchored at the bottom centre) */
  function blitCellS(ctx, spr, gx, gy, w, h, sx, sy) {
    const fx = (gx + w / 2) * C, fy = (gy + h) * C;
    const W = spr.width * K, H = spr.height * K;
    const x0 = gx * C - MP * K, y0 = gy * C - MP * K;
    ctx.drawImage(spr, fx + (x0 - fx) * sx, fy + (y0 - fy) * sy, W * sx, H * sy);
  }

  /* ===================================================================== characters */
  const PN = 6; // spawn / unravel steps
  /** frames → {r, l, fr, fl (flash), [hr, hl (hot)], part/partL (stitch-in masks)} */
  function buildChar(frames, opts = {}) {
    const out = { w: frames[0].w, h: frames[0].h, r: [], l: [], fr: [], fl: [], hr: [], hl: [], part: [], partL: [] };
    for (const m of frames) {
      const ml = mirror(m);
      out.r.push(renderMotif(m, opts));
      out.l.push(renderMotif(ml, opts));
      out.fr.push(renderMotif(m, { ...opts, mod: FLASH, noShadow: true }));
      out.fl.push(renderMotif(ml, { ...opts, mod: FLASH, noShadow: true }));
      if (opts.hot) {
        out.hr.push(renderMotif(m, { ...opts, mod: HOT, noShadow: true }));
        out.hl.push(renderMotif(ml, { ...opts, mod: HOT, noShadow: true }));
      }
    }
    if (opts.parts !== false) {
      const m = frames[0];
      const idx = [];
      for (let k = 0; k < m.cell.length; k++) if (m.cell[k]) idx.push(k);
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
    }
    return out;
  }

  /* ---------- Rüben-Spucker: 9 x 8, snout to the right ---------- */
  const SPIT_TOP = [['.l.g.....', '..gGg....'], ['l..g.....', '..gGg....'], ['.l..g....', '..gGg....']];
  const SPIT_MID = ['.PpTpP...', 'PpmpyPy..', 'pTpppTpTH', 'pCcTcCTTH', '.CcccT...'];
  const SPIT_LEG = ['..k.k....', '.k...k...', '...kk....'];
  const SPIT_SEGS = [{ k: 'K', w: 1.6, pts: [3.8, 2.9, 5, 3.25] }, { k: 'K', w: 1.6, pts: [7.2, 2.9, 6, 3.25] }];
  const DROOL = { k: 'T', w: 1.7, pts: [8.5, 6, 8.4, 6.6, 8.6, 7.2] };
  function spitterFrames() {
    return [0, 1, 2].map((f) => motif([...SPIT_TOP[f], ...SPIT_MID, SPIT_LEG[f]], 'K', [...SPIT_SEGS, DROOL]));
  }
  function spitterAim() {
    const a1 = motif([...SPIT_TOP[0], ...SPIT_MID.map((r) => r.replace(/H$/, 'U')), '.k....k..'], 'K', [...SPIT_SEGS, { k: 'U', w: 1.8, pts: [8.5, 6, 8.5, 6.9] }]);
    const a2 = motif([
      '.l.g.....', '..gGg....', '.PpTppP..', 'PpmpyPyP.', 'pTpppTpTU', 'pCcTcCcTU', 'pCcccTcCU', '.CcTcC...', '.k....k..',
    ], 'K', [{ k: 'K', w: 1.6, pts: [3.8, 2.7, 5, 3.3] }, { k: 'K', w: 1.6, pts: [7.2, 2.7, 6, 3.3] }, { k: 'm', w: 1.5, pts: [1.4, 6.3, 2.4, 6.6] }]);
    return [a1, a2];
  }
  function spitterSpit() {
    return motif(['l..g.....', '.gGg.....', '.PpTpP...', 'PpmpyPy..', 'pTpppTTTU', 'pCcTcCTTU', '.CcccT...', 'k....k...'], 'K', [
      { k: 'K', w: 1.6, pts: [3.8, 3.2, 5, 3.0] }, { k: 'K', w: 1.6, pts: [7.2, 3.2, 6, 3.0] },
    ]);
  }

  /* ---------- Zündrübe: 7 x 7 beet bomb with a fuse ---------- */
  const BOMB_BODY = ['..gl...', '.rrErr.', 'rEwrrrR', 'rrrYrYR', 'rrrrrRR', '.RrrRR.'];
  const BOMB_LEG = ['.k.k.k.', 'k.k.k..', '..k.k.k'];
  const BOMB_SEGS = [
    { k: 'b', w: 1.9, pts: [3.6, 1.1, 3.3, 0.55, 3.9, 0.15, 4.8, 0.25] },
    { k: 'K', w: 1.6, pts: [2.7, 2.75, 3.9, 3.2] }, { k: 'K', w: 1.6, pts: [6.3, 2.75, 5.1, 3.2] },
    { k: 'K', w: 1.3, pts: [3, 4.7, 3.6, 4.4, 4.2, 4.7, 4.8, 4.4, 5.4, 4.7] },
    { k: 'M', w: 1.5, pts: [3.2, 6, 3, 6.6] },
  ];
  const BOMB_TIP = [4.8, 0.25];
  function bomberFrames() {
    return [0, 1, 2].map((f) => { const m = motif([...BOMB_BODY, BOMB_LEG[f]], 'K', BOMB_SEGS); return m; });
  }

  /* ---------- Rübchen: 5 x 5 ---------- */
  const SPROUT_TOP = ['..lg.', '..gl.', '..lg.'];
  const SPROUT_MID = ['PpmpP', 'pYpYP', '.cCC.'];
  const SPROUT_LEG = ['.k.k.', 'k...k', '..kk.'];
  const SPROUT_SEGS = [{ k: 'K', w: 1.5, pts: [0.9, 1.85, 2.1, 2.25] }, { k: 'K', w: 1.5, pts: [4.1, 1.85, 2.9, 2.25] }, { k: 'R', w: 1.4, pts: [1.6, 3.55, 2.4, 3.25, 3.3, 3.55] }];
  function sproutFrames() {
    return [0, 1, 2].map((f) => motif([SPROUT_TOP[f], ...SPROUT_MID, SPROUT_LEG[f]], 'K', SPROUT_SEGS));
  }

  /* ---------- Wurzel-Bock: 12 x 9, procedural parsnip ram ---------- */
  function chargerMotif(mode, fr) {
    const w = 12, h = 9;
    const m = blank(w, h, 'K');
    const up = (x) => (mode === 'tele' && x >= 6 ? 1 : 0) - (mode === 'dash' && x >= 9 ? 1 : 0);
    const set = (x, y, k) => mset(m, x, y - up(x), k);
    // legs first (body overrides the hips)
    let legs; // [hipX, footX, footY]
    if (mode === 'chase') {
      const o = [[0, 0, 0, 0], [-1, 1, 1, -1], [1, -1, -1, 1]][fr];
      legs = [[2, 2 + o[0], 8], [4, 4 + o[1], 8], [7, 7 + o[2], 8], [9, 9 + o[3], 8]];
    } else if (mode === 'tele') legs = [[2, 1, 8], [4, 4, 8], [7, 7, 8], [9, fr ? 9 : 10, 8]];
    else if (mode === 'dash') legs = [[2, 0, 8], [3, 1, 8], [8, 10, 8], [9, 11, 8]];
    else legs = [[2, 1, 8], [4, 4, 8], [7, 7, 8], [9, 10, 8]];
    for (const [hx, fx, fy] of legs) { set(hx, 7, 'b'); set(fx, fy, 'B'); if (Math.abs(fx - hx) > 1) set((hx + fx) / 2 + (fx > hx ? 0.1 : -0.1), 7.5, 'b'); }
    // body
    const cx = 5.2, cy = 4.7, rx = 5.0, ry = 2.6;
    for (let y = 1; y <= 8; y++) for (let x = 0; x <= 10; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const l = -0.45 * nx - 0.6 * ny + 0.62 * nz + (U.bayer4[(y & 3) * 4 + (x & 3)] - 0.5) * 0.3;
      const ramp = ny < -0.35 ? ['C', 'c', 'w'] : ['k', 'C', 'c'];
      set(x, y, ramp[l < 0.2 ? 0 : l < 0.6 ? 1 : 2]);
    }
    // leaf tuft on the back
    set(3, 1, 'G'); set(4, 1, 'g'); set(4, 0, 'l'); set(2, 0, 'g'); set(5, 1, 'g');
    // head (lowered, front)
    const eye = mode === 'tele' || mode === 'dash' ? 'J' : mode === 'rest' ? 'w' : 'y';
    for (const [x, y, k] of [[9, 4, 'c'], [10, 4, 'c'], [11, 4, 'k'], [9, 5, 'k'], [10, 5, eye], [11, 5, 'c'], [9, 6, 'b'], [10, 6, 'k'], [11, 6, 'c']]) set(x, y, k);
    // big curled horn around (10, 2)
    for (const [x, y, k] of [[9, 3, 'a'], [8, 2, 'e'], [8, 1, 'w'], [9, 0, 'e'], [10, 0, 'e'], [11, 1, 'a'], [11, 2, 'a'], [10, 2, 'A'], [8, 3, 'a']]) set(x, y, k);
    const u9 = up(9), u10 = up(10);
    m.segs = [
      { k: 'b', w: 1.5, pts: [8.6, 3.4 - u9, 8.5, 1.6 - u9, 9.6, 0.6 - u9, 10.9, 1.3 - u10, 10.6, 2.3 - u10] },
      { k: 'b', w: 1.3, pts: [3, 2.2, 3.3, 4.4, 3, 6.4] }, { k: 'b', w: 1.3, pts: [6, 2.0 - up(6), 6.3, 4.4 - up(6), 6, 6.6 - up(6)] },
      { k: 'b', w: 1.4, pts: [0.4, 4.6, 0.05, 4.1] },
      { k: 'K', w: 1.6, pts: [9.7, 4.35 - u9, 11, 4.85 - u10] },
    ];
    if (mode === 'rest') m.segs.push({ k: 'K', w: 1.2, pts: [10.2, 5.2, 10.8, 5.2, 10.8, 5.8, 10.3, 5.7] });
    if (mode === 'tele') m.segs.push({ k: 'e', w: 1.4, pts: [fr ? 9.4 : 10.6, 8.8, fr ? 8.6 : 11.6, 8.5] }, { k: 'e', w: 1.2, pts: [11.4, 5.6 - u10 + 0.6, 11.9, 6.2 - u10] });
    return m;
  }

  /* ---------- Rüben-Ahnin: 13 x 12 matriarch with headscarf, glasses, cane and babies ---------- */
  function motherMotif(fr) {
    const w = 13, h = 12;
    const m = blank(w, h, 'K');
    // legs
    const lg = [[3, 8], [4, 8], [3, 9]][fr];
    mset(m, lg[0], 11, 'k'); mset(m, lg[0] + 1, 11, 'b'); mset(m, lg[1], 11, 'k'); mset(m, lg[1] + 1, 11, 'b');
    // body
    const cx = 6, cy = 6.9, rx = 5.95, ry = 4.25;
    for (let y = 2; y <= 10; y++) for (let x = 0; x <= 11; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const l = -0.5 * nx - 0.55 * ny + 0.62 * nz + (U.bayer4[(y & 3) * 4 + (x & 3)] - 0.5) * 0.28;
      const top = ny < 0.2 + 0.15 * Math.sin(x * 1.9);
      const ramp = top ? ['P', 'p', 'm'] : ['C', 'c', 'w'];
      mset(m, x, y, ramp[l < 0.22 ? 0 : l < 0.62 ? 1 : 2]);
    }
    // headscarf (pink, white dots) over the crown, draping down the back
    for (let y = 2; y <= 4; y++) for (let x = 0; x <= 11; x++) {
      const nx = (x + 0.5 - 5.8) / 6.4, ny = (y + 0.5 - 5.2) / 3.2;
      if (nx * nx + ny * ny <= 1 && (y < 4 || x < 4 || x > 9)) mset(m, x, y, 's');
    }
    for (const [x, y] of [[0, 5], [1, 5], [0, 6], [11, 5]]) mset(m, x, y, 's');
    for (const [x, y] of [[3, 3], [6, 2], [8, 3], [1, 4], [10, 4]]) mset(m, x, y, 'w');
    // knot + tail under the chin
    mset(m, 11, 6, 's'); mset(m, 12, 6, 'E');
    // babies in her scarf
    const bob = fr === 1 ? 1 : 0;
    for (const [bx, lk] of [[2, 'g'], [5, 'l'], [8, 'g']]) {
      const by = bx === 5 ? 0 : 1 - (bx === 8 ? bob : 0);
      mset(m, bx, by + 1, 'p'); mset(m, bx + 1, by + 1, 'm');
      if (by > 0 || bx === 5) mset(m, bx + (bx === 5 ? 1 : 0), by, lk);
      m.segs.push({ k: 'K', w: 1.4, pts: [bx + 0.55, by + 1.5, bx + 0.7, by + 1.55] }, { k: 'K', w: 1.4, pts: [bx + 1.3, by + 1.5, bx + 1.45, by + 1.55] });
    }
    if (fr !== 1) mset(m, 3, 0, 'l');
    // face: eyes, glasses, nose, mouth
    mset(m, 7, 6, 'y'); mset(m, 9, 6, 'y'); mset(m, 10, 7, 'k');
    // arm + cane
    mset(m, 11, 8, 'c');
    for (let y = 6; y <= 11; y++) mset(m, 12, y, 'b');
    m.segs.push(
      { k: 'e', w: 1.5, pts: [6.8, 5.8, 8.2, 5.8, 8.2, 7.2, 6.8, 7.2, 6.8, 5.8] },
      { k: 'e', w: 1.5, pts: [8.8, 5.8, 10.2, 5.8, 10.2, 7.2, 8.8, 7.2, 8.8, 5.8] },
      { k: 'e', w: 1.2, pts: [8.2, 6.3, 8.8, 6.3] },
      { k: 'K', w: 1.6, pts: [6.6, 5.2, 8.0, 5.5] }, { k: 'K', w: 1.6, pts: [10.4, 5.2, 9.0, 5.5] },
      { k: 'R', w: 1.6, pts: [7.4, 8.6, 8.2, 8.3, 9.2, 8.6] },
      { k: 'C', w: 1.3, pts: [1.5, 8.6, 3, 8.3, 4.5, 8.6] }, { k: 'C', w: 1.3, pts: [3, 9.6, 4.5, 9.3, 6, 9.6] },
      { k: 'b', w: 1.9, pts: [12.5, 6.4, 12.4, 5.4, 11.7, 5.1, 11.3, 5.6] },
      { k: 's', w: 1.6, pts: [12.6, 7, 12.9, 8.2] },
    );
    return m;
  }

  /* ---------- small objects ---------- */
  const JUICE = ['.UT.', 'UwTH', 'TTTH', '.HH.'];

  /* ===================================================================== extra sprites */
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
  /** running-stitch trail (pointing right, ends at x = w) */
  function trailSprite(key) {
    return U.sprite(60, 16, (ctx) => {
      const rgb = PALR[key];
      ctx.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        const x0 = 4 + k * 13, y = 8 + (k & 1 ? 1.2 : -1.2);
        ctx.strokeStyle = 'rgba(40,22,10,0.35)'; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.moveTo(x0 + 0.6, y + 1.4); ctx.lineTo(x0 + 7.6, y + 1.4); ctx.stroke();
        ctx.strokeStyle = rgbStr(rgb, 0.35 + k * 0.2); ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 7, y); ctx.stroke();
        ctx.strokeStyle = rgbStr(U.mix(rgb, WHITE, 0.5), 0.3 + k * 0.15); ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x0 + 1, y - 0.6); ctx.lineTo(x0 + 6, y - 0.6); ctx.stroke();
      }
    });
  }
  /* ===================================================================== icons (12 x 12 cross-stitch motifs) */
  function disc(m, cx, cy, r, fn) {
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r;
      if (dx * dx + dy * dy <= 1) mset(m, x, y, fn(dx, dy, x, y));
    }
  }
  const pumpkinCol = (dx, dy) => (dx < -0.55 || dx > 0.65 ? 'q' : dx > 0.15 && dy < -0.1 ? 'o' : (Math.abs(dx) < 0.12 ? 'q' : 'O'));
  const ICON_DEF = {
    leech() {
      const m = motif(['.....rr.rr..', '....rEwrrrR.', '....rErrrrR.', '.....rrrRR..', '......rRR...', '............',
        '.AAAAAAAAAA.', 'AaoOyOoOOoaA', 'AaaaaaaaaaaA', '.aaaaaaaaaA.', '..aaaaaaAA..', '...AAAAAA...'], 'K');
      m.segs = [{ k: 'e', w: 1.5, pts: [2.5, 5.6, 2, 4.6, 2.6, 3.6, 2, 2.6] }, { k: 'e', w: 1.5, pts: [4.4, 5.6, 3.9, 4.8, 4.4, 4.1] }];
      return m;
    },
    thorns() {
      const m = blank(12, 12, 'K');
      disc(m, 6, 6.3, 3.4, (dx, dy) => (dy < -0.05 ? (dx < -0.3 ? 'P' : dx > 0.3 ? 'p' : 'm') : (dx > 0.4 ? 'C' : 'c')));
      for (const [x, y] of [[5, 0], [6, 0], [0, 6], [11, 6], [5, 11], [6, 11], [1, 1], [10, 1], [1, 10], [10, 10], [3, 2], [8, 2], [2, 3], [9, 3], [2, 9], [9, 9], [3, 10], [8, 10], [0, 5], [11, 5]]) mset(m, x, y, (x + y) & 1 ? 'G' : 'g');
      for (const [x, y] of [[5, 1], [6, 1], [1, 6], [10, 6], [1, 5], [10, 5], [5, 10], [6, 10]]) mset(m, x, y, 'l');
      m.segs = [{ k: 'P', w: 1.4, pts: [3.6, 5.2, 6, 4.6, 8.4, 5.2] }, { k: 'C', w: 1.4, pts: [3.4, 7.6, 6, 8.2, 8.6, 7.6] }];
      return m;
    },
    dashup() {
      const m = blank(12, 12, 'K');
      disc(m, 7.6, 6.4, 3.9, pumpkinCol);
      for (const [x, y] of [[6, 5], [9, 5]]) mset(m, x, y, 'y');
      for (const [x, y] of [[6, 8], [7, 8], [8, 8], [9, 7]]) mset(m, x, y, 'y');
      mset(m, 9, 2, 'G'); mset(m, 10, 2, 'g');
      for (const [x0, x1, y] of [[0, 2, 3], [1, 3, 5], [0, 2, 7], [1, 3, 9]]) for (let x = x0; x <= x1; x++) mset(m, x, y, x === x0 ? 'e' : 'w');
      m.segs = [{ k: 'h', w: 1.6, pts: [11.6, 3, 12, 6, 11.4, 9.4] }];
      return m;
    },
    range() {
      const m = blank(12, 12, 'K');
      for (const [x, y] of [[0, 10], [1, 7], [2, 5], [3, 3], [5, 2]]) mset(m, x, y, 'c');
      for (const [x, y, k] of [[7, 1, 'c'], [8, 1, 'w'], [8, 2, 'c'], [9, 2, 'C'], [7, 2, 'C']]) mset(m, x, y, k);
      disc(m, 9, 9, 2.9, (dx, dy) => { const d = Math.hypot(dx, dy); return d < 0.38 ? 'r' : d < 0.72 ? 'w' : 'r'; });
      m.segs = [{ k: 'y', w: 1.4, pts: [10, 0.4, 11.2, 0.4] }, { k: 'y', w: 1.4, pts: [10.2, 3.2, 11.4, 3.8] }, { k: 'b', w: 1.4, pts: [6.4, 1.5, 6.9, 1.6] }];
      return m;
    },
  };
  const iconCache = {};
  function iconSprite(id) {
    if (!iconCache[id]) iconCache[id] = renderMotif(ICON_DEF[id](), { shadowAlpha: 0.5 });
    return iconCache[id];
  }
  const ICONS = {};
  for (const id in ICON_DEF) {
    ICONS[id] = (ctx, size) => {
      const c = iconSprite(id);
      const inner = 12 * CP;
      const sc = (size * 0.96) / inner;
      ctx.imageSmoothingEnabled = true;
      const w = c.width * sc, h = c.height * sc;
      ctx.drawImage(c, (size - w) / 2 + 0.5, (size - h) / 2 + 0.5, w, h);
    };
  }

  /* ===================================================================== sprite cache */
  let SPR = null;
  function build() {
    const S = {};
    const sp = buildChar(spitterFrames());
    S.spitter = { walk: sp, aim: buildChar(spitterAim(), { parts: false }), spit: buildChar([spitterSpit()], { parts: false }) };
    S.bomber = buildChar(bomberFrames(), { hot: true });
    S.sprout = buildChar(sproutFrames());
    const ch = buildChar([0, 1, 2].map((f) => chargerMotif('chase', f)));
    S.charger = {
      walk: ch,
      tele: buildChar([0, 1].map((f) => chargerMotif('tele', f)), { parts: false }),
      dash: buildChar([chargerMotif('dash', 0)], { parts: false }),
      rest: buildChar([chargerMotif('rest', 0)], { parts: false }),
    };
    S.mother = buildChar([0, 1, 2].map(motherMotif));
    S.juice = renderMotif(motif(JUICE, 'K'), { shadowAlpha: 0.5 });
    S.juiceTrail = trailSprite('T');
    S.glowLime = glowSprite(24, [180, 255, 90], 0.6);
    S.glowWarm = glowSprite(24, [255, 190, 80], 0.6);
    S.glowLav = glowSprite(40, [210, 150, 255], 0.5);
    S.glowRed = glowSprite(20, [255, 70, 40], 0.7);
    S.needle = needleSprite();
    S.star = stitchSet(PALR.y, false);
    S.spark = stitchSet(PALR.Y, false);
    S.lime = stitchSet(PALR.T, false);
    S.limeL = stitchSet(PALR.U, false);
    S.dust = stitchSet(PALR.k, true);
    return S;
  }
  function ensure() { if (!SPR) SPR = build(); }

  /** Spawn (needle stitching it in) / death (unravelling) / body + hit flash, like the style's creeper. */
  function drawChar(ctx, e, view, set, fr, gx, gy, opt) {
    const left = e.facing < 0;
    const base = set.part.length ? set : opt && opt.partSet;
    if (e.spawnT < 1 || e.dying) {
      const ps = base || set;
      const prog = e.dying ? 1 - e.deathT : e.spawnT;
      const k = Math.floor(prog * PN);
      if (k >= PN) blitCell(ctx, (left ? ps.l : ps.r)[0], gx, gy);
      else if (k > 0 && ps.part.length) {
        ctx.globalAlpha = e.dying ? Math.min(1, prog * 3) : 1;
        blitCell(ctx, (left ? ps.partL : ps.part)[k - 1], gx, gy);
      }
      if (!e.dying) {
        const nx = (gx + ps.w * 0.5) * C + Math.sin(view.rt * 30 + e.seed * 9) * ps.w * 0.9;
        const ny = (gy + ps.h * (1 - prog)) * C - 4;
        ctx.globalAlpha = Math.min(1, (1 - prog) * 4);
        ctx.drawImage(SPR.needle, nx - 3, ny - 14, 16, 16);
      }
      ctx.globalAlpha = 1;
      return false;
    }
    const sx = (opt && opt.sx) || 1, sy = (opt && opt.sy) || 1;
    const img = (left ? set.l : set.r)[fr];
    if (sx === 1 && sy === 1) blitCell(ctx, img, gx, gy); else blitCellS(ctx, img, gx, gy, set.w, set.h, sx, sy);
    if (e.flash > 0) {
      ctx.globalAlpha = Math.min(1, e.flash * 1.3) * 0.9;
      const fimg = (left ? set.fl : set.fr)[fr];
      if (sx === 1 && sy === 1) blitCell(ctx, fimg, gx, gy); else blitCellS(ctx, fimg, gx, gy, set.w, set.h, sx, sy);
    }
    ctx.globalAlpha = 1;
    return true;
  }
  const gridX = (e, set) => Math.round(e.x / C - set.w / 2);
  const gridY = (e, set) => Math.round(e.y / C) - set.h;
  /** world x of a motif-local cell coordinate, honouring the facing mirror */
  const lx = (gx, set, x, left) => (gx + (left ? set.w - x : x)) * C;
  const walkFr = (e, sp) => [0, 1, 0, 2][Math.floor(e.anim * sp + e.seed * 4) & 3];
  function glow(ctx, img, x, y, w, h, a) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a;
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ===================================================================== registration */
  Cn.art('crossstitch', {
    init() { SPR = build(); },
    enemies: {
      spitter(ctx, e, view) {
        ensure();
        const T = SPR.spitter;
        const left = e.facing < 0;
        let set = T.walk, fr = walkFr(e, 1.6), aim = 0;
        if (!e.dying && e.spawnT >= 1) {
          if (e.mode === 'aim') { aim = e.charge || 0; set = T.aim; fr = aim < 0.5 ? 0 : 1; }
          else if ((e.spit || 0) > 0.35) { set = T.spit; fr = 0; }
        }
        const gx = gridX(e, T.walk), gy = gridY(e, set);
        ctx.save();
        if (aim > 0.3) ctx.translate(Math.sin(view.rt * 70 + e.seed * 9) * 0.5 * aim, 0);
        const ok = drawChar(ctx, e, view, set, fr, gx, gy, { partSet: T.walk });
        ctx.restore();
        if (!ok) return;
        const mx = lx(gx, set, 8.6, left), my = (gy + set.h - 3) * C;
        if (aim > 0) glow(ctx, SPR.glowLime, mx, my, 10 + aim * 16, 10 + aim * 16, 0.4 + aim * 0.6 * (0.85 + 0.15 * Math.sin(view.rt * 40)));
        if ((e.spit || 0) > 0) {
          const k = e.spit, f = left ? -1 : 1;
          glow(ctx, SPR.glowLime, mx + f * 4, my, 18, 14, k * 0.8);
          for (let i = 0; i < 6; i++) {
            const a = (i - 2.5) * 0.22, d = 3 + (1 - k) * 12 + (i & 1) * 3;
            const s = (i & 1 ? SPR.limeL : SPR.lime)[i % 3], sz = 2.6 * (0.6 + k * 0.6);
            ctx.globalAlpha = Math.min(1, k * 1.8);
            ctx.drawImage(s, mx + f * Math.cos(a) * d - sz / 2, my + Math.sin(a) * d - sz / 2, sz, sz);
          }
          ctx.globalAlpha = 1;
        }
      },
      bomber(ctx, e, view) {
        ensure();
        const set = SPR.bomber, left = e.facing < 0;
        const armed = e.armed && !e.dying && e.spawnT >= 1;
        const fz = armed ? e.fuse || 0 : 0;
        const fr = armed ? Math.floor(view.rt * 20) % 3 : walkFr(e, 2.4);
        const gx = gridX(e, set), gy = gridY(e, set);
        const sc = 1 + fz * 0.14 + (armed ? Math.sin(view.rt * 50) * 0.03 * fz : 0);
        ctx.save();
        if (armed) ctx.translate(Math.sin(view.rt * 80 + e.seed * 7) * 0.5 * fz, 0);
        const ok = drawChar(ctx, e, view, set, fr, gx, gy, { sx: sc, sy: sc });
        if (ok && armed) {
          const cyc = fz * 3 + fz * fz * 9, on = (cyc % 1) < 0.5;
          ctx.globalAlpha = on ? 0.7 + fz * 0.3 : 0.5;
          blitCellS(ctx, (on ? (left ? set.hl : set.hr) : (left ? set.fl : set.fr))[fr], gx, gy, set.w, set.h, sc, sc);
          ctx.globalAlpha = 1;
        }
        ctx.restore();
        if (!ok) return;
        // fuse spark (scaled with the body around the feet)
        const fx0 = (gx + set.w / 2) * C, fy0 = (gy + set.h) * C;
        const tx = fx0 + (lx(gx, set, BOMB_TIP[0], left) - fx0) * sc, ty = fy0 + ((gy + BOMB_TIP[1]) * C - fy0) * sc;
        const fl = 0.75 + 0.25 * Math.sin(view.rt * 37 + e.seed * 11);
        const big = (armed ? 1 + fz * 0.9 : 0.6) * fl;
        glow(ctx, SPR.glowWarm, tx, ty, 12 * big + 4, 12 * big + 4, armed ? 0.7 + 0.3 * fz : 0.45);
        const s = SPR.spark[Math.floor(view.rt * 14) % 3], sz = 3.2 * big;
        ctx.drawImage(s, tx - sz / 2, ty - sz / 2, sz, sz);
      },
      charger(ctx, e, view) {
        ensure();
        const T = SPR.charger, left = e.facing < 0;
        const mode = e.dying || e.spawnT < 1 ? 'chase' : e.mode;
        let set = T.walk, fr = walkFr(e, 1.8), jx = 0, rot = 0;
        if (mode === 'tele') { set = T.tele; const k = Math.min(1, (e.modeT || 0) / 0.72); fr = Math.floor(view.rt * (8 + k * 10)) & 1; jx = Math.sin(view.rt * 60 + e.seed * 9) * (0.3 + k * 0.6); }
        else if (mode === 'dash') { set = T.dash; fr = 0; }
        else if (mode === 'rest') { set = T.rest; fr = 0; rot = Math.sin(view.rt * 9 + e.seed * 5) * 0.07; }
        const gx = gridX(e, T.walk), gy = gridY(e, set);
        const f = left ? -1 : 1;
        if (mode === 'dash') {
          // running-stitch speed lines behind
          ctx.globalAlpha = 0.9;
          for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.translate(lx(gx, set, 1, left) - f * 2, (gy + 3 + i * 2) * C);
            ctx.scale(f, 1);
            ctx.drawImage(SPR.trailK || (SPR.trailK = trailSprite('k')), -15, -2, 15, 4);
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        }
        ctx.save();
        if (jx || rot) { const px = e.x, py = e.y; ctx.translate(px + jx, py); ctx.rotate(rot); ctx.translate(-px, -py); }
        const ok = drawChar(ctx, e, view, set, fr, gx, gy, { partSet: T.walk, sx: mode === 'dash' ? 1.12 : 1, sy: mode === 'dash' ? 0.94 : 1 });
        ctx.restore();
        if (!ok) return;
        if (mode === 'tele' || mode === 'dash') {
          const k = mode === 'dash' ? 1 : Math.min(1, (e.modeT || 0) / 0.72);
          const ey = mode === 'tele' ? 4 : 6;
          glow(ctx, SPR.glowRed, lx(gx, set, 10.5, left), (gy + ey + 0.5) * C, 9 + 6 * k, 9 + 6 * k, 0.45 + 0.5 * k);
        }
        if (mode === 'rest') {
          const hx = lx(gx, set, 9, left), hy = (gy - 0.6) * C;
          for (let i = 0; i < 3; i++) {
            const a = view.rt * 6 + (i / 3) * TAU;
            const s = SPR.star[i], sz = 3.6 + Math.sin(a) * 0.8;
            ctx.drawImage(s, hx + Math.cos(a) * 8 - sz / 2, hy + Math.sin(a) * 2.4 - sz / 2, sz, sz);
          }
        }
      },
      mother(ctx, e, view) {
        ensure();
        const set = SPR.mother;
        const b = e.dying ? 0 : e.birth || 0;
        let sx = 1, sy = 1;
        const gx = gridX(e, set), gy = gridY(e, set);
        if (b > 0 && e.spawnT >= 1) {
          const w = Math.sin((1 - b) * Math.PI * 3) * b;
          sx = 1 + 0.12 * w; sy = 1 - 0.1 * w;
          glow(ctx, SPR.glowLav, e.x, e.y - 20, 56 + (1 - b) * 20, 46 + (1 - b) * 16, b * 0.8);
        }
        drawChar(ctx, e, view, set, [0, 1, 0, 2][Math.floor(e.anim * 1.2 + e.seed * 4) & 3], gx, gy, { sx, sy });
      },
      sprout(ctx, e, view) {
        ensure();
        const set = SPR.sprout;
        drawChar(ctx, e, view, set, walkFr(e, 2.6), gridX(e, set), gridY(e, set));
      },
    },
    icons: ICONS,
    shot(ctx, s, view) {
      ensure();
      const y = s.y - s.z;
      const a = s.angle !== undefined ? s.angle : Math.atan2(s.vy, s.vx);
      const k = Math.min(1, s.age * 6);
      glow(ctx, SPR.glowLime, s.x, y, 20, 20, 0.55 + 0.2 * Math.sin(view.rt * 20 + s.seed * 9));
      ctx.save();
      ctx.translate(s.x, y);
      ctx.rotate(a);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(SPR.juiceTrail, -17 * k - 3, -2, 17 * k, 4.5);
      ctx.globalAlpha = 1;
      const wob = Math.sin(view.rt * 22 + s.seed * 13) * 0.08;
      const sz = 4 * C * 0.78, img = SPR.juice;
      const W = img.width * K * 0.78, H = img.height * K * 0.78;
      ctx.rotate(-a + Math.sin(view.rt * 3 + s.seed * 7) * 0.3);
      ctx.scale(1 + wob, 1 - wob);
      ctx.drawImage(img, -W / 2, -H / 2, W, H);
      ctx.restore();
      void sz;
    },
  });
})();
