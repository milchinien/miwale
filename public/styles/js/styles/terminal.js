/* Terminal ASCII – the world rendered as text on a phosphor CRT.
   Rules followed throughout:
   - one fixed character grid: a cell is 6 × 10 world units; ground, actors, props, effects and numbers
     all snap to whole cells (the camera scrolls smoothly, the text never sits between cells)
   - every glyph comes from a glyph atlas baked once per cell size (VT323 for type; block, shade, box
     and a few symbols are drawn procedurally like a terminal's character ROM, so they tile seamlessly)
   - ground chunks blit dim glyph cells; actors are small multi-glyph sprites on opaque cell plates,
     so they erase the ground under them like a real terminal and pop off it even in crowds
   - phosphor green carries ~90 % of the screen, amber marks the main character and light, cyan and red
     are signal colours used sparingly
   - atmosphere = bloom of bright glyphs, scanlines, flicker, a rolling refresh band, a barrel vignette
     with rounded screen corners and row-tearing on impacts. */
(function () {
  'use strict';
  const U = window.U, G = window.G;

  /* =====================================================================
     Grid + palette
     ===================================================================== */
  const CW = 6, CH = 10;                 // character cell in world units
  const CHUNK = 240;                     // ground chunk = 40 × 24 cells
  const NX = CHUNK / CW, NY = CHUNK / CH;
  const FAM = 'VT323';
  const STACK = '"VT323", "Share Tech Mono", Consolas, "DejaVu Sans Mono", "Courier New", monospace';

  const P = {
    bg: '#020a05', plate: '#010502',
    g0: '#0a2613', g1: '#113d20', g2: '#1a6331', g3: '#2a994b', g4: '#4ddb76', g5: '#a3ffbd', g6: '#e6fff0',
    a0: '#3d2405', a1: '#7a4a0e', a2: '#c97f19', a3: '#ffb238', a4: '#ffd98e', a5: '#fff3da',
    c0: '#06292c', c1: '#0f5c62', c2: '#1fb0b9', c3: '#5cefff', c4: '#ccfbff',
    r0: '#36070d', r1: '#86131f', r2: '#ff4257', r3: '#ff8a96',
    wbg: '#031a1e', wbg2: '#042229', fbg: '#04170c', rbg: '#071f0f', dbg: '#0e0d05',
  };
  // brightness ramps per colour family, brightest first
  const FAMS = {
    g: [P.g6, P.g5, P.g4, P.g3, P.g2, P.g1, P.g0],
    a: [P.a5, P.a4, P.a3, P.a2, P.a1, P.a0],
    c: [P.c4, P.c3, P.c2, P.c1, P.c0],
    r: [P.r3, P.r2, P.r1, P.r0],
  };
  const fc = (fam, lv) => { const f = FAMS[fam] || FAMS.g; return f[U.clamp(lv | 0, 0, f.length - 1)]; };
  // foreign colours (bursts sent by other modules) are snapped to the nearest phosphor family + level
  const qCache = new Map();
  function quant(col) {
    let q = qCache.get(col);
    if (q) return q;
    let c = [255, 255, 255];
    try { c = U.hex(String(col || '#ffffff')); } catch (e) { /* keep white */ }
    const l = (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255;
    let fam = 'g';
    if (c[0] > c[1] * 1.25 && c[0] > c[2]) fam = c[1] > c[0] * 0.5 ? 'a' : 'r';
    else if (c[2] > c[1] * 0.85 && c[2] > c[0] * 1.2) fam = 'c';
    const n = FAMS[fam].length;
    q = { fam, lv: U.clamp(Math.round((1 - l) * (n - 1) * 0.8), 0, n - 1) };
    if (qCache.size > 400) qCache.clear();
    qCache.set(col, q);
    return q;
  }

  /* =====================================================================
     Fonts – VT323 is a web font; atlases are re-baked and fallback-built chunks repainted once it is there
     ===================================================================== */
  let fontOK = false, fontPoll = 0;
  let staleChunks = [], repaint = [];
  function fontLoaded() {
    if (!document.fonts) return true;
    let ok = false;
    document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === FAM && f.status === 'loaded') ok = true; });
    return ok;
  }
  function requestFont() {
    if (!document.fonts || !document.fonts.load) return;
    try { document.fonts.load('20px "VT323"', '@#~').then(fontTick, () => {}); } catch (e) { /* ignore */ }
  }
  function ensureFontLink() {
    let has = false;
    document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => { if (/family=VT323/.test(l.href)) has = true; });
    if (!has) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
      l.onload = requestFont;
      document.head.appendChild(l);
    }
    requestFont();
  }
  function fontTick() {
    if (fontOK) return;
    if (fontLoaded()) {
      fontOK = true;
      ATLAS.clear();
      SPRITES.clear();
      ICONS.clear();
      repaint = staleChunks;
      staleChunks = [];
    } else if ((++fontPoll & 63) === 0) requestFont();
  }

  /* =====================================================================
     Character ROM: procedural block / shade / box glyphs + bitmap symbols the font lacks
     ===================================================================== */
  const ROM = {
    '♣': ['..xxx..', '..xxx..', 'xx.x.xx', 'xxxxxxx', 'xx.x.xx', '...x...', '..xxx..'],
    '♠': ['...x...', '..xxx..', '.xxxxx.', 'xxxxxxx', 'xxxxxxx', '.x.x.x.', '...x...', '..xxx..'],
    '♥': ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'],
    '◆': ['...x...', '..xxx..', '.xxxxx.', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'],
    '◇': ['...x...', '..x.x..', '.x...x.', 'x.....x', '.x...x.', '..x.x..', '...x...'],
    '≈': ['.xx....', 'x..x..x', '....xx.', '.......', '.xx....', 'x..x..x', '....xx.'],
    '▲': ['...x...', '..xxx..', '..xxx..', '.xxxxx.', '.xxxxx.', 'xxxxxxx'],
    '☼': ['x..x..x', '.x.x.x.', '..xxx..', 'xxx.xxx', '..xxx..', '.x.x.x.', 'x..x..x'],
    '↑': ['...x...', '..xxx..', '.x.x.x.', '...x...', '...x...', '...x...'],
    '♦': ['...x...', '..xxx..', '.xxxxx.', '..xxx..', '...x...'],
  };
  // box drawing: [left, right, up, down] arms, 1 = single, 2 = double
  const BOXD = {
    '─': [1, 1, 0, 0], '│': [0, 0, 1, 1], '┌': [0, 1, 0, 1], '┐': [1, 0, 0, 1], '└': [0, 1, 1, 0], '┘': [1, 0, 1, 0],
    '├': [0, 1, 1, 1], '┤': [1, 0, 1, 1], '┬': [1, 1, 0, 1], '┴': [1, 1, 1, 0], '┼': [1, 1, 1, 1],
    '═': [2, 2, 0, 0], '║': [0, 0, 2, 2], '╔': [0, 2, 0, 2], '╗': [2, 0, 0, 2], '╚': [0, 2, 2, 0], '╝': [2, 0, 2, 0],
  };
  const SHADE = { '░': 1, '▒': 2, '▓': 3 };
  const R = Math.round;
  /** Offscreen canvas kept in CPU memory: baked once, then only ever a drawImage source (no GPU round trips). */
  function cpuCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return { c, ctx: c.getContext('2d', { willReadFrequently: true }) };
  }
  function rect(g, x0, y0, x1, y1) { const a = R(x0), b = R(y0); g.fillRect(a, b, Math.max(1, R(x1) - a), Math.max(1, R(y1) - b)); }
  function boxGlyph(g, d, x, y, w, h) {
    const t = Math.max(1, R(w * 0.15)), cx = x + w / 2, cy = y + h / 2;
    const seg = (k, horiz, a0, a1) => {
      if (!k) return;
      if (k === 1) { if (horiz) rect(g, a0, cy - t / 2, a1, cy + t / 2); else rect(g, cx - t / 2, a0, cx + t / 2, a1); return; }
      const o = Math.max(t * 1.2, w * 0.2);
      if (horiz) { rect(g, a0, cy - o - t / 2, a1, cy - o + t / 2); rect(g, a0, cy + o - t / 2, a1, cy + o + t / 2); }
      else { rect(g, cx - o - t / 2, a0, cx - o + t / 2, a1); rect(g, cx + o - t / 2, a0, cx + o + t / 2, a1); }
    };
    const dbl = d.some((v) => v === 2), ext = dbl ? Math.max(t * 1.2, w * 0.2) + t / 2 : t / 2;
    seg(d[0], true, x, cx + (d[2] || d[3] ? ext : t / 2));
    seg(d[1], true, cx - (d[2] || d[3] ? ext : t / 2), x + w);
    seg(d[2], false, y, cy + (d[0] || d[1] ? ext : t / 2));
    seg(d[3], false, cy - (d[0] || d[1] ? ext : t / 2), y + h);
  }
  function shadeGlyph(g, lv, x, y, w, h) {
    const d = Math.max(1, R(h / 12));
    const nx = Math.ceil(w / d), ny = Math.ceil(h / d);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const on = lv === 1 ? (i % 2 === 0 && j % 2 === 0) : lv === 2 ? ((i + j) & 1) === 0 : !(i % 2 === 1 && j % 2 === 1);
        if (on) g.fillRect(R(x + i * d), R(y + j * d), Math.min(d, R(x + w) - R(x + i * d)), Math.min(d, R(y + h) - R(y + j * d)));
      }
    }
  }
  function romGlyph(g, rows, x, y, w, h) {
    const n = rows.length, m = rows[0].length;
    const ps = Math.min((w * 0.9) / m, (h * 0.72) / Math.max(6, n));
    const bx = x + (w - ps * m) / 2, by = y + h * 0.8 - ps * n;
    for (let j = 0; j < n; j++) for (let i = 0; i < m; i++) if (rows[j][i] === 'x') rect(g, bx + i * ps, by + j * ps, bx + (i + 1) * ps, by + (j + 1) * ps);
  }
  /** Paint one glyph into the cell rect (x, y, w, h) in pixels with the current fillStyle. */
  function paintGlyph(g, ch, x, y, w, h, bold) {
    if (ch === ' ') return;
    if (ch === '█') return rect(g, x, y, x + w, y + h);
    if (ch === '▀') return rect(g, x, y, x + w, y + h / 2);
    if (ch === '▄') return rect(g, x, y + h / 2, x + w, y + h);
    if (ch === '▌') return rect(g, x, y, x + w / 2, y + h);
    if (ch === '▐') return rect(g, x + w / 2, y, x + w, y + h);
    if (ch === '■') return rect(g, x + w * 0.18, y + h * 0.3, x + w * 0.82, y + h * 0.72);
    if (ch === '▪') return rect(g, x + w * 0.3, y + h * 0.4, x + w * 0.7, y + h * 0.64);
    if (ch === '▁') return rect(g, x + w * 0.04, y + h * 0.84, x + w * 0.96, y + h * 0.98);
    if (SHADE[ch]) return shadeGlyph(g, SHADE[ch], x, y, w, h);
    if (BOXD[ch]) return boxGlyph(g, BOXD[ch], x, y, w, h);
    if (ROM[ch]) return romGlyph(g, ROM[ch], x, y, w, h);
    g.font = R(h * (fontOK ? 1.25 : 0.9)) + 'px ' + STACK;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    const bx = x + w / 2, by = y + h * (fontOK ? 0.79 : 0.77);
    g.fillText(ch, bx, by);
    // bold = double strike, shifted by one font pixel (how text terminals did it)
    if (bold) g.fillText(ch, bx + Math.max(1, w * 0.1), by);
  }

  /* =====================================================================
     Glyph atlas: slots of (glyph, colour, mode) on shared pages, baked on first use, one atlas per cell size
     mode 0 = plain, 1 = glow, 2 = inverse video (lit cell, dark glyph), 3 = soft glow
     ===================================================================== */
  class Atlas {
    constructor(w, h, pad) {
      this.w = w; this.h = h; this.pad = pad;
      this.sw = Math.ceil(w) + pad * 2; this.sh = Math.ceil(h) + pad * 2;
      this.per = 8; this.pages = []; this.map = new Map(); this.n = 0;
    }
    get(ch, col, mode) {
      const key = mode + ch + col;
      let s = this.map.get(key);
      if (s) return s;
      const per = this.per, i = this.n++, pi = Math.floor(i / (per * per)), k = i % (per * per);
      if (!this.pages[pi]) this.pages[pi] = cpuCanvas(this.sw * per, this.sh * per);
      const pg = this.pages[pi], g = pg.ctx;
      const sx = (k % per) * this.sw, sy = Math.floor(k / per) * this.sh, x = sx + this.pad, y = sy + this.pad;
      g.save();
      g.beginPath(); g.rect(sx, sy, this.sw, this.sh); g.clip();
      if (mode === 2) {
        g.fillStyle = col; g.shadowColor = col; g.shadowBlur = this.h * 0.4;
        rect(g, x, y, x + this.w, y + this.h);
        g.shadowBlur = 0; g.fillStyle = P.plate;
        paintGlyph(g, ch, x, y, this.w, this.h, true);
      } else {
        g.fillStyle = col;
        const bold = mode === 1;
        if (mode === 1 || mode === 3) {
          g.shadowColor = col;
          if (mode === 1) { g.globalAlpha = 0.7; g.shadowBlur = this.h * 0.9; paintGlyph(g, ch, x, y, this.w, this.h, bold); g.globalAlpha = 1; }
          g.shadowBlur = this.h * 0.32;
          paintGlyph(g, ch, x, y, this.w, this.h, bold);
          g.shadowBlur = 0;
        }
        paintGlyph(g, ch, x, y, this.w, this.h, bold);
      }
      g.restore();
      s = { c: pg.c, sx, sy };
      this.map.set(key, s);
      return s;
    }
  }
  const ATLAS = new Map();
  function atlasFor(cw, ch, glow) {
    const key = cw.toFixed(3) + 'x' + ch.toFixed(3) + (glow ? 'g' : '');
    let a = ATLAS.get(key);
    if (!a) {
      if (ATLAS.size > 8) ATLAS.clear();
      a = new Atlas(cw, ch, glow ? Math.ceil(ch * 0.9) : 2);
      ATLAS.set(key, a);
    }
    return a;
  }

  /* =====================================================================
     Screen mapping – everything is blitted at whole display pixels on whole cells
     ===================================================================== */
  let VS = 2.5, OX = 0, OY = 0, RT = 0, FR = 0, LASTV = null;
  function setView(v) { if (!v) return; VS = v.S; OX = v.W / 2 - v.x * VS; OY = v.H / 2 - v.y * VS; RT = v.rt; LASTV = v; }
  const colOf = (x) => Math.floor(x / CW);
  const rowOf = (y) => Math.floor(y / CH);
  const scX = (col) => R(col * CW * VS + OX);
  const scY = (row) => R(row * CH * VS + OY);
  const SA = () => {
    const a = atlasFor(CW * VS, CH * VS, true);
    if (!a.warm) { a.warm = true; warmUp(a); }
    return a;
  };
  function toScreen(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); }
  function toWorld(ctx) { ctx.setTransform(VS, 0, 0, VS, OX, OY); }
  /** One glyph in cell (col,row) – optional opaque plate behind it. Screen transform must be set. */
  function cell(ctx, A, ch, col, mode, c, r, plate) {
    const x = scX(c), y = scY(r);
    if (plate) { ctx.fillStyle = plate; ctx.fillRect(x, y, scX(c + 1) - x, scY(r + 1) - y); }
    if (ch === ' ') return;
    const s = A.get(ch, col, mode);
    ctx.drawImage(s.c, s.sx, s.sy, A.sw, A.sh, x - A.pad, y - A.pad, A.sw, A.sh);
  }
  function text(ctx, A, str, col, mode, c, r, plate) {
    for (let i = 0; i < str.length; i++) cell(ctx, A, str[i], col, mode, c + i, r, plate);
  }
  const hashf = (a, b, s) => U.hashInt(a | 0, b | 0, s | 0) / 4294967296;
  const SCRAMBLE = '#%&$@?!*+=/\\<>{}[]~^:;░▒▓';
  const scr = (a, b, s) => SCRAMBLE[(U.hashInt(a | 0, b | 0, s | 0) >>> 3) % SCRAMBLE.length];

  /* =====================================================================
     Multi-glyph sprites: rows of glyphs + rows of colour keys, baked per cell size on opaque plates
     colour keys: '.' = no cell (ground shows), 'K' = plate only, others = palette colours below
     ===================================================================== */
  const KEY = {
    H: P.a5, A: P.a3, a: P.a2, w: P.a1, Y: P.a4,
    W: P.g6, G: P.g5, g: P.g4, d: P.g3, e: P.g2, f: P.g1,
    C: P.c4, c: P.c3, b: P.c2,
    R: P.r2, r: P.r1, S: P.r3,
  };
  const MIR = { '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<', '[': ']', ']': '[', '{': '}', '}': '{', '▌': '▐', '▐': '▌',
    '┌': '┐', '┐': '┌', '└': '┘', '┘': '└', '├': '┤', '┤': '├', '╔': '╗', '╗': '╔', '╚': '╝', '╝': '╚', '»': '«', '«': '»', 'd': 'b', 'b': 'd', '`': '\'' };
  const mirror = (rows) => rows.map((s) => [...s].reverse().map((c) => MIR[c] || c).join(''));
  const mirrorK = (rows) => rows.map((s) => [...s].reverse().join(''));
  const SPRITES = new Map();
  /**
   * def = { g: glyph rows, k: colour-key rows }. opt.col(key) → colour, opt.inv = inverse video,
   * opt.noPlate = glyphs only, opt.dim = no glow.
   */
  function bake(def, opt) {
    opt = opt || {};
    const gr = def.g.map((s) => [...s]), kr = def.k.map((s) => [...s]);
    const w = Math.max(...gr.map((r) => r.length)), h = gr.length;
    const cw = CW * VS, chh = CH * VS, pad = Math.ceil(chh * 0.9);
    const { c, ctx: g } = cpuCanvas(Math.ceil(w * cw) + pad * 2, Math.ceil(h * chh) + pad * 2);
    const X = (i) => pad + R(i * cw), Y = (j) => pad + R(j * chh);
    const colOfKey = (k) => (opt.col ? opt.col(k) : KEY[k]) || P.g4;
    if (!opt.noPlate) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const k = kr[j][i] || '.';
        if (k === '.') continue;
        g.fillStyle = opt.inv && k !== 'K' ? colOfKey(k) : P.plate;
        if (opt.inv && k !== 'K') { g.shadowColor = g.fillStyle; g.shadowBlur = chh * 0.5; }
        g.fillRect(X(i), Y(j), X(i + 1) - X(i), Y(j + 1) - Y(j));
        g.shadowBlur = 0;
      }
    }
    // pass 0: wide phosphor bloom, 1: tight halo, 2: crisp double-struck glyph
    for (let pass = opt.dim || opt.inv ? 2 : 0; pass < 3; pass++) {
      g.save();
      if (pass === 0) g.globalAlpha = 0.75;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const ch = gr[j][i], k = kr[j][i] || '.';
        if (!ch || ch === ' ' || k === '.' || k === 'K') continue;
        const col = opt.inv ? P.plate : colOfKey(k);
        g.fillStyle = col;
        if (pass < 2) {
          if (opt.glow !== undefined && opt.glow.indexOf(k) < 0) continue; // only light-emitting keys bloom
          g.shadowColor = col; g.shadowBlur = chh * (pass === 0 ? 1.0 : 0.3);
        }
        paintGlyph(g, ch, X(i), Y(j), X(i + 1) - X(i), Y(j + 1) - Y(j), !opt.thin);
      }
      g.restore();
    }
    return { c, pad, w, h };
  }
  function sprite(key, make) {
    const k = key + '|' + VS.toFixed(3);
    let s = SPRITES.get(k);
    if (!s) {
      if (SPRITES.size > 1400) SPRITES.clear();
      const r = make();
      s = bake(r.def, r.opt);
      SPRITES.set(k, s);
    }
    return s;
  }
  /** Blit a baked sprite with its bottom-centre cell on world (x, y). */
  function put(ctx, s, x, y, dc, dr) {
    const left = R(x / CW - s.w / 2) + (dc || 0), top = rowOf(y) - s.h + 1 + (dr || 0);
    ctx.drawImage(s.c, scX(left) - s.pad, scY(top) - s.pad);
    return { left, top };
  }
  /** Per-cell draw of a def (used for transient states: spawn, scramble, dissolve). fn(i, j, ch, key) → [ch, col, mode, dc, dr] | null */
  function drawCells(ctx, def, x, y, fn, plate) {
    const A = SA();
    const gr = def.g.map((s) => [...s]), kr = def.k.map((s) => [...s]);
    const w = Math.max(...gr.map((r) => r.length)), h = gr.length;
    const left = R(x / CW - w / 2), top = rowOf(y) - h + 1;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = kr[j][i] || '.';
      if (k === '.') continue;
      const r = fn(i, j, gr[j][i] || ' ', k);
      if (!r) continue;
      cell(ctx, A, r[0], r[1], r[2], left + i + (r[3] || 0), top + j + (r[4] || 0), plate && !(r[3] || r[4]) ? plate : null);
    }
  }

  /* =====================================================================
     World layout – material fields (same noise everywhere so chunks and props agree)
     ===================================================================== */
  const GR = 0, FO = 1, RD = 2, WA = 3, RK = 4, RF = 5, RW = 6;
  const WTH = 0.335, FTH = 0.56, RTH = 0.665, RHW = 8;
  function waterF(x, y) {
    let v = U.warped(x / 560 + 31.7, y / 560 - 12.3, 977, 0.9, 3);
    const r = Math.sqrt(x * x + y * y);
    if (r < 300) v += 0.3 * (1 - r / 300);
    return v;
  }
  const forestF = (x, y) => U.warped(x / 600, y / 600, 811, 1.0, 3);
  function rockF(x, y) {
    let v = U.fbm(x / 340 + 7.1, y / 340 - 3.3, 1201, 3);
    const r = Math.sqrt(x * x + y * y);
    if (r < 220) v -= 0.25 * (1 - r / 220);
    return v;
  }
  const meadowF = (x, y) => U.fbm(x / 230, y / 230, 515, 2);
  const glowF = (x, y) => U.fbm(x / 900 - 4, y / 900 + 2, 333, 2);
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

  // rooms: cell-aligned rectangles, at most one per 44 × 30-cell region
  const RGW = 44, RGH = 30;
  const roomCache = new Map();
  function roomCell(i, j) {
    const key = i + ',' + j;
    if (roomCache.has(key)) return roomCache.get(key);
    let rm = null;
    const r = U.rng(U.hashInt(i, j, 4471));
    if (r.next() < 0.42) {
      const w = r.int(11, 19), h = r.int(7, 11);
      const x0 = i * RGW + r.int(3, RGW - w - 3), y0 = j * RGH + r.int(3, RGH - h - 3);
      const cx = (x0 + w / 2) * CW, cy = (y0 + h / 2) * CH;
      let ok = Math.hypot(cx, cy) > 200;
      for (let k = 0; ok && k < 5; k++) {
        const qx = cx + [0, -1, 1, -1, 1][k] * w * CW * 0.55, qy = cy + [0, -1, -1, 1, 1][k] * h * CH * 0.55;
        if (waterF(qx, qy) < WTH + 0.03) ok = false;
      }
      if (ok) {
        rm = { x0, y0, x1: x0 + w - 1, y1: y0 + h - 1, box: r.next() < 0.5, seed: r.int(0, 1e6), doors: new Set() };
        const nd = r.int(2, 3);
        for (let d = 0; d < nd; d++) {
          const side = r.int(0, 3);
          if (side < 2) rm.doors.add((x0 + r.int(2, w - 3)) + ',' + (side ? rm.y1 : y0));
          else rm.doors.add((side === 2 ? x0 : rm.x1) + ',' + (y0 + r.int(2, h - 3)));
        }
      }
    }
    if (roomCache.size > 3000) roomCache.clear();
    roomCache.set(key, rm);
    return rm;
  }
  function roomAt(gx, gy) {
    const rm = roomCell(Math.floor(gx / RGW), Math.floor(gy / RGH));
    return rm && gx >= rm.x0 && gx <= rm.x1 && gy >= rm.y0 && gy <= rm.y1 ? rm : null;
  }
  function roomsIn(gx0, gy0, gx1, gy1) {
    const out = [];
    for (let j = Math.floor(gy0 / RGH); j <= Math.floor(gy1 / RGH); j++) for (let i = Math.floor(gx0 / RGW); i <= Math.floor(gx1 / RGW); i++) {
      const rm = roomCell(i, j);
      if (rm) out.push(rm);
    }
    return out;
  }

  /** Material of a cell (cheap enough for props; chunks use the same rules with the glyph choice). */
  function matOf(gx, gy) {
    const rm = roomAt(gx, gy);
    if (rm) return gx === rm.x0 || gx === rm.x1 || gy === rm.y0 || gy === rm.y1 ? RW : RF;
    const x = (gx + 0.5) * CW, y = (gy + 0.5) * CH;
    if (waterF(x, y) < WTH) return WA;
    if (roadDist(x, y) < RHW) return RD;
    if (rockF(x, y) > RTH) return RK;
    if (forestF(x, y) > FTH - 0.02) return FO;
    return GR;
  }
  const matAt = (x, y) => matOf(colOf(x), rowOf(y));

  /** Glyph + colours of one ground cell. Deterministic per cell, so chunk borders line up. */
  function cellAt(gx, gy, o) {
    const h = U.hashInt(gx, gy, 9001), r = (h & 1023) / 1024, r2 = ((h >>> 10) & 1023) / 1024, r3 = ((h >>> 20) & 1023) / 1024;
    o.ch = ' '; o.col = P.g1; o.bg = null; o.wat = 0;
    const rm = roomAt(gx, gy);
    if (rm) {
      const wall = gx === rm.x0 || gx === rm.x1 || gy === rm.y0 || gy === rm.y1;
      o.bg = P.rbg;
      if (!wall) { o.ch = '.'; o.col = r < 0.12 ? P.g3 : P.g2; if (r2 < 0.03) { o.ch = ','; o.col = P.g2; } return; }
      if (rm.doors.has(gx + ',' + gy)) { o.ch = '+'; o.col = P.a2; return; }
      if (rm.box) {
        const top = gy === rm.y0, bot = gy === rm.y1, lf = gx === rm.x0, rt = gx === rm.x1;
        o.ch = top && lf ? '╔' : top && rt ? '╗' : bot && lf ? '╚' : bot && rt ? '╝' : top || bot ? '═' : '║';
        o.col = P.g3;
      } else {
        const ruin = hashf(gx, gy, rm.seed) < 0.13;
        o.ch = ruin ? (r2 < 0.5 ? '▒' : ',') : '#';
        o.col = ruin ? P.g2 : r3 < 0.2 ? P.g4 : P.g3;
      }
      return;
    }
    const x = (gx + 0.5) * CW, y = (gy + 0.5) * CH;
    const wv = waterF(x, y);
    const rd = roadDist(x, y);
    if (wv < WTH) {
      if (rd < RHW - 1) { o.ch = '='; o.col = r < 0.5 ? P.a2 : P.a1; o.bg = P.dbg; return; } // plank bridge
      const deep = wv < WTH - 0.07;
      o.wat = deep ? 2 : 1;
      o.bg = deep ? P.wbg2 : P.wbg;
      if (deep) { o.ch = r < 0.42 ? '≈' : r < 0.62 ? '~' : ' '; o.col = r2 < 0.3 ? P.c2 : P.c1; }
      else { o.ch = r < 0.5 ? '~' : ' '; o.col = r2 < 0.2 ? P.c2 : P.c1; }
      return;
    }
    if (wv < WTH + 0.02) { // sandy shore band
      o.ch = r < 0.35 ? '.' : r < 0.55 ? ',' : r < 0.62 ? '·' : ' ';
      o.col = r2 < 0.5 ? P.a1 : P.a0;
      return;
    }
    if (rd < RHW) {
      o.bg = P.dbg;
      o.ch = rd < 3.2 ? (r < 0.75 ? '·' : ':') : (r < 0.45 ? '.' : r < 0.7 ? ',' : r < 0.8 ? '\'' : ' ');
      o.col = r2 < 0.55 ? P.a1 : P.a0;
      return;
    }
    const rk = rockF(x, y);
    if (rk > RTH) {
      const d = rk - RTH;
      if (d < 0.022) { o.ch = '░'; o.col = P.g2; }
      else if (d < 0.045) { o.ch = '▒'; o.col = P.g2; }
      else if (d < 0.075) { o.ch = r < 0.12 ? '▲' : '▓'; o.col = r < 0.12 ? P.g3 : P.g1; }
      else { o.ch = r < 0.05 ? '▲' : '█'; o.col = r < 0.05 ? P.g2 : P.g0; }
      return;
    }
    const lit = glowF(x, y);
    const shift = lit > 0.6 ? -1 : lit < 0.4 ? 1 : 0;
    const F = forestF(x, y);
    if (F > FTH - 0.02) {
      const dens = U.smoothstep(FTH - 0.02, FTH + 0.09, F);
      if (dens > 0.35) o.bg = P.fbg;
      if (r < 0.08 + dens * 0.4) {
        o.ch = r2 < 0.42 ? '♣' : r2 < 0.78 ? '♠' : '^';
        o.col = fc('g', (r3 < 0.18 ? 3 : 4) + (dens < 0.3 ? 1 : 0) + Math.max(0, shift));
      } else if (r < 0.5) { o.ch = r2 < 0.5 ? '.' : ','; o.col = P.g1; }
      return;
    }
    // grass: sparse dim ticks, denser '"' meadows, rare amber flowers
    const m = meadowF(x, y);
    if (r < 0.006) { o.ch = '*'; o.col = r2 < 0.5 ? P.a2 : P.a1; return; }
    if (r < 0.0085) { o.ch = '♦'; o.col = P.r1; return; }
    const dens = 0.08 + m * 0.36;
    if (r2 > dens) return;
    if (m > 0.58) { o.ch = r3 < 0.45 ? '"' : r3 < 0.7 ? ',' : r3 < 0.85 ? ';' : '\''; o.col = fc('g', (r < 0.25 ? 3 : 4) + shift); }
    else { o.ch = r3 < 0.4 ? '.' : r3 < 0.62 ? ',' : r3 < 0.8 ? '\'' : r3 < 0.9 ? '`' : '"'; o.col = fc('g', (r < 0.38 ? 4 : 5) + shift); }
  }

  /* ---------- ground chunks ---------- */
  const waterMap = new Map();
  function* paintChunk(ctx, info) {
    const res = info.res, N = info.px;
    const A = atlasFor(CW * res, CH * res, false);
    const ox = R(info.wx * res), oy = R(info.wy * res);
    const c0 = info.wx / CW - 1, r0 = info.wy / CH - 1, W = NX + 2, H = NY + 2;
    const chs = new Array(W * H), cols = new Array(W * H), bgs = new Array(W * H);
    const water = [];
    const o = {};
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        cellAt(c0 + i, r0 + j, o);
        const k = j * W + i;
        chs[k] = o.ch; cols[k] = o.col; bgs[k] = o.bg;
        if (o.wat && i > 0 && j > 0 && i < W - 1 && j < H - 1) water.push(c0 + i, r0 + j, o.wat);
      }
      if ((j & 3) === 3) yield;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, N, N);
    const PX = (c) => R(c * CW * res) - ox, PY = (r) => R(r * CH * res) - oy;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const b = bgs[j * W + i];
      if (!b) continue;
      ctx.fillStyle = b;
      const x = PX(c0 + i), y = PY(r0 + j);
      ctx.fillRect(x, y, PX(c0 + i + 1) - x, PY(r0 + j + 1) - y);
    }
    yield;
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const k = j * W + i, ch = chs[k];
        if (ch === ' ') continue;
        const s = A.get(ch, cols[k], 0);
        ctx.drawImage(s.c, s.sx, s.sy, A.sw, A.sh, PX(c0 + i) - A.pad, PY(r0 + j) - A.pad, A.sw, A.sh);
      }
      if ((j & 7) === 7) yield;
    }
    ctx.restore();
    if (waterMap.size > 200) waterMap.clear();
    waterMap.set(info.cx + ',' + info.cy, water.length ? Int32Array.from(water) : null);
  }

  /* =====================================================================
     Characters – multi-glyph sprites (facing right; left = mirrored glyphs)
     ===================================================================== */
  // main character: an '@' adventurer, 3 × 3 cells
  const HERO_ARMS = ['/█\\', '-█\\', '/█\\', '/█-'];
  const HERO_LEGS = ['/ \\', ' |\\', '/ \\', '/| '];
  function heroDef(frame, arm, dash) {
    let arms = dash ? '-█=' : HERO_ARMS[frame];
    if (arm) arms = arms.slice(0, 2) + arm;
    const legs = dash ? '/ >' : HERO_LEGS[frame];
    return { g: [' @ ', arms, legs], k: ['.H.', 'AaA', [...legs].map((c) => (c === ' ' ? 'K' : 'a')).join('')] };
  }
  // small creature: a glyph critter, 3 × 2 cells, two variants
  const CRAWL = [
    { g: [['(ö)', '/"\\'], ['(ö)', '\\"/']], k: ['gWg', 'dgd'] },
    { g: [['{x}', '/ \\'], ['{x}', '| |']], k: ['gRg', 'dKd'] },
  ];
  // fast creature: a flickering '*' spirit, 3 × 1 cells + glyph tail
  const SPIRIT = ['(*)', '{+}', '(×)', '<*>', '{x}', '(+)'];
  // large creature: a block-letter brute, 6 × 4 cells
  const BRUTE = {
    g: [['▀▄   ▄▀', '▄█O█O█▄', '█▀vvv▀█', '▀ █ █ ▀'], ['▀▄   ▄▀', '▄█O█O█▄', '█▀vvv▀█', ' █ ▀ █ ']],
    k: [['SRKKKRS', 'RRHRHRR', 'RRYYYRR', 'rKrKrKr'], ['SRKKKRS', 'RRHRHRR', 'RRYYYRR', 'KrKrKrK']],
  };
  const CREATURE_FAM = { creeper: 'g', ghost: 'c', colossus: 'r' };
  function enemyDef(e, frame) {
    if (e.type === 'colossus') return { g: BRUTE.g[frame & 1], k: BRUTE.k[frame & 1] };
    if (e.type === 'ghost') return { g: [SPIRIT[frame % SPIRIT.length]], k: ['bCb'] };
    const v = CRAWL[e.seed < 0.55 ? 0 : 1];
    return { g: v.g[frame & 1], k: v.k };
  }
  const flipDef = (d, left) => (left ? { g: mirror(d.g), k: mirrorK(d.k) } : d);

  /* =====================================================================
     Props – glyph art on plates, anchored on their bottom-centre cell
     ===================================================================== */
  const PROPS = {
    pine: { g: ['  ^  ', ' ^^^ ', '^^^^^', ' ^^^ ', '^^^^^', '  ║  '], k: ['..G..', '.ggg.', 'ddgdd', '.ddd.', 'eddde', '..w..'] },
    oak: { g: [' .&&. ', '(&&&&)', '(&%&&)', ' `||` '], k: ['.dggd.', 'dgdgdd', 'ddgddd', '.ewwe.'] },
    bush: { g: [' ,, ', '(&&)'], k: ['.dd.', 'eddd'] },
    rock: { g: [' .--. ', '(.░▒▓)', '`----´'], k: ['.dddd.', 'ddeeff', 'eeeeee'] },
    monolith: { g: [' ▲ ', '▐■▌', '▐▒▌', '▐▒▌', '▄█▄'], k: ['.d.', 'ece', 'ede', 'ede', 'fef'] },
    sign: { g: ['┌───┐', '│>_ │', '└─┬─┘', '  │  '], k: ['wwwww', 'wAYKw', 'wwwww', '..w..'] },
    wall: { g: ['# ##', '####'], k: ['dKdd', 'dddd'] },
    wall1: { g: ['## ', '###', '###'], k: ['dd.', 'ddd', 'ddd'] },
    fire: { g: [' , ', ')▲(', '=#='], k: ['YYY', 'AHA', 'waw'] },
    stairs: { g: ['>'], k: ['c'] },
    chest: { g: ['[=]'], k: ['aAa'] },
  };
  // which colour keys of a prop emit light (everything else is drawn without bloom)
  const PROP_GLOW = { pine: 'G', oak: '', bush: '', rock: '', monolith: 'c', sign: 'AY', wall: '', wall1: '', fire: 'AHY', stairs: 'c', chest: 'A' };
  const FIRE_FL = [[' , ', ')▲('], [" ' ", '(▲)'], ['  ,', ')▲('], ['`  ', '(^)']];
  const firesMap = new Map();

  /* =====================================================================
     Icons – glyph art on a little phosphor screen
     ===================================================================== */
  const ICON_DEF = {
    kills: { g: ['(ö)', '/"\\'], k: ['gWg', 'dgd'] },
    'hp-heart': { g: ['♥'], k: ['R'] },
    dmg: { g: ['\\|/', '-*-', '/|\\'], k: ['aYa', 'YHY', 'aYa'] },
    rate: { g: ['»»»'], k: ['aAH'] },
    multi: { g: ['*  ', ' * ', '  *'], k: ['A..', '.Y.', '..H'] },
    bounce: { g: [' /\\ ', '/  *'], k: ['.aa.', 'a..H'] },
    lantern: { g: ['.-.', '(☼)', '\'-\''], k: ['aaa', 'aHa', 'aaa'] },
    speed: { g: ['-=@'], k: ['waH'] },
    magnet: { g: ['>◆<'], k: ['AcA'] },
    hp: { g: ['♥+'], k: ['Rg'] },
  };
  const ICONS = new Map();
  function iconCanvas(id, size) {
    const key = id + size + (fontOK ? 'f' : '');
    if (ICONS.has(key)) return ICONS.get(key);
    const def = ICON_DEF[id] || { g: ['?'], k: ['g'] };
    const { c, ctx: g } = U.canvas(size, size);
    const w = Math.max(...def.g.map((r) => [...r].length)), h = def.g.length;
    let cw = (size * 0.86) / Math.max(w, 2.2), ch = Math.min((size * 0.98) / h, (cw / 0.6) * 1.3);
    if (ch < cw / 0.6) cw = ch * 0.6;
    const x0 = (size - cw * w) / 2, y0 = (size - ch * h) / 2;
    for (let pass = 0; pass < 2; pass++) {
      g.save();
      def.g.forEach((row, j) => [...row].forEach((chr, i) => {
        const k = def.k[j][i];
        if (!k || k === '.' || chr === ' ') return;
        const col = KEY[k] || P.g4;
        g.fillStyle = col;
        if (pass === 0) { g.shadowColor = col; g.shadowBlur = Math.min(ch * 0.45, size * 0.07); }
        paintGlyph(g, chr, x0 + i * cw, y0 + j * ch, cw, ch, true);
      }));
      g.restore();
    }
    if (ICONS.size > 60) ICONS.clear();
    ICONS.set(key, c);
    return c;
  }

  /* =====================================================================
     HUD (CSS) – terminal windows, block bars, prompts, blinking cursors
     ===================================================================== */
  const B = 'body.style-terminal';
  const VT = `'VT323', 'Share Tech Mono', monospace`;
  const PX = `'IBM Plex Mono', 'Share Tech Mono', monospace`;
  const GLOW = 'text-shadow: 0 0 6px rgba(77,219,118,.75), 0 0 16px rgba(77,219,118,.25);';
  const AGLOW = 'text-shadow: 0 0 6px rgba(255,178,56,.8), 0 0 18px rgba(255,178,56,.3);';
  const SCAN = 'repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 1px, transparent 1px 3px)';
  const WIN = `background: ${SCAN}, rgba(2,10,5,.9); border: 2px solid #2a994b; border-radius: 0; box-shadow: 0 0 0 3px #020a05, 0 0 14px rgba(77,219,118,.28), inset 0 0 18px rgba(77,219,118,.12);`;
  const CSS = `
${B} { font-family: ${VT}; color: #4ddb76; }
${B} #hud { padding: 16px 22px; }
${B} #hud .xp { height: 18px; margin: 0 92px 0 64px; border: 0; border-radius: 0; overflow: visible; background:
  repeating-linear-gradient(90deg, rgba(42,153,75,.38) 0 2px, transparent 2px 10px) 0 50% / 100% 2px no-repeat, rgba(2,10,5,.85);
  box-shadow: 0 0 0 2px #1a6331, 0 0 0 4px #020a05; }
${B} #hud .xp::before { content: 'BUF'; position: absolute; left: -64px; top: 50%; transform: translateY(-50%); font: 24px/1 ${VT}; color: #2a994b; ${GLOW} }
${B} #hud .xp-fill { background: repeating-linear-gradient(90deg, #4ddb76 0 8px, transparent 8px 10px); filter: drop-shadow(0 0 4px rgba(77,219,118,.85)); transition: none; }
${B} #hud .lvl { right: -92px; font: 26px/1 ${VT}; color: #a3ffbd; ${GLOW} }
${B} #hud .lvl::before { content: '['; color: #2a994b; }
${B} #hud .lvl::after { content: ']'; color: #2a994b; }
${B} #hud .topline { margin-top: 20px; align-items: flex-start; }
${B} #hud .hp { position: relative; ${WIN} padding: 16px 16px 10px; gap: 12px; }
${B} #hud .hp::before { content: ' PWR '; position: absolute; left: 12px; top: -12px; padding: 0 6px; background: #020a05; font: 20px/1 ${VT}; color: #ffb238; ${AGLOW} }
${B} #hud .hp-icon { width: 30px; height: 30px; }
${B} #hud .hp-bar { width: 210px; height: 18px; border: 0; border-radius: 0; background: repeating-linear-gradient(90deg, rgba(122,74,14,.55) 0 8px, transparent 8px 10px); }
${B} #hud .hp-fill { background: repeating-linear-gradient(90deg, #ffb238 0 8px, transparent 8px 10px); filter: drop-shadow(0 0 5px rgba(255,178,56,.8)); transition: none; }
${B} #hud .hp-text { font: 26px/1 ${VT}; color: #ffd98e; ${AGLOW} min-width: 84px; }
${B}.hurt #hud .hp { border-color: #ff4257; animation: termblink .12s steps(1) infinite; }
${B}.hurt #hud .hp-fill { background: repeating-linear-gradient(90deg, #ff4257 0 8px, transparent 8px 10px); }
${B} #hud .clock { position: relative; ${WIN} padding: 8px 22px 8px; gap: 2px; min-width: 190px; }
${B} #hud .clock-time { font: 52px/0.95 ${VT}; letter-spacing: 2px; color: #a3ffbd; ${GLOW} }
${B} #hud .clock-time::after { content: '\\2588'; font-size: .55em; margin-left: 4px; vertical-align: 6%; color: #4ddb76; animation: termblink 1.06s steps(1) infinite; }
${B} #hud .clock-label { font: 500 11px/1.4 ${PX}; letter-spacing: 3px; color: #2a994b; opacity: 1; text-transform: uppercase; }
${B} #hud .clock-label::before { content: '> '; color: #ffb238; }
${B} #hud .kills { position: relative; ${WIN} padding: 10px 16px; gap: 10px; min-width: 0; font: 36px/1 ${VT}; color: #a3ffbd; ${GLOW} }
${B} #hud .kills-icon { width: 40px; height: 40px; }
${B} #hud .kills-num::before { content: '\\00d7'; margin-right: 6px; color: #2a994b; }
${B} #stylebar { ${WIN} padding: 8px 18px; gap: 14px; bottom: 16px; font-family: ${VT}; }
${B} #stylebar .style-family { font: 500 11px ${PX}; letter-spacing: 2px; color: #2a994b; opacity: 1; text-transform: uppercase; }
${B} #stylebar .style-family::before { content: '$ '; color: #ffb238; }
${B} #stylebar .style-name { font: 26px/1 ${VT}; color: #a3ffbd; ${GLOW} }
${B} #stylebar .style-name::after { content: '_'; margin-left: 2px; color: #ffb238; animation: termblink 1.06s steps(1) infinite; }
${B} #stylebar .style-hint { font: 12px ${PX}; color: #1f9944; opacity: 1; }
${B} #stylebar .auto.on { color: #ffb238; }
${B} #levelup { background: ${SCAN}, radial-gradient(ellipse at 50% 45%, rgba(4,26,12,.4), rgba(1,6,3,.66)); gap: 26px; }
${B} #levelup .lu-title { font-size: 0; text-shadow: none; }
${B} #levelup .lu-title::before { content: '> SELECT ONE'; font: 64px/1 ${VT}; letter-spacing: 4px; color: #a3ffbd; ${GLOW} }
${B} #levelup .lu-title::after { content: '\\2588'; font: 38px/1 ${VT}; margin-left: 10px; vertical-align: 8%; color: #4ddb76; ${GLOW} animation: termblink 1.06s steps(1) infinite; }
${B} #levelup .lu-cards { gap: 30px; }
${B} #levelup .card { ${WIN} width: 236px; min-height: 290px; padding: 48px 18px 20px; gap: 10px; transition: none; }
${B} #levelup .card::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 26px; background: #2a994b; box-shadow: 0 0 12px rgba(77,219,118,.45); }
${B} #levelup .card:hover { transform: none; border-color: #ffb238; box-shadow: 0 0 0 3px #020a05, 0 0 22px rgba(255,178,56,.45), inset 0 0 22px rgba(255,178,56,.12); }
${B} #levelup .card:hover::before { background: #ffb238; }
${B} #levelup .card-icon { width: 96px; height: 96px; }
${B} #levelup .card-name { font: 30px/1 ${VT}; color: #a3ffbd; ${GLOW} text-transform: uppercase; letter-spacing: 1px; }
${B} #levelup .card:hover .card-name { color: #020a05; background: #ffd98e; text-shadow: none; padding: 0 6px; }
${B} #levelup .card-desc { font: 13px/1.45 ${PX}; color: #4ddb76; opacity: .92; }
${B} #levelup .card-key { top: 3px; left: 10px; font: 22px/1 ${VT}; color: #020a05; opacity: 1; }
${B} #levelup .card-key::before { content: '['; }
${B} #levelup .card-key::after { content: ']'; }
${B} #levelup .lu-hint { font: 14px ${PX}; color: #2a994b; opacity: 1; letter-spacing: 1px; }
${B} #levelup .lu-hint::before { content: '> '; color: #ffb238; }
${B} #gameover { background: ${SCAN}, rgba(1,6,3,.9); gap: 16px; }
${B} #gameover .go-title { font-size: 0; }
${B} #gameover .go-title::before { content: '*** SIGNAL LOST ***'; font: 72px/1 ${VT}; color: #ff4257; text-shadow: 0 0 8px rgba(255,66,87,.8), 0 0 24px rgba(255,66,87,.35); }
${B} #gameover .go-stats { ${WIN} padding: 14px 22px; font: 15px/1.6 ${PX}; color: #4ddb76; }
${B} #gameover .go-hint { font: 28px ${VT}; color: #ffb238; ${AGLOW} animation: termblink 1.06s steps(1) infinite; }
${B} #pausebox { ${WIN} font: 52px ${VT}; padding: 12px 34px; color: #a3ffbd; ${GLOW} }
${B} #pausebox::after { content: '_'; animation: termblink 1.06s steps(1) infinite; }
@keyframes termblink { 0% { opacity: 1; } 50% { opacity: 0; } }
`;

  /* =====================================================================
     Atmosphere buffers (bloom, CRT mask)
     ===================================================================== */
  let CRT = null, CRTkey = '', SCANPAT = null, SCANkey = '';
  let tearT = -9, tearDur = 0, tearReq = 0;
  function buildCRT(W, H) {
    const { c, ctx: g } = U.canvas(W, H);
    const rg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.55);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(0.55, 'rgba(0,0,0,0.16)');
    rg.addColorStop(0.85, 'rgba(0,0,0,0.5)');
    rg.addColorStop(1, 'rgba(0,0,0,0.82)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    // edge falloff (barrel curvature): darker bands hugging each edge
    const e = Math.min(W, H) * 0.06;
    const edge = (x0, y0, x1, y1, w, h) => {
      const lg = g.createLinearGradient(x0, y0, x1, y1);
      lg.addColorStop(0, 'rgba(0,0,0,0.55)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = lg; g.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h);
    };
    edge(0, 0, 0, e, W, e); edge(0, H, 0, H - e, W, e); edge(0, 0, e, 0, e, H); edge(W, 0, W - e, 0, e, H);
    // rounded screen corners
    const r = Math.min(W, H) * 0.075, m = Math.max(1, Math.min(W, H) * 0.004);
    g.fillStyle = '#000';
    g.beginPath();
    g.rect(0, 0, W, H);
    g.moveTo(m + r, m);
    g.arcTo(W - m, m, W - m, H - m, r); g.arcTo(W - m, H - m, m, H - m, r);
    g.arcTo(m, H - m, m, m, r); g.arcTo(m, m, W - m, m, r);
    g.closePath();
    g.fill('evenodd');
    // faint glass reflection, top left
    const gl = g.createRadialGradient(W * 0.28, H * 0.16, 0, W * 0.28, H * 0.16, H * 0.6);
    gl.addColorStop(0, 'rgba(200,255,220,0.045)'); gl.addColorStop(1, 'rgba(200,255,220,0)');
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
    return c;
  }

  /* =====================================================================
     The style
     ===================================================================== */
  const GLOWS = {};
  function radial(col, a) {
    return U.sprite(64, 64, (g) => {
      const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, U.rgb(U.hex(col), a)); rg.addColorStop(0.5, U.rgb(U.hex(col), a * 0.35)); rg.addColorStop(1, U.rgb(U.hex(col), 0));
      g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    });
  }
  const famOfEnemy = (e) => CREATURE_FAM[e.type] || 'g';
  const top = (e) => (e.type === 'colossus' ? 4 : e.type === 'ghost' ? 1.5 : 2) * CH;

  function glyphP(game, o) {
    return game.addParticle(Object.assign({ kind: 'glyph', drag: 2.5, life: 0.5 }, o));
  }
  function burstGlyphs(game, x, y, z, n, chars, fam, lv, speed, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * U.TAU, s = speed * (0.45 + Math.random() * 0.7);
      glyphP(game, { x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.65, ch: chars[(Math.random() * chars.length) | 0], fam, lv, life: life * (0.7 + Math.random() * 0.5) });
    }
  }

  /* ---------- cached defs and sprite states (no per-frame allocation) ---------- */
  const DEFS = new Map();
  function heroDefC(frame, arm, dash, left) {
    const key = 'h' + frame + arm + (dash ? 'd' : '') + (left ? 'l' : 'r');
    let d = DEFS.get(key);
    if (!d) DEFS.set(key, (d = flipDef(heroDef(frame, arm, dash), left)));
    return d;
  }
  function enemyDefC(type, variant, frame, left) {
    const key = type + variant + frame + (left ? 'l' : 'r');
    let d = DEFS.get(key);
    if (!d) DEFS.set(key, (d = flipDef(enemyDef({ type, seed: variant ? 0.9 : 0.1 }, frame), left && type !== 'ghost')));
    return d;
  }
  const HERO_PAL = {
    N: null,
    D: { col: (k) => (k === 'H' ? P.a5 : P.a4) },
    L: { col: (k) => (k === 'H' ? P.c4 : P.c3) },
    B: { col: (k) => (k === 'H' ? P.a3 : P.a1), dim: true },
  };
  function heroSprite(frame, arm, dash, left, pal) {
    return sprite('hero' + frame + arm + (dash ? 'd' : '') + (left ? 'l' : 'r') + pal, () => ({ def: heroDefC(frame, arm, dash, left), opt: HERO_PAL[pal] }));
  }
  function enemySprite(type, variant, frame, left, inv) {
    const fam = CREATURE_FAM[type] || 'g', gh = type === 'ghost';
    return sprite('e' + type + variant + frame + (left && !gh ? 'l' : 'r') + (inv ? 'i' : ''),
      () => ({ def: enemyDefC(type, variant, frame, left), opt: inv ? { inv: true, col: (k) => (k === 'K' ? P.plate : fc(fam, 0)) } : null }));
  }
  /** One-time bake of the glyph slots and sprite states every scene needs, so frames never stall on first use. */
  function warmUp(A) {
    const fams = ['g', 'a', 'c', 'r'];
    for (const f of fams) for (let lv = 0; lv < 4; lv++) for (const ch of '*+x\'`·.▒░#') { A.get(ch, fc(f, lv), 1); A.get(ch, fc(f, lv + 1), 3); }
    for (const col of [P.g6, P.g5, P.a5, P.a3]) for (const ch of '0123456789!.·') A.get(ch, col, 1);
    for (const ch of '-\\|/*') A.get(ch, P.a3, 1);
    A.get('*', P.a5, 1); A.get('·', P.a2, 3); A.get('▁', P.a3, 1);
    for (const ch of '◆◇[]+·') { A.get(ch, P.c3, 1); A.get(ch, P.c4, 1); A.get(ch, P.c2, 1); }
    for (const ch of '()|/-\\') { A.get(ch, P.a2, 1); A.get(ch, P.a5, 1); }
    for (let k = 1; k < 5; k++) for (const ch of '+·.') A.get(ch, fc('c', k), 3);
    for (const ch of SCRAMBLE) { for (const f of ['g', 'c', 'r']) A.get(ch, fc(f, 3), 3); A.get(ch, P.r2, 1); A.get(ch, P.r3, 1); }
    for (const f of ['g', 'c', 'r']) for (let lv = 0; lv < 5; lv++) for (const ch of '▓▒░·.') A.get(ch, fc(f, lv), 1);
    const warmDone = SPRITES.size;
    for (let f = 0; f < 4; f++) for (const l of [false, true]) { heroSprite(f, '', false, l, 'N'); if (!f) { heroSprite(0, '', true, l, 'D'); heroSprite(0, '', false, l, 'L'); } }
    for (const l of [false, true]) for (let f = 0; f < 2; f++) for (const inv of [false, true]) {
      enemySprite('creeper', 0, f, l, inv); enemySprite('creeper', 1, f, l, inv); enemySprite('colossus', '', f, l, inv);
    }
    for (let f = 0; f < SPIRIT.length; f++) { enemySprite('ghost', '', f, false, false); enemySprite('ghost', '', f, false, true); }
    return SPRITES.size - warmDone;
  }

  const st = {
    id: 'terminal',
    name: 'Terminal ASCII',
    family: 'Text Mode · CRT',
    description: 'The world as text on a green phosphor screen: glyph meadows, @-adventurer, block-letter brutes, typed-out effects, scanlines and bloom.',
    groundColor: P.bg,
    chunkSize: CHUNK,
    groundResMax: 4,
    fonts: ['VT323', 'IBM+Plex+Mono:wght@400;500;600'],
    css: CSS,

    init() {
      ensureFontLink();
      fontTick();
      GLOWS.amber = radial(P.a3, 0.5);
      GLOWS.green = radial(P.g4, 0.4);
      GLOWS.cyan = radial(P.c3, 0.45);
      GLOWS.red = radial(P.r2, 0.5);
    },

    *renderGroundChunk(ctx, info) {
      fontTick();
      if (!fontOK) { staleChunks.push({ ctx, info }); if (staleChunks.length > 160) staleChunks.shift(); }
      yield* paintChunk(ctx, info);
    },

    propsForChunk(info) {
      const out = [];
      const gx0 = Math.floor(info.wx / CW), gy0 = Math.floor(info.wy / CH);
      const gx1 = Math.floor((info.wx + info.size) / CW) - 1, gy1 = Math.floor((info.wy + info.size) / CH) - 1;
      const snap = (x, y) => ({ x: (colOf(x) + 0.5) * CW, y: (rowOf(y) + 0.5) * CH });
      const clear = (x, y, wc, hc, allowed) => {
        const c = colOf(x), r = rowOf(y);
        for (const [dc, dr] of [[0, 0], [-wc, 0], [wc, 0], [0, -hc], [-wc, -hc], [wc, -hc]]) if (!allowed.includes(matOf(c + dc, r + dr))) return false;
        return true;
      };
      const fires = [];
      // trees: dense in forests, lonely in meadows
      G.scatterOwned(info, 42, 6101, (x, y, rng) => {
        if (G.nearSpawn(x, y, 100)) return;
        const F = forestF(x, y), roll = rng.next();
        const p = F > FTH + 0.03 ? 0.42 : F > FTH - 0.02 ? 0.16 : 0.012;
        if (roll >= p) return;
        if (!clear(x, y, 3, 5, [GR, FO])) return;
        const s = snap(x, y);
        out.push({ x: s.x, y: s.y, t: rng.next() < 0.62 ? 'pine' : 'oak', f: rng.next() < 0.5, pad: 80 });
      });
      G.scatterOwned(info, 60, 6203, (x, y, rng) => {
        if (G.nearSpawn(x, y, 80) || rng.next() > 0.075) return;
        if (!clear(x, y, 2, 1, [GR, FO])) return;
        const s = snap(x, y);
        out.push({ x: s.x, y: s.y, t: 'bush', f: rng.next() < 0.5, pad: 30 });
      });
      G.scatterOwned(info, 80, 6307, (x, y, rng) => {
        if (G.nearSpawn(x, y, 80)) return;
        const rk = rockF(x, y);
        if (rng.next() > (rk > RTH - 0.06 ? 0.4 : 0.05)) return;
        if (!clear(x, y, 3, 2, [GR, FO, RD])) return;
        const s = snap(x, y);
        out.push({ x: s.x, y: s.y, t: 'rock', f: rng.next() < 0.5, pad: 30 });
      });
      G.scatterOwned(info, 260, 6401, (x, y, rng) => {
        if (G.nearSpawn(x, y, 120) || rng.next() > 0.3) return;
        if (!clear(x, y, 2, 5, [GR])) return;
        const s = snap(x, y);
        out.push({ x: s.x, y: s.y, t: 'monolith', ph: rng.next(), pad: 60 });
      });
      G.scatterOwned(info, 170, 6503, (x, y, rng) => {
        if (G.nearSpawn(x, y, 110) || rng.next() > 0.28) return;
        if (!clear(x, y, 2, 3, [GR, FO])) return;
        const s = snap(x, y);
        out.push({ x: s.x, y: s.y, t: 'wall', i: rng.next() < 0.5 ? 1 : 0, f: rng.next() < 0.5, pad: 40 });
      });
      // signs next to the dotted roads
      G.scatterOwned(info, 190, 6607, (x, y, rng) => {
        if (G.nearSpawn(x, y, 100) || rng.next() > 0.45) return;
        const fA = Math.abs(sdOf(pathA, x, y)) < Math.abs(sdOf(pathB, x, y)) ? pathA : pathB;
        const e = 6, n = fA(x, y), gx = (fA(x + e, y) - fA(x - e, y)) / (2 * e), gy = (fA(x, y + e) - fA(x, y - e)) / (2 * e);
        const gl = Math.hypot(gx, gy);
        if (gl < 1e-6) return;
        const sd = n / gl;
        if (Math.abs(sd) > 90) return;
        const sg = sd < 0 ? -1 : 1, mv = sd - sg * (RHW + 12);
        const s = snap(x - (gx / gl) * mv, y - (gy / gl) * mv);
        if (s.x < info.wx || s.x >= info.wx + info.size || s.y < info.wy || s.y >= info.wy + info.size) return;
        if (G.nearSpawn(s.x, s.y, 100) || !clear(s.x, s.y, 3, 4, [GR, FO])) return;
        out.push({ x: s.x, y: s.y, t: 'sign', pad: 40 });
      });
      // campfires in the open, rare
      G.scatterOwned(info, 300, 6709, (x, y, rng) => {
        if (G.nearSpawn(x, y, 110) || rng.next() > 0.16) return;
        if (!clear(x, y, 2, 2, [GR])) return;
        const s = snap(x, y);
        out.push({ x: s.x, y: s.y, t: 'fire', ph: rng.next(), pad: 40 });
        fires.push(s.x, s.y);
      });
      // furniture of the rooms (owned by the chunk that holds the room's centre)
      for (const rm of roomsIn(gx0 - RGW, gy0 - RGH, gx1 + RGW, gy1 + RGH)) {
        const cc = Math.floor((rm.x0 + rm.x1) / 2), cr = Math.floor((rm.y0 + rm.y1) / 2);
        if (cc < gx0 || cc > gx1 || cr < gy0 || cr > gy1) continue;
        const r = U.rng(rm.seed);
        const at = (c, rr) => ({ x: (c + 0.5) * CW, y: (rr + 0.5) * CH });
        if (r.next() < 0.6) { const p = at(cc, cr + 1); out.push({ x: p.x, y: p.y, t: 'fire', ph: r.next(), pad: 40 }); fires.push(p.x, p.y); }
        if (r.next() < 0.55) { const p = at(rm.x0 + 2 + r.int(0, 2), rm.y0 + 2); out.push({ x: p.x, y: p.y, t: 'stairs', ph: r.next(), pad: 20 }); }
        if (r.next() < 0.6) { const p = at(rm.x1 - 3 - r.int(0, 2), rm.y1 - 2); out.push({ x: p.x, y: p.y, t: 'chest', pad: 20 }); }
        if (r.next() < 0.4) { const p = at(rm.x0 + 3, rm.y1 - 1); out.push({ x: p.x, y: p.y, t: 'monolith', ph: r.next(), pad: 60 }); }
      }
      if (firesMap.size > 200) firesMap.clear();
      firesMap.set(info.cx + ',' + info.cy, fires);
      return out;
    },

    drawProp(ctx, pr, view) {
      setView(view);
      toScreen(ctx);
      const p = view.game && view.game.player;
      let s;
      switch (pr.t) {
        case 'pine': case 'oak': {
          const def = PROPS[pr.t];
          const hgt = def.g.length * CH;
          const behind = p && p.y < pr.y - 2 && p.y > pr.y - hgt && Math.abs(p.x - pr.x) < 22;
          s = sprite(pr.t + (pr.f ? 'L' : 'R') + (behind ? 'b' : ''), () => ({ def: pr.f ? flipDef(def, true) : def, opt: behind ? { noPlate: true, dim: true, col: (k) => fc('g', 'GgdewWf'.indexOf(k) >= 0 ? 4 : 5) } : { glow: 'Gg' } }));
          break;
        }
        case 'fire': {
          const f = Math.floor(RT * 7 + (pr.ph || 0) * 9) & 3;
          s = sprite('fire' + f, () => ({ def: { g: FIRE_FL[f].concat([PROPS.fire.g[2]]), k: PROPS.fire.k }, opt: { glow: 'AHY' } }));
          break;
        }
        case 'monolith': {
          const on = Math.floor(RT * 1.4 + (pr.ph || 0) * 4) % 3 !== 0;
          s = sprite('mono' + on, () => ({ def: PROPS.monolith, opt: { glow: on ? 'c' : '', col: (k) => (k === 'c' ? (on ? P.c3 : P.c1) : KEY[k]) } }));
          break;
        }
        case 'sign': {
          const on = Math.floor(RT / 0.53) & 1;
          s = sprite('sign' + on, () => ({ def: on ? PROPS.sign : { g: PROPS.sign.g, k: ['wwwww', 'wAKKw', 'wwwww', '..w..'] }, opt: { glow: 'AY' } }));
          break;
        }
        case 'stairs': {
          const lv = Math.floor(RT * 2 + (pr.ph || 0) * 5) % 4 === 0 ? 0 : 1;
          s = sprite('stairs' + lv, () => ({ def: PROPS.stairs, opt: { col: () => fc('c', lv) } }));
          break;
        }
        default: {
          const id = pr.t + (pr.i ? pr.i : '');
          const def = PROPS[id];
          if (!def) break;
          s = sprite(id + (pr.f ? 'L' : 'R'), () => ({ def: pr.f ? flipDef(def, true) : def, opt: { glow: PROP_GLOW[pr.t] || '' } }));
        }
      }
      if (s) put(ctx, s, pr.x, pr.y);
      toWorld(ctx);
    },

    drawShadow(ctx, o, view) {
      // terminals have no shadows – the main character stands on a blinking cursor instead
      if (o.kind !== 'player') return;
      setView(view);
      // the main character carries a faint amber lamp glow
      const rr = 52 * VS;
      ctx.save();
      toScreen(ctx);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16;
      ctx.drawImage(GLOWS.amber, o.x * VS + OX - rr, (o.y - 12) * VS + OY - rr * 0.7, rr * 2, rr * 1.4);
      ctx.restore();
      if ((Math.floor(view.rt / 0.53) & 1) && o.dashT <= 0) return;
      toScreen(ctx);
      const A = SA();
      const c = R(o.x / CW - 0.5), r = rowOf(o.y) + 1;
      cell(ctx, A, '▁', P.a3, 1, c, r);
      toWorld(ctx);
    },

    drawGroundOverlay(ctx, view, game) {
      setView(view);
      FR++;
      fontTick();
      // chunks that were built before the web font arrived are repainted in place, a few per frame
      for (let n = 0; n < 3 && repaint.length; n++) {
        const job = repaint.shift();
        try { const it = paintChunk(job.ctx, job.info); while (!it.next().done); } catch (e) { /* chunk gone */ }
      }
      const S = view.S;
      toScreen(ctx);
      // animated water: bright crests travel across the '~' cells
      const A = SA(), t = view.rt;
      const cx0 = Math.floor(view.x0 / CHUNK), cx1 = Math.floor(view.x1 / CHUNK), cy0 = Math.floor(view.y0 / CHUNK), cy1 = Math.floor(view.y1 / CHUNK);
      const c0 = colOf(view.x0) - 1, c1 = colOf(view.x1) + 1, r0 = rowOf(view.y0) - 1, r1 = rowOf(view.y1) + 1;
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const wv = waterMap.get(cx + ',' + cy);
        if (!wv) continue;
        for (let i = 0; i < wv.length; i += 3) {
          const gx = wv[i], gy = wv[i + 1];
          if (gx < c0 || gx > c1 || gy < r0 || gy > r1) continue;
          const ph = Math.sin(gx * 0.42 + gy * 1.1 - t * 1.9 + Math.sin(gy * 0.7 + t * 0.6) * 1.4);
          if (ph < 0.9) continue;
          const hi = ph > 0.975 && hashf(gx, gy, 77) < 0.5;
          cell(ctx, A, hi ? '≈' : '~', hi ? P.c3 : P.c2, hi ? 1 : 3, gx, gy, wv[i + 2] === 2 ? P.wbg2 : P.wbg);
        }
      }
      // warm light pools: campfires and the main character's own lamp glow
      ctx.globalCompositeOperation = 'lighter';
      for (let cy = cy0 - 1; cy <= cy1 + 1; cy++) for (let cx = cx0 - 1; cx <= cx1 + 1; cx++) {
        const fl = firesMap.get(cx + ',' + cy);
        if (!fl) continue;
        for (let i = 0; i < fl.length; i += 2) {
          const x = fl[i] * S + OX, y = (fl[i + 1] - 10) * S + OY, rr = (46 + Math.sin(t * 9 + fl[i]) * 3) * S;
          if (x < -rr || y < -rr || x > view.W + rr || y > view.H + rr) continue;
          ctx.globalAlpha = 0.5;
          ctx.drawImage(GLOWS.amber, x - rr, y - rr * 0.75, rr * 2, rr * 1.5);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      toWorld(ctx);
    },

    drawGem(ctx, g, view) {
      setView(view);
      toScreen(ctx);
      const A = SA();
      const c = colOf(g.x), r = rowOf(g.y - (g.pop > 0 ? Math.sin(g.pop * Math.PI) * 12 : 0));
      const blink = Math.floor(view.rt * 3 + g.seed * 6) % 5 === 0;
      if (g.pop > 0.5) { cell(ctx, A, g.pop > 0.8 ? '·' : '+', P.c3, 1, c, r); toWorld(ctx); return; }
      if (g.big) {
        cell(ctx, A, '[', P.c2, 1, c - 1, r, P.plate);
        cell(ctx, A, blink ? '◇' : '◆', blink ? P.c4 : P.c3, 1, c, r, P.plate);
        cell(ctx, A, ']', P.c2, 1, c + 1, r, P.plate);
      } else {
        cell(ctx, A, blink ? '◇' : '◆', blink ? P.c4 : P.c3, 1, c, r, P.plate);
      }
      if (g.fly) {
        const sp = Math.hypot(g.vx, g.vy) || 1;
        const tc = colOf(g.x - (g.vx / sp) * CW * 1.2), tr = rowOf(g.y - (g.vy / sp) * CH * 1.2);
        if (tc !== c || tr !== r) cell(ctx, A, '·', P.c2, 3, tc, tr);
      }
      toWorld(ctx);
    },

    drawPlayer(ctx, p, view) {
      setView(view);
      toScreen(ctx);
      const left = p.facing < 0;
      const dash = p.dashT > 0;
      const frame = p.moving && !dash ? Math.floor(p.anim * 0.45) & 3 : 0;
      let arm = '';
      if (p.shootT > 0.25 && !dash) {
        let a = p.aim;
        if (left) a = Math.PI - a;
        a = Math.atan2(Math.sin(a), Math.cos(a));
        arm = a < -1.1 ? '|' : a < -0.35 ? '/' : a < 0.35 ? '-' : a < 1.1 ? '\\' : '|';
        if (Math.cos(p.aim) * (left ? -1 : 1) < -0.2) arm = '';
      }
      const def = heroDefC(frame, arm, dash, left);
      // dash: afterimages fall down the density ramp ▓ ▒ ░
      if (dash) {
        const A = SA();
        ['▓', '▒', '░'].forEach((ch, k) => {
          const x = p.x - p.dashX * (k + 1) * 8, y = p.y - p.dashY * (k + 1) * 8;
          const l0 = R(x / CW - 1.5), t0 = rowOf(y) - 2;
          for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (def.g[j][i] !== ' ') cell(ctx, A, ch, fc('a', 2 + k), 3, l0 + i, t0 + j);
        });
      }
      const hurt = p.hurtT > 0.45;
      const lvl = p.levelT > 0 && (Math.floor(view.rt * 12) & 1);
      const blink = !hurt && p.iframes > 0 && (Math.floor(view.rt * 16) & 1);
      if (hurt) {
        // hit: the glyphs scramble to red noise for a moment
        const sd = Math.floor(view.rt * 24);
        drawCells(ctx, def, p.x, p.y, (i, j, ch) => {
          const h = hashf(i * 7 + j, sd, 31);
          return [h < 0.55 ? scr(i + j * 3, sd, 5) : ch, h < 0.3 ? P.r3 : P.r2, 1];
        }, P.plate);
      } else {
        put(ctx, heroSprite(frame, arm, dash, left, dash ? 'D' : lvl ? 'L' : blink ? 'B' : 'N'), p.x, p.y);
      }
      toWorld(ctx);
    },

    drawEnemy(ctx, e, view) {
      setView(view);
      toScreen(ctx);
      const left = e.facing < 0;
      const fam = famOfEnemy(e);
      const ghost = e.type === 'ghost', big = e.type === 'colossus';
      const frame = (ghost ? Math.floor(view.rt * 11 + e.seed * 13) % SPIRIT.length : Math.floor(e.anim * (big ? 0.5 : 0.8) + e.seed * 2) & 1) | 0;
      const variant = e.type === 'creeper' ? (e.seed < 0.55 ? 0 : 1) : '';
      const def = enemyDefC(e.type, variant, frame, left);
      const sid = (e.id || Math.floor(e.seed * 1e6)) | 0;
      // glyph tail of the fast creature: the cells it just left, fading out
      if (ghost && !e.dying) {
        const tr = e._tr || (e._tr = []);
        const c = colOf(e.x), r = rowOf(e.y);
        if (!tr.length || tr[0][0] !== c || tr[0][1] !== r) { tr.unshift([c, r]); if (tr.length > 5) tr.length = 5; }
        const A = SA();
        for (let k = 1; k < tr.length; k++) cell(ctx, A, k < 2 ? '+' : k < 4 ? '·' : '.', fc('c', k), 3, tr[k][0], tr[k][1]);
      }
      if (e.dying) {
        // dissolve: every cell drifts off its own way and decays down the shade ramp
        const t = U.clamp(e.deathT, 0, 1);
        const ramp = ['▓', '▒', '░', '·', '.'];
        drawCells(ctx, def, e.x, e.y, (i, j, ch, k) => {
          if (k === 'K') return null;
          const h1 = hashf(i + j * 9, sid, 3), h2 = hashf(i * 5 + j, sid, 4);
          if (t > 0.45 + h1 * 0.55) return null;
          const a = h2 * U.TAU, d = t * (1.5 + h1 * 2.5);
          const g = t < 0.18 ? ch : ramp[Math.min(4, Math.floor((t - 0.18) * 7 + h1 * 1.5))];
          return [g, t < 0.18 ? fc(fam, 0) : fc(fam, 1 + Math.floor(t * 3)), 1, R(Math.cos(a) * d), R(Math.sin(a) * d * 0.6 - t * 1.2)];
        });
        toWorld(ctx);
        return;
      }
      if (e.spawnT < 1) {
        // materialise: noise glyphs resolve into the creature, typed in cell by cell
        const t = e.spawnT, sd = Math.floor(view.rt * 20);
        const n = def.g.length * Math.max(...def.g.map((s) => [...s].length));
        drawCells(ctx, def, e.x, e.y, (i, j, ch, k) => {
          const w = [...def.g[0]].length, idx = j * w + i;
          const on = t > 0.25 + (idx / n) * 0.65;
          if (on) return k === 'K' ? [' ', P.plate, 0] : [ch, KEY[k] || fc(fam, 2), 1];
          if (t < 0.12 * (1 + hashf(i, j, sid))) return null;
          return [scr(idx, sd + sid, 9), fc(fam, 3), 3];
        }, P.plate);
        toWorld(ctx);
        return;
      }
      put(ctx, enemySprite(e.type, variant, frame, left, e.flash > 0.45), e.x, e.y);
      toWorld(ctx);
    },

    drawOrbital(ctx, o, view) {
      setView(view);
      toScreen(ctx);
      const A = SA();
      const spin = '|/-\\'[Math.floor(view.rt * 12 + o.idx * 2) & 3];
      const c = colOf(o.x), r = rowOf(o.y);
      // previous spot on the orbit as a fading spark
      const pa = o.angle - 0.35, pc = colOf(o.x - Math.cos(o.angle) * 44 + Math.cos(pa) * 44), prr = rowOf(o.y - Math.sin(o.angle) * 37.4 + Math.sin(pa) * 37.4);
      if (pc !== c || prr !== r) cell(ctx, A, '·', P.a2, 3, pc, prr);
      cell(ctx, A, '(', P.a2, 1, c - 1, r, P.plate);
      cell(ctx, A, spin, P.a5, 1, c, r, P.plate);
      cell(ctx, A, ')', P.a2, 1, c + 1, r, P.plate);
      toWorld(ctx);
    },

    drawProjectile(ctx, pr, view) {
      setView(view);
      toScreen(ctx);
      const A = SA();
      const sp = Math.hypot(pr.vx, pr.vy) || 1, ux = pr.vx / sp, uy = pr.vy / sp;
      const a = Math.atan2(uy, ux);
      const k = Math.round(((a + U.TAU) % Math.PI) / (Math.PI / 4)) % 4;
      const line = ['-', '\\', '|', '/'][k];
      const c = colOf(pr.x), r = rowOf(pr.y);
      let lc = c, lr = r;
      for (let i = 1; i <= 2; i++) {
        const tc = colOf(pr.x - ux * CW * 1.1 * i), tr = rowOf(pr.y - uy * CH * 0.9 * i);
        if ((tc === lc && tr === lr) || (tc === c && tr === r)) continue;
        cell(ctx, A, i === 1 ? line : '·', i === 1 ? P.a3 : P.a2, i === 1 ? 1 : 3, tc, tr);
        lc = tc; lr = tr;
      }
      cell(ctx, A, '*', P.a5, 1, c, r, P.plate);
      toWorld(ctx);
    },

    drawParticle(ctx, pt, view) {
      setView(view);
      toScreen(ctx);
      const A = SA();
      const life = U.clamp(pt.life / pt.max, 0, 1), age = 1 - life;
      const X = pt.x, Y = pt.y - (pt.z || 0);
      switch (pt.kind) {
        case 'glyph': {
          let ch = pt.ch || '*';
          if (life < 0.45 && !pt.keep) ch = SHADE[ch] || ch === '█' ? (life < 0.2 ? '░' : '▒') : life < 0.2 ? '.' : '·';
          cell(ctx, A, ch, fc(pt.fam || 'g', (pt.lv || 0) + Math.floor(age * 2.2)), life > 0.3 ? 1 : 3, colOf(X), rowOf(Y));
          break;
        }
        case 'ring': {
          // a ring of glyphs on the cell grid, growing outward
          const rad = U.lerp(pt.r0, pt.r1, U.ease.outQuad(age));
          const n = Math.max(8, Math.round((U.TAU * rad) / (CW * 1.3)));
          const seen = new Set();
          const col = fc(pt.fam || 'g', (pt.lv || 0) + Math.floor(age * 2.5));
          for (let i = 0; i < n; i++) {
            const a = (i / n) * U.TAU;
            const c = colOf(X + Math.cos(a) * rad), r = rowOf(Y + Math.sin(a) * rad * 0.6);
            const key = c * 9973 + r;
            if (seen.has(key)) continue;
            seen.add(key);
            cell(ctx, A, age > 0.6 ? '·' : pt.ch || '*', col, 1, c, r);
          }
          break;
        }
        case 'frame': {
          // box-drawing frame expanding from the cell grid around a point
          const k = 1 + Math.floor(U.ease.outQuad(age) * (pt.n || 5));
          const c = colOf(X), r = rowOf(Y), hw = k * 2, hh = k;
          const col = fc(pt.fam || 'c', (pt.lv || 0) + Math.floor(age * 2.5));
          for (let i = -hw + 1; i < hw; i++) { cell(ctx, A, '─', col, 1, c + i, r - hh); cell(ctx, A, '─', col, 1, c + i, r + hh); }
          for (let j = -hh + 1; j < hh; j++) { cell(ctx, A, '│', col, 1, c - hw, r + j); cell(ctx, A, '│', col, 1, c + hw, r + j); }
          cell(ctx, A, '┌', col, 1, c - hw, r - hh); cell(ctx, A, '┐', col, 1, c + hw, r - hh);
          cell(ctx, A, '└', col, 1, c - hw, r + hh); cell(ctx, A, '┘', col, 1, c + hw, r + hh);
          break;
        }
        case 'text': {
          // typed out, then scrambled away
          const str = pt.text || '';
          const shown = Math.min(str.length, Math.ceil(str.length * U.clamp(age / 0.3, 0, 1)));
          const c0 = colOf(X) - Math.floor(str.length / 2), r = rowOf(Y);
          const sd = Math.floor(view.rt * 20);
          for (let i = 0; i < shown; i++) {
            let ch = str[i];
            if (life < 0.25 && hashf(i, sd, 17) < (0.25 - life) * 5) ch = scr(i, sd, 3);
            cell(ctx, A, ch, fc(pt.fam || 'g', pt.lv || 0), 1, c0 + i, r, ch === ' ' ? null : P.plate);
          }
          if (shown < str.length && (Math.floor(view.rt * 16) & 1)) cell(ctx, A, '█', fc(pt.fam || 'g', 1), 1, c0 + shown, r);
          break;
        }
        default: {
          // anything else (e.g. bursts sent by another module): a phosphor dot snapped to the grid
          const q = quant(pt.color);
          const ch = (pt.size || 2) > 2.5 ? '*' : life > 0.5 ? '+' : '·';
          cell(ctx, A, ch, fc(q.fam, q.lv + Math.floor(age * 2)), life > 0.4 ? 1 : 3, colOf(X), rowOf(Y));
        }
      }
      toWorld(ctx);
    },

    drawNumber(ctx, n) {
      if (!LASTV) return;
      toScreen(ctx);
      const A = SA();
      const life = U.clamp(n.life / n.max, 0, 1), age = 1 - life;
      const str = String(n.value) + (n.crit ? '!' : '');
      const shown = Math.min(str.length, Math.ceil(str.length * U.clamp(age / 0.18, 0, 1)));
      const c0 = colOf(n.x) - Math.floor(str.length / 2), r = rowOf(n.y);
      const col = n.crit ? (life > 0.5 ? P.a5 : P.a3) : life > 0.5 ? P.g6 : P.g5;
      for (let i = 0; i < shown; i++) {
        const ch = life < 0.22 ? (i % 2 ? '.' : '·') : str[i];
        cell(ctx, A, ch, col, 1, c0 + i, r, life > 0.22 ? P.plate : null);
      }
      toWorld(ctx);
    },

    drawScreenOverlay(ctx, view) {
      const W = view.W, H = view.H;
      // impacts tear the picture along whole text rows
      if (tearReq) { tearT = view.rt; tearDur = tearReq; tearReq = 0; }
      const gt = view.rt - tearT;
      if (gt >= 0 && gt < tearDur) {
        const rowH = Math.max(2, CH * view.S), cwp = CW * view.S;
        const rng = U.rng(Math.floor(view.rt * 30) * 7919 + 3);
        const n = 2 + rng.int(0, 3);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        for (let i = 0; i < n; i++) {
          const y = R(rng.int(0, Math.floor(H / rowH)) * rowH + (OY % rowH)), h = R(rowH * rng.int(1, 3));
          const dx = R(cwp * rng.int(-2, 2) * (1 - gt / tearDur));
          if (dx) ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h);
        }
        ctx.restore();
      }
    },

    drawDisplayOverlay(ctx, view) {
      const W = view.displayW, H = view.displayH, t = view.rt;
      const key = W + 'x' + H;
      if (key !== CRTkey) { CRT = buildCRT(W, H); CRTkey = key; }
      const lp = Math.max(3, R(H / 300));
      if (SCANkey !== lp + key) {
        const c = U.sprite(4, lp, (g) => { g.fillStyle = 'rgba(0,0,0,0.42)'; g.fillRect(0, lp - Math.max(1, R(lp / 3)), 4, Math.max(1, R(lp / 3))); });
        SCANPAT = ctx.createPattern(c, 'repeat');
        SCANkey = lp + key;
      }
      // rolling refresh band
      const by = ((t / 7) % 1.4 - 0.2) * H, bh = H * 0.14;
      const lg = ctx.createLinearGradient(0, by - bh, 0, by + bh);
      lg.addColorStop(0, 'rgba(120,255,170,0)'); lg.addColorStop(0.5, 'rgba(120,255,170,0.035)'); lg.addColorStop(1, 'rgba(120,255,170,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = lg;
      ctx.fillRect(0, by - bh, W, bh * 2);
      ctx.globalCompositeOperation = 'source-over';
      // scanlines
      ctx.fillStyle = SCANPAT;
      ctx.fillRect(0, 0, W, H);
      // flicker: the whole tube breathes a few percent
      const fl = 0.012 + 0.03 * hashf(Math.floor(t * 30), 1, 9) + 0.02 * Math.max(0, Math.sin(t * 1.7));
      ctx.fillStyle = 'rgba(0,0,0,' + fl.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      // barrel vignette + rounded glass
      ctx.drawImage(CRT, 0, 0);
    },

    drawIcon(ctx, id, size) {
      fontTick();
      const c = iconCanvas(id, size);
      ctx.drawImage(c, 0, 0, size, size);
    },

    /* ---------- gameplay hooks → glyph bursts and typed text ---------- */
    onHit(game, e) {
      const fam = famOfEnemy(e), z = top(e) * 0.6;
      burstGlyphs(game, e.x, e.y, z, 2, '*+\'`', fam, 1, 55, 0.3);
      glyphP(game, { x: e.x, y: e.y, z, ch: '*', fam: 'a', lv: 0, life: 0.1, drag: 0 });
    },
    onKill(game, e) {
      const fam = famOfEnemy(e), big = e.type === 'colossus', z = top(e) * 0.5;
      // the creature's own glyphs fly apart
      const def = enemyDef(e, 0);
      const chars = def.g.join('').replace(/ /g, '') || '*';
      burstGlyphs(game, e.x, e.y, z, big ? 16 : 6, chars, fam, 1, big ? 90 : 70, 0.6);
      burstGlyphs(game, e.x, e.y, z, big ? 8 : 3, '*+x', fam, 0, big ? 120 : 90, 0.45);
      game.addParticle({ kind: 'ring', x: e.x, y: e.y, z, r0: 4, r1: big ? 46 : 22, ch: big ? '#' : '*', fam, lv: big ? 1 : 2, life: big ? 0.55 : 0.32, drag: 0 });
      if (big) {
        game.addParticle({ kind: 'ring', x: e.x, y: e.y, z, r0: 2, r1: 30, ch: '▓', fam: 'a', lv: 1, life: 0.4, drag: 0 });
        tearReq = 0.14;
      }
    },
    onHurt(game, p) {
      burstGlyphs(game, p.x, p.y, 16, 8, '#%&!?', 'r', 0, 80, 0.45);
      game.addParticle({ kind: 'text', x: p.x, y: p.y, z: 40, vy: -18, text: 'ERR', fam: 'r', lv: 1, life: 0.7, drag: 0 });
      tearReq = 0.22;
    },
    onPickup(game, g) {
      const p = game.player;
      glyphP(game, { x: p.x + (Math.random() - 0.5) * 10, y: p.y, z: 30, vy: -30, ch: '+', fam: 'c', lv: g.big ? 0 : 1, life: 0.4, drag: 0, keep: true });
      if (g.big) game.addParticle({ kind: 'ring', x: g.x, y: g.y, z: 4, r0: 3, r1: 18, ch: '◇', fam: 'c', lv: 1, life: 0.3, drag: 0 });
    },
    onShoot(game, pr) {
      glyphP(game, { x: pr.x + Math.cos(pr.angle) * 6, y: pr.y + 4, z: 4, ch: '\'', fam: 'a', lv: 1, life: 0.12, drag: 0 });
    },
    onDash(game, p) {
      for (let k = 0; k < 4; k++) {
        glyphP(game, { x: p.x - p.dashX * (6 + k * 7), y: p.y - p.dashY * (6 + k * 7), z: 6, ch: '»', fam: 'a', lv: 2 + (k >> 1), life: 0.3 + k * 0.05, drag: 0, keep: true });
      }
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'frame', x: p.x, y: p.y, z: 14, n: 5, fam: 'c', lv: 1, life: 0.7, drag: 0 });
      game.addParticle({ kind: 'text', x: p.x, y: p.y, z: 44, vy: -10, text: '[ OK ]', fam: 'c', lv: 1, life: 1.1, drag: 0 });
      for (let i = 0; i < 10; i++) {
        glyphP(game, { x: p.x + (i - 4.5) * 7, y: p.y, z: 4, vz: 0, vy: -40 - Math.random() * 50, ch: i % 3 ? '↑' : '▲', fam: i % 2 ? 'c' : 'a', lv: 1, life: 0.6 + Math.random() * 0.3, drag: 1.2, keep: true });
      }
    },
    onDeath(game, p) {
      burstGlyphs(game, p.x, p.y, 16, 24, '@#%&*!?▓▒', 'a', 0, 120, 1.0);
      game.addParticle({ kind: 'ring', x: p.x, y: p.y, z: 12, r0: 6, r1: 80, ch: '#', fam: 'r', lv: 1, life: 0.9, drag: 0 });
      game.addParticle({ kind: 'text', x: p.x, y: p.y, z: 50, text: 'SIGNAL LOST', fam: 'r', lv: 1, life: 2.2, drag: 0 });
      tearReq = 0.5;
    },
  };
  Styles.register(st);
})();
