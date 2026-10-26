/* Art Deco Gold — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   One language everywhere: onyx, emerald and midnight surfaces + metallic gold (banded gradient fill
   and a dark / mid / bright bevel stroke), ivory accents, strict geometry (sunbursts, stepped corners,
   chevrons, fan scallops). Figures are baked once into sprites with an ink outline and a thin gilded rim. */
(function (root) {
  'use strict';
  const PALETTE = {
    onyx: '#0d0e12', onyx2: '#1b1c23', night: '#0f1a33', night2: '#1a2b52', emerald: '#0e4a40', emerald2: '#14695a',
    jade: '#2a9c84', jadeHi: '#6fd1b6', ivory: '#f2e8d0', ivory2: '#d8c9a3', pearl: '#fffaf0', skin: '#ecd0a4',
    goldDark: '#5a3d10', gold: '#b8862f', goldLight: '#e6c15a', goldHi: '#fff0b8', goldLine: '#c99a3c',
    ruby: '#b8323f', lapis: '#3460c0', bronze: '#3a332a', water: '#123a57', terrazzo: '#18233f', ink: '#07080b',
  };
  const P = PALETTE, TAU = Math.PI * 2, PI = Math.PI;
  const GSTOPS = [[0, '#fff0b8'], [0.18, '#e9bf5c'], [0.42, '#9a6c22'], [0.56, '#c8973a'], [0.78, '#f5d98a'], [1, '#7d561a']];
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.ceil(w)), height: Math.max(1, Math.ceil(h)) });

  /* ---------------- gold + geometry helpers ---------------- */
  function gold(c, x0, y0, x1, y1) { const g = c.createLinearGradient(x0, y0, x1, y1); for (const s of GSTOPS) g.addColorStop(s[0], s[1]); return g; }
  function lin(c, x0, y0, x1, y1, cols) { const g = c.createLinearGradient(x0, y0, x1, y1); cols.forEach((s, i) => g.addColorStop(i / (cols.length - 1), s)); return g; }
  function poly(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  function fillPoly(c, pts, f) { c.beginPath(); poly(c, pts); c.fillStyle = f; c.fill(); }
  /** Bevelled gold line on the current path: dark edge, mid gold, thin bright highlight. */
  function gl(c, w) { c.strokeStyle = P.goldDark; c.lineWidth = w * 1.55; c.stroke(); c.strokeStyle = P.gold; c.lineWidth = w; c.stroke(); c.strokeStyle = P.goldHi; c.lineWidth = w * 0.34; c.stroke(); }
  function pin(c, w, col) { c.strokeStyle = col || P.goldLine; c.lineWidth = w; c.stroke(); }
  /** Metallic ring: a radial gradient across the ring width. */
  function ringG(c, x, y, r, w) {
    const g = c.createRadialGradient(x, y, r - w / 2, x, y, r + w / 2);
    [[0, P.goldDark], [0.3, '#f5d98a'], [0.5, P.goldHi], [0.72, '#c8973a'], [1, P.goldDark]].forEach((s) => g.addColorStop(s[0], s[1]));
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = w; c.strokeStyle = g; c.stroke();
  }
  /** Rectangle with notched two-step (ziggurat) corners. */
  function stepRect(c, x0, y0, x1, y1, s) {
    const d = 2 * s;
    poly(c, [[x0 + d, y0], [x1 - d, y0], [x1 - d, y0 + s], [x1 - s, y0 + s], [x1 - s, y0 + d], [x1, y0 + d], [x1, y1 - d], [x1 - s, y1 - d], [x1 - s, y1 - s], [x1 - d, y1 - s], [x1 - d, y1],
      [x0 + d, y1], [x0 + d, y1 - s], [x0 + s, y1 - s], [x0 + s, y1 - d], [x0, y1 - d], [x0, y0 + d], [x0 + s, y0 + d], [x0 + s, y0 + s], [x0 + d, y0 + s]]);
  }
  function star(c, x, y, n, ro, ri, rot) { const pts = []; for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU, r = i & 1 ? ri : ro; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } poly(c, pts); }
  function limb(c, ax, ay, bx, by, w0, w1) { const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; poly(c, [[ax + nx * w0, ay + ny * w0], [bx + nx * w1, by + ny * w1], [bx - nx * w1, by - ny * w1], [ax - nx * w0, ay - ny * w0]]); }

  /* ---------------- sprite baking: ink outline + gilded rim ---------------- */
  const K = 4;
  function bake(box, fn, ol, rim) {
    const w = (box[2] - box[0]) * K, h = (box[3] - box[1]) * K;
    const a = canvas(w, h), ac = a.getContext('2d');
    ac.scale(K, K); ac.translate(-box[0], -box[1]); ac.lineJoin = 'miter'; ac.miterLimit = 3; fn(ac);
    const tint = (col) => { const t = canvas(w, h), tc = t.getContext('2d'); tc.drawImage(a, 0, 0); tc.globalCompositeOperation = 'source-in'; tc.fillStyle = col; tc.fillRect(0, 0, w, h); return t; };
    const out = canvas(w, h), oc = out.getContext('2d');
    const ring = (img, r, n) => { for (let i = 0; i < n; i++) { const an = (i / n) * TAU; oc.drawImage(img, Math.cos(an) * r, Math.sin(an) * r); } };
    if (rim) ring(tint('#c9973a'), (ol + rim) * K, 16);
    ring(tint(P.ink), ol * K, 12);
    oc.drawImage(a, 0, 0);
    return { c: out, ox: -box[0] * K, oy: -box[1] * K };
  }
  function blit(ctx, s, x, y, sc, flip, rot) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale((flip ? -1 : 1) * sc / K, sc / K);
    ctx.drawImage(s.c, -s.ox, -s.oy); ctx.restore();
  }

  /* ---------------- main character: dapper gentleman (feet at 0,0, ~40 units tall) ---------------- */
  function gentleman(c, ph, moving) {
    const s = moving ? Math.sin(ph) : 0, co = Math.cos(ph);
    const F = moving ? { lf: s * 0.44, lb: -s * 0.44, af: -s * 0.36, ab: s * 0.36, cane: 0.3 - s * 0.2, uf: Math.max(0, co) * 1.5, ub: Math.max(0, -co) * 1.5 } : { lf: 0.07, lb: -0.07, af: -0.05, ab: 0.1, cane: 0.32, uf: 0, ub: 0 };
    c.scale(1.1, 1);
    const leg = (a, back, lift) => {
      const ax = Math.sin(a) * 10.6, ay = -12.2 + Math.cos(a) * 10.6 - lift;
      c.beginPath(); limb(c, 0, -12.2, ax, ay, 1.85, 1.3); c.fillStyle = back ? '#0a0b0e' : lin(c, -2, 0, 2, 0, ['#26272f', '#121318', '#0b0c10']); c.fill();
      const fx = ax, fy = ay + 1.6;
      fillPoly(c, [[fx - 1.7, fy - 1.1], [fx + 1.1, fy - 1.4], [fx + 3.5, fy - 0.3], [fx + 3.5, fy + 0.5], [fx - 1.7, fy + 0.5]], back ? '#040405' : '#0e0f13');
      fillPoly(c, [[fx - 1.5, fy - 2.1], [fx + 1.2, fy - 2.1], [fx + 1.7, fy - 1.0], [fx - 1.5, fy - 0.8]], back ? '#a89a78' : P.ivory);
    };
    const arm = (sx, a, back, cane) => {
      const ex = sx + Math.sin(a) * 8.4, ey = -22 + Math.cos(a) * 8.4, hx = ex + Math.sin(a) * 1.1, hy = ey + Math.cos(a) * 1.1;
      if (cane !== undefined) {
        c.beginPath(); c.moveTo(hx - Math.sin(cane) * 1.8, hy - Math.cos(cane) * 1.8); c.lineTo(hx + Math.sin(cane) * 12.2, hy + Math.cos(cane) * 12.2); c.strokeStyle = '#0a0a0d'; c.lineWidth = 0.95; c.stroke();
        c.beginPath(); c.arc(hx - Math.sin(cane) * 2.1, hy - Math.cos(cane) * 2.1, 1, 0, TAU); c.fillStyle = gold(c, hx - 1, hy - 3, hx + 1, hy - 1); c.fill();
      }
      c.beginPath(); limb(c, sx, -22, ex, ey, 1.5, 1.15); c.fillStyle = back ? '#b7a883' : lin(c, sx - 2, -22, sx + 2, ey, [P.pearl, '#e6d9b8', '#cbb98f']); c.fill();
      c.beginPath(); c.arc(hx, hy, 1.25, 0, TAU); c.fillStyle = back ? '#cfc5b0' : '#fdf9f0'; c.fill();
    };
    arm(-4.6, F.ab, true); leg(F.lb, true, F.ub); leg(F.lf, false, F.uf);
    fillPoly(c, [[-5.9, -23.6], [5.9, -23.6], [5.3, -20.5], [3.9, -15.4], [4.7, -11.3], [1.2, -10.2], [0.2, -12.7], [-0.8, -10.2], [-4.7, -11], [-3.9, -15.4], [-5.3, -20.5]], lin(c, -6, -24, 5, -10, [P.pearl, '#f1e6cb', '#cdbb93']));
    c.beginPath(); c.moveTo(-4.7, -11); c.lineTo(-0.8, -10.2); c.lineTo(0.2, -12.7); c.lineTo(1.2, -10.2); c.lineTo(4.7, -11.3); pin(c, 0.5, P.gold);
    fillPoly(c, [[-1.1, -23.6], [1.1, -23.6], [0.1, -16.8]], '#fffdf7');
    fillPoly(c, [[-3.5, -23.6], [-1.1, -23.6], [0.1, -16.6], [-2.3, -19.8]], '#121318'); fillPoly(c, [[1.1, -23.6], [3.5, -23.6], [2.5, -19.8], [0.1, -16.6]], '#121318');
    fillPoly(c, [[-0.3, -22.6], [-2.3, -23.6], [-2.3, -21.6]], '#0b0c0f'); fillPoly(c, [[0.3, -22.6], [2.3, -23.6], [2.3, -21.6]], '#0b0c0f');
    c.beginPath(); c.arc(0.15, -15.3, 0.45, 0, TAU); c.arc(0.15, -13.7, 0.45, 0, TAU); c.fillStyle = P.goldLight; c.fill();
    c.beginPath(); c.moveTo(3.6, -20.4); c.arc(3.6, -20.4, 1.6, PI, TAU); c.closePath(); c.fillStyle = gold(c, 3.6, -22, 3.6, -20.4); c.fill();
    fillPoly(c, [[-3.1, -31], [2.6, -31], [3.8, -29.3], [4.2, -27.8], [3.4, -27.3], [3.7, -26.3], [2.6, -24.9], [-0.6, -24.6], [-2.6, -25.8], [-3.4, -28.4]], lin(c, -3, -31, 4, -25, ['#f6dfba', P.skin, '#c39b6c']));
    fillPoly(c, [[-3.7, -31.2], [2.3, -31.2], [1.4, -29.9], [-1, -29.8], [-2, -27], [-3.6, -27.5]], '#0c0d10');
    c.lineCap = 'round'; c.strokeStyle = P.ink;
    c.beginPath(); c.moveTo(1.7, -28.6); c.lineTo(2.9, -28.5); c.lineWidth = 0.6; c.stroke();
    c.beginPath(); c.moveTo(2.3, -26.4); c.lineTo(3.7, -26.1); c.lineWidth = 0.5; c.stroke(); c.lineCap = 'butt';
    fillPoly(c, [[-3.4, -31.6], [4, -31.6], [4.5, -39.8], [-3.8, -39.8]], lin(c, -4, 0, 4.5, 0, ['#2a2b33', '#0c0d11', '#1a1b21']));
    fillPoly(c, [[-4.9, -30.6], [5.7, -30.6], [5.4, -32], [-4.6, -32]], '#0b0c0f');
    fillPoly(c, [[-3.45, -33.5], [4.1, -33.5], [4.02, -32], [-3.42, -32]], gold(c, 0, -33.5, 0, -32));
    arm(4.4, F.af, false, F.cane);
  }
  /* ---------------- small creature: enamel scarab with a gold sun disc ---------------- */
  function scarab(c, f, v) {
    const E = [['#6fd8b8', '#1f9a80', '#0a4a40'], ['#86a8f2', '#3460c0', '#15296a'], ['#5a5d6b', '#1f2129', '#060709']][v];
    const st = [0, 1, 0, -1][f];
    c.lineCap = 'round';
    for (const far of [true, false]) {
      c.beginPath();
      [-4.8, -0.4, 3.8].forEach((bx0, i) => {
        const dir = [-1, 0.25, 1][i], ph = (i === 1 ? -st : st) * (far ? -1 : 1), bx = bx0 + (far ? 1 : 0), by = far ? -6 : -4.4;
        c.moveTo(bx, by); c.lineTo(bx + dir * 3 + ph * 0.9, by - 1.8); c.lineTo(bx + dir * 4.6 + ph * 1.5, (far ? -1.2 : 0) - Math.max(0, ph));
      });
      c.strokeStyle = far ? '#030304' : '#1d1e25'; c.lineWidth = far ? 0.9 : 1.15; c.stroke();
      if (!far) { c.strokeStyle = 'rgba(230,193,90,.9)'; c.lineWidth = 0.38; c.stroke(); }
    }
    c.lineCap = 'butt';
    const shell = (k) => { k.ellipse(-1.4, -6.2, 8.4, 6.4, 0, PI, 0); k.ellipse(-1.4, -6.2, 8.4, 2.3, 0, 0, PI); k.closePath(); };
    c.beginPath(); shell(c); c.fillStyle = lin(c, -7, -12.5, 4, -3, E); c.fill();
    c.save(); c.beginPath(); shell(c); c.clip(); c.beginPath();
    for (let k = 0; k < 9; k++) { const a = PI * 0.86 + (k / 8) * PI * 0.42; c.moveTo(5 + Math.cos(a) * 3.2, -9 + Math.sin(a) * 3.2); c.lineTo(5 + Math.cos(a) * 16, -9 + Math.sin(a) * 16); }
    pin(c, 0.32, 'rgba(240,205,120,.6)'); c.restore();
    c.beginPath(); c.moveTo(5, -10.4); c.quadraticCurveTo(-1.2, -11.8, -9.5, -6.9); pin(c, 0.6, P.gold);
    c.beginPath(); shell(c); gl(c, 0.6);
    c.beginPath(); c.ellipse(6, -7, 3.3, 3.1, 0, 0, TAU); c.fillStyle = '#101116'; c.fill(); gl(c, 0.42);
    c.beginPath(); c.ellipse(8.9, -5.6, 2, 1.6, 0, 0, TAU); c.fillStyle = '#0b0c10'; c.fill();
    c.beginPath(); c.arc(10.9, -9, 1.9, 0, TAU); c.fillStyle = gold(c, 9, -11, 12.8, -7); c.fill();
    c.beginPath(); c.arc(9.6, -5.9, 0.55, 0, TAU); c.fillStyle = '#fff6dc'; c.fill();
  }
  /* ---------------- fast creature: swift seen from above (body centre at 0,0) ---------------- */
  function swift(c, sp) {
    for (const sg of [-1, 1]) {
      const tx = -7.5 + (1 - sp) * 3, ty = sg * 14 * sp;
      const w = (k) => { k.moveTo(3.4, sg * 1.2); k.quadraticCurveTo(1.5, sg * (1.5 + 9 * sp), tx, ty); k.quadraticCurveTo(-2.6, sg * (1.5 + 5.5 * sp), -3.4, sg * 1.4); k.closePath(); };
      c.beginPath(); w(c); c.fillStyle = lin(c, 0, 0, tx, ty, [P.pearl, '#efe4c8', '#c9b98f']); c.fill();
      c.save(); c.beginPath(); w(c); c.clip();
      for (let k = 0; k < 3; k++) { const t = 0.34 + k * 0.2, mx = 3.4 + (tx - 3.4) * t, my = sg * 1.2 + (ty - sg * 1.2) * t; c.beginPath(); c.moveTo(mx + 2, my - sg * 3); c.lineTo(mx - 1.6, my); c.lineTo(mx + 2, my + sg * 3); pin(c, k === 1 ? 0.7 : 1.3, k === 1 ? P.gold : P.jade); }
      c.restore();
      c.beginPath(); c.moveTo(3.4, sg * 1.2); c.quadraticCurveTo(1.5, sg * (1.5 + 9 * sp), tx, ty); pin(c, 0.7, P.gold);
      fillPoly(c, [[-7.6, sg * 0.7], [-14.2, sg * 3.6], [-11.4, sg * 0.2]], gold(c, -14, 0, -8, sg * 3.6));
    }
    c.beginPath(); c.moveTo(9.2, 0); c.bezierCurveTo(7.5, -2.6, 0, -2.8, -8.6, -0.8); c.lineTo(-8.6, 0.8); c.bezierCurveTo(0, 2.8, 7.5, 2.6, 9.2, 0); c.closePath();
    c.fillStyle = lin(c, 0, -2.6, 0, 2.6, [P.jadeHi, P.jade, '#0f5548']); c.fill();
    c.beginPath(); c.ellipse(7.2, 0, 2.2, 2, 0, 0, TAU); c.fillStyle = P.night2; c.fill();
    fillPoly(c, [[8.6, -0.9], [12.4, 0], [8.6, 0.9]], gold(c, 8.6, -1, 8.6, 1));
  }
  /* ---------------- props ---------------- */
  function lamp(c) {
    c.fillStyle = '#15161c'; c.fillRect(-6, -3, 12, 3); c.fillRect(-4.4, -6.4, 8.8, 3.4); c.fillStyle = gold(c, 0, -3.3, 0, -2.5); c.fillRect(-6, -3.3, 12, 0.8);
    c.fillStyle = lin(c, -1.7, 0, 1.7, 0, ['#0b0c10', '#3a3c46', '#07080b']); c.fillRect(-1.7, -45, 3.4, 38.6);
    for (const y of [-11, -24, -42]) { c.fillStyle = gold(c, 0, y - 0.6, 0, y + 0.6); c.fillRect(-2.3, y - 0.6, 4.6, 1.2); }
    for (const t of [[-5, -50.6, 10, 4.2], [-3.8, -54.2, 7.6, 3.6], [-2.6, -57.4, 5.2, 3.2]]) { c.fillStyle = lin(c, 0, t[1], 0, t[1] + t[3], ['#fffbe8', '#ffe9a6', '#f0c766']); c.fillRect(t[0], t[1], t[2], t[3]); c.beginPath(); c.moveTo(t[0], t[1]); c.lineTo(t[0] + t[2], t[1]); pin(c, 0.7, P.gold); }
    c.fillStyle = gold(c, 0, -46.4, 0, -45); c.fillRect(-5.6, -46.4, 11.2, 1.4);
    fillPoly(c, [[-1.6, -57.4], [1.6, -57.4], [0, -63.5]], gold(c, -1.6, -63, 1.6, -57));
  }
  function fanUrn(c) {
    for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(0, -14.5); c.arc(0, -14.5, 15, PI + (k / 9) * PI, PI + ((k + 1) / 9) * PI); c.closePath(); c.fillStyle = k & 1 ? P.emerald2 : P.jade; c.fill(); }
    c.beginPath(); c.arc(0, -14.5, 15, PI, TAU); gl(c, 0.6);
    fillPoly(c, [[-7, -14.6], [7, -14.6], [4.4, -4], [2.4, -3], [-2.4, -3], [-4.4, -4]], lin(c, -7, 0, 7, 0, ['#2b2d36', '#0b0c10', '#060709']));
    c.beginPath(); for (let k = 0; k < 3; k++) { const y = -12 + k * 2.4; c.moveTo(-5.4 + k * 0.7, y); c.lineTo(0, y + 2.2); c.lineTo(5.4 - k * 0.7, y); } pin(c, 0.38, P.goldLight);
    c.fillStyle = gold(c, 0, -15.4, 0, -14); c.fillRect(-7.6, -15.4, 15.2, 1.3);
  }
  /* ---------------- effects ---------------- */
  function sunDisc(c) {
    c.beginPath(); for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, r = k & 1 ? 6.6 : 8.6; c.moveTo(Math.cos(a - 0.18) * 4.2, Math.sin(a - 0.18) * 4.2); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a + 0.18) * 4.2, Math.sin(a + 0.18) * 4.2); }
    c.fillStyle = gold(c, -8, -8, 8, 8); c.fill();
    c.beginPath(); c.arc(0, 0, 4.4, 0, TAU); c.fillStyle = gold(c, -4, -4, 4, 4); c.fill();
    c.beginPath(); c.arc(0, 0, 2.5, 0, TAU); c.fillStyle = '#fff3c8'; c.fill();
  }
  function emerald(c) {
    const o = (s) => [[-2.3 * s, -4.4 * s], [2.3 * s, -4.4 * s], [3.4 * s, -3.2 * s], [3.4 * s, 3.2 * s], [2.3 * s, 4.4 * s], [-2.3 * s, 4.4 * s], [-3.4 * s, 3.2 * s], [-3.4 * s, -3.2 * s]];
    fillPoly(c, o(1), lin(c, -3, -4, 3, 4, ['#7ee6c6', '#1f9a80', '#07463b'])); fillPoly(c, o(0.62), lin(c, 3, -3, -3, 3, ['#9cf0d6', '#2fb294', '#0d5b4c'])); fillPoly(c, o(0.32), '#d8fff0');
    c.beginPath(); poly(c, o(1.02)); gl(c, 0.5);
  }

  /* ---------------- the grand floor: 200-unit marble bays between terrazzo promenades ---------------- */
  const BAY = 200, WALK = 14;
  function veins(c, x0, y0, x1, y1, seed, col) {
    const r = rng(seed); c.beginPath();
    for (let i = 0; i < 7; i++) { let x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); c.moveTo(x, y); for (let k = 0; k < 4; k++) { const nx = x + (r() - 0.3) * 60, ny = y + (r() - 0.5) * 40; c.quadraticCurveTo((x + nx) / 2 + (r() - 0.5) * 20, (y + ny) / 2 + (r() - 0.5) * 20, nx, ny); x = nx; y = ny; } }
    c.strokeStyle = col; c.lineWidth = 0.5; c.stroke();
  }
  function frame(c, x0, y0, x1, y1) {
    c.beginPath(); stepRect(c, x0, y0, x1, y1, 7); c.fillStyle = P.onyx; c.fill();
    c.beginPath(); stepRect(c, x0 + 2.4, y0 + 2.4, x1 - 2.4, y1 - 2.4, 6.4); gl(c, 1.25);
    c.beginPath(); stepRect(c, x0 + 7, y0 + 7, x1 - 7, y1 - 7, 5); pin(c, 0.45);
    return [x0 + 9.5, y0 + 9.5, x1 - 9.5, y1 - 9.5];
  }
  function medallion(c, bx, by, seed) {
    const f = frame(c, bx + WALK, by + WALK, bx + BAY - WALK, by + BAY - WALK), cx = bx + BAY / 2, cy = by + BAY / 2, R = 58;
    veins(c, f[0], f[1], f[2], f[3], seed, 'rgba(110,101,83,.5)');
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fillStyle = '#101116'; c.fill();
    c.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU - PI / 2; c.moveTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15); c.arc(cx, cy, R, a - 0.105, a + 0.105); c.closePath(); }
    c.fillStyle = P.emerald2; c.fill(); pin(c, 0.45);
    c.beginPath(); for (let k = 0; k < 16; k++) { const a = ((k + 0.5) / 16) * TAU - PI / 2; c.moveTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); c.lineTo(cx + Math.cos(a) * (R - 5), cy + Math.sin(a) * (R - 5)); } pin(c, 0.55, P.goldLight);
    ringG(c, cx, cy, R, 3.4);
    c.beginPath(); for (let k = 0; k < 32; k++) { const a = (k / 32) * TAU, x = cx + Math.cos(a) * (R + 5.6), y = cy + Math.sin(a) * (R + 5.6); c.moveTo(x + 1, y); c.arc(x, y, 1, 0, TAU); } c.fillStyle = P.goldLight; c.fill();
    c.beginPath(); c.arc(cx, cy, 14, 0, TAU); c.fillStyle = P.ivory; c.fill(); ringG(c, cx, cy, 14, 2.4);
    c.beginPath(); star(c, cx, cy, 8, 11.5, 4.4, -PI / 2); c.fillStyle = gold(c, cx - 8, cy - 11, cx + 8, cy + 11); c.fill();
  }
  function harlequin(c, bx, by) {
    const f = frame(c, bx + WALK, by + WALK, bx + BAY - WALK, by + BAY - WALK), d = 12;
    c.save(); c.beginPath(); stepRect(c, f[0], f[1], f[2], f[3], 4.5); c.clip();
    c.fillStyle = P.emerald; c.fillRect(f[0], f[1], f[2] - f[0], f[3] - f[1]);
    c.beginPath(); for (let b = -1; b <= 17; b += 2) for (let a = -1; a <= 9; a++) { const x = bx + (2 * a + (b & 1)) * d, y = by + b * d - d; poly(c, [[x, y - d], [x + d, y], [x, y + d], [x - d, y]]); }
    c.fillStyle = '#101116'; c.fill();
    c.beginPath(); for (let k = -20; k <= 20; k++) { const s = d * 2 * k; c.moveTo(bx - 10, by + s + 10); c.lineTo(bx + BAY + 10, by + s - BAY - 10); c.moveTo(bx - 10, by - s - 10); c.lineTo(bx + BAY + 10, by - s + BAY + 10); } pin(c, 0.5);
    c.restore();
  }
  function scallop(c, bx, by) {
    const f = frame(c, bx + WALK, by + WALK, bx + BAY - WALK, by + BAY - WALK), r = 12;
    c.save(); c.beginPath(); stepRect(c, f[0], f[1], f[2], f[3], 4.5); c.clip();
    for (let row = 0; row < 20; row++) for (let a = -1; a < 10; a++) {
      const x = bx + (row & 1 ? r : 0) + a * 2 * r, y = by + row * r * 0.92;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = lin(c, x, y - r, x, y + r * 0.2, row & 1 ? ['#2a9c84', '#125447', '#0a2e2a'] : ['#3a5a9e', '#172a52', '#0b1428']); c.fill();
      c.beginPath(); c.arc(x, y, r * 0.3, PI, TAU); c.closePath(); c.fillStyle = 'rgba(230,193,90,.85)'; c.fill();
      c.beginPath(); c.arc(x, y, r - 0.3, PI, TAU); pin(c, 0.7, P.gold);
    }
    c.restore();
  }
  function promenades(c, x0, y0, x1, y1) {
    const r = rng(53);
    for (let x = Math.ceil(x0 / BAY) * BAY; x <= x1 + WALK; x += BAY) { c.fillStyle = P.terrazzo; c.fillRect(x - WALK, y0, WALK * 2, y1 - y0); }
    for (let y = Math.ceil(y0 / BAY) * BAY; y <= y1 + WALK; y += BAY) { c.fillStyle = P.terrazzo; c.fillRect(x0, y - WALK, x1 - x0, WALK * 2); }
    for (let i = 0; i < (x1 - x0) * (y1 - y0) / 90; i++) {
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), lx = ((x % BAY) + BAY) % BAY, ly = ((y % BAY) + BAY) % BAY;
      if ((lx > WALK && lx < BAY - WALK) && (ly > WALK && ly < BAY - WALK)) continue;
      c.fillStyle = ['#d9ccaa', '#c4953e', '#2c7d6a', '#0b1020', '#33467a'][(r() * 5) | 0]; c.fillRect(x, y, 0.6 + r() * 1.4, 0.6 + r() * 1.2);
    }
    c.beginPath();
    for (let x = Math.ceil(x0 / BAY) * BAY; x <= x1 + WALK; x += BAY) for (const o of [-12.4, 12.4]) { c.moveTo(x + o, y0); c.lineTo(x + o, y1); }
    for (let y = Math.ceil(y0 / BAY) * BAY; y <= y1 + WALK; y += BAY) for (const o of [-12.4, 12.4]) { c.moveTo(x0, y + o); c.lineTo(x1, y + o); }
    gl(c, 1.1);
    for (let x = Math.ceil(x0 / BAY) * BAY; x <= x1 + WALK; x += BAY) for (let y = Math.ceil(y0 / BAY) * BAY; y <= y1 + WALK; y += BAY) {
      c.fillStyle = P.terrazzo; c.fillRect(x - WALK, y - WALK, WALK * 2, WALK * 2);
      c.beginPath(); c.rect(x - 12.4, y - 12.4, 24.8, 24.8); gl(c, 1.1);
      c.beginPath(); c.arc(x, y, 10.4, 0, TAU); c.fillStyle = P.onyx; c.fill(); ringG(c, x, y, 10.4, 1.8);
      c.beginPath(); star(c, x, y, 8, 9.2, 3, -PI / 2); c.fillStyle = gold(c, x - 8, y - 9, x + 8, y + 9); c.fill();
    }
  }
  let floor = null, floorKey = '';
  function floorCanvas(w, h, s, ox, oy) {
    const key = w + 'x' + h;
    if (floor && floorKey === key) return floor;
    floorKey = key; floor = canvas(w, h);
    const c = floor.getContext('2d'); c.setTransform(s, 0, 0, s, ox * s, oy * s);
    const W = w / s, H = h / s, x0 = -ox, y0 = -oy, x1 = x0 + W, y1 = y0 + H;
    c.fillStyle = P.onyx; c.fillRect(x0, y0, W, H);
    for (let j = Math.floor(y0 / BAY); j * BAY < y1; j++) for (let i = Math.floor(x0 / BAY); i * BAY < x1; i++) {
      const t = ((i * 7 + j * 3) % 3 + 3) % 3;
      c.save(); c.beginPath(); c.rect(i * BAY, j * BAY, BAY, BAY); c.clip();
      if (t === 0) medallion(c, i * BAY, j * BAY, i * 31 + j); else if (t === 1) harlequin(c, i * BAY, j * BAY); else scallop(c, i * BAY, j * BAY);
      c.fillStyle = 'rgba(4,5,9,.3)'; c.fillRect(i * BAY, j * BAY, BAY, BAY);
      c.restore();
    }
    promenades(c, x0, y0, x1, y1);
    // vignette + warm light from above
    c.setTransform(1, 0, 0, 1, 0, 0);
    const v = c.createRadialGradient(w / 2, h * 0.48, Math.max(w, h) * 0.22, w / 2, h * 0.48, Math.max(w, h) * 0.72);
    v.addColorStop(0, 'rgba(4,5,9,0)'); v.addColorStop(1, 'rgba(4,5,9,.66)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
    const tl = c.createRadialGradient(w / 2, -h * 0.15, 0, w / 2, -h * 0.15, h * 1.15); tl.addColorStop(0, 'rgba(255,214,140,.13)'); tl.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = tl; c.fillRect(0, 0, w, h);
    return floor;
  }

  /* ---------------- public drawers + preview scene ---------------- */
  let SP = null;
  function sprites() {
    if (SP) return SP;
    SP = {
      gent: [0, 1, 2, 3, 4, 5].map((f) => bake([-13, -42, 15, 2.5], (c) => gentleman(c, (f / 6) * TAU, true), 0.6, 0.42)),
      idle: bake([-13, -42, 15, 2.5], (c) => gentleman(c, 0, false), 0.6, 0.42),
      scarab: [0, 1, 2].map((v) => [0, 1, 2, 3].map((f) => bake([-14, -16, 16, 2], (c) => { c.scale(1.3, 1.3); scarab(c, f, v); }, 0.5, 0.42))),
      swift: [1, 0.72, 0.38, 0.72].map((sp) => bake([-18, -18, 16, 18], (c) => { c.scale(1.12, 1.12); swift(c, sp); }, 0.5, 0.42)),
      lamp: bake([-8, -66, 8, 2], lamp, 0.6), urn: bake([-17, -32, 17, 2], fanUrn, 0.6),
      sun: bake([-10, -10, 10, 10], sunDisc, 0.5), gem: bake([-5, -6, 5, 6], emerald, 0.5),
    };
    return SP;
  }
  function shadow(ctx, x, y, rx, ry) { ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore(); }
  function drawHero(ctx, x, y, t, facing, moving) {
    const S = sprites(), ph = t * 1.64;
    shadow(ctx, x, y, 8.2, 2.8);
    if (moving === false) blit(ctx, S.idle, x, y, 1, facing < 0);
    else blit(ctx, S.gent[((Math.floor(ph * 6) % 6) + 6) % 6], x, y - Math.abs(Math.sin(ph * TAU)) * 0.9, 1, facing < 0);
  }
  function drawEnemy(ctx, x, y, t, variant) {
    const S = sprites(); shadow(ctx, x, y, 12.5, 3.9);
    blit(ctx, S.scarab[(variant || 0) % 3][Math.floor(t * 8) & 3], x, y - Math.abs(Math.sin(t * 8 * PI / 2)) * 0.5, 1, false);
  }
  function drawSwift(ctx, x, y, t, angle) {
    const S = sprites(); shadow(ctx, x, y, 7.5, 2.5);
    blit(ctx, S.swift[Math.floor(t * 12) & 3], x, y - 13, 1, false, angle || 0);
  }
  function draw(ctx, w, h, t) {
    const s = h / 360, W = w / s, ox = W / 2 - 100, oy = 180 - 100;
    ctx.save();
    ctx.drawImage(floorCanvas(w, h, s, ox, oy), 0, 0);
    ctx.setTransform(s, 0, 0, s, ox * s, oy * s);
    const S = sprites(), hx = 100 + Math.sin(t * 0.5) * 40, hy = 112;
    const list = [];
    for (const [x, y] of [[-14 + 4, 19 + 4], [214, 23], [-14, 223], [214, 223]]) list.push({ y, f: () => { shadow(ctx, x, y, 8, 2.8); blit(ctx, S.lamp, x, y, 1, false); } });
    list.push({ y: 160, f: () => { shadow(ctx, 40, 160, 8, 3); blit(ctx, S.urn, 40, 160, 1, false); } });
    list.push({ y: hy, f: () => drawHero(ctx, hx, hy, t, Math.cos(t * 0.5) >= 0 ? 1 : -1, true) });
    [[hx + 90, 160, 0], [hx - 95, 70, 1], [hx + 150, 40, 2], [hx - 150, 190, 0], [hx + 30, 230, 1]].forEach(([x, y, v], i) => list.push({ y, f: () => drawEnemy(ctx, x + Math.sin(t + i) * 6, y, t + i * 0.3, v) }));
    [[hx - 60, 200], [hx + 120, 95]].forEach(([x, y], i) => list.push({ y, f: () => drawSwift(ctx, x + ((t * 40 + i * 50) % 80) - 40, y, t + i * 0.2, PI * i) }));
    list.sort((a, b) => a.y - b.y);
    for (const [x, y] of [[hx + 40, 140], [hx - 50, 150], [hx + 70, 80]]) { shadow(ctx, x, y, 3.8, 1.4); blit(ctx, S.gem, x, y - 3 - Math.sin(t * 4 + x) * 1.1, 0.72, false); }
    for (const o of list) o.f();
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y] of [[-10, -32], [218, -28], [-10, 172], [218, 176]]) { const g = ctx.createRadialGradient(x, y, 0, x, y, 26); g.addColorStop(0, 'rgba(255,224,140,.45)'); g.addColorStop(1, 'rgba(255,180,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 26, y - 26, 52, 52); }
    ctx.globalCompositeOperation = 'source-over';
    // orbiting sun discs, a gold dart with pin-line trail, a sunburst flash and gold leaf
    for (let i = 0; i < 2; i++) { const a = t * 2.4 + i * PI; blit(ctx, S.sun, hx + Math.cos(a) * 44, hy - 8 + Math.sin(a) * 37, 0.82, false, t * 2.2); }
    const dx = hx + 20 + ((t * 120) % 70), dy = hy - 14;
    ctx.beginPath(); for (const o of [-1.7, 0, 1.7]) { ctx.moveTo(dx - 4.5, dy + o); ctx.lineTo(dx - 15, dy + o * 1.25); } pin(ctx, 0.55, 'rgba(255,232,160,.7)');
    fillPoly(ctx, [[dx + 6.4, dy], [dx + 0.6, dy - 1.9], [dx - 4.6, dy - 1.1], [dx - 3.4, dy], [dx - 4.6, dy + 1.1], [dx + 0.6, dy + 1.9]], gold(ctx, 0, dy - 2, 0, dy + 2));
    const bx = hx + 90, by = 160 - 10, k = (t * 1.2) % 1;
    ctx.globalAlpha = 1 - k; ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; ctx.moveTo(bx + Math.cos(a) * 16 * (0.2 + 0.6 * k), by + Math.sin(a) * 16 * (0.2 + 0.6 * k)); ctx.lineTo(bx + Math.cos(a) * 16 * (0.45 + 0.55 * k) * (i & 1 ? 0.72 : 1), by + Math.sin(a) * 16 * (0.45 + 0.55 * k) * (i & 1 ? 0.72 : 1)); }
    pin(ctx, 1.2 * (1 - k) + 0.3, '#f5d98a');
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + 0.4, d = 4 + k * 22, fl = Math.cos(t * 10 + i * 2.1); ctx.save(); ctx.translate(bx + Math.cos(a) * d, by + Math.sin(a) * d * 0.6 + k * k * 14); ctx.rotate(i + t * 3); ctx.scale(0.15 + 0.85 * Math.abs(fl), 1); ctx.fillStyle = fl > 0 ? gold(ctx, -1.5, -1, 1.5, 1) : '#8a611d'; ctx.fillRect(-1.6, -0.9, 3.2, 1.8); ctx.restore(); }
    ctx.globalAlpha = 1;
    ctx.font = '11px "Limelight", Georgia, serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'miter'; ctx.strokeStyle = P.ink; ctx.lineWidth = 2.6;
    const ny = by - 20 - k * 10; ctx.strokeText('34', bx, ny); ctx.fillStyle = gold(ctx, 0, ny - 8, 0, ny + 2); ctx.fillText('34', bx, ny);
    // the screen frame: gold double pin-line with stepped corners
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const u = h / 360, m = 7 * u;
    ctx.globalAlpha = 0.75; ctx.beginPath(); stepRect(ctx, m, m, w - m, h - m, 6 * u); ctx.strokeStyle = '#d4a541'; ctx.lineWidth = u; ctx.stroke();
    ctx.beginPath(); stepRect(ctx, m + 4 * u, m + 4 * u, w - m - 4 * u, h - m - 4 * u, 4 * u); ctx.lineWidth = 0.45 * u; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.restore();
  }

  const Starter = { id: 'artdeco', name: 'Art Deco Gold', palette: PALETTE, fonts: ['Limelight', 'Poiret One', 'Josefin Sans:wght@300;400;600;700'],
    drawHero, drawEnemy, drawSwift, draw, gold, gl, ringG, stepRect, star, bake, blit };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['artdeco'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
