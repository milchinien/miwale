/*!
 * BalatroFX Art – prozedurale Pixel-Art im Balatro-Format (Karten 71×95 px, Würfel 32×32 px).
 * Alle Motive sind eigene Entwürfe; Pixel werden ganzzahlig gesetzt, damit sie beim
 * Hochskalieren (NEAREST) gestochen scharf bleiben.
 * Benötigt balatro-fx.js (window.BalatroFX).
 */
(function (global) {
  'use strict';
  const FX = global.BalatroFX;
  const P = FX.PALETTE;
  const { darken, lighten } = FX.color;

  const CARD_W = 71, CARD_H = 95;

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return [c, ctx];
  }

  const parse = (rows) => rows.trim().split('\n').map((r) => r.trim());

  /** Bitmap aus 'X'/'.'-Zeilen zeichnen. */
  function bitmap(ctx, rows, x, y, colour, scale = 1, flipY = false) {
    ctx.fillStyle = colour;
    const h = rows.length;
    for (let j = 0; j < h; j++) {
      const row = rows[flipY ? h - 1 - j : j];
      for (let i = 0; i < row.length; i++) if (row[i] === 'X') ctx.fillRect(x + i * scale, y + j * scale, scale, scale);
    }
  }
  /** Pixel-Form aus einer Funktion f(px,py)->bool (Pixelzentren). */
  function pixelShape(ctx, x, y, w, h, fn, colour) {
    ctx.fillStyle = colour;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (fn(i + 0.5, j + 0.5)) ctx.fillRect(x + i, y + j, 1, 1);
  }
  /** Abgerundetes Pixel-Rechteck (Ecken stufig abgeschnitten). */
  function pixelRect(ctx, x, y, w, h, colour, insets = [3, 1, 1]) {
    ctx.fillStyle = colour;
    const r = insets.length;
    for (let j = 0; j < h; j++) {
      const ins = j < r ? insets[j] : j >= h - r ? insets[h - 1 - j] : 0;
      ctx.fillRect(x + ins, y + j, w - ins * 2, 1);
    }
  }

  // ── 5×7-Pixelziffern für Kartenwerte ─────────────────────────────────────
  const GLYPHS = {
    A: '.XXX.\nX...X\nX...X\nXXXXX\nX...X\nX...X\nX...X',
    2: '.XXX.\nX...X\n....X\n..XX.\n.X...\nX....\nXXXXX',
    3: 'XXXX.\n....X\n....X\n.XXX.\n....X\n....X\nXXXX.',
    4: '...X.\n..XX.\n.X.X.\nX..X.\nXXXXX\n...X.\n...X.',
    5: 'XXXXX\nX....\nXXXX.\n....X\n....X\nX...X\n.XXX.',
    6: '.XXX.\nX....\nX....\nXXXX.\nX...X\nX...X\n.XXX.',
    7: 'XXXXX\n....X\n...X.\n..X..\n..X..\n..X..\n..X..',
    8: '.XXX.\nX...X\nX...X\n.XXX.\nX...X\nX...X\n.XXX.',
    9: '.XXX.\nX...X\nX...X\n.XXXX\n....X\n....X\n.XXX.',
    0: '.XXX.\nX...X\nX..XX\nX.X.X\nXX..X\nX...X\n.XXX.',
    1: '.X.\nXX.\n.X.\n.X.\n.X.\n.X.\nXXX',
    J: '..XXX\n...X.\n...X.\n...X.\nX..X.\nX..X.\n.XX..',
    Q: '.XXX.\nX...X\nX...X\nX...X\nX.X.X\nX..X.\n.XX.X',
    K: 'X...X\nX..X.\nX.X..\nXX...\nX.X..\nX..X.\nX...X',
  };
  for (const k in GLYPHS) GLYPHS[k] = parse(GLYPHS[k]);

  function drawRank(ctx, rank, x, y, colour, scale = 1) {
    let cx = x;
    for (const ch of String(rank)) { const g = GLYPHS[ch]; bitmap(ctx, g, cx, y, colour, scale); cx += (g[0].length + 1) * scale; }
  }
  function rankWidth(rank, scale = 1) { let w = 0; for (const ch of String(rank)) w += (GLYPHS[ch][0].length + 1) * scale; return w - scale; }

  // ── Farben (Suits) ───────────────────────────────────────────────────────
  const PIPS = {
    hearts: parse(`
      .XX...XX.
      XXXX.XXXX
      XXXXXXXXX
      XXXXXXXXX
      .XXXXXXX.
      ..XXXXX..
      ...XXX...
      ....X....`),
    diamonds: parse(`
      ....X....
      ...XXX...
      ..XXXXX..
      .XXXXXXX.
      XXXXXXXXX
      .XXXXXXX.
      ..XXXXX..
      ...XXX...
      ....X....`),
    spades: parse(`
      ....X....
      ...XXX...
      ..XXXXX..
      .XXXXXXX.
      XXXXXXXXX
      XXXXXXXXX
      .XX.X.XX.
      ....X....
      ...XXX...`),
    clubs: parse(`
      ...XXX...
      ..XXXXX..
      ..XXXXX..
      XX.XXX.XX
      XXXXXXXXX
      XXXXXXXXX
      XX.XXX.XX
      ....X....
      ...XXX...`),
  };
  const SMALL_PIPS = {
    hearts: parse('XX.XX\nXXXXX\nXXXXX\n.XXX.\n..X..'),
    diamonds: parse('..X..\n.XXX.\nXXXXX\n.XXX.\n..X..'),
    spades: parse('..X..\n.XXX.\nXXXXX\nXXXXX\n..X..'),
    clubs: parse('.XXX.\n.XXX.\nXXXXX\nXXXXX\n..X..'),
  };
  const SUIT_COLOURS = { hearts: P.HEARTS, diamonds: P.DIAMONDS, spades: P.SPADES, clubs: P.CLUBS };

  // Pip-Layouts: [Spalte (-1/0/1), Zeile (0..1)]
  const T = 1 / 3;
  const LAYOUTS = {
    2: [[0, 0], [0, 1]],
    3: [[0, 0], [0, 0.5], [0, 1]],
    4: [[-1, 0], [1, 0], [-1, 1], [1, 1]],
    5: [[-1, 0], [1, 0], [0, 0.5], [-1, 1], [1, 1]],
    6: [[-1, 0], [1, 0], [-1, 0.5], [1, 0.5], [-1, 1], [1, 1]],
    7: [[-1, 0], [1, 0], [0, 0.25], [-1, 0.5], [1, 0.5], [-1, 1], [1, 1]],
    8: [[-1, 0], [1, 0], [0, 0.25], [-1, 0.5], [1, 0.5], [0, 0.75], [-1, 1], [1, 1]],
    9: [[-1, 0], [1, 0], [-1, T], [1, T], [0, 0.5], [-1, 2 * T], [1, 2 * T], [-1, 1], [1, 1]],
    10: [[-1, 0], [1, 0], [0, T / 2], [-1, T], [1, T], [-1, 2 * T], [1, 2 * T], [0, 1 - T / 2], [-1, 1], [1, 1]],
  };

  function cardBase(ctx, fill = P.CARD, edge = P.CARD_EDGE) {
    pixelRect(ctx, 0, 0, CARD_W, CARD_H, edge, [3, 1, 1]);
    pixelRect(ctx, 1, 1, CARD_W - 2, CARD_H - 2, fill, [2, 1]);
  }

  function corner(ctx, rank, suit, col) {
    drawRank(ctx, rank, 4, 4, col);
    const rw = rankWidth(rank);
    bitmap(ctx, SMALL_PIPS[suit], 4 + Math.round((rw - 5) / 2), 13, col);
  }

  /** Spielkarte. rank: 2–10, 'J','Q','K','A'; suit: hearts|diamonds|spades|clubs */
  function card(rank, suit) {
    const [c, ctx] = canvas(CARD_W, CARD_H);
    const col = SUIT_COLOURS[suit];
    cardBase(ctx);
    corner(ctx, rank, suit, col);
    ctx.save(); ctx.translate(CARD_W, CARD_H); ctx.rotate(Math.PI); corner(ctx, rank, suit, col); ctx.restore();

    const pip = PIPS[suit], ph = pip.length;
    if (typeof rank === 'number') {
      const xs = { '-1': 22, 0: 35.5, 1: 49 };
      for (const [cx, fy] of LAYOUTS[rank]) {
        const x = Math.round(xs[cx] - 4.5), y = Math.round(17 + fy * 61 - ph / 2);
        bitmap(ctx, pip, x, y, col, 1, fy > 0.5);
      }
    } else if (rank === 'A') {
      const s = suit === 'spades' ? 4 : 3;
      bitmap(ctx, pip, Math.round(35.5 - 4.5 * s), Math.round(47.5 - (ph * s) / 2), col, s);
    } else {
      // Bildkarte: Rahmen + großer Buchstabe
      pixelRect(ctx, 12, 13, 47, 69, col, [1]);
      pixelRect(ctx, 13, 14, 45, 67, lighten(col, 0.82), [1]);
      for (let y = 16; y < 79; y += 4) for (let x = 15 + ((y / 4) % 2) * 2; x < 56; x += 4) { ctx.fillStyle = lighten(col, 0.7); ctx.fillRect(x, y, 1, 1); }
      const s = 5;
      drawRank(ctx, rank, Math.round(35.5 - rankWidth(rank, s) / 2), Math.round(47.5 - 3.5 * s), darken(col, 0.15), s);
      drawRank(ctx, rank, Math.round(35.5 - rankWidth(rank, s) / 2) - 1, Math.round(47.5 - 3.5 * s) - 1, col, s);
      bitmap(ctx, SMALL_PIPS[suit], 15, 16, col);
      ctx.save(); ctx.translate(CARD_W, CARD_H); ctx.rotate(Math.PI); bitmap(ctx, SMALL_PIPS[suit], 15, 16, col); ctx.restore();
    }
    return c;
  }

  /** Kartenrückseite mit Rautenmuster. */
  function cardBack(colour = '#DA4A41', accent = '#FFFFFF') {
    const [c, ctx] = canvas(CARD_W, CARD_H);
    cardBase(ctx, colour, accent);
    pixelRect(ctx, 3, 3, CARD_W - 6, CARD_H - 6, accent, [2, 1]);
    pixelRect(ctx, 4, 4, CARD_W - 8, CARD_H - 8, colour, [1]);
    const d = darken(colour, 0.22);
    for (let y = 6; y < CARD_H - 6; y++) for (let x = 6; x < CARD_W - 6; x++) {
      const u = (x - 6) % 10, v = (y - 6) % 10;
      if (Math.abs(u - 5) + Math.abs(v - 5) === 4) { ctx.fillStyle = d; ctx.fillRect(x, y, 1, 1); }
    }
    pixelRect(ctx, 20, 33, 31, 29, accent, [3, 1, 1]);
    pixelRect(ctx, 22, 35, 27, 25, colour, [2, 1]);
    diePips(ctx, 22, 35, 27, 5, accent, 3);
    return c;
  }

  // ── Würfel ──────────────────────────────────────────────────────────────
  const DIE_LAYOUT = {
    1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  };
  function diePips(ctx, x, y, size, value, colour, pipSize) {
    const step = (size - 2 * Math.round(size * 0.22)) / 2, off = Math.round(size * 0.22);
    for (const [i, j] of DIE_LAYOUT[value]) {
      const ps = value === 1 && pipSize > 3 ? pipSize + 2 : pipSize;
      const px = Math.round(x + off + i * step - ps / 2), py = Math.round(y + off + j * step - ps / 2);
      pixelRect(ctx, px, py, ps, ps, colour, ps >= 4 ? [1] : []);
    }
  }
  /** Würfel 32×32. opts: { body, pip, onePip, edge } */
  function die(value, opts = {}) {
    const [c, ctx] = canvas(32, 32);
    const body = opts.body || '#FFFFFF', edge = opts.edge || P.CARD_EDGE;
    pixelRect(ctx, 0, 0, 32, 32, edge, [4, 2, 1, 1]);
    pixelRect(ctx, 1, 1, 30, 30, darken(body, 0.12), [3, 1, 1]);
    pixelRect(ctx, 1, 1, 30, 27, body, [3, 1, 1]);
    diePips(ctx, 1, 0, 30, value, value === 1 ? opts.onePip || P.RED : opts.pip || P.BLACK, 5);
    return c;
  }

  // ── Joker-Icons (eigene Motive) ─────────────────────────────────────────
  const ICONS = {
    clover(ctx, x, y, col) {
      const leaves = [[11, 6], [16, 11], [11, 16], [6, 11]];
      pixelShape(ctx, x, y, 23, 27, (px, py) => leaves.some(([cx, cy]) => Math.hypot(px - cx, py - cy) < 4.6) || (Math.abs(px - 11.5 - (py - 18) * 0.35) < 1 && py > 15 && py < 26), col);
      pixelShape(ctx, x, y, 23, 27, (px, py) => leaves.some(([cx, cy]) => Math.hypot(px - cx + 1.3, py - cy + 1.3) < 1.6), lighten(col, 0.45));
    },
    star(ctx, x, y, col) {
      const R = 13, r = 5.6, cx = 13.5, cy = 14;
      const inStar = (px, py) => {
        const a = Math.atan2(py - cy, px - cx) + Math.PI / 2, d = Math.hypot(px - cx, py - cy);
        const seg = (2 * Math.PI) / 5, t = ((a % seg) + seg) % seg / seg;
        const lim = r + (R - r) * Math.pow(Math.abs(1 - 2 * t), 1.35);
        return d < lim;
      };
      pixelShape(ctx, x, y, 27, 27, inStar, darken(col, 0.25));
      pixelShape(ctx, x - 1, y - 1, 27, 27, inStar, col);
      pixelShape(ctx, x - 1, y - 1, 27, 27, (px, py) => Math.hypot(px - cx + 2, py - cy + 2) < 2.2, lighten(col, 0.6));
    },
    coin(ctx, x, y, col) {
      pixelShape(ctx, x, y, 27, 27, (px, py) => Math.hypot(px - 13.5, py - 13.5) < 13, darken(col, 0.3));
      pixelShape(ctx, x, y, 27, 27, (px, py) => Math.hypot(px - 13.5, py - 12.5) < 12, col);
      pixelShape(ctx, x, y, 27, 27, (px, py) => { const d = Math.hypot(px - 13.5, py - 12.5); return d < 9 && d > 7.6; }, darken(col, 0.2));
      bitmap(ctx, parse('.XXX.\nX....\n.XX..\n...X.\n....X\nXXXX.'), x + 11, y + 9, darken(col, 0.35));
    },
    die(ctx, x, y) {
      const d = die(5);
      ctx.drawImage(d, x - 2, y - 2);
    },
    heart(ctx, x, y, col) { bitmap(ctx, PIPS.hearts, x + 1, y + 3, col, 3); },
  };

  /** Joker-Karte mit Icon. icon: clover|star|coin|die|heart */
  function joker(icon, colour = '#5BA7D6', iconColour = '#FFFFFF') {
    const [c, ctx] = canvas(CARD_W, CARD_H);
    cardBase(ctx, '#FFFFFF', P.CARD_EDGE);
    pixelRect(ctx, 4, 4, CARD_W - 8, CARD_H - 8, darken(colour, 0.3), [2, 1]);
    pixelRect(ctx, 5, 5, CARD_W - 10, CARD_H - 10, colour, [1]);
    // diagonale Streifen im Hintergrund
    ctx.fillStyle = lighten(colour, 0.12);
    for (let y = 5; y < CARD_H - 5; y++) for (let x = 5; x < CARD_W - 5; x++) if (((x + y) >> 2) % 2 === 0 && x > 5 && x < CARD_W - 6 && y > 6 && y < CARD_H - 7) ctx.fillRect(x, y, 1, 1);
    // Sockel
    pixelRect(ctx, 14, 64, 43, 8, darken(colour, 0.35), [1]);
    pixelRect(ctx, 16, 66, 39, 4, lighten(colour, 0.25), [1]);
    ICONS[icon](ctx, 22, 30, iconColour);
    return c;
  }

  global.BalatroFX.Art = {
    CARD_W, CARD_H, canvas, bitmap, pixelShape, pixelRect, drawRank, rankWidth,
    card, cardBack, die, joker, PIPS, SMALL_PIPS, SUIT_COLOURS, ICONS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
