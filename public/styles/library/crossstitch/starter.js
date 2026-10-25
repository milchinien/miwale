/* Cross-Stitch Sampler — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Ported from the reference module (js/styles/crossstitch.js): every cell of a 3.2-unit grid is a real
   thread "X" with shadow, dark underside, top ply, sheen and twist ticks; contours are backstitched. */
(function (root) {
  'use strict';
  // DMC-like floss palette. Single letters are the "thread codes" used in the motif grids below.
  const PALETTE = {
    Q: '#6c2817', q: '#a4401b', O: '#e2701f', o: '#f59b40', y: '#ffd23c', Y: '#fff2a6',
    G: '#2d5230', g: '#55843a', l: '#8daf55', L: '#b3c07c',
    B: '#45291c', b: '#7c4a2b', k: '#c79a66', K: '#2b1d1d',
    P: '#4f2560', p: '#83479a', m: '#bc8ac7',
    c: '#f3e6bf', C: '#d8bc7f', w: '#fbf8f0',
    i: '#d5e6f2', I: '#97b6d4', j: '#3c5078',
    r: '#c3312b', R: '#7a1c24', E: '#e65f3e',
    a: '#9f9a93', A: '#5f5a58', e: '#d0cbc2', d: '#1d3f55', D: '#2e6479',
    f: '#c99a3e', F: '#a6782e', h: '#e3b24d', t: '#f2d37c', x: '#a24f2a', X: '#84391f', z: '#6b3b24',
    N: '#2b4b70', n: '#43729e', u: '#7faacf', W: '#bcd6ea', s: '#e58ca2', v: '#7b59a8', V: '#a98bd0',
  };
  const AIDA = '#dccaa5';           // fabric base
  const C = 3.2, CP = 8, K = C / CP; // world units per stitch cell, sprite px per cell, units per sprite px
  const SM = 2, MP = 5, DS = 5;      // stitch sprite margin, motif margin (px), decal px per world unit
  const TAU = Math.PI * 2, WHITE = [255, 255, 255];

  /* ---------- tiny helpers (inlined, no dependencies) ---------- */
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb = (c, a) => (a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
  const mul = (c, f) => c.map((v) => clamp(v * f, 0, 255));
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const RGB = {}; for (const k in PALETTE) RGB[k] = hex(PALETTE[k]);
  const toRgb = (k) => RGB[k] || hex(k);
  function hashInt(x, y, s) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0;
  }
  const hash2 = (x, y, s) => hashInt(x, y, s) / 4294967296;
  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { next, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)) };
  }
  const B8 = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  const bayer = (i, j) => (B8[((j & 7) << 3) | (i & 7)] + 0.5) / 64;
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return lerp(lerp(hash2(xi, yi, s), hash2(xi + 1, yi, s), u), lerp(hash2(xi, yi + 1, s), hash2(xi + 1, yi + 1, s), u), v);
  }
  function fbm(x, y, s, oct = 3) { let a = 1, f = 1, sum = 0, n = 0; for (let o = 0; o < oct; o++) { sum += a * vnoise(x * f, y * f, s + o * 101); n += a; a *= 0.5; f *= 2; } return sum / n; }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return { c, ctx: c.getContext('2d') }; }
  function sprite(w, h, fn) { const o = canvas(w, h); fn(o.ctx, o.c.width, o.c.height); return o.c; }

  /* ---------- thread primitives ---------- */
  // One full cross stitch in a CP×CP cell (+SM margin): two twisted strokes, each = shadow, dark body, top ply, sheen, twist ticks.
  function makeStitch(c3, v) {
    return sprite(CP + SM * 2, CP + SM * 2, (ctx) => {
      const r = rng(v * 977 + c3[0] * 3 + c3[1] * 7 + c3[2] * 11), j = () => (r.next() - 0.5) * 0.5;
      const a = SM + 0.85, b = SM + CP - 0.85, base = mul(c3, 0.95 + r.next() * 0.1);
      const line = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
      ctx.lineCap = 'round';
      [[a + j(), b + j(), b + j(), a + j(), -1], [a + j(), a + j(), b + j(), b + j(), 1]].forEach(([x0, y0, x1, y1, dir], n) => {
        ctx.strokeStyle = n ? 'rgba(40,22,10,0.30)' : 'rgba(40,22,10,0.36)'; ctx.lineWidth = 3.1; line(x0 + 0.45, y0 + 0.85, x1 + 0.45, y1 + 0.85);
        ctx.strokeStyle = rgb(mul(base, 0.7)); ctx.lineWidth = 2.9; line(x0, y0, x1, y1);
        const px = dir < 0 ? -0.18 : 0.18; ctx.strokeStyle = rgb(base); ctx.lineWidth = 2.0; line(x0 + px, y0 - 0.22, x1 + px, y1 - 0.22);
        const hx = dir < 0 ? -0.55 : 0.5; ctx.strokeStyle = rgb(mix(base, WHITE, 0.5), 0.75); ctx.lineWidth = 0.7;
        line(lerp(x0, x1, 0.18) + hx, lerp(y0, y1, 0.18) - 0.6, lerp(x0, x1, 0.78) + hx, lerp(y0, y1, 0.78) - 0.6);
        ctx.strokeStyle = rgb(mul(base, 0.62), 0.45); ctx.lineWidth = 0.55;
        const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        for (const tt of [0.3, 0.52, 0.74]) { const cx = x0 + dx * tt, cy = y0 + dy * tt; line(cx + uy * 0.9 - ux * 0.5, cy - ux * 0.9 - uy * 0.5, cx - uy * 0.9 + ux * 0.5, cy + ux * 0.9 + uy * 0.5); }
      });
    });
  }
  const stitchCache = new Map();
  function stitchSet(c3) { const k = c3.join(); let s = stitchCache.get(k); if (!s) stitchCache.set(k, (s = [0, 1, 2].map((v) => makeStitch(c3, v)))); return s; }
  // Seamless 4×4-cell tile of one colour -> used as a fill pattern (a dozen fills per ground instead of thousands of drawImage).
  const patCache = new Map();
  function stitchPattern(key) {
    if (patCache.has(key)) return patCache.get(key);
    const S = 4 * CP, set = stitchSet(RGB[key]);
    const c = sprite(S, S, (ctx) => { for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) ctx.drawImage(set[hashInt(x, y, key.charCodeAt(0)) % 3], x * CP - SM + ox * S, y * CP - SM + oy * S); });
    patCache.set(key, c); return c;
  }
  // Backstitch: flat [x0,y0,x1,y1,...] segments, each shortened by `gap` at the holes; 4 passes (shadow, dark, body, sheen).
  function threadSegs(ctx, segs, c3, w, gap) {
    if (!segs.length) return;
    const path = (dx, dy) => {
      ctx.beginPath();
      for (let k = 0; k < segs.length; k += 4) {
        const x0 = segs[k], y0 = segs[k + 1], x1 = segs[k + 2], y1 = segs[k + 3], L = Math.hypot(x1 - x0, y1 - y0) || 1, g = Math.min(gap, L * 0.3);
        const gx = ((x1 - x0) / L) * g, gy = ((y1 - y0) / L) * g;
        ctx.moveTo(x0 + gx + dx, y0 + gy + dy); ctx.lineTo(x1 - gx + dx, y1 - gy + dy);
      }
    };
    ctx.lineCap = 'round';
    path(w * 0.28, w * 0.42); ctx.strokeStyle = 'rgba(35,20,10,0.36)'; ctx.lineWidth = w * 1.12; ctx.stroke();
    path(0, 0); ctx.strokeStyle = rgb(mul(c3, 0.72)); ctx.lineWidth = w; ctx.stroke();
    path(-w * 0.06, -w * 0.08); ctx.strokeStyle = rgb(c3); ctx.lineWidth = w * 0.62; ctx.stroke();
    path(-w * 0.16, -w * 0.22); ctx.strokeStyle = rgb(mix(c3, WHITE, 0.45), 0.7); ctx.lineWidth = w * 0.26; ctx.stroke();
  }

  /* ---------- motifs: cell grids -> embroidered sprites ---------- */
  function motif(rows, outline, segs) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length)), cell = new Array(w * h).fill(null);
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') cell[y * w + x] = ch; }));
    return { w, h, cell, outline, segs: segs || [] };
  }
  function mirror(m) {
    const o = { ...m, cell: m.cell.map((_, q) => m.cell[Math.floor(q / m.w) * m.w + (m.w - 1 - (q % m.w))]) };
    o.segs = m.segs.map((s) => ({ ...s, pts: s.pts.map((v, i) => (i % 2 ? v : m.w - v)) }));
    return o;
  }
  // blurred drop shadow -> dark thread underlay -> cross stitches -> backstitched outline / inner contour / free segments
  function renderMotif(m, o = {}) {
    const W = m.w * CP + MP * 2, H = m.h * CP + MP * 2, { c, ctx } = canvas(W, H);
    const col = (k) => (o.mod ? o.mod(toRgb(k)) : toRgb(k));
    const has = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !!m.cell[y * m.w + x];
    if (!o.noShadow) {
      const s = canvas(W, H); s.ctx.fillStyle = '#28160c';
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (has(x, y)) s.ctx.fillRect(MP + x * CP, MP + y * CP, CP, CP);
      ctx.save(); ctx.filter = 'blur(1.1px)'; ctx.globalAlpha = o.shadowAlpha !== undefined ? o.shadowAlpha : 0.42; ctx.drawImage(s.c, 1.4, 2.4); ctx.restore();
    }
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (has(x, y)) { ctx.fillStyle = rgb(mul(col(m.cell[y * m.w + x]), 0.64)); ctx.fillRect(MP + x * CP + 0.6, MP + y * CP + 0.6, CP - 1.2, CP - 1.2); }
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (has(x, y)) ctx.drawImage(stitchSet(col(m.cell[y * m.w + x]))[hashInt(x, y, 77) % 3], MP + x * CP - SM, MP + y * CP - SM);
    const edges = (test, other) => {
      const segs = [];
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        if (!test(x, y)) continue;
        const X0 = MP + x * CP, Y0 = MP + y * CP, X1 = X0 + CP, Y1 = Y0 + CP;
        if (other(x, y - 1)) segs.push(X0, Y0, X1, Y0); if (other(x, y + 1)) segs.push(X0, Y1, X1, Y1);
        if (other(x - 1, y)) segs.push(X0, Y0, X0, Y1); if (other(x + 1, y)) segs.push(X1, Y0, X1, Y1);
      }
      return segs;
    };
    if (m.outline) threadSegs(ctx, edges(has, (x, y) => !has(x, y)), col(m.outline), 2.2, 0.55);
    if (m.inner) { const isK = (x, y) => has(x, y) && m.inner.keys.includes(m.cell[y * m.w + x]); threadSegs(ctx, edges(isK, (x, y) => has(x, y) && !isK(x, y)), col(m.inner.k), 1.7, 0.5); }
    for (const s of m.segs) { const out = []; for (let q = 0; q + 3 < s.pts.length; q += 2) out.push(MP + s.pts[q] * CP, MP + s.pts[q + 1] * CP, MP + s.pts[q + 2] * CP, MP + s.pts[q + 3] * CP); threadSegs(ctx, out, col(s.k), s.w || 2.1, 0.55); }
    return c;
  }
  // draw a motif sprite with its grid origin on world cell (gx, gy) -> everything snaps to the fabric grid
  const blitCell = (ctx, spr, gx, gy) => ctx.drawImage(spr, gx * C - MP * K, gy * C - MP * K, spr.width * K, spr.height * K);
  function buildChar(frames) {
    const flash = (c3) => mix(c3, WHITE, 0.6);
    return { w: frames[0].w, h: frames[0].h, r: frames.map((m) => renderMotif(m)), l: frames.map((m) => renderMotif(mirror(m))), fr: frames.map((m) => renderMotif(m, { mod: flash, noShadow: true })) };
  }

  /* ---------- character + prop grids (1 letter = 1 stitch) ---------- */
  const HERO_HEAD = ['....gG...', '..qoOOq..', '.qoOOOOq.', 'qoOYyOYyq', 'qoOOOOOOq', 'qOyYyYyYq', '.qOyOyOq.', '..RrrrR..'];
  const HERO_BODY = [['.rdDDDdk.', '..dDDDd..', '..BB.BB..'], ['.rdDDDd.k', '.ddDDDd..', '.BB...BB.'], ['r.dDDDdk.', '..dDDDdd.', '...BBB...']];
  const CREEP_TOP = [['.g.G.g.', '..gGg..'], ['g..G.g.', '..gGg..'], ['.g.G..g', '..gGg..']];
  const CREEP_MID = ['.PPpPP.', 'PpmpppP', 'PppyPyP', 'pCcccCp', '.CcccC.'], CREEP_LEG = ['..k.k..', '.k...k.', '...kk..'];
  const CREEP_SEGS = [{ k: 'K', w: 1.6, pts: [3, 3, 4, 4] }, { k: 'K', w: 1.6, pts: [6, 3, 5, 4] }, { k: 'R', w: 1.6, pts: [3, 6.6, 4, 5.6, 5, 6.6] }];
  const GHOST_TOP = ['..iwi...', '.iwwwi..', 'iwjwjwi.', 'iwjwjwii', 'iwwjwwI.', 'IwwjwwI.'], GHOST_TAIL = [['.IiwiI..', '..I.I...'], ['..IiwI..', '.I..I...'], ['.IiwI...', '...I.I..']];
  const PUMPKINS = ['...G........', '.oOoOq......', 'oOoOoOq..G..', 'oOoOoOq.oOoq', 'qOoOoOq.oOoq', '.qqqqq...qq.'];
  const GRAVE = ['.aea.', 'aeeea', 'aeAea', 'aAAAa', 'aeAea', 'aeeea', 'AAAAA'];
  // Round autumn tree: lit sphere (light from upper-left) quantised to a 4-thread ramp with bayer jitter, stitched trunk.
  function treeMotif(ramp, seed) {
    const m = motif(Array(16).fill('.'.repeat(13)), 'B'), r = rng(seed), ph = r.next() * 6, set = (x, y, k) => { if (x >= 0 && y >= 0 && x < 13 && y < 16) m.cell[y * 13 + x] = k; };
    for (let y = 0; y <= 11; y++) for (let x = 0; x < 13; x++) {
      const nx = (x + 0.5 - 6.5) / 6.2, ny = (y + 0.5 - 6) / 5.9, ang = Math.atan2(ny, nx);
      const d = Math.hypot(nx, ny) / (1 + 0.1 * Math.sin(ang * 5 + ph) + 0.05 * Math.sin(ang * 9 + ph * 2));
      if (d > 1) continue;
      const l = -0.5 * nx - 0.6 * ny + 0.62 * Math.sqrt(Math.max(0, 1 - d * d)) + (r.next() - 0.5) * 0.3;
      set(x, y, ramp[clamp(Math.floor(l * 2.3 + 1.5 + (bayer(x & 3, y & 3) - 0.5) * 0.9), 0, 3)]);
    }
    for (let y = 9; y <= 14; y++) { set(5, y, 'k'); set(6, y, 'b'); set(7, y, 'z'); }
    set(4, 11, 'b'); set(8, 10, 'b'); for (let x = 4; x <= 8; x++) set(x, 15, x === 6 ? 'z' : 'b');
    return m;
  }

  /* ---------- small round sprites: French knot, bead, glow ---------- */
  function radial(ctx, c, R, ox, oy, stops) { const g = ctx.createRadialGradient(c + ox, c + oy, R * 0.1, c, c, R); stops.forEach(([p, s]) => g.addColorStop(p, s)); return g; }
  function knotSprite(c3, rad) {
    const s = Math.ceil(rad * DS * 2 + 6);
    return sprite(s, s, (ctx) => {
      const c = s / 2, R = rad * DS;
      ctx.fillStyle = 'rgba(40,22,10,0.38)'; ctx.beginPath(); ctx.arc(c + 0.8, c + 1.3, R, 0, TAU); ctx.fill();
      ctx.fillStyle = radial(ctx, c, R, -R * 0.35, -R * 0.4, [[0, rgb(mix(c3, WHITE, 0.45))], [0.55, rgb(c3)], [1, rgb(mul(c3, 0.6))]]);
      ctx.beginPath(); ctx.arc(c, c, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgb(mul(c3, 0.6), 0.55); ctx.lineWidth = 0.7;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(c, c, R * (0.35 + k * 0.22), 0.4 + k, 2.2 + k); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(c - R * 0.35, c - R * 0.4, R * 0.22, 0, TAU); ctx.fill();
    });
  }
  const knotCache = new Map();
  function drawKnot(ctx, key, x, y, rad) {
    const id = key + rad; let s = knotCache.get(id); if (!s) knotCache.set(id, (s = knotSprite(toRgb(key), rad)));
    ctx.drawImage(s, x - s.width / DS / 2, y - s.height / DS / 2, s.width / DS, s.height / DS);
  }
  function beadSprite(c3, s) {
    return sprite(s, s, (ctx) => {
      const c = s / 2, R = s * 0.36;
      ctx.fillStyle = 'rgba(40,22,10,0.35)'; ctx.beginPath(); ctx.ellipse(c + 0.6, c + 1, R, R * 0.9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = radial(ctx, c, R, -R * 0.4, -R * 0.45, [[0, rgb(mix(c3, WHITE, 0.75))], [0.45, rgb(c3)], [1, rgb(mul(c3, 0.5))]]);
      ctx.beginPath(); ctx.ellipse(c, c, R, R * 0.9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = rgb(mul(c3, 0.35), 0.8); ctx.beginPath(); ctx.ellipse(c, c, R * 0.3, R * 0.25, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(c - R * 0.42, c - R * 0.45, R * 0.18, 0, TAU); ctx.fill();
    });
  }
  function glowSprite(r, c3, a) {
    const s = Math.ceil(r * 2);
    return sprite(s, s, (ctx) => { const g = ctx.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, rgb(c3, a)); g.addColorStop(0.4, rgb(c3, a * 0.45)); g.addColorStop(1, rgb(c3, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, s, s); });
  }
  // Satin stitch block (pond): 3 slanted parallel threads across L cells.
  function satinSprite(c3, L, v) {
    return sprite(L * CP + SM * 2, CP + SM * 2, (ctx) => {
      const r = rng(v * 31 + L * 7 + c3[2]); ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const y = SM + 1.4 + k * 2.6 + (r.next() - 0.5) * 0.3, x0 = SM + 0.7, x1 = SM + L * CP - 0.7, base = mul(c3, 0.94 + r.next() * 0.12);
        const line = (st, lw, oy) => { ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0, y - 0.9 + oy); ctx.lineTo(x1, y + 0.9 + oy); ctx.stroke(); };
        line('rgba(20,20,40,0.3)', 2.7, 0.9); line(rgb(mul(base, 0.75)), 2.5, 0); line(rgb(base), 1.6, -0.2); line(rgb(mix(base, WHITE, 0.55), 0.5), 0.6, -0.7);
      }
    });
  }

  let S = null; // baked sprites
  function init() {
    if (S) return S;
    S = {};
    // Aida fabric tile: 16×16 holes of 8 px; hole corners 0.74, hole edges 0.93, woven 2×2 checker, row/column slub noise.
    S.fab = sprite(16 * CP, 16 * CP, (ctx, n) => {
      const img = ctx.createImageData(n, n), d = img.data, base = hex(AIDA);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const lx = x % CP, ly = y % CP, ex = lx === 0 || lx === CP - 1, ey = ly === 0 || ly === CP - 1;
        let f = ex && ey ? 0.74 : ex || ey ? 0.93 : (((lx >> 1) + (ly >> 1)) & 1) ? 1.03 : 0.985;
        f *= 1 + (hash2(y >> 1, 0, 11) - 0.5) * 0.035 + (hash2(0, x >> 1, 12) - 0.5) * 0.035 + (hash2(x, y, 13) - 0.5) * 0.03;
        const o = (y * n + x) * 4; d[o] = base[0] * f; d[o + 1] = base[1] * f; d[o + 2] = base[2] * f; d[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    });
    S.hero = buildChar(HERO_BODY.map((b) => Object.assign(motif([...HERO_HEAD, ...b], 'K', [{ k: 'g', w: 1.8, pts: [6, 1, 7, 0.5, 7.5, 0] }]), { inner: { keys: 'yY', k: 'Q' } })));
    S.creeper = buildChar([0, 1, 2].map((f) => motif([...CREEP_TOP[f], ...CREEP_MID, CREEP_LEG[f]], 'K', CREEP_SEGS)));
    S.ghost = buildChar([0, 1, 2].map((f) => motif([...GHOST_TOP, ...GHOST_TAIL[f]], 'j')));
    S.trees = [['Q', 'q', 'O', 'o'], ['R', 'r', 'E', 'o'], ['F', 'f', 'h', 't']].map((r, k) => renderMotif(treeMotif(r, k + 1)));
    S.pumpkins = renderMotif(motif(PUMPKINS, 'K', [{ k: 'g', w: 1.6, pts: [4, 1, 6, 0.5, 8, 1, 9, 2] }]));
    S.grave = renderMotif(motif(GRAVE, 'K'));
    S.leaf = renderMotif(motif(['.oo', 'oOq', '.q.'], 'q', [{ k: 'b', w: 1.3, pts: [1, 2, 0, 3] }]), { shadowAlpha: 0.3 });
    S.lantern = renderMotif(motif(['..G..', '.pmp.', 'pymyp', 'cCyCc', '.cCc.'], 'K'));
    S.gem = beadSprite(hex('#f39a2e'), 18);
    S.satin = ['W', 'u', 'n', 'N'].map((t) => [1, 2, 3].map((L) => satinSprite(RGB[t], L, L)));
    S.glowS = glowSprite(24, [255, 190, 80], 0.5); S.glowB = glowSprite(40, [255, 205, 110], 0.55);
    S.glowJ = glowSprite(64, [255, 170, 70], 0.32); S.glowC = glowSprite(40, [255, 150, 60], 0.5);
    S.shadow = sprite(48, 18, (ctx) => { const g = ctx.createRadialGradient(24, 9, 0, 24, 9, 24); g.addColorStop(0, 'rgba(50,28,12,0.55)'); g.addColorStop(0.6, 'rgba(50,28,12,0.25)'); g.addColorStop(1, 'rgba(50,28,12,0)'); ctx.fillStyle = g; ctx.scale(1, 18 / 48); ctx.fillRect(0, 0, 48, 48); });
    return S;
  }

  /* ---------- characters ---------- */
  const shadowAt = (ctx, x, y, w, a) => { ctx.globalAlpha = a; ctx.drawImage(S.shadow, x - w / 2, y - w * 0.19, w, w * 0.375); ctx.globalAlpha = 1; };
  /** Draws the main character (pumpkin head, red scarf, navy cloak) with feet at (x, y) in world units. t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) {
    init();
    const set = S.hero, fr = [1, 0, 2, 0][Math.floor(t * 9) & 3]; // walk: frame sequence 1,0,2,0
    const gx = Math.round(x / C - set.w / 2), gy = Math.round(y / C) - set.h;
    shadowAt(ctx, x, y, 26, 1);
    blitCell(ctx, (facing < 0 ? set.l : set.r)[fr], gx, gy);
    ctx.globalCompositeOperation = 'lighter'; // carved face candle glow
    ctx.globalAlpha = 0.22 + 0.07 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23);
    ctx.drawImage(S.glowC, (gx + 4.5 + 0.6 * facing) * C - 12, (gy + 5) * C - 9, 24, 18);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  /** Draws a typical creature with feet at (x, y). kind = 'creeper' (small purple root creature with a leafy top) | 'ghost' (fast floating ghost); flash 0..1 = white-flash overlay. */
  function drawEnemy(ctx, x, y, t, kind = 'creeper', facing = -1, seed = 0, flash = 0) {
    init();
    const set = S[kind] || S.creeper, gx = Math.round(x / C - set.w / 2);
    let gy = Math.round(y / C) - set.h, fr = [0, 1, 0, 2][Math.floor(t * 5.8 + seed * 4) & 3];
    if (kind === 'ghost') { gy -= 1 + (Math.sin(t * 2.2 + seed * 9) > 0.3 ? 1 : 0); fr = Math.floor(t * 5 + seed * 7) % 3; }
    shadowAt(ctx, x, y, kind === 'ghost' ? 16 : 20, kind === 'ghost' ? 0.5 : 1);
    ctx.globalAlpha = kind === 'ghost' ? 0.9 : 1;
    blitCell(ctx, (facing < 0 ? set.l : set.r)[fr], gx, gy);
    if (flash > 0) { ctx.globalAlpha = Math.min(1, flash * 1.3) * 0.9; blitCell(ctx, set.fr[fr], gx, gy); }
    ctx.globalAlpha = 1;
  }

  /* ---------- ground: fabric + stitched regions, baked once per canvas size ---------- */
  const MEADOW = 0, FOREST = 1, POND = 2, PATH = 3;
  let ground = null;
  function bakeGround(w, h) {
    const s = h / 360, VW = w / s, X0 = VW / 2 - 320, NX = Math.ceil(VW / C) + 1, NY = Math.ceil(360 / C) + 1;
    const { c, ctx } = canvas(w, h);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const fab = ctx.createPattern(S.fab, 'repeat'); fab.setTransform(new DOMMatrix([K, 0, 0, K, 0, 0]));
    ctx.fillStyle = fab; ctx.fillRect(0, 0, VW + C, 360 + C);
    const MAT = new Uint8Array(NX * NY), VAL = new Float32Array(NX * NY);
    const at = (i, j) => (i < 0 || j < 0 || i >= NX || j >= NY ? MEADOW : MAT[j * NX + i]);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const x = (i + 0.5) * C, y = (j + 0.5) * C, q = j * NX + i, lx = x - X0;
      const px = 40 + (360 - y) * 0.62 + 10 * Math.sin(y / 46), pd = Math.abs(lx - px) * 0.85;
      const pond = 1 - Math.hypot((lx - 170) / 150, (y - 370) / 95) + (fbm(x / 60, y / 60, 3) - 0.5) * 0.6;
      const forest = Math.max(1 - Math.hypot((lx - 600) / 170, (y - 390) / 110), 1 - Math.hypot((lx - 560) / 130, (y + 20) / 60)) + (fbm(x / 70, y / 70, 9) - 0.5) * 0.7;
      if (pd < 8) MAT[q] = PATH; else if (pond > 0 && pd > 16) { MAT[q] = POND; VAL[q] = pond; } else if (forest > 0) { MAT[q] = FOREST; VAL[q] = forest; } else VAL[q] = forest;
    }
    // bare linen path = lighter fabric; then stitches merged into per-colour row runs, each filled with a stitch pattern
    const paths = new Map(), addRun = (k, i, j, n) => { if (!paths.has(k)) paths.set(k, new Path2D()); paths.get(k).rect(i * C, j * C, n * C, C); };
    ctx.fillStyle = 'rgba(255,250,236,0.42)';
    for (let j = 0; j < NY; j++) {
      let run = null, r0 = 0;
      for (let i = 0; i <= NX; i++) {
        const q = j * NX + i, m = i < NX ? MAT[q] : -1, x = (i + 0.5) * C, y = (j + 0.5) * C;
        if (m === PATH) ctx.fillRect(i * C, j * C, C, C);
        let key = null;
        if (m === MEADOW) {
          let dens = 0.03 + 0.3 * sstep(0.38, 0.62, fbm(x / 110, y / 110, 5)) + 0.4 * sstep(-0.3, 0, VAL[q]);
          if (bayer(i, j) * 0.55 + hash2(i, j, 17) * 0.45 < dens) key = ['L', 'l', 'g'][clamp(Math.floor(fbm(x / 160, y / 160, 7) * 3.4 - 0.2 + (bayer(i + 3, j + 5) - 0.5) * 0.9), 0, 2)];
        } else if (m === FOREST) {
          key = ['z', 'X', 'x'][clamp(Math.floor(fbm(x / 90, y / 90, 11) * 3.6 - 0.3 + (bayer(i, j) - 0.5) * 0.9), 0, 2)];
          const hh = hash2(i, j, 91); if (hh < 0.018) key = 'h'; else if (hh < 0.034) key = 'o';
        }
        if (key !== run) { if (run) addRun(run, r0, j, i - r0); run = key; r0 = i; }
      }
    }
    for (const [k, p] of paths) { const pat = ctx.createPattern(stitchPattern(k), 'repeat'); pat.setTransform(new DOMMatrix([K, 0, 0, K, 0, 0])); ctx.fillStyle = pat; ctx.fill(p); }
    // pond: satin blocks of up to 3 cells in a brick pattern (offset j % 3), tone = depth
    for (let j = 0; j < NY; j++) for (let s0 = -(j % 3); s0 < NX; s0 += 3) {
      let k = 0;
      while (k < 3) {
        if (at(s0 + k, j) !== POND) { k++; continue; }
        let e = k; while (e < 3 && at(s0 + e, j) === POND) e++;
        const si = s0 + k, tone = clamp(Math.floor(VAL[j * NX + si] / 0.2 + (hash2(si, j, 8) - 0.5) * 0.8), 0, 3), spr = S.satin[tone][e - k - 1];
        ctx.drawImage(spr, si * C - SM * K, j * C - SM * K, spr.width * K, spr.height * K); k = e;
      }
    }
    // decals on whole cells: French-knot flowers, three-stitch grass tufts, forest leaves and knots
    for (let j = 1; j < NY - 1; j++) for (let i = 1; i < NX - 1; i++) {
      if (hash2(i, j, 33) > 0.024) continue;
      const m = at(i, j), r0 = hash2(i, j, 34), r1 = hash2(i, j, 35), hx = i * C, hy = j * C;
      if (m === MEADOW && at(i + 1, j) === MEADOW && at(i, j + 1) === MEADOW && at(i - 1, j) === MEADOW) {
        if (r0 < 0.4) {
          const ck = ['s', 'w', 'h', 'V', 'm', 'E'][Math.floor(r1 * 6)], nk = 3 + Math.floor(hash2(i, j, 36) * 3);
          threadSegs(ctx, [hx, hy + C * 1.6, hx + C * 0.1, hy + C * 0.4, hx, hy + C * 1.6, hx - C * 0.7, hy + C * 0.7], RGB.g, 0.6, 0.15);
          for (let k = 0; k < nk; k++) { const a = (k / nk) * TAU + r1 * 3; drawKnot(ctx, ck, hx + Math.cos(a) * 1.25, hy + Math.sin(a), 0.95); }
          drawKnot(ctx, ck === 'h' ? 'q' : 'y', hx, hy, 0.75);
        } else if (r0 < 0.8) threadSegs(ctx, [hx, hy + C, hx - C * 0.7, hy - C * 0.3, hx, hy + C, hx + C * 0.1, hy - C * 0.8, hx, hy + C, hx + C * 0.8, hy - C * 0.2], r1 < 0.5 ? RGB.g : RGB.l, 0.62, 0.12);
      } else if (m === FOREST) {
        if (r0 < 0.45) blitCell(ctx, S.leaf, i - 1, j - 1); else { drawKnot(ctx, 'b', hx, hy, 1.0); drawKnot(ctx, 'k', hx + 1.3, hy + 0.9, 0.85); }
      }
    }
    // backstitch contour along every region border (pond: navy, path: brown, forest: dark brown), 1.0 unit thread
    const segs = { N: [], b: [], B: [] }, ec = (a, b) => (a === b ? null : a === POND || b === POND ? 'N' : a === PATH || b === PATH ? 'b' : 'B');
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const m = at(i, j), x = i * C, y = j * C; let k;
      if ((k = ec(m, at(i + 1, j)))) segs[k].push(x + C, y, x + C, y + C);
      if ((k = ec(m, at(i, j + 1)))) segs[k].push(x, y + C, x + C, y + C);
    }
    for (const k in segs) threadSegs(ctx, segs[k], RGB[k], 1.0, 0.3);
    // props on the grid (y-sorted with characters later)
    const props = [[S.trees[0], 13, 16, 330, 105], [S.trees[1], 13, 16, 560, 250], [S.trees[2], 13, 16, 480, 330], [S.trees[0], 13, 16, 600, 360],
      [S.pumpkins, 12, 6, 235, 135], [S.grave, 5, 7, 395, 60], [S.grave, 5, 7, 70, 70]].map(([spr, pw, ph, x, y]) => ({ spr, gx: Math.round((X0 + x) / C - pw / 2), gy: Math.round(y / C) - ph, y }));
    return { c, w, h, X0, VW, props };
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds): ground, main character, creatures, an effect. */
  function draw(ctx, w, h, t) {
    init();
    if (!ground || ground.w !== w || ground.h !== h) ground = bakeGround(w, h);
    const s = h / 360, X0 = ground.X0;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(ground.c, 0, 0);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const hx = X0 + 320, hy = 205, face = Math.sin(t * 0.7) > -0.6 ? 1 : -1;
    // warm candle light pool around the main character (additive)
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 13.1);
    ctx.drawImage(S.glowJ, hx - 40, hy - 30, 80, 52); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // collectibles: glass beads with glow, bobbing 0.8 units
    for (let k = 0; k < 7; k++) {
      const gx = X0 + 395 + k * 17 + Math.sin(k * 3) * 6, g0 = 222 + Math.cos(k * 2.1) * 14, gy = g0 - 3 - Math.sin(t * 3 + k) * 0.8;
      ctx.globalAlpha = 0.6; ctx.drawImage(S.shadow, gx - 3, g0 - 1.2, 6, 2.4);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 + 0.2 * Math.sin(t * 4 + k * 9); ctx.drawImage(S.glowS, gx - 6.5, gy - 6.5, 13, 13);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.drawImage(S.gem, gx - 2.7, gy - 2.7, 5.4, 5.4);
    }
    // characters and props, y-sorted
    const list = ground.props.map((p) => ({ y: p.y, f: () => blitCell(ctx, p.spr, p.gx, p.gy) }));
    list.push({ y: hy, f: () => drawHero(ctx, hx, hy, t, face) });
    const foes = [[385, 190, 'creeper', 0.1], [360, 262, 'creeper', 0.6], [250, 240, 'ghost', 0.3], [470, 150, 'ghost', 0.8], [520, 200, 'creeper', 0.4], [150, 160, 'creeper', 0.9]];
    foes.forEach(([x, y, kind, seed], n) => { const ex = X0 + x + Math.sin(t * 0.8 + n) * 4; list.push({ y, f: () => drawEnemy(ctx, ex, y, t, kind, ex > hx ? -1 : 1, seed, n === 0 ? 0.5 + 0.5 * Math.sin(t * 6) : 0) }); });
    list.sort((a, b) => a.y - b.y).forEach((o) => o.f());
    // orbiting lantern motifs with additive glow
    for (let k = 0; k < 2; k++) {
      const a = t * 2.2 + k * Math.PI, ox = hx + Math.cos(a) * 30, oy = hy - 10 + Math.sin(a) * 18;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.15 * Math.sin(t * 8 + k); ctx.drawImage(S.glowB, ox - 14, oy - 22, 28, 28);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      const lw = S.lantern.width * K, lh = S.lantern.height * K; ctx.drawImage(S.lantern, ox - lw / 2, oy - lh + 2 + Math.sin(t * 4 + k) * 0.8, lw, lh);
    }
    // projectile: running-stitch trail + seed; impact burst: dashed thread ring + cream knot flash
    const px = hx + 18 + ((t * 120) % 50), py = hy - 12 - ((t * 120) % 50) * 0.3;
    for (let k = 0; k < 3; k++) threadSegs(ctx, [px - 12 + k * 2.4, py + 3.6 - k * 0.72, px - 10.6 + k * 2.4, py + 3.2 - k * 0.72], [255, 214, 120], 0.45, 0);
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.29); ctx.fillStyle = '#f3e6bf'; ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 0.3;
    ctx.beginPath(); ctx.ellipse(0, 0, 2.4, 1.3, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    const rp = (t * 1.5) % 1, rr = lerp(3, 11, 1 - (1 - rp) * (1 - rp));
    ctx.save(); ctx.globalAlpha = 1 - rp; ctx.setLineDash([1.6, 1.2]); ctx.lineCap = 'round'; ctx.strokeStyle = '#f3e6bf'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(X0 + 385, 183, rr, rr * 0.7, 0, 0, TAU); ctx.stroke(); ctx.restore();
    drawKnot(ctx, 'w', X0 + 385, 180, 0.9);
    // screen: warm brown vignette, then a stitched hoop clock label in Grandstander
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const vg = ctx.createRadialGradient(w / 2, h * 0.51, h * 0.33, w / 2, h / 2, h * 1.11);
    vg.addColorStop(0, 'rgba(60,30,12,0)'); vg.addColorStop(0.7, 'rgba(60,30,12,0.10)'); vg.addColorStop(1, 'rgba(40,18,8,0.42)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.14, R = h * 0.068;
    ctx.fillStyle = '#d39c60'; ctx.strokeStyle = '#6b4221'; ctx.lineWidth = h * 0.004; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#efe3c4'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.82, 0, TAU); ctx.fill();
    ctx.setLineDash([h * 0.006, h * 0.005]); ctx.strokeStyle = 'rgba(124,29,36,.5)'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.74, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `900 ${Math.round(h * 0.039)}px Grandstander, 'Comic Sans MS', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(90,30,15,0.25)'; ctx.fillText('22:09', cx, cy + h * 0.003); ctx.fillStyle = '#a3302a'; ctx.fillText('22:09', cx, cy);
  }

  const Starter = { id: 'crossstitch', name: 'Cross-Stitch Sampler', palette: PALETTE, fonts: ['Grandstander:wght@600;700;800;900', 'Mali:wght@500;600;700'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['crossstitch'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
