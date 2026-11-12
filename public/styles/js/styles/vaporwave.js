/* Vaporwave Sunset – 80s/90s vaporwave: pastel marble plazas, checkerboards, pastel grids and tiled pools,
   palms, marble busts and floating gradient shapes under a sunset wash with VHS fringes and tracking lines.
   A variant of the neon module: the same "bake the glow once" idea, but solid gradient-shaded shapes with
   deep-indigo outlines and a baked pink/cyan chroma fringe instead of glowing tubes on black. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const K = 4; // sprite resolution (px per world unit)
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const hexA = (h, a) => rgba(U.hex(h), a);

  /* ================= palette ================= */
  const P = {
    ink: '#2a1a4c', ink2: '#4b2a86',
    hot: '#ff5fc1', pink: '#ff9ad5', blush: '#ffd1ea', peach: '#ffc1a1', coral: '#ff8fa3',
    sun: '#fff27a', amber: '#ffb36b',
    lav: '#b892ff', lilac: '#dccbff', vio: '#7a4fd0', dusk: '#4b2a86',
    mint: '#8ff5d2', teal: '#3fd8c8', cyan: '#5ee7ff', aqua: '#1fb2e0',
    marble: '#fff5fb', marble2: '#ecdff8', marble3: '#c9b0ee',
    skin: '#ffcfb0', skin2: '#f2a58c',
    fringeP: '#ff3fae', fringeC: '#2fe0ff',
  };
  const ETYPE = {
    creeper: { col: P.hot, col2: P.peach, col3: P.sun, h: 9 },
    ghost: { col: P.cyan, col2: P.lav, col3: '#ffffff', h: 15 },
    colossus: { col: P.marble, col2: P.marble3, col3: P.hot, h: 30 },
  };

  /* ================= sprite toolkit ================= */
  function grad(c, x0, y0, x1, y1, st) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i < st.length; i += 2) g.addColorStop(st[i], st[i + 1]);
    return g;
  }
  function rgrad(c, x0, y0, r0, x1, y1, r1, st) {
    const g = c.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for (let i = 0; i < st.length; i += 2) g.addColorStop(st[i], st[i + 1]);
    return g;
  }
  /** fill + ink outline of the current path */
  function fs(c, fill, lw, col) {
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (lw) { c.strokeStyle = col || P.ink; c.lineWidth = lw; c.stroke(); }
  }
  function line(c, pts, col, lw) {
    c.beginPath(); poly(c, pts); c.strokeStyle = col; c.lineWidth = lw; c.stroke();
  }
  function poly(c, pts, close) {
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    if (close) c.closePath();
  }
  /** thick rounded limb with an ink outline (stroke twice) */
  function limb(c, pts, w, col, ow) {
    c.beginPath(); poly(c, pts);
    c.strokeStyle = P.ink; c.lineWidth = w + (ow || 1.6); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.stroke();
  }
  const marbleGrad = (c, x0, y0, x1, y1) => grad(c, x0, y0, x1, y1, [0, '#ffffff', 0.38, '#f6ecfb', 0.78, '#dcc8f2', 1, '#c2a6ea']);

  function drawFull(l, t, r, b, draw) {
    const w = Math.ceil((l + r) * K), h = Math.ceil((t + b) * K);
    const { c, ctx } = U.canvas(w, h);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.setTransform(K, 0, 0, K, l * K, t * K);
    draw(ctx);
    return { c, w: w / K, h: h / K, ax: (l * K) / w, ay: (t * K) / h };
  }
  /** Bloom halo + pink/cyan chroma fringe + the sharp art – composed once. */
  function compose(full, o) {
    const { c, ctx } = U.canvas(full.width, full.height);
    if (o.bloom !== false) {
      ctx.filter = 'blur(' + ((o.blur || 2.2) * K) + 'px)';
      ctx.globalAlpha = o.bloomA === undefined ? 0.55 : o.bloomA;
      ctx.drawImage(U.tint(full, o.bloomCol || P.hot), 0, 0);
      ctx.filter = 'none';
    }
    const ca = (o.ca === undefined ? 0.5 : o.ca) * K;
    if (ca > 0) {
      ctx.globalAlpha = 0.8;
      ctx.drawImage(U.tint(full, P.fringeP), -ca, 0);
      ctx.drawImage(U.tint(full, P.fringeC), ca, 0);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(full, 0, 0);
    return c;
  }
  function bake(l, t, r, b, draw, o) {
    o = o || {};
    const F = drawFull(l, t, r, b, draw);
    return { img: compose(F.c, o), full: F.c, w: F.w, h: F.h, ax: F.ax, ay: F.ay };
  }
  /** Character sprite: both facings (fringe stays pink-left / cyan-right), flash + chroma tints for hits. */
  function makeSprite(l, t, r, b, draw, o) {
    o = o || {};
    const F = drawFull(l, t, r, b, draw);
    const mk = (full, ax) => ({
      img: compose(full, o), flash: U.tint(full, '#ffffff'), pk: U.tint(full, P.fringeP), cy: U.tint(full, P.fringeC),
      w: F.w, h: F.h, ax, ay: F.ay,
    });
    return [mk(F.c, F.ax), mk(U.flipX(F.c), 1 - F.ax)];
  }
  function blit(ctx, s, img, x, y) { ctx.drawImage(img, x - s.ax * s.w, y - s.ay * s.h, s.w, s.h); }
  function softDisc(col, a, size) {
    size = size || 96;
    return U.sprite(size, size, (ctx) => {
      const r = size / 2;
      ctx.fillStyle = rgrad(ctx, r, r, 0, r, r, r, [0, hexA(col, a), 0.4, hexA(col, a * 0.55), 1, hexA(col, 0)]);
      ctx.fillRect(0, 0, size, size);
    });
  }
  function conic(c, a, x, y, st) {
    if (!c.createConicGradient) return grad(c, x - 4, y - 4, x + 4, y + 4, st);
    const g = c.createConicGradient(a, x, y);
    for (let i = 0; i < st.length; i += 2) g.addColorStop(st[i], st[i + 1]);
    return g;
  }
  const IRIS = [0, '#ffd1ea', 0.17, '#b892ff', 0.34, '#5ee7ff', 0.5, '#8ff5d2', 0.66, '#fff27a', 0.83, '#ffc1a1', 1, '#ffd1ea'];

  /* ================= main character: sunglasses, flattop, colour-block windbreaker ================= */
  function ik(ax, ay, bx, by, l1, l2, bend) {
    let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 0.001;
    const mx = l1 + l2 - 0.02;
    if (d > mx) { bx = ax + (dx / d) * mx; by = ay + (dy / d) * mx; dx = bx - ax; dy = by - ay; d = mx; }
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    return [ax + (dx * a) / d - (dy / d) * h * bend, ay + (dy * a) / d + (dx / d) * h * bend, bx, by];
  }
  const bump = (x, c, w) => { const t = (x - c) / w; return t <= -1 || t >= 1 ? 0 : 0.5 + 0.5 * Math.cos(t * Math.PI); };
  /** Pose parameters per mode; one drawing routine below renders them all. */
  function heroParams(mode, ph) {
    const a = ph * TAU;
    const q = { rot: 0, dy: 0, sh: 0, fA: [2.0, 0], fB: [-1.9, 0], swA: -0.15, swB: 0.15, hdy: 0, tilt: 0, glint: -1, mouth: 'smirk' };
    if (mode === 'walk') {
      // contact (0) – down (.125) – passing (.25) – up (.375); two steps per cycle
      const S = 3.7, L = 2.1;
      q.dy = 0.9 * Math.sin(2 * a);
      q.fA = [0.9 + S * Math.cos(a), -Math.max(0, -Math.sin(a)) * L];
      q.fB = [-0.9 - S * Math.cos(a), -Math.max(0, Math.sin(a)) * L];
      q.swA = -0.75 * Math.cos(a); q.swB = 0.75 * Math.cos(a);
      q.hdy = q.dy + 0.35 * Math.sin(2 * a - 1.1);
      q.tilt = 0.035 * Math.sin(2 * a - 1.3);
      q.rot = 0.04;
    } else if (mode === 'idle') {
      // breathing + a head nod on the beat; a light glint sweeps across the shades late in the cycle
      q.sh = -0.3 * (0.5 + 0.5 * Math.sin(a));
      q.hdy = -0.32 * (0.5 + 0.5 * Math.sin(a - 0.5)) + 0.45 * bump(ph, 0.3, 0.12);
      q.tilt = 0.02 * Math.sin(a) + 0.06 * bump(ph, 0.32, 0.14);
      q.swA = -0.12 + 0.05 * Math.sin(a - 0.6); q.swB = 0.14 + 0.05 * Math.sin(a - 1.0);
      q.glint = ph >= 0.6 && ph < 0.9 ? (ph - 0.6) / 0.3 : -1;
    } else if (mode === 'launch') {
      q.rot = 0.2; q.dy = 1.5; q.fA = [2.8, 0]; q.fB = [-5.6, -0.4]; q.swA = -1.45; q.swB = -1.65; q.hdy = 1.3; q.tilt = 0.12;
    } else if (mode === 'streak') {
      q.rot = 0.27; q.dy = -0.7; q.fA = [5.3, -1.9]; q.fB = [-4.9, -0.9]; q.swA = -1.35; q.swB = -1.7; q.hdy = -0.7; q.tilt = 0.05;
    } else if (mode === 'brake') {
      q.rot = -0.1; q.dy = 0.9; q.fA = [4.8, 0]; q.fB = [-2.6, 0]; q.swA = 0.95; q.swB = 0.55; q.hdy = 1.1; q.tilt = -0.08;
    } else if (mode === 'hurt') {
      q.rot = -0.2; q.dy = 0.6; q.fA = [1.5, 0]; q.fB = [-3.1, 0]; q.swA = 2.4; q.swB = 2.8; q.hdy = 0.3; q.tilt = -0.2; q.mouth = 'o';
    }
    return q;
  }
  function heroPose(c, ph, mode) {
    const q = heroParams(mode, ph);
    const bob = q.dy;
    c.save();
    if (q.rot) c.rotate(q.rot);
    const hipY = -9.2 + bob, shY = -16.4 + bob + q.sh;
    const leg = (hx, f, back) => {
      const [kx, ky, fx, fy0] = ik(hx, hipY, f[0], f[1] - 1.6, 4.1, 4.0, -1);
      const fy = fy0 + 1.6;
      limb(c, [hx, hipY, kx, ky, fx, fy - 1.6], 3.0, back ? '#33246e' : '#4a3699');
      c.beginPath(); c.roundRect(fx - 2.0, fy - 2.6, 5.4, 2.7, 1.2);
      fs(c, back ? '#e4d8ff' : '#ffffff', 0.7);
      c.beginPath(); c.moveTo(fx - 0.8, fy - 1.25); c.lineTo(fx + 2.2, fy - 1.25);
      c.strokeStyle = back ? P.lav : P.hot; c.lineWidth = 0.7; c.stroke();
    };
    const arm = (sx, sw, back) => {
      const sy = shY;
      const [ex, ey, hx, hy] = ik(sx, sy, sx + Math.sin(sw) * 5.9, sy + Math.cos(sw) * 5.9 - Math.max(0, Math.sin(sw)) * 0.8, 3.0, 3.0, 1);
      limb(c, [sx, sy, ex, ey, hx, hy], 2.7, back ? '#d84ca8' : P.hot);
      const cx = ex + (hx - ex) * 0.62, cy = ey + (hy - ey) * 0.62;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(ex + (hx - ex) * 0.86, ey + (hy - ey) * 0.86);
      c.strokeStyle = back ? '#5a3aa8' : P.vio; c.lineWidth = 2.7; c.stroke();
      c.beginPath(); c.arc(hx, hy + 0.3, 1.3, 0, TAU); fs(c, back ? P.skin2 : P.skin, 0.6);
    };
    arm(-0.9, q.swB, true);
    leg(-1.3, q.fB, true);
    leg(1.3, q.fA, false);
    // jacket: colour-block windbreaker, the top edge follows the breathing shoulders
    const top = -17.8 + bob + q.sh;
    const torso = () => {
      c.beginPath();
      c.moveTo(-4.5, top); c.lineTo(4.7, top);
      c.quadraticCurveTo(6.2, -13.2 + bob, 5.6, -8.4 + bob); c.lineTo(-5.1, -8.4 + bob);
      c.quadraticCurveTo(-6.0, -13.2 + bob, -4.5, top); c.closePath();
    };
    torso(); fs(c, grad(c, 0, -18 + bob, 0, -8 + bob, [0, '#ff9ae0', 1, '#ff4fb4']));
    c.save(); torso(); c.clip();
    c.beginPath(); c.moveTo(-7, -11.4 + bob); c.lineTo(7, -16.8 + bob); c.lineTo(7, -13.4 + bob); c.lineTo(-7, -8.0 + bob); c.closePath();
    c.fillStyle = grad(c, -6, 0, 6, 0, [0, '#46e3d3', 1, P.cyan]); c.fill();
    c.fillStyle = P.vio; c.fillRect(-7, -10.3 + bob, 14, 1.9);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-4.8, -17.6 + bob, 1.1, 7);
    // cool shade on the far side (light from the upper left)
    c.fillStyle = 'rgba(75,42,134,0.18)'; c.fillRect(2.6, -18 + bob, 5, 10);
    c.restore();
    torso(); fs(c, null, 0.85);
    c.beginPath(); c.moveTo(1.4, top + 0.4); c.lineTo(1.2, -8.8 + bob);
    c.strokeStyle = 'rgba(42,26,76,0.45)'; c.lineWidth = 0.4; c.stroke();
    c.beginPath(); c.moveTo(-2.6, top - 0.1); c.lineTo(1.4, top + 2.2); c.lineTo(4.2, top - 0.1); c.closePath();
    fs(c, '#ffffff', 0.55);
    // head group: bobs late and tilts around the neck
    c.save();
    const nkY = top + 0.2;
    c.translate(0.6, nkY); c.rotate(q.tilt); c.translate(-0.6, -nkY);
    const hx = 0.8, hy = -23.3 + q.hdy;
    c.beginPath(); c.rect(-0.9, hy + 3.6, 3.0, Math.max(1.2, nkY - hy - 3.2)); fs(c, P.skin2);
    c.beginPath(); c.arc(hx, hy, 5.9, 0, TAU);
    fs(c, rgrad(c, hx + 1.6, hy - 2.2, 0.4, hx, hy, 6.6, [0, '#ffe8d6', 0.55, P.skin, 1, P.skin2]), 0.85);
    c.beginPath(); c.ellipse(hx - 4.1, hy + 0.5, 1.3, 1.8, 0, 0, TAU); fs(c, P.skin2, 0.6);
    c.beginPath();
    c.moveTo(hx - 4.6, hy + 1.6); c.quadraticCurveTo(hx - 6.6, hy - 2.0, hx - 6.1, hy - 7.6);
    c.quadraticCurveTo(hx - 5.9, hy - 10.0, hx - 3.8, hy - 10.0);
    c.lineTo(hx + 4.6, hy - 10.6); c.quadraticCurveTo(hx + 6.6, hy - 10.6, hx + 6.6, hy - 8.4);
    c.quadraticCurveTo(hx + 6.7, hy - 5.6, hx + 5.8, hy - 4.2);
    c.quadraticCurveTo(hx + 3.6, hy - 5.4, hx + 1.4, hy - 3.9); c.quadraticCurveTo(hx - 0.8, hy - 5.0, hx - 2.2, hy - 3.8);
    c.lineTo(hx - 2.6, hy - 0.2); c.quadraticCurveTo(hx - 3.6, hy + 1.0, hx - 4.6, hy + 1.6); c.closePath();
    fs(c, grad(c, 0, hy - 10.6, 0, hy + 1, [0, '#d4fcff', 0.3, P.cyan, 0.7, '#9a8cff', 1, P.vio]), 0.85);
    c.beginPath();
    c.moveTo(hx + 2.4, hy - 10.2); c.quadraticCurveTo(hx + 2.0, hy - 7.6, hx + 2.8, hy - 5.0);
    c.moveTo(hx - 1.0, hy - 10.0); c.quadraticCurveTo(hx - 1.4, hy - 7.4, hx - 0.6, hy - 4.6);
    c.moveTo(hx - 4.0, hy - 9.4); c.quadraticCurveTo(hx - 4.6, hy - 6.0, hx - 3.6, hy - 2.6);
    c.strokeStyle = 'rgba(42,26,76,0.3)'; c.lineWidth = 0.4; c.stroke();
    c.beginPath(); c.moveTo(hx - 3.2, hy - 9.0); c.quadraticCurveTo(hx + 1, hy - 9.6, hx + 5.0, hy - 9.4);
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 0.65; c.stroke();
    // sunglasses (wayfarer, sunset reflection); knocked askew in the hurt pose
    const gy = hy - 1.1;
    c.save();
    if (q.mouth === 'o') { c.translate(hx + 3, gy); c.rotate(-0.16); c.translate(-hx - 3, -gy - 0.6); }
    c.beginPath(); c.moveTo(hx - 0.8, gy - 0.6); c.lineTo(hx - 4.0, gy + 0.7);
    c.strokeStyle = P.ink; c.lineWidth = 0.8; c.stroke();
    const shades = () => {
      c.beginPath();
      c.moveTo(hx - 0.8, gy - 1.3); c.lineTo(hx + 6.9, gy - 1.5); c.lineTo(hx + 6.6, gy + 1.2);
      c.quadraticCurveTo(hx + 5.2, gy + 2.3, hx + 4.0, gy + 1.0); c.lineTo(hx + 3.3, gy + 0.2); c.lineTo(hx + 2.6, gy + 1.0);
      c.quadraticCurveTo(hx + 0.9, gy + 2.3, hx - 0.6, gy + 0.9); c.closePath();
    };
    shades(); fs(c, grad(c, 0, gy - 1.5, 0, gy + 2.2, [0, '#1d1040', 0.42, '#5b2a9a', 0.6, P.hot, 1, P.sun]), 0.6);
    c.beginPath(); c.moveTo(hx + 0.6, gy - 0.4); c.lineTo(hx + 1.6, gy - 0.4); c.moveTo(hx + 4.6, gy - 0.5); c.lineTo(hx + 5.6, gy - 0.5);
    c.strokeStyle = '#ffffff'; c.lineWidth = 0.45; c.stroke();
    if (q.glint >= 0) {
      c.save(); shades(); c.clip();
      const gx = hx - 1.5 + q.glint * 9.5;
      c.beginPath(); c.moveTo(gx, gy + 2.6); c.lineTo(gx + 1.6, gy - 1.8); c.lineTo(gx + 2.4, gy - 1.8); c.lineTo(gx + 0.8, gy + 2.6); c.closePath();
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
      c.restore();
    }
    c.restore();
    c.beginPath();
    if (q.mouth === 'o') { c.ellipse(hx + 3.6, hy + 3.2, 0.9, 1.1, 0, 0, TAU); fs(c, '#7a2a6a', 0.45); }
    else { c.moveTo(hx + 2.4, hy + 3.3); c.quadraticCurveTo(hx + 3.8, hy + 3.7, hx + 4.8, hy + 2.6); c.strokeStyle = P.ink; c.lineWidth = 0.5; c.stroke(); }
    c.restore();
    arm(1.0, q.swA, false);
    c.restore();
  }

  /* ================= small creature: hopping pyramid with one big eye ================= */
  function critterPose(c, blink) {
    for (const fx of [-4.8, 3.4]) { c.beginPath(); c.ellipse(fx, -0.9, 2.1, 1.15, 0, 0, TAU); fs(c, P.vio, 0.6); }
    const A = [0.4, -18.2], BL = [-8.8, -2.0], BR = [4.4, -0.6], BB = [9.2, -4.6];
    c.beginPath(); poly(c, [A[0], A[1], BR[0], BR[1], BB[0], BB[1]], true);
    fs(c, grad(c, A[0], A[1], BB[0] + 2, BB[1], [0, '#d7c2ff', 0.5, P.lav, 1, P.vio]));
    const front = () => { c.beginPath(); poly(c, [A[0], A[1], BL[0], BL[1], BR[0], BR[1]], true); };
    front(); fs(c, grad(c, 0, A[1], 0, -1, [0, '#fff0f8', 0.4, P.pink, 1, P.hot]));
    c.save(); front(); c.clip();
    c.fillStyle = 'rgba(255,242,122,0.75)'; c.fillRect(-10, -5.2, 20, 1.0); c.fillRect(-10, -3.3, 20, 0.8);
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.moveTo(A[0] - 0.2, A[1] + 1.5); c.lineTo(BL[0] + 2.6, BL[1] - 0.6); c.lineTo(BL[0] + 4.2, BL[1] - 0.6); c.closePath(); c.fill();
    c.restore();
    c.beginPath(); poly(c, [A[0], A[1], BL[0], BL[1], BR[0], BR[1], BB[0], BB[1]], true); fs(c, null, 0.9);
    line(c, [A[0], A[1], BR[0], BR[1]], P.ink, 0.6);
    const ex = -1.5, ey = -7.8;
    c.beginPath(); c.ellipse(ex, ey, 3.0, blink ? 0.55 : 2.5, 0, 0, TAU); fs(c, '#ffffff', 0.65);
    if (!blink) {
      c.beginPath(); c.arc(ex + 0.8, ey + 0.2, 1.55, 0, TAU); fs(c, grad(c, 0, ey - 1.5, 0, ey + 1.5, [0, P.cyan, 1, P.aqua]));
      c.beginPath(); c.arc(ex + 0.9, ey + 0.3, 0.72, 0, TAU); fs(c, P.ink);
      c.beginPath(); c.arc(ex + 0.3, ey - 0.5, 0.45, 0, TAU); fs(c, '#ffffff');
    }
    c.beginPath(); c.moveTo(ex - 2.8, ey - 3.0); c.lineTo(ex + 2.6, ey - 3.4);
    c.strokeStyle = P.ink; c.lineWidth = 0.6; c.stroke();
  }

  /* ================= fast creature: low-poly dolphin ================= */
  function dolphinPose(c, ph) {
    const a = ph * TAU, f = Math.sin(a), my = Math.sin(a - 0.9) * 0.6, ty = f * 2.3;
    // bottlenose silhouette: short beak, round melon, arched back, curved dorsal fin, horizontal flukes
    const V = {
      tip: [13.6, -11.0], bTop: [10.9, -12.0], bBot: [11.0, -9.9], melon: [10.0, -15.8], crown: [5.6, -18.4],
      dors: [0.6, -18.2], finB: [-4.4, -16.8 + my * 0.4], back: [-8.6, -15.2 + my], stock: [-12.8, -12.9 + ty * 0.55],
      flT: [-17.8, -16.8 + ty], flN: [-15.4, -12.8 + ty], flB: [-18.0, -8.8 + ty], under: [-12.2, -11.0 + ty * 0.55],
      belly: [-4.4, -7.4 + my], chest: [4.6, -7.2], chin: [9.0, -8.8],
      m1: [7.0, -13.2], m2: [0.6, -13.0 + my * 0.5], m3: [-7.4, -12.2 + my],
    };
    const tri = (p, q, r, col) => {
      c.beginPath(); c.moveTo(V[p][0], V[p][1]); c.lineTo(V[q][0], V[q][1]); c.lineTo(V[r][0], V[r][1]); c.closePath();
      c.fillStyle = col; c.fill();
      c.strokeStyle = col; c.lineWidth = 0.25; c.stroke(); // close hairline gaps
    };
    const fin = () => {
      c.beginPath(); c.moveTo(V.dors[0], V.dors[1]);
      c.quadraticCurveTo(-0.8, -21.6 + my * 0.3, -4.8, -22.6 + my * 0.4);
      c.quadraticCurveTo(-3.6, -19.6 + my * 0.4, V.finB[0], V.finB[1]); c.closePath();
    };
    // flukes + dorsal fin first (behind body)
    tri('stock', 'flT', 'flN', '#8a68ea'); tri('under', 'flN', 'flB', '#6c4bd2'); tri('stock', 'flN', 'under', '#7a59de');
    fin(); fs(c, grad(c, 0, -24, 0, -17, [0, '#7eeeff', 1, '#3aa8e6']), 0.8);
    tri('tip', 'bTop', 'bBot', '#fff0f8');
    tri('bTop', 'melon', 'm1', '#a8f4ff'); tri('melon', 'crown', 'm1', '#7eeeff'); tri('crown', 'm2', 'm1', '#5ee7ff');
    tri('crown', 'dors', 'm2', '#72e9ff'); tri('dors', 'finB', 'm2', '#49cdf2'); tri('finB', 'back', 'm3', '#3fb7ec');
    tri('finB', 'm3', 'm2', '#58d6f6'); tri('back', 'stock', 'm3', '#8f7cf2'); tri('m3', 'stock', 'under', '#a690f6');
    tri('bTop', 'm1', 'bBot', '#d8fbff'); tri('bBot', 'm1', 'chin', '#fff0f8'); tri('chin', 'm1', 'chest', '#ffd1ea');
    tri('chest', 'm1', 'm2', '#f6c0ee'); tri('chest', 'm2', 'belly', '#ffd8f0'); tri('belly', 'm2', 'm3', '#e2c6fb'); tri('belly', 'm3', 'under', '#cdb2f8');
    // facet edges
    c.beginPath();
    for (const [p, q] of [['m1', 'bTop'], ['m1', 'melon'], ['m1', 'crown'], ['m2', 'crown'], ['m2', 'dors'], ['m2', 'finB'], ['m3', 'finB'], ['m3', 'back'],
      ['m3', 'stock'], ['m1', 'bBot'], ['m1', 'chin'], ['m1', 'chest'], ['m2', 'chest'], ['m2', 'belly'], ['m3', 'belly'], ['m1', 'm2'], ['m2', 'm3'], ['flN', 'stock']]) {
      c.moveTo(V[p][0], V[p][1]); c.lineTo(V[q][0], V[q][1]);
    }
    c.strokeStyle = 'rgba(42,26,76,0.28)'; c.lineWidth = 0.3; c.stroke();
    // outline
    c.beginPath();
    poly(c, [].concat(V.tip, V.bTop, V.melon, V.crown, V.dors, V.finB, V.back, V.stock, V.flT, V.flN, V.flB, V.under, V.belly, V.chest, V.chin, V.bBot), true);
    fs(c, null, 0.85);
    // pectoral fin
    c.beginPath(); poly(c, [3.6, -8.8, -0.4, -4.8 + my, -1.4, -8.6 + my * 0.5], true); fs(c, '#9a7bf0', 0.6);
    // mouth line, eye
    c.beginPath(); c.moveTo(13.2, -11.0); c.quadraticCurveTo(11.0, -10.6, 9.2, -11.6);
    c.strokeStyle = P.ink; c.lineWidth = 0.45; c.stroke();
    c.beginPath(); c.arc(8.2, -13.2, 0.85, 0, TAU); fs(c, P.ink);
    c.beginPath(); c.arc(8.45, -13.5, 0.3, 0, TAU); fs(c, '#ffffff');
  }

  /* ================= large creature: walking marble statue ================= */
  function colossusPose(c, ph) {
    const a = ph * TAU, s = Math.sin(a);
    const bob = -Math.abs(s) * 1.4 + 0.5;
    const liftL = Math.max(0, s) * 3.2, liftR = Math.max(0, -s) * 3.2;
    const leg = (cx, lift) => {
      const top = -15 + bob, bot = -lift;
      c.beginPath(); c.rect(cx - 4.3, top, 8.6, bot - top - 2.0); fs(c, marbleGrad(c, cx - 4, 0, cx + 5, 0), 0.9);
      c.beginPath();
      for (let k = -1.5; k <= 1.5; k += 1) { c.moveTo(cx + k * 2.0, top + 1.2); c.lineTo(cx + k * 2.0, bot - 2.8); }
      c.strokeStyle = 'rgba(122,79,208,0.35)'; c.lineWidth = 0.45; c.stroke();
      c.beginPath(); c.roundRect(cx - 5.8, bot - 2.6, 11.6, 2.6, 0.7); fs(c, marbleGrad(c, cx - 5, 0, cx + 6, 0), 0.9);
    };
    leg(-6.4, liftL); leg(6.4, liftR);
    const T = () => {
      c.beginPath(); c.moveTo(-15.5, -39 + bob); c.quadraticCurveTo(0, -42.6 + bob, 15.5, -39 + bob);
      c.quadraticCurveTo(17.4, -34 + bob, 13.0, -27 + bob); c.lineTo(10.4, -14.4 + bob);
      c.quadraticCurveTo(0, -12.2 + bob, -10.4, -14.4 + bob); c.lineTo(-13.0, -27 + bob);
      c.quadraticCurveTo(-17.4, -34 + bob, -15.5, -39 + bob); c.closePath();
    };
    T(); fs(c, marbleGrad(c, -12, -42 + bob, 12, -12 + bob));
    c.save(); T(); c.clip();
    // broken chunk revealing a wireframe core
    const chunk = [-17, -40.5 + bob, -9.6, -41 + bob, -8.2, -36.4 + bob, -11.2, -33.0 + bob, -15.6, -33.6 + bob];
    c.beginPath(); poly(c, chunk, true); c.fillStyle = '#3a2470'; c.fill();
    c.save(); c.beginPath(); poly(c, chunk, true); c.clip();
    c.beginPath();
    for (let x = -18; x < -7; x += 1.8) { c.moveTo(x, -42 + bob); c.lineTo(x + 2.5, -32 + bob); }
    for (let y = -41; y < -32; y += 1.8) { c.moveTo(-18, y + bob); c.lineTo(-7, y + bob - 0.6); }
    c.strokeStyle = 'rgba(94,231,255,0.85)'; c.lineWidth = 0.3; c.stroke();
    c.restore();
    c.beginPath(); poly(c, chunk, true); c.strokeStyle = P.ink; c.lineWidth = 0.7; c.stroke();
    // drapery sash
    c.beginPath(); poly(c, [7.6, -42 + bob, 15, -38.6 + bob, -5.2, -13.0 + bob, -11.6, -15.0 + bob], true);
    c.fillStyle = grad(c, 10, -40 + bob, -8, -14 + bob, [0, '#ffd1ea', 0.5, P.pink, 1, '#f07ac8']); c.fill();
    c.beginPath(); c.moveTo(11, -38 + bob); c.lineTo(-7.5, -15.2 + bob); c.moveTo(7.2, -37.6 + bob); c.lineTo(-9.8, -16.4 + bob);
    c.strokeStyle = 'rgba(42,26,76,0.28)'; c.lineWidth = 0.4; c.stroke();
    c.beginPath(); poly(c, [7.6, -42 + bob, 15, -38.6 + bob, -5.2, -13.0 + bob, -11.6, -15.0 + bob], true);
    c.strokeStyle = P.ink; c.lineWidth = 0.6; c.stroke();
    // muscles
    c.beginPath();
    c.moveTo(-9.5, -33.5 + bob); c.quadraticCurveTo(-5, -29.6 + bob, -0.6, -32.4 + bob);
    c.moveTo(-3.0, -24.5 + bob); c.lineTo(-3.0, -17.5 + bob); c.moveTo(-6.4, -22.4 + bob); c.lineTo(0.4, -22.4 + bob);
    c.strokeStyle = 'rgba(122,79,208,0.45)'; c.lineWidth = 0.5; c.stroke();
    c.restore();
    T(); fs(c, null, 1.0);
    // glowing cracks
    c.beginPath();
    poly(c, [3.5, -30 + bob, 5.6, -27.4 + bob, 4.8, -24.6 + bob, 7.4, -21.6 + bob]);
    poly(c, [5.6, -27.4 + bob, 8.6, -28.2 + bob]);
    poly(c, [-7.8, -20.4 + bob, -6.0, -18.2 + bob, -7.0, -15.6 + bob]);
    c.strokeStyle = P.hot; c.lineWidth = 0.9; c.stroke();
    c.strokeStyle = '#fff0f8'; c.lineWidth = 0.3; c.stroke();
    // arms
    const arm = (sd, sw) => {
      const sx = sd * 14.0, sy = -36.6 + bob;
      const ex = sd * 18.2 + sw * 0.3, ey = -27.0 + bob;
      const hx = sd * 17.8 + sw, hy = -18.8 + bob;
      limb(c, [sx, sy, ex, ey, hx, hy], 5.2, '#f0e4fa', 2.0);
      c.beginPath(); poly(c, [sx - sd * 1.2, sy + 0.4, ex - sd * 1.4, ey, hx - sd * 1.2, hy]);
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.0; c.stroke();
      c.beginPath(); c.arc(hx, hy + 1.6, 3.3, 0, TAU); fs(c, marbleGrad(c, hx - 3, hy - 2, hx + 3, hy + 5), 0.9);
    };
    arm(-1, s * 1.6); arm(1, -s * 1.6);
    // neck + head
    c.beginPath(); c.rect(-3.2, -44.8 + bob, 6.4, 4.6); fs(c, '#e7d8f6', 0.9);
    const hy = -50.8 + bob;
    c.beginPath();
    for (let i = 0; i <= 8; i++) {
      const t = Math.PI * (1.05 + i * 0.1125);
      const x = Math.cos(t) * 7.4, y = hy - 0.6 + Math.sin(t) * 8.2;
      c.moveTo(x + 2.4, y); c.arc(x, y, 2.4, 0, TAU);
    }
    fs(c, '#e3d2f6', 0.75);
    c.beginPath(); c.ellipse(0, hy, 7.4, 8.4, 0, 0, TAU);
    fs(c, rgrad(c, -2.4, hy - 3, 0.5, 0, hy, 9.5, [0, '#ffffff', 0.55, '#f1e6fa', 1, '#cdb6ee']), 1.0);
    c.beginPath();
    for (let x = -5.4; x <= 5.5; x += 2.15) { c.moveTo(x + 1.7, hy - 6.0); c.arc(x, hy - 6.0, 1.7, 0, TAU); }
    fs(c, '#f6eefc', 0.55);
    // laurel wreath
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        c.beginPath(); c.ellipse(sd * (6.6 - i * 0.9), hy - 2.6 - i * 2.2, 1.9, 0.9, sd * (0.9 + i * 0.35), 0, TAU);
        fs(c, i % 2 ? '#6fe8c0' : P.mint, 0.5);
      }
    }
    c.beginPath(); c.moveTo(-5.0, hy - 1.6); c.quadraticCurveTo(0, -2.4 + hy - 0.6, 5.0, hy - 1.6);
    c.strokeStyle = 'rgba(42,26,76,0.6)'; c.lineWidth = 0.5; c.stroke();
    // glowing eyes
    for (const ex of [-2.8, 2.8]) {
      c.beginPath(); c.ellipse(ex, hy + 0.5, 3.2, 2.0, 0, 0, TAU); c.fillStyle = rgrad(c, ex, hy + 0.5, 0, ex, hy + 0.5, 3.2, [0, 'rgba(94,231,255,0.7)', 1, 'rgba(94,231,255,0)']); c.fill();
      c.beginPath(); c.ellipse(ex, hy + 0.5, 1.85, 0.8, 0, 0, TAU); fs(c, '#d8fdff', 0.55, P.aqua);
    }
    c.beginPath(); c.moveTo(0, hy + 1.0); c.lineTo(0.9, hy + 3.6); c.lineTo(-0.6, hy + 3.8);
    c.moveTo(-2.0, hy + 5.6); c.quadraticCurveTo(0, hy + 6.1, 2.0, hy + 5.6);
    c.strokeStyle = 'rgba(42,26,76,0.7)'; c.lineWidth = 0.5; c.stroke();
  }

  /* ================= collectibles, projectile, orbiting object ================= */
  function gemPose(c, a, big) {
    const h = big ? 6.4 : 4.4, bt = big ? 4.8 : 3.2, w = big ? 4.6 : 3.1, yc = big ? -11 : -8.5;
    const ramp = (big ? ['#6a3fc8', '#b892ff', '#ff9ad5', '#ffe0f2', '#ffffff'] : ['#1590c8', '#45d4f5', '#8ff5d2', '#dcfff3', '#ffffff']).map(U.hex);
    const vs = [];
    for (let k = 0; k < 4; k++) { const t = a + (k * Math.PI) / 2; vs.push([Math.cos(t) * w, yc + Math.sin(t) * w * 0.32, Math.sin(t)]); }
    const top = [0, yc - h], bot = [0, yc + bt];
    for (let k = 0; k < 4; k++) {
      const v1 = vs[k], v2 = vs[(k + 1) % 4];
      if (v1[2] + v2[2] <= 0) continue;
      const sh = (Math.cos(a + (k * Math.PI) / 2 + Math.PI / 4 + 2.2) + 1) / 2;
      c.beginPath(); poly(c, [top[0], top[1], v1[0], v1[1], v2[0], v2[1]], true);
      c.fillStyle = U.rgb(U.ramp(ramp, 0.45 + sh * 0.55)); c.fill();
      c.beginPath(); poly(c, [bot[0], bot[1], v1[0], v1[1], v2[0], v2[1]], true);
      c.fillStyle = U.rgb(U.ramp(ramp, sh * 0.55)); c.fill();
    }
    c.beginPath();
    for (const v of vs) if (v[2] > 0.05) { c.moveTo(top[0], top[1]); c.lineTo(v[0], v[1]); c.lineTo(bot[0], bot[1]); }
    c.strokeStyle = 'rgba(42,26,76,0.3)'; c.lineWidth = 0.3; c.stroke();
    let lx = vs[0], rx = vs[0];
    for (const v of vs) { if (v[0] < lx[0]) lx = v; if (v[0] > rx[0]) rx = v; }
    c.beginPath(); poly(c, [top[0], top[1], rx[0], rx[1], bot[0], bot[1], lx[0], lx[1]], true); fs(c, null, big ? 0.75 : 0.6);
    c.beginPath();
    const gx = -w * 0.3, gy = yc - h * 0.42, r = big ? 1.4 : 1.0;
    c.moveTo(gx, gy - r); c.lineTo(gx, gy + r); c.moveTo(gx - r, gy); c.lineTo(gx + r, gy);
    c.strokeStyle = '#ffffff'; c.lineWidth = 0.45; c.stroke();
  }
  function discPath(c, r) { c.beginPath(); c.arc(0, 0, r, 0, TAU); }
  function discPose(c, r) {
    discPath(c, r); fs(c, conic(c, 0.4, 0, 0, IRIS), 0.6);
    c.beginPath(); c.arc(0, 0, r * 0.62, -2.6, -1.2); c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = r * 0.12; c.stroke();
    c.beginPath(); c.arc(0, 0, r * 0.36, 0, TAU); fs(c, '#f4f0ff', 0.4);
    c.beginPath(); c.arc(0, 0, r * 0.16, 0, TAU); fs(c, P.ink);
  }
  function sunPose(c, r, gapCol) {
    c.save();
    c.beginPath(); c.arc(0, 0, r, 0, TAU);
    c.fillStyle = grad(c, 0, -r, 0, r, [0, '#fff7b0', 0.3, P.sun, 0.55, P.amber, 0.8, P.hot, 1, '#c0399e']); c.fill();
    c.globalCompositeOperation = 'destination-out';
    const bands = [[0.12, 0.08], [0.32, 0.11], [0.54, 0.14], [0.76, 0.16]];
    for (const [y, h] of bands) c.fillRect(-r - 1, y * r, r * 2 + 2, h * r);
    c.restore();
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.strokeStyle = 'rgba(42,26,76,0.85)'; c.lineWidth = 0.55; c.stroke();
    if (gapCol) { /* unused hook for inlay variants */ }
  }

  /* ================= props ================= */
  function palmPose(c, v) {
    const lean = v ? -1 : 1;
    const top = [lean * 8.5, -46], ctrl = [lean * -2.5, -23];
    const pt = (t) => [2 * (1 - t) * t * ctrl[0] + t * t * top[0], 2 * (1 - t) * t * ctrl[1] + t * t * top[1]];
    const trunkA = v ? '#e9dcff' : '#ffe0cc', trunkB = v ? '#9f7fe0' : '#e5917f';
    const N = 11;
    for (let i = 0; i < N; i++) {
      const t0 = i / N, t1 = (i + 1) / N, p0 = pt(t0), p1 = pt(t1);
      const w0 = 2.7 - t0 * 1.1, w1 = (2.7 - t1 * 1.1) * 1.18;
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      c.beginPath();
      c.moveTo(p0[0] + nx * w0, p0[1] + ny * w0); c.lineTo(p1[0] + nx * w1, p1[1] + ny * w1);
      c.lineTo(p1[0] - nx * w1, p1[1] - ny * w1); c.lineTo(p0[0] - nx * w0, p0[1] - ny * w0); c.closePath();
      fs(c, grad(c, p0[0] - nx * w0 * lean, p0[1], p0[0] + nx * w0 * lean, p0[1], [0, trunkA, 1, trunkB]), 0.6);
    }
    const [tx, ty] = top;
    const leafCols = v ? [P.blush, P.pink, P.hot, '#c8379a'] : ['#c9fff0', P.mint, P.teal, '#1f9fa6'];
    // frond: an arched spine with a serrated blade hanging from it
    const leaf = (ang, L, droop, wv) => {
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const ex = tx + dx * L, ey = ty + dy * L * 0.5 + droop;
      const cx = tx + dx * L * 0.55, cy = ty + dy * L * 0.35 - 5.5;
      const Q = (t) => [(1 - t) * (1 - t) * tx + 2 * (1 - t) * t * cx + t * t * ex, (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * cy + t * t * ey];
      const n = 7, up = [], dn = [];
      for (let k = 0; k <= n; k++) {
        const t = k / n, q = Q(t), q2 = Q(Math.min(1, t + 0.02));
        let nx = -(q2[1] - q[1]), ny = q2[0] - q[0];
        const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
        if (ny < 0) { nx = -nx; ny = -ny; }
        const w = (wv || 3.4) * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (k % 2 ? 1 : 0.72);
        up.push(q[0] - nx * w * 0.35, q[1] - ny * w * 0.35);
        dn.push(q[0] + nx * w, q[1] + ny * w);
      }
      c.beginPath(); c.moveTo(tx, ty);
      for (let i = 2; i < up.length; i += 2) c.lineTo(up[i], up[i + 1]);
      for (let i = dn.length - 2; i >= 0; i -= 2) c.lineTo(dn[i], dn[i + 1]);
      c.closePath();
      fs(c, grad(c, tx, ty, ex, ey, [0, leafCols[0], 0.3, leafCols[1], 0.75, leafCols[2], 1, leafCols[3]]), 0.7);
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(cx, cy, ex, ey);
      for (let i = 2; i < dn.length - 2; i += 4) { const q = Q(i / 2 / n); c.moveTo(q[0], q[1]); c.lineTo(dn[i], dn[i + 1]); }
      c.strokeStyle = 'rgba(42,26,76,0.45)'; c.lineWidth = 0.4; c.stroke();
    };
    // back fronds, then coconuts, then front fronds
    leaf(-2.6, 16, 0, 3.6); leaf(-0.55, 16, 0, 3.6); leaf(-1.85, 12, -3, 3.0); leaf(-1.1, 12, -3, 3.0);
    c.beginPath();
    for (const [ox, oy] of [[-1.5, 1.6], [1.5, 1.8], [0, 3.1]]) { c.moveTo(tx + ox + 1.7, ty + oy); c.arc(tx + ox, ty + oy, 1.7, 0, TAU); }
    fs(c, v ? P.peach : P.lav, 0.55);
    leaf(Math.PI + 0.2, 21, 5, 4.4); leaf(-0.2, 21, 5, 4.4); leaf(Math.PI - 0.5, 19, 12, 4.2); leaf(0.5, 19, 12, 4.2);
    leaf(Math.PI * 0.5 + 0.5 * lean, 13, 9, 3.6); leaf(Math.PI * 0.5 - 0.9 * lean, 12, 10, 3.2);
  }
  function columnPose(c, v) {
    const M = marbleGrad(c, -7, 0, 7, 0);
    c.beginPath(); c.rect(-7.6, -2.6, 15.2, 2.6); fs(c, M, 0.8);
    c.beginPath(); c.roundRect(-6.4, -5.0, 12.8, 2.6, 1.2); fs(c, M, 0.8);
    if (v === 0) {
      c.beginPath(); c.rect(-4.8, -34.6, 9.6, 29.8); fs(c, M, 0.8);
      c.beginPath();
      for (let k = -3; k <= 3; k += 2) { c.moveTo(k * 1.3, -33.6); c.lineTo(k * 1.3, -6.0); }
      c.strokeStyle = 'rgba(122,79,208,0.32)'; c.lineWidth = 0.5; c.stroke();
      line(c, [-4.1, -33.5, -4.1, -6], 'rgba(94,231,255,0.8)', 0.5);
      line(c, [4.1, -33.5, 4.1, -6], 'rgba(255,95,193,0.55)', 0.5);
      c.beginPath(); c.rect(-5.8, -36.6, 11.6, 2.1); fs(c, M, 0.7);
      c.beginPath(); c.rect(-7.6, -38.8, 15.2, 2.3); fs(c, M, 0.75);
      for (const sd of [-1, 1]) {
        c.beginPath(); c.arc(sd * 6.4, -35.4, 2.2, 0, TAU); fs(c, '#f6eefc', 0.7);
        c.beginPath(); c.arc(sd * 6.4, -35.4, 1.2, sd > 0 ? 0 : Math.PI, sd > 0 ? 4.6 : Math.PI + 4.6, sd < 0);
        c.strokeStyle = P.ink; c.lineWidth = 0.45; c.stroke();
      }
    } else {
      c.beginPath();
      poly(c, [-4.8, -5.0, -4.8, -20.8, -2.8, -23.6, -1.0, -20.4, 1.2, -24.4, 2.9, -21.2, 4.8, -22.8, 4.8, -5.0], true);
      fs(c, M, 0.8);
      c.beginPath();
      for (let k = -3; k <= 3; k += 2) { c.moveTo(k * 1.3, -20.0); c.lineTo(k * 1.3, -6.0); }
      c.strokeStyle = 'rgba(122,79,208,0.32)'; c.lineWidth = 0.5; c.stroke();
      line(c, [-4.1, -20, -4.1, -6], 'rgba(94,231,255,0.8)', 0.5);
      // fallen drum
      c.beginPath(); c.roundRect(5.6, -6.2, 11.0, 6.2, 1.0); fs(c, marbleGrad(c, 6, -6, 6, 0), 0.75);
      c.beginPath(); c.ellipse(16.6, -3.1, 1.6, 3.1, 0, 0, TAU); fs(c, '#f6eefc', 0.7);
      c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(6.6, -4.8 + k * 1.6); c.lineTo(15.2, -4.8 + k * 1.6); }
      c.strokeStyle = 'rgba(122,79,208,0.3)'; c.lineWidth = 0.45; c.stroke();
      c.beginPath(); poly(c, [-9.6, 0, -8.2, -1.8, -6.6, -0.6, -7.0, 0.4], true); fs(c, '#efe4fa', 0.5);
    }
  }
  function bustPose(c, v) {
    const M = marbleGrad(c, -7, 0, 7, 0);
    c.beginPath(); c.rect(-7.2, -2.4, 14.4, 2.4); fs(c, M, 0.8);
    c.beginPath(); c.rect(-5.4, -13.4, 10.8, 11.0); fs(c, grad(c, -6, 0, 6, 0, [0, '#ffe7f4', 0.5, P.pink, 1, '#d66fb8']), 0.8);
    c.beginPath(); c.rect(-3.6, -11.4, 7.2, 7.0); c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.5; c.stroke();
    c.beginPath(); c.rect(-7.2, -15.4, 14.4, 2.2); fs(c, M, 0.8);
    // shoulders
    c.beginPath(); c.moveTo(-9.6, -15.4); c.quadraticCurveTo(-10.2, -21.4, -4.6, -23.2); c.lineTo(4.0, -23.2);
    c.quadraticCurveTo(9.8, -21.4, 9.4, -15.4); c.quadraticCurveTo(0, -13.6, -9.6, -15.4); c.closePath();
    fs(c, marbleGrad(c, -8, -23, 8, -14), 0.85);
    c.beginPath(); c.moveTo(-6.2, -21.4); c.quadraticCurveTo(-1.8, -17.6, 3.8, -20.4); c.moveTo(-4.6, -18.6); c.quadraticCurveTo(0, -15.8, 5.8, -17.8);
    c.strokeStyle = 'rgba(122,79,208,0.4)'; c.lineWidth = 0.45; c.stroke();
    c.beginPath(); c.moveTo(-2.6, -22.8); c.lineTo(-2.2, -26.8); c.lineTo(2.8, -26.8); c.lineTo(3.0, -22.8); fs(c, '#ece0f8', 0.7);
    // head
    const hx = 0.6, hy = -31.6;
    c.beginPath();
    for (let i = 0; i <= 6; i++) {
      const t = Math.PI * (1.0 + i * 0.13);
      const x = hx - 0.6 + Math.cos(t) * 4.8, y = hy - 0.4 + Math.sin(t) * 5.4;
      c.moveTo(x + 1.7, y); c.arc(x, y, 1.7, 0, TAU);
    }
    fs(c, '#e3d2f6', 0.6);
    c.beginPath(); c.ellipse(hx, hy, 5.0, 5.8, 0, 0, TAU);
    fs(c, rgrad(c, hx - 1.5, hy - 2, 0.3, hx, hy, 6.5, [0, '#ffffff', 0.6, '#f1e6fa', 1, '#c9b0ee']), 0.8);
    c.beginPath(); poly(c, [hx + 4.8, hy - 1.0, hx + 6.3, hy + 1.6, hx + 4.8, hy + 2.0], false); fs(c, '#f1e6fa', 0.6);
    c.beginPath();
    for (let x = -3.4; x <= 3.6; x += 1.75) { c.moveTo(hx + x + 1.3, hy - 4.2); c.arc(hx + x, hy - 4.2, 1.3, 0, TAU); }
    fs(c, '#f6eefc', 0.5);
    if (v === 1) {
      // pixel shades
      c.fillStyle = P.ink;
      c.fillRect(hx - 2.6, hy - 1.8, 9.4, 1.1);
      c.fillRect(hx - 2.0, hy - 0.8, 3.0, 1.1); c.fillRect(hx - 1.4, hy + 0.3, 1.8, 0.8);
      c.fillRect(hx + 2.6, hy - 0.8, 3.4, 1.1); c.fillRect(hx + 3.2, hy + 0.3, 2.2, 0.8);
      c.fillStyle = '#ffffff'; c.fillRect(hx - 1.6, hy - 0.7, 0.6, 0.6); c.fillRect(hx + 3.0, hy - 0.7, 0.6, 0.6);
      c.fillStyle = P.hot; c.fillRect(hx - 0.6, hy - 0.5, 0.6, 0.5); c.fillStyle = P.cyan; c.fillRect(hx + 4.0, hy - 0.5, 0.6, 0.5);
    } else {
      c.beginPath(); c.moveTo(hx + 1.8, hy - 0.6); c.quadraticCurveTo(hx + 3.0, hy - 1.4, hx + 4.2, hy - 0.6);
      c.moveTo(hx + 2.2, hy + 0.4); c.lineTo(hx + 3.8, hy + 0.4);
      c.strokeStyle = 'rgba(42,26,76,0.7)'; c.lineWidth = 0.45; c.stroke();
    }
    c.beginPath(); c.moveTo(hx + 2.2, hy + 3.4); c.lineTo(hx + 4.2, hy + 3.2); c.strokeStyle = 'rgba(42,26,76,0.6)'; c.lineWidth = 0.45; c.stroke();
  }
  const FLOAT_H = 25;
  function spherePose(c, v) {
    const y = -FLOAT_H, r = 8.2;
    if (v === 0) {
      c.beginPath(); c.arc(0, y, r, 0, TAU);
      fs(c, rgrad(c, -3, y - 3.4, 0.4, 0, y, r * 1.05, [0, '#ffffff', 0.25, P.blush, 0.55, P.pink, 0.82, P.lav, 1, P.cyan]), 0.85);
      c.beginPath(); c.ellipse(-3.0, y - 4.0, 2.4, 1.3, -0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
    } else {
      c.save(); c.beginPath(); c.arc(0, y, r, 0, TAU); c.clip();
      c.fillStyle = grad(c, 0, y - r, 0, y + 0.8, [0, '#ffffff', 0.5, '#c4f6ff', 1, P.cyan]); c.fillRect(-r, y - r, r * 2, r * 2);
      c.fillStyle = grad(c, 0, y + 0.8, 0, y + r, [0, '#1d1040', 0.35, P.vio, 0.75, P.hot, 1, P.blush]);
      c.beginPath(); c.ellipse(0, y + r * 0.9, r * 1.4, r * 0.82, 0, Math.PI, TAU); c.lineTo(r * 1.4, y + r); c.lineTo(-r * 1.4, y + r); c.fill();
      c.beginPath();
      for (let k = 1; k <= 3; k++) { c.moveTo(-r, y + 1.4 + k * 1.6); c.quadraticCurveTo(0, y + 0.8 + k * 2.1, r, y + 1.4 + k * 1.6); }
      for (let k = -3; k <= 3; k++) { c.moveTo(k * 1.1, y + 1.2); c.lineTo(k * 3.2, y + r); }
      c.strokeStyle = 'rgba(255,154,213,0.7)'; c.lineWidth = 0.3; c.stroke();
      c.beginPath(); c.arc(1.6, y - 2.0, 2.2, 0, TAU); c.fillStyle = 'rgba(255,242,122,0.9)'; c.fill();
      c.restore();
      c.beginPath(); c.arc(0, y, r, 0, TAU); fs(c, null, 0.85);
      c.beginPath(); c.ellipse(-3.2, y - 4.4, 2.2, 1.1, -0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.95)'; c.fill();
    }
  }
  function pyramidPose(c, th) {
    const yb = -FLOAT_H + 5, hgt = 17, s = 10.2, tilt = 0.42;
    const L = [-0.6, 0.55, 0.6];
    const ll = Math.hypot(L[0], L[1], L[2]);
    const base = [];
    for (let k = 0; k < 4; k++) {
      const ang = th + k * (Math.PI / 2) + Math.PI / 4;
      const x = Math.cos(ang) * s * Math.SQRT2 * 0.72, z = Math.sin(ang) * s * Math.SQRT2 * 0.72;
      base.push({ x, z, sx: x, sy: yb + z * tilt });
    }
    const apex = { x: 0, y: hgt, z: 0, sx: 0, sy: yb - hgt };
    const ramp = ['#5b2a9a', '#9a6cf0', '#ff7fcf', '#ffb38a', '#fff27a'].map(U.hex);
    const faces = [];
    for (let k = 0; k < 4; k++) {
      const a = base[k], b = base[(k + 1) % 4];
      const area = (a.sx - apex.sx) * (b.sy - apex.sy) - (b.sx - apex.sx) * (a.sy - apex.sy);
      if (area <= 0) continue;
      // face normal (3D, y up, z toward the viewer)
      const ux = a.x, uy = -hgt, uz = a.z, vx = b.x, vy = -hgt, vz = b.z;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      if (nx * (a.x + b.x) + nz * (a.z + b.z) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const lit = U.clamp(0.22 + 0.85 * Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ll), 0, 1);
      faces.push([a, b, lit]);
    }
    for (const [a, b, lit] of faces) {
      c.beginPath(); poly(c, [apex.sx, apex.sy, a.sx, a.sy, b.sx, b.sy], true);
      const top = U.rgb(U.ramp(ramp, U.clamp(lit + 0.25, 0, 1))), bot = U.rgb(U.ramp(ramp, U.clamp(lit - 0.25, 0, 1)));
      c.fillStyle = grad(c, 0, apex.sy, 0, Math.max(a.sy, b.sy), [0, top, 1, bot]); c.fill();
      c.strokeStyle = 'rgba(42,26,76,0.35)'; c.lineWidth = 0.35; c.stroke();
    }
    // silhouette
    let minx = base[0], maxx = base[0], low = base[0];
    for (const b of base) { if (b.sx < minx.sx) minx = b; if (b.sx > maxx.sx) maxx = b; if (b.sy > low.sy) low = b; }
    const sil = [apex.sx, apex.sy, maxx.sx, maxx.sy];
    if (low !== maxx && low !== minx) sil.push(low.sx, low.sy);
    sil.push(minx.sx, minx.sy);
    c.beginPath(); poly(c, sil, true); fs(c, null, 0.85);
    c.beginPath(); c.moveTo(apex.sx - 0.4, apex.sy + 1.6); c.lineTo(minx.sx + 1.6, minx.sy - 0.8);
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.55; c.stroke();
  }
  function torusPose(c) {
    const y = -FLOAT_H, rx = 7.4, ry = 3.9, tr = 2.9;
    const N = 40, pts = [];
    for (let i = 0; i < N; i++) { const t = (i / N) * TAU; pts.push([Math.cos(t) * rx, y + Math.sin(t) * ry, Math.sin(t), i / N]); }
    c.beginPath(); c.ellipse(0, y, rx + tr + 0.2, ry + tr + 0.2, 0, 0, TAU); c.strokeStyle = P.ink; c.lineWidth = 1.7; c.stroke();
    const TR = ['#ffd1ea', '#b892ff', '#5ee7ff', '#8ff5d2', '#fff27a', '#ffc1a1', '#ffd1ea'].map(U.hex);
    const order = pts.slice().sort((p, q) => p[2] - q[2]);
    for (const [x, py, , u] of order) {
      const cc = U.ramp(TR, u);
      c.beginPath(); c.arc(x, py, tr, 0, TAU);
      c.fillStyle = rgrad(c, x - tr * 0.4, py - tr * 0.5, 0.2, x, py, tr, [0, '#ffffff', 0.35, U.rgb(cc), 1, U.rgb(U.mul(cc, 0.8))]);
      c.fill();
    }
    c.beginPath(); c.ellipse(0, y - 0.3, rx - tr - 0.2, Math.max(0.5, ry - tr + 0.3), 0, Math.PI, TAU);
    c.strokeStyle = 'rgba(42,26,76,0.65)'; c.lineWidth = 0.5; c.stroke();
  }
  function monitorPose(c) {
    c.beginPath(); poly(c, [-6.4, 0, 6.8, 0, 4.4, -3.4, -4.0, -3.4], true); fs(c, grad(c, 0, -3, 0, 0, [0, '#e7defa', 1, '#b9a8e4']), 0.7);
    c.beginPath(); poly(c, [8.2, -26.2, 12.6, -23.4, 12.6, -6.6, 8.2, -3.6], true); fs(c, grad(c, 8, 0, 13, 0, [0, '#c4b4ea', 1, '#9a86d4']), 0.75);
    c.beginPath(); poly(c, [-10.4, -26.2, 8.2, -26.2, 12.6, -23.4, -6.0, -23.4], true); fs(c, '#f4eefc', 0.7);
    c.beginPath(); c.roundRect(-10.4, -26.2, 18.6, 22.6, 1.6); fs(c, grad(c, -10, -26, 8, -4, [0, '#f6f0ff', 1, '#cdbfec']), 0.8);
    c.save(); c.beginPath(); c.roundRect(-8.6, -24.4, 15.0, 14.6, 2.4); c.clip();
    c.fillStyle = grad(c, 0, -24.4, 0, -15.6, [0, '#2a1a4c', 0.45, P.vio, 0.8, P.hot, 1, P.amber]); c.fillRect(-9, -25, 16, 10);
    c.save(); c.translate(-1.1, -15.8); sunPose(c, 4.4); c.restore();
    c.fillStyle = '#1d1040'; c.fillRect(-9, -15.6, 16, 6);
    c.beginPath();
    for (let k = 0; k < 4; k++) { const yy = -15.6 + k * k * 0.45 + k * 0.5; c.moveTo(-9, yy); c.lineTo(7, yy); }
    for (let k = -4; k <= 4; k++) { c.moveTo(-1.1 + k * 0.9, -15.6); c.lineTo(-1.1 + k * 3.4, -9.6); }
    c.strokeStyle = 'rgba(255,95,193,0.95)'; c.lineWidth = 0.3; c.stroke();
    c.fillStyle = 'rgba(0,0,0,0.16)'; for (let yy = -24.4; yy < -9.8; yy += 0.9) c.fillRect(-9, yy, 16, 0.35);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); poly(c, [-8.6, -24.4, -3.0, -24.4, -8.6, -16.0], true); c.fill();
    c.restore();
    c.beginPath(); c.roundRect(-8.6, -24.4, 15.0, 14.6, 2.4); fs(c, null, 0.75);
    c.beginPath(); c.arc(4.6, -6.4, 0.9, 0, TAU); fs(c, P.mint, 0.4);
    c.beginPath(); c.arc(2.0, -6.4, 0.9, 0, TAU); fs(c, P.hot, 0.4);
    c.beginPath(); for (let k = 0; k < 4; k++) { c.moveTo(-7.6 + k * 1.3, -7.2); c.lineTo(-7.6 + k * 1.3, -5.4); }
    c.strokeStyle = 'rgba(42,26,76,0.45)'; c.lineWidth = 0.45; c.stroke();
  }
  function flamingoPose(c, v) {
    const one = (x, sc, flip) => {
      c.save(); c.translate(x, 0); c.scale(flip ? -sc : sc, sc);
      c.beginPath(); c.moveTo(0.2, -13.6); c.lineTo(0.6, 0); c.moveTo(1.6, -13.4); c.lineTo(3.6, -9.0); c.lineTo(1.4, -7.4);
      c.strokeStyle = P.ink; c.lineWidth = 1.2; c.stroke(); c.strokeStyle = '#e45aa8'; c.lineWidth = 0.55; c.stroke();
      c.beginPath(); poly(c, [-5.6, -16.6, -9.4, -18.4, -8.6, -15.0], true); fs(c, '#f07ac8', 0.6);
      c.beginPath(); c.ellipse(0.4, -16.2, 6.2, 3.7, -0.22, 0, TAU);
      fs(c, grad(c, 0, -20, 0, -12.5, [0, '#ffd1ea', 0.5, P.pink, 1, '#f062b8']), 0.8);
      c.beginPath(); c.ellipse(-0.6, -16.6, 3.6, 2.0, -0.3, 0, TAU); fs(c, P.blush, 0.45);
      c.beginPath(); c.moveTo(-2.6, -16.4); c.lineTo(1.2, -17.0); c.moveTo(-2.0, -15.4); c.lineTo(1.6, -16.0);
      c.strokeStyle = 'rgba(42,26,76,0.35)'; c.lineWidth = 0.35; c.stroke();
      c.beginPath(); c.moveTo(4.8, -17.4); c.bezierCurveTo(8.6, -20.6, 1.6, -23.2, 3.8, -27.4); c.quadraticCurveTo(4.4, -28.6, 5.4, -28.6);
      c.strokeStyle = P.ink; c.lineWidth = 2.7; c.stroke(); c.strokeStyle = P.pink; c.lineWidth = 1.5; c.stroke();
      c.beginPath(); c.arc(5.4, -28.6, 1.85, 0, TAU); fs(c, P.pink, 0.6);
      c.beginPath(); poly(c, [6.8, -29.4, 9.4, -28.0, 8.6, -26.2, 6.6, -27.6], true); fs(c, '#fff0f8', 0.55);
      c.beginPath(); poly(c, [8.4, -27.6, 9.4, -28.0, 8.6, -26.2], true); fs(c, P.ink);
      c.beginPath(); c.arc(5.6, -29.0, 0.4, 0, TAU); fs(c, P.ink);
      c.restore();
    };
    if (v === 0) one(0, 1, false);
    else { one(-5.5, 1, false); one(6.0, 0.9, true); }
  }

  /** Prop sprite + a long sheared sunset shadow (separate canvas, drawn under everything in drawShadow). */
  function bakeProp(l, t, r, b, draw, o) {
    o = o || {};
    const S = bake(l, t, r, b, draw, o);
    const out = { img: S.img, w: S.w, h: S.h, ax: S.ax, ay: S.ay, shadow: null };
    if (o.float) return out;
    const full = S.full, fy = t * K, W = full.width;
    const ext = Math.ceil(t * K * 0.62) + 8;
    const { c, ctx } = U.canvas(W + ext, Math.ceil(fy + t * K * 0.3) + 12);
    const sil = U.tint(full, '#4b2a86');
    ctx.filter = 'blur(' + (0.6 * K) + 'px)';
    ctx.setTransform(1, 0, -0.62, -0.28, 0.62 * fy, 1.28 * fy);
    ctx.drawImage(sil, 0, 0, W, fy, 0, 0, W, fy);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none';
    out.shadow = { img: c, w: c.width / K, h: c.height / K, ox: l, oy: t };
    return out;
  }

  /* ================= ground ================= */
  const BQ = 32, WQ = 16, WT = 0.625;
  const REG_MARBLE = 0, REG_CHECK = 1, REG_GRID = 2, REG_TERRAZZO = 3;
  const GRID_BASE = '#6d49b8', TERRAZZO_BASE = '#c6f4e3', CHECK_A = '#fff0f8', CHECK_B = '#cdb3f7';
  const WATER_RAMP = ['#93f1ff', '#62dcf7', '#40c6ee', '#2cafe2', '#2399d6'];
  function regionAt(x, y) {
    const qx = U.fbm(x / 1300, y / 1300, 501, 2) - 0.5;
    const qy = U.fbm(x / 1300 + 7.3, y / 1300 - 3.1, 502, 2) - 0.5;
    const X = x / 860 + qx * 1.4, Y = y / 860 + qy * 1.4;
    let best = 0, bv = -1;
    for (let i = 0; i < 4; i++) {
      const v = U.fbm(X + i * 13.7, Y - i * 9.1, 11 + i * 12, 2);
      if (v > bv) { bv = v; best = i; }
    }
    return best;
  }
  function waterCell(cx, cy) {
    const x = (cx + 0.5) * WQ, y = (cy + 0.5) * WQ;
    if (G.nearSpawn(x, y, 110)) return 0;
    return U.fbm(x / 420 + 3.3, y / 420 - 1.7, 77, 3) > WT ? 1 : 0;
  }
  const waterAt = (x, y) => waterCell(Math.floor(x / WQ), Math.floor(y / WQ));
  const blockAt = (x, y) => regionAt((Math.floor(x / BQ) + 0.5) * BQ, (Math.floor(y / BQ) + 0.5) * BQ);

  let TEX = null; // patterns are created per chunk ctx (cheap) from these canvases
  function makeRGBA(w, h, fn) {
    const { c, ctx } = U.canvas(w, h);
    const img = ctx.createImageData(w, h), d = img.data, o = [0, 0, 0, 0];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        o[0] = o[1] = o[2] = 0; o[3] = 255;
        fn(x, y, o);
        const i = (y * w + x) * 4;
        d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = o[3];
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  function buildTextures() {
    const N = 256;
    const vein = new Float32Array(N * N), vein2 = new Float32Array(N * N), cloud = new Float32Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const X = (x / N) * 4, Y = (y / N) * 4;
        const w = U.fbmTile(X, Y, 4, 91, 3);
        const n = U.fbmTile(X + w * 1.6, Y + w * 1.2, 4, 17, 4);
        const m = U.fbmTile(X * 2 + w, Y * 2, 8, 29, 3);
        const i = y * N + x;
        vein[i] = 1 - U.smoothstep(0, 0.04, Math.abs(n - 0.5));
        vein2[i] = 1 - U.smoothstep(0, 0.025, Math.abs(m - 0.5));
        cloud[i] = U.fbmTile(X, Y, 4, 33, 3);
      }
    }
    const marble = (a, b, v) => {
      a = U.hex(a); b = U.hex(b); v = U.hex(v);
      return makeRGBA(N, N, (x, y, o) => {
        const i = y * N + x;
        let col = U.mix(a, b, U.smoothstep(0.3, 0.75, cloud[i]));
        col = U.mix(col, v, vein[i] * 0.55 + vein2[i] * 0.22);
        o[0] = col[0]; o[1] = col[1]; o[2] = col[2];
      });
    };
    const marbles = [
      marble('#ffdcee', '#f5b8da', '#c76aa8'),
      marble('#eee2ff', '#cfb8f6', '#8a62c8'),
      marble('#ffe6d8', '#f8c2b6', '#cf7f90'),
    ];
    // polished gloss: soft diagonal light bands, tileable (period 128 px = 256 units)
    const gloss = makeRGBA(128, 128, (x, y, o) => {
      const t = ((x + y) % 128) / 128;
      const a = Math.exp(-(((t - 0.3) / 0.07) ** 2)) * 0.2 + Math.exp(-(((t - 0.43) / 0.018) ** 2)) * 0.14;
      o[0] = o[1] = o[2] = 255; o[3] = a * 255;
    });
    // caustic web for the pools (period 256 px = 64 units)
    const wo = {};
    const caustic = makeRGBA(N, N, (x, y, o) => {
      const X = (x / N) * 8, Y = (y / N) * 8;
      const wx = U.fbmTile(X / 2, Y / 2, 4, 61, 2) - 0.5, wy = U.fbmTile(X / 2 + 1.7, Y / 2, 4, 62, 2) - 0.5;
      U.worley(X + wx * 1.4, Y + wy * 1.4, 5151, 8, wo);
      const e1 = 1 - U.smoothstep(0.0, 0.1, wo.f2 - wo.f1);
      o[0] = 235; o[1] = 255; o[2] = 255; o[3] = e1 * 0.55 * 255;
    });
    return { marbles, gloss, caustic };
  }
  function pat(ctx, canvas, scale) {
    const p = ctx.createPattern(canvas, 'repeat');
    if (p.setTransform) p.setTransform(new DOMMatrix([scale, 0, 0, scale, 0, 0]));
    return p;
  }
  function blockPath(list) {
    const p = new Path2D();
    for (let i = 0; i < list.length; i += 2) p.rect(list[i], list[i + 1], BQ, BQ);
    return p;
  }
  function sparkle(ctx, x, y, r) {
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r * 0.7, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r * 0.7, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.closePath();
  }
  function sunInlay(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y + 1.2, r + 3.4, 0, TAU); ctx.fillStyle = 'rgba(75,42,134,0.22)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r + 3.4, 0, TAU); ctx.fillStyle = '#fff6fb'; ctx.fill();
    ctx.strokeStyle = 'rgba(42,26,76,0.5)'; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * TAU, r0 = r + 3.4, r1 = r + (i % 2 ? 6.5 : 9.5);
      ctx.moveTo(x + Math.cos(t - 0.07) * r0, y + Math.sin(t - 0.07) * r0); ctx.lineTo(x + Math.cos(t) * r1, y + Math.sin(t) * r1); ctx.lineTo(x + Math.cos(t + 0.07) * r0, y + Math.sin(t + 0.07) * r0);
    }
    ctx.fillStyle = i2c(0.75); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.scale(r / 10, r / 10);
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU);
    ctx.fillStyle = grad(ctx, 0, -10, 0, 10, [0, '#fff7b0', 0.3, P.sun, 0.55, P.amber, 0.8, P.hot, 1, '#b13a9e']); ctx.fill();
    ctx.fillStyle = '#fff6fb';
    for (const [yy, hh] of [[1.2, 0.8], [3.2, 1.1], [5.4, 1.4], [7.6, 1.6]]) ctx.fillRect(-10, yy, 20, hh);
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = 'rgba(42,26,76,0.55)'; ctx.lineWidth = 0.5; ctx.stroke();
  }
  function i2c(a) { return 'rgba(255,95,193,' + a + ')'; }

  function* groundGen(ctx, info) {
    if (!TEX) TEX = buildTextures();
    const S = info.size, wx = info.wx, wy = info.wy, x1 = wx + S, y1 = wy + S;
    const NB = S / BQ + 2, bx0 = Math.floor(wx / BQ) - 1, by0 = Math.floor(wy / BQ) - 1;
    const reg = new Int8Array(NB * NB);
    for (let j = 0; j < NB; j++) for (let i = 0; i < NB; i++) reg[j * NB + i] = regionAt((bx0 + i + 0.5) * BQ, (by0 + j + 0.5) * BQ);
    const R = (bx, by) => {
      const i = bx - bx0, j = by - by0;
      if (i < 0 || j < 0 || i >= NB || j >= NB) return regionAt((bx + 0.5) * BQ, (by + 0.5) * BQ);
      return reg[j * NB + i];
    };
    const WM = 4, NW = S / WQ + WM * 2, cx0 = Math.floor(wx / WQ) - WM, cy0 = Math.floor(wy / WQ) - WM;
    const wat = new Uint8Array(NW * NW);
    let anyW = false;
    for (let j = 0; j < NW; j++) for (let i = 0; i < NW; i++) { const w = waterCell(cx0 + i, cy0 + j); wat[j * NW + i] = w; if (w) anyW = true; }
    const Wc = (cx, cy) => {
      const i = cx - cx0, j = cy - cy0;
      if (i < 0 || j < 0 || i >= NW || j >= NW) return waterCell(cx, cy);
      return wat[j * NW + i];
    };
    yield;

    // ---- 1. block bases ----
    const lists = [[], [], [], []];
    for (let j = 0; j < NB; j++) for (let i = 0; i < NB; i++) lists[reg[j * NB + i]].push((bx0 + i) * BQ, (by0 + j) * BQ);
    const mPats = TEX.marbles.map((m) => pat(ctx, m, 0.5));
    // marble slabs
    const L0 = lists[REG_MARBLE];
    for (let i = 0; i < L0.length; i += 2) {
      // marble colour comes in large patches (one stone per hall), with a few odd slabs at patch edges;
      // inset diamonds follow a regular 4-slab rhythm instead of random placement
      const x = L0[i], y = L0[i + 1], n = U.fbm(x / 300 + 0.5, y / 300, 404, 2) + (U.hash2(x / BQ, y / BQ, 404) - 0.5) * 0.06;
      const h = n < 0.52 ? 0 : n < 0.6 ? 1 : 2;
      ctx.fillStyle = mPats[h];
      ctx.fillRect(x, y, BQ, BQ);
      const gx = Math.round(x / BQ), gy = Math.round(y / BQ);
      if ((((gx % 4) + 4) % 4) === 1 && (((gy % 4) + 4) % 4) === 1) {
        ctx.beginPath(); poly(ctx, [x + 16, y + 3.5, x + 28.5, y + 16, x + 16, y + 28.5, x + 3.5, y + 16], true);
        ctx.fillStyle = mPats[h === 0 ? 1 : 0]; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 0.9; ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 16, y + 16, 2.2, 0, TAU); ctx.fillStyle = P.cyan; ctx.fill();
        ctx.strokeStyle = 'rgba(42,26,76,0.4)'; ctx.lineWidth = 0.4; ctx.stroke();
      }
    }
    // checker plazas
    const L1 = lists[REG_CHECK];
    if (L1.length) {
      ctx.fillStyle = CHECK_A;
      for (let i = 0; i < L1.length; i += 2) ctx.fillRect(L1[i], L1[i + 1], BQ, BQ);
      ctx.beginPath();
      for (let i = 0; i < L1.length; i += 2) { const x = L1[i], y = L1[i + 1]; ctx.rect(x, y, 16, 16); ctx.rect(x + 16, y + 16, 16, 16); }
      ctx.fillStyle = CHECK_B; ctx.fill();
    }
    // pastel grid
    const L2 = lists[REG_GRID];
    if (L2.length) {
      ctx.fillStyle = GRID_BASE;
      for (let i = 0; i < L2.length; i += 2) ctx.fillRect(L2[i], L2[i + 1], BQ, BQ);
      ctx.save(); ctx.clip(blockPath(L2));
      const gx0 = Math.floor(wx / 8) * 8 - 8, gy0 = Math.floor(wy / 8) * 8 - 8;
      ctx.beginPath();
      for (let x = gx0; x <= x1 + 8; x += 8) { if (x % 32 === 0) continue; ctx.moveTo(x, wy - 8); ctx.lineTo(x, y1 + 8); }
      for (let y = gy0; y <= y1 + 8; y += 8) { if (y % 32 === 0) continue; ctx.moveTo(wx - 8, y); ctx.lineTo(x1 + 8, y); }
      ctx.strokeStyle = 'rgba(255,154,213,0.3)'; ctx.lineWidth = 0.4; ctx.stroke();
      ctx.beginPath();
      for (let x = Math.floor(wx / 32) * 32 - 32; x <= x1 + 32; x += 32) { ctx.moveTo(x, wy - 8); ctx.lineTo(x, y1 + 8); }
      for (let y = Math.floor(wy / 32) * 32 - 32; y <= y1 + 32; y += 32) { ctx.moveTo(wx - 8, y); ctx.lineTo(x1 + 8, y); }
      ctx.strokeStyle = 'rgba(255,95,193,0.28)'; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.strokeStyle = '#ff9ad5'; ctx.lineWidth = 0.65; ctx.stroke();
      ctx.beginPath();
      for (let x = Math.floor(wx / 64) * 64 - 64; x <= x1 + 64; x += 64) {
        for (let y = Math.floor(wy / 64) * 64 - 64; y <= y1 + 64; y += 64) { ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); }
      }
      ctx.strokeStyle = P.cyan; ctx.lineWidth = 0.9; ctx.stroke();
      ctx.restore();
    }
    // memphis terrazzo
    const L3 = lists[REG_TERRAZZO];
    if (L3.length) {
      ctx.fillStyle = TERRAZZO_BASE;
      for (let i = 0; i < L3.length; i += 2) ctx.fillRect(L3[i], L3[i + 1], BQ, BQ);
    }
    yield;
    if (L3.length) {
      ctx.save(); ctx.clip(blockPath(L3));
      // terrazzo chips: mostly quiet tints of the base, gathered in drifts (cluster noise); bright chips are rare
      const CH = ['#ade9d6', '#d4f7ea', '#b9dcf2', '#f1d6ea', '#f4fffb', '#ff7fcf', '#8a64d8', '#7fe4f5'];
      const paths = CH.map(() => new Path2D());
      G.scatter(info, 5.2, 6161, 2, (x, y, rng) => {
        const cl = U.smoothstep(0.45, 0.72, U.fbm(x / 150, y / 150, 6363, 2));
        if (!rng.chance(0.03 + 0.42 * cl)) return;
        const r = rng.range(0.4, 1.25) * (0.8 + cl * 0.5), n = rng.int(3, 5), a0 = rng.next() * TAU;
        const pick = rng.next();
        const p = paths[pick < 0.03 * cl ? 6 : pick < 0.1 * cl ? 5 : pick < 0.14 * cl ? 7 : rng.int(0, 4)];
        for (let k = 0; k < n; k++) {
          const t = a0 + (k / n) * TAU, rr = r * rng.range(0.6, 1.1);
          if (k) p.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr); else p.moveTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr);
        }
        p.closePath();
      });
      CH.forEach((col, i) => { ctx.fillStyle = col; ctx.fill(paths[i]); });
      // memphis squiggles + confetti shapes
      G.scatter(info, 58, 6262, 14, (x, y, rng) => {
        // memphis motifs only inside the drifts, as small groups
        if (!rng.chance(0.55 * U.smoothstep(0.52, 0.72, U.fbm(x / 150, y / 150, 6363, 2)))) return;
        const k = rng.int(0, 2), col = rng.pick([P.hot, P.vio, P.aqua]);
        ctx.beginPath();
        if (k === 0) { ctx.moveTo(x - 7, y); for (let i = 1; i <= 7; i++) ctx.lineTo(x - 7 + i * 2, y + (i % 2 ? -2 : 2)); }
        else if (k === 1) { ctx.arc(x, y, 4, Math.PI, TAU); }
        else { poly(ctx, [x, y - 4, x + 4, y + 3, x - 4, y + 3], true); }
        ctx.strokeStyle = col; ctx.lineWidth = 1.0; ctx.stroke();
      });
      ctx.restore();
    }
    // polished gloss over marble + checker
    if (L0.length || L1.length) {
      ctx.save();
      ctx.fillStyle = pat(ctx, TEX.gloss, 2);
      ctx.fill(blockPath(L0.concat(L1)));
      ctx.restore();
    }
    // slab bevels + grout (marble)
    if (L0.length) {
      ctx.beginPath(); for (let i = 0; i < L0.length; i += 2) { ctx.rect(L0[i], L0[i + 1], BQ, 0.7); ctx.rect(L0[i], L0[i + 1], 0.7, BQ); }
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
      ctx.beginPath(); for (let i = 0; i < L0.length; i += 2) { ctx.rect(L0[i], L0[i + 1] + BQ - 0.8, BQ, 0.8); ctx.rect(L0[i] + BQ - 0.8, L0[i + 1], 0.8, BQ); }
      ctx.fillStyle = 'rgba(122,60,150,0.28)'; ctx.fill();
    }
    yield;

    // ---- 2. decals ----
    ctx.beginPath();
    G.scatter(info, 46, 7171, 4, (x, y, rng) => {
      // glints only on polished stone, a few per slab group
      if (!rng.chance(0.22)) return;
      const rg = blockAt(x, y);
      if (rg !== REG_MARBLE && rg !== REG_CHECK) return;
      sparkle(ctx, x, y, rng.range(1.6, 2.8));
    });
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    ctx.beginPath();
    G.scatter(info, 52, 7272, 6, (x, y, rng) => {
      if (!rng.chance(0.6 * U.smoothstep(0.48, 0.7, U.fbm(x / 170, y / 170, 7373, 2))) || blockAt(x, y) !== REG_GRID) return;
      const k = rng.int(0, 2), r = rng.range(2.4, 4.2);
      if (k === 0) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
      else if (k === 1) poly(ctx, [x, y - r, x + r * 0.9, y + r * 0.6, x - r * 0.9, y + r * 0.6], true);
      else { sparkle(ctx, x, y, r); }
    });
    ctx.strokeStyle = 'rgba(94,231,255,0.8)'; ctx.lineWidth = 0.55; ctx.stroke();
    G.scatter(info, 420, 8181, 46, (x, y, rng) => {
      if (!rng.chance(0.6) || G.nearSpawn(x, y, 50)) return;
      const r = rng.range(15, 22);
      const reg0 = blockAt(x, y);
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) {
        if (waterAt(x + dx * (r + 10), y + dy * (r + 10))) return;
        if (blockAt(x + dx * (r + 6), y + dy * (r + 6)) !== reg0) return;
      }
      if (reg0 === REG_GRID) {
        ctx.beginPath(); ctx.arc(x, y, r + 4, 0, TAU);
        ctx.strokeStyle = 'rgba(94,231,255,0.25)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = P.cyan; ctx.lineWidth = 0.7; ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
        ctx.beginPath();
        for (let k = 0; k < 7; k++) { const yy = y - r + k * k * 0.9 + k * 2.4; ctx.moveTo(x - r, yy); ctx.lineTo(x + r, yy); }
        ctx.strokeStyle = '#ff9ad5'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.restore();
      } else if (reg0 === REG_TERRAZZO) {
        ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, TAU); ctx.fillStyle = '#ffd1ea'; ctx.fill();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 0.9; ctx.stroke();
        ctx.beginPath(); poly(ctx, [x - r, y + r * 0.7, x + r * 0.2, y - r * 0.9, x + r, y + r * 0.7], true);
        ctx.strokeStyle = P.aqua; ctx.lineWidth = 1.4; ctx.stroke();
      } else sunInlay(ctx, x, y, r);
    });
    yield;

    // ---- 3. white marble trims between regions (raised; shadow falls to the lower right) ----
    const vEdges = [], hEdges = [];
    for (let j = 0; j < NB; j++) {
      for (let i = 0; i < NB; i++) {
        const a = reg[j * NB + i];
        if (i < NB - 1 && reg[j * NB + i + 1] !== a) vEdges.push((bx0 + i + 1) * BQ, (by0 + j) * BQ);
        if (j < NB - 1 && reg[(j + 1) * NB + i] !== a) hEdges.push((bx0 + i) * BQ, (by0 + j + 1) * BQ);
      }
    }
    if (vEdges.length || hEdges.length) {
      const TW = 1.4;
      ctx.beginPath();
      for (let i = 0; i < vEdges.length; i += 2) ctx.rect(vEdges[i] + TW, vEdges[i + 1] - TW + 1.0, 1.1, BQ + TW * 2);
      for (let i = 0; i < hEdges.length; i += 2) ctx.rect(hEdges[i] - TW + 1.0, hEdges[i + 1] + TW, BQ + TW * 2, 1.1);
      ctx.fillStyle = 'rgba(75,42,134,0.3)'; ctx.fill();
      ctx.beginPath();
      for (let i = 0; i < vEdges.length; i += 2) ctx.rect(vEdges[i] - TW, vEdges[i + 1] - TW, TW * 2, BQ + TW * 2);
      for (let i = 0; i < hEdges.length; i += 2) ctx.rect(hEdges[i] - TW, hEdges[i + 1] - TW, BQ + TW * 2, TW * 2);
      ctx.fillStyle = '#fff6fb'; ctx.fill();
      ctx.beginPath();
      for (let i = 0; i < vEdges.length; i += 2) for (let k = 0; k < BQ; k += 16) { ctx.moveTo(vEdges[i] - TW, vEdges[i + 1] + k); ctx.lineTo(vEdges[i] + TW, vEdges[i + 1] + k); }
      for (let i = 0; i < hEdges.length; i += 2) for (let k = 0; k < BQ; k += 16) { ctx.moveTo(hEdges[i] + k, hEdges[i + 1] - TW); ctx.lineTo(hEdges[i] + k, hEdges[i + 1] + TW); }
      ctx.strokeStyle = 'rgba(122,79,208,0.45)'; ctx.lineWidth = 0.35; ctx.stroke();
    }
    if (!anyW) return;
    yield;

    // ---- 4. pools ----
    const dist = new Uint8Array(NW * NW);
    for (let k = 0; k < NW * NW; k++) dist[k] = wat[k] ? 9 : 0;
    for (let pass = 0; pass < 4; pass++) {
      for (let j = 0; j < NW; j++) for (let i = 0; i < NW; i++) {
        const k = j * NW + i;
        if (!dist[k]) continue;
        let m = dist[k];
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const ii = i + di, jj = j + dj;
          const v = ii < 0 || jj < 0 || ii >= NW || jj >= NW ? 9 : dist[jj * NW + ii];
          if (v + 1 < m) m = v + 1;
        }
        dist[k] = m;
      }
    }
    const water = new Path2D();
    const edges = { n: [], s: [], w: [], e: [] };
    for (let j = WM - 1; j < NW - WM + 1; j++) {
      for (let i = WM - 1; i < NW - WM + 1; i++) {
        if (!wat[j * NW + i]) continue;
        const cx = cx0 + i, cy = cy0 + j, x = cx * WQ, y = cy * WQ;
        water.rect(x, y, WQ, WQ);
        if (!Wc(cx, cy - 1)) edges.n.push(x, y);
        if (!Wc(cx, cy + 1)) edges.s.push(x, y + WQ);
        if (!Wc(cx - 1, cy)) edges.w.push(x, y);
        if (!Wc(cx + 1, cy)) edges.e.push(x + WQ, y);
      }
    }
    // depth (smooth, from a tiny per-cell canvas)
    const dc = U.canvas(NW, NW), dd = dc.ctx.createImageData(NW, NW);
    const ramp = WATER_RAMP.map(U.hex);
    for (let k = 0; k < NW * NW; k++) {
      const col = ramp[Math.min(4, Math.max(0, (dist[k] || 1) - 1))];
      dd.data[k * 4] = col[0]; dd.data[k * 4 + 1] = col[1]; dd.data[k * 4 + 2] = col[2]; dd.data[k * 4 + 3] = 255;
    }
    dc.ctx.putImageData(dd, 0, 0);
    ctx.save();
    ctx.clip(water);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(dc.c, cx0 * WQ + WQ / 2, cy0 * WQ + WQ / 2, NW * WQ, NW * WQ);
    ctx.drawImage(dc.c, 0, 0, NW, NW, cx0 * WQ - WQ / 2, cy0 * WQ - WQ / 2, NW * WQ, NW * WQ);
    ctx.globalAlpha = 0.5; ctx.drawImage(dc.c, cx0 * WQ, cy0 * WQ, NW * WQ, NW * WQ); ctx.globalAlpha = 1;
    ctx.fillStyle = pat(ctx, TEX.caustic, 0.25);
    ctx.fillRect(wx - 4, wy - 4, S + 8, S + 8);
    // glints
    ctx.beginPath();
    const ctx2 = new Path2D();
    G.scatter(info, 11, 9191, 8, (x, y, rng) => {
      if (!rng.chance(0.5)) return;
      if (!waterAt(x - 6, y) || !waterAt(x + 6, y) || !waterAt(x, y - 5) || !waterAt(x, y + 5)) return;
      const L = rng.range(3, 9), p = rng.chance(0.3) ? ctx2 : null;
      if (p) { p.moveTo(x - L / 2, y); p.quadraticCurveTo(x - L / 4, y - 0.9, x, y); p.quadraticCurveTo(x + L / 4, y + 0.9, x + L / 2, y); }
      else { ctx.moveTo(x - L / 2, y); ctx.quadraticCurveTo(x - L / 4, y - 0.9, x, y); ctx.quadraticCurveTo(x + L / 4, y + 0.9, x + L / 2, y); }
    });
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,209,234,0.9)'; ctx.lineWidth = 0.6; ctx.stroke(ctx2);
    // waterline mosaic band
    const CW = 1.7;
    const band = [new Path2D(), new Path2D()];
    const tiles = (x, y, horiz, inset) => {
      for (let k = -1; k < WQ / 2 + 1; k++) {
        const b = band[(Math.round((horiz ? x : y) / 2) + k) & 1 ? 1 : 0];
        if (horiz) b.rect(x + k * 2 + 0.15, y + inset, 1.7, 1.6); else b.rect(x + inset, y + k * 2 + 0.15, 1.6, 1.7);
      }
    };
    for (let i = 0; i < edges.n.length; i += 2) tiles(edges.n[i], edges.n[i + 1], true, CW);
    for (let i = 0; i < edges.s.length; i += 2) tiles(edges.s[i], edges.s[i + 1], true, -CW - 1.6);
    for (let i = 0; i < edges.w.length; i += 2) tiles(edges.w[i], edges.w[i + 1], false, CW);
    for (let i = 0; i < edges.e.length; i += 2) tiles(edges.e[i], edges.e[i + 1], false, -CW - 1.6);
    ctx.fillStyle = '#2f63d8'; ctx.fill(band[0]);
    ctx.fillStyle = '#ff7fcf'; ctx.fill(band[1]);
    // coping shadow (sun from the upper left -> north and west rims shade the water)
    ctx.beginPath();
    for (let i = 0; i < edges.n.length; i += 2) ctx.rect(edges.n[i] - 2, edges.n[i + 1], WQ + 4, 4.6);
    for (let i = 0; i < edges.w.length; i += 2) ctx.rect(edges.w[i], edges.w[i + 1] - 2, 4.6, WQ + 4);
    ctx.fillStyle = 'rgba(42,26,120,0.22)'; ctx.fill();
    ctx.restore();
    // coping (white rim straddling the pool edge)
    const CP = 1.7;
    ctx.beginPath();
    for (let i = 0; i < edges.s.length; i += 2) ctx.rect(edges.s[i] - CP + 0.8, edges.s[i + 1] + CP, WQ + CP * 2, 1.0);
    for (let i = 0; i < edges.e.length; i += 2) ctx.rect(edges.e[i] + CP, edges.e[i + 1] - CP + 0.8, 1.0, WQ + CP * 2);
    ctx.fillStyle = 'rgba(75,42,134,0.3)'; ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < edges.n.length; i += 2) ctx.rect(edges.n[i] - CP, edges.n[i + 1] - CP, WQ + CP * 2, CP * 2);
    for (let i = 0; i < edges.s.length; i += 2) ctx.rect(edges.s[i] - CP, edges.s[i + 1] - CP, WQ + CP * 2, CP * 2);
    for (let i = 0; i < edges.w.length; i += 2) ctx.rect(edges.w[i] - CP, edges.w[i + 1] - CP, CP * 2, WQ + CP * 2);
    for (let i = 0; i < edges.e.length; i += 2) ctx.rect(edges.e[i] - CP, edges.e[i + 1] - CP, CP * 2, WQ + CP * 2);
    ctx.fillStyle = '#fffafd'; ctx.fill();
    ctx.beginPath();
    for (const k of ['n', 's']) for (let i = 0; i < edges[k].length; i += 2) for (let q = 0; q <= WQ; q += 8) { ctx.moveTo(edges[k][i] + q, edges[k][i + 1] - CP); ctx.lineTo(edges[k][i] + q, edges[k][i + 1] + CP); }
    for (const k of ['w', 'e']) for (let i = 0; i < edges[k].length; i += 2) for (let q = 0; q <= WQ; q += 8) { ctx.moveTo(edges[k][i] - CP, edges[k][i + 1] + q); ctx.lineTo(edges[k][i] + CP, edges[k][i + 1] + q); }
    ctx.strokeStyle = 'rgba(122,79,208,0.4)'; ctx.lineWidth = 0.35; ctx.stroke();
  }

  /* ================= runtime state ================= */
  let HERO = null, CRIT = null, DOLPH = null, COLO = null, GEMS = null, GEMB = null, DISC = null, TRAIL = null, SUN = null, PROPS = null;
  let SHADOW = null, GLOW = null, BEAM = null, NOISE = null;
  let NUM = null, numCheck = 0;
  let OVL = null, OVLkey = '';
  let glitchReq = 0, glitchT0 = -99, glitchDur = 0;

  /* ---- batched particles (flushed before numbers / in the world overlay) ---- */
  const PB = new Map();
  let pbPending = false, pbView = null, pbLast = null;
  /** The renderer culls particles with this margin; the last one it will draw flushes the batch. */
  function lastVisible(view) {
    const ps = view.game && view.game.particles;
    if (!ps) return null;
    for (let i = ps.length - 1; i >= 0; i--) {
      const o = ps[i];
      if (o.x > view.x0 - 60 && o.x < view.x1 + 60 && o.y > view.y0 - 60 && o.y < view.y1 + 120) return o;
    }
    return null;
  }
  function bucket(kind, color, alpha) {
    const aq = alpha > 0.8 ? 4 : alpha > 0.55 ? 3 : alpha > 0.3 ? 2 : 1;
    const key = kind + color + aq;
    let b = PB.get(key);
    if (!b) { b = { kind, color, a: aq / 4, d: [] }; PB.set(key, b); }
    pbPending = true;
    return b;
  }
  function pbFlush(ctx) {
    if (!pbPending) return;
    pbPending = false;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const b of PB.values()) {
      const D = b.d;
      if (!D.length) continue;
      ctx.globalAlpha = b.a;
      ctx.beginPath();
      if (b.kind === 'tri' || b.kind === 'chunk') {
        const n = b.kind === 'tri' ? 6 : 8;
        for (let i = 0; i < D.length; i += n) { ctx.moveTo(D[i], D[i + 1]); for (let q = 2; q < n; q += 2) ctx.lineTo(D[i + q], D[i + q + 1]); ctx.closePath(); }
        ctx.fillStyle = b.color; ctx.fill();
        ctx.strokeStyle = P.ink; ctx.lineWidth = b.kind === 'chunk' ? 0.6 : 0.35; ctx.stroke();
      } else if (b.kind === 'sq') {
        for (let i = 0; i < D.length; i += 3) ctx.rect(D[i] - D[i + 2] / 2, D[i + 1] - D[i + 2] / 2, D[i + 2], D[i + 2]);
        ctx.fillStyle = b.color; ctx.fill();
      } else if (b.kind === 'ring' || b.kind === 'ringT') {
        for (let i = 0; i < D.length; i += 4) { ctx.moveTo(D[i] + D[i + 2], D[i + 1]); ctx.ellipse(D[i], D[i + 1], D[i + 2], D[i + 3], 0, 0, TAU); }
        // ink edge first so pastel rings still read on pale floors (same deep-indigo line as every sprite)
        ctx.strokeStyle = P.ink; ctx.globalAlpha = b.a * 0.32; ctx.lineWidth = (b.kind === 'ring' ? 1.8 : 1.0) + 0.9; ctx.stroke();
        ctx.globalAlpha = b.a;
        ctx.strokeStyle = b.color; ctx.lineWidth = b.kind === 'ring' ? 1.8 : 1.0; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = b.a * 0.9; ctx.lineWidth = b.kind === 'ring' ? 0.55 : 0.35; ctx.stroke();
      } else if (b.kind === 'star') {
        for (let i = 0; i < D.length; i += 3) sparkle(ctx, D[i], D[i + 1], D[i + 2]);
        ctx.fillStyle = b.color; ctx.fill();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 0.3; ctx.stroke();
      } else {
        for (let i = 0; i < D.length; i += 4) { ctx.moveTo(D[i], D[i + 1]); ctx.lineTo(D[i + 2], D[i + 3]); }
        const w = b.kind === 'line2' ? 1.3 : 0.8;
        ctx.strokeStyle = P.ink; ctx.globalAlpha = b.a * 0.4; ctx.lineWidth = w + 0.9; ctx.stroke();
        ctx.strokeStyle = b.color; ctx.globalAlpha = b.a; ctx.lineWidth = w; ctx.stroke();
      }
      D.length = 0;
    }
    ctx.restore();
  }

  /* ---- chrome digits (baked lazily once the web font is there) ---- */
  function fontLoaded(fam) {
    if (!document.fonts) return false;
    let ok = false;
    document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === fam && f.status === 'loaded') ok = true; });
    return ok;
  }
  function bakeDigits(fam, real) {
    const mk = (stops, shade) => {
      const fs0 = 46, H = 72, pad = 12;
      const m = U.canvas(8, 8).ctx;
      m.font = fs0 + 'px ' + fam;
      const adv = [], xs = [];
      let W = 0;
      for (let i = 0; i < 10; i++) { const a = Math.ceil(m.measureText(String(i)).width); adv.push(a); xs.push(W); W += a + pad * 2; }
      const { c, ctx } = U.canvas(W, H);
      ctx.font = m.font; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
      const y = H / 2 + 2;
      const g = ctx.createLinearGradient(0, y - fs0 * 0.42, 0, y + fs0 * 0.42);
      for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
      for (let i = 0; i < 10; i++) {
        const x = xs[i] + pad;
        ctx.strokeStyle = P.ink; ctx.lineWidth = 9; ctx.strokeText(String(i), x + 3, y + 3);
        ctx.fillStyle = shade; ctx.fillText(String(i), x + 3, y + 3);
        ctx.lineWidth = 7; ctx.strokeText(String(i), x, y);
        ctx.fillStyle = g; ctx.fillText(String(i), x, y);
      }
      return { c, xs, adv, pad, H };
    };
    return {
      real,
      norm: mk([0, '#ffffff', 0.45, '#9ff0ff', 0.5, '#4b2a86', 0.56, '#ff7fcf', 1, '#ffe8f6'], P.hot),
      crit: mk([0, '#fffbe0', 0.45, P.sun, 0.5, '#c0399e', 0.56, P.amber, 1, '#fff2b0'], P.cyan),
    };
  }
  function digits() {
    if (NUM && NUM.real) return NUM;
    if (--numCheck <= 0) {
      numCheck = 20;
      if (fontLoaded('Rubik Mono One')) NUM = bakeDigits("'Rubik Mono One', sans-serif", true);
    }
    if (!NUM) NUM = bakeDigits("900 'Arial Black', 'Segoe UI', sans-serif", false);
    return NUM;
  }

  /* ---- particle helpers ---- */
  function spark(game, x, y, z, ang, spd, color, life, size) {
    game.addParticle({ x, y, z, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd * 0.7, life, size: size || 2, color, kind: 'vspark', drag: 3.5 });
  }
  function ring(game, x, y, z, r0, r1, color, life, sq, thin) {
    game.addParticle({ x, y, z, r0, r1, color, life, kind: 'ring', sq: sq || 0.45, thin: !!thin, drag: 0 });
  }
  function confetti(game, x, y, z, n, cols, spd, life, size, kind) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = spd * (0.4 + Math.random() * 0.9);
      game.addParticle({
        kind: kind || 'tri', x: x + (Math.random() - 0.5) * 6, y, z: z * (0.6 + Math.random() * 0.8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6,
        vz: 30 + Math.random() * 70, grav: 160, drag: 2.2, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14,
        size: size * (0.6 + Math.random() * 0.8), color: cols[(Math.random() * cols.length) | 0], life: life * (0.7 + Math.random() * 0.6),
      });
    }
  }
  function pixels(game, x, y, z, n, cols, spd, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = spd * (0.3 + Math.random());
      game.addParticle({ kind: 'sq', x, y, z: z + (Math.random() - 0.5) * 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, drag: 4, size: 1 + Math.random() * 1.6, color: cols[i % cols.length], life: life * (0.6 + Math.random() * 0.6) });
    }
  }

  /* ---- overlays ---- */
  function buildOverlay(W, H) {
    const { c, ctx } = U.canvas(W, H);
    let g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,186,110,0.3)'); g.addColorStop(0.3, 'rgba(255,130,196,0.1)');
    g.addColorStop(0.6, 'rgba(180,120,255,0)'); g.addColorStop(1, 'rgba(84,30,168,0.32)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W * 0.5, -H * 0.12, 0, W * 0.5, -H * 0.12, H * 0.75);
    g.addColorStop(0, 'rgba(255,238,170,0.24)'); g.addColorStop(1, 'rgba(255,238,170,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.hypot(W, H) * 0.58);
    g.addColorStop(0, 'rgba(60,18,100,0)'); g.addColorStop(0.7, 'rgba(60,18,100,0.18)'); g.addColorStop(1, 'rgba(42,10,80,0.5)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const fw = W * 0.07;
    let lg = ctx.createLinearGradient(0, 0, fw, 0);
    lg.addColorStop(0, 'rgba(255,63,174,0.16)'); lg.addColorStop(1, 'rgba(255,63,174,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, fw, H);
    lg = ctx.createLinearGradient(W, 0, W - fw, 0);
    lg.addColorStop(0, 'rgba(47,224,255,0.15)'); lg.addColorStop(1, 'rgba(47,224,255,0)');
    ctx.fillStyle = lg; ctx.fillRect(W - fw, 0, fw, H);
    const step = H > 1100 ? 4 : 3;
    ctx.fillStyle = 'rgba(42,26,76,0.06)';
    for (let y = 0; y < H; y += step) ctx.fillRect(0, y, W, 1);
    // fine tape grain
    if (NOISE) {
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = ctx.createPattern(NOISE, 'repeat'); ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    return c;
  }
  function buildNoise() {
    const n = 160;
    const rng = U.rng(4242);
    return makeRGBA(n, n, (x, y, o) => {
      const v = rng.next();
      const g = v > 0.5 ? 255 : 40;
      o[0] = g; o[1] = g; o[2] = g + (v > 0.5 ? 0 : 60); o[3] = Math.abs(v - 0.5) * 2 * 255;
    });
  }

  /* ================= icons ================= */
  function iconBody(ctx, id, size) {
    const s = size / 96;
    ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const small = size <= 48;
    const LW = small ? 6 : 4;
    const F = (fill, lw) => { ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = lw || LW; ctx.stroke(); };
    const gl = (x0, y0, x1, y1, st) => grad(ctx, x0, y0, x1, y1, st);
    const disc = (x, y, r, rot) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); F(conic(ctx, rot || 0.4, x, y, IRIS));
      ctx.beginPath(); ctx.arc(x, y, r * 0.62, -2.6, -1.3); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = r * 0.14; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r * 0.34, 0, TAU); F('#f4f0ff', LW * 0.6);
      ctx.beginPath(); ctx.arc(x, y, r * 0.13, 0, TAU); ctx.fillStyle = P.ink; ctx.fill();
    };
    const speed = (pts, col) => { ctx.beginPath(); for (let i = 0; i < pts.length; i += 4) { ctx.moveTo(pts[i], pts[i + 1]); ctx.lineTo(pts[i + 2], pts[i + 3]); } ctx.strokeStyle = P.ink; ctx.lineWidth = LW * 1.6; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = LW * 0.8; ctx.stroke(); };
    const heart = (x, y, k) => {
      ctx.beginPath(); ctx.moveTo(x, y + 32 * k); ctx.bezierCurveTo(x - 26 * k, y + 14 * k, x - 38 * k, y - 2 * k, x - 34 * k, y - 16 * k);
      ctx.bezierCurveTo(x - 30 * k, y - 32 * k, x - 8 * k, y - 36 * k, x, y - 18 * k);
      ctx.bezierCurveTo(x + 8 * k, y - 36 * k, x + 30 * k, y - 32 * k, x + 34 * k, y - 16 * k);
      ctx.bezierCurveTo(x + 38 * k, y - 2 * k, x + 26 * k, y + 14 * k, x, y + 32 * k); ctx.closePath();
    };
    switch (id) {
      case 'hp-heart': {
        heart(48, 50, 1.15); F(gl(0, 14, 0, 86, [0, '#ffd1ea', 0.45, P.hot, 1, '#b8308f']));
        ctx.save(); heart(48, 50, 1.15); ctx.clip();
        ctx.fillStyle = 'rgba(255,242,122,0.55)'; ctx.fillRect(0, 60, 96, 5); ctx.fillRect(0, 70, 96, 6);
        ctx.restore();
        ctx.beginPath(); ctx.ellipse(30, 30, 9, 5, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
        break;
      }
      case 'kills': {
        ctx.beginPath(); poly(ctx, [50, 10, 66, 80, 88, 66], true); F(gl(50, 10, 88, 70, [0, '#e2d2ff', 1, P.vio]));
        ctx.beginPath(); poly(ctx, [50, 10, 8, 78, 66, 84], true); F(gl(0, 10, 0, 84, [0, '#fff0f8', 0.45, P.pink, 1, P.hot]));
        ctx.beginPath(); ctx.ellipse(42, 56, 13, 10, 0, 0, TAU); F('#ffffff', LW * 0.7);
        ctx.beginPath(); ctx.arc(46, 57, 6.5, 0, TAU); ctx.fillStyle = P.cyan; ctx.fill();
        ctx.beginPath(); ctx.arc(47, 58, 3.2, 0, TAU); ctx.fillStyle = P.ink; ctx.fill();
        ctx.beginPath(); ctx.arc(43, 53, 2, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
        break;
      }
      case 'dmg': {
        ctx.beginPath();
        for (let i = 0; i < 16; i++) { const t = (i / 16) * TAU - Math.PI / 2, r = i % 2 ? 22 : 44; ctx.lineTo(48 + Math.cos(t) * r, 48 + Math.sin(t) * r); }
        ctx.closePath(); F(gl(0, 6, 0, 92, [0, '#fff7b0', 0.5, P.sun, 1, P.amber]));
        disc(48, 48, 22, 1.2);
        break;
      }
      case 'rate': {
        speed([6, 30, 30, 30, 10, 50, 40, 50, 4, 70, 26, 70], P.cyan);
        disc(70, 28, 13, 0.3); disc(58, 52, 13, 1.4); disc(44, 76, 13, 2.6);
        break;
      }
      case 'multi': {
        disc(28, 60, 18, 0.2); disc(68, 60, 18, 2.2); disc(48, 36, 20, 1.2);
        ctx.beginPath(); ctx.moveTo(48, 12); ctx.lineTo(48, 4); ctx.moveTo(22, 28); ctx.lineTo(16, 22); ctx.moveTo(74, 28); ctx.lineTo(80, 22);
        ctx.strokeStyle = P.ink; ctx.lineWidth = LW * 1.4; ctx.stroke(); ctx.strokeStyle = P.sun; ctx.lineWidth = LW * 0.6; ctx.stroke();
        break;
      }
      case 'bounce': {
        ctx.beginPath(); ctx.rect(8, 76, 34, 9); F(gl(0, 76, 0, 85, [0, '#fff', 1, P.lilac]));
        ctx.beginPath(); ctx.rect(54, 12, 34, 9); F(gl(0, 12, 0, 21, [0, '#fff', 1, P.lilac]));
        ctx.setLineDash([7, 8]);
        ctx.beginPath(); ctx.moveTo(10, 28); ctx.lineTo(28, 74); ctx.lineTo(56, 24); ctx.lineTo(70, 56);
        ctx.strokeStyle = P.hot; ctx.lineWidth = LW * 0.9; ctx.stroke();
        ctx.setLineDash([]);
        disc(74, 64, 13, 0.8);
        break;
      }
      case 'lantern': {
        ctx.beginPath(); ctx.ellipse(48, 52, 42, 15, -0.2, 0, TAU); ctx.strokeStyle = P.ink; ctx.lineWidth = LW * 1.6; ctx.stroke();
        ctx.strokeStyle = P.cyan; ctx.lineWidth = LW * 0.7; ctx.stroke();
        ctx.save(); ctx.translate(48, 48); ctx.scale(3.0, 3.0); sunPose(ctx, 9.5); ctx.restore();
        ctx.beginPath(); ctx.arc(48, 48, 28.5, 0, TAU); ctx.strokeStyle = P.ink; ctx.lineWidth = LW; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(48, 52, 42, 15, -0.2, -0.2, Math.PI + 0.25); ctx.strokeStyle = P.ink; ctx.lineWidth = LW * 1.6; ctx.stroke();
        ctx.strokeStyle = P.cyan; ctx.lineWidth = LW * 0.7; ctx.stroke();
        break;
      }
      case 'speed': {
        speed([4, 46, 22, 46, 2, 60, 18, 60, 8, 74, 22, 74], P.hot);
        ctx.beginPath(); ctx.moveTo(26, 36); ctx.quadraticCurveTo(28, 60, 30, 76); ctx.lineTo(86, 78); ctx.quadraticCurveTo(92, 70, 84, 62);
        ctx.quadraticCurveTo(66, 58, 56, 46); ctx.quadraticCurveTo(46, 34, 26, 36); ctx.closePath();
        F(gl(0, 36, 0, 78, [0, '#ffffff', 1, P.lilac]));
        ctx.beginPath(); ctx.moveTo(30, 70); ctx.lineTo(88, 72); ctx.lineTo(86, 80); ctx.lineTo(30, 80); ctx.closePath(); F(P.hot, LW * 0.8);
        ctx.beginPath(); ctx.moveTo(38, 52); ctx.quadraticCurveTo(54, 62, 72, 62); ctx.strokeStyle = P.cyan; ctx.lineWidth = LW * 1.1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(46, 46); ctx.moveTo(46, 37); ctx.lineTo(52, 44); ctx.strokeStyle = P.ink; ctx.lineWidth = LW * 0.6; ctx.stroke();
        break;
      }
      case 'magnet': {
        ctx.beginPath(); ctx.moveTo(18, 90); ctx.lineTo(18, 52); ctx.arc(48, 52, 30, Math.PI, TAU); ctx.lineTo(78, 90); ctx.lineTo(60, 90); ctx.lineTo(60, 52);
        ctx.arc(48, 52, 12, 0, Math.PI, true); ctx.lineTo(36, 90); ctx.closePath();
        F(gl(18, 0, 78, 0, [0, P.hot, 0.5, P.pink, 1, P.lav]));
        ctx.beginPath(); ctx.rect(18, 76, 18, 14); F('#ffffff'); ctx.beginPath(); ctx.rect(60, 76, 18, 14); F('#ffffff');
        const gem = (x, y, r, col) => { ctx.beginPath(); poly(ctx, [x, y - r * 1.3, x + r, y, x, y + r, x - r, y], true); F(col, LW * 0.8); };
        gem(22, 16, 8, P.mint); gem(74, 12, 7, P.cyan);
        break;
      }
      case 'hp': {
        ctx.beginPath(); ctx.roundRect(24, 14, 48, 74, 8); F(gl(24, 0, 72, 0, [0, '#c4f6ff', 0.4, P.cyan, 1, '#7a6cf0']));
        ctx.beginPath(); ctx.rect(24, 22, 48, 6); F(P.lilac, LW * 0.6);
        ctx.beginPath(); ctx.rect(24, 74, 48, 6); F(P.lilac, LW * 0.6);
        heart(48, 50, 0.42); F(gl(0, 36, 0, 64, [0, P.blush, 1, P.hot]), LW * 0.8);
        ctx.beginPath(); ctx.moveTo(78, 16); ctx.lineTo(78, 40); ctx.moveTo(66, 28); ctx.lineTo(90, 28);
        ctx.strokeStyle = P.ink; ctx.lineWidth = LW * 2.3; ctx.stroke(); ctx.strokeStyle = P.mint; ctx.lineWidth = LW * 1.1; ctx.stroke();
        break;
      }
      default: {
        ctx.beginPath(); ctx.arc(48, 48, 32, 0, TAU); F(P.pink);
      }
    }
  }
  function drawIconImpl(ctx, id, size) {
    const t = U.canvas(size, size);
    iconBody(t.ctx, id, size);
    const d = Math.max(1, size * 0.028);
    ctx.globalAlpha = 0.85;
    ctx.drawImage(U.tint(t.c, P.fringeP), -d, 0);
    ctx.drawImage(U.tint(t.c, P.fringeC), d, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(t.c, 0, 0);
  }

  /* ================= CSS (HUD as a 90s OS window kit) ================= */
  const INK = P.ink;
  const BEVEL_OUT = 'border:2px solid;border-color:#ffffff #6b4fa8 #6b4fa8 #ffffff';
  const BEVEL_IN = 'border:2px solid;border-color:#6b4fa8 #ffffff #ffffff #6b4fa8';
  const TITLEBAR = 'linear-gradient(90deg,#ff5fc1 0%,#b892ff 55%,#5ee7ff 100%)';
  const CHROMA = 'text-shadow:-2px 0 rgba(255,63,174,.85),2px 0 rgba(47,224,255,.85)';
  const CSS = `
body.style-vaporwave{background:#2a1a4c;font-family:'VT323',ui-monospace,monospace;color:${INK}}
body.style-vaporwave #hud{padding:12px 20px}
body.style-vaporwave #hud .xp{height:18px;border-radius:0;background:#1d1040;${BEVEL_IN};box-shadow:0 0 0 2px ${INK},4px 4px 0 2px rgba(255,95,193,.55);overflow:hidden}
body.style-vaporwave #hud .xp-fill{background:${TITLEBAR}}
body.style-vaporwave #hud .xp::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 12px,rgba(29,16,64,.9) 12px 15px),linear-gradient(rgba(255,255,255,.45),rgba(255,255,255,0) 50%);pointer-events:none}
body.style-vaporwave #hud .lvl{right:3px;z-index:2;padding:0 7px;font:400 17px/14px 'VT323',monospace;color:#fff;background:${INK};border:1px solid #ff9ad5;${CHROMA}}
body.style-vaporwave #hud .topline{margin-top:14px}
body.style-vaporwave #hud .hp{gap:10px;padding:5px 10px 5px 6px;background:linear-gradient(180deg,#f6efff,#ddcdfb);${BEVEL_OUT};box-shadow:0 0 0 2px ${INK},5px 5px 0 2px rgba(42,26,76,.4)}
body.style-vaporwave #hud .hp-icon{width:32px;height:32px}
body.style-vaporwave #hud .hp-bar{width:230px;height:18px;border-radius:0;background:#1d1040;${BEVEL_IN}}
body.style-vaporwave #hud .hp-fill{background:linear-gradient(90deg,#ff5fc1,#ff8fa3 45%,#ffb36b 75%,#fff27a)}
body.style-vaporwave #hud .hp-bar::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 14px,rgba(29,16,64,.85) 14px 17px),linear-gradient(rgba(255,255,255,.5),rgba(255,255,255,0) 55%)}
body.style-vaporwave #hud .hp-text{font:400 24px/1 'VT323',monospace;color:${INK};letter-spacing:1px}
body.style-vaporwave.hurt #hud .hp-bar{filter:brightness(1.5) saturate(1.4)}
body.style-vaporwave #hud .clock{margin-top:-4px}
body.style-vaporwave #hud .clock-time{font:400 40px/1.05 'Rubik Mono One',sans-serif;letter-spacing:2px;background:linear-gradient(180deg,#ffffff 0%,#c4f6ff 30%,#5ee7ff 47%,#2a1a4c 50%,#7a4fd0 54%,#ff5fc1 70%,#ffe0f2 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:1px ${INK};text-shadow:none;filter:drop-shadow(3px 3px 0 ${INK}) drop-shadow(0 0 12px rgba(255,95,193,.7))}
body.style-vaporwave #hud .clock-label{font:400 19px/1 'VT323',monospace;letter-spacing:6px;color:#fff;opacity:1;margin-top:6px;padding:2px 6px 2px 12px;background:${INK};border:1px solid #ff9ad5;box-shadow:3px 3px 0 rgba(94,231,255,.55);${CHROMA}}
body.style-vaporwave #hud .kills{gap:8px;font:400 38px/1 'VT323',monospace;color:#fff;padding:2px 12px 2px 8px;background:rgba(42,26,76,.82);border:2px solid #ff9ad5;box-shadow:0 0 0 2px ${INK},4px 4px 0 2px rgba(94,231,255,.5);min-width:0;${CHROMA}}
body.style-vaporwave #hud .kills-icon{width:32px;height:32px}
body.style-vaporwave #stylebar{gap:10px;padding:4px 14px 4px 4px;border-radius:0;background:linear-gradient(180deg,#f4ecff,#d8c8fb);${BEVEL_OUT};box-shadow:0 0 0 2px ${INK},5px 5px 0 2px rgba(42,26,76,.4);font:400 18px 'VT323',monospace;color:${INK}}
body.style-vaporwave #stylebar .style-family{padding:3px 10px;font:400 16px 'VT323',monospace;letter-spacing:2px;color:#fff;opacity:1;background:${TITLEBAR};border:1px solid ${INK};text-shadow:1px 1px 0 ${INK}}
body.style-vaporwave #stylebar .style-name{font:400 14px 'Rubik Mono One',sans-serif;color:${INK};letter-spacing:1px}
body.style-vaporwave #stylebar .style-hint{opacity:.8}
body.style-vaporwave #stylemenu{border-radius:0;background:#e9ddff;${BEVEL_OUT};box-shadow:0 0 0 2px ${INK},6px 6px 0 2px rgba(42,26,76,.45);font-family:'VT323',monospace}
body.style-vaporwave #stylemenu .sm-item{border-radius:0;color:${INK};background:rgba(255,255,255,.5);font-size:17px}
body.style-vaporwave #stylemenu .sm-item.active{border-color:#ff5fc1;background:#fff}
body.style-vaporwave #levelup{gap:26px;overflow:hidden;background:repeating-linear-gradient(0deg,rgba(42,26,76,.12) 0 1px,transparent 1px 3px),linear-gradient(180deg,rgba(42,26,76,.88) 0%,rgba(110,60,180,.82) 34%,rgba(255,110,190,.78) 62%,rgba(255,180,140,.8) 80%,rgba(255,230,160,.82) 100%)}
body.style-vaporwave #levelup::before{content:'';position:absolute;left:-40%;right:-40%;bottom:-6%;height:42%;background-color:rgba(48,18,96,.82);background-image:linear-gradient(rgba(94,231,255,.9) 2px,transparent 2px),linear-gradient(90deg,rgba(255,95,193,.9) 2px,transparent 2px);background-size:70px 36px;transform:perspective(300px) rotateX(60deg);transform-origin:50% 0;pointer-events:none;z-index:-1}
body.style-vaporwave #levelup::after{content:'';position:absolute;left:50%;top:9%;width:min(46vh,440px);height:min(46vh,440px);transform:translateX(-50%);border-radius:50%;background:linear-gradient(180deg,#fff7b0 0%,#fff27a 28%,#ffb36b 50%,#ff5fc1 76%,#b13a9e 100%);-webkit-mask-image:linear-gradient(180deg,#000 0 36%,transparent 36% 39%,#000 39% 46%,transparent 46% 50%,#000 50% 57%,transparent 57% 62%,#000 62% 69%,transparent 69% 75%,#000 75%);mask-image:linear-gradient(180deg,#000 0 36%,transparent 36% 39%,#000 39% 46%,transparent 46% 50%,#000 50% 57%,transparent 57% 62%,#000 62% 69%,transparent 69% 75%,#000 75%);opacity:.9;pointer-events:none;z-index:-2;filter:drop-shadow(0 0 30px rgba(255,95,193,.6))}
body.style-vaporwave #levelup .lu-title{font:400 66px/1 'Monoton',cursive;letter-spacing:4px;color:#fff;text-shadow:-4px 0 #2fe0ff,4px 0 #ff3fae,0 6px 0 ${INK},0 0 30px rgba(255,95,193,.8)}
body.style-vaporwave #levelup .lu-cards{gap:30px}
body.style-vaporwave #levelup .card{width:232px;min-height:274px;padding:42px 16px 18px;gap:10px;border-radius:0;background:linear-gradient(180deg,#f8f2ff 0%,#e6d8ff 100%);${BEVEL_OUT};box-shadow:0 0 0 2px ${INK},7px 7px 0 2px rgba(42,26,76,.55);transition:transform .14s,box-shadow .14s}
body.style-vaporwave #levelup .card::before{content:'';position:absolute;left:3px;right:3px;top:3px;height:26px;background:linear-gradient(#f4ecff,#f4ecff) right 6px top 6px/14px 13px no-repeat,linear-gradient(${INK},${INK}) right 5px top 5px/16px 15px no-repeat,linear-gradient(#f4ecff,#f4ecff) right 26px top 6px/14px 13px no-repeat,linear-gradient(${INK},${INK}) right 25px top 5px/16px 15px no-repeat,linear-gradient(#f4ecff,#f4ecff) right 46px top 6px/14px 13px no-repeat,linear-gradient(${INK},${INK}) right 45px top 5px/16px 15px no-repeat,repeating-linear-gradient(0deg,rgba(255,255,255,.18) 0 1px,transparent 1px 3px),${TITLEBAR};border-bottom:2px solid ${INK};pointer-events:none}
body.style-vaporwave #levelup .card::after{content:'';position:absolute;left:12px;right:12px;top:40px;height:112px;background:radial-gradient(ellipse at 50% 60%,rgba(255,255,255,.95),rgba(255,255,255,0) 70%);border-bottom:2px dotted rgba(107,79,168,.5);pointer-events:none}
body.style-vaporwave #levelup .card:hover{transform:translateY(-8px);box-shadow:0 0 0 2px ${INK},10px 14px 0 2px rgba(255,95,193,.55)}
body.style-vaporwave #levelup .card-icon{width:104px;height:104px;position:relative;z-index:1}
body.style-vaporwave #levelup .card-name{font:400 14px/1.25 'Rubik Mono One',sans-serif;text-transform:uppercase;letter-spacing:1px;color:${INK};margin-top:6px;position:relative;z-index:1}
body.style-vaporwave #levelup .card-desc{font:400 21px/1.05 'VT323',monospace;color:#5b3a9a;opacity:1;position:relative;z-index:1}
body.style-vaporwave #levelup .card-key{top:5px;left:9px;z-index:2;font:400 22px/1 'VT323',monospace;color:#fff;opacity:1;text-shadow:1px 1px 0 ${INK}}
body.style-vaporwave #levelup .lu-hint{font:400 24px 'VT323',monospace;letter-spacing:6px;color:#fff;opacity:1;${CHROMA}}
body.style-vaporwave #gameover{background:repeating-linear-gradient(0deg,rgba(42,26,76,.14) 0 1px,transparent 1px 3px),linear-gradient(180deg,rgba(42,26,76,.92),rgba(120,50,170,.86) 55%,rgba(255,110,190,.82))}
body.style-vaporwave #gameover .go-title{font:400 58px 'Monoton',cursive;color:#fff;text-shadow:-4px 0 #2fe0ff,4px 0 #ff3fae,0 6px 0 ${INK}}
body.style-vaporwave #gameover .go-stats{font:400 24px 'VT323',monospace;color:#fff;letter-spacing:2px;${CHROMA}}
body.style-vaporwave #gameover .go-hint{font:400 22px 'VT323',monospace;letter-spacing:5px;color:#fff27a;text-shadow:2px 2px 0 ${INK}}
body.style-vaporwave #pausebox{font:400 56px 'Monoton',cursive;color:#fff;text-shadow:-4px 0 #2fe0ff,4px 0 #ff3fae,0 6px 0 ${INK}}
`;

  /* ================= style ================= */
  Styles.register({
    id: 'vaporwave',
    name: 'Vaporwave Sunset',
    family: 'Vector · Vaporwave',
    description: 'An 80s/90s vaporwave sunset world: pastel marble plazas, checkerboards, pastel grids and tiled pools with palms, marble busts and floating gradient shapes, under a sunset wash with soft bloom and VHS fringes.',
    groundColor: '#f6cfe6',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Monoton', 'VT323', 'Rubik+Mono+One'],
    css: CSS,

    init() {
      // main character: the strongest bloom of the cast (0.62), creatures and props sit lower
      HERO = { walk: [], idle: [], dash: [], hurt: null };
      const ho = { bloomCol: P.hot, bloomA: 0.62 };
      for (let i = 0; i < 8; i++) HERO.walk.push(makeSprite(16, 40, 16, 6, (c) => heroPose(c, i / 8, 'walk'), ho));
      for (let i = 0; i < 8; i++) HERO.idle.push(makeSprite(16, 40, 16, 6, (c) => heroPose(c, i / 8, 'idle'), ho));
      for (const m of ['launch', 'streak', 'brake']) HERO.dash.push(makeSprite(21, 40, 23, 6, (c) => heroPose(c, 0, m), ho));
      HERO.hurt = makeSprite(18, 40, 18, 6, (c) => heroPose(c, 0, 'hurt'), ho);
      CRIT = [makeSprite(14, 24, 15, 6, (c) => critterPose(c, false), { bloomCol: P.hot, bloomA: 0.38 }),
        makeSprite(14, 24, 15, 6, (c) => critterPose(c, true), { bloomCol: P.hot, bloomA: 0.38 })];
      DOLPH = [];
      for (let i = 0; i < 8; i++) DOLPH.push(makeSprite(22, 28, 17, 6, (c) => dolphinPose(c, i / 8), { bloomCol: P.cyan, bloomA: 0.45 }));
      COLO = [];
      for (let i = 0; i < 8; i++) COLO.push(makeSprite(28, 64, 28, 7, (c) => colossusPose(c, i / 8), { bloomCol: P.lav, bloomA: 0.5, blur: 2.8, ca: 0.6 }));
      GEMS = []; GEMB = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * (Math.PI / 2);
        GEMS.push(bake(7, 16, 7, 5, (c) => gemPose(c, a, false), { bloomCol: P.mint, bloomA: 0.8, blur: 1.6, ca: 0.4 }));
        GEMB.push(bake(9, 22, 9, 6, (c) => gemPose(c, a, true), { bloomCol: P.hot, bloomA: 0.8, blur: 2.0, ca: 0.45 }));
      }
      DISC = bake(7, 7, 7, 7, (c) => discPose(c, 3.6), { bloomCol: '#ffffff', bloomA: 0.7, blur: 1.4, ca: 0.4 });
      TRAIL = (() => {
        const len = 26, wid = 2.8;
        const w = Math.ceil((len + 3) * K), h = Math.ceil((wid + 6) * K);
        const base = U.canvas(w, h), g = base.ctx;
        const cy = h / 2, x1 = w - 1.5 * K;
        g.fillStyle = grad(g, 0, 0, x1, 0, [0, 'rgba(94,231,255,0)', 0.5, 'rgba(184,146,255,0.45)', 1, 'rgba(255,95,193,0.95)']);
        g.beginPath(); g.moveTo(0, cy); g.lineTo(x1, cy - (wid * K) / 2); g.quadraticCurveTo(x1 + K, cy, x1, cy + (wid * K) / 2); g.closePath(); g.fill();
        g.fillStyle = grad(g, x1 * 0.4, 0, x1, 0, [0, 'rgba(255,255,255,0)', 1, 'rgba(255,255,255,1)']);
        g.beginPath(); g.moveTo(x1 * 0.4, cy); g.lineTo(x1, cy - wid * K * 0.16); g.lineTo(x1, cy + wid * K * 0.16); g.closePath(); g.fill();
        const out = U.canvas(w, h);
        out.ctx.filter = 'blur(' + K * 0.8 + 'px)'; out.ctx.drawImage(base.c, 0, 0);
        out.ctx.filter = 'none'; out.ctx.drawImage(base.c, 0, 0);
        return { img: out.c, w: w / K, h: h / K, ax: x1 / w };
      })();
      SUN = bake(10, 10, 10, 10, (c) => sunPose(c, 5.6), { bloomCol: P.amber, bloomA: 0.9, blur: 2.2, ca: 0.45 });
      const po = (col) => ({ bloomCol: col, bloomA: 0.3, blur: 2.4 });
      PROPS = {
        palm: [bakeProp(28, 62, 31, 5, (c) => palmPose(c, 0), po(P.mint)), bakeProp(31, 62, 28, 5, (c) => palmPose(c, 1), po(P.hot))],
        column: [bakeProp(11, 42, 11, 4, (c) => columnPose(c, 0), po(P.lav)), bakeProp(13, 28, 21, 4, (c) => columnPose(c, 1), po(P.lav))],
        bust: [bakeProp(13, 40, 13, 4, (c) => bustPose(c, 0), po(P.pink)), bakeProp(13, 40, 13, 4, (c) => bustPose(c, 1), po(P.pink))],
        sphere: [bakeProp(12, 37, 12, 3, (c) => spherePose(c, 0), Object.assign(po(P.hot), { float: true, bloomA: 0.6 })),
          bakeProp(12, 37, 12, 3, (c) => spherePose(c, 1), Object.assign(po(P.cyan), { float: true, bloomA: 0.6 }))],
        pyramid: [],
        torus: [bakeProp(14, 35, 14, 3, torusPose, Object.assign(po(P.cyan), { float: true, bloomA: 0.55 }))],
        monitor: [bakeProp(14, 31, 17, 4, monitorPose, po(P.hot))],
        flamingo: [bakeProp(13, 33, 14, 4, (c) => flamingoPose(c, 0), po(P.hot)), bakeProp(19, 33, 19, 4, (c) => flamingoPose(c, 1), po(P.hot))],
      };
      for (let i = 0; i < 12; i++) {
        const th = (i / 12) * (Math.PI / 2);
        PROPS.pyramid.push(bakeProp(14, 45, 14, 3, (c) => pyramidPose(c, th), Object.assign(po(P.amber), { float: true, bloomA: 0.55 })));
      }
      SHADOW = U.sprite(64, 32, (ctx) => {
        ctx.fillStyle = rgrad(ctx, 32, 16, 0, 32, 16, 32, [0, 'rgba(75,42,134,0.5)', 0.55, 'rgba(75,42,134,0.32)', 1, 'rgba(75,42,134,0)']);
        ctx.setTransform(1, 0, 0, 0.5, 0, 8); ctx.fillRect(0, -16, 64, 64);
      });
      GLOW = { pink: softDisc(P.hot, 0.9), sun: softDisc(P.amber, 0.9), cyan: softDisc(P.cyan, 0.9) };
      BEAM = U.sprite(32, 256, (ctx) => {
        ctx.fillStyle = grad(ctx, 0, 256, 0, 0, [0, 'rgba(255,242,122,0.95)', 0.5, 'rgba(255,95,193,0.6)', 1, 'rgba(94,231,255,0)']);
        ctx.fillRect(0, 0, 32, 256);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = grad(ctx, 0, 0, 32, 0, [0, 'rgba(0,0,0,0)', 0.5, 'rgba(0,0,0,1)', 1, 'rgba(0,0,0,0)']);
        ctx.fillRect(0, 0, 32, 256);
      });
      NOISE = buildNoise();
      if (!TEX) TEX = buildTextures();
      if (document.fonts && document.fonts.load) { try { document.fonts.load("40px 'Rubik Mono One'").catch(() => {}); } catch (e) { /* ignore */ } }
    },

    renderGroundChunk(ctx, info) {
      return groundGen(ctx, info);
    },

    propsForChunk(info) {
      const out = [];
      G.scatterOwned(info, 100, 4343, (x, y, rng) => {
        if (G.nearSpawn(x, y, 95) || !rng.chance(0.5)) return;
        for (const [dx, dy] of [[0, 0], [-14, 0], [14, 0], [0, -12], [0, 10]]) if (waterAt(x + dx, y + dy)) return;
        const reg = blockAt(x, y);
        const r = rng.next();
        let t;
        if (reg === REG_MARBLE) t = r < 0.3 ? 'column' : r < 0.55 ? 'bust' : r < 0.8 ? 'palm' : 'sphere';
        else if (reg === REG_CHECK) t = r < 0.25 ? 'bust' : r < 0.45 ? 'column' : r < 0.62 ? 'monitor' : r < 0.82 ? 'pyramid' : 'flamingo';
        else if (reg === REG_GRID) t = r < 0.3 ? 'pyramid' : r < 0.55 ? 'sphere' : r < 0.78 ? 'torus' : 'monitor';
        else t = r < 0.42 ? 'palm' : r < 0.66 ? 'flamingo' : r < 0.84 ? 'torus' : 'column';
        const add = (px, py, type) => {
          if (G.nearSpawn(px, py, 95) || waterAt(px, py)) return;
          const set = PROPS[type];
          out.push({ x: px, y: py, type, v: type === 'pyramid' ? 0 : rng.int(0, set.length - 1), fl: rng.next(), pad: 100, float: type === 'sphere' || type === 'pyramid' || type === 'torus' });
        };
        add(x, y, t);
        if (t === 'palm' && rng.chance(0.55)) add(x + rng.range(18, 30) * rng.sign(), y + rng.range(-10, 12), 'palm');
        else if (t === 'column' && rng.chance(0.5)) add(x + rng.range(26, 34), y + rng.range(-3, 3), 'column');
      });
      return out;
    },

    drawProp(ctx, pr, view) {
      const set = PROPS[pr.type];
      if (!set) return;
      const rt = view.rt;
      if (pr.float) {
        const bob = Math.sin(rt * 1.7 + pr.fl * 20) * 2.2;
        let s = set[pr.v] || set[0];
        if (pr.type === 'pyramid') s = set[Math.floor(rt * 7 + pr.fl * 12) % 12];
        if (pr.type === 'torus') {
          ctx.save(); ctx.translate(pr.x, pr.y - FLOAT_H - bob); ctx.rotate(Math.sin(rt * 1.1 + pr.fl * 9) * 0.16);
          ctx.drawImage(s.img, -s.ax * s.w, -s.ay * s.h + FLOAT_H, s.w, s.h);
          ctx.restore();
        } else blit(ctx, s, s.img, pr.x, pr.y - bob);
        return;
      }
      const s = set[pr.v] || set[0];
      if (pr.type === 'palm') {
        const sw = Math.sin(rt * 1.3 + pr.fl * 10) * 0.03;
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.transform(1, 0, sw, 1, 0, 0);
        ctx.drawImage(s.img, -s.ax * s.w, -s.ay * s.h, s.w, s.h);
        ctx.restore();
        return;
      }
      if (pr.type === 'monitor' && U.hash2(Math.floor(rt * 12), Math.floor(pr.fl * 999), 9) < 0.04) ctx.globalAlpha = 0.8;
      blit(ctx, s, s.img, pr.x, pr.y);
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o, view) {
      if (o.kind === 'prop') {
        const set = PROPS && PROPS[o.type];
        if (!set) return;
        if (o.float) {
          const bob = Math.sin(view.rt * 1.7 + o.fl * 20) * 2.2;
          const rw = (o.type === 'pyramid' ? 11 : 10) * (1 - bob * 0.04);
          ctx.globalAlpha = 0.75;
          ctx.drawImage(SHADOW, o.x - rw + 4, o.y - rw * 0.32, rw * 2.2, rw * 0.64);
          ctx.globalAlpha = 1;
          return;
        }
        const s = set[o.v] || set[0];
        if (!s.shadow) return;
        const sh = s.shadow;
        ctx.globalAlpha = 0.34;
        ctx.drawImage(sh.img, o.x - sh.ox, o.y - sh.oy, sh.w, sh.h);
        ctx.globalAlpha = 1;
        return;
      }
      let rw, a = 1, ox = 2.5;
      if (o.kind === 'player') rw = 11;
      else {
        rw = o.r * (o.type === 'ghost' ? 1.4 : 1.35);
        if (o.type === 'ghost') { a = 0.6; ox = 4; }
        if (o.dying) a *= Math.max(0, 1 - o.deathT * 1.4);
        else if (o.spawnT < 1) a *= o.spawnT;
      }
      if (a <= 0) return;
      ctx.globalAlpha = a;
      ctx.drawImage(SHADOW, o.x - rw + ox, o.y - rw * 0.34, rw * 2.3, rw * 0.68);
      ctx.globalAlpha = 1;
    },

    drawGroundOverlay(ctx, view, game) {
      const p = game.player;
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.28;
      ctx.drawImage(GLOW.pink, p.x - 46, p.y - 18, 92, 36);
      for (const o of game.orbitals) {
        ctx.globalAlpha = 0.32;
        ctx.drawImage(GLOW.sun, o.x - 20, o.y + 8 - 8, 40, 16);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    drawGem(ctx, g, view) {
      const set = g.big ? GEMB : GEMS;
      const s = set[Math.floor((view.rt * 1.5 + g.seed * 3) * 8) & 7];
      const bob = Math.sin(view.rt * 3 + g.seed * 12) * 0.8;
      const pop = g.pop > 0 ? Math.sin(g.pop * Math.PI) * 6 : 0;
      if (g.fly) {
        ctx.globalAlpha = 0.35;
        const sp = Math.hypot(g.vx, g.vy) || 1;
        blit(ctx, s, s.img, g.x - (g.vx / sp) * 4, g.y - (g.vy / sp) * 4 + bob);
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(SHADOW, g.x - 4, g.y - 1.3, 8, 2.6);
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(s.img, g.x - s.ax * s.w, g.y + bob - pop - s.ay * s.h, s.w, s.h);
    },

    drawEnemy(ctx, e, view) {
      const rt = view.rt;
      let frames, fi;
      let x = e.x, y = e.y, sx = 1, sy = 1;
      if (e.type === 'ghost') {
        // the dolphin swims through the air: quick rise, slow glide down (eased), per-actor phase
        frames = DOLPH; fi = Math.floor((rt * (1.6 + e.seed * 0.5) + e.seed * 5) * 8) & 7;
        const fb = U.fract(rt * 0.42 + e.seed * 3.7);
        const up = fb < 0.35 ? U.smoothstep(0, 0.35, fb) : 1 - U.smoothstep(0.35, 1, fb);
        y -= 2.4 + up * 3.0;
        sy = 1 - 0.04 * (1 - up); sx = 1 + 0.05 * (1 - up);
      } else if (e.type === 'colossus') {
        frames = COLO; fi = Math.floor((e.anim * 0.22 + e.seed) * 8) % 8;
      } else {
        frames = CRIT;
        const blink = U.fract(rt * 0.55 + e.seed * 7) < 0.07;
        fi = blink ? 1 : 0;
        // hop: a beat on the ground (land squash → anticipation crouch), then a stretched arc in the air
        const ph = U.fract(e.anim * 0.3 + e.seed);
        let hop = 0, sq = 0, st = 0;
        if (ph < 0.26) sq = Math.sin((ph / 0.26) * Math.PI);
        else { const u = (ph - 0.26) / 0.74; hop = Math.sin(u * Math.PI); st = Math.max(0, 1 - u * 2.4); }
        y -= hop * 6.2;
        sy = 1 - 0.22 * sq + 0.12 * st; sx = 1 / Math.sqrt(sy);
      }
      // hit reaction: damped squash/stretch for ~250 ms (works from flash alone, so it also plays in sheets)
      if ((e.flash || 0) > (e._nf || 0) + 0.3) e._ht = rt;
      e._nf = e.flash || 0;
      const ha = e._ht === undefined ? 9 : rt - e._ht;
      let rot = 0;
      if (ha < 0.32 && !e.dying) {
        const r = Math.exp(-ha * 13) * Math.cos(ha * 26);
        sx *= 1 + 0.16 * r; sy *= 1 - 0.16 * r;
        rot = U.clamp((e.kx || 0) / 140, -1, 1) * 0.22 * Math.exp(-ha * 9);
      }
      const side = e.facing < 0 ? 1 : 0;
      const s = frames[fi][side];
      const T = ETYPE[e.type];
      const W = s.w * sx, H = s.h * sy;
      if (e.dying) {
        // CRT switch-off: squash to a line, white-out, then a shrinking line
        const t = e.deathT;
        const cyy = e.y - T.h;
        if (t < 0.55) {
          const k = t / 0.55, ky = 1 - 0.94 * U.ease.inQuad(k), kx = 1 + 0.4 * k;
          const w = s.w * kx, h = s.h * ky;
          const dx = x - s.ax * w, dy = cyy - (T.h * ky) - (s.ay * s.h - T.h) * ky;
          ctx.globalAlpha = 1 - k * 0.3;
          ctx.drawImage(s.img, dx, dy, w, h);
          ctx.globalAlpha = Math.min(1, k * 1.6);
          ctx.drawImage(s.flash, dx, dy, w, h);
          ctx.globalAlpha = 0.7 * (1 - k);
          ctx.drawImage(s.pk, dx - 1.5 - k * 5, dy, w, h);
          ctx.drawImage(s.cy, dx + 1.5 + k * 5, dy, w, h);
        } else {
          const k = (t - 0.55) / 0.45, hw = e.r * 2.2 * (1 - k) + 0.5;
          ctx.globalAlpha = 1 - k * 0.6;
          ctx.fillStyle = P.fringeP; ctx.fillRect(x - hw - 1, cyy - 0.8, hw * 2, 1.6);
          ctx.fillStyle = P.fringeC; ctx.fillRect(x - hw + 1, cyy - 0.8, hw * 2, 1.6);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x - hw, cyy - 0.6, hw * 2, 1.2);
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (e.spawnT < 1) {
        // CRT switch-on: a bright line opens up vertically into the creature
        const k = U.ease.outQuad(e.spawnT);
        const cyy = e.y - T.h;
        const ky = 0.05 + 0.95 * k, kx = 1.35 - 0.35 * k;
        const w = s.w * kx, h = s.h * ky;
        const dx = x - s.ax * w, dy = cyy - (s.ay * s.h - T.h) * ky - T.h * ky;
        ctx.globalAlpha = 0.5 + 0.5 * k;
        ctx.drawImage(s.img, dx, dy, w, h);
        ctx.globalAlpha = 1 - k;
        ctx.drawImage(s.flash, dx, dy, w, h);
        const hw = e.r * 1.8 * (1.2 - k * 0.4);
        ctx.globalAlpha = 0.9 * (1 - k);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - hw, cyy - 0.5, hw * 2, 1.0);
        ctx.globalAlpha = 0.5 * (1 - k);
        ctx.strokeStyle = T.col; ctx.lineWidth = 1.0;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * (2.6 - 1.4 * k), e.r * (2.6 - 1.4 * k) * 0.4, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
        return;
      }
      if (e.type === 'ghost') {
        const sp = Math.hypot(e.vx, e.vy);
        if (sp > 8) {
          ctx.globalAlpha = 0.3;
          blit(ctx, s, s.pk, x - e.vx * 0.08, y - e.vy * 0.08);
          ctx.globalAlpha = 0.22;
          blit(ctx, s, s.cy, x - e.vx * 0.16, y - e.vy * 0.16);
          ctx.globalAlpha = 1;
        }
      }
      const lean = Math.abs(rot) > 0.004;
      if (lean) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.translate(-x, -y); }
      ctx.drawImage(s.img, x - s.ax * W, y - s.ay * H, W, H);
      if (e.flash > 0) {
        const dx = x - s.ax * W, dy = y - s.ay * H;
        ctx.globalAlpha = Math.min(1, e.flash * 1.1);
        ctx.drawImage(s.flash, dx, dy, W, H);
        if (e.flash > 0.45) {
          ctx.globalAlpha = 0.75 * e.flash;
          ctx.drawImage(s.pk, dx - 1.8, dy, W, H);
          ctx.drawImage(s.cy, dx + 1.8, dy, W, H);
        }
        ctx.globalAlpha = 1;
      }
      if (lean) ctx.restore();
      if (e.type === 'colossus') {
        const ph = (e.anim * 0.22 + e.seed) * 2, f = ph - Math.floor(ph);
        if (f < 0.35) {
          const k = f / 0.35;
          ctx.globalAlpha = (1 - k) * 0.6;
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.ellipse(e.x, e.y, 14 + k * 16, (14 + k * 16) * 0.36, 0, 0, TAU); ctx.stroke();
          ctx.strokeStyle = P.hot; ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.ellipse(e.x, e.y + 0.8, 13 + k * 16, (13 + k * 16) * 0.36, 0, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    },

    drawPlayer(ctx, p, view) {
      const rt = view.rt;
      let mode, set, dk = 0;
      if (p.dashT > 0) { mode = 'dash'; dk = U.clamp(1 - p.dashT / 0.2, 0, 1); set = HERO.dash[dk < 0.22 ? 0 : dk < 0.78 ? 1 : 2]; }
      else if (p.hurtT > 0.55) { mode = 'hurt'; set = HERO.hurt; }
      else if (p.moving) { mode = 'walk'; set = HERO.walk[Math.floor(((p.anim / 2.6) % 1) * 8) & 7]; }
      else { mode = 'idle'; set = HERO.idle[Math.floor(U.fract(rt / 3.4) * 8) & 7]; }
      const side = p.facing < 0 ? 1 : 0;
      const s = set[side];
      const bob = 0;
      if (mode === 'dash') {
        for (let i = 1; i <= 4; i++) {
          ctx.globalAlpha = 0.5 - i * 0.1;
          blit(ctx, s, i % 2 ? s.pk : s.cy, p.x - p.dashX * i * 7 * (0.4 + dk), p.y - p.dashY * i * 7 * (0.4 + dk));
        }
        ctx.globalAlpha = 1;
      } else if (mode === 'walk' && Math.hypot(p.vx, p.vy) > 60) {
        ctx.globalAlpha = 0.12;
        blit(ctx, s, s.pk, p.x - p.vx * 0.05 - 1, p.y - p.vy * 0.05);
        blit(ctx, s, s.cy, p.x - p.vx * 0.1 + 1, p.y - p.vy * 0.1);
        ctx.globalAlpha = 1;
      }
      if (p.levelT > 0) {
        const k = 1 - p.levelT;
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = p.levelT * 0.9;
        ctx.drawImage(BEAM, p.x - 10, p.y - 96, 20, 98);
        ctx.globalCompositeOperation = 'source-over';
        const rr = 10 + U.ease.outQuad(k) * 56;
        ctx.globalAlpha = p.levelT;
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rr, rr * 0.4, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = P.sun; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.strokeStyle = P.hot; ctx.globalAlpha = p.levelT * 0.7; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rr * 0.68, rr * 0.27, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      let alpha = 1;
      if (p.iframes > 0 && p.hurtT > 0 && (Math.floor(rt * 18) & 1)) alpha = 0.45;
      ctx.globalAlpha = alpha;
      // squash & stretch: the dash stretches along the motion, the brake frame squashes; the recoil squashes
      let ssx = 1, ssy = 1;
      if (mode === 'dash') { const st = Math.sin(dk * Math.PI); ssx = 1 + 0.15 * st - (dk > 0.8 ? 0.07 : 0); ssy = 1 - 0.1 * st + (dk > 0.8 ? 0.05 : 0); }
      else if (mode === 'hurt') { const h = (p.hurtT - 0.55) / 0.45; ssx = 1 + 0.12 * h; ssy = 1 - 0.1 * h; }
      ctx.drawImage(s.img, p.x - s.ax * s.w * ssx, p.y + bob - s.ay * s.h * ssy, s.w * ssx, s.h * ssy);
      ctx.globalAlpha = 1;
      if (p.hurtT > 0.35) {
        ctx.globalAlpha = (p.hurtT - 0.35) * 1.3;
        blit(ctx, s, s.flash, p.x, p.y + bob);
        ctx.globalAlpha = p.hurtT - 0.35;
        blit(ctx, s, s.pk, p.x - 2.4, p.y + bob);
        blit(ctx, s, s.cy, p.x + 2.4, p.y + bob);
        ctx.globalAlpha = 1;
      }
    },

    drawOrbital(ctx, o, view) {
      const tr = o._vwTrail || (o._vwTrail = []);
      const g = view.game, px = g ? g.player.x : 0, py = g ? g.player.y : 0;
      // trail stored relative to the owner so it follows the main character smoothly
      if (o._vwT !== view.rt) { o._vwT = view.rt; tr.push(o.x - px, o.y - py); if (tr.length > 20) tr.splice(0, 2); }
      if (tr.length >= 6) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 2; i < tr.length; i += 2) {
          const k = i / tr.length;
          ctx.globalAlpha = k * 0.9;
          ctx.beginPath(); ctx.moveTo(tr[i - 2] + px, tr[i - 1] + py - 6); ctx.lineTo(tr[i] + px, tr[i + 1] + py - 6);
          ctx.strokeStyle = i % 4 ? P.pink : P.cyan; ctx.lineWidth = 0.6 + k * 1.6; ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      const bob = Math.sin(view.rt * 4 + o.idx) * 0.8;
      ctx.drawImage(SUN.img, o.x - SUN.ax * SUN.w, o.y - 6 + bob - SUN.ay * SUN.h, SUN.w, SUN.h);
    },

    drawProjectile(ctx, pr) {
      ctx.save();
      ctx.translate(pr.x, pr.y - 6);
      ctx.rotate(pr.angle);
      const L = Math.min(1, pr.age * 9 + 0.15) * (pr.life < 0.15 ? pr.life / 0.15 : 1);
      ctx.drawImage(TRAIL.img, -TRAIL.ax * TRAIL.w * L, -TRAIL.h / 2, TRAIL.w * L, TRAIL.h);
      ctx.rotate(-pr.angle);
      ctx.scale(1, 0.72);
      ctx.rotate(pr.spin);
      ctx.drawImage(DISC.img, -DISC.ax * DISC.w, -DISC.ay * DISC.h, DISC.w, DISC.h);
      ctx.restore();
    },

    drawParticle(ctx, pt, view) {
      if (view !== pbView) { pbView = view; pbLast = lastVisible(view); }
      const k = Math.max(0, pt.life / pt.max);
      const y = pt.y - pt.z;
      switch (pt.kind) {
        case 'ring': {
          const e = 1 - k;
          const r = pt.r0 + (pt.r1 - pt.r0) * (1 - (1 - e) * (1 - e));
          bucket(pt.thin ? 'ringT' : 'ring', pt.color, k).d.push(pt.x, y, r, r * pt.sq);
          break;
        }
        case 'tri': case 'chunk': {
          const L = pt.size * 0.6, c = Math.cos(pt.rot), s = Math.sin(pt.rot);
          const D = bucket(pt.kind, pt.color, Math.min(1, k * 1.8)).d;
          if (pt.kind === 'tri') {
            D.push(pt.x + c * L, y + s * L * 0.8, pt.x - c * L * 0.5 - s * L * 0.85, y + (-s * L * 0.5 + c * L * 0.85) * 0.8, pt.x - c * L * 0.5 + s * L * 0.85, y + (-s * L * 0.5 - c * L * 0.85) * 0.8);
          } else {
            D.push(pt.x + c * L, y + s * L, pt.x - s * L * 0.7, y + c * L * 0.7, pt.x - c * L * 0.9, y - s * L * 0.8, pt.x + s * L * 0.8, y - c * L * 0.9);
          }
          break;
        }
        case 'sq': bucket('sq', pt.color, Math.min(1, k * 1.5)).d.push(pt.x, y, pt.size); break;
        case 'decal': { const r = pt.r0 * (0.85 + 0.15 * k); bucket('ringT', pt.color, k * k * 0.8).d.push(pt.x, pt.y, r, r * 0.4); break; }
        case 'flash': {
          // core flash: an ink-edged white sparkle that snaps open and is gone in ~100 ms
          const e = 1 - k;
          bucket('star', '#ffffff', 1).d.push(pt.x, y, pt.size * (0.45 + 0.55 * Math.sqrt(e)) * (0.6 + 0.4 * k));
          break;
        }
        case 'star': bucket('star', pt.color, Math.min(1, k * 1.6)).d.push(pt.x, y, pt.size * (0.5 + 0.5 * Math.sin(k * Math.PI))); break;
        default: {
          const vx = pt.vx, vy = pt.vy - (pt.vz || 0);
          const sp = Math.hypot(vx, vy);
          const L = Math.min(8, 1 + sp * 0.03) * (pt.size || 2) * 0.5;
          const nx = sp > 0.01 ? vx / sp : 1, ny = sp > 0.01 ? vy / sp : 0;
          bucket((pt.size || 2) > 2.4 ? 'line2' : 'line', pt.color || '#ffffff', k).d.push(pt.x, y, pt.x - nx * L, y - ny * L);
        }
      }
      if (pt === pbLast) pbFlush(ctx);
    },

    drawNumber(ctx, n) {
      if (pbPending) pbFlush(ctx);
      const D = digits();
      const A = n.crit ? D.crit : D.norm;
      const lf = n.life / n.max;
      const alpha = Math.min(1, lf * 2.4);
      const pop = 1 + Math.max(0, lf - 0.78) * 2.6;
      const hW = (n.crit ? 13 : 9.5) * pop;
      const sc = hW / A.H;
      const str = String(n.value);
      let W = 0;
      for (let i = 0; i < str.length; i++) W += A.adv[str.charCodeAt(i) - 48] * 0.92;
      let x = n.x - (W * sc) / 2;
      const y = n.y - hW / 2 - 4;
      ctx.globalAlpha = alpha;
      for (let i = 0; i < str.length; i++) {
        const d = str.charCodeAt(i) - 48;
        if (d < 0 || d > 9) continue;
        const sw = A.adv[d] + A.pad * 2;
        ctx.drawImage(A.c, A.xs[d], 0, sw, A.H, x - A.pad * sc, y, sw * sc, A.H * sc);
        x += A.adv[d] * 0.92 * sc;
      }
      ctx.globalAlpha = 1;
    },

    drawWorldOverlay(ctx) {
      if (pbPending) pbFlush(ctx);
    },

    drawScreenOverlay(ctx, view) {
      if (glitchReq) { glitchT0 = view.rt; glitchDur = glitchReq; glitchReq = 0; }
      const gt = view.rt - glitchT0;
      if (gt >= 0 && gt < glitchDur) {
        const W = view.W, H = view.H, f = 1 - gt / glitchDur;
        const rng = U.rng(Math.floor(view.rt * 40) * 7919 + 13);
        const n = 3 + rng.int(0, 3);
        for (let i = 0; i < n; i++) {
          const yy = rng.int(0, H - 30), h = rng.int(4, 26), dx = rng.range(-20, 20) * f;
          ctx.drawImage(ctx.canvas, 0, yy, W, h, dx, yy, W, h);
        }
        ctx.globalAlpha = 0.08 * f;
        ctx.fillStyle = P.fringeP; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    },

    drawDisplayOverlay(ctx, view) {
      const W = view.displayW, H = view.displayH;
      const key = W + 'x' + H;
      if (key !== OVLkey) { OVL = buildOverlay(W, H); OVLkey = key; }
      // VHS tracking band rolling down the picture
      const per = 8.5, ph = (view.rt % per) / per;
      const bh = Math.max(8, Math.round(H * 0.03));
      const by = Math.round(ph * (H + bh * 6)) - bh * 3;
      if (by > -bh && by < H) {
        const y0 = Math.max(0, by), h = Math.min(H, by + bh) - y0;
        if (h > 0) {
          // painted, not displaced: copying the canvas onto itself every frame stalls the GPU
          const u = Math.max(1, Math.round(H / 900));
          ctx.globalAlpha = 0.09; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, y0, W, h);
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = P.fringeP; ctx.fillRect(0, y0, W, u);
          ctx.fillStyle = P.fringeC; ctx.fillRect(0, Math.min(H - u, y0 + h - u), W, u);
          ctx.globalAlpha = 0.55; ctx.fillStyle = '#ffffff';
          const rng = U.rng(Math.floor(view.rt * 24) * 131 + 7);
          for (let i = 0; i < 9; i++) ctx.fillRect(rng.next() * W, y0 + rng.next() * h, (10 + rng.next() * 80) * u, u);
          // animated snow only inside the band (the fine grain of the whole picture is baked into the overlay)
          const ox = (Math.floor(view.rt * 30) * 53) % 160, oy = (Math.floor(view.rt * 30) * 97) % 160;
          if (!this._np || this._npC !== ctx) { this._np = ctx.createPattern(NOISE, 'repeat'); this._npC = ctx; }
          ctx.save();
          ctx.globalAlpha = 0.22;
          ctx.translate(-ox, -oy);
          ctx.fillStyle = this._np; ctx.fillRect(ox, y0 + oy, W, h);
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }
      ctx.drawImage(OVL, 0, 0);
    },

    drawIcon(ctx, id, size) {
      drawIconImpl(ctx, id, size);
    },

    /* ---- gameplay hooks (all effects are ours) ---- */
    onHit(game, e) {
      const T = ETYPE[e.type] || ETYPE.creeper;
      const z = T.h * 1.1;
      game.addParticle({ kind: 'flash', x: e.x, y: e.y, z, size: 4.6, life: 0.1, drag: 0 });
      for (let i = 0; i < 3; i++) spark(game, e.x, e.y, z, Math.random() * TAU, 60 + Math.random() * 90, i ? T.col : '#ffffff', 0.18 + Math.random() * 0.1, 2);
      confetti(game, e.x, e.y, z, 2, [T.col, T.col2], 50, 0.35, 2.6);
      ring(game, e.x, e.y, z, 1.5, 7, '#ffffff', 0.15, 1, true);
    },
    onKill(game, e) {
      const T = ETYPE[e.type] || ETYPE.creeper;
      const big = e.type === 'colossus';
      game.addParticle({ kind: 'flash', x: e.x, y: e.y, z: T.h * 0.9, size: big ? 13 : 8, life: big ? 0.16 : 0.12, drag: 0 });
      game.addParticle({ kind: 'decal', x: e.x, y: e.y, r0: e.r * 1.6, color: T.col === P.marble ? P.lav : T.col, life: big ? 1.3 : 0.9, drag: 0 });
      // slow residue: a few VHS pixels that hang in the air
      for (let i = 0; i < (big ? 6 : 3); i++) game.addParticle({ kind: 'sq', x: e.x + (Math.random() - 0.5) * e.r * 2, y: e.y, z: T.h * (0.4 + Math.random()), vx: (Math.random() - 0.5) * 10, vz: 6 + Math.random() * 8, grav: -10, drag: 1.5, size: 1.1 + Math.random() * 0.8, color: i % 2 ? P.fringeC : P.fringeP, life: 0.7 + Math.random() * 0.5 });
      if (big) {
        confetti(game, e.x, e.y, T.h, 16, [P.marble, P.marble2, P.marble3], 110, 0.9, 5, 'chunk');
        confetti(game, e.x, e.y, T.h, 10, [P.hot, P.cyan, P.sun], 120, 0.7, 3);
        pixels(game, e.x, e.y, T.h, 14, [P.fringeP, P.fringeC, '#ffffff'], 90, 0.5);
        ring(game, e.x, e.y, 0, e.r * 0.6, e.r * 4.6, P.hot, 0.7, 0.42);
        ring(game, e.x, e.y, 0, e.r * 0.4, e.r * 3.2, P.cyan, 0.55, 0.42, true);
        glitchReq = 0.14;
      } else if (e.type === 'ghost') {
        confetti(game, e.x, e.y, T.h, 7, [P.cyan, P.lav, '#a8f4ff'], 80, 0.6, 3);
        pixels(game, e.x, e.y, T.h, 6, ['#ffffff', P.cyan], 50, 0.45);
        ring(game, e.x, e.y, 0, e.r * 0.6, e.r * 3.4, P.cyan, 0.42, 0.42);
      } else {
        confetti(game, e.x, e.y, T.h, 8, [P.hot, P.pink, P.peach, P.lav], 90, 0.6, 3.4);
        pixels(game, e.x, e.y, T.h, 5, [P.fringeP, P.fringeC], 60, 0.4);
        ring(game, e.x, e.y, 0, e.r * 0.6, e.r * 3.2, P.hot, 0.42, 0.42);
      }
      for (let i = 0; i < (big ? 8 : 4); i++) spark(game, e.x, e.y, T.h * 0.8, Math.random() * TAU, 80 + Math.random() * 120, i % 2 ? P.sun : '#ffffff', 0.22 + Math.random() * 0.12, 2.4);
    },
    onHurt(game, p) {
      pixels(game, p.x, p.y, 14, 12, [P.fringeP, P.fringeC, '#ffffff'], 110, 0.4);
      for (let i = 0; i < 6; i++) spark(game, p.x, p.y, 14, Math.random() * TAU, 80 + Math.random() * 100, i % 2 ? P.hot : P.sun, 0.28, 2.6);
      ring(game, p.x, p.y, 14, 4, 22, P.hot, 0.3, 1);
      glitchReq = 0.24;
    },
    onPickup(game, g) {
      const p = game.player;
      game.addParticle({ kind: 'flash', x: p.x, y: p.y, z: 12, size: g.big ? 6 : 3.6, life: 0.09, drag: 0 });
      ring(game, p.x, p.y, 0, 3, g.big ? 18 : 11, g.big ? P.hot : P.mint, 0.28, 0.42, true);
      for (let i = 0; i < (g.big ? 5 : 2); i++) {
        game.addParticle({ kind: 'star', x: p.x + (Math.random() - 0.5) * 14, y: p.y, z: 8 + Math.random() * 16, vx: (Math.random() - 0.5) * 20, vz: 30 + Math.random() * 20, grav: 1, drag: 1, size: g.big ? 3.2 : 2.4, color: g.big ? P.blush : '#ffffff', life: 0.45 + Math.random() * 0.2 });
      }
    },
    onShoot(game, pr) {
      for (let i = 0; i < 2; i++) spark(game, pr.x, pr.y + 6, 6, pr.angle + (Math.random() - 0.5) * 0.9, 90 + Math.random() * 60, i ? P.cyan : P.hot, 0.13, 1.8);
    },
    onDash(game, p) {
      ring(game, p.x, p.y, 0, 4, 24, P.cyan, 0.32, 0.42);
      pixels(game, p.x, p.y, 10, 6, [P.fringeP, P.fringeC], 50, 0.35);
      for (let i = 0; i < 6; i++) {
        const a = Math.atan2(-p.dashY, -p.dashX) + (Math.random() - 0.5) * 1.1;
        spark(game, p.x, p.y, 4 + Math.random() * 16, a, 80 + Math.random() * 120, i % 2 ? P.hot : P.cyan, 0.26, 2.2);
      }
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'flash', x: p.x, y: p.y, z: 16, size: 12, life: 0.14, drag: 0 });
      ring(game, p.x, p.y, 0, 6, 66, P.hot, 0.7, 0.42);
      ring(game, p.x, p.y, 0, 4, 44, P.cyan, 0.55, 0.42, true);
      for (let i = 0; i < 16; i++) {
        game.addParticle({ kind: 'star', x: p.x + (Math.random() - 0.5) * 26, y: p.y + (Math.random() - 0.5) * 8, z: 2, vx: (Math.random() - 0.5) * 30, vz: 70 + Math.random() * 110, grav: 50, drag: 1, size: 2.4 + Math.random() * 1.6, color: [P.sun, P.blush, P.cyan, '#ffffff'][i % 4], life: 0.7 + Math.random() * 0.4 });
      }
      confetti(game, p.x, p.y, 10, 8, [P.hot, P.cyan, P.sun, P.lav], 70, 0.8, 3);
    },
    onDeath(game, p) {
      confetti(game, p.x, p.y, 14, 22, [P.hot, P.cyan, P.sun, P.lav, P.peach], 130, 1.2, 4);
      pixels(game, p.x, p.y, 14, 18, [P.fringeP, P.fringeC, '#ffffff'], 120, 0.8);
      ring(game, p.x, p.y, 0, 6, 80, P.hot, 0.9, 0.42);
      glitchReq = 0.45;
    },
  });
})();
