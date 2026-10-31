/* Psychedelic Card Table – starter kit (Canvas 2D, no dependencies).
   Contains: palette, the paint swirl floor (CPU version, low resolution), the juice wobble, pixel sprites for a
   card character / chip token / chip stack, offset silhouette shadows, square particles, popup bubbles and a light
   CRT overlay. draw(ctx, w, h, t) renders a complete, deterministic preview scene.
   For the full look use the WebGL fragment shaders from STYLE.md (swirl per frame on the GPU + CRT pass). */
(function (root) {
  'use strict';

  const PALETTE = {
    red: '#FE5F55', redDark: '#C2453E', blue: '#009DFF', blueDark: '#0067B0',
    gold: '#F3B958', goldDark: '#B8862F', goldLight: '#FFE8A8', orange: '#FDA200', green: '#4BC292', greenDark: '#2E8A64',
    tarot: '#A782D1', planet: '#13AFCE', white: '#FFFFFF', edge: '#BFC7D5', pink: '#F5A3A3',
    ink: '#24302F', black: '#374244', panel: '#3A5055', panelDark: '#26353A',
    felt: '#50846E', crimson: '#C9473A', crimsonDark: '#5A1E1A', cardBack: '#DA4A41',
  };
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const TAU = Math.PI * 2;

  /* ---------- the paint swirl ---------- */
  // three swirl colours from one base colour: x0.9 (main), x1.3 (highlight paint), x0.7 (deep paint)
  function swirlColours(base) {
    const c = hex(base);
    return [0.9, 1.3, 0.7].map((k) => c.map((v) => Math.min(255, v * k) / 255));
  }
  // world -> bounded swirl coordinates (the swirl needs inputs of about ±0.5)
  function fold(x, y) {
    return [0.26 * Math.sin(x / 150) + 0.2 * Math.sin((x * 0.6 + y * 0.8) / 131 + 1.3),
      0.26 * Math.sin(y / 150 + 0.7) + 0.2 * Math.sin((y * 0.6 - x * 0.8) / 127 + 2.1)];
  }
  /** One swirl sample. wx/wy: world position, l: distance from the screen centre / 612, flow: time * 7. */
  function swirl(wx, wy, l, flow, cols, contrast) {
    const spinAmt = 0.25, a = 302.2 - 20 * (spinAmt * l + (1 - spinAmt));
    const p = fold(wx, wy), ca = Math.cos(a), sa = Math.sin(a);
    let ux = (p[0] * ca - p[1] * sa) * 30, uy = (p[0] * sa + p[1] * ca) * 30, vx = ux + uy, vy = vx;
    for (let i = 0; i < 5; i++) {
      const m = Math.sin(Math.max(ux, uy));
      vx += m + ux; vy += m + uy;
      ux += 0.5 * Math.cos(5.1123314 + 0.353 * vy + flow * 0.131121);
      uy += 0.5 * Math.sin(vx - 0.113 * flow);
      const d = Math.cos(ux + uy) - Math.sin(ux * 0.711 - uy);
      ux -= d; uy -= d;
    }
    const cm = 0.25 * contrast + 0.5 * spinAmt + 1.2;
    const pv = Math.min(2, Math.max(0, Math.hypot(ux, uy) * 0.035 * cm));
    const c1 = Math.max(0, 1 - cm * Math.abs(1 - pv)), c2 = Math.max(0, 1 - cm * Math.abs(pv)), c3 = 1 - Math.min(1, c1 + c2);
    const light = 0.08 * Math.max(c1 * 5 - 4, 0) + 0.28 * Math.max(c2 * 5 - 4, 0);
    const b = 0.3 / contrast;
    return [0, 1, 2].map((k) => b * cols[0][k] + (1 - b) * (cols[0][k] * c1 + cols[1][k] * c2 + cols[2][k] * c3) + light);
  }

  /* ---------- juice: the wobble every reacting object gets ---------- */
  function juice(age, amount) {
    if (age < 0 || age > 0.4) return { s: 0, r: 0 };
    const k = (0.4 - age) / 0.4;
    return { s: amount * Math.sin(50.8 * age) * k * k * k, r: amount * 0.5 * Math.sin(40.8 * age) * k * k };
  }

  /* ---------- pixel sprites (built once, 1 art pixel = 1 canvas pixel) ---------- */
  function sprite(w, h, fn) {
    const c = document.createElement('canvas');
    c.width = w + 2; c.height = h + 2;
    const g = c.getContext('2d');
    const px = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x + 1, y + 1, ww, hh); };
    const disc = (cx, cy, r, col) => {
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) px(x, y, 1, 1, col);
      }
    };
    fn(px, disc);
    // 1 px ink outline around every opaque pixel
    const img = g.getImageData(0, 0, c.width, c.height), d = img.data, out = new Uint8ClampedArray(d);
    const ink = hex(PALETTE.ink);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (d[i + 3]) continue;
      const solid = (xx, yy) => xx >= 0 && yy >= 0 && xx < c.width && yy < c.height && d[(yy * c.width + xx) * 4 + 3] > 0;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) { out[i] = ink[0]; out[i + 1] = ink[1]; out[i + 2] = ink[2]; out[i + 3] = 255; }
    }
    g.putImageData(new ImageData(out, c.width, c.height), 0, 0);
    return c;
  }
  const P = PALETTE;
  const card = (px, x, y, w, h, fill, edge) => { px(x + 1, y, w - 2, h, edge); px(x, y + 1, w, h - 2, edge); px(x + 1, y + 1, w - 2, h - 2, fill); };
  // main character: a walking playing card with a two-pointed jester hat (f = walk frame 0..3)
  function cardCharacter(f) {
    return sprite(21, 33, (px) => {
      const lift = [[0, 0], [1, 0], [0, 0], [0, 1]][f];
      px(7, 28, 1, 3 - lift[0], P.ink); px(6, 31 - lift[0], 2, 1, P.red);
      px(13, 28, 1, 3 - lift[1], P.ink); px(13, 31 - lift[1], 2, 1, P.blue);
      px(1, 19, 1, 1, P.ink); px(0, 20, 2, 2, P.white); px(19, 19, 1, 1, P.ink); px(19, 20, 2, 2, P.white);
      card(px, 3, 9, 15, 19, P.white, P.edge);
      px(5, 11, 3, 1, P.red); px(6, 10, 1, 3, P.red);
      px(8, 15, 1, 2, P.ink); px(12, 15, 1, 2, P.ink); px(7, 18, 1, 1, P.pink); px(13, 18, 1, 1, P.pink);
      px(7, 19, 1, 1, P.red); px(8, 20, 5, 1, P.red); px(13, 19, 1, 1, P.red); px(8, 19, 5, 1, P.white);
      for (const [y, a, b] of [[6, 4, 9], [5, 3, 8], [4, 2, 6], [3, 1, 4], [2, 0, 2]]) { px(a, y, b - a + 1, 1, P.red); px(20 - b, y, b - a + 1, 1, P.blue); }
      px(4, 7, 13, 2, P.gold); px(0, 0, 2, 2, P.gold); px(19, 0, 2, 2, P.gold);
    });
  }
  // small creature: a chip token with a face; rot shifts the rim notches
  function chipToken(main, dark, rot) {
    return sprite(17, 17, (px, disc) => {
      disc(8.5, 8.5, 8.5, main);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + rot; px(Math.round(8.5 + Math.cos(a) * 6.8 - 1), Math.round(8.5 + Math.sin(a) * 6.8 - 1), 2, 2, P.white); }
      disc(8.5, 8.5, 5.6, P.white); disc(8.5, 8.5, 4.8, dark);
      px(6, 7, 1, 2, P.white); px(10, 7, 1, 2, P.white); px(7, 11, 3, 1, P.white);
    });
  }
  function chipStack(n, main, dark) {
    const h = n * 3 + 6;
    return sprite(16, h, (px) => {
      for (let i = 0; i < n; i++) {
        const y = h - 6 - i * 3;
        px(0, y + 1, 16, 3, dark);
        for (let k = 0; k < 4; k++) px(2 + k * 4, y + 2, 2, 1, P.white);
        px(1, y, 14, 2, main);
      }
    });
  }

  let SPR = null;
  function build() {
    SPR = {
      hero: [0, 1, 2, 3].map(cardCharacter),
      chips: [[P.blue, P.blueDark], [P.orange, '#B97500'], [P.green, P.greenDark]].map(([m, d]) => [chipToken(m, d, 0), chipToken(m, d, Math.PI / 8)]),
      stack: chipStack(6, P.red, P.redDark),
      stack2: chipStack(4, P.blue, P.blueDark),
    };
  }

  /* ---------- drawing helpers ---------- */
  function blit(ctx, img, x, y, ax, ay, rot, sx, sy, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(rot || 0);
    ctx.scale(sx || 1, sy || sx || 1);
    ctx.drawImage(img, -ax, -ay);
    ctx.restore();
  }
  const silhouettes = new Map();
  function shadowOf(img) {
    if (!silhouettes.has(img)) {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
      silhouettes.set(img, c);
    }
    return silhouettes.get(img);
  }
  /** Sprite + its Balatro-style shadow: the same silhouette, black at 33 %, offset down and away from the centre. */
  function drawWithShadow(ctx, img, x, y, ax, ay, rot, s, cx, lift) {
    const dx = Math.max(-6, Math.min(6, (x - cx) * 0.025)) + 1 + (lift || 0) * 0.35;
    blit(ctx, shadowOf(img), x + dx, y + 3 + (lift || 0), ax, ay, rot, s, s, 0.33);
    blit(ctx, img, x, y, ax, ay, rot, s, s);
  }
  const FONT3 = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001011001111', 4: '101101111001001',
    5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111', '+': '000010111010000', X: '101101010101101', $: '011110010011110' };
  /** Popup bubble: rounded pill in a counter colour, darker lower lip, shadow, white 3x5 pixel digits. */
  function bubble(ctx, x, y, text, col, scale) {
    const w = text.length * 4 + 5, h = 10;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(scale, scale);
    ctx.translate(-Math.round(w / 2), -5);
    const pill = (ox, oy, c) => { ctx.fillStyle = c; ctx.fillRect(ox + 1, oy, w - 2, h); ctx.fillRect(ox, oy + 1, w, h - 2); };
    pill(-1, 2, 'rgba(0,0,0,.35)');
    const d = hex(col).map((v) => Math.round(v * 0.68));
    pill(0, 1, `rgb(${d})`);
    pill(0, 0, col);
    ctx.fillStyle = '#fff';
    [...text].forEach((ch, n) => { const g = FONT3[ch]; if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(3 + n * 4 + (i % 3), 2 + ((i / 3) | 0), 1, 1); });
    ctx.restore();
  }
  // deterministic pseudo-random for a given seed (no Math.random in draw)
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------- preview scene ---------- */
  let buf = null, swirlBuf = null;
  function draw(ctx, w, h, t) {
    if (!SPR) build();
    // everything is drawn into a low-res art buffer (180 art px tall) and upscaled without smoothing
    const AH = 180, AW = Math.ceil((w / h) * AH);
    if (!buf || buf.width !== AW) { buf = document.createElement('canvas'); buf.width = AW; buf.height = AH; }
    const g = buf.getContext('2d');
    g.imageSmoothingEnabled = false;
    const camX = Math.sin(t * 0.15) * 40, camY = t * 4;
    // 1) swirl floor: a fixed 48-row sample grid (the swirl is chunky by nature), upscaled without smoothing
    const SH = 48, SW = Math.ceil(AW / (AH / SH)), SK = AH / SH;
    if (!swirlBuf || swirlBuf.width !== SW) { swirlBuf = document.createElement('canvas'); swirlBuf.width = SW; swirlBuf.height = SH; }
    const sg = swirlBuf.getContext('2d'), img = sg.createImageData(SW, SH), d = img.data, cols = swirlColours(PALETTE.felt);
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const ox = (x - SW / 2) * SK, oy = (y - SH / 2) * SK;
      const c = swirl(camX + ox, camY + oy, Math.hypot(ox, oy) / 612, t * 7, cols, 1.4);
      const i = (y * SW + x) * 4;
      d[i] = c[0] * 255; d[i + 1] = c[1] * 255; d[i + 2] = c[2] * 255; d[i + 3] = 255;
    }
    sg.putImageData(img, 0, 0);
    g.drawImage(swirlBuf, 0, 0, SW * SK, SH * SK);
    // 2) a dark translucent card zone with two empty card slots
    const zx = Math.round(AW * 0.62 - camX * 0.0), zy = Math.round(AH * 0.6);
    g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(zx, zy, 64, 44);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(zx + 8, zy + 7, 22, 30); g.fillRect(zx + 35, zy + 7, 22, 30);
    // 3) props + creatures + main character, each with its silhouette shadow
    const cx = AW / 2;
    drawWithShadow(g, SPR.stack, AW * 0.22, AH * 0.42, 9, SPR.stack.height - 1, 0, 1, cx);
    drawWithShadow(g, SPR.stack2, AW * 0.22 + 14, AH * 0.42 + 4, 9, SPR.stack2.height - 1, 0, 1, cx);
    for (let k = 0; k < 4; k++) {
      const a = t * 0.5 + k * 1.7, ex = cx + Math.cos(a) * AW * 0.3, ey = AH * 0.55 + Math.sin(a * 1.3) * AH * 0.25;
      const ph = t * 6 + k * 2, hop = Math.abs(Math.sin(ph)), land = 1 - hop;
      const spr = SPR.chips[k % 3][Math.floor(ph / Math.PI) & 1];
      drawWithShadow(g, spr, ex, ey - hop * 5, spr.width >> 1, spr.height - 1, Math.sin(ph) * 0.1, 1 + land * 0.1, cx, hop * 5);
    }
    const f = Math.floor(t * 8) & 3, age = t % 1.6, j = juice(age, 0.35);
    const hero = SPR.hero[f];
    drawWithShadow(g, hero, cx, AH * 0.6 - (f % 2), hero.width >> 1, hero.height - 1, Math.sin(t * 5) * 0.07 + j.r, 1 + j.s, cx);
    // 4) square particles: spin and shrink to nothing
    const burstT = t % 1.6;
    for (let n = 0; n < 14; n++) {
      const a = hash(n) * TAU, sp = 30 + hash(n + 9) * 40, k = Math.min(1, burstT / 0.7);
      const dist = sp * (1 - Math.exp(-burstT * 3)) / 3 * 2;
      const s = 3 * (1 - k * k);
      if (s < 0.5) continue;
      g.save();
      g.translate(cx + Math.cos(a) * dist, AH * 0.6 - 14 + Math.sin(a) * dist * 0.7);
      g.rotate(burstT * 10 + n);
      g.fillStyle = [P.blue, P.white, P.gold][n % 3];
      g.fillRect(-s / 2, -s / 2, s, s);
      g.restore();
    }
    // 5) popup bubbles: pop in with overshoot, hold, shrink away
    const pk = burstT / 1.2, sc = pk < 0.2 ? 1 + 2.70158 * Math.pow(pk / 0.2 - 1, 3) + 1.70158 * Math.pow(pk / 0.2 - 1, 2) : pk > 0.8 ? Math.max(0, 1 - (pk - 0.8) / 0.2) : 1;
    if (sc > 0.02) { bubble(g, cx + 18, AH * 0.6 - 40 - pk * 8, '+10', P.blue, sc); bubble(g, cx - 22, AH * 0.6 - 30 - pk * 8, 'X2', P.red, sc); }
    // 6) upscale + light CRT: scanlines, vignette
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, 0, 0, AW * (h / AH), h);
    const row = h / AH;
    ctx.fillStyle = 'rgba(0,0,0,.16)';
    if (row >= 3) for (let y = row - 1; y < h; y += row) ctx.fillRect(0, Math.floor(y), w, 1);
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function drawHero(ctx, x, y, t, facing) {
    if (!SPR) build();
    const f = Math.floor(t * 8) & 3;
    blit(ctx, SPR.hero[f], x, y, 11, SPR.hero[f].height - 1, Math.sin(t * 5) * 0.07, (facing || 1), 1);
  }
  function drawEnemy(ctx, x, y, t) {
    if (!SPR) build();
    const ph = t * 6, hop = Math.abs(Math.sin(ph)), spr = SPR.chips[0][Math.floor(ph / Math.PI) & 1];
    blit(ctx, spr, x, y - hop * 5, spr.width >> 1, spr.height - 1, Math.sin(ph) * 0.1, 1, 1 + (1 - hop) * -0.12);
  }

  const Starter = { id: 'cardtable', name: 'Psychedelic Card Table', palette: PALETTE, fonts: ['Jersey 10'], swirl, swirlColours, fold, juice, bubble, drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['cardtable'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
