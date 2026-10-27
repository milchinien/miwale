/* Native art for the new enemies / upgrades in the 'cartoon' world (Brotato-Cartoon) – see js/content/ART_API.md.
   Same language as js/styles/cartoon.js: one thick deep-plum outer outline, flat fill + exactly one cel-shade
   crescent + one glossy highlight. Sprites are pre-rendered (frames, both facings, flash copies) and squashed /
   stretched at draw time. */
(function () {
  'use strict';
  const U = window.U, Cn = window.Content;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ------------------------------------------------------------------ palette (copied from the style) */
  const OUT = '#3a2240';
  const OL = 1.15, IL = 0.55;
  const FLASH_SH = '#efe6f6';
  const C = {
    pump: '#ff952b', pumpSh: '#ea681c', pumpRib: '#ec7a22', carve: '#8a3214', glow: '#ffd43f', glowHi: '#fff3b0',
    stem: '#7f9b3b', stemSh: '#5d7a2a', leaf: '#86cf4c', leafSh: '#59a33a',
    root: '#efd49e', rootSh: '#cfac70', cream: '#fff1c8', creamSh: '#e6c68a',
    wood: '#d4a066', woodSh: '#a9743f',
  };
  // new accents
  const SP = { top: '#7b55c9', topSh: '#5a3b9e', bot: '#eaf6c6', botSh: '#c9dc96', spot: '#8fd84a', spotSh: '#64a636',
    tox: '#d2ff2a', toxSh: '#86d02a', toxHi: '#f6ffc0', leaf: '#a8dc3c', leafSh: '#78ab2a' };
  const BO = { body: '#e0365a', bodySh: '#a91d45', ring: '#bf2550', leg: '#8e2d4c', legSh: '#6a1c38', fuse: '#f3dfae', fuseSh: '#cfb27a' };
  const CH = { body: '#ecd29a', bodySh: '#c9a463', leg: '#dfb878', legSh: '#b98d50', horn: '#9a7460', hornSh: '#6c4b3c', ridge: '#c19a7c' };
  const MO = { top: '#a97ccc', topSh: '#7f56a3', bot: '#f6e7cb', botSh: '#dcc296', shawl: '#ea5470', shawlSh: '#bd3654', knit: '#c73c5a', rim: '#f2b844' };
  const BA = { top: '#ef62a8', topSh: '#bd3f84', bot: '#fdeedd', botSh: '#e7c9a6' };

  let K = 3;
  let SPR = null;

  /* ================================================================ painter (as in the style) */
  function Painter(ctx, mode, ol, fc) { this.ctx = ctx; this.mode = mode; this.ol = ol; this.fc = fc || ['#ffffff', FLASH_SH]; }
  Painter.prototype.part = function (shape, fill, o) {
    o = o || {};
    const ctx = this.ctx;
    if (this.mode === 'outline') {
      if (o.noOutline) return;
      ctx.beginPath(); shape(ctx);
      ctx.lineWidth = (o.ol != null ? o.ol : this.ol) * 2;
      ctx.strokeStyle = OUT; ctx.fillStyle = OUT;
      ctx.stroke(); ctx.fill();
      return;
    }
    const flash = this.mode === 'flash';
    ctx.save();
    ctx.beginPath(); shape(ctx);
    if (o.inner) { ctx.lineWidth = o.inner * 2; ctx.strokeStyle = OUT; ctx.stroke(); }
    ctx.clip();
    if (o.sh) {
      this.paint(fill, o, true, flash);
      ctx.save();
      ctx.save(); ctx.translate(o.sh[0], o.sh[1]); ctx.beginPath(); shape(ctx); ctx.restore();
      ctx.clip();
      this.paint(fill, o, false, flash);
      ctx.restore();
    } else this.paint(fill, o, false, flash);
    if (!flash) {
      if (o.detail) { ctx.save(); o.detail(ctx); ctx.restore(); }
      if (o.hi) gloss(ctx, o.hi, o.hiA);
      if (o.hi2) { ctx.globalAlpha = o.hiA || 0.92; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.hi2[0], o.hi2[1], o.hi2[2], 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  };
  Painter.prototype.paint = function (fill, o, shade, flash) {
    const ctx = this.ctx;
    if (flash) { ctx.fillStyle = shade ? this.fc[1] : this.fc[0]; ctx.fillRect(-500, -500, 1000, 1000); return; }
    if (typeof fill === 'function') { fill(ctx, shade); return; }
    ctx.fillStyle = shade ? o.shade || fill : fill;
    ctx.fillRect(-500, -500, 1000, 1000);
  };
  Painter.prototype.detail = function (fn, inFlash) {
    if (this.mode === 'outline') return;
    if (this.mode === 'flash' && !inFlash) return;
    const c = this.ctx;
    c.save(); fn(c, this.mode === 'flash'); c.restore();
  };
  function gloss(ctx, h, a) {
    ctx.globalAlpha = a || 0.92;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(h[0], h[1], h[2], h[3], h[4] || 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* ----------------------------------------------------------- shape helpers (as in the style) */
  const E = (x, y, rx, ry, rot) => (c) => {
    rot = rot || 0;
    c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
    c.ellipse(x, y, rx, ry, rot, 0, TAU);
  };
  const CAP = (x1, y1, x2, y2, r) => (c) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r);
    c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5);
    c.arc(x2, y2, r, a - PI / 2, a + PI / 2);
    c.closePath();
  };
  function blobPath(c, pts, ten) {
    ten = ten === undefined ? 1 : ten;
    const n = pts.length;
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      c.bezierCurveTo(
        p1[0] + ((p2[0] - p0[0]) / 6) * ten, p1[1] + ((p2[1] - p0[1]) / 6) * ten,
        p2[0] - ((p3[0] - p1[0]) / 6) * ten, p2[1] - ((p3[1] - p1[1]) / 6) * ten, p2[0], p2[1]);
    }
    c.closePath();
  }
  function roundPoly(c, pts, r) {
    const n = pts.length;
    const a = pts[n - 1], b = pts[0];
    c.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      c.arcTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, r);
    }
    c.closePath();
  }
  function rrect(c, x, y, w, h, r) { roundPoly(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r); }
  function starPts(n, ro, ri, cx, cy, rot) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * TAU, r = i & 1 ? ri : ro;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
  }
  function pumpkinPath(c, cx, cy, rx, ry) {
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * TAU;
      const co = Math.cos(th), si = Math.sin(th);
      const x = Math.sign(co) * Math.pow(Math.abs(co), 0.85) * rx;
      let y = Math.sign(si) * Math.pow(Math.abs(si), 0.92) * ry;
      const top = Math.exp(-Math.pow((th - PI * 1.5) / 0.3, 2));
      const bot = Math.exp(-Math.pow((th - PI * 0.5) / 0.26, 2));
      y *= 1 - 0.15 * top - 0.07 * bot;
      if (i) c.lineTo(cx + x, cy + y); else c.moveTo(cx + x, cy + y);
    }
    c.closePath();
  }
  function ribs(c, cx, cy, rx, ry, col, lw) {
    c.strokeStyle = col; c.lineWidth = lw;
    for (const k of [-0.7, -0.3, 0.3, 0.7]) {
      c.beginPath();
      c.moveTo(cx + k * rx * 0.2, cy - ry * 0.9);
      c.quadraticCurveTo(cx + k * rx * 1.2, cy, cx + k * rx * 0.2, cy + ry * 0.94);
      c.stroke();
    }
  }
  function turnipPath(c, cx, top, bottom, w) {
    const h = bottom - top;
    c.moveTo(cx, top);
    c.bezierCurveTo(cx + w * 0.42, top + h * 0.02, cx + w, top + h * 0.22, cx + w, top + h * 0.56);
    c.bezierCurveTo(cx + w, top + h * 0.86, cx + w * 0.55, bottom, cx, bottom);
    c.bezierCurveTo(cx - w * 0.55, bottom, cx - w, top + h * 0.86, cx - w, top + h * 0.56);
    c.bezierCurveTo(cx - w, top + h * 0.22, cx - w * 0.42, top + h * 0.02, cx, top);
    c.closePath();
  }
  function leafPath(c, bx, by, a, len, wid) {
    const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
    const tx = bx + dx * len, ty = by + dy * len;
    c.moveTo(bx, by);
    c.bezierCurveTo(bx + dx * len * 0.22 + nx * wid, by + dy * len * 0.22 + ny * wid, tx - dx * len * 0.3 + nx * wid * 0.75, ty - dy * len * 0.3 + ny * wid * 0.75, tx, ty);
    c.bezierCurveTo(tx - dx * len * 0.3 - nx * wid * 0.75, ty - dy * len * 0.3 - ny * wid * 0.75, bx + dx * len * 0.22 - nx * wid, by + dy * len * 0.22 - ny * wid, bx, by);
    c.closePath();
  }
  const midrib = (bx, by, a, len, col, lw) => (c) => {
    c.strokeStyle = col; c.lineWidth = lw || 0.45;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.sin(a) * len * 0.78, by - Math.cos(a) * len * 0.78); c.stroke();
  };
  const twoTone = (col, waveY, amp, freq) => (c, sh) => {
    c.fillStyle = sh ? col.botSh : col.bot; c.fillRect(-500, -500, 1000, 1000);
    c.fillStyle = sh ? col.topSh : col.top;
    c.beginPath(); c.moveTo(-80, -140); c.lineTo(80, -140); c.lineTo(80, waveY);
    for (let x = 80; x >= -80; x -= 0.5) c.lineTo(x, waveY + amp * Math.sin(x * freq + 0.6));
    c.closePath(); c.fill();
  };
  function carve(c, pathFn, dx, dy, lit) {
    c.save();
    c.beginPath(); pathFn(c); c.fillStyle = lit === false ? '#4a2232' : C.carve; c.fill();
    c.clip();
    c.translate(dx === undefined ? 0.2 : dx, dy === undefined ? 0.7 : dy);
    c.beginPath(); pathFn(c); c.fillStyle = lit === false ? '#6b3428' : C.glow; c.fill();
    c.restore();
  }
  /** Tapered ribbon along a centre line (horns, vines, fuses), round ends. */
  function ribbonPath(c, pts, w0, w1) {
    const n = pts.length, L = [], R = [], A = [];
    for (let i = 0; i < n; i++) {
      const p = pts[Math.max(0, i - 1)], q = pts[Math.min(n - 1, i + 1)];
      const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
      const nx = -Math.sin(a), ny = Math.cos(a);
      L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]); A.push(a);
    }
    c.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]);
    c.arc(pts[n - 1][0], pts[n - 1][1], w1 / 2, A[n - 1] + PI / 2, A[n - 1] - PI / 2, true);
    for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
    c.arc(pts[0][0], pts[0][1], w0 / 2, A[0] - PI / 2, A[0] + PI / 2, true);
    c.closePath();
  }
  function spiralPts(cx, cy, a0, turns, r0, r1, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const s = i / n, a = a0 - s * turns, r = r0 + (r1 - r0) * s; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }
  const heartPath = (c, x, y, s) => {
    c.moveTo(x, y + 8 * s); c.bezierCurveTo(x - 6 * s, y + 4 * s, x - 8.5 * s, y + 0.5 * s, x - 8.5 * s, y - 2.6 * s);
    c.bezierCurveTo(x - 8.5 * s, y - 6.2 * s, x - 5.6 * s, y - 8 * s, x - 3.4 * s, y - 8 * s);
    c.bezierCurveTo(x - 1.8 * s, y - 8 * s, x - 0.5 * s, y - 7 * s, x, y - 5.4 * s);
    c.bezierCurveTo(x + 0.5 * s, y - 7 * s, x + 1.8 * s, y - 8 * s, x + 3.4 * s, y - 8 * s);
    c.bezierCurveTo(x + 5.6 * s, y - 8 * s, x + 8.5 * s, y - 6.2 * s, x + 8.5 * s, y - 2.6 * s);
    c.bezierCurveTo(x + 8.5 * s, y + 0.5 * s, x + 6 * s, y + 4 * s, x, y + 8 * s); c.closePath();
  };

  /* --------------------------------------------------------- sprite builder */
  function build(box, fn, mode, ol, fc) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'outline', ol || OL));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, mode || 'fill', ol || OL, fc));
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy }; }
  /** normal + flash (+ optional tinted flash), both facings */
  function set4(box, fn, ol, tint) {
    const n = build(box, fn, 'fill', ol), f = build(box, fn, 'flash', ol);
    const o = { n, f, nl: flipS(n), fl: flipS(f) };
    if (tint) { o.t = build(box, fn, 'flash', ol, tint); o.tl = flipS(o.t); }
    return o;
  }
  function plain(box, fn) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(ctx);
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function glowSpr(r, rgb, a0) {
    return plain([-r, -r, r, r], (c) => {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, 'rgba(' + rgb + ',' + a0 + ')'); g.addColorStop(0.4, 'rgba(' + rgb + ',' + a0 * 0.4 + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
    });
  }

  /* ========================================================== draw helpers */
  let TV = null;
  const TF = { S: 1, ox: 0, oy: 0 };
  function tf(view) {
    if (TV !== view) { TV = view; TF.S = view.S; TF.ox = view.W / 2 - view.x * view.S; TF.oy = view.H / 2 - view.y * view.S; }
    return TF;
  }
  function blit(ctx, s, x, y, sx, sy) {
    const k = 1 / K;
    ctx.drawImage(s.c, x - s.ox * k * sx, y - s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
  }
  function blitRot(ctx, V, s, x, y, sx, sy, rot) {
    const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
    ctx.setTransform(co, si, -si, co, V.ox + x * S, V.oy + y * S);
    const k = 1 / K;
    ctx.drawImage(s.c, -s.ox * k * sx, -s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }
  function put(ctx, V, s, x, y, sx, sy, rot) { if (rot) blitRot(ctx, V, s, x, y, sx, sy, rot); else blit(ctx, s, x, y, sx, sy); }
  function glowAt(ctx, s, x, y, sc, a) {
    if (a <= 0.01) return;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a);
    blit(ctx, s, x, y, sc, sc);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  // The style batches all flat shadows into one path that it fills at its first drawEnemy/drawPlayer of the frame.
  // A dead dummy creeper flushes that batch (and draws nothing) so our enemies never end up under the shadows.
  const DUMMY = { kind: 'enemy', type: 'creeper', x: 0, y: 0, r: 9, facing: 1, anim: 0, seed: 0, spawnT: 1, dying: true, deathT: 0.99, flash: 0, vx: 0, vy: 0 };
  function flush(ctx, view, st) { if (st && st.drawEnemy) { st.drawEnemy(ctx, DUMMY, view); ctx.globalAlpha = 1; } }

  // per-draw pose state (where the sprite really ended up) so overlays can follow it
  const POSE = { x: 0, y: 0, sx: 1, sy: 1, rot: 0, f: 1 };
  function lp(px, py, out) {
    const dx = POSE.f * px * POSE.sx, dy = py * POSE.sy, co = Math.cos(POSE.rot), si = Math.sin(POSE.rot);
    out[0] = POSE.x + dx * co - dy * si; out[1] = POSE.y + dx * si + dy * co;
    return out;
  }
  const PT = [0, 0];

  /** The style's creeper handling: elastic pop out of the ground, white inflate-and-pop death, capped hit flash.
      Returns true when the living sprite was drawn (overlays may follow). */
  function drawBody(ctx, V, e, set, x, y, sx, sy, rot, extra) {
    const left = e.facing < 0;
    if (e.spawnT < 1) {
      const q = U.clamp((e.spawnT - 0.1) / 0.9, 0, 1);
      if (q <= 0) return false;
      const p = U.ease.outElastic(q);
      sy *= p; sx *= p > 0.05 ? U.clamp(1 / Math.sqrt(p), 0.75, 1.5) : 1.5;
      rot *= q;
    }
    POSE.x = x; POSE.y = y; POSE.sx = sx; POSE.sy = sy; POSE.rot = rot; POSE.f = left ? -1 : 1;
    if (e.dying) {
      const q = e.deathT;
      if (q >= 0.5) return false;
      const k = q < 0.22 ? 1 + U.ease.outQuad(q / 0.22) * 0.28 : 1.28 * (1 - U.ease.inQuad((q - 0.22) / 0.28));
      sx *= k * (1 + 0.1 * Math.sin(q * 40)); sy *= k * (1 - 0.1 * Math.sin(q * 40));
      put(ctx, V, left ? set.fl : set.f, x, y, sx, sy, rot);
      return false;
    }
    const fl = e.flash || 0;
    if (fl > 0) { sx *= 1 + 0.22 * fl; sy *= 1 - 0.18 * fl; POSE.sx = sx; POSE.sy = sy; }
    put(ctx, V, left ? set.nl : set.n, x, y, sx, sy, rot);
    if (extra) extra(sx, sy);
    if (fl > 0.02) {
      ctx.globalAlpha = Math.min(0.6, fl * 1.1);
      put(ctx, V, left ? set.fl : set.f, x, y, sx, sy, rot);
      ctx.globalAlpha = 1;
    }
    return true;
  }

  /* ============================================================ enemies */
  const leaf = (P, bx, by, a, len, wid, col, sh, s) => P.part((c) => leafPath(c, bx, by, a, len, wid), col, {
    shade: sh, sh: [-0.6 * (s || 1), -0.6 * (s || 1)], detail: midrib(bx, by, a, len, sh),
  });

  // ---- Rüben-Spucker: mottled purple/green turnip with a puckered spitting snout
  function spitterParts(P, fr, aim) {
    const st = [0, 1, 0, -1][fr], sw = [0, 0.08, 0, -0.08][fr];
    const lift = (s) => Math.max(0, s) * 1.4;
    const w = aim ? 10.4 : 9.4;
    leaf(P, -0.4, -18.6, -0.75 + sw, 7.0, 2.2, SP.leaf, SP.leafSh);
    leaf(P, -0.4, -18.6, 0.55 + sw, 6.4, 2.0, SP.leaf, SP.leafSh);
    leaf(P, -0.4, -18.6, -0.08 + sw, 8.8, 2.5, SP.leaf, SP.leafSh);
    P.part(CAP(-2.8, -4.6, -3.1 + st * 0.9, -1.1 - lift(st), 1.35), C.root, { shade: C.rootSh, sh: [-0.4, -0.4] });
    P.part(CAP(2.6, -4.6, 2.9 - st * 0.9, -1.1 - lift(-st), 1.35), C.root, { shade: C.rootSh, sh: [-0.4, -0.4] });
    P.part((c) => turnipPath(c, -0.4, -19.6, -2.5, w), (c, sh) => {
      twoTone(SP, -10.2, 0.8, 0.9)(c, sh);
      c.fillStyle = sh ? SP.spotSh : SP.spot;
      c.beginPath();
      E(-5.6, -14.2, 1.7, 1.2, 0.3)(c); E(-2.8, -17.4, 1.1, 0.75, -0.2)(c); E(-7.2, -11.2, 1.0, 0.8)(c); E(1.8, -18.4, 0.9, 0.6)(c); E(-3.4, -12.4, 0.7, 0.55)(c);
      c.fill();
      c.fillStyle = sh ? '#b3c886' : '#d4e8a2';
      c.beginPath(); E(-5.4, -6.2, 0.9, 0.7)(c); E(-2.4, -4.4, 0.6, 0.5)(c); E(-7.0, -8.0, 0.55, 0.45)(c); c.fill();
    }, { sh: [-1.7, -1.4], hi: [-5.6, -15.6, 2.0, 1.1, -0.7], hi2: [-3.2, -17.6, 0.5] });
    if (aim) {
      // puffed-up cheeks
      P.part(E(5.6, -9.4, 4.6, 3.9), SP.top, { shade: SP.topSh, sh: [-0.9, -0.9], inner: IL, hi: [4.2, -11.0, 1.4, 0.7, -0.5] });
    }
    // the snout tube
    P.part(CAP(5.0, -9.6, 12.2, -10.2, aim ? 2.9 : 2.6), '#9b73dd', { shade: '#6f4cb4', sh: [-0.5, -0.8], inner: IL, hi: [8.6, -11.6, 1.5, 0.45, -0.05] });
    P.part(E(13.0, -10.3, 1.9, aim ? 3.6 : 3.3), SP.tox, {
      shade: SP.toxSh, sh: [-0.4, -0.4], inner: IL,
      detail(c) {
        c.fillStyle = OUT; c.beginPath(); c.ellipse(13.5, -10.3, 1.05, aim ? 2.5 : 2.2, 0, 0, TAU); c.fill();
        c.fillStyle = aim ? SP.toxHi : '#5fa82a'; c.beginPath(); c.ellipse(13.75, -10.1, 0.55, aim ? 1.7 : 1.3, 0, 0, TAU); c.fill();
      },
    });
    // green drool
    if (!aim) {
      P.part((c) => { CAP(13.0, -7.6, 13.2, -5.0, 0.7)(c); E(13.25, -4.4, 1.05, 1.2)(c); }, SP.tox, { ol: 0.75, shade: SP.toxSh, sh: [-0.3, -0.3], hi2: [12.9, -4.8, 0.32] });
    }
    P.detail((c) => {
      const j = [0, 0.15, 0, -0.1][fr];
      c.lineWidth = IL * 1.3; c.strokeStyle = OUT; c.fillStyle = '#ffffff';
      c.beginPath(); c.ellipse(0.4, -14.6, 2.2, 2.5, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(5.4, -14.4, 2.0, 2.3, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = OUT;
      const pr = aim ? 0.85 : 1.1;
      c.beginPath(); c.arc(1.3 + j, -14.2, pr, 0, TAU); c.arc(6.1 + j, -14.0, pr * 0.95, 0, TAU); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(0.95 + j, -14.6, 0.34, 0, TAU); c.arc(5.75 + j, -14.4, 0.32, 0, TAU); c.fill();
      c.strokeStyle = OUT; c.lineWidth = 1.25; c.lineCap = 'round';
      c.beginPath();
      if (aim) { c.moveTo(-2.0, -17.0); c.lineTo(2.4, -16.4); c.moveTo(4.0, -16.3); c.lineTo(8.0, -17.4); }
      else { c.moveTo(-1.9, -18.0); c.lineTo(2.6, -16.0); c.moveTo(4.0, -16.0); c.lineTo(7.9, -17.6); }
      c.stroke();
    });
  }

  // ---- Zündrübe: round beet bomb with a burning fuse
  const FUSE_TIP = [-4.6, -24.0];
  function bomberParts(P, fr) {
    const a = [0, 1, 0, -1][fr];
    const legs = [[-3.6, 1], [-1.2, -1], [1.4, 1], [3.8, -1]];
    // far legs first (darker)
    for (let i = 0; i < 4; i += 2) {
      const L = legs[i], s = a * L[1];
      P.part(CAP(L[0], -4.0, L[0] * 1.35 + s * 1.3 - 0.3, -0.9 - Math.max(0, s) * 1.2, 0.95), BO.legSh, { shade: '#4e1428', sh: [-0.3, -0.3], ol: 1.0 });
    }
    // root tail
    P.part((c) => ribbonPath(c, [[-4.5, -7.0], [-7.4, -6.0], [-9.6, -4.0]], 2.2, 0.6), BO.body, { shade: BO.bodySh, sh: [-0.3, -0.4], ol: 1.0 });
    // fuse (behind the leaves)
    P.part((c) => ribbonPath(c, [[0.0, -15.5], [-0.8, -18.6], [-2.4, -20.8], [-3.9, -22.2], [FUSE_TIP[0], FUSE_TIP[1]]], 1.7, 1.5), BO.fuse, {
      shade: BO.fuseSh, sh: [-0.3, 0], ol: 0.95,
      detail(c) {
        c.strokeStyle = '#b8935a'; c.lineWidth = 0.45;
        c.beginPath();
        for (const p of [[-0.4, -17.4], [-1.4, -19.8], [-3.0, -21.6], [-4.3, -23.1]]) { c.moveTo(p[0] - 0.8, p[1] - 0.2); c.lineTo(p[0] + 0.8, p[1] + 0.5); }
        c.stroke();
      },
    });
    P.part((c) => leafPath(c, 0.4, -15.2, -0.15 + a * 0.05, 5.4, 2.1), C.leaf, { shade: C.leafSh, sh: [-0.4, -0.5], detail: midrib(0.4, -15.2, -0.15, 5.4, BO.ring, 0.55) });
    P.part((c) => leafPath(c, 0.6, -15.2, 0.75 + a * 0.05, 4.8, 1.9), C.leaf, { shade: C.leafSh, sh: [-0.4, -0.5], detail: midrib(0.6, -15.2, 0.75, 4.8, BO.ring, 0.55) });
    // the beet
    P.part((c) => blobPath(c, [[0.4, -16.2], [5.6, -14.6], [7.6, -9.6], [6.0, -4.4], [0.4, -2.6], [-5.4, -4.4], [-7.3, -9.6], [-5.0, -14.6]], 1), BO.body, {
      shade: BO.bodySh, sh: [-1.5, -1.3],
      detail(c) {
        c.strokeStyle = BO.ring; c.lineWidth = 0.55;
        c.beginPath();
        c.moveTo(-6.0, -12.0); c.quadraticCurveTo(-7.4, -7.5, -4.6, -4.2);
        c.moveTo(-3.8, -13.8); c.quadraticCurveTo(-5.6, -9.0, -3.2, -4.4);
        c.stroke();
      },
      hi: [-3.6, -12.6, 1.9, 1.0, -0.7], hi2: [-1.4, -14.4, 0.5],
    });
    // near legs
    for (let i = 1; i < 4; i += 2) {
      const L = legs[i], s = -a * L[1];
      P.part(CAP(L[0], -3.8, L[0] * 1.35 + s * 1.3 + 0.3, -0.9 - Math.max(0, s) * 1.2, 1.0), BO.leg, { shade: BO.legSh, sh: [-0.3, -0.3], ol: 1.0 });
    }
    P.detail((c) => {
      // mean little eyes under one heavy brow
      c.fillStyle = '#ffffff'; c.strokeStyle = OUT; c.lineWidth = IL * 1.2;
      c.beginPath(); c.ellipse(1.6, -9.8, 1.7, 1.55, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(5.4, -9.7, 1.55, 1.45, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = OUT;
      c.beginPath(); c.arc(2.1, -9.4, 0.85, 0, TAU); c.arc(5.8, -9.3, 0.8, 0, TAU); c.fill();
      c.beginPath(); roundPoly(c, [[-0.8, -12.6], [3.4, -10.6], [3.6, -9.4], [-0.6, -11.0]], 0.3); c.fill();
      c.beginPath(); roundPoly(c, [[3.9, -10.4], [7.6, -12.2], [7.6, -10.9], [4.2, -9.2]], 0.3); c.fill();
      // jagged grin
      c.save();
      c.beginPath(); c.moveTo(0.6, -6.6); c.quadraticCurveTo(3.6, -4.0, 6.6, -6.8); c.quadraticCurveTo(3.6, -5.6, 0.6, -6.6); c.closePath();
      c.fillStyle = OUT; c.fill(); c.clip();
      c.fillStyle = '#fff6e2'; c.beginPath(); c.moveTo(2.0, -6.4); c.lineTo(3.0, -6.0); c.lineTo(2.5, -5.0); c.closePath(); c.moveTo(4.2, -6.0); c.lineTo(5.2, -6.4); c.lineTo(4.8, -5.1); c.closePath(); c.fill();
      c.restore();
    });
  }

  // ---- Wurzel-Bock: stocky parsnip ram with big curled horns
  const CH_EYE = [15.6, -10.4], CH_HEAD = [11.0, -21.0];
  function chargerParts(P, pose, fr) {
    // pose: 'walk' | 'tele' | 'dash' | 'dizzy'
    const a = pose === 'walk' || pose === 'dizzy' ? [0, 1, 0, -1][fr] : 0;
    const lift = (s) => Math.max(0, s) * 1.3;
    // legs: [hip x, foot dx, foot lift, near?]
    let legs;
    if (pose === 'dash') legs = [[-7.5, -4.5, 1.6, 0], [3.5, 5.0, 2.2, 0], [-5.0, -5.0, 0.6, 1], [6.0, 5.5, 1.2, 1]];
    else if (pose === 'tele') {
      const sc = fr ? 1 : 0; // front hoof scraping back and forth
      legs = [[-7.5, -1.6, 0, 0], [3.5, 1.8, 0, 0], [-5.0, -1.4, 0, 1], [6.5, 2.4 - sc * 3.2, sc * 1.6, 1]];
    } else legs = [[-7.5, a * 1.6, lift(a), 0], [3.5, -a * 1.6, lift(-a), 0], [-5.0, -a * 1.6, lift(-a), 1], [6.5, a * 1.6, lift(a), 1]];
    const leg = (L) => {
      const far = !L[3];
      const fx = L[0] + L[1], fy = -0.9 - L[2];
      P.part(CAP(L[0], -6.5, fx, fy, 1.75), far ? CH.legSh : CH.leg, { shade: far ? '#9a743f' : CH.legSh, sh: [-0.4, -0.4] });
      P.part(E(fx + 0.4, fy + 0.1, 2.0, 1.15), '#7a5040', { shade: '#5a3828', sh: [-0.3, -0.4], inner: IL });
    };
    leg(legs[0]); leg(legs[1]);
    // leafy mane (streams back while dashing)
    const lb = pose === 'dash' ? -0.55 : pose === 'tele' ? -0.15 : 0;
    const ls = a * 0.06;
    leaf(P, 3.6, -20.4, -1.0 + lb + ls, 9.4, 2.6, C.leaf, C.leafSh);
    leaf(P, 3.6, -20.4, -0.4 + lb + ls, 11.2, 3.0, C.leaf, C.leafSh);
    leaf(P, 3.6, -20.4, 0.22 + lb * 0.6 + ls, 8.4, 2.5, C.leaf, C.leafSh);
    // parsnip body: wide crown in front, tapering root tail behind
    const tailUp = pose === 'dash' ? -2.0 : 0;
    P.part((c) => blobPath(c, [[-16.5, -16.0 + tailUp], [-10.0, -19.8], [-1.0, -21.8], [6.5, -20.8], [11.0, -15.6], [10.0, -7.8], [4.0, -5.0], [-4.0, -5.6], [-10.0, -9.4]], 1), CH.body, {
      shade: CH.bodySh, sh: [-1.8, -1.6],
      detail(c) {
        c.strokeStyle = CH.bodySh; c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(-10.5, -17.4); c.quadraticCurveTo(-9.6, -13.0, -11.0, -9.6);
        c.moveTo(-5.5, -19.2); c.quadraticCurveTo(-4.2, -13.5, -5.6, -7.0);
        c.moveTo(-14.2, -15.8); c.quadraticCurveTo(-13.8, -14.0, -14.4, -12.6);
        c.stroke();
      },
      hi: [-4.0, -17.2, 3.0, 1.1, -0.15], hi2: [1.4, -18.6, 0.55],
    });
    P.detail((c) => {
      c.strokeStyle = OUT; c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(-16.0, -15.6 + tailUp); c.quadraticCurveTo(-18.2, -15.4 + tailUp, -19.0, -13.2 + tailUp); c.stroke();
    });
    leg(legs[2]); leg(legs[3]);
    // the lowered head
    P.part(E(14.2, -10.2, 5.4, 4.7, 0.25), CH.body, {
      shade: CH.bodySh, sh: [-0.9, -0.9], inner: IL,
      detail(c) {
        c.fillStyle = CH.bodySh; c.beginPath(); c.ellipse(18.6, -8.2, 1.0, 0.8, 0.3, 0, TAU); c.fill();
        c.fillStyle = OUT; c.beginPath(); c.ellipse(18.8, -8.4, 0.45, 0.6, 0.3, 0, TAU); c.fill();
      },
    });
    // root goatee
    P.detail((c) => {
      c.strokeStyle = OUT; c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(15.6, -5.8); c.quadraticCurveTo(15.8, -4.2, 14.8, -3.2); c.moveTo(16.8, -6.0); c.quadraticCurveTo(17.4, -4.6, 16.8, -3.6); c.stroke();
    });
    // eye
    P.detail((c) => {
      const ex = CH_EYE[0], ey = CH_EYE[1];
      c.lineWidth = IL * 1.3; c.strokeStyle = OUT;
      if (pose === 'tele') {
        c.fillStyle = '#ff4433'; c.beginPath(); c.ellipse(ex, ey, 1.9, 1.7, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#ffd0a0'; c.beginPath(); c.ellipse(ex + 0.3, ey + 0.1, 0.8, 0.7, 0, 0, TAU); c.fill();
      } else if (pose === 'dizzy') {
        c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(ex, ey, 1.9, 1.9, 0, 0, TAU); c.fill(); c.stroke();
        c.strokeStyle = OUT; c.lineWidth = 0.5; c.beginPath();
        for (let i = 0; i <= 20; i++) { const t = i / 20, ang = t * TAU * 1.6, r = 0.15 + t * 1.45; const px = ex + Math.cos(ang) * r, py = ey + Math.sin(ang) * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
        c.stroke();
      } else {
        c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(ex, ey, 1.8, 1.9, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = OUT; c.beginPath(); c.arc(ex + 0.6, ey + 0.2, 0.95, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + 0.3, ey - 0.2, 0.3, 0, TAU); c.fill();
      }
      if (pose !== 'dizzy') {
        c.fillStyle = OUT; c.beginPath(); roundPoly(c, [[ex - 2.6, ey - 3.6], [ex + 2.6, ey - 1.4], [ex + 2.4, ey - 0.4], [ex - 2.4, ey - 2.2]], 0.4); c.fill();
      }
    });
    // big curled ram horn (covers the side of the head)
    const hp = spiralPts(9.6, -14.0, -PI / 2 - 0.5, PI * 1.85, 6.8, 1.7, 26);
    P.part((c) => ribbonPath(c, hp, 5.0, 1.5), CH.horn, {
      shade: CH.hornSh, sh: [-0.6, -0.7],
      detail(c) {
        c.strokeStyle = CH.ridge; c.lineWidth = 0.55; c.beginPath();
        for (let i = 2; i < hp.length - 2; i += 3) {
          const p = hp[i], q = hp[i + 1], ang = Math.atan2(q[1] - p[1], q[0] - p[0]) + PI / 2, w = 1.8 - i * 0.05;
          c.moveTo(p[0] + Math.cos(ang) * w, p[1] + Math.sin(ang) * w); c.lineTo(p[0] - Math.cos(ang) * w, p[1] - Math.sin(ang) * w);
        }
        c.stroke();
      },
      hi: [7.2, -18.0, 1.5, 0.6, -0.4],
    });
  }

  // ---- baby sprout (alone, and as a crown on grandma's head)
  function babyBody(P, cx, by, s, face, leafA) {
    P.part((c) => leafPath(c, cx + 0.2 * s, by - 10.6 * s, leafA, 6.2 * s, 2.3 * s), C.leaf, { shade: C.leafSh, sh: [-0.5 * s, -0.5 * s], detail: midrib(cx + 0.2 * s, by - 10.6 * s, leafA, 6.2 * s, C.leafSh, 0.45 * s) });
    P.part((c) => turnipPath(c, cx, by - 11.4 * s, by - 1.6 * s, 5.8 * s), (c, sh) => {
      c.fillStyle = sh ? BA.botSh : BA.bot; c.fillRect(-500, -500, 1000, 1000);
      c.fillStyle = sh ? BA.topSh : BA.top;
      c.beginPath(); c.moveTo(cx - 20, by - 30 * s); c.lineTo(cx + 20, by - 30 * s); c.lineTo(cx + 20, by - 6.4 * s);
      for (let x = 20; x >= -20; x -= 0.5) c.lineTo(cx + x, by - 6.4 * s + 0.5 * s * Math.sin(x / s * 1.3));
      c.closePath(); c.fill();
    }, { sh: [-1.1 * s, -0.9 * s], hi: [cx - 3.2 * s, by - 8.6 * s, 1.3 * s, 0.7 * s, -0.7] });
    if (face === 'dots') {
      P.detail((c) => {
        c.fillStyle = OUT;
        c.beginPath(); c.arc(cx + 0.6 * s, by - 7.0 * s, 0.75 * s, 0, TAU); c.arc(cx + 3.4 * s, by - 7.0 * s, 0.7 * s, 0, TAU); c.fill();
        c.strokeStyle = OUT; c.lineWidth = 0.5 * s; c.beginPath(); c.arc(cx + 2.0 * s, by - 3.6 * s, 0.9 * s, PI * 1.15, PI * 1.85); c.stroke();
      });
    }
  }
  function sproutParts(P, fr) {
    const st = [0, 1, 0, -1][fr];
    const lift = (s) => Math.max(0, s) * 1.1;
    P.part(CAP(-1.8, -3.0, -2.1 + st * 1.0, -0.8 - lift(st), 0.95), C.root, { shade: C.rootSh, sh: [-0.3, -0.3] });
    P.part(CAP(1.8, -3.0, 2.1 - st * 1.0, -0.8 - lift(-st), 0.95), C.root, { shade: C.rootSh, sh: [-0.3, -0.3] });
    babyBody(P, 0, 0, 1, null, 0.45 + [0, 0.12, 0, -0.12][fr]);
    P.detail((c) => {
      const j = [0, 0.12, 0, -0.08][fr];
      c.lineWidth = IL * 1.1; c.strokeStyle = OUT; c.fillStyle = '#ffffff';
      c.beginPath(); c.ellipse(0.9, -6.6, 1.55, 1.8, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(4.2, -6.5, 1.4, 1.7, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = OUT;
      c.beginPath(); c.arc(1.5 + j, -6.3, 0.85, 0, TAU); c.arc(4.7 + j, -6.2, 0.8, 0, TAU); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(1.2 + j, -6.7, 0.3, 0, TAU); c.arc(4.4 + j, -6.6, 0.28, 0, TAU); c.fill();
      c.strokeStyle = OUT; c.lineWidth = 1.0; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-0.9, -9.0); c.lineTo(2.2, -7.9); c.moveTo(3.3, -7.9); c.lineTo(5.9, -8.9); c.stroke();
      c.lineWidth = 0.7; c.beginPath(); c.arc(2.8, -3.0, 1.2, PI * 1.2, PI * 1.8); c.stroke();
    });
  }

  // ---- Rüben-Ahnin: old matriarch rutabaga with shawl, glasses, cane and a crown of babies
  function motherParts(P, fr) {
    const st = [0, 1, 0, -1][fr];
    const lift = (s) => Math.max(0, s) * 1.6;
    // crown: old droopy leaves + three babies
    leaf(P, 0.5, -33.0, -1.25, 8.5, 2.6, '#a3b46a', '#7d8c4a');
    leaf(P, 0.5, -33.0, 1.2, 8.0, 2.5, '#a3b46a', '#7d8c4a');
    babyBody(P, -4.6, -30.6, 0.62, 'dots', -0.35 + st * 0.05);
    babyBody(P, 5.4, -30.8, 0.6, 'dots', 0.4 - st * 0.05);
    babyBody(P, 0.5, -32.2, 0.7, 'dots', 0.1 + st * 0.04);
    // back arm
    P.part(CAP(-12.4, -17.0, -15.6, -11.6 + st * 0.6, 2.0), MO.bot, { shade: MO.botSh, sh: [-0.4, -0.4] });
    // feet
    P.part(E(-4.6 + st * 1.4, -1.6 - lift(st), 3.6, 1.9), C.root, { shade: C.rootSh, sh: [-0.5, -0.5] });
    P.part(E(5.0 - st * 1.4, -1.6 - lift(-st), 3.6, 1.9), C.root, { shade: C.rootSh, sh: [-0.5, -0.5] });
    // body
    P.part((c) => turnipPath(c, 0.4, -33.6, -3.0, 14.6), twoTone(MO, -23.6, 1.0, 0.55), {
      sh: [-2.2, -1.8], hi: [-7.6, -28.0, 2.6, 1.3, -0.7], hi2: [-4.4, -30.4, 0.6],
      detail(c) {
        c.strokeStyle = '#d8bd8e'; c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(-9.0, -8.0); c.quadraticCurveTo(-6.4, -6.6, -4.0, -7.6);
        c.moveTo(2.0, -6.0); c.quadraticCurveTo(5.0, -5.0, 7.4, -6.4);
        c.stroke();
        c.strokeStyle = MO.topSh; c.lineWidth = 0.6;
        c.beginPath(); c.moveTo(-4.0, -31.0); c.quadraticCurveTo(-1.0, -30.0, 2.0, -31.2); c.moveTo(-3.0, -29.0); c.quadraticCurveTo(0, -28.2, 2.6, -29.2); c.stroke();
      },
    });
    // face: round gold glasses over small cross eyes, wrinkles, pursed mouth
    P.detail((c) => {
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(4.2, -25.4, 2.3, 0, TAU); c.arc(10.0, -25.2, 2.1, 0, TAU); c.fill();
      c.fillStyle = OUT;
      c.beginPath(); c.arc(4.9, -25.0, 1.0, 0, TAU); c.arc(10.6, -24.9, 0.95, 0, TAU); c.fill();
      c.strokeStyle = OUT; c.lineWidth = 1.5;
      c.beginPath(); c.arc(4.2, -25.4, 2.4, 0, TAU); c.moveTo(12.2, -25.2); c.arc(10.0, -25.2, 2.2, 0, TAU); c.stroke();
      c.strokeStyle = MO.rim; c.lineWidth = 0.7;
      c.beginPath(); c.arc(4.2, -25.4, 2.4, 0, TAU); c.moveTo(12.2, -25.2); c.arc(10.0, -25.2, 2.2, 0, TAU); c.stroke();
      c.strokeStyle = OUT; c.lineWidth = 0.7; c.beginPath(); c.moveTo(6.6, -25.6); c.quadraticCurveTo(7.1, -26.3, 7.8, -25.6); c.stroke();
      c.lineWidth = 1.2; c.beginPath(); c.moveTo(1.6, -29.0); c.lineTo(5.6, -28.2); c.moveTo(8.8, -28.1); c.lineTo(12.4, -28.8); c.stroke();
      c.lineWidth = 0.5; c.beginPath();
      c.moveTo(-0.2, -26.2); c.lineTo(-1.2, -26.8); c.moveTo(-0.2, -25.2); c.lineTo(-1.3, -25.2); c.moveTo(13.6, -24.0); c.lineTo(12.4, -23.0);
      c.stroke();
      c.lineWidth = 0.85; c.beginPath(); c.moveTo(6.0, -21.6); c.quadraticCurveTo(7.4, -22.6, 8.8, -21.4); c.stroke();
    });
    // knitted shawl with a fringe and a gold brooch
    const shawl = (c) => {
      c.moveTo(-15.4, -19.6); c.quadraticCurveTo(0, -15.0, 15.2, -20.2);
      c.lineTo(15.6, -14.6); c.quadraticCurveTo(10.0, -10.6, 3.0, -10.2);
      c.lineTo(-9.6, -5.6); c.quadraticCurveTo(-13.4, -9.4, -15.6, -13.6); c.closePath();
    };
    P.part(shawl, MO.shawl, {
      shade: MO.shawlSh, sh: [-1.2, -1.2],
      detail(c) {
        c.strokeStyle = MO.knit; c.lineWidth = 0.55; c.beginPath();
        for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
          const x = -12 + i * 3.2 + (r & 1) * 1.6, y = -16.6 + r * 2.6 + Math.abs(x) * 0.08 * (2 - r) - (x > 0 ? x * 0.05 : 0);
          c.moveTo(x - 0.8, y - 0.6); c.lineTo(x, y + 0.4); c.lineTo(x + 0.8, y - 0.6);
        }
        c.stroke();
      },
      hi: [-10.2, -16.6, 2.0, 0.7, 0.3],
    });
    P.detail((c) => {
      c.strokeStyle = OUT; c.lineWidth = 0.7; c.beginPath();
      for (let i = 0; i < 6; i++) { const t = i / 5, x = -9.4 + t * 12.0, y = -5.8 - t * 4.2; c.moveTo(x, y); c.lineTo(x - 0.4, y + 1.7); }
      c.stroke();
    });
    P.part(E(11.2, -17.4, 1.9, 1.7), MO.rim, { shade: '#d08a26', sh: [-0.4, -0.4], ol: 0.85, hi2: [10.6, -18.0, 0.45] });
    // cane + front arm
    P.detail((c) => {
      const path = () => { c.beginPath(); c.moveTo(18.6, -0.4); c.lineTo(17.6, -17.0); c.arc(15.6, -17.4, 2.0, 0.1, PI, true); c.lineTo(13.6, -15.8); };
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = OUT; c.lineWidth = 1.6 + 2.2; path(); c.stroke();
      c.strokeStyle = C.wood; c.lineWidth = 1.6; path(); c.stroke();
      c.strokeStyle = C.woodSh; c.lineWidth = 0.5; c.beginPath(); c.moveTo(18.2, -1.0); c.lineTo(17.4, -14.0); c.stroke();
    }, true);
    P.part(CAP(12.0, -16.2, 15.6, -14.2 - st * 0.4, 2.0), MO.bot, { shade: MO.botSh, sh: [-0.4, -0.4], inner: IL });
    P.part(E(16.6, -14.4 - st * 0.4, 1.9, 1.8), MO.bot, { shade: MO.botSh, sh: [-0.4, -0.4], inner: IL });
  }

  /* ---------------------------------------------------------- small sprites */
  function globParts(P) {
    // teardrop pointing along +x (flight direction)
    P.part((c) => { c.moveTo(-6.4, 0); c.bezierCurveTo(-4.0, -1.4, -1.6, -3.4, 1.0, -3.4); c.bezierCurveTo(3.4, -3.4, 4.6, -1.8, 4.6, 0); c.bezierCurveTo(4.6, 1.8, 3.4, 3.4, 1.0, 3.4); c.bezierCurveTo(-1.6, 3.4, -4.0, 1.4, -6.4, 0); c.closePath(); }, SP.tox, {
      ol: 1.0, shade: SP.toxSh, sh: [-0.6, -0.9],
      detail(c) { c.fillStyle = '#e8ff8a'; c.beginPath(); c.ellipse(1.6, -0.4, 1.9, 1.5, 0, 0, TAU); c.fill(); },
      hi: [0.4, -1.9, 1.5, 0.6, -0.1], hi2: [3.0, -1.2, 0.45],
    });
  }
  function dropParts(P) { P.part(E(0, 0, 1.3, 1.3), SP.tox, { ol: 0.8, shade: SP.toxSh, sh: [-0.3, -0.4], hi2: [-0.35, -0.4, 0.35] }); }
  function sprayParts(P) {
    // a burst of juice droplets out of the snout (+x)
    const D = [[2.5, 0, 1.5], [5.6, -2.2, 1.1], [5.2, 2.4, 1.0], [8.4, -0.4, 0.9], [8.0, -3.8, 0.6], [7.6, 3.6, 0.65]];
    for (const d of D) P.part(E(d[0], d[1], d[2], d[2] * 0.9), SP.tox, { ol: 0.7, shade: SP.toxSh, sh: [-0.3, -0.3], hi2: [d[0] - d[2] * 0.3, d[1] - d[2] * 0.35, d[2] * 0.3] });
  }
  function starParts(P) { P.part((c) => roundPoly(c, starPts(5, 2.6, 1.2, 0, 0.2, -PI / 2), 0.35), '#ffd43f', { ol: 0.7, shade: '#f39a1e', sh: [-0.5, -0.5], hi2: [-0.6, -0.8, 0.35] }); }
  function sparkParts(P) {
    P.part((c) => { const r = 3.2; c.moveTo(0, -r); c.quadraticCurveTo(r * 0.16, -r * 0.16, r, 0); c.quadraticCurveTo(r * 0.16, r * 0.16, 0, r); c.quadraticCurveTo(-r * 0.16, r * 0.16, -r, 0); c.quadraticCurveTo(-r * 0.16, -r * 0.16, 0, -r); c.closePath(); }, '#fff3b0', { ol: 0.6, shade: '#ffd43f', sh: [-0.5, -0.5] });
  }


  /* ================================================================ icons */
  function iconPaint(ctx, fn) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'outline', 2.6));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'fill', 2.6));
  }
  const sparkIcon = (P, x, y, r) => P.part((c) => {
    c.moveTo(x, y - r); c.quadraticCurveTo(x + r * 0.14, y - r * 0.14, x + r, y); c.quadraticCurveTo(x + r * 0.14, y + r * 0.14, x, y + r);
    c.quadraticCurveTo(x - r * 0.14, y + r * 0.14, x - r, y); c.quadraticCurveTo(x - r * 0.14, y - r * 0.14, x, y - r); c.closePath();
  }, '#ffd43f', { ol: 1.6, shade: '#f39a1e', sh: [-1, -1] });
  const seedPath = (c) => { c.moveTo(4.4, 0); c.bezierCurveTo(2.6, -2.8, -3.5, -3.1, -3.5, 0); c.bezierCurveTo(-3.5, 3.1, 2.6, 2.8, 4.4, 0); c.closePath(); };
  const seedIcon = (P, x, y, a, s) => P.part((c) => { c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s); seedPath(c); c.restore(); }, C.cream, {
    shade: C.creamSh, sh: [-1.2, -1.2],
    detail(c) { c.save(); c.translate(x, y); c.rotate(a); c.scale(s * 0.62, s * 0.55); c.beginPath(); seedPath(c); c.restore(); c.strokeStyle = 'rgba(205,160,92,.85)'; c.lineWidth = 1.2; c.stroke(); },
    hi: [x - Math.cos(a) * s * 1.2 + Math.sin(a) * s * 1.2, y - Math.sin(a) * s * 1.2 - Math.cos(a) * s * 1.2, s * 1.3, s * 0.55, a],
  });
  function pumpkinIcon(P, cx, cy, rx, ry, rot) {
    const T = (fn) => (c) => { c.save(); c.translate(cx, cy); c.rotate(rot || 0); fn(c); c.restore(); };
    P.part(T(CAP(0, -ry + 1, 1.2, -ry - 3, 1.6)), C.stem, { shade: C.stemSh, sh: [-0.6, -0.4] });
    P.part(T((c) => pumpkinPath(c, 0, 0, rx, ry)), C.pump, {
      shade: C.pumpSh, sh: [-1.8, -1.6],
      detail(c) { c.translate(cx, cy); c.rotate(rot || 0); ribs(c, 0, 0, rx, ry, C.pumpSh, 1.1); },
      hi: [cx - rx * 0.5, cy - ry * 0.45, 2.0, 1.0, -0.6],
    });
  }
  const ICONS = {
    leech(P) {
      // Kürbissuppe: pumpkin soup bowl, steam and a little heart
      P.detail((c) => {
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.globalAlpha = 0.95;
        c.beginPath(); c.moveTo(14, 16); c.bezierCurveTo(10, 12, 18, 9, 14, 4); c.moveTo(24, 16); c.bezierCurveTo(20, 12, 28, 9, 24, 4); c.stroke();
      });
      P.part((c) => { c.moveTo(4, 22); c.lineTo(44, 22); c.bezierCurveTo(44, 37, 37, 44, 24, 44); c.bezierCurveTo(11, 44, 4, 37, 4, 22); c.closePath(); }, C.cream, {
        shade: C.creamSh, sh: [-3, -2.4],
        detail(c) { c.fillStyle = '#9b5cd0'; c.beginPath(); c.moveTo(4, 28); c.lineTo(44, 28); c.lineTo(44, 32); c.lineTo(4, 32); c.closePath(); c.fill(); c.fillStyle = '#7241aa'; c.fillRect(30, 28, 14, 4); },
        hi: [10, 31, 1.6, 3.2, 0.2],
      });
      P.part(E(24, 22, 20, 4.6), '#ff9a3c', {
        shade: '#e8742a', sh: [0, 1.4], inner: 1.2,
        detail(c) {
          c.strokeStyle = C.cream; c.lineWidth = 1.3; c.beginPath(); c.arc(22, 22, 3.6, 0.3, PI * 1.6); c.stroke();
          c.fillStyle = C.cream; c.beginPath(); c.ellipse(13, 21.5, 1.6, 0.9, 0.4, 0, TAU); c.ellipse(31, 23, 1.6, 0.9, -0.4, 0, TAU); c.fill();
          c.fillStyle = C.leaf; c.beginPath(); c.arc(29, 20.5, 1.2, 0, TAU); c.fill();
        },
      });
      P.part((c) => heartPath(c, 36.5, 12.5, 1.15), '#ff5d6c', { shade: '#d73a55', sh: [-1.6, -1.6], hi: [33.5, 9.5, 1.8, 1.1, -0.7] });
    },
    thorns(P) {
      // spiky thorn ring around an armoured turnip shell
      P.part((c) => roundPoly(c, starPts(10, 22.5, 14.5, 24, 25, -PI / 2), 1.1), '#a3c24c', {
        shade: '#6f9530', sh: [-1.6, -1.6],
        detail(c) { c.fillStyle = C.cream; const pts = starPts(10, 22.5, 14.5, 24, 25, -PI / 2); c.beginPath(); for (let i = 0; i < pts.length; i += 2) { const p = pts[i]; c.moveTo(p[0], p[1]); c.arc(p[0] + (24 - p[0]) * 0.12, p[1] + (25 - p[1]) * 0.12, 1.7, 0, TAU); } c.fill(); },
      });
      P.part(E(24, 25, 14, 14), twoTone({ top: '#9b5cd0', topSh: '#7241aa', bot: '#f8eacb', botSh: '#e0c595' }, 27, 1.4, 0.55), {
        sh: [-2.4, -2.2], inner: 1.3,
        detail(c) {
          c.strokeStyle = OUT; c.lineWidth = 1.4; c.globalAlpha = 0.55;
          c.beginPath(); c.moveTo(13, 21); c.quadraticCurveTo(24, 15, 35, 21); c.moveTo(11, 30); c.quadraticCurveTo(24, 36, 37, 30); c.moveTo(24, 11); c.lineTo(24, 39); c.stroke();
          c.globalAlpha = 1;
        },
        hi: [17, 18, 3.2, 1.6, -0.7], hi2: [21.5, 14.5, 1.1],
      });
      P.detail((c) => {
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.globalAlpha = 0.95; c.beginPath();
        for (const a of [-2.5, -0.65, 0.95, 2.2]) { c.moveTo(24 + Math.cos(a) * 25.5, 25 + Math.sin(a) * 25.5); c.lineTo(24 + Math.cos(a) * 21, 25 + Math.sin(a) * 21); }
        c.stroke();
      });
    },
    dashup(P) {
      // Kürbis-Rolle: rolling pumpkin, speed lines, shockwave in front
      P.detail((c) => { c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.globalAlpha = 0.95; c.beginPath(); c.moveTo(2, 18); c.lineTo(11, 18); c.moveTo(1, 26); c.lineTo(9, 26); c.moveTo(3, 34); c.lineTo(11, 34); c.stroke(); });
      P.part((c) => { E(10.5, 41, 4.2, 3.3)(c); E(15.5, 42, 3.2, 2.6)(c); E(6.5, 42.5, 2.6, 2.1)(c); }, C.cream, { shade: C.creamSh, sh: [-0.8, -0.8], ol: 2.0 });
      P.part((c) => { c.moveTo(39.5, 9); c.quadraticCurveTo(50, 25, 39.5, 42); c.lineTo(36.6, 39.4); c.quadraticCurveTo(44.4, 25, 36.6, 11.6); c.closePath(); }, '#45d6ad', { shade: '#2cb892', sh: [-1, 0], ol: 2.0 });
      pumpkinIcon(P, 24, 27, 13.5, 12, 0.55);
      P.detail((c) => {
        c.translate(24, 27); c.rotate(0.55);
        carve(c, (k) => roundPoly(k, [[-4.6, -6], [-7.6, -1], [-2, -1]], 0.8), 0.3, 1.0);
        carve(c, (k) => roundPoly(k, [[4.6, -6], [2, -1], [7.6, -1]], 0.8), 0.3, 1.0);
        carve(c, (k) => { k.moveTo(-7, 2.4); k.quadraticCurveTo(0, 11, 7, 2.4); k.quadraticCurveTo(0, 5.4, -7, 2.4); k.closePath(); }, 0.3, 1.0);
      });
    },
    range(P) {
      // Weitwurf: seed on a long dotted arc to a target
      P.detail((c) => {
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.setLineDash([3.2, 4.2]);
        c.beginPath(); c.moveTo(4, 42); c.quadraticCurveTo(12, 4, 27, 13); c.stroke();
        c.beginPath(); c.moveTo(34, 21); c.quadraticCurveTo(36, 26, 36, 32); c.stroke();
        c.setLineDash([]);
      });
      P.part(E(35.5, 39.5, 9.4, 5.2), '#ff5d6c', {
        shade: '#d73a55', sh: [0, -1.2],
        detail(c) { c.fillStyle = '#fff6e4'; c.beginPath(); c.ellipse(35.5, 39.5, 6.2, 3.4, 0, 0, TAU); c.fill(); c.fillStyle = '#ff5d6c'; c.beginPath(); c.ellipse(35.5, 39.5, 3.0, 1.6, 0, 0, TAU); c.fill(); },
      });
      seedIcon(P, 30.5, 16.5, 0.75, 2.9);
      sparkIcon(P, 41, 9, 5.2);
      sparkIcon(P, 16, 6, 3.0);
    },
  };

  /* ================================================================== init */
  function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssH = window.__forceH || window.innerHeight || 900;
    const S = (cssH * dpr) / 360;
    K = Math.max(3, Math.min(6, Math.round(S * 1.25)));
    const s = {};
    s.sp = [0, 1, 2, 3].map((f) => set4([-12, -30, 17, 2.5], (P) => spitterParts(P, f, false)));
    s.spAim = set4([-12, -30, 17, 2.5], (P) => spitterParts(P, 0, true));
    s.bo = [0, 1, 2, 3].map((f) => set4([-12, -28, 10, 2.5], (P) => bomberParts(P, f), 1.05, ['#ff3a3a', '#d4142c']));
    s.ch = [0, 1, 2, 3].map((f) => set4([-21, -31, 21, 2.5], (P) => chargerParts(P, 'walk', f)));
    s.chTele = [0, 1].map((f) => set4([-21, -31, 21, 2.5], (P) => chargerParts(P, 'tele', f)));
    s.chDash = set4([-21, -31, 21, 2.5], (P) => chargerParts(P, 'dash', 0));
    s.chDizzy = [0, 1, 2, 3].map((f) => (f & 1 ? null : set4([-21, -31, 21, 2.5], (P) => chargerParts(P, 'dizzy', f))));
    s.mo = [0, 1, 2, 3].map((f) => set4([-19, -45, 22, 3], (P) => motherParts(P, f)));
    s.sprout = [0, 1, 2, 3].map((f) => set4([-8, -19, 9, 2], (P) => sproutParts(P, f), 0.95));
    s.glob = build([-8, -5, 6.5, 5], globParts);
    s.drop = build([-2.5, -2.5, 2.5, 2.5], dropParts);
    s.spray = build([-1, -6, 11, 6], sprayParts);
    s.star = build([-3.6, -3.6, 3.6, 3.6], starParts);
    s.spark = build([-4.2, -4.2, 4.2, 4.2], sparkParts);
    s.gGreen = glowSpr(12, '190,255,90', 0.85);
    s.gRed = glowSpr(16, '255,70,60', 0.8);
    s.gGold = glowSpr(12, '255,214,90', 0.85);
    s.gPink = glowSpr(24, '255,150,200', 0.7);
    s.shadow = plain([-4, -1.6, 4, 1.6], (c) => { c.fillStyle = 'rgba(50,30,72,0.22)'; c.beginPath(); c.ellipse(0, 0, 3.6, 1.35, 0, 0, TAU); c.fill(); });
    s.streak = plain([-14, -3.4, 0, 3.4], (c) => {
      const g = c.createLinearGradient(0, 0, -14, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.strokeStyle = g; c.lineCap = 'round';
      c.lineWidth = 1.0; c.beginPath(); c.moveTo(-1, 0); c.lineTo(-13, 0); c.stroke();
      c.lineWidth = 0.75; c.beginPath(); c.moveTo(-2, -2.4); c.lineTo(-10, -2.4); c.moveTo(-2, 2.4); c.lineTo(-9, 2.4); c.stroke();
    });
    SPR = s;
  }

  /* ================================================================= register */
  const scl = (e) => 0.94 + e.seed * 0.12;
  Cn.art('cartoon', {
    init() { init(); },
    enemies: {
      spitter(ctx, e, view, st) {
        flush(ctx, view, st);
        const V = tf(view);
        const ph = e.anim * 0.85 + e.seed, f = Math.floor(ph * 4) & 3;
        const sn = Math.sin(ph * TAU), up = Math.abs(sn);
        let x = e.x, y = e.y - up * 1.2, rot = sn * 0.09;
        let sx = 1 + (1 - up) * 0.05, sy = 1 - (1 - up) * 0.06 + up * 0.03;
        let set = SPR.sp[f];
        const aim = e.mode === 'aim' && !e.dying, ch = aim ? e.charge || 0 : 0, spit = e.spit || 0;
        if (aim) {
          set = SPR.spAim;
          const sw = 1 + 0.13 * ch;
          y = e.y; rot = Math.sin(view.rt * 47 + e.seed * 9) * 0.035 * ch;
          x += Math.sin(view.rt * 61 + e.seed * 5) * 0.55 * ch;
          sx = sw * (1 + 0.04 * Math.sin(view.rt * 30) * ch); sy = sw * (1 - 0.03 * ch);
        } else if (spit > 0) {
          set = SPR.sp[0];
          y = e.y; rot = -e.facing * 0.12 * spit;
          sx = 1 - 0.14 * spit; sy = 1 + 0.12 * spit;
          x -= e.facing * 2.2 * spit;
        }
        const k = scl(e);
        drawBody(ctx, V, e, set, x, y, sx * k, sy * k, rot, () => {
          if (aim) {
            lp(13.4, -10.3, PT);
            glowAt(ctx, SPR.gGreen, PT[0], PT[1], 0.5 + ch * 0.6, 0.35 + ch * 0.75);
          } else if (spit > 0) {
            lp(14.0, -10.3, PT);
            const q = 1 - spit;
            ctx.globalAlpha = Math.min(1, spit * 1.6);
            const left = e.facing < 0;
            blitRot(ctx, V, SPR.spray, PT[0] + (left ? -1 : 1) * q * 3, PT[1], (left ? -1 : 1) * (0.8 + q * 0.6), 0.8 + q * 0.6, 0);
            ctx.globalAlpha = 1;
            glowAt(ctx, SPR.gGreen, PT[0], PT[1], 0.7, spit * 0.8);
          }
        });
      },
      bomber(ctx, e, view, st) {
        flush(ctx, view, st);
        const V = tf(view);
        const ph = e.anim * 1.25 + e.seed, f = Math.floor(ph * 4) & 3;
        const sn = Math.sin(ph * TAU * 2), up = Math.abs(sn);
        let x = e.x, y = e.y - up * 0.9, rot = Math.sin(ph * TAU) * 0.07;
        let sx = 1 + (1 - up) * 0.06, sy = 1 - (1 - up) * 0.06;
        const armed = e.armed && !e.dying, fu = armed ? e.fuse || 0 : 0;
        let blink = 0;
        if (armed) {
          const sw = 1 + 0.16 * fu + 0.05 * Math.sin(view.rt * 40) * fu;
          sx *= sw; sy *= sw;
          x += Math.sin(view.rt * 70 + e.seed * 7) * 0.5 * fu;
          rot = Math.sin(view.rt * 55) * 0.05 * (0.3 + fu);
          const cyc = fu * (3 + 11 * fu);
          blink = (cyc % 1) < 0.5 ? 1 : 2;
        }
        const k = scl(e) * 0.95;
        const set = SPR.bo[f];
        drawBody(ctx, V, e, set, x, y, sx * k, sy * k, rot, (bx, by) => {
          if (armed) {
            const left = e.facing < 0;
            if (blink === 1) { ctx.globalAlpha = 0.78; put(ctx, V, left ? set.tl : set.t, POSE.x, POSE.y, bx, by, POSE.rot); }
            else { ctx.globalAlpha = 0.5; put(ctx, V, left ? set.fl : set.f, POSE.x, POSE.y, bx, by, POSE.rot); }
            ctx.globalAlpha = 1;
            lp(0, -9, PT);
            glowAt(ctx, SPR.gRed, PT[0], PT[1], 0.9 + fu * 0.7, (blink === 1 ? 0.55 : 0.25) + fu * 0.3);
          }
          // fuse spark
          lp(FUSE_TIP[0], FUSE_TIP[1], PT);
          const fl = 0.75 + 0.25 * Math.sin(view.rt * 31 + e.seed * 20);
          const ss = (armed ? 0.75 + fu * 1.1 : 0.55) * fl;
          glowAt(ctx, SPR.gGold, PT[0], PT[1], (armed ? 0.6 + fu * 0.8 : 0.4), 0.8);
          blitRot(ctx, V, SPR.spark, PT[0], PT[1], ss, ss, view.rt * 6 + e.seed * 9);
        });
      },
      charger(ctx, e, view, st) {
        flush(ctx, view, st);
        const V = tf(view);
        const mode = e.dying ? 'chase' : e.mode;
        const ph = e.anim * 0.7 + e.seed, f = Math.floor(ph * 4) & 3;
        const sn = Math.sin(ph * TAU), up = Math.abs(sn);
        let x = e.x, y = e.y - up * 1.4, rot = sn * 0.05;
        let sx = 1 + (1 - up) * 0.05, sy = 1 - (1 - up) * 0.05;
        let set = SPR.ch[f];
        const fs = e.facing < 0 ? -1 : 1;
        const t = e.modeT || 0;
        if (mode === 'tele') {
          const q = U.clamp(t / 0.72, 0, 1);
          set = SPR.chTele[Math.floor(view.rt * 9) & 1];
          y = e.y; x += Math.sin(view.rt * 75 + e.seed * 4) * 0.6 * q;
          rot = -fs * (0.2 * U.ease.outQuad(Math.min(1, t / 0.3)) - 0.24 * Math.max(0, (t - 0.45) / 0.27)) + Math.sin(view.rt * 50) * 0.02;
          sx = 1 - 0.06 * q; sy = 1 + 0.05 * q;
        } else if (mode === 'dash') {
          set = SPR.chDash;
          y = e.y - Math.abs(Math.sin(view.rt * 30)) * 0.8; rot = fs * 0.16;
          sx = 1.16; sy = 0.9;
        } else if (mode === 'rest') {
          set = SPR.chDizzy[(Math.floor(view.rt * 3) & 1) * 2];
          y = e.y; rot = Math.sin(view.rt * 8 + e.seed * 3) * 0.07;
          sx = 1 + Math.sin(view.rt * 8) * 0.03; sy = 1 - Math.sin(view.rt * 8) * 0.03;
        }
        const k = scl(e) * 0.95;
        if (mode === 'dash' && !e.dying && e.spawnT >= 1) {
          // speed smear: two fading ghosts + streaks behind
          const left = e.facing < 0;
          for (let i = 2; i >= 1; i--) {
            ctx.globalAlpha = 0.16 * (3 - i);
            put(ctx, V, left ? set.nl : set.n, x - e.dashX * 6 * i, y - e.dashY * 6 * i, sx * k, sy * k, rot);
          }
          ctx.globalAlpha = 0.9;
          const a = Math.atan2(e.dashY, e.dashX);
          blitRot(ctx, V, SPR.streak, x - e.dashX * 12, y - 14, 1.3, 1.3, a);
          blitRot(ctx, V, SPR.streak, x - e.dashX * 14, y - 6, 1.0, 1.0, a);
          ctx.globalAlpha = 1;
        }
        drawBody(ctx, V, e, set, x, y, sx * k, sy * k, rot, () => {
          if (mode === 'tele') {
            lp(CH_EYE[0], CH_EYE[1], PT);
            const q = U.clamp(t / 0.72, 0, 1);
            glowAt(ctx, SPR.gRed, PT[0], PT[1], 0.35 + q * 0.3, 0.55 + 0.35 * Math.sin(view.rt * 30));
          } else if (mode === 'rest') {
            lp(CH_HEAD[0], CH_HEAD[1] - 3, PT);
            for (let i = 0; i < 3; i++) {
              const a = view.rt * 6 + (i / 3) * TAU;
              const px = PT[0] + Math.cos(a) * 7, py = PT[1] + Math.sin(a) * 2.4;
              const s2 = 0.8 + Math.sin(a) * 0.2;
              blitRot(ctx, V, SPR.star, px, py, s2, s2, a * 0.5);
            }
          }
        });
      },
      mother(ctx, e, view, st) {
        flush(ctx, view, st);
        const V = tf(view);
        const ph = e.anim * 0.38 + e.seed, f = Math.floor(ph * 4) & 3;
        const sn = Math.sin(ph * TAU), up = Math.abs(sn), contact = Math.pow(1 - up, 3);
        let y = e.y - up * 1.4, rot = sn * 0.04;
        let sx = 1 + contact * 0.06, sy = 1 - contact * 0.06;
        const b = e.dying ? 0 : e.birth || 0;
        if (b > 0) {
          const q = 1 - b;
          const w = Math.sin(q * PI * 3) * b;
          sx *= 1 + 0.16 * w; sy *= 1 - 0.14 * w;
        }
        const k = scl(e) * 0.93;
        if (b > 0.02) { glowAt(ctx, SPR.gPink, e.x, e.y - 18, 0.9 + (1 - b) * 0.5, b * 0.75); }
        drawBody(ctx, V, e, SPR.mo[f], e.x, y, sx * k, sy * k, rot, () => {
          if (b > 0.3) {
            lp(0.5, -40, PT);
            const q = (b - 0.3) / 0.7;
            for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + (1 - b) * 4; blitRot(ctx, V, SPR.spark, PT[0] + Math.cos(a) * 9 * (1.4 - q), PT[1] + Math.sin(a) * 4 + 3, q * 0.9, q * 0.9, a); }
          }
        });
      },
      sprout(ctx, e, view, st) {
        flush(ctx, view, st);
        const V = tf(view);
        const ph = e.anim * 1.3 + e.seed, f = Math.floor(ph * 4) & 3;
        const sn = Math.sin(ph * TAU), up = Math.abs(sn);
        const y = e.y - up * 1.2;
        const sx = 1 + (1 - up) * 0.07, sy = 1 - (1 - up) * 0.07 + up * 0.04;
        const k = scl(e);
        drawBody(ctx, V, e, SPR.sprout[f], e.x, y, sx * k, sy * k, sn * 0.12);
      },
    },
    shot(ctx, s, view) {
      const V = tf(view);
      const x = s.x, y = s.y - (s.z || 11), a = s.angle || 0;
      const w = Math.sin((s.age || 0) * 26 + s.seed * 9);
      glowAt(ctx, SPR.gGreen, x, y, 0.9, 0.55);
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let i = 2; i >= 1; i--) {
        const d = 5.5 + i * 3.6, perp = Math.sin((s.age || 0) * 20 + i * 2 + s.seed * 7) * 0.8;
        const px = x - ca * d - sa * perp, py = y - sa * d + ca * perp;
        const sc = 1 - i * 0.28;
        blit(ctx, SPR.drop, px, py, sc, sc);
      }
      blitRot(ctx, V, SPR.glob, x, y, 1 + w * 0.12, 1 - w * 0.1, a);
    },
    icons: (() => {
      const o = {};
      for (const id in ICONS) o[id] = (ctx, size) => { ctx.save(); ctx.scale(size / 48, size / 48); iconPaint(ctx, ICONS[id]); ctx.restore(); };
      return o;
    })(),
  });
})();
