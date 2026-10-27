/* Native art for the new enemies / upgrades in the 'candy' world (Süßes oder Saures) – see js/content/ART_API.md.
   Same language as js/styles/candy.js: everything is edible (hard candy, gummy jelly, marshmallow, chocolate,
   licorice, caramel), rendered with radial gloss + jelly edges + sharp speculars, one soft cocoa outline added
   around the finished sprite. */
(function () {
  'use strict';
  const U = window.U, Cn = window.Content;
  const TAU = Math.PI * 2, PI = Math.PI;

  const OUT = '#3a1424';
  const FLASH = '#fff3f8';
  let K = 3;
  let SPR = null;

  /* ================================================================ helpers (copied from the style) */
  function rg(c, x0, y0, r0, x1, y1, r1, stops) { const g = c.createRadialGradient(x0, y0, r0, x1, y1, r1); for (const s of stops) g.addColorStop(s[0], s[1]); return g; }
  function lg(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); for (const s of stops) g.addColorStop(s[0], s[1]); return g; }
  function gloss(c, path, cx, cy, r, light, mid, dark) {
    c.beginPath(); path(c);
    c.fillStyle = rg(c, cx - r * 0.38, cy - r * 0.45, r * 0.05, cx, cy, r * 1.18, [[0, light], [0.5, mid], [1, dark]]);
    c.fill();
  }
  function spec(c, x, y, rx, ry, rot, a) {
    c.save(); c.globalAlpha = a === undefined ? 0.9 : a; c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fill(); c.restore();
  }
  function rim(c, path, x0, y0, x1, y1, col, w) {
    c.save(); c.beginPath(); path(c); c.clip();
    c.lineWidth = w; c.strokeStyle = lg(c, x0, y0, x1, y1, [[0, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,0)'], [1, col]]);
    c.beginPath(); path(c); c.stroke(); c.restore();
  }
  function clipDo(c, path, fn) { c.save(); c.beginPath(); path(c); c.clip(); fn(c); c.restore(); }
  const E = (x, y, rx, ry, rot) => (c) => { rot = rot || 0; c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
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
      c.bezierCurveTo(p1[0] + ((p2[0] - p0[0]) / 6) * ten, p1[1] + ((p2[1] - p0[1]) / 6) * ten,
        p2[0] - ((p3[0] - p1[0]) / 6) * ten, p2[1] - ((p3[1] - p1[1]) / 6) * ten, p2[0], p2[1]);
    }
    c.closePath();
  }
  function roundPoly(c, pts, r) {
    const n = pts.length, a = pts[n - 1], b = pts[0];
    c.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.arcTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, r); }
    c.closePath();
  }
  function rrect(c, x, y, w, h, r) { roundPoly(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r); }
  function starPts(n, ro, ri, cx, cy, rot) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU, r = i & 1 ? ri : ro; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
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
  const seedPath = (c) => { c.moveTo(4.4, 0); c.bezierCurveTo(2.6, -2.8, -3.5, -3.1, -3.5, 0); c.bezierCurveTo(-3.5, 3.1, 2.6, 2.8, 4.4, 0); c.closePath(); };
  function stripes(c, x0, y0, x1, y1, w, gap, col, ang) {
    c.save(); c.fillStyle = col;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0);
    c.translate(cx, cy); c.rotate(ang === undefined ? -0.7 : ang);
    for (let x = -R; x < R; x += w + gap) c.fillRect(x, -R, w, R * 2);
    c.restore();
  }
  function jelly(c, path, cx, cy, r, edgeCol, glowCol) {
    clipDo(c, path, (k) => {
      k.fillStyle = rg(k, cx - r * 0.1, cy - r * 0.05, r * 0.1, cx, cy, r * 1.1, [[0, 'rgba(255,255,255,0.28)'], [0.55, 'rgba(255,255,255,0.06)'], [1, 'rgba(255,255,255,0)']]);
      k.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
      k.lineWidth = r * 0.42; k.strokeStyle = edgeCol;
      k.beginPath(); path(k); k.stroke();
      if (glowCol) {
        k.fillStyle = rg(k, cx + r * 0.42, cy + r * 0.45, 0, cx + r * 0.42, cy + r * 0.45, r * 0.7, [[0, glowCol], [1, 'rgba(255,255,255,0)']]);
        k.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
      }
    });
  }
  const LIC = ['#6a4a66', '#2c1a2a', '#120810'];
  function licorice(c, path, cx, cy, r) {
    gloss(c, path, cx, cy, r, LIC[0], LIC[1], LIC[2]);
    rim(c, path, cx - r, cy - r, cx + r, cy + r, 'rgba(190,130,200,0.55)', r * 0.5);
  }
  function chocolate(c, path, cx, cy, r) {
    gloss(c, path, cx, cy, r, '#9a5e3e', '#55291a', '#2a120a');
    rim(c, path, cx - r, cy - r, cx + r, cy + r, 'rgba(255,190,140,0.5)', r * 0.18);
  }
  function marshmallow(c, path, cx, cy, r) {
    c.beginPath(); path(c);
    c.fillStyle = rg(c, cx - r * 0.35, cy - r * 0.5, r * 0.1, cx, cy, r * 1.2, [[0, '#ffffff'], [0.55, '#fbf5fb'], [1, '#dccbe4']]);
    c.fill();
  }
  function caramelHole(c, path, bx, by, br, dark) {
    c.beginPath(); path(c);
    c.fillStyle = dark ? '#1e0a14' : '#7a2406'; c.fill();
    c.save(); c.beginPath(); path(c); c.clip();
    c.translate(0.2, 0.55);
    c.beginPath(); path(c);
    c.fillStyle = dark ? rg(c, bx, by, 0, bx, by, br, [[0, '#6a2a3a'], [1, '#3a1424']]) : rg(c, bx, by, 0, bx, by, br, [[0, '#fffbd6'], [0.35, '#ffe07a'], [0.75, '#ffa12a'], [1, '#e2650e']]);
    c.fill();
    c.restore();
  }
  function jellyLeaf(c, bx, by, a, len, wid, cols) {
    const p = (k) => leafPath(k, bx, by, a, len, wid);
    const tx = bx + Math.sin(a) * len * 0.5, ty = by - Math.cos(a) * len * 0.5;
    cols = cols || ['#c9ff9e', '#55cc48', '#22852e'];
    gloss(c, p, tx, ty, len * 0.6, cols[0], cols[1], cols[2]);
    jelly(c, p, tx, ty, len * 0.5, 'rgba(20,110,40,0.35)');
    c.strokeStyle = 'rgba(30,120,50,0.6)'; c.lineWidth = 0.4;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.sin(a) * len * 0.75, by - Math.cos(a) * len * 0.75); c.stroke();
    spec(c, tx - Math.cos(a) * wid * 0.4, ty - Math.sin(a) * wid * 0.4, len * 0.16, 0.45, a - PI / 2, 0.75);
  }
  function sparkleParts(c, col) {
    c.fillStyle = rg(c, 0, 0, 0, 0, 0, 4, [[0, 'rgba(255,255,255,0.9)'], [0.35, col], [1, 'rgba(255,255,255,0)']]);
    c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(0, -3.6); c.quadraticCurveTo(0.35, -0.35, 3.6, 0); c.quadraticCurveTo(0.35, 0.35, 0, 3.6); c.quadraticCurveTo(-0.35, 0.35, -3.6, 0); c.quadraticCurveTo(-0.35, -0.35, 0, -3.6); c.fill();
  }
  function seedParts(c) {
    gloss(c, seedPath, 0, 0, 4, '#ffffff', '#ffe266', '#d69a14');
    spec(c, -0.8, -1.3, 1.6, 0.55, -0.12, 0.95);
    spec(c, 2.2, 0.9, 0.5, 0.3, 0, 0.6);
  }
  function swirlDisc(c, cx, cy, r, cols) {
    const d = E(cx, cy, r, r);
    clipDo(c, d, (k) => {
      k.fillStyle = cols[0]; k.fillRect(cx - r, cy - r, r * 2, r * 2);
      k.lineWidth = r * 0.26; k.lineCap = 'butt'; k.strokeStyle = cols[1];
      for (let a = 0; a < 4; a += 2) {
        k.beginPath();
        for (let t = 0; t <= 1.001; t += 0.02) { const an = (a / 4) * TAU + t * TAU * 1.25, rr = Math.pow(t, 0.85) * r * 1.08; const x = cx + Math.cos(an) * rr, y = cy + Math.sin(an) * rr; if (t === 0) k.moveTo(x, y); else k.lineTo(x, y); }
        k.stroke();
      }
      k.fillStyle = rg(k, cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r * 1.05, [[0, 'rgba(255,255,255,0.55)'], [0.5, 'rgba(255,255,255,0.05)'], [1, 'rgba(70,0,50,0.38)']]);
      k.fillRect(cx - r, cy - r, r * 2, r * 2);
    });
    spec(c, cx - r * 0.42, cy - r * 0.48, r * 0.32, r * 0.14, -0.75, 0.95);
  }
  /** tapered ribbon along a centre line, round ends */
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
  const SPRINK_COL = ['#ff4f8b', '#ffd23a', '#4fd6ff', '#7ee26a', '#b88cff', '#ffffff'];
  function sprinkle(c, x, y, a, col, s) {
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s || 1, s || 1);
    c.beginPath(); CAP(-1.0, 0, 1.0, 0, 0.42)(c); c.fillStyle = col; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.2; c.beginPath(); c.moveTo(-0.7, -0.16); c.lineTo(0.7, -0.16); c.stroke();
    c.restore();
  }

  /* --------------------------------------------------------- sprite builder (as in the style) */
  function addOutline(src, col, w) {
    const t = U.tint(src, col);
    const o = U.canvas(src.width, src.height);
    const n = w > 2.5 ? 16 : 12;
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; o.ctx.drawImage(t, Math.cos(a) * w, Math.sin(a) * w); }
    o.ctx.drawImage(src, 0, 0);
    return o.c;
  }
  function build(box, fn, opt) {
    opt = opt || {};
    const k = opt.k || K;
    const m = opt.margin === undefined ? 1 : opt.margin;
    const l = box[0] - m, t = box[1] - m, r = box[2] + m, b = box[3] + m;
    const { c, ctx } = U.canvas(Math.ceil((r - l) * k), Math.ceil((b - t) * k));
    ctx.scale(k, k); ctx.translate(-l, -t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(ctx);
    const cv = opt.ol === 0 ? c : addOutline(c, opt.olc || OUT, (opt.ol || 0.5) * k);
    return { c: cv, ox: -l * k, oy: -t * k, k };
  }
  function flipS(s) { return { c: U.flipX(s.c), ox: s.c.width - s.ox, oy: s.oy, k: s.k }; }
  function set4(box, fn, opt, tint) {
    const n = build(box, fn, opt);
    const f = { c: U.tint(n.c, FLASH), ox: n.ox, oy: n.oy, k: n.k };
    const o = { n, f, nl: flipS(n), fl: flipS(f) };
    if (tint) { o.t = { c: U.tint(n.c, tint), ox: n.ox, oy: n.oy, k: n.k }; o.tl = flipS(o.t); }
    return o;
  }
  function plain(box, fn, k) { return build(box, fn, { ol: 0, margin: 0, k }); }
  function glowSpr(r, rgb, a0) {
    return plain([-r, -r, r, r], (c) => {
      c.fillStyle = rg(c, 0, 0, 0, 0, 0, r, [[0, 'rgba(' + rgb + ',' + a0 + ')'], [0.4, 'rgba(' + rgb + ',' + a0 * 0.4 + ')'], [1, 'rgba(' + rgb + ',0)']]);
      c.fillRect(-r, -r, r * 2, r * 2);
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
    const k = 1 / s.k;
    ctx.drawImage(s.c, x - s.ox * k * sx, y - s.oy * k * sy, s.c.width * k * sx, s.c.height * k * sy);
  }
  function blitRot(ctx, V, s, x, y, sx, sy, rot) {
    const S = V.S, co = Math.cos(rot) * S, si = Math.sin(rot) * S;
    ctx.setTransform(co, si, -si, co, V.ox + x * S, V.oy + y * S);
    const k = 1 / s.k;
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
  const POSE = { x: 0, y: 0, sx: 1, sy: 1, rot: 0, f: 1 };
  function lp(px, py, out) {
    const dx = POSE.f * px * POSE.sx, dy = py * POSE.sy, co = Math.cos(POSE.rot), si = Math.sin(POSE.rot);
    out[0] = POSE.x + dx * co - dy * si; out[1] = POSE.y + dx * si + dy * co;
    return out;
  }
  const PT = [0, 0];
  /** The style's creeper handling: elastic pop out of the wrapper, sugar-white inflate-and-pop death, capped flash. */
  function drawBody(ctx, V, e, set, x, y, sx, sy, rot, extra, flashCap) {
    const left = e.facing < 0;
    if (e.spawnT < 1) {
      const q = U.clamp((e.spawnT - 0.12) / 0.88, 0, 1);
      if (q <= 0) return false;
      const p = U.ease.outElastic(q);
      sy *= p; sx *= p > 0.05 ? U.clamp(1 / Math.sqrt(p), 0.75, 1.5) : 1.5;
      rot *= q;
    }
    POSE.x = x; POSE.y = y; POSE.sx = sx; POSE.sy = sy; POSE.rot = rot; POSE.f = left ? -1 : 1;
    if (e.dying) {
      const q = e.deathT;
      if (q >= 0.42) return false;
      const k = q < 0.2 ? 1 + U.ease.outQuad(q / 0.2) * 0.25 : 1.25 * (1 - U.ease.inQuad((q - 0.2) / 0.22));
      sx *= k * (1 + 0.12 * Math.sin(q * 44)); sy *= k * (1 - 0.12 * Math.sin(q * 44));
      put(ctx, V, left ? set.nl : set.n, x, y, sx, sy, rot);
      ctx.globalAlpha = 0.6;
      put(ctx, V, left ? set.fl : set.f, x, y, sx, sy, rot);
      ctx.globalAlpha = 1;
      return false;
    }
    const fl = e.flash || 0;
    if (fl > 0) { sx *= 1 + 0.18 * fl; sy *= 1 - 0.15 * fl; POSE.sx = sx; POSE.sy = sy; }
    put(ctx, V, left ? set.nl : set.n, x, y, sx, sy, rot);
    if (extra) extra(sx, sy);
    if (fl > 0.02) {
      ctx.globalAlpha = Math.min(flashCap || 0.55, fl * 0.9);
      put(ctx, V, left ? set.fl : set.f, x, y, sx, sy, rot);
      ctx.globalAlpha = 1;
    }
    return true;
  }

  /* ============================================================ enemies */
  const SOUR = { hi: '#b48cff', top: '#7a34cf', dk: '#3f137f' };
  const LIME = ['#f4ffc0', '#a8ec4a', '#4f9e26'];
  const TOX = ['#ffffd0', '#b8ff2a', '#4fa818'];
  const PINK = { hi: '#ffb8dc', top: '#ff4fa3', dk: '#a3165f', edge: 'rgba(150,10,80,0.5)', glow: 'rgba(255,200,230,0.6)' };
  const LILAC = { hi: '#ecd2ff', top: '#b07ce6', dk: '#6a3ba8', edge: 'rgba(90,30,140,0.45)', glow: 'rgba(255,220,250,0.6)' };

  function twoLayer(c, body, waveY, amp, freq, top, botStops, x0, x1) {
    c.beginPath(); body(c);
    c.fillStyle = botStops; c.fill();
    clipDo(c, body, (k) => {
      k.beginPath(); k.moveTo(x0, waveY - 40); k.lineTo(x1, waveY - 40); k.lineTo(x1, waveY);
      for (let x = x1; x >= x0; x -= 0.5) k.lineTo(x, waveY + amp * Math.sin(x * freq + 0.6));
      k.closePath(); k.fillStyle = top; k.fill();
      k.strokeStyle = 'rgba(255,255,255,0.55)'; k.lineWidth = 0.45;
      k.beginPath(); for (let x = x0; x <= x1; x += 0.5) { const y = waveY + 0.3 + amp * Math.sin(x * freq + 0.6); if (x === x0) k.moveTo(x, y); else k.lineTo(x, y); } k.stroke();
    });
  }
  function candyEyes(c, pts, j, small) {
    c.fillStyle = '#2a0f22';
    c.beginPath(); for (const p of pts) c.ellipse(p[0] + j, p[1], p[2], p[3], 0, 0, TAU); c.fill();
    c.fillStyle = '#ffe36e';
    c.beginPath(); for (const p of pts) c.arc(p[0] + j + p[2] * 0.25, p[1] + p[3] * 0.28, p[2] * 0.36, 0, TAU); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); for (const p of pts) c.arc(p[0] + j - p[2] * 0.3, p[1] - p[3] * 0.38, small ? p[2] * 0.22 : p[2] * 0.28, 0, TAU); c.fill();
  }

  // ---- Rüben-Spucker: sour gummy turnip (purple top, sour-apple bottom) with a licorice spitting tube
  function spitterParts(c, fr, aim) {
    const stp = [0, 1, 0, -1][fr], sw = [0, 0.08, 0, -0.08][fr];
    const lift = (s) => Math.max(0, s) * 1.4;
    const w = aim ? 10.4 : 9.4;
    jellyLeaf(c, -0.6, -18.8, -0.75 + sw, 7.0, 2.2, ['#e4ff9e', '#9ee03a', '#4f9a1e']);
    jellyLeaf(c, -0.2, -18.8, 0.55 + sw, 6.4, 2.0, ['#e4ff9e', '#9ee03a', '#4f9a1e']);
    jellyLeaf(c, -0.4, -19.0, -0.08 + sw, 8.8, 2.5, ['#e4ff9e', '#9ee03a', '#4f9a1e']);
    for (const sgn of [-1, 1]) {
      const st = sgn < 0 ? stp : -stp;
      gloss(c, CAP(2.7 * sgn, -4.6, (3.0 - st * 0.9) * sgn, -1.1 - lift(st), 1.35), 2.7 * sgn, -3, 2.2, '#ffffff', '#ffe9f2', '#e2b9cc');
    }
    const body = (k) => turnipPath(k, -0.4, -19.6, -2.5, w);
    twoLayer(c, body, -10.4, 0.8, 0.9, rg(c, -4.5, -17, 0.5, 0, -14, 11, [[0, SOUR.hi], [0.5, SOUR.top], [1, SOUR.dk]]),
      rg(c, -3, -7, 1, 0, -8, 11, [[0, LIME[0]], [0.55, LIME[1]], [1, LIME[2]]]), -14, 14);
    jelly(c, body, 0, -11, 10, 'rgba(50,20,100,0.4)', 'rgba(230,255,170,0.55)');
    // sour sugar crystals
    clipDo(c, body, (k) => {
      const r = U.rng(12 + fr);
      for (let i = 0; i < 34; i++) {
        const x = r.range(-10, 10), y = r.range(-19, -3);
        k.fillStyle = i % 3 ? 'rgba(255,255,255,0.85)' : 'rgba(220,255,140,0.9)';
        k.save(); k.translate(x, y); k.rotate(r.range(0, 1.5)); k.fillRect(-0.3, -0.3, 0.6, 0.6); k.restore();
      }
    });
    if (aim) {
      const ch = E(5.6, -9.4, 4.6, 3.9);
      gloss(c, ch, 5.6, -9.4, 4.6, SOUR.hi, SOUR.top, SOUR.dk);
      jelly(c, ch, 5.6, -9.4, 4.2, 'rgba(50,20,100,0.35)');
      spec(c, 4.0, -11.2, 1.4, 0.6, -0.5, 0.9);
    }
    // licorice tube + sour-apple gummy lip ring
    const tube = CAP(5.0, -9.6, 12.2, -10.2, aim ? 2.9 : 2.6);
    licorice(c, tube, 8.6, -10, 4);
    c.strokeStyle = 'rgba(190,140,210,0.6)'; c.lineWidth = 0.35;
    c.beginPath(); for (const x of [7.0, 9.0, 11.0]) { c.moveTo(x, -12.4); c.lineTo(x + 0.6, -7.8); } c.stroke();
    spec(c, 8.6, -11.6, 1.6, 0.4, -0.05, 0.7);
    const lip = E(13.0, -10.3, 1.9, aim ? 3.6 : 3.3);
    gloss(c, lip, 13, -10.3, 3.2, TOX[0], TOX[1], TOX[2]);
    c.fillStyle = '#1e0a14'; c.beginPath(); c.ellipse(13.5, -10.3, 1.05, aim ? 2.5 : 2.2, 0, 0, TAU); c.fill();
    c.fillStyle = aim ? '#f8ffd0' : '#7fd02a'; c.beginPath(); c.ellipse(13.75, -10.1, 0.55, aim ? 1.7 : 1.3, 0, 0, TAU); c.fill();
    spec(c, 12.4, -12.4, 0.5, 0.9, 0.2, 0.9);
    if (!aim) {
      const dr = (k) => { CAP(13.0, -7.6, 13.2, -5.0, 0.7)(k); E(13.25, -4.4, 1.05, 1.2)(k); };
      gloss(c, dr, 13.1, -5, 1.6, TOX[0], TOX[1], TOX[2]);
      spec(c, 12.9, -4.8, 0.35, 0.45, 0, 0.95);
    }
    // face
    const j = [0, 0.15, 0, -0.1][fr];
    candyEyes(c, [[0.6, -14.6, 1.7, 2.1], [5.6, -14.4, 1.6, 2.0]], j);
    c.strokeStyle = '#2a0f22'; c.lineWidth = 1.2; c.lineCap = 'round';
    c.beginPath();
    if (aim) { c.moveTo(-2.0, -17.6); c.lineTo(2.4, -16.8); c.moveTo(4.0, -16.7); c.lineTo(8.0, -17.8); }
    else { c.moveTo(-1.9, -18.2); c.lineTo(2.6, -16.6); c.moveTo(4.0, -16.6); c.lineTo(7.9, -18.0); }
    c.stroke();
    spec(c, -5.4, -16.0, 2.0, 0.9, -0.8, 0.95);
    spec(c, -3.4, -18.4, 0.55, 0.45, 0, 0.95);
    spec(c, -7.2, -8.6, 0.45, 1.3, 0.2, 0.55);
  }

  // ---- Zündrübe: cherry hard-candy beet bomb with a licorice fuse
  const FUSE_TIP = [-4.6, -24.0];
  function bomberParts(c, fr) {
    const a = [0, 1, 0, -1][fr];
    const legs = [[-3.6, 1], [-1.2, -1], [1.4, 1], [3.8, -1]];
    const leg = (L, s, near) => licorice(c, CAP(L[0], -4.0, L[0] * 1.35 + s * 1.3 + (near ? 0.3 : -0.3), -0.9 - Math.max(0, s) * 1.2, near ? 1.0 : 0.9), L[0], -2.5, 2);
    for (let i = 0; i < 4; i += 2) leg(legs[i], a * legs[i][1], false);
    // little root tail (red candy)
    gloss(c, (k) => ribbonPath(k, [[-4.5, -7.0], [-7.4, -6.0], [-9.6, -4.0]], 2.2, 0.6), -7, -6, 3, '#ffb3c0', '#e8203f', '#8a0624');
    // licorice fuse (twisted)
    const fz = (k) => ribbonPath(k, [[0.0, -15.5], [-0.8, -18.6], [-2.4, -20.8], [-3.9, -22.2], [FUSE_TIP[0], FUSE_TIP[1]]], 1.7, 1.5);
    licorice(c, fz, -2.2, -20, 4);
    clipDo(c, fz, (k) => stripes(k, -6, -26, 2, -14, 0.4, 0.9, 'rgba(200,150,210,0.55)', 0.7));
    jellyLeaf(c, 0.4, -15.2, -0.15 + a * 0.05, 5.4, 2.1);
    jellyLeaf(c, 0.6, -15.2, 0.75 + a * 0.05, 4.8, 1.9);
    const body = (k) => blobPath(k, [[0.4, -16.2], [5.6, -14.6], [7.6, -9.6], [6.0, -4.4], [0.4, -2.6], [-5.4, -4.4], [-7.3, -9.6], [-5.0, -14.6]], 1);
    gloss(c, body, 0, -9.4, 8, '#ffb3c0', '#ff2f55', '#a0082a');
    clipDo(c, body, (k) => {
      // cherry-candy swirl rings
      k.strokeStyle = 'rgba(255,220,230,0.35)'; k.lineWidth = 0.9;
      k.beginPath(); k.ellipse(0.4, -9.4, 5.6, 5.2, 0, PI * 0.55, PI * 1.35); k.stroke();
      k.beginPath(); k.ellipse(0.4, -9.4, 3.2, 3.0, 0, PI * 0.6, PI * 1.3); k.stroke();
    });
    jelly(c, body, 0.4, -9.4, 7.6, 'rgba(150,0,30,0.4)', 'rgba(255,170,190,0.6)');
    for (let i = 1; i < 4; i += 2) leg(legs[i], -a * legs[i][1], true);
    // mean little eyes + heavy brows
    candyEyes(c, [[2.0, -9.4, 1.35, 1.35], [5.6, -9.3, 1.25, 1.3]], 0, true);
    c.fillStyle = '#2a0f22';
    c.beginPath(); roundPoly(c, [[-0.6, -12.6], [3.6, -10.6], [3.7, -9.6], [-0.4, -11.1]], 0.3); c.fill();
    c.beginPath(); roundPoly(c, [[4.1, -10.5], [7.6, -12.2], [7.6, -11.0], [4.3, -9.4]], 0.3); c.fill();
    c.save();
    c.beginPath(); c.moveTo(0.6, -6.6); c.quadraticCurveTo(3.6, -4.0, 6.6, -6.8); c.quadraticCurveTo(3.6, -5.6, 0.6, -6.6); c.closePath();
    c.fillStyle = '#2a0f22'; c.fill(); c.clip();
    c.fillStyle = '#fff4e6'; c.beginPath(); c.moveTo(2.0, -6.4); c.lineTo(3.0, -6.0); c.lineTo(2.5, -5.0); c.closePath(); c.moveTo(4.2, -6.0); c.lineTo(5.2, -6.4); c.lineTo(4.8, -5.1); c.closePath(); c.fill();
    c.restore();
    spec(c, -3.4, -12.8, 2.0, 0.9, -0.7, 0.95);
    spec(c, -1.2, -14.6, 0.5, 0.45, 0, 0.95);
    spec(c, 5.0, -4.8, 1.1, 0.4, -0.5, 0.45);
  }

  // ---- Wurzel-Bock: nougat parsnip ram, chocolate-dipped legs and tail, caramel-swirl horns
  const CH_EYE = [15.6, -10.4], CH_HEAD = [11.0, -21.0];
  function nougat(c, path, cx, cy, r) {
    c.beginPath(); path(c);
    c.fillStyle = rg(c, cx - r * 0.35, cy - r * 0.45, r * 0.05, cx, cy, r * 1.15, [[0, '#fffaf0'], [0.5, '#f5deb0'], [1, '#c99a5c']]);
    c.fill();
  }
  function chargerParts(c, pose, fr) {
    const a = pose === 'walk' || pose === 'dizzy' ? [0, 1, 0, -1][fr] : 0;
    const lift = (s) => Math.max(0, s) * 1.3;
    let legs;
    if (pose === 'dash') legs = [[-7.5, -4.5, 1.6, 0], [3.5, 5.0, 2.2, 0], [-5.0, -5.0, 0.6, 1], [6.0, 5.5, 1.2, 1]];
    else if (pose === 'tele') { const sc = fr ? 1 : 0; legs = [[-7.5, -1.6, 0, 0], [3.5, 1.8, 0, 0], [-5.0, -1.4, 0, 1], [6.5, 2.4 - sc * 3.2, sc * 1.6, 1]]; }
    else legs = [[-7.5, a * 1.6, lift(a), 0], [3.5, -a * 1.6, lift(-a), 0], [-5.0, -a * 1.6, lift(-a), 1], [6.5, a * 1.6, lift(a), 1]];
    const leg = (L) => {
      const fx = L[0] + L[1], fy = -0.9 - L[2];
      const p = CAP(L[0], -6.5, fx, fy, 1.75);
      if (L[3]) nougat(c, p, L[0], -4, 3); else { c.beginPath(); p(c); c.fillStyle = '#c99a5c'; c.fill(); }
      clipDo(c, p, (k) => { k.beginPath(); k.moveTo(L[0] - 4, -2.6 - L[2] * 0.6); k.quadraticCurveTo(L[0], -3.6 - L[2] * 0.6, L[0] + 5, -2.4 - L[2] * 0.6); k.lineTo(L[0] + 6, 3); k.lineTo(L[0] - 5, 3); k.closePath(); k.fillStyle = L[3] ? '#6a3520' : '#3e1c0e'; k.fill(); });
      chocolate(c, E(fx + 0.4, fy + 0.1, 2.0, 1.15), fx + 0.4, fy, 2.2);
    };
    leg(legs[0]); leg(legs[1]);
    const lb = pose === 'dash' ? -0.55 : pose === 'tele' ? -0.15 : 0, ls = a * 0.06;
    jellyLeaf(c, 3.6, -20.4, -1.0 + lb + ls, 9.4, 2.6);
    jellyLeaf(c, 3.6, -20.4, -0.4 + lb + ls, 11.2, 3.0);
    jellyLeaf(c, 3.6, -20.4, 0.22 + lb * 0.6 + ls, 8.4, 2.5);
    const tailUp = pose === 'dash' ? -2.0 : 0;
    const body = (k) => blobPath(k, [[-16.5, -16.0 + tailUp], [-10.0, -19.8], [-1.0, -21.8], [6.5, -20.8], [11.0, -15.6], [10.0, -7.8], [4.0, -5.0], [-4.0, -5.6], [-10.0, -9.4]], 1);
    nougat(c, body, -1, -14, 14);
    clipDo(c, body, (k) => {
      // chocolate-dipped tail with a glossy edge
      k.beginPath(); k.moveTo(-30, -30); k.lineTo(-11.5, -30); k.bezierCurveTo(-10.4, -24, -12.8, -19, -11.0, -14); k.bezierCurveTo(-10.0, -11, -12.6, -8, -11.4, -4); k.lineTo(-30, -4); k.closePath();
      k.fillStyle = rg(k, -14, -17, 0.5, -13, -14, 7, [[0, '#9a5e3e'], [0.55, '#55291a'], [1, '#2a120a']]); k.fill();
      // root rings (caramel lines)
      // white-chocolate drizzle across the back
      k.lineWidth = 1.0; k.strokeStyle = '#fff6ea';
      k.beginPath();
      for (let i = 0; i <= 8; i++) { const x = -9 + i * 2.0, y = (i & 1 ? -20.6 : -17.6) + Math.abs(i - 4) * 0.2; if (!i) k.moveTo(x, y); else k.lineTo(x, y); }
      k.stroke();
    });
    rim(c, body, -16, -22, 12, -5, 'rgba(255,240,210,0.6)', 2);
    spec(c, -3.0, -18.0, 3.0, 0.9, -0.15, 0.85);
    spec(c, 2.0, -19.4, 0.6, 0.45, 0, 0.9);
    leg(legs[2]); leg(legs[3]);
    // head
    const head = E(14.2, -10.2, 5.4, 4.7, 0.25);
    nougat(c, head, 13.6, -11, 5.6);
    c.fillStyle = 'rgba(190,120,50,0.6)'; c.beginPath(); c.ellipse(18.6, -8.2, 1.0, 0.8, 0.3, 0, TAU); c.fill();
    c.fillStyle = '#2a0f22'; c.beginPath(); c.ellipse(18.8, -8.4, 0.45, 0.6, 0.3, 0, TAU); c.fill();
    // goatee of chocolate drips
    c.fillStyle = '#4a2214';
    c.beginPath(); c.moveTo(14.4, -6.6); c.quadraticCurveTo(15.0, -3.6, 15.6, -3.2); c.quadraticCurveTo(16.4, -3.8, 17.2, -6.4); c.closePath(); c.fill();
    // eye
    const ex = CH_EYE[0], ey = CH_EYE[1];
    if (pose === 'tele') {
      c.fillStyle = rg(c, ex, ey, 0, ex, ey, 2, [[0, '#fff0c0'], [0.4, '#ff6a3a'], [1, '#c4101e']]);
      c.beginPath(); c.ellipse(ex, ey, 1.9, 1.75, 0, 0, TAU); c.fill();
    } else if (pose === 'dizzy') {
      c.fillStyle = '#fff4fa'; c.beginPath(); c.ellipse(ex, ey, 1.9, 1.9, 0, 0, TAU); c.fill();
      c.strokeStyle = '#ff4f8b'; c.lineWidth = 0.55; c.beginPath();
      for (let i = 0; i <= 20; i++) { const t = i / 20, ang = t * TAU * 1.6, r = 0.15 + t * 1.45; const px = ex + Math.cos(ang) * r, py = ey + Math.sin(ang) * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
      c.stroke();
    } else candyEyes(c, [[ex + 0.2, ey, 1.5, 1.7]], 0);
    if (pose !== 'dizzy') { c.fillStyle = '#2a0f22'; c.beginPath(); roundPoly(c, [[ex - 2.6, ey - 3.6], [ex + 2.6, ey - 1.4], [ex + 2.4, ey - 0.4], [ex - 2.4, ey - 2.2]], 0.4); c.fill(); }
    // caramel-swirl horn with cream stripes
    const hp = spiralPts(9.6, -14.0, -PI / 2 - 0.5, PI * 1.85, 6.8, 1.7, 26);
    const horn = (k) => ribbonPath(k, hp, 5.0, 1.5);
    gloss(c, horn, 9.6, -14.0, 7, '#ffe8a8', '#ffa42a', '#b5520a');
    clipDo(c, horn, (k) => {
      const inner = spiralPts(9.6, -14.0, -PI / 2 - 0.5, PI * 1.85, 6.0, 1.3, 26);
      k.strokeStyle = 'rgba(255,248,225,0.9)'; k.lineWidth = 1.1;
      k.beginPath(); inner.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]))); k.stroke();
      k.strokeStyle = 'rgba(150,60,0,0.5)'; k.lineWidth = 0.5;
      k.beginPath(); hp.forEach((p, i) => { const q = inner[i]; const x = p[0] + (p[0] - q[0]) * 1.2, y = p[1] + (p[1] - q[1]) * 1.2; if (i) k.lineTo(x, y); else k.moveTo(x, y); }); k.stroke();
    });
    spec(c, 7.0, -18.6, 1.6, 0.6, -0.4, 0.95);
  }

  // ---- baby gummy sprout
  function babyBody(c, cx, by, s, face, leafA, col) {
    col = col || PINK;
    jellyLeaf(c, cx + 0.2 * s, by - 10.6 * s, leafA, 6.2 * s, 2.3 * s);
    const body = (k) => turnipPath(k, cx, by - 11.4 * s, by - 1.6 * s, 5.8 * s);
    twoLayer(c, body, by - 6.4 * s, 0.5 * s, 1.3 / s, rg(c, cx - 2 * s, by - 9.5 * s, 0.3, cx, by - 8 * s, 6 * s, [[0, col.hi], [0.5, col.top], [1, col.dk]]),
      rg(c, cx - 1.5 * s, by - 4 * s, 0.5, cx, by - 5 * s, 6.5 * s, [[0, '#ffffff'], [0.6, '#fff1f8'], [1, '#e9c9dc']]), cx - 8 * s, cx + 8 * s);
    jelly(c, body, cx, by - 6.5 * s, 5.6 * s, col.edge, col.glow);
    spec(c, cx - 2.8 * s, by - 8.8 * s, 1.3 * s, 0.6 * s, -0.8, 0.95);
    if (face) {
      c.fillStyle = '#2a0f22';
      c.beginPath(); c.arc(cx + 0.6 * s, by - 7.0 * s, 0.8 * s, 0, TAU); c.arc(cx + 3.4 * s, by - 7.0 * s, 0.75 * s, 0, TAU); c.fill();
      c.strokeStyle = '#6a1f45'; c.lineWidth = 0.5 * s; c.beginPath(); c.arc(cx + 2.0 * s, by - 3.6 * s, 0.9 * s, PI * 1.15, PI * 1.85); c.stroke();
    }
  }
  function sproutParts(c, fr) {
    const stp = [0, 1, 0, -1][fr];
    const lift = (s) => Math.max(0, s) * 1.1;
    for (const sgn of [-1, 1]) {
      const st = sgn < 0 ? stp : -stp;
      gloss(c, CAP(1.8 * sgn, -3.0, (2.1 - st * 1.0) * sgn, -0.8 - lift(st), 0.95), 1.8 * sgn, -2, 1.5, '#ffffff', '#ffe9f2', '#e2b9cc');
    }
    babyBody(c, 0, 0, 1, false, 0.45 + [0, 0.12, 0, -0.12][fr]);
    const j = [0, 0.12, 0, -0.08][fr];
    candyEyes(c, [[1.2, -6.6, 1.3, 1.6], [4.4, -6.5, 1.2, 1.5]], j);
    c.strokeStyle = '#2a0f22'; c.lineWidth = 1.0; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-0.9, -9.1); c.lineTo(2.2, -8.0); c.moveTo(3.3, -8.0); c.lineTo(5.9, -9.0); c.stroke();
    c.strokeStyle = '#6a1f45'; c.lineWidth = 0.7; c.beginPath(); c.arc(2.8, -3.0, 1.2, PI * 1.2, PI * 1.8); c.stroke();
  }

  // ---- Rüben-Ahnin: lilac gummy grandma, frosting shawl with sprinkles, candy-cane, babies on her head
  function motherParts(c, fr) {
    const st = [0, 1, 0, -1][fr];
    const lift = (s) => Math.max(0, s) * 1.6;
    jellyLeaf(c, 0.5, -33.0, -1.25, 8.5, 2.6, ['#e6f5b0', '#a3c45a', '#5e7e2e']);
    jellyLeaf(c, 0.5, -33.0, 1.2, 8.0, 2.5, ['#e6f5b0', '#a3c45a', '#5e7e2e']);
    babyBody(c, -4.6, -30.6, 0.62, true, -0.35 + st * 0.05);
    babyBody(c, 5.4, -30.8, 0.6, true, 0.4 - st * 0.05);
    babyBody(c, 0.5, -32.2, 0.7, true, 0.1 + st * 0.04);
    marshmallow(c, CAP(-12.4, -17.0, -15.6, -11.6 + st * 0.6, 2.0), -14, -14, 2.6);
    marshmallow(c, E(-4.6 + st * 1.4, -1.6 - lift(st), 3.6, 1.9), -4.6, -1.8, 3.6);
    marshmallow(c, E(5.0 - st * 1.4, -1.6 - lift(-st), 3.6, 1.9), 5.0, -1.8, 3.6);
    const body = (k) => turnipPath(k, 0.4, -33.6, -3.0, 14.6);
    twoLayer(c, body, -23.6, 1.0, 0.55, rg(c, -6, -30, 0.5, 0, -27, 15, [[0, LILAC.hi], [0.5, LILAC.top], [1, LILAC.dk]]),
      rg(c, -4, -12, 1, 0, -14, 16, [[0, '#ffffff'], [0.6, '#fff4e6'], [1, '#e8c9a8']]), -20, 20);
    jelly(c, body, 0.4, -18, 14.6, LILAC.edge, 'rgba(255,230,200,0.5)');
    // wrinkles
    c.strokeStyle = 'rgba(160,110,90,0.45)'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(-9.0, -8.0); c.quadraticCurveTo(-6.4, -6.6, -4.0, -7.6); c.moveTo(2.0, -6.0); c.quadraticCurveTo(5.0, -5.0, 7.4, -6.4); c.stroke();
    c.strokeStyle = 'rgba(70,30,120,0.5)';
    c.beginPath(); c.moveTo(-4.0, -31.0); c.quadraticCurveTo(-1.0, -30.0, 2.0, -31.2); c.moveTo(-3.0, -29.0); c.quadraticCurveTo(0, -28.2, 2.6, -29.2); c.stroke();
    spec(c, -7.6, -28.4, 2.6, 1.1, -0.7, 0.95); spec(c, -4.6, -31.0, 0.6, 0.5, 0, 0.95);
    // face: hard-candy spectacles
    candyEyes(c, [[4.6, -25.2, 1.1, 1.3], [10.4, -25.0, 1.0, 1.25]], 0, true);
    for (const [x, y, r] of [[4.2, -25.4, 2.4], [10.0, -25.2, 2.2]]) {
      c.fillStyle = 'rgba(200,240,255,0.25)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.strokeStyle = '#2a0f22'; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
      c.strokeStyle = '#ffd23a'; c.lineWidth = 0.7; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
      spec(c, x - r * 0.4, y - r * 0.45, r * 0.35, r * 0.18, -0.6, 0.9);
    }
    c.strokeStyle = '#2a0f22'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(6.6, -25.6); c.quadraticCurveTo(7.1, -26.3, 7.8, -25.6); c.stroke();
    c.lineWidth = 1.2; c.beginPath(); c.moveTo(1.6, -29.0); c.lineTo(5.6, -28.2); c.moveTo(8.8, -28.1); c.lineTo(12.4, -28.8); c.stroke();
    c.strokeStyle = '#6a1f45'; c.lineWidth = 0.85; c.beginPath(); c.moveTo(6.0, -21.6); c.quadraticCurveTo(7.4, -22.6, 8.8, -21.4); c.stroke();
    // strawberry-frosting shawl with sprinkles
    const shawl = (k) => {
      k.moveTo(-15.4, -19.6); k.quadraticCurveTo(0, -15.0, 15.2, -20.2);
      k.lineTo(15.6, -14.6); k.quadraticCurveTo(10.0, -10.6, 3.0, -10.2);
      k.lineTo(-9.6, -5.6); k.quadraticCurveTo(-13.4, -9.4, -15.6, -13.6); k.closePath();
    };
    gloss(c, shawl, -2, -15, 15, '#ffe0ee', '#ff7ab0', '#c03a78');
    clipDo(c, shawl, (k) => {
      const r = U.rng(5);
      for (let i = 0; i < 26; i++) sprinkle(k, r.range(-15, 15), r.range(-19, -6), r.range(0, PI), SPRINK_COL[i % SPRINK_COL.length], 0.85);
      k.strokeStyle = 'rgba(255,255,255,0.7)'; k.lineWidth = 0.9;
      k.beginPath(); k.moveTo(-15.4, -18.8); k.quadraticCurveTo(0, -14.2, 15.2, -19.4); k.stroke();
    });
    // frosting scallops along the lower edge
    c.fillStyle = '#ffd1e6';
    c.beginPath(); for (let i = 0; i < 6; i++) { const t = i / 5, x = -9.4 + t * 12.0, y = -5.8 - t * 4.2; c.moveTo(x + 1.1, y); c.arc(x, y, 1.1, 0, TAU); } c.fill();
    spec(c, -10.2, -16.6, 2.0, 0.7, 0.3, 0.8);
    gloss(c, E(11.2, -17.4, 1.9, 1.7), 11.2, -17.4, 1.9, '#ffffff', '#ffd23a', '#d68a0a');
    // candy cane + front arm
    const cane = (k) => { k.moveTo(18.6, -0.4); k.lineTo(17.6, -17.0); k.arc(15.6, -17.4, 2.0, 0.1, PI, true); k.lineTo(13.6, -15.8); };
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.7; c.beginPath(); cane(c); c.stroke();
    c.setLineDash([1.1, 1.3]); c.strokeStyle = '#ff2f55'; c.beginPath(); cane(c); c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(18.1, -1.0); c.lineTo(17.2, -14.4); c.stroke();
    c.restore();
    marshmallow(c, CAP(12.0, -16.2, 15.6, -14.2 - st * 0.4, 2.0), 13.6, -15.4, 2.4);
    marshmallow(c, E(16.6, -14.4 - st * 0.4, 1.9, 1.8), 16.6, -14.4, 2.0);
  }

  /* ---------------------------------------------------------- small sprites */
  function globParts(c) {
    const p = (k) => { k.moveTo(-6.4, 0); k.bezierCurveTo(-4.0, -1.4, -1.6, -3.4, 1.0, -3.4); k.bezierCurveTo(3.4, -3.4, 4.6, -1.8, 4.6, 0); k.bezierCurveTo(4.6, 1.8, 3.4, 3.4, 1.0, 3.4); k.bezierCurveTo(-1.6, 3.4, -4.0, 1.4, -6.4, 0); k.closePath(); };
    gloss(c, p, 1, 0, 4.5, TOX[0], TOX[1], TOX[2]);
    jelly(c, p, 1, 0, 3.6, 'rgba(40,120,10,0.45)', 'rgba(250,255,200,0.7)');
    spec(c, 0.4, -1.9, 1.6, 0.6, -0.1, 0.95); spec(c, 3.0, -1.2, 0.5, 0.4, 0, 0.95);
  }
  function dropParts(c) { const p = E(0, 0, 1.3, 1.3); gloss(c, p, 0, 0, 1.4, TOX[0], TOX[1], TOX[2]); spec(c, -0.35, -0.4, 0.4, 0.3, 0, 0.95); }
  function sprayParts(c) {
    const D = [[2.5, 0, 1.5], [5.6, -2.2, 1.1], [5.2, 2.4, 1.0], [8.4, -0.4, 0.9], [8.0, -3.8, 0.6], [7.6, 3.6, 0.65]];
    for (const d of D) { gloss(c, E(d[0], d[1], d[2], d[2] * 0.9), d[0], d[1], d[2], TOX[0], TOX[1], TOX[2]); spec(c, d[0] - d[2] * 0.3, d[1] - d[2] * 0.35, d[2] * 0.3, d[2] * 0.2, 0, 0.95); }
  }
  function starCandy(c) {
    const p = (k) => roundPoly(k, starPts(5, 2.8, 1.3, 0, 0.2, -PI / 2), 0.35);
    gloss(c, p, 0, 0, 3, '#fff8b0', '#ffd23a', '#d68a0a');
    spec(c, -0.7, -0.9, 0.6, 0.3, -0.6, 0.95);
  }


  /* ================================================================ icons */
  function candyPumpkin(c, cx, cy, rx, ry, rot, face) {
    c.save(); c.translate(cx, cy); c.rotate(rot || 0);
    const st = CAP(0, -ry + 1, 1.2, -ry - 3.2, 1.6);
    gloss(c, st, 0.6, -ry - 1, 2.5, '#c8f59a', '#62c043', '#2f7a2a');
    clipDo(c, st, (k) => stripes(k, -3, -ry - 5, 4, -ry + 2, 0.7, 1.1, 'rgba(255,255,255,0.55)', 0.6));
    const hp = (k) => pumpkinPath(k, 0, 0, rx, ry);
    gloss(c, hp, 0, 0, rx, '#ffd08a', '#ff8d1e', '#d24e0b');
    clipDo(c, hp, (k) => {
      k.fillStyle = rg(k, 2, 2, 0, 2, 2, rx, [[0, 'rgba(255,214,110,0.5)'], [1, 'rgba(255,214,110,0)']]); k.fillRect(-rx, -ry, rx * 2, ry * 2);
      k.lineWidth = 1.1; k.strokeStyle = 'rgba(196,72,8,0.55)';
      for (const s of [-0.7, -0.3, 0.3, 0.7]) { k.beginPath(); k.moveTo(s * rx * 0.2, -ry * 0.9); k.quadraticCurveTo(s * rx * 1.2, 0, s * rx * 0.2, ry * 0.94); k.stroke(); }
    });
    rim(c, hp, -rx, -ry, rx, ry, 'rgba(255,236,150,0.9)', rx * 0.2);
    if (face) {
      const f = rx / 16;
      caramelHole(c, (k) => roundPoly(k, [[-6.5 * f, -8 * f], [-10.5 * f, -1 * f], [-3 * f, -1 * f]], 1.0 * f), -6.5 * f, -3 * f, 5 * f);
      caramelHole(c, (k) => roundPoly(k, [[6.5 * f, -8 * f], [3 * f, -1 * f], [10.5 * f, -1 * f]], 1.0 * f), 6.5 * f, -3 * f, 5 * f);
      caramelHole(c, (k) => { k.moveTo(-11 * f, 2.5 * f); k.lineTo(-8 * f, 4.5 * f); k.lineTo(-5 * f, 3 * f); k.lineTo(-2 * f, 5 * f); k.lineTo(1 * f, 3 * f); k.lineTo(4 * f, 5 * f); k.lineTo(7 * f, 3 * f); k.lineTo(11 * f, 2.5 * f); k.quadraticCurveTo(0, 14 * f, -11 * f, 2.5 * f); k.closePath(); }, 0, 6 * f, 10 * f);
    }
    spec(c, -rx * 0.42, -ry * 0.48, rx * 0.2, ry * 0.11, -0.6, 0.95);
    spec(c, -rx * 0.2, -ry * 0.72, rx * 0.05, rx * 0.05, 0, 0.95);
    c.restore();
  }
  const sparkleAt = (c, x, y, s, col) => { c.save(); c.translate(x, y); c.scale(s, s); sparkleParts(c, col || 'rgba(255,220,80,0.6)'); c.restore(); };
  const ICONS = {
    leech(c) {
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.globalAlpha = 0.95;
      c.beginPath(); c.moveTo(14, 16); c.bezierCurveTo(10, 12, 18, 9, 14, 4); c.moveTo(24, 16); c.bezierCurveTo(20, 12, 28, 9, 24, 4); c.stroke();
      c.globalAlpha = 1;
      const bowl = (k) => { k.moveTo(4, 22); k.lineTo(44, 22); k.bezierCurveTo(44, 37, 37, 44, 24, 44); k.bezierCurveTo(11, 44, 4, 37, 4, 22); k.closePath(); };
      gloss(c, bowl, 24, 30, 20, '#b07850', '#7a4426', '#3e1c0e');
      clipDo(c, bowl, (k) => {
        k.lineWidth = 1.4; k.strokeStyle = '#fff3e2';
        k.beginPath(); for (let i = 0; i <= 14; i++) { const x = 4 + i * 2.9, y = i & 1 ? 33 : 30; if (!i) k.moveTo(x, y); else k.lineTo(x, y); } k.stroke();
      });
      spec(c, 10, 30, 1.4, 3.6, 0.2, 0.6);
      const soup = E(24, 22, 20, 4.6);
      c.beginPath(); soup(c); c.fillStyle = rg(c, 24, 21, 1, 24, 22, 20, [[0, '#ffc070'], [1, '#e8641a']]); c.fill();
      c.strokeStyle = '#fff6ea'; c.lineWidth = 1.3; c.beginPath(); c.arc(22, 22, 3.4, 0.3, PI * 1.6); c.stroke();
      for (const [x, y, col] of [[12, 21.5, '#9443d8'], [31, 23, '#55cc48'], [17, 23.4, '#fff1f8']]) gloss(c, E(x, y, 1.7, 1.0), x, y, 1.7, '#ffffff', col, col);
      const h = (k) => heartPath(k, 36.5, 12.5, 1.15);
      gloss(c, h, 36.5, 11, 10, '#ffb3c0', '#ff2f55', '#a0082a');
      jelly(c, h, 36.5, 11, 8, 'rgba(150,0,30,0.4)', 'rgba(255,170,190,0.6)');
      spec(c, 33.2, 8.8, 2.0, 1.0, -0.7, 0.95);
    },
    thorns(c) {
      // candy-corn thorn ring around a gummy turnip shell
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU - PI / 2;
        c.save(); c.translate(24 + Math.cos(a) * 15.5, 25 + Math.sin(a) * 15.5); c.rotate(a + PI / 2);
        const p = (k) => { k.moveTo(0, -7.2); k.quadraticCurveTo(3.4, 0.6, 3.2, 1.6); k.quadraticCurveTo(0, 2.8, -3.2, 1.6); k.quadraticCurveTo(-3.4, 0.6, 0, -7.2); k.closePath(); };
        c.beginPath(); p(c); c.fillStyle = '#fff6e0'; c.fill();
        clipDo(c, p, (k) => { k.fillStyle = '#ff8a1a'; k.fillRect(-4, -3.2, 8, 3.2); k.fillStyle = '#ffd23a'; k.fillRect(-4, 0, 8, 3); k.fillStyle = lg(k, -3, 0, 3, 0, [[0, 'rgba(255,255,255,0.45)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(120,40,0,0.25)']]); k.fillRect(-4, -8, 8, 11); });
        c.restore();
      }
      const ball = E(24, 25, 14, 14);
      twoLayer(c, ball, 27, 1.4, 0.55, rg(c, 18, 17, 0.5, 24, 22, 15, [[0, '#d9a2ff'], [0.5, '#9443d8'], [1, '#56168f']]),
        rg(c, 20, 32, 1, 24, 32, 14, [[0, '#ffffff'], [0.6, '#fff1f8'], [1, '#e9c9dc']]), 8, 40);
      jelly(c, ball, 24, 25, 14, 'rgba(80,10,140,0.5)', 'rgba(255,170,255,0.5)');
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(13, 21); c.quadraticCurveTo(24, 15, 35, 21); c.moveTo(12, 31); c.quadraticCurveTo(24, 36.5, 36, 31); c.stroke();
      spec(c, 17.5, 18, 3.4, 1.5, -0.7, 0.95); spec(c, 21.5, 14.5, 1.0, 0.9, 0, 0.95);
    },
    dashup(c) {
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.globalAlpha = 0.95;
      c.beginPath(); c.moveTo(2, 18); c.lineTo(11, 18); c.moveTo(1, 26); c.lineTo(9, 26); c.moveTo(3, 34); c.lineTo(11, 34); c.stroke();
      c.globalAlpha = 1;
      const puff = (k) => { E(10.5, 41, 4.2, 3.3)(k); E(15.5, 42, 3.2, 2.6)(k); E(6.5, 42.5, 2.6, 2.1)(k); };
      marshmallow(c, puff, 11, 41, 5);
      const ring = (k) => { k.moveTo(39.5, 9); k.quadraticCurveTo(50, 25, 39.5, 42); k.lineTo(36.6, 39.4); k.quadraticCurveTo(44.4, 25, 36.6, 11.6); k.closePath(); };
      gloss(c, ring, 41, 25, 12, '#e6fbff', '#8fe3f2', '#3a9ed0');
      candyPumpkin(c, 24, 27, 13.5, 12, 0.55, true);
    },
    range(c) {
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.6; c.setLineDash([3.2, 4.2]);
      c.beginPath(); c.moveTo(4, 42); c.quadraticCurveTo(12, 4, 27, 13); c.stroke();
      c.beginPath(); c.moveTo(34, 21); c.quadraticCurveTo(36, 26, 36, 32); c.stroke();
      c.setLineDash([]);
      c.save(); c.translate(35.5, 39.5); c.scale(1, 0.55); swirlDisc(c, 0, 0, 9.5, ['#ffffff', '#ff2f55']); c.restore();
      c.save(); c.translate(30.5, 16.5); c.rotate(0.75); c.scale(2.9, 2.9); seedParts(c); c.restore();
      sparkleAt(c, 41, 9, 1.4);
      sparkleAt(c, 16, 6, 0.9, 'rgba(255,120,180,0.6)');
    },
  };


  /* ================================================================== init */
  function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssH = window.__forceH || window.innerHeight || 900;
    const S = (cssH * dpr) / 360;
    K = Math.max(3, Math.min(6, Math.round(S * 1.25)));
    const s = {};
    s.sp = [0, 1, 2, 3].map((f) => set4([-12, -30, 17, 2], (c) => spitterParts(c, f, false)));
    s.spAim = set4([-12, -30, 17, 2], (c) => spitterParts(c, 0, true));
    s.bo = [0, 1, 2, 3].map((f) => set4([-12, -27, 10, 2], (c) => bomberParts(c, f), null, '#ff2a40'));
    s.ch = [0, 1, 2, 3].map((f) => set4([-20, -31, 21, 2], (c) => chargerParts(c, 'walk', f), { ol: 0.55 }));
    s.chTele = [0, 1].map((f) => set4([-20, -31, 21, 2], (c) => chargerParts(c, 'tele', f), { ol: 0.55 }));
    s.chDash = set4([-20, -31, 21, 2], (c) => chargerParts(c, 'dash', 0), { ol: 0.55 });
    s.chDizzy = [0, 2].map((f) => set4([-20, -31, 21, 2], (c) => chargerParts(c, 'dizzy', f), { ol: 0.55 }));
    s.mo = [0, 1, 2, 3].map((f) => set4([-18, -44, 21, 2], (c) => motherParts(c, f), { ol: 0.55 }));
    s.sprout = [0, 1, 2, 3].map((f) => set4([-7, -18, 9, 1], (c) => sproutParts(c, f), { ol: 0.45 }));
    s.glob = build([-7, -4, 5.5, 4], globParts, { ol: 0.6 });
    s.drop = build([-1.5, -1.5, 1.5, 1.5], dropParts, { ol: 0.4 });
    s.spray = build([0, -5, 10, 5], sprayParts, { ol: 0.4 });
    s.star = build([-3, -3, 3, 3], starCandy, { ol: 0.35 });
    s.sparkle = plain([-4, -4, 4, 4], (c) => sparkleParts(c, 'rgba(255,200,60,0.7)'));
    s.sparkleP = plain([-4, -4, 4, 4], (c) => sparkleParts(c, 'rgba(255,120,190,0.7)'));
    s.gGreen = glowSpr(12, '190,255,80', 0.85);
    s.gRed = glowSpr(16, '255,60,90', 0.8);
    s.gGold = glowSpr(12, '255,200,90', 0.85);
    s.gPink = glowSpr(24, '255,150,210', 0.7);
    s.shadow = plain([-4, -1.6, 4, 1.6], (c) => { c.fillStyle = rg(c, 0, 0, 0, 0, 0, 4, [[0, 'rgba(45,12,22,0.42)'], [0.55, 'rgba(45,12,22,0.3)'], [1, 'rgba(45,12,22,0)']]); c.save(); c.scale(1, 0.4); c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill(); c.restore(); });
    s.streak = plain([-14, -3.4, 0, 3.4], (c) => {
      c.strokeStyle = lg(c, -1, 0, -13, 0, [[0, 'rgba(255,255,255,0.95)'], [1, 'rgba(255,255,255,0)']]); c.lineCap = 'round';
      c.lineWidth = 1.4; c.beginPath(); c.moveTo(-1, 0); c.lineTo(-13, 0); c.stroke();
      c.strokeStyle = lg(c, -1, 0, -10, 0, [[0, 'rgba(255,140,190,0.9)'], [1, 'rgba(255,140,190,0)']]);
      c.lineWidth = 0.7; c.beginPath(); c.moveTo(-2, -2.4); c.lineTo(-10, -2.4); c.moveTo(-2, 2.4); c.lineTo(-9, 2.4); c.stroke();
    });
    SPR = s;
  }

  /* ================================================================= register */
  const scl = (e) => 0.94 + e.seed * 0.12;
  Cn.art('candy', {
    init() { init(); },
    enemies: {
      spitter(ctx, e, view) {
        const V = tf(view);
        const ph = e.anim * 0.85 + e.seed, f = Math.floor(ph * 4) & 3;
        const sn = Math.sin(ph * TAU), up = Math.abs(sn);
        let x = e.x, y = e.y - up * 1.2, rot = sn * 0.09;
        let sx = 1 + (1 - up) * 0.07, sy = 1 - (1 - up) * 0.08 + up * 0.04;
        let set = SPR.sp[f];
        const aim = e.mode === 'aim' && !e.dying, ch = aim ? e.charge || 0 : 0, spit = e.spit || 0;
        if (aim) {
          set = SPR.spAim;
          const sw = 1 + 0.13 * ch;
          y = e.y; rot = Math.sin(view.rt * 47 + e.seed * 9) * 0.035 * ch;
          x += Math.sin(view.rt * 61 + e.seed * 5) * 0.55 * ch;
          sx = sw * (1 + 0.05 * Math.sin(view.rt * 30) * ch); sy = sw * (1 - 0.04 * ch);
        } else if (spit > 0) {
          set = SPR.sp[0];
          y = e.y; rot = -e.facing * 0.12 * spit;
          sx = 1 - 0.14 * spit; sy = 1 + 0.12 * spit;
          x -= e.facing * 2.2 * spit;
        }
        const k = scl(e);
        drawBody(ctx, V, e, set, x, y, sx * k, sy * k, rot, () => {
          if (aim) { lp(13.4, -10.3, PT); glowAt(ctx, SPR.gGreen, PT[0], PT[1], 0.5 + ch * 0.6, 0.35 + ch * 0.75); }
          else if (spit > 0) {
            lp(14.0, -10.3, PT);
            const q = 1 - spit, d = e.facing < 0 ? -1 : 1;
            ctx.globalAlpha = Math.min(1, spit * 1.6);
            blitRot(ctx, V, SPR.spray, PT[0] + d * q * 3, PT[1], d * (0.8 + q * 0.6), 0.8 + q * 0.6, 0);
            ctx.globalAlpha = 1;
            glowAt(ctx, SPR.gGreen, PT[0], PT[1], 0.7, spit * 0.8);
          }
        });
      },
      bomber(ctx, e, view) {
        const V = tf(view);
        const ph = e.anim * 1.25 + e.seed, f = Math.floor(ph * 4) & 3;
        const sn = Math.sin(ph * TAU * 2), up = Math.abs(sn);
        let x = e.x, y = e.y - up * 0.9, rot = Math.sin(ph * TAU) * 0.07;
        let sx = 1 + (1 - up) * 0.07, sy = 1 - (1 - up) * 0.07;
        const armed = e.armed && !e.dying, fu = armed ? e.fuse || 0 : 0;
        let blink = 0;
        if (armed) {
          const sw = 1 + 0.16 * fu + 0.05 * Math.sin(view.rt * 40) * fu;
          sx *= sw; sy *= sw;
          x += Math.sin(view.rt * 70 + e.seed * 7) * 0.5 * fu;
          rot = Math.sin(view.rt * 55) * 0.05 * (0.3 + fu);
          blink = ((fu * (3 + 11 * fu)) % 1) < 0.5 ? 1 : 2;
        }
        const k = scl(e) * 0.95, set = SPR.bo[f];
        drawBody(ctx, V, e, set, x, y, sx * k, sy * k, rot, (bx, by) => {
          if (armed) {
            const left = e.facing < 0;
            if (blink === 1) { ctx.globalAlpha = 0.7; put(ctx, V, left ? set.tl : set.t, POSE.x, POSE.y, bx, by, POSE.rot); }
            else { ctx.globalAlpha = 0.5; put(ctx, V, left ? set.fl : set.f, POSE.x, POSE.y, bx, by, POSE.rot); }
            ctx.globalAlpha = 1;
            lp(0, -9, PT);
            glowAt(ctx, SPR.gRed, PT[0], PT[1], 0.9 + fu * 0.7, (blink === 1 ? 0.55 : 0.25) + fu * 0.3);
          }
          lp(FUSE_TIP[0], FUSE_TIP[1], PT);
          const fl = 0.75 + 0.25 * Math.sin(view.rt * 31 + e.seed * 20);
          const ss = (armed ? 0.75 + fu * 1.1 : 0.55) * fl;
          glowAt(ctx, SPR.gGold, PT[0], PT[1], armed ? 0.6 + fu * 0.8 : 0.4, 0.8);
          blitRot(ctx, V, SPR.sparkle, PT[0], PT[1], ss, ss, view.rt * 6 + e.seed * 9);
        });
      },
      charger(ctx, e, view) {
        const V = tf(view);
        const mode = e.dying ? 'chase' : e.mode;
        const ph = e.anim * 0.7 + e.seed, f = Math.floor(ph * 4) & 3;
        const sn = Math.sin(ph * TAU), up = Math.abs(sn);
        let x = e.x, y = e.y - up * 1.4, rot = sn * 0.05;
        let sx = 1 + (1 - up) * 0.06, sy = 1 - (1 - up) * 0.06;
        let set = SPR.ch[f];
        const fs = e.facing < 0 ? -1 : 1, t = e.modeT || 0;
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
          set = SPR.chDizzy[Math.floor(view.rt * 3) & 1];
          y = e.y; rot = Math.sin(view.rt * 8 + e.seed * 3) * 0.07;
          sx = 1 + Math.sin(view.rt * 8) * 0.03; sy = 1 - Math.sin(view.rt * 8) * 0.03;
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
        drawBody(ctx, V, e, set, x, y, sx * k, sy * k, rot, () => {
          if (mode === 'tele') {
            lp(CH_EYE[0], CH_EYE[1], PT);
            const q = U.clamp(t / 0.72, 0, 1);
            glowAt(ctx, SPR.gRed, PT[0], PT[1], 0.35 + q * 0.3, 0.55 + 0.35 * Math.sin(view.rt * 30));
          } else if (mode === 'rest') {
            lp(CH_HEAD[0], CH_HEAD[1] - 3, PT);
            for (let i = 0; i < 3; i++) {
              const a = view.rt * 6 + (i / 3) * TAU, s2 = 0.85 + Math.sin(a) * 0.2;
              blitRot(ctx, V, SPR.star, PT[0] + Math.cos(a) * 7, PT[1] + Math.sin(a) * 2.4, s2, s2, a * 0.5);
            }
          }
        });
      },
      mother(ctx, e, view) {
        const V = tf(view);
        const ph = e.anim * 0.38 + e.seed, f = Math.floor(ph * 4) & 3;
        const sn = Math.sin(ph * TAU), up = Math.abs(sn), contact = Math.pow(1 - up, 3);
        const y = e.y - up * 1.4, rot = sn * 0.04;
        let sx = 1 + contact * 0.07, sy = 1 - contact * 0.07;
        const b = e.dying ? 0 : e.birth || 0;
        if (b > 0) { const w = Math.sin((1 - b) * PI * 3) * b; sx *= 1 + 0.16 * w; sy *= 1 - 0.14 * w; }
        const k = scl(e) * 0.93;
        if (b > 0.02) glowAt(ctx, SPR.gPink, e.x, e.y - 18, 0.9 + (1 - b) * 0.5, b * 0.75);
        drawBody(ctx, V, e, SPR.mo[f], e.x, y, sx * k, sy * k, rot, () => {
          if (b > 0.3) {
            lp(0.5, -40, PT);
            const q = (b - 0.3) / 0.7;
            for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + (1 - b) * 4; blitRot(ctx, V, i & 1 ? SPR.sparkle : SPR.sparkleP, PT[0] + Math.cos(a) * 9 * (1.4 - q), PT[1] + Math.sin(a) * 4 + 3, q * 1.1, q * 1.1, a); }
          }
        }, 0.45);
      },
      sprout(ctx, e, view) {
        const V = tf(view);
        const ph = e.anim * 1.3 + e.seed, f = Math.floor(ph * 4) & 3;
        const sn = Math.sin(ph * TAU), up = Math.abs(sn);
        const sx = 1 + (1 - up) * 0.08, sy = 1 - (1 - up) * 0.09 + up * 0.05;
        const k = scl(e);
        drawBody(ctx, V, e, SPR.sprout[f], e.x, e.y - up * 1.2, sx * k, sy * k, sn * 0.12);
      },
    },
    shot(ctx, s, view) {
      const V = tf(view);
      const x = s.x, y = s.y - (s.z || 11), a = s.angle || 0, age = s.age || 0;
      const w = Math.sin(age * 26 + s.seed * 9);
      glowAt(ctx, SPR.gGreen, x, y, 0.9, 0.6);
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let i = 2; i >= 1; i--) {
        const d = 5.5 + i * 3.6, perp = Math.sin(age * 20 + i * 2 + s.seed * 7) * 0.8;
        const sc = 1 - i * 0.28;
        blit(ctx, SPR.drop, x - ca * d - sa * perp, y - sa * d + ca * perp, sc, sc);
      }
      blitRot(ctx, V, SPR.glob, x, y, 1 + w * 0.13, 1 - w * 0.11, a);
    },
    icons: (() => {
      const o = {};
      for (const id in ICONS) {
        o[id] = (ctx, size) => {
          const { c, ctx: k } = U.canvas(size, size);
          k.scale(size / 48, size / 48);
          k.lineJoin = 'round'; k.lineCap = 'round';
          k.translate(24, 24); k.scale(0.9, 0.9); k.translate(-24, -24);
          ICONS[id](k);
          ctx.drawImage(addOutline(c, OUT, Math.max(1.5, size / 26)), 0, 0);
        };
      }
      return o;
    })(),
  });
})();
