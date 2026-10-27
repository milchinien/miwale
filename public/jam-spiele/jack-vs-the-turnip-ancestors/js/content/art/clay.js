/* Native art for the new enemies / upgrades in the 'clay' world (Knetwelt) – see js/content/ART_API.md.
   Same language as js/styles/clay.js: no outlines, every part is a soft plasticine volume (base fill, key light,
   inner AO, rim light, fingerprint pattern, soft spec), pressed grooves, white clay eyeballs, rolled sausages.
   Stop-motion feel: 12 fps "boil" jitter, stepped spawn rise, squash-flat death.
   Sprites are built lazily per enemy type on its first appearance (the clay painter is expensive). */
(function () {
  'use strict';
  const U = window.U, Cn = window.Content;
  const TAU = Math.PI * 2, PI = Math.PI;

  let K = 3, PK = 3;
  let FPC = null;
  let PR = U.rng(1);
  const SPR = {};

  const hx = U.hex;
  const rgbS = (a, al) => (al === undefined
    ? 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')'
    : 'rgba(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ',' + al + ')');
  const lighten = (c, t) => U.mix(c, [255, 251, 240], t);
  const darken = (c, t) => U.mix(U.mul(c, 1 - t), [64, 26, 52], t * 0.3);

  /* ----------------------------------------------------------- shape helpers (copied from the style) */
  const E = (x, y, rx, ry, rot) => (c) => { rot = rot || 0; c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
  const CAP = (x1, y1, x2, y2, r) => (c) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.moveTo(x1 + Math.cos(a + PI / 2) * r, y1 + Math.sin(a + PI / 2) * r);
    c.arc(x1, y1, r, a + PI / 2, a + PI * 1.5);
    c.arc(x2, y2, r, a - PI / 2, a + PI / 2);
    c.closePath();
  };
  function blobPath(c, pts) {
    const n = pts.length;
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    c.closePath();
  }
  function lumpPts(cx, cy, rx, ry, n, amt, r) {
    const pts = [], ph = r.next() * TAU;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + (r.next() - 0.5) * amt + Math.sin(a * 3 + ph) * amt * 0.25;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  }
  function pumpkinPath(c, cx, cy, rx, ry) {
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * TAU, co = Math.cos(th), si = Math.sin(th);
      const x = Math.sign(co) * Math.pow(Math.abs(co), 0.85) * rx;
      let y = Math.sign(si) * Math.pow(Math.abs(si), 0.92) * ry;
      const top = Math.exp(-Math.pow((th - PI * 1.5) / 0.3, 2)), bot = Math.exp(-Math.pow((th - PI * 0.5) / 0.26, 2));
      y *= 1 - 0.15 * top - 0.07 * bot;
      if (i) c.lineTo(cx + x, cy + y); else c.moveTo(cx + x, cy + y);
    }
    c.closePath();
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
  const seedPathH = (c) => { c.moveTo(4.2, 0); c.bezierCurveTo(2.6, -2.7, -3.4, -3.0, -3.4, 0); c.bezierCurveTo(-3.4, 3.0, 2.6, 2.7, 4.2, 0); c.closePath(); };
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

  /* ================================================================ painter (copied from the style) */
  function clay(c, shape, col, o) {
    o = o || {};
    const b = o.b, cx = b[0], cy = b[1], rx = b[2], ry = b[3], R = Math.max(rx, ry);
    if (typeof col === 'string') col = hx(col);
    const base = rgbS(col);
    if (o.cast !== 0) {
      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.shadowColor = 'rgba(52,22,24,' + (o.cast || 0.42) + ')';
      c.shadowBlur = Math.min(R * 0.4, 2.4) * PK;
      c.shadowOffsetX = Math.min(R * 0.06, 0.45) * PK;
      c.shadowOffsetY = Math.min(R * 0.2, 1.4) * PK;
      c.fillStyle = base;
      c.beginPath(); shape(c); c.fill();
      c.restore();
    }
    c.save();
    c.beginPath(); shape(c);
    c.fillStyle = base; c.fill();
    c.clip();
    const g = c.createRadialGradient(cx - rx * 0.25, cy - ry * 0.5, R * 0.04, cx + rx * 0.05, cy + ry * 0.05, R * 1.22);
    g.addColorStop(0, rgbS(lighten(col, o.lit === undefined ? 0.2 : o.lit)));
    g.addColorStop(0.5, base);
    g.addColorStop(1, rgbS(o.dark || darken(col, 0.4)));
    c.fillStyle = g; c.fillRect(cx - R * 2.5, cy - R * 2.5, R * 5, R * 5);
    if (o.fp !== 0 && FPC) {
      const pat = c.createPattern(FPC, 'repeat');
      pat.setTransform(new DOMMatrix([1 / PK, 0, 0, 1 / PK, PR.next() * 60, PR.next() * 60]));
      c.globalAlpha = o.fp || 1;
      c.fillStyle = pat; c.fillRect(cx - R * 1.6, cy - R * 1.6, R * 3.2, R * 3.2);
      c.globalAlpha = 1;
    }
    const OFF = 3000;
    c.save();
    c.beginPath();
    c.rect(cx - R * 3 + OFF, cy - R * 3, R * 6, R * 6);
    c.translate(OFF, 0); shape(c); c.translate(-OFF, 0);
    c.fillStyle = '#000';
    c.shadowColor = 'rgba(58,20,40,' + (o.ao === undefined ? 0.5 : o.ao) + ')';
    c.shadowBlur = R * 0.6 * PK;
    c.shadowOffsetX = -OFF * PK - R * 0.1 * PK;
    c.shadowOffsetY = -R * 0.3 * PK;
    c.fill('evenodd');
    if (o.rim !== 0) {
      c.shadowColor = 'rgba(255,247,230,' + (o.rim === undefined ? 0.42 : o.rim) + ')';
      c.shadowBlur = R * 0.26 * PK;
      c.shadowOffsetX = -OFF * PK + R * 0.04 * PK;
      c.shadowOffsetY = R * 0.12 * PK;
      c.fill('evenodd');
    }
    c.restore();
    if (o.detail) { c.save(); o.detail(c); c.restore(); }
    const sp = o.spec === undefined ? 0.3 : o.spec;
    if (sp > 0) {
      const h = o.hi || [cx - rx * 0.3, cy - ry * 0.52, R * 0.45];
      c.save(); c.translate(h[0], h[1]); c.rotate(-0.45); c.scale(1.4, 0.8);
      const sg = c.createRadialGradient(0, 0, 0, 0, 0, h[2]);
      sg.addColorStop(0, 'rgba(255,255,252,' + sp + ')');
      sg.addColorStop(0.45, 'rgba(255,253,244,' + (sp * 0.38) + ')');
      sg.addColorStop(1, 'rgba(255,252,240,0)');
      c.fillStyle = sg; c.beginPath(); c.arc(0, 0, h[2], 0, TAU); c.fill();
      if (o.gloss) {
        c.fillStyle = 'rgba(255,255,255,' + o.gloss + ')';
        c.beginPath(); c.ellipse(-h[2] * 0.1, -h[2] * 0.06, h[2] * 0.32, h[2] * 0.17, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    c.restore();
  }
  const cE = (c, x, y, rx, ry, col, o) => clay(c, E(x, y, rx, ry), col, Object.assign({ b: [x, y, rx, ry] }, o));
  const cCap = (c, x1, y1, x2, y2, r, col, o) => clay(c, CAP(x1, y1, x2, y2, r), col,
    Object.assign({ b: [(x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2 + r, Math.abs(y2 - y1) / 2 + r] }, o));
  const cLump = (c, x, y, rx, ry, col, amt, o) => {
    const pts = lumpPts(x, y, rx, ry, 11, amt, PR);
    clay(c, (k) => blobPath(k, pts), col, Object.assign({ b: [x, y, rx, ry] }, o));
  };
  function groove(c, path, w, a) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = 'rgba(58,22,18,' + a + ')'; c.lineWidth = w;
    c.beginPath(); path(c); c.stroke();
    c.save(); c.translate(0, w * 0.55);
    c.strokeStyle = 'rgba(255,240,220,' + a * 0.75 + ')'; c.lineWidth = w * 0.5;
    c.beginPath(); path(c); c.stroke(); c.restore();
  }
  function eye(c, x, y, rx, ry, px, py, pr) {
    cE(c, x, y, rx, ry, [250, 248, 240], { spec: 0.5, ao: 0.4, cast: 0.35, fp: 0.5, lit: 0.1 });
    c.fillStyle = '#1e1420'; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.32, 0, TAU); c.fill();
  }
  function carve(c, path, glow) {
    c.save();
    c.beginPath(); path(c); c.fillStyle = '#4e1606'; c.fill();
    c.clip();
    c.translate(0.15, 0.8);
    c.beginPath(); path(c); c.fillStyle = glow; c.fill();
    c.restore();
  }
  function glowGrad(c, x, y, r) {
    const g = c.createRadialGradient(x, y, r * 0.05, x, y, r);
    g.addColorStop(0, '#fff7c4'); g.addColorStop(0.45, '#ffd458'); g.addColorStop(1, '#ff8f22');
    return g;
  }
  function bump(c, x, y, rx, ry, col) {
    c.fillStyle = 'rgba(46,26,14,0.26)';
    c.beginPath(); c.ellipse(x + rx * 0.22, y + ry * 0.5, rx * 1.05, ry * 0.92, 0, 0, TAU); c.fill();
    const R = Math.max(rx, ry);
    const g = c.createRadialGradient(x - rx * 0.3, y - ry * 0.45, R * 0.05, x, y, R * 1.1);
    g.addColorStop(0, rgbS(lighten(col, 0.25))); g.addColorStop(0.5, rgbS(col)); g.addColorStop(1, rgbS(darken(col, 0.3)));
    c.fillStyle = g;
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,250,0.42)';
    c.beginPath(); c.ellipse(x - rx * 0.32, y - ry * 0.42, rx * 0.3, ry * 0.2, -0.3, 0, TAU); c.fill();
  }
  function sausage(c, path, w, col) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.save(); c.translate(0.3, 0.55);
    c.strokeStyle = 'rgba(46,26,14,0.26)'; c.lineWidth = w * 1.1; c.beginPath(); path(c); c.stroke();
    c.restore();
    c.strokeStyle = rgbS(darken(col, 0.2)); c.lineWidth = w; c.beginPath(); path(c); c.stroke();
    c.save(); c.translate(-0.08, -w * 0.12);
    c.strokeStyle = rgbS(col); c.lineWidth = w * 0.72; c.beginPath(); path(c); c.stroke();
    c.translate(-0.05, -w * 0.18);
    c.strokeStyle = rgbS(lighten(col, 0.35), 0.8); c.lineWidth = w * 0.25; c.beginPath(); path(c); c.stroke();
    c.restore();
  }
  function makeFingerprint() {
    const W = 192;
    const { c, ctx } = U.canvas(W, W);
    const r = U.rng(4711);
    const prints = [], marks = [];
    for (let i = 0; i < 7; i++) prints.push({ x: r.next() * W, y: r.next() * W, rx: 9 + r.next() * 9, rot: r.next() * PI, n: 5 + r.int(0, 3), a0: r.next() * TAU, sw: PI * (1.0 + r.next() * 0.9) });
    for (let i = 0; i < 12; i++) marks.push({ x: r.next() * W, y: r.next() * W, a: r.next() * PI, l: 5 + r.next() * 12, b: (r.next() - 0.5) * 6 });
    U.tileDraw(ctx, W, W, (k, ox, oy) => {
      k.lineCap = 'round';
      for (const p of prints) {
        for (let j = 1; j <= p.n; j++) {
          const rr = j * (p.rx / p.n), a0 = p.a0 + j * 0.35;
          k.lineWidth = 0.9;
          k.strokeStyle = 'rgba(70,28,20,0.1)';
          k.beginPath(); k.ellipse(p.x + ox, p.y + oy, rr, rr * 1.25, p.rot, a0, a0 + p.sw); k.stroke();
          k.strokeStyle = 'rgba(255,246,232,0.09)';
          k.beginPath(); k.ellipse(p.x + ox, p.y + oy + 0.9, rr, rr * 1.25, p.rot, a0, a0 + p.sw); k.stroke();
        }
      }
      for (const m of marks) {
        const dx = Math.cos(m.a) * m.l, dy = Math.sin(m.a) * m.l;
        k.lineWidth = 1.3; k.strokeStyle = 'rgba(70,28,20,0.07)';
        k.beginPath(); k.moveTo(m.x + ox, m.y + oy); k.quadraticCurveTo(m.x + ox + dx * 0.5 + m.b, m.y + oy + dy * 0.5 - m.b, m.x + ox + dx, m.y + oy + dy); k.stroke();
        k.lineWidth = 0.8; k.strokeStyle = 'rgba(255,246,232,0.08)';
        k.beginPath(); k.moveTo(m.x + ox, m.y + oy + 1.1); k.quadraticCurveTo(m.x + ox + dx * 0.5 + m.b, m.y + oy + dy * 0.5 - m.b + 1.1, m.x + ox + dx, m.y + oy + dy + 1.1); k.stroke();
      }
    });
    return c;
  }

  /* --------------------------------------------------------- sprite builder */
  function build(box, fn, seed) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((r - l) * K); cv.height = Math.ceil((b - t) * K);
    const ctx = cv.getContext('2d');
    ctx.scale(K, K); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    PK = K; PR = U.rng(seed || 1);
    fn(ctx);
    return { c: cv, ox: -l * K, oy: -t * K };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy }; }
  function set4(box, fn, seed, tint) {
    const n = build(box, fn, seed);
    const f = { c: U.tint(n.c, '#fff8ec', 1), ox: n.ox, oy: n.oy };
    const o = { n, f, nl: flipS(n), fl: flipS(f) };
    if (tint) { o.t = { c: U.tint(n.c, tint, 1), ox: n.ox, oy: n.oy }; o.tl = flipS(o.t); }
    return o;
  }
  function plain(box, fn) {
    const l = box[0], t = box[1], r = box[2], b = box[3];
    const { c, ctx } = U.canvas(Math.ceil((r - l) * K), Math.ceil((b - t) * K));
    ctx.scale(K, K); ctx.translate(-l, -t);
    fn(ctx);
    return { c, ox: -l * K, oy: -t * K };
  }
  const radial = (w, stops) => U.sprite(w, w, (c) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); for (const s of stops) g.addColorStop(s[0], s[1]); c.fillStyle = g; c.fillRect(0, 0, w, w); });

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
  function blitRise(ctx, s, x, y, sx, sy, vis) {
    const k = 1 / K;
    const sink = (1 - vis) * s.oy;
    const srcH = Math.max(1, Math.round(s.oy - sink));
    ctx.drawImage(s.c, 0, 0, s.c.width, srcH, x - s.ox * k * sx, y - srcH * k * sy, s.c.width * k * sx, srcH * k * sy);
  }
  function put(ctx, V, s, x, y, sx, sy, rot) { if (rot) blitRot(ctx, V, s, x, y, sx, sy, rot); else blit(ctx, s, x, y, sx, sy); }
  function soft(ctx, s, x, y, rx, ry) { ctx.drawImage(s, x - rx, y - ry, rx * 2, ry * 2); }
  function glowAt(ctx, s, x, y, r, a) {
    if (a <= 0.01) return;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a);
    soft(ctx, s, x, y, r, r);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  const POSE = { x: 0, y: 0, sx: 1, sy: 1, rot: 0, f: 1 };
  function lp(px, py, out) {
    const dx = POSE.f * px * POSE.sx, dy = py * POSE.sy, co = Math.cos(POSE.rot), si = Math.sin(POSE.rot);
    out[0] = POSE.x + dx * co - dy * si; out[1] = POSE.y + dx * si + dy * co;
    return out;
  }
  const PT = [0, 0];
  /** 12 fps boil jitter + the style's creeper spawn (stepped rise out of the clay) / death (squash flat) / flash. */
  function drawBody(ctx, V, e, view, set, x, y, sx, sy, rot, extra) {
    const stp = Math.floor(view.rt * 12), sd = (e.seed * 9973) | 0;
    const bj = U.hash2(stp, sd, 11) - 0.5, bj2 = U.hash2(stp, sd, 12) - 0.5;
    sx *= 1 + bj * 0.035; sy *= 1 - bj * 0.03; rot += bj2 * 0.04;
    const left = e.facing < 0;
    POSE.x = x; POSE.y = y; POSE.sx = sx; POSE.sy = sy; POSE.rot = rot; POSE.f = left ? -1 : 1;
    if (e.dying) {
      const q = e.deathT;
      const k = U.ease.outQuad(Math.min(1, q / 0.55));
      sx *= 1 + 0.7 * k; sy *= 1 - 0.8 * k;
      ctx.globalAlpha = q > 0.5 ? Math.max(0, 1 - (q - 0.5) / 0.5) : 1;
      blit(ctx, left ? set.nl : set.n, e.x, y, sx, sy);
      ctx.globalAlpha = 0.5 * (1 - q);
      blit(ctx, left ? set.fl : set.f, e.x, y, sx, sy);
      ctx.globalAlpha = 1;
      return false;
    }
    if (e.spawnT < 1) {
      const q = U.clamp(e.spawnT / 0.9, 0, 1);
      const vis = Math.floor(U.ease.outQuad(q) * 8) / 8;
      if (vis <= 0) return false;
      const wob = 1 + 0.12 * (1 - q);
      blitRise(ctx, left ? set.nl : set.n, e.x, e.y, sx * wob, sy / wob, vis);
      return false;
    }
    const fl = e.flash || 0;
    if (fl > 0) { sx *= 1 + 0.16 * fl; sy *= 1 - 0.15 * fl; POSE.sx = sx; POSE.sy = sy; }
    put(ctx, V, left ? set.nl : set.n, x, y, sx, sy, rot);
    if (extra) extra(sx, sy);
    if (fl > 0.02) {
      ctx.globalAlpha = Math.min(0.55, fl * 0.8);
      put(ctx, V, left ? set.fl : set.f, x, y, sx, sy, rot);
    }
    ctx.globalAlpha = 1;
    return true;
  }

  /* ============================================================ enemies */
  const ROOT = [228, 202, 160], LEAF = [96, 162, 70], BROW = [74, 40, 82];
  const SPC = { top: [114, 72, 160], bot: [218, 234, 184], spot: [150, 206, 70], snout: [146, 100, 196], lime: [176, 226, 60], leaf: [126, 182, 60] };
  const BOC = { body: [204, 42, 74], tail: [176, 34, 64], leg: [96, 34, 58], fuse: [226, 200, 150] };
  const CHC = { body: [236, 212, 160], leg: [214, 182, 130], horn: [150, 112, 92], hoof: [110, 74, 58] };
  const MOC = { top: [170, 128, 200], bot: [244, 230, 204], shawl: [210, 70, 96], gold: [236, 182, 62], wood: [158, 110, 66] };
  const BAC = { top: [226, 98, 160], bot: [246, 230, 210] };

  const leafC = (c, bx, by, a, len, wid, col, cast) => {
    const mx = bx + Math.sin(a) * len * 0.5, my = by - Math.cos(a) * len * 0.5;
    clay(c, (k) => leafPath(k, bx, by, a, len, wid), col || LEAF, {
      b: [mx, my, len * 0.5, len * 0.5], spec: 0.25, cast: cast === undefined ? 0.3 : cast,
      detail(k) { groove(k, (q) => { q.moveTo(bx, by); q.lineTo(bx + Math.sin(a) * len * 0.8, by - Math.cos(a) * len * 0.8); }, 0.4, 0.3); },
    });
  };
  const topLayer = (k, waveY, amp, freq, col, b) => clay(k, (q) => {
    q.moveTo(-30, -60); q.lineTo(30, -60); q.lineTo(30, waveY);
    for (let x = 30; x >= -30; x -= 1) q.lineTo(x, waveY + Math.sin(x * freq + 0.6) * amp + (x < 0 ? 0.4 : 0));
    q.closePath();
  }, col, { b, cast: 0.35, spec: 0.38, ao: 0.4 });

  // ---- Rüben-Spucker
  function spitterDraw(c, fr, aim) {
    const st = [0, 1, 0, -1][fr], sw = [0, 0.08, 0, -0.08][fr];
    const lift = (s) => Math.max(0, s) * 1.5;
    const w = aim ? 10.4 : 9.4;
    leafC(c, -0.4, -18.8, -0.75 + sw, 7.0, 2.2, SPC.leaf, 0);
    leafC(c, -0.4, -18.8, 0.55 + sw, 6.4, 2.0, SPC.leaf);
    leafC(c, -0.4, -18.8, -0.08 + sw, 8.8, 2.5, SPC.leaf);
    cCap(c, -2.8, -4.6, -3.1 + st * 0.9, -1.2 - lift(st), 1.45, ROOT, { spec: 0.2 });
    cCap(c, 2.6, -4.6, 2.9 - st * 0.9, -1.2 - lift(-st), 1.45, ROOT, { spec: 0.2 });
    clay(c, (k) => turnipPath(k, -0.4, -19.6, -2.5, w), SPC.bot, {
      b: [-0.4, -11, w, 9], spec: 0.35, lit: 0.12,
      detail(k) {
        topLayer(k, -10.2, 0.85, 0.85, SPC.top, [-0.4, -15.5, w, 5.5]);
        // mottled toxic-green spots pressed into the skin
        for (const p of [[-5.6, -14.2, 1.6, 1.15], [-2.8, -17.4, 1.1, 0.75], [-7.0, -11.0, 0.95, 0.75], [1.8, -18.4, 0.85, 0.6], [-4.0, -7.0, 0.9, 0.65], [-6.4, -5.4, 0.6, 0.45]]) bump(k, p[0], p[1], p[2], p[3], SPC.spot);
        groove(k, (q) => { q.moveTo(-5.2, -5.0); q.quadraticCurveTo(-3.4, -3.6, -1.6, -4.2); }, 0.35, 0.22);
      },
    });
    if (aim) cLump(c, 5.6, -9.4, 4.6, 3.9, [134, 88, 184], 0.08, { spec: 0.45, gloss: 0.25 });
    cCap(c, 5.0, -9.6, 12.2, -10.2, aim ? 2.9 : 2.6, SPC.snout, {
      spec: 0.4,
      detail(k) { for (const x of [7.4, 9.6]) groove(k, (q) => { q.moveTo(x, -12.2); q.quadraticCurveTo(x + 0.6, -10, x, -7.8); }, 0.35, 0.25); },
    });
    cE(c, 13.0, -10.3, 1.9, aim ? 3.6 : 3.3, SPC.lime, {
      spec: 0.5, gloss: 0.35, cast: 0.45,
      detail(k) {
        k.fillStyle = '#2a1420'; k.beginPath(); k.ellipse(13.5, -10.3, 1.05, aim ? 2.5 : 2.2, 0, 0, TAU); k.fill();
        k.fillStyle = aim ? '#f0ffb0' : '#6aa830'; k.beginPath(); k.ellipse(13.75, -10.0, 0.55, aim ? 1.7 : 1.3, 0, 0, TAU); k.fill();
      },
    });
    if (!aim) {
      cCap(c, 13.0, -7.6, 13.2, -5.2, 0.75, SPC.lime, { spec: 0.5, gloss: 0.4, cast: 0.3, fp: 0 });
      cE(c, 13.25, -4.4, 1.1, 1.25, SPC.lime, { spec: 0.6, gloss: 0.6, cast: 0, fp: 0 });
    }
    const j = [0, 0.15, 0, -0.1][fr], pr = aim ? 0.9 : 1.1;
    eye(c, 0.4, -14.6, 2.2, 2.5, 1.2 + j, -14.2, pr);
    eye(c, 5.4, -14.4, 2.0, 2.3, 6.1 + j, -14.0, pr * 0.95);
    if (aim) { cCap(c, -2.0, -17.2, 2.4, -16.6, 0.7, BROW, { spec: 0.3, cast: 0.5 }); cCap(c, 4.0, -16.5, 7.9, -17.6, 0.68, BROW, { spec: 0.3, cast: 0.5 }); }
    else { cCap(c, -1.9, -18.1, 2.6, -16.2, 0.7, BROW, { spec: 0.3, cast: 0.5 }); cCap(c, 4.0, -16.2, 7.9, -17.7, 0.68, BROW, { spec: 0.3, cast: 0.5 }); }
  }

  // ---- Zündrübe
  const FUSE_TIP = [-4.6, -24.0];
  function bomberDraw(c, fr) {
    const a = [0, 1, 0, -1][fr];
    const legs = [[-3.6, 1], [-1.2, -1], [1.4, 1], [3.8, -1]];
    const leg = (L, s, near) => cCap(c, L[0], -4.0, L[0] * 1.35 + s * 1.3 + (near ? 0.3 : -0.3), -0.9 - Math.max(0, s) * 1.2, near ? 1.05 : 0.95, near ? BOC.leg : darken(BOC.leg, 0.25), { spec: 0.25 });
    for (let i = 0; i < 4; i += 2) leg(legs[i], a * legs[i][1], false);
    clay(c, (k) => ribbonPath(k, [[-4.5, -7.0], [-7.4, -6.0], [-9.6, -4.0]], 2.2, 0.7), BOC.tail, { b: [-7, -5.5, 3, 2], spec: 0.3, cast: 0 });
    sausage(c, (q) => { q.moveTo(0.0, -15.5); q.bezierCurveTo(-0.8, -19.0, -2.6, -21.2, FUSE_TIP[0], FUSE_TIP[1]); }, 1.5, BOC.fuse);
    groove(c, (q) => { for (const p of [[-0.4, -17.4], [-1.4, -19.8], [-3.0, -21.6]]) { q.moveTo(p[0] - 0.6, p[1] - 0.2); q.lineTo(p[0] + 0.6, p[1] + 0.4); } }, 0.3, 0.35);
    leafC(c, 0.4, -15.2, -0.15 + a * 0.05, 5.4, 2.1, LEAF, 0);
    leafC(c, 0.6, -15.2, 0.75 + a * 0.05, 4.8, 1.9, LEAF);
    const pts = [[0.4, -16.2], [5.6, -14.6], [7.6, -9.6], [6.0, -4.4], [0.4, -2.6], [-5.4, -4.4], [-7.3, -9.6], [-5.0, -14.6]];
    clay(c, (k) => blobPath(k, pts), BOC.body, {
      b: [0.2, -9.4, 7.5, 7.0], spec: 0.5, gloss: 0.3,
      detail(k) {
        groove(k, (q) => { q.moveTo(-6.0, -12.0); q.quadraticCurveTo(-7.4, -7.5, -4.6, -4.2); }, 0.45, 0.3);
        groove(k, (q) => { q.moveTo(-3.8, -13.8); q.quadraticCurveTo(-5.6, -9.0, -3.2, -4.4); }, 0.4, 0.25);
        // jagged grin
        k.fillStyle = '#3a1218';
        k.beginPath(); k.moveTo(0.6, -6.6); k.quadraticCurveTo(3.6, -4.0, 6.6, -6.8); k.quadraticCurveTo(3.6, -5.6, 0.6, -6.6); k.closePath(); k.fill();
        k.fillStyle = '#f6eedc'; k.beginPath(); k.moveTo(2.0, -6.4); k.lineTo(3.0, -6.0); k.lineTo(2.5, -5.0); k.closePath(); k.moveTo(4.2, -6.0); k.lineTo(5.2, -6.4); k.lineTo(4.8, -5.1); k.closePath(); k.fill();
      },
    });
    for (let i = 1; i < 4; i += 2) leg(legs[i], -a * legs[i][1], true);
    eye(c, 1.8, -9.6, 1.6, 1.5, 2.3, -9.3, 0.8);
    eye(c, 5.5, -9.5, 1.45, 1.4, 5.9, -9.2, 0.75);
    cCap(c, -0.6, -12.2, 3.4, -10.6, 0.62, BROW, { spec: 0.3, cast: 0.5 });
    cCap(c, 4.2, -10.5, 7.4, -11.9, 0.6, BROW, { spec: 0.3, cast: 0.5 });
  }

  // ---- Wurzel-Bock
  const CH_EYE = [15.6, -10.4], CH_HEAD = [11.0, -21.0];
  function chargerDraw(c, pose, fr) {
    const a = pose === 'walk' || pose === 'dizzy' ? [0, 1, 0, -1][fr] : 0;
    const lift = (s) => Math.max(0, s) * 1.3;
    let legs;
    if (pose === 'dash') legs = [[-7.5, -4.5, 1.6, 0], [3.5, 5.0, 2.2, 0], [-5.0, -5.0, 0.6, 1], [6.0, 5.5, 1.2, 1]];
    else if (pose === 'tele') { const sc = fr ? 1 : 0; legs = [[-7.5, -1.6, 0, 0], [3.5, 1.8, 0, 0], [-5.0, -1.4, 0, 1], [6.5, 2.4 - sc * 3.2, sc * 1.6, 1]]; }
    else legs = [[-7.5, a * 1.6, lift(a), 0], [3.5, -a * 1.6, lift(-a), 0], [-5.0, -a * 1.6, lift(-a), 1], [6.5, a * 1.6, lift(a), 1]];
    const leg = (L) => {
      const fx = L[0] + L[1], fy = -0.9 - L[2];
      cCap(c, L[0], -6.5, fx, fy, 1.8, L[3] ? CHC.leg : darken(CHC.leg, 0.2), { spec: 0.2 });
      cE(c, fx + 0.4, fy + 0.1, 2.0, 1.15, CHC.hoof, { spec: 0.35 });
    };
    leg(legs[0]); leg(legs[1]);
    const lb = pose === 'dash' ? -0.55 : pose === 'tele' ? -0.15 : 0, ls = a * 0.06;
    leafC(c, 3.6, -20.4, -1.0 + lb + ls, 9.4, 2.6, LEAF, 0);
    leafC(c, 3.6, -20.4, -0.4 + lb + ls, 11.2, 3.0);
    leafC(c, 3.6, -20.4, 0.22 + lb * 0.6 + ls, 8.4, 2.5);
    const tu = pose === 'dash' ? -2.0 : 0;
    clay(c, (k) => blobPath(k, [[-16.5, -16.0 + tu], [-10.0, -19.8], [-1.0, -21.8], [6.5, -20.8], [11.0, -15.6], [10.0, -7.8], [4.0, -5.0], [-4.0, -5.6], [-10.0, -9.4]]), CHC.body, {
      b: [-2, -13.5, 13.5, 8.5], spec: 0.35,
      detail(k) {
        for (const x of [-11, -6, -1]) groove(k, (q) => { q.moveTo(x + 0.6, -19.4 + Math.abs(x) * 0.12); q.quadraticCurveTo(x + 1.6, -13, x + 0.2, -6.6 - Math.abs(x) * 0.15); }, 0.45, 0.25);
        groove(k, (q) => { q.moveTo(-14.6, -15.6 + tu); q.lineTo(-13.2, -13.4 + tu); }, 0.35, 0.3);
      },
    });
    c.strokeStyle = rgbS(darken(CHC.body, 0.3)); c.lineWidth = 0.55; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-16.0, -15.6 + tu); c.quadraticCurveTo(-18.2, -15.4 + tu, -19.0, -13.2 + tu); c.stroke();
    leg(legs[2]); leg(legs[3]);
    cE(c, 14.2, -10.2, 5.4, 4.7, CHC.body, {
      spec: 0.4, cast: 0.45,
      detail(k) {
        k.fillStyle = '#3a1a14'; k.beginPath(); k.ellipse(18.8, -8.4, 0.5, 0.65, 0.3, 0, TAU); k.fill();
        groove(k, (q) => { q.moveTo(15.4, -6.0); q.quadraticCurveTo(16.6, -5.2, 18.0, -6.0); }, 0.4, 0.3);
      },
    });
    // root goatee (little clay strings)
    sausage(c, (q) => { q.moveTo(15.6, -5.6); q.quadraticCurveTo(15.8, -4.2, 14.8, -3.2); }, 0.7, darken(CHC.body, 0.15));
    sausage(c, (q) => { q.moveTo(16.8, -5.8); q.quadraticCurveTo(17.4, -4.6, 16.8, -3.6); }, 0.7, darken(CHC.body, 0.15));
    const ex = CH_EYE[0], ey = CH_EYE[1];
    if (pose === 'tele') {
      cE(c, ex, ey, 1.9, 1.8, [230, 50, 40], { spec: 0.6, gloss: 0.5, cast: 0.4, fp: 0, detail(k) { k.fillStyle = 'rgba(255,230,160,0.9)'; k.beginPath(); k.ellipse(ex + 0.3, ey + 0.1, 0.8, 0.7, 0, 0, TAU); k.fill(); } });
    } else if (pose === 'dizzy') {
      cE(c, ex, ey, 1.9, 1.9, [250, 248, 240], { spec: 0.5, ao: 0.4, cast: 0.35, fp: 0.5, lit: 0.1 });
      c.strokeStyle = '#1e1420'; c.lineWidth = 0.45; c.beginPath();
      for (let i = 0; i <= 20; i++) { const t = i / 20, ang = t * TAU * 1.6, r = 0.15 + t * 1.45; const px = ex + Math.cos(ang) * r, py = ey + Math.sin(ang) * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
      c.stroke();
    } else eye(c, ex, ey, 1.8, 1.9, ex + 0.6, ey + 0.2, 0.95);
    if (pose !== 'dizzy') cCap(c, ex - 2.4, ey - 3.2, ex + 2.4, ey - 1.6, 0.7, BROW, { spec: 0.3, cast: 0.5 });
    // rolled clay horn coil
    const hp = spiralPts(9.6, -14.0, -PI / 2 - 0.5, PI * 1.85, 6.8, 1.7, 26);
    clay(c, (k) => ribbonPath(k, hp, 5.0, 1.5), CHC.horn, {
      b: [9.6, -14.0, 7.5, 7.5], spec: 0.4, cast: 0.5, ao: 0.4,
      detail(k) {
        for (let i = 2; i < hp.length - 3; i += 3) {
          const p = hp[i], q2 = hp[i + 1], ang = Math.atan2(q2[1] - p[1], q2[0] - p[0]) + PI / 2, w = 2.2 - i * 0.05;
          groove(k, (q) => { q.moveTo(p[0] + Math.cos(ang) * w, p[1] + Math.sin(ang) * w); q.lineTo(p[0] - Math.cos(ang) * w, p[1] - Math.sin(ang) * w); }, 0.4, 0.35);
        }
      },
    });
  }

  // ---- baby sprout
  function babyDraw(c, cx, by, s, small, leafA) {
    leafC(c, cx + 0.2 * s, by - 10.6 * s, leafA, 6.2 * s, 2.3 * s, LEAF, small ? 0.2 : 0);
    clay(c, (k) => turnipPath(k, cx, by - 11.4 * s, by - 1.6 * s, 5.8 * s), BAC.bot, {
      b: [cx, by - 6.5 * s, 5.8 * s, 5 * s], spec: 0.38, lit: 0.12, cast: small ? 0.35 : 0.42,
      detail(k) {
        clay(k, (q) => { q.moveTo(cx - 20, by - 30); q.lineTo(cx + 20, by - 30); q.lineTo(cx + 20, by - 6.4 * s); for (let x = 20; x >= -20; x -= 1) q.lineTo(cx + x, by - 6.4 * s + Math.sin(x / s * 1.2) * 0.5 * s); q.closePath(); }, BAC.top, { b: [cx, by - 9 * s, 5.8 * s, 3 * s], cast: 0.3, spec: 0.38, ao: 0.4 });
        if (small) {
          k.fillStyle = '#1e1420'; k.beginPath(); k.arc(cx + 0.6 * s, by - 7.0 * s, 0.8 * s, 0, TAU); k.arc(cx + 3.4 * s, by - 7.0 * s, 0.75 * s, 0, TAU); k.fill();
          groove(k, (q) => { q.arc(cx + 2.0 * s, by - 3.6 * s, 0.9 * s, PI * 1.15, PI * 1.85); }, 0.4 * s, 0.5);
        }
      },
    });
  }
  function sproutDraw(c, fr) {
    const st = [0, 1, 0, -1][fr];
    const lift = (s) => Math.max(0, s) * 1.2;
    cCap(c, -1.8, -3.0, -2.1 + st * 1.0, -0.8 - lift(st), 1.0, ROOT, { spec: 0.2 });
    cCap(c, 1.8, -3.0, 2.1 - st * 1.0, -0.8 - lift(-st), 1.0, ROOT, { spec: 0.2 });
    babyDraw(c, 0, 0, 1, false, 0.45 + [0, 0.12, 0, -0.12][fr]);
    const j = [0, 0.12, 0, -0.08][fr];
    eye(c, 0.9, -6.6, 1.55, 1.8, 1.5 + j, -6.3, 0.85);
    eye(c, 4.2, -6.5, 1.4, 1.7, 4.7 + j, -6.2, 0.8);
    cCap(c, -0.9, -9.0, 2.2, -8.0, 0.5, BROW, { spec: 0.3, cast: 0.5 });
    cCap(c, 3.3, -8.0, 5.9, -8.9, 0.5, BROW, { spec: 0.3, cast: 0.5 });
    groove(c, (q) => { q.arc(2.8, -2.9, 1.2, PI * 1.2, PI * 1.8); }, 0.5, 0.55);
  }

  // ---- Rüben-Ahnin
  function motherDraw(c, fr) {
    const st = [0, 1, 0, -1][fr];
    const lift = (s) => Math.max(0, s) * 1.6;
    leafC(c, 0.5, -33.0, -1.25, 8.5, 2.6, [138, 160, 90], 0);
    leafC(c, 0.5, -33.0, 1.2, 8.0, 2.5, [138, 160, 90]);
    babyDraw(c, -4.6, -30.6, 0.62, true, -0.35 + st * 0.05);
    babyDraw(c, 5.4, -30.8, 0.6, true, 0.4 - st * 0.05);
    babyDraw(c, 0.5, -32.2, 0.7, true, 0.1 + st * 0.04);
    cCap(c, -12.4, -17.0, -15.6, -11.6 + st * 0.6, 2.0, MOC.bot, { spec: 0.2, cast: 0 });
    cLump(c, -4.6 + st * 1.4, -1.6 - lift(st), 3.6, 1.9, ROOT, 0.12, { spec: 0.25 });
    cLump(c, 5.0 - st * 1.4, -1.6 - lift(-st), 3.6, 1.9, ROOT, 0.12, { spec: 0.25 });
    clay(c, (k) => turnipPath(k, 0.4, -33.6, -3.0, 14.6), MOC.bot, {
      b: [0.4, -18, 14.6, 15.5], spec: 0.35, lit: 0.12,
      detail(k) {
        topLayer(k, -23.6, 1.0, 0.55, MOC.top, [0.4, -29, 14.6, 6]);
        groove(k, (q) => { q.moveTo(-9.0, -8.0); q.quadraticCurveTo(-6.4, -6.6, -4.0, -7.6); }, 0.45, 0.3);
        groove(k, (q) => { q.moveTo(2.0, -6.0); q.quadraticCurveTo(5.0, -5.0, 7.4, -6.4); }, 0.45, 0.3);
        groove(k, (q) => { q.moveTo(-4.0, -31.0); q.quadraticCurveTo(-1.0, -30.0, 2.0, -31.2); }, 0.45, 0.3);
        groove(k, (q) => { q.moveTo(-3.0, -29.0); q.quadraticCurveTo(0, -28.2, 2.6, -29.2); }, 0.45, 0.3);
        // crow's feet + pursed mouth
        groove(k, (q) => { q.moveTo(-0.4, -26.2); q.lineTo(-1.4, -26.9); q.moveTo(-0.4, -25.0); q.lineTo(-1.5, -25.0); q.moveTo(13.4, -24.0); q.lineTo(12.4, -23.0); }, 0.35, 0.35);
        groove(k, (q) => { q.moveTo(6.0, -21.6); q.quadraticCurveTo(7.4, -22.6, 8.8, -21.4); }, 0.6, 0.55);
      },
    });
    eye(c, 4.2, -25.4, 1.9, 2.0, 4.8, -25.0, 0.95);
    eye(c, 10.0, -25.2, 1.75, 1.9, 10.6, -24.9, 0.9);
    sausage(c, (q) => { q.arc(4.2, -25.4, 2.4, 0, TAU); }, 0.8, MOC.gold);
    sausage(c, (q) => { q.arc(10.0, -25.2, 2.2, 0, TAU); }, 0.8, MOC.gold);
    sausage(c, (q) => { q.moveTo(6.6, -25.6); q.quadraticCurveTo(7.1, -26.3, 7.8, -25.6); }, 0.6, MOC.gold);
    cCap(c, 1.6, -29.0, 5.6, -28.2, 0.6, [210, 200, 196], { spec: 0.3, cast: 0.5 });
    cCap(c, 8.8, -28.1, 12.4, -28.8, 0.6, [210, 200, 196], { spec: 0.3, cast: 0.5 });
    const shawl = (k) => {
      k.moveTo(-15.4, -19.6); k.quadraticCurveTo(0, -15.0, 15.2, -20.2);
      k.lineTo(15.6, -14.6); k.quadraticCurveTo(10.0, -10.6, 3.0, -10.2);
      k.lineTo(-9.6, -5.6); k.quadraticCurveTo(-13.4, -9.4, -15.6, -13.6); k.closePath();
    };
    clay(c, shawl, MOC.shawl, {
      b: [0, -14, 15.5, 6.5], spec: 0.3, ao: 0.45,
      detail(k) {
        for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
          const x = -12 + i * 3.2 + (r & 1) * 1.6, y = -16.6 + r * 2.6 + Math.abs(x) * 0.08 * (2 - r) - (x > 0 ? x * 0.05 : 0);
          groove(k, (q) => { q.moveTo(x - 0.8, y - 0.6); q.lineTo(x, y + 0.4); q.lineTo(x + 0.8, y - 0.6); }, 0.35, 0.35);
        }
      },
    });
    for (let i = 0; i < 6; i++) { const t = i / 5, x = -9.4 + t * 12.0, y = -5.8 - t * 4.2; sausage(c, (q) => { q.moveTo(x, y); q.lineTo(x - 0.4, y + 1.6); }, 0.75, darken(MOC.shawl, 0.1)); }
    cE(c, 11.2, -17.4, 1.9, 1.7, MOC.gold, { spec: 0.6, gloss: 0.5, fp: 0, cast: 0.45 });
    sausage(c, (q) => { q.moveTo(18.6, -0.4); q.lineTo(17.6, -17.0); q.arc(15.6, -17.4, 2.0, 0.1, PI, true); q.lineTo(13.6, -15.8); }, 1.7, MOC.wood);
    cCap(c, 12.0, -16.2, 15.6, -14.2 - st * 0.4, 2.0, MOC.bot, { spec: 0.25 });
    cE(c, 16.6, -14.4 - st * 0.4, 1.9, 1.8, MOC.bot, { spec: 0.3 });
  }

  /* ---------------------------------------------------------- small sprites */
    function globDraw(c, a) {
    // pre-rotated so the clay key light stays on top
    const P2 = new Path2D();
    const co = Math.cos(a), si = Math.sin(a), T = (x, y) => [x * co - y * si, x * si + y * co];
    const m = (x, y) => { const p = T(x, y); P2.moveTo(p[0], p[1]); };
    const bz = (x1, y1, x2, y2, x3, y3) => { const p = T(x1, y1), q = T(x2, y2), r = T(x3, y3); P2.bezierCurveTo(p[0], p[1], q[0], q[1], r[0], r[1]); };
    m(-6.4, 0); bz(-4.0, -1.4, -1.6, -3.4, 1.0, -3.4); bz(3.4, -3.4, 4.6, -1.8, 4.6, 0); bz(4.6, 1.8, 3.4, 3.4, 1.0, 3.4); bz(-1.6, 3.4, -4.0, 1.4, -6.4, 0); P2.closePath();
    // dark juicy rim so it reads on every clay sheet
    c.save(); c.fillStyle = 'rgba(28,58,8,0.95)'; c.lineWidth = 1.1; c.strokeStyle = 'rgba(28,58,8,0.95)'; c.lineJoin = 'round'; c.stroke(P2); c.fill(P2); c.restore();
    const h = T(1.2, 0);
    c.save(); c.clip(P2);
    const g = c.createRadialGradient(h[0] - 1.0, h[1] - 1.8, 0.2, h[0], h[1] + 0.4, 5.6);
    g.addColorStop(0, '#f8ffc8'); g.addColorStop(0.35, '#c8f040'); g.addColorStop(0.8, '#7cc420'); g.addColorStop(1, '#3e7a10');
    c.fillStyle = g; c.fillRect(-8, -8, 16, 16);
    if (FPC) { const pat = c.createPattern(FPC, 'repeat'); pat.setTransform(new DOMMatrix([1 / PK, 0, 0, 1 / PK, 0, 0])); c.fillStyle = pat; c.fillRect(-8, -8, 16, 16); }
    c.restore();
    c.fillStyle = 'rgba(255,255,250,0.85)'; c.beginPath(); c.ellipse(h[0] - 0.8, h[1] - 1.7, 1.5, 0.6, -0.3, 0, TAU); c.fill();
  }
  function dropDraw(c) { cE(c, 0, 0, 1.3, 1.3, [184, 232, 64], { spec: 0.7, gloss: 0.6, cast: 0, fp: 0, dark: [70, 130, 20] }); }
  function sprayDraw(c) {
    for (const d of [[2.5, 0, 1.5], [5.6, -2.2, 1.1], [5.2, 2.4, 1.0], [8.4, -0.4, 0.9], [8.0, -3.8, 0.6], [7.6, 3.6, 0.65]]) cE(c, d[0], d[1], d[2], d[2] * 0.9, [184, 232, 64], { spec: 0.6, gloss: 0.5, cast: 0, fp: 0, dark: [70, 130, 20] });
  }
  function clayStar(x, y, ro, ri) {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - PI / 2, r = i & 1 ? ri : ro; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    return p;
  }
  function starDraw(c) { clay(c, (k) => blobPath(k, clayStar(0, 0, 2.8, 1.4)), [255, 214, 80], { b: [0, 0, 2.2, 2.2], spec: 0.6, gloss: 0.5, cast: 0, fp: 0.5 }); }


  /* ================================================================ icons */
  function heartPath(c, x, y, s) {
    c.moveTo(x, y + 7 * s);
    c.bezierCurveTo(x - 4 * s, y + 3.6 * s, x - 9.5 * s, y + 0.4 * s, x - 9.5 * s, y - 4.6 * s);
    c.bezierCurveTo(x - 9.5 * s, y - 9.6 * s, x - 2.6 * s, y - 10.6 * s, x, y - 5.6 * s);
    c.bezierCurveTo(x + 2.6 * s, y - 10.6 * s, x + 9.5 * s, y - 9.6 * s, x + 9.5 * s, y - 4.6 * s);
    c.bezierCurveTo(x + 9.5 * s, y + 0.4 * s, x + 4 * s, y + 3.6 * s, x, y + 7 * s);
    c.closePath();
  }
  const seedIcon = (c, x, y, a, s, col) => {
    c.save(); c.translate(x, y); c.rotate(a);
    clay(c, (k) => { k.save(); k.scale(s, s); seedPathH(k); k.restore(); }, col || [248, 232, 190], { b: [0.4 * s, 0, 3.8 * s, 2.8 * s], spec: 0.55, gloss: 0.5, dark: [178, 146, 96] });
    c.restore();
  };
  function clayPumpkin(c, cx, cy, rx, ry, face, rot) {
    cCap(c, cx + Math.sin(rot || 0) * ry, cy - ry + 1.5, cx + 1.2 + Math.sin(rot || 0) * ry, cy - ry - 3.5, 1.8, [120, 116, 52], { spec: 0.3, cast: 0 });
    clay(c, (k) => pumpkinPath(k, cx, cy, rx, ry), [238, 122, 34], {
      b: [cx, cy, rx, ry], spec: 0.55, gloss: 0.6, lit: 0.24, ao: 0.55, hi: [cx - rx * 0.5, cy - ry * 0.55, rx * 0.42],
      detail(k) {
        k.translate(cx, cy); k.rotate(rot || 0);
        for (const kk of [-0.66, -0.28, 0.28, 0.66]) groove(k, (q) => { q.moveTo(kk * rx * 0.25, -ry * 0.88); q.quadraticCurveTo(kk * rx * 1.15, 0, kk * rx * 0.25, ry * 0.92); }, rx * 0.07, 0.3);
        if (face) {
          const f = rx / 16, gg = glowGrad(k, 0, 2 * f, 14 * f);
          carve(k, (q) => { q.moveTo(-6.5 * f, -8 * f); q.lineTo(-10.5 * f, -1 * f); q.lineTo(-3 * f, -1 * f); q.closePath(); }, gg);
          carve(k, (q) => { q.moveTo(6.5 * f, -8 * f); q.lineTo(3 * f, -1 * f); q.lineTo(10.5 * f, -1 * f); q.closePath(); }, gg);
          carve(k, (q) => { q.moveTo(-11 * f, 2.5 * f); q.lineTo(-8 * f, 4.5 * f); q.lineTo(-5 * f, 3 * f); q.lineTo(-2 * f, 5 * f); q.lineTo(1 * f, 3 * f); q.lineTo(4 * f, 5 * f); q.lineTo(7 * f, 3 * f); q.lineTo(11 * f, 2.5 * f); q.quadraticCurveTo(0, 14 * f, -11 * f, 2.5 * f); q.closePath(); }, gg);
        }
      },
    });
  }
  const ICONS = {
    leech(c) {
      for (const p of [[14, 12], [24, 9]]) { c.strokeStyle = 'rgba(255,250,240,0.7)'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(p[0], p[1] + 8); c.bezierCurveTo(p[0] - 3, p[1] + 5, p[0] + 3, p[1] + 2, p[0], p[1] - 2); c.stroke(); }
      cE(c, 24, 26, 18, 5, [236, 132, 44], { spec: 0.45, cast: 0 });
      cE(c, 16, 25, 2.6, 1.8, [250, 232, 200], { spec: 0.4 });
      cE(c, 29, 26, 2.2, 1.6, [110, 170, 76], { spec: 0.4 });
      clay(c, (k) => { k.moveTo(5, 27); k.quadraticCurveTo(7, 43, 24, 43); k.quadraticCurveTo(41, 43, 43, 27); k.quadraticCurveTo(24, 33, 5, 27); k.closePath(); }, [240, 226, 196], {
        b: [24, 35, 19, 9], spec: 0.35,
        detail(k) { groove(k, (q) => { q.moveTo(9, 34); q.quadraticCurveTo(24, 39, 39, 34); }, 1.2, 0.35); for (const x of [14, 24, 34]) bump(k, x, 37.5 - (x === 24 ? 0.8 : 0), 1.6, 1.3, [134, 80, 172]); },
      });
      clay(c, (k) => heartPath(k, 36, 14, 0.95), [226, 64, 62], { b: [36, 11, 9, 8], spec: 0.55, gloss: 0.6, cast: 0.3 });
    },
    thorns(c) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU - PI / 2, ca = Math.cos(a), sa = Math.sin(a), px = -sa * 3.4, py = ca * 3.4;
        const x0 = 24 + ca * 12, y0 = 25 + sa * 12, x1 = 24 + ca * 22.5, y1 = 25 + sa * 22.5;
        clay(c, (k) => { k.moveTo(x0 + px, y0 + py); k.quadraticCurveTo(x0 + ca * 5, y0 + sa * 5, x1, y1); k.quadraticCurveTo(x0 + ca * 5, y0 + sa * 5, x0 - px, y0 - py); k.closePath(); }, [126, 150, 64], { b: [(x0 + x1) / 2, (y0 + y1) / 2, 5, 5], spec: 0.35, cast: 0.2, fp: 0.5 });
      }
      clay(c, E(24, 25, 14, 14), [244, 232, 204], {
        b: [24, 25, 14, 14], spec: 0.4,
        detail(k) {
          clay(k, (q) => { q.moveTo(0, 0); q.lineTo(48, 0); q.lineTo(48, 26); for (let x = 48; x >= 0; x -= 2) q.lineTo(x, 26 + Math.sin(x * 0.4) * 1.4); q.closePath(); }, [134, 80, 172], { b: [24, 18, 14, 8], spec: 0.38, ao: 0.4 });
          groove(k, (q) => { q.moveTo(13, 21); q.quadraticCurveTo(24, 15, 35, 21); q.moveTo(12, 31); q.quadraticCurveTo(24, 36.5, 36, 31); }, 1.0, 0.35);
        },
      });
    },
    dashup(c) {
      for (const [x0, y, x1] of [[2, 18, 10], [1, 26, 8], [3, 34, 10]]) cCap(c, x0, y, x1, y, 1.2, [236, 214, 170], { spec: 0.3, fp: 0, cast: 0 });
      for (const p of [[10.5, 41, 4.2, 3.3], [15.5, 42, 3.2, 2.6], [6.5, 42.5, 2.6, 2.1]]) cE(c, p[0], p[1], p[2], p[3], [236, 214, 182], { spec: 0.3, cast: 0.25 });
      sausage(c, (q) => { q.moveTo(39.5, 9.5); q.quadraticCurveTo(48, 25, 39.5, 41); }, 3.2, [120, 196, 176]);
      clayPumpkin(c, 24, 27, 13.5, 12, true, 0.55);
    },
    range(c) {
      for (let i = 0; i <= 9; i++) { const t = i / 9, x = (1 - t) * (1 - t) * 4 + 2 * (1 - t) * t * 12 + t * t * 27, y = (1 - t) * (1 - t) * 42 + 2 * (1 - t) * t * 4 + t * t * 13; cE(c, x, y, 1.2, 1.2, [250, 244, 230], { spec: 0.4, fp: 0, cast: 0, ao: 0.3 }); }
      for (const [x, y] of [[35, 24], [36.2, 29]]) cE(c, x, y, 1.1, 1.1, [250, 244, 230], { spec: 0.4, fp: 0, cast: 0, ao: 0.3 });
      clay(c, E(35.5, 39.5, 9.4, 5.2), [222, 58, 52], {
        b: [35.5, 39.5, 9.4, 5.2], spec: 0.4, cast: 0,
        detail(k) { bump(k, 35.5, 39.3, 6.0, 3.2, [246, 236, 214]); bump(k, 35.5, 39.2, 2.9, 1.6, [222, 58, 52]); },
      });
      seedIcon(c, 30.5, 16.5, 0.75, 2.9);
      clay(c, (k) => blobPath(k, clayStar(41, 9, 4.8, 2.0)), [255, 214, 80], { b: [41, 9, 4, 4], spec: 0.6, gloss: 0.6, fp: 0.5, cast: 0 });
    },
  };

  /* ================================================================== init */
  const BOX = { sp: [-12, -30, 17, 2.5], bo: [-12, -28, 10, 2.5], ch: [-21, -31, 21, 2.5], mo: [-19, -45, 22, 3], sprout: [-8, -19, 9, 2] };
  const LAZY = {
    spitter() { SPR.sp = [0, 1, 2, 3].map((f) => set4(BOX.sp, (c) => spitterDraw(c, f, false), 900 + f)); SPR.spAim = set4(BOX.sp, (c) => spitterDraw(c, 0, true), 905); },
    bomber() { SPR.bo = [0, 1, 2, 3].map((f) => set4(BOX.bo, (c) => bomberDraw(c, f), 910 + f, '#ff3040')); },
    charger() {
      SPR.ch = [0, 1, 2, 3].map((f) => set4(BOX.ch, (c) => chargerDraw(c, 'walk', f), 920 + f));
      SPR.chTele = [0, 1].map((f) => set4(BOX.ch, (c) => chargerDraw(c, 'tele', f), 925 + f));
      SPR.chDash = set4(BOX.ch, (c) => chargerDraw(c, 'dash', 0), 927);
      SPR.chDizzy = [0, 2].map((f) => set4(BOX.ch, (c) => chargerDraw(c, 'dizzy', f), 928 + f));
    },
    mother() { SPR.mo = [0, 1, 2, 3].map((f) => set4(BOX.mo, (c) => motherDraw(c, f), 940 + f)); },
    sprout() { SPR.sprout = [0, 1, 2, 3].map((f) => set4(BOX.sprout, (c) => sproutDraw(c, f), 950 + f)); },
    shot() { SPR.glob = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => build([-8, -8, 8, 8], (c) => globDraw(c, (i / 8) * TAU), 960 + i)); SPR.drop = build([-2, -2, 2, 2], dropDraw, 970); SPR.spray = build([0, -5, 10, 5], sprayDraw, 971); },
  };
  const done = {};
  function need(k) { if (!done[k]) { done[k] = true; LAZY[k](); } }
  function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssH = window.__forceH || window.innerHeight || 900;
    const S = (cssH * dpr) / 360;
    K = Math.max(3, Math.min(5, Math.round(S * 1.2)));
    FPC = makeFingerprint();
    SPR.shadow = radial(64, [[0, 'rgba(44,24,16,0.5)'], [0.45, 'rgba(44,24,16,0.34)'], [1, 'rgba(44,24,16,0)']]);
    SPR.gGreen = radial(64, [[0, 'rgba(200,255,100,0.85)'], [0.35, 'rgba(160,240,60,0.35)'], [1, 'rgba(120,220,40,0)']]);
    SPR.gRed = radial(64, [[0, 'rgba(255,90,70,0.85)'], [0.35, 'rgba(255,60,40,0.35)'], [1, 'rgba(255,40,30,0)']]);
    SPR.gGold = radial(64, [[0, 'rgba(255,214,120,0.85)'], [0.35, 'rgba(255,170,70,0.35)'], [1, 'rgba(255,140,40,0)']]);
    SPR.gPink = radial(64, [[0, 'rgba(255,170,210,0.8)'], [0.35, 'rgba(255,140,190,0.3)'], [1, 'rgba(255,120,180,0)']]);
    SPR.star = build([-3.4, -3.4, 3.4, 3.4], starDraw, 990);
    SPR.streak = plain([-14, -2.6, -1, 2.6], (c) => {
      const g = c.createLinearGradient(-2, 0, -13, 0);
      g.addColorStop(0, 'rgba(250,240,220,0.9)'); g.addColorStop(1, 'rgba(250,240,220,0)');
      c.strokeStyle = g; c.lineCap = 'round';
      c.lineWidth = 1.3; c.beginPath(); c.moveTo(-2, 0); c.lineTo(-13, 0); c.stroke();
      c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3, -2); c.lineTo(-10, -2); c.moveTo(-3, 2); c.lineTo(-9, 2); c.stroke();
    });
  }

  /* ================================================================= register */
  const scl = (e) => 0.94 + e.seed * 0.12;
  const step = (v, n) => Math.floor(v * n) / n;
  Cn.art('clay', {
    init() { init(); },
    enemies: {
      spitter(ctx, e, view) {
        need('spitter'); need('shot'); // the recoil spray sprite is built with the shot sprites
        const V = tf(view);
        const f = Math.floor((e.anim * 0.8 + e.seed * 4) * 4) & 3;
        let x = e.x, y = e.y, sx = 1, sy = 1, rot = [0, 0.07, 0, -0.07][f];
        if (f & 1) { y -= 1.1; sy *= 1.03; } else { sx *= 1.05; sy *= 0.95; }
        let set = SPR.sp[f];
        const aim = e.mode === 'aim' && !e.dying, ch = aim ? e.charge || 0 : 0, spit = e.spit || 0;
        if (aim) {
          set = SPR.spAim;
          const q = step(ch, 6), sw = 1 + 0.13 * q, tr = step(view.rt * 12, 1);
          y = e.y; rot = (U.hash2(tr, 3, 7) - 0.5) * 0.08 * q;
          x += (U.hash2(tr, 4, 7) - 0.5) * 1.2 * q;
          sx = sw; sy = sw * (1 - 0.03 * q);
        } else if (spit > 0) {
          const q = step(spit, 4);
          set = SPR.sp[0]; y = e.y; rot = -e.facing * 0.12 * q;
          sx = 1 - 0.14 * q; sy = 1 + 0.12 * q; x -= e.facing * 2.2 * q;
        }
        const k = scl(e);
        drawBody(ctx, V, e, view, set, x, y, sx * k, sy * k, rot, () => {
          if (aim) { lp(13.4, -10.3, PT); glowAt(ctx, SPR.gGreen, PT[0], PT[1], 4 + ch * 4, 0.3 + ch * 0.7); }
          else if (spit > 0) {
            lp(14.0, -10.3, PT);
            const q = 1 - step(spit, 4), d = e.facing < 0 ? -1 : 1;
            ctx.globalAlpha = Math.min(1, spit * 1.6);
            blitRot(ctx, V, SPR.spray, PT[0] + d * q * 3, PT[1], d * (0.8 + q * 0.6), 0.8 + q * 0.6, 0);
            ctx.globalAlpha = 1;
          }
        });
      },
      bomber(ctx, e, view) {
        need('bomber');
        const V = tf(view);
        const f = Math.floor((e.anim * 1.2 + e.seed * 4) * 4) & 3;
        let x = e.x, y = e.y, sx = 1, sy = 1, rot = [0, 0.06, 0, -0.06][f];
        if (f & 1) { y -= 0.9; sy *= 1.03; } else { sx *= 1.05; sy *= 0.95; }
        const armed = e.armed && !e.dying, fu = armed ? e.fuse || 0 : 0;
        let blink = 0;
        if (armed) {
          const q = step(fu, 8), tr = Math.floor(view.rt * 12);
          const sw = 1 + 0.16 * q + 0.05 * (U.hash2(tr, 5, 9) - 0.5) * q;
          sx *= sw; sy *= sw;
          x += (U.hash2(tr, 6, 9) - 0.5) * 1.0 * q;
          blink = ((fu * (3 + 11 * fu)) % 1) < 0.5 ? 1 : 2;
        }
        const k = scl(e) * 0.95, set = SPR.bo[f];
        drawBody(ctx, V, e, view, set, x, y, sx * k, sy * k, rot, (bx, by) => {
          if (armed) {
            const left = e.facing < 0;
            if (blink === 1) { ctx.globalAlpha = 0.65; put(ctx, V, left ? set.tl : set.t, POSE.x, POSE.y, bx, by, POSE.rot); }
            else { ctx.globalAlpha = 0.5; put(ctx, V, left ? set.fl : set.f, POSE.x, POSE.y, bx, by, POSE.rot); }
            ctx.globalAlpha = 1;
            lp(0, -9, PT);
            glowAt(ctx, SPR.gRed, PT[0], PT[1], 9 + fu * 6, (blink === 1 ? 0.5 : 0.2) + fu * 0.3);
          }
          lp(FUSE_TIP[0], FUSE_TIP[1], PT);
          const fl = 0.7 + 0.3 * U.hash2(Math.floor(view.rt * 12), (e.seed * 999) | 0, 3);
          const ss = (armed ? 0.75 + fu * 1.1 : 0.55) * fl;
          glowAt(ctx, SPR.gGold, PT[0], PT[1], (armed ? 4 + fu * 5 : 3), 0.85);
          blitRot(ctx, V, SPR.star, PT[0], PT[1], ss, ss, Math.floor(view.rt * 12) * 0.5);
        });
      },
      charger(ctx, e, view) {
        need('charger');
        const V = tf(view);
        const mode = e.dying ? 'chase' : e.mode;
        const f = Math.floor((e.anim * 0.7 + e.seed * 4) * 4) & 3;
        let x = e.x, y = e.y, sx = 1, sy = 1, rot = [0, 0.04, 0, -0.04][f];
        if (f & 1) { y -= 1.1; sy *= 1.02; } else { sx *= 1.04; sy *= 0.96; }
        let set = SPR.ch[f];
        const fs = e.facing < 0 ? -1 : 1, t = e.modeT || 0, tr = Math.floor(view.rt * 12);
        if (mode === 'tele') {
          const q = U.clamp(t / 0.72, 0, 1);
          set = SPR.chTele[tr & 1];
          y = e.y; x += (U.hash2(tr, 8, 1) - 0.5) * 1.2 * q;
          rot = -fs * (0.2 * U.ease.outQuad(Math.min(1, step(t, 12) / 0.3)) - 0.24 * Math.max(0, (step(t, 12) - 0.45) / 0.27));
          sx = 1 - 0.06 * q; sy = 1 + 0.05 * q;
        } else if (mode === 'dash') {
          set = SPR.chDash; y = e.y - (tr & 1) * 0.8; rot = fs * 0.16; sx = 1.16; sy = 0.9;
        } else if (mode === 'rest') {
          set = SPR.chDizzy[Math.floor(view.rt * 3) & 1];
          y = e.y; rot = Math.sin(step(view.rt, 12) * 8 + e.seed * 3) * 0.07;
        }
        const k = scl(e) * 0.95;
        if (mode === 'dash' && !e.dying && e.spawnT >= 1) {
          const left = e.facing < 0;
          for (let i = 2; i >= 1; i--) { ctx.globalAlpha = 0.16 * (3 - i); put(ctx, V, left ? set.nl : set.n, x - e.dashX * 6 * i, y - e.dashY * 6 * i, sx * k, sy * k, rot); }
          ctx.globalAlpha = 0.9;
          const a = Math.atan2(e.dashY, e.dashX);
          blitRot(ctx, V, SPR.streak, x - e.dashX * 12, y - 14, 1.3, 1.3, a);
          blitRot(ctx, V, SPR.streak, x - e.dashX * 14, y - 6, 1.0, 1.0, a);
          ctx.globalAlpha = 1;
        }
        drawBody(ctx, V, e, view, set, x, y, sx * k, sy * k, rot, () => {
          if (mode === 'tele') {
            lp(CH_EYE[0], CH_EYE[1], PT);
            glowAt(ctx, SPR.gRed, PT[0], PT[1], 5 + U.clamp(t / 0.72, 0, 1) * 3, 0.5 + 0.4 * (tr & 1));
          } else if (mode === 'rest') {
            lp(CH_HEAD[0], CH_HEAD[1] - 3, PT);
            const rt = step(view.rt, 12);
            for (let i = 0; i < 3; i++) { const a = rt * 6 + (i / 3) * TAU, s2 = 0.85 + Math.sin(a) * 0.2; blitRot(ctx, V, SPR.star, PT[0] + Math.cos(a) * 7, PT[1] + Math.sin(a) * 2.4, s2, s2, a * 0.5); }
          }
        });
      },
      mother(ctx, e, view) {
        need('mother'); need('sprout');
        const V = tf(view);
        const f = Math.floor((e.anim * 0.32 + e.seed) * 4) & 3;
        let y = e.y, sx = 1, sy = 1;
        const rot = [0, 0.03, 0, -0.03][f];
        if (f & 1) y -= 1.2; else { sx *= 1.05; sy *= 0.95; }
        const b = e.dying ? 0 : e.birth || 0;
        if (b > 0) { const q = step(1 - b, 10); const w = Math.sin(q * PI * 3) * b; sx *= 1 + 0.16 * w; sy *= 1 - 0.14 * w; }
        const k = scl(e) * 0.93;
        if (b > 0.02) glowAt(ctx, SPR.gPink, e.x, e.y - 18, 16 + (1 - b) * 8, b * 0.7);
        drawBody(ctx, V, e, view, SPR.mo[f], e.x, y, sx * k, sy * k, rot);
      },
      sprout(ctx, e, view) {
        need('sprout');
        const V = tf(view);
        const f = Math.floor((e.anim * 1.2 + e.seed * 4) * 4) & 3;
        let y = e.y, sx = 1, sy = 1;
        if (f & 1) { y -= 1.0; sy *= 1.04; } else { sx *= 1.06; sy *= 0.94; }
        const k = scl(e);
        drawBody(ctx, V, e, view, SPR.sprout[f], e.x, y, sx * k, sy * k, [0, 0.1, 0, -0.1][f]);
      },
    },
    shot(ctx, s, view) {
      need('shot');
      const x = s.x, y = s.y - (s.z || 11), a = s.angle || 0, age = s.age || 0;
      glowAt(ctx, SPR.gGreen, x, y, 9, 0.55);
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let i = 2; i >= 1; i--) { const d = 5.5 + i * 3.6, sc = 1 - i * 0.28; blit(ctx, SPR.drop, x - ca * d, y - sa * d, sc, sc); }
      // pre-rotated (light stays on top); 8 directions, stop-motion wobble
      const idx = ((Math.round((a / TAU) * 8) % 8) + 8) % 8;
      const w = (U.hash2(Math.floor(age * 12), (s.seed * 999) | 0, 5) - 0.5) * 0.16;
      blit(ctx, SPR.glob[idx], x, y, 1 + w, 1 - w);
    },
    icons: (() => {
      const o = {};
      for (const id in ICONS) {
        o[id] = (ctx, size) => {
          const oldPK = PK;
          ctx.save(); ctx.scale(size / 48, size / 48);
          PK = size / 48; PR = U.rng(31);
          ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          try { ICONS[id](ctx); } finally { ctx.restore(); PK = oldPK; }
        };
      }
      return o;
    })(),
  });
})();
