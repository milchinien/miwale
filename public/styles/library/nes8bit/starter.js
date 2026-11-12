/* 8-Bit Arcade — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   NES rules: only 2C02 palette colours, max 3 colours + black outline per sprite part, flat fills,
   no anti-aliasing, no gradients, no alpha in the world (checker = transparency, flicker = blink).
   Figures are posed from parts and animate in held frames: 8-frame walk, 4-frame squash & stretch hop. */
(function (root) {
  'use strict';
  const PALETTE = {
    k: '#000000', w: '#FCFCFC', g1: '#BCBCBC', g2: '#7C7C7C',
    gr0: '#005800', gr1: '#00A800', gr2: '#58D854',
    br0: '#503000', ochre: '#AC7C00', sand: '#F0D0B0', cream: '#FCE0A8',
    red0: '#881400', crim: '#A80020', red: '#F83800', orange: '#E45C10', lorange: '#FCA044',
    gold: '#F8B800', yellow: '#F8D878', navy: '#0000BC', blue: '#0058F8', blue2: '#0078F8', cyan: '#3CBCFC', ice: '#A4E4FC',
    purple: '#940084', magenta: '#D800CC', pink: '#F878F8', violet: '#6844FC',
  };
  const P = PALETTE;
  const PS = 1.5;                       // world units per art pixel (360 units tall view = 240 art rows)
  const FONT = "'Press Start 2P', monospace";

  // ---------- tiny helpers (hash, seeded rng, value noise, canvas) ----------
  const hashInt = (x, y, s) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0;
  };
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function vnoise(x, y, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), h = (i, j) => hashInt(x0 + i, y0 + j, s) / 4294967296;
    const a = h(0, 0) + (h(1, 0) - h(0, 0)) * u, b = h(0, 1) + (h(1, 1) - h(0, 1)) * u;
    return a + (b - a) * v;
  }
  const fbm = (x, y, s) => (vnoise(x, y, s) * 4 + vnoise(x * 2, y * 2, s + 101) * 2 + vnoise(x * 4, y * 4, s + 202)) / 7;
  const sat = (v) => Math.max(0, Math.min(1, v));
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return { c, ctx: c.getContext('2d') }; }
  const rgbOf = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function flipX(src) { const { c, ctx } = canvas(src.width, src.height); ctx.translate(src.width, 0); ctx.scale(-1, 1); ctx.drawImage(src, 0, 0); return c; }
  const pair = (c) => ({ r: c, l: flipX(c) });

  /** Sprite builder (ported 1:1): rows of chars + char→colour map → canvas with automatic 1-px black outline.
      opt.outline=false, opt.diag (8-neighbour outline), opt.tailFrom/parity (checker rows, no outline), opt.checker 0|1. */
  function mk(rows, map, opt) {
    opt = opt || {};
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const o = opt.outline === false ? 0 : 1, W = w + 2 * o, H = h + 2 * o;
    const cell = new Array(W * H).fill(null), src = new Uint8Array(W * H);
    const tailFrom = opt.tailFrom === undefined ? 1e9 : opt.tailFrom, par = opt.parity || 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
      const c = map[rows[y][x]]; if (!c) continue;
      const i = (y + o) * W + x + o;
      if (y >= tailFrom) { if (((x + y + par) & 1) === 0) cell[i] = c; src[i] = 2; } else { cell[i] = c; src[i] = 1; }
    }
    if (o) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (src[i]) continue;
      let n = (x > 0 && src[i - 1] === 1) || (x < W - 1 && src[i + 1] === 1) || (y > 0 && src[i - W] === 1) || (y < H - 1 && src[i + W] === 1);
      if (!n && opt.diag) n = (x > 0 && y > 0 && src[i - W - 1] === 1) || (x < W - 1 && y > 0 && src[i - W + 1] === 1) || (x > 0 && y < H - 1 && src[i + W - 1] === 1) || (x < W - 1 && y < H - 1 && src[i + W + 1] === 1);
      if (n) cell[i] = P.k;
    }
    if (opt.checker !== undefined) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x + y) & 1) !== opt.checker) cell[y * W + x] = null;
    const { c, ctx } = canvas(W, H), img = ctx.createImageData(W, H), d = img.data;
    for (let i = 0; i < W * H; i++) { if (!cell[i]) continue; const v = rgbOf(cell[i]); d[i * 4] = v[0]; d[i * 4 + 1] = v[1]; d[i * 4 + 2] = v[2]; d[i * 4 + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  // ---------- figures are posed from parts on a char grid, baked once per pose ----------
  function grid(w, h) {
    const a = []; for (let y = 0; y < h; y++) a.push(new Array(w).fill('.'));
    a.set = (x, y, ch) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) a[y][x] = ch; };
    a.rows = () => a.map((r) => r.join(''));
    return a;
  }
  // main character: legs table [x0, x1, row] (far leg black, near leg navy + brown boot), arm/hand tables, scarf shapes
  const LEGS = {
    stand: { far: [[5, 6, 0], [5, 6, 1], [5, 7, 2]], near: [[8, 9, 0], [8, 9, 1], [8, 10, 2, 'r']] }, cA: { far: [[5, 6, 0], [4, 5, 1], [3, 4, 2]], near: [[8, 9, 0], [9, 10, 1], [10, 12, 2, 'r']] },
    pA: { far: [[5, 6, 0], [6, 8, 1]], near: [[7, 8, 0], [7, 8, 1], [7, 9, 2, 'r']] }, uA: { far: [[6, 7, 0], [8, 10, 1]], near: [[7, 8, 0], [7, 8, 1], [6, 8, 2, 'r']] },
    cB: { far: [[7, 8, 0], [8, 9, 1], [9, 11, 2]], near: [[6, 7, 0], [5, 6, 1], [4, 5, 2, 'r']] }, pB: { far: [[6, 7, 0], [6, 7, 1], [6, 8, 2]], near: [[8, 9, 0], [9, 11, 1, 'r']] },
    uB: { far: [[6, 7, 0], [6, 7, 1], [5, 7, 2]], near: [[8, 9, 0], [10, 12, 1, 'r']] },
  };
  const ARM_N = { n: [[7, 1], [7, 2]], f: [[8, 1], [9, 2]], b: [[6, 1], [5, 2], [4, 2]] }, HAND_N = { n: [7, 3], f: [10, 3], b: [3, 3] };
  const ARM_F = { f: [[10, 1]], b: [[3, 1], [3, 2]] }, HAND_F = { f: [11, 2], b: [2, 3] };
  const SCARF = { hang: [[3, 0], [3, 1], [2, 2], [2, 3, 'G']], w0: [[3, 0], [2, 0], [1, 1], [0, 1, 'G']], w1: [[3, 0], [2, 1], [1, 1], [0, 2, 'G']] };
  const WALK = [['cA', 0, 'b', 'f'], ['cA', 1, 'b', 'f'], ['pA', 0, 'n', 'h'], ['uA', -1, 'n', 'h'], ['cB', 0, 'f', 'b'], ['cB', 1, 'f', 'b'], ['pB', 0, 'n', 'h'], ['uB', -1, 'n', 'h']]
    .map(([legs, bob, na, fa]) => ({ legs, bob, na, fa }));
  WALK.forEach((w, i) => { w.hb = WALK[(i + 7) & 7].bob - w.bob; w.sc = (((i + 1) >> 1) & 1) ? 'w1' : 'w0'; w.leaf = w.hb > 0 ? 1 : 0; w.face = 'n'; });
  const HERO_PAL = { o: P.orange, h: P.lorange, d: P.red0, y: P.yellow, g: P.gr1, G: P.gr0, l: P.gr2, b: P.blue2, n: P.navy, c: P.cream, r: P.br0, k: P.k };
  function heroRows(o) {
    const HF = 17, T = HF - 5 + o.bob, g = grid(16, 20);
    if (ARM_F[o.fa]) { for (const [x, y] of ARM_F[o.fa]) g.set(x, T + y, 'k'); g.set(HAND_F[o.fa][0], T + HAND_F[o.fa][1], 'c'); }
    const L = LEGS[o.legs];
    for (const [leg, ch] of [[L.far, 'k'], [L.near, 'n']]) {
      for (const s of leg) for (let x = s[0]; x <= s[1]; x++) g.set(x, HF + s[2], s[3] || ch);
      if (o.bob < 0) for (let x = leg[0][0]; x <= leg[0][1]; x++) g.set(x, HF - 1, ch);      // hip row on "up" frames
    }
    for (const q of SCARF[o.sc]) g.set(q[0], T + q[1], q[2] || 'g');
    for (let y = 0; y < 5; y++) for (let x = 4; x <= 9; x++) {
      if (y === 4 && (x === 4 || x === 9)) continue;
      g.set(x, T + y, y === 0 ? (x === 9 ? 'G' : 'g') : y === 3 ? (x === 7 ? 'c' : 'r') : y === 4 ? 'n' : 'b');
    }
    if (ARM_N[o.na]) { for (const [x, y] of ARM_N[o.na]) g.set(x, T + y, 'n'); g.set(HAND_N[o.na][0], T + HAND_N[o.na][1], 'c'); }
    const Ht = T - 8 + o.hb, X = 2;                                                             // head lands one frame late
    for (let y = 0; y < 9; y++) for (let x = 0; x < 12; x++) {
      const nx = (x + 0.5 - 6) / 6, ny = (y + 0.5 - 4.5) / 4.5;
      if (nx * nx + ny * ny <= 1.06) g.set(x + X, Ht + y, ny > 0.62 || ((x === 3 || x === 8) && (y <= 1 || y >= 6)) ? 'd' : 'o');
    }
    g.set(X + 3, Ht + 1, 'h'); g.set(X + 4, Ht + 1, 'h'); g.set(X + 2, Ht + 2, 'h');
    for (const cx of [5, 9]) {
      if (o.face === 'blink') { for (let k = -1; k <= 1; k++) g.set(X + cx + k, Ht + 4, 'd'); continue; }
      g.set(X + cx, Ht + 3, 'y'); for (let k = -1; k <= 1; k++) g.set(X + cx + k, Ht + 4, 'y');
    }
    for (let x = 4; x <= 10; x++) if (x !== 7) g.set(X + x, Ht + 6, 'y');
    for (let x = 6; x <= 8; x++) g.set(X + x, Ht + 7, 'y');
    g.set(X + 6, Ht - 1, 'G'); g.set(X + 5, Ht - 2, 'g');
    const ly = o.leaf ? Ht - 2 : Ht - 1; g.set(X + 7, ly, 'l'); g.set(X + 8, ly, 'l');
    return g.rows();
  }
  // small creature: a bulb ellipse per hop frame (squash → push → stretch → fall) with a lagging leaf crown
  const HOP = [{ w: 6.3, h: 8, b: 15, legs: 0, sp: 2 }, { w: 5.3, h: 9, b: 15, legs: 1, sp: 1 }, { w: 4.7, h: 10, b: 13, legs: 2, sp: 2 }, { w: 5.3, h: 9, b: 14, legs: 3, sp: 0 }];
  const CROWN = [
    [[[0, -1, 'G'], [0, -2], [0, -3], [0, -4], [-1, -1], [-1, -2], [-2, -3], [1, -1], [1, -2], [2, -3]],
      [[0, -1, 'G'], [0, -2], [0, -3], [1, -4], [-1, -1], [-2, -2], [-3, -3], [1, -1], [2, -2], [3, -2]],
      [[0, -1, 'G'], [0, -2], [1, -3], [-1, -1], [-2, -1], [-3, -2], [-4, -2], [1, -1], [2, -1], [3, -1], [4, -2]]],
    [[[0, -1, 'G'], [-1, -2], [-1, -3], [-2, -4], [1, -2], [1, -3], [2, -4], [2, -3, 'G']],
      [[0, -1, 'G'], [-1, -2], [-2, -3], [-3, -3], [1, -2], [2, -3], [3, -4], [3, -3, 'G']],
      [[0, -1, 'G'], [-1, -1], [-2, -2], [-3, -2], [-4, -1], [1, -1], [2, -2], [3, -2], [4, -1, 'G']]],
  ];
  const CREEP_LEGS = [[[4, 1], [3, 2], [11, 1], [12, 2]], [[5, 1], [5, 2], [10, 1], [10, 2]], [[6, 1], [9, 1], [7, 2]], [[5, 1], [4, 2], [10, 1], [11, 2]]];
  function creeperRows(f, kind) {
    const g = grid(15, 18), H = HOP[f], w = H.w - kind * 0.6, h = H.h + kind, top = H.b - h + 1, cy = top + h / 2;
    for (let y = top; y <= H.b; y++) for (let x = 0; x < 15; x++) {
      const nx = (x + 0.5 - 7.5) / w, ny = (y + 0.5 - cy) / (h / 2);
      if (nx * nx + ny * ny > 1.02) continue;
      let ch = ny < -0.04 ? 'P' : ny < 0.14 ? (((x + y) & 1) ? 'P' : 'c') : 'c';           // one checker row between the bands
      if (nx > -0.7 && nx < -0.15 && ny > -0.85 && ny < -0.45) ch = 'p';
      g.set(x, y, ch);
    }
    const ey = top + Math.round(h * 0.36), my = top + Math.round(h * 0.68);
    for (const ex of [5, 9]) { g.set(ex, ey, 'k'); g.set(ex + 1, ey, 'w'); g.set(ex, ey + 1, 'k'); g.set(ex + 1, ey + 1, 'k'); }
    for (const [x, y] of [[4, -1], [5, -1], [10, -1], [11, -1]]) g.set(x, ey + y, 'k');
    for (let x = 5; x <= 10; x++) g.set(x, my, x === 6 || x === 9 ? 'w' : 'k');
    for (let x = 6; x <= 9; x++) g.set(x, my + 1, 'k');
    for (const q of CROWN[kind][H.sp]) g.set(7 + q[0], top + q[1] + 1, q[2] || 'g');
    for (const [x, y] of CREEP_LEGS[H.legs]) g.set(x, H.b + y, 'c');
    return g.rows();
  }
  const CREEP_PAL = [{ P: P.purple, p: P.pink, c: P.cream, w: P.w, g: P.gr1, G: P.gr0, k: P.k }, { P: P.crim, p: P.red, c: P.cream, w: P.w, g: P.gr1, G: P.gr0, k: P.k }];
  // ghost: row widths for a hood, a body and a waving tail (checker from row 11, no outline there)
  function ghostRows(f) {
    const g = grid(16, 19);
    for (let y = 0; y < 19; y++) {
      let hw, off = 0;
      if (y <= 5) { const ny = (5.5 - y) / 5.8; hw = 5.6 * Math.sqrt(Math.max(0, 1 - ny * ny)); }
      else if (y < 11) hw = 5.6 - (y - 6) * 0.15;
      else { const k = (y - 11) / 8; hw = 4.8 * (1 - k) + 0.6; off = Math.round(Math.sin(f * Math.PI / 2 + y * 0.8) * 1.3 - k * 3); }
      for (let x = 0; x < 16; x++) {
        const dx = x + 0.5 - 7.5 - off;
        if (Math.abs(dx) > hw) continue;
        g.set(x, y, y >= 8 && y < 11 ? (dx < -hw + 1.6 || y === 10 ? 'B' : 'W') : y >= 11 && Math.abs(dx) > hw - 1.4 ? 'B' : 'W');
      }
    }
    for (let y = 3; y <= 5; y++) for (const x of [8, 9, 11, 12]) g.set(x, y, 'k');
    g.set(9, 3, 'B'); g.set(12, 3, 'B'); g.set(10, 8, 'k'); g.set(11, 8, 'k');
    g.set(13, 7, 'W'); g.set(14, 8, 'W'); g.set(14, 9, 'B');
    return g.rows();
  }
  const LANTERN = ['....g....', '...ggg...', '..PPPPP..', '.PPPPPPP.', '.cPcPcPc.', '.cyycyyc.', '.ccccccc.', '.cyyyyyc.', '..ccccc..', '...ccc...'];
  const TOMBS = [['...LLLL...', '..LLLLLG..', '.LLLLLLLG.', '.LLLkLLLG.', '.LLkkkLLG.', '.LLLkLLLG.', '.LLLkLLLG.', '.LLLLLLLG.', '.LLLLLLLG.', 'GGGGGGGGGG'],
    ['..LLLL..', '.LLLLLG.', '.LLkLLG.', '.LkkkLG.', '.LLkLLG.', '.LLLLLG.', '.LLLLLG.', 'GGGGGGGG']];
  const HEART = ['.rr.rr..', 'rWrrrrr.', 'rrrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....'];
  const DIG = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'],
    5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'] };

  /** Procedural tree: overlapping canopy circles, lower-right outline arc, upper-left highlight, checker dither shade. */
  function makeTree(autumn, seed) {
    const W = 24, H = 28, g = [], r = rng(seed);
    for (let y = 0; y < H; y++) g.push(new Array(W).fill('.'));
    const blobs = [[12, 6, 5.5], [6.5, 9, 5], [17.5, 9, 5], [12, 11, 7], [8, 14.5, 5], [16, 14.5, 5], [12, 16, 5]];
    for (const b of blobs) { b[0] += (r() - 0.5) * 1.2; b[1] += r() - 0.5; }
    for (let y = 17; y < H; y++) { const fl = y >= H - 2 ? 1 : 0; for (let x = 10 - fl; x <= 13 + fl; x++) g[y][x] = x >= 13 ? 'k' : 't'; if (y === 20 || y === 24) g[y][12] = 'k'; }
    for (let y = 0; y < 21; y++) for (let x = 0; x < W; x++) {
      let own = -1;
      for (let k = 0; k < blobs.length; k++) if (Math.hypot(x + 0.5 - blobs[k][0], y + 0.5 - blobs[k][1]) <= blobs[k][2]) own = k;
      if (own < 0) continue;
      const [bx, by, br] = blobs[own], nx = (x + 0.5 - bx) / br, ny = (y + 0.5 - by) / br, dd = Math.hypot(nx, ny);
      let ch = dd > 0.72 && nx + ny > 0.45 ? 'k' : nx + ny < -0.55 && dd > 0.3 && dd < 0.9 ? 'L' : 'G';
      if (ch === 'G' && (x + 0.5 - 12) / 11 + (y + 0.5 - 10) / 10 > 0.55 && ((x + y) & 1) === 0) ch = 'k';
      g[y][x] = ch;
    }
    const map = autumn ? { G: P.ochre, L: P.yellow, k: P.k, t: P.red0 } : { G: P.gr1, L: P.gr2, k: P.k, t: P.red0 };
    return pair(mk(g.map((row) => row.join('')), map));
  }
  /** Burst: 4 procedural frames on the pixel grid (white core → gold → red rays → 8 flying bits). */
  function boomFrames(R) {
    const out = [], S = Math.ceil(18 * R) | 1, c = (S - 1) / 2;
    for (let f = 0; f < 4; f++) {
      const rows = [];
      for (let y = 0; y < S; y++) {
        let row = '';
        for (let x = 0; x < S; x++) {
          const dx = x - c, dy = y - c, dd = Math.hypot(dx, dy), an = Math.atan2(dy, dx);
          const sec = Math.abs(((an / (Math.PI / 4)) % 1 + 1) % 1 - 0.5);
          let ch = '.';
          if (f === 0) { if (dd < 2.2 * R) ch = 'W'; else if ((Math.abs(dx) < 0.6 * R + 0.1 || Math.abs(dy) < 0.6 * R + 0.1) && dd < 4.2 * R) ch = 'y'; }
          else if (f === 1) { if (dd < 2.6 * R) ch = 'W'; else if (dd < 4.4 * R) ch = 'y'; else if (sec > 0.44 && dd < 7 * R) ch = 'r'; }
          else if (f === 2) {
            const s8 = Math.floor((an + Math.PI) / (Math.PI / 4) + 0.5) & 1;
            if (dd > 4.6 * R && dd < 6.8 * R && s8 === 0) ch = 'r'; else if (dd > 4.4 * R && dd < 6 * R && s8 === 1 && ((x + y) & 1) === 0) ch = 'y'; else if (dd < 3 * R && ((x + y) & 1) === 0) ch = 'y';
          } else for (let k = 0; k < 8; k++) {
            const a = k * Math.PI / 4 + Math.PI / 8, bx = c + Math.cos(a) * 7.4 * R, by = c + Math.sin(a) * 7.4 * R;
            if (Math.abs(x - bx) < 0.9 * R + 0.2 && Math.abs(y - by) < 0.9 * R + 0.2) ch = k & 1 ? 'y' : 'r';
          }
          row += ch;
        }
        rows.push(row);
      }
      out.push(mk(rows, { W: P.w, y: P.gold, r: P.red }, { outline: false }));
    }
    return out;
  }
  /** Collectible gem: 4-frame spin (width shrinks to a sliver), white facet, outlined. */
  function gemFrames(big) {
    const half = big ? [0, 1, 2, 3, 3, 2, 1, 0] : [0, 1, 2, 2, 1, 0], fh = big ? [3, 2, 0, 2] : [2, 1, 0, 1];
    const map = big ? { W: P.w, c: P.gold, d: P.orange } : { W: P.w, c: P.cyan, d: P.blue }, out = [];
    for (let f = 0; f < 4; f++) {
      const W = big ? 7 : 5, c = (W - 1) / 2, rows = [];
      for (let r = 0; r < half.length; r++) {
        const hw = Math.min(half[r], fh[f]); let s = '';
        for (let x = 0; x < W; x++) {
          const dx = x - c; if (Math.abs(dx) > hw) { s += '.'; continue; }
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
  /** Drop shadow: checker-dithered black ellipse (w × w/3), two parities. */
  function shadow(w, par) {
    const h = Math.max(2, Math.round(w / 3)), rows = [];
    for (let y = 0; y < h; y++) { let s = ''; for (let x = 0; x < w; x++) { const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2); s += dx * dx + dy * dy <= 1 && ((x + y + par) & 1) === 0 ? 'k' : '.'; } rows.push(s); }
    return mk(rows, { k: P.k }, { outline: false });
  }
  /** Floating number: 3×5 bitmap digits, white (highlighted: gold, 2× size), 8-neighbour black outline. */
  function numSprite(v, crit) {
    const str = String(v), sc = crit ? 2 : 1, rows = [];
    for (let y = 0; y < 5; y++) {
      let row = '';
      for (let i = 0; i < str.length; i++) { for (let x = 0; x < 3; x++) row += (DIG[str[i]][y][x] === '1' ? '1' : '.').repeat(sc); if (i < str.length - 1) row += '.'.repeat(sc); }
      for (let k = 0; k < sc; k++) rows.push(row);
    }
    return mk(rows, { 1: crit ? P.gold : P.w }, { diag: true });
  }

  let SPR = null;
  function init() {
    SPR = {};
    SPR.walk = WALK.map((w) => pair(mk(heroRows(w), HERO_PAL)));
    SPR.idle = [0, 1].map((br) => [0, 1].map((bl) => pair(mk(heroRows({ legs: 'stand', bob: br, hb: 0, na: 'n', fa: 'h', sc: 'hang', face: bl ? 'blink' : 'n', leaf: br }), HERO_PAL))));
    SPR.creeper = [0, 1].map((k) => HOP.map((_, f) => pair(mk(creeperRows(f, k), CREEP_PAL[k]))));
    SPR.ghost = [0, 1, 2, 3].map((f) => [0, 1].map((p) => pair(mk(ghostRows(f), { W: P.w, B: P.cyan, k: P.k }, { tailFrom: 11, parity: p }))));
    SPR.lantern = [P.gold, P.w].map((y) => mk(LANTERN, { P: P.purple, c: P.cream, y, g: P.gr1 }));
    SPR.tree = [makeTree(false, 900), makeTree(false, 901), makeTree(true, 950)];
    SPR.tomb = TOMBS.map((r) => mk(r, { L: P.w, G: P.g1, k: P.k }));
    SPR.boom = boomFrames(1); SPR.gem = gemFrames(false); SPR.gemBig = gemFrames(true);
    SPR.seed = [P.cream, P.w].map((c) => mk(['cc', 'cc'], { c }));
    SPR.shadow = {}; for (const w of [8, 12, 20, 24]) SPR.shadow[w] = [shadow(w, 0), shadow(w, 1)];
    SPR.heart = mk(HEART, { r: P.red, W: P.w }, { outline: false }); SPR.heartE = mk(HEART, { r: P.red0, W: P.red0 }, { outline: false });
    SPR.num = numSprite(13, false); SPR.crit = numSprite(26, true);
  }

  // ---------- ground: material map on a 2×2 block grid + tile-language edge rules + stamped decals ----------
  const GR = 0, FO = 1, RD = 2, WA = 3, PL = 4;
  let ground = null;
  function bakeGround(W, H) {
    const { c, ctx } = canvas(W, H), M = 2, EW = W + 2 * M, EH = H + 2 * M, mat = new Uint8Array(EW * EH);
    const rhw = 11 / PS;                                       // road half width 11 world units
    const roadA = (x, y) => Math.abs(x - (W * 0.47 - (y - H * 0.55) * 0.85 + 9 * Math.sin(y / 31))) / 1.31;
    const roadB = (x, y) => Math.abs(x - (W * 0.5 + y * 0.62 + 8 * Math.sin(y / 27 + 1))) / 1.18;
    const plaza = { x0: Math.round(W * 0.76), y0: 48, x1: Math.round(W * 0.76) + 92, y1: 48 + 60, cut: 6 };
    const inPlaza = (x, y) => x >= plaza.x0 && x < plaza.x1 && y >= plaza.y0 && y < plaza.y1 && Math.min(x - plaza.x0, plaza.x1 - 1 - x) + Math.min(y - plaza.y0, plaza.y1 - 1 - y) >= plaza.cut;
    for (let py = 0; py < EH; py += 2) for (let px = 0; px < EW; px += 2) {
      const x = px - M + 1, y = py - M + 1;                    // 2×2 block centre (chunky NES edges)
      let m;
      const pond = Math.hypot((x - W * 0.9) / 46, (y - H * 0.86) / 26) + (fbm(x / 30, y / 30, 977) - 0.5) * 0.8;
      if (inPlaza(x, y)) m = PL;
      else if (pond < 1) m = WA;
      else if (Math.min(roadA(x, y), y < H * 0.15 ? 99 : roadB(x, y)) < rhw) m = RD;
      else if (fbm(x / 120, y / 120, 811) + 0.22 * sat((W * 0.3 - x) / 50) * sat((y - H * 0.4) / 50) + 0.16 * sat((x - W * 0.6) / 30) * sat((y - H * 0.55) / 30) > 0.64) m = FO;
      else m = GR;
      mat[py * EW + px] = mat[py * EW + px + 1] = mat[(py + 1) * EW + px] = mat[(py + 1) * EW + px + 1] = m;
    }
    const C = {}; for (const k of ['k', 'gr0', 'gr1', 'br0', 'ochre', 'sand', 'g2', 'g1', 'navy', 'blue', 'red0', 'w', 'gold']) C[k] = rgbOf(P[k]);
    const img = ctx.createImageData(W, H), d = img.data, edge = new Uint8Array(W * H);
    const brick = (gx, gy) => {                                // 12×6 running-bond brick tile
      const row = Math.floor(gy / 6), ly = gy - row * 6, s = gx + ((row & 1) ? 6 : 0), lx = s - Math.floor(s / 12) * 12;
      if (ly === 5 || (lx === 11 && ly > 0)) return C.k;
      if ((ly === 0 && lx < 5) || (lx === 0 && ly < 3)) return C.g1;
      return C.g2;
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y + M) * EW + x + M, m = mat[i], n = [mat[i - 1], mat[i + 1], mat[i - EW], mat[i + EW]], diff = n.some((q) => q !== m);
      const far = mat[i - 2] !== m || mat[i + 2] !== m || mat[i - 2 * EW] !== m || mat[i + 2 * EW] !== m;
      let col, e = 1;
      if (m === PL) col = diff ? C.k : far ? C.g1 : (e = 0, brick(x, y));
      else if (m === WA) col = diff ? C.k : far ? C.blue : (e = 0, C.navy);
      else if (m === GR) col = diff && n.some((q) => q !== GR) ? C.gr1 : (e = 0, C.gr0);           // light-green lip
      else if (m === FO) col = n.includes(GR) ? C.k : diff ? C.ochre : (e = 0, C.br0);            // black cliff vs grass
      else col = n.includes(WA) ? C.sand : n.includes(GR) || n.includes(FO) ? C.br0 : (e = 0, C.ochre);
      const o = (y * W + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; edge[y * W + x] = e;
    }
    // decal glyphs: [dx, dy, colour] triplets, stamped one per hashed grid cell, never on edge pixels
    const G = (rows, map) => { const o = []; rows.forEach((r, y) => [...r].forEach((ch, x) => { if (map[ch]) o.push(x, y, map[ch]); })); return o; };
    const a = { a: C.gr1 }, l = { r: C.red0, o: C.ochre, k: C.k }, pb = { d: C.br0, l: C.sand };
    const tuft = [G(['a.a', '.a.'], a), G(['a.a.a', '.a.a.'], a), G(['a...a', '.a.a.'], a), G(['.a.', 'a.a'], a)];
    const tall = [G(['a.a.a', 'a.a.a', '.a.a.'], a), G(['..a..', 'a.a.a', '.a.a.'], a)];
    const fb = { w: C.w, y: C.gold, r: rgbOf(P.red), s: C.gr1 };
    const bed = [G(['.w...', 'wyw.w', '.w.wyw', '.s..w.', '..s.s.'], fb), G(['..y..y.', '.yry.yry', '..y..y.', 'w..s..s.'], fb), G(['w.w..', '.y...', 'w.w.y', '..s.yry', '....y..'], fb)];
    const leaf = [G(['r'], l), G(['o'], l), G(['ro'], l), G(['.o', 'r.'], l), G(['rr', '.r'], l), G(['o.', '.o'], l), G(['r.r'], l)];
    const twig = [G(['k..', '.kk'], l), G(['..k', 'kk.'], l)];
    const pebble = [G(['d'], pb), G(['dd'], pb), G(['l', 'd'], pb), G(['d.d'], pb), G(['.l', 'dd'], pb)];
    function stamps(cell, seed, target, pick) {
      for (let cy = 0; cy * cell < H; cy++) for (let cx = 0; cx * cell < W; cx++) {
        const h = hashInt(cx, cy, seed), ax = cx * cell + (h & 255) % cell, ay = cy * cell + ((h >>> 8) & 255) % cell;
        if (ax >= W || ay >= H || mat[(ay + M) * EW + ax + M] !== target) continue;
        const gph = pick(ax, ay, ((h >>> 16) & 65535) / 65536, h); if (!gph) continue;
        for (let k = 0; k < gph.length; k += 3) {
          const X = ax + gph[k], Y = ay + gph[k + 1];
          if (X >= W || Y >= H || mat[(Y + M) * EW + X + M] !== target || edge[Y * W + X]) continue;
          const o = (Y * W + X) * 4; d[o] = gph[k + 2][0]; d[o + 1] = gph[k + 2][1]; d[o + 2] = gph[k + 2][2];
        }
      }
    }
    const near = (x, y, dd, own) => [[dd, 0], [-dd, 0], [0, dd], [0, -dd]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < W && Y < H && mat[(Y + M) * EW + X + M] !== own; });
    // tufts gather along every edge and in a few tall-grass patches; the open meadow stays calm
    stamps(6, 5101, GR, (x, y, r, h) => {
      if (near(x, y, 5, GR)) return r < 0.7 ? (r < 0.3 ? tall[(h >>> 4) & 1] : tuft[(h >>> 4) & 3]) : null;
      const cl = fbm(x / 100, y / 100, 515);
      return cl > 0.66 ? (r < 0.8 ? tall[(h >>> 4) & 1] : null) : cl > 0.58 ? (r < 0.45 ? tuft[(h >>> 4) & 3] : null) : r < 0.018 ? tuft[(h >>> 4) & 3] : null;
    });
    stamps(23, 5203, GR, (x, y, r, h) => (!near(x, y, 7, GR) && fbm(x / 130 + 9, y / 130, 616) > 0.55 && r < 0.6 ? bed[(h >>> 4) % 3] : null));
    stamps(5, 5301, FO, (x, y, r, h) => (r < (fbm(x / 70 - 3, y / 70, 717) > 0.56 ? 0.6 : 0.05) ? leaf[(h >>> 4) % leaf.length] : null));
    stamps(17, 5303, FO, (x, y, r, h) => (r < 0.3 ? twig[(h >>> 4) & 1] : null));
    stamps(6, 5401, RD, (x, y, r, h) => (near(x, y, 3, RD) && r < 0.55 ? pebble[(h >>> 4) % pebble.length] : null));
    ctx.putImageData(img, 0, 0);
    const waves = [];                                          // anchors for the 2-frame water animation
    for (let cy = 0; cy * 7 < H; cy++) for (let cx = 0; cx * 11 < W; cx++) {
      const h = hashInt(cx, cy, 5501); if ((h & 7) > 4) continue;
      const ax = cx * 11 + ((h >>> 3) & 7), ay = cy * 7 + ((h >>> 6) & 3);
      if ([[-2, -2], [7, -2], [-2, 4], [7, 4]].every(([dx, dy]) => ax + dx >= 0 && ay + dy >= 0 && ax + dx < W && ay + dy < H && mat[(ay + dy + M) * EW + ax + dx + M] === WA)) waves.push([ax, ay, (h >>> 9) & 7]);
    }
    return { c, W, H, waves, plaza, mat, M, EW };
  }

  // ---------- blitting: every sprite lands on whole art pixels ----------
  const blit = (ctx, img, x, y, ax, ay) => ctx.drawImage(img, Math.round(x) - ax, Math.round(y) - ay);
  const feet = (ctx, img, x, y, lift) => blit(ctx, img, x, y, img.width >> 1, img.height - 1 + (lift || 0));
  const mid = (ctx, img, x, y) => blit(ctx, img, x, y, img.width >> 1, img.height >> 1);
  const shadowAt = (ctx, w, x, y) => { const s = SPR.shadow[w][(Math.round(x) + Math.round(y)) & 1]; ctx.drawImage(s, Math.round(x) - (s.width >> 1), Math.round(y) - (s.height >> 1)); };

  /** Draws the main character (pumpkin head, green scarf, blue tunic) with feet at (x, y) in art pixels. 8-frame walk at ~12 fps,
      idle breathing with a blink every 3.4 s. t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing, moving) {
    if (!SPR) init();
    const fl = facing < 0 ? 'l' : 'r';
    if (moving === false) { feet(ctx, SPR.idle[Math.floor(t / 1.1) & 1][(t % 3.4) < 0.13 ? 1 : 0][fl], x, y); return; }
    feet(ctx, SPR.walk[Math.floor(t * 12) & 7][fl], x, y);
  }
  /** Draws a typical creature with feet at (x, y): kind 'creeper' (purple beet), 'creeper2' (crimson radish) or 'ghost'. id = phase offset. */
  function drawEnemy(ctx, x, y, t, kind, facing, id) {
    if (!SPR) init();
    const fl = (facing || 1) < 0 ? 'l' : 'r', ph = (id || 0) * 0.37;
    if (kind === 'ghost') {
      const lift = 3 + [0, 0, 1, 2, 3, 3, 2, 1][Math.floor((t + ph) * 5) & 7];               // eased float, holds top and bottom
      feet(ctx, SPR.ghost[Math.floor((t + ph) * 7) & 3][(Math.floor(t * 30) + (id || 0)) & 1][fl], x, y, lift);
    } else feet(ctx, SPR.creeper[kind === 'creeper2' ? 1 : 0][Math.floor((t + ph) * 8) & 3][fl], x, y);
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds). */
  let buf = null;
  function draw(ctx, w, h, t) {
    if (!SPR) init();
    const up = Math.max(1, Math.round(h / (360 / PS))), W = Math.ceil(w / up), H = Math.ceil(h / up);
    if (!buf || buf.c.width !== W || buf.c.height !== H) { buf = canvas(W, H); ground = bakeGround(W, H); }
    const b = buf.ctx;
    b.setTransform(1, 0, 0, 1, 0, 0); b.imageSmoothingEnabled = false; b.globalAlpha = 1;
    b.drawImage(ground.c, 0, 0);
    const ph = Math.floor(t * 2.2);                            // water: two-frame wave tiles
    for (const [x, y, v] of ground.waves) {
      b.fillStyle = v === 0 ? P.cyan : P.blue;
      if (((ph + v) & 1) === 0) { b.fillRect(x + 1, y, 2, 1); b.fillRect(x, y + 1, 1, 1); b.fillRect(x + 3, y + 1, 2, 1); }
      else { b.fillRect(x + 2, y, 2, 1); b.fillRect(x, y + 1, 2, 1); b.fillRect(x + 4, y + 1, 1, 1); }
    }
    // scene figures in art-pixel space
    const cx = W * 0.5, cy = H * 0.56, list = [];
    const hx = cx + Math.sin(t * 0.6) * 6, hy = cy + Math.cos(t * 0.6) * 2;
    list.push({ x: hx, y: hy, sh: 12, f: () => drawHero(b, hx, hy, t, Math.cos(t * 0.6) > 0 ? 1 : -1) });
    const P2 = ground.plaza;
    for (let k = 0; k < 6; k++) { const tx = P2.x0 + 12 + (k % 3) * 28, ty = P2.y0 + 22 + Math.floor(k / 3) * 26; if (k !== 1) list.push({ y: ty, f: () => feet(b, SPR.tomb[k & 1], tx, ty) }); }
    for (const [tx, ty, i] of [[W * 0.12, H * 0.42, 0], [W * 0.24, H * 0.78, 1], [W * 0.66, H * 0.93, 2], [W * 0.34, H * 0.3, 0], [W * 0.06, H * 0.96, 2]]) list.push({ x: tx, y: ty, sh: 20, f: () => feet(b, SPR.tree[i][tx > cx ? 'l' : 'r'], tx, ty) });
    const foes = [['creeper', -70, 20], ['creeper2', 64, -40], ['creeper', 92, 44], ['ghost', -40, -46], ['ghost', 30, 58], ['creeper2', -120, 70], ['ghost', -150, -20], ['creeper', 140, 6]];
    foes.forEach(([kind, dx, dy], i) => {
      const ex = cx + dx + Math.sin(t * 0.9 + i) * 3, ey = cy + dy + Math.cos(t * 0.7 + i) * 2;
      list.push({ x: ex, y: ey, sh: kind === 'ghost' ? 8 : 12, f: () => drawEnemy(b, ex, ey, t, kind, dx < 0 ? 1 : -1, i) });
    });
    for (const o of list) if (o.sh) shadowAt(b, o.sh, o.x, o.y);   // all shadows first, then y-sorted sprites
    list.sort((p, q) => p.y - q.y);
    for (const o of list) o.f();
    // collectibles (spin sequence 0,0,0,1,2,3; 1-px bob)
    const GSEQ = [0, 0, 0, 1, 2, 3];
    [[-30, 34, 0], [44, 30, 1], [-90, -10, 0], [104, -60, 0], [16, -70, 1]].forEach(([dx, dy, big], i) => {
      const set = big ? SPR.gemBig : SPR.gem, img = set[GSEQ[Math.floor(t * 9 + i * 2) % 6]];
      blit(b, img, cx + dx, cy + dy, img.width >> 1, img.height - 1 + (Math.floor(t * 2.5 + i) & 1));
    });
    // two lanterns orbiting the main character (blink between gold and white glass)
    for (let k = 0; k < 2; k++) { const a = t * 2.4 + k * Math.PI; mid(b, SPR.lantern[Math.floor(t * 4 + k) & 1], hx + Math.cos(a) * 26, hy - 12 + Math.sin(a) * 14); }
    // seed projectile flying toward a root creature, with a dotted 2-pixel trail
    const sp = (t * 1.3) % 1, px = hx + (cx + 64 - hx) * sp, py = hy - 12 + (cy - 50 - hy + 12) * sp, vx = 64, vy = -38, vl = Math.hypot(vx, vy);
    blit(b, SPR.seed[Math.floor(t * 30) & 1], px, py, 2, 2);
    b.fillStyle = Math.floor(t * 30) & 1 ? P.gold : P.cream; b.fillRect(Math.round(px - vx / vl * 4), Math.round(py - vy / vl * 4), 1, 1);
    b.fillStyle = P.orange; b.fillRect(Math.round(px - vx / vl * 7), Math.round(py - vy / vl * 7), 1, 1);
    // looping burst + floating numbers
    mid(b, SPR.boom[Math.floor(t * 6) % 4], cx - 108, cy - 52);
    mid(b, SPR.crit, cx - 108, cy - 70 - (t * 8) % 6);
    mid(b, SPR.num, cx + 92, cy + 20 - (t * 10) % 8);
    // NES status bar: black strip, 8-px font, red labels, heart row, blue segmented progress bar
    const bar = 42;
    b.fillStyle = P.k; b.fillRect(0, 0, W, bar);
    b.textBaseline = 'top'; b.font = '8px ' + FONT;
    b.fillStyle = P.red; b.fillText('-LIFE-', 8, 3); b.fillText('PW', 8, 31);
    for (let k = 0; k < 10; k++) b.drawImage(k < 8 ? SPR.heart : SPR.heartE, 8 + k * 8, 12);
    b.fillStyle = P.w; b.fillText('80/100', 96, 12);
    b.font = '16px ' + FONT; const clock = '22:09'; b.fillText(clock, Math.round(W / 2 - 40), 2);
    b.font = '8px ' + FONT; b.fillStyle = P.red; b.fillText('TITLE TEXT', Math.round(W / 2 - 44), 17);
    b.fillStyle = P.w; b.fillText('x 106', W - 50, 8); b.fillText('NO 4', W - 40, 31);
    b.drawImage(SPR.creeper[0][1].r, W - 70, -2);
    const bx0 = 28, bx1 = W - 52; b.fillStyle = P.w; b.fillRect(bx0 - 1, 30, bx1 - bx0 + 2, 10); b.fillStyle = P.k; b.fillRect(bx0, 31, bx1 - bx0, 8);
    for (let x = bx0 + 1; x < bx0 + (bx1 - bx0) * 0.72; x += 4) { b.fillStyle = P.cyan; b.fillRect(x, 32, 2, 6); b.fillStyle = P.blue; b.fillRect(x + 2, 32, 1, 6); }
    // upscale with nearest neighbour
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = P.k; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(buf.c, 0, 0, W * up, H * up);
    if (up >= 3) { ctx.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = up - 1; y < h; y += up) ctx.fillRect(0, y, w, 1); }   // faint CRT scanlines
  }

  const Starter = { id: 'nes8bit', name: '8-Bit Arcade', palette: PALETTE, fonts: ['Press Start 2P'], drawHero, drawEnemy, draw, mk };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['nes8bit'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
