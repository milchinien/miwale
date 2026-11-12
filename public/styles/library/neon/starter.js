/* Neon Midnight — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Core trick: every sprite is drawn twice (a 'full' pass with sharp tubes and a 'glow' pass with fat strokes),
   the glow pass is blurred ONCE at bake time and stacked under the sharp pass. Nothing is blurred per frame. */
(function (root) {
  'use strict';
  const PALETTE = {
    void: '#05040d', ground: '#06050f', hero: '#ff7a1a', amber: '#ffae35', face: '#ffe7a0', scarf: '#ffe14a', stem: '#9cff4a',
    magenta: '#ff3ad6', violet: '#b066ff', root: '#d77bff', cyan: '#6ff4ff', ice: '#eaffff',
    acid: '#b44dff', acidDark: '#7a38d6', toxic: '#8dff2a', lime: '#c6ff3a', gemCyan: '#45f4ff',
    seed: '#ff9a2e', lavender: '#c3b5ff', lavenderDark: '#6a5ad0', pink: '#ff4fd8', hurt: '#ff2a7a',
  };
  const P = PALETTE, TAU = Math.PI * 2, K = 4; // K = bake resolution, px per world unit
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };
  const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const hexA = (h, a) => rgba(hexRgb(h), a);
  /** "Hot core" colour: the line colour pushed towards white (default 62 %). */
  const hot = (h, t) => { const c = hexRgb(h), k = t === undefined ? 0.6 : t; return rgba(c.map((v) => v + (255 - v) * k), 1); };
  // deterministic hash / value noise / fbm / rng (no Math.random anywhere)
  function hash(i, j, s) { let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function noise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s, o) { let t = 0, a = 0.5, n = 0; for (let i = 0; i < o; i++) { t += noise(x, y, s + i * 17) * a; n += a; x *= 2.03; y *= 2.03; a *= 0.5; } return t / n; }
  function rng(seed) { let a = seed >>> 0; const next = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { next, range: (a0, b0) => a0 + (b0 - a0) * next(), int: (a0, b0) => a0 + Math.floor(next() * (b0 - a0 + 1)), chance: (p) => next() < p, sign: () => (next() < 0.5 ? -1 : 1) }; }

  /* ---------- sprite toolkit (ported from the style module) ---------- */
  /** A neon tube: 'full' pass = coloured line + hot white-ish core at 36 % width; 'glow' pass = 1.8x fat line (gets blurred). */
  function tube(c, pass, col, lw, o) {
    if (pass === 'full') {
      c.strokeStyle = col; c.lineWidth = lw; c.stroke();
      if (!o || o.hot !== false) { c.strokeStyle = (o && o.hotCol) || hot(col, 0.62); c.lineWidth = lw * 0.36; c.stroke(); }
    } else if (!o || o.glow !== false) { c.strokeStyle = (o && o.glowCol) || col; c.lineWidth = lw * ((o && o.gw) || 1.8); c.stroke(); }
  }
  /** Dark "glass" fill in the full pass; optional coloured fill in the glow pass (for glowing faces/eyes). */
  function fillIn(c, pass, col, glowCol) { if (pass === 'full') { if (col) { c.fillStyle = col; c.fill(); } } else if (glowCol) { c.fillStyle = glowCol; c.fill(); } }
  function tri(c, ax, ay, bx, by, cx, cy) { c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx, cy); c.closePath(); }
  function poly(c, p, close) { c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); if (close) c.closePath(); }
  /** Bake: wide blur (2.2 u) at 70 % + tight blur (0.6 u) at 60 % of the glow pass, sharp pass on top. */
  function bakeSet(l, t, r, b, draw, o) {
    o = o || {};
    const w = Math.ceil((l + r) * K), h = Math.ceil((t + b) * K);
    const pass = (p) => { const c = mk(w, h), x = c.getContext('2d'); x.lineCap = 'round'; x.lineJoin = 'round'; x.setTransform(K, 0, 0, K, l * K, t * K); draw(x, p); return c; };
    const full = pass('full'), glow = pass('glow'), c = mk(w, h), x = c.getContext('2d');
    const wide = o.wide || 2.2, tight = o.tight || 0.6, ga = o.glowA === undefined ? 1 : o.glowA;
    x.filter = 'blur(' + wide * K + 'px)'; x.globalAlpha = Math.min(1, 0.7 * ga); x.drawImage(glow, 0, 0);
    if (ga > 1.2) { x.globalAlpha = Math.min(1, 0.7 * (ga - 1)); x.drawImage(glow, 0, 0); }
    x.filter = 'blur(' + tight * K + 'px)'; x.globalAlpha = Math.min(1, 0.6 * ga); x.drawImage(glow, 0, 0);
    x.filter = 'none'; x.globalAlpha = 1; x.drawImage(full, 0, 0);
    return { img: c, full, w: w / K, h: h / K, ax: (l * K) / w, ay: (t * K) / h };
  }
  /** Silhouette copy in one colour (white hit flash, magenta/cyan chroma-split copies). */
  function tint(src, col) { const c = mk(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
  function flip(src) { const c = mk(src.width, src.height), x = c.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c; }
  function makeSprite(l, t, r, b, draw, o) {
    const B = bakeSet(l, t, r, b, draw, o);
    const R = { img: B.img, flash: tint(B.full, '#ffffff'), red: tint(B.full, '#ff2a7a'), cyan: tint(B.full, '#2ae8ff'), w: B.w, h: B.h, ax: B.ax, ay: B.ay };
    return [R, { img: flip(R.img), flash: flip(R.flash), red: flip(R.red), cyan: flip(R.cyan), w: B.w, h: B.h, ax: 1 - B.ax, ay: B.ay }];
  }
  const blit = (ctx, s, img, x, y) => ctx.drawImage(img, x - s.ax * s.w, y - s.ay * s.h, s.w, s.h);
  /** Floor contact pool: dark core + coloured rim (replaces a drop shadow). */
  function makePool(col, darkA, rimA) {
    const c = mk(96, 96), x = c.getContext('2d'), g = x.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, 'rgba(0,0,0,' + darkA + ')'); g.addColorStop(0.38, 'rgba(0,0,0,' + darkA * 0.75 + ')'); g.addColorStop(0.62, hexA(col, rimA)); g.addColorStop(1, hexA(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, 96, 96); return c;
  }

  /* ---------- characters (feet at 0,0, facing right, world units) ---------- */
  function pumpkinPath(c, cx, cy, rx, ry, depth) {
    depth = depth === undefined ? 0.035 : depth; c.beginPath();
    for (let i = 0; i <= 56; i++) { const t = (i / 56) * TAU, r = 1 + depth * Math.cos(6 * t) - 0.08 * Math.pow(Math.max(0, -Math.sin(t)), 14);
      const x = cx + Math.cos(t) * rx * r, y = cy + Math.sin(t) * ry * r; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    c.closePath();
  }
  function faceGrad(c, x, y, r) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, '#fffbe2'); g.addColorStop(0.55, '#ffe08a'); g.addColorStop(1, '#ffa526'); return g; }
  /** Two-bone IK: [jointX, jointY, endX, endY]; bend -1 = joint in front (knee), +1 = behind (elbow). */
  function ik(ax, ay, bx, by, l1, l2, bend) {
    let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-3;
    if (d > l1 + l2 - 0.02) { const k = (l1 + l2 - 0.02) / d; bx = ax + dx * k; by = ay + dy * k; dx *= k; dy *= k; d = l1 + l2 - 0.02; }
    const q = (l1 * l1 - l2 * l2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, l1 * l1 - q * q));
    return [ax + (dx * q) / d - (dy / d) * hh * bend, ay + (dy * q) / d + (dx / d) * hh * bend, bx, by];
  }
  /** Main character walk pose ph 0..1: contact – down – passing – up, IK legs + boots, counter-swinging arms,
      head and jacket hem lagging, scarf tails on a travelling wave. Feet at (0,0), facing +x. */
  function heroPose(c, pass, ph) {
    const a = ph * TAU, dy = 0.85 * Math.sin(2 * a), body = P.amber, far = '#c06a18', dark = 'rgba(26,10,3,0.96)';
    const hipY = -8.3 + dy, shY = -14.9 + dy, hem = 0.7 * Math.sin(2 * a - 1.5), hdy = dy + 0.4 * Math.sin(2 * a - 1.1);
    const leg = (hx, fx, lift, col) => {
      const [kx, ky, ax, ay] = ik(hx, hipY, fx, -lift - 1.0, 4.3, 4.0, -1);
      c.beginPath(); c.moveTo(hx, hipY); c.lineTo(kx, ky); c.lineTo(ax, ay); tube(c, pass, col, 1.15);
      const p = -0.4 * Math.min(1, lift), cs = Math.cos(p), sn = Math.sin(p), pt = (x, y) => [ax + x * cs - y * sn, ay + x * sn + y * cs];
      const h0 = pt(-1.0, 0.95), t0 = pt(2.6, 0.95), t1 = pt(2.4, -0.1), b0 = pt(-0.6, -0.4);
      c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(h0[0], h0[1]); c.lineTo(t0[0], t0[1]); c.quadraticCurveTo(t1[0] + 0.4, t1[1], t1[0] - 0.6, t1[1] - 0.2); c.closePath();
      fillIn(c, pass, dark); tube(c, pass, col, 0.75);
    };
    const arm = (sx, sw, col) => {
      const sy = shY + 0.3, [ex, ey, hx, hy] = ik(sx, sy, sx + Math.sin(sw) * 5, sy + Math.cos(sw) * 5 - Math.max(0, sw) * 0.6, 2.9, 2.9, 1);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); tube(c, pass, col, 1.05);
      c.beginPath(); c.arc(hx, hy, 0.95, 0, TAU); fillIn(c, pass, dark, col); tube(c, pass, col, 0.55, { hot: false });
    };
    const scarf = (off, n, w) => { // each link lags the previous one by 0.95 rad: follow-through
      let x = -1.7, y = shY - 0.6; c.beginPath(); c.moveTo(x, y);
      for (let i = 0; i < n; i++) { const an = Math.PI - 0.5 + off - 0.12 * i + 0.26 * Math.sin(2 * a - 1 - 0.95 * i - off * 2); x += Math.cos(an) * (2.8 - i * 0.2); y += Math.sin(an) * (2.8 - i * 0.2); c.lineTo(x, y); }
      tube(c, pass, P.scarf, w);
    };
    arm(-0.9, 0.62 * Math.cos(a), far);
    leg(-1.0, -0.4 - 3.5 * Math.cos(a), 2 * Math.max(0, Math.sin(a)), far);
    scarf(0.18, 3, 0.85); scarf(0, 4, 1.15);
    leg(1.0, 0.6 + 3.5 * Math.cos(a), 2 * Math.max(0, -Math.sin(a)), body);
    c.beginPath(); c.moveTo(-2.9, shY - 0.4); c.lineTo(2.9, shY - 0.4); c.quadraticCurveTo(3.7, shY + 3, 4.4 + hem * 0.25, hipY + 0.3); // flared jacket, hem swings late
    c.quadraticCurveTo(0.2, hipY + 1.6 + hem * 0.15, -4.5 + hem * 0.5, hipY + 0.4); c.quadraticCurveTo(-3.6, shY + 3, -2.9, shY - 0.4); c.closePath();
    fillIn(c, pass, dark); tube(c, pass, body, 1.0);
    c.beginPath(); c.moveTo(-2.1, shY); c.lineTo(3.0, hipY - 1.2); tube(c, pass, '#ffcf7a', 0.5, { hot: false });
    c.beginPath(); c.rect(2.0, hipY - 2.3, 2.9, 2.4); fillIn(c, pass, dark); tube(c, pass, '#ffcf7a', 0.55, { hot: false });
    const hx = 0.5, hy = -21.9 + hdy, rx = 7.6, ry = 6.3;
    pumpkinPath(c, hx, hy, rx, ry); fillIn(c, pass, 'rgba(30,9,2,0.97)');
    if (pass === 'full') { c.beginPath(); c.moveTo(hx - 3.6, hy - ry * 0.93); c.quadraticCurveTo(hx - 7.0, hy, hx - 3.6, hy + ry * 0.93);
      c.moveTo(hx + 4.6, hy - ry * 0.9); c.quadraticCurveTo(hx + 7.6, hy, hx + 4.6, hy + ry * 0.9); c.strokeStyle = 'rgba(255,110,30,0.55)'; c.lineWidth = 0.55; c.stroke();
      c.beginPath(); c.ellipse(hx - 0.4, hy + 0.3, rx * 0.88, ry * 0.86, 0, Math.PI * 0.6, Math.PI * 1.05); c.strokeStyle = 'rgba(255,58,214,0.55)'; c.lineWidth = 0.5; c.stroke(); } // cool rim, shadow side
    pumpkinPath(c, hx, hy, rx, ry); tube(c, pass, P.hero, 1.35);
    c.beginPath(); c.moveTo(hx - 0.2, hy - ry + 0.5); c.quadraticCurveTo(hx - 0.1, hy - ry - 1.8, hx + 1.9, hy - ry - 2.7); tube(c, pass, P.stem, 1.15);
    const fx = hx + 1.7, fy = hy; c.beginPath(); // carved face: filled gradient, glows #ffb000 in the glow pass
    tri(c, fx - 4.4, fy - 0.3, fx - 1.4, fy - 0.3, fx - 2.8, fy - 3.7); tri(c, fx + 0.6, fy - 0.3, fx + 3.6, fy - 0.3, fx + 2.2, fy - 3.7);
    c.moveTo(fx - 5.0, fy + 2.0); poly(c, [fx - 5.0, fy + 2.0, fx - 3.2, fy + 2.7, fx - 2.4, fy + 2.0, fx - 1.0, fy + 2.8, fx + 0.1, fy + 2.1, fx + 1.3, fy + 2.8, fx + 2.4, fy + 2.0, fx + 3.4, fy + 2.6, fx + 4.7, fy + 1.7]);
    c.quadraticCurveTo(fx + 0.2, fy + 6.6, fx - 5.0, fy + 2.0); c.closePath();
    fillIn(c, pass, pass === 'full' ? faceGrad(c, fx - 0.3, fy + 0.6, 5.5) : null, '#ffb000');
    c.beginPath(); c.moveTo(-3.3, shY - 0.7); c.quadraticCurveTo(0.2, shY + 0.9, 3.4, shY - 0.6); tube(c, pass, P.scarf, 1.75);
    arm(0.9, -0.62 * Math.cos(a), body);
  }
  function leaf(c, pass, bx, by, ang, len, wid, col, fc) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, tx = bx + dx * len, ty = by + dy * len, mx = bx + dx * len * 0.5, my = by + dy * len * 0.5;
    c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(mx + nx * wid, my + ny * wid, tx, ty); c.quadraticCurveTo(mx - nx * wid, my - ny * wid, bx, by); c.closePath();
    fillIn(c, pass, fc); tube(c, pass, col, 0.8);
  }
  function bulbPath(c) { c.beginPath(); c.moveTo(0, -20); c.bezierCurveTo(-4.4, -19.8, -8.9, -16.6, -8.9, -11.6); c.bezierCurveTo(-8.9, -6.9, -4.9, -4.2, 0, -4.2);
    c.bezierCurveTo(4.9, -4.2, 8.9, -6.9, 8.9, -11.6); c.bezierCurveTo(8.9, -16.6, 4.4, -19.8, 0, -20); c.closePath(); }
  /** Small creature: magenta root bulb with violet leaves, glowing pink eyes, root legs. */
  function creeperPose(c, pass, ph) {
    const a = ph * TAU, s = Math.sin(a), bob = -Math.abs(s) * 1.2, dark = 'rgba(32,4,34,0.96)';
    for (const sd of [-1, 1]) { const lift = Math.max(0, sd * s) * 1.9, hx = sd * 2.6, hy = -5.4 + bob * 0.6, fx = sd * 3.6 + s * 1.1, fy = -lift;
      c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + sd * 1.7, (hy + fy) / 2, fx, fy); c.lineTo(fx + sd * 1.6, fy + 0.1); tube(c, pass, P.root, 0.95); }
    c.save(); c.translate(0, bob); c.translate(0, -6); c.rotate(s * 0.09); c.translate(0, 6);
    const sw = Math.sin(a + 1.2) * 0.1;
    leaf(c, pass, -0.6, -20.6, -2.25 + sw, 5.6, 1.9, P.violet, dark); leaf(c, pass, 0.6, -20.6, -0.9 + sw, 5.8, 1.9, P.violet, dark); leaf(c, pass, 0, -20.8, -1.6 + sw * 0.6, 7.2, 2.2, P.violet, dark);
    bulbPath(c); fillIn(c, pass, dark);
    const waveY = (x) => -14.6 + Math.sin(x * 0.9 + 0.5) * 0.55;
    if (pass === 'full') { c.save(); bulbPath(c); c.clip(); c.beginPath(); c.moveTo(-10, -22); c.lineTo(10, -22); for (let x = 10; x >= -10; x -= 0.5) c.lineTo(x, waveY(x)); c.closePath();
      c.fillStyle = 'rgba(170,40,215,0.42)'; c.fill(); c.restore(); } // tinted "liquid" cap inside the glass body
    c.beginPath(); for (let x = -8.4; x <= 8.4; x += 0.4) { if (x === -8.4) c.moveTo(x, waveY(x)); else c.lineTo(x, waveY(x)); } tube(c, pass, P.violet, 0.6, { hot: false });
    bulbPath(c); tube(c, pass, P.magenta, 1.25);
    const ex = 1.5; c.beginPath(); tri(c, ex - 4.4, -12.5, ex - 0.9, -11.0, ex - 2.9, -9.3); tri(c, ex + 4.4, -12.5, ex + 0.9, -11.0, ex + 2.9, -9.3); fillIn(c, pass, '#ffeafb', '#ff5fe4');
    c.beginPath(); poly(c, [ex - 2.5, -6.9, ex - 1.25, -7.8, ex, -6.9, ex + 1.25, -7.8, ex + 2.5, -6.9]); tube(c, pass, '#ffa6f2', 0.55, { hot: false });
    c.restore();
  }
  function ghostBody(c, w1, w2, w3) {
    c.beginPath(); c.moveTo(-6.6, -17.6); c.arc(0, -17.6, 6.6, Math.PI, 0); c.bezierCurveTo(6.6, -13.6, 6.3, -10.6, 4.8, -8.4 + w1 * 0.3);
    c.quadraticCurveTo(3.6, -6.2 + w2 * 0.5, 1.9, -7.7); c.quadraticCurveTo(0.4, -5.6 + w3 * 0.5, -1.6, -7.1); c.quadraticCurveTo(-4.4, -5.4 + w1 * 0.6, -7.8 + w2 * 0.5, -4.4 + w3 * 0.6);
    c.quadraticCurveTo(-10.6 + w3 * 0.7, -3.6 + w1 * 0.7, -11.6 + w1 * 0.8, -5.8 + w2 * 0.6); c.quadraticCurveTo(-8.6, -8.0, -7.0, -11.6); c.quadraticCurveTo(-6.6, -14.4, -6.6, -17.6); c.closePath();
  }
  /** Fast creature: floating translucent cyan sheet, black hollow eyes + mouth, frost sparkles. */
  function ghostPose(c, pass, ph) {
    const a = ph * TAU, w1 = Math.sin(a), w2 = Math.sin(a + 2.1), w3 = Math.sin(a + 4.2);
    const arm = (sx, sy, ex, ey, hx, hy, lw) => { c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(ex, ey, hx, hy); c.moveTo(hx, hy); c.lineTo(hx + 1.6, hy - 1.1); c.moveTo(hx, hy); c.lineTo(hx + 1.9, hy + 0.15); tube(c, pass, P.cyan, lw, { hot: false }); };
    arm(4.0, -10.4, 7.2, -8.8 + w2 * 0.5, 8.8, -9.6 + w2 * 0.5, 0.6);
    ghostBody(c, w1, w2, w3); fillIn(c, pass, 'rgba(6,26,44,0.58)');
    if (pass === 'full') { c.save(); ghostBody(c, w1, w2, w3); c.clip(); ghostBody(c, w1, w2, w3); c.strokeStyle = 'rgba(111,244,255,0.2)'; c.lineWidth = 3.4; c.stroke(); c.restore(); } // inner rim glow
    ghostBody(c, w1, w2, w3); tube(c, pass, P.cyan, 1.15);
    c.beginPath(); c.ellipse(0.2, -18.6, 1.45, 2.05, -0.08, 0, TAU); c.moveTo(5.55, -18.4); c.ellipse(4.1, -18.4, 1.45, 2.05, 0.08, 0, TAU); fillIn(c, pass, '#010409'); tube(c, pass, P.cyan, 0.42, { hot: false });
    c.beginPath(); c.arc(0.6, -17.9, 0.42, 0, TAU); c.moveTo(4.9, -17.7); c.arc(4.5, -17.7, 0.42, 0, TAU); fillIn(c, pass, '#d8feff', '#9ff8ff');
    c.beginPath(); c.ellipse(2.4, -13.1, 1.45, 2.3 + w1 * 0.15, 0, 0, TAU); fillIn(c, pass, '#010409'); tube(c, pass, P.cyan, 0.42, { hot: false });
    arm(5.0, -12.8, 8.2, -12.2 + w1 * 0.5, 9.8, -13.0 + w1 * 0.5, 0.65);
    const tw = 0.6 + 0.4 * Math.sin(a * 2), spk = (x, y, r) => { c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); };
    c.beginPath(); spk(-4.8, -25.6, 0.9 * tw); spk(6.6, -23.6, 0.7 * (1.4 - tw)); tube(c, pass, '#ffffff', 0.3, { hot: false, glowCol: P.cyan });
  }
  function hexPath(c, x, y, r, rot) { for (let i = 0; i < 6; i++) { const t = rot + (i / 6) * TAU; if (i) c.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r); else c.moveTo(x + Math.cos(t) * r, y + Math.sin(t) * r); } c.closePath(); }
  /** Large creature: faceted violet crystal golem with a pulsing toxic-green hex core and green cracks. */
  function brutePose(c, pass, ph) {
    const a = ph * TAU, s = Math.sin(a), PU = P.acid, PD = P.acidDark, GR = P.toxic, dark = 'rgba(22,6,38,0.97)';
    c.save(); c.scale(0.92, 0.92);
    const bob = Math.abs(s) * -1.5 + 0.6, liftL = Math.max(0, s) * 3.0, liftR = Math.max(0, -s) * 3.0;
    const limb = (pts, w) => { c.beginPath(); poly(c, pts); if (pass === 'full') { c.strokeStyle = PU; c.lineWidth = w; c.stroke(); c.strokeStyle = dark; c.lineWidth = w - 2.1; c.stroke(); } else { c.strokeStyle = PU; c.lineWidth = w + 0.6; c.stroke(); } };
    for (const sd of [-1, 1]) { const sw = sd * s * 1.5, wx = sd * 19.8 + sw, wy = -18.8 + bob + Math.abs(sw) * 0.25;
      limb([sd * 14, -34 + bob, sd * 19.4 + sw * 0.4, -26.6 + bob, wx, wy], 5.4); c.beginPath(); hexPath(c, wx, wy + 2.6, 3.7, 0.3); fillIn(c, pass, dark); tube(c, pass, PU, 1.1); }
    for (const [cx, lift] of [[-6.2, liftL], [6.2, liftR]]) { c.beginPath(); poly(c, [cx - 3.4, -12 + bob, cx + 3.4, -12 + bob, cx + 4.3, -lift - 1.4, cx + 5.0, -lift, cx - 5.0, -lift, cx - 4.3, -lift - 1.4], true); fillIn(c, pass, dark); tube(c, pass, PU, 1.15); }
    for (const L of [[-6, -41, -10.5, -48, -9, -48.5, -11.5, -54, -6.5, -49.5, -3, -44], [-2.5, -44, -2.6, -51, -1.2, -50.5, 0.4, -58, 2.6, -50, 3.6, -51, 2.8, -44], [3.5, -43.5, 7.0, -50, 8.0, -48.6, 11.4, -52.5, 9.8, -46.5, 6.4, -40.6]]) {
      c.beginPath(); poly(c, L.map((v, i) => (i & 1 ? v + bob : v)), true); fillIn(c, pass, dark); tube(c, pass, PU, 0.95); }
    const B = [0, -45, -9, -42.5, -15.5, -35, -17, -25, -14, -15.5, -7, -10.5, 7, -10.5, 14, -15.5, 17, -25, 15.5, -35, 9, -42.5].map((v, i) => (i & 1 ? v + bob : v));
    const I = [-6, -36, 8, -35.5, 11.5, -23, 4, -15.5, -8.5, -17.5, -11.5, -27.5].map((v, i) => (i & 1 ? v + bob : v));
    c.beginPath(); poly(c, B, true); fillIn(c, pass, dark);
    c.beginPath(); poly(c, I, true); for (const [bi, ii] of [[0, 0], [2, 1], [4, 1], [6, 2], [8, 2], [10, 3], [12, 3], [14, 4], [16, 5], [18, 5], [20, 0]]) { c.moveTo(B[bi], B[bi + 1]); c.lineTo(I[ii * 2], I[ii * 2 + 1]); }
    tube(c, pass, PD, 0.55, { hot: false, gw: 1.2 }); // facet lines: dim, no hot core
    c.beginPath(); poly(c, B, true); tube(c, pass, PU, 1.4);
    const cx = 2, cy = -26.5 + bob; c.beginPath();
    poly(c, [cx + 3.4, cy - 2.6, cx + 6.2, cy - 5.6, cx + 5.4, cy - 8.6, cx + 8.6, cy - 12]); poly(c, [cx - 3.2, cy - 2.2, cx - 6.6, cy - 4.4, cx - 8.6, cy - 8.8]);
    poly(c, [cx - 3.4, cy + 1.6, cx - 7.6, cy + 4.2, cx - 10.4, cy + 3.6, cx - 13.4, cy + 7.6]); poly(c, [cx + 3.6, cy + 2, cx + 7.2, cy + 5, cx + 10.6, cy + 4.4]);
    tube(c, pass, GR, 0.6, { hot: false });
    const cr = 4.3 + Math.sin(a * 2) * 0.35; c.beginPath(); hexPath(c, cx, cy, cr, Math.PI / 6);
    let cg = null; if (pass === 'full') { cg = c.createRadialGradient(cx, cy, 0, cx, cy, cr); cg.addColorStop(0, '#fbfff0'); cg.addColorStop(0.45, '#c8ff6a'); cg.addColorStop(1, '#45c414'); }
    fillIn(c, pass, cg, GR); tube(c, pass, '#d8ff9a', 0.6, { hot: false, glowCol: GR, gw: 3 });
    c.beginPath(); c.moveTo(2.4, -39.4 + bob); c.lineTo(6.0, -37.9 + bob); c.moveTo(9.2, -37.9 + bob); c.lineTo(12.6, -39.4 + bob); tube(c, pass, GR, 1.35);
    c.restore();
  }
  /** Collectible: rotating octahedron gem, translucent faces + bright outline + white specular dot. */
  function gemPose(c, pass, a) {
    const h = 3.7, bt = 2.8, w = 2.6, yc = -7.5, col = P.lime, vs = [];
    for (let k = 0; k < 4; k++) { const t = a + (k * Math.PI) / 2; vs.push([Math.cos(t) * w, yc + Math.sin(t) * w * 0.32, Math.sin(t)]); }
    for (let k = 0; k < 4; k++) { const v1 = vs[k], v2 = vs[(k + 1) % 4]; if (v1[2] + v2[2] <= 0) continue;
      const sh = 0.3 + 0.45 * ((Math.cos(a + (k * Math.PI) / 2 + Math.PI / 4 + 0.6) + 1) / 2);
      c.beginPath(); tri(c, 0, yc - h, v1[0], v1[1], v2[0], v2[1]); fillIn(c, pass, hexA(col, sh * 0.85), hexA(col, 0.55));
      c.beginPath(); tri(c, 0, yc + bt, v1[0], v1[1], v2[0], v2[1]); fillIn(c, pass, hexA(col, sh * 0.5), hexA(col, 0.4)); }
    let l = vs[0], r = vs[0]; for (const v of vs) { if (v[0] < l[0]) l = v; if (v[0] > r[0]) r = v; }
    c.beginPath(); poly(c, [0, yc - h, r[0], r[1], 0, yc + bt, l[0], l[1]], true); tube(c, pass, col, 0.6, { hotCol: '#ffffff' });
    c.beginPath(); c.arc(-w * 0.25, yc - h * 0.35, 0.5, 0, TAU); fillIn(c, pass, '#ffffff', '#ffffff');
  }

  /* ---------- ground: noise regions, each with its own glowing pattern, masked + added ('lighter') ---------- */
  const REG = [
    { base: [8, 8, 32], line: [136, 104, 255] }, { base: [3, 15, 21], line: [30, 214, 196] },
    { base: [30, 4, 22], line: [255, 64, 206] }, { base: [14, 9, 15], line: [255, 150, 64] },
  ];
  const WATER = { base: [2, 9, 30] }, WT = 0.635, CS = 6;
  const PAT = [
    (c, W, H, px) => { c.lineWidth = px; c.beginPath(); for (let x = 0; x <= W; x += 8) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 0; y <= H; y += 8) { c.moveTo(0, y); c.lineTo(W, y); }
      c.strokeStyle = 'rgba(120,80,255,0.16)'; c.stroke(); c.beginPath(); for (let x = 0; x <= W; x += 32) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 0; y <= H; y += 32) { c.moveTo(0, y); c.lineTo(W, y); }
      c.strokeStyle = 'rgba(120,70,255,0.1)'; c.lineWidth = px * 4; c.stroke(); c.strokeStyle = 'rgba(165,115,255,0.5)'; c.lineWidth = px; c.stroke(); },
    (c, W, H, px) => { const s = 9, w = Math.sqrt(3) * s, rh = 1.5 * s, lit = []; c.beginPath();
      for (let r = -1; r * rh <= H + s; r++) { const cy = r * rh, off = r & 1 ? w / 2 : 0; for (let q = -1; q * w <= W + w; q++) { const cx = q * w + off;
        c.moveTo(cx, cy - s); c.lineTo(cx + w / 2, cy - s / 2); c.lineTo(cx + w / 2, cy + s / 2); c.lineTo(cx, cy + s); if (hash(q, r, 313) < 0.075) lit.push(cx, cy); } }
      c.lineWidth = px; c.strokeStyle = 'rgba(40,215,195,0.34)'; c.stroke();
      c.beginPath(); for (let i = 0; i < lit.length; i += 2) { c.moveTo(lit[i], lit[i + 1] - s * 0.52); hexPath(c, lit[i], lit[i + 1], s * 0.52, -Math.PI / 2); }
      c.strokeStyle = 'rgba(100,255,230,0.6)'; c.lineWidth = 1.4 * px; c.stroke(); },
    (c, W, H) => { const sp = 6; c.beginPath(); for (let y = 0; y <= H + sp; y += sp) { const off = (y / sp) & 1 ? sp / 2 : 0; for (let x = off; x <= W + sp; x += sp) {
        const n = noise(x / 120, y / 120, 61), t = Math.min(1, Math.max(0, (n - 0.3) / 0.48)), r = 0.42 + 1.25 * t * t * (3 - 2 * t); c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } }
      c.fillStyle = 'rgba(255,70,200,0.52)'; c.fill(); },
    (c, W, H) => { const cell = 26, pads = []; c.beginPath();
      for (let j = -2; j * cell < H + 52; j++) for (let i = -2; i * cell < W + 52; i++) { const R = rng(hash(i, j, 9001) * 4294967296); if (!R.chance(0.42)) continue;
        let x = i * cell + R.int(0, 12) * 2, y = j * cell + R.int(0, 12) * 2, dir = R.int(0, 3) * (Math.PI / 2) + (R.chance(0.25) ? Math.PI / 4 : 0); c.moveTo(x, y); pads.push(x, y, 0.7);
        for (let k = R.int(2, 3); k > 0; k--) { const L = R.range(8, 26); x += Math.cos(dir) * L; y += Math.sin(dir) * L; c.lineTo(x, y); dir += R.sign() * (Math.PI / 4); } pads.push(x, y, 1.2); }
      c.strokeStyle = 'rgba(255,150,60,0.38)'; c.lineWidth = 0.6; c.stroke();
      c.beginPath(); for (let i = 0; i < pads.length; i += 3) if (pads[i + 2] > 1) { c.moveTo(pads[i] + 1.2, pads[i + 1]); c.arc(pads[i], pads[i + 1], 1.2, 0, TAU); } c.strokeStyle = 'rgba(255,190,100,0.7)'; c.lineWidth = 0.55; c.stroke();
      c.beginPath(); for (let i = 0; i < pads.length; i += 3) if (pads[i + 2] < 1) { c.moveTo(pads[i] + 0.7, pads[i + 1]); c.arc(pads[i], pads[i + 1], 0.7, 0, TAU); } c.fillStyle = 'rgba(255,175,90,0.75)'; c.fill(); },
    (c, W, H, px) => { c.beginPath(); for (let y = 0; y <= H; y += 2) { c.moveTo(0, y); c.lineTo(W, y); } c.strokeStyle = 'rgba(40,130,255,0.24)'; c.lineWidth = px; c.stroke(); },
  ];
  /** Marching squares on a field -> contour segments (iso 0). Gives seamless region borders. */
  function march(f, nx, ny, path) {
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const k = j * nx + i, a = f[k], b = f[k + 1], cc = f[k + nx + 1], d = f[k + nx];
      const id = (a > 0) | ((b > 0) << 1) | ((cc > 0) << 2) | ((d > 0) << 3); if (id === 0 || id === 15) continue;
      const x = (i - 0.5) * CS, y = (j - 0.5) * CS, T = [x + (CS * a) / (a - b), y], R = [x + CS, y + (CS * b) / (b - cc)], Bt = [x + (CS * d) / (d - cc), y + CS], L = [x, y + (CS * a) / (a - d)];
      const seg = (p, q) => { path.moveTo(p[0], p[1]); path.lineTo(q[0], q[1]); };
      switch (id) { case 1: case 14: seg(L, T); break; case 2: case 13: seg(T, R); break; case 3: case 12: seg(L, R); break; case 4: case 11: seg(R, Bt); break;
        case 6: case 9: seg(T, Bt); break; case 7: case 8: seg(L, Bt); break; case 5: seg(L, T); seg(R, Bt); break; case 10: seg(T, R); seg(L, Bt); break; }
    }
  }
  /** 3-stroke additive line glow: 6 u at 5 %, 2 u at 15 %, 1 px core at 62 %. */
  function glowStroke(ctx, path, col, px, k) {
    ctx.strokeStyle = rgba(col, 0.05 * k); ctx.lineWidth = 6; ctx.stroke(path); ctx.strokeStyle = rgba(col, 0.15 * k); ctx.lineWidth = 2; ctx.stroke(path);
    ctx.strokeStyle = rgba(col.map((v) => v + (255 - v) * 0.35), 0.62 * k); ctx.lineWidth = 1.15 * px; ctx.stroke(path);
  }
  function bakeGround(w, h) {
    const s = h / 360, W = w / s, H = 360, px = 1 / s, nx = Math.ceil(W / CS) + 2, ny = Math.ceil(H / CS) + 2, n = nx * ny;
    const m = [0, 1, 2, 3].map(() => new Float32Array(n)), wat = new Float32Array(n), sig = new Float32Array(n), road = new Float32Array(n);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = (i - 0.5) * CS, y = (j - 0.5) * CS, k = j * nx + i;
      const qx = fbm(x / 400, y / 400, 501, 2) - 0.5, qy = fbm(x / 400 + 7.3, y / 400 - 3.1, 502, 2) - 0.5, X = x / 330 + qx * 1.3 + 2.1, Y = y / 330 + qy * 1.3;
      m[0][k] = fbm(X, Y, 11, 2); m[1][k] = fbm(X + 13.1, Y - 7.7, 23, 2); m[2][k] = fbm(X - 5.3, Y + 19.9, 37, 2); m[3][k] = fbm(X + 29.3, Y + 3.7, 41, 2) + 0.06; wat[k] = fbm(x / 200 + 3.3, y / 200, 77, 3); sig[k] = fbm(x / 120, y / 120, 91, 2); road[k] = fbm(x / 300 + qx * 0.6 - 4.1, y / 300 + qy * 0.6 + 9.7, 1201, 2); }
    const base = new ImageData(nx, ny), masks = [0, 1, 2, 3, 4].map(() => new ImageData(nx, ny)), e = [0, 0, 0, 0];
    for (let k = 0; k < n; k++) { let mx = -1, sum = 0; for (let q = 0; q < 4; q++) mx = Math.max(mx, m[q][k]); for (let q = 0; q < 4; q++) { e[q] = Math.exp((m[q][k] - mx) / 0.012); sum += e[q]; }
      const ww = Math.min(1, Math.max(0, (wat[k] - WT + 0.01) / 0.02)), o = k * 4, br = 0.95; let r = 0, g = 0, b = 0;
      for (let q = 0; q < 4; q++) { const wq = (e[q] / sum) * (1 - ww); r += REG[q].base[0] * wq; g += REG[q].base[1] * wq; b += REG[q].base[2] * wq; const rn = 1 - Math.min(1, Math.max(0, (Math.abs(road[k] - 0.5) - 0.006) / 0.024)), inten = (0.16 + 0.84 * Math.min(1, Math.max(0, (sig[k] - 0.38) / 0.36))) * (1 - 0.8 * rn);
        masks[q].data.fill(255, o, o + 3); masks[q].data[o + 3] = wq * inten * 255; }
      r += WATER.base[0] * ww; g += WATER.base[1] * ww; b += WATER.base[2] * ww; masks[4].data.fill(255, o, o + 3); masks[4].data[o + 3] = ww * 0.9 * 255;
      base.data[o] = r * br; base.data[o + 1] = g * br; base.data[o + 2] = b * br; base.data[o + 3] = 255; }
    const out = mk(w, h), ctx = out.getContext('2d'), small = mk(nx, ny), sx = small.getContext('2d'), scr = mk(w, h), sc = scr.getContext('2d');
    ctx.fillStyle = P.void; ctx.fillRect(0, 0, w, h); ctx.setTransform(s, 0, 0, s, 0, 0); ctx.imageSmoothingEnabled = true;
    sx.putImageData(base, 0, 0); ctx.drawImage(small, -CS, -CS, nx * CS, ny * CS);
    for (let q = 0; q < 5; q++) { sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalCompositeOperation = 'source-over'; sc.clearRect(0, 0, w, h); sc.setTransform(s, 0, 0, s, 0, 0);
      PAT[q](sc, W, H, px); sx.putImageData(masks[q], 0, 0); sc.globalCompositeOperation = 'destination-in'; sc.drawImage(small, -CS, -CS, nx * CS, ny * CS);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(scr, 0, 0); ctx.restore(); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    { // light road: iso-line of a slow noise, dark lane with violet kerbs and a dim warm centre line (no dust sprinkle)
      const f = new Float32Array(n); for (let k = 0; k < n; k++) f[k] = wat[k] > WT - 0.012 ? -1 : road[k] - 0.5;
      const p = new Path2D(); march(f, nx, ny, p);
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(110,80,255,0.045)'; ctx.lineWidth = 17; ctx.stroke(p);
      ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#3a2f86'; ctx.lineWidth = 11.6; ctx.stroke(p); ctx.strokeStyle = '#06050d'; ctx.lineWidth = 10.4; ctx.stroke(p);
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,150,70,0.07)'; ctx.lineWidth = 2.4; ctx.stroke(p); ctx.strokeStyle = 'rgba(255,190,120,0.34)'; ctx.lineWidth = 0.5; ctx.stroke(p);
    }
    const f = new Float32Array(n);
    for (let q = 0; q < 4; q++) { for (let k = 0; k < n; k++) { let mo = -1; for (let o = 0; o < 4; o++) if (o !== q) mo = Math.max(mo, m[o][k]); f[k] = wat[k] > WT + 0.004 ? -1 : m[q][k] - mo; }
      const p = new Path2D(); march(f, nx, ny, p); glowStroke(ctx, p, REG[q].line, px, 0.4); }
    for (const [iso, col, k] of [[WT, [90, 200, 255], 0.95], [WT + 0.022, [60, 150, 255], 0.32]]) { for (let i = 0; i < n; i++) f[i] = wat[i] - iso; const p = new Path2D(); march(f, nx, ny, p); glowStroke(ctx, p, col, px, k); }
    return out;
  }
  /** Display overlay: 1 px scanlines every 3 px, violet vignette, magenta/cyan lens fringe on the edges. */
  function bakeOverlay(w, h) {
    const c = mk(w, h), x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < h; y += 3) x.fillRect(0, y, w, 1);
    const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) * 0.56);
    g.addColorStop(0, 'rgba(6,0,18,0)'); g.addColorStop(0.62, 'rgba(6,0,18,0.3)'); g.addColorStop(1, 'rgba(2,0,8,0.78)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const fw = w * 0.09; x.globalCompositeOperation = 'lighter';
    let lg = x.createLinearGradient(0, 0, fw, 0); lg.addColorStop(0, 'rgba(255,40,200,0.10)'); lg.addColorStop(1, 'rgba(255,40,200,0)'); x.fillStyle = lg; x.fillRect(0, 0, fw, h);
    lg = x.createLinearGradient(w, 0, w - fw, 0); lg.addColorStop(0, 'rgba(40,220,255,0.09)'); lg.addColorStop(1, 'rgba(40,220,255,0)'); x.fillStyle = lg; x.fillRect(w - fw, 0, fw, h);
    return c;
  }

  /* ---------- lazy sprite cache ---------- */
  let S = null, CACHE = { key: '' };
  function sprites() {
    if (S) return S;
    const frames = (n, fn, box, o) => Array.from({ length: n }, (_, i) => makeSprite(box[0], box[1], box[2], box[3], (c, p) => fn(c, p, i / n), o));
    S = { hero: frames(8, heroPose, [17, 38, 17, 6], { glowA: 1.25 }), creep: frames(8, creeperPose, [15, 34, 15, 6], { glowA: 0.85 }), ghost: frames(6, ghostPose, [19, 33, 18, 6], { glowA: 1.0 }),
      brute: frames(8, brutePose, [27, 60, 27, 7], { wide: 2.6, glowA: 0.9 }), gem: Array.from({ length: 8 }, (_, i) => bakeSet(7, 15, 7, 6, (c, p) => gemPose(c, p, (i / 8) * (Math.PI / 2)), { wide: 1.6, tight: 0.5, glowA: 1.2 })),
      pool: { hero: makePool(P.hero, 0.6, 0.26), creep: makePool(P.magenta, 0.5, 0.14), ghost: makePool(P.cyan, 0.2, 0.12), brute: makePool(P.toxic, 0.55, 0.16) } };
    return S;
  }

  /** Draws the main character with feet at (x, y). t = seconds, facing = 1 | -1. */
  function drawHero(ctx, x, y, t, facing) { const s = sprites().hero[Math.floor(t * 2.6 * 8) & 7][facing < 0 ? 1 : 0]; blit(ctx, s, s.img, x, y); }
  /** Draws a typical creature (small by default) with feet at (x, y). kind: 'creep' (small) | 'ghost' (fast) | 'brute' (large). */
  function drawEnemy(ctx, x, y, t, kind, facing, flash) {
    const set = sprites()[kind || 'creep'], n = set.length, sp = kind === 'brute' ? 1.8 : kind === 'ghost' ? 1.7 : 2.9;
    const s = set[Math.floor(t * sp * n) % n][facing < 0 ? 1 : 0]; if (kind === 'ghost') y -= 2.5 + Math.sin(t * 2.6 + x) * 1.3;
    blit(ctx, s, s.img, x, y);
    if (flash) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = flash; blit(ctx, s, s.flash, x, y); ctx.globalAlpha = 0.75 * flash; blit(ctx, s, s.red, x - 1.4, y); blit(ctx, s, s.cyan, x + 1.4, y); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  }

  /** Paints a complete preview scene into a w×h canvas at time t (seconds). */
  function draw(ctx, w, h, t) {
    const sp = sprites(), key = w + 'x' + h;
    if (CACHE.key !== key) CACHE = { key, ground: bakeGround(w, h), ovl: bakeOverlay(w, h) };
    const s = h / 360, W = w / s;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(CACHE.ground, 0, 0); ctx.setTransform(s, 0, 0, s, 0, 0);
    const hx = W * 0.44, hy = 205, R = rng(42), actors = [];
    actors.push({ k: 'brute', x: W * 0.6, y: 210, f: -1 }, { k: 'brute', x: W * 0.33, y: 92, f: 1 });
    for (let i = 0; i < 6; i++) actors.push({ k: i % 3 ? 'creep' : 'ghost', x: R.range(30, W - 30), y: R.range(60, 330), f: R.sign(), o: R.next() });
    for (let i = 0; i < 18; i++) actors.push({ k: i % 4 === 0 ? 'ghost' : 'creep', x: W * 0.68 + R.range(0, W * 0.3) + i * 0.5, y: 268 + R.range(0, 85), f: -1, o: R.next() });
    actors.push({ k: 'hero', x: hx, y: hy, f: 1 });
    ctx.globalCompositeOperation = 'lighter'; // main-character light spill on the floor + collectible gems
    const gl = ctx.createRadialGradient(hx, hy - 2, 0, hx, hy - 2, 58); gl.addColorStop(0, hexA('#ff8a2a', 0.34)); gl.addColorStop(0.35, hexA('#ff8a2a', 0.15)); gl.addColorStop(1, hexA('#ff8a2a', 0));
    ctx.save(); ctx.translate(0, (hy - 2) * 0.55); ctx.scale(1, 0.45); ctx.fillStyle = gl; ctx.fillRect(hx - 58, hy - 60, 116, 120); ctx.restore();
    for (let i = 0; i < 9; i++) { const g = sp.gem[Math.floor((t * 1.6 + i * 0.37) * 8) & 7], gx = W * 0.6 + (i % 3) * 14 - 40 + i * 3, gy = 245 + Math.floor(i / 3) * 16; blit(ctx, g, g.img, gx, gy + Math.sin(t * 3 + i) * 0.7); }
    ctx.globalCompositeOperation = 'source-over';
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) { const pk = a.k === 'hero' ? 'hero' : a.k, rw = a.k === 'hero' ? 13 : a.k === 'brute' ? 26 : a.k === 'ghost' ? 9 : 10.5; ctx.drawImage(sp.pool[pk], a.x - rw, a.y - rw * 0.4, rw * 2, rw * 0.8); }
    const ph = (t * 1.4) % 1, bx = W * 0.6, by = 210; // projectile flying from the main character to the large creature, impact flash near the end of its flight
    for (const a of actors) { if (a.k === 'hero') drawHero(ctx, a.x, a.y, t, 1); else drawEnemy(ctx, a.x, a.y, t + (a.o || 0) * 3, a.k, a.f, a.x === bx && ph > 0.85 ? (1 - ph) * 6 : 0); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    const px0 = hx + 8 + (bx - 20 - hx) * ph, py0 = hy - 14 + (by - 28 - hy + 14) * ph, tg = ctx.createLinearGradient(px0 - 24, py0, px0, py0);
    tg.addColorStop(0, 'rgba(255,90,20,0)'); tg.addColorStop(0.55, 'rgba(255,110,30,0.35)'); tg.addColorStop(1, 'rgba(255,150,50,0.95)');
    ctx.strokeStyle = tg; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(px0 - 24, py0); ctx.lineTo(px0, py0); ctx.stroke(); ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(px0 - 8, py0); ctx.lineTo(px0, py0); ctx.stroke();
    const kk = ((t * 1.1) % 1), cx = W * 0.25, cy = 250; // dissolve burst: line fragments + squashed ring, batched 2-pass additive strokes
    for (const [col, lw] of [[P.magenta, 0.8], ['#ffffff', 0.45]]) { ctx.strokeStyle = col; ctx.beginPath();
      for (let i = 0; i < 9; i++) { const an = hash(i, 3, col.length) * TAU, d = 4 + kk * (26 + hash(i, 5, 1) * 20), L = 3 * (1 - kk) + 1, x = cx + Math.cos(an) * d, y = cy - 10 + Math.sin(an) * d * 0.6 + kk * kk * 14; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an + i) * L, y + Math.sin(an + i) * L); }
      const rr = 4 + (1 - (1 - kk) * (1 - kk)) * 30; ctx.moveTo(cx + rr, cy); ctx.ellipse(cx, cy, rr, rr * 0.42, 0, 0, TAU);
      ctx.globalAlpha = (1 - kk) * 0.28; ctx.lineWidth = lw * 3.2; ctx.stroke(); ctx.globalAlpha = 1 - kk; ctx.lineWidth = lw; ctx.stroke(); }
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(CACHE.ovl, 0, 0); // HUD in screen px
    const u = h / 540; ctx.save(); ctx.translate(24 * u, 26 * u); ctx.transform(1, 0, -Math.tan(0.384), 1, 0, 0); // skewX(-22deg) segmented bar
    ctx.shadowColor = 'rgba(255,60,200,0.6)'; ctx.shadowBlur = 12 * u; ctx.fillStyle = 'rgba(22,4,26,0.82)'; ctx.fillRect(0, 0, 250 * u, 15 * u); ctx.shadowBlur = 14 * u; ctx.shadowColor = 'rgba(255,100,60,0.9)';
    const hg = ctx.createLinearGradient(0, 0, 250 * u, 0); hg.addColorStop(0, '#ff2bd0'); hg.addColorStop(0.45, '#ff5a6a'); hg.addColorStop(0.8, '#ff8a1f'); hg.addColorStop(1, '#ffc23a');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, 250 * u * 0.82, 15 * u); ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(10,2,14,0.85)'; for (let x = 23; x < 250; x += 25) ctx.fillRect(x * u, 0, 2 * u, 15 * u);
    ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = u; ctx.strokeRect(0, 0, 250 * u, 15 * u); ctx.restore();
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '900 ' + Math.round(38 * u) + "px 'Orbitron', sans-serif";
    const tg2 = ctx.createLinearGradient(0, 14 * u, 0, 52 * u); tg2.addColorStop(0, '#fff7e0'); tg2.addColorStop(0.36, '#ffd36b'); tg2.addColorStop(0.62, '#ff7a1a'); tg2.addColorStop(1, '#ff2bd0');
    const clock = '23:' + String(59 - (Math.floor(t) % 60)).padStart(2, '0');
    ctx.shadowColor = 'rgba(255,43,208,0.55)'; ctx.shadowBlur = 16 * u; ctx.fillStyle = tg2; ctx.fillText(clock, w / 2, 14 * u); ctx.shadowBlur = 5 * u; ctx.shadowColor = 'rgba(255,90,40,0.8)'; ctx.fillText(clock, w / 2, 14 * u);
    ctx.font = '600 ' + Math.round(10 * u) + "px 'Orbitron', sans-serif"; ctx.fillStyle = '#8ff8ff'; ctx.shadowColor = '#1ed8ff'; ctx.shadowBlur = 6 * u; ctx.fillText('T O   M I D N I G H T', w / 2, 58 * u);
    ctx.textAlign = 'right'; ctx.font = '800 ' + Math.round(24 * u) + "px 'Orbitron', sans-serif"; ctx.fillStyle = '#ffe6fb'; ctx.shadowColor = '#ff3ad6'; ctx.shadowBlur = 8 * u; ctx.fillText('88', w - 24 * u, 22 * u);
    ctx.shadowBlur = 0; ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  const Starter = { id: 'neon', name: 'Neon Midnight', palette: PALETTE, fonts: ['Orbitron:wght@500;700;900', 'Audiowide', 'Monoton', 'Rajdhani:wght@500;600;700'], drawHero, drawEnemy, draw };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['neon'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
