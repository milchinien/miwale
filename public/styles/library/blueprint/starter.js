/* Blueprint — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Core trick: every sprite is painted twice with the same path functions – a 'back' pass that fills and
   widens each part in navy (one knock-out halo per sprite) and a 'main' pass with blue fill, clipped 45°
   hatching, a navy separation line and the white outline. Construction lines are main-pass only.
   Text is a built-in single-stroke font, so nothing waits for web fonts. */
(function (root) {
  'use strict';
  const PALETTE = {
    paper: '#0e5088', paperDark: '#0a4374', paperLight: '#16609c', line: '#e2f4ff', ink: '#f2faff', pale: '#a9dcf6',
    construction: '#74b6de', navy: '#062a4a', sep: '#072e52', fill: '#1c6aa8', fillBack: '#165b93', fillTop: '#2a7dbd',
    lens: '#08304f', propLine: '#d3ebfa', propFill: '#14598f', water: '#04284c', road: '#0f538c',
    red: '#ff5b4d', amber: '#ffcf4a', eraser: '#f3b6ae', coffee: '#c4a060',
  };
  const P = PALETTE, TAU = Math.PI * 2, PI = Math.PI, HALO = 2.3;
  const W = (a) => 'rgba(226,244,255,' + a + ')';
  const CHAIN = [5.5, 1.3, 0.9, 1.3];
  function hash(i, j, s) { let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

  /* ---------- single-stroke lettering (4x6 grid, uppercase) ---------- */
  const O = [1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0], PP = [0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3];
  const GL = {
    '0': [O], '1': [[1, 1.2, 2.2, 0, 2.2, 6], [1, 6, 3.4, 6]], '2': [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 0, 6, 4, 6]], '3': [[0, 0, 4, 0, 2, 2.5, 3, 2.5, 4, 3.5, 4, 5, 3, 6, 1, 6, 0, 5]],
    '4': [[3, 6, 3, 0, 0, 4.2, 4, 4.2]], '5': [[4, 0, 0.3, 0, 0, 2.6, 3, 2.6, 4, 3.6, 4, 5, 3, 6, 0, 6]], '6': [[3.5, 0, 1.5, 0, 0, 2, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3.6, 3, 2.6, 1, 2.6, 0, 3.6]],
    '7': [[0, 0, 4, 0, 1.4, 6]], '8': [[1, 0, 3, 0, 4, 1, 4, 2, 3, 3, 1, 3, 0, 4, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3], [1, 3, 0, 2, 0, 1, 1, 0]], '9': [[4, 2.5, 3, 3.5, 1, 3.5, 0, 2.5, 0, 1, 1, 0, 3, 0, 4, 1, 4, 4, 2.4, 6, 0.6, 6]],
    A: [[0, 6, 2, 0, 4, 6], [0.7, 4, 3.3, 4]], B: [[0, 3, 3, 3, 4, 4, 4, 5, 3, 6, 0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3]], C: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5]],
    D: [[0, 0, 0, 6, 2.5, 6, 4, 4.5, 4, 1.5, 2.5, 0, 0, 0]], E: [[4, 0, 0, 0, 0, 6, 4, 6], [0, 3, 3, 3]], F: [[4, 0, 0, 0, 0, 6], [0, 3, 3, 3]],
    H: [[0, 0, 0, 6], [4, 0, 4, 6], [0, 3, 4, 3]], I: [[1, 0, 3, 0], [2, 0, 2, 6], [1, 6, 3, 6]], L: [[0, 0, 0, 6, 4, 6]], N: [[0, 6, 0, 0, 4, 6, 4, 0]],
    O: [O], P: [PP], R: [PP, [2, 3, 4, 6]], S: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 2, 1, 3, 3, 3, 4, 4, 4, 5, 3, 6, 1, 6, 0, 5]], T: [[0, 0, 4, 0], [2, 0, 2, 6]],
    U: [[0, 0, 0, 5, 1, 6, 3, 6, 4, 5, 4, 0]], V: [[0, 0, 2, 6, 4, 0]], W: [[0, 0, 1, 6, 2, 2.6, 3, 6, 4, 0]], M: [[0, 6, 0, 0, 2, 3.5, 4, 0, 4, 6]],
    G: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3.4, 2.4, 3.4]], Y: [[0, 0, 2, 3, 4, 0], [2, 3, 2, 6]], '.': [[1.6, 5.4, 2.4, 5.4, 2.4, 6, 1.6, 6, 1.6, 5.4]],
    '-': [[0.8, 3, 3.2, 3]], '+': [[0.4, 3, 3.6, 3], [2, 1.4, 2, 4.6]], '/': [[3.8, 0, 0.2, 6]], ':': [[2, 1.7, 2, 2.2], [2, 4.8, 2, 5.3]], 'Ø': [O, [4.5, -0.6, -0.5, 6.6]],
  };
  const textW = (s, h) => (s.length * 5.7 - 1.7) * h / 6;
  function text(c, s, x, y, h, col, lw, align, italic) {
    const k = h / 6, sk = italic ? 0.2 : 0;
    let x0 = align === 'center' ? x - textW(s, h) / 2 : align === 'right' ? x - textW(s, h) : x;
    c.beginPath();
    for (const ch of s.toUpperCase()) {
      for (const p of GL[ch] || []) for (let j = 0; j < p.length; j += 2) {
        const px = x0 + p[j] * k + (6 - p[j + 1]) * k * sk, py = y - h + p[j + 1] * k;
        if (j) c.lineTo(px, py); else c.moveTo(px, py);
      }
      x0 += 5.7 * k;
    }
    c.strokeStyle = col; c.lineWidth = lw; c.stroke();
  }

  /* ---------- drafting primitives ---------- */
  function centerMark(c, x, y, r, e) {
    const k = Math.min(1.2, r * 0.35);
    c.moveTo(x - k, y); c.lineTo(x + k, y); c.moveTo(x, y - k); c.lineTo(x, y + k);
    c.moveTo(x - r - e, y); c.lineTo(x - r + 0.6, y); c.moveTo(x + r - 0.6, y); c.lineTo(x + r + e, y);
    c.moveTo(x, y - r - e); c.lineTo(x, y - r + 0.6); c.moveTo(x, y + r - 0.6); c.lineTo(x, y + r + e);
  }
  function arrow(c, x, y, a, l, w) { const dx = Math.cos(a), dy = Math.sin(a); c.moveTo(x, y); c.lineTo(x - dx * l - dy * w, y - dy * l + dx * w); c.lineTo(x - dx * l + dy * w, y - dy * l - dx * w); c.closePath(); }
  function dimLine(c, x1, y1, x2, y2, off, label, col) {
    const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = (y2 - y1) / L, ny = -(x2 - x1) / L;
    const ax = x1 + nx * off, ay = y1 + ny * off, bx = x2 + nx * off, by = y2 + ny * off, s = off >= 0 ? 1 : -1;
    c.beginPath(); c.moveTo(x1 + nx * s * 1.5, y1 + ny * s * 1.5); c.lineTo(ax + nx * s * 2, ay + ny * s * 2);
    c.moveTo(x2 + nx * s * 1.5, y2 + ny * s * 1.5); c.lineTo(bx + nx * s * 2, by + ny * s * 2); c.moveTo(ax, ay); c.lineTo(bx, by);
    c.strokeStyle = col; c.lineWidth = 0.35; c.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.beginPath(); arrow(c, ax, ay, a + PI, 3, 1); arrow(c, bx, by, a, 3, 1); c.fillStyle = col; c.fill();
    c.save(); c.translate((ax + bx) / 2 + nx * s * 1.2, (ay + by) / 2 + ny * s * 1.2); c.rotate(a > PI / 2 || a < -PI / 2 ? a + PI : a);
    text(c, label, 0, -0.4, 4, col, 0.4, 'center'); c.restore();
  }
  function hatch(c, x0, y0, x1, y1, sp) { const R = Math.hypot(x1 - x0, y1 - y0); for (let o = -R; o <= R; o += sp) { c.moveTo(x0 + o, y1); c.lineTo(x0 + o + R, y1 - R); } }
  function rrect(c, x, y, w, h, r) { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  /* ---------- two-pass painting ---------- */
  let PASS = 'main';
  const RR = (x, y, w, h, r) => (c) => { c.beginPath(); rrect(c, x, y, w, h, r); };
  const CI = (x, y, r) => (c) => { c.beginPath(); c.arc(x, y, r, 0, TAU); };
  const LN = (p) => (c) => { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); };
  function shp(c, path, o) {
    const lw = o.lw === undefined ? 1 : o.lw;
    if (PASS === 'back') { path(c); c.fillStyle = P.navy; c.fill(); c.lineWidth = lw + HALO; c.strokeStyle = P.navy; c.stroke(); return; }
    path(c); if (o.fill) { c.fillStyle = o.fill; c.fill(); }
    if (o.hatch) {
      const h = o.hatch; c.save(); path(c); c.clip(); c.beginPath(); c.rect(h[0], h[1], h[2] - h[0], h[3] - h[1]); c.clip();
      c.beginPath(); hatch(c, h[0] - 20, h[1] - 20, h[2] + 20, h[3] + 20, 1.15); c.lineWidth = 0.32; c.strokeStyle = o.hcol || W(0.5); c.stroke(); c.restore();
    }
    path(c); c.lineWidth = lw + 0.85; c.strokeStyle = P.sep; c.stroke(); c.lineWidth = lw; c.strokeStyle = o.col || P.ink; c.stroke();
  }
  function tube(c, path, w, core) {
    if (PASS === 'back') { path(c); c.lineWidth = w + HALO; c.strokeStyle = P.navy; c.stroke(); return; }
    path(c); c.lineWidth = w + 0.85; c.strokeStyle = P.sep; c.stroke(); c.lineWidth = w; c.strokeStyle = P.ink; c.stroke();
    c.lineWidth = Math.max(0.2, w - 1.1); c.strokeStyle = core || P.fill; c.stroke();
  }
  function con(c, path, lw, col, dash) { if (PASS === 'back') return; path(c); if (dash) c.setLineDash(dash); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); c.setLineDash([]); }
  function twoPass(c, fn) { for (const p of ['back', 'main']) { PASS = p; c.save(); fn(c); c.restore(); } PASS = 'main'; }

  /* ---------- main character: engineer robot, feet at (x, y) ---------- */
  function heroParts(c, t) {
    const a = t * TAU * 1.4, bob = -Math.abs(Math.sin(a)) * 1.1, sw = Math.sin(a) * 0.65;
    con(c, LN([0, 3, 0, -42]), 0.3, W(0.42), CHAIN);
    const hip = -8.4 + bob;
    const leg = (hx, p, back) => {
      const fx = hx + Math.sin(p) * 3.3, fy = -Math.max(0, Math.cos(p)) * 1.9, kx = (hx + fx) / 2 + 0.9, ky = (hip + fy - 1.3) / 2;
      tube(c, LN([hx, hip, kx, ky, fx, fy - 1.6]), 2.1, back ? P.fillBack : P.fill);
      shp(c, CI(kx, ky, 0.95), { fill: P.fillTop, lw: 0.5 }); shp(c, RR(fx - 1.9, fy - 2.1, 4.9, 2.1, 0.9), { fill: back ? P.fillBack : P.fill, lw: 0.7 });
    };
    const arm = (sx, an, an2, back, pen) => {
      const sy = -15.4 + bob, ex = sx + Math.sin(an) * 3.3, ey = sy + Math.cos(an) * 3.3, hx = ex + Math.sin(an2) * 3.1, hy = ey + Math.cos(an2) * 3.1;
      tube(c, LN([sx, sy, ex, ey, hx, hy]), 1.75, back ? P.fillBack : P.fill);
      if (pen) { const d = -0.75, dx = Math.cos(d), dy = Math.sin(d), nx = -dy, ny = dx, bx = hx - dx * 3.4, by = hy - dy * 3.4, tx = hx + dx * 7.9, ty = hy + dy * 7.9;
        shp(c, (q) => { q.beginPath(); q.moveTo(bx + nx, by + ny); q.lineTo(tx + nx, ty + ny); q.lineTo(tx + dx * 2.6, ty + dy * 2.6); q.lineTo(tx - nx, ty - ny); q.lineTo(bx - nx, by - ny); q.closePath(); }, { fill: P.amber, lw: 0.6 }); }
      shp(c, CI(hx, hy, 1.3), { fill: back ? P.fillBack : P.fillTop, lw: 0.6 });
    };
    arm(-4.6, -sw + 0.1, -sw + 0.3, true); leg(-2.2, a + PI, true); leg(2.2, a, false);
    shp(c, RR(-5.3, -17.6 + bob, 10.6, 8.8, 1.8), { fill: P.fill, hatch: [2.6, -19 + bob, 6, -8 + bob] });
    shp(c, CI(-1, -14.3 + bob, 2.15), { fill: P.lens, lw: 0.55 });
    shp(c, RR(-6.7, -29.8 + bob, 13.4, 10.4, 2.2), { fill: P.fill, lw: 1.05, hatch: [4.2, -31 + bob, 7.5, -19 + bob] });
    con(c, (q) => { q.beginPath(); for (let i = 0; i < 3; i++) { q.moveTo(-5, -23.3 + i * 1.15 + bob); q.lineTo(-2.2, -23.3 + i * 1.15 + bob); } }, 0.45, P.pale);
    shp(c, CI(2.3, -24.7 + bob, 3.4), { fill: P.lens, lw: 0.85 });
    if (PASS === 'main') {
      c.beginPath(); c.arc(3, -25 + bob, 1.15, 0, TAU); c.fillStyle = P.ink; c.fill();
      c.beginPath(); centerMark(c, 2.3, -24.7 + bob, 3.4, 1.8); c.lineWidth = 0.28; c.strokeStyle = W(0.75); c.stroke();
    }
    shp(c, (q) => { q.beginPath(); q.moveTo(-6.3, -29.5 + bob); q.ellipse(0, -29.5 + bob, 6.3, 5.1, 0, PI, 0); q.closePath(); }, { fill: P.amber, lw: 0.95, hatch: [2.8, -36 + bob, 7, -29 + bob], hcol: 'rgba(150,90,0,0.55)' });
    shp(c, RR(-8.3, -30.4 + bob, 16.6, 1.7, 0.85), { fill: P.amber, lw: 0.8 });
    tube(c, LN([-3.4, -33.6 + bob, -4.8, -37 + bob]), 0.6, P.ink); shp(c, CI(-5, -38 + bob, 0.95), { fill: P.red, lw: 0.45 });
    arm(4.6, sw * 0.6 + 0.25, sw * 0.4 + 1.2, false, true);
  }
  function drawHero(ctx, x, y, t, facing) {
    ctx.save(); ctx.translate(x, y); ctx.scale((facing < 0 ? -1 : 1) * 0.92, 0.92); ctx.lineCap = ctx.lineJoin = 'round';
    twoPass(ctx, (c) => heroParts(c, t)); ctx.restore();
  }

  /* ---------- small creature: cog crawler, feet at (x, y) ---------- */
  function gear(c, cx, cy, r0, r1, n, rot) {
    c.beginPath(); const st = TAU / n;
    for (let i = 0; i < n; i++) for (const [da, r] of [[0, r0], [0.1, r1], [0.42, r1], [0.52, r0]]) { const an = rot + (i + da) * st; c.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); }
    c.closePath();
  }
  function drawEnemy(ctx, x, y, t) {
    const a = t * TAU * 1.6, cy = -10.8 - Math.abs(Math.sin(a)) * 0.7;
    ctx.save(); ctx.translate(x, y); ctx.lineCap = ctx.lineJoin = 'round';
    twoPass(ctx, (c) => {
      const leg = (sd, al, p, back) => { const lift = Math.max(0, Math.sin(p)) * 2.1; tube(c, LN([sd * 3.6 + al, cy + 3.6, sd * 8.4 + al * 0.8, cy - 0.6 - lift * 0.4, sd * 9.4 + al * 1.2 + Math.cos(p) * 1.6, -lift - 0.6]), 1.35, back ? P.fillBack : P.fill); };
      leg(-1, -1.4, a + PI, true); leg(1, -1.4, a, true);
      for (const sd of [-1, 1]) { tube(c, LN([sd * 1.8, cy - 7.4, sd * 3.2, cy - 11, sd * 4.6, cy - 12]), 0.5, P.ink); shp(c, CI(sd * 4.6, cy - 12, 0.7), { fill: P.ink, lw: 0.3 }); }
      shp(c, (q) => gear(q, 0, cy, 6.1, 7.9, 9, a / 9), { fill: P.fill, lw: 0.95, hatch: [0.5, cy + 0.5, 10, cy + 10] });
      con(c, CI(0, cy, 4.85), 0.3, W(0.55), [2.4, 0.8, 0.6, 0.8]);
      shp(c, CI(0, cy, 2.9), { fill: P.lens, lw: 0.75 }); shp(c, CI(0.7, cy + 0.1, 1.65), { fill: P.red, lw: 0.4 });
      if (PASS === 'main') {
        c.beginPath(); c.arc(0.2, cy - 0.35, 0.48, 0, TAU); c.fillStyle = '#fff4ee'; c.fill();
        c.beginPath(); c.moveTo(-2.6, cy - 4.2); c.lineTo(-0.2, cy - 3.2); c.moveTo(1.6, cy - 3.2); c.lineTo(3.9, cy - 4.3); c.lineWidth = 0.75; c.strokeStyle = P.ink; c.stroke();
        c.beginPath(); centerMark(c, 0, cy, 7.9, 1.6); c.lineWidth = 0.26; c.strokeStyle = W(0.6); c.stroke();
      }
      leg(-1, 1.2, a, false); leg(1, 1.2, a + PI, false);
    });
    ctx.restore();
  }

  /* ---------- props, shadow ---------- */
  function drawTree(ctx, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.lineCap = ctx.lineJoin = 'round';
    const cs = [[-6.5, -30, 9.5], [6, -32, 10], [0, -41, 10], [-1, -25, 7]];
    const union = (c) => { c.beginPath(); for (const [cx, cy, r] of cs) { c.moveTo(cx + r, cy); c.arc(cx, cy, r, 0, TAU); } };
    twoPass(ctx, (c) => {
      tube(c, LN([0, 0, 0, -20]), 2.8, P.propFill);
      if (PASS === 'back') { union(c); c.fillStyle = P.navy; c.fill(); c.lineWidth = 2.8; c.strokeStyle = P.navy; c.stroke(); return; }
      union(c); c.lineWidth = 1.9; c.strokeStyle = P.propLine; c.stroke(); union(c); c.fillStyle = P.propFill; c.fill();
      c.save(); union(c); c.clip(); c.beginPath(); c.rect(-2, -34, 20, 30); c.clip(); c.beginPath(); hatch(c, -20, -55, 20, -10, 1.3); c.lineWidth = 0.3; c.strokeStyle = W(0.45); c.stroke(); c.restore();
      c.beginPath(); for (const [cx, cy] of cs) { c.moveTo(cx - 0.9, cy); c.lineTo(cx + 0.9, cy); c.moveTo(cx, cy - 0.9); c.lineTo(cx, cy + 0.9); } c.lineWidth = 0.28; c.strokeStyle = W(0.7); c.stroke();
    });
    ctx.restore();
  }
  function shadow(ctx, x, y, rx) {
    ctx.fillStyle = 'rgba(3,22,42,0.45)'; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.36, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - rx * 1.05, y); ctx.lineTo(x + rx * 1.05, y);
    for (let i = -3; i <= 3; i++) { ctx.moveTo(x + i * rx * 0.24 + 0.4, y + 0.5); ctx.lineTo(x + i * rx * 0.24 - 1.2, y + 2.6); }
    ctx.lineWidth = 0.45; ctx.strokeStyle = W(0.4); ctx.stroke();
  }

  /* ---------- paper (cached per size) ---------- */
  const CACHE = { key: '', paper: null };
  function paper(w, h, s) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    c.fillStyle = P.paper; c.fillRect(0, 0, w, h);
    const g = c.createRadialGradient(w * 0.22, h * 0.12, 0, w * 0.22, h * 0.12, Math.hypot(w, h) * 0.6);
    g.addColorStop(0, 'rgba(40,120,180,0.35)'); g.addColorStop(1, 'rgba(40,120,180,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h / 900; i++) { const x = hash(i, 1, 3) * w, y = hash(i, 2, 3) * h; c.fillStyle = hash(i, 3, 3) < 0.5 ? 'rgba(230,246,255,0.06)' : 'rgba(2,26,52,0.08)'; c.fillRect(x, y, 1.2, 1.2); }
    c.setTransform(s, 0, 0, s, 0, 0); const vw = w / s;
    for (let x = 0; x < vw; x += 8) { c.fillStyle = x % 40 ? 'rgba(205,236,255,0.075)' : 'rgba(205,236,255,0.17)'; c.fillRect(x, 0, x % 40 ? 0.9 / s : 1.15 / s, 360); }
    for (let y = 0; y < 360; y += 8) { c.fillStyle = y % 40 ? 'rgba(205,236,255,0.075)' : 'rgba(205,236,255,0.17)'; c.fillRect(0, y, vw, y % 40 ? 0.9 / s : 1.15 / s); }
    c.lineCap = 'round';
    // a gear detail drawing
    const gx = vw * 0.62, gy = 120, R = 52;
    c.beginPath(); gear(c, gx, gy, R - 6, R, 22, 0.1); c.lineWidth = 0.55; c.strokeStyle = W(0.5); c.stroke();
    c.setLineDash(CHAIN); c.beginPath(); c.arc(gx, gy, R - 3, 0, TAU); c.moveTo(gx - R - 14, gy); c.lineTo(gx + R + 14, gy); c.moveTo(gx, gy - R - 14); c.lineTo(gx, gy + R + 14);
    c.lineWidth = 0.3; c.strokeStyle = W(0.35); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.arc(gx, gy, R * 0.34, 0, TAU); c.moveTo(gx + 8, gy); c.arc(gx, gy, 8, 0, TAU); for (let i = 0; i < 5; i++) { const an = i / 5 * TAU + 0.6, hx = gx + Math.cos(an) * R * 0.6, hy = gy + Math.sin(an) * R * 0.6; c.moveTo(hx + 4, hy); c.arc(hx, hy, 4, 0, TAU); }
    c.lineWidth = 0.45; c.strokeStyle = W(0.5); c.stroke();
    dimLine(c, gx - R * 0.82, gy + R * 0.57, gx + R * 0.82, gy - R * 0.57, 0, 'Ø156', W(0.5));
    text(c, 'DETAIL C  SCALE 2:1', gx, gy + R + 22, 3.6, W(0.5), 0.4, 'center');
    // a canal band with hachures
    c.beginPath(); c.moveTo(-10, 300); c.bezierCurveTo(vw * 0.2, 250, vw * 0.3, 380, vw * 0.5, 372); c.lineWidth = 30; c.strokeStyle = 'rgba(4,40,76,0.5)'; c.stroke();
    for (const [o, a] of [[-15, 0.55], [15, 0.55]]) { c.beginPath(); c.moveTo(-10, 300 + o); c.bezierCurveTo(vw * 0.2, 250 + o, vw * 0.3, 380 + o, vw * 0.5, 372 + o); c.lineWidth = 0.7; c.strokeStyle = W(a); c.stroke(); }
    // site plan: a dash-dot property line fences an equipment yard, a dotted tree line edges a grove
    const blob = (cx0, cy0, rx, ry, ph) => { c.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU, r = 1 + 0.12 * Math.sin(a * 3 + ph) + 0.06 * Math.sin(a * 5 + ph * 2); c.lineTo(cx0 + Math.cos(a) * rx * r, cy0 + Math.sin(a) * ry * r); } };
    blob(vw * 0.2, 250, 70, 46, 1.3); c.setLineDash([9, 1.6, 1.4, 1.6]); c.lineCap = 'butt'; c.lineWidth = 0.75; c.strokeStyle = W(0.36); c.stroke();
    blob(vw * 0.5 + 80, 185, 58, 44, 4.1); c.setLineDash([0.1, 2.6]); c.lineCap = 'round'; c.lineWidth = 1.25; c.strokeStyle = W(0.34); c.stroke(); c.setLineDash([]);
    text(c, 'YARD C', vw * 0.2, 214, 4.4, W(0.42), 0.45, 'center', true); text(c, 'GROVE', vw * 0.5 + 80, 150, 4.2, W(0.38), 0.45, 'center', true);
    // notes, red-pencil cloud, coffee ring
    text(c, 'VERIFY ON SITE', vw * 0.12, 70, 4.2, W(0.42), 0.42, 'left', true);
    text(c, '+12.40', vw * 0.3, 210, 2.8, W(0.38), 0.3, 'left');
    c.beginPath(); for (let i = 0; i < 18; i++) { const t0 = i / 18 * TAU, t1 = (i + 1) / 18 * TAU, tm = (t0 + t1) / 2; if (!i) c.moveTo(vw * 0.86 + Math.cos(t0) * 28, 250 + Math.sin(t0) * 16); c.quadraticCurveTo(vw * 0.86 + Math.cos(tm) * 33, 250 + Math.sin(tm) * 19, vw * 0.86 + Math.cos(t1) * 28, 250 + Math.sin(t1) * 16); }
    c.lineWidth = 0.6; c.strokeStyle = 'rgba(255,91,77,0.55)'; c.stroke();
    c.beginPath(); c.arc(vw * 0.16, 170, 26, 0, TAU); c.lineWidth = 2; c.strokeStyle = 'rgba(196,160,96,0.34)'; c.stroke();
    // fold crease
    const cx = vw * 0.41; const cg = c.createLinearGradient(cx - 5, 0, cx + 5, 0); cg.addColorStop(0, 'rgba(0,22,44,0)'); cg.addColorStop(0.45, 'rgba(255,255,255,0.07)'); cg.addColorStop(0.52, 'rgba(0,22,44,0.22)'); cg.addColorStop(1, 'rgba(0,22,44,0)');
    c.fillStyle = cg; c.fillRect(cx - 5, 0, 10, 360);
    // vignette + sheet border + title block (screen px)
    c.setTransform(1, 0, 0, 1, 0, 0);
    const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, Math.hypot(w, h) * 0.58); v.addColorStop(0, 'rgba(3,22,42,0)'); v.addColorStop(1, 'rgba(2,16,32,0.6)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
    const u = h / 900, o1 = 7 * u, o2 = 21 * u;
    c.strokeStyle = W(0.5); c.lineWidth = u; c.strokeRect(o1, o1, w - 2 * o1, h - 2 * o1); c.strokeStyle = W(0.75); c.lineWidth = 2 * u; c.strokeRect(o2, o2, w - 2 * o2, h - 2 * o2);
    for (let i = 0; i < 6; i++) text(c, 'FEDCBA'[i], o2 + (w - 2 * o2) * (i + 0.5) / 6, o1 + (o2 - o1 + 7 * u) / 2, 7 * u, W(0.7), 1.1 * u, 'center');
    const bw = 300 * u, bh = 74 * u, bx = w - o2 - bw, by = h - o2 - bh;
    c.fillStyle = 'rgba(6,42,74,0.82)'; c.fillRect(bx, by, bw, bh); c.strokeStyle = W(0.8); c.lineWidth = 2 * u; c.strokeRect(bx, by, bw, bh);
    c.beginPath(); c.moveTo(bx, by + bh / 2); c.lineTo(bx + bw, by + bh / 2); c.moveTo(bx + bw * 0.62, by); c.lineTo(bx + bw * 0.62, by + bh); c.lineWidth = u; c.stroke();
    text(c, 'FIELD STUDY', bx + 7 * u, by + 30 * u, 10 * u, P.ink, 1.3 * u, 'left');
    text(c, 'SHEET 04', bx + bw * 0.62 + 8 * u, by + 26 * u, 7 * u, P.ink, 1.1 * u, 'left');
    text(c, 'REV B', bx + bw * 0.62 + 8 * u, by + bh - 12 * u, 7 * u, P.ink, 1.1 * u, 'left');
    text(c, 'DRAWN', bx + 7 * u, by + bh - 12 * u, 6 * u, P.amber, 1 * u, 'left', true);
    return cv;
  }

  /* ---------- preview scene ---------- */
  function draw(ctx, w, h, t) {
    const s = h / 360, key = w + 'x' + h;
    if (CACHE.key !== key) { CACHE.paper = paper(w, h, s); CACHE.key = key; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(CACHE.paper, 0, 0);
    ctx.setTransform(s, 0, 0, s, 0, 0); ctx.lineCap = ctx.lineJoin = 'round';
    const vw = w / s, hx = vw * 0.5, hy = 210;
    // plotted route of the main character
    ctx.setLineDash([2.6, 2]); ctx.beginPath(); ctx.moveTo(hx - 90, 290); ctx.bezierCurveTo(hx - 60, 240, hx - 40, 260, hx, hy); ctx.lineWidth = 0.55; ctx.strokeStyle = W(0.28); ctx.stroke(); ctx.setLineDash([]);
    shadow(ctx, hx + 80, 200, 13); drawTree(ctx, hx + 80, 200);
    const foes = [[hx - 120, 160, 0], [hx + 150, 240, 0.3], [hx - 70, 290, 0.6], [hx + 40, 300, 0.2]];
    for (const [x, y, ph] of foes) { shadow(ctx, x, y, 10.5); drawEnemy(ctx, x, y, t + ph); }
    shadow(ctx, hx, hy, 9.5); drawHero(ctx, hx, hy, t, 1);
    // projectile: flying dimension arrow on a dashed trajectory
    const k = (t * 0.9) % 1, px = hx + 10 + (foes[1][0] - hx - 14) * k, py = hy - 14 + (foes[1][1] - 12 - hy + 14) * k, an = Math.atan2(foes[1][1] - hy + 2, foes[1][0] - hx - 24);
    ctx.setLineDash([2.4, 1.7]); ctx.lineDashOffset = -t * 40; ctx.beginPath(); ctx.moveTo(hx + 10, hy - 14); ctx.lineTo(px, py);
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(6,42,74,0.55)'; ctx.stroke(); ctx.lineWidth = 0.6; ctx.strokeStyle = W(0.85); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
    ctx.beginPath(); arrow(ctx, px + Math.cos(an) * 3.6, py + Math.sin(an) * 3.6, an, 6, 1.9); ctx.lineWidth = 1.7; ctx.strokeStyle = P.navy; ctx.stroke(); ctx.fillStyle = P.ink; ctx.fill();
    // orbiting protractor disc + collectible nut
    const oa = t * 2.4, ox = hx + Math.cos(oa) * 40, oy = hy - 6 + Math.sin(oa) * 34;
    ctx.beginPath(); ctx.arc(ox, oy, 6.2, 0, TAU); ctx.lineWidth = 2.6; ctx.strokeStyle = P.navy; ctx.stroke(); ctx.fillStyle = P.amber; ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.beginPath(); for (let i = 0; i < 12; i++) { const q = i / 12 * TAU + t * 5; ctx.moveTo(ox + Math.cos(q) * 6, oy + Math.sin(q) * 6); ctx.lineTo(ox + Math.cos(q) * 4.6, oy + Math.sin(q) * 4.6); } ctx.lineWidth = 0.3; ctx.strokeStyle = 'rgba(90,50,0,0.85)'; ctx.stroke();
    const nx = hx - 40, ny = hy + 20 - 2 - Math.sin(t * 4) * 1.2;
    shadow(ctx, nx, hy + 22, 3); ctx.beginPath(); for (let i = 0; i < 6; i++) ctx.lineTo(nx + Math.cos(i * PI / 3 + PI / 6) * 2.9, ny + Math.sin(i * PI / 3 + PI / 6) * 2.9); ctx.closePath();
    ctx.lineWidth = 2.4; ctx.strokeStyle = P.navy; ctx.stroke(); ctx.fillStyle = P.amber; ctx.fill(); ctx.lineWidth = 0.6; ctx.strokeStyle = P.ink; ctx.stroke();
    // exploded view on one creature: the parts separate on a chain centre line, a red-pencil X strikes them out,
    // the eraser wipes them, eraser crumbs + a dashed ring are the residue (loops every 1.4 s)
    const q = (t / 1.4) % 1, ex = foes[2][0] + 46, ey = foes[2][1] - 2;
    const xe = 1 - (1 - Math.min(1, q / 0.42)) ** 2, wipe = Math.min(1, Math.max(0, (q - 0.5) / 0.45)), fa = q > 0.8 ? 1 - (q - 0.8) / 0.2 : 1;
    ctx.globalAlpha = 0.6 * fa; ctx.setLineDash(CHAIN); ctx.beginPath(); ctx.moveTo(ex, ey + 2); ctx.lineTo(ex, ey - 26 - 9 * xe); ctx.lineWidth = 0.4; ctx.strokeStyle = W(0.9); ctx.stroke(); ctx.setLineDash([]);
    [[-24, -12.8, -9], [-12.8, -6.2, -4], [-6.2, 2, 0]].forEach(([y0, y1, lift]) => {
      ctx.save(); ctx.beginPath(); ctx.rect(ex - 14 + wipe * 28, ey + y0 + lift * xe, 28, y1 - y0); ctx.clip();
      ctx.globalAlpha = (1 - wipe * 0.45) * fa; drawEnemy(ctx, ex, ey + lift * xe, 0.3); ctx.restore();
    });
    const k1 = Math.min(1, Math.max(0, (q - 0.22) / 0.3)), k2 = Math.min(1, Math.max(0, (q - 0.38) / 0.3)), xc = ey - 11 - 3 * xe;
    ctx.globalAlpha = fa; ctx.beginPath(); ctx.moveTo(ex - 8, xc - 8); ctx.lineTo(ex - 8 + 16 * k1, xc - 8 + 16 * k1); if (k2 > 0) { ctx.moveTo(ex + 8, xc - 7); ctx.lineTo(ex + 8 - 15 * k2, xc - 7 + 15 * k2); }
    ctx.lineWidth = 2.6; ctx.strokeStyle = 'rgba(6,42,74,0.7)'; ctx.stroke(); ctx.lineWidth = 1.2; ctx.strokeStyle = P.red; ctx.stroke();
    if (q > 0.5) {
      const r = (q - 0.5) / 0.5;
      ctx.globalAlpha = 1 - r; ctx.setLineDash([2.2, 1.5]); ctx.beginPath(); ctx.ellipse(ex, ey, 8 + r * 18, (8 + r * 18) * 0.42, 0, 0, TAU); ctx.lineWidth = 0.55; ctx.strokeStyle = W(0.8); ctx.stroke(); ctx.setLineDash([]);
      for (let i = 0; i < 6; i++) { const a2 = hash(i, 9, 2) * TAU, d = 4 + r * 22, cx = ex + Math.cos(a2) * d, cy = ey - 10 + Math.sin(a2) * d * 0.6 + r * r * 12; ctx.beginPath(); ctx.moveTo(cx - 1, cy); ctx.lineTo(cx + 1, cy + 0.6); ctx.lineWidth = 2; ctx.strokeStyle = P.navy; ctx.stroke(); ctx.lineWidth = 1.3; ctx.strokeStyle = P.eraser; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    // measurement callout above the hit creature
    const nyy = foes[1][1] - 30 - k * 8;
    text(ctx, '17', foes[1][0] + 3, nyy, 5.4, P.ink, 0.8, 'center');
    ctx.beginPath(); ctx.moveTo(foes[1][0] - 3, nyy + 1.6); ctx.lineTo(foes[1][0] + 9, nyy + 1.6); ctx.moveTo(foes[1][0] - 3, nyy + 1.6); ctx.lineTo(foes[1][0] - 6, nyy + 5.2); ctx.lineWidth = 0.6; ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  const Starter = { id: 'blueprint', name: 'Blueprint', palette: PALETTE, fonts: ['Share Tech Mono', 'Architects Daughter'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['blueprint'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
