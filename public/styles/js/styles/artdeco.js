/* ============================================================================
   Art Deco Gold (id: artdeco) – 1920s grand-lobby elegance.
   ONE language everywhere: deep onyx, emerald and midnight-blue surfaces with
   metallic gold (banded linear/radial gradients + a thin bright highlight line),
   ivory accents, strict geometry – sunbursts, stepped ziggurat corners, chevrons,
   fan scallops, concentric arcs and thin parallel gold pin-lines.
   Ground: a grand floor of 200-unit marble bays (sunburst medallion, harlequin,
   fan scallops, chevrons, reflecting pool, parterre garden) between midnight
   terrazzo promenades with gold borders and compass rosettes; marble and
   terrazzo are baked tileable textures used as world-anchored patterns.
   Characters: vector parts baked once into sprites (thin ink outline pass),
   ivory flash / gold silhouette copies; creatures turn to gold and burst into
   gold leaf.
   ========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ------------------------------------------------------------------ palette */
  const INK = '#07080b';
  const C = {
    onyx: '#0d0e12', onyx2: '#1b1c23', onyxHi: '#34363f',
    night: '#0f1a33', night2: '#1a2b52', nightHi: '#2c4478',
    emer: '#0e4a40', emer2: '#14695a', jade: '#2a9c84', jadeHi: '#6fd1b6',
    ivory: '#f2e8d0', ivory2: '#d8c9a3', ivory3: '#a8987a', pearl: '#fffaf0',
    skin: '#ecd0a4', skinSh: '#c39b6c',
    ruby: '#b8323f', rubyHi: '#e46a6a', rubyDk: '#6e1622',
    bronze: '#3a332a', bronzeDk: '#16130f', bronzeHi: '#6a5c46',
    water: '#123a57', waterDk: '#0a2136', waterHi: '#8fd6cf',
  };
  const GOLD = { dk: '#5a3d10', md: '#b8862f', lt: '#e6c15a', hi: '#fff0b8', line: '#c99a3c' };
  const GSTOPS = [[0, '#fff0b8'], [0.18, '#e9bf5c'], [0.42, '#9a6c22'], [0.56, '#c8973a'], [0.78, '#f5d98a'], [1, '#7d561a']];
  const ENAMEL = [
    { hi: '#6fd8b8', base: '#1f9a80', dk: '#0a4a40' },   // jade
    { hi: '#86a8f2', base: '#3460c0', dk: '#15296a' },   // lapis
    { hi: '#5a5d6b', base: '#1f2129', dk: '#060709' },   // onyx
  ];
  const SHARD_COL = ['#1f9a80', '#3460c0', '#2a2c35', '#efe5cc', '#5a4c38', '#b8323f', '#f6ecd2', '#6fd1b6'];

  const PS = 1.0; // main character scale
  let K = 4;        // sprite px per world unit
  const SPR = {};
  const TEX = {};
  let ownWorld = false; // true once this module's own floor is rendered (pool ripples belong to it)

  /* ------------------------------------------------------------ paint helpers */
  function gold(c, x0, y0, x1, y1) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    for (const s of GSTOPS) g.addColorStop(s[0], s[1]);
    return g;
  }
  function lin(c, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((s, i) => g.addColorStop(Array.isArray(s) ? s[0] : i / (stops.length - 1), Array.isArray(s) ? s[1] : s));
    return g;
  }
  function poly(c, pts) {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  }
  function fillPoly(c, pts, fill) { c.beginPath(); poly(c, pts); c.fillStyle = fill; c.fill(); }
  /** Bevelled gold stroke of the current path: dark edge, mid gold, bright highlight line. */
  function gl(c, w) {
    c.strokeStyle = GOLD.dk; c.lineWidth = w * 1.55; c.stroke();
    c.strokeStyle = GOLD.md; c.lineWidth = w; c.stroke();
    c.strokeStyle = GOLD.hi; c.lineWidth = w * 0.34; c.stroke();
  }
  function pin(c, w, col) { c.strokeStyle = col || GOLD.line; c.lineWidth = w; c.stroke(); }
  /** Metallic gold ring: radial gradient across the ring width. */
  function ringG(c, x, y, r, w) {
    const g = c.createRadialGradient(x, y, Math.max(0, r - w / 2), x, y, r + w / 2);
    g.addColorStop(0, GOLD.dk); g.addColorStop(0.3, '#f5d98a'); g.addColorStop(0.5, GOLD.hi);
    g.addColorStop(0.72, '#c8973a'); g.addColorStop(1, GOLD.dk);
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = w; c.strokeStyle = g; c.stroke();
  }
  /** Rectangle with notched, two-step (ziggurat) corners. Adds to the current path. */
  function stepRect(c, x0, y0, x1, y1, s) {
    const d = 2 * s;
    c.moveTo(x0 + d, y0); c.lineTo(x1 - d, y0); c.lineTo(x1 - d, y0 + s); c.lineTo(x1 - s, y0 + s); c.lineTo(x1 - s, y0 + d); c.lineTo(x1, y0 + d);
    c.lineTo(x1, y1 - d); c.lineTo(x1 - s, y1 - d); c.lineTo(x1 - s, y1 - s); c.lineTo(x1 - d, y1 - s); c.lineTo(x1 - d, y1);
    c.lineTo(x0 + d, y1); c.lineTo(x0 + d, y1 - s); c.lineTo(x0 + s, y1 - s); c.lineTo(x0 + s, y1 - d); c.lineTo(x0, y1 - d);
    c.lineTo(x0, y0 + d); c.lineTo(x0 + s, y0 + d); c.lineTo(x0 + s, y0 + s); c.lineTo(x0 + d, y0 + s); c.closePath();
  }
  function starPath(c, x, y, n, ro, ri, rot) {
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * TAU, r = i & 1 ? ri : ro;
      if (i) c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.closePath();
  }
  /** Quad from a to b with widths w0 (at a) and w1 (at b) – limbs, stems. */
  function limb(c, ax, ay, bx, by, w0, w1) {
    const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    c.moveTo(ax + nx * w0, ay + ny * w0); c.lineTo(bx + nx * w1, by + ny * w1);
    c.lineTo(bx - nx * w1, by - ny * w1); c.lineTo(ax - nx * w0, ay - ny * w0); c.closePath();
  }

  /* ------------------------------------------------------------ sprite infra */
  function mk(box, fn, sc) {
    sc = sc || 1;
    const l = box[0] * sc, t = box[1] * sc;
    const { c, ctx } = U.canvas((box[2] - box[0]) * sc * K, (box[3] - box[1]) * sc * K);
    ctx.scale(K * sc, K * sc); ctx.translate(-box[0], -box[1]);
    ctx.lineJoin = 'miter'; ctx.miterLimit = 3; ctx.lineCap = 'butt';
    fn(ctx);
    return { c, ox: -l * K, oy: -t * K };
  }
  /** Bakes fn and puts a thin ink outline (dilated silhouette) behind it, optionally with a gilded rim around that. */
  function outlined(box, fn, ol, sc, rim) {
    const s = mk(box, fn, sc);
    const { c, ctx } = U.canvas(s.c.width, s.c.height);
    const r = (ol === undefined ? 0.7 : ol) * K;
    if (rim) {
      const gs = U.tint(s.c, '#c9973a');
      const rr = r + rim * K;
      for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; ctx.drawImage(gs, Math.cos(a) * rr, Math.sin(a) * rr); }
    }
    const sil = U.tint(s.c, INK);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.drawImage(sil, Math.cos(a) * r, Math.sin(a) * r); }
    ctx.drawImage(s.c, 0, 0);
    return { c, ox: s.ox, oy: s.oy };
  }
  const tintS = (s, col, a) => ({ c: U.tint(s.c, col, a), ox: s.ox, oy: s.oy });
  /** Sprite set: normal, ivory flash, gold silhouette. */
  function set3(box, fn, ol, flashCol, sc) {
    const n = outlined(box, fn, ol, sc, 0.42);
    return { n, f: tintS(n, flashCol || '#fff6dc', 0.86), g: goldSil(n) };
  }
  function goldSil(s) {
    const { c, ctx } = U.canvas(s.c.width, s.c.height);
    ctx.drawImage(s.c, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    const g = ctx.createLinearGradient(0, 0, c.width * 0.4, c.height);
    for (const st of GSTOPS) g.addColorStop(st[0], st[1]);
    ctx.globalAlpha = 0.92; ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    return { c, ox: s.ox, oy: s.oy };
  }

  /* ---------------------------------------------------------- draw helpers */
  let TV = null;
  const TF = { S: 1, ox: 0, oy: 0 };
  function tf(view) {
    if (TV !== view) { TV = view; TF.S = view.S; TF.ox = view.W / 2 - view.x * view.S; TF.oy = view.H / 2 - view.y * view.S; }
    return TF;
  }
  /** Blit a sprite at world (x,y) with scale, rotation and optional horizontal flip. */
  function blit(ctx, V, s, x, y, sx, sy, rot, flip) {
    const S = V.S, fx = flip ? -1 : 1;
    if (rot) {
      const co = Math.cos(rot) * S, si = Math.sin(rot) * S;
      ctx.setTransform(co * sx * fx, si * sx * fx, -si * sy, co * sy, V.ox + x * S, V.oy + y * S);
    } else ctx.setTransform(S * sx * fx, 0, 0, S * sy, V.ox + x * S, V.oy + y * S);
    const k = 1 / K;
    ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }

  /* ============================================================ characters */
  /* ---- main character: a dapper gentleman in an ivory dinner jacket and top hat ---- */
  function gentParts(c, P) {
    const hipY = -12.2, LL = 10.6;
    const leg = (ang, back, lift) => {
      const ax = Math.sin(ang) * LL, ay = hipY + Math.cos(ang) * LL - lift;
      c.beginPath(); limb(c, 0, hipY, ax, ay, 1.85, 1.3);
      c.fillStyle = back ? '#0a0b0e' : lin(c, -2, 0, 2, 0, ['#26272f', '#121318', '#0b0c10']); c.fill();
      if (!back) { c.beginPath(); c.moveTo(0.2, hipY + 0.5); c.lineTo(ax + 0.2, ay - 0.3); c.strokeStyle = 'rgba(120,124,140,.45)'; c.lineWidth = 0.35; c.stroke(); }
      const fx = ax, fy = ay + 1.6;
      fillPoly(c, [[fx - 1.7, fy - 1.1], [fx + 1.1, fy - 1.4], [fx + 3.5, fy - 0.3], [fx + 3.5, fy + 0.5], [fx - 1.7, fy + 0.5]], back ? '#040405' : '#0e0f13');
      fillPoly(c, [[fx - 1.5, fy - 2.1], [fx + 1.2, fy - 2.1], [fx + 1.7, fy - 1.0], [fx - 1.5, fy - 0.8]], back ? '#a89a78' : lin(c, fx, fy - 2, fx, fy - 0.8, ['#fbf4e2', '#d9c9a3']));
      if (!back) { c.beginPath(); c.moveTo(fx + 1.4, fy - 1.0); c.lineTo(fx + 3.0, fy - 0.3); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.3; c.stroke(); }
    };
    const arm = (sx, ang, back, cane) => {
      const sy = -22.0, L = 8.4;
      const ex = sx + Math.sin(ang) * L, ey = sy + Math.cos(ang) * L;
      const hx = ex + Math.sin(ang) * 1.1, hy = ey + Math.cos(ang) * 1.1;
      if (cane !== undefined) {
        const s = Math.sin(cane), co = Math.cos(cane);
        c.beginPath(); c.moveTo(hx - s * 1.8, hy - co * 1.8); c.lineTo(hx + s * 12.2, hy + co * 12.2);
        c.strokeStyle = '#0a0a0d'; c.lineWidth = 0.95; c.stroke();
        c.strokeStyle = 'rgba(140,140,160,.5)'; c.lineWidth = 0.25; c.stroke();
        c.beginPath(); c.moveTo(hx + s * 10.8, hy + co * 10.8); c.lineTo(hx + s * 12.3, hy + co * 12.3);
        c.strokeStyle = GOLD.lt; c.lineWidth = 1.0; c.stroke();
        c.beginPath(); c.arc(hx - s * 2.1, hy - co * 2.1, 1.0, 0, TAU); c.fillStyle = gold(c, hx - 1, hy - 3, hx + 1, hy - 1); c.fill();
      }
      c.beginPath(); limb(c, sx, sy, ex, ey, 1.5, 1.15);
      c.fillStyle = back ? '#b7a883' : lin(c, sx - 2, sy, sx + 2, ey, ['#fffaf0', '#e6d9b8', '#cbb98f']); c.fill();
      c.beginPath(); limb(c, sx + Math.sin(ang) * (L - 1.1), sy + Math.cos(ang) * (L - 1.1), ex, ey, 1.2, 1.15); c.fillStyle = back ? '#050506' : '#111217'; c.fill();
      c.beginPath(); c.arc(hx, hy, 1.25, 0, TAU); c.fillStyle = back ? '#cfc5b0' : '#fdf9f0'; c.fill();
    };
    arm(-4.6, P.ab, true);
    leg(P.lb, true, P.liftB);
    leg(P.lf, false, P.liftF);
    // jacket
    const J = [[-5.9, -23.6], [5.9, -23.6], [5.3, -20.5], [3.9, -15.4], [4.7, -11.3], [1.2, -10.2], [0.2, -12.7], [-0.8, -10.2], [-4.7, -11.0], [-3.9, -15.4], [-5.3, -20.5]];
    fillPoly(c, J, lin(c, -6, -24, 5, -10, ['#fffaf0', '#f1e6cb', '#cdbb93']));
    c.save(); c.beginPath(); poly(c, J); c.clip();
    fillPoly(c, [[3.2, -23.6], [6, -23.6], [6, -10], [3.0, -10]], 'rgba(150,120,70,.16)');
    c.restore();
    c.beginPath(); c.moveTo(-4.7, -11.0); c.lineTo(-0.8, -10.2); c.lineTo(0.2, -12.7); c.lineTo(1.2, -10.2); c.lineTo(4.7, -11.3);
    c.strokeStyle = GOLD.md; c.lineWidth = 0.5; c.stroke(); c.strokeStyle = GOLD.hi; c.lineWidth = 0.18; c.stroke();
    // shirt, lapels, bow tie
    fillPoly(c, [[-1.1, -23.6], [1.1, -23.6], [0.1, -16.8]], '#fffdf7');
    fillPoly(c, [[-3.5, -23.6], [-1.1, -23.6], [0.1, -16.6], [-2.3, -19.8]], '#121318');
    fillPoly(c, [[1.1, -23.6], [3.5, -23.6], [2.5, -19.8], [0.1, -16.6]], '#121318');
    c.beginPath(); c.moveTo(-2.9, -23.3); c.lineTo(-1.9, -20.2); c.moveTo(2.9, -23.3); c.lineTo(2.0, -20.2); c.strokeStyle = 'rgba(150,154,175,.5)'; c.lineWidth = 0.25; c.stroke();
    fillPoly(c, [[-0.3, -22.6], [-2.3, -23.6], [-2.3, -21.6]], '#0b0c0f');
    fillPoly(c, [[0.3, -22.6], [2.3, -23.6], [2.3, -21.6]], '#0b0c0f');
    c.fillStyle = gold(c, 0, -23.1, 0, -22.1); c.fillRect(-0.5, -23.1, 1.0, 1.0);
    // buttons + fan pocket square
    c.fillStyle = gold(c, 0, -16, 0, -13); c.beginPath(); c.arc(0.15, -15.3, 0.45, 0, TAU); c.arc(0.15, -13.7, 0.45, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(3.6, -20.4); c.arc(3.6, -20.4, 1.6, PI, TAU); c.closePath(); c.fillStyle = gold(c, 3.6, -22, 3.6, -20.4); c.fill();
    c.beginPath(); for (let k = 1; k < 4; k++) { const a = PI + (k / 4) * PI; c.moveTo(3.6, -20.4); c.lineTo(3.6 + Math.cos(a) * 1.6, -20.4 + Math.sin(a) * 1.6); }
    c.strokeStyle = GOLD.dk; c.lineWidth = 0.18; c.stroke();
    // head
    c.fillStyle = C.skinSh; c.fillRect(-1.1, -25.4, 2.2, 2.0);
    const H = [[-3.1, -31.0], [2.6, -31.0], [3.8, -29.3], [4.2, -27.8], [3.4, -27.3], [3.7, -26.3], [2.6, -24.9], [-0.6, -24.6], [-2.6, -25.8], [-3.4, -28.4]];
    fillPoly(c, H, lin(c, -3, -31, 4, -25, ['#f6dfba', C.skin, C.skinSh]));
    fillPoly(c, [[-3.7, -31.2], [2.3, -31.2], [1.4, -29.9], [-1.0, -29.8], [-2.0, -27.0], [-3.6, -27.5]], '#0c0d10');
    c.beginPath(); c.moveTo(-3.0, -29.2); c.lineTo(0.8, -30.5); c.strokeStyle = 'rgba(140,146,170,.6)'; c.lineWidth = 0.3; c.stroke();
    c.beginPath(); c.moveTo(-1.9, -27.2); c.quadraticCurveTo(-1.2, -27.9, -1.5, -28.8); c.strokeStyle = 'rgba(150,110,70,.7)'; c.lineWidth = 0.35; c.stroke();
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(1.7, -28.6); c.lineTo(2.9, -28.5); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke();
    c.beginPath(); c.moveTo(1.4, -29.6); c.lineTo(3.1, -29.7); c.lineWidth = 0.35; c.stroke();
    c.beginPath(); c.moveTo(2.3, -26.4); c.lineTo(3.7, -26.1); c.lineWidth = 0.5; c.stroke();
    c.lineCap = 'butt';
    // top hat
    fillPoly(c, [[-3.4, -31.6], [4.0, -31.6], [4.5, -39.8], [-3.8, -39.8]], lin(c, -4, 0, 4.5, 0, ['#2a2b33', '#0c0d11', '#1a1b21']));
    c.beginPath(); c.moveTo(-4.9, -30.6); c.lineTo(5.7, -30.6); c.quadraticCurveTo(6.4, -31.4, 5.4, -32.0); c.lineTo(-4.6, -32.0); c.quadraticCurveTo(-5.6, -31.4, -4.9, -30.6);
    c.fillStyle = '#0b0c0f'; c.fill();
    fillPoly(c, [[-3.45, -33.5], [4.1, -33.5], [4.02, -32.0], [-3.42, -32.0]], gold(c, 0, -33.5, 0, -32));
    c.beginPath(); c.moveTo(-1.8, -39.2); c.lineTo(-1.55, -34.0); c.strokeStyle = 'rgba(255,255,255,.32)'; c.lineWidth = 0.5; c.stroke();
    c.beginPath(); c.moveTo(-3.8, -39.8); c.lineTo(4.5, -39.8); c.strokeStyle = '#3c3e48'; c.lineWidth = 0.4; c.stroke();
    arm(4.4, P.af, false, P.cane);
  }
  function gentPose(f) {
    if (f < 0) return { lf: 0.07, lb: -0.07, af: -0.05, ab: 0.1, cane: 0.32, liftF: 0, liftB: 0 };
    const ph = (f / 6) * TAU, s = Math.sin(ph), co = Math.cos(ph);
    return { lf: s * 0.44, lb: -s * 0.44, af: -s * 0.36, ab: s * 0.36, cane: -s * 0.2 + 0.3, liftF: Math.max(0, co) * 1.5, liftB: Math.max(0, -co) * 1.5 };
  }

  /* ---- small creature: enamel scarab carrying a gold sun disc ---- */
  function scarabParts(c, f, v) {
    const E = ENAMEL[v];
    const st = [0, 1, 0, -1][f];
    c.lineCap = 'round'; c.lineJoin = 'round';
    const legs = (far) => {
      const xs = [-4.8, -0.4, 3.8], dir = [-1, 0.25, 1];
      c.beginPath();
      for (let i = 0; i < 3; i++) {
        const ph = (i === 1 ? -st : st) * (far ? -1 : 1);
        const bx = xs[i] + (far ? 1.0 : 0), by = far ? -6.0 : -4.4;
        const kx = bx + dir[i] * 3.0 + ph * 0.9, ky = by - (far ? 2.2 : 1.6) - Math.max(0, ph) * 0.6;
        const fx = bx + dir[i] * 4.6 + ph * 1.5, fy = (far ? -1.2 : 0) - Math.max(0, ph) * 1.0;
        c.moveTo(bx, by); c.lineTo(kx, ky); c.lineTo(fx, fy);
      }
      c.strokeStyle = far ? '#030304' : '#1d1e25'; c.lineWidth = far ? 0.9 : 1.15; c.stroke();
      if (!far) { c.strokeStyle = 'rgba(230,193,90,.9)'; c.lineWidth = 0.38; c.stroke(); }
    };
    legs(true);
    c.beginPath(); c.ellipse(0.6, -4.8, 8.8, 2.6, 0, 0, TAU); c.fillStyle = '#0b0c10'; c.fill();
    legs(false);
    c.lineCap = 'butt'; c.lineJoin = 'miter';
    // shell
    const shell = (k) => { k.ellipse(-1.4, -6.2, 8.4, 6.4, 0, PI, 0); k.ellipse(-1.4, -6.2, 8.4, 2.3, 0, 0, PI); k.closePath(); };
    c.beginPath(); shell(c); c.fillStyle = lin(c, -7, -12.5, 4, -3, [E.hi, E.base, E.dk]); c.fill();
    c.save(); c.beginPath(); shell(c); c.clip();
    // sunburst engraving from the front of the shell
    const ox = 5.0, oy = -9.0;
    c.beginPath();
    for (let k = 0; k < 9; k++) { const a = PI * 0.86 + (k / 8) * PI * 0.42; c.moveTo(ox + Math.cos(a) * 3.2, oy + Math.sin(a) * 3.2); c.lineTo(ox + Math.cos(a) * 16, oy + Math.sin(a) * 16); }
    c.strokeStyle = v === 2 ? 'rgba(230,193,90,.85)' : 'rgba(240,205,120,.55)'; c.lineWidth = 0.32; c.stroke();
    c.beginPath(); c.arc(ox, oy, 6.5, PI * 0.8, PI * 1.35); c.moveTo(ox + Math.cos(PI * 0.78) * 10.5, oy + Math.sin(PI * 0.78) * 10.5); c.arc(ox, oy, 10.5, PI * 0.78, PI * 1.3);
    c.strokeStyle = 'rgba(240,205,120,.6)'; c.lineWidth = 0.35; c.stroke();
    c.beginPath(); c.ellipse(-4.0, -10.4, 3.2, 1.1, -0.22, 0, TAU); c.fillStyle = 'rgba(255,255,255,.45)'; c.fill();
    c.restore();
    c.beginPath(); c.moveTo(5.0, -10.4); c.quadraticCurveTo(-1.2, -11.8, -9.5, -6.9); c.strokeStyle = GOLD.md; c.lineWidth = 0.6; c.stroke(); c.strokeStyle = GOLD.hi; c.lineWidth = 0.2; c.stroke();
    c.beginPath(); shell(c); gl(c, 0.6);
    // thorax plate
    c.beginPath(); c.ellipse(6.0, -7.0, 3.3, 3.1, 0, 0, TAU); c.fillStyle = lin(c, 4, -10, 8, -4, ['#3a3c46', '#101116', '#050506']); c.fill(); gl(c, 0.42);
    // head + gold sun disc + eye
    c.beginPath(); c.ellipse(8.9, -5.6, 2.0, 1.6, 0, 0, TAU); c.fillStyle = '#0b0c10'; c.fill();
    c.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; c.moveTo(10.9 + Math.cos(a) * 2.2, -9.0 + Math.sin(a) * 2.2); c.lineTo(10.9 + Math.cos(a) * 3.1, -9.0 + Math.sin(a) * 3.1); }
    c.strokeStyle = GOLD.lt; c.lineWidth = 0.45; c.stroke();
    c.beginPath(); c.arc(10.9, -9.0, 1.9, 0, TAU);
    const sg = c.createRadialGradient(10.4, -9.6, 0.2, 10.9, -9.0, 2.0); sg.addColorStop(0, '#fff6cc'); sg.addColorStop(0.5, '#e6b84e'); sg.addColorStop(1, '#8a611d');
    c.fillStyle = sg; c.fill();
    c.beginPath(); c.arc(9.6, -5.9, 0.55, 0, TAU); c.fillStyle = '#fff6dc'; c.fill();
  }

  /* ---- fast creature: a streamlined swift seen from above, swept chevron wings ---- */
  const SWIFT_SPAN = [1, 0.72, 0.38, 0.72];
  function swiftParts(c, f) {
    const sp = SWIFT_SPAN[f];
    const wing = (sgn) => {
      const tx = -7.5 + (1 - sp) * 3, ty = sgn * 14 * sp;
      const pts = (k) => {
        k.moveTo(3.4, sgn * 1.2);
        k.quadraticCurveTo(1.5, sgn * (1.5 + 9 * sp), tx, ty);
        k.quadraticCurveTo(-2.6, sgn * (1.5 + 5.5 * sp), -3.4, sgn * 1.4);
        k.closePath();
      };
      c.beginPath(); pts(c); c.fillStyle = lin(c, 0, 0, tx, ty, ['#fffaf0', '#efe4c8', '#c9b98f']); c.fill();
      c.save(); c.beginPath(); pts(c); c.clip();
      for (let k = 0; k < 3; k++) {
        const t = 0.34 + k * 0.2;
        c.beginPath();
        c.moveTo(3.4 + (tx - 3.4) * t + 2, sgn * 1.2 + (ty - sgn * 1.2) * t - sgn * 3);
        c.lineTo(3.4 + (tx - 3.4) * t - 1.6, sgn * 1.2 + (ty - sgn * 1.2) * t);
        c.lineTo(3.4 + (tx - 3.4) * t + 2, sgn * 1.2 + (ty - sgn * 1.2) * t + sgn * 3);
        c.strokeStyle = k === 1 ? GOLD.md : C.jade; c.lineWidth = k === 1 ? 0.7 : 1.3; c.stroke();
      }
      c.restore();
      c.beginPath(); c.moveTo(3.4, sgn * 1.2); c.quadraticCurveTo(1.5, sgn * (1.5 + 9 * sp), tx, ty);
      c.strokeStyle = GOLD.md; c.lineWidth = 0.7; c.stroke(); c.strokeStyle = GOLD.hi; c.lineWidth = 0.22; c.stroke();
    };
    wing(-1); wing(1);
    fillPoly(c, [[-7.6, -0.7], [-14.2, -3.6], [-11.4, -0.2]], gold(c, -14, -3.6, -8, 0));
    fillPoly(c, [[-7.6, 0.7], [-14.2, 3.6], [-11.4, 0.2]], gold(c, -14, 0, -8, 3.6));
    const body = (k) => { k.moveTo(9.2, 0); k.bezierCurveTo(7.5, -2.6, 0, -2.8, -8.6, -0.8); k.lineTo(-8.6, 0.8); k.bezierCurveTo(0, 2.8, 7.5, 2.6, 9.2, 0); k.closePath(); };
    c.beginPath(); body(c); c.fillStyle = lin(c, 0, -2.6, 0, 2.6, [C.jadeHi, C.jade, '#0f5548']); c.fill();
    c.save(); c.beginPath(); body(c); c.clip();
    c.beginPath(); c.ellipse(7.4, 0, 3.8, 3.2, 0, 0, TAU); c.fillStyle = lin(c, 4, -2, 9, 2, ['#2c4478', '#0f1a33']); c.fill();
    c.restore();
    c.beginPath(); c.moveTo(-7.5, 0); c.lineTo(4.0, 0); c.strokeStyle = GOLD.lt; c.lineWidth = 0.45; c.stroke();
    fillPoly(c, [[8.6, -0.9], [12.4, 0], [8.6, 0.9]], gold(c, 8.6, -1, 8.6, 1));
    c.beginPath(); c.arc(7.2, -1.35, 0.62, 0, TAU); c.arc(7.2, 1.35, 0.62, 0, TAU); c.fillStyle = '#fff6dc'; c.fill();
  }

  /* ---- large creature: an ornate gilded guardian statue ---- */
  function guardParts(c, f) {
    const liftL = [0, 1.8, 0, 0][f], liftR = [0, 0, 0, 1.8][f], bob = [0, -0.8, 0, -0.8][f];
    // fan headdress (behind the head)
    const hx = 0, hy = -46 + bob;
    c.beginPath(); c.arc(hx, hy, 16, PI, TAU); c.closePath(); c.fillStyle = '#0d0e12'; c.fill();
    for (let k = 0; k < 11; k++) {
      const a0 = PI + (k / 11) * PI, a1 = PI + ((k + 1) / 11) * PI;
      c.beginPath(); c.moveTo(hx, hy); c.arc(hx, hy, 15.2, a0 + 0.02, a1 - 0.02); c.closePath();
      c.fillStyle = k & 1 ? lin(c, hx, hy - 15, hx, hy, ['#14695a', '#0b3b33']) : gold(c, hx - 8, hy - 15, hx + 8, hy);
      c.fill();
    }
    c.beginPath(); c.arc(hx, hy, 16, PI, TAU); gl(c, 0.8);
    c.beginPath(); c.arc(hx, hy, 10.5, PI, TAU); c.strokeStyle = GOLD.dk; c.lineWidth = 0.5; c.stroke();
    // legs + stepped feet
    const legB = (x0, x1, lift) => {
      c.fillStyle = lin(c, x0, 0, x1, 0, [C.bronzeHi, C.bronze, C.bronzeDk]);
      c.fillRect(x0, -18 + bob, x1 - x0, 15 - lift - bob);
      c.fillStyle = '#0d0e12'; c.fillRect(x0 - 1.6, -3.4 - lift, x1 - x0 + 3.2, 3.4);
      c.fillStyle = gold(c, 0, -3.4 - lift, 0, -2.6 - lift); c.fillRect(x0 - 1.6, -3.6 - lift, x1 - x0 + 3.2, 0.9);
      c.fillStyle = gold(c, 0, -10 + bob, 0, -8.6 + bob); c.fillRect(x0, -10.4 - lift * 0.5, x1 - x0, 1.2);
    };
    legB(-9.2, -2.8, liftL);
    legB(2.8, 9.2, liftR);
    // pleated kilt
    const ky = bob;
    fillPoly(c, [[-10.5, -23 + ky], [10.5, -23 + ky], [12.2, -15 + ky], [-12.2, -15 + ky]], lin(c, 0, -23, 0, -15, ['#1c1d24', '#0b0c10']));
    c.beginPath(); for (let k = -5; k <= 5; k++) { c.moveTo(k * 2.0, -22.4 + ky); c.lineTo(k * 2.3, -15.4 + ky); } c.strokeStyle = 'rgba(214,170,80,.8)'; c.lineWidth = 0.35; c.stroke();
    c.fillStyle = gold(c, 0, -23.6 + ky, 0, -22 + ky); c.fillRect(-11, -23.8 + ky, 22, 1.8);
    // torso: stepped inverted ziggurat
    const T = [[-15.5, -41 + ky], [15.5, -41 + ky], [15.5, -37.4 + ky], [12, -37.4 + ky], [12, -34 + ky], [9.5, -34 + ky], [8.4, -23.6 + ky], [-8.4, -23.6 + ky], [-9.5, -34 + ky], [-12, -34 + ky], [-12, -37.4 + ky], [-15.5, -37.4 + ky]];
    fillPoly(c, T, lin(c, -14, -41, 10, -24, [C.bronzeHi, C.bronze, C.bronzeDk]));
    c.beginPath(); poly(c, T); gl(c, 0.5);
    // chevron stack + sun medallion
    c.beginPath(); for (let k = 0; k < 3; k++) { const y = -30.5 + k * 2.3 + ky; c.moveTo(-6.4 + k * 0.9, y); c.lineTo(0, y + 3.2); c.lineTo(6.4 - k * 0.9, y); }
    c.lineWidth = 0.9; c.strokeStyle = GOLD.md; c.stroke(); c.lineWidth = 0.3; c.strokeStyle = GOLD.hi; c.stroke();
    c.beginPath(); for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; c.moveTo(Math.cos(a) * 3.4, -35.6 + ky + Math.sin(a) * 3.4); c.lineTo(Math.cos(a) * 5.0, -35.6 + ky + Math.sin(a) * 5.0); }
    c.strokeStyle = GOLD.lt; c.lineWidth = 0.55; c.stroke();
    c.beginPath(); c.arc(0, -35.6 + ky, 3.0, 0, TAU); c.fillStyle = gold(c, -2, -38.6 + ky, 2, -32.6 + ky); c.fill();
    c.beginPath(); c.arc(0, -35.6 + ky, 1.4, 0, TAU); c.fillStyle = lin(c, 0, -37, 0, -34, [C.jadeHi, C.jade, C.emer]); c.fill();
    // arms: blocks with gold bracers and fists
    const armB = (x0, x1, dy) => {
      c.fillStyle = lin(c, x0, 0, x1, 0, [C.bronzeHi, C.bronze, C.bronzeDk]);
      c.fillRect(x0, -37 + ky + dy, x1 - x0, 15);
      c.fillStyle = gold(c, 0, -27 + ky + dy, 0, -24.6 + ky + dy); c.fillRect(x0 - 0.5, -27 + ky + dy, x1 - x0 + 1, 2.4);
      c.fillStyle = gold(c, x0, -22 + ky + dy, x1, -18 + ky + dy); c.fillRect(x0 - 0.3, -22 + ky + dy, x1 - x0 + 0.6, 3.8);
      c.beginPath(); c.moveTo(x0 + 0.6, -20.1 + ky + dy); c.lineTo(x1 - 0.6, -20.1 + ky + dy); c.strokeStyle = GOLD.dk; c.lineWidth = 0.3; c.stroke();
    };
    armB(-17.6, -12.8, liftR * 0.4);
    armB(12.8, 17.6, liftL * 0.4);
    // neck + gilded mask
    c.fillStyle = C.bronzeDk; c.fillRect(-2.6, -42.5 + ky, 5.2, 2.5);
    const M = [[-5.2, -52.5 + ky], [5.2, -52.5 + ky], [5.2, -45.5 + ky], [3.0, -41.6 + ky], [-3.0, -41.6 + ky], [-5.2, -45.5 + ky]];
    fillPoly(c, M, gold(c, -5, -52.5 + ky, 4, -41.6 + ky));
    c.beginPath(); poly(c, M); c.strokeStyle = GOLD.dk; c.lineWidth = 0.4; c.stroke();
    c.fillStyle = '#0b0c10'; c.fillRect(-5.2, -53.6 + ky, 10.4, 1.6);
    c.fillStyle = 'rgba(111,245,210,.28)'; c.beginPath(); c.ellipse(-2.6, -48.0 + ky, 2.8, 1.5, 0, 0, TAU); c.ellipse(2.6, -48.0 + ky, 2.8, 1.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#9ff7de'; c.fillRect(-4.0, -48.5 + ky, 2.8, 1.0); c.fillRect(1.2, -48.5 + ky, 2.8, 1.0);
    c.beginPath(); c.moveTo(0, -48 + ky); c.lineTo(0, -45 + ky); c.moveTo(-1.4, -43.4 + ky); c.lineTo(1.4, -43.4 + ky); c.strokeStyle = GOLD.dk; c.lineWidth = 0.4; c.stroke();
  }

  /* ================================================================ props */
  const PROPS = {
    lamp: { box: [-14, -66, 14, 3], sh: [8, 2.8], tall: true, h: 60, w: 8 },
    statue: { box: [-21, -84, 21, 3], sh: [19, 5.6], tall: true, h: 80, w: 14 },
    fountain: { box: [-31, -46, 31, 10], sh: [29, 8.5], tall: false, h: 40, w: 24 },
    palm: { box: [-28, -74, 28, 3], sh: [13, 4.2], tall: true, h: 70, w: 18 },
    'fan-urn': { box: [-18, -34, 18, 3], sh: [8, 3.0], tall: false, h: 30, w: 12 },
    topiary: { box: [-12, -56, 12, 3], sh: [9, 3.2], tall: true, h: 52, w: 8 },
  };
  function marbleBlock(c, x, y, w, h, light) {
    c.fillStyle = lin(c, x, y, x + w, y + h, light ? ['#fbf5e6', '#e7dcc2', '#c9b994'] : ['#2b2d36', '#15161c', '#08090c']);
    c.fillRect(x, y, w, h);
  }
  function lampParts(c) {
    marbleBlock(c, -6, -3, 12, 3); c.fillStyle = gold(c, 0, -3.3, 0, -2.5); c.fillRect(-6, -3.3, 12, 0.8);
    marbleBlock(c, -4.4, -6.4, 8.8, 3.4); c.fillStyle = gold(c, 0, -6.6, 0, -5.9); c.fillRect(-4.4, -6.7, 8.8, 0.7);
    marbleBlock(c, -3, -8.6, 6, 2.4);
    c.fillStyle = lin(c, -1.7, 0, 1.7, 0, ['#0b0c10', '#3a3c46', '#16171d', '#07080b']); c.fillRect(-1.7, -45, 3.4, 36.6);
    c.beginPath(); for (const x of [-0.85, 0, 0.85]) { c.moveTo(x, -42); c.lineTo(x, -11); } c.strokeStyle = 'rgba(214,170,80,.7)'; c.lineWidth = 0.22; c.stroke();
    for (const y of [-11, -24, -42]) { c.fillStyle = gold(c, 0, y - 0.6, 0, y + 0.6); c.fillRect(-2.3, y - 0.6, 4.6, 1.2); }
    // stepped glass lantern
    c.fillStyle = gold(c, 0, -46.2, 0, -45); c.fillRect(-5.6, -46.4, 11.2, 1.4);
    const tiers = [[-5, -50.6, 10, 4.2], [-3.8, -54.2, 7.6, 3.6], [-2.6, -57.4, 5.2, 3.2]];
    for (const t of tiers) {
      c.fillStyle = lin(c, 0, t[1], 0, t[1] + t[3], ['#fffbe8', '#ffe9a6', '#f0c766']); c.fillRect(t[0], t[1], t[2], t[3]);
      c.beginPath(); c.moveTo(t[0], t[1]); c.lineTo(t[0] + t[2], t[1]); c.strokeStyle = GOLD.md; c.lineWidth = 0.7; c.stroke();
      c.beginPath(); for (let k = 1; k < 4; k++) { c.moveTo(t[0] + (t[2] * k) / 4, t[1]); c.lineTo(t[0] + (t[2] * k) / 4, t[1] + t[3]); } c.strokeStyle = 'rgba(150,104,30,.75)'; c.lineWidth = 0.3; c.stroke();
    }
    c.beginPath(); poly(c, [[-5, -46.4], [5, -46.4], [5, -50.6], [3.8, -50.6], [3.8, -54.2], [2.6, -54.2], [2.6, -57.4], [-2.6, -57.4], [-2.6, -54.2], [-3.8, -54.2], [-3.8, -50.6], [-5, -50.6]]);
    c.strokeStyle = GOLD.md; c.lineWidth = 0.55; c.stroke();
    fillPoly(c, [[-1.6, -57.4], [1.6, -57.4], [0.3, -61.5], [0, -63.5], [-0.3, -61.5]], gold(c, -1.6, -63, 1.6, -57));
  }
  function statueParts(c) {
    // stepped onyx plinth with gold edges and a half sunburst relief
    marbleBlock(c, -18, -5, 36, 5); c.fillStyle = gold(c, 0, -5.4, 0, -4.4); c.fillRect(-18, -5.4, 36, 1.0);
    marbleBlock(c, -14, -11, 28, 6); c.fillStyle = gold(c, 0, -11.4, 0, -10.4); c.fillRect(-14, -11.4, 28, 1.0);
    marbleBlock(c, -10, -27, 20, 16); c.fillStyle = gold(c, 0, -27.6, 0, -26.4); c.fillRect(-10.6, -27.8, 21.2, 1.3);
    c.save(); c.beginPath(); c.rect(-10, -26.4, 20, 15.4); c.clip();
    c.beginPath(); for (let k = 0; k <= 10; k++) { const a = PI + (k / 10) * PI; c.moveTo(Math.cos(a) * 2.2, -11.6 + Math.sin(a) * 2.2); c.lineTo(Math.cos(a) * 15, -11.6 + Math.sin(a) * 15); }
    c.strokeStyle = 'rgba(214,170,80,.85)'; c.lineWidth = 0.4; c.stroke();
    c.beginPath(); c.arc(0, -11.6, 2.4, PI, TAU); c.closePath(); c.fillStyle = gold(c, 0, -14, 0, -11.6); c.fill();
    c.beginPath(); c.arc(0, -11.6, 7, PI, TAU); c.strokeStyle = 'rgba(214,170,80,.6)'; c.lineWidth = 0.4; c.stroke();
    c.restore();
    c.beginPath(); c.rect(-9.2, -25.8, 18.4, 13.8); c.strokeStyle = 'rgba(214,170,80,.55)'; c.lineWidth = 0.3; c.stroke();
    // gilded sun-bearer figure
    const B = [[-1.2, -27.8], [1.2, -27.8], [2.4, -36], [3.2, -42], [2.2, -47], [4.3, -53.4], [1.9, -55.2], [-1.9, -55.2], [-4.3, -53.4], [-2.2, -47], [-3.2, -42], [-2.4, -36]];
    fillPoly(c, B, gold(c, -4, -55, 4, -28));
    c.beginPath(); c.moveTo(-3.6, -53.4); c.lineTo(-6.8, -63.4); c.lineTo(-5.4, -64.0); c.lineTo(-2.4, -55.0); c.closePath();
    c.moveTo(3.6, -53.4); c.lineTo(6.8, -63.4); c.lineTo(5.4, -64.0); c.lineTo(2.4, -55.0); c.closePath(); c.fillStyle = gold(c, -6, -64, 6, -53); c.fill();
    c.beginPath(); c.arc(0, -58.4, 2.7, 0, TAU); c.fillStyle = gold(c, -2, -61, 2, -56); c.fill();
    c.beginPath(); c.moveTo(-1.1, -28.6); c.lineTo(-2.2, -36); c.lineTo(-2.9, -42); c.lineTo(-2.0, -47); c.lineTo(-3.9, -53.2); c.strokeStyle = 'rgba(255,248,215,.85)'; c.lineWidth = 0.35; c.stroke();
    c.beginPath(); c.moveTo(0, -27.8); c.lineTo(0, -40); c.strokeStyle = 'rgba(90,61,16,.55)'; c.lineWidth = 0.3; c.stroke();
    // the sun disc held above the head
    const sy = -70.5;
    c.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU, r1 = k & 1 ? 8.0 : 10.4; c.moveTo(Math.cos(a) * 5.4, sy + Math.sin(a) * 5.4); c.lineTo(Math.cos(a) * r1, sy + Math.sin(a) * r1); }
    c.lineWidth = 1.0; c.strokeStyle = GOLD.md; c.stroke(); c.lineWidth = 0.35; c.strokeStyle = GOLD.hi; c.stroke();
    c.beginPath(); c.arc(0, sy, 5.4, 0, TAU);
    const g = c.createRadialGradient(-1.4, sy - 1.6, 0.5, 0, sy, 5.6); g.addColorStop(0, '#fffbe6'); g.addColorStop(0.45, '#f1cf72'); g.addColorStop(1, '#94671f');
    c.fillStyle = g; c.fill();
    c.beginPath(); c.arc(0, sy, 3.2, 0, TAU); c.strokeStyle = GOLD.dk; c.lineWidth = 0.35; c.stroke();
  }
  function octo(cx, cy, rx, ry) {
    const p = [];
    for (let k = 0; k < 8; k++) { const a = ((k + 0.5) / 8) * TAU; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return p;
  }
  function fountainParts(c) {
    const rim = octo(0, -4, 28, 10.5);
    // front faces of the basin
    const fr = rim.filter((p) => p[1] > -4.5);
    c.beginPath(); c.moveTo(rim[7][0], rim[7][1]);
    for (const k of [0, 1, 2, 3, 4]) c.lineTo(rim[k][0], rim[k][1]);
    for (const k of [4, 3, 2, 1, 0]) c.lineTo(rim[k][0], rim[k][1] + 6);
    c.lineTo(rim[7][0], rim[7][1] + 6); c.closePath();
    c.fillStyle = lin(c, -28, 0, 28, 0, ['#cdbd98', '#f7efdc', '#e4d7b8', '#b6a47c']); c.fill();
    void fr;
    c.beginPath(); for (const k of [7, 0, 1, 2, 3, 4]) { const p = rim[k]; if (k === 7) c.moveTo(p[0], p[1] + 6); else c.lineTo(p[0], p[1] + 6); }
    c.strokeStyle = GOLD.md; c.lineWidth = 0.6; c.stroke();
    c.beginPath(); for (const k of [0, 1, 2, 3]) { const p = rim[k]; c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] + 6); } c.strokeStyle = 'rgba(150,120,70,.45)'; c.lineWidth = 0.4; c.stroke();
    // rim + water
    c.beginPath(); poly(c, rim); c.fillStyle = lin(c, 0, -15, 0, 7, ['#f7efdc', '#e0d2b0']); c.fill();
    const inner = octo(0, -4, 24.5, 8.6);
    c.beginPath(); poly(c, inner); c.fillStyle = lin(c, 0, -13, 0, 5, [C.waterDk, C.water, '#1d5873']); c.fill();
    c.save(); c.beginPath(); poly(c, inner); c.clip();
    c.beginPath(); for (const r of [7, 11.5, 16, 20.5]) { c.moveTo(r, -4); c.ellipse(0, -4, r, r * 0.36, 0, 0, TAU); }
    c.strokeStyle = 'rgba(143,214,207,.28)'; c.lineWidth = 0.4; c.stroke();
    c.restore();
    c.beginPath(); poly(c, rim); gl(c, 0.6);
    c.beginPath(); poly(c, inner); c.strokeStyle = GOLD.dk; c.lineWidth = 0.4; c.stroke();
    // stepped column
    marbleBlock(c, -4, -12, 8, 8, true); c.fillStyle = gold(c, 0, -12.3, 0, -11.5); c.fillRect(-4.3, -12.4, 8.6, 0.9);
    marbleBlock(c, -2.6, -24, 5.2, 12, true);
    c.beginPath(); c.moveTo(-1.3, -23); c.lineTo(-1.3, -12.5); c.moveTo(1.3, -23); c.lineTo(1.3, -12.5); c.strokeStyle = 'rgba(184,134,47,.7)'; c.lineWidth = 0.3; c.stroke();
    // scallop-shell bowl
    c.beginPath(); c.moveTo(-10, -24.5); c.lineTo(10, -24.5); c.lineTo(6.5, -21); c.lineTo(-6.5, -21); c.closePath(); c.fillStyle = lin(c, 0, -25, 0, -21, ['#f7efdc', '#cdbd98']); c.fill();
    c.beginPath(); for (let k = -4; k <= 4; k++) { c.moveTo(k * 2.3, -24.5); c.lineTo(k * 1.5, -21.1); } c.strokeStyle = GOLD.md; c.lineWidth = 0.35; c.stroke();
    c.beginPath(); c.ellipse(0, -24.6, 10, 2.2, 0, 0, TAU); c.fillStyle = lin(c, 0, -26.8, 0, -22.4, ['#1d5873', C.waterDk]); c.fill(); gl(c, 0.45);
    // finial
    marbleBlock(c, -1.3, -30.5, 2.6, 5.6, true);
    c.beginPath(); c.arc(0, -31.6, 1.5, 0, TAU); c.fillStyle = gold(c, -1.5, -33, 1.5, -30); c.fill();
  }
  function palmParts(c) {
    // stepped planter
    marbleBlock(c, -7.5, -8, 15, 8);
    c.fillStyle = gold(c, 0, -8.8, 0, -7.6); c.fillRect(-8.3, -8.8, 16.6, 1.3);
    c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(-5.6 + k * 0.8, -6 + k * 1.6); c.lineTo(0, -3.2 + k * 1.6); c.lineTo(5.6 - k * 0.8, -6 + k * 1.6); } c.strokeStyle = 'rgba(214,170,80,.85)'; c.lineWidth = 0.4; c.stroke();
    // segmented trunk
    const top = [1.6, -47];
    for (let k = 0; k < 9; k++) {
      const t0 = k / 9, t1 = (k + 1) / 9;
      const x0 = top[0] * t0 * t0, y0 = -8.5 + (top[1] + 8.5) * t0, x1 = top[0] * t1 * t1, y1 = -8.5 + (top[1] + 8.5) * t1;
      const w0 = 2.2 - t0 * 0.7, w1 = 2.2 - t1 * 0.7;
      c.beginPath(); c.moveTo(x0 - w0, y0); c.lineTo(x1 - w1 - 0.4, y1 + 0.3); c.lineTo(x1 + w1 + 0.4, y1 + 0.3); c.lineTo(x0 + w0, y0); c.closePath();
      c.fillStyle = lin(c, x0 - w0, 0, x0 + w0, 0, ['#6a5c46', '#3a2f22', '#1a140e']); c.fill();
      c.beginPath(); c.moveTo(x1 - w1 - 0.4, y1 + 0.3); c.lineTo(x1 + w1 + 0.4, y1 + 0.3); c.strokeStyle = GOLD.md; c.lineWidth = 0.4; c.stroke();
    }
    // fan of straight-edged fronds
    const frond = (a, len, wid, back) => {
      const bx = top[0], by = top[1];
      const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
      const droop = Math.max(0, dx * dx) * len * 0.22;
      const tx = bx + dx * len, ty = by + dy * len + droop;
      const mx = bx + dx * len * 0.45, my = by + dy * len * 0.45 + droop * 0.3;
      const pts = [[bx, by], [mx + nx * wid, my + ny * wid], [tx, ty], [mx - nx * wid, my - ny * wid]];
      c.beginPath(); poly(c, pts);
      c.fillStyle = back ? lin(c, bx, by, tx, ty, ['#0e4a40', '#082a24']) : lin(c, bx, by, tx, ty, [C.jade, C.emer2, C.emer]); c.fill();
      c.beginPath();
      for (let k = 1; k < 6; k++) {
        const t = k / 6, px = bx + (tx - bx) * t, py = by + (ty - by) * t, w = wid * (t < 0.45 ? t / 0.45 : (1 - t) / 0.55);
        c.moveTo(px + nx * w, py + ny * w); c.lineTo(px + (tx - bx) * 0.06, py + (ty - by) * 0.06); c.lineTo(px - nx * w, py - ny * w);
      }
      c.strokeStyle = back ? 'rgba(10,30,26,.7)' : 'rgba(7,40,34,.75)'; c.lineWidth = 0.35; c.stroke();
      c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.strokeStyle = back ? 'rgba(184,134,47,.6)' : GOLD.lt; c.lineWidth = 0.45; c.stroke();
    };
    for (const a of [-2.75, -1.95, -1.2, -0.4]) frond(a, 19, 3.2, true);
    for (const a of [-3.05, -2.4, -1.57, -0.75, -0.1]) frond(a, 22, 3.6, false);
    c.beginPath(); c.arc(top[0] - 1.4, top[1] + 1.6, 1.0, 0, TAU); c.arc(top[0] + 1.2, top[1] + 1.9, 1.0, 0, TAU); c.arc(top[0], top[1] + 2.9, 1.0, 0, TAU);
    c.fillStyle = gold(c, 0, top[1], 0, top[1] + 4); c.fill();
  }
  function fanUrnParts(c) {
    // fan leaf
    const cx = 0, cy = -14.5, R = 15;
    for (let k = 0; k < 9; k++) {
      const a0 = PI + (k / 9) * PI, a1 = PI + ((k + 1) / 9) * PI;
      c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a0, a1); c.closePath();
      c.fillStyle = k & 1 ? lin(c, cx, cy - R, cx, cy, [C.emer2, C.emer]) : lin(c, cx, cy - R, cx, cy, [C.jadeHi, C.jade, C.emer2]); c.fill();
    }
    c.beginPath(); for (let k = 1; k < 9; k++) { const a = PI + (k / 9) * PI; c.moveTo(cx + Math.cos(a) * 3.8, cy + Math.sin(a) * 3.8); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
    c.strokeStyle = GOLD.line; c.lineWidth = 0.35; c.stroke();
    c.beginPath(); c.arc(cx, cy, R, PI, TAU); gl(c, 0.6);
    c.beginPath(); c.arc(cx, cy, 9.5, PI, TAU); c.strokeStyle = 'rgba(214,170,80,.6)'; c.lineWidth = 0.35; c.stroke();
    c.beginPath(); c.arc(cx, cy, 3.8, PI, TAU); c.closePath(); c.fillStyle = gold(c, 0, cy - 4, 0, cy); c.fill();
    // deco vase
    const V = [[-7, -14.6], [7, -14.6], [4.4, -4], [2.4, -3], [-2.4, -3], [-4.4, -4]];
    fillPoly(c, V, lin(c, -7, 0, 7, 0, ['#2b2d36', '#0b0c10', '#1a1b21', '#060709']));
    c.beginPath(); for (let k = 0; k < 3; k++) { const y = -12 + k * 2.4; c.moveTo(-5.4 + k * 0.7, y); c.lineTo(0, y + 2.2); c.lineTo(5.4 - k * 0.7, y); } c.strokeStyle = 'rgba(214,170,80,.9)'; c.lineWidth = 0.38; c.stroke();
    c.fillStyle = gold(c, 0, -15.4, 0, -14); c.fillRect(-7.6, -15.4, 15.2, 1.3);
    marbleBlock(c, -3.4, -3, 6.8, 3); c.fillStyle = gold(c, 0, -3.2, 0, -2.5); c.fillRect(-3.6, -3.2, 7.2, 0.7);
  }
  function topiaryParts(c) {
    // ivory planter cube with an onyx diamond inlay
    marbleBlock(c, -7.5, -9.5, 15, 9.5, true);
    c.beginPath(); c.rect(-6.6, -8.6, 13.2, 7.7); c.strokeStyle = GOLD.md; c.lineWidth = 0.4; c.stroke();
    fillPoly(c, [[0, -8], [3.2, -4.7], [0, -1.4], [-3.2, -4.7]], '#0d0e12');
    c.beginPath(); poly(c, [[0, -8], [3.2, -4.7], [0, -1.4], [-3.2, -4.7]]); c.strokeStyle = GOLD.lt; c.lineWidth = 0.35; c.stroke();
    c.fillStyle = gold(c, 0, -10.2, 0, -9.2); c.fillRect(-8, -10.2, 16, 1.0);
    // stepped cypress
    const tiers = [[11, -10, -19.5], [9, -19.5, -28.5], [7, -28.5, -36.5], [5, -36.5, -43.5], [3.2, -43.5, -48.5]];
    for (const t of tiers) {
      const hw = t[0] / 2;
      c.fillStyle = lin(c, -hw, 0, hw, 0, [C.jade, C.emer2, C.emer, '#08302a']); c.fillRect(-hw, t[2], t[0], t[1] - t[2]);
      c.beginPath(); for (let y = t[2] + 2.2; y < t[1] - 0.6; y += 2.2) { c.moveTo(-hw + 0.6, y); c.lineTo(0, y + 1.1); c.lineTo(hw - 0.6, y); } c.strokeStyle = 'rgba(4,30,25,.55)'; c.lineWidth = 0.35; c.stroke();
      c.beginPath(); c.moveTo(-hw, t[2]); c.lineTo(hw, t[2]); gl(c, 0.42);
    }
    fillPoly(c, [[-1.6, -48.5], [1.6, -48.5], [0, -53.5]], gold(c, -1.6, -53, 1.6, -48.5));
  }
  const PROP_FN = { lamp: lampParts, statue: statueParts, fountain: fountainParts, palm: palmParts, 'fan-urn': fanUrnParts, topiary: topiaryParts };

  /* ============================================================== effects */
  function dartParts(c) {
    c.beginPath();
    for (const y of [-1.7, 0, 1.7]) { c.moveTo(-4.5, y); c.lineTo(-15, y * 1.25); }
    const g = c.createLinearGradient(-4, 0, -15, 0); g.addColorStop(0, 'rgba(255,232,160,.9)'); g.addColorStop(1, 'rgba(255,232,160,0)');
    c.strokeStyle = g; c.lineWidth = 0.55; c.stroke();
    const pts = [[6.4, 0], [0.6, -1.9], [-4.6, -1.1], [-3.4, 0], [-4.6, 1.1], [0.6, 1.9]];
    fillPoly(c, pts, gold(c, 0, -1.9, 0, 1.9));
    c.beginPath(); poly(c, pts); c.strokeStyle = GOLD.dk; c.lineWidth = 0.35; c.stroke();
    c.beginPath(); c.moveTo(5.6, 0); c.lineTo(-3.0, 0); c.strokeStyle = GOLD.hi; c.lineWidth = 0.35; c.stroke();
  }
  function sunParts(c) {
    c.beginPath();
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU, r1 = k & 1 ? 6.6 : 8.6, w = 0.18;
      c.moveTo(Math.cos(a - w) * 4.2, Math.sin(a - w) * 4.2); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.lineTo(Math.cos(a + w) * 4.2, Math.sin(a + w) * 4.2);
    }
    c.fillStyle = gold(c, -8, -8, 8, 8); c.fill(); c.strokeStyle = GOLD.dk; c.lineWidth = 0.3; c.stroke();
    c.beginPath(); c.arc(0, 0, 4.4, 0, TAU); c.fillStyle = gold(c, -4, -4, 4, 4); c.fill(); c.strokeStyle = GOLD.dk; c.lineWidth = 0.35; c.stroke();
    c.beginPath(); c.arc(0, 0, 2.5, 0, TAU);
    const g = c.createRadialGradient(-0.6, -0.8, 0.2, 0, 0, 2.6); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#fff3c8'); g.addColorStop(1, '#e8c060');
    c.fillStyle = g; c.fill();
  }
  function emeraldParts(c) {
    const o = (s) => [[-2.3 * s, -4.4 * s], [2.3 * s, -4.4 * s], [3.4 * s, -3.2 * s], [3.4 * s, 3.2 * s], [2.3 * s, 4.4 * s], [-2.3 * s, 4.4 * s], [-3.4 * s, 3.2 * s], [-3.4 * s, -3.2 * s]];
    fillPoly(c, o(1), lin(c, -3, -4, 3, 4, ['#7ee6c6', '#1f9a80', '#07463b']));
    fillPoly(c, o(0.66), lin(c, 3, -3, -3, 3, ['#9cf0d6', '#2fb294', '#0d5b4c']));
    fillPoly(c, o(0.34), lin(c, -1, -1.5, 1, 1.5, ['#e4fff4', '#5fd3b2']));
    c.beginPath(); const a = o(1), b = o(0.34); for (let k = 0; k < 8; k++) { c.moveTo(a[k][0], a[k][1]); c.lineTo(b[k][0], b[k][1]); }
    c.strokeStyle = 'rgba(220,255,240,.4)'; c.lineWidth = 0.22; c.stroke();
    c.beginPath(); poly(c, o(1.02)); gl(c, 0.5);
  }
  function asscherParts(c) {
    const sq = (s) => { const r = 6 * s, q = 2.0 * s; return [[0, -r], [q, -r + q], [r - q, -q], [r, 0], [r - q, q], [q, r - q], [0, r], [-q, r - q], [-r + q, q], [-r, 0], [-r + q, -q], [-q, -r + q]]; };
    const dia = (s) => [[0, -6 * s], [6 * s, 0], [0, 6 * s], [-6 * s, 0]];
    fillPoly(c, dia(1), lin(c, -5, -5, 5, 5, ['#ffffff', '#dfe9e6', '#9fb6b2']));
    fillPoly(c, dia(0.7), lin(c, 5, -5, -5, 5, ['#f4fbf8', '#bdd3cf', '#eef6f3']));
    fillPoly(c, dia(0.42), lin(c, -3, -3, 3, 3, ['#ffffff', '#cfe3df']));
    c.beginPath(); for (const p of dia(1)) { c.moveTo(p[0], p[1]); c.lineTo(p[0] * 0.42, p[1] * 0.42); }
    c.moveTo(-3, -3); c.lineTo(3, 3); c.moveTo(3, -3); c.lineTo(-3, 3);
    c.strokeStyle = 'rgba(80,110,110,.35)'; c.lineWidth = 0.25; c.stroke();
    void sq;
    c.beginPath(); poly(c, dia(1.06)); gl(c, 0.7);
    c.beginPath(); for (const p of dia(1.08)) { c.moveTo(p[0] + 0.9, p[1]); c.arc(p[0], p[1], 0.9, 0, TAU); } c.fillStyle = gold(c, 0, -7, 0, 7); c.fill();
  }
  function glintParts(c) {
    c.beginPath(); c.moveTo(0, -4.8); c.lineTo(0.7, -0.7); c.lineTo(4.8, 0); c.lineTo(0.7, 0.7); c.lineTo(0, 4.8); c.lineTo(-0.7, 0.7); c.lineTo(-4.8, 0); c.lineTo(-0.7, -0.7); c.closePath();
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 4.8); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#fff0b8'); g.addColorStop(1, '#e2b553');
    c.fillStyle = g; c.fill();
    c.beginPath(); c.moveTo(-2.2, -2.2); c.lineTo(2.2, 2.2); c.moveTo(2.2, -2.2); c.lineTo(-2.2, 2.2); c.strokeStyle = 'rgba(255,240,184,.8)'; c.lineWidth = 0.35; c.stroke();
  }
  function radial(box, stops) {
    return mk(box, (c) => {
      const r = box[2];
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
      stops.forEach((s) => g.addColorStop(s[0], s[1]));
      c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
    });
  }

  /* ================================================================ ground */
  const BAY = 200, WALK = 14, IN = BAY - 2 * WALK;
  const FORCE = { '-1,-1': 'garden', '0,-1': 'medallion', '-1,0': 'pool', '0,0': 'harlequin', '1,0': 'scallop', '1,-1': 'chevron', '1,1': 'medallion', '0,1': 'garden', '-1,1': 'scallop', '2,0': 'garden', '2,1': 'pool' };
  function bayType(i, j) {
    const f = FORCE[i + ',' + j];
    if (f) return f;
    const h = U.hash2(i, j, 7731);
    return h < 0.25 ? 'medallion' : h < 0.42 ? 'harlequin' : h < 0.57 ? 'scallop' : h < 0.7 ? 'pool' : h < 0.87 ? 'garden' : 'chevron';
  }
  function marbleTex(size, base, cloud, vein, vein2, seed) {
    const b = U.hex(base), cl = U.hex(cloud), v1 = U.hex(vein), v2 = U.hex(vein2);
    return U.texture(size, size, (x, y, o) => {
      const u = x / size, v = y / size;
      const n = U.fbmTile(u * 4, v * 4, 4, seed, 4);
      const n2 = U.fbmTile(u * 6 + 3, v * 6 + 1, 6, seed + 9, 3);
      const t = u * 2 + v + n * 1.7;
      const s1 = Math.pow(1 - Math.abs(Math.sin(t * TAU)), 16);
      const t2 = u - v * 2 + n2 * 1.3;
      const s2 = Math.pow(1 - Math.abs(Math.sin(t2 * TAU)), 26) * 0.7;
      const k = U.smoothstep(0.3, 0.75, n);
      for (let i = 0; i < 3; i++) {
        let c = b[i] + (cl[i] - b[i]) * k;
        c += (v1[i] - c) * s1 * 0.85;
        c += (v2[i] - c) * s2;
        o[i] = c;
      }
    });
  }
  function terrazzoTex(size, seed) {
    const tex = U.texture(size, size, (x, y, o) => {
      const n = U.fbmTile((x / size) * 4, (y / size) * 4, 4, seed, 3);
      o[0] = 20 + n * 12; o[1] = 30 + n * 14; o[2] = 58 + n * 20;
    });
    const ctx = tex.canvas.getContext('2d');
    const rng = U.rng(seed);
    const cols = [['#d9ccaa', 0.1], ['#c4953e', 0.08], ['#2c7d6a', 0.12], ['#0b1020', 0.3], ['#33467a', 0.4]];
    for (let i = 0; i < 1100; i++) {
      let r = rng.next(), col = cols[cols.length - 1][0];
      for (const cc of cols) { if (r < cc[1]) { col = cc[0]; break; } r -= cc[1]; }
      const x = rng.next() * size, y = rng.next() * size, rad = 0.5 + rng.next() * rng.next() * 2.6, n = 3 + ((rng.next() * 3) | 0), rot = rng.next() * TAU;
      const pts = []; for (let k = 0; k < n; k++) { const a = rot + (k / n) * TAU + rng.next() * 0.6; const rr = rad * (0.6 + rng.next() * 0.5); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      ctx.fillStyle = col;
      U.tileDraw(ctx, size, size, (k, ox, oy) => { k.beginPath(); k.moveTo(x + ox + pts[0][0], y + oy + pts[0][1]); for (let q = 1; q < n; q++) k.lineTo(x + ox + pts[q][0], y + oy + pts[q][1]); k.closePath(); k.fill(); });
    }
    return tex;
  }
  function pattern(ctx, tex, sc, rot, ox, oy) {
    const p = ctx.createPattern(tex.canvas, 'repeat');
    let m = new DOMMatrix();
    m = m.translate(ox || 0, oy || 0);
    if (rot) m = m.rotate(rot);
    m = m.scale(sc);
    p.setTransform(m);
    return p;
  }
  function pats(ctx) {
    return {
      onyx: pattern(ctx, TEX.onyx, 0.62), emer: pattern(ctx, TEX.emer, 0.55), night: pattern(ctx, TEX.night, 0.6),
      ivory: pattern(ctx, TEX.ivory, 0.5), terr: pattern(ctx, TEX.terr, 0.42),
    };
  }
  function bayPat(ctx, tex, sc, i, j, salt) {
    const h = U.hashInt(i, j, salt);
    return pattern(ctx, tex, sc, (h & 3) * 90, (h >>> 4) % 97, (h >>> 12) % 89);
  }
  /** Common bay frame: onyx field with gold double border and stepped corners. Returns the inner field. */
  function frameField(c, P, x0, y0, x1, y1) {
    c.beginPath(); stepRect(c, x0, y0, x1, y1, 7); c.fillStyle = P.bonyx; c.fill();
    c.beginPath(); stepRect(c, x0 + 2.4, y0 + 2.4, x1 - 2.4, y1 - 2.4, 6.4); gl(c, 1.25);
    c.beginPath(); stepRect(c, x0 + 7, y0 + 7, x1 - 7, y1 - 7, 5); pin(c, 0.45);
    return { x0: x0 + 9.5, y0: y0 + 9.5, x1: x1 - 9.5, y1: y1 - 9.5, s: 4.5 };
  }
  function clipField(c, f) { c.save(); c.beginPath(); stepRect(c, f.x0, f.y0, f.x1, f.y1, f.s); c.clip(); }

  function bayMedallion(c, P, bx, by) {
    const f = frameField(c, P, bx + WALK, by + WALK, bx + BAY - WALK, by + BAY - WALK);
    const cx = bx + BAY / 2, cy = by + BAY / 2;
    clipField(c, f);
    // corner fans
    const corners = [[f.x0, f.y0, 0], [f.x1, f.y0, 0.5], [f.x1, f.y1, 1], [f.x0, f.y1, 1.5]];
    for (const q of corners) {
      const a0 = q[2] * PI;
      for (let k = 0; k < 6; k++) {
        c.beginPath(); c.moveTo(q[0], q[1]); c.arc(q[0], q[1], 32, a0 + (k / 6) * PI * 0.5, a0 + ((k + 1) / 6) * PI * 0.5); c.closePath();
        c.fillStyle = k & 1 ? P.bonyx : P.bemer; c.fill();
      }
      c.beginPath(); for (let k = 1; k < 6; k++) { const a = a0 + (k / 6) * PI * 0.5; c.moveTo(q[0] + Math.cos(a) * 7, q[1] + Math.sin(a) * 7); c.lineTo(q[0] + Math.cos(a) * 32, q[1] + Math.sin(a) * 32); }
      pin(c, 0.4);
      c.beginPath(); c.arc(q[0], q[1], 32, a0, a0 + PI / 2); gl(c, 0.9);
      c.beginPath(); c.arc(q[0], q[1], 22, a0, a0 + PI / 2); pin(c, 0.45);
      c.beginPath(); c.moveTo(q[0], q[1]); c.arc(q[0], q[1], 7, a0, a0 + PI / 2); c.closePath(); c.fillStyle = P.ivory; c.fill(); pin(c, 0.5);
    }
    c.restore();
    // sunburst medallion
    const R = 58;
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fillStyle = P.bonyx; c.fill();
    c.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU - PI / 2, w = 0.105;
      c.moveTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15);
      c.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R);
      c.arc(cx, cy, R, a - w, a + w);
      c.closePath();
    }
    c.fillStyle = P.bemer; c.fill(); pin(c, 0.45);
    c.beginPath();
    for (let k = 0; k < 16; k++) { const a = ((k + 0.5) / 16) * TAU - PI / 2; c.moveTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); c.lineTo(cx + Math.cos(a) * (R - 5), cy + Math.sin(a) * (R - 5)); }
    pin(c, 0.55, GOLD.lt);
    c.beginPath(); c.arc(cx, cy, 40, 0, TAU); pin(c, 0.5);
    ringG(c, cx, cy, R, 3.4);
    c.beginPath(); for (let k = 0; k < 32; k++) { const a = (k / 32) * TAU; const x = cx + Math.cos(a) * (R + 5.6), y = cy + Math.sin(a) * (R + 5.6); c.moveTo(x + 1, y); c.arc(x, y, 1.0, 0, TAU); }
    c.fillStyle = gold(c, cx, cy - R, cx, cy + R); c.fill();
    c.beginPath(); c.arc(cx, cy, R + 9.5, 0, TAU); pin(c, 0.5);
    c.beginPath(); c.arc(cx, cy, 14, 0, TAU); c.fillStyle = P.ivory; c.fill();
    ringG(c, cx, cy, 14, 2.4);
    c.beginPath(); starPath(c, cx, cy, 8, 11.5, 4.4, -PI / 2);
    const sg = c.createRadialGradient(cx - 2, cy - 3, 0.5, cx, cy, 12); sg.addColorStop(0, GOLD.hi); sg.addColorStop(0.5, '#e2b553'); sg.addColorStop(1, '#8a611d');
    c.fillStyle = sg; c.fill(); c.strokeStyle = GOLD.dk; c.lineWidth = 0.35; c.stroke();
    c.beginPath(); c.arc(cx, cy, 2.4, 0, TAU); c.fillStyle = C.onyx; c.fill(); pin(c, 0.45, GOLD.lt);
  }
  function bayHarlequin(c, P, bx, by) {
    const f = frameField(c, P, bx + WALK, by + WALK, bx + BAY - WALK, by + BAY - WALK);
    clipField(c, f);
    c.fillStyle = P.bemer; c.fillRect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0);
    const d = 12;
    const b0 = Math.floor((f.y0 - by) / d) - 1, b1 = Math.ceil((f.y1 - by) / d) + 1;
    const a0 = Math.floor((f.x0 - bx) / (2 * d)) - 1, a1 = Math.ceil((f.x1 - bx) / (2 * d)) + 1;
    c.beginPath();
    const studs = [];
    for (let b = b0; b <= b1; b++) {
      for (let a = a0; a <= a1; a++) {
        const x = bx + (2 * a + (b & 1)) * d, y = by + b * d;
        if (!(b & 1)) { c.moveTo(x, y - d); c.lineTo(x + d, y); c.lineTo(x, y + d); c.lineTo(x - d, y); c.closePath(); }
        studs.push(x, y - d);
      }
    }
    c.fillStyle = P.bonyx; c.fill();
    c.beginPath();
    const s0 = bx + by, dm = bx - by;
    for (let k = -20; k <= 20; k++) {
      const s = s0 + d * (2 * k + 1);
      if (s < f.x0 + f.y0 - 2 || s > f.x1 + f.y1 + 2) continue;
      c.moveTo(f.x0 - 5, s - f.x0 + 5); c.lineTo(f.x1 + 5, s - f.x1 - 5);
    }
    for (let k = -20; k <= 20; k++) {
      const s = dm + d * (2 * k + 1);
      if (s < f.x0 - f.y1 - 2 || s > f.x1 - f.y0 + 2) continue;
      c.moveTo(f.x0 - 5, f.x0 - 5 - s); c.lineTo(f.x1 + 5, f.x1 + 5 - s);
    }
    pin(c, 0.5);
    c.beginPath();
    for (let i = 0; i < studs.length; i += 2) { const x = studs[i], y = studs[i + 1]; c.moveTo(x, y - 1.7); c.lineTo(x + 1.7, y); c.lineTo(x, y + 1.7); c.lineTo(x - 1.7, y); c.closePath(); }
    c.fillStyle = '#e9dcc0'; c.fill();
    c.restore();
  }
  function bayScallop(c, P, bx, by) {
    const f = frameField(c, P, bx + WALK, by + WALK, bx + BAY - WALK, by + BAY - WALK);
    clipField(c, f);
    c.fillStyle = P.night; c.fillRect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0);
    const r = 12, dy = r * 0.92;
    const r0 = Math.floor((f.y0 - by) / dy) - 1, r1 = Math.ceil((f.y1 - by) / dy) + 1;
    for (let row = r0; row <= r1; row++) {
      const y = by + row * dy, off = row & 1 ? r : 0;
      const alt = row & 1;
      for (let a = Math.floor((f.x0 - bx - off) / (2 * r)) - 1; a <= Math.ceil((f.x1 - bx - off) / (2 * r)) + 1; a++) {
        const x = bx + off + a * 2 * r;
        const g = c.createLinearGradient(x, y - r, x, y + r * 0.2);
        if (alt) { g.addColorStop(0, '#2a9c84'); g.addColorStop(0.55, '#125447'); g.addColorStop(1, '#0a2e2a'); }
        else { g.addColorStop(0, '#3a5a9e'); g.addColorStop(0.55, '#172a52'); g.addColorStop(1, '#0b1428'); }
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = g; c.fill();
        c.beginPath(); for (let k = 1; k < 6; k++) { const an = PI + (k / 6) * PI; c.moveTo(x + Math.cos(an) * r * 0.3, y + Math.sin(an) * r * 0.3); c.lineTo(x + Math.cos(an) * r * 0.62, y + Math.sin(an) * r * 0.62); }
        c.moveTo(x + r * 0.62, y); c.arc(x, y, r * 0.62, 0, PI, true);
        c.strokeStyle = 'rgba(214,170,80,.55)'; c.lineWidth = 0.35; c.stroke();
        c.beginPath(); c.arc(x, y, r * 0.3, PI, TAU); c.closePath(); c.fillStyle = 'rgba(230,193,90,.85)'; c.fill();
        c.beginPath(); c.arc(x, y, r - 0.3, PI * 1.0, TAU); c.strokeStyle = GOLD.md; c.lineWidth = 0.7; c.stroke(); c.strokeStyle = 'rgba(255,240,184,.55)'; c.lineWidth = 0.22; c.stroke();
      }
    }
    c.restore();
  }
  function bayChevron(c, P, bx, by) {
    const f = frameField(c, P, bx + WALK, by + WALK, bx + BAY - WALK, by + BAY - WALK);
    const cx = bx + BAY / 2, cy = by + BAY / 2;
    clipField(c, f);
    const h = 13, per = 26, amp = 6.5;
    const fills = [P.bonyx, P.bemer, P.bonyx, P.night];
    const zig = (x, y) => y + amp * (1 - 2 * Math.abs(((((x - bx) / per) % 1) + 1) % 1 - 0.5) * 2);
    const k0 = Math.floor((f.y0 - by - amp * 2) / h), k1 = Math.ceil((f.y1 - by + amp) / h);
    for (let k = k0; k <= k1; k++) {
      const y = by + k * h;
      c.beginPath();
      c.moveTo(f.x0 - 2, zig(f.x0 - 2, y));
      for (let x = Math.ceil((f.x0 - bx) / (per / 2)) * (per / 2) + bx; x <= f.x1 + per / 2; x += per / 2) c.lineTo(x, zig(x, y));
      for (let x = Math.floor((f.x1 + per / 2 - bx) / (per / 2)) * (per / 2) + bx; x >= f.x0 - per / 2; x -= per / 2) c.lineTo(x, zig(x, y + h));
      c.closePath();
      c.fillStyle = fills[((k % 4) + 4) % 4]; c.fill();
      c.beginPath(); c.moveTo(f.x0 - per, zig(f.x0 - per, y));
      for (let x = Math.ceil((f.x0 - per - bx) / (per / 2)) * (per / 2) + bx; x <= f.x1 + per; x += per / 2) c.lineTo(x, zig(x, y));
      c.strokeStyle = GOLD.md; c.lineWidth = 0.6; c.stroke(); c.strokeStyle = 'rgba(255,240,184,.5)'; c.lineWidth = 0.2; c.stroke();
    }
    c.restore();
    // central inlay: ivory diamond, onyx diamond, gold star
    const dpts = (r) => [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
    c.beginPath(); poly(c, dpts(30)); c.fillStyle = P.bonyx; c.fill(); gl(c, 1.0);
    c.beginPath(); poly(c, dpts(24)); c.fillStyle = P.ivory; c.fill(); pin(c, 0.5);
    c.beginPath(); poly(c, dpts(15)); c.fillStyle = P.bonyx; c.fill(); gl(c, 0.6);
    c.beginPath(); starPath(c, cx, cy, 4, 10, 2.6, -PI / 2); c.fillStyle = gold(c, cx - 8, cy - 10, cx + 8, cy + 10); c.fill();
  }
  function bayPool(c, P, bx, by) {
    const x0 = bx + WALK, y0 = by + WALK, x1 = bx + BAY - WALK, y1 = by + BAY - WALK, cx = bx + BAY / 2, cy = by + BAY / 2;
    c.beginPath(); stepRect(c, x0, y0, x1, y1, 7); c.fillStyle = P.ivory; c.fill();
    c.beginPath(); stepRect(c, x0 + 1.8, y0 + 1.8, x1 - 1.8, y1 - 1.8, 6.4); pin(c, 0.5, GOLD.md);
    const wx0 = x0 + 10, wy0 = y0 + 10, wx1 = x1 - 10, wy1 = y1 - 10;
    c.beginPath(); stepRect(c, wx0, wy0, wx1, wy1, 5);
    c.fillStyle = lin(c, wx0, wy0, wx1, wy1, ['#1a4b6b', C.water, C.waterDk]); c.fill();
    c.save(); c.clip();
    c.beginPath(); for (let r = 32; r < 100; r += 9) { c.moveTo(cx + r, cy); c.arc(cx, cy, r, 0, TAU); }
    c.strokeStyle = 'rgba(143,214,207,.14)'; c.lineWidth = 0.6; c.stroke();
    // deco wavelets in the corners
    c.beginPath();
    for (const q of [[wx0 + 16, wy0 + 16], [wx1 - 16, wy0 + 16], [wx1 - 16, wy1 - 16], [wx0 + 16, wy1 - 16]]) {
      for (let k = 0; k < 3; k++) { const yy = q[1] - 4 + k * 4; c.moveTo(q[0] - 8, yy); c.lineTo(q[0] - 4, yy - 2.2); c.lineTo(q[0], yy); c.lineTo(q[0] + 4, yy - 2.2); c.lineTo(q[0] + 8, yy); }
    }
    c.strokeStyle = 'rgba(160,226,216,.32)'; c.lineWidth = 0.6; c.stroke();
    const sh = c.createLinearGradient(wx0, wy0, wx1, wy1); sh.addColorStop(0.25, 'rgba(255,255,255,0)'); sh.addColorStop(0.4, 'rgba(200,240,235,.07)'); sh.addColorStop(0.55, 'rgba(255,255,255,0)');
    c.fillStyle = sh; c.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    c.restore();
    c.beginPath(); stepRect(c, wx0, wy0, wx1, wy1, 5); gl(c, 1.1);
  }
  function bayGarden(c, P, bx, by) {
    const x0 = bx + WALK, y0 = by + WALK, x1 = bx + BAY - WALK, y1 = by + BAY - WALK, cx = bx + BAY / 2, cy = by + BAY / 2;
    c.beginPath(); stepRect(c, x0, y0, x1, y1, 7); c.fillStyle = '#082219'; c.fill();
    c.beginPath(); stepRect(c, x0 + 2.4, y0 + 2.4, x1 - 2.4, y1 - 2.4, 6.4); gl(c, 1.0);
    const lx0 = x0 + 8, ly0 = y0 + 8, lx1 = x1 - 8, ly1 = y1 - 8;
    c.save(); c.beginPath(); stepRect(c, lx0, ly0, lx1, ly1, 5); c.clip();
    c.fillStyle = '#0f3a2b'; c.fillRect(lx0, ly0, lx1 - lx0, ly1 - ly0);
    c.beginPath(); for (let k = -16; k < 16; k += 2) { const s = bx + by + k * 12; c.moveTo(lx0 - 10, s - lx0 + 10); c.lineTo(lx1 + 10, s - lx1 - 10); c.lineTo(lx1 + 10, s + 12 - lx1 - 10); c.lineTo(lx0 - 10, s + 12 - lx0 + 10); c.closePath(); }
    c.fillStyle = '#123f2f'; c.fill();
    // parterre beds with radiating planting rows
    const bed = (qx0, qy0, qx1, qy1) => {
      c.beginPath(); stepRect(c, qx0, qy0, qx1, qy1, 4); c.fillStyle = '#0a2f23'; c.fill(); pin(c, 0.45);
      const mx = (qx0 + qx1) / 2, my = (qy0 + qy1) / 2;
      c.save(); c.beginPath(); stepRect(c, qx0 + 2, qy0 + 2, qx1 - 2, qy1 - 2, 3); c.clip();
      c.setLineDash([1.5, 1.7]);
      c.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; c.moveTo(mx + Math.cos(a) * 11, my + Math.sin(a) * 11); c.lineTo(mx + Math.cos(a) * 45, my + Math.sin(a) * 45); }
      c.strokeStyle = 'rgba(70,170,130,.55)'; c.lineWidth = 1.3; c.stroke();
      c.setLineDash([]);
      c.beginPath(); c.arc(mx, my, 9, 0, TAU); c.strokeStyle = 'rgba(214,170,80,.6)'; c.lineWidth = 0.45; c.stroke();
      c.restore();
    };
    bed(lx0 + 5, ly0 + 5, cx - 12, cy - 12); bed(cx + 12, ly0 + 5, lx1 - 5, cy - 12);
    bed(lx0 + 5, cy + 12, cx - 12, ly1 - 5); bed(cx + 12, cy + 12, lx1 - 5, ly1 - 5);
    // terrazzo cross paths
    c.fillStyle = P.terr; c.fillRect(cx - 7, ly0 - 2, 14, ly1 - ly0 + 4); c.fillRect(lx0 - 2, cy - 7, lx1 - lx0 + 4, 14);
    c.beginPath(); c.moveTo(cx - 7, ly0); c.lineTo(cx - 7, ly1); c.moveTo(cx + 7, ly0); c.lineTo(cx + 7, ly1); c.moveTo(lx0, cy - 7); c.lineTo(lx1, cy - 7); c.moveTo(lx0, cy + 7); c.lineTo(lx1, cy + 7);
    pin(c, 0.55, GOLD.md);
    c.restore();
    // round centre basin with an emerald star
    c.beginPath(); c.arc(cx, cy, 15, 0, TAU); c.fillStyle = P.ivory; c.fill(); ringG(c, cx, cy, 15, 2.2);
    c.beginPath(); c.arc(cx, cy, 10.5, 0, TAU); c.fillStyle = lin(c, cx, cy - 10, cx, cy + 10, ['#1a4b6b', C.waterDk]); c.fill(); pin(c, 0.45);
    c.beginPath(); starPath(c, cx, cy, 8, 7.5, 3, -PI / 2); c.fillStyle = lin(c, cx - 6, cy - 6, cx + 6, cy + 6, [C.jadeHi, C.jade, C.emer]); c.fill(); pin(c, 0.35, GOLD.lt);
  }
  const BAY_FN = { medallion: bayMedallion, harlequin: bayHarlequin, scallop: bayScallop, chevron: bayChevron, pool: bayPool, garden: bayGarden };

  function walkways(c, P, info) {
    const x0 = info.wx, y0 = info.wy, x1 = x0 + info.size, y1 = y0 + info.size;
    const vi0 = Math.ceil((x0 - WALK) / BAY), vi1 = Math.floor((x1 + WALK) / BAY);
    const hj0 = Math.ceil((y0 - WALK) / BAY), hj1 = Math.floor((y1 + WALK) / BAY);
    c.fillStyle = P.terr;
    for (let i = vi0; i <= vi1; i++) c.fillRect(i * BAY - WALK, y0 - 1, WALK * 2, info.size + 2);
    for (let j = hj0; j <= hj1; j++) c.fillRect(x0 - 1, j * BAY - WALK, info.size + 2, WALK * 2);
    // border lines
    c.beginPath();
    for (let i = vi0; i <= vi1; i++) for (const o of [-12.4, 12.4]) { c.moveTo(i * BAY + o, y0 - 2); c.lineTo(i * BAY + o, y1 + 2); }
    for (let j = hj0; j <= hj1; j++) for (const o of [-12.4, 12.4]) { c.moveTo(x0 - 2, j * BAY + o); c.lineTo(x1 + 2, j * BAY + o); }
    gl(c, 1.1);
    c.beginPath();
    for (let i = vi0; i <= vi1; i++) for (const o of [-9.6, 9.6]) { c.moveTo(i * BAY + o, y0 - 2); c.lineTo(i * BAY + o, y1 + 2); }
    for (let j = hj0; j <= hj1; j++) for (const o of [-9.6, 9.6]) { c.moveTo(x0 - 2, j * BAY + o); c.lineTo(x1 + 2, j * BAY + o); }
    pin(c, 0.4);
    // centre studs: little ivory lozenges every 20 units
    c.beginPath();
    for (let i = vi0; i <= vi1; i++) for (let y = Math.floor(y0 / 20) * 20 + 10; y < y1 + 20; y += 20) { const x = i * BAY; c.moveTo(x, y - 2.4); c.lineTo(x + 1.3, y); c.lineTo(x, y + 2.4); c.lineTo(x - 1.3, y); c.closePath(); }
    for (let j = hj0; j <= hj1; j++) for (let x = Math.floor(x0 / 20) * 20 + 10; x < x1 + 20; x += 20) { const y = j * BAY; c.moveTo(x - 2.4, y); c.lineTo(x, y - 1.3); c.lineTo(x + 2.4, y); c.lineTo(x, y + 1.3); c.closePath(); }
    c.fillStyle = 'rgba(233,220,192,.8)'; c.fill();
    // intersections: compass rosettes
    for (let i = vi0; i <= vi1; i++) {
      for (let j = hj0; j <= hj1; j++) {
        const x = i * BAY, y = j * BAY;
        c.fillStyle = P.terr; c.fillRect(x - WALK, y - WALK, WALK * 2, WALK * 2);
        c.beginPath(); c.rect(x - 12.4, y - 12.4, 24.8, 24.8); gl(c, 1.1);
        c.beginPath(); c.arc(x, y, 10.4, 0, TAU); c.fillStyle = P.onyx; c.fill();
        ringG(c, x, y, 10.4, 1.8);
        c.beginPath(); starPath(c, x, y, 8, 9.2, 3.0, -PI / 2);
        c.fillStyle = gold(c, x - 8, y - 9, x + 8, y + 9); c.fill();
        c.beginPath(); starPath(c, x, y, 4, 9.2, 2.2, -PI / 2); c.fillStyle = 'rgba(255,240,184,.55)'; c.fill();
        c.beginPath(); c.arc(x, y, 2.0, 0, TAU); c.fillStyle = C.ivory; c.fill();
      }
    }
  }

  /* ================================================================ icons */
  function icoShape(c, path, fill, ol) {
    c.beginPath(); path(c);
    c.lineJoin = 'miter'; c.miterLimit = 3;
    c.lineWidth = (ol || 1.6) * 2; c.strokeStyle = INK; c.stroke();
    c.fillStyle = fill; c.fill();
  }
  const heartPath = (s, ox, oy) => (k) => {
    const P_ = (x, y) => [ox + (x - 24) * s, oy + (y - 24) * s];
    const m = (x, y) => { const p = P_(x, y); k.moveTo(p[0], p[1]); };
    const b = (a, bb, cc, d, e, f) => { const p = P_(a, bb), q = P_(cc, d), r = P_(e, f); k.bezierCurveTo(p[0], p[1], q[0], q[1], r[0], r[1]); };
    m(24, 42); b(12, 33, 5, 26, 5, 17); b(5, 10, 10, 6, 15.5, 6); b(19.5, 6, 22.5, 8.5, 24, 12); b(25.5, 8.5, 28.5, 6, 32.5, 6); b(38, 6, 43, 10, 43, 17); b(43, 26, 36, 33, 24, 42); k.closePath();
  };
  const dartIco = (c, x, y, a, s) => {
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
    c.beginPath(); for (const yy of [-2.6, 0, 2.6]) { c.moveTo(-8, yy); c.lineTo(-17, yy); } c.lineCap = 'butt'; c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); c.lineWidth = 1.4; c.strokeStyle = GOLD.lt; c.stroke();
    icoShape(c, (k) => poly(k, [[12, 0], [2, -4.2], [-8, -2.6], [-6, 0], [-8, 2.6], [2, 4.2]]), gold(c, 0, -4, 0, 4), 1.3);
    c.beginPath(); c.moveTo(10, 0); c.lineTo(-5, 0); c.strokeStyle = GOLD.hi; c.lineWidth = 0.9; c.stroke();
    c.restore();
  };
  const ICONS = {
    'hp-heart'(c) {
      icoShape(c, heartPath(1, 24, 24), gold(c, 0, 6, 0, 42), 1.6);
      c.beginPath(); heartPath(0.74, 24, 24.6)(c); c.fillStyle = lin(c, 10, 10, 34, 38, [C.rubyHi, C.ruby, C.rubyDk]); c.fill();
      c.beginPath(); heartPath(0.5, 24, 25)(c); c.strokeStyle = 'rgba(255,210,150,.55)'; c.lineWidth = 1.0; c.stroke();
      c.beginPath(); c.moveTo(13, 15); c.lineTo(17.5, 11.6); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.lineCap = 'round'; c.stroke(); c.lineCap = 'butt';
    },
    kills(c) {
      c.beginPath(); for (const s of [-1, 1]) for (const yy of [21, 28, 35]) { c.moveTo(24 + s * 8, yy); c.lineTo(24 + s * 15, yy + (yy - 28) * 0.6 - 2); c.lineTo(24 + s * 17, yy + (yy - 28) * 0.9 + 1); }
      c.lineWidth = 4.2; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); c.lineWidth = 1.8; c.strokeStyle = GOLD.lt; c.stroke();
      c.beginPath(); for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; c.moveTo(24 + Math.cos(a) * 6.5, 9 + Math.sin(a) * 6.5); c.lineTo(24 + Math.cos(a) * 9, 9 + Math.sin(a) * 9); }
      c.lineWidth = 3.6; c.strokeStyle = INK; c.stroke(); c.lineWidth = 1.5; c.strokeStyle = GOLD.lt; c.stroke();
      icoShape(c, (k) => k.arc(24, 9, 5.6, 0, TAU), gold(c, 18, 3, 30, 15), 1.3);
      icoShape(c, (k) => k.ellipse(24, 18, 8.4, 4.8, 0, 0, TAU), lin(c, 0, 13, 0, 23, ['#3a3c46', '#0b0c10']), 1.3);
      icoShape(c, (k) => k.ellipse(24, 31.5, 11.5, 12.5, 0, 0, TAU), lin(c, 14, 20, 34, 44, [ENAMEL[0].hi, ENAMEL[0].base, ENAMEL[0].dk]), 1.4);
      c.beginPath(); c.moveTo(24, 19.5); c.lineTo(24, 44); c.strokeStyle = GOLD.lt; c.lineWidth = 1.6; c.stroke();
      c.beginPath(); c.ellipse(24, 31.5, 11.5, 12.5, 0, 0, TAU); c.strokeStyle = GOLD.md; c.lineWidth = 1.4; c.stroke();
      c.beginPath(); c.ellipse(18.6, 26, 3, 1.5, -0.6, 0, TAU); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
    },
    dmg(c) { dartIco(c, 25, 23, -PI / 4, 1.35); },
    rate(c) {
      for (let k = 0; k < 3; k++) {
        const x = 9 + k * 11;
        icoShape(c, (q) => poly(q, [[x, 10], [x + 6, 10], [x + 17, 24], [x + 6, 38], [x, 38], [x + 11, 24]]), gold(c, 0, 10, 0, 38), 1.3);
      }
    },
    multi(c) { for (const a of [-0.7, 0.7, 0]) dartIco(c, 24 + Math.sin(a) * 13, 40 - Math.cos(a) * 16, -PI / 2 + a, 0.9); },
    bounce(c) {
      c.beginPath(); c.moveTo(6, 40); c.lineTo(16, 16); c.lineTo(26, 34); c.lineTo(36, 12);
      c.lineJoin = 'miter'; c.lineWidth = 8.5; c.strokeStyle = INK; c.stroke(); c.lineWidth = 5; c.strokeStyle = gold(c, 0, 10, 0, 40); c.stroke(); c.lineWidth = 1.2; c.strokeStyle = GOLD.hi; c.stroke();
      icoShape(c, (q) => poly(q, [[41, 4], [43, 18], [30, 12]]), gold(c, 30, 4, 43, 18), 1.3);
      c.beginPath(); for (const p of [[16, 16], [26, 34]]) for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; c.moveTo(p[0] + Math.cos(a) * 5.5, p[1] + Math.sin(a) * 5.5); c.lineTo(p[0] + Math.cos(a) * 8, p[1] + Math.sin(a) * 8); }
      c.strokeStyle = GOLD.lt; c.lineWidth = 1.1; c.stroke();
    },
    lantern(c) {
      const g = c.createRadialGradient(24, 24, 2, 24, 24, 23); g.addColorStop(0, 'rgba(255,226,140,.75)'); g.addColorStop(1, 'rgba(255,200,90,0)');
      c.fillStyle = g; c.fillRect(0, 0, 48, 48);
      icoShape(c, (q) => poly(q, [[13, 36], [35, 36], [35, 27], [32, 27], [32, 19], [28, 19], [28, 12], [20, 12], [20, 19], [16, 19], [16, 27], [13, 27]]), lin(c, 0, 12, 0, 36, ['#fffbe8', '#ffe39a', '#f0bf58']), 1.5);
      c.beginPath(); c.moveTo(13, 27); c.lineTo(35, 27); c.moveTo(16, 19); c.lineTo(32, 19); for (const x of [20, 24, 28]) { c.moveTo(x, 12); c.lineTo(x, 36); }
      c.strokeStyle = GOLD.md; c.lineWidth = 1.2; c.stroke();
      icoShape(c, (q) => q.rect(10, 36, 28, 4), gold(c, 0, 36, 0, 40), 1.3);
      icoShape(c, (q) => poly(q, [[20, 12], [28, 12], [24, 4]]), gold(c, 20, 4, 28, 12), 1.3);
    },
    speed(c) {
      for (let k = 0; k < 4; k++) {
        const y = 11 + k * 7.5, w = 30 - k * 6;
        icoShape(c, (q) => poly(q, [[40 - w, y], [40, y], [44, y + 3], [40, y + 6], [40 - w + 4, y + 6]]), gold(c, 0, y, 0, y + 6), 1.2);
      }
      c.beginPath(); c.moveTo(3, 16); c.lineTo(9, 16); c.moveTo(6, 24); c.lineTo(14, 24); c.moveTo(10, 32); c.lineTo(18, 32); c.strokeStyle = GOLD.hi; c.lineWidth = 1.4; c.stroke();
    },
    magnet(c) {
      c.beginPath(); c.moveTo(12, 8); c.lineTo(12, 24); c.arc(24, 24, 12, PI, 0, true); c.lineTo(36, 8);
      c.lineCap = 'butt'; c.lineWidth = 12; c.strokeStyle = INK; c.stroke(); c.lineWidth = 8.6; c.strokeStyle = gold(c, 10, 10, 38, 38); c.stroke();
      c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,240,184,.8)'; c.beginPath(); c.moveTo(10.5, 9); c.lineTo(10.5, 24); c.arc(24, 24, 13.5, PI, PI * 0.55, true); c.stroke();
      icoShape(c, (q) => { q.rect(7.7, 4, 8.6, 5.5); q.rect(31.7, 4, 8.6, 5.5); }, '#f2e8d0', 1.2);
    },
    hp(c) {
      icoShape(c, (q) => poly(q, [[9, 8], [39, 8], [35, 20], [28, 25], [26, 32], [33, 36], [33, 40], [15, 40], [15, 36], [22, 32], [20, 25], [13, 20]]), gold(c, 9, 8, 39, 40), 1.5);
      c.beginPath(); c.moveTo(11, 12); c.lineTo(37, 12); c.strokeStyle = GOLD.dk; c.lineWidth = 0.9; c.stroke();
      icoShape(c, (q) => poly(q, [[24, 13], [28, 17], [24, 21], [20, 17]]), lin(c, 20, 13, 28, 21, [C.rubyHi, C.ruby, C.rubyDk]), 1.0);
      c.beginPath(); c.moveTo(13, 9.5); c.lineTo(15, 18); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.stroke();
    },
    sun(c) {
      c.save(); c.translate(24, 24); c.scale(2.4, 2.4); sunParts(c); c.restore();
    },
  };

  /* ============================================================ screen fx */
  let scr = null, scrKey = '';
  function screenFX(W, H) {
    const key = W + 'x' + H;
    if (scrKey === key && scr) return scr;
    scrKey = key;
    const { c, ctx } = U.canvas(W, H);
    const M = Math.max(W, H);
    // warm light from above + faint sunburst rays
    const top = ctx.createRadialGradient(W / 2, -H * 0.15, 0, W / 2, -H * 0.15, H * 1.15);
    top.addColorStop(0, 'rgba(255,214,140,.13)'); top.addColorStop(0.6, 'rgba(255,214,140,.03)'); top.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    for (let k = 0; k < 28; k++) { const a = PI * 0.08 + (k / 28) * PI * 0.84, w = 0.022; ctx.moveTo(W / 2, -H * 0.2); ctx.lineTo(W / 2 + Math.cos(a - w) * M * 1.3, -H * 0.2 + Math.sin(a - w) * M * 1.3); ctx.lineTo(W / 2 + Math.cos(a + w) * M * 1.3, -H * 0.2 + Math.sin(a + w) * M * 1.3); ctx.closePath(); }
    const rg = ctx.createRadialGradient(W / 2, -H * 0.2, 0, W / 2, -H * 0.2, H * 1.1);
    rg.addColorStop(0, 'rgba(255,220,150,.07)'); rg.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = rg; ctx.fill();
    ctx.restore();
    // vignette
    const v = ctx.createRadialGradient(W / 2, H * 0.48, M * 0.22, W / 2, H * 0.48, M * 0.72);
    v.addColorStop(0, 'rgba(4,5,9,0)'); v.addColorStop(0.65, 'rgba(4,5,9,.28)'); v.addColorStop(1, 'rgba(4,5,9,.66)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    // deco frame: gold double pin-line with stepped corners and corner fans
    const u = H / 360, m = 7 * u;
    ctx.globalAlpha = 0.75;
    ctx.beginPath(); stepRect(ctx, m, m, W - m, H - m, 6 * u);
    ctx.strokeStyle = 'rgba(90,61,16,.9)'; ctx.lineWidth = 1.9 * u; ctx.stroke();
    ctx.strokeStyle = '#d4a541'; ctx.lineWidth = 1.0 * u; ctx.stroke();
    ctx.beginPath(); stepRect(ctx, m + 4 * u, m + 4 * u, W - m - 4 * u, H - m - 4 * u, 4 * u); ctx.strokeStyle = 'rgba(212,165,65,.6)'; ctx.lineWidth = 0.45 * u; ctx.stroke();
    const fan = (x, y, a0) => {
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * PI * 0.5; ctx.moveTo(x + Math.cos(a) * 4 * u, y + Math.sin(a) * 4 * u); ctx.lineTo(x + Math.cos(a) * 20 * u, y + Math.sin(a) * 20 * u); }
      ctx.moveTo(x + Math.cos(a0) * 20 * u, y + Math.sin(a0) * 20 * u); ctx.arc(x, y, 20 * u, a0, a0 + PI / 2);
      ctx.moveTo(x + Math.cos(a0) * 13 * u, y + Math.sin(a0) * 13 * u); ctx.arc(x, y, 13 * u, a0, a0 + PI / 2);
      ctx.strokeStyle = 'rgba(212,165,65,.7)'; ctx.lineWidth = 0.55 * u; ctx.stroke();
    };
    const o = m + 4 * u;
    fan(o, o, 0); fan(W - o, o, PI / 2); fan(W - o, H - o, PI); fan(o, H - o, PI * 1.5);
    ctx.globalAlpha = 1;
    scr = c;
    return c;
  }

  /* ============================================================ numbers */
  const numCache = new Map();
  let fontOK = false, fontCheckT = -1;
  function fontReady(rt) {
    if (fontOK) return true;
    if (fontCheckT >= 0 && rt - fontCheckT < 0.5) return false;
    fontCheckT = rt;
    if (document.fonts) document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === 'Limelight' && f.status === 'loaded') fontOK = true; });
    if (fontOK) numCache.clear();
    return fontOK;
  }
  function numSprite(value, crit, rt) {
    const ok = fontReady(rt);
    const key = value + (crit ? 'c' : 'n') + (ok ? 'L' : 'F');
    let s = numCache.get(key);
    if (s) return s;
    if (numCache.size > 400) numCache.clear();
    const fs = (crit ? 11.5 : 8) * K;
    const font = fs + 'px "Limelight", "Poiret One", Georgia, serif';
    const meas = U.canvas(4, 4).ctx; meas.font = font;
    const txt = String(value);
    const w = Math.ceil(meas.measureText(txt).width + fs * 1.2), h = Math.ceil(fs * 1.9);
    const { c, ctx } = U.canvas(w, h);
    const cx = w / 2, cy = h / 2;
    if (crit) {
      ctx.beginPath();
      for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; ctx.moveTo(cx + Math.cos(a) * fs * 0.42, cy + Math.sin(a) * fs * 0.42); ctx.lineTo(cx + Math.cos(a) * fs * (k & 1 ? 0.7 : 0.92), cy + Math.sin(a) * fs * (k & 1 ? 0.7 : 0.92)); }
      ctx.strokeStyle = 'rgba(230,193,90,.75)'; ctx.lineWidth = fs * 0.06; ctx.stroke();
    }
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'miter'; ctx.miterLimit = 2;
    ctx.strokeStyle = INK; ctx.lineWidth = fs * 0.26; ctx.strokeText(txt, cx, cy);
    if (crit) {
      const g = ctx.createLinearGradient(0, cy - fs * 0.45, 0, cy + fs * 0.45);
      g.addColorStop(0, '#fff3c4'); g.addColorStop(0.45, '#e9bf5c'); g.addColorStop(0.6, '#9a6c22'); g.addColorStop(1, '#f5d98a');
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#f6ecd2';
    ctx.fillText(txt, cx, cy);
    s = { c, ox: w / 2, oy: h / 2 };
    numCache.set(key, s);
    return s;
  }

  /* ================================================================== CSS */
  const svg = (s) => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
  const SGRAD = "<linearGradient id='g' x1='0' y1='0' x2='0.35' y2='1'><stop offset='0' stop-color='#fff0b8'/><stop offset='.22' stop-color='#e2b553'/><stop offset='.5' stop-color='#9c6f22'/><stop offset='.74' stop-color='#f0cf7a'/><stop offset='1' stop-color='#8a611d'/></linearGradient>";
  function sPath(x0, y0, x1, y1, s) {
    const d = 2 * s;
    return `M${x0 + d} ${y0}H${x1 - d}V${y0 + s}H${x1 - s}V${y0 + d}H${x1}V${y1 - d}H${x1 - s}V${y1 - s}H${x1 - d}V${y1}H${x0 + d}V${y1 - s}H${x0 + s}V${y1 - d}H${x0}V${y0 + d}H${x0 + s}V${y0 + s}H${x0 + d}Z`;
  }
  const FRAME = svg(`<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><defs>${SGRAD}</defs>` +
    `<path d='${sPath(1, 1, 47, 47, 4)}' fill='none' stroke='url(#g)' stroke-width='2'/>` +
    `<path d='${sPath(5.5, 5.5, 42.5, 42.5, 2.5)}' fill='none' stroke='#c99a3c' stroke-width='.8'/>` +
    `<path d='M12 3.5l1.5 1.5-1.5 1.5-1.5-1.5zM36 3.5l1.5 1.5-1.5 1.5-1.5-1.5zM12 41.5l1.5 1.5-1.5 1.5-1.5-1.5zM36 41.5l1.5 1.5-1.5 1.5-1.5-1.5z' fill='#e6c15a'/></svg>`);
  const fanCorner = (x, y, a0) => {
    let d = '';
    for (let k = 0; k <= 5; k++) { const a = a0 + (k / 5) * PI * 0.5; d += `M${(x + Math.cos(a) * 3).toFixed(2)} ${(y + Math.sin(a) * 3).toFixed(2)}L${(x + Math.cos(a) * 12).toFixed(2)} ${(y + Math.sin(a) * 12).toFixed(2)}`; }
    return `<path d='${d}' stroke='#c99a3c' stroke-width='.7' fill='none'/>`;
  };
  const CARD = svg(`<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'><defs>${SGRAD}</defs>` +
    `<path d='${sPath(1.3, 1.3, 70.7, 70.7, 6)}' fill='none' stroke='url(#g)' stroke-width='2.6'/>` +
    `<path d='${sPath(6.5, 6.5, 65.5, 65.5, 4)}' fill='none' stroke='#c99a3c' stroke-width='1'/>` +
    `<path d='${sPath(10, 10, 62, 62, 3)}' fill='none' stroke='#8a611d' stroke-width='.6'/>` +
    fanCorner(10, 10, 0) + fanCorner(62, 10, PI / 2) + fanCorner(62, 62, PI) + fanCorner(10, 62, PI * 1.5) + `</svg>`);
  function clipStep(s) {
    const d = 2 * s, R = (v) => `calc(100% - ${v}px)`;
    return `polygon(${d}px 0, ${R(d)} 0, ${R(d)} ${s}px, ${R(s)} ${s}px, ${R(s)} ${d}px, 100% ${d}px, 100% ${R(d)}, ${R(s)} ${R(d)}, ${R(s)} ${R(s)}, ${R(d)} ${R(s)}, ${R(d)} 100%, ${d}px 100%, ${d}px ${R(s)}, ${s}px ${R(s)}, ${s}px ${R(d)}, 0 ${R(d)}, 0 ${d}px, ${s}px ${d}px, ${s}px ${s}px, ${d}px ${s}px)`;
  }
  const GOLDTXT = "background: linear-gradient(180deg, #fff3c4 8%, #e9bf5c 42%, #9a6c22 58%, #f5d98a 86%); -webkit-background-clip: text; background-clip: text; color: transparent;";
  const PANEL = `border: 12px solid transparent; border-image: ${FRAME} 16 / 12px stretch; background: linear-gradient(180deg, rgba(20,28,52,.94), rgba(8,9,13,.95)); clip-path: ${clipStep(3)};`;
  const X = 'body.style-artdeco';
  const CSS = `
${X} { font-family: 'Josefin Sans', 'Century Gothic', 'Futura', sans-serif; color: #f2e8d0; }
${X} #hud { padding: 16px 26px; }
${X} #hud .xp { height: 12px; background: #06070a; border: 1px solid #c99a3c; border-radius: 0; box-shadow: 0 0 0 3px #06070a, 0 0 0 4px rgba(201,154,60,.65), 0 6px 16px rgba(0,0,0,.55); overflow: hidden; }
${X} #hud .xp-fill { background: repeating-linear-gradient(90deg, rgba(60,36,6,.5) 0 1px, transparent 1px 8px), linear-gradient(180deg, #fff0b8 0%, #e2b553 32%, #9c6f22 64%, #f0cf7a 100%); box-shadow: 1px 0 0 #fff3c4; }
${X} #hud .lvl { right: 10px; font-family: 'Limelight', Georgia, serif; font-weight: 400; font-size: 10px; letter-spacing: .25em; color: #f2e8d0; text-shadow: 0 0 3px #000, 0 0 2px #000; }
${X} #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 18px; }
${X} #hud .hp { position: relative; justify-self: start; gap: 10px; padding: 2px 10px 2px 2px; ${PANEL} }
${X} #hud .hp-icon, ${X} #hud .kills-icon { width: 34px; height: 34px; }
${X} #hud .hp-bar { width: 230px; height: 14px; background: #040507; border: 1px solid #8a611d; border-radius: 0; box-shadow: inset 0 0 0 1px #000, 0 0 0 1px rgba(230,193,90,.25); }
${X} #hud .hp-fill { background: repeating-linear-gradient(90deg, rgba(0,0,0,.3) 0 1px, transparent 1px 9px), linear-gradient(180deg, #f39a92 0%, #c23b45 36%, #7d1a26 72%, #a92c38 100%); box-shadow: 1px 0 0 #ffd0b0; }
${X} #hud .hp-text { min-width: 58px; font-family: 'Limelight', Georgia, serif; font-weight: 400; font-size: 15px; letter-spacing: .08em; color: #f2e8d0; text-shadow: none; }
${X}.hurt #hud .hp-bar { filter: brightness(1.5) saturate(1.3); }
${X} #hud .clock { position: relative; justify-self: center; padding: 2px 26px 4px; margin-top: 4px; ${PANEL} overflow: visible; }
${X} #hud .clock-time { font-family: 'Limelight', Georgia, serif; font-weight: 400; font-size: 34px; line-height: 1.05; letter-spacing: .08em; ${GOLDTXT} text-shadow: none; filter: drop-shadow(0 2px 0 rgba(0,0,0,.9)); }
${X} #hud .clock-label { font-family: 'Josefin Sans', sans-serif; font-weight: 600; font-size: 10px; letter-spacing: .5em; padding-left: .5em; opacity: 1; color: #9fd8c4; }
${X} #hud .kills { justify-self: end; min-width: 0; gap: 8px; padding: 0 14px 0 4px; font-family: 'Limelight', Georgia, serif; font-weight: 400; font-size: 24px; letter-spacing: .06em; color: #f2e8d0; text-shadow: none; ${PANEL} }
${X} #stylebar { gap: 14px; padding: 0 16px; bottom: 14px; border-radius: 0; ${PANEL} font-family: 'Josefin Sans', sans-serif; font-weight: 600; font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: #d8c9a3; }
${X} #stylebar .style-family { color: #9fd8c4; opacity: 1; font-size: 10px; letter-spacing: .32em; }
${X} #stylebar .style-name { font-family: 'Limelight', Georgia, serif; font-weight: 400; font-size: 17px; letter-spacing: .12em; ${GOLDTXT} }
${X} #stylebar .style-hint { opacity: .7; letter-spacing: .12em; }
${X} #stylebar .auto.on { color: #6fd1b6; }
${X} #levelup { gap: 28px; background:
  radial-gradient(ellipse at 50% 42%, rgba(26,43,82,.35) 0%, rgba(4,5,9,0) 55%),
  repeating-conic-gradient(from 0deg at 50% 34%, rgba(226,181,83,.065) 0deg 3deg, rgba(226,181,83,0) 3deg 10deg),
  radial-gradient(ellipse at 50% 40%, rgba(12,18,36,.7), rgba(3,4,7,.94) 75%); }
${X} #levelup .lu-title { position: relative; padding: 0 .25em; font-family: 'Limelight', Georgia, serif; font-weight: 400; font-size: 64px; letter-spacing: .16em; text-transform: uppercase; ${GOLDTXT} text-shadow: none; filter: drop-shadow(0 3px 0 rgba(0,0,0,.85)); animation: artdecoRise .5s cubic-bezier(.2,.8,.2,1) backwards; }
${X} #levelup .lu-title::before, ${X} #levelup .lu-title::after { content: ''; position: absolute; top: 50%; width: 150px; height: 7px; margin-top: -4px; border-top: 1px solid #c99a3c; border-bottom: 1px solid #c99a3c; }
${X} #levelup .lu-title::before { right: 100%; } ${X} #levelup .lu-title::after { left: 100%; }
@keyframes artdecoRise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
${X} #levelup .lu-cards { gap: 26px; }
${X} #levelup .card { width: 236px; min-height: 306px; padding: 4px 16px 18px; gap: 8px; color: #f2e8d0; border: 18px solid transparent; border-radius: 0; border-image: ${CARD} 24 / 18px stretch; clip-path: ${clipStep(4.5)};
  background: repeating-conic-gradient(from 90deg at 50% 0, rgba(226,181,83,.2) 0deg 4deg, rgba(226,181,83,0) 4deg 11deg) 0 0 / 100% 150px no-repeat,
    radial-gradient(ellipse at 50% 0, rgba(42,156,132,.34), rgba(42,156,132,0) 68%) 0 0 / 100% 170px no-repeat,
    linear-gradient(180deg, #13203f 0%, #0b101e 48%, #07080c 100%);
  background-origin: border-box; transition: transform .16s ease, filter .16s ease; animation: artdecoRise .55s cubic-bezier(.2,.8,.2,1) backwards; }
${X} #levelup .card:nth-child(2) { animation-delay: .08s; } ${X} #levelup .card:nth-child(3) { animation-delay: .16s; }
${X} #levelup .card:hover { transform: translateY(-8px); filter: brightness(1.15); }
${X} #levelup .card-icon { width: 108px; height: 108px; margin-top: 16px; border-radius: 50%; background: radial-gradient(circle at 50% 42%, #1d3160, #0a0e1a 72%); box-shadow: 0 0 0 2px #c99a3c, 0 0 0 6px #07080c, 0 0 0 7px rgba(201,154,60,.75); }
${X} #levelup .card-name { margin-top: 12px; font-family: 'Limelight', Georgia, serif; font-weight: 400; font-size: 20px; letter-spacing: .1em; line-height: 1.15; text-transform: uppercase; color: #f6ecd2; }
${X} #levelup .card-desc { font-family: 'Josefin Sans', sans-serif; font-weight: 400; font-size: 15px; line-height: 1.3; opacity: 1; color: #c9bb98; }
${X} #levelup .card-key { top: -2px; left: 50%; width: 26px; height: 26px; margin-left: -13px; display: flex; align-items: center; justify-content: center; padding-top: 3px;
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); background: linear-gradient(180deg, #fff0b8, #e2b553 40%, #9c6f22 70%, #f0cf7a); color: #07080c; font-family: 'Limelight', Georgia, serif; font-size: 12px; opacity: 1; }
${X} #levelup .lu-hint { font-family: 'Poiret One', 'Josefin Sans', sans-serif; font-weight: 400; font-size: 19px; letter-spacing: .3em; text-transform: uppercase; opacity: 1; color: #e2cf9f; }
${X} #gameover { gap: 20px; background: repeating-conic-gradient(from 0deg at 50% 40%, rgba(184,50,63,.07) 0deg 3deg, rgba(184,50,63,0) 3deg 10deg), radial-gradient(ellipse at 50% 42%, rgba(12,14,24,.72), rgba(3,4,7,.95) 75%); }
${X} #gameover .go-title { font-family: 'Limelight', Georgia, serif; font-weight: 400; font-size: 74px; letter-spacing: .16em; text-transform: uppercase; ${GOLDTXT} filter: drop-shadow(0 3px 0 rgba(0,0,0,.85)); }
${X} #gameover .go-stats { padding: 6px 22px; font-family: 'Josefin Sans', sans-serif; font-weight: 600; font-size: 17px; letter-spacing: .08em; opacity: 1; color: #f2e8d0; ${PANEL} }
${X} #gameover .go-hint { font-family: 'Poiret One', 'Josefin Sans', sans-serif; font-size: 18px; letter-spacing: .3em; text-transform: uppercase; opacity: 1; color: #e2cf9f; }
${X} #pausebox { font-family: 'Limelight', Georgia, serif; font-weight: 400; font-size: 64px; letter-spacing: .2em; ${GOLDTXT} text-shadow: none; filter: drop-shadow(0 3px 0 #000); }
`;

  /* ============================================================== particles */
  const heightOf = (e) => (e.type === 'colossus' ? 30 : e.type === 'ghost' ? 12 : 7);
  const shardOf = (e) => (e.type === 'ghost' ? 3 : e.type === 'colossus' ? 4 : (Math.floor((e.seed || 0) * 3) % 3));
  function glint(game, x, y, z, size, life, vx, vy) {
    return game.addParticle({ kind: 'glint', x, y, z, vx: vx || 0, vy: vy || 0, drag: 3, life, size, rot: Math.random() * 0.8 });
  }
  function rays(game, x, y, z, n, R, life, color, flat) {
    return game.addParticle({ kind: 'rays', x, y, z, n, size: R, life, drag: 0, color, flat: !!flat, rot: Math.random() * TAU });
  }
  function leaves(game, x, y, z, n, sp, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.5 + Math.random() * 0.7);
      game.addParticle({ kind: 'leaf', x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.55, vz: 40 + Math.random() * 60, grav: 110, drag: 2.4, life: life * (0.7 + Math.random() * 0.5), size: 0.9 + Math.random() * 0.7, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 9 });
    }
  }
  function shards(game, x, y, z, n, col, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = sp * (0.6 + Math.random() * 0.6);
      game.addParticle({ kind: 'shard', col, x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.55, vz: 50 + Math.random() * 50, grav: 260, drag: 1.4, life: 0.6 + Math.random() * 0.3, size: 0.9 + Math.random() * 0.6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16 });
    }
  }

  /* ================================================================ style */
  Styles.register({
    id: 'artdeco',
    name: 'Art Deco Gold',
    family: 'Vector · Art Deco',
    description: 'A 1920s grand lobby: onyx, emerald and midnight marble inlaid with metallic gold, sunbursts, stepped ziggurat corners, chevrons and fan scallops, dapper geometric figures with gold trim.',
    groundColor: '#0d0e12',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Limelight', 'Poiret+One', 'Josefin+Sans:wght@300;400;600;700'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = Math.max(3, Math.min(7, Math.round(S * 1.7)));
      // textures for the floor
      TEX.onyx = marbleTex(192, '#0d0e12', '#1d1e26', '#6e6553', '#33343e', 11);
      TEX.emer = marbleTex(192, '#0a3a31', '#125548', '#5fb39a', '#06241f', 23);
      TEX.night = marbleTex(192, '#0e1830', '#182a4e', '#4a66a2', '#081022', 37);
      TEX.ivory = marbleTex(160, '#e9dfc7', '#d2c29f', '#9a8664', '#f8f2e2', 41);
      TEX.terr = terrazzoTex(160, 53);
      // main character
      const gbox = [-13, -42, 15, 2.5];
      const gset = (f) => set3(gbox, (c) => { c.scale(1.1, 1); gentParts(c, gentPose(f)); }, 0.6, '#ff8a7a', 1.06);
      SPR.gent = { idle: gset(-1), walk: [0, 1, 2, 3, 4, 5].map(gset) };
      SPR.scarab = [0, 1, 2].map((v) => [0, 1, 2, 3].map((f) => set3([-14, -16, 16, 2], (c) => scarabParts(c, f, v), 0.5, null, 1.3)));
      SPR.swift = [0, 1, 2, 3].map((f) => set3([-16, -16, 14, 16], (c) => swiftParts(c, f), 0.5, null, 1.12));
      SPR.guard = [0, 1, 2, 3].map((f) => set3([-21, -64, 21, 2], (c) => guardParts(c, f), 0.8));
      SPR.props = {};
      for (const t in PROPS) {
        const s = outlined(PROPS[t].box, PROP_FN[t], 0.6);
        SPR.props[t] = s;
      }
      SPR.dart = mk([-16, -4, 7.5, 4], dartParts);
      SPR.sun = outlined([-10, -10, 10, 10], sunParts, 0.5);
      SPR.gemS = outlined([-5, -6, 5, 6], emeraldParts, 0.5);
      SPR.gemB = outlined([-8, -8, 8, 8], asscherParts, 0.5);
      SPR.glint = mk([-5, -5, 5, 5], glintParts);
      SPR.leafF = mk([-1.8, -1.1, 1.8, 1.1], (c) => { c.fillStyle = gold(c, -1.5, -1, 1.5, 1); c.fillRect(-1.6, -0.9, 3.2, 1.8); });
      SPR.leafB = mk([-1.8, -1.1, 1.8, 1.1], (c) => { c.fillStyle = '#8a611d'; c.fillRect(-1.6, -0.9, 3.2, 1.8); });
      SPR.shard = SHARD_COL.map((col) => mk([-2.4, -2, 2.6, 2.2], (c) => {
        c.beginPath(); poly(c, [[-1.8, -1.3], [2.0, -0.2], [-0.6, 1.7]]); c.fillStyle = col; c.fill();
        c.strokeStyle = GOLD.lt; c.lineWidth = 0.32; c.stroke();
      }));
      SPR.glow = radial([-16, -16, 16, 16], [[0, 'rgba(255,224,140,.75)'], [0.35, 'rgba(255,200,90,.28)'], [1, 'rgba(255,180,60,0)']]);
      SPR.glowJ = radial([-14, -14, 14, 14], [[0, 'rgba(140,255,220,.5)'], [0.4, 'rgba(80,220,180,.16)'], [1, 'rgba(60,200,160,0)']]);
      SPR.shadow = radial([-10, -10, 10, 10], [[0, 'rgba(0,0,0,.62)'], [0.55, 'rgba(0,0,0,.42)'], [1, 'rgba(0,0,0,0)']]);
      numCache.clear(); fontOK = false; fontCheckT = -1; scrKey = ''; ownWorld = false;
      if (document.fonts && document.fonts.load) { try { document.fonts.load('20px "Limelight"', '0123456789'); } catch (e) { /* ignore */ } }
    },

    /* ------------------------------------------------------------ ground */
    *renderGroundChunk(ctx, info) {
      ownWorld = true;
      const P = pats(ctx);
      const x0 = info.wx, y0 = info.wy, x1 = x0 + info.size, y1 = y0 + info.size;
      ctx.fillStyle = P.onyx; ctx.fillRect(x0, y0, info.size, info.size);
      const i0 = Math.floor(x0 / BAY), i1 = Math.ceil(x1 / BAY) - 1;
      const j0 = Math.floor(y0 / BAY), j1 = Math.ceil(y1 / BAY) - 1;
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          P.bonyx = bayPat(ctx, TEX.onyx, 0.62, i, j, 101);
          P.bemer = bayPat(ctx, TEX.emer, 0.55, i, j, 202);
          ctx.save();
          ctx.beginPath(); ctx.rect(i * BAY, j * BAY, BAY, BAY); ctx.clip();
          BAY_FN[bayType(i, j)](ctx, P, i * BAY, j * BAY);
          ctx.fillStyle = 'rgba(4,5,9,.3)'; ctx.fillRect(i * BAY, j * BAY, BAY, BAY);
          ctx.restore();
          yield;
        }
      }
      walkways(ctx, P, info);
      yield;
    },

    propsForChunk(info) {
      const out = [];
      const add = (x, y, t, extra) => {
        if (x < info.wx || x >= info.wx + info.size || y < info.wy || y >= info.wy + info.size) return;
        if (G.nearSpawn(x, y, 64)) return;
        const d = PROPS[t];
        out.push(Object.assign({ x, y, t, f: false, pad: d.h + 20, ph: U.hash2(Math.round(x), Math.round(y), 9) * TAU }, extra || {}));
      };
      const i0 = Math.floor(info.wx / BAY) - 1, i1 = Math.floor((info.wx + info.size) / BAY) + 1;
      const j0 = Math.floor(info.wy / BAY) - 1, j1 = Math.floor((info.wy + info.size) / BAY) + 1;
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const bx = i * BAY, by = j * BAY, cx = bx + BAY / 2, cy = by + BAY / 2, type = bayType(i, j);
          const h = U.hash2(i, j, 515);
          if (type === 'medallion') { if (h < 0.55) add(cx, cy + 2, 'statue'); else if (h < 0.8) add(cx, cy + 4, 'fountain'); }
          else if (type === 'pool') add(cx, cy + 4, 'fountain');
          else if (type === 'garden') {
            const q = 41;
            add(cx - q, cy - q + 6, 'palm', { f: h < 0.5 }); add(cx + q, cy - q + 6, 'palm', { f: h >= 0.5 });
            add(cx - q, cy + q + 6, 'palm', { f: h >= 0.5 }); add(cx + q, cy + q + 6, 'palm', { f: h < 0.5 });
            add(bx + WALK + 16, cy + 3, 'topiary'); add(bx + BAY - WALK - 16, cy + 3, 'topiary');
          } else if (type === 'harlequin') {
            add(bx + WALK + 22, by + WALK + 26, 'fan-urn'); add(bx + BAY - WALK - 22, by + BAY - WALK - 14, 'fan-urn');
          } else if (type === 'scallop') {
            add(bx + WALK + 20, by + WALK + 30, 'topiary'); add(bx + BAY - WALK - 20, by + WALK + 30, 'topiary');
          } else if (type === 'chevron') {
            add(cx - 46, cy + 4, 'fan-urn'); add(cx + 46, cy + 4, 'fan-urn');
          }
          // lamp posts in the stepped corners around every other crossing
          if (((i & 1) | (j & 1)) === 0) {
            add(bx + 21, by + 23, 'lamp'); add(bx - 21, by + 23, 'lamp');
            add(bx + 21, by - 17, 'lamp'); add(bx - 21, by - 17, 'lamp');
          }
        }
      }
      return out;
    },

    drawProp(ctx, p, view) {
      const d = PROPS[p.t], s = SPR.props && SPR.props[p.t];
      if (!d || !s) return;
      const V = tf(view), rt = view.rt;
      let a = 1;
      const pl = view.game && view.game.player;
      if (pl && d.tall && pl.y < p.y - 3 && pl.y > p.y - d.h && Math.abs(pl.x - p.x) < d.w + 6) a = 0.55;
      ctx.globalAlpha = a;
      blit(ctx, V, s, p.x, p.y, 1, 1, 0, p.f);
      if (p.t === 'lamp') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.55 + 0.06 * Math.sin(rt * 5 + p.ph);
        const g = SPR.glow;
        blit(ctx, V, g, p.x, p.y - 52, 1.6, 1.6, 0, false);
        ctx.globalCompositeOperation = 'source-over';
      } else if (p.t === 'fountain') {
        // fan-shaped water sprays with flowing dashes
        ctx.globalAlpha = 0.85 * a;
        ctx.lineCap = 'round';
        ctx.setLineDash([2.4, 1.8]);
        ctx.lineDashOffset = -rt * 9;
        ctx.beginPath();
        const nx = p.x, ny = p.y - 33.5;
        for (let k = -3; k <= 3; k++) { ctx.moveTo(nx, ny); ctx.quadraticCurveTo(nx + k * 2.2, ny - 9 + Math.abs(k) * 0.9, nx + k * 3.1, p.y - 25.2); }
        for (const s2 of [-1, 1]) for (let k = 0; k < 3; k++) { const sx = nx + s2 * (5 + k * 2.2); ctx.moveTo(sx, p.y - 25); ctx.quadraticCurveTo(sx + s2 * (5 + k * 2), p.y - 26 - (2 - k), sx + s2 * (8 + k * 3.6), p.y - 6); }
        ctx.strokeStyle = 'rgba(200,245,235,.85)'; ctx.lineWidth = 0.5; ctx.stroke();
        ctx.setLineDash([]); ctx.lineDashOffset = 0; ctx.lineCap = 'butt';
        const ph = (rt * 0.7 + p.ph) % 1;
        ctx.globalAlpha = (1 - ph) * 0.5 * a;
        ctx.beginPath(); ctx.ellipse(p.x, p.y - 4, 6 + ph * 16, (6 + ph * 16) * 0.36, 0, 0, TAU); ctx.strokeStyle = '#bff2e8'; ctx.lineWidth = 0.4; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },

    drawShadow(ctx, o, view) {
      const sh = SPR.shadow;
      if (!sh) return;
      let rx, ry, a = 1, x = o.x, y = o.y;
      if (o.kind === 'prop') { const d = PROPS[o.t]; if (!d) return; rx = d.sh[0]; ry = d.sh[1]; a = 0.9; }
      else if (o.kind === 'enemy') {
        let k = 1;
        if (o.dying) k = Math.max(0, 1 - o.deathT * 1.4);
        if (o.spawnT < 1) k *= U.clamp(o.spawnT * 1.6, 0, 1);
        if (k <= 0.02) return;
        if (o.type === 'ghost') { rx = 7.5; ry = 2.5; a = 0.6 * k; }
        else if (o.type === 'colossus') { rx = 19 * k; ry = 5.8 * k; a = k; }
        else { rx = 12.5 * k; ry = 3.9 * k; a = k; }
      } else { rx = 8.2; ry = 2.8; }
      ctx.globalAlpha = a;
      ctx.drawImage(sh.c, x - rx, y - ry, rx * 2, ry * 2);
      ctx.globalAlpha = 1;
      void view;
    },

    drawGroundOverlay(ctx, view, game) {
      const rt = view.rt;
      // ripples on the reflecting pools
      const i0 = Math.floor(view.x0 / BAY), i1 = Math.floor(view.x1 / BAY), j0 = Math.floor(view.y0 / BAY), j1 = Math.floor(view.y1 / BAY);
      ctx.lineWidth = 0.55;
      if (ownWorld) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        if (bayType(i, j) !== 'pool') continue;
        const cx = i * BAY + BAY / 2, cy = j * BAY + BAY / 2;
        for (let k = 0; k < 3; k++) {
          const ph = (rt * 0.12 + k / 3 + U.hash2(i, j, 3)) % 1;
          ctx.globalAlpha = Math.sin(ph * PI) * 0.35;
          ctx.beginPath(); ctx.arc(cx, cy, 30 + ph * 44, 0, TAU); ctx.strokeStyle = '#a8eadf'; ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      // spawn sigils: a gold sunburst ring opens on the floor
      for (const e of game.enemies) {
        if (e.dying || e.spawnT >= 1) continue;
        if (e.x < view.x0 - 40 || e.x > view.x1 + 40 || e.y < view.y0 - 30 || e.y > view.y1 + 40) continue;
        const t = e.spawnT, big = e.type === 'colossus';
        const R = (big ? 22 : e.type === 'ghost' ? 9 : 13) * (0.35 + 0.65 * U.ease.outQuad(Math.min(1, t * 1.5)));
        ctx.globalAlpha = Math.sin(Math.min(1, t) * PI) * 0.95;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, R, R * 0.48, 0, 0, TAU);
        ctx.strokeStyle = GOLD.lt; ctx.lineWidth = big ? 1.1 : 0.8; ctx.stroke();
        ctx.beginPath();
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU + t; const c = Math.cos(a), s = Math.sin(a) * 0.48; ctx.moveTo(e.x + c * R * 1.15, e.y + s * R * 1.15); ctx.lineTo(e.x + c * R * 1.55, e.y + s * R * 1.55); }
        ctx.lineWidth = 0.55; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },

    drawWorldOverlay(ctx, view) {
      // drifting gold dust motes in the warm air
      const V = tf(view), cell = 95, rt = view.rt, s = SPR.glint;
      const x0 = Math.floor((view.x0 - 20) / cell), x1 = Math.floor((view.x1 + 20) / cell);
      const y0 = Math.floor((view.y0 - 20) / cell), y1 = Math.floor((view.y1 + 40) / cell);
      ctx.globalCompositeOperation = 'lighter';
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = U.hash2(cx, cy, 5151);
          if (h > 0.5) continue;
          const h2 = U.hash2(cx, cy, 5152), h3 = U.hash2(cx, cy, 5153);
          const x = (cx + h2) * cell + Math.sin(rt * 0.35 + h * 40) * 18;
          const y = (cy + h3) * cell - ((rt * 4 + h * 200) % 60) + 30;
          const tw = 0.5 + 0.5 * Math.sin(rt * (1.4 + h * 2.5) + h * 60);
          ctx.globalAlpha = 0.15 + 0.6 * tw * tw;
          const sc = 0.22 + 0.3 * tw;
          blit(ctx, V, s, x, y, sc, sc, rt * 0.5 + h * 6, false);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      ctx.drawImage(screenFX(view.W, view.H), 0, 0);
    },

    drawGem(ctx, g, view) {
      const V = tf(view), rt = view.rt;
      let h = 3 + Math.sin(rt * 4 + g.seed * 20) * 1.1;
      let sc = 1;
      if (g.pop > 0) { const q = 1 - g.pop; h += Math.sin(q * PI) * 9; sc = 0.4 + 0.6 * U.ease.outBack(Math.min(1, q * 1.4)); }
      const sh = SPR.shadow, k = g.big ? 5.5 : 3.8;
      ctx.globalAlpha = 0.7;
      ctx.drawImage(sh.c, g.x - k, g.y - k * 0.36, k * 2, k * 0.72);
      ctx.globalAlpha = 1;
      if (g.big) {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.1 * Math.sin(rt * 3 + g.seed * 9);
        blit(ctx, V, SPR.glow, g.x, g.y - h, 0.75, 0.75, 0, false);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        blit(ctx, V, SPR.gemB, g.x, g.y - h, sc * 0.85, sc * 0.85, 0, false);
        const tw = Math.sin(rt * 2.6 + g.seed * 9);
        if (tw > 0.55) { const q = (tw - 0.55) / 0.45; ctx.globalCompositeOperation = 'lighter'; blit(ctx, V, SPR.glint, g.x + 3, g.y - h - 3.5, q * 0.8, q * 0.8, rt, false); ctx.globalCompositeOperation = 'source-over'; }
      } else {
        const turn = Math.cos(rt * 2.2 + g.seed * 12);
        blit(ctx, V, SPR.gemS, g.x, g.y - h, sc * (0.55 + 0.45 * Math.abs(turn)) * 0.72, sc * 0.72, 0, false);
      }
    },

    drawEnemy(ctx, e, view) {
      const V = tf(view), rt = view.rt;
      let set, y = e.y, rot = 0, sx = 1, sy = 1, alpha = 1, noFlip = false;
      let flip = e.facing < 0;
      if (e.type === 'creeper') {
        const ph = e.anim * 0.9 + e.seed * 4;
        set = SPR.scarab[Math.floor(e.seed * 3) % 3][Math.floor(ph * 4) & 3];
        y -= Math.abs(Math.sin(ph * TAU)) * 0.5;
        sx = sy = 0.95 + e.seed * 0.1;
      } else if (e.type === 'ghost') {
        set = SPR.swift[Math.floor(rt * 12 + e.seed * 4) & 3];
        y -= 13 + Math.sin(rt * 3 + e.seed * 9) * 1.6;
        const vx = e.vx || 0, vy = e.vy || 0;
        rot = vx * vx + vy * vy > 9 ? Math.atan2(vy * 0.8, vx) : flip ? PI : 0;
        noFlip = true;
      } else {
        set = SPR.guard[Math.floor(e.anim * 0.3 * 4 + e.seed * 4) & 3];
        rot = Math.sin(e.anim * 0.6 + e.seed) * 0.02;
      }
      if (noFlip) flip = false;
      if (e.spawnT < 1 && !e.dying) {
        const q = U.clamp(e.spawnT, 0, 1);
        if (e.type === 'ghost') { y -= (1 - q) * 26; alpha = q; }
        else { const p = U.ease.outBack(U.clamp((q - 0.15) / 0.85, 0, 1)); if (p <= 0.01) return; sy *= p; sx *= 0.6 + 0.4 * Math.min(1, p); alpha = Math.min(1, q * 2); }
      }
      if (e.dying) {
        // turns to gold, swells and fades while the gold leaf takes over
        const q = U.clamp(e.deathT, 0, 1);
        if (q >= 1) return;
        const k = 1 + U.ease.outQuad(q) * 0.22;
        ctx.globalAlpha = Math.pow(1 - q, 1.4);
        blit(ctx, V, set.g, e.x, y - q * 3, sx * k, sy * k, rot, flip);
        ctx.globalAlpha = 1;
        return;
      }
      ctx.globalAlpha = alpha;
      const fl = e.flash;
      if (fl > 0) { sx *= 1 + 0.12 * fl; sy *= 1 - 0.08 * fl; }
      blit(ctx, V, set.n, e.x, y, sx, sy, rot, flip);
      if (fl > 0.02) { ctx.globalAlpha = Math.min(0.9, fl * 1.2) * alpha; blit(ctx, V, set.f, e.x, y, sx, sy, rot, flip); }
      ctx.globalAlpha = 1;
      if (e.type === 'ghost' && alpha > 0.5) {
        // three parallel gold speed lines behind the swift
        const vx = e.vx || 0, vy = e.vy || 0, sp = Math.hypot(vx, vy);
        if (sp > 8) {
          const dx = -vx / sp, dy = -vy / sp, nx = -dy, ny = dx;
          const bx = e.x + dx * 14, by = y + dy * 14;
          ctx.beginPath();
          for (const o of [-2.6, 0, 2.6]) { const L = o ? 8 : 12; ctx.moveTo(bx + nx * o, by + ny * o); ctx.lineTo(bx + nx * o + dx * L, by + ny * o + dy * L); }
          ctx.globalAlpha = 0.6 * alpha; ctx.strokeStyle = GOLD.lt; ctx.lineWidth = 0.45; ctx.stroke(); ctx.globalAlpha = 1;
        }
      }
      if (e.type === 'colossus') {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45 + 0.15 * Math.sin(rt * 4 + e.seed * 9);
        blit(ctx, V, SPR.glowJ, e.x + (flip ? -0.0 : 0), y - 48 * sy, 0.55, 0.3, 0, false);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
    },

    drawPlayer(ctx, p, view) {
      const V = tf(view), rt = view.rt;
      const flip = p.facing < 0;
      let set, lift = 0, sx = PS, sy = PS, rot = 0;
      if (p.moving) {
        const ph = p.anim / 5.6;
        const f = ((Math.floor(ph * 6) % 6) + 6) % 6;
        set = SPR.gent.walk[f];
        lift = Math.abs(Math.sin(ph * TAU)) * 0.9;
        rot = 0.03 * (flip ? -1 : 1);
      } else {
        set = SPR.gent.idle;
        const b = Math.sin(rt * 2.2);
        sy *= 1 + b * 0.012; sx *= 1 - b * 0.006;
      }
      if (p.levelT > 0) {
        // sunburst halo behind the figure
        const k = p.levelT, cx = p.x, cy = p.y - 16;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, k * 1.5) * 0.55;
        ctx.beginPath();
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * TAU + rt * 0.4, w = 0.07, R = 30 * (1.3 - k * 0.3);
          ctx.moveTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9);
          ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R); ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); ctx.closePath();
        }
        ctx.fillStyle = '#e6c15a'; ctx.fill();
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
      if (p.dashT > 0) {
        const k = U.clamp(p.dashT / 0.2, 0, 1);
        rot += 0.16 * (p.dashX >= 0 ? 1 : -1) * k;
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = (0.42 / i) * k;
          blit(ctx, V, set.g, p.x - p.dashX * i * 7, p.y - p.dashY * i * 7 - lift, sx, sy, rot, flip);
        }
        ctx.globalAlpha = 0.75 * k;
        const nx = -p.dashY, ny = p.dashX;
        ctx.beginPath();
        for (const o of [-6, 0, 6]) { const bx = p.x + nx * o - p.dashX * 6, by = p.y - 14 + ny * o - p.dashY * 6; ctx.moveTo(bx, by); ctx.lineTo(bx - p.dashX * 22, by - p.dashY * 22); }
        ctx.strokeStyle = GOLD.lt; ctx.lineWidth = 0.55; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      let a = 1;
      if (p.iframes > 0 && p.hurtT <= 0 && p.dashT <= 0 && (Math.floor(rt * 16) & 1)) a = 0.55;
      ctx.globalAlpha = a;
      if (p.shootT > 0) { sy *= 1 - 0.03 * p.shootT; }
      blit(ctx, V, set.n, p.x, p.y - lift, sx, sy, rot, flip);
      if (p.hurtT > 0) { ctx.globalAlpha = Math.min(1, p.hurtT * 1.2); blit(ctx, V, set.f, p.x, p.y - lift, sx, sy, rot, flip); }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view), rt = view.rt;
      const bob = Math.sin(rt * 4 + o.idx * 1.7) * 1.3;
      const sh = SPR.shadow;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(sh.c, o.x - 5, o.y + 8 - 1.8, 10, 3.6);
      const y = o.y - 4 + bob;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.6 + 0.12 * Math.sin(rt * 8 + o.idx * 2.1);
      blit(ctx, V, SPR.glow, o.x, y, 0.95, 0.95, 0, false);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      blit(ctx, V, SPR.sun, o.x, y, 0.82, 0.82, rt * 2.2 + o.idx, false);
    },

    drawProjectile(ctx, pr, view) {
      const V = tf(view);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5;
      blit(ctx, V, SPR.glow, pr.x, pr.y, 0.38, 0.38, 0, false);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(1, (pr.age || 0) * 12 + 0.3);
      blit(ctx, V, SPR.dart, pr.x, pr.y, 1, 1, pr.angle || 0, false);
      ctx.globalAlpha = 1;
    },

    drawParticle(ctx, pt, view) {
      const V = tf(view), rt = view.rt;
      const t = 1 - pt.life / pt.max;
      const z = pt.z || 0;
      switch (pt.kind) {
        case 'glint': {
          const sc = pt.size * (t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75);
          if (sc <= 0.01) return;
          ctx.globalCompositeOperation = 'lighter';
          blit(ctx, V, SPR.glint, pt.x, pt.y - z, sc, sc, pt.rot, false);
          ctx.globalCompositeOperation = 'source-over';
          return;
        }
        case 'leaf': {
          const fl = Math.cos(rt * 10 + pt.seed * 30);
          const s = pt.size * (t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1);
          if (s <= 0.01) return;
          const spr = fl >= 0 ? SPR.leafF : SPR.leafB;
          blit(ctx, V, spr, pt.x + Math.sin(rt * 3 + pt.seed * 20) * 1.2, pt.y - z, s * (0.15 + 0.85 * Math.abs(fl)), s, pt.rot, false);
          return;
        }
        case 'shard': {
          const s = pt.size * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1);
          if (s <= 0.01) return;
          blit(ctx, V, SPR.shard[pt.col || 0], pt.x, pt.y - z, s, s, pt.rot, false);
          return;
        }
        case 'rays': {
          const R = pt.size, n = pt.n || 12, e = U.ease.outQuad(t);
          const r0 = R * (0.2 + 0.6 * e), r1 = R * (0.45 + 0.55 * e);
          const fy = pt.flat ? 0.5 : 1, cy = pt.y - z;
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - t;
          ctx.beginPath();
          for (let k = 0; k < n; k++) {
            const a = pt.rot + (k / n) * TAU, c = Math.cos(a), s = Math.sin(a) * fy, rr = k & 1 ? r1 * 0.72 : r1;
            ctx.moveTo(pt.x + c * r0, cy + s * r0); ctx.lineTo(pt.x + c * rr, cy + s * rr);
          }
          ctx.strokeStyle = pt.color || '#f5d98a'; ctx.lineWidth = Math.max(0.3, 1.3 * (1 - t)); ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          return;
        }
        case 'ring': {
          const r = pt.size * (5 + 26 * U.ease.outQuad(t)), a = 1 - t;
          if (a <= 0.02) return;
          ctx.globalAlpha = a;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.48, 0, 0, TAU);
          ctx.strokeStyle = GOLD.dk; ctx.lineWidth = 1.8; ctx.stroke();
          ctx.strokeStyle = pt.color || GOLD.lt; ctx.lineWidth = 1.0; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r * 0.82, r * 0.82 * 0.48, 0, 0, TAU);
          ctx.strokeStyle = pt.color || GOLD.lt; ctx.lineWidth = 0.4; ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        case 'streak': {
          const a = 1 - t;
          ctx.globalAlpha = a * 0.8;
          ctx.beginPath(); ctx.moveTo(pt.x, pt.y - z); ctx.lineTo(pt.x + (pt.dx || 0) * pt.size * (0.5 + t), pt.y - z + (pt.dy || 0) * pt.size * (0.5 + t));
          ctx.strokeStyle = GOLD.lt; ctx.lineWidth = 0.5; ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        default: {
          const a = U.clamp(pt.life / pt.max, 0, 1);
          ctx.globalAlpha = a; ctx.fillStyle = pt.color || GOLD.lt;
          const s = (pt.size || 2) * 0.5;
          ctx.fillRect(pt.x - s / 2, pt.y - z - s / 2, s, s);
          ctx.globalAlpha = 1;
        }
      }
    },

    drawNumber(ctx, n, view) {
      const V = tf(view);
      const spr = numSprite(n.value, n.crit, view.rt);
      const t = 1 - n.life / n.max;
      let sc = t < 0.12 ? 0.4 + (t / 0.12) * 0.75 : t < 0.25 ? 1.15 - ((t - 0.12) / 0.13) * 0.15 : 1;
      if (t > 0.75) sc *= 1 - ((t - 0.75) / 0.25) * 0.5;
      ctx.globalAlpha = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.2) : 1;
      blit(ctx, V, spr, n.x, n.y, sc, sc, 0, false);
      ctx.globalAlpha = 1;
    },

    drawIcon(ctx, id, size) {
      const fn = ICONS[id] || ICONS.sun;
      ctx.save();
      ctx.scale(size / 48, size / 48);
      fn(ctx);
      ctx.restore();
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e) {
      const h = heightOf(e), x = e.x + (Math.random() - 0.5) * 4, y = e.y + 0.5;
      glint(game, x, y, h + (Math.random() - 0.5) * 4, e.type === 'colossus' ? 1.6 : 1.25, 0.26);
      rays(game, x, y, h, 10, e.type === 'colossus' ? 16 : 12, 0.24);
      if (Math.random() < 0.6) leaves(game, e.x, y, h, 2, 40, 0.5);
    },
    onKill(game, e) {
      const x = e.x, y = e.y + 0.6, big = e.type === 'colossus', h = heightOf(e);
      rays(game, x, y, h, big ? 20 : 14, big ? 30 : 16, big ? 0.5 : 0.36);
      game.addParticle({ kind: 'ring', x, y, life: big ? 0.6 : 0.4, size: big ? 1.5 : 0.8, drag: 0 });
      leaves(game, x, y, h, big ? 16 : 8, big ? 80 : 55, 1.0);
      shards(game, x, y, h, big ? 8 : 4, shardOf(e), big ? 70 : 50);
      for (let i = 0; i < (big ? 4 : 2); i++) glint(game, x + (Math.random() - 0.5) * 16, y, h + Math.random() * 12, 0.8 + Math.random() * 0.5, 0.45);
      if (big) game.shake = Math.max(game.shake || 0, 4);
    },
    onHurt(game, p) {
      rays(game, p.x, p.y + 0.5, 16, 14, 18, 0.32, '#ff7a6a');
      shards(game, p.x, p.y + 0.5, 16, 5, 5, 55);
      glint(game, p.x, p.y + 0.5, 18, 1.2, 0.25);
    },
    onDash(game, p) {
      const nx = -p.dashY, ny = p.dashX;
      for (const o of [-5, 0, 5]) game.addParticle({ kind: 'streak', x: p.x + nx * o, y: p.y + ny * o, z: 8 + o * 0.6, dx: -p.dashX, dy: -p.dashY, size: 18, life: 0.3, drag: 0 });
      for (let i = 0; i < 4; i++) glint(game, p.x - p.dashX * i * 5, p.y - p.dashY * i * 5 + 0.5, 4 + Math.random() * 10, 0.5, 0.35, -p.dashX * 20, -p.dashY * 20);
    },
    onShoot(game, pr) {
      if (Math.random() < 0.4) glint(game, pr.x, pr.y + 4, 4, 0.5, 0.14);
    },
    onPickup(game, g) {
      const p = game.player;
      glint(game, p.x + (Math.random() - 0.5) * 10, p.y + 0.5, 8 + Math.random() * 16, g && g.big ? 1.2 : 0.7, 0.32);
      if (g && g.big) game.addParticle({ kind: 'ring', x: p.x, y: p.y, life: 0.35, size: 0.6, drag: 0, color: '#bff2e8' });
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'ring', x: p.x, y: p.y, life: 0.7, size: 2.0, drag: 0 });
      rays(game, p.x, p.y + 0.5, 1, 28, 50, 0.7, '#f5d98a', true);
      rays(game, p.x, p.y + 0.5, 16, 16, 26, 0.5);
      leaves(game, p.x, p.y + 0.5, 22, 20, 70, 1.4);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; glint(game, p.x + Math.cos(a) * 16, p.y + Math.sin(a) * 7, 10 + Math.random() * 16, 1.0, 0.6); }
    },
    onDeath(game, p) {
      rays(game, p.x, p.y + 0.5, 14, 28, 40, 0.8, '#ff7a6a');
      leaves(game, p.x, p.y + 0.5, 16, 24, 80, 1.6);
    },
  });
})();
