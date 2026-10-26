/* ============================================================================
   Rubber Hose 1930s (id: rubberhose) – early black-and-white studio animation.
   Variant of the `cartoon` module: same two-pass part painter (one merged ink
   silhouette outline, then fills) and baked multi-frame sprites, but:
   - pure ink outlines, fills in 4 warm greys + two whites, no colour at all;
   - characters with elbow-less rubber-hose limbs (stroked quadratic curves),
     white four-finger gloves, pie-cut eyes and big shoes; 8-frame bouncy walk;
   - the whole world "dances" on a shared 120 bpm beat (props squash & sway);
   - ground: flat grey washes with crisp ink contour lines and ink decals;
   - film projection on top: silver/sepia grade, grain, scratches, dust,
     flicker, gate weave, vignette with rounded gate corners – stepped at 24 fps.
   ========================================================================== */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2, PI = Math.PI;

  /* ------------------------------------------------------------------ palette */
  const INK = '#16120e';
  const C = {
    ink: INK, g1: '#3a342d', g2: '#6d665b', g3: '#a0988a', g4: '#cdc5b5', paper: '#efe9dc', white: '#faf7ef',
    face: '#e6dece', faceSh: '#c9c0ae', glove: '#faf7ef', gloveSh: '#d6cebf',
    shoe: '#d9d1c1', shoeSh: '#a59d8e', shorts: '#6d665b', shortsSh: '#4f493f',
    ghost: '#f4efe4', ghostSh: '#cbc3b3',
  };
  const OL = 1.0;   // outer outline weight (world units)
  const IL = 0.5;   // inner separation lines
  const FLASH = { c: '#fbf8f0', sh: '#e3dccd' };
  const NEG = { c: '#1d1813', sh: '#3a342d' };   // negative flash for white figures
  const BPS = 2;    // the shared beat: 120 bpm
  const SEPIA = '#978c7b';

  let K = 3; // sprite resolution: canvas px per world unit (set in init)
  const SPR = {};

  /* ================================================================ painter
     A sprite is a function fn(P) that declares parts back-to-front. It runs twice:
     'outline' (every part stroked + filled in ink at 2x weight -> one merged silhouette outline),
     then 'fill' (or 'flash'): flat fill, optional grey crescent, details, white shine.          */
  function Painter(ctx, mode, ol, flash, out) {
    this.ctx = ctx; this.mode = mode; this.ol = ol; this.fl = flash || FLASH; this.out = out || INK;
  }
  Painter.prototype.part = function (shape, fill, o) {
    o = o || {};
    const ctx = this.ctx;
    if (this.mode === 'outline') {
      if (o.noOutline) return;
      ctx.beginPath(); shape(ctx);
      ctx.lineWidth = (o.ol != null ? o.ol : this.ol) * 2;
      ctx.strokeStyle = this.out; ctx.fillStyle = this.out;
      ctx.stroke(); ctx.fill();
      return;
    }
    const flash = this.mode === 'flash';
    ctx.save();
    ctx.beginPath(); shape(ctx);
    if (o.inner) { ctx.lineWidth = o.inner * 2; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.clip();
    if (o.sh) {
      this.paint(fill, o, true, flash);
      ctx.save();
      ctx.save(); ctx.translate(o.sh[0], o.sh[1]); ctx.beginPath(); shape(ctx); ctx.restore();
      ctx.clip();
      this.paint(fill, o, false, flash);
      ctx.restore();
    } else this.paint(fill, o, false, flash);
    if (!flash || o.flashDetail) {
      if (o.detail) { ctx.save(); o.detail(ctx); ctx.restore(); }
      if (!flash && o.hi) shine(ctx, o.hi, o.hiA);
    }
    ctx.restore();
  };
  Painter.prototype.paint = function (fill, o, shade, flash) {
    const ctx = this.ctx;
    if (flash) { ctx.fillStyle = shade ? this.fl.sh : this.fl.c; ctx.fillRect(-500, -500, 1000, 1000); return; }
    if (typeof fill === 'function') { fill(ctx, shade); return; }
    ctx.fillStyle = shade ? o.shade || fill : fill;
    ctx.fillRect(-500, -500, 1000, 1000);
  };
  /** A rubber-hose limb: a stroked path (round caps), outlined like every other part. */
  Painter.prototype.hose = function (path, w, col) {
    const ctx = this.ctx;
    ctx.beginPath(); path(ctx);
    if (this.mode === 'outline') { ctx.lineWidth = w + this.ol * 2; ctx.strokeStyle = this.out; ctx.stroke(); return; }
    ctx.lineWidth = w; ctx.strokeStyle = this.mode === 'flash' ? this.fl.c : col; ctx.stroke();
  };
  Painter.prototype.detail = function (fn, inFlash) {
    if (this.mode === 'outline') return;
    if (this.mode === 'flash' && !inFlash) return;
    const c = this.ctx;
    c.save(); fn(c, this.mode === 'flash'); c.restore();
  };
  function shine(ctx, h, a) {
    ctx.globalAlpha = a || 0.9;
    ctx.fillStyle = C.white;
    ctx.beginPath(); ctx.ellipse(h[0], h[1], h[2], h[3], h[4] || 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* ----------------------------------------------------------- shape helpers */
  const E = (x, y, rx, ry, rot) => (c) => {
    rot = rot || 0;
    c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
    c.ellipse(x, y, rx, ry, rot, 0, TAU);
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
  const off = (pts, dx, dy, s) => pts.map((p) => [dx + p[0] * (s || 1), dy + p[1] * (s || 1)]);
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
  /** Elbow-less limb: one quadratic bow from (x1,y1) to (x2,y2); bend = sideways offset of the middle. */
  function hoseCtrl(x1, y1, x2, y2, bend) {
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
    return [(x1 + x2) / 2 - (dy / l) * bend, (y1 + y2) / 2 + (dx / l) * bend];
  }
  const hosePath = (x1, y1, x2, y2, bend) => (c) => {
    const q = hoseCtrl(x1, y1, x2, y2, bend);
    c.moveTo(x1, y1); c.quadraticCurveTo(q[0], q[1], x2, y2);
  };
  function spiral(c, x, y, r0, r1, turns, a0, flat) {
    const n = Math.ceil(turns * 18);
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = a0 + t * turns * TAU, r = r0 + (r1 - r0) * t;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * (flat || 1);
      if (i) c.lineTo(px, py); else c.moveTo(px, py);
    }
  }
  /** The pie-cut eye: an ink oval with a wedge cut out of its upper front. */
  function pieEye(c, x, y, rx, ry, rot, cut, dir) {
    dir = dir || 1;
    c.save();
    c.translate(x, y); c.rotate(rot || 0);
    c.fillStyle = INK;
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill();
    c.clip();
    c.fillStyle = cut || C.face;
    c.beginPath(); c.moveTo(dir * rx * 0.15, -ry * 0.12); c.lineTo(dir * rx * 1.4, -ry * 1.05); c.lineTo(dir * rx * 1.4, -ry * 0.25); c.closePath(); c.fill();
    c.restore();
  }

  /* --------------------------------------------------------- sprite builder */
  function build(box, fn, mode, ol, fl, out) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'outline', ol || OL, fl, out));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, mode || 'fill', ol || OL, fl, out));
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy }; }
  function set4(box, fn, post, fl) {
    const n = build(box, fn, 'fill', OL, fl), f = build(box, fn, 'flash', OL, fl);
    if (post) { post(n, box); post(f, box); }
    return { n, f, nl: flipS(n), fl: flipS(f) };
  }
  function withFlip(s) { return { n: s, l: flipS(s) }; }
  function plainSprite(box, fn) {
    const l = box[0], t = box[1];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((box[2] - l) * K); cv.height = Math.ceil((box[3] - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    fn(ctx);
    return { c: cv, ox: -l * K, oy: -t * K };
  }

  /* ============================================================ characters */
  function glove(P, x, y, a, s) {
    s = s || 1;
    const co = Math.cos(a), si = Math.sin(a), px = -si, py = co;
    const cx = x + co * 1.25 * s, cy = y + si * 1.25 * s;
    P.part(E(cx, cy, 2.05 * s, 1.85 * s, a), C.glove, {
      shade: C.gloveSh, sh: [-0.35 * s, -0.45 * s], inner: IL * 0.8,
      detail(c) {
        c.strokeStyle = INK; c.lineWidth = 0.32 * s;
        c.beginPath();
        for (const k of [-0.55, 0.55]) {
          c.moveTo(cx + px * k * s - co * 0.2 * s, cy + py * k * s - si * 0.2 * s);
          c.lineTo(cx + px * k * s + co * 1.1 * s, cy + py * k * s + si * 1.1 * s);
        }
        c.stroke();
      },
    });
    P.part(E(cx + px * 1.55 * s + co * 0.1 * s, cy + py * 1.55 * s + si * 0.1 * s, 0.85 * s, 0.68 * s, a + 0.4), C.glove, { shade: C.gloveSh, sh: [-0.2, -0.25], inner: IL * 0.7 });
    // rolled cuff
    P.part(E(x - co * 0.35 * s, y - si * 0.35 * s, 0.95 * s, 1.65 * s, a), C.glove, { shade: C.gloveSh, sh: [-0.25, -0.3], inner: IL * 0.8 });
  }
  function shoe(P, fx, fy, ang, s, col) {
    s = s || 1;
    const cx = fx + 1.45 * s, cy = fy - 1.55 * s;
    col = col || [C.shoe, C.shoeSh];
    P.part(E(cx, cy, 3.75 * s, 2.1 * s, ang || 0), col[0], {
      shade: col[1], sh: [-0.7 * s, -0.75 * s], inner: IL * 0.6,
      detail(c) {
        c.strokeStyle = INK; c.lineWidth = 0.34 * s;
        c.beginPath(); c.ellipse(cx + 1.6 * s, cy + 0.1 * s, 1.5 * s, 1.75 * s, ang || 0, PI * 0.62, PI * 1.38); c.stroke();
      },
      hi: [cx + 0.6 * s, cy - 1.0 * s, 1.3 * s, 0.45 * s, (ang || 0) - 0.15],
    });
  }

  /* --- main character: a jaunty ink cat-fellow with a pale face mask, bow tie, shorts, gloves, big shoes.
     Walk = 8 drawn poses: contact – down – passing – up for each foot. Foot x/lift/shoe angle per frame;
     the arms counter-swing one frame behind the legs (overlap), ears and tail follow through later still. */
  const WALK = {
    x: [6.2, 3.2, 0.2, -3.0, -6.0, -3.6, 1.0, 4.6],
    l: [0, 0, 0, 0.5, 1.3, 3.4, 4.6, 2.4],
    a: [-0.38, -0.05, 0, 0.22, 0.52, 0.35, 0.05, -0.25],
    bob: [0.3, 1.3, -0.7, -1.9], // + = lower; contact, down, passing, up
  };
  function heroPose(kind, f) {
    const P = { bob: 0, lean: 0.04, face: 'norm', tail: 0, ear: 0, tilt: 0 };
    if (kind === 'walk') {
      const g = (f + 4) % 8, fp = (f + 7) % 8, gp = (g + 7) % 8;
      const b = WALK.bob[f % 4];
      P.bob = b;
      P.near = [1.0 + WALK.x[f], -WALK.l[f], null, WALK.a[f]];
      P.far = [-1.0 + WALK.x[g] * 0.92, -WALK.l[g], null, WALK.a[g]];
      // arms: swing against the leg on the same side, one frame late; the noodle bows behind the motion
      const sN = -WALK.x[fp] / 6.2, sNp = -WALK.x[(fp + 7) % 8] / 6.2, sF = -WALK.x[gp] / 6.2, sFp = -WALK.x[(gp + 7) % 8] / 6.2;
      P.nArm = [2.3, -15.4 + b, 3.2 + sN * 6.0, -9.2 + b - sN * sN * 1.9 - Math.max(0, sN) * 1.2, 0.8 + (sN - sNp) * 3.4];
      P.fArm = [-1.8, -15.8 + b, -1.6 + sF * 5.0, -9.6 + b - sF * sF * 1.6 - Math.max(0, sF) * 1.0, -0.8 - (sF - sFp) * 3.0];
      const ph = (f / 8) * TAU;
      P.tail = ph - 1.3; P.lean = 0.07;
      P.tilt = 0.055 * Math.sin(ph * 2 - 1.1);
      P.ear = 0.17 * Math.sin(ph * 2 - 1.9);
    } else if (kind === 'idle') {
      // 0 down (on the beat), 1 rising, 2 up + toe tap, 3 settle; frames 4/5 = 0/2 with closed eyes
      const k = f < 4 ? f : f === 4 ? 0 : 2;
      P.face = f >= 4 ? 'blink' : 'norm';
      P.bob = [1.4, 0.2, -1.1, 0.3][k];
      const tap = k === 2, b = P.bob, sw = [1, 0.35, -0.8, -0.15][k];
      P.near = [3.8, tap ? -1.1 : 0, null, tap ? -0.55 : 0];
      P.far = [-3.2, 0, null, 0.06];
      P.nArm = [2.3, -15.4 + b, 5.4 + sw * 2.6, -10.2 + b - Math.abs(sw) * 1.6, -2.2 - sw * 1.4];
      P.fArm = [-1.8, -15.8 + b, -5.0 - sw * 2.2, -10.4 + b - Math.abs(sw) * 1.4, 2.2 + sw * 1.2];
      P.tail = [0.0, 0.9, 1.9, 2.8][k]; P.lean = [0.01, 0.025, 0.04, 0.02][k];
      P.tilt = [0.03, -0.01, -0.05, 0.0][k]; P.ear = [0.14, 0.04, -0.1, 0.02][k];
    } else if (kind === 'dash') {
      P.bob = -1.2; P.lean = 0.24; P.wheel = f; P.tail = 4 + f; P.ear = 0.38 + f * 0.06;
      const b = P.bob;
      P.nArm = [2.3, -15.4 + b, -6.4, -13.6 + b, 2.2];
      P.fArm = [-1.8, -15.8 + b, -8.4, -16.4 + b, -2.0];
      P.tilt = 0.04;
    } else if (kind === 'skid') {
      // the stop after a dash: heels dug in, body thrown back, arms flung up behind, ears still flying
      P.bob = 0.9; P.lean = -0.17; P.tail = 3.6; P.ear = -0.34; P.tilt = -0.12; P.face = 'oops';
      P.near = [7.6, -0.3, null, -0.62];
      P.far = [3.2, 0, null, -0.34];
      const b = P.bob;
      P.nArm = [2.3, -15.4 + b, -4.4, -21.6 + b, 2.4];
      P.fArm = [-1.8, -15.8 + b, -8.2, -18.4 + b, -1.8];
    } else { // hurt
      P.bob = -2.4; P.lean = -0.06; P.face = 'hurt'; P.tail = 2; P.ear = -0.42;
      P.near = [5.2, -2.4, -2.2, -0.5];
      P.far = [-4.6, -2.0, 2.2, 0.45];
      const b = P.bob;
      P.nArm = [2.3, -15.4 + b, 7.4, -26.8 + b, -2.4];
      P.fArm = [-1.8, -15.8 + b, -6.4, -26.4 + b, 2.4];
      P.tilt = -0.08;
    }
    return P;
  }
  function heroArm(P, A) {
    const q = hoseCtrl(A[0], A[1], A[2], A[3], A[4]);
    P.hose(hosePath(A[0], A[1], A[2], A[3], A[4]), 1.45, INK);
    glove(P, A[2], A[3], Math.atan2(A[3] - q[1], A[2] - q[0]));
  }
  /** Boneless leg: the shorter the hip-to-ankle span, the more the hose bows forward (a knee without a joint). */
  function heroLeg(P, hx, hy, F) {
    const ax = F[0] + 0.2, ay = F[1] - 1.6;
    let bend = F[2];
    if (bend === null || bend === undefined) bend = -(0.5 + Math.max(0, 7.4 - Math.hypot(ax - hx, ay - hy)) * 1.25);
    P.hose(hosePath(hx, hy, ax, ay, bend), 1.75, INK);
    shoe(P, F[0], F[1], F[3]);
  }
  function heroParts(P, pose) {
    const c = P.ctx;
    c.save(); c.transform(1, 0, -pose.lean, 1, 0, 0);
    const b = pose.bob;
    const hipY = -8.2 + b;
    const hx = 1.3, hy = -24.4 + b * 1.15;
    // tail (behind everything)
    const tw = Math.sin(pose.tail) * 2.0;
    const tx = pose.wheel !== undefined ? -12.5 : -8.6 + Math.cos(pose.tail) * 0.9, ty = pose.wheel !== undefined ? -12 + b : -16.2 + b + tw;
    P.hose((k) => { k.moveTo(-3.2, -9.6 + b); k.bezierCurveTo(-7.6, -9.2 + b, tx + 0.6, ty + 5.4, tx, ty + 0.6); spiral(k, tx + 1.3, ty + 0.6, 1.3, 0.35, 0.75, PI, 1); }, 1.05, INK);
    heroArm(P, pose.fArm);
    if (pose.wheel !== undefined) {
      // the classic run: legs become a spinning wheel of motion lines
      const w = pose.wheel, cx = 0.8, cy = -4.4 + b * 0.3;
      P.part(E(cx, cy, 5.6, 4.6), 'rgba(22,18,14,0.16)', { noOutline: true });
      P.detail((k) => {
        k.strokeStyle = INK; k.lineCap = 'round';
        for (let i = 0; i < 4; i++) { const a = w * 0.8 + (i / 4) * TAU; k.lineWidth = 0.9; k.beginPath(); k.ellipse(cx, cy, 5.6, 4.6, 0, a, a + 1.1); k.stroke(); }
        for (let i = 0; i < 3; i++) { const a = w * 0.8 + 0.6 + (i / 3) * TAU; k.lineWidth = 0.6; k.beginPath(); k.ellipse(cx, cy, 3.4, 2.8, 0, a, a + 1.0); k.stroke(); }
      }, true);
      shoe(P, 3.6 + w * 0.6, -0.6 + b * 0.3, -0.3 - w * 0.25);
      shoe(P, -6.6 - w * 0.4, -5.2 + w * 1.4 + b * 0.3, 0.7);
    } else {
      heroLeg(P, -0.9, hipY, pose.far);
      heroLeg(P, 1.5, hipY, pose.near);
    }
    // torso + shorts
    P.part(E(0.3, -13.2 + b, 4.0, 4.7), INK, {});
    P.part((k) => roundPoly(k, [[-4.3, -11.6 + b], [4.5, -11.6 + b], [5.0, -6.9 + b], [-4.8, -6.9 + b]], 1.7), C.shorts, {
      shade: C.shortsSh, sh: [-0.9, -0.7], inner: IL,
      detail(k) {
        k.fillStyle = C.white; k.strokeStyle = INK; k.lineWidth = 0.3;
        for (const x of [1.0, 3.3]) { k.beginPath(); k.ellipse(x, -9.9 + b, 0.72, 0.92, 0, 0, TAU); k.fill(); k.stroke(); }
      },
    });
    // bow tie
    const bx = 1.4, by = -17.6 + b;
    P.part((k) => { k.moveTo(bx, by); k.lineTo(bx - 3.2, by - 1.9); k.quadraticCurveTo(bx - 3.9, by, bx - 3.2, by + 1.9); k.closePath(); k.moveTo(bx, by); k.lineTo(bx + 3.2, by - 1.9); k.quadraticCurveTo(bx + 3.9, by, bx + 3.2, by + 1.9); k.closePath(); }, C.white, {
      shade: C.g4, sh: [-0.4, -0.5], inner: IL * 0.8,
      detail(k) { k.fillStyle = C.g2; for (const p of [[-2.2, -0.3], [2.3, 0.4], [-1.6, 1.0], [1.9, -0.8]]) { k.beginPath(); k.arc(bx + p[0], by + p[1], 0.38, 0, TAU); k.fill(); } },
    });
    P.part(E(bx, by, 0.95, 1.05), C.white, { shade: C.g4, sh: [-0.2, -0.2], inner: IL * 0.8 });
    // head
    c.save(); c.translate(hx, hy); c.rotate(pose.tilt || 0); c.translate(-hx, -hy);
    const ear = (bx, by, a, fn) => { c.save(); c.translate(bx, by); c.rotate(a); c.translate(-bx, -by); fn(); c.restore(); };
    ear(hx - 3.6, hy - 4.3, -(pose.ear || 0) * 1.2, () => P.part((k) => roundPoly(k, [[hx - 5.9, hy - 2.6], [hx - 6.6, hy - 10.6], [hx - 1.3, hy - 6.0]], 1.0), INK, {}));
    P.part(E(hx, hy, 7.1, 6.7), INK, {
      detail(k) { k.strokeStyle = C.white; k.globalAlpha = 0.85; k.lineWidth = 0.6; k.beginPath(); k.arc(hx - 0.6, hy - 0.4, 5.3, PI * 1.08, PI * 1.38); k.stroke(); },
    });
    ear(hx + 3.1, hy - 5.3, -(pose.ear || 0), () => P.part((k) => roundPoly(k, [[hx + 0.4, hy - 6.4], [hx + 3.4, hy - 11.8], [hx + 5.8, hy - 4.2]], 1.0), INK, {
      detail(k) { k.fillStyle = C.g1; k.beginPath(); roundPoly(k, [[hx + 1.9, hy - 6.4], [hx + 3.4, hy - 9.6], [hx + 4.6, hy - 5.0]], 0.5); k.fill(); },
    }));
    const mask = (k) => blobPath(k, off([[0.4, -3.6], [1.8, -5.4], [3.5, -4.1], [5.0, -5.2], [6.9, -3.0], [8.2, 0.0], [8.0, 2.9], [5.6, 5.4], [2.0, 5.9], [-0.8, 4.4], [-1.3, 1.2], [-0.7, -1.8]], hx, hy), 0.95);
    P.part(mask, C.face, { shade: C.faceSh, sh: [-0.7, -0.8] });
    P.detail((k) => heroFace(k, hx, hy, pose.face), true);
    c.restore();
    heroArm(P, pose.nArm);
    c.restore();
  }
  function heroFace(k, hx, hy, mode) {
    k.lineCap = 'round'; k.lineJoin = 'round';
    if (mode === 'hurt') {
      k.strokeStyle = INK; k.lineWidth = 0.8;
      k.beginPath();
      for (const e of [[2.3, -1.6], [5.2, -1.5]]) { const x = hx + e[0], y = hy + e[1]; k.moveTo(x - 0.95, y - 1.1); k.lineTo(x + 0.95, y + 1.1); k.moveTo(x + 0.95, y - 1.1); k.lineTo(x - 0.95, y + 1.1); }
      k.stroke();
      k.fillStyle = INK; k.beginPath(); k.ellipse(hx + 4.6, hy + 3.4, 1.4, 1.9, 0, 0, TAU); k.fill();
      k.fillStyle = C.g2; k.beginPath(); k.ellipse(hx + 4.7, hy + 4.4, 0.8, 0.6, 0, 0, TAU); k.fill();
    } else {
      if (mode === 'blink') {
        // closed: two heavy lid curves, lashes flicked out
        k.strokeStyle = INK; k.lineWidth = 0.75; k.beginPath();
        for (const e of [[2.4, -1.2], [5.1, -1.1]]) { const x = hx + e[0], y = hy + e[1]; k.moveTo(x - 1.2, y - 0.3); k.quadraticCurveTo(x, y + 0.9, x + 1.2, y - 0.3); k.moveTo(x + 1.1, y - 0.2); k.lineTo(x + 1.6, y - 0.8); }
        k.stroke();
      } else if (mode === 'oops') {
        // wide startled eyes, pupils pinned to the back
        k.fillStyle = C.white; k.strokeStyle = INK; k.lineWidth = 0.4;
        for (const e of [[2.4, -2.0, 1.5, 2.4], [5.2, -1.9, 1.4, 2.3]]) { k.beginPath(); k.ellipse(hx + e[0], hy + e[1], e[2], e[3], 0, 0, TAU); k.fill(); k.stroke(); }
        k.fillStyle = INK;
        for (const e of [[1.9, -2.2], [4.7, -2.1]]) { k.beginPath(); k.ellipse(hx + e[0], hy + e[1], 0.7, 1.2, 0, 0, TAU); k.fill(); }
      } else {
        pieEye(k, hx + 2.4, hy - 1.7, 1.05, 1.95, 0.05, C.face, 1);
        pieEye(k, hx + 5.1, hy - 1.6, 1.0, 1.9, -0.05, C.face, 1);
      }
      // grin
      k.save();
      k.beginPath(); k.moveTo(hx + 1.6, hy + 2.3); k.quadraticCurveTo(hx + 4.4, hy + 3.4, hx + 7.4, hy + 2.0); k.quadraticCurveTo(hx + 5.6, hy + 7.0, hx + 2.6, hy + 4.4); k.closePath();
      k.fillStyle = INK; k.fill(); k.clip();
      k.fillStyle = C.g2; k.beginPath(); k.ellipse(hx + 4.6, hy + 5.6, 1.6, 1.2, 0, 0, TAU); k.fill();
      k.restore();
      k.strokeStyle = INK; k.lineWidth = 0.4;
      k.beginPath(); k.arc(hx + 1.2, hy + 2.2, 0.8, PI * 0.8, PI * 1.5); k.stroke();
    }
    // nose
    k.fillStyle = INK; k.beginPath(); k.ellipse(hx + 7.5, hy + 0.7, 1.55, 1.15, 0.1, 0, TAU); k.fill();
    k.fillStyle = C.white; k.beginPath(); k.ellipse(hx + 7.0, hy + 0.2, 0.5, 0.3, -0.3, 0, TAU); k.fill();
  }

  /* --- small creature: a bouncing ink imp (3 tones) with horns, pie eyes and a toothy grin */
  const IMP = [
    { body: INK, sh: INK, face: C.face, faceSh: C.faceSh, horn: C.g4, hornSh: C.g3, foot: [C.shoe, C.shoeSh] },
    { body: C.g2, sh: '#544e45', face: C.face, faceSh: C.faceSh, horn: INK, hornSh: INK, foot: [C.g1, INK] },
    { body: C.paper, sh: C.g4, face: '#dcd4c4', faceSh: '#bfb6a5', horn: INK, hornSh: INK, foot: [C.g1, INK] },
  ];
  // hop: 0 crouch (anticipation), 1 take-off stretch, 2 rise, 3 apex, 4 fall stretch, 5 landing squash
  const IMP_AIR = [0, 0.42, 0.86, 1.0, 0.62, 0.1];
  const IMP_SQ = [0.9, -0.8, -0.35, 0.05, -0.5, 0.6]; // + squash, - stretch
  function impParts(P, f, v) {
    const col = IMP[v];
    const air = IMP_AIR[f], sq = IMP_SQ[f];
    const by = -7.8 + Math.max(0, sq) * 1.1 * (1 - air) - air * 3.8;
    const rx = 6.5 * (1 + 0.11 * sq), ry = 5.9 * (1 - 0.13 * sq);
    const tw = Math.sin(((f - 1.3) / 6) * TAU) * 1.9; // the tail lags the body
    // tail with an arrow tip
    P.hose((k) => { k.moveTo(-4.6, by + 2.2); k.bezierCurveTo(-8.8, by + 3.0, -10.2, by - 2.6 + tw, -8.6, by - 5.8 + tw); }, 0.85, INK);
    P.part((k) => roundPoly(k, [[-10.6, by - 5.0 + tw], [-8.4, by - 9.4 + tw], [-6.6, by - 5.4 + tw]], 0.35), INK, {});
    // far limbs
    const ffx = -2.6 + air * 1.0, ffy = -air * 2.4;
    P.hose(hosePath(-1.8, by + 4.0, ffx + 0.3, ffy - 1.0, 0.9 * (1 - air) - 0.5 * air), 1.25, INK);
    shoe(P, ffx - 0.6, ffy + 0.3, 0.1, 0.55, col.foot);
    P.hose(hosePath(-3.8, by - 0.4, -7.0, by + 1.6 - air * 3.6, 1.2), 1.0, INK);
    glove(P, -7.0, by + 1.6 - air * 3.6, PI * 0.9 + air * 0.6, 0.6);
    // body
    P.part(E(0, by, rx, ry), col.body, {
      shade: col.sh, sh: [-1.1, -1.0],
      detail(k) { k.strokeStyle = C.white; k.globalAlpha = col.body === INK ? 0.8 : 0.9; k.lineWidth = 0.5; k.beginPath(); k.ellipse(0, by, rx - 1.3, ry - 1.3, 0, PI * 1.1, PI * 1.42); k.stroke(); },
    });
    // horns
    const horn = (x, y, lean) => (k) => { k.moveTo(x - 1.4, y + 0.6); k.quadraticCurveTo(x - 0.8 + lean * 2, y - 2.2, x + lean * 3.4, y - 4.0); k.quadraticCurveTo(x + 0.6 + lean, y - 1.6, x + 1.4, y + 0.6); k.closePath(); };
    const fl = IMP_SQ[(f + 5) % 6] * 0.35; // horns lag one frame behind the body
    P.part(horn(-2.6, by - ry + 1.0, -0.5 - fl), col.horn, { shade: col.hornSh, sh: [-0.3, 0] });
    P.part(horn(2.8, by - ry + 0.8, 0.45 + fl), col.horn, { shade: col.hornSh, sh: [-0.3, 0] });
    // face patch + face
    const fx = 2.2, fy = by + 0.6;
    P.part((k) => blobPath(k, off([[-3.2, -3.0], [-1.6, -4.4], [0.1, -3.4], [1.8, -4.5], [3.7, -3.0], [4.4, 0.2], [3.2, 3.4], [0.4, 4.3], [-2.5, 3.3], [-3.7, 0.2]], fx, fy), 0.95), col.face, { shade: col.faceSh, sh: [-0.5, -0.6] });
    P.detail((k) => {
      const j = [0, 0.15, 0.25, 0.15, 0, -0.1][f];
      k.fillStyle = C.white; k.strokeStyle = INK; k.lineWidth = 0.35;
      k.beginPath(); k.ellipse(fx - 1.1, fy - 1.5, 1.35, 1.85, 0, 0, TAU); k.fill(); k.stroke();
      k.beginPath(); k.ellipse(fx + 1.9, fy - 1.6, 1.25, 1.8, 0, 0, TAU); k.fill(); k.stroke();
      pieEye(k, fx - 0.6, fy - 1.1 + j, 0.72, 1.12, 0, C.white, 1);
      pieEye(k, fx + 2.3, fy - 1.2 + j, 0.7, 1.08, 0, C.white, 1);
      k.save();
      k.beginPath(); k.moveTo(fx - 2.4, fy + 1.3); k.quadraticCurveTo(fx + 0.6, fy + 2.4, fx + 3.6, fy + 0.9); k.quadraticCurveTo(fx + 1.6, fy + 5.0, fx - 1.4, fy + 3.2); k.closePath();
      k.fillStyle = INK; k.fill(); k.clip();
      k.fillStyle = C.white;
      k.beginPath(); k.moveTo(fx - 1.0, fy + 1.6); k.lineTo(fx, fy + 1.8); k.lineTo(fx - 0.55, fy + 2.9); k.closePath();
      k.moveTo(fx + 1.4, fy + 1.75); k.lineTo(fx + 2.4, fy + 1.5); k.lineTo(fx + 1.95, fy + 2.7); k.closePath(); k.fill();
      k.restore();
    }, true);
    // near limbs
    const nfx = 2.8 - air * 0.6, nfy = -air * 2.0;
    P.hose(hosePath(2.0, by + 4.2, nfx + 0.3, nfy - 1.0, -0.9 * (1 - air) + 0.5 * air), 1.25, INK);
    shoe(P, nfx - 0.4, nfy + 0.3, -0.1, 0.6, col.foot);
    P.hose(hosePath(5.4, by + 0.6, 8.4, by + 3.4 - air * 4.2, -1.3), 1.0, INK);
    glove(P, 8.4, by + 3.4 - air * 4.2, 0.4 - air * 1.0, 0.62);
  }

  /* --- fast creature: a wobbly sheet ghost with reaching noodle arms */
  function ghostPath(c, ph) {
    c.moveTo(-7.4, -8.0);
    c.bezierCurveTo(-8.8, -17.2, -6.2, -26.2, 0.8, -26.2);
    c.bezierCurveTo(7.8, -26.2, 9.6, -17.4, 8.4, -6.0);
    const xs = [8.4, 4.6, 0.8, -3.0];
    for (let i = 0; i < 3; i++) {
      const x0 = xs[i], x1 = xs[i + 1];
      const yEnd = -5.2 + Math.sin(ph + i * 1.9) * 0.7;
      const yLow = -0.6 + Math.sin(ph + i * 1.9 + 1.2) * 1.2;
      c.quadraticCurveTo((x0 + x1) / 2, yLow, x1, yEnd);
    }
    const tw = Math.sin(ph + 2.4);
    c.quadraticCurveTo(-6.2, 0.2 + tw * 0.8, -12.0 + tw * 0.9, -2.8 + tw * 1.1);
    c.quadraticCurveTo(-9.6, -5.0, -7.4, -8.0);
    c.closePath();
  }
  function ghostParts(P, f) {
    const ph = (f / 6) * TAU;
    const w1 = Math.sin(ph) * 1.5, w2 = Math.sin(ph + 1.4) * 1.5;
    // far arm
    P.hose(hosePath(5.0, -16.4, 12.6, -19.0 + w1, 1.8 * Math.cos(ph)), 2.0, C.ghost);
    P.part(E(13.2, -19.2 + w1, 1.45, 1.15, -0.3), C.ghost, { shade: C.ghostSh, sh: [-0.3, -0.3] });
    P.part((k) => ghostPath(k, ph), C.ghost, { shade: C.ghostSh, sh: [-1.6, -1.3], hi: [-3.4, -21.0, 2.0, 1.0, -0.7] });
    P.detail((k) => {
      pieEye(k, 1.6, -18.0, 1.75, 2.7, 0.14, C.ghost, 1);
      pieEye(k, 5.7, -17.8, 1.62, 2.55, -0.12, C.ghost, 1);
      k.strokeStyle = INK; k.lineWidth = 0.55; k.lineCap = 'round';
      k.beginPath(); k.moveTo(-0.6, -22.2); k.quadraticCurveTo(1.4, -23.4, 3.0, -22.0); k.moveTo(4.6, -22.0); k.quadraticCurveTo(6.2, -23.2, 7.8, -21.6); k.stroke();
      const m = 0.4 * Math.sin(ph * 2);
      k.save();
      k.beginPath(); k.ellipse(3.9, -11.6, 1.7, 2.3 + m, 0, 0, TAU); k.fillStyle = INK; k.fill(); k.clip();
      k.fillStyle = C.g2; k.beginPath(); k.ellipse(4.1, -9.6 + m, 1.3, 0.9, 0, 0, TAU); k.fill();
      k.restore();
    }, true);
    // near arm
    P.hose(hosePath(7.0, -12.6, 13.8, -12.0 + w2, -1.8 * Math.cos(ph)), 2.1, C.ghost);
    P.part(E(14.4, -12.0 + w2, 1.5, 1.2, 0.2), C.ghost, { shade: C.ghostSh, sh: [-0.3, -0.3] });
  }
  function ghostFade(s, box) {
    const ctx = s.c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const y0 = (-9 - box[1]) * K, y1 = (0 - box[1]) * K;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = g; ctx.fillRect(0, 0, s.c.width, s.c.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* --- large creature: a big bully in a striped sweater; the derby hat is a separate sprite (follow-through).
     Walk = an 8-frame waddle: both feet down and lowest on frames 0/4 (heavy landing), one leg up per
     half-cycle, the barrel rocks over the standing leg, the head lags the body by one frame.           */
  const stripes = (c, sh) => {
    c.fillStyle = sh ? C.g4 : C.paper; c.fillRect(-500, -500, 1000, 1000);
    c.fillStyle = sh ? INK : C.g1;
    for (let y = -44; y < -16; y += 6.2) c.fillRect(-40, y, 80, 3.1);
    c.fillStyle = sh ? INK : C.g1; c.fillRect(-40, -17.2, 80, 20);
  };
  const BULLY_BOB = [1.8, 0.6, -0.9, 0.2, 1.8, 0.6, -0.9, 0.2]; // + = lower
  const BULLY_LIFT = [0, 2.3, 4.4, 2.0];
  function bullyFrame(f) {
    const ph = (f / 8) * TAU;
    return {
      b: BULLY_BOB[f], hb: BULLY_BOB[(f + 7) % 8] * 1.2, lean: 0.085 * Math.sin(ph),
      land: f % 4 === 0 ? 1 : f % 4 === 1 ? 0.4 : 0,
      nl: f < 4 ? BULLY_LIFT[f] : 0, fl: f >= 4 ? BULLY_LIFT[f - 4] : 0,
      nx: 8.2 + 2.2 * Math.sin(ph - 0.6), fx: -7.8 - 2.2 * Math.sin(ph - 0.6),
      sw: Math.sin(ph + 0.7),
    };
  }
  /** Where the hat sits on frame f (sprite space, facing right): the head top, moved by the body lean. */
  function bullyHatAt(f) {
    const F = bullyFrame(f), x = 5.6, y = -56 + F.hb, py = -12;
    const co = Math.cos(F.lean), si = Math.sin(F.lean);
    return [x * co - (y - py) * si, py + x * si + (y - py) * co];
  }
  function bullyParts(P, f) {
    const F = bullyFrame(f), c = P.ctx, b = F.b;
    // boots + legs (legs stay planted; the body above them rocks)
    const leg = (hx, fx, fy) => {
      P.hose(hosePath(hx, -12.0 + b * 0.5, fx + 0.4, fy - 2.6, hx < 0 ? 1.4 + b * 0.4 : -1.4 - b * 0.4), 4.4, INK);
      P.part(E(fx + 1.8, fy - 2.4, 6.4, 3.3), INK, {
        detail(k) { k.strokeStyle = C.g2; k.lineWidth = 0.7; k.beginPath(); k.ellipse(fx + 1.8, fy - 2.0, 5.6, 2.4, 0, PI * 0.15, PI * 0.85); k.stroke(); shine(k, [fx + 3.6, fy - 4.0, 2.0, 0.7, -0.15], 0.85); },
      });
    };
    leg(-6.4, F.fx, -F.fl);
    c.save(); c.translate(0, -12); c.rotate(F.lean); c.translate(0, 12);
    // far arm swings against the near one
    const fh = [-20.0 - F.sw * 1.6, -16.0 + b + F.sw * 2.2];
    P.hose(hosePath(-12.6, -36.0 + b, fh[0], fh[1], 3.6 + F.sw * 1.2), 3.7, INK);
    glove(P, fh[0], fh[1], PI * 0.62, 1.9);
    // torso: striped barrel, squashed on the landing frames
    const tq = F.land * 0.06;
    c.save(); c.translate(0, -10); c.scale(1 + tq * 0.7, 1 - tq); c.translate(0, 10);
    const torso = (k) => blobPath(k, off([[-15.4, -12.8], [-17.6, -24.6], [-15.6, -37.4], [-6.4, -43.0], [6.4, -43.2], [15.8, -37.4], [17.8, -24.6], [15.6, -12.8], [0, -9.6]], 0, b), 1);
    P.part(torso, stripes, { sh: [-2.6, -2.0], inner: IL });
    P.detail((k) => {
      k.save(); k.beginPath(); torso(k); k.clip();
      k.fillStyle = C.paper; k.strokeStyle = INK; k.lineWidth = 0.4;
      for (const x of [-6.5, 6.5]) { k.beginPath(); k.ellipse(x, -14.4 + b, 0.9, 0.9, 0, 0, TAU); k.fill(); k.stroke(); }
      k.restore();
    });
    c.restore();
    c.restore();
    leg(6.4, F.nx, -F.nl);
    c.save(); c.translate(0, -12); c.rotate(F.lean); c.translate(0, 12);
    // head (lags the body bob by a frame)
    const hx = 6.2, hy = -49.0 + F.hb;
    P.part(E(hx - 7.0, hy - 5.0, 2.7, 2.5), INK, {});
    P.part(E(hx, hy, 9.3, 8.4), INK, {
      detail(k) { k.strokeStyle = C.white; k.globalAlpha = 0.8; k.lineWidth = 0.7; k.beginPath(); k.arc(hx - 0.8, hy - 0.4, 7.0, PI * 1.1, PI * 1.36); k.stroke(); },
    });
    const jaw = (k) => blobPath(k, off([[-1.4, -4.6], [2.6, -6.0], [6.6, -5.2], [10.6, -2.6], [12.0, 2.6], [10.2, 7.6], [4.6, 9.2], [-1.8, 7.6], [-3.6, 2.6], [-2.8, -1.6]], hx, hy), 0.95);
    P.part(jaw, C.face, {
      shade: C.faceSh, sh: [-1.0, -1.0],
      detail(k) {
        k.fillStyle = C.g2;
        const r = U.rng(51);
        for (let i = 0; i < 26; i++) { const x = hx + r.range(-1.4, 10.0), y = hy + r.range(3.2, 8.0); k.beginPath(); k.arc(x, y, 0.3, 0, TAU); k.fill(); }
      },
    });
    P.detail((k) => {
      pieEye(k, hx + 2.6, hy - 2.0, 1.0, 1.55, 0.05, C.face, 1);
      pieEye(k, hx + 6.2, hy - 1.8, 0.95, 1.5, -0.05, C.face, 1);
      // heavy unibrow
      k.fillStyle = INK;
      k.beginPath(); roundPoly(k, [[hx - 0.6, hy - 6.6], [hx + 8.8, hy - 4.6], [hx + 8.4, hy - 2.9], [hx + 4.2, hy - 3.4], [hx - 0.2, hy - 4.6]], 0.7); k.fill();
      // scowl with an underbite tooth
      k.beginPath(); k.moveTo(hx + 1.0, hy + 5.8); k.quadraticCurveTo(hx + 5.0, hy + 3.4, hx + 9.6, hy + 5.0); k.quadraticCurveTo(hx + 5.4, hy + 5.2, hx + 1.0, hy + 5.8); k.fill();
      k.fillStyle = C.white; k.strokeStyle = INK; k.lineWidth = 0.3;
      k.beginPath(); k.moveTo(hx + 3.6, hy + 4.7); k.lineTo(hx + 4.0, hy + 3.3); k.lineTo(hx + 4.9, hy + 4.4); k.closePath(); k.fill(); k.stroke();
      k.beginPath(); k.moveTo(hx + 6.6, hy + 4.5); k.lineTo(hx + 7.2, hy + 3.2); k.lineTo(hx + 7.9, hy + 4.6); k.closePath(); k.fill(); k.stroke();
      // bulb nose
      k.fillStyle = INK; k.beginPath(); k.ellipse(hx + 11.6, hy + 0.4, 2.6, 2.1, 0.1, 0, TAU); k.fill();
      k.fillStyle = C.white; k.beginPath(); k.ellipse(hx + 10.8, hy - 0.5, 0.8, 0.45, -0.3, 0, TAU); k.fill();
    }, true);
    // near arm
    const nh = [21.6 + F.sw * 1.6, -17.4 + b - F.sw * 2.2];
    P.hose(hosePath(13.6, -35.0 + b, nh[0], nh[1], -3.6 + F.sw * 1.2), 3.9, INK);
    glove(P, nh[0], nh[1], PI * 0.38, 2.0);
    c.restore();
  }
  /** The derby hat, anchored at the middle of its brim. */
  function bullyHatParts(P) {
    P.part(E(0, 0, 9.4, 1.7, -0.12), C.g2, { shade: C.shortsSh, sh: [0, -0.6] });
    P.part((k) => { k.moveTo(-5.8, -0.4); k.bezierCurveTo(-6.0, -8.4, 5.0, -9.0, 5.4, -1.6); k.closePath(); }, C.g2, {
      shade: C.shortsSh, sh: [-1.0, -0.6], inner: IL,
      detail(k) { k.fillStyle = INK; k.beginPath(); k.moveTo(-5.9, -2.6); k.lineTo(5.5, -3.6); k.lineTo(5.5, -1.6); k.lineTo(-5.8, -0.6); k.closePath(); k.fill(); shine(k, [-2.4, -6.0, 1.6, 0.7, -0.5], 0.8); },
    });
  }

  /* ------------------------------------------------------------- effects */
  function noteParts(P, v) {
    if (v === 1) {
      P.part(E(-2.7, 0.6, 2.1, 1.5, -0.35), INK, { hi: [-3.2, 0.1, 0.6, 0.3, -0.35] });
      P.part(E(2.9, -0.6, 2.1, 1.5, -0.35), INK, { hi: [2.4, -1.1, 0.6, 0.3, -0.35] });
      P.hose((k) => { k.moveTo(-1.0, 0.2); k.lineTo(-1.0, -7.6); k.moveTo(4.6, -1.0); k.lineTo(4.6, -8.8); }, 0.7, INK);
      P.hose((k) => { k.moveTo(-1.0, -7.4); k.lineTo(4.6, -8.6); }, 1.5, INK);
      return;
    }
    P.part(E(0, 0, 2.5, 1.8, -0.35), INK, { hi: [-0.6, -0.6, 0.7, 0.35, -0.35] });
    P.hose((k) => { k.moveTo(2.1, -0.6); k.lineTo(2.1, -8.6); }, 0.75, INK);
    P.hose((k) => { k.moveTo(2.1, -8.4); k.bezierCurveTo(5.0, -6.8, 5.6, -4.6, 4.2, -2.6); if (v === 2) { k.moveTo(2.1, -6.0); k.bezierCurveTo(4.8, -4.6, 5.2, -2.8, 4.0, -1.0); } }, 0.85, INK);
  }
  function coinParts(P) {
    P.part(E(0, 0, 3.3, 3.3), C.paper, {
      ol: 0.75, shade: C.g4, sh: [-0.7, -0.7],
      detail(k) {
        k.strokeStyle = C.g3; k.lineWidth = 0.45; k.beginPath(); k.arc(0, 0, 2.3, 0, TAU); k.stroke();
        k.fillStyle = C.g3; k.beginPath(); roundPoly(k, starPts(5, 1.5, 0.65, 0, 0.1, -PI / 2), 0.15); k.fill();
      },
      hi: [-1.3, -1.4, 0.9, 0.45, -0.7],
    });
  }
  function diamondParts(P) {
    const pts = [[-4.8, -2.4], [-2.6, -5.0], [2.6, -5.0], [4.8, -2.4], [0, 4.6]];
    P.part((k) => roundPoly(k, pts, 0.5), C.white, {
      ol: 0.9,
      detail(k) {
        k.fillStyle = C.g4; k.beginPath(); k.moveTo(0.6, -2.4); k.lineTo(4.9, -2.4); k.lineTo(0, 4.8); k.closePath(); k.fill();
        k.fillStyle = C.g3; k.beginPath(); k.moveTo(2.6, -5.1); k.lineTo(4.9, -2.4); k.lineTo(1.4, -2.4); k.closePath(); k.fill();
        k.strokeStyle = INK; k.lineWidth = 0.35;
        k.beginPath(); k.moveTo(-4.8, -2.4); k.lineTo(4.8, -2.4); k.moveTo(-1.4, -2.4); k.lineTo(0, 4.6); k.lineTo(1.4, -2.4);
        k.moveTo(-2.6, -5.0); k.lineTo(-1.4, -2.4); k.moveTo(2.6, -5.0); k.lineTo(1.4, -2.4); k.stroke();
      },
      hi: [-2.6, -3.4, 1.0, 0.4, -0.6],
    });
  }
  function birdParts(P, f) {
    P.part((k) => { k.moveTo(-3.0, -0.6); k.lineTo(-6.2, -2.0); k.lineTo(-5.8, 0.6); k.closePath(); }, C.g2, {});
    if (f === 0) P.part((k) => blobPath(k, [[-1.8, -1.6], [-3.6, -6.6], [-0.6, -5.4], [1.6, -2.0]], 0.9), INK, {});
    P.part(E(0, 0, 3.6, 2.8), C.white, { shade: C.g4, sh: [-0.6, -0.6] });
    P.part(E(2.6, -2.2, 2.2, 2.0), C.white, { shade: C.g4, sh: [-0.4, -0.4] });
    P.part((k) => { k.moveTo(4.4, -2.8); k.lineTo(6.8, -2.0); k.lineTo(4.4, -1.2); k.closePath(); }, C.g3, {});
    P.detail((k) => pieEye(k, 3.0, -2.6, 0.55, 0.85, 0, C.white, 1), true);
    if (f === 1) P.part((k) => blobPath(k, [[-1.6, -0.2], [-3.2, 4.0], [0.2, 3.0], [1.4, 0.2]], 0.9), INK, {});
    else P.part((k) => blobPath(k, [[-1.8, -0.8], [-2.8, -4.4], [0.4, -3.2], [1.4, -0.6]], 0.9), C.g1, {});
  }
  const PUFF_COL = [[C.white, C.g4], [C.g4, C.g3], [C.g3, C.g2]];
  function puffParts(P, t) {
    const col = PUFF_COL[t];
    P.part((k) => { E(0, 0.4, 4.6, 4.2)(k); E(-3.8, 1.4, 3.0, 2.8)(k); E(3.8, 1.3, 3.1, 2.9)(k); E(-1.8, -2.8, 3.0, 2.9)(k); E(2.2, -2.5, 2.8, 2.7)(k); },
      col[0], {
        ol: 0.8, shade: col[1], sh: [-1.2, -1.2],
        detail(k) { k.strokeStyle = INK; k.lineWidth = 0.4; k.beginPath(); spiral(k, -0.6, 0.0, 0.3, 2.0, 1.1, 0, 0.9); k.stroke(); },
      });
  }
  function starParts(P) {
    P.part((k) => roundPoly(k, starPts(5, 4.4, 2.0, 0, 0.3, -PI / 2), 0.5), C.white, { ol: 0.8, shade: C.g4, sh: [-0.7, -0.7] });
  }
  function powParts(P) {
    const pts = [];
    const r = U.rng(7);
    for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU, rr = i & 1 ? 3.0 + r.next() * 0.6 : 6.0 + r.next() * 1.6; pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.86]); }
    P.part((k) => roundPoly(k, pts, 0.25), C.white, {
      ol: 0.8,
      detail(k) { k.fillStyle = C.g4; k.beginPath(); roundPoly(k, pts.map((p) => [p[0] * 0.5, p[1] * 0.5]), 0.2); k.fill(); },
    });
  }
  function twinkleParts(P) {
    P.part((k) => {
      k.moveTo(0, -4.2); k.quadraticCurveTo(0.4, -0.4, 4.2, 0); k.quadraticCurveTo(0.4, 0.4, 0, 4.2);
      k.quadraticCurveTo(-0.4, 0.4, -4.2, 0); k.quadraticCurveTo(-0.4, -0.4, 0, -4.2); k.closePath();
    }, C.white, { ol: 0.6 });
  }
  const dropPath = (k) => { k.moveTo(0, -3.2); k.bezierCurveTo(1.0, -1.6, 2.0, -0.4, 2.0, 0.8); k.arc(0, 0.8, 2.0, 0, PI); k.bezierCurveTo(-2.0, -0.4, -1.0, -1.6, 0, -3.2); k.closePath(); };
  function dropParts(P, white) {
    P.part(dropPath, white ? C.white : INK, { ol: 0.55, shade: white ? C.g4 : INK, sh: [-0.4, -0.4], hi: [-0.7, 0.4, 0.45, 0.7, 0.2] });
  }

  /* ================================================================== props */
  function treeParts(P, v) {
    if (v === 2) { // bare curly tree
      P.hose((k) => { k.moveTo(0, 0); k.bezierCurveTo(-2.4, -8, 2.6, -15, 0.2, -24); }, 3.4, C.g1);
      const br = (x0, y0, x1, y1, cx, cy, dir, w) => P.hose((k) => { k.moveTo(x0, y0); k.quadraticCurveTo(cx, cy, x1, y1); spiral(k, x1 + dir * 1.6, y1, 1.6, 0.3, 0.8, dir > 0 ? PI : 0, 1); }, w, C.g1);
      br(0.4, -16, -10.6, -27, -6.6, -16.4, 1, 1.8);
      br(0.6, -19, 10.8, -30.4, 7.6, -19.4, -1, 1.7);
      br(0.2, -23.4, -4.6, -36.6, -4.4, -27.6, 1, 1.4);
      br(0.3, -23.6, 5.4, -38.6, 4.2, -30.6, -1, 1.3);
      P.part(E(0, -0.4, 3.8, 1.3), C.g1, {});
      P.detail((k) => { k.strokeStyle = C.g2; k.lineWidth = 0.5; k.beginPath(); k.moveTo(0.6, -2); k.bezierCurveTo(-0.8, -8, 1.8, -14, 0.6, -21); k.stroke(); });
      return;
    }
    P.hose((k) => { k.moveTo(0, 0); k.bezierCurveTo(-2.6, -7, 3.0, -13, 0.6, -24); }, 3.3, C.g1);
    P.part(E(0, -0.4, 3.6, 1.3), C.g1, {});
    P.detail((k) => { k.strokeStyle = C.g2; k.lineWidth = 0.5; k.beginPath(); k.moveTo(0.6, -2); k.bezierCurveTo(-1.0, -8, 1.8, -13, 0.8, -19); k.stroke(); });
    if (v === 1) { // tall swirled poplar
      const sh = (k) => { k.moveTo(0.6, -20); k.bezierCurveTo(-10.4, -21, -8.6, -38, -1.4, -48.4); k.quadraticCurveTo(1.8, -51.4, 3.0, -48.0); k.bezierCurveTo(9.6, -38, 11.4, -21, 0.6, -20); k.closePath(); };
      P.part(sh, C.g2, {
        shade: C.shortsSh, sh: [-2.2, -1.6],
        detail(k) {
          k.strokeStyle = INK; k.lineWidth = 0.6;
          k.beginPath();
          for (let i = 0; i < 4; i++) { const y = -24.6 - i * 6.4, w = 7.6 - i * 1.4; k.moveTo(-w, y + 1.2); k.quadraticCurveTo(0, y - 3.0, w, y + 1.4); }
          k.stroke();
          k.beginPath(); spiral(k, 1.6, -45.4, 0.3, 1.8, 0.9, 0, 1); k.stroke();
          k.strokeStyle = C.g3; k.lineWidth = 0.6; k.beginPath(); k.arc(-1.0, -36, 5.0, PI * 1.05, PI * 1.35); k.stroke();
        },
      });
      return;
    }
    const can = [[0.4, -32.4, 9.6], [-7.8, -28.8, 6.4], [8.4, -29.4, 6.3], [-4.6, -37.6, 6.2], [5.4, -38.0, 6.0], [0.4, -25.6, 6.6]];
    P.part((k) => { for (const q of can) E(q[0], q[1], q[2], q[2] * 0.94)(k); }, C.g3, {
      shade: C.g2, sh: [-2.6, -2.4],
      detail(k) {
        k.strokeStyle = INK; k.lineWidth = 0.55;
        for (const s of [[-4.8, -30.6, 1.0], [4.6, -33.4, 1.1], [-0.4, -38.2, 0.9], [6.8, -27.0, 0.8], [-7.4, -26.0, 0.8]]) {
          k.beginPath(); spiral(k, s[0], s[1], 0.3, 2.2 * s[2], 1.05, s[0] > 0 ? 0 : PI, 0.9); k.stroke();
        }
        k.strokeStyle = C.g4; k.lineWidth = 0.7;
        k.beginPath(); k.arc(-4.6, -37.6, 4.0, PI * 1.05, PI * 1.45); k.arc(0.4, -32.4, 7.4, PI * 1.18, PI * 1.36); k.stroke();
      },
    });
  }
  function houseParts(P, v) {
    if (v === 1) { // tall crooked house
      P.part((k) => roundPoly(k, [[-7.6, 0.4], [-8.6, -27.4], [7.0, -28.6], [8.0, 0.4]], 0.9), C.paper, {
        shade: C.g4, sh: [-1.6, 0], inner: IL,
        detail(k) {
          k.strokeStyle = C.g3; k.lineWidth = 0.4; k.beginPath();
          for (let y = -3; y > -27; y -= 3.2) { k.moveTo(-7.8, y); k.lineTo(7.4, y - 0.5); }
          k.stroke();
          k.fillStyle = INK; k.beginPath(); roundPoly(k, [[-2.0, 0.4], [-2.0, -7.2], [2.4, -7.4], [2.4, 0.4]], 1.6); k.fill();
          k.fillStyle = C.paper; k.beginPath(); k.arc(1.4, -3.6, 0.4, 0, TAU); k.fill();
          winFace(k, -3.6, -16.4, 3.0, 3.8); winFace(k, 3.4, -16.8, 3.0, 3.8);
        },
      });
      P.part((k) => roundPoly(k, [[-10.6, -25.6], [-1.2, -45.4], [1.0, -45.8], [9.8, -27.0]], 1.5), C.g1, {
        shade: INK, sh: [-1.4, -0.6],
        detail(k) {
          k.strokeStyle = C.g2; k.lineWidth = 0.5; k.beginPath();
          for (let i = 1; i < 6; i++) { const y = -27.0 - i * 3.3; const w = 9.6 * (1 - i / 6.2); for (let x = -w; x < w - 0.5; x += 2.4) { k.moveTo(x, y); k.arc(x + 1.2, y, 1.2, PI, 0, true); } }
          k.stroke();
          k.fillStyle = C.paper; k.strokeStyle = INK; k.lineWidth = 0.45; k.beginPath(); k.arc(-0.2, -35.4, 2.0, 0, TAU); k.fill(); k.stroke();
          k.beginPath(); k.moveTo(-2.2, -35.4); k.lineTo(1.8, -35.4); k.moveTo(-0.2, -37.4); k.lineTo(-0.2, -33.4); k.stroke();
        },
      });
      return;
    }
    // walls
    P.part((k) => roundPoly(k, [[-11.4, 0.4], [-11.8, -15.6], [11.2, -16.4], [11.8, 0.4]], 1.0), C.paper, {
      shade: C.g4, sh: [-2.0, 0], inner: IL,
      detail(k) {
        k.strokeStyle = C.g3; k.lineWidth = 0.4; k.beginPath();
        for (const p of [[-9.6, -3.4], [7.0, -5.6], [-6.4, -13.2], [8.8, -12.0]]) { k.moveTo(p[0], p[1]); k.lineTo(p[0] + 2.4, p[1] - 0.1); k.moveTo(p[0] + 1.0, p[1] + 1.4); k.lineTo(p[0] + 3.2, p[1] + 1.3); }
        k.stroke();
        // door = mouth, windows = eyes
        k.fillStyle = INK; k.beginPath(); roundPoly(k, [[-2.4, 0.4], [-2.6, -8.6], [2.6, -8.8], [2.6, 0.4]], 2.0); k.fill();
        k.fillStyle = C.paper; k.beginPath(); k.arc(1.5, -4.0, 0.45, 0, TAU); k.fill();
        winFace(k, -7.2, -9.6, 3.8, 4.2); winFace(k, 6.8, -10.0, 3.8, 4.2);
      },
    });
    // chimney
    P.part((k) => roundPoly(k, [[4.4, -20.0], [4.8, -32.0], [9.2, -31.4], [8.4, -18.0]], 0.6), C.g2, {
      shade: C.shortsSh, sh: [-1.0, 0], inner: IL,
      detail(k) { k.fillStyle = INK; k.fillRect(4.4, -32.6, 5.2, 1.4); },
    });
    // roof
    P.part((k) => roundPoly(k, [[-15.2, -13.4], [-1.4, -31.4], [1.6, -31.8], [15.0, -14.6]], 2.0), C.g1, {
      shade: INK, sh: [-1.6, -0.8], inner: IL,
      detail(k) {
        k.strokeStyle = C.g2; k.lineWidth = 0.55; k.beginPath();
        for (let i = 1; i < 6; i++) { const y = -14.6 - i * 3.0; const w = 14.2 * (1 - i / 6.0); for (let x = -w; x < w - 0.8; x += 2.8) { k.moveTo(x, y); k.arc(x + 1.4, y, 1.4, PI, 0, true); } }
        k.stroke();
      },
    });
  }
  /** A window drawn like a sleepy eye: pale pane, ink frame cross, half-drawn shade as an eyelid. */
  function winFace(k, x, y, w, h) {
    k.fillStyle = C.white; k.strokeStyle = INK; k.lineWidth = 0.55;
    k.beginPath(); rrect(k, x - w / 2, y - h / 2, w, h, 0.4); k.fill();
    k.fillStyle = C.g2; k.fillRect(x - w / 2, y - h / 2, w, h * 0.42);
    k.beginPath(); rrect(k, x - w / 2, y - h / 2, w, h, 0.4); k.stroke();
    k.lineWidth = 0.4; k.beginPath(); k.moveTo(x, y - h / 2); k.lineTo(x, y + h / 2); k.moveTo(x - w / 2, y + h * 0.12); k.lineTo(x + w / 2, y + h * 0.12); k.stroke();
    k.fillStyle = C.g3; k.fillRect(x - w / 2 - 0.6, y + h / 2, w + 1.2, 0.9);
  }
  function fenceParts(P) {
    P.part((k) => roundPoly(k, [[-17.8, -10.4], [17.6, -11.4], [17.8, -9.0], [-17.8, -8.2]], 0.6), C.g3, { shade: C.g2, sh: [0, -0.7] });
    P.part((k) => roundPoly(k, [[-17.8, -5.0], [17.6, -5.6], [17.8, -3.4], [-17.8, -2.8]], 0.6), C.g3, { shade: C.g2, sh: [0, -0.7] });
    const tilt = [-0.08, 0.05, -0.03, 0.09, -0.05];
    [-14.4, -7.2, 0, 7.2, 14.4].forEach((x, i) => {
      const a = tilt[i], h = 14.2 + (i % 2) * 1.2;
      const p = [[-1.5, 0.4], [-1.5, -h + 1.8], [0, -h], [1.5, -h + 1.8], [1.5, 0.4]].map((q) => [x + q[0] + q[1] * a * -1, q[1]]);
      P.part((k) => roundPoly(k, p, 0.5), C.white, { shade: C.g4, sh: [-0.9, 0], inner: IL * 0.8 });
    });
  }
  function daisyParts(P) {
    const heads = [[-6.0, -13.6, 0.9, -0.2], [1.2, -19.6, 1.05, 0.1], [7.2, -12.0, 0.85, 0.25]];
    for (const h of heads) {
      P.hose((k) => { k.moveTo(h[0] * 0.3, 0.2); k.quadraticCurveTo(h[0] * 0.9 - 1.6, h[1] * 0.5, h[0], h[1]); }, 0.75, INK);
    }
    P.part((k) => { k.moveTo(-0.6, 0); k.bezierCurveTo(-6.8, -1.2, -8.6, -5.4, -6.4, -6.0); k.bezierCurveTo(-4.4, -4.4, -2.4, -2.6, -0.6, 0); k.closePath(); }, C.g2, { shade: C.shortsSh, sh: [-0.4, -0.4] });
    P.part((k) => { k.moveTo(0.6, 0); k.bezierCurveTo(6.4, -1.0, 8.4, -4.6, 6.6, -5.6); k.bezierCurveTo(4.6, -4.2, 2.2, -2.4, 0.6, 0); k.closePath(); }, C.g2, { shade: C.shortsSh, sh: [-0.4, -0.4] });
    for (const h of heads) {
      const s = h[2];
      P.part((k) => { for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + h[3]; E(h[0] + Math.cos(a) * 3.0 * s, h[1] + Math.sin(a) * 2.8 * s, 1.9 * s, 1.15 * s, a)(k); } }, C.white, { ol: 0.75, shade: C.g4, sh: [-0.5, -0.5] });
      P.part(E(h[0], h[1], 2.1 * s, 2.0 * s), INK, {
        detail(k) {
          k.fillStyle = C.white;
          k.beginPath(); k.ellipse(h[0] - 0.7 * s, h[1] - 0.5 * s, 0.38 * s, 0.6 * s, 0, 0, TAU); k.ellipse(h[0] + 0.7 * s, h[1] - 0.5 * s, 0.38 * s, 0.6 * s, 0, 0, TAU); k.fill();
          k.strokeStyle = C.white; k.lineWidth = 0.35 * s; k.beginPath(); k.arc(h[0], h[1] + 0.2 * s, 1.0 * s, PI * 0.2, PI * 0.8); k.stroke();
        },
      });
    }
  }
  function hillParts(P, v) {
    const w = v ? 15 : 21, h = v ? 9.5 : 12.5;
    const path = (k) => { k.moveTo(-w, 0.4); k.bezierCurveTo(-w * 0.86, -h * 0.9, -w * 0.4, -h * 1.05, 0, -h); k.bezierCurveTo(w * 0.45, -h * 0.98, w * 0.9, -h * 0.8, w, 0.4); k.quadraticCurveTo(0, 2.0, -w, 0.4); k.closePath(); };
    P.part(path, C.g3, {
      shade: C.g2, sh: [-3.0, -2.2],
      detail(k) {
        k.strokeStyle = C.g4; k.lineWidth = 0.9; k.beginPath(); k.moveTo(-w * 0.7, -h * 0.62); k.bezierCurveTo(-w * 0.45, -h * 0.92, -w * 0.15, -h * 0.97, w * 0.1, -h * 0.94); k.stroke();
        k.strokeStyle = INK; k.lineWidth = 0.5; k.beginPath();
        const r = U.rng(31 + v);
        for (let i = 0; i < 6; i++) {
          const x = -w * 0.7 + (i / 5) * w * 1.4 + r.range(-1, 1), y = -h * (0.95 - Math.pow(x / w, 2) * 0.9) + 0.6;
          k.moveTo(x - 0.9, y); k.lineTo(x - 1.5, y - 1.6); k.moveTo(x, y); k.lineTo(x + 0.1, y - 2.0); k.moveTo(x + 0.9, y); k.lineTo(x + 1.6, y - 1.5);
        }
        k.stroke();
        k.beginPath(); spiral(k, w * 0.35, -h * 0.42, 0.3, 1.6, 1.0, 0, 0.8); k.stroke();
      },
    });
  }
  function lampParts(P) {
    P.part((k) => roundPoly(k, [[-3.4, 0.4], [-2.0, -4.0], [2.0, -4.0], [3.4, 0.4]], 0.6), INK, {});
    P.hose((k) => { k.moveTo(0, -3); k.lineTo(0, -30); }, 1.5, INK);
    P.hose((k) => { k.moveTo(0, -24); k.quadraticCurveTo(-3.6, -25.6, -3.2, -28.6); spiral(k, -2.2, -28.6, 1.0, 0.2, 0.8, PI, 1); k.moveTo(0, -24); k.quadraticCurveTo(3.6, -25.6, 3.2, -28.6); spiral(k, 2.2, -28.6, 1.0, 0.2, 0.8, 0, 1); }, 0.7, INK);
    P.part((k) => roundPoly(k, [[-2.8, -30.0], [2.8, -30.0], [3.8, -37.2], [-3.8, -37.2]], 0.5), C.white, {
      detail(k) {
        k.fillStyle = '#fffdf6'; k.beginPath(); k.ellipse(0, -33.6, 1.6, 2.4, 0, 0, TAU); k.fill();
        k.strokeStyle = INK; k.lineWidth = 0.4; k.beginPath(); k.moveTo(0, -30); k.lineTo(0, -37.2); k.stroke();
      },
    });
    P.part((k) => { k.moveTo(-5.0, -37.0); k.lineTo(0, -41.0); k.lineTo(5.0, -37.0); k.closePath(); }, INK, {});
    P.part(E(0, -41.6, 0.9, 0.9), INK, {});
  }
  function barrelParts(P, v) {
    if (v === 1) { // crate
      P.part((k) => roundPoly(k, [[-7.6, 0.4], [-7.6, -12.4], [7.6, -12.4], [7.6, 0.4]], 0.7), C.g3, {
        shade: C.g2, sh: [-1.6, 0], inner: IL,
        detail(k) {
          k.strokeStyle = INK; k.lineWidth = 0.5; k.beginPath(); k.rect(-6.2, -11.0, 12.4, 10.0); k.moveTo(-6.2, -11.0); k.lineTo(6.2, -1.0); k.moveTo(6.2, -11.0); k.lineTo(-6.2, -1.0); k.stroke();
        },
      });
      return;
    }
    const body = (k) => { k.moveTo(-5.6, 0.4); k.bezierCurveTo(-8.0, -4.6, -8.0, -10.0, -5.6, -14.6); k.lineTo(5.6, -14.6); k.bezierCurveTo(8.0, -10.0, 8.0, -4.6, 5.6, 0.4); k.closePath(); };
    P.part(body, C.g2, {
      shade: C.shortsSh, sh: [-2.0, 0], inner: IL,
      detail(k) {
        k.strokeStyle = C.g3; k.lineWidth = 0.45; k.beginPath(); for (const x of [-3.4, -0.4, 2.6]) { k.moveTo(x, -14); k.quadraticCurveTo(x * 1.3, -7, x, 0); } k.stroke();
        k.strokeStyle = INK; k.lineWidth = 1.1; k.beginPath(); k.moveTo(-7.0, -3.6); k.quadraticCurveTo(0, -2.6, 7.0, -3.6); k.moveTo(-7.0, -11.2); k.quadraticCurveTo(0, -10.2, 7.0, -11.2); k.stroke();
      },
    });
    P.part(E(0, -14.6, 5.6, 1.6), C.g3, { shade: C.g2, sh: [0, 0.6], inner: IL });
  }
  function shroomParts(P, v) {
    const one = (x, s) => {
      P.part((k) => roundPoly(k, [[x - 1.9 * s, 0.4], [x - 1.4 * s, -6.6 * s], [x + 1.4 * s, -6.6 * s], [x + 1.9 * s, 0.4]], 0.8 * s), C.paper, { shade: C.g4, sh: [-0.7 * s, 0] });
      P.part((k) => {
        k.moveTo(x - 5.8 * s, -5.6 * s);
        k.bezierCurveTo(x - 6.0 * s, -10.8 * s, x - 2.6 * s, -12.6 * s, x, -12.6 * s);
        k.bezierCurveTo(x + 2.6 * s, -12.6 * s, x + 6.0 * s, -10.8 * s, x + 5.8 * s, -5.6 * s);
        k.quadraticCurveTo(x, -4.0 * s, x - 5.8 * s, -5.6 * s); k.closePath();
      }, C.g1, {
        shade: INK, sh: [-1.2 * s, -1.0 * s], inner: IL,
        detail(k) {
          k.fillStyle = C.paper;
          for (const p of [[-2.6, -9.8, 1.1], [1.6, -10.8, 0.9], [3.6, -7.6, 0.75], [-0.4, -7.2, 0.65]]) { k.beginPath(); k.arc(x + p[0] * s, p[1] * s, p[2] * s, 0, TAU); k.fill(); }
        },
        hi: [x - 3.0 * s, -10.8 * s, 1.0 * s, 0.45 * s, -0.7],
      });
    };
    if (v) { one(-4.6, 0.65); one(4.4, 0.72); one(0, 0.95); } else { one(-3.6, 0.72); one(2.2, 1.0); }
  }
  /** Cattails at the water's edge: blade leaves, bowed stalks with ink heads (v1: taller, sparser). */
  function reedParts(P, v) {
    const leaf = (x, h, dir) => (k) => { k.moveTo(x - 0.9, 0.3); k.quadraticCurveTo(x + dir * 1.0, -h * 0.55, x + dir * h * 0.42, -h); k.quadraticCurveTo(x + dir * 2.2, -h * 0.48, x + 0.9, 0.3); k.closePath(); };
    P.part(leaf(-2.4, v ? 13 : 11, -1), C.g2, { shade: C.shortsSh, sh: [-0.5, 0] });
    P.part(leaf(2.8, v ? 9.5 : 10.5, 1), C.g2, { shade: C.shortsSh, sh: [-0.5, 0] });
    const st = v ? [[-1.6, -21.5, -0.1, 1], [1.8, -17.0, 0.16, 0], [4.6, -12.5, 0.3, 1]] : [[-5.0, -14.0, -0.24, 1], [-1.4, -20.0, -0.06, 1], [1.8, -17.6, 0.08, 1], [4.8, -12.6, 0.26, 0]];
    for (const s of st) {
      const tx = s[0] + s[2] * 9, ty = s[1];
      P.hose((k) => { k.moveTo(s[0] * 0.35, 0.2); k.quadraticCurveTo(s[0] * 0.8, ty * 0.5, tx, ty); }, 0.7, INK);
      if (!s[3]) continue;
      P.part(E(tx - s[2] * 2.6, ty + 3.2, 1.3, 3.0, s[2]), C.g1, { inner: IL * 0.6, hi: [tx - s[2] * 2.6 - 0.5, ty + 2.2, 0.35, 1.2, s[2]], hiA: 0.55 });
    }
    if (v) P.part(leaf(0.4, 8, -1), C.g3, { shade: C.g2, sh: [-0.4, 0] });
  }
  /** A windmill: tapered plank tower with a door "mouth" and an eye window, dark cap; the sails are a separate sprite. */
  function millParts(P) {
    const body = (k) => { k.moveTo(-9.6, 0.4); k.lineTo(-6.0, -38.4); k.quadraticCurveTo(0, -39.8, 6.0, -38.4); k.lineTo(9.6, 0.4); k.quadraticCurveTo(0, 1.8, -9.6, 0.4); k.closePath(); };
    P.part(body, C.paper, {
      shade: C.g4, sh: [-2.4, 0], inner: IL,
      detail(k) {
        k.strokeStyle = C.g3; k.lineWidth = 0.45; k.beginPath();
        for (let y = -4; y > -37; y -= 3.4) { const w = 9.6 - (-y / 38.4) * 3.6; k.moveTo(-w + 0.4, y); k.quadraticCurveTo(0, y + 0.8, w - 0.4, y); }
        k.stroke();
        k.fillStyle = INK; k.beginPath(); roundPoly(k, [[-2.7, 0.7], [-2.7, -7.4], [2.7, -7.4], [2.7, 0.7]], 2.3); k.fill();
        k.fillStyle = C.paper; k.beginPath(); k.arc(1.6, -3.4, 0.45, 0, TAU); k.fill();
        winFace(k, 0.5, -21.5, 3.6, 4.2);
      },
    });
    P.part((k) => { k.moveTo(-8.8, -37.0); k.bezierCurveTo(-8.6, -48.0, 8.6, -48.0, 8.8, -37.0); k.quadraticCurveTo(0, -35.2, -8.8, -37.0); k.closePath(); }, C.g1, {
      shade: INK, sh: [-1.6, -0.9], inner: IL,
      detail(k) { k.strokeStyle = C.g2; k.lineWidth = 0.5; k.beginPath(); for (const x of [-4.4, 0, 4.4]) { k.moveTo(x * 1.2, -36.6); k.quadraticCurveTo(x * 1.05, -42, x * 0.4, -45.6); } k.stroke(); shine(k, [-3.8, -43.0, 1.8, 0.7, -0.5], 0.7); },
    });
    P.hose((k) => { k.moveTo(0, -45.6); k.lineTo(0, -49.0); }, 0.6, INK);
    P.part(E(0, -49.6, 0.95, 0.95), INK, {});
  }
  function bladesParts(P) {
    for (let i = 0; i < 4; i++) {
      const a = i * (PI / 2) + 0.3, co = Math.cos(a), si = Math.sin(a), px = -si, py = co;
      const q = (d, w) => [co * d + px * w, si * d + py * w];
      P.hose((k) => { k.moveTo(0, 0); k.lineTo(co * 16, si * 16); }, 1.0, INK);
      const pts = [q(3.6, 0.5), q(15.8, 0.5), q(15.8, 4.6), q(4.6, 3.3)];
      P.part((k) => roundPoly(k, pts, 0.4), C.white, {
        shade: C.g4, sh: [-0.4, -0.4], inner: IL * 0.7,
        detail(k) {
          k.strokeStyle = INK; k.lineWidth = 0.32; k.beginPath();
          for (let d = 6.4; d < 15.5; d += 3.0) { const p0 = q(d, 0.5), p1 = q(d, 3.3 + ((d - 4.6) / 11.2) * 1.3); k.moveTo(p0[0], p0[1]); k.lineTo(p1[0], p1[1]); }
          const m1 = q(4.2, 1.9), m2 = q(15.8, 2.5); k.moveTo(m1[0], m1[1]); k.lineTo(m2[0], m2[1]);
          k.stroke();
        },
      });
    }
    P.part(E(0, 0, 2.1, 2.1), C.g2, { shade: C.g1, sh: [-0.4, -0.4], hi: [-0.6, -0.7, 0.6, 0.35, -0.5] });
  }
  /* box = sprite bounds, sh = contact shadow radii, sw = sway amount, sq = beat squash, lag = beat delay (tall things follow through) */
  const PROP_DEF = {
    tree: { n: 3, box: [-19, -54, 19, 2], fn: treeParts, sh: [14, 4.6], sw: 0.045, sq: 0.04, lag: 0.07 },
    house: { n: 2, box: [-18, -49, 18, 2], fn: houseParts, sh: [16, 4.8], sw: 0.025, sq: 0.05, lag: 0.03 },
    mill: { n: 1, box: [-13, -52, 13, 2], fn: millParts, sh: [12, 4.0], sw: 0.02, sq: 0.035, lag: 0.05 },
    fence: { n: 1, box: [-20, -18, 20, 2], fn: fenceParts, sh: [18, 2.6], sw: 0.03, sq: 0.0, lag: 0 },
    daisies: { n: 1, box: [-12, -25, 12, 2], fn: daisyParts, sh: [8, 2.4], sw: 0.09, sq: 0.07, lag: 0.02 },
    reeds: { n: 2, box: [-12, -27, 12, 2], fn: reedParts, sh: [7, 2.0], sw: 0.12, sq: 0.03, lag: 0.1 },
    hill: { n: 2, box: [-23, -16, 23, 3], fn: hillParts, sh: [20, 4.4], sw: 0, sq: 0.025, lag: 0 },
    lamp: { n: 1, box: [-7, -44, 7, 2], fn: lampParts, sh: [5, 1.8], sw: 0.03, sq: 0.03, lag: 0.06 },
    barrel: { n: 2, box: [-10, -18, 10, 2], fn: barrelParts, sh: [8, 2.6], sw: 0, sq: 0.05, lag: 0 },
    shroom: { n: 2, box: [-11, -16, 11, 2], fn: shroomParts, sh: [8, 2.4], sw: 0, sq: 0.08, lag: 0.01 },
  };
  const PAD = { tree: 70, house: 70, mill: 75, lamp: 50 };
  /* ================================================================ ground
     Flat grey washes. Smooth noise fields on a coarse grid; per-pixel signed distance
     (value / gradient) gives crisp anti-aliased region edges, a lighter inner rim
     ("raised" hill edge) and a centred ink contour line.                              */
  const GSTEP = 4;
  const BASE = [207, 200, 185];
  const INKC = [22, 18, 14];
  const LAY = [ // bottom -> top; c2 = an inner, fainter contour line; ink = weight of the edge line (line hierarchy)
    { fill: [189, 182, 166], rim: [198, 191, 176], rw: 3.0, c2: 0, ink: 0.42 },     // meadow wash – soft, thin edge
    { fill: [150, 142, 127], rim: [170, 162, 147], rw: 3.4, c2: 6.0, ink: 0.95 },   // rolling hills – ink edge + inner ring
    { fill: [229, 222, 206], rim: [214, 206, 190], rw: 1.8, c2: 0, ink: 0.95 },     // the road
    { fill: [78, 72, 64], rim: [110, 103, 92], rw: 3.0, c2: 4.2, ink: 1.0 },        // ponds – shore ring
  ];
  const LINE_W = 0.8; // ink contour width (world units)
  const NF = 5;
  /* Every region is a (roughly) signed distance field in world units: > 0 inside.
     Hills: one lobed oval per jittered 400-unit cell (55 % of the cells), union of the neighbours.
     Road: the zero line of a warped noise, divided by its gradient -> a constant width (~21 units).
     Ponds: lobed ovals on a 560-unit grid, cut back from the road and the hills.                  */
  const HC = 400, PC = 560;
  const HL = [{ x: 0, y: 0, h: 0 }, { x: 0, y: 0, h: 0 }];
  /** The hill lobes of a cell (0, 1 or 2) into HL-like array o; lobe = {x, y, h}. */
  function hillCell(cx, cy, o) {
    const h = U.hashInt(cx, cy, 7717);
    if ((h & 255) > 140) return 0;
    const h2 = U.hashInt(cx, cy, 7718);
    const a = o[0];
    a.h = h; a.x = (cx + 0.3 + 0.4 * ((h2 & 1023) / 1023)) * HC; a.y = (cy + 0.3 + 0.4 * (((h2 >>> 10) & 1023) / 1023)) * HC;
    if (((h2 >>> 20) & 3) !== 0) return 1;
    // ridge: a second, smaller lobe overlapping the first
    const b = o[1], an = (((h2 >>> 22) & 255) / 255) * TAU, r0 = hillRad(h, an) * 0.85;
    b.h = (U.hashInt(cx, cy, 7719) & 0xffff7fff) >>> 0;
    b.x = a.x + Math.cos(an) * r0; b.y = a.y + (Math.sin(an) * r0) / 1.3;
    return 2;
  }
  function hillRad(h, a) {
    const u = ((h >>> 8) & 255) / 255, base = (0.13 + 0.19 * u * u) * HC, p = (((h >>> 16) & 255) / 255) * TAU;
    return base * (1 + 0.15 * Math.sin(2 * a + p) + 0.07 * Math.sin(3 * a + p * 1.7));
  }
  function hillField(x, y) {
    const cx0 = Math.floor(x / HC), cy0 = Math.floor(y / HC);
    let best = -1e9;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const n = hillCell(cx0 + i, cy0 + j, HL);
        for (let l = 0; l < n; l++) {
          const o = HL[l], dx = x - o.x, dy = (y - o.y) * 1.3, d = Math.sqrt(dx * dx + dy * dy);
          if (0.38 * HC - d <= best) continue;
          const f = hillRad(o.h, Math.atan2(dy, dx)) - d;
          if (f > best) best = f;
        }
      }
    }
    return best;
  }
  const PO = { x: 0, y: 0, h: 0 };
  function pondCell(cx, cy, o) {
    const h = U.hashInt(cx, cy, 6161);
    if ((h & 255) > 90) return false;
    const h2 = U.hashInt(cx, cy, 6162);
    o.h = h; o.x = (cx + 0.25 + 0.5 * ((h2 & 1023) / 1023)) * PC; o.y = (cy + 0.25 + 0.5 * (((h2 >>> 10) & 1023) / 1023)) * PC;
    return true;
  }
  function pondRad(h, a) {
    const base = 40 + 42 * (((h >>> 8) & 255) / 255), p = (((h >>> 16) & 255) / 255) * TAU;
    return base * (1 + 0.17 * Math.sin(2 * a + p) + 0.08 * Math.sin(3 * a - p));
  }
  function pondRaw(x, y) {
    const cx0 = Math.floor(x / PC), cy0 = Math.floor(y / PC);
    let best = -1e9;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        if (!pondCell(cx0 + i, cy0 + j, PO)) continue;
        const dx = x - PO.x, dy = (y - PO.y) * 1.35, d = Math.sqrt(dx * dx + dy * dy);
        if (110 - d <= best) continue;
        const f = pondRad(PO.h, Math.atan2(dy, dx)) - d;
        if (f > best) best = f;
      }
    }
    return best;
  }
  function pathN(x, y) {
    const qx = U.perlin(x / 480, y / 480, 325) * 60, qy = U.perlin(x / 480 + 5.1, y / 480, 326) * 60;
    return U.perlin((x + qx) / 1500, (y + qy) / 1500, 324);
  }
  function pathField(x, y) {
    const n0 = pathN(x, y), nx = pathN(x + 3, y), ny = pathN(x, y + 3);
    const g = Math.sqrt((nx - n0) * (nx - n0) + (ny - n0) * (ny - n0)) / 3 + 1e-7;
    return 10.5 + U.perlin(x / 230, y / 230, 327) * 2.2 - Math.abs(n0) / g;
  }
  function fieldsAt(x, y, out) {
    const wx = U.perlin(x / 900, y / 900, 811) * 90, wy = U.perlin(x / 900 + 9.2, y / 900, 812) * 90;
    out[0] = (U.fbm((x + wx) / 620 + 3.3, (y + wy) / 620, 121, 2) - 0.585) * 240;
    const hf = hillField(x, y), pf = pathField(x, y);
    out[1] = hf;
    out[2] = pf;
    out[3] = Math.min(pondRaw(x, y), -pf - 16, -hf - 12);
    out[4] = 1 + (U.noise(x / 1400, y / 1400, 626) - 0.5) * 0.08;
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
  /** Visit every cell of a `cell` grid whose content may reach the chunk (reach = max distance from its cell). */
  function forCells(info, cell, reach, fn) {
    const x0 = Math.floor((info.wx - reach) / cell), x1 = Math.floor((info.wx + info.size + reach) / cell);
    const y0 = Math.floor((info.wy - reach) / cell), y1 = Math.floor((info.wy + info.size + reach) / cell);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) fn(cx, cy);
  }
  /** Flower patches: one per 150-unit cell at most, on plain meadow – shared by decals and props. */
  const PATCH = 150;
  function patchAt(cx, cy, o) {
    const h = U.hashInt(cx, cy, 5151);
    if ((h & 255) > 92) return false;
    o.h = h; o.x = (cx + 0.2 + 0.6 * (((h >>> 8) & 255) / 255)) * PATCH; o.y = (cy + 0.2 + 0.6 * (((h >>> 16) & 255) / 255)) * PATCH;
    return matSafe(o.x, o.y, 10) === 0;
  }
  const pack = (r, g, b) => (255 << 24) | ((b < 0 ? 0 : b > 255 ? 255 : b | 0) << 16) | ((g < 0 ? 0 : g > 255 ? 255 : g | 0) << 8) | (r < 0 ? 0 : r > 255 ? 255 : r | 0);

  // ink decals --------------------------------------------------------------
  function dTuft(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(x - 0.6 * s, y); c.quadraticCurveTo(x - 1.1 * s, y - 1.3 * s, x - 2.0 * s, y - 2.1 * s);
    c.moveTo(x, y); c.quadraticCurveTo(x + 0.2 * s, y - 1.7 * s, x - 0.1 * s, y - 3.0 * s);
    c.moveTo(x + 0.6 * s, y); c.quadraticCurveTo(x + 1.1 * s, y - 1.2 * s, x + 2.0 * s, y - 1.9 * s);
    c.stroke();
  }
  function dReed(c, x, y, s, b) {
    c.strokeStyle = 'rgba(22,18,14,0.85)'; c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(x - 0.5 * s, y); c.quadraticCurveTo(x - 0.8 * s, y - 2.2 * s, x - 1.7 * s + b, y - 4.0 * s);
    c.moveTo(x, y); c.quadraticCurveTo(x + 0.1 * s, y - 2.9 * s, x + 0.3 * s + b, y - 5.4 * s);
    c.moveTo(x + 0.5 * s, y); c.quadraticCurveTo(x + 1.2 * s, y - 1.6 * s, x + 2.5 * s + b, y - 2.7 * s);
    c.stroke();
  }
  function dCurl(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = 0.45;
    c.beginPath(); spiral(c, x, y, 0.25 * s, 1.9 * s, 1.15, 0, 0.75); c.stroke();
  }
  function dDaisy(c, x, y, s) {
    c.fillStyle = INK; c.beginPath();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - PI / 2, px = x + Math.cos(a) * 0.95 * s, py = y + Math.sin(a) * 0.95 * s; c.moveTo(px + 0.95 * s, py); c.arc(px, py, 0.95 * s, 0, TAU); }
    c.fill();
    c.fillStyle = C.white; c.beginPath();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - PI / 2, px = x + Math.cos(a) * 0.95 * s, py = y + Math.sin(a) * 0.95 * s; c.moveTo(px + 0.62 * s, py); c.arc(px, py, 0.62 * s, 0, TAU); }
    c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(x, y, 0.55 * s, 0, TAU); c.fill();
  }
  function dPebble(c, x, y, rx, ry, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = C.paper; c.strokeStyle = INK; c.lineWidth = 0.4;
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = C.g4; c.beginPath(); c.ellipse(rx * 0.25, ry * 0.3, rx * 0.55, ry * 0.45, 0, 0, TAU); c.fill();
    c.restore();
  }
  function dDash(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = 0.45;
    c.beginPath(); c.moveTo(x - 1.4 * s, y); c.quadraticCurveTo(x, y - 0.4 * s, x + 1.4 * s, y); c.stroke();
  }
  function dRipple(c, x, y, s) {
    c.strokeStyle = 'rgba(239,233,220,0.7)'; c.lineWidth = 0.55;
    c.beginPath(); c.ellipse(x, y, 3.2 * s, 1.1 * s, 0, PI * 1.1, PI * 1.9); c.stroke();
    c.beginPath(); c.ellipse(x + 1.0 * s, y + 1.4 * s, 2.0 * s, 0.7 * s, 0, PI * 1.15, PI * 1.85); c.stroke();
  }
  function dLily(c, x, y, s, rot) {
    c.fillStyle = C.g2; c.strokeStyle = INK; c.lineWidth = 0.45;
    c.beginPath(); c.moveTo(x, y); c.ellipse(x, y, 2.6 * s, 1.5 * s, 0, rot + 0.35, rot + TAU - 0.35); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = C.g3; c.lineWidth = 0.3; c.beginPath(); c.ellipse(x, y, 1.7 * s, 0.9 * s, 0, rot + PI * 0.9, rot + PI * 1.5); c.stroke();
  }

  /* Decals are placed by the regions, not sprinkled: hatching on the shadow side of each hill and a shine
     on its lit side, grass clumps at the foot of hills and along the road shoulders, reeds at the water's
     edge, pebbles lining the road, ripples and lily pads on ponds, flower patches in the open meadow.
     Large calm areas stay empty. mx = max of every field over the chunk (cheap pre-checks).            */
  function* decals(ctx, info, mx) {
    const F2 = new Float32Array(NF);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const H2 = [{ x: 0, y: 0, h: 0 }, { x: 0, y: 0, h: 0 }];
    // 1) hills: parallel hatch strokes inside the lower-right rim (light comes from the upper left), a shine arc upper left
    if (mx[1] > -30) {
      forCells(info, HC, HC * 0.45, (cx, cy) => {
        const nl = hillCell(cx, cy, H2);
        for (let l = 0; l < nl; l++) {
        const hx = H2[l].x, hy = H2[l].y, h = H2[l].h;
        if (hx < info.wx - 150 || hx > info.wx + info.size + 150 || hy < info.wy - 120 || hy > info.wy + info.size + 120) continue;
        const R0 = hillRad(h, 0.8), step = 2.0 / R0;
        ctx.strokeStyle = 'rgba(22,18,14,0.5)'; ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let a = -0.3; a < 1.95; a += step) {
          const t = (a + 0.3) / 2.25, L = 1.0 + 4.4 * Math.sin(t * PI) * (0.8 + 0.2 * Math.sin(a * 23 + h));
          const r = hillRad(h, a) - 7.8, x = hx + Math.cos(a) * r, y = hy + (Math.sin(a) * r) / 1.3;
          if (x < info.wx - 8 || x > info.wx + info.size + 8 || y < info.wy - 8 || y > info.wy + info.size + 8) continue;
          if (hillField(x, y) > 9.5 || pathField(x, y) > -2 || pathField(x - 0.45 * L, y - 0.8 * L) > -2) continue;
          ctx.moveTo(x, y); ctx.lineTo(x - 0.45 * L, y - 0.8 * L);
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(244,239,228,0.6)'; ctx.lineWidth = 0.9;
        ctx.beginPath();
        let on = false;
        for (let a = PI + 0.25; a < PI + 1.35; a += step * 2) {
          const r = hillRad(h, a) - 3.6, x = hx + Math.cos(a) * r, y = hy + (Math.sin(a) * r) / 1.3;
          if (hillField(x, y) > 5.5 || pathField(x, y) > -2) { on = false; continue; }
          if (on) ctx.lineTo(x, y); else { ctx.moveTo(x, y); on = true; }
        }
        ctx.stroke();
        }
      });
    }
    yield;
    // 2) grass clumps where regions meet; reeds at the water's edge
    G.scatter(info, 24, 9101, 9, (x, y, rng) => {
      fieldsAt(x, y, F2);
      const pond = F2[3], path = F2[2], hill = F2[1];
      let p, reed = false;
      if (pond > -1) return;
      if (pond > -9) { p = 0.85; reed = true; }
      else if (path > -1.5) return;
      else if (path > -8) p = 0.42;
      else if (hill > -11 && hill < -1) p = 0.78;
      else if (hill >= -1) p = hill > 9 ? 0.05 : 0;
      else if (Math.abs(F2[0]) < 5) p = 0.45;
      else p = F2[0] > 0 ? 0.06 : 0.045;
      if (rng.next() > p) return;
      // a clump: one tall tuft and smaller ones leaning off it along a shallow arc (never a straight stamp row)
      const n = (reed ? 3 : 1) + ((rng.next() * 3) | 0);
      const b = (rng.next() - 0.5) * 1.4, arc = (rng.next() - 0.5) * 1.6, lead = (rng.next() * n) | 0;
      for (let i = 0; i < n; i++) {
        const u = i - (n - 1) / 2;
        const tx = x + u * (2.2 + rng.next() * 1.6), ty = y + u * u * arc * 0.5 + (rng.next() - 0.5) * 1.2;
        const s = (i === lead ? 1.35 : 0.8 + rng.next() * 0.25) * (reed ? 1 : 0.95 + rng.next() * 0.2);
        if (reed) dReed(ctx, tx, ty, s * 1.15, b);
        else dTuft(ctx, tx, ty, s, 'rgba(22,18,14,0.78)');
      }
    });
    yield;
    // 3) pebbles lining both road edges, a few faint wheel dashes inside
    if (mx[2] > -14) {
      G.scatter(info, 7, 9202, 3, (x, y, rng) => {
        const r0 = rng.next();
        if (r0 > 0.34) return;
        const pf = pathField(x, y);
        if (pf > 0.9 && pf < 3.3) {
          if (pondRaw(x, y) > -4) return;
          dPebble(ctx, x, y, 0.8 + rng.next() * 1.0, 0.55 + rng.next() * 0.45, (rng.next() - 0.5) * 0.8);
        } else if (pf > 4.5 && pf < 8 && r0 < 0.03) dDash(ctx, x, y, 0.9, 'rgba(22,18,14,0.3)');
      });
    }
    yield;
    // 4) water: ripple arcs along the shore ring, lily pads in little rafts
    if (mx[3] > -10) {
      G.scatter(info, 11, 9303, 5, (x, y, rng) => {
        if (rng.next() > 0.42) return;
        fieldsAt(x, y, F2);
        if (F2[3] > 1.5 && F2[3] < 8) dRipple(ctx, x, y, 0.75 + rng.next() * 0.5);
      });
      G.scatter(info, 44, 9304, 10, (x, y, rng) => {
        if (rng.next() > 0.65) return;
        fieldsAt(x, y, F2);
        if (F2[3] < 10) return;
        const n = 2 + ((rng.next() * 2) | 0);
        for (let i = 0; i < n; i++) dLily(ctx, x + (rng.next() - 0.5) * 9, y + (rng.next() - 0.5) * 4, 0.8 + rng.next() * 0.5, rng.next() * TAU);
      });
    }
    yield;
    // 5) flower patches: small daisies around a centre (where a big faced daisy may stand) + a few tufts
    const PO2 = { x: 0, y: 0, h: 0 };
    forCells(info, PATCH, 30, (cx, cy) => {
      if (!patchAt(cx, cy, PO2)) return;
      const r = U.rng(PO2.h);
      const n = 6 + ((r.next() * 6) | 0);
      for (let i = 0; i < n; i++) {
        const a = r.next() * TAU, d = 7 + Math.sqrt(r.next()) * 13;
        const x = PO2.x + Math.cos(a) * d * 1.35, y = PO2.y + Math.sin(a) * d * 0.75;
        const tuft = r.next() < 0.45, s = 1.0 + r.next() * 0.45;
        if (matAt(x, y) !== 0) continue;
        if (tuft) dTuft(ctx, x, y + 0.6, 0.95, 'rgba(22,18,14,0.75)');
        dDaisy(ctx, x, y, s);
      }
    });
    // 6) a few ink wind-curls in the open meadow
    G.scatter(info, 96, 9405, 6, (x, y, rng) => {
      if (rng.next() > 0.32) return;
      const kind = rng.next();
      if (matSafe(x, y, 4) !== 0) return;
      if (kind < 0.5) dCurl(ctx, x, y, 0.95, 'rgba(22,18,14,0.5)');
      else { dDash(ctx, x, y, 1.0, 'rgba(22,18,14,0.42)'); dDash(ctx, x + 2.4, y + 1.6, 0.7, 'rgba(22,18,14,0.42)'); }
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
  /** Draw with a base-anchored skew (sway) + scale (dance). */
  function blitSkew(ctx, V, s, x, y, sx, sy, skew) {
    const S = V.S;
    ctx.setTransform(S * sx, 0, -skew * S * sy, S * sy, V.ox + x * S, V.oy + y * S);
    const k = 1 / K;
    ctx.drawImage(s.c, -s.ox * k, -s.oy * k, s.c.width * k, s.c.height * k);
    ctx.setTransform(S, 0, 0, S, V.ox, V.oy);
  }
  /** The bully's derby hat, placed on the head of body frame fi (follows the body's scale and rotation). */
  function drawHat(ctx, V, x, y, sx, sy, rot, fi, left, lift, hrot, fl, alpha) {
    const a = SPR.bullyHatAt[fi], d = left ? -1 : 1;
    const ox = a[0] * d * sx, oy = a[1] * sy - lift;
    const co = Math.cos(rot), si = Math.sin(rot);
    const hx = x + ox * co - oy * si, hy = y + ox * si + oy * co;
    const h = SPR.bullyHat, r = rot + hrot * d;
    ctx.globalAlpha = alpha;
    blitRot(ctx, V, left ? h.nl : h.n, hx, hy, sx, sy, r);
    if (fl > 0.02) { ctx.globalAlpha = Math.min(0.9, fl * 1.4) * alpha; blitRot(ctx, V, left ? h.fl : h.f, hx, hy, sx, sy, r); }
  }
  /** Designed deaths over deathT 0..1 (0.35 s in play): see the comments per phase. */
  function drawDeath(ctx, V, e, set, left, x, y, sx, sy, rot, fi) {
    const q = e.deathT, big = e.type === 'colossus';
    const sN = left ? set.nl : set.n, sF = left ? set.fl : set.f;
    if (e.type === 'ghost') {
      if (q < 0.14) {
        // shock: puffs up in negative
        const u = q / 0.14, k = 1 + 0.28 * U.ease.outQuad(u);
        blitRot(ctx, V, sF, x, y - 3 * u, sx * k, sy * k, rot);
      } else {
        // the sheet deflates, sinks and lies on the ground as an empty, crumpled sheet that fades
        const u = U.clamp((q - 0.14) / 0.42, 0, 1), e2 = u * u;
        const wob = Math.sin(u * 16) * 0.12 * (1 - u);
        const ky = 1.28 - 1.12 * e2 + wob, kx = 1.28 + 0.25 * e2 - wob * 0.6;
        const yy = U.lerp(y - 3, e.y, U.smoothstep(0, 1, u));
        ctx.globalAlpha = q > 0.7 ? Math.max(0, 1 - (q - 0.7) / 0.3) : 1;
        blitRot(ctx, V, sN, x, yy, sx * kx, sy * Math.max(0.14, ky), rot * (1 - u));
        ctx.globalAlpha = 1;
      }
      return;
    }
    // 0–0.14 jolts up, stretched, in negative · 0.14–0.3 slams down into a pancake ·
    // 0.3–0.52 the pancake spins shut like a coin (the effects' poof covers it)
    if (q < 0.52) {
      let kx, ky, yy = y, s = sN, r = rot;
      if (q < 0.14) { const u = U.ease.outQuad(q / 0.14); kx = 1 - 0.28 * u; ky = 1 + 0.42 * u; yy = y - 5 * u; s = sF; }
      else if (q < 0.3) { const u = (q - 0.14) / 0.16, u2 = u * u; kx = 0.72 + 0.98 * u2; ky = 1.42 - 1.18 * u2; yy = y - 5 * (1 - u2); s = u < 0.5 ? sF : sN; }
      else { const u = (q - 0.3) / 0.22; kx = 1.7 * Math.max(0, Math.cos(u * PI * 0.5)); ky = 0.24 + 0.06 * Math.sin(u * 20); r = 0; }
      if (kx > 0.02) blitRot(ctx, V, s, x, yy, sx * kx, sy * ky, r);
    }
    if (big) {
      // the hat pops off and tumbles away
      const d = left ? -1 : 1, a = SPR.bullyHatAt[fi];
      const hx = x + a[0] * d * sx + d * 18 * q, hy = y + a[1] * sy - 46 * q + 52 * q * q;
      ctx.globalAlpha = q > 0.75 ? Math.max(0, 1 - (q - 0.75) / 0.25) : 1;
      blitRot(ctx, V, left ? SPR.bullyHat.nl : SPR.bullyHat.n, hx, hy, sx, sy, d * q * 7);
      ctx.globalAlpha = 1;
    }
    // the soul: a pale copy with a halo floats up, swaying, and fades
    if (q > 0.16) {
      const u = (q - 0.16) / 0.84;
      const a = (big ? 0.5 : 0.72) * Math.pow(1 - u, 1.3) * U.clamp(u * 6, 0, 1);
      if (a > 0.01) {
        const k = (big ? 0.62 : 0.78) + 0.1 * Math.sin(u * 9), w = Math.sin(u * TAU * 1.25);
        const px = x + w * 3.5, py = y - 6 - u * (big ? 34 : 26);
        ctx.globalAlpha = a;
        blitRot(ctx, V, sF, px, py, sx * k, sy * k, w * 0.15);
        const H = (big ? 60 : 17) * sy * k;
        blit(ctx, SPR.halo, px + (left ? -1 : 1) * (big ? 6 : 1.5) * sx, py - H - 2.5, big ? 1.3 : 0.75, big ? 1.3 : 0.75);
        ctx.globalAlpha = 1;
      }
    }
  }
  /** The shared beat: q = squash pulse (1 on the beat), sway = -1..1 swinging each beat. */
  const BEAT = { rt: -1, q: 0, sway: 0, ph: 0, n: 0 };
  function beat(rt) {
    if (BEAT.rt !== rt) {
      BEAT.rt = rt;
      const b = rt * BPS;
      BEAT.n = Math.floor(b); BEAT.ph = b - BEAT.n;
      BEAT.q = Math.pow(Math.max(0, Math.cos(BEAT.ph * PI)), 6) * 1.0 + Math.pow(Math.max(0, -Math.cos(BEAT.ph * PI)), 6);
      BEAT.sway = Math.cos(b * PI);
    }
    return BEAT;
  }

  /** The beat at any time (for props that follow through a little after it). */
  const BT = { q: 0, sway: 0 };
  function beatAt(rt) {
    const b = rt * BPS, ph = b - Math.floor(b), c = Math.cos(ph * PI);
    BT.q = Math.pow(Math.max(0, c), 6) + Math.pow(Math.max(0, -c), 6);
    BT.sway = Math.cos(b * PI);
    return BT;
  }

  // number sprites (cached per value; Limelight once loaded)
  const numCache = new Map();
  let fontOK = false, fontCheckT = -1;
  function fontReady(rt) {
    if (fontOK) return true;
    if (rt - fontCheckT < 0.5 && fontCheckT >= 0) return false;
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
    if (numCache.size > 500) numCache.clear();
    const fs = (crit ? 12 : 8.6) * K;
    const font = (ok ? '' : 'bold ') + fs + 'px "Limelight", "Georgia", serif';
    const meas = U.canvas(4, 4).ctx;
    meas.font = font;
    const txt = String(value);
    const w = Math.ceil(meas.measureText(txt).width + fs * 0.8), h = Math.ceil(fs * 1.6);
    const { c, ctx } = U.canvas(w, h);
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const cx = w / 2, cy = h / 2;
    if (crit) {
      ctx.strokeStyle = INK; ctx.lineWidth = fs * 0.34; ctx.strokeText(txt, cx, cy);
      ctx.strokeStyle = C.white; ctx.lineWidth = fs * 0.2; ctx.strokeText(txt, cx, cy);
      ctx.fillStyle = INK; ctx.fillText(txt, cx, cy);
    } else {
      ctx.strokeStyle = INK; ctx.lineWidth = fs * 0.26; ctx.strokeText(txt, cx + fs * 0.05, cy + fs * 0.07);
      ctx.strokeText(txt, cx, cy);
      ctx.fillStyle = C.white; ctx.fillText(txt, cx, cy);
    }
    s = { c, ox: w / 2, oy: h / 2 };
    numCache.set(key, s);
    return s;
  }

  /* ================================================================ icons */
  function iconPaint(ctx, fn) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'outline', 2.2));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(new Painter(ctx, 'fill', 2.2));
  }
  const sub = (P, x, y, s, fn) => { const c = P.ctx; c.save(); c.translate(x, y); c.scale(s, s); fn(new Painter(c, P.mode, 2.2 / s)); c.restore(); };
  const ICONS = {
    'hp-heart'(P) {
      P.part((c) => {
        c.moveTo(24, 43); c.bezierCurveTo(10, 34, 4.5, 26, 4.5, 17.5); c.bezierCurveTo(4.5, 10, 9.5, 5.5, 15.5, 5.5);
        c.bezierCurveTo(19.5, 5.5, 22.5, 8, 24, 11.5); c.bezierCurveTo(25.5, 8, 28.5, 5.5, 32.5, 5.5);
        c.bezierCurveTo(38.5, 5.5, 43.5, 10, 43.5, 17.5); c.bezierCurveTo(43.5, 26, 38, 34, 24, 43); c.closePath();
      }, C.white, {
        shade: C.g4, sh: [-3, -3], hi: [13, 13, 3.6, 2.0, -0.7],
        detail(c) {
          pieEye(c, 20.0, 19.5, 2.0, 3.4, 0, C.white, 1); pieEye(c, 28.6, 19.5, 2.0, 3.4, 0, C.white, 1);
          c.strokeStyle = INK; c.lineWidth = 2.0; c.beginPath(); c.arc(24.2, 26.5, 4.6, PI * 0.18, PI * 0.82); c.stroke();
        },
      });
    },
    kills(P) {
      sub(P, 21, 36, 2.1, (Q) => {
        Q.part(E(0, -7.8, 6.5, 6.0), INK, {});
        const horn = (x, y, lean) => (k) => { k.moveTo(x - 1.4, y + 0.6); k.quadraticCurveTo(x - 0.8 + lean * 2, y - 2.2, x + lean * 3.4, y - 4.0); k.quadraticCurveTo(x + 0.6 + lean, y - 1.6, x + 1.4, y + 0.6); k.closePath(); };
        Q.part(horn(-2.6, -12.8, -0.5), C.g4, { shade: C.g3, sh: [-0.3, 0] });
        Q.part(horn(2.8, -13.0, 0.45), C.g4, { shade: C.g3, sh: [-0.3, 0] });
        Q.part((k) => blobPath(k, off([[-3.2, -3.0], [-1.6, -4.4], [0.1, -3.4], [1.8, -4.5], [3.7, -3.0], [4.4, 0.2], [3.2, 3.4], [0.4, 4.3], [-2.5, 3.3], [-3.7, 0.2]], 1.2, -7.2), 0.95), C.face, { shade: C.faceSh, sh: [-0.5, -0.6] });
        Q.detail((k) => {
          k.strokeStyle = INK; k.lineWidth = 0.7; k.beginPath();
          for (const ex of [-0.4, 2.6]) { k.moveTo(ex - 0.9, -9.8); k.lineTo(ex + 0.9, -8.0); k.moveTo(ex + 0.9, -9.8); k.lineTo(ex - 0.9, -8.0); }
          k.stroke();
          k.lineWidth = 0.55; k.beginPath(); k.moveTo(-1.6, -5.2); k.quadraticCurveTo(-0.6, -6.0, 0.4, -5.2); k.quadraticCurveTo(1.4, -4.4, 2.6, -5.4); k.stroke();
        });
      });
    },
    dmg(P) {
      const pts = [];
      for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU + 0.1, r = i & 1 ? 11 : 20 + (i % 4) * 1.2; pts.push([30 + Math.cos(a) * r, 18 + Math.sin(a) * r * 0.8]); }
      P.part((c) => roundPoly(c, pts, 0.8), C.white, { shade: C.g4, sh: [-2, -2] });
      P.hose((c) => { c.moveTo(2, 44); c.quadraticCurveTo(8, 36, 14, 33); }, 4.2, INK);
      glove(P, 14, 32, -0.65, 4.6);
    },
    rate(P) {
      P.detail((c) => { c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(4, 33); c.lineTo(11, 33); c.moveTo(6, 40); c.lineTo(13, 40); c.moveTo(38, 28); c.lineTo(45, 28); c.stroke(); });
      P.part((c) => roundPoly(c, [[28, 3], [11, 26], [22, 26], [16, 45], [37, 19], [26, 19], [33, 3]], 1.4), C.white, { shade: C.g4, sh: [-2.4, -2.4], hi: [25, 9, 2.4, 1.0, -1.0] });
    },
    multi(P) {
      sub(P, 15, 34, 2.6, (Q) => noteParts(Q, 1));
      sub(P, 36, 28, 2.2, (Q) => noteParts(Q, 0));
      P.detail((c) => { c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(40, 40); c.lineTo(44, 38); c.moveTo(39, 45); c.lineTo(45, 44.5); c.stroke(); });
    },
    bounce(P) {
      P.detail((c) => { c.strokeStyle = INK; c.lineWidth = 2.0; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(5, 42); c.quadraticCurveTo(10, 8, 22, 14); c.stroke(); c.setLineDash([]); c.lineWidth = 2; c.beginPath(); c.moveTo(18, 44); c.lineTo(20, 40); c.moveTo(26, 44); c.lineTo(25, 40); c.moveTo(33, 44); c.lineTo(30, 40.5); c.stroke(); });
      P.part(E(30, 26, 11, 10.5), C.white, {
        shade: C.g4, sh: [-2.4, -2.4],
        detail(c) { c.fillStyle = INK; c.beginPath(); c.ellipse(30, 26, 11, 3.6, -0.5, 0, TAU); c.fill(); c.fillStyle = C.white; c.beginPath(); c.ellipse(30, 26, 11, 1.6, -0.5, 0, TAU); c.fill(); },
        hi: [25, 20, 3.0, 1.6, -0.7],
      });
    },
    lantern(P) {
      sub(P, 24, 27, 4.0, (Q) => birdParts(Q, 0));
      P.detail((c) => { c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.arc(24, 27, 21, PI * 1.2, PI * 1.45); c.arc(24, 27, 21, PI * 0.05, PI * 0.3); c.stroke(); });
    },
    speed(P) {
      P.detail((c) => { c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(2, 25); c.lineTo(9, 25); c.moveTo(3, 32); c.lineTo(8, 32); c.moveTo(4, 39); c.lineTo(10, 39); c.stroke(); });
      P.part((c) => blobPath(c, [[14, 22], [8, 10], [18, 13], [16, 4], [26, 12], [30, 22]], 0.9), C.white, {
        shade: C.g4, sh: [-1.4, -1.4],
        detail(c) { c.strokeStyle = INK; c.lineWidth = 1.0; c.beginPath(); c.moveTo(15, 18); c.lineTo(20, 14); c.moveTo(19, 20); c.lineTo(24, 15); c.stroke(); },
      });
      P.part(E(28, 33, 15.5, 8.4, -0.08), C.shoe, {
        shade: C.shoeSh, sh: [-2.4, -2.4], inner: 1.0,
        detail(c) { c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.ellipse(34, 33.4, 6.4, 7.2, -0.08, PI * 0.62, PI * 1.38); c.stroke(); },
        hi: [24, 28, 5, 1.6, -0.2],
      });
    },
    magnet(P) {
      P.hose((c) => { c.moveTo(12, 10); c.lineTo(12, 24); c.arc(24, 24, 12, PI, 0, true); c.lineTo(36, 10); }, 9.0, C.g2);
      P.detail((c) => { c.strokeStyle = C.g3; c.lineWidth = 2.0; c.beginPath(); c.moveTo(10, 12); c.lineTo(10, 24); c.arc(24, 24, 14, PI, PI * 0.75, true); c.stroke(); });
      P.part((c) => rrect(c, 7, 4, 10, 8, 1.4), C.white, { shade: C.g4, sh: [-1, -1] });
      P.part((c) => rrect(c, 31, 4, 10, 8, 1.4), C.white, { shade: C.g4, sh: [-1, -1] });
      P.detail((c) => { c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(9, 2); c.lineTo(7, -2); c.moveTo(24, 6); c.lineTo(24, 1); c.moveTo(39, 2); c.lineTo(41, -2); c.stroke(); });
    },
    hp(P) {
      P.detail((c) => { c.strokeStyle = INK; c.lineWidth = 2.0; c.beginPath(); for (const x of [15, 24, 33]) { c.moveTo(x, 16); c.bezierCurveTo(x - 4, 12, x + 4, 9, x, 4); } c.stroke(); });
      P.part((c) => { c.moveTo(5, 28); c.lineTo(43, 28); c.lineTo(39, 42); c.lineTo(9, 42); c.closePath(); }, C.g2, {
        shade: C.shortsSh, sh: [-2, -1.6],
        detail(c) { c.strokeStyle = C.g3; c.lineWidth = 1.2; c.beginPath(); for (let x = 10; x < 40; x += 5) { c.moveTo(x, 30); c.lineTo(x + 1, 41); } c.stroke(); },
      });
      P.part(E(24, 27, 19.5, 6.6), C.paper, {
        shade: C.g4, sh: [0, 1.4],
        detail(c) {
          c.strokeStyle = C.g2; c.lineWidth = 1.5; c.beginPath();
          for (const x of [14, 22, 30]) { c.moveTo(x, 21.5); c.lineTo(x + 6, 32); }
          for (const x of [18, 26, 34]) { c.moveTo(x, 21.5); c.lineTo(x - 6, 32); }
          c.stroke();
        },
        hi: [15, 24, 4, 1.4, -0.1],
      });
    },
  };

  /* ================================================================== CSS */
  const svgUrl = (s) => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
  // ornamental title-card frame: dark card, double paper rule, concave corners with a dot and a curl
  const ORN = svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'>" +
    "<rect x='1' y='1' width='70' height='70' rx='4' fill='#17130f'/>" +
    "<g fill='none' stroke='#efe9dc' stroke-linecap='round' stroke-linejoin='round'>" +
    "<path stroke-width='2' d='M15 4.5H57A10.5 10.5 0 0 0 67.5 15V57A10.5 10.5 0 0 0 57 67.5H15A10.5 10.5 0 0 0 4.5 57V15A10.5 10.5 0 0 0 15 4.5Z'/>" +
    "<rect x='9.5' y='9.5' width='53' height='53' rx='1' stroke-width='.9'/>" +
    "<g id='c'><path stroke-width='1.3' d='M9.5 24C16 24 19 21 19.5 16C20 12 17 10.5 15 11.5C13 12.5 13.6 15.6 16 15.4'/>" +
    "<path stroke-width='1.3' d='M24 9.5C24 16 21 19 16 19.5'/><path stroke-width='.9' d='M19.5 19.5L23.5 23.5'/></g>" +
    "<use href='#c' transform='rotate(90 36 36)'/><use href='#c' transform='rotate(180 36 36)'/><use href='#c' transform='rotate(270 36 36)'/></g>" +
    "<g fill='#efe9dc'><circle cx='4.8' cy='4.8' r='2.1'/><circle cx='67.2' cy='4.8' r='2.1'/><circle cx='4.8' cy='67.2' r='2.1'/><circle cx='67.2' cy='67.2' r='2.1'/>" +
    "<circle cx='24.4' cy='24.4' r='1.3'/><circle cx='47.6' cy='24.4' r='1.3'/><circle cx='24.4' cy='47.6' r='1.3'/><circle cx='47.6' cy='47.6' r='1.3'/></g></svg>");
  const RAYS = 'repeating-conic-gradient(from 0deg at 50% 44%, rgba(239,233,220,.10) 0 6deg, rgba(239,233,220,0) 6deg 12deg)';
  const P_ = '#17130f', W_ = '#efe9dc';
  const tso = (w, col) => { const a = []; for (let i = 0; i < 12; i++) { const t = (i / 12) * TAU; a.push((Math.cos(t) * w).toFixed(1) + 'px ' + (Math.sin(t) * w).toFixed(1) + 'px 0 ' + col); } return a.join(','); };
  const B = 'body.style-rubberhose';
  const CSS = `
${B} { font-family: 'Special Elite', 'Courier New', monospace; color: ${W_}; }
${B} #hud { padding: 14px 22px; }
${B} #hud .xp { height: 26px; border: 0; border-radius: 2px; overflow: hidden; background: ${P_}; box-shadow: 0 0 0 2px ${P_}, 0 4px 0 2px rgba(10,8,6,.32); }
${B} #hud .xp::after { content: ''; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(90deg, transparent 0 6px, #e9e2d2 6px 12px, transparent 12px 20px) left 0 top 3px / 100% 4px no-repeat,
    repeating-linear-gradient(90deg, transparent 0 6px, #e9e2d2 6px 12px, transparent 12px 20px) left 0 bottom 3px / 100% 4px no-repeat; }
${B} #hud .xp-fill { background: linear-gradient(${P_} 0 0) top / 100% 9px no-repeat, linear-gradient(${P_} 0 0) bottom / 100% 9px no-repeat,
  linear-gradient(90deg, rgba(255,255,255,0) 60%, rgba(255,255,255,.35)), repeating-linear-gradient(90deg, #d8d0c0 0 38px, #8f877a 38px 40px); }
${B} #hud .lvl { z-index: 2; right: 0; top: 0; height: 100%; transform: none; display: flex; align-items: center; padding: 0 12px; background: ${P_}; border-left: 2px solid ${W_};
  font: 400 15px/1 'Limelight', Georgia, serif; letter-spacing: .08em; color: ${W_}; text-shadow: none; }
${B} #hud .topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; margin-top: 14px; }
${B} #hud .hp { position: relative; justify-self: start; gap: 8px; }
${B} #hud .hp-icon, ${B} #hud .kills-icon { width: 46px; height: 46px; filter: drop-shadow(2px 3px 0 rgba(10,8,6,.4)); }
${B} #hud .hp-bar { width: 252px; height: 26px; border: 2px solid ${W_}; border-radius: 13px; background: ${P_}; box-shadow: 0 0 0 3px ${P_}, 0 5px 0 3px rgba(10,8,6,.32); }
${B} #hud .hp-fill { border-radius: 11px; background: linear-gradient(180deg, rgba(255,255,255,.45) 0 22%, rgba(255,255,255,0) 22% 70%, rgba(23,19,15,.18) 70%), repeating-linear-gradient(-45deg, #efe9dc 0 4px, #c9c1b1 4px 6px); }
${B} #hud .hp-text { position: absolute; left: 54px; width: 252px; top: 50%; transform: translateY(-50%); text-align: center;
  font: 400 16px/1 'Limelight', Georgia, serif; letter-spacing: .06em; color: ${W_}; text-shadow: ${tso(2, P_)}; }
${B}.hurt #hud .hp { animation: rhShake .24s linear; }
@keyframes rhShake { 0%,100% { transform: none } 25% { transform: translate(-3px,1px) skewX(-4deg) } 75% { transform: translate(3px,-1px) skewX(4deg) } }
${B} #hud .clock { justify-self: center; min-width: 176px; margin-top: -8px; padding: 0 12px; border: 24px solid transparent; border-image: ${ORN} 26 fill / 24px stretch;
  filter: drop-shadow(0 5px 0 rgba(10,8,6,.32)); }
${B} #hud .clock-time { font: 400 34px/1.05 'Limelight', Georgia, serif; letter-spacing: .06em; color: ${W_}; text-shadow: 2px 3px 0 #000; }
${B} #hud .clock-label { margin-top: 2px; font: 400 12px/1.2 'Special Elite', monospace; letter-spacing: .28em; opacity: 1; color: #b9b1a1; }
${B} #hud .kills { justify-self: end; min-width: 0; gap: 4px; padding: 0 8px 0 0; border: 20px solid transparent; border-image: ${ORN} 26 fill / 20px stretch;
  filter: drop-shadow(0 5px 0 rgba(10,8,6,.32)); font: 400 26px/1 'Limelight', Georgia, serif; color: ${W_}; text-shadow: 2px 2px 0 #000; }
${B} #hud .kills-icon { width: 40px; height: 40px; margin: -6px 0; filter: none; }
${B} #stylebar { background: transparent; border: 20px solid transparent; border-radius: 0; border-image: ${ORN} 26 fill / 20px stretch; padding: 0 12px; gap: 14px; bottom: 8px;
  filter: drop-shadow(0 4px 0 rgba(10,8,6,.35)); color: ${W_}; font: 400 12px/1.2 'Special Elite', monospace; }
${B} #stylebar .style-family { font: 400 12px/1 'Special Elite', monospace; letter-spacing: .22em; opacity: 1; color: #b9b1a1; }
${B} #stylebar .style-name { font: 400 20px/1 'Limelight', Georgia, serif; letter-spacing: .06em; color: ${W_}; }
${B} #stylebar .style-hint { opacity: .75; }
${B} #stylebar .auto.on { color: #fffdf6; text-decoration: underline; }
${B} #levelup { gap: 28px; background: radial-gradient(ellipse at 50% 44%, rgba(23,19,15,0) 30%, rgba(23,19,15,.55) 92%), ${RAYS}, rgba(52,45,38,.34);
  -webkit-backdrop-filter: grayscale(1) sepia(.2) brightness(.86); backdrop-filter: grayscale(1) sepia(.2) brightness(.86); }
${B} #levelup .lu-title { padding: 0 34px; border: 28px solid transparent; border-image: ${ORN} 26 fill / 28px stretch;
  font: 400 60px/1.05 'Limelight', Georgia, serif; letter-spacing: .06em; color: ${W_}; text-shadow: 3px 4px 0 #000;
  filter: drop-shadow(0 8px 0 rgba(10,8,6,.4)); animation: rhPop .6s cubic-bezier(.3,1.7,.5,1) backwards; }
@keyframes rhPop { 0% { transform: scale(.3, 1.6); } 45% { transform: scale(1.12, .86); } 70% { transform: scale(.95, 1.05); } 100% { transform: none; } }
${B} #levelup .lu-cards { gap: 26px; }
${B} #levelup .card { width: 246px; min-height: 304px; padding: 0 4px 10px; gap: 8px; color: ${W_}; background: transparent;
  border: 32px solid transparent; border-radius: 0; border-image: ${ORN} 26 fill / 32px stretch;
  filter: drop-shadow(0 9px 0 rgba(10,8,6,.42)); animation: rhCard .62s cubic-bezier(.3,1.5,.5,1) backwards; transform-origin: 50% 100%; }
${B} #levelup .card:nth-child(2) { animation-delay: .08s; }
${B} #levelup .card:nth-child(3) { animation-delay: .16s; }
@keyframes rhCard { 0% { transform: translateY(70px) scale(.6, 1.4); opacity: 0; } 55% { transform: translateY(-8px) scale(1.08, .9); opacity: 1; } 80% { transform: scale(.97, 1.04); } 100% { transform: none; } }
${B} #levelup .card:hover { animation: rhJelly .5s ease-out; }
@keyframes rhJelly { 0% { transform: none; } 30% { transform: scale(1.08, .92); } 55% { transform: scale(.95, 1.06) translateY(-8px); } 80% { transform: scale(1.02, .98) translateY(-6px); } 100% { transform: translateY(-6px); } }
${B} #levelup .card-icon { width: 114px; height: 114px; margin-top: 6px; padding: 8px; border-radius: 50%;
  background: radial-gradient(circle at 40% 34%, #fdfbf5, #e9e2d3 62%, #cfc7b7);
  box-shadow: 0 0 0 3px ${P_}, 0 0 0 5px ${W_}, 0 0 0 7px ${P_}; }
${B} #levelup .card-name { margin-top: 10px; font: 400 21px/1.15 'Rye', Georgia, serif; letter-spacing: .02em; color: ${W_}; text-shadow: 2px 2px 0 #000; }
${B} #levelup .card-desc { font: 400 15px/1.3 'Special Elite', monospace; opacity: 1; color: #cfc7b7; }
${B} #levelup .card-key { top: -22px; left: -22px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%;
  background: ${W_}; box-shadow: 0 0 0 2px ${P_}; font: 400 15px/1 'Limelight', Georgia, serif; opacity: 1; color: ${P_}; }
${B} #levelup .lu-hint { font: 400 16px/1.2 'Special Elite', monospace; letter-spacing: .12em; opacity: 1; color: ${W_}; text-shadow: ${tso(2, P_)}; }
${B} #gameover { isolation: isolate; background: transparent; gap: 16px; }
${B} #gameover::before { content: ''; position: absolute; left: 50%; top: 46%; width: 62vmin; height: 62vmin; transform: translate(-50%, -50%); border-radius: 50%; z-index: -1;
  box-shadow: 0 0 0 220vmax #0c0a08, inset 0 0 60px 20px rgba(12,10,8,.9); animation: rhIris 1.4s cubic-bezier(.5,0,.3,1) backwards; }
@keyframes rhIris { from { width: 260vmax; height: 260vmax; } to { width: 62vmin; height: 62vmin; } }
${B} #gameover .go-title { font: 400 62px/1.05 'Limelight', Georgia, serif; letter-spacing: .05em; color: ${W_}; text-shadow: 3px 4px 0 #000; }
${B} #gameover .go-stats { font: 400 18px/1.3 'Special Elite', monospace; opacity: 1; color: #cfc7b7; }
${B} #gameover .go-hint { font: 400 20px/1 'Limelight', Georgia, serif; opacity: 1; color: ${P_}; background: ${W_}; padding: 8px 22px; border-radius: 999px; box-shadow: 0 0 0 2px ${P_}, 0 0 0 4px ${W_}; }
${B} #pausebox { font: 400 70px/1 'Limelight', Georgia, serif; letter-spacing: .06em; color: ${W_}; text-shadow: ${tso(3, P_)}, 4px 6px 0 #000; }
`;

  /* ============================================================= film gate
     The projected-film layer is baked: vignette + rounded gate corners + grain + a flicker
     bias, in 3 variants at grain resolution. Per frame it costs ONE drawImage (variant and
     a small offset change 24 times a second; the offset also gives the gate weave).          */
  const FILM = { layers: null, key: '', g: 1, pad: 4, own: { chars: -9, props: -9, fx: -9 } };
  const FLICK = [-0.045, 0, 0.03];
  function makeFilm(W, H, g) {
    const pad = FILM.pad, w = Math.ceil(W / g) + pad * 2, h = Math.ceil(H / g) + pad * 2;
    const base = U.canvas(w, h), bc = base.ctx;
    const R = Math.hypot(W / g, H / g) / 2, cx = w / 2, cy = h * 0.48;
    const gr = bc.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.02);
    gr.addColorStop(0, 'rgba(14,11,8,0)'); gr.addColorStop(0.55, 'rgba(14,11,8,0.18)'); gr.addColorStop(0.85, 'rgba(14,11,8,0.48)'); gr.addColorStop(1, 'rgba(14,11,8,0.76)');
    bc.fillStyle = gr; bc.fillRect(0, 0, w, h);
    // rounded projector gate (soft-edged)
    const rr = (H / g) * 0.075, m = pad + (H / g) * 0.004, x1 = w - m, y1 = h - m;
    bc.filter = 'blur(' + Math.max(1, (H / g) * 0.004).toFixed(1) + 'px)';
    bc.fillStyle = 'rgba(10,8,6,0.94)';
    bc.beginPath(); bc.rect(-40, -40, w + 80, h + 80);
    bc.moveTo(m + rr, m); bc.arcTo(x1, m, x1, y1, rr); bc.arcTo(x1, y1, m, y1, rr); bc.arcTo(m, y1, m, m, rr); bc.arcTo(m, m, x1, m, rr); bc.closePath();
    bc.fill('evenodd');
    bc.filter = 'none';
    const src = bc.getImageData(0, 0, w, h).data;
    const rnd = U.mulberry32(1931);
    return FLICK.map((fb) => {
      const out = U.canvas(w, h), oc = out.ctx;
      const img = oc.createImageData(w, h), d = img.data;
      const fr = fb > 0 ? 255 : 12, fa = Math.abs(fb);
      for (let i = 0; i < w * h; i++) {
        const o = i * 4;
        // flat flicker, then vignette/gate, then grain – composited once here
        let a = fa, r = fr, gg = fr, bb = fr;
        const va = src[o + 3] / 255;
        if (va > 0) { const na = va + a * (1 - va); r = (src[o] * va + r * a * (1 - va)) / na; gg = (src[o + 1] * va + gg * a * (1 - va)) / na; bb = (src[o + 2] * va + bb * a * (1 - va)) / na; a = na; }
        const v = rnd();
        const ga = Math.pow(Math.abs(v - 0.5) * 2, 1.8) * 0.21 * (0.6 + rnd() * 0.4);
        const gw = v > 0.5 ? 250 : 16;
        const na = ga + a * (1 - ga);
        if (na > 0) { r = (gw * ga + r * a * (1 - ga)) / na; gg = ((gw - 6) * ga + gg * a * (1 - ga)) / na; bb = ((gw - 14) * ga + bb * a * (1 - ga)) / na; }
        d[o] = r; d[o + 1] = gg; d[o + 2] = bb; d[o + 3] = na * 255;
      }
      oc.putImageData(img, 0, 0);
      return out.c;
    });
  }
  const h1 = (a, b) => U.hash2(a, b, 1931);
  const markOwn = (k, rt) => { FILM.own[k] = rt; };

  /* ============================================================== particles */
  function puff(game, x, y, z, tint, size, vx, vy, life, rise) {
    return game.addParticle({ kind: 'puff', x, y, z, vx, vy, drag: 5, life, size, tint, rise: rise || 6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 2 });
  }
  function star(game, x, y, z, size, sp, life) {
    const a = Math.random() * TAU; sp = sp || 60;
    return game.addParticle({ kind: 'star', x, y, z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 50 + Math.random() * 50, grav: 180, drag: 2.2, life: life || 0.6, size, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 });
  }

  /* ================================================================ style */
  Styles.register({
    id: 'rubberhose',
    name: 'Rubber Hose 1930s',
    family: 'Cartoon · Vintage animation',
    description: 'Black-and-white 1930s animation: ink figures with elbow-less rubber-hose limbs, white gloves and pie-cut eyes, a world that dances on the beat, projected through grainy, scratched, flickering film.',
    groundColor: '#cfc8b9',
    groundResMax: 3,
    chunkSize: 256,
    fonts: ['Limelight', 'Rye', 'Special+Elite'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = window.__forceH || window.innerHeight || 900;
      const S = (cssH * dpr) / 360;
      K = Math.max(3, Math.min(6, Math.round(S * 1.25)));
      const HB = [-17, -41, 17, 2.5];
      SPR.walk = []; for (let f = 0; f < 8; f++) SPR.walk.push(set4(HB, (P) => heroParts(P, heroPose('walk', f))));
      SPR.idle = [0, 1, 2, 3, 4, 5].map((f) => set4(HB, (P) => heroParts(P, heroPose('idle', f))));
      SPR.skid = set4(HB, (P) => heroParts(P, heroPose('skid', 0)));
      SPR.dash = [0, 1].map((f) => set4(HB, (P) => heroParts(P, heroPose('dash', f))));
      SPR.hurt = set4(HB, (P) => heroParts(P, heroPose('hurt', 0)));
      SPR.imp = [0, 1, 2].map((v) => [0, 1, 2, 3, 4, 5].map((f) => set4([-12, -25, 12, 2.5], (P) => impParts(P, f, v))));
      SPR.ghost = [0, 1, 2, 3, 4, 5].map((f) => set4([-14, -29, 17, 2.5], (P) => ghostParts(P, f), ghostFade, NEG));
      SPR.bully = [0, 1, 2, 3, 4, 5, 6, 7].map((f) => set4([-31, -62, 31, 3], (P) => bullyParts(P, f)));
      SPR.bullyHat = set4([-11, -11, 11, 3], bullyHatParts);
      SPR.bullyHatAt = [0, 1, 2, 3, 4, 5, 6, 7].map(bullyHatAt);
      SPR.halo = plainSprite([-6, -2.6, 6, 2.6], (c) => {
        c.lineWidth = 1.5; c.strokeStyle = INK; c.beginPath(); c.ellipse(0, 0, 4.6, 1.5, 0, 0, TAU); c.stroke();
        c.lineWidth = 0.8; c.strokeStyle = C.white; c.stroke();
      });
      SPR.note = [0, 1, 2].map((v) => build([-6.5, -11, 8, 4], (P) => noteParts(P, v), 'fill', 0.6, null, C.white));
      SPR.coin = build([-4.5, -4.5, 4.5, 4.5], coinParts);
      SPR.diamond = build([-6, -6.5, 6, 6], diamondParts);
      SPR.bird = [0, 1].map((f) => withFlip(build([-8, -8.5, 8.5, 5.5], (P) => birdParts(P, f))));
      SPR.puff = PUFF_COL.map((_, t) => build([-8.5, -7, 8.5, 6.5], (P) => puffParts(P, t)));
      SPR.star = build([-6, -6, 6, 6], starParts);
      SPR.pow = build([-9, -8, 9, 8], powParts);
      SPR.twinkle = build([-5.2, -5.2, 5.2, 5.2], twinkleParts);
      SPR.drop = build([-3, -4.4, 3, 3.6], (P) => dropParts(P, false));
      SPR.sweat = build([-3, -4.4, 3, 3.6], (P) => dropParts(P, true));
      SPR.streak = plainSprite([-16, -3.2, -2, 3.2], (c) => {
        c.strokeStyle = INK; c.lineWidth = 0.6;
        c.beginPath(); c.moveTo(-4, -1.6); c.lineTo(-11, -1.6); c.moveTo(-5, 0.4); c.lineTo(-15, 0.4); c.moveTo(-4.4, 2.2); c.lineTo(-9.5, 2.2); c.stroke();
      });
      SPR.shadow = plainSprite([-4, -1.6, 4, 1.6], (c) => { c.fillStyle = 'rgba(22,18,14,0.4)'; c.beginPath(); c.ellipse(0, 0, 3.6, 1.35, 0, 0, TAU); c.fill(); });
      SPR.glow = plainSprite([-14, -14, 14, 14], (c) => {
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 14);
        g.addColorStop(0, 'rgba(255,253,244,0.75)'); g.addColorStop(0.4, 'rgba(250,246,234,0.3)'); g.addColorStop(1, 'rgba(250,246,234,0)');
        c.fillStyle = g; c.fillRect(-14, -14, 28, 28);
      });
      SPR.props = {};
      for (const t in PROP_DEF) {
        const d = PROP_DEF[t];
        SPR.props[t] = [];
        for (let v = 0; v < d.n; v++) SPR.props[t].push(withFlip(build(d.box, (P) => d.fn(P, v))));
      }
      SPR.blades = build([-18, -18, 18, 18], bladesParts);
      FILM.key = '';
      if (document.fonts && document.fonts.load) { try { document.fonts.load('20px "Limelight"', '0123456789'); } catch (e) { /* ignore */ } }
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
      const mx = [-1e9, -1e9, -1e9, -1e9];
      for (let i = 0; i < nn * nn; i++) for (let L = 0; L < 4; L++) if (F[i * NF + L] > mx[L]) mx[L] = F[i * NF + L];
      const cs = new Int32Array(nc + 1);
      for (let i = 0; i <= nc; i++) cs[i] = Math.max(0, Math.min(Wp, Math.ceil(i * cpx - 0.5)));
      const img = ctx.createImageData(Wp, Wp);
      const buf = new Uint32Array(img.data.buffer);
      const rimPx = LAY.map((l) => l.rw * res);
      const c2Px = LAY.map((l) => l.c2 * res);
      const reach = LAY.map((l, i) => Math.max(rimPx[i], c2Px[i] + res * 0.6));
      const lh = (LINE_W * res) / 2;
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
            st[L] = mx < 0 && mx / g < -(lh + 1.5) ? 0 : mn > 0 && mn / g > reach[L] + lh + 1.5 ? 2 : 1;
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
                const A = F[o00 + L], Bq = F[o10 + L], Cc = F[o01 + L], D = F[o11 + L];
                const s0 = A + (Bq - A) * u, s1 = Cc + (D - Cc) * u;
                const s = s0 + (s1 - s0) * v;
                const du = (Bq - A) * (1 - v) + (D - Cc) * v, dv = (Cc - A) * (1 - u) + (D - Bq) * u;
                const gl = Math.sqrt(du * du + dv * dv) / cpx;
                const dist = gl > 1e-9 ? s / gl : s > 0 ? 99 : -99;
                const ad = dist < 0 ? -dist : dist;
                let ink = lh + 0.5 - ad;
                let cov = dist + 0.5;
                if (cov > 0) {
                  if (cov > 1) cov = 1;
                  const lay = LAY[L];
                  let rm = rimPx[L] + lh - dist + 0.5;
                  rm = rm < 0 ? 0 : rm > 1 ? 1 : rm;
                  const lr = lay.fill[0] + (lay.rim[0] - lay.fill[0]) * rm;
                  const lg = lay.fill[1] + (lay.rim[1] - lay.fill[1]) * rm;
                  const lb = lay.fill[2] + (lay.rim[2] - lay.fill[2]) * rm;
                  r += (lr - r) * cov; g += (lg - g) * cov; b += (lb - b) * cov;
                }
                if (c2Px[L] > 0) {
                  const d2 = dist - c2Px[L];
                  const i2 = (0.45 * res * 0.5 + 0.5 - (d2 < 0 ? -d2 : d2)) * 0.45;
                  if (i2 > ink) ink = i2;
                }
                if (ink > 0) {
                  if (ink > 1) ink = 1;
                  ink *= 0.92 * LAY[L].ink;
                  r += (INKC[0] - r) * ink; g += (INKC[1] - g) * ink; b += (INKC[2] - b) * ink;
                }
              }
              buf[py * Wp + px] = pack(r * tint, g * tint, b * tint);
            }
          }
        }
        if ((gy & 3) === 3) yield;
      }
      ctx.putImageData(img, 0, 0);
      yield;
      yield* decals(ctx, info, mx);
    },

    /* Props come in designed groups, never one-by-one: groves on the back rim of the hills (mushrooms at
       their feet, a windmill on some hill tops), villages of 2–3 houses in a row with fences running off
       both ends, a lamp and a barrel, lamp posts and fences lining the road, cattails around every pond,
       a big faced daisy in the middle of each flower patch. Each member belongs to the chunk it stands in. */
    propsForChunk(info) {
      const out = [];
      const add = (x, y, t, v, f, ph) => {
        if (x < info.wx || x >= info.wx + info.size || y < info.wy || y >= info.wy + info.size) return;
        if (G.nearSpawn(x, y, 95)) return;
        out.push({ x, y, t, v, f, ph, pad: PAD[t] || 34 });
      };
      const ok = (x, y, r) => { const m = matSafe(x, y, r); return m >= 0 && m <= 2; }; // meadow, wash or hill – never road or water
      const H3 = [{ x: 0, y: 0, h: 0 }, { x: 0, y: 0, h: 0 }];
      // 1) hill groves + windmills
      forCells(info, HC, HC * 0.5, (cx, cy) => {
        const nl = hillCell(cx, cy, H3);
        if (!nl) return;
        const L0 = H3[0];
        const r = U.rng(L0.h ^ 0x9e3779b9);
        const nT = r.next() < 0.78 ? 2 + ((r.next() * 3) | 0) : 0;
        let a = -PI / 2 - 1.05 + r.next() * 0.4;
        for (let i = 0; i < nT; i++) {
          a += 0.32 + r.next() * 0.34;
          const rr = hillRad(L0.h, a) + 3 + r.next() * 4;
          const x = L0.x + Math.cos(a) * rr, y = L0.y + (Math.sin(a) * rr) / 1.3;
          const v = r.next() < 0.62 ? 0 : 1, f = r.next() < 0.5, ph = r.next(), sh = r.next();
          if (!ok(x, y, 4) || hillField(x, y) > 0) continue;
          add(x, y, 'tree', v, f, ph);
          if (sh < 0.4 && ok(x + 10, y + 5, 3)) add(x + 10, y + 5, 'shroom', sh < 0.2 ? 0 : 1, false, ph);
        }
        if (r.next() < 0.32 && matSafe(L0.x, L0.y + 6, 10) === 2) add(L0.x, L0.y + 6, 'mill', 0, r.next() < 0.5, r.next());
      });
      // 2) villages
      forCells(info, 520, 120, (cx, cy) => {
        const h = U.hashInt(cx, cy, 4401);
        if ((h & 255) > 118) return;
        const r = U.rng(h);
        const vx = (cx + 0.25 + 0.5 * r.next()) * 520, vy = (cy + 0.25 + 0.5 * r.next()) * 520;
        if (G.nearSpawn(vx, vy, 140) || matSafe(vx, vy, 30) > 1 || matSafe(vx, vy, 30) < 0) return;
        const three = r.next() < 0.55, slots = three ? [-36, 0, 36] : [-19, 19], half = three ? 36 : 19;
        slots.forEach((dx, i) => {
          const x = vx + dx + (r.next() - 0.5) * 5, y = vy + (r.next() - 0.5) * 6 + (i % 2) * 5;
          const v = r.next() < 0.62 ? 0 : 1, f = r.next() < 0.5, ph = r.next();
          if (ok(x, y, 10)) add(x, y, 'house', v, f, ph);
        });
        const fence = r.next() < 0.8;
        for (const s of [-1, 1]) { const x = vx + s * (half + 31), y = vy + 7, ph = r.next(); if (fence && ok(x, y, 12)) add(x, y, 'fence', 0, s < 0, ph); }
        const ls = r.next() < 0.5 ? -1 : 1;
        { const x = vx + ls * (half * 0.5 + 4), y = vy + 18; if (ok(x, y, 4)) add(x, y, 'lamp', 0, false, r.next()); }
        { const x = vx - ls * (half + 13), y = vy + 11; if (ok(x, y, 6)) add(x, y, 'barrel', r.next() < 0.6 ? 0 : 1, false, r.next()); }
        for (const s of [-1, 1]) {
          const go = r.next() < 0.65, x = vx + s * (half + 10 + r.next() * 8), y = vy - 15 - r.next() * 6, v = r.next() < 0.5 ? 0 : 1, f = r.next() < 0.5;
          if (go && ok(x, y, 5)) add(x, y, 'tree', v, f, r.next());
        }
      });
      // 3) the road: lamp posts on its shoulders, fences along its straight east-west runs
      forCells(info, 130, 70, (cx, cy) => {
        const r = U.rng(U.hashInt(cx, cy, 4502));
        if (r.next() > 0.62) return;
        let x = (cx + r.next()) * 130, y = (cy + r.next()) * 130;
        const want = r.next() < 0.5 ? -7 : -8, kind = r.next(), f = r.next() < 0.5, ph = r.next();
        let pf = pathField(x, y);
        if (pf < -62) return;
        let gx = 0, gy = 0, gl = 1;
        for (let k = 0; k < 3; k++) {
          gx = (pathField(x + 1.5, y) - pf) / 1.5; gy = (pathField(x, y + 1.5) - pf) / 1.5; gl = Math.hypot(gx, gy) || 1;
          const d = (want - pf) / gl;
          x += (gx / gl) * d; y += (gy / gl) * d; pf = pathField(x, y);
        }
        if (Math.abs(pf - want) > 1.5) return;
        const m = matSafe(x, y, 3);
        if (m < 0 || m > 2) return;
        const flat = Math.abs(gy / gl) > 0.9;
        if (flat && kind < 0.4) add(x, y + (gy > 0 ? -2 : 2), 'fence', 0, f, ph);
        else add(x, y, 'lamp', 0, f, ph);
      });
      // 4) cattails ring the ponds (projected onto the shore line)
      forCells(info, 34, 30, (cx, cy) => {
        const r = U.rng(U.hashInt(cx, cy, 4603));
        if (r.next() > 0.55) return;
        let x = (cx + r.next()) * 34, y = (cy + r.next()) * 34;
        const v = r.next() < 0.6 ? 0 : 1, f = r.next() < 0.5, ph = r.next(), bare = r.next() < 0.12;
        const want = bare ? -13 : -1.5;
        let pf = pondRaw(x, y);
        if (pf < -30 || pf > 30) return;
        for (let k = 0; k < 2; k++) {
          const gx = (pondRaw(x + 1.5, y) - pf) / 1.5, gy = (pondRaw(x, y + 1.5) - pf) / 1.5, gl = Math.hypot(gx, gy) || 1;
          const d = (want - pf) / gl;
          x += (gx / gl) * d; y += (gy / gl) * d; pf = pondRaw(x, y);
        }
        fieldsAt(x, y, FT);
        if (Math.abs(FT[3] - want) > 3 || FT[2] > -6) return;
        if (bare) { if (FT[1] < -4) add(x, y, 'tree', 2, f, ph); } else add(x, y, 'reeds', v, f, ph);
      });
      // 5) flower patches: a big faced daisy at the centre of most of them
      const PO3 = { x: 0, y: 0, h: 0 };
      forCells(info, PATCH, 0, (cx, cy) => {
        if (!patchAt(cx, cy, PO3) || ((PO3.h >>> 24) & 3) === 0) return;
        add(PO3.x, PO3.y, 'daisies', 0, ((PO3.h >>> 26) & 1) === 1, ((PO3.h >>> 27) & 31) / 31);
      });
      // 6) a few singles in the open: a barrel, mushrooms, a mound, a bare curly tree
      G.scatterOwned(info, 150, 4343, (x, y, rng) => {
        const r = rng.next(), vr = rng.next(), f = rng.chance(0.5), ph = rng.next();
        if (r > 0.3 || G.nearSpawn(x, y, 95)) return;
        const m = matSafe(x, y, 12);
        if (m < 0 || m > 1) return;
        const t = r < 0.08 ? 'barrel' : r < 0.18 ? 'shroom' : 'hill';
        out.push({ x, y, t, v: vr < 0.5 ? 0 : 1, f, ph, pad: 34 });
      });
      return out;
    },

    drawProp(ctx, p, view) {
      markOwn('props', view.rt);
      const d = PROP_DEF[p.t], s = SPR.props[p.t][p.v];
      if (!d || !s) return;
      const spr = p.f ? s.l : s.n;
      const V = tf(view);
      // everything dances on the shared beat: a squash on the beat, a sway from beat to beat. Tall props
      // follow through a little later (lag), each prop swings with its own amplitude, so nothing is rigid.
      const b = beatAt(view.rt - d.lag - p.ph * 0.04);
      const amp = 0.8 + p.ph * 0.4;
      const k = b.sway * d.sw * amp, sy = 1 - d.sq * b.q, sx = 1 + d.sq * 0.75 * b.q;
      blitSkew(ctx, V, spr, p.x, p.y, sx, sy, k);
      if (p.t === 'lamp') {
        const fl = 0.82 + 0.18 * h1(Math.floor(view.rt * 24), 7);
        ctx.globalAlpha = fl * 0.8;
        blit(ctx, SPR.glow, p.x + k * 34 * sy, p.y - 34 * sy, 1, 1);
        ctx.globalAlpha = 1;
      } else if (p.t === 'mill') {
        // the sails turn steadily and give a little kick on every beat
        const dir = p.f ? -1 : 1;
        const rot = dir * (view.rt * 0.85 + p.ph * 6 + 0.12 * b.q);
        blitRot(ctx, V, SPR.blades, p.x + k * 43 * sy, p.y - 43 * sy, 1, 1, rot);
      } else if (p.t === 'house' && p.v === 0) {
        // chimney smoke: three curly puffs rising in turn
        const cx = p.x + (p.f ? -6.8 : 6.8), cy = p.y - 33 * sy;
        for (let i = 0; i < 3; i++) {
          const t = U.fract(view.rt * 0.45 + i / 3 + p.ph);
          const sc = (0.25 + t * 0.55) * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1);
          if (sc <= 0.02) continue;
          ctx.globalAlpha = 0.95;
          blit(ctx, SPR.puff[t > 0.5 ? 1 : 0], cx + Math.sin(t * 5 + i) * 2.4 + k * 33 + t * 5, cy - t * 18, sc, sc);
        }
        ctx.globalAlpha = 1;
      }
    },
    drawShadow(ctx, o) {
      let rx, ry, x = o.x, y = o.y;
      if (o.kind === 'prop') { const d = PROP_DEF[o.t]; if (!d) return; rx = d.sh[0]; ry = d.sh[1]; }
      else if (o.kind === 'enemy') {
        let k = 1;
        if (o.dying) {
          if (o.type === 'ghost') k = Math.max(0, 1 - o.deathT);
          else { if (o.deathT > 0.52) return; k = o.deathT < 0.3 ? 1 : 1 - (o.deathT - 0.3) / 0.22; }
        }
        if (o.spawnT < 1) k *= U.clamp(o.spawnT * 2.5 - 0.3, 0, 1);
        if (k <= 0.02) return;
        if (o.type === 'ghost') { rx = 5.4 * k; ry = 1.9 * k; }
        else if (o.type === 'colossus') { rx = 19 * k; ry = 5.6 * k; }
        else { rx = 7.4 * k; ry = 2.6 * k; }
      } else {
        rx = 8.6; ry = 2.8;
        if (o.moving) { const h = Math.abs(Math.sin(o.anim * 0.2 * TAU)); rx -= (1 - h) * 1.0; }
      }
      ctx.fillStyle = 'rgba(22,18,14,0.36)';
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    },

    drawGroundOverlay(ctx, view, game) {
      // spawn: an ink puddle spreads, the creature springs out of it, the puddle dries up
      for (const e of game.enemies) {
        if (e.dying || e.spawnT >= 1) { e._rhPop = false; continue; }
        if (e.x < view.x0 - 40 || e.x > view.x1 + 40 || e.y < view.y0 - 20 || e.y > view.y1 + 60) continue;
        const ghost = e.type === 'ghost';
        if (!e._rhPop && game.state === 'play') {
          e._rhPop = true;
          if (!ghost) {
            const n = e.type === 'colossus' ? 6 : 3;
            for (let i = 0; i < n; i++) {
              const a = Math.random() * TAU;
              game.addParticle({ kind: 'drop', x: e.x, y: e.y, z: 1, vx: Math.cos(a) * 26, vy: Math.sin(a) * 12, vz: 60 + Math.random() * 40, grav: 260, drag: 1, life: 0.5, size: 0.55 + Math.random() * 0.3, rot: 0, vr: 0 });
            }
          } else puff(game, e.x, e.y, 6, 0, 0.5, 0, 0, 0.45, 6);
        }
        if (ghost) continue;
        const t = e.spawnT;
        const a = t < 0.2 ? U.ease.outBack(t / 0.2) : t > 0.6 ? Math.max(0, 1 - (t - 0.6) / 0.4) : 1;
        if (a <= 0.01) continue;
        const rx = (e.type === 'colossus' ? 20 : 10) * a, ry = rx * 0.4;
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 0.4, rx, ry, 0, 0, TAU);
        const sd = e.seed * 100;
        for (let i = 0; i < 5; i++) { const an = sd + i * 1.3, d = rx * (1.15 + 0.2 * Math.sin(sd + i)); const px = e.x + Math.cos(an) * d, py = e.y + 0.4 + Math.sin(an) * d * 0.4; ctx.moveTo(px + rx * 0.12, py); ctx.arc(px, py, rx * 0.12, 0, TAU); }
        ctx.fill();
        ctx.strokeStyle = 'rgba(239,233,220,0.55)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.ellipse(e.x - rx * 0.25, e.y - ry * 0.1, rx * 0.45, ry * 0.4, 0, PI * 1.1, PI * 1.7); ctx.stroke();
      }
    },

    drawWorldOverlay(ctx, view) {
      // music in the air: a few notes drift up and fade, in time with the beat
      const V = tf(view), cell = 190, rt = view.rt;
      const x0 = Math.floor((view.x0 - 40) / cell), x1 = Math.floor((view.x1 + 40) / cell);
      const y0 = Math.floor((view.y0 - 40) / cell), y1 = Math.floor((view.y1 + 60) / cell);
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const h = U.hash2(cx, cy, 731);
          if (h > 0.45) continue;
          const h2 = U.hash2(cx, cy, 732);
          const t = U.fract(rt / 3.4 + h * 7);
          const bx = (cx + 0.2 + h2 * 0.6) * cell, by = (cy + 0.3 + h * 0.6) * cell;
          const x = bx + Math.sin(t * TAU * 1.5 + h * 9) * 5, y = by - t * 30 - 16;
          if (x < view.x0 - 10 || x > view.x1 + 10 || y < view.y0 - 10 || y > view.y1 + 10) continue;
          ctx.globalAlpha = Math.sin(t * PI) * 0.7;
          const sc = 0.8 + 0.12 * beat(rt).q;
          blitRot(ctx, V, SPR.note[(h2 * 30 | 0) % 3], x, y, sc, sc, Math.sin(t * TAU * 1.5 + h * 9) * 0.25);
        }
      }
      ctx.globalAlpha = 1;
    },

    drawGem(ctx, g, view) {
      markOwn('fx', view.rt);
      let h = 2.2 + Math.sin(view.rt * 4 + g.seed * 20) * 1.2;
      let sc = 1;
      if (g.pop > 0) { const q = 1 - g.pop; h += Math.sin(q * PI) * 10; sc = 0.4 + 0.6 * U.ease.outBack(Math.min(1, q * 1.4)); }
      const k = 1 / K, ss = SPR.shadow, ssc = (g.big ? 1.4 : 0.95) * (1 - h * 0.025);
      ctx.drawImage(ss.c, g.x - ss.ox * k * ssc, g.y - ss.oy * k * ssc, ss.c.width * k * ssc, ss.c.height * k * ssc);
      if (g.big) {
        const b = 1 + 0.08 * beat(view.rt).q;
        blit(ctx, SPR.diamond, g.x, g.y - h - 1.5, sc * b, sc * b);
        const tw = Math.sin(view.rt * 3 + g.seed * 9);
        if (tw > 0.55) { const V = tf(view); const q = (tw - 0.55) / 0.45; blitRot(ctx, V, SPR.twinkle, g.x + 4.2, g.y - h - 8, q * 0.6, q * 0.6, 0); }
      } else {
        // a spinning coin: squash horizontally
        const sp = Math.cos(view.rt * 5 + g.seed * 20);
        blit(ctx, SPR.coin, g.x, g.y - h, sc * Math.max(0.18, Math.abs(sp)), sc);
      }
    },

    drawEnemy(ctx, e, view) {
      markOwn('chars', view.rt);
      const V = tf(view), rt = view.rt;
      const ghost = e.type === 'ghost', big = e.type === 'colossus';
      let set, rot = 0, sx = 1, sy = 1, y = e.y, x = e.x, alpha = 1, fi = 0;
      const scl = (0.95 + e.seed * 0.1) * (e.type === 'creeper' ? 1.12 : 1);
      const B2 = beat(rt);
      let hatLift = 0, hatRot = 0;
      if (e.type === 'creeper') {
        // a hop cycle with its own phase per creature (seed) – the baked frames carry the squash & stretch
        const fr = U.fract(e.anim * 0.55 + e.seed);
        fi = Math.floor(fr * 6) % 6;
        set = SPR.imp[Math.floor(e.seed * 3) % 3][fi];
        rot = Math.sin(fr * TAU) * 0.07;
      } else if (ghost) {
        const t = rt * 2.6 + e.seed * 12;
        set = SPR.ghost[Math.floor(rt * 8 + e.seed * 6) % 6];
        // an uneven hover (two partials) that lingers near the top; stretch while rising, squash while sinking
        y -= 4.6 + Math.sin(t) * 1.5 + Math.sin(t * 2 + 1.1) * 0.55;
        rot = U.clamp(e.vx / 64, -1, 1) * 0.16;
        const b = Math.cos(t);
        sx = 1 - b * 0.045; sy = 1 + b * 0.05;
      } else {
        const fr = U.fract(e.anim * 0.3 + e.seed);
        fi = Math.floor(fr * 8) % 8;
        set = SPR.bully[fi];
        sx = 1 + 0.03 * B2.q; sy = 1 - 0.03 * B2.q;
        rot = Math.sin(fr * TAU) * 0.03;
        // the hat jumps a little after every heavy landing and tips the other way
        hatLift = 2.6 * Math.pow(Math.max(0, Math.sin((fr * 2 - 0.16) * TAU)), 2);
        hatRot = 0.11 * Math.sin(fr * TAU - 0.8);
      }
      sx *= scl; sy *= scl;
      const left = e.facing < 0;
      if (e.spawnT < 1) {
        const t = e.spawnT;
        if (ghost) {
          // unrolls upward out of its puff: a thin streak first, then it fills out with an overshoot
          const q = U.clamp(t / 0.75, 0, 1);
          alpha *= U.clamp(t * 3.5, 0, 1);
          sy *= 0.2 + 0.8 * U.ease.outBack(q); sx *= 0.5 + 0.5 * U.smoothstep(0.15, 1, q);
        } else {
          // the ink puddle spreads (to 0.18), the creature springs out of it stretched, lands in a squash, settles
          if (t < 0.18) return;
          const q = (t - 0.18) / 0.82;
          let kx, ky, hop = 0;
          if (q < 0.4) { const u = U.ease.outQuad(q / 0.4); ky = 0.1 + 1.2 * u; kx = 0.5 + 0.32 * u; hop = 4.5 * u; }
          else if (q < 0.55) { const u = (q - 0.4) / 0.15, u2 = u * u; ky = 1.3 - 0.58 * u2; kx = 0.82 + 0.46 * u2; hop = 4.5 * (1 - u2); }
          else { const u = (q - 0.55) / 0.45, sp = Math.exp(-5 * u) * Math.cos(u * 9); ky = 1 - 0.28 * sp; kx = 1 + 0.28 * sp; }
          sx *= kx; sy *= ky; y -= hop * scl; rot *= q;
        }
      }
      if (e.dying) return drawDeath(ctx, V, e, set, left, x, y, sx, sy, rot, fi, rt);
      // hit: a sharp squash that springs back through a stretch (~120 ms), the body recoils away from the blow,
      // and a negative-flash frame on top
      const hT = e.hitT;
      if (hT < 0.45 && e.spawnT >= 1) {
        const sp = Math.exp(-11 * hT) * Math.cos(hT * 30);
        const A = big ? 0.2 : 0.3;
        sx *= 1 + A * 0.8 * sp; sy *= 1 - A * sp;
        rot += U.clamp((e.kx || 0) / 140, -1, 1) * 0.32 * Math.exp(-9 * hT);
        if (big) hatLift += 7 * Math.exp(-7 * hT) * Math.max(0, Math.sin(hT * 9));
      }
      const fl = e.flash;
      ctx.globalAlpha = alpha;
      const s = left ? set.nl : set.n;
      if (rot) blitRot(ctx, V, s, x, y, sx, sy, rot); else blit(ctx, s, x, y, sx, sy);
      if (fl > 0.02) {
        ctx.globalAlpha = Math.min(0.9, fl * 1.4) * alpha;
        const f2 = left ? set.fl : set.f;
        if (rot) blitRot(ctx, V, f2, x, y, sx, sy, rot); else blit(ctx, f2, x, y, sx, sy);
      }
      if (big) drawHat(ctx, V, x, y, sx, sy, rot, fi, left, hatLift, hatRot, fl, alpha);
      ctx.globalAlpha = 1;
    },

    drawPlayer(ctx, p, view) {
      markOwn('chars', view.rt);
      const V = tf(view), game = view.game, rt = view.rt;
      const B2 = beat(rt);
      let set, sx = 1, sy = 1, lift = 0, rot = 0;
      const hurt = p.hurtT > 0;
      const left = p.facing < 0;
      // per-actor phase (clones on the sheet do not blink in unison)
      const own = U.fract((p.x || 0) * 0.0131 + (p.y || 0) * 0.0071);
      // the skid: 0.16 s of heels-dug-in follow-through after every dash
      if (p.dashT > 0) p._rhDashOn = true;
      else if (p._rhDashOn) { p._rhDashOn = false; p._rhSkid = rt; }
      const skid = p._rhSkid !== undefined && rt - p._rhSkid < 0.16 && p.dashT <= 0;
      if (hurt) set = SPR.hurt;
      else if (p.dashT > 0) set = SPR.dash[Math.floor(rt * 22) & 1];
      else if (skid) {
        set = SPR.skid;
        const q = (rt - p._rhSkid) / 0.16;
        sx = 1 + 0.12 * (1 - q); sy = 1 - 0.1 * (1 - q);
      } else if (p.moving) {
        const cyc = p.anim * 0.2, fr = U.fract(cyc);
        const fi = Math.floor(fr * 8) % 8;
        set = SPR.walk[fi];
        // a touch of extra squash on the two "down" frames, a stretch on the "up" frames
        const k = fi % 4;
        if (k === 1) { sy = 0.955; sx = 1.035; } else if (k === 3) { sy = 1.03; sx = 0.98; }
        const step = Math.floor(cyc * 2);
        if (p._rhStep !== step) {
          if (p._rhStep !== undefined && game && game.state === 'play' && Math.random() < 0.45) {
            puff(game, p.x - p.facing * 3, p.y + 0.5, 1.0, 1, 0.26, -p.vx * 0.12, -p.vy * 0.12, 0.28, 2.5);
          }
          p._rhStep = step;
        }
      } else {
        // idle: dip on the beat, rise, tap the toe, settle – and blink now and then
        const ph = B2.ph, k = ph < 0.18 ? 0 : ph < 0.42 ? 1 : ph < 0.78 ? 2 : 3;
        const blink = U.fract(rt / 3.3 + own) < 0.045 && (k === 0 || k === 2);
        set = SPR.idle[blink ? (k === 0 ? 4 : 5) : k];
        rot = B2.sway * 0.022;
        p._rhStep = undefined;
      }
      if (p.shootT > 0) { sy *= 1 - 0.05 * p.shootT; sx *= 1 + 0.04 * p.shootT; }
      if (p.levelT > 0) { const w = Math.sin(p.levelT * PI * 4) * p.levelT; sy *= 1 + 0.2 * w; sx *= 1 - 0.14 * w; lift = Math.sin(p.levelT * PI) * 5; }
      if (hurt) { sx *= 1 + 0.12 * p.hurtT; sy *= 1 - 0.1 * p.hurtT; rot = Math.sin(p.hurtT * 30) * 0.08 * p.hurtT; }
      if (p.dashT > 0) {
        const k = U.clamp(p.dashT / 0.2, 0, 1);
        sx *= 1 + 0.16 * k; sy *= 1 - 0.08 * k;
        // speed lines behind
        ctx.strokeStyle = INK; ctx.lineCap = 'round';
        const dx = -p.dashX, dy = -p.dashY;
        for (let i = 0; i < 4; i++) {
          const o = (i - 1.5) * 5.5, h = [-26, -18, -10, -4][i];
          const x = p.x + dx * 8 - dy * o * 0.3, y = p.y + h + dy * 6;
          ctx.lineWidth = 0.9 - i * 0.1; ctx.globalAlpha = 0.85 * k;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * (12 + i * 3), y + dy * (12 + i * 3)); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      let a = 1;
      if (p.iframes > 0 && !hurt && p.dashT <= 0 && (Math.floor(rt * 16) & 1)) a = 0.55;
      ctx.globalAlpha = a;
      blitRot(ctx, V, left ? set.nl : set.n, p.x, p.y - lift, sx, sy, rot);
      if (hurt) {
        ctx.globalAlpha = Math.min(1, p.hurtT * 1.4);
        blitRot(ctx, V, left ? set.fl : set.f, p.x, p.y - lift, sx, sy, rot);
      }
      ctx.globalAlpha = 1;
    },

    drawOrbital(ctx, o, view) {
      markOwn('fx', view.rt);
      const V = tf(view);
      const bob = Math.sin(view.rt * 5 + o.idx * 1.7) * 1.6;
      const k = 1 / K, ss = SPR.shadow;
      ctx.drawImage(ss.c, o.x - ss.ox * k * 1.1, o.y + 5 - ss.oy * k * 1.1, ss.c.width * k * 1.1, ss.c.height * k * 1.1);
      const fr = Math.floor(view.rt * 10 + o.idx * 3) & 1;
      const s = SPR.bird[fr];
      const right = -Math.sin(o.angle) >= 0;
      blitRot(ctx, V, right ? s.n : s.l, o.x, o.y - 6 + bob, 1.05, 1.05, Math.cos(o.angle) * 0.12);
    },

    drawProjectile(ctx, pr, view) {
      markOwn('fx', view.rt);
      const V = tf(view);
      ctx.globalAlpha = Math.min(1, pr.age * 12) * 0.85;
      blitRot(ctx, V, SPR.streak, pr.x, pr.y, 1, 1, pr.angle);
      ctx.globalAlpha = 1;
      const v = Math.floor(pr.seed * 3) % 3;
      const wob = Math.sin(pr.spin * 0.9) * 0.35;
      blitRot(ctx, V, SPR.note[v], pr.x, pr.y + 2.5, 0.95, 0.95, wob);
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
          spr = SPR.star;
          sc = t < 0.12 ? t / 0.12 : t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
          s = pt.size * sc;
          break;
        case 'pow':
          spr = SPR.pow;
          sc = t < 0.3 ? 0.5 + (t / 0.3) * 0.75 : 1.25 - ((t - 0.3) / 0.7) * 0.9;
          s = pt.size * sc;
          break;
        case 'twinkle':
          spr = SPR.twinkle;
          sc = t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7;
          s = pt.size * sc; rot = t * 1.5;
          break;
        case 'drop':
          spr = SPR.drop;
          s = pt.size * (t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1);
          rot = pt.vz > 0 ? PI : 0;
          break;
        case 'sweat':
          spr = SPR.sweat;
          s = pt.size * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1);
          rot = pt.vx > 0 ? 0.6 : -0.6;
          break;
        case 'note': {
          spr = SPR.note[pt.tint || 0];
          s = pt.size * (t < 0.15 ? U.ease.outBack(t / 0.15) : 1);
          ctx.globalAlpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
          blitRot(ctx, V, spr, pt.x + Math.sin(t * 9 + pt.seed * 10) * 3, pt.y - z, s, s, Math.sin(t * 9 + pt.seed * 10) * 0.3);
          ctx.globalAlpha = 1;
          return;
        }
        case 'ring': {
          const r = pt.size * (4 + 26 * U.ease.outQuad(t));
          const w = 2.2 * (1 - t);
          if (w <= 0.05) return;
          ctx.beginPath(); ctx.ellipse(pt.x, pt.y, r, r * 0.45, 0, 0, TAU);
          ctx.strokeStyle = INK; ctx.lineWidth = w + 1.4; ctx.stroke();
          ctx.strokeStyle = C.white; ctx.lineWidth = w; ctx.stroke();
          return;
        }
        case 'rays': {
          const r0 = pt.size * (5 + 22 * U.ease.outQuad(t)), len = pt.size * 7 * (1 - t);
          if (len <= 0.1) return;
          ctx.strokeStyle = INK; ctx.lineWidth = 1.1 * (1 - t * 0.6); ctx.lineCap = 'round';
          ctx.beginPath();
          for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + pt.seed; const co = Math.cos(a), si = Math.sin(a) * 0.62; ctx.moveTo(pt.x + co * r0, pt.y - z + si * r0); ctx.lineTo(pt.x + co * (r0 + len), pt.y - z + si * (r0 + len)); }
          ctx.stroke();
          return;
        }
        case 'zip': {
          const a = 1 - t;
          const l = 10 * a + 2;
          const vl = Math.hypot(pt.vx, pt.vy) || 1;
          ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.globalAlpha = a; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(pt.x, pt.y - z); ctx.lineTo(pt.x - (pt.vx / vl) * l, pt.y - z - (pt.vy / vl) * l); ctx.stroke();
          ctx.globalAlpha = 1;
          return;
        }
        default: {
          const a = U.clamp(pt.life / pt.max, 0, 1);
          ctx.globalAlpha = a; ctx.fillStyle = INK;
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
      let sx = t < 0.1 ? 0.3 + (t / 0.1) * 1.1 : t < 0.26 ? 1.4 - ((t - 0.1) / 0.16) * 0.4 : 1;
      let sy = t < 0.1 ? 1.6 - (t / 0.1) * 0.4 : t < 0.26 ? 1.2 - ((t - 0.1) / 0.16) * 0.2 : 1;
      if (t > 0.74) { const q = 1 - ((t - 0.74) / 0.26) * 0.7; sx *= q; sy *= q; }
      ctx.globalAlpha = t > 0.84 ? Math.max(0, 1 - (t - 0.84) / 0.16) : 1;
      blitRot(ctx, V, spr, n.x, n.y, sx, sy, (n.seed - 0.5) * 0.25);
      ctx.globalAlpha = 1;
    },

    drawIcon(ctx, id, size) {
      const fn = ICONS[id] || ICONS.dmg;
      ctx.save();
      ctx.scale(size / 48, size / 48);
      iconPaint(ctx, fn);
      ctx.restore();
    },

    /* the projector: grade, film layer (vignette, gate, grain, flicker), dust, scratches – stepped at 24 fps */
    drawDisplayOverlay(ctx, view) {
      const W = view.displayW, H = view.displayH, rt = view.rt;
      const tick = Math.floor(rt * 24);
      const u = H / 900;
      // silver-sepia grade (keeps luminance, replaces hue + saturation). The native palette already IS
      // graded, so the pass only runs while elements of other styles are on screen.
      const own = FILM.own, hk = view.game && view.game.hooks;
      const native = hk && hk.groundColor === this.groundColor && rt - own.chars < 1.5 && rt - own.props < 3 && rt - own.fx < 3;
      if (!native) {
        ctx.globalCompositeOperation = 'color';
        ctx.globalAlpha = 0.74;
        ctx.fillStyle = SEPIA; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
      }
      // film layer: one blit; variant = flicker step, offset = grain motion + gate weave
      const g = Math.max(1, Math.round(u * 1.3)), key = W + 'x' + H + ':' + g;
      if (FILM.key !== key) { FILM.layers = makeFilm(W, H, g); FILM.key = key; FILM.g = g; }
      let vi = h1(tick, 2) < 0.62 ? 1 : h1(tick, 3) < 0.6 ? 0 : 2;
      if (h1(tick, 9) < 0.03) vi = 2;
      const L = FILM.layers[vi], pad = FILM.pad;
      const wv = Math.sin(rt * 2.1) + Math.sin(rt * 5.3 + 1.3) * 0.6 + (h1(tick, 1) - 0.5) * 0.9;
      const dy = Math.round(wv * 0.8);
      const ox = pad + Math.round((h1(tick, 4) - 0.5) * 6), oy = pad + Math.round((h1(tick, 5) - 0.5) * 6) - dy;
      const sw = Math.ceil(W / g), shh = Math.ceil(H / g);
      ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(L, U.clamp(ox, 0, pad * 2), U.clamp(oy, 0, pad * 2), sw, shh, 0, 0, sw * g, shh * g);
      ctx.imageSmoothingEnabled = true;
      // dust specks and hairs (one frame each)
      const nd = Math.floor(h1(tick, 6) * 4.2);
      for (let i = 0; i < nd; i++) {
        const x = h1(tick, 10 + i) * W, y = h1(tick, 20 + i) * H, r = (0.6 + h1(tick, 30 + i) * 2.0) * u * 1.4;
        ctx.globalAlpha = 0.55 + h1(tick, 40 + i) * 0.35;
        const white = h1(tick, 50 + i) < 0.35;
        if (h1(tick, 60 + i) < 0.3) {
          ctx.strokeStyle = white ? '#f6f1e6' : '#0c0a08'; ctx.lineWidth = Math.max(1, 0.9 * u);
          const l = (10 + h1(tick, 70 + i) * 26) * u, a = h1(tick, 80 + i) * TAU;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 - l * 0.3, x + Math.cos(a + 1) * l, y + Math.sin(a + 1) * l * 0.5, x + Math.cos(a + 0.6) * l, y + Math.sin(a + 0.6) * l); ctx.stroke();
        } else {
          ctx.fillStyle = white ? '#f6f1e6' : '#0c0a08';
          ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.6 + h1(tick, 90 + i) * 0.5), h1(tick, 95 + i) * 3, 0, TAU); ctx.fill();
        }
      }
      // scratches: long vertical lines that run for a while, jittering sideways
      for (let sI = 0; sI < 3; sI++) {
        const dur = 14 + sI * 11, ep = Math.floor((tick + sI * 7) / dur);
        if (h1(ep, 100 + sI) > 0.42) continue;
        const x = (0.08 + h1(ep, 110 + sI) * 0.84) * W + (h1(tick, 120 + sI) - 0.5) * 3 * u;
        ctx.globalAlpha = 0.16 + h1(ep, 130 + sI) * 0.18;
        ctx.strokeStyle = sI !== 1 ? '#f8f4ea' : '#0c0a08';
        ctx.lineWidth = Math.max(1, (0.7 + h1(ep, 140 + sI)) * u);
        ctx.beginPath(); ctx.moveTo(x, 0);
        for (let k = 1; k <= 4; k++) ctx.lineTo(x + (h1(tick * 5 + k, 150 + sI) - 0.5) * 2.2 * u, (H * k) / 4);
        ctx.stroke();
      }
      // a cue mark blinks in the corner every now and then
      if (tick % 720 < 5) {
        ctx.globalAlpha = 0.7; ctx.fillStyle = '#0c0a08';
        ctx.beginPath(); ctx.arc(W * 0.905, H * 0.1, H * 0.028, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#d9d2c3'; ctx.lineWidth = Math.max(1, 1.5 * u); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },

    /* --------------------------------------------------------------- hooks */
    onHit(game, e) {
      const h = e.type === 'colossus' ? 30 : e.type === 'ghost' ? 17 : 11;
      game.addParticle({ kind: 'pow', x: e.x + (Math.random() - 0.5) * 5, y: e.y + 0.5, z: h + (Math.random() - 0.5) * 5, life: 0.16, size: e.type === 'colossus' ? 0.95 : 0.7, rot: Math.random() * TAU, drag: 0 });
      if (Math.random() < 0.5) {
        const a = Math.random() * TAU;
        game.addParticle({ kind: 'twinkle', x: e.x, y: e.y + 0.5, z: h, vx: Math.cos(a) * 60, vy: Math.sin(a) * 30, vz: 40, grav: 200, drag: 2, life: 0.32, size: 0.6 });
      }
    },
    onKill(game, e) {
      const x = e.x, y = e.y + 0.6, T = e.type;
      const big = T === 'colossus', ghost = T === 'ghost';
      const h = big ? 26 : ghost ? 14 : 10;
      // the poof: a cluster of curly cloud puffs
      puff(game, x, y, h, 0, big ? 1.9 : 1.15, 0, 0, 0.45, 5);
      const nP = big ? 9 : 5;
      for (let i = 0; i < nP; i++) {
        const a = (i / nP) * TAU + Math.random() * 0.6;
        const sp = (big ? 46 : 30) * (0.6 + Math.random() * 0.6);
        puff(game, x + Math.cos(a) * 3, y + Math.sin(a) * 1.2, h + Math.sin(a) * 4, i % 3 === 2 ? 1 : 0, (big ? 1.3 : 0.8) * (0.75 + Math.random() * 0.5), Math.cos(a) * sp, Math.sin(a) * sp * 0.55, 0.4 + Math.random() * 0.2, 7);
      }
      const nS = big ? 6 : ghost ? 2 : 3;
      for (let i = 0; i < nS; i++) star(game, x, y, h, (big ? 0.95 : 0.7) * (0.8 + Math.random() * 0.4), 50 + Math.random() * 50, 0.6 + Math.random() * 0.15);
      if (!ghost) {
        const nD = big ? 7 : 3;
        for (let i = 0; i < nD; i++) {
          const a = Math.random() * TAU, sp = 30 + Math.random() * 40;
          game.addParticle({ kind: 'drop', x, y, z: h * 0.7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 60 + Math.random() * 60, grav: 280, drag: 1.2, life: 0.7 + Math.random() * 0.3, size: (big ? 1.1 : 0.8) * (0.8 + Math.random() * 0.4), rot: 0, vr: 0 });
        }
      }
      if (big) { game.addParticle({ kind: 'ring', x, y, life: 0.45, size: 1.4, drag: 0 }); game.addParticle({ kind: 'rays', x, y, z: h, life: 0.4, size: 1.3, drag: 0 }); }
    },
    onHurt(game, p) {
      game.addParticle({ kind: 'pow', x: p.x, y: p.y + 0.5, z: 18, life: 0.2, size: 1.15, rot: Math.random() * TAU, drag: 0 });
      for (let i = 0; i < 4; i++) star(game, p.x, p.y + 0.5, 26, 0.7, 55, 0.55);
      for (let i = 0; i < 2; i++) {
        const sgn = i ? 1 : -1;
        game.addParticle({ kind: 'sweat', x: p.x + sgn * 6, y: p.y + 0.5, z: 30, vx: sgn * 30, vy: 0, vz: 40, grav: 200, drag: 1.5, life: 0.5, size: 0.75 });
      }
    },
    onPickup(game, g) {
      const p = game.player;
      game.addParticle({ kind: 'twinkle', x: p.x + (Math.random() - 0.5) * 12, y: p.y + 0.5, z: 10 + Math.random() * 16, vz: 0, life: 0.32, size: g.big ? 1.0 : 0.6, drag: 0 });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.35) game.addParticle({ kind: 'twinkle', x: pr.x, y: pr.y + 4, z: 4, vx: pr.vx * 0.05, vy: pr.vy * 0.05, life: 0.18, size: 0.4, drag: 0 });
    },
    onDash(game, p) {
      for (let i = 0; i < 3; i++) puff(game, p.x - p.dashX * i * 3 + (Math.random() - 0.5) * 4, p.y + 0.5 - p.dashY * i * 3, 1.5, 1, 0.5 + Math.random() * 0.2, -p.dashX * 20, -p.dashY * 20, 0.38, 3);
      for (let i = 0; i < 4; i++) game.addParticle({ kind: 'zip', x: p.x + (Math.random() - 0.5) * 8, y: p.y + 0.5, z: 4 + i * 6, vx: -p.dashX * 80, vy: -p.dashY * 80, drag: 6, life: 0.3, size: 1 });
    },
    onLevelUp(game, p) {
      game.addParticle({ kind: 'ring', x: p.x, y: p.y, life: 0.6, size: 1.6, drag: 0 });
      game.addParticle({ kind: 'rays', x: p.x, y: p.y, z: 16, life: 0.55, size: 1.5, drag: 0 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU, sp = 26 + Math.random() * 20;
        game.addParticle({ kind: 'note', tint: i % 3, x: p.x + Math.cos(a) * 6, y: p.y + 0.5, z: 18, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, vz: 40 + Math.random() * 20, drag: 1.4, life: 1.1 + Math.random() * 0.4, size: 0.9 + Math.random() * 0.3 });
      }
      for (let i = 0; i < 6; i++) star(game, p.x, p.y + 0.5, 16, 0.75, 70 + Math.random() * 30, 0.9);
    },
    onDeath(game, p) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        puff(game, p.x, p.y + 0.5, 14, i % 2, 1.1, Math.cos(a) * 40, Math.sin(a) * 22, 0.7, 8);
      }
      for (let i = 0; i < 5; i++) star(game, p.x, p.y + 0.5, 22, 0.8, 60, 0.9);
    },
  });
})();
