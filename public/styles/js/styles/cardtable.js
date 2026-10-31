/* Psychedelic Card Table – a Balatro-inspired look.
   A slowly flowing paint swirl as the floor (the same domain-warp swirl, rendered per frame with a WebGL fragment shader
   on the art-pixel grid, CPU fallback at quarter resolution), crisp pixel-art playing cards and chip tokens that wobble
   ("juice"), offset silhouette drop shadows, card editions (foil / holographic / polychrome / negative), burn dissolves,
   shrinking square particles, popup bubbles and a CRT pass (barrel, chromatic fringe, bloom, scanlines, noise, vignette).
   Art buffer: 1 world unit = 1 art pixel. */
(function () {
  'use strict';
  const U = window.U, G = window.G;

  const PS = 1;

  /* =====================================================================
     Palette
     ===================================================================== */
  const P = {
    red: '#FE5F55', redDark: '#C2453E', blue: '#009DFF', blueDark: '#0067B0',
    gold: '#F3B958', goldDark: '#B8862F', goldLight: '#FFE8A8', orange: '#FDA200', orangeDark: '#B97500',
    green: '#4BC292', greenDark: '#2E8A64', purple: '#8867A5', tarot: '#A782D1', tarotDark: '#6E4F96', planet: '#13AFCE',
    white: '#FFFFFF', paper: '#F4F1EA', edge: '#BFC7D5', edgeDark: '#8E99A8', pink: '#F5A3A3',
    ink: '#24302F', black: '#374244', lblack: '#4F6367', panel: '#3A5055', panelDark: '#26353A',
    hearts: '#F03464', diamonds: '#F06B3F', spades: '#403995', clubs: '#235955',
    crimson: '#C9473A', crimsonDark: '#5A1E1A', cardBack: '#DA4A41',
    felt: '#50846E', boss: '#B44430', violet: '#8A71E1', shop: '#2B6E8F',
  };
  const rgbCache = {};
  const rgbOf = (h) => rgbCache[h] || (rgbCache[h] = U.hex(h));

  /* =====================================================================
     Art-pixel blitting (sprites snap to the buffer grid, juice rotates/scales around an anchor)
     ===================================================================== */
  let VS = 1, OX = 0, OY = 0, FR = 0, RT = 0, CAMX = 0, CAMY = 0, VW = 640, VH = 360;
  function setView(view) {
    VS = view.S; OX = view.W / 2 - view.x * VS; OY = view.H / 2 - view.y * VS;
    RT = view.rt; CAMX = view.x; CAMY = view.y; VW = view.W; VH = view.H;
  }
  const sx = (x) => Math.round(x * VS + OX);
  const sy = (y) => Math.round(y * VS + OY);
  const toScreen = (ctx) => ctx.setTransform(1, 0, 0, 1, 0, 0);
  const toWorld = (ctx) => ctx.setTransform(VS, 0, 0, VS, OX, OY);
  /** Draw img so that its pixel (ax, ay) lands on world (x, y); rot/scale around that pixel. */
  function blit(ctx, img, x, y, ax, ay, rot, scx, scy, alpha) {
    toScreen(ctx);
    const X = sx(x), Y = sy(y);
    if (!rot && (scx === undefined || scx === 1) && (scy === undefined || scy === 1)) {
      if (alpha !== undefined) ctx.globalAlpha = alpha;
      ctx.drawImage(img, X - ax, Y - ay);
    } else {
      ctx.save();
      if (alpha !== undefined) ctx.globalAlpha = alpha;
      ctx.translate(X, Y);
      if (rot) ctx.rotate(rot);
      ctx.scale(scx === undefined ? 1 : scx, scy === undefined ? (scx === undefined ? 1 : scx) : scy);
      ctx.drawImage(img, -ax, -ay);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    toWorld(ctx);
  }

  /** The juice wobble: scale swings with sin(50.8 t), rotation with sin(40.8 t), both die out within 0.4 s. */
  function juice(t, amt) {
    if (t < 0 || t > 0.4) return { s: 0, r: 0 };
    const k = (0.4 - t) / 0.4;
    return { s: amt * Math.sin(50.8 * t) * k * k * k, r: amt * 0.5 * Math.sin(40.8 * t) * k * k };
  }

  /* =====================================================================
     Tiny pixel painter + 3x5 font
     ===================================================================== */
  const FONT3 = {
    0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001011001111', 4: '101101111001001',
    5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
    '+': '000010111010000', X: '101101010101101', $: '011110010011110', '-': '000000111000000',
    J: '001001001101010', A: '010101111101101', K: '101110100110101', Q: '010101101110011',
  };
  function paint(w, h, fn) {
    const { c, ctx } = U.canvas(w, h);
    const p = {
      ctx,
      px(x, y, col) { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, 1, 1); },
      rect(x, y, ww, hh, col) { ctx.fillStyle = col; ctx.fillRect(x, y, ww, hh); },
      disc(cx, cy, r, col) {
        ctx.fillStyle = col;
        for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
          if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) ctx.fillRect(x, y, 1, 1);
        }
      },
      ellipse(cx, cy, rx, ry, col) {
        ctx.fillStyle = col;
        for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
          if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) ctx.fillRect(x, y, 1, 1);
        }
      },
      /** card-shaped rounded rectangle: 1 px edge colour, fill, corners cut by one pixel */
      card(x, y, ww, hh, fill, edge) {
        ctx.fillStyle = edge;
        ctx.fillRect(x + 1, y, ww - 2, hh); ctx.fillRect(x, y + 1, ww, hh - 2);
        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, ww - 2, hh - 2);
      },
      glyph(ch, x, y, col, flip) {
        const g = FONT3[ch];
        if (!g) return;
        ctx.fillStyle = col;
        for (let i = 0; i < 15; i++) if (g[i] === '1') {
          const gx = i % 3, gy = (i / 3) | 0;
          ctx.fillRect(flip ? x + 2 - gx : x + gx, flip ? y + 4 - gy : y + gy, 1, 1);
        }
      },
      text(str, x, y, col) { for (const ch of String(str)) { this.glyph(ch, x, y, col); x += 4; } },
    };
    fn(p, ctx, w, h);
    return c;
  }
  const textW = (str) => String(str).length * 4 - 1;
  const outline = (c, col) => U.outline(c, col || P.ink, 1, false);

  // 5x5 suit pips
  const PIPS = {
    hearts: ['11011', '11111', '11111', '01110', '00100'],
    diamonds: ['00100', '01110', '11111', '01110', '00100'],
    spades: ['00100', '01110', '11111', '11111', '00100'],
    clubs: ['01110', '01110', '11111', '11111', '00100'],
  };
  const SUIT_COL = { hearts: P.hearts, diamonds: P.diamonds, spades: P.spades, clubs: P.clubs };
  function pip(p, suit, x, y, flip) {
    const rows = PIPS[suit];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (rows[flip ? 4 - j : j][i] === '1') p.px(x + i, y + j, SUIT_COL[suit]);
  }

  /* =====================================================================
     Characters
     ===================================================================== */
  // Main character: a walking playing card wearing a two-pointed jester hat (21 x 33 art px before the outline)
  function jesterFrame(f) {
    return outline(paint(21, 33, (p) => {
      const lift = [[0, 0], [1, 0], [0, 0], [0, 1]][f];
      // legs + shoes
      p.rect(7, 28, 1, 3 - lift[0], P.ink); p.rect(6, 31 - lift[0], 2, 1, P.red);
      p.rect(13, 28, 1, 3 - lift[1], P.ink); p.rect(13, 31 - lift[1], 2, 1, P.blue);
      // arms (swing opposite to the legs) + gloves
      const al = f === 1 ? -1 : f === 3 ? 1 : 0;
      p.px(2, 18 + al, P.ink); p.px(1, 19 + al, P.ink); p.rect(0, 20 + al, 2, 2, P.white);
      p.px(18, 18 - al, P.ink); p.px(19, 19 - al, P.ink); p.rect(19, 20 - al, 2, 2, P.white);
      // card body
      p.card(3, 9, 15, 19, P.white, P.edge);
      p.rect(16, 11, 1, 15, '#E6EAF0'); p.rect(5, 26, 11, 1, '#E6EAF0');
      // corner pips
      p.rect(5, 11, 3, 1, P.red); p.rect(6, 10, 1, 3, P.red);
      p.rect(13, 24, 3, 1, P.red); p.rect(14, 23, 1, 3, P.red);
      // face: two eyes, rosy cheeks, a wide grin with teeth
      p.rect(8, 15, 1, 2, P.ink); p.rect(12, 15, 1, 2, P.ink);
      p.px(7, 18, P.pink); p.px(13, 18, P.pink);
      p.px(7, 19, P.red); p.rect(8, 20, 5, 1, P.red); p.px(13, 19, P.red); p.rect(8, 19, 5, 1, P.white);
      // jester hat: gold band, red flap to the left, blue flap to the right, gold bells
      const L = [[6, 4, 9], [5, 3, 8], [4, 2, 6], [3, 1, 4], [2, 0, 2]];
      for (const [y, a, b] of L) p.rect(a, y, b - a + 1, 1, P.red);
      for (const [y, a, b] of L) p.rect(20 - b, y, b - a + 1, 1, P.blue);
      p.rect(9, 5, 3, 2, P.purple);
      p.rect(4, 7, 13, 2, P.gold); p.rect(4, 8, 13, 1, P.goldDark);
      p.rect(0, 0, 2, 2, P.gold); p.rect(19, 0, 2, 2, P.gold);
    }));
  }

  const CHIP_COLS = [[P.blue, P.blueDark], [P.orange, P.orangeDark], [P.green, P.greenDark]];
  // Small creature: a round chip token with a face (17 px) – rim notches in two rotations
  function chipFrame(col, rot) {
    return outline(paint(17, 17, (p) => {
      p.disc(8.5, 8.5, 8.5, col[0]);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * U.TAU + rot;
        p.rect(Math.round(8.5 + Math.cos(a) * 6.8 - 1), Math.round(8.5 + Math.sin(a) * 6.8 - 1), 2, 2, P.white);
      }
      p.disc(8.5, 8.5, 5.6, P.white);
      p.disc(8.5, 8.5, 4.8, col[1]);
      p.rect(6, 7, 1, 2, P.white); p.rect(10, 7, 1, 2, P.white);
      p.rect(7, 11, 3, 1, P.white);
    }));
  }
  // Fast creature: a flipping card (front / back, 13 x 18)
  function flipCard(back) {
    return outline(paint(13, 18, (p) => {
      if (back) {
        p.card(0, 0, 13, 18, P.tarot, P.goldLight);
        p.rect(2, 2, 9, 14, P.tarotDark); p.rect(3, 3, 7, 12, P.tarot);
        p.rect(6, 5, 1, 8, P.gold); p.rect(4, 8, 5, 2, P.gold); p.rect(5, 7, 3, 4, P.gold); p.px(6, 9, P.goldLight);
      } else {
        p.card(0, 0, 13, 18, P.white, P.edge);
        pip(p, 'diamonds', 4, 6);
        p.glyph('A', 1, 1, P.diamonds);
        p.glyph('A', 9, 12, P.diamonds, true);
      }
    }));
  }
  // Large creature: a big crimson token with one glaring eye (34 px), gold notches in two rotations
  function bigToken(rot, blink) {
    return outline(paint(34, 34, (p) => {
      p.disc(17, 17, 17, P.crimson);
      p.disc(17, 17, 15.5, '#D85A4B');
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * U.TAU + rot;
        p.rect(Math.round(17 + Math.cos(a) * 14 - 1.5), Math.round(17 + Math.sin(a) * 14 - 1.5), 3, 3, P.gold);
      }
      p.disc(17, 17, 11.5, P.gold);
      p.disc(17, 17, 10.5, P.crimsonDark);
      if (blink) p.rect(11, 18, 12, 1, P.white);
      else {
        p.ellipse(17, 18, 6.2, 3.8, P.white);
        p.disc(17, 18, 2.8, P.gold);
        p.rect(16, 17, 2, 2, P.ink);
        p.px(15, 16, P.white);
      }
      for (let i = 0; i < 5; i++) { p.px(10 + i, 11 + (i >> 1), P.ink); p.px(23 - i, 11 + (i >> 1), P.ink); }
      p.rect(14, 24, 6, 1, P.ink); p.px(13, 23, P.ink); p.px(20, 23, P.ink);
    }));
  }

  /* =====================================================================
     Props
     ===================================================================== */
  const CHIP_STACK_COLS = [[P.red, P.redDark], [P.blue, P.blueDark], [P.white, P.edge], [P.gold, P.goldDark], [P.green, P.greenDark]];
  function chipStack(n, seed) {
    const r = U.rng(seed);
    const cols = [];
    // one or two colours per stack, like sorted chips
    const a = CHIP_STACK_COLS[(r.next() * CHIP_STACK_COLS.length) | 0], b = r.next() < 0.4 ? CHIP_STACK_COLS[(r.next() * CHIP_STACK_COLS.length) | 0] : a;
    const split = (n * (0.4 + r.next() * 0.4)) | 0;
    for (let i = 0; i < n; i++) cols.push(i < split ? a : b);
    const h = n * 3 + 6;
    return outline(paint(16, h, (p) => {
      for (let i = 0; i < n; i++) {
        const y = h - 6 - i * 3, c = cols[i], dx = i % 2 ? 0 : (r.next() < 0.3 ? 1 : 0);
        p.ellipse(8 + dx, y + 3, 7.5, 2.6, c[1]);
        p.rect(0.5 + dx, y + 1, 15, 2, c[1]);
        for (let k = 0; k < 4; k++) p.rect(2 + dx + k * 4, y + 2, 2, 1, c[0] === P.white ? P.red : P.white);
        p.ellipse(8 + dx, y + 1, 7.5, 2.6, c[0]);
        if (i === n - 1) { p.ellipse(8 + dx, y + 1, 4.5, 1.4, c[1]); p.ellipse(8 + dx, y + 1, 3.5, 1, c[0]); }
      }
    }));
  }
  const RANKS = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 'J', 'Q', 'K'];
  const PIP_LAYOUT = { 2: [[0, 0], [0, 2]], 3: [[0, 0], [0, 1], [0, 2]], 4: [[-1, 0], [1, 0], [-1, 2], [1, 2]], 5: [[-1, 0], [1, 0], [0, 1], [-1, 2], [1, 2]],
    6: [[-1, 0], [1, 0], [-1, 1], [1, 1], [-1, 2], [1, 2]], 7: [[-1, 0], [1, 0], [0, 0.5], [-1, 1], [1, 1], [-1, 2], [1, 2]],
    8: [[-1, 0], [1, 0], [0, 0.5], [-1, 1], [1, 1], [0, 1.5], [-1, 2], [1, 2]], 9: [[-1, 0], [1, 0], [-1, 0.7], [1, 0.7], [0, 1], [-1, 1.3], [1, 1.3], [-1, 2], [1, 2]] };
  function standingCard(rank, suit) {
    return paint(22, 30, (p) => {
      p.card(0, 0, 22, 30, P.white, P.edge);
      p.rect(20, 2, 1, 26, '#E6EAF0');
      const col = SUIT_COL[suit];
      p.glyph(String(rank), 2, 2, col);
      p.glyph(String(rank), 17, 23, col, true);
      if (rank === 'A') { p.ellipse(11, 15, 4.5, 4.5, col); p.rect(10, 18, 2, 4, col); }
      else if (typeof rank === 'string') {
        p.rect(5, 6, 12, 18, col); p.rect(6, 7, 10, 16, U.rgb(U.mix(rgbOf(col), [255, 255, 255], 0.8)));
        p.glyph(rank, 9, 12, col);
      } else for (const [cx, cy] of PIP_LAYOUT[rank]) pip(p, suit, Math.round(9 + cx * 5), Math.round(5 + cy * 8), cy > 1);
    });
  }
  function deck(seed) {
    const r = U.rng(seed), n = 3 + ((r.next() * 3) | 0);
    return outline(paint(24, 30 + n, (p) => {
      for (let i = n; i >= 1; i--) p.card(1, i, 22, 30, i % 2 ? P.edge : P.white, P.edgeDark);
      p.card(1, 0, 22, 30, P.cardBack, P.white);
      p.rect(4, 3, 16, 24, P.white); p.rect(5, 4, 14, 22, P.cardBack);
      for (let y = 5; y < 25; y++) for (let x = 6; x < 18; x++) if (Math.abs(((x - 6) % 6) - 3) + Math.abs(((y - 5) % 6) - 3) === 2) p.px(x, y, '#B83A33');
      p.rect(9, 12, 6, 6, P.white); p.rect(10, 13, 4, 4, P.cardBack); p.rect(11, 14, 2, 2, P.white);
    }));
  }
  function die(v) {
    const dots = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
    return outline(paint(20, 24, (p) => {
      p.card(0, 6, 20, 18, '#D9DEE6', P.edge);
      p.card(0, 0, 20, 16, P.white, P.edge);
      for (const [i, j] of dots[v]) p.rect(4 + i * 5, 3 + j * 4, 2, 2, v === 1 ? P.red : P.ink);
      for (const i of [0, 1, 2]) if (v > 3 || i === 1) p.rect(4 + i * 5, 19, 2, 2, P.black);
    }));
  }
  function tarot(sun) {
    return paint(22, 32, (p) => {
      p.card(0, 0, 22, 32, P.goldLight, P.goldDark);
      p.rect(2, 2, 18, 28, P.tarotDark); p.rect(3, 3, 16, 26, sun ? '#F7D27C' : '#3A3F7A');
      if (sun) {
        for (let k = 0; k < 8; k++) { const a = (k / 8) * U.TAU; p.rect(Math.round(11 + Math.cos(a) * 6.5 - 0.5), Math.round(13 + Math.sin(a) * 6.5 - 0.5), 1, 1, P.orange); }
        p.disc(11, 13, 4.2, P.orange); p.disc(11, 13, 3, P.gold);
      } else {
        p.disc(11, 13, 5, P.goldLight); p.disc(13, 12, 4.2, '#3A3F7A');
        for (const [x, y] of [[5, 6], [16, 20], [6, 21], [17, 7]]) p.px(x, y, P.goldLight);
      }
      p.rect(4, 24, 14, 3, P.tarotDark); p.rect(7, 25, 8, 1, P.goldLight);
    });
  }
  function coinPile(seed) {
    const r = U.rng(seed);
    return outline(paint(24, 14, (p) => {
      const spots = [[5, 10], [12, 11], [19, 10], [8, 7], [15, 7], [11, 4]];
      const n = 4 + ((r.next() * 3) | 0);
      for (let i = 0; i < n; i++) {
        const [x, y] = spots[i];
        p.ellipse(x, y + 1, 4.5, 2.4, P.goldDark);
        p.ellipse(x, y, 4.5, 2.4, P.gold);
        p.ellipse(x, y, 2.5, 1.2, P.goldLight);
      }
    }));
  }
  function pack(col) {
    return paint(18, 27, (p) => {
      p.rect(1, 3, 16, 21, col);
      for (let x = 1; x < 17; x++) { p.rect(x, x % 2 ? 1 : 2, 1, 2, P.edge); p.rect(x, x % 2 ? 24 : 23, 1, 2, P.edge); }
      p.rect(1, 4, 16, 1, 'rgba(255,255,255,.35)');
      p.card(5, 8, 8, 11, P.white, P.edge);
      p.rect(8, 10, 2, 7, col); p.rect(6, 12, 6, 2, col);
      p.rect(15, 5, 1, 17, 'rgba(0,0,0,.18)');
    });
  }
  function houseOfCards() {
    return outline(paint(30, 30, (p) => {
      const lean = (x0, y0, dir, h) => { for (let i = 0; i < h; i++) { const x = Math.round(x0 + dir * i * 0.35); p.rect(x, y0 - i, 2, 1, i % 4 === 0 ? P.edge : P.white); } };
      const tier = (y, xs) => { for (const x of xs) { lean(x, y, 1, 11); lean(x + 8, y, -1, 11); } };
      tier(29, [2, 12, 20].map((x) => x - 1));
      p.rect(3, 18, 25, 1, P.white); p.rect(3, 19, 25, 1, P.edge);
      tier(18, [6, 15]);
      p.rect(8, 7, 15, 1, P.white); p.rect(8, 8, 15, 1, P.edge);
      tier(7, [11]);
    }));
  }

  /* =====================================================================
     Editions: foil / holographic / polychrome / negative (pixel-shader frames baked at init)
     ===================================================================== */
  function hsv2rgb(h, s, v) {
    const f = (n) => { const k = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return [f(5), f(3), f(1)];
  }
  function rgb2hsv(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [((h / 6) % 1 + 1) % 1, mx ? d / mx : 0, mx];
  }
  function editionFrames(img, type, n) {
    const w = img.width, h = img.height;
    const src = img.getContext('2d').getImageData(0, 0, w, h).data;
    const out = [];
    for (let f = 0; f < n; f++) {
      const t = (f / n) * U.TAU;
      const { c, ctx } = U.canvas(w, h);
      const im = ctx.createImageData(w, h), d = im.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        if (src[o + 3] < 20) continue;
        let r = src[o] / 255, g = src[o + 1] / 255, b = src[o + 2] / 255;
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        const u = x / w, v = y / h;
        if (l > 0.2) {
          if (type === 'foil') {
            const bands = Math.sin((u * 1.4 - v) * 10 + t), rings = Math.sin(Math.hypot(u - 0.5, (v - 0.5) * 1.35) * 24 - t);
            const k = Math.pow(U.clamp(0.5 + 0.7 * bands * rings, 0, 1), 3);
            r = U.lerp(r, l * 0.72, 0.6) + 0.42 * k * 0.6 + 0.02; g = U.lerp(g, l * 0.86, 0.6) + 0.66 * k * 0.6 + 0.05; b = U.lerp(b, l * 1.18, 0.6) + k * 0.6 + 0.12;
          } else if (type === 'holo') {
            const grid = x % 4 === 0 || y % 5 === 0 ? 1 : 0;
            const hh = U.fract(u * 0.9 + v * 0.7 + f / n);
            const rb = hsv2rgb(hh, 0.6, 1), sw = 0.5 + 0.5 * Math.sin((u + v) * 7 - t);
            const m = 0.32 + 0.2 * sw;
            r = U.lerp(r, r * 0.6 + rb[0] * 0.5, m) + rb[0] * grid * 0.25; g = U.lerp(g, g * 0.6 + rb[1] * 0.5, m) + rb[1] * grid * 0.25; b = U.lerp(b, b * 0.6 + rb[2] * 0.5, m) + rb[2] * grid * 0.25;
          } else if (type === 'polychrome') {
            const hv = rgb2hsv(r, g, b);
            hv[0] = U.fract(hv[0] + 0.45 * Math.sin(u * 4 + t) + 0.45 * Math.cos(v * 5 - t) + Math.hypot(u - 0.5, v - 0.5) * 1.4);
            hv[1] = U.clamp(Math.max(hv[1], 0.45) * 1.15, 0, 1);
            const q = hsv2rgb(hv[0], hv[1], hv[2]);
            r = U.lerp(r, q[0], 0.85); g = U.lerp(g, q[1], 0.85); b = U.lerp(b, q[2], 0.85);
          } else if (type === 'negative') {
            const s = Math.pow(Math.max(0, Math.sin((u - v) * 8 + t)), 6) * 0.4;
            r = (1 - r) * 0.82 + 0.04 + 0.25 * s; g = (1 - g) * 0.8 + 0.02 + 0.2 * s; b = (1 - b) + 0.1 + 0.45 * s;
          }
        }
        d[o] = U.clamp(r * 255, 0, 255); d[o + 1] = U.clamp(g * 255, 0, 255); d[o + 2] = U.clamp(b * 255, 0, 255); d[o + 3] = src[o + 3];
      }
      ctx.putImageData(im, 0, 0);
      out.push(c);
    }
    return out;
  }

  /* =====================================================================
     Dissolve (burn away / materialise): per-sprite noise mask, frames cached per step
     ===================================================================== */
  const DIS = new WeakMap();
  const DSTEPS = 12;
  function dissolveFrame(img, k, mode) {
    let e = DIS.get(img);
    if (!e) {
      const w = img.width, h = img.height, mask = new Float32Array(w * h);
      const seed = (w * 31 + h * 17) | 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const n = U.fbm(x / 5, y / 5, seed, 3);
        const ex = Math.abs(x / w - 0.5) * 2, ey = Math.abs(y / h - 0.5) * 2;
        mask[y * w + x] = n * 0.78 + 0.22 * (1 - Math.max(ex, ey));
      }
      e = { mask, frames: {} };
      DIS.set(img, e);
    }
    const step = U.clamp(Math.floor(k * DSTEPS), 0, DSTEPS - 1);
    const key = mode + step;
    if (e.frames[key]) return e.frames[key];
    const w = img.width, h = img.height;
    const th = ((step + 0.5) / DSTEPS) * 1.18 - 0.08;
    const cols = mode === 'burn' ? [rgbOf('#FFE8A0'), rgbOf(P.red)] : [rgbOf(P.white), rgbOf(P.blue)];
    const src = img.getContext('2d').getImageData(0, 0, w, h);
    const d = src.data;
    for (let i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] < 20) continue;
      const n = e.mask[i];
      if (n < th) { d[i * 4 + 3] = 0; continue; }
      if (n < th + 0.09) {
        const c = U.mix(cols[0], cols[1], (n - th) / 0.09);
        d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
      }
    }
    const { c, ctx } = U.canvas(w, h);
    ctx.putImageData(src, 0, 0);
    return (e.frames[key] = c);
  }
  const silhouettes = new WeakMap();
  function silhouette(img, col) {
    let m = silhouettes.get(img);
    if (!m) { m = {}; silhouettes.set(img, m); }
    return m[col] || (m[col] = U.tint(img, col, 1));
  }

  /* =====================================================================
     The paint swirl (floor)
     ===================================================================== */
  const D = 612;            // world normaliser: the swirl is anchored to world units, not to the window size
  const SPIN_AMT = 0.25;
  // colour zones of the table: mostly green felt, crimson and violet patches, a teal "shop" tint
  function zoneMix(x, y) {
    const a = U.fbm(x / 1500, y / 1500, 9101, 2), b = U.fbm(x / 1900 + 7.3, y / 1900 - 3.1, 9203, 2);
    // the area around the origin is always green felt (where a scene starts)
    const home = U.smoothstep(350, 900, Math.hypot(x, y));
    const red = U.smoothstep(0.6, 0.7, a) * home, vio = U.smoothstep(0.62, 0.72, b) * (1 - red) * home, teal = U.smoothstep(0.74, 0.8, 1 - a) * (1 - vio) * (1 - red) * home;
    return { red, vio, teal };
  }
  const BASES = { felt: rgbOf(P.felt), boss: rgbOf(P.boss), violet: rgbOf(P.violet), shop: rgbOf(P.shop) };
  function zoneBase(x, y) {
    const z = zoneMix(x, y);
    let c = BASES.felt;
    c = U.mix(c, BASES.boss, z.red); c = U.mix(c, BASES.violet, z.vio); c = U.mix(c, BASES.shop, z.teal);
    return { c, contrast: 1.4 + z.red * 0.9 + z.vio * 0.5 };
  }
  // three swirl colours from one base colour (×0.9 / ×1.3 / ×0.7)
  function swirlCols(base) {
    return [base.map((v) => U.clamp(v * 0.9, 0, 255) / 255), base.map((v) => U.clamp(v * 1.3, 0, 255) / 255), base.map((v) => U.clamp(v * 0.7, 0, 255) / 255)];
  }
  /**
   * World position -> bounded swirl coordinates. The original swirl only works for coordinates of about ±0.5
   * (it reads the length of the warped vector), so the endless floor folds world units through a sum of slow sines:
   * seamless, never repeating exactly, always in range, and it moves 1:1 with the world.
   */
  function fold(x, y, out) {
    out[0] = 0.26 * Math.sin(x / 150) + 0.2 * Math.sin((x * 0.6 + y * 0.8) / 131 + 1.3);
    out[1] = 0.26 * Math.sin(y / 150 + 0.7) + 0.2 * Math.sin((y * 0.6 - x * 0.8) / 127 + 2.1);
    return out;
  }
  const FOLD = [0, 0];
  /** CPU version of the swirl at world (wx, wy); l = distance from the screen centre / D (twist). Returns rgb 0..1. */
  function swirlCPU(wx, wy, l, spin, flow, cols, contrast, light, out) {
    const a = spin - 20 * (SPIN_AMT * l + (1 - SPIN_AMT));
    fold(wx, wy, FOLD);
    const px = FOLD[0], py = FOLD[1], ca = Math.cos(a), sa = Math.sin(a);
    let ux = (px * ca - py * sa) * 30, uy = (px * sa + py * ca) * 30;
    let vx = ux + uy, vy = ux + uy;
    for (let i = 0; i < 5; i++) {
      const m = Math.sin(Math.max(ux, uy));
      vx += m + ux; vy += m + uy;
      ux += 0.5 * Math.cos(5.1123314 + 0.353 * vy + flow * 0.131121);
      uy += 0.5 * Math.sin(vx - 0.113 * flow);
      const c1 = Math.cos(ux + uy), s1 = Math.sin(ux * 0.711 - uy);
      ux -= c1 - s1; uy -= c1 - s1;
    }
    const cm = 0.25 * contrast + 0.5 * SPIN_AMT + 1.2;
    const paintV = Math.min(2, Math.max(0, Math.hypot(ux, uy) * 0.035 * cm));
    const c1p = Math.max(0, 1 - cm * Math.abs(1 - paintV)), c2p = Math.max(0, 1 - cm * Math.abs(paintV));
    const c3p = 1 - Math.min(1, c1p + c2p);
    const lt = (light - 0.2) * Math.max(c1p * 5 - 4, 0) + light * Math.max(c2p * 5 - 4, 0);
    const base = 0.3 / contrast;
    for (let k = 0; k < 3; k++) out[k] = base * cols[0][k] + (1 - base) * (cols[0][k] * c1p + cols[1][k] * c2p + cols[2][k] * c3p) + lt;
    return out;
  }

  const VS_FULL = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0., 1.); }`;
  const FS_SWIRL = `#version 300 es
precision highp float;
uniform vec2 uRes, uCam; uniform float uS, uD, uFlow, uSpin, uSpinAmt, uContrast, uLight;
uniform vec3 uC1, uC2, uC3;
out vec4 o;
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 off = (floor(px) + 0.5 - 0.5 * uRes) / uS;
  float l = length(off / uD);
  float a = uSpin - 20. * (uSpinAmt * l + (1. - uSpinAmt));
  vec2 w = uCam + off;                                     // world position of this art pixel
  vec2 p = vec2(0.26 * sin(w.x / 150.) + 0.2 * sin((w.x * 0.6 + w.y * 0.8) / 131. + 1.3),
                0.26 * sin(w.y / 150. + 0.7) + 0.2 * sin((w.y * 0.6 - w.x * 0.8) / 127. + 2.1));
  float c = cos(a), s = sin(a);
  vec2 uv = vec2(p.x * c - p.y * s, p.x * s + p.y * c) * 30.;
  vec2 uv2 = vec2(uv.x + uv.y);
  for (int i = 0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + uFlow * 0.131121), sin(uv2.x - 0.113 * uFlow));
    uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
  }
  float cm = 0.25 * uContrast + 0.5 * uSpinAmt + 1.2;
  float pv = min(2., max(0., length(uv) * 0.035 * cm));
  float c1p = max(0., 1. - cm * abs(1. - pv));
  float c2p = max(0., 1. - cm * abs(pv));
  float c3p = 1. - min(1., c1p + c2p);
  float lt = (uLight - 0.2) * max(c1p * 5. - 4., 0.) + uLight * max(c2p * 5. - 4., 0.);
  float b = 0.3 / uContrast;
  o = vec4(b * uC1 + (1. - b) * (uC1 * c1p + uC2 * c2p + uC3 * c3p) + lt, 1.);
}`;
  const FS_CRT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex; uniform vec2 uRes; uniform float uTime, uUp, uMip;
out vec4 o;
float h12(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 p = vUv * 2. - 1.;
  p *= 1. + 0.045 * dot(p, p) - 0.018;                         // barrel
  vec2 uv = p * 0.5 + 0.5;
  vec2 e = smoothstep(vec2(0.), vec2(0.008), uv) * smoothstep(vec2(0.), vec2(0.008), 1. - uv);
  vec2 ca = (uv - 0.5) * 0.004 + vec2(0.45 / uRes.x, 0.);      // chromatic fringe, stronger at the edges
  vec2 tuv = vec2(uv.x, 1. - uv.y);
  vec2 tca = vec2(ca.x, -ca.y);
  vec3 col = vec3(texture(uTex, tuv + tca).r, texture(uTex, tuv).g, texture(uTex, tuv - tca).b);
  vec3 bl = textureLod(uTex, tuv, uMip).rgb * 0.55 + textureLod(uTex, tuv, uMip + 2.).rgb * 0.45;
  col += max(bl - 0.3, 0.) * 0.55;                               // bloom
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float line = 0.5 + 0.5 * cos(gl_FragCoord.y / max(uUp, 2.) * 6.2831853);
  col *= 1. - 0.2 * line * (1. - 0.55 * clamp(lum, 0., 1.));     // scanlines, one per art-pixel row
  col += (h12(floor(gl_FragCoord.xy / 2.) + fract(uTime * 7.31) * 91.7) - 0.5) * 0.03;
  col *= mix(1., smoothstep(1.6, 0.45, length(p * vec2(0.92, 1.))), 0.55);
  o = vec4(col * 1.04 * e.x * e.y, 1.);
}`;

  // one shared WebGL2 canvas for both passes (swirl renders into its lower-left corner)
  const GL = { tried: false, gl: null };
  function glInit() {
    if (GL.tried) return GL.gl;
    GL.tried = true;
    try {
      const c = document.createElement('canvas');
      c.width = 2; c.height = 2;
      const gl = c.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false, alpha: false });
      if (!gl) return null;
      const prog = (fs) => {
        const p = gl.createProgram();
        for (const [type, src] of [[gl.VERTEX_SHADER, VS_FULL], [gl.FRAGMENT_SHADER, fs]]) {
          const s = gl.createShader(type);
          gl.shaderSource(s, src); gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
          gl.attachShader(p, s);
        }
        gl.bindAttribLocation(p, 0, 'aPos');
        gl.linkProgram(p);
        const u = {};
        const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
        return { p, u };
      };
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      GL.gl = gl; GL.c = c; GL.swirl = prog(FS_SWIRL); GL.crt = prog(FS_CRT); GL.tex = tex;
      c.addEventListener('webglcontextlost', (e) => { e.preventDefault(); GL.gl = null; });
    } catch (e) { GL.gl = null; window.__reportError && window.__reportError(e); }
    return GL.gl;
  }
  function glSize(w, h) {
    if (GL.c.width < w || GL.c.height < h) { GL.c.width = Math.max(GL.c.width, w); GL.c.height = Math.max(GL.c.height, h); }
  }

  // swirl state: colours ease toward the zone under the camera (like a table that changes colour per round)
  const SW = { cols: null, contrast: 1, flow: 37, spin: 302.2, pulse: 0, last: -1, cpu: null };
  function updateSwirl(view) {
    const dt = SW.last < 0 ? 0 : U.clamp(view.rt - SW.last, 0, 0.1);
    SW.last = view.rt;
    const z = zoneBase(view.x, view.y), target = swirlCols(z.c);
    if (!SW.cols) { SW.cols = target; SW.contrast = z.contrast; }
    const k = 1 - Math.exp(-dt * 1.4);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) SW.cols[i][j] += (target[i][j] - SW.cols[i][j]) * k;
    SW.contrast += (z.contrast - SW.contrast) * k;
    SW.pulse *= Math.exp(-dt * 1.8);
    SW.flow += dt * (7 + SW.pulse * 3);
    SW.spin += dt * SW.pulse * 0.35;
  }
  function drawSwirl(ctx, view) {
    const W = view.W, H = view.H;
    const gl = glInit();
    toScreen(ctx);
    if (gl) {
      glSize(W, H);
      gl.viewport(0, 0, W, H);
      const S = GL.swirl;
      gl.useProgram(S.p);
      gl.uniform2f(S.u.uRes, W, H);
      gl.uniform2f(S.u.uCam, view.x, view.y);
      gl.uniform1f(S.u.uS, view.S);
      gl.uniform1f(S.u.uD, D);
      gl.uniform1f(S.u.uFlow, SW.flow);
      gl.uniform1f(S.u.uSpin, SW.spin);
      gl.uniform1f(S.u.uSpinAmt, SPIN_AMT);
      gl.uniform1f(S.u.uContrast, SW.contrast);
      gl.uniform1f(S.u.uLight, 0.28);
      gl.uniform3fv(S.u.uC1, SW.cols[0]); gl.uniform3fv(S.u.uC2, SW.cols[1]); gl.uniform3fv(S.u.uC3, SW.cols[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      ctx.drawImage(GL.c, 0, GL.c.height - H, W, H, 0, 0, W, H);
    } else {
      // CPU fallback: quarter resolution, refreshed every second frame
      const q = 4, w = Math.ceil(W / q), h = Math.ceil(H / q);
      if (!SW.cpu || SW.cpu.c.width !== w || SW.cpu.c.height !== h) { SW.cpu = U.canvas(w, h); SW.cpu.img = SW.cpu.ctx.createImageData(w, h); }
      if ((FR & 1) === 0) {
        const d = SW.cpu.img.data, out = [0, 0, 0];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const ox = ((x + 0.5) * q - W / 2) / view.S, oy = ((y + 0.5) * q - H / 2) / view.S;
          swirlCPU(view.x + ox, view.y + oy, Math.hypot(ox, oy) / D, SW.spin, SW.flow, SW.cols, SW.contrast, 0.28, out);
          const o = (y * w + x) * 4;
          d[o] = out[0] * 255; d[o + 1] = out[1] * 255; d[o + 2] = out[2] * 255; d[o + 3] = 255;
        }
        SW.cpu.ctx.putImageData(SW.cpu.img, 0, 0);
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(SW.cpu.c, 0, 0, w * q, h * q);
    }
    toWorld(ctx);
  }

  // dark translucent "card zones" on the table (deterministic per 230-unit cell)
  function zoneAt(cx, cy) {
    const r = U.rng(U.hashInt(cx, cy, 7717));
    if (r.next() > 0.3) return null;
    const w = 2 * r.int(30, 58), h = 2 * r.int(22, 36);
    const x = cx * 230 + r.int(10, 230 - w - 10), y = cy * 230 + r.int(10, 230 - h - 10);
    if (Math.hypot(x + w / 2, y + h / 2) < 90) return null;
    return { x, y, w, h, dashed: r.next() < 0.45, slots: r.next() < 0.4 ? r.int(2, 4) : 0 };
  }
  function drawZone(ctx, z, toPx) {
    const [x, y] = toPx(z.x, z.y), w = Math.round(z.w * VS), h = Math.round(z.h * VS);
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.fillRect(x + 2, y, w - 4, h); ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.fillRect(x, y + 2, w, h - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    if (z.dashed) {
      for (let i = 4; i < w - 4; i += 6) { ctx.fillRect(x + i, y + 3, 3, 1); ctx.fillRect(x + i, y + h - 4, 3, 1); }
      for (let j = 6; j < h - 6; j += 6) { ctx.fillRect(x + 3, y + j, 1, 3); ctx.fillRect(x + w - 4, y + j, 1, 3); }
    }
    if (z.slots) {
      const sw = Math.round(22 * VS), sh = Math.round(30 * VS), gap = Math.round(6 * VS);
      const tot = z.slots * sw + (z.slots - 1) * gap;
      if (tot < w - 8 && sh < h - 8) {
        for (let k = 0; k < z.slots; k++) {
          const X = x + Math.round((w - tot) / 2) + k * (sw + gap), Y = y + Math.round((h - sh) / 2);
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(X + 1, Y, sw - 2, sh); ctx.fillRect(X, Y + 1, sw, sh - 2);
        }
      }
    }
  }

  function* buildChunk(ctx, info) {
    const N = info.px, res = info.res;
    const img = ctx.createImageData(N, N), d = img.data;
    const out = [0, 0, 0];
    // static swirl: same field as the live floor at rest (flow 0), colour per pixel from the zone map
    for (let y = 0; y < N; y += 2) {
      for (let x = 0; x < N; x += 2) {
        const wx = info.wx + (x + 1) / res, wy = info.wy + (y + 1) / res;
        const z = zoneBase(wx, wy);
        swirlCPU(wx, wy, 0, 302.2, 0, swirlCols(z.c), z.contrast, 0.28, out);
        for (let j = 0; j < 2 && y + j < N; j++) for (let i = 0; i < 2 && x + i < N; i++) {
          const o = ((y + j) * N + x + i) * 4;
          d[o] = out[0] * 255; d[o + 1] = out[1] * 255; d[o + 2] = out[2] * 255; d[o + 3] = 255;
        }
      }
      if ((y & 15) === 14) yield;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.putImageData(img, 0, 0);
    const k = VS;
    VS = res;
    const c0x = Math.floor(info.wx / 230) - 1, c1x = Math.floor((info.wx + info.size) / 230), c0y = Math.floor(info.wy / 230) - 1, c1y = Math.floor((info.wy + info.size) / 230);
    for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
      const z = zoneAt(cx, cy);
      if (z) drawZone(ctx, z, (X, Y) => [Math.round((X - info.wx) * res), Math.round((Y - info.wy) * res)]);
    }
    VS = k;
    ctx.restore();
  }

  /* =====================================================================
     HUD (CSS)
     ===================================================================== */
  const B = 'body.style-cardtable';
  const F = `'Jersey 10', 'm6x11', monospace`;
  const PANEL = `background: #3A5055; border-radius: 12px; box-shadow: 0 4px 0 #26353A, -3px 9px 0 rgba(0,0,0,.32);`;
  const CSS = `
${B} { font-family: ${F}; color: #fff; }
${B} #hud { padding: 16px 22px; }
${B} #hud .xp { height: 20px; margin: 4px 6px 0; background: #1d2a2e; border: 0; border-radius: 10px; overflow: hidden;
  box-shadow: 0 0 0 4px #3A5055, 0 5px 0 4px #26353A, -3px 10px 0 4px rgba(0,0,0,.3); }
${B} #hud .xp-fill { background: #009DFF; border-radius: 10px; box-shadow: inset 0 -5px 0 #0067B0, inset 0 3px 0 rgba(255,255,255,.3); }
${B} #hud .lvl { right: 12px; font: 400 21px ${F}; text-shadow: -1px 2px 0 rgba(0,0,0,.45); }
${B} #hud .topline { margin-top: 22px; align-items: stretch; }
${B} #hud .hp { ${PANEL} padding: 10px 14px; gap: 12px; }
${B} #hud .hp-icon, ${B} #hud .kills-icon { width: 40px; height: 40px; image-rendering: pixelated; }
${B} #hud .hp-bar { width: 210px; height: 24px; background: #26353A; border: 0; border-radius: 8px; }
${B} #hud .hp-fill { background: #FE5F55; border-radius: 8px; box-shadow: inset 0 -5px 0 #C2453E, inset 0 3px 0 rgba(255,255,255,.3); }
${B} #hud .hp-text { font: 400 26px ${F}; text-shadow: -1px 2px 0 rgba(0,0,0,.4); }
${B}.hurt #hud .hp-bar { filter: none; animation: ctShake .18s linear infinite; }
${B} #hud .clock { ${PANEL} padding: 8px 18px 12px; gap: 6px; }
${B} #hud .clock-label { order: -1; font: 400 18px ${F}; color: #FDA200; letter-spacing: 1px; opacity: 1; text-transform: none; }
${B} #hud .clock-time { font: 400 47px ${F}; background: #26353A; border-radius: 8px; padding: 2px 18px; letter-spacing: 1px; text-shadow: -2px 3px 0 rgba(0,0,0,.4); }
${B} #hud .kills { ${PANEL} padding: 8px 16px; gap: 10px; font: 400 42px ${F}; color: #F3B958; text-shadow: -2px 3px 0 rgba(0,0,0,.4); min-width: 180px; }
${B} #stylebar { background: rgba(30,40,44,.94); border: 0; border-radius: 14px; padding: 10px 18px; box-shadow: 0 4px 0 #1a2427, -3px 9px 0 rgba(0,0,0,.3); font-family: ${F}; }
${B} #stylebar .style-family { font: 400 16px ${F}; color: #9FB0B4; letter-spacing: 1px; }
${B} #stylebar .style-name { font: 400 23px ${F}; background: #FDA200; padding: 4px 14px; border-radius: 8px; box-shadow: 0 4px 0 #B97500; }
${B} #stylebar .style-hint { color: #9FB0B4; opacity: 1; }
${B} #stylebar .auto.on { color: #4BC292; }
${B} #levelup { background: radial-gradient(ellipse at center, rgba(20,30,34,.35), rgba(8,12,14,.82)); gap: 30px; }
${B} #levelup .lu-title { font: 400 75px ${F}; color: #F3B958; letter-spacing: 1px; text-shadow: -3px 5px 0 rgba(0,0,0,.45); animation: ctWobble 2.4s ease-in-out infinite; }
${B} #levelup .lu-cards { gap: 26px; }
${B} #levelup .card { width: 220px; min-height: 296px; padding: 20px 14px 16px; gap: 12px; background: #4F6367; border: 0; border-radius: 14px;
  box-shadow: 0 5px 0 #374244, -4px 12px 0 rgba(0,0,0,.35); transition: transform .2s cubic-bezier(.3,1.7,.5,1); animation: ctDeal .55s cubic-bezier(.3,1.5,.5,1) backwards; }
${B} #levelup .card:nth-child(2) { animation-delay: .09s; } ${B} #levelup .card:nth-child(3) { animation-delay: .18s; }
${B} #levelup .card:hover { transform: translateY(-10px) rotate(-2deg) scale(1.05); }
${B} #levelup .card-icon { width: 96px; height: 96px; background: #26353A; border-radius: 12px; image-rendering: pixelated; }
${B} #levelup .card-name { font: 400 29px ${F}; color: #fff; text-shadow: -1px 2px 0 rgba(0,0,0,.4); }
${B} #levelup .card-desc { width: 100%; padding: 9px 10px; font: 400 21px/1.25 ${F}; color: #374244; opacity: 1; background: #fff; border-radius: 9px; box-shadow: inset 0 -4px 0 #BFC7D5; }
${B} #levelup .card-key { top: -12px; left: -12px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%;
  font: 400 22px ${F}; color: #fff; opacity: 1; background: #FE5F55; box-shadow: 0 3px 0 #C2453E; }
${B} #levelup .lu-hint { font: 400 21px ${F}; color: #E0E8EA; opacity: 1; }
${B} #gameover { background: radial-gradient(ellipse at center, rgba(60,16,14,.4), rgba(8,6,6,.85)); }
${B} #gameover .go-title { font: 400 86px ${F}; color: #FE5F55; text-shadow: -3px 5px 0 rgba(0,0,0,.5); animation: ctWobble 2s ease-in-out infinite; }
${B} #gameover .go-stats { ${PANEL} padding: 12px 22px; font: 400 23px ${F}; }
${B} #gameover .go-hint { font: 400 21px ${F}; color: #FDA200; opacity: 1; }
${B} #pausebox { font: 400 68px ${F}; color: #fff; text-shadow: -3px 5px 0 rgba(0,0,0,.45); }
@keyframes ctWobble { 0%, 100% { transform: rotate(-1.6deg) scale(1); } 50% { transform: rotate(1.6deg) scale(1.04); } }
@keyframes ctDeal { from { transform: translateY(70px) rotate(9deg) scale(.6); opacity: 0; } }
@keyframes ctShake { 0% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
`;

  /* =====================================================================
     Icons (HUD, cards)
     ===================================================================== */
  const iconCache = {};
  function iconCanvas(id) {
    if (iconCache[id]) return iconCache[id];
    let img;
    switch (id) {
      case 'hp-heart': img = outline(paint(13, 11, (p) => {
        for (const [y, a, b] of [[0, 1, 4], [0, 8, 11], [1, 0, 12], [2, 0, 12], [3, 0, 12], [4, 0, 12], [5, 1, 11], [6, 2, 10], [7, 3, 9], [8, 4, 8], [9, 5, 7], [10, 6, 6]]) p.rect(a, y, b - a + 1, 1, P.hearts);
        p.rect(2, 1, 2, 2, P.white);
      })); break;
      case 'kills': img = SPR.chip[0][0]; break;
      case 'dmg': img = token(P.red, P.redDark, 'X'); break;
      case 'rate': img = outline(paint(13, 12, (p) => { p.card(4, 0, 9, 12, P.white, P.edge); pip(p, 'spades', 6, 3); p.rect(0, 3, 3, 1, P.white); p.rect(1, 6, 2, 1, P.white); p.rect(0, 9, 3, 1, P.white); })); break;
      case 'multi': img = outline(paint(15, 12, (p) => { p.card(0, 2, 8, 10, P.white, P.edge); p.card(4, 1, 8, 10, P.white, P.edge); p.card(7, 0, 8, 10, P.white, P.edge); pip(p, 'hearts', 9, 3); })); break;
      case 'bounce': img = outline(paint(13, 13, (p) => { p.disc(9, 9, 3.6, P.gold); p.disc(9, 9, 2, P.goldLight); for (const [x, y] of [[1, 10], [2, 7], [3, 5], [5, 4], [7, 4]]) p.px(x, y, P.white); })); break;
      case 'lantern': img = outline(paint(15, 15, (p) => { p.disc(7.5, 7.5, 3, P.white); for (const [x, y, c] of [[7, 0, P.blue], [13, 7, P.red], [7, 13, P.blue], [1, 7, P.red]]) { p.rect(x - 1, y, 3, 2, c); } })); break;
      case 'speed': img = outline(paint(14, 10, (p) => { for (const [y, a, b] of [[6, 2, 6], [5, 1, 5], [4, 0, 3]]) p.rect(a, y, b - a + 1, 1, P.red); for (const [y, a, b] of [[6, 7, 11], [5, 8, 12], [4, 10, 13]]) p.rect(a, y, b - a + 1, 1, P.blue); p.rect(2, 7, 10, 2, P.gold); p.rect(0, 2, 2, 2, P.gold); p.rect(12, 2, 2, 2, P.gold); })); break;
      case 'magnet': img = SPR.coins; break;
      case 'hp': img = outline(paint(11, 14, (p) => { p.card(0, 0, 11, 14, P.white, P.edge); pip(p, 'hearts', 3, 4); p.glyph('A', 1, 1, P.hearts); })); break;
      default: img = token(P.blue, P.blueDark, '+');
    }
    const { c, ctx } = U.canvas(18, 18);
    ctx.drawImage(img, Math.floor((18 - img.width) / 2), Math.floor((18 - img.height) / 2));
    return (iconCache[id] = c);
  }
  function token(c0, c1, ch) {
    return outline(paint(11, 11, (p) => { p.disc(5.5, 5.5, 5.5, c0); p.disc(5.5, 5.5, 3.6, c1); p.glyph(ch, 4, 3, P.white); }));
  }

  /* =====================================================================
     Popup bubbles (floating numbers) – drawn on the art grid with the 3x5 font
     ===================================================================== */
  const bubbleCache = new Map();
  function bubble(text, col) {
    const key = text + col;
    if (bubbleCache.has(key)) return bubbleCache.get(key);
    const w = textW(text) + 6, h = 10;
    const img = paint(w + 1, h + 2, (p) => {
      p.card(0, 2, w, h, 'rgba(0,0,0,.35)', 'rgba(0,0,0,.35)');
      const dark = U.rgb(U.mul(rgbOf(col), 0.68));
      p.card(1, 1, w, h, dark, dark);
      p.card(1, 0, w, h - 1, col, col);
      p.text(text, 4, 2, P.white);
    });
    if (bubbleCache.size > 200) bubbleCache.clear();
    bubbleCache.set(key, img);
    return img;
  }

  /* =====================================================================
     Poses (shared by sprites and their offset drop shadows)
     ===================================================================== */
  function playerPose(p) {
    const f = p.moving ? Math.floor(p.anim * 1.2) & 3 : 0;
    const j = juice(p.hurtT > 0 ? (1 - p.hurtT) / 3 : -1, 0.35);
    const dj = juice(p.dashT > 0 ? 0.2 - p.dashT : -1, 0.25);
    let rot = p.moving ? Math.sin(p.anim * 0.6 * Math.PI) * 0.07 : Math.sin(RT * 1.3) * 0.025;
    rot += j.r + dj.r + U.clamp((p.vx || 0) * 0.0006, -0.12, 0.12);
    const s = 1 + j.s + dj.s + (p.moving ? 0 : Math.sin(RT * 2.2) * 0.015);
    const bob = p.moving && (f === 1 || f === 3) ? 1 : 0;
    const img = SPR.jester[f][p.facing < 0 ? 1 : 0];
    return { img, x: p.x, y: p.y - bob, ax: img.width >> 1, ay: img.height - 1, rot, sx: s, sy: s, lift: 0 };
  }
  function enemyPose(e) {
    const j = juice(e.hitT !== undefined && e.hitT < 0.4 ? e.hitT : -1, 0.4);
    if (e.type === 'ghost') {
      const ph = RT * 4.2 + e.seed * 9;
      const c = Math.cos(ph);
      const img = SPR.flip[c < 0 ? 1 : 0];
      const lift = 10 + Math.sin(RT * 3 + e.seed * 6) * 2;
      return { img, x: e.x, y: e.y - lift, ax: img.width >> 1, ay: img.height >> 1, rot: Math.sin(ph * 0.5) * 0.18 + j.r, sx: Math.max(0.12, Math.abs(c)) * (1 + j.s), sy: 1 + j.s, lift };
    }
    if (e.type === 'colossus') {
      const img = SPR.big[(Math.floor(RT * 3 + e.seed * 4) & 1)][(Math.floor(RT * 0.7 + e.seed * 10) % 9 === 0) ? 1 : 0];
      const rot = Math.sin(e.anim * 1.6) * 0.08 + j.r;
      const s = 1 + j.s + Math.sin(RT * 2.4 + e.seed) * 0.02;
      return { img, x: e.x, y: e.y, ax: img.width >> 1, ay: img.height - 2, rot, sx: s, sy: s, lift: 0 };
    }
    const ph = e.anim * 2.2 + e.seed * 6;
    const hop = Math.abs(Math.sin(ph));
    const land = 1 - hop;
    const img = SPR.chip[(e.seed * 3) | 0][Math.floor(ph / Math.PI) & 1];
    return { img, x: e.x, y: e.y - hop * 5, ax: img.width >> 1, ay: img.height - 1, rot: Math.sin(ph) * 0.1 + j.r, sx: 1 + j.s + land * 0.12, sy: 1 + j.s - land * 0.14, lift: hop * 5 };
  }
  function drawShadowOf(ctx, pose, k) {
    const sh = silhouette(pose.img, '#000');
    const dx = U.clamp((pose.x - CAMX) * 0.025, -6, 6) + 1 + pose.lift * 0.35;
    const dy = 3;
    blit(ctx, sh, pose.x + dx, pose.y + pose.lift + dy, pose.ax, pose.ay, pose.rot, pose.sx, pose.sy, 0.33 * (k === undefined ? 1 : k));
  }
  function propPose(pr) {
    const img = pr.img;
    const sway = pr.sway ? Math.sin(RT * 1.1 + pr.seed * 9) * pr.sway : 0;
    return { img, x: pr.x, y: pr.y, ax: img.width >> 1, ay: img.height - 1, rot: sway, sx: 1, sy: 1, lift: 0 };
  }
  const ownsWorld = (view) => {
    const h = view && view.game && view.game.hooks;
    return !h || h === st || h.groundColor === st.groundColor;
  };

  /* =====================================================================
     The style
     ===================================================================== */
  const SPR = {};
  const st = {
    id: 'cardtable',
    name: 'Psychedelic Card Table',
    family: 'Pixel Art · CRT Card Table',
    description: 'Ein psychedelischer Kartentisch: fließender Farbwirbel als Boden, wackelnde Pixel-Spielkarten und Chips, Foil-, Holo- und Polychrom-Editionen, Brenn-Dissolve, Blasen-Pop-ups und ein CRT-Bildschirm.',
    pixelArt: { scale: PS },
    groundColor: '#3a6b58',
    groundNearest: true,
    chunkSize: 256,
    fonts: ['Jersey+10'],
    css: CSS,

    init() {
      SPR.jester = [0, 1, 2, 3].map((f) => { const c = jesterFrame(f); return [c, U.flipX(c)]; });
      SPR.chip = CHIP_COLS.map((col) => [chipFrame(col, 0), chipFrame(col, Math.PI / 8)]);
      SPR.flip = [flipCard(false), flipCard(true)];
      SPR.big = [0, 1].map((r) => [bigToken(r * Math.PI / 12, false), bigToken(r * Math.PI / 12, true)]);
      SPR.coin = [7, 5, 3, 5].map((w) => outline(paint(w, 7, (p) => { p.ellipse(w / 2, 3.5, w / 2, 3.5, P.gold); if (w > 3) p.ellipse(w / 2, 3.5, w / 2 - 1.5, 2, P.goldLight); else p.rect(1, 1, 1, 5, P.goldLight); })));
      SPR.planet = outline(paint(9, 12, (p) => { p.card(0, 0, 9, 12, P.planet, P.white); p.disc(4.5, 6, 2.8, P.white); p.rect(1, 6, 7, 1, P.gold); }));
      SPR.planetEd = editionFrames(SPR.planet, 'polychrome', 8);
      SPR.mini = outline(paint(5, 7, (p) => { p.card(0, 0, 5, 7, P.white, P.edge); p.rect(2, 2, 1, 3, P.red); p.rect(1, 3, 3, 1, P.red); }));
      SPR.tokBlue = token(P.blue, P.blueDark, '+');
      SPR.tokRed = token(P.red, P.redDark, 'X');
      SPR.coins = coinPile(3);
      // props
      SPR.props = {};
      SPR.cards = [];
      const suits = ['hearts', 'spades', 'diamonds', 'clubs'];
      for (let i = 0; i < 12; i++) {
        const base = outline(standingCard(RANKS[i], suits[i % 4]));
        SPR.cards.push(base);
      }
      SPR.decks = [11, 12, 13].map(deck);
      SPR.stacks = [4, 6, 8, 5, 7].map((n, i) => chipStack(n, 40 + i));
      SPR.dice = [1, 3, 5, 6].map(die);
      SPR.tarots = [outline(tarot(true)), outline(tarot(false))];
      SPR.piles = [21, 22].map(coinPile);
      SPR.packs = [P.planet, P.tarot, P.red].map((c) => outline(pack(c)));
      SPR.house = houseOfCards();
      SPR.ed = new Map();
      for (const img of SPR.cards.concat(SPR.tarots, SPR.packs)) {
        SPR.ed.set(img, { foil: editionFrames(img, 'foil', 8), holo: editionFrames(img, 'holo', 8), polychrome: editionFrames(img, 'polychrome', 8), negative: editionFrames(img, 'negative', 4) });
      }
      SW.cols = null; SW.last = -1;
    },

    *renderGroundChunk(ctx, info) { yield* buildChunk(ctx, info); },

    drawGroundOverlay(ctx, view) {
      setView(view);
      FR++;
      if (!ownsWorld(view)) return;
      updateSwirl(view);
      drawSwirl(ctx, view);
      // table zones in screen space (same layout as in the baked chunks)
      toScreen(ctx);
      const c0x = Math.floor(view.x0 / 230) - 1, c1x = Math.floor(view.x1 / 230), c0y = Math.floor(view.y0 / 230) - 1, c1y = Math.floor(view.y1 / 230);
      for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
        const z = zoneAt(cx, cy);
        if (z) drawZone(ctx, z, (X, Y) => [sx(X), sy(Y)]);
      }
      toWorld(ctx);
    },

    propsForChunk(info) {
      const out = [];
      const add = (x, y, img, o) => out.push(Object.assign({ x, y, img, seed: U.fract(x * 0.013 + y * 0.007), pad: 40, t: 'prop' }, o));
      G.scatterOwned(info, 150, 8101, (x, y, rng) => {
        if (G.nearSpawn(x, y, 90) || rng.next() > 0.5) return;
        const kind = rng.next();
        if (kind < 0.28) {
          // chip stacks, often in a little group with a coin pile
          const n = 1 + ((rng.next() * 3) | 0);
          for (let k = 0; k < n; k++) add(x + k * 13 - n * 6, y + (k % 2) * 4, SPR.stacks[(rng.next() * SPR.stacks.length) | 0], { t: 'chips' });
          if (rng.next() < 0.5) add(x + 8, y + 14, SPR.piles[(rng.next() * 2) | 0], { t: 'coins' });
        } else if (kind < 0.55) {
          // a standing card, sometimes with an edition
          const r = rng.next();
          const ed = r < 0.2 ? 'foil' : r < 0.32 ? 'holo' : r < 0.42 ? 'polychrome' : r < 0.48 ? 'negative' : null;
          add(x, y, SPR.cards[(rng.next() * SPR.cards.length) | 0], { t: 'card', ed, sway: 0.03, pad: 50 });
        } else if (kind < 0.67) add(x, y, SPR.decks[(rng.next() * 3) | 0], { t: 'deck' });
        else if (kind < 0.78) {
          add(x, y, SPR.dice[(rng.next() * 4) | 0], { t: 'die' });
          if (rng.next() < 0.6) add(x + 22, y + 6, SPR.dice[(rng.next() * 4) | 0], { t: 'die' });
        } else if (kind < 0.87) add(x, y, SPR.tarots[(rng.next() * 2) | 0], { t: 'tarot', ed: rng.next() < 0.4 ? 'foil' : null, sway: 0.025, pad: 50 });
        else if (kind < 0.95) add(x, y, SPR.packs[(rng.next() * 3) | 0], { t: 'pack', ed: 'holo', sway: 0.04 });
        else add(x, y, SPR.house, { t: 'house', pad: 50 });
      });
      return out;
    },

    drawProp(ctx, pr) {
      const pose = propPose(pr);
      let img = pose.img;
      if (pr.ed) {
        const set = SPR.ed.get(pr.img);
        if (set) { const fr = set[pr.ed]; img = fr[Math.floor(RT * 6 + pr.seed * 8) % fr.length]; }
      }
      blit(ctx, img, pose.x, pose.y, pose.ax, pose.ay, pose.rot, 1, 1);
    },

    drawShadow(ctx, o) {
      if (o.kind === 'prop') { if (o.img) drawShadowOf(ctx, propPose(o)); return; }
      if (o.kind === 'enemy') {
        if (o.dying || o.spawnT < 0.5) return;
        drawShadowOf(ctx, enemyPose(o), o.type === 'ghost' ? 0.7 : 1);
        return;
      }
      if (!SPR.jester) return;
      drawShadowOf(ctx, playerPose(o));
    },

    drawPlayer(ctx, p, view) {
      const pose = playerPose(p);
      if (p.dashT > 0) {
        const tint = silhouette(pose.img, P.blue);
        for (let k = 2; k >= 1; k--) blit(ctx, tint, p.x - p.dashX * k * 8, p.y - p.dashY * k * 8, pose.ax, pose.ay, pose.rot, pose.sx, pose.sy, 0.22 * (3 - k));
      }
      if (p.iframes > 0 && (FR & 4)) return;
      const img = p.hurtT > 0.45 ? silhouette(pose.img, P.white) : pose.img;
      blit(ctx, img, pose.x, pose.y, pose.ax, pose.ay, pose.rot, pose.sx, pose.sy);
      if (p.levelT > 0) {
        // glow-up: a ring of gold squares turning around the card
        toScreen(ctx);
        const n = 10, R = 16 + (1 - Math.min(1, p.levelT)) * 6;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * U.TAU + RT * 3;
          ctx.fillStyle = i % 2 ? P.gold : P.white;
          ctx.fillRect(sx(p.x + Math.cos(a) * R) - 1, sy(p.y - 14 + Math.sin(a) * R * 0.8) - 1, 2, 2);
        }
        toWorld(ctx);
      }
      void view;
    },

    drawEnemy(ctx, e, view) {
      const pose = enemyPose(e);
      if (e.dying) {
        const img = dissolveFrame(pose.img, Math.min(1, e.deathT * 1.1), 'burn');
        blit(ctx, img, pose.x, pose.y, pose.ax, pose.ay, pose.rot, pose.sx, pose.sy);
        if ((FR & 3) === 0 && e.deathT < 0.8) {
          view.game.addParticle({ x: e.x + (Math.random() - 0.5) * pose.img.width * 0.8, y: e.y, z: 4 + Math.random() * pose.img.height * 0.8, vz: 25, life: 0.45, kind: 'ember', color: Math.random() < 0.5 ? P.orange : P.red, drag: 1 });
        }
        return;
      }
      if (e.spawnT < 0.5) {
        blit(ctx, dissolveFrame(pose.img, 1 - e.spawnT / 0.5, 'mat'), pose.x, pose.y, pose.ax, pose.ay, pose.rot, pose.sx, pose.sy);
        return;
      }
      const img = e.flash > 0.4 ? silhouette(pose.img, P.white) : pose.img;
      blit(ctx, img, pose.x, pose.y, pose.ax, pose.ay, pose.rot, pose.sx, pose.sy);
      if (e.type === 'colossus') {
        // shimmering rim: a few bright pixels running around the token
        toScreen(ctx);
        for (let i = 0; i < 4; i++) {
          const a = RT * 2.2 + (i / 4) * U.TAU;
          ctx.fillStyle = i % 2 ? P.white : P.goldLight;
          ctx.fillRect(sx(e.x + Math.cos(a) * 17) - 1, sy(e.y - 17 + Math.sin(a) * 17) - 1, 2, 2);
        }
        toWorld(ctx);
      }
    },

    drawGem(ctx, g) {
      const z = g.pop > 0 ? Math.round(Math.sin(g.pop * Math.PI) * 6) : 0;
      const bob = Math.round(Math.sin(RT * 3 + g.seed * 6) * 1.5);
      if (g.big) {
        const img = SPR.planetEd[Math.floor(RT * 6 + g.seed * 8) % 8];
        blit(ctx, img, g.x, g.y - 4 - z - bob, img.width >> 1, img.height >> 1, Math.sin(RT * 2 + g.seed * 5) * 0.15, 1, 1);
        if (Math.floor(RT * 3 + g.seed * 7) % 4 === 0) {
          toScreen(ctx); ctx.fillStyle = P.white;
          const X = sx(g.x + 4), Y = sy(g.y - 11 - z - bob);
          ctx.fillRect(X, Y - 1, 1, 3); ctx.fillRect(X - 1, Y, 3, 1);
          toWorld(ctx);
        }
      } else {
        const img = SPR.coin[Math.floor(RT * 8 + g.seed * 4) & 3];
        blit(ctx, img, g.x, g.y - 3 - z - bob, img.width >> 1, img.height >> 1);
      }
    },

    drawProjectile(ctx, pr) {
      const sp = Math.hypot(pr.vx, pr.vy) || 1;
      toScreen(ctx);
      for (let k = 1; k <= 3; k++) {
        ctx.globalAlpha = 0.6 - k * 0.15;
        ctx.fillStyle = k === 1 ? P.white : P.edge;
        const s = 3 - Math.min(2, k - 1);
        ctx.fillRect(sx(pr.x - (pr.vx / sp) * k * 4) - (s >> 1), sy(pr.y - (pr.vy / sp) * k * 4) - (s >> 1), s, s);
      }
      ctx.globalAlpha = 1;
      toWorld(ctx);
      blit(ctx, SPR.mini, pr.x, pr.y, 3, 4, RT * 14 + (pr.seed || 0) * 6, 1, 1);
    },

    drawOrbital(ctx, o) {
      const img = o.idx % 2 ? SPR.tokRed : SPR.tokBlue;
      const c = Math.cos(RT * 5 + o.idx);
      blit(ctx, img, o.x, o.y, img.width >> 1, img.height >> 1, 0, Math.max(0.25, Math.abs(c)), 1);
      if ((Math.floor(RT * 8) + o.idx) % 5 === 0) {
        toScreen(ctx); ctx.fillStyle = P.white; ctx.fillRect(sx(o.x) + 3, sy(o.y) - 6, 1, 1); toWorld(ctx);
      }
    },

    drawParticle(ctx, pt) {
      const k = 1 - pt.life / pt.max;
      const X = pt.x, Y = pt.y - pt.z;
      toScreen(ctx);
      switch (pt.kind) {
        case 'pop': {
          const img = bubble(pt.text, pt.color || P.red);
          const sc = k < 0.2 ? U.ease.outBack(k / 0.2) : k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1;
          const w = juice(k * pt.max, 0.15);
          toWorld(ctx);
          blit(ctx, img, X, Y - k * 8, img.width >> 1, img.height >> 1, (pt.rot0 || 0) + w.r, Math.max(0.05, sc), Math.max(0.05, sc));
          return;
        }
        case 'star': {
          const s = Math.round(4 * (1 - k * k)) + 1;
          ctx.fillStyle = pt.color || P.white;
          const x = sx(X), y = sy(Y);
          ctx.fillRect(x, y - s, 1, s * 2 + 1); ctx.fillRect(x - s, y, s * 2 + 1, 1);
          if (s > 2) ctx.fillRect(x - 1, y - 1, 3, 3);
          break;
        }
        case 'ring': {
          const R = 4 + k * (pt.size || 24);
          ctx.fillStyle = pt.color || P.gold;
          ctx.globalAlpha = 1 - k;
          for (let i = 0; i < 16; i++) { const a = (i / 16) * U.TAU; ctx.fillRect(sx(X + Math.cos(a) * R) - 1, sy(Y + Math.sin(a) * R * 0.7) - 1, 2, 2); }
          ctx.globalAlpha = 1;
          break;
        }
        case 'ember': {
          ctx.fillStyle = k < 0.4 ? '#FFE8A0' : pt.color || P.orange;
          ctx.fillRect(sx(X), sy(Y), 1, 1);
          break;
        }
        case 'echo': {
          toWorld(ctx);
          if (pt.img) blit(ctx, silhouette(pt.img, pt.color || P.blue), X, Y, pt.img.width >> 1, pt.img.height - 1, pt.rot, 1, 1, 0.35 * (1 - k));
          return;
        }
        default: {
          // the signature square: spins and shrinks to nothing
          const s = (pt.size || 2) * 1.6 * (1 - k * k);
          if (s < 0.5) break;
          ctx.save();
          ctx.translate(sx(X), sy(Y));
          ctx.rotate(pt.rot);
          ctx.fillStyle = pt.color || P.white;
          ctx.fillRect(-s / 2, -s / 2, s, s);
          ctx.restore();
        }
      }
      toWorld(ctx);
    },

    drawNumber(ctx, n) {
      const k = 1 - n.life / n.max;
      const img = bubble((n.crit ? 'X' : '+') + n.value, n.crit ? P.red : P.blue);
      const sc = k < 0.25 ? U.ease.outBack(k / 0.25) : k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1;
      blit(ctx, img, n.x, n.y, img.width >> 1, img.height >> 1, (n.seed - 0.5) * 0.3 + juice(k * n.max, 0.12).r, Math.max(0.05, sc), Math.max(0.05, sc));
    },

    drawDisplayOverlay(ctx, view) {
      const W = view.displayW, H = view.displayH;
      const gl = glInit();
      if (gl) {
        glSize(W, H);
        gl.viewport(0, 0, W, H);
        gl.bindTexture(gl.TEXTURE_2D, GL.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        const C = GL.crt;
        gl.useProgram(C.p);
        gl.uniform1i(C.u.uTex, 0);
        gl.uniform2f(C.u.uRes, W, H);
        gl.uniform1f(C.u.uTime, view.rt);
        gl.uniform1f(C.u.uUp, Math.max(2, view.up || 3));
        gl.uniform1f(C.u.uMip, Math.log2(Math.max(2, view.up || 3)) + 1.5);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        ctx.globalCompositeOperation = 'copy';
        ctx.drawImage(GL.c, 0, GL.c.height - H, W, H, 0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
        return;
      }
      // 2D fallback: scanlines + vignette + rounded dark corners
      const up = Math.max(2, view.up || 3);
      if (!this._scan || this._scan.up !== up) {
        const c = U.sprite(4, up, (g) => { g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(0, up - 1, 4, 1); });
        this._scan = { up, pat: ctx.createPattern(c, 'repeat') };
      }
      ctx.fillStyle = this._scan.pat;
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },

    drawIcon(ctx, id, size) {
      const c = iconCanvas(id);
      const s = Math.max(1, Math.floor(size / 18));
      ctx.imageSmoothingEnabled = false;
      const o = Math.floor((size - 18 * s) / 2);
      ctx.drawImage(c, o, o, 18 * s, 18 * s);
    },

    /* ---------- events → squares, stars, popups ---------- */
    onHit(game, e) {
      const top = e.type === 'colossus' ? 20 : e.type === 'ghost' ? 14 : 9;
      const cols = e.type === 'ghost' ? [P.tarot, P.white] : e.type === 'colossus' ? [P.crimson, P.gold] : [CHIP_COLS[(e.seed * 3) | 0][0], P.white];
      for (let k = 0; k < 3; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: e.x, y: e.y, z: top, vx: Math.cos(a) * 55, vy: Math.sin(a) * 25, vz: 20, drag: 3, life: 0.35, size: 2.2, color: cols[k % 2], kind: 'sq', vr: 12 });
      }
      game.addParticle({ x: e.x, y: e.y, z: top, kind: 'star', life: 0.18, drag: 0 });
    },
    onKill(game, e) {
      const big = e.type === 'colossus';
      const top = big ? 20 : e.type === 'ghost' ? 14 : 9;
      const cols = e.type === 'ghost' ? [P.tarot, P.gold, P.white] : big ? [P.crimson, P.gold, P.white, P.orange] : [CHIP_COLS[(e.seed * 3) | 0][0], P.white, CHIP_COLS[(e.seed * 3) | 0][1]];
      const n = big ? 18 : 8;
      for (let k = 0; k < n; k++) {
        const a = Math.random() * U.TAU, s = (big ? 120 : 80) * (0.4 + Math.random() * 0.8);
        game.addParticle({ x: e.x, y: e.y, z: top, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, vz: 10, drag: 3.2, life: 0.5 + Math.random() * 0.3, size: big ? 3 : 2.2, color: cols[k % cols.length], kind: 'sq', vr: (Math.random() - 0.5) * 14 });
      }
      game.addParticle({ x: e.x, y: e.y - 4, z: top + 8, kind: 'pop', text: big ? 'X2' : '+' + (e.type === 'ghost' ? 5 : 10), color: big ? P.red : P.blue, life: 0.8, drag: 0, rot0: (Math.random() - 0.5) * 0.3 });
      if (big) { game.addParticle({ x: e.x, y: e.y, z: 0, kind: 'ring', size: 34, color: P.gold, life: 0.5, drag: 0 }); game.shake = Math.max(game.shake, 4); }
    },
    onHurt(game, p) {
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: p.x, y: p.y, z: 16, vx: Math.cos(a) * 70, vy: Math.sin(a) * 30, drag: 3, life: 0.45, size: 2.4, color: k % 2 ? P.red : P.white, kind: 'sq', vr: 12 });
      }
      game.addParticle({ x: p.x, y: p.y, z: 18, kind: 'star', color: P.red, life: 0.2, drag: 0 });
    },
    onPickup(game, g) {
      for (let k = 0; k < (g.big ? 6 : 2); k++) {
        const a = Math.random() * U.TAU;
        game.addParticle({ x: g.x, y: g.y, z: 6, vx: Math.cos(a) * 40, vy: Math.sin(a) * 20, drag: 3, life: 0.35, size: 2, color: k % 2 ? P.goldLight : P.gold, kind: 'sq', vr: 10 });
      }
      game.addParticle({ x: g.x, y: g.y, z: 8, kind: 'star', color: P.goldLight, life: 0.2, drag: 0 });
      if (g.big) game.addParticle({ x: g.x, y: g.y, z: 16, kind: 'pop', text: '$5', color: P.gold, life: 0.8, drag: 0 });
    },
    onShoot(game, pr) {
      game.addParticle({ x: pr.x, y: pr.y, z: 0, kind: 'sq', size: 1.5, color: P.white, life: 0.15, drag: 0 });
    },
    onDash(game, p) {
      const img = SPR.jester[0][p.facing < 0 ? 1 : 0];
      for (let k = 0; k < 3; k++) game.addParticle({ x: p.x - p.dashX * k * 7, y: p.y - p.dashY * k * 7, z: 0, kind: 'echo', img, color: k % 2 ? P.red : P.blue, life: 0.25 + k * 0.05, drag: 0 });
      for (let k = 0; k < 4; k++) game.addParticle({ x: p.x, y: p.y, z: 3, vx: -p.dashX * 60 + (Math.random() - 0.5) * 30, vy: -p.dashY * 40, drag: 3, life: 0.3, size: 2, color: P.white, kind: 'sq', vr: 10 });
    },
    onLevelUp(game, p) {
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * U.TAU;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * 110, vy: Math.sin(a) * 60, vz: 20, drag: 2.6, kind: 'sq', size: 3, life: 0.7, color: [P.gold, P.white, P.red, P.blue][k % 4], vr: 10 });
      }
      for (let k = 0; k < 6; k++) game.addParticle({ x: p.x + (Math.random() - 0.5) * 36, y: p.y, z: 6 + Math.random() * 30, kind: 'star', life: 0.4 + k * 0.05, drag: 0, color: k % 2 ? P.goldLight : P.white });
      game.addParticle({ x: p.x, y: p.y, z: 0, kind: 'ring', size: 40, color: P.gold, life: 0.6, drag: 0 });
      game.addParticle({ x: p.x, y: p.y, z: 40, kind: 'pop', text: 'X2', color: P.red, life: 1, drag: 0, rot0: -0.1 });
      SW.pulse += 1.6;
    },
    onDeath(game, p) {
      for (let k = 0; k < 30; k++) {
        const a = Math.random() * U.TAU, s = 60 + Math.random() * 90;
        game.addParticle({ x: p.x, y: p.y, z: 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, drag: 2.4, kind: k % 3 ? 'sq' : 'ember', size: 2.6, life: 0.8, color: [P.orange, P.red, '#FFE8A0'][k % 3], vr: 12 });
      }
    },
  };
  Styles.register(st);
})();
