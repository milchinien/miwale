/* Native art for the new enemies / upgrades in the 'Shadow Theatre' world – see js/content/ART_API.md.
   Same technique as js/styles/shadow.js: deep indigo-black cut-paper silhouettes built from tapered limbs, spiral
   curls and lens leaves, pre-rendered at K px per world unit; the only colour on them is emissive (glowing eyes,
   mouths, fuses) with baked bloom; holes cut into the paper let the coloured stage light shine through.
   Hits flash a soft light rim, deaths tear the puppet into paper scraps with ember-lit edges. */
(function () {
  'use strict';
  const U = window.U, C = window.Content;
  const TAU = Math.PI * 2;
  const INK = '#0b0510';
  const EYE_G = '#d8ff62';
  let K = 3;
  const R = (a, b, rng) => a + (b - a) * rng.next();

  /* ---------- cut-paper toolkit (copied from the style) ---------- */
  function spline(pts, sub) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      for (let k = 0; k < sub; k++) {
        const t = k / sub, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function limb(c, pts, w0, w1, sub) {
    const s = pts.length > 2 ? spline(pts, sub || 5) : pts;
    const n = s.length;
    if (n < 2) return;
    const L = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = s[Math.max(0, i - 1)], b = s[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      const w = (w0 + (w1 - w0) * (i / (n - 1))) * 0.5;
      L.push([s[i][0] - dy * w, s[i][1] + dx * w]);
      Rt.push([s[i][0] + dy * w, s[i][1] - dx * w]);
    }
    c.beginPath();
    c.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) c.lineTo(Rt[i][0], Rt[i][1]);
    c.closePath();
    c.fill();
    c.beginPath(); c.arc(s[0][0], s[0][1], w0 * 0.5, 0, TAU); c.fill();
    if (w1 > 0.3) { c.beginPath(); c.arc(s[n - 1][0], s[n - 1][1], w1 * 0.5, 0, TAU); c.fill(); }
  }
  function curlPts(x, y, a, len, turn, n) {
    n = n || 12;
    const p = [[x, y]];
    let h = a;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      h += (turn * (0.25 + 1.75 * t)) / n;
      const s = (len / n) * (1.35 - 0.85 * t);
      x += Math.cos(h) * s; y += Math.sin(h) * s;
      p.push([x, y]);
    }
    return p;
  }
  function curl(c, x, y, a, len, turn, w0, w1) { limb(c, curlPts(x, y, a, len, turn), w0, w1 === undefined ? 0.1 : w1, 3); }
  function leaf(c, x, y, a, L, W, bend) {
    bend = bend || 0;
    const ca = Math.cos(a), sa = Math.sin(a);
    const tx = x + ca * L, ty = y + sa * L, mx = x + ca * L * 0.45, my = y + sa * L * 0.45, nx = -sa, ny = ca;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(mx + nx * (W * 2 + bend), my + ny * (W * 2 + bend), tx, ty);
    c.quadraticCurveTo(mx - nx * (W * 2 - bend), my - ny * (W * 2 - bend), x, y);
    c.fill();
  }
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fill(); }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fill(); }
  function cut(c, fn) { c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.strokeStyle = '#000'; fn(); c.restore(); }
  function star(c, x, y, n, r0, r1, rot) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * TAU - Math.PI / 2, r = i & 1 ? r1 : r0;
      if (i) c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.closePath(); c.fill();
  }
  function pumpkinShape(c, cx, cy, rx, ry) {
    ell(c, cx - rx * 0.52, cy, rx * 0.5, ry * 0.92);
    ell(c, cx + rx * 0.52, cy, rx * 0.5, ry * 0.92);
    ell(c, cx - rx * 0.22, cy - ry * 0.02, rx * 0.52, ry);
    ell(c, cx + rx * 0.22, cy - ry * 0.02, rx * 0.52, ry);
  }
  function glowFill(c, pathFn, cx, cy, r, stops, bloom, bloomCol) {
    c.save();
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
    stops.forEach((s) => g.addColorStop(s[0], s[1]));
    c.fillStyle = g;
    c.shadowColor = bloomCol;
    c.shadowBlur = bloom * K;
    c.beginPath(); pathFn(c); c.fill();
    c.shadowBlur = 0;
    c.beginPath(); pathFn(c); c.fill();
    c.restore();
  }
  const FACE_STOPS = [[0, '#fffbe2'], [0.35, '#ffd65e'], [0.75, '#ff9a22'], [1, '#ff6a10']];
  const GREEN_STOPS = [[0, '#ffffe0'], [0.4, EYE_G], [1, '#7fe02a']];
  const TOX_STOPS = [[0, '#fbffe8'], [0.35, '#d8ff62'], [0.75, '#8ee82a'], [1, '#3cb81a']];
  const RED_STOPS = [[0, '#fff2e0'], [0.35, '#ffb070'], [0.75, '#ff4a2a'], [1, '#d01a20']];
  const GOLD_STOPS = [[0, '#fffbe8'], [0.4, '#ffe08a'], [1, '#ffaa30']];

  /* ---------- sprite pipeline (copied from the style) ---------- */
  function mk(x0, y0, x1, y1, draw, opt) {
    opt = opt || {};
    const pad = opt.pad === undefined ? 2.5 : opt.pad;
    const ax = Math.round((pad - x0) * K), ay = Math.round((pad - y0) * K);
    const w = Math.ceil((x1 - x0 + pad * 2) * K), h = Math.ceil((y1 - y0 + pad * 2) * K);
    const { c, ctx } = U.canvas(w, h);
    ctx.setTransform(K, 0, 0, K, ax, ay);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = INK; ctx.strokeStyle = INK;
    const out = { c, ax, ay };
    out.meta = draw(ctx) || null;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return out;
  }
  function flipSpr(s) { return { c: U.flipX(s.c), ax: s.c.width - s.ax, ay: s.ay, meta: s.meta }; }
  function hasFilter() { const t = U.canvas(2, 2).ctx; t.filter = 'blur(1px)'; return t.filter === 'blur(1px)'; }
  let FILTER = true;
  function rimSpr(s, color, rad) {
    const w = s.c.width, h = s.c.height;
    const t = U.tint(s.c, color);
    const tmp = U.canvas(w, h);
    const d = Math.max(1, rad * K * 0.55);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; tmp.ctx.drawImage(t, Math.cos(a) * d, Math.sin(a) * d); }
    const out = U.canvas(w, h);
    if (FILTER) { out.ctx.filter = `blur(${(rad * K * 0.55).toFixed(1)}px)`; out.ctx.drawImage(tmp.c, 0, 0); out.ctx.filter = 'none'; out.ctx.globalAlpha = 0.6; out.ctx.drawImage(tmp.c, 0, 0); }
    else out.ctx.drawImage(tmp.c, 0, 0);
    return { c: out.c, ax: s.ax, ay: s.ay };
  }
  function glowSpr(r, stops) {
    const px = Math.ceil(r * K * 2);
    const { c, ctx } = U.canvas(px, px);
    const g = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    stops.forEach((s) => g.addColorStop(s[0], s[1]));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, px, px);
    return { c, ax: px / 2, ay: px / 2 };
  }
  function tornShards(spr, n, seed) {
    const rng = U.rng(seed);
    const w = spr.c.width, h = spr.c.height;
    const cx = spr.ax, cy = spr.ay * 0.55;
    const Rr = Math.hypot(w, h);
    const a0 = rng.next() * TAU;
    const cuts = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU + R(-0.25, 0.25, rng);
      const pts = [[cx, cy]];
      for (let k = 1; k <= 7; k++) {
        const r = (k / 7) * Rr * 0.55;
        const j = (k & 1 ? 1 : -1) * R(0.08, 0.3, rng) * (k < 7 ? 1 : 0);
        pts.push([cx + Math.cos(a + j) * r, cy + Math.sin(a + j) * r]);
      }
      pts.push([cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr]);
      cuts.push({ a, pts });
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const A = cuts[i], B = cuts[(i + 1) % n];
      let b = B.a;
      if (b < A.a) b += TAU;
      const pg = A.pts.slice();
      for (let k = 1; k < 6; k++) { const a = A.a + ((b - A.a) * k) / 6; pg.push([cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr]); }
      for (let k = B.pts.length - 1; k >= 1; k--) pg.push(B.pts[k]);
      const { c, ctx } = U.canvas(w, h);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(pg[0][0], pg[0][1]); for (const p of pg) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.clip();
      ctx.drawImage(spr.c, 0, 0);
      ctx.restore();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.strokeStyle = '#ff9a3a';
      ctx.lineWidth = K * 0.9;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(A.pts[0][0], A.pts[0][1]); for (const p of A.pts) ctx.lineTo(p[0], p[1]);
      ctx.moveTo(B.pts[0][0], B.pts[0][1]); for (const p of B.pts) ctx.lineTo(p[0], p[1]);
      ctx.stroke();
      const mid = (A.a + b) / 2;
      out.push({ c, ax: cx, ay: cy, dx: Math.cos(mid), dy: Math.sin(mid), off: (spr.ay - cy) / K });
    }
    return out;
  }
  let BX = 0, BY = 0, BS = 1;
  function base(view) { BS = view.S; BX = view.W / 2 - view.x * BS; BY = view.H / 2 - view.y * BS; }
  function blit(ctx, s, x, y) {
    const k = 1 / K;
    ctx.drawImage(s.c, Math.round((x - s.ax * k) * BS) / BS, Math.round((y - s.ay * k) * BS) / BS, s.c.width * k, s.c.height * k);
  }
  function blitS(ctx, s, x, y, sx, sy) {
    const k = 1 / K;
    ctx.drawImage(s.c, x - s.ax * k * sx, y - s.ay * k * sy, s.c.width * k * sx, s.c.height * k * sy);
  }
  function blitRot(ctx, s, x, y, ang, sc) {
    const k = (sc * BS) / K, c = Math.cos(ang) * k, sn = Math.sin(ang) * k;
    ctx.setTransform(c, sn, -sn, c, BX + x * BS, BY + y * BS);
    ctx.drawImage(s.c, -s.ax, -s.ay);
    ctx.setTransform(BS, 0, 0, BS, BX, BY);
  }
  function blitRS(ctx, s, x, y, ang, sx, sy) {
    const k = BS / K, c = Math.cos(ang) * k, sn = Math.sin(ang) * k;
    ctx.setTransform(c * sx, sn * sx, -sn * sy, c * sy, BX + x * BS, BY + y * BS);
    ctx.drawImage(s.c, -s.ax, -s.ay);
    ctx.setTransform(BS, 0, 0, BS, BX, BY);
  }
  const add = (ctx, a) => { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; };
  const norm = (ctx) => { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; };

  /* =========================================================================
     Puppets (feet at 0,0, facing +x). Each returns meta points (world units) for runtime effects.
     ========================================================================= */
  function rootLegs(c, ph, by, ry, spread, len, fast) {
    const s = Math.sin(ph * TAU * (fast || 1));
    for (const side of [-1, 1]) {
      const sw = s * side;
      const hx = side * spread, hy = by + ry - 1.6;
      const ta = Math.PI / 2 - sw * 0.6;
      const kx = hx + Math.cos(ta) * len, ky = hy + Math.sin(ta) * len;
      const sa = ta + 0.2 + Math.max(0, Math.sin(ph * TAU * (fast || 1) + side * 1.3)) * 0.6;
      const fx = kx + Math.cos(sa) * len, fy = Math.min(0, ky + Math.sin(sa) * len);
      limb(c, [[hx, hy], [kx, ky], [fx, fy]], 1.5, 0.9);
      curl(c, fx, fy - 0.4, -0.15, 2.6, -5, 0.8, 0.1);
      limb(c, [[fx, fy - 0.3], [fx - 1.6, fy + 0.1]], 0.6, 0.1);
    }
  }
  function crown(c, tx, ty, stems, sway, Ls) {
    stems.forEach((d, i) => {
      const a = -Math.PI / 2 + d + sway;
      const L = Ls + (i & 1 ? 1.2 : 0);
      const pts = curlPts(tx, ty, a, L, (d < -0.3 ? -1 : 1) * 1.6, 6);
      limb(c, pts, 1.0, 0.45, 3);
      const e = pts[pts.length - 1], e2 = pts[pts.length - 2];
      const ea = Math.atan2(e[1] - e2[1], e[0] - e2[0]);
      leaf(c, e[0], e[1], ea, 4.2, 1.35, 0.3);
      leaf(c, pts[3][0], pts[3][1], ea - 1.0, 2.8, 0.9);
      leaf(c, pts[3][0], pts[3][1], ea + 1.0, 2.6, 0.85);
    });
  }

  function drawSpitter(c, ph, swell, recoil) {
    const s = Math.sin(ph * TAU), co = Math.cos(ph * TAU);
    const by = -12.4 - Math.abs(co) * 1.0 + recoil * 0.8;
    const rx = 7.4 + swell * 1.7 + recoil * 0.9, ry = 7.0 + swell * 1.0 - recoil * 0.9;
    const bx = -recoil * 1.2;
    rootLegs(c, ph, by, ry, 2.6, 3.2);
    limb(c, [[bx - 2, by + ry - 1.5], [bx - 4.6, by + ry + 0.6 + s * 0.4], [bx - 7.4, by + ry - 0.2], [bx - 8.6, by + ry - 2.4 - s * 0.5]], 2.2, 0.15);
    ell(c, bx, by, rx, ry);
    // swept-back leaf crown
    crown(c, bx - 0.8, by - ry + 0.2, [-1.25, -0.75, -0.2], s * 0.1 - recoil * 0.25, 6.6);
    // snout: a puckered tube with a flared lip
    const sy = by + 1.4, tipX = bx + rx + 4.8 + swell * 0.8 - recoil * 2.4, th = 4.4 + swell * 1.2;
    limb(c, [[bx + rx - 3, sy], [tipX - 1, sy - 0.2]], th, th * 0.92);
    ell(c, tipX, sy - 0.2, 1.5, th * 0.62);
    // cheeks
    if (swell > 0.2) ell(c, bx + rx * 0.45, by + ry * 0.35, 2 + swell * 1.6, 1.8 + swell * 1.3);
    // mottled skin: holes cut into the paper (the stage light shines through)
    cut(c, () => {
      const rng = U.rng(707);
      for (let i = 0; i < 7; i++) {
        const a = -2.6 + i * 0.42 + R(-0.1, 0.1, rng), rr = R(0.45, 0.8, rng);
        const x = bx + Math.cos(a) * rx * rr, y = by + Math.sin(a) * ry * rr * 0.9 - 0.6;
        if (x > bx + rx * 0.35) continue;
        circ(c, x, y, R(0.45, 0.85, rng));
      }
      // mouth opening (glow sits on top)
      ell(c, tipX + 0.25, sy - 0.2, 0.8, th * 0.4);
    });
    // glowing mouth + drool
    glowFill(c, (p) => { p.ellipse(tipX + 0.3, sy - 0.2, 0.75, th * 0.36, 0, 0, TAU); }, tipX, sy, th * 0.5, TOX_STOPS, 0.8 + swell, 'rgba(170,255,70,0.9)');
    if (!recoil) glowFill(c, (p) => { p.ellipse(tipX - 0.6, sy + th * 0.62 + 1 + Math.abs(s) * 0.8, 0.45, 0.8 + Math.abs(s) * 0.4, 0, 0, TAU); }, tipX, sy + th * 0.6 + 1.5, 1.5, TOX_STOPS, 0.6, 'rgba(170,255,70,0.8)');
    // angry eyes above the snout
    glowFill(c, (p) => {
      const ey = by - 2.4 - swell * 0.4, x0 = bx + 1;
      p.moveTo(x0 - 0.4, ey - 0.8); p.quadraticCurveTo(x0 + 1.0, ey - 0.5, x0 + 2.0, ey + 0.4); p.quadraticCurveTo(x0 + 0.6, ey + 1.1, x0 - 0.4, ey - 0.8); p.closePath();
      p.moveTo(x0 + 5.2, ey - 1.0); p.quadraticCurveTo(x0 + 4.0, ey - 0.5, x0 + 3.0, ey + 0.4); p.quadraticCurveTo(x0 + 4.4, ey + 1.0, x0 + 5.2, ey - 1.0); p.closePath();
    }, bx + 3.4, by - 2.4, 3.6, GREEN_STOPS, 1.2, 'rgba(170,255,70,0.95)');
    return { mouth: [tipX + 0.6, sy - 0.2] };
  }

  function drawBomber(c, ph, swell) {
    const s = Math.sin(ph * TAU * 2), co = Math.cos(ph * TAU * 2);
    const rx = 6.1 + swell * 0.9, ry = 5.8 + swell * 0.9;
    const by = -10.4 - Math.abs(co) * 0.8 - swell * 0.6;
    // scurrying spindly legs: three pairs
    for (let k = 0; k < 3; k++) {
      const side = k - 1, sw = Math.sin(ph * TAU * 2 + k * 2.1);
      const hx = side * 3.2, hy = by + ry - 1.4;
      const fx = hx + sw * 1.8 + side * 0.8, fy = Math.min(0, -Math.max(0, Math.cos(ph * TAU * 2 + k * 2.1)) * 1.6);
      limb(c, [[hx, hy], [hx + side * 1.4 + sw * 0.6, hy + 2.4], [fx, fy]], 1.0, 0.6);
      curl(c, fx, fy - 0.3, side < 0 ? Math.PI : 0, 1.6, side < 0 ? 4 : -4, 0.55, 0.1);
    }
    // little tail root
    limb(c, [[-1, by + ry - 0.8], [-2.6, by + ry + 1.6], [-4.4, by + ry + 1.0]], 1.4, 0.1);
    ell(c, 0, by, rx, ry);
    // beet leaves
    const tx = 0.3, ty = by - ry + 0.6;
    for (const [d, L] of [[-0.75, 4.2], [0.35, 3.6]]) {
      const pts = curlPts(tx, ty, -Math.PI / 2 + d + s * 0.08, L, d < 0 ? -1.4 : 1.4, 5);
      limb(c, pts, 0.8, 0.4, 3);
      const e = pts[pts.length - 1], e2 = pts[pts.length - 2];
      leaf(c, e[0], e[1], Math.atan2(e[1] - e2[1], e[0] - e2[0]), 3.6, 1.2, 0.3);
    }
    // the fuse: a curling cord out of the tuft
    const fpts = curlPts(tx + 0.4, ty + 0.4, -Math.PI / 2 + 0.25, 7, 2.2, 8);
    limb(c, fpts, 0.75, 0.45, 3);
    // beet rings cut into the paper + jagged grin
    cut(c, () => {
      c.lineWidth = 0.45;
      c.beginPath(); c.ellipse(0, by + ry * 0.35, rx * 0.72, ry * 0.42, 0, 0.25, Math.PI - 0.25); c.stroke();
      c.beginPath(); c.ellipse(0, by + ry * 0.2, rx * 0.9, ry * 0.68, 0, 0.55, Math.PI - 0.55); c.stroke();
      const mx = 2.2, my = by + 2.2;
      poly(c, [[mx - 2.2, my - 0.5], [mx - 1.4, my + 0.3], [mx - 0.7, my - 0.3], [mx, my + 0.4], [mx + 0.7, my - 0.3], [mx + 1.5, my + 0.3], [mx + 2.2, my - 0.6], [mx + 1.4, my + 1.3], [mx - 1.3, my + 1.3]]);
    });
    // mean glowing eyes
    glowFill(c, (p) => {
      const ey = by - 1.6;
      p.moveTo(-0.4, ey - 1.0); p.lineTo(2.0, ey + 0.2); p.lineTo(0.2, ey + 0.9); p.closePath();
      p.moveTo(5.4, ey - 1.0); p.lineTo(3.0, ey + 0.2); p.lineTo(4.8, ey + 0.9); p.closePath();
    }, 2.5, by - 1.4, 3.6, FACE_STOPS, 1.1, 'rgba(255,140,40,0.95)');
    const tip = fpts[fpts.length - 1];
    return { fuse: tip, fusePts: fpts };
  }

  function drawCharger(c, ph, pose) {
    const s = Math.sin(ph * TAU), co = Math.cos(ph * TAU);
    let ang = 0, st = 1, bob = -Math.abs(co) * 0.8, pvx = 0;
    if (pose === 'rear') { ang = -0.36; pvx = -5; bob = 0; }
    if (pose === 'scrape') { ang = -0.12; bob = 0; }
    if (pose === 'dash') { ang = 0.2; st = 1.12; bob = 0; }
    if (pose === 'stand') { ang = 0.06; bob = 0.6; }
    const hipY = -9 + bob;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const T = (lx, ly) => [pvx + (lx - pvx) * ca - ly * sa, hipY + (lx - pvx) * sa + ly * ca];
    // legs [local x, lift, forward]
    let legs;
    if (pose === 'trot') legs = [[-6, Math.max(0, s) * 2, s * 1.6], [5, Math.max(0, -s) * 2, -s * 1.6], [-3.5, Math.max(0, -s) * 2, -s * 1.6], [7, Math.max(0, s) * 2, s * 1.6]];
    else if (pose === 'rear') legs = [[-6, 0, -1], [5, 5, 3], [-3.5, 0, 1], [7, 7, 4]];
    else if (pose === 'scrape') legs = [[-6, 0, 0], [5, 0, 0], [-3.5, 0, 0], [7, 1.2, -4.5]];
    else if (pose === 'dash') legs = [[-6, 1, -4], [5, 1, 4], [-3.5, 2, -5], [7, 2, 5]];
    else legs = [[-6, 0, -1], [5, 0, 1], [-3.5, 0, 0], [7, 0, 0]];
    for (const [lx, lift, f] of legs) {
      const [tx, ty] = T(lx, 1);
      const fx = tx + f, fy = Math.min(-lift, ty + 8);
      limb(c, [[tx, ty], [tx + f * 0.4 + 0.3, (ty + fy) / 2], [fx, fy]], 2.2, 1.6);
      limb(c, [[fx - 1, fy], [fx + 1.4, fy]], 1.2, 0.9);
    }
    // root tail
    { const p0 = T(-9 * st, -2), p1 = T(-12 * st, 0.5), p2 = T(-14.5 * st, 0.2 + s * 0.4), p3 = T(-15.5 * st, -1.6); limb(c, [p0, p1, p2, p3], 3.2, 0.15); }
    // stout parsnip body
    {
      const [bx, by] = T(0, -4);
      c.save(); c.translate(bx, by); c.rotate(ang);
      c.beginPath();
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * TAU, lx = Math.cos(a), k = 0.72 + 0.28 * lx;
        const x = lx * 10 * st, y = Math.sin(a) * 7.6 * k;
        if (i) c.lineTo(x, y); else c.moveTo(x, y);
      }
      c.closePath(); c.fill();
      c.restore();
    }
    // leafy mane
    {
      const [lx, ly] = T(-1, -10.5);
      [[-1.05, 7], [-0.7, 8.4], [-1.4, 5.6], [-0.35, 5.4]].forEach(([d, L]) => {
        const pts = curlPts(lx, ly, -Math.PI / 2 + d + ang + s * 0.06, L, -1.4, 6);
        limb(c, pts, 0.9, 0.4, 3);
        const e = pts[pts.length - 1], e2 = pts[pts.length - 2];
        leaf(c, e[0], e[1], Math.atan2(e[1] - e2[1], e[0] - e2[0]), 3.6, 1.15, 0.3);
      });
    }
    // lowered head + muzzle
    const [hx, hy] = T(10.2 * st, -0.5);
    ell(c, hx, hy, 4.8, 4.9, ang);
    const [mx, my] = T(13.6 * st, 2.2);
    ell(c, mx, my, 2.9, 2.7, ang + 0.35);
    // growth rings cut into the parsnip
    cut(c, () => {
      c.lineWidth = 0.42;
      for (const ox of [-5.5, -2, 1.5]) {
        const [x, y] = T(ox, -4);
        c.beginPath(); c.ellipse(x, y, 1.6, 5.4 * (0.72 + 0.28 * ox / 10), ang, -1.1, 1.1); c.stroke();
      }
      const [nx, ny] = T(15.6 * st, 2.2);
      circ(c, nx, ny, 0.45);
    });
    // big curled ram horns: root at the head, sweeping back, over the top and curling forward – the coil sits
    // above the outline so the stage light shows through its centre
    const hornPts = (ox, oy, sc) => {
      const pts = [];
      for (let i = 0; i <= 26; i++) {
        const t = i / 26, th = Math.PI * 0.55 + t * TAU * 1.08, r = (5.8 - t * 3.9) * sc;
        pts.push(T(9.4 * st + ox + Math.cos(th) * r, -6.4 + oy + Math.sin(th) * r));
      }
      return pts;
    };
    limb(c, hornPts(-1.8, -0.9, 0.92), 2.4, 0.8, 2);
    const hp = hornPts(0, 0, 1);
    limb(c, hp, 3.3, 1.0, 2);
    cut(c, () => {
      c.lineWidth = 0.34;
      for (let i = 3; i < hp.length - 4; i += 2) {
        const a = Math.atan2(hp[i + 1][1] - hp[i][1], hp[i + 1][0] - hp[i][0]) + Math.PI / 2, w = 1.5 - i * 0.04;
        c.beginPath(); c.moveTo(hp[i][0] - Math.cos(a) * w * 0.2, hp[i][1] - Math.sin(a) * w * 0.2); c.lineTo(hp[i][0] + Math.cos(a) * w, hp[i][1] + Math.sin(a) * w); c.stroke();
      }
    });
    // eye (red ember), placed below the curl
    const [ex, ey] = T(12.6 * st, -0.6);
    glowFill(c, (p) => { p.moveTo(ex - 1.2, ey - 0.8); p.lineTo(ex + 1.3, ey + 0.1); p.lineTo(ex - 0.5, ey + 0.8); p.closePath(); }, ex, ey, 1.8, RED_STOPS, 0.9, 'rgba(255,60,30,0.9)');
    return { eye: [ex, ey], head: [hx, hy - 7] };
  }

  function drawMother(c, ph, sx, sy) {
    const s = Math.sin(ph * TAU), co = Math.cos(ph * TAU);
    const rx = 12.5 * sx, ry = 12 * sy;
    const by = -ry - 4.2 - Math.abs(co) * 0.7;
    // stubby legs
    for (const side of [-1, 1]) {
      const lift = Math.max(0, s * side) * 1.6;
      const hx = side * 4.5, hy = by + ry - 2;
      limb(c, [[hx, hy], [hx + 0.6, hy + 3], [hx + side * 0.6 + s * side, -lift]], 3.4, 2.6);
      limb(c, [[hx + side * 0.6 + s * side - 1.4, -lift], [hx + side * 0.6 + s * side + 2.2, -lift]], 1.6, 1.0);
    }
    // old drooping leaves behind
    for (const [a, L] of [[-2.6, 10], [-0.55, 9.5]]) {
      const pts = curlPts(0, by - ry + 2, a, L, a < -1.5 ? -1.8 : 1.8, 6);
      limb(c, pts, 1.2, 0.5, 3);
      const e = pts[pts.length - 1], e2 = pts[pts.length - 2];
      leaf(c, e[0], e[1], Math.atan2(e[1] - e2[1], e[0] - e2[0]), 4.4, 1.3, 0.3);
    }
    ell(c, 0, by, rx, ry);
    // shawl: wider over the shoulders, with a tasselled hem
    c.beginPath();
    c.moveTo(-rx - 1.6, by + 3.6);
    c.bezierCurveTo(-rx - 2.4, by - ry * 0.6, -rx * 0.5, by - ry - 2.6, 0.4, by - ry - 2.2);
    c.bezierCurveTo(rx * 0.55, by - ry - 2.2, rx + 1.2, by - ry * 0.7, rx * 0.7, by - ry * 0.25);
    c.lineTo(-rx * 0.2, by - ry * 0.32);
    c.lineTo(-rx * 0.65, by + 3.6);
    c.closePath(); c.fill();
    {
      const kx = -rx * 0.92, ky = by - ry * 0.18;
      ell(c, kx, ky, 2, 1.6);
      leaf(c, kx, ky, Math.PI * 0.83 + s * 0.12, 8.5, 1.7, 0.8);
      leaf(c, kx, ky, Math.PI * 0.62 - s * 0.1, 7, 1.5, -0.6);
    }
    for (let i = 0; i < 5; i++) { const x = -rx - 1.4 + i * 1.1, y = by + 3.4 + (i & 1) * 0.3; limb(c, [[x, y], [x - 0.3 + s * 0.2, y + 2.4]], 0.5, 0.2); circ(c, x - 0.3 + s * 0.2, y + 2.6, 0.45); }
    // lace: little holes along the shawl edge + a scalloped border cut
    cut(c, () => {
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const x = -rx * 0.95 + t * rx * 1.55, y = by - ry * 0.3 - Math.sin(t * Math.PI) * 4.2 - t * 0.5;
        circ(c, x, y, 0.55);
        if (i % 2 === 0) circ(c, x + 0.3, y - 1.5, 0.35);
      }
      for (let i = 0; i < 4; i++) circ(c, -rx * 0.75 - i * 0.18, by - ry * 0.05 + i * 1.4, 0.45);
      // wrinkles on the bare belly
      c.lineWidth = 0.35;
      for (const k of [0, 1]) { c.beginPath(); c.ellipse(1, by + 4 + k * 2.6, rx * 0.55, 2, 0, 0.35, Math.PI - 0.35); c.stroke(); }
      // drooping mouth with one tooth gap
      const mx = 5.6, my = by + 2.8;
      c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(mx - 2.6, my + 0.9); c.quadraticCurveTo(mx, my - 0.8, mx + 2.6, my + 0.9); c.stroke();
    });
    // brooch
    glowFill(c, (p) => { p.arc(rx * 0.58, by - ry * 0.35, 0.8, 0, TAU); }, rx * 0.58, by - ry * 0.35, 1, GOLD_STOPS, 0.6, 'rgba(255,200,80,0.8)');
    // gnarled cane in the front hand
    const cx0 = rx + 2.6 + s * 0.6;
    limb(c, [[rx - 3, by + 2.5], [rx - 0.5, by + 3.6], [cx0, by + 2.2]], 1.6, 1.1);
    limb(c, [[cx0, by - 1.5], [cx0 + 0.6, by + 6], [cx0 - 0.3, by + 12], [cx0 + 0.4, 0]], 1.3, 1.0);
    curl(c, cx0, by - 1.3, -Math.PI * 0.55, 4.2, -5.5, 1.3, 0.4);
    // crown of baby sprouts
    const babies = [];
    [[-6.5, by - ry + 1.6, -0.5], [0.6, by - ry - 2.6, 0], [7.2, by - ry + 1.8, 0.5]].forEach(([x, y, d], i) => {
      const bb = Math.sin(ph * TAU + i * 2) * 0.5, yy = y + bb;
      const pts = curlPts(x, yy - 2.2, -Math.PI / 2 + d, 3.2, d < 0 ? -1.5 : 1.5, 4);
      limb(c, pts, 0.6, 0.3, 3);
      const e = pts[pts.length - 1], e2 = pts[pts.length - 2];
      leaf(c, e[0], e[1], Math.atan2(e[1] - e2[1], e[0] - e2[0]), 2.6, 0.9, 0.2);
      ell(c, x, yy, 2.8, 2.6);
      babies.push([x + 1.2, yy - 0.3]);
    });
    glowFill(c, (p) => { for (const [x, y] of babies) { p.moveTo(x - 1.2, y); p.arc(x - 1.4, y, 0.42, 0, TAU); p.moveTo(x + 0.4, y); p.arc(x + 0.2, y, 0.42, 0, TAU); } }, 0, by - ry, 12, GREEN_STOPS, 0.7, 'rgba(170,255,70,0.9)');
    // heavy-lidded glowing eyes
    glowFill(c, (p) => {
      const ey = by - 2.6;
      p.moveTo(2.0, ey - 0.2); p.quadraticCurveTo(3.6, ey + 1.6, 5.2, ey - 0.2); p.closePath();
      p.moveTo(6.4, ey - 0.2); p.quadraticCurveTo(8.0, ey + 1.6, 9.6, ey - 0.2); p.closePath();
    }, 5.8, by - 2.4, 4.6, GOLD_STOPS, 2, 'rgba(255,190,70,1)');
    return { babies, eye: [5.8, by - 2.4] };
  }

  function drawSprout(c, ph) {
    const s = Math.sin(ph * TAU), co = Math.cos(ph * TAU);
    const by = -7.4 - Math.abs(co) * 0.8;
    rootLegs(c, ph, by, 4.2, 1.6, 1.8);
    limb(c, [[-1, by + 3], [-2.6, by + 4.2], [-3.8, by + 3.4]], 1.2, 0.1);
    ell(c, 0, by, 4.6, 4.3);
    // one big curly leaf
    const pts = curlPts(0, by - 3.8, -Math.PI / 2 - 0.25 + s * 0.12, 6.5, 2.2, 6);
    limb(c, pts, 1.0, 0.45, 3);
    const e = pts[pts.length - 1], e2 = pts[pts.length - 2];
    leaf(c, e[0], e[1], Math.atan2(e[1] - e2[1], e[0] - e2[0]), 4.4, 1.6, 0.4);
    leaf(c, pts[2][0], pts[2][1], -Math.PI * 0.85, 2.6, 0.9);
    cut(c, () => { const my = by + 1.8; poly(c, [[0.6, my], [1.6, my + 0.5], [2.6, my], [2.2, my + 1.1], [1, my + 1.1]]); });
    glowFill(c, (p) => {
      const ey = by - 1.2;
      p.moveTo(-0.4, ey - 0.7); p.quadraticCurveTo(0.8, ey - 0.4, 1.6, ey + 0.4); p.quadraticCurveTo(0.4, ey + 0.9, -0.4, ey - 0.7); p.closePath();
      p.moveTo(3.9, ey - 0.8); p.quadraticCurveTo(2.9, ey - 0.4, 2.2, ey + 0.4); p.quadraticCurveTo(3.4, ey + 0.8, 3.9, ey - 0.8); p.closePath();
    }, 1.8, by - 1, 2.8, GREEN_STOPS, 1, 'rgba(170,255,70,0.95)');
    return { eye: [1.8, by - 1] };
  }

  /* =========================================================================
     Icons (100-unit design space on the style's glowing disc)
     ========================================================================= */
  function iconDisc(ctx) {
    const g = ctx.createRadialGradient(50, 46, 2, 50, 50, 46);
    g.addColorStop(0, '#fff3c8'); g.addColorStop(0.32, '#ffc35a'); g.addColorStop(0.68, '#ea6236'); g.addColorStop(1, '#7a1c46');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(50, 50, 44, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.strokeStyle = INK;
    ctx.lineWidth = 3.6; ctx.beginPath(); ctx.arc(50, 50, 45, 0, TAU); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(50, 50, 40.5, 0, TAU); ctx.stroke();
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * TAU;
      circ(ctx, 50 + Math.cos(a) * 42.6, 50 + Math.sin(a) * 42.6, k & 1 ? 0.9 : 1.4);
    }
  }
  function iSeed(c, x, y, a, L, w) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.beginPath(); c.moveTo(L, 0); c.quadraticCurveTo(0, -w * 2, -L * 0.85, -w * 0.5); c.quadraticCurveTo(-L * 1.05, 0, -L * 0.85, w * 0.5); c.quadraticCurveTo(0, w * 2, L, 0); c.fill();
    c.restore();
  }
  function iPumpkinFace(c, cx, cy, sc) {
    glowFill(c, (p) => {
      p.moveTo(cx - 9 * sc, cy - 2 * sc); p.lineTo(cx - 5 * sc, cy - 8 * sc); p.lineTo(cx - 2 * sc, cy - 2 * sc); p.closePath();
      p.moveTo(cx + 2 * sc, cy - 2 * sc); p.lineTo(cx + 5 * sc, cy - 8 * sc); p.lineTo(cx + 9 * sc, cy - 2 * sc); p.closePath();
      p.moveTo(cx - 10 * sc, cy + 3 * sc); p.lineTo(cx - 6 * sc, cy + 5 * sc); p.lineTo(cx - 3 * sc, cy + 3 * sc); p.lineTo(cx, cy + 6 * sc); p.lineTo(cx + 3 * sc, cy + 3 * sc);
      p.lineTo(cx + 6 * sc, cy + 5 * sc); p.lineTo(cx + 10 * sc, cy + 3 * sc); p.quadraticCurveTo(cx, cy + 14 * sc, cx - 10 * sc, cy + 3 * sc); p.closePath();
    }, cx, cy, 14 * sc, FACE_STOPS, 0.9, 'rgba(255,150,40,1)');
  }
  function drawIconArt(c, id) {
    c.fillStyle = INK; c.strokeStyle = INK; c.lineCap = 'round'; c.lineJoin = 'round';
    switch (id) {
      case 'leech': {
        // a bowl of steaming pumpkin soup, a little glowing heart rising
        c.beginPath(); c.moveTo(20, 54); c.lineTo(80, 54); c.quadraticCurveTo(78, 80, 50, 82); c.quadraticCurveTo(22, 80, 20, 54); c.fill();
        limb(c, [[38, 84], [62, 84]], 4, 4);
        glowFill(c, (p) => p.ellipse(50, 54, 27, 4.2, 0, 0, TAU), 50, 54, 26, FACE_STOPS, 1, 'rgba(255,150,40,1)');
        c.fillStyle = INK;
        for (const x of [36, 64]) curl(c, x, 47, -Math.PI / 2, 14, x < 50 ? -5 : 5, 2.2, 0.3);
        glowFill(c, (p) => { p.moveTo(50, 46); p.bezierCurveTo(38, 38, 38, 26, 45, 25); p.bezierCurveTo(48, 24, 50, 27, 50, 29); p.bezierCurveTo(50, 27, 52, 24, 55, 25); p.bezierCurveTo(62, 26, 62, 38, 50, 46); p.closePath(); }, 50, 33, 13, [[0, '#ffffff'], [0.35, '#ffb0c8'], [1, '#e8285a']], 2, 'rgba(255,60,110,1)');
        break;
      }
      case 'thorns': {
        // armoured turnip shell bristling with thorns
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; const x = 50 + Math.cos(a) * 22, y = 52 + Math.sin(a) * 22; leaf(c, x, y, a, 15, 2.6); }
        ell(c, 50, 52, 23, 23);
        cut(c, () => { c.lineWidth = 1.6; c.beginPath(); c.arc(50, 52, 16, 0, TAU); c.stroke(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + 0.5; circ(c, 50 + Math.cos(a) * 19.5, 52 + Math.sin(a) * 19.5, 1.3); } });
        glowFill(c, (p) => { p.moveTo(39, 48); p.quadraticCurveTo(44, 47, 48, 52); p.quadraticCurveTo(43, 54, 39, 48); p.closePath(); p.moveTo(61, 48); p.quadraticCurveTo(56, 47, 52, 52); p.quadraticCurveTo(57, 54, 61, 48); p.closePath(); }, 50, 50, 12, GREEN_STOPS, 1, 'rgba(170,255,70,1)');
        break;
      }
      case 'dashup': {
        // a pumpkin rolling with speed lines and a dust curl
        c.save(); c.translate(56, 54); c.rotate(0.5); pumpkinShape(c, 0, 0, 22, 19); limb(c, [[0, -17], [2, -25]], 4.4, 3.6); c.restore();
        cut(c, () => { c.lineWidth = 1.5; for (const a of [-0.3, 0.6]) { c.beginPath(); c.ellipse(56, 54, 7 + a * 4, 18, 0.5 + a, 0, TAU); c.stroke(); } });
        for (const [y, L] of [[42, 18], [54, 24], [66, 16]]) limb(c, [[30 - L, y], [30, y]], 0.6, 4);
        curl(c, 32, 76, Math.PI, 12, -5, 3, 0.3);
        break;
      }
      case 'range': {
        // a seed flying a long dotted arc towards a target
        for (let i = 0; i <= 10; i++) { const t = i / 10, x = 18 + t * 58, y = 74 - Math.sin(t * Math.PI) * 46; circ(c, x, y, 2.2 - t * 0.6); }
        c.save(); c.shadowColor = 'rgba(255,190,80,1)'; c.shadowBlur = 2 * K;
        const g = c.createLinearGradient(14, 70, 30, 66); g.addColorStop(0, '#ffcf7a'); g.addColorStop(1, '#ffffff'); c.fillStyle = g;
        iSeed(c, 22, 70, -1.0, 9, 4.2); c.restore();
        c.fillStyle = INK;
        ell(c, 76, 74, 13, 7.5);
        glowFill(c, (p) => { p.ellipse(76, 74, 9, 5, 0, 0, TAU); }, 76, 74, 9, [[0, '#ffffff'], [0.3, '#ffe08a'], [0.65, '#ff7a3a'], [1, '#c8202a']], 1.2, 'rgba(255,120,60,1)');
        c.fillStyle = INK; ell(c, 76, 74, 4.5, 2.5);
        break;
      }
      default: circ(c, 50, 50, 20);
    }
  }

  /* =========================================================================
     Runtime
     ========================================================================= */
  let S = null;
  const lazy = (o, key, fn) => Object.defineProperty(o, key, { configurable: true, enumerable: true, get() { const v = fn(); Object.defineProperty(o, key, { value: v }); return v; } });
  /* frame set: [facing][i] sprite + rim + shards */
  function set(frames, rimCol, rimRad, shardsN, seed) {
    const n = [[], []], rim = [[], []];
    frames.forEach((s, i) => {
      const r = rimSpr(s, rimCol, rimRad);
      n[0][i] = s; n[1][i] = flipSpr(s);
      rim[0][i] = r; rim[1][i] = flipSpr(r);
    });
    const out = { n, rim };
    lazy(out, 'sh', () => [tornShards(n[0][0], shardsN, seed), tornShards(n[1][0], shardsN, seed + 1)]);
    return out;
  }
  function build() {
    const o = {};
    const box = { sp: [-12, -30, 20, 1.5], bo: [-10, -27, 10, 1.5], ch: [-19, -29, 22, 1.5], mo: [-17, -44, 20, 1.5], so: [-7, -21, 7, 1.5] };
    const f = (b, draw) => mk(b[0], b[1], b[2], b[3], draw, { pad: 2.5 });
    lazy(o, 'sp', () => set([0, 1, 2, 3, 4, 5].map((i) => f(box.sp, (c) => drawSpitter(c, i / 6, 0, 0))), '#f4ffd0', 1.2, 5, 301));
    lazy(o, 'spAim', () => set([0.35, 0.7, 1].map((k) => f(box.sp, (c) => drawSpitter(c, 0, k, 0))), '#f4ffd0', 1.2, 5, 303));
    lazy(o, 'spRecoil', () => set([f(box.sp, (c) => drawSpitter(c, 0, 0, 1))], '#f4ffd0', 1.2, 5, 305));
    lazy(o, 'bo', () => set([0, 1, 2, 3, 4, 5].map((i) => f(box.bo, (c) => drawBomber(c, i / 6, 0))), '#fff6dc', 1.1, 4, 311));
    lazy(o, 'boSwell', () => {
      const s = set([0, 1, 2, 3, 4, 5].map((i) => f(box.bo, (c) => drawBomber(c, i / 6, 1))), '#fff6dc', 1.1, 4, 313);
      s.red = [[], []];
      s.n[0].forEach((sp, i) => { const r = rimSpr(sp, '#ff3a1a', 1.6); s.red[0][i] = r; s.red[1][i] = flipSpr(r); });
      return s;
    });
    lazy(o, 'ch', () => set([0, 1, 2, 3, 4, 5].map((i) => f(box.ch, (c) => drawCharger(c, i / 6, 'trot'))), '#fff0dc', 1.3, 5, 321));
    lazy(o, 'chPose', () => {
      const s = set(['rear', 'scrape', 'dash', 'stand'].map((p) => f(box.ch, (c) => drawCharger(c, 0, p))), '#fff0dc', 1.3, 5, 323);
      s.redRim = [[], []];
      [0, 1].forEach((i) => { const r = rimSpr(s.n[0][i], '#ff4a2a', 1.4); s.redRim[0][i] = r; s.redRim[1][i] = flipSpr(r); });
      s.ghost = [{ c: U.tint(s.n[0][2].c, 'rgba(11,5,16,1)'), ax: s.n[0][2].ax, ay: s.n[0][2].ay }];
      s.ghost[1] = flipSpr(s.ghost[0]);
      return s;
    });
    lazy(o, 'mo', () => set([0, 1, 2, 3, 4, 5].map((i) => f(box.mo, (c) => drawMother(c, i / 6, 1, 1))), '#fff0dc', 1.5, 6, 331));
    lazy(o, 'moPulse', () => set([f(box.mo, (c) => drawMother(c, 0, 1.12, 0.86)), f(box.mo, (c) => drawMother(c, 0, 0.93, 1.08))], '#fff0dc', 1.5, 6, 333));
    lazy(o, 'so', () => set([0, 1, 2, 3, 4, 5].map((i) => f(box.so, (c) => drawSprout(c, i / 6))), '#f4ffd0', 0.9, 3, 341));
    // emissive bits
    lazy(o, 'gGreen', () => glowSpr(6, [[0, 'rgba(240,255,190,0.95)'], [0.35, 'rgba(180,255,70,0.45)'], [1, 'rgba(120,220,40,0)']]));
    lazy(o, 'gRed', () => glowSpr(7, [[0, 'rgba(255,230,200,0.95)'], [0.3, 'rgba(255,80,40,0.5)'], [1, 'rgba(220,20,30,0)']]));
    lazy(o, 'gWarm', () => glowSpr(14, [[0, 'rgba(255,214,130,0.85)'], [0.35, 'rgba(255,150,60,0.35)'], [1, 'rgba(255,90,20,0)']]));
    lazy(o, 'gGold', () => glowSpr(10, [[0, 'rgba(255,240,170,0.95)'], [0.3, 'rgba(255,200,90,0.45)'], [1, 'rgba(255,140,40,0)']]));
    lazy(o, 'ember', () => glowSpr(3, [[0, 'rgba(255,250,215,1)'], [0.25, 'rgba(255,190,80,0.85)'], [0.6, 'rgba(255,110,30,0.25)'], [1, 'rgba(255,70,10,0)']]));
    lazy(o, 'contact', () => glowSpr(10, [[0, 'rgba(14,5,20,0.55)'], [0.55, 'rgba(14,5,20,0.28)'], [1, 'rgba(14,5,20,0)']]));
    lazy(o, 'star', () => mk(-2.4, -2.4, 2.4, 2.4, (c) => glowFill(c, (p) => star(p, 0, 0, 4, 2.2, 0.7, 0), 0, 0, 2.4, [[0, '#ffffff'], [0.5, '#ffe9a0'], [1, '#ffb040']], 0.8, 'rgba(255,200,90,1)'), { pad: 1 }));
    lazy(o, 'drop', () => mk(-1.2, -1.2, 1.2, 1.2, (c) => glowFill(c, (p) => p.arc(0, 0, 0.9, 0, TAU), 0, 0, 1.2, TOX_STOPS, 0.8, 'rgba(170,255,70,1)'), { pad: 0.8 }));
    // the spit glob: ink rim around a glowing acid core, pointing along +x
    lazy(o, 'shot', () => mk(-6, -3.4, 4, 3.4, (c) => {
      c.beginPath(); c.moveTo(-5.8, 0); c.quadraticCurveTo(-1.5, -3.4, 1, -3.1); c.arc(0.8, 0, 3.1, -Math.PI / 2, Math.PI / 2); c.quadraticCurveTo(-1.5, 3.4, -5.8, 0); c.fill();
      glowFill(c, (p) => { p.moveTo(-4.2, 0); p.quadraticCurveTo(-1.2, -2.3, 0.9, -2.2); p.arc(0.8, 0, 2.2, -Math.PI / 2, Math.PI / 2); p.quadraticCurveTo(-1.2, 2.3, -4.2, 0); p.closePath(); },
        1.2, -0.6, 3.2, TOX_STOPS, 1.4, 'rgba(170,255,70,1)');
      c.fillStyle = 'rgba(255,255,255,0.9)'; ell(c, 1.6, -1, 0.8, 0.55);
    }, { pad: 1.6 }));
    lazy(o, 'trail', () => mk(-12, -2, 0, 2, (c) => {
      const g = c.createLinearGradient(-12, 0, 0, 0);
      g.addColorStop(0, 'rgba(120,220,40,0)'); g.addColorStop(0.6, 'rgba(170,255,70,0.45)'); g.addColorStop(1, 'rgba(240,255,190,0.9)');
      c.fillStyle = g; leaf(c, -12, 0, 0, 12, 1.0);
    }, { pad: 0.3 }));
    return o;
  }

  /* spawn / death / hit flash exactly like the style's creeper */
  function puppet(ctx, e, view, SET, fr, wob, h, ox) {
    const fi = e.facing < 0 ? 1 : 0;
    const frames = SET.n[fi], rims = SET.rim[fi];
    const x = e.x + (ox || 0), y = e.y;
    if (e.dying) {
      const t = e.deathT;
      if (t < 0.14) {
        add(ctx, 0.9); blit(ctx, rims[0], x, y); norm(ctx);
        blit(ctx, frames[0], x, y);
        return null;
      }
      const u = (t - 0.14) / 0.86, sh = SET.sh[fi], big = h > 34 ? 1.4 : 1;
      ctx.globalAlpha = Math.max(0, 1 - u * u);
      for (let i = 0; i < sh.length; i++) {
        const p = sh[i], d = (2 + 10 * U.ease.outQuad(u)) * big;
        blitRot(ctx, p, x + p.dx * d, y - p.off + p.dy * d * 0.7 - 5 * big * u + 22 * u * u, (i & 1 ? 1 : -1) * u * (1.4 + (i % 3) * 0.4), 1 - u * 0.3);
      }
      ctx.globalAlpha = 1;
      return null;
    }
    const spr = frames[fr];
    if (e.spawnT < 1) {
      const t = e.spawnT, k = U.ease.outBack(Math.min(1, t * 1.15));
      const dy = (1 - k) * h * 0.95, sw = Math.sin(t * 14) * (1 - t) * 0.25;
      add(ctx, (1 - t) * 0.8); blitS(ctx, S.gWarm, x, y, h > 34 ? 1.2 : 0.8, h > 34 ? 0.3 : 0.2); norm(ctx);
      ctx.save();
      ctx.beginPath(); ctx.rect(x - 40, y - 90, 80, 90.6); ctx.clip();
      blitRot(ctx, spr, x, y + dy, wob + sw, 1);
      ctx.restore();
      ctx.fillStyle = INK;
      ctx.globalAlpha = Math.min(1, (1 - t) * 3);
      const top = y + dy - h * 0.45;
      ctx.fillRect(x - 0.35, top, 0.7, Math.max(0, y + 5 - top));
      ctx.globalAlpha = 1;
      return null;
    }
    const ra = Math.max(0.2, Math.min(h > 34 ? 0.75 : 0.9, (e.flash || 0) * 1.1));
    if ((e.flash || 0) > 0.02) { add(ctx, ra); blitRot(ctx, rims[fr], x, y, wob, 1); norm(ctx); }
    return { fi, spr, x, y, wob };
  }
  /* sprite-local (world units, facing right) -> world */
  function pt(d, p, wobAt) {
    const sx = d.fi ? -p[0] : p[0], a = d.wob, c = Math.cos(a), s = Math.sin(a);
    void wobAt;
    return [d.x + sx * c - p[1] * s, d.y + sx * s + p[1] * c];
  }

  C.art('shadow', {
    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = (window.__forceH || window.innerHeight || 900) * dpr;
      K = U.clamp(Math.round((h / 360) * 1.3 * 4) / 4, 2.5, 5);
      FILTER = hasFilter();
      S = build();
    },
    enemies: {
      spitter(ctx, e, view) {
        base(view);
        const rt = view.rt, aiming = e.mode === 'aim', ch = e.charge || 0, spit = e.spit || 0;
        let SET, fr = 0, wob, ox = 0;
        if (aiming) { SET = S.spAim; fr = ch < 0.34 ? 0 : ch < 0.67 ? 1 : 2; wob = 0; if (ch > 0.45) ox = Math.sin(rt * 90) * 0.5; }
        else if (spit > 0.55) { SET = S.spRecoil; wob = (e.facing < 0 ? 1 : -1) * 0.08; }
        else { SET = S.sp; fr = Math.floor(e.anim * 4.8 + e.seed * 6) % 6; wob = Math.sin((e.anim * 4.8 / 6) * TAU + e.seed * 6) * 0.07 * (e.facing < 0 ? -1 : 1); }
        const d = puppet(ctx, e, view, SET, fr, wob, 26, ox);
        if (!d) return;
        blitRot(ctx, d.spr, d.x, d.y, d.wob, 1);
        const m = pt(d, d.spr.meta.mouth);
        const dir = d.fi ? -1 : 1;
        if (aiming) {
          add(ctx, 0.35 + ch * 0.65); blitS(ctx, S.gGreen, m[0], m[1], 0.5 + ch * 0.9, 0.5 + ch * 0.9); norm(ctx);
        } else if (spit > 0) {
          const k = 1 - spit;
          add(ctx, spit);
          blitS(ctx, S.gGreen, m[0] + dir * 2, m[1], 1, 1);
          for (let i = 0; i < 6; i++) {
            const a = (i - 2.5) * 0.3 + (e.seed - 0.5) * 0.3, dd = 2 + k * (7 + (i % 3) * 3);
            blit(ctx, S.drop, m[0] + dir * Math.cos(a) * dd, m[1] + Math.sin(a) * dd * 0.8 + k * k * 4);
          }
          norm(ctx);
        }
      },

      bomber(ctx, e, view) {
        base(view);
        const rt = view.rt, armed = !!e.armed, fz = e.fuse || 0;
        const SET = armed && fz > 0.4 ? S.boSwell : S.bo;
        const fr = Math.floor(e.anim * (armed ? 6 : 5) + e.seed * 6) % 6;
        let wob = Math.sin((e.anim * 5 / 6) * TAU + e.seed * 6) * 0.09 * (e.facing < 0 ? -1 : 1);
        const ox = armed && fz > 0.5 ? Math.sin(rt * 80) * 0.45 : 0;
        if (armed) wob *= 0.4;
        const d = puppet(ctx, e, view, SET, fr, wob, 22, ox);
        if (!d) return;
        let on = false;
        if (armed) {
          const ph = fz * (3 + fz * 12);
          on = Math.floor(ph * 2) % 2 === 0;
          const red = S.boSwell.red[d.fi][fr];
          add(ctx, on ? 0.75 + fz * 0.25 : 0.25);
          blitRot(ctx, fz > 0.7 && Math.floor(ph * 4) % 2 ? SET.rim[d.fi][fr] : red, d.x, d.y, d.wob, 1);
          norm(ctx);
        }
        blitRot(ctx, d.spr, d.x, d.y, d.wob, 1);
        // burning fuse tip (burns down the cord once armed)
        const pts = d.spr.meta.fusePts, n = pts.length - 1;
        const idx = armed ? Math.max(2, Math.round(n - fz * (n - 2))) : n;
        const tip = pt(d, pts[idx]);
        const fl = 0.8 + 0.2 * Math.sin(rt * 31 + e.seed * 9);
        add(ctx, 0.9 * fl);
        blitS(ctx, S.ember, tip[0], tip[1], 1.2 + fz * 1.2, 1.2 + fz * 1.2);
        if (armed) {
          blitS(ctx, S.gWarm, tip[0], tip[1], 0.3 + fz * 0.3, 0.3 + fz * 0.3);
          blitRot(ctx, S.star, tip[0], tip[1], rt * 9, 0.6 + fz * 0.8);
          ctx.globalAlpha = on ? 0.3 + fz * 0.4 : 0.1;
          blitS(ctx, S.gRed, d.x, d.y - 10, 1.2, 1.2);
        }
        norm(ctx);
      },

      charger(ctx, e, view) {
        base(view);
        const rt = view.rt, mode = e.mode || 'chase', mt = e.modeT || 0;
        let SET, fr, wob = 0, ox = 0;
        if (mode === 'tele') { SET = S.chPose; fr = mt < 0.3 || Math.floor(mt * 11) % 3 ? 0 : 1; ox = Math.sin(rt * 95) * 0.5; }
        else if (mode === 'dash') { SET = S.chPose; fr = 2; }
        else if (mode === 'rest') { SET = S.chPose; fr = 3; wob = Math.sin(mt * 14) * 0.09; }
        else { SET = S.ch; fr = Math.floor(e.anim * 4.2 + e.seed * 6) % 6; wob = Math.sin((e.anim * 4.2 / 6) * TAU) * 0.04 * (e.facing < 0 ? -1 : 1); }
        const fi = e.facing < 0 ? 1 : 0;
        if (mode === 'dash' && !e.dying && e.spawnT >= 1) {
          const dX = e.dashX || (fi ? -1 : 1), dY = e.dashY || 0;
          for (let i = 3; i >= 1; i--) { ctx.globalAlpha = 0.32 / i; blit(ctx, S.chPose.ghost[fi], e.x - dX * i * 7, e.y - dY * i * 7); }
          ctx.globalAlpha = 1;
        }
        const d = puppet(ctx, e, view, SET, fr, wob, 28, ox);
        if (!d) return;
        if (mode === 'tele') { add(ctx, 0.55 + 0.35 * Math.sin(rt * 30)); blitRot(ctx, SET.redRim[fi][fr], d.x, d.y, d.wob, 1); norm(ctx); }
        blitRot(ctx, d.spr, d.x, d.y, d.wob, 1);
        const eye = pt(d, d.spr.meta.eye);
        if (mode === 'tele' || mode === 'dash') { add(ctx, 1); blitS(ctx, S.gRed, eye[0], eye[1], 0.7, 0.7); norm(ctx); }
        if (mode === 'dash') {
          // speed lines
          add(ctx, 0.8);
          const dir = fi ? 1 : -1;
          ctx.fillStyle = 'rgba(255,240,215,0.7)';
          for (let i = 0; i < 4; i++) {
            const len = 7 + ((i * 5 + Math.floor(rt * 20)) % 6);
            ctx.fillRect(dir > 0 ? d.x + 14 : d.x - 14 - len, d.y - 22 + i * 5.5, len, 0.5);
          }
          norm(ctx);
        }
        if (mode === 'rest') {
          const hd = pt(d, d.spr.meta.head);
          add(ctx, 1);
          for (let i = 0; i < 3; i++) {
            const a = rt * 6 + (i * TAU) / 3;
            blitRot(ctx, S.star, hd[0] + Math.cos(a) * 7, hd[1] + Math.sin(a) * 2.2, rt * 4 + i, Math.sin(a) > 0 ? 1 : 0.7);
          }
          norm(ctx);
        }
      },

      mother(ctx, e, view) {
        base(view);
        const b = e.birth || 0;
        let SET, fr;
        if (b > 0.62) { SET = S.moPulse; fr = 0; } else if (b > 0.3) { SET = S.moPulse; fr = 1; }
        else { SET = S.mo; fr = Math.floor(e.anim * 3 + e.seed * 6) % 6; }
        const wob = b > 0.3 ? 0 : Math.sin((e.anim * 3 / 6) * TAU) * 0.03 * (e.facing < 0 ? -1 : 1);
        const d = puppet(ctx, e, view, SET, fr, wob, 40, 0);
        if (!d) return;
        if (b > 0) { add(ctx, b * 0.8); blitRot(ctx, SET.rim[d.fi][fr], d.x, d.y, d.wob, 1); blitS(ctx, S.gGold, d.x, d.y - 30, 1.4, 1.2); norm(ctx); }
        blitRot(ctx, d.spr, d.x, d.y, d.wob, 1);
        if (b > 0) {
          add(ctx, b);
          for (const q of d.spr.meta.babies) { const w = pt(d, q); blitS(ctx, S.gGreen, w[0], w[1], 0.55, 0.55); }
          norm(ctx);
        }
      },

      sprout(ctx, e, view) {
        base(view);
        const fr = Math.floor(e.anim * 6 + e.seed * 6) % 6;
        const wob = Math.sin((e.anim * 6 / 6) * TAU + e.seed * 6) * 0.1 * (e.facing < 0 ? -1 : 1);
        const d = puppet(ctx, e, view, S.so, fr, wob, 16, 0);
        if (!d) return;
        blitRot(ctx, d.spr, d.x, d.y, d.wob, 1);
      },
    },

    shadow(ctx, o, view) {
      base(view);
      if (o.dying) return true;
      const k = o.spawnT < 1 ? o.spawnT : 1;
      const s = o.type === 'mother' ? 1.5 : o.type === 'charger' ? 1.15 : o.type === 'sprout' ? 0.55 : o.type === 'bomber' ? 0.75 : 0.85;
      blitS(ctx, S.contact, o.x, o.y + 0.6, s * k, s * 0.3 * k);
      return true;
    },

    shot(ctx, s, view) {
      base(view);
      const y = s.y - s.z, a = s.angle !== undefined ? s.angle : Math.atan2(s.vy, s.vx);
      const k = Math.min(1, (s.age || 0) * 8), pulse = 1 + 0.08 * Math.sin(view.rt * 22 + s.seed * 10);
      add(ctx, 0.9);
      blitRot(ctx, S.trail, s.x, y, a, 0.5 + 0.5 * k);
      ctx.globalAlpha = 0.85;
      blitS(ctx, S.gGreen, s.x, y, 1.1, 1.1);
      norm(ctx);
      blitRot(ctx, S.shot, s.x, y, a, pulse);
    },

    icons: Object.fromEntries(['leech', 'thorns', 'dashup', 'range'].map((id) => [id, (ctx, size) => {
      ctx.save();
      ctx.scale(size / 100, size / 100);
      const prevK = K;
      K = (size / 100) * 1.2;
      iconDisc(ctx);
      ctx.translate(50, 50); ctx.scale(0.86, 0.86); ctx.translate(-50, -50);
      drawIconArt(ctx, id);
      K = prevK;
      ctx.restore();
    }])),
  });
})();
