/* Schattentheater – "Jack vs. the Turnip Ancestors" as a backlit paper shadow-puppet theatre
   (Lotte Reiniger / Limbo). The ground IS the light: large glowing colour fields (amber → crimson → violet →
   moonlit teal) with flat lace cut-outs lying on them. Everything standing is a deep indigo-black cut-paper
   silhouette – the only colour on it is emissive (Jack's carved face, green creeper eyes, the golem's cracks).
   Ghosts are the inversion: pale glowing veils. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const TAU = Math.PI * 2;

  /* ===================================================================================== palette */
  const INK = '#0b0510';
  const INK_RGB = [11, 5, 16];
  const LACE_RGB = [22, 8, 28];
  const EYE_G = '#d8ff62';
  const CRACK = '#ff5ad2';

  let K = 3; // sprite pixels per world unit
  const R = (a, b, rng) => a + (b - a) * rng.next();
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  /* ===================================================================================== cut-paper toolkit */
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
  /** Tapered filled stroke along a (smoothed) polyline – the basic cut-paper limb. */
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
  /** Spiral points: heading a, curling by `turn` radians (sign = direction), tightening towards the end. */
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
  /** Lens leaf from base (x,y) along angle a. */
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
  /** Glowing fill (carved faces, eyes): gradient + baked bloom. */
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

  /* ===================================================================================== sprite pipeline */
  function mk(x0, y0, x1, y1, draw, opt) {
    opt = opt || {};
    const pad = opt.pad === undefined ? 2.5 : opt.pad;
    const ax = Math.round((pad - x0) * K), ay = Math.round((pad - y0) * K);
    const w = Math.ceil((x1 - x0 + pad * 2) * K), h = Math.ceil((y1 - y0 + pad * 2) * K);
    const { c, ctx } = U.canvas(w, h);
    ctx.setTransform(K, 0, 0, K, ax, ay);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = INK; ctx.strokeStyle = INK;
    draw(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return { c, ax, ay };
  }
  function flipSpr(s) { const o = { c: U.flipX(s.c), ax: s.c.width - s.ax, ay: s.ay }; if (s.glow) o.glow = s.glow.map((g) => [-g[0], g[1], g[2]]); return o; }
  function hasFilter() { const t = U.canvas(2, 2).ctx; t.filter = 'blur(1px)'; return t.filter === 'blur(1px)'; }
  let FILTER = true;
  /** Soft light rim around a silhouette (hit flash, Jack's aura). */
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
  function blurInto(dst, src, px, alpha, color) {
    const t = color ? U.tint(src, color) : src;
    dst.save();
    dst.globalAlpha = alpha;
    if (FILTER) dst.filter = `blur(${px.toFixed(1)}px)`;
    dst.drawImage(t, 0, 0);
    dst.restore();
  }
  /** Radial glow sprite (anchor = centre). */
  function glowSpr(r, stops) {
    const px = Math.ceil(r * K * 2);
    const { c, ctx } = U.canvas(px, px);
    const g = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    stops.forEach((s) => g.addColorStop(s[0], s[1]));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, px, px);
    return { c, ax: px / 2, ay: px / 2 };
  }
  /** Torn paper scraps of a silhouette with ember-lit cut edges (death crumble). */
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

  /* world blits */
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

  /* ===================================================================================== characters */
  /** Jack – shadow puppet with a carved, glowing pumpkin head. Facing +x. */
  function drawJack(c, ph, moving) {
    const s = Math.sin(ph * TAU), co = Math.cos(ph * TAU);
    const bob = moving ? -Math.abs(co) * 0.9 : Math.sin(ph * TAU) * 0.35;
    const hipY = -8.6 + bob;
    const sh = -16.2 + bob;
    // legs (puppet joints)
    const leg = (side) => {
      const sw = moving ? s * side : 0;
      const thA = Math.PI / 2 - sw * 0.6;
      const hx = side * 1.2 + 0.3;
      const kx = hx + Math.cos(thA) * 4.2, ky = hipY + Math.sin(thA) * 4.2;
      const shA = thA + (moving ? 0.12 + 0.55 * Math.max(0, Math.sin(ph * TAU + side * 1.4)) : 0.04);
      const fx = kx + Math.cos(shA) * 4.4, fy = Math.min(0, ky + Math.sin(shA) * 4.4);
      limb(c, [[hx, hipY], [kx, ky], [fx, fy]], 1.15, 0.9);
      limb(c, [[fx - 0.7, fy - 0.6], [fx + 1.0, fy - 0.1], [fx + 2.3, fy - 0.5]], 1.4, 0.7);
      curl(c, fx + 2.2, fy - 0.5, -0.5, 2.2, -5.5, 0.55, 0.12);
    };
    leg(-1);
    // back arm
    const swA = moving ? -s * 0.7 : 0.1;
    {
      const sx = -1.6, sy = sh + 0.8;
      const ua = Math.PI / 2 + swA * 0.8 + 0.15;
      const ex = sx + Math.cos(ua) * 3.4, ey = sy + Math.sin(ua) * 3.4;
      const fa = ua - 0.5;
      const hx = ex + Math.cos(fa) * 3.2, hy = ey + Math.sin(fa) * 3.2;
      limb(c, [[sx, sy], [ex, ey], [hx, hy]], 1.0, 0.75);
      circ(c, hx, hy, 0.85);
    }
    leg(1);
    // cloak with a jagged hem, trailing backwards when walking
    const hemY = -7.4 + bob;
    const trail = moving ? -2.2 + s * 0.4 : -0.5 + s * 0.3;
    const backX = -6.4 + trail;
    c.beginPath();
    c.moveTo(-3.2, sh);
    c.lineTo(3.4, sh);
    c.quadraticCurveTo(5.0, sh + 4.5, 5.6, hemY - 0.4);
    const n = 7;
    for (let k = 1; k <= n; k++) {
      const x = 5.6 + (backX - 5.6) * (k / n);
      const y = hemY + (k & 1 ? 1.3 : -0.7) + (moving ? Math.sin(ph * TAU * 2 + k) * 0.3 : 0) + (k / n) * (moving ? -1.4 : 0);
      c.lineTo(x, y);
    }
    c.quadraticCurveTo(-5.4 + trail * 0.5, sh + 3.4, -3.2, sh);
    c.closePath();
    c.fill();
    // little filigree clasp curls on the cloak edge
    curl(c, backX + 0.4, hemY - 1.2, Math.PI + 0.3, 1.8, 5.5, 0.5, 0.1);
    // scarf + streaming tails
    ell(c, 0.4, sh - 0.9, 3.5, 1.3);
    const w1 = Math.sin(ph * TAU * 2) * 0.9, w2 = Math.cos(ph * TAU * 2 + 0.6) * 0.9;
    if (moving) {
      limb(c, [[-2.4, sh - 0.9], [-5.6, sh - 0.4 + w1], [-8.8, sh - 1.2 + w2], [-11.6, sh + 0.2 + w1]], 1.6, 0.5);
      limb(c, [[-2.2, sh - 0.4], [-4.8, sh + 1.0 + w2], [-7.4, sh + 0.8 - w1]], 1.1, 0.4);
      for (let k = 0; k < 3; k++) limb(c, [[-11.4, sh + 0.2 + w1], [-12.8 - k * 0.2, sh - 0.6 + k * 0.7 + w1]], 0.35, 0.08);
    } else {
      limb(c, [[-2.4, sh - 0.8], [-3.6 + w1 * 0.3, sh + 2.0], [-4.0 + w2 * 0.4, sh + 4.6]], 1.6, 0.8);
      limb(c, [[-1.8, sh - 0.4], [-2.4 + w2 * 0.3, sh + 2.2], [-2.6 + w1 * 0.3, sh + 3.8]], 1.1, 0.6);
    }
    // front arm
    {
      const sx = 2.6, sy = sh + 0.6;
      const ua = Math.PI / 2 - swA * 0.9 - 0.25;
      const ex = sx + Math.cos(ua) * 3.4, ey = sy + Math.sin(ua) * 3.4;
      const fa = ua - 0.6;
      const hx = ex + Math.cos(fa) * 3.2, hy = ey + Math.sin(fa) * 3.2;
      limb(c, [[sx, sy], [ex, ey], [hx, hy]], 1.1, 0.8);
      circ(c, hx, hy, 0.9);
    }
    // pumpkin head
    const hb = moving ? -Math.abs(Math.cos(ph * TAU - 0.4)) * 0.9 : Math.sin(ph * TAU - 0.4) * 0.4;
    const cx = 0.8, cy = -22.4 + hb;
    pumpkinShape(c, cx, cy, 6.8, 5.4);
    limb(c, [[cx - 0.1, cy - 4.6], [cx - 0.6, cy - 6.8], [cx - 1.9, cy - 8.0]], 1.5, 0.9);
    leaf(c, cx + 0.1, cy - 5.6, -0.45, 4.2, 1.0, 0.4);
    curl(c, cx - 1.6, cy - 7.4, Math.PI + 0.4, 4.6, 6.0, 0.45, 0.1);
    // carved face (the brightest thing on screen)
    glowFill(c, (p) => {
      const e1 = [[cx - 1.9, cy - 0.5], [cx + 0.3, cy - 3.1], [cx + 1.1, cy - 0.3]];
      const e2 = [[cx + 2.4, cy - 0.4], [cx + 3.5, cy - 3.0], [cx + 5.4, cy - 0.7]];
      const no = [[cx + 1.2, cy + 0.6], [cx + 1.9, cy - 0.5], [cx + 2.6, cy + 0.6]];
      for (const t of [e1, e2, no]) { p.moveTo(t[0][0], t[0][1]); p.lineTo(t[1][0], t[1][1]); p.lineTo(t[2][0], t[2][1]); p.closePath(); }
      const xa = cx - 2.9, xb = cx + 5.7, ya = cy + 1.7;
      p.moveTo(xa, ya - 0.3);
      p.lineTo(cx - 1.5, ya + 0.3); p.lineTo(cx - 0.9, ya + 1.3); p.lineTo(cx - 0.2, ya + 0.4);
      p.lineTo(cx + 1.9, ya + 0.5); p.lineTo(cx + 2.6, ya + 1.5); p.lineTo(cx + 3.3, ya + 0.4);
      p.lineTo(xb, ya - 0.4);
      p.quadraticCurveTo(cx + 4.6, ya + 3.6, cx + 1.4, ya + 3.8);
      p.lineTo(cx + 1.0, ya + 2.6); p.lineTo(cx + 0.4, ya + 3.7);
      p.quadraticCurveTo(cx - 2.0, ya + 3.2, xa, ya - 0.3);
      p.closePath();
    }, cx + 1.4, cy + 0.6, 6, FACE_STOPS, 1.6, 'rgba(255,150,40,0.95)');
  }

  /** Rüben-Schleicher – a waddling rutabaga puppet with root legs and a filigree leaf crown. */
  function drawCreeper(c, ph, v) {
    const s = Math.sin(ph * TAU), co = Math.cos(ph * TAU);
    const bob = -Math.abs(co) * 1.0;
    const by = -12.2 + bob;
    const rx = v ? 7.0 : 7.8, ry = v ? 7.6 : 7.0;
    // root legs
    for (const side of [-1, 1]) {
      const sw = s * side;
      const hx = side * 2.6, hy = by + ry - 1.6;
      const ta = Math.PI / 2 - sw * 0.6;
      const kx = hx + Math.cos(ta) * 3.2, ky = hy + Math.sin(ta) * 3.2;
      const sa = ta + 0.2 + Math.max(0, Math.sin(ph * TAU + side * 1.3)) * 0.6;
      const fx = kx + Math.cos(sa) * 3.3, fy = Math.min(0, ky + Math.sin(sa) * 3.3);
      limb(c, [[hx, hy], [kx, ky], [fx, fy]], 1.5, 0.9);
      curl(c, fx, fy - 0.4, -0.15, 2.6, -5, 0.8, 0.1);
      limb(c, [[fx, fy - 0.3], [fx - 1.6, fy + 0.1]], 0.6, 0.1);
    }
    // taproot tail curling behind
    limb(c, [[-2, by + ry - 1.5], [-4.6, by + ry + 0.6 + s * 0.4], [-7.4, by + ry - 0.2], [-8.6, by + ry - 2.4 - s * 0.5]], 2.2, 0.15);
    // back arm
    limb(c, curlPts(-rx + 1.2, by + 1, Math.PI * 0.85 + s * 0.3, 5, -3.5, 8), 0.9, 0.15, 3);
    // bulb
    ell(c, 0, by, rx, ry);
    ell(c, 0.2, by - ry + 0.6, 2.8, 2.0);
    // root hairs
    limb(c, [[rx - 1.4, by + 3.4], [rx + 0.6, by + 4.8]], 0.6, 0.08);
    limb(c, [[-rx + 1.2, by + 3.6], [-rx - 0.8, by + 5.2]], 0.6, 0.08);
    limb(c, [[-rx + 0.4, by - 1], [-rx - 1.5, by - 1.8]], 0.55, 0.08);
    // front arm reaching
    limb(c, curlPts(rx - 1.4, by + 1.2, 0.35 - s * 0.35, 5.4, 4.2, 8), 1.0, 0.15, 3);
    // leaf crown (filigree)
    const tx = 0.2, ty = by - ry - 0.6;
    const sway = s * 0.12;
    const stems = v ? [-0.95, -0.25, 0.45] : [-1.1, -0.45, 0.15, 0.75];
    stems.forEach((d, i) => {
      const a = -Math.PI / 2 + d + sway;
      const L = (v ? 7.5 : 6.4) + (i & 1 ? 1.2 : 0);
      const pts = curlPts(tx, ty, a, L, (d < -0.3 ? -1 : 1) * 1.6, 6);
      limb(c, pts, 1.0, 0.45, 3);
      const e = pts[pts.length - 1], e2 = pts[pts.length - 2];
      const ea = Math.atan2(e[1] - e2[1], e[0] - e2[0]);
      leaf(c, e[0], e[1], ea, 4.2, 1.35, 0.3);
      leaf(c, pts[3][0], pts[3][1], ea - 1.0, 2.8, 0.9);
      leaf(c, pts[3][0], pts[3][1], ea + 1.0, 2.6, 0.85);
      if (i === 0) curl(c, pts[2][0], pts[2][1], ea - 1.6, 3.2, -5.5, 0.4, 0.08);
    });
    // mouth cut-out (light shines through)
    cut(c, () => {
      const mx = 2.6, my = by + 2.6;
      poly(c, [[mx - 2.6, my - 0.4], [mx - 1.6, my + 0.4], [mx - 1.0, my - 0.2], [mx - 0.2, my + 0.6], [mx + 0.5, my - 0.1], [mx + 1.3, my + 0.6], [mx + 2.2, my - 0.5], [mx + 1.4, my + 1.6], [mx - 1.6, my + 1.5]]);
    });
    // glowing angry eyes
    glowFill(c, (p) => {
      const ey = by - 1.2;
      p.moveTo(-0.6, ey - 0.9); p.quadraticCurveTo(1.0, ey - 0.6, 2.2, ey + 0.4); p.quadraticCurveTo(0.6, ey + 1.2, -0.6, ey - 0.9); p.closePath();
      p.moveTo(6.0, ey - 1.1); p.quadraticCurveTo(4.6, ey - 0.6, 3.4, ey + 0.4); p.quadraticCurveTo(5.0, ey + 1.1, 6.0, ey - 1.1); p.closePath();
    }, 2.8, by - 1, 4, [[0, '#ffffe0'], [0.4, EYE_G], [1, '#7fe02a']], 1.3, 'rgba(170,255,70,0.95)');
  }

  /** Hungergeist – the inversion: a pale glowing veil with hollow eyes and reaching bony hands. */
  function drawGhostVeil(c, ph) {
    const w = Math.sin(ph * TAU), w2 = Math.cos(ph * TAU);
    c.fillStyle = '#ffffff';
    ell(c, 0.6, -17.4, 5.0, 5.6);
    c.beginPath();
    c.moveTo(-4.3, -17.5);
    c.bezierCurveTo(-5.2, -12, -6.2 + w * 0.4, -9, -8.2 + w * 0.6, -6.6);
    c.lineTo(-4.4, -8.4);
    c.lineTo(-5.6 + w2 * 0.6, -4.2);
    c.lineTo(-2.4, -7.6);
    c.lineTo(-1.8 + w * 0.5, -3.6);
    c.lineTo(0.6, -7.6);
    c.lineTo(2.2, -6.2 + w2 * 0.4);
    c.lineTo(3.4, -9.2);
    c.bezierCurveTo(5.4, -11.6, 5.8, -14.6, 5.6, -17.4);
    c.closePath();
    c.fill();
    // wispy tail strands curling back
    curl(c, -7.6 + w * 0.6, -6.8, Math.PI * 0.82 + w * 0.15, 6.5, 3.8 + w2, 1.5, 0.12);
    curl(c, -5.0 + w2 * 0.6, -4.6, Math.PI * 0.7 + w2 * 0.15, 5.5, -3.6, 1.2, 0.1);
    curl(c, -1.9 + w * 0.5, -3.8, Math.PI * 0.6, 4.2, 4.0 + w, 0.9, 0.1);
    // reaching arms with long fingers
    const arm = (sx, sy, ex, ey, k) => {
      limb(c, [[sx, sy], [(sx + ex) / 2, sy + 1.2 + k * 0.4], [ex, ey]], 1.1, 0.5);
      for (let f = -1; f <= 1; f++) limb(c, [[ex, ey], [ex + 1.6, ey + f * 1.0], [ex + 2.6, ey + f * 1.6 + 0.6]], 0.42, 0.08);
    };
    arm(2.0, -12.4, 7.4, -10.8 + w2 * 0.5, w);
    arm(3.6, -13.8, 9.4, -13.6 + w * 0.7, w2);
  }
  function buildGhost(ph) {
    const box = [-15, -25, 13.5, 0];
    const veil = mk(box[0], box[1], box[2], box[3], (c) => {
      drawGhostVeil(c, ph);
      // tint: frost-white head fading to cold blue
      c.globalCompositeOperation = 'source-atop';
      const g = c.createLinearGradient(0, -23, 0, -2);
      g.addColorStop(0, '#fbfdff'); g.addColorStop(0.55, '#dcefff'); g.addColorStop(1, '#a9d4ff');
      c.fillStyle = g; c.fillRect(-20, -30, 40, 34);
      // translucency towards the tail
      c.globalCompositeOperation = 'destination-in';
      const a = c.createLinearGradient(0, -14, -6, -1);
      a.addColorStop(0, 'rgba(0,0,0,0.95)'); a.addColorStop(1, 'rgba(0,0,0,0.35)');
      c.fillStyle = a; c.fillRect(-20, -30, 40, 34);
      c.globalCompositeOperation = 'source-over';
      // hollow face
      c.fillStyle = '#1c0f36';
      ell(c, 1.7, -18.6, 1.05, 1.65, -0.15);
      ell(c, 4.6, -18.4, 0.95, 1.5, 0.15);
      ell(c, 3.3, -14.5, 1.25, 2.3, 0.08);
    }, { pad: 3 });
    const { c, ctx } = U.canvas(veil.c.width, veil.c.height);
    blurInto(ctx, veil.c, 2.2 * K, 0.42, '#160828');
    blurInto(ctx, veil.c, 1.4 * K, 0.95, '#d6f0ff');
    ctx.drawImage(veil.c, 0, 0);
    return { c, ax: veil.ax, ay: veil.ay };
  }

  /** Steckrüben-Koloss – huge gnarled rutabaga golem, glowing magenta cracks + core. */
  function drawColossus(c, ph) {
    const s = Math.sin(ph * TAU), co = Math.cos(ph * TAU);
    const by = -29 - Math.abs(co) * 1.2;
    const rng = U.rng(4242);
    // legs
    for (const side of [-1, 1]) {
      const lift = Math.max(0, s * side) * 3.6;
      const hx = side * 6.5, hy = by + 11;
      const fx = side * 7.5 + s * side * 2.2, fy = -lift;
      const kx = (hx + fx) / 2 + 1.6, ky = (hy + fy) / 2;
      limb(c, [[hx, hy], [kx, ky], [fx, fy - 1]], 5.4, 3.6);
      for (let t = -1; t <= 1; t++) limb(c, [[fx, fy - 1.2], [fx + t * 2.6 + 1, fy + 0.2], [fx + t * 4.2 + 1.6, fy - 0.2]], 1.6, 0.2);
    }
    // back arm
    const as = -s * 0.25;
    limb(c, [[-11, by - 6], [-15.5 + as * 6, by + 5], [-15 + as * 10, by + 17], [-12.5 + as * 12, by + 23]], 4.6, 2.4);
    for (let t = -1; t <= 1; t++) limb(c, [[-12.5 + as * 12, by + 23], [-12 + as * 12 + t * 2.2, by + 26.5]], 1.2, 0.15);
    // body: knobby bulb
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * TAU;
      const r = 1 + 0.07 * Math.sin(a * 5 + 1.3) + 0.05 * Math.sin(a * 9 + 0.4) + (Math.sin(a) > 0.6 ? 0.04 : 0);
      const x = Math.cos(a) * 15 * r, y = by + Math.sin(a) * 14 * r;
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.closePath(); c.fill();
    ell(c, 0.5, by - 13.5, 5.5, 3.5);
    // dangling root beard
    for (let k = 0; k < 6; k++) {
      const x = -9 + k * 3.6 + R(-1, 1, rng);
      limb(c, [[x, by + 10], [x + R(-2, 2, rng) + s * 0.6, by + 15], [x + R(-3, 3, rng), by + 18 + R(0, 3, rng)]], 1.4, 0.1);
    }
    // antler-like leaf crown
    const crown = [-1.25, -0.6, 0.05, 0.6, 1.2];
    crown.forEach((d, i) => {
      const a = -Math.PI / 2 + d + s * 0.05;
      const pts = curlPts(0.5 + d * 3, by - 15, a, 12 + (i & 1) * 3, (d < 0 ? -1 : 1) * 1.2, 6);
      limb(c, pts, 2.6, 0.9, 3);
      const e = pts[pts.length - 1], e2 = pts[pts.length - 2];
      const ea = Math.atan2(e[1] - e2[1], e[0] - e2[0]);
      leaf(c, e[0], e[1], ea, 6.5, 2.0, 0.6);
      leaf(c, pts[3][0], pts[3][1], ea - 1.1, 4.4, 1.3);
      leaf(c, pts[3][0], pts[3][1], ea + 1.1, 4.2, 1.3);
      curl(c, pts[2][0], pts[2][1], ea + (d < 0 ? -1.4 : 1.4), 4.6, (d < 0 ? -6 : 6), 0.7, 0.1);
    });
    // front arm – massive, clawed
    limb(c, [[11, by - 6], [16.5 - as * 6, by + 4], [16.5 - as * 10, by + 16], [14.5 - as * 12, by + 23]], 5.2, 2.6);
    for (let t = -1; t <= 1; t++) limb(c, [[14.5 - as * 12, by + 23], [15.5 - as * 12 + t * 2.4, by + 26], [16.8 - as * 12 + t * 3.2, by + 25.4]], 1.3, 0.15);
    // glowing cracks
    c.save();
    c.strokeStyle = '#ffb8f0';
    c.shadowColor = 'rgba(255,70,210,1)';
    c.shadowBlur = 1.6 * K;
    c.lineCap = 'round'; c.lineJoin = 'round';
    const crack = (pts, w) => { c.lineWidth = w; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts) c.lineTo(p[0], p[1]); c.stroke(); };
    crack([[1, by - 3], [-2.5, by - 7], [-1.5, by - 10], [-4.8, by - 12.5]], 0.7);
    crack([[1, by - 3], [5.5, by - 6.5], [9, by - 5.5], [12.5, by - 8.5]], 0.65);
    crack([[2, by + 2], [-3, by + 5], [-7.5, by + 4], [-10.5, by + 7.5]], 0.6);
    crack([[2, by + 2], [6, by + 7], [9.5, by + 8.2]], 0.55);
    crack([[-2.5, by - 7], [-7.5, by - 6], [-10.5, by - 2]], 0.5);
    c.restore();
    // core
    glowFill(c, (p) => { p.moveTo(1.5, by - 4.2); p.lineTo(4.4, by - 0.4); p.lineTo(1.6, by + 3.6); p.lineTo(-1.3, by - 0.4); p.closePath(); },
      1.5, by - 0.3, 4.4, [[0, '#ffffff'], [0.35, '#ffc2f2'], [1, CRACK]], 2.2, 'rgba(255,60,200,1)');
    // eyes
    glowFill(c, (p) => {
      const ey = by - 8.5;
      p.moveTo(3.2, ey - 0.6); p.lineTo(7.6, ey + 0.6); p.lineTo(3.8, ey + 1.4); p.closePath();
      p.moveTo(13.4, ey - 0.8); p.lineTo(9.2, ey + 0.6); p.lineTo(12.8, ey + 1.4); p.closePath();
    }, 8, by - 8, 6, [[0, '#ffffff'], [0.4, '#ffd0f6'], [1, CRACK]], 1.4, 'rgba(255,70,210,1)');
  }

  /* ===================================================================================== small things */
  function drawTurnipLantern(c) {
    const cy = -6.5;
    ell(c, 0, cy, 5.2, 4.8);
    limb(c, [[-1.4, cy + 3.6], [-2.8, cy + 6], [-4.2, cy + 6.2]], 1.2, 0.1);
    limb(c, [[0, cy - 4.4], [-0.6, cy - 7], [0.6, cy - 8.6]], 1.0, 0.5);
    leaf(c, 0, cy - 5.6, -0.9, 3.4, 0.9);
    leaf(c, -0.3, cy - 5.8, -2.4, 3.0, 0.8);
    curl(c, 0.4, cy - 8.4, -0.3, 2.6, 5, 0.4, 0.1);
    glowFill(c, (p) => {
      p.moveTo(-2.6, cy - 0.6); p.lineTo(-1.0, cy - 2.4); p.lineTo(-0.4, cy - 0.4); p.closePath();
      p.moveTo(0.6, cy - 0.4); p.lineTo(1.4, cy - 2.4); p.lineTo(2.8, cy - 0.6); p.closePath();
      p.moveTo(-2.8, cy + 1.2); p.lineTo(-1.6, cy + 1.7); p.lineTo(-1.0, cy + 1.2); p.lineTo(0, cy + 2.0); p.lineTo(1.0, cy + 1.2); p.lineTo(1.7, cy + 1.7); p.lineTo(2.9, cy + 1.1);
      p.quadraticCurveTo(0.2, cy + 4.4, -2.8, cy + 1.2); p.closePath();
    }, 0, cy, 4.2, [[0, '#ffffe8'], [0.45, '#ffe27a'], [1, '#ffaa2a']], 1.3, 'rgba(255,200,80,1)');
  }

  /* ===================================================================================== props */
  function branch(c, x, y, a, len, w, depth, rng, leaves) {
    const pts = [[x, y]];
    let cx = x, cy = y, aa = a;
    const bend = R(-0.22, 0.22, rng);
    for (let i = 0; i < 3; i++) {
      aa += bend + R(-0.1, 0.1, rng);
      if (Math.sin(aa) > 0.45) aa -= 0.25 * Math.sign(Math.cos(aa) || 1) * -1;
      cx += (Math.cos(aa) * len) / 3; cy += (Math.sin(aa) * len) / 3;
      pts.push([cx, cy]);
    }
    const w1 = Math.max(0.35, w * 0.62);
    limb(c, pts, w, w1, 4);
    if (depth <= 1) for (let i = 1; i < pts.length; i++) leaves.push([pts[i][0], pts[i][1], aa + (i & 1 ? 1 : -1) * R(0.6, 1.1, rng)]);
    if (depth === 0) {
      const sg = rng.next() < 0.5 ? -1 : 1;
      curl(c, cx, cy, aa, len * 0.6, sg * R(4.5, 6.5, rng), w1, 0.12);
      leaves.push([cx, cy, aa + sg * 0.9]);
      return;
    }
    const k = rng.next() < 0.55 ? 2 : 3;
    for (let i = 0; i < k; i++) {
      const da = (i - (k - 1) / 2) * R(0.55, 0.85, rng) + R(-0.15, 0.15, rng);
      branch(c, cx, cy, aa + da, len * R(0.62, 0.76, rng), w1, depth - 1, rng, leaves);
    }
    if (rng.next() < 0.6) {
      const m = pts[1];
      branch(c, m[0], m[1], aa + (rng.next() < 0.5 ? -1 : 1) * R(0.8, 1.2, rng), len * 0.5, w1 * 0.8, Math.max(0, depth - 2), rng, leaves);
    }
  }
  function artTree(c, rng, v) {
    const lean = R(-0.12, 0.12, rng);
    const top = [lean * 26, -46 - v * 3];
    // roots
    for (let k = 0; k < 5; k++) {
      const sd = k < 2 ? -1 : k < 4 ? 1 : (rng.next() < 0.5 ? -1 : 1);
      const ex = sd * R(6, 12, rng);
      limb(c, [[sd * 1.2, -3], [ex * 0.6, -0.6], [ex, 0.6]], 2.4, 0.3);
      if (rng.next() < 0.5) curl(c, ex, 0.6, sd > 0 ? 0 : Math.PI, 2.8, sd * -5, 0.5, 0.1);
    }
    limb(c, [[0, 0.5], [lean * 8 - 1.2, -16], [lean * 18 + 1.4, -32], top], 6.2, 3.2, 6);
    const leaves = [];
    const n = 3 + (v === 1 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const sp = (i - (n - 1) / 2) * R(0.55, 0.75, rng);
      branch(c, top[0], top[1], -Math.PI / 2 + sp + lean, R(17, 21, rng), 2.8, 3, rng, leaves);
    }
    // side boughs from the trunk
    branch(c, lean * 14, -27, -Math.PI / 2 - R(0.9, 1.25, rng), R(15, 19, rng), 2.2, 2, rng, leaves);
    branch(c, lean * 16, -34, -Math.PI / 2 + R(0.9, 1.25, rng), R(14, 18, rng), 2.0, 2, rng, leaves);
    for (const l of leaves) {
      const L = R(2.2, 3.6, rng);
      leaf(c, l[0], l[1], l[2], L, L * 0.28, R(-0.3, 0.3, rng));
    }
    // a hollow in the trunk (light shines through)
    if (v !== 2) cut(c, () => ell(c, lean * 10 + 0.4, -19, 1.0, 1.9));
    // hanging crescent moon ornament / owl on one variant
    if (v === 2) {
      const ox = top[0] + 8, oy = top[1] + 2;
      ell(c, ox, oy, 2.4, 3.0);
      poly(c, [[ox - 2.2, oy - 2.2], [ox - 1.4, oy - 4.2], [ox - 0.6, oy - 2.6]]);
      poly(c, [[ox + 2.2, oy - 2.2], [ox + 1.4, oy - 4.2], [ox + 0.6, oy - 2.6]]);
    }
  }
  function artGate(c, rng) {
    // pillars
    for (const sx of [-17, 17]) {
      c.fillRect(sx - 2.4, -27, 4.8, 27.5);
      c.fillRect(sx - 3.0, -28.5, 6, 2);
      c.fillRect(sx - 3.0, -2, 6, 2.5);
      circ(c, sx, -31.2, 2.2);
      poly(c, [[sx - 0.6, -33], [sx, -36.5], [sx + 0.6, -33]]);
      cut(c, () => { c.beginPath(); c.moveTo(sx - 1.1, -12); c.lineTo(sx - 1.1, -20); c.arc(sx, -20, 1.1, Math.PI, 0); c.lineTo(sx + 1.1, -12); c.closePath(); c.fill(); });
    }
    // bars with spear tips, arched top
    for (let x = -13; x <= 13.01; x += 2.6) {
      const h = 17 + 7 * Math.cos((x / 14) * Math.PI * 0.5);
      c.fillRect(x - 0.32, -h, 0.64, h);
      poly(c, [[x - 0.9, -h + 0.2], [x, -h - 2.4], [x + 0.9, -h + 0.2]]);
    }
    // rails
    c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-14.5, -3); c.lineTo(14.5, -3); c.stroke();
    c.beginPath(); c.moveTo(-14.5, -15); c.lineTo(14.5, -15); c.stroke();
    c.beginPath();
    for (let x = -14.5; x <= 14.5; x += 0.5) { const h = 15.5 + 6.6 * Math.cos((x / 14) * Math.PI * 0.5); if (x === -14.5) c.moveTo(x, -h); else c.lineTo(x, -h); }
    c.stroke();
    // ring lace band
    c.lineWidth = 0.5;
    for (let x = -11.7; x <= 11.8; x += 2.6) { c.beginPath(); c.arc(x + 1.3, -9, 1.1, 0, TAU); c.stroke(); }
    // scrolls at the crown
    curl(c, 0, -19, -Math.PI / 2 - 0.9, 5.5, -6, 0.8, 0.12);
    curl(c, 0, -19, -Math.PI / 2 + 0.9, 5.5, 6, 0.8, 0.12);
    curl(c, -7, -17, Math.PI + 0.4, 4, 6, 0.6, 0.1);
    curl(c, 7, -17, -0.4, 4, -6, 0.6, 0.1);
    star(c, 0, -26, 4, 1.8, 0.6, 0);
    void rng;
  }
  function artFence(c, rng, v) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const x = -15 + i * 5 + R(-0.2, 0.2, rng);
      const h = 14 + (i === 0 || i === n - 1 ? 3 : 0) + R(-0.6, 0.6, rng);
      const tilt = R(-0.06, 0.06, rng) + (v ? 0.04 * (i - 3) / 3 : 0);
      c.save(); c.translate(x, 0); c.rotate(tilt);
      c.fillRect(-0.4, -h, 0.8, h);
      if (i === 0 || i === n - 1) { circ(c, 0, -h - 1, 1.3); } else poly(c, [[-1.1, -h + 0.3], [0, -h - 2.6], [1.1, -h + 0.3]]);
      c.restore();
    }
    c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(-15, -3); c.lineTo(15, -3); c.moveTo(-15, -11); c.lineTo(15, -11); c.stroke();
    for (let i = 0; i < n - 1; i++) {
      const x = -12.5 + i * 5;
      curl(c, x, -7, -Math.PI / 2, 2.4, i & 1 ? 5 : -5, 0.45, 0.08);
      curl(c, x, -7, Math.PI / 2, 2.4, i & 1 ? 5 : -5, 0.45, 0.08);
    }
    // weeds at the base
    for (let k = 0; k < 6; k++) { const x = R(-15, 15, rng); limb(c, [[x, 0.4], [x + R(-1.5, 1.5, rng), -R(3, 6, rng)]], 0.6, 0.08); }
  }
  function grassBase(c, rng, x0, x1) {
    for (let k = 0; k < 9; k++) {
      const x = R(x0, x1, rng), h = R(2, 4.8, rng);
      limb(c, [[x, 0.6], [x + R(-0.8, 0.8, rng), -h * 0.6], [x + R(-1.6, 1.6, rng), -h]], 0.7, 0.06);
    }
  }
  function artGrave(c, rng, kind) {
    if (kind === 0) {
      // celtic cross with see-through ring
      c.save(); c.translate(0, 0); c.rotate(R(-0.06, 0.06, rng));
      c.fillRect(-1.3, -20, 2.6, 20);
      c.fillRect(-6, -15.2, 12, 2.6);
      c.lineWidth = 1.3; c.beginPath(); c.arc(0, -13.9, 4.1, 0, TAU); c.stroke();
      circ(c, 0, -21.2, 1.3);
      c.restore();
      ell(c, 0, 0.2, 5.8, 1.6);
    } else if (kind === 1) {
      const tilt = R(-0.12, 0.12, rng);
      c.save(); c.rotate(tilt);
      c.beginPath(); c.moveTo(-5.5, 0); c.lineTo(-5.5, -10); c.arc(0, -10, 5.5, Math.PI, 0); c.lineTo(5.5, 0); c.closePath(); c.fill();
      // crescent moon window
      cut(c, () => { c.beginPath(); c.arc(0, -10.5, 2.4, 0, TAU); c.fill(); });
      c.beginPath(); c.arc(1.1, -11.2, 2.1, 0, TAU); c.fill();
      // scalloped rim
      for (let a = 0; a <= 8; a++) { const t = Math.PI + (a / 8) * Math.PI; circ(c, Math.cos(t) * 5.6, -10 + Math.sin(t) * 5.6, 0.7); }
      c.restore();
    } else {
      // crooked wooden cross with a wreath
      c.save(); c.rotate(R(0.08, 0.16, rng) * (rng.next() < 0.5 ? -1 : 1));
      limb(c, [[0, 0.5], [0.2, -10], [-0.1, -18]], 1.9, 1.5);
      limb(c, [[-5, -13], [0, -13.4], [5.2, -13.1]], 1.5, 1.3);
      c.lineWidth = 0.9; c.beginPath(); c.arc(0, -10.4, 3, 0, TAU); c.stroke();
      for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU; leaf(c, Math.cos(a) * 3, -10.4 + Math.sin(a) * 3, a + 1.6, 1.8, 0.5); }
      c.restore();
    }
    grassBase(c, rng, -6, 6);
  }
  function artScarecrow(c, rng) {
    limb(c, [[0, 0.5], [0.3, -24], [0, -46]], 1.6, 1.2);
    limb(c, [[-15, -33], [0, -33.6], [15, -32.6]], 1.2, 1.0);
    // coat
    c.beginPath();
    c.moveTo(-4.2, -38); c.lineTo(4.4, -38);
    c.lineTo(5.6, -22);
    for (let k = 0; k <= 8; k++) { const x = 5.6 - (k / 8) * 11.6; c.lineTo(x, -21 + (k & 1 ? -2.2 : 0.8) + R(-0.5, 0.5, rng)); }
    c.closePath(); c.fill();
    // sleeves with tattered strips + straw
    for (const sd of [-1, 1]) {
      c.beginPath(); c.moveTo(sd * 3.5, -37.6); c.lineTo(sd * 12.5, -35); c.lineTo(sd * 12.6, -31); c.lineTo(sd * 3.5, -31.5); c.closePath(); c.fill();
      for (let k = 0; k < 3; k++) limb(c, [[sd * (6 + k * 2.6), -31.3], [sd * (6.4 + k * 2.6), -28.5 - R(0, 1.5, rng)]], 1.0, 0.15);
      for (let k = 0; k < 5; k++) limb(c, [[sd * 12.5, -33], [sd * (14 + R(0.5, 2.5, rng)), -33 + R(-2.5, 2.5, rng)]], 0.45, 0.05);
    }
    // head + hat
    circ(c, 0.3, -41, 3.8);
    for (let k = 0; k < 5; k++) limb(c, [[R(-2, 2, rng), -38], [R(-3, 3, rng), -36.4]], 0.4, 0.05);
    c.beginPath(); c.ellipse(0.3, -44.4, 6.8, 1.1, -0.05, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-3, -44.6); c.lineTo(-1.4, -50.5); c.quadraticCurveTo(1.8, -51, 3.6, -48.5); c.lineTo(5.4, -49.6); c.lineTo(3.4, -44.4); c.closePath(); c.fill();
    // crow on the arm
    const bx = 10.5, by = -35.6;
    ell(c, bx, by - 1.6, 2.2, 1.5, -0.3);
    circ(c, bx + 1.8, by - 3.2, 1.1);
    poly(c, [[bx + 2.6, by - 3.6], [bx + 4.4, by - 3.0], [bx + 2.6, by - 2.7]]);
    poly(c, [[bx - 1.6, by - 1.2], [bx - 4.4, by - 0.4], [bx - 3.8, by + 0.4], [bx - 1.2, by - 0.6]]);
  }
  function artCrowPost(c, rng, fr) {
    limb(c, [[0, 0.5], [0.2, -10], [-0.2, -19]], 1.7, 1.5);
    c.fillRect(-1.4, -19.6, 2.8, 1.2);
    const by = -20;
    // body
    ell(c, 0, by - 2.4, 3.0, 2.0, -0.25);
    poly(c, [[-2.4, by - 1.8], [-6.4, by - 0.4], [-5.8, by + 0.8], [-2, by - 1.0]]);
    limb(c, [[0.5, by - 0.6], [0.4, by + 0.4]], 0.4, 0.3);
    if (fr === 0) {
      circ(c, 2.6, by - 4.4, 1.5);
      poly(c, [[3.6, by - 5.0], [6.2, by - 4.2], [3.6, by - 3.8]]);
      // head feathers
      limb(c, [[2.4, by - 5.6], [1.6, by - 7.0]], 0.4, 0.05);
    } else {
      circ(c, 3.0, by - 2.6, 1.5);
      poly(c, [[4.0, by - 2.6], [5.8, by - 0.6], [3.6, by - 1.6]]);
      // wing flick
      poly(c, [[-0.6, by - 3.4], [-3.2, by - 7.6], [-1.0, by - 6.6], [1.2, by - 3.6]]);
    }
    curl(c, 0.2, -6, Math.PI, 2.2, 5, 0.5, 0.1);
    void rng;
  }
  function artLanternPole(c) {
    limb(c, [[0, 0.5], [0.2, -18], [0, -33]], 1.5, 1.1);
    limb(c, curlPts(0, -33, -Math.PI / 2 + 0.25, 7.5, 3.6, 10), 1.0, 0.6, 3);
    curl(c, 0, -26, Math.PI + 0.5, 3, 5.5, 0.5, 0.1);
    curl(c, 0, -26, -0.5 + 0.2, 3, -5.5, 0.5, 0.1);
    for (const sd of [-1, 1]) limb(c, [[0, -0.2], [sd * 3.0, 0.4]], 1.0, 0.3);
    // chain
    c.lineWidth = 0.35; c.beginPath(); c.moveTo(6.6, -33.4); c.lineTo(6.6, -30.4); c.stroke();
    // lantern
    const lx = 6.6, ly = -25.6;
    poly(c, [[lx - 3.2, ly - 3.2], [lx, ly - 5.6], [lx + 3.2, ly - 3.2]]);
    circ(c, lx, ly - 5.8, 0.7);
    c.fillRect(lx - 2.8, ly + 2.8, 5.6, 1.1);
    c.fillRect(lx - 1.6, ly + 3.9, 3.2, 0.8);
    glowFill(c, (p) => { p.rect(lx - 2.3, ly - 3.0, 4.6, 5.8); }, lx, ly, 4.5, [[0, '#ffffe6'], [0.5, '#ffe08a'], [1, '#ffaa3a']], 1.2, 'rgba(255,200,90,1)');
    c.fillRect(lx - 0.25, ly - 3.1, 0.5, 6);
    c.fillRect(lx - 2.6, ly - 0.3, 5.2, 0.4);
    c.fillRect(lx - 2.9, ly - 3.2, 0.6, 6.2); c.fillRect(lx + 2.3, ly - 3.2, 0.6, 6.2);
  }
  function artPumpkins(c, rng, v) {
    const glows = [];
    const list = v === 0 ? [[0, 0, 6.2, true]] : v === 1 ? [[-4.5, 0, 5.2, true], [5, 0.5, 4.0, false]] : [[-6, 0, 4.4, false], [2, 0.6, 6.0, true], [9, 0.2, 3.4, rng.next() < 0.5]];
    // curly vines on the ground
    for (let k = 0; k < 3; k++) {
      const x0 = R(-8, 8, rng);
      const pts = curlPts(x0, 0.4, rng.next() < 0.5 ? 0.1 : Math.PI - 0.1, R(8, 13, rng), R(-1.5, 1.5, rng), 8);
      limb(c, pts, 0.7, 0.2, 3);
      const e = pts[pts.length - 1];
      curl(c, e[0], e[1], -Math.PI / 2, 2.4, rng.next() < 0.5 ? 5 : -5, 0.35, 0.06);
      const m = pts[4];
      // lobed leaf
      for (let l = -1; l <= 1; l++) leaf(c, m[0], m[1], -Math.PI / 2 + l * 0.7, 3.4 - Math.abs(l) * 0.6, 1.0);
    }
    for (const [x, y, r, lit] of list) {
      const cy = y - r * 0.8;
      pumpkinShape(c, x, cy, r, r * 0.8);
      limb(c, [[x, cy - r * 0.7], [x + 0.4, cy - r * 0.95], [x + 1.4, cy - r * 1.15]], 1.1, 0.7);
      if (lit) {
        const k = r / 6;
        glowFill(c, (p) => {
          p.moveTo(x - 2.6 * k, cy - 0.4 * k); p.lineTo(x - 1.3 * k, cy - 2.4 * k); p.lineTo(x - 0.4 * k, cy - 0.3 * k); p.closePath();
          p.moveTo(x + 0.4 * k, cy - 0.3 * k); p.lineTo(x + 1.3 * k, cy - 2.4 * k); p.lineTo(x + 2.6 * k, cy - 0.4 * k); p.closePath();
          p.moveTo(x - 3.2 * k, cy + 1.0 * k); p.lineTo(x - 2 * k, cy + 1.5 * k); p.lineTo(x - 1.3 * k, cy + 0.9 * k); p.lineTo(x, cy + 1.7 * k);
          p.lineTo(x + 1.3 * k, cy + 0.9 * k); p.lineTo(x + 2 * k, cy + 1.5 * k); p.lineTo(x + 3.2 * k, cy + 1.0 * k);
          p.quadraticCurveTo(x, cy + 4.6 * k, x - 3.2 * k, cy + 1.0 * k); p.closePath();
        }, x, cy + 0.6 * k, 4 * k, FACE_STOPS, 1.1, 'rgba(255,150,40,1)');
        glows.push([x, cy, r * 1.8]);
      }
    }
    return glows;
  }
  function artWeed(c, rng, v) {
    if (v === 0) {
      // thistles
      for (let k = 0; k < 3; k++) {
        const x = R(-4, 4, rng), h = R(8, 13, rng), tx = x + R(-2, 2, rng);
        limb(c, [[x, 0.5], [(x + tx) / 2 + R(-1, 1, rng), -h * 0.5], [tx, -h]], 0.6, 0.35);
        ell(c, tx, -h - 0.8, 1.2, 1.4);
        for (let s = 0; s < 7; s++) { const a = -Math.PI / 2 + (s - 3) * 0.32; limb(c, [[tx, -h - 1.6], [tx + Math.cos(a) * 2.6, -h - 1.6 + Math.sin(a) * 2.6]], 0.3, 0.05); }
        for (let s = 0; s < 2; s++) { const yy = -h * R(0.25, 0.6, rng); const sd = s ? 1 : -1; leaf(c, x + (tx - x) * 0.4, yy, (sd > 0 ? -0.5 : Math.PI + 0.5), 3, 0.6); }
      }
    } else if (v === 1) {
      // tall grass clump with seed heads
      for (let k = 0; k < 11; k++) {
        const x = R(-3, 3, rng), h = R(6, 14, rng), lean = R(-0.5, 0.5, rng);
        const pts = [[x, 0.5], [x + lean * h * 0.3, -h * 0.5], [x + lean * h * 0.8, -h]];
        limb(c, pts, 0.75, 0.06);
        if (rng.next() < 0.3) { const e = pts[2]; leaf(c, e[0], e[1] + 1.5, -Math.PI / 2 + lean, 2.4, 0.45); }
      }
    } else {
      // fiddlehead ferns
      for (let k = 0; k < 4; k++) {
        const x = R(-3.5, 3.5, rng), sd = x < 0 ? -1 : 1, h = R(6, 10, rng);
        const pts = [[x, 0.5], [x + sd * 0.6, -h * 0.6], [x + sd * 1.6, -h]];
        limb(c, pts, 0.8, 0.5);
        curl(c, x + sd * 1.6, -h, -Math.PI / 2 + sd * 0.4, 3.6, sd * 6.5, 0.5, 0.1);
        for (let s = 1; s <= 3; s++) leaf(c, x + sd * 0.3 * s, -h * s * 0.2, -Math.PI / 2 - sd * 1.1, 1.8, 0.4);
      }
    }
  }

  /* ===================================================================================== sprite set */
  const SPR = {};
  function buildSprites() {
    // Jack
    const J = { walk: [[], []], idle: [[], []], walkR: [[], []], idleR: [[], []], walkH: [[], []], idleH: [[], []] };
    const jb = [-14, -33, 9, 1.5];
    const jackFrame = (ph, moving) => mk(jb[0], jb[1], jb[2], jb[3], (c) => drawJack(c, ph, moving), { pad: 3 });
    for (let i = 0; i < 6; i++) {
      const s = jackFrame(i / 6, true), r = rimSpr(s, '#ffb24a', 1.3), hr = rimSpr(s, '#ffffff', 1.1);
      J.walk[0][i] = s; J.walk[1][i] = flipSpr(s);
      J.walkR[0][i] = r; J.walkR[1][i] = flipSpr(r);
      J.walkH[0][i] = hr; J.walkH[1][i] = flipSpr(hr);
    }
    for (let i = 0; i < 4; i++) {
      const s = jackFrame(i / 4, false), r = rimSpr(s, '#ffb24a', 1.3), hr = rimSpr(s, '#ffffff', 1.1);
      J.idle[0][i] = s; J.idle[1][i] = flipSpr(s);
      J.idleR[0][i] = r; J.idleR[1][i] = flipSpr(r);
      J.idleH[0][i] = hr; J.idleH[1][i] = flipSpr(hr);
    }
    J.dash = [U.tint(J.walk[0][1].c, 'rgba(20,6,26,1)'), null];
    J.dash = [{ c: J.dash[0], ax: J.walk[0][1].ax, ay: J.walk[0][1].ay }];
    J.dash[1] = flipSpr(J.dash[0]);
    SPR.jack = J;

    // creeper: 2 variants × 6 frames
    const CR = { n: [], rim: [], sh: [] };
    for (let v = 0; v < 2; v++) {
      CR.n[v] = [[], []]; CR.rim[v] = [[], []];
      for (let i = 0; i < 6; i++) {
        const s = mk(-12, -30, 12, 1.5, (c) => drawCreeper(c, i / 6, v), { pad: 2.5 });
        const r = rimSpr(s, '#fff6dc', 1.2);
        CR.n[v][0][i] = s; CR.n[v][1][i] = flipSpr(s);
        CR.rim[v][0][i] = r; CR.rim[v][1][i] = flipSpr(r);
      }
    }
    CR.sh = [tornShards(CR.n[0][0][0], 5, 71), tornShards(CR.n[0][1][0], 5, 72)];
    SPR.creeper = CR;

    // ghost: 4 frames
    const GH = { n: [[], []], rim: [[], []] };
    for (let i = 0; i < 4; i++) {
      const s = buildGhost(i / 4);
      const r = rimSpr(s, '#ffffff', 1.0);
      GH.n[0][i] = s; GH.n[1][i] = flipSpr(s);
      GH.rim[0][i] = r; GH.rim[1][i] = flipSpr(r);
    }
    GH.sh = [tornShards(GH.n[0][0], 4, 81), tornShards(GH.n[1][0], 4, 82)];
    SPR.ghost = GH;

    // colossus: 6 frames
    const CO = { n: [[], []], rim: [[], []] };
    for (let i = 0; i < 6; i++) {
      const s = mk(-21, -62, 23, 1.5, (c) => drawColossus(c, i / 6), { pad: 3 });
      const r = rimSpr(s, '#fff0dc', 1.6);
      CO.n[0][i] = s; CO.n[1][i] = flipSpr(s);
      CO.rim[0][i] = r; CO.rim[1][i] = flipSpr(r);
    }
    CO.sh = [tornShards(CO.n[0][0], 7, 91), tornShards(CO.n[1][0], 7, 92)];
    SPR.colossus = CO;

    // glows
    SPR.gWarm = glowSpr(14, [[0, 'rgba(255,214,130,0.85)'], [0.35, 'rgba(255,150,60,0.35)'], [1, 'rgba(255,90,20,0)']]);
    SPR.gFace = glowSpr(9, [[0, 'rgba(255,230,150,0.9)'], [0.4, 'rgba(255,160,50,0.35)'], [1, 'rgba(255,100,20,0)']]);
    SPR.gGold = glowSpr(10, [[0, 'rgba(255,240,170,0.95)'], [0.3, 'rgba(255,200,90,0.45)'], [1, 'rgba(255,140,40,0)']]);
    SPR.gPink = glowSpr(12, [[0, 'rgba(255,190,240,0.95)'], [0.3, 'rgba(255,80,210,0.45)'], [1, 'rgba(200,40,180,0)']]);
    SPR.gCyan = glowSpr(6, [[0, 'rgba(230,255,255,1)'], [0.3, 'rgba(120,255,235,0.55)'], [1, 'rgba(40,200,220,0)']]);
    SPR.gGreen = glowSpr(6, [[0, 'rgba(230,255,170,0.9)'], [0.35, 'rgba(170,255,70,0.4)'], [1, 'rgba(120,220,40,0)']]);
    SPR.ember = glowSpr(3, [[0, 'rgba(255,250,215,1)'], [0.25, 'rgba(255,190,80,0.85)'], [0.6, 'rgba(255,110,30,0.25)'], [1, 'rgba(255,70,10,0)']]);
    SPR.emberC = glowSpr(3, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(210,240,255,0.8)'], [0.6, 'rgba(150,200,255,0.25)'], [1, 'rgba(120,170,255,0)']]);
    SPR.emberP = glowSpr(3, [[0, 'rgba(255,240,255,1)'], [0.25, 'rgba(255,120,220,0.85)'], [0.6, 'rgba(230,60,190,0.25)'], [1, 'rgba(200,40,170,0)']]);
    SPR.pool = glowSpr(30, [[0, 'rgba(255,214,140,0.55)'], [0.5, 'rgba(255,170,90,0.22)'], [1, 'rgba(255,120,60,0)']]);
    SPR.contact = glowSpr(10, [[0, 'rgba(14,5,20,0.55)'], [0.55, 'rgba(14,5,20,0.28)'], [1, 'rgba(14,5,20,0)']]);
    // flare: 4-point light star
    SPR.flare = mk(-9, -9, 9, 9, (c) => {
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 3.5);
      g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(1, 'rgba(255,190,90,0)');
      c.fillStyle = g; circ(c, 0, 0, 3.5);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU, L = k & 1 ? 6 : 9;
        const gg = c.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
        gg.addColorStop(0, 'rgba(255,250,220,0.95)'); gg.addColorStop(1, 'rgba(255,180,80,0)');
        c.fillStyle = gg;
        leaf(c, 0, 0, a, L, 0.55);
      }
    }, { pad: 0.5 });
    SPR.ring = mk(-12, -12, 12, 12, (c) => {
      c.strokeStyle = 'rgba(255,220,150,0.9)'; c.lineWidth = 0.8; c.shadowColor = 'rgba(255,160,60,1)'; c.shadowBlur = 1.2 * K;
      c.beginPath(); c.arc(0, 0, 10.5, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,230,170,0.9)';
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; star(c, Math.cos(a) * 10.5, Math.sin(a) * 10.5, 4, 1.2, 0.35, a); }
    }, { pad: 1.5 });
    SPR.streak = mk(-6, -1, 1, 1, (c) => {
      const g = c.createLinearGradient(-6, 0, 1, 0);
      g.addColorStop(0, 'rgba(255,160,60,0)'); g.addColorStop(1, 'rgba(255,250,220,1)');
      c.fillStyle = g; leaf(c, -6, 0, 0, 7, 0.4);
    }, { pad: 0.3 });
    SPR.scrap = [];
    for (let k = 0; k < 5; k++) {
      SPR.scrap[k] = mk(-2.5, -2.5, 2.5, 2.5, (c) => {
        const r = U.rng(600 + k);
        const pts = [];
        const n = 4 + (k % 3);
        for (let i = 0; i < n; i++) { const a = (i / n) * TAU + R(-0.3, 0.3, r); const rr = R(1.0, 2.2, r); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.8]); }
        poly(c, pts);
        if (k < 3) {
          c.globalCompositeOperation = 'source-atop';
          c.strokeStyle = '#ff9a3a'; c.lineWidth = 0.5;
          c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke();
        }
      }, { pad: 0.4 });
    }
    SPR.wisp = mk(-3, -3, 3, 3, (c) => {
      c.fillStyle = 'rgba(225,240,255,0.85)';
      limb(c, curlPts(-2.4, 1.6, -0.6, 5.5, 4, 8), 1.1, 0.1, 3);
    }, { pad: 0.5 });
    // projectile: glowing pumpkin seed
    SPR.seed = mk(-2.6, -1.6, 2.6, 1.6, (c) => {
      c.shadowColor = 'rgba(255,190,80,1)'; c.shadowBlur = 1.2 * K;
      const g = c.createLinearGradient(-2.4, 0, 2.4, 0);
      g.addColorStop(0, '#ffcf7a'); g.addColorStop(0.6, '#fff6d8'); g.addColorStop(1, '#ffffff');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(2.5, 0); c.quadraticCurveTo(0.4, -2.2, -2.2, -0.6); c.quadraticCurveTo(-2.7, 0, -2.2, 0.6); c.quadraticCurveTo(0.4, 2.2, 2.5, 0); c.fill();
    }, { pad: 1.2 });
    SPR.trail = mk(-11, -1.6, 0, 1.6, (c) => {
      const g = c.createLinearGradient(-11, 0, 0, 0);
      g.addColorStop(0, 'rgba(255,120,30,0)'); g.addColorStop(0.6, 'rgba(255,170,70,0.45)'); g.addColorStop(1, 'rgba(255,235,170,0.9)');
      c.fillStyle = g; leaf(c, -11, 0, 0, 11, 0.85);
    }, { pad: 0.3 });
    // orbital
    SPR.lantern = mk(-6, -16, 6, 1, (c) => drawTurnipLantern(c), { pad: 1.5 });
    // gems
    SPR.gem = mk(-2, -3, 2, 1, (c) => {
      c.fillStyle = INK;
      c.beginPath(); c.moveTo(0, -3.3); c.quadraticCurveTo(2.4, -0.6, 0, 1.2); c.quadraticCurveTo(-2.4, -0.6, 0, -3.3); c.fill();
      const g = c.createRadialGradient(0, -0.6, 0, 0, -0.6, 2);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#b8fff4'); g.addColorStop(1, '#3fe0d8');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(0, -2.5); c.quadraticCurveTo(1.6, -0.6, 0, 0.5); c.quadraticCurveTo(-1.6, -0.6, 0, -2.5); c.fill();
    }, { pad: 0.6 });
    SPR.gemBig = mk(-4, -6, 4, 2, (c) => {
      c.fillStyle = INK;
      c.beginPath(); c.moveTo(0, -6.2); c.quadraticCurveTo(4.4, -1.4, 0, 2); c.quadraticCurveTo(-4.4, -1.4, 0, -6.2); c.fill();
      curl(c, 0, -6, -2.2, 2.4, -5, 0.45, 0.1);
      const g = c.createRadialGradient(0, -1.4, 0, 0, -1.4, 3.6);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#fff0a8'); g.addColorStop(1, '#ffb03a');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(0, -4.9); c.quadraticCurveTo(3.1, -1.4, 0, 1.0); c.quadraticCurveTo(-3.1, -1.4, 0, -4.9); c.fill();
    }, { pad: 0.6 });

    // props
    const P = {};
    P.tree = [0, 1, 2].map((v) => mk(-58, -114, 58, 4, (c) => artTree(c, U.rng(900 + v * 17), v), { pad: 1 }));
    P.tree = P.tree.concat(P.tree.map(flipSpr));
    P.gate = [mk(-21, -38, 21, 1, (c) => artGate(c, U.rng(950)), { pad: 1 })];
    P.fence = [0, 1].map((v) => mk(-17, -20, 17, 1, (c) => artFence(c, U.rng(960 + v), v), { pad: 1 }));
    P.grave = [0, 1, 2].map((v) => mk(-8, -24, 8, 1, (c) => artGrave(c, U.rng(970 + v * 3), v), { pad: 1 }));
    P.scare = [mk(-19, -53, 19, 1, (c) => artScarecrow(c, U.rng(980)), { pad: 1 })];
    P.crow = [0, 1].map((fr) => mk(-8, -29, 8, 1, (c) => artCrowPost(c, U.rng(990), fr), { pad: 1 }));
    P.lamp = [mk(-5, -40, 11, 1, (c) => artLanternPole(c), { pad: 1.5 })];
    P.lamp[0].glow = [[6.6, -25.6, 9]];
    P.pump = [0, 1, 2].map((v) => { let gl; const s = mk(-17, -14, 17, 2, (c) => { gl = artPumpkins(c, U.rng(1000 + v * 7), v); }, { pad: 1.5 }); s.glow = gl; return s; });
    P.pump = P.pump.concat(P.pump.map(flipSpr));
    P.weed = [0, 1, 2].map((v) => mk(-8, -17, 8, 1, (c) => artWeed(c, U.rng(1100 + v * 5), v), { pad: 1 }));
    SPR.props = P;
  }

  /* ===================================================================================== ground: light fields */
  const TH = [-0.95, -0.3, 0.35]; // teal | violet | crimson | amber
  const BW = 0.075;
  const BANDS = [
    { e: [44, 116, 140], c: [118, 204, 198] },  // teal moonlight
    { e: [104, 64, 162], c: [182, 130, 220] },  // violet dusk
    { e: [176, 42, 66], c: [242, 106, 82] },    // crimson
    { e: [234, 122, 44], c: [255, 198, 98] },  // amber glow
  ];
  const HOT = [255, 240, 196];
  function fval(x, y) {
    return (U.warped(x / 1300, y / 1300, 501, 0.85, 3) - 0.5) * 9.5 + (U.fbm(x / 420, y / 420, 502, 2) - 0.5) * 0.9;
  }
  function bandOf(f) { return f < TH[0] ? 0 : f < TH[1] ? 1 : f < TH[2] ? 2 : 3; }
  /** depth into its band in f units (distance to nearest threshold). */
  function depthOf(f) {
    let d = 1e9;
    for (let i = 0; i < 3; i++) { const dd = Math.abs(f - TH[i]); if (dd < d) d = dd; }
    return d;
  }
  function matAt(x, y) { const f = fval(x, y); return { b: bandOf(f), d: depthOf(f), f }; }
  function bandCol(i, f, gl, out) {
    let depth;
    if (i === 0) depth = TH[0] - f;
    else if (i === 3) depth = f - TH[2];
    else depth = Math.min(f - TH[i - 1], TH[i] - f);
    if (depth < 0) depth = 0;
    const B = BANDS[i];
    const t = U.smoothstep(0.0, 0.75, depth) * (0.55 + 0.45 * gl);
    out[0] = B.e[0] + (B.c[0] - B.e[0]) * t;
    out[1] = B.e[1] + (B.c[1] - B.e[1]) * t;
    out[2] = B.e[2] + (B.c[2] - B.e[2]) * t;
    if (i === 3) {
      const h = U.smoothstep(0.9, 2.2, depth) * (0.25 + 0.4 * gl);
      out[0] += (HOT[0] - out[0]) * h; out[1] += (HOT[1] - out[1]) * h; out[2] += (HOT[2] - out[2]) * h;
    }
  }
  const TMPC = [0, 0, 0], FW = [0, 0, 0, 0];
  function fieldColor(f, gl, out) {
    const s0 = U.smoothstep(TH[0] - BW, TH[0] + BW, f), s1 = U.smoothstep(TH[1] - BW, TH[1] + BW, f), s2 = U.smoothstep(TH[2] - BW, TH[2] + BW, f);
    const w = FW; w[0] = 1 - s0; w[1] = s0 - s1; w[2] = s1 - s2; w[3] = s2;
    out[0] = out[1] = out[2] = 0;
    for (let i = 0; i < 4; i++) {
      if (w[i] < 0.001) continue;
      bandCol(i, f, gl, TMPC);
      out[0] += TMPC[0] * w[i]; out[1] += TMPC[1] * w[i]; out[2] += TMPC[2] * w[i];
    }
    const m = 0.9 + 0.2 * gl;
    out[0] *= m; out[1] *= m; out[2] *= m;
    return 1 - s0; // teal weight
  }

  let GRAIN = null, LACE = null;
  function buildGrain() {
    const N = 256;
    const raw = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) raw[y * N + x] = U.hash2(x, y, 77) - 0.5;
    const out = new Int8Array(N * N);
    // soft grain + paper fibres
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += raw[((y + dy) & 255) * N + ((x + dx) & 255)];
      out[y * N + x] = Math.round(s * 3.2 + raw[y * N + x] * 5);
    }
    const rng = U.rng(4711);
    for (let f = 0; f < 70; f++) {
      let x = rng.next() * N, y = rng.next() * N, a = rng.next() * TAU;
      const L = 8 + rng.next() * 26, v = 4;
      for (let i = 0; i < L; i++) {
        a += (rng.next() - 0.5) * 0.4;
        x += Math.cos(a); y += Math.sin(a);
        const k = (((y | 0) & 255) * N) + ((x | 0) & 255);
        out[k] = Math.max(-127, Math.min(127, out[k] + v));
      }
    }
    GRAIN = out;
  }

  function* renderGround(ctx, info) {
    const res = info.res, W = info.px, wx = info.wx, wy = info.wy;
    const M = 8, ST = 4, NG = Math.round((256 + 2 * M) / ST) + 1;
    const gx0 = wx - M, gy0 = wy - M;
    const F = new Float32Array(NG * NG), GL = new Float32Array(NG * NG);
    const CH = 6;
    const g = new Float32Array(NG * NG * CH);
    for (let j = 0; j < NG; j++) {
      if ((j & 3) === 3) yield;
      const y = gy0 + j * ST;
      for (let i = 0; i < NG; i++) {
        const x = gx0 + i * ST, k = j * NG + i;
        F[k] = fval(x, y);
        GL[k] = U.fbm(x / 520, y / 520, 503, 3);
        g[k * CH + 4] = y * 0.72 + 7 * U.perlin(x / 95, y / 95, 504) + 2.5 * U.perlin(x / 33, y / 33, 505);
      }
    }
    yield;
    const col = [0, 0, 0];
    for (let j = 0; j < NG; j++) {
      if ((j & 7) === 7) yield;
      for (let i = 0; i < NG; i++) {
        const k = j * NG + i, q = k * CH;
        const tw = fieldColor(F[k], GL[k], col);
        g[q] = col[0]; g[q + 1] = col[1]; g[q + 2] = col[2]; g[q + 3] = tw;
        const il = Math.max(0, i - 1), ir = Math.min(NG - 1, i + 1), jt = Math.max(0, j - 1), jb = Math.min(NG - 1, j + 1);
        const gx = (F[j * NG + ir] - F[j * NG + il]) / ((ir - il) * ST), gy = (F[jb * NG + i] - F[jt * NG + i]) / ((jb - jt) * ST);
        const gm = Math.hypot(gx, gy) + 1e-5;
        let t = TH[0], dd = 1e9;
        for (let m = 0; m < 3; m++) { const d = Math.abs(F[k] - TH[m]); if (d < dd) { dd = d; t = TH[m]; } }
        g[q + 5] = U.clamp((F[k] - t) / gm, -60, 60);
      }
    }
    yield;
    const img = ctx.createImageData(W, W), d = img.data;
    const inv = 1 / (res * ST), off = M / ST;
    const gpx = Math.round(wx * res), gpy = Math.round(wy * res);
    const LR = LACE_RGB[0], LG = LACE_RGB[1], LB = LACE_RGB[2];
    for (let py = 0; py < W; py++) {
      if ((py & 1) === 1) yield;
      const gyf = (py + 0.5) * inv + off, j0 = gyf | 0, fy = gyf - j0;
      const grow = ((gpy + py) & 255) * 256;
      for (let px = 0; px < W; px++) {
        const gxf = (px + 0.5) * inv + off, i0 = gxf | 0, fx = gxf - i0;
        const q00 = (j0 * NG + i0) * CH, q10 = q00 + CH, q01 = q00 + NG * CH, q11 = q01 + CH;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        let r = g[q00] * w00 + g[q10] * w10 + g[q01] * w01 + g[q11] * w11;
        let gg = g[q00 + 1] * w00 + g[q10 + 1] * w10 + g[q01 + 1] * w01 + g[q11 + 1] * w11;
        let b = g[q00 + 2] * w00 + g[q10 + 2] * w10 + g[q01 + 2] * w01 + g[q11 + 2] * w11;
        const tw = g[q00 + 3] * w00 + g[q10 + 3] * w10 + g[q01 + 3] * w01 + g[q11 + 3] * w11;
        const sd = g[q00 + 5] * w00 + g[q10 + 5] * w10 + g[q01 + 5] * w01 + g[q11 + 5] * w11;
        const asd = sd < 0 ? -sd : sd;
        // light bleeding along the cut edge between fields
        if (asd < 6) {
          const e = 1 - asd / 6, h = e * e * 0.22;
          r += (255 - r) * h; gg += (240 - gg) * h; b += (215 - b) * h;
        }
        // moonlit ripples on teal water-light
        if (tw > 0.02) {
          const ph = g[q00 + 4] * w00 + g[q10 + 4] * w10 + g[q01 + 4] * w01 + g[q11 + 4] * w11;
          const sn = Math.sin(ph);
          if (sn > 0.86) {
            const l = (sn - 0.86) * 7.1 * tw * 0.42;
            r += (215 - r) * l; gg += (255 - gg) * l; b += (245 - b) * l;
          }
        }
        const gr = GRAIN[grow + ((gpx + px) & 255)];
        r += gr; gg += gr * 0.9; b += gr * 0.8;
        // the boundary line itself
        const a = (0.36 - asd) * res + 0.5;
        if (a > 0) { const t = (a > 1 ? 1 : a) * 0.85; r += (LR - r) * t; gg += (LG - gg) * t; b += (LB - b) * t; }
        const o = (py * W + px) * 4;
        d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255;
      }
    }
    for (let b0 = 0; b0 < W; b0 += 96) { ctx.putImageData(img, 0, 0, 0, b0, W, Math.min(96, W - b0)); yield; }
    // ---- lace layer (opaque ink, composited translucently so the light glows through)
    if (!LACE || LACE.c.width !== W) LACE = U.canvas(W, W);
    const L = LACE;
    const lc = L.ctx;
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.clearRect(0, 0, W, W);
    lc.setTransform(res, 0, 0, res, -wx * res, -wy * res);
    lc.fillStyle = INK; lc.strokeStyle = INK; lc.lineCap = 'round'; lc.lineJoin = 'round';
    const look = (x, y) => {
      const gxf = (x - gx0) / ST, gyf = (y - gy0) / ST;
      const i0 = U.clamp(gxf | 0, 0, NG - 2), j0 = U.clamp(gyf | 0, 0, NG - 2);
      const fx = U.clamp(gxf - i0, 0, 1), fy = U.clamp(gyf - j0, 0, 1);
      const k = j0 * NG + i0;
      const f = (F[k] * (1 - fx) + F[k + 1] * fx) * (1 - fy) + (F[k + NG] * (1 - fx) + F[k + NG + 1] * fx) * fy;
      const ngx = (F[k + 1] - F[k] + F[k + NG + 1] - F[k + NG]) * 0.5, ngy = (F[k + NG] - F[k] + F[k + NG + 1] - F[k + 1]) * 0.5;
      const q = k * CH + 5;
      const sd = (g[q] * (1 - fx) + g[q + CH] * fx) * (1 - fy) + (g[q + NG * CH] * (1 - fx) + g[q + NG * CH + CH] * fx) * fy;
      const nm = Math.hypot(ngx, ngy) || 1;
      return { f, sd, nx: ngx / nm, ny: ngy / nm };
    };
    // boundary lace motifs
    let cnt = 0;
    const lace = [];
    G.scatter(info, 4.2, 6101, 3, (x, y, rng) => lace.push([x, y, rng.next(), rng.next()]));
    for (const [x, y, r1, r2] of lace) {
      if ((++cnt & 31) === 0) yield;
      const L0 = look(x, y);
      if (Math.abs(L0.sd) > 2.4) continue;
      const bx = x - L0.nx * L0.sd, by = y - L0.ny * L0.sd;
      const side = r2 < 0.5 ? 1 : -1;
      const ox = L0.nx * side, oy = L0.ny * side;
      if (r1 < 0.45) {
        circ(lc, bx + ox * 1.5, by + oy * 1.5, 0.62);
        lc.lineWidth = 0.32; lc.beginPath(); lc.arc(bx + ox * 1.5, by + oy * 1.5, 1.25, 0, TAU); lc.stroke();
      } else if (r1 < 0.8) {
        const a = Math.atan2(oy, ox);
        leaf(lc, bx, by, a - 0.5, 2.3, 0.45);
        leaf(lc, bx, by, a + 0.5, 2.3, 0.45);
      } else {
        circ(lc, bx + ox * 1.1, by + oy * 1.1, 0.42);
        circ(lc, bx + ox * 2.3, by + oy * 2.3, 0.3);
      }
    }
    yield;
    // material decals
    const D = [];
    G.scatter(info, 15, 6201, 8, (x, y, rng) => D.push([0, x, y, rng.next(), rng.next()]));
    G.scatter(info, 30, 6202, 10, (x, y, rng) => D.push([1, x, y, rng.next(), rng.next()]));
    G.scatter(info, 17, 6203, 6, (x, y, rng) => D.push([2, x, y, rng.next(), rng.next()]));
    G.scatter(info, 34, 6204, 14, (x, y, rng) => D.push([3, x, y, rng.next(), rng.next()]));
    G.scatter(info, 64, 6205, 14, (x, y, rng) => D.push([4, x, y, rng.next(), rng.next()]));
    G.scatter(info, 165, 6206, 40, (x, y, rng) => D.push([5, x, y, rng.next(), rng.next()]));
    const glints = [];
    for (const [kind, x, y, r1, r2] of D) {
      if ((++cnt & 15) === 0) yield;
      const rng = U.rng(((x * 73) | 0) ^ ((y * 151) | 0) ^ (kind * 977));
      const inGrid = x > gx0 && x < gx0 + (NG - 1) * ST && y > gy0 && y < gy0 + (NG - 1) * ST;
      let f;
      if (inGrid) f = look(x, y).f; else f = fval(x, y);
      const b = bandOf(f), dep = depthOf(f);
      if (kind === 5) {
        if (G.nearSpawn(x, y, 80) || r1 > 0.55 || dep < 0.12) continue;
        if (b === 3 || b === 1) dFern(lc, x, y, rng, R(0.8, 1.15, rng));
        else dRoots(lc, x, y, rng, R(0.85, 1.2, rng));
        continue;
      }
      if (dep < 0.06) continue;
      if (kind === 0) {
        if (b === 3 && r1 < 0.08 + 0.7 * U.smoothstep(0.42, 0.68, U.noise(x / 140, y / 140, 6301))) dGrass(lc, x, y, rng);
        else if (b === 1 && r1 < 0.08 + 0.55 * U.smoothstep(0.4, 0.65, U.noise(x / 120, y / 120, 6302))) dLeafS(lc, x, y, rng);
        else if (b === 2 && r1 < 0.16) dGrass(lc, x, y, rng, 0.75);
      } else if (kind === 1) {
        if (b === 2 && r1 < 0.62) dFiligree(lc, x, y, rng);
        else if (b === 3 && r1 < 0.18) dClock(lc, x, y, rng);
        else if (b === 0 && r1 < 0.5) dRipple(lc, x, y, rng, glints);
      } else if (kind === 2) {
        if (b === 1 && r1 < 0.32) { if (r2 < 0.55) dStar(lc, x, y, rng); else glints.push([0, x, y, R(0.8, 1.4, rng)]); }
        else if (b === 0 && r1 < 0.08) dLily(lc, x, y, rng);
      } else if (kind === 3) {
        if (b === 0 && r1 < 0.35) dReeds(lc, x, y, rng);
        else if (b === 1 && r1 < 0.25) dLeafS(lc, x, y, rng, 1.6);
        else if (b === 3 && r1 < 0.2) dClock(lc, x, y, rng);
      } else if (kind === 4) {
        if (b === 2 && r1 < 0.45 && dep > 0.15) dRosette(lc, x, y, rng);
      }
    }
    yield;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.8;
    ctx.drawImage(L.c, 0, 0);
    ctx.restore();
    // light glints (stars of light on violet, moon glints on ripples)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const gl of glints) {
      const [t, x, y, s] = gl;
      if (t === 0) {
        ctx.fillStyle = 'rgba(255,236,190,0.55)';
        star(ctx, x, y, 4, 2.2 * s, 0.45 * s, 0.2);
        ctx.fillStyle = 'rgba(255,250,230,0.7)';
        circ(ctx, x, y, 0.5 * s);
      } else {
        ctx.fillStyle = 'rgba(220,255,250,0.35)';
        ell(ctx, x, y, 2.6 * s, 0.45 * s);
      }
    }
    ctx.restore();
  }

  /* ---------- lace decals (all drawn in opaque ink on the lace layer) ---------- */
  function blade(c, x, y, a, L, w, bend) {
    const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
    const tx = x + ca * L, ty = y + sa * L;
    const mx = x + ca * L * 0.5 + nx * bend, my = y + sa * L * 0.5 + ny * bend;
    c.beginPath();
    c.moveTo(x - nx * w, y - ny * w);
    c.quadraticCurveTo(mx - nx * w * 0.5, my - ny * w * 0.5, tx, ty);
    c.quadraticCurveTo(mx + nx * w * 0.5, my + ny * w * 0.5, x + nx * w, y + ny * w);
    c.closePath(); c.fill();
  }
  function dGrass(c, x, y, rng, sc) {
    sc = sc || 1;
    const n = 5 + ((rng.next() * 5) | 0);
    for (let i = 0; i < n; i++) {
      const bx = x + R(-3, 3, rng) * sc, a = -Math.PI / 2 + R(-0.75, 0.75, rng);
      const L = R(3.5, 8, rng) * sc;
      blade(c, bx, y + R(-0.6, 0.6, rng), a, L, 0.42 * sc, R(-1.5, 1.5, rng) * sc);
      if (rng.next() < 0.15) { const tx = bx + Math.cos(a) * L, ty = y + Math.sin(a) * L; leaf(c, tx, ty + 0.6, a, 1.8 * sc, 0.4 * sc); }
    }
    if (rng.next() < 0.3) curl(c, x, y, -Math.PI / 2 + R(-0.4, 0.4, rng), 6 * sc, R(-5, 5, rng), 0.5 * sc, 0.08);
  }
  function dClock(c, x, y, rng) {
    // dandelion clock – a lace ring of seeds
    const hx = x + R(-2, 2, rng), hy = y - R(6, 9, rng);
    limb(c, [[x, y], [(x + hx) / 2 + R(-1, 1, rng), (y + hy) / 2], [hx, hy]], 0.5, 0.3);
    c.lineWidth = 0.25;
    const n = 14;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU;
      c.beginPath(); c.moveTo(hx + Math.cos(a) * 0.8, hy + Math.sin(a) * 0.8); c.lineTo(hx + Math.cos(a) * 2.6, hy + Math.sin(a) * 2.6); c.stroke();
      circ(c, hx + Math.cos(a) * 2.9, hy + Math.sin(a) * 2.9, 0.32);
    }
    circ(c, hx, hy, 0.7);
    leaf(c, x, y, -Math.PI / 2 - 0.9, 3.2, 0.6);
    leaf(c, x, y, -Math.PI / 2 + 0.9, 3.0, 0.6);
  }
  function dFiligree(c, x, y, rng) {
    const a = R(0, TAU, rng), L = R(9, 15, rng), t = R(4, 6.5, rng) * (rng.next() < 0.5 ? -1 : 1);
    const p1 = curlPts(x, y, a, L, t, 12), p2 = curlPts(x, y, a + Math.PI, L * R(0.7, 1, rng), t, 12);
    limb(c, p1, 0.85, 0.12, 2);
    limb(c, p2, 0.85, 0.12, 2);
    for (let k = 2; k < 8; k += 2) {
      const p = p1[k], q = p1[k + 1];
      const ta = Math.atan2(q[1] - p[1], q[0] - p[0]);
      leaf(c, p[0], p[1], ta + (k & 2 ? 1.1 : -1.1), R(1.6, 2.6, rng), 0.45);
      const p_ = p2[k], q_ = p2[k + 1];
      const tb = Math.atan2(q_[1] - p_[1], q_[0] - p_[0]);
      circ(c, p_[0] + Math.cos(tb + 1.57) * 1.2, p_[1] + Math.sin(tb + 1.57) * 1.2, 0.35);
    }
    circ(c, x, y, 0.75);
  }
  function dRosette(c, x, y, rng) {
    const n = 8 + ((rng.next() * 5) | 0), r0 = R(1.8, 2.6, rng), L = R(3, 4.5, rng), rot = rng.next() * TAU;
    c.lineWidth = 0.45;
    c.beginPath(); c.arc(x, y, r0 * 0.75, 0, TAU); c.stroke();
    circ(c, x, y, 0.6);
    for (let k = 0; k < n; k++) {
      const a = rot + (k / n) * TAU;
      leaf(c, x + Math.cos(a) * r0, y + Math.sin(a) * r0, a, L, 0.55);
      const b = a + Math.PI / n;
      circ(c, x + Math.cos(b) * (r0 + L * 0.75), y + Math.sin(b) * (r0 + L * 0.75), 0.36);
    }
    c.beginPath(); c.arc(x, y, r0 + L + 1.1, 0, TAU); c.lineWidth = 0.28; c.stroke();
  }
  function dLeafS(c, x, y, rng, sc) {
    sc = sc || 1;
    const a = rng.next() * TAU, t = rng.next();
    if (t < 0.45) {
      const L = R(3, 5, rng) * sc;
      leaf(c, x, y, a, L, L * 0.26, R(-0.5, 0.5, rng));
      limb(c, [[x, y], [x - Math.cos(a) * 1.4 * sc, y - Math.sin(a) * 1.4 * sc]], 0.35, 0.1);
    } else if (t < 0.75) {
      // maple-like
      for (let k = -2; k <= 2; k++) leaf(c, x, y, a + k * 0.62, (3.4 - Math.abs(k) * 0.6) * sc, 0.75 * sc);
      limb(c, [[x, y], [x - Math.cos(a) * 2 * sc, y - Math.sin(a) * 2 * sc]], 0.35, 0.1);
    } else {
      // little sprig
      const pts = [[x, y], [x + Math.cos(a) * 3 * sc, y + Math.sin(a) * 3 * sc], [x + Math.cos(a + 0.3) * 6 * sc, y + Math.sin(a + 0.3) * 6 * sc]];
      limb(c, pts, 0.4, 0.1);
      for (let k = 1; k < 3; k++) { leaf(c, pts[k][0], pts[k][1], a + 0.9, 1.8 * sc, 0.45 * sc); leaf(c, pts[k][0], pts[k][1], a - 0.9, 1.8 * sc, 0.45 * sc); }
    }
  }
  function dStar(c, x, y, rng) {
    const r = R(1.4, 2.6, rng);
    star(c, x, y, rng.next() < 0.6 ? 5 : 4, r, r * 0.42, rng.next());
    if (rng.next() < 0.4) { circ(c, x + R(-4, 4, rng), y + R(-4, 4, rng), 0.4); circ(c, x + R(-4, 4, rng), y + R(-4, 4, rng), 0.3); }
  }
  function dRipple(c, x, y, rng, glints) {
    const n = 2 + ((rng.next() * 2) | 0);
    c.lineWidth = 0.4;
    for (let k = 0; k < n; k++) {
      const rx = 3.5 + k * 3.2, ry = rx * 0.4;
      let a = R(0, 1, rng);
      while (a < TAU - 0.3) {
        const len = R(0.8, 2.2, rng);
        c.beginPath(); c.ellipse(x, y, rx, ry, 0, a, Math.min(TAU, a + len)); c.stroke();
        a += len + R(0.25, 0.7, rng);
      }
    }
    glints.push([1, x + R(-2, 2, rng), y - R(0, 1, rng), R(0.8, 1.4, rng)]);
  }
  function dLily(c, x, y, rng) {
    const r = R(2.8, 4, rng), a = rng.next() * TAU;
    c.beginPath(); c.moveTo(x, y); c.ellipse(x, y, r, r * 0.55, 0, a + 0.35, a + TAU - 0.35); c.closePath(); c.fill();
    if (rng.next() < 0.4) { for (let k = 0; k < 6; k++) leaf(c, x + 4, y - 1, -Math.PI / 2 + (k - 2.5) * 0.4, 2, 0.5); }
  }
  function dReeds(c, x, y, rng) {
    const n = 3 + ((rng.next() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const bx = x + R(-2.5, 2.5, rng), h = R(8, 14, rng), lean = R(-0.3, 0.3, rng);
      const pts = [[bx, y], [bx + lean * h * 0.4, y - h * 0.5], [bx + lean * h, y - h]];
      limb(c, pts, 0.45, 0.2);
      if (rng.next() < 0.6) ell(c, bx + lean * h * 0.85, y - h * 0.82, 0.7, 1.8, lean);
      else blade(c, bx, y, -Math.PI / 2 + lean * 2 + R(-0.4, 0.4, rng), h * 0.8, 0.4, R(-2, 2, rng));
    }
  }
  function dFern(c, x, y, rng, s) {
    const n = 5 + ((rng.next() * 3) | 0);
    const a0 = rng.next() * TAU;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU + R(-0.25, 0.25, rng);
      const L = R(14, 24, rng) * s;
      const turn = R(-1.2, 1.2, rng);
      const fid = rng.next() < 0.3;
      const pts = curlPts(x, y, a, L, fid ? (turn < 0 ? -6 : 6) : turn, 14);
      for (const p of pts) p[1] = y + (p[1] - y) * 0.72;
      limb(c, pts, 1.2 * s, 0.2, 2);
      if (fid) continue;
      for (let k = 2; k < pts.length - 1; k++) {
        const p = pts[k], q = pts[k + 1];
        const ta = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const pl = (1 - k / pts.length) * 4.2 * s + 0.8;
        leaf(c, p[0], p[1], ta - 1.15, pl, pl * 0.22);
        leaf(c, p[0], p[1], ta + 1.15, pl, pl * 0.22);
      }
    }
    circ(c, x, y, 1.4 * s);
  }
  function rootBranch(c, x, y, a, L, w, d, rng) {
    const pts = [[x, y]];
    let cx = x, cy = y, aa = a;
    for (let i = 0; i < 4; i++) { aa += R(-0.45, 0.45, rng); cx += Math.cos(aa) * L / 4; cy += Math.sin(aa) * L / 4 * 0.75; pts.push([cx, cy]); }
    limb(c, pts, w, 0.12, 3);
    if (d > 0) for (let k = 1; k < 4; k++) if (rng.next() < 0.55) rootBranch(c, pts[k][0], pts[k][1], aa + (rng.next() < 0.5 ? -1 : 1) * R(0.5, 1.0, rng), L * 0.5, w * 0.5, d - 1, rng);
    if (d === 0 && rng.next() < 0.4) curl(c, cx, cy, aa, 2.4, rng.next() < 0.5 ? 5 : -5, 0.3, 0.06);
  }
  function dRoots(c, x, y, rng, s) {
    const n = 3 + ((rng.next() * 3) | 0);
    const a0 = rng.next() * TAU;
    for (let i = 0; i < n; i++) rootBranch(c, x, y, a0 + (i / n) * TAU + R(-0.3, 0.3, rng), R(18, 30, rng) * s, 2.4 * s, 2, rng);
    ell(c, x, y, 2.4 * s, 1.6 * s);
  }

  /* ===================================================================================== props placement */
  function propsFor(info) {
    const out = [];
    const P = SPR.props;
    // trees
    G.scatterOwned(info, 118, 7101, (x, y, rng) => {
      const r0 = rng.next(), r1 = rng.next();
      if (G.nearSpawn(x, y, 110)) return;
      const m = matAt(x, y);
      const p = [0.4, 0.5, 0.3, 0.14][m.b];
      if (r0 > p || m.d < 0.05) return;
      out.push({ x, y, t: 'tree', spr: P.tree[Math.floor(r1 * P.tree.length) % P.tree.length], sh: 1.9, pad: 120 });
    });
    // graveyards (clustered)
    G.scatterOwned(info, 30, 7102, (x, y, rng) => {
      const zone = U.noise(x / 330, y / 330, 7190);
      const r0 = rng.next(), r1 = rng.next();
      if (zone < 0.64 || r0 > 0.42 || G.nearSpawn(x, y, 90)) return;
      const m = matAt(x, y);
      if (m.b === 3 || m.d < 0.05) return;
      out.push({ x, y, t: 'grave', spr: P.grave[Math.floor(r1 * 3) % 3], sh: 0.75, pad: 30 });
    });
    G.scatterOwned(info, 150, 7103, (x, y, rng) => {
      const zone = U.noise(x / 330, y / 330, 7190);
      const r0 = rng.next(), r1 = rng.next();
      if (G.nearSpawn(x, y, 100) || zone < 0.56 || r0 > 0.6) return;
      if (zone < 0.62) out.push({ x, y, t: 'fence', spr: P.fence[r1 < 0.5 ? 0 : 1], sh: 1.4, pad: 30 });
      else out.push({ x, y, t: 'gate', spr: P.gate[0], sh: 1.8, pad: 40 });
    });
    // farm things in the warm light
    G.scatterOwned(info, 210, 7104, (x, y, rng) => {
      const r0 = rng.next();
      if (r0 > 0.5 || G.nearSpawn(x, y, 100)) return;
      const m = matAt(x, y);
      if (m.b < 2 || m.d < 0.1) return;
      out.push({ x, y, t: 'scare', spr: P.scare[0], sh: 1.0, pad: 60 });
    });
    G.scatterOwned(info, 150, 7105, (x, y, rng) => {
      const r0 = rng.next(), r1 = rng.next();
      if (r0 > 0.3 || G.nearSpawn(x, y, 90)) return;
      const m = matAt(x, y);
      if (m.b < 2) return;
      out.push({ x, y, t: 'crow', anim: r1 * 10, sh: 0.5, pad: 40 });
    });
    G.scatterOwned(info, 74, 7106, (x, y, rng) => {
      const r0 = rng.next(), r1 = rng.next();
      if (r0 > 0.3 || G.nearSpawn(x, y, 85)) return;
      const m = matAt(x, y);
      if (m.b < 2 || m.d < 0.05) return;
      out.push({ x, y, t: 'pump', spr: P.pump[Math.floor(r1 * P.pump.length) % P.pump.length], anim: r1 * 10, sh: 0.9, pad: 30 });
    });
    G.scatterOwned(info, 135, 7107, (x, y, rng) => {
      const r0 = rng.next(), r1 = rng.next();
      if (r0 > 0.22 || G.nearSpawn(x, y, 85)) return;
      out.push({ x, y, t: 'lamp', spr: P.lamp[0], anim: r1 * 10, sh: 0.5, pad: 50 });
    });
    // standing weeds – foreground lace
    G.scatterOwned(info, 44, 7108, (x, y, rng) => {
      const r0 = rng.next(), r1 = rng.next();
      if (r0 > 0.4 || G.nearSpawn(x, y, 60)) return;
      const m = matAt(x, y);
      const v = m.b === 0 ? 1 : m.b === 1 ? 2 : r1 < 0.5 ? 0 : 1;
      out.push({ x, y, t: 'weed', spr: P.weed[v], flip: r1 > 0.5, sh: 0.6, pad: 20 });
    });
    return out;
  }

  /* ===================================================================================== icons */
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
  function drawIconArt(c, id) {
    c.fillStyle = INK; c.strokeStyle = INK; c.lineCap = 'round'; c.lineJoin = 'round';
    switch (id) {
      case 'hp-heart': {
        c.beginPath(); c.moveTo(50, 80);
        c.bezierCurveTo(22, 60, 16, 40, 30, 30); c.bezierCurveTo(40, 23, 48, 30, 50, 37);
        c.bezierCurveTo(52, 30, 60, 23, 70, 30); c.bezierCurveTo(84, 40, 78, 60, 50, 80); c.fill();
        curl(c, 50, 80, Math.PI / 2 + 0.1, 12, 6, 3, 0.4);
        glowFill(c, (p) => { p.moveTo(42, 45); p.lineTo(46, 39); p.lineTo(48, 46); p.closePath(); p.moveTo(52, 46); p.lineTo(54, 39); p.lineTo(58, 45); p.closePath(); p.moveTo(40, 52); p.quadraticCurveTo(50, 64, 60, 52); p.quadraticCurveTo(50, 57, 40, 52); p.closePath(); }, 50, 50, 14, FACE_STOPS, 0.8, 'rgba(255,150,40,1)');
        break;
      }
      case 'kills': {
        ell(c, 50, 58, 19, 18);
        ell(c, 50, 40, 7, 5);
        for (const d of [-0.8, -0.2, 0.4, 0.9]) { const pts = curlPts(50, 37, -Math.PI / 2 + d, 16, d < 0 ? -1.4 : 1.4, 6); limb(c, pts, 3, 1.2, 3); const e = pts[pts.length - 1]; leaf(c, e[0], e[1], -Math.PI / 2 + d * 1.4, 9, 2.8); }
        limb(c, [[46, 74], [40, 82], [33, 82]], 4, 0.4);
        glowFill(c, (p) => { p.moveTo(36, 54); p.quadraticCurveTo(42, 53, 47, 58); p.quadraticCurveTo(40, 60, 36, 54); p.closePath(); p.moveTo(64, 54); p.quadraticCurveTo(58, 53, 53, 58); p.quadraticCurveTo(60, 60, 64, 54); p.closePath(); }, 50, 56, 16, [[0, '#ffffe0'], [0.4, EYE_G], [1, '#7fe02a']], 1, 'rgba(170,255,70,1)');
        break;
      }
      case 'dmg': {
        iSeed(c, 52, 50, -0.75, 26, 9);
        for (let k = 0; k < 3; k++) limb(c, [[30 - k * 5, 72 - k * 2 + k * 5], [18 - k * 5, 84 - k * 2 + k * 5]], 3, 0.4);
        star(c, 72, 28, 4, 10, 2.4, 0.4);
        break;
      }
      case 'rate': {
        for (let k = 0; k < 3; k++) {
          const y = 34 + k * 16;
          iSeed(c, 62, y, 0, 13, 4.5);
          limb(c, [[44, y], [22 + k * 4, y]], 3, 0.3);
          limb(c, [[42, y - 4], [30 + k * 4, y - 5]], 1.6, 0.2);
        }
        break;
      }
      case 'multi': {
        c.beginPath(); c.moveTo(34, 42); c.quadraticCurveTo(22, 62, 30, 78); c.lineTo(70, 78); c.quadraticCurveTo(78, 62, 66, 42); c.closePath(); c.fill();
        ell(c, 50, 42, 17, 4);
        curl(c, 38, 40, -Math.PI / 2 - 0.6, 12, -6, 2.4, 0.4);
        curl(c, 62, 40, -Math.PI / 2 + 0.6, 12, 6, 2.4, 0.4);
        iSeed(c, 44, 28, -1.2, 8, 3); iSeed(c, 56, 24, -1.9, 8, 3); iSeed(c, 50, 32, -1.57, 7, 2.6);
        glowFill(c, (p) => { p.moveTo(42, 58); p.lineTo(46, 52); p.lineTo(48, 59); p.closePath(); p.moveTo(52, 59); p.lineTo(54, 52); p.lineTo(58, 58); p.closePath(); p.moveTo(41, 64); p.quadraticCurveTo(50, 72, 59, 64); p.quadraticCurveTo(50, 68, 41, 64); p.closePath(); }, 50, 60, 12, FACE_STOPS, 0.8, 'rgba(255,150,40,1)');
        break;
      }
      case 'bounce': {
        c.lineWidth = 2.6; c.setLineDash([4, 5]);
        c.beginPath(); c.moveTo(18, 72); c.quadraticCurveTo(32, 26, 48, 72); c.quadraticCurveTo(60, 42, 72, 72); c.stroke();
        c.setLineDash([]);
        c.fillRect(14, 74, 72, 4);
        iSeed(c, 76, 52, -0.9, 10, 3.6);
        star(c, 48, 76, 4, 6, 1.5, 0);
        break;
      }
      case 'lantern': {
        c.save(); c.translate(50, 62); c.scale(4.4, 4.4); drawTurnipLantern(c); c.restore();
        break;
      }
      case 'speed': {
        c.beginPath();
        c.moveTo(20, 66); c.quadraticCurveTo(26, 52, 44, 54); c.quadraticCurveTo(58, 56, 66, 40); c.lineTo(76, 42);
        c.quadraticCurveTo(80, 60, 72, 70); c.lineTo(72, 80); c.lineTo(67, 80); c.lineTo(66, 70); c.lineTo(28, 72); c.quadraticCurveTo(18, 72, 20, 66); c.fill();
        cut(c, () => { ell(c, 44, 62, 9, 3.4); });
        star(c, 30, 32, 4, 8, 1.8, 0); star(c, 46, 22, 4, 5, 1.2, 0.3); star(c, 80, 28, 4, 4.5, 1.1, 0.1);
        break;
      }
      case 'magnet': {
        c.lineWidth = 3.6; c.beginPath(); c.arc(50, 50, 20, Math.PI, 0); c.stroke();
        c.beginPath(); c.moveTo(24, 50); c.lineTo(76, 50); c.lineTo(70, 78); c.lineTo(30, 78); c.closePath(); c.fill();
        cut(c, () => { for (let k = 0; k < 4; k++) { c.fillRect(31 + k * 10, 56, 6, 2.4); c.fillRect(34 + k * 9, 66, 5, 2.4); } });
        ell(c, 42, 47, 6, 5); ell(c, 56, 46, 7, 5.4); ell(c, 50, 44, 5, 4);
        limb(c, [[56, 41], [58, 36], [61, 34]], 1.6, 0.6);
        break;
      }
      case 'hp': {
        c.beginPath(); c.moveTo(22, 50); c.lineTo(78, 50); c.quadraticCurveTo(78, 80, 50, 80); c.quadraticCurveTo(22, 80, 22, 50); c.fill();
        c.fillRect(18, 47, 64, 5);
        limb(c, [[22, 56], [14, 54], [14, 60]], 2.6, 1.6);
        limb(c, [[78, 56], [86, 54], [86, 60]], 2.6, 1.6);
        for (let k = 0; k < 3; k++) curl(c, 36 + k * 14, 44, -Math.PI / 2 + (k - 1) * 0.15, 16, k & 1 ? -5 : 5, 2.6, 0.4);
        break;
      }
      default:
        star(c, 50, 50, 5, 22, 9, 0);
    }
  }

  /* ===================================================================================== numbers */
  const NUMS = new Map();
  let numFontOk = false, numCheck = 0;
  function numSprite(value, crit) {
    const key = value + (crit ? 'c' : 'n');
    let s = NUMS.get(key);
    if (s) return s;
    if (NUMS.size > 300) NUMS.clear();
    const fam = numFontOk ? 'Cinzel, "Times New Roman", serif' : '"Times New Roman", Georgia, serif';
    const px = Math.round((crit ? 12.5 : 8.6) * K);
    const txt = String(value);
    const m = U.canvas(4, 4).ctx;
    m.font = `700 ${px}px ${fam}`;
    const w = m.measureText(txt).width;
    const pad = Math.ceil(px * 0.45);
    const { c, ctx } = U.canvas(w + pad * 2, px * 1.2 + pad * 2);
    ctx.font = `700 ${px}px ${fam}`;
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    const bx = pad, by = pad + px * 0.95;
    ctx.shadowColor = crit ? 'rgba(255,140,40,0.95)' : 'rgba(255,190,110,0.7)';
    ctx.shadowBlur = px * (crit ? 0.5 : 0.35);
    ctx.strokeStyle = INK;
    ctx.lineWidth = px * 0.24;
    ctx.strokeText(txt, bx, by);
    ctx.shadowBlur = 0;
    const g = ctx.createLinearGradient(0, by - px * 0.8, 0, by);
    if (crit) { g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#ffe07a'); g.addColorStop(1, '#ff8a22'); }
    else { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffe2b0'); }
    ctx.fillStyle = g;
    ctx.fillText(txt, bx, by);
    s = { c, ax: c.width / 2, ay: by };
    NUMS.set(key, s);
    return s;
  }

  /* ===================================================================================== theatre frame */
  let FRAME = null;
  function buildFrame(W, H) {
    const { c, ctx } = U.canvas(W, H);
    // vignette
    const mx = Math.max(W, H);
    const v = ctx.createRadialGradient(W / 2, H * 0.52, mx * 0.28, W / 2, H * 0.52, mx * 0.72);
    v.addColorStop(0, 'rgba(14,4,22,0)'); v.addColorStop(0.6, 'rgba(14,4,22,0.22)'); v.addColorStop(1, 'rgba(14,4,22,0.7)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    // side curtains with dark velvet sheen
    const cw = W * 0.034;
    const drawCurtain = (flip) => {
      ctx.save();
      if (flip) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(cw * 1.5, 0);
      ctx.bezierCurveTo(cw * 0.9, H * 0.18, cw * 0.55, H * 0.3, cw * 0.7, H * 0.42);
      ctx.bezierCurveTo(cw * 0.9, H * 0.5, cw * 0.55, H * 0.75, cw * 1.05, H);
      ctx.lineTo(0, H); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, cw * 1.4, 0);
      g.addColorStop(0, '#0b0510'); g.addColorStop(0.3, '#2a0a20'); g.addColorStop(0.45, '#0b0510'); g.addColorStop(0.7, '#240818'); g.addColorStop(1, '#0b0510');
      ctx.fillStyle = g; ctx.fill();
      // tie-back tassel
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.ellipse(cw * 0.75, H * 0.43, cw * 0.32, H * 0.012, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cw * 0.82, H * 0.43); ctx.lineTo(cw * 1.1, H * 0.49); ctx.lineTo(cw * 0.8, H * 0.49); ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    drawCurtain(false); drawCurtain(true);
    // top valance (scalloped) with tassels
    const vh = H * 0.032, n = 16, sw = W / n;
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, vh);
    for (let i = n; i > 0; i--) { const x1 = (i - 1) * sw; ctx.quadraticCurveTo(x1 + sw / 2, vh * 2.0, x1, vh); }
    ctx.closePath(); ctx.fill();
    for (let i = 1; i < n; i++) {
      const x = i * sw;
      ctx.fillRect(x - 0.6, vh, 1.2, vh * 0.55);
      ctx.beginPath(); ctx.moveTo(x, vh * 1.45); ctx.lineTo(x + vh * 0.22, vh * 1.95); ctx.lineTo(x - vh * 0.22, vh * 1.95); ctx.closePath(); ctx.fill();
    }
    // stage lip at the bottom
    const sg = ctx.createLinearGradient(0, H * 0.94, 0, H);
    sg.addColorStop(0, 'rgba(11,5,16,0)'); sg.addColorStop(1, 'rgba(11,5,16,0.8)');
    ctx.fillStyle = sg; ctx.fillRect(0, H * 0.94, W, H * 0.06);
    FRAME = { W, H, c };
  }

  /* ===================================================================================== CSS */
  const svgURL = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  function scallopPath(w, n, y0, dy) {
    let p = `M0 0H${w}V${y0}`;
    const sw = w / n;
    for (let i = n; i > 0; i--) { const x1 = (i - 1) * sw; p += `Q${(x1 + sw / 2).toFixed(1)} ${y0 + dy} ${x1.toFixed(1)} ${y0}`; }
    return p + 'Z';
  }
  const CURTAIN_SVG = svgURL(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300' preserveAspectRatio='none'>` +
    `<path fill='#0b0510' d='${scallopPath(200, 7, 13, 11)}'/>` +
    `<path fill='#0b0510' d='M0 0H30C22 40 10 80 14 112C18 130 8 140 9 150C6 200 3 260 0 300Z'/>` +
    `<path fill='#0b0510' d='M200 0H170C178 40 190 80 186 112C182 130 192 140 191 150C194 200 197 260 200 300Z'/></svg>`);
  const SCROLL_SVG = svgURL(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'>` +
    `<path d='M58 15C46 15 40 6 30 7C20 8 18 20 26 21C32 22 33 14 28 13' fill='none' stroke='#0b0510' stroke-width='3.2' stroke-linecap='round'/>` +
    `<path d='M50 15C44 18 40 25 33 25' fill='none' stroke='#0b0510' stroke-width='2' stroke-linecap='round'/>` +
    `<path d='M40 9C38 4 42 1 46 2C43 4 42 6 40 9Z' fill='#0b0510'/><circle cx='12' cy='15' r='2.4' fill='#0b0510'/><circle cx='5' cy='15' r='1.5' fill='#0b0510'/></svg>`);
  const GLOWTXT = '0 0 2px #0b0510, 0 0 3px #0b0510, 0 0 8px rgba(255,150,60,.85), 0 0 18px rgba(255,110,40,.5)';
  const CSS = `
body.style-shadow { --ink:#0b0510; --gold:#ffd98a; --hair:rgba(255,196,120,.55); }
body.style-shadow #hud { padding: 12px 64px; font-family: 'Cormorant Garamond', Georgia, serif; color: #ffe9c4; }
body.style-shadow #hud .xp { height: 16px; background: var(--ink); border: 0; border-radius: 8px; overflow: hidden;
  box-shadow: 0 0 0 2px var(--ink), 0 0 0 3px var(--hair), 0 0 0 5px var(--ink), 0 0 18px 3px rgba(255,140,60,.35); }
body.style-shadow #hud .xp-fill { top: 5px; bottom: 5px; left: 4px; border-radius: 3px; background: linear-gradient(90deg, #ff5a1f, #ffb347 55%, #fff4cc);
  box-shadow: 0 0 6px #ffc46a, 0 0 14px rgba(255,120,40,.9); }
body.style-shadow #hud .lvl { right: 0; top: 0; bottom: 0; transform: none; display: flex; align-items: center; padding: 0 12px 0 14px; background: var(--ink);
  border-radius: 8px 8px 8px 18px; font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 12px; letter-spacing: 1.5px; color: var(--gold); text-shadow: 0 0 6px rgba(255,150,60,.9); }
body.style-shadow #hud .topline { margin-top: 12px; }
body.style-shadow #hud .hp { gap: 10px; }
body.style-shadow #hud .hp-icon, body.style-shadow #hud .kills-icon { width: 38px; height: 38px; filter: drop-shadow(0 0 6px rgba(255,150,60,.55)); }
body.style-shadow #hud .hp-bar { width: 230px; height: 18px; background: var(--ink); border: 0; border-radius: 9px;
  box-shadow: 0 0 0 2px var(--ink), 0 0 0 3px var(--hair), 0 0 0 5px var(--ink), 0 0 16px 2px rgba(255,80,60,.35); }
body.style-shadow #hud .hp-fill { top: 6px; bottom: 6px; border-radius: 3px; background: linear-gradient(90deg, #a0103a, #ff4a36 55%, #ffc39a);
  box-shadow: 0 0 6px #ff7a5a, 0 0 14px rgba(255,60,50,.9); }
body.style-shadow #hud .hp-text { font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 16px; color: #fff0d2; text-shadow: ${GLOWTXT}; }
body.style-shadow #hud .clock { position: relative; background: var(--ink); padding: 4px 30px 6px; margin-top: 0; border-radius: 6px 6px 40px 40px / 6px 6px 22px 22px;
  box-shadow: inset 0 0 0 1px var(--hair), 0 0 0 3px var(--ink), 0 0 22px 4px rgba(255,140,60,.35); }
body.style-shadow #hud .clock::before, body.style-shadow #hud .clock::after { content: ''; position: absolute; top: 10px; width: 58px; height: 29px;
  background: ${SCROLL_SVG} no-repeat center / contain; filter: drop-shadow(0 0 3px rgba(255,170,80,.95)); }
body.style-shadow #hud .clock::before { right: 100%; margin-right: -4px; }
body.style-shadow #hud .clock::after { left: 100%; margin-left: -4px; transform: scaleX(-1); }
body.style-shadow #hud .clock-time { font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 34px; line-height: 1.05; letter-spacing: 3px; color: #ffe4a6;
  text-shadow: 0 0 6px rgba(255,170,70,1), 0 0 16px rgba(255,110,40,.8); }
body.style-shadow #hud .clock-label { font-family: 'IM Fell English SC', Georgia, serif; font-size: 13px; letter-spacing: 3px; opacity: 1; text-transform: none; color: #f4c99a;
  border-top: 1px solid var(--hair); padding-top: 1px; }
body.style-shadow #hud .kills { font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 22px; color: #fff0d2; text-shadow: none; gap: 8px; }
body.style-shadow #hud .kills-num { background: var(--ink); padding: 1px 16px 2px; min-width: 70px; text-align: center; border-radius: 16px; color: #ffe4a6;
  box-shadow: inset 0 0 0 1px var(--hair), 0 0 14px 2px rgba(255,140,60,.35); text-shadow: 0 0 8px rgba(255,150,60,.9); }
body.style-shadow.hurt #hud .hp-bar { box-shadow: 0 0 0 2px var(--ink), 0 0 0 3px #ff8a6a, 0 0 0 5px var(--ink), 0 0 26px 6px rgba(255,60,40,.8); }
body.style-shadow #stylebar { background: var(--ink); color: #f4d6b0; border: 1px solid var(--hair); box-shadow: 0 0 18px rgba(255,140,60,.35); font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14px; }
body.style-shadow #stylebar .style-name { font-family: 'Cinzel', Georgia, serif; font-weight: 700; font-size: 17px; color: var(--gold); text-shadow: 0 0 8px rgba(255,150,60,.9); }
body.style-shadow #stylebar .style-family { font-family: 'IM Fell English SC', Georgia, serif; opacity: .85; letter-spacing: 2px; font-size: 12px; text-transform: none; }
body.style-shadow #stylebar .auto.on { color: #ffcf6a; }
body.style-shadow #levelup { background: radial-gradient(ellipse at 50% 48%, rgba(255,140,60,.28), rgba(40,8,30,.7) 45%, rgba(8,2,12,.92) 80%); gap: 24px; }
body.style-shadow #levelup .lu-title { font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 68px; letter-spacing: 4px; color: #ffe6ad;
  text-shadow: 0 0 3px #0b0510, 0 0 12px rgba(255,170,70,1), 0 0 34px rgba(255,100,40,.8); }
body.style-shadow #levelup .lu-cards { gap: 28px; }
body.style-shadow #levelup .card { width: 228px; min-height: 318px; padding: 40px 30px 50px; gap: 8px; color: var(--ink); overflow: hidden;
  background: radial-gradient(ellipse 80% 70% at 50% 52%, #fff2c8 0%, #ffc45e 30%, #f0743a 60%, #b02c48 84%, #4a1438 100%);
  border: 3px solid var(--ink); border-radius: 12px 12px 6px 6px; box-shadow: 0 0 0 2px var(--hair), 0 0 0 6px var(--ink), 0 0 34px 6px rgba(255,130,50,.4);
  transition: transform .14s, box-shadow .14s; }
body.style-shadow #levelup .card::before { content: ''; position: absolute; inset: 0; background: ${CURTAIN_SVG} no-repeat 0 0 / 100% 100%; pointer-events: none; }
body.style-shadow #levelup .card::after { content: ''; position: absolute; left: -2px; right: -2px; bottom: -2px; height: 40px; background: var(--ink);
  border-radius: 50% 50% 0 0 / 14px 14px 0 0; pointer-events: none; }
body.style-shadow #levelup .card > * { position: relative; z-index: 1; }
body.style-shadow #levelup .card:hover { transform: translateY(-8px); box-shadow: 0 0 0 2px #ffd98a, 0 0 0 6px var(--ink), 0 0 48px 12px rgba(255,150,60,.65); }
body.style-shadow #levelup .card-icon { width: 116px; height: 116px; margin-top: 0; filter: drop-shadow(0 0 10px rgba(255,220,150,.7)); }
body.style-shadow #levelup .card-name { font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 19px; line-height: 1.15; color: var(--ink); letter-spacing: .5px; }
body.style-shadow #levelup .card-desc { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 700; font-size: 20px; line-height: 1.15; opacity: 1; color: #22081a; }
body.style-shadow #levelup .card-key { position: absolute; z-index: 2; top: auto; bottom: 8px; left: 0; right: 0; text-align: center; font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 20px;
  opacity: 1; color: #ffe2a0; text-shadow: 0 0 8px rgba(255,150,60,1); }
body.style-shadow #levelup .lu-hint { font-family: 'IM Fell English SC', Georgia, serif; font-size: 17px; letter-spacing: 2px; color: #f4c99a; opacity: .95; text-shadow: 0 0 8px rgba(255,120,40,.6); }
body.style-shadow #gameover { background: radial-gradient(ellipse at 50% 45%, rgba(160,40,60,.35), rgba(8,2,12,.92) 75%); }
body.style-shadow #gameover .go-title { font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 62px; color: #ffe0a0; text-shadow: 0 0 12px rgba(255,150,60,1), 0 0 34px rgba(255,80,40,.7); }
body.style-shadow #gameover .go-stats { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 22px; color: #f8dcb8; }
body.style-shadow #gameover .go-hint { font-family: 'IM Fell English SC', Georgia, serif; color: #f4c99a; letter-spacing: 2px; }
body.style-shadow #pausebox { font-family: 'Cinzel', Georgia, serif; font-weight: 900; font-size: 56px; color: #ffe0a0; text-shadow: 0 0 3px #0b0510, 0 0 14px rgba(255,150,60,1); }
`;

  /* ===================================================================================== effects state */
  let hurtAt = -1e9;

  function addEmbers(game, x, y, z, n, spd, kind, opts) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = spd * (0.4 + Math.random() * 0.8);
      game.addParticle(Object.assign({ x, y, z: z + Math.random() * 4, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 20 + Math.random() * 30, grav: -18, kind: kind || 'ember', life: 0.6 + Math.random() * 0.7, size: 0.6 + Math.random() * 0.6, drag: 2.2 }, opts || {}));
    }
  }
  function addScraps(game, x, y, z, n, spd, big) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = spd * (0.5 + Math.random() * 0.8);
      game.addParticle({ x, y, z: z * (0.4 + Math.random() * 0.8), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 50, grav: 160, kind: 'scrap', life: 0.7 + Math.random() * 0.5, size: (big ? 1.4 : 0.9) + Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16, drag: 1.6 });
    }
  }

  /* ===================================================================================== the style */
  Styles.register({
    id: 'shadow',
    name: 'Schattentheater',
    family: 'Silhouette',
    description: 'Ein hinterleuchtetes Papiertheater: Scherenschnitt-Figuren aus tiefem Schwarz vor glühenden Abendfarben – nur Kürbisgesichter und Geisteraugen leuchten.',
    groundColor: '#e07a3a',
    groundResMax: 2.5,
    chunkSize: 256,
    fonts: ['Cinzel:wght@400;700;900', 'IM+Fell+English+SC', 'Cormorant+Garamond:wght@500;600;700'],
    css: CSS,

    init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = (window.__forceH || window.innerHeight || 900) * dpr;
      K = U.clamp(Math.round((h / 360) * 1.3 * 4) / 4, 2.5, 5);
      FILTER = hasFilter();
      if (!GRAIN) buildGrain();
      buildSprites();
    },

    renderGroundChunk(ctx, info) { return renderGround(ctx, info); },
    propsForChunk(info) { return propsFor(info); },

    drawProp(ctx, p, view) {
      base(view);
      let spr = p.spr;
      if (p.t === 'crow') spr = SPR.props.crow[Math.floor(view.rt * 0.8 + p.anim) % 4 === 0 ? 1 : 0];
      if (p.t === 'tree' || p.t === 'scare') {
        // a slow hinge sway – puppets on wires
        const a = Math.sin(view.rt * 0.7 + p.x * 0.05) * (p.t === 'tree' ? 0.012 : 0.02);
        blitRot(ctx, spr, p.x, p.y, a, 1);
      } else if (p.t === 'weed') {
        blitRS(ctx, spr, p.x, p.y, Math.sin(view.rt * 1.3 + p.x * 0.1) * 0.05, p.flip ? -1 : 1, 1);
      } else blit(ctx, spr, p.x, p.y);
      if (spr.glow) {
        ctx.globalCompositeOperation = 'lighter';
        for (const g of spr.glow) {
          const fl = 0.75 + 0.15 * Math.sin(view.rt * 9 + p.anim * 3) + 0.1 * Math.sin(view.rt * 23 + p.anim);
          ctx.globalAlpha = fl * 0.75;
          const s = g[2] / 10;
          blitS(ctx, SPR.gGold, p.x + g[0], p.y + g[1], s, s);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    },

    drawShadow(ctx, o, view) {
      base(view);
      if (o.kind === 'prop') {
        if (o.sh) blitS(ctx, SPR.contact, o.x, o.y + 0.5, o.sh * 1.2, o.sh * 0.35);
        return;
      }
      if (o.kind === 'enemy') {
        if (o.dying) return;
        const k = o.spawnT < 1 ? o.spawnT : 1;
        if (o.type === 'ghost') { blitS(ctx, SPR.contact, o.x, o.y + 0.5, 0.45 * k, 0.16 * k); return; }
        const s = o.type === 'colossus' ? 1.9 : 0.85;
        blitS(ctx, SPR.contact, o.x, o.y + 0.6, s * k, s * 0.3 * k);
        return;
      }
      // Jack: theatre follow-spot pool of light + contact shadow
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 + 0.05 * Math.sin(view.rt * 2.2);
      blitS(ctx, SPR.pool, o.x, o.y - 6, 1.1, 0.62);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      blitS(ctx, SPR.contact, o.x, o.y + 0.6, 0.8, 0.26);
    },

    drawGem(ctx, g, view) {
      base(view);
      const bob = Math.sin(view.rt * 3 + g.seed * 20) * 0.8;
      const pulse = 0.75 + 0.25 * Math.sin(view.rt * 5 + g.seed * 13);
      const y = g.y - 2 + bob - (g.pop > 0 ? g.pop * 5 : 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = pulse * 0.9;
      if (g.big) blitS(ctx, SPR.gGold, g.x, y - 2, 0.9, 0.9);
      else blitS(ctx, SPR.gCyan, g.x, y - 1, 0.75, 0.75);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      const s = g.pop > 0 ? 1 + g.pop * 0.6 : 1;
      if (g.big) {
        blitRot(ctx, SPR.flare, g.x, y - 2, view.rt * 0.8, 0.55 * pulse);
        blitS(ctx, SPR.gemBig, g.x, y, s, s);
      } else blitS(ctx, SPR.gem, g.x, y, s, s);
    },

    drawEnemy(ctx, e, view) {
      base(view);
      const set = SPR[e.type];
      if (!set) return;
      const fi = e.facing < 0 ? 1 : 0;
      const isG = e.type === 'ghost', isC = e.type === 'colossus';
      let frames, rims;
      if (e.type === 'creeper') { const v = e.seed < 0.5 ? 0 : 1; frames = set.n[v][fi]; rims = set.rim[v][fi]; }
      else { frames = set.n[fi]; rims = set.rim[fi]; }
      // ---- death: crumble into paper scraps with glowing edges
      if (e.dying) {
        const t = e.deathT;
        if (t < 0.14) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.9;
          blit(ctx, rims[0], e.x, e.y);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          blit(ctx, frames[0], e.x, e.y);
          return;
        }
        const u = (t - 0.14) / 0.86;
        const sh = set.sh[fi];
        const big = isC ? 1.8 : 1;
        ctx.globalAlpha = Math.max(0, 1 - u * u);
        for (let i = 0; i < sh.length; i++) {
          const p = sh[i];
          const d = (2 + 10 * U.ease.outQuad(u)) * big;
          const x = e.x + p.dx * d, y = e.y - p.off + p.dy * d * 0.7 - 5 * big * u + 22 * u * u;
          blitRot(ctx, p, x, y, (i & 1 ? 1 : -1) * u * (1.4 + (i % 3) * 0.4), 1 - u * 0.3);
        }
        ctx.globalAlpha = 1;
        return;
      }
      let fr, wob = 0, y = e.y;
      if (isG) {
        fr = Math.floor(view.rt * 6 + e.seed * 9) & 3;
        y -= 2.2 + Math.sin(view.rt * 3.1 + e.seed * 20) * 1.2;
        wob = Math.sin(view.rt * 2.3 + e.seed * 9) * 0.06;
      } else if (isC) {
        fr = Math.floor(e.anim * 3.6) % 6;
        wob = Math.sin((e.anim * 3.6 / 6) * TAU) * 0.035;
      } else {
        fr = Math.floor(e.anim * 4.8 + e.seed * 6) % 6;
        wob = Math.sin((e.anim * 4.8 / 6) * TAU + e.seed * 6) * 0.075;
      }
      const spr = frames[fr];
      if (e.facing < 0) wob = -wob;
      // ---- spawn: rises up like a puppet on a stick from a slot in the stage
      if (e.spawnT < 1) {
        const t = e.spawnT;
        const h = isC ? 50 : isG ? 22 : 26;
        const k = U.ease.outBack(Math.min(1, t * 1.15));
        const dy = (1 - k) * h * 0.95;
        const sw = Math.sin(t * 14) * (1 - t) * 0.25;
        // slot glow
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - t) * 0.8;
        blitS(ctx, SPR.gWarm, e.x, e.y, (isC ? 1.6 : 0.8), (isC ? 0.4 : 0.2));
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.beginPath(); ctx.rect(e.x - 40, e.y - 90, 80, 90.6); ctx.clip();
        if (isG) ctx.globalAlpha = 0.3 + 0.7 * t;
        blitRot(ctx, spr, e.x, y + dy, wob + sw, 1);
        ctx.restore();
        ctx.globalAlpha = 1;
        if (!isG) {
          ctx.fillStyle = INK;
          ctx.globalAlpha = Math.min(1, (1 - t) * 3);
          const top = y + dy - h * 0.45;
          ctx.fillRect(e.x - 0.35, top, 0.7, Math.max(0, e.y + 5 - top));
          ctx.globalAlpha = 1;
        }
        return;
      }
      // ---- hit: rim flash of light (capped)
      const ra = isG ? e.flash * 0.9 : Math.max(0.2, Math.min(isC ? 0.7 : 0.9, e.flash * 1.1));
      if (ra > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = ra;
        blitRot(ctx, rims[fr], e.x, y, wob, 1);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      blitRot(ctx, spr, e.x, y, wob, 1);
      if (isC) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.45 + 0.25 * Math.sin(view.rt * 4 + e.seed * 10);
        blitS(ctx, SPR.gPink, e.x + (e.facing < 0 ? -1.5 : 1.5), e.y - 29, 0.9, 0.9);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    },

    drawPlayer(ctx, p, view) {
      base(view);
      const rt = view.rt;
      const fi = p.facing < 0 ? 1 : 0;
      const J = SPR.jack;
      let spr, rim, hr;
      if (p.moving) { const i = Math.floor(p.anim * 1.5) % 6; spr = J.walk[fi][i]; rim = J.walkR[fi][i]; hr = J.walkH[fi][i]; }
      else { const i = Math.floor(rt * 2.6) & 3; spr = J.idle[fi][i]; rim = J.idleR[fi][i]; hr = J.idleH[fi][i]; }
      const since = (performance.now() - hurtAt) / 1000;
      const blink = p.iframes > 0 && since < 1 && (Math.floor(since * 14) & 1) === 1;
      if (p.dashT > 0) {
        const k = p.dashT / 0.2;
        for (let i = 3; i >= 1; i--) {
          ctx.globalAlpha = 0.4 * k / i;
          blit(ctx, J.dash[fi], p.x - p.dashX * i * 6, p.y - p.dashY * i * 6);
        }
        ctx.globalAlpha = 1;
      }
      // warm aura rim – Jack is always lit
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.75;
      blit(ctx, rim, p.x, p.y);
      if (p.hurtT > 0) { ctx.globalAlpha = Math.min(0.9, p.hurtT); blit(ctx, hr, p.x, p.y); }
      if (p.levelT > 0) { ctx.globalAlpha = Math.min(1, p.levelT * 1.5); blitRot(ctx, SPR.flare, p.x, p.y - 16, rt * 0.6, 2.2 + (1 - p.levelT)); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = blink ? 0.45 : 1;
      blit(ctx, spr, p.x, p.y);
      ctx.globalAlpha = 1;
      // face glow halo (flickering candle inside)
      const fl = 0.8 + 0.12 * Math.sin(rt * 11) + 0.08 * Math.sin(rt * 27);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = fl * 0.85;
      blitS(ctx, SPR.gFace, p.x + (fi ? -1.6 : 1.6), p.y - 22.5, 0.8, 0.75);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    drawOrbital(ctx, o, view) {
      base(view);
      const y = o.y + Math.sin(view.rt * 4 + o.idx) * 0.6;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.7 + 0.15 * Math.sin(view.rt * 10 + o.idx * 2);
      blitS(ctx, SPR.gGold, o.x, y - 6.5, 1.0, 1.0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      blitRot(ctx, SPR.lantern, o.x, y, Math.sin(view.rt * 3 + o.idx) * 0.12, 1);
    },

    drawProjectile(ctx, pr, view) {
      base(view);
      const a = Math.atan2(pr.vy, pr.vx);
      const k = Math.min(1, pr.age * 8);
      ctx.globalCompositeOperation = 'lighter';
      blitRot(ctx, SPR.trail, pr.x, pr.y, a, 0.4 + 0.6 * k);
      ctx.globalAlpha = 0.7;
      blitS(ctx, SPR.ember, pr.x, pr.y, 1.4, 1.4);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      blitRot(ctx, SPR.seed, pr.x, pr.y, a + Math.sin(pr.spin) * 0.6, 1);
    },

    drawParticle(ctx, pt, view) {
      base(view);
      const life = pt.life / pt.max, age = 1 - life;
      const y = pt.y - pt.z;
      switch (pt.kind) {
        case 'scrap': {
          ctx.globalAlpha = life < 0.3 ? life / 0.3 : 1;
          blitRS(ctx, SPR.scrap[(pt.seed * 5) | 0], pt.x, y, pt.rot, pt.size, pt.size * (0.5 + 0.5 * Math.abs(Math.cos(pt.rot * 1.7))));
          break;
        }
        case 'wisp': {
          ctx.globalAlpha = life * 0.9;
          blitRot(ctx, SPR.wisp, pt.x, y, pt.rot, pt.size);
          break;
        }
        case 'spark': {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = life;
          blitRot(ctx, SPR.streak, pt.x, y, Math.atan2(pt.vy - pt.vz * 0.5, pt.vx), pt.size);
          break;
        }
        case 'flare': {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = life < 0.5 ? life * 2 : 1;
          const s = pt.size * (0.5 + U.ease.outQuad(Math.min(1, age * 2.2)) * 0.7);
          blitRot(ctx, SPR.flare, pt.x, y, pt.rot, s);
          break;
        }
        case 'ring': {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = life < 0.5 ? life * 2 : 1;
          blitRot(ctx, SPR.ring, pt.x, y, pt.rot, pt.size * (0.4 + U.ease.outQuad(age) * 1.2));
          break;
        }
        default: {
          // embers (warm / cold / pink)
          ctx.globalCompositeOperation = 'lighter';
          const fl = 0.7 + 0.3 * Math.sin(view.rt * 30 + pt.seed * 50);
          ctx.globalAlpha = Math.min(1, life * 1.6) * fl;
          const sp = pt.cold ? SPR.emberC : pt.pink ? SPR.emberP : SPR.ember;
          blitS(ctx, sp, pt.x, y, pt.size, pt.size);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },

    drawNumber(ctx, n, view) {
      base(view);
      if (!numFontOk && (numCheck++ & 31) === 0 && document.fonts && document.fonts.check('700 20px "Cinzel"')) { numFontOk = true; NUMS.clear(); }
      const spr = numSprite(n.value, n.crit);
      const age = n.max - n.life;
      const k = age < 0.08 ? 1 + (1 - age / 0.08) * 0.6 : 1;
      ctx.globalAlpha = n.life < 0.25 ? n.life / 0.25 : 1;
      blitS(ctx, spr, n.x, n.y, k, k);
      ctx.globalAlpha = 1;
    },

    drawScreenOverlay(ctx, view) {
      if (!FRAME || FRAME.W !== view.W || FRAME.H !== view.H) buildFrame(view.W, view.H);
      ctx.drawImage(FRAME.c, 0, 0);
    },

    drawIcon(ctx, id, size) {
      ctx.save();
      ctx.scale(size / 100, size / 100);
      const prevK = K;
      K = size / 100 * 1.2;
      iconDisc(ctx);
      ctx.translate(50, 50); ctx.scale(0.86, 0.86); ctx.translate(-50, -50);
      drawIconArt(ctx, id);
      K = prevK;
      ctx.restore();
    },

    /* ---------- hooks ---------- */
    onHit(game, e, src) {
      const y = e.y, z = e.r * (e.type === 'colossus' ? 1.6 : 1.2);
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * TAU, s = 60 + Math.random() * 60;
        game.addParticle({ x: e.x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 30 + Math.random() * 40, grav: 120, kind: 'spark', life: 0.22 + Math.random() * 0.1, size: 0.7 + Math.random() * 0.4, drag: 3 });
      }
      game.addParticle({ x: e.x, y, z, kind: 'flare', life: 0.16, size: e.type === 'colossus' ? 1.1 : 0.7, rot: Math.random() * TAU, drag: 0, grav: 0 });
      if (src === 'lantern') addEmbers(game, e.x, y, z, 2, 30);
    },
    onKill(game, e) {
      const big = e.type === 'colossus', ghost = e.type === 'ghost';
      if (ghost) {
        for (let i = 0; i < 5; i++) game.addParticle({ x: e.x + (Math.random() - 0.5) * 8, y: e.y, z: 8 + Math.random() * 10, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 10, vz: 18 + Math.random() * 16, grav: -6, kind: 'wisp', life: 0.7 + Math.random() * 0.4, size: 0.8 + Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 3, drag: 2 });
        addEmbers(game, e.x, e.y, 12, 5, 40, 'ember', { cold: true });
      } else {
        addScraps(game, e.x, e.y, e.r * 1.4, big ? 14 : 6, big ? 70 : 50, big);
        addEmbers(game, e.x, e.y, e.r, big ? 14 : 5, big ? 60 : 40, 'ember', big ? { pink: Math.random() < 0.5 } : null);
        if (big) addEmbers(game, e.x, e.y, 26, 8, 50, 'ember', { pink: true });
      }
      game.addParticle({ x: e.x, y: e.y, z: e.r * (big ? 1.6 : 1.1), kind: 'flare', life: 0.26, size: big ? 2.4 : 1.1, rot: Math.random() * TAU, drag: 0 });
    },
    onHurt(game, p) {
      hurtAt = performance.now();
      game.addParticle({ x: p.x, y: p.y, z: 14, kind: 'flare', life: 0.25, size: 1.6, rot: Math.random() * TAU, drag: 0 });
      addScraps(game, p.x, p.y, 16, 4, 50, false);
      addEmbers(game, p.x, p.y, 16, 6, 50);
    },
    onPickup(game, g) {
      const p = game.player;
      game.addParticle({ x: p.x + (Math.random() - 0.5) * 8, y: p.y, z: 12 + Math.random() * 8, vz: 18, kind: 'ember', life: 0.4, size: g.big ? 1.6 : 0.9, drag: 3, cold: !g.big });
    },
    onShoot(game, pr) {
      if (Math.random() < 0.35) game.addParticle({ x: pr.x, y: pr.y, z: 0, vx: pr.vx * 0.05, vy: pr.vy * 0.05, kind: 'ember', life: 0.3, size: 0.6, drag: 4 });
    },
    onDash(game, p) {
      for (let i = 0; i < 6; i++) game.addParticle({ x: p.x - p.dashX * i * 4, y: p.y, z: 6 + Math.random() * 12, vx: -p.dashX * 30 + (Math.random() - 0.5) * 20, vy: -p.dashY * 30, vz: 10, grav: -10, kind: 'ember', life: 0.5, size: 0.8, drag: 3 });
    },
    onLevelUp(game, p) {
      game.addParticle({ x: p.x, y: p.y, z: 14, kind: 'ring', life: 0.8, size: 1.6, rot: 0, drag: 0 });
      game.addParticle({ x: p.x, y: p.y, z: 16, kind: 'flare', life: 0.5, size: 2.8, rot: Math.random(), drag: 0 });
      addEmbers(game, p.x, p.y, 10, 14, 80);
    },
    onDeath(game, p) {
      addScraps(game, p.x, p.y, 16, 16, 80, true);
      addEmbers(game, p.x, p.y, 18, 20, 80);
    },
  });
})();
