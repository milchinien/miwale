/* Deep Sea Glow – the abyssal sea floor at night, lit only by living light.
   Navy sand ripples, terraced rock shelves, brine pools, kelp, coral, tube worms and whale bones; every light source
   is a creature or a plant (cyan, teal, violet, pink) – plus the warm helmet lamp of the little diver.
   Glow = halos blurred ONCE at bake time and added with 'lighter' at runtime – no per-frame filters.
   Atmosphere: marine snow in three parallax layers, gentle caustics from far above, soft light shafts, depth fog. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;
  const K = 4;   // prop / effect sprite resolution (px per world unit)
  const KC = 5;  // character sprite resolution
  const W3 = [255, 255, 255];
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const hexA = (h, a) => rgba(U.hex(h), a);
  const hot = (h, t) => U.rgb(U.mix(U.hex(h), W3, t === undefined ? 0.55 : t));
  const fract = (x) => x - Math.floor(x);
  const sstep = U.smoothstep;

  /* ================= palette ================= */
  const P = {
    abyss: '#040b18', ink: '#02050b',
    cyan: '#59e8ff', teal: '#34f0c8', aqua: '#c4fdff', violet: '#9d7dff', pink: '#ff6fd2', rose: '#ff7fae', mint: '#8dffe0',
    lamp: '#fff1c8', lampGlow: '#ffc46b',
    suit: '#1f4d6e', suitDk: '#112e46', suitLt: '#3f7fa6', metal: '#4b6a80', metalDk: '#243a4c',
  };
  const SPARK = ['#59e8ff', '#34f0c8', '#9d7dff', '#ff6fd2'];

  /* ================= bake toolkit ================= */
  function bFill(c, pass, st) { if (pass === 'full') { c.fillStyle = st; c.fill(); } }
  function bStroke(c, pass, st, lw) { if (pass === 'full') { c.strokeStyle = st; c.lineWidth = lw; c.stroke(); } }
  function eFill(c, pass, st, gst) { c.fillStyle = pass === 'full' ? st : (gst || st); c.fill(); }
  function eStroke(c, pass, st, lw, gst, gw) {
    c.strokeStyle = pass === 'full' ? st : (gst || st);
    c.lineWidth = pass === 'full' ? lw : lw * (gw || 1.8);
    c.stroke();
  }
  function gFill(c, pass, gst) { if (pass !== 'full') { c.fillStyle = gst; c.fill(); } }
  function gStroke(c, pass, gst, lw) { if (pass !== 'full') { c.strokeStyle = gst; c.lineWidth = lw; c.stroke(); } }
  function dot(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }
  function rrect(c, x, y, w, h, r) {
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }

  /** Bake a sprite: sharp body (pass 'full') + a separate blurred halo of everything that emits light (pass 'glow').
      o.pool = [colour, radius, alpha] adds a soft light pool on the sea floor under the origin to the halo. */
  function bake(l, t, r, b, draw, o) {
    o = o || {};
    const k = o.k || K;
    const w = Math.ceil((l + r) * k), h = Math.ceil((t + b) * k);
    const mk = (pass) => {
      const { c, ctx } = U.canvas(w, h);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setTransform(k, 0, 0, k, l * k, t * k);
      draw(ctx, pass);
      return c;
    };
    const full = mk('full'), glow = mk('glow');
    const H = U.canvas(w, h), hc = H.ctx;
    if (o.pool) {
      const col = o.pool[0], R = o.pool[1] * k, a = o.pool[2];
      hc.save(); hc.translate(l * k, t * k); hc.scale(1, 0.42);
      const g = hc.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, hexA(col, a)); g.addColorStop(0.45, hexA(col, a * 0.38)); g.addColorStop(1, hexA(col, 0));
      hc.fillStyle = g; hc.fillRect(-R, -R, R * 2, R * 2); hc.restore();
    }
    const ga = o.glowA === undefined ? 1 : o.glowA;
    hc.filter = 'blur(' + (o.wide || 3.2) * k + 'px)';
    hc.globalAlpha = Math.min(1, ga); hc.drawImage(glow, 0, 0);
    if (ga > 1) { hc.globalAlpha = Math.min(1, ga - 1); hc.drawImage(glow, 0, 0); }
    hc.filter = 'blur(' + (o.tight || 0.9) * k + 'px)';
    hc.globalAlpha = Math.min(1, 0.8 * ga); hc.drawImage(glow, 0, 0);
    hc.filter = 'none'; hc.globalAlpha = 1;
    return { img: full, halo: H.c, w: w / k, h: h / k, ax: (l * k) / w, ay: (t * k) / h };
  }
  /** Character sprite: both facings + an aqua-white flash silhouette + a pink hurt silhouette. */
  /** Body + its halo pre-composited ('lighter') into ONE canvas: one drawImage per object at runtime. */
  function merged(B, ha) {
    const { c, ctx } = U.canvas(B.img.width, B.img.height);
    ctx.drawImage(B.img, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = ha === undefined ? 1 : ha;
    ctx.drawImage(B.halo, 0, 0);
    return c;
  }
  /** Character sprite: both facings + an aqua-white flash silhouette + a pink hurt silhouette.
      o.merge: the halo is baked into the body (creatures – many on screen); otherwise it stays separate (main character). */
  /** Crop a baked sprite to the bounds of its visible pixels (halos leave wide transparent margins that would
      otherwise still be blended every frame). Returns the crop box in px, applied to all canvases of the sprite. */
  function cropBox(c) {
    const w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 3) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return { x: 0, y: 0, w, h };
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  function cropTo(c, b) {
    const { c: o, ctx } = U.canvas(b.w, b.h);
    ctx.drawImage(c, -b.x, -b.y);
    return o;
  }
  function cropSprite(s, k, b) {
    const W = s.w * k, H = s.h * k, ax = s.ax * W, ay = s.ay * H;
    return { w: b.w / k, h: b.h / k, ax: (ax - b.x) / b.w, ay: (ay - b.y) / b.h };
  }
  function charSprite(l, t, r, b, draw, o) {
    o = Object.assign({ k: KC }, o);
    const B = bake(l, t, r, b, draw, o);
    const img = o.merge ? merged(B, o.merge) : B.img, halo = o.merge ? null : B.halo;
    let R = { img, halo, flash: U.tint(B.img, '#e6fffb'), hurt: U.tint(B.img, '#ff5c9a'), w: B.w, h: B.h, ax: B.ax, ay: B.ay };
    if (o.merge) {
      const box = cropBox(img), g = cropSprite(R, o.k, box);
      R = Object.assign(g, { img: cropTo(img, box), halo: null, flash: cropTo(R.flash, box), hurt: cropTo(R.hurt, box) });
    }
    const L = { img: U.flipX(R.img), halo: R.halo && U.flipX(R.halo), flash: U.flipX(R.flash), hurt: U.flipX(R.hurt), w: R.w, h: R.h, ax: 1 - R.ax, ay: R.ay };
    return [R, L];
  }
  function propSprite(l, t, r, b, draw, o) {
    const B = bake(l, t, r, b, draw, o);
    const img = merged(B, 1), box = cropBox(img);
    return Object.assign(cropSprite(B, (o && o.k) || K, box), { img: cropTo(img, box), halo: null });
  }
  function blit(ctx, s, img, x, y, sx, sy) {
    sx = sx || 1; sy = sy || sx;
    const w = s.w * sx, h = s.h * sy;
    ctx.drawImage(img, x - s.ax * w, y - s.ay * h, w, h);
  }
  /** Halos are made for dark water: on a bright foreign floor (style mixes) they are toned down so they don't blow out. */
  let haloK = 1, haloKey = null;
  function haloFor(view) {
    const h = view && view.game && view.game.hooks;
    const gc = (h && h.groundColor) || '#040b18';
    if (gc !== haloKey) {
      haloKey = gc;
      let c = [4, 11, 24];
      try { c = U.hex(gc); } catch (e) { /* keep default */ }
      const lum = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255;
      haloK = lum < 0.16 ? 1 : Math.max(0.3, 1 - (lum - 0.16) * 1.6);
    }
    return haloK;
  }
  /** Body with normal blending, then its halo added on top (soft bloom in the water). */
  function drawLit(ctx, s, x, y, a, ha, sx, sy) {
    if (a > 0) { ctx.globalAlpha = Math.min(1, a); blit(ctx, s, s.img, x, y, sx, sy); }
    ha *= haloK;
    if (ha > 0 && s.halo) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, ha);
      blit(ctx, s, s.halo, x, y, sx, sy);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  /* ---- glow sprites (cached per colour) ---- */
  function glowSprite(col, core) {
    const c0 = U.hex(col);
    return U.sprite(64, 64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      if (core) {
        g.addColorStop(0, rgba(U.mix(c0, W3, 0.85), 1)); g.addColorStop(0.12, rgba(U.mix(c0, W3, 0.5), 0.95));
        g.addColorStop(0.3, rgba(c0, 0.55));
      } else { g.addColorStop(0, rgba(c0, 0.85)); g.addColorStop(0.3, rgba(c0, 0.4)); }
      g.addColorStop(0.62, rgba(c0, 0.1)); g.addColorStop(1, rgba(c0, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    });
  }
  const GLOWS = new Map(), POOLS = new Map();
  function glowOf(col) { let g = GLOWS.get(col); if (!g) { g = glowSprite(col, true); GLOWS.set(col, g); } return g; }
  function poolOf(col) { let g = POOLS.get(col); if (!g) { g = glowSprite(col, false); POOLS.set(col, g); } return g; }

  /* ================= characters ================= */
  /* ---- the diver (main character): dome helmet with a warm lamp, suit with glowing seams, flippers ---- */
  const LAMP = { x: 6.5, y: -28.6 };
  function diverPose(c, pass, ph, mode) {
    const a = ph * TAU, s = Math.sin(a);
    const walk = mode === 'walk', dash = mode === 'dash';
    const bob = walk ? -Math.abs(Math.sin(a)) * 0.9 : 0;
    c.save();
    if (dash) { c.translate(0, -3); c.rotate(0.62); }
    const hipY = -8.2 + bob;
    const leg = (hx, p, near) => {
      let fx, fy, fa;
      if (walk) { fx = hx + Math.sin(p) * 3.1; fy = -Math.max(0, Math.cos(p)) * 1.6; fa = Math.cos(p) * 0.32; }
      else if (dash) { fx = hx - 1.0 + (near ? 1.4 : -0.8); fy = near ? 0.4 : -0.8; fa = near ? 0.3 : -0.25; }
      else { fx = hx * 1.6 + 0.4; fy = 0; fa = 0.04; }
      c.beginPath(); c.moveTo(hx, hipY); c.quadraticCurveTo((hx + fx) / 2 + 0.8, (hipY + fy) / 2, fx, fy - 1.4);
      bStroke(c, pass, near ? P.suit : P.suitDk, 3.0);
      if (near) {
        c.beginPath(); c.moveTo(hx + 1.0, hipY + 0.6); c.quadraticCurveTo((hx + fx) / 2 + 1.9, (hipY + fy) / 2, fx + 1.1, fy - 1.7);
        eStroke(c, pass, 'rgba(120,244,255,0.6)', 0.28);
      }
      c.save(); c.translate(fx, fy - 0.9); c.rotate(fa);
      c.beginPath();
      c.moveTo(-1.7, -1.0); c.lineTo(1.3, -1.3); c.quadraticCurveTo(4.6, -1.2, 7.4, -0.5);
      c.lineTo(7.7, 0.5); c.quadraticCurveTo(6.0, 1.2, 4.4, 0.7); c.quadraticCurveTo(1.8, 1.25, -1.5, 0.95); c.closePath();
      bFill(c, pass, near ? '#17445f' : '#0c2638');
      c.beginPath(); c.moveTo(2.4, -1.15); c.quadraticCurveTo(5.4, -1.0, 7.5, 0.0);
      eStroke(c, pass, near ? 'rgba(120,246,255,0.95)' : 'rgba(110,240,255,0.45)', 0.42);
      c.restore();
    };
    const sy = -15.4 + bob;
    const arm = (sx, ang, near) => {
      const ex = sx + Math.sin(ang * 0.7) * 2.5 + 0.3, ey = sy + Math.cos(ang * 0.7) * 2.5;
      const hx = ex + Math.sin(ang) * 2.4 + 0.5, hy = ey + Math.cos(ang) * 2.4;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy);
      bStroke(c, pass, near ? P.suit : P.suitDk, 2.3);
      dot(c, hx, hy, 1.15); bFill(c, pass, near ? '#2d5f80' : '#183a52');
      if (near) { dot(c, ex * 0.35 + hx * 0.65, ey * 0.35 + hy * 0.65, 0.45); eFill(c, pass, '#aaf9ff', '#59e8ff'); }
    };
    const swing = walk ? s * 0.75 : 0.18;
    arm(-0.6, dash ? 2.5 : swing, false);
    leg(-0.8, a + Math.PI, false);
    // air tank on the back
    c.beginPath(); rrect(c, -7.6, -19.2 + bob, 4.2, 10.0, 1.9);
    if (pass === 'full') {
      const g = c.createLinearGradient(-7.6, 0, -3.4, 0);
      g.addColorStop(0, P.metalDk); g.addColorStop(0.45, '#7898ae'); g.addColorStop(1, P.metalDk);
      c.fillStyle = g; c.fill();
    }
    c.beginPath(); c.moveTo(-7.5, -12.4 + bob); c.lineTo(-3.5, -12.4 + bob); bStroke(c, pass, '#152738', 0.6);
    c.beginPath(); rrect(c, -6.3, -20.6 + bob, 1.6, 1.6, 0.4); bFill(c, pass, '#3a556a');
    c.beginPath(); c.moveTo(-5.5, -20.4 + bob); c.quadraticCurveTo(-7.0, -23.2 + bob, -5.0, -24.4 + bob); bStroke(c, pass, '#1b3042', 0.9);
    dot(c, -5.5, -16.0 + bob, 0.62); eFill(c, pass, '#a8ffd8', '#4dffc0');
    leg(1.0, a, true);
    // torso
    c.beginPath(); c.ellipse(0.4, -12.2 + bob, 4.3, 5.3, 0, 0, TAU);
    if (pass === 'full') {
      const g = c.createLinearGradient(0, -17.5 + bob, 0, -7 + bob);
      g.addColorStop(0, P.suitLt); g.addColorStop(0.4, P.suit); g.addColorStop(1, P.suitDk);
      c.fillStyle = g; c.fill();
    }
    c.beginPath(); c.moveTo(-3.8, -9.6 + bob); c.quadraticCurveTo(0.4, -8.3 + bob, 4.5, -9.6 + bob); bStroke(c, pass, '#0a1a28', 1.1);
    dot(c, 3.1, -9.2 + bob, 0.5); eFill(c, pass, '#ffe6a0', '#ffc46b');
    c.beginPath(); c.moveTo(1.6, -16.6 + bob); c.quadraticCurveTo(4.2, -13.0 + bob, 3.0, -10.2 + bob);
    eStroke(c, pass, 'rgba(120,244,255,0.85)', 0.32);
    dot(c, 2.6, -13.8 + bob, 0.85); eFill(c, pass, '#d4feff', '#59e8ff');
    arm(1.4, dash ? 2.3 : -swing, true);
    // collar ring
    c.beginPath(); c.ellipse(0.7, -17.6 + bob, 4.9, 1.6, 0, 0, TAU);
    if (pass === 'full') {
      const g = c.createLinearGradient(0, -19.2 + bob, 0, -16 + bob);
      g.addColorStop(0, '#8fb0c4'); g.addColorStop(0.5, '#4e6d82'); g.addColorStop(1, '#22384a');
      c.fillStyle = g; c.fill();
    }
    for (const i of [-3, -1, 1, 3]) { dot(c, 0.7 + i * 1.15, -17.3 + bob, 0.3); bFill(c, pass, '#b8d6e6'); }
    // dome helmet
    const hx = 1.0, hy = -23.2 + bob, hr = 6.8;
    dot(c, hx, hy, hr);
    if (pass === 'full') {
      const g = c.createRadialGradient(hx + 1.8, hy - 1.4, 0.5, hx, hy, hr);
      g.addColorStop(0, 'rgba(76,156,196,0.92)'); g.addColorStop(0.55, 'rgba(26,72,106,0.95)'); g.addColorStop(1, 'rgba(10,30,52,0.98)');
      c.fillStyle = g; c.fill();
      // face, lit warm by the lamp spill inside the dome
      dot(c, hx + 1.7, hy + 0.7, 3.4);
      const f = c.createRadialGradient(hx + 2.6, hy - 0.2, 0.3, hx + 1.7, hy + 0.7, 3.4);
      f.addColorStop(0, '#ffe5cc'); f.addColorStop(0.6, '#e9a987'); f.addColorStop(1, '#8a5246');
      c.fillStyle = f; c.fill();
      c.beginPath(); c.moveTo(hx - 1.7, hy - 0.1); c.quadraticCurveTo(hx - 0.6, hy - 3.8, hx + 3.0, hy - 3.0);
      c.quadraticCurveTo(hx + 4.9, hy - 2.5, hx + 5.1, hy - 1.3); c.quadraticCurveTo(hx + 2.8, hy - 2.0, hx + 1.2, hy - 1.1);
      c.quadraticCurveTo(hx - 0.2, hy - 0.4, hx - 1.7, hy - 0.1); c.closePath();
      c.fillStyle = '#2b1a22'; c.fill();
      c.fillStyle = '#13131d';
      dot(c, hx + 2.7, hy + 0.25, 0.52); c.fill();
      dot(c, hx + 4.3, hy + 0.35, 0.46); c.fill();
      c.fillStyle = '#ffffff'; dot(c, hx + 2.86, hy + 0.05, 0.17); c.fill();
      c.fillStyle = 'rgba(255,120,140,0.5)'; dot(c, hx + 4.2, hy + 1.6, 0.62); c.fill();
      c.beginPath(); c.moveTo(hx + 2.9, hy + 2.05); c.quadraticCurveTo(hx + 3.5, hy + 2.6, hx + 4.1, hy + 2.05);
      c.strokeStyle = '#5a2a2a'; c.lineWidth = 0.3; c.stroke();
      // glass tint + reflections
      dot(c, hx, hy, hr);
      const tg = c.createRadialGradient(hx + 1.2, hy, hr * 0.45, hx, hy, hr);
      tg.addColorStop(0, 'rgba(8,30,56,0)'); tg.addColorStop(1, 'rgba(8,30,56,0.6)');
      c.fillStyle = tg; c.fill();
      c.beginPath(); c.arc(hx, hy, hr - 1.2, -2.75, -1.7); c.strokeStyle = 'rgba(230,252,255,0.75)'; c.lineWidth = 0.85; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.85)'; dot(c, hx - 2.6, hy - 4.2, 0.5); c.fill();
      c.beginPath(); c.arc(hx, hy, hr - 1.0, 0.3, 1.1); c.strokeStyle = 'rgba(140,240,255,0.4)'; c.lineWidth = 0.5; c.stroke();
    } else {
      c.fillStyle = 'rgba(70,210,255,0.3)'; c.fill();
      c.beginPath(); c.ellipse(0.4, -12.2 + bob, 4.5, 5.5, 0, 0, TAU);
      c.strokeStyle = 'rgba(89,232,255,0.45)'; c.lineWidth = 0.9; c.stroke();
    }
    dot(c, hx, hy, hr); bStroke(c, pass, '#5e8096', 1.15);
    dot(c, hx, hy, hr + 0.05); eStroke(c, pass, 'rgba(150,240,255,0.5)', 0.3);
    for (const an of [-0.4, 0.9, 2.2, 3.5]) { dot(c, hx + Math.cos(an) * hr, hy + Math.sin(an) * hr, 0.32); bFill(c, pass, '#c4e2f0'); }
    // helmet lamp
    const la = -0.98, lx = hx + Math.cos(la) * (hr + 0.4), ly = hy + Math.sin(la) * (hr + 0.4);
    c.save(); c.translate(lx, ly); c.rotate(0.35);
    c.beginPath(); rrect(c, -1.9, -1.2, 3.4, 2.4, 0.7); bFill(c, pass, '#34505f');
    c.beginPath(); c.ellipse(1.6, 0, 0.7, 1.25, 0, 0, TAU); eFill(c, pass, P.lamp, P.lampGlow);
    if (pass !== 'full') { dot(c, 1.8, 0, 2.3); c.fillStyle = 'rgba(255,200,110,0.55)'; c.fill(); }
    c.restore();
    c.restore();
  }

  /* ---- small creature: a pulsing jellyfish ---- */
  function bellRim(c, rx, rimY, a, move) {
    if (move) c.moveTo(rx, rimY);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const x0 = rx - (i / n) * 2 * rx, x1 = rx - ((i + 1) / n) * 2 * rx;
      c.quadraticCurveTo((x0 + x1) / 2, rimY + 1.0 + 0.3 * Math.sin(a + i), x1, rimY);
    }
  }
  function jellyPose(c, pass, ph) {
    const a = ph * TAU;
    const pulse = 0.5 + 0.5 * Math.cos(a);   // 1 relaxed (wide), 0 contracted (narrow, tall)
    const rx = 6.2 + 2.3 * pulse, ry = 7.8 - 1.9 * pulse;
    const rimY = -15.5 - (1 - pulse) * 1.4;
    for (let i = 0; i < 7; i++) {
      const x0 = (-0.82 + i * (1.64 / 6)) * rx;
      c.beginPath(); c.moveTo(x0, rimY + 0.6);
      let x = x0, y = rimY + 0.6;
      for (let k = 1; k <= 6; k++) {
        const nx = x0 * (1 - k * 0.05) + Math.sin(a - k * 0.75 + i * 1.3) * 0.32 * k;
        const ny = rimY + 0.6 + k * (1.75 + 0.4 * (1 - pulse));
        c.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2); x = nx; y = ny;
      }
      c.lineTo(x, y);
      eStroke(c, pass, i % 2 ? 'rgba(255,160,232,0.6)' : 'rgba(205,160,255,0.55)', 0.32, 'rgba(255,110,220,0.4)', 2.4);
    }
    for (let i = -1; i <= 1; i++) {
      c.beginPath(); c.moveTo(i * 1.1, rimY - 1);
      for (let k = 1; k <= 4; k++) c.lineTo(i * 1.4 + Math.sin(a + k * 1.1 + i) * 0.9, rimY - 1 + k * 2.3);
      eStroke(c, pass, 'rgba(255,175,236,0.45)', 1.05, 'rgba(255,120,220,0.3)');
    }
    c.beginPath(); c.moveTo(-rx, rimY);
    c.bezierCurveTo(-rx, rimY - ry * 1.32, rx, rimY - ry * 1.32, rx, rimY);
    bellRim(c, rx, rimY, a, false); c.closePath();
    if (pass === 'full') {
      const g = c.createRadialGradient(-rx * 0.25, rimY - ry * 0.75, 0.4, 0, rimY - ry * 0.3, rx * 1.05);
      g.addColorStop(0, 'rgba(255,222,250,0.95)'); g.addColorStop(0.4, 'rgba(236,124,234,0.8)'); g.addColorStop(1, 'rgba(112,52,192,0.72)');
      c.fillStyle = g; c.fill();
    } else { c.fillStyle = 'rgba(255,100,215,0.45)'; c.fill(); }
    c.beginPath(); c.ellipse(0, rimY - ry * 0.3, rx * 0.62, ry * 0.42, 0, Math.PI, TAU); c.closePath();
    bFill(c, pass, 'rgba(84,22,134,0.4)');
    for (let i = 0; i < 4; i++) {
      const an = Math.PI * 0.25 + i * Math.PI * 0.5;
      c.beginPath(); c.ellipse(Math.cos(an) * rx * 0.25, rimY - ry * 0.5 + Math.sin(an) * ry * 0.16, 1.2, 0.7, an, 0, TAU);
      eStroke(c, pass, 'rgba(255,196,246,0.95)', 0.4);
    }
    c.beginPath(); c.moveTo(rx, rimY); bellRim(c, rx, rimY, a, false);
    eStroke(c, pass, 'rgba(255,205,246,0.9)', 0.4);
    for (let i = 0; i <= 8; i++) { dot(c, -rx + (i / 8) * 2 * rx, rimY + 0.2, 0.36); eFill(c, pass, '#fff2fc', '#ff8ae0'); }
    if (pass === 'full') {
      c.beginPath(); c.ellipse(-rx * 0.36, rimY - ry * 0.82, rx * 0.3, ry * 0.18, -0.5, 0, TAU);
      c.fillStyle = 'rgba(255,255,255,0.38)'; c.fill();
    }
  }

  /* ---- fast creature: a lantern fish with rows of photophores ---- */
  function lanternPose(c, pass, ph) {
    const a = ph * TAU, w = Math.sin(a);
    const cy = -12;
    c.save(); c.translate(-6.6, cy); c.rotate(w * 0.38);
    c.beginPath(); c.moveTo(0.8, -1.0); c.lineTo(-5.6, -4.7); c.quadraticCurveTo(-3.8, 0, -5.6, 4.5); c.lineTo(0.8, 1.0); c.closePath();
    bFill(c, pass, 'rgba(46,96,146,0.6)');
    c.beginPath(); c.moveTo(-5.6, -4.7); c.quadraticCurveTo(-3.8, 0, -5.6, 4.5);
    eStroke(c, pass, 'rgba(130,240,255,0.7)', 0.32);
    c.restore();
    c.beginPath(); c.moveTo(-1.6, cy - 3.3); c.quadraticCurveTo(0.2, cy - 6.0, 2.2, cy - 3.6); c.closePath();
    bFill(c, pass, 'rgba(40,86,130,0.75)');
    c.beginPath();
    c.moveTo(9.2, cy + 0.2);
    c.bezierCurveTo(8.0, cy - 3.9, 2.0, cy - 4.4, -3.5, cy - 2.6);
    c.quadraticCurveTo(-6.0, cy - 1.6, -7.0, cy);
    c.quadraticCurveTo(-6.0, cy + 1.4, -3.5, cy + 2.4);
    c.bezierCurveTo(1.5, cy + 4.0, 7.5, cy + 3.4, 9.2, cy + 0.2);
    c.closePath();
    if (pass === 'full') {
      const g = c.createLinearGradient(0, cy - 4.2, 0, cy + 3.6);
      g.addColorStop(0, '#0d223c'); g.addColorStop(0.45, '#1e4168'); g.addColorStop(1, '#6b97c0');
      c.fillStyle = g; c.fill();
    } else { c.fillStyle = 'rgba(60,180,255,0.14)'; c.fill(); }
    if (pass === 'full') {
      c.beginPath(); c.moveTo(-5.5, cy - 0.3); c.quadraticCurveTo(1, cy - 1.0, 7.5, cy - 0.6);
      c.strokeStyle = 'rgba(170,215,255,0.35)'; c.lineWidth = 0.4; c.stroke();
      c.beginPath(); c.moveTo(8.6, cy - 2.2); c.quadraticCurveTo(5.5, cy - 4.0, 0, cy - 3.9);
      c.strokeStyle = 'rgba(150,210,255,0.4)'; c.lineWidth = 0.35; c.stroke();
      c.beginPath(); c.moveTo(3.9, cy - 2.6); c.quadraticCurveTo(3.0, cy, 3.9, cy + 2.7);
      c.strokeStyle = 'rgba(5,14,26,0.8)'; c.lineWidth = 0.4; c.stroke();
      c.beginPath(); c.moveTo(9.0, cy + 0.6); c.lineTo(7.2, cy + 1.1);
      c.strokeStyle = 'rgba(5,14,26,0.9)'; c.lineWidth = 0.35; c.stroke();
    }
    c.save(); c.translate(2.6, cy + 1.6); c.rotate(0.5 + w * 0.4);
    c.beginPath(); c.ellipse(-1.6, 0, 2.0, 0.8, 0, 0, TAU); bFill(c, pass, 'rgba(120,190,240,0.45)');
    c.restore();
    dot(c, 5.7, cy - 0.7, 2.05); bFill(c, pass, '#03070e');
    dot(c, 5.7, cy - 0.7, 1.75); eStroke(c, pass, 'rgba(150,250,255,0.9)', 0.38);
    dot(c, 5.9, cy - 0.7, 0.75); bFill(c, pass, '#0a1a2c');
    dot(c, 5.25, cy - 1.25, 0.38); bFill(c, pass, '#ffffff');
    for (let i = 0; i < 8; i++) {
      const x = -4.6 + i * 1.5, y = cy + 2.3 + 0.55 * Math.sin((i / 7) * Math.PI) - (i > 5 ? (i - 5) * 0.5 : 0);
      dot(c, x, y, 0.5); eFill(c, pass, '#c8fdff', '#3fd9ff');
    }
    for (let i = 0; i < 6; i++) { dot(c, -3.6 + i * 1.7, cy + 0.9, 0.36); eFill(c, pass, '#9ff7ff', '#3fd9ff'); }
    dot(c, 7.6, cy + 1.6, 0.62); eFill(c, pass, '#f0ffff', '#59e8ff');
    dot(c, 4.0, cy + 2.6, 0.5); eFill(c, pass, '#c8fdff', '#59e8ff');
  }

  /* ---- large creature: an anglerfish (the lure is drawn per frame so it can sway) ---- */
  const ANG_CY = -24;
  function anglerPose(c, pass, ph) {
    const a = ph * TAU, s = Math.sin(a);
    const cy = ANG_CY, j = 0.5 + 0.5 * Math.sin(a + 0.6);
    const rng = U.rng(77);
    c.save(); c.translate(-16, cy - 1); c.rotate(s * 0.22);
    c.beginPath(); c.moveTo(1, -2); c.lineTo(-9.5, -8); c.quadraticCurveTo(-6.8, 0, -9.5, 8); c.lineTo(1, 2); c.closePath();
    bFill(c, pass, 'rgba(26,36,70,0.9)');
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-8.4, i * 3.2); bStroke(c, pass, 'rgba(90,110,170,0.35)', 0.3); }
    c.beginPath(); c.moveTo(-9.5, -8); c.quadraticCurveTo(-6.8, 0, -9.5, 8); eStroke(c, pass, 'rgba(170,150,255,0.55)', 0.4);
    c.restore();
    for (const [x, y, h] of [[-3, cy - 16, 4.2], [-7, cy - 14.6, 3.4], [1, cy - 16.6, 3.0]]) {
      c.beginPath(); c.moveTo(x, y + 0.5); c.lineTo(x - 1.4, y - h); bStroke(c, pass, '#1c2a44', 0.6);
      dot(c, x - 1.4, y - h, 0.35); eFill(c, pass, '#c9b8ff', '#9d7dff');
    }
    const bodyPath = () => {
      c.beginPath();
      c.moveTo(17.5, cy - 5 - j * 0.6);
      c.bezierCurveTo(15.5, cy - 13, 6, cy - 17.5, -3, cy - 16);
      c.bezierCurveTo(-11, cy - 14.5, -16, cy - 8, -16.5, cy - 2);
      c.bezierCurveTo(-17, cy + 5, -12, cy + 11, -4, cy + 12);
      c.bezierCurveTo(4, cy + 13, 13, cy + 11, 17.5, cy + 6 + j * 1.2);
      c.quadraticCurveTo(21.8, cy + 4 + j * 1.2, 21.4, cy + 1.5 + j * 2.2);
      c.lineTo(8.5, cy - 0.5);
      c.closePath();
    };
    bodyPath();
    if (pass === 'full') {
      const g = c.createRadialGradient(12, cy - 9, 1, 2, cy - 2, 21);
      g.addColorStop(0, '#2a4068'); g.addColorStop(0.45, '#13213a'); g.addColorStop(1, '#070c18');
      c.fillStyle = g; c.fill();
      c.save(); bodyPath(); c.clip();
      for (let i = 0; i < 12; i++) {
        const x = rng.range(-13, 11), y = cy + rng.range(-11, 9), r = rng.range(0.8, 2.0);
        dot(c, x, y, r); c.fillStyle = 'rgba(3,6,14,0.45)'; c.fill();
      }
      c.beginPath(); c.ellipse(-1, cy + 8, 13, 4.5, 0, 0, TAU); c.fillStyle = 'rgba(70,90,150,0.16)'; c.fill();
      c.restore();
      c.beginPath(); c.moveTo(17.5, cy - 5); c.bezierCurveTo(15.5, cy - 13, 6, cy - 17.5, -3, cy - 16);
      c.bezierCurveTo(-11, cy - 14.5, -16, cy - 8, -16.5, cy - 2);
      c.strokeStyle = 'rgba(150,196,255,0.42)'; c.lineWidth = 0.75; c.stroke();
    } else {
      c.fillStyle = 'rgba(110,92,255,0.12)'; c.fill();
      c.strokeStyle = 'rgba(140,120,255,0.32)'; c.lineWidth = 1.5; c.stroke();
    }
    // mouth
    const ut = [17.5, cy - 5 - j * 0.6], mc = [8.5, cy - 0.5], lt = [21.4, cy + 1.5 + j * 2.2];
    c.beginPath(); c.moveTo(ut[0], ut[1]); c.lineTo(mc[0], mc[1]); c.lineTo(lt[0], lt[1]);
    c.quadraticCurveTo(17, cy + 1.2 + j, ut[0], ut[1]); c.closePath();
    bFill(c, pass, '#050309');
    if (pass === 'full') {
      c.beginPath(); c.moveTo(mc[0] + 1, mc[1]); c.lineTo(15, cy - 2.5 - j * 0.3); c.lineTo(16, cy + 0.8 + j);
      c.closePath(); c.fillStyle = 'rgba(70,10,40,0.6)'; c.fill();
    }
    c.beginPath(); c.moveTo(ut[0], ut[1]); c.lineTo(mc[0], mc[1]); c.lineTo(lt[0], lt[1]);
    bStroke(c, pass, 'rgba(70,96,140,0.85)', 0.5);
    for (let i = 0; i < 6; i++) {
      const t = 0.08 + (i / 5) * 0.75;
      const x = ut[0] + (mc[0] - ut[0]) * t, y = ut[1] + (mc[1] - ut[1]) * t;
      const L = 2.4 * (1 - t * 0.55);
      c.beginPath(); c.moveTo(x - 0.35, y); c.lineTo(x + 0.25, y + L); c.lineTo(x + 0.45, y); c.closePath();
      eFill(c, pass, '#dfeaf3', 'rgba(200,235,255,0.45)');
    }
    for (let i = 0; i < 6; i++) {
      const t = 0.04 + (i / 5) * 0.78;
      const x = lt[0] + (mc[0] - lt[0]) * t, y = lt[1] + (mc[1] - lt[1]) * t;
      const L = 3.3 * (1 - t * 0.6);
      c.beginPath(); c.moveTo(x - 0.4, y + 0.1); c.lineTo(x - 0.1, y - L); c.lineTo(x + 0.45, y + 0.1); c.closePath();
      eFill(c, pass, '#eef5fa', 'rgba(210,240,255,0.5)');
    }
    // eye
    dot(c, 9.6, cy - 9.2, 2.3); bFill(c, pass, '#03050a');
    dot(c, 9.8, cy - 9.2, 1.0); eFill(c, pass, '#d0fff4', '#8dffe0');
    dot(c, 9.4, cy - 9.6, 0.32); bFill(c, pass, '#ffffff');
    // lateral line photophores
    for (let i = 0; i < 9; i++) {
      const x = -12 + i * 2.3, y = cy + 2.4 + Math.sin(i * 0.6) * 0.8 - (i > 5 ? (i - 5) * 0.45 : 0);
      dot(c, x, y, 0.44); eFill(c, pass, '#d2c4ff', '#8c6bff');
    }
    // pectoral fin
    c.save(); c.translate(-2, cy + 4); c.rotate(0.5 + s * 0.35);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-3, 6, -7.4, 5.2); c.quadraticCurveTo(-5, 2, 0, 0); c.closePath();
    bFill(c, pass, 'rgba(50,70,130,0.6)');
    c.beginPath(); c.moveTo(-0.3, 0.3); c.quadraticCurveTo(-3, 6, -7.4, 5.2); eStroke(c, pass, 'rgba(170,150,255,0.5)', 0.35);
    c.restore();
    // stub of the lure rod
    c.beginPath(); c.moveTo(8.0, cy - 14.2); c.quadraticCurveTo(8.6, cy - 16.4, 9.4, cy - 17.2); bStroke(c, pass, '#22324e', 1.0);
  }

  /* ================= collectibles, projectile, orbiting jelly ================= */
  function orbSmall(c, pass) {
    if (pass !== 'full') { dot(c, 0, 0, 2.6); c.fillStyle = '#3dffbe'; c.fill(); }
    dot(c, 0, 0, 2.7); eStroke(c, pass, 'rgba(110,255,210,0.85)', 0.42);
    dot(c, 0, 0, 1.55);
    if (pass === 'full') {
      const g = c.createRadialGradient(-0.4, -0.5, 0, 0, 0, 1.6);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#bfffe8'); g.addColorStop(1, '#3fe6b0');
      c.fillStyle = g; c.fill();
    } else { c.fillStyle = '#9dffe0'; c.fill(); }
  }
  function pearlBig(c, pass) {
    if (pass !== 'full') { dot(c, 0, 0, 4.0); c.fillStyle = '#b48cff'; c.fill(); dot(c, 0, 0, 2.4); c.fillStyle = '#ffc0f0'; c.fill(); return; }
    dot(c, 0, 0, 3.3);
    const g = c.createRadialGradient(-1.1, -1.2, 0.2, 0, 0, 3.3);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#f6dcff'); g.addColorStop(0.7, '#bf92ff'); g.addColorStop(1, '#6b48b8');
    c.fillStyle = g; c.fill();
    c.beginPath(); c.arc(0, 0, 2.6, 0.4, 1.6); c.strokeStyle = 'rgba(255,190,240,0.7)'; c.lineWidth = 0.4; c.stroke();
    dot(c, -1.2, -1.3, 0.55); c.fillStyle = '#ffffff'; c.fill();
  }
  function moonJelly(c, pass, ph) {
    const a = ph * TAU, pulse = 0.5 + 0.5 * Math.cos(a);
    const rx = 3.4 + 0.8 * pulse, ry = 2.9 - 0.6 * pulse;
    for (let i = 0; i < 6; i++) {
      const x0 = (-0.8 + i * 0.32) * rx;
      c.beginPath(); c.moveTo(x0, 0.3);
      c.quadraticCurveTo(x0 + Math.sin(a + i) * 0.6, 2.4, x0 * 0.8 + Math.sin(a + i + 1) * 0.8, 4.6 + (1 - pulse));
      eStroke(c, pass, 'rgba(200,250,255,0.6)', 0.25, 'rgba(120,240,255,0.5)', 2.6);
    }
    c.beginPath(); c.moveTo(-rx, 0); c.bezierCurveTo(-rx, -ry * 1.32, rx, -ry * 1.32, rx, 0);
    c.quadraticCurveTo(0, 0.9, -rx, 0); c.closePath();
    eFill(c, pass, 'rgba(214,255,250,0.8)', 'rgba(120,240,255,0.75)');
    for (let i = 0; i < 4; i++) {
      const an = Math.PI * 0.25 + i * Math.PI * 0.5;
      c.beginPath(); c.ellipse(Math.cos(an) * rx * 0.28, -ry * 0.45 + Math.sin(an) * ry * 0.2, 0.7, 0.42, an, 0, TAU);
      eStroke(c, pass, 'rgba(120,236,255,0.95)', 0.3);
    }
    if (pass === 'full') { c.beginPath(); c.ellipse(-rx * 0.35, -ry * 0.8, rx * 0.3, ry * 0.18, -0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill(); }
  }

  /* ================= props ================= */
  const lip = (c, pass, a) => bStroke(c, pass, 'rgba(120,170,225,' + (a || 0.3) + ')', 0.4);

  function kelpDraw(c, pass, seed, sw) {
    const rng = U.rng(seed);
    const H = rng.range(50, 68), bend0 = rng.range(-7, 7), bend = bend0 + (sw || 0) * 4.5;
    for (let i = 0; i < 6; i++) {
      const ax = rng.range(-4.5, 4.5);
      c.beginPath(); c.moveTo(0, -1.2); c.quadraticCurveTo(ax * 0.5, -0.8, ax, 0.6);
      bStroke(c, pass, '#0a2321', 0.8);
    }
    const pt = (t) => {
      const u = 1 - t;
      return [2 * u * t * (-bend * 0.6) + t * t * bend, 2 * u * t * (-H * 0.5) + t * t * (-H)];
    };
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-bend * 0.6, -H * 0.5, bend, -H);
    bStroke(c, pass, '#16423a', 1.15);
    const n = rng.int(8, 11);
    for (let i = 0; i < n; i++) {
      const t = 0.1 + (i / (n - 1)) * 0.88;
      const [px, py] = pt(t);
      const side = i % 2 ? 1 : -1;
      const ang = (side > 0 ? -0.75 : -2.4) + rng.range(-0.25, 0.25) + (sw || 0) * 0.14 * t;
      const len = rng.range(10, 15) * (1 - t * 0.35), wid = rng.range(2.4, 3.4) * (1 - t * 0.3);
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
      const ex = px + dx * len, ey = py + dy * len;
      c.beginPath(); c.moveTo(px, py);
      c.bezierCurveTo(px + dx * len * 0.3 + nx * wid, py + dy * len * 0.3 + ny * wid, px + dx * len * 0.75 + nx * wid * 0.8, py + dy * len * 0.75 + ny * wid * 0.8, ex, ey);
      c.bezierCurveTo(px + dx * len * 0.7 - nx * wid * 0.7, py + dy * len * 0.7 - ny * wid * 0.7, px + dx * len * 0.25 - nx * wid * 0.9, py + dy * len * 0.25 - ny * wid * 0.9, px, py);
      c.closePath();
      if (pass === 'full') {
        const g = c.createLinearGradient(px, py, ex, ey);
        g.addColorStop(0, '#103631'); g.addColorStop(1, rng.chance(0.5) ? '#245c4c' : '#1d4d48');
        c.fillStyle = g; c.fill();
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + dx * len * 0.85, py + dy * len * 0.85);
        c.strokeStyle = 'rgba(90,190,160,0.35)'; c.lineWidth = 0.3; c.stroke();
        c.beginPath(); c.moveTo(px + nx * 0.4, py + ny * 0.4);
        c.bezierCurveTo(px + dx * len * 0.3 + nx * wid, py + dy * len * 0.3 + ny * wid, px + dx * len * 0.75 + nx * wid * 0.8, py + dy * len * 0.75 + ny * wid * 0.8, ex, ey);
        c.strokeStyle = 'rgba(130,230,200,0.2)'; c.lineWidth = 0.35; c.stroke();
      } else rng.next();
      dot(c, px + dx * 1.2, py + dy * 1.2, rng.range(0.8, 1.15)); eFill(c, pass, '#c6fff0', '#34f0c8');
      for (let k = 0; k < 3; k++) {
        const q = rng.range(0.3, 0.95), o = rng.range(-0.6, 0.6) * wid;
        dot(c, px + dx * len * q + nx * o, py + dy * len * q + ny * o, 0.22);
        eFill(c, pass, 'rgba(150,255,225,0.85)', 'rgba(52,240,200,0.8)');
      }
    }
  }

  function coralBranch(c, pass, seed) {
    const rng = U.rng(seed);
    const tips = [];
    const br = (x, y, ang, len, w, d) => {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      const cx = x + Math.cos(ang + 0.25) * len * 0.5, cy = y + Math.sin(ang + 0.25) * len * 0.5;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(cx, cy, x2, y2);
      bStroke(c, pass, d < 2 ? '#2b1a4c' : '#3f2870', w);
      c.beginPath(); c.moveTo(x - w * 0.22, y); c.quadraticCurveTo(cx - w * 0.22, cy, x2 - w * 0.18, y2);
      bStroke(c, pass, 'rgba(160,130,235,0.32)', w * 0.3);
      if (d >= 3 || len < 3) { tips.push([x2, y2, w]); return; }
      const n = rng.int(2, 3);
      for (let i = 0; i < n; i++) br(x2, y2, ang + rng.range(-0.8, 0.8), len * rng.range(0.62, 0.82), w * 0.7, d + 1);
    };
    br(0, 0, -Math.PI / 2 + rng.range(-0.12, 0.12), rng.range(9, 11), 3.0, 0);
    br(-1, 0, -Math.PI / 2 - 0.6, rng.range(6, 8), 2.2, 1);
    br(1, 0, -Math.PI / 2 + 0.6, rng.range(6, 8), 2.2, 1);
    for (const [x, y, w] of tips) {
      dot(c, x, y, Math.max(0.55, w * 0.55)); eFill(c, pass, '#ffd6f4', '#ff6fd2');
      for (let i = 0; i < 3; i++) {
        const an = rng.next() * TAU;
        dot(c, x + Math.cos(an) * 1.1, y + Math.sin(an) * 1.1, 0.2); eFill(c, pass, '#ffb8ec', '#ff6fd2');
      }
    }
  }
  function coralFan(c, pass, seed) {
    const rng = U.rng(seed);
    const tips = [];
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -5); bStroke(c, pass, '#3a1438', 2.2);
    const br = (x, y, ang, len, w, d) => {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(ang - 0.15) * len * 0.5, y + Math.sin(ang - 0.15) * len * 0.5, x2, y2);
      bStroke(c, pass, d < 2 ? '#4a1844' : '#6a2860', w);
      const polyps = Math.floor(len / 2.2);
      for (let i = 1; i <= polyps; i++) {
        const t = i / (polyps + 1);
        dot(c, x + (x2 - x) * t + rng.range(-0.3, 0.3), y + (y2 - y) * t, 0.22);
        eFill(c, pass, 'rgba(255,170,210,0.85)', 'rgba(255,110,170,0.7)');
      }
      if (d >= 4) { tips.push([x2, y2]); return; }
      br(x2, y2, ang - rng.range(0.2, 0.45), len * rng.range(0.72, 0.86), w * 0.72, d + 1);
      br(x2, y2, ang + rng.range(0.2, 0.45), len * rng.range(0.72, 0.86), w * 0.72, d + 1);
    };
    br(0, -5, -Math.PI / 2 - 0.55, 8, 1.6, 0);
    br(0, -5, -Math.PI / 2 + 0.55, 8, 1.6, 0);
    br(0, -5, -Math.PI / 2, 9, 1.6, 1);
    for (const [x, y] of tips) { dot(c, x, y, 0.5); eFill(c, pass, '#ffe0ee', '#ff7fae'); }
  }

  function tubeWorms(c, pass, seed) {
    const rng = U.rng(seed);
    c.beginPath(); c.ellipse(0, 0, 11, 3.2, 0, 0, TAU); bFill(c, pass, '#0d1622');
    const n = rng.int(7, 10);
    const tubes = [];
    for (let i = 0; i < n; i++) tubes.push({ x: rng.range(-9, 9), y: rng.range(-1.6, 1.6), h: rng.range(9, 24), lean: rng.range(-2.5, 2.5), w: rng.range(1.5, 2.2) });
    tubes.sort((p, q) => p.y - q.y);
    for (const t of tubes) {
      const x0 = t.x, y0 = t.y, x1 = t.x + t.lean, y1 = t.y - t.h;
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + t.lean * 0.2, (y0 + y1) / 2, x1, y1);
      bStroke(c, pass, '#7a8b9a', t.w);
      c.beginPath(); c.moveTo(x0 - t.w * 0.25, y0); c.quadraticCurveTo(x0 + t.lean * 0.2 - t.w * 0.25, (y0 + y1) / 2, x1 - t.w * 0.25, y1);
      bStroke(c, pass, 'rgba(215,228,238,0.55)', t.w * 0.28);
      if (pass === 'full') {
        for (let k = 2; k < t.h - 1; k += 2.6) {
          const q = k / t.h, x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q;
          c.beginPath(); c.moveTo(x - t.w * 0.5, y); c.lineTo(x + t.w * 0.5, y + 0.2);
          c.strokeStyle = 'rgba(40,52,66,0.6)'; c.lineWidth = 0.3; c.stroke();
        }
      }
      const pn = 7;
      for (let k = 0; k < pn; k++) {
        const an = -Math.PI / 2 + (k / (pn - 1) - 0.5) * 2.1;
        const L = rng.range(2.6, 3.8);
        c.beginPath(); c.moveTo(x1, y1);
        c.quadraticCurveTo(x1 + Math.cos(an) * L * 0.5, y1 + Math.sin(an) * L * 0.8, x1 + Math.cos(an) * L, y1 + Math.sin(an) * L);
        eStroke(c, pass, k % 2 ? '#ff7aa0' : '#ff9cbc', 0.45, 'rgba(255,80,140,0.8)');
      }
      dot(c, x1, y1, 0.75); eFill(c, pass, '#ffd6e2', '#ff4f8a');
    }
  }

  function boneStroke(c, pass, w) {
    bStroke(c, pass, '#2c3a48', w + 0.5);
    bStroke(c, pass, '#7d90a0', w);
  }
  function wormDots(c, pass, rng, x, y, n, sp) {
    for (let i = 0; i < n; i++) {
      dot(c, x + rng.range(-sp, sp), y + rng.range(-sp * 0.5, sp * 0.5), rng.range(0.2, 0.36));
      eFill(c, pass, '#ffb0c8', '#ff5f9a');
    }
  }
  function whaleRibs(c, pass) {
    const rng = U.rng(4401);
    const ribs = 7;
    const ribPath = (i, far) => {
      const x = -30 + i * 9.5, h = 26 - Math.abs(i - 2) * 2.4 - (i > 3 ? (i - 3) * 1.6 : 0);
      const o = far ? 2.6 : 0;
      c.beginPath(); c.moveTo(x + o, -1 - o * 0.6);
      c.bezierCurveTo(x - 4 + o, -h * 0.55 - o, x + 1 + o, -h - o * 0.5, x + 7 + o, -h * 0.82 - o * 0.4);
    };
    for (let i = 0; i < ribs; i++) { ribPath(i, true); bStroke(c, pass, '#2a3743', 2.0); bStroke(c, pass, '#5a6b7a', 1.4); }
    // spine
    for (let i = 0; i < 16; i++) {
      const x = -38 + i * 5, y = Math.sin(i * 0.35) * 0.8, w = 2.6 - Math.max(0, i - 9) * 0.18;
      c.beginPath(); c.ellipse(x, y - 1.2, w, 1.9, 0, 0, TAU);
      if (pass === 'full') {
        const g = c.createLinearGradient(0, y - 3, 0, y + 1);
        g.addColorStop(0, '#c3d2dc'); g.addColorStop(1, '#4a5a68');
        c.fillStyle = g; c.fill();
      }
      c.beginPath(); c.moveTo(x, y - 2.8); c.lineTo(x - 0.8, y - 5.4); boneStroke(c, pass, 0.9);
    }
    for (let i = 0; i < ribs; i++) {
      ribPath(i, false); boneStroke(c, pass, 1.7);
      const x = -30 + i * 9.5, h = 26 - Math.abs(i - 2) * 2.4 - (i > 3 ? (i - 3) * 1.6 : 0);
      c.beginPath(); c.moveTo(x - 0.6, -2); c.bezierCurveTo(x - 4.6, -h * 0.55, x + 0.4, -h, x + 6.6, -h * 0.84);
      bStroke(c, pass, 'rgba(225,238,246,0.6)', 0.45);
      wormDots(c, pass, rng, x - 1.6, -h * 0.5, 4, 1.4);
      if (i % 2 === 0) wormDots(c, pass, rng, x + 3, -h * 0.9, 3, 1.2);
    }
    // bacterial mats around the bones
    for (let i = 0; i < 24; i++) {
      dot(c, rng.range(-46, 40), rng.range(-1, 4), rng.range(0.25, 0.5));
      eFill(c, pass, 'rgba(210,255,250,0.8)', 'rgba(130,240,255,0.7)');
    }
  }
  function whaleSkull(c, pass) {
    const rng = U.rng(4402);
    // jaw bones
    for (const [o, col] of [[-3, '#3a4957'], [0, null]]) {
      c.beginPath(); c.moveTo(-6, -3 + o * 0.5); c.bezierCurveTo(12, -10 + o, 32, -6 + o, 44, 0 + o * 0.3);
      if (col) { bStroke(c, pass, col, 2.6); } else { boneStroke(c, pass, 2.3); c.beginPath(); c.moveTo(-6, -4); c.bezierCurveTo(12, -11, 32, -7, 44, -1); bStroke(c, pass, 'rgba(225,238,246,0.55)', 0.5); }
    }
    // skull mass
    c.beginPath(); c.moveTo(-36, 0); c.bezierCurveTo(-38, -10, -26, -17, -12, -14); c.bezierCurveTo(-2, -12, 4, -7, 2, -2);
    c.bezierCurveTo(-6, 1, -24, 2, -36, 0); c.closePath();
    if (pass === 'full') {
      const g = c.createLinearGradient(0, -16, 0, 2);
      g.addColorStop(0, '#a3b6c6'); g.addColorStop(0.45, '#5e7182'); g.addColorStop(1, '#232f3c');
      c.fillStyle = g; c.fill();
      c.strokeStyle = 'rgba(40,52,66,0.8)'; c.lineWidth = 0.5; c.stroke();
      c.beginPath(); c.ellipse(-12, -8, 3.4, 2.2, -0.2, 0, TAU); c.fillStyle = '#0c131c'; c.fill();
      c.beginPath(); c.ellipse(-25, -6, 2.4, 1.6, 0.1, 0, TAU); c.fillStyle = '#121a24'; c.fill();
      c.beginPath(); c.moveTo(-34, -4); c.bezierCurveTo(-30, -12, -20, -15, -10, -13);
      c.strokeStyle = 'rgba(230,240,248,0.5)'; c.lineWidth = 0.5; c.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const x = 14 + i * 7, y = 4 + (i % 2) * 2;
      c.beginPath(); c.ellipse(x, y - 1, 2.4, 1.7, 0.3 * i, 0, TAU);
      if (pass === 'full') { c.fillStyle = '#7a8c9b'; c.fill(); c.strokeStyle = '#33414e'; c.lineWidth = 0.4; c.stroke(); }
    }
    wormDots(c, pass, rng, -18, -12, 7, 4);
    wormDots(c, pass, rng, 20, -7, 5, 4);
    for (let i = 0; i < 20; i++) {
      dot(c, rng.range(-38, 42), rng.range(0, 5), rng.range(0.25, 0.5));
      eFill(c, pass, 'rgba(210,255,250,0.8)', 'rgba(130,240,255,0.45)');
    }
    if (pass === 'full') {
      c.beginPath(); c.moveTo(-34, -4); c.bezierCurveTo(-30, -12, -20, -15, -10, -13);
      c.strokeStyle = 'rgba(140,200,255,0.35)'; c.lineWidth = 0.9; c.stroke();
    }
  }

  function anemone(c, pass, col, seed) {
    const rng = U.rng(seed * 97 + 5);
    const tip = hot(col, 0.55);
    c.beginPath(); c.moveTo(-3.2, 0); c.quadraticCurveTo(-2.4, -3, -3.6, -6.4); c.lineTo(3.6, -6.4); c.quadraticCurveTo(2.4, -3, 3.2, 0); c.closePath();
    if (pass === 'full') {
      const g = c.createLinearGradient(-3, 0, 3, 0);
      g.addColorStop(0, '#1d1430'); g.addColorStop(0.45, '#3e2a5e'); g.addColorStop(1, '#160f26');
      c.fillStyle = g; c.fill();
    }
    const n = 18;
    const tent = (i, back) => {
      const u = i / (n - 1);
      const an = Math.PI + 0.15 + u * (Math.PI - 0.3);
      const bx = Math.cos(an) * 3.8, by = -6.6 + Math.sin(an) * 1.3 * (back ? 1 : -1);
      const L = rng.range(6.5, 9);
      const ex = bx + Math.cos(an) * L * 0.75, ey = by - L * (0.55 + 0.4 * Math.sin(u * Math.PI));
      const cx = bx + Math.cos(an) * L * 0.2, cy = by - L * 0.6;
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(cx, cy, ex, ey);
      bStroke(c, pass, back ? '#2a1d44' : '#3b2a5c', 1.0);
      const mx = (cx + ex) / 2, my = (cy + ey) / 2;
      c.beginPath(); c.moveTo(mx, my); c.quadraticCurveTo((mx + ex) / 2 + 0.2, (my + ey) / 2, ex, ey);
      eStroke(c, pass, back ? hexA(col, 0.6) : hexA(col, 0.95), 0.7, col);
      dot(c, ex, ey, 0.45); eFill(c, pass, tip, col);
    };
    for (let i = 0; i < n; i += 2) tent(i, true);
    c.beginPath(); c.ellipse(0, -6.6, 4.0, 1.4, 0, 0, TAU); eFill(c, pass, '#4a3570', hexA(col, 0.5));
    c.beginPath(); c.ellipse(0, -6.6, 1.2, 0.5, 0, 0, TAU); eFill(c, pass, tip, col);
    for (let i = 1; i < n; i += 2) tent(i, false);
  }

  function rockDraw(c, pass, v) {
    const rng = U.rng(900 + v * 13);
    const rx = v ? 15 : 21, h = v ? 17 : 14;
    const pts = [];
    const N = 11;
    for (let i = 0; i <= N; i++) {
      const t = i / N, an = Math.PI + t * Math.PI;
      const r = 1 + rng.range(-0.16, 0.12);
      pts.push([Math.cos(an) * rx * r, Math.sin(an) * h * r * (0.75 + 0.25 * Math.sin(t * Math.PI))]);
    }
    const outline = () => {
      c.beginPath(); c.moveTo(-rx, 1.5);
      for (const [x, y] of pts) c.lineTo(x, Math.min(y, 0.8));
      c.lineTo(rx, 1.5); c.quadraticCurveTo(0, 3.2, -rx, 1.5); c.closePath();
    };
    outline();
    if (pass === 'full') {
      const g = c.createLinearGradient(0, -h, 0, 2);
      g.addColorStop(0, '#314a6a'); g.addColorStop(0.4, '#17283d'); g.addColorStop(1, '#070c15');
      c.fillStyle = g; c.fill();
      c.save(); outline(); c.clip();
      for (let i = 0; i < 4; i++) {
        const x = rng.range(-rx * 0.7, rx * 0.7);
        c.beginPath(); c.moveTo(x, -h * rng.range(0.6, 1)); c.lineTo(x + rng.range(-3, 3), -h * 0.3); c.lineTo(x + rng.range(-4, 4), 2);
        c.strokeStyle = 'rgba(4,8,14,0.7)'; c.lineWidth = 0.5; c.stroke();
        c.strokeStyle = 'rgba(90,130,180,0.18)'; c.lineWidth = 0.3; c.translate(-0.5, 0); c.stroke(); c.translate(0.5, 0);
      }
      c.restore();
      c.beginPath(); c.moveTo(pts[1][0], pts[1][1]);
      for (let i = 2; i < pts.length - 1; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.strokeStyle = 'rgba(140,190,240,0.5)'; c.lineWidth = 0.6; c.stroke();
    } else { for (let i = 0; i < 16; i++) rng.next(); }
    for (let i = 0; i < 15; i++) {
      const k = rng.int(2, pts.length - 3);
      const [x, y] = pts[k];
      const bx = x * rng.range(0.7, 0.95), by = y * rng.range(0.6, 0.95);
      dot(c, bx, by, rng.range(0.6, 1.0)); bFill(c, pass, '#2c3d52');
      dot(c, bx, by, 0.28); eFill(c, pass, '#c8f8ff', '#59e8ff');
    }
    if (v === 0) {
      c.save(); c.translate(7, -6); c.rotate(0.3); c.scale(1.35, 1.35);
      c.beginPath();
      for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.1 : 3.0; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
      c.closePath(); eFill(c, pass, '#ff8fc6', 'rgba(255,90,190,0.9)');
      c.restore();
    } else {
      c.save(); c.translate(-4, -10);
      dot(c, 0, 0, 2.2); bFill(c, pass, '#120c1e');
      for (let i = 0; i < 16; i++) {
        const an = (i / 16) * TAU;
        c.beginPath(); c.moveTo(Math.cos(an) * 1.8, Math.sin(an) * 1.8); c.lineTo(Math.cos(an) * 4.4, Math.sin(an) * 4.0);
        bStroke(c, pass, '#2a1d40', 0.35);
        dot(c, Math.cos(an) * 4.4, Math.sin(an) * 4.0, 0.2); eFill(c, pass, '#d2c2ff', '#9d7dff');
      }
      c.restore();
    }
  }

  function ventDraw(c, pass) {
    const rng = U.rng(5150);
    const H = 32;
    const left = [], right = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, y = -t * H, w = 8.5 * (1 - t) + 2.4 * t;
      left.push([-w * rng.range(0.85, 1.12), y]); right.push([w * rng.range(0.85, 1.12), y]);
    }
    const outline = () => {
      c.beginPath(); c.moveTo(left[0][0], 0.5);
      for (const [x, y] of left) c.lineTo(x, y);
      for (let i = right.length - 1; i >= 0; i--) c.lineTo(right[i][0], right[i][1]);
      c.lineTo(right[0][0], 0.5); c.quadraticCurveTo(0, 2.4, left[0][0], 0.5); c.closePath();
    };
    outline();
    if (pass === 'full') {
      const g = c.createLinearGradient(-8, 0, 8, 0);
      g.addColorStop(0, '#0d0a12'); g.addColorStop(0.4, '#2c2334'); g.addColorStop(1, '#0b0810');
      c.fillStyle = g; c.fill();
      for (let i = 1; i < 10; i++) {
        const y = -i * H / 10 + rng.range(-1, 1), w = (8.5 * (1 - i / 10) + 2.4 * (i / 10));
        c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y + 1.2, w, y - 0.3);
        c.strokeStyle = 'rgba(100,82,120,0.5)'; c.lineWidth = 0.5; c.stroke();
      }
      c.beginPath(); for (const [x, y] of left) c.lineTo(x, y);
      c.strokeStyle = 'rgba(140,150,220,0.3)'; c.lineWidth = 0.45; c.stroke();
    } else { for (let i = 1; i < 10; i++) rng.next(); outline(); c.fillStyle = 'rgba(110,90,255,0.08)'; c.fill(); }
    c.beginPath(); c.ellipse(0, -H, 2.6, 0.9, 0, 0, TAU); eFill(c, pass, '#d8ccff', '#7d6bff');
    if (pass !== 'full') { dot(c, 0, -H - 1, 3.4); c.fillStyle = 'rgba(125,107,255,0.6)'; c.fill(); }
    for (let i = 0; i < 14; i++) {
      dot(c, rng.range(-6, 6), -rng.range(2, H - 3), rng.range(0.18, 0.32));
      eFill(c, pass, 'rgba(200,180,255,0.8)', 'rgba(140,110,255,0.8)');
    }
  }

  function spongeVase(c, pass) {
    const rng = U.rng(6262);
    const shape = () => {
      c.beginPath(); c.moveTo(-1.8, 0);
      c.bezierCurveTo(-3.2, -6, -5.6, -14, -4.6, -26); c.lineTo(4.6, -26);
      c.bezierCurveTo(5.6, -14, 3.2, -6, 1.8, 0); c.closePath();
    };
    shape();
    eFill(c, pass, 'rgba(110,190,225,0.22)', 'rgba(90,220,255,0.16)');
    c.save(); shape(); c.clip();
    for (let i = -12; i <= 12; i++) {
      c.beginPath(); c.moveTo(i * 1.6 - 6, 0); c.lineTo(i * 1.6 + 6, -26);
      c.moveTo(i * 1.6 + 6, 0); c.lineTo(i * 1.6 - 6, -26);
      eStroke(c, pass, 'rgba(190,245,255,0.5)', 0.22, 'rgba(120,230,255,0.4)');
    }
    for (let k = 0; k < 4; k++) {
      c.beginPath(); c.moveTo(-6, -4 - k * 6); c.quadraticCurveTo(0, -2.6 - k * 6, 6, -4 - k * 6);
      eStroke(c, pass, 'rgba(210,250,255,0.55)', 0.28, 'rgba(120,230,255,0.4)');
    }
    c.restore();
    shape(); bStroke(c, pass, 'rgba(170,235,255,0.55)', 0.4);
    c.beginPath(); c.ellipse(0, -26, 4.6, 1.3, 0, 0, TAU); eFill(c, pass, 'rgba(4,14,26,0.9)', 'rgba(90,220,255,0.2)');
    c.beginPath(); c.ellipse(0, -26, 4.6, 1.3, 0, 0, TAU); eStroke(c, pass, '#c4fdff', 0.4, '#59e8ff');
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU;
      c.beginPath(); c.moveTo(Math.cos(an) * 4.6, -26 + Math.sin(an) * 1.3); c.lineTo(Math.cos(an) * 5.4, -27.6 + Math.sin(an) * 1.3);
      eStroke(c, pass, 'rgba(200,250,255,0.7)', 0.2, 'rgba(120,230,255,0.5)');
    }
    rng.next();
  }
  function spongeBarrel(c, pass) {
    const shape = () => {
      c.beginPath(); c.moveTo(-6, 0);
      c.bezierCurveTo(-10.5, -4, -10.5, -12, -7.6, -15); c.lineTo(7.6, -15);
      c.bezierCurveTo(10.5, -12, 10.5, -4, 6, 0); c.quadraticCurveTo(0, 1.6, -6, 0); c.closePath();
    };
    shape();
    if (pass === 'full') {
      const g = c.createLinearGradient(-10, 0, 10, 0);
      g.addColorStop(0, '#1a1430'); g.addColorStop(0.45, '#3a2c60'); g.addColorStop(1, '#140f26');
      c.fillStyle = g; c.fill();
      c.save(); shape(); c.clip();
      for (let i = -5; i <= 5; i++) {
        c.beginPath(); c.moveTo(i * 1.9, 1); c.quadraticCurveTo(i * 2.5, -8, i * 1.6, -15);
        c.strokeStyle = i % 2 ? 'rgba(10,6,20,0.6)' : 'rgba(140,120,220,0.3)'; c.lineWidth = 0.6; c.stroke();
      }
      c.restore();
    } else { c.fillStyle = 'rgba(157,125,255,0.08)'; c.fill(); }
    c.beginPath(); c.ellipse(0, -15, 7.6, 2.2, 0, 0, TAU); eFill(c, pass, '#07050e', 'rgba(157,125,255,0.25)');
    c.beginPath(); c.ellipse(0, -15, 7.6, 2.2, 0, 0, TAU); eStroke(c, pass, '#d8c8ff', 0.5, '#9d7dff');
    for (let i = 0; i < 12; i++) {
      const an = (i / 12) * TAU;
      dot(c, Math.cos(an) * 7.6, -15 + Math.sin(an) * 2.2, 0.3); eFill(c, pass, '#f0e8ff', '#9d7dff');
    }
  }

  /* ================= world: abyssal sea floor ================= */
  const GS = 4, CH = 9;
  /** Ground fields at a world point: 0 rock, 1 silt, 2 ripple warp, 3/4 ripple direction, 5 macro light,
      6 ripple patches, 7 kelp forest (grid channels 7/8 hold the rock gradient instead). */
  function fieldsAt(x, y, o) {
    const wx = U.fbm(x / 260 + 3.1, y / 260 - 1.7, 611, 2) - 0.5;
    const wy = U.fbm(x / 260 - 4.2, y / 260 + 2.9, 617, 2) - 0.5;
    o[0] = U.fbm(x / 330 + wx * 1.3, y / 330 + wy * 1.3, 501, 4);
    o[1] = U.fbm(x / 640 - 3, y / 640 + 5, 733, 3);
    o[2] = U.fbm(x / 170, y / 170, 911, 3) * 7 + U.fbm(x / 46, y / 46, 917, 2) * 0.9;
    const ang = 0.45 + (U.fbm(x / 900 + 2, y / 900, 1201, 2) - 0.5) * 2.6;
    o[3] = Math.cos(ang); o[4] = Math.sin(ang);
    o[5] = U.fbm(x / 210, y / 210, 1301, 3);
    o[6] = U.fbm(x / 150 - 7, y / 150 + 3, 1511, 3);
    o[7] = U.fbm(x / 420 + 9, y / 420 - 4, 1409, 2);
  }
  const NT = 256;
  let NOISE = null;
  function initNoise() {
    NOISE = new Float32Array(NT * NT);
    for (let y = 0; y < NT; y++) for (let x = 0; x < NT; x++) NOISE[y * NT + x] = U.fbmTile(x / 32, y / 32, 8, 77, 3);
  }
  const GC = {
    sand0: [7, 16, 31], sand1: [22, 40, 66], crest: [44, 74, 110], silt0: [9, 9, 27], silt1: [26, 24, 56],
    rock0: [6, 10, 19], rock1: [31, 47, 72], rim: [84, 122, 166],
  };

  /* ---- brine pools (deterministic per 560-unit cell; also used to keep props out) ---- */
  const POOL_CELL = 560, POOL_SEED = 8123, PSQ = 0.62;
  const poolMemo = new Map();
  const tmpF = new Float32Array(CH);
  function poolAt(cx, cy) {
    const key = cx + ',' + cy;
    if (poolMemo.has(key)) return poolMemo.get(key);
    const rng = U.rng(U.hashInt(cx, cy, POOL_SEED));
    const x = (cx + 0.2 + rng.next() * 0.6) * POOL_CELL, y = (cy + 0.2 + rng.next() * 0.6) * POOL_CELL;
    let pool = null;
    if (rng.chance(0.5) && !G.nearSpawn(x, y, 180)) {
      fieldsAt(x, y, tmpF);
      if (tmpF[0] < 0.54) pool = { x, y, r: rng.range(34, 60), p1: rng.next() * TAU, p2: rng.next() * TAU, a1: rng.range(0.1, 0.2), a2: rng.range(0.05, 0.11), seed: rng.int(0, 1e6) };
    }
    if (poolMemo.size > 4000) poolMemo.clear();
    poolMemo.set(key, pool);
    return pool;
  }
  const poolR = (pl, an) => pl.r * (1 + pl.a1 * Math.sin(3 * an + pl.p1) + pl.a2 * Math.sin(5 * an + pl.p2));
  function inPool(x, y, m) {
    const cx = Math.floor(x / POOL_CELL), cy = Math.floor(y / POOL_CELL);
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const pl = poolAt(cx + i, cy + j);
      if (!pl) continue;
      const dx = x - pl.x, dy = (y - pl.y) / PSQ;
      if (Math.hypot(dx, dy) < poolR(pl, Math.atan2(dy, dx)) + m) return pl;
    }
    return null;
  }
  function poolPath(ctx, pl, dr) {
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const an = (i / 80) * TAU, r = poolR(pl, an) + dr;
      const x = pl.x + Math.cos(an) * r, y = pl.y + Math.sin(an) * r * PSQ;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function drawPool(ctx, pl) {
    const rng = U.rng(pl.seed);
    poolPath(ctx, pl, 7); ctx.fillStyle = 'rgba(3,7,14,0.5)'; ctx.fill();
    poolPath(ctx, pl, 4.5); ctx.fillStyle = '#17243a'; ctx.fill();
    for (let i = 0; i < 140; i++) {
      const an = rng.next() * TAU, r = poolR(pl, an) + rng.range(0.5, 5.5);
      const x = pl.x + Math.cos(an) * r, y = pl.y + Math.sin(an) * r * PSQ;
      const s = rng.range(0.7, 1.6);
      ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.6, an, 0, TAU);
      ctx.fillStyle = rng.chance(0.5) ? '#070b15' : '#0d1424'; ctx.fill();
      if (rng.chance(0.5)) { ctx.strokeStyle = 'rgba(80,110,150,0.55)'; ctx.lineWidth = 0.25; ctx.stroke(); }
    }
    poolPath(ctx, pl, 0);
    const g = ctx.createLinearGradient(pl.x, pl.y - pl.r * PSQ, pl.x, pl.y + pl.r * PSQ);
    g.addColorStop(0, '#0a0c22'); g.addColorStop(0.5, '#04050f'); g.addColorStop(1, '#020308');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); poolPath(ctx, pl, 0); ctx.clip();
    ctx.beginPath(); ctx.ellipse(pl.x - pl.r * 0.2, pl.y - pl.r * 0.18, pl.r * 0.7, pl.r * 0.16, -0.08, 0, TAU);
    ctx.fillStyle = 'rgba(120,100,255,0.07)'; ctx.fill();
    for (let k = 1; k <= 3; k++) {
      poolPath(ctx, pl, -k * pl.r * 0.2);
      ctx.strokeStyle = 'rgba(150,140,255,' + (0.07 - k * 0.015) + ')'; ctx.lineWidth = 0.5; ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createLinearGradient(pl.x - pl.r, 0, pl.x + pl.r, 0);
    rg.addColorStop(0, '#9d7dff'); rg.addColorStop(0.5, '#59e8ff'); rg.addColorStop(1, '#9d7dff');
    poolPath(ctx, pl, 0.3);
    ctx.strokeStyle = rg;
    ctx.globalAlpha = 0.05; ctx.lineWidth = 7; ctx.stroke();
    ctx.globalAlpha = 0.12; ctx.lineWidth = 3; ctx.stroke();
    ctx.globalAlpha = 0.55; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 46; i++) {
      const an = rng.next() * TAU, r = poolR(pl, an) + rng.range(-0.5, 3);
      const x = pl.x + Math.cos(an) * r, y = pl.y + Math.sin(an) * r * PSQ;
      ctx.fillStyle = rng.chance(0.6) ? 'rgba(200,255,250,0.7)' : 'rgba(190,170,255,0.7)';
      ctx.beginPath(); ctx.arc(x, y, rng.range(0.2, 0.42), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function* pixelsGen(ctx, info) {
    const res = info.res, PX = info.px, wx = info.wx, wy = info.wy;
    const gw = Math.ceil(info.size / GS) + 4;
    const ox = wx - GS, oy = wy - GS;
    const grid = new Float32Array(gw * gw * CH);
    const o = new Float32Array(CH);
    for (let j = 0; j < gw; j++) {
      if ((j & 7) === 7) yield;
      for (let i = 0; i < gw; i++) {
        fieldsAt(ox + i * GS, oy + j * GS, o);
        const b = (j * gw + i) * CH;
        for (let k = 0; k < 7; k++) grid[b + k] = o[k];
      }
    }
    // gradient of the rock field (for the lit lips of the terraces)
    for (let j = 0; j < gw; j++) for (let i = 0; i < gw; i++) {
      const b = (j * gw + i) * CH;
      const il = Math.max(0, i - 1), ir = Math.min(gw - 1, i + 1), jt = Math.max(0, j - 1), jb = Math.min(gw - 1, j + 1);
      grid[b + 7] = (grid[(j * gw + ir) * CH] - grid[(j * gw + il) * CH]) / ((ir - il) * GS);
      grid[b + 8] = (grid[(jb * gw + i) * CH] - grid[(jt * gw + i) * CH]) / ((jb - jt) * GS);
    }
    yield;
    const img = ctx.createImageData(PX, PX);
    const d = img.data;
    const N = NOISE, C = GC;
    // bilinear lookup of one grid channel at the current pixel (channels are only interpolated when needed)
    let o00 = 0, o10 = 0, o01 = 0, o11 = 0, w00 = 0, w10 = 0, w01 = 0, w11 = 0;
    const bl = (k) => grid[o00 + k] * w00 + grid[o10 + k] * w10 + grid[o01 + k] * w01 + grid[o11 + k] * w11;
    for (let py = 0; py < PX; py++) {
      if ((py & 15) === 15) yield;
      const y = wy + (py + 0.5) / res;
      const gyf = (y - oy) / GS, j0 = gyf | 0, fy = gyf - j0;
      const tyA = (Math.floor(y * 2) & 255) << 8, tyB = ((Math.floor(y * 0.5) + 31) & 255) << 8;
      for (let px = 0; px < PX; px++) {
        const x = wx + (px + 0.5) / res;
        const gxf = (x - ox) / GS, i0 = gxf | 0, fx = gxf - i0;
        o00 = (j0 * gw + i0) * CH; o10 = o00 + CH; o01 = o00 + gw * CH; o11 = o01 + CH;
        w00 = (1 - fx) * (1 - fy); w10 = fx * (1 - fy); w01 = (1 - fx) * fy; w11 = fx * fy;
        const R = bl(0), S = bl(1), L = bl(5);
        const g = N[tyA | (Math.floor(x * 2) & 255)], g2 = N[tyB | ((Math.floor(x * 0.5) + 97) & 255)];
        // sand
        let t = L * 2.2 - 0.62 + (g - 0.5) * 0.5 + (g2 - 0.5) * 0.7;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        let r = C.sand0[0] + (C.sand1[0] - C.sand0[0]) * t;
        let gg = C.sand0[1] + (C.sand1[1] - C.sand0[1]) * t;
        let b = C.sand0[2] + (C.sand1[2] - C.sand0[2]) * t;
        const sb = S < 0.36 ? 1 : S > 0.43 ? 0 : (0.43 - S) / 0.07;
        const amp = sstep(0.5, 0.64, bl(6)) * (1 - sb * 0.8) * (0.55 + 0.45 * t);
        if (amp > 0.01) {
          const s = Math.sin((x * bl(3) + y * bl(4)) * 0.66 + bl(2) + (g - 0.5) * 0.9);
          const cr = s > 0.55 ? (s - 0.55) * 2.22 : 0, crest = cr * cr * amp * (0.55 + 0.9 * (g2 - 0.5) + 0.45);
          const tr = s < -0.2 ? (-0.2 - s) * 1.25 * amp : 0;
          r += (C.crest[0] - r) * crest * 0.5; gg += (C.crest[1] - gg) * crest * 0.5; b += (C.crest[2] - b) * crest * 0.5;
          const dk = 1 - tr * 0.26; r *= dk; gg *= dk; b *= dk;
        }
        if (sb > 0) {
          let m = 0.4 + (g2 - 0.5) * 0.9 + (g - 0.5) * 0.35;
          m = m < 0 ? 0 : m > 1 ? 1 : m;
          r += (C.silt0[0] + (C.silt1[0] - C.silt0[0]) * m - r) * sb;
          gg += (C.silt0[1] + (C.silt1[1] - C.silt0[1]) * m - gg) * sb;
          b += (C.silt0[2] + (C.silt1[2] - C.silt0[2]) * m - b) * sb;
        }
        // terraced rock shelves
        const e = R - 0.6 + (g - 0.5) * 0.03 + (g2 - 0.5) * 0.02;
        if (e > -0.035) {
          if (e < 0) {
            const ao = 1 + e / 0.035, k = 1 - 0.6 * ao * ao;
            r *= k; gg *= k; b *= k;
          } else {
            const rm = e < 0.004 ? e / 0.004 : 1;
            const tf = fract(e * 24);
            const gxr = bl(7), gyr = bl(8), gl = Math.hypot(gxr, gyr) + 1e-7;
            const lit = (0.45 * gxr + 0.85 * gyr) / gl;
            let br = 0.32 + 0.3 * tf + (g - 0.5) * 0.5 + (g2 - 0.5) * 0.3 + Math.min(0.25, e * 2);
            if (tf < 0.16) br += (1 - tf / 0.16) * lit * 0.5;
            if (tf > 0.93) br -= 0.45;
            if (e < 0.012) br += (1 - e / 0.012) * (lit > 0 ? lit : 0) * 0.7;
            br = br < 0 ? 0 : br;
            let rr, rg, rb;
            if (br <= 1) { rr = C.rock0[0] + (C.rock1[0] - C.rock0[0]) * br; rg = C.rock0[1] + (C.rock1[1] - C.rock0[1]) * br; rb = C.rock0[2] + (C.rock1[2] - C.rock0[2]) * br; }
            else { const q = Math.min(1, br - 1); rr = C.rock1[0] + (C.rim[0] - C.rock1[0]) * q; rg = C.rock1[1] + (C.rim[1] - C.rock1[1]) * q; rb = C.rock1[2] + (C.rim[2] - C.rock1[2]) * q; }
            r += (rr - r) * rm; gg += (rg - gg) * rm; b += (rb - b) * rm;
          }
        }
        const p = (py * PX + px) * 4;
        d[p] = r; d[p + 1] = gg; d[p + 2] = b; d[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function* decalsGen(ctx, info) {
    const o = new Float32Array(CH);
    ctx.save();
    // worm and sea-cucumber trails
    G.scatter(info, 240, 2207, 60, (x, y, rng) => {
      if (!rng.chance(0.4)) return;
      fieldsAt(x, y, o);
      if (o[0] > 0.59 || inPool(x, y, 4)) return;
      let a = rng.next() * TAU, px = x, py = y;
      const n = rng.int(14, 26);
      const pts = [];
      for (let i = 0; i < n; i++) { a += rng.range(-0.35, 0.35); px += Math.cos(a) * 3.2; py += Math.sin(a) * 2.2; pts.push(px, py); }
      for (const [off, col, lw] of [[0.9, 'rgba(3,7,14,0.5)', 0.55], [-0.9, 'rgba(3,7,14,0.5)', 0.55], [0, 'rgba(60,90,130,0.22)', 0.9]]) {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i] + off * 0.3, pts[i + 1] + off);
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(off ? [0.9, 0.8] : []); ctx.stroke();
      }
      ctx.setLineDash([]);
    });
    yield;
    // pebbles, shells, burrows
    G.scatter(info, 22, 3313, 3, (x, y, rng) => {
      const r = rng.next();
      if (r > 0.42) return;
      fieldsAt(x, y, o);
      if (inPool(x, y, 6)) return;
      const onRock = o[0] > 0.6;
      if (r < 0.22) {
        const s = rng.range(0.6, 1.5);
        ctx.beginPath(); ctx.ellipse(x, y, s * 1.3, s * 0.8, rng.range(-0.4, 0.4), 0, TAU);
        ctx.fillStyle = onRock ? '#060a12' : '#070d19'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(x - s * 0.2, y - s * 0.3, s * 0.9, s * 0.4, 0, Math.PI, TAU);
        ctx.strokeStyle = 'rgba(70,104,146,0.5)'; ctx.lineWidth = 0.3; ctx.stroke();
      } else if (r < 0.3 && !onRock) {
        const s = rng.range(0.9, 1.6);
        ctx.beginPath(); ctx.ellipse(x, y, s * 1.4, s * 0.6, 0, 0, TAU); ctx.fillStyle = '#02050a'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, y + 0.3, s * 2.1, s * 1.0, 0, Math.PI * 1.05, Math.PI * 1.95);
        ctx.strokeStyle = 'rgba(46,70,104,0.6)'; ctx.lineWidth = 0.5; ctx.stroke();
        if (rng.chance(0.35)) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(52,240,200,0.35)'; ctx.beginPath(); ctx.arc(x, y - 0.3, 1.4, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(200,255,240,0.9)'; ctx.beginPath(); ctx.arc(x, y - 0.3, 0.35, 0, TAU); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }
      } else if (r < 0.36 && !onRock) {
        const s = rng.range(0.9, 1.5), an = rng.range(-0.6, 0.6);
        ctx.save(); ctx.translate(x, y); ctx.rotate(an);
        ctx.beginPath(); ctx.moveTo(-s * 1.2, 0.3); ctx.quadraticCurveTo(0, -s * 1.6, s * 1.2, 0.3); ctx.closePath();
        ctx.fillStyle = 'rgba(96,118,140,0.55)'; ctx.fill();
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(0, 0.2); ctx.lineTo(k * s * 0.8, -s * 0.8); ctx.strokeStyle = 'rgba(20,30,44,0.6)'; ctx.lineWidth = 0.18; ctx.stroke(); }
        ctx.restore();
      }
    });
    yield;
    // brittle stars and sea stars
    ctx.globalCompositeOperation = 'lighter';
    G.scatter(info, 96, 4419, 8, (x, y, rng) => {
      if (!rng.chance(0.32)) return;
      if (inPool(x, y, 6)) return;
      const brittle = rng.chance(0.6), col = brittle ? (rng.chance(0.5) ? '#ff6fd2' : '#9d7dff') : '#ff7fae';
      const rot = rng.next() * TAU, s = rng.range(2.4, 4.2);
      ctx.globalAlpha = 0.45; ctx.drawImage(poolOf(col), x - s * 2.4, y - s * 1.4, s * 4.8, s * 2.8); ctx.globalAlpha = 1;
      for (let i = 0; i < 5; i++) {
        const an = rot + (i / 5) * TAU;
        ctx.beginPath(); ctx.moveTo(x, y);
        if (brittle) {
          const bend = rng.range(-1, 1);
          ctx.bezierCurveTo(x + Math.cos(an) * s * 0.6, y + Math.sin(an) * s * 0.4, x + Math.cos(an + bend * 0.5) * s * 1.2, y + Math.sin(an + bend * 0.5) * s * 0.75, x + Math.cos(an + bend) * s * 1.7, y + Math.sin(an + bend) * s);
          ctx.strokeStyle = hexA(col, 0.55); ctx.lineWidth = 0.35;
        } else {
          ctx.lineTo(x + Math.cos(an) * s, y + Math.sin(an) * s * 0.65);
          ctx.strokeStyle = hexA(col, 0.6); ctx.lineWidth = 0.9;
        }
        ctx.stroke();
      }
      ctx.fillStyle = hexA(col, 0.85); ctx.beginPath(); ctx.arc(x, y, brittle ? 0.5 : 0.8, 0, TAU); ctx.fill();
    });
    yield;
    // glowing microbial mats: soft light pool + clustered dots
    G.scatter(info, 150, 3301, 44, (x, y, rng) => {
      if (!rng.chance(0.4)) return;
      fieldsAt(x, y, o);
      if (o[0] > 0.585 || inPool(x, y, 10)) return;
      const col = U.hex(rng.pick(['#34f0c8', '#59e8ff', '#34f0c8', '#9d7dff']));
      const R = rng.range(13, 28);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, R * 1.7);
      gr.addColorStop(0, rgba(col, 0.13)); gr.addColorStop(0.5, rgba(col, 0.05)); gr.addColorStop(1, rgba(col, 0));
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.68); ctx.translate(-x, -y);
      ctx.fillStyle = gr; ctx.fillRect(x - R * 1.7, y - R * 1.7, R * 3.4, R * 3.4);
      ctx.restore();
      const n = rng.int(30, 70), cw = U.mix(col, W3, 0.6);
      for (let i = 0; i < n; i++) {
        const a = rng.next() * TAU, dd = Math.sqrt(rng.next()) * R;
        const px = x + Math.cos(a) * dd, py = y + Math.sin(a) * dd * 0.68;
        const s = rng.range(0.22, 0.6) * (1 - (dd / R) * 0.5), al = rng.range(0.35, 0.9) * (1 - (dd / R) * 0.6);
        ctx.fillStyle = rgba(col, al * 0.25); ctx.beginPath(); ctx.arc(px, py, s * 2.6, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(cw, al); ctx.beginPath(); ctx.arc(px, py, s, 0, TAU); ctx.fill();
      }
    });
    yield;
    // fine plankton specks + barnacle glints on rock lips
    G.scatter(info, 9, 1717, 1, (x, y, rng) => {
      if (!rng.chance(0.2)) return;
      const s = rng.range(0.16, 0.38);
      ctx.fillStyle = hexA(SPARK[rng.int(0, 3)], rng.range(0.25, 0.6));
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    });
    G.scatter(info, 26, 1901, 3, (x, y, rng) => {
      if (!rng.chance(0.55)) return;
      fieldsAt(x, y, o);
      const e = o[0] - 0.6;
      if (e < 0 || e > 0.03) return;
      for (let i = 0; i < rng.int(3, 7); i++) {
        const px = x + rng.range(-3, 3), py = y + rng.range(-2, 2);
        ctx.fillStyle = 'rgba(89,232,255,0.16)'; ctx.beginPath(); ctx.arc(px, py, 0.9, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(210,250,255,0.85)'; ctx.beginPath(); ctx.arc(px, py, 0.22, 0, TAU); ctx.fill();
      }
    });
    ctx.globalCompositeOperation = 'source-over';
    yield;
    // brine pools on top
    const m = 110;
    const cx0 = Math.floor((info.wx - m) / POOL_CELL), cx1 = Math.floor((info.wx + info.size + m) / POOL_CELL);
    const cy0 = Math.floor((info.wy - m) / POOL_CELL), cy1 = Math.floor((info.wy + info.size + m) / POOL_CELL);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const pl = poolAt(cx, cy);
      if (!pl) continue;
      if (pl.x + pl.r * 1.4 < info.wx || pl.x - pl.r * 1.4 > info.wx + info.size) continue;
      if (pl.y + pl.r < info.wy || pl.y - pl.r > info.wy + info.size) continue;
      drawPool(ctx, pl);
      yield;
    }
    ctx.restore();
  }

  /* ================= runtime state ================= */
  let DIVER = null, JELLY = null, FISH = null, ANGLER = null;
  let GEMS = null, GEMB = null, HEAD = null, TAIL = null, ORB = null, PROPS = null;
  let BUB = null, SHADOW = null, PUFF = null, BEAM = null, COLUMN = null, SNOWDOT = null, BOKEH = null;
  let CAUST = null, CT = null, OVL = null, OVLkey = '';
  let SNOWDATA = null;
  let NUM = null, numCheck = 0;
  const ETYPE = {
    creeper: { pool: '#ff6fd2', poolA: 0.34, poolR: 2.3, ha: 1, z: 19, bob: 1.6, bobF: 1.4, cols: ['#ff6fd2', '#ffc2f0', '#b18cff', '#ff9ae6'] },
    ghost: { pool: '#59e8ff', poolA: 0.24, poolR: 2.6, ha: 1, z: 12, bob: 0.9, bobF: 3.1, cols: ['#59e8ff', '#c4fdff', '#34f0c8', '#9ff7ff'] },
    colossus: { pool: '#9d7dff', poolA: 0.2, poolR: 1.9, ha: 1, z: 24, bob: 1.4, bobF: 0.9, cols: ['#8dffe0', '#b49cff', '#e6fffa', '#59e8ff'] },
  };
  const BSTATE = new WeakMap();

  /* ---- damage digits (baked once the web font is there) ---- */
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
      const adv = [], xs = [];
      let W = 0;
      for (let i = 0; i < 10; i++) { const a = Math.ceil(m.measureText(String(i)).width); adv.push(a); xs.push(W); W += a + pad * 2; }
      const { c, ctx } = U.canvas(W, H);
      ctx.font = m.font; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
      for (let i = 0; i < 10; i++) {
        const x = xs[i] + pad, y = H / 2 + 2;
        ctx.filter = 'blur(7px)'; ctx.fillStyle = glow; ctx.fillText(String(i), x, y);
        ctx.filter = 'none';
        ctx.strokeStyle = edge; ctx.lineWidth = 6; ctx.strokeText(String(i), x, y);
        ctx.fillStyle = fill; ctx.fillText(String(i), x, y);
      }
      return { c, xs, adv, pad, H };
    };
    return { real, norm: mk('#e8fffb', '#34d8ff', 'rgba(2,10,22,0.9)', 700), crit: mk('#ffe2f6', '#ff4fc4', 'rgba(24,4,22,0.9)', 800) };
  }
  function digits() {
    if (NUM && NUM.real) return NUM;
    if (--numCheck <= 0) { numCheck = 20; if (fontLoaded('Exo 2')) NUM = bakeDigits("'Exo 2', sans-serif", true); }
    if (!NUM) NUM = bakeDigits("'Segoe UI', sans-serif", false);
    return NUM;
  }

  /* ---- particle helpers ---- */
  function mote(game, x, y, z, ang, spd, color, life, size, up) {
    game.addParticle({ kind: 'mote', x, y, z, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd * 0.7, vz: up === undefined ? 6 : up, grav: -9, drag: 3.2, life, size, color });
  }
  function bubble(game, x, y, z, size, life, vx) {
    game.addParticle({ kind: 'bubble', x: x + (Math.random() - 0.5) * 4, y, z, vx: vx === undefined ? (Math.random() - 0.5) * 12 : vx, vy: (Math.random() - 0.5) * 4, vz: 8 + Math.random() * 14, grav: -36, drag: 2.6, life, size });
  }
  function ring(game, x, y, z, r0, r1, color, life, sq, lw, a0) {
    game.addParticle({ kind: 'ring', x, y, z, r0, r1, color, life, sq: sq || 0.42, lw: lw || 0.9, a0: a0 || 1, drag: 0 });
  }

  /* ---- overlays (rebuilt only when the canvas size changes) ---- */
  function buildOverlay(W0, H0) {
    // depth fog + light shafts, built small and smooth, then stored ONCE at full resolution so the per-frame blit
    // needs no resampling (an upscaling blit costs ~4x more in software rasterisers)
    const W = Math.max(8, Math.round(W0 / 4)), H = Math.max(8, Math.round(H0 / 4));
    const fog = U.canvas(W, H), f = fog.ctx;
    const g = f.createRadialGradient(W / 2, H * 0.52, Math.min(W, H) * 0.26, W / 2, H * 0.52, Math.hypot(W, H) * 0.58);
    g.addColorStop(0, 'rgba(4,16,34,0)'); g.addColorStop(0.42, 'rgba(4,16,34,0.26)');
    g.addColorStop(0.78, 'rgba(3,11,24,0.68)'); g.addColorStop(1, 'rgba(1,5,12,0.9)');
    f.fillStyle = g; f.fillRect(0, 0, W, H);
    const t = f.createLinearGradient(0, 0, 0, H * 0.4);
    t.addColorStop(0, 'rgba(30,92,130,0.12)'); t.addColorStop(1, 'rgba(30,92,130,0)');
    f.fillStyle = t; f.fillRect(0, 0, W, H * 0.4);
    // light shafts from far above (baked small and blurred, drawn additively and swaying)
    const rw = W, rh = H;
    const raw = U.canvas(rw, rh), r = raw.ctx;
    const beams = [[0.18, 0.1, 0.11], [0.42, 0.07, 0.16], [0.63, 0.09, 0.09], [0.86, 0.06, 0.13]];
    for (const [cx, w, a] of beams) {
      const x0 = cx * rw, x1 = x0 - rw * 0.2, wt = w * rw, wb = wt * 2.4;
      const lg = r.createLinearGradient(0, 0, 0, rh);
      lg.addColorStop(0, 'rgba(110,210,255,' + a + ')'); lg.addColorStop(0.55, 'rgba(90,190,240,' + a * 0.35 + ')'); lg.addColorStop(1, 'rgba(90,190,240,0)');
      r.fillStyle = lg;
      r.beginPath(); r.moveTo(x0 - wt / 2, 0); r.lineTo(x0 + wt / 2, 0); r.lineTo(x1 + wb / 2, rh); r.lineTo(x1 - wb / 2, rh); r.closePath(); r.fill();
    }
    const rays = U.canvas(rw, rh);
    rays.ctx.filter = 'blur(' + Math.max(2, rw / 90) + 'px)'; rays.ctx.drawImage(raw.c, 0, 0); rays.ctx.filter = 'none';
    // static base (fog + shafts) and a work layer, both at half resolution
    const hw = Math.max(8, Math.round(W0 / 2)), hh = Math.max(8, Math.round(H0 / 2));
    const base = U.canvas(hw, hh), bc = base.ctx;
    bc.drawImage(fog.c, 0, 0, hw, hh);
    bc.globalCompositeOperation = 'lighter'; bc.globalAlpha = 0.8;
    bc.drawImage(rays.c, -hw * 0.04, 0, hw * 1.08, hh);
    return { base: base.c, layer: U.canvas(hw, hh), q: hw / W0 };
  }
  /** Caustic tiles pre-scaled to the current screen scale: the per-frame pattern fills are translation-only. */
  function causticTiles(S) {
    const mkTile = (units, rot) => {
      const n = Math.max(16, Math.round(units * S));
      const { c, ctx } = U.canvas(n, n);
      if (rot) { ctx.translate(n, 0); ctx.rotate(Math.PI / 2); }
      ctx.drawImage(CAUST.img, 0, 0, n, n);
      return { c, n, pat: null };
    };
    return { S, a: mkTile(204.8, false), b: mkTile(281.6, true) };
  }
  function buildCaustics() {
    const N = 256, cells = 5;
    const { c, ctx } = U.canvas(N, N);
    const img = ctx.createImageData(N, N), d = img.data;
    const o = {};
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      // periodic domain warp bends the straight cell edges into wavy caustic lines
      const u = x / N, w = y / N;
      const wx = u + 0.035 * Math.sin(TAU * (3 * w + 2 * u)) + 0.02 * Math.sin(TAU * 7 * w);
      const wy = w + 0.035 * Math.sin(TAU * (3 * u - 2 * w) + 1.3) + 0.02 * Math.sin(TAU * 6 * u + 0.7);
      U.worley(wx * cells, wy * cells, 313, cells, o);
      const e = o.f2 - o.f1;
      let v = 1 - sstep(0.0, 0.11, e);
      v = v * v * (0.55 + 0.45 * (1 - sstep(0.15, 0.6, o.f1)));
      const p = (y * N + x) * 4;
      d[p] = 150; d[p + 1] = 230; d[p + 2] = 255; d[p + 3] = Math.round(v * 255);
    }
    ctx.putImageData(img, 0, 0);
    const soft = U.canvas(N, N);
    soft.ctx.filter = 'blur(1.2px)';
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) soft.ctx.drawImage(c, ox, oy);
    soft.ctx.filter = 'none';
    return soft.c;
  }
  function snowLayers() {
    const L = [
      { n: 84, par: 1.06, s0: 0.3, s1: 0.75, a: 0.6, drift: 3.0, img: 0 },
      { n: 42, par: 1.32, s0: 0.65, s1: 1.25, a: 0.52, drift: 4.5, img: 0 },
      { n: 12, par: 1.95, s0: 2.6, s1: 4.6, a: 0.14, drift: 7.5, img: 1 },
    ];
    for (const l of L) {
      l.d = new Float32Array(l.n * 4);
      for (let i = 0; i < l.n; i++) {
        l.d[i * 4] = U.hash2(i, l.n, 71); l.d[i * 4 + 1] = U.hash2(i, l.n, 72);
        l.d[i * 4 + 2] = U.hash2(i, l.n, 73); l.d[i * 4 + 3] = U.hash2(i, l.n, 74);
      }
    }
    return L;
  }

  /* ================= icons ================= */
  function drawIconImpl(ctx, id, size) {
    const s = size / 96;
    ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const small = size <= 48;
    const LW = small ? 6.5 : 4.2;
    const bl = size / 8;
    const glowOn = (col, k) => { ctx.shadowColor = col; ctx.shadowBlur = bl * (k || 1); };
    const off = () => { ctx.shadowBlur = 0; };
    const line = (col, w) => {
      w = w || LW;
      glowOn(col); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); off();
      ctx.strokeStyle = hot(col, 0.65); ctx.lineWidth = w * 0.36; ctx.stroke();
    };
    const fillG = (fill, col, k) => { glowOn(col, k); ctx.fillStyle = fill; ctx.fill(); off(); };
    const orb = (x, y, r, col) => {
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, hot(col, 0.45)); g.addColorStop(1, col);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); fillG(g, col, 1.4);
    };
    const bub = (x, y, r) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
      glowOn('#59e8ff', 0.5); ctx.strokeStyle = 'rgba(200,248,255,0.9)'; ctx.lineWidth = small ? 3 : 2; ctx.stroke(); off();
      ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    };
    const trail = (x0, y0, x1, y1, col, w) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, hexA(col, 0)); g.addColorStop(1, hexA(col, 0.9));
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      glowOn(col, 0.6); ctx.strokeStyle = g; ctx.lineWidth = w; ctx.stroke(); off();
    };
    const jelly = (x, y, sc, col) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      for (let i = 0; i < 5; i++) {
        const tx = -14 + i * 7;
        ctx.beginPath(); ctx.moveTo(tx, 2); ctx.bezierCurveTo(tx - 4, 12, tx + 4, 18, tx - 1, 28);
        glowOn(col, 0.7); ctx.strokeStyle = hexA(col, 0.85); ctx.lineWidth = small ? 4 : 2.6; ctx.stroke(); off();
      }
      ctx.beginPath(); ctx.moveTo(-20, 2); ctx.bezierCurveTo(-20, -24, 20, -24, 20, 2);
      for (let i = 0; i < 5; i++) { const x0 = 20 - i * 8, x1 = 20 - (i + 1) * 8; ctx.quadraticCurveTo((x0 + x1) / 2, 6, x1, 2); }
      ctx.closePath();
      const g = ctx.createRadialGradient(-6, -12, 1, 0, -6, 24);
      g.addColorStop(0, '#fff0fc'); g.addColorStop(0.45, hot(col, 0.2)); g.addColorStop(1, hexA(col, 0.6));
      fillG(g, col, 1.3);
      ctx.strokeStyle = hot(col, 0.6); ctx.lineWidth = small ? 3 : 2; ctx.stroke();
      ctx.restore();
    };
    switch (id) {
      case 'hp-heart': {
        ctx.beginPath(); ctx.moveTo(44, 82); ctx.bezierCurveTo(18, 64, 8, 48, 12, 34); ctx.bezierCurveTo(16, 18, 38, 14, 44, 32);
        ctx.bezierCurveTo(50, 14, 72, 18, 76, 34); ctx.bezierCurveTo(80, 48, 70, 64, 44, 82); ctx.closePath();
        const g = ctx.createRadialGradient(32, 34, 2, 44, 46, 40);
        g.addColorStop(0, '#ffe6f6'); g.addColorStop(0.35, '#ff8fd8'); g.addColorStop(1, '#c02a8e');
        fillG(g, '#ff6fd2', 1.3);
        ctx.strokeStyle = '#ffd0f0'; ctx.lineWidth = small ? 3 : 2; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(28, 34, 7, 4, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
        bub(80, 20, small ? 9 : 7); if (!small) bub(88, 42, 4);
        break;
      }
      case 'kills': jelly(48, 42, small ? 1.45 : 1.25, '#ff6fd2'); break;
      case 'dmg': {
        ctx.beginPath(); ctx.moveTo(18, 80); ctx.lineTo(56, 42); line('#59e8ff', LW * 0.8);
        ctx.beginPath(); ctx.moveTo(78, 18); ctx.lineTo(50, 34); ctx.lineTo(58, 42); ctx.lineTo(62, 46); ctx.closePath();
        const g = ctx.createLinearGradient(50, 46, 78, 18); g.addColorStop(0, '#59e8ff'); g.addColorStop(1, '#ffffff');
        fillG(g, '#59e8ff', 1.4);
        ctx.beginPath(); ctx.moveTo(50, 34); ctx.lineTo(44, 34); ctx.moveTo(62, 46); ctx.lineTo(62, 52); line('#c4fdff', LW * 0.55);
        for (const [x, y, r] of [[80, 34, 3], [70, 12, 2.4], [88, 22, 2]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); fillG('#e6fffb', '#59e8ff', 0.8); }
        if (!small) { bub(26, 52, 5); bub(18, 38, 3); }
        break;
      }
      case 'rate': {
        for (let i = 0; i < 3; i++) {
          const x = 26 + i * 22, y = 70 - i * 22;
          trail(x - 26, y + 6, x, y, '#59e8ff', small ? 8 : 6);
          orb(x, y, small ? 9 : 7.5, '#59e8ff');
        }
        break;
      }
      case 'multi': {
        const src = [48, 84];
        for (const [x, y] of [[20, 26], [48, 16], [76, 26]]) { trail(src[0], src[1], x, y, '#34f0c8', small ? 7 : 5); orb(x, y, small ? 10 : 8.5, '#34f0c8'); }
        ctx.beginPath(); ctx.arc(src[0], src[1], 6, 0, TAU); fillG('#c4fdff', '#59e8ff', 1);
        break;
      }
      case 'bounce': {
        ctx.setLineDash(small ? [8, 8] : [6, 7]);
        ctx.beginPath(); ctx.moveTo(10, 80); ctx.lineTo(34, 30); ctx.lineTo(58, 70); ctx.lineTo(78, 30);
        line('#9d7dff', LW * 0.6);
        ctx.setLineDash([]);
        for (const [x, y] of [[34, 30], [58, 70]]) { ctx.beginPath(); ctx.ellipse(x, y, 11, 5, 0, 0, TAU); line('#ff6fd2', LW * 0.45); }
        orb(80, 26, small ? 10 : 8, '#59e8ff');
        break;
      }
      case 'lantern': {
        ctx.beginPath(); ctx.ellipse(48, 56, 38, 16, 0, 0, TAU); line('#59e8ff', LW * 0.4);
        ctx.beginPath(); ctx.arc(48, 56, 5, 0, TAU); fillG('#fff1c8', '#ffc46b', 1);
        jelly(74, 40, small ? 0.75 : 0.62, '#9ff7ff');
        if (!small) jelly(22, 64, 0.4, '#9ff7ff');
        break;
      }
      case 'speed': {
        ctx.beginPath(); ctx.moveTo(40, 30); ctx.lineTo(54, 30); ctx.quadraticCurveTo(80, 34, 92, 48); ctx.lineTo(90, 56);
        ctx.quadraticCurveTo(74, 60, 62, 56); ctx.quadraticCurveTo(50, 60, 38, 54); ctx.closePath();
        const g = ctx.createLinearGradient(40, 30, 92, 56); g.addColorStop(0, '#1f4d6e'); g.addColorStop(1, '#3f7fa6');
        fillG(g, '#59e8ff', 0.8);
        ctx.beginPath(); ctx.moveTo(58, 34); ctx.quadraticCurveTo(78, 38, 90, 50); line('#c4fdff', LW * 0.5);
        for (const [y, l] of [[36, 26], [46, 32], [56, 22]]) { ctx.beginPath(); ctx.moveTo(30 - l, y); ctx.lineTo(30, y); line('#34f0c8', LW * 0.45); }
        bub(22, 70, small ? 7 : 5); bub(36, 80, small ? 5 : 3.5); if (!small) bub(12, 82, 3);
        break;
      }
      case 'magnet': {
        ctx.beginPath(); ctx.moveTo(14, 64); ctx.quadraticCurveTo(48, 92, 82, 64); ctx.closePath();
        const g = ctx.createLinearGradient(0, 64, 0, 86); g.addColorStop(0, '#5a3fa0'); g.addColorStop(1, '#241a48');
        fillG(g, '#9d7dff', 0.8);
        ctx.beginPath(); ctx.moveTo(14, 60); ctx.quadraticCurveTo(48, 20, 82, 60); ctx.closePath();
        const g2 = ctx.createLinearGradient(0, 30, 0, 60); g2.addColorStop(0, '#7a5ad0'); g2.addColorStop(1, '#3a2a70');
        fillG(g2, '#9d7dff', 0.8);
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(48, 60); ctx.lineTo(48 + i * 13, 36 + Math.abs(i) * 5); ctx.strokeStyle = 'rgba(220,200,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(14, 60); ctx.quadraticCurveTo(48, 20, 82, 60); line('#d8c8ff', LW * 0.4);
        orb(48, 64, small ? 10 : 8.5, '#ff9ae6');
        for (const [x, y, r] of [[20, 18, 4], [36, 10, 3], [76, 16, 4.5], [88, 34, 3]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); fillG('#d4fff0', '#34f0c8', 1); }
        break;
      }
      case 'hp': {
        ctx.beginPath(); rrect(ctx, 28, 22, 40, 66, 18);
        const g = ctx.createLinearGradient(28, 0, 68, 0); g.addColorStop(0, '#243a4c'); g.addColorStop(0.45, '#7898ae'); g.addColorStop(1, '#243a4c');
        fillG(g, '#59e8ff', 0.6);
        ctx.beginPath(); rrect(ctx, 40, 10, 16, 12, 4); ctx.fillStyle = '#3a556a'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(48, 40); ctx.lineTo(48, 70); ctx.moveTo(33, 55); ctx.lineTo(63, 55); line('#34f0c8', LW * 1.1);
        bub(80, 30, small ? 8 : 6); bub(84, 12, small ? 5 : 4); if (!small) bub(14, 40, 4);
        break;
      }
      default: orb(48, 48, 26, '#59e8ff');
    }
  }

  /* ================= CSS – a submersible instrument panel ================= */
  const RIV = (a) => 'radial-gradient(circle at 7px 7px,rgba(170,228,255,' + a + ') 0 1.5px,transparent 2.2px),' +
    'radial-gradient(circle at calc(100% - 7px) 7px,rgba(170,228,255,' + a + ') 0 1.5px,transparent 2.2px),' +
    'radial-gradient(circle at 7px calc(100% - 7px),rgba(170,228,255,' + a + ') 0 1.5px,transparent 2.2px),' +
    'radial-gradient(circle at calc(100% - 7px) calc(100% - 7px),rgba(170,228,255,' + a + ') 0 1.5px,transparent 2.2px)';
  const PANEL = 'linear-gradient(180deg,rgba(14,40,60,.86),rgba(4,14,26,.9))';
  const CSS = `
@keyframes deepseaSweep{to{transform:rotate(360deg)}}
@keyframes deepseaBubbles{from{background-position:0 0,0 0}to{background-position:-40px 0,0 0}}
@keyframes deepseaBlip{0%,100%{opacity:.35}50%{opacity:1}}
body.style-deepsea{background:#040b18;font-family:'Comfortaa','Exo 2',system-ui,sans-serif;color:#d8f6ff}
body.style-deepsea #hud{padding:14px 24px}
body.style-deepsea #hud .xp{height:12px;border-radius:999px;overflow:visible;background:linear-gradient(180deg,rgba(2,10,20,.92),rgba(10,32,50,.88));border:1px solid rgba(120,232,255,.55);box-shadow:0 0 0 3px rgba(9,24,38,.85),0 0 0 4px rgba(120,232,255,.18),0 0 16px rgba(60,200,255,.3),inset 0 -2px 4px rgba(0,0,0,.6)}
body.style-deepsea #hud .xp-fill{border-radius:999px;background:radial-gradient(circle at 30% 50%,rgba(255,255,255,.75) 0 1.3px,transparent 1.8px) 0 0/20px 100% repeat-x,linear-gradient(90deg,#13708f,#34f0c8 62%,#c8fff2);box-shadow:0 0 10px rgba(52,240,200,.75),0 0 24px rgba(89,232,255,.35);animation:deepseaBubbles 3s linear infinite}
body.style-deepsea #hud .xp::after{content:'';position:absolute;left:16px;right:60px;top:calc(100% + 6px);height:5px;background:repeating-linear-gradient(90deg,rgba(150,232,255,.55) 0 1px,transparent 1px 2.5%),repeating-linear-gradient(90deg,rgba(150,232,255,.85) 0 1px,transparent 1px 12.5%);background-size:100% 3px,100% 5px;background-repeat:no-repeat;pointer-events:none}
body.style-deepsea #hud .lvl{right:-8px;height:26px;min-width:44px;padding:0 10px;display:flex;align-items:center;justify-content:center;border-radius:999px;background:radial-gradient(circle at 35% 30%,#24587a,#071628 72%);border:3px solid #1e3a50;box-shadow:0 0 0 1px rgba(150,240,255,.65),0 0 14px rgba(80,220,255,.5),inset 0 0 8px rgba(0,0,0,.8);font:700 12px/1 'Exo 2',sans-serif;letter-spacing:1px;color:#e2fffb;text-shadow:0 0 6px #34f0c8;z-index:2}
body.style-deepsea #hud .topline{margin-top:20px;align-items:flex-start}
body.style-deepsea #hud .hp{gap:10px;padding:8px 14px 8px 10px;border-radius:16px;background:${RIV(0.55)},${PANEL};border:1px solid rgba(110,220,255,.38);box-shadow:0 0 0 3px rgba(8,22,34,.75),0 0 18px rgba(40,170,230,.22),inset 0 1px 0 rgba(255,255,255,.1)}
body.style-deepsea #hud .hp-icon{width:30px;height:30px}
body.style-deepsea #hud .hp-bar{width:228px;height:14px;border-radius:999px;background:rgba(2,8,18,.92);border:1px solid rgba(255,140,220,.5);box-shadow:inset 0 2px 5px rgba(0,0,0,.8),0 0 10px rgba(255,90,200,.2)}
body.style-deepsea #hud .hp-fill{border-radius:999px;background:linear-gradient(90deg,#b0207a,#ff6fd2 55%,#ffc8ee);box-shadow:0 0 12px rgba(255,111,210,.8)}
body.style-deepsea #hud .hp-bar::after{content:'';position:absolute;left:6px;right:6px;top:1px;height:40%;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.4),rgba(255,255,255,0));pointer-events:none}
body.style-deepsea #hud .hp-text{font:700 14px 'Exo 2',sans-serif;letter-spacing:1px;color:#ffe4f6;text-shadow:0 0 6px #ff6fd2,0 0 14px rgba(255,111,210,.5)}
body.style-deepsea.hurt #hud .hp-bar{filter:brightness(1.7);box-shadow:0 0 22px #ff4fb4}
body.style-deepsea #hud .clock{position:relative;width:112px;height:112px;justify-content:center;border-radius:50%;margin-top:-8px;background:repeating-radial-gradient(circle,transparent 0 12px,rgba(90,232,255,.16) 12px 13px),radial-gradient(circle,rgba(10,46,66,.92),rgba(3,12,24,.94) 70%);border:2px solid rgba(110,225,255,.6);box-shadow:0 0 0 5px rgba(10,26,40,.9),0 0 0 6px rgba(120,230,255,.32),0 0 26px rgba(60,210,255,.3),inset 0 0 18px rgba(0,0,0,.85)}
body.style-deepsea #hud .clock::before{content:'';position:absolute;inset:2px;border-radius:50%;background:conic-gradient(from 0deg,rgba(52,240,200,0) 0deg,rgba(52,240,200,0) 280deg,rgba(52,240,200,.32) 352deg,rgba(210,255,245,.8) 360deg);animation:deepseaSweep 4.5s linear infinite;pointer-events:none}
body.style-deepsea #hud .clock::after{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 70% 32%,rgba(255,111,210,.95) 0 2.5px,rgba(255,111,210,.25) 3px 6px,transparent 7px),radial-gradient(circle at 28% 66%,rgba(141,255,224,.9) 0 2px,transparent 5px),linear-gradient(rgba(110,225,255,.2),rgba(110,225,255,.2)) center/1px 100% no-repeat,linear-gradient(90deg,rgba(110,225,255,.2),rgba(110,225,255,.2)) center/100% 1px no-repeat;animation:deepseaBlip 2.2s ease-in-out infinite;pointer-events:none}
body.style-deepsea #hud .clock-time{position:relative;z-index:1;font:800 25px/1 'Exo 2',sans-serif;letter-spacing:1px;color:#eafffb;text-shadow:0 0 8px #34f0c8,0 0 20px rgba(52,240,200,.55),0 2px 3px #000}
body.style-deepsea #hud .clock-label{position:absolute;top:calc(100% + 12px);left:50%;transform:translateX(-50%);white-space:nowrap;padding:3px 10px;border-radius:8px;background:rgba(4,16,28,.88);border:1px solid rgba(110,225,255,.4);font:400 10px 'Quantico',sans-serif;letter-spacing:3px;color:#8fefff;opacity:1;text-shadow:0 0 6px rgba(89,232,255,.7)}
body.style-deepsea #hud .kills{min-width:0;gap:10px;padding:6px 16px 6px 10px;border-radius:16px;background:${RIV(0.55)},${PANEL};border:1px solid rgba(110,220,255,.38);box-shadow:0 0 0 3px rgba(8,22,34,.75),0 0 18px rgba(40,170,230,.22),inset 0 1px 0 rgba(255,255,255,.1);font:800 24px 'Exo 2',sans-serif;color:#ffe8f8;text-shadow:0 0 8px #ff6fd2,0 0 18px rgba(255,111,210,.5)}
body.style-deepsea #hud .kills-icon{width:32px;height:32px}
body.style-deepsea #stylebar{background:${PANEL};border:1px solid rgba(120,232,255,.45);border-radius:999px;box-shadow:0 0 0 3px rgba(8,22,34,.7),0 0 18px rgba(60,200,255,.25),inset 0 1px 0 rgba(255,255,255,.14);font:400 13px 'Comfortaa',sans-serif;color:#cdefff;padding:8px 20px}
body.style-deepsea #stylebar .style-family{font:400 10px 'Quantico',sans-serif;letter-spacing:3px;color:#6fe6ff;opacity:1}
body.style-deepsea #stylebar .style-name{font:700 17px 'Exo 2',sans-serif;letter-spacing:.5px;color:#f0fffd;text-shadow:0 0 8px #34f0c8,0 0 18px rgba(52,240,200,.5)}
body.style-deepsea #stylemenu{background:rgba(3,12,24,.95);border:1px solid rgba(120,232,255,.4);border-radius:18px;box-shadow:0 0 24px rgba(60,200,255,.25)}
body.style-deepsea #stylemenu .sm-item{border-radius:12px}
body.style-deepsea #stylemenu .sm-item.active{border-color:#34f0c8;box-shadow:0 0 10px rgba(52,240,200,.4)}
body.style-deepsea #levelup{background:radial-gradient(ellipse at 50% 46%,rgba(14,60,90,.55),rgba(3,12,26,.7) 32%,rgba(2,8,18,.42) 100%);overflow:hidden;gap:26px}
body.style-deepsea #levelup::before{content:'';position:absolute;inset:0;background:repeating-radial-gradient(circle at 50% 46%,transparent 0 58px,rgba(90,232,255,.06) 58px 60px);pointer-events:none;z-index:-1}
body.style-deepsea #levelup .lu-title{font:800 54px/1 'Exo 2',sans-serif;letter-spacing:.08em;color:#e2fffb;text-shadow:0 0 10px #34f0c8,0 0 30px rgba(52,240,200,.6),0 0 60px rgba(89,232,255,.35)}
body.style-deepsea #levelup .lu-cards{gap:30px}
body.style-deepsea #levelup .card{width:222px;min-height:274px;padding:24px 18px 20px;border-radius:26px;background:${RIV(0.6)},radial-gradient(ellipse at 50% 0%,rgba(50,140,180,.3),transparent 60%),linear-gradient(180deg,rgba(10,34,52,.93),rgba(3,11,22,.96));border:1px solid rgba(120,232,255,.5);box-shadow:0 0 0 5px rgba(10,26,40,.92),0 0 0 6px rgba(120,232,255,.22),0 0 26px rgba(60,210,255,.22),inset 0 0 30px rgba(60,200,255,.1);transition:transform .16s,box-shadow .16s,border-color .16s}
body.style-deepsea #levelup .card::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.06) 42%,rgba(140,240,255,.04) 50%,transparent 60%)}
body.style-deepsea #levelup .card:hover{transform:translateY(-8px);border-color:#ff9ae6;box-shadow:0 0 0 5px rgba(10,26,40,.92),0 0 0 6px rgba(255,154,230,.35),0 0 32px rgba(255,111,210,.35),inset 0 0 30px rgba(255,111,210,.12)}
body.style-deepsea #levelup .card-icon{width:104px;height:104px;border-radius:50%;background:radial-gradient(circle at 50% 45%,rgba(30,90,120,.55),rgba(3,12,24,.95) 70%);border:4px solid #1d3a50;box-shadow:0 0 0 1px rgba(150,240,255,.6),0 0 16px rgba(80,220,255,.35),inset 0 0 14px rgba(0,0,0,.8)}
body.style-deepsea #levelup .card-name{font:700 15px 'Quantico',sans-serif;text-transform:uppercase;letter-spacing:1.5px;color:#e6fffb;text-shadow:0 0 8px rgba(52,240,200,.6)}
body.style-deepsea #levelup .card-desc{font:600 14px/1.45 'Comfortaa',sans-serif;color:#9fdcf0;opacity:1}
body.style-deepsea #levelup .card-key{top:12px;left:14px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:50%;font:700 11px 'Exo 2',sans-serif;color:#ffd6f4;opacity:1;border:1px solid rgba(255,154,230,.6);box-shadow:0 0 8px rgba(255,111,210,.4)}
body.style-deepsea #levelup .lu-hint{font:400 11px 'Quantico',sans-serif;letter-spacing:4px;color:#8fefff;opacity:.95;text-shadow:0 0 6px rgba(89,232,255,.6)}
body.style-deepsea #gameover{background:radial-gradient(ellipse at 50% 45%,rgba(40,14,60,.6),rgba(2,6,14,.94) 70%)}
body.style-deepsea #gameover .go-title{font:800 54px 'Exo 2',sans-serif;letter-spacing:.06em;color:#ffc8ee;text-shadow:0 0 10px #ff6fd2,0 0 30px rgba(255,111,210,.6)}
body.style-deepsea #gameover .go-stats{font:600 16px 'Comfortaa',sans-serif;color:#cdefff;text-shadow:0 0 6px rgba(89,232,255,.5)}
body.style-deepsea #gameover .go-hint{font:400 12px 'Quantico',sans-serif;letter-spacing:4px;color:#8fefff}
body.style-deepsea #pausebox{font:800 50px 'Exo 2',sans-serif;letter-spacing:.1em;color:#e2fffb;text-shadow:0 0 12px #34f0c8,0 0 34px rgba(52,240,200,.6)}
`;

  /* ================= style ================= */
  Styles.register({
    id: 'deepsea',
    name: 'Deep Sea Glow',
    family: 'Underwater · Bioluminescent',
    description: 'The abyssal sea floor at night: navy sand ripples, rock shelves, kelp, coral and whale bones, lit only by living light – glowing creatures, drifting marine snow and depth fog.',
    groundColor: '#040b18',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Exo+2:wght@400;600;700;800', 'Quantico:wght@400;700', 'Comfortaa:wght@400;600;700'],
    css: CSS,

    init() {
      initNoise();
      DIVER = { walk: [], idle: null, dash: null };
      for (let i = 0; i < 8; i++) DIVER.walk.push(charSprite(16, 40, 18, 7, (c, p) => diverPose(c, p, i / 8, 'walk')));
      DIVER.idle = charSprite(16, 40, 18, 7, (c, p) => diverPose(c, p, 0, 'idle'));
      DIVER.dash = charSprite(24, 42, 36, 10, (c, p) => diverPose(c, p, 0, 'dash'));
      JELLY = [];
      // creatures: the floor light pool under each one is baked into its sprite (one drawImage per creature)
      for (let i = 0; i < 8; i++) JELLY.push(charSprite(22, 34, 22, 10, (c, p) => jellyPose(c, p, i / 8), { glowA: 1.1, merge: 1, pool: [P.pink, 20.7, 0.3] }));
      FISH = [];
      for (let i = 0; i < 6; i++) FISH.push(charSprite(20, 24, 20, 9, (c, p) => lanternPose(c, p, i / 6), { wide: 2.6, glowA: 1.15, merge: 1, pool: [P.cyan, 18.2, 0.22] }));
      ANGLER = [];
      for (let i = 0; i < 8; i++) ANGLER.push(charSprite(34, 50, 34, 15, (c, p) => anglerPose(c, p, i / 8), { wide: 3.4, merge: 1, pool: [P.violet, 32, 0.18] }));
      // collectibles: floating orb + halo + floor pool in one sprite (origin = floor point)
      GEMS = propSprite(8, 12, 8, 4, (c, p) => { c.translate(0, -4.5); orbSmall(c, p); }, { k: 6, wide: 1.8, tight: 0.5, glowA: 1.0, pool: [P.teal, 6.5, 0.4] });
      GEMB = propSprite(11, 16, 11, 5, (c, p) => { c.translate(0, -6.5); pearlBig(c, p); }, { k: 6, wide: 2.4, tight: 0.6, glowA: 0.8, pool: [P.violet, 10, 0.4] });
      HEAD = bake(7, 7, 7, 7, (c, pass) => {
        if (pass !== 'full') { dot(c, 0, 0, 2.8); c.fillStyle = '#59e8ff'; c.fill(); return; }
        dot(c, 0, 0, 2.0);
        const g = c.createRadialGradient(-0.3, -0.3, 0, 0, 0, 2.0);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#d4feff'); g.addColorStop(1, '#59e8ff');
        c.fillStyle = g; c.fill();
      }, { k: 6, wide: 1.6, tight: 0.5, glowA: 1.4 });
      TAIL = (() => {
        const len = 22, wid = 3.0, k = K;
        const w = Math.ceil((len + 4) * k), h = Math.ceil((wid + 6) * k);
        const base = U.canvas(w, h), g = base.ctx;
        const cy = h / 2, x1 = w - 2 * k;
        let gr = g.createLinearGradient(0, 0, x1, 0);
        gr.addColorStop(0, 'rgba(40,160,255,0)'); gr.addColorStop(0.6, 'rgba(60,200,255,0.32)'); gr.addColorStop(1, 'rgba(170,250,255,0.9)');
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(0, cy); g.quadraticCurveTo(x1 * 0.6, cy - (wid * k) / 2, x1, cy - (wid * k) / 2.2);
        g.quadraticCurveTo(x1 + k, cy, x1, cy + (wid * k) / 2.2); g.quadraticCurveTo(x1 * 0.6, cy + (wid * k) / 2, 0, cy); g.fill();
        const out = U.canvas(w, h);
        out.ctx.filter = 'blur(' + k * 1.1 + 'px)'; out.ctx.drawImage(base.c, 0, 0);
        out.ctx.filter = 'none'; out.ctx.globalAlpha = 0.6; out.ctx.drawImage(base.c, 0, 0);
        return { img: out.c, w: w / k, h: h / k, ax: x1 / w };
      })();
      ORB = [];
      for (let i = 0; i < 4; i++) ORB.push(bake(8, 8, 8, 10, (c, p) => moonJelly(c, p, i / 4), { k: 6, wide: 2.2, tight: 0.6, glowA: 1.3 }));
      PROPS = {
        kelp: [11, 23, 37].map((sd) => {
          // 8 baked sway frames: the stalk really bends (no runtime transform)
          const fr = [];
          for (let i = 0; i < 8; i++) fr.push(propSprite(26, 80, 26, 8, (c, p) => kelpDraw(c, p, sd, Math.sin((i / 8) * TAU)), { pool: [P.teal, 12, 0.2], wide: 2.6 }));
          return Object.assign({}, fr[0], { frames: fr });
        }),
        coral: [
          propSprite(24, 42, 24, 8, (c, p) => coralBranch(c, p, 5), { pool: [P.pink, 15, 0.26], wide: 2.4 }),
          propSprite(26, 46, 26, 8, (c, p) => coralFan(c, p, 9), { pool: [P.rose, 16, 0.24], wide: 2.4 }),
        ],
        tubeWorms: [3, 8].map((sd) => Object.assign(propSprite(20, 36, 20, 8, (c, p) => tubeWorms(c, p, sd), { pool: [P.rose, 15, 0.3], wide: 2.4 }), { spot: [0, -17, 12, P.rose] })),
        whaleFall: [
          propSprite(56, 40, 52, 10, whaleRibs, { pool: [P.aqua, 46, 0.12], wide: 3 }),
          propSprite(46, 28, 52, 10, whaleSkull, { pool: [P.aqua, 44, 0.12], wide: 3 }),
        ],
        anemone: [P.cyan, P.violet, P.pink].map((col, i) => Object.assign(propSprite(18, 30, 18, 8, (c, p) => anemone(c, p, col, i + 1), { pool: [col, 12, 0.32], wide: 2.6 }), { spot: [0, -12, 11, col] })),
        rock: [0, 1].map((v) => propSprite(26, 26, 26, 8, (c, p) => rockDraw(c, p, v), { pool: [P.cyan, 14, 0.1], wide: 2.2 })),
        vent: [Object.assign(propSprite(18, 46, 18, 8, ventDraw, { pool: [P.violet, 16, 0.3], wide: 3.2 }), { spot: [0, -33, 6, P.violet] })],
        glassSponge: [
          propSprite(14, 40, 14, 8, spongeVase, { pool: [P.cyan, 12, 0.24], wide: 2.4 }),
          propSprite(18, 28, 18, 8, spongeBarrel, { pool: [P.violet, 13, 0.26], wide: 2.4 }),
        ],
      };
      BUB = U.sprite(32, 32, (ctx) => {
        const g = ctx.createRadialGradient(16, 16, 8, 16, 16, 15);
        g.addColorStop(0, 'rgba(160,240,255,0)'); g.addColorStop(0.75, 'rgba(170,240,255,0.32)'); g.addColorStop(1, 'rgba(200,250,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(16, 16, 15, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(215,250,255,0.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(16, 16, 12.5, 0, TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.ellipse(11.5, 11, 3, 2, -0.6, 0, TAU); ctx.fill();
      });
      SHADOW = U.sprite(64, 64, (ctx) => {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(0,2,6,0.9)'); g.addColorStop(0.5, 'rgba(0,2,6,0.5)'); g.addColorStop(1, 'rgba(0,2,6,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      });
      PUFF = U.sprite(64, 64, (ctx) => {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(6,6,12,0.85)'); g.addColorStop(0.55, 'rgba(10,10,20,0.4)'); g.addColorStop(1, 'rgba(10,10,20,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      });
      BEAM = (() => {
        const w = 256, h = 96;
        const raw = U.canvas(w, h), g = raw.ctx;
        const lg = g.createLinearGradient(0, 0, w, 0);
        lg.addColorStop(0, 'rgba(255,236,190,0.75)'); lg.addColorStop(0.35, 'rgba(255,226,170,0.28)'); lg.addColorStop(1, 'rgba(255,220,160,0)');
        g.fillStyle = lg;
        g.beginPath(); g.moveTo(4, h / 2 - 3); g.lineTo(w, 6); g.lineTo(w, h - 6); g.lineTo(4, h / 2 + 3); g.closePath(); g.fill();
        const out = U.canvas(w, h);
        out.ctx.filter = 'blur(7px)'; out.ctx.drawImage(raw.c, 0, 0); out.ctx.filter = 'none';
        return out.c;
      })();
      COLUMN = U.sprite(32, 256, (ctx) => {
        const g = ctx.createLinearGradient(0, 256, 0, 0);
        g.addColorStop(0, 'rgba(120,255,225,0.85)'); g.addColorStop(0.6, 'rgba(89,232,255,0.25)'); g.addColorStop(1, 'rgba(89,232,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 256);
        ctx.globalCompositeOperation = 'destination-in';
        const hg = ctx.createLinearGradient(0, 0, 32, 0);
        hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.5, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hg; ctx.fillRect(0, 0, 32, 256);
      });
      SNOWDOT = U.sprite(16, 16, (ctx) => {
        const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        g.addColorStop(0, 'rgba(225,245,255,1)'); g.addColorStop(0.35, 'rgba(170,215,240,0.55)'); g.addColorStop(1, 'rgba(150,200,230,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 16);
      });
      BOKEH = U.sprite(48, 48, (ctx) => {
        const g = ctx.createRadialGradient(24, 24, 0, 24, 24, 23);
        g.addColorStop(0, 'rgba(170,220,245,0.35)'); g.addColorStop(0.75, 'rgba(180,228,250,0.5)'); g.addColorStop(0.9, 'rgba(200,236,255,0.6)'); g.addColorStop(1, 'rgba(200,236,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(24, 24, 23, 0, TAU); ctx.fill();
      });
      CAUST = { img: buildCaustics(), pat: null };
      SNOWDATA = snowLayers();
      for (const col of SPARK.concat([P.aqua, P.mint, P.lampGlow, '#ffc2f0', '#b18cff', '#c4fdff', '#ff9ae6', '#9ff7ff', '#b49cff', '#e6fffa', '#ff4f8a'])) { glowOf(col); poolOf(col); }
      if (document.fonts && document.fonts.load) { try { document.fonts.load("700 40px 'Exo 2'").catch(() => {}); } catch (e) { /* ignore */ } }
    },

    *renderGroundChunk(ctx, info) {
      yield* pixelsGen(ctx, info);
      yield;
      yield* decalsGen(ctx, info);
    },

    propsForChunk(info) {
      const out = [];
      const o = new Float32Array(CH);
      G.scatterOwned(info, 80, 6161, (x, y, rng) => {
        if (!rng.chance(0.5) || G.nearSpawn(x, y, 95)) return;
        fieldsAt(x, y, o);
        if (inPool(x, y, 16)) return;
        const rock = o[0] > 0.6, silt = o[1] < 0.4, forest = o[7] > 0.58;
        const r = rng.next();
        let t;
        if (rock) t = r < 0.3 ? 'coral' : r < 0.55 ? 'rock' : r < 0.72 ? 'anemone' : r < 0.86 ? 'glassSponge' : 'vent';
        else if (forest) t = r < 0.74 ? 'kelp' : r < 0.88 ? 'anemone' : 'rock';
        else if (silt) t = r < 0.2 ? 'whaleFall' : r < 0.4 ? 'tubeWorms' : r < 0.55 ? 'vent' : r < 0.75 ? 'glassSponge' : r < 0.88 ? 'anemone' : 'kelp';
        else t = r < 0.18 ? 'kelp' : r < 0.36 ? 'coral' : r < 0.52 ? 'anemone' : r < 0.64 ? 'tubeWorms' : r < 0.74 ? 'glassSponge' : r < 0.84 ? 'rock' : r < 0.9 ? 'whaleFall' : 'vent';
        const add = (px, py, type) => {
          if (G.nearSpawn(px, py, 95)) return;
          const set = PROPS[type];
          out.push({ x: px, y: py, type, v: rng.int(0, set.length - 1), ph: rng.next() * TAU, pad: type === 'whaleFall' ? 130 : 95 });
        };
        add(x, y, t);
        if (t === 'kelp') {
          const n = forest ? rng.int(1, 4) : rng.int(0, 1);
          for (let i = 0; i < n; i++) add(x + rng.range(-24, 24), y + rng.range(-14, 14), 'kelp');
        } else if (t === 'tubeWorms' && rng.chance(0.5)) add(x + rng.range(10, 18) * rng.sign(), y + rng.range(-6, 6), 'tubeWorms');
        else if (t === 'vent' && rng.chance(0.65)) add(x + rng.range(12, 20) * rng.sign(), y + rng.range(2, 8), 'tubeWorms');
        else if (t === 'anemone' && rng.chance(0.4)) add(x + rng.range(8, 14) * rng.sign(), y + rng.range(-5, 5), 'anemone');
      });
      return out;
    },

    drawProp(ctx, pr, view) {
      haloFor(view);
      const set = PROPS[pr.type];
      if (!set) return;
      const s = set[pr.v] || set[0];
      const rt = view.rt;
      if (pr.type === 'kelp') {
        const f = Math.floor((rt * 0.13 + pr.ph / TAU) * 8);
        const fs = s.frames[((f % 8) + 8) % 8];
        blit(ctx, fs, fs.img, pr.x, pr.y);
      } else if (pr.type === 'anemone') {
        // a gentle shear around the base (small sprite)
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.transform(1, 0, Math.sin(rt * 1.2 + pr.ph) * 0.05, 1 + Math.sin(rt * 1.6 + pr.ph) * 0.03, 0, 0);
        blit(ctx, s, s.img, 0, 0);
        ctx.restore();
      } else blit(ctx, s, s.img, pr.x, pr.y);
      // living light: a small pulsing glow spot instead of re-drawing the whole halo
      if (s.spot && haloK > 0.5) {
        const [sx, sy, r, col] = s.spot;
        const q = pr.type === 'vent' ? 0.5 + 0.5 * Math.sin(rt * 5 + pr.ph) * Math.sin(rt * 2.3) : 0.5 + 0.5 * Math.sin(rt * 1.6 + pr.ph);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.12 + 0.3 * q;
        ctx.drawImage(poolOf(col), pr.x + sx - r, pr.y + sy - r, r * 2, r * 2);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      if (pr.type === 'vent') {
        const top = pr.y - 32;
        for (let i = 0; i < 5; i++) {
          const k = fract(rt * 0.22 + i / 5 + pr.ph);
          const r = 2.5 + k * 8;
          ctx.globalAlpha = (1 - k) * Math.min(1, k * 6) * 0.5;
          ctx.drawImage(PUFF, pr.x - r + Math.sin(k * 5 + i) * 2 + k * 6, top - k * 34 - r, r * 2, r * 2);
        }
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
          const k = fract(rt * 0.45 + i * 0.27 + pr.ph * 0.3);
          const r = 0.6 + (i % 2) * 0.4;
          ctx.globalAlpha = (1 - k) * 0.85;
          ctx.drawImage(BUB, pr.x + Math.sin(k * 14 + i * 2) * 1.4 + (i - 1.5) * 1.2 - r, top - 2 - k * 42 - r, r * 2, r * 2);
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    },

    drawShadow(ctx, o, view) {
      if (o.kind === 'prop') return;
      if (o.kind === 'player') {
        const f = o.facing < 0 ? -1 : 1;
        ctx.globalAlpha = 0.5; ctx.drawImage(SHADOW, o.x - 8, o.y - 2.6, 16, 5.2);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.4; ctx.drawImage(poolOf(P.cyan), o.x - 19, o.y - 7.5, 38, 15);
        const fl = 0.92 + 0.08 * Math.sin(view.rt * 13) * Math.sin(view.rt * 7.3);
        const dash = o.dashT > 0;
        ctx.globalAlpha = 0.42 * fl;
        ctx.drawImage(poolOf(P.lampGlow), o.x + f * (dash ? 42 : 34) - 30, o.y - 11, 60, 22);
        ctx.globalAlpha = 0.25 * fl;
        ctx.drawImage(glowOf(P.lamp), o.x + f * (dash ? 40 : 32) - 12, o.y - 4, 24, 8);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        return;
      }
      const T = ETYPE[o.type];
      if (!T) return;
      let a = 1;
      if (o.dying) a = 1 - o.deathT; else if (o.spawnT < 1) a = o.spawnT;
      if (a <= 0) return;
      if (o.type === 'colossus') {
        ctx.globalAlpha = 0.3 * a;
        ctx.drawImage(SHADOW, o.x - 15, o.y - 4.5, 30, 9);
      }
      ctx.globalCompositeOperation = 'lighter';
      if (o.type === 'colossus') {
        const f = o.facing < 0 ? -1 : 1;
        const lx = o.x + f * (22 + Math.sin(view.rt * 1.3 + o.seed * 9) * 1.6);
        ctx.globalAlpha = a * (0.34 + 0.08 * Math.sin(view.rt * 3 + o.seed * 5));
        ctx.drawImage(poolOf(P.mint), lx - 22, o.y - 9, 44, 18);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    },

    drawGroundOverlay(ctx, view) {
      // short living light pulses on the sea floor
      const cell = 46, rt = view.rt;
      const x0 = Math.floor(view.x0 / cell) - 1, x1 = Math.floor(view.x1 / cell) + 1;
      const y0 = Math.floor(view.y0 / cell) - 1, y1 = Math.floor(view.y1 / cell) + 1;
      ctx.globalCompositeOperation = 'lighter';
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
        const h = U.hashInt(cx, cy, 9137);
        if ((h & 255) > 110) continue;
        const hx = ((h >>> 8) & 255) / 255, hy = ((h >>> 16) & 255) / 255, hp = (h >>> 24) / 255;
        const per = 2.6 + hp * 4;
        const ph = fract(rt / per + hp * 7.3);
        if (ph > 0.3) continue;
        const k = Math.sin((ph / 0.3) * Math.PI);
        const sz = 2.2 + hp * 3.4;
        const x = (cx + hx) * cell, y = (cy + hy) * cell;
        ctx.globalAlpha = k * 0.85;
        ctx.drawImage(glowOf(SPARK[(h >>> 4) & 3]), x - sz, y - sz * 0.6, sz * 2, sz * 1.2);
        if (hp > 0.6) {
          ctx.globalAlpha = k * 0.35;
          ctx.drawImage(poolOf(SPARK[(h >>> 4) & 3]), x - sz * 3, y - sz * 1.4, sz * 6, sz * 2.8);
        }
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    },

    drawGem(ctx, g, view) {
      haloFor(view);
      const rt = view.rt;
      const bob = Math.sin(rt * 2.4 + g.seed * 12) * 0.9;
      const pop = g.pop > 0 ? Math.sin(g.pop * Math.PI) * 5 : 0;
      const s = g.big ? GEMB : GEMS;
      const y = g.y + bob - pop;
      if (g.fly) {
        const sp = Math.hypot(g.vx, g.vy) || 1;
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3;
        blit(ctx, s, s.img, g.x - (g.vx / sp) * 4, y - (g.vy / sp) * 4);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 0.82 + 0.18 * Math.sin(rt * 4 + g.seed * 20);
      blit(ctx, s, s.img, g.x, y);
      ctx.globalAlpha = 1;
      if (g.big) {
        const a = rt * 1.6 + g.seed * 6, L = 2.2 + Math.sin(rt * 3 + g.seed * 9) * 0.8;
        ctx.save(); ctx.translate(g.x + 1.8, y - 8.7); ctx.rotate(a * 0.3);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,235,255,0.85)'; ctx.lineWidth = 0.3;
        ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L, 0); ctx.moveTo(0, -L); ctx.lineTo(0, L); ctx.stroke();
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
      }
    },

    drawEnemy(ctx, e, view) {
      haloFor(view);
      const T = ETYPE[e.type] || ETYPE.creeper;
      const rt = view.rt;
      let frames, fi;
      if (e.type === 'ghost') { frames = FISH; fi = Math.floor((rt * 2.4 + e.seed * 5) * 6); }
      else if (e.type === 'colossus') { frames = ANGLER; fi = Math.floor((e.anim * 0.18 + rt * 0.3 + e.seed) * 8); }
      else { frames = JELLY; fi = Math.floor((rt * 0.85 + e.seed * 7) * 8); }
      const n = frames.length;
      fi = ((fi % n) + n) % n;
      const side = e.facing < 0 ? 1 : 0;
      const s = frames[fi][side];
      const bob = Math.sin(rt * T.bobF + e.seed * 9) * T.bob;
      const x = e.x, y = e.y + bob;
      if (e.dying) {
        const t = U.clamp(e.deathT, 0, 1);
        const sc = 1 + t * 0.3, yy = y - t * 6;
        drawLit(ctx, s, x, yy, Math.pow(1 - t, 1.8), (1 - t) * 1.4, sc, sc);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.max(0, 0.85 - t * 1.3);
        blit(ctx, s, s.flash, x, yy, sc, sc);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        return;
      }
      let a = 1, ha = T.ha;
      if (e.spawnT < 1) {
        const k = e.spawnT;
        a = k * k; ha = T.ha * Math.min(1, k * 1.8);
        const rr = e.r * (2.6 - 1.6 * k);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = T.pool; ctx.globalAlpha = (1 - k) * 0.6; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, rr, rr * 0.42, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = (1 - k) * 0.18; ctx.lineWidth = 3; ctx.stroke();
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      if (e.type === 'ghost' && a >= 1) {
        const sp = Math.hypot(e.vx, e.vy);
        if (sp > 10) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.22; blit(ctx, s, s.img, x - e.vx * 0.06, y - e.vy * 0.06);
          ctx.globalAlpha = 0.1; blit(ctx, s, s.img, x - e.vx * 0.13, y - e.vy * 0.13);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
      }
      drawLit(ctx, s, x, y, a, ha);
      if (e.type === 'colossus') {
        // the lure: rod from the forehead, glowing bulb swaying in front of the jaws
        const f = e.facing < 0 ? -1 : 1;
        const bx = x + f * 9.4, by = y + ANG_CY - 17.2;
        const lx = x + f * (22 + Math.sin(rt * 1.3 + e.seed * 9) * 1.6), ly = y - 43 + Math.sin(rt * 2.1 + e.seed * 4) * 1.3;
        const cx = x + f * 15, cy = y - 54;
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(cx, cy, lx, ly);
        ctx.strokeStyle = '#1d2c48'; ctx.lineWidth = 0.9; ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(150,220,255,0.35)'; ctx.lineWidth = 0.4; ctx.stroke();
        const pulse = 0.85 + 0.15 * Math.sin(rt * 3 + e.seed * 5);
        ctx.globalAlpha = a * 0.55 * pulse; ctx.drawImage(poolOf(P.mint), lx - 15, ly - 15, 30, 30);
        ctx.globalAlpha = a * pulse; ctx.drawImage(glowOf(P.mint), lx - 5.5, ly - 5.5, 11, 11);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      if (e.flash > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(0.75, e.flash * 0.9);
        blit(ctx, s, s.flash, x, y);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    },

    drawPlayer(ctx, p, view) {
      haloFor(view);
      const rt = view.rt;
      const mode = p.dashT > 0 ? 'dash' : p.moving ? 'walk' : 'idle';
      let set;
      if (mode === 'dash') set = DIVER.dash;
      else if (mode === 'walk') set = DIVER.walk[Math.floor(((p.anim / 3) % 1) * 8) & 7];
      else set = DIVER.idle;
      const f = p.facing < 0 ? -1 : 1, side = f < 0 ? 1 : 0;
      const s = set[side];
      const bob = mode === 'idle' ? Math.sin(rt * 2.1) * 0.7 - 0.3 : 0;
      // volumetric lamp beam
      let lx = LAMP.x, ly = LAMP.y + bob, ang = 0.36;
      if (mode === 'dash') { const c = Math.cos(0.62), sn = Math.sin(0.62); lx = c * LAMP.x - sn * LAMP.y; ly = sn * LAMP.x + c * LAMP.y - 3; ang = 0.55; }
      const fl = 0.92 + 0.08 * Math.sin(rt * 13) * Math.sin(rt * 7.3);
      ctx.save();
      ctx.translate(p.x + f * lx, p.y + ly); ctx.scale(f, 1); ctx.rotate(ang);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 * fl;
      ctx.drawImage(BEAM, -1, -13, 66, 26);
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      if (mode === 'dash') {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 1; i <= 3; i++) {
          ctx.globalAlpha = 0.4 - i * 0.1;
          blit(ctx, s, s.halo, p.x - p.dashX * i * 8, p.y - p.dashY * i * 8);
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      if (p.levelT > 0) {
        const k = 1 - p.levelT;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = p.levelT * 0.75;
        ctx.drawImage(COLUMN, p.x - 10, p.y - 96, 20, 98);
        for (let i = 0; i < 3; i++) {
          const q = fract(k * 1.6 + i / 3);
          const rr = 8 + q * 26;
          ctx.globalAlpha = p.levelT * (1 - q) * 0.9;
          ctx.strokeStyle = i % 2 ? P.teal : P.aqua; ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.ellipse(p.x, p.y - q * 34, rr * 0.6, rr * 0.25, 0, 0, TAU); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      let alpha = 1;
      if (p.iframes > 0 && p.hurtT > 0 && (Math.floor(rt * 16) & 1)) alpha = 0.45;
      drawLit(ctx, s, p.x, p.y + bob, alpha, 1.1);
      if (p.hurtT > 0.3) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, (p.hurtT - 0.3) * 1.3);
        blit(ctx, s, s.hurt, p.x, p.y + bob);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      // lens flare on the lamp
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.9 * fl;
      ctx.drawImage(glowOf(P.lampGlow), p.x + f * lx - 4.5, p.y + ly - 4.5, 9, 9);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      // exhaled bubbles rising from the helmet valve (kept per figure)
      let st = BSTATE.get(p);
      if (!st) { st = { t: rt, next: rt + 0.4, list: [] }; BSTATE.set(p, st); }
      let dt = rt - st.t; st.t = rt;
      if (dt < 0 || dt > 0.25) dt = 1 / 60;
      if (rt >= st.next) {
        st.next = rt + 1.3 + Math.random() * 1.3;
        const n = 3 + ((Math.random() * 3) | 0);
        for (let i = 0; i < n; i++) st.list.push({ x: p.x - f * 2.5, y: p.y, z: 30.5, vz: 10 + Math.random() * 6, life: 1.7 + Math.random() * 0.7, age: -i * 0.1, r: 0.6 + Math.random() * 0.9, s: Math.random() * 10 });
      }
      if (st.list.length) {
        ctx.globalCompositeOperation = 'lighter';
        for (const b of st.list) {
          b.age += dt;
          if (b.age < 0) continue;
          b.vz += 9 * dt; b.z += b.vz * dt;
          const k = b.age / b.life;
          ctx.globalAlpha = Math.max(0, Math.min(1, (1 - k) * 2)) * 0.9;
          const r = b.r * (1 + k * 0.4);
          ctx.drawImage(BUB, b.x + Math.sin(b.age * 8 + b.s) * 0.9 - r, b.y - b.z - r, r * 2, r * 2);
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        st.list = st.list.filter((b) => b.age < b.life);
      }
    },

    drawOrbital(ctx, o, view) {
      const tr = o._trail || (o._trail = []);
      tr.push(o.x, o.y, view.rt);
      while (tr.length > 6 && (view.rt - tr[2] > 0.22 || tr.length > 60)) tr.splice(0, 3);
      const bob = Math.sin(view.rt * 3 + o.idx) * 0.8;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      const pl = view.game && view.game.player;
      const onOrbit = pl && Math.abs(Math.hypot((o.x - pl.x) / 44, (o.y + 4 - pl.y) / 37.4) - 1) < 0.04;
      if (onOrbit) {
        // circling the main character: a glowing arc along the orbit behind the jelly
        for (let i = 0; i < 7; i++) {
          const k = 1 - i / 7, a1 = o.angle - i * 0.13, a0 = a1 - 0.14;
          ctx.strokeStyle = 'rgba(150,245,255,' + (k * 0.34).toFixed(3) + ')';
          ctx.lineWidth = 0.5 + k * 1.8;
          ctx.beginPath(); ctx.ellipse(pl.x, pl.y - 13, 44, 37.4, 0, a0, a1); ctx.stroke();
        }
      } else for (let i = 3; i < tr.length; i += 3) {
        const k = 1 - (view.rt - tr[i + 2]) / 0.22;
        if (k <= 0 || Math.abs(tr[i] - tr[i - 3]) + Math.abs(tr[i + 1] - tr[i - 2]) > 30) continue;
        ctx.strokeStyle = 'rgba(150,245,255,' + (k * 0.34).toFixed(3) + ')';
        ctx.lineWidth = 0.5 + k * 1.8;
        ctx.beginPath(); ctx.moveTo(tr[i - 3], tr[i - 2] - 9); ctx.lineTo(tr[i], tr[i + 1] - 9); ctx.stroke();
      }
      ctx.globalAlpha = 0.3; ctx.drawImage(poolOf(P.cyan), o.x - 9, o.y - 3.5, 18, 7);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      const fi = Math.floor((view.rt * 1.6 + o.idx * 0.37) * 4) & 3;
      drawLit(ctx, ORB[fi], o.x, o.y - 10 + bob, 1, 1);
    },

    drawProjectile(ctx, pr, view) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(pr.x, pr.y - 7);
      ctx.rotate(pr.angle);
      const L = Math.min(1, pr.age * 8 + 0.2) * (pr.life < 0.15 ? pr.life / 0.15 : 1);
      ctx.drawImage(TAIL.img, -TAIL.ax * TAIL.w * L, -TAIL.h / 2, TAIL.w * L, TAIL.h);
      for (let i = 1; i <= 3; i++) {
        const d = i * 5.5 * L, w = Math.sin(pr.age * 20 + i * 2 + pr.seed * 9) * 1.4;
        ctx.globalAlpha = 0.7 - i * 0.15;
        ctx.drawImage(glowOf(P.aqua), -d - 1.4, w - 1.4, 2.8, 2.8);
      }
      ctx.globalAlpha = 1;
      ctx.drawImage(HEAD.halo, -HEAD.ax * HEAD.w, -HEAD.ay * HEAD.h, HEAD.w, HEAD.h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(HEAD.img, -HEAD.ax * HEAD.w, -HEAD.ay * HEAD.h, HEAD.w, HEAD.h);
      ctx.restore();
    },

    drawParticle(ctx, pt, view) {
      const k = Math.max(0, pt.life / pt.max);
      const y = pt.y - pt.z;
      ctx.globalCompositeOperation = 'lighter';
      if (pt.kind === 'ring') {
        const e = 1 - k;
        const r = pt.r0 + (pt.r1 - pt.r0) * (1 - (1 - e) * (1 - e));
        ctx.strokeStyle = pt.color;
        ctx.beginPath(); ctx.ellipse(pt.x, y, r, r * pt.sq, 0, 0, TAU);
        ctx.globalAlpha = k * 0.22 * pt.a0; ctx.lineWidth = pt.lw * 3.6; ctx.stroke();
        ctx.globalAlpha = k * pt.a0; ctx.lineWidth = pt.lw; ctx.stroke();
      } else if (pt.kind === 'bubble') {
        const r = pt.size * (0.8 + 0.3 * (1 - k));
        const wob = Math.sin((pt.max - pt.life) * 9 + pt.seed * 20) * 0.8;
        ctx.globalAlpha = Math.min(1, k * 2.5) * 0.85;
        ctx.drawImage(BUB, pt.x + wob - r, y - r, r * 2, r * 2);
      } else if (pt.kind === 'ink') {
        ctx.globalCompositeOperation = 'source-over';
        const r = pt.size * (1 + (1 - k) * 1.4);
        ctx.globalAlpha = k * 0.55;
        ctx.drawImage(PUFF, pt.x - r, y - r, r * 2, r * 2);
      } else {
        const sz = (pt.size || 2) * (0.6 + 0.4 * k) * 2.4;
        const tw = 0.78 + 0.22 * Math.sin(view.rt * 14 + pt.seed * 40);
        ctx.globalAlpha = Math.min(1, k * 2.2) * tw;
        ctx.drawImage(glowOf(pt.color || P.aqua), pt.x - sz, y - sz, sz * 2, sz * 2);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    },

    drawNumber(ctx, n) {
      const D = digits();
      const A = n.crit ? D.crit : D.norm;
      const lf = n.life / n.max;
      const pop = 1 + Math.max(0, lf - 0.78) * 2.6;
      const hW = (n.crit ? 12.5 : 8.8) * pop;
      const sc = hW / A.H;
      const str = String(n.value);
      let W = 0;
      for (let i = 0; i < str.length; i++) { const dd = str.charCodeAt(i) - 48; if (dd >= 0 && dd <= 9) W += A.adv[dd] * 0.92; }
      let x = n.x - (W * sc) / 2;
      const y = n.y - hW / 2 - 4 - (1 - lf) * 4;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(1, lf * 2.4);
      for (let i = 0; i < str.length; i++) {
        const dd = str.charCodeAt(i) - 48;
        if (dd < 0 || dd > 9) continue;
        const sw = A.adv[dd] + A.pad * 2;
        ctx.drawImage(A.c, A.xs[dd], 0, sw, A.H, x - A.pad * sc, y, sw * sc, A.H * sc);
        x += A.adv[dd] * 0.92 * sc;
      }
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      const W = view.W, H = view.H, S = view.S, rt = view.rt;
      const key = W + 'x' + H;
      if (key !== OVLkey) { OVL = buildOverlay(W, H); OVLkey = key; }
      // marine snow in three depths (parallax against the camera)
      ctx.globalCompositeOperation = 'lighter';
      const area = Math.min(2.2, (W * H) / (S * S) / (640 * 360));
      for (const l of SNOWDATA) {
        const n = Math.min(l.n, Math.round(l.n * area));
        const sp = S * l.par, ww = W + 80, hh = H + 80;
        const camx = view.x * sp, camy = view.y * sp;
        const img = l.img ? BOKEH : SNOWDOT;
        const d = l.d;
        for (let i = 0; i < n; i++) {
          const h1 = d[i * 4], h2 = d[i * 4 + 1], h3 = d[i * 4 + 2], h4 = d[i * 4 + 3];
          let x = h1 * ww - camx + (Math.sin(rt * (0.18 + h3 * 0.3) + i) * 5 + rt * 1.1) * sp;
          let y = h2 * hh - camy + rt * l.drift * sp * (0.6 + h4 * 0.8);
          x = ((x % ww) + ww) % ww - 40; y = ((y % hh) + hh) % hh - 40;
          const r = (l.s0 + (l.s1 - l.s0) * h3) * S;
          ctx.globalAlpha = l.a * (0.6 + 0.4 * Math.sin(rt * (0.8 + h1 * 2) + h2 * 20));
          ctx.drawImage(img, x - r * 2, y - r * 2, r * 4, r * 4);
        }
      }
      // depth fog + light shafts + gentle caustics, composed in ONE half-resolution layer and blitted once.
      // Caustics: two world-aligned layers of one tile drifting in different directions (their interference
      // makes the web shimmer); the tiles are pre-scaled to the layer, so each fill is translation-only.
      const Lc = OVL.layer, lc = Lc.ctx, lw = Lc.c.width, lh = Lc.c.height, LS = S * OVL.q;
      lc.setTransform(1, 0, 0, 1, 0, 0);
      lc.globalCompositeOperation = 'copy'; lc.globalAlpha = 1;
      lc.drawImage(OVL.base, 0, 0);
      if (!CT || CT.S !== LS) CT = causticTiles(LS);
      if (typeof DOMMatrix !== 'undefined') {
        lc.globalCompositeOperation = 'lighter';
        for (const [T, sx, sy, ox, oy, a] of [[CT.a, 2.4, 1.5, 0, 0, 0.075], [CT.b, -1.7, 2.2, 90, 40, 0.06]]) {
          if (!T.pat) T.pat = lc.createPattern(T.c, 'repeat');
          if (!T.pat || typeof T.pat.setTransform !== 'function') continue;
          const px = Math.round((((ox + rt * sx - view.x0) * LS) % T.n + T.n) % T.n), py = Math.round((((oy + rt * sy - view.y0) * LS) % T.n + T.n) % T.n);
          T.pat.setTransform(new DOMMatrix([1, 0, 0, 1, px, py]));
          lc.fillStyle = T.pat; lc.globalAlpha = a;
          lc.fillRect(0, 0, lw, lh);
        }
      }
      // everything in the layer is soft and low-contrast: a nearest-neighbour 2x blit is invisible and cheap
      const sm = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(Lc.c, 0, 0, lw / OVL.q, lh / OVL.q);
      ctx.imageSmoothingEnabled = sm;
    },

    drawIcon(ctx, id, size) { drawIconImpl(ctx, id, size); },

    /* ---- events: bursts of glowing plankton, light rings, bubble streams ---- */
    onHit(game, e) {
      const T = ETYPE[e.type] || ETYPE.creeper;
      for (let i = 0; i < 6; i++) mote(game, e.x, e.y, T.z, Math.random() * TAU, 40 + Math.random() * 70, i < 2 ? '#e6fffa' : T.cols[i % T.cols.length], 0.32 + Math.random() * 0.22, 1.9);
      game.addParticle({ kind: 'mote', x: e.x, y: e.y, z: T.z, life: 0.14, size: 3.2, color: '#c4fdff', drag: 0 });
      ring(game, e.x, e.y, T.z, 1.5, 9, '#c4fdff', 0.24, 1, 0.7, 0.9);
    },
    onKill(game, e) {
      const T = ETYPE[e.type] || ETYPE.creeper;
      const big = e.type === 'colossus';
      const n = big ? 38 : 22;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, sp = (big ? 40 : 30) + Math.random() * (big ? 110 : 80);
        mote(game, e.x + (Math.random() - 0.5) * e.r, e.y, T.z * (0.5 + Math.random() * 0.8), a, sp, T.cols[i % T.cols.length], 0.8 + Math.random() * 0.8, (big ? 3.0 : 2.5) * (0.7 + Math.random() * 0.6), 4 + Math.random() * 14);
      }
      for (let i = 0; i < (big ? 9 : 4); i++) bubble(game, e.x, e.y, T.z * 0.6, 0.8 + Math.random() * 1.2, 1.1 + Math.random() * 0.8);
      ring(game, e.x, e.y, 0, e.r * 0.5, e.r * 3.2, T.cols[0], big ? 0.8 : 0.55, 0.42, 1.0, 0.9);
      ring(game, e.x, e.y, T.z, 2, e.r * 1.8, '#e6fffa', 0.3, 1, 0.6, 0.7);
      game.addParticle({ kind: 'mote', x: e.x, y: e.y, z: T.z, life: 0.25, size: big ? 7 : 4, color: T.cols[0], drag: 0 });
      game.addParticle({ kind: 'mote', x: e.x, y: e.y, z: T.z, life: 0.18, size: big ? 5 : 3, color: '#ffffff', drag: 0 });
      if (big) {
        ring(game, e.x, e.y, 0, e.r * 0.4, e.r * 5.2, P.violet, 0.95, 0.42, 0.8, 0.8);
        for (let i = 0; i < 4; i++) game.addParticle({ kind: 'ink', x: e.x + (Math.random() - 0.5) * 16, y: e.y, z: T.z * Math.random(), vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 10, life: 1.2, size: 8 + Math.random() * 6, drag: 2 });
      }
    },
    onHurt(game, p) {
      for (let i = 0; i < 12; i++) mote(game, p.x, p.y, 16, Math.random() * TAU, 50 + Math.random() * 90, i % 2 ? '#ff6fd2' : '#ff4f8a', 0.45 + Math.random() * 0.3, 1.8);
      for (let i = 0; i < 7; i++) bubble(game, p.x, p.y, 24, 0.8 + Math.random() * 1.1, 1 + Math.random() * 0.7);
      ring(game, p.x, p.y, 14, 4, 22, '#ff6fd2', 0.35, 1, 1.1, 1);
    },
    onPickup(game, g) {
      const p = { x: g.x, y: g.y };
      const col = g.big ? P.violet : P.teal;
      ring(game, p.x, p.y, 0, 3, g.big ? 20 : 12, col, 0.5, 0.42, 0.8, 0.9);
      ring(game, p.x, p.y, 8, 1, g.big ? 9 : 6, '#e6fffa', 0.25, 1, 0.5, 0.8);
      for (let i = 0; i < (g.big ? 8 : 3); i++) mote(game, p.x + (Math.random() - 0.5) * 10, p.y, 6 + Math.random() * 14, Math.random() * TAU, 10, g.big ? (i % 2 ? '#ffc2f0' : '#b18cff') : P.mint, 0.7 + Math.random() * 0.4, 1.5, 22 + Math.random() * 22);
    },
    onShoot(game, pr) {
      if (Math.random() < 0.6) bubble(game, pr.x, pr.y + 7, 7, 0.5 + Math.random() * 0.4, 0.7, Math.cos(pr.angle) * 20);
      mote(game, pr.x, pr.y + 7, 7, pr.angle + (Math.random() - 0.5) * 0.8, 50, P.aqua, 0.2, 1.2, 0);
    },
    onDash(game, p) {
      ring(game, p.x, p.y, 0, 4, 22, P.cyan, 0.4, 0.42, 1.0, 1);
      for (let i = 0; i < 10; i++) {
        const back = Math.atan2(-p.dashY, -p.dashX) + (Math.random() - 0.5) * 1.0;
        bubble(game, p.x - p.dashX * i * 3, p.y - p.dashY * i * 3, 6 + Math.random() * 18, 0.6 + Math.random() * 1.1, 0.9 + Math.random() * 0.6, Math.cos(back) * 30);
      }
      for (let i = 0; i < 4; i++) mote(game, p.x, p.y, 10, Math.atan2(-p.dashY, -p.dashX) + (Math.random() - 0.5), 60 + Math.random() * 40, P.cyan, 0.35, 1.4);
    },
    onLevelUp(game, p) {
      ring(game, p.x, p.y, 0, 6, 56, P.teal, 0.9, 0.42, 1.1, 0.9);
      ring(game, p.x, p.y, 0, 4, 38, P.violet, 0.7, 0.42, 0.8, 0.8);
      for (let i = 0; i < 24; i++) {
        game.addParticle({ kind: 'mote', x: p.x + (Math.random() - 0.5) * 24, y: p.y + (Math.random() - 0.5) * 8, z: 2, vx: (Math.random() - 0.5) * 20, vy: 0, vz: 40 + Math.random() * 70, grav: 10, drag: 1, size: 1.8, color: SPARK[i % 4], life: 0.9 + Math.random() * 0.5 });
      }
      for (let i = 0; i < 12; i++) bubble(game, p.x + (Math.random() - 0.5) * 18, p.y, 4 + Math.random() * 10, 0.7 + Math.random() * 1.2, 1.4 + Math.random() * 0.6);
    },
    onDeath(game, p) {
      for (let i = 0; i < 30; i++) mote(game, p.x, p.y, 10 + Math.random() * 18, Math.random() * TAU, 40 + Math.random() * 120, SPARK[i % 4], 1.0 + Math.random() * 0.6, 2.2, 10 + Math.random() * 20);
      for (let i = 0; i < 20; i++) bubble(game, p.x, p.y, 20 + Math.random() * 10, 0.8 + Math.random() * 1.6, 1.5 + Math.random() * 1);
      ring(game, p.x, p.y, 0, 6, 80, P.cyan, 1.0, 0.42, 1.4, 1);
    },
  });
})();
