/* Terminal ASCII — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Rules: one fixed character grid (cell = 6 × 10 world units, 360 units = screen height); every glyph comes
   from an atlas baked once per cell size; ground = dim glyph cells; figures = multi-glyph sprites on opaque
   cell plates with a baked phosphor glow; CRT = scanlines + flicker + barrel vignette with rounded corners. */
(function (root) {
  'use strict';
  const PALETTE = {
    bg: '#020a05', plate: '#010502',
    g0: '#0a2613', g1: '#113d20', g2: '#1a6331', g3: '#2a994b', g4: '#4ddb76', g5: '#a3ffbd', g6: '#e6fff0',
    a0: '#3d2405', a1: '#7a4a0e', a2: '#c97f19', a3: '#ffb238', a4: '#ffd98e', a5: '#fff3da',
    c1: '#0f5c62', c2: '#1fb0b9', c3: '#5cefff', c4: '#ccfbff',
    r1: '#86131f', r2: '#ff4257', r3: '#ff8a96',
    wbg: '#031a1e', wbg2: '#042229', fbg: '#04170c', rbg: '#071f0f', dbg: '#0e0d05',
  };
  const P = PALETTE;
  const CW = 6, CH = 10;                                   // character cell in world units
  const STACK = '"VT323", "Share Tech Mono", Consolas, monospace';

  // ---------- tiny helpers ----------
  const hashInt = (x, y, s) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return h >>> 0;
  };
  const hf = (x, y, s) => hashInt(x, y, s) / 4294967296;
  function vnoise(x, y, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), h = (i, j) => hf(x0 + i, y0 + j, s);
    const a = h(0, 0) + (h(1, 0) - h(0, 0)) * u, b = h(0, 1) + (h(1, 1) - h(0, 1)) * u;
    return a + (b - a) * v;
  }
  const fbm = (x, y, s) => (vnoise(x, y, s) * 4 + vnoise(x * 2, y * 2, s + 101) * 2 + vnoise(x * 4, y * 4, s + 202)) / 7;
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return { c, ctx: c.getContext('2d') }; }
  const R = Math.round;
  let fontOK = false;
  function checkFont() {
    if (fontOK || typeof document === 'undefined' || !document.fonts) return;
    document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === 'VT323' && f.status === 'loaded') fontOK = true; });
    if (fontOK) { atlas = null; sprites = {}; ground = null; } else if (document.fonts.load) document.fonts.load('20px "VT323"').catch(() => {});
  }

  // ---------- character ROM: block / shade / box glyphs and a few symbols drawn procedurally ----------
  const ROM = {
    '♣': ['..xxx..', '..xxx..', 'xx.x.xx', 'xxxxxxx', 'xx.x.xx', '...x...', '..xxx..'],
    '♠': ['...x...', '..xxx..', '.xxxxx.', 'xxxxxxx', 'xxxxxxx', '.x.x.x.', '...x...', '..xxx..'],
    '◆': ['...x...', '..xxx..', '.xxxxx.', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'],
    '≈': ['.xx....', 'x..x..x', '....xx.', '.......', '.xx....', 'x..x..x', '....xx.'],
    '▲': ['...x...', '..xxx..', '..xxx..', '.xxxxx.', '.xxxxx.', 'xxxxxxx'],
  };
  const rect = (g, x0, y0, x1, y1) => { const a = R(x0), b = R(y0); g.fillRect(a, b, Math.max(1, R(x1) - a), Math.max(1, R(y1) - b)); };
  function shade(g, lv, x, y, w, h) {   // ░ ▒ ▓ = 25 / 50 / 75 % dot lattices
    const d = Math.max(1, R(h / 12));
    for (let j = 0; j * d < h; j++) for (let i = 0; i * d < w; i++) {
      const on = lv === 1 ? (i % 2 === 0 && j % 2 === 0) : lv === 2 ? ((i + j) & 1) === 0 : !(i % 2 === 1 && j % 2 === 1);
      if (on) g.fillRect(R(x + i * d), R(y + j * d), d, d);
    }
  }
  /** Paint glyph ch into the cell rect with the current fillStyle. bold = double strike one font pixel right. */
  function paintGlyph(g, ch, x, y, w, h, bold) {
    if (ch === ' ') return;
    if (ch === '█') return rect(g, x, y, x + w, y + h);
    if (ch === '▀') return rect(g, x, y, x + w, y + h / 2);
    if (ch === '▄') return rect(g, x, y + h / 2, x + w, y + h);
    if (ch === '▁') return rect(g, x + w * 0.04, y + h * 0.84, x + w * 0.96, y + h * 0.98);
    const sh = { '░': 1, '▒': 2, '▓': 3 }[ch];
    if (sh) return shade(g, sh, x, y, w, h);
    if (ch === '─' || ch === '│') { const t = Math.max(1, R(w * 0.15)); return ch === '─' ? rect(g, x, y + h / 2 - t / 2, x + w, y + h / 2 + t / 2) : rect(g, x + w / 2 - t / 2, y, x + w / 2 + t / 2, y + h); }
    const rom = ROM[ch];
    if (rom) {
      const n = rom.length, m = 7, ps = Math.min((w * 0.9) / m, (h * 0.72) / Math.max(6, n)), bx = x + (w - ps * m) / 2, by = y + h * 0.8 - ps * n;
      for (let j = 0; j < n; j++) for (let i = 0; i < m; i++) if (rom[j][i] === 'x') rect(g, bx + i * ps, by + j * ps, bx + (i + 1) * ps, by + (j + 1) * ps);
      return;
    }
    g.font = R(h * (fontOK ? 1.25 : 0.9)) + 'px ' + STACK;   // VT323: advance 0.4 em, so 1.25 × cell height fills 6 × 10
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const bx = x + w / 2, by = y + h * (fontOK ? 0.79 : 0.77);
    g.fillText(ch, bx, by);
    if (bold) g.fillText(ch, bx + Math.max(1, w * 0.1), by);
  }

  // ---------- glyph atlas: one slot per (glyph, colour, glow), baked on first use ----------
  let atlas = null;
  function getAtlas(cw, ch) {
    if (atlas && atlas.cw === cw && atlas.ch === ch) return atlas;
    const pad = Math.ceil(ch * 0.9), sw = Math.ceil(cw) + pad * 2, sh = Math.ceil(ch) + pad * 2, per = 16;
    atlas = { cw, ch, pad, sw, sh, per, page: canvas(sw * per, sh * per), map: {}, n: 0 };
    return atlas;
  }
  function slot(A, ch, col, glow) {
    const key = (glow ? 1 : 0) + ch + col;
    if (A.map[key]) return A.map[key];
    const k = A.n++ % (A.per * A.per), sx = (k % A.per) * A.sw, sy = Math.floor(k / A.per) * A.sh, g = A.page.ctx;
    g.save(); g.beginPath(); g.rect(sx, sy, A.sw, A.sh); g.clip(); g.clearRect(sx, sy, A.sw, A.sh);
    g.fillStyle = col;
    if (glow) {
      g.shadowColor = col;
      g.globalAlpha = 0.7; g.shadowBlur = A.ch * 0.9; paintGlyph(g, ch, sx + A.pad, sy + A.pad, A.cw, A.ch, true);
      g.globalAlpha = 1; g.shadowBlur = A.ch * 0.32; paintGlyph(g, ch, sx + A.pad, sy + A.pad, A.cw, A.ch, true);
      g.shadowBlur = 0;
    }
    paintGlyph(g, ch, sx + A.pad, sy + A.pad, A.cw, A.ch, glow);
    g.restore();
    return (A.map[key] = { sx, sy });
  }
  /** Draw glyph ch at cell (c, r) of the screen grid (ox/oy = pixel position of cell 0,0). */
  function cell(g, A, ch, col, glow, c, r, ox, oy, plate) {
    const x = R(ox + c * A.cw), y = R(oy + r * A.ch);
    if (plate) { g.fillStyle = plate; g.fillRect(x, y, R(ox + (c + 1) * A.cw) - x, R(oy + (r + 1) * A.ch) - y); }
    if (ch === ' ') return;
    const s = slot(A, ch, col, glow);
    g.drawImage(A.page.c, s.sx, s.sy, A.sw, A.sh, x - A.pad, y - A.pad, A.sw, A.sh);
  }

  // ---------- sprites: glyph rows + colour-key rows ('.' = no cell, 'K' = plate only) ----------
  const KEY = { H: P.a5, A: P.a3, a: P.a2, w: P.a1, Y: P.a4, W: P.g6, g: P.g4, d: P.g3, e: P.g2, C: P.c4, b: P.c2, R: P.r2, r: P.r1, S: P.r3 };
  const HERO_ARMS = ['/█\\', '-█\\', '/█\\', '/█-'], HERO_LEGS = ['/ \\', ' |\\', '/ \\', '/| '];
  const heroDef = (f) => ({ g: [' @ ', HERO_ARMS[f], HERO_LEGS[f]], k: ['.H.', 'AaA', [...HERO_LEGS[f]].map((c) => (c === ' ' ? 'K' : 'a')).join('')] });
  const CRAWL = { g: [['(ö)', '/"\\'], ['(ö)', '\\"/']], k: ['gWg', 'dgd'] };
  const SPIRIT = ['(*)', '{+}', '(×)', '<*>', '{x}', '(+)'];
  const BRUTE = { g: [['▀▄   ▄▀', '▄█O█O█▄', '█▀vvv▀█', '▀ █ █ ▀'], ['▀▄   ▄▀', '▄█O█O█▄', '█▀vvv▀█', ' █ ▀ █ ']], k: [['SRKKKRS', 'RRHRHRR', 'RRYYYRR', 'rKrKrKr'], ['SRKKKRS', 'RRHRHRR', 'RRYYYRR', 'KrKrKrK']] };
  const PINE = { g: ['  ^  ', ' ^^^ ', '^^^^^', ' ^^^ ', '^^^^^', '  |  '], k: ['..g..', '.ggg.', 'ddgdd', '.ddd.', 'eddde', '..w..'] };
  const MIR = { '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<', '{': '}', '}': '{', '[': ']', ']': '[' };
  const mirror = (d) => ({ g: d.g.map((s) => [...s].reverse().map((c) => MIR[c] || c).join('')), k: d.k.map((s) => [...s].reverse().join('')) });
  let sprites = {};
  /** Bake a def: plates first, then wide bloom + tight halo + crisp double-struck glyphs. */
  function bake(def, cw, chh, glowKeys) {
    const gr = def.g.map((s) => [...s]), kr = def.k.map((s) => [...s]);
    const w = Math.max(...gr.map((r) => r.length)), h = gr.length, pad = Math.ceil(chh * 0.9);
    const { c, ctx: g } = canvas(Math.ceil(w * cw) + pad * 2, Math.ceil(h * chh) + pad * 2);
    const X = (i) => pad + R(i * cw), Y = (j) => pad + R(j * chh);
    g.fillStyle = P.plate;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (kr[j][i] && kr[j][i] !== '.') g.fillRect(X(i), Y(j), X(i + 1) - X(i), Y(j + 1) - Y(j));
    for (let pass = 0; pass < 3; pass++) {
      g.save();
      if (pass === 0) g.globalAlpha = 0.75;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const ch = gr[j][i], k = kr[j][i];
        if (!ch || ch === ' ' || !k || k === '.' || k === 'K') continue;
        if (pass < 2 && glowKeys !== undefined && glowKeys.indexOf(k) < 0) continue;
        const col = KEY[k] || P.g4;
        g.fillStyle = col;
        if (pass < 2) { g.shadowColor = col; g.shadowBlur = chh * (pass === 0 ? 1 : 0.3); }
        paintGlyph(g, ch, X(i), Y(j), X(i + 1) - X(i), Y(j + 1) - Y(j), true);
      }
      g.restore();
    }
    return { c, pad, w, h };
  }
  function spr(key, def, A, glowKeys) {
    const k = key + '|' + A.cw.toFixed(2);
    return sprites[k] || (sprites[k] = bake(def, A.cw, A.ch, glowKeys));
  }
  /** Blit a sprite so its bottom-centre cell is cell (c, r). */
  const put = (g, s, A, c, r, ox, oy) => g.drawImage(s.c, R(ox + (c - (s.w >> 1)) * A.cw) - s.pad, R(oy + (r - s.h + 1) * A.ch) - s.pad);

  function drawHero(ctx, x, y, t, facing) {
    const A = getAtlas(CW * (ctx.__S || 1), CH * (ctx.__S || 1));
    const f = Math.floor(t * 4.6) & 3, left = (facing || 1) < 0;
    const s = spr('hero' + f + left, left ? mirror(heroDef(f)) : heroDef(f), A);
    put(ctx, s, A, Math.floor(x / A.cw), Math.floor(y / A.ch), 0, 0);
    if (Math.floor(t / 0.53) & 1) cell(ctx, A, '▁', P.a3, true, Math.floor(x / A.cw), Math.floor(y / A.ch) + 1, 0, 0);   // the cursor it stands on
  }
  function drawEnemy(ctx, x, y, t, kind, facing, id) {
    const A = getAtlas(CW * (ctx.__S || 1), CH * (ctx.__S || 1));
    const c = Math.floor(x / A.cw), r = Math.floor(y / A.ch), left = (facing || 1) < 0, i = id || 0;
    let def, key;
    if (kind === 'spirit') { const f = Math.floor(t * 11 + i * 3) % SPIRIT.length; def = { g: [SPIRIT[f]], k: ['bCb'] }; key = 'sp' + f; }
    else if (kind === 'brute') { const f = Math.floor(t * 2.2) & 1; def = { g: BRUTE.g[f], k: BRUTE.k[f] }; key = 'br' + f; }
    else { const f = Math.floor(t * 3 + i) & 1; def = { g: CRAWL.g[f], k: CRAWL.k }; key = 'cr' + f; }
    if (left && kind !== 'spirit') { def = mirror(def); key += 'l'; }
    put(ctx, spr(key, def, A), A, c, r, 0, 0);
  }

  // ---------- ground: one glyph per cell, deterministic per cell ----------
  let ground = null;
  function groundCell(gx, gy, W, H) {
    const r = hf(gx, gy, 9001), r2 = hf(gx, gy, 9002), x = gx / 40, y = gy / 24;
    // a rogue-style room (walls '#', floor '.', door '+')
    const rx0 = Math.floor(W * 0.62), ry0 = Math.floor(H * 0.12), rx1 = rx0 + 15, ry1 = ry0 + 8;
    if (gx >= rx0 && gx <= rx1 && gy >= ry0 && gy <= ry1) {
      const wall = gx === rx0 || gx === rx1 || gy === ry0 || gy === ry1;
      if (!wall) return ['.', r < 0.12 ? P.g3 : P.g2, P.rbg];
      if (gy === ry1 && gx === rx0 + 5) return ['+', P.a2, P.rbg];
      return ['#', r < 0.2 ? P.g4 : P.g3, P.rbg];
    }
    const road = Math.abs(gy - (H * 0.72 + Math.sin(gx * 0.09) * 4));
    const wv = fbm(x * 1.6 + 3, y * 1.6, 77) - (gx < W * 0.3 ? 0.18 : 0);
    if (wv > 0.66) return road < 1.2 ? ['=', P.a2, P.dbg] : wv > 0.72 ? [r < 0.42 ? '≈' : r < 0.62 ? '~' : ' ', r2 < 0.3 ? P.c2 : P.c1, P.wbg2] : [r < 0.5 ? '~' : ' ', P.c1, P.wbg];
    if (wv > 0.64) return [r < 0.4 ? '.' : r < 0.6 ? ',' : ' ', P.a1, null];
    if (road < 1.6) return [road < 0.6 ? '·' : r < 0.5 ? '.' : ',', r2 < 0.55 ? P.a1 : P.a0, P.dbg];
    const rk = fbm(x * 2 + 9, y * 2 - 4, 55);
    if (rk > 0.68) { const d = rk - 0.68; return d < 0.02 ? ['░', P.g2, null] : d < 0.04 ? ['▒', P.g2, null] : d < 0.06 ? [r < 0.12 ? '▲' : '▓', r < 0.12 ? P.g3 : P.g1, null] : ['█', P.g0, null]; }
    const F = fbm(x * 1.3 - 5, y * 1.3 + 2, 31);
    if (F > 0.58) { const dn = Math.min(1, (F - 0.58) / 0.1); return r < 0.08 + dn * 0.4 ? [r2 < 0.45 ? '♣' : r2 < 0.8 ? '♠' : '^', r < 0.06 ? P.g3 : P.g2, dn > 0.35 ? P.fbg : null] : [r < 0.5 ? '.' : ' ', P.g1, dn > 0.35 ? P.fbg : null]; }
    const m = fbm(x * 3, y * 3, 13);
    if (r < 0.006) return ['*', P.a2, null];
    if (r2 > 0.08 + m * 0.36) return [' ', P.g1, null];
    return m > 0.58 ? ['",;\''[(r * 997 | 0) % 4], r < 0.25 ? P.g3 : P.g2, null] : ['.,\'`'[(r * 997 | 0) % 4], r < 0.38 ? P.g2 : P.g1, null];
  }
  function bakeGround(w, h, A) {
    const cols = Math.ceil(w / A.cw) + 1, rows = Math.ceil(h / A.ch) + 1;
    const { c, ctx: g } = canvas(w, h);
    g.fillStyle = P.bg; g.fillRect(0, 0, w, h);
    const water = [], cells = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const [ch, col, bg] = groundCell(i, j, cols, rows);
      if (bg) { g.fillStyle = bg; g.fillRect(R(i * A.cw), R(j * A.ch), R((i + 1) * A.cw) - R(i * A.cw), R((j + 1) * A.ch) - R(j * A.ch)); }
      cells.push([ch, col, i, j]);
      if (bg === P.wbg || bg === P.wbg2) water.push([i, j, bg]);
    }
    // ground glyphs are plain (no glow): the actors own the light
    const GA = { cw: A.cw, ch: A.ch, pad: 2, sw: Math.ceil(A.cw) + 4, sh: Math.ceil(A.ch) + 4, per: 16, page: canvas((Math.ceil(A.cw) + 4) * 16, (Math.ceil(A.ch) + 4) * 16), map: {}, n: 0 };
    for (const [ch, col, i, j] of cells) cell(g, GA, ch, col, false, i, j, 0, 0);
    return { c, w, h, water, cols, rows };
  }

  // ---------- CRT overlay (cached per size) ----------
  let crt = null;
  function bakeCRT(w, h) {
    const { c, ctx: g } = canvas(w, h);
    const lp = Math.max(3, R(h / 300));
    g.fillStyle = 'rgba(0,0,0,0.42)';
    for (let y = lp - Math.max(1, R(lp / 3)); y < h; y += lp) g.fillRect(0, y, w, Math.max(1, R(lp / 3)));   // scanlines
    const rg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.55);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.55, 'rgba(0,0,0,0.16)'); rg.addColorStop(0.85, 'rgba(0,0,0,0.5)'); rg.addColorStop(1, 'rgba(0,0,0,0.82)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
    const r = Math.min(w, h) * 0.075, m = Math.max(1, Math.min(w, h) * 0.004);   // rounded glass corners
    g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, w, h);
    g.moveTo(m + r, m); g.arcTo(w - m, m, w - m, h - m, r); g.arcTo(w - m, h - m, m, h - m, r); g.arcTo(m, h - m, m, m, r); g.arcTo(m, m, w - m, m, r); g.closePath();
    g.fill('evenodd');
    return { c, w, h };
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds). */
  function draw(ctx, w, h, t) {
    checkFont();
    const S = h / 360, A = getAtlas(CW * S, CH * S);
    if (!ground || ground.w !== w || ground.h !== h) ground = bakeGround(w, h, A);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(ground.c, 0, 0);
    // animated water: crests travel over the '~' cells
    for (const [i, j, bg] of ground.water) {
      const ph = Math.sin(i * 0.42 + j * 1.1 - t * 1.9 + Math.sin(j * 0.7 + t * 0.6) * 1.4);
      if (ph > 0.9) cell(ctx, A, ph > 0.975 ? '≈' : '~', ph > 0.975 ? P.c3 : P.c2, true, i, j, 0, 0, bg);
    }
    const cols = ground.cols, rows = ground.rows, hc = Math.floor(cols * 0.42), hr = Math.floor(rows * 0.58);
    ctx.__S = S;
    // a pine and the main character's warm lamp glow
    put(ctx, spr('pine', PINE, A, 'g'), A, Math.floor(cols * 0.18), Math.floor(rows * 0.4), 0, 0);
    put(ctx, spr('pine', PINE, A, 'g'), A, Math.floor(cols * 0.86), Math.floor(rows * 0.86), 0, 0);
    const lx = (hc + 0.5) * A.cw, ly = (hr - 1) * A.ch, lr = 50 * S;
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
    lg.addColorStop(0, 'rgba(255,178,56,0.12)'); lg.addColorStop(1, 'rgba(255,178,56,0)');
    ctx.fillStyle = lg; ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
    // creatures (snapped to cells), then the main character
    const foes = [['crawl', -14, -4], ['crawl', 12, -6], ['crawl', 17, 3], ['crawl', -20, 5], ['brute', 26, -1], ['spirit', -9, -9], ['spirit', 7, 6], ['spirit', -24, -2]];
    foes.forEach(([kind, dc, dr], i) => {
      const c = hc + dc + R(Math.sin(t * 0.8 + i) * 1.5), r = hr + dr + R(Math.cos(t * 0.6 + i));
      if (kind === 'spirit') for (let k = 1; k < 4; k++) cell(ctx, A, k < 2 ? '+' : '·', k < 2 ? P.c2 : P.c1, k < 2, c - k * (dc < 0 ? -1 : 1), r, 0, 0);   // glyph tail
      drawEnemy(ctx, (c + 0.5) * A.cw, (r + 0.5) * A.ch, t, kind, dc < 0 ? 1 : -1, i);
    });
    drawHero(ctx, (hc + 0.5) * A.cw, (hr + 0.5) * A.ch, t, Math.sin(t * 0.5) > 0 ? 1 : -1);
    // collectibles, orbiting spinners, a projectile with a direction-glyph trail
    [[-6, 2, 0], [5, 3, 1], [-11, -2, 0], [9, -4, 0]].forEach(([dc, dr, big], i) => {
      const c = hc + dc, r = hr + dr, blink = Math.floor(t * 3 + i * 2) % 5 === 0;
      if (big) { cell(ctx, A, '[', P.c2, true, c - 1, r, 0, 0, P.plate); cell(ctx, A, ']', P.c2, true, c + 1, r, 0, 0, P.plate); }
      cell(ctx, A, '◆', blink ? P.c4 : P.c3, true, c, r, 0, 0, P.plate);
    });
    for (let k = 0; k < 2; k++) {
      const a = t * 2.4 + k * Math.PI, c = hc + R(Math.cos(a) * 7), r = hr - 1 + R(Math.sin(a) * 3.2);
      cell(ctx, A, '(', P.a2, true, c - 1, r, 0, 0, P.plate); cell(ctx, A, '|/-\\'[Math.floor(t * 12 + k * 2) & 3], P.a5, true, c, r, 0, 0, P.plate); cell(ctx, A, ')', P.a2, true, c + 1, r, 0, 0, P.plate);
    }
    const pc = hc + 2 + (Math.floor(t * 14) % 9);
    cell(ctx, A, '·', P.a2, false, pc - 2, hr - 1, 0, 0); cell(ctx, A, '-', P.a3, true, pc - 1, hr - 1, 0, 0); cell(ctx, A, '*', P.a5, true, pc, hr - 1, 0, 0, P.plate);
    // glyph ring burst + typed-out text
    const k = (t * 1.2) % 1, rad = 2 + k * 18, n = 16;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; cell(ctx, A, k > 0.6 ? '·' : '*', k > 0.5 ? P.g3 : P.g4, true, hc - 16 + R(Math.cos(a) * rad / CW), hr - 6 + R(Math.sin(a) * rad * 0.6 / CH), 0, 0); }
    const txt = '[ OK ]', shown = Math.min(txt.length, Math.floor(((t * 0.8) % 1.6) * 12));
    for (let i = 0; i < shown; i++) cell(ctx, A, txt[i], P.c3, true, hc - 3 + i, hr - 5, 0, 0, txt[i] === ' ' ? null : P.plate);
    // HUD window: frame, title tab, segmented bar, blinking cursor
    const x0 = R(16 * S), y0 = R(14 * S), ww = R(150 * S), hh = R(28 * S);
    ctx.fillStyle = 'rgba(2,10,5,0.92)'; ctx.fillRect(x0, y0, ww, hh);
    ctx.strokeStyle = P.g3; ctx.lineWidth = Math.max(1, R(S * 0.8)); ctx.shadowColor = P.g4; ctx.shadowBlur = 8 * S;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, ww, hh); ctx.shadowBlur = 0;
    ctx.fillStyle = P.bg; ctx.fillRect(x0 + R(6 * S), y0 - R(5 * S), R(26 * S), R(10 * S));
    ctx.font = R(11 * S) + 'px ' + STACK; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = P.a3; ctx.fillText(' PWR', x0 + R(6 * S), y0);
    for (let i = 0; i < 16; i++) { ctx.fillStyle = i < 11 ? P.a3 : P.a1; ctx.fillRect(x0 + R((8 + i * 5) * S), y0 + R(10 * S), R(4 * S), R(9 * S)); }
    ctx.fillStyle = P.a4; ctx.fillText('72/100', x0 + R(96 * S), y0 + R(15 * S));
    if (Math.floor(t / 0.53) & 1) { ctx.fillStyle = P.g4; ctx.fillRect(x0 + R(138 * S), y0 + R(10 * S), R(5 * S), R(9 * S)); }
    // CRT: rolling refresh band, scanlines, flicker, barrel vignette with rounded corners
    if (!crt || crt.w !== w || crt.h !== h) crt = bakeCRT(w, h);
    const by = ((t / 7) % 1.4 - 0.2) * h, bh = h * 0.14, band = ctx.createLinearGradient(0, by - bh, 0, by + bh);
    band.addColorStop(0, 'rgba(120,255,170,0)'); band.addColorStop(0.5, 'rgba(120,255,170,0.035)'); band.addColorStop(1, 'rgba(120,255,170,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = band; ctx.fillRect(0, by - bh, w, bh * 2); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,' + (0.012 + 0.03 * hf(Math.floor(t * 30), 1, 9)).toFixed(3) + ')'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(crt.c, 0, 0);
  }

  const Starter = { id: 'terminal', name: 'Terminal ASCII', palette: PALETTE, fonts: ['VT323'], drawHero, drawEnemy, draw, paintGlyph };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['terminal'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
