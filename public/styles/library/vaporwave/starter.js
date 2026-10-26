/* Vaporwave Sunset — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Core trick: every sprite is a solid, gradient-shaded drawing with a deep-indigo outline. It is baked ONCE into a
   canvas together with a soft pastel bloom (blurred tinted copy) and a VHS chroma fringe (pink copy 0.5 u left,
   cyan copy 0.5 u right, behind the art). Nothing is blurred or shifted per frame. */
(function (root) {
  'use strict';
  const PALETTE = {
    ink: '#2a1a4c', dusk: '#4b2a86', hot: '#ff5fc1', pink: '#ff9ad5', blush: '#ffd1ea', peach: '#ffc1a1',
    sun: '#fff27a', amber: '#ffb36b', lavender: '#b892ff', lilac: '#dccbff', violet: '#7a4fd0',
    mint: '#8ff5d2', teal: '#3fd8c8', cyan: '#5ee7ff', aqua: '#1fb2e0', marble: '#fff5fb', marbleShade: '#c9b0ee',
    skin: '#ffcfb0', skinShade: '#f2a58c', fringePink: '#ff3fae', fringeCyan: '#2fe0ff',
    roseMarble: '#ffdcee', checkA: '#fff0f8', checkB: '#cdb3f7', gridBase: '#6d49b8', terrazzo: '#c6f4e3', water: '#62dcf7', poolTile: '#2f63d8',
  };
  const P = PALETTE, TAU = Math.PI * 2, K = 4; // K = bake resolution, px per world unit
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  function hash(i, j, s) { let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function noise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s) { return (noise(x, y, s) * 2 + noise(x * 2.03, y * 2.03, s + 17)) / 3; }
  const grad = (c, x0, y0, x1, y1, st) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (let i = 0; i < st.length; i += 2) g.addColorStop(st[i], st[i + 1]); return g; };
  const poly = (c, p, close) => { c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); if (close) c.closePath(); };
  /** fill the current path, then outline it in ink */
  const fs = (c, fill, lw, col) => { if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.strokeStyle = col || P.ink; c.lineWidth = lw; c.stroke(); } };
  /** limb = the same polyline stroked twice: ink at w + 1.6, colour at w */
  const limb = (c, p, w, col) => { c.beginPath(); poly(c, p); c.strokeStyle = P.ink; c.lineWidth = w + 1.6; c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  const marbleGrad = (c, x0, y0, x1, y1) => grad(c, x0, y0, x1, y1, [0, '#ffffff', 0.38, '#f6ecfb', 0.78, '#dcc8f2', 1, '#c2a6ea']);
  function tint(src, col) { const c = mk(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }

  /* ---------- bake: sharp art + bloom + chroma fringe ---------- */
  function bake(l, t, r, b, draw, o) {
    o = o || {};
    const w = Math.ceil((l + r) * K), h = Math.ceil((t + b) * K);
    const full = mk(w, h), fx = full.getContext('2d');
    fx.lineCap = 'round'; fx.lineJoin = 'round'; fx.setTransform(K, 0, 0, K, l * K, t * K); draw(fx);
    const out = mk(w, h), x = out.getContext('2d');
    x.filter = 'blur(' + (o.blur || 2.2) * K + 'px)'; x.globalAlpha = o.bloomA || 0.55; x.drawImage(tint(full, o.bloom || P.hot), 0, 0); x.filter = 'none';
    x.globalAlpha = 0.8; x.drawImage(tint(full, P.fringePink), -0.5 * K, 0); x.drawImage(tint(full, P.fringeCyan), 0.5 * K, 0);
    x.globalAlpha = 1; x.drawImage(full, 0, 0);
    return { img: out, w: w / K, h: h / K, ax: l / (l + r), ay: t / (t + b) };
  }
  const blit = (ctx, s, x, y, sx, sy) => { const w = s.w * (sx || 1), h = s.h * (sy || 1); ctx.drawImage(s.img, x - s.ax * w, y - s.ay * h, w, h); };

  /* ---------- main character: wayfarer shades, cyan flattop, colour-block windbreaker ---------- */
  /** Two-bone IK: [jointX, jointY, endX, endY]; bend -1 = joint in front (knee), +1 = behind (elbow). */
  function ik(ax, ay, bx, by, l1, l2, bend) {
    let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-3;
    if (d > l1 + l2 - 0.02) { const k = (l1 + l2 - 0.02) / d; bx = ax + dx * k; by = ay + dy * k; dx *= k; dy *= k; d = l1 + l2 - 0.02; }
    const q = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - q * q));
    return [ax + (dx * q) / d - (dy / d) * h * bend, ay + (dy * q) / d + (dx / d) * h * bend, bx, by];
  }
  /** Walk pose ph 0..1: contact (0) – down (.125) – passing (.25) – up (.375); IK knees and elbows, the head lands late. */
  function heroPose(c, ph) {
    const a = ph * TAU, bob = 0.9 * Math.sin(2 * a), hipY = -9.2 + bob;
    const leg = (hx, fx, lift, back) => {
      const [kx, ky, ax, ay] = ik(hx, hipY, fx, -lift - 1.6, 4.1, 4.0, -1), fy = ay + 1.6;
      limb(c, [hx, hipY, kx, ky, ax, ay], 3.0, back ? '#33246e' : '#4a3699');
      c.beginPath(); c.roundRect(ax - 2, fy - 2.6, 5.4, 2.7, 1.2); fs(c, back ? '#e4d8ff' : '#ffffff', 0.7);
    };
    const arm = (sx, sw, back) => {
      const sy = -16.4 + bob, [ex, ey, hx, hy] = ik(sx, sy, sx + Math.sin(sw) * 5.9, sy + Math.cos(sw) * 5.9 - Math.max(0, Math.sin(sw)) * 0.8, 3, 3, 1);
      limb(c, [sx, sy, ex, ey, hx, hy], 2.7, back ? '#d84ca8' : P.hot);
      c.beginPath(); c.arc(hx, hy + 0.3, 1.3, 0, TAU); fs(c, back ? P.skinShade : P.skin, 0.6);
    };
    const s = Math.cos(a); // front arm swings against the front leg
    arm(-0.9, 0.75 * Math.cos(a), true);
    leg(-1.3, -0.9 - 3.7 * Math.cos(a), 2.1 * Math.max(0, Math.sin(a)), true);
    leg(1.3, 0.9 + 3.7 * Math.cos(a), 2.1 * Math.max(0, -Math.sin(a)), false);
    const torso = () => { c.beginPath(); c.moveTo(-4.5, -17.8 + bob); c.lineTo(4.7, -17.8 + bob); c.quadraticCurveTo(6.2, -13.2 + bob, 5.6, -8.4 + bob); c.lineTo(-5.1, -8.4 + bob); c.quadraticCurveTo(-6, -13.2 + bob, -4.5, -17.8 + bob); c.closePath(); };
    torso(); fs(c, grad(c, 0, -18 + bob, 0, -8 + bob, [0, '#ff9ae0', 1, '#ff4fb4']));
    c.save(); torso(); c.clip();
    c.beginPath(); poly(c, [-7, -11.4 + bob, 7, -16.8 + bob, 7, -13.4 + bob, -7, -8 + bob], true); c.fillStyle = P.cyan; c.fill();
    c.fillStyle = P.violet; c.fillRect(-7, -10.3 + bob, 14, 1.9); c.restore();
    torso(); fs(c, null, 0.85);
    const hx = 0.8, hy = -23.3 + bob;
    c.beginPath(); c.arc(hx, hy, 5.9, 0, TAU); fs(c, P.skin, 0.85);
    c.beginPath(); c.ellipse(hx - 4.1, hy + 0.5, 1.3, 1.8, 0, 0, TAU); fs(c, P.skinShade, 0.6);
    c.beginPath(); c.moveTo(hx - 4.6, hy + 1.6); c.quadraticCurveTo(hx - 6.6, hy - 2, hx - 6.1, hy - 7.6); c.quadraticCurveTo(hx - 5.9, hy - 10, hx - 3.8, hy - 10);
    c.lineTo(hx + 4.6, hy - 10.6); c.quadraticCurveTo(hx + 6.6, hy - 10.6, hx + 6.6, hy - 8.4); c.quadraticCurveTo(hx + 6.7, hy - 5.6, hx + 5.8, hy - 4.2);
    c.quadraticCurveTo(hx + 3.6, hy - 5.4, hx + 1.4, hy - 3.9); c.quadraticCurveTo(hx - 0.8, hy - 5, hx - 2.2, hy - 3.8); c.lineTo(hx - 2.6, hy - 0.2); c.closePath();
    fs(c, grad(c, 0, hy - 10.6, 0, hy + 1, [0, '#d4fcff', 0.3, P.cyan, 0.7, '#9a8cff', 1, P.violet]), 0.85);
    const gy = hy - 1.1; // wayfarers with a sunset reflection
    c.beginPath(); c.moveTo(hx - 0.8, gy - 1.3); c.lineTo(hx + 6.9, gy - 1.5); c.lineTo(hx + 6.6, gy + 1.2); c.quadraticCurveTo(hx + 5.2, gy + 2.3, hx + 4, gy + 1);
    c.lineTo(hx + 3.3, gy + 0.2); c.lineTo(hx + 2.6, gy + 1); c.quadraticCurveTo(hx + 0.9, gy + 2.3, hx - 0.6, gy + 0.9); c.closePath();
    fs(c, grad(c, 0, gy - 1.5, 0, gy + 2.2, [0, '#1d1040', 0.42, '#5b2a9a', 0.6, P.hot, 1, P.sun]), 0.6);
    c.beginPath(); c.moveTo(hx + 2.4, hy + 3.3); c.quadraticCurveTo(hx + 3.8, hy + 3.7, hx + 4.8, hy + 2.6); c.strokeStyle = P.ink; c.lineWidth = 0.5; c.stroke();
    arm(1.0, -s * 0.85, false);
  }
  /* ---------- small creature: hopping pyramid with one eye ---------- */
  function critterPose(c) {
    for (const fx of [-4.8, 3.4]) { c.beginPath(); c.ellipse(fx, -0.9, 2.1, 1.15, 0, 0, TAU); fs(c, P.violet, 0.6); }
    const A = [0.4, -18.2], BL = [-8.8, -2], BR = [4.4, -0.6], BB = [9.2, -4.6];
    c.beginPath(); poly(c, [...A, ...BR, ...BB], true); fs(c, grad(c, A[0], A[1], BB[0] + 2, BB[1], [0, '#d7c2ff', 0.5, P.lavender, 1, P.violet]));
    c.beginPath(); poly(c, [...A, ...BL, ...BR], true); fs(c, grad(c, 0, A[1], 0, -1, [0, '#fff0f8', 0.4, P.pink, 1, P.hot]));
    c.fillStyle = 'rgba(255,242,122,0.75)'; c.fillRect(-6.4, -5.2, 10.6, 1); c.fillRect(-7.6, -3.3, 12, 0.8);
    c.beginPath(); poly(c, [...A, ...BL, ...BR, ...BB], true); fs(c, null, 0.9);
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(BR[0], BR[1]); c.strokeStyle = P.ink; c.lineWidth = 0.6; c.stroke();
    c.beginPath(); c.ellipse(-1.5, -7.8, 3, 2.5, 0, 0, TAU); fs(c, '#ffffff', 0.65);
    c.beginPath(); c.arc(-0.7, -7.6, 1.55, 0, TAU); fs(c, P.cyan); c.beginPath(); c.arc(-0.6, -7.5, 0.72, 0, TAU); fs(c, P.ink);
  }
  /* ---------- fast creature: low-poly dolphin (flat facets, ink outline) ---------- */
  function dolphinPose(c, ph) {
    const ty = Math.sin(ph * TAU) * 2.3;
    const V = { tip: [13.6, -11], bt: [10.9, -12], bb: [11, -9.9], me: [10, -15.8], cr: [5.6, -18.4], d: [0.6, -18.2], fb: [-4.4, -16.8], bk: [-8.6, -15.2],
      st: [-12.8, -12.9 + ty * 0.55], ft: [-17.8, -16.8 + ty], fn: [-15.4, -12.8 + ty], fl: [-18, -8.8 + ty], un: [-12.2, -11 + ty * 0.55], be: [-4.4, -7.4], ch: [4.6, -7.2], ci: [9, -8.8],
      m1: [7, -13.2], m2: [0.6, -13], m3: [-7.4, -12.2] };
    const tri = (p, q, r, col) => { c.beginPath(); poly(c, [...V[p], ...V[q], ...V[r]], true); c.fillStyle = col; c.fill(); c.strokeStyle = col; c.lineWidth = 0.25; c.stroke(); };
    tri('st', 'ft', 'fn', '#8a68ea'); tri('un', 'fn', 'fl', '#6c4bd2'); tri('st', 'fn', 'un', '#7a59de');
    c.beginPath(); c.moveTo(...V.d); c.quadraticCurveTo(-0.8, -21.6, -4.8, -22.6); c.quadraticCurveTo(-3.6, -19.6, ...V.fb); c.closePath(); fs(c, '#49cdf2', 0.8);
    [['tip', 'bt', 'bb', '#fff0f8'], ['bt', 'me', 'm1', '#a8f4ff'], ['me', 'cr', 'm1', '#7eeeff'], ['cr', 'm2', 'm1', '#5ee7ff'], ['cr', 'd', 'm2', '#72e9ff'], ['d', 'fb', 'm2', '#49cdf2'],
      ['fb', 'bk', 'm3', '#3fb7ec'], ['fb', 'm3', 'm2', '#58d6f6'], ['bk', 'st', 'm3', '#8f7cf2'], ['m3', 'st', 'un', '#a690f6'], ['bt', 'm1', 'bb', '#d8fbff'], ['bb', 'm1', 'ci', '#fff0f8'],
      ['ci', 'm1', 'ch', '#ffd1ea'], ['ch', 'm1', 'm2', '#f6c0ee'], ['ch', 'm2', 'be', '#ffd8f0'], ['be', 'm2', 'm3', '#e2c6fb'], ['be', 'm3', 'un', '#cdb2f8']].forEach((f) => tri(...f));
    c.beginPath(); poly(c, ['tip', 'bt', 'me', 'cr', 'd', 'fb', 'bk', 'st', 'ft', 'fn', 'fl', 'un', 'be', 'ch', 'ci', 'bb'].flatMap((k) => V[k]), true); fs(c, null, 0.85);
    c.beginPath(); c.arc(8.2, -13.2, 0.85, 0, TAU); fs(c, P.ink);
  }
  /* ---------- props ---------- */
  function palmPose(c) {
    for (let i = 0; i < 11; i++) { // trunk: flared segments along a quadratic curve
      const q = (t) => [2 * (1 - t) * t * -2.5 + t * t * 8.5, 2 * (1 - t) * t * -23 + t * t * -46], p0 = q(i / 11), p1 = q((i + 1) / 11), w0 = 2.7 - i / 11, w1 = (2.7 - (i + 1) / 11) * 1.18;
      c.beginPath(); poly(c, [p0[0] - w0, p0[1], p1[0] - w1, p1[1], p1[0] + w1, p1[1], p0[0] + w0, p0[1]], true); fs(c, grad(c, p0[0] - w0, 0, p0[0] + w0, 0, [0, '#ffe0cc', 1, '#e5917f']), 0.6);
    }
    for (const [ang, L, droop] of [[-2.6, 16, 0], [-0.55, 16, 0], [Math.PI + 0.2, 21, 5], [-0.2, 21, 5], [Math.PI - 0.5, 19, 12], [0.5, 19, 12], [2.1, 13, 9]]) {
      const tx = 8.5, ty = -46, ex = tx + Math.cos(ang) * L, ey = ty + Math.sin(ang) * L * 0.5 + droop, cx = tx + Math.cos(ang) * L * 0.55, cy = ty + Math.sin(ang) * L * 0.35 - 5.5;
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(cx, cy - 1.5, ex, ey); c.quadraticCurveTo(cx, cy + 4.5, tx, ty);
      fs(c, grad(c, tx, ty, ex, ey, [0, '#c9fff0', 0.3, P.mint, 0.75, P.teal, 1, '#1f9fa6']), 0.7);
    }
  }
  function columnPose(c) {
    const M = marbleGrad(c, -7, 0, 7, 0);
    c.beginPath(); c.rect(-7.6, -2.6, 15.2, 2.6); fs(c, M, 0.8); c.beginPath(); c.rect(-4.8, -34.6, 9.6, 32); fs(c, M, 0.8);
    c.beginPath(); for (let k = -3; k <= 3; k += 2) { c.moveTo(k * 1.3, -33.6); c.lineTo(k * 1.3, -4); } c.strokeStyle = 'rgba(122,79,208,0.32)'; c.lineWidth = 0.5; c.stroke();
    c.beginPath(); c.rect(-7.6, -38.8, 15.2, 2.3); fs(c, M, 0.75);
    for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * 6.4, -35.4, 2.2, 0, TAU); fs(c, '#f6eefc', 0.7); }
  }
  function sunPose(c, r) { // striped sunset sun: gradient disc with bands cut out of the lower half
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = grad(c, 0, -r, 0, r, [0, '#fff7b0', 0.3, P.sun, 0.55, P.amber, 0.8, P.hot, 1, '#c0399e']); c.fill();
    c.globalCompositeOperation = 'destination-out'; for (const [y, h] of [[0.12, 0.08], [0.32, 0.11], [0.54, 0.14], [0.76, 0.16]]) c.fillRect(-r - 1, y * r, r * 2 + 2, h * r);
    c.restore(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.strokeStyle = 'rgba(42,26,76,0.85)'; c.lineWidth = 0.55; c.stroke();
  }
  function discPose(c, r) { // iridescent compact disc (projectile)
    c.beginPath(); c.arc(0, 0, r, 0, TAU);
    let g; if (c.createConicGradient) { g = c.createConicGradient(0.4, 0, 0); ['#ffd1ea', '#b892ff', '#5ee7ff', '#8ff5d2', '#fff27a', '#ffc1a1', '#ffd1ea'].forEach((col, i) => g.addColorStop(i / 6, col)); } else g = P.lilac;
    fs(c, g, 0.6); c.beginPath(); c.arc(0, 0, r * 0.36, 0, TAU); fs(c, '#f4f0ff', 0.4); c.beginPath(); c.arc(0, 0, r * 0.16, 0, TAU); fs(c, P.ink);
  }

  /* ---------- public drawers (feet at x, y; world units; ctx already scaled to the 360-unit view) ---------- */
  let SP = null;
  function sprites() {
    if (SP) return SP;
    SP = { hero: [], dolphin: [] };
    for (let i = 0; i < 8; i++) SP.hero.push(bake(16, 40, 16, 6, (c) => heroPose(c, i / 8)));
    for (let i = 0; i < 8; i++) SP.dolphin.push(bake(22, 28, 17, 6, (c) => dolphinPose(c, i / 8), { bloom: P.cyan, bloomA: 0.45 }));
    SP.critter = bake(14, 24, 15, 6, critterPose);
    SP.palm = bake(28, 62, 31, 5, palmPose, { bloom: P.mint, bloomA: 0.4 });
    SP.column = bake(11, 42, 11, 4, columnPose, { bloom: P.lavender, bloomA: 0.4 });
    SP.sun = bake(10, 10, 10, 10, (c) => sunPose(c, 5.6), { bloom: P.amber, bloomA: 0.9 });
    SP.disc = bake(7, 7, 7, 7, (c) => discPose(c, 3.6), { bloom: '#ffffff', bloomA: 0.7, blur: 1.4 });
    return SP;
  }
  function shadow(ctx, x, y, rw) { // soft violet ellipse, nudged right (low sun from the upper left)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(75,42,134,0.5)'); g.addColorStop(1, 'rgba(75,42,134,0)');
    ctx.save(); ctx.translate(x + rw * 0.25, y); ctx.scale(rw * 1.15, rw * 0.34); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  }
  function drawHero(ctx, x, y, t, facing) {
    const s = sprites().hero[Math.floor(t * 9.2 / 3 * 8) & 7];
    shadow(ctx, x, y, 11);
    ctx.save(); if (facing < 0) { ctx.translate(x * 2, 0); ctx.scale(-1, 1); } blit(ctx, s, x, y); ctx.restore();
  }
  function drawEnemy(ctx, x, y, t, kind) {
    const S = sprites();
    if (kind === 'dolphin') { // quick rise, slow glide (eased hover)
      const fb = (t * 0.42) % 1, up = fb < 0.35 ? fb / 0.35 : 1 - (fb - 0.35) / 0.65, e = up * up * (3 - 2 * up);
      shadow(ctx, x, y, 10); blit(ctx, S.dolphin[Math.floor(t * 1.8 * 8) % 8], x, y - 2.4 - e * 3, 1 + 0.05 * (1 - e), 1 - 0.04 * (1 - e)); return;
    }
    // hop: a ground beat (land squash flowing into the anticipation crouch), then a stretched arc
    const ph = t * 1.1 % 1; let hop = 0, sq = 0, st = 0;
    if (ph < 0.26) sq = Math.sin((ph / 0.26) * Math.PI); else { const u = (ph - 0.26) / 0.74; hop = Math.sin(u * Math.PI); st = Math.max(0, 1 - u * 2.4); }
    const sy = 1 - 0.22 * sq + 0.12 * st;
    shadow(ctx, x, y, 12);
    blit(ctx, S.critter, x, y - hop * 6.2, 1 / Math.sqrt(sy), sy);
  }

  /* ---------- ground: 32-unit plaza blocks (marble / checker / pastel grid), white trims, a tiled pool ---------- */
  function regionAt(bx, by) {
    let best = 0, bv = -1;
    for (let i = 0; i < 3; i++) { const v = fbm(bx / 7 + i * 13.7, by / 7 - i * 9.1, 11 + i * 12) * (i === 2 ? 0.74 : 1); if (v > bv) { bv = v; best = i; } } // the deep grid is the rarest
    return best;
  }
  function ground(W) {
    const c = mk(W * K / 2, 360 * K / 2), x = c.getContext('2d'); x.scale(K / 2, K / 2);
    const nb = Math.ceil(W / 32) + 1, nbY = 12, reg = [];
    for (let j = 0; j < nbY; j++) for (let i = 0; i < nb; i++) reg.push(regionAt(i, j));
    const R = (i, j) => (i < 0 || j < 0 || i >= nb || j >= nbY ? -1 : reg[j * nb + i]);
    for (let j = 0; j < nbY; j++) for (let i = 0; i < nb; i++) {
      const bx = i * 32, by = j * 32, r = R(i, j), hv = hash(i, j, 404);
      if (r === 0) { // marble slab: rose / lilac base + a few veins + bevel
        x.fillStyle = hv < 0.7 ? '#f8c6e0' : '#ddcbf8'; x.fillRect(bx, by, 32, 32);
        x.save(); x.beginPath(); x.rect(bx, by, 32, 32); x.clip(); // marble: a soft cloud + one main vein with a fork
        x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(bx + hash(i, j, 9) * 32, by + hash(j, i, 9) * 32, 14, 7, hv * 3, 0, TAU); x.fill();
        const a = hash(i, j, 1) * 32, b = hash(j, i, 2) * 32, vc = hv < 0.7 ? 'rgba(199,106,168,' : 'rgba(138,98,200,';
        x.beginPath(); x.moveTo(bx - 2, by + a); x.bezierCurveTo(bx + 10, by + a + 8, bx + 18, by + b - 10, bx + 34, by + b); x.moveTo(bx + 16, by + (a + b) / 2); x.quadraticCurveTo(bx + 22, by + a, bx + 30, by + a - 6);
        x.strokeStyle = vc + '0.18)'; x.lineWidth = 1.6; x.stroke(); x.strokeStyle = vc + '0.55)'; x.lineWidth = 0.35; x.stroke(); x.restore();
        x.fillStyle = 'rgba(255,255,255,0.75)'; x.fillRect(bx, by, 32, 0.7); x.fillRect(bx, by, 0.7, 32);
        x.fillStyle = 'rgba(122,60,150,0.28)'; x.fillRect(bx, by + 31.2, 32, 0.8); x.fillRect(bx + 31.2, by, 0.8, 32);
      } else if (r === 1) { x.fillStyle = P.checkA; x.fillRect(bx, by, 32, 32); x.fillStyle = P.checkB; x.fillRect(bx, by, 16, 16); x.fillRect(bx + 16, by + 16, 16, 16); }
      else {
        x.fillStyle = P.gridBase; x.fillRect(bx, by, 32, 32); x.beginPath(); for (let k = 8; k < 32; k += 8) { x.moveTo(bx + k, by); x.lineTo(bx + k, by + 32); x.moveTo(bx, by + k); x.lineTo(bx + 32, by + k); }
        x.strokeStyle = 'rgba(255,154,213,0.3)'; x.lineWidth = 0.4; x.stroke(); x.beginPath(); x.rect(bx, by, 32, 32); x.strokeStyle = '#ff9ad5'; x.lineWidth = 0.65; x.stroke();
      }
    }
    x.fillStyle = '#fff6fb'; // raised white trims where regions meet (shadow first, to the lower right)
    for (const pass of [0, 1]) for (let j = 0; j < nbY; j++) for (let i = 0; i < nb; i++) {
      if (pass === 0) x.fillStyle = 'rgba(75,42,134,0.3)';
      const o = pass === 0 ? 1.4 : -1.4, th = pass === 0 ? 1.1 : 2.8;
      if (R(i + 1, j) >= 0 && R(i + 1, j) !== R(i, j)) x.fillRect((i + 1) * 32 + o, j * 32 - 1.4, th, 34.8);
      if (R(i, j + 1) >= 0 && R(i, j + 1) !== R(i, j)) x.fillRect(i * 32 - 1.4, (j + 1) * 32 + o, 34.8, th);
      if (pass === 0) x.fillStyle = '#fff6fb';
    }
    // pool: a stepped rectangle of 16-unit cells, depth gradient, mosaic band, white coping
    const outline = () => { x.beginPath(); poly(x, [32, 208, 160, 208, 160, 256, 144, 256, 144, 304, 112, 304, 112, 336, 64, 336, 64, 304, 48, 304, 48, 256, 32, 256], true); };
    x.save(); outline(); x.clip();
    x.fillStyle = grad(x, 0, 208, 0, 336, [0, '#93f1ff', 0.5, P.water, 1, '#2cafe2']); x.fillRect(0, 200, 200, 160);
    x.strokeStyle = 'rgba(235,255,255,0.55)'; x.lineWidth = 0.6; x.beginPath();
    for (let k = 0; k < 40; k++) { const gx = 30 + hash(k, 1, 7) * 130, gy = 215 + hash(k, 2, 7) * 110; x.moveTo(gx - 4, gy); x.quadraticCurveTo(gx - 2, gy - 0.9, gx, gy); x.quadraticCurveTo(gx + 2, gy + 0.9, gx + 4, gy); } x.stroke();
    outline(); x.strokeStyle = P.poolTile; x.lineWidth = 6.6; x.setLineDash([1.7, 0.3]); x.stroke(); x.setLineDash([]); // mosaic band (inner half only, clipped)
    outline(); x.strokeStyle = 'rgba(42,26,120,0.22)'; x.lineWidth = 12; x.stroke();
    x.restore();
    outline(); x.strokeStyle = '#fffafd'; x.lineWidth = 3.4; x.lineJoin = 'miter'; x.stroke();
    // sun inlay (landmark)
    x.save(); x.translate(W * 0.78, 300); x.beginPath(); x.arc(0, 0, 21, 0, TAU); x.fillStyle = '#fff6fb'; x.fill(); sunPose(x, 17.5); x.restore();
    return c;
  }
  function overlay(w, h) { // sunset wash + sun glare + violet vignette + edge fringe + scanlines, cached per size
    const c = mk(w, h), x = c.getContext('2d');
    let g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,186,110,0.3)'); g.addColorStop(0.3, 'rgba(255,130,196,0.1)'); g.addColorStop(0.6, 'rgba(180,120,255,0)'); g.addColorStop(1, 'rgba(84,30,168,0.32)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    g = x.createRadialGradient(w / 2, h * 0.5, Math.min(w, h) * 0.35, w / 2, h * 0.5, Math.hypot(w, h) * 0.58); g.addColorStop(0, 'rgba(60,18,100,0)'); g.addColorStop(1, 'rgba(42,10,80,0.5)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    g = x.createLinearGradient(0, 0, w * 0.07, 0); g.addColorStop(0, 'rgba(255,63,174,0.16)'); g.addColorStop(1, 'rgba(255,63,174,0)'); x.fillStyle = g; x.fillRect(0, 0, w * 0.07, h);
    g = x.createLinearGradient(w, 0, w * 0.93, 0); g.addColorStop(0, 'rgba(47,224,255,0.15)'); g.addColorStop(1, 'rgba(47,224,255,0)'); x.fillStyle = g; x.fillRect(w * 0.93, 0, w * 0.07, h);
    x.fillStyle = 'rgba(42,26,76,0.06)'; for (let y = 0; y < h; y += 3) x.fillRect(0, y, w, 1);
    return c;
  }

  /* ---------- preview scene ---------- */
  let CACHE = null;
  function draw(ctx, w, h, t) {
    const s = h / 360, W = w / s, S = sprites();
    if (!CACHE || CACHE.w !== w || CACHE.h !== h) CACHE = { w, h, ground: ground(W), ovl: overlay(w, h) };
    ctx.save(); ctx.scale(s, s);
    ctx.fillStyle = P.checkA; ctx.fillRect(0, 0, W, 360);
    ctx.drawImage(CACHE.ground, 0, 0, W, 360);
    const hx = W * 0.5, hy = 210, items = [];
    items.push({ y: 120, f: () => { shadow(ctx, W * 0.22 + 20, 120, 16); blit(ctx, S.palm, W * 0.22, 120); } });
    items.push({ y: 130, f: () => blit(ctx, S.column, W * 0.68, 130) });
    items.push({ y: hy, f: () => drawHero(ctx, hx, hy, t, 1) });
    items.push({ y: 250, f: () => drawEnemy(ctx, hx + 70, 250, t, 'critter') });
    items.push({ y: 175, f: () => drawEnemy(ctx, hx - 90, 175, t + 0.4, 'critter') });
    const dx = ((t * 60) % (W + 80)) - 40;
    items.push({ y: 300, f: () => drawEnemy(ctx, dx, 300, t, 'dolphin') });
    items.sort((a, b) => a.y - b.y).forEach((it) => it.f());
    for (let i = 0; i < 2; i++) { const a = t * 2.4 + i * Math.PI; blit(ctx, S.sun, hx + Math.cos(a) * 34, hy - 10 + Math.sin(a) * 34 * 0.85); } // orbiting suns
    for (let i = 0; i < 5; i++) { // mint collectibles: rotating rhombi with ink outline
      const gx = W * 0.32 + i * 14, gy = 262 + Math.sin(t * 3 + i) * 0.8, k = Math.abs(Math.cos(t * 2 + i));
      ctx.beginPath(); poly(ctx, [gx, gy - 12, gx + 3.1 * k + 0.4, gy - 8, gx, gy - 5, gx - 3.1 * k - 0.4, gy - 8], true); fs(ctx, grad(ctx, gx, gy - 12, gx, gy - 5, [0, '#dcfff3', 1, '#45d4f5']), 0.6);
    }
    const ph = (t * 1.2) % 1, px = hx + 10 + ph * 70, py = 236 - 6; // projectile disc with a pink->cyan trail
    ctx.strokeStyle = grad(ctx, px - 24, 0, px, 0, [0, 'rgba(94,231,255,0)', 1, 'rgba(255,95,193,0.95)']); ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px - 24, py); ctx.lineTo(px, py); ctx.stroke();
    ctx.save(); ctx.translate(px, py); ctx.scale(1, 0.72); ctx.rotate(t * 14); blit(ctx, S.disc, 0, 0); ctx.restore();
    const kk = (t * 0.9) % 1; // confetti burst: filled triangles with thin ink edges + an expanding ring
    for (let i = 0; i < 8; i++) {
      const an = hash(i, 3, 1) * TAU, d = 4 + kk * 30, bx = W * 0.3 + Math.cos(an) * d, by = 190 + Math.sin(an) * d * 0.6 + kk * kk * 12, r = 2.2 * (1 - kk) + 0.6, ro = an + t * 6;
      ctx.beginPath(); poly(ctx, [bx + Math.cos(ro) * r, by + Math.sin(ro) * r, bx + Math.cos(ro + 2.1) * r, by + Math.sin(ro + 2.1) * r, bx + Math.cos(ro + 4.2) * r, by + Math.sin(ro + 4.2) * r], true);
      fs(ctx, [P.hot, P.cyan, P.sun, P.lavender][i % 4], 0.35);
    }
    const rr = 4 + (1 - (1 - kk) * (1 - kk)) * 26; ctx.globalAlpha = 1 - kk; ctx.beginPath(); ctx.ellipse(W * 0.3, 196, rr, rr * 0.45, 0, 0, TAU);
    ctx.strokeStyle = P.hot; ctx.lineWidth = 1.8; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.55; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.restore();
    // atmosphere (screen px): tracking band rolling down + cached overlay
    const by0 = (((t / 8.5) % 1) * 1.2 - 0.1) * h, bh = h * 0.03;
    ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.fillRect(0, by0, w, bh);
    ctx.fillStyle = 'rgba(255,63,174,0.35)'; ctx.fillRect(0, by0, w, Math.max(1, h / 900)); ctx.fillStyle = 'rgba(47,224,255,0.35)'; ctx.fillRect(0, by0 + bh, w, Math.max(1, h / 900));
    ctx.drawImage(CACHE.ovl, 0, 0);
    // UI: a 90s window panel with a gradient title bar + segmented bar, chrome title numbers
    const u = h / 540; ctx.save(); ctx.translate(20 * u, 18 * u);
    ctx.fillStyle = 'rgba(42,26,76,0.4)'; ctx.fillRect(5 * u, 5 * u, 250 * u, 44 * u); ctx.fillStyle = '#ecdff8'; ctx.fillRect(0, 0, 250 * u, 44 * u);
    ctx.fillStyle = grad(ctx, 0, 0, 250 * u, 0, [0, '#ff5fc1', 0.55, '#b892ff', 1, '#5ee7ff']); ctx.fillRect(2 * u, 2 * u, 246 * u, 12 * u);
    ctx.fillStyle = '#1d1040'; ctx.fillRect(10 * u, 22 * u, 230 * u, 14 * u);
    ctx.fillStyle = grad(ctx, 10 * u, 0, 240 * u, 0, [0, '#ff5fc1', 0.45, '#ff8fa3', 0.75, '#ffb36b', 1, '#fff27a']); ctx.fillRect(10 * u, 22 * u, 230 * u * 0.72, 14 * u);
    ctx.fillStyle = 'rgba(29,16,64,0.85)'; for (let k = 14; k < 230; k += 17) ctx.fillRect((10 + k) * u, 22 * u, 3 * u, 14 * u);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 2 * u; ctx.strokeRect(0, 0, 250 * u, 44 * u); ctx.restore();
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = Math.round(36 * u) + "px 'Rubik Mono One', sans-serif";
    const clock = '12:' + String(30 + (Math.floor(t) % 30)).padStart(2, '0');
    ctx.fillStyle = P.ink; ctx.fillText(clock, w / 2 + 3 * u, 17 * u);
    ctx.fillStyle = grad(ctx, 0, 14 * u, 0, 50 * u, [0, '#ffffff', 0.3, '#c4f6ff', 0.47, '#5ee7ff', 0.5, '#2a1a4c', 0.54, '#7a4fd0', 0.7, '#ff5fc1', 1, '#ffe0f2']);
    ctx.fillText(clock, w / 2, 14 * u); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  const Starter = { id: 'vaporwave', name: 'Vaporwave Sunset', palette: PALETTE, fonts: ['Monoton', 'VT323', 'Rubik Mono One'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['vaporwave'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
