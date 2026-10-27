/* Native art for the new enemies / upgrades in the 'neon' world (Neon Mitternacht) – see js/content/ART_API.md.
   Same technique as js/styles/neon.js: glowing neon-tube line art over dark fills, halos baked once (blur at bake
   time only), additive blits per frame, chroma-split death / hit flash like the style's creeper. */
(function () {
  'use strict';
  const U = window.U, C = window.Content;
  const TAU = Math.PI * 2;
  const K = 4; // sprite resolution (px per world unit) – same as the style
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const hexA = (h, a) => rgba(U.hex(h), a);
  const hot = (h, t) => U.rgb(U.mix(U.hex(h), [255, 255, 255], t === undefined ? 0.6 : t));

  /* ---------- palette (style palette + accents for the new family members) ---------- */
  const P = {
    mag: '#ff3ad6', vio: '#b066ff', root: '#d77bff', cyan: '#6ff4ff', ice: '#eaffff',
    tox: '#8dff2a', toxHi: '#d8ff9a', lime: '#c6ff3a', stem: '#9cff4a',
    jack: '#ff7a1a', amber: '#ffae35', face: '#ffe7a0', scarf: '#ffe14a', lav: '#c3b5ff',
    beet: '#ff2d55', fuse: '#ffd27a', sand: '#ffcf8a', horn: '#fff1d6', hornG: '#ffb347',
    rose: '#ff5fa8', red: '#ff2a3a',
  };

  /* ---------- toolkit (copied from the style) ---------- */
  function tube(c, pass, col, lw, o) {
    if (pass === 'full') {
      c.strokeStyle = col; c.lineWidth = lw; c.stroke();
      if (!o || o.hot !== false) { c.strokeStyle = (o && o.hotCol) || hot(col, 0.62); c.lineWidth = lw * 0.36; c.stroke(); }
    } else if (!o || o.glow !== false) {
      c.strokeStyle = (o && o.glowCol) || col; c.lineWidth = lw * ((o && o.gw) || 1.8); c.stroke();
    }
  }
  function fillIn(c, pass, col, glowCol) {
    if (pass === 'full') { if (col) { c.fillStyle = col; c.fill(); } }
    else if (glowCol) { c.fillStyle = glowCol; c.fill(); }
  }
  function tri(c, ax, ay, bx, by, cx, cy) { c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx, cy); c.closePath(); }
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
  function makeSprite(l, t, r, b, draw, o) {
    const B = bakeSet(l, t, r, b, draw, o);
    const R = { img: B.img, flash: U.tint(B.full, '#ffffff'), red: U.tint(B.full, '#ff2a7a'), cyan: U.tint(B.full, '#2ae8ff'), w: B.w, h: B.h, ax: B.ax, ay: B.ay };
    if (o && o.hotTint) R.hot = U.tint(B.full, o.hotTint);
    const L = { img: U.flipX(R.img), flash: U.flipX(R.flash), red: U.flipX(R.red), cyan: U.flipX(R.cyan), w: B.w, h: B.h, ax: 1 - B.ax, ay: B.ay };
    if (R.hot) L.hot = U.flipX(R.hot);
    return [R, L];
  }
  function makeGlow(col, a) {
    return U.sprite(64, 64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, hexA(col, a)); g.addColorStop(0.35, hexA(col, a * 0.45)); g.addColorStop(0.7, hexA(col, a * 0.12)); g.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    });
  }
  function makePool(col, darkA, rimA) {
    return U.sprite(96, 96, (ctx) => {
      const g = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
      g.addColorStop(0, 'rgba(0,0,0,' + darkA + ')'); g.addColorStop(0.38, 'rgba(0,0,0,' + darkA * 0.75 + ')');
      g.addColorStop(0.62, hexA(col, rimA)); g.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, 96, 96);
    });
  }
  function leaf(c, pass, bx, by, ang, len, wid, col, fillC) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const tx = bx + dx * len, ty = by + dy * len, mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
    c.beginPath(); c.moveTo(bx, by);
    c.quadraticCurveTo(mx + nx * wid, my + ny * wid, tx, ty);
    c.quadraticCurveTo(mx - nx * wid, my - ny * wid, bx, by); c.closePath();
    fillIn(c, pass, fillC); tube(c, pass, col, 0.8);
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + dx * len * 0.78, by + dy * len * 0.78);
    tube(c, pass, col, 0.38, { hot: false, glow: false });
  }
  /** turnip bulb outline: pointed top, round belly, soft bottom */
  function bulb(c, cx, top, bot, hw) {
    const h = bot - top, mid = top + h * 0.53;
    c.beginPath(); c.moveTo(cx, top);
    c.bezierCurveTo(cx - hw * 0.5, top + h * 0.01, cx - hw, top + h * 0.2, cx - hw, mid);
    c.bezierCurveTo(cx - hw, bot - h * 0.17, cx - hw * 0.55, bot, cx, bot);
    c.bezierCurveTo(cx + hw * 0.55, bot, cx + hw, bot - h * 0.17, cx + hw, mid);
    c.bezierCurveTo(cx + hw, top + h * 0.2, cx + hw * 0.5, top + h * 0.01, cx, top);
    c.closePath();
  }
  /** fill the part of a closed shape above a wavy line (the purple "crown" of a rutabaga) */
  function crownTint(c, pass, shape, y0, col, x0, x1) {
    if (pass !== 'full') return;
    c.save(); shape(); c.clip();
    c.beginPath(); c.moveTo(x0, y0 - 40); c.lineTo(x1, y0 - 40);
    for (let x = x1; x >= x0; x -= 0.5) c.lineTo(x, y0 + Math.sin(x * 0.9 + 0.5) * 0.55);
    c.closePath(); c.fillStyle = col; c.fill();
    c.restore();
  }
  function wave(c, pass, x0, x1, y0, col) {
    c.beginPath();
    for (let x = x0; x <= x1 + 0.01; x += 0.4) { const y = y0 + Math.sin(x * 0.9 + 0.5) * 0.55; if (x === x0) c.moveTo(x, y); else c.lineTo(x, y); }
    tube(c, pass, col, 0.6, { hot: false });
  }
  function rootLeg(c, pass, hx, hy, fx, fy, sd, col, lw) {
    c.beginPath(); c.moveTo(hx, hy);
    c.quadraticCurveTo(hx + sd * 1.5, (hy + fy) / 2, fx, fy);
    c.lineTo(fx + sd * 1.5, fy + 0.1);
    c.moveTo(fx, fy); c.lineTo(fx - sd * 0.7, fy + 0.35);
    tube(c, pass, col, lw || 0.95);
  }
  const rot = (x, y, px, py, a) => { const cs = Math.cos(a), sn = Math.sin(a); return [px + (x - px) * cs - (y - py) * sn, py + (x - px) * sn + (y - py) * cs]; };

  /* ================= poses (all drawn facing right, feet at 0,0) ================= */

  /* ---- Rüben-Spucker: green-tubed turnip with a cannon snout ---- */
  function spitterPose(c, pass, ph, k) {
    const a = ph * TAU, s = Math.sin(a);
    const bob = -Math.abs(s) * 1.1 - k * 0.6;
    const dark = 'rgba(8,30,6,0.96)';
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * s) * 1.8;
      rootLeg(c, pass, sd * 2.8, -5.2 + bob * 0.6, sd * 3.9 + s * 1.1, -lift, sd, '#6fdc2a');
    }
    c.save();
    c.translate(0, bob);
    c.translate(0, -6); c.rotate(s * 0.07); c.translate(0, 6);
    const sw = Math.sin(a + 1.2) * 0.1;
    leaf(c, pass, -0.6, -21.4 - k * 1.2, -2.3 + sw, 5.4, 1.8, P.vio, dark);
    leaf(c, pass, 0.6, -21.4 - k * 1.2, -0.85 + sw, 5.6, 1.8, P.vio, dark);
    leaf(c, pass, 0, -21.6 - k * 1.2, -1.6 + sw * 0.6, 6.8, 2.1, P.vio, dark);
    const hw = 9.2 + k * 1.6, top = -21 - k * 1.2;
    const body = () => bulb(c, -0.4, top, -4.2, hw);
    body(); fillIn(c, pass, dark);
    crownTint(c, pass, body, -14.6 - k * 0.5, 'rgba(150,50,220,0.42)', -12, 12);
    wave(c, pass, -hw + 0.6, hw - 1.2, -14.6 - k * 0.5, P.vio);
    // mottled skin: violet blotches
    c.beginPath();
    c.ellipse(-5.2, -9.8, 1.5, 1.1, 0.3, 0, TAU); c.moveTo(-1.9 + 1.0, -6.6); c.ellipse(-1.9, -6.6, 1.0, 0.75, 0, 0, TAU);
    c.moveTo(-3.8 + 0.8, -17.2 - k); c.ellipse(-3.8, -17.2 - k, 0.8, 0.6, 0, 0, TAU);
    fillIn(c, pass, 'rgba(176,102,255,0.4)'); tube(c, pass, P.vio, 0.45, { hot: false, gw: 1.2 });
    body(); tube(c, pass, P.tox, 1.3);
    // crown stub
    c.beginPath(); c.moveTo(-2.3, top + 0.4); c.lineTo(-1.8, top - 1.1); c.lineTo(1.0, top - 1.1); c.lineTo(1.5, top + 0.4);
    fillIn(c, pass, dark); tube(c, pass, P.vio, 0.7, { hot: false });
    // swollen cheek behind the snout
    if (k > 0) {
      c.beginPath(); c.ellipse(4.6 + k * 0.6, -9.2, 2.6 + k * 1.6, 2.2 + k * 1.3, 0, -2.2, 1.9);
      tube(c, pass, hexA(P.toxHi, 0.5 + 0.4 * k), 0.5, { hot: false });
    }
    // snout tube
    const mx = 12.8 + k * 0.8, my = -9.6, mr = 3.0 + k * 0.9;
    c.beginPath();
    c.moveTo(6.4, -12.6); c.quadraticCurveTo(9.5, -12.4 - k * 0.3, mx, my - mr);
    c.lineTo(mx, my + mr); c.quadraticCurveTo(9.5, -6.8 + k * 0.3, 6.6, -6.9);
    fillIn(c, pass, dark); tube(c, pass, P.tox, 1.1);
    c.beginPath(); c.moveTo(9.4, -12.1 - k * 0.2); c.lineTo(9.4, -7.1 + k * 0.2);
    tube(c, pass, '#5fbf20', 0.45, { hot: false, glow: false });
    // mouth opening – glows as it charges
    c.beginPath(); c.ellipse(mx, my, 1.55 + k * 0.4, mr, 0, 0, TAU);
    let mg = '#0b2a04';
    if (pass === 'full' && k > 0) {
      mg = c.createRadialGradient(mx, my, 0, mx, my, mr);
      mg.addColorStop(0, hexA('#ffffff', Math.min(1, k * 1.2))); mg.addColorStop(0.5, hexA(P.toxHi, 0.4 + 0.6 * k)); mg.addColorStop(1, hexA(P.tox, 0.5 + 0.5 * k));
    }
    fillIn(c, pass, mg, k > 0 ? hexA(P.tox, 0.5 + 0.5 * k) : null);
    tube(c, pass, P.toxHi, 0.85);
    // drool
    c.beginPath(); c.moveTo(mx - 0.8, my + mr - 0.2); c.quadraticCurveTo(mx - 0.2, my + mr + 1.6, mx - 0.9, my + mr + 2.6);
    tube(c, pass, '#b6ff5a', 0.5, { hot: false });
    c.beginPath(); c.arc(mx - 0.9, my + mr + 3.2, 0.55, 0, TAU); fillIn(c, pass, '#e8ffc0', '#b6ff5a');
    // angry eyes above the snout
    const ey = -15.6 - k * 0.6;
    c.beginPath();
    tri(c, -1.8, ey - 1.2, 1.4, ey + 0.2, -0.4, ey + 1.7);
    tri(c, 6.6, ey - 1.6, 3.0, ey + 0.2, 4.8, ey + 1.7);
    fillIn(c, pass, '#f4ffe0', '#b6ff5a');
    c.beginPath(); c.moveTo(-2.4, ey - 2.4); c.lineTo(1.6, ey - 0.7); c.moveTo(7.0, ey - 2.8); c.lineTo(3.0, ey - 0.8);
    tube(c, pass, P.tox, 0.55, { hot: false });
    c.restore();
  }

  /* ---- Zündrübe: round beet bomb with a burning fuse ---- */
  const BOMB_TIP = [1.2, -24.2];
  function bomberPose(c, pass, ph) {
    const a = ph * TAU, s = Math.sin(a), s2 = Math.sin(a + Math.PI / 2);
    const bob = -Math.abs(s) * 0.8;
    const dark = 'rgba(42,2,12,0.96)';
    // four scurrying legs (far pair dimmer)
    const legs = [[-3.6, s], [1.4, -s], [-1.2, s2], [3.8, -s2]];
    for (let i = 0; i < 4; i++) {
      const [hx, ph2] = legs[i], lift = Math.max(0, ph2) * 1.8;
      rootLeg(c, pass, hx, -4.6 + bob, hx + ph2 * 1.6 + 0.6, -lift, 1, i < 2 ? '#ff5a7a' : '#c0304e', 0.85);
    }
    c.save(); c.translate(0, bob);
    // tap root tail at the back
    c.beginPath(); c.moveTo(-4.6, -6.4); c.quadraticCurveTo(-8.4, -5.4, -9.6, -7.6); c.quadraticCurveTo(-10.4, -9.4, -9.2, -10.2);
    tube(c, pass, P.beet, 0.6, { hot: false });
    // leaf tuft
    leaf(c, pass, -0.4, -16.6, -2.3, 3.8, 1.4, P.stem, dark);
    leaf(c, pass, 0.4, -16.6, -0.75, 3.4, 1.3, P.stem, dark);
    // fuse
    c.beginPath(); c.moveTo(0, -17); c.bezierCurveTo(-1.6, -19.4, 2.8, -20.6, 2.0, -22.2); c.quadraticCurveTo(1.6, -23.4, BOMB_TIP[0], BOMB_TIP[1]);
    tube(c, pass, P.fuse, 0.7, { hot: false });
    c.beginPath(); c.moveTo(-0.4, -18.6); c.lineTo(0.8, -18.9); c.moveTo(1.6, -20.6); c.lineTo(2.7, -20.4);
    tube(c, pass, '#8a5a20', 0.35, { hot: false, glow: false });
    // body
    const body = () => { c.beginPath(); c.arc(0, -10.4, 6.9, 0, TAU); };
    body(); fillIn(c, pass, dark);
    if (pass === 'full') {
      c.save(); body(); c.clip();
      c.fillStyle = 'rgba(255,45,85,0.34)'; c.fillRect(-8, -18, 16, 8.4);
      c.fillStyle = 'rgba(255,120,40,0.18)'; c.fillRect(-8, -9.6, 16, 7);
      c.restore();
    }
    c.beginPath(); c.moveTo(-6.4, -9.6); c.quadraticCurveTo(0, -7.8, 6.4, -9.6);
    tube(c, pass, '#ff8a3c', 0.5, { hot: false });
    body(); tube(c, pass, P.beet, 1.3);
    // shine
    c.beginPath(); c.arc(0, -10.4, 5.0, 3.6, 4.4); tube(c, pass, 'rgba(255,220,230,0.85)', 0.55, { hot: false, glow: false });
    // mean little eyes + brows
    c.beginPath();
    tri(c, 0.4, -12.6, 2.9, -11.6, 0.9, -10.6);
    tri(c, 6.0, -12.8, 3.8, -11.6, 5.6, -10.6);
    fillIn(c, pass, '#fff2c8', '#ffcf4a');
    c.beginPath(); c.moveTo(-0.2, -14.4); c.lineTo(3.0, -12.5); c.moveTo(6.6, -14.6); c.lineTo(3.8, -12.5);
    tube(c, pass, '#ffb0c0', 0.6, { hot: false });
    // gritted teeth
    c.beginPath(); c.moveTo(1.2, -7.9); c.lineTo(5.4, -8.3); c.moveTo(2.6, -8.6); c.lineTo(2.6, -7.5); c.moveTo(4.1, -8.8); c.lineTo(4.1, -7.7);
    tube(c, pass, '#ffd0d8', 0.45, { hot: false });
    c.restore();
  }

  /* ---- Wurzel-Bock: parsnip ram with curled horns ---- */
  // mode: 0 trot, 1/2 telegraph (reared, scraping), 3 dash, 4 dizzy
  const CH_PIV = [-8, -6];
  function chargerTf(mode) { return mode === 1 || mode === 2 ? -0.24 : mode === 3 ? 0.13 : 0; }
  function chargerPose(c, pass, ph, mode) {
    const a = ph * TAU, s = Math.sin(a);
    const dark = 'rgba(34,18,6,0.96)';
    const ang = chargerTf(mode);
    const bob = mode === 0 ? -Math.abs(s) * 1.0 : 0;
    const R = (x, y) => { const p = rot(x, y, CH_PIV[0], CH_PIV[1], ang); return [p[0], p[1] + bob]; };
    const red = mode === 1 || mode === 2;
    // legs: [hip x, hip y, phase sign, near?]
    const hips = [[-9.6, -8.6, 1, 0], [3.2, -7.8, -1, 0], [-7.0, -7.6, -1, 1], [6.2, -7.4, 1, 1]];
    for (const [hx, hy, sg, near] of hips) {
      const h = R(hx, hy);
      let fx, fy;
      const front = hx > 0;
      if (mode === 0) { fx = hx + s * sg * 2.2; fy = -Math.max(0, s * sg) * 2.2; }
      else if (mode === 3) { fx = hx + (front ? 5.5 : -5.5) + (near ? 1 : 0); fy = front ? -2.2 : -0.6; }
      else if (red) {
        if (front) { const scr = mode === 1 ? 1 : -1; fx = h[0] + 1.5 + (near ? scr * 2.4 : 2.6); fy = near ? -1.2 - (scr > 0 ? 1.8 : 0) : -3.6; }
        else { fx = hx - 1.0; fy = 0; }
      } else { fx = hx + (near ? 0.8 : -0.6); fy = 0; }
      const col = near ? P.sand : '#a8834e';
      c.beginPath(); c.moveTo(h[0], h[1]);
      c.quadraticCurveTo((h[0] + fx) / 2 + 0.8, (h[1] + fy) / 2, fx, fy);
      c.lineTo(fx + 1.6, fy + 0.1); c.moveTo(fx, fy); c.lineTo(fx - 0.7, fy + 0.35);
      tube(c, pass, col, 1.8);
    }
    c.save();
    c.translate(0, bob);
    c.translate(CH_PIV[0], CH_PIV[1]); c.rotate(ang); c.translate(-CH_PIV[0], CH_PIV[1] * -1);
    // tail root
    c.beginPath(); c.moveTo(-14.6, -12.4); c.quadraticCurveTo(-17.6, -13.0, -18.0, -15.6); c.quadraticCurveTo(-18.2, -17.0, -17.0, -17.4);
    tube(c, pass, P.sand, 0.6, { hot: false });
    // horn: a ram's curl around the side of the head
    const horn = (ox, oy, col, lw) => {
      c.beginPath();
      c.moveTo(10.0 + ox, -16.4 + oy);
      c.bezierCurveTo(9.6 + ox, -22.8 + oy, 1.6 + ox, -24.4 + oy, 0.8 + ox, -18.4 + oy);
      c.bezierCurveTo(0.2 + ox, -13.4 + oy, 5.4 + ox, -10.8 + oy, 7.4 + ox, -13.4 + oy);
      c.bezierCurveTo(8.6 + ox, -15.2 + oy, 6.8 + ox, -17.4 + oy, 5.0 + ox, -16.4 + oy);
      tube(c, pass, col, lw, { glowCol: P.hornG });
    };
    horn(-1.6, -0.9, '#b8926a', 1.7);
    // body: parsnip lying, tapering into a root tail at the back
    const body = () => {
      c.beginPath(); c.moveTo(6.0, -18.8);
      c.bezierCurveTo(-1.0, -19.6, -8.0, -17.4, -15.0, -12.6);
      c.bezierCurveTo(-8.0, -8.0, -1.0, -6.0, 6.0, -6.4);
      c.bezierCurveTo(9.6, -6.8, 10.4, -18.2, 6.0, -18.8); c.closePath();
    };
    body(); fillIn(c, pass, dark);
    if (pass === 'full') {
      c.save(); body(); c.clip();
      c.fillStyle = 'rgba(255,190,110,0.13)'; c.fillRect(-19, -21, 34, 16);
      c.fillStyle = 'rgba(255,200,130,0.22)'; c.fillRect(-19, -21, 34, 7.4);
      c.restore();
    }
    c.beginPath();
    c.moveTo(-9.2, -15.4); c.quadraticCurveTo(-8.0, -12.6, -9.0, -9.6);
    c.moveTo(-4.4, -17.4); c.quadraticCurveTo(-3.0, -13.2, -4.2, -7.8);
    c.moveTo(0.4, -18.6); c.quadraticCurveTo(1.8, -13.2, 0.6, -6.6);
    tube(c, pass, '#b98b52', 0.45, { hot: false, gw: 1.2 });
    body(); tube(c, pass, P.sand, 1.3);
    // tuft on the crown
    leaf(c, pass, 7.6, -17.6, -1.95, 4.0, 1.3, P.stem, dark);
    leaf(c, pass, 8.6, -17.4, -1.3, 3.4, 1.1, P.stem, dark);
    // lowered head: the thick end of the root, snout pointing down-forward
    const head = () => {
      c.beginPath(); c.moveTo(8.0, -17.4);
      c.bezierCurveTo(12.2, -17.6, 14.6, -13.6, 15.0, -10.0);
      c.bezierCurveTo(15.2, -7.4, 13.2, -5.8, 11.0, -6.4);
      c.bezierCurveTo(8.0, -7.0, 5.2, -9.6, 5.2, -12.8);
      c.bezierCurveTo(5.2, -15.4, 6.4, -17.3, 8.0, -17.4); c.closePath();
    };
    head(); fillIn(c, pass, dark);
    if (pass === 'full') { c.save(); head(); c.clip(); c.fillStyle = 'rgba(255,205,140,0.26)'; c.fillRect(4, -19, 12, 7); c.restore(); }
    head(); tube(c, pass, P.sand, 1.2);
    // near horn (the big curl)
    horn(0, 0, P.horn, 2.2);
    c.beginPath();
    c.moveTo(7.6, -21.8); c.lineTo(8.6, -20.6); c.moveTo(4.2, -22.8); c.lineTo(4.6, -21.4); c.moveTo(1.4, -21.0); c.lineTo(2.6, -20.4); c.moveTo(0.6, -16.4); c.lineTo(2.0, -16.6);
    tube(c, pass, '#d29a52', 0.4, { hot: false, glow: false });
    // eye + brow + nostril
    if (mode === 4) {
      c.beginPath(); c.arc(11.6, -12.4, 1.5, 0, 4.7); c.arc(11.6, -12.4, 0.6, 4.7, 9);
      tube(c, pass, '#fff4c8', 0.45, { hot: false });
    } else {
      c.beginPath(); tri(c, 10.0, -13.8, 13.6, -12.6, 10.6, -11.0);
      fillIn(c, pass, red ? '#ffd0c8' : '#fff4c8', red ? P.red : '#ffcf4a');
      c.beginPath(); c.moveTo(9.6, -15.0); c.lineTo(13.8, -13.2);
      tube(c, pass, red ? '#ff6a5a' : P.sand, 0.6, { hot: false });
    }
    c.beginPath(); c.moveTo(13.6, -8.4); c.lineTo(14.2, -7.6);
    tube(c, pass, '#ffe9c8', 0.5, { hot: false, glow: false });
    c.restore();
  }
  const CH_EYE = (mode) => { const p = rot(11.6, -12.4, CH_PIV[0], CH_PIV[1], chargerTf(mode)); return p; };

  /* ---- Rüben-Ahnin: old matriarch with headscarf, cane and a crown of sprouts ---- */
  function babyBulb(c, pass, x, y, sc, lean, dark) {
    leaf(c, pass, x, y - 4.4 * sc, -1.5 + lean, 3.0 * sc, 1.1 * sc, P.lime, dark);
    bulb(c, x, y - 4.6 * sc, y, 2.4 * sc); fillIn(c, pass, dark); tube(c, pass, P.root, 0.75);
    c.beginPath(); c.arc(x + 0.2 * sc, y - 2.4 * sc, 0.38, 0, TAU); c.moveTo(x + 1.5 * sc, y - 2.4 * sc); c.arc(x + 1.3 * sc, y - 2.4 * sc, 0.38, 0, TAU);
    fillIn(c, pass, '#ffeafb', '#ff9ae8');
  }
  function motherPose(c, pass, ph) {
    const a = ph * TAU, s = Math.sin(a);
    const bob = -Math.abs(s) * 1.2;
    const dark = 'rgba(26,8,40,0.97)';
    // legs
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * s) * 1.6;
      c.beginPath(); c.moveTo(sd * 5, -5 + bob);
      c.quadraticCurveTo(sd * 6.6, -2.6, sd * 6.0 + s * 1.0, -lift);
      c.lineTo(sd * 6.0 + s * 1.0 + 2.0, -lift + 0.1);
      tube(c, pass, P.lav, 1.3);
    }
    c.save(); c.translate(0, bob);
    c.translate(0, -8); c.rotate(s * 0.035); c.translate(0, 8);
    // back arm
    c.beginPath(); c.moveTo(-11.6, -14); c.quadraticCurveTo(-15.2, -11.0, -14.0, -7.8);
    tube(c, pass, '#8f7fd0', 0.9, { hot: false });
    // scarf tails at the back (flutter)
    c.beginPath(); c.moveTo(-11.2, -24.4); c.quadraticCurveTo(-15.6, -22.4 + s * 0.6, -17.6, -18.4 + s); c.lineTo(-15.0, -19.0 + s * 0.6); c.closePath();
    c.moveTo(-11.0, -23.4); c.quadraticCurveTo(-14.0, -19.6, -14.4, -16.2 - s * 0.6); c.lineTo(-12.6, -17.8); c.closePath();
    fillIn(c, pass, 'rgba(110,8,62,0.95)'); tube(c, pass, P.rose, 0.8);
    // body
    const body = () => bulb(c, 0, -31, -4, 13.6);
    body(); fillIn(c, pass, dark);
    if (pass === 'full') {
      c.save(); body(); c.clip();
      c.fillStyle = 'rgba(176,130,255,0.30)'; c.fillRect(-15, -34, 30, 21);
      c.fillStyle = 'rgba(255,225,140,0.16)'; c.fillRect(-15, -13, 30, 10);
      c.restore();
    }
    wave(c, pass, -12.6, 12.6, -13.2, P.face);
    // wrinkles
    c.beginPath();
    c.moveTo(-8.6, -10.4); c.quadraticCurveTo(-6.6, -9.4, -4.8, -10.0);
    c.moveTo(-9.6, -17.0); c.quadraticCurveTo(-8.0, -16.0, -6.4, -16.6);
    c.moveTo(1.6, -8.4); c.quadraticCurveTo(4.4, -7.4, 7.0, -8.4);
    tube(c, pass, 'rgba(200,180,255,0.55)', 0.45, { hot: false, glow: false });
    body(); tube(c, pass, P.lav, 1.5);
    // headscarf
    const scarf = () => {
      c.beginPath(); c.moveTo(-12.4, -23.0);
      c.bezierCurveTo(-11.8, -29.4, -6.6, -33.4, 0, -33.4);
      c.bezierCurveTo(6.6, -33.4, 11.8, -29.4, 12.6, -23.0);
      c.quadraticCurveTo(6.0, -25.6, 0, -25.0); c.quadraticCurveTo(-6.4, -24.6, -12.4, -23.0); c.closePath();
    };
    scarf(); fillIn(c, pass, 'rgba(110,8,62,0.96)');
    if (pass === 'full') {
      c.save(); scarf(); c.clip();
      c.fillStyle = 'rgba(255,200,230,0.85)';
      for (const [dx, dy] of [[-8, -26.4], [-3.4, -29.8], [2.2, -31.0], [7.4, -27.4], [2.6, -26.4], [-6.0, -30.6], [10.4, -24.6]]) { c.beginPath(); c.arc(dx, dy, 0.75, 0, TAU); c.fill(); }
      c.restore();
    }
    scarf(); tube(c, pass, P.rose, 1.1);
    // knot at the back
    c.beginPath(); c.ellipse(-11.6, -23.6, 1.6, 1.3, 0.4, 0, TAU); fillIn(c, pass, 'rgba(110,8,62,0.96)'); tube(c, pass, P.rose, 0.8);
    // crown of baby sprouts
    babyBulb(c, pass, -6.0, -31.0 + Math.sin(a + 0.8) * 0.3, 1, -0.3, dark);
    babyBulb(c, pass, 6.4, -31.2 + Math.sin(a + 2.4) * 0.3, 1, 0.3, dark);
    babyBulb(c, pass, 0.2, -33.0 + Math.sin(a) * 0.4, 1.2, 0, dark);
    // face: heavy lids, bushy brows, nose, frown
    c.beginPath();
    c.moveTo(1.8, -19.6); c.quadraticCurveTo(3.8, -18.0, 5.8, -19.6); c.quadraticCurveTo(3.8, -20.4, 1.8, -19.6);
    c.moveTo(7.8, -19.6); c.quadraticCurveTo(9.6, -18.0, 11.4, -19.6); c.quadraticCurveTo(9.6, -20.4, 7.8, -19.6);
    fillIn(c, pass, '#ffeafb', '#ff9ae8');
    c.beginPath(); c.moveTo(1.2, -21.8); c.lineTo(6.0, -21.0); c.moveTo(7.6, -21.0); c.lineTo(12.0, -22.0);
    tube(c, pass, P.ice, 0.8, { hot: false, glowCol: P.lav });
    c.beginPath(); c.moveTo(7.0, -18.0); c.quadraticCurveTo(8.6, -15.4, 6.6, -14.8);
    tube(c, pass, P.lav, 0.6, { hot: false });
    c.beginPath(); c.moveTo(3.0, -11.8); c.quadraticCurveTo(6.4, -13.4, 9.8, -11.6);
    c.moveTo(5.6, -12.7); c.lineTo(5.8, -11.6);
    tube(c, pass, '#ffa6f2', 0.6, { hot: false });
    // cane + front arm
    c.beginPath(); c.moveTo(14.6, -1.0 - bob); c.lineTo(13.4, -17.0); c.quadraticCurveTo(13.2, -20.4, 15.8, -20.2); c.quadraticCurveTo(17.8, -19.8, 17.4, -17.8);
    tube(c, pass, P.amber, 0.9);
    c.beginPath(); c.moveTo(10.4, -13.2); c.quadraticCurveTo(12.2, -14.0, 13.4, -15.6);
    tube(c, pass, P.lav, 1.0);
    c.restore();
  }

  /* ---- Rübchen: tiny angry baby turnip ---- */
  function sproutPose(c, pass, ph) {
    const a = ph * TAU, s = Math.sin(a);
    const bob = -Math.abs(s) * 1.0;
    const dark = 'rgba(28,6,40,0.96)';
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * s) * 1.6;
      c.beginPath(); c.moveTo(sd * 1.6, -3.0 + bob);
      c.quadraticCurveTo(sd * 2.4, -1.6, sd * 2.4 + s * 1.2, -lift); c.lineTo(sd * 2.4 + s * 1.2 + 1.2, -lift);
      tube(c, pass, P.root, 0.75);
    }
    c.save(); c.translate(0, bob); c.rotate(s * 0.06);
    leaf(c, pass, 0.2, -12.6, -1.05 + Math.sin(a + 1) * 0.15, 4.6, 1.7, P.lime, dark);
    const body = () => bulb(c, 0, -13.0, -2.8, 5.2);
    body(); fillIn(c, pass, dark);
    crownTint(c, pass, body, -9.6, 'rgba(200,90,255,0.4)', -6, 6);
    body(); tube(c, pass, P.root, 1.0);
    // big angry eyes
    c.beginPath(); c.ellipse(0.6, -7.6, 1.15, 1.45, 0, 0, TAU); c.moveTo(4.4, -7.6); c.ellipse(3.4, -7.6, 1.0, 1.35, 0, 0, TAU);
    fillIn(c, pass, '#ffeafb', '#ff9ae8');
    c.beginPath(); c.arc(1.0, -7.3, 0.45, 0, TAU); c.moveTo(4.1, -7.3); c.arc(3.7, -7.3, 0.42, 0, TAU);
    fillIn(c, pass, '#2a0630');
    c.beginPath(); c.moveTo(-0.8, -9.8); c.lineTo(1.8, -8.8); c.moveTo(4.8, -9.8); c.lineTo(2.6, -8.8);
    tube(c, pass, P.mag, 0.55, { hot: false });
    c.beginPath(); c.moveTo(1.2, -4.6); c.quadraticCurveTo(2.2, -5.4, 3.2, -4.6);
    tube(c, pass, '#ffa6f2', 0.45, { hot: false });
    c.restore();
  }

  /* ---- objects ---- */
  function shotPose(c, pass) {
    c.beginPath();
    c.moveTo(3.4, 0); c.bezierCurveTo(3.4, -2.6, 1.0, -3.0, -0.6, -2.7);
    c.bezierCurveTo(-3.0, -2.2, -5.6, -0.9, -6.6, 0);
    c.bezierCurveTo(-5.6, 0.9, -3.0, 2.2, -0.6, 2.7);
    c.bezierCurveTo(1.0, 3.0, 3.4, 2.6, 3.4, 0); c.closePath();
    let g = null;
    if (pass === 'full') {
      g = c.createRadialGradient(1.0, -0.6, 0, 0.4, 0, 3.6);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#eaffb8'); g.addColorStop(1, '#8dff2a');
    }
    fillIn(c, pass, g, P.tox);
    tube(c, pass, '#4fe010', 0.8, { hot: false, gw: 2.6 });
    c.beginPath(); c.arc(1.4, -1.2, 0.7, 0, TAU); fillIn(c, pass, '#ffffff');
  }
  function pumpkinPath(c, cx, cy, rx, ry, depth) {
    c.beginPath();
    for (let i = 0; i <= 56; i++) {
      const t = (i / 56) * TAU;
      const r = 1 + depth * Math.cos(6 * t) - 0.08 * Math.pow(Math.max(0, -Math.sin(t)), 14);
      const x = cx + Math.cos(t) * rx * r, y = cy + Math.sin(t) * ry * r;
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.closePath();
  }
  function starPose(c, pass) {
    c.beginPath();
    for (let i = 0; i < 8; i++) { const t = -Math.PI / 2 + (i / 8) * TAU, r = i % 2 ? 0.7 : 2.2; c.lineTo(Math.cos(t) * r, Math.sin(t) * r); }
    c.closePath(); fillIn(c, pass, '#fff6c8', P.scarf); tube(c, pass, P.scarf, 0.4, { hot: false });
  }

  /* ================= sprite caches (built lazily per type) ================= */
  let GLOW = null, POOL = null, SHOT = null, STAR = null;
  const SPR = {};
  const BUILD = {
    spitter: () => ({
      walk: [0, 1, 2, 3, 4, 5].map((i) => makeSprite(10, 30, 17, 5, (c, p) => spitterPose(c, p, i / 6, 0))),
      aim: [0.4, 0.75, 1].map((k) => makeSprite(12, 31, 19, 5, (c, p) => spitterPose(c, p, 0, k), { glowA: 1.1 })),
    }),
    bomber: () => ({ walk: [0, 1, 2, 3, 4, 5].map((i) => makeSprite(12, 28, 10, 5, (c, p) => bomberPose(c, p, i / 6), { hotTint: '#ff2a2a' })) }),
    charger: () => ({
      walk: [0, 1, 2, 3, 4, 5].map((i) => makeSprite(21, 31, 18, 5, (c, p) => chargerPose(c, p, i / 6, 0))),
      tele: [1, 2].map((m) => makeSprite(21, 34, 19, 5, (c, p) => chargerPose(c, p, 0, m), { hotTint: '#ff3a2a' })),
      dash: makeSprite(23, 31, 21, 5, (c, p) => chargerPose(c, p, 0, 3)),
      rest: makeSprite(21, 31, 18, 5, (c, p) => chargerPose(c, p, 0, 4)),
    }),
    mother: () => ({ walk: [0, 1, 2, 3, 4, 5].map((i) => makeSprite(21, 43, 21, 5, (c, p) => motherPose(c, p, i / 6), { wide: 2.4 })) }),
    sprout: () => ({ walk: [0, 1, 2, 3].map((i) => makeSprite(9, 19, 9, 4, (c, p) => sproutPose(c, p, i / 4), { wide: 1.8 })) }),
  };
  const get = (t) => SPR[t] || (SPR[t] = BUILD[t]());
  const COL = { spitter: P.tox, bomber: P.beet, charger: P.sand, mother: P.lav, sprout: P.root };
  const TOP = { spitter: 26, bomber: 24, charger: 26, mother: 38, sprout: 14 };

  /* ================= drawing ================= */
  function put(ctx, s, img, x, y, tf) {
    if (!tf) { ctx.drawImage(img, x - s.ax * s.w, y - s.ay * s.h, s.w, s.h); return; }
    const py = tf.py || 0;
    ctx.save();
    ctx.translate(x, y + py);
    if (tf.rot) ctx.rotate(tf.rot);
    ctx.scale(tf.sx || 1, tf.sy || 1);
    ctx.drawImage(img, -s.ax * s.w, -py - s.ay * s.h, s.w, s.h);
    ctx.restore();
  }
  function glowAt(ctx, img, x, y, r, a, sq) {
    if (a <= 0) return;
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(img, x - r, y - r * (sq || 1), r * 2, r * 2 * (sq || 1));
  }
  /** spawn / death exactly like the style's creeper; returns true when it handled the draw */
  function lifecycle(ctx, e, s, type) {
    const x = e.x, y = e.y;
    if (e.dying) {
      const t = e.deathT, sc = 1 + t * 0.35;
      const w = s.w * sc, h = s.h * sc;
      const dx = x - s.ax * w, dy = y - s.ay * h + t * 3;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.max(0, 1 - t * 1.6); ctx.drawImage(s.img, dx, dy, w, h);
      ctx.globalAlpha = Math.max(0, 0.9 - t * 1.4); ctx.drawImage(s.flash, dx, dy, w, h);
      ctx.globalAlpha = Math.max(0, 0.6 - t);
      ctx.drawImage(s.red, dx - 2 - t * 4, dy, w, h); ctx.drawImage(s.cyan, dx + 2 + t * 4, dy, w, h);
      if (type === 'mother' && t < 0.5) { // bursts open: magenta ring
        ctx.globalAlpha = (0.5 - t) * 1.6; ctx.strokeStyle = P.rose; ctx.lineWidth = 1.2;
        const rr = 10 + t * 50; ctx.beginPath(); ctx.ellipse(x, y - 4, rr, rr * 0.45, 0, 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      return true;
    }
    if (e.spawnT < 1) {
      const col = COL[type];
      const r = U.ease.outQuad(e.spawnT);
      const img = s.img, iw = img.width, ih = img.height;
      const W = s.w, H = s.h, dx = x - s.ax * W, dy = y - s.ay * H;
      const rr = e.r * (2.4 - 1.4 * e.spawnT);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = col; ctx.globalAlpha = (1 - e.spawnT) * 0.9; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.42, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = (1 - e.spawnT) * 0.25; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.45 + 0.55 * e.spawnT;
      const cut = ih * (1 - r);
      if (ih - cut > 1) ctx.drawImage(img, 0, cut, iw, ih - cut, dx, dy + H * (1 - r), W, H * r);
      const sy = Math.max(dy + H * (1 - r), y - TOP[type] - 2);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.9 * (1 - e.spawnT * 0.6); ctx.fillStyle = hot(col, 0.5);
      const hw = e.r * 1.3;
      ctx.fillRect(x - hw, sy - 0.35, hw * 2, 0.7);
      ctx.globalAlpha = 0.25 * (1 - e.spawnT); ctx.fillStyle = col;
      ctx.fillRect(x - hw * 0.9, sy, hw * 1.8, Math.max(0, y - sy));
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      return true;
    }
    return false;
  }
  function hitFlash(ctx, e, s, x, y, tf) {
    if (!(e.flash > 0)) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(0.6, e.flash * 0.9);
    put(ctx, s, s.flash, x, y, tf);
    if (e.flash > 0.5) {
      ctx.globalAlpha = 0.6 * e.flash;
      put(ctx, s, s.red, x - 1.4, y, tf); put(ctx, s, s.cyan, x + 1.4, y, tf);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  const side = (f) => (f < 0 ? 1 : 0);
  const fr = (e, rate, n) => Math.floor((e.anim * rate + e.seed) * n) % n;

  C.art('neon', {
    init() {
      GLOW = { green: makeGlow(P.tox, 1), white: makeGlow('#ffffff', 1), red: makeGlow(P.red, 1), yellow: makeGlow('#ffcf4a', 1), pink: makeGlow(P.rose, 1), orange: makeGlow('#ff8a2a', 1), cyan: makeGlow(P.cyan, 1) };
      POOL = { spitter: makePool(P.tox, 0.5, 0.2), bomber: makePool(P.beet, 0.5, 0.22), charger: makePool(P.amber, 0.55, 0.18), mother: makePool(P.lav, 0.55, 0.2), sprout: makePool(P.root, 0.45, 0.2) };
      SHOT = bakeSet(9, 6, 6, 6, shotPose, { wide: 1.6, tight: 0.5, glowA: 1.4 });
      STAR = bakeSet(4, 4, 4, 4, starPose, { wide: 1, tight: 0.4, glowA: 1.3 });
    },

    enemies: {
      spitter(ctx, e, view) {
        const S = get('spitter');
        const sd = side(e.facing), f = e.facing < 0 ? -1 : 1;
        const aiming = e.mode === 'aim' && e.spawnT >= 1;
        const k = aiming ? e.charge || 0 : 0;
        const s = aiming ? S.aim[k < 0.45 ? 0 : k < 0.8 ? 1 : 2][sd] : S.walk[fr(e, 0.36, 6)][sd];
        if (lifecycle(ctx, e, s, 'spitter')) return;
        let x = e.x, y = e.y, tf = null;
        const sp = e.spit || 0;
        if (aiming) x += Math.sin(view.rt * 55 + e.seed * 9) * 0.55 * k;
        if (sp > 0) { const q = sp * sp; tf = { sx: 1 + 0.16 * q, sy: 1 - 0.16 * q }; x -= f * 2.2 * q; }
        put(ctx, s, s.img, x, y, tf);
        const mx = x + f * (13 + (aiming ? 0.8 * k : 0)), my = y - 9.6 - (aiming ? 0.6 * k : 0);
        ctx.globalCompositeOperation = 'lighter';
        if (aiming) {
          glowAt(ctx, GLOW.green, mx, my, 7 + 9 * k, 0.25 + 0.7 * k);
          glowAt(ctx, GLOW.white, mx, my, 2 + 3 * k, k * 0.8);
          // juice being sucked in
          ctx.strokeStyle = P.toxHi; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.7 * k;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const ph = (view.rt * 2.2 + i / 4) % 1, a = i * 1.6 + e.seed * 6, d = 9 * (1 - ph) + 2;
            const px = mx + f * Math.cos(a) * d * 0.6 + f * d * 0.5, py = my + Math.sin(a) * d * 0.6;
            ctx.moveTo(px, py); ctx.lineTo(px + (mx - px) * 0.25, py + (my - py) * 0.25);
          }
          ctx.stroke();
        }
        if (sp > 0) {
          glowAt(ctx, GLOW.green, mx, my, 6 + 8 * sp, sp);
          ctx.strokeStyle = P.toxHi; ctx.lineWidth = 0.7; ctx.globalAlpha = sp;
          ctx.beginPath();
          const L = 3 + 7 * (1 - sp);
          for (let i = -2; i <= 2; i++) {
            const a = i * 0.32, c0 = 1.5 + (1 - sp) * 3;
            ctx.moveTo(mx + f * Math.cos(a) * c0, my + Math.sin(a) * c0); ctx.lineTo(mx + f * Math.cos(a) * (c0 + L), my + Math.sin(a) * (c0 + L));
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        hitFlash(ctx, e, s, x, y, tf);
      },

      bomber(ctx, e, view) {
        const S = get('bomber');
        const sd = side(e.facing), f = e.facing < 0 ? -1 : 1;
        const s = S.walk[fr(e, e.armed ? 0.7 : 0.55, 6)][sd];
        if (lifecycle(ctx, e, s, 'bomber')) return;
        const fu = e.armed ? e.fuse || 0 : 0;
        let x = e.x, y = e.y, tf = null, sc = 1;
        if (e.armed) {
          sc = 1 + 0.12 * fu + 0.04 * Math.sin(view.rt * 40) * fu;
          tf = { sx: sc, sy: sc, py: -10 };
          x += Math.sin(view.rt * 70 + e.seed * 7) * 0.5 * fu;
        }
        put(ctx, s, s.img, x, y, tf);
        if (e.armed) {
          const blink = Math.sin(fu * (5 + 18 * fu) * TAU) > 0;
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = blink ? 0.55 : 0.35 + 0.35 * fu;
          put(ctx, s, blink ? s.flash : s.hot, x, y, tf);
          glowAt(ctx, GLOW.red, x, y - 10, 12 + 6 * fu, blink ? 0.55 : 0.25);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
        // fuse spark
        const tx = x + f * BOMB_TIP[0] * sc, ty = y - 10 + (BOMB_TIP[1] + 10) * sc;
        const fl = 0.75 + 0.25 * Math.sin(view.rt * 31 + e.seed * 20);
        const R = (2.2 + 4.5 * fu) * fl;
        ctx.globalCompositeOperation = 'lighter';
        glowAt(ctx, GLOW.yellow, tx, ty, R * 2.2, 0.9);
        glowAt(ctx, GLOW.white, tx, ty, R * 0.8, 1);
        ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 0.45; ctx.globalAlpha = 0.9;
        ctx.beginPath();
        const n = 4 + Math.round(fu * 3);
        for (let i = 0; i < n; i++) {
          const a = view.rt * 9 + i * (TAU / n) + e.seed * 5, L = R * (0.9 + 0.5 * Math.sin(view.rt * 23 + i * 2));
          ctx.moveTo(tx + Math.cos(a) * R * 0.3, ty + Math.sin(a) * R * 0.3); ctx.lineTo(tx + Math.cos(a) * L, ty + Math.sin(a) * L);
        }
        ctx.stroke();
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        hitFlash(ctx, e, s, x, y, tf);
      },

      charger(ctx, e, view) {
        const S = get('charger');
        const m = e.spawnT < 1 || e.dying ? 'chase' : e.mode;
        const dirF = (m === 'tele' || m === 'dash') && e.dashX ? (e.dashX < 0 ? -1 : 1) : e.facing < 0 ? -1 : 1;
        const sd = side(dirF);
        let s, mode = 0;
        if (m === 'tele') { mode = Math.floor(view.rt * 9) % 2 ? 2 : 1; s = S.tele[mode - 1][sd]; }
        else if (m === 'dash') { mode = 3; s = S.dash[sd]; }
        else if (m === 'rest') { mode = 4; s = S.rest[sd]; }
        else s = S.walk[fr(e, 0.42, 6)][sd];
        if (lifecycle(ctx, e, s, 'charger')) return;
        let x = e.x, y = e.y, tf = null;
        const rt = view.rt;
        if (mode === 1 || mode === 2) {
          const k = Math.min(1, (e.modeT || 0) / 0.72);
          x += Math.sin(rt * 80 + e.seed * 9) * (0.3 + 0.6 * k);
        } else if (mode === 4) {
          tf = { rot: Math.sin(rt * 9 + e.seed * 5) * 0.08, py: 0 };
        } else if (mode === 3) {
          // speed smear: after-images along the dash line
          ctx.globalCompositeOperation = 'lighter';
          const dx = e.dashX || dirF, dy = e.dashY || 0;
          for (let i = 1; i <= 3; i++) { ctx.globalAlpha = 0.28 / i; put(ctx, s, s.img, x - dx * i * 4.5, y - dy * i * 4.5, null); }
          ctx.strokeStyle = '#ffe6c0'; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.6;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const o = ((rt * 3 + i * 0.27 + e.seed) % 1), py = y - 6 - i * 4.2, px = x - dx * (10 + o * 10);
            ctx.moveTo(px, py - dy * 8); ctx.lineTo(px - dx * (8 + 6 * (1 - o)), py - dy * (16 + 6 * (1 - o)));
          }
          ctx.stroke();
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
        put(ctx, s, s.img, x, y, tf);
        if (mode === 1 || mode === 2) {
          const k = Math.min(1, (e.modeT || 0) / 0.72);
          const ep = CH_EYE(mode);
          const ex = x + dirF * ep[0], ey = y + ep[1];
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.25 + 0.35 * k * (0.6 + 0.4 * Math.sin(rt * 30));
          put(ctx, s, s.hot, x, y, tf);
          glowAt(ctx, GLOW.red, ex, ey, 4 + 4 * k, 0.6 + 0.4 * k);
          glowAt(ctx, GLOW.white, ex, ey, 1.4 + k, 0.8);
          // ground scrape dust
          ctx.strokeStyle = P.sand; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.6;
          ctx.beginPath();
          for (let i = 0; i < 3; i++) {
            const ph = (rt * 4 + i / 3) % 1, px = x + dirF * (3 - ph * 9), py = y - ph * 3 - i * 0.6;
            ctx.moveTo(px, py); ctx.lineTo(px - dirF * 1.4, py - 0.4);
          }
          ctx.stroke();
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        } else if (mode === 4) {
          // dizzy: stars circling the horns
          const hx = x + dirF * 3, hy = y - 27;
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 3; i++) {
            const a = rt * 5 + (i / 3) * TAU;
            const sx = hx + Math.cos(a) * 7, sy = hy + Math.sin(a) * 2.4;
            const sz = 0.75 + 0.25 * Math.sin(a);
            ctx.globalAlpha = 0.6 + 0.4 * Math.sin(a);
            ctx.drawImage(STAR.img, sx - STAR.ax * STAR.w * sz, sy - STAR.ay * STAR.h * sz, STAR.w * sz, STAR.h * sz);
          }
          ctx.strokeStyle = P.cyan; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.6;
          ctx.beginPath(); ctx.ellipse(hx, hy, 7, 2.4, 0, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
        hitFlash(ctx, e, s, x, y, tf);
      },

      mother(ctx, e, view) {
        const S = get('mother');
        const sd = side(e.facing);
        const s = S.walk[fr(e, 0.24, 6)][sd];
        if (lifecycle(ctx, e, s, 'mother')) return;
        const b = e.birth || 0;
        let tf = null;
        if (b > 0) {
          const q = Math.sin((1 - b) * Math.PI * 3) * b * 0.13;
          tf = { sx: 1 + q, sy: 1 - q };
          ctx.globalCompositeOperation = 'lighter';
          glowAt(ctx, GLOW.pink, e.x, e.y - 1, 18 + 10 * (1 - b), b * 0.8, 0.45);
          ctx.strokeStyle = P.rose; ctx.lineWidth = 1; ctx.globalAlpha = b;
          const rr = 8 + 20 * (1 - b); ctx.beginPath(); ctx.ellipse(e.x, e.y, rr, rr * 0.42, 0, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
        put(ctx, s, s.img, e.x, e.y, tf);
        if (b > 0) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = b * 0.35; put(ctx, s, s.flash, e.x, e.y, tf);
          glowAt(ctx, GLOW.pink, e.x, e.y - 31, 9 + 6 * b, b * 0.7);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
        hitFlash(ctx, e, s, e.x, e.y, tf);
      },

      sprout(ctx, e, view) {
        const S = get('sprout');
        const s = S.walk[fr(e, 0.7, 4)][side(e.facing)];
        if (lifecycle(ctx, e, s, 'sprout')) return;
        put(ctx, s, s.img, e.x, e.y, null);
        hitFlash(ctx, e, s, e.x, e.y, null);
      },
    },

    shadow(ctx, o) {
      const img = POOL && POOL[o.type];
      if (!img) return false;
      let a = 1;
      if (o.dying) a = 1 - o.deathT; else if (o.spawnT < 1) a = o.spawnT;
      if (a <= 0) return true;
      const rw = o.r * (o.type === 'charger' ? 1.75 : 1.45);
      ctx.globalAlpha = a;
      ctx.drawImage(img, o.x - rw, o.y - rw * 0.4, rw * 2, rw * 0.8);
      ctx.globalAlpha = 1;
      return true;
    },

    shot(ctx, s, view) {
      const y = s.y - s.z, a = s.angle;
      const pulse = 1 + 0.1 * Math.sin(view.rt * 22 + s.seed * 10);
      const ca = Math.cos(a), sa = Math.sin(a);
      ctx.globalCompositeOperation = 'lighter';
      glowAt(ctx, GLOW.green, s.x, y, 11 * pulse, 0.55);
      // trailing droplets
      for (let i = 1; i <= 3; i++) {
        const d = i * 3.6 + Math.sin(view.rt * 15 + i + s.seed * 7) * 0.5, r = 1.9 - i * 0.4;
        glowAt(ctx, GLOW.green, s.x - ca * d, y - sa * d + Math.sin(view.rt * 12 + i * 2) * 0.6, r * 2.4, 0.8 - i * 0.18);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.translate(s.x, y); ctx.rotate(a);
      const w = 1 + 0.12 * Math.sin(view.rt * 18 + s.seed * 6);
      ctx.scale(pulse * w, pulse / w);
      ctx.drawImage(SHOT.img, -SHOT.ax * SHOT.w, -SHOT.ay * SHOT.h, SHOT.w, SHOT.h);
      ctx.restore();
    },

    icons: (() => {
      // same framing as the style's icons: 96 design space, neon tubes with shadowBlur halo, no frame
      function kit(ctx, size) {
        const s = size / 96;
        ctx.scale(s, s);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const small = size <= 48;
        const LW = small ? 7.5 : 4.6, blur = size / 9;
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
        const leafI = (x, y, ang, L, W) => {
          const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
          ctx.beginPath(); ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + dx * L * 0.5 + nx * W, y + dy * L * 0.5 + ny * W, x + dx * L, y + dy * L);
          ctx.quadraticCurveTo(x + dx * L * 0.5 - nx * W, y + dy * L * 0.5 - ny * W, x, y); ctx.closePath();
        };
        const star = (x, y, r) => { ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); };
        return { LW, small, neon, solid, seed, leafI, star };
      }
      const pumpkin = (ctx, cx, cy, rx, ry) => pumpkinPath(ctx, cx, cy, rx, ry, 0.04);
      return {
        leech(ctx, size) {
          const { LW, neon, solid, small } = kit(ctx, size);
          for (let i = 0; i < 2; i++) { const x = 24 + i * 16; ctx.beginPath(); ctx.moveTo(x, 44); ctx.bezierCurveTo(x - 6, 36, x + 6, 30, x, 20); neon('#ffd27a', LW * 0.45); }
          ctx.beginPath(); ctx.moveTo(68, 40); ctx.bezierCurveTo(56, 30, 54, 18, 62, 14); ctx.bezierCurveTo(66, 12, 68, 16, 68, 18); ctx.bezierCurveTo(68, 16, 70, 12, 74, 14);
          ctx.bezierCurveTo(82, 18, 80, 30, 68, 40); ctx.closePath(); neon('#ff3d8b', LW * 0.7, 'rgba(255,40,120,0.35)');
          ctx.beginPath(); ctx.moveTo(10, 50); ctx.lineTo(86, 50); ctx.quadraticCurveTo(86, 88, 48, 88); ctx.quadraticCurveTo(10, 88, 10, 50); ctx.closePath();
          neon('#ff8a2a', LW, 'rgba(255,120,40,0.18)');
          ctx.beginPath(); ctx.ellipse(48, 50, 34, small ? 5 : 6, 0, 0, TAU); neon('#ffae35', LW * 0.45, 'rgba(255,170,60,0.4)');
          if (!small) { ctx.beginPath(); ctx.moveTo(26, 66); ctx.quadraticCurveTo(48, 72, 70, 66); neon('#c8601a', LW * 0.35); }
          ctx.beginPath(); ctx.arc(60, 49, 3, 0, TAU); solid('#fff0b8', '#ffae35');
        },
        thorns(ctx, size) {
          const { LW, neon, small } = kit(ctx, size);
          ctx.beginPath();
          const n = 10;
          for (let i = 0; i <= n * 2; i++) { const a = -Math.PI / 2 + (i / (n * 2)) * TAU, r = i % 2 ? 26 : 42; ctx.lineTo(48 + Math.cos(a) * r, 50 + Math.sin(a) * r); }
          ctx.closePath(); neon('#ff3ad6', LW * 0.75, 'rgba(255,58,214,0.12)');
          ctx.beginPath(); ctx.moveTo(48, 30); ctx.bezierCurveTo(62, 30, 68, 42, 66, 52); ctx.bezierCurveTo(64, 64, 54, 70, 48, 72);
          ctx.bezierCurveTo(42, 70, 32, 64, 30, 52); ctx.bezierCurveTo(28, 42, 34, 30, 48, 30); ctx.closePath();
          ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(176,102,255,0.38)'; ctx.fillRect(0, 0, 96, 52); ctx.fillStyle = 'rgba(255,225,74,0.25)'; ctx.fillRect(0, 52, 96, 44); ctx.restore();
          neon('#b066ff', LW * 0.8);
          if (!small) { ctx.beginPath(); ctx.moveTo(32, 52); ctx.quadraticCurveTo(40, 48, 48, 52); ctx.quadraticCurveTo(56, 56, 64, 52); neon('#ffe14a', LW * 0.4); }
          ctx.beginPath(); ctx.moveTo(48, 30); ctx.quadraticCurveTo(44, 22, 38, 20); ctx.moveTo(48, 30); ctx.quadraticCurveTo(52, 22, 58, 20); neon('#c6ff3a', LW * 0.45);
        },
        dashup(ctx, size) {
          const { LW, neon, small } = kit(ctx, size);
          ctx.beginPath(); ctx.moveTo(4, 40); ctx.lineTo(24, 40); ctx.moveTo(2, 54); ctx.lineTo(20, 54); ctx.moveTo(6, 68); ctx.lineTo(24, 68);
          neon('#6ff4ff', LW * 0.5);
          ctx.beginPath(); ctx.arc(50, 54, 37, -0.9, 0.9); neon('#ff3ad6', LW * 0.45);
          if (!small) { ctx.beginPath(); ctx.arc(50, 54, 43, -0.6, 0.6); neon('#ff3ad6', LW * 0.3); }
          ctx.save(); ctx.translate(54, 54); ctx.rotate(0.5);
          pumpkin(ctx, 0, 0, 26, 24); ctx.restore();
          neon('#ff7a1a', LW, 'rgba(255,110,30,0.2)');
          ctx.save(); ctx.translate(54, 54); ctx.rotate(0.5);
          ctx.beginPath(); ctx.moveTo(-9, -23); ctx.quadraticCurveTo(-16, 0, -9, 23); ctx.moveTo(9, -23); ctx.quadraticCurveTo(16, 0, 9, 23);
          ctx.restore(); neon('#c8601a', LW * 0.4);
          ctx.save(); ctx.translate(54, 54); ctx.rotate(0.5);
          ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(2, -32, 8, -33);
          ctx.restore(); neon('#9cff4a', LW * 0.6);
        },
        range(ctx, size) {
          const { LW, neon, seed, solid } = kit(ctx, size);
          ctx.setLineDash([0.1, 10]);
          ctx.beginPath(); ctx.moveTo(26, 52); ctx.quadraticCurveTo(36, 14, 66, 30); neon('#6ff4ff', LW * 0.8);
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(76, 36, 13, 0, TAU); neon('#ff3ad6', LW * 0.6, 'rgba(255,58,214,0.12)');
          ctx.beginPath(); ctx.moveTo(76, 16); ctx.lineTo(76, 24); ctx.moveTo(76, 48); ctx.lineTo(76, 56); ctx.moveTo(56, 36); ctx.lineTo(64, 36); ctx.moveTo(88, 36); ctx.lineTo(94, 36);
          neon('#ff3ad6', LW * 0.4);
          ctx.beginPath(); ctx.arc(76, 36, 3.6, 0, TAU); solid('#ffffff', '#ff3ad6');
          seed(20, 70, -1.25, 22);
        },
      };
    })(),
  });
})();
