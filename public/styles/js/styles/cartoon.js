/* ============================================================================
   Brotato-Cartoon (id: cartoon) – bold, clean HD vector cartoon.
   Everything is drawn with ONE outline language: thick deep-plum outer outline,
   flat fill + exactly one cel-shade step (shifted-silhouette crescent) + one glossy
   highlight. Sprites are pre-rendered in init() (several frames, both facings,
   white-flash copies) and squashed/stretched at draw time.
   Ground: flat-colour play-mat – smooth noise fields evaluated on a coarse grid,
   per-pixel signed distance (value / gradient) gives crisp anti-aliased region
   edges with an inner rim band; flat vector decals on top.
   ========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ------------------------------------------------------------------ palette */
  const OUT = '#3a2240';          // the one outline colour (deep plum)
  const OL = 1.15;                // outer outline weight (world units)
  const IL = 0.55;                // inner separation lines
  const FLASH_SH = '#efe6f6';
  const C = {
    pump: '#ff952b', pumpSh: '#ea681c', pumpRib: '#ec7a22', carve: '#8a3214', glow: '#ffd43f', glowHi: '#fff3b0',
    propPump: '#f59a3a', propPumpSh: '#d96f26',
    coat: '#2f9c95', coatSh: '#22736f', scarf: '#8ad04c', scarfSh: '#5ea83a', scarfHi: '#c3ec8c',
    leg: '#41703f', legSh: '#2f5431', shoe: '#6b3d2c', shoeSh: '#4c291f',
    stem: '#7f9b3b', stemSh: '#5d7a2a', leaf: '#86cf4c', leafSh: '#59a33a',
    ghost: '#f6f8ff', ghostSh: '#c3d0ef', tongue: '#ff7f9e',
    root: '#efd49e', rootSh: '#cfac70',
    cream: '#fff1c8', creamSh: '#e6c68a',
    wood: '#d4a066', woodSh: '#a9743f', bark: '#a56f48', barkSh: '#7c4e33',
    band: '#f6e6c4', bandSh: '#d8bf8d',
    ochre: '#efc96f', ochreSh: '#cf9f4c', cTop: '#7b3f99', cTopSh: '#58297a',
  };
  const CREEP = [
    { top: '#9b5cd0', topSh: '#7241aa', bot: '#f8eacb', botSh: '#e0c595', chunk: 0 },
    { top: '#bd5aa6', topSh: '#8f3c82', bot: '#f9e7d2', botSh: '#e4c4a0', chunk: 8 },
    { top: '#7d66d8', topSh: '#5947ad', bot: '#f3ecc2', botSh: '#dacd92', chunk: 9 },
  ];

  const JACK_SCALE = 1.1, CREEP_SCALE = 0.9;
  let K = 3; // sprite resolution: canvas px per world unit (set in init from display size)
  const SPR = {};

  /* ================================================================ painter
     A sprite is a function fn(P) that declares parts back-to-front. It is run twice:
     'outline' pass (every part stroked + filled in OUT -> one clean silhouette outline),
     then 'fill' (or 'flash') pass: base fill, cel crescent, details, gloss.            */
  function Painter(ctx, mode, ol) { this.ctx = ctx; this.mode = mode; this.ol = ol; }
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
    if (flash) { ctx.fillStyle = shade ? FLASH_SH : '#ffffff'; ctx.fillRect(-500, -500, 1000, 1000); return; }
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

  /* ----------------------------------------------------------- shape helpers */
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
  function rrectRot(c, cx, cy, w, h, ang, r) {
    const co = Math.cos(ang), si = Math.sin(ang);
    const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map((p) => [cx + p[0] * co - p[1] * si, cy + p[0] * si + p[1] * co]);
    roundPoly(c, pts, r);
  }
  function starPts(n, ro, ri, cx, cy, rot) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * TAU, r = i & 1 ? ri : ro;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
  }
  function pumpkinPath(c, cx, cy, rx, ry) {
    const N = 64;
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
  /** Two-tone turnip colouring with a wavy boundary (used as a part fill function). */
  const turnipFill = (col, waveY, amp, freq) => (c, sh) => {
    c.fillStyle = sh ? col.botSh : col.bot; c.fillRect(-500, -500, 1000, 1000);
    c.fillStyle = sh ? col.topSh : col.top;
    c.beginPath(); c.moveTo(-60, -120); c.lineTo(60, -120); c.lineTo(60, waveY);
    for (let x = 60; x >= -60; x -= 0.5) c.lineTo(x, waveY + amp * Math.sin(x * freq + 0.6));
    c.closePath(); c.fill();
  };
  /** Carved hole: dark rim + glowing inside shifted down (shows carving thickness). */
  function carve(c, pathFn, dx, dy) {
    c.save();
    c.beginPath(); pathFn(c); c.fillStyle = C.carve; c.fill();
    c.clip();
    c.translate(dx === undefined ? 0.2 : dx, dy === undefined ? 0.7 : dy);
    c.beginPath(); pathFn(c); c.fillStyle = C.glow; c.fill();
    c.restore();
  }

  /* --------------------------------------------------------- sprite builder */
  function build(box, fn, mode, ol) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'outline', ol || OL));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, mode || 'fill', ol || OL));
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy }; }
  function set4(box, fn, post) {
    const n = build(box, fn, 'fill'), f = build(box, fn, 'flash');
    if (post) { post(n, box); post(f, box); }
    return { n, f, nl: flipS(n), fl: flipS(f) };
  }
  function withFlip(s) { return { n: s, l: flipS(s) }; }

  /* ============================================================ characters */
  // Jack frames: back foot x,y | front foot x,y | back arm, front arm (rad from down, + = forward) | scarf phase
  const JACK_FR = [
    [-2.3, 0, 2.3, 0, 0.25, -0.25, 0.0],
    [-3.7, -0.2, 3.9, -0.5, 0.9, -0.8, 1.6],
    [-2.0, -1.5, 2.9, -2.1, 0.35, -0.15, 3.2],
    [2.7, -0.6, -1.3, -0.2, -0.75, 0.85, 4.8],
  ];
  function jackParts(P, fr, hurt) {
    const F = JACK_FR[fr];
    const cx = 0.4, cy = -19.6, rx = 11.2, ry = 9.1;
    // scarf tail (behind)
    const w0 = Math.sin(F[6]) * 0.5, w1 = Math.sin(F[6] + 1.2) * 1.2;
    // scarf end hanging down the back, fluttering outwards while hopping
    const ang = [0.55, 1.0, 1.2, 0.9][fr], len = 7.6;
    const ax = -2.4, ay = -11.2, dx = -Math.sin(ang), dy = Math.cos(ang), nx = dy, ny = -dx;
    const wv = Math.sin(F[6] + 0.8) * 0.5, h0 = 1.45, h1 = 1.95;
    const sp = [
      [ax + nx * h0, ay + ny * h0], [ax + dx * len * 0.5 + nx * (h0 + 0.15) + nx * wv, ay + dy * len * 0.5 + ny * (h0 + 0.15) + ny * wv],
      [ax + dx * len + nx * h1, ay + dy * len + ny * h1], [ax + dx * len - nx * h1, ay + dy * len - ny * h1],
      [ax + dx * len * 0.5 - nx * (h0 + 0.15) + nx * wv, ay + dy * len * 0.5 - ny * (h0 + 0.15) + ny * wv], [ax - nx * h0, ay - ny * h0],
    ];
    P.part((c) => blobPath(c, sp, 0.6), C.scarf, {
      shade: C.scarfSh, sh: [0.5, -0.7],
      detail(c) {
        c.strokeStyle = C.scarfHi; c.lineWidth = 1.2; c.lineCap = 'butt';
        c.beginPath();
        for (const t of [0.45, 0.72]) { const mx = ax + dx * len * t + nx * wv * 0.6, my = ay + dy * len * t + ny * wv * 0.6; c.moveTo(mx + nx * 3, my + ny * 3); c.lineTo(mx - nx * 3, my - ny * 3); }
        c.stroke();
      },
    });
    P.detail((c) => {
      c.strokeStyle = OUT; c.lineWidth = 0.8; c.lineCap = 'round';
      c.beginPath();
      for (const t of [-0.75, 0, 0.75]) {
        const ex = ax + dx * (len + 0.9) + nx * h1 * t, ey = ay + dy * (len + 0.9) + ny * h1 * t;
        c.moveTo(ex, ey); c.lineTo(ex + dx * 1.5, ey + dy * 1.5);
      }
      c.stroke();
    }, true);
    const arm = (sx, a) => {
      const hx = sx + Math.sin(a) * 3.4, hy = -10.0 + Math.cos(a) * 3.4;
      P.part(CAP(sx, -10.0, hx, hy, 1.15), C.coat, { shade: C.coatSh, sh: [-0.3, -0.4] });
      P.part(E(hx, hy, 1.5, 1.5), C.cream, { shade: C.creamSh, sh: [-0.45, -0.5] });
    };
    const leg = (hx, fx, fy) => {
      P.part(CAP(hx, -5.6, fx, fy - 1.3, 1.35), C.leg, { shade: C.legSh, sh: [-0.35, -0.3] });
      P.part(E(fx + 0.7, fy - 1.05, 2.1, 1.35), C.shoe, { shade: C.shoeSh, sh: [-0.4, -0.5], hi: [fx, fy - 1.65, 0.75, 0.38, 0] });
    };
    arm(-3.0, F[4]);
    leg(-1.6, F[0], F[1]);
    leg(1.6, F[2], F[3]);
    P.part(E(0, -8.3, 4.5, 4.4), C.coat, {
      shade: C.coatSh, sh: [-1.0, -0.9],
      detail(c) { c.fillStyle = C.cream; c.beginPath(); c.arc(1.9, -7.4, 0.55, 0, TAU); c.arc(2.0, -5.4, 0.55, 0, TAU); c.fill(); },
    });
    arm(3.0, F[5]);
    P.part(E(0.3, -11.0, 5.7, 2.3), C.scarf, { shade: C.scarfSh, sh: [-0.6, -0.8], inner: IL });
    P.part(CAP(0.1, -27.0, 1.2, -30.9, 1.3), C.stem, { shade: C.stemSh, sh: [-0.45, -0.3] });
    P.part((c) => pumpkinPath(c, cx, cy, rx, ry), C.pump, {
      shade: C.pumpSh, sh: [-1.9, -1.6], inner: IL,
      detail(c) { ribs(c, cx, cy, rx, ry, C.pumpRib, 0.6); },
      hi: [cx - 6.3, cy - 4.3, 2.5, 1.3, -0.6], hi2: [cx - 3.5, cy - 6.5, 0.6],
    });
    P.detail((c) => jackFace(c, cx + 2.2, cy, hurt));
    P.part((c) => leafPath(c, -0.4, -28.4, -1.2, 5.4, 2.0), C.leaf, { shade: C.leafSh, sh: [-0.3, -0.5], detail: midrib(-0.4, -28.4, -1.2, 5.4, C.leafSh) });
    P.detail((c) => { c.strokeStyle = OUT; c.lineWidth = 0.6; c.beginPath(); c.arc(3.3, -29.4, 1.25, PI * 0.9, PI * 2.6); c.stroke(); });
  }
  function jackFace(c, fx, cy, hurt) {
    if (!hurt) {
      const eyeL = (k) => roundPoly(k, [[fx - 3.9, cy - 5.9], [fx - 7.0, cy + 0.2], [fx - 0.9, cy + 0.2]], 0.8);
      const eyeR = (k) => roundPoly(k, [[fx + 3.6, cy - 5.6], [fx + 1.0, cy + 0.1], [fx + 6.1, cy + 0.1]], 0.75);
      carve(c, eyeL, 0.25, 0.85); carve(c, eyeR, 0.25, 0.85);
      // hot core of the candle light
      c.fillStyle = C.glowHi;
      c.beginPath(); c.ellipse(fx - 3.7, cy - 1.0, 1.25, 0.8, 0, 0, TAU); c.ellipse(fx + 3.7, cy - 1.0, 1.05, 0.75, 0, 0, TAU); c.fill();
      const mouth = (k) => {
        k.moveTo(fx - 7.4, cy + 2.3);
        k.quadraticCurveTo(fx - 0.6, cy + 12.4, fx + 6.6, cy + 1.9);
        k.quadraticCurveTo(fx - 0.6, cy + 5.4, fx - 7.4, cy + 2.3);
        k.closePath();
      };
      carve(c, mouth, 0.2, 0.85);
      c.save(); c.beginPath(); mouth(c); c.clip();
      c.fillStyle = C.pump;
      c.beginPath(); rrect(c, fx - 3.6, cy + 2.0, 2.2, 2.9, 0.4); rrect(c, fx + 1.3, cy + 1.8, 2.2, 2.8, 0.4); rrect(c, fx - 1.2, cy + 5.6, 2.1, 3.4, 0.4); c.fill();
      c.restore();
    } else {
      c.lineCap = 'round'; c.lineJoin = 'round';
      const chev = (pts) => {
        c.strokeStyle = C.carve; c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke();
        c.strokeStyle = C.glow; c.lineWidth = 0.75;
        c.beginPath(); c.moveTo(pts[0][0] + 0.1, pts[0][1] + 0.3); c.lineTo(pts[1][0] + 0.1, pts[1][1] + 0.3); c.lineTo(pts[2][0] + 0.1, pts[2][1] + 0.3); c.stroke();
      };
      chev([[fx - 5.8, cy - 4.0], [fx - 2.4, cy - 2.1], [fx - 5.8, cy - 0.2]]);
      chev([[fx + 5.3, cy - 4.0], [fx + 2.0, cy - 2.1], [fx + 5.3, cy - 0.2]]);
      carve(c, (k) => { k.ellipse(fx - 0.3, cy + 4.6, 2.4, 2.8, 0, 0, TAU); }, 0.15, 0.7);
    }
  }

  function creeperParts(P, fr, v) {
    const col = CREEP[v];
    const st = [0, 1, 0, -1][fr];
    const sw = [0, 0.1, 0, -0.1][fr];
    const leaf = (a, len, wid) => P.part((c) => leafPath(c, 0.3, -19.4, a + sw, len, wid), C.leaf, {
      shade: C.leafSh, sh: [-0.6, -0.6], detail: midrib(0.3, -19.4, a + sw, len, C.leafSh),
    });
    leaf(-0.85, 8.2, 2.6); leaf(0.8, 8.0, 2.6); leaf(-0.02, 10.2, 3.0);
    const lift = (s) => Math.max(0, s) * 1.5;
    P.part(CAP(-3.0, -4.8, -3.3 + st * 0.8, -1.1 - lift(st), 1.45), C.root, { shade: C.rootSh, sh: [-0.4, -0.4] });
    P.part(CAP(3.0, -4.8, 3.3 - st * 0.8, -1.1 - lift(-st), 1.45), C.root, { shade: C.rootSh, sh: [-0.4, -0.4] });
    P.part((c) => turnipPath(c, 0, -21.6, -2.6, 10.4), turnipFill(col, -10.8, 0.8, 0.9), {
      sh: [-1.8, -1.5], hi: [-5.2, -16.2, 2.2, 1.2, -0.7], hi2: [-2.7, -18.4, 0.55],
    });
    P.detail((c) => {
      const j = [0, 0.18, 0, -0.12][fr];
      // eyes
      c.lineWidth = IL * 1.3; c.strokeStyle = OUT; c.fillStyle = '#ffffff';
      c.beginPath(); c.ellipse(1.0, -13.4, 2.5, 2.8, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(6.4, -13.2, 2.3, 2.7, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = OUT;
      c.beginPath(); c.arc(1.8 + j, -12.9, 1.25, 0, TAU); c.arc(7.1 + j, -12.7, 1.2, 0, TAU); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(1.4 + j, -13.4, 0.38, 0, TAU); c.arc(6.7 + j, -13.2, 0.36, 0, TAU); c.fill();
      // angry brows
      c.strokeStyle = OUT; c.lineWidth = 1.35; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-1.8, -17.6); c.lineTo(3.0, -15.6); c.moveTo(4.6, -15.5); c.lineTo(9.0, -17.3); c.stroke();
      // grumpy mouth
      c.lineWidth = 0.9;
      c.beginPath(); c.arc(4.0, -6.2, 2.1, PI * 1.18, PI * 1.82); c.stroke();
    });
  }

  function ghostPath(c, ph) {
    c.moveTo(-7.8, -7.4);
    c.bezierCurveTo(-8.8, -15.5, -6.4, -24.4, 0.6, -24.4);
    c.bezierCurveTo(7.8, -24.4, 9.3, -15.6, 8.3, -5.0);
    const xs = [8.3, 4.6, 0.8, -3.0];
    for (let i = 0; i < 3; i++) {
      const x0 = xs[i], x1 = xs[i + 1];
      const yEnd = -4.6 + Math.sin(ph + i * 1.9) * 0.6;
      const yLow = -0.4 + Math.sin(ph + i * 1.9 + 1.2) * 1.0;
      c.quadraticCurveTo((x0 + x1) / 2, yLow, x1, yEnd);
    }
    // wispy tail curling back
    const tw = Math.sin(ph + 2.4);
    c.quadraticCurveTo(-6.0, 0.4 + tw * 0.6, -11.6 + tw * 0.8, -2.6 + tw * 0.9);
    c.quadraticCurveTo(-9.4, -4.6, -7.8, -7.4);
    c.closePath();
  }
  function ghostParts(P, fr) {
    const ph = (fr / 4) * TAU;
    P.part(E(-7.6, -12.4 + Math.sin(ph) * 0.6, 2.3, 1.6, 0.5), C.ghost, { shade: C.ghostSh, sh: [-0.4, -0.4] });
    P.part((c) => ghostPath(c, ph), C.ghost, { shade: C.ghostSh, sh: [-1.7, -1.3], hi: [-3.6, -20.0, 2.2, 1.2, -0.7], hi2: [-1.0, -22.0, 0.5] });
    P.part(E(8.9, -13.0 + Math.sin(ph + 1.3) * 0.7, 2.9, 1.7, -0.3), C.ghost, { shade: C.ghostSh, sh: [-0.5, -0.5], inner: IL });
    P.detail((c) => {
      c.fillStyle = OUT;
      c.beginPath(); c.ellipse(1.6, -16.8, 1.55, 2.4, 0.18, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(5.9, -16.6, 1.45, 2.3, -0.18, 0, TAU); c.fill();
      c.fillStyle = '#9fd8ff';
      c.beginPath(); c.arc(1.3, -17.7, 0.45, 0, TAU); c.arc(5.6, -17.5, 0.42, 0, TAU); c.fill();
      // gaping hungry mouth
      const m = 0.3 * Math.sin(ph * 2);
      c.save();
      c.beginPath(); c.ellipse(3.9, -10.4, 2.5, 3.2 + m, 0, 0, TAU);
      c.fillStyle = OUT; c.fill(); c.clip();
      c.fillStyle = C.tongue; c.beginPath(); c.ellipse(4.2, -7.6 + m, 1.9, 1.3, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.moveTo(2.4, -13.6); c.lineTo(3.4, -13.6); c.lineTo(2.9, -11.9); c.closePath();
      c.moveTo(4.5, -13.6); c.lineTo(5.5, -13.6); c.lineTo(5.0, -11.9); c.closePath(); c.fill();
      c.restore();
    });
  }
  function ghostFade(s, box) {
    const ctx = s.c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const y0 = (-9 - box[1]) * K, y1 = (0 - box[1]) * K;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = g; ctx.fillRect(0, 0, s.c.width, s.c.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  function colossusParts(P, fr) {
    const st = [0, 1, 0, -1][fr];
    const lift = (s) => Math.max(0, s) * 2.6;
    const col = { top: C.cTop, topSh: C.cTopSh, bot: C.ochre, botSh: C.ochreSh };
    const top = -46.5, bot = -5.2, hw = 19.5;
    const L = (a, len, wid, fc, sc) => P.part((c) => leafPath(c, 0.5, top + 2.6, a + st * 0.04, len, wid), fc, {
      shade: sc, sh: [-0.9, -0.9], detail: midrib(0.5, top + 2.6, a + st * 0.04, len, sc, 0.6),
    });
    L(-1.1, 12.5, 4.0, '#a29a46', '#7d7530');
    L(1.05, 13.5, 4.3, '#6dbb4c', '#4d9338');
    L(-0.48, 16.5, 5.0, '#6dbb4c', '#4d9338');
    L(0.5, 15.5, 4.8, '#79c652', '#55a03c');
    L(0.0, 18.5, 5.4, '#79c652', '#55a03c');
    // legs
    const legP = (hx, fx, fy) => {
      P.part(CAP(hx, -9.5, fx, fy - 2.4, 3.5), C.root, { shade: C.rootSh, sh: [-0.8, -0.6] });
      P.part(E(fx + 0.8, fy - 1.4, 4.4, 2.0), C.root, { shade: C.rootSh, sh: [-0.8, -0.7], inner: IL });
    };
    legP(-7.5, -8.0 + st * 1.8, -lift(st));
    legP(7.5, 8.0 - st * 1.8, -lift(-st));
    // back arm
    P.part(CAP(-16.0, -27.0, -21.4, -18.2 + st * 1.4, 3.1), C.root, { shade: C.rootSh, sh: [-0.6, -0.6] });
    P.part((c) => turnipPath(c, 0, top, bot, hw), turnipFill(col, -26.5, 1.5, 0.38), {
      sh: [-2.8, -2.3], hi: [-10.4, -37.5, 3.6, 1.9, -0.7], hi2: [-6.6, -41.0, 0.9],
      detail(c) {
        c.strokeStyle = OUT; c.lineWidth = 0.75; c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(-14.2, -31.5); c.lineTo(-11.6, -29.6); c.lineTo(-13.0, -27.0); c.lineTo(-10.2, -24.6);
        c.moveTo(13.6, -12.0); c.lineTo(15.6, -14.6); c.lineTo(14.0, -16.8); c.lineTo(16.2, -19.0);
        c.moveTo(-6.5, -9.0); c.lineTo(-4.6, -11.4); c.lineTo(-6.0, -13.4);
        c.moveTo(4.0, -42.0); c.lineTo(5.6, -39.6); c.lineTo(4.4, -37.6);
        c.stroke();
      },
    });
    // bandage cross
    const bandDots = (c) => { c.fillStyle = C.bandSh; for (const p of [[-10.6, -36.6], [-9.0, -35.4], [-10.8, -34.6], [-8.6, -37.2]]) { c.beginPath(); c.arc(p[0], p[1], 0.35, 0, TAU); c.fill(); } };
    P.part((c) => rrectRot(c, -9.6, -35.8, 11.5, 3.4, 0.68, 1.3), C.band, { shade: C.bandSh, sh: [-0.3, -0.4], inner: IL });
    P.part((c) => rrectRot(c, -9.6, -35.8, 11.5, 3.4, -0.68, 1.3), C.band, { shade: C.bandSh, sh: [-0.3, -0.4], inner: IL, detail: bandDots });
    // front arm with a bandage wrap
    P.part(CAP(16.2, -25.6, 22.6, -17.2 - st * 1.4, 3.2), C.root, {
      shade: C.rootSh, sh: [-0.6, -0.6], inner: IL,
      detail(c) {
        c.fillStyle = C.band;
        c.save(); c.translate(19.6, -21.5); c.rotate(0.95);
        c.fillRect(-1.4, -5, 1.2, 10); c.fillRect(0.6, -5, 1.2, 10);
        c.strokeStyle = OUT; c.lineWidth = 0.4; c.strokeRect(-1.4, -5, 1.2, 10); c.strokeRect(0.6, -5, 1.2, 10);
        c.restore();
      },
    });
    P.part(E(23.4, -16.0 - st * 1.4, 2.6, 2.4), C.root, { shade: C.rootSh, sh: [-0.5, -0.5], inner: IL });
    P.detail((c) => {
      // glowing eyes
      c.lineWidth = 0.8; c.strokeStyle = OUT;
      c.fillStyle = C.glow;
      c.beginPath(); c.ellipse(2.0, -29.0, 3.0, 2.2, 0.1, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(11.6, -29.0, 2.6, 2.1, -0.1, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = C.glowHi;
      c.beginPath(); c.ellipse(2.5, -28.7, 1.2, 0.9, 0, 0, TAU); c.ellipse(12.0, -28.7, 1.05, 0.85, 0, 0, TAU); c.fill();
      // heavy brows
      c.fillStyle = OUT;
      c.beginPath(); roundPoly(c, [[-3.8, -35.6], [5.4, -31.6], [5.2, -29.6], [-3.6, -32.9]], 0.6); c.fill();
      c.beginPath(); roundPoly(c, [[8.0, -31.6], [16.0, -35.2], [16.1, -32.6], [8.2, -29.6]], 0.6); c.fill();
      // grimace with teeth
      c.save();
      c.beginPath(); roundPoly(c, [[0.2, -23.0], [14.2, -24.0], [13.2, -17.6], [1.4, -17.4]], 1.8);
      c.fillStyle = OUT; c.fill(); c.clip();
      c.fillStyle = '#fff6e2';
      c.beginPath();
      for (let i = 0; i < 6; i++) { const x = 1.0 + i * 2.3; c.moveTo(x, -24.5); c.lineTo(x + 2.3, -24.5); c.lineTo(x + 1.15, -21.4); c.closePath(); }
      for (let i = 0; i < 5; i++) { const x = 2.2 + i * 2.3; c.moveTo(x, -16.5); c.lineTo(x + 2.3, -16.5); c.lineTo(x + 1.15, -19.2); c.closePath(); }
      c.fill();
      c.restore();
      // root hairs
      c.strokeStyle = OUT; c.lineWidth = 0.7;
      c.beginPath();
      c.moveTo(-12.5, -8.6); c.quadraticCurveTo(-15.0, -7.4, -16.4, -5.0);
      c.moveTo(13.5, -9.0); c.quadraticCurveTo(16.0, -7.8, 17.0, -5.6);
      c.stroke();
    });
  }

  /* ---------------------------------------------------------- small sprites */
  function lanternParts(P) {
    const col = { top: '#a462d6', topSh: '#7a45ad', bot: '#fff0c4', botSh: '#ecc98a' };
    P.part((c) => leafPath(c, 0, -13.6, -0.6, 5.2, 1.8), C.leaf, { shade: C.leafSh, sh: [-0.4, -0.4] });
    P.part((c) => leafPath(c, 0, -13.6, 0.55, 5.6, 1.9), C.leaf, { shade: C.leafSh, sh: [-0.4, -0.4] });
    P.part((c) => turnipPath(c, 0, -14.4, -0.6, 7.4), turnipFill(col, -9.6, 0.6, 1.2), {
      sh: [-1.2, -1.0], hi: [-4.0, -10.6, 1.5, 0.8, -0.7],
    });
    P.detail((c) => {
      carve(c, (k) => roundPoly(k, [[-2.4, -9.4], [-4.2, -6.5], [-0.8, -6.5]], 0.45), 0.1, 0.5);
      carve(c, (k) => roundPoly(k, [[2.4, -9.4], [0.8, -6.5], [4.2, -6.5]], 0.45), 0.1, 0.5);
      carve(c, (k) => { k.moveTo(-3.8, -5.0); k.quadraticCurveTo(0, 0.4, 3.8, -5.0); k.quadraticCurveTo(0, -3.0, -3.8, -5.0); k.closePath(); }, 0.1, 0.5);
    });
  }
  function gemParts(P, big) {
    const k = big ? 1.55 : 1;
    const col = big ? ['#62c8ff', '#2f83e0'] : ['#74e690', '#2fae66'];
    const pts = [[-3.2, -3.4], [-1.7, -5.3], [1.7, -5.3], [3.2, -3.4], [0, 0.3]].map((p) => [p[0] * k, p[1] * k]);
    P.part((c) => roundPoly(c, pts, 0.55 * k), col[0], {
      ol: big ? 1.0 : 0.85,
      detail(c) {
        c.fillStyle = col[1];
        c.beginPath(); c.moveTo(0.4 * k, -3.4 * k); c.lineTo(3.4 * k, -3.4 * k); c.lineTo(0, 0.6 * k); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(1.7 * k, -5.4 * k); c.lineTo(3.4 * k, -3.4 * k); c.lineTo(0.4 * k, -3.4 * k); c.closePath(); c.globalAlpha = 0.45; c.fill(); c.globalAlpha = 1;
        c.strokeStyle = OUT; c.globalAlpha = 0.35; c.lineWidth = 0.35 * k;
        c.beginPath(); c.moveTo(-3.2 * k, -3.4 * k); c.lineTo(3.2 * k, -3.4 * k); c.stroke(); c.globalAlpha = 1;
      },
      hi: [-1.5 * k, -4.0 * k, 1.0 * k, 0.5 * k, -0.4], hi2: [-2.0 * k, -2.5 * k, 0.32 * k],
    });
  }
  const seedPath = (c) => { c.moveTo(4.4, 0); c.bezierCurveTo(2.6, -2.8, -3.5, -3.1, -3.5, 0); c.bezierCurveTo(-3.5, 3.1, 2.6, 2.8, 4.4, 0); c.closePath(); };
  function seedParts(P) {
    P.part(seedPath, C.cream, {
      ol: 0.85, shade: C.creamSh, sh: [-0.5, -0.8],
      detail(c) { c.save(); c.translate(-0.2, 0); c.scale(0.66, 0.58); c.beginPath(); seedPath(c); c.restore(); c.strokeStyle = 'rgba(205,160,92,.75)'; c.lineWidth = 0.5; c.stroke(); },
      hi: [-1.0, -1.35, 1.35, 0.55, -0.12],
    });
  }
  const PUFF_COL = [['#ffffff', '#dcd6ea'], ['#f6e6c2', '#d9bf8a'], ['#eef4ff', '#b9c9ea'], ['#f1e3fb', '#c9b0e2'], ['#ffd59a', '#ef9f52']];
  function puffParts(P, t) {
    const col = PUFF_COL[t];
    P.part((c) => { E(0, 0.4, 4.6, 4.3)(c); E(-3.6, 1.4, 3.1, 2.9)(c); E(3.6, 1.2, 3.2, 3.0)(c); E(-1.6, -2.6, 3.0, 2.9)(c); E(2.1, -2.3, 2.8, 2.7)(c); },
      col[0], { ol: 0.9, shade: col[1], sh: [-1.3, -1.3], hi: [-2.4, -3.0, 1.2, 0.6, -0.6] });
  }
  const STAR_COL = [['#ffd43f', '#f39a1e'], ['#ffffff', '#d9e1f4'], ['#ff9e3d', '#e2641f']];
  function starParts(P, t) {
    const col = STAR_COL[t];
    P.part((c) => roundPoly(c, starPts(5, 4.4, 2.1, 0, 0.3, -PI / 2), 0.55), col[0], { ol: 0.85, shade: col[1], sh: [-0.8, -0.8], hi2: [-1.0, -1.4, 0.55] });
  }
  const CHUNK_COL = [
    ['#9b5cd0', '#7241aa'], ['#f8eacb', '#e0c595'], [C.leaf, C.leafSh], [C.pump, C.pumpSh], [C.ochre, C.ochreSh],
    [C.cTop, C.cTopSh], [C.ghost, C.ghostSh], [C.band, C.bandSh], ['#bd5aa6', '#8f3c82'], ['#7d66d8', '#5947ad'],
  ];
  function chunkParts(P, col, i) {
    const r = U.rng(31 + i * 7);
    const pts = [];
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + r.range(-0.2, 0.2); const rr = r.range(1.5, 2.4); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.85]); }
    P.part((c) => blobPath(c, pts, 0.9), col[0], { ol: 0.75, shade: col[1], sh: [-0.6, -0.6] });
  }
  function hitParts(P) {
    P.part((c) => roundPoly(c, starPts(8, 5.6, 2.6, 0, 0, 0.2), 0.4), '#ffffff', { ol: 0.75, shade: '#fff3b5', sh: [-0.7, -0.7] });
  }
  function sparkParts(P) {
    P.part((c) => {
      c.moveTo(0, -3.8); c.quadraticCurveTo(0.45, -0.45, 3.8, 0); c.quadraticCurveTo(0.45, 0.45, 0, 3.8);
      c.quadraticCurveTo(-0.45, 0.45, -3.8, 0); c.quadraticCurveTo(-0.45, -0.45, 0, -3.8); c.closePath();
    }, '#ffffff', { ol: 0.6, shade: '#fff0a0', sh: [-0.4, -0.4] });
  }
  const BFLY_COL = [['#fff6d0', '#f2d77a'], ['#ffd1e4', '#f39cbf'], ['#d4ecff', '#9cc9f2'], ['#fff1a8', '#f5c542']];
  function butterflyParts(P, t) {
    const col = BFLY_COL[t];
    P.part((c) => { E(-2.3, -1.3, 2.4, 1.9, -0.5)(c); E(2.3, -1.3, 2.4, 1.9, 0.5)(c); E(-1.7, 1.2, 1.6, 1.3, 0.4)(c); E(1.7, 1.2, 1.6, 1.3, -0.4)(c); }, col[0], {
      ol: 0.55, shade: col[1], sh: [0, -0.7],
      detail(c) { c.fillStyle = col[1]; c.beginPath(); c.arc(-2.6, -1.5, 0.6, 0, TAU); c.arc(2.6, -1.5, 0.6, 0, TAU); c.fill(); },
    });
    P.part(CAP(0, -2.2, 0, 2.2, 0.55), OUT, { ol: 0.3 });
    P.detail((c) => { c.strokeStyle = OUT; c.lineWidth = 0.35; c.beginPath(); c.moveTo(-0.2, -2.5); c.quadraticCurveTo(-0.8, -3.8, -1.6, -4.0); c.moveTo(0.2, -2.5); c.quadraticCurveTo(0.8, -3.8, 1.6, -4.0); c.stroke(); }, true);
  }
  const CONF_COL = ['#ff6b6b', '#ffd43f', '#62c8ff', '#74e690', '#c38bff', '#ff9e3d'];
  function plainSprite(box, fn) {
    const l = box[0], t = box[1];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((box[2] - l) * K); cv.height = Math.ceil((box[3] - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    fn(ctx);
    return { c: cv, ox: -l * K, oy: -t * K };
  }

  /* ================================================================== props */
  const TREE_COL = [['#7fca5c', '#57a243'], ['#f2a64c', '#d57c36'], ['#a9d65a', '#7fb343'], ['#efc54e', '#d09d36']];
  function treeParts(P, v) {
    if (v === 4) { // round-tier pine
      P.part((c) => roundPoly(c, [[-2.3, 0.5], [-1.8, -14], [1.8, -14], [2.3, 0.5]], 0.9), C.bark, { shade: C.barkSh, sh: [-0.9, 0] });
      const tier = (y, w, h) => P.part((c) => roundPoly(c, [[0, y - h], [w, y], [-w, y]], 2.6), '#4fa564', { shade: '#36804b', sh: [-2.0, -1.4], inner: IL });
      tier(-10, 14, 18); tier(-22, 11.5, 16); tier(-33, 9, 14);
      P.detail((c) => gloss(c, [-4.0, -40.0, 1.6, 0.8, -0.9]));
      return;
    }
    const col = TREE_COL[v];
    P.part((c) => roundPoly(c, [[-3.6, 0.6], [-2.0, -6], [-1.9, -24], [1.9, -24], [2.0, -6], [3.6, 0.6]], 1.0), C.bark, {
      shade: C.barkSh, sh: [-1.1, 0],
      detail(c) { c.strokeStyle = C.barkSh; c.lineWidth = 0.5; c.beginPath(); c.arc(0.4, -10, 0.9, 0, TAU); c.stroke(); },
    });
    const can = [[0, -36.5, 11.5], [-8.8, -33.6, 7.2], [8.8, -34.0, 7.3], [-5.6, -43.4, 7.4], [5.8, -43.8, 7.0], [0.4, -29.8, 7.6]];
    P.part((c) => { for (const q of can) E(q[0], q[1], q[2], q[2])(c); }, col[0], {
      shade: col[1], sh: [-2.8, -2.6],
      detail(c) {
        c.strokeStyle = col[1]; c.lineWidth = 0.75;
        for (const p of [[4.5, -31], [-5.5, -30], [7.5, -40], [-1.0, -36.5], [2.5, -44], [-8, -38.5]]) { c.beginPath(); c.arc(p[0], p[1], 1.6, 0.15 * PI, 0.85 * PI); c.stroke(); }
        if (v === 0) {
          for (const p of [[5.5, -35.5], [-3.5, -42.5], [-7.5, -32.5]]) {
            c.fillStyle = '#ef5a52'; c.strokeStyle = OUT; c.lineWidth = 0.5;
            c.beginPath(); c.arc(p[0], p[1], 1.4, 0, TAU); c.fill(); c.stroke();
            c.fillStyle = '#fff'; c.beginPath(); c.arc(p[0] - 0.45, p[1] - 0.45, 0.4, 0, TAU); c.fill();
          }
        }
      },
      hi: [-6.8, -43.5, 3.3, 1.7, -0.6], hi2: [-3.0, -47.0, 0.8],
    });
  }
  function bushParts(P, v) {
    const cols = [['#73c257', '#4e9a40'], ['#8acb5a', '#61a444'], ['#9ad16a', '#6daa4c']];
    const col = cols[v];
    P.part((c) => { E(-6.4, -6.0, 6.4, 6.0)(c); E(6.0, -5.8, 6.0, 5.6)(c); E(0, -9.6, 7.6, 7.2)(c); E(-0.5, -4.6, 7.0, 4.8)(c); }, col[0], {
      shade: col[1], sh: [-2.1, -2.0],
      detail(c) {
        c.strokeStyle = col[1]; c.lineWidth = 0.7;
        for (const p of [[3.5, -8.0], [-4.0, -6.0], [0.5, -12.5]]) { c.beginPath(); c.arc(p[0], p[1], 1.4, 0.15 * PI, 0.85 * PI); c.stroke(); }
        if (v === 1) {
          for (const p of [[4.6, -10.4], [-2.6, -13.2], [-6.8, -6.8], [7.6, -5.0], [1.0, -6.4]]) {
            c.fillStyle = '#ef5a52'; c.strokeStyle = OUT; c.lineWidth = 0.45;
            c.beginPath(); c.arc(p[0], p[1], 1.15, 0, TAU); c.fill(); c.stroke();
            c.fillStyle = '#fff'; c.beginPath(); c.arc(p[0] - 0.35, p[1] - 0.35, 0.32, 0, TAU); c.fill();
          }
        }
        if (v === 2) {
          for (const p of [[4.2, -10.6], [-3.2, -13.4], [-7.0, -7.0], [7.4, -4.6], [0.6, -6.0]]) {
            c.fillStyle = '#f7b5d0';
            for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; c.beginPath(); c.arc(p[0] + Math.cos(a) * 0.9, p[1] + Math.sin(a) * 0.9, 0.7, 0, TAU); c.fill(); }
            c.fillStyle = '#ffd43f'; c.beginPath(); c.arc(p[0], p[1], 0.5, 0, TAU); c.fill();
          }
        }
      },
      hi: [-4.8, -13.0, 2.2, 1.1, -0.6],
    });
  }
  function rockParts(P, v) {
    const s = [1, 0.66, 1.2][v];
    const pts = [[-8, 0.3], [-9, -3.8], [-6, -8.6], [-0.5, -10.4], [5.6, -9], [8.8, -4.2], [8.2, 0.3]].map((p) => [p[0] * s, p[1] * s]);
    P.part((c) => blobPath(c, pts, 0.8), '#bdb5cd', {
      shade: '#918aa9', sh: [-2.0 * s, -1.8 * s],
      detail(c) { c.strokeStyle = '#918aa9'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(3.0 * s, -8.6 * s); c.lineTo(1.8 * s, -6.4 * s); c.lineTo(3.0 * s, -4.8 * s); c.stroke(); },
      hi: [-4.6 * s, -6.6 * s, 2.0 * s, 0.9 * s, -0.6],
    });
    if (v === 2) {
      P.part((c) => blobPath(c, [[-7.6, -8.4], [-2, -12.6], [5, -11.4], [7.6, -8.4], [3.6, -9.0], [0, -7.6], [-4.0, -8.6]].map((p) => [p[0] * 1.02, p[1] * 1.02]), 0.9), '#8cc65a', {
        shade: '#66a443', sh: [-0.8, -0.8], inner: IL,
      });
    }
  }
  function pumpkinUnit(P, cx, cy, rx, ry) {
    P.part(CAP(cx + 0.1, cy - ry + 1.0, cx + 1.0, cy - ry - 2.4, 1.1), C.stem, { shade: C.stemSh, sh: [-0.4, -0.3] });
    P.part((c) => pumpkinPath(c, cx, cy, rx, ry), C.propPump, {
      shade: C.propPumpSh, sh: [-1.6, -1.4], inner: IL,
      detail(c) { ribs(c, cx, cy, rx, ry, C.propPumpSh, 0.6); },
      hi: [cx - rx * 0.55, cy - ry * 0.45, rx * 0.22, ry * 0.14, -0.6],
    });
  }
  function pumpkinProp(P, v) {
    if (v === 1) pumpkinUnit(P, 8.0, -5.0, 6.0, 4.6);
    P.part((c) => leafPath(c, -3.0, -1.0, -1.6, 7.0, 2.6), C.leaf, { shade: C.leafSh, sh: [-0.5, -0.5], detail: midrib(-3.0, -1.0, -1.6, 7.0, C.leafSh) });
    pumpkinUnit(P, 0, -6.8, 8.8, 6.6);
    P.detail((c) => { c.strokeStyle = C.stemSh; c.lineWidth = 0.6; c.beginPath(); c.arc(2.6, -14.6, 1.2, PI, PI * 2.7); c.stroke(); });
  }
  function mushParts(P, v) {
    const capC = v ? ['#c98a52', '#a4683a'] : ['#ec5b52', '#c03f45'];
    const one = (x, s) => {
      P.part((c) => roundPoly(c, [[x - 1.7 * s, 0.3], [x - 1.3 * s, -6.6 * s], [x + 1.3 * s, -6.6 * s], [x + 1.7 * s, 0.3]], 0.8 * s), '#f6ead2', { shade: '#d9c6a4', sh: [-0.7 * s, 0] });
      P.part((c) => {
        c.moveTo(x - 5.4 * s, -5.8 * s);
        c.bezierCurveTo(x - 5.6 * s, -10.6 * s, x - 2.4 * s, -12.2 * s, x, -12.2 * s);
        c.bezierCurveTo(x + 2.4 * s, -12.2 * s, x + 5.6 * s, -10.6 * s, x + 5.4 * s, -5.8 * s);
        c.quadraticCurveTo(x, -4.2 * s, x - 5.4 * s, -5.8 * s); c.closePath();
      }, capC[0], {
        shade: capC[1], sh: [-1.2 * s, -1.0 * s], inner: IL,
        detail(c) {
          c.fillStyle = '#fff6e6';
          for (const p of [[-2.4, -9.6, 1.0], [1.6, -10.4, 0.8], [3.4, -7.6, 0.7], [-0.4, -7.2, 0.6]]) { c.beginPath(); c.arc(x + p[0] * s, p[1] * s, p[2] * s, 0, TAU); c.fill(); }
        },
        hi: [x - 2.8 * s, -10.6 * s, 1.0 * s, 0.5 * s, -0.7],
      });
    };
    one(-4.0, 0.72); one(2.0, 1.0);
  }
  function fenceParts(P) {
    P.part((c) => rrect(c, -17.5, -11.0, 35, 2.7, 1.0), C.wood, { shade: C.woodSh, sh: [0, -0.8] });
    P.part((c) => rrect(c, -17.5, -6.0, 35, 2.7, 1.0), C.wood, { shade: C.woodSh, sh: [0, -0.8] });
    for (const x of [-14, 0, 14]) {
      P.part((c) => roundPoly(c, [[x - 1.8, 0.4], [x - 1.8, -12.8], [x, -15.0], [x + 1.8, -12.8], [x + 1.8, 0.4]], 0.6), C.wood, {
        shade: C.woodSh, sh: [-1.0, 0], inner: IL,
        detail(c) { c.fillStyle = C.woodSh; c.beginPath(); c.arc(x, -9.6, 0.4, 0, TAU); c.arc(x, -4.6, 0.4, 0, TAU); c.fill(); },
      });
    }
  }
  function signParts(P) {
    P.part((c) => rrect(c, -1.6, -21.5, 3.2, 22.0, 1.0), C.wood, { shade: C.woodSh, sh: [-1.0, 0] });
    P.part((c) => roundPoly(c, [[-9.5, -26.4], [6.0, -26.4], [10.6, -21.8], [6.0, -17.2], [-9.5, -17.2]], 1.2), '#e4b77b', {
      shade: '#c38f56', sh: [-0.9, -1.0], inner: IL,
      detail(c) {
        c.strokeStyle = OUT; c.lineWidth = 0.5;
        c.fillStyle = C.propPump; c.beginPath(); c.ellipse(-3.6, -21.6, 2.6, 2.1, 0, 0, TAU); c.fill(); c.stroke();
        c.strokeStyle = C.stemSh; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3.6, -23.6); c.lineTo(-3.2, -24.8); c.stroke();
        c.strokeStyle = '#9a6a3c'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(0.6, -21.8); c.lineTo(6.2, -21.8); c.moveTo(4.4, -23.6); c.lineTo(6.4, -21.8); c.lineTo(4.4, -20.0); c.stroke();
      },
      hi: [-6.0, -24.6, 1.6, 0.6, 0],
    });
  }
  function hayParts(P) {
    const path = (c) => { c.moveTo(-13, 0.3); c.bezierCurveTo(-13.6, -10, -7, -17.4, 0, -17.4); c.bezierCurveTo(7, -17.4, 13.6, -10, 13, 0.3); c.quadraticCurveTo(0, 1.8, -13, 0.3); c.closePath(); };
    P.part(path, '#f3cf62', {
      shade: '#d6a33c', sh: [-2.4, -2.0],
      detail(c) {
        c.strokeStyle = '#c99434'; c.lineWidth = 0.6;
        const r = U.rng(77);
        for (let i = 0; i < 16; i++) {
          const x = r.range(-10, 10), y = r.range(-14, -2), a = r.range(-0.5, 0.5) + (x > 0 ? 0.35 : -0.35);
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * 2.8, y + Math.cos(a) * 2.8); c.stroke();
        }
        c.strokeStyle = '#fbe9a4';
        for (let i = 0; i < 6; i++) { const x = r.range(-8, 4), y = r.range(-14, -6); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1.2, y + 2.4); c.stroke(); }
      },
      hi: [-6.0, -11.5, 2.4, 1.2, -0.7],
    });
    P.detail((c) => {
      c.strokeStyle = '#d6a33c'; c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(-1, -17); c.lineTo(-2.6, -20.4); c.moveTo(1, -17.2); c.lineTo(1.8, -20.8); c.moveTo(2.6, -16.8); c.lineTo(4.8, -19.4); c.stroke();
    });
  }
  const PROP_DEF = {
    tree: { n: 5, box: [-20, -64, 20, 2], fn: treeParts, sh: [15, 5] },
    bush: { n: 3, box: [-15, -20, 15, 2], fn: bushParts, sh: [12, 3.8] },
    rock: { n: 3, box: [-13, -16, 13, 2], fn: rockParts, sh: [9.5, 3.0] },
    pump: { n: 2, box: [-12, -20, 16, 2], fn: pumpkinProp, sh: [10, 3.2] },
    mush: { n: 2, box: [-10, -15, 9, 2], fn: mushParts, sh: [7, 2.3] },
    fence: { n: 1, box: [-20, -18, 20, 2], fn: fenceParts, sh: [18, 2.6] },
    sign: { n: 1, box: [-12, -29, 13, 2], fn: signParts, sh: [6, 2.0] },
    hay: { n: 1, box: [-16, -23, 16, 3], fn: hayParts, sh: [14, 4.0] },
  };

  /* ================================================================ ground */
  const GSTEP = 4;  // world units between field samples
  const BASE = [158, 198, 113];
  const LAY = [ // bottom -> top
    { fill: [121, 174, 90], rim: [106, 158, 80], rw: 1.7 },   // dark grass
    { fill: [200, 182, 218], rim: [180, 160, 204], rw: 2.0 }, // lilac flower meadow
    { fill: [218, 160, 112], rim: [199, 138, 96], rw: 2.3 },  // clay / autumn rust
    { fill: [235, 211, 160], rim: [216, 186, 133], rw: 2.5 }, // sand clearings + paths
  ];
  const NF = 5;
  function fieldsAt(x, y, out) {
    // large, round, calm regions: low-octave noise, gentle warp only
    const wx = U.perlin(x / 900, y / 900, 701) * 90, wy = U.perlin(x / 900 + 9.2, y / 900, 702) * 90;
    const X = x + wx, Y = y + wy;
    out[0] = U.fbm(X / 520 + 3.3, Y / 520, 101, 2) - 0.6;          // dark grass patches
    out[1] = U.fbm(X / 800 + 13.7, Y / 800, 505, 2) - 0.635;       // lilac flower meadows
    out[2] = U.fbm(X / 1150 - 7.1, Y / 1150, 404, 2) - 0.615;      // autumn clay fields
    const clear = U.fbm(X / 700 + 31.1, Y / 700, 202, 2) - 0.66;   // sandy clearings
    // winding sand paths of even width (zero-contours of low-frequency noise)
    const qx = U.perlin(x / 480, y / 480, 305) * 60, qy = U.perlin(x / 480 + 5.1, y / 480, 306) * 60;
    const pn = U.perlin((x + qx) / 1700, (y + qy) / 1700, 304);
    out[3] = Math.max(clear, (0.0175 - Math.abs(pn)) * 3.0);
    out[4] = 1 + (U.noise(x / 1500, y / 1500, 606) - 0.5) * 0.07;
  }
  const FT = new Float32Array(NF);
  function matAt(x, y) {
    fieldsAt(x, y, FT);
    for (let L = 3; L >= 0; L--) if (FT[L] > 0) return L + 1;
    return 0;
  }
  function matSafe(x, y, r) {
    const m = matAt(x, y);
    if (matAt(x + r, y) !== m || matAt(x - r, y) !== m || matAt(x, y + r) !== m || matAt(x, y - r) !== m) return -1;
    return m;
  }
  const pack = (r, g, b) => (255 << 24) | ((b < 0 ? 0 : b > 255 ? 255 : b | 0) << 16) | ((g < 0 ? 0 : g > 255 ? 255 : g | 0) << 8) | (r < 0 ? 0 : r > 255 ? 255 : r | 0);

  // decals ------------------------------------------------------------------
  const rgbS = (a) => 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')';
  const DEC = {
    tuft0: rgbS([130, 175, 94]), tuft1: rgbS([98, 150, 74]), tuft2: rgbS([170, 150, 192]),
    dot0: rgbS([142, 186, 102]), dot3: rgbS([200, 140, 98]), dot4: rgbS([216, 189, 138]),
  };
  function dTuft(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x - 0.5 * s, y); c.quadraticCurveTo(x - 1.0 * s, y - 1.4 * s, x - 2.1 * s, y - 2.3 * s);
    c.moveTo(x, y); c.quadraticCurveTo(x + 0.15 * s, y - 1.8 * s, x - 0.2 * s, y - 3.3 * s);
    c.moveTo(x + 0.5 * s, y); c.quadraticCurveTo(x + 1.1 * s, y - 1.3 * s, x + 2.1 * s, y - 2.1 * s);
    c.stroke();
  }
  function dFlower(c, x, y, s, petal, center) {
    c.fillStyle = petal;
    c.beginPath();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - PI / 2; const px = x + Math.cos(a) * 0.95 * s, py = y + Math.sin(a) * 0.95 * s; c.moveTo(px + 0.72 * s, py); c.arc(px, py, 0.72 * s, 0, TAU); }
    c.fill();
    c.fillStyle = center; c.beginPath(); c.arc(x, y, 0.55 * s, 0, TAU); c.fill();
  }
  function dDots(c, x, y, rng, col, n, r) {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < n; i++) { const px = x + rng() * 6 - 3, py = y + rng() * 4 - 2, rr = r * (0.6 + rng() * 0.6); c.moveTo(px + rr, py); c.arc(px, py, rr, 0, TAU); }
    c.fill();
  }
  function dPebble(c, x, y, rx, ry, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#b9a588'; c.beginPath(); c.ellipse(0, 0.35, rx + 0.35, ry + 0.35, 0, 0, TAU); c.fill();
    c.fillStyle = '#cdbfae'; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill();
    c.fillStyle = '#ddd2c4'; c.beginPath(); c.ellipse(-rx * 0.2, -ry * 0.25, rx * 0.7, ry * 0.6, 0, 0, TAU); c.fill();
    c.restore();
  }
  function dLeaf(c, x, y, s, a, col, vein) {
    c.fillStyle = col; c.beginPath(); leafPath(c, x, y, a, 3.2 * s, 1.3 * s); c.fill();
    c.strokeStyle = vein; c.lineWidth = 0.35; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * 2.4 * s, y - Math.cos(a) * 2.4 * s); c.stroke();
  }
  const LEAF_COL = [['#c9773f', '#a65a2c'], ['#e3ad5c', '#bf863a'], ['#bf5f3e', '#9a4630']];
  const FLOWER_MEADOW = ['#fbf6e8', '#fbf6e8', '#f8de6c', '#f4b3c8'];
  const FLOWER_LILAC = ['#f3e9fb', '#a98bd4', '#f6bad3', '#a98bd4'];

  function* decals(ctx, info) {
    const pts = [];
    G.scatter(info, 12, 9001, 6, (x, y, rng) => { pts.push(x, y, rng.next(), rng.next(), rng.next(), rng.next()); });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < pts.length; i += 6) {
      if (i % 240 === 234) yield;
      const x = pts[i], y = pts[i + 1], r0 = pts[i + 2], r1 = pts[i + 3], r2 = pts[i + 4];
      const m = matSafe(x, y, 4.5);
      if (m < 0) continue;
      const rr = U.mulberry32(((r1 * 1e9) | 0) ^ 0x5bd1e995);
      if (m === 0) {
        if (r0 < 0.3) dTuft(ctx, x, y, 0.9 + r1 * 0.4, DEC.tuft0);
        else if (r0 < 0.36) dFlower(ctx, x, y, 0.9 + r2 * 0.3, FLOWER_MEADOW[(r1 * 4) | 0], '#f2a23a');
        else if (r0 < 0.4) dDots(ctx, x, y, rr, DEC.dot0, 3, 0.65);
      } else if (m === 1) {
        if (r0 < 0.38) dTuft(ctx, x, y, 0.95 + r1 * 0.45, DEC.tuft1);
        else if (r0 < 0.42) dFlower(ctx, x, y, 0.85, '#fbf6e8', '#f2a23a');
      } else if (m === 2) {
        if (r0 < 0.5) dFlower(ctx, x, y, 0.85 + r2 * 0.35, FLOWER_LILAC[(r1 * 4) | 0], '#f6d36a');
        else if (r0 < 0.62) dTuft(ctx, x, y, 0.85, DEC.tuft2);
      } else if (m === 3) {
        if (r0 < 0.32) { const lc = LEAF_COL[(r1 * 3) | 0]; dLeaf(ctx, x, y, 0.9 + r2 * 0.4, r2 * TAU, lc[0], lc[1]); }
        else if (r0 < 0.4) dDots(ctx, x, y, rr, DEC.dot3, 3, 0.6);
      } else {
        if (r0 < 0.1) dPebble(ctx, x, y, 1.6 + r1 * 1.3, 1.1 + r2 * 0.7, (r1 - 0.5) * 0.8);
        else if (r0 < 0.26) dDots(ctx, x, y, rr, DEC.dot4, 3, 0.6);
      }
    }
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

  // batched flat shadows (one translucent union per frame)
  let shView = null, shPending = false;
  function flushShadows(ctx) {
    if (!shPending) return;
    shPending = false;
    ctx.fillStyle = 'rgba(50,30,72,0.2)';
    ctx.fill();
  }

  // damage-number sprites (cached per value; Lilita One once loaded)
  const numCache = new Map();
  let fontOK = false, fontCheckT = -1;
  function fontReady(rt) {
    if (fontOK) return true;
    if (rt - fontCheckT < 0.5 && fontCheckT >= 0) return false;
    fontCheckT = rt;
    if (document.fonts) {
      document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === 'Lilita One' && f.status === 'loaded') fontOK = true; });
    }
    if (fontOK) numCache.clear();
    return fontOK;
  }
  function numSprite(value, crit, rt) {
    const ok = fontReady(rt);
    const key = value + (crit ? 'c' : 'n') + (ok ? 'L' : 'F');
    let s = numCache.get(key);
    if (s) return s;
    if (numCache.size > 500) numCache.clear();
    const fs = (crit ? 12.5 : 9) * K;
    const font = (ok ? '' : 'bold ') + fs + 'px "Lilita One", "Fredoka", "Arial Rounded MT Bold", sans-serif';
    const meas = U.canvas(4, 4).ctx;
    meas.font = font;
    const txt = String(value);
    const w = Math.ceil(meas.measureText(txt).width + fs * 0.7), h = Math.ceil(fs * 1.55);
    const { c, ctx } = U.canvas(w, h);
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const cx = w / 2, cy = h / 2 - fs * 0.04;
    ctx.strokeStyle = OUT; ctx.lineWidth = fs * 0.3;
    ctx.strokeText(txt, cx, cy + fs * 0.09);
    ctx.fillStyle = OUT; ctx.fillText(txt, cx, cy + fs * 0.09);
    ctx.strokeText(txt, cx, cy);
    if (crit) {
      const g = ctx.createLinearGradient(0, cy - fs * 0.45, 0, cy + fs * 0.4);
      g.addColorStop(0, '#fff27a'); g.addColorStop(0.5, '#ffc93a'); g.addColorStop(1, '#ff8a2a');
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#ffffff';
    ctx.fillText(txt, cx, cy);
    s = { c, ox: w / 2, oy: h / 2 };
    numCache.set(key, s);
    return s;
  }

  /* ================================================================ icons */
  function iconPaint(ctx, fn) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'outline', 2.6));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'fill', 2.6));
  }
  const seedIcon = (P, x, y, a, s) => P.part((c) => { c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s); seedPath(c); c.restore(); }, C.cream, {
    shade: C.creamSh, sh: [-1.2, -1.2],
    detail(c) { c.save(); c.translate(x, y); c.rotate(a); c.scale(s * 0.62, s * 0.55); c.beginPath(); seedPath(c); c.restore(); c.strokeStyle = 'rgba(205,160,92,.85)'; c.lineWidth = 1.2; c.stroke(); },
    hi: [x - Math.cos(a) * s * 1.2 + Math.sin(a) * s * 1.2, y - Math.sin(a) * s * 1.2 - Math.cos(a) * s * 1.2, s * 1.3, s * 0.55, a],
  });
  const sparkIcon = (P, x, y, r) => P.part((c) => {
    c.moveTo(x, y - r); c.quadraticCurveTo(x + r * 0.14, y - r * 0.14, x + r, y); c.quadraticCurveTo(x + r * 0.14, y + r * 0.14, x, y + r);
    c.quadraticCurveTo(x - r * 0.14, y + r * 0.14, x - r, y); c.quadraticCurveTo(x - r * 0.14, y - r * 0.14, x, y - r); c.closePath();
  }, '#ffd43f', { ol: 1.6, shade: '#f39a1e', sh: [-1, -1] });
  const ICONS = {
    'hp-heart'(P) {
      P.part((c) => {
        c.moveTo(24, 42); c.bezierCurveTo(10, 33, 4.5, 25, 4.5, 17); c.bezierCurveTo(4.5, 10, 9.5, 5.5, 15.5, 5.5);
        c.bezierCurveTo(19.5, 5.5, 22.5, 8, 24, 11.5); c.bezierCurveTo(25.5, 8, 28.5, 5.5, 32.5, 5.5);
        c.bezierCurveTo(38.5, 5.5, 43.5, 10, 43.5, 17); c.bezierCurveTo(43.5, 25, 38, 33, 24, 42); c.closePath();
      }, '#ff5d6c', { shade: '#d73a55', sh: [-3, -3], hi: [13.5, 13, 4.2, 2.4, -0.7], hi2: [19.5, 9.5, 1.2] });
    },
    kills(P) {
      const col = { top: '#9b5cd0', topSh: '#7241aa', bot: '#f8eacb', botSh: '#e0c595' };
      P.part((c) => leafPath(c, 24, 13, -0.7, 10, 3.6), C.leaf, { shade: C.leafSh, sh: [-1, -1] });
      P.part((c) => leafPath(c, 24, 13, 0.7, 10, 3.6), C.leaf, { shade: C.leafSh, sh: [-1, -1] });
      P.part((c) => leafPath(c, 24, 13, 0, 11.5, 4), C.leaf, { shade: C.leafSh, sh: [-1, -1] });
      P.part((c) => turnipPath(c, 24, 11, 44, 16), (c, sh) => {
        c.fillStyle = sh ? col.botSh : col.bot; c.fillRect(-99, -99, 300, 300);
        c.fillStyle = sh ? col.topSh : col.top; c.beginPath(); c.moveTo(-10, -10); c.lineTo(60, -10); c.lineTo(60, 28);
        for (let x = 60; x >= -10; x -= 1) c.lineTo(x, 28 + 1.6 * Math.sin(x * 0.5)); c.closePath(); c.fill();
      }, { sh: [-3, -2.6], hi: [15, 20, 3.4, 1.8, -0.7] });
      P.detail((c) => {
        c.strokeStyle = OUT; c.lineWidth = 2.6; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(15.5, 22); c.lineTo(20.5, 27); c.moveTo(20.5, 22); c.lineTo(15.5, 27);
        c.moveTo(27.5, 22); c.lineTo(32.5, 27); c.moveTo(32.5, 22); c.lineTo(27.5, 27);
        c.stroke();
        c.lineWidth = 2.2; c.beginPath(); c.moveTo(19, 35); c.quadraticCurveTo(21.5, 32.5, 24, 35); c.quadraticCurveTo(26.5, 37.5, 29, 35); c.stroke();
      });
    },
    dmg(P) {
      sparkIcon(P, 36, 11, 7.5);
      seedIcon(P, 21, 27, -0.75, 3.6);
      sparkIcon(P, 40, 26, 4.2);
      P.detail((c) => { c.strokeStyle = '#ff5d6c'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(8, 9); c.lineTo(12, 13); c.moveTo(6, 17); c.lineTo(11, 17.5); c.moveTo(14, 6); c.lineTo(15, 11); c.stroke(); });
    },
    rate(P) {
      P.part((c) => roundPoly(c, [[27, 3], [11, 26], [22, 26], [17, 45], [37, 19], [26, 19], [32, 3]], 1.4), '#ffd43f', { shade: '#f39a1e', sh: [-2.4, -2.4], hi: [24, 9, 2.4, 1.1, -1.0] });
      P.detail((c) => { c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.globalAlpha = 0.95; c.beginPath(); c.moveTo(4, 34); c.lineTo(11, 34); c.moveTo(6, 40); c.lineTo(13, 40); c.moveTo(39, 30); c.lineTo(45, 30); c.stroke(); });
    },
    multi(P) {
      seedIcon(P, 17, 12, -1.9, 2.6);
      seedIcon(P, 31, 11, -1.2, 2.6);
      seedIcon(P, 24, 9, -1.55, 2.8);
      P.part((c) => { c.moveTo(12, 17); c.bezierCurveTo(3, 24, 4, 44, 24, 44); c.bezierCurveTo(44, 44, 45, 24, 36, 17); c.closePath(); }, '#ff952b', {
        shade: '#ea681c', sh: [-3, -2.6],
        detail(c) { c.strokeStyle = '#ea681c'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(17, 22); c.quadraticCurveTo(13, 32, 17, 42); c.moveTo(31, 22); c.quadraticCurveTo(35, 32, 31, 42); c.stroke(); },
        hi: [13.5, 27, 2.2, 3.4, 0.2],
      });
      P.part((c) => rrect(c, 9.5, 14.5, 29, 6.5, 3), '#8ad04c', { shade: '#5ea83a', sh: [-1, -1.4], inner: 1.2 });
      P.part(E(24, 17.8, 3.2, 3.0), '#ffd43f', { shade: '#f39a1e', sh: [-0.8, -0.8], inner: 1.2 });
    },
    bounce(P) {
      P.detail((c) => { c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.setLineDash([3.5, 4.5]); c.beginPath(); c.moveTo(5, 40); c.quadraticCurveTo(12, 6, 24, 15); c.stroke(); c.setLineDash([]); });
      P.part((c) => rrect(c, 10, 39, 28, 6, 3), '#5f6f94', { shade: '#45527a', sh: [0, -1.4] });
      P.part((c) => {
        for (let i = 0; i < 4; i++) { const y = 37 - i * 4.6; c.moveTo(13, y); c.ellipse(24, y, 11, 2.2, 0, PI, TAU); c.ellipse(24, y, 11, 2.2, 0, 0, PI); }
      }, '#46c4b4', { ol: 2.0, shade: '#2c9688', sh: [-1, -1] });
      seedIcon(P, 26, 15, -1.25, 3.0);
      sparkIcon(P, 39, 8, 4.8);
    },
    lantern(P) {
      const c = P.ctx;
      c.save(); c.translate(24, 44); c.scale(2.35, 2.35);
      const sub = new Painter(c, P.mode, 2.6 / 2.35);
      lanternParts(sub);
      c.restore();
      if (P.mode === 'fill') { c.save(); c.globalCompositeOperation = 'destination-over'; const g = c.createRadialGradient(24, 26, 2, 24, 26, 24); g.addColorStop(0, 'rgba(255,214,90,0.85)'); g.addColorStop(1, 'rgba(255,214,90,0)'); c.fillStyle = g; c.fillRect(0, 0, 48, 48); c.restore(); }
    },
    speed(P) {
      P.detail((c) => { c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(2, 22); c.lineTo(9, 22); c.moveTo(3, 29); c.lineTo(8, 29); c.stroke(); });
      P.part((c) => { c.moveTo(11, 33); c.bezierCurveTo(10, 24, 20, 21, 26, 24); c.bezierCurveTo(31, 26, 34, 29, 42, 30); c.bezierCurveTo(46, 31, 46, 37, 42, 37); c.lineTo(15, 37); c.lineTo(15, 42); c.lineTo(11, 42); c.closePath(); }, '#8fe3f2', {
        shade: '#4fb6d6', sh: [-2, -2],
        detail(c) { c.fillStyle = '#5ac1dc'; c.beginPath(); c.ellipse(21, 27, 5.5, 2.2, 0.15, 0, TAU); c.fill(); },
        hi: [16, 28, 2.2, 1.0, -0.8], hi2: [36, 31.5, 1.0],
      });
      P.part(E(26, 23.5, 3.2, 2.4), '#ff8fb4', { shade: '#e4628f', sh: [-0.8, -0.8], inner: 1.2 });
      sparkIcon(P, 37, 12, 6);
      sparkIcon(P, 13, 11, 3.4);
    },
    magnet(P) {
      P.detail((c) => { c.strokeStyle = OUT; c.lineWidth = 6.6; c.beginPath(); c.arc(24, 24, 14, PI * 1.08, PI * 1.92); c.stroke(); c.strokeStyle = '#c98a4e'; c.lineWidth = 3.2; c.beginPath(); c.arc(24, 24, 14, PI * 1.08, PI * 1.92); c.stroke(); }, true);
      P.part(E(17, 22, 5.5, 5), '#74e690', { shade: '#2fae66', sh: [-1, -1], hi: [15, 20, 1.6, 0.9, -0.6] });
      pumpkinIcon(P, 29, 21, 7, 5.6);
      P.part((c) => { c.moveTo(5, 24); c.lineTo(43, 24); c.lineTo(38, 43); c.lineTo(10, 43); c.closePath(); }, '#d69a5a', {
        shade: '#ad7038', sh: [-2.4, -2.2],
        detail(c) {
          c.strokeStyle = '#ad7038'; c.lineWidth = 1.4;
          c.beginPath(); for (let y = 29; y < 43; y += 5) { c.moveTo(4, y); c.lineTo(44, y); } c.stroke();
          c.beginPath(); for (let x = 9; x < 42; x += 6) { c.moveTo(x, 24); c.lineTo(x + (24 - x) * 0.15, 44); } c.stroke();
        },
      });
      P.part((c) => rrect(c, 3, 21.5, 42, 5, 2.5), '#e8b072', { shade: '#c38450', sh: [0, -1.2], inner: 1.2 });
    },
    hp(P) {
      P.detail((c) => {
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.globalAlpha = 0.95;
        c.beginPath(); c.moveTo(17, 14); c.bezierCurveTo(13, 10, 21, 7, 17, 2); c.moveTo(28, 14); c.bezierCurveTo(24, 10, 32, 7, 28, 2); c.stroke();
      });
      P.part((c) => rrect(c, 3, 18, 6, 5, 2), '#5f6f94', { shade: '#45527a', sh: [0, -1] });
      P.part((c) => rrect(c, 39, 18, 6, 5, 2), '#5f6f94', { shade: '#45527a', sh: [0, -1] });
      P.part((c) => { c.moveTo(6, 17); c.lineTo(42, 17); c.bezierCurveTo(43, 38, 38, 44, 24, 44); c.bezierCurveTo(10, 44, 5, 38, 6, 17); c.closePath(); }, '#6f80a8', {
        shade: '#4c5a82', sh: [-3, -2.4], hi: [12, 25, 1.8, 4, 0.1],
      });
      P.part(E(24, 17.5, 18, 4.2), '#ff9a3c', {
        shade: '#e8742a', sh: [0, 1.2], inner: 1.2,
        detail(c) { c.fillStyle = '#9b5cd0'; c.beginPath(); c.arc(17, 17, 2.6, 0, TAU); c.fill(); c.fillStyle = '#f8eacb'; c.beginPath(); c.arc(29, 18, 2.3, 0, TAU); c.fill(); c.fillStyle = '#8ad04c'; c.beginPath(); c.arc(23.5, 16, 1.6, 0, TAU); c.fill(); },
      });
    },
  };
  function pumpkinIcon(P, cx, cy, rx, ry) {
    P.part(CAP(cx, cy - ry + 1, cx + 1.2, cy - ry - 3, 1.5), C.stem, { shade: C.stemSh, sh: [-0.6, -0.4] });
    P.part((c) => pumpkinPath(c, cx, cy, rx, ry), C.pump, { shade: C.pumpSh, sh: [-1.6, -1.4], detail(c) { ribs(c, cx, cy, rx, ry, C.pumpSh, 1.0); }, hi: [cx - rx * 0.5, cy - ry * 0.4, 1.6, 0.9, -0.6] });
  }

  /* ================================================================== CSS */
  function tso(w, col, drop) {
    const a = [];
    for (let i = 0; i < 16; i++) { const t = (i / 16) * TAU; a.push((Math.cos(t) * w).toFixed(1) + 'px ' + (Math.sin(t) * w).toFixed(1) + 'px 0 ' + col); }
    if (drop) { a.push('0 ' + (w + drop) + 'px 0 ' + col); a.push(w * 0.7 + 'px ' + (w * 0.7 + drop) + 'px 0 ' + col); a.push(-w * 0.7 + 'px ' + (w * 0.7 + drop) + 'px 0 ' + col); }
    return a.join(',');
  }
  const P_ = '#3a2240';
  const CSS = `
body.style-cartoon { font-family: 'Fredoka', 'Baloo 2', system-ui, sans-serif; }
body.style-cartoon #hud { padding: 14px 22px; }
body.style-cartoon #hud .xp { height: 26px; background: #563a5e; border: 4px solid ${P_}; border-radius: 15px; box-shadow: 0 4px 0 ${P_}, inset 0 4px 0 rgba(0,0,0,.22); overflow: hidden; }
body.style-cartoon #hud .xp-fill { background: linear-gradient(180deg, #9af7d8 0%, #45d6ad 50%, #2cb892 100%); border-radius: 0 11px 11px 0; box-shadow: inset 0 -3px 0 rgba(0,0,0,.12); }
body.style-cartoon #hud .xp-fill::after { content: ''; position: absolute; left: 8px; right: 10px; top: 3px; height: 4px; border-radius: 3px; background: rgba(255,255,255,.62); }
body.style-cartoon #hud .lvl { right: 12px; font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 18px; letter-spacing: .5px; color: #fff; text-shadow: ${tso(2, P_)}; }
body.style-cartoon #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 14px; }
body.style-cartoon #hud .hp { position: relative; gap: 6px; justify-self: start; }
body.style-cartoon #hud .hp-icon, body.style-cartoon #hud .kills-icon { width: 46px; height: 46px; filter: drop-shadow(0 3px 0 rgba(58,34,64,.35)); }
body.style-cartoon #hud .hp-bar { width: 260px; height: 32px; background: #563a5e; border: 4px solid ${P_}; border-radius: 17px; box-shadow: 0 4px 0 ${P_}, inset 0 4px 0 rgba(0,0,0,.25); }
body.style-cartoon #hud .hp-fill { background: linear-gradient(180deg, #ff9a9a 0%, #ff5466 48%, #df3550 100%); border-radius: 0 13px 13px 0; box-shadow: inset 0 -3px 0 rgba(0,0,0,.12); }
body.style-cartoon #hud .hp-fill::after { content: ''; position: absolute; left: 9px; right: 12px; top: 4px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.55); }
body.style-cartoon #hud .hp-text { position: absolute; left: 52px; width: 260px; top: 50%; transform: translateY(-50%); text-align: center; font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 18px; letter-spacing: .5px; color: #fff; text-shadow: ${tso(2, P_)}; }
body.style-cartoon.hurt #hud .hp { animation: cartoonShake .22s linear; }
@keyframes cartoonShake { 0%,100% { transform: none } 25% { transform: translate(-3px,1px) rotate(-1deg) } 75% { transform: translate(3px,-1px) rotate(1deg) } }
body.style-cartoon #hud .clock { justify-self: center; background: #fff4de; border: 4px solid ${P_}; border-radius: 20px; padding: 2px 24px 7px; box-shadow: 0 5px 0 ${P_}; margin-top: -4px; }
body.style-cartoon #hud .clock-time { font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 36px; line-height: 1.1; letter-spacing: 1.5px; color: #ff8a2a; text-shadow: ${tso(2.5, P_, 2)}; }
body.style-cartoon #hud .clock-label { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 12px; letter-spacing: 1.6px; opacity: 1; color: #8a6280; }
body.style-cartoon #hud .kills { justify-self: end; min-width: 0; gap: 4px; padding: 2px 18px 2px 6px; background: #fff4de; border: 4px solid ${P_}; border-radius: 20px; box-shadow: 0 5px 0 ${P_}; font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 26px; color: ${P_}; text-shadow: none; }
body.style-cartoon #hud .kills-icon { width: 42px; height: 42px; filter: none; }
body.style-cartoon #stylebar { background: #fff4de; color: ${P_}; border: 4px solid ${P_}; box-shadow: 0 4px 0 ${P_}; padding: 5px 20px; font-family: 'Fredoka', sans-serif; font-weight: 600; gap: 14px; bottom: 14px; }
body.style-cartoon #stylebar .style-family { color: #9a7090; opacity: 1; font-weight: 700; }
body.style-cartoon #stylebar .style-name { font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 20px; letter-spacing: .5px; color: #ff8a2a; text-shadow: ${tso(2, P_)}; }
body.style-cartoon #stylebar .style-hint { opacity: .8; }
body.style-cartoon #stylebar .auto.on { color: #24a882; }
body.style-cartoon #levelup { gap: 30px; background:
  radial-gradient(ellipse at 50% 42%, rgba(255,214,120,.28), rgba(255,214,120,0) 60%),
  repeating-conic-gradient(from 0deg at 50% 40%, rgba(255,238,200,.09) 0deg 9deg, rgba(255,238,200,0) 9deg 18deg),
  rgba(72,36,104,.6); -webkit-backdrop-filter: saturate(.2) brightness(.78); backdrop-filter: saturate(.2) brightness(.78); }
body.style-cartoon #levelup .lu-title { font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 78px; letter-spacing: 3px; color: #ffd43f; text-shadow: ${tso(5, P_, 5)}; transform: rotate(-3deg); animation: cartoonPop .55s cubic-bezier(.3,1.7,.5,1) backwards; }
@keyframes cartoonPop { from { transform: scale(.2) rotate(-14deg); } to { transform: scale(1) rotate(-3deg); } }
body.style-cartoon #levelup .lu-cards { gap: 26px; }
body.style-cartoon #levelup .card { width: 236px; min-height: 304px; padding: 0 18px 24px; gap: 8px; color: ${P_};
  background: linear-gradient(180deg, #ffd27f 0, #ffb24c 92px, #fff6e4 92px); border: 5px solid ${P_}; border-radius: 28px;
  box-shadow: 0 9px 0 ${P_}, 0 18px 30px rgba(20,8,30,.35); transition: transform .14s cubic-bezier(.3,1.6,.5,1); animation: cartoonCard .5s cubic-bezier(.3,1.5,.5,1) backwards; }
body.style-cartoon #levelup .card:nth-child(2) { animation-delay: .07s; background: linear-gradient(180deg, #9af0d6 0, #45d0aa 92px, #fff6e4 92px); }
body.style-cartoon #levelup .card:nth-child(3) { animation-delay: .14s; background: linear-gradient(180deg, #d4b6ff 0, #a982ea 92px, #fff6e4 92px); }
@keyframes cartoonCard { from { transform: translateY(60px) scale(.7); opacity: 0; } to { transform: none; opacity: 1; } }
body.style-cartoon #levelup .card:hover { transform: translateY(-10px) rotate(-1.5deg) scale(1.03); }
body.style-cartoon #levelup .card-icon { width: 124px; height: 124px; margin-top: 26px; padding: 9px; background: radial-gradient(circle at 38% 32%, #ffffff, #fff1d2 65%, #ffe2a8); border: 5px solid ${P_}; border-radius: 50%; box-shadow: 0 5px 0 ${P_}; }
body.style-cartoon #levelup .card-name { margin-top: 6px; font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 25px; letter-spacing: .5px; line-height: 1.1; color: ${P_}; }
body.style-cartoon #levelup .card-desc { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 17px; line-height: 1.25; opacity: 1; color: #7d5975; }
body.style-cartoon #levelup .card-key { top: 12px; left: 14px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #fff6e4; border: 4px solid ${P_}; font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 17px; opacity: 1; color: ${P_}; }
body.style-cartoon #levelup .lu-hint { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 17px; opacity: 1; color: #fff4de; text-shadow: ${tso(2, P_)}; }
body.style-cartoon #gameover { background: radial-gradient(ellipse at 50% 46%, rgba(120,70,170,.0) 0%, rgba(40,18,58,.55) 75%), rgba(70,40,105,.5); -webkit-backdrop-filter: grayscale(1) brightness(.62) blur(2px); backdrop-filter: grayscale(1) brightness(.62) blur(2px); gap: 18px; }
body.style-cartoon #gameover .go-title { font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 80px; color: #ff8a2a; letter-spacing: 2px; text-shadow: ${tso(5, P_, 5)}; transform: rotate(-2deg); }
body.style-cartoon #gameover .go-stats { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 20px; opacity: 1; color: ${P_}; background: #fff4de; border: 4px solid ${P_}; border-radius: 20px; padding: 10px 24px; box-shadow: 0 5px 0 ${P_}; }
body.style-cartoon #gameover .go-hint { font-family: 'Lilita One', 'Fredoka', sans-serif; font-size: 22px; opacity: 1; color: #fff4de; background: #ff8a2a; border: 4px solid ${P_}; border-radius: 999px; padding: 6px 22px; box-shadow: 0 5px 0 ${P_}; text-shadow: ${tso(2, P_)}; }
body.style-cartoon #pausebox { font-family: 'Lilita One', 'Fredoka', sans-serif; font-weight: 400; font-size: 72px; color: #ffd43f; text-shadow: ${tso(4, P_, 4)}; }
`;

  /* ============================================================== particles */
  function puff(game, x, y, z, tint, size, vx, vy, life, rise) {
    return game.addParticle({ kind: 'puff', x, y, z, vx, vy, drag: 5, life, size, tint, rise: rise || 6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 2 });
  }

  /* ================================================================ style */
  let lastHop = -1;
  Styles.register({
    id: 'cartoon',
    name: 'Brotato-Cartoon',
    family: 'Vektor · Cartoon',
    description: 'Knallbunter HD-Cartoon mit dicken Pflaumen-Konturen, Cel-Shading, Glanzpunkten und viel Squash & Stretch.',
    groundColor: '#9ec671',
    groundResMax: 3,
    chunkSize: 256,
    fonts: ['Lilita+One', 'Fredoka:wght@400;500;600;700'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = Math.max(3, Math.min(6, Math.round(S * 1.25)));
      SPR.jack = []; SPR.jackHurt = [];
      for (let f = 0; f < 4; f++) {
        SPR.jack.push(set4([-15, -34, 15, 2.5], (P) => jackParts(P, f, false)));
        SPR.jackHurt.push(set4([-15, -34, 15, 2.5], (P) => jackParts(P, f, true)));
      }
      SPR.creep = [0, 1, 2].map((v) => [0, 1, 2, 3].map((f) => set4([-14, -32, 14, 2.5], (P) => creeperParts(P, f, v))));
      SPR.ghost = [0, 1, 2, 3].map((f) => set4([-15, -28, 14, 2.5], (P) => ghostParts(P, f), ghostFade));
      SPR.colo = [0, 1, 2, 3].map((f) => set4([-28, -68, 29, 3], (P) => colossusParts(P, f)));
      SPR.lantern = build([-9.5, -22, 9.5, 3], lanternParts);
      SPR.gemS = build([-5, -7.5, 5, 2], (P) => gemParts(P, false));
      SPR.gemB = build([-7, -10.5, 7, 2.5], (P) => gemParts(P, true));
      SPR.seed = build([-5.5, -4.6, 6.2, 4.6], seedParts);
      SPR.streak = plainSprite([-18, -3.2, -2, 3.2], (c) => {
        const g = c.createLinearGradient(-3, 0, -17, 0);
        g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.strokeStyle = g; c.lineCap = 'round';
        c.lineWidth = 1.0; c.beginPath(); c.moveTo(-3.5, 0); c.lineTo(-16.5, 0); c.stroke();
        c.lineWidth = 0.75; c.beginPath(); c.moveTo(-4.5, -2.0); c.lineTo(-12.5, -2.0); c.moveTo(-4.5, 2.0); c.lineTo(-11.5, 2.0); c.stroke();
      });
      SPR.puff = PUFF_COL.map((_, t) => build([-9, -7.5, 9, 7.5], (P) => puffParts(P, t)));
      SPR.star = STAR_COL.map((_, t) => build([-6, -6, 6, 6], (P) => starParts(P, t)));
      SPR.chunk = CHUNK_COL.map((cc, i) => build([-4, -4, 4, 4], (P) => chunkParts(P, cc, i)));
      SPR.hit = build([-7.5, -7.5, 7.5, 7.5], hitParts);
      SPR.spark = build([-5, -5, 5, 5], sparkParts);
      SPR.conf = CONF_COL.map((col) => build([-2.6, -2, 2.6, 2], (P) => P.part((c) => rrect(c, -1.6, -0.85, 3.2, 1.7, 0.5), col, { ol: 0.45 })));
      SPR.bfly = BFLY_COL.map((_, t) => build([-5.5, -5, 5.5, 4], (P) => butterflyParts(P, t)));
      SPR.shadow = plainSprite([-4, -1.6, 4, 1.6], (c) => { c.fillStyle = 'rgba(50,30,72,0.22)'; c.beginPath(); c.ellipse(0, 0, 3.6, 1.35, 0, 0, TAU); c.fill(); });
      SPR.glow = plainSprite([-18, -18, 18, 18], (c) => {
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 18);
        g.addColorStop(0, 'rgba(255,226,120,0.75)'); g.addColorStop(0.35, 'rgba(255,196,80,0.32)'); g.addColorStop(1, 'rgba(255,170,60,0)');
        c.fillStyle = g; c.fillRect(-18, -18, 36, 36);
      });
      SPR.props = {};
      for (const t in PROP_DEF) {
        const d = PROP_DEF[t];
        SPR.props[t] = [];
        for (let v = 0; v < d.n; v++) SPR.props[t].push(withFlip(build(d.box, (P) => d.fn(P, v))));
      }
      if (document.fonts && document.fonts.load) { try { document.fonts.load('20px "Lilita One"', '0123456789'); } catch (e) { /* ignore */ } }
    },

    /* ------------------------------------------------------------ ground */
    *renderGroundChunk(ctx, info) {
      const res = info.res, Wp = info.px;
      const cpx = GSTEP * res;
      const nc = Math.ceil(Wp / cpx - 1e-6);
      const nn = nc + 1;
      const F = new Float32Array(nn * nn * NF);
      const tmp = new Float32Array(NF);
      for (let j = 0; j < nn; j++) {
        const y = info.wy + j * GSTEP;
        for (let i = 0; i < nn; i++) {
          fieldsAt(info.wx + i * GSTEP, y, tmp);
          const o = (j * nn + i) * NF;
          for (let k = 0; k < NF; k++) F[o + k] = tmp[k];
        }
        if ((j & 7) === 7) yield;
      }
      const cs = new Int32Array(nc + 1);
      for (let i = 0; i <= nc; i++) cs[i] = Math.max(0, Math.min(Wp, Math.ceil(i * cpx - 0.5)));
      const img = ctx.createImageData(Wp, Wp);
      const buf = new Uint32Array(img.data.buffer);
      const rimPx = LAY.map((l) => l.rw * res);
      const st = new Int8Array(4);
      for (let gy = 0; gy < nc; gy++) {
        for (let gx = 0; gx < nc; gx++) {
          const o00 = (gy * nn + gx) * NF, o10 = o00 + NF, o01 = o00 + nn * NF, o11 = o01 + NF;
          const tint = (F[o00 + 4] + F[o10 + 4] + F[o01 + 4] + F[o11 + 4]) * 0.25;
          for (let L = 0; L < 4; L++) {
            const a = F[o00 + L], b = F[o10 + L], c = F[o01 + L], d = F[o11 + L];
            const mn = Math.min(a, b, c, d), mx = Math.max(a, b, c, d);
            const gxm = Math.max(Math.abs(b - a), Math.abs(d - c)), gym = Math.max(Math.abs(c - a), Math.abs(d - b));
            const g = Math.sqrt(gxm * gxm + gym * gym) / cpx + 1e-9;
            st[L] = mx < 0 && mx / g < -1.5 ? 0 : mn > 0 && mn / g > rimPx[L] + 1.5 ? 2 : 1;
          }
          let start = -1;
          for (let L = 3; L >= 0; L--) if (st[L] === 2) { start = L; break; }
          let needPix = false;
          for (let L = start + 1; L < 4; L++) if (st[L] === 1) { needPix = true; break; }
          const x0 = cs[gx], x1 = cs[gx + 1], y0 = cs[gy], y1 = cs[gy + 1];
          const base = start < 0 ? BASE : LAY[start].fill;
          if (!needPix) {
            const px = pack(base[0] * tint, base[1] * tint, base[2] * tint);
            for (let py = y0; py < y1; py++) buf.fill(px, py * Wp + x0, py * Wp + x1);
            continue;
          }
          for (let py = y0; py < y1; py++) {
            const v = (py + 0.5) / cpx - gy;
            for (let px = x0; px < x1; px++) {
              const u = (px + 0.5) / cpx - gx;
              let r = base[0], g = base[1], b = base[2];
              for (let L = start + 1; L < 4; L++) {
                if (st[L] === 0) continue;
                const A = F[o00 + L], B = F[o10 + L], Cc = F[o01 + L], D = F[o11 + L];
                const s0 = A + (B - A) * u, s1 = Cc + (D - Cc) * u;
                const s = s0 + (s1 - s0) * v;
                const du = (B - A) * (1 - v) + (D - Cc) * v, dv = (Cc - A) * (1 - u) + (D - B) * u;
                const gl = Math.sqrt(du * du + dv * dv) / cpx;
                const dist = gl > 1e-9 ? s / gl : s > 0 ? 99 : -99;
                let cov = dist + 0.5;
                if (cov <= 0) continue;
                if (cov > 1) cov = 1;
                const lay = LAY[L];
                let rm = rimPx[L] - dist + 0.5;
                rm = rm < 0 ? 0 : rm > 1 ? 1 : rm;
                const lr = lay.fill[0] + (lay.rim[0] - lay.fill[0]) * rm;
                const lg = lay.fill[1] + (lay.rim[1] - lay.fill[1]) * rm;
                const lb = lay.fill[2] + (lay.rim[2] - lay.fill[2]) * rm;
                r += (lr - r) * cov; g += (lg - g) * cov; b += (lb - b) * cov;
              }
              buf[py * Wp + px] = pack(r * tint, g * tint, b * tint);
            }
          }
        }
        if ((gy & 3) === 3) yield;
      }
      ctx.putImageData(img, 0, 0);
      yield;
      yield* decals(ctx, info);
    },

    propsForChunk(info) {
      const out = [];
      G.scatterOwned(info, 82, 4242, (x, y, rng) => {
        if (G.nearSpawn(x, y, 95)) return;
        const r = rng.next();
        const m = matAt(x, y);
        let t = null, v = 0;
        const vr = rng.next();
        if (m === 0) {
          if (r < 0.11) { t = 'tree'; v = vr < 0.45 ? 0 : vr < 0.8 ? 2 : 4; }
          else if (r < 0.24) { t = 'bush'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.29) { t = 'rock'; v = (vr * 3) | 0; }
          else if (r < 0.32) { t = 'mush'; v = 0; }
          else if (r < 0.35) t = 'fence';
          else if (r < 0.365) t = 'sign';
        } else if (m === 1) {
          if (r < 0.17) { t = 'tree'; v = vr < 0.5 ? 4 : 0; }
          else if (r < 0.31) { t = 'bush'; v = vr < 0.6 ? 0 : 1; }
          else if (r < 0.37) { t = 'mush'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.40) { t = 'rock'; v = 2; }
        } else if (m === 2) {
          if (r < 0.14) { t = 'bush'; v = 2; }
          else if (r < 0.2) { t = 'tree'; v = 2; }
          else if (r < 0.23) { t = 'rock'; v = 1; }
        } else if (m === 3) {
          if (r < 0.13) { t = 'pump'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.25) { t = 'tree'; v = vr < 0.6 ? 1 : 3; }
          else if (r < 0.32) t = 'hay';
          else if (r < 0.35) t = 'fence';
          else if (r < 0.37) { t = 'mush'; v = 1; }
        } else {
          if (r < 0.08) { t = 'rock'; v = vr < 0.5 ? 0 : 1; }
          else if (r < 0.12) t = 'hay';
          else if (r < 0.16) t = 'sign';
          else if (r < 0.18) t = 'fence';
        }
        if (!t) return;
        out.push({ x, y, t, v, f: rng.chance(0.5), sw: rng.next() * TAU, pad: t === 'tree' ? 70 : 30 });
      });
      return out;
    },

    drawProp(ctx, p, view) {
      if (shPending) flushShadows(ctx);
      const s = SPR.props[p.t][p.v];
      const spr = p.f ? s.l : s.n;
      if (p.t === 'tree' || p.t === 'bush') {
        // gentle breeze: skew around the base
        const V = tf(view);
        const k = Math.sin(view.rt * 1.3 + p.sw) * (p.t === 'tree' ? 0.025 : 0.035);
        const S = V.S;
        ctx.setTransform(S, 0, -k * S, S, V.ox + p.x * S, V.oy + p.y * S);
        const q = 1 / K;
        ctx.drawImage(spr.c, -spr.ox * q, -spr.oy * q, spr.c.width * q, spr.c.height * q);
        ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
      } else blit(ctx, spr, p.x, p.y, 1, 1);
    },

    drawShadow(ctx, o, view) {
      if (shView !== view) { shView = view; ctx.beginPath(); shPending = false; }
      let rx, ry, x = o.x, y = o.y;
      if (o.kind === 'prop') { const d = PROP_DEF[o.t]; rx = d.sh[0]; ry = d.sh[1]; if (o.t === 'tree' && o.v !== 4) { rx = 16; ry = 5.2; } }
      else if (o.kind === 'enemy') {
        let k = 1;
        if (o.dying) { if (o.deathT > 0.4) return; k = 1 - o.deathT / 0.4; }
        if (o.spawnT < 1) k *= U.clamp(o.spawnT * 2.5 - 0.3, 0, 1);
        if (k <= 0.02) return;
        if (o.type === 'ghost') { rx = 5.8 * k; ry = 2.1 * k; }
        else if (o.type === 'colossus') { rx = 18.5 * k; ry = 5.8 * k; }
        else { rx = 8.6 * k * CREEP_SCALE; ry = 3.1 * k * CREEP_SCALE; }
      } else {
        const h = o.moving ? Math.sin(((o.anim * 0.42) % 1) * PI) : 0;
        rx = (8.4 - h * 1.4) * JACK_SCALE; ry = (3.0 - h * 0.45) * JACK_SCALE;
      }
      ctx.moveTo(x + rx, y); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
      shPending = true;
    },

    drawGroundOverlay(ctx, view, game) {
      // spawn holes (dirt rim + dark hole) + the dirt-pop particles
      for (const e of game.enemies) {
        if (e.dying || e.spawnT >= 1) { e._popd = false; continue; }
        if (e.x < view.x0 - 40 || e.x > view.x1 + 40 || e.y < view.y0 - 20 || e.y > view.y1 + 60) continue;
        const ghost = e.type === 'ghost';
        if (!e._popd && game.state === 'play') {
          e._popd = true;
          const n = ghost ? 2 : e.type === 'colossus' ? 6 : 3;
          for (let i = 0; i < n; i++) {
            const a = Math.random() * TAU;
            if (ghost) puff(game, e.x + Math.cos(a) * 4, e.y, 6 + Math.random() * 6, 2, 0.5 + Math.random() * 0.3, Math.cos(a) * 14, Math.sin(a) * 6, 0.5, 4);
            else game.addParticle({ kind: 'chunk', spr: 1 + 0, dirt: true, x: e.x, y: e.y, z: 1, vx: Math.cos(a) * 30, vy: Math.sin(a) * 14, vz: 50 + Math.random() * 40, grav: 260, drag: 1, life: 0.55, size: 0.6 + Math.random() * 0.3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 });
          }
        }
        if (ghost) continue;
        const t = e.spawnT;
        const a = t < 0.15 ? U.ease.outBack(t / 0.15) : t > 0.72 ? Math.max(0, 1 - (t - 0.72) / 0.28) : 1;
        if (a <= 0.01) continue;
        const rx = (e.type === 'colossus' ? 19 : 10) * a, ry = rx * 0.42;
        ctx.fillStyle = '#b07a4c';
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 0.3, rx + 1.6, ry + 1.0, 0, 0, TAU); ctx.fill();
        ctx.lineWidth = 0.8; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.fillStyle = '#43283f';
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 0.5, rx, ry * 0.8, 0, 0, TAU); ctx.fill();
      }
    },

    drawWorldOverlay(ctx, view) {
      // a few butterflies drifting over the meadow (pure decoration)
      const V = tf(view), cell = 210, rt = view.rt;
      const x0 = Math.floor((view.x0 - 60) / cell), x1 = Math.floor((view.x1 + 60) / cell);
      const y0 = Math.floor((view.y0 - 60) / cell), y1 = Math.floor((view.y1 + 60) / cell);
      const k = 1 / K, ss = SPR.shadow;
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = U.hash2(cx, cy, 991);
          if (h > 0.55) continue;
          const ph = h * 40, ph2 = U.hash2(cx, cy, 992) * 40;
          const hx = (cx + 0.5) * cell + Math.sin(ph2) * 60, hy = (cy + 0.5) * cell + Math.cos(ph2) * 60;
          const x = hx + Math.sin(rt * 0.37 + ph) * 46 + Math.sin(rt * 0.93 + ph2) * 14;
          const y = hy + Math.cos(rt * 0.29 + ph) * 30 + Math.sin(rt * 1.31 + ph) * 9;
          if (x < view.x0 - 10 || x > view.x1 + 10 || y < view.y0 - 10 || y > view.y1 + 30) continue;
          const z = 16 + Math.sin(rt * 2.1 + ph) * 4;
          ctx.globalAlpha = 0.7;
          ctx.drawImage(ss.c, x - ss.ox * k * 0.75, y - ss.oy * k * 0.75, ss.c.width * k * 0.75, ss.c.height * k * 0.75);
          ctx.globalAlpha = 1;
          const flap = Math.abs(Math.sin(rt * 13 + ph * 3));
          const dir = Math.cos(rt * 0.37 + ph) * 0.35;
          blitRot(ctx, V, SPR.bfly[(h * 100 | 0) % BFLY_COL.length], x, y - z, 1.45 * (0.2 + 0.8 * flap), 1.45, dir);
        }
      }
    },

    drawGem(ctx, g, view) {
      const s = g.big ? SPR.gemB : SPR.gemS;
      let h = 1.6 + Math.sin(view.rt * 5 + g.seed * 20) * 1.1;
      let sx = 1, sy = 1;
      if (g.pop > 0) {
        const q = 1 - g.pop;
        h += Math.sin(q * PI) * 10;
        const p = U.ease.outBack(Math.min(1, q * 1.4));
        sx = 0.4 + 0.6 * p; sy = sx;
      } else if (!g.fly) {
        const b = Math.sin(view.rt * 5 + g.seed * 20);
        sy = 1 + b * 0.05; sx = 1 - b * 0.04;
      }
      const sk = g.big ? 1.45 : 1;
      const k = 1 / K, ss = SPR.shadow, sc = sk * (1 - h * 0.025);
      ctx.drawImage(ss.c, g.x - ss.ox * k * sc, g.y - ss.oy * k * sc, ss.c.width * k * sc, ss.c.height * k * sc);
      blit(ctx, s, g.x, g.y - h, sx, sy);
      if (g.big) {
        const tw = Math.sin(view.rt * 3 + g.seed * 9);
        if (tw > 0.6) { const V = tf(view); const q = (tw - 0.6) / 0.4; blitRot(ctx, V, SPR.spark, g.x + 3.5, g.y - h - 9, q * 0.7, q * 0.7, view.rt); }
      }
    },

    drawEnemy(ctx, e, view) {
      if (shPending) flushShadows(ctx);
      const V = tf(view);
      let set, rot = 0, sx = 1, sy = 1, y = e.y, alpha = 1;
      let scl = 0.94 + e.seed * 0.12;
      if (e.type === 'creeper') {
        const ph = e.anim * 0.85 + e.seed;
        const f = Math.floor(ph * 4) & 3;
        set = SPR.creep[Math.floor(e.seed * 3) % 3][f];
        scl *= CREEP_SCALE;
        const sn = Math.sin(ph * TAU);
        rot = sn * 0.1;
        const up = Math.abs(sn);
        y -= up * 1.3;
        sx = 1 + (1 - up) * 0.05; sy = 1 - (1 - up) * 0.06 + up * 0.03;
      } else if (e.type === 'ghost') {
        const f = Math.floor(view.rt * 7 + e.seed * 4) & 3;
        set = SPR.ghost[f];
        y -= 4.5 + Math.sin(view.rt * 2.6 + e.seed * 12) * 1.6;
        rot = U.clamp(e.vx / 64, -1, 1) * 0.16;
        const b = Math.sin(view.rt * 5.2 + e.seed * 7);
        sx = 1 + b * 0.04; sy = 1 - b * 0.04;
      } else {
        const ph = e.anim * 0.32 + e.seed;
        const f = Math.floor(ph * 4) & 3;
        set = SPR.colo[f];
        const sn = Math.sin(ph * TAU);
        const up = Math.abs(sn);
        const contact = Math.pow(1 - up, 3);
        y -= up * 2.0;
        sx = 1 + contact * 0.08; sy = 1 - contact * 0.08;
        rot = sn * 0.035;
      }
      sx *= scl; sy *= scl;
      const left = e.facing < 0;
      // spawn pop
      if (e.spawnT < 1) {
        if (e.type === 'ghost') {
          const q = U.clamp(e.spawnT / 0.8, 0, 1);
          alpha *= q;
          const p = U.ease.outBack(q);
          sx *= p; sy *= p;
        } else {
          const q = U.clamp((e.spawnT - 0.1) / 0.9, 0, 1);
          if (q <= 0) return;
          const p = U.ease.outElastic(q);
          sy *= p; sx *= p > 0.05 ? U.clamp(1 / Math.sqrt(p), 0.75, 1.5) : 1.5;
          rot *= q;
        }
      }
      // death pop: pancake squash in white, then gone (puffs + stars take over)
      if (e.dying) {
        // inflate in white, then pop (shrink to nothing) – the puff burst takes over
        const q = e.deathT;
        if (q >= 0.5) return;
        const k = q < 0.22 ? 1 + U.ease.outQuad(q / 0.22) * 0.28 : 1.28 * (1 - U.ease.inQuad((q - 0.22) / 0.28));
        sx *= k * (1 + 0.1 * Math.sin(q * 40)); sy *= k * (1 - 0.1 * Math.sin(q * 40));
        ctx.globalAlpha = alpha;
        const s = left ? set.fl : set.f;
        if (rot) blitRot(ctx, V, s, e.x, y, sx, sy, rot); else blit(ctx, s, e.x, y, sx, sy);
        ctx.globalAlpha = 1;
        return;
      }
      const fl = e.flash;
      if (fl > 0) { sx *= 1 + 0.22 * fl; sy *= 1 - 0.18 * fl; }
      ctx.globalAlpha = alpha;
      const s = left ? set.nl : set.n;
      if (rot) blitRot(ctx, V, s, e.x, y, sx, sy, rot); else blit(ctx, s, e.x, y, sx, sy);
      if (fl > 0.02) {
        ctx.globalAlpha = Math.min(0.85, fl * 1.3) * alpha;
        const f2 = left ? set.fl : set.f;
        if (rot) blitRot(ctx, V, f2, e.x, y, sx, sy, rot); else blit(ctx, f2, e.x, y, sx, sy);
      }
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      if (shPending) flushShadows(ctx);
      const V = tf(view), game = view.game;
      let frame = 0, sx = 1, sy = 1, lift = 0, rot = 0;
      if (p.moving) {
        const ph = p.anim * 0.42, f = ph - Math.floor(ph), hop = Math.floor(ph);
        const air = Math.sin(f * PI);
        lift = air * 3.4;
        const contact = Math.max(0, 1 - Math.min(f, 1 - f) * 6);
        sy = 1 + 0.07 * air - 0.13 * contact;
        sx = 1 - 0.04 * air + 0.12 * contact;
        frame = contact > 0.25 ? (hop & 1 ? 1 : 3) : 2;
        rot = 0.07 * p.facing * air;
        if (hop !== lastHop) {
          if (lastHop >= 0 && game && game.state === 'play' && p.dashT <= 0) {
            puff(game, p.x - p.facing * 4, p.y + 0.5, 1.2, 1, 0.38, -p.vx * 0.15, -p.vy * 0.15, 0.32, 2.5);
          }
          lastHop = hop;
        }
      } else {
        const b = Math.sin(view.rt * 3.2);
        sy = 1 + 0.03 * b; sx = 1 - 0.022 * b;
        lastHop = -1;
      }
      if (p.shootT > 0) { sy *= 1 - 0.05 * p.shootT; sx *= 1 + 0.04 * p.shootT; }
      if (p.levelT > 0) { const w = Math.sin(p.levelT * PI * 4) * p.levelT; sy *= 1 + 0.18 * w; sx *= 1 - 0.12 * w; }
      const hurt = p.hurtT > 0;
      if (hurt) { sx *= 1 + 0.16 * p.hurtT; sy *= 1 - 0.13 * p.hurtT; }
      sx *= JACK_SCALE; sy *= JACK_SCALE; lift *= JACK_SCALE;
      const left = p.facing < 0;
      const set = (hurt ? SPR.jackHurt : SPR.jack)[frame];
      // dash smear: white after-images + stretch
      if (p.dashT > 0) {
        const k = U.clamp(p.dashT / 0.2, 0, 1);
        sx *= 1 + 0.2 * k; sy *= 1 - 0.12 * k;
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = (0.42 / i) * k;
          blit(ctx, left ? set.fl : set.f, p.x - p.dashX * i * 7, p.y - p.dashY * i * 7 - lift, sx, sy);
        }
        ctx.globalAlpha = 1;
      }
      let a = 1;
      if (p.iframes > 0 && !hurt && p.dashT <= 0 && (Math.floor(view.rt * 16) & 1)) a = 0.5;
      ctx.globalAlpha = a;
      const s = left ? set.nl : set.n;
      blitRot(ctx, V, s, p.x, p.y - lift, sx, sy, rot);
      if (hurt) {
        ctx.globalAlpha = Math.min(1, p.hurtT * 1.3);
        blitRot(ctx, V, left ? set.fl : set.f, p.x, p.y - lift, sx, sy, rot);
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      const V = tf(view);
      const bob = Math.sin(view.rt * 4 + o.idx * 1.7) * 1.4;
      const gy = o.y + 4;
      const k = 1 / K, ss = SPR.shadow;
      ctx.drawImage(ss.c, o.x - ss.ox * k * 1.5, gy - ss.oy * k * 1.5, ss.c.width * k * 1.5, ss.c.height * k * 1.5);
      const y = o.y - 3 + bob;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + 0.12 * Math.sin(view.rt * 9 + o.idx * 2.1);
      blit(ctx, SPR.glow, o.x, y - 7, 1, 1);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const sq = Math.sin(view.rt * 8 + o.idx);
      blitRot(ctx, V, SPR.lantern, o.x, y, 1 + sq * 0.04, 1 - sq * 0.04, Math.sin(view.rt * 3 + o.idx) * 0.14);
    },

    drawProjectile(ctx, pr, view) {
      const V = tf(view);
      const k = 1 / K, ss = SPR.shadow;
      ctx.globalAlpha = 0.8;
      ctx.drawImage(ss.c, pr.x - ss.ox * k * 0.8, pr.y + 6 - ss.oy * k * 0.8, ss.c.width * k * 0.8, ss.c.height * k * 0.8);
      ctx.globalAlpha = Math.min(1, pr.age * 14) * 0.9;
      blitRot(ctx, V, SPR.streak, pr.x, pr.y, 1, 1, pr.angle);
      ctx.globalAlpha = 1;
      const sq = 0.55 + 0.45 * Math.abs(Math.cos(pr.spin));
      blitRot(ctx, V, SPR.seed, pr.x, pr.y, 1, sq, pr.angle);
    },

    drawParticle(ctx, pt, view) {
      const V = tf(view);
      const t = 1 - pt.life / pt.max;
      let s, sc, spr, rot = pt.rot, z = pt.z;
      switch (pt.kind) {
        case 'puff':
          spr = SPR.puff[pt.tint || 0];
          sc = t < 0.2 ? U.ease.outBack(t / 0.2) : 1 - Math.pow((t - 0.2) / 0.8, 2);
          s = pt.size * Math.max(0, sc);
          z += (pt.rise || 0) * t;
          rot *= 0.3;
          break;
        case 'star':
          spr = SPR.star[pt.tint || 0];
          sc = t < 0.12 ? t / 0.12 : t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
          s = pt.size * sc;
          break;
        case 'chunk':
          spr = pt.dirt ? null : SPR.chunk[pt.spr || 0];
          sc = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
          s = pt.size * sc;
          if (pt.dirt) {
            ctx.fillStyle = '#9c6a42'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.arc(pt.x, pt.y - z, 1.3 * s, 0, TAU); ctx.fill(); ctx.stroke();
            return;
          }
          break;
        case 'hit':
          spr = SPR.hit;
          sc = t < 0.3 ? 0.5 + (t / 0.3) * 0.7 : 1.2 - (t - 0.3) / 0.7 * 0.9;
          s = pt.size * sc;
          break;
        case 'spark':
          spr = SPR.spark;
          sc = t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75;
          s = pt.size * sc;
          rot = 0;
          break;
        case 'conf':
          spr = SPR.conf[pt.tint || 0];
          s = pt.size * (t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1);
          {
            const fl = Math.cos(view.rt * 9 + pt.seed * 20);
            if (s <= 0.01) return;
            const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
            ctx.setTransform(co * s, si * s, -si * s * fl, co * s * fl, V.ox + pt.x * S, V.oy + (pt.y - z) * S);
            const k = 1 / K;
            ctx.drawImage(spr.c, -spr.ox * k, -spr.oy * k, spr.c.width * k, spr.c.height * k);
            ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
          }
          return;
        case 'ring': {
          const r = pt.size * (4 + 26 * U.ease.outQuad(t));
          const w = 2.4 * (1 - t);
          if (w <= 0.05) return;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.45, 0, 0, TAU);
          ctx.strokeStyle = OUT; ctx.lineWidth = w + 1.4; ctx.stroke();
          ctx.strokeStyle = pt.color || '#ffffff'; ctx.lineWidth = w; ctx.stroke();
          return;
        }
        default: {
          const a = U.clamp(pt.life / pt.max, 0, 1);
          ctx.globalAlpha = a; ctx.fillStyle = pt.color || '#fff';
          ctx.beginPath(); ctx.arc(pt.x, pt.y - z, (pt.size || 2) * 0.5, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
          return;
        }
      }
      if (!(s > 0.01)) return;
      blitRot(ctx, V, spr, pt.x, pt.y - z, s, s, rot);
    },

    drawNumber(ctx, n, view) {
      const V = tf(view);
      const spr = numSprite(n.value, n.crit, view.rt);
      const t = 1 - n.life / n.max;
      let sc = t < 0.1 ? 0.3 + (t / 0.1) * 1.05 : t < 0.24 ? 1.35 - ((t - 0.1) / 0.14) * 0.35 : 1;
      if (t > 0.72) sc *= 1 - ((t - 0.72) / 0.28) * 0.7;
      ctx.globalAlpha = t > 0.82 ? Math.max(0, 1 - (t - 0.82) / 0.18) : 1;
      blitRot(ctx, V, spr, n.x, n.y, sc, sc, (n.seed - 0.5) * 0.3);
      ctx.globalAlpha = 1;
    },

    drawIcon(ctx, id, size) {
      const fn = ICONS[id] || ICONS.dmg;
      ctx.save();
      ctx.scale(size / 48, size / 48);
      iconPaint(ctx, fn);
      ctx.restore();
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e, src) {
      const h = e.type === 'colossus' ? 24 : e.type === 'ghost' ? 15 : 11;
      game.addParticle({ kind: 'hit', x: e.x + (Math.random() - 0.5) * 5, y: e.y + 0.5, z: h + (Math.random() - 0.5) * 5, life: 0.14, size: e.type === 'colossus' ? 1.0 : 0.72, rot: Math.random() * TAU, drag: 0 });
      if (Math.random() < 0.6) {
        const a = Math.random() * TAU;
        game.addParticle({ kind: 'spark', x: e.x, y: e.y + 0.5, z: h, vx: Math.cos(a) * 60, vy: Math.sin(a) * 30, vz: 40, grav: 220, drag: 2, life: 0.3, size: 0.6 });
      }
    },
    onKill(game, e) {
      const x = e.x, y = e.y + 0.6, T = e.type;
      const big = T === 'colossus', ghost = T === 'ghost';
      const h = big ? 22 : ghost ? 13 : 10;
      const tint = ghost ? 2 : big ? 3 : 0;
      const nP = big ? 9 : 6;
      for (let i = 0; i < nP; i++) {
        const a = (i / nP) * TAU + Math.random() * 0.6;
        const sp = (big ? 44 : 28) * (0.6 + Math.random() * 0.6);
        puff(game, x + Math.cos(a) * 3, y + Math.sin(a) * 1.2, h + Math.sin(a) * 4, tint, (big ? 1.45 : 0.9) * (0.75 + Math.random() * 0.5), Math.cos(a) * sp, Math.sin(a) * sp * 0.55, 0.42 + Math.random() * 0.2, 7);
      }
      const nS = big ? 6 : ghost ? 2 : 3;
      for (let i = 0; i < nS; i++) {
        const a = Math.random() * TAU, sp = 50 + Math.random() * 50;
        game.addParticle({ kind: 'star', tint: ghost ? 1 : 0, x, y, z: h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 50, grav: 180, drag: 2.2, life: 0.55 + Math.random() * 0.15, size: (big ? 1.0 : 0.72) * (0.8 + Math.random() * 0.4), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 });
      }
      let cols;
      if (big) cols = [5, 4, 2, 7, 4, 5];
      else if (ghost) cols = [6, 6];
      else { const v = CREEP[Math.floor(e.seed * 3) % 3]; cols = [v.chunk, 1, 2, v.chunk]; }
      const nC = big ? 10 : ghost ? 2 : 4;
      for (let i = 0; i < nC; i++) {
        const a = Math.random() * TAU, sp = 30 + Math.random() * 45;
        game.addParticle({ kind: 'chunk', spr: cols[i % cols.length], x, y, z: h * 0.7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 60, grav: 280, drag: 1.2, life: 0.8 + Math.random() * 0.35, size: (big ? 1.25 : 1.0) * (0.8 + Math.random() * 0.5), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14 });
      }
      if (big) game.addParticle({ kind: 'ring', x, y, life: 0.45, size: 1.4, drag: 0 });
    },
    onHurt(game, p) {
      game.addParticle({ kind: 'hit', x: p.x, y: p.y + 0.5, z: 16, life: 0.18, size: 1.1, rot: Math.random() * TAU, drag: 0 });
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * TAU, sp = 50 + Math.random() * 40;
        game.addParticle({ kind: 'star', tint: 2, x: p.x, y: p.y + 0.5, z: 16, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50, grav: 180, drag: 2.2, life: 0.5, size: 0.7, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 });
      }
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * TAU;
        game.addParticle({ kind: 'chunk', spr: 3, x: p.x, y: p.y + 0.5, z: 18, vx: Math.cos(a) * 40, vy: Math.sin(a) * 24, vz: 60, grav: 280, drag: 1.2, life: 0.7, size: 0.6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14 });
      }
    },
    onPickup(game, g) {
      const p = game.player;
      game.addParticle({ kind: 'spark', x: p.x + (Math.random() - 0.5) * 10, y: p.y + 0.5, z: 8 + Math.random() * 14, vz: 0, life: 0.3, size: g.big ? 1.0 : 0.6, drag: 0 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.5) puff(game, pr.x, pr.y + 4, 4, 0, 0.28, pr.vx * 0.05, pr.vy * 0.05, 0.18, 0);
    },
    onDash(game, p) {
      for (let i = 0; i < 4; i++) puff(game, p.x - p.dashX * i * 3 + (Math.random() - 0.5) * 4, p.y + 0.5 - p.dashY * i * 3, 1.5, 1, 0.5 + Math.random() * 0.2, -p.dashX * 20, -p.dashY * 20, 0.38, 3);
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'ring', x: p.x, y: p.y, life: 0.6, size: 1.6, drag: 0, color: '#ffd43f' });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU, sp = 70 + Math.random() * 30;
        game.addParticle({ kind: 'star', tint: 0, x: p.x, y: p.y + 0.5, z: 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 70, grav: 160, drag: 2.0, life: 0.9, size: 0.8, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10 });
      }
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * TAU, sp = 30 + Math.random() * 50;
        game.addParticle({ kind: 'conf', tint: i % CONF_COL.length, x: p.x, y: p.y + 0.5, z: 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, vz: 80 + Math.random() * 60, grav: 120, drag: 2.5, life: 1.3 + Math.random() * 0.5, size: 0.9 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 8 });
      }
    },
    onDeath(game, p) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        puff(game, p.x, p.y + 0.5, 14, 4, 1.1, Math.cos(a) * 40, Math.sin(a) * 22, 0.7, 8);
      }
    },
  });
})();
