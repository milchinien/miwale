/* Risograph Print — starter kit from the miwale Game Style Library (https://miwale.com/styles/).
   Dependency-free Canvas 2D. Free to copy and adapt. Full spec: STYLE.md
   Three fluorescent spot inks on recycled paper, no black and no outlines. Every sprite is drawn as three ink
   plates in ONE mask canvas (R = pink, G = blue, B = yellow; 'lighter' adds ink, per-channel 'multiply' knocks it
   out), each plate shifted by its own misregistration. A bake turns the masks into colour:
   paper x product(1 - coverage x density x (1 - ink)), with drum grain and missing-ink specks. */
(function (root) {
  'use strict';
  const PALETTE = {
    paper: '#f3ede0', pink: '#ff48b0', blue: '#0078bf', yellow: '#ffe800',
    // what the inks become on paper (density applied) and where they overprint
    pinkPrint: '#f34f9f', bluePrint: '#3189b3', yellowPrint: '#f3d912',
    violet: '#312d7f', redOrange: '#f3480d', green: '#317d0e', nearBlack: '#312a0a',
  };
  const TAU = Math.PI * 2, PI = Math.PI;
  const PK = 0, BL = 1, YE = 2, ALL = [0, 1, 2];
  const INK = [[255, 72, 176], [0, 120, 191], [255, 232, 0]];
  const DENS = [0.93, 0.8, 0.92];
  const PAPER = [243, 237, 224];
  const ANG = [15, 75, 45].map((d) => d * PI / 180);
  const MR = [[0.72, -0.46], [-0.6, 0.48], [0.3, 0.66]];
  const CH = ['#ff0000', '#00ff00', '#0000ff'], KILL = ['#00ffff', '#ff00ff', '#ffff00'];
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y, s) => vnoise(x, y, s) * 0.55 + vnoise(x * 2, y * 2, s + 7) * 0.3 + vnoise(x * 4, y * 4, s + 13) * 0.15;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.ceil(w)), height: Math.max(1, Math.ceil(h)) });

  /* ---------------- drum grain: one 128x128 tile, reused by every plate at its own offset ---------------- */
  const GR = new Float32Array(128 * 128);
  (function () { const r = rng(7331); for (let i = 0; i < GR.length; i++) { let g = 0.92 + (r() - 0.5) * 0.16 + (vnoise((i & 127) / 8, (i >> 7) / 8, 5) - 0.5) * 0.12; if (r() < 0.028) g *= 0.25; GR[i] = clamp(g, 0, 1); } })();

  /* ---------------- the press: three plates in one mask canvas ---------------- */
  function Press(box, k) {
    const m = 1.6;
    this.k = k; this.l = box[0] - m; this.t = box[1] - m;
    this.w = Math.ceil((box[2] - box[0] + 2 * m) * k); this.h = Math.ceil((box[3] - box[1] + 2 * m) * k);
    this.mc = canvas(this.w, this.h); this.mx = this.mc.getContext('2d');
    this.mx.fillStyle = '#000'; this.mx.fillRect(0, 0, this.w, this.h); this.mx.globalCompositeOperation = 'lighter';
    this.pc = canvas(this.w, this.h); this.px = this.pc.getContext('2d');
    this.box = [this.l, this.t, box[2] + m, box[3] + m];
  }
  Press.prototype.T = function (c, i) { const o = i >= 0 ? MR[i] : [0, 0]; c.setTransform(this.k, 0, 0, this.k, (o[0] - this.l) * this.k, (o[1] - this.t) * this.k); };
  Press.prototype.knock = function (shape, inks) {
    const c = this.mx; c.globalCompositeOperation = 'multiply';
    for (const j of inks) { this.T(c, j); c.fillStyle = KILL[j]; c.beginPath(); shape(c); c.fill(); }
    c.globalCompositeOperation = 'lighter';
  };
  /** flat ink layer; o.tone = number or fn(x,y) for AM halftone dots; o.knock=false overprints what is below */
  Press.prototype.fill = function (inks, shape, o) {
    o = o || {}; if (!Array.isArray(inks)) inks = [inks];
    this.T(this.px, -1); this.px.fillStyle = '#000'; this.px.beginPath(); shape(this.px); this.px.fill();
    const solid = o.tone === undefined;
    if (o.knock !== false) this.knock(shape, solid ? ALL.filter((j) => !inks.includes(j)) : ALL);
    for (const i of inks) {
      const c = this.mx; this.T(c, i); c.fillStyle = CH[i];
      if (solid) { c.beginPath(); shape(c); c.fill(); continue; }
      c.save(); c.beginPath(); shape(c); c.clip();
      const p = o.pitch || 1.3, ca = Math.cos(ANG[i]), sa = Math.sin(ANG[i]), b = this.box, R = Math.hypot(b[2] - b[0], b[3] - b[1]) / p + 2;
      const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, u0 = Math.round((cx * ca + cy * sa) / p), v0 = Math.round((-cx * sa + cy * ca) / p);
      c.beginPath();
      for (let u = u0 - R; u <= u0 + R; u++) for (let v = v0 - R; v <= v0 + R; v++) {
        const x = (u * ca - v * sa) * p, y = (u * sa + v * ca) * p;
        if (x < b[0] - p || x > b[2] + p || y < b[1] - p || y > b[3] + p) continue;
        const tn = typeof o.tone === 'function' ? o.tone(x, y) : o.tone;
        if (tn <= 0.02) continue;
        const r = p * 0.7071 * Math.sqrt(Math.min(1, tn));
        c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
      }
      c.fill(); c.restore();
    }
  };
  /** paper showing through: knocked out of every plate but still part of the print */
  Press.prototype.hole = function (shape) { this.T(this.px, -1); this.px.fillStyle = '#000'; this.px.beginPath(); shape(this.px); this.px.fill(); this.knock(shape, ALL); };
  Press.prototype.bake = function () {
    const w = this.w, h = this.h, md = this.mx.getImageData(0, 0, w, h).data, pd = this.px.getImageData(0, 0, w, h).data;
    const out = this.px.createImageData(w, h), d = out.data, gs = 4 / this.k;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4, m = [md[o] / 255, md[o + 1] / 255, md[o + 2] / 255];
      const A = Math.max(pd[o + 3] / 255, m[0], m[1], m[2]);
      if (A < 0.004) continue;
      const gx = Math.floor(x * gs), gy = Math.floor(y * gs);
      const f = [1, 1, 1];
      for (let i = 0; i < 3; i++) {
        if (!m[i]) continue;
        const a = m[i] * DENS[i] * GR[(((gy + i * 41) & 127) << 7) | ((gx + i * 73) & 127)];
        for (let c = 0; c < 3; c++) f[c] *= 1 - a * (1 - INK[i][c] / 255);
      }
      d[o] = PAPER[0] * f[0]; d[o + 1] = PAPER[1] * f[1]; d[o + 2] = PAPER[2] * f[2]; d[o + 3] = A * 255;
    }
    const c = canvas(w, h); c.getContext('2d').putImageData(out, 0, 0);
    return { c, ox: -this.l * this.k, oy: -this.t * this.k, k: this.k };
  };

  /* ---------------- shapes ---------------- */
  const E = (x, y, rx, ry) => (c) => { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const CAP = (x1, y1, x2, y2, r) => (c) => { const a = Math.atan2(y2 - y1, x2 - x1); c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r); c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5); c.arc(x2, y2, r, a - PI / 2, a + PI / 2); c.closePath(); };
  const POLY = (p) => (c) => { c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); };
  const LIN = (x0, y0, x1, y1, t0, t1) => (x, y) => { const dx = x1 - x0, dy = y1 - y0; return t0 + (t1 - t0) * clamp(((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy), 0, 1); };

  /* ---------------- assets (world units, feet at 0,0) ---------------- */
  /* main character pose: bf/ff = back/front foot [x, y<0 lifted], ba/fa = arm angles (+ forward), b = body bob (+ down),
     hd = head lag, pom = pompom lag, lean. 8 walk poses are COMPUTED from one phase (contact, down, passing, up per leg);
     the knee is solved from the hip-ankle distance; head and pompom follow through with growing phase delays. */
  const WALK = [];
  for (let i = 0; i < 8; i++) {
    const ph = (i / 8) * TAU, foot = (p) => [0.3 + 4.1 * Math.cos(p), Math.sin(p) < 0 ? Math.sin(p) * 2.4 : 0];
    WALK.push({ ff: foot(ph), bf: foot(ph + PI), fa: -0.95 * Math.cos(ph), ba: 0.95 * Math.cos(ph), b: 0.9 * Math.sin(2 * ph), hd: 0.45 * Math.sin(2 * ph - 0.9), pom: Math.sin(2 * ph - 1.8), lean: 0.06 });
  }
  function heroParts(P, F) {
    const hipY = -8.2 + F.b, cl = Math.cos(F.lean), sl = Math.sin(F.lean);
    // upper body: bob + lean around the hip point (every shape point goes through up())
    const up = (x, y, extra) => [x * cl - (y + 8.2) * sl, -8.2 + F.b + (extra || 0) + x * sl + (y + 8.2) * cl];
    const U2 = (fn) => (c) => { const m = c.getTransform(); c.translate(0, -8.2 + F.b); c.rotate(F.lean); c.translate(0, 8.2); fn(c); c.setTransform(m); };
    const leg = (hx, fx, fy, ink) => {
      const ax = fx, ay = fy - 1.6, dx = ax - hx, dy = ay - hipY, d = Math.hypot(dx, dy) || 1, L = 7.9;
      const bend = d < L ? Math.sqrt((L / 2) ** 2 - (d / 2) ** 2) : 0, kx = (hx + ax) / 2 + (dy / d) * bend, ky = (hipY + ay) / 2 - (dx / d) * bend;
      if (bend > 0.3) { P.fill(ink, CAP(hx, hipY, kx, ky, 1.45)); P.fill(ink, CAP(kx, ky, ax, ay, 1.4)); } else P.fill(ink, CAP(hx, hipY, ax, ay, 1.45));
      P.fill([PK, YE], E(fx + 0.9, fy - 1.15, 2.55, 1.35));
    };
    const arm = (sx, sy, a, ink) => { const p0 = up(sx, sy), p1 = up(sx + Math.sin(a) * 5.4, sy + Math.cos(a) * 5.4); P.fill(ink, CAP(p0[0], p0[1], p1[0], p1[1], 1.4)); P.fill(YE, E(p1[0], p1[1] + 0.3, 1.6, 1.6)); };
    leg(-1.5, F.bf[0], F.bf[1], [PK, BL, YE]);
    arm(-2.4, -15, F.ba, [BL, PK]);
    const body = U2((c) => { c.moveTo(-4.6, -17.2); c.quadraticCurveTo(-6.3, -12.2, -5.7, -7.3); c.quadraticCurveTo(0, -6.3, 5.9, -7.3); c.quadraticCurveTo(6.4, -12.2, 4.6, -17.2); c.quadraticCurveTo(0, -18.6, -4.6, -17.2); c.closePath(); });
    P.fill(BL, body);
    P.fill(PK, body, { tone: LIN(-6, -7, 3, -15, 0.62, 0), knock: false });
    leg(1.6, F.ff[0], F.ff[1], [PK, BL]);
    const [hx, hy] = up(0.8, -22.6, F.hd);
    P.fill(PK, E(hx, hy, 6.5, 6.5), { tone: 0.34, pitch: 0.78 });
    P.fill(YE, E(hx, hy, 6.5, 6.5), { tone: 0.3, pitch: 0.78, knock: false });
    P.fill([PK, BL], E(hx - 3.7, hy + 1.2, 3.1, 3.9));
    P.fill(YE, (c) => { c.moveTo(hx - 7, hy - 1.2); c.bezierCurveTo(hx - 7.4, hy - 9.6, hx + 7.6, hy - 9.6, hx + 7.1, hy - 1.2); c.closePath(); });
    P.fill([PK, YE], (c) => c.rect(hx - 7.4, hy - 2.8, 14.8, 2.9));
    P.fill(PK, E(hx - 1.6 - F.pom * 0.9, hy - 8.4 + Math.abs(F.pom) * 0.35, 2.3, 2.3)); // pompom swings after the head
    P.fill([BL, PK], E(hx + 2.3, hy + 1.8, 0.85, 1.25)); P.fill([BL, PK], E(hx + 5, hy + 1.8, 0.8, 1.2));
    P.fill(PK, E(hx + 5.6, hy + 4, 1.05, 1.05));
    arm(2.6, -14.8, F.fa, BL);
  }
  function critterParts(P, v) {
    const body = (c) => { c.moveTo(0, -17.2); c.bezierCurveTo(5.6, -17.2, 8.8, -9.5, 8.8, -4.8); c.bezierCurveTo(8.6, -1.6, 5, -1.1, 0, -1.1); c.bezierCurveTo(-5, -1.1, -8.6, -1.6, -8.8, -4.8); c.bezierCurveTo(-8.8, -9.5, -5.6, -17.2, 0, -17.2); c.closePath(); };
    P.fill([PK, BL], E(-3.4, -1, 2.6, 1.6)); P.fill([PK, BL], E(3.4, -1, 2.6, 1.6));
    if (v === 0) { P.fill(YE, E(3.6, -22, 2, 2)); P.fill(PK, body); P.fill(BL, body, { tone: LIN(-2, -13, 6, -2, 0, 0.66), knock: false }); }
    else { P.fill(PK, POLY([[-5.6, -14], [-6.4, -18.8], [-3, -15.8]])); P.fill(PK, POLY([[3.4, -16], [5.6, -19.8], [6.4, -14.6]])); P.fill(BL, body); P.fill(YE, body, { tone: LIN(-5, -16, 3, -6, 0.6, 0), knock: false }); }
    P.hole(E(-0.6, -10.6, 2.2, 2.6)); P.hole(E(4.3, -10.6, 2, 2.5));
    P.fill([PK, BL], E(0.1, -10, 1, 1.4)); P.fill([PK, BL], E(4.9, -10, 0.95, 1.35));
    P.hole((c) => { c.moveTo(0.2, -6.4); c.quadraticCurveTo(2, -6, 3.8, -6.4); c.quadraticCurveTo(2, -3.4, 0.2, -6.4); c.closePath(); });
  }
  function monsterParts(P) {
    P.fill([PK, BL], (c) => { c.rect(-11.4, -10, 6.8, 10); c.rect(4.6, -10, 6.8, 10); });
    const tri = POLY([[-21, -7], [21, -7], [1.5, -54]]);
    P.fill(BL, tri);
    P.fill(YE, tri, { tone: LIN(-14, -40, 2, -24, 0.55, 0), knock: false, pitch: 1.6 });
    P.fill(PK, E(6.5, -19.5, 12.6, 12.6), { knock: false });          // overprinted disc -> violet lens
    P.fill(YE, E(-0.6, -34.5, 7, 7)); P.fill([PK, BL], E(0.4, -34.2, 1.9, 4.6));
    P.fill([PK, BL, YE], (c) => c.rect(-9.5, -21.5, 21, 6.6));
    for (let i = 0; i < 5; i++) { const x = -7.2 + i * 4.1; P.hole(POLY([[x, -21.4], [x + 3, -21.4], [x + 1.5, -18.6]])); }
  }
  function treeParts(P) {
    P.fill(BL, (c) => c.rect(-1.7, -18, 3.4, 18.4));
    P.fill(YE, E(-1, -29, 11.6, 11.6));
    P.fill(BL, E(3.6, -25.5, 9.2, 9.2), { knock: false });             // yellow x blue -> green lens
    for (const q of [[-6, -31], [-1.5, -36], [5.5, -31.5], [0.5, -26]]) P.fill(PK, E(q[0], q[1], 1.4, 1.4));
  }
  function sunParts(P) {
    const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, r = i & 1 ? 6 : 8.8; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    P.fill(PK, POLY(pts)); P.fill(YE, E(0, 0, 5.3, 5.3));
    P.fill(BL, (c) => { c.moveTo(-1.15, -0.9); c.arc(-1.8, -0.9, 0.65, 0, TAU); c.moveTo(2.45, -0.9); c.arc(1.8, -0.9, 0.65, 0, TAU); });
  }

  const cache = new Map();
  function sprite(key, k, box, fn) {
    const id = key + '@' + k;
    let s = cache.get(id);
    if (!s) { const P = new Press(box, k); fn(P); s = P.bake(); cache.set(id, s); }
    return s;
  }
  const kOf = (u) => clamp(Math.round(u * 1.6), 2, 8);
  function blit(ctx, s, x, y, u, flip) {
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(s.c, -s.ox / s.k * u, -s.oy / s.k * u, s.c.width / s.k * u, s.c.height / s.k * u);
    ctx.restore();
  }
  /** blue halftone shadow, printed over the ground with multiply */
  function shadow(ctx, x, y, rx, u) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = PALETTE.blue; ctx.globalAlpha = 0.6;
    ctx.beginPath();
    for (let j = -3; j <= 3; j++) for (let i = -8; i <= 8; i++) {
      const px = (i + (j & 1) * 0.5) * 1.15, py = j * 1.0, d = Math.hypot(px / rx, py / (rx * 0.38));
      if (d >= 1) continue;
      const r = (1 - d * d) * 0.55 * u;
      ctx.moveTo(x + px * u + r, y + py * u); ctx.arc(x + px * u, y + py * u, r, 0, TAU);
    }
    ctx.fill(); ctx.restore();
  }

  function drawHero(ctx, x, y, t, facing) {
    const u = ctx.__risoU || 2, i = Math.floor(t * 12) & 7; // 8 held walk poses at 12 fps – bob and lean live inside the poses
    shadow(ctx, x, y + 0.4 * u, 9, u);
    blit(ctx, sprite('hero' + i, kOf(u), [-12, -36, 12, 1.5], (P) => heroParts(P, WALK[i])), x, y, u, facing < 0);
  }
  function drawEnemy(ctx, x, y, t, variant) {
    const u = ctx.__risoU || 2;
    shadow(ctx, x, y + 0.4 * u, 9, u);
    blit(ctx, sprite('crit' + (variant || 0), kOf(u), [-11, -25, 11, 1.5], (P) => critterParts(P, variant || 0)), x, y - Math.abs(Math.sin(t * 5)) * 1.6 * u, u, false);
  }

  /* ---------------- ground: per-pixel plates, baked once per canvas size ---------------- */
  let G = null;
  function ground(w, h) {
    if (G && G.w === w && G.h === h) return G.c;
    const u = h / 360, c = canvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    const pitch = 2.6, rnd = rng(99);
    const R = new Float32Array(256 * 256); for (let i = 0; i < R.length; i++) R[i] = rnd();
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const f = [1, 1, 1];
      for (let i = 0; i < 3; i++) {
        const X = px / u - MR[i][0] * 1.35, Y = py / u - MR[i][1] * 1.35;      // world position on this plate
        const meadow = fbm(X / 260 + 3, Y / 260, 51) > 0.56, pond = fbm(X / 200 + 9, Y / 200 - 4, 41) > 0.7;
        const path = Math.abs(X - w / u * 0.3 - Math.sin(Y / 70) * 28) < 16;
        let cov = 0, am = 0, fm = 0;
        if (pond) { if (i === BL) cov = (Y + Math.sin(X / 23) * 4) % 7.5 < 0.95 && X % 23 < 12 ? 0 : 1; }
        else if (path) { if (i === YE) am = 0.46; }
        else if (meadow) { am = i === YE ? 0.27 : i === BL ? 0.11 : 0; }
        else {
          // tint clouds on bare paper: AM dots that grow toward the cloud core – a printed halftone fade, never FM speckle
          const cl = i === PK ? fbm(X / 160, Y / 160, 81) : i === YE ? fbm(X / 180 + 5, Y / 180, 91) : 0, t = clamp((cl - 0.5) * 4, 0, 1);
          am = t * t * (i === PK ? 0.3 : 0.26);
        }
        if (am) {
          const uu = (X * Math.cos(ANG[i]) + Y * Math.sin(ANG[i])) / pitch, vv = (Y * Math.cos(ANG[i]) - X * Math.sin(ANG[i])) / pitch;
          const fu = uu - Math.floor(uu) - 0.5, fv = vv - Math.floor(vv) - 0.5;
          cov = clamp((pitch * 0.7071 * Math.sqrt(am) - Math.hypot(fu, fv) * pitch) * u + 0.5, 0, 1);
        }
        if (fm && R[((Math.floor(Y / 0.55) & 255) << 8) | ((Math.floor(X / 0.55) + i * 97) & 255)] < fm) cov = 1;
        if (!cov) continue;
        const a = cov * DENS[i] * GR[(((py + i * 41) & 127) << 7) | ((px + i * 73) & 127)];
        for (let k = 0; k < 3; k++) f[k] *= 1 - a * (1 - INK[i][k] / 255);
      }
      const o = (py * w + px) * 4, pg = 1 - hash2(px, py, 3) * 0.02;
      d[o] = PAPER[0] * f[0] * pg; d[o + 1] = PAPER[1] * f[1] * pg; d[o + 2] = PAPER[2] * f[2] * pg; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    G = { w, h, c };
    return c;
  }

  /** zine page: paper margin, crop marks and registration targets printed in all three inks, out of register */
  function frame(ctx, w, h) {
    const m = Math.max(8, Math.round(h * 0.024));
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.rect(m, m, w - 2 * m, h - 2 * m); ctx.fill('evenodd');
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.lineWidth = Math.max(1, h / 700);
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(MR[i][0] * 1.4, MR[i][1] * 1.4); ctx.strokeStyle = 'rgb(' + INK[i] + ')'; ctx.globalAlpha = DENS[i];
      ctx.beginPath();
      for (const [x, y, sx, sy] of [[m, m, -1, -1], [w - m, m, 1, -1], [m, h - m, -1, 1], [w - m, h - m, 1, 1]]) {
        ctx.moveTo(x + sx * m * 0.25, y); ctx.lineTo(x + sx * m * 0.85, y); ctx.moveTo(x, y + sy * m * 0.25); ctx.lineTo(x, y + sy * m * 0.85);
      }
      for (const [x, y] of [[m / 2, h / 2], [w - m / 2, h / 2], [w / 2, m / 2]]) {
        const r = m * 0.3; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); ctx.moveTo(x - r * 1.6, y); ctx.lineTo(x + r * 1.6, y); ctx.moveTo(x, y - r * 1.6); ctx.lineTo(x, y + r * 1.6);
      }
      ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    [PALETTE.pinkPrint, PALETTE.bluePrint, PALETTE.yellowPrint, PALETTE.violet, PALETTE.redOrange, PALETTE.green, PALETTE.nearBlack].forEach((c, i) => {
      ctx.fillStyle = c; ctx.fillRect(m * 1.6 + i * m * 0.58, m * 0.25, m * 0.5, m * 0.5);
    });
  }

  function draw(ctx, w, h, t) {
    const u = h / 360;
    ctx.__risoU = u;
    ctx.drawImage(ground(w, h), 0, 0);
    const k = kOf(u), cx = w / 2, cy = h / 2;
    // scenery overprints the ground (multiply)
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    for (const [x, y] of [[-0.32, -0.18], [0.3, -0.12], [0.36, 0.3]]) { shadow(ctx, cx + x * h + 3 * u, cy + y * h, 13, u); blit(ctx, sprite('tree', k, [-14, -44, 14, 1], treeParts), cx + x * h, cy + y * h, u); }
    ctx.restore();
    const actors = [];
    actors.push({ y: cy + 34 * u, f: () => drawHero(ctx, cx + Math.sin(t * 0.8) * 30 * u, cy + 34 * u, t, Math.cos(t * 0.8) > 0 ? 1 : -1) });
    for (let i = 0; i < 4; i++) {
      const a = t * 0.4 + i * 1.7, ex = cx + Math.cos(a) * (120 + i * 20) * u, ey = cy + 30 * u + Math.sin(a) * 70 * u;
      actors.push({ y: ey, f: () => drawEnemy(ctx, ex, ey, t + i, i & 1) });
    }
    const mx = cx - 0.55 * h, my = cy + 0.33 * h;
    actors.push({ y: my, f: () => { shadow(ctx, mx, my + 0.4 * u, 21, u); blit(ctx, sprite('monster', k, [-24, -60, 24, 1.5], monsterParts), mx, my - Math.abs(Math.sin(t * 2)) * 2 * u, u); } });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.f());
    // orbiting sun stamps around the main character (multiply), with rotating rays
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    const hx = cx + Math.sin(t * 0.8) * 30 * u, hy = cy + 34 * u;
    for (let i = 0; i < 2; i++) {
      const a = t * 2.4 + i * PI, s = sprite('sun', k, [-9, -9, 9, 9], sunParts);
      ctx.save(); ctx.translate(hx + Math.cos(a) * 44 * u, hy - 11 * u + Math.sin(a) * 37 * u); ctx.rotate(t * 1.6);
      ctx.drawImage(s.c, -s.ox / s.k * u, -s.oy / s.k * u, s.c.width / s.k * u, s.c.height / s.k * u); ctx.restore();
    }
    ctx.restore();
    frame(ctx, w, h);
  }

  const Starter = { id: 'riso', name: 'Risograph Print', palette: PALETTE, fonts: ['Rubik Mono One', 'Space Grotesk:wght@400;500;700', 'DM Mono:wght@400;500'], drawHero, drawEnemy, draw, Press };
  root.StyleStarters = root.StyleStarters || {};
  root.StyleStarters['riso'] = Starter;
  if (typeof module !== 'undefined' && module.exports) module.exports = Starter;
})(typeof window !== 'undefined' ? window : globalThis);
