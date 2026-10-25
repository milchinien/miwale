/* Trick or Treat (Candy Gloss) — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Reference module: ../../js/styles/candy.js */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2, PI = Math.PI;
  const PALETTE = {
    outline: '#3a1424', flash: '#fff3f8', chocolate: '#7e4c32', chocLight: '#8c5437', chocGroove: '#5d3825',
    caramelEdge: '#ec9c3a', caramelDeep: '#b25a1a', pinkSugar: '#f4acc2', mint: '#a0dab8', cookie: '#543226',
    candyLight: '#ffd08a', candyOrange: '#ff8d1e', candyDark: '#d24e0b', caramelGlow: '#ffe07a', holeDark: '#7a2406',
    licorice: '#2c1a2a', scarf: '#3fd6c1', shoe: '#e8304f', gummyPurple: '#9443d8', gummyPink: '#d83a8e', gummyBlue: '#5b52e0',
    leaf: '#55cc48', marshmallow: '#fbf5fb', hotPink: '#ff5c9e', sprinkleYellow: '#ffd23a', sprinkleCyan: '#4fd6ff',
  };
  const OUT = PALETTE.outline;
  const SPRINK = ['#ff4f8b', '#ffd23a', '#4fd6ff', '#7ee26a', '#b88cff', '#ff9a3a', '#ffffff'];

  /* ---------------------------------------------------------------- helpers */
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  function hash(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function rg(c, x0, y0, r0, x1, y1, r1, stops) { const g = c.createRadialGradient(x0, y0, r0, x1, y1, r1); for (const s of stops) g.addColorStop(s[0], s[1]); return g; }
  function lg(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); for (const s of stops) g.addColorStop(s[0], s[1]); return g; }
  /** Hard-candy body: radial gradient lit from the top-left (light -> mid at 50% -> dark at the rim). */
  function gloss(c, path, cx, cy, r, light, mid, dark) {
    c.beginPath(); path(c);
    c.fillStyle = rg(c, cx - r * 0.38, cy - r * 0.45, r * 0.05, cx, cy, r * 1.18, [[0, light], [0.5, mid], [1, dark]]); c.fill();
  }
  /** Sharp white specular ellipse (the "wet" highlight). */
  function spec(c, x, y, rx, ry, rot, a) { c.save(); c.globalAlpha = a === undefined ? 0.9 : a; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fill(); c.restore(); }
  function softSpec(c, x, y, r, a) { c.fillStyle = rg(c, x, y, 0, x, y, r, [[0, 'rgba(255,255,255,' + a + ')'], [1, 'rgba(255,255,255,0)']]); c.fillRect(x - r, y - r, r * 2, r * 2); }
  function clipDo(c, path, fn) { c.save(); c.beginPath(); path(c); c.clip(); fn(c); c.restore(); }
  /** Rim light: stroke clipped inside the shape, transparent until 60% of the TL->BR diagonal, then col. */
  function rim(c, path, x0, y0, x1, y1, col, w) {
    clipDo(c, path, (k) => { k.lineWidth = w; k.strokeStyle = lg(k, x0, y0, x1, y1, [[0, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,0)'], [1, col]]); k.beginPath(); path(k); k.stroke(); });
  }
  const E = (x, y, rx, ry, rot) => (c) => { rot = rot || 0; c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const CAP = (x1, y1, x2, y2, r) => (c) => { const a = Math.atan2(y2 - y1, x2 - x1); c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r); c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5); c.arc(x2, y2, r, a - PI / 2, a + PI / 2); c.closePath(); };
  function roundPoly(c, pts, r) { const n = pts.length, a = pts[n - 1], b = pts[0]; c.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.arcTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, r); } c.closePath(); }
  function blobPath(c, pts) { const n = pts.length; c.moveTo(pts[0][0], pts[0][1]); for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]; c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); } c.closePath(); }
  function pumpkinPath(c, cx, cy, rx, ry) {
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * TAU, co = Math.cos(th), si = Math.sin(th);
      let y = Math.sign(si) * Math.pow(Math.abs(si), 0.92) * ry;
      y *= 1 - 0.15 * Math.exp(-Math.pow((th - PI * 1.5) / 0.3, 2)) - 0.07 * Math.exp(-Math.pow((th - PI * 0.5) / 0.26, 2));
      const x = Math.sign(co) * Math.pow(Math.abs(co), 0.85) * rx;
      if (i) c.lineTo(cx + x, cy + y); else c.moveTo(cx + x, cy + y);
    }
    c.closePath();
  }
  function turnipPath(c, cx, top, bottom, w) {
    const h = bottom - top;
    c.moveTo(cx, top);
    c.bezierCurveTo(cx + w * 0.42, top + h * 0.02, cx + w, top + h * 0.22, cx + w, top + h * 0.56);
    c.bezierCurveTo(cx + w, top + h * 0.86, cx + w * 0.55, bottom, cx, bottom);
    c.bezierCurveTo(cx - w * 0.55, bottom, cx - w, top + h * 0.86, cx - w, top + h * 0.56);
    c.bezierCurveTo(cx - w, top + h * 0.22, cx - w * 0.42, top + h * 0.02, cx, top); c.closePath();
  }
  function leafPath(c, bx, by, a, len, wid) {
    const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx, tx = bx + dx * len, ty = by + dy * len;
    c.moveTo(bx, by);
    c.bezierCurveTo(bx + dx * len * 0.22 + nx * wid, by + dy * len * 0.22 + ny * wid, tx - dx * len * 0.3 + nx * wid * 0.75, ty - dy * len * 0.3 + ny * wid * 0.75, tx, ty);
    c.bezierCurveTo(tx - dx * len * 0.3 - nx * wid * 0.75, ty - dy * len * 0.3 - ny * wid * 0.75, bx + dx * len * 0.22 - nx * wid, by + dy * len * 0.22 - ny * wid, bx, by); c.closePath();
  }
  /** Diagonal candy stripes (call inside a clip). */
  function stripes(c, x0, y0, x1, y1, w, gap, col, ang) { c.save(); c.fillStyle = col; const R = Math.hypot(x1 - x0, y1 - y0); c.translate((x0 + x1) / 2, (y0 + y1) / 2); c.rotate(ang); for (let x = -R; x < R; x += w + gap) c.fillRect(x, -R, w, R * 2); c.restore(); }
  /** Gummy: milky translucent core + saturated inner edge band (42% of r) + subsurface glow lower-right. */
  function jelly(c, path, cx, cy, r, edgeCol, glowCol) {
    clipDo(c, path, (k) => {
      k.fillStyle = rg(k, cx - r * 0.1, cy - r * 0.05, r * 0.1, cx, cy, r * 1.1, [[0, 'rgba(255,255,255,0.28)'], [0.55, 'rgba(255,255,255,0.06)'], [1, 'rgba(255,255,255,0)']]); k.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
      k.lineWidth = r * 0.42; k.strokeStyle = edgeCol; k.beginPath(); path(k); k.stroke();
      if (glowCol) { k.fillStyle = rg(k, cx + r * 0.42, cy + r * 0.45, 0, cx + r * 0.42, cy + r * 0.45, r * 0.7, [[0, glowCol], [1, 'rgba(255,255,255,0)']]); k.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4); }
    });
  }
  /** Carved hole that glows with caramel: dark fill, then the same path shifted (0.2, 0.55) filled with a hot gradient. */
  function caramelHole(c, path, bx, by, br) {
    c.beginPath(); path(c); c.fillStyle = PALETTE.holeDark; c.fill();
    clipDo(c, path, (k) => { k.translate(0.2, 0.55); k.beginPath(); path(k); k.fillStyle = rg(k, bx, by, 0, bx, by, br, [[0, '#fffbd6'], [0.35, '#ffe07a'], [0.75, '#ffa12a'], [1, '#e2650e']]); k.fill(); });
  }
  function licorice(c, path, cx, cy, r) { gloss(c, path, cx, cy, r, '#6a4a66', '#2c1a2a', '#120810'); rim(c, path, cx - r, cy - r, cx + r, cy + r, 'rgba(190,130,200,0.55)', r * 0.5); }

  /* -------------------------------------------- sprite baking (outline pass) */
  /** Bakes fn() at k px/unit, then adds the soft cocoa silhouette: tinted copy stamped 12x around at w=ol*k px. */
  function build(box, k, fn, ol, olc) {
    const m = 1, l = box[0] - m, t = box[1] - m, c = mkCanvas((box[2] - l + m) * k, (box[3] - t + m) * k), x = c.getContext('2d');
    x.scale(k, k); x.translate(-l, -t); x.lineJoin = 'round'; x.lineCap = 'round'; fn(x);
    if (ol === 0) return { c, ox: -l * k, oy: -t * k, k };
    const tint = mkCanvas(c.width, c.height), tx = tint.getContext('2d');
    tx.drawImage(c, 0, 0); tx.globalCompositeOperation = 'source-atop'; tx.fillStyle = olc || OUT; tx.fillRect(0, 0, c.width, c.height);
    const o = mkCanvas(c.width, c.height), ox = o.getContext('2d'), w = (ol || 0.5) * k, n = w > 2.5 ? 16 : 12;
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; ox.drawImage(tint, Math.cos(a) * w, Math.sin(a) * w); }
    ox.drawImage(c, 0, 0);
    return { c: o, ox: -l * k, oy: -t * k, k };
  }
  /** Draws a baked sprite with its anchor at world (x, y), scale sx/sy, rotation rot. */
  function blit(ctx, s, x, y, sx, sy, rot, flip) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale((sx || 1) * (flip ? -1 : 1), sy || 1);
    const q = 1 / s.k; ctx.drawImage(s.c, -s.ox * q, -s.oy * q, s.c.width * q, s.c.height * q); ctx.restore();
  }

  /* ------------------------------------------------------------ the hero */
  const JACK_FR = [[-2.3, 0, 2.3, 0, 0.25, -0.25, 0], [-3.7, -0.2, 3.9, -0.5, 0.9, -0.8, 1.6], [-2.0, -1.5, 2.9, -2.1, 0.35, -0.15, 3.2], [2.7, -0.6, -1.3, -0.2, -0.75, 0.85, 4.8]];
  function scarfFill(c, path, x0, y0, x1, y1, ang) {
    c.beginPath(); path(c); c.fillStyle = lg(c, x0, y0, x1, y1, [[0, '#3fd6c1'], [1, '#1fa596']]); c.fill();
    clipDo(c, path, (k) => { stripes(k, x0 - 4, y0 - 4, x1 + 4, y1 + 4, 1.0, 1.3, 'rgba(255,255,255,0.92)', ang); k.fillStyle = lg(k, x0, y0, x0, y1, [[0, 'rgba(255,255,255,0.35)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,60,60,0.25)']]); k.fillRect(x0 - 5, y0 - 5, x1 - x0 + 10, y1 - y0 + 10); });
  }
  function jackParts(c, fr) {
    const F = JACK_FR[fr], ang = [0.55, 1.0, 1.2, 0.9][fr], ax = -2.4, ay = -11.2, dx = -Math.sin(ang), dy = Math.cos(ang);
    scarfFill(c, CAP(ax, ay, ax + dx * 7.6, ay + dy * 7.6, 1.6), ax - 6, ay - 2, ax + 3, ay + 9, ang + 0.2);
    const arm = (sx, a) => { const hx = sx + Math.sin(a) * 3.4, hy = -10 + Math.cos(a) * 3.4; licorice(c, CAP(sx, -10, hx, hy, 1.15), (sx + hx) / 2, (hy - 10) / 2, 2); gloss(c, E(hx, hy, 1.55, 1.5), hx, hy, 1.6, '#ffffff', '#fbeef6', '#d9c2d6'); };
    const leg = (hx, fx, fy) => { licorice(c, CAP(hx, -5.6, fx, fy - 1.3, 1.35), (hx + fx) / 2, -3.5, 2.5); gloss(c, E(fx + 0.7, fy - 1.05, 2.1, 1.35), fx + 0.7, fy - 1.05, 2.2, '#ff8fa8', '#e8304f', '#8f0f2a'); spec(c, fx, fy - 1.7, 0.75, 0.32, 0, 0.85); };
    arm(-3, F[4]); leg(-1.6, F[0], F[1]); leg(1.6, F[2], F[3]);
    const body = E(0, -8.3, 4.5, 4.4); licorice(c, body, 0, -8.3, 4.6);
    clipDo(c, body, (k) => { k.strokeStyle = 'rgba(160,110,170,0.35)'; k.lineWidth = 0.35; for (let i = -3; i <= 3; i++) { k.beginPath(); k.moveTo(-5 + i * 2, -3.5); k.lineTo(-1 + i * 2, -13); k.stroke(); } });
    spec(c, -1.8, -10.6, 1.4, 0.6, -0.6, 0.55);
    for (const [bx, by, col] of [[2.0, -7.6, '#ffd43f'], [2.1, -5.4, '#ff5c8a']]) gloss(c, E(bx, by, 0.65, 0.65), bx, by, 0.7, '#ffffff', col, col);
    arm(3, F[5]); scarfFill(c, E(0.3, -11, 5.7, 2.3), -5.4, -13.3, 6, -8.7, 0.9);
    // head: hard candy pumpkin
    const cx = 0.4, cy = -19.6, rx = 11.2, ry = 9.1, hp = (k) => pumpkinPath(k, cx, cy, rx, ry);
    gloss(c, CAP(0.1, -27, 1.3, -31.2, 1.35), 0.6, -29, 2, '#c8f59a', '#62c043', '#2f7a2a');
    gloss(c, hp, cx, cy, 11, '#ffd08a', '#ff8d1e', '#d24e0b');
    clipDo(c, hp, (k) => {
      k.fillStyle = rg(k, cx + 2.5, cy + 2.5, 0, cx + 2.5, cy + 2.5, 10, [[0, 'rgba(255,214,110,0.55)'], [1, 'rgba(255,214,110,0)']]); k.fillRect(cx - 12, cy - 10, 24, 20);
      for (const s of [-0.7, -0.3, 0.3, 0.7]) {
        k.strokeStyle = 'rgba(196,72,8,0.55)'; k.lineWidth = 0.7; k.beginPath(); k.moveTo(cx + s * rx * 0.2, cy - ry * 0.9); k.quadraticCurveTo(cx + s * rx * 1.2, cy, cx + s * rx * 0.2, cy + ry * 0.94); k.stroke();
        k.strokeStyle = 'rgba(255,214,150,0.45)'; k.lineWidth = 0.45; k.beginPath(); k.moveTo(cx + s * rx * 0.2 - 0.6, cy - ry * 0.9); k.quadraticCurveTo(cx + s * rx * 1.2 - 0.7, cy, cx + s * rx * 0.2 - 0.6, cy + ry * 0.94); k.stroke();
      }
    });
    rim(c, hp, cx - rx, cy - ry, cx + rx, cy + ry, 'rgba(255,236,150,0.9)', 2.2);
    const fx = cx + 2.2;
    caramelHole(c, (k) => roundPoly(k, [[fx - 3.9, cy - 5.9], [fx - 7.0, cy + 0.2], [fx - 0.9, cy + 0.2]], 0.8), fx - 3.8, cy - 1, 4);
    caramelHole(c, (k) => roundPoly(k, [[fx + 3.6, cy - 5.6], [fx + 1.0, cy + 0.1], [fx + 6.1, cy + 0.1]], 0.75), fx + 3.6, cy - 1, 3.6);
    caramelHole(c, (k) => { k.moveTo(fx - 7.4, cy + 2.3); k.quadraticCurveTo(fx - 0.6, cy + 12.4, fx + 6.6, cy + 1.9); k.quadraticCurveTo(fx - 0.6, cy + 5.4, fx - 7.4, cy + 2.3); k.closePath(); }, fx - 0.4, cy + 5, 7);
    spec(c, cx - 6.0, cy - 4.6, 2.9, 1.35, -0.6, 0.92); spec(c, cx - 3.0, cy - 6.9, 0.75, 0.6, 0, 0.95); spec(c, cx - 8.4, cy + 1.2, 0.6, 1.6, 0.25, 0.45);
    const lf = (k) => leafPath(k, -0.4, -28.6, -1.2, 5.6, 2.1);
    gloss(c, lf, -3, -30, 4, '#b8f58a', '#56c23e', '#2c8a2e'); spec(c, -3.6, -30.4, 1.3, 0.45, -0.3, 0.7);
  }

  /* ------------------------------------------------------- gummy enemy */
  const CREEP = [
    { hi: '#d9a2ff', top: '#9443d8', dk: '#56168f', edge: 'rgba(80,10,140,0.55)', glow: 'rgba(255,170,255,0.55)' },
    { hi: '#ffa6d2', top: '#d83a8e', dk: '#86104f', edge: 'rgba(140,10,70,0.5)', glow: 'rgba(255,190,220,0.6)' },
    { hi: '#b8b0ff', top: '#5b52e0', dk: '#262092', edge: 'rgba(30,20,140,0.55)', glow: 'rgba(190,190,255,0.6)' },
  ];
  function jellyLeaf(c, bx, by, a, len, wid) {
    const p = (k) => leafPath(k, bx, by, a, len, wid), tx = bx + Math.sin(a) * len * 0.5, ty = by - Math.cos(a) * len * 0.5;
    gloss(c, p, tx, ty, len * 0.6, '#c9ff9e', '#55cc48', '#22852e'); jelly(c, p, tx, ty, len * 0.5, 'rgba(20,110,40,0.35)');
    spec(c, tx - Math.cos(a) * wid * 0.4, ty - Math.sin(a) * wid * 0.4, len * 0.16, 0.45, a - PI / 2, 0.75);
  }
  function creeperParts(c, fr, v) {
    const col = CREEP[v], stp = [0, 1, 0, -1][fr], sw = [0, 0.1, 0, -0.1][fr];
    jellyLeaf(c, -0.2, -19.6, -0.85 + sw, 8.2, 2.6); jellyLeaf(c, 0.6, -19.6, 0.8 + sw, 8.0, 2.6); jellyLeaf(c, 0.3, -19.8, -0.02 + sw, 10.2, 3.0);
    for (const g of [-1, 1]) { const st = g < 0 ? stp : -stp; gloss(c, CAP(3 * g, -4.8, (3.3 - st * 0.8) * g, -1.1 - Math.max(0, st) * 1.5, 1.45), 3 * g, -3, 2.2, '#ffffff', '#ffe9f2', '#e2b9cc'); }
    const body = (k) => turnipPath(k, 0, -21.6, -2.6, 10.4);
    c.beginPath(); body(c); c.fillStyle = rg(c, -3, -9, 1, 0, -10, 12, [[0, '#ffffff'], [0.6, '#fff1f8'], [1, '#e9c9dc']]); c.fill();
    clipDo(c, body, (k) => { // two-layer gummy: coloured top over a milky bottom, wavy seam
      k.beginPath(); k.moveTo(-14, -26); k.lineTo(14, -26); k.lineTo(14, -11.3);
      for (let x = 14; x >= -14; x -= 0.5) k.lineTo(x, -11.3 + 0.9 * Math.sin(x * 0.85 + 0.6));
      k.closePath(); k.fillStyle = rg(k, -4.5, -18, 0.5, 0, -14, 12, [[0, col.hi], [0.5, col.top], [1, col.dk]]); k.fill();
      k.strokeStyle = 'rgba(255,255,255,0.55)'; k.lineWidth = 0.45; k.beginPath();
      for (let x = -14; x <= 14; x += 0.5) k.lineTo(x, -11 + 0.9 * Math.sin(x * 0.85 + 0.6)); k.stroke();
    });
    jelly(c, body, 0, -12, 10.5, col.edge, col.glow);
    const j = [0, 0.18, 0, -0.12][fr];
    c.fillStyle = '#2a0f22'; c.beginPath(); c.ellipse(1.6 + j, -13.2, 1.7, 2.1, 0, 0, TAU); c.ellipse(6.8 + j, -13, 1.6, 2, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffe36e'; c.beginPath(); c.arc(2 + j, -12.6, 0.6, 0, TAU); c.arc(7.2 + j, -12.4, 0.55, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(1.1 + j, -14, 0.48, 0, TAU); c.arc(6.3 + j, -13.8, 0.45, 0, TAU); c.fill();
    c.strokeStyle = '#2a0f22'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1.4, -17.3); c.lineTo(3.2, -15.5); c.moveTo(5, -15.4); c.lineTo(9, -17.1); c.stroke();
    c.lineWidth = 0.8; c.strokeStyle = '#6a1f45'; c.beginPath(); c.arc(4.2, -6.4, 1.9, PI * 1.2, PI * 1.8); c.stroke();
    spec(c, -5.6, -16.8, 2.2, 1.0, -0.8, 0.95); spec(c, -3.4, -19.2, 0.6, 0.5, 0, 0.95); spec(c, -7.2, -9, 0.5, 1.4, 0.2, 0.55); spec(c, 6.8, -5.2, 1.2, 0.45, -0.5, 0.45);
  }
  /** Marshmallow ghost: matte (no sharp spec), piped meringue ridges, toasted hem. */
  function ghostParts(c, ph) {
    const mm = (path, cx, cy, r) => { c.beginPath(); path(c); c.fillStyle = rg(c, cx - r * 0.35, cy - r * 0.5, r * 0.1, cx, cy, r * 1.2, [[0, '#ffffff'], [0.55, '#fbf5fb'], [1, '#dccbe4']]); c.fill(); };
    const body = (k) => { k.moveTo(-8.4, -5.2); k.bezierCurveTo(-9.8, -12, -7, -17.4, -3.4, -20.2); k.bezierCurveTo(-1.6, -21.8, -0.6, -23.6, -2.4, -26.2); k.bezierCurveTo(2, -25.8, 4.6, -22.8, 4.6, -20.4); k.bezierCurveTo(8.4, -17.6, 10, -11.6, 8.9, -5);
      const xs = [8.9, 4.5, 0.2, -4.2, -8.4]; for (let i = 0; i < 4; i++) k.quadraticCurveTo((xs[i] + xs[i + 1]) / 2, -0.4 + Math.sin(ph + i * 1.7) * 0.9, xs[i + 1], i === 3 ? -5.2 : -4.3 + Math.sin(ph + i * 1.7 + 1) * 0.5); k.closePath(); };
    mm(E(-8.6, -11.4, 2.4, 1.8, 0.5), -8.6, -11.4, 2.4); mm(body, 0, -13, 12);
    clipDo(c, body, (k) => {
      k.fillStyle = lg(k, 0, -6.5, 0, 0, [[0, 'rgba(240,200,150,0)'], [1, 'rgba(232,180,120,0.75)']]); k.fillRect(-12, -8, 24, 9);
      for (const [y, w] of [[-8.2, 9.5], [-13.2, 9.2], [-18, 7], [-22, 4.2]]) {
        k.lineWidth = 1.1; k.strokeStyle = 'rgba(170,140,190,0.32)'; k.beginPath(); k.ellipse(0.3, y, w, 2.2, 0.05, 0.08 * PI, 0.92 * PI); k.stroke();
        k.lineWidth = 0.7; k.strokeStyle = 'rgba(255,255,255,0.95)'; k.beginPath(); k.ellipse(0.3, y - 0.9, w, 2.2, 0.05, 0.12 * PI, 0.75 * PI); k.stroke();
      }
    });
    softSpec(c, -3.5, -18.5, 4.5, 0.8); mm(E(9.4, -12.2, 2.7, 1.8, -0.3), 9.4, -12.2, 2.6);
    c.fillStyle = '#3a1630'; c.beginPath(); c.ellipse(1.4, -14.8, 1.55, 2.4, 0.18, 0, TAU); c.ellipse(5.8, -14.6, 1.45, 2.3, -0.18, 0, TAU); c.ellipse(3.8, -8.8, 2.4, 2.9, 0, 0, TAU); c.fill();
    c.fillStyle = '#ff6f9c'; c.beginPath(); c.ellipse(4.1, -6.6, 1.6, 1.0, 0, 0, TAU); c.fill();
    c.fillStyle = '#9fe0ff'; c.beginPath(); c.arc(1.2, -15.6, 0.45, 0, TAU); c.arc(5.6, -15.4, 0.42, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,140,180,0.35)'; c.beginPath(); c.ellipse(-1.2, -11.2, 1.4, 0.8, 0, 0, TAU); c.ellipse(8.2, -11, 1.2, 0.7, 0, 0, TAU); c.fill();
  }

  /* ------------------------------------------------------ pickups / props */
  function wrappedCandy(c, r, body, swirl, wrapA, wrapB) {
    for (const sg of [-1, 1]) {
      c.beginPath(); c.moveTo(sg * r * 0.7, -0.6 * r); c.lineTo(sg * r * 2.05, -1.05 * r); c.quadraticCurveTo(sg * r * 1.75, 0, sg * r * 2.05, 1.05 * r); c.lineTo(sg * r * 0.7, 0.6 * r); c.closePath();
      c.fillStyle = lg(c, 0, -r, 0, r, [[0, wrapA], [1, wrapB]]); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(sg * r, -0.5 * r); c.lineTo(sg * r * 1.8, -0.8 * r); c.moveTo(sg * r * 1.1, 0.2 * r); c.lineTo(sg * r * 1.85, 0.5 * r); c.stroke();
    }
    const b = E(0, 0, r, r * 0.92); gloss(c, b, 0, 0, r, '#ffffff', body, swirl[1]);
    clipDo(c, b, (k) => {
      k.strokeStyle = swirl[0]; k.lineWidth = r * 0.28;
      for (let a = 0; a < 3; a++) { k.beginPath(); for (let t = 0; t <= 1.001; t += 0.05) { const an = (a / 3) * TAU + t * 3.4, rr = t * r * 1.05; k.lineTo(Math.cos(an) * rr, Math.sin(an) * rr * 0.92); } k.stroke(); }
      k.fillStyle = rg(k, -r * 0.3, -r * 0.35, r * 0.05, 0, 0, r * 1.1, [[0, 'rgba(255,255,255,0.3)'], [0.6, 'rgba(255,255,255,0)'], [1, 'rgba(40,0,60,0.3)']]); k.fillRect(-r, -r, r * 2, r * 2);
    });
    spec(c, -r * 0.38, -r * 0.42, r * 0.38, r * 0.2, -0.6, 0.95);
  }
  /** Lollipop disc: spiral bands, inner shading, rim light, three speculars. */
  function swirlDisc(c, cx, cy, r, cols) {
    const d = E(cx, cy, r, r);
    clipDo(c, d, (k) => {
      k.fillStyle = cols[0]; k.fillRect(cx - r, cy - r, r * 2, r * 2);
      const A = cols.length > 2 ? 6 : 4; k.lineWidth = r * 0.26; k.lineCap = 'butt';
      for (let a = 0; a < A; a++) {
        if (cols.length === 2 && (a & 1)) continue; k.strokeStyle = cols[1 + (a % (cols.length - 1))]; k.beginPath();
        for (let t = 0; t <= 1.001; t += 0.02) { const an = (a / A) * TAU + t * TAU * 1.25, rr = Math.pow(t, 0.85) * r * 1.08; k.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); } k.stroke();
      }
      k.fillStyle = rg(k, cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r * 1.05, [[0, 'rgba(255,255,255,0.55)'], [0.5, 'rgba(255,255,255,0.05)'], [1, 'rgba(70,0,50,0.38)']]); k.fillRect(cx - r, cy - r, r * 2, r * 2);
    });
    rim(c, d, cx - r, cy - r, cx + r, cy + r, 'rgba(255,255,255,0.6)', r * 0.12);
    spec(c, cx - r * 0.42, cy - r * 0.48, r * 0.32, r * 0.14, -0.75, 0.95); spec(c, cx - r * 0.12, cy - r * 0.68, r * 0.07, r * 0.06, 0, 0.95); spec(c, cx + r * 0.55, cy + r * 0.4, r * 0.18, r * 0.06, -0.8, 0.5);
  }
  function lolliTree(c) {
    c.beginPath(); CAP(0, -1, 0, -40, 1.4)(c); c.fillStyle = lg(c, -1.4, 0, 1.4, 0, [[0, '#fffaf2'], [0.55, '#f3e6d8'], [1, '#c9b4a2']]); c.fill();
    for (const sg of [-1, 1]) gloss(c, (k) => { k.moveTo(0, -33); k.quadraticCurveTo(sg * 5, -37.5, sg * 5.4, -33.2); k.quadraticCurveTo(sg * 5, -29.5, 0, -33); k.closePath(); }, sg * 3, -33, 3, '#ffffff', '#ff8a1a', '#ff8a1a');
    swirlDisc(c, 0, -50, 13.5, ['#ffd23a', '#ff4f8f', '#4fb6ff', '#7ee26a']);
  }
  function seedParts(c) { const p = (k) => { k.moveTo(4.4, 0); k.bezierCurveTo(2.6, -2.8, -3.5, -3.1, -3.5, 0); k.bezierCurveTo(-3.5, 3.1, 2.6, 2.8, 4.4, 0); k.closePath(); }; gloss(c, p, 0, 0, 4, '#ffffff', '#8ef0cf', '#2aa883'); spec(c, -0.8, -1.3, 1.6, 0.55, -0.12, 0.95); }
  function hitStar(c) { const pts = []; for (let i = 0; i < 16; i++) { const a = 0.2 + (i / 16) * TAU, r = i & 1 ? 2.4 : 5.6; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } c.beginPath(); roundPoly(c, pts, 0.4); c.fillStyle = rg(c, 0, 0, 0, 0, 0, 5.6, [[0, '#ffffff'], [0.55, '#fff4fa'], [1, '#ffb3d6']]); c.fill(); }

  /* ------------------------------------------------------------- sprites */
  let SPR = null;
  function sprites(s) {
    const K = Math.max(3, Math.min(6, Math.round(s * 1.25)));
    if (SPR && SPR.K === K) return SPR;
    SPR = { K, jack: [0, 1, 2, 3].map((f) => build([-14, -33, 14, 2], K, (c) => jackParts(c, f))),
      creep: [0, 1, 2].map((v) => [0, 1, 2, 3].map((f) => build([-13, -31, 13, 1.5], K, (c) => creeperParts(c, f, v)))),
      ghost: [0, 1, 2, 3].map((f) => build([-13, -27, 13, 1], K, (c) => ghostParts(c, (f / 4) * TAU), 0.45, '#5a3a66')),
      gem: build([-6, -3.4, 6, 3.4], K, (c) => wrappedCandy(c, 2.4, '#2fb8ff', ['#ffffff', '#1167c4'], 'rgba(220,245,255,0.95)', 'rgba(140,200,240,0.95)'), 0.4),
      gemB: build([-8.5, -4.6, 8.5, 4.6], K, (c) => wrappedCandy(c, 3.6, '#ffb11f', ['#ff3f7e', '#c4500a'], 'rgba(255,240,170,0.95)', 'rgba(240,170,60,0.95)'), 0.45),
      lolli: build([-15, -66, 15, 2], K, lolliTree, 0.55), seed: build([-4, -3.2, 5, 3.2], K, seedParts, 0.4), hit: build([-6, -6, 6, 6], K, hitStar, 0.35, '#ff5c9e'),
      sprink: SPRINK.map((col) => build([-1.6, -0.6, 1.6, 0.6], K, (c) => { c.beginPath(); CAP(-1.15, 0, 1.15, 0, 0.45)(c); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.22; c.beginPath(); c.moveTo(-0.8, -0.18); c.lineTo(0.8, -0.18); c.stroke(); }, 0.18)) };
    return SPR;
  }

  /* -------------------------------------------------------------- ground */
  let GROUND = null;
  function blob(cx, cy, r, seed, n) { const R = rng(seed), pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; const rr = r * (0.7 + R() * 0.5); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8]); } return (c) => blobPath(c, pts); }
  function bakeGround(w, h, s) {
    const cv = mkCanvas(w, h), c = cv.getContext('2d'), W = w / s;
    c.scale(s, s); c.fillStyle = PALETTE.chocolate; c.fillRect(0, 0, W, 360);
    const S = 34; // milk-chocolate bar grid: dark 0.9u groove, lit top/left bevel, shaded bottom/right bevel
    for (let y = -S; y < 360 + S; y += S) for (let x = -S; x < W + S; x += S) {
      c.fillStyle = lg(c, x, 0, x + 3.2, 0, [[0, 'rgba(255,225,190,0.11)'], [1, 'rgba(255,225,190,0)']]); c.fillRect(x, y, 3.2, S);
      c.fillStyle = lg(c, 0, y, 0, y + 3.2, [[0, 'rgba(255,225,190,0.11)'], [1, 'rgba(255,225,190,0)']]); c.fillRect(x, y, S, 3.2);
      c.fillStyle = lg(c, x + S, 0, x + S - 3.2, 0, [[0, 'rgba(40,12,8,0.12)'], [1, 'rgba(40,12,8,0)']]); c.fillRect(x + S - 3.2, y, 3.2, S);
      c.fillStyle = lg(c, 0, y + S, 0, y + S - 3.2, [[0, 'rgba(40,12,8,0.12)'], [1, 'rgba(40,12,8,0)']]); c.fillRect(x, y + S - 3.2, S, 3.2);
      c.fillStyle = PALETTE.chocGroove; c.fillRect(x - 0.45, y - 0.45, S, 0.9); c.fillRect(x - 0.45, y - 0.45, 0.9, S);
    }
    // decals on the chocolate (drawn before the pools so the pools cover them): sprinkles, chocolate chips, mini marshmallows
    const D = rng(99), sp = sprites(s);
    for (let i = 0; i < 70; i++) { const x = D() * W, y = D() * 360, r = D(); c.fillStyle = 'rgba(50,15,20,0.25)';
      if (r < 0.6) blit(c, sp.sprink[(D() * 7) | 0], x, y, 1, 1, D() * 6);
      else if (r < 0.8) { c.beginPath(); c.ellipse(x + 0.3, y + 0.4, 1.8, 0.7, 0, 0, TAU); c.fill(); gloss(c, (k) => { k.moveTo(x, y - 2.4); k.bezierCurveTo(x + 0.5, y - 1.2, x + 1.7, y - 0.6, x + 1.7, y + 0.1); k.quadraticCurveTo(x, y + 0.9, x - 1.7, y + 0.1); k.bezierCurveTo(x - 1.7, y - 0.6, x - 0.5, y - 1.2, x, y - 2.4); }, x, y - 0.6, 2, '#8a5236', '#43200f', '#1e0a05'); spec(c, x - 0.5, y - 0.9, 0.35, 0.6, 0.3, 0.75); }
      else { c.fillStyle = lg(c, x - 2, 0, x + 2, 0, [[0, '#fff8fc'], [0.45, '#ffffff'], [1, '#e6d2e2']]); c.fillRect(x - 2, y - 2.5, 4, 2.6); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y - 2.5, 2, 0.8, 0, 0, TAU); c.fill(); } }
    // caramel pool: sunken -> bright edge band, deeper centre, dark lip on top, glossy streaks, light lower lip
    const car = blob(W * 0.17, 150, 95, 11, 7);
    c.save(); c.shadowColor = 'rgba(60,22,30,0.5)'; c.shadowBlur = 3 * s; c.shadowOffsetY = -1.2 * s; c.beginPath(); car(c); c.fillStyle = PALETTE.caramelEdge; c.fill(); c.restore();
    clipDo(c, car, (k) => {
      k.fillStyle = rg(k, W * 0.17, 150, 10, W * 0.17, 150, 100, [[0, '#c0661e'], [0.55, '#dc8a30'], [1, 'rgba(236,156,58,0)']]); k.fillRect(0, 0, W, 360);
      k.strokeStyle = 'rgba(255,232,170,0.35)'; k.lineWidth = 0.8;
      for (let i = 0; i < 12; i++) { k.beginPath(); for (let x = 0; x < W * 0.5; x += 4) k.lineTo(x, 60 + i * 18 - x * 0.17 + Math.sin(x * 0.03 + i) * 6); k.stroke(); }
      k.lineWidth = 3; k.strokeStyle = 'rgba(80,30,10,0.3)'; k.beginPath(); car(k); k.stroke();
    });
    // cookie-crumb path: dark band packed with lit crumb cells (Worley-like), darker sunken rim
    const P = [[W * 0.32, 380], [W * 0.36, 250], [W * 0.42, 120], [W * 0.52, -20]];
    const bz = (t, i) => { const u = 1 - t; return u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]; };
    const path = (k) => { k.moveTo(P[0][0], P[0][1]); k.bezierCurveTo(P[1][0], P[1][1], P[2][0], P[2][1], P[3][0], P[3][1]); };
    c.lineCap = 'round'; c.strokeStyle = 'rgba(40,14,10,0.4)'; c.lineWidth = 19; c.beginPath(); path(c); c.stroke();
    c.strokeStyle = '#3e2219'; c.lineWidth = 16; c.beginPath(); path(c); c.stroke();
    const R = rng(7);
    for (let i = 0; i < 260; i++) for (let j = -3; j <= 3; j++) {
      const t = i / 260, x = bz(t, 0), y = bz(t, 1), tx = bz(t + 0.002, 0) - x, ty = bz(t + 0.002, 1) - y, l = Math.hypot(tx, ty) || 1;
      const o = j * 2.1 + (R() - 0.5) * 0.8, cxp = x - (ty / l) * o + (R() - 0.5), cyp = y + (tx / l) * o + (R() - 0.5), r = 0.9 + R() * 0.45, f = (0.78 + 0.22 * R()) * (Math.abs(j) === 3 ? 0.82 : 1);
      if (i & 1 && j & 1) continue;
      const pts = []; for (let q = 0; q < 5; q++) { const a = q / 5 * TAU + R() * 0.6; pts.push([cxp + Math.cos(a) * r, cyp + Math.sin(a) * r]); }
      c.fillStyle = 'rgb(' + (84 * f * 1.12 | 0) + ',' + (50 * f * 1.12 | 0) + ',' + (38 * f * 1.12 | 0) + ')'; c.beginPath(); roundPoly(c, pts, 0.3); c.fill();
    }
    // pink strawberry sugar-sand: fine grain + rare white sparkle grains
    const pink = blob(W * 0.86, 330, 110, 23, 8);
    c.save(); c.shadowColor = 'rgba(60,22,30,0.35)'; c.shadowBlur = 2.6 * s; c.shadowOffsetY = 1.2 * s; c.beginPath(); pink(c); c.fillStyle = PALETTE.pinkSugar; c.fill(); c.restore();
    clipDo(c, pink, (k) => {
      for (let y = 200; y < 360; y += 0.5) for (let x = W * 0.6; x < W; x += 0.5) { const q = hash(x * 2, y * 2, 33); if (q < 0.06) { k.fillStyle = q < 0.004 ? '#fff6fa' : q < 0.03 ? 'rgba(255,255,255,0.18)' : 'rgba(150,60,90,0.12)'; k.fillRect(x, y, 0.5, 0.5); } }
      k.lineWidth = 2; k.strokeStyle = 'rgba(120,40,70,0.18)'; k.beginPath(); pink(k); k.stroke();
    });
    // mint frosting meadow: dark drop shadow + drips on the lower edge, glossy white piping highlight near the top edge
    const mint = blob(W * 0.82, 10, 85, 5, 7);
    c.save(); c.shadowColor = 'rgba(60,22,30,0.55)'; c.shadowBlur = 4 * s; c.shadowOffsetY = 2.5 * s; c.fillStyle = PALETTE.mint; c.beginPath(); mint(c); c.fill(); c.restore();
    c.fillStyle = PALETTE.mint; c.beginPath(); mint(c); c.fill();
    clipDo(c, mint, (k) => { k.strokeStyle = 'rgba(250,255,250,0.35)'; k.lineWidth = 0.9; for (let y = -40; y < 100; y += 10) { k.beginPath(); for (let x = W * 0.55; x < W; x += 3) k.lineTo(x, y + x * 0.16 + Math.sin(x * 0.05) * 3); k.stroke(); }
      k.lineWidth = 2.2; k.strokeStyle = 'rgba(40,110,80,0.25)'; k.beginPath(); mint(k); k.stroke(); });
    return cv;
  }

  /* ----------------------------------------------------- public drawers */
  /** Shadow: cocoa-plum radial ellipse rgba(45,12,22,.42 -> .3 @55% -> 0). */
  function shadow(ctx, x, y, rx, ry, a) { ctx.save(); ctx.globalAlpha = a || 1; ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.fillStyle = rg(ctx, 0, 0, 0, 0, 0, rx, [[0, 'rgba(45,12,22,0.42)'], [0.55, 'rgba(45,12,22,0.3)'], [1, 'rgba(45,12,22,0)']]); ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore(); }
  /** Draws the hero with feet at (x, y). t = seconds, facing = 1 | -1. Hop-walk with squash on contact. */
  function drawHero(ctx, x, y, t, facing) {
    const sp = SPR || sprites(3), ph = t * 2.2, f = ph - Math.floor(ph), hop = Math.floor(ph), air = Math.sin(f * PI);
    const contact = Math.max(0, 1 - Math.min(f, 1 - f) * 6), JS = 1.06;
    const sy = (1 + 0.07 * air - 0.13 * contact) * JS, sx = (1 - 0.04 * air + 0.12 * contact) * JS, lift = air * 3.2 * JS;
    const frame = contact > 0.25 ? (hop & 1 ? 1 : 3) : 2;
    shadow(ctx, x, y, (9 - air * 1.4) * JS, (3.2 - air * 0.45) * JS);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.32 + 0.06 * Math.sin(t * 7); // warm caramel glow behind the head
    ctx.fillStyle = rg(ctx, x + facing * 1.5, y - lift - 21, 0, x + facing * 1.5, y - lift - 21, 20, [[0, 'rgba(255,200,90,0.8)'], [0.35, 'rgba(255,160,60,0.32)'], [1, 'rgba(255,140,40,0)']]);
    ctx.fillRect(x - 22, y - lift - 42, 44, 44); ctx.restore();
    blit(ctx, sp.jack[frame], x, y - lift, sx, sy, 0.07 * facing * air, facing < 0);
  }
  /** Draws a typical enemy (gummy turnip, variant 0-2) with feet at (x, y): jelly wobble. */
  function drawEnemy(ctx, x, y, t, variant, facing) {
    const sp = SPR || sprites(3), ph = t * 0.85 * 1.6 + (variant || 0) * 0.37, fr = Math.floor(ph * 4) & 3, sn = Math.sin(ph * TAU), up = Math.abs(sn);
    shadow(ctx, x, y, 9, 3.2);
    blit(ctx, sp.creep[(variant || 0) % 3][fr], x, y - up * 1.3, (1 + (1 - up) * 0.07) * 0.92, (1 - (1 - up) * 0.08 + up * 0.04) * 0.92, sn * 0.1, facing < 0);
  }
  function drawGhost(ctx, x, y, t, seed) {
    const sp = SPR || sprites(3), b = Math.sin(t * 4.2 + seed * 7);
    shadow(ctx, x, y, 6.2, 2.2, 0.7);
    ctx.save(); ctx.globalAlpha = 0.9; blit(ctx, sp.ghost[Math.floor(t * 6 + seed * 4) & 3], x, y - 4.5 - Math.sin(t * 2.6 + seed * 12) * 1.6, 1 + b * 0.05, 1 - b * 0.05); ctx.restore();
  }
  function damageNumber(ctx, txt, x, y) {
    ctx.save(); ctx.font = '10px "Chewy", "Sniglet", "Arial Rounded MT Bold", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.strokeStyle = OUT; ctx.lineWidth = 4.2; ctx.strokeText(txt, x, y + 0.8); ctx.strokeText(txt, x, y);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeText(txt, x, y);
    ctx.fillStyle = lg(ctx, 0, y - 4.5, 0, y + 4, [[0, '#fff27a'], [0.5, '#ffbe2e'], [1, '#ff7a1a']]); ctx.fillText(txt, x, y); ctx.restore();
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds). */
  function draw(ctx, w, h, t) {
    const s = h / 360, W = w / s, sp = sprites(s);
    if (!GROUND || GROUND.width !== w || GROUND.height !== h) GROUND = bakeGround(w, h, s);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(GROUND, 0, 0);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const cx = W * 0.5;
    const actors = [
      { y: 212, f: () => drawHero(ctx, cx, 212, t, 1) },
      { y: 300, f: () => blit(ctx, sp.lolli, W * 0.74, 300) },
      { y: 150, f: () => drawGhost(ctx, cx - 70, 150, t, 0.3) },
      { y: 280, f: () => drawGhost(ctx, cx - 120, 280, t, 0.8) },
    ];
    [[cx + 80, 170, 0], [cx + 115, 235, 1], [cx + 60, 270, 2], [cx + 150, 195, 2], [cx - 95, 215, 1], [cx + 175, 270, 0]].forEach(([x, y, v]) => actors.push({ y, f: () => drawEnemy(ctx, x, y, t, v, -1) }));
    for (const [x, y, big] of [[cx - 30, 250, 0], [cx - 45, 180, 1], [cx + 30, 300, 0], [cx - 150, 100, 0]]) {
      const hh = 1.2 + Math.sin(t * 4 + x) * 0.9; shadow(ctx, x, y, 3.2 * (big ? 1.4 : 1), 1.3 * (big ? 1.4 : 1), 0.8);
      blit(ctx, big ? sp.gemB : sp.gem, x, y - hh - (big ? 4.6 : 3.2), 1, 1, Math.sin(t * 2 + x) * 0.18);
    }
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.f());
    // seed projectile with white/pink motion streak
    const px = cx + 20 + ((t * 120) % 50), py = 200;
    ctx.lineCap = 'round'; ctx.strokeStyle = lg(ctx, px - 2, 0, px - 17, 0, [[0, 'rgba(255,255,255,0.95)'], [1, 'rgba(255,255,255,0)']]); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(px - 3, py); ctx.lineTo(px - 16, py); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,140,190,0.8)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(px - 3, py - 1.6); ctx.lineTo(px - 11, py - 1.6); ctx.moveTo(px - 3, py + 1.6); ctx.lineTo(px - 10, py + 1.6); ctx.stroke();
    blit(ctx, sp.seed, px, py, 1, 0.6 + 0.4 * Math.abs(Math.cos(t * 9)));
    // hit: pink-edged sugar star + sprinkle burst + sparkle
    const hx = cx + 80, hy = 158; blit(ctx, sp.hit, hx, hy, 0.8 + 0.1 * Math.sin(t * 20), 0.8 + 0.1 * Math.sin(t * 20), t);
    for (let i = 0; i < 14; i++) { const a = hash(i, 1, 5) * TAU, d = 6 + hash(i, 2, 5) * 16; blit(ctx, sp.sprink[i % 7], hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.6 + 4, 1, 1, a * 3 + t * 4); }
    damageNumber(ctx, '34', hx + 6, hy - 18);
    // drifting sugar sparkles (additive)
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) { const tw = Math.sin(t * 2.2 + i * 3); if (tw < 0) continue; const x = hash(i, 3, 9) * W, y = hash(i, 4, 9) * 360, r = 1.6 + tw * 1.4; ctx.globalAlpha = tw * 0.7;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + r * 0.1, y - r * 0.1, x + r, y); ctx.quadraticCurveTo(x + r * 0.1, y + r * 0.1, x, y + r); ctx.quadraticCurveTo(x - r * 0.1, y + r * 0.1, x - r, y); ctx.quadraticCurveTo(x - r * 0.1, y - r * 0.1, x, y - r); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // plum vignette
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = rg(ctx, w / 2, h * 0.46, h * 0.35, w / 2, h / 2, w * 0.62, [[0, 'rgba(60,10,50,0)'], [0.7, 'rgba(60,10,50,0.16)'], [1, 'rgba(50,8,40,0.42)']]); ctx.fillRect(0, 0, w, h);
  }

  const Starter = { id: 'candy', name: 'Trick or Treat', palette: PALETTE, fonts: ['Chewy', 'Sniglet:wght@400;800'], drawHero, drawEnemy, drawGhost, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['candy'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
