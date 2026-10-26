/* Neon Mitternacht – synthwave / vector-neon look: glowing line-art on a dark holographic midnight floor.
   Glow = pre-rendered blurred halos baked once in init(); nothing is blurred per frame. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const K = 4; // sprite resolution (px per world unit)
  const mod = (a, b) => ((a % b) + b) % b;
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const hexA = (h, a) => rgba(U.hex(h), a);
  const hot = (h, t) => U.rgb(U.mix(U.hex(h), [255, 255, 255], t === undefined ? 0.6 : t));

  /* ================= palette ================= */
  const P = {
    bg: '#05040d',
    jack: '#ff7a1a', amber: '#ffae35', face: '#ffe7a0', scarf: '#ffe14a', stem: '#9cff4a',
    mag: '#ff3ad6', vio: '#b066ff', root: '#d77bff',
    cyan: '#6ff4ff', ice: '#eaffff',
    acid: '#b44dff', acidDk: '#7a38d6', tox: '#8dff2a',
    lime: '#c6ff3a', gemC: '#45f4ff',
    seed: '#ff9a2e', lav: '#c3b5ff', lavDk: '#6a5ad0',
  };
  const ETYPE = {
    creeper: { col: P.mag, col2: P.vio, h: 15, frags: 9, len: 4.2, pool: null, top: 27 },
    ghost: { col: P.cyan, col2: P.ice, h: 16, frags: 7, len: 3.6, pool: null, top: 30 },
    colossus: { col: P.acid, col2: P.tox, h: 28, frags: 20, len: 6.5, pool: null, top: 52 },
  };

  /* ================= sprite toolkit ================= */
  function tube(c, pass, col, lw, o) {
    if (pass === 'full') {
      c.strokeStyle = col; c.lineWidth = lw; c.stroke();
      if (!o || o.hot !== false) {
        c.strokeStyle = (o && o.hotCol) || hot(col, 0.62); c.lineWidth = lw * 0.36; c.stroke();
      }
    } else if (!o || o.glow !== false) {
      c.strokeStyle = (o && o.glowCol) || col; c.lineWidth = lw * ((o && o.gw) || 1.8); c.stroke();
    }
  }
  function fillIn(c, pass, col, glowCol) {
    if (pass === 'full') { if (col) { c.fillStyle = col; c.fill(); } }
    else if (glowCol) { c.fillStyle = glowCol; c.fill(); }
  }
  function tri(c, ax, ay, bx, by, cx, cy) { c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx, cy); c.closePath(); }
  function poly(c, pts, close) {
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    if (close) c.closePath();
  }

  /** Bake a sprite: sharp line art + blurred halo (from a dedicated 'glow' pass) in one canvas. */
  function bakeSet(l, t, r, b, draw, o) {
    o = o || {};
    const w = Math.ceil((l + r) * K), h = Math.ceil((t + b) * K);
    const mk = (pass) => {
      const { c, ctx } = U.canvas(w, h);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setTransform(K, 0, 0, K, l * K, t * K);
      draw(ctx, pass);
      return c;
    };
    const full = mk('full'), glow = mk('glow');
    const { c, ctx } = U.canvas(w, h);
    const wide = o.wide || 2.2, tight = o.tight || 0.6, ga = o.glowA === undefined ? 1 : o.glowA;
    ctx.filter = 'blur(' + (wide * K) + 'px)';
    ctx.globalAlpha = Math.min(1, 0.7 * ga); ctx.drawImage(glow, 0, 0);
    if (ga > 1.2) { ctx.globalAlpha = Math.min(1, 0.7 * (ga - 1)); ctx.drawImage(glow, 0, 0); }
    ctx.filter = 'blur(' + (tight * K) + 'px)';
    ctx.globalAlpha = Math.min(1, 0.6 * ga); ctx.drawImage(glow, 0, 0);
    ctx.filter = 'none'; ctx.globalAlpha = 1;
    ctx.drawImage(full, 0, 0);
    return { img: c, full, w: w / K, h: h / K, ax: (l * K) / w, ay: (t * K) / h };
  }
  /** Character sprite: both facings + white flash + chroma split copies. */
  function makeSprite(l, t, r, b, draw, o) {
    const B = bakeSet(l, t, r, b, draw, o);
    const R = { img: B.img, flash: U.tint(B.full, '#ffffff'), red: U.tint(B.full, '#ff2a7a'), cyan: U.tint(B.full, '#2ae8ff'), w: B.w, h: B.h, ax: B.ax, ay: B.ay };
    const L = { img: U.flipX(R.img), flash: U.flipX(R.flash), red: U.flipX(R.red), cyan: U.flipX(R.cyan), w: B.w, h: B.h, ax: 1 - B.ax, ay: B.ay };
    return [R, L];
  }
  function blit(ctx, s, img, x, y) { ctx.drawImage(img, x - s.ax * s.w, y - s.ay * s.h, s.w, s.h); }
  /** Radial pool sprite (dark core + coloured rim) used for floor contact glows. */
  function makePool(col, darkA, rimA, size) {
    size = size || 96;
    return U.sprite(size, size, (ctx) => {
      const r = size / 2;
      const g = ctx.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, 'rgba(0,0,0,' + darkA + ')');
      g.addColorStop(0.38, 'rgba(0,0,0,' + darkA * 0.75 + ')');
      g.addColorStop(0.62, hexA(col, rimA));
      g.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    });
  }
  function makeGlow(col, a) {
    return U.sprite(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, hexA(col, a));
      g.addColorStop(0.35, hexA(col, a * 0.45));
      g.addColorStop(0.7, hexA(col, a * 0.12));
      g.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    });
  }

  /* ================= characters ================= */
  function pumpkinPath(c, cx, cy, rx, ry, depth) {
    depth = depth === undefined ? 0.035 : depth;
    c.beginPath();
    for (let i = 0; i <= 56; i++) {
      const t = (i / 56) * TAU;
      const r = 1 + depth * Math.cos(6 * t) - 0.08 * Math.pow(Math.max(0, -Math.sin(t)), 14);
      const x = cx + Math.cos(t) * rx * r, y = cy + Math.sin(t) * ry * r;
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.closePath();
  }
  function faceGrad(c, x, y, r) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, '#fffbe2'); g.addColorStop(0.55, '#ffe08a'); g.addColorStop(1, '#ffa526');
    return g;
  }

  /* ---- two-bone IK: returns [jointX, jointY, endX, endY]; bend +1 = joint behind, -1 = joint in front ---- */
  function ik(ax, ay, bx, by, l1, l2, bend) {
    let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 0.001;
    const mx = l1 + l2 - 0.02;
    if (d > mx) { bx = ax + (dx / d) * mx; by = ay + (dy / d) * mx; dx = bx - ax; dy = by - ay; d = mx; }
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const px = ax + (dx * a) / d, py = ay + (dy * a) / d;
    return [px - (dy / d) * h * bend, py + (dx / d) * h * bend, bx, by];
  }
  const bump = (x, c, w) => { const t = (x - c) / w; return t <= -1 || t >= 1 ? 0 : 0.5 + 0.5 * Math.cos(t * Math.PI); };

  /* ---- main character: pumpkin head, short tunic jacket, long scarf, satchel, boots ----
     Pose parameters are computed per mode, then one routine draws the figure (feet at 0,0, facing +x). */
  function jackParams(mode, ph) {
    const a = ph * TAU;
    const q = {
      lean: 0, dy: 0, sh: 0, fA: [1.6, 0, 0], fB: [-1.8, 0, 0], swA: -0.14, swB: 0.1, elA: 0, elB: 0,
      hdy: 0, tilt: 0, hem: 0, scarf: { base: Math.PI * 0.6, amp: 0.1, ph: a, len: 1 }, face: 'normal', stretch: 0,
    };
    if (mode === 'walk') {
      const S = 3.5, L = 2.0;
      // contact (0) – down (.125) – passing (.25) – up (.375) – contact (.5) …
      q.dy = 0.85 * Math.sin(2 * a);
      q.lean = 0.07;
      const sA = Math.max(0, -Math.sin(a)), sB = Math.max(0, Math.sin(a));
      const pitch = (s, sw) => (s > 0 ? (-0.55 + 1.0 * sw) * Math.min(1, s * 3) : 0);
      const swingA = ph >= 0.5 ? (ph - 0.5) * 2 : 0, swingB = ph < 0.5 ? ph * 2 : 0;
      q.fA = [0.6 + S * Math.cos(a), -sA * L, pitch(sA, swingA)];
      q.fB = [-0.4 - S * Math.cos(a), -sB * L, pitch(sB, swingB)];
      q.swA = -0.62 * Math.cos(a); q.swB = 0.62 * Math.cos(a);
      q.elA = 0.5 * Math.max(0, -Math.cos(a)); q.elB = 0.5 * Math.max(0, Math.cos(a));
      q.hdy = q.dy + 0.4 * Math.sin(2 * a - 1.1);
      q.tilt = 0.04 * Math.sin(2 * a - 1.3);
      q.hem = 0.7 * Math.sin(2 * a - 1.5);
      q.scarf = { base: Math.PI - 0.5, amp: 0.26, ph: 2 * a - 1.0, len: 1.05 };
    } else if (mode === 'idle') {
      const br = Math.sin(a);
      q.sh = -0.32 * (0.5 + 0.5 * br);
      q.hdy = -0.36 * (0.5 + 0.5 * Math.sin(a - 0.5));
      q.tilt = 0.025 * Math.sin(a) + 0.085 * bump(ph, 0.62, 0.17);
      q.swA = -0.12 + 0.05 * Math.sin(a - 0.6); q.swB = 0.1 + 0.05 * Math.sin(a - 1.0);
      q.hem = 0.25 * Math.sin(a - 1.2);
      q.scarf = { base: Math.PI * 0.6, amp: 0.1, ph: a, len: 1 };
    } else if (mode === 'launch') {
      q.lean = 0.46; q.dy = 1.3; q.fA = [2.2, 0, 0.1]; q.fB = [-5.0, -0.3, -0.5];
      q.swA = -1.25; q.swB = -1.05; q.elA = 0.2; q.elB = 0.2; q.hdy = 1.1; q.tilt = 0.1; q.hem = -1.2;
      q.scarf = { base: Math.PI + 0.12, amp: 0.08, ph: 0.4, len: 1.15 };
    } else if (mode === 'streak') {
      q.lean = 0.3; q.dy = -0.8; q.fA = [3.9, -2.3, 0.25]; q.fB = [-4.8, -1.3, -0.6];
      q.swA = -1.45; q.swB = -1.15; q.elA = 0.1; q.elB = 0.1; q.hdy = -0.9; q.tilt = 0.06; q.hem = -1.6;
      q.scarf = { base: Math.PI + 0.02, amp: 0.05, ph: 1.4, len: 1.3 };
    } else if (mode === 'brake') {
      q.lean = -0.14; q.dy = 0.7; q.fA = [4.3, 0, 0.3]; q.fB = [-2.4, 0, 0];
      q.swA = 0.85; q.swB = 0.55; q.elA = 0.5; q.elB = 0.4; q.hdy = 0.9; q.tilt = -0.07; q.hem = 1.0;
      q.scarf = { base: Math.PI + 1.2, amp: 0.2, ph: 2.6, len: 1.0 };
    } else if (mode === 'hurt') {
      q.lean = -0.24; q.dy = 0.5; q.fA = [1.2, 0, 0.25]; q.fB = [-2.8, 0, 0];
      q.swA = 2.3; q.swB = 2.7; q.elA = 0.7; q.elB = 0.7; q.hdy = 0.2; q.tilt = -0.17; q.hem = 1.3; q.face = 'squint';
      q.scarf = { base: Math.PI * 0.35, amp: 0.25, ph: 1.0, len: 1 };
    }
    return q;
  }
  function jackPose(c, pass, mode, ph) {
    const q = jackParams(mode, ph);
    const body = P.amber, far = '#c06a18', dark = 'rgba(26,10,3,0.96)';
    const hipY = -8.3 + q.dy, shY = -14.9 + q.dy + q.sh;
    const leg = (hx, f, col) => {
      const [kx, ky, ax, ay] = ik(hx, hipY, f[0], f[1] - 1.0, 4.3, 4.0, -1);
      c.beginPath(); c.moveTo(hx, hipY); c.lineTo(kx, ky); c.lineTo(ax, ay);
      tube(c, pass, col, 1.15);
      // boot: heel to toe, pitched around the ankle; the sole carries the hot line
      const cs = Math.cos(f[2]), sn = Math.sin(f[2]);
      const pt = (x, y) => [ax + x * cs - y * sn, ay + x * sn + y * cs];
      const h0 = pt(-1.0, 0.95), t0 = pt(2.6, 0.95), t1 = pt(2.4, -0.1), b0 = pt(-0.6, -0.4);
      c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(h0[0], h0[1]); c.lineTo(t0[0], t0[1]); c.quadraticCurveTo(t1[0] + 0.4, t1[1], t1[0] - 0.6, t1[1] - 0.2); c.closePath();
      fillIn(c, pass, dark); tube(c, pass, col, 0.75);
    };
    const arm = (sx, sw, el, col) => {
      const sy = shY + 0.3;
      const tx = sx + Math.sin(sw) * 5.0, ty = sy + Math.cos(sw) * 5.0 - el * 1.2;
      const [ex, ey, hx, hy] = ik(sx, sy, tx, ty, 2.9, 2.9, 1);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy);
      tube(c, pass, col, 1.05);
      c.beginPath(); c.arc(hx, hy, 0.95, 0, TAU); fillIn(c, pass, dark, col); tube(c, pass, col, 0.55, { hot: false });
    };
    // whole-figure lean pivots on the feet for dashes, on the hips for walking
    c.save();
    if (mode === 'launch' || mode === 'streak') { c.rotate(q.lean * 0.55); }
    const tr = mode === 'launch' || mode === 'streak' ? q.lean * 0.45 : q.lean;
    const rot = () => { c.translate(0, hipY); c.rotate(tr); c.translate(0, -hipY); };
    c.save(); rot(); arm(-0.9, q.swB, q.elB, far); c.restore();
    leg(-1.0, q.fB, far);
    // scarf tails: a chain whose links lag behind a travelling wave (follow-through)
    const N = [-1.7, shY - 0.6];
    const chain = (off, segs, w) => {
      const pts = [N[0], N[1]];
      let x = N[0], y = N[1];
      for (let i = 0; i < segs; i++) {
        const an = q.scarf.base + off * 0.5 + i * (q.scarf.base < Math.PI / 2 ? 0.12 : -0.12) + q.scarf.amp * Math.sin(q.scarf.ph - i * 0.95 - off * 2);
        const L = (2.7 - i * 0.2) * q.scarf.len;
        x += Math.cos(an) * L; y += Math.sin(an) * L;
        pts.push(x, y);
      }
      c.beginPath(); c.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length - 2; i += 2) c.quadraticCurveTo(pts[i], pts[i + 1], (pts[i] + pts[i + 2]) / 2, (pts[i + 1] + pts[i + 3]) / 2);
      c.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
      tube(c, pass, P.scarf, w);
      // fringe at the tail end
      const ex = pts[pts.length - 2], ey = pts[pts.length - 1];
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - 0.6, ey + 1.1); c.moveTo(ex, ey); c.lineTo(ex + 0.5, ey + 1.2);
      tube(c, pass, P.scarf, 0.4, { hot: false });
    };
    c.save(); rot();
    chain(0.35, 3, 0.85);
    chain(0, 4, 1.15);
    c.restore();
    leg(1.0, q.fA, body);
    c.save(); rot();
    // tunic jacket: narrow shoulders, flared hem that swings late
    c.beginPath();
    c.moveTo(-2.9, shY - 0.4); c.lineTo(2.9, shY - 0.4);
    c.quadraticCurveTo(3.7, shY + 3.0, 4.4 + q.hem * 0.25, hipY + 0.3);
    c.quadraticCurveTo(0.2, hipY + 1.6 + q.hem * 0.15, -4.5 + q.hem * 0.5, hipY + 0.4 - q.hem * 0.15);
    c.quadraticCurveTo(-3.6, shY + 3.0, -2.9, shY - 0.4); c.closePath();
    fillIn(c, pass, dark); tube(c, pass, body, 1.0);
    if (pass === 'full') {
      // zip + hem band, drawn as dim inner lines (medium detail)
      c.beginPath(); c.moveTo(0.9, shY + 0.4); c.lineTo(1.1, hipY + 0.9);
      c.moveTo(-3.7 + q.hem * 0.4, hipY - 0.9); c.quadraticCurveTo(0.2, hipY + 0.4, 3.9 + q.hem * 0.2, hipY - 1.0);
      c.strokeStyle = 'rgba(255,170,70,0.42)'; c.lineWidth = 0.42; c.stroke();
    }
    // satchel strap + pouch
    c.beginPath(); c.moveTo(-2.1, shY); c.lineTo(3.0, hipY - 1.2);
    tube(c, pass, '#ffcf7a', 0.5, { hot: false });
    c.beginPath(); c.roundRect ? c.roundRect(2.0, hipY - 2.3, 2.9, 2.4, 0.7) : c.rect(2.0, hipY - 2.3, 2.9, 2.4);
    fillIn(c, pass, dark); tube(c, pass, '#ffcf7a', 0.55, { hot: false });
    // head on a short neck, tilting around the neck joint (lags the body)
    c.save();
    const nkY = shY - 0.6;
    c.translate(0.4, nkY); c.rotate(q.tilt); c.translate(-0.4, -nkY);
    const hx = 0.5, hy = -21.9 + q.hdy, rx = 7.6, ry = 6.3;
    pumpkinPath(c, hx, hy, rx, ry);
    fillIn(c, pass, 'rgba(30,9,2,0.97)');
    if (pass === 'full') {
      c.beginPath();
      c.moveTo(hx - 3.6, hy - ry * 0.93); c.quadraticCurveTo(hx - 7.0, hy, hx - 3.6, hy + ry * 0.93);
      c.moveTo(hx + 4.6, hy - ry * 0.9); c.quadraticCurveTo(hx + 7.6, hy, hx + 4.6, hy + ry * 0.9);
      c.moveTo(hx + 0.6, hy - ry * 0.98); c.quadraticCurveTo(hx + 0.2, hy - 4.6, hx + 0.9, hy - 3.9);
      c.strokeStyle = 'rgba(255,110,30,0.55)'; c.lineWidth = 0.55; c.stroke();
      // cool rim on the shadow side (light comes from upper right)
      c.beginPath(); c.ellipse(hx - 0.4, hy + 0.3, rx * 0.88, ry * 0.86, 0, Math.PI * 0.6, Math.PI * 1.05);
      c.strokeStyle = 'rgba(255,58,214,0.55)'; c.lineWidth = 0.5; c.stroke();
    }
    pumpkinPath(c, hx, hy, rx, ry);
    tube(c, pass, P.jack, 1.35);
    c.beginPath(); c.moveTo(hx - 0.2, hy - ry + 0.5); c.quadraticCurveTo(hx - 0.1, hy - ry - 1.8, hx + 1.9, hy - ry - 2.7);
    tube(c, pass, P.stem, 1.15);
    c.beginPath(); c.moveTo(hx + 1.2, hy - ry - 2.2); c.quadraticCurveTo(hx + 3.4, hy - ry - 3.4, hx + 4.2, hy - ry - 1.6);
    tube(c, pass, P.stem, 0.5, { hot: false });
    const fx = hx + 1.7, fy = hy;
    c.beginPath();
    if (q.face === 'squint') {
      c.moveTo(fx - 4.4, fy - 2.4); c.lineTo(fx - 1.4, fy - 1.2); c.lineTo(fx - 4.2, fy - 0.6);
      c.moveTo(fx + 3.6, fy - 2.4); c.lineTo(fx + 0.6, fy - 1.2); c.lineTo(fx + 3.4, fy - 0.6);
      tube(c, pass, '#ffe08a', 0.7, { hotCol: '#ffffff' });
      c.beginPath(); c.ellipse(fx - 0.4, fy + 2.8, 1.8, 1.4, 0, 0, TAU);
    } else {
      tri(c, fx - 4.4, fy - 0.3, fx - 1.4, fy - 0.3, fx - 2.8, fy - 3.7);
      tri(c, fx + 0.6, fy - 0.3, fx + 3.6, fy - 0.3, fx + 2.2, fy - 3.7);
      tri(c, fx - 1.3, fy + 1.5, fx + 0.3, fy + 1.5, fx - 0.5, fy + 0.2);
      c.moveTo(fx - 5.0, fy + 2.0);
      c.lineTo(fx - 3.2, fy + 2.7); c.lineTo(fx - 2.4, fy + 2.0); c.lineTo(fx - 1.0, fy + 2.8); c.lineTo(fx + 0.1, fy + 2.1);
      c.lineTo(fx + 1.3, fy + 2.8); c.lineTo(fx + 2.4, fy + 2.0); c.lineTo(fx + 3.4, fy + 2.6); c.lineTo(fx + 4.7, fy + 1.7);
      c.quadraticCurveTo(fx + 0.2, fy + 6.6, fx - 5.0, fy + 2.0);
      c.closePath();
    }
    fillIn(c, pass, pass === 'full' ? faceGrad(c, fx - 0.3, fy + 0.6, 5.5) : null, '#ffb000');
    c.restore();
    // scarf wrap (front)
    c.beginPath(); c.moveTo(-3.3, shY - 0.7); c.quadraticCurveTo(0.2, shY + 0.9, 3.4, shY - 0.6);
    tube(c, pass, P.scarf, 1.75);
    arm(0.9, q.swA, q.elA, body);
    c.restore();
    c.restore();
  }

  /* ---- small creature: turnip bulb on root legs, leafy crown, root arms ---- */
  function leaf(c, pass, bx, by, ang, len, wid, col, fillC) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const tx = bx + dx * len, ty = by + dy * len;
    const mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
    c.beginPath();
    c.moveTo(bx, by);
    c.quadraticCurveTo(mx + nx * wid, my + ny * wid, tx, ty);
    c.quadraticCurveTo(mx - nx * wid, my - ny * wid, bx, by);
    c.closePath();
    fillIn(c, pass, fillC);
    tube(c, pass, col, 0.8);
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + dx * len * 0.78, by + dy * len * 0.78);
    tube(c, pass, col, 0.38, { hot: false, glow: false });
  }
  function bulbPath(c) {
    c.beginPath();
    c.moveTo(0, -20);
    c.bezierCurveTo(-4.4, -19.8, -8.9, -16.6, -8.9, -11.6);
    c.bezierCurveTo(-8.9, -6.9, -4.9, -4.2, 0, -4.2);
    c.bezierCurveTo(4.9, -4.2, 8.9, -6.9, 8.9, -11.6);
    c.bezierCurveTo(8.9, -16.6, 4.4, -19.8, 0, -20);
    c.closePath();
  }
  function creeperPose(c, pass, ph, blink) {
    const a = ph * TAU, s = Math.sin(a);
    const bob = -Math.abs(s) * 1.3;
    const sq = 0.065 * Math.cos(2 * a); // squash on each foot contact, stretch mid-stride
    const dark = 'rgba(32,4,34,0.96)';
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * s) * 2.1;
      const hx = sd * 2.6, hy = -5.4 + bob * 0.6;
      const fx = sd * 3.4 + s * 1.5, fy = -lift;
      c.beginPath();
      c.moveTo(hx, hy);
      c.quadraticCurveTo(hx + sd * 1.7 - s * 0.4, (hy + fy) / 2, fx, fy);
      c.lineTo(fx + 1.7, fy + 0.1);
      c.moveTo(fx, fy); c.lineTo(fx - 0.8, fy + 0.4);
      tube(c, pass, sd < 0 ? '#a95ccc' : P.root, 0.95);
    }
    c.save();
    c.translate(0, bob);
    c.scale(1 + sq, 1 - sq);
    c.translate(0, -6); c.rotate(s * 0.08); c.translate(0, 6);
    // back root arm
    const ar = Math.sin(a + 0.9);
    c.beginPath(); c.moveTo(-7.6, -10.6); c.quadraticCurveTo(-10.4, -10.2 + ar * 0.8, -11.0, -7.6 + ar * 1.2);
    tube(c, pass, '#a95ccc', 0.7, { hot: false });
    // leafy crown lags the bulb (overlapping action)
    const sw = 0.17 * Math.sin(2 * a - 1.3);
    leaf(c, pass, -0.6, -20.6, -2.3 + sw, 5.6, 1.9, P.vio, dark);
    leaf(c, pass, 0.6, -20.6, -0.85 + sw * 1.2, 5.8, 1.9, P.vio, dark);
    leaf(c, pass, 0, -20.8, -1.6 + sw * 0.8, 7.4, 2.2, P.vio, dark);
    bulbPath(c); fillIn(c, pass, dark);
    const waveY = (x) => -14.6 + Math.sin(x * 0.9 + 0.5) * 0.55;
    if (pass === 'full') {
      c.save(); bulbPath(c); c.clip();
      c.beginPath(); c.moveTo(-10, -22); c.lineTo(10, -22);
      for (let x = 10; x >= -10; x -= 0.5) c.lineTo(x, waveY(x));
      c.closePath();
      c.fillStyle = 'rgba(170,40,215,0.42)'; c.fill();
      // cool shadow crescent on the lower left
      c.beginPath(); c.arc(1.6, -13.4, 9.6, Math.PI * 0.55, Math.PI * 1.15);
      c.strokeStyle = 'rgba(90,40,200,0.55)'; c.lineWidth = 1.6; c.stroke();
      c.restore();
    }
    c.beginPath();
    for (let x = -8.4; x <= 8.4; x += 0.4) { if (x === -8.4) c.moveTo(x, waveY(x)); else c.lineTo(x, waveY(x)); }
    tube(c, pass, P.vio, 0.6, { hot: false });
    bulbPath(c); tube(c, pass, P.mag, 1.25);
    c.beginPath(); c.moveTo(-1.9, -19.7); c.lineTo(-1.4, -21.2); c.lineTo(1.4, -21.2); c.lineTo(1.9, -19.7);
    fillIn(c, pass, dark); tube(c, pass, P.vio, 0.7, { hot: false });
    // root tail under the bulb
    const tw = Math.sin(2 * a - 0.8);
    c.beginPath(); c.moveTo(-0.6, -4.3); c.quadraticCurveTo(-1.4 + tw * 0.6, -2.8, -2.6 + tw * 0.9, -2.6);
    tube(c, pass, P.root, 0.5, { hot: false });
    c.beginPath(); c.moveTo(-5.8, -8.4); c.quadraticCurveTo(-4.4, -7.4, -3.0, -7.7);
    c.moveTo(3.4, -6.6); c.quadraticCurveTo(4.8, -7.0, 5.9, -8.1);
    tube(c, pass, 'rgba(255,120,230,0.6)', 0.45, { hot: false, glow: false });
    const ex = 1.5;
    c.beginPath();
    if (blink) {
      c.moveTo(ex - 4.4, -11.4); c.lineTo(ex - 1.0, -10.6); c.moveTo(ex + 4.4, -11.4); c.lineTo(ex + 1.0, -10.6);
      tube(c, pass, '#ffb6f4', 0.6, { hot: false });
    } else {
      tri(c, ex - 4.4, -12.5, ex - 0.9, -11.0, ex - 2.9, -9.3);
      tri(c, ex + 4.4, -12.5, ex + 0.9, -11.0, ex + 2.9, -9.3);
      fillIn(c, pass, '#ffeafb', '#ff5fe4');
    }
    const mo = 0.35 + 0.35 * Math.max(0, Math.sin(a * 2));
    c.beginPath(); c.moveTo(ex - 2.5, -6.9); c.lineTo(ex - 1.25, -7.8 - mo); c.lineTo(ex, -6.9); c.lineTo(ex + 1.25, -7.8 - mo); c.lineTo(ex + 2.5, -6.9);
    tube(c, pass, '#ffa6f2', 0.55, { hot: false });
    // front root arm reaching forward
    c.beginPath(); c.moveTo(7.8, -9.8); c.quadraticCurveTo(10.6, -9.4 - ar * 0.8, 11.4, -7.0 - ar * 1.1);
    c.moveTo(11.4, -7.0 - ar * 1.1); c.lineTo(12.4, -7.4 - ar * 1.1);
    tube(c, pass, P.root, 0.75, { hot: false });
    c.restore();
  }

  /* ---- fast creature: hollow-eyed wisp with a rippling tail and reaching claws ---- */
  function ghostBody(c, w1, w2, w3) {
    c.beginPath();
    c.moveTo(-6.6, -17.6);
    c.arc(0, -17.6, 6.6, Math.PI, 0);
    c.bezierCurveTo(6.6, -13.6, 6.3, -10.6, 4.8, -8.4 + w1 * 0.4);
    c.quadraticCurveTo(3.6, -6.2 + w2 * 0.7, 1.9, -7.7 + w1 * 0.2);
    c.quadraticCurveTo(0.4, -5.4 + w3 * 0.7, -1.6, -7.1 + w2 * 0.2);
    c.quadraticCurveTo(-4.4, -5.2 + w1 * 0.8, -7.8 + w2 * 0.8, -4.2 + w3 * 0.9);
    c.quadraticCurveTo(-10.8 + w3 * 1.0, -3.2 + w1 * 1.0, -12.2 + w1 * 1.1, -5.6 + w2 * 0.9);
    c.quadraticCurveTo(-8.8, -8.0 + w3 * 0.3, -7.0, -11.6);
    c.quadraticCurveTo(-6.6, -14.4, -6.6, -17.6);
    c.closePath();
  }
  function ghostArm(c, pass, sx, sy, ex, ey, hx, hy, lw) {
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(ex, ey, hx, hy);
    c.moveTo(hx, hy); c.lineTo(hx + 1.6, hy - 1.1);
    c.moveTo(hx, hy); c.lineTo(hx + 1.9, hy + 0.15);
    c.moveTo(hx, hy); c.lineTo(hx + 1.3, hy + 1.3);
    tube(c, pass, P.cyan, lw, { hot: false });
  }
  function ghostPose(c, pass, ph, blink) {
    // travelling wave along the tail: each ripple lags the one before it
    const a = ph * TAU, w1 = Math.sin(a), w2 = Math.sin(a - 1.5), w3 = Math.sin(a - 3.0);
    const reach = 0.5 + 0.5 * Math.sin(a + 0.6);
    ghostArm(c, pass, 4.0, -10.4, 7.0, -9.0 + w2 * 0.6, 8.4 + reach * 0.8, -9.8 + w2 * 0.6, 0.6);
    ghostBody(c, w1, w2, w3); fillIn(c, pass, 'rgba(6,26,44,0.58)');
    if (pass === 'full') {
      c.save(); ghostBody(c, w1, w2, w3); c.clip();
      ghostBody(c, w1, w2, w3); c.strokeStyle = 'rgba(111,244,255,0.2)'; c.lineWidth = 3.4; c.stroke();
      c.restore();
    }
    ghostBody(c, w1, w2, w3); tube(c, pass, P.cyan, 1.15);
    c.beginPath();
    const ey = blink ? 0.35 : 2.05;
    c.ellipse(0.2, -18.6 + (blink ? 1 : 0), 1.45, ey, -0.08, 0, TAU);
    c.moveTo(5.55, -18.4); c.ellipse(4.1, -18.4 + (blink ? 1 : 0), 1.45, ey, 0.08, 0, TAU);
    fillIn(c, pass, '#010409'); tube(c, pass, P.cyan, 0.42, { hot: false });
    if (!blink) {
      c.beginPath(); c.arc(0.7, -17.9, 0.42, 0, TAU); c.moveTo(5.0, -17.7); c.arc(4.6, -17.7, 0.42, 0, TAU);
      fillIn(c, pass, '#d8feff', '#9ff8ff');
    }
    c.beginPath(); c.ellipse(2.4, -13.1, 1.3 + 0.25 * w1, 1.9 + w1 * 0.5, 0, 0, TAU);
    fillIn(c, pass, '#010409'); tube(c, pass, P.cyan, 0.42, { hot: false });
    ghostArm(c, pass, 5.0, -12.8, 8.2, -12.6 + w1 * 0.6, 9.4 + reach * 1.0, -13.2 + w1 * 0.6, 0.65);
    const tw = 0.6 + 0.4 * Math.sin(a * 2);
    c.beginPath();
    const spk = (x, y, r) => { c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); };
    spk(-4.8, -25.6, 0.9 * tw); spk(6.6, -23.6, 0.7 * (1.4 - tw));
    tube(c, pass, '#ffffff', 0.3, { hot: false, glowCol: P.cyan });
  }

  /* ---- large creature: faceted root golem with a glowing hex core ---- */
  function limb(c, pass, pts, w, col, dark) {
    c.beginPath(); poly(c, pts);
    if (pass === 'full') {
      c.strokeStyle = col; c.lineWidth = w; c.stroke();
      c.strokeStyle = dark; c.lineWidth = w - 2.1; c.stroke();
    } else { c.strokeStyle = col; c.lineWidth = w + 0.6; c.stroke(); }
  }
  function hexPath(c, x, y, r, rot) {
    rot = rot || 0;
    for (let i = 0; i < 6; i++) {
      const t = rot + (i / 6) * TAU;
      if (i) c.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r); else c.moveTo(x + Math.cos(t) * r, y + Math.sin(t) * r);
    }
    c.closePath();
  }
  function colossusPose(c, pass, ph) {
    // heavy gait: phase is warped so each foot hangs, then drops fast (ease-in stomp)
    const wp = ph + 0.07 * Math.sin(ph * 2 * TAU);
    const a = wp * TAU, s = Math.sin(a);
    const PU = P.acid, PD = P.acidDk, GR = P.tox, dark = 'rgba(22,6,38,0.97)';
    const impact = Math.pow(Math.max(0, Math.cos(2 * a)), 6);
    c.save(); c.scale(0.92 * (1 + impact * 0.035), 0.92 * (1 - impact * 0.045));
    const bob = Math.abs(s) * -1.8 + 0.7;
    const liftL = Math.max(0, s) * 3.4, liftR = Math.max(0, -s) * 3.4;
    const arm = (sd, sw) => {
      const sx = sd * 14.0, sy = -34 + bob;
      const ex = sd * 19.4 + sw * 0.5, ey = -26.6 + bob;
      const wx = sd * 19.8 + sw * 1.2, wy = -18.8 + bob + Math.abs(sw) * 0.35;
      limb(c, pass, [sx, sy, ex, ey, wx, wy], 5.4, PU, dark);
      c.beginPath(); hexPath(c, wx + sw * 0.15, wy + 2.6, 3.7, 0.3 + sw * 0.08);
      fillIn(c, pass, dark); tube(c, pass, PU, 1.1);
      c.beginPath(); c.moveTo(wx - 2.0, wy + 2.0); c.lineTo(wx + 2.0, wy + 2.0);
      tube(c, pass, PD, 0.5, { hot: false, glow: false });
    };
    // fists swing a beat behind the legs (follow-through)
    const fs = Math.sin(a - 0.7) * 1.6;
    arm(-1, fs); arm(1, -fs);
    const leg = (cx, lift) => {
      c.beginPath();
      poly(c, [cx - 3.4, -12 + bob, cx + 3.4, -12 + bob, cx + 4.3, -lift - 1.4, cx + 5.0, -lift, cx - 5.0, -lift, cx - 4.3, -lift - 1.4], true);
      fillIn(c, pass, dark); tube(c, pass, PU, 1.15);
      c.beginPath(); c.moveTo(cx - 3.8, -6 - lift * 0.5 + bob * 0.5); c.lineTo(cx + 3.8, -6 - lift * 0.5 + bob * 0.5);
      tube(c, pass, PD, 0.55, { hot: false, glow: false });
    };
    leg(-6.2, liftL); leg(6.2, liftR);
    // crown leaves whip late after each stomp
    const lw = 0.06 * Math.sin(2 * a - 1.6) + impact * 0.05;
    c.save(); c.translate(0, -43 + bob); c.rotate(lw); c.translate(0, 43 - bob);
    const lf = (pts) => { c.beginPath(); poly(c, pts, true); fillIn(c, pass, dark); tube(c, pass, PU, 0.95); };
    lf([-6, -41 + bob, -10.5, -48 + bob, -9, -48.5 + bob, -11.5, -54 + bob, -6.5, -49.5 + bob, -3, -44 + bob]);
    lf([-2.5, -44 + bob, -2.6, -51 + bob, -1.2, -50.5 + bob, 0.4, -58 + bob, 2.6, -50 + bob, 3.6, -51 + bob, 2.8, -44 + bob]);
    lf([3.5, -43.5 + bob, 7.0, -50 + bob, 8.0, -48.6 + bob, 11.4, -52.5 + bob, 9.8, -46.5 + bob, 6.4, -40.6 + bob]);
    c.restore();
    const B = [0, -45, -9, -42.5, -15.5, -35, -17, -25, -14, -15.5, -7, -10.5, 7, -10.5, 14, -15.5, 17, -25, 15.5, -35, 9, -42.5];
    const body = () => { c.beginPath(); for (let i = 0; i < B.length; i += 2) { if (i) c.lineTo(B[i], B[i + 1] + bob); else c.moveTo(B[i], B[i + 1] + bob); } c.closePath(); };
    body(); fillIn(c, pass, dark);
    if (pass === 'full') {
      c.save(); body(); c.clip();
      c.beginPath(); c.moveTo(-18, -46 + bob); c.lineTo(18, -46 + bob); c.lineTo(18, -33.5 + bob);
      c.lineTo(9, -31.8 + bob); c.lineTo(2, -33.6 + bob); c.lineTo(-6, -31.6 + bob); c.lineTo(-18, -33.8 + bob); c.closePath();
      c.fillStyle = 'rgba(150,60,230,0.32)'; c.fill();
      c.beginPath(); c.arc(4, -26 + bob, 19, Math.PI * 0.6, Math.PI * 1.1);
      c.strokeStyle = 'rgba(70,30,170,0.6)'; c.lineWidth = 2.4; c.stroke();
      c.restore();
    }
    const I = [-6, -36, 8, -35.5, 11.5, -23, 4, -15.5, -8.5, -17.5, -11.5, -27.5];
    c.beginPath();
    for (let i = 0; i < I.length; i += 2) { if (i) c.lineTo(I[i], I[i + 1] + bob); else c.moveTo(I[i], I[i + 1] + bob); }
    c.closePath();
    const link = [[0, 0], [2, 1], [4, 1], [6, 2], [8, 2], [10, 3], [12, 3], [14, 4], [16, 5], [18, 5], [20, 0]];
    for (const [bi, ii] of link) { c.moveTo(B[bi], B[bi + 1] + bob); c.lineTo(I[ii * 2], I[ii * 2 + 1] + bob); }
    tube(c, pass, PD, 0.55, { hot: false, gw: 1.2 });
    body(); tube(c, pass, PU, 1.4);
    const cx = 2, cy = -26.5 + bob;
    c.beginPath();
    poly(c, [cx + 3.4, cy - 2.6, cx + 6.2, cy - 5.6, cx + 5.4, cy - 8.6, cx + 8.6, cy - 12.0]);
    poly(c, [cx - 3.2, cy - 2.2, cx - 6.6, cy - 4.4, cx - 8.6, cy - 8.8]);
    poly(c, [cx - 3.4, cy + 1.6, cx - 7.6, cy + 4.2, cx - 10.4, cy + 3.6, cx - 13.4, cy + 7.6]);
    poly(c, [cx + 3.6, cy + 2.0, cx + 7.2, cy + 5.0, cx + 10.6, cy + 4.4]);
    poly(c, [cx + 0.4, cy + 3.8, cx - 0.6, cy + 8.0, cx + 1.4, cy + 11.6]);
    tube(c, pass, GR, 0.6, { hot: false });
    const cr = 4.3 + Math.sin(a * 2) * 0.35 + impact * 0.5;
    c.beginPath(); hexPath(c, cx, cy, cr, Math.PI / 6);
    let cg = null;
    if (pass === 'full') {
      cg = c.createRadialGradient(cx, cy, 0, cx, cy, cr);
      cg.addColorStop(0, '#fbfff0'); cg.addColorStop(0.45, '#c8ff6a'); cg.addColorStop(1, '#45c414');
    }
    fillIn(c, pass, cg, GR);
    tube(c, pass, '#d8ff9a', 0.6, { hot: false, glowCol: GR, gw: 3 });
    c.beginPath();
    c.moveTo(2.4, -39.4 + bob); c.lineTo(6.0, -37.9 + bob);
    c.moveTo(9.2, -37.9 + bob); c.lineTo(12.6, -39.4 + bob);
    tube(c, pass, GR, 1.35);
    c.restore();
  }

  /* ---- pickups / weapons ---- */
  function gemPose(c, pass, a, big) {
    const h = big ? 5.6 : 3.7, bt = big ? 4.2 : 2.8, w = big ? 3.9 : 2.6, yc = big ? -10 : -7.5;
    const col = big ? P.gemC : P.lime;
    const vs = [];
    for (let k = 0; k < 4; k++) {
      const t = a + (k * Math.PI) / 2;
      vs.push([Math.cos(t) * w, yc + Math.sin(t) * w * 0.32, Math.sin(t)]);
    }
    const top = [0, yc - h], bot = [0, yc + bt];
    for (let k = 0; k < 4; k++) {
      const v1 = vs[k], v2 = vs[(k + 1) % 4];
      if (v1[2] + v2[2] <= 0) continue;
      const sh = 0.3 + 0.45 * ((Math.cos(a + (k * Math.PI) / 2 + Math.PI / 4 + 0.6) + 1) / 2);
      c.beginPath(); tri(c, top[0], top[1], v1[0], v1[1], v2[0], v2[1]);
      fillIn(c, pass, hexA(col, sh * 0.85), hexA(col, 0.55));
      c.beginPath(); tri(c, bot[0], bot[1], v1[0], v1[1], v2[0], v2[1]);
      fillIn(c, pass, hexA(col, sh * 0.5), hexA(col, 0.4));
    }
    let lx = vs[0], rx = vs[0];
    for (const v of vs) { if (v[0] < lx[0]) lx = v; if (v[0] > rx[0]) rx = v; }
    c.beginPath(); poly(c, [top[0], top[1], rx[0], rx[1], bot[0], bot[1], lx[0], lx[1]], true);
    tube(c, pass, col, 0.6, { hotCol: '#ffffff' });
    c.beginPath();
    for (const v of vs) if (v[2] > 0.08) { c.moveTo(top[0], top[1]); c.lineTo(v[0], v[1]); c.lineTo(bot[0], bot[1]); }
    tube(c, pass, hot(col, 0.5), 0.3, { hot: false, glow: false });
    c.beginPath(); c.arc(-w * 0.25, yc - h * 0.35, big ? 0.7 : 0.5, 0, TAU); fillIn(c, pass, '#ffffff', '#ffffff');
  }
  function seedPose(c, pass) {
    c.beginPath();
    c.moveTo(3.2, 0);
    c.bezierCurveTo(1.6, -2.0, -1.5, -1.9, -2.4, -0.9);
    c.quadraticCurveTo(-2.9, 0, -2.4, 0.9);
    c.bezierCurveTo(-1.5, 1.9, 1.6, 2.0, 3.2, 0);
    c.closePath();
    fillIn(c, pass, '#fff3d6', '#ffb347');
    tube(c, pass, P.seed, 0.55, { hot: false });
    c.beginPath(); c.moveTo(2.2, 0); c.lineTo(-1.6, 0);
    tube(c, pass, 'rgba(255,160,70,0.8)', 0.3, { hot: false, glow: false });
  }
  function lanternPose(c, pass) {
    const A = '#ffb84a', dark = 'rgba(32,14,2,0.95)';
    c.beginPath(); c.moveTo(-3.4, -4.6); c.bezierCurveTo(-3.6, -11.8, 3.6, -11.8, 3.4, -4.6);
    tube(c, pass, '#ffd27a', 0.55, { hot: false });
    leaf(c, pass, -0.3, -5.4, -2.2, 3.4, 1.1, '#c8ff5a', dark);
    leaf(c, pass, 0.3, -5.4, -0.95, 3.4, 1.1, '#c8ff5a', dark);
    c.beginPath(); c.moveTo(0, -5.5);
    c.bezierCurveTo(-3.6, -5.3, -5.7, -2.8, -5.7, 0.2);
    c.bezierCurveTo(-5.7, 3.6, -2.8, 5.4, 0, 5.6);
    c.bezierCurveTo(2.8, 5.4, 5.7, 3.6, 5.7, 0.2);
    c.bezierCurveTo(5.7, -2.8, 3.6, -5.3, 0, -5.5); c.closePath();
    fillIn(c, pass, dark); tube(c, pass, A, 0.95);
    c.beginPath();
    tri(c, -3.4, -0.4, -1.1, -0.4, -2.25, -2.6);
    tri(c, 1.1, -0.4, 3.4, -0.4, 2.25, -2.6);
    c.moveTo(-3.3, 1.3); c.lineTo(-2.0, 2.0); c.lineTo(-1.2, 1.4); c.lineTo(0, 2.1); c.lineTo(1.2, 1.4); c.lineTo(2.0, 2.0); c.lineTo(3.3, 1.3);
    c.quadraticCurveTo(0, 5.1, -3.3, 1.3); c.closePath();
    fillIn(c, pass, pass === 'full' ? faceGrad(c, 0, 0.6, 4.4) : null, '#ffc040');
    c.beginPath(); c.moveTo(0, 5.6); c.quadraticCurveTo(0.7, 7.6, -0.6, 8.9);
    tube(c, pass, A, 0.55, { hot: false });
  }

  /* ================= props ================= */
  function extrudeOutline(c, pass, outline, dx, dy, links, col, back, dark) {
    c.beginPath(); outline(dx, dy); tube(c, pass, back, 0.5, { hot: false, gw: 1.4 });
    c.beginPath();
    for (const [x, y] of links) { c.moveTo(x, y); c.lineTo(x + dx, y + dy); }
    tube(c, pass, back, 0.5, { hot: false, gw: 1.4 });
    c.beginPath(); outline(0, 0); c.closePath(); fillIn(c, pass, dark); tube(c, pass, col, 0.9);
  }
  function graveRound(c, pass) {
    const dark = 'rgba(12,8,30,0.95)';
    const w = 5.2, h = 10.5, dx = 1.9, dy = -1.4;
    c.beginPath(); poly(c, [-7.0, 0.8, 7.6, 0.8, 9.0, -0.6, -5.6, -0.6], true); fillIn(c, pass, dark); tube(c, pass, P.lavDk, 0.55, { hot: false });
    const outline = (ox, oy) => { c.moveTo(-w + ox, oy - 0.6); c.lineTo(-w + ox, -h + oy); c.arc(ox, -h + oy, w, Math.PI, 0); c.lineTo(w + ox, oy - 0.6); };
    extrudeOutline(c, pass, outline, dx, dy, [[w, -0.6], [w, -h], [-0.59 * w, -h - 0.81 * w]], P.lav, P.lavDk, dark);
    c.beginPath(); c.moveTo(0, -13.4); c.lineTo(0, -5.4); c.moveTo(-2.4, -10.8); c.lineTo(2.4, -10.8);
    tube(c, pass, '#e8e0ff', 0.6);
  }
  function graveCross(c, pass) {
    const dark = 'rgba(12,8,30,0.95)';
    const pts = [-1.6, 0, -1.6, -12.9, -5.6, -12.9, -5.6, -16.1, -1.6, -16.1, -1.6, -20, 1.6, -20, 1.6, -16.1, 5.6, -16.1, 5.6, -12.9, 1.6, -12.9, 1.6, 0];
    const outline = (ox, oy) => { c.moveTo(pts[0] + ox, pts[1] + oy); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i] + ox, pts[i + 1] + oy); };
    extrudeOutline(c, pass, outline, 1.6, -1.2, [[1.6, 0], [5.6, -12.9], [5.6, -16.1], [1.6, -20], [-1.6, -20]], P.lav, P.lavDk, dark);
    c.beginPath(); c.moveTo(-7.4, 1.2); c.quadraticCurveTo(0, -3.4, 7.8, 1.2);
    tube(c, pass, P.lavDk, 0.6, { hot: false });
  }
  function graveSmall(c, pass) {
    const dark = 'rgba(12,8,30,0.95)';
    c.save(); c.rotate(-0.13);
    const w = 4.4, h = 8.6;
    const outline = (ox, oy) => {
      c.moveTo(-w + ox, oy); c.lineTo(-w + ox, -h + 1.6 + oy); c.quadraticCurveTo(-w + ox, -h + oy, -w + 1.6 + ox, -h + oy);
      c.lineTo(w - 1.6 + ox, -h + oy); c.quadraticCurveTo(w + ox, -h + oy, w + ox, -h + 1.6 + oy); c.lineTo(w + ox, oy);
    };
    extrudeOutline(c, pass, outline, 1.5, -1.1, [[w, 0], [w, -h + 1.6], [-w + 1.0, -h + 0.3]], P.lav, P.lavDk, dark);
    c.beginPath();
    c.moveTo(-2.4, -6.4); c.lineTo(2.4, -6.4); c.moveTo(-2.4, -4.6); c.lineTo(1.6, -4.6); c.moveTo(-2.4, -2.8); c.lineTo(2.0, -2.8);
    tube(c, pass, '#b8a8ff', 0.4, { hot: false });
    c.restore();
  }
  function fence(c, pass, v) {
    // v0: picket run; v1: broken run with a fallen picket and a sagging rail
    const col = P.lav;
    c.beginPath();
    const posts = v ? [[-11, 0.06], [-3.6, -0.22], [11, -0.04]] : [[-11, 0.06], [-3.6, -0.05], [3.8, 0.08], [11, -0.04]];
    for (const [x, r] of posts) {
      const tx = x + Math.sin(r) * 11;
      c.moveTo(x, 0); c.lineTo(tx, -10); c.lineTo(tx + 0.9, -11.6); c.lineTo(tx + 1.8, -10); c.lineTo(x + 1.8, 0);
    }
    tube(c, pass, col, 0.65);
    c.beginPath();
    if (v) {
      c.moveTo(-12.5, -3.4); c.quadraticCurveTo(0, -1.0, 13.2, -3.0); c.moveTo(-12.2, -7.4); c.lineTo(-2.0, -8.0);
      c.moveTo(2.0, 0.6); c.lineTo(8.6, -1.4); c.lineTo(9.6, -0.4); c.lineTo(3.0, 1.6); c.closePath();
    } else { c.moveTo(-12.5, -3.4); c.lineTo(13.2, -3.0); c.moveTo(-12.2, -7.4); c.lineTo(13.0, -7.9); }
    tube(c, pass, P.lavDk, 0.7, { hot: false });
  }
  function lamp(c, pass, v) {
    // v0: single crook street lamp; v1: twin-arm road lamp
    const col = '#7fd8ff', dark = 'rgba(6,10,26,0.95)';
    c.beginPath(); c.moveTo(-2.2, 0.4); c.lineTo(2.2, 0.4); c.lineTo(1.2, -1.4); c.lineTo(-1.2, -1.4); c.closePath();
    fillIn(c, pass, dark); tube(c, pass, col, 0.6, { hot: false });
    const head = (sx) => {
      c.beginPath(); poly(c, [sx * 2.6, -30.8, sx * 7.6, -30.8, sx * 8.8, -28.6, sx * 1.6, -28.6], true);
      fillIn(c, pass, dark); tube(c, pass, col, 0.7, { hot: false });
      c.beginPath(); c.ellipse(sx * 5.2, -28.0, 2.2, 0.9, 0, 0, Math.PI);
      fillIn(c, pass, '#fff1c6', '#ffbe55');
    };
    c.beginPath(); c.moveTo(0, -1.4); c.lineTo(0, -25); c.quadraticCurveTo(0, -30.6, 5.0, -30.6);
    if (v) { c.moveTo(0, -25); c.quadraticCurveTo(0, -30.6, -5.0, -30.6); }
    tube(c, pass, col, 0.85);
    c.beginPath(); c.moveTo(-1.0, -8); c.lineTo(1.0, -8); c.moveTo(-1.0, -9.4); c.lineTo(1.0, -9.4);
    tube(c, pass, '#4a7fb0', 0.4, { hot: false, glow: false });
    head(1);
    if (v) head(-1);
  }
  function pumpkinProp(c, pass, v) {
    const dark = 'rgba(30,9,2,0.96)';
    const one = (x, y, rx, ry, face) => {
      pumpkinPath(c, x, y, rx, ry, 0.05); fillIn(c, pass, dark);
      if (pass === 'full') {
        c.beginPath();
        c.moveTo(x - rx * 0.45, y - ry * 0.92); c.quadraticCurveTo(x - rx * 0.92, y, x - rx * 0.45, y + ry * 0.92);
        c.moveTo(x + rx * 0.45, y - ry * 0.92); c.quadraticCurveTo(x + rx * 0.92, y, x + rx * 0.45, y + ry * 0.92);
        c.strokeStyle = 'rgba(255,110,30,0.5)'; c.lineWidth = 0.5; c.stroke();
      }
      pumpkinPath(c, x, y, rx, ry, 0.05); tube(c, pass, '#ff8a2a', 1.0);
      c.beginPath(); c.moveTo(x, y - ry + 0.4); c.quadraticCurveTo(x + 0.2, y - ry - 1.6, x + 1.6, y - ry - 2.2);
      tube(c, pass, P.stem, 0.9);
      if (face) {
        const k = rx / 7;
        c.beginPath();
        tri(c, x - 4.2 * k, y - 2.2 * k, x - 1.2 * k, y - 0.6 * k, x - 3.4 * k, y + 0.4 * k);
        tri(c, x + 4.2 * k, y - 2.2 * k, x + 1.2 * k, y - 0.6 * k, x + 3.4 * k, y + 0.4 * k);
        c.moveTo(x - 4.6 * k, y + 1.4 * k);
        for (let i = 0; i <= 8; i++) c.lineTo(x - 4.6 * k + i * 1.15 * k, y + (i % 2 ? 2.6 : 1.6) * k);
        c.quadraticCurveTo(x, y + 6.0 * k, x - 4.6 * k, y + 1.4 * k); c.closePath();
        fillIn(c, pass, pass === 'full' ? faceGrad(c, x, y + 0.5, 6 * k) : null, '#ffaa00');
      }
    };
    if (v === 0) one(0, -5.7, 7.2, 5.6, true);
    else { one(-3.0, -5.4, 6.6, 5.3, true); one(5.6, -3.4, 4.0, 3.2, false); }
  }
  function pylon(c, pass, v) {
    // v0: tall obelisk with a floating ring; v1: squat twin-band beacon
    const col = '#ff4fd8', band = P.cyan, dark = 'rgba(20,4,26,0.95)';
    const H = v ? 22 : 28, top = v ? 25 : 32, bw = v ? 4.4 : 3.6, tw = v ? 2.6 : 1.8;
    const front = [-bw, 0, -tw, -H, 0, -top, tw, -H, bw, 0];
    const dx = 1.7, dy = -1.2;
    c.beginPath(); poly(c, [bw + dx, dy, tw + dx, -H + dy, dx, -top + dy]); c.moveTo(bw, 0); c.lineTo(bw + dx, dy);
    c.moveTo(tw, -H); c.lineTo(tw + dx, -H + dy); c.moveTo(0, -top); c.lineTo(dx, -top + dy);
    tube(c, pass, '#9b3a9a', 0.5, { hot: false, gw: 1.3 });
    c.beginPath(); poly(c, front, true); fillIn(c, pass, dark); tube(c, pass, col, 0.85);
    c.beginPath();
    const bands = v ? [-6, -9, -16] : [-7, -14, -21];
    for (const y of bands) { const hw = bw - ((bw - tw) * -y) / H; c.moveTo(-hw, y); c.lineTo(hw, y); }
    tube(c, pass, band, 0.55, { hot: false });
    c.beginPath(); c.moveTo(0, -3); c.lineTo(0, -H + 2);
    tube(c, pass, 'rgba(255,79,216,0.45)', 0.35, { hot: false, glow: false });
    const oy = v ? -top - 2.6 : -36.4;
    c.beginPath(); c.arc(0.4, oy, v ? 1.3 : 1.7, 0, TAU); fillIn(c, pass, '#ffe4fb', '#ff4fd8');
    tube(c, pass, col, 0.45, { hot: false });
    if (!v) { c.beginPath(); c.ellipse(0.4, oy, 3.6, 1.0, -0.15, 0, TAU); tube(c, pass, band, 0.35, { hot: false }); }
    else {
      c.beginPath(); c.moveTo(-3.4, oy + 1.2); c.lineTo(-1.6, oy); c.moveTo(4.2, oy + 1.2); c.lineTo(2.4, oy);
      tube(c, pass, band, 0.4, { hot: false });
    }
  }
  function holoTree(c, pass, seed, sc) {
    const rng = U.rng(seed);
    const segs = [];
    const fruit = [];
    sc = sc || 1;
    const br = (x, y, ang, len, d) => {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      segs.push([x, y, x2, y2, d]);
      if (d === 0) { if (rng.chance(0.28)) fruit.push([x2, y2]); return; }
      const n = d >= 3 ? 2 : rng.int(1, 2);
      for (let i = 0; i < n; i++) {
        const side = n === 2 ? (i ? 1 : -1) : rng.sign();
        br(x2, y2, ang + side * rng.range(0.28, 0.62), len * rng.range(0.62, 0.8), d - 1);
      }
    };
    br(0, 0, -Math.PI / 2 + rng.range(-0.08, 0.08), 13 * sc, 4);
    c.beginPath(); c.ellipse(0, 0, 6.5 * sc, 1.8 * sc, 0, 0, TAU);
    fillIn(c, pass, 'rgba(4,22,24,0.9)'); tube(c, pass, '#2ef2d0', 0.6, { hot: false });
    c.beginPath(); c.ellipse(0, 0, 3.6 * sc, 1.0 * sc, 0, 0, TAU); tube(c, pass, '#2ef2d0', 0.4, { hot: false });
    // trunk carries the strongest line, twigs fade out (big → small detail)
    for (let d = 4; d >= 0; d--) {
      c.beginPath();
      for (const s of segs) if (s[4] === d) { c.moveTo(s[0], s[1]); c.lineTo(s[2], s[3]); }
      tube(c, pass, d >= 3 ? '#38f5d6' : d >= 1 ? '#2fd6bd' : '#23a894', 0.35 + d * 0.22, d === 0 ? { hot: false } : undefined);
    }
    for (const [x, y] of fruit) {
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 1.6);
      tube(c, pass, '#38f5d6', 0.3, { hot: false, glow: false });
      c.beginPath(); c.arc(x, y + 2.6, 1.05, 0, TAU); fillIn(c, pass, '#ffcf6a', '#ff9a2e');
    }
  }
  function reeds(c, pass, v) {
    // shore reeds: thin dim stems, a few hot seed tips (small accents clustered on the waterline)
    const rng = U.rng(700 + v * 13);
    const n = 7 + v * 2;
    c.beginPath();
    const tips = [];
    for (let i = 0; i < n; i++) {
      const x = rng.range(-8, 8), h = rng.range(8, 17) * (v === 2 ? 0.75 : 1), b = rng.range(-1.6, 1.6);
      c.moveTo(x, 0); c.quadraticCurveTo(x + b * 0.4, -h * 0.5, x + b, -h);
      if (rng.chance(0.55)) tips.push(x + b, -h);
      if (rng.chance(0.4)) { c.moveTo(x + b * 0.25, -h * 0.35); c.quadraticCurveTo(x + b + 2.4, -h * 0.5, x + b + 3.2, -h * 0.3); }
    }
    tube(c, pass, '#2a7fd6', 0.45, { hot: false, gw: 1.4 });
    c.beginPath();
    for (let i = 0; i < tips.length; i += 2) { c.moveTo(tips[i], tips[i + 1] - 1.2); c.lineTo(tips[i], tips[i + 1] + 1.0); }
    tube(c, pass, '#8fe6ff', 0.75);
  }
  function signPost(c, pass, v) {
    const dark = 'rgba(10,4,24,0.96)';
    c.beginPath(); c.moveTo(-0.7, 0); c.lineTo(-0.7, -17.5); c.moveTo(0.7, 0); c.lineTo(0.7, -17.5);
    tube(c, pass, '#9a8cff', 0.55, { hot: false });
    c.beginPath(); c.rect(-9.5, -29.5, 19, 12); fillIn(c, pass, dark); tube(c, pass, '#ff4fd8', 0.85);
    c.beginPath(); c.rect(-8.2, -28.2, 16.4, 9.4); tube(c, pass, P.cyan, 0.4, { hot: false });
    const cy = -23.5;
    if (v === 0) {
      pumpkinPath(c, -4.2, cy, 2.8, 2.3, 0.06); tube(c, pass, '#ff8a2a', 0.6);
      c.beginPath(); tri(c, -5.4, cy - 0.2, -4.4, cy - 0.2, -4.9, cy - 1.2); tri(c, -3.6, cy - 0.2, -2.6, cy - 0.2, -3.1, cy - 1.2);
      fillIn(c, pass, '#ffe08a', '#ffaa00');
      c.beginPath(); c.moveTo(0.4, cy); c.lineTo(6.0, cy); c.moveTo(4.0, cy - 2.0); c.lineTo(6.0, cy); c.lineTo(4.0, cy + 2.0);
      tube(c, pass, P.scarf, 0.7);
    } else if (v === 1) {
      c.beginPath(); c.arc(-3.0, cy, 3.0, -1.2, 2.0, false); c.arc(-1.8, cy - 0.6, 2.4, 1.7, -0.9, true); c.closePath();
      fillIn(c, pass, '#fff4c8', '#ffe07a');
      c.beginPath();
      const st = (x, y, r) => { c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); };
      st(2.6, cy - 2.0, 0.9); st(5.4, cy + 0.6, 0.7); st(2.4, cy + 2.4, 0.6);
      tube(c, pass, P.cyan, 0.4, { hot: false });
    } else {
      c.beginPath(); c.moveTo(-3.6, cy - 3.4); c.lineTo(0, cy + 3.4); c.lineTo(3.6, cy - 3.4); c.closePath();
      tube(c, pass, P.mag, 0.6);
      c.beginPath(); c.moveTo(0, cy - 1.8); c.lineTo(0, cy + 0.6); c.moveTo(0, cy + 1.9); c.lineTo(0, cy + 2.0);
      tube(c, pass, P.scarf, 0.6);
    }
  }
  function shrine(c, pass) {
    const dark = 'rgba(16,4,26,0.95)';
    c.beginPath(); hexPath(c, 0, 0, 9, 0); c.closePath();
    c.save(); c.scale(1, 0.32); c.restore();
    c.beginPath(); c.ellipse(0, 0, 10, 3.2, 0, 0, TAU); fillIn(c, pass, dark); tube(c, pass, P.vio, 0.7);
    c.beginPath(); c.ellipse(0, -2.6, 7.5, 2.4, 0, 0, TAU); fillIn(c, pass, dark); tube(c, pass, P.vio, 0.6, { hot: false });
    c.beginPath(); c.moveTo(-10, 0); c.lineTo(-7.5, -2.6); c.moveTo(10, 0); c.lineTo(7.5, -2.6);
    tube(c, pass, P.vio, 0.5, { hot: false });
    c.save(); c.translate(0, -8); c.scale(1.15, 1.15);
    leaf(c, pass, -0.6, -20.6, -2.25, 5.6, 1.9, P.vio, dark);
    leaf(c, pass, 0.6, -20.6, -0.9, 5.8, 1.9, P.vio, dark);
    leaf(c, pass, 0, -20.8, -1.6, 7.2, 2.2, P.vio, dark);
    bulbPath(c); fillIn(c, pass, 'rgba(30,4,32,0.7)'); tube(c, pass, P.mag, 1.0);
    c.beginPath(); c.arc(0, -12, 2.2, 0, TAU); fillIn(c, pass, '#ffe0fa', '#ff3ad6');
    c.beginPath(); c.ellipse(0, -11.6, 12.5, 3.4, 0.0, 0, TAU); tube(c, pass, P.cyan, 0.4, { hot: false });
    c.restore();
  }

  /** Prop sprite with floor glow pool and a faint glossy floor reflection baked in. */
  function bakeProp(l, t, r, draw, o) {
    o = o || {};
    const refl = o.refl === undefined ? 0.36 : o.refl;
    const b = Math.max(6, t * refl + 3);
    const S = bakeSet(l, t, r, b, draw, o);
    const W = S.img.width, H = S.img.height, fx = l * K, fy = t * K;
    const { c, ctx } = U.canvas(W, H);
    if (o.pool) {
      const [pc, pr, pa, px] = o.pool;
      ctx.save(); ctx.translate(fx + (px || 0) * K, fy); ctx.scale(1, 0.34);
      const R = pr * K, g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, hexA(pc, pa)); g.addColorStop(0.45, hexA(pc, pa * 0.4)); g.addColorStop(1, hexA(pc, 0));
      ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2); ctx.restore();
    }
    if (refl > 0) {
      const tmp = U.canvas(W, H);
      const tc = tmp.ctx;
      tc.save(); tc.translate(0, fy); tc.scale(1, -refl); tc.translate(0, -fy); tc.drawImage(S.img, 0, 0); tc.restore();
      tc.globalCompositeOperation = 'destination-in';
      const g = tc.createLinearGradient(0, fy, 0, fy + t * refl * K);
      g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      tc.fillStyle = g; tc.fillRect(0, 0, W, H);
      tc.globalCompositeOperation = 'source-over';
      tc.clearRect(0, 0, W, fy);
      ctx.drawImage(tmp.c, 0, 0);
    }
    if (o.holo) {
      // hologram: cut thin horizontal gaps
      const tmp = U.canvas(W, H);
      tmp.ctx.drawImage(S.img, 0, 0);
      tmp.ctx.globalCompositeOperation = 'destination-out';
      tmp.ctx.fillStyle = 'rgba(0,0,0,0.55)';
      for (let y = 0; y < fy; y += K * 2.2) tmp.ctx.fillRect(0, y, W, K * 0.55);
      ctx.drawImage(tmp.c, 0, 0);
    } else ctx.drawImage(S.img, 0, 0);
    return { img: c, w: S.w, h: S.h, ax: S.ax, ay: S.ay };
  }

  /* ================= ground ================= */
  const CELL = 4, MARG = 2;
  const NS = 256 / CELL + 1 + MARG * 2; // field samples per side (69)
  const MN = NS - 2;                     // mask samples per side (67)
  const REG = [
    { base: [8, 8, 32], line: [136, 104, 255], glyph: '#b0a4ff' },  // violet square grid
    { base: [3, 15, 21], line: [30, 214, 196], glyph: '#62f2dc' },  // teal hex grid
    { base: [30, 4, 22], line: [255, 64, 206], glyph: '#ff86e4' },  // magenta halftone dots
    { base: [14, 9, 15], line: [255, 150, 64], glyph: '#ffb46a' },  // copper circuit board
  ];
  const WATER = { base: [2, 9, 30], line: [48, 140, 255] };
  const TSOFT = 0.012, WT = 0.635;

  function sampleFields(x, y, o) {
    const qx = U.fbm(x / 1150, y / 1150, 501, 2) - 0.5;
    const qy = U.fbm(x / 1150 + 7.3, y / 1150 - 3.1, 502, 2) - 0.5;
    const X = x / 1050 + qx * 1.3, Y = y / 1050 + qy * 1.3;
    o[0] = U.fbm(X, Y, 11, 2);
    o[1] = U.fbm(X + 13.1, Y - 7.7, 23, 2);
    o[2] = U.fbm(X - 5.3, Y + 19.9, 37, 2);
    o[3] = U.fbm(X + 29.3, Y + 3.7, 41, 2);
    o[4] = U.fbm(x / 560 + qx * 0.9 + 3.3, y / 560 + qy * 0.9, 77, 3);
    o[5] = U.fbm(x / 240, y / 240, 91, 2);
    o[6] = roadField(x, y, qx, qy);
  }
  function waterAt(x, y) {
    const qx = U.fbm(x / 1150, y / 1150, 501, 2) - 0.5, qy = U.fbm(x / 1150 + 7.3, y / 1150 - 3.1, 502, 2) - 0.5;
    return U.fbm(x / 560 + qx * 0.9 + 3.3, y / 560 + qy * 0.9, 77, 3);
  }
  /** Light roads are the 0.5 iso-line of a slow warped noise: long meandering lanes that never dead-end. */
  function roadField(x, y, qx, qy) {
    if (qx === undefined) {
      qx = U.fbm(x / 1150, y / 1150, 501, 2) - 0.5;
      qy = U.fbm(x / 1150 + 7.3, y / 1150 - 3.1, 502, 2) - 0.5;
    }
    return U.fbm(x / 780 + qx * 0.6 - 4.1, y / 780 + qy * 0.6 + 9.7, 1201, 2);
  }
  /** Approximate distance (world units) to the road centre line. */
  function roadDist(x, y) {
    const f = roadField(x, y) - 0.5, gx = roadField(x + 2, y) - roadField(x - 2, y), gy = roadField(x, y + 2) - roadField(x, y - 2);
    const g = Math.hypot(gx, gy) / 4 || 1e-6;
    return Math.abs(f) / g;
  }
  function regionOf(o) {
    let best = 0;
    for (let i = 1; i < 4; i++) if (o[i] > o[best]) best = i;
    return best;
  }
  function* fieldsGen(info) {
    const n = NS, ox = info.wx - MARG * CELL, oy = info.wy - MARG * CELL;
    const m = [new Float32Array(n * n), new Float32Array(n * n), new Float32Array(n * n), new Float32Array(n * n)];
    const wat = new Float32Array(n * n), sig = new Float32Array(n * n), road = new Float32Array(n * n);
    const o = new Float32Array(7);
    for (let j = 0; j < n; j++) {
      if ((j & 7) === 7) yield;
      for (let i = 0; i < n; i++) {
        sampleFields(ox + i * CELL, oy + j * CELL, o);
        const k = j * n + i;
        m[0][k] = o[0]; m[1][k] = o[1]; m[2][k] = o[2]; m[3][k] = o[3]; wat[k] = o[4]; sig[k] = o[5]; road[k] = o[6];
      }
    }
    return { m, wat, sig, road, ox, oy };
  }
  function buildMasks(F) {
    const n = NS;
    const base = new ImageData(MN, MN);
    const masks = [];
    const maxA = new Float32Array(5);
    for (let i = 0; i < 5; i++) masks.push(new ImageData(MN, MN));
    const bd = base.data, e = new Float32Array(4);
    for (let j = 0; j < MN; j++) {
      for (let i = 0; i < MN; i++) {
        const k = (j + 1) * n + (i + 1), o = (j * MN + i) * 4;
        let mx = -1;
        for (let q = 0; q < 4; q++) if (F.m[q][k] > mx) mx = F.m[q][k];
        let sum = 0;
        for (let q = 0; q < 4; q++) { e[q] = Math.exp((F.m[q][k] - mx) / TSOFT); sum += e[q]; }
        const ww = U.smoothstep(WT - 0.01, WT + 0.01, F.wat[k]);
        const sg = F.sig[k];
        // patterns gather in districts (calm gaps between them) and fade out on the road shoulders
        const rn = 1 - U.smoothstep(0.006, 0.03, Math.abs(F.road[k] - 0.5));
        const inten = (0.16 + 0.84 * U.smoothstep(0.38, 0.74, sg)) * (1 - 0.8 * rn);
        const bright = (0.72 + 0.5 * sg) * (1 - 0.3 * rn);
        let r = 0, g = 0, b = 0;
        for (let q = 0; q < 4; q++) {
          const w = (e[q] / sum) * (1 - ww);
          const R = REG[q].base;
          r += R[0] * w; g += R[1] * w; b += R[2] * w;
          const A = w * inten;
          const md = masks[q].data;
          md[o] = md[o + 1] = md[o + 2] = 255; md[o + 3] = A * 255;
          if (A > maxA[q]) maxA[q] = A;
        }
        r += WATER.base[0] * ww; g += WATER.base[1] * ww; b += WATER.base[2] * ww;
        const wa = ww * (0.65 + 0.35 * inten);
        const md = masks[4].data;
        md[o] = md[o + 1] = md[o + 2] = 255; md[o + 3] = wa * 255;
        if (wa > maxA[4]) maxA[4] = wa;
        bd[o] = r * bright; bd[o + 1] = g * bright; bd[o + 2] = b * bright; bd[o + 3] = 255;
      }
    }
    return { base, masks, maxA };
  }

  /* ---- floor patterns (drawn in world coords onto a scratch canvas, then masked) ---- */
  function patGrid(c, info) {
    const px = 1 / info.res, h = 0.5 * px;
    const x0 = info.wx - 32, y0 = info.wy - 32, x1 = info.wx + info.size + 32, y1 = info.wy + info.size + 32;
    c.lineWidth = px;
    c.beginPath();
    for (let x = Math.ceil(x0 / 8) * 8; x <= x1; x += 8) { if (mod(x, 32) === 0) continue; c.moveTo(x + h, y0); c.lineTo(x + h, y1); }
    for (let y = Math.ceil(y0 / 8) * 8; y <= y1; y += 8) { if (mod(y, 32) === 0) continue; c.moveTo(x0, y + h); c.lineTo(x1, y + h); }
    c.strokeStyle = 'rgba(120,80,255,0.09)'; c.stroke();
    c.beginPath();
    for (let x = Math.ceil(x0 / 32) * 32; x <= x1; x += 32) { c.moveTo(x + h, y0); c.lineTo(x + h, y1); }
    for (let y = Math.ceil(y0 / 32) * 32; y <= y1; y += 32) { c.moveTo(x0, y + h); c.lineTo(x1, y + h); }
    c.strokeStyle = 'rgba(120,70,255,0.1)'; c.lineWidth = px * 4; c.stroke();
    c.strokeStyle = 'rgba(165,115,255,0.34)'; c.lineWidth = px; c.stroke();
    c.beginPath();
    for (let x = Math.ceil(x0 / 64) * 64; x <= x1; x += 64) {
      for (let y = Math.ceil(y0 / 64) * 64; y <= y1; y += 64) {
        c.moveTo(x - 2.6 + h, y + h); c.lineTo(x + 2.6 + h, y + h); c.moveTo(x + h, y - 2.6 + h); c.lineTo(x + h, y + 2.6 + h);
      }
    }
    c.strokeStyle = 'rgba(225,200,255,0.6)'; c.lineWidth = px * 1.6; c.stroke();
  }
  function hexStroke(c, x, y, r) {
    for (let i = 0; i < 6; i++) {
      const t = -Math.PI / 2 + (i / 6) * TAU;
      if (i) c.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r); else c.moveTo(x + Math.cos(t) * r, y + Math.sin(t) * r);
    }
    c.closePath();
  }
  function patHex(c, info) {
    const s = 9, w = Math.sqrt(3) * s, rh = 1.5 * s;
    const x0 = info.wx - w * 2, x1 = info.wx + info.size + w * 2, y0 = info.wy - s * 3, y1 = info.wy + info.size + s * 3;
    const r0 = Math.floor(y0 / rh), r1 = Math.ceil(y1 / rh);
    const lit = [];
    c.beginPath();
    for (let r = r0; r <= r1; r++) {
      const cy = r * rh, off = (r & 1) ? w / 2 : 0;
      const q0 = Math.floor((x0 - off) / w), q1 = Math.ceil((x1 - off) / w);
      for (let q = q0; q <= q1; q++) {
        const cx = q * w + off;
        c.moveTo(cx, cy - s); c.lineTo(cx + w / 2, cy - s / 2); c.lineTo(cx + w / 2, cy + s / 2); c.lineTo(cx, cy + s);
        const hv = U.hash2(q, r, 313);
        if (hv < 0.075) lit.push(cx, cy, hv);
      }
    }
    c.lineWidth = 1 / info.res; c.strokeStyle = 'rgba(40,215,195,0.24)'; c.stroke();
    if (lit.length) {
      c.beginPath();
      for (let i = 0; i < lit.length; i += 3) hexStroke(c, lit[i], lit[i + 1], s * 0.97);
      c.fillStyle = 'rgba(40,215,195,0.075)'; c.fill();
      c.beginPath();
      for (let i = 0; i < lit.length; i += 3) hexStroke(c, lit[i], lit[i + 1], s * 0.52);
      c.strokeStyle = 'rgba(100,255,230,0.6)'; c.lineWidth = 1.4 / info.res; c.stroke();
      c.beginPath();
      for (let i = 0; i < lit.length; i += 3) if (lit[i + 2] < 0.025) { c.moveTo(lit[i] + 1.1, lit[i + 1]); c.arc(lit[i], lit[i + 1], 1.1, 0, TAU); }
      c.fillStyle = 'rgba(160,255,240,0.85)'; c.fill();
    }
  }
  function patDots(c, info) {
    const sp = 6;
    const y0 = Math.floor(info.wy / sp) * sp - sp, y1 = info.wy + info.size + sp;
    const big = [];
    c.beginPath();
    for (let y = y0; y <= y1; y += sp) {
      const off = mod(y / sp, 2) ? sp / 2 : 0;
      const x0 = Math.floor(info.wx / sp) * sp - sp + off, x1 = info.wx + info.size + sp;
      for (let x = x0; x <= x1; x += sp) {
        const n = U.noise(x / 120, y / 120, 61);
        const r = 0.42 + 1.25 * U.smoothstep(0.3, 0.78, n);
        c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
        if (U.hash2(Math.round(x * 2), y, 77) < 0.012) big.push(x, y);
      }
    }
    c.fillStyle = 'rgba(255,70,200,0.36)'; c.fill();
    if (big.length) {
      c.beginPath();
      for (let i = 0; i < big.length; i += 2) { c.moveTo(big[i] + 0.9, big[i + 1]); c.arc(big[i], big[i + 1], 0.9, 0, TAU); }
      c.fillStyle = 'rgba(255,200,245,0.95)'; c.fill();
      c.beginPath();
      for (let i = 0; i < big.length; i += 2) { c.moveTo(big[i] + 2.6, big[i + 1]); c.arc(big[i], big[i + 1], 2.6, 0, TAU); }
      c.strokeStyle = 'rgba(255,90,220,0.5)'; c.lineWidth = 1 / info.res; c.stroke();
    }
  }
  function offsetPoly(pts, d) {
    const n = pts.length / 2, out = [];
    for (let i = 0; i < n; i++) {
      let nx = 0, ny = 0, sx = 0, sy = 0;
      if (i > 0) {
        const dx = pts[2 * i] - pts[2 * i - 2], dy = pts[2 * i + 1] - pts[2 * i - 1], l = Math.hypot(dx, dy) || 1;
        nx += -dy / l; ny += dx / l; sx = -dy / l; sy = dx / l;
      }
      if (i < n - 1) {
        const dx = pts[2 * i + 2] - pts[2 * i], dy = pts[2 * i + 3] - pts[2 * i + 1], l = Math.hypot(dx, dy) || 1;
        nx += -dy / l; ny += dx / l; if (i === 0) { sx = -dy / l; sy = dx / l; }
      }
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const sc = 1 / Math.max(0.5, nx * sx + ny * sy);
      out.push(pts[2 * i] + nx * d * sc, pts[2 * i + 1] + ny * d * sc);
    }
    return out;
  }
  function patCircuit(c, info) {
    const cell = 26, M = 104;
    const cx0 = Math.floor((info.wx - M) / cell), cx1 = Math.floor((info.wx + info.size + M) / cell);
    const cy0 = Math.floor((info.wy - M) / cell), cy1 = Math.floor((info.wy + info.size + M) / cell);
    const pads = [], vias = [];
    c.beginPath();
    for (let j = cy0; j <= cy1; j++) {
      for (let i = cx0; i <= cx1; i++) {
        const rng = U.rng(U.hashInt(i, j, 9001));
        // traces run in clustered boards, not evenly over the whole region
        const cl = U.smoothstep(0.42, 0.68, U.fbm((i * cell) / 340, (j * cell) / 340, 919, 2));
        if (!rng.chance(0.06 + 0.5 * cl)) continue;
        const sx = i * cell + rng.int(0, 12) * 2, sy = j * cell + rng.int(0, 12) * 2;
        let dir = rng.int(0, 3) * (Math.PI / 2) + (rng.chance(0.25) ? Math.PI / 4 : 0);
        const pts = [sx, sy];
        let x = sx, y = sy;
        const nseg = rng.int(2, 3);
        for (let k = 0; k < nseg; k++) {
          const L = rng.range(8, 26);
          x += Math.cos(dir) * L; y += Math.sin(dir) * L;
          pts.push(x, y);
          dir += rng.sign() * (Math.PI / 4);
        }
        const nt = rng.chance(0.45) ? rng.int(2, 3) : 1;
        for (let t = 0; t < nt; t++) {
          const p = nt === 1 ? pts : offsetPoly(pts, (t - (nt - 1) / 2) * 2.8);
          c.moveTo(p[0], p[1]);
          for (let q = 2; q < p.length; q += 2) c.lineTo(p[q], p[q + 1]);
          pads.push(p[p.length - 2], p[p.length - 1]);
          vias.push(p[0], p[1]);
        }
      }
    }
    c.strokeStyle = 'rgba(255,150,60,0.27)'; c.lineWidth = 0.6; c.stroke();
    c.beginPath();
    for (let i = 0; i < pads.length; i += 2) { c.moveTo(pads[i] + 1.2, pads[i + 1]); c.arc(pads[i], pads[i + 1], 1.2, 0, TAU); }
    c.strokeStyle = 'rgba(255,190,100,0.5)'; c.lineWidth = 0.55; c.stroke();
    c.beginPath();
    for (let i = 0; i < vias.length; i += 2) { c.moveTo(vias[i] + 0.7, vias[i + 1]); c.arc(vias[i], vias[i + 1], 0.7, 0, TAU); }
    c.fillStyle = 'rgba(255,175,90,0.55)'; c.fill();
    // chips
    const ccell = 96;
    const qx0 = Math.floor((info.wx - 20) / ccell), qx1 = Math.floor((info.wx + info.size + 20) / ccell);
    const qy0 = Math.floor((info.wy - 20) / ccell), qy1 = Math.floor((info.wy + info.size + 20) / ccell);
    c.beginPath();
    const pins = [];
    for (let j = qy0; j <= qy1; j++) {
      for (let i = qx0; i <= qx1; i++) {
        const rng = U.rng(U.hashInt(i, j, 777));
        if (!rng.chance(0.3)) continue;
        const w = rng.int(5, 8) * 2, h = rng.int(3, 5) * 2;
        const x = i * ccell + rng.range(10, ccell - 10 - w), y = j * ccell + rng.range(10, ccell - 10 - h);
        c.rect(x, y, w, h);
        for (let k = 1; k < w / 2; k++) pins.push(x + k * 2, y, x + k * 2, y - 2, x + k * 2, y + h, x + k * 2, y + h + 2);
        c.moveTo(x + 2.2, y + 1.6); c.arc(x + 1.6, y + 1.6, 0.6, 0, TAU);
      }
    }
    c.fillStyle = 'rgba(255,150,60,0.06)'; c.fill();
    c.strokeStyle = 'rgba(255,170,80,0.45)'; c.lineWidth = 0.55; c.stroke();
    if (pins.length) {
      c.beginPath();
      for (let i = 0; i < pins.length; i += 4) { c.moveTo(pins[i], pins[i + 1]); c.lineTo(pins[i + 2], pins[i + 3]); }
      c.strokeStyle = 'rgba(255,170,80,0.5)'; c.lineWidth = 0.5; c.stroke();
    }
  }
  function patWater(c, info) {
    const px = 1 / info.res, h = 0.5 * px;
    const x0 = info.wx - 4, x1 = info.wx + info.size + 4;
    const y0 = Math.floor(info.wy / 2) * 2 - 2, y1 = info.wy + info.size + 2;
    c.beginPath();
    for (let y = y0; y <= y1; y += 2) { c.moveTo(x0, y + h); c.lineTo(x1, y + h); }
    c.strokeStyle = 'rgba(40,130,255,0.24)'; c.lineWidth = px; c.stroke();
    // glints (moonlight on the water), continuous across chunks
    const cell = 16, M = 20;
    const gx0 = Math.floor((info.wx - M) / cell), gx1 = Math.floor((info.wx + info.size + M) / cell);
    const gy0 = Math.floor((info.wy - M) / cell), gy1 = Math.floor((info.wy + info.size + M) / cell);
    const g1 = [], g2 = [];
    for (let j = gy0; j <= gy1; j++) {
      for (let i = gx0; i <= gx1; i++) {
        const rng = U.rng(U.hashInt(i, j, 4141));
        if (!rng.chance(0.55)) continue;
        const x = i * cell + rng.range(0, cell), y = Math.floor((j * cell + rng.range(0, cell)) / 2) * 2;
        const L = rng.range(2, 12);
        (rng.chance(0.3) ? g2 : g1).push(x, y + h, L);
      }
    }
    c.beginPath();
    for (let i = 0; i < g1.length; i += 3) { c.moveTo(g1[i] - g1[i + 2] / 2, g1[i + 1]); c.lineTo(g1[i] + g1[i + 2] / 2, g1[i + 1]); }
    c.strokeStyle = 'rgba(90,190,255,0.55)'; c.lineWidth = px; c.stroke();
    c.beginPath();
    for (let i = 0; i < g2.length; i += 3) { c.moveTo(g2[i] - g2[i + 2] / 2, g2[i + 1]); c.lineTo(g2[i] + g2[i + 2] / 2, g2[i + 1]); }
    c.strokeStyle = 'rgba(200,240,255,0.8)'; c.lineWidth = px; c.stroke();
  }
  const PATTERNS = [patGrid, patHex, patDots, patCircuit, patWater];

  let scratch = null, maskC = null, baseC = null;
  function getScratch(px) {
    if (!scratch || scratch.c.width !== px) scratch = U.canvas(px, px);
    return scratch;
  }
  function layer(ctx, info, i, maskData) {
    const px = info.px, res = info.res;
    const sc = getScratch(px), s = sc.ctx;
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.globalCompositeOperation = 'source-over'; s.globalAlpha = 1;
    s.clearRect(0, 0, px, px);
    s.setTransform(res, 0, 0, res, -info.wx * res, -info.wy * res);
    s.lineCap = 'butt'; s.lineJoin = 'round';
    PATTERNS[i](s, info);
    maskC.ctx.putImageData(maskData, 0, 0);
    s.globalCompositeOperation = 'destination-in';
    s.imageSmoothingEnabled = true;
    s.drawImage(maskC.c, info.wx - 1.5 * CELL, info.wy - 1.5 * CELL, MN * CELL, MN * CELL);
    s.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(sc.c, 0, 0);
    ctx.restore();
  }

  /* ---- contours (marching squares on the world-aligned field grid -> seamless glowing borders) ---- */
  function march(f, n, ox, oy, cs, iso, path, skip, skipT) {
    let cnt = 0;
    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        const k = j * n + i;
        const a = f[k] - iso, b = f[k + 1] - iso, cc = f[k + n + 1] - iso, d = f[k + n] - iso;
        let id = 0;
        if (a > 0) id |= 1; if (b > 0) id |= 2; if (cc > 0) id |= 4; if (d > 0) id |= 8;
        if (id === 0 || id === 15) continue;
        if (skip && skip[k] > skipT && skip[k + 1] > skipT && skip[k + n] > skipT && skip[k + n + 1] > skipT) continue;
        const x = ox + i * cs, y = oy + j * cs;
        const tX = x + (cs * a) / (a - b), tY = y;
        const rX = x + cs, rY = y + (cs * b) / (b - cc);
        const bX = x + (cs * d) / (d - cc), bY = y + cs;
        const lX = x, lY = y + (cs * a) / (a - d);
        switch (id) {
          case 1: case 14: path.moveTo(lX, lY); path.lineTo(tX, tY); break;
          case 2: case 13: path.moveTo(tX, tY); path.lineTo(rX, rY); break;
          case 3: case 12: path.moveTo(lX, lY); path.lineTo(rX, rY); break;
          case 4: case 11: path.moveTo(rX, rY); path.lineTo(bX, bY); break;
          case 6: case 9: path.moveTo(tX, tY); path.lineTo(bX, bY); break;
          case 7: case 8: path.moveTo(lX, lY); path.lineTo(bX, bY); break;
          case 5: path.moveTo(lX, lY); path.lineTo(tX, tY); path.moveTo(rX, rY); path.lineTo(bX, bY); break;
          case 10: path.moveTo(tX, tY); path.lineTo(rX, rY); path.moveTo(lX, lY); path.lineTo(bX, bY); break;
        }
        cnt++;
      }
    }
    return cnt;
  }
  function glowStroke(ctx, path, col, res, k) {
    ctx.strokeStyle = rgba(col, 0.05 * k); ctx.lineWidth = 6; ctx.stroke(path);
    ctx.strokeStyle = rgba(col, 0.15 * k); ctx.lineWidth = 2.0; ctx.stroke(path);
    ctx.strokeStyle = rgba(U.mix(col, [255, 255, 255], 0.35), 0.62 * k); ctx.lineWidth = 1.15 / res; ctx.stroke(path);
  }
  function drawContours(ctx, info, F) {
    const n = NS;
    const f = new Float32Array(n * n);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 4; i++) {
      let any = false, all = true;
      const mi = F.m[i];
      for (let k = 0; k < n * n; k++) {
        let mo = -1;
        for (let q = 0; q < 4; q++) if (q !== i && F.m[q][k] > mo) mo = F.m[q][k];
        const v = mi[k] - mo;
        f[k] = v;
        if (v > 0) any = true; else all = false;
      }
      if (!any || all) continue;
      const p = new Path2D();
      if (!march(f, n, F.ox, F.oy, CELL, 0, p, F.wat, WT + 0.004)) continue;
      glowStroke(ctx, p, REG[i].line, info.res, 0.4);
    }
    let anyW = false, allW = true;
    for (let k = 0; k < n * n; k++) { if (F.wat[k] > WT) anyW = true; else allW = false; }
    if (anyW && !allW) {
      const p = new Path2D();
      if (march(F.wat, n, F.ox, F.oy, CELL, WT, p)) glowStroke(ctx, p, [90, 200, 255], info.res, 0.95);
    }
    if (anyW) {
      const p2 = new Path2D();
      if (march(F.wat, n, F.ox, F.oy, CELL, WT + 0.022, p2)) glowStroke(ctx, p2, [60, 150, 255], info.res, 0.32);
    }
    ctx.restore();
  }

  /* ---- light roads: dark lane with thin violet kerbs and a dim warm centre line ---- */
  function drawRoads(ctx, info, F) {
    const f = F.road;
    let any = false, all = true;
    for (let k = 0; k < f.length; k++) { if (f[k] > 0.5) any = true; else all = false; }
    if (!any || all) return;
    const p = new Path2D();
    if (!march(f, NS, F.ox, F.oy, CELL, 0.5, p, F.wat, WT - 0.012)) return;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(110,80,255,0.045)'; ctx.lineWidth = 17; ctx.stroke(p);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#3a2f86'; ctx.lineWidth = 11.6; ctx.stroke(p);
    ctx.strokeStyle = '#06050d'; ctx.lineWidth = 10.4; ctx.stroke(p);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,150,70,0.07)'; ctx.lineWidth = 2.4; ctx.stroke(p);
    ctx.strokeStyle = 'rgba(255,190,120,0.34)'; ctx.lineWidth = 0.5; ctx.stroke(p);
    ctx.restore();
  }

  /* ---- decals: glyph clusters around landmarks ---- */
  function glyphPath(c, type) {
    switch (type) {
      case 'cross': c.moveTo(0, -1.2); c.lineTo(0, 1.2); c.moveTo(-0.7, -0.45); c.lineTo(0.7, -0.45); break;
      case 'moon': c.arc(0, 0, 1, 0.9, 5.4, false); c.arc(0.55, -0.2, 0.78, 4.9, 1.2, true); c.closePath(); break;
      case 'star': c.moveTo(0, -1.2); c.quadraticCurveTo(0, 0, 1.2, 0); c.quadraticCurveTo(0, 0, 0, 1.2); c.quadraticCurveTo(0, 0, -1.2, 0); c.quadraticCurveTo(0, 0, 0, -1.2); break;
      case 'diamond': c.moveTo(0, -1); c.lineTo(0.7, 0); c.lineTo(0, 1); c.lineTo(-0.7, 0); c.closePath(); c.moveTo(0.25, 0); c.arc(0, 0, 0.25, 0, TAU); break;
      case 'tri': c.moveTo(0, -1); c.lineTo(0.9, 0.6); c.lineTo(-0.9, 0.6); c.closePath(); break;
      case 'ring': c.moveTo(1, 0); c.arc(0, 0, 1, 0, TAU); c.moveTo(-1.5, 0); c.lineTo(-1.15, 0); c.moveTo(1.15, 0); c.lineTo(1.5, 0); break;
      case 'chev': c.moveTo(-1.1, -0.8); c.lineTo(-0.3, 0); c.lineTo(-1.1, 0.8); c.moveTo(0.1, -0.8); c.lineTo(0.9, 0); c.lineTo(0.1, 0.8); break;
      case 'bat':
        c.moveTo(0, -0.2); c.quadraticCurveTo(-0.5, -0.7, -1.4, -0.5); c.quadraticCurveTo(-1.0, -0.1, -1.1, 0.4);
        c.quadraticCurveTo(-0.6, 0.1, -0.35, 0.45); c.quadraticCurveTo(-0.15, 0.1, 0, 0.35); c.quadraticCurveTo(0.15, 0.1, 0.35, 0.45);
        c.quadraticCurveTo(0.6, 0.1, 1.1, 0.4); c.quadraticCurveTo(1.0, -0.1, 1.4, -0.5); c.quadraticCurveTo(0.5, -0.7, 0, -0.2); c.closePath(); break;
      case 'rune': c.moveTo(-0.6, -1); c.lineTo(-0.6, 1); c.moveTo(-0.6, -0.2); c.lineTo(0.6, -1); c.moveTo(-0.6, -0.2); c.lineTo(0.6, 0.8); break;
      case 'pumpkin':
        c.ellipse(0, 0.1, 1.15, 0.92, 0, 0, TAU);
        c.moveTo(-0.55, -0.1); c.lineTo(-0.2, -0.1); c.lineTo(-0.38, -0.45); c.closePath();
        c.moveTo(0.2, -0.1); c.lineTo(0.55, -0.1); c.lineTo(0.38, -0.45); c.closePath();
        c.moveTo(-0.6, 0.35); c.quadraticCurveTo(0, 0.85, 0.6, 0.35);
        c.moveTo(0, -0.8); c.quadraticCurveTo(0.05, -1.15, 0.35, -1.25); break;
    }
  }
  const GLYPHS = ['cross', 'moon', 'star', 'diamond', 'tri', 'ring', 'chev', 'bat', 'rune'];
  function drawGlyph(ctx, type, x, y, s, rot, col, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.beginPath(); glyphPath(ctx, type);
    ctx.restore();
    ctx.strokeStyle = hexA(col, a * 0.16); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = hexA(col, a); ctx.lineWidth = 0.5; ctx.stroke();
  }
  function landmark(ctx, type, x, y, r, col, a) {
    const ln = (w, alpha) => { ctx.strokeStyle = hexA(col, alpha); ctx.lineWidth = w; ctx.stroke(); };
    ctx.beginPath();
    if (type === 'target') {
      ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
      ctx.moveTo(x + r * 0.82, y); ctx.arc(x, y, r * 0.82, 0, TAU);
      ctx.moveTo(x + r * 0.3, y); ctx.arc(x, y, r * 0.3, 0, TAU);
      for (let i = 0; i < 36; i++) {
        const t = (i / 36) * TAU, l = i % 3 === 0 ? 0.12 : 0.06;
        ctx.moveTo(x + Math.cos(t) * r * 1.02, y + Math.sin(t) * r * 1.02); ctx.lineTo(x + Math.cos(t) * r * (1.02 + l), y + Math.sin(t) * r * (1.02 + l));
      }
      ctx.moveTo(x - r * 0.62, y); ctx.lineTo(x - r * 0.36, y); ctx.moveTo(x + r * 0.36, y); ctx.lineTo(x + r * 0.62, y);
      ctx.moveTo(x, y - r * 0.62); ctx.lineTo(x, y - r * 0.36); ctx.moveTo(x, y + r * 0.36); ctx.lineTo(x, y + r * 0.62);
    } else if (type === 'clock') {
      ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
      ctx.moveTo(x + r * 0.9, y); ctx.arc(x, y, r * 0.9, 0, TAU);
      for (let i = 0; i < 12; i++) {
        const t = (i / 12) * TAU - Math.PI / 2, l = i % 3 === 0 ? 0.2 : 0.1;
        ctx.moveTo(x + Math.cos(t) * r * 0.86, y + Math.sin(t) * r * 0.86); ctx.lineTo(x + Math.cos(t) * r * (0.86 - l), y + Math.sin(t) * r * (0.86 - l));
      }
      const hA = -Math.PI / 2 - 0.035, mA = -Math.PI / 2 - 0.1;
      ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(hA) * r * 0.48, y + Math.sin(hA) * r * 0.48);
      ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(mA) * r * 0.72, y + Math.sin(mA) * r * 0.72);
      ctx.moveTo(x + 1.2, y); ctx.arc(x, y, 1.2, 0, TAU);
    } else if (type === 'pumpkin') {
      ctx.save(); ctx.translate(x, y); ctx.scale(r / 1.2, r / 1.2); glyphPath(ctx, 'pumpkin'); ctx.restore();
    } else {
      ctx.arc(x, y, r, 0.9, 5.4, false); ctx.arc(x + r * 0.55, y - r * 0.2, r * 0.78, 4.9, 1.2, true); ctx.closePath();
      const st = (sx, sy, sr) => { ctx.moveTo(sx - sr, sy); ctx.lineTo(sx + sr, sy); ctx.moveTo(sx, sy - sr); ctx.lineTo(sx, sy + sr); };
      st(x + r * 1.3, y - r * 0.8, r * 0.12); st(x + r * 1.6, y + r * 0.2, r * 0.08); st(x + r * 1.1, y + r * 0.9, r * 0.1);
    }
    ln(5, a * 0.05); ln(1.8, a * 0.16); ln(0.55, a);
  }
  function* decalsGen(ctx, info) {
    // no evenly scattered dust or glyphs: detail is clustered into a few floor plazas, each a landmark
    // ringed by a designed band of glyphs; the floor between them stays calm
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const o = new Float32Array(7);
    G.scatter(info, 360, 3131, 58, (x, y, rng) => {
      if (!rng.chance(0.55)) return;
      if (G.nearSpawn(x, y, 60)) return;
      sampleFields(x, y, o);
      if (o[4] > WT - 0.03) return;
      if (roadDist(x, y) < 34) return;
      const reg = regionOf(o);
      const type = rng.pick(['target', 'clock', 'pumpkin', 'moon']);
      const col = type === 'pumpkin' ? '#ff9a3c' : type === 'moon' ? '#ffe9a8' : REG[reg].glyph;
      const r = rng.range(18, 26);
      landmark(ctx, type, x, y, r, col, 0.36);
      const g1 = rng.pick(GLYPHS), g2 = rng.pick(GLYPHS), n = rng.int(6, 9), rr = r + rng.range(9, 13), a0 = rng.range(0, TAU);
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * TAU;
        drawGlyph(ctx, i % 2 ? g2 : g1, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.62, i % 2 ? 1.9 : 2.4, 0, REG[reg].glyph, i % 3 ? 0.3 : 0.5);
      }
    });
    yield;
    ctx.restore();
  }

  /* ================= runtime state ================= */
  let JACK = null, CREEP = null, CREEPB = null, GHOST = null, GHOSTB = null, GHOSTG = null, COLO = null;
  let GEMS = null, GEMB = null, SEED = null, TRAIL = null, LANTERN = null, PROPS = null;
  let POOL = null, GLOW = null, BEAM = null;
  let NUM = null, numCheck = 0;
  let OVL = null, OVLkey = '';
  let glitchReq = 0, glitchT0 = -99, glitchDur = 0;
  let pbView = null, pbLast = null;

  /* ---- batched additive particles ---- */
  const PB = new Map();
  let pbPending = false;
  function pbBucket(color, alpha, lwq) {
    const aq = alpha > 0.82 ? 4 : alpha > 0.55 ? 3 : alpha > 0.3 ? 2 : 1;
    const key = color + aq + lwq;
    let b = PB.get(key);
    if (!b) { b = { color, a: aq / 4, lw: [0.45, 0.8, 1.3][lwq], lines: [], rings: [], dots: [] }; PB.set(key, b); }
    pbPending = true;
    return b;
  }
  function pbFlush(ctx) {
    if (!pbPending) return;
    pbPending = false;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const b of PB.values()) {
      if (b.lines.length || b.rings.length) {
        ctx.beginPath();
        const L = b.lines;
        for (let i = 0; i < L.length; i += 4) { ctx.moveTo(L[i], L[i + 1]); ctx.lineTo(L[i + 2], L[i + 3]); }
        const R = b.rings;
        for (let i = 0; i < R.length; i += 4) { ctx.moveTo(R[i] + R[i + 2], R[i + 1]); ctx.ellipse(R[i], R[i + 1], R[i + 2], R[i + 3], 0, 0, TAU); }
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = b.a * 0.28; ctx.lineWidth = b.lw * 3.2; ctx.stroke();
        ctx.globalAlpha = b.a; ctx.lineWidth = b.lw; ctx.stroke();
        L.length = 0; R.length = 0;
      }
      if (b.dots.length) {
        const D = b.dots;
        ctx.beginPath();
        for (let i = 0; i < D.length; i += 3) ctx.rect(D[i] - D[i + 2] / 2, D[i + 1] - D[i + 2] / 2, D[i + 2], D[i + 2]);
        ctx.fillStyle = b.color; ctx.globalAlpha = b.a; ctx.fill();
        D.length = 0;
      }
    }
    ctx.restore();
  }

  /* ---- damage digits (baked lazily once the web font is there) ---- */
  function fontLoaded(fam) {
    if (!document.fonts) return false;
    let ok = false;
    document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === fam && f.status === 'loaded') ok = true; });
    return ok;
  }
  function bakeDigits(fam, real) {
    const mk = (fill, glow, edge, weight) => {
      const fs = 46, H = 70, pad = 12;
      const m = U.canvas(8, 8).ctx;
      m.font = weight + ' ' + fs + 'px ' + fam;
      const chars = '0123456789';
      const adv = [], xs = [];
      let W = 0;
      for (const ch of chars) { const a = Math.ceil(m.measureText(ch).width); adv.push(a); xs.push(W); W += a + pad * 2; }
      const { c, ctx } = U.canvas(W, H);
      ctx.font = m.font; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.lineJoin = 'round';
      for (let i = 0; i < 10; i++) {
        const x = xs[i] + pad, y = H / 2 + 2;
        ctx.filter = 'blur(6px)'; ctx.fillStyle = glow; ctx.fillText(chars[i], x, y);
        ctx.filter = 'blur(2px)'; ctx.fillText(chars[i], x, y);
        ctx.filter = 'none';
        ctx.strokeStyle = edge; ctx.lineWidth = 6; ctx.strokeText(chars[i], x, y);
        ctx.fillStyle = fill; ctx.fillText(chars[i], x, y);
      }
      return { c, xs, adv, pad, H };
    };
    return {
      real,
      norm: mk('#f4fdff', '#2fd8ff', 'rgba(3,8,26,0.92)', 700),
      crit: mk('#ffe58a', '#ff6a1a', 'rgba(32,6,2,0.92)', 900),
    };
  }
  function digits(rt) {
    if (NUM && NUM.real) return NUM;
    if (--numCheck <= 0) {
      numCheck = 20;
      if (fontLoaded('Orbitron')) NUM = bakeDigits("'Orbitron', sans-serif", true);
    }
    if (!NUM) NUM = bakeDigits("'Consolas', 'Segoe UI', monospace", false);
    return NUM;
  }

  /* ---- particles helpers ---- */
  function spark(game, x, y, z, ang, spd, color, life, size) {
    game.addParticle({ x, y, z, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd * 0.7, vz: 0, life, size: size || 2, color, kind: 'nspark', drag: 3.5 });
  }
  function ring(game, x, y, z, r0, r1, color, life, sq, lw, a0) {
    game.addParticle({ x, y, z, r0, r1, color, life, kind: 'ring', sq: sq || 0.55, lw: lw || 1.2, a0: a0 || 1, drag: 0 });
  }
  function flash(game, x, y, z, color, size, life) {
    game.addParticle({ kind: 'nflash', x, y, z, color, size, life, drag: 0 });
  }
  function bit(game, x, y, z, color, life) {
    game.addParticle({ kind: 'bit', x, y, z, vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 6, vz: 8 + Math.random() * 10, grav: -14, drag: 1.6, size: 0.8 + Math.random() * 0.7, color, life });
  }
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

  /* ---- designed death (350 ms): flash squash → scanline de-rez with chroma split → collapse to a floor line ---- */
  function deathFx(ctx, e, s, T, view) {
    const t = U.clamp(e.deathT, 0, 1), x = e.x, y = e.y;
    const img = s.img, iw = img.width, ih = img.height;
    const W = s.w, H = s.h, dx0 = x - s.ax * W, dy0 = y - s.ay * H;
    ctx.globalCompositeOperation = 'lighter';
    if (t < 0.22) {
      // 1 · hit-stop: white silhouette, squashed wide
      const u = t / 0.22, sx = 1 + 0.22 * Math.sin(u * Math.PI * 0.5), sy = 1 - 0.18 * Math.sin(u * Math.PI * 0.5);
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
      ctx.globalAlpha = 1; blit(ctx, s, img, 0, 0);
      ctx.globalAlpha = 1 - u * 0.4; blit(ctx, s, s.flash, 0, 0);
      ctx.restore();
    }
    if (t >= 0.14 && t < 0.86) {
      // 2 · de-rez: horizontal bands shear apart, the top dissolves first
      const u = (t - 0.14) / 0.72, n = e.type === 'colossus' ? 7 : 5, bh = ih / n, sd = Math.floor((e.seed || 0) * 9973);
      for (let i = 0; i < n; i++) {
        const st = (i / n) * 0.45, a = 1 - U.smoothstep(st, st + 0.5, u);
        if (a <= 0.01) continue;
        const dir = U.hash2(i, sd, 41) - 0.5;
        const off = dir * 2 * (6 + e.r * 0.9) * u * u;
        const sy0 = i * bh, py = dy0 + (sy0 / ih) * H, ph = (bh / ih) * H;
        ctx.globalAlpha = a;
        ctx.drawImage(img, 0, sy0, iw, bh, dx0 + off, py, W, ph);
        if (!(i & 1)) continue;
        ctx.globalAlpha = a * 0.6;
        ctx.drawImage(s.red, 0, sy0, iw, bh, dx0 + off - 1.5 - u * 3, py, W, ph);
        ctx.drawImage(s.cyan, 0, sy0, iw, bh, dx0 + off + 1.5 + u * 3, py, W, ph);
      }
    }
    if (t >= 0.5) {
      // 3 · collapse: what is left folds into a hot line on the floor that shrinks to a point
      const u = (t - 0.5) / 0.5, w = e.r * 2.4 * (1 - u * u), lift = (1 - u) * T.h * 0.35;
      ctx.globalAlpha = Math.min(1, (1 - u) * 1.6);
      ctx.fillStyle = hot(T.col, 0.55);
      ctx.fillRect(x - w / 2, y - lift - 0.45, w, 0.9);
      ctx.globalAlpha *= 0.3;
      ctx.fillStyle = T.col;
      ctx.fillRect(x - w * 0.6, y - lift - 1.4, w * 1.2, 2.8);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---- designed spawn (450 ms): floor sigil gathers in → beam → body builds bottom-up → overshoot settle ---- */
  function spawnFx(ctx, e, s, T, view) {
    const p = U.clamp(e.spawnT, 0, 1), x = e.x, y = e.y, rt = view.rt;
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = T.col; ctx.lineCap = 'round';
    // sigil: three dashed arcs that rotate and close in (anticipation)
    const sa = p < 0.7 ? Math.min(1, p / 0.15) : Math.max(0, 1 - (p - 0.7) / 0.3);
    if (sa > 0) {
      const rr = e.r * (2.5 - 1.3 * U.ease.outQuad(Math.min(1, p / 0.6)));
      const rot = rt * 3 + (e.seed || 0) * 10;
      ctx.globalAlpha = sa * 0.85; ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) { const a0 = rot + (i / 3) * TAU; ctx.ellipse(x, y, rr, rr * 0.4, 0, a0, a0 + 1.4); }
      ctx.stroke();
      ctx.globalAlpha = sa * 0.22; ctx.lineWidth = 3.2; ctx.stroke();
    }
    // light column
    const ba = p < 0.35 ? p / 0.35 : Math.max(0, 1 - (p - 0.35) / 0.5);
    if (ba > 0 && BEAM) {
      ctx.globalAlpha = ba * 0.5;
      const bw = e.r * 1.3, bh = T.top * 1.25;
      ctx.drawImage(BEAM, x - bw / 2, y - bh, bw, bh);
    }
    ctx.globalCompositeOperation = 'source-over';
    // build from the feet up, with a hot scan edge
    const b = U.smoothstep(0.22, 0.88, p);
    if (b > 0) {
      const img = s.img, iw = img.width, ih = img.height;
      const pop = p > 0.86 ? 1 + 0.08 * Math.sin(((p - 0.86) / 0.14) * Math.PI) : 1;
      const W = s.w, H = s.h * pop, dx = x - s.ax * W, dy = y - s.ay * H;
      const cut = ih * (1 - b);
      ctx.globalAlpha = 0.55 + 0.45 * b;
      if (ih - cut > 1) ctx.drawImage(img, 0, cut, iw, ih - cut, dx, dy + H * (1 - b), W, H * b);
      if (b < 1) {
        const sy = Math.max(dy + H * (1 - b), y - T.top - 2);
        const hw = e.r * 1.3;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = hot(T.col, 0.55);
        ctx.fillRect(x - hw, sy - 0.35, hw * 2, 0.7);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = T.col;
        ctx.fillRect(x - hw * 0.9, sy, hw * 1.8, Math.max(0, y - sy));
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---- overlay builder ---- */
  function buildOverlay(W, H) {
    const { c, ctx } = U.canvas(W, H);
    const step = H > 1100 ? 4 : 3;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < H; y += step) ctx.fillRect(0, y, W, 1);
    const g = ctx.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.32, W / 2, H * 0.5, Math.hypot(W, H) * 0.56);
    g.addColorStop(0, 'rgba(6,0,18,0)'); g.addColorStop(0.62, 'rgba(6,0,18,0.3)'); g.addColorStop(1, 'rgba(2,0,8,0.78)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // lens fringe: magenta on the left edge, cyan on the right edge (slight chromatic aberration)
    const fw = W * 0.09;
    let lg = ctx.createLinearGradient(0, 0, fw, 0);
    lg.addColorStop(0, 'rgba(255,40,200,0.10)'); lg.addColorStop(1, 'rgba(255,40,200,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = lg; ctx.fillRect(0, 0, fw, H);
    lg = ctx.createLinearGradient(W, 0, W - fw, 0);
    lg.addColorStop(0, 'rgba(40,220,255,0.09)'); lg.addColorStop(1, 'rgba(40,220,255,0)');
    ctx.fillStyle = lg; ctx.fillRect(W - fw, 0, fw, H);
    ctx.globalCompositeOperation = 'source-over';
    return c;
  }

  /* ================= icons ================= */
  function drawIconImpl(ctx, id, size) {
    const s = size / 96;
    ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const small = size <= 48;
    const LW = small ? 7.5 : 4.6;
    const blur = size / 9;
    const neon = (col, w, fill) => {
      w = w || LW;
      if (fill) { ctx.shadowColor = col; ctx.shadowBlur = blur; ctx.fillStyle = fill; ctx.fill(); }
      ctx.shadowColor = col; ctx.shadowBlur = blur;
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
      ctx.shadowBlur = blur * 0.4; ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = hot(col, 0.65); ctx.lineWidth = w * 0.36; ctx.stroke();
    };
    const solid = (col, glowCol) => { ctx.shadowColor = glowCol || col; ctx.shadowBlur = blur; ctx.fillStyle = col; ctx.fill(); ctx.shadowBlur = 0; };
    const seed = (x, y, ang, L, col) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(L / 10, L / 10);
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.bezierCurveTo(5, -6.4, -4.6, -6, -7.4, -2.8); ctx.quadraticCurveTo(-9, 0, -7.4, 2.8); ctx.bezierCurveTo(-4.6, 6, 5, 6.4, 10, 0); ctx.closePath();
      ctx.restore();
      neon(col || '#ff9a2e', LW * 0.75, 'rgba(255,200,120,0.35)');
    };
    switch (id) {
      case 'hp-heart': {
        ctx.beginPath(); ctx.moveTo(48, 80); ctx.bezierCurveTo(22, 62, 10, 46, 14, 32); ctx.bezierCurveTo(18, 16, 40, 12, 48, 30);
        ctx.bezierCurveTo(56, 12, 78, 16, 82, 32); ctx.bezierCurveTo(86, 46, 74, 62, 48, 80); ctx.closePath();
        neon('#ff3d8b', LW, 'rgba(255,40,120,0.25)');
        if (!small) { ctx.beginPath(); ctx.moveTo(26, 46); ctx.lineTo(38, 46); ctx.lineTo(43, 36); ctx.lineTo(50, 58); ctx.lineTo(55, 44); ctx.lineTo(70, 44); neon('#6ff4ff', 3); }
        break;
      }
      case 'kills': {
        ctx.beginPath(); ctx.moveTo(44, 30); ctx.quadraticCurveTo(30, 22, 30, 8); ctx.quadraticCurveTo(42, 14, 46, 28);
        ctx.moveTo(52, 30); ctx.quadraticCurveTo(66, 20, 70, 8); ctx.quadraticCurveTo(56, 12, 50, 28);
        neon('#b066ff', LW * 0.75);
        ctx.beginPath(); ctx.moveTo(48, 28); ctx.bezierCurveTo(26, 28, 14, 46, 18, 60); ctx.bezierCurveTo(22, 76, 36, 84, 48, 84);
        ctx.bezierCurveTo(60, 84, 74, 76, 78, 60); ctx.bezierCurveTo(82, 46, 70, 28, 48, 28); ctx.closePath();
        neon('#ff3ad6', LW, 'rgba(255,58,214,0.18)');
        ctx.beginPath(); ctx.moveTo(32, 48); ctx.lineTo(42, 58); ctx.moveTo(42, 48); ctx.lineTo(32, 58); ctx.moveTo(54, 48); ctx.lineTo(64, 58); ctx.moveTo(64, 48); ctx.lineTo(54, 58);
        neon('#ffe0fa', LW * 0.7);
        break;
      }
      case 'dmg': {
        seed(46, 50, -0.8, 34, '#ff9a2e');
        ctx.beginPath(); ctx.moveTo(70, 26); ctx.lineTo(86, 10); ctx.moveTo(74, 34); ctx.lineTo(90, 30); ctx.moveTo(62, 22); ctx.lineTo(66, 6);
        neon('#ffe14a', LW * 0.6);
        ctx.beginPath(); ctx.moveTo(24, 76); ctx.lineTo(40, 60); neon('#ffffff', LW * 0.4);
        break;
      }
      case 'rate': {
        for (let i = 0; i < 3; i++) {
          const x = 30 + i * 20, y = 70 - i * 20;
          ctx.beginPath(); ctx.moveTo(x - 26, y + 4); ctx.lineTo(x - 12, y + 4); ctx.moveTo(x - 22, y + 11); ctx.lineTo(x - 13, y + 11);
          neon('#6ff4ff', LW * 0.45);
          seed(x, y + 2, 0, 15, '#ff9a2e');
        }
        break;
      }
      case 'multi': {
        ctx.beginPath(); ctx.moveTo(34, 50); ctx.bezierCurveTo(16, 60, 18, 88, 48, 88); ctx.bezierCurveTo(78, 88, 80, 60, 62, 50); ctx.closePath();
        neon('#ff8a2a', LW, 'rgba(255,120,40,0.18)');
        ctx.beginPath(); ctx.moveTo(34, 50); ctx.quadraticCurveTo(48, 56, 62, 50); ctx.moveTo(40, 52); ctx.lineTo(36, 44); ctx.moveTo(56, 52); ctx.lineTo(60, 44);
        neon('#ffe14a', LW * 0.6);
        ctx.beginPath(); ctx.ellipse(48, 70, 9, 7, 0, 0, TAU); neon('#ffae35', LW * 0.5);
        seed(30, 26, -2.2, 14); seed(48, 18, -1.57, 14); seed(66, 26, -0.94, 14);
        break;
      }
      case 'bounce': {
        ctx.setLineDash([7, 7]);
        ctx.beginPath(); ctx.moveTo(10, 78); ctx.lineTo(34, 30); ctx.lineTo(56, 70); ctx.lineTo(72, 36);
        neon('#6ff4ff', LW * 0.55);
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(26, 24); ctx.lineTo(42, 24); ctx.moveTo(48, 78); ctx.lineTo(64, 78);
        neon('#b066ff', LW * 0.7);
        seed(78, 26, -1.0, 16);
        break;
      }
      case 'lantern': {
        ctx.save(); ctx.translate(48, 54); ctx.scale(6.2, 6.2);
        ctx.beginPath(); ctx.moveTo(-3.4, -4.6); ctx.bezierCurveTo(-3.6, -11.8, 3.6, -11.8, 3.4, -4.6);
        ctx.restore(); neon('#ffd27a', LW * 0.6);
        ctx.save(); ctx.translate(48, 54); ctx.scale(6.2, 6.2);
        ctx.beginPath(); ctx.moveTo(0, -5.5); ctx.bezierCurveTo(-3.6, -5.3, -5.7, -2.8, -5.7, 0.2); ctx.bezierCurveTo(-5.7, 3.6, -2.8, 5.4, 0, 5.6);
        ctx.bezierCurveTo(2.8, 5.4, 5.7, 3.6, 5.7, 0.2); ctx.bezierCurveTo(5.7, -2.8, 3.6, -5.3, 0, -5.5); ctx.closePath();
        ctx.restore(); neon('#ffb84a', LW, 'rgba(255,150,40,0.2)');
        ctx.save(); ctx.translate(48, 54); ctx.scale(6.2, 6.2);
        ctx.beginPath(); tri(ctx, -3.4, -0.4, -1.1, -0.4, -2.25, -2.6); tri(ctx, 1.1, -0.4, 3.4, -0.4, 2.25, -2.6);
        ctx.moveTo(-3.3, 1.3); ctx.lineTo(-2.0, 2.0); ctx.lineTo(-1.2, 1.4); ctx.lineTo(0, 2.1); ctx.lineTo(1.2, 1.4); ctx.lineTo(2.0, 2.0); ctx.lineTo(3.3, 1.3);
        ctx.quadraticCurveTo(0, 5.1, -3.3, 1.3); ctx.closePath();
        ctx.restore(); solid('#fff0b8', '#ffb000');
        break;
      }
      case 'speed': {
        ctx.beginPath();
        ctx.moveTo(26, 40); ctx.quadraticCurveTo(24, 58, 30, 66); ctx.lineTo(30, 84); ctx.moveTo(30, 66);
        ctx.quadraticCurveTo(52, 70, 70, 66); ctx.quadraticCurveTo(88, 64, 86, 58); ctx.quadraticCurveTo(78, 52, 62, 50);
        ctx.quadraticCurveTo(44, 48, 36, 38); ctx.quadraticCurveTo(30, 34, 26, 40); ctx.closePath();
        neon('#9ff8ff', LW, 'rgba(120,240,255,0.15)');
        ctx.beginPath(); ctx.moveTo(40, 54); ctx.quadraticCurveTo(52, 58, 66, 56); neon('#ffffff', LW * 0.35);
        ctx.beginPath(); ctx.moveTo(4, 50); ctx.lineTo(16, 50); ctx.moveTo(8, 60); ctx.lineTo(18, 60); ctx.moveTo(2, 70); ctx.lineTo(16, 70);
        neon('#ff4fd8', LW * 0.5);
        ctx.beginPath(); const st = (x, y, r) => { ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); };
        st(74, 30, 7); st(56, 22, 4); neon('#ffffff', LW * 0.45);
        break;
      }
      case 'magnet': {
        ctx.beginPath(); ctx.moveTo(24, 52); ctx.quadraticCurveTo(48, 6, 72, 52); neon('#ffd27a', LW * 0.6);
        ctx.beginPath(); ctx.moveTo(16, 52); ctx.lineTo(80, 52); ctx.lineTo(70, 86); ctx.lineTo(26, 86); ctx.closePath();
        neon('#ffae35', LW, 'rgba(255,150,40,0.15)');
        ctx.beginPath(); ctx.moveTo(20, 64); ctx.lineTo(76, 64); ctx.moveTo(23, 75); ctx.lineTo(73, 75);
        ctx.moveTo(38, 52); ctx.lineTo(40, 86); ctx.moveTo(58, 52); ctx.lineTo(56, 86);
        neon('#c8761c', LW * 0.4);
        const gem = (x, y, r, col) => { ctx.beginPath(); ctx.moveTo(x, y - r * 1.3); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); neon(col, LW * 0.55, hexA(col, 0.35)); };
        gem(34, 30, 7, '#c6ff3a'); gem(62, 22, 6, '#45f4ff');
        ctx.beginPath(); ctx.moveTo(34, 42); ctx.lineTo(34, 46); ctx.moveTo(62, 32); ctx.lineTo(62, 40); neon('#c6ff3a', LW * 0.35);
        break;
      }
      case 'hp': {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); const x = 32 + i * 16;
          ctx.moveTo(x, 36); ctx.bezierCurveTo(x - 6, 28, x + 6, 22, x, 12);
          neon('#6ff4ff', LW * 0.45);
        }
        ctx.beginPath(); ctx.moveTo(54, 44); ctx.quadraticCurveTo(60, 30, 70, 26); ctx.moveTo(56, 44); ctx.quadraticCurveTo(68, 38, 78, 40);
        neon('#b066ff', LW * 0.6);
        ctx.beginPath(); ctx.moveTo(12, 46); ctx.lineTo(84, 46); ctx.quadraticCurveTo(84, 86, 48, 86); ctx.quadraticCurveTo(12, 86, 12, 46); ctx.closePath();
        neon('#ff3ad6', LW, 'rgba(255,58,214,0.16)');
        ctx.beginPath(); ctx.moveTo(4, 50); ctx.lineTo(12, 52); ctx.moveTo(92, 50); ctx.lineTo(84, 52); neon('#ff3ad6', LW * 0.7);
        ctx.beginPath(); ctx.moveTo(48, 56); ctx.lineTo(48, 76); ctx.moveTo(38, 66); ctx.lineTo(58, 66); neon('#c6ff3a', LW * 0.7);
        break;
      }
      default: {
        ctx.beginPath(); ctx.arc(48, 48, 30, 0, TAU); neon('#ff3ad6');
      }
    }
  }

  /* ================= CSS ================= */
  const CSS = `
body.style-neon{background:#05040d;font-family:'Rajdhani','Orbitron',system-ui,sans-serif}
body.style-neon #hud{padding:12px 22px}
body.style-neon #hud .xp{height:12px;background:rgba(8,4,22,.8);border:1px solid rgba(180,120,255,.7);border-radius:2px;box-shadow:0 0 10px rgba(160,80,255,.5),inset 0 0 6px rgba(0,0,0,.9);overflow:visible}
body.style-neon #hud .xp-fill{background:linear-gradient(90deg,#2af0ff 0%,#7dffb0 60%,#c6ff3a 100%);box-shadow:0 0 12px rgba(120,255,200,.8)}
body.style-neon #hud .xp::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 22px,rgba(5,4,13,.65) 22px 24px);pointer-events:none}
body.style-neon #hud .lvl{right:-1px;padding:1px 9px;background:#0b0620;border:1px solid #c6ff3a;font:700 11px 'Orbitron',sans-serif;color:#eaffc0;letter-spacing:1px;text-shadow:0 0 6px #b6ff3a;box-shadow:0 0 10px rgba(198,255,58,.55);z-index:2}
body.style-neon #hud .topline{margin-top:12px}
body.style-neon #hud .hp{gap:12px}
body.style-neon #hud .hp-icon{width:30px;height:30px}
body.style-neon #hud .hp-bar{width:250px;height:15px;border-radius:0;transform:skewX(-22deg);background:rgba(22,4,26,.82);border:1px solid #ff4fd8;box-shadow:0 0 12px rgba(255,60,200,.6),inset 0 0 8px rgba(0,0,0,.9)}
body.style-neon #hud .hp-fill{background:linear-gradient(90deg,#ff2bd0,#ff5a6a 45%,#ff8a1f 80%,#ffc23a);box-shadow:0 0 14px rgba(255,100,60,.9)}
body.style-neon #hud .hp-bar::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 23px,rgba(10,2,14,.85) 23px 25px)}
body.style-neon #hud .hp-text{font:700 14px 'Orbitron',sans-serif;color:#ffe0f6;letter-spacing:1px;text-shadow:0 0 6px #ff3ad6,0 0 14px rgba(255,58,214,.6)}
body.style-neon.hurt #hud .hp-bar{filter:brightness(1.8);box-shadow:0 0 24px #ff2a6a}
body.style-neon #hud .clock{margin-top:-6px}
body.style-neon #hud .clock-time{font:900 38px/1.05 'Orbitron',sans-serif;letter-spacing:3px;background:linear-gradient(180deg,#fff7e0 0%,#ffd36b 36%,#ff7a1a 62%,#ff2bd0 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 5px rgba(255,90,40,.8)) drop-shadow(0 0 16px rgba(255,43,208,.55))}
body.style-neon #hud .clock-label{font:600 10px 'Orbitron',sans-serif;letter-spacing:5px;color:#8ff8ff;opacity:1;margin-top:4px;text-shadow:0 0 6px #1ed8ff}
body.style-neon #hud .kills{font:800 24px 'Orbitron',sans-serif;color:#ffe6fb;text-shadow:0 0 8px #ff3ad6,0 0 18px rgba(255,58,214,.55);gap:8px}
body.style-neon #hud .kills-icon{width:32px;height:32px}
body.style-neon #stylebar{background:linear-gradient(90deg,rgba(30,6,40,.88),rgba(6,10,30,.88));border:1px solid rgba(255,79,216,.75);border-radius:2px;box-shadow:0 0 14px rgba(255,60,200,.35),inset 0 0 10px rgba(80,220,255,.15);font:600 13px 'Rajdhani',sans-serif;color:#d8f8ff}
body.style-neon #stylebar .style-family{font:600 9px 'Orbitron',sans-serif;letter-spacing:3px;color:#7ff6ff;opacity:1}
body.style-neon #stylebar .style-name{font:400 17px 'Audiowide',sans-serif;color:#fff;text-shadow:0 0 6px #ff7a1a,0 0 16px rgba(255,43,208,.75);letter-spacing:1px}
body.style-neon #stylemenu{background:rgba(8,4,20,.95);border:1px solid rgba(255,79,216,.6);border-radius:3px;box-shadow:0 0 20px rgba(255,60,200,.3)}
body.style-neon #stylemenu .sm-item.active{border-color:#6ff4ff;box-shadow:0 0 10px rgba(111,244,255,.4)}
body.style-neon #levelup{background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 42%,rgba(52,12,88,.6),rgba(3,2,12,.9) 72%);overflow:hidden;gap:26px}
body.style-neon #levelup::before{content:'';position:absolute;left:-40%;right:-40%;bottom:-8%;height:44%;background-image:linear-gradient(rgba(255,60,210,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,60,210,.6) 1px,transparent 1px);background-size:64px 34px;transform:perspective(320px) rotateX(62deg);transform-origin:50% 0;-webkit-mask-image:linear-gradient(transparent,#000 45%);mask-image:linear-gradient(transparent,#000 45%);opacity:.45;pointer-events:none;z-index:-1}
body.style-neon #levelup .lu-title{font:400 68px/1 'Monoton',cursive;color:#ffd36b;letter-spacing:6px;text-shadow:0 0 6px #ff8a1f,0 0 18px #ff3ad6,0 0 42px rgba(255,43,208,.7)}
body.style-neon #levelup .lu-cards{gap:30px}
body.style-neon #levelup .card{width:226px;min-height:250px;padding:22px 16px 20px;justify-content:center;gap:8px;border-radius:3px;background:linear-gradient(170deg,rgba(60,20,104,.6),rgba(9,6,26,.94) 52%,rgba(5,14,32,.95));border:1px solid rgba(111,244,255,.62);box-shadow:0 0 14px rgba(60,220,255,.24),inset 0 0 22px rgba(150,70,255,.2),inset 0 1px 0 rgba(255,255,255,.18);transition:transform .14s,box-shadow .14s,border-color .14s}
body.style-neon #levelup .card::before{content:'';position:absolute;inset:-6px;pointer-events:none;background:linear-gradient(#ff4fd8,#ff4fd8) 0 0/18px 2px no-repeat,linear-gradient(#ff4fd8,#ff4fd8) 0 0/2px 18px no-repeat,linear-gradient(#ff4fd8,#ff4fd8) 100% 0/18px 2px no-repeat,linear-gradient(#ff4fd8,#ff4fd8) 100% 0/2px 18px no-repeat,linear-gradient(#ff4fd8,#ff4fd8) 0 100%/18px 2px no-repeat,linear-gradient(#ff4fd8,#ff4fd8) 0 100%/2px 18px no-repeat,linear-gradient(#ff4fd8,#ff4fd8) 100% 100%/18px 2px no-repeat,linear-gradient(#ff4fd8,#ff4fd8) 100% 100%/2px 18px no-repeat;filter:drop-shadow(0 0 4px #ff3ad6)}
body.style-neon #levelup .card::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.07) 44%,rgba(120,240,255,.05) 50%,transparent 62%),repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 1px,transparent 1px 4px)}
body.style-neon #levelup .card:hover{transform:translateY(-8px);border-color:#ffd36b;box-shadow:0 0 28px rgba(255,160,60,.55),inset 0 0 30px rgba(255,120,40,.25)}
body.style-neon #levelup .card-icon{width:100px;height:100px}
body.style-neon #levelup .card-name{font:700 15px 'Orbitron',sans-serif;text-transform:uppercase;letter-spacing:1.5px;color:#ffe2b0;text-shadow:0 0 6px #ff8a1f,0 0 14px rgba(255,120,30,.6)}
body.style-neon #levelup .card-name::after{content:'';display:block;width:36px;height:2px;margin:10px auto 2px;background:linear-gradient(90deg,transparent,#ff4fd8 30%,#ff4fd8 70%,transparent);box-shadow:0 0 6px rgba(255,58,214,.8)}
body.style-neon #levelup .card-desc{font:500 16px/1.3 'Rajdhani',sans-serif;color:#a9e9f2;opacity:1;text-shadow:0 0 5px rgba(40,200,255,.3);max-width:180px}
body.style-neon #levelup .card-key{top:10px;left:12px;font:700 11px 'Orbitron',sans-serif;color:#ff8be8;opacity:1;padding:2px 6px;border:1px solid rgba(255,79,216,.7);box-shadow:0 0 6px rgba(255,79,216,.5)}
body.style-neon #levelup .lu-hint{font:600 11px 'Orbitron',sans-serif;letter-spacing:4px;color:#7fdbe6;opacity:.7;text-shadow:0 0 5px rgba(30,216,255,.6)}
body.style-neon #gameover{background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 45%,rgba(60,6,50,.62),rgba(3,2,12,.93) 70%)}
body.style-neon #gameover .go-title{font:400 60px 'Monoton',cursive;color:#ff9be9;text-shadow:0 0 8px #ff3ad6,0 0 26px rgba(255,43,208,.8)}
body.style-neon #gameover .go-stats{font:600 15px 'Orbitron',sans-serif;letter-spacing:1px;color:#d8f8ff;text-shadow:0 0 6px #1ed8ff}
body.style-neon #gameover .go-hint{font:600 12px 'Orbitron',sans-serif;letter-spacing:4px;color:#ffcf6a;text-shadow:0 0 6px #ff8a1f}
body.style-neon #pausebox{font:400 54px 'Monoton',cursive;color:#8ff8ff;text-shadow:0 0 10px #1ed8ff,0 0 30px rgba(30,216,255,.6)}
`;

  /* ================= style ================= */
  Styles.register({
    id: 'neon',
    name: 'Neon Mitternacht',
    family: 'Vektor · Neon',
    description: 'Glowing neon tube line-art with baked halos on a calm near-black floor of glowing roads, pattern districts and water.',
    groundColor: '#06050f',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Orbitron:wght@500;700;900', 'Audiowide', 'Monoton', 'Rajdhani:wght@500;600;700'],
    css: CSS,

    init() {
      // main character: brightest glow in the scene (glowA 1.25); creatures sit a step lower, props lower still
      const J = { glowA: 1.25 };
      JACK = { walk: [], idle: [], dash: [], hurt: null };
      for (let i = 0; i < 8; i++) JACK.walk.push(makeSprite(17, 38, 17, 6, (c, p) => jackPose(c, p, 'walk', i / 8), J));
      for (let i = 0; i < 8; i++) JACK.idle.push(makeSprite(17, 38, 17, 6, (c, p) => jackPose(c, p, 'idle', i / 8), J));
      for (const m of ['launch', 'streak', 'brake']) JACK.dash.push(makeSprite(21, 38, 21, 7, (c, p) => jackPose(c, p, m, 0), J));
      JACK.hurt = makeSprite(17, 38, 17, 6, (c, p) => jackPose(c, p, 'hurt', 0), J);
      const C = { glowA: 0.85 };
      CREEP = []; CREEPB = [];
      for (let i = 0; i < 8; i++) {
        CREEP.push(makeSprite(16, 34, 16, 6, (c, p) => creeperPose(c, p, i / 8, false), C));
        CREEPB.push(makeSprite(16, 34, 16, 6, (c, p) => creeperPose(c, p, i / 8, true), C));
      }
      GHOST = []; GHOSTB = []; GHOSTG = [];
      for (let i = 0; i < 8; i++) {
        GHOST.push(makeSprite(19, 33, 18, 6, (c, p) => ghostPose(c, p, i / 8, false), { glowA: 1.0 }));
        GHOSTB.push(makeSprite(19, 33, 18, 6, (c, p) => ghostPose(c, p, i / 8, true), { glowA: 1.0 }));
      }
      for (const fi of [0, 4]) {
        const g = [];
        for (const side of [0, 1]) {
          const src = GHOST[fi][side];
          const rng = U.rng(fi * 31 + side * 7 + 5);
          const { c, ctx } = U.canvas(src.img.width, src.img.height);
          const W = c.width, H = c.height;
          let y = 0;
          while (y < H) {
            const bh = rng.int(5, 16);
            const off = rng.chance(0.45) ? rng.range(-10, 10) : 0;
            ctx.drawImage(src.img, 0, y, W, bh, off, y, W, bh);
            if (off) {
              ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6;
              ctx.drawImage(rng.chance(0.5) ? src.red : src.cyan, 0, y, W, bh, off - 6, y, W, bh);
              ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
            }
            y += bh;
          }
          g.push(Object.assign({}, src, { img: c }));
        }
        GHOSTG.push(g);
      }
      COLO = [];
      for (let i = 0; i < 8; i++) COLO.push(makeSprite(27, 61, 27, 7, (c, p) => colossusPose(c, p, i / 8), { wide: 2.6, glowA: 0.9 }));
      GEMS = []; GEMB = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * (Math.PI / 2);
        GEMS.push(bakeSet(7, 15, 7, 6, (c, p) => gemPose(c, p, a, false), { wide: 1.6, tight: 0.5, glowA: 1.1 }));
        GEMB.push(bakeSet(9, 20, 9, 7, (c, p) => gemPose(c, p, a, true), { wide: 2.0, tight: 0.6, glowA: 1.2 }));
      }
      for (const set of [GEMS, GEMB]) {
        const big = set === GEMB;
        for (let i = 0; i < set.length; i++) {
          const s = set[i];
          const { c, ctx } = U.canvas(s.img.width, s.img.height);
          const fx = s.ax * c.width, fy = s.ay * c.height;
          ctx.save(); ctx.translate(fx, fy); ctx.scale(1, 0.38);
          const R = (big ? 7 : 5) * K, g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
          const col = big ? P.gemC : P.lime;
          g.addColorStop(0, hexA(col, 0.4)); g.addColorStop(1, hexA(col, 0));
          ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2); ctx.restore();
          ctx.drawImage(s.img, 0, 0);
          set[i] = Object.assign({}, s, { img: c });
        }
      }
      SEED = bakeSet(6, 6, 6, 6, seedPose, { wide: 1.4, tight: 0.5, glowA: 1.2 });
      TRAIL = (() => {
        const len = 24, wid = 2.4;
        const w = Math.ceil((len + 3) * K), h = Math.ceil((wid + 5) * K);
        const base = U.canvas(w, h), g = base.ctx;
        const cy = h / 2, x1 = w - 1.5 * K;
        let gr = g.createLinearGradient(0, 0, x1, 0);
        gr.addColorStop(0, 'rgba(255,90,20,0)'); gr.addColorStop(0.55, 'rgba(255,110,30,0.32)'); gr.addColorStop(1, 'rgba(255,150,50,0.95)');
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(0, cy); g.lineTo(x1, cy - (wid * K) / 2); g.quadraticCurveTo(x1 + K, cy, x1, cy + (wid * K) / 2); g.closePath(); g.fill();
        gr = g.createLinearGradient(x1 * 0.35, 0, x1, 0);
        gr.addColorStop(0, 'rgba(255,240,200,0)'); gr.addColorStop(1, 'rgba(255,250,230,1)');
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(x1 * 0.35, cy); g.lineTo(x1, cy - wid * K * 0.17); g.lineTo(x1, cy + wid * K * 0.17); g.closePath(); g.fill();
        const out = U.canvas(w, h);
        out.ctx.filter = 'blur(' + K * 0.9 + 'px)'; out.ctx.drawImage(base.c, 0, 0);
        out.ctx.filter = 'none'; out.ctx.drawImage(base.c, 0, 0);
        return { img: out.c, w: w / K, h: h / K, ax: x1 / w };
      })();
      LANTERN = bakeSet(13, 17, 13, 14, lanternPose, { wide: 3.0, tight: 0.8, glowA: 1.4 });
      // props: dim line art (glowA ≤ 0.75); only lamp heads, carved faces and cores carry full light
      const D = 0.72;
      PROPS = {
        grave: [
          bakeProp(14, 26, 16, graveRound, { pool: ['#9d8cff', 12, 0.22], glowA: D }),
          bakeProp(14, 28, 16, graveCross, { pool: ['#9d8cff', 12, 0.22], glowA: D }),
          bakeProp(12, 20, 14, graveSmall, { pool: ['#9d8cff', 10, 0.2], glowA: D }),
        ],
        fence: [
          bakeProp(20, 20, 21, (c, p) => fence(c, p, 0), { pool: ['#9d8cff', 16, 0.12], refl: 0.3, glowA: 0.6 }),
          bakeProp(20, 20, 21, (c, p) => fence(c, p, 1), { pool: ['#9d8cff', 16, 0.12], refl: 0.3, glowA: 0.6 }),
        ],
        lamp: [
          bakeProp(10, 40, 16, (c, p) => lamp(c, p, 0), { pool: ['#ffb84a', 18, 0.42, 5.2], refl: 0.3, glowA: 0.8 }),
          bakeProp(16, 40, 16, (c, p) => lamp(c, p, 1), { pool: ['#ffb84a', 20, 0.4, 0], refl: 0.3, glowA: 0.8 }),
        ],
        pumpkin: [
          bakeProp(15, 22, 15, (c, p) => pumpkinProp(c, p, 0), { pool: ['#ff8a2a', 13, 0.34], glowA: 0.95 }),
          bakeProp(16, 22, 17, (c, p) => pumpkinProp(c, p, 1), { pool: ['#ff8a2a', 14, 0.34], glowA: 0.95 }),
        ],
        pylon: [
          bakeProp(11, 46, 12, (c, p) => pylon(c, p, 0), { pool: ['#ff4fd8', 13, 0.26], glowA: D }),
          bakeProp(14, 34, 14, (c, p) => pylon(c, p, 1), { pool: ['#ff4fd8', 13, 0.24], glowA: D }),
        ],
        tree: [
          bakeProp(26, 56, 26, (c, p) => holoTree(c, p, 17), { pool: ['#2ef2d0', 16, 0.24], holo: true, refl: 0.25, glowA: D }),
          bakeProp(26, 56, 26, (c, p) => holoTree(c, p, 91), { pool: ['#2ef2d0', 16, 0.24], holo: true, refl: 0.25, glowA: D }),
          bakeProp(22, 44, 22, (c, p) => holoTree(c, p, 203, 0.78), { pool: ['#2ef2d0', 13, 0.22], holo: true, refl: 0.25, glowA: D }),
        ],
        sign: [0, 1, 2].map((v) => bakeProp(15, 36, 15, (c, p) => signPost(c, p, v), { pool: ['#ff4fd8', 12, 0.26], glowA: 0.85 })),
        shrine: [bakeProp(20, 48, 20, shrine, { pool: ['#ff3ad6', 18, 0.3], holo: true, refl: 0.25, glowA: D })],
        reed: [0, 1, 2].map((v) => bakeProp(13, 22, 13, (c, p) => reeds(c, p, v), { pool: ['#3a8cff', 9, 0.14], refl: 0.4, glowA: 0.65 })),
      };
      POOL = {
        player: makePool(P.jack, 0.6, 0.26),
        creeper: makePool(P.mag, 0.5, 0.14),
        ghost: makePool(P.cyan, 0.2, 0.12),
        colossus: makePool(P.tox, 0.55, 0.16),
      };
      GLOW = { orange: makeGlow('#ff8a2a', 1), amber: makeGlow('#ffb84a', 1), green: makeGlow('#8dff2a', 1), white: makeGlow('#ffffff', 1) };
      BEAM = U.sprite(32, 256, (ctx) => {
        const g = ctx.createLinearGradient(0, 256, 0, 0);
        g.addColorStop(0, 'rgba(255,190,80,0.9)'); g.addColorStop(1, 'rgba(255,60,200,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 256);
        ctx.globalCompositeOperation = 'destination-in';
        const h = ctx.createLinearGradient(0, 0, 32, 0);
        h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = h; ctx.fillRect(0, 0, 32, 256);
      });
      maskC = U.canvas(MN, MN);
      baseC = U.canvas(MN, MN);
      if (document.fonts && document.fonts.load) { try { document.fonts.load("700 40px 'Orbitron'").catch(() => {}); } catch (e) { /* ignore */ } }
    },

    *renderGroundChunk(ctx, info) {
      const F = yield* fieldsGen(info);
      const M = buildMasks(F);
      baseC.ctx.putImageData(M.base, 0, 0);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(baseC.c, info.wx - 1.5 * CELL, info.wy - 1.5 * CELL, MN * CELL, MN * CELL);
      ctx.restore();
      yield;
      for (let i = 0; i < 5; i++) {
        if (M.maxA[i] < 0.015) continue;
        layer(ctx, info, i, M.masks[i]);
        yield;
      }
      drawRoads(ctx, info, F);
      yield;
      yield* decalsGen(ctx, info);
      drawContours(ctx, info, F);
    },

    propsForChunk(info) {
      // composition: lamps line the light roads, reeds fringe the water, trees gather in groves,
      // graves stand in small yards; open ground between them stays calm
      const out = [];
      const o = new Float32Array(7);
      const add = (px, py, type, rng, v) => {
        if (G.nearSpawn(px, py, 95)) return;
        if (px < info.wx || px >= info.wx + info.size || py < info.wy || py >= info.wy + info.size) return;
        const set = PROPS[type];
        out.push({ x: px, y: py, pt: type, type, v: v === undefined ? rng.int(0, set.length - 1) : v, fl: rng.next(), pad: 90 });
      };
      // 1 · road furniture
      G.scatterOwned(info, 54, 5151, (x, y, rng) => {
        const d = roadDist(x, y);
        if (d < 7.5 || d > 12) return;
        sampleFields(x, y, o);
        if (o[4] > WT - 0.02) return;
        const r = rng.next();
        if (r < 0.36) add(x, y, 'lamp', rng, rng.chance(0.7) ? 0 : 1);
        else if (r < 0.44) add(x, y, 'sign', rng);
      });
      // 2 · shore reeds
      G.scatterOwned(info, 36, 6262, (x, y, rng) => {
        if (!rng.chance(0.7)) return;
        sampleFields(x, y, o);
        const w = o[4];
        if (w > WT - 0.002 || w < WT - 0.03) return;
        // distance to the shore line from the water field gradient: reeds only on a narrow fringe
        const gx = waterAt(x + 2, y) - waterAt(x - 2, y), gy = waterAt(x, y + 2) - waterAt(x, y - 2);
        const d = (WT - w) / (Math.hypot(gx, gy) / 4 || 1e-6);
        if (d > 9) return;
        add(x, y, 'reed', rng);
      });
      // 3 · region props, kept off the roads
      G.scatterOwned(info, 112, 4242, (x, y, rng) => {
        if (G.nearSpawn(x, y, 95) || !rng.chance(0.5)) return;
        sampleFields(x, y, o);
        if (o[4] > WT - 0.035) return;
        if (roadDist(x, y) < 22) return;
        const reg = regionOf(o);
        const r = rng.next();
        let t;
        if (reg === 0) t = r < 0.55 ? 'grave' : r < 0.72 ? 'fence' : r < 0.86 ? 'pumpkin' : 'shrine';
        else if (reg === 1) t = r < 0.62 ? 'tree' : r < 0.86 ? 'pylon' : 'shrine';
        else if (reg === 2) t = r < 0.5 ? 'pumpkin' : r < 0.72 ? 'tree' : r < 0.86 ? 'fence' : 'sign';
        else t = r < 0.48 ? 'pylon' : r < 0.66 ? 'shrine' : r < 0.84 ? 'pumpkin' : 'tree';
        add(x, y, t, rng);
        if (t === 'grave') {
          const n = rng.int(2, 4);
          for (let i = 0; i < n; i++) add(x + rng.range(-28, 28), y + rng.range(-16, 16), 'grave', rng);
          if (rng.chance(0.5)) add(x + rng.range(-10, 10), y + 22, 'fence', rng);
        } else if (t === 'tree') {
          const n = rng.int(1, 3);
          for (let i = 0; i < n; i++) add(x + rng.range(-34, 34), y + rng.range(-20, 20), 'tree', rng);
        } else if (t === 'pumpkin' && rng.chance(0.55)) add(x + rng.range(10, 18) * rng.sign(), y + rng.range(-6, 8), 'pumpkin', rng);
      });
      return out;
    },

    drawProp(ctx, pr, view) {
      const set = PROPS[pr.pt];
      if (!set) return;
      const s = set[pr.v] || set[0];
      let a = 1;
      const rt = view.rt;
      if (pr.pt === 'sign' || pr.pt === 'lamp' || pr.pt === 'pylon') {
        // tube flicker: rare double-blinks on a per-prop clock, never in sync
        const h = U.hash2(Math.floor(rt * 13), Math.floor(pr.fl * 1000), 5);
        if (h < 0.03) a = 0.5;
        else if (h < 0.05) a = 0.78;
      } else if (pr.pt === 'tree' || pr.pt === 'shrine') a = 0.84 + 0.16 * Math.sin(rt * 2.2 + pr.fl * 20);
      else if (pr.pt === 'pumpkin') a = 0.9 + 0.1 * Math.sin(rt * 9 + pr.fl * 30) * Math.sin(rt * 5.3);
      if (a !== 1) ctx.globalAlpha = a;
      if (pr.pt === 'tree') {
        // wind: a slow shear that bends the top, pivoting on the base
        const k = (pr.pt === 'reed' ? 0.07 : 0.025) * Math.sin(rt * (pr.pt === 'reed' ? 1.3 : 0.7) + pr.x * 0.013 + pr.fl * 3);
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.transform(1, 0, k, 1, 0, 0);
        blit(ctx, s, s.img, 0, 0);
        ctx.restore();
      } else blit(ctx, s, s.img, pr.x, pr.y);
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o, view) {
      if (o.kind === 'prop') return;
      let img, rw, a = 1;
      if (o.kind === 'player') { img = POOL.player; rw = 14; }
      else {
        img = POOL[o.type]; rw = o.r * (o.type === 'ghost' ? 1.2 : 1.4);
        if (o.dying) a = Math.max(0, 1 - o.deathT * 1.4);
        else if (o.spawnT < 1) a = U.smoothstep(0.2, 1, o.spawnT);
        if (o.type === 'ghost') a *= 0.75 + 0.25 * Math.sin(view.rt * 2.6 + (o.seed || 0) * 9);
      }
      if (!img || a <= 0) return;
      ctx.globalAlpha = a;
      ctx.drawImage(img, o.x - rw, o.y - rw * 0.4, rw * 2, rw * 0.8);
      ctx.globalAlpha = 1;
    },

    drawGroundOverlay(ctx, view, game) {
      // the main character carries the brightest light on the floor; orbiting lanterns add small warm pools
      const p = game.player;
      ctx.globalCompositeOperation = 'lighter';
      const fl = 0.04 * Math.sin(view.rt * 7.3) * Math.sin(view.rt * 3.1);
      ctx.globalAlpha = 0.4 + fl;
      ctx.drawImage(GLOW.orange, p.x - 62, p.y - 28, 124, 56);
      ctx.globalAlpha = 0.18;
      ctx.drawImage(GLOW.amber, p.x - 22, p.y - 9, 44, 18);
      for (const o of game.orbitals) {
        ctx.globalAlpha = 0.26;
        ctx.drawImage(GLOW.amber, o.x - 22, o.y + 6 - 9, 44, 18);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    drawGem(ctx, g, view) {
      const set = g.big ? GEMB : GEMS;
      const rt = view.rt, sd = g.seed || 0;
      const f = Math.floor((rt * 1.6 + sd * 3) * 8) & 7;
      const s = set[f];
      // float: quick rise, slow settle (eased, not a plain sine)
      const fb = U.fract(rt * 0.55 + sd * 7);
      const bob = -(fb < 0.35 ? U.smoothstep(0, 0.35, fb) : 1 - U.smoothstep(0.35, 1, fb)) * 1.6;
      const pop = g.pop > 0 ? Math.sin(g.pop * Math.PI) * 6 : 0;
      ctx.globalCompositeOperation = 'lighter';
      if (g.fly) {
        ctx.globalAlpha = 0.35;
        const sp = Math.hypot(g.vx, g.vy) || 1;
        blit(ctx, s, s.img, g.x - (g.vx / sp) * 4, g.y - (g.vy / sp) * 4 + bob);
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(s.img, g.x - s.ax * s.w, g.y + bob - pop - s.ay * s.h, s.w, s.h);
      // rare glint on the upper facet
      const gl = U.fract(rt * 0.42 + sd * 5.3);
      if (gl < 0.09) {
        const k = Math.sin((gl / 0.09) * Math.PI), r = (g.big ? 4.2 : 3) * k;
        const gx = g.x - (g.big ? 1.2 : 0.8), gy = g.y + bob - pop - (g.big ? 13.2 : 9.6);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.45; ctx.globalAlpha = 0.9 * k;
        ctx.beginPath(); ctx.moveTo(gx - r, gy); ctx.lineTo(gx + r, gy); ctx.moveTo(gx, gy - r * 1.3); ctx.lineTo(gx, gy + r * 1.3); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
    },

    drawEnemy(ctx, e, view) {
      const rt = view.rt, sd = e.seed || 0;
      const T = ETYPE[e.type] || ETYPE.creeper;
      // per-actor blink clock (period 2.4–4.6 s, 110 ms closed)
      const bp = 2.4 + sd * 2.2, blink = (rt + sd * 13) % bp < 0.11;
      let frames, fi;
      if (e.type === 'ghost') { frames = blink ? GHOSTB : GHOST; fi = Math.floor((rt * (1.45 + sd * 0.5) + sd * 5) * 8) & 7; }
      else if (e.type === 'colossus') { frames = COLO; fi = Math.floor((e.anim * 0.22 + sd) * 8) & 7; }
      else { frames = blink ? CREEPB : CREEP; fi = Math.floor((e.anim * 0.36 + sd) * 8) & 7; }
      const side = e.facing < 0 ? 1 : 0;
      let s = frames[fi][side];
      let x = e.x, y = e.y;
      if (e.dying) { deathFx(ctx, e, s, T, view); return; }
      if (e.spawnT < 1) { spawnFx(ctx, e, s, T, view); return; }
      // hit reaction: a damped squash/stretch (≈250 ms) and a lean in the knock-back direction
      if ((e.flash || 0) > (e._nf || 0) + 0.3) e._ht = rt;
      e._nf = e.flash || 0;
      const ha = e._ht === undefined ? 9 : rt - e._ht;
      const r = ha < 0.32 ? Math.exp(-ha * 13) * Math.cos(ha * 26) : 0;
      let sx = 1 + 0.15 * r, sy = 1 - 0.15 * r, rot = 0;
      if (ha < 0.32) rot += U.clamp((e.kx || 0) / 140, -1, 1) * 0.24 * Math.exp(-ha * 9);
      const spd = Math.hypot(e.vx, e.vy);
      if (e.type === 'ghost') {
        const fb = U.fract(rt * 0.47 + sd * 3.7);
        const up = fb < 0.38 ? U.smoothstep(0, 0.38, fb) : 1 - U.smoothstep(0.38, 1, fb);
        y -= 2.2 + up * 2.0;
        sy *= 1 - 0.05 * (1 - up); sx *= 1 + 0.04 * (1 - up);
        // lean into the motion as a cheap shear-free offset of the head end: drawn axis-aligned
        const gh = U.hash2(Math.floor(rt * 12), Math.floor(sd * 9999), 3);
        if (gh < 0.04) s = GHOSTG[gh < 0.02 ? 0 : 1][side];
        if (spd > 8) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.2;
          blit(ctx, s, s.img, x - e.vx * 0.07, y - e.vy * 0.07);
          ctx.globalAlpha = 0.09;
          blit(ctx, s, s.img, x - e.vx * 0.14, y - e.vy * 0.14);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      // axis-aligned scaling is drawn directly; a rotated transform only while a hit lean plays
      const tr = Math.abs(rot) > 0.004;
      if (tr) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); x = 0; y = 0; }
      const W = s.w * sx, Hh = s.h * sy, X = x - s.ax * W, Y = y - s.ay * Hh;
      ctx.drawImage(s.img, X, Y, W, Hh);
      if (e.flash > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, e.flash * 1.2);
        ctx.drawImage(s.flash, X, Y, W, Hh);
        if (e.flash > 0.5) {
          ctx.globalAlpha = 0.7 * e.flash;
          ctx.drawImage(s.red, X - 1.6, Y, W, Hh);
          ctx.drawImage(s.cyan, X + 1.6, Y, W, Hh);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      if (tr) ctx.restore();
      if (e.type === 'colossus') {
        // stomp: a floor shock ring on each foot impact
        const ph = (e.anim * 0.22 + sd) * 2;
        const f = ph - Math.floor(ph);
        if (f < 0.3) {
          const k = f / 0.3;
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (1 - k) * (1 - k) * 0.6;
          ctx.strokeStyle = P.acid; ctx.lineWidth = 0.9;
          const rr = 13 + U.ease.outQuad(k) * 18;
          ctx.beginPath(); ctx.ellipse(e.x, e.y, rr, rr * 0.36, 0, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    },

    drawPlayer(ctx, p, view) {
      const rt = view.rt;
      let set, mode, dk = 0;
      if (p.dashT > 0) { dk = U.clamp(1 - p.dashT / 0.2, 0, 1); mode = 'dash'; set = JACK.dash[dk < 0.22 ? 0 : dk < 0.78 ? 1 : 2]; }
      else if (p.hurtT > 0.55) { mode = 'hurt'; set = JACK.hurt; }
      else if (p.moving) { mode = 'walk'; set = JACK.walk[Math.floor(((p.anim / 2.4) % 1) * 8) & 7]; }
      else { mode = 'idle'; set = JACK.idle[Math.floor(U.fract(rt / 3.2) * 8) & 7]; }
      const side = p.facing < 0 ? 1 : 0;
      const s = set[side];
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 20) {
        const ang = Math.atan2(p.vy, p.vx);
        const L = Math.min(1.6, sp / 95);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = mode === 'dash' ? 0.85 : 0.4;
        ctx.translate(p.x, p.y - 13);
        ctx.rotate(ang);
        ctx.drawImage(TRAIL.img, -TRAIL.w * TRAIL.ax * L - 2, -TRAIL.h / 2 * 1.3, TRAIL.w * L, TRAIL.h * 1.3);
        ctx.restore();
      }
      if (mode === 'dash') {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 1; i <= 4; i++) {
          ctx.globalAlpha = (0.4 - i * 0.08) * (1 - dk * 0.5);
          blit(ctx, s, s.img, p.x - p.dashX * i * 7 * (0.4 + dk), p.y - p.dashY * i * 7 * (0.4 + dk));
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      if (p.levelT > 0) {
        const k = 1 - p.levelT;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = p.levelT * 0.8;
        ctx.drawImage(BEAM, p.x - 9, p.y - 90, 18, 92);
        ctx.strokeStyle = P.amber; ctx.lineWidth = 1.4;
        const rr = 10 + U.ease.outQuad(k) * 60;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rr, rr * 0.4, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = P.lime; ctx.globalAlpha = p.levelT * 0.5;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, rr * 0.7, rr * 0.28, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      let alpha = 1;
      if (p.iframes > 0 && p.hurtT > 0 && (Math.floor(rt * 18) & 1)) alpha = 0.45;
      // squash & stretch: dash stretches along the motion, the landing frame squashes
      let sx = 1, sy = 1;
      if (mode === 'dash') { const st = Math.sin(dk * Math.PI); sx = 1 + 0.16 * st - (dk > 0.8 ? 0.08 : 0); sy = 1 - 0.1 * st + (dk > 0.8 ? 0.06 : 0); }
      else if (mode === 'hurt') { const h = (p.hurtT - 0.55) / 0.45; sx = 1 + 0.12 * h; sy = 1 - 0.1 * h; }
      ctx.globalAlpha = alpha;
      const hx = p.x - (mode === 'hurt' ? p.facing * (p.hurtT - 0.55) * 4 : 0);
      if (sx !== 1 || sy !== 1) { ctx.save(); ctx.translate(hx, p.y); ctx.scale(sx, sy); blit(ctx, s, s.img, 0, 0); ctx.restore(); }
      else blit(ctx, s, s.img, hx, p.y);
      ctx.globalAlpha = 1;
      // candle flicker behind the carved face: the warmest, brightest point on screen
      const fl = 0.55 + 0.25 * Math.sin(rt * 11.3 + 1.2) * Math.sin(rt * 6.7) + 0.2 * U.noise(rt * 3, 0.5, 77);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16 * fl;
      ctx.drawImage(GLOW.amber, hx + p.facing * 2.2 - 9, p.y - 31, 18, 18);
      ctx.globalAlpha = 1;
      if (p.hurtT > 0.35) {
        ctx.globalAlpha = (p.hurtT - 0.35) * 1.4;
        blit(ctx, s, s.flash, hx, p.y);
        ctx.globalAlpha = (p.hurtT - 0.35);
        blit(ctx, s, s.red, hx - 2, p.y);
        blit(ctx, s, s.cyan, hx + 2, p.y);
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
    },

    drawOrbital(ctx, o, view) {
      // light trail along the real recent path (works for any orbit radius / centre)
      const h = o._h || (o._h = []);
      const n = h.length;
      if (!n || Math.abs(o.x - h[n - 2]) + Math.abs(o.y - h[n - 1]) > 0.6) { h.push(o.x, o.y); if (h.length > 18) h.splice(0, 2); }
      if (h.length >= 4) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = P.amber;
        ctx.lineCap = 'round';
        const m = h.length / 2;
        for (let i = 1; i < m; i++) {
          const f = i / (m - 1);
          ctx.beginPath(); ctx.moveTo(h[i * 2 - 2], h[i * 2 - 1] - 8); ctx.lineTo(h[i * 2], h[i * 2 + 1] - 8);
          ctx.globalAlpha = 0.08 * f; ctx.lineWidth = 4; ctx.stroke();
          ctx.globalAlpha = 0.4 * f * f; ctx.lineWidth = 0.7; ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      // the lantern swings on its handle, lagging the orbit (pendulum)
      const sw = Math.sin(view.rt * 4 + (o.idx || 0) * 1.7) * 0.14 - 0.12;
      ctx.save();
      ctx.translate(o.x, o.y - 8 - 9);
      ctx.rotate(sw);
      ctx.drawImage(LANTERN.img, -LANTERN.ax * LANTERN.w, -LANTERN.ay * LANTERN.h + 9, LANTERN.w, LANTERN.h);
      ctx.restore();
    },

    drawProjectile(ctx, pr, view) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(pr.x, pr.y - 6);
      ctx.rotate(pr.angle);
      const L = Math.min(1, pr.age * 9 + 0.15) * (pr.life < 0.15 ? pr.life / 0.15 : 1);
      ctx.globalAlpha = 0.85;
      ctx.drawImage(TRAIL.img, -TRAIL.ax * TRAIL.w * L, -TRAIL.h / 2, TRAIL.w * L, TRAIL.h);
      ctx.globalAlpha = 1;
      const sy = 0.65 + 0.35 * Math.abs(Math.cos(pr.spin));
      ctx.scale(1, sy);
      ctx.drawImage(SEED.img, -SEED.ax * SEED.w, -SEED.ay * SEED.h, SEED.w, SEED.h);
      ctx.restore();
    },

    drawParticle(ctx, pt, view) {
      // particles are batched per colour and stroked together; the batch is flushed after the last visible
      // particle of the frame, so it also renders when other styles provide the overlays (mixes, sheets)
      if (view !== pbView) { pbView = view; pbLast = lastVisible(view); }
      const k = Math.max(0, pt.life / pt.max);
      const y = pt.y - pt.z;
      switch (pt.kind) {
        case 'ring': {
          const e = 1 - k;
          const r = pt.r0 + (pt.r1 - pt.r0) * (1 - (1 - e) * (1 - e) * (1 - e));
          const b = pbBucket(pt.color, k * pt.a0, pt.lw > 1.1 ? 2 : pt.lw > 0.6 ? 1 : 0);
          b.rings.push(pt.x, y, r, r * pt.sq);
          break;
        }
        case 'scorch': {
          // lingering floor residue: a thin ellipse that tightens and fades slowly
          const r = pt.r0 * (0.86 + 0.14 * k);
          const b = pbBucket(pt.color, k * k * 0.5, 0);
          b.rings.push(pt.x, pt.y, r, r * 0.36);
          break;
        }
        case 'nflash': {
          // core flash: a four-point star that snaps open and dies in ~100 ms
          const e = 1 - k, r = pt.size * (0.35 + 0.65 * Math.sqrt(e));
          const b = pbBucket(pt.color, k, 2);
          b.lines.push(pt.x - r, y, pt.x + r, y, pt.x, y - r * 0.75, pt.x, y + r * 0.75);
          const d = r * 0.38;
          const b2 = pbBucket(pt.color, k * 0.7, 0);
          b2.lines.push(pt.x - d, y - d, pt.x + d, y + d, pt.x - d, y + d, pt.x + d, y - d);
          break;
        }
        case 'frag': {
          const L = pt.size * 0.5, c = Math.cos(pt.rot) * L, s = Math.sin(pt.rot) * L * 0.8;
          const b = pbBucket(pt.color, Math.min(1, k * 1.6), 1);
          b.lines.push(pt.x - c, y - s, pt.x + c, y + s);
          break;
        }
        case 'bit': {
          // data-bit residue: small squares that rise and stutter out
          if (k < 0.5 && U.hash2(Math.floor(view.rt * 24), Math.floor(pt.seed * 9999), 9) < 0.35) break;
          const b = pbBucket(pt.color, Math.min(1, k * 1.4), 0);
          b.dots.push(pt.x, y, pt.size);
          break;
        }
        case 'streak': {
          const e = 1 - k, L = pt.size * (0.4 + e);
          const b = pbBucket(pt.color, k, 1);
          b.lines.push(pt.x, y, pt.x, y - L);
          break;
        }
        case 'dot': {
          const b = pbBucket(pt.color, Math.min(1, k * 1.5), 0);
          b.dots.push(pt.x, y, pt.size * (0.5 + 0.5 * k));
          break;
        }
        default: {
          const vx = pt.vx, vy = pt.vy - (pt.vz || 0);
          const sp = Math.hypot(vx, vy);
          const L = Math.min(9, 1 + sp * 0.035) * (pt.size || 2) * 0.5;
          const nx = sp > 0.01 ? vx / sp : 1, ny = sp > 0.01 ? vy / sp : 0;
          const b = pbBucket(pt.color || '#ffffff', k, (pt.size || 2) > 2.4 ? 2 : 1);
          b.lines.push(pt.x, y, pt.x - nx * L, y - ny * L);
        }
      }
      if (pt === pbLast) pbFlush(ctx);
    },

    drawNumber(ctx, n, view) {
      if (pbPending) pbFlush(ctx);
      const D = digits(view.rt);
      const A = n.crit ? D.crit : D.norm;
      const lf = n.life / n.max;
      const alpha = Math.min(1, lf * 2.4);
      const pop = 1 + Math.max(0, lf - 0.78) * 2.6;
      const hW = (n.crit ? 12.5 : 8.6) * pop;
      const sc = hW / A.H;
      const str = String(n.value);
      let W = 0;
      for (let i = 0; i < str.length; i++) W += A.adv[str.charCodeAt(i) - 48] * 0.9;
      let x = n.x - (W * sc) / 2;
      const y = n.y - hW / 2 - 4;
      ctx.globalAlpha = alpha;
      for (let i = 0; i < str.length; i++) {
        const d = str.charCodeAt(i) - 48;
        if (d < 0 || d > 9) continue;
        const sw = A.adv[d] + A.pad * 2;
        ctx.drawImage(A.c, A.xs[d], 0, sw, A.H, x - A.pad * sc, y, sw * sc, A.H * sc);
        x += A.adv[d] * 0.9 * sc;
      }
      ctx.globalAlpha = 1;
    },

    drawWorldOverlay(ctx, view, game) {
      if (pbPending) pbFlush(ctx);
    },

    drawScreenOverlay(ctx, view, game) {
      if (glitchReq) { glitchT0 = view.rt; glitchDur = glitchReq; glitchReq = 0; }
      const gt = view.rt - glitchT0;
      if (gt >= 0 && gt < glitchDur) {
        const W = view.W, H = view.H;
        const rng = U.rng(Math.floor(view.rt * 40) * 7919 + 13);
        const n = 3 + rng.int(0, 3);
        for (let i = 0; i < n; i++) {
          const y = rng.int(0, H - 30), h = rng.int(4, 28), dx = rng.range(-18, 18) * (1 - gt / glitchDur);
          ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h);
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.06 * (1 - gt / glitchDur);
        ctx.fillStyle = '#ff2a7a';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    },

    drawDisplayOverlay(ctx, view, game) {
      const W = view.displayW, H = view.displayH;
      const key = W + 'x' + H;
      if (key !== OVLkey) { OVL = buildOverlay(W, H); OVLkey = key; }
      ctx.drawImage(OVL, 0, 0);
    },

    drawIcon(ctx, id, size) {
      drawIconImpl(ctx, id, size);
    },

    /* ---- events: every effect is layered – core flash → main shape → debris → residue ---- */
    onHit(game, e, src) {
      const T = ETYPE[e.type] || ETYPE.creeper;
      const z = T.h * (e.type === 'ghost' ? 1.15 : 0.75);
      flash(game, e.x, e.y, z, '#ffffff', 6, 0.09);
      ring(game, e.x, e.y, z, 1.5, 8, '#ffffff', 0.15, 1, 0.8, 0.75);
      const base = src === 'seed' && (e.kx || e.ky) ? Math.atan2(e.ky, e.kx) : Math.random() * TAU;
      for (let i = 0; i < 4; i++) spark(game, e.x, e.y, z, base + (Math.random() - 0.5) * 1.9, 70 + Math.random() * 90, i < 1 ? '#ffffff' : T.col, 0.15 + Math.random() * 0.12, 2);
      bit(game, e.x + (Math.random() - 0.5) * e.r, e.y, z, T.col2, 0.4 + Math.random() * 0.2);
    },
    onKill(game, e) {
      const T = ETYPE[e.type] || ETYPE.creeper;
      const big = e.type === 'colossus';
      flash(game, e.x, e.y, T.h * 0.7, '#ffffff', big ? 22 : 12, big ? 0.16 : 0.11);
      for (let i = 0; i < T.frags; i++) {
        const a = Math.random() * TAU, sp = (big ? 50 : 40) + Math.random() * (big ? 120 : 100);
        game.addParticle({
          kind: 'frag', x: e.x + (Math.random() - 0.5) * e.r, y: e.y, z: 2 + Math.random() * T.h * 1.4,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 20 + Math.random() * 70, grav: 170, drag: 2.2,
          rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16, size: T.len * (0.6 + Math.random() * 0.8),
          color: Math.random() < 0.68 ? T.col : T.col2, life: 0.45 + Math.random() * 0.4,
        });
      }
      for (let i = 0; i < (big ? 8 : 4); i++) spark(game, e.x, e.y, T.h * 0.7, Math.random() * TAU, 80 + Math.random() * 120, '#ffffff', 0.18 + Math.random() * 0.12, 2.4);
      ring(game, e.x, e.y, 0, e.r * 0.6, e.r * 3.0, T.col, big ? 0.55 : 0.38, 0.42, 1.4, 1);
      for (let i = 0; i < (big ? 8 : 3); i++) bit(game, e.x + (Math.random() - 0.5) * e.r * 1.6, e.y, 2 + Math.random() * T.h, i % 2 ? T.col : T.col2, 0.7 + Math.random() * 0.5);
      game.addParticle({ kind: 'scorch', x: e.x, y: e.y, r0: e.r * 1.5, color: T.col, life: big ? 1.4 : 0.95, drag: 0 });
      if (big) {
        ring(game, e.x, e.y, 0, e.r * 0.4, e.r * 5, P.tox, 0.75, 0.42, 1.0, 0.8);
        ring(game, e.x, e.y, T.h, 2, 22, P.tox, 0.35, 1, 1.4, 1);
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * TAU, sp = 40 + Math.random() * 90;
          game.addParticle({ kind: 'dot', x: e.x, y: e.y, z: T.h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 30 + Math.random() * 60, grav: 120, drag: 2, size: 1.2, color: P.tox, life: 0.6 + Math.random() * 0.4 });
        }
        glitchReq = 0.12;
      }
    },
    onHurt(game, p) {
      flash(game, p.x, p.y, 14, '#ff6aa0', 10, 0.1);
      for (let i = 0; i < 10; i++) spark(game, p.x, p.y, 12, Math.random() * TAU, 70 + Math.random() * 110, i % 2 ? '#ff2a7a' : '#ffae35', 0.28 + Math.random() * 0.12, 2.6);
      ring(game, p.x, p.y, 12, 4, 22, '#ff2a7a', 0.3, 1, 1.4, 1);
      glitchReq = 0.22;
    },
    onPickup(game, g) {
      const p = game.player, col = g.big ? P.gemC : P.lime;
      ring(game, p.x, p.y, 0, 3, g.big ? 18 : 11, col, 0.25, 0.42, 0.8, 0.8);
      game.addParticle({ kind: 'streak', x: p.x, y: p.y, z: 8, size: g.big ? 26 : 16, color: col, life: g.big ? 0.26 : 0.18, drag: 0 });
      for (let i = 0; i < (g.big ? 6 : 2); i++) {
        game.addParticle({ kind: 'dot', x: p.x + (Math.random() - 0.5) * 10, y: p.y, z: 6 + Math.random() * 16, vx: (Math.random() - 0.5) * 20, vy: 0, vz: 30 + Math.random() * 20, grav: 1, drag: 1, size: 1, color: col, life: 0.4 + Math.random() * 0.2 });
      }
    },
    onShoot(game, pr) {
      for (let i = 0; i < 2; i++) spark(game, pr.x, pr.y + 6, 6, pr.angle + (Math.random() - 0.5) * 0.9, 90 + Math.random() * 60, i ? '#ffe14a' : P.seed, 0.12, 1.8);
    },
    onDash(game, p) {
      ring(game, p.x, p.y, 0, 4, 24, P.jack, 0.32, 0.42, 1.3, 1);
      game.addParticle({ kind: 'scorch', x: p.x, y: p.y, r0: 12, color: P.jack, life: 0.6, drag: 0 });
      for (let i = 0; i < 8; i++) {
        const a = Math.atan2(-p.dashY, -p.dashX) + (Math.random() - 0.5) * 1.2;
        spark(game, p.x, p.y, 4 + Math.random() * 16, a, 80 + Math.random() * 120, i % 2 ? P.jack : P.scarf, 0.25, 2.2);
      }
    },
    onLevelUp(game, p) {
      flash(game, p.x, p.y, 16, '#fff6d0', 16, 0.14);
      ring(game, p.x, p.y, 0, 6, 70, P.amber, 0.7, 0.42, 1.6, 1);
      ring(game, p.x, p.y, 0, 4, 46, P.lime, 0.55, 0.42, 1.0, 0.8);
      for (let i = 0; i < 22; i++) {
        game.addParticle({ kind: 'nspark', x: p.x + (Math.random() - 0.5) * 22, y: p.y + (Math.random() - 0.5) * 8, z: 2, vx: (Math.random() - 0.5) * 30, vy: 0, vz: 90 + Math.random() * 120, grav: 60, drag: 1, size: 2.4, color: i % 3 === 0 ? P.lime : i % 3 === 1 ? P.amber : P.scarf, life: 0.6 + Math.random() * 0.4 });
      }
      for (let i = 0; i < 6; i++) bit(game, p.x + (Math.random() - 0.5) * 26, p.y, 4 + Math.random() * 10, P.lime, 0.9 + Math.random() * 0.4);
    },
    onDeath(game, p) {
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * TAU, sp = 60 + Math.random() * 140;
        game.addParticle({ kind: 'frag', x: p.x, y: p.y, z: 6 + Math.random() * 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 40 + Math.random() * 60, grav: 160, drag: 2, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, size: 3 + Math.random() * 4, color: i % 3 ? P.jack : P.scarf, life: 0.9 + Math.random() * 0.5 });
      }
      ring(game, p.x, p.y, 0, 6, 80, P.jack, 0.9, 0.42, 1.6, 1);
      glitchReq = 0.4;
    },
  });
})();
